// js/tabs/progress.js
// The "📈 Πρόοδος" tab — cross-client roster + per-client history, δίπλα στο "💬 Μηνύματα" στο
// αριστερό μενού (swTab(10)). Ενοποιεί σήματα που ζούσαν σκόρπια σε Αρχική/Ραντεβού/Μηνύματα σε
// ΕΝΑ σημείο, χωρίς να τα ξαναϋπολογίζει: buildClientProgressHtml (score/streak/πυλώνες/sparkline
// — ήδη ζωγραφισμένο στο per-client "📝 Ραντεβού" tab) καλείται ΑΥΤΟΥΣΙΟ εδώ, ώστε το νούμερο να
// μην μπορεί ποτέ να αποκλίνει ανάμεσα στα δύο σημεία (βλ. "two-lists-diverge" gotcha).
// Phase 1 (2026-09-15, μετά από mockup στη συζήτηση): λίστα πελατών + βασικό ιστορικό ανά πελάτη.
// Phase 2 (2026-09-15): γράφημα τήρησης 10 εβδομάδων ανά πυλώνα, δείκτες ραντεβού πάνω στο γράφημα,
// weak-pillar callout, ✉️ shortcut στα Μηνύματα (roster row). Phase 3 (όχι ακόμα):
// c.lastDietologistContact (νέο πεδίο δεδομένων) + μίκρυνση του παλιού per-client panel.
// Loads στο group tabs/, ΜΕΤΑ το appointments/appointments.js (ck* helpers, buildClientProgressHtml
// ζει στο client-editor/form-controls.js) και το tabs/messages.js (collectAllClientMessages).

// Ίδια κατώφλια με το homeLowAdherence (tabs/home-diets.js) — ΔΕΝ ξαναχρησιμοποιούμε απευθείας
// εκείνη τη συνάρτηση εδώ γιατί κάνει slice(0,3) για την κάρτα της Αρχικής· η λίστα/badge εδώ
// χρειάζεται το πραγματικό σύνολο, όχι μόνο τους πρώτους 3.
var PROGRESS_LOW_MAX = 45;
var PROGRESS_LOW_FRESH_DAYS = 3;
var PROGRESS_EXPIRING_DAYS = 7; // ίδιο παράθυρο με το homePlansExpiringSoon()

// Ημέρες μέχρι να χρειαστεί νέο πλάνο (null αν δεν υπάρχει ενεργό πλάνο) — ίδιος υπολογισμός με το
// homePlansExpiringSoon(), απλά ανά πελάτη αντί για μόνο το άθροισμα.
function progressDaysUntilExpiry(c){
  if(!c.planGeneratedAt || !dietsHasPlan(c)) return null;
  var threshold=c.renewalDays>0?c.renewalDays:PLAN_RENEWAL_DAYS;
  return threshold-Math.floor((Date.now()-c.planGeneratedAt)/86400000);
}

// Μία εγγραφή ανά μη-διαγραμμένο/μη-αρχειοθετημένο πελάτη — ΧΩΡΙΣ το φίλτρο "μόνο όσοι έχουν ήδη
// καταγραφές" που έχει το homePortalActivity, γιατί εδώ θέλουμε να φαίνονται και όσοι δεν έχουν
// ξεκινήσει ακόμα (score:null, ώστε η λίστα να δείχνει ολόκληρη την πελατεία, όχι μόνο τους ενεργούς).
function progressRosterData(){
  var stoppedIds={}, firstWeekIds={};
  try{ (typeof homeStoppedLogging==='function'?homeStoppedLogging({}):[]).forEach(function(x){stoppedIds[x.c.id]=true;}); }catch(e){}
  try{ (typeof homeFirstWeek==='function'?homeFirstWeek():[]).forEach(function(x){firstWeekIds[x.c.id]=true;}); }catch(e){}
  var hasCloud=!!(window.Cloud && window.Cloud.checkinsFor);
  return clients.filter(function(c){return !c.deleted && !c.archived;}).map(function(c){
    var rows=(hasCloud && c.shareToken)?window.Cloud.checkinsFor(c):[];
    var byDate=rows.length?ckRowsByDate(rows):{};
    var score=rows.length?ckWeekScore(byDate,0):null;
    var prevScore=rows.length?ckWeekScore(byDate,-1):null;
    var pillars=rows.length?ckPillarStats(ckWeekDates(0).map(function(k){return byDate[k];}).filter(Boolean)):null;
    var streak=rows.length?ckStreak(byDate):0;
    var gap=rows.length?ckDaysSinceLast(rows):null;
    var wl=c.weightLog||[];
    var wDelta=(wl.length>=2)?Math.round((wl[wl.length-1].weight-wl[0].weight)*10)/10:null;
    var expDays=progressDaysUntilExpiry(c);

    var flags=[];
    var isLow = dietsHasPlan(c) && score!=null && isFinite(gap) && gap<=PROGRESS_LOW_FRESH_DAYS && score<PROGRESS_LOW_MAX;
    if(isLow) flags.push('low');
    if(stoppedIds[c.id]) flags.push('gone');
    if(firstWeekIds[c.id]) flags.push('new');
    if(expDays!=null && expDays<=PROGRESS_EXPIRING_DAYS) flags.push('exp');
    // Βαρύτητα για την προεπιλεγμένη ταξινόμηση "χρειάζεται προσοχή πρώτα".
    var weight=stoppedIds[c.id]?3:(isLow?2:((expDays!=null&&expDays<=PROGRESS_EXPIRING_DAYS)?1:0));

    return {c:c, score:score, prevScore:prevScore, pillars:pillars, streak:streak, gap:gap,
      wDelta:wDelta, expDays:expDays, flags:flags, weight:weight};
  });
}

var PROGRESS_FLAG_LABELS={low:'⚠️ Χαμηλή τήρηση', gone:'📉 Σταμάτησαν', new:'🌱 Πρώτη εβδομάδα', exp:'⏳ Πλάνο λήγει'};

var _progressFilter='all', _progressSearch='';
function progressSetSearch(val){
  _progressSearch=(val||'').toLowerCase();
  var el=document.getElementById('progress-results');
  if(el) el.innerHTML=progressResultsHtml(progressRosterData());
}
function progressSetFilter(key,btn){
  _progressFilter=key;
  Array.prototype.forEach.call(document.querySelectorAll('#progress-filters .appt-fchip'),function(ch){ch.classList.toggle('active',ch===btn);});
  var el=document.getElementById('progress-results');
  if(el) el.innerHTML=progressResultsHtml(progressRosterData());
}
function progressResultsHtml(all){
  var shown=all;
  if(_progressFilter!=='all') shown=shown.filter(function(x){return x.flags.indexOf(_progressFilter)>-1;});
  var term=_progressSearch.trim();
  if(term) shown=shown.filter(function(x){return (x.c.name||'').toLowerCase().indexOf(term)>=0;});
  shown=shown.slice().sort(function(a,b){
    if(b.weight!==a.weight) return b.weight-a.weight;
    var as=a.score==null?-1:a.score, bs=b.score==null?-1:b.score;
    return as-bs;
  });
  if(!shown.length) return '<div class="hm-card"><div class="hm-empty">Κανένας πελάτης'+(term?' για "'+esc(_progressSearch.trim())+'"':'')+'.</div></div>';
  return '<div class="hm-card">'+shown.map(progressRowHtml).join('')+'</div>';
}
// Πάει κατευθείαν στο "💬 Μηνύματα" ήδη φιλτραρισμένο σε αυτόν τον πελάτη — αντί να ξαναφτιάχνουμε
// reply/thread UI εδώ, γράφουμε στο ΙΔΙΟ module-level state (_msgSearch, tabs/messages.js) που ήδη
// διαβάζει το search-input value όταν ζωγραφίζει (renderMessages) — ίδιο αποτέλεσμα με το να το
// πληκτρολογούσε ο ίδιος ο διαιτολόγος εκεί.
function progressOpenMessages(name){
  if(typeof _msgSearch!=='undefined') _msgSearch=(name||'').toLowerCase();
  if(typeof swTab==='function') swTab(9);
}
function progressRowHtml(x){
  var c=x.c;
  var flagsHtml=x.flags.map(function(f){return '<span class="hm-act-score hm-act-score-warn" style="margin-left:4px">'+PROGRESS_FLAG_LABELS[f]+'</span>';}).join('');
  var gapTxt=x.gap==null?'χωρίς check-in':(x.gap===0?'check-in σήμερα':x.gap===1?'check-in χθες':'check-in πριν '+x.gap+' ημ.');
  var wTxt=x.wDelta==null?'':(' · '+(x.wDelta>0?'+':'')+x.wDelta+' kg');
  return '<div class="hm-row" onclick="openProgressClient(\''+c.id+'\')">'
    +'<div class="hm-avatar hm-avatar-teal">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+(c.group?' <span class="cc-group-tag">🏷️ '+esc(c.group)+'</span>':'')+'</span>'
    +homeActivityScoreChipHtml(x.score,x.pillars)
    +homeActivityTrendHtml(x.score,x.prevScore)
    +(x.streak>0?'<span class="hm-row-sub">🔥 '+x.streak+'</span>':'')
    +flagsHtml
    +'<span class="hm-row-sub">'+gapTxt+wTxt+'</span>'
    +'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal)" title="Άνοιγμα στα Μηνύματα" onclick="event.stopPropagation();progressOpenMessages(\''+escJsAttr(c.name)+'\')">✉️</button>'
    +'</div>';
}
function progressSummaryHtml(all){
  var withScore=all.filter(function(x){return x.score!=null;});
  var avg=withScore.length?Math.round(withScore.reduce(function(s,x){return s+x.score;},0)/withScore.length):null;
  var expiring=all.filter(function(x){return x.expDays!=null && x.expDays<=PROGRESS_EXPIRING_DAYS;}).length;
  var attention=all.filter(function(x){return x.flags.indexOf('low')>-1 || x.flags.indexOf('gone')>-1;}).length;
  return '<div class="hm-clusters"><div class="hm-cluster"><div class="hm-stats">'
    +'<div class="hm-stat"><div class="hm-stat-num">'+(avg==null?'—':avg+'%')+'</div><div class="hm-stat-lbl">Μ.Ο. τήρησης (εβδ.)</div></div>'
    +'<div class="hm-stat"><div class="hm-stat-num">'+withScore.length+'</div><div class="hm-stat-lbl">Ενεργοί με check-in</div></div>'
    +'<div class="hm-stat hm-stat-clickable" onclick="swTab(5)" onkeydown="if(event.key===\'Enter\')swTab(5)" role="button" tabindex="0" title="Άνοιγμα Διατροφές"><div class="hm-stat-num">'+expiring+'</div><div class="hm-stat-lbl">Πλάνα λήγουν ('+PROGRESS_EXPIRING_DAYS+' ημ.)</div></div>'
    +'<div class="hm-stat"><div class="hm-stat-num">'+attention+'</div><div class="hm-stat-lbl">Χρειάζονται προσοχή</div></div>'
    +'</div></div></div>';
}

function renderProgress(){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;
  var all=progressRosterData();
  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">📈 Πρόοδος</div>';
  html+=progressSummaryHtml(all);
  html+='<input type="text" id="progress-search" class="client-search-inp" style="max-width:260px;margin-top:16px" placeholder="🔍 Αναζήτηση πελάτη..." value="'+esc(_progressSearch)+'" oninput="progressSetSearch(this.value)">';
  html+='<div id="progress-filters" style="display:flex;gap:8px;margin:10px 0 16px;flex-wrap:wrap">'
    +['all','low','gone','new','exp'].map(function(k){
      var label=k==='all'?'Όλοι':PROGRESS_FLAG_LABELS[k];
      var cnt=k==='all'?all.length:all.filter(function(x){return x.flags.indexOf(k)>-1;}).length;
      return '<span class="appt-fchip'+(k===_progressFilter?' active':'')+'" onclick="progressSetFilter(\''+k+'\',this)">'+label+' ('+cnt+')</span>';
    }).join('')
    +'</div>';
  html+='<div id="progress-results">'+progressResultsHtml(all)+'</div>';
  html+='</div>';
  main.innerHTML=html;
  // Ίδιο μοτίβο με το άνοιγμα του "📝 Ραντεβού" (swTab, TAB_APPOINTMENTS): φέρνει φρέσκα check-ins/
  // σημειώσεις/feedback στο παρασκήνιο αντί να δείχνει μόνο ό,τι ήδη υπήρχε στη μνήμη από το login.
  if(typeof refreshClientPortalFeedback==='function') refreshClientPortalFeedback(null);
}

// ── Γράφημα τήρησης 10 εβδομάδων (Phase 2) ──────────────────────────────────────────────────
// Ίδιο ύφος με τα υπάρχοντα γραφήματα του "📝 Ραντεβού" tab (apptSparkline/apptCorrelationChart,
// js/appointments/appointments.js) — αυτόσχεδιο inline SVG, χωρίς βιβλιοθήκη, ίδια λογική
// άξονα/gridlines/χρωμάτων· όχι νέο chart-εργαλείο, απλά η ίδια συνταγή σε μεγαλύτερο βάθος χρόνου
// (10 εβδομάδες αντί για 4 μπάρες) ΚΑΙ ανά πυλώνα αντί για ένα συνολικό σκορ.
var PROGRESS_CHART_WEEKS=10;

// % τήρησης ενός πυλώνα (key: 'diet'|'wat'|'sup', ταιριάζει με τα πεδία dietDone/dietTot κ.λπ. του
// ckPillarStats) για τη βδομάδα offset εβδομάδες πριν/μετά τη σημερινή. null αν δεν υπήρχε καθόλου
// στόχος αυτού του πυλώνα εκείνη την εβδομάδα (π.χ. πελάτης χωρίς στόχο νερού).
function progressWeeklyPillarPct(byDate,offset,key){
  var rows=ckWeekDates(offset).map(function(k){return byDate[k];}).filter(Boolean);
  var st=ckPillarStats(rows);
  var tot=st[key+'Tot'];
  return tot?Math.round(st[key+'Done']/tot*100):null;
}
// Σε ποιο week-offset (0=τρέχουσα εβδομάδα Δευτέρα-Κυριακή, αρνητικό=παλιότερη) πέφτει μια
// ημερομηνία — ίδιο όριο εβδομάδας (Δευτέρα) με το ckWeekKeysFor, ώστε ένα ραντεβού να ευθυγραμμίζεται
// με τη ΣΩΣΤΗ στήλη του γραφήματος (αυτή που περιέχει τα check-in της ίδιας εβδομάδας).
function progressWeekOffsetOf(dateStr){
  function mondayOf(dt){ var js=dt.getDay(), toMon=(js===0?-6:1-js); var m=new Date(dt); m.setDate(dt.getDate()+toMon); m.setHours(0,0,0,0); return m; }
  var d=new Date(dateStr+'T00:00:00');
  var today=new Date(); today.setHours(0,0,0,0);
  return Math.round((mondayOf(d)-mondayOf(today))/(7*86400000));
}
var PROGRESS_PILLAR_SERIES=[
  {key:'diet', label:'Διατροφή', color:'#025857'},
  {key:'wat', label:'Νερό', color:'#1565C0'},
  {key:'sup', label:'Συμπληρώματα', color:'#EF9F27'}
];
function progressAdherenceChartSvg(c,rows){
  if(!rows.length) return '<div class="hm-empty">Δεν υπάρχουν ακόμα καταγραφές από το portal.</div>';
  var byDate=ckRowsByDate(rows);
  var n=PROGRESS_CHART_WEEKS;
  var W=640,H=170,padL=28,padR=10,padT=10,padB=20;
  var sx=function(i){return padL+(i/(n-1))*(W-padL-padR);};
  var sy=function(v){return padT+(1-v/100)*(H-padT-padB);};
  var svg='<svg viewBox="0 0 '+W+' '+H+'" width="100%">';
  [0,50,100].forEach(function(v){
    svg+='<line x1="'+padL+'" y1="'+sy(v)+'" x2="'+(W-padR)+'" y2="'+sy(v)+'" stroke="#eee" stroke-width="1"/>'
      +'<text x="1" y="'+(sy(v)+3)+'" font-size="9" fill="#999">'+v+'%</text>';
  });
  // Δείκτες ραντεβού — κάθετη διακεκομμένη γραμμή στη στήλη της εβδομάδας που έγιναν.
  (c.appointments||[]).forEach(function(a){
    var off=progressWeekOffsetOf(a.date);
    if(off<-(n-1) || off>0) return;
    var xi=(n-1)+off;
    svg+='<line x1="'+sx(xi)+'" y1="'+padT+'" x2="'+sx(xi)+'" y2="'+(H-padB)+'" stroke="#c9c9c9" stroke-width="1" stroke-dasharray="3,3"><title>Ραντεβού '+esc(a.date)+'</title></line>';
  });
  PROGRESS_PILLAR_SERIES.forEach(function(s){
    var pts=[];
    for(var i=0;i<n;i++){
      var v=progressWeeklyPillarPct(byDate,i-(n-1),s.key);
      if(v!=null) pts.push({i:i,v:v});
    }
    if(pts.length>=2){
      svg+='<polyline points="'+pts.map(function(p){return sx(p.i)+','+sy(p.v);}).join(' ')+'" fill="none" stroke="'+s.color+'" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    pts.forEach(function(p,idx){
      svg+='<circle cx="'+sx(p.i)+'" cy="'+sy(p.v)+'" r="'+(idx===pts.length-1?3.5:2)+'" fill="'+s.color+'"><title>'+s.label+': '+p.v+'%</title></circle>';
    });
  });
  svg+='</svg>';
  return svg;
}
// Ένα callout με τον πιο αδύναμο πυλώνα ΑΥΤΗΣ της εβδομάδας — ίδιο κατώφλι (<60%) με το κόκκινο
// hm-pill-lo στο tooltip της Αρχικής (homeActivityPillarsHtml), ώστε να μη δείχνουν αντιφατικά.
function progressWeakPillarCalloutHtml(rows){
  if(!rows.length) return '';
  var byDate=ckRowsByDate(rows);
  var st=ckPillarStats(ckWeekDates(0).map(function(k){return byDate[k];}).filter(Boolean));
  var cands=[];
  if(st.dietTot) cands.push({label:'Διατροφή', pct:Math.round(st.dietDone/st.dietTot*100)});
  if(st.watTot) cands.push({label:'Νερό', pct:Math.round(st.watDone/st.watTot*100)});
  if(st.supTot) cands.push({label:'Συμπληρώματα', pct:Math.round(st.supDone/st.supTot*100)});
  if(!cands.length) return '';
  cands.sort(function(a,b){return a.pct-b.pct;});
  var weakest=cands[0];
  if(weakest.pct>=60) return '';
  return '<div class="hm-card hm-card-warning" style="padding:8px 12px;margin-bottom:10px;font-size:12px">⚠️ Πυλώνας που χρειάζεται προσοχή αυτή την εβδομάδα: <b>'+weakest.label+'</b> ('+weakest.pct+'%)</div>';
}
function progressAdherenceChartPanel(c,rows){
  return '<div class="hm-card" style="margin-bottom:14px">'
    +'<div class="hm-card-title">📈 Τήρηση — τελευταίες '+PROGRESS_CHART_WEEKS+' εβδομάδες'
    +'<span style="margin-left:auto;font-weight:400;font-size:10.5px;color:var(--text-muted)">'
    +'<span style="color:#025857">●</span> Διατροφή &nbsp; <span style="color:#1565C0">●</span> Νερό &nbsp; <span style="color:#EF9F27">●</span> Συμπληρώματα &nbsp; <span style="color:#999">┊</span> Ραντεβού'
    +'</span></div>'
    +progressWeakPillarCalloutHtml(rows)
    +progressAdherenceChartSvg(c,rows)
    +'</div>';
}

// ── Λεπτομέρεια πελάτη ───────────────────────────────────────────────────────────────────────
// Καθαρά προβολή: για να απαντήσεις σε κάτι (σημείωση/feedback/ραντεβού), πάει στο tab όπου ήδη
// ζει αυτή η ενέργεια — δεν ξαναγράφουμε reply/resolve εδώ (θα ήταν 2ο σημείο με το ίδιο state).
function progressBuildTimeline(c){
  var items=[];
  try{
    collectAllClientMessages().filter(function(m){return m.c.id===c.id;}).forEach(function(m){
      if(m.type==='note') items.push({date:m.date,icon:'💬',title:'Σημείωση πελάτη',detail:esc(m.noteRaw)});
      else items.push({date:m.date,icon:'⭐',title:'Χαμηλή αξιολόγηση πλάνου',detail:'Εβδομάδα '+esc(m.date)});
    });
  }catch(e){}
  (c.appointments||[]).forEach(function(a){
    items.push({date:a.date,icon:'🗓',title:'Ραντεβού'+(a.flagged?' 🚩':''),detail:esc(a.notes||'')});
  });
  (c.weightLog||[]).forEach(function(w){
    items.push({date:w.date,icon:'⚖️',title:'Μέτρηση',detail:w.weight+' kg'+(w.bf>0?' · '+w.bf+'% λίπος':'')});
  });
  items.sort(function(a,b){return a.date<b.date?1:(a.date>b.date?-1:0);});
  return items;
}
function progressTimelineHtml(items){
  if(!items.length) return '<div class="hm-empty">Κανένα καταγεγραμμένο γεγονός ακόμα.</div>';
  return items.slice(0,60).map(function(e){
    return '<div class="hm-row" style="cursor:default;align-items:flex-start">'
      +'<span style="width:20px;flex-shrink:0">'+e.icon+'</span>'
      +'<span style="flex:1;min-width:0"><b style="font-size:12px">'+e.title+'</b>'
      +(e.detail?'<div class="hm-row-sub" style="white-space:normal">'+e.detail+'</div>':'')
      +'</span>'
      +'<span class="hm-row-sub">'+esc(e.date)+'</span>'
      +'</div>';
  }).join('');
}
function openProgressClient(id){
  var c=clients.find(function(x){return x.id===id;});
  var main=document.getElementById('main');
  if(!c || !main) return;
  var rows=(window.Cloud && window.Cloud.checkinsFor && c.shareToken)?window.Cloud.checkinsFor(c):[];
  var expDays=progressDaysUntilExpiry(c);
  var planTxt=expDays==null?'Χωρίς ενεργό πλάνο':(expDays<0?'Το πλάνο έχει λήξει':'Ενεργό πλάνο · λήγει σε '+expDays+' ημέρες');
  var html='<div class="hm-wrap">';
  html+='<div class="hm-title"><span onclick="renderProgress()" style="cursor:pointer;color:var(--teal);font-weight:600;font-size:14px">← Πίσω σε όλους</span></div>';
  html+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">'
    +'<div class="hm-avatar hm-avatar-teal" style="width:40px;height:40px;font-size:15px">'+initials(c.name)+'</div>'
    +'<div><div style="font-size:17px;font-weight:700">'+esc(c.name||'')+(c.group?' <span class="cc-group-tag">🏷️ '+esc(c.group)+'</span>':'')+'</div>'
    +'<div class="hm-row-sub">'+esc(planTxt)+'</div></div>'
    +'<div style="margin-left:auto;display:flex;gap:8px">'
    +'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal)" title="Άνοιγμα στα Μηνύματα" onclick="progressOpenMessages(\''+escJsAttr(c.name)+'\')">✉️ Μηνύματα</button>'
    +'<button type="button" class="hm-action-btn" onclick="selectClient(\''+c.id+'\');swTab(1)">Άνοιγμα πλήρους καρτέλας</button>'
    +'</div></div>';
  html+=progressAdherenceChartPanel(c,rows);
  html+=(typeof buildClientProgressHtml==='function')?buildClientProgressHtml(c):'';
  html+='<div class="hm-card" style="margin-top:14px"><div class="hm-card-title">🗂 Ιστορικό</div>'+progressTimelineHtml(progressBuildTimeline(c))+'</div>';
  html+='</div>';
  main.innerHTML=html;
}

// Badge sidebar "📈 Πρόοδος" — πελάτες με σήμα προσοχής (χαμηλή τήρηση ή σταμάτησαν). Το "🌱 πρώτη
// εβδομάδα"/"⏳ λήγει πλάνο" ΔΕΝ μετράνε εδώ (δεν είναι επείγοντα, ίδιο σκεπτικό με το γιατί δεν
// μπαίνουν στο homeClientsNeedingAttention). Ίδια πηγή δεδομένων με τη λίστα/KPI — δεν μπορεί να
// δείξει διαφορετικό νούμερο απ' ό,τι βλέπεις ανοίγοντας το tab.
function updateProgressNavBadge(){
  var n=0;
  try{ n=progressRosterData().filter(function(x){return x.flags.indexOf('low')>-1 || x.flags.indexOf('gone')>-1;}).length; }catch(e){ n=0; }
  var txt=n>99?'99+':String(n);
  ['progress-nav-badge','progress-nav-badge-mobile'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    el.textContent=txt;
    el.style.display=n>0?'inline-block':'none';
  });
  if(typeof setMoreNavBadgeCount==='function') setMoreNavBadgeCount('progress', n);
}

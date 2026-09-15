// js/tabs/progress.js
// The "📈 Πρόοδος" tab — cross-client roster + per-client history, δίπλα στο "💬 Μηνύματα" στο
// αριστερό μενού (swTab(10)). Ενοποιεί σήματα που ζούσαν σκόρπια σε Αρχική/Ραντεβού/Μηνύματα σε
// ΕΝΑ σημείο, χωρίς να τα ξαναϋπολογίζει: ck* helpers/clientWeightStripHtml/collectAllClientMessages
// καλούνται ΑΥΤΟΥΣΙΑ εδώ, ώστε ένα νούμερο να μην μπορεί ποτέ να αποκλίνει ανάμεσα σε δύο σημεία
// (βλ. "two-lists-diverge" gotcha).
// Phase 1 (2026-09-15, μετά από mockup στη συζήτηση): λίστα πελατών + βασικό ιστορικό ανά πελάτη.
// Phase 2 (2026-09-15): γράφημα τήρησης 10 εβδομάδων ανά πυλώνα, δείκτες ραντεβού πάνω στο γράφημα,
// weak-pillar callout, ✉️ shortcut στα Μηνύματα (roster row). Phase 3 (2026-09-15):
// c.lastDietologistContact + μίκρυνση του per-client panel στο "📝 Ραντεβού" (progressCompactSummaryHtml).
// Phase 4 (2026-09-15, μετά από 2ο mockup): αντικατάσταση του buildClientProgressHtml εδώ (διπλό
// score/streak/πυλώνες, ήδη καλυμμένα από το γράφημα 10 εβδ. λίγο πιο πάνω στην ίδια σελίδα) με
// progressWeightPanelHtml — βλ. σχόλιο εκεί. Phase 5 (2026-09-15, idea #1 του ίδιου mockup): η
// γραμμή λίστας (progressRowHtml) ξαναχτίστηκε σε 3 γραμμές αντί όλα σε μία — βλ. σχόλιο εκεί.
// Phase 6 (idea #5): το ιστορικό πελάτη πλέον scrollable (homeCard) αντί να κόβεται σιωπηλά στα 60.
// Phase 7 (ideas #2+#3): φίλτρο ομάδας + ταξινόμηση στη λίστα, + μαζική υπενθύμιση όταν είναι ενεργό
// φίλτρο σημαίας — βλ. σχόλια στο progressFilteredSorted/progressBulkNudge.
// Loads στο group tabs/, ΜΕΤΑ το appointments/appointments.js (ck* helpers + apptSparkline ζουν εκεί,
// clientWeightStripHtml στο client-editor/form-controls.js) και το tabs/messages.js
// (collectAllClientMessages).

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
    // "Πότε επικοινώνησα ΕΓΩ τελευταία" (c.lastDietologistContact, markDietologistContacted στο
    // js/lib/helpers.js) — ξεχωριστό από το gap του check-in παραπάνω, που δείχνει πότε κατέγραψε Ο
    // ΠΕΛΑΤΗΣ. Σκοπός: να μη ξεχνιέται ένας καλός πελάτης που απλά δεν χρειάζεται nudge.
    var contactDays=c.lastDietologistContact?Math.floor((Date.now()-c.lastDietologistContact)/86400000):null;

    var flags=[];
    var isLow = dietsHasPlan(c) && score!=null && isFinite(gap) && gap<=PROGRESS_LOW_FRESH_DAYS && score<PROGRESS_LOW_MAX;
    if(isLow) flags.push('low');
    if(stoppedIds[c.id]) flags.push('gone');
    if(firstWeekIds[c.id]) flags.push('new');
    if(expDays!=null && expDays<=PROGRESS_EXPIRING_DAYS) flags.push('exp');
    // Βαρύτητα για την προεπιλεγμένη ταξινόμηση "χρειάζεται προσοχή πρώτα".
    var weight=stoppedIds[c.id]?3:(isLow?2:((expDays!=null&&expDays<=PROGRESS_EXPIRING_DAYS)?1:0));

    return {c:c, score:score, prevScore:prevScore, pillars:pillars, streak:streak, gap:gap,
      wDelta:wDelta, expDays:expDays, flags:flags, weight:weight, contactDays:contactDays};
  });
}

var PROGRESS_FLAG_LABELS={low:'⚠️ Χαμηλή τήρηση', gone:'📉 Σταμάτησαν', new:'🌱 Πρώτη εβδομάδα', exp:'⏳ Πλάνο λήγει'};
// Σειρά προτεραιότητας όταν ένας πελάτης έχει πάνω από 1 σημαία — ποια εμφανίζεται πρώτη/τονισμένη
// στη γραμμή λίστας (idea #1, mockup συζήτησης 2026-09-15). Ίδια ιεράρχηση με το βάρος ταξινόμησης
// στο progressRosterData (gone > low > exp) + το 'new' στο τέλος (πληροφοριακό, όχι προειδοποίηση).
var PROGRESS_FLAG_PRIORITY=['gone','low','exp','new'];
// Ίδιοι χρωματικοί τόνοι με τα ήδη υπάρχοντα hm-act-score-bad/-warn (css/styles.css) — 'new' παίρνει
// το ουδέτερο teal του app αντί για κόκκινο/πορτοκαλί, μια πρώτη εβδομάδα δεν είναι πρόβλημα.
var PROGRESS_FLAG_COLOR={gone:'#791F1F', low:'#791F1F', exp:'#633806', new:'var(--teal)'};
// Ο πιο αδύναμος πυλώνας ΑΥΤΗΣ της εβδομάδας για έναν πελάτη — ίδιο κατώφλι-ανεξάρτητη λογική με το
// progressWeakPillarCalloutHtml (client-detail chart panel), εδώ σε συμπτυγμένη μορφή μιας γραμμής
// για τη λίστα ρίζας, ώστε το "⚠️ Χαμηλή τήρηση" να μην είναι απλά μια ετικέτα αλλά να λέει ΤΙ.
function progressWeakestPillarTxt(pillars){
  if(!pillars) return '';
  var cands=[];
  if(pillars.dietTot) cands.push({icon:'🍽',done:pillars.dietDone,tot:pillars.dietTot});
  if(pillars.watTot) cands.push({icon:'💧',done:pillars.watDone,tot:pillars.watTot});
  if(pillars.supTot) cands.push({icon:'💊',done:pillars.supDone,tot:pillars.supTot});
  if(!cands.length) return '';
  cands.sort(function(a,b){return (a.done/a.tot)-(b.done/b.tot);});
  var w=cands[0];
  return w.icon+' '+w.done+'/'+w.tot;
}
// 2η γραμμή της κάρτας πελάτη: ΤΟ πιο επείγον πράγμα, χρωματισμένο — οι υπόλοιπες σημαίες (αν
// υπάρχουν παραπάνω από 1) μένουν σε ουδέτερο γκρι δίπλα, ώστε να μη χαθεί πληροφορία αλλά να μην
// τραβάνε όλες το ίδιο βλέμμα. Καμία σημαία ⇒ καμία γραμμή (ένας πελάτης που πάει καλά δεν χρειάζεται
// να διαβεβαιωθεί ρητά ότι είναι εντάξει).
function progressRowUrgentLineHtml(x){
  if(!x.flags.length) return '';
  var ordered=PROGRESS_FLAG_PRIORITY.filter(function(f){return x.flags.indexOf(f)>-1;});
  var top=ordered[0];
  var extra='';
  if(top==='low'){
    var w=progressWeakestPillarTxt(x.pillars);
    if(w) extra=' <span style="color:#999;font-weight:400">· '+w+' πιο αδύναμος πυλώνας</span>';
  }
  var rest=ordered.slice(1);
  var restHtml=rest.length?(' <span style="color:#999;font-weight:400">· '+rest.map(function(f){return PROGRESS_FLAG_LABELS[f];}).join(' · ')+'</span>'):'';
  return '<div style="margin-top:3px;font-size:11.5px;font-weight:600;color:'+PROGRESS_FLAG_COLOR[top]+'">'+PROGRESS_FLAG_LABELS[top]+extra+restHtml+'</div>';
}
// 3η γραμμή: όλα τα υπόλοιπα (σερί/τελ. check-in/Δ βάρους/επικοινωνία) σε ουδέτερο γκρι — δεν
// ανταγωνίζονται πια με το σκορ/σημαία της 1ης-2ης γραμμής για προσοχή.
function progressRowMetaLineHtml(x){
  var parts=[];
  if(x.streak>0) parts.push('🔥 '+x.streak+' ημ. σερί');
  parts.push(x.gap==null?'χωρίς check-in':(x.gap===0?'check-in σήμερα':x.gap===1?'check-in χθες':'check-in πριν '+x.gap+' ημ.'));
  if(x.wDelta!=null) parts.push((x.wDelta>0?'+':'')+x.wDelta+' kg');
  parts.push(x.contactDays==null?'📞 καμία επικοινωνία ακόμα':('📞 '+(x.contactDays===0?'επικοινωνία σήμερα':'πριν '+x.contactDays+' ημ.')));
  return '<div class="hm-row-sub" style="white-space:normal;margin-top:2px">'+parts.join(' &nbsp;·&nbsp; ')+'</div>';
}

var _progressFilter='all', _progressSearch='', _progressGroupFilter='all', _progressSort='attention';
// Idea #3 (mockup συζήτησης 2026-09-15): ποιοι πελάτες είναι τσεκαρισμένοι για μαζική ενέργεια —
// καθαρίζει σε κάθε αλλαγή φίλτρου/αναζήτησης/ταξινόμησης, ώστε να μη μείνει "επιλεγμένος" ένας
// πελάτης που πλέον δεν φαίνεται καν στη λίστα.
var _progressSelected={};
function progressSetSearch(val){
  _progressSearch=(val||'').toLowerCase();
  _progressSelected={};
  var el=document.getElementById('progress-results');
  if(el) el.innerHTML=progressResultsHtml(progressRosterData());
}
function progressSetFilter(key,btn){
  _progressFilter=key;
  _progressSelected={};
  Array.prototype.forEach.call(document.querySelectorAll('#progress-filters .appt-fchip'),function(ch){ch.classList.toggle('active',ch===btn);});
  var el=document.getElementById('progress-results');
  if(el) el.innerHTML=progressResultsHtml(progressRosterData());
}
// Idea #2 (mockup συζήτησης 2026-09-15): φίλτρο ομάδας + ταξινόμηση — μέχρι τώρα η λίστα ταξινομούνταν
// ΜΟΝΟ "προσοχή πρώτα" και δεν υπήρχε τρόπος να δεις μόνο μια ομάδα.
function progressSetGroupFilter(val){
  _progressGroupFilter=val;
  _progressSelected={};
  var el=document.getElementById('progress-results');
  if(el) el.innerHTML=progressResultsHtml(progressRosterData());
}
var PROGRESS_SORT_LABELS={attention:'Χρειάζονται προσοχή πρώτα', name:'Αλφαβητικά', score_asc:'Χειρότερο σκορ πρώτα', recent:'Πιο πρόσφατη δραστηριότητα'};
function progressSetSort(val){
  _progressSort=val;
  var el=document.getElementById('progress-results');
  if(el) el.innerHTML=progressResultsHtml(progressRosterData());
}
function progressSortComparator(sortKey){
  if(sortKey==='name') return function(a,b){ return (a.c.name||'').localeCompare(b.c.name||'','el'); };
  if(sortKey==='score_asc') return function(a,b){ var as=a.score==null?101:a.score, bs=b.score==null?101:b.score; return as-bs; };
  if(sortKey==='recent') return function(a,b){ var ag=a.gap==null?1e9:a.gap, bg=b.gap==null?1e9:b.gap; return ag-bg; };
  // 'attention' (προεπιλογή) — ίδια λογική με πριν το idea #2.
  return function(a,b){
    if(b.weight!==a.weight) return b.weight-a.weight;
    var as=a.score==null?-1:a.score, bs=b.score==null?-1:b.score;
    return as-bs;
  };
}
// Φιλτράρισμα+ταξινόμηση ΧΩΡΙΣ το rendering — ένα σημείο αλήθειας, ώστε το "Επέλεξε όλους" (idea #3)
// να ξέρει ΑΚΡΙΒΩΣ ποιοι πελάτες είναι ορατοί χωρίς να ξαναγράφει τη λογική του progressResultsHtml.
function progressFilteredSorted(all){
  var shown=all;
  if(_progressGroupFilter!=='all') shown=shown.filter(function(x){return (x.c.group||'')===_progressGroupFilter;});
  if(_progressFilter!=='all') shown=shown.filter(function(x){return x.flags.indexOf(_progressFilter)>-1;});
  var term=_progressSearch.trim();
  if(term) shown=shown.filter(function(x){return (x.c.name||'').toLowerCase().indexOf(term)>=0;});
  return shown.slice().sort(progressSortComparator(_progressSort));
}
// Idea #3: το bulk toolbar εμφανίζεται ΜΟΝΟ όταν είναι ενεργό συγκεκριμένο φίλτρο σημαίας (π.χ. μόνο
// "📉 Σταμάτησαν") — δεν βγάζει νόημα μαζική υπενθύμιση σε ΟΛΗ την πελατεία μαζί.
function progressToggleSelect(id,checked){
  if(checked) _progressSelected[id]=true; else delete _progressSelected[id];
  var el=document.getElementById('progress-results');
  if(el) el.innerHTML=progressResultsHtml(progressRosterData());
}
function progressSelectAllVisible(){
  var shown=progressFilteredSorted(progressRosterData());
  var allSel=shown.length>0 && shown.every(function(x){return _progressSelected[x.c.id];});
  shown.forEach(function(x){ if(allSel) delete _progressSelected[x.c.id]; else _progressSelected[x.c.id]=true; });
  var el=document.getElementById('progress-results');
  if(el) el.innerHTML=progressResultsHtml(progressRosterData());
}
// Καλεί το ΙΔΙΟ sendActivityNudge (tabs/home-diets.js) που ήδη χρησιμοποιεί το μεμονωμένο κουμπί
// υπενθύμισης αλλού στο app — απλά σε βρόχο, αντί να ξαναγράφεται η λογική WhatsApp/email εδώ.
// Κάθε κλήση ανοίγει δικό της παράθυρο/tab· αν ο browser μπλοκάρει pop-ups μετά το 1ο, ο διαιτολόγος
// θα το δει από το toast παρακάτω και μπορεί να τα επιτρέψει. Το "sent" μετράει μόνο πελάτες με
// πραγματικό τηλέφωνο/email — το sendActivityNudge δεν επιστρέφει τίποτα, οπότε ελέγχουμε ΠΡΙΝ την
// κλήση ό,τι κι αυτό θα ήλεγχε (ίδια συνθήκη), αλλιώς το toast θα έλεγε "άνοιξαν Ν" ενώ στην
// πραγματικότητα κάποιος πελάτης απλά δεν έχει στοιχεία επικοινωνίας (ήδη δικό του toast σφάλματος).
function progressBulkNudge(){
  var ids=Object.keys(_progressSelected);
  if(!ids.length) return;
  var sent=0, skipped=0;
  ids.forEach(function(id){
    var c=clients.find(function(x){return x.id===id;});
    var canSend=c && c.shareToken && typeof sendActivityNudge==='function' && (normalizePhoneIntl(c.phone)||c.email);
    if(!canSend){ skipped++; return; }
    sendActivityNudge(id);
    sent++;
  });
  _progressSelected={};
  var el=document.getElementById('progress-results');
  if(el) el.innerHTML=progressResultsHtml(progressRosterData());
  var msg='Άνοιξαν '+sent+' μηνύματα υπενθύμισης'+(skipped?(' ('+skipped+' παραλείφθηκαν, χωρίς portal link ή στοιχεία επικοινωνίας).'):'.')+(sent>1?' Αν κάποιο δεν άνοιξε, ο browser ίσως μπλόκαρε pop-ups.':'');
  if(typeof showSuccessToast==='function') showSuccessToast(msg); else console.log(msg);
}
function progressResultsHtml(all){
  var shown=progressFilteredSorted(all);
  if(!shown.length) return '<div class="hm-card"><div class="hm-empty">Κανένας πελάτης'+(_progressSearch.trim()?' για "'+esc(_progressSearch.trim())+'"':'')+'.</div></div>';
  var bulkMode=_progressFilter!=='all';
  var bulkBarHtml='';
  if(bulkMode){
    var selCount=shown.filter(function(x){return _progressSelected[x.c.id];}).length;
    var allSel=selCount>0 && selCount===shown.length;
    bulkBarHtml='<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 12px;margin-bottom:8px;background:#fff8e6;border:1px solid #f0d998;border-radius:10px;font-size:12px">'
      +'<label style="display:flex;align-items:center;gap:6px;cursor:pointer;margin:0"><input type="checkbox"'+(allSel?' checked':'')+' onchange="progressSelectAllVisible()"> Επέλεξε όλους ('+shown.length+')</label>'
      +(selCount>0?('<b>'+selCount+' επιλεγμένοι</b><button type="button" class="hm-action-btn" style="background:#fff;color:#8a5b00;border:1px solid #f0d998" onclick="progressBulkNudge()">📨 Στείλε υπενθύμιση σε όλους</button>'):'')
      +'</div>';
  }
  return '<div class="hm-card">'+bulkBarHtml+shown.map(function(x){return progressRowHtml(x,bulkMode);}).join('')+'</div>';
}
// Πάει κατευθείαν στο "💬 Μηνύματα" ήδη φιλτραρισμένο σε αυτόν τον πελάτη — αντί να ξαναφτιάχνουμε
// reply/thread UI εδώ, γράφουμε στο ΙΔΙΟ module-level state (_msgSearch, tabs/messages.js) που ήδη
// διαβάζει το search-input value όταν ζωγραφίζει (renderMessages) — ίδιο αποτέλεσμα με το να το
// πληκτρολογούσε ο ίδιος ο διαιτολόγος εκεί.
function progressOpenMessages(name){
  if(typeof _msgSearch!=='undefined') _msgSearch=(name||'').toLowerCase();
  if(typeof swTab==='function') swTab(9);
}
// Idea #1 (mockup συζήτησης 2026-09-15): 3 γραμμές αντί για όλα στοιβαγμένα σε μία — 1η ταυτότητα+
// σκορ (πάντα ίδιο ύψος), 2η ΤΟ πιο επείγον πράγμα με χρώμα (ή τίποτα αν όλα καλά), 3η τα υπόλοιπα σε
// ουδέτερο γκρι. flex:0 1 auto στο hm-row-name παρακάμπτει το flex:1 της κλάσης (css/styles.css) —
// εδώ δεν χρειάζεται να «τραβήξει» όλο τον χώρο της σειράς, μοιράζεται τη σειρά με group tag/σκορ/τάση.
function progressRowHtml(x,bulkMode){
  var c=x.c;
  var checkboxHtml=bulkMode?('<input type="checkbox" style="margin-top:7px;flex-shrink:0" onclick="event.stopPropagation()" onchange="progressToggleSelect(\''+c.id+'\',this.checked)"'+(_progressSelected[c.id]?' checked':'')+'>'):'';
  return '<div class="hm-row" style="align-items:flex-start;flex-wrap:wrap" onclick="openProgressClient(\''+c.id+'\')">'
    +checkboxHtml
    +'<div class="hm-avatar hm-avatar-teal" style="margin-top:1px">'+initials(c.name)+'</div>'
    +'<div style="flex:1;min-width:160px">'
    +'<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
    +'<span class="hm-row-name" style="flex:0 1 auto">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +(c.group?'<span class="cc-group-tag">🏷️ '+esc(c.group)+'</span>':'')
    +homeActivityScoreChipHtml(x.score,x.pillars)
    +homeActivityTrendHtml(x.score,x.prevScore)
    +'</div>'
    +progressRowUrgentLineHtml(x)
    +progressRowMetaLineHtml(x)
    +'</div>'
    +'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal);margin-top:2px" title="Άνοιγμα στα Μηνύματα" onclick="event.stopPropagation();progressOpenMessages(\''+escJsAttr(c.name)+'\')">✉️</button>'
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
  _progressSelected={};
  var main=document.getElementById('main');
  if(!main) return;
  var all=progressRosterData();
  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">📈 Πρόοδος</div>';
  html+=progressSummaryHtml(all);
  // Idea #2 (mockup συζήτησης 2026-09-15): φίλτρο ομάδας + ταξινόμηση, δίπλα στην αναζήτηση. Οι
  // ομάδες βγαίνουν από τα πραγματικά δεδομένα (c.group) — καμία σκληροκωδικοποιημένη λίστα.
  var groups=[];
  all.forEach(function(x){ if(x.c.group && groups.indexOf(x.c.group)<0) groups.push(x.c.group); });
  groups.sort(function(a,b){return a.localeCompare(b,'el');});
  html+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;align-items:center">';
  html+='<input type="text" id="progress-search" class="client-search-inp" style="max-width:260px;margin:0" placeholder="🔍 Αναζήτηση πελάτη..." value="'+esc(_progressSearch)+'" oninput="progressSetSearch(this.value)">';
  if(groups.length){
    html+='<select class="clients-toolbar-select" style="max-width:180px;margin:0" onchange="progressSetGroupFilter(this.value)">'
      +'<option value="all">Όλες οι ομάδες</option>'
      +groups.map(function(g){return '<option value="'+esc(g)+'"'+(g===_progressGroupFilter?' selected':'')+'>'+esc(g)+'</option>';}).join('')
      +'</select>';
  }
  html+='<select class="clients-toolbar-select" style="max-width:220px;margin:0" onchange="progressSetSort(this.value)">'
    +Object.keys(PROGRESS_SORT_LABELS).map(function(k){return '<option value="'+k+'"'+(k===_progressSort?' selected':'')+'>'+PROGRESS_SORT_LABELS[k]+'</option>';}).join('')
    +'</select>';
  html+='</div>';
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
}
// Φέρνει φρέσκα check-ins/σημειώσεις/feedback στο παρασκήνιο — ΞΕΧΩΡΙΣΤΗ συνάρτηση από το
// renderProgress() (ίδιος διαχωρισμός με renderMessages()/msgRefresh(), tabs/messages.js), όχι
// ενσωματωμένη μέσα του: αν το renderProgress() έκανε ο ίδιος αυτό το refresh, κάθε ξαναζωγραφισμα
// θα ξανατριγύριζε ατέρμονα refresh→render→refresh→... Καλείται ΜΙΑ φορά όταν ανοίγει το tab
// (swTab, js/client-editor/form-controls.js), ίδιο μοτίβο με το άνοιγμα του "📝 Ραντεβού".
//
// ΓΙΑΤΙ ΔΕΝ γίνεται μέσω refreshClientPortalFeedback (όπως το Ραντεβού tab): κάθε Cloud.refresh*Cache()
// (app-part7.js) καταλήγει σε "if(curId===null) renderHome()" — φτιαγμένο για "δεν υπάρχει επιλεγμένος
// πελάτης ⇒ δείξε Αρχική", ΠΡΙΝ υπάρχει το Πρόοδος. Εδώ το curId ΕΙΝΑΙ επίτηδες null (cross-client
// προβολή, όπως τα Μηνύματα) — χωρίς αυτό το fix, το φρεσκάρισμα πετάει πίσω στην Αρχική μερικά
// δευτερόλεπτα μετά το άνοιγμα (βρέθηκε σε live sanity-check, 2026-09-16). Ίδιο αντίδοτο με το
// msgRefresh: ξαναζωγραφίζουμε ΕΜΕΙΣ μετά, ώστε να «νικήσει» το home fallback.
function progressRefresh(){
  if(!window.Cloud) return;
  Promise.all([
    typeof Cloud.refreshCheckinsCache==='function'?Cloud.refreshCheckinsCache():Promise.resolve(),
    typeof Cloud.refreshClientLogsCache==='function'?Cloud.refreshClientLogsCache():Promise.resolve(),
    typeof Cloud.refreshPlanFeedbackCache==='function'?Cloud.refreshPlanFeedbackCache():Promise.resolve(),
    typeof Cloud.refreshLinkHealthCache==='function'?Cloud.refreshLinkHealthCache():Promise.resolve()
  ]).then(function(){ renderProgress(); }).catch(function(){});
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
// Idea #5 (mockup συζήτησης 2026-09-15): έδειχνε σιωπηλά μόνο τα πρώτα 60 γεγονότα — για έναν
// παλιό πελάτη τα παλιότερα απλά εξαφανίζονταν χωρίς ένδειξη ότι υπάρχουν κι άλλα. Αντί για νέο
// "Δες παλιότερα" κουμπί, ΕΠΑΝΑΧΡΗΣΙΜΟΠΟΙΕΙ το ήδη υπάρχον homeCard (tabs/home-diets.js) — το ίδιο
// component που δείχνει τις κάρτες της Αρχικής: πάνω από maxRows, ΟΛΑ τα γεγονότα μπαίνουν σε
// scrollable σώμα με το συνολικό πλήθος ως badge, αντί να κόβονται. Το δικό του σχόλιο εξηγεί γιατί
// ΟΧΙ ένα "+N ακόμα"/κουμπί: δοκιμάστηκε παλιότερα στην Αρχική και δεν πατιόταν.
function progressTimelineHtml(items){
  if(!items.length) return '<div class="hm-card"><div class="hm-card-title">🗂 Ιστορικό</div><div class="hm-empty">Κανένα καταγεγραμμένο γεγονός ακόμα.</div></div>';
  var rows=items.map(function(e){
    return '<div class="hm-row" style="cursor:default;align-items:flex-start">'
      +'<span style="width:20px;flex-shrink:0">'+e.icon+'</span>'
      +'<span style="flex:1;min-width:0"><b style="font-size:12px">'+e.title+'</b>'
      +(e.detail?'<div class="hm-row-sub" style="white-space:normal">'+e.detail+'</div>':'')
      +'</span>'
      +'<span class="hm-row-sub">'+esc(e.date)+'</span>'
      +'</div>';
  });
  return (typeof homeCard==='function')?homeCard('🗂 Ιστορικό',rows,null,'info',20):'<div class="hm-card"><div class="hm-card-title">🗂 Ιστορικό</div>'+rows.join('')+'</div>';
}
// Χειροκίνητη καταγραφή επικοινωνίας — για επαφή ΕΚΤΟΣ app (τηλεφώνημα, δια ζώσης) που καμία από
// τις υπάρχουσες WhatsApp/email συναρτήσεις δεν θα καταγράψει μόνη της.
function progressMarkContactedNow(id){
  var c=clients.find(function(x){return x.id===id;});
  if(!c) return;
  markDietologistContacted(c);
  save();
  openProgressClient(id);
}
function openProgressClient(id){
  var c=clients.find(function(x){return x.id===id;});
  var main=document.getElementById('main');
  if(!c || !main) return;
  var rows=(window.Cloud && window.Cloud.checkinsFor && c.shareToken)?window.Cloud.checkinsFor(c):[];
  var expDays=progressDaysUntilExpiry(c);
  var planTxt=expDays==null?'Χωρίς ενεργό πλάνο':(expDays<0?'Το πλάνο έχει λήξει':'Ενεργό πλάνο · λήγει σε '+expDays+' ημέρες');
  var contactDays=c.lastDietologistContact?Math.floor((Date.now()-c.lastDietologistContact)/86400000):null;
  var contactTxt=contactDays==null?'Καμία καταγεγραμμένη επικοινωνία ακόμα':('📞 Τελ. επικοινωνία: '+(contactDays===0?'σήμερα':'πριν '+contactDays+' ημέρες'));
  var html='<div class="hm-wrap">';
  html+='<div class="hm-title"><span onclick="renderProgress()" style="cursor:pointer;color:var(--teal);font-weight:600;font-size:14px">← Πίσω σε όλους</span></div>';
  html+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">'
    +'<div class="hm-avatar hm-avatar-teal" style="width:40px;height:40px;font-size:15px">'+initials(c.name)+'</div>'
    +'<div><div style="font-size:17px;font-weight:700">'+esc(c.name||'')+(c.group?' <span class="cc-group-tag">🏷️ '+esc(c.group)+'</span>':'')+'</div>'
    +'<div class="hm-row-sub">'+esc(planTxt)+' · '+esc(contactTxt)+'</div></div>'
    +'<div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">'
    +'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal)" title="Κατέγραψε επικοινωνία εκτός app (τηλέφωνο, δια ζώσης)" onclick="progressMarkContactedNow(\''+c.id+'\')">📞 Σημείωσε επικοινωνία</button>'
    +'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal)" title="Άνοιγμα στα Μηνύματα" onclick="progressOpenMessages(\''+escJsAttr(c.name)+'\')">✉️ Μηνύματα</button>'
    +'<button type="button" class="hm-action-btn" onclick="selectClient(\''+c.id+'\');swTab(1)">Άνοιγμα πλήρους καρτέλας</button>'
    +'</div></div>';
  html+=progressAdherenceChartPanel(c,rows);
  html+=(typeof progressWeightPanelHtml==='function')?progressWeightPanelHtml(c):'';
  html+='<div style="margin-top:14px">'+progressTimelineHtml(progressBuildTimeline(c))+'</div>';
  html+='</div>';
  main.innerHTML=html;
}

// ── Phase 4 (2026-09-15, μετά από mockup συζήτησης): γράφημα βάρους αντί για το διπλό panel ──────
// Το openProgressClient καλούσε ΑΥΤΟΥΣΙΟ το buildClientProgressHtml εδώ (score/streak/πυλώνες
// τρέχουσας εβδομάδας/4-εβδ. μπάρες/14-ημ. sparkline) — όλα ήδη καλυμμένα, και σε μεγαλύτερο βάθος
// χρόνου, από το progressAdherenceChartPanel ΑΠΟ ΠΑΝΩ του στην ίδια σελίδα. Το μόνο πραγματικά
// μοναδικό κομμάτι ήταν το weightStrip (δήλωση βάρους πελάτη vs δική σου μέτρηση) — τώρα ξεχωριστή
// συνάρτηση (clientWeightStripHtml, client-editor/form-controls.js) ώστε να μη ξαναγραφτεί εδώ. Το
// γράφημα βάρους στον χρόνο χρησιμοποιεί το ΙΔΙΟ γενικό sparkline component (apptSparkline,
// appointments/appointments.js) που ήδη σχεδιάζει το γράφημα στόχου θερμίδων στο "📝 Ραντεβού" —
// όχι νέο chart-εργαλείο. buildClientProgressHtml παραμένει άθικτο ως fallback (appointments.js).
function progressWeightPanelHtml(c){
  var wl=(c.weightLog||[]).filter(function(w){return w.weight>0;});
  var stripHtml=(typeof clientWeightStripHtml==='function')?clientWeightStripHtml(c):'';
  if(wl.length<2) return stripHtml?('<div class="tracker-section"><div class="tracker-head">⚖️ Βάρος</div>'+stripHtml+'</div>'):'';
  var vals=wl.map(function(w){return w.weight;});
  var mn=Math.min.apply(null,vals), mx=Math.max.apply(null,vals);
  if(mn===mx){mn-=1;mx+=1;}
  var chart=(typeof apptSparkline==='function')?apptSparkline(wl,'weight','#025857','Βάρος (kg) — τελευταίες '+wl.length+' μετρήσεις',mn,mx):'';
  return '<div class="tracker-section"><div class="tracker-head">⚖️ Βάρος</div>'+stripHtml+chart+'</div>';
}

// ── Phase 3: μίκρυνση του παλιού per-client panel ───────────────────────────────────────────────
// Το "📝 Ραντεβού" tab (buildAppointmentsHtml, js/appointments/appointments.js) καλούσε ΑΥΤΟΥΣΙΟ το
// buildClientProgressHtml εκεί — σκορ/streak/πυλώνες/4-εβδ. μπάρες/14-ημ. sparkline, τα ΙΔΙΑ που
// τώρα δείχνει πλήρη το tab "📈 Πρόοδος (και σε μεγαλύτερο βάθος, 10 εβδ.). Δύο πλήρη αντίγραφα του
// ίδιου panel σε δύο tabs δεν προσθέτουν κάτι, απλά διπλασιάζουν τι πρέπει να προσέχεις όταν αλλάζει
// κάτι εκεί. Αυτό αντικαθιστά εκείνη την κλήση με μια συμπτυγμένη περίληψη (σκορ/trend/streak) +
// λινκ για το πλήρες ιστορικό — ό,τι είναι ΜΟΝΑΔΙΚΟ στο Ραντεβού (π.χ. "↔️ Από το προηγούμενο
// ραντεβού", clientLogsPanelHtml/planFeedbackPanelHtml με τα δικά τους reply/resolve κουμπιά) μένει
// εκεί ανέγγιχτο.
function progressCompactSummaryHtml(c){
  if(!c.shareToken) return '';
  var openLink='<a href="javascript:void(0)" onclick="swTab(10);openProgressClient(\''+c.id+'\')" style="font-size:11px;font-weight:600;color:var(--teal);white-space:nowrap">Πλήρες ιστορικό (γράφημα 10 εβδ., timeline) →</a>';
  var rows=(window.Cloud&&window.Cloud.checkinsFor)?window.Cloud.checkinsFor(c):[];
  if(!rows.length){
    return '<div class="tracker-section"><div class="tracker-head" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">'
      +'<span>📲 Πρόοδος πελάτη (portal)</span>'+openLink+'</div>'
      +'<div style="font-size:12px;color:#888;padding:6px 0">Ο πελάτης δεν έχει κάνει ακόμα check-in στο πλάνο του.</div></div>';
  }
  var byDate=ckRowsByDate(rows);
  var score=ckWeekScore(byDate,0), prevScore=ckWeekScore(byDate,-1), streak=ckStreak(byDate);
  var trendChip='';
  if(score!=null && prevScore!=null){
    var dS=score-prevScore;
    if(dS>=CK_TREND_MIN_PP) trendChip=' <span style="font-size:11px;font-weight:700;color:var(--good)">▲ +'+dS+'</span>';
    else if(dS<=-CK_TREND_MIN_PP) trendChip=' <span style="font-size:11px;font-weight:700;color:#c62828">▼ '+dS+'</span>';
  }
  return '<div class="tracker-section">'
    +'<div class="tracker-head" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">'
    +'<span>📲 Πρόοδος πελάτη (portal)</span>'+openLink+'</div>'
    +'<div style="font-size:13px"><b style="font-size:20px;color:#025857">'+(score==null?'—':score+'%')+'</b> σκορ εβδομάδας'+trendChip
    +' &nbsp; 🔥 <b>'+streak+'</b> μέρες σερί</div></div>';
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

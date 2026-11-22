/* ── Ενεργός / Σε παύση / Πρώην (2026-11-22) ─────────────────────────────────────────────
   Ο κύκλος ζωής ενός πελάτη, ώστε οι λίστες «χρειάζονται προσοχή» να αφορούν μόνο όσους
   όντως παρακολουθείς. Πριν, όποιος είχε πάρει κάποτε πλάνο έμενε «ενεργός» για πάντα και η
   Αρχική γέμιζε με «το πλάνο έγινε πριν 40–138 ημέρες».

   • Πρώην      = το υπάρχον c.archived (ίδιο πεδίο, νέο όνομα στο UI). Κρυφός από λίστες/μετρητές,
                  μένει στους Πελάτες → «📦 Πρώην πελάτες», η βιβλιοθήκη γεύσης ⭐ τον χρησιμοποιεί κανονικά.
   • Σε παύση   = c.pausedUntil ('YYYY-MM-DD'). Μένει στη λίστα πελατών με σήμα ⏸, αλλά ΔΕΝ ζητάει
                  προσοχή (ανανέωση, υπενθυμίσεις, μετρήσεις). Μηνύματα/χαμηλό feedback/🚩 φαίνονται κανονικά.
                  Λήγει μόνο του την ημερομηνία.
   • Ενεργός    = όλοι οι άλλοι.

   Πρόταση «Πρώην»: ενεργός, όχι σε παύση/αναμονή, χωρίς μελλοντικό ραντεβού, και καμία δραστηριότητα
   (μέτρηση, πλάνο, αποστολή, ραντεβού, check-in, μήνυμα, αξιολόγηση) για LC_FORMER_DAYS. Ποτέ αυτόματα:
   η Αρχική δείχνει κάρτα και ο διαιτολόγος επιβεβαιώνει. Ως τότε δεν εμφανίζονται ως «προσοχή».
   Επιστροφή στους Ενεργούς αυτόματα: νέα μέτρηση, αποστολή πλάνου, ή (για Πρώην) νέα κίνηση του πελάτη
   στον σύνδεσμο μετά τη μετακίνηση. */

var LC_FORMER_DAYS=60;
var LC_DAY=86400000;

function lcDateKey(d){ d=d||new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function lcAddDays(n){ var d=new Date(); d.setDate(d.getDate()+n); return lcDateKey(d); }
function lcFmtDM(key){ if(!key) return ''; var p=String(key).slice(0,10).split('-'); return p[2]+'/'+p[1]; }
function lcParse(s){ if(!s) return 0; if(typeof s==='number') return s; var str=String(s); var t=Date.parse(str.length===10?str+'T12:00:00':str); return isNaN(t)?0:t; }

function lcIsFormer(c){ return !!(c && c.archived && !c.deleted); }
function lcIsPaused(c){ return !!(c && !c.deleted && !c.archived && c.pausedUntil && c.pausedUntil>=lcDateKey()); }
function lcState(c){ return lcIsFormer(c)?'former':(lcIsPaused(c)?'paused':'active'); }

// Ημερομηνία δημιουργίας από το id ('c'+Date.now()), αν υπάρχει.
function lcCreatedMs(c){ var m=/^c(\d{13})/.exec((c&&c.id)||''); var t=m?+m[1]:0; return (t && t<=Date.now()+LC_DAY)?t:0; }

// Πιο πρόσφατη δραστηριότητα (δική σου ή του πελάτη) → {t, what}.
function lcLastActivity(c){
  var best={t:0,what:''};
  function consider(t,what){ if(t && t>best.t && t<=Date.now()+LC_DAY) best={t:t,what:what}; }
  var wl=c.weightLog||[];
  if(wl.length) consider(lcParse(wl[wl.length-1].date),'μέτρηση');
  consider(+c.planGeneratedAt||0,'πλάνο');
  (c.savedPlans||[]).forEach(function(p){ consider(lcParse(p.date||p.createdAt), p.kind==='sent'?'αποστολή πλάνου':'αποθήκευση πλάνου'); });
  (c.appointments||[]).forEach(function(a){ consider(lcParse(a.date),'ραντεβού'); });
  (c.consultLog||[]).forEach(function(a){ consider(lcParse(a.date),'σημείωση συνεδρίας'); });
  var C=window.Cloud;
  if(C){
    try{
      var ck=C.checkinsFor?C.checkinsFor(c):[];
      ck.forEach(function(r){ consider(lcParse(r.date),'check-in'); });
      var logs=C.allClientLogsFor?C.allClientLogsFor(c):[];
      if(logs.length) consider(lcParse(logs[0].date),'μήνυμα πελάτη');
      var fb=C.planFeedbackFor?C.planFeedbackFor(c):[];
      if(fb.length) consider(lcParse(fb[0].week_start),'αξιολόγηση');
    }catch(e){}
  }
  consider(+c.lcActiveSince||0,'επέστρεψε στους ενεργούς');
  consider(lcCreatedMs(c),'νέος πελάτης');
  return best;
}

// 📵 Χρήση του link από τον πελάτη (2026-11-22, δεδομένα χρήσης: 19/82 ενεργοί δεν τσέκαραν ποτέ
// τίποτα, 19 σταμάτησαν 30+ μέρες). Η «Χρειάζονται υπενθύμιση» πιάνει μόνο όσους είχαν ξεκινήσει.
//   {state:'never',  days}  — ΚΑΜΙΑ σημείωση (γεύμα/νερό/συμπλήρωμα), πλάνο σταλμένο πριν ≥ LINK_NEVER_MIN_DAYS
//   {state:'stopped',days}  — σημείωνε, τελευταία φορά πριν ≥ LINK_STOPPED_DAYS
//   {state:'active', days}  — αλλιώς
// null = δεν ξέρουμε (χωρίς link/πλάνο, πρώην, ή τα check-ins δεν έχουν φορτώσει ακόμα).
var LINK_NEVER_MIN_DAYS=3, LINK_STOPPED_DAYS=14;
function lcFirstSentKey(c){
  var keys=[];
  (c.savedPlans||[]).forEach(function(p){
    if(p.sentDates && p.sentDates.length) keys=keys.concat(p.sentDates);
    else if(p.date) keys.push(p.date);
  });
  if(c.planGeneratedAt) keys.push(lcDateKey(new Date(+c.planGeneratedAt)));
  keys=keys.filter(Boolean).map(function(k){ return String(k).slice(0,10); }).sort();
  return keys[0]||null;
}
function linkUsage(c){
  var C=window.Cloud;
  if(!c || c.deleted || c.archived || !c.shareToken || !c._publishedPlanHash) return null;
  if(!C || typeof C.checkinsFor!=='function' || (C.enabled && C.user && !C._checkinsLoaded)) return null;
  var first=lcFirstSentKey(c); if(!first) return null;
  var today=lcDateKey(), DAY=LC_DAY;
  var since=function(k){ return Math.round((lcParse(today)-lcParse(k))/DAY); };
  var act=C.checkinsFor(c).filter(function(r){ return (r.meals_done||0)>0 || (r.water_glasses||0)>0 || (r.supps_done||0)>0; })
    .map(function(r){ return r.date; });
  if(typeof C.mealLogFor==='function'){
    var ml=C.mealLogFor(c);
    Object.keys(ml).forEach(function(k){ var m=ml[k]||{}; if(Object.keys(m).some(function(i){ return m[i]; })) act.push(k); });
  }
  act.sort();
  if(!act.length){
    var d=since(first);
    return d>=LINK_NEVER_MIN_DAYS?{state:'never',days:d}:null;
  }
  var gap=since(act[act.length-1]);
  return {state:gap>=LINK_STOPPED_DAYS?'stopped':'active', days:gap};
}

// Οι προτάσεις περιμένουν τα 3 caches του συνδέσμου (αλλιώς η δραστηριότητα θα φαινόταν ψευδώς παλιά).
function lcPortalReady(){
  var C=window.Cloud;
  if(!C || !C.enabled || !C.user) return true;
  return !!(C._checkinsLoaded && C._clientLogsLoaded && C._planFeedbackLoaded);
}

function lcFormerCandidates(){
  if(!lcPortalReady() || typeof clients==='undefined') return [];
  var now=Date.now(), today=lcDateKey();
  return clients.filter(function(c){ return !c.deleted && !c.archived && !lcIsPaused(c); })
    .filter(function(c){ return !(c.lcKeepUntil && now<c.lcKeepUntil); })
    .filter(function(c){ return !(c.nextAppointmentDate && c.nextAppointmentDate>=today); })
    .filter(function(c){ return !(typeof clientIsWaiting==='function' && clientIsWaiting(c)); })
    .map(function(c){ return {c:c,last:lcLastActivity(c)}; })
    .filter(function(x){ return x.last.t && (now-x.last.t)/LC_DAY>=LC_FORMER_DAYS; })
    .sort(function(a,b){ return a.last.t-b.last.t; });
}

// Πελάτες που ΔΕΝ ζητάνε προσοχή για διαχειριστικούς λόγους (ανανέωση, μέτρηση, υπενθύμιση):
// σε παύση + προτεινόμενοι για Πρώην. {id:true}. Κρατιέται 1,5 s (καλείται ανά πελάτη μέσα σε render
// λιστών — χωρίς cache θα ξαναϋπολόγιζε τις προτάσεις για κάθε έναν). Μηδενίζεται σε κάθε αλλαγή.
var _lcQuietCache={t:0,m:null};
function lcQuietMap(){
  if(_lcQuietCache.m && Date.now()-_lcQuietCache.t<1500) return _lcQuietCache.m;
  var m={};
  if(typeof clients!=='undefined'){
    clients.forEach(function(c){ if(lcIsPaused(c)) m[c.id]=true; });
    lcFormerCandidates().forEach(function(x){ m[x.c.id]=true; });
  }
  _lcQuietCache={t:Date.now(),m:m};
  return m;
}
function lcIsQuiet(c){ return !!(c && lcQuietMap()[c.id]); }
function lcInvalidate(){ _lcQuietCache={t:0,m:null}; }

function lcFind(id){ return (typeof clients!=='undefined')?clients.find(function(x){ return x.id===id; }):null; }
function lcRerender(){
  lcInvalidate();
  if(typeof renderSB==='function') renderSB();
  if(typeof curId!=='undefined' && curId===null && typeof curTab!=='undefined'){
    if(curTab===0 && typeof renderHome==='function') renderHome();
    if(curTab===5 && typeof renderDiets==='function') renderDiets();
    if(curTab===10 && typeof renderProgress==='function') renderProgress();
  }
  var slot=document.getElementById('lc-banner-slot'), cur=(typeof getC==='function')?getC():null;
  if(slot && cur) slot.innerHTML=lcBannerHtml(cur);
  var hb=document.getElementById('client-lc-btn');
  if(hb && cur) hb.outerHTML=lcHeaderBtnHtml(cur);
}

// ── Αλλαγές κατάστασης ──
function lcSetFormer(c){
  if(!c) return;
  c.archived=true; c.archivedAt=new Date().toISOString();
  delete c.pausedUntil; delete c.pausedAt; delete c.lcKeepUntil;
}
function lcSetPaused(c,untilKey){
  if(!c) return;
  if(c.archived){ c.archived=false; delete c.archivedAt; }
  c.pausedUntil=untilKey; c.pausedAt=new Date().toISOString();
  delete c.lcKeepUntil;
}
function lcSetActive(c){
  if(!c) return;
  if(c.archived){ c.archived=false; delete c.archivedAt; }
  delete c.pausedUntil; delete c.pausedAt;
  c.lcActiveSince=Date.now();   // αλλιώς θα ξαναπροτεινόταν αμέσως για Πρώην
}
// «Είναι ενεργός» από την κάρτα προτάσεων: μην τον ξαναπροτείνεις για LC_FORMER_DAYS.
function lcKeepActive(c){ if(c){ c.lcKeepUntil=Date.now()+LC_FORMER_DAYS*LC_DAY; } }

// Καλείται από μέτρηση (tracker.js) και αποστολή πλάνου (app-part7.js publishPlan).
// dateStr: η ημερομηνία της μέτρησης — μια παλιά (π.χ. εισαγωγή CSV ιστορικού) δεν επαναφέρει.
function lcBackToActive(c,why,dateStr){
  if(!c || (!c.archived && !c.pausedUntil)) return false;
  if(dateStr){ var t=lcParse(dateStr); if(t && (Date.now()-t)/LC_DAY>LC_FORMER_DAYS) return false; }
  var wasFormer=!!c.archived, wasPaused=lcIsPaused(c);
  lcSetActive(c); lcInvalidate();
  if((wasFormer||wasPaused) && typeof dietoToast==='function')
    dietoToast('↩️ '+(c.name||'Ο πελάτης')+': ξανά στους Ενεργούς ('+why+')','#025857');
  return true;
}

// Μετά από κάθε ανανέωση των caches του συνδέσμου: Πρώην που ξαναέκανε check-in / έγραψε / αξιολόγησε
// ΜΕΤΑ τη μετακίνηση ⇒ πίσω στους Ενεργούς (αλλιώς το μήνυμά του δεν θα φαινόταν πουθενά).
function lcAfterPortalRefresh(){
  var C=window.Cloud;
  if(!C || typeof clients==='undefined') return;
  var changed=[];
  clients.forEach(function(c){
    if(!lcIsFormer(c) || !c.archivedAt) return;
    var since=lcDateKey(new Date(c.archivedAt));
    var hit=null;
    try{
      var ck=C.checkinsFor?C.checkinsFor(c):[];
      if(ck.some(function(r){ return r.date>since; })) hit='νέο check-in';
      var logs=C.allClientLogsFor?C.allClientLogsFor(c):[];
      if(!hit && logs.some(function(r){ return r.date>since; })) hit='νέο μήνυμα';
      var fb=C.planFeedbackFor?C.planFeedbackFor(c):[];
      if(!hit && fb.some(function(r){ return r.week_start>since; })) hit='νέα αξιολόγηση';
    }catch(e){}
    if(hit){ lcSetActive(c); lcInvalidate(); changed.push((c.name||'Πελάτης')+' ('+hit+')'); }
  });
  if(changed.length){
    if(typeof save==='function') save();
    if(typeof dietoToast==='function') dietoToast('↩️ Ξανά στους Ενεργούς: '+changed.join(', '),'#025857');
  }
}

// ── Αρχική: κάρτα πρότασης + σύνοψη ──
function lcHomeCardHtml(){
  var cand=lcFormerCandidates();
  var paused=clients.filter(lcIsPaused).length;
  var former=clients.filter(lcIsFormer).length;
  var active=clients.filter(function(c){ return !c.deleted && !c.archived; }).length-paused-cand.length;
  var summary='<div class="lc-summary">'
    +'<span><b>'+active+'</b> ενεργοί</span>'
    +(paused?'<span><b>'+paused+'</b> σε παύση</span>':'')
    +(cand.length?'<span><b>'+cand.length+'</b> ανενεργοί 60+ μέρες</span>':'')
    +'<span class="lc-summary-link" role="button" tabindex="0" onclick="lcGoToFormer()" onkeydown="if(event.key===\'Enter\')lcGoToFormer()"><b>'+former+'</b> πρώην</span>'
    +'</div>';
  if(!cand.length) return summary;
  return summary+'<div class="lc-suggest">'
    +'<div class="lc-suggest-txt"><b>💤 '+cand.length+' πελάτ'+(cand.length===1?'ης':'ες')+' χωρίς δραστηριότητα πάνω από '+LC_FORMER_DAYS+' μέρες</b>'
    +'<span>Χωρίς μέτρηση, πλάνο, ραντεβού ή κίνηση στον σύνδεσμο. Δεν σου ζητάνε πια προσοχή εδώ. Μετακίνησέ τους στους Πρώην ή βάλ\' τους σε παύση.</span></div>'
    +'<button type="button" class="hm-action-btn" onclick="lcOpenReviewModal()">Έλεγχος</button>'
    +'</div>';
}
function lcGoToFormer(){
  if(typeof swTab==='function') swTab(7);
  try{ localStorage.setItem('clientsArchivedCollapsed','0'); }catch(e){}
  if(typeof renderSB==='function') renderSB();
  setTimeout(function(){ var el=document.getElementById('lc-former-anchor'); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); },60);
}

// ── Παράθυρο ελέγχου προτάσεων ──
var LC_CHOICES=[['former','📦 Πρώην'],['p30','⏸ Παύση 1 μήνα'],['p60','⏸ Παύση 2 μήνες'],['p90','⏸ Παύση 3 μήνες'],['keep','✓ Είναι ενεργός']];
function lcOverlay(id,inner){
  var ov=document.getElementById(id); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id=id; ov.className='wait-overlay';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML=inner; document.body.appendChild(ov); return ov;
}
function lcAgoTxt(t){ var d=Math.floor((Date.now()-t)/LC_DAY); return d>=60?Math.round(d/30)+' μήνες':d+' μέρες'; }
function lcOpenReviewModal(){
  var cand=lcFormerCandidates();
  if(!cand.length){ if(typeof dietoToast==='function') dietoToast('Δεν υπάρχουν πελάτες για έλεγχο.'); return; }
  var opts=function(sel){ return LC_CHOICES.map(function(o){ return '<option value="'+o[0]+'"'+(o[0]===sel?' selected':'')+'>'+o[1]+'</option>'; }).join(''); };
  var rows=cand.map(function(x){
    var c=x.c;
    return '<div class="lc-row">'
      +'<div class="lc-row-main"><div class="lc-row-name">'+esc(c.name||'Νέος πελάτης')+(c.isMealTemplate?' <span title="Πρότυπο γεύσης — τα γεύματά του χρησιμοποιούνται κανονικά και ως Πρώην">⭐</span>':'')+'</div>'
      +'<div class="lc-row-sub">τελευταία: '+esc(x.last.what)+' πριν '+lcAgoTxt(x.last.t)+' ('+lcFmtDM(lcDateKey(new Date(x.last.t)))+')</div></div>'
      +'<select class="lc-row-sel" data-id="'+esc(c.id)+'" aria-label="Τι να γίνει με '+esc(c.name||'τον πελάτη')+'">'+opts('former')+'</select>'
      +'</div>';
  }).join('');
  lcOverlay('lc-overlay','<div class="wait-modal lc-modal" role="dialog" aria-modal="true" aria-labelledby="lc-modal-title">'
    +'<div class="wait-modal-head"><div><div id="lc-modal-title" class="wait-modal-title">💤 '+cand.length+' πελάτες χωρίς δραστηριότητα</div>'
    +'<div class="wait-modal-sub">Πάνω από '+LC_FORMER_DAYS+' μέρες χωρίς μέτρηση, πλάνο, ραντεβού ή κίνηση στον σύνδεσμο</div></div>'
    +'<button type="button" class="wait-x" aria-label="Κλείσιμο" onclick="document.getElementById(\'lc-overlay\').remove()">✕</button></div>'
    +'<div class="lc-help">Δεν διαγράφεται τίποτα. Οι <b>Πρώην</b> φεύγουν από τις λίστες και τους μετρητές και μένουν στους Πελάτες → «📦 Πρώην πελάτες». '
    +'Όποιος είναι <b>σε παύση</b> μένει στη λίστα με ⏸ αλλά δεν σου ζητάει προσοχή μέχρι την ημερομηνία. '
    +'Επιστρέφουν μόνοι τους στους Ενεργούς με νέα μέτρηση, νέο πλάνο ή κίνηση στον σύνδεσμο.</div>'
    +'<div class="lc-bulk">Όλοι: '+LC_CHOICES.map(function(o){ return '<button type="button" class="wait-quick" onclick="lcSetAllChoices(\''+o[0]+'\')">'+o[1]+'</button>'; }).join('')+'</div>'
    +'<div class="lc-rows">'+rows+'</div>'
    +'<div class="wait-actions"><span id="lc-apply-sum" class="lc-apply-sum"></span><span style="flex:1"></span>'
    +'<button type="button" class="wait-btn" onclick="document.getElementById(\'lc-overlay\').remove()">Άκυρο</button>'
    +'<button type="button" class="wait-btn wait-btn-primary" onclick="lcApplyReview()">Εφαρμογή</button></div>'
    +'</div>');
  document.querySelectorAll('#lc-overlay .lc-row-sel').forEach(function(s){ s.addEventListener('change',lcUpdateApplySum); });
  lcUpdateApplySum();
}
function lcSetAllChoices(v){ document.querySelectorAll('#lc-overlay .lc-row-sel').forEach(function(s){ s.value=v; }); lcUpdateApplySum(); }
function lcUpdateApplySum(){
  var n={former:0,pause:0,keep:0};
  document.querySelectorAll('#lc-overlay .lc-row-sel').forEach(function(s){ if(s.value==='former') n.former++; else if(s.value==='keep') n.keep++; else n.pause++; });
  var el=document.getElementById('lc-apply-sum');
  if(el) el.textContent=[n.former?n.former+' → Πρώην':'',n.pause?n.pause+' → παύση':'',n.keep?n.keep+' μένουν ενεργοί':''].filter(Boolean).join(' · ');
}
function lcApplyReview(){
  var done=0;
  document.querySelectorAll('#lc-overlay .lc-row-sel').forEach(function(s){
    var c=lcFind(s.getAttribute('data-id')); if(!c) return;
    var v=s.value;
    if(v==='former') lcSetFormer(c);
    else if(v==='keep') lcKeepActive(c);
    else lcSetPaused(c,lcAddDays(parseInt(v.slice(1),10)));
    done++;
  });
  var ov=document.getElementById('lc-overlay'); if(ov) ov.remove();
  if(done){
    if(typeof save==='function') save();
    if(typeof dietoToast==='function') dietoToast('✓ Ενημερώθηκαν '+done+' πελάτες','#025857');
  }
  lcRerender();
}

// ── Καρτέλα πελάτη: κουμπί κατάστασης + λωρίδα ──
function lcHeaderBtnHtml(c){
  var st=lcState(c);
  var lbl=st==='former'?'📦 Πρώην':(st==='paused'?'⏸ Σε παύση':'● Ενεργός');
  return '<button type="button" id="client-lc-btn" class="btn lc-head-btn lc-'+st+'" onclick="lcOpenClientModal(\''+c.id+'\')" title="Κατάσταση πελάτη: Ενεργός / Σε παύση / Πρώην">'+lbl+' ▾</button>';
}
function lcBannerHtml(c){
  var st=lcState(c);
  if(st==='active') return '';
  if(st==='paused') return '<div class="lc-banner lc-banner-paused"><span>⏸ <b>Σε παύση έως '+lcFmtDM(c.pausedUntil)+'</b> · δεν εμφανίζεται σε υπενθυμίσεις και ανανεώσεις μέχρι τότε</span>'
    +'<button type="button" class="wait-pill" onclick="lcClientSet(\''+c.id+'\',\'active\')">Τέλος παύσης</button></div>';
  return '<div class="lc-banner lc-banner-former"><span>📦 <b>Πρώην πελάτης</b>'+(c.archivedAt?' από '+lcFmtDM(c.archivedAt):'')+' · δεν εμφανίζεται σε λίστες και μετρητές. Γυρίζει μόνος του με νέα μέτρηση ή πλάνο.</span>'
    +'<button type="button" class="wait-pill" onclick="lcClientSet(\''+c.id+'\',\'active\')">Επαναφορά στους Ενεργούς</button></div>';
}
function lcOpenClientModal(id){
  var c=lcFind(id); if(!c) return;
  var st=lcState(c);
  var btn=function(v,label,sub,on){ return '<button type="button" class="lc-opt'+(on?' on':'')+'" onclick="lcClientSet(\''+c.id+'\',\''+v+'\')"><b>'+label+'</b><span>'+sub+'</span></button>'; };
  lcOverlay('lc-client-overlay','<div class="wait-modal" role="dialog" aria-modal="true" aria-labelledby="lc-client-title">'
    +'<div class="wait-modal-head"><div><div id="lc-client-title" class="wait-modal-title">Κατάσταση πελάτη</div><div class="wait-modal-sub">'+esc(c.name||'Νέος πελάτης')+'</div></div>'
    +'<button type="button" class="wait-x" aria-label="Κλείσιμο" onclick="document.getElementById(\'lc-client-overlay\').remove()">✕</button></div>'
    +'<div class="lc-opts">'
    +btn('active','● Ενεργός','τον παρακολουθείς κανονικά',st==='active')
    +btn('p30','⏸ Παύση 1 μήνα','έως '+lcFmtDM(lcAddDays(30))+', χωρίς υπενθυμίσεις',false)
    +btn('p60','⏸ Παύση 2 μήνες','έως '+lcFmtDM(lcAddDays(60)),false)
    +btn('p90','⏸ Παύση 3 μήνες','έως '+lcFmtDM(lcAddDays(90)),false)
    +btn('former','📦 Πρώην','έξω από λίστες και μετρητές, μένει στο αρχείο',st==='former')
    +'</div>'
    +(st==='paused'?'<div class="lc-help" style="margin-top:10px">Τώρα: σε παύση έως '+lcFmtDM(c.pausedUntil)+'.</div>':'')
    +'</div>');
}
function lcClientSet(id,v){
  var c=lcFind(id); if(!c) return;
  if(v==='active') lcSetActive(c);
  else if(v==='former') lcSetFormer(c);
  else lcSetPaused(c,lcAddDays(parseInt(v.slice(1),10)));
  var ov=document.getElementById('lc-client-overlay'); if(ov) ov.remove();
  if(typeof save==='function') save();
  lcRerender();
}

// Σήμα στις κάρτες/γραμμές της λίστας πελατών.
function lcBadgeHtml(c){
  return lcIsPaused(c)?'<span class="lc-badge" title="Σε παύση έως '+lcFmtDM(c.pausedUntil)+'">⏸ έως '+lcFmtDM(c.pausedUntil)+'</span>':'';
}

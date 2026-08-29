// js/client-list/quick-actions.js
// The sidebar quick-action sheets — 'Νέο πλάνο / Γρήγορη μέτρηση / Γρήγορο ραντεβού'
// and the mobile 'Περισσότερα' more-sheet — extracted verbatim from js/app-part1.js
// (module split wave 34): closeAllQA, toggleQA, qaMatchingClients, qaPlanStatusText,
// renderQANewPlan / renderQAQuickMeasure / renderQAQuickAppt, qaStart*/qaCreateAnd*,
// toggleMoreSheet, _moreSheetEscHandler, openMoreSheet, closeMoreSheet,
// closeAllMSheetQA, toggleMSheetQA, renderMSheetQA. Only `var _moreSheetEscHandler =
// null` runs at parse time. Every caller is an onclick string / app-part5 handler —
// all runtime. Loads right after client-list/roster-ui.js.

/* ===== Γρήγορες ενέργειες πλαϊνής μπάρας: Νέο πλάνο / Γρήγορη μέτρηση ===== */
function closeAllQA(){
  ['qa-newplan','qa-quickmeasure','qa-quickappt'].forEach(function(p){
    var panel=document.getElementById(p);
    var btn=document.getElementById('qa-toggle-'+p.replace('qa-',''));
    if(panel) panel.style.display='none';
    if(btn) btn.setAttribute('aria-expanded','false');
  });
}

function toggleQA(id){
  var panel=document.getElementById(id);
  var wasOpen = panel && panel.style.display==='block';
  closeAllQA();
  if(!wasOpen && panel){
    panel.style.display='block';
    var btn=document.getElementById('qa-toggle-'+id.replace('qa-',''));
    if(btn) btn.setAttribute('aria-expanded','true');
    var inp=document.getElementById(id+'-input');
    if(inp){ inp.value=''; inp.focus(); }
    if(id==='qa-newplan') renderQANewPlan('');
    else if(id==='qa-quickmeasure') renderQAQuickMeasure('');
    else renderQAQuickAppt('');
  }
}

function qaMatchingClients(q){
  q=(q||'').toLowerCase().trim();
  return clients.filter(function(c){
    return !c.deleted && !c.archived && (!q || (c.name||'').toLowerCase().indexOf(q)>-1);
  }).sort(function(a,b){ return (a.name||'').localeCompare(b.name||'','el'); });
}

function qaPlanStatusText(c){
  if(!c.weekPlan || !Object.keys(c.weekPlan).length) return 'χωρίς πλάνο';
  if(window.Cloud && window.Cloud.isStale && window.Cloud.isStale(c)) return 'ο σύνδεσμος είναι ξεπερασμένος';
  return 'έχει ενεργό πλάνο';
}

function renderQANewPlan(q){
  var results=document.getElementById('qa-newplan-results'); if(!results) return;
  var list=qaMatchingClients(q), html='';
  list.forEach(function(c){
    html+='<div class="qa-row" onclick="qaStartPlan(\''+c.id+'\')"><span>'+esc(c.name||'Νέος πελάτης')+'</span><span class="qa-row-sub">'+qaPlanStatusText(c)+'</span></div>';
  });
  html+='<div class="qa-row qa-row-new" onclick="qaCreateAndPlan(document.getElementById(\'qa-newplan-input\').value)">+ Δημιούργησε νέο πελάτη'+(q?' «'+esc(q)+'»':'')+'</div>';
  results.innerHTML=html;
}

function renderQAQuickMeasure(q){
  var results=document.getElementById('qa-quickmeasure-results'); if(!results) return;
  var list=qaMatchingClients(q), html='';
  list.forEach(function(c){
    var sub = (c.weightLog && c.weightLog.length) ? ('τελ. μέτρηση '+c.weightLog[c.weightLog.length-1].date) : 'καμία μέτρηση ακόμα';
    html+='<div class="qa-row" onclick="qaStartMeasure(\''+c.id+'\')"><span>'+esc(c.name||'Νέος πελάτης')+'</span><span class="qa-row-sub">'+sub+'</span></div>';
  });
  html+='<div class="qa-row qa-row-new" onclick="qaCreateAndMeasure(document.getElementById(\'qa-quickmeasure-input\').value)">+ Δημιούργησε νέο πελάτη'+(q?' «'+esc(q)+'»':'')+'</div>';
  results.innerHTML=html;
}

function qaStartPlan(id){
  selectClient(id);
  genPlanWithUndo();
  closeAllQA();
}
function qaCreateAndPlan(name){
  addClient(name);
  genPlanWithUndo();
  closeAllQA();
}
function qaStartMeasure(id){
  selectClient(id);
  swTab(3);
  closeAllQA();
}
function qaCreateAndMeasure(name){
  addClient(name);
  swTab(3);
  closeAllQA();
}

function renderQAQuickAppt(q){
  var results=document.getElementById('qa-quickappt-results'); if(!results) return;
  var list=qaMatchingClients(q), html='';
  list.forEach(function(c){
    var lastAppt = c.appointments && c.appointments.length ? c.appointments[c.appointments.length-1] : null;
    var sub = lastAppt ? ((clientHasFlaggedAppointment(c)?'🚩 ':'')+'τελ. ραντεβού '+lastAppt.date) : 'καμία καταχώρηση ακόμα';
    html+='<div class="qa-row" onclick="qaStartAppt(\''+c.id+'\')"><span>'+esc(c.name||'Νέος πελάτης')+'</span><span class="qa-row-sub">'+sub+'</span></div>';
  });
  html+='<div class="qa-row qa-row-new" onclick="qaCreateAndAppt(document.getElementById(\'qa-quickappt-input\').value)">+ Δημιούργησε νέο πελάτη'+(q?' «'+esc(q)+'»':'')+'</div>';
  results.innerHTML=html;
}
function qaStartAppt(id){
  selectClient(id);
  swTab(TAB_APPOINTMENTS);
  closeAllQA();
}
function qaCreateAndAppt(name){
  addClient(name);
  swTab(TAB_APPOINTMENTS);
  closeAllQA();
}

// ✅ 2026-08-22: mobile "Περισσότερα" sheet — βλ. σχόλιο πάνω από το markup στο Dietologist.html.
// Ίδιο accordion μοτίβο με toggleQA/closeAllQA (πάνω), αλλά σε δικά του msheet-qa-* ids ώστε να μη
// συγκρούεται με τα ήδη υπάρχοντα ids του πλαϊνού μενού — και τα δύο σετ στοιχείων συνυπάρχουν στο
// DOM ταυτόχρονα (το πλαϊνό είναι απλά display:none σε κινητό, όχι αφαιρεμένο).
function toggleMoreSheet(){
  var sheet=document.getElementById('more-sheet');
  if(sheet && sheet.style.display==='block') closeMoreSheet(); else openMoreSheet();
}
// ✅ 2026-08-22: a11y polish — Escape κλείνει το sheet, το focus μπαίνει σε αυτό όταν ανοίγει και
// επιστρέφει στο κουμπί "Περισσότερα" όταν κλείνει (πληκτρολόγιο/screen reader, ήταν εντελώς
// mouse/touch-only πριν). _moreSheetEscHandler κρατιέται σε module scope ώστε το removeEventListener
// στο closeMoreSheet να αφαιρεί ΑΚΡΙΒΩΣ τον listener που πρόσθεσε το openMoreSheet — ένα ανώνυμο
// function σε κάθε toggle θα άφηνε πολλαπλά "σκουπίδια" listeners στο document.
var _moreSheetEscHandler=null;
function openMoreSheet(){
  var sheet=document.getElementById('more-sheet'), scrim=document.getElementById('more-scrim'), btn=document.getElementById('more-nav-btn');
  if(!sheet||!scrim) return;
  sheet.style.display='block';
  scrim.style.display='block';
  if(btn) btn.setAttribute('aria-expanded','true');
  sheet.focus();
  _moreSheetEscHandler=function(e){ if(e.key==='Escape') closeMoreSheet(); };
  document.addEventListener('keydown',_moreSheetEscHandler);
}
function closeMoreSheet(){
  var sheet=document.getElementById('more-sheet'), scrim=document.getElementById('more-scrim'), btn=document.getElementById('more-nav-btn');
  var wasOpen = sheet && sheet.style.display==='block';
  if(sheet) sheet.style.display='none';
  if(scrim) scrim.style.display='none';
  if(btn) btn.setAttribute('aria-expanded','false');
  closeAllMSheetQA();
  if(_moreSheetEscHandler){ document.removeEventListener('keydown',_moreSheetEscHandler); _moreSheetEscHandler=null; }
  if(wasOpen && btn) btn.focus();
}
function closeAllMSheetQA(){
  ['newplan','quickmeasure','quickappt'].forEach(function(k){
    var panel=document.getElementById('msheet-qa-'+k);
    var btn=document.getElementById('msheet-qa-toggle-'+k);
    if(panel) panel.style.display='none';
    if(btn) btn.setAttribute('aria-expanded','false');
  });
}
function toggleMSheetQA(kind){
  var panel=document.getElementById('msheet-qa-'+kind);
  var wasOpen = panel && panel.style.display==='block';
  closeAllMSheetQA();
  if(!wasOpen && panel){
    panel.style.display='block';
    var btn=document.getElementById('msheet-qa-toggle-'+kind);
    if(btn) btn.setAttribute('aria-expanded','true');
    var inp=document.getElementById('msheet-qa-'+kind+'-input');
    if(inp){ inp.value=''; inp.focus(); }
    renderMSheetQA(kind,'');
  }
}
// Ίδια λογική με renderQANewPlan/renderQAQuickMeasure/renderQAQuickAppt (πάνω), ενοποιημένη σε μία
// συνάρτηση με τα 3 msheet-qa-* result containers αντί να τριπλασιάζεται ο κώδικας — οι ίδιες
// qaStartPlan/qaCreateAndPlan/qaStartMeasure/qaCreateAndMeasure/qaStartAppt/qaCreateAndAppt (πάνω,
// αναλλοίωτες) κάνουν την πραγματική ενέργεια, εδώ μόνο αλλάζει πού ζωγραφίζονται τα αποτελέσματα.
function renderMSheetQA(kind,q){
  var results=document.getElementById('msheet-qa-'+kind+'-results'); if(!results) return;
  var list=qaMatchingClients(q), html='';
  var startFn = kind==='newplan'?'qaStartPlan':(kind==='quickmeasure'?'qaStartMeasure':'qaStartAppt');
  var createFn = kind==='newplan'?'qaCreateAndPlan':(kind==='quickmeasure'?'qaCreateAndMeasure':'qaCreateAndAppt');
  list.forEach(function(c){
    var sub;
    if(kind==='newplan'){ sub=qaPlanStatusText(c); }
    else if(kind==='quickmeasure'){ sub=(c.weightLog&&c.weightLog.length)?('τελ. μέτρηση '+c.weightLog[c.weightLog.length-1].date):'καμία μέτρηση ακόμα'; }
    else { var lastAppt=c.appointments&&c.appointments.length?c.appointments[c.appointments.length-1]:null; sub=lastAppt?((clientHasFlaggedAppointment(c)?'🚩 ':'')+'τελ. ραντεβού '+lastAppt.date):'καμία καταχώρηση ακόμα'; }
    html+='<div class="qa-row" onclick="'+startFn+'(\''+c.id+'\');closeMoreSheet();"><span>'+esc(c.name||'Νέος πελάτης')+'</span><span class="qa-row-sub">'+sub+'</span></div>';
  });
  html+='<div class="qa-row qa-row-new" onclick="'+createFn+'(document.getElementById(\'msheet-qa-'+kind+'-input\').value);closeMoreSheet();">+ Δημιούργησε νέο πελάτη'+(q?' «'+esc(q)+'»':'')+'</div>';
  results.innerHTML=html;
}


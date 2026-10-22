// js/client-editor/plan-history.js
// 📊 Ιστορικό πλάνων (client sub-tab s4) — moved out of diet-panels.js and rebuilt 2026-10-22.
//
// Data (per client):
//   c.savedPlans[]  numbered versions {id, number, date, time, note, kind:'sent'|'manual'|undefined(legacy),
//                   sentDates[], hash, macros{k,p,f,c,fi}, weekPlan, goal, goalMain, dietType,
//                   ctx{weight,bf,goalMain,dietType,targetK}}
//   c.planBackups[] unnumbered safety copies {id, date, time, reason, hash, macros, weekPlan} — taken
//                   automatically before «Φόρτωση» / a new genPlan() overwrites an unsaved weekPlan.
//                   Capped (PH_MAX_BACKUPS, PH_BACKUP_DAYS) because the whole blob is cloud-synced.
//
// Auto-save: Cloud.publishPlan() calls recordPlanSent(c) after every successful publish, so the
// version the client actually received is always in the history (deduped by weekPlan hash;
// same-day re-sends of an edited plan update that day's entry instead of adding one per click).
//
// Numbering: next = max(number)+1 (was length+1, which repeated a number after a delete);
// existing duplicates are renumbered once, chronologically (phNormalizeNumbers).
//
// Public (called from elsewhere): showSavePlanPanel/closeSavePlanPanel/doSavePlan (Dietologist.html
// modal + render-main button), buildPlanHistoryHtml (render-main, persistence recover),
// renderPlanCharts (form-controls tab switch — no-op now, kept for that caller), recordPlanSent
// (app-part7 Cloud.publishPlan), phBackupIfUnsaved (gen-plan genPlan).

var PH_MAX_BACKUPS=3, PH_BACKUP_DAYS=30;
var PH_DAYS=['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
var PH_DAYS_SHORT=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
var phFilter='all';
var phOpen={};          // plan id → expanded? (newest is open by default)

/* ── small helpers ─────────────────────────────────────────────────────── */
function phPad(n){return (n<10?'0':'')+n;}
function phToday(){var d=new Date();return d.getFullYear()+'-'+phPad(d.getMonth()+1)+'-'+phPad(d.getDate());}
function phFmt(iso){return iso?String(iso).slice(8,10)+'/'+String(iso).slice(5,7)+'/'+String(iso).slice(0,4):'—';}
function phFmtShort(iso){return iso?String(iso).slice(8,10)+'/'+String(iso).slice(5,7):'—';}
function phDec(x,n){return (x==null||isNaN(x))?'—':(+x).toFixed(n==null?1:n).replace('.',',');}
function phSigned(x,unit,n){if(x==null||isNaN(x))return '';var s=(n?(+x).toFixed(n):Math.round(x)).toString().replace('.',',');return (x>0?'+':(x<0?'−':'±'))+s.replace('-','')+(unit||'');}
function phDaysBetween(a,b){return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000);}

function phStableStr(v){
  if(v===null||typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(phStableStr).join(',')+']';
  return '{'+Object.keys(v).sort().map(function(k){return JSON.stringify(k)+':'+phStableStr(v[k]);}).join(',')+'}';
}
function phHash(wp){var s=phStableStr(wp||{}),h=0;for(var i=0;i<s.length;i++){h=(Math.imul(31,h)+s.charCodeAt(i))|0;}return h;}
function phPlanHash(p){if(p.hash==null&&p.weekPlan)p.hash=phHash(p.weekPlan);return p.hash;}
function phIsEmpty(wp){if(!wp)return true;for(var d=0;d<7;d++){if(wp[d]&&wp[d].length)return false;}return true;}

function phFoodMacros(fd){
  if(fd.k&&fd.k>0)return {k:fd.k||0,p:fd.p||0,f:fd.f||0,c:fd.c||0,fi:fd.fi||0};
  if(fd.n&&fd.g&&typeof cm==='function'){var m=cm(fd.n,fd.g);return {k:m.k||0,p:m.p||0,f:m.f||0,c:m.c||0,fi:m.fi||0};}
  return {k:0,p:0,f:0,c:0,fi:0};
}
// Average per day over the 7-day week (same convention the history always used).
function phWeekMacros(wp){
  var t={k:0,p:0,f:0,c:0,fi:0};
  for(var d=0;d<7;d++){(wp&&wp[d]||[]).forEach(function(meal){(meal.foods||[]).forEach(function(fd){var m=phFoodMacros(fd);t.k+=m.k;t.p+=m.p;t.f+=m.f;t.c+=m.c;t.fi+=m.fi;});});}
  return {k:Math.round(t.k/7),p:Math.round(t.p/7),f:Math.round(t.f/7),c:Math.round(t.c/7),fi:Math.round(t.fi/7)};
}
function phDayKcal(wp){
  var out=[];
  for(var d=0;d<7;d++){var k=0;(wp&&wp[d]||[]).forEach(function(meal){(meal.foods||[]).forEach(function(fd){k+=phFoodMacros(fd).k;});});out.push(Math.round(k));}
  return out;
}

/* ── ordering / numbering ──────────────────────────────────────────────── */
function phChrono(a,b){
  var da=a.date||'',db=b.date||'';
  if(da!==db)return da<db?-1:1;
  var ia=parseInt(String(a.id||'').replace(/\D/g,''),10)||0, ib=parseInt(String(b.id||'').replace(/\D/g,''),10)||0;
  return ia-ib;
}
function phSorted(c){return (c.savedPlans||[]).slice().sort(phChrono);}
function phNextNumber(c){return (c.savedPlans||[]).reduce(function(m,p){return Math.max(m,+p.number||0);},0)+1;}
// One-time repair for histories that already contain a repeated number (old length+1 rule).
function phNormalizeNumbers(c){
  var seen={},dup=false;
  (c.savedPlans||[]).forEach(function(p){if(seen[p.number])dup=true;seen[p.number]=true;});
  if(!dup)return false;
  c.savedPlans.sort(phChrono);
  c.savedPlans.forEach(function(p,i){p.number=i+1;});
  return true;
}

/* ── context at save time ──────────────────────────────────────────────── */
function phContextNow(c){
  var t=null;try{t=(typeof calcTDEE==='function')?calcTDEE(c):null;}catch(e){}
  return {weight:c.weight||null,bf:(c.bf>0?c.bf:null),goalMain:c.goalMain||null,dietType:c.dietType||null,targetK:(t&&t.target&&!t.incomplete)?t.target:null};
}
// Weight/BF that applied on a date: the stored ctx, else the last weightLog entry on/before it,
// else the first one up to 14 days after (a plan is often saved right before the first measurement).
function phBodyAt(c,plan){
  var x=plan.ctx||{};
  if(x.weight)return {w:x.weight,bf:x.bf||null};
  var wl=(c.weightLog||[]).filter(function(e){return e&&e.date&&e.weight;}).slice().sort(function(a,b){return a.date<b.date?-1:(a.date>b.date?1:0);});
  var before=null,after=null;
  wl.forEach(function(e){if(e.date<=plan.date)before=e;else if(!after&&phDaysBetween(plan.date,e.date)<=14)after=e;});
  var e=before||after;
  return e?{w:+e.weight,bf:(e.bf>0?+e.bf:null)}:{w:null,bf:null};
}
function phLatestBody(c){
  var wl=(c.weightLog||[]).filter(function(e){return e&&e.date&&e.weight;}).slice().sort(function(a,b){return a.date<b.date?-1:1;});
  var e=wl.length?wl[wl.length-1]:null;
  return {w:e?+e.weight:(c.weight||null),bf:e&&e.bf>0?+e.bf:(c.bf>0?c.bf:null),date:e?e.date:null};
}
// Portal adherence between two dates (to = exclusive), meals_done/meals_total like harvestOwnHistory.
function phAdherence(c,from,to){
  var cis=(window.Cloud&&typeof window.Cloud.checkinsFor==='function')?window.Cloud.checkinsFor(c):[];
  var done=0,tot=0,days=0;
  (cis||[]).forEach(function(ci){if(ci.date>=from&&ci.date<to&&ci.meals_total>0){done+=ci.meals_done||0;tot+=ci.meals_total;days++;}});
  return tot>0?{pct:Math.round(done*100/tot),days:days}:null;
}
function phAdhColor(pct){
  if(pct>=75)return 'background:#e5f2ec;color:#1b5e3f';
  if(pct>=60)return 'background:#fbf0dc;color:#7a4a00';
  return 'background:#fbe9e3;color:#8a2f12';
}

/* ── food diff between two weekly plans ────────────────────────────────── */
function phFoodTotals(wp){
  var m={};
  for(var d=0;d<7;d++){(wp&&wp[d]||[]).forEach(function(meal){(meal.foods||[]).forEach(function(fd){if(!fd.n)return;var e=m[fd.n]||(m[fd.n]={g:0,n:0});e.g+=(+fd.g||0);e.n++;});});}
  return m;
}
function phMealSig(meal){return (meal.foods||[]).map(function(f){return f.n+'@'+Math.round(+f.g||0);}).sort().join('|');}
function phDiff(prevWp,curWp){
  var a=phFoodTotals(prevWp),b=phFoodTotals(curWp),added=[],removed=[],changed=[];
  Object.keys(b).forEach(function(n){if(!a[n])added.push(n);});
  Object.keys(a).forEach(function(n){if(!b[n])removed.push(n);});
  Object.keys(b).forEach(function(n){
    if(!a[n])return;
    var ga=Math.round(a[n].g/a[n].n),gb=Math.round(b[n].g/b[n].n);
    if(Math.abs(gb-ga)>=10&&Math.abs(gb-ga)>=0.1*Math.max(ga,1))changed.push({n:n,from:ga,to:gb});
  });
  var total=0,diff=0;
  for(var d=0;d<7;d++){
    var cm_=(curWp&&curWp[d])||[],pm=(prevWp&&prevWp[d])||[];
    cm_.forEach(function(meal,i){total++;if(!pm[i]||phMealSig(pm[i])!==phMealSig(meal))diff++;});
  }
  return {added:added,removed:removed,changed:changed,mealsChanged:diff,mealsTotal:total};
}

/* ── backups ───────────────────────────────────────────────────────────── */
function phKnownHash(c,h){
  return (c.savedPlans||[]).some(function(p){return phPlanHash(p)===h;})||(c.planBackups||[]).some(function(b){return b.hash===h;});
}
function phBackupIfUnsaved(c,reason){
  if(!c||phIsEmpty(c.weekPlan))return false;
  var h=phHash(c.weekPlan);
  if(phKnownHash(c,h))return false;
  var now=new Date();
  c.planBackups=(c.planBackups||[]).filter(function(b){return b.date&&phDaysBetween(b.date,phToday())<=PH_BACKUP_DAYS;});
  c.planBackups.push({id:'bk_'+Date.now(),date:phToday(),time:now.toLocaleTimeString('el-GR'),reason:reason||'',hash:h,macros:phWeekMacros(c.weekPlan),weekPlan:deepClone(c.weekPlan)});
  while(c.planBackups.length>PH_MAX_BACKUPS)c.planBackups.shift();
  return true;
}

/* ── creating entries ──────────────────────────────────────────────────── */
function phMakeEntry(c,kind,note){
  var now=new Date(),ctx=phContextNow(c);
  return {id:'plan_'+Date.now(),number:phNextNumber(c),date:phToday(),time:now.toLocaleTimeString('el-GR'),
    note:note||'',kind:kind,sentDates:kind==='sent'?[phToday()]:[],hash:phHash(c.weekPlan),
    macros:phWeekMacros(c.weekPlan),weekPlan:deepClone(c.weekPlan),goal:c.goal,goalMain:c.goalMain||null,dietType:c.dietType,ctx:ctx};
}
// Called by Cloud.publishPlan() after a successful publish. Returns {number,isNew} or null.
function recordPlanSent(c){
  if(!c||phIsEmpty(c.weekPlan))return null;
  if(!c.savedPlans)c.savedPlans=[];
  phNormalizeNumbers(c);
  var h=phHash(c.weekPlan),today=phToday(),plans=phSorted(c);
  for(var i=plans.length-1;i>=0;i--){
    if(phPlanHash(plans[i])===h){
      var p=plans[i];p.sentDates=p.sentDates||[];
      if(p.sentDates[p.sentDates.length-1]!==today)p.sentDates.push(today);
      phRefresh(c);
      return {number:p.number,isNew:false};
    }
  }
  var last=plans[plans.length-1];
  if(last&&last.kind==='sent'&&last.date===today&&!last.note){
    // Same-day re-send after edits → that day's version is replaced, not stacked.
    var fresh=phMakeEntry(c,'sent','');
    fresh.id=last.id;fresh.number=last.number;fresh.sentDates=last.sentDates||[today];
    c.savedPlans[c.savedPlans.indexOf(last)]=fresh;
    phRefresh(c);
    return {number:fresh.number,isNew:false,updated:true};
  }
  var e=phMakeEntry(c,'sent','');
  c.savedPlans.push(e);
  phRefresh(c);
  return {number:e.number,isNew:true};
}
function phRefresh(c){
  if(typeof getC!=='function'||getC()!==c)return;
  var s4=document.getElementById('s4');
  if(s4)s4.innerHTML=buildPlanHistoryHtml(c);
}

/* ── save modal (Dietologist.html #savePlanModal) ──────────────────────── */
function showSavePlanPanel(){
  var c=getC();
  if(!c||phIsEmpty(c.weekPlan)){showErrorToast('Δεν υπάρχει πλάνο για αποθήκευση!');return;}
  var modal=document.getElementById('savePlanModal');
  if(modal){
    modal.style.display='flex';
    var dateElem=document.getElementById('plan-save-date');
    if(dateElem)dateElem.textContent=new Date().toLocaleDateString('el-GR');
    var noteElem=document.getElementById('plan-save-note');
    if(noteElem)noteElem.value='';
  }
}
function closeSavePlanPanel(){
  var modal=document.getElementById('savePlanModal');
  if(modal)modal.style.display='none';
}
function doSavePlan(){
  var c=getC();
  if(!c||phIsEmpty(c.weekPlan)){showErrorToast('Δεν υπάρχει πλάνο για αποθήκευση!');return;}
  if(!c.savedPlans)c.savedPlans=[];
  phNormalizeNumbers(c);
  var noteElem=document.getElementById('plan-save-note');
  var note=noteElem?noteElem.value.trim():'';
  var plans=phSorted(c),last=plans[plans.length-1],msg;
  if(last&&phPlanHash(last)===phHash(c.weekPlan)){
    // Identical to the newest entry — don't store a second copy, just attach the note.
    if(note)last.note=note;
    msg='✓ Ίδιο με το Πλάνο #'+last.number+(note?' — ενημερώθηκε η σημείωση':'');
  } else {
    var e=phMakeEntry(c,'manual',note);
    c.savedPlans.push(e);
    msg='✓ Πλάνο #'+e.number+' αποθηκεύτηκε!';
  }
  save();
  closeSavePlanPanel();
  var toast=document.getElementById('autosave-toast');
  if(toast){toast.innerHTML=msg;toast.style.opacity='1';clearTimeout(toast._ft);toast._ft=setTimeout(function(){toast.style.opacity='0';},2500);}
  var s4=document.getElementById('s4');
  if(s4)s4.innerHTML=buildPlanHistoryHtml(c);
  setTimeout(function(){swTab(4);},50);
}
// Kept for form-controls' tab-switch hook; the per-plan doughnuts were dropped in the 2026-10-22 redesign.
function renderPlanCharts(c){}

/* ── actions (by id, not array index — the timeline is sorted newest-first) ── */
function phFind(c,id){var a=c.savedPlans||[];for(var i=0;i<a.length;i++){if(a[i].id===id)return a[i];}return null;}
function phCloseMenus(){document.querySelectorAll('details.ph-menu[open]').forEach(function(d){d.removeAttribute('open');});}

function loadPlanAsActive(id){
  var c=getC();if(!c)return;
  var plan=phFind(c,id);if(!plan)return;
  phCloseMenus();
  var unsaved=!phIsEmpty(c.weekPlan)&&!phKnownHash(c,phHash(c.weekPlan));
  var msg='Φόρτωση του πλάνου #'+plan.number+' ως ενεργό; Θα αντικαταστήσει το τρέχον εβδομαδιαίο πλάνο.'
    +(unsaved?'\n\nΤο τρέχον πλάνο ('+phWeekMacros(c.weekPlan).k+' kcal) δεν είναι αποθηκευμένο, οπότε θα κρατηθεί αυτόματα ως backup στο Ιστορικό.':'');
  showConfirmDialog(msg,function(){
    phBackupIfUnsaved(c,'Πριν τη «Φόρτωση» του Πλάνου #'+plan.number);
    c.weekPlan=deepClone(plan.weekPlan);
    save();
    showSuccessToast('✅ Πλάνο #'+plan.number+' φορτώθηκε!'+(unsaved?' Το προηγούμενο κρατήθηκε ως backup.':'')+' Πήγαινε στο "Εβδομαδιαίο πλάνο" για να το δεις.');
    renderMain();
  },{icon:'📥',confirmLabel:'Φόρτωση'});
}
function restorePlanBackup(id){
  var c=getC();if(!c)return;
  var b=(c.planBackups||[]).filter(function(x){return x.id===id;})[0];if(!b)return;
  showConfirmDialog('Επαναφορά του backup της '+phFmt(b.date)+' ('+b.macros.k+' kcal) ως ενεργό πλάνο;',function(){
    phBackupIfUnsaved(c,'Πριν την επαναφορά backup της '+phFmtShort(b.date));
    c.weekPlan=deepClone(b.weekPlan);
    save();
    showSuccessToast('✅ Το backup επανήλθε ως ενεργό πλάνο.');
    renderMain();
  },{icon:'↩️',confirmLabel:'Επαναφορά'});
}
function deletePlanBackup(id){
  var c=getC();if(!c)return;
  showConfirmDialog('Διαγραφή αυτού του backup;',function(){
    c.planBackups=(c.planBackups||[]).filter(function(x){return x.id!==id;});
    save();phRefresh(c);
  });
}
function deletePlanFromHistory(id){
  var c=getC();if(!c)return;
  var plan=phFind(c,id);if(!plan)return;
  phCloseMenus();
  showConfirmDialog('Είσαι σίγουρος ότι θέλεις να διαγράψεις το πλάνο #'+plan.number+';',function(){
    c.savedPlans=c.savedPlans.filter(function(p){return p.id!==id;});
    save();phRefresh(c);
  });
}
function duplicatePlan(id){
  var c=getC();if(!c)return;
  var o=phFind(c,id);if(!o)return;
  phCloseMenus();
  var p=deepClone(o);
  p.id='plan_'+Date.now();p.number=phNextNumber(c);p.date=phToday();p.time=new Date().toLocaleTimeString('el-GR');
  p.note='[Αντιγραφή του #'+o.number+'] '+(o.note||'');p.kind='manual';p.sentDates=[];
  c.savedPlans.push(p);
  save();phRefresh(c);
}
function savePlanNote(id){
  var c=getC();if(!c)return;
  var p=phFind(c,id),inp=document.getElementById('ph-note-'+id);if(!p||!inp)return;
  p.note=inp.value.trim();
  save();
  showSuccessToast('✓ Η σημείωση του Πλάνου #'+p.number+' αποθηκεύτηκε');
}
function phSetFilter(f){phFilter=f;var c=getC();if(c)phRefresh(c);}
function phToggle(id){
  phOpen[id]=!phIsOpen(id);
  var d=document.getElementById('ph-det-'+id);if(d)d.style.display=phOpen[id]?'flex':'none';
}
function phIsOpen(id){return phOpen[id]!=null?phOpen[id]:!!phOpen['__newest_'+id];}
function phToggleMeals(id){var d=document.getElementById('ph-meals-'+id);if(d)d.style.display=d.style.display==='none'?'block':'none';}

/* ── styles (injected once) ────────────────────────────────────────────── */
function phEnsureStyle(){
  if(document.getElementById('ph-style'))return;
  var st=document.createElement('style');st.id='ph-style';
  st.textContent=''
    +'.ph-wrap{padding:16px 20px;display:flex;flex-direction:column;gap:16px}'
    +'.ph-card{background:var(--card-bg);border:1px solid var(--border-light);border-radius:12px;padding:16px 18px}'
    +'.ph-h{margin:0;font-size:15px;font-weight:700;color:#025857}'
    +'.ph-muted{color:var(--text-muted)}'
    +'.ph-chip{border:0;background:transparent;color:inherit;font:inherit;font-size:12.5px;padding:7px 12px;border-radius:999px;cursor:pointer;min-height:32px}'
    +'.ph-chip.on{background:#025857;color:#fff;font-weight:600}'
    +'.ph-chips{display:flex;gap:4px;background:var(--panel-bg);border:1px solid var(--border-light);border-radius:999px;padding:3px}'
    +'.ph-sum{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px}'
    +'.ph-sum .l{font-size:11.5px;color:var(--text-muted)} .ph-sum .v{font-size:16px;font-weight:700} .ph-sum .s{font-size:11.5px}'
    +'.ph-row{display:flex;gap:12px}'
    +'.ph-rail{width:14px;display:flex;flex-direction:column;align-items:center;flex-shrink:0}'
    +'.ph-dot{width:10px;height:10px;border-radius:50%;background:#025857;margin-top:6px;flex-shrink:0}'
    +'.ph-dot.bk{background:var(--card-bg);border:2px solid #8a9898;width:8px;height:8px}'
    +'.ph-dot.act{width:12px;height:12px;box-shadow:0 0 0 4px rgba(2,88,87,.18)}'
    +'.ph-line{flex:1;width:2px;background:var(--border-light);margin-top:4px}'
    +'.ph-body{flex:1;min-width:0;padding-bottom:14px}'
    +'.ph-head{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;font-size:13px;cursor:pointer}'
    +'.ph-date{font-size:11.5px;color:var(--text-muted);min-width:76px}'
    +'.ph-title{font-weight:700;color:#025857}'
    +'.ph-badge{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:999px;white-space:nowrap}'
    +'.ph-b-act{background:#025857;color:#fff}.ph-b-sent{background:#e0eefa;color:#1d4f7a}.ph-b-man{background:#eef2f2;color:#3d4a4a}.ph-b-diet{background:#f3e8fb;color:#5b2a86}'
    +'.ph-pill{font-weight:700;padding:2px 8px;border-radius:6px;font-size:12px}'
    +'.ph-det{margin-top:10px;background:var(--panel-bg);border:1px solid var(--border-light);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:12px}'
    +'.ph-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}'
    +'.ph-sec{display:flex;flex-direction:column;gap:8px}'
    +'.ph-lbl{font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:.04em;text-transform:uppercase}'
    +'.ph-tiles{display:grid;gap:8px}'
    +'.ph-tile{background:var(--card-bg);border:1px solid var(--border-light);border-radius:8px;padding:8px 10px}'
    +'.ph-tile .l{font-size:11px;color:var(--text-muted)} .ph-tile .v{font-size:16px;font-weight:700} .ph-tile .s{font-size:11.5px;font-weight:600;color:#025857}'
    +'.ph-ratio{display:flex;height:20px;border-radius:6px;overflow:hidden;font-size:10.5px;font-weight:700;color:#fff}'
    +'.ph-ratio div{display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:hidden}'
    +'.ph-tag{border-radius:6px;padding:4px 8px;font-size:12px;font-weight:600}'
    +'.ph-add{background:#e5f2ec;color:#1b5e3f}.ph-rem{background:#fbe9e3;color:#8a2f12}.ph-chg{background:var(--card-bg);border:1px solid var(--border-light);font-weight:400}'
    +'.ph-actions{display:flex;flex-wrap:wrap;gap:8px}'
    +'details.ph-menu{position:relative;margin-left:auto}'
    +'details.ph-menu>summary{list-style:none;cursor:pointer;border:1px solid var(--border-light);background:var(--card-bg);border-radius:8px;width:36px;height:32px;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1}'
    +'details.ph-menu>summary::-webkit-details-marker{display:none}'
    +'details.ph-menu[open]>summary{border-color:#025857;color:#025857}'
    +'.ph-menu-list{position:absolute;right:0;top:38px;z-index:50;min-width:220px;background:var(--card-bg);border:1px solid var(--border-light);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.15);padding:6px;display:flex;flex-direction:column}'
    +'.ph-menu-list button{text-align:left;border:0;background:transparent;font:inherit;font-size:13px;padding:9px 12px;border-radius:6px;cursor:pointer;color:inherit}'
    +'.ph-menu-list button:hover{background:var(--panel-bg)} .ph-menu-list .danger{color:#c62828}'
    +'.ph-meals{display:none;padding:10px;background:var(--card-bg);border-radius:6px;border:1px solid var(--border-light);max-height:400px;overflow-y:auto;font-size:11.5px}'
    +'#plan-compare-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10001;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:24px 12px}'
    +'.phc-box{background:var(--card-bg);border-radius:12px;width:100%;max-width:1080px;padding:20px 22px;box-shadow:0 12px 40px rgba(0,0,0,.3);display:flex;flex-direction:column;gap:14px}'
    +'.phc-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px}'
    +'@media (max-width:820px){.phc-grid{grid-template-columns:1fr}}'
    +'.phc-tr{display:grid;grid-template-columns:1.3fr 1fr 1fr .9fr;gap:8px;font-size:12.5px;padding:8px 0;border-bottom:1px solid var(--border-light)}'
    +'.phc-tr.h{font-size:11.5px;font-weight:700;color:var(--text-muted)}'
    +'.phc-sel{font:inherit;font-size:13px;padding:7px 9px;border:1px solid var(--border-light);border-radius:8px;background:var(--card-bg);color:inherit;min-height:36px;max-width:100%}';
  document.head.appendChild(st);
  if(!window._phMenuCloser){
    window._phMenuCloser=true;
    document.addEventListener('click',function(e){
      document.querySelectorAll('details.ph-menu[open]').forEach(function(d){if(!d.contains(e.target))d.removeAttribute('open');});
    });
  }
}

/* ── chart: plan kcal (step line) + weight + adherence per period ─────── */
function phChartSvg(c,plans,periods){
  if(plans.length<1)return '';
  var first=plans[0].date,lastEnd=phToday();
  if(lastEnd<plans[plans.length-1].date)lastEnd=plans[plans.length-1].date;
  var span=Math.max(1,phDaysBetween(first,lastEnd));
  var X0=60,X1=740,Y0=20,Y1=170;
  function xOf(d){return X0+(X1-X0)*Math.max(0,Math.min(span,phDaysBetween(first,d)))/span;}
  var ks=plans.map(function(p){return (p.macros&&p.macros.k)||0;});
  var kMin=Math.floor((Math.min.apply(null,ks)-150)/100)*100,kMax=Math.ceil((Math.max.apply(null,ks)+150)/100)*100;
  function yK(k){return Y1-(Y1-Y0)*(k-kMin)/Math.max(1,kMax-kMin);}
  // weight points: weightLog inside the range (+ the last one before it), else per-plan values
  var wl=(c.weightLog||[]).filter(function(e){return e&&e.date&&+e.weight>0;}).slice().sort(function(a,b){return a.date<b.date?-1:1;});
  var pts=[],prior=null;
  wl.forEach(function(e){if(e.date<first)prior=e;else if(e.date<=lastEnd)pts.push({d:e.date,w:+e.weight});});
  if(prior)pts.unshift({d:first,w:+prior.weight});
  if(!pts.length)plans.forEach(function(p){var b=phBodyAt(c,p);if(b.w)pts.push({d:p.date,w:b.w});});
  var hasW=pts.length>0,wMin=0,wMax=1;
  if(hasW){var ws=pts.map(function(p){return p.w;});wMin=Math.floor(Math.min.apply(null,ws)-1);wMax=Math.ceil(Math.max.apply(null,ws)+1);}
  function yW(w){return Y1-(Y1-Y0)*(w-wMin)/Math.max(1,wMax-wMin);}
  var s='<svg viewBox="0 0 820 236" style="width:100%;height:auto;display:block" role="img" aria-label="Θερμίδες κάθε πλάνου στον χρόνο'+(hasW?' μαζί με το βάρος':'')+'">';
  // grid + kcal ticks
  for(var i=0;i<=4;i++){
    var kv=kMin+(kMax-kMin)*i/4,y=yK(kv);
    s+='<line x1="'+X0+'" y1="'+y.toFixed(1)+'" x2="'+X1+'" y2="'+y.toFixed(1)+'" style="stroke:var(--border-light)" stroke-width="1"/>';
    s+='<text x="'+(X0-8)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" font-size="11" style="fill:var(--text-muted)">'+Math.round(kv)+'</text>';
  }
  if(hasW){
    s+='<text x="'+(X1+8)+'" y="'+(Y0+4)+'" font-size="11" fill="#c2410c">'+wMax+' kg</text>';
    s+='<text x="'+(X1+8)+'" y="'+(Y1+4)+'" font-size="11" fill="#c2410c">'+wMin+' kg</text>';
  }
  // adherence bars under each period
  periods.forEach(function(pr){
    if(!pr.adh)return;
    var xa=xOf(pr.from)+2,xb=xOf(pr.to)-2;if(xb-xa<3)return;
    var h=40*pr.adh.pct/100;
    s+='<rect x="'+xa.toFixed(1)+'" y="'+(Y1-h).toFixed(1)+'" width="'+(xb-xa).toFixed(1)+'" height="'+h.toFixed(1)+'" fill="#025857" opacity=".12"><title>Τήρηση '+pr.adh.pct+'%</title></rect>';
  });
  // kcal step line
  var d='';
  plans.forEach(function(p,j){var x=xOf(p.date).toFixed(1),y=yK(ks[j]).toFixed(1);d+=(j===0?'M'+x+' '+y:' H'+x+' V'+y);});
  d+=' H'+X1;
  s+='<path d="'+d+'" fill="none" stroke="#025857" stroke-width="3" stroke-linejoin="round"/>';
  plans.forEach(function(p,j){s+='<circle cx="'+xOf(p.date).toFixed(1)+'" cy="'+yK(ks[j]).toFixed(1)+'" r="3.5" fill="#025857"><title>Πλάνο #'+p.number+' · '+ks[j]+' kcal</title></circle>';});
  // weight line
  if(hasW){
    var wd='';pts.forEach(function(p,j){wd+=(j?' L':'M')+xOf(p.d).toFixed(1)+' '+yW(p.w).toFixed(1);});
    s+='<path d="'+wd+'" fill="none" stroke="#c2410c" stroke-width="2" stroke-dasharray="5 4"/>';
    pts.forEach(function(p){s+='<circle cx="'+xOf(p.d).toFixed(1)+'" cy="'+yW(p.w).toFixed(1)+'" r="4" fill="#c2410c"><title>'+phFmtShort(p.d)+' · '+phDec(p.w)+' kg</title></circle>';});
  }
  // x labels — staggered when two plans are close together
  var lastX=-999,row=0;
  plans.forEach(function(p){
    var x=xOf(p.date);row=(x-lastX<70)?(row?0:1):0;lastX=x;
    s+='<text x="'+x.toFixed(1)+'" y="'+(194+row*16)+'" text-anchor="middle" font-size="11" style="fill:var(--text-strong,#2c3a3a)">#'+p.number+' · '+phFmtShort(p.date)+'</text>';
  });
  s+='</svg>';
  return s;
}

/* ── main render ───────────────────────────────────────────────────────── */
function buildPlanHistoryHtml(c){
  var dbg='<div style="margin:8px 20px 0;display:flex;justify-content:flex-end">'
    +'<button class="btn tertiary" style="padding:5px 10px;font-size:11px" onclick="recoverSavedPlansFor(\''+esc((c&&c.id)||'')+'\')" title="Ελέγχει αν υπάρχουν πλάνα σε τοπικό backup που λείπουν από το ιστορικό αυτού του πελάτη">🔎 Έλεγχος για χαμένα πλάνα σε backups</button>'
    +'</div>';
  if((!c.savedPlans||!c.savedPlans.length)&&!(c.planBackups||[]).length){
    return dbg+'<div style="padding:20px;text-align:center;color:var(--text-muted)"><div style="font-size:16px;font-weight:600;margin-bottom:10px">📊 Ιστορικό Πλάνων</div><p>Δεν υπάρχουν αποθηκευμένα πλάνα ακόμα.<br>Κάθε πλάνο που στέλνεις στον πελάτη μπαίνει εδώ αυτόματα· μπορείς και να πατήσεις «Αποθήκευση Διατροφής».</p></div>';
  }
  try{
    phEnsureStyle();
    if(phNormalizeNumbers(c)){try{save();}catch(e){}}
    return dbg+buildPlanHistoryHtmlInner(c);
  }catch(e){
    console.error('[PLAN HISTORY] Render failed:',e);
    return dbg+'<div style="padding:20px;text-align:center;color:#c62828"><div style="font-size:16px;font-weight:600;margin-bottom:10px">⚠️ Σφάλμα εμφάνισης ιστορικού πλάνων</div><p style="font-size:12px;color:#666">'+esc(e.message)+'</p></div>';
  }
}

function buildPlanHistoryHtmlInner(c){
  var plans=phSorted(c),backups=(c.planBackups||[]).slice();
  var curHash=phIsEmpty(c.weekPlan)?null:phHash(c.weekPlan);
  var today=phToday();
  // period of each plan = its date → the next plan's date (or today for the newest)
  var periods=plans.map(function(p,i){
    var to=i<plans.length-1?plans[i+1].date:today;
    var end=i<plans.length-1?to:phToday();
    var adhTo=i<plans.length-1?to:'9999-12-31';
    return {from:p.date,to:to,days:Math.max(0,phDaysBetween(p.date,end)),closed:i<plans.length-1,adh:phAdherence(c,p.date,adhTo)};
  });
  var sentCount=plans.filter(function(p){return p.kind==='sent';}).length;
  var html='<div class="ph-wrap">';

  // header
  html+='<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px">'
    +'<div style="display:flex;align-items:baseline;gap:10px"><h2 style="margin:0;color:#025857">📊 Ιστορικό πλάνων</h2>'
    +'<span class="ph-muted" style="font-size:12.5px">'+plans.length+' πλάνα'+(backups.length?' · '+backups.length+' backup':'')+'</span></div>'
    +'<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">'
    +'<div class="ph-chips">'
    +'<button class="ph-chip'+(phFilter==='all'?' on':'')+'" onclick="phSetFilter(\'all\')">Όλα</button>'
    +'<button class="ph-chip'+(phFilter==='sent'?' on':'')+'" onclick="phSetFilter(\'sent\')">Στάλθηκαν ('+sentCount+')</button>'
    +'<button class="ph-chip'+(phFilter==='backup'?' on':'')+'" onclick="phSetFilter(\'backup\')">Backups ('+backups.length+')</button>'
    +'</div>'
    +(plans.length>=2?'<button class="btn secondary" style="font-size:12.5px;padding:7px 12px;min-height:auto" onclick="openPlanCompare()">⇄ Σύγκριση πλάνων</button>':'')
    +'</div></div>';

  if(plans.length){
    // summary strip
    var b0=phBodyAt(c,plans[0]),bN=phLatestBody(c);
    var adhs=periods.filter(function(p){return p.adh;});
    var avgAdh=adhs.length?Math.round(adhs.reduce(function(a,p){return a+p.adh.pct;},0)/adhs.length):null;
    var best=null;periods.forEach(function(p,i){if(p.adh&&(!best||p.adh.pct>best.pct))best={pct:p.adh.pct,n:plans[i].number};});
    var closed=periods.filter(function(p){return p.closed;});
    var avgDur=closed.length?Math.round(closed.reduce(function(a,p){return a+p.days;},0)/closed.length):null;
    var minDur=closed.length?Math.min.apply(null,closed.map(function(p){return p.days;})):null,maxDur=closed.length?Math.max.apply(null,closed.map(function(p){return p.days;})):null;
    var months=Math.round(phDaysBetween(plans[0].date,today)/30);
    html+='<div class="ph-card ph-sum">'
      +'<div><div class="l">Περίοδος</div><div class="v">'+phFmtShort(plans[0].date)+' → '+phFmtShort(plans[plans.length-1].date)+'</div><div class="s ph-muted">'+(months>=1?months+' '+(months===1?'μήνας':'μήνες'):phDaysBetween(plans[0].date,today)+' μέρες')+' · '+plans.length+' πλάνα</div></div>'
      +'<div><div class="l">Βάρος</div><div class="v">'+(b0.w&&bN.w?phDec(b0.w)+' → '+phDec(bN.w)+' kg':'—')+'</div><div class="s" style="color:#025857;font-weight:600">'+(b0.w&&bN.w?phSigned(bN.w-b0.w,' kg',1):'')+'</div></div>'
      +'<div><div class="l">Λίπος</div><div class="v">'+(b0.bf&&bN.bf?phDec(b0.bf)+'% → '+phDec(bN.bf)+'%':'—')+'</div><div class="s" style="color:#025857;font-weight:600">'+(b0.bf&&bN.bf?phSigned(bN.bf-b0.bf,' μονάδες',1):'')+'</div></div>'
      +'<div><div class="l">Μ.Ο. τήρησης</div><div class="v">'+(avgAdh!=null?avgAdh+'%':'—')+'</div><div class="s ph-muted">'+(best&&adhs.length>1?'καλύτερο: #'+best.n+' ('+best.pct+'%)':(avgAdh==null?'χωρίς καταγραφές στο link':''))+'</div></div>'
      +'<div><div class="l">Μέση διάρκεια πλάνου</div><div class="v">'+(avgDur!=null?avgDur+' μέρες':'—')+'</div><div class="s ph-muted">'+(closed.length>1?'από '+minDur+' έως '+maxDur:'')+'</div></div>'
      +'</div>';

    // chart
    html+='<div class="ph-card" style="display:flex;flex-direction:column;gap:8px">'
      +'<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px"><h3 class="ph-h">Θερμίδες πλάνου και βάρος στον χρόνο</h3>'
      +'<div style="display:flex;flex-wrap:wrap;gap:14px;font-size:11.5px">'
      +'<span style="display:flex;align-items:center;gap:6px"><span style="width:18px;height:3px;background:#025857;display:inline-block"></span>kcal πλάνου</span>'
      +'<span style="display:flex;align-items:center;gap:6px"><span style="width:10px;height:10px;border-radius:50%;background:#c2410c;display:inline-block"></span>Βάρος</span>'
      +'<span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:10px;background:rgba(2,88,87,.15);display:inline-block"></span>τήρηση</span>'
      +'</div></div>'
      +phChartSvg(c,plans,periods)
      +'<div class="ph-muted" style="font-size:11.5px">Η γραμμή kcal κρατάει την τιμή μέχρι το επόμενο πλάνο· το πλάτος κάθε σκαλοπατιού είναι πόσο ίσχυσε. Οι σκιασμένες μπάρες = τήρηση από το link.</div>'
      +'</div>';
  }

  // timeline items (newest first)
  var items=[];
  plans.forEach(function(p,i){items.push({t:'plan',p:p,i:i,key:p.date+'|'+(parseInt(String(p.id).replace(/\D/g,''),10)||0)});});
  backups.forEach(function(b){items.push({t:'bk',b:b,key:b.date+'|'+(parseInt(String(b.id).replace(/\D/g,''),10)||0)});});
  items.sort(function(a,b){var ka=a.key.split('|'),kb=b.key.split('|');return ka[0]!==kb[0]?(ka[0]<kb[0]?1:-1):(+kb[1])-(+ka[1]);});
  items=items.filter(function(it){
    if(phFilter==='sent')return it.t==='plan'&&it.p.kind==='sent';
    if(phFilter==='backup')return it.t==='bk';
    return true;
  });
  if(plans.length&&phOpen[plans[plans.length-1].id]==null)phOpen['__newest_'+plans[plans.length-1].id]=true;

  html+='<div class="ph-card"><h3 class="ph-h" style="margin-bottom:12px">🕐 Χρονολόγιο</h3>';
  if(!items.length)html+='<div class="ph-muted" style="font-size:13px">Τίποτα σε αυτό το φίλτρο.</div>';
  items.forEach(function(it,idx){
    var lastItem=idx===items.length-1;
    if(it.t==='bk'){
      var b=it.b;
      html+='<div class="ph-row"><div class="ph-rail"><div class="ph-dot bk"></div>'+(lastItem?'':'<div class="ph-line"></div>')+'</div>'
        +'<div class="ph-body"><div class="ph-head" style="cursor:default">'
        +'<span class="ph-date">'+phFmt(b.date)+'</span>'
        +'<span style="font-weight:600">↩︎ Αυτόματο backup · '+((b.macros&&b.macros.k)||0)+' kcal</span>'
        +'<span class="ph-muted">'+esc(b.reason||'')+'</span>'
        +'<span style="margin-left:auto;display:flex;gap:6px">'
        +'<button class="btn secondary" style="font-size:11.5px;padding:5px 10px;min-height:auto" onclick="restorePlanBackup(\''+esc(b.id)+'\')">Επαναφορά</button>'
        +'<button class="btn tertiary" style="font-size:11.5px;padding:5px 8px;min-height:auto" title="Διαγραφή backup" aria-label="Διαγραφή backup" onclick="deletePlanBackup(\''+esc(b.id)+'\')">✕</button>'
        +'</span></div></div></div>';
      return;
    }
    html+=phPlanItemHtml(c,it.p,it.i,plans,periods,curHash,lastItem);
  });
  html+='</div>';
  if(backups.length)html+='<div class="ph-muted" style="font-size:11px">Τα backups κρατιούνται αυτόματα όταν ένα μη αποθηκευμένο πλάνο αντικαθίσταται (τα '+PH_MAX_BACKUPS+' τελευταία, έως '+PH_BACKUP_DAYS+' μέρες).</div>';
  html+='</div>';
  return html;
}

function phPlanItemHtml(c,p,i,plans,periods,curHash,lastItem){
  var m=p.macros||{k:0,p:0,f:0,c:0},pr=periods[i],prev=i>0?plans[i-1]:null;
  var isActive=curHash!=null&&phPlanHash(p)===curHash;
  var body=phBodyAt(c,p),open=phIsOpen(p.id);
  var id=esc(p.id);
  var deltaTxt=prev?(phSigned(m.k-((prev.macros&&prev.macros.k)||0),' kcal')+' από #'+prev.number):'πρώτο πλάνο';
  var badges='';
  if(isActive)badges+='<span class="ph-badge ph-b-act">ΕΝΕΡΓΟ</span>';
  if(p.kind==='sent'){var sd=p.sentDates||[];badges+='<span class="ph-badge ph-b-sent">📤 Στάλθηκε '+phFmtShort(sd[sd.length-1]||p.date)+(sd.length>1?' ('+sd.length+'×)':'')+'</span>';}
  else if(p.kind==='manual')badges+='<span class="ph-badge ph-b-man">💾 Χειροκίνητη</span>';
  var dt=p.dietType||(p.ctx&&p.ctx.dietType);
  if(dt&&typeof DIET_TYPE_BADGE!=='undefined'&&DIET_TYPE_BADGE[dt])badges+='<span class="ph-badge ph-b-diet">'+esc(DIET_TYPE_BADGE[dt])+'</span>';

  var h='<div class="ph-row"><div class="ph-rail"><div class="ph-dot'+(isActive?' act':'')+'"></div>'+(lastItem?'':'<div class="ph-line"></div>')+'</div><div class="ph-body">';
  h+='<div class="ph-head" onclick="if(!event.target.closest(\'details\'))phToggle(\''+id+'\')">'
    +'<span class="ph-date">'+phFmt(p.date)+'</span>'
    +'<span class="ph-title">Πλάνο #'+p.number+' · '+m.k+' kcal</span>'+badges
    +(body.w?'<span class="ph-muted">'+phDec(body.w)+' kg</span>':'')
    +'<span class="ph-muted">'+(pr.closed?pr.days+' '+(pr.days===1?'μέρα':'μέρες'):'ισχύει '+pr.days+' '+(pr.days===1?'μέρα':'μέρες'))+'</span>'
    +(pr.adh?'<span class="ph-pill" style="'+phAdhColor(pr.adh.pct)+'">τήρηση '+pr.adh.pct+'%</span>':'')
    +'<span class="ph-muted" style="font-size:12px">'+deltaTxt+'</span>'
    +'<details class="ph-menu"><summary aria-label="Ενέργειες για το Πλάνο #'+p.number+'">⋮</summary><div class="ph-menu-list">'
    +'<button onclick="loadPlanAsActive(\''+id+'\')">📥 Φόρτωση ως ενεργό</button>'
    +(plans.length>1?'<button onclick="phCloseMenus();openPlanCompare(\''+id+'\')">⇄ Σύγκρινε…</button>':'')
    +'<button onclick="duplicatePlan(\''+id+'\')">📋 Δημιουργία αντιγράφου</button>'
    +'<button class="danger" onclick="deletePlanFromHistory(\''+id+'\')">🗑️ Διαγραφή</button>'
    +'</div></details>'
    +'</div>';

  // details
  h+='<div class="ph-det" id="ph-det-'+id+'" style="display:'+(open?'flex':'none')+'">';
  h+='<div class="ph-grid">';
  // context
  var ctx=p.ctx||{},gm=ctx.goalMain||p.goalMain;
  var goalTxt=gm&&typeof GOAL_LABELS!=='undefined'?(GOAL_LABELS[gm]||gm):null;
  var pb=prev?phBodyAt(c,prev):null;
  h+='<div class="ph-sec"><span class="ph-lbl">Ο πελάτης τότε</span><div class="ph-tiles" style="grid-template-columns:repeat(2,minmax(0,1fr))">'
    +'<div class="ph-tile"><div class="l">Βάρος</div><div class="v">'+(body.w?phDec(body.w)+' kg':'—')+'</div><div class="s">'+(body.w&&pb&&pb.w?phSigned(body.w-pb.w,' από #'+prev.number,1):(ctx.weight?'':(body.w?'από μετρήσεις':'')))+'</div></div>'
    +'<div class="ph-tile"><div class="l">Λίπος</div><div class="v">'+(body.bf?phDec(body.bf)+'%':'—')+'</div><div class="s">'+(body.bf&&pb&&pb.bf?phSigned(body.bf-pb.bf,' από #'+prev.number,1):'')+'</div></div>'
    +'<div class="ph-tile"><div class="l">Στόχος</div><div class="v" style="font-size:13.5px">'+(goalTxt?esc(goalTxt):'—')+'</div><div class="s ph-muted" style="font-weight:400">'+(dt&&typeof DIET_TYPE_BADGE!=='undefined'&&DIET_TYPE_BADGE[dt]?esc(DIET_TYPE_BADGE[dt]):'Κανονική διατροφή')+'</div></div>'
    +'<div class="ph-tile"><div class="l">Στόχος kcal</div><div class="v">'+(ctx.targetK||'—')+'</div><div class="s ph-muted" style="font-weight:400">'+(ctx.targetK?'πλάνο: '+phSigned(m.k-ctx.targetK,' kcal'):'δεν καταγράφηκε')+'</div></div>'
    +'</div>'
    +'<div style="font-size:12px" class="ph-muted">'+(pr.closed?'Ίσχυσε '+phFmtShort(pr.from)+' → '+phFmtShort(pr.to):'Ισχύει από '+phFmtShort(pr.from))+' · '+pr.days+' '+(pr.days===1?'μέρα':'μέρες')
    +' · '+(pr.adh?'τήρηση '+pr.adh.pct+'% ('+pr.adh.days+' μέρες καταγραφής)':'χωρίς καταγραφές τήρησης')+'</div></div>';
  // macros
  var gk=function(g){return body.w?phDec(g/body.w,2)+' g/kg':'';};
  var pk=m.p*4,ck=m.c*4,fk=m.f*9,tk=Math.max(1,pk+ck+fk);
  var pP=Math.round(pk*100/tk),pC=Math.round(ck*100/tk),pF=Math.max(0,100-pP-pC);
  h+='<div class="ph-sec"><span class="ph-lbl">Μακροθρεπτικά (Μ.Ο. ημέρας)</span><div class="ph-tiles" style="grid-template-columns:repeat(3,minmax(0,1fr))">'
    +'<div class="ph-tile"><div class="l">Πρωτεΐνη</div><div class="v">'+m.p+' g</div><div class="s">'+gk(m.p)+'</div></div>'
    +'<div class="ph-tile"><div class="l">Υδατάνθρακες</div><div class="v">'+m.c+' g</div><div class="s">'+gk(m.c)+'</div></div>'
    +'<div class="ph-tile"><div class="l">Λίπος</div><div class="v">'+m.f+' g</div><div class="s">'+gk(m.f)+'</div></div>'
    +'</div>'
    +'<div class="ph-ratio" role="img" aria-label="Αναλογία θερμίδων: πρωτεΐνη '+pP+'%, υδατάνθρακες '+pC+'%, λίπος '+pF+'%">'
    +'<div style="width:'+pP+'%;background:#025857">P '+pP+'%</div><div style="width:'+pC+'%;background:#3f7f9e">C '+pC+'%</div><div style="width:'+pF+'%;background:#b4561f">F '+pF+'%</div></div>'
    +(m.fi!=null?'<div class="ph-muted" style="font-size:12px">Φυτικές ίνες '+m.fi+' g</div>':'')
    +'</div>';
  h+='</div>';  // /grid

  h+='<div class="ph-grid">';
  // what changed
  if(prev&&prev.weekPlan&&p.weekPlan){
    var df=phDiff(prev.weekPlan,p.weekPlan),tags='';
    df.added.slice(0,10).forEach(function(n){tags+='<span class="ph-tag ph-add">+ '+esc(n)+'</span>';});
    df.removed.slice(0,10).forEach(function(n){tags+='<span class="ph-tag ph-rem">− '+esc(n)+'</span>';});
    df.changed.slice(0,8).forEach(function(x){tags+='<span class="ph-tag ph-chg">'+esc(x.n)+' '+x.from+' → '+x.to+' g</span>';});
    var more=Math.max(0,df.added.length-10)+Math.max(0,df.removed.length-10)+Math.max(0,df.changed.length-8);
    h+='<div class="ph-sec"><span class="ph-lbl">Τι άλλαξε από το #'+prev.number+'</span>'
      +(tags?'<div style="display:flex;flex-wrap:wrap;gap:6px">'+tags+(more?'<span class="ph-muted" style="font-size:12px;align-self:center">+'+more+' ακόμα</span>':'')+'</div>':'<div class="ph-muted" style="font-size:12.5px">'+(df.mealsChanged?'Ίδια τρόφιμα· μόνο μικρές αλλαγές ποσότητας (κάτω από 10 g).':'Ίδια τρόφιμα και ποσότητες.')+'</div>')
      +'<div class="ph-muted" style="font-size:12px">'+df.mealsChanged+' από '+df.mealsTotal+' γεύματα άλλαξαν</div></div>';
  }
  // note
  h+='<div class="ph-sec"><label class="ph-lbl" for="ph-note-'+id+'">Σημείωση</label><div style="display:flex;gap:8px">'
    +'<input id="ph-note-'+id+'" value="'+esc(p.note||'')+'" placeholder="π.χ. πιο πολλά όσπρια, ξαναβλέπουμε σε 2 εβδ." onkeydown="if(event.key===\'Enter\')savePlanNote(\''+id+'\')" style="flex:1;min-width:0;font:inherit;font-size:13px;padding:8px 10px;border:1px solid var(--border-light);border-radius:8px;background:var(--card-bg);color:inherit">'
    +'<button class="btn secondary" style="font-size:12.5px;padding:6px 12px;min-height:auto" onclick="savePlanNote(\''+id+'\')">Αποθήκευση</button>'
    +'</div></div>';
  h+='</div>';  // /grid

  h+='<div class="ph-actions">'
    +'<button class="btn primary" style="font-size:12.5px;padding:8px 14px;min-height:auto" onclick="phToggleMeals(\''+id+'\')">🍽️ Δες το εβδομαδιαίο πλάνο</button>'
    +(prev?'<button class="btn secondary" style="font-size:12.5px;padding:8px 14px;min-height:auto" onclick="openPlanCompare(\''+esc(prev.id)+'\',\''+id+'\')">⇄ Σύγκρινε με το #'+prev.number+'</button>':'')
    +(!isActive?'<button class="btn secondary" style="font-size:12.5px;padding:8px 14px;min-height:auto" onclick="loadPlanAsActive(\''+id+'\')">📥 Φόρτωση ως ενεργό</button>':'')
    +'</div>';
  h+='<div class="ph-meals" id="ph-meals-'+id+'">'+phMealsHtml(p.weekPlan)+'</div>';
  h+='</div>';  // /det
  h+='</div></div>';
  return h;
}

function phMealsHtml(wp){
  if(!wp)return '<span class="ph-muted">Δεν υπάρχει αποθηκευμένο εβδομαδιαίο πλάνο.</span>';
  var h='';
  for(var d=0;d<7;d++){
    if(!wp[d]||!wp[d].length)continue;
    h+='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border-light)"><strong style="color:#025857">'+PH_DAYS[d]+'</strong>';
    wp[d].forEach(function(meal){
      h+='<div style="margin-top:4px"><strong>'+esc(meal.name)+':</strong> '
        +(meal.foods||[]).map(function(f){return esc(f.n)+' ('+f.g+'g)';}).join(', ')+'</div>';
    });
    h+='</div>';
  }
  return h;
}

/* ── compare two plans (overlay) ───────────────────────────────────────── */
function openPlanCompare(idA,idB){
  var c=getC();if(!c)return;
  var plans=phSorted(c);if(plans.length<2)return;
  phEnsureStyle();
  // defaults: B = the given plan (or the newest), A = the given one or the plan right before B
  if(idA&&!idB){
    var ia=plans.findIndex(function(p){return p.id===idA;});
    var newest=plans[plans.length-1];
    if(ia===plans.length-1){idB=idA;idA=plans[ia-1].id;}else{idB=newest.id;}
  }
  if(!idB)idB=plans[plans.length-1].id;
  if(!idA){var ib=plans.findIndex(function(p){return p.id===idB;});idA=plans[Math.max(0,ib-1)].id;if(idA===idB)idA=plans[1].id;}
  var ov=document.getElementById('plan-compare-overlay');
  if(!ov){
    ov=document.createElement('div');ov.id='plan-compare-overlay';
    ov.addEventListener('click',function(e){if(e.target===ov)closePlanCompare();});
    document.body.appendChild(ov);
  }
  ov.innerHTML=phCompareHtml(c,plans,idA,idB);
}
function closePlanCompare(){var ov=document.getElementById('plan-compare-overlay');if(ov)ov.remove();}
function phCompareChange(){
  var a=document.getElementById('phc-a'),b=document.getElementById('phc-b');
  if(a&&b)openPlanCompare(a.value,b.value);
}
function phCompareHtml(c,plans,idA,idB){
  var A=plans.filter(function(p){return p.id===idA;})[0],B=plans.filter(function(p){return p.id===idB;})[0];
  var ia=plans.indexOf(A),ib=plans.indexOf(B);
  function opts(sel){return plans.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===sel?' selected':'')+'>#'+p.number+' · '+phFmtShort(p.date)+' · '+((p.macros&&p.macros.k)||0)+' kcal</option>';}).join('');}
  var h='<div class="phc-box" role="dialog" aria-modal="true" aria-labelledby="phc-title">'
    +'<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px">'
    +'<h2 id="phc-title" style="margin:0;color:#025857;font-size:20px">⇄ Σύγκριση πλάνων</h2>'
    +'<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">'
    +'<label for="phc-a" class="ph-muted" style="font-size:12px">Από</label><select id="phc-a" class="phc-sel" onchange="phCompareChange()">'+opts(idA)+'</select>'
    +'<span class="ph-muted" aria-hidden="true">→</span>'
    +'<label for="phc-b" class="ph-muted" style="font-size:12px">Σε</label><select id="phc-b" class="phc-sel" onchange="phCompareChange()">'+opts(idB)+'</select>'
    +'<button class="btn tertiary" aria-label="Κλείσιμο" style="min-height:36px" onclick="closePlanCompare()">✕</button>'
    +'</div></div>';
  if(!A||!B||A===B){return h+'<div class="ph-muted">Διάλεξε δύο διαφορετικά πλάνα.</div></div>';}
  var mA=A.macros||{},mB=B.macros||{},bA=phBodyAt(c,A),bB=phBodyAt(c,B);
  var today=phToday();
  function per(i){var to=i<plans.length-1?plans[i+1].date:'9999-12-31';var end=i<plans.length-1?plans[i+1].date:today;return {days:phDaysBetween(plans[i].date,end),closed:i<plans.length-1,adh:phAdherence(c,plans[i].date,to)};}
  var pA=per(ia),pB=per(ib);
  function gl(p){var g=(p.ctx&&p.ctx.goalMain)||p.goalMain;return g&&typeof GOAL_LABELS!=='undefined'?(GOAL_LABELS[g]||g):'—';}
  function gpk(g,w){return w?phDec(g/w,2)+'/kg':'';}
  function pcts(m){var a=(m.p||0)*4,b=(m.c||0)*4,f=(m.f||0)*9,t=Math.max(1,a+b+f);var x=Math.round(a*100/t),y=Math.round(b*100/t);return x+' / '+y+' / '+Math.max(0,100-x-y);}
  function row(lbl,a,b,d,bold){return '<div class="phc-tr"'+(bold?' style="background:var(--panel-bg);font-weight:700"':'')+'><span class="ph-muted" style="font-weight:400">'+lbl+'</span><span>'+a+'</span><span>'+b+'</span><span style="font-weight:600">'+(d||'')+'</span></div>';}
  var gA=gl(A),gB=gl(B);
  var t='<div class="ph-card" style="display:flex;flex-direction:column">'
    +'<div class="phc-tr h"><span></span><span>#'+A.number+' · '+phFmtShort(A.date)+'</span><span>#'+B.number+' · '+phFmtShort(B.date)+'</span><span>Διαφορά</span></div>'
    +row('Στόχος',esc(gA),esc(gB),gA!==gB?'άλλαξε':'ίδιος')
    +row('Βάρος τότε',bA.w?phDec(bA.w)+' kg':'—',bB.w?phDec(bB.w)+' kg':'—',bA.w&&bB.w?phSigned(bB.w-bA.w,' kg',1):'')
    +row('Λίπος τότε',bA.bf?phDec(bA.bf)+'%':'—',bB.bf?phDec(bB.bf)+'%':'—',bA.bf&&bB.bf?phSigned(bB.bf-bA.bf,'',1):'')
    +row('Θερμίδες',mA.k||0,mB.k||0,phSigned((mB.k||0)-(mA.k||0),''),true)
    +row('Πρωτεΐνη',mA.p+' g '+gpk(mA.p,bA.w),mB.p+' g '+gpk(mB.p,bB.w),bA.w&&bB.w?phSigned(mB.p/bB.w-mA.p/bA.w,' g/kg',2):phSigned(mB.p-mA.p,' g'))
    +row('Υδατάνθρακες',mA.c+' g '+gpk(mA.c,bA.w),mB.c+' g '+gpk(mB.c,bB.w),bA.w&&bB.w?phSigned(mB.c/bB.w-mA.c/bA.w,' g/kg',2):phSigned(mB.c-mA.c,' g'))
    +row('Λίπος',mA.f+' g '+gpk(mA.f,bA.w),mB.f+' g '+gpk(mB.f,bB.w),bA.w&&bB.w?phSigned(mB.f/bB.w-mA.f/bA.w,' g/kg',2):phSigned(mB.f-mA.f,' g'))
    +row('Αναλογία P / C / F',pcts(mA),pcts(mB),'')
    +(mA.fi!=null||mB.fi!=null?row('Φυτικές ίνες',mA.fi!=null?mA.fi+' g':'—',mB.fi!=null?mB.fi+' g':'—',mA.fi!=null&&mB.fi!=null?phSigned(mB.fi-mA.fi,' g'):''):'')
    +row('Διάρκεια',pA.closed?pA.days+' μέρες':'ενεργό',pB.closed?pB.days+' μέρες':'ενεργό','')
    +row('Τήρηση',pA.adh?'<span class="ph-pill" style="'+phAdhColor(pA.adh.pct)+'">'+pA.adh.pct+'%</span>':'—',pB.adh?'<span class="ph-pill" style="'+phAdhColor(pB.adh.pct)+'">'+pB.adh.pct+'%</span>':'—',pA.adh&&pB.adh?phSigned(pB.adh.pct-pA.adh.pct,' μον.'):'');
  // per-day kcal bars
  var dA=phDayKcal(A.weekPlan),dB=phDayKcal(B.weekPlan),mx=Math.max.apply(null,dA.concat(dB).concat([1]));
  t+='<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px"><span class="ph-lbl">kcal ανά ημέρα</span>'
    +'<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;align-items:end;height:90px">';
  for(var d=0;d<7;d++){
    t+='<div style="display:flex;gap:3px;align-items:flex-end;height:100%" title="'+PH_DAYS[d]+': #'+A.number+' '+dA[d]+' kcal · #'+B.number+' '+dB[d]+' kcal">'
      +'<div style="flex:1;height:'+Math.round(dA[d]*100/mx)+'%;background:#8fb3b3;border-radius:3px 3px 0 0"></div>'
      +'<div style="flex:1;height:'+Math.round(dB[d]*100/mx)+'%;background:#025857;border-radius:3px 3px 0 0"></div></div>';
  }
  t+='</div><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;font-size:11px;text-align:center" class="ph-muted">'+PH_DAYS_SHORT.map(function(x){return '<span>'+x+'</span>';}).join('')+'</div>'
    +'<div style="display:flex;gap:14px;font-size:11px"><span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;background:#8fb3b3;display:inline-block"></span>#'+A.number+'</span><span style="display:flex;align-items:center;gap:5px"><span style="width:10px;height:10px;background:#025857;display:inline-block"></span>#'+B.number+'</span></div></div>';
  t+='</div>';
  // food diff
  var df=phDiff(A.weekPlan,B.weekPlan);
  function tagList(arr,cls,pre){return arr.length?'<div style="display:flex;flex-wrap:wrap;gap:6px">'+arr.map(function(n){return '<span class="ph-tag '+cls+'">'+pre+esc(n)+'</span>';}).join('')+'</div>':'<div class="ph-muted" style="font-size:12.5px">—</div>';}
  var f='<div class="ph-card" style="display:flex;flex-direction:column;gap:14px">'
    +'<div class="ph-sec"><span class="ph-lbl">Μπήκαν στο #'+B.number+'</span>'+tagList(df.added,'ph-add','+ ')+'</div>'
    +'<div class="ph-sec"><span class="ph-lbl">Βγήκαν από το #'+A.number+'</span>'+tagList(df.removed,'ph-rem','− ')+'</div>'
    +'<div class="ph-sec"><span class="ph-lbl">Άλλαξε η ποσότητα (μ.ο. μερίδας)</span>'
    +(df.changed.length?'<div style="display:flex;flex-direction:column;font-size:13px">'+df.changed.map(function(x){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--border-light)"><span>'+esc(x.n)+'</span><span style="font-weight:600;white-space:nowrap">'+x.from+' → '+x.to+' g</span></div>';}).join('')+'</div>':'<div class="ph-muted" style="font-size:12.5px">—</div>')
    +'</div>'
    +'<div style="margin-top:auto;background:var(--panel-bg);border:1px solid var(--border-light);border-radius:8px;padding:9px 12px;font-size:12px">Ίδια γεύματα: '+(df.mealsTotal-df.mealsChanged)+' από '+df.mealsTotal+'</div>'
    +'</div>';
  return h+'<div class="phc-grid">'+t+f+'</div></div>';
}

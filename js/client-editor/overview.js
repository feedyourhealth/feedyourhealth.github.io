// js/client-editor/overview.js
// The "📇 Επισκόπηση" client sub-tab — a read-only aggregation view over data the app
// already holds: status header (weight/BF vs goal, plan-link state, last visit) + a
// single chronological history feed (measurements, saved plans, portal feedback,
// client notes, appointment notes, intake) + a right rail (latest feedback verbatim,
// intake summary, the dietitian's own free-text notes).
//
// Zero new storage: buildOverviewHtml(c) recomputes everything on each open from
// c.* and the window.Cloud portal caches. Wired as tab TAB_OVERVIEW in
// js/client-editor/form-controls.js (swTab) and rendered into #s0ov, which
// js/client-editor/render-main.js emits just above #s1. selectClient() lands here.
// Loads right after render-main.js; every cross-reference resolves at call time.

function ovDateShort(d){
  try{ return new Date(d).toLocaleDateString('el-GR',{day:'numeric',month:'short',year:'numeric'}); }
  catch(e){ return String(d||''); }
}
function ovAgo(ts){
  var ms=Date.now()-(+ts||0);
  var days=Math.floor(ms/86400000);
  if(days<=0) return 'σήμερα';
  if(days===1) return 'χθες';
  if(days<7)  return 'πριν '+days+' ημέρες';
  if(days<60) return 'πριν '+Math.floor(days/7)+' εβδ.';
  if(days<730)return 'πριν '+Math.floor(days/30)+' μήνες';
  return 'πριν '+Math.floor(days/365)+' χρόνια';
}
function ovStars(v){
  var n=Math.max(0,Math.min(5,Math.round(+v||0)));
  return '<span style="color:#f0b429;letter-spacing:1px;font-size:13px">'+('★★★★★').slice(0,n)+('☆☆☆☆☆').slice(0,5-n)+'</span>';
}
var OV_DIET_LBL={normal:'Κανονική',vegetarian:'Χορτοφαγική',vegan:'Vegan',keto:'Κετογονική',orthodox_fasting:'Ορθόδοξη Νηστεία',intermittent_fasting:'Διαλείπουσα Νηστεία',bodybuilding_clean:'Bodybuilding Clean',kids_10_14:'Παιδιά 10-14',mediterranean:'Μεσογειακή'};
var OV_GOAL_LBL={loss:'Απώλεια βάρους',mild:'Ήπια απώλεια',maintain:'Διατήρηση',gain:'Αύξηση μάζας',running:'Δρομείς'};

function buildOverviewHtml(c){
  if(!c) return '';
  var CL=window.Cloud||{};
  var fb    =(typeof CL.planFeedbackFor==='function')  ? (CL.planFeedbackFor(c)||[])   : [];
  var clogs =(typeof CL.allClientLogsFor==='function') ? (CL.allClientLogsFor(c)||[])  : [];
  var linkH =(typeof CL.linkHealthFor==='function')    ? CL.linkHealthFor(c)           : {checked:false};
  var stale =(typeof CL.isStale==='function')          ? CL.isStale(c)                 : false;
  var intakePayload=(window.INTAKE_PAYLOAD_CACHE && c.intakeToken && Object.prototype.hasOwnProperty.call(window.INTAKE_PAYLOAD_CACHE,c.intakeToken))
    ? window.INTAKE_PAYLOAD_CACHE[c.intakeToken] : null;

  var age=(c.birthDate && typeof ageAtDate==='function') ? ageAtDate(c.birthDate) : c.age;
  var sexTxt=c.sex==='M'?'Άνδρας':(c.sex==='F'?'Γυναίκα':'');
  var dietTxt=OV_DIET_LBL[c.dietType]||'';

  // ── weight / body-fat progress ──
  var wl=(c.weightLog||[]).slice().sort(function(a,b){return (a.date<b.date)?-1:(a.date>b.date?1:0);});
  var first=wl.length?wl[0]:null, last=wl.length?wl[wl.length-1]:null;
  var startW=first?first.weight:(c.weight||null);
  var curW  =last ?last.weight :(c.weight||null);
  var goalW =c.goalWeight||c.targetWeight||null;
  var curBf =(last && last.bf>0)?last.bf:(c.bf>0?c.bf:null);
  var startBf=(first && first.bf>0)?first.bf:null;
  var goalBf=c.goalBF||null;
  var dec=function(x){ return (x==null)?'—':String(x).replace('.',','); };

  // ── plan-link status ──
  var hasLink=!!c.shareToken;
  var planParts=[];
  if(hasLink){
    if(c.planGeneratedAt) planParts.push('φτιάχτηκε '+ovAgo(c.planGeneratedAt));
    if(linkH && linkH.checked){
      if(linkH.exists===false) planParts.push('⚠ ο σύνδεσμος δεν βρέθηκε στη βάση');
      else if(linkH.expired)   planParts.push('⚠ ο σύνδεσμος έληξε');
      else if(linkH.expiresAt){
        var dl=Math.ceil((new Date(linkH.expiresAt)-Date.now())/86400000);
        if(dl>=0) planParts.push('λήγει σε '+dl+' ημ.');
      }
    }
    planParts.push(stale?'⚠ ξεπερασμένος (άλλαξε το πλάνο)':'ενημερωμένος');
  }
  var planPillCls=hasLink && !stale && !(linkH && (linkH.expired||linkH.exists===false)) ? 'ok' : (hasLink?'warn':'');
  var planPill=hasLink
    ? ('📱 Πλάνο: '+esc(planParts.join(' · ')))
    : '📱 Δεν έχει σταλεί πλάνο ακόμη';

  // ── last visit ──
  var appts=(c.appointments||[]).filter(function(e){return e && e.date;});
  var realAppts=appts.filter(function(e){return !e.status;});
  var lastVisit=realAppts.length?realAppts[realAppts.length-1].date:null;

  // ── build the chronological feed ──
  var ev=[];
  function push(ts,kind,title,detail,act){ if(ts==null||isNaN(+new Date(ts)))return; ev.push({ts:+new Date(ts),kind:kind,title:title,detail:detail||'',act:act||''}); }

  // client created (c.id === 'c'+Date.now())
  var createdTs=parseInt(String(c.id||'').replace(/^c/,''),10);
  if(createdTs>0) push(createdTs,'created','👤 Ο πελάτης δημιουργήθηκε','');

  // measurements
  wl.forEach(function(e){
    var bits=[e.weight!=null?dec(e.weight)+' kg':null, (e.bf>0)?dec(e.bf)+'% λίπος'+(e.bfMethod?' ('+esc(e.bfMethod)+')':''):null, e.waist?('μέση '+dec(e.waist)+' cm'):null].filter(Boolean);
    push(e.date,'meas','📐 Μέτρηση', bits.join(' · '));
  });

  // saved plans (the dietitian's plan history)
  (c.savedPlans||[]).forEach(function(p){
    var when=p.date||p.createdAt;
    push(when,'plan','📱 Πλάνο #'+(p.number||'?')+' αποθηκεύτηκε', p.note?esc(p.note):'');
  });
  // last generation, if newer than any saved plan
  if(c.planGeneratedAt){
    var newestSaved=(c.savedPlans||[]).reduce(function(m,p){var t=+new Date(p.date||p.createdAt||0);return t>m?t:m;},0);
    if(c.planGeneratedAt>newestSaved+3600000) push(c.planGeneratedAt,'plan','✨ Το πλάνο (ανα)δημιουργήθηκε','');
  }

  // weekly plan feedback from the portal
  fb.forEach(function(r){
    var sc=[r.breakfast,r.lunch,r.dinner,r.snacks].filter(function(x){return x!=null;});
    var avg=sc.length?Math.round(sc.reduce(function(a,b){return a+ (+b||0);},0)/sc.length):null;
    var reasons=r.low_rating_reasons;
    var rtxt=Array.isArray(reasons)?reasons.join(', '):(reasons||'');
    var det=[];
    if(avg!=null) det.push('γεύματα ~'+avg+'/5');
    if(r.recipes_ease!=null) det.push('συνταγές '+r.recipes_ease+'/5');
    if(r.training_energy!=null) det.push('ενέργεια προπ. '+r.training_energy+'/5');
    if(r.continue_likelihood!=null) det.push('θα συνέχιζε '+r.continue_likelihood+'/10');
    push(r.week_start,'fb','⭐ Feedback εβδομάδας', esc(det.join(' · '))+(rtxt?' — «'+esc(rtxt)+'»':''),
      '<button type="button" class="ov-mini" onclick="swTab(TAB_APPOINTMENTS)">Άνοιγμα Παρακολούθησης</button>');
  });

  // client-written notes / self-reported weight from the portal
  clogs.forEach(function(l){
    var bits=[];
    if(l.weight_kg!=null) bits.push('βάρος (δικό του) '+dec(l.weight_kg)+' kg');
    if(l.note) bits.push('«'+esc(l.note)+'»');
    if(!bits.length) return;
    push(l.date,'msg','💬 Καταχώρηση πελάτη', bits.join(' · '));
  });

  // appointment notes
  realAppts.forEach(function(e){
    if(!e.notes && !(e.chips&&e.chips.length)) { push(e.date,'appt','🗓 Ραντεβού',''); return; }
    var d=[];
    if(e.chips&&e.chips.length) d.push(e.chips.join(', '));
    if(e.notes) d.push('«'+esc(e.notes)+'»');
    push(e.date,'appt','📝 Σημείωση ραντεβού', d.join(' — '));
  });
  // absences
  appts.filter(function(e){return e.status;}).forEach(function(e){
    push(e.date,'appt','🚫 Απουσία', e.notes?('«'+esc(e.notes)+'»'):'');
  });

  // intake
  if(c.intakeSentAt)      push(c.intakeSentAt,'intake','📋 Ερωτηματολόγιο στάλθηκε','');
  if(c.intakeSubmittedAt) push(c.intakeSubmittedAt,'intake','📋 Ερωτηματολόγιο υποβλήθηκε',
    intakePayload ? 'δες τη σύνοψη δεξιά →' : '');

  ev.sort(function(a,b){return b.ts-a.ts;});

  var DOT={meas:'#4a90d9',plan:'#025857',fb:'#f0b429',msg:'#9c8fd9',appt:'#8a9a97',intake:'#7aa6a2',created:'#c5c5c5'};
  var feedHtml = ev.length ? ev.map(function(e){
    return '<div style="position:relative;margin-bottom:14px">'
      +'<span style="position:absolute;left:-26px;top:3px;width:16px;height:16px;border-radius:50%;background:var(--card-bg);border:3px solid '+(DOT[e.kind]||'#bbb')+'"></span>'
      +'<div style="font-size:11px;font-weight:700;color:#7aa6a2;margin-bottom:3px">'+esc(ovDateShort(new Date(e.ts))).toUpperCase()+'</div>'
      +'<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:10px;padding:11px 13px">'
        +'<div style="font-size:13px;font-weight:600;color:var(--text-strong)">'+e.title+'</div>'
        +(e.detail?'<div style="font-size:12px;color:#5c6b68;margin-top:3px">'+e.detail+'</div>':'')
        +(e.act?'<div style="margin-top:8px">'+e.act+'</div>':'')
      +'</div>'
    +'</div>';
  }).join('') : '<div style="color:var(--text-muted);font-size:12px;padding:12px 0">Δεν υπάρχει ιστορικό ακόμη.</div>';

  // ── right rail: latest feedback ──
  var railFb='';
  if(fb.length){
    var r0=fb[0];
    var row=function(lbl,v){ return (v==null)?'' : '<div style="font-size:12px;color:#4a5a57;margin:4px 0;display:flex;gap:6px"><b style="color:var(--text-strong);font-weight:700;min-width:88px">'+lbl+'</b>'+ovStars(v)+'</div>'; };
    var rzn=Array.isArray(r0.low_rating_reasons)?r0.low_rating_reasons.join(', '):(r0.low_rating_reasons||'');
    railFb='<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:11px;padding:13px 14px;margin-bottom:14px">'
      +'<h4 style="margin:0 0 8px;font-size:12px;font-weight:700;color:#025857">⭐ Τελευταίο feedback ('+esc(ovDateShort(r0.week_start))+')</h4>'
      +(rzn?'<div style="font-size:12.5px;color:#374a47;font-style:italic;border-left:3px solid #f0b429;padding:2px 0 2px 10px;line-height:1.5;margin-bottom:9px">«'+esc(rzn)+'»</div>':'')
      +row('Πρωινό',r0.breakfast)+row('Μεσημ.',r0.lunch)+row('Βραδινό',r0.dinner)+row('Σνακ',r0.snacks)
      +row('Συνταγές',r0.recipes_ease)+row('Υλικά',r0.ingredients_ease)+row('Προπόνηση',r0.training_energy)
      +(r0.continue_likelihood!=null?'<div style="font-size:12px;color:#4a5a57;margin-top:6px"><b style="color:var(--text-strong)">Θα συνέχιζε:</b> '+esc(r0.continue_likelihood)+'/10</div>':'')
      +'</div>';
  }

  // ── right rail: intake summary ──
  var railIntake='';
  if(intakePayload){
    var p=intakePayload;
    var L=(typeof INTAKE_LBL!=='undefined')?INTAKE_LBL:{};
    var kv=function(k,v){ return v ? '<div style="font-size:12px;color:#4a5a57;margin:4px 0"><b style="color:var(--text-strong);font-weight:700">'+k+':</b> '+esc(v)+'</div>' : ''; };
    var tr=function(dict,keys){ return (keys&&keys.length)?keys.map(function(k){ return (L[dict]&&L[dict][k])||k; }).join(', '):''; };
    var goalTxt=((L.goal&&L.goal[p.goal])||p.goal||'')+((p.goal==='other'&&p.goalOther)?(' — '+p.goalOther):'');
    var hab=p.habits||{};
    railIntake='<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:11px;padding:13px 14px;margin-bottom:14px">'
      +'<h4 style="margin:0 0 8px;font-size:12px;font-weight:700;color:#025857">📋 Από το ερωτηματολόγιο</h4>'
      +kv('Στόχος',goalTxt)
      +kv('Ιατρικά',tr('cond',p.conditions))
      +kv('Αλλεργίες',[tr('allergy',p.allergies),p.allergiesOther].filter(Boolean).join(', '))
      +kv('Αποφεύγει',tr('avoid',p.avoid))
      +(p.pregnancyBreastfeeding?kv('Εγκυμοσύνη/θηλασμός','Ναι'):'')
      +kv('Φάρμακα',p.meds)
      +kv('Γεύματα/ημ.',hab.mealsPerDay)
      +kv('Πρωινό',(L.breakfast&&L.breakfast[hab.breakfast])||hab.breakfast)
      +kv('Μαγείρεμα',(L.cooking&&L.cooking[hab.cooking])||hab.cooking)
      +kv('Άσκηση',hab.exercise)
      +kv('Αρέσουν',p.likes)
      +kv('Δεν αρέσουν',p.dislikes)
      +kv('Σχόλιο',p.note)
      +'</div>';
  } else if(c.intakeStatus){
    var st={sent:'στάλθηκε — εκκρεμεί',submitted:'υποβλήθηκε '+(c.intakeSubmittedAt?esc(ovDateShort(c.intakeSubmittedAt)):''),superseded:'αντικαταστάθηκε από νεότερο'}[c.intakeStatus]||c.intakeStatus;
    railIntake='<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:11px;padding:13px 14px;margin-bottom:14px">'
      +'<h4 style="margin:0 0 6px;font-size:12px;font-weight:700;color:#025857">📋 Ερωτηματολόγιο</h4>'
      +'<div style="font-size:12px;color:#5c6b68">'+st+(c.intakeStatus==='submitted'?' — <button type="button" class="ov-mini" onclick="swTab(1)">δες στην καρτέλα</button>':'')+'</div>'
      +'</div>';
  }

  // ── right rail: dietitian's own notes ──
  var lastApptNote=realAppts.length?realAppts[realAppts.length-1].notes:'';
  var railNotes='<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:11px;padding:13px 14px">'
    +'<h4 style="margin:0 0 8px;font-size:12px;font-weight:700;color:#025857">📝 Σημειώσεις / προτιμήσεις</h4>'
    +'<div style="border:1px dashed #cbd8d5;border-radius:8px;background:var(--panel-bg);padding:9px 10px;font-size:12px;color:#5c6b68;white-space:pre-wrap;min-height:44px">'
      +(esc(c.preferences||'').trim()||'—')
    +'</div>'
    +(lastApptNote?'<div style="font-size:11.5px;color:#7a8b88;margin-top:8px">Τελευταίο ραντεβού: «'+esc(lastApptNote)+'»</div>':'')
    +'</div>';

  // ── status header pills ──
  var pills=[];
  if(c.goalMain) pills.push('🎯 '+esc(OV_GOAL_LBL[c.goalMain]||c.goalMain)+(c.goal&&parseInt(c.goal)?' · '+(parseInt(c.goal)>=0?'+':'')+parseInt(c.goal)+' kcal':''));
  if(startW!=null||curW!=null) pills.push('⚖️ '+dec(startW)+' → <b>'+dec(curW)+'</b> kg'+(goalW?' <span style="color:#7aa6a2">(στόχος '+dec(goalW)+')</span>':''));
  if(curBf!=null) pills.push('📉 Λίπος '+(startBf!=null?dec(startBf)+'% → ':'')+'<b>'+dec(curBf)+'%</b>'+(goalBf?' <span style="color:#7aa6a2">(στόχος '+dec(goalBf)+'%)</span>':''));
  pills.push('<span class="ov-pill-'+(planPillCls||'plain')+'">'+planPill+'</span>');
  if(lastVisit) pills.push('🗓 Τελευταία επίσκεψη '+esc(ovDateShort(lastVisit)));
  else pills.push('🗓 Τελευταίο άνοιγμα '+(c.lastAccess?ovAgo(c.lastAccess):'—'));

  var pillHtml=pills.map(function(p){
    if(p.indexOf('ov-pill-')>-1) return p.replace('ov-pill-ok','ov-pill" style="border-color:#a5d6a7;color:#2e7d32')
                                        .replace('ov-pill-warn','ov-pill" style="border-color:#f0d9a0;color:#8a6100;background:#fff8e1')
                                        .replace('ov-pill-plain','ov-pill');
    return '<span class="ov-pill">'+p+'</span>';
  }).join('');

  var portalUrl=(hasLink && CL.PORTAL_BASE) ? (CL.PORTAL_BASE+'?t='+encodeURIComponent(c.shareToken)) : '';

  return ''
    +'<style>'
    +'.ov-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px}'
    +'@media(max-width:900px){.ov-grid{grid-template-columns:1fr}}'
    +'.ov-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.72);border:1px solid #cfe3dd;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:600;color:#025857}'
    +'.ov-mini{font:inherit;font-size:11px;font-weight:700;background:#eef6f4;color:#025857;border:1px solid #cde2dc;border-radius:6px;padding:5px 9px;cursor:pointer}'
    +'.ov-mini:hover{background:#e0efeb}'
    +'.ov-feed{position:relative;padding-left:26px}'
    +'.ov-feed::before{content:"";position:absolute;left:7px;top:4px;bottom:8px;width:2px;background:var(--border-light)}'
    +'</style>'
    +'<div style="background:linear-gradient(135deg,#e8f5e9 0%,#f1f8e9 100%);border:1.5px solid #c8e6c9;border-radius:12px;padding:15px 18px;margin-bottom:16px">'
      +'<h2 style="margin:0 0 4px;color:#025857;font-size:17px">👤 '+esc(c.name||'—')+'</h2>'
      +'<div style="font-size:12.5px;color:#4a7972;font-weight:600">'+[sexTxt,(age!=null&&!isNaN(age))?age+' ετών':'',dietTxt].filter(Boolean).join(' · ')+'</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px">'+pillHtml+'</div>'
      +'<div style="display:flex;gap:8px;margin-top:13px;flex-wrap:wrap">'
        +(portalUrl?'<button type="button" class="btn primary" style="font-size:12px;padding:8px 13px" onclick="window.open(\''+portalUrl+'\',\'_blank\',\'noopener\')">📱 Άνοιγμα link πελάτη</button>':'')
        +'<button type="button" class="btn secondary" style="font-size:12px;padding:8px 13px" onclick="swTab(2)">📊 Πλάνο &amp; αποστολή</button>'
        +'<button type="button" class="btn tertiary" style="font-size:12px;padding:8px 13px" onclick="swTab(1)">✏️ Επεξεργασία στοιχείων</button>'
      +'</div>'
    +'</div>'
    +'<div class="ov-grid">'
      +'<div>'
        +'<div style="font-size:12px;font-weight:700;color:#025857;margin:2px 0 10px">Ιστορικό</div>'
        +'<div class="ov-feed">'+feedHtml+'</div>'
      +'</div>'
      +'<div>'
        +'<div style="font-size:12px;font-weight:700;color:#025857;margin:2px 0 10px">Με μια ματιά</div>'
        +(railFb||'<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:11px;padding:13px 14px;margin-bottom:14px;font-size:12px;color:var(--text-muted)">Δεν έχει στείλει feedback ακόμη.</div>')
        +railIntake
        +railNotes
      +'</div>'
    +'</div>';
}

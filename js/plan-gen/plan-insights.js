// js/plan-gen/plan-insights.js
// 📲 «Ο πελάτης στο link» ΜΕΣΑ στο Πλάνο (2026-11-22, πρόταση 2 από τα δεδομένα χρήσης, ιδέες Β+Γ).
// Το 60% των πλάνων φτιάχνεται την ίδια μέρα με τη μέτρηση· οι επιλογές του πελάτη στο link
// («Αυτό έφαγα», «Όχι για μένα», ✅) φαίνονταν μόνο στην Πρόοδο. Εδώ:
//   Β. σημάδια πάνω στον πίνακα: τήρηση ανά γεύμα στην κεφαλίδα του γεύματος, 🔄 στα κελιά που
//      αλλάζει συχνά (με «Βάλ' το σε όλη την εβδομάδα»), 👎 στα κελιά με τρόφιμο που απορρίπτει.
//   Γ. πλαϊνό πάνελ «📲 Ο πελάτης» που μένει ανοιχτό όσο δουλεύεις (θυμάται ανοιχτό/κλειστό).
// Καμία νέα κλήση στη βάση: διαβάζει τα caches που ήδη φορτώνει η εφαρμογή (checkins, meal log,
// alt rejects, workout log, client logs). Στο άνοιγμα του πάνελ φρεσκάρει μόνο ΑΥΤΟΝ τον πελάτη.
// Χρησιμοποιεί τα helpers της Προόδου (tabs/progress.js, tabs/progress-rejects.js) — runtime only.

var PI_WEEKS=4;              // παράθυρο για τήρηση / αλλαγές
var PI_LOW_PCT=60;           // κάτω από αυτό η τήρηση γεύματος βγαίνει πορτοκαλί
var _piCache={id:null,t:0,data:null};
var _piFlags=[];             // τα flags της τελευταίας σχεδίασης (για τα κουμπιά)

function piIsOpen(){ try{ return localStorage.getItem('fyh_pi_open')==='1'; }catch(e){ return false; } }
function piRemember(v){ try{ localStorage.setItem('fyh_pi_open',v?'1':'0'); }catch(e){} }

// Όλα τα στοιχεία του link για τον πελάτη, ή null αν δεν έχει link / τίποτα καταγεγραμμένο.
function piData(c){
  var C=window.Cloud;
  if(!c || !c.shareToken || !C || typeof C.checkinsFor!=='function') return null;
  if(_piCache.id===c.id && Date.now()-_piCache.t<1500) return _piCache.data;
  var ckRows=C.checkinsFor(c)||[];
  var log=(typeof C.mealLogFor==='function')?C.mealLogFor(c):{};
  var logKeys=Object.keys(log).sort();
  var firstKey=[ckRows.length?ckRows[0].date:null, logKeys[0]||null].filter(Boolean).sort()[0]||null;
  var rej=(typeof progressActiveRejects==='function')?progressActiveRejects(c):[];
  var notes=(typeof C.allClientLogsFor==='function'?C.allClientLogsFor(c):[]).filter(function(e){ return e && e.note && !/^\[tag:[a-z]+\]$/.test(String(e.note).trim()); }).slice(0,3);
  if(!firstKey && !rej.length && !notes.length){ _piCache={id:c.id,t:Date.now(),data:null}; return null; }

  var dates=(typeof progressSwapDates==='function')?progressSwapDates(PI_WEEKS):[];
  var ckBy=(typeof ckRowsByDate==='function')?ckRowsByDate(ckRows):{};
  var mealNames=((c.weekPlan||{})[0]||[]).map(function(m){ return m.name; });
  var slots=mealNames.map(function(n){ return {name:n,planned:0,alt:0,total:0}; });
  var totDone=0,totAll=0,daysLogged=0,daysAll=0;
  dates.forEach(function(k){
    if(!firstKey || k<firstKey) return;
    daysAll++;
    var tot=(typeof progressSwapMealsTotal==='function')?progressSwapMealsTotal(c,ckBy[k],k):mealNames.length;
    var m=log[k]||{}, ck=ckBy[k], any=false;
    // Check-in με τσεκαρισμένα γεύματα αλλά χωρίς ανά-γεύμα map (παλιό link / άλλη συσκευή):
    // δεν ξέρουμε ΠΟΙΑ γεύματα → η μέρα δεν μετρά στην τήρηση ανά γεύμα (μόνο στο σύνολο παρακάτω).
    var slotKnown=!(!log[k] && ck && ck.meals_done>0);
    for(var j=0;j<tot && slotKnown;j++){
      var v=m[j];
      if(slots[j]) slots[j].total++;
      if(v){ any=true; if(slots[j]){ if(typeof v==='object'&&!v.mx) slots[j].alt++; else slots[j].planned++; } }   // 🧩 v.mx = επιλογή από το Μενού = ακολούθησε
    }
    // Μέρες με μόνο check-in (παλιά links χωρίς ανά-γεύμα map) μετράνε στο σύνολο
    var done=Object.keys(m).filter(function(i){ return m[i]; }).length;
    if(!done && ck && ck.meals_done) done=ck.meals_done;
    if(done || (ck && ((ck.water_glasses||0)>0 || (ck.supps_done||0)>0))) any=true;
    totDone+=Math.min(done,tot); totAll+=tot;
    if(any) daysLogged++;
  });
  slots.forEach(function(s){ s.pct=s.total?Math.round((s.planned+s.alt)/s.total*100):null; });

  var stats=(typeof progressSwapStats==='function')?progressSwapStats(c,dates,log,ckBy,firstKey):{swaps:[]};
  var flags=(typeof progressSwapFlags==='function')?progressSwapFlags(c,stats.swaps):[];
  flags.forEach(function(fl){
    fl.hits=(typeof progressSwapPlanMatches==='function')?progressSwapPlanMatches(c,fl.s,fl.o):[];
    fl.slot=mealNames.indexOf(fl.s);
  });
  var rejFoods=(typeof progressRejFoodFlags==='function')?progressRejFoodFlags(c,rej):[];

  var wk=0;
  if(typeof C.workoutLogFor==='function'){
    var wl=C.workoutLogFor(c);
    dates.forEach(function(k){ var e=wl[k]; if(e && (e.d || e.e)) wk++; });
  }
  var lu=(typeof linkUsage==='function')?linkUsage(c):null;
  var data={firstKey:firstKey, days:daysAll, daysLogged:daysLogged,
    pct:totAll?Math.round(totDone/totAll*100):null, slots:slots, flags:flags,
    rej:rej, rejFoods:rejFoods, notes:notes, workouts:wk, usage:lu};
  _piCache={id:c.id,t:Date.now(),data:data};
  return data;
}

// ── Β: σημάδια στον πίνακα ────────────────────────────────────────────────────────────────
// Κεφαλίδα γεύματος (renderWeekTable): «✅ 92%» + «🔄 5×» αν το γεύμα αυτό αλλάζει συχνά.
function piSlotHeaderHtml(c,mi){
  var d=piData(c); if(!d) return '';
  var s=d.slots[mi], out='';
  if(s && s.pct!=null) out+='<span class="pi-slot'+(s.pct<PI_LOW_PCT?' pi-low':'')+'" title="Τήρηση αυτού του γεύματος τις τελευταίες '+PI_WEEKS+' εβδομάδες (από το link)">✅ '+s.pct+'%</span>';
  d.flags.forEach(function(fl,fi){
    var here=(fl.hits||[]).some(function(h){ return h.mi===mi; }) || (!(fl.hits||[]).length && fl.slot===mi);
    if(here) out+='<button type="button" class="pi-mk" onclick="piOpenFlag('+fi+')" title="Το αλλάζει συχνά — πάτα για λεπτομέρειες">🔄 '+fl.count+'×</button>';
  });
  return out;
}
// Κελί ημέρας: 🔄 αν είναι το γεύμα που αλλάζει, 👎 αν έχει τρόφιμο που απορρίπτει επανειλημμένα.
function piCellBadgesHtml(c,d,mi){
  var data=piData(c); if(!data) return '';
  var out='';
  data.flags.forEach(function(fl,fi){
    if((fl.hits||[]).some(function(h){ return h.d===d && h.mi===mi; }))
      out+='<button type="button" class="pi-cell pi-cell-sw" onclick="event.stopPropagation();piOpenFlag('+fi+')" title="Ο πελάτης το αλλάζει συχνά με «'+esc(fl.top?fl.top.n:'')+'»">🔄 '+fl.count+'×</button>';
  });
  if(data.rejFoods.length){
    var meal=(c.weekPlan[d]||[])[mi], names={};
    ((meal&&meal.foods)||[]).forEach(function(f){ names[(typeof progressRejFoodName==='function')?progressRejFoodName(f.n):f.n]=1; });
    var hit=data.rejFoods.filter(function(x){ return names[x.n]; });
    if(hit.length) out+='<button type="button" class="pi-cell pi-cell-rj" onclick="event.stopPropagation();piToggle(true)" title="Το απορρίπτει στις εναλλακτικές («Όχι για μένα»)">👎 '+esc(hit.map(function(x){return x.n;}).join(', '))+'</button>';
  }
  return out;
}

// ── Γ: πλαϊνό πάνελ ─────────────────────────────────────────────────────────────────────
function piToggleBtnHtml(c){
  if(!c || !c.shareToken) return '';
  var open=piIsOpen();
  return '<button type="button" class="pi-toggle'+(open?' on':'')+'" onclick="piToggle()" title="Τι κάνει ο πελάτης στο link — μένει ανοιχτό όσο δουλεύεις το πλάνο">📲 Ο πελάτης'+(open?' ✕':'')+'</button>';
}
function piToggle(force){
  var open=(force===true)?true:!piIsOpen();
  piRemember(open);
  var c=getC();
  if(open && c && window.Cloud){
    var C=window.Cloud, jobs=[];
    if(typeof C.refreshMealLogFor==='function') jobs.push(C.refreshMealLogFor(c));
    if(typeof C.refreshAltRejectFor==='function') jobs.push(C.refreshAltRejectFor(c));
    if(jobs.length) Promise.all(jobs).then(function(){ _piCache.t=0; if(getC()===c && typeof renderWeekTable==='function') renderWeekTable(); },function(){});
  }
  _piCache.t=0;
  if(typeof renderWeekTable==='function') renderWeekTable();
}
function piRow(lbl,val){ return '<div class="pi-kv"><span>'+lbl+'</span><b>'+val+'</b></div>'; }
function piPanelInnerHtml(c){
  var d=piData(c);
  var h='<div class="pi-hd"><b>📲 '+esc((c.name||'').split(' ')[0]||'Ο πελάτης')+' στο link</b><button type="button" class="pi-x" onclick="piToggle()" aria-label="Κλείσιμο">✕</button></div>';
  if(!d) return h+'<div class="pi-empty">Δεν υπάρχει ακόμα τίποτα από το link.'+(((typeof linkUsage==='function')&&linkUsage(c)&&linkUsage(c).state==='never')?' <br>📵 Δεν έχει σημειώσει ποτέ κάτι από την αποστολή του πλάνου.':'')+'</div>';
  h+='<div class="pi-sub">Τελευταίες '+PI_WEEKS+' εβδομάδες</div>';
  if(d.usage && d.usage.state==='stopped') h+='<div class="pi-warn">⏸ Σταμάτησε να σημειώνει πριν '+d.usage.days+' ημέρες</div>';
  h+=piRow('Γεύματα με ✅', d.pct==null?'—':d.pct+'%');
  h+=piRow('Μέρες με σημείωση', d.daysLogged+' / '+d.days);
  if(d.workouts) h+=piRow('Προπονήσεις ✅', d.workouts);
  var sl=d.slots.filter(function(s){ return s.pct!=null; });
  if(sl.length){
    h+='<div class="pi-sec">Ανά γεύμα</div>';
    sl.forEach(function(s){
      h+='<div class="pi-bar"><span class="pi-bar-l">'+esc(s.name)+'</span><span class="pi-bar-t"><i class="'+(s.pct<PI_LOW_PCT?'lo':'')+'" style="width:'+s.pct+'%"></i></span><span class="pi-bar-v">'+s.pct+'%</span></div>';
      if(s.alt) h+='<div class="pi-bar-n">εναλλακτική '+s.alt+(s.alt===1?' φορά':' φορές')+'</div>';
    });
  }
  _piFlags=d.flags;
  if(d.flags.length){
    h+='<div class="pi-sec">🔄 Αλλάζει συχνά</div>';
    d.flags.slice(0,4).forEach(function(fl,fi){
      h+='<div class="pi-card" id="pi-flag-'+fi+'"><div><b>'+esc(fl.s)+'</b> · '+fl.count+' φορές</div>'
        +'<div class="pi-muted">«'+esc(fl.o)+'» → συνήθως «'+esc(fl.top?fl.top.n:'')+'»</div>'
        +(fl.hits.length&&fl.top&&fl.top.f&&fl.top.f.length
          ?'<div class="pi-acts"><button type="button" class="pi-btn pri" onclick="piApplyFlag('+fi+')">Βάλ\' το σε όλη την εβδομάδα ('+fl.hits.length+')</button></div>'
          :'<div class="pi-muted">Δεν υπάρχει πια στο τρέχον πλάνο.</div>')
        +'</div>';
    });
  }
  if(d.rej.length){
    h+='<div class="pi-sec">👎 Δεν του αρέσουν</div>';
    d.rejFoods.slice(0,3).forEach(function(x,i){
      h+='<div class="pi-card"><div><b>'+esc(x.n)+'</b> σε '+x.count+' απορρίψεις</div><div class="pi-acts"><button type="button" class="pi-btn" onclick="piExcludeFood('+i+')">🚫 Αποκλεισμός</button></div></div>';
    });
    var reasons={}; d.rej.forEach(function(e){ var r=e.r||''; reasons[r]=(reasons[r]||0)+1; });
    var RL=(typeof PROGRESS_REJ_REASONS!=='undefined')?PROGRESS_REJ_REASONS:{};
    h+='<div class="pi-muted">'+d.rej.length+' εναλλακτικές με «Όχι για μένα»'
      +Object.keys(reasons).filter(function(k){return k;}).map(function(k){ return ' · '+esc(RL[k]||k)+' '+reasons[k]; }).join('')+'</div>';
  }
  if(d.notes.length){
    h+='<div class="pi-sec">💬 Έγραψε</div>';
    d.notes.forEach(function(n){
      var txt=String(n.note).replace(/^\[tag:[a-z]+\]\s*/,'');
      h+='<div class="pi-note"><span class="pi-muted">'+(typeof progressShortDate==='function'?progressShortDate(n.date):n.date)+'</span> «'+esc(txt)+'»</div>';
    });
  }
  return h;
}
// Καλείται στο τέλος του renderWeekTable — ζωγραφίζει/κρύβει το πάνελ.
function piRenderPanel(c){
  var el=document.getElementById('pi-panel');
  var show=!!(c && c.shareToken && piIsOpen());
  if(!show){ if(el) el.remove(); document.body.classList.remove('pi-open'); return; }
  if(!el){ el=document.createElement('aside'); el.id='pi-panel'; el.className='pi-panel'; el.setAttribute('aria-label','Ο πελάτης στο link'); document.body.appendChild(el); }
  el.innerHTML=piPanelInnerHtml(c);
  document.body.classList.add('pi-open');
}
// Το πάνελ ανήκει μόνο στο Πλάνο — κρύβεται όταν αλλάζει καρτέλα/πελάτης (form-controls swTab).
function piHidePanel(){
  var el=document.getElementById('pi-panel'); if(el) el.remove();
  document.body.classList.remove('pi-open');
}

// Αλλαγή του πλάνου με «↶ Αναίρεση» / Ctrl+Z (ίδιο μοτίβο με applyProtocolSwaps, app-part5.js).
function piCommit(c,mutate){
  var oldPlan=deepClone(c.weekPlan);
  mutate();
  var newPlan=deepClone(c.weekPlan);
  var restore=function(p){ c.weekPlan=deepClone(p); save(); _piCache.t=0; renderWeekTable(); };
  if(window.undoRedoManager) window.undoRedoManager.execute({execute:function(){ restore(newPlan); }, undo:function(){ restore(oldPlan); }, redo:function(){ restore(newPlan); }});
  else restore(newPlan);
  if(typeof updateUndoRedoUI==='function') updateUndoRedoUI();
}
function piOpenFlag(fi){
  if(!piIsOpen()) piToggle(true);
  setTimeout(function(){
    var el=document.getElementById('pi-flag-'+fi);
    if(el){ try{ el.scrollIntoView({behavior:'smooth',block:'center'}); }catch(e){} el.classList.add('pi-hl'); setTimeout(function(){ el.classList.remove('pi-hl'); },1600); }
  },80);
}
function piApplyFlag(fi){
  var c=getC(), fl=_piFlags[fi];
  if(!c || !fl || !fl.top || !fl.top.f || !fl.top.f.length) return;
  var hits=progressSwapPlanMatches(c,fl.s,fl.o);
  if(!hits.length){ showErrorToast('Το γεύμα «'+fl.o+'» δεν υπάρχει πια στο πλάνο.'); return; }
  var dayNames=hits.map(function(h){ return DAYS[h.d]; }).join(', ');
  showConfirmDialog('Το '+fl.s+' «'+fl.o+'» θα γίνει «'+fl.top.n+'» σε '+hits.length+' ημέρα/ες ('+dayNames+'), με τις ίδιες θερμίδες.', function(){
    piCommit(c,function(){ hits.forEach(function(h){
      var meal=c.weekPlan[h.d][h.mi];
      var kcal=calculateMealKcal(meal.foods);
      var foods=fl.top.f.map(function(p){ return {n:p[0], g:p[1]}; });
      meal.foods=scalePlan([{name:meal.name,foods:foods}],null,[{k:kcal}])[0].foods;
      delete meal.recipeId; delete meal.dishLabels;
    }); });
    if(typeof showSuccessToast==='function') showSuccessToast('Άλλαξε σε '+hits.length+' ημέρα/ες. Στείλε ξανά το πλάνο για να το δει ο πελάτης.');
  });
}
function piExcludeFood(i){
  var c=getC(), d=piData(c), x=d&&d.rejFoods[i];
  if(!c || !x) return;
  showConfirmDialog('Το «'+x.n+'» θα μπει στους αποκλεισμούς του πελάτη: δεν θα μπαίνει στις νέες εναλλακτικές ούτε σε νέα πλάνα. Τα γεύματα που υπάρχουν ήδη στο πλάνο δεν αλλάζουν.', function(){
    if(!c.foodExclude) c.foodExclude=[];
    if(c.foodExclude.indexOf(x.n)===-1) c.foodExclude.push(x.n);
    save(); _piCache.t=0;
    renderWeekTable();
    if(typeof showSuccessToast==='function') showSuccessToast('Το «'+x.n+'» μπήκε στους αποκλεισμούς.');
  });
}

// ── 🌱 Φρεσκάρισμα στην ανανέωση (2026-11-22, πρόταση 3) ───────────────────────────────────
// Δύο διαδοχικά πλάνα είχαν κατά μέσο όρο 85% ίδια τρόφιμα. Προτείνει έως 3 αλλαγές γευμάτων που
// επαναλαμβάνονται στην εβδομάδα, με τις ίδιες θερμίδες ανά ημέρα (scalePlan, όπως οι εναλλακτικές):
//   1. πρώτα ό,τι ο ίδιος ο πελάτης διαλέγει συχνά στο link αντί γι' αυτό (🔄 flags),
//   2. μετά μια εναλλακτική από την ίδια δεξαμενή του link (buildAlternatesPool/pickMealAlternates:
//      ήδη χωρίς αποκλεισμούς, 👎 «Όχι για μένα», λάθος τύπο διατροφής).
// Τίποτα δεν αλλάζει χωρίς «Εφαρμογή»· με undo (save()).
var FR_MAX=3;
var _frSugs=[];
function frMealKey(m){ return (m.name||'')+'|'+((typeof mealSignature==='function')?mealSignature(m.foods||[]):''); }
function frBtnHtml(c){
  if(!c || !c.weekPlan || !Object.keys(c.weekPlan).length) return '';
  return '<button type="button" class="pi-toggle" onclick="frOpen()" title="Προτάσεις για 2-3 αλλαγές γευμάτων για ποικιλία, με τις ίδιες θερμίδες">🌱 Φρεσκάρισμα</button>';
}
function frSuggestions(c){
  var wp=c.weekPlan||{}, groups={}, order=[];
  var isFree=function(m){ return (typeof FREE_MEAL_MARKER!=='undefined') && m.foods.some(function(f){ return f.n===FREE_MEAL_MARKER; }); };
  for(var d=0;d<7;d++) (wp[d]||[]).forEach(function(m,mi){
    if(!m || !m.foods || !m.foods.length || isFree(m)) return;
    var k=frMealKey(m);
    if(!groups[k]){ groups[k]={key:k, name:m.name, mi:mi, title:mealShortTitle(m.foods), foods:m.foods, hits:[]}; order.push(k); }
    groups[k].hits.push({d:d,mi:mi});
  });
  // Ήταν και στο προηγούμενο πλάνο του ιστορικού → «παλιό» (+2 στην προτεραιότητα)
  var prev={};
  var sp=(c.savedPlans||[]).slice().sort(function(a,b){ return String(a.date||'')<String(b.date||'')?-1:1; });
  var last=sp.length?sp[sp.length-1]:null;
  if(last && typeof phHash==='function' && last.hash===phHash(c.weekPlan)) last=sp.length>1?sp[sp.length-2]:null;
  if(last && last.weekPlan) Object.keys(last.weekPlan).forEach(function(d){ (last.weekPlan[d]||[]).forEach(function(m){ if(m&&m.foods) prev[frMealKey(m)]=1; }); });
  var out=[], usedSlot={};
  // 1) τι διαλέγει ο ίδιος στο link
  var data=piData(c);
  ((data&&data.flags)||[]).forEach(function(fl){
    if(out.length>=FR_MAX || !fl.top || !fl.top.f || !fl.top.f.length) return;
    var hits=progressSwapPlanMatches(c,fl.s,fl.o); if(!hits.length) return;
    if(out.some(function(o){ return o.to===fl.top.n; })) return;   // ίδια πρόταση για δύο γεύματα → μόνο μία
    out.push({name:fl.s, from:fl.o, to:fl.top.n, toFoods:fl.top.f.map(function(p){ return {n:p[0],g:p[1]}; }),
      hits:hits, tag:'picked', count:fl.count, on:true});
    usedSlot[fl.s+'#'+hits[0].mi]=1;
  });
  if(out.length>=FR_MAX) return out;
  // 2) γεύματα που επαναλαμβάνονται — τα πιο «κουρασμένα» πρώτα
  var cands=order.map(function(k){ var g=groups[k]; g.score=g.hits.length+(prev[k]?2:0); return g; })
    .filter(function(g){ return g.hits.length>=2 && !out.some(function(o){ return o.from===g.title && o.name===g.name; }); })
    .sort(function(a,b){ return b.score-a.score; });
  if(!cands.length || typeof buildAlternatesPool!=='function') return out;
  var excl=(c.foodExclude||[]).slice();
  if(typeof buildEffectiveExclusionList==='function') buildEffectiveExclusionList(c).forEach(function(x){ if(excl.indexOf(x)===-1) excl.push(x); });
  var pool; try{ pool=buildAlternatesPool(c, excl); }catch(e){ return out; }
  cands.forEach(function(g){
    if(out.length>=FR_MAX || usedSlot[g.name+'#'+g.mi]) return;
    var alt=pickMealAlternates(pool, {name:g.name, foods:g.foods}, c, calculateMealKcal(g.foods), 1)[0];
    if(!alt || !alt.foods || !alt.foods.length) return;
    if(out.some(function(o){ return o.to===mealShortTitle(alt.foods); })) return;
    out.push({name:g.name, from:g.title, to:mealShortTitle(alt.foods), toFoods:alt.foods.map(function(f){ return {n:f.n,g:f.g}; }),
      hits:g.hits, tag:alt.src==='picked'?'picked':(alt.src==='own'?'own':'new'), old:!!prev[g.key], on:out.length<2});
    usedSlot[g.name+'#'+g.mi]=1;
  });
  return out;
}
function frClose(){ var o=document.getElementById('fr-overlay'); if(o) o.remove(); }
function frOpen(){
  var c=getC(); if(!c) return;
  _frSugs=frSuggestions(c);
  frClose();
  var TAG={picked:['το διαλέγει ο ίδιος','pi-tg-teal'], own:['το έφαγε σε παλιότερο πλάνο','pi-tg-teal'], new:['καινούργιο','pi-tg-amber']};
  var body;
  if(!_frSugs.length) body='<div class="pi-empty">Δεν βρέθηκαν γεύματα που επαναλαμβάνονται για αλλαγή. Το πλάνο έχει ήδη ποικιλία.</div>';
  else body=_frSugs.map(function(s,i){
    var days=s.hits.map(function(h){ return DAYS[h.d].slice(0,3); }).join(', ');
    var t=TAG[s.tag]||TAG.new;
    return '<label class="fr-row" for="fr-cb-'+i+'"><input type="checkbox" id="fr-cb-'+i+'"'+(s.on?' checked':'')+' onchange="frCount()">'
      +'<span class="fr-txt"><b>'+esc(s.name)+'</b> <span class="pi-muted">· '+days+'</span><br>'
      +'<span class="fr-from">'+esc(s.from)+'</span> → '+esc(s.to)
      +' <span class="pi-tg '+t[1]+'">'+t[0]+(s.tag==='picked'&&s.count?' '+s.count+'×':'')+'</span></span></label>';
  }).join('');
  var o=document.createElement('div'); o.id='fr-overlay'; o.className='fr-overlay';
  o.onclick=function(e){ if(e.target===o) frClose(); };
  o.innerHTML='<div class="fr-box" role="dialog" aria-modal="true" aria-labelledby="fr-title">'
    +'<div class="pi-hd"><b id="fr-title">🌱 Φρεσκάρισμα πλάνου</b><button type="button" class="pi-x" onclick="frClose()" aria-label="Κλείσιμο">✕</button></div>'
    +'<div class="pi-muted">Αλλαγές για ποικιλία, με τις ίδιες θερμίδες σε κάθε ημέρα. Δεν προτείνει ό,τι είναι αποκλεισμένο ή έχει 👎.</div>'
    +'<div class="fr-list">'+body+'</div>'
    +'<div class="pi-acts" style="justify-content:flex-end">'
    +'<button type="button" class="pi-btn" onclick="frClose()">Άκυρο</button>'
    +(_frSugs.length?'<button type="button" class="pi-btn pri" id="fr-apply" onclick="frApply()">Εφαρμογή</button>':'')
    +'</div></div>';
  document.body.appendChild(o);
  frCount();
}
function frCount(){
  var b=document.getElementById('fr-apply'); if(!b) return;
  var n=document.querySelectorAll('#fr-overlay input[type=checkbox]:checked').length;
  b.textContent=n?('Εφαρμογή '+n+(n===1?' αλλαγής':' αλλαγών')):'Εφαρμογή';
  b.disabled=!n;
}
function frApply(){
  var c=getC(); if(!c) return;
  var chosen=_frSugs.filter(function(s,i){ var cb=document.getElementById('fr-cb-'+i); return cb && cb.checked; });
  var n=chosen.length;
  frClose();
  if(!n) return;
  piCommit(c,function(){ chosen.forEach(function(s){
    s.hits.forEach(function(h){
      var meal=c.weekPlan[h.d]&&c.weekPlan[h.d][h.mi]; if(!meal) return;
      var kcal=calculateMealKcal(meal.foods);
      meal.foods=scalePlan([{name:meal.name,foods:deepClone(s.toFoods)}],null,[{k:kcal}])[0].foods;
      delete meal.recipeId; delete meal.dishLabels;
    });
  }); });
  if(typeof showSuccessToast==='function') showSuccessToast('🌱 '+n+(n===1?' αλλαγή':' αλλαγές')+' στο πλάνο. Στείλε το στον πελάτη όταν είσαι έτοιμος.');
}

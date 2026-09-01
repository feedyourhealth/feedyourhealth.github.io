// js/client-editor/day-targets.js
// The client editor's per-day energy/macro targets + activity (MET) + macro-split
// UI, extracted verbatim from js/app-part2.js (module split wave 29): daysUntilEvent,
// getCarbLoadDayIndexes, makeDayTgtDefaults, getDayTgtEff, allocateMealTargets,
// getMealTimingGuide, buildDayTgtHtml; the MET activities UI (buildMetHtml,
// metCatChange, toggleMetDay, addMetActivity, updateConditionalVisibility,
// updateActivityFromSport, toggleSportSupplement, removeMetActivity); the macro
// distribution UI (buildMacroDistributionHtml) + CREATINE_SUGGESTED_SPORTS. Pure fn
// declarations + one literal table. Callers: recalculateMacros (app-part1.js),
// genPlan/renderWeekTable (plan-gen/*), appointments/* — all runtime. Loads in the
// client-editor/ group right after tracker.js.

// Whole days between today and a client's event date (c.eventDate, 'YYYY-MM-DD'). null if unset/invalid.
function daysUntilEvent(dateStr){
  if(!dateStr) return null;
  var target=new Date(dateStr+'T00:00:00');
  if(isNaN(target.getTime())) return null;
  var today=new Date(); today.setHours(0,0,0,0);
  return Math.round((target-today)/86400000);
}

// Carbohydrate loading (ISSN Position Stand: Nutrient Timing — ~8-12g carbs/kg/day, 1-3 days pre-event).
// Only returns day-of-week indexes (0=Mon..6=Sun, matching trainDays/weekPlan) when c.eventDate is set
// AND the event is actually imminent (0-10 days out) for THIS plan generation — inert otherwise, so a
// client with no event date, or one far from any event, behaves exactly as before.
function getCarbLoadDayIndexes(c){
  var daysLeft=daysUntilEvent(c.eventDate);
  if(daysLeft==null||daysLeft<0||daysLeft>10) return [];
  var loadDays=c.carbLoadDays!=null?c.carbLoadDays:3;
  var eventDow=new Date(c.eventDate+'T00:00:00').getDay(); // 0=Sun..6=Sat
  var eventIdx=(eventDow+6)%7; // convert to 0=Mon..6=Sun
  var idxs=[];
  for(var k=0;k<loadDays;k++) idxs.push(((eventIdx-k)%7+7)%7);
  return idxs;
}

function makeDayTgtDefaults(c,t){
  var boost=(c.carbBoost!=null?c.carbBoost:20)/100;
  var baseHrs=c.trainHoursPerDay||1;
  var carbLoadIdxs=(typeof getCarbLoadDayIndexes==='function')?getCarbLoadDayIndexes(c):[];
  var r=[];
  for(var i=0;i<7;i++){
    var isT=c.trainDays&&c.trainDays[i];
    // Per-day hours: use trainHoursByDay if set, otherwise fallback to global trainHoursPerDay
    var dayHrs=(c.trainHoursByDay&&c.trainHoursByDay[i]!=null)?c.trainHoursByDay[i]:(isT?baseHrs:0);
    var hScale=(isT&&baseHrs>0)?(dayHrs/baseHrs):0;
    // Carb boost: REDISTRIBUTE (don't add calories)
    // On training days: add extra carbs, subtract from fat to keep total kcal same
    var extraC=isT?Math.round(t.carb*boost*(t.usedMET?1:hScale)):0;
    // MET active: use precise per-day kcal from assigned activities
    // With carb boost=0%, all days should have same kcal (no redistribution across days)
    var dayKcal;
    if(t.usedMET){
      dayKcal=t.trainTargetByDay?t.trainTargetByDay[i]:t.restTarget;
    } else if(boost===0){
      // Zero carb boost: all days identical target
      dayKcal=t.target;
    } else {
      // Carb boost > 0: adjust daily targets based on training days
      dayKcal=isT?Math.round(t.target+(t.trainTarget-t.restTarget)):t.target;
    }

    // 🛡️ SAFETY FLOOR: a daily target must never fall below BMR/RMR.
    // Aggressive deficits on low-RMR clients (esp. on rest days with no exercise)
    // can push the day's target below basal metabolism — clinically unsafe and it
    // also makes an otherwise-balanced plan read as 150-170% on those days.
    // t.bmr = measured RMR when available, otherwise the formula BMR.
    if(t.bmr && dayKcal < t.bmr) dayKcal = t.bmr;

    // CRITICAL FIX v2: Recalculate macros based on ACTUAL daily kcal, not average
    // When using MET activities, each day has different kcal so macros must be recalculated
    var pPct=t.pPct/100;
    var fPct=t.fPct/100;
    var cPct=t.cPct/100;

    var dayP=Math.round(dayKcal*pPct/4);
    var dayF=Math.round(dayKcal*fPct/9);
    var dayC=Math.max(0,Math.round((dayKcal-dayP*4-dayF*9)/4)); // floor at 0 — defense-in-depth against p%+f% together exceeding 100

    // Βήμα D0: πρακτικό κατώφλι λίπους ~0.5 g/kg. Το carbBoost/carbload ρίχνει λίπος kcal-for-kcal
    // για να χωρέσουν υδατάνθρακες· χωρίς κατώφλι, σε αθλητή με sport-preset χαμηλού λίπους ο ημερήσιος
    // στόχος λίπους έπεφτε στα ~17g (μετρήθηκε) και το πλάνο έβγαινε +200%…+500% λίπος εκείνες τις
    // μέρες, ενώ τα ~17g/ημέρα είναι κάτω από το φυσιολογικό όριο (ορμονική λειτουργία, λιποδιαλυτές
    // βιταμίνες). Το «κομμένο» λίπος που ΔΕΝ επιτρέπεται να αφαιρεθεί δεν προστίθεται ως υδατάνθρακες —
    // μένει ως λίπος (kcal-neutral, το dayC παίρνει μόνο ό,τι πραγματικά ελευθερώθηκε).
    var fatFloorG=Math.round(0.5*(c.weight||70));

    // Apply carb boost redistribution on top of daily macro targets
    if(extraC>0){
      // Reduce fat by the carb increase amount (carbs are 4kcal/g, fat is 9kcal/g) — but not below fatFloorG
      var wantCutG=extraC*4/9;
      var cutG=Math.min(wantCutG, Math.max(0, dayF-fatFloorG));
      dayF=Math.round(dayF-cutG);
      dayC=dayC+Math.round(cutG*9/4);
    }

    // 🏁 Carb-loading override (only on the specific pre-event days computed above; no-op for everyone else).
    // Reduces fat kcal-for-kcal to make room, same pattern as the training-day carb boost above.
    if(carbLoadIdxs.indexOf(i)!==-1){
      var loadCarbG=Math.round((c.weight||70)*10); // ISSN: ~10g/kg/day carb-loading target
      // ⚕️ Cap at any active protocol's carb% ceiling (e.g. Διαβήτης) — the protocol always wins over
      // the event-prep target, so carb-loading never silently exceeds a clinical limit on those days.
      var protocolCarbCapPct=(typeof getProtocolCarbCapPct==='function')?getProtocolCarbCapPct(c):null;
      if(protocolCarbCapPct!=null){
        var capGrams=Math.round(dayKcal*protocolCarbCapPct/100/4);
        if(capGrams<loadCarbG) loadCarbG=capGrams;
      }
      if(loadCarbG>dayC){
        var extraLoadC=loadCarbG-dayC;
        // Βήμα D0: μη ρίχνεις το λίπος κάτω από fatFloorG ούτε για carb-loading· ο στόχος υδατανθράκων
        // παίρνει μόνο ό,τι επιτρέπει ο θερμιδικός προϋπολογισμός αφού κρατηθεί το κατώφλι λίπους.
        var wantLoadCutG=extraLoadC*4/9;
        var loadCutG=Math.min(wantLoadCutG, Math.max(0, dayF-fatFloorG));
        dayF=Math.round(dayF-loadCutG);
        dayC=dayC+Math.round(loadCutG*9/4);
      }
    }

    r.push({k:dayKcal,p:dayP,f:dayF,c:dayC});
  }
  return r;
}
function getDayTgtEff(c,t){
  // DEFENSIVE: Check for null client object
  if(!c){
    console.warn('⚠️ getDayTgtEff called with null client');
    return {};
  }
  // CRITICAL FIX: Always recalculate daily targets to ensure growthAdd is included
  // Don't rely on cached c.dayTargets as it may be stale
  var eff=makeDayTgtDefaults(c,t);
  // Store freshly calculated values for persistence
  if(c) c.dayTargets=eff;
  return eff;

}

// ✅ PHASE 3: ALLOCATE PER-MEAL CALORIE TARGETS
// Splits the daily target across the day's meals, weighted BY MEAL SLOT.
//
// Βήμα 2b-bis: παλιά η κατανομή [0.22,0.28,0.25,0.12,0.13] εφαρμοζόταν ΚΑΤΑ ΘΕΣΗ index,
// υποθέτοντας σειρά [πρωινό, μεσημεριανό, βραδινό, snack, snack]. Όμως ο caller περνά τα γεύματα
// ΜΕΤΑ το reorderMealsToStandardSequence, που δίνει σειρά [πρωινό, snack, μεσημεριανό, snack,
// βραδινό]. Αποτέλεσμα: το πρωινό ενδιάμεσο έπαιρνε το 28% (μερίδιο μεσημεριανού) + ~47g στόχο
// πρωτεΐνης από γιαούρτι/φρούτο, ενώ το βραδινό (το πιο πρωτεϊνικό γεύμα των templates) έπαιρνε
// μερίδιο snack (13% / ~22g) και σκαλωνόταν δραστικά κάτω. Τώρα το βάρος κάθε γεύματος ορίζεται
// από το slot του (classifyMealSlot), όχι από τη θέση του, και κανονικοποιείται σε άθροισμα 1
// ώστε όλος ο ημερήσιος στόχος να κατανέμεται για οποιονδήποτε αριθμό γευμάτων (3-meal IF,
// 5-meal, 6-meal double-training templates).
//
// `meals` δέχεται είτε πίνακα γευμάτων (objects με .name, ή ονόματα) είτε — για backward
// compatibility με παλιούς callers — καθαρό αριθμό γευμάτων (τότε υποτίθεται η τυπική σειρά).
function allocateMealTargets(dailyTarget, meals, mealTiming) {
  if(!dailyTarget || !dailyTarget.k) {
    console.warn('⚠️ allocateMealTargets: Invalid daily target');
    return [];
  }

  var SLOT_W = { breakfast: 0.22, lunch: 0.28, dinner: 0.25 };
  var SNACK_BASE = 0.125; // per-snack (και per-"other") βάρος — 2 snacks => 0.25, όπως το legacy

  var names;
  if (typeof meals === 'number') {
    // legacy: μόνο πλήθος — υπόθεσε τυπική σειρά [πρωινό, snack, μεσημεριανό, snack, βραδινό, ...]
    names = ['Πρωινό','Ενδιάμεσο','Μεσημεριανό','Ενδιάμεσο','Βραδινό','Ενδιάμεσο','Ενδιάμεσο'].slice(0, meals);
  } else {
    names = (meals || []).map(function(m){ return (typeof m === 'string') ? m : (m && m.name); });
  }
  var nMeals = names.length;
  if (nMeals === 0) return [];

  var weights = names.map(function(nm){
    var slot = (typeof classifyMealSlot === 'function') ? classifyMealSlot(nm) : 'snack';
    return (SLOT_W[slot] != null) ? SLOT_W[slot] : SNACK_BASE;
  });
  var wSum = weights.reduce(function(a,b){ return a + b; }, 0) || 1;

  var targets = [];
  for (var i = 0; i < nMeals; i++) {
    var pct = weights[i] / wSum;
    targets.push({
      k: Math.round(dailyTarget.k * pct),
      p: Math.round(dailyTarget.p * pct),
      f: Math.round(dailyTarget.f * pct),
      c: Math.round(dailyTarget.c * pct)
    });
  }

  // 🥤 CHO Training Protocol (Phase 2) — when a structured arg is passed, shift carbs toward the
  // pre/post-workout meals, kcal-neutral (fat ↔ carbs at 4:9), pulling the same grams back out of
  // the regular meals. Day CHO / day fat / every meal's kcal + protein stay put. Arg absent or
  // malformed → `targets` returned unchanged (backward compatible with every legacy caller).
  if (mealTiming && mealTiming.kcalNeutral && Array.isArray(mealTiming.perMeal)
      && mealTiming.perMeal.length === nMeals && typeof redistributeCHOForTraining === 'function') {
    targets = redistributeCHOForTraining(targets, mealTiming, dailyTarget);
  }
  return targets;
}

// Bounded, kcal-neutral carb shuffle used only by allocateMealTargets above. `mta` carries
// { perMeal:[{role}], preChoG, postChoG, weightKg }. Never touches protein; keeps each meal's
// kcal fixed by swapping fat for carbs at 4:9; conserves the day's total CHO and fat exactly.
function redistributeCHOForTraining(targets, mta, dayTgt) {
  var n = targets.length;
  var roles = mta.perMeal.map(function(pm){ return pm && pm.role; });
  var preIdx = [], postIdx = [], regIdx = [];
  for (var i = 0; i < n; i++) {
    if (roles[i] === 'pre') preIdx.push(i);
    else if (roles[i] === 'post') postIdx.push(i);
    else regIdx.push(i);
  }
  if ((preIdx.length === 0 && postIdx.length === 0) || regIdx.length === 0) return targets;

  var wKg = mta.weightKg || 70;
  var dayK = dayTgt.k || targets.reduce(function(s,t){ return s + (t.k||0); }, 0) || 1;
  // Regular meals keep a conservative fat floor (slice of 0.5 g/kg/day) + 75%-kcal carb ceiling.
  // The pre/post-workout meal legitimately runs low-fat / high-carb for fast digestion
  // (MEAL_TIMING_PROFILES 'pre-workout' = 75% CHO / 10% fat), so it gets a looser floor + ceiling.
  function fatFloor(t, targeted){
    return targeted ? 3 : Math.max(3, Math.round(0.5 * wKg * ((t.k||0) / dayK)));
  }
  function carbCeil(t, targeted){ return Math.max(0, Math.round((targeted ? 0.85 : 0.75) * (t.k||0) / 4)); }
  function fatCeil(t){ return Math.max(0, Math.round(0.55 * (t.k||0) / 9)); }

  // 1) how much extra CHO each targeted meal can actually take (bounded by fat floor + carb ceiling)
  function groupGains(idxs, groupTargetG){
    if (!idxs.length || !(groupTargetG > 0)) return {};
    var per = groupTargetG / idxs.length;
    var gains = {};
    idxs.forEach(function(i){
      var t = targets[i];
      var want = Math.max(0, per - (t.c || 0));              // only ever boost
      var byFat = ((t.f || 0) - fatFloor(t, true)) * 9 / 4;  // CHO the fat budget allows
      var byCeil = carbCeil(t, true) - (t.c || 0);
      gains[i] = Math.max(0, Math.round(Math.min(want, byFat, byCeil)));
    });
    return gains;
  }
  var gains = {};
  var g1 = groupGains(preIdx, mta.preChoG);
  var g2 = groupGains(postIdx, mta.postChoG);
  Object.keys(g1).forEach(function(k){ gains[k] = g1[k]; });
  Object.keys(g2).forEach(function(k){ gains[k] = g2[k]; });
  var addedC = Object.keys(gains).reduce(function(s,k){ return s + gains[k]; }, 0);
  if (addedC <= 0) return targets;

  // 2) pull `addedC` back out of the regular meals, proportional to their current carbs,
  //    bounded so regular carbs stay ≥ a small floor and regular fat ≤ its ceiling
  var regCarbSum = regIdx.reduce(function(s,i){ return s + (targets[i].c || 0); }, 0) || 1;
  var drops = {};
  var droppedTotal = 0;
  regIdx.forEach(function(i){
    var t = targets[i];
    var share = Math.round(addedC * ((t.c || 0) / regCarbSum));
    var carbFloor = Math.max(5, Math.round(0.10 * (t.k || 0) / 4));
    var byCarb = (t.c || 0) - carbFloor;
    var byFat = fatCeil(t) - (t.f || 0);                   // room to absorb fat back
    var d = Math.max(0, Math.min(share, byCarb, byFat));
    drops[i] = d;
    droppedTotal += d;
  });

  // 3) reconcile: whatever couldn't be pulled from regular meals, don't add to targeted meals
  var residual = addedC - droppedTotal;
  if (residual > 0) {
    // trim the gains (post first, then pre) so added == dropped exactly
    var order = postIdx.concat(preIdx).filter(function(i){ return gains[i] > 0; });
    for (var oi = 0; oi < order.length && residual > 0; oi++) {
      var take = Math.min(gains[order[oi]], residual);
      gains[order[oi]] -= take;
      residual -= take;
    }
    addedC = Object.keys(gains).reduce(function(s,k){ return s + gains[k]; }, 0);
  }
  if (addedC <= 0) return targets;

  // 4) apply — carbs up / fat down on targeted meals; carbs down / fat up on regular meals.
  //    Fat delta is left fractional (= carb delta × 4/9) so each meal's kcal is held EXACTLY
  //    and, because step 3 forced added == dropped, the day's CHO and fat totals are unchanged.
  //    scalePlan() rounds grams itself downstream.
  Object.keys(gains).forEach(function(k){
    var i = +k, gc = gains[k];
    if (gc <= 0) return;
    targets[i].c += gc;
    targets[i].f = Math.max(0, targets[i].f - gc * 4 / 9);
  });
  regIdx.forEach(function(i){
    var dc = drops[i];
    if (!dc) return;
    targets[i].c -= dc;
    targets[i].f += dc * 4 / 9;
  });
  return targets;
}

function getMealTimingGuide(c){
  var abbr=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var td=c.trainDays||[false,false,false,false,false,false,false];
  var times=c.trainTimesByDay||['','','','','','',''];
  var hasAnyTime=times.some(function(t,i){return t&&td[i];});
  if(!hasAnyTime)return'';

  function timingFor(trainTime){
    var parts=trainTime.split(':');
    var h=parseInt(parts[0],10);
    var m=parseInt(parts[1],10)||0;
    if(isNaN(h)||h<0||h>23)return null;

    // Pre-workout: 2 hours before
    var preH=(h-2)<0?(h-2+24):(h-2);
    var preTime=String(preH).padStart(2,'0')+':'+'00';

    // Post-workout: 30 min after
    var postMin=m+30;
    var postH=h;
    if(postMin>=60){postH=(h+1)%24;postMin=postMin-60;}
    var postTime=String(postH).padStart(2,'0')+':'+String(postMin).padStart(2,'0');

    return {trainTime:trainTime,preTime:preTime,postTime:postTime};
  }

  var rows=[];
  for(var i=0;i<7;i++){
    if(!td[i]||!times[i])continue;
    var tm=timingFor(times[i]);
    if(!tm)continue;
    rows.push({day:abbr[i],trainTime:tm.trainTime,preTime:tm.preTime,postTime:tm.postTime});
  }
  if(!rows.length)return'';

  var guide='<div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:8px;padding:10px 12px;margin-bottom:10px">'
    +'<div style="font-size:11px;font-weight:700;color:#2e7d32;margin-bottom:6px">⏰ Προτεινόμενα γεύματα ανά ημέρα</div>';

  // ✅ When every training day shares the exact same schedule, show one summary
  // row instead of repeating identical text once per day.
  var allSame=rows.every(function(r){return r.trainTime===rows[0].trainTime&&r.preTime===rows[0].preTime&&r.postTime===rows[0].postTime;});

  if(allSame){
    var dayList=rows.map(function(r){return r.day;}).join(', ');
    guide+='<div style="font-size:10px;color:var(--text-strong);padding:4px 6px;background:#f1f8f6;border-radius:4px">'
      +'<b>'+dayList+'</b> <span style="color:#2e7d32;font-weight:600">(ίδιο κάθε μέρα)</span> — προπόνηση στις '+rows[0].trainTime
      +' | <span style="color:#1565C0">⚡Pre (2h πριν): '+rows[0].preTime+'</span>'
      +' | <span style="color:#e65100">💪Post (30min μετά): '+rows[0].postTime+'</span>'
      +'</div>';
  } else {
    rows.forEach(function(r){
      guide+='<div style="font-size:10px;color:var(--text-strong);margin-bottom:5px;padding:4px 6px;background:#f1f8f6;border-radius:4px">'
        +'<b>'+r.day+'</b> — προπόνηση στις '+r.trainTime
        +' | <span style="color:#1565C0">⚡Pre (2h πριν): '+r.preTime+'</span>'
        +' | <span style="color:#e65100">💪Post (30min μετά): '+r.postTime+'</span>'
        +'</div>';
    });
  }

  guide+='</div>';
  return guide;
}

// 🥤 CHO Training Protocol — pill style for the per-day intensity toggle (Phase 1, display-only).
// v: null (=auto) | 'low' | 'mod' | 'high' | 'race'. Mirrors the .int-tog states in
// design/cho-protocol/mockup-dietitian-panel-in-grid.html.
function choIntPillStyle(v){
  var base='padding:2px 6px;border-radius:999px;cursor:pointer;font-size:9px;font-weight:700;min-width:38px;font-family:inherit;';
  if(v==='race') return base+'background:#e65100;color:#fff;border:1px solid #e65100';
  if(v==='high') return base+'background:#00897b;color:#fff;border:1px solid #00897b';
  if(v==='mod')  return base+'background:#e0f2ee;color:#00786f;border:1px solid #cfe6e1';
  if(v==='low')  return base+'background:#fff;color:#00786f;border:1px solid #cfe6e1';
  return base+'background:#fff;color:#8aa;border:1px dashed #cfe6e1'; // auto (null)
}

function buildDayTgtHtml(c,t){
  var abbr=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var eff=getDayTgtEff(c,t);
  var td=c.trainDays||[false,false,false,false,false,false,false];

  // ── 🥤 CHO Training Protocol (Phase 1: display-only inside this grid) ──────────
  // Renders ONLY when a real sport is selected. computeCHOTargets / normalizeIntensityByDay
  // live in js/plan-gen/cho-protocol.js — guarded so load order here is not load-bearing.
  var choSportOn=!!(c.sport&&c.sport!=='custom');
  var cp=c.choProtocol||null;
  var choEnabled=choSportOn&&!!(cp&&cp.enabled);
  var choManual=choEnabled&&cp.mode==='manual';
  var intByDay=(typeof normalizeIntensityByDay==='function')
    ?normalizeIntensityByDay(c.trainIntensityByDay)
    :[null,null,null,null,null,null,null];
  var choResults=[];
  if(choEnabled&&typeof computeCHOTargets==='function'){
    for(var _cdi=0;_cdi<7;_cdi++){
      try{choResults[_cdi]=computeCHOTargets(c,t,_cdi);}catch(_e){choResults[_cdi]=null;}
    }
  }
  // improvement #1 — weekly periodisation readout (key session + phase)
  var choKeyIdx=(choEnabled&&typeof choKeySessionIndex==='function')
    ?(function(){try{return choKeySessionIndex(c,t);}catch(_e){return -1;}})():-1;
  var choPhase=(cp&&['base','build','peak','taper','race'].indexOf(cp.weekPhase)!==-1)?cp.weekPhase:'build';
  var CHO_PHASE_LBL={base:'Βάση',build:'Χτίσιμο',peak:'Αιχμή',taper:'Αποφόρτιση',race:'Εβδ. αγώνα'};
  var macros=[
    {key:'k',label:'Kcal',cls:'mrow-k',icls:'dt-inp-k',mn:500,mx:6000},
    {key:'p',label:'Πρωτεΐνη g',cls:'mrow-p',icls:'dt-inp-p',mn:0,mx:500},
    {key:'f',label:'Λιπαρά g',cls:'mrow-f',icls:'dt-inp-f',mn:0,mx:300},
    {key:'c',label:'Υδατάνθρακες g',cls:'mrow-c',icls:'dt-inp-c',mn:0,mx:800}
  ];
  var thead='<tr><th></th>';
  abbr.forEach(function(a){thead+='<th>'+a+'</th>';});
  thead+='</tr>';
  // Training day toggle row
  var trainRow='<tr class="train-row"><td>Τύπος</td>';
  for(var ti=0;ti<7;ti++){
    var isT=td[ti];
    trainRow+='<td><button class="train-tog '+(isT?'train-t':'train-r')+'" onclick="setTrainDay('+ti+','+(isT?'false':'true')+')">'+(isT?'T':'R')+'</button></td>';
  }
  trainRow+='</tr>';
  // Ημέρα αγώνα — ανεξάρτητο μόνιμο σημαδάκι ανά ημέρα εβδομάδας, χωρίς καμία επίδραση στους
  // θερμιδικούς/macro στόχους (αυτοί καθορίζονται ήδη από το T/R παραπάνω). Χρησιμοποιείται μόνο
  // από το plan.html για το badge/ετικέτες πριν-μετά/αυξημένο νερό — βλ. SNAP.days[i].isMatch.
  var matchDaysArr=c.matchDays||[false,false,false,false,false,false,false];
  var matchRow='<tr class="train-row"><td>⚽ Αγώνας</td>';
  for(var mdi=0;mdi<7;mdi++){
    var isM=matchDaysArr[mdi];
    matchRow+='<td><button class="match-tog '+(isM?'match-on':'match-off')+'" onclick="setMatchDay('+mdi+','+(isM?'false':'true')+')" title="Ημέρα αγώνα">'+(isM?'Μ':'—')+'</button></td>';
  }
  matchRow+='</tr>';
  // Per-day row: activity names (MET mode) or manual hours (non-MET)
  var dayRowHtml='';
  var useMET=c.metActivities&&c.metActivities.length>0;
  if(useMET){
    // Activity row: show which activities happen each day
    var actRow='<tr class="act-row"><td>🏃 Άσκηση</td>';
    var dAbbrA=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
    for(var ai=0;ai<7;ai++){
      var dayActs=[];
      c.metActivities.forEach(function(ma){
        var dList=ma.days;
        if(!dList){var n=ma.daysPerWeek||3;dList=[];for(var x=0;x<7&&dList.length<n;x++){if(td[x])dList.push(x);}if(!dList.length){for(var x=0;x<n&&x<7;x++)dList.push(x);}}
        if(dList.indexOf(ai)>-1)dayActs.push(ma.name+' <b>'+ma.mins+'λ.</b>');
      });
      actRow+='<td class="act-cell">'+(dayActs.length?dayActs.join('<br>'):'—')+'</td>';
    }
    actRow+='</tr>';
    // Time of training row (for MET mode too)
    var timeRow='<tr class="time-row"><td>🕐 Ώρα</td>';
    if(!c.trainTimesByDay)c.trainTimesByDay=['','','','','','',''];
    for(var ti=0;ti<7;ti++){
      var tiT=td[ti];
      var tVal=(c.trainTimesByDay&&c.trainTimesByDay[ti])?c.trainTimesByDay[ti]:'';
      timeRow+='<td><input class="dt-inp time-inp '+(tiT?'time-t':'time-r')+'" type="time"'
        +' value="'+tVal+'" id="time-'+ti+'" '+(tiT?'':'disabled')+' onchange="setTrainTime('+ti+',this.value)"></td>';
    }
    timeRow+='</tr>';
    dayRowHtml=actRow+timeRow;
  } else {
    // Manual hours row
    var hrsRow='<tr class="hrs-row"><td>⏱ ώρες</td>';
    for(var hi=0;hi<7;hi++){
      var hiT=td[hi];
      var hVal=(c.trainHoursByDay&&c.trainHoursByDay[hi]!=null)?c.trainHoursByDay[hi]:(hiT?(c.trainHoursPerDay||1):0);
      hrsRow+='<td><input class="dt-inp hrs-inp '+(hiT?'hrs-t':'hrs-r')+'" type="number" min="0" max="8" step="0.5"'
        +' value="'+hVal+'" id="hrs-'+hi+'" onchange="setTrainHours('+hi+',this.value)"></td>';
    }
    hrsRow+='</tr>';
    // Time of training row (when during the day)
    var timeRow='<tr class="time-row"><td>🕐 Ώρα</td>';
    if(!c.trainTimesByDay)c.trainTimesByDay=['','','','','','',''];
    for(var ti=0;ti<7;ti++){
      var tiT=td[ti];
      var tVal=(c.trainTimesByDay&&c.trainTimesByDay[ti])?c.trainTimesByDay[ti]:'';
      timeRow+='<td><input class="dt-inp time-inp '+(tiT?'time-t':'time-r')+'" type="time"'
        +' value="'+tVal+'" id="time-'+ti+'" '+(tiT?'':'disabled')+' onchange="setTrainTime('+ti+',this.value)"></td>';
    }
    timeRow+='</tr>';
    dayRowHtml=hrsRow+timeRow;
  }
  // 🥤 Session-intensity row — writes c.trainIntensityByDay[d] (null=auto from MET load).
  // Independent of whether the CHO module is enabled; shown whenever a sport is set.
  var choIntRow='';
  if(choSportOn){
    choIntRow='<tr class="train-row" style="background:#f2fbf8"><td style="color:#00786f">&#129346; Ένταση</td>';
    for(var _xi=0;_xi<7;_xi++){
      if(!td[_xi]){
        choIntRow+='<td><button type="button" disabled style="padding:2px 6px;border-radius:999px;border:1px solid #eee;background:#f0f0f0;color:#bbb;font-size:9px;font-weight:700;min-width:38px;cursor:not-allowed;font-family:inherit">—</button></td>';
      }else{
        var _iv=intByDay[_xi];
        choIntRow+='<td><button type="button" onclick="cycleTrainIntensity('+_xi+')" title="Ένταση συνεδρίας — κύκλος auto→low→mod→high→race" style="'+choIntPillStyle(_iv)+'">'+(_iv||'auto')+'</button></td>';
      }
    }
    choIntRow+='</tr>';
  }
  // 🏃 Τύπος συνεδρίας (improvement #3) — auto/steady/intervals per training day; «intervals»
  // + σύντομη + υψηλού φορτίου μειώνει ΜΟΝΟ το ημερήσιο CHO. Only when the CHO module is on.
  var choKindRow='';
  if(choEnabled){
    var choKindManual=(cp&&Array.isArray(cp.sessionKindByDay))?cp.sessionKindByDay:[null,null,null,null,null,null,null];
    choKindRow='<tr class="train-row" style="background:#f2fbf8"><td style="color:#00786f">&#127939; Τύπος</td>';
    for(var _si=0;_si<7;_si++){
      var _sr=choResults[_si];
      if(!_sr||(!_sr.isTrainingDay&&!_sr.isMatchDay)){
        choKindRow+='<td style="text-align:center;color:#c8c8c8;font-size:10px;font-weight:700">&mdash;</td>';continue;
      }
      var _seff=_sr.sessionKind||'steady';
      var _sman=choKindManual[_si]==='steady'||choKindManual[_si]==='intervals';
      var _sdamp=_sr.dailyCHO&&_sr.dailyCHO.intervalDampen<1;
      var _slbl=(_seff==='intervals'?'Διαλ.':'Συνεχής');
      choKindRow+='<td style="text-align:center"><button type="button" onclick="cycleSessionKind('+_si+')"'
        +' title="Τύπος συνεδρίας — auto (από τη δραστηριότητα MET) → Συνεχής → Διαλειμματική. Η διαλειμματική μειώνει μόνο το ημερήσιο CHO."'
        +' style="padding:2px 7px;border-radius:999px;font-size:9px;font-weight:700;cursor:pointer;font-family:inherit;min-width:52px;'
        +'border:1px solid '+(_seff==='intervals'?'#e0836f':'#bcd')+';'
        +'background:'+(_sdamp?'#fdecea':'#fff')+';color:'+(_seff==='intervals'?'#9a3b22':'#478')+';'
        +(_sman?'':'font-style:italic;opacity:.7')+'">'+(_sdamp?'⚡':'')+_slbl+'</button></td>';
    }
    choKindRow+='</tr>';
  }
  var tbody=trainRow+matchRow+dayRowHtml+choIntRow+choKindRow;
  macros.forEach(function(m){
    tbody+='<tr class="'+m.cls+'"><td>'+m.label+'</td>';
    for(var i=0;i<7;i++){
      var val=eff[i][m.key]||'';
      tbody+='<td><input class="dt-inp '+m.icls+'" type="number" min="'+m.mn+'" max="'+m.mx+'" value="'+val+'"'
        +' id="dt-'+m.key+'-'+i+'" onchange="setDayMacro(\''+m.key+'\','+i+',this.value)"></td>';
    }
    tbody+='</tr>';
  });
  // 🥤 Read-only CHO πριν/κατά/μετά rows — output of computeCHOTargets(c,t,d), inside the
  // day's "Υδατάνθρακες g" number (kcal-neutral, no calories added). Only when enabled.
  if(choEnabled){
    var choRowDefs=[
      {ic:'⚡',lb:'CHO πριν',pick:function(r){return r&&r.pre?{main:r.pre.grams+' g',sub:r.pre.timeLabel||''}:null;}},
      {ic:'🔥',lb:'CHO κατά',pick:function(r){
        if(!r||!r.during)return null;
        if(!r.during.applicable)return{main:'—',sub:'<'+r.during.minDurationMin+'′'};
        return{main:r.during.gramsPerHour+' g/h',sub:'~'+r.during.totalGrams+' g'};
      }},
      {ic:'💪',lb:'CHO μετά',pick:function(r){return r&&r.post?{main:r.post.grams+' g',sub:r.post.timeLabel||''}:null;}},
      {ic:'🍚',lb:'CHO ημέρας',pick:function(r){
        if(!r||!r.dailyCHO)return null;
        return{main:r.dailyCHO.gramsTarget+' g',sub:(r.dailyCHO.isKeySession?'🔑 ':'')+r.dailyCHO.gPerKg+' g/kg'};
      }}
    ];
    choRowDefs.forEach(function(rd){
      tbody+='<tr class="train-row" style="background:#f2fbf8"><td style="color:#00786f">'+rd.ic+' '+rd.lb+'</td>';
      for(var _ci=0;_ci<7;_ci++){
        var _r=choResults[_ci];
        var _cell=_r?rd.pick(_r):null;
        if(!_cell||!_r||(!_r.isTrainingDay&&!_r.isMatchDay)){
          tbody+='<td style="text-align:center;color:#c8c8c8;font-size:10px;font-weight:700">—</td>';
        }else{
          tbody+='<td style="text-align:center"><span style="font-size:10px;font-weight:700;color:#00786f;display:block">'+_cell.main
            +(_cell.sub?'<small style="display:block;font-weight:600;color:#8aa;font-size:8px">'+_cell.sub+'</small>':'')+'</span></td>';
        }
      }
      tbody+='</tr>';
    });
  }
  var carbBoostVal=c.carbBoost!=null?c.carbBoost:20;
  var timingGuide=getMealTimingGuide(c);
  // 🏁 Carb-loading status (ISSN Position Stand: Nutrient Timing) — only shows when an event date is set
  // AND imminent (see getCarbLoadDayIndexes); silent otherwise.
  var carbLoadIdxs=(typeof getCarbLoadDayIndexes==='function')?getCarbLoadDayIndexes(c):[];
  var carbLoadNote='';
  if(carbLoadIdxs.length){
    var dAbbrCL=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
    var namesCL=carbLoadIdxs.slice().sort(function(a,b){return a-b;}).map(function(ix){return dAbbrCL[ix];});
    var loadCarbGPreview=Math.round((c.weight||70)*10);
    carbLoadNote='<div style="background:#fff3e0;border:1px solid #ffb74d;border-radius:6px;padding:8px 12px;margin-top:8px;font-size:11px;color:#e65100"><b>🏁 Ενεργή καρβοφόρτωση:</b> '+namesCL.join(', ')+' — στόχος ~'+loadCarbGPreview+'g υδατάνθρακες/ημέρα (ISSN: 8-12g/kg)</div>';
  }
  // 🥤 CHO Training Protocol — control strip (same look as .carb-boost-row, dashed green tint).
  var choCtrlHtml='';
  if(choSportOn){
    var choOv=(cp&&cp.overrides)||{};
    choCtrlHtml='<div class="carb-boost-row" style="border:1px dashed #7fcbbf;background:#f2fbf8;border-radius:6px;padding:6px 10px;margin-top:6px">'
      +'<label style="font-weight:600"><input type="checkbox" '+(choEnabled?'checked':'')+' onchange="setChoEnabled(this.checked)" style="vertical-align:-2px"> &#129346; Πρωτόκολλο CHO προπόνησης</label>'
      +(choEnabled?(
        '&nbsp;·&nbsp;'
        +'<label><input type="radio" name="choMode" '+(!choManual?'checked':'')+' onchange="setChoMode(\'auto\')"> auto</label> '
        +'<label><input type="radio" name="choMode" '+(choManual?'checked':'')+' onchange="setChoMode(\'manual\')"> χειροκίνητο</label>'
        +'&nbsp;·&nbsp;'
        +'<label>pre <input class="carb-boost-inp" type="number" step="0.1" min="0" max="6" value="'+(choOv.gPerKgPre!=null?choOv.gPerKgPre:'')+'" '+(choManual?'':'disabled')+' onchange="setChoOverride(\'gPerKgPre\',this.value)"> g/kg</label> '
        +'<label>κατά <input class="carb-boost-inp" type="number" min="0" max="120" value="'+(choOv.gPerHrDuring!=null?choOv.gPerHrDuring:'')+'" '+(choManual?'':'disabled')+' onchange="setChoOverride(\'gPerHrDuring\',this.value)"> g/h</label> '
        +'<label>μετά <input class="carb-boost-inp" type="number" step="0.1" min="0" max="3" value="'+(choOv.gPerKgPost!=null?choOv.gPerKgPost:'')+'" '+(choManual?'':'disabled')+' onchange="setChoOverride(\'gPerKgPost\',this.value)"> g/kg</label>'
        +'<div style="margin-top:6px;font-size:11px;color:#00786f">'
        +'<span style="font-weight:700">🗓️ Φάση εβδομάδας:</span> '
        +['base','build','peak','taper','race'].map(function(pk){
          var on=choPhase===pk;
          return '<button type="button" onclick="setChoWeekPhase(\''+pk+'\')" style="padding:3px 9px;border-radius:12px;border:1px solid '+(on?'#00786f':'#bcd')+';background:'+(on?'#00786f':'#fff')+';color:'+(on?'#fff':'#478')+';font-size:10px;font-weight:600;cursor:pointer;margin:2px 3px 0 0;font-family:inherit">'+CHO_PHASE_LBL[pk]+'</button>';
        }).join('')
        +(choKeyIdx>=0?'<span style="margin-left:6px;color:#8a5200">🔑 Κύρια: <b>'+abbr[choKeyIdx]+'</b></span>':'')
        +'<div style="color:#8aa;font-size:9px;margin-top:3px">Μόνο η κύρια συνεδρία φτάνει στην οροφή g/kg· οι υπόλοιπες μέρες πλησιάζουν το κατώφλι. Σύσταση — δεν αλλάζει θερμίδες/macros.</div>'
        +'</div>'
      ):'<span style="color:#8aa">— ενεργοποίησέ το για CHO πριν/κατά/μετά ανά ημέρα προπόνησης (Thomas 2016 · Ricci 2025)</span>')
      +'</div>';
  }
  // 🥤 Flag strip — dedup by code, block/alert/warn only (info flags stay quiet here).
  var choFlagHtml='';
  if(choEnabled){
    var _seenF={},_flatF=[];
    choResults.forEach(function(r){if(r&&r.flags)r.flags.forEach(function(fl){if(!_seenF[fl.code]){_seenF[fl.code]=1;_flatF.push(fl);}});});
    var _showF=_flatF.filter(function(fl){return fl.severity!=='info';});
    if(_showF.length){
      choFlagHtml=_showF.map(function(fl){
        var col=fl.severity==='block'?{bg:'#fdecea',bd:'#f0a048',fg:'#8a1c1c',ic:'⛔'}
              :fl.severity==='alert'?{bg:'#fdecea',bd:'#e57373',fg:'#c62828',ic:'🔴'}
              :{bg:'#fff4e5',bd:'#f0a048',fg:'#8a5200',ic:'⚠️'};
        return '<div style="display:flex;gap:8px;align-items:flex-start;background:'+col.bg+';border:1px solid '+col.bd+';border-radius:6px;padding:7px 10px;margin-top:8px;font-size:10px;color:'+col.fg+';line-height:1.4">'
          +'<span>'+col.ic+'</span><span><b>'+esc(fl.title)+'</b> — '+esc(fl.detail)+'</span></div>';
      }).join('');
    }
    var _infoF=_flatF.filter(function(fl){return fl.severity==='info';});
    if(_infoF.length){
      choFlagHtml+='<div style="font-size:10px;color:#6b6b6b;margin-top:6px;line-height:1.5">'
        +_infoF.map(function(fl){return 'ℹ️ <b>'+esc(fl.title)+'</b> — '+esc(fl.detail);}).join('<br>')+'</div>';
    }
  }
  return '<div class="day-tgt-wrap">'
    +'<div class="day-tgt-head"><span class="day-tgt-title">Θερμίδες &amp; μακροθρεπτικά ανά ημέρα</span>'
    +'<button class="day-tgt-reset" onclick="resetDayTargets()">&#8635; Επαναφορά TDEE</button></div>'
    +timingGuide
    +'<div class="carb-boost-row">'
    +'<label>&#127947; Carb boost ημέρας προπόνησης:</label>'
    +'<input class="carb-boost-inp" type="number" min="0" max="60" value="'+carbBoostVal+'" onchange="setCarbBoost(this.value)">%'
    +'</div>'
    +'<div class="carb-boost-row">'
    +'<label>&#127937; Ημερομηνία αγώνα (καρβοφόρτωση):</label>'
    +'<input class="carb-boost-inp" type="date" value="'+(c.eventDate||'')+'" onchange="setEventDate(this.value)" style="width:auto">'
    +'</div>'
    +choCtrlHtml
    +carbLoadNote
    +'<div style="font-size:10px;color:var(--text-muted);margin:4px 0 6px;font-style:italic">T=προπόνηση &nbsp;·&nbsp; R=ανάπαυση &nbsp;·&nbsp; Μ=ημέρα αγώνα (δεν αλλάζει θερμίδες/macros, μόνο το πλάνο του πελάτη) &nbsp;·&nbsp; ⏱ ώρες: οι θερμίδες κλιμακώνονται ανάλογα με τη διάρκεια &nbsp;·&nbsp; 🕐 Ώρα: ώρα έναρξης προπόνησης (pre: -2h, post: +30min) &nbsp;·&nbsp; Carb boost: +'+carbBoostVal+'%</div>'
    +(matchDaysArr.some(function(x){return x;})?(
      '<div class="carb-boost-row">'
      +'<label>&#9917; Ώρα αγώνα (χοντρικά, ίδια για κάθε εβδομάδα):</label>'
      +'<div style="display:flex;gap:6px">'
      +['πρωί','μεσημέρι','απόγευμα','βράδυ'].map(function(bk){
        var on=(c.matchTimeBucket||'απόγευμα')===bk;
        return '<button type="button" onclick="setMatchTimeBucket(\''+bk+'\')" style="padding:5px 10px;border-radius:14px;border:1px solid '+(on?'#025857':'#ccc')+';background:'+(on?'#025857':'#fff')+';color:'+(on?'#fff':'#333')+';font-size:11px;cursor:pointer">'+bk+'</button>';
      }).join('')
      +'</div></div>'
    ):'')
    +'<div style="background:#f0f7ff;border:1px solid #80d4ff;border-radius:6px;padding:8px 12px;margin-top:8px;font-size:11px;color:#0056b3">'
    +'<div style="font-weight:700;margin-bottom:4px">⚡ Προσαρμογή Macros ανάλογα Προπόνησης</div>'
    +'<div style="line-height:1.5">'
    +'<div>📈 <b>Ημέρες Προπόνησης (T):</b> +10% Πρωτεΐνη, +20% Υδατάνθρακες, -15% Λιπαρά (ανάρρωση μυών + γλυκογόνο)</div>'
    +'<div>😴 <b>Ημέρες Ανάπαυσης (R):</b> Σταθερή Πρωτεΐνη, -15% Υδατάνθρακες, +15% Λιπαρά (ορμονική ισορροπία)</div>'
    +'</div>'
    +'</div>'
    +choFlagHtml
    +'<table class="day-tgt-table"><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table></div>';
}

/* ── MET Activities UI ───────────────────────────────────────────────────── */
function buildMetHtml(c,t){
  if(!c.metActivities)c.metActivities=[];
  var acts=c.metActivities;

  // Category select (no default - user must choose)
  var catSel='<select class="met-cat-sel" id="met-cat" onchange="metCatChange()">';
  catSel+='<option value="">Επίλεξε κατηγορία</option>';
  MET_ACTIVITIES.forEach(function(g,i){
    catSel+='<option value="'+i+'">'+g.cat+'</option>';
  });
  catSel+='</select>';

  // Activity select (no default selection - user must choose)
  var actSel='<select class="met-act-sel" id="met-act">';
  actSel+='<option value="">Επίλεξε αθλήματα</option>';
  MET_ACTIVITIES[0].items.forEach(function(a){
    actSel+='<option value="'+a.id+'">'+a.name+' — '+a.met+' METs</option>';
  });
  actSel+='</select>';

  // List of added activities
  var dAbbrM=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var listHtml='';
  acts.forEach(function(ma,i){
    var kcalSess=Math.round(ma.met*3.5*(c.weight||80)/200*ma.mins);
    // Resolve day list
    var dList=ma.days;
    if(!dList){var n=ma.daysPerWeek||3;dList=[];var td2=c.trainDays||[];for(var x=0;x<7&&dList.length<n;x++){if(td2[x])dList.push(x);}if(!dList.length){for(var x=0;x<n&&x<7;x++)dList.push(x);}}
    var kcalWk=kcalSess*dList.length;
    var dayChips=dList.map(function(d){return '<span class="met-item-day">'+dAbbrM[d]+'</span>';}).join('');
    listHtml+='<div class="met-item">'
      +'<span class="met-item-name">'+ma.name+'</span>'
      +'<span class="met-item-met">'+ma.met+' METs</span>'
      +'<span class="met-item-days">'+dayChips+'</span>'
      +(ma.time?'<span class="met-item-time" style="color:#ff6b35;font-weight:600">🕐 '+ma.time+'</span>':'')  // ← Show training time (HH:MM format)
      +'<span class="met-item-detail">'+ma.mins+' λεπτ./φορά</span>'
      +'<span class="met-item-kcal">= '+kcalWk+' kcal/εβδ.</span>'
      +'<button class="met-del" onclick="removeMetActivity('+i+')" title="Αφαίρεση">&#10005;</button>'
      +'</div>';
  });

  var useMET=acts.length>0;
  var totalStr='';
  if(useMET){
    totalStr='<div class="met-total">'
      +'<span>📊 Σύνολο άσκησης: <b>'+t.exerciseWeekly+' kcal/εβδ.</b> · <b>~'+t.exerciseDaily+' kcal/ημέρα</b></span>'
      +'<span class="met-note">TDEE = BMR×1.2 (NEAT) + άσκηση MET</span>'
      +'</div>';
  }

  // Day toggle buttons for the add row
  var dAbbrAdd=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var dayToggles='<div class="met-day-row">';
  dAbbrAdd.forEach(function(a,i){
    dayToggles+='<button type="button" class="met-day-btn" id="met-day-'+i+'" onclick="toggleMetDay('+i+')">'+a+'</button>';
  });
  dayToggles+='</div>';

  return '<div class="met-wrap" id="met-section-wrap">'
    +'<div class="met-head">'
    +'<span class="met-title">⚡ Αθλητική δραστηριότητα (MET-based)</span>'
    +(useMET?'<span class="met-badge">MET ✓ ενεργό</span>':'')
    +'</div>'

    // ✅ IMPROVED LAYOUT: Organized sections
    +(useMET?'<div class="met-added-section"><div class="met-added-title">✓ Δραστηριότητες που προστέθηκαν:</div><div class="met-list">'+listHtml+'</div>'+totalStr+'</div>':'')

    +'<div class="met-input-section">'
    +'<div class="met-input-title">Προσθήκη νέας δραστηριότητας:</div>'
    +'<div class="met-form-group">'
    +'<label>Κατηγορία αθλήματος:</label>'
    +catSel
    +'<label>Επιλέξτε δραστηριότητα:</label>'
    +actSel
    +'<label>Διάρκεια:</label>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +'<input class="met-mins-inp" type="number" id="met-mins" min="10" max="300" step="5" value="60">'
    +'<span style="font-size:12px;color:#666">λεπτά</span>'
    +'</div>'
    +'</div>'

    +'<div class="met-form-group">'
    +'<label>⏰ Ώρα Προπόνησης:</label>'
    +'<input type="time" id="met-time" value="17:00" style="padding:10px 12px;border:1.5px solid #e0e0e0;border-radius:7px;background:var(--card-bg);font-size:14px;font-weight:600;color:#ff6b35;">'
    +'</div>'

    +'<div class="met-form-group">'
    +'<label>Ημέρες εκτέλεσης:</label>'
    +dayToggles
    +'</div>'

    +'<div style="padding-top:8px;border-top:1px solid #e0e0e0;margin-top:8px">'
    +'<button class="btn primary" style="padding:8px 16px;font-size:12px" onclick="addMetActivity()">+ Προσθήκη δραστηριότητας</button>'
    +'</div>'
    +'</div>'

    +(useMET?'':'<div class="met-note" style="margin-top:8px;padding:8px 12px;background:var(--panel-bg);border-left:3px solid #ff9800">💡 Χωρίς επιλογή δραστηριότητας χρησιμοποιείται ο παραδοσιακός πολλαπλασιαστής δραστηριότητας.</div>')

    +'</div>';
}

function metCatChange(){
  var catIdx=parseInt(document.getElementById('met-cat').value)||0;
  var sel=document.getElementById('met-act');
  if(!sel)return;
  sel.innerHTML='';
  (MET_ACTIVITIES[catIdx]||MET_ACTIVITIES[0]).items.forEach(function(a){
    var opt=document.createElement('option');
    opt.value=a.id;
    opt.textContent=a.name+' — '+a.met+' METs';
    sel.appendChild(opt);
  });
}

function toggleMetDay(d){
  var btn=document.getElementById('met-day-'+d);
  if(!btn)return;
  btn.classList.toggle('met-day-on');
}

function addMetActivity(){
  var c=getC();if(!c)return;
  if(!c.metActivities)c.metActivities=[];
  var catIdx=parseInt(document.getElementById('met-cat').value)||0;
  var actId=document.getElementById('met-act').value;
  var mins=parseInt(document.getElementById('met-mins').value)||60;
  var trainingTime=document.getElementById('met-time').value||'17:00';  // ← NEW: Get training time (format: HH:MM)
  // Collect selected days
  var days=[];
  for(var d=0;d<7;d++){
    var btn=document.getElementById('met-day-'+d);
    if(btn&&btn.classList.contains('met-day-on'))days.push(d);
  }
  if(!days.length){showErrorToast('Επίλεξε τουλάχιστον μία ημέρα!');return;}
  var found=null;
  (MET_ACTIVITIES[catIdx]||MET_ACTIVITIES[0]).items.forEach(function(a){if(a.id===actId)found=a;});
  if(!found)return;
  // ✅ NEW: Store training time with the activity
  c.metActivities.push({id:found.id,name:found.name,met:found.met,mins:mins,time:trainingTime,days:days});
  // Auto-mark days as training days and sync hours
  if(!c.trainDays)c.trainDays=[false,false,false,false,false,false,false];
  if(!c.trainHoursByDay)c.trainHoursByDay=[0,0,0,0,0,0,0];
  if(!c.trainTimes)c.trainTimes=[null,null,null,null,null,null,null];  // ← NEW: Store training times per day
  if(!c.trainTimesByDay)c.trainTimesByDay=['','','','','','',''];  // ← Keep in sync for exports (PDF/Word)
  days.forEach(function(d){
    c.trainDays[d]=true;
    c.trainHoursByDay[d]=Math.max(c.trainHoursByDay[d],+(mins/60).toFixed(1));
    c.trainTimes[d]=trainingTime;  // ← NEW: Store the training time for this day
    c.trainTimesByDay[d]=trainingTime;  // ← Sync so exports show the training time too
  });
  c.dayTargets=null; // recalculate
  save();
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

/* ── Conditional Visibility System ──────────────────────────────────────────*/
// Show/hide Activity Factor or MET section based on sport selection
// IMPORTANT: Activity Factor (Δραστηριότητα & Στόχος) MUST ALWAYS be visible for user selection
function updateConditionalVisibility(sportId){
  var metWrap=document.getElementById('met-section-wrap');
  var afWrap=document.getElementById('activity-factor-wrap');

  if(!metWrap||!afWrap)return;

  // ✅ ALWAYS SHOW Activity Factor/Goal section (user must be able to select these)
  afWrap.style.display='block';

  // If no sport selected, only show Activity Factor
  if(!sportId){
    metWrap.style.display='none';
    return;
  }

  // If sport selected, check isMET flag
  var sport=SPORT_PROFILES[sportId];
  if(!sport){
    metWrap.style.display='none';
    return;
  }

  // Show/hide MET section based on sport type (but Activity Factor is ALWAYS shown)
  if(sport.isMET){
    // MET-based sport: show BOTH MET section AND Activity Factor for flexibility
    metWrap.style.display='block';
    afWrap.style.display='block';
  } else {
    // Non-MET sport: show Activity Factor, hide MET section
    metWrap.style.display='none';
    afWrap.style.display='block';
  }
}

/* ── UX OPTIMIZATION: Auto-update Activity from Sport Selection ──────────── */
function updateActivityFromSport(sportId){
  var c=getC();if(!c)return;
  upd('sport', sportId);

  if(sportId){
    var sport=SPORT_PROFILES[sportId];
    if(!sport)return;

    // Suggest "Έντονα ενεργός" PAL for any real sport (SPORT_PROFILES has no category field to
    // derive a finer band from, and a client with a sport profile is training regularly by
    // definition). Only fills in when the dietitian hasn't already picked a PAL — never
    // overrides a manual choice — and re-renders once so the PAL buttons reflect it.
    var wasEmpty=(sportId!=='custom' && !c.activity && !(c.activityFactor>0));
    if(wasEmpty) c.activity='active';

    updateConditionalVisibility(sportId);
    var noteDiv=document.getElementById('sport-note');
    if(noteDiv)noteDiv.textContent=sport.notes||'';
    if(wasEmpty) renderMain();
  } else {
    // ✅ Cleared sport selection: activity isn't auto-set above, so nothing else
    // triggers a re-render — force one so the header "Άθλημα" tile reflects "—".
    renderMain();
  }

  onClientChange();
}

// ── Sport Protocol Supplement Management (PHASE 4) ──────────────────────────
function toggleSportSupplement(suppId, isChecked){
  var c=getC();if(!c)return;
  if(!c.supps)c.supps=[];

  if(isChecked){
    if(!c.supps.includes(suppId)){
      c.supps.push(suppId);
    }
  } else {
    var idx=c.supps.indexOf(suppId);
    if(idx!==-1)c.supps.splice(idx,1);
  }

  save();
  onClientChange(); // Recalculate supplement suggestions
}

function removeMetActivity(idx){
  var c=getC();if(!c||!c.metActivities)return;
  c.metActivities.splice(idx,1);
  // ✅ Rebuild training-day arrays from remaining activities (MET = single source of truth)
  c.trainDays=[false,false,false,false,false,false,false];
  c.trainHoursByDay=[0,0,0,0,0,0,0];
  c.trainTimes=[null,null,null,null,null,null,null];
  c.trainTimesByDay=['','','','','','',''];
  c.metActivities.forEach(function(ma){
    (ma.days||[]).forEach(function(d){
      c.trainDays[d]=true;
      c.trainHoursByDay[d]=Math.max(c.trainHoursByDay[d],+((ma.mins||60)/60).toFixed(1));
      if(ma.time){c.trainTimes[d]=ma.time;c.trainTimesByDay[d]=ma.time;}
    });
  });
  c.dayTargets=null; // recalculate
  save();
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

/* ── Macro Preset UI ─────────────────────────────────────────────────────── */
// ✅ Focused macro-distribution block for Page 1 (presets + split bar only — diet type lives in its own modal)
function buildMacroDistributionHtml(c,t){
  var preset=c.macroPreset||'balanced';
  var secState=getSecState(c);
  var macroPreview=(MACRO_PRESETS[preset]?MACRO_PRESETS[preset].label:preset)+' · Π'+t.pPct+'% Λ'+t.fPct+'% Υ'+t.cPct+'%';
  var html='<div class="section-card" id="sec-macros" style="margin-top:12px;">'
    +'<div class="section-header sec-collapse-hd" onclick="toggleSec(\'macros\')"><div><span class="section-icon">🎯</span>Κατανομή Μακροθρεπτικών'+(secState.macros?'<div class="sec-collapse-preview">'+esc(macroPreview)+'</div>':'')+'</div><span class="sec-chevron'+(secState.macros?'':' open')+'">▸</span></div>'
    +'<div id="sec-macros-body" style="display:'+(secState.macros?'none':'block')+'">'
    +'<div class="macro-preset-btns">';
  Object.keys(MACRO_PRESETS).forEach(function(k){
    var pr=MACRO_PRESETS[k];
    html+='<button class="macro-preset-btn'+(preset===k?' active':'')+'" onclick="setMacroPreset(\''+k+'\')" title="Π:'+pr.p+'% Λ:'+pr.f+'% Υ:'+pr.c+'%">'+pr.icon+' '+pr.label+'</button>';
  });
  html+='</div>';
  if(preset==='custom'){
    html+='<div class="macro-custom-row">'
      +'<label>Πρωτεΐνη %</label><input class="macro-custom-inp" type="number" min="10" max="60" value="'+(c.macroP||25)+'" onchange="setMacroCustom(\'p\',this.value)">'
      +'<label>Λιπαρά %</label><input class="macro-custom-inp" type="number" min="10" max="70" value="'+(c.macroF||25)+'" onchange="setMacroCustom(\'f\',this.value)">'
      +'<label>Υδατ. %</label><input class="macro-custom-inp" type="number" min="10" max="75" value="'+(c.macroC||50)+'" onchange="setMacroCustom(\'c\',this.value)">'
      +'</div>';
  }
  html+='<div class="macro-split-bar">'
    +'<span class="macro-split-p" style="width:'+t.pPct+'%">Π '+t.pPct+'%</span>'
    +'<span class="macro-split-f" style="width:'+t.fPct+'%">Λ '+t.fPct+'%</span>'
    +'<span class="macro-split-c" style="width:'+t.cPct+'%">Υ '+t.cPct+'%</span>'
    +'</div>'
    +'<div class="macro-split-vals">'
    +'<span class="macro-p-val">Πρωτεΐνη: '+t.p+'g&nbsp;&nbsp;('+t.pPct+'%)</span>'
    +'<span class="macro-f-val">Λιπαρά: '+t.f+'g&nbsp;&nbsp;('+t.fPct+'%)</span>'
    +'<span class="macro-c-val">Υδατ/κες: '+t.carb+'g&nbsp;&nbsp;('+t.cPct+'%)</span>'
    +'</div>'
    +'<div style="font-size:10px;color:#666;margin-top:6px;font-style:italic">Προσαρμόζεται αυτόματα από το άθλημα — αλλάξτε ελεύθερα χειροκίνητα.</div>'
    +buildInsightsPanelHtml(c,t)
    +'</div>'
    +'</div>';
  return html;
}

// 💊 Creatine monohydrate suggestion for strength/power sports (ISSN Position Stand, Kreider et al. 2017).
// Purely informational — no food exclusion or macro change. Empty for any other sport/diet type.
var CREATINE_SUGGESTED_SPORTS={weightlifting:1,crossfit:1,mma:1,bjj:1,boxing:1};


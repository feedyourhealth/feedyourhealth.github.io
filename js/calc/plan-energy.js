// js/calc/plan-energy.js
// Pure energy & plan-scaling calculations, extracted from js/app-part1.js (module split wave 3).
// calcMETkcal, calcTDEE  — take a client object, return numbers; no DOM, no shared state.
// minScaleG, scaledG, SCALE_RATIO_LO/HI, clampRatio, scalePlan, reconcileMealCaloriesAfterRemoval.
// Depends on js/data/* and js/lib/helpers.js (getPregTrimester, snapWholeG) — both load earlier.
// calcTDEE calls calcMETkcal; scalePlan calls minScaleG/scaledG/clampRatio — all in this file, defined first.

function calcMETkcal(c){
  // Returns weekly, daily avg, perTrainDay, and byDay[0..6] exercise kcal
  // Formula: kcal/session = MET × 3.5 × weight(kg) / 200 × duration(min)
  if(!c.metActivities||!c.metActivities.length)return{weekly:0,daily:0,perTrainDay:0,byDay:[0,0,0,0,0,0,0]};
  var weekly=0;
  var byDay=[0,0,0,0,0,0,0];
  c.metActivities.forEach(function(ma){
    var kcalSess=ma.met*3.5*(c.weight||80)/200*ma.mins;
    // New format: ma.days = [0,2,4] specific day indices
    // Old format: ma.daysPerWeek = number (backward compat)
    var dList=ma.days;
    if(!dList){
      // Backward compat: spread over first N train days, or just first N days
      var n=ma.daysPerWeek||3;
      dList=[];
      var td=c.trainDays||[];
      for(var i=0;i<7&&dList.length<n;i++){if(td[i])dList.push(i);}
      if(!dList.length){for(var i=0;i<n&&i<7;i++)dList.push(i);}
    }
    dList.forEach(function(d){byDay[d]+=kcalSess;weekly+=kcalSess;});
  });
  var numTrainDays=(c.trainDays||[]).filter(function(x){return x;}).length;
  var perTrainDay=numTrainDays>0?Math.round(weekly/numTrainDays):Math.round(weekly/7);
  return{weekly:Math.round(weekly),daily:Math.round(weekly/7),perTrainDay:perTrainDay,
    byDay:byDay.map(function(k){return Math.round(k);})};
}
function calcTDEE(c){
  var bmr;
  var t={}; // Initialize tracking object for BMR method and FFM
  var isMinor=(c.age!=null && c.age>0 && c.age<18); // don't coerce a not-yet-entered age to 0 and misclassify as a minor
  var growthAdd=0;

  // ✅ NEW: PRIORITY 0 - Use measured RMR from indirect calorimetry if available
  if(c.rmr && c.rmr > 0){
    bmr = Math.round(c.rmr);
    t.bmrMethod = 'RMR (Εργαστηριακή Μέτρηση)';
    t.ffmUsed = null;
    t.usedRMR = true;
  } else {
  t.usedRMR = false;
  if(isMinor){
    // Schofield (1985) equations — validated for children/adolescents; Mifflin is NOT valid under 18
    var w=c.weight||60;
    if(c.sex==='M'){
      if(c.age<3)bmr=60.9*w-54;
      else if(c.age<10)bmr=22.7*w+495;
      else bmr=17.5*w+651;
    } else {
      if(c.age<3)bmr=61.0*w-51;
      else if(c.age<10)bmr=22.5*w+499;
      else bmr=12.2*w+746;
    }
    bmr=Math.round(bmr);
    // DRI growth allowance on top of activity needs (not BMR)
    growthAdd=c.age<11?100:(c.age<15?150:200);
  } else if(c.formula==='cunningham'&&c.lbm>0){
    // Cunningham: more accurate for athletes — uses lean body mass
    bmr=500+22*c.lbm;
  } else {
    // ✅ PRIORITY SYSTEM for BMR (Katch-McArdle when possible)
    // Priority 1: Measured Lean Mass (NEW: c.leanmass)
    if(c.leanmass && c.leanmass>0){
      // Katch-McArdle using measured lean mass
      bmr=370+21.6*c.leanmass;
      t.bmrMethod='Katch-McArdle (Measured LM)';
      t.ffmUsed=c.leanmass;
    }
    // Priority 2: Calculated FFM from Body Fat %
    else if((c.bf || 0)>0 && c.weight>0){
      // Calculate FFM from body fat percentage — σε εγκυμοσύνη χρησιμοποιούμε το βάρος
      // προ εγκυμοσύνης, ίδιο σκεπτικό με το Mifflin-St Jeor fallback παρακάτω (η φόρμουλα
      // δεν είναι επικυρωμένη πάνω σε εγκυμονούσα φυσιολογία με το τρέχον βάρος)
      var ffmW=(c.pregnant&&c.prePregnancyWeight>0)?c.prePregnancyWeight:c.weight;
      // Clamp to the same physiological range as the #inp-bf field (min="3" max="60") — the
      // HTML attribute doesn't stop a typed (non-spinner) value from reaching here unclamped.
      var bfClamped=Math.max(3,Math.min(60,c.bf));
      var ffm=ffmW*(1-(bfClamped/100));
      // Katch-McArdle using calculated FFM
      bmr=370+21.6*ffm;
      t.bmrMethod='Katch-McArdle (Calc FFM)';
      t.ffmUsed=+(ffm.toFixed(1));
    }
    // Priority 3: Fallback to Mifflin-St Jeor
    else {
      // Mifflin-St Jeor (default) — σε εγκυμοσύνη χρησιμοποιούμε το βάρος προ εγκυμοσύνης όταν υπάρχει
      // (το BMR εξίσωσης δεν είναι επικυρωμένο πάνω σε εγκυμονούσα φυσιολογία με το τρέχον βάρος·
      // η επιπλέον ενεργειακή ανάγκη προστίθεται ξεχωριστά παρακάτω μέσω pregAdd, βάσει IOM/DRI ανά τρίμηνο)
      var bmrW=(c.pregnant&&c.prePregnancyWeight>0)?c.prePregnancyWeight:c.weight;
      bmr=c.sex==='M'?10*bmrW+6.25*c.height-5*c.age+5:10*bmrW+6.25*c.height-5*c.age-161;
      t.bmrMethod='Mifflin-St Jeor';
      t.ffmUsed=null;
    }
  }
  }  // Close else block for RMR check

  // ✅ Εγκυμοσύνη: επιπλέον θερμίδες ανά τρίμηνο πάνω από το TDEE (IOM/National Academies DRI for Energy)
  // Α' τρίμηνο +0, Β' +340, Γ' +452 kcal/ημέρα — εφαρμόζεται ΚΑΘΕ ημέρα (όχι μόνο ημέρες ξεκούρασης, σε αντίθεση με το growthAdd)
  var pregTri=c.pregnant?getPregTrimester(c.gestationalWeek):null;
  var pregAdd=pregTri===3?452:(pregTri===2?340:0);

  var tdee;
  var metKcal=calcMETkcal(c);
  var usedMET=c.metActivities&&c.metActivities.length>0;
  var neat=Math.round(bmr*1.2);// NEAT = BMR × 1.2 (basic daily movement)
  var exerciseKcal=metKcal.daily;// Exercise from MET or estimated
  // CRITICAL: Check for double counting between Activity Factor and MET
  var hasDoubleCountingRisk=false;
  // Standard PAL presets (FAO/WHO/UNU-style bands) — quick-fill values shown as buttons in the UI.
  // c.activityFactor (typed by the dietitian, e.g. to match a specific job) always wins when set.
  var act={sed:1.2,light:1.375,mod:1.55,active:1.725};
  var totalMultiplier=(c.activityFactor>0)?c.activityFactor:(act[c.activity]||1.2);
  if(usedMET){
    // MET-based: TDEE = NEAT + daily average exercise kcal
    tdee=neat+metKcal.daily;
    // WARNING: If Activity Factor > 1.2 (sedentary/NEAT baseline), there's risk of double counting
    // Activity Factor already includes exercise estimate
    if(totalMultiplier>1.2){
      hasDoubleCountingRisk=true;
    }
  } else {
    // Activity factor method: factor includes both NEAT and exercise estimates
    tdee=Math.round(bmr*totalMultiplier);
    // Estimate exercise kcal above the sedentary/NEAT baseline (1.2)
    exerciseKcal=Math.round(Math.max(0,(totalMultiplier-1.2)*bmr));
  }
  tdee=Math.round(tdee);
  // Goal deltas - Support BOTH old (loss/maintain/gain) and NEW (numeric -500 to +500) formats
  var def={mild:-250,loss:-500,maintain:0,gain:300};
  var goalDelta=0;

  // ✅ NEW: Check if goal is numeric (new format: -500 to +500) — accept both string and number
  if((typeof c.goal === 'string' || typeof c.goal === 'number') && !isNaN(parseInt(c.goal))){
    goalDelta = parseInt(c.goal);  // Use direct numeric value
  }
  // Support for custom clientgoalDelta override (set in client object if needed)
  else if(c.customGoalDelta!=null){
    goalDelta = c.customGoalDelta;
  }
  // Fallback to old format (loss/maintain/gain strings)
  else {
    goalDelta = def[c.goal]||0;
  }
  // Per-day MET targets: each day gets its own exercise kcal based on assigned activities
  // Growth allowance (DRI requirement for minors) applies every day, training or rest —
  // matches trainTargetByDay/target below, which already include it every day.
  var baseTDEE=neat;
  var restTarget=usedMET?baseTDEE+goalDelta+growthAdd+pregAdd:tdee+goalDelta+growthAdd+pregAdd;
  var trainTarget=usedMET?baseTDEE+metKcal.perTrainDay+goalDelta+growthAdd+pregAdd:tdee+goalDelta+growthAdd+pregAdd;
  var trainTargetByDay=[];
  for(var tdi=0;tdi<7;tdi++){
    if(usedMET){
      // MET-based: NEAT + per-day exercise + goal + growth (every day)
      trainTargetByDay.push(Math.round(baseTDEE+metKcal.byDay[tdi]+goalDelta+growthAdd+pregAdd));
    } else {
      // Activity factor-based: same for all days (TDEE already has avg activity)
      trainTargetByDay.push(Math.round(tdee+goalDelta+growthAdd+pregAdd));
    }
  }
  // 🛡️ SAFETY FLOOR: mirror the per-day floor in makeDayTgtDefaults (js/app-part2.js) HERE too.
  // Without this, an aggressive flat deficit on a low-BMR client (elderly/small/sedentary) could
  // make this function's own target/restTarget/trainTarget/macros drop below BMR, while the actual
  // generated meal plan (c.dayTargets) is already floored — a dietitian-facing summary that
  // contradicts the plan actually being served. Use the same rounded BMR exposed as t.bmr below.
  var bmrFloor=Math.round(bmr);
  if(bmrFloor){
    restTarget=Math.max(restTarget,bmrFloor);
    trainTarget=Math.max(trainTarget,bmrFloor);
    trainTargetByDay=trainTargetByDay.map(function(v){return Math.max(v,bmrFloor);});
  }
  // ✅ CORRECTED: Single target = average of daily targets
  // This is scientifically correct because:
  // - Growth allowance is applied every day (DRI requirement)
  // - Exercise varies per day (MET or constant activity)
  // - Average gives the weekly balance
  var totalKcal=0;
  for(var tti=0;tti<7;tti++){totalKcal+=trainTargetByDay[tti];}
  var target=Math.round(totalKcal/7);
  // Hydration: weight×35ml base; +500ml per training hour on training days
  var baseHydration=Math.round(c.weight*35);
  // Use max hours across training days for the "training day" hydration guide
  var maxTrainHrs=0;
  if(c.trainHoursByDay){
    for(var hxi=0;hxi<7;hxi++){if(c.trainDays&&c.trainDays[hxi]&&(c.trainHoursByDay[hxi]||0)>maxTrainHrs)maxTrainHrs=c.trainHoursByDay[hxi];}
  }
  if(maxTrainHrs===0)maxTrainHrs=c.trainHoursPerDay||1;
  var trainHydration=Math.round(baseHydration+maxTrainHrs*500);
  // Macro split from preset (default 25/25/50)
  var pPct=(c.macroP!=null?c.macroP:25)/100;
  var fPct=(c.macroF!=null?c.macroF:25)/100;
  var cPct=(c.macroC!=null?c.macroC:50)/100;
  var protG=Math.round(target*pPct/4);
  var fatG=Math.round(target*fPct/9);
  // Calculate carbs as difference to maintain exact calorie matching
  var carbG=Math.max(0,Math.round((target-protG*4-fatG*9)/4)); // floor at 0 — defense-in-depth against p%+f% together exceeding 100
  var protGperKg=c.weight>0?+(protG/c.weight).toFixed(2):0;
  // Energy Availability = (target intake - exercise kcal) / LBM — RED-S screening
  var lbmForEA=c.lbm>0?c.lbm:0;
  if(!lbmForEA&&c.weightLog&&c.weightLog.length){
    var lastWL=c.weightLog.slice().sort(function(a,b){return b.date>a.date?1:-1;})[0];
    if(lastWL&&lastWL.bf>0)lbmForEA=+(lastWL.weight*(1-lastWL.bf/100)).toFixed(1);
  }
  // Fallback: use BF% from client profile if still no LBM
  if(!lbmForEA&&(c.bf||0)>0)lbmForEA=+((c.weight||80)*(1-(c.bf/100))).toFixed(1);
  var ea=null;
  // Calculate EA using actual exercise (now works with or without MET)
  if(lbmForEA>0)ea=+((target-exerciseKcal)/lbmForEA).toFixed(1);
  // VALIDATION WARNINGS
  var warnings=[];
  if(hasDoubleCountingRisk){
    warnings.push({type:'alert',msg:'⚠️ Double Counting Risk: Χρησιμοποιείτε ΑΜΦΟΤΕΡΑ Activity Factor (×'+totalMultiplier+') ΚΑΙ MET activities. Αυτό μπορεί να υπερεκτιμήσει τον TDEE κατά 300-500 kcal. Πρόταση: Θέστε Activity="Sedentary" (1.2) όταν χρησιμοποιείτε MET.'});
  }
  if(protGperKg<1.2){
    warnings.push({type:'warn',msg:'⚠️ Πρωτείνη χαμηλή: '+protGperKg+'g/kg (ελάχιστο 1.2 για απώλεια)'});
  }
  if(protGperKg>3.0){
    warnings.push({type:'warn',msg:'⚠️ Πρωτείνη υψηλή: '+protGperKg+'g/kg (μέγιστο 3.0)'});
  }
  // ✅ 2026-08-01: RED-S / Energy Availability was already fully computed (`ea` above) and shown
  // as a badge (app-part2.js ~3774) + cited protocol (IOC Consensus Statement, app-part4.js) + a
  // dedicated validator entry (app-part1.js ~495-502) — but never pushed into THIS warnings[]
  // array, which is what calorieConsistencyCheck() actually reads to block/confirm BEFORE
  // "Δημιουργία πλάνου" proceeds. So a client at critical EA (e.g. a cutting combat-sports
  // athlete, or amenorrhea+underweight — confirmed live on two such test profiles) generated a
  // plan with zero interactive warning, while a merely-borderline protein% did interrupt the flow.
  // Only gate on the CRITICAL <30 tier (same threshold/copy as the existing 🔴 badge) — the 🟡
  // 30-45 "monitor" tier stays badge-only as before: live-tested, it fires for most trained
  // clients even at plain maintenance (e.g. a maintenance-goal BJJ athlete came out at EA=32),
  // so gating the confirm-dialog on it too would interrupt routine plan generation constantly
  // and risk the dietitian reflexively clicking through every warning, critical ones included.
  if(ea!=null&&ea<30){
    // Plain '<' not '&lt;' — unlike the badge (set via innerHTML), this message is read by
    // calorieConsistencyCheck() into a confirm dialog / error toast that render it as plain text
    // (textContent), which doesn't decode HTML entities — '&lt;' would show up literally.
    // ✅ 2026-08-01: "RED-S" (Relative Energy Deficiency in SPORT) is athlete-specific IOC
    // terminology — misleading on a non-athlete (no c.sport, e.g. a sedentary diabetic on an
    // aggressive deficit). The underlying signal (too little intake vs. lean mass) still applies
    // to everyone, so it stays gated on the same EA<30 threshold — only the label changes.
    if(c.sport){
      warnings.push({type:'alert',msg:'🔴 Κίνδυνος RED-S: EA='+ea+' kcal/kgLBM (κατώφλι <30, IOC Consensus Statement RED-S) — ρίσκος απώλειας οστικής πυκνότητας, εμμηνορροϊκής δυσλειτουργίας, τραυματισμού.'});
    } else {
      // Χωρίς άθλημα: γενική διατύπωση χωρίς "RED-S"/"τραυματισμός" (αθλητικοί όροι) — και χωρίς
      // την αναφορά σε εμμηνορροϊκή δυσλειτουργία όταν ο πελάτης δεν είναι γυναίκα (π.χ. C1, M, 55y
      // βρέθηκε live σε αυτόν ακριβώς τον έλεγχο).
      var femaleConsequence=c.sex==='F'?' και εμμηνορροϊκής δυσλειτουργίας':'';
      warnings.push({type:'alert',msg:'🔴 Χαμηλή ενεργειακή διαθεσιμότητα: EA='+ea+' kcal/kgLBM (κατώφλι <30) — ρίσκος απώλειας οστικής πυκνότητας'+femaleConsequence+' σε παρατεταμένο πολύ χαμηλό θερμιδικό ισοζύγιο.'});
    }
  }
  if(carbG<20&&target>1200){
    warnings.push({type:'warn',msg:'⚠️ Πολύ λίγοι υδατάνθρακες: '+carbG+'g (ίσως συντακτικό λάθος;)'});
  }
  // ✅ %-of-TDEE sanity check για το goal deficit/surplus (ίδιο μοτίβο με τα προηγούμενα g/kg
  // πρωτεΐνης warnings). Το goal είναι clamped απόλυτα σε -500..+500 kcal (βλ. setGoalCalories),
  // αλλά το ΙΔΙΟ απόλυτο kcal ποσό αντιστοιχεί σε πολύ διαφορετικό % ανάλογα με το TDEE του πελάτη
  // (π.χ. -500 σε TDEE 1150 = ~44% έλλειμμα, ενώ σε TDEE 2800 = ~18%). Υπολογίζεται από το
  // ΕΝΕΡΓΟ target vs tdee (μετά το BMR safety floor), ώστε να αντανακλά αυτό που θα πάρει
  // πραγματικά ο πελάτης, όχι το ανεπεξέργαστο goalDelta.
  if(tdee>0){
    var deltaPct=Math.round((target-tdee)/tdee*100);
    if(deltaPct<0&&Math.abs(deltaPct)>25){
      warnings.push({type:'warn',msg:'⚠️ Πολύ μεγάλο έλλειμμα: '+Math.abs(deltaPct)+'% κάτω από το TDEE (συνιστάται ~15-25%, ρίσκο απώλειας μυϊκής μάζας/μεταβολικής προσαρμογής)'});
    } else if(deltaPct>20){
      warnings.push({type:'warn',msg:'⚠️ Πολύ μεγάλο πλεόνασμα: +'+deltaPct+'% πάνω από το TDEE (συνιστάται ~10-20%, ρίσκο υπερβολικής αύξησης λίπους)'});
    }
  }
  // ✅ Εγκυμοσύνη: πρωτεΐνη-στόχος 1.1 g/kg (βάρος προ εγκυμοσύνης) — ACOG/IOM DRI. Δεν επιβάλλεται
  // αυτόματα (το macro% preset μένει στη διακριτική ευχέρεια της διαιτολόγου) — μόνο προειδοποίηση, ίδιο σχέδιο με τα προηγούμενα warnings.
  if(c.pregnant){
    var pregWforProt=(c.prePregnancyWeight>0)?c.prePregnancyWeight:c.weight;
    var pregProtGperKg=pregWforProt>0?+(protG/pregWforProt).toFixed(2):0;
    if(pregProtGperKg<1.1){
      warnings.push({type:'warn',msg:'🤰 Πρωτεΐνη κάτω από τον στόχο εγκυμοσύνης: '+pregProtGperKg+'g/kg (ελάχιστο 1.1 g/kg βάρους προ εγκυμοσύνης, ACOG/IOM)'});
    }
    if(!pregTri){
      warnings.push({type:'warn',msg:'🤰 Συμπλήρωσε εβδομάδα κύησης για ακριβή θερμιδικό στόχο τριμήνου'});
    }
    // GDM carb floor (IOM/ADA): ποτέ κάτω από 175g/ημ. υδατάνθρακες σε εγκυμοσύνη, ακόμα κι αν το
    // πρωτόκολλο διαβήτη ζητά χαμηλότερο ποσοστό — βλ. verification pass, PMC12620731.
    if(c.medConditions && c.medConditions.diabetes && carbG<175){
      warnings.push({type:'alert',msg:'🚫 GDM: υδατάνθρακες '+carbG+'g κάτω από το ελάχιστο ασφαλείας 175g/ημ. (IOM/ADA) — ανέβασε το ποσοστό υδατανθράκων στην Κατανομή Μακροθρεπτικών.'});
    }
  }
  return{bmr:Math.round(bmr),tdee:tdee,target:target,
    restTarget:restTarget,trainTarget:trainTarget,trainTargetByDay:trainTargetByDay,
    p:protG,f:fatG,carb:carbG,
    pPct:Math.round(pPct*100),fPct:Math.round(fPct*100),cPct:Math.round(cPct*100),
    hydBase:baseHydration,hydTrain:trainHydration,
    exerciseDaily:exerciseKcal,exerciseWeekly:metKcal.weekly,
    perTrainDay:metKcal.perTrainDay,byDay:metKcal.byDay,usedMET:usedMET,
    isMinor:isMinor,growthAdd:growthAdd,neat:neat,
    pregTrimester:pregTri,pregAdd:pregAdd,
    protGperKg:protGperKg,ea:ea,lbmForEA:lbmForEA,warnings:warnings,
    bmrMethod:t.bmrMethod||'Mifflin-St Jeor',ffmUsed:t.ffmUsed||null,usedRMR:t.usedRMR||false};
}
// Minimum grams a food may be scaled down to.
// Foods shown in pieces (FOOD_UNITS) get a floor of half a piece, so the
// generator can't shrink a banana to ~5g while the chip still reads "1 τεμ.".
function minScaleG(n){var u=FOOD_UNITS[n];return (u&&u.g)?Math.max(5,Math.round(u.g*0.5)):5;}

// Σκαλάρει τα γραμμάρια ενός τροφίμου κατά r, χωρίς να αφήνει το minScaleG floor να ΑΥΞΗΣΕΙ ένα υλικό
// σε scale-down (πραγματικό bug, βρέθηκε σε QA: 555→300kcal σε μια συνταγή σολομού/ρυζιού/μπρόκολου
// αύξανε το ρύζι 80g→88g ενώ όλα τα άλλα μίκραιναν — το minScaleG(n) είναι σταθερό, δεν ήξερε τι
// ποσότητα είχε το υλικό ΠΡΙΝ, οπότε ένα υλικό ήδη κάτω από το κατώφλι του σπρωχνόταν ΠΑΝΩ σε αυτό).
// Όταν r<1, το κατώφλι δεν μπορεί να ξεπεράσει το ΑΡΧΙΚΟ ποσό — εξακολουθεί να εμποδίζει εξωφρενικά
// μικρές ποσότητες, αλλά ποτέ δεν αντιστρέφει την κατεύθυνση του σκαλίσματος.
function scaledG(n,origG,r){
  var floor=r<1?Math.min(minScaleG(n),origG):minScaleG(n);
  return Math.max(floor,Math.round(origG*r));
}

// Βήμα 2b: guard-rail για τους ανεξάρτητους macro λόγους. Ένα γεύμα του template με ελάχιστη
// πρωτεΐνη/υδατάνθρακες (π.χ. ενδιάμεσο με φυτικό γάλα ~2g πρωτ.) έβγαζε ratioP = targetP/~2 ≈ ×8
// και φούσκωνε ένα τρόφιμο σε εξωφρενική μερίδα (μετρήθηκε: 958g «Γάλα καρύδας» / 1755 kcal σε ένα
// snack). Το reconcile pass παρακάτω (clamp 0.7–1.4) δεν μπορεί να αναιρέσει τέτοιο σφάλμα σε ένα
// βήμα. Το clamp εδώ + τα SCALE_CATS caps για 'Όσπρια'/'Αυγά/Γαλακτ.' κρατούν τις μερίδες ρεαλιστικές.
var SCALE_RATIO_LO=0.3, SCALE_RATIO_HI=3.0;
function clampRatio(r){ return Math.max(SCALE_RATIO_LO, Math.min(SCALE_RATIO_HI, r)); }

function scalePlan(tmpl,tgt,mealTargets){
  var p=deepClone(tmpl);

  // ✅ NEW: If per-meal targets provided, scale each meal individually
  if(mealTargets && Array.isArray(mealTargets) && mealTargets.length===tmpl.length){
    console.log('scalePlan: Using per-meal targets for precise scaling');
    p.forEach(function(m,mealIdx){
      var mealTarget=mealTargets[mealIdx];
      var mealTot={k:0,pt:0,f:0,c:0};

      // Calculate current totals for this meal
      m.foods.forEach(function(f){var v=cm(f.n,f.g);mealTot.k+=v.k;mealTot.pt+=v.p;mealTot.f+=v.f;mealTot.c+=v.c;});
      if(mealTot.k===0)return; // Skip empty meals

      // Scale this meal to hit its specific target
      var targetK=mealTarget.k||mealTot.k;
      var targetP=mealTarget.p||0;
      var targetF=mealTarget.f||0;
      var targetC=mealTarget.c||0;

      var ratioK=targetK/mealTot.k;
      var ratioP=clampRatio((targetP>0&&mealTot.pt>0)?targetP/mealTot.pt:ratioK);
      var ratioC=(targetC>0&&mealTot.c>0)?targetC/mealTot.c:ratioK;

      // ✅ FAT-DRIFT FIX: ratioF used to be targetF/mealTot.f — i.e. computed as if 'Λάδια'/'Ξηροί
      // καρποί' foods were the ONLY source of fat in the meal. In real meals most fat actually comes
      // from protein-category foods (meat/fish/eggs/dairy — MACRO_TYPE 'p'), which get scaled by
      // ratioP (driven by the protein target, not the fat target) a few lines below. So the old ratioF
      // was sized to close a fat gap that protein foods were already going to close (or blow past) on
      // their own — confirmed live: generated plans delivered +14% to +56% more fat than the target
      // across every tested client profile, worst in calorie-deficit scenarios. Fix: project how much
      // fat the OTHER categories will contribute once scaled by their own ratios first, then size
      // ratioF so the fat-category foods fill only the REMAINING gap to targetF (same "remainder"
      // principle calcTDEE() already uses for carbG — see its comment on exact calorie matching).
      var fatFromFatCat=0,projectedFatFromOthers=0;
      m.foods.forEach(function(f){
        var cat=FOODS[f.n]?FOODS[f.n].cat:'';
        var mt=MACRO_TYPE[cat]||'k';
        var v=cm(f.n,f.g);
        if(mt==='f'){fatFromFatCat+=v.f;}
        else{projectedFatFromOthers+=v.f*(mt==='p'?ratioP:mt==='c'?ratioC:ratioK);}
      });
      var ratioF;
      if(targetF>0&&fatFromFatCat>0){
        ratioF=(targetF-projectedFatFromOthers)/fatFromFatCat; // may go negative — the SCALE_CATS cap below floors it sanely
      } else if(targetF>0&&mealTot.f>0){
        ratioF=targetF/mealTot.f; // no fat-category food in this meal — value is moot, nothing will use it
      } else {
        ratioF=ratioK;
      }

      // Scale foods in this meal
      m.foods.forEach(function(f){
        var cat=FOODS[f.n]?FOODS[f.n].cat:'';
        var mt=MACRO_TYPE[cat]||'k';
        var r=mt==='p'?ratioP:mt==='c'?ratioC:mt==='f'?ratioF:ratioK;
        var cap=SCALE_CATS[cat];
        if(cap)r=Math.min(cap.hi,Math.max(cap.lo,r));
        f.g=snapWholeG(f.n,scaledG(f.n,f.g,r));
      });

      // ✅ ΤΕΛΙΚΟΣ ΕΛΕΓΧΟΣ ΘΕΡΜΙΔΩΝ: κάθε τρόφιμο μόλις σκαλώθηκε από τον ΔΙΚΟ ΤΟΥ macro-type λόγο
      // (πρωτεΐνη→ratioP, υδατ.→ratioC, λίπος→ratioF) — ανεξάρτητα το ένα από το άλλο. Επειδή τα
      // περισσότερα πραγματικά τρόφιμα έχουν μεικτά μακροθρεπτικά (π.χ. αυγά = πρωτεΐνη + λίπος), το
      // άθροισμα θερμίδων μετά από αυτούς τους ανεξάρτητους λόγους συχνά αποκλίνει από το targetK, ακόμα
      // κι όταν κάθε μακροθρεπτικό «πέτυχε» το δικό του γραμμαριαίο στόχο (επιβεβαιωμένο: αποκλίσεις
      // -30% έως +17% στο ημερήσιο σύνολο σε πραγματικά πλάνα). Μία επιπλέον, ενιαία διόρθωση εδώ κλείνει
      // το χάσμα θερμίδων χωρίς να πειράξει σημαντικά τις αναλογίες μακροθρεπτικών που μόλις πετύχαμε.
      // Βήμα 2c: bounded LOOP αντί για ένα μόνο pass. Ένα clamped pass (0.7–1.4) δεν κλείνει
      // αποκλίσεις >40% — μέρες που έβγαιναν −20%…−28% kcal έμεναν εκεί. 3 ήπια passes επιτρέπουν
      // σωρευτική διόρθωση (έως ~×2.7 / ÷0.34) χωρίς βίαια άλματα σε ένα βήμα, και σταματούν μόλις
      // το γεύμα μπει εντός ±3% του στόχου.
      for(var rp=0;rp<3;rp++){
        var afterTot=0;
        m.foods.forEach(function(f){ afterTot+=cm(f.n,f.g).k; });
        if(afterTot<=0)break;
        var reconcile=targetK/afterTot;
        if(Math.abs(reconcile-1)<=0.03)break;
        reconcile=Math.max(0.7,Math.min(1.4,reconcile));
        m.foods.forEach(function(f){
          var cat=FOODS[f.n]?FOODS[f.n].cat:'';
          var cap=SCALE_CATS[cat];
          var r=reconcile;
          if(cap)r=Math.min(cap.hi,Math.max(cap.lo,r));
          f.g=snapWholeG(f.n,scaledG(f.n,f.g,r));
        });
      }
    });
    return p;
  }

  // FALLBACK: Original behavior for backward compatibility
  var tot={k:0,pt:0,f:0,c:0};
  p.forEach(function(m){m.foods.forEach(function(f){var v=cm(f.n,f.g);tot.k+=v.k;tot.pt+=v.p;tot.f+=v.f;tot.c+=v.c;});});
  if(!tot.k)return p;

  var targetK=(typeof tgt==='object'&&tgt)?(tgt.k||tot.k):(tgt||tot.k);
  var targetP=(typeof tgt==='object'&&tgt&&tgt.p)?tgt.p:0;
  var targetF=(typeof tgt==='object'&&tgt&&tgt.f)?tgt.f:0;
  var targetC=(typeof tgt==='object'&&tgt&&tgt.c)?tgt.c:0;

  var ratioK=targetK/tot.k;
  var ratioP=clampRatio((targetP>0&&tot.pt>0)?targetP/tot.pt:ratioK);
  var ratioC=(targetC>0&&tot.c>0)?targetC/tot.c:ratioK;

  // ✅ FAT-DRIFT FIX — same reasoning as the per-meal branch above: size ratioF off the fat
  // REMAINING after protein/carb/fallback foods are scaled by their own ratios, not off tot.f
  // (which double-counts fat that protein-category foods already carry).
  var fatFromFatCat=0,projectedFatFromOthers=0;
  p.forEach(function(m){m.foods.forEach(function(f){
    var cat=FOODS[f.n]?FOODS[f.n].cat:'';
    var mt=MACRO_TYPE[cat]||'k';
    var v=cm(f.n,f.g);
    if(mt==='f'){fatFromFatCat+=v.f;}
    else{projectedFatFromOthers+=v.f*(mt==='p'?ratioP:mt==='c'?ratioC:ratioK);}
  });});
  var ratioF;
  if(targetF>0&&fatFromFatCat>0){
    ratioF=(targetF-projectedFatFromOthers)/fatFromFatCat;
  } else if(targetF>0&&tot.f>0){
    ratioF=targetF/tot.f;
  } else {
    ratioF=ratioK;
  }

  p.forEach(function(m){
    m.foods.forEach(function(f){
      var cat=FOODS[f.n]?FOODS[f.n].cat:'';
      var mt=MACRO_TYPE[cat]||'k';
      var r=mt==='p'?ratioP:mt==='c'?ratioC:mt==='f'?ratioF:ratioK;
      var cap=SCALE_CATS[cat];
      if(cap)r=Math.min(cap.hi,Math.max(cap.lo,r));
      f.g=snapWholeG(f.n,scaledG(f.n,f.g,r));
    });
  });
  return p;
}

// ✅ Μετά την αφαίρεση τροφίμων ΜΕΤΑ το scalePlan (π.χ. καθαρισμός βρώμης/αποκλεισμών), τα υπόλοιπα
// τρόφιμα του γεύματος μένουν στα ίδια γραμμάρια αλλά το γεύμα πλέον έχει λιγότερες θερμίδες από τον
// στόχο του — καμία διόρθωση δεν γινόταν. Κλιμακώνει αναλογικά τα εναπομείναντα τρόφιμα ώστε το γεύμα
// να ξαναφτάσει τον στόχο θερμίδων που είχε ΠΡΙΝ την αφαίρεση (ίδια λογική caps/ελάχιστα με scalePlan).
function reconcileMealCaloriesAfterRemoval(meal,targetK){
  if(!meal||!meal.foods||!meal.foods.length||!targetK)return;
  var curK=0;
  meal.foods.forEach(function(f){curK+=cm(f.n,f.g).k;});
  if(curK<=0)return;
  var ratio=targetK/curK;
  if(Math.abs(ratio-1)<0.03)return; // ήδη αρκετά κοντά
  ratio=Math.max(0.5,Math.min(2.5,ratio));
  meal.foods.forEach(function(f){
    var cat=FOODS[f.n]?FOODS[f.n].cat:'';
    var cap=SCALE_CATS[cat];
    var r=ratio;
    if(cap)r=Math.min(cap.hi,Math.max(cap.lo,r));
    f.g=snapWholeG(f.n,scaledG(f.n,f.g,r));
  });
}


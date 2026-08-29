// js/calc/macros-recalc.js
// Personalised micronutrient targets + the cascade-recalculation engine, extracted
// verbatim from the top of js/app-part1.js (module split wave 32):
//   getMicronutrientTargets(c) — sport/diet/altitude-adjusted daily targets
//   VALIDATION_RULES + validateAllCalculations + logValidation
//   the debounced recalc block: _recalcTimeout/_recalcDebounceMs/_lastRecalcChanges,
//   onClientChange, recalculateMacros, updateMealTimingGuide, shouldRegeneratePlan,
//   showPlanRegenerationPrompt, showAutoRecalculationNotification.
// Only literal `var _recalc* = …` initialisers run at parse time. onClientChange /
// recalculateMacros call renderMain / genPlan / makeDayTgtDefaults / save at runtime
// (defined in later modules). Depends on calcTDEE (calc/plan-energy.js) + data/*;
// loads right after calc/plan-energy.js. Callers in client-editor/*, app-part4.js,
// plan-gen/* are all runtime.

// ── PHASE 4: Academic Sports Nutrition Protocols (ISSN, IOC, PubMed) ──────────
// Based on comprehensive research: ISSN Consensus, IOC 2018, PubMed meta-analyses

// ── PHASE 3: Micronutrient Targets Function ──────────────────────────────────
// Returns personalized daily micronutrient targets based on athlete profile
// SCIENCE-BASED ADJUSTMENTS (2024-2025 research):
// - Sport-specific boosts (endurance +50% Fe, strength +25% Mg, combat +75% Fe)
// - Diet-type adjustments (vegan +80% Fe, +25% Zn; Orthodox +B12 supplement)
// - Environmental factors (altitude +100% Fe for erythropoiesis)
function getMicronutrientTargets(c){
  var age=c.age||30,sex=c.sex||'M',weight=c.weight||80,sport=c.sport,dietType=c.dietType;
  var trainDays=(c.trainDays||[]).filter(function(x){return x;}).length;
  var isAthlete=!!(trainDays>=3);
  var athleteBoost=isAthlete?1.25:1.0;

  // Sport-specific published targets (ISSN/IOC-sourced, SPORT_PROTOCOLS[sport].criticalMicronutrients)
  // take precedence over the generic sportBoost heuristic below for iron/zinc/magnesium/calcium/vitaminD,
  // since they're already validated per-sport numbers rather than a generic multiplier.
  var sportCrit=(sport&&SPORT_PROTOCOLS[sport])?SPORT_PROTOCOLS[sport].criticalMicronutrients:null;

  // ═════ SPORT-SPECIFIC BOOSTS (based on oxidative stress & demands) ═════
  var sportBoost={iron:1.0,zinc:1.0,magnesium:1.0,b_vitamins:1.0};

  if(sport){
    // c.sport stores a SPORT_PROFILES *key* (e.g. 'boxing','crossfit'), not the display name
    // these .includes() checks were written against (e.g. 'Boxing','CrossFit') — resolve to the
    // real display name first, or this whole block silently never matches (case-sensitive compare
    // against the wrong string). See dietologist-pending-work memory, 2026-07-15, for the audit that found this.
    var sportName=(SPORT_PROFILES[sport]&&SPORT_PROFILES[sport].name)||sport;
    // ENDURANCE (Running, Cycling, Swimming, Triathlon)
    if(sportName.includes('Τρέξιμο')||sportName.includes('Ποδηλασία')||sportName.includes('Κολύμβηση')){
      sportBoost.iron=1.50; // +50%: increased oxidative stress, sweat losses
      sportBoost.magnesium=1.25; // +25%: muscle fatigue, 56.8% endurance athletes deficient
      sportBoost.b_vitamins=1.20; // +20%: energy metabolism demands
    }
    // STRENGTH/POWER (Weightlifting, Powerlifting, Gymnastics)
    else if(sportName.includes('Weightlifting')||sportName.includes('Powerlifting')||sportName.includes('Γυμναστική')){
      sportBoost.zinc=1.25; // +25%: protein synthesis, muscle growth
      sportBoost.magnesium=1.25; // +25%: muscle contraction, 300+ enzymatic reactions
    }
    // COMBAT SPORTS (MMA, Boxing, Wrestling, BJJ)
    else if(sportName.includes('MMA')||sportName.includes('Mixed Martial Arts')||sportName.includes('Boxing')||sportName.includes('Wrestling')||sportName.includes('Jiu Jitsu')){
      sportBoost.iron=1.75; // +75%: extreme oxidative stress + frequent weight cuts
      sportBoost.magnesium=1.50; // +50%: muscle cramps prevention, sweat losses
      sportBoost.zinc=1.50; // +50%: immune support (high injury risk), CO2 removal
    }
    // TEAM SPORTS (Soccer, Basketball, Volleyball)
    else if(sportName.includes('Ποδόσφαιρο')||sportName.includes('Μπάσκετ')||sportName.includes('Volley')){
      sportBoost.iron=1.40; // +40%: high intensity intervals
      sportBoost.magnesium=1.30; // +30%: muscle fatigue
    }
    // MIXED TRAINING (CrossFit, functional fitness)
    else if(sportName.includes('CrossFit')||sportName.includes('functional')){
      sportBoost.iron=1.50;
      sportBoost.magnesium=1.40;
      sportBoost.zinc=1.25;
    }
  }

  // ═════ DIET-TYPE ADJUSTMENTS (bioavailability & deficiency risks) ═════
  // magnesium:1.0 — plant-based diets are generally magnesium-rich (nuts/seeds/legumes/whole
  // grains), unlike Fe/Zn/B12 which have real bioavailability/absence issues, so no diet-type
  // boost is warranted here by default (was previously buggy: mistakenly reused dietBoost.iron).
  var dietBoost={iron:1.0,zinc:1.0,b12:1.0,calcium:1.0,folate:1.0,magnesium:1.0};

  if(dietType){
    // VEGAN: Lower bioavailability of Fe/Zn, NO natural B12
    if(dietType.includes('vegan')){
      dietBoost.iron=1.80; // +80%: nonheme iron bioavailability 2-20% vs heme 15-35%
      dietBoost.zinc=1.25; // +25%: phytate inhibition of absorption
      dietBoost.b12=2.0; // x2 or supplement required (50% vegans B12 deficient)
      dietBoost.folate=1.15; // +15%: higher requirement for RBC synthesis
    }
    // VEGETARIAN: Better than vegan but still watch Fe/Zn/B12
    else if(dietType.includes('Χορτοφαγική')||dietType.includes('vegetarian')){
      dietBoost.iron=1.50; // +50%
      dietBoost.zinc=1.15; // +15%
      dietBoost.b12=1.30; // +30% or monitor closely
    }
    // ORTHODOX FASTING: Low Ca, B12, but Fe OK (may be elevated)
    else if(dietType.includes('Ορθόδοξη')){
      dietBoost.calcium=1.50; // +50%: dairy avoidance during fasting
      dietBoost.b12=1.40; // +40%: reduced dairy/egg intake
      // Iron is typically OK or elevated, no boost needed
    }
  }

  // ═════ ENVIRONMENTAL BOOSTS ═════
  var envBoost={iron:1.0};
  // Altitude training: hypoxia triggers erythropoiesis, requires iron
  if(c.altitudeTraining){
    envBoost.iron=2.0; // +100%: needs 100-200mg/day during altitude camps
  }

  // ═════ FINAL TARGET CALCULATIONS ═════
  var baseIron=sex==='M'?8:age<51?18:8;
  var baseZinc=sex==='M'?11:8;
  var baseMag=sex==='M'?(age<31?400:420):(age<31?310:320);
  var baseCa=age<51?1000:1200;
  var baseB12=2.4;
  var baseVitD=age<71?15:20; // IOM/ODS-NIH adult RDA: 15mcg (600 IU) through age 70, 20mcg (800 IU) 71+

  var finalIron=Math.round(baseIron*athleteBoost*sportBoost.iron*dietBoost.iron*envBoost.iron);
  var finalZinc=Math.round(baseZinc*athleteBoost*sportBoost.zinc*dietBoost.zinc);
  var finalMag=Math.round(baseMag*athleteBoost*sportBoost.magnesium*dietBoost.magnesium);
  var finalCa=Math.round(baseCa*athleteBoost*dietBoost.calcium);
  var finalB12=baseB12*athleteBoost*dietBoost.b12;

  // When a sport-specific published target exists (SPORT_PROTOCOLS), it already represents
  // the intended athletic-level intake for that sport — use it as-is for `athletic` (no
  // athleteBoost/sportBoost stacking on top, which would double-count), but still layer the
  // diet-type/altitude adjustments on top for `adjusted`, since those are independent factors.
  var ironCrit=sportCrit&&sportCrit.iron;
  var zincCrit=sportCrit&&sportCrit.zinc;
  var magCrit=sportCrit&&sportCrit.magnesium;
  var caCrit=sportCrit&&sportCrit.calcium;
  var vitDCrit=sportCrit&&sportCrit.vitaminD;

  return{
    iron:{
      target:baseIron,
      unit:NUTRIENT_UNITS.iron,label:'Iron (Fe)',
      notes:ironCrit?ironCrit.notes:(sex==='M'?'Adult male':age<51?'Menstruating female':'Postmenopausal'),
      athletic:ironCrit?ironCrit.target:Math.round(baseIron*athleteBoost),
      adjusted:ironCrit?Math.round(ironCrit.target*dietBoost.iron*envBoost.iron):finalIron,
      sportSpecific:!!ironCrit
    },
    zinc:{
      target:baseZinc,
      unit:NUTRIENT_UNITS.zinc,label:'Zinc (Zn)',
      notes:zincCrit?zincCrit.notes:(sex==='M'?'Adult male':'Adult female'),
      athletic:zincCrit?zincCrit.target:Math.round(baseZinc*athleteBoost),
      adjusted:zincCrit?Math.round(zincCrit.target*dietBoost.zinc):finalZinc,
      sportSpecific:!!zincCrit
    },
    magnesium:{
      target:baseMag,
      unit:NUTRIENT_UNITS.magnesium,label:'Magnesium (Mg)',
      notes:magCrit?magCrit.notes:'Essential for muscle function & recovery',
      athletic:magCrit?magCrit.target:Math.round(baseMag*athleteBoost),
      adjusted:magCrit?Math.round(magCrit.target*dietBoost.magnesium):finalMag,
      sportSpecific:!!magCrit
    },
    calcium:{
      target:baseCa,
      unit:NUTRIENT_UNITS.calcium,label:'Calcium (Ca)',
      notes:caCrit?caCrit.notes:'Bone health & muscle function',
      athletic:caCrit?caCrit.target:Math.round(baseCa*athleteBoost),
      adjusted:caCrit?Math.round(caCrit.target*dietBoost.calcium):finalCa,
      sportSpecific:!!caCrit
    },
    b1:{
      target:sex==='M'?1.2:1.1,
      unit:NUTRIENT_UNITS.b1,label:'B1 (Thiamine)',
      notes:'Energy metabolism',
      athletic:Math.round((sex==='M'?1.2:1.1)*athleteBoost*sportBoost.b_vitamins*100)/100
    },
    b2:{
      target:sex==='M'?1.3:1.1,
      unit:NUTRIENT_UNITS.b2,label:'B2 (Riboflavin)',
      notes:'Energy & antioxidant support',
      athletic:Math.round((sex==='M'?1.3:1.1)*athleteBoost*sportBoost.b_vitamins*100)/100
    },
    b3:{
      target:sex==='M'?16:14,
      unit:NUTRIENT_UNITS.b3,label:'B3 (Niacin)',
      notes:'Energy metabolism',
      athletic:Math.round((sex==='M'?16:14)*athleteBoost*sportBoost.b_vitamins)
    },
    b6:{
      target:sex==='M'?1.3:1.3,
      unit:NUTRIENT_UNITS.b6,label:'B6 (Pyridoxine)',
      notes:'Protein metabolism & immune',
      athletic:Math.round((sex==='M'?1.3:1.3)*athleteBoost*sportBoost.b_vitamins*100)/100
    },
    b12:{
      target:baseB12,
      unit:NUTRIENT_UNITS.b12,label:'B12 (Cobalamin)',
      notes:'Nerve function & energy',
      athletic:Math.round(baseB12*athleteBoost*100)/100,
      adjusted:Math.round(finalB12*100)/100,
      supplementRequired:dietType&&(dietType.includes('vegan')||dietType.includes('Ορθόδοξη'))
    },
    folate:{
      target:400,
      unit:NUTRIENT_UNITS.folate,label:'Folate',
      notes:'Cell division & protein metabolism',
      athletic:Math.round(400*athleteBoost*dietBoost.folate)
    },
    omega3:{
      target:sex==='M'?1.6:1.1,
      unit:NUTRIENT_UNITS.omega3,label:'Omega-3 (ALA)',
      notes:'Anti-inflammatory, cardiovascular',
      athletic:Math.round((sex==='M'?1.6:1.1)*athleteBoost*10)/10
    },
    omega6:{
      target:sex==='M'?17:12,
      unit:NUTRIENT_UNITS.omega6,label:'Omega-6 (LA)',
      notes:'Essential fatty acid',
      athletic:Math.round((sex==='M'?17:12)*athleteBoost)
    },
    // ✅ Εγκυμοσύνη pass: Ιώδιο/Χολίνη/DHA — στόχοι πέφτουν κατευθείαν σε c.pregnant (IOM/ACOG/ODS-NIH,
    // βλ. verification pass), ίδιο πρότυπο με το ηλικιακό/φύλου branching του baseIron/baseCa πιο πάνω.
    iodine:{
      target:c.pregnant?220:150,
      unit:NUTRIENT_UNITS.iodine,label:'Ιώδιο',
      notes:c.pregnant?'Στόχος εγκυμοσύνης (ACOG/ODS-NIH)':'Γενικός ενήλικας',
      athletic:c.pregnant?220:150
    },
    choline:{
      target:c.pregnant?450:(sex==='M'?550:425),
      unit:NUTRIENT_UNITS.choline,label:'Χολίνη',
      notes:c.pregnant?'Στόχος εγκυμοσύνης, ανώτατο όριο ασφαλείας 3500mg/ημ. (IOM)':'Adequate Intake (IOM)',
      athletic:c.pregnant?450:(sex==='M'?550:425)
    },
    dha:{
      target:c.pregnant?200:250,
      unit:NUTRIENT_UNITS.dha,label:'DHA (ω-3)',
      notes:c.pregnant?'Ελάχιστο εγκυμοσύνης (ACOG/Perinatal Lipid Intake Working Group)':'Γενική σύσταση EPA+DHA (όχι επίσημο DRI)',
      athletic:c.pregnant?200:250
    },
    vitaminD:{
      target:baseVitD,
      unit:NUTRIENT_UNITS.vitaminD,label:'Βιταμίνη D',
      notes:vitDCrit?vitDCrit.notes:'IOM/ODS-NIH Adequate Intake',
      athletic:vitDCrit?vitDCrit.target:baseVitD,
      adjusted:vitDCrit?vitDCrit.target:baseVitD,
      sportSpecific:!!vitDCrit
    }
  };
}

// MICRONUTRIENTS — key foods with their micronutrient content per 100g
// Format: {Fe_mg, Zn_mg, Mg_mg, Ca_mg, B1_mg, B2_mg, B3_mg_ne, B6_mg, B12_mcg, Folate_mcg, Omega3_g, Omega6_g}

/* ══════════════════════════════════════════════════════════════════════════════════
   🔍 VALIDATION SYSTEM — Comprehensive calculation audits for data integrity
   ══════════════════════════════════════════════════════════════════════════════════ */

var VALIDATION_RULES={
  // BMR validation (Mifflin-St Jeor)
  bmr:{
    name:'BMR (Mifflin-St Jeor)',
    validate:function(c,t){
      if(!c.weight||!c.height||!c.age)return{ok:true,msg:'Missing data'};
      var expected;
      if(c.sex==='M'){
        expected=Math.round(10*c.weight+6.25*c.height-5*c.age+5);
      } else {
        expected=Math.round(10*c.weight+6.25*c.height-5*c.age-161);
      }
      var diff=Math.abs(t.bmr-expected);
      if(diff>2)return{ok:false,msg:'BMR mismatch: calculated '+expected+' but got '+t.bmr,diff:diff};
      return{ok:true,msg:'✓ BMR correct: '+t.bmr+' kcal'};
    }
  },

  // TDEE validation (Activity factor method)
  tdee:{
    name:'TDEE (Activity Factor)',
    validate:function(c,t){
      if(t.usedMET)return{ok:true,msg:'Using MET-based TDEE (not Activity Factor)'};
      var act={sed:1.2,light:1.375,mod:1.55,active:1.725};
      var factor=act[c.activity]||1.2;
      var expected=Math.round(t.bmr*factor);
      var diff=Math.abs(t.tdee-expected);
      if(diff>5)return{ok:false,msg:'TDEE mismatch: expected '+expected+' but got '+t.tdee,diff:diff};
      return{ok:true,msg:'✓ TDEE correct: '+t.tdee+' kcal (×'+factor+')'};
    }
  },

  // MET calculation validation
  met:{
    name:'MET Activity Calculation',
    validate:function(c,t){
      if(!c.metActivities||!c.metActivities.length)return{ok:true,msg:'No MET activities'};
      var totalWeekly=0;
      c.metActivities.forEach(function(act){
        var kcalSession=Math.round(act.met*3.5*c.weight/200*act.mins);
        var kcalWeek=kcalSession*(act.days||[]).length;
        totalWeekly+=kcalWeek;
      });
      var diff=Math.abs(t.exerciseWeekly-totalWeekly);
      if(diff>10)return{ok:false,msg:'MET weekly mismatch: expected '+totalWeekly+' but got '+t.exerciseWeekly,diff:diff};
      return{ok:true,msg:'✓ MET calculation correct: '+t.exerciseWeekly+' kcal/week'};
    }
  },

  // Macro calculations validation
  macros:{
    name:'Macro Calculations',
    validate:function(c,t){
      var pCals=t.p*4;
      var fCals=t.f*9;
      var cCals=t.carb*4;
      var totalCals=pCals+fCals+cCals;
      var diff=Math.abs(totalCals-t.target);
      if(diff>5){
        return{ok:false,msg:'Macro total mismatch: P('+t.p+'g×4='+pCals+')+F('+t.f+'g×9='+fCals+')+C('+t.carb+'g×4='+cCals+')='+totalCals+' but target is '+t.target,diff:diff};
      }
      // Check protein ratios
      var pRatio=t.target?Math.round(pCals/t.target*100):0;
      if(pRatio<t.pPct-2||pRatio>t.pPct+2){
        return{ok:false,msg:'Protein % mismatch: calculated '+pRatio+'% but expected '+t.pPct+'%'};
      }
      return{ok:true,msg:'✓ Macros correct: P'+t.p+'g ('+t.pPct+'%) F'+t.f+'g ('+t.fPct+'%) C'+t.carb+'g ('+t.cPct+'%)'};
    }
  },

  // Daily targets with MET validation
  dailyTargets:{
    name:'Daily MET Targets',
    validate:function(c,t){
      if(!t.usedMET||!c.dayTargets||c.dayTargets.length!==7)return{ok:true,msg:'Not using MET or dayTargets not populated'};
      var trainDays=0,totalKcal=0;
      for(var d=0;d<7;d++){
        totalKcal+=c.dayTargets[d].k||0;
        if(c.trainDays&&c.trainDays[d])trainDays++;
      }
      var avgTarget=Math.round(totalKcal/7);
      var diff=Math.abs(avgTarget-t.target);
      if(diff>15){
        return{ok:false,msg:'Weekly avg from dayTargets ('+avgTarget+') differs from t.target ('+t.target+') by '+diff,trainDays:trainDays};
      }
      return{ok:true,msg:'✓ Daily targets consistent: avg='+avgTarget+' kcal ('+trainDays+' training days)'};
    }
  },

  // Carb boost validation
  carbBoost:{
    name:'Carb Boost (Redistribution)',
    validate:function(c,t){
      if(!c.carbBoost||(c.carbBoost==null)||c.carbBoost===0)return{ok:true,msg:'Carb boost disabled or 0%'};
      if(!c.dayTargets||!c.dayTargets.length)return{ok:true,msg:'dayTargets not set'};
      // Check that training day carbs are higher
      var trainCarbTotal=0,restCarbTotal=0,trainCount=0,restCount=0;
      for(var d=0;d<7;d++){
        if(c.trainDays&&c.trainDays[d]){
          trainCarbTotal+=(c.dayTargets[d].c||0);trainCount++;
        } else {
          restCarbTotal+=(c.dayTargets[d].c||0);restCount++;
        }
      }
      if(trainCount>0&&restCount>0){
        var trainAvg=Math.round(trainCarbTotal/trainCount);
        var restAvg=Math.round(restCarbTotal/restCount);
        if(trainAvg<=restAvg){
          return{ok:false,msg:'Carb boost NOT applied: training days ('+trainAvg+'g avg) should > rest days ('+restAvg+'g avg)'};
        }
      }
      return{ok:true,msg:'✓ Carb boost working: training carbs > rest carbs'};
    }
  },

  // Energy Availability (RED-S) validation
  ea:{
    name:'Energy Availability (RED-S)',
    validate:function(c,t){
      if(!t.ea||t.ea===null)return{ok:true,msg:'EA not calculated'};
      if(t.ea<30)return{ok:false,msg:'🔴 CRITICAL: EA='+t.ea+' kcal/kgLBM (RED-S threshold <30)',severity:'alert'};
      if(t.ea<45)return{ok:false,msg:'🟡 WARNING: EA='+t.ea+' kcal/kgLBM (borderline, should be >45)',severity:'warn'};
      return{ok:true,msg:'✓ EA safe: '+t.ea+' kcal/kgLBM'};
    }
  }
};

// Master validation function
function validateAllCalculations(c){
  if(!c)return{status:'error',msg:'No client data'};
  var t=calcTDEE(c);
  var results={};
  var allOk=true;

  Object.keys(VALIDATION_RULES).forEach(function(key){
    var rule=VALIDATION_RULES[key];
    var result=rule.validate(c,t);
    results[key]={name:rule.name,result:result};
    if(!result.ok){allOk=false;}
  });

  return{status:allOk?'pass':'fail',results:results,t:t};
}

// Audit logging
function logValidation(c){
  var audit=validateAllCalculations(c);
  Object.keys(audit.results).forEach(function(key){
    var r=audit.results[key];
    var icon=r.result.ok?'✓':'✗';
    console.log(icon+' '+r.name+': '+r.result.msg);
  });
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('AUDIT STATUS: '+audit.status.toUpperCase());
  return audit;
}

/* ── Safe deep clone ──────────────────────────────────────────────────────────
   Replaces the deepClone(x) idiom, which throws a SyntaxError
   when x is undefined (e.g. a client/plan loaded from an old or partial record).
   On failure it logs and returns a safe empty value instead of crashing the app.
*/
/* ══════════════════════════════════════════════════════════════════════════════════
   ⚡ AUTO-RECALCULATION SYSTEM — Cascade recalculation when ANY client data changes
   ══════════════════════════════════════════════════════════════════════════════════ */

var _recalcTimeout=null;
var _recalcDebounceMs=300;  // Debounce rapid changes
var _lastRecalcChanges=null;  // Track what changed for notification

// ── Master: Called when ANY client data changes
function onClientChange(){
  clearTimeout(_recalcTimeout);
  _recalcTimeout=setTimeout(function(){
    var c=getC();if(!c)return;

    // Store old values for change detection
    var oldTDEE=c._lastTDEE;

    // STEP 1: Recalculate TDEE and macros
    recalculateMacros(c);

    // STEP 1.5: Validate all calculations (CRITICAL QA CHECK)
    if(c._enableValidationLogging===true){
      logValidation(c);  // Console audit log for debugging
    }

    // STEP 2: Update meal timing guide
    updateMealTimingGuide(c);

    // STEP 3: Check if plan regeneration needed
    if(c.weekPlan&&Object.keys(c.weekPlan).length>0){
      if(shouldRegeneratePlan(c)){
        showPlanRegenerationPrompt(c);
      }
    }

    // STEP 4: Update all UI sections
    renderMain();

    // STEP 5: Save to localStorage
    save();

    // STEP 6: Track changes and show notification
    _lastRecalcChanges={
      tdeeChanged:oldTDEE&&(c._lastTDEE!==oldTDEE),
      newTDEE:c._lastTDEE,
      oldTDEE:oldTDEE,
      sportChanged:c._lastSportApplied!==c.sport
    };
    showAutoRecalculationNotification(c);
  }, _recalcDebounceMs);
}

// ── CORE: Recalculate TDEE and all macro targets
function recalculateMacros(c){
  if(!c)return;

  // 1. Calculate TDEE
  var t=calcTDEE(c);

  // 2. Get sport macro ratios (or use custom presets)
  var sport=c.sport?SPORT_PROFILES[c.sport]:null;
  var p_pct=sport?sport.p:(c.macroP||25);
  var f_pct=sport?sport.f:(c.macroF||25);
  var c_pct=sport?sport.c:(c.macroC||50);

  // 3. Calculate daily targets with macros (including carb boost & MET per-day kcal)
  var dayTargets=makeDayTgtDefaults(c,t);

  // 4. Apply athletic boost (1.25x micronutrients if 3+ training days)
  var numTrainDays=(c.trainDays||[]).filter(function(x){return x;}).length;
  c.athleticBoost=numTrainDays>=3?1.25:1.0;

  // NOTE: Carb boost is ALREADY applied in makeDayTgtDefaults()
  // Do NOT re-apply it here to avoid double-counting

  // 5. Store updated targets and metadata
  c.dayTargets=dayTargets;
  c._lastTDEE=t.tdee;
  c._lastTarget=t.target;
  c._lastSportApplied=c.sport;
  c._lastRecalcTime=new Date().toISOString();
}

// ── Update meal timing based on current training activities
function updateMealTimingGuide(c){
  if(!c)return;
  // This is handled by getMealTimingGuide() which reads current activities
  // No persistent state needed here
}

// ── Check if plan needs regeneration
function shouldRegeneratePlan(c){
  if(!c||!c.weekPlan||!Object.keys(c.weekPlan).length)return false;

  // First time recalc or sport changed
  if(!c._lastRecalcTime)return false;  // First generation, don't ask again
  if(c._lastSportApplied!==c.sport)return true;

  // TDEE changed significantly (>100 kcal)
  var currentTDEE=calcTDEE(c).target;
  if(c._lastTarget&&Math.abs(currentTDEE-c._lastTarget)>100)return true;

  return false;
}

// ── Dialog: Ask user to regenerate plan
function showPlanRegenerationPrompt(c){
  var oldTDEE=c._lastTarget||0;
  var newTDEE=calcTDEE(c).target;
  var oldSport=c._lastSportApplied||'Προσαρμοσμένο';
  var newSport=c.sport?(SPORT_PROFILES[c.sport]?SPORT_PROFILES[c.sport].name:c.sport):'Προσαρμοσμένο';

  var msg='Τα στοιχεία του πελάτη άλλαξαν σημαντικά.\n\n'
    +'Παλιό TDEE: '+oldTDEE+' kcal\n'
    +'Νέο TDEE: '+newTDEE+' kcal (+'+Math.round(newTDEE-oldTDEE)+' kcal)\n\n'
    +'Παλιό Άθλημα: '+oldSport+'\n'
    +'Νέο Άθλημα: '+newSport+'\n\n'
    +'Θέλεις να αναδημιουργηθεί το πλάνο με τις νέες τιμές;';

  showConfirmDialog(msg, function(){
    c._lastRecalcTime=null;  // Reset recalc time so it doesn't ask again
    var errors=validateClientData(c);
    if(errors.length>0){ showValidationErrors(errors); return; }
    pregnancyBlockCheck(c, function(){
      var oldPlan = deepClone(c.weekPlan);
      if(window.undoRedoManager && typeof GeneratePlanCommand !== 'undefined'){
        var cmd = new GeneratePlanCommand(c, oldPlan);
        window.undoRedoManager.execute(cmd);
      } else {
        c.weekPlan={};  // Clear old plan
        genPlan();
      }
    });
  }, {icon:'🔄', confirmLabel:'Αναδημιουργία'});
}

// ── Notification: Show "auto-updated" badge + visual feedback
function showAutoRecalculationNotification(c){
  // Add subtle highlight to the main content area (flash effect)
  var main=document.getElementById('main');
  if(main){
    main.style.transition='background-color 0.3s ease';
    main.style.backgroundColor='#f0f9f7';
    setTimeout(function(){
      main.style.backgroundColor='transparent';
    }, 400);
  }

  // Also highlight the TDEE box to draw attention
  var tdeeBox=document.querySelector('.tdee-row');
  if(tdeeBox){
    tdeeBox.style.transition='border-color 0.3s ease, box-shadow 0.3s ease';
    var origBorder=tdeeBox.style.borderColor;
    var origShadow=tdeeBox.style.boxShadow;
    tdeeBox.style.borderColor='#4caf50';
    tdeeBox.style.boxShadow='0 0 8px rgba(76,175,80,0.3)';
    setTimeout(function(){
      tdeeBox.style.borderColor=origBorder||'';
      tdeeBox.style.boxShadow=origShadow||'';
    }, 600);
  }

  // Find or create notification element (ensure it exists in DOM)
  var notifContainer=document.getElementById('notifications-container');
  if(!notifContainer){
    notifContainer=document.createElement('div');
    notifContainer.id='notifications-container';
    notifContainer.style.cssText='position:fixed;top:20px;right:20px;z-index:5000;'
      +'pointer-events:none;max-width:320px';  // Allow clicks to pass through
    document.body.appendChild(notifContainer);
  }

  // Build notification message with details
  var changes=_lastRecalcChanges||{};
  var msg='<span style="font-size:14px;margin-right:8px">✓</span><span><strong>Ενημέρωση Ρυθμίσεων</strong>';

  if(changes.tdeeChanged){
    msg+='<br><span style="font-size:11px;color:#1b5e20;margin-top:4px;display:block">'
      +'TDEE: '+changes.oldTDEE+' → '+changes.newTDEE+' kcal'
      +'</span>';
  }
  if(changes.sportChanged){
    msg+='<br><span style="font-size:11px;color:#1b5e20;display:block">'
      +'Macros ενημερώθηκαν'
      +'</span>';
  }

  msg+='</span>';

  // Create individual notification
  var notif=document.createElement('div');
  notif.className='auto-calc-notif';
  notif.style.cssText='background:#e8f5e9;border:2px solid #4caf50;'
    +'padding:12px 14px;border-radius:8px;'
    +'box-shadow:0 4px 16px rgba(76,175,80,0.3);'
    +'font-size:12px;color:#1b5e20;font-weight:500;'
    +'margin-bottom:10px;'
    +'opacity:0;transform:translateX(400px) scale(0.9);'
    +'transition:all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);'
    +'pointer-events:auto;'
    +'cursor:pointer;'
    +'line-height:1.5';

  notif.innerHTML=msg;

  notifContainer.appendChild(notif);

  // Animate in
  setTimeout(function(){
    notif.style.opacity='1';
    notif.style.transform='translateX(0) scale(1)';
  }, 10);

  // Remove after delay
  var timer=setTimeout(function(){
    notif.style.opacity='0';
    notif.style.transform='translateX(400px) scale(0.9)';
    setTimeout(function(){
      notif.remove();
    }, 400);
  }, 3200);  // Slightly longer duration for readability

  // Allow click to dismiss early
  notif.onclick=function(){
    clearTimeout(timer);
    notif.style.opacity='0';
    notif.style.transform='translateX(400px) scale(0.9)';
    setTimeout(function(){
      notif.remove();
    }, 400);
  };
}


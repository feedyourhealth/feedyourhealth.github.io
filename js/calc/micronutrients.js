// js/calc/micronutrients.js
// Micronutrient adequacy analysis + gap-driven supplement matching + the Greek-text
// normaliser, extracted verbatim from js/app-part1.js (module split wave 33):
//   getFiberTarget, getDayMicronutrients, MICRONUTRIENT_KEY_MAP,
//   checkMicronutrientAdequacy, getWeekMicronutrients, detectMicronutrientGaps,
//   matchSupplementsToGaps, calculateOptimalDose, flagSupplementInteractions,
//   normalizeGreekText (accent-strip for food-name matching — used all over
//   plan-gen/* + appointments/* at runtime).
// Pure fn declarations + one literal map, zero load-time code. Depends on FOODS /
// MICRONUTRIENTS / SUPPS (data/*) + getMicronutrientTargets (calc/macros-recalc.js);
// loads right after calc/macros-recalc.js. Callers in app-part4.js, plan-gen/*,
// appointments/* are all runtime.

/* Fiber target (g/day) — DRI Adequate Intake by age & sex */
function getFiberTarget(age,sex){
  age=age||30;sex=sex||'M';
  if(age<4)return 19;
  if(age<9)return 25;
  if(age<14)return sex==='M'?31:26;
  if(age<19)return sex==='M'?38:26;
  if(sex==='M')return age<=50?38:30;
  return age<=50?25:21;
}

// ── Calculate micronutrient totals for a day ──────────────────────────────────
function getDayMicronutrients(meals){
  var result={Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0,VitD:0};
  (meals||[]).forEach(function(meal){
    (meal.foods||[]).forEach(function(food){
      var mn=MICRONUTRIENTS[resolveFood(food.n)];
      if(mn){
        result.Fe+=(mn.Fe||0)*food.g/100;
        result.Zn+=(mn.Zn||0)*food.g/100;
        result.Mg+=(mn.Mg||0)*food.g/100;
        result.Ca+=(mn.Ca||0)*food.g/100;
        result.B1+=(mn.B1||0)*food.g/100;
        result.B2+=(mn.B2||0)*food.g/100;
        result.B3+=(mn.B3||0)*food.g/100;
        result.B6+=(mn.B6||0)*food.g/100;
        result.B12+=(mn.B12||0)*food.g/100;
        result.Folate+=(mn.Folate||0)*food.g/100;
        result.Omega3+=(mn.Omega3||0)*food.g/100;
        result.Omega6+=(mn.Omega6||0)*food.g/100;
        result.Iodine+=(mn.Iodine||0)*food.g/100;
        result.Choline+=(mn.Choline||0)*food.g/100;
        result.DHA+=(mn.DHA||0)*food.g/100;
        result.VitD+=(mn.VitD||0)*food.g/100;
      }
    });
  });
  return result;
}

// Maps the short food-intake keys (Fe/Zn/Mg/Ca/... — used by MICRONUTRIENTS/getDayMicronutrients)
// to the full-name keys getMicronutrientTargets() actually returns (iron/zinc/magnesium/calcium/...).
// A plain key.toLowerCase() only happens to work for the B-vitamins/folate/omega/iodine/choline/dha
// (their abbreviation lowercased already equals their target key) — it silently fails for Fe/Zn/Mg/Ca,
// which caused those 4 to always fall back to an empty {} target and read as a fabricated 100%/"OK"
// regardless of real intake. See dietologist-pending-work memory, 2026-07-15.
var MICRONUTRIENT_KEY_MAP={
  Fe:'iron',Zn:'zinc',Mg:'magnesium',Ca:'calcium',
  B1:'b1',B2:'b2',B3:'b3',B6:'b6',B12:'b12',
  Folate:'folate',Omega3:'omega3',Omega6:'omega6',
  Iodine:'iodine',Choline:'choline',DHA:'dha',VitD:'vitaminD'
};

// ── Check micronutrient adequacy for the day ────────────────────────────────
function checkMicronutrientAdequacy(dayMN,targets,useAthletic){
  var result={};
  ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA','VitD'].forEach(function(key){
    var tgt=targets[MICRONUTRIENT_KEY_MAP[key]]||{};
    var target=useAthletic?tgt.athletic:tgt.target;
    var actual=dayMN[key]||0;
    var pct=target?Math.round(actual/target*100):100;
    result[key]={actual:actual,target:target,pct:pct,status:pct>=90?'ok':pct>=65?'low':'critical'};
  });
  return result;
}

// ✅ SMART MICRONUTRIENT GAP ANALYSIS - PART 1: WEEKLY ANALYZER
function getWeekMicronutrients(weekPlan){
  // INPUT: 7-day meal plan (weekPlan[0-6] each with meals)
  // OUTPUT: Weekly aggregate {Fe: 126, Ca: 8400, ...} and daily averages

  var weekTotals={Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0,VitD:0};
  var dailyAverage={};

  for(var d=0;d<7;d++){
    var dayMN=getDayMicronutrients(weekPlan[d]||[]); // Reuse existing function
    Object.keys(dayMN).forEach(function(nutrient){
      weekTotals[nutrient]+=dayMN[nutrient];
    });
  }

  // Calculate 7-day averages
  Object.keys(weekTotals).forEach(function(nutrient){
    dailyAverage[nutrient]=Math.round(weekTotals[nutrient]/7);
  });

  return {
    weekTotals: weekTotals,    // Sum across 7 days
    dailyAverage: dailyAverage // Average per day
  };
}

// ✅ SMART MICRONUTRIENT GAP ANALYSIS - PART 2: GAP DETECTOR
function detectMicronutrientGaps(weekAnalysis, c){
  // INPUT: weekAnalysis (from Part 1), client profile c
  // OUTPUT: Array of gaps with priority, deficiency level, recommended supplement

  var targets=getMicronutrientTargets(c); // Reuse existing (Line 1503)
  var isAthlete=c.trainDays&&c.trainDays.filter(function(x){return x;}).length>=3;

  var gaps=[]; // Array of {nutrient, target, actual, gap, percent, severity, recommendedDose}

  // Map micronutrient keys to target object keys
  var keyMap={'Fe':'iron','Zn':'zinc','Mg':'magn','Ca':'calcium','B1':'b1','B3':'b3','B6':'b6','B12':'b12','D3':'vit_d3','Omega3':'omega3','Folate':'folate'};

  Object.keys(targets).forEach(function(tgtKey){
    var tgt=targets[tgtKey];
    // Use science-based adjusted targets if available (vegan, altitude, sport-specific)
    var useTarget=tgt.adjusted||tgt.athletic||tgt.target;
    var mnKey=tgtKey.substring(0,1).toUpperCase()+tgtKey.substring(1); // Fe, Zn, etc.

    // Handle special keys
    if(tgtKey==='iron')mnKey='Fe';
    else if(tgtKey==='zinc')mnKey='Zn';
    else if(tgtKey==='magnesium')mnKey='Mg';
    else if(tgtKey==='calcium')mnKey='Ca';
    else if(tgtKey==='b1')mnKey='B1';
    else if(tgtKey==='b3')mnKey='B3';
    else if(tgtKey==='b6')mnKey='B6';
    else if(tgtKey==='b12')mnKey='B12';
    else if(tgtKey==='folate')mnKey='Folate';
    else if(tgtKey==='omega3')mnKey='Omega3';
    else if(tgtKey==='vitaminD')mnKey='VitD';
    else if(tgtKey==='vit_d3')mnKey='D3'; // dead: no target key is ever actually named 'vit_d3' (that's a SUPPS catalog id, not a targets key)
    // 'dha' would default to 'Dha' (only first letter capitalized) via the generic rule above,
    // which never matches the all-caps 'DHA' key weekTotals/dailyAverage actually use (see
    // weekTotals init a few lines up in getWeekMicronutrients) — so DHA intake always read as 0
    // regardless of real diet content, same bug class as the other explicit overrides here.
    else if(tgtKey==='dha')mnKey='DHA';

    var actual=weekAnalysis.dailyAverage[mnKey]||0;
    var pct=Math.round(actual/useTarget*100);

    if(pct<80){ // Gap threshold: <80% is a gap
      var severity=pct<50?'critical':pct<65?'low':'moderate';

      gaps.push({
        nutrient: tgt.label,           // e.g., "Iron (Fe)"
        key: mnKey,                    // e.g., "Fe" (for supplement matching)
        target: useTarget,             // Science-adjusted or athletic or base
        unit: tgt.unit,
        actual: Math.round(actual*10)/10,
        gap: Math.round((useTarget-actual)*10)/10,       // How much is missing
        percent: pct,                  // % of target achieved
        severity: severity,            // critical/low/moderate
        notes: tgt.notes,
        supplementRequired: tgt.supplementRequired // e.g., B12 for vegans
      });
    }
  });

  // Sort by severity (critical first)
  gaps.sort(function(a,b){
    var severity_order={'critical':0,'low':1,'moderate':2};
    return severity_order[a.severity]-severity_order[b.severity];
  });

  return gaps;
}

// ✅ SMART MICRONUTRIENT GAP ANALYSIS - PART 3: SUPPLEMENT MATCHER & DOSER
function matchSupplementsToGaps(gaps, supp_opts){
  // INPUT: gaps array (from Part 2), supplement options (SUPPS)
  // OUTPUT: Recommended supplements with dosages and interactions flagged

  var nutrient_to_supplement={
    'Fe': 'iron',
    'Zn': 'zinc',
    'Mg': 'magn',
    'Ca': 'calc',
    'B1': 'bcomplex',
    'B3': 'bcomplex',
    'B6': 'bcomplex',
    'B12': 'bcomplex',
    // detectMicronutrientGaps() always names this gap 'VitD' (see the vitaminD→VitD override
    // a few lines up in that function) — this key used to be 'D3', which never matched, so
    // Vitamin D deficiencies silently never got a supplement recommendation.
    'VitD': 'vit_d3',
    'Omega3': 'omega3',
    'Folate': 'multivit',
    // Iodine has no dedicated SUPPS entry — same 'multivit' catch-all already used for Folate above.
    'Iodine': 'multivit',
    // DHA is covered by the same fish-oil product as Omega3 (ALA) — 'omega3' already stocks EPA/DHA.
    'DHA': 'omega3'
  };

  var recommendations=[];

  gaps.forEach(function(gap){
    var supp_id=nutrient_to_supplement[gap.key];
    if(!supp_id)return; // No supplement available for this nutrient

    // Find supplement in SUPPS array
    var supp=null;
    for(var i=0;i<SUPPS.length;i++){
      if(SUPPS[i].id===supp_id){supp=SUPPS[i];break;}
    }
    if(!supp)return;

    // Calculate dosage based on gap size
    var dose=calculateOptimalDose(gap, supp);

    recommendations.push({
      supplement: supp.name,
      supplement_id: supp.id,
      nutrient: gap.nutrient,
      gap: gap.gap,
      unit: gap.unit,
      actual: gap.actual,
      target: gap.target,
      recommendedDose: dose,
      timing: supp.timing[0]||{t:'Με το πρωινό',d:dose},
      severity: gap.severity,
      reason: gap.gap.toFixed(1)+' '+gap.unit+' missing from diet'
    });
  });

  // Flag interactions (e.g., Zn and Ca shouldn't be at same time)
  flagSupplementInteractions(recommendations);

  return recommendations;
}

function calculateOptimalDose(gap, supplement){
  // BASE DOSE: designed to fill 50-70% of gap
  var fillPercent=0.65;
  var optimalDose=Math.round(gap.gap*fillPercent);

  // CLAMP to safe ranges per nutrient
  var safe_ranges={
    'iron': {min:8,max:45},
    'zinc': {min:8,max:40},
    'magn': {min:200,max:420},
    'calc': {min:1000,max:2000},
    // mcg, not IU — gap.gap/gap.unit for Vitamin D are mcg-scale (NUTRIENT_UNITS.vitaminD),
    // matching the SUPPS 'vit_d3' generic label of "1000-4000 IU" (1 mcg = 40 IU: 25-100mcg).
    // Was previously {min:1000,max:4000} in IU, which — mixed with an mcg-scale gap — meant
    // every Vitamin D recommendation clamped to a mislabeled "1000 mcg" (≈40,000 IU, well
    // past the safe upper limit).
    'vit_d3': {min:25,max:100},
    'omega3': {min:500,max:3000},
    'bcomplex': {min:1,max:100},
    'multivit': {min:1,max:2}
  };

  if(safe_ranges[supplement.id]){
    var range=safe_ranges[supplement.id];
    optimalDose=Math.max(range.min, Math.min(range.max, optimalDose));
  }

  return optimalDose;
}

function flagSupplementInteractions(recommendations){
  // Flag known interactions
  var interactions={
    'zinc': ['calc','iron'],
    'calc': ['zinc','iron'],
    'iron': ['calc','zinc','magn']
  };

  recommendations.forEach(function(rec){
    rec.interactions=[];
    if(interactions[rec.supplement_id]){
      var conflicting=[];
      for(var i=0;i<recommendations.length;i++){
        var r=recommendations[i];
        if(r.supplement_id!==rec.supplement_id){
          for(var j=0;j<interactions[rec.supplement_id].length;j++){
            if(interactions[rec.supplement_id][j]===r.supplement_id){
              conflicting.push(r.supplement);
              break;
            }
          }
        }
      }
      if(conflicting.length>0){
        rec.interactions=conflicting;
        rec.timing_note='Take at different times (2+ hours apart)';
      }
    }
  });
}


// NORMALIZE GREEK TEXT: Remove accents/diacritics for food exclusion matching
// This ensures "Αυγά" matches "αυγών" by removing accent differences
function normalizeGreekText(text) {
  if (!text) return '';

  // Greek accent/diacritic mappings
  var accentMap = {
    'ά': 'α', 'έ': 'ε', 'ή': 'η', 'ί': 'ι', 'ό': 'ο', 'ύ': 'υ', 'ώ': 'ω',
    'Ά': 'Α', 'Έ': 'Ε', 'Ή': 'Η', 'Ί': 'Ι', 'Ό': 'Ο', 'Ύ': 'Υ', 'Ώ': 'Ω',
    'ΐ': 'ι', 'ΰ': 'υ', 'ϊ': 'ι', 'ϋ': 'υ'
  };

  var normalized = text.toLowerCase();
  for (var accented in accentMap) {
    normalized = normalized.replace(new RegExp(accented, 'g'), accentMap[accented]);
  }
  return normalized;
}


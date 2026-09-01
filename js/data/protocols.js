// js/data/protocols.js
// Split out of js/data.js (module split wave 1). Pure data, no logic.
// Contents: MACRO_PRESETS, DEFAULT_MACRO_PRESET_BY_GOAL, SPORT_PROFILES, MEAL_TIMING_PROFILES, NUTRIENT_UNITS, SPORT_PROTOCOLS

var MACRO_PRESETS={
  balanced:{label:'Ισορροπημένο',p:25,f:25,c:50,icon:'⚖️'},
  strength:{label:'Δύναμη / Μυϊκή',p:30,f:25,c:45,icon:'🏋️'},
  endurance:{label:'Αντοχή',p:20,f:25,c:55,icon:'🏃'},
  loss:{label:'Απώλεια λίπους',p:35,f:30,c:35,icon:'🔥'},
  martial:{label:'Πολεμικές τέχνες',p:30,f:25,c:45,icon:'🥊'},
  mediterranean:{label:'Μεσογειακή (30/30/40)',p:30,f:30,c:40,icon:'🫒'},
  custom:{label:'Προσαρμοσμένο',p:25,f:25,c:50,icon:'✏️'}
};
// Sensible starting preset per goalMain — applied by applyGoalMacros() only as a first-time
// default (never overrides a preset the dietitian already picked deliberately for this client).
var DEFAULT_MACRO_PRESET_BY_GOAL={loss:'loss',mild:'loss',maintain:'balanced',gain:'strength',running:'endurance'};
var SPORT_PROFILES={
  bjj:{name:'Brazilian Jiu Jitsu',p:32,f:24,c:44,icon:'🥋',notes:'High protein for explosive power & recovery. Moderate carbs for training endurance.',isMET:true},
  boxing:{name:'Boxing',p:30,f:24,c:46,icon:'🥊',notes:'High protein for power. Strategic carbs for rounds & recovery between sparring.',isMET:true},
  mma:{name:'Mixed Martial Arts',p:32,f:23,c:45,icon:'🤼',notes:'Maximum protein (strength + cardio combo). Balanced carbs for both power & endurance.',isMET:true},
  judo:{name:'Judo',p:32,f:24,c:44,icon:'🥋',notes:'High protein for explosive grappling power & recovery. Weight-category sport — monitor cutting closely (see SPORT_PROTOCOLS.judo).',isMET:true},
  football:{name:'Ποδόσφαιρο',p:26,f:25,c:49,icon:'⚽',notes:'Balanced macro for mixed sport (speed, power, endurance). High carbs for match intensity.',isMET:true},
  basketball:{name:'Μπάσκετ',p:27,f:25,c:48,icon:'🏀',notes:'Moderate protein. Higher carbs for explosive jumps & court sprints.',isMET:true},
  weightlifting:{name:'Weightlifting',p:32,f:26,c:42,icon:'🏋️',notes:'Maximum protein for strength gains. Moderate carbs to preserve glycogen.',isMET:true},
  cycling:{name:'Ποδηλασία',p:18,f:24,c:58,icon:'🚴',notes:'Very high carbs for endurance. Lower protein (endurance sport). Focus on glycogen.',isMET:true},
  running:{name:'Τρέξιμο',p:16,f:23,c:61,icon:'🏃',notes:'Highest carbs for glycogen stores. Lower protein (endurance-focused). Recovery meals critical.',isMET:true},
  swimming:{name:'Κολύμβηση',p:24,f:24,c:52,icon:'🏊',notes:'High carbs (full-body endurance). Adequate protein for shoulder/arm recovery.',isMET:true},
  crossfit:{name:'CrossFit',p:31,f:25,c:44,icon:'⚡',notes:'High protein (power + metabolic). Moderate carbs (mixed intensity WODs).',isMET:true},
  custom:{name:'Προσαρμοσμένο (χωρίς MET)',p:25,f:25,c:50,icon:'✏️',notes:'Custom macros without MET activity tracking.',isMET:false}
};
var MEAL_TIMING_PROFILES={
  'pre-workout':{
    label:'Pre-workout (2h πριν)',icon:'⚡',
    p:15,f:10,c:75,notes:'High carbs (simple), moderate protein, minimal fat/fiber for fast digestion',
    desc:'2 hours before training — maximize glycogen, minimize GI distress'
  },
  'during-training':{
    label:'During training (>60min)',icon:'🔥',
    p:5,f:5,c:90,notes:'Simple carbs only — fast glucose for continuous energy',
    desc:'During long training sessions >60min — fast carbs (sports drink, gels)'
  },
  'post-workout':{
    label:'Post-workout (0-30min)',icon:'💪',
    p:35,f:8,c:57,notes:'Fast protein + fast carbs for MPS & glycogen, minimal fat',
    desc:'Immediately post-training — maximize muscle protein synthesis window'
  },
  'recovery':{
    label:'Recovery (2h+ post)',icon:'🛌',
    p:25,f:28,c:47,notes:'Balanced nutrition with healthy fats for sustained recovery',
    desc:'2+ hours post-training — complete meal with all nutrients'
  },
  'regular':{
    label:'Regular meal',icon:'🍽️',
    p:25,f:28,c:47,notes:'Balanced macros for standard daily nutrition',
    desc:'No specific timing constraint — standard balanced meal'
  },
  'rest-day':{
    label:'Rest day',icon:'😴',
    p:25,f:28,c:47,notes:'Slightly lower carbs, focus on recovery & micronutrients',
    desc:'Rest/low activity day — focus on nutrient density'
  }
};

// Single source of truth for "which unit does nutrient X use" — referenced by
// SPORT_PROTOCOLS.*.criticalMicronutrients below and by getMicronutrientTargets()
// (js/app-part1.js), so a unit can't silently drift between the two tables again
// (see dietologist-pending-work memory, 2026-07-15 IU/vitamin-D audit).
var NUTRIENT_UNITS={
  iron:'mg',zinc:'mg',magnesium:'mg',calcium:'mg',sodium:'mg',potassium:'mg',
  copper:'µg',selenium:'µg',vitaminD:'mcg',
  b1:'mg',b2:'mg',b3:'mg NE',b6:'mg',b12:'mcg',
  folate:'mcg',omega3:'g',omega6:'g',
  iodine:'mcg',choline:'mg',dha:'mg'
};

var SPORT_PROTOCOLS={
  running:{
    name:'Δρομείς (Τρέξιμο)',category:'Endurance',
    macros:{p:14,f:22,c:64},
    criticalMicronutrients:{
      iron:{target:27,unit:NUTRIENT_UNITS.iron,priority:'CRITICAL',notes:'O2 transport for endurance'},
      calcium:{target:1150,unit:NUTRIENT_UNITS.calcium,priority:'CRITICAL',notes:'Bone density protection'},
      magnesium:{target:365,unit:NUTRIENT_UNITS.magnesium,priority:'CRITICAL',notes:'Muscle function, energy metabolism'},
      vitaminD:{target:37.5,unit:NUTRIENT_UNITS.vitaminD,priority:'HIGH',notes:'Many athletes deficient'}, // 1500 IU ÷ 40
      potassium:{target:3500,unit:NUTRIENT_UNITS.potassium,priority:'HIGH',notes:'Electrolyte balance'}
    },
    recommendedSupplements:[
      {id:'iron',required:false,condition:'if serum ferritin <30µg/L women, <50µg/L men'},
      {id:'vit_d3',required:false,condition:'if deficient'},
      {id:'magn',required:false,condition:'if deficient'}
    ],
    redSAlert:{risk:'Moderate',minCalories:50,details:'Monitor irregular periods (F), hormonal issues, frequent injuries'},
    hydration:{daily:35,training:40,duringEx:'400-800ml/hr',postEx:'150% weight loss / 4hr'},
    hydrationEl:{duringEx:'400-800ml/ώρα',postEx:'150% της απώλειας βάρους / 4 ώρες'},
    mealTiming:{
      preExercise:'2-3hrs before: 1-4g/kg CHO, 0.3-0.5g/kg PRO, <1g/kg FAT',
      duringExercise:'>90min: 30-60g CHO/hr + 500-700mg Na+',
      postExercise:'0-30min: 0.8-1.2g/kg CHO, 0.2-0.4g/kg PRO, 3:1 ratio'
    }
  },
  football:{
    name:'Ποδόσφαιρο (Football/Soccer)',category:'Intermittent High-Intensity',
    macros:{p:18,f:22,c:60},
    criticalMicronutrients:{
      iron:{target:20,unit:NUTRIENT_UNITS.iron,priority:'CRITICAL',notes:'O2 transport for repeated sprints'},
      calcium:{target:1150,unit:NUTRIENT_UNITS.calcium,priority:'CRITICAL',notes:'Bone health (frequent jumping/impact)'},
      magnesium:{target:365,unit:NUTRIENT_UNITS.magnesium,priority:'CRITICAL',notes:'Muscle cramps, energy metabolism'},
      sodium:{target:2000,unit:NUTRIENT_UNITS.sodium,priority:'HIGH',notes:'during match: +500-700mg/hr'},
      potassium:{target:3500,unit:NUTRIENT_UNITS.potassium,priority:'HIGH',notes:'Electrolyte balance'},
      zinc:{target:11,unit:NUTRIENT_UNITS.zinc,priority:'HIGH',notes:'Immune function'}
    },
    recommendedSupplements:[
      {id:'creatine',required:true,dose:'3-5g/day',protocol:'Loading: 5-7g/day×5-7d, then 3-5g/day'},
      {id:'caffeine',required:false,dose:'3-6mg/kg',timing:'60min before match'},
      {id:'b_alanine',required:false,dose:'3-5g/day',protocol:'4-6 weeks loading'},
      {id:'iron',required:false,condition:'if deficient'},
      {id:'vit_d3',required:false,condition:'if deficient'}
    ],
    redSAlert:{risk:'Moderate',minCalories:50,details:'Monitor hormonal health, energy levels'},
    hydration:{daily:35,training:40,beforeMatch:'400-600ml (2-3hrs before)',duringMatch:'150-250ml every 15-20min (6-8% CHO)',postMatch:'150% weight loss / 4-6hrs'},
    hydrationEl:{beforeMatch:'400-600ml (2-3 ώρες πριν)',duringMatch:'150-250ml κάθε 15-20 λεπτά (6-8% υδατ.)',postMatch:'150% της απώλειας βάρους / 4-6 ώρες'},
    mealTiming:{
      matchDay:'3-4hrs before: 1-4g/kg CHO, 0.3-0.5g/kg PRO',
      oneHourBefore:'50-100g CHO (banana, toast with honey)',
      halfTime:'15-30g CHO + electrolytes',
      postMatch:'0-30min: 1-1.2g/kg CHO, 0.3-0.4g/kg PRO, 3:1 ratio'
    }
  },
  judo:{
    name:'Judo (Combat Sport)',category:'Combat - Weight Categories',
    macros:{p:20,f:22,c:58},
    criticalMicronutrients:{
      iron:{target:22,unit:NUTRIENT_UNITS.iron,priority:'CRITICAL',notes:'⚠️ HIGHEST RISK during weight cutting'},
      calcium:{target:1300,unit:NUTRIENT_UNITS.calcium,priority:'CRITICAL',notes:'Bone health, weight cycling risk'},
      magnesium:{target:420,unit:NUTRIENT_UNITS.magnesium,priority:'CRITICAL',notes:'Cramp prevention during weight cut'},
      sodium:{target:2000,unit:NUTRIENT_UNITS.sodium,priority:'CRITICAL',notes:'Weight loss → significant depletion'},
      potassium:{target:3500,unit:NUTRIENT_UNITS.potassium,priority:'HIGH',notes:'Electrolyte balance'},
      zinc:{target:11,unit:NUTRIENT_UNITS.zinc,priority:'HIGH',notes:'Elevated due to stress + weight loss'},
      copper:{target:900,unit:NUTRIENT_UNITS.copper,priority:'HIGH',notes:'Connective tissue (high injury risk)'},
      vitaminD:{target:42.5,unit:NUTRIENT_UNITS.vitaminD,priority:'HIGH',notes:'May need higher'}, // 1700 IU ÷ 40
      selenium:{target:55,unit:NUTRIENT_UNITS.selenium,priority:'HIGH',notes:'Antioxidant, immune function'}
    },
    recommendedSupplements:[
      {id:'creatine',required:true,dose:'3-5g/day',notes:'Improves strength + power'},
      {id:'caffeine',required:true,dose:'3-6mg/kg',timing:'60min before competition'},
      {id:'iron',required:true,condition:'if serum ferritin <30µg/L women, <50µg/L men'},
      {id:'calc',required:false,condition:'if dietary intake <1000mg/day'},
      {id:'vit_d3',required:false,condition:'if deficient (likely in weight-cutters)'},
      {id:'b_alanine',required:false,dose:'3-5g/day',protocol:'4-6 weeks loading'}
    ],
    redSAlert:{risk:'VERY HIGH',minCalories:55,details:'⚠️ WEIGHT CYCLING HIGH RISK - Monitor irregular periods (F), low testosterone (M), frequent injuries, persistent fatigue, poor concentration'},
    hydration:{daily:35,training:45,duringTraining:'150-250ml every 15-20min',postTraining:'150% weight loss'},
    hydrationEl:{duringTraining:'150-250ml κάθε 15-20 λεπτά',postTraining:'150% της απώλειας βάρους'},
    safeWeightLoss:{
      warning:'⚠️ CRITICAL: Modern safe approach = 0.5-1% per WEEK MAX (NOT 5-10%)',
      normal5to7DaysBefore:'Normal intake, pale urine hydration, normal sodium 1500-2300mg',
      gradualLoss2to3DaysBefore:'0.5-1% body weight per day MAX, 300-500kcal deficit (mostly CHO), MAINTAIN Protein 1.8-2.0g/kg, light technical training only',
      final24Hours:'Minimal loss only: light fluid restriction (2-4hrs before weigh-in), small familiar foods',
      postWeiginCritical:'REHYDRATE: 150% of weight lost over 4-6 hours, Carbs 1.0-1.2g/kg, Protein 0.3-0.4g/kg, Sodium 500-700mg'
    },
    mealTiming:{
      preTraining:'2-3hrs before: 1.5-3.0g/kg CHO, 0.25-0.5g/kg PRO, <1g/kg FAT',
      postTraining:'0-30min: 1.0-1.2g/kg CHO, 0.25-0.4g/kg PRO, 3:1 ratio, +500-700mg Na+'
    }
  }
};
// ✅ Iodine (μg)/Choline (mg)/DHA (mg) προστέθηκαν ανά 100g σε κάθε τρόφιμο παρακάτω (εγκυμοσύνη pass).
// DHA είναι ξεχωριστό από το γενικό Omega3 (Omega3 εδώ = συνολικό, κυρίως ALA σε φυτικά — η μετατροπή
// ALA→DHA είναι ανεπαρκής, γι' αυτό DHA είναι ουσιαστικά μόνο σε ψάρια/θαλασσινά/αυγά, ΟΧΙ σε καρύδια/chia).
// Salmon DHA + tuna/salmon iodine επιβεβαιώθηκαν μέσω USDA/ARS iodine database + ODS-NIH DHA data (verification
// pass). Οι υπόλοιπες τιμές είναι σύμφωνες με τυπικά πρότυπα σύστασης τροφίμων (πχ. αυγό=υψηλή χολίνη,
// γαλακτοκομικά=μέτριο ιώδιο, φυτικά=~0 ιώδιο/DHA) στο ίδιο επίπεδο τεκμηρίωσης με τα υπόλοιπα 9 θρεπτικά
// του πίνακα (ένα γενικό "USDA per 100g", όχι citation ανά κελί) — δεν έχουν όλες επαληθευτεί μεμονωμένα.
// ✅ VitD (mcg per 100g) προστέθηκε 2026-07-15 μόνο στα τρόφιμα με ουσιαστική, καλά τεκμηριωμένη
// περιεκτικότητα (λιπαρά ψάρια, αυγό, βούτυρο, μανιτάρια — USDA FoodData Central τυπικές τιμές).
// Τρόφιμα χωρίς το πεδίο VitD θεωρούνται 0 (ίδια σύμβαση με τα υπόλοιπα πεδία — βλ. getDayMicronutrients'
// (mn.VitD||0)). Ελληνικά γαλακτοκομικά ΔΕΝ θεωρήθηκαν πηγή — δεν εμπλουτίζονται εκ των προτέρων όπως
// στις ΗΠΑ, οπότε η φυσική περιεκτικότητα είναι αμελητέα εκτός αν αναφέρεται ρητά "εμπλουτισμένο".

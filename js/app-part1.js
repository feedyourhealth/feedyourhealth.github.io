// Global HTML-escape helper — sanitizes user input (client names, notes, etc.)
// before it is injected into innerHTML. Prevents broken markup / XSS.
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
var DAYS=['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ PHASE 1: FOOD PAIRING DATABASE — Chef-Inspired Meal Combinations
// ═══════════════════════════════════════════════════════════════════════════════
// Each food has: flavor_profile, best_pairings, avoid_with, texture, aromatic_herbs, category
// Based on culinary science (shared aromatic compounds) + user feedback

// ── ΕΠΕΚΤΑΣΗ PAIRING DB: κλειδιά ΑΚΡΙΒΩΣ όπως στο FOODS ──────────────────────
// Διπλασιάζει την κάλυψη ώστε η μηχανή συνδυασμού να έχει υλικό για κάθε τρόφιμο.
// Συγχώνευση επέκτασης στη βασική βάση (χωρίς να πειραχτεί η αρχική)
for(var __fpk in FOOD_PAIRING_EXT){ if(FOOD_PAIRING_EXT.hasOwnProperty(__fpk)){ FOOD_PAIRING_DB[__fpk]=FOOD_PAIRING_EXT[__fpk]; } }

// ── ΣΑΛΤΣΕΣ & ΦΙΝΙΡΙΣΜΑ ανά κατηγορία πρωτεΐνης ──────────────────────────────
// Κάθε καταχώρηση = {n: όνομα τροφίμου στο FOODS, g: γραμμάρια}. Επιλέγεται
// μία σάλτσα ώστε το πιάτο να μην βγαίνει «γυμνό».
// Αντιστοίχιση ονόματος βοτάνου (όπως γράφεται στα aromatic_herbs) → τρόφιμο FOODS

// Category scaling caps: foods in these categories scale with limits
// Proteins/Carbs/FYH recipes = no cap (scale fully)

// ✅ BREAKFAST CONSTRAINTS: Approved proteins & foods for morning meals
// Mediterranean breakfast should be light & nutritious, not heavy meats

// ── Food Exclusion: quick groups & substitution order ────────────────────────
// Fallback substitution order per category (most similar first)

// ── Practical units ───────────────────────────────────────────────────────────
// Maps food name → { g: grams per 1 unit, u: unit label shown to client }
// Add any food here to display it in the plan as units instead of grams.

// Τρόφιμα που ο πελάτης τρώει ΑΚΕΡΑΙΑ — δεν έχει νόημα «2.3 αυγό» ή «1.2 φέτα ψωμί».
// Για αυτά, τα γραμμάρια «κουμπώνουν» (snap) στο πλησιέστερο ακέραιο τεμάχιο κατά τη
// δημιουργία πλάνου (scalePlan) και εμφανίζονται ως ακέραιος αριθμός παντού.
// (Αυγά, ψωμί/φέτες/φρυγανιές/πίτες, φρούτα ανά τεμάχιο — ΟΧΙ μπιφτέκια/τορτίγια/τυριά σε φέτες.)

// Επιστρέφει γραμμάρια «κουμπωμένα» σε ακέραιο τεμάχιο για τα WHOLE_UNIT_FOODS
// (π.χ. 127g αυγό → 110g = 2 τεμ.). Για τα υπόλοιπα τρόφιμα επιστρέφει g ως έχει.
function snapWholeG(n,g){
  if(!WHOLE_UNIT_FOODS[n])return g;
  var u=FOOD_UNITS[n];
  if(!u||!u.g)return g;
  var units=Math.round(g/u.g);
  if(units<1)units=1;
  return Math.round(units*u.g);
}

// Συντακτικά σωστός πληθυντικός μονάδας: «2 φέτα» → «2 φέτες».
// Πληθυντικός όταν count ≥ 2 (το 1, ½, 1½ μένουν ενικός: «μιάμιση φέτα»).
// Καλύπτει ελληνικά + αγγλικά· οι συντομογραφίες (τεμ., φλ., κ.σ., μερίδ.) μένουν ως έχουν.
function pluralUnit(label, count){
  return (count>=2 && UNIT_PLURALS[label]) ? UNIT_PLURALS[label] : label;
}

// Single source of truth for how a food's quantity is shown in printed outputs
// (PDF + Word). Mirrors the on-screen editor so all three views agree.
// Honors the per-food unit toggle (food.u==='g' forces grams).
// Returns {main, sub}: main = headline (e.g. "1½ τεμ." or "120γρ."), sub = "(120γρ.)".
function fmtFoodQty(food, gLabel, tuFn){
  gLabel = gLabel || 'γρ.';
  tuFn = tuFn || function(u){return u;};
  var fu = FOOD_UNITS[food.n];
  // Show grams when the food has no unit, or the user toggled it to grams.
  if(!fu || food.u === 'g') return {main: food.g + gLabel, sub: ''};
  // Ακέραια τρόφιμα (αυγά/ψωμί/φρούτα): πάντα ακέραιος αριθμός τεμαχίων.
  if(WHOLE_UNIT_FOODS[food.n]){
    var wholeN = Math.max(1, Math.round(food.g / fu.g));
    return {main: wholeN + ' ' + pluralUnit(tuFn(fu.u), wholeN), sub: '(' + food.g + gLabel + ')'};
  }
  var r = Math.round(food.g / fu.g * 4) / 4;   // nearest quarter unit
  var w = Math.floor(r), fr = r - w, str = w > 0 ? '' + w : '';
  if(Math.abs(fr-0.25)<0.01) str += '¼';
  else if(Math.abs(fr-0.5)<0.01) str += '½';
  else if(Math.abs(fr-0.75)<0.01) str += '¾';
  if(!str) str = '<¼';                          // smaller than a quarter unit
  return {main: str + ' ' + pluralUnit(tuFn(fu.u), r), sub: '(' + food.g + gLabel + ')'};
}

// Cooked/boiled → raw/dry conversion for shopping list
// factor: multiply plan grams by this to get raw grams to purchase
// Meats (ψητό/μαγ.): cooked loses ~25-30% weight → buy more
// Grains (βρ.): boiled triples in weight → buy less (raw)
// Legumes (βρ.): boiled doubles in weight → buy less (dry)


// ── MET Activities (2011 Compendium of Physical Activities) ──────────────────
// Formula: kcal/min = MET × 3.5 × weight(kg) / 200


// ── Macro Presets ─────────────────────────────────────────────────────────────

// ── Sport-Specific Macro Profiles ──────────────────────────────────────────────
// isMET flag: true = conditional visibility shows MET section, false = shows Activity Factor section

// ── PHASE 2: Meal Timing Profiles ──────────────────────────────────────────────
// Nutritional optimization for different meal purposes relative to training

// ── ΕΓΚΥΜΟΣΥΝΗ: τρίμηνο υπολογίζεται πάντα από την εβδομάδα κύησης (όχι ξεχωριστό πεδίο) ──
// ώστε να μην μπορούν να διαφωνήσουν δύο χειροκίνητα πεδία μεταξύ τους.
function getPregTrimester(week){
  if(!week || week<1) return null;
  if(week<=13) return 1;
  if(week<=27) return 2;
  return 3;
}
function getPregTrimesterLabel(week){
  var t=getPregTrimester(week);
  if(!t) return '';
  return ['','(Α\' τρίμηνο)','(Β\' τρίμηνο)','(Γ\' τρίμηνο)'][t];
}

// IOM 2009 εύρος συνολικής αύξησης βάρους κύησης ανά κατηγορία ΔΜΣ προ εγκυμοσύνης (verified, βλ. memory).
function getIOMWeightGainRange(prePregBMI){
  if(prePregBMI<18.5) return {min:12.5,max:18,label:'Λιποβαρής'};
  if(prePregBMI<25) return {min:11.5,max:16,label:'Φυσιολογικός'};
  if(prePregBMI<30) return {min:7,max:11.5,label:'Υπέρβαρη'};
  return {min:5,max:9.1,label:'Παχύσαρκη'};
}
// Σύγκριση πραγματικής αύξησης βάρους με το εύρος IOM — διαφορετική λογική από το γενικό weight-trend
// (goalMain loss/gain), εδώ ο "στόχος" είναι ένα εύρος, όχι κατεύθυνση. Το "below" είναι σκόπιμα συντηρητικό
// (μόνο κοντά στον τοκετό, με γενναίο περιθώριο) γιατί δεν έχουμε επιβεβαιωμένο εβδομαδιαίο ρυθμό-στόχο ανά ΔΜΣ,
// μόνο το συνολικό εύρος — δεν προσποιούμαστε ακρίβεια που δεν έχουμε τεκμηριώσει.
function checkGestationalWeightGain(c){
  if(!c || !c.pregnant || !(c.prePregnancyWeight>0) || !(c.height>0)) return null;
  var wl=(c.weightLog||[]).slice().sort(function(a,b){return a.date<b.date?-1:1;});
  if(!wl.length) return null;
  var latest=wl[wl.length-1];
  var gained=+(latest.weight-c.prePregnancyWeight).toFixed(1);
  var bmi=c.prePregnancyWeight/((c.height/100)*(c.height/100));
  var range=getIOMWeightGainRange(bmi);
  var week=c.gestationalWeek||null;
  var status='ontrack';
  if(gained>range.max) status='above';
  else if(week>=36 && gained<range.min*0.7) status='below';
  return {gained:gained, range:range, bmi:+bmi.toFixed(1), week:week, status:status};
}

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

  // ═════ SPORT-SPECIFIC BOOSTS (based on oxidative stress & demands) ═════
  var sportBoost={iron:1.0,zinc:1.0,magnesium:1.0,b_vitamins:1.0};

  if(sport){
    // ENDURANCE (Running, Cycling, Swimming, Triathlon)
    if(sport.includes('Τρέξιμο')||sport.includes('Ποδηλασία')||sport.includes('Κολύμβηση')){
      sportBoost.iron=1.50; // +50%: increased oxidative stress, sweat losses
      sportBoost.magnesium=1.25; // +25%: muscle fatigue, 56.8% endurance athletes deficient
      sportBoost.b_vitamins=1.20; // +20%: energy metabolism demands
    }
    // STRENGTH/POWER (Weightlifting, Powerlifting, Gymnastics)
    else if(sport.includes('Weightlifting')||sport.includes('Powerlifting')||sport.includes('Γυμναστική')){
      sportBoost.zinc=1.25; // +25%: protein synthesis, muscle growth
      sportBoost.magnesium=1.25; // +25%: muscle contraction, 300+ enzymatic reactions
    }
    // COMBAT SPORTS (MMA, Boxing, Wrestling, BJJ)
    else if(sport.includes('MMA')||sport.includes('Boxing')||sport.includes('Wrestling')||sport.includes('Jiu Jitsu')){
      sportBoost.iron=1.75; // +75%: extreme oxidative stress + frequent weight cuts
      sportBoost.magnesium=1.50; // +50%: muscle cramps prevention, sweat losses
      sportBoost.zinc=1.50; // +50%: immune support (high injury risk), CO2 removal
    }
    // TEAM SPORTS (Soccer, Basketball, Volleyball)
    else if(sport.includes('Ποδόσφαιρο')||sport.includes('Μπάσκετ')||sport.includes('Volley')){
      sportBoost.iron=1.40; // +40%: high intensity intervals
      sportBoost.magnesium=1.30; // +30%: muscle fatigue
    }
    // MIXED TRAINING (CrossFit, functional fitness)
    else if(sport.includes('CrossFit')||sport.includes('functional')){
      sportBoost.iron=1.50;
      sportBoost.magnesium=1.40;
      sportBoost.zinc=1.25;
    }
  }

  // ═════ DIET-TYPE ADJUSTMENTS (bioavailability & deficiency risks) ═════
  var dietBoost={iron:1.0,zinc:1.0,b12:1.0,calcium:1.0,folate:1.0};

  if(dietType){
    // VEGAN: Lower bioavailability of Fe/Zn, NO natural B12
    if(dietType.includes('Веγανι')||dietType.includes('vegan')){
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

  var finalIron=Math.round(baseIron*athleteBoost*sportBoost.iron*dietBoost.iron*envBoost.iron);
  var finalZinc=Math.round(baseZinc*athleteBoost*sportBoost.zinc*dietBoost.zinc);
  var finalMag=Math.round(baseMag*athleteBoost*sportBoost.magnesium*dietBoost.iron);
  var finalCa=Math.round(baseCa*athleteBoost*dietBoost.calcium);
  var finalB12=baseB12*athleteBoost*dietBoost.b12;

  return{
    iron:{
      target:baseIron,
      unit:'mg',label:'Iron (Fe)',
      notes:sex==='M'?'Adult male':age<51?'Menstruating female':'Postmenopausal',
      athletic:Math.round(baseIron*athleteBoost),
      adjusted:finalIron
    },
    zinc:{
      target:baseZinc,
      unit:'mg',label:'Zinc (Zn)',
      notes:sex==='M'?'Adult male':'Adult female',
      athletic:Math.round(baseZinc*athleteBoost),
      adjusted:finalZinc
    },
    magnesium:{
      target:baseMag,
      unit:'mg',label:'Magnesium (Mg)',
      notes:'Essential for muscle function & recovery',
      athletic:Math.round(baseMag*athleteBoost),
      adjusted:finalMag
    },
    calcium:{
      target:baseCa,
      unit:'mg',label:'Calcium (Ca)',
      notes:'Bone health & muscle function',
      athletic:Math.round(baseCa*athleteBoost),
      adjusted:finalCa
    },
    b1:{
      target:sex==='M'?1.2:1.1,
      unit:'mg',label:'B1 (Thiamine)',
      notes:'Energy metabolism',
      athletic:Math.round((sex==='M'?1.2:1.1)*athleteBoost*sportBoost.b_vitamins*100)/100
    },
    b2:{
      target:sex==='M'?1.3:1.1,
      unit:'mg',label:'B2 (Riboflavin)',
      notes:'Energy & antioxidant support',
      athletic:Math.round((sex==='M'?1.3:1.1)*athleteBoost*sportBoost.b_vitamins*100)/100
    },
    b3:{
      target:sex==='M'?16:14,
      unit:'mg NE',label:'B3 (Niacin)',
      notes:'Energy metabolism',
      athletic:Math.round((sex==='M'?16:14)*athleteBoost*sportBoost.b_vitamins)
    },
    b6:{
      target:sex==='M'?1.3:1.3,
      unit:'mg',label:'B6 (Pyridoxine)',
      notes:'Protein metabolism & immune',
      athletic:Math.round((sex==='M'?1.3:1.3)*athleteBoost*sportBoost.b_vitamins*100)/100
    },
    b12:{
      target:baseB12,
      unit:'mcg',label:'B12 (Cobalamin)',
      notes:'Nerve function & energy',
      athletic:Math.round(baseB12*athleteBoost*100)/100,
      adjusted:Math.round(finalB12*100)/100,
      supplementRequired:dietType&&(dietType.includes('Веγανι')||dietType.includes('vegan')||dietType.includes('Ορθόδοξη'))
    },
    folate:{
      target:400,
      unit:'mcg',label:'Folate',
      notes:'Cell division & protein metabolism',
      athletic:Math.round(400*athleteBoost*dietBoost.folate)
    },
    omega3:{
      target:sex==='M'?1.6:1.1,
      unit:'g',label:'Omega-3 (ALA)',
      notes:'Anti-inflammatory, cardiovascular',
      athletic:Math.round((sex==='M'?1.6:1.1)*athleteBoost*10)/10
    },
    omega6:{
      target:sex==='M'?17:12,
      unit:'g',label:'Omega-6 (LA)',
      notes:'Essential fatty acid',
      athletic:Math.round((sex==='M'?17:12)*athleteBoost)
    },
    // ✅ Εγκυμοσύνη pass: Ιώδιο/Χολίνη/DHA — στόχοι πέφτουν κατευθείαν σε c.pregnant (IOM/ACOG/ODS-NIH,
    // βλ. verification pass), ίδιο πρότυπο με το ηλικιακό/φύλου branching του baseIron/baseCa πιο πάνω.
    iodine:{
      target:c.pregnant?220:150,
      unit:'mcg',label:'Ιώδιο',
      notes:c.pregnant?'Στόχος εγκυμοσύνης (ACOG/ODS-NIH)':'Γενικός ενήλικας',
      athletic:c.pregnant?220:150
    },
    choline:{
      target:c.pregnant?450:(sex==='M'?550:425),
      unit:'mg',label:'Χολίνη',
      notes:c.pregnant?'Στόχος εγκυμοσύνης, ανώτατο όριο ασφαλείας 3500mg/ημ. (IOM)':'Adequate Intake (IOM)',
      athletic:c.pregnant?450:(sex==='M'?550:425)
    },
    dha:{
      target:c.pregnant?200:250,
      unit:'mg',label:'DHA (ω-3)',
      notes:c.pregnant?'Ελάχιστο εγκυμοσύνης (ACOG/Perinatal Lipid Intake Working Group)':'Γενική σύσταση EPA+DHA (όχι επίσημο DRI)',
      athletic:c.pregnant?200:250
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
      var act={sed:1.37,light:1.375,mod:1.55,active:1.725};
      var factor=act[c.activity]||1.37;
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
      var pRatio=Math.round(pCals/t.target*100);
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
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 VALIDATION AUDIT: '+c.name);
  console.log('═══════════════════════════════════════════════════════════════');
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
function deepClone(obj){
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch(e){
    console.warn('[deepClone] failed, returning safe default:', e && e.message);
    return Array.isArray(obj) ? [] : (obj && typeof obj === 'object' ? {} : null);
  }
}

/* ── Safe Storage Wrappers ────────────────────────────────────────────────────
   Protects against: Safari private mode, quota exceeded, storage disabled
*/
function safeStorageGet(key, defaultVal) {
  try {
    var val = localStorage.getItem(getStorageKey(key));
    return val ? JSON.parse(val) : (defaultVal || null);
  } catch(e) {
    console.warn('⚠️ Storage read failed for key: ' + key, e.message);
    // ✅ PHASE 1: Better error reporting
    if(e.name === 'SyntaxError') {
      console.error('❌ Corrupted data for key: ' + key + '. Clearing and using defaults.');
      try {
        localStorage.removeItem(getStorageKey(key));
      } catch(clearErr) {
        console.error('Could not clear corrupted key', clearErr);
      }
    }
    return defaultVal || null;
  }
}

function safeStorageSet(key, val) {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(val));
    return true;
  } catch(e) {
    console.warn('⚠️ Storage write failed for key: ' + key, e.message);

    // ✅ PHASE 1: QUOTA EXCEEDED HANDLING
    if(e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      showErrorToast('❌ Χώρος αποθήκευσης ανεπαρκής. Διαγράψτε παλιά δεδομένα.');
      console.error('💾 localStorage quota exceeded. Current size:',
        Object.keys(localStorage).reduce(function(sum, key) {
          return sum + (localStorage.getItem(key) || '').length;
        }, 0) + ' bytes');
      return false;
    }

    // Silent fail for other errors - data stays in memory but won't persist
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// LOGGER & VALIDATION SYSTEM — Error tracking, warnings, and data validation
// ═══════════════════════════════════════════════════════════════════════════════════

var LOGGER={
  errors:[],
  warnings:[],
  infos:[],

  // Log levels
  ERROR:function(msg,data){
    var entry={timestamp:new Date().toLocaleTimeString(),msg:msg,data:data,type:'ERROR'};
    this.errors.push(entry);
    console.error('[ERROR] '+msg,data||'');
    return entry;
  },

  WARN:function(msg,data){
    var entry={timestamp:new Date().toLocaleTimeString(),msg:msg,data:data,type:'WARN'};
    this.warnings.push(entry);
    console.warn('[WARN] '+msg,data||'');
    return entry;
  },

  INFO:function(msg,data){
    var entry={timestamp:new Date().toLocaleTimeString(),msg:msg,data:data,type:'INFO'};
    this.infos.push(entry);
    console.log('[INFO] '+msg,data||'');
    return entry;
  },

  DEBUG:function(msg,data){
    console.log('[DEBUG] '+msg,data||'');
  },

  // Get audit trail
  getAuditTrail:function(){
    return{
      errors:this.errors.slice(-20),
      warnings:this.warnings.slice(-20),
      infos:this.infos.slice(-20),
      total:{errors:this.errors.length,warnings:this.warnings.length,infos:this.infos.length}
    };
  },

  // Clear logs
  clear:function(){
    this.errors=[];this.warnings=[];this.infos=[];
  },

  // Export logs
  exportLogs:function(){
    return JSON.stringify(this.getAuditTrail(),null,2);
  }
};

// Validation wrapper for calcTDEE
function calcTDEEWithValidation(c){
  try{
    if(!c){throw new Error('calcTDEE: client object is null/undefined');}
    if(!c.age||c.age<1||c.age>120){
      LOGGER.WARN('calcTDEE: Invalid age',{age:c.age});
      return {error:true,msg:'Age must be 1-120'};
    }
    if(!c.weight||c.weight<20||c.weight>300){
      LOGGER.WARN('calcTDEE: Invalid weight',{weight:c.weight});
      return {error:true,msg:'Weight must be 20-300 kg'};
    }
    if(!c.height||c.height<100||c.height>230){
      LOGGER.WARN('calcTDEE: Invalid height',{height:c.height});
      return {error:true,msg:'Height must be 100-230 cm'};
    }

    var result=calcTDEE(c);

    // Validate result
    if(!result.target||result.target<800||result.target>5000){
      LOGGER.WARN('calcTDEE: Suspicious TDEE value',{tdee:result.target,client:c.name});
    }
    if(!result.bmr||result.bmr<600||result.bmr>3000){
      LOGGER.WARN('calcTDEE: Suspicious BMR value',{bmr:result.bmr,client:c.name});
    }

    LOGGER.INFO('calcTDEE: Calculated for '+c.name,{tdee:result.target,bmr:result.bmr});
    return result;
  }catch(e){
    LOGGER.ERROR('calcTDEEWithValidation failed',{error:e.message,client:c});
    throw e;
  }
}

// Validation wrapper for scalePlan
function scalePlanWithValidation(tmpl,target){
  try{
    if(!tmpl){throw new Error('scalePlan: template is null');}
    if(!target||!target.k){throw new Error('scalePlan: target missing calories');}
    if(target.k<500||target.k>5000){
      LOGGER.WARN('scalePlan: Suspicious target calories',{target:target.k});
    }

    var result=scalePlan(tmpl,target);

    // Validate result
    var scaled=result.k||0;
    var diff=Math.abs(scaled-target.k);
    var tolerance=Math.max(30,target.k*0.05);  // 5% or 30 kcal

    if(diff>tolerance){
      LOGGER.WARN('scalePlan: Calorie mismatch exceeds tolerance',{
        target:target.k,
        scaled:scaled,
        diff:diff,
        tolerance:tolerance
      });
    }

    LOGGER.INFO('scalePlan: Scaled meal',{target:target.k,result:scaled});
    return result;
  }catch(e){
    LOGGER.ERROR('scalePlanWithValidation failed',{error:e.message,target:target});
    throw e;
  }
}

// Data integrity check
/* ── Autosave system ──────────────────────────────────────────────────────────
   save()     = debounced 800ms — καλείται σε κάθε αλλαγή, δεν σπαταλά πόρους
   saveNow()  = άμεσα — για import/backup, beforeunload
   Toast "✓ Αποθηκεύτηκε" εμφανίζεται μετά από κάθε αποθήκευση
*/
var _saveTimer=null;
function _doSave(){
  safeStorageSet('fyh_clients', clients);
  safeStorageSet('fyh_custom_tmpls', customTemplates);
  try { localStorage.setItem('fyh_local_updated_at', new Date().toISOString()); } catch(e){}
  try { _rollingSnapshot(); } catch(e){ console.warn('[BACKUP] snapshot hook', e && e.message); }
  try { _writeFileBackup(false); } catch(e){ console.warn('[BACKUP] file hook', e && e.message); }
  try { if(window.Cloud) window.Cloud.save(); } catch(e){ console.warn('[CLOUD] save hook', e && e.message); }
  var t=document.getElementById('autosave-toast');
  if(t){t.style.opacity='1';clearTimeout(t._ft);t._ft=setTimeout(function(){t.style.opacity='0';},1600);}
}
function save(){clearTimeout(_saveTimer);_saveTimer=setTimeout(_doSave,800);}
function saveNow(){clearTimeout(_saveTimer);_doSave();}
window.addEventListener('beforeunload',function(){saveNow();});

// ═══════════════════════════════════════════════════════════════════════════════════
// 🛡️ AUTOMATIC BACKUP SYSTEM
// Three layers of protection against data loss (cache-clear / corruption / mistakes):
//   1) Rolling in-app snapshots (instant restore, last 5)
//   2) Silent backups to a real disk folder (survives cache-clear) via File System Access
//   3) One-click restore
// ═══════════════════════════════════════════════════════════════════════════════════

// Canonical backup object shared by every backup path.
function _buildBackupObj(){
  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    clients: clients,
    customTemplates: customTemplates,
    trackingData: (typeof TRACKING_DATA !== 'undefined' ? TRACKING_DATA : null),
    totalClients: (clients ? clients.length : 0)
  };
}

// Lightweight signature to detect real changes (so we don't back up identical data).
function _dataSignature(){
  try { return clients.length + ':' + JSON.stringify(clients).length + ':' + JSON.stringify(customTemplates).length; }
  catch(e){ return String(Date.now()); }
}

// ── Layer 1: Rolling in-app snapshots ──────────────────────────────────────────────
var _BACKUP_SNAP_KEY = 'fyh_snapshots';
var _BACKUP_SNAP_MAX = 5;
var _lastSnapSig = null;

function _rollingSnapshot(){
  try {
    var sig = _dataSignature();
    if(sig === _lastSnapSig) return;             // nothing changed since last snapshot
    if(!clients || clients.length === 0) return; // never overwrite good snapshots with empty data
    var snaps = [];
    try { snaps = JSON.parse(localStorage.getItem(_BACKUP_SNAP_KEY)) || []; } catch(e){ snaps = []; }
    snaps.push({ ts: new Date().toISOString(), count: clients.length, sig: sig, data: _buildBackupObj() });
    while(snaps.length > _BACKUP_SNAP_MAX) snaps.shift();
    // Quota-safe write: if it doesn't fit, drop the oldest snapshot and retry.
    var ok = false;
    while(snaps.length && !ok){
      try { localStorage.setItem(_BACKUP_SNAP_KEY, JSON.stringify(snaps)); ok = true; }
      catch(e){ snaps.shift(); }
    }
    _lastSnapSig = sig;
  } catch(e){ console.warn('[BACKUP] snapshot failed', e && e.message); }
}

function restoreFromSnapshot(){
  var snaps = [];
  try { snaps = JSON.parse(localStorage.getItem(_BACKUP_SNAP_KEY)) || []; } catch(e){ snaps = []; }
  if(!snaps.length){ showErrorToast('Δεν υπάρχουν διαθέσιμα snapshots ακόμη.\nΘα δημιουργηθούν αυτόματα καθώς δουλεύετε.'); return; }
  var rev = snaps.slice().reverse(); // newest first
  var msg = 'Επιλέξτε snapshot για επαναφορά:\n\n';
  rev.forEach(function(s, i){
    msg += (i+1) + ') ' + new Date(s.ts).toLocaleString('el-GR') + '  —  ' + s.count + ' πελάτες\n';
  });
  msg += '\nΓράψτε τον αριθμό (1 = πιο πρόσφατο):';
  showPromptDialog(msg, '1', function(pick){
    var idx = parseInt(pick, 10);
    if(!(idx >= 1 && idx <= rev.length)){ showErrorToast('Άκυρη επιλογή.'); return; }
    var chosen = rev[idx-1];
    showConfirmDialog('⚠️ Θα αντικατασταθούν ΟΛΑ τα τρέχοντα δεδομένα με το snapshot της '
        + new Date(chosen.ts).toLocaleString('el-GR') + ' (' + chosen.count + ' πελάτες).\n\nΣυνέχεια;', function(){
      var d = chosen.data || {};
      clients = d.clients || [];
      customTemplates = d.customTemplates || [];
      if(d.trackingData && typeof TRACKING_DATA !== 'undefined') TRACKING_DATA = d.trackingData;
      _doSave();
      curId = null;
      if(typeof renderSB === 'function') renderSB();
      if(typeof renderMain === 'function') renderMain();
      showSuccessToast('✅ Επαναφορά ολοκληρώθηκε: ' + clients.length + ' πελάτες.');
    }, {confirmLabel:'Αντικατάσταση'});
  }, {title:'Επαναφορά από snapshot'});
}

// Στοχευμένη ανάκτηση: ψάχνει ΜΟΝΟ τα savedPlans ενός πελάτη μέσα στα τοπικά snapshots
// και τα προσθέτει πίσω, χωρίς να πειράξει κανέναν άλλο πελάτη ή δεδομένο (σε αντίθεση
// με το restoreFromSnapshot() που αντικαθιστά τα πάντα).
function recoverSavedPlansFor(clientId){
  var snaps=[];
  try{ snaps=JSON.parse(localStorage.getItem(_BACKUP_SNAP_KEY))||[]; }catch(e){ snaps=[]; }
  if(!snaps.length){ showErrorToast('Δεν βρέθηκαν τοπικά snapshots σε αυτόν τον υπολογιστή/browser.'); return; }
  var rev=snaps.slice().reverse(); // πιο πρόσφατο πρώτα
  var found=null;
  for(var i=0;i<rev.length;i++){
    var snapClients=(rev[i].data&&rev[i].data.clients)||[];
    var sc=null;
    for(var j=0;j<snapClients.length;j++){ if(snapClients[j].id===clientId){ sc=snapClients[j]; break; } }
    if(sc && sc.savedPlans && sc.savedPlans.length){ found={snap:rev[i],client:sc}; break; }
  }
  if(!found){ showErrorToast('Ελέγχθηκαν '+snaps.length+' τοπικά snapshots — κανένα δεν έχει αποθηκευμένα πλάνα για αυτόν τον πελάτη.'); return; }
  var c=getC();
  if(!c||c.id!==clientId){ showErrorToast('Σφάλμα: δεν βρέθηκε ο τρέχων πελάτης.'); return; }
  var existing=c.savedPlans||[];
  var existingIds={}; existing.forEach(function(p){existingIds[p.id]=true;});
  var toAdd=found.client.savedPlans.filter(function(p){return !existingIds[p.id];});
  if(!toAdd.length){ showErrorToast('Βρέθηκε snapshot της '+new Date(found.snap.ts).toLocaleString('el-GR')+', αλλά δεν έχει επιπλέον πλάνα από όσα ήδη υπάρχουν.'); return; }
  showConfirmDialog('Βρέθηκαν '+toAdd.length+' αποθηκευμένα πλάνα σε τοπικό snapshot της '+new Date(found.snap.ts).toLocaleString('el-GR')+' που λείπουν τώρα από τον πελάτη.\n\nΝα προστεθούν πίσω (δεν πειράζεται τίποτα άλλο σε κανέναν πελάτη);', function(){
    c.savedPlans=existing.concat(toAdd).sort(function(a,b){return (a.number||0)-(b.number||0);});
    save();
    var s4=document.getElementById('s4'); if(s4) s4.innerHTML=buildPlanHistoryHtml(c);
    showSuccessToast('✅ Επαναφέρθηκαν '+toAdd.length+' πλάνα από το snapshot της '+new Date(found.snap.ts).toLocaleString('el-GR')+'.');
  }, {confirmLabel:'Προσθήκη'});
}

// ── Layer 2: Silent backups to a real disk folder (File System Access API) ──────────
var _backupDirHandle = null;
var _BACKUP_DIR_DB = 'fyh_backup_db';
var _lastFileBackupSig = null;
var _lastFileBackupTime = 0;

function backupFolderSupported(){ return typeof window.showDirectoryPicker === 'function'; }

// Tiny IndexedDB helpers to remember the chosen folder across reloads.
function _idbGet(cb){
  try{
    var req = indexedDB.open(_BACKUP_DIR_DB, 1);
    req.onupgradeneeded = function(){ req.result.createObjectStore('h'); };
    req.onsuccess = function(){
      try{
        var tx = req.result.transaction('h','readonly');
        var g = tx.objectStore('h').get('dir');
        g.onsuccess = function(){ cb(g.result || null); };
        g.onerror = function(){ cb(null); };
      }catch(e){ cb(null); }
    };
    req.onerror = function(){ cb(null); };
  }catch(e){ cb(null); }
}
function _idbSet(val){
  try{
    var req = indexedDB.open(_BACKUP_DIR_DB, 1);
    req.onupgradeneeded = function(){ req.result.createObjectStore('h'); };
    req.onsuccess = function(){
      try{ req.result.transaction('h','readwrite').objectStore('h').put(val, 'dir'); }catch(e){}
    };
  }catch(e){}
}

function chooseBackupFolder(){
  if(!backupFolderSupported()){
    showErrorToast('Ο browser σας δεν υποστηρίζει αυτόματο backup σε φάκελο.\n\n'
      + 'Χρησιμοποιήστε «Αντίγραφο ασφαλείας (.json)» χειροκίνητα, ή ανοίξτε την εφαρμογή σε Chrome/Edge.');
    return;
  }
  window.showDirectoryPicker({ mode:'readwrite' }).then(function(handle){
    _backupDirHandle = handle;
    _idbSet(handle);
    _writeFileBackup(true);
    showSuccessToast('✅ Συνδέθηκε φάκελος backup.\n\nΑπό εδώ και πέρα αποθηκεύεται αυτόματα αντίγραφο σε κάθε αλλαγή '
      + '(Dietologist_Backup_latest.json + ημερήσιο αρχείο).');
  }).catch(function(e){ if(e && e.name !== 'AbortError') console.warn('[BACKUP] folder pick', e && e.message); });
}

function _ensureDirPermission(cb){
  if(!_backupDirHandle){ cb(false); return; }
  try{
    _backupDirHandle.queryPermission({ mode:'readwrite' }).then(function(p){
      if(p === 'granted'){ cb(true); return; }
      _backupDirHandle.requestPermission({ mode:'readwrite' })
        .then(function(p2){ cb(p2 === 'granted'); })
        .catch(function(){ cb(false); });
    }).catch(function(){ cb(false); });
  }catch(e){ cb(false); }
}

function _writeToDir(name, content){
  try{
    _backupDirHandle.getFileHandle(name, { create:true })
      .then(function(fh){ return fh.createWritable(); })
      .then(function(w){ return w.write(content).then(function(){ return w.close(); }); })
      .catch(function(e){ console.warn('[BACKUP] write ' + name, e && e.message); });
  }catch(e){ console.warn('[BACKUP] write ' + name, e && e.message); }
}

function _writeFileBackup(force){
  if(!_backupDirHandle) return;
  var sig = _dataSignature();
  var now = Date.now();
  if(!force && sig === _lastFileBackupSig) return;          // no change since last file backup
  if(!force && (now - _lastFileBackupTime) < 60000) return; // throttle: at most once per minute
  _ensureDirPermission(function(granted){
    if(!granted) return;
    var json = JSON.stringify(_buildBackupObj(), null, 2);
    _writeToDir('Dietologist_Backup_latest.json', json);                                  // always-current copy
    _writeToDir('Dietologist_Backup_' + new Date().toISOString().slice(0,10) + '.json', json); // daily rotating copy
    _lastFileBackupSig = sig;
    _lastFileBackupTime = now;
  });
}

// On load, silently restore the previously chosen folder handle (re-grant happens on next user click).
document.addEventListener('DOMContentLoaded', function(){
  if(!backupFolderSupported()) return;
  _idbGet(function(handle){ if(handle){ _backupDirHandle = handle; } });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// AUTO-SAVE INTERVAL (Every 30 seconds)
// ═══════════════════════════════════════════════════════════════════════════════════
var _autoSaveInterval=null;
function startAutoSaveInterval(){
  if(_autoSaveInterval) clearInterval(_autoSaveInterval);
  _autoSaveInterval=setInterval(function(){
    // Save without user intervention
    _doSave();
    console.log('[AUTO-SAVE] Saved at ' + new Date().toLocaleTimeString());
  }, 30000);  // 30 seconds
}
function stopAutoSaveInterval(){
  if(_autoSaveInterval){
    clearInterval(_autoSaveInterval);
    _autoSaveInterval=null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// EXPORT/IMPORT FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════════════════════════

function exportData(){
  // Create export object with timestamp
  var exportObj={
    version: '2.0',
    exportedAt: new Date().toISOString(),
    clients: deepClone(clients),  // Deep copy
    customTemplates: deepClone(customTemplates),
    trackingData: TRACKING_DATA || {},
    backupCount: (safeStorageGet('backup_count') || 0) + 1
  };

  // Create blob and download
  var dataStr=JSON.stringify(exportObj, null, 2);
  var blob=new Blob([dataStr], {type:'application/json'});
  var url=URL.createObjectURL(blob);
  var link=document.createElement('a');
  link.href=url;
  link.download='Dietologist_Backup_' + new Date().toISOString().split('T')[0] + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Show confirmation
  var t=document.getElementById('autosave-toast');
  if(t){
    t.innerHTML='✅ Δεδομένα εξαγωγής με επιτυχία';
    t.style.opacity='1';
    clearTimeout(t._ft);
    t._ft=setTimeout(function(){t.innerHTML='💾 Αυτόματη αποθήκευση...'; t.style.opacity='0';},2000);
  }

  console.log('[EXPORT] Created backup with ' + clients.length + ' clients');
}

function importData(){
  // Create hidden file input
  var input=document.createElement('input');
  input.type='file';
  input.accept='application/json';
  input.onchange=function(e){
    var file=e.target.files[0];
    if(!file) return;

    var reader=new FileReader();
    reader.onload=function(event){
      var importObj;
      try{
        importObj=JSON.parse(event.target.result);
        if(!importObj.clients || !Array.isArray(importObj.clients)){
          throw new Error('Invalid backup file: clients array missing');
        }
      } catch(err){
        showErrorToast('❌ Σφάλμα κατά την εισαγωγή: ' + err.message);
        console.error('[IMPORT ERROR]', err);
        return;
      }

      showConfirmDialog(
        'Δεδομένα εισαγωγής: ' + importObj.clients.length + ' πελάτες.\n\nΑντικατάσταση όλων των τρεχόντων δεδομένων;',
        function(){
          try{
            // Replace data
            clients=importObj.clients;
            customTemplates=importObj.customTemplates || [];
            if(importObj.trackingData) TRACKING_DATA=importObj.trackingData;

            // Save to localStorage
            _doSave();

            // Reload UI
            curId=null;
            renderSB();
            renderMain();

            // Show confirmation
            var t=document.getElementById('autosave-toast');
            if(t){
              t.innerHTML='✅ Εισαγωγή με επιτυχία! ' + clients.length + ' πελάτες φορτώθηκαν';
              t.style.opacity='1';
              clearTimeout(t._ft);
              t._ft=setTimeout(function(){t.innerHTML='💾 Αυτόματη αποθήκευση...'; t.style.opacity='0';},3000);
            }

            console.log('[IMPORT] Loaded ' + clients.length + ' clients');
          } catch(err){
            showErrorToast('❌ Σφάλμα κατά την εισαγωγή: ' + err.message);
            console.error('[IMPORT ERROR]', err);
          }
        },
        {confirmLabel:'Αντικατάσταση'}
      );
    };
    reader.readAsText(file);
  };
  input.click();
}

function showBackupInfo(){
  var backupCount=safeStorageGet('backup_count') || 0;
  var lastBackup=safeStorageGet('last_backup_date');
  var msg='Αυτόματη αποθήκευση κάθε 30 δευτερόλεπτα\n\n' +
          'Συνολικές αποθηκεύσεις: ' + backupCount + '\n' +
          'Τελευταία: ' + (lastBackup || 'ποτέ');
  showErrorToast(msg);
}

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

// ── Food name aliases: παλιά/εναλλακτικά ονόματα → κανονικό κλειδί στο FOODS ──
// Διορθώνει αποθηκευμένα πλάνα που χρησιμοποιούν διαφορετική ονομασία (αλλιώς cm() έδινε 0 macros)
function resolveFood(n){return (FOODS[n]?n:(FOOD_ALIASES[n]||n));}
function cm(n,g){
  // Expandable recipe → derive macros from its (scaled) ingredients, so the
  // single-line recipe and its opened-up ingredients always show the same totals.
  var rx=(typeof FYH_RECIPE_EXPAND!=='undefined')&&FYH_RECIPE_EXPAND[n];
  if(rx&&rx.ing.every(function(ing){return FOODS[resolveFood(ing.n)];})){
    var scale=(g||rx.base)/rx.base,R={k:0,p:0,c:0,f:0,fi:0};
    rx.ing.forEach(function(ing){var v=cm(ing.n,ing.g*scale);R.k+=v.k;R.p+=v.p;R.f+=v.f;R.c+=v.c;R.fi+=v.fi;});
    return{k:+R.k.toFixed(1),p:+R.p.toFixed(1),f:+R.f.toFixed(1),c:+R.c.toFixed(1),fi:+R.fi.toFixed(1)};
  }
  var key=resolveFood(n);var f=FOODS[key];
  if(!f){
    if(typeof console!=='undefined'&&console.warn)console.warn('[cm] Τρόφιμο χωρίς μακροθρεπτικά (δεν βρέθηκε στο FOODS):',n);
    if(typeof window!=='undefined'){
      window._missingFoodWarned=window._missingFoodWarned||{};
      if(!window._missingFoodWarned[n]){
        window._missingFoodWarned[n]=true;
        if(typeof showErrorToast==='function')showErrorToast('⚠️ Η τροφή "'+n+'" δεν βρέθηκε στη βάση τροφίμων — υπολογίζεται ως 0 θερμίδες. Ενημέρωσε τον προγραμματιστή.');
      }
    }
    f={k:0,p:0,c:0,f:0,fi:0};
  }
  return{k:+(g/100*f.k).toFixed(1),p:+(g/100*f.p).toFixed(1),f:+(g/100*f.f).toFixed(1),c:+(g/100*f.c).toFixed(1),fi:+(g/100*(f.fi||0)).toFixed(1)};}

/* ✅ Get food color HEX value based on category - RETURNS HEX COLOR */
function getFoodColorHex(foodName){
  var fk=resolveFood(foodName);
  if(!FOODS[fk])return '#F8B739'; // Default carbs (gold)
  var cat=(FOODS[fk].cat||'');

  // PROTEINS (🔵 Blue #5DADE2)
  if(cat==='Κρέας'||cat==='Ψάρια'||cat==='Όσπρια'||cat==='Αμινοξέα & Πρωτεΐνες')
    return '#5DADE2';

  // CARBS (🟡 Gold #F8B739)
  if(cat==='Δημητριακά'||cat==='Συνταγές'||cat==='Άλλα'||cat==='Συνταγές FYH')
    return '#F8B739';

  // VEGETABLES (🟢 Green #52B788)
  if(cat==='Λαχανικά')
    return '#52B788';

  // DAIRY (🩷 Pink #E8A0BF)
  if(cat==='Αυγά/Γαλακτ.')
    return '#E8A0BF';

  // FRUITS (🟣 Purple #C77DFF)
  if(cat==='Φρούτα')
    return '#C77DFF';

  // GRAINS/NUTS (🟠 Amber #FFB703)
  if(cat==='Ξηροί καρποί')
    return '#FFB703';

  // OILS/FATS (🧡 Orange #FB8500)
  if(cat==='Λάδια')
    return '#FB8500';

  // SPICES & HERBS (🟤 Cinnamon #B5651D)
  if(cat==='Μπαχαρικά')
    return '#B5651D';

  // SUPPLEMENTS & SPECIAL (🟦 Teal #06A77D)
  if(cat==='Βιταμίνες & Μέταλλα'||cat==='Αναβολικά & Ορμόνες'||cat==='Ύπνος & Αποκατάσταση'||
     cat==='Pre-Workout'||cat==='⚡ Ενέργεια & Ασφάλεια'||cat==='🧘 Pilates / Yoga'||
     cat==='🥗 Διατροφή & Μακροθρεπτικά'||cat==='🥊 Πολεμικές τέχνες'||cat==='🚶 Περπάτημα'||
     cat==='🚴 Ποδηλασία'||cat==='🔥 Μεταβολισμός / BMR'||cat==='📐 Σωματική Σύνθεση'||
     cat==='💃 Χορός / Αερόβιο'||cat==='🏋️ Βάρη / Γυμναστική'||cat==='🏊 Κολύμβηση'||
     cat==='🏃 Τρέξιμο'||cat==='🏂 Υπαίθριες / Χειμερινές'||cat==='🎾 Ρακέτα / Αντισφαίριση'||
     cat==='⚽ Ομαδικά αθλήματα')
    return '#06A77D';

  return '#F8B739'; // Default
}

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
  var result={Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0};
  (meals||[]).forEach(function(meal){
    (meal.foods||[]).forEach(function(food){
      var mn=MICRONUTRIENTS[food.n];
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
      }
    });
  });
  return result;
}

// ── Check micronutrient adequacy for the day ────────────────────────────────
function checkMicronutrientAdequacy(dayMN,targets,useAthletic){
  var result={};
  ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA'].forEach(function(key){
    var tgt=targets[key.toLowerCase()]||targets[key]||{};
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

  var weekTotals={Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0};
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
    else if(tgtKey==='vit_d3')mnKey='D3';

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
    'D3': 'vit_d3',
    'Omega3': 'omega3',
    'Folate': 'multivit'
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
    'vit_d3': {min:1000,max:4000},
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
    'zinc': ['calcium','iron'],
    'calcium': ['zinc','iron'],
    'iron': ['calcium','zinc','magn']
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

function calcTDEE(c){
  var bmr;
  var t={}; // Initialize tracking object for BMR method and FFM
  var isMinor=(c.age||0)<18;
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
      // Calculate FFM from body fat percentage
      var ffm=c.weight*(1-(c.bf/100));
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
  // CRITICAL: Growth allowance applies ONLY on rest days (when no training occurs)
  // - Rest days (R): baseTDEE + goalDelta + growthAdd (for development)
  // - Train days (T): baseTDEE + exercise kcal + goalDelta (no growth allowance needed, training provides stimulus)
  var baseTDEE=neat;
  var restTarget=usedMET?baseTDEE+goalDelta+growthAdd+pregAdd:tdee+goalDelta+growthAdd+pregAdd;
  var trainTarget=usedMET?baseTDEE+metKcal.perTrainDay+goalDelta+pregAdd:tdee+goalDelta+pregAdd;  // NO growthAdd on training days, but pregAdd applies every day
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
  var carbG=Math.round((target-protG*4-fatG*9)/4);
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
  if(carbG<20&&target>1200){
    warnings.push({type:'warn',msg:'⚠️ Πολύ λίγοι υδατάνθρακες: '+carbG+'g (ίσως συντακτικό λάθος;)'});
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

/* ── Default plan templates (one set per goal) ─────────────────────────────── */

// Κανονικοποίηση προτύπων: «κουμπώνει» τα ακέραια τρόφιμα (αυγά/ψωμί/φρούτα)
// στο πλησιέστερο ακέραιο τεμάχιο, ώστε τα ίδια τα πρότυπα να μη δείχνουν ποτέ
// μισές ποσότητες (π.χ. Ψωμί σίκαλης 40g → 30g = 1 φέτα, 80g → 90g = 3 φέτες).
function normalizeWholeTmpls(tmpls){
  Object.keys(tmpls).forEach(function(goal){
    (tmpls[goal]||[]).forEach(function(day){
      (day||[]).forEach(function(meal){
        (meal.foods||[]).forEach(function(f){ f.g=snapWholeG(f.n,f.g); });
      });
    });
  });
  return tmpls;
}
normalizeWholeTmpls(DEFAULT_TMPLS);

// Mutable copy — editable by the user
var TMPLS=deepClone(DEFAULT_TMPLS);
// User-saved custom plan templates
var customTemplates=[];

// ✅ TRACKING_DATA - Initialize early to prevent undefined errors
var TRACKING_DATA = {
  plans: [],
  recipes: {},
  patterns: {},
  lastUpdated: null
};

// Load TRACKING_DATA from localStorage if available
try {
  var stored = JSON.parse(localStorage.getItem('TRACKING_DATA'));
  if(stored && stored.plans){
    TRACKING_DATA = stored;
  }
} catch(e) {
  console.warn('Could not load TRACKING_DATA:', e.message);
}

// ══════════════════════════════════════════════════════════════════════════════
// CHEF-INSPIRED MEAL RECIPES — Culinary-sensible combinations
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// SNACK RECIPES — Κατάλληλα για Ενδιάμεσα Γεύματα (ΜΟΝΟ! Όχι κύρια)
// ══════════════════════════════════════════════════════════════════════════════

// Maps each food category to the macro it primarily contributes
// Used by scalePlan for per-macro scaling

// Minimum grams a food may be scaled down to.
// Foods shown in pieces (FOOD_UNITS) get a floor of half a piece, so the
// generator can't shrink a banana to ~5g while the chip still reads "1 τεμ.".
function minScaleG(n){var u=FOOD_UNITS[n];return (u&&u.g)?Math.max(5,Math.round(u.g*0.5)):5;}

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
      var ratioP=(targetP>0&&mealTot.pt>0)?targetP/mealTot.pt:ratioK;
      var ratioC=(targetC>0&&mealTot.c>0)?targetC/mealTot.c:ratioK;
      var ratioF=(targetF>0&&mealTot.f>0)?targetF/mealTot.f:ratioK;

      // Scale foods in this meal
      m.foods.forEach(function(f){
        var cat=FOODS[f.n]?FOODS[f.n].cat:'';
        var mt=MACRO_TYPE[cat]||'k';
        var r=mt==='p'?ratioP:mt==='c'?ratioC:mt==='f'?ratioF:ratioK;
        var cap=SCALE_CATS[cat];
        if(cap)r=Math.min(cap.hi,Math.max(cap.lo,r));
        f.g=snapWholeG(f.n,Math.max(minScaleG(f.n),Math.round(f.g*r)));
      });
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
  var ratioP=(targetP>0&&tot.pt>0)?targetP/tot.pt:ratioK;
  var ratioC=(targetC>0&&tot.c>0)?targetC/tot.c:ratioK;
  var ratioF=(targetF>0&&tot.f>0)?targetF/tot.f:ratioK;

  p.forEach(function(m){
    m.foods.forEach(function(f){
      var cat=FOODS[f.n]?FOODS[f.n].cat:'';
      var mt=MACRO_TYPE[cat]||'k';
      var r=mt==='p'?ratioP:mt==='c'?ratioC:mt==='f'?ratioF:ratioK;
      var cap=SCALE_CATS[cat];
      if(cap)r=Math.min(cap.hi,Math.max(cap.lo,r));
      f.g=snapWholeG(f.n,Math.max(minScaleG(f.n),Math.round(f.g*r)));
    });
  });
  return p;
}

var clients=[],curId=null,currentDD=null;

// ✅ PERFORMANCE: JSON CACHE - Cache parsed JSON to avoid repeated parsing
var JSON_CACHE={
  storage: {},
  maxSize: 100,

  set: function(key, obj){
    if(Object.keys(this.storage).length >= this.maxSize){
      delete this.storage[Object.keys(this.storage)[0]];
    }
    this.storage[key] = obj;
  },

  get: function(key){
    return this.storage[key];
  },

  parseAndCache: function(jsonStr, key){
    if(!jsonStr) return null;
    var cached = this.get(key);
    if(cached) return cached;
    try {
      var parsed = JSON.parse(jsonStr);
      if(key) this.set(key, parsed);
      return parsed;
    } catch(e) {
      console.error('[CACHE] JSON parse error for key:', key, e);
      return null;
    }
  },

  clear: function(){
    this.storage = {};
  }
};

// ✅ MOBILE: Touch event handling
var TOUCH_HANDLERS={
  // Detect if device is touch-capable
  isTouchDevice: function(){
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
  },

  // Initialize touch handlers
  init: function(){
    if(!this.isTouchDevice()) return;

    // Add touch-friendly feedback to buttons
    document.addEventListener('touchstart', function(e){
      var el = e.target.closest('button, .btn, input[type="button"]');
      if(el){
        el.style.opacity = '0.8';
        el.style.transform = 'scale(0.95)';
      }
    }, {passive: true});

    document.addEventListener('touchend', function(e){
      var el = e.target.closest('button, .btn, input[type="button"]');
      if(el){
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
      }
    }, {passive: true});

    console.log('✅ Touch handlers initialized');
  }
};

// ✅ MOBILE: Viewport optimization
var MOBILE_VIEWPORT={
  isMobile: function(){
    return window.innerWidth <= 767;
  },

  isSmallPhone: function(){
    return window.innerWidth <= 479;
  },

  isTablet: function(){
    return window.innerWidth >= 768 && window.innerWidth <= 1024;
  },

  onResize: function(){
    // Adjust layout on resize
    if(this.isMobile()){
      console.log('📱 Mobile layout');
    } else if(this.isTablet()){
      console.log('📱 Tablet layout');
    } else {
      console.log('🖥️ Desktop layout');
    }
  }
};

// Listen for orientation changes
window.addEventListener('orientationchange', function(){
  MOBILE_VIEWPORT.onResize();
  PERF_METRICS.startRender();
  setTimeout(function(){ PERF_METRICS.endRender(); }, 100);
}, {passive: true});

// ✅ MOBILE: Prevent rubber-band scroll bounce
document.addEventListener('touchmove', function(e){
  // Allow scroll on specific elements
  var scrollable = e.target.closest('.sb, .main, .week-table');
  if(!scrollable && e.cancelable){
    e.preventDefault();
  }
}, {passive: false});

// ✅ PERFORMANCE MONITORING
var PERF_METRICS={
  renderStart: 0,
  renderEnd: 0,
  saveStart: 0,
  saveEnd: 0,

  startRender: function(){ this.renderStart = performance.now(); },
  endRender: function(){
    this.renderEnd = performance.now();
    var duration = this.renderEnd - this.renderStart;
    if(duration > 100) console.warn('⚠️  Slow render: ' + Math.round(duration) + 'ms');
  },

  startSave: function(){ this.saveStart = performance.now(); },
  endSave: function(){
    this.saveEnd = performance.now();
    var duration = this.saveEnd - this.saveStart;
    if(duration > 50) console.warn('⚠️  Slow save: ' + Math.round(duration) + 'ms');
  }
};

// ✅ PHASE 4: CREATE CLIENT WITH UNDO/REDO
// ✅ PHASE 1: COMPREHENSIVE INPUT VALIDATION
var VALIDATION_RULES = {
  'name': {min: 2, max: 100, required: true, pattern: /^[^\n]{2,100}$/},
  'age': {min: 13, max: 120, required: true},
  'weight': {min: 20, max: 300, required: true},
  'height': {min: 100, max: 250, required: true},
  'activity': {required: true, values: ['sed', 'light', 'mod', 'active', 'vactive']},
  'goal': {required: true, values: ['gain', 'loss', 'maint']},
  'sex': {required: true, values: ['M', 'F']},
  'formula': {required: true, values: ['mifflin', 'harris', 'cunningham']}
};

var VALIDATION_MESSAGES_GR = {
  'name_required': '⚠️ Παρακαλώ εισάγετε όνομα πελάτη',
  'name_short': '⚠️ Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες',
  'name_long': '⚠️ Το όνομα δεν πρέπει να υπερβαίνει τα 100 χαρακτήρες',
  'age_required': '⚠️ Παρακαλώ εισάγετε ηλικία',
  'age_invalid': '⚠️ Η ηλικία πρέπει να είναι μεταξύ 13-120 ετών',
  'weight_required': '⚠️ Παρακαλώ εισάγετε βάρος',
  'weight_invalid': '⚠️ Το βάρος πρέπει να είναι μεταξύ 20-300 kg',
  'height_required': '⚠️ Παρακαλώ εισάγετε ύψος',
  'height_invalid': '⚠️ Το ύψος πρέπει να είναι μεταξύ 100-250 cm',
  'activity_required': '⚠️ Παρακαλώ επιλέξτε επίπεδο δραστηριότητας',
  'goal_required': '⚠️ Παρακαλώ επιλέξτε στόχο',
  'sex_required': '⚠️ Παρακαλώ επιλέξτε φύλο',
  'formula_required': '⚠️ Παρακαλώ επιλέξτε τύπο υπολογισμού',
  'macros_invalid': '⚠️ Τα μακροθρεπτικά πρέπει να αθροίζονται σωστά (P+F+C ~= 100%)',
  'tdee_invalid': '⚠️ Οι θερμίδες πρέπει να είναι μεταξύ 1200-5000 kcal',
  'validation_error': '❌ Σφάλμα επικύρωσης: Ελέγξτε τα δεδομένα'
};

function validateClientData(client) {
  var errors = [];

  // Name validation
  if(!client.name || client.name.trim() === '') {
    errors.push('name_required');
  } else if(client.name.length < 2) {
    errors.push('name_short');
  } else if(client.name.length > 100) {
    errors.push('name_long');
  }

  // Age validation
  if(!client.age) {
    errors.push('age_required');
  } else {
    var age = parseInt(client.age);
    if(isNaN(age) || age < 13 || age > 120) {
      errors.push('age_invalid');
    }
  }

  // Weight validation
  if(!client.weight) {
    errors.push('weight_required');
  } else {
    var weight = parseFloat(client.weight);
    if(isNaN(weight) || weight < 20 || weight > 300) {
      errors.push('weight_invalid');
    }
  }

  // Height validation
  if(!client.height) {
    errors.push('height_required');
  } else {
    var height = parseFloat(client.height);
    if(isNaN(height) || height < 100 || height > 250) {
      errors.push('height_invalid');
    }
  }

  // Activity validation
  if(!client.activity) {
    errors.push('activity_required');
  }

  // Goal validation
  if(!client.goal) {
    errors.push('goal_required');
  }

  // Sex validation
  if(!client.sex) {
    errors.push('sex_required');
  }

  // Macros validation (if plan exists)
  if(client.macroP || client.macroF || client.macroC) {
    var totalMacro = (client.macroP || 0) + (client.macroF || 0) + (client.macroC || 0);
    if(totalMacro < 90 || totalMacro > 110) {
      errors.push('macros_invalid');
    }
  }

  return errors;
}

function showValidationErrors(errors) {
  if(errors.length === 0) return true;

  if(typeof revealSectionsForErrors==='function') revealSectionsForErrors(errors);

  var message = 'Παρακαλώ διορθώστε τα εξής σφάλματα:\n\n';
  errors.forEach(function(err) {
    message += '• ' + (VALIDATION_MESSAGES_GR[err] || err) + '\n';
  });

  showErrorToast(message);
  console.warn('Validation errors:', errors);
  return false;
}

function showErrorToast(message) {
  var errorToast = document.getElementById('errorToast');
  if(!errorToast) {
    errorToast = document.createElement('div');
    errorToast.id = 'errorToast';
    errorToast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#c62828;color:white;padding:14px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);z-index:9999;font-weight:600;font-size:14px;animation:slideIn 0.3s ease-out;white-space:pre-line;max-width:320px;';
    document.body.appendChild(errorToast);
  }

  errorToast.textContent = message;
  errorToast.style.display = 'block';

  clearTimeout(errorToast._hideTimer);
  errorToast._hideTimer = setTimeout(function() {
    errorToast.style.display = 'none';
  }, 7000);
}

// ✅ Toggle Sidebar (Collapsible)
function toggleSidebar(){
  var sidebar = document.getElementById('sidebar');
  if(sidebar){
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
}

// Restore sidebar state on load
window.addEventListener('load', function(){
  var isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if(isCollapsed){
    var sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.add('collapsed');
  }
});

function addClient(prefillName){
  try {
    var id='c'+Date.now();
    var newClient={id:id,name:(prefillName||'').trim(),sex:'',age:null,weight:null,height:null,bf:0,leanmass:0,activity:'',goal:'',formula:'mifflin',lbm:0,trainDays:[false,false,false,false,false,false,false],trainHoursByDay:[1,1,1,1,1,1,1],trainTimesByDay:['','','','','','',''],carbBoost:20,trainHoursPerDay:1,metActivities:[],weekPlan:{},dayTargets:null,supps:[],suppExclude:[],macroPreset:'balanced',macroP:25,macroF:25,macroC:50,weightLog:[],consultLog:[],selectedTemplate:null,foodExclude:[],dietType:'normal',lastAccess:Date.now()};

    if(window.undoRedoManager && typeof CreateClientCommand !== 'undefined'){
      var cmd = new CreateClientCommand(newClient);
      window.undoRedoManager.execute(cmd);
    } else {
      clients.push(newClient);
      upd(); // Save to localStorage
      console.log('✅ Νέος πελάτης δημιουργήθηκε:', newClient);
    }

    selectClient(id);
    showSuccessToast('✅ Νέος πελάτης προστέθηκε!');
    console.log('✅ Συνολικοί πελάτες:', clients.length);
  } catch(e) {
    console.error('❌ Σφάλμα στη δημιουργία πελάτη:', e.message);
    console.error('Stack:', e.stack);
    showErrorToast('❌ Σφάλμα: ' + e.message);
  }
}

// ✅ PHASE 4: DELETE CLIENT WITH UNDO/REDO
function deleteClient(id){
  var clientToDelete = clients.find(function(c){return c.id===id;});
  if(!clientToDelete) return;

  // ✅ SOFT DELETE: Mark as deleted instead of removing
  clientToDelete.deleted = true;
  clientToDelete.deletedAt = new Date().toISOString();

  if(curId===id){
    curId=null;
    if(typeof renderHome==='function') renderHome();
  }

  save();
  renderSB();
}

function restoreClient(id){
  var clientToRestore = clients.find(function(c){return c.id===id;});
  if(!clientToRestore) return;

  // ✅ RESTORE: Unmark as deleted
  clientToRestore.deleted = false;
  delete clientToRestore.deletedAt;

  save();
  renderSB();
}

// ✅ ARCHIVE: separate from soft-delete — hides a client from the active list without marking it for deletion
function archiveClient(id){
  var c = clients.find(function(x){return x.id===id;});
  if(!c) return;
  c.archived = true;
  c.archivedAt = new Date().toISOString();

  if(curId===id){
    curId=null;
    if(typeof renderHome==='function') renderHome();
  }

  save();
  renderSB();
}

function unarchiveClient(id){
  var c = clients.find(function(x){return x.id===id;});
  if(!c) return;
  c.archived = false;
  delete c.archivedAt;

  save();
  renderSB();
}

function permanentlyDeleteClient(id){
  showConfirmDialog('Διαγραφή ΜΟΝΙΜΑ; Δεν θα μπορείς να ανακτήσεις τα δεδομένα!', function(){
    // ✅ HARD DELETE: Permanently remove
    clients = clients.filter(function(c){return c.id!==id;});

    if(curId===id){
      curId=null;
      if(typeof renderHome==='function') renderHome();
    }

    save();
    renderSB();
  }, {confirmLabel:'Μόνιμη διαγραφή'});
}
function selectClient(id){
  try {
    curId=id;
    // ✅ Update lastAccess timestamp for sorting
    var c=clients.find(function(x){return x.id===id;});
    if(c){
      c.lastAccess=Date.now();
      save(); // Save the lastAccess update
    }

    var tb=document.getElementById('tmpl-sb-btn');
    if(tb) tb.classList.remove('active');

    renderSB();
    renderMain();

    // Show first tab (client details)
    swTab(1);

    // Hide FAB menu
    var fabMenu = document.getElementById('fab-menu');
    if(fabMenu) fabMenu.style.display = 'none';

    console.log('✅ Πελάτης επιλέχθηκε:', id);
    console.log('✅ Πελάτης δεδομένα:', getC());
  } catch(e) {
    console.error('❌ Σφάλμα στη επιλογή πελάτη:', e.message);
    console.error('Stack:', e.stack);
    console.error('Full error:', e);
    // showErrorToast('❌ Σφάλμα φόρτωσης στοιχείων: ' + e.message);
  }
}
function getC(){return clients.filter(function(c){return c.id===curId;})[0];}

/* ===== Γρήγορες ενέργειες πλαϊνής μπάρας: Νέο πλάνο / Γρήγορη μέτρηση ===== */
function closeAllQA(){
  ['qa-newplan','qa-quickmeasure'].forEach(function(p){
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
    else renderQAQuickMeasure('');
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
    html+='<div class="qa-row" onclick="qaStartPlan(\''+c.id+'\')"><span>'+(c.name||'Νέος πελάτης')+'</span><span class="qa-row-sub">'+qaPlanStatusText(c)+'</span></div>';
  });
  html+='<div class="qa-row qa-row-new" onclick="qaCreateAndPlan(document.getElementById(\'qa-newplan-input\').value)">+ Δημιούργησε νέο πελάτη'+(q?' «'+q+'»':'')+'</div>';
  results.innerHTML=html;
}

function renderQAQuickMeasure(q){
  var results=document.getElementById('qa-quickmeasure-results'); if(!results) return;
  var list=qaMatchingClients(q), html='';
  list.forEach(function(c){
    var sub = (c.weightLog && c.weightLog.length) ? ('τελ. μέτρηση '+c.weightLog[c.weightLog.length-1].date) : 'καμία μέτρηση ακόμα';
    html+='<div class="qa-row" onclick="qaStartMeasure(\''+c.id+'\')"><span>'+(c.name||'Νέος πελάτης')+'</span><span class="qa-row-sub">'+sub+'</span></div>';
  });
  html+='<div class="qa-row qa-row-new" onclick="qaCreateAndMeasure(document.getElementById(\'qa-quickmeasure-input\').value)">+ Δημιούργησε νέο πελάτη'+(q?' «'+q+'»':'')+'</div>';
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

var _clientSearchTerm='';
function filterClients(val){_clientSearchTerm=(val||'').toLowerCase().trim();renderSB();}
var _clientFilterGoal='';
var _clientFilterSport='';
function setClientFilter(type,val){
  if(type==='goal') _clientFilterGoal=val;
  else if(type==='sport') _clientFilterSport=val;
  renderSB();
}
var _clientSortMode='recent'; // 'recent' | 'oldest' | 'name' | 'stale' | 'attention'
function setClientSort(val){ _clientSortMode=val; renderSB(); }

// Πόσο καιρό πριν άνοιξε τελευταία φορά ο φάκελος αυτού του πελάτη.
function fmtLastAccess(ts){
  if(!ts) return 'ποτέ';
  var days=Math.floor((Date.now()-ts)/86400000);
  if(days<=0) return 'σήμερα';
  if(days===1) return 'χθες';
  return 'πριν '+days+' ημέρες';
}
function loadTestClientBasilina(){
  var basilina = {
    id: 'basilina-perisiou-' + Date.now(),
    name: 'Βασιλίνα Περίσιου',
    sex: 'F',
    age: 32,
    weight: 63.1,
    height: 165,
    bf: null,
    leanmass: null,
    rmr: 1300,
    activity: 'moderate',
    sport: null,
    goalMain: 'maintain',
    goalCalAdj: 0,
    trainDays: [true, true, false, true, true, false, false],
    hasMultipleTrainings: false,
    foodExclude: [],
    allergies: '',
    medicalConditions: [],
    menstruCycle: 'regular',
    suppsSelected: {},
    mealTimes: {
      breakfast: '08:00',
      snack1: '11:00',
      lunch: '13:00',
      snack2: '15:30',
      dinner: '19:00'
    },
    weekPlan: {},
    lastAccess: Date.now(),
    notes: 'Test Client - Ανακτήθηκε από διατροφικό πλάνο'
  };
  clients.push(basilina);
  save();
  renderSB();
  selectClient(basilina.id);
  showSuccessToast('✅ Βασιλίνα Περίσιου φορτώθηκε με επιτυχία!');
}

// Μικρό badge κατάστασης δίπλα σε κάθε πελάτη στη λίστα (βασισμένο στα cloud checkins από το portal).
// Σκόπιμα διαφορετικό λεξιλόγιο από το "Ενεργό/Χωρίς σχέδιο" cc-status badge δίπλα του — αυτό εδώ αφορά
// αποκλειστικά τη δραστηριότητα check-in στο portal, όχι αν υπάρχει πλάνο, ώστε τα δύο badges να μη
// διαβάζονται σαν αντιφατικά (π.χ. "Ενεργό σχέδιο" + "Δεν έχει ξεκινήσει" δίπλα-δίπλα ήταν μπερδεμένο).
function progressBadge(c){
  if(!c.shareToken) return '';
  var rows=(window.Cloud&&window.Cloud.checkinsFor)?window.Cloud.checkinsFor(c):[];
  if(!rows.length) return '<span style="background:#F1EFE8;color:#444441;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap">Χωρίς check-in ακόμα</span>';
  var gap=ckDaysSinceLast(rows);
  if(gap>=2) return '<span style="background:#FCEBEB;color:#791F1F;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap">⚠ '+gap+'ημ. χωρίς check-in</span>';
  var byDate=ckRowsByDate(rows), score=ckWeekScore(byDate,0);
  if(score==null) return '<span style="background:#F1EFE8;color:#444441;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap">Χωρίς check-in ακόμα</span>';
  var ok=score>=85;
  return '<span style="background:'+(ok?'#E8F5E9':'#FAEEDA')+';color:'+(ok?'#1E5E24':'#633806')+';font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap">'+score+'%</span>';
}

// Ένας πελάτης "χρειάζεται προσοχή" αν: δεν έχει καθόλου πλάνο, ή το δημοσιευμένο portal link του είναι
// ξεπερασμένο, ή το πλάνο του είναι 30+ ημερών (ίδια κριτήρια με το Διατροφές "needs action"), ή έχει
// δημοσιευμένο portal αλλά 2+ μέρες χωρίς check-in.
function clientNeedsAttention(c){
  if(typeof dietsHasPlan==='function' && !dietsHasPlan(c)) return true;
  if(window.Cloud && window.Cloud.isStale && window.Cloud.isStale(c)) return true;
  if(typeof dietsNeedsRenewal==='function' && dietsNeedsRenewal(c)) return true;
  if(c.shareToken && window.Cloud && window.Cloud.checkinsFor){
    var rows=window.Cloud.checkinsFor(c);
    if(rows.length && ckDaysSinceLast(rows)>=2) return true;
  }
  return false;
}
// Αρχικά ενός ονόματος για το avatar κάθε γραμμής (π.χ. "Γιώργος Παπαδόπουλος" → "ΓΠ").
// Ζει εδώ (όχι στο app-part5-home.js, που φορτώνει αργότερα) γιατί ένα early callback
// από το app-part4.js μπορεί να καλέσει renderSB() πριν προλάβει να φορτώσει εκείνο το αρχείο.
function initials(name){
  var parts=(name||'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return '?';
  if(parts.length===1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0]+parts[1][0]).toUpperCase();
}
function renderSB(){
  var term=_clientSearchTerm;
  // ✅ FILTER: Exclude deleted + archived clients from the main list
  var base=clients.filter(function(c){return !c.deleted && !c.archived;});
  var list=base.filter(function(c){
    if(term && (c.name||'Νέος πελάτης').toLowerCase().indexOf(term)===-1) return false;
    if(_clientFilterGoal && c.goal!==_clientFilterGoal) return false;
    if(_clientFilterSport && c.sport!==_clientFilterSport) return false;
    return true;
  });
  // ✅ Sort according to the selected mode (default: most recent visit first)
  if(_clientSortMode==='name'){
    list.sort(function(a,b){return (a.name||'').localeCompare(b.name||'','el');});
  } else if(_clientSortMode==='oldest'){
    list.sort(function(a,b){return (a.lastAccess||0)-(b.lastAccess||0);});
  } else if(_clientSortMode==='stale'){
    list.sort(function(a,b){
      var sa=(window.Cloud&&window.Cloud.isStale)?window.Cloud.isStale(a):false;
      var sb=(window.Cloud&&window.Cloud.isStale)?window.Cloud.isStale(b):false;
      if(sa!==sb) return sa?-1:1;
      return (b.lastAccess||0)-(a.lastAccess||0);
    });
  } else if(_clientSortMode==='attention'){
    list.sort(function(a,b){
      var na=clientNeedsAttention(a), nb=clientNeedsAttention(b);
      if(na!==nb) return na?-1:1;
      return (b.lastAccess||0)-(a.lastAccess||0);
    });
  } else {
    list.sort(function(a,b){return(b.lastAccess||0)-(a.lastAccess||0);});
  }
  var html='';
  if((term||_clientFilterGoal||_clientFilterSport)&&list.length===0){
    html='<div style="font-size:12px;color:#bbb;padding:20px 0;text-align:center;font-style:italic">Κανένα αποτέλεσμα</div>';
  } else {
    html+='<div class="clients-grid">';
    list.forEach(function(c){
      var hasActive = c.weekPlan && Object.keys(c.weekPlan).length > 0;
      var sportInfo=(typeof SPORT_INFO!=='undefined')?SPORT_INFO[c.sport]:null;
      var sport=sportInfo?(' • '+sportInfo.icon+' '+sportInfo.label):'';
      html+='<div class="client-card" onclick="selectClient(\''+c.id+'\')">'
        +'<div class="cc-top">'
        +'<div class="cc-avatar'+(hasActive?' cc-avatar-active':'')+'">'+initials(c.name)+'</div>'
        +'<div class="cc-headtext">'
        +'<div class="cc-name">'+esc(c.name||'Νέος πελάτης')+'</div>'
        +'<div class="cc-sub">'+(c.age||'?')+' ετών • '+(c.weight||'?')+'kg'+sport+'</div>'
        +'</div>'
        +'<div class="cc-actions">'
        +'<button class="carch" title="Αρχειοθέτηση" aria-label="Αρχειοθέτηση πελάτη" onclick="event.stopPropagation();archiveClient(\''+c.id+'\')">📦</button>'
        +'<button class="cdel" aria-label="Διαγραφή πελάτη" onclick="event.stopPropagation();deleteClient(\''+c.id+'\')">✕</button>'
        +'</div>'
        +'</div>'
        +'<div class="cc-bottom">'
        +'<span class="cc-status '+(hasActive?'cc-status-active':'cc-status-none')+'">'+(hasActive?'📊 Ενεργό σχέδιο':'⭕ Χωρίς σχέδιο')+'</span>'
        +progressBadge(c)
        +'<span class="cc-lastaccess">'+fmtLastAccess(c.lastAccess)+'</span>'
        +'</div>'
        +'</div>';
    });
    html+='</div>';
  }

  // ✅ ARCHIVE SECTION: Show archived (but not deleted) clients
  var archivedClients = clients.filter(function(c){return c.archived && !c.deleted;});
  if(archivedClients.length > 0 && !term){
    html+='<div class="clients-section-title">📦 Αρχειοθετημένοι ('+archivedClients.length+')</div>';
    html+='<div class="clients-grid">';
    archivedClients.forEach(function(c){
      html+='<div class="client-card cc-muted">'
        +'<div class="cc-name cc-muted-name">'+esc(c.name||'Νέος πελάτης')+'</div>'
        +'<div class="cc-sub cc-muted-sub">Αρχειοθετήθηκε</div>'
        +'<div class="cc-muted-actions">'
        +'<button class="cc-restore" onclick="event.stopPropagation();unarchiveClient(\''+c.id+'\');renderSB()">↶ Επαναφορά</button>'
        +'<button class="cc-permadelete" onclick="event.stopPropagation();deleteClient(\''+c.id+'\');renderSB()">🗑️ Διαγραφή</button>'
        +'</div>'
        +'</div>';
    });
    html+='</div>';
  }

  // ✅ TRASH SECTION: Show deleted clients
  var deletedClients = clients.filter(function(c){return c.deleted;});
  if(deletedClients.length > 0 && !term){
    html+='<div class="clients-section-title">🗑️ Διαγραμμένοι ('+deletedClients.length+')</div>';
    html+='<div class="clients-grid">';
    deletedClients.forEach(function(c){
      html+='<div class="client-card cc-muted">'
        +'<div class="cc-name cc-muted-name">'+esc(c.name||'Νέος πελάτης')+'</div>'
        +'<div class="cc-sub cc-muted-sub">Διαγράφηκε</div>'
        +'<div class="cc-muted-actions">'
        +'<button class="cc-restore" onclick="event.stopPropagation();restoreClient(\''+c.id+'\');renderSB()">↶ Ανάκτηση</button>'
        +'<button class="cc-permadelete" onclick="event.stopPropagation();permanentlyDeleteClient(\''+c.id+'\');renderSB()">🗑️ Μόνιμα</button>'
        +'</div>'
        +'</div>';
    });
    html+='</div>';
  }

  if(!term&&base.length>0){
    html+='<div style="font-size:9px;color:#999;padding:6px 10px;text-align:center;margin-top:8px;font-weight:500;">'+list.length+(list.length!==base.length?' / '+base.length:'')+' πελάτες</div>';
  }
  var clientListEl=document.getElementById('client-list');
  if(clientListEl) clientListEl.innerHTML=html;

  // ✅ Update breadcrumbs after rendering
  if(typeof updateBreadcrumbs === 'function') updateBreadcrumbs();
}

/* ======== TEMPLATE EDITOR ======== */
var curTmplGoal='maintain';

function selectTmpl(){
  curId=null;renderSB();
  var btn=document.getElementById('tmpl-sb-btn');
  if(btn)btn.classList.add('active');
  renderTemplateEditor();
}

function renderTemplateEditor(){
  var tabs='';
  GOAL_KEYS.forEach(function(g){
    tabs+='<button class="tmpl-goal-tab'+(g===curTmplGoal?' active':'')+'" onclick="swTmplGoal(\''+g+'\')">'+GOAL_LABELS[g]+'</button>';
  });
  // Custom templates section
  var custHtml='';
  if(customTemplates.length){
    custHtml='<div class="custom-tmpls-section">'
      +'<div class="custom-tmpls-head">⭐ Αποθηκευμένα πρότυπα ('+customTemplates.length+')</div>'
      +'<div class="custom-tmpls-list">';
    customTemplates.forEach(function(ct){
      var gl=GOAL_LABELS[ct.goal]||ct.goal;
      custHtml+='<div class="custom-tmpl-item">'
        +'<div class="custom-tmpl-info">'
        +'<span class="custom-tmpl-name">'+esc(ct.name)+'</span>'
        +'<span class="custom-tmpl-meta">'+gl+' · '+esc(ct.createdAt)+(ct.clientName?' · από: '+esc(ct.clientName):'')+'</span>'
        +'</div>'
        +'<button class="met-del" onclick="deleteCustomTmpl(\''+ct.id+'\')" title="Διαγραφή">&#10005;</button>'
        +'</div>';
    });
    custHtml+='</div></div>';
  }
  var html='<div style="padding:16px 20px">'
    +'<div style="font-size:14px;font-weight:700;color:#025857;margin-bottom:10px">&#9998; Επεξεργασία προτύπων</div>'
    +custHtml
    +'<div class="tmpl-goal-tabs">'+tabs+'</div>'
    +'<div class="tmpl-info">Τα τρόφιμα και οι αναλογίες εδώ είναι η βάση κάθε νέου πλάνου. Τα γραμμάρια προσαρμόζονται αυτόματα στις θερμίδες του πελάτη.</div>'
    +'<div class="brow">'
    +'<button class="tmpl-reset-btn" onclick="resetTmpl(\''+curTmplGoal+'\')">&#8635; Επαναφορά αρχικών ('+GOAL_LABELS[curTmplGoal]+')</button>'
    +'</div>'
    +'<div class="plan-wrap"><div class="week-main"><div id="tmpl-con"></div></div>'
    +'<div class="food-lib"><div class="food-lib-title">Τρόφιμα</div>'
    +'<input class="food-lib-search" type="text" placeholder="Αναζήτηση..." oninput="filterLib(this)">'
    +'<div id="lib-list"></div></div></div></div>';
  document.getElementById('main').innerHTML=html;
  renderFoodLib('');
  renderTmplTable();
}

function swTmplGoal(g){curTmplGoal=g;renderTemplateEditor();}

function renderTmplTable(){
  var con=document.getElementById('tmpl-con');if(!con)return;
  var tmpl=TMPLS[curTmplGoal];
  var mealNames=tmpl[0].map(function(m){return m.name;});
  var html='<table class="week-table"><thead><tr><th>Γεύμα</th>';
  DAYS.forEach(function(d){html+='<th>'+d+'</th>';});
  html+='</tr></thead><tbody>';
  for(var mi=0;mi<mealNames.length;mi++){
    html+='<tr><td class="meal-label">'+mealNames[mi]+'</td>';
    for(var d=0;d<7;d++){
      var foods=tmpl[d][mi]?tmpl[d][mi].foods:[];
      html+='<td class="day-cell tmpl-cell" data-d="'+d+'" data-mi="'+mi+'">';
      foods.forEach(function(food,fi){
        var tfu=FOOD_UNITS[food.n];
        var tDisplayUnit = food.u !== undefined ? food.u : (tfu ? tfu.u : 'g');
        var tVal, tMax, tChg;
        if (tDisplayUnit === 'g' || !tfu) {
          tVal = food.g;
          tMax = 999;
          tChg = 'tmplUpdG('+d+','+mi+','+fi+',this.value)';
        } else {
          tVal = WHOLE_UNIT_FOODS[food.n]
            ? Math.max(1, Math.round(food.g / tfu.g))
            : Math.max(0.1, Math.round(food.g / tfu.g * 10) / 10);
          tMax = 10;
          tChg = 'tmplUpdG('+d+','+mi+','+fi+',this.value*'+tfu.g+')';
        }
        var tUnit = pluralUnit(tDisplayUnit, tVal);
        html+='<div class="food-chip">'
          +'<div class="chip-name-wrap">'
          +'<input class="chip-inp" type="text" value="'+food.n+'" autocomplete="off" spellcheck="false"'
          +' data-d="'+d+'" data-mi="'+mi+'" data-fi="'+fi+'" data-mode="tmpl"'
          +' oninput="showChipSug(this)" onfocus="showChipSug(this)" onblur="closeDD()">'
          +'</div>'
          +'<input class="chip-g" type="number" min="0" step="'+(tDisplayUnit==='g'||!tfu?'1':'0.1')+'" max="'+tMax+'" value="'+tVal+'" onchange="'+tChg+'">'
          +'<span class="chip-unit">'+tUnit+'</span>'
          +'<button class="chip-del" onclick="tmplDelF('+d+','+mi+','+fi+')" aria-label="Διαγραφή τροφίμου">&#10005;</button>'
          +'</div>';
      });
      html+='<button class="chip-add" onclick="tmplAddF('+d+','+mi+')">+</button></td>';
    }
    html+='</tr>';
  }
  html+='</tbody></table>';
  con.innerHTML=html;
  // drag-drop: drop food library item onto template cell
  con.querySelectorAll('.tmpl-cell').forEach(function(cell){
    cell.addEventListener('dragover',function(e){e.preventDefault();cell.classList.add('drag-over');});
    cell.addEventListener('dragleave',function(e){if(!cell.contains(e.relatedTarget))cell.classList.remove('drag-over');});
    cell.addEventListener('drop',function(e){
      e.preventDefault();cell.classList.remove('drag-over');
      var name=e.dataTransfer.getData('text/plain');
      if(!name||!FOODS[name])return;
      var dd=parseInt(cell.dataset.d),mmi=parseInt(cell.dataset.mi);
      TMPLS[curTmplGoal][dd][mmi].foods.push({n:name,g:100});
      renderTmplTable();
    });
  });
}

function tmplUpdG(d,mi,fi,v){
  var parsed=parseInt(v,10);
  if(isNaN(parsed)||parsed<0)return;
  TMPLS[curTmplGoal][d][mi].foods[fi].g=parsed;
  renderTmplTable();
}
function tmplAddF(d,mi){TMPLS[curTmplGoal][d][mi].foods.push({n:Object.keys(FOODS)[0],g:100});renderTmplTable();}
function tmplDelF(d,mi,fi){TMPLS[curTmplGoal][d][mi].foods.splice(fi,1);renderTmplTable();}
function resetTmpl(goal){
  TMPLS[goal]=deepClone(DEFAULT_TMPLS[goal]);
  renderTemplateEditor();
}

/* ── Custom Template Management ──────────────────────────────────────────── */
function buildTmplSelectorHtml(c){
  var sel=c.selectedTemplate||'';
  var goalLabel=GOAL_LABELS[c.goal]||c.goal;
  var opts='<option value="">📋 Προεπιλεγμένο ('+goalLabel+')</option>';

  // Hide this selector on page 2 and others — only show on Tab 1
  if(typeof swTab !== 'undefined'){
    // This will be hidden by swTab logic
  }
  // Built-in calorie-level reference templates
  var kcalKeys=['kcal2000','kcal2300','kcal2500','kcal2700','kcal3000'];
  kcalKeys.forEach(function(k){
    opts+='<option value="__kcal_'+k+'"'+(sel==='__kcal_'+k?' selected':'')+'>📊 '+GOAL_LABELS[k]+'</option>';
  });
  // User-saved custom templates
  customTemplates.forEach(function(ct){
    var gl=GOAL_LABELS[ct.goal]||ct.goal;
    opts+='<option value="'+ct.id+'"'+(sel===ct.id?' selected':'')+'>⭐ '+esc(ct.name)+' — '+gl+' ('+esc(ct.createdAt)+')</option>';
  });
  // Existing clients' plans (as basis for new plans)
  console.log('Building template selector. Total clients:', clients.length);
  console.log('Current client ID:', c.id);
  var clientsWithPlans=clients.filter(function(cl){
    var hasWeekPlan=Object.keys(cl.weekPlan||{}).length>0;
    console.log('Client:', cl.name||'Νέος πελάτης', '| ID:', cl.id, '| Has weekPlan:', hasWeekPlan, '| weekPlan keys:', Object.keys(cl.weekPlan||{}));
    return cl.id!==c.id && hasWeekPlan;
  });
  console.log('Clients with plans (excluding current):', clientsWithPlans.length);
  if(clientsWithPlans.length>0){
    opts+='<optgroup label="━━━ Υπάρχοντα πλάνα πελατών ━━━">';
    clientsWithPlans.forEach(function(cl){
      var cGoal=GOAL_LABELS[cl.goal]||cl.goal;
      var cName=cl.name||'Νέος πελάτης';
      opts+='<option value="__client_'+cl.id+'"'+(sel==='__client_'+cl.id?' selected':'')+'>👤 '+esc(cName)+' — '+cGoal+'</option>';
    });
    opts+='</optgroup>';
  }
  return '<div class="tmpl-sel-row">'
    +'<label>📋 Βάση πλάνου:</label>'
    +'<select class="tmpl-sel-drop" onchange="selectTmplForClient(this.value)">'+opts+'</select>'
    +'</div>';
}

function showSaveTmplPanel(){
  var p=document.getElementById('save-tmpl-panel');
  if(p)p.style.display=p.style.display==='none'?'flex':'none';
}
function closeSaveTmplPanel(){
  var p=document.getElementById('save-tmpl-panel');if(p)p.style.display='none';
}
function doSaveAsTmpl(){
  var c=getC();
  if(!c||!Object.keys(c.weekPlan||{}).length){showErrorToast('Δεν υπάρχει πλάνο για αποθήκευση!');return;}
  var nameInp=document.getElementById('save-tmpl-name');
  var goalSel=document.getElementById('save-tmpl-goal');
  var name=(nameInp?nameInp.value.trim():'');
  var goal=goalSel?goalSel.value:(c.goal||'loss');
  if(!name){if(nameInp)nameInp.focus();return;}
  var days=[];
  for(var d=0;d<7;d++)days.push(deepClone(c.weekPlan[d]||[]));
  var id='ct'+Date.now();
  customTemplates.push({id:id,name:name,goal:goal,days:days,
    createdAt:new Date().toISOString().slice(0,10),
    clientName:c.name||''});
  save();
  closeSaveTmplPanel();
  // Brief success feedback on button
  var btn=document.querySelector('.save-tmpl-btn');
  if(btn){var orig=btn.innerHTML;btn.innerHTML='&#10003; Αποθηκεύτηκε!';btn.style.background='#2e7d32';
    setTimeout(function(){btn.innerHTML=orig;btn.style.background='';},2500);}
}

// ═══════════════════════════════════════════════════════════════
// NUTRITION PLAN HISTORY - SAVE & VIEW MACRONUTRIENT EVOLUTION
// ═══════════════════════════════════════════════════════════════
function showSavePlanPanel(){
  var c=getC();
  if(!c||!Object.keys(c.weekPlan||{}).length){showErrorToast('Δεν υπάρχει πλάνο για αποθήκευση!');return;}
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
  if(!c||!Object.keys(c.weekPlan||{}).length){showErrorToast('Δεν υπάρχει πλάνο για αποθήκευση!');return;}

  // Initialize savedPlans if it doesn't exist
  if(!c.savedPlans)c.savedPlans=[];

  // Get macro totals for the week
  var k=0,p=0,f=0,carbs=0;
  var debugFoodCount=0;
  for(var d=0;d<7;d++){
    if(!c.weekPlan[d])continue;
    for(var mi=0;mi<c.weekPlan[d].length;mi++){
      var meal=c.weekPlan[d][mi];
      if(meal.foods){
        for(var fi=0;fi<meal.foods.length;fi++){
          var fd=meal.foods[fi];
          // Try to use pre-calculated macros first, otherwise calculate with cm()
          if(fd.k && fd.k > 0){
            k+=(fd.k||0);p+=(fd.p||0);f+=(fd.f||0);carbs+=(fd.c||0);
          } else if(fd.n && fd.g){
            // Calculate using cm() if not already calculated
            var mv=cm(fd.n,fd.g);
            k+=mv.k;p+=mv.p;f+=mv.f;carbs+=mv.c;
          }
          debugFoodCount++;
        }
      }
    }
  }

  // Debug: Log the calculation
  console.log('[SAVE PLAN] Debug info:', {
    weekPlanDays: Object.keys(c.weekPlan||{}).length,
    foodCount: debugFoodCount,
    totalK: k,
    totalP: p,
    totalF: f,
    totalCarbs: carbs
  });

  var avgDaily={k:Math.round(k/7),p:Math.round(p/7),f:Math.round(f/7),c:Math.round(carbs/7)};

  var noteElem=document.getElementById('plan-save-note');
  var note=noteElem?noteElem.value.trim():'';

  var planNum=c.savedPlans.length+1;
  var planEntry={
    id:'plan_'+Date.now(),
    number:planNum,
    date:new Date().toISOString().slice(0,10),
    time:new Date().toLocaleTimeString('el-GR'),
    note:note,
    macros:avgDaily,
    weekPlan:deepClone(c.weekPlan),
    goal:c.goal,
    dietType:c.dietType
  };

  c.savedPlans.push(planEntry);
  save();
  closeSavePlanPanel();

  // Show toast notification
  var toast=document.getElementById('autosave-toast');
  if(toast){
    toast.innerHTML='✓ Πλάνο #'+planNum+' αποθηκεύτηκε!';
    toast.style.opacity='1';
    clearTimeout(toast._ft);
    toast._ft=setTimeout(function(){toast.style.opacity='0';},2500);
  }

  // Update the plan history tab immediately
  var s4=document.getElementById('s4');
  if(s4){
    s4.innerHTML=buildPlanHistoryHtml(c);
    // Render charts after update
    setTimeout(function(){renderPlanCharts(c);},100);
  }

  // Auto-navigate to history tab to show the saved plan (with small delay to ensure HTML is updated)
  setTimeout(function(){
    swTab(4);
    console.log('[SAVE PLAN] Navigated to history tab, s4 display:', document.getElementById('s4').style.display);
  }, 50);
}

function renderPlanCharts(c){
  if(!c.savedPlans||c.savedPlans.length===0)return;
  for(var i=0;i<c.savedPlans.length;i++){
    var plan=c.savedPlans[i];
    var chartElem=document.getElementById('plan-chart-'+plan.id);
    if(!chartElem)continue;

    // Skip if chart already exists (Chart.js instance)
    if(chartElem.chart)continue;

    try{
      chartElem.chart=new Chart(chartElem,{
        type:'doughnut',
        data:{
          labels:['Πρωτεΐνες','Λίπος','Υδατάνθρακες'],
          datasets:[{
            data:[plan.macros.p*4,plan.macros.f*9,plan.macros.c*4],
            backgroundColor:['#f57c00','#d32f2f','#388e3c'],
            borderColor:'#fff',
            borderWidth:2
          }]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          plugins:{
            legend:{position:'bottom',labels:{font:{size:11},color:'#666',padding:10}},
            tooltip:{callbacks:{label:function(ctx){var total=ctx.dataset.data.reduce(function(a,b){return a+b;});var pct=(ctx.parsed*100/total).toFixed(1);return ctx.label+': '+ctx.parsed+' kcal ('+pct+'%)'}}}
          }
        }
      });
    }catch(e){
      console.error('Error rendering plan chart:',e);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT, ALERTS, MEAL SWAPPING, IMPROVEMENT TIPS
// ═══════════════════════════════════════════════════════════════

function exportPlanHistory(){
  var c=getC();
  if(!c||!c.savedPlans||c.savedPlans.length===0){
    showErrorToast('Δεν υπάρχουν πλάνα για εξαγωγή');
    return;
  }

  var html='<html><head><meta charset="UTF-8"><title>Ιστορικό Πλάνων - '+esc(c.name)+'</title>';
  html+='<style>body{font-family:Arial;margin:20px;color:#333}h1{color:#025857}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:12px;text-align:left}th{background:#025857;color:white}tr:nth-child(even){background:#f9f9f9}</style>';
  html+='</head><body>';
  html+='<h1>📊 Ιστορικό Διατροφικών Πλάνων</h1>';
  html+='<p><strong>Πελάτης:</strong> '+esc(c.name)+'</p>';
  html+='<p><strong>Ημερομηνία Εξαγωγής:</strong> '+new Date().toLocaleDateString('el-GR')+'</p>';

  html+='<table><tr><th>Πλάνο</th><th>Ημερομηνία</th><th>Kcal</th><th>Πρωτ(g)</th><th>Λίπος(g)</th><th>Υδατ(g)</th><th>Σχόλιο</th></tr>';
  for(var i=0;i<c.savedPlans.length;i++){
    var p=c.savedPlans[i];
    html+='<tr><td>#'+p.number+'</td><td>'+p.date+'</td><td>'+p.macros.k+'</td><td>'+p.macros.p+'</td><td>'+p.macros.f+'</td><td>'+p.macros.c+'</td><td>'+esc(p.note||'')+'</td></tr>';
  }
  html+='</table>';
  html+='</body></html>';

  var blob=new Blob([html],{type:'text/html'});
  var url=window.URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;
  a.download='plan_history_'+c.name+'_'+new Date().getTime()+'.html';
  a.click();
  console.log('[EXPORT] Plan history exported');
}

function generateSmartAlerts(c){
  if(!c||!c.savedPlans||c.savedPlans.length<2)return[];

  var alerts=[];
  var plans=c.savedPlans;
  var latest=plans[plans.length-1];
  var prev=plans[plans.length-2];

  // Protein trend alert
  if(latest.macros.p<prev.macros.p*0.9){
    alerts.push({type:'warning',icon:'⚠️',title:'Πρωτεΐνες μειώθηκαν',msg:'Το πρωτέϊνες έπεσαν '+Math.round((prev.macros.p-latest.macros.p))+' γραμμάρια. Αύξησε τις πρωτεΐνες για καλύτερα αποτελέσματα.'});
  }

  // Calorie stability alert
  var avgK=Math.round(plans.map(p=>p.macros.k).reduce((a,b)=>a+b)/plans.length);
  if(Math.abs(latest.macros.k-avgK)>150){
    alerts.push({type:'info',icon:'ℹ️',title:'Kcal σε απόκλιση',msg:'Τα Kcal σου απέχουν '+Math.abs(latest.macros.k-avgK)+' από το μέσο όρο ('+avgK+'). Σκέψου να τα εξισορροπήσεις.'});
  }

  // Consistency alert
  if(plans.length>3){
    var recent=plans.slice(-3).map(p=>p.macros.k);
    var variance=Math.max(...recent)-Math.min(...recent);
    if(variance<50){
      alerts.push({type:'success',icon:'✅',title:'Σταθερή διατροφή',msg:'Τα τελευταία 3 πλάνα είναι πολύ σταθερά (+'+variance+' kcal απόκλιση). Ωραία συνέπεια!'});
    }
  }

  // Carb trend
  if(latest.macros.c>(c.goal==='gain'?180:150)){
    alerts.push({type:'info',icon:'🍞',title:'Υδατάνθρακες υψηλά',msg:'Τα υδατάνθρακες είναι '+latest.macros.c+'g. Είναι κατάλληλα για τον στόχο σου;'});
  }

  return alerts;
}

function generateMealAlternatives(mealName,foodCount){
  // Quick alternatives database
  var alternatives={
    'Κοτόπουλο':['Ψάρι','Γαλοπούλα','Αυγά','Φετα'],
    'Ρύζι':['Ζυμαρικά','Πατάτες','Ψωμί','Κουσκούς'],
    'Μήλο':['Αχλάδι','Πορτοκάλι','Μπανάνα','Φράουλα'],
    'Γιαούρτι':['Κρέμα','Τυρί','Γάλα','Cottage Cheese'],
    'Ελιά':['Ξηρή φρούτα','Σπόροι','Αμύγδαλα','Φυστίκια']
  };

  var result=[];
  for(var key in alternatives){
    if(mealName.includes(key)){
      result=alternatives[key];
      break;
    }
  }

  return result.length>0?result:['Δες τη βιβλιοθήκη τροφίμων για εναλλακτικές'];
}

function generateImprovementTips(c){
  if(!c||!c.savedPlans||c.savedPlans.length===0)return[];

  var tips=[];
  var plans=c.savedPlans;

  // Tip 1: Consistency
  tips.push('💪 Διατήρησε τη συνέπεια: Όσο πιο σταθερά τα macros, τόσο καλύτερα τα αποτελέσματα.');

  // Tip 2: Protein
  if(Math.round(plans.map(p=>p.macros.p).reduce((a,b)=>a+b)/plans.length)<100){
    tips.push('🥚 Αύξησε το πρωτέϊνη: Στόχεψε για 100-120g/day για καλύτερη ανάκαμψη.');
  }

  // Tip 3: Variety
  tips.push('🥗 Ποικιλία τροφίμων: Αλλάζοντας τα φαγητά κάθε εβδομάδα βοηθάει την κόπωση και τη συμμόρφωση.');

  // Tip 4: Tracking
  if(plans.length>5){
    tips.push('📊 Ο tracking δουλεύει: Έχεις '+plans.length+' πλάνα! Συνέχισε έτσι για να δεις αποτελέσματα.');
  }

  // Tip 5: Goal alignment
  if(c.goal==='loss'){
    tips.push('⚖️ Απώλεια βάρους: Διατήρησε τα Kcal 300-500 κάτω από το TDEE σου.');
  } else if(c.goal==='gain'){
    tips.push('💪 Αύξηση μάζας: Πρόσθεσε 300-500 kcal πάνω από το TDEE σου.');
  }

  return tips;
}

// ═══════════════════════════════════════════════════════════════
// PLAN HISTORY HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculatePlanStats(plans){
  if(!plans||plans.length===0)return{count:0,avgK:0,minK:0,maxK:0,avgP:0,minP:0,maxP:0};
  var ks=plans.map(p=>(p.macros&&p.macros.k)||0);
  var ps=plans.map(p=>(p.macros&&p.macros.p)||0);
  return{
    count:plans.length,
    avgK:Math.round(ks.reduce((a,b)=>a+b)/ks.length),
    minK:Math.min(...ks),
    maxK:Math.max(...ks),
    avgP:Math.round(ps.reduce((a,b)=>a+b)/ps.length),
    minP:Math.min(...ps),
    maxP:Math.max(...ps)
  };
}

function loadPlanAsActive(planIndex){
  var c=getC();
  if(!c||!c.savedPlans||!c.savedPlans[planIndex])return;
  var plan=c.savedPlans[planIndex];
  c.weekPlan=deepClone(plan.weekPlan);
  save();
  showSuccessToast('✅ Πλάνο #'+plan.number+' φορτώθηκε! Πήγαινε στο "Εβδομαδιαίο πλάνο" για να το δεις.');
  renderMain();
}

function deletePlanFromHistory(planIndex){
  var c=getC();
  if(!c||!c.savedPlans||!c.savedPlans[planIndex])return;
  showConfirmDialog('Είσαι σίγουρος ότι θέλεις να διαγράψεις το πλάνο #'+c.savedPlans[planIndex].number+';', function(){
    c.savedPlans.splice(planIndex,1);
    save();
    var s4=document.getElementById('s4');
    if(s4)s4.innerHTML=buildPlanHistoryHtml(c);
    console.log('[PLAN HISTORY] Deleted plan at index',planIndex);
  });
}

function duplicatePlan(planIndex){
  var c=getC();
  if(!c||!c.savedPlans||!c.savedPlans[planIndex])return;
  var original=c.savedPlans[planIndex];
  var newPlan={
    id:'plan_'+Date.now(),
    number:c.savedPlans.length+1,
    date:new Date().toISOString().slice(0,10),
    time:new Date().toLocaleTimeString('el-GR'),
    note:'[Αντιγραφή] '+original.note,
    macros:original.macros,
    weekPlan:deepClone(original.weekPlan),
    goal:original.goal,
    dietType:original.dietType
  };
  c.savedPlans.push(newPlan);
  save();
  var s4=document.getElementById('s4');
  if(s4)s4.innerHTML=buildPlanHistoryHtml(c);
  console.log('[PLAN HISTORY] Duplicated plan',planIndex);
}

function buildPlanHistoryHtml(c){
  var dbg='<div style="margin:8px 20px 0;display:flex;justify-content:flex-end">'
    +'<button class="btn tertiary" style="padding:5px 10px;font-size:11px" onclick="recoverSavedPlansFor(\''+esc((c&&c.id)||'')+'\')" title="Ελέγχει αν υπάρχουν πλάνα σε τοπικό backup που λείπουν από το ιστορικό αυτού του πελάτη">🔎 Έλεγχος για χαμένα πλάνα σε backups</button>'
    +'</div>';
  if(!c.savedPlans||c.savedPlans.length===0){
    return dbg+'<div style="padding:20px;text-align:center;color:#999"><div style="font-size:16px;font-weight:600;margin-bottom:10px">📊 Ιστορικό Πλάνων</div><p>Δεν υπάρχουν αποθηκευμένα πλάνα.<br>Πάτησε "Αποθήκευση Διατροφής" για να αποθηκεύσεις το πλάνο</p></div>';
  }
  try{
  return dbg+buildPlanHistoryHtmlInner(c);
  }catch(e){
    console.error('[PLAN HISTORY] Render failed:',e);
    return dbg+'<div style="padding:20px;text-align:center;color:#c62828"><div style="font-size:16px;font-weight:600;margin-bottom:10px">⚠️ Σφάλμα εμφάνισης ιστορικού πλάνων</div><p style="font-size:12px;color:#666">'+esc(e.message)+'</p></div>';
  }
}

function buildPlanHistoryHtmlInner(c){
  var html='<div style="padding:16px 20px"><h2 style="color:#025857;margin-top:0">📊 Ιστορικό Πλάνων ('+c.savedPlans.length+')</h2>';

  // Calculate stats
  var stats=calculatePlanStats(c.savedPlans);

  // ✅ One consolidated card (stats + comparison + trend) instead of 3 separately-colored
  // boxes stacked on top of each other — sections are divided by hairlines, not competing
  // background colors, and deltas use one neutral tone (a higher kcal between two plans
  // isn't inherently "bad" the way red implied) instead of red/green.
  html+='<div style="background:#fff;border:1px solid #e0e0e0;border-left:3px solid #025857;border-radius:8px;padding:14px 16px;margin-bottom:16px">'
    +'<div style="font-weight:700;color:#025857;margin-bottom:8px;font-size:13px">📈 Στατιστικά Πλάνων</div>'
    +'<div style="font-size:12px;line-height:1.8;display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    +'<div>📊 Σύνολο: <strong>'+stats.count+' πλάνα</strong></div>'
    +'<div>📊 Μέσο Kcal: <strong>'+stats.avgK+'</strong> ('+stats.minK+'-'+stats.maxK+')</div>'
    +'<div>📊 Μέσο Protein: <strong>'+stats.avgP+'g</strong> ('+stats.minP+'-'+stats.maxP+'g)</div>'
    +'<div>📊 Τελευταίο: <strong>'+c.savedPlans[c.savedPlans.length-1].date+'</strong></div>'
    +'</div>';

  // Comparison section
  if(c.savedPlans.length>1){
    var prev=c.savedPlans[c.savedPlans.length-2].macros||{k:0,p:0,f:0,c:0};
    var last=c.savedPlans[c.savedPlans.length-1].macros||{k:0,p:0,f:0,c:0};
    var kDiff=last.k-prev.k;
    var pDiff=last.p-prev.p;
    var fDiff=last.f-prev.f;
    html+='<div style="border-top:1px solid #eee;margin-top:12px;padding-top:12px">'
      +'<div style="font-weight:700;color:#025857;margin-bottom:8px;font-size:12px">Σύγκριση Τελευταίων 2 Πλάνων</div>'
      +'<div style="font-size:12px;line-height:1.8;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'
      +'<div>Kcal: '+prev.k+' → '+last.k+' <span style="color:#666;font-weight:600">('+(kDiff>0?'+':'')+kDiff+')</span></div>'
      +'<div>Πρωτεΐνες: '+prev.p+'g → '+last.p+'g <span style="color:#666;font-weight:600">('+(pDiff>0?'+':'')+pDiff+'g)</span></div>'
      +'<div>Λίπος: '+prev.f+'g → '+last.f+'g <span style="color:#666;font-weight:600">('+(fDiff>0?'+':'')+fDiff+'g)</span></div>'
      +'</div></div>';
  }

  // Macro trend visualization
  html+='<div style="border-top:1px solid #eee;margin-top:12px;padding-top:12px">'
    +'<div style="font-weight:700;color:#025857;margin-bottom:8px;font-size:12px">Τάση Macros</div>'
    +'<div style="font-size:11px;line-height:1.6">';
  for(var i=0;i<c.savedPlans.length;i++){
    var plan=c.savedPlans[i];
    plan.macros=plan.macros||{k:0,p:0,f:0,c:0};
    var barWidth=stats.maxK?Math.round((plan.macros.k/stats.maxK)*100):0;
    html+='<div style="margin-bottom:6px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:2px">'
      +'<span>Πλάνο #'+plan.number+':</span>'
      +'<span style="font-weight:600">'+plan.macros.k+' kcal</span>'
      +'</div>'
      +'<div style="background:#e0e0e0;border-radius:3px;height:12px;overflow:hidden">'
      +'<div style="background:#025857;width:'+barWidth+'%;height:100%;"></div>'
      +'</div>'
      +'</div>';
  }
    html+='</div></div>'
    +'</div>';

  // Plans list
  html+='<div style="border-top:1px solid #e0e0e0;padding-top:16px">';
  for(var i=0;i<c.savedPlans.length;i++){
    var plan=c.savedPlans[i];
    var planId='plan-'+i;
    html+='<div style="background:#fafafa;border:1px solid #e0e0e0;border-radius:6px;padding:12px;margin-bottom:12px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
      +'<div style="font-weight:600;color:#025857;font-size:14px">📋 Πλάνο #'+plan.number+'</div>'
      +'<div style="font-size:12px;color:#999">'+plan.date+' '+plan.time+'</div>'
      +'</div>'
      +'<div style="background:#fff;padding:10px;border-radius:4px;font-size:12px;margin-bottom:8px">'
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">'
      +'<div><strong>Kcal:</strong> <span style="color:#025857;font-weight:600">'+plan.macros.k+'</span></div>'
      +'<div><strong>Πρωτ:</strong> <span style="color:#025857;font-weight:600">'+plan.macros.p+'g</span></div>'
      +'<div><strong>Λίπος:</strong> <span style="color:#025857;font-weight:600">'+plan.macros.f+'g</span></div>'
      +'<div><strong>Υδατ:</strong> <span style="color:#025857;font-weight:600">'+plan.macros.c+'g</span></div>'
      +'</div>'
      +(plan.note?'<div style="margin-top:8px;padding:8px;background:#fffbea;border-left:3px solid #ffc107;font-style:italic;color:#666">💬 '+esc(plan.note)+'</div>':'')
      +'</div>'
      // Action buttons — shared .btn classes instead of 4 unrelated hardcoded colors:
      // one primary view action, two secondary utility actions, one danger action.
      +'<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">'
      +'<button class="btn secondary" onclick="loadPlanAsActive('+i+')" style="flex:1;font-size:11px;padding:6px 10px;min-height:auto">📥 Φόρτωση</button>'
      +'<button class="btn secondary" onclick="duplicatePlan('+i+')" style="flex:1;font-size:11px;padding:6px 10px;min-height:auto">📋 Αντιγραφή</button>'
      +'<button class="btn danger" onclick="deletePlanFromHistory('+i+')" style="flex:1;font-size:11px;padding:6px 10px;min-height:auto">🗑️ Διαγραφή</button>'
      +'</div>'
      +'<button class="btn primary" onclick="document.getElementById(\''+planId+'\').style.display=document.getElementById(\''+planId+'\').style.display===\'none\'?\'block\':\'none\'" style="width:100%;font-size:11px;padding:6px 12px;min-height:auto">🍽️ Δες το πλάνο διατροφής</button>'
      +'<div id="'+planId+'" style="display:none;margin-top:10px;padding:10px;background:#f0f8ff;border-radius:4px;border:1px solid #b3e5fc;max-height:400px;overflow-y:auto;font-size:11px">';

    // Show week plan meals
    if(plan.weekPlan){
      var daysOfWeek=['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
      for(var d=0;d<7;d++){
        if(plan.weekPlan[d]){
          html+='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #ccc">'
            +'<strong style="color:#025857">'+daysOfWeek[d]+'</strong><br>';
          for(var mi=0;mi<plan.weekPlan[d].length;mi++){
            var meal=plan.weekPlan[d][mi];
            html+='<div style="margin-top:4px;padding:4px;background:#fff;border-radius:3px">'
              +'<strong>'+meal.name+':</strong> ';
            if(meal.foods){
              var foodNames=[];
              for(var fi=0;fi<meal.foods.length;fi++){
                foodNames.push(meal.foods[fi].n+' ('+meal.foods[fi].g+'g)');
              }
              html+=foodNames.join(', ');
            }
            html+='</div>';
          }
          html+='</div>';
        }
      }
    }

    html+='</div>';
    html+='</div>';
  }
  html+='</div></div>';

  return html;
}

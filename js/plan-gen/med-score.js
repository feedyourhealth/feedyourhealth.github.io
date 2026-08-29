// js/plan-gen/med-score.js
// Mediterranean-diet compliance scoring for a generated week plan, extracted
// verbatim from js/app-part3.js (module split wave 10). Pure: MED_SCORE_RULES +
// the FISH_FOODS / RED_MEAT_FOODS / LEGUME_FOODS / REFINED_GRAINS lookup lists +
// calcMedScore(weekPlan) -> {score, rules} + renderMedScore(weekPlan) -> html.
// No load-time code. Only reads its weekPlan argument + these local lists;
// callers (renderWeekTable in app-part3.js, PREF_PHRASE_MAP in app-part2.js via a
// typeof-guarded RED_MEAT_FOODS ref) are all runtime, so this loads right before
// app-part3.js.

// ── Mediterranean compliance score ────────────────────────────────────────────
// Checks 7 rules on the generated week plan; returns {score, rules}
var MED_SCORE_RULES=[
  {id:'fish',   icon:'🐟', label:'Ψάρι ≥2 ημέρες/εβδ.'},
  {id:'meat',   icon:'🥩', label:'Κόκκινο κρέας ≤2 ημέρες/εβδ.'},
  {id:'leg',    icon:'🫘', label:'Όσπρια ≥2 ημέρες/εβδ.'},
  {id:'egg',    icon:'🥚', label:'Αυγά 2-3x/εβδ. πρωί'},
  {id:'oil',    icon:'🫒', label:'Ελαιόλαδο ≥8g στα κύρια'},
  {id:'salad',  icon:'🥗', label:'Σαλάτα/Λαχανικά ≥5 ημέρες'},
  {id:'grain',  icon:'🌾', label:'Ολικής άλεσης ≥refined'},
  {id:'nuts',   icon:'🌰', label:'Καρύδια/Σπόροι ≥2 ημέρες'},
  {id:'dairy',  icon:'🧀', label:'Τυρί/Γιαούρτι ≥3 ημέρες'}
];
var FISH_FOODS=['Σολομός (ψητός)','Λαβράκι (ψητό)','Τόνος (κονσέρβα)','Σαρδέλες','Τσιπούρα (ψητή)','Γαρίδες (βραστές)','Μπακαλιάρος'];
var RED_MEAT_FOODS=['Βοδινό άπαχο (ψητό)','Βοδινά φιλετάκια','Χοιρινό (μπριζόλα)','Μοσχάρι κιμάς','Αρνί'];
var LEGUME_FOODS=['Φακές','Ρεβίθια','Φασόλια','Μαυρομάτικα','Φάβα'];
var REFINED_GRAINS=['Ρύζι άσπρο (βρ.)','Μακαρόνια (βρ.)','Κριθαράκι (βρ.)','Ψωμί λευκό','Ψωμί προζύμης'];

function calcMedScore(weekPlan){
  var fishDays=new Set(),meatDays=new Set(),legDays=new Set(),eggBrkCount=0;
  var oilMainDays=0,saladMainDays=0,nutsCount=0,dairyDays=new Set();
  var SALAD_INGREDIENTS=['Σαλάτα','Ντομάτες','Αγγούρι','Σπανάκι ωμό','Μαρούλι','Αγκινάρες'];
  var NUTS_SEEDS=['Καρύδια','Αμύγδαλα','Φιστίκια','Σπόροι','Chia seeds','Σουσάμι'];
  var DAIRY=['Γιαούρτι','Τυρί','Φέτα','Μοτσαρέλα','Κεφίρ','Κασέρι'];
  var wholeGrainDays=0,refinedGrainDays=0;

  for(var d=0;d<7;d++){
    var meals=weekPlan[d]||[];
    var dayHasOil=false,dayHasSalad=false,dayHasWhole=false,dayHasRefined=false,dayHasNuts=false,dayHasDairy=false;
    var oilAmount=0;
    meals.forEach(function(meal){
      var isMain=meal.name==='Μεσημεριανό'||meal.name==='Βραδινό';
      var isBrk=meal.name==='Πρωινό';
      (meal.foods||[]).forEach(function(f){
        // Fish & Meat: count DAYS, not occurrences
        if(FISH_FOODS.indexOf(f.n)!==-1)fishDays.add(d);
        if(RED_MEAT_FOODS.indexOf(f.n)!==-1)meatDays.add(d);
        if(LEGUME_FOODS.indexOf(f.n)!==-1)legDays.add(d);
        // Eggs in breakfast: count occurrences
        if(isBrk&&(f.n==='Αυγά (ολόκληρα)'||f.n==='Ασπράδια αυγών'))eggBrkCount++;
        // Oil in main meals: track grams
        if(isMain&&f.n==='Ελαιόλαδο'){oilAmount+=(f.g||0);dayHasOil=true;}
        // Salad/vegetables in main: flexible keywords
        if(isMain&&SALAD_INGREDIENTS.some(function(s){return f.n.indexOf(s)!==-1;}))dayHasSalad=true;
        // Whole vs Refined grains
        if(f.n.indexOf('ολικής')!==-1||f.n.indexOf('κινόα')!==-1||f.n.indexOf('βρώμη')!==-1)dayHasWhole=true;
        if(REFINED_GRAINS.indexOf(f.n)!==-1)dayHasRefined=true;
        // Nuts/Seeds
        if(NUTS_SEEDS.some(function(n){return f.n.indexOf(n)!==-1;})&&(f.g||0)>=20){dayHasNuts=true;nutsCount++;}
        // Dairy products
        if(DAIRY.some(function(d){return f.n.indexOf(d)!==-1;}))dayHasDairy=true;
      });
    });
    if(oilAmount>=8)oilMainDays++;// at least 8g oil in main meals
    if(dayHasSalad)saladMainDays++;
    if(dayHasWhole)wholeGrainDays++;
    if(dayHasRefined)refinedGrainDays++;
    if(dayHasNuts)nutsCount++;
    if(dayHasDairy)dairyDays.add(d);
  }
  var results={
    fish: fishDays.size>=2,
    meat: meatDays.size<=2,
    leg:  legDays.size>=2,
    egg:  eggBrkCount>=2&&eggBrkCount<=3,
    oil:  oilMainDays>=5,
    salad:saladMainDays>=5,
    grain:wholeGrainDays>=refinedGrainDays,
    nuts: nutsCount>=2,
    dairy:dairyDays.size>=3
  };
  var score=Object.keys(results).filter(function(k){return results[k];}).length;
  return{score:score,total:9,results:results};
}

function renderMedScore(weekPlan){
  var s=calcMedScore(weekPlan);
  var pct=Math.round(s.score/s.total*100);
  var scoreColor=pct>=85?'#025857':pct>=57?'#E65100':'#c62828';
  var html='<div id="med-score-bar" style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;flex-wrap:wrap;align-items:center;gap:10px">'
    +'<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">'
    +'<span style="font-size:18px">🫒</span>'
    +'<span style="font-size:11px;font-weight:700;color:#555">Μεσογειακή Βαθμολογία</span>'
    +'<span style="font-size:20px;font-weight:800;color:'+scoreColor+'">'+s.score+'/'+s.total+'</span>'
    +'<span style="font-size:11px;color:'+scoreColor+';font-weight:700">'+pct+'%</span>'
    +'</div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:5px;flex:1">';
  MED_SCORE_RULES.forEach(function(r){
    var ok=s.results[r.id];
    var bg=ok?'#E2EEE5':'#fce4e4';
    var fc=ok?'#025857':'#c62828';
    var border=ok?'#c5ddd8':'#f5c6c6';
    html+='<span style="background:'+bg+';color:'+fc+';border:1px solid '+border+';border-radius:20px;padding:2px 8px;font-size:10px;font-weight:600;white-space:nowrap">'
      +r.icon+' '+r.label+(ok?' ✓':' ✗')+'</span>';
  });
  html+='</div></div>';
  return html;
}


function normalizeBreakfasts(days){
  var result=deepClone(days);
  result.forEach(function(meals,di){
    var brkIdx=-1;
    meals.forEach(function(meal,mi){if(meal.name==='Πρωινό')brkIdx=mi;});
    if(brkIdx===-1)return;
    var meal=meals[brkIdx];
    // Κυριακή: πάντα Pancakes Κυριακής (FYH) — εκτός αν υπάρχουν ήδη
    if(di===6){
      if(!meal.foods.some(function(f){return f.n==='Pancakes Κυριακής (FYH)';}))
        meal.foods=[{n:'Pancakes Κυριακής (FYH)',g:135}];
      return;
    }
    // Skip FYH breakfasts (άλλες μέρες)
    if(meal.foods.some(function(f){return FYH_COMPLETE_MEAL[f.n]||FYH_SNACK_NAMES[f.n];}))return;
    var hasEgg=meal.foods.some(function(f){
      return f.n==='Αυγά (ολόκληρα)'||f.n==='Ασπράδια αυγών';
    });
    var hasYogurt=meal.foods.some(function(f){
      return f.n==='Γιαούρτι 2%'||f.n==='Γιαούρτι 0%'||f.n==='Κεφίρ';
    });
    var fruit=MED_BRK_FRUITS[di%MED_BRK_FRUITS.length];
    if(EGG_DAYS[di]){
      // Egg days → 60% chance Petretzeakis egg recipe, 40% traditional egg breakfast
      if(!hasEgg){
        var usePetretzeakis=Math.random()<0.6;
        if(usePetretzeakis&&PETRETZEAKIS_EGG_RECIPES.length>0){
          var recipe=PETRETZEAKIS_EGG_RECIPES[di%PETRETZEAKIS_EGG_RECIPES.length];
          meal.foods=[{n:recipe.n,g:recipe.g}];
        } else {
          meal.foods=[
            {n:'Πρωινό Αυγών (FYH)',g:200},
            {n:fruit,g:150}
          ];
        }
      }
    } else {
      // Other days → alternate between yogurt and oats Petretzeakis recipes
      if(!hasYogurt){
        var usePetretzeakis=Math.random()<0.7;
        if(usePetretzeakis){
          // 50% yogurt, 50% overnight oats
          var useYogurt=Math.random()<0.5;
          if(useYogurt&&PETRETZEAKIS_YOGURT_RECIPES.length>0){
            var recipe=PETRETZEAKIS_YOGURT_RECIPES[di%PETRETZEAKIS_YOGURT_RECIPES.length];
            meal.foods=[{n:recipe.n,g:recipe.g}];
          } else if(PETRETZEAKIS_OATS_RECIPES.length>0){
            var recipe=PETRETZEAKIS_OATS_RECIPES[di%PETRETZEAKIS_OATS_RECIPES.length];
            meal.foods=[{n:recipe.n,g:recipe.g}];
          } else {
            meal.foods=[
              {n:'Γιαούρτι 2%',g:200},
              {n:'Βρώμη (ωμή)',g:40},
              {n:fruit,g:150},
              {n:'Καρύδια',g:15}
            ];
          }
        } else {
          meal.foods=[
            {n:'Γιαούρτι 2%',g:200},
            {n:'Βρώμη (ωμή)',g:40},
            {n:fruit,g:150},
            {n:'Καρύδια',g:15}
          ];
        }
      }
    }
  });
  return result;
}

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
var REFINED_GRAINS=['Ρύζι άσπρο (βρ.)','Μακαρόνια (βρ.)','Κριθαράκι (βρ.)','Ψωμί λευκό'];

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
  var html='<div id="med-score-bar" style="background:#fff;border:1px solid #e0e0e0;border-radius:10px;padding:10px 14px;margin-bottom:12px;display:flex;flex-wrap:wrap;align-items:center;gap:10px">'
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

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ PHASE 2: CHEF-INSPIRED MEAL GENERATION RULES ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

// ── MEAL-SLOT CLASSIFICATION ───────────────────────────────────────────────
// Categorize a meal by its name so we can match breakfast→breakfast, etc.
function classifyMealSlot(name){
  var n=(name||'').toLowerCase();
  if(n.indexOf('πρωιν')!==-1) return 'breakfast';
  if(n.indexOf('ενδιάμεσ')!==-1 || n.indexOf('ενδιαμεσ')!==-1 ||
     n.indexOf('δεκατιαν')!==-1 || n.indexOf('απογευμ')!==-1 || n.indexOf('snack')!==-1) return 'snack';
  if(n.indexOf('μεσημερ')!==-1) return 'lunch';
  if(n.indexOf('βραδ')!==-1 || n.indexOf('δείπν')!==-1 || n.indexOf('δειπν')!==-1) return 'dinner';
  return 'other';
}

// Stable signature of a meal (sorted food names) — used for variety penalty / dedup
function mealSignature(foods){
  if(!foods || !foods.length) return '';
  return foods.map(function(f){return f.n||'';}).sort().join('|');
}

// ── CROSS-CLIENT TASTE LIBRARY ─────────────────────────────────────────────
// Harvest real, dietitian-made meals from two deliberately-curated sources — clients marked as
// ⭐ "taste templates", and named plan templates saved via "💾 Αποθ. ως πρότυπο" (customTemplates).
// Both represent the same signal ("I vouch for this plan"), so they're pooled into one library.
// Returns combo-shaped objects (same shape as saved combos) tagged with slot+diet,
// so they flow through the existing findSavedComboMatch / genPlan pipeline.
function harvestMealLibrary(excludeClientId){
  var lib=[];
  var seen={};
  function harvestDays(days, idPrefix, dietType, sourceLabel){
    for(var d=0; d<7; d++){
      var day=days[d];
      if(!day || !day.length) continue;
      day.forEach(function(meal){
        if(!meal || !meal.foods || !meal.foods.length) return;
        var sig=mealSignature(meal.foods);
        if(!sig || seen[sig]) return;   // dedup identical meals across days/clients/templates
        var kcal=calculateMealKcal(meal.foods);
        if(kcal<50) return;             // skip empty / trivial meals
        seen[sig]=true;
        lib.push({
          id:idPrefix+'_'+sig.length+'_'+Math.round(kcal),
          name:meal.name||'',
          foods:deepClone(meal.foods),
          kcal:Math.round(kcal),
          mealTiming:meal.mealTiming||'regular',
          slot:classifyMealSlot(meal.name),
          dietType:dietType,
          tags:['library','approved'],
          source:sourceLabel||''
        });
      });
    }
  }
  if(typeof clients!=='undefined' && clients && clients.length){
    clients.forEach(function(cl){
      if(!cl || !cl.isMealTemplate || !cl.weekPlan) return;
      if(excludeClientId && cl.id===excludeClientId) return;
      harvestDays(cl.weekPlan, 'lib_'+cl.id, cl.dietType||'normal', cl.name);
    });
  }
  // Named templates have no dietType field (only a calorie/goal category) — default to 'normal'
  // like unset-dietType clients above, so restrictive-diet clients (vegan/keto/…) correctly skip them.
  if(typeof customTemplates!=='undefined' && customTemplates && customTemplates.length){
    customTemplates.forEach(function(ct){
      if(!ct || !ct.days) return;
      harvestDays(ct.days, 'tmpl_'+ct.id, 'normal', ct.name);
    });
  }
  return lib;
}

// ── MEAL ALTERNATES (client portal swap suggestions) ───────────────────────
// Given a meal, find up to `count` alternative meals of the same slot+diet
// from the cross-client taste library, scaled to the meal's own kcal target.
// `excl` = client's own exclusion/allergy list (lowercased substrings) — a swap
// suggestion pulled from ANOTHER client's library must never contain something
// this client avoids or is allergic to, so it's filtered the same way
// findSavedComboMatch() already filters the main plan generator's candidates.
function findMealAlternates(meal, dietType, excludeClientId, targetKcal, count, excl){
  count = count || 3;
  var mySig = mealSignature(meal.foods);
  var slot = classifyMealSlot(meal.name);
  var lib = harvestMealLibrary(excludeClientId);
  function dietOK(comboDiet){
    if(!dietType || dietType==='normal') return true;
    // Restrictive target diet (vegan/vegetarian/keto/...): an UNTAGGED source is no
    // longer assumed safe. Legacy combos/library entries saved before dietType tagging
    // existed could contain anything — this closed the same leak now confirmed for keto.
    return comboDiet===dietType;
  }
  var exclLower = (excl||[]).map(function(x){return (x||'').toLowerCase();}).filter(Boolean);
  function hasExcludedFood(foods){
    if(!exclLower.length) return false;
    return foods.some(function(food){
      var nameLower=(food.n||'').toLowerCase();
      return exclLower.some(function(excluded){ return nameLower.indexOf(excluded)!==-1; });
    });
  }
  var seen={};
  var cands = lib.filter(function(x){
    if(!x.foods || !x.foods.length) return false;
    var sig = mealSignature(x.foods);
    if(sig===mySig || seen[sig]) return false;
    if(x.slot!=='other' && slot!=='other' && x.slot!==slot) return false;
    if(!dietOK(x.dietType)) return false;
    if(hasExcludedFood(x.foods)) return false;
    seen[sig]=true;
    return true;
  });
  cands.sort(function(a,b){ return Math.abs(a.kcal-targetKcal) - Math.abs(b.kcal-targetKcal); });
  cands = cands.slice(0,count);
  return cands.map(function(x){
    var scaled = scalePlan([{name:x.name,foods:x.foods}], null, [{k:targetKcal}])[0];
    return {name:x.name, foods:scaled.foods};
  });
}

// Find the best matching saved combo / library meal for a target.
// Now slot- and diet-aware, with a variety penalty (usedSigs) to avoid repeats.
function findSavedComboMatch(savedCombos, targetKcal, targetMacros, tolerance, excl, slot, dietType, usedSigs) {
  if(!savedCombos || savedCombos.length === 0) return null;
  tolerance = tolerance || 50; // base ±kcal tolerance
  // Proportional band: meals get scaled afterward, so accept a generous range
  var band = Math.max(tolerance, Math.round((targetKcal||0)*0.30));

  // Normalize exclusion list
  excl = excl || [];
  var exclLower = excl.map(function(x){return (x||'').toLowerCase();});

  // ✅ Helper: Check if combo contains any excluded foods
  function comboHasExcludedFood(foods) {
    return foods.some(function(food){
      var foodNameLower = (food.n||'').toLowerCase();
      return exclLower.some(function(excluded){
        return excluded && foodNameLower.indexOf(excluded) !== -1;
      });
    });
  }
  // Diet compatibility: a restrictive target diet only accepts same-diet sources;
  // 'normal'/undefined target accepts anything. Legacy combos without diet info are
  // NOT assumed safe for a restrictive diet (confirmed leak: untagged combos were
  // matching into keto/vegan/vegetarian plans regardless of actual content).
  function dietOK(comboDiet){
    if(!dietType || dietType==='normal') return true;
    return comboDiet===dietType;
  }

  var best=null, bestScore=Infinity, bestSig=null;
  for(var i = 0; i < savedCombos.length; i++) {
    var combo = savedCombos[i];
    if(!combo || !combo.foods || !combo.foods.length) continue;
    var comboKcal = combo.kcal || 0;
    if(Math.abs(comboKcal - targetKcal) > band) continue;
    // Slot filter: skip only when both slots are known and differ
    if(slot && combo.slot && combo.slot!=='other' && combo.slot!==slot) continue;
    if(!dietOK(combo.dietType)) continue;
    if(comboHasExcludedFood(combo.foods)) continue;
    // Score: closeness to target, nudged by real-world trust (same idea as findBestRecipe's
    // recipeScore — proven meals get a small edge), then a strong penalty for meals already used this week.
    var sig=mealSignature(combo.foods);
    var usedCount=(usedSigs && usedSigs[sig])?usedSigs[sig]:0;
    var trustBonus=getRecipeTrustScore(sig)*targetKcal*0.08;
    var score=Math.abs(comboKcal-targetKcal) - trustBonus + usedCount*100000;
    if(score<bestScore){bestScore=score;best=combo;bestSig=sig;}
  }
  if(!best) return null;
  if(usedSigs && bestSig!=null){usedSigs[bestSig]=(usedSigs[bestSig]||0)+1;}
  return {foods: best.foods, mealTiming: best.mealTiming || 'regular', sig: bestSig};
}

// Calculate kcal for a meal (foods array)
function calculateMealKcal(foods) {
  var total = 0;
  if(!Array.isArray(foods)) return 0;

  foods.forEach(function(f) {
    var macros = cm(f.n, f.g);
    total += macros.k || 0;
  });

  return total;
}

// Ensure food diversity across week (no boring repetition)
function ensureFoodDiversity(weekPlan, maxRepeatPerWeek) {
  maxRepeatPerWeek = maxRepeatPerWeek || 2;
  var foodCount = {};

  // Count food occurrences
  for(var d = 0; d < 7; d++) {
    if(!weekPlan[d]) continue;
    for(var mi = 0; mi < weekPlan[d].length; mi++) {
      var meal = weekPlan[d][mi];
      if(!meal.foods) continue;

      meal.foods.forEach(function(f) {
        foodCount[f.n] = (foodCount[f.n] || 0) + 1;
      });
    }
  }

  // Mark foods that appear too many times
  var overuseFood = {};
  Object.keys(foodCount).forEach(function(foodName) {
    if(foodCount[foodName] > maxRepeatPerWeek) {
      overuseFood[foodName] = true;
    }
  });

  return overuseFood; // Return foods to replace
}

// Trust score for a recipe based on real usage across all clients' plans (TRACKING_DATA.recipes).
// Recipes never used yet get a neutral 0.5 — no penalty for lack of history. Used elsewhere by
// calculateRecipeStats() (app-part4.js) for the Analytics tab too.
function calculateTrustScore(trackingEntry){
  if(!trackingEntry || !trackingEntry.timesUsed) return 0.5;
  var success = 1 - (trackingEntry.regenerateCount||0) / trackingEntry.timesUsed;
  return Math.max(0, Math.min(1, success));
}
function getRecipeTrustScore(recipeId){
  var entry = (typeof TRACKING_DATA!=='undefined' && TRACKING_DATA.recipes) ? TRACKING_DATA.recipes[recipeId] : null;
  return calculateTrustScore(entry);
}

// ── Chef-Inspired Recipe Selection ────────────────────────────────────────────
// Finds the best pre-defined recipe for a meal based on diet type and calories
function findBestRecipe(dietType, targetKcal, mealType, excl){
  // ✅ SNACK DETECTION: If meal name is "Ενδιάμεσο" (Snack), use SNACK_RECIPES
  var isSnack = mealType && mealType.toLowerCase().includes('ενδιάμεσο');
  var recipeDB = isSnack ? SNACK_RECIPES : MEAL_RECIPES;

  if(!recipeDB || !recipeDB.length)return null;

  // Normalize exclusion list (handle both strings and case-sensitivity)
  excl = excl || [];
  var exclLower = excl.map(function(x){return (x||'').toLowerCase();});

  // For snacks, we don't filter by diet type - snacks are universal
  // For main meals, filter recipes by diet type (look for matching tags)
  var dietTagMap={
    'normal':['Mediterranean','Ελληνικό','Ψάρι','Κρέας'],
    'vegan':['Vegan'],
    'vegetarian':['Vegetarian'],
    'keto':['Keto','LowCarb'],
    'orthodox_fasting':['Vegan'],
    'intermittent_fasting':['Mediterranean'],
    'bodybuilding_clean':['bodybuilding_clean','high_protein','lean_meat']
  };

  var dietTags = isSnack ? [] : (dietTagMap[dietType]||[]);

  // ✅ Helper: Check if recipe contains any excluded foods
  function recipeHasExcludedFood(recipe){
    return recipe.foods.some(function(food){
      var foodNameLower = (food.n||'').toLowerCase();
      return exclLower.some(function(excluded){
        return foodNameLower.indexOf(excluded) !== -1;
      });
    });
  }

  // ✅ MEAL-TIME CATEGORY: which of the 4 dietitian-assigned categories this slot needs (null = not recognized, no constraint).
  var mealCategory = (typeof mealTypeToCategory==='function') ? mealTypeToCategory(mealType) : null;
  function matchesBase(recipe){
    var dietMatch = isSnack ? true : (dietTags.some(function(tag){return recipe.tags.indexOf(tag)!==-1;}));
    var calMatch=(recipe.kcal >= targetKcal*0.80) && (recipe.kcal <= targetKcal*1.20);
    var noExcludedFoods = !recipeHasExcludedFood(recipe);
    return dietMatch && calMatch && noExcludedFoods;
  }
  // Untagged recipes (the vast majority, today) count as "any meal" — no regression for anyone who hasn't categorized recipes yet.
  function matchesMealTime(recipe){
    if(!mealCategory) return true;
    var mt=(typeof getRecipeMealTimes==='function') ? getRecipeMealTimes(recipe) : (recipe.mealTimes||[]);
    return !mt.length || mt.indexOf(mealCategory)>-1;
  }

  // Find recipes that match diet type AND are close to target calories (within 80-120%) AND don't contain excluded foods AND fit the meal-time slot
  var candidates=recipeDB.filter(function(recipe){ return matchesBase(recipe) && matchesMealTime(recipe); });

  // Safety net: if meal-time tagging leaves nothing for this slot (e.g. too narrow for this diet+calorie bracket), fall back to ignoring it rather than returning no recipe at all.
  if(!candidates.length){
    candidates=recipeDB.filter(matchesBase);
  }

  if(!candidates.length)return null;

  // Rank by calorie closeness, nudged by real-world trust (proven recipes vs. ones that keep getting
  // regenerated away). Trust can only sway ~8% of targetKcal worth of ranking — within the 80-120%
  // calorie window already filtered above, a spot-on but untrusted recipe still beats a borderline
  // one that merely has a perfect track record.
  function recipeScore(r){
    var calDiff = Math.abs(r.kcal-targetKcal);
    var trustBonus = getRecipeTrustScore(r.id) * targetKcal * 0.08;
    return calDiff - trustBonus;
  }
  candidates.sort(function(a,b){
    return recipeScore(a) - recipeScore(b);
  });

  var best=candidates[0];
  return{
    foods:deepClone(best.foods),
    name:best.name,
    tags:best.tags,
    originalKcal:best.kcal,
    recipeId:best.id
  };
}

// Smart meal generation with pairing rules + saved combos + BREAKFAST CONSTRAINTS
function generateSmartMeal(targetKcal, targetMacros, day, savedCombos, mealName, excl, dietType) {
  // Normalize exclusion list
  excl = excl || [];
  var exclLower = excl.map(function(x){return (x||'').toLowerCase();});

  // ✅ Helper: Check if food is excluded
  function isExcluded(foodName) {
    var foodLower = (foodName||'').toLowerCase();
    return exclLower.some(function(excluded){
      return foodLower.indexOf(excluded) !== -1;
    });
  }

  // Priority 1: Check saved combos first (respecting food exclusions, slot & diet)
  var mealFromSaved = findSavedComboMatch(savedCombos, targetKcal, targetMacros, 60, excl, classifyMealSlot(mealName), dietType);
  if(mealFromSaved) {
    return mealFromSaved;
  }

  // Priority 2: Build from pairing rules - with meal-type AND diet-type awareness
  var isBreakfast = mealName && mealName.toLowerCase().includes('πρωινό');
  var isSnack = mealName && mealName.toLowerCase().includes('ενδιάμεσο');
  dietType = dietType || 'normal';

  var proteins = Object.keys(FOODS).filter(function(f) {
    // Skip excluded foods
    if(isExcluded(f)) return false;

    var isMeat = FOODS[f].cat === 'Κρέας';
    var isFish = FOODS[f].cat === 'Ψάρια';
    var isLegume = FOODS[f].cat === 'Όσπρια';
    // Μόνο τυριά/αυγά κατάλληλα ως κύρια πρωτεΐνη γεύματος (όχι γάλα/σκόνη/ροφήματα)
    var MAIN_DAIRY={'Τυρί φέτα':1,'Χαλλούμι (ψητό)':1,'Χαλλούμι (ωμό)':1,'Γιαούρτι 2%':1,'Cottage cheese':1,'Ανθότυρο':1,'Μυζήθρα':1,'Αυγά (ολόκληρα)':1,'Ασπράδια αυγών':1};
    var isDairy = (FOODS[f].cat === 'Αυγά/Γαλακτ.') && MAIN_DAIRY[f]===1;
    var isProtein = isMeat || isFish || isLegume || isDairy;

    if(!isProtein) return false;

    // ✅ DIET-TYPE FILTERING: Respect dietary restrictions
    if(dietType === 'vegan') {
      // Vegan: ONLY legumes
      return isLegume;
    } else if(dietType === 'vegetarian') {
      // Vegetarian: legumes + dairy (no meat/fish)
      return isLegume || isDairy;
    } else if(dietType === 'orthodox_fasting') {
      // Orthodox fasting: ONLY legumes (no meat/fish/dairy)
      return isLegume;
    }
    // Normal, keto, bodybuilding_clean: allow all proteins

    // For breakfast: exclude heavy meats
    if(isBreakfast && !BREAKFAST_FOODS.is_breakfast_appropriate(f)) {
      return false;
    }

    // For snacks (Ενδιάμεσο): exclude ALL proteins - snacks should not be protein meals
    if(isSnack) {
      return false;
    }

    return true;
  });

  var carbs = Object.keys(FOODS).filter(function(f) {
    // Skip excluded foods
    if(isExcluded(f)) return false;

    // ✅ CRITICAL: Βρώμη ONLY in breakfast, NEVER in lunch/dinner
    var isOats = f.toLowerCase().includes('βρώμη');
    if(isOats && !isBreakfast) return false;

    return FOODS[f].cat === 'Δημητριακά';
  });

  // Αρωματικά που είναι μεν 'Λαχανικά' αλλά ΔΕΝ πρέπει να μπαίνουν ως κύριο λαχανικό 150g
  var AROMATIC_VEG={'Σκόρδο':1,'Κρεμμύδι':1,'Κρεμμυδάκι (φρέσκο)':1};
  // Αμυλούχα/καλαμπόκι: λειτουργούν ως υδατάνθρακας, όχι ως «λαχανικό συνοδευτικό»
  var STARCHY_VEG={'Καλαμπόκι (ολόκληρο στον ατμό 200g)':1,'Καλαμπόκι (ολόκληρο στον ατμό 400g - Halvatzis)':1};
  var KETO_STARCH={'Πατάτες':1,'Γλυκοπατάτα':1};
  var veggies = Object.keys(FOODS).filter(function(f) {
    // Skip excluded foods
    if(isExcluded(f)) return false;
    if(AROMATIC_VEG[f] || STARCHY_VEG[f]) return false;
    if(dietType==='keto' && KETO_STARCH[f]) return false; // keto: όχι αμυλούχα
    return FOODS[f].cat === 'Λαχανικά';
  });

  // ── CHEF PAIRING ENGINE: συνδυάζει με βάση γεύση, βότανα & σάλτσα ──
  // Helper: pairing entry για ένα τρόφιμο (άμεσα ή μέσω alias)
  function pairOf(name){ return FOOD_PAIRING_DB[name] || FOOD_PAIRING_DB[resolveFood(name)] || null; }
  // Helper: συγκρούεται το candidate με τη λίστα avoid; (ασαφές match)
  function clashes(candidate, avoidList){
    if(!avoidList||!avoidList.length) return false;
    var c=(candidate||'').toLowerCase();
    return avoidList.some(function(a){ a=(a||'').toLowerCase(); return a && (c.indexOf(a)!==-1 || a.indexOf(c)!==-1); });
  }
  // Helper: πόσο ταιριάζει το candidate με τις προτιμήσεις (ασαφές match)
  function pairScore(candidate, prefList){
    if(!prefList||!prefList.length) return 0;
    var c=(candidate||'').toLowerCase(), s=0;
    prefList.forEach(function(p){ p=(p||'').toLowerCase(); if(p && (c.indexOf(p)!==-1||p.indexOf(c)!==-1)) s++; });
    return s;
  }
  // Helper: διάλεξε το καλύτερο από λίστα, με εναλλαγή ανά ημέρα για ποικιλία
  function pickPaired(list, prefList, avoidList, seed){
    if(!list||!list.length) return null;
    var ranked = list.filter(function(x){ return !clashes(x, avoidList); });
    if(!ranked.length) ranked = list.slice();
    ranked.sort(function(a,b){ return pairScore(b,prefList)-pairScore(a,prefList); });
    var top = pairScore(ranked[0],prefList);
    var pool = ranked.filter(function(x){ return pairScore(x,prefList)===top; });
    if(pool.length<2) pool = ranked.slice(0, Math.min(4, ranked.length));
    return pool[seed % pool.length];
  }

  if(proteins.length > 0 && carbs.length > 0 && veggies.length > 0) {
    var meal = {foods: []};

    // 1) ΠΡΩΤΕΪΝΗ: εναλλαγή σε όλη τη λίστα για μέγιστη ποικιλία
    var selectedProtein = proteins[day % proteins.length];
    var pP = pairOf(selectedProtein);
    var pref = pP ? pP.best_pairings : [];
    var avoid = pP ? pP.avoid_with : [];
    var protCat = FOODS[selectedProtein] ? FOODS[selectedProtein].cat : '';

    // 2) ΥΔΑΤΑΝΘΡΑΚΑΣ: προτίμησε αυτόν που ταιριάζει, απόφυγε συγκρούσεις
    var selectedCarb = pickPaired(carbs, pref, avoid, day);
    // Legacy safety: ποτέ κοτόπουλο + βρώμη
    if(selectedCarb && selectedProtein.toLowerCase().includes('κοτόπουλο') && selectedCarb.toLowerCase().includes('βρώμη')){
      var altC = carbs.filter(function(x){return !x.toLowerCase().includes('βρώμη');});
      selectedCarb = altC.length ? pickPaired(altC, pref, avoid, day) : null;
    }

    // 3) ΛΑΧΑΝΙΚΟ: προτίμησε αυτό που ταιριάζει με την πρωτεΐνη
    var selectedVeg = pickPaired(veggies, pref, avoid, day+1) || veggies[day % veggies.length];

    // KETO: χωρίς δημητριακά — περισσότερο λαχανικό/λιπαρά + αβοκάντο
    var gVeg = 150, gOil = 8;
    if(dietType==='keto'){ selectedCarb=null; gVeg=200; gOil=16; }

    // 4) ΔΥΝΑΜΙΚΕΣ ΜΕΡΙΔΕΣ: κλιμάκωση πρωτεΐνης+υδατ. ώστε να πιάσουμε τις θερμίδες
    var gProt = 160, gCarb = selectedCarb ? 120 : 0;
    if(targetKcal && targetKcal>0){
      var fixedK = cm(selectedVeg,gVeg).k + cm('Ελαιόλαδο',gOil).k;
      if(dietType==='keto' && FOODS['Αβοκάντο'] && !isExcluded('Αβοκάντο')) fixedK += cm('Αβοκάντο',60).k;
      var varK0 = cm(selectedProtein,gProt).k + (selectedCarb?cm(selectedCarb,gCarb).k:0);
      if(varK0>0){
        var factor = (targetKcal - fixedK) / varK0;
        factor = Math.max(0.45, Math.min(2.6, factor));
        gProt = Math.round(gProt*factor);
        if(selectedCarb) gCarb = Math.round(gCarb*factor);
      }
      gProt = Math.max(80, Math.min(320, gProt));
      if(selectedCarb) gCarb = Math.max(30, Math.min(300, gCarb));
    }

    meal.foods.push({n: selectedProtein, g: gProt});
    if(selectedCarb && gCarb>0) meal.foods.push({n: selectedCarb, g: gCarb});
    meal.foods.push({n: selectedVeg, g: gVeg});
    if(dietType==='keto' && FOODS['Αβοκάντο'] && !isExcluded('Αβοκάντο')) meal.foods.push({n:'Αβοκάντο',g:60});

    // 5) ΑΡΩΜΑΤΙΚΟ ΒΟΤΑΝΟ (μικρή ποσότητα, μεγάλη γεύση)
    var herbName=null;
    if(pP && pP.aromatic_herbs && pP.aromatic_herbs.length){
      var hk = pP.aromatic_herbs[day % pP.aromatic_herbs.length];
      herbName = HERB_FOOD_MAP[(hk||'').toLowerCase()] || null;
    }
    if(herbName && FOODS[herbName] && !isExcluded(herbName)) meal.foods.push({n: herbName, g: 3});

    // 6) ΣΑΛΤΣΑ / ΦΙΝΙΡΙΣΜΑ ώστε το πιάτο να μην είναι «γυμνό»
    var sauceList = SAUCE_DB[protCat] || SAUCE_DB['Κρέας'];
    if(/tofu|edamame/i.test(selectedProtein)) sauceList = SAUCE_DB['_asian'];
    if(sauceList && sauceList.length){
      var sc = sauceList[day % sauceList.length];
      if(sc && FOODS[sc.n] && !isExcluded(sc.n)) meal.foods.push({n: sc.n, g: sc.g});
    }

    // 7) Ελαιόλαδο για ισορροπία υγιεινών λιπαρών
    meal.foods.push({n: 'Ελαιόλαδο', g: gOil});

    return meal;
  }

  // Fallback: Return null (will use template-based)
  return null;
}

// ✅ SAFETY: Remove Oats from main meals (lunch/dinner) - Βρώμη only belongs in breakfast
function removeOatsFromMainMeals(tmplDays) {
  for(var d=0; d<7; d++) {
    for(var mi=0; mi<tmplDays[d].length; mi++) {
      var meal = tmplDays[d][mi];
      var mealName = (meal.name || '').toLowerCase();

      // Skip breakfast meals - oats are allowed there
      if(mealName.includes('πρωινό')) continue;

      // For lunch/dinner, remove oats completely
      if(meal.foods && meal.foods.length > 0) {
        meal.foods = meal.foods.filter(function(food) {
          var foodLower = (food.n || '').toLowerCase();
          // Remove if contains 'βρώμη'
          return !foodLower.includes('βρώμη');
        });
      }
    }
  }
  return tmplDays;
}

// ✅ Reorder meals to standard sequence: Πρωινό → Ενδιάμεσο → Μεσημεριανό → Ενδιάμεσο → Βραδινό
function reorderMealsToStandardSequence(tmplDays){
  var reorderedDays=[];
  tmplDays.forEach(function(day){
    var newDay=[];
    var breakfast=day.find(function(m){return m.name.includes('Πρωινό');});
    var lunch=day.find(function(m){return m.name.includes('Μεσημεριανό');});
    var snacks=day.filter(function(m){return m.name.includes('Ενδιάμεσο');});
    var dinner=day.find(function(m){return m.name.includes('Βραδινό');});
    if(breakfast)newDay.push(breakfast);
    if(snacks&&snacks.length>0)newDay.push(snacks[0]); // First snack (between breakfast and lunch)
    if(lunch)newDay.push(lunch);
    if(snacks&&snacks.length>1)newDay.push(snacks[1]); // Second snack (between lunch and dinner)
    if(dinner)newDay.push(dinner);
    if(newDay.length===0)newDay=day;
    reorderedDays.push(newDay);
  });
  return reorderedDays;
}

// Helper function: Clone and scale a client's plan as basis
function cloneAndScaleClientPlan(baseCId, newClient, newTDEE) {
  console.log('=== cloneAndScaleClientPlan DEBUG ===');
  console.log('Looking for base client ID:', baseCId);
  console.log('All clients:', clients);

  var baseClient=null;
  clients.forEach(function(cl){
    console.log('Checking client:', cl.name, 'ID:', cl.id, 'weekPlan keys:', Object.keys(cl.weekPlan||{}));
    if(cl.id===baseCId)baseClient=cl;
  });

  console.log('Found baseClient:', baseClient);
  if(baseClient)console.log('baseClient.weekPlan:', baseClient.weekPlan);

  if(!baseClient){
    console.warn('Basis client not found!');
    return null;
  }

  // Check if weekPlan has actual meal data (could be {} or {0: [...], 1: [...], etc})
  var hasWeekPlan = baseClient.weekPlan && (Object.keys(baseClient.weekPlan).length > 0 || baseClient.weekPlan[0]);
  if(!hasWeekPlan){
    console.warn('Basis client has no weekPlan data!');
    console.log('baseClient.weekPlan:', baseClient.weekPlan);
    return null;
  }

  // Calculate TDEE ratio for scaling
  var baseTDEE=calcTDEE(baseClient);
  console.log('Base TDEE:', baseTDEE.target, '| New TDEE:', newTDEE.target);
  var tdeeRatio=newTDEE.target / (baseTDEE.target||1);
  console.log('TDEE Ratio:', tdeeRatio);

  // Deep clone the base client's weekPlan and scale portions
  var scaledPlan={};
  for(var d=0;d<7;d++){
    if(!baseClient.weekPlan[d])continue;
    scaledPlan[d]=[];
    baseClient.weekPlan[d].forEach(function(meal){
      var newMeal={
        name:meal.name,
        foods:[]
      };
      if(meal.mealTiming)newMeal.mealTiming=meal.mealTiming;
      if(meal.recipeId)newMeal.recipeId=meal.recipeId;

      // Scale food portions by TDEE ratio
      if(meal.foods&&meal.foods.length>0){
        meal.foods.forEach(function(food){
          var scaledFood={
            n:food.n,
            g:Math.round(food.g * tdeeRatio)
          };
          newMeal.foods.push(scaledFood);
        });
      }
      scaledPlan[d].push(newMeal);
    });
  }

  console.log('Cloned and scaled plan:', scaledPlan);
  console.log('Scaled plan day 0 meals:', scaledPlan[0] ? scaledPlan[0].length + ' meals' : 'No day 0');
  return scaledPlan;
}

// ✅ FOOD DISTRIBUTION CONSTRAINTS - Nutritionist Guidelines
const NUTRITION_CONSTRAINTS = {
  fish: { min: 2, max: 3, perWeek: true, name: '🐟 Ψάρι' },           // 2-3x/εβδ
  redMeat: { min: 2, max: 2, perWeek: true, name: '🥩 Κόκκινο κρέας' }, // ακριβώς 2x
  legumes: { min: 2, max: 7, perWeek: true, name: '🫘 Όσπρια' },     // ≥2 ημέρες
  eggs: { min: 2, max: 3, perWeek: true, onlyBreakfast: true, name: '🥚 Αυγά' }, // πρωί
  oliveOil: { min: 8, grams: true, inMainMeals: true, name: '🫒 Ελαιόλαδο' }, // ≥8g κύρια
  vegetables: { min: 5, perWeek: true, name: '🥗 Σαλάτα/Λαχανικά' }, // ≥5 ημέρες
  wholegrains: { minRatio: 0.7, name: '🌾 Ολικής άλεσης' },          // ≥70%
  nutsSeeds: { min: 2, perWeek: true, name: '🌰 Καρύδια/Σπόροι' },   // ≥2 ημέρες
  dairy: { min: 3, perWeek: true, name: '🧀 Τυρί/Γιαούρτι' }         // ≥3 ημέρες
};

// Food category mapping
const FOOD_CATEGORIES = {
  fish: ['ψάρι', 'σολομός', 'τόνος', 'σαρδέλες', 'φάσολος', 'μαυρίδα', 'λαβράκι', 'χταπόδι', 'καλαμάρι'],
  redMeat: ['κόκκινο κρέας', 'βοδινό', 'μοσχάρι', 'χοιρινό', 'αρνί', 'κρέας αρνιού', 'αρνάκι', 'παϊδάκια', 'σουβλάκι'],
  legumes: ['φακές', 'όσπρια', 'φασόλια', 'φασόλια κόκκινες', 'κίχος', 'ρεβίθια', 'φάβα'],
  eggs: ['αυγό', 'αυγά'],
  vegetables: ['σαλάτα', 'λαχανικά', 'παντζάρι', 'ζαχαρότευτλο', 'τομάτα', 'αγγούρι', 'πιπέρια', 'μαρούλι'],
  wholegrains: ['ολικής άλεσης', 'ολικό', 'ψωμί ολικής', 'ρύζι ολικής', 'κριθαράκι ολικής'],
  nutsSeeds: ['καρύδια', 'σπόροι', 'αμύγδαλα', 'φυστίκια', 'ηλιόσποροι', 'σουσάμι'],
  dairy: ['τυρί', 'γιαούρτι', 'γάλα', 'κρέμα']
};

// Count food frequency in weekly plan
function countFoodFrequency(weekPlan) {
  var counts = {
    fish: 0, redMeat: 0, legumes: 0, eggs: 0, vegetables: 0,
    wholegrains: 0, nutsSeeds: 0, dairy: 0, oliveOilMeals: 0
  };
  var mealCount = 0;

  for(var d=0; d<7; d++) {
    if(!weekPlan[d]) continue;
    for(var mi=0; mi<weekPlan[d].length; mi++) {
      var meal = weekPlan[d][mi];
      if(!meal.foods) continue;

      var dayHasFish = false, dayHasRedMeat = false, dayHasLegumes = false;
      var dayHasEggs = false, dayHasVeg = false, dayHasWholeGrains = false;
      var dayHasNuts = false, dayHasDairy = false;
      var mealHasOliveOil = false;

      for(var fi=0; fi<meal.foods.length; fi++) {
        var food = meal.foods[fi];
        var foodName = (food.n || '').toLowerCase();

        // Check fish
        if(FOOD_CATEGORIES.fish.some(f => foodName.includes(f))) { dayHasFish = true; }
        // Check red meat
        if(FOOD_CATEGORIES.redMeat.some(f => foodName.includes(f))) { dayHasRedMeat = true; }
        // Check legumes
        if(FOOD_CATEGORIES.legumes.some(f => foodName.includes(f))) { dayHasLegumes = true; }
        // Check eggs
        if(FOOD_CATEGORIES.eggs.some(f => foodName.includes(f))) { dayHasEggs = true; }
        // Check vegetables
        if(FOOD_CATEGORIES.vegetables.some(f => foodName.includes(f))) { dayHasVeg = true; }
        // Check whole grains
        if(FOOD_CATEGORIES.wholegrains.some(f => foodName.includes(f))) { dayHasWholeGrains = true; }
        // Check nuts/seeds
        if(FOOD_CATEGORIES.nutsSeeds.some(f => foodName.includes(f))) { dayHasNuts = true; }
        // Check dairy
        if(FOOD_CATEGORIES.dairy.some(f => foodName.includes(f))) { dayHasDairy = true; }
        // Check olive oil in main meals
        if(foodName.includes('ελαιόλαδο') || foodName.includes('olive oil')) {
          if((food.g || 0) >= 8 && (meal.mealTiming === 'Lunch' || meal.mealTiming === 'Dinner')) {
            mealHasOliveOil = true;
          }
        }
      }

      // Increment day counts (count each day max once)
      if(dayHasFish) counts.fish++;
      if(dayHasRedMeat) counts.redMeat++;
      if(dayHasLegumes) counts.legumes++;
      if(dayHasEggs) counts.eggs++;
      if(dayHasVeg) counts.vegetables++;
      if(dayHasWholeGrains) counts.wholegrains++;
      if(dayHasNuts) counts.nutsSeeds++;
      if(dayHasDairy) counts.dairy++;
      if(mealHasOliveOil) counts.oliveOilMeals++;
      mealCount++;
    }
  }

  return counts;
}

// Validate if food distribution meets constraints
function validateFoodDistribution(weekPlan) {
  var counts = countFoodFrequency(weekPlan);
  var violations = [];

  // Check fish: 2-3x/week
  if(counts.fish < 2) violations.push('❌ Ψάρι: ' + counts.fish + ' (χρειάζεται 2-3)');
  if(counts.fish > 3) violations.push('❌ Ψάρι: ' + counts.fish + ' (μέγιστο 3)');

  // Check red meat: exactly 2x
  if(counts.redMeat !== 2) violations.push('❌ Κόκκινο κρέας: ' + counts.redMeat + ' (πρέπει ακριβώς 2)');

  // Check legumes: ≥2
  if(counts.legumes < 2) violations.push('❌ Όσπρια: ' + counts.legumes + ' (χρειάζεται ≥2)');

  // Check eggs: 2-3x
  if(counts.eggs < 2) violations.push('❌ Αυγά: ' + counts.eggs + ' (χρειάζεται 2-3)');
  if(counts.eggs > 3) violations.push('❌ Αυγά: ' + counts.eggs + ' (μέγιστο 3)');

  // Check vegetables: ≥5
  if(counts.vegetables < 5) violations.push('❌ Λαχανικά: ' + counts.vegetables + ' (χρειάζεται ≥5)');

  // Check nuts: ≥2
  if(counts.nutsSeeds < 2) violations.push('❌ Καρύδια/Σπόροι: ' + counts.nutsSeeds + ' (χρειάζεται ≥2)');

  // Check dairy: ≥3
  if(counts.dairy < 3) violations.push('❌ Τυρί/Γιαούρτι: ' + counts.dairy + ' (χρειάζεται ≥3)');

  // Positive feedback
  var passes = [];
  if(counts.fish >= 2 && counts.fish <= 3) passes.push('✓ Ψάρι: ' + counts.fish);
  if(counts.redMeat === 2) passes.push('✓ Κόκκινο κρέας: 2');
  if(counts.legumes >= 2) passes.push('✓ Όσπρια: ' + counts.legumes);
  if(counts.eggs >= 2 && counts.eggs <= 3) passes.push('✓ Αυγά: ' + counts.eggs);
  if(counts.vegetables >= 5) passes.push('✓ Λαχανικά: ' + counts.vegetables);
  if(counts.nutsSeeds >= 2) passes.push('✓ Καρύδια: ' + counts.nutsSeeds);
  if(counts.dairy >= 3) passes.push('✓ Τυρί/Γιαούρτι: ' + counts.dairy);

  return {
    isValid: violations.length === 0,
    violations: violations,
    passes: passes,
    counts: counts
  };
}

// Display food distribution validation results
function displayFoodDistributionResults(validation) {
  var html = '<div style="background:#f0f8f7;padding:12px;border-radius:8px;margin:10px 0;border-left:4px solid #025857;">';
  html += '<strong>📊 Διατροφική Κατανομή Γευμάτων:</strong><br>';

  if(validation.passes.length > 0) {
    html += '<div style="color:#2e7d3e;font-size:11px;line-height:1.6;">' + validation.passes.join('<br>') + '</div>';
  }

  if(validation.violations.length > 0) {
    html += '<div style="color:#c62828;font-size:11px;margin-top:6px;line-height:1.6;">' + validation.violations.join('<br>') + '</div>';
  } else {
    html += '<div style="color:#2e7d3e;font-weight:600;margin-top:6px;">✓ Όλα τα κριτήρια ικανοποιούνται!</div>';
  }

  html += '</div>';
  return html;
}

// ✅ PHASE 4: GENERATE PLAN WITH UNDO/REDO WRAPPER
function genPlanWithUndo(){
  var c=getC();if(!c)return;
  var errors=validateClientData(c);
  if(errors.length>0){ showValidationErrors(errors); return; }

  // ✅ Εγκυμοσύνη: συνδυασμοί υψηλού κινδύνου (π.χ. κετογονική+έγκυος) χρειάζονται ρητή επιβεβαίωση
  // της διαιτολόγου πριν τη δημιουργία πλάνου — δεν μπλοκάρουμε απόλυτα γιατί μπορεί να υπάρχει
  // ιατρικά επιβλεπόμενη εξαίρεση, αλλά δεν προχωράμε σιωπηλά.
  var pregFlags=(typeof getPregnancySafetyFlags==='function')?getPregnancySafetyFlags(c):[];
  var blockFlags=pregFlags.filter(function(f){return f.level==='block';});
  if(blockFlags.length>0){
    var msg='🚫 '+blockFlags.map(function(f){return f.msg;}).join('\n\n')+'\n\nΘέλεις να συνεχίσεις ούτως ή άλλως (π.χ. υπό ιατρική παρακολούθηση);';
    showConfirmDialog(msg, function(){ _genPlanWithUndoProceed(c); }, {icon:'🚫', confirmLabel:'Συνέχεια ούτως ή άλλως'});
    return;
  }
  var warnFlags=pregFlags.filter(function(f){return f.level==='warn';});
  if(warnFlags.length>0 && typeof showErrorToast==='function'){
    showErrorToast('⚠️ '+warnFlags[0].msg);
  }
  _genPlanWithUndoProceed(c);
}

function _genPlanWithUndoProceed(c){
  var oldPlan = deepClone(c.weekPlan);
  if(window.undoRedoManager && typeof GeneratePlanCommand !== 'undefined'){
    var cmd = new GeneratePlanCommand(c, oldPlan);
    window.undoRedoManager.execute(cmd);
  } else {
    genPlan();
  }
}

function genPlan(){
  try{
  var c=getC();if(!c)return;var t=calcTDEE(c);c.weekPlan={};

  // ⚕️ Active medical protocols (e.g. Διαβήτης, Χοληστερόλη) contribute their avoidFoods to the exclusion list below —
  // union across every active protocol, so multiple simultaneous conditions are each respected.
  var protocolAvoidFoods=(typeof getProtocolAvoidFoods==='function')?getProtocolAvoidFoods(c):[];

  // Check if basis plan is from an existing client
  var isClientPlan=c.selectedTemplate && c.selectedTemplate.indexOf('__client_')===0;
  if(isClientPlan){
    var baseCId=c.selectedTemplate.replace('__client_','');
    console.log('Attempting to clone plan from client:', baseCId);
    var clonedPlan=cloneAndScaleClientPlan(baseCId, c, t);
    console.log('Cloned plan result:', clonedPlan);
    if(clonedPlan){
      c.weekPlan=clonedPlan;
      // Apply food exclusions to the cloned plan
      var excl=c.foodExclude||[];
      protocolAvoidFoods.forEach(function(food){ if(excl.indexOf(food)===-1) excl.push(food); });
      if(excl.length>0){
        for(var d=0;d<7;d++){
          if(c.weekPlan[d]){
            for(var mi=0;mi<c.weekPlan[d].length;mi++){
              var meal=c.weekPlan[d][mi];
              if(meal.foods&&meal.foods.length>0){
                meal.foods=meal.foods.filter(function(food){
                  var foodName=food.n||'';
                  return excl.indexOf(foodName)===-1 && excl.indexOf(foodName.toLowerCase())===-1;
                });
              }
            }
          }
        }
      }
      // Final scaling to match exact daily targets
      var eff=getDayTgtEff(c,t);
      for(var d=0;d<7;d++){
        if(c.weekPlan[d] && c.weekPlan[d].length > 0){
          c.weekPlan[d]=scalePlan(c.weekPlan[d],eff[d]);
        }
      }
      c.planGeneratedAt=Date.now();  // ✅ ώστε να ξέρουμε πότε "λήγει" (χρειάζεται ανανέωση) το πλάνο
      saveNow();  // Save immediately, not delayed
      renderWeekTable();
      swTab(2);
      return;
    }
  }

  // Original template-based plan generation
  // Build template key: dietType_goal (e.g., 'vegetarian_loss') or just goal (e.g., 'loss')
  console.log('CLIENT DATA:', {dietType: c.dietType, goal: c.goal, selectedTemplate: c.selectedTemplate});
  console.log('AVAILABLE TEMPLATES IN TMPLS:', Object.keys(TMPLS));

  var templateKey = (c.dietType && c.dietType !== 'normal') ? (c.dietType + '_' + c.goal) : c.goal;
  console.log('Template lookup - templateKey:', templateKey, 'dietType:', c.dietType, 'goal:', c.goal);

  var tmpl=TMPLS[templateKey]||TMPLS[c.dietType]||TMPLS[c.goal]||TMPLS.maintain;
  console.log('Template found (tmpl):', tmpl ? 'YES - has ' + (tmpl.length || '?') + ' days' : 'NO - tmpl is', tmpl);

  if(!tmpl){
    throw new Error('Δεν υπάρχει κατάλληλο πρότυπο για dietType=' + c.dietType + ' goal=' + c.goal);
  }

  if(c.selectedTemplate){
    console.log('Custom template selected:', c.selectedTemplate);
    if(c.selectedTemplate.indexOf('__kcal_')===0){
      var kcalKey=c.selectedTemplate.replace('__kcal_','');
      if(TMPLS[kcalKey])tmpl=TMPLS[kcalKey];
    } else {
      var ct=null;
      customTemplates.forEach(function(x){if(x.id===c.selectedTemplate)ct=x;});
      if(ct)tmpl=ct.days;
    }
  }
  // Build base day array
  var tmplDays=[];
  for(var d=0;d<7;d++)tmplDays.push(tmpl[d]||tmpl[0]);
  console.log('tmplDays built:', tmplDays.length, 'days');
  var excl=c.foodExclude||[];
  // ⚕️ Active medical protocols' avoidFoods (union across all active conditions, see top of genPlan())
  protocolAvoidFoods.forEach(function(food){ if(excl.indexOf(food)===-1) excl.push(food); });
  // ✅ ADD FOOD EXCLUSIONS (NEW PICKER) TO EXCLUSION LIST
  if(c.foodExclusions && Array.isArray(c.foodExclusions)){
    c.foodExclusions.forEach(function(food){
      if(excl.indexOf(food)===-1)excl.push(food);
    });
  }
  // ✅ ALSO SUPPORT OLD ALLERGIES FORMAT (for backward compatibility)
  if(c.allergies){
    var allergyList=parseAllergies(c.allergies);
    allergyList.forEach(function(allergy){
      if(excl.indexOf(allergy)===-1)excl.push(allergy);
    });
  }
  // ✅ Reorder meals to standard sequence before other operations
  tmplDays=reorderMealsToStandardSequence(tmplDays);
  // Initial Mediterranean pipeline on templates ONLY
  tmplDays=removeFYHFromMainMeals(tmplDays);           // 0. FYH έξω από κύρια γεύματα (χειροκίνητα)
  tmplDays=removeOatsFromMainMeals(tmplDays);          // 0β. Βρώμη ΜΟΝΟ σε πρωινό (χειροκίνητα)
  console.log('About to call getDayTgtEff with c=', c, 't=', t);
  var eff=getDayTgtEff(c,t);
  console.log('getDayTgtEff returned:', eff, 'is Array?', Array.isArray(eff));

  // ✅ PHASE 3A: HYBRID SYSTEM — Allocate per-meal targets from daily totals
  console.log('PHASE 3A: About to allocate meal targets. eff=', eff);
  for(var d=0;d<7;d++){
    console.log('Day', d, '- eff[d]=', eff[d], 'tmplDays[d].length=', tmplDays[d].length);
    eff[d].meals = allocateMealTargets(eff[d], tmplDays[d].length);
    console.log('Day', d, '- meals allocated:', eff[d].meals);
  }

  // ✅ PHASE 3B: TRY SMART GENERATION WITH 3-PRIORITY FALLBACK
  // NOTE: Skip smart generation for Orthodox Fasting and Intermittent Fasting to preserve their template structure
  var isOrthodoxFasting = (c.dietType === 'orthodox_fasting');
  var isIntermittentFasting = (c.dietType === 'intermittent_fasting');

  if(!isOrthodoxFasting && !isIntermittentFasting) {
    var savedCombos = getSavedCombos();
    // ⭐ Cross-client taste library: real meals from clients marked as templates
    var mealLibrary = harvestMealLibrary(c.id);
    var usedComboSigs = {};  // variety tracker shared across library + combos this week
    console.log('Taste library: '+mealLibrary.length+' meals harvested from ⭐ template clients');
    for(var d=0;d<7;d++){
      for(var mi=0;mi<tmplDays[d].length;mi++){
        var meal = tmplDays[d][mi];
        var targetKcal = eff[d].meals[mi].k;  // Per-meal calorie target
        var mealSlot = classifyMealSlot(meal.name);

        // ⭐ Priority 0: Taste library — real, dietitian-made meals from ⭐ clients
        // (verbatim food combos; portions get scaled to target in PHASE 3D)
        if(mealLibrary.length > 0){
          var libMeal = findSavedComboMatch(mealLibrary, targetKcal, null, 80, excl, mealSlot, c.dietType, usedComboSigs);
          if(libMeal && libMeal.foods && libMeal.foods.length > 0){
            meal.foods = deepClone(libMeal.foods);
            if(libMeal.mealTiming) meal.mealTiming = libMeal.mealTiming;
            meal.fromLibrary = true;  // tag for UI/debug
            meal.source = 'library';  // for the meal-source badge in renderWeekTable
            meal.recipeSig = libMeal.sig;  // identity for usage/trust tracking (TRACKING_DATA)
            continue;  // Use real approved meal from a template client
          }
        }

        // ✨ Priority 1: Check Chef-Inspired Recipes (culinary-sensible combinations)
        var recipeMeal = findBestRecipe(c.dietType, targetKcal, meal.name, excl);
        if(recipeMeal && recipeMeal.foods && recipeMeal.foods.length > 0){
          meal.foods = deepClone(recipeMeal.foods);
          meal.recipeId = recipeMeal.recipeId;  // Track which recipe was used
          meal.source = 'recipe';
          continue;  // Use chef-inspired recipe
        }

        // Priority 2: Check saved combos (user-approved, slot/diet-aware)
        if(savedCombos && savedCombos.length > 0){
          var savedMeal = findSavedComboMatch(savedCombos, targetKcal, null, 80, excl, mealSlot, c.dietType, usedComboSigs);
          if(savedMeal && savedMeal.foods && savedMeal.foods.length > 0){
            meal.foods = deepClone(savedMeal.foods);
            if(savedMeal.mealTiming) meal.mealTiming = savedMeal.mealTiming;
            meal.source = 'saved';
            meal.recipeSig = savedMeal.sig;  // identity for usage/trust tracking (TRACKING_DATA)
            continue;  // Use saved combo
          }
        }

        // Priority 3: Try smart generation with chef pairing rules
        // Pass meal.name for breakfast-specific constraints, excl for food exclusions, and dietType for diet compliance
        var smartMeal = generateSmartMeal(targetKcal, null, d, savedCombos, meal.name, excl, c.dietType);
        if(smartMeal && smartMeal.foods && smartMeal.foods.length > 0){
          meal.foods = deepClone(smartMeal.foods);
          if(smartMeal.mealTiming) meal.mealTiming = smartMeal.mealTiming;
          meal.source = 'generated';
          continue;  // Use smart meal
        }

        // Priority 3: Keep template meal (graceful fallback, always works)
        // Template meals are already good (Mediterranean rules applied above)
        // So no action needed - just use the original template meal
        meal.source = 'template';
      }
    }
  }

  // ✅ PHASE 3C: RE-APPLY MEDITERRANEAN RULES AFTER SMART GENERATION (skip for special diets like Orthodox Fasting, Vegan, Ketogenic)
  // CRITICAL: Apply Mediterranean rules AFTER smart generation to preserve them
  // NOTE: Orthodox Fasting & Vegan diets should NOT have meat, fish, or dairy - skip Mediterranean rules for them
  // NOTE: Ketogenic diet has dedicated templates with low-carb foods - skip Mediterranean rules for it
  var isOrthodoxFasting = (c.dietType === 'orthodox_fasting');
  var isIntermittentFasting = (c.dietType === 'intermittent_fasting');
  var isVegan = (c.dietType === 'vegan');
  var isVegetarianDiet = (c.dietType === 'vegetarian');
  var isKetogenic = (c.dietType === 'keto');

  if(!isOrthodoxFasting && !isIntermittentFasting && !isVegan && !isVegetarianDiet && !isKetogenic) {
    tmplDays=preferWholeGrains(tmplDays);                // 1. ολικής άλεσης δημητριακά
    tmplDays=applyMediterraneanRules(tmplDays);          // 2. κατανομή πρωτεΐνης (ψάρι/κρέας/όσπρια)
    tmplDays=cleanFYHMeals(tmplDays);                    // 3. FYH σε snacks = αυτόνομα (safety net)
    tmplDays=ensureSaladAndOil(tmplDays);                // 4. σαλάτα εποχής + ελαιόλαδο παντού
    tmplDays=addPotatoToFishMeals(tmplDays);             // 5. πατάτα σε γεύματα ψαριού
    tmplDays=standardizeMediterraneanSnacks(tmplDays);   // 6. φρούτο + ξηροί καρποί στα ενδιάμεσα
    tmplDays=avoidLegumeStarchCombos(tmplDays);          // 6β. αποφυγή όσπριων + άλλο άμυλο (νέο: φέτα + ψωμί αντί γι'άλλο άμυλο)
    tmplDays=avoidDairyWithLegumes(tmplDays);            // 6γ. αποφυγή γαλακτοκομικών + όσπρια (κάλτσιο ↓ απορρόφηση σιδήρου) → λεμόνι + λευκό κρέας
    tmplDays=avoidTanninsWithLegumes(tmplDays);          // 6δ. προειδοποίηση: ταννίνες (καφές/τσάι) ↓ σίδηρος → αποφυγή κατά μεσημέρι με όσπρια
    tmplDays=ensureOilWithVegetables(tmplDays);          // 6ε. εξασφάλιση λαδιού με λαχανικά (βιταμίνες Α,D,E,K λιποδιαλυτές) → ≥10g ελαιόλαδο
    tmplDays=avoidOxalateWithDairy(tmplDays);            // 6στ. αποφυγή σπανακιού + γαλακτοκομικά (οξαλικό ↓ ασβέστιο) → κάλε/μπρόκολο αντί
    tmplDays=ensureOmega3FishIntake(tmplDays);           // 6ζ. προειδοποίηση: ωμέγα-3 από ψάρι ≥2-3x/εβδάδα (ωμέγα-6:3 αναλογία 4:1)
    tmplDays=normalizeBreakfasts(tmplDays);              // 7. Πρωινό Αυγών (FYH) Δευ/Τετ/Παρ, γιαούρτι+βρώμη αλλού
    tmplDays=expandFYHRecipes(tmplDays);                 // 8. ανάπτυξη συνταγών σε συστατικά (για πελάτες)
  } else if(isVegan) {
    // For Vegan, only apply safe Mediterranean rules that don't add meat/fish/dairy/eggs
    tmplDays=preferWholeGrains(tmplDays);                // 1. ολικής άλεσης δημητριακά (safe for plant-based)
    tmplDays=ensureSaladAndOil(tmplDays);                // 4. σαλάτα εποχής + ελαιόλαδο παντού (safe for plant-based)
    tmplDays=ensureOilWithVegetables(tmplDays);          // 6ε. εξασφάλιση λαδιού με λαχανικά (safe for plant-based)
  } else if(isVegetarianDiet) {
    // For Vegetarian, skip applyMediterraneanRules() — it swaps each meal's protein onto a fixed
    // meat/fish weekly rotation (MED_PLAN), which would silently inject meat/fish into an otherwise
    // correctly vegetarian-selected plan. Dairy/eggs are already handled upstream by the smart-gen
    // protein selector, so only the meat/fish-free safe subset runs here (same as Vegan above).
    tmplDays=preferWholeGrains(tmplDays);                // 1. ολικής άλεσης δημητριακά (safe, no protein change)
    tmplDays=ensureSaladAndOil(tmplDays);                // 4. σαλάτα εποχής + ελαιόλαδο παντού (safe, no protein change)
    tmplDays=ensureOilWithVegetables(tmplDays);          // 6ε. εξασφάλιση λαδιού με λαχανικά (safe, no protein change)
  } else if(isOrthodoxFasting) {
    // For Orthodox Fasting, only apply safe Mediterranean rules that don't add meat/fish/dairy
    tmplDays=preferWholeGrains(tmplDays);                // 1. ολικής άλεσης δημητριακά (safe for plant-based)
    tmplDays=ensureSaladAndOil(tmplDays);                // 4. σαλάτα εποχής + ελαιόλαδο παντού (safe for plant-based)
    tmplDays=ensureOilWithVegetables(tmplDays);          // 6ε. εξασφάλιση λαδιού με λαχανικά (safe for plant-based)
  }
  // For Ketogenic, skip all Mediterranean rules (templates are already optimized for low-carb)

  if(excl.length)tmplDays=applyFoodExclusions(tmplDays,excl); // 9. αποκλεισμός τροφίμων (μετά όλα τα steps)

  // ✅ PHASE 3D: SCALE ALL MEALS TO PER-MEAL TARGETS (always, as final step)
  // This scales each meal individually to hit its specific calorie target
  // Uses per-meal targets from allocateMealTargets() for precise distribution
  for(var d=0;d<7;d++){
    c.weekPlan[d]=scalePlan(tmplDays[d],eff[d],eff[d].meals);
  }

  // ✅ ENFORCE RED MEAT FREQUENCY (MAX 2x/week for cholesterol)
  c.weekPlan = enforceRedMeatFrequency(c.weekPlan, excl);

  // ✅ FINAL CLEANUP: REMOVE OATS FROM NON-BREAKFAST MEALS (AFTER all Mediterranean rules)
  // CRITICAL: Oats should ONLY appear in breakfast, never in lunch/dinner
  // This must happen AFTER Mediterranean rules since they might add oats back
  for(var d=0;d<7;d++){
    for(var mi=0;mi<c.weekPlan[d].length;mi++){
      var meal = c.weekPlan[d][mi];
      var mealName = (meal.name || '').toLowerCase();

      // Skip breakfast - oats are allowed there
      if(mealName.includes('πρωινό')) continue;

      // For all non-breakfast meals, remove oats
      if(meal.foods && meal.foods.length > 0) {
        meal.foods = meal.foods.filter(function(food) {
          var foodLower = (food.n || '').toLowerCase();
          return !foodLower.includes('βρώμη');
        });
      }
    }
  }

  // ✅ FINAL CLEANUP: REMOVE EXCLUDED FOODS FROM ALL MEALS (AFTER all Mediterranean rules)
  // CRITICAL: This must be the LAST step to ensure exclusions are respected
  // regardless of which recipe/generation method was used
  // ENHANCED: Now with THREE-LAYER protection + Greek accent normalization
  if(excl.length > 0) {
    // Normalize exclusions to handle Greek accents properly
    var exclNormalized = excl.map(function(x){return normalizeGreekText(x);});
    var exclExact = excl.map(function(x){return (x||'');});  // Keep exact case for direct matches

    for(var d=0;d<7;d++){
      for(var mi=0;mi<c.weekPlan[d].length;mi++){
        var meal = c.weekPlan[d][mi];
        if(meal.foods && meal.foods.length > 0) {
          // LAYER 1: Remove foods that match exclusions (exact, normalized, or substring)
          meal.foods = meal.foods.filter(function(food){
            var foodName = (food.n||'');
            var foodNameExact = foodName;
            var foodNameLower = foodName.toLowerCase();
            var foodNameNormalized = normalizeGreekText(foodName);

            // Check exact match first
            if(exclExact.indexOf(foodName) !== -1) return false;

            // Check substring match with normalized Greek (no accents)
            for(var ei=0;ei<exclNormalized.length;ei++){
              if(foodNameNormalized.indexOf(exclNormalized[ei]) !== -1){
                return false;  // Exclude this food
              }
            }
            return true;  // Keep this food
          });

          // LAYER 2: Remove foods with empty/invalid names
          meal.foods = meal.foods.filter(function(food){
            return food.n && (food.n||'').trim().length > 0;
          });

          // LAYER 3: Remove foods that weren't substituted properly
          // (if applyFoodExclusions failed to find a substitute)
          meal.foods = meal.foods.filter(function(food){
            var foodNameNormalized = normalizeGreekText(food.n||'');
            // Double-check against all normalized exclusions (paranoia mode)
            for(var ei=0;ei<exclNormalized.length;ei++){
              if(foodNameNormalized.indexOf(exclNormalized[ei]) !== -1){
                return false;  // Still excluded, remove it
              }
            }
            return true;
          });
        }
      }
    }
  }

  // ✅ DIET-TYPE SAFETY NET: strip any food from a category the client's diet type
  // forbids, regardless of which code path (recipe, taste library, saved combo...) put it there.
  applyDietTypeCategorySafetyNet(c.weekPlan, c.dietType);

  // ✅ LOG PLAN TO TRACKING SYSTEM
  logPlanGeneration(c, c.weekPlan);

  c.planGeneratedAt=Date.now();  // ✅ ώστε να ξέρουμε πότε "λήγει" (χρειάζεται ανανέωση) το πλάνο
  save();swTab(2);renderWeekTable();
  }catch(e){
    console.error('GENPLAN ERROR:', e.message);
    console.error('Stack:', e.stack);
    showErrorToast('Σφάλμα στη δημιουργία πλάνου: ' + e.message);
  }
}

/* ======== WEEKLY TABLE ======== */
// ══════════════════════════════════════════════════════════════════════════════
// SUPPLEMENT RECOMMENDATIONS — SCIENTIFICALLY-BACKED
// ══════════════════════════════════════════════════════════════════════════════
function getSupplementRecommendations(c){
  if(!c)return'';
  var isNormal=(c.dietType==='normal');
  var isKeto=(c.dietType==='keto');
  var isVegan=(c.dietType==='vegan');
  var isVegetarian=(c.dietType==='vegetarian');
  var isOrthodoxFasting=(c.dietType==='orthodox_fasting');
  var isIntermittentFasting=(c.dietType==='intermittent_fasting');

  var rec='<div style="background:#f5f5f5;border-left:4px solid #ff9800;padding:12px 14px;margin:12px 0;border-radius:4px;font-size:12px;line-height:1.6">'
    +'<b style="color:#e65100">💊 Προτάσεις Συμπληρωμάτων</b><br/><br/>';

  // ══════════════════════════════════════════════════════════════════════════════
  // NORMAL DIET
  // ══════════════════════════════════════════════════════════════════════════════
  if(isNormal){
    rec+='<b>🍗 Κανονική Διατροφή</b><br/>'
      +'<b>Vitamin D3:</b><br/>'
      +'&nbsp;&nbsp;☀️ 10-25 mcg/day (ιδιαίτερα χειμώνα ή αν λίγη ηλιοθεραπεία)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Ψάρι (σολομός, μακαρόνι), αυγά, γάλα ενισχυμένο<br/><br/>'
      +'<b>Magnesium:</b><br/>'
      +'&nbsp;&nbsp;💪 300-400mg/day (ηρεμία, ύπνος, ανάκαμψη μυών)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Σκούρα φυλλώδη λαχανικά, σπόροι, καρύδια, σοκολάτα<br/><br/>'
      +'<b>Vitamin B Complex (B6, B3, Folate):</b><br/>'
      +'&nbsp;&nbsp;⚡ Ενέργεια & μεταβολισμό<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Κοτόπουλο, ψάρι, αυγά, δημητριακά ολικής άλεσης<br/><br/>'
      +'<b>Zinc:</b><br/>'
      +'&nbsp;&nbsp;🛡️ 8-11mg/day (ανοσοποιητικό, επουλωτική)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Κόκκινο κρέας, στρείδια, γαρίδες, σπόροι<br/><br/>'
      +'<b>Omega-3 Fatty Acids:</b><br/>'
      +'&nbsp;&nbsp;❤️ 200-300mg EPA/DHA per week ή 2-3x ψάρι/εβδάδα<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Σολομός, σαρδέλα, μαγιονέζα (από ψάρι)<br/><br/>';
  }
  // ══════════════════════════════════════════════════════════════════════════════
  // KETOGENIC
  // ══════════════════════════════════════════════════════════════════════════════
  else if(isKeto){
    rec+='<b>⚡ Κετογονική Διατροφή</b><br/>'
      +'<b>Electrolytes (ΚΡΙΤΙΚΟ - κετό γρίπη):</b><br/>'
      +'&nbsp;&nbsp;🧂 Νάτριο: 3-5g/day (αλάτι + bone broth)<br/>'
      +'&nbsp;&nbsp;🧂 Κάλιο: 2-3g/day (πράσινα λαχανικά, αβοκάντο)<br/>'
      +'&nbsp;&nbsp;🧂 Μάγνησιο: 300-400mg/day (supplement ή σπόροι)<br/><br/>'
      +'<b>Vitamin D3:</b><br/>'
      +'&nbsp;&nbsp;☀️ 10-25 mcg/day (ιδιαίτερα σε χαμηλότερη ηλιοθεραπεία)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Λιπαρό ψάρι (σολομός), αυγά, βούτυρο<br/><br/>'
      +'<b>Fiber & Micronutrients:</b><br/>'
      +'&nbsp;&nbsp;🥗 Φυτικές ίνες: Σκούρα λαχανικά, ψίλια, χία σπόροι<br/>'
      +'&nbsp;&nbsp;🥒 Προβιοτικά: Ζυμωμένα (κιμχι, σούβλα)<br/><br/>'
      +'<b>MCT Oil / Exogenous Ketones (Optional):</b><br/>'
      +'&nbsp;&nbsp;⚡ Ενέργεια & ketone παραγωγή (εξ ορισμού)<br/>'
      +'&nbsp;&nbsp;💡 Χρησιμοποιήστε μετά την πρώτη εβδάδα αν έχετε κετό γρίπη<br/><br/>';
  }
  // ══════════════════════════════════════════════════════════════════════════════
  // INTERMITTENT FASTING
  // ══════════════════════════════════════════════════════════════════════════════
  else if(isIntermittentFasting){
    rec+='<b>⏰ Διαλείπουσα Νηστεία (Intermittent Fasting)</b><br/>'
      +'<b>Μακροχρόνιο κορεσμό:</b><br/>'
      +'&nbsp;&nbsp;⭐ <b>Electrolytes</b> (during fasting): Κάλιο, Μάγνησιο, Νάτριο<br/>'
      +'&nbsp;&nbsp;&nbsp;&nbsp;💧 Πίνετε νερό με πέταλα λεμονιού ή ανιόντα αλάτι<br/>'
      +'&nbsp;&nbsp;⭐ <b>Ω-3 Fatty Acids</b>: Καλό για μαγνησίνειο & απόδοση<br/>'
      +'&nbsp;&nbsp;⭐ <b>Multivitamin</b>: Καλύπτει το gap από λιγότερα γεύματα<br/>'
      +'&nbsp;&nbsp;⭐ <b>Πρωτεΐνη Powder</b>: Ωφέλιμη για γρήγορη κορεσμό<br/><br/>';
  }
  // ══════════════════════════════════════════════════════════════════════════════
  // ORTHODOX FASTING
  // ══════════════════════════════════════════════════════════════════════════════
  else if(isOrthodoxFasting){
    rec+='<b>✝️ Ορθόδοξη Νηστεία (100% Φυτική)</b><br/>'
      +'<b>B12 (ΥΠΟΧΡΕΩΤΙΚΟ):</b><br/>'
      +'&nbsp;&nbsp;💉 Ημερήσια: 10-25 mcg supplement OR fortified plant milks (3x)<br/>'
      +'&nbsp;&nbsp;💉 Εβδομαδιαία: 2000 mcg supplement<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Fortified cereals, nutritional yeast<br/><br/>'
      +'<b>Σίδηρος (Iron) + Vitamin C:</b><br/>'
      +'&nbsp;&nbsp;🥬 Strategy: Φακές/ρεβίθια + τομάτες/λεμόνι (6x absorption)<br/>'
      +'&nbsp;&nbsp;⚠️ Αποφυγή: Καφές/τσάι με σιδηρούχα γεύματα<br/>'
      +'&nbsp;&nbsp;🔄 Soaking/sprouting legumes (↓ phytates)<br/><br/>'
      +'<b>Vitamin D3 + Calcium:</b><br/>'
      +'&nbsp;&nbsp;☀️ D3: 10-25 mcg/day algae supplement<br/>'
      +'&nbsp;&nbsp;🥛 Calcium: 1000-1200 mg από fortified plant milks + tahini<br/><br/>'
      +'<b>Omega-3 (ALA → EPA/DHA):</b><br/>'
      +'&nbsp;&nbsp;🌱 ALA: Σπόροι λιναριού (1tbsp), chia (1tbsp), καρύδια (1oz)<br/>'
      +'&nbsp;&nbsp;🍃 Algae supplement: 200-300mg EPA/DHA/day (limited ALA conversion)<br/><br/>'
      +'<b>Άλλα: Ιωδίνη (iodized salt), Ψευδάργυρος, Σελήνιο (brazil nuts)</b><br/><br/>';
  }
  // ══════════════════════════════════════════════════════════════════════════════
  // VEGAN
  // ══════════════════════════════════════════════════════════════════════════════
  else if(isVegan){
    rec+='<b>Vitamin B12</b> (υποχρεωτικό για веγάν):<br/>'
      +'&nbsp;&nbsp;💉 Ημερήσια: 10 mcg supplement OR 25-100 mcg fortified foods (3+ times)<br/>'
      +'&nbsp;&nbsp;💉 Εβδομαδιαία: 2000 mcg supplement (κάθε 7 ημέρες)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Fortified plant milks, nutritional yeast, cereals<br/><br/>';

    rec+='<b>Σίδηρος (Iron)</b> + Vitamin C (enhanced absorption):<br/>'
      +'&nbsp;&nbsp;🥬 Strategy: Φακές/ρεβίθια ΜΕ τομάτες/κιτρικά (6x absorption)<br/>'
      +'&nbsp;&nbsp;⚠️ Αποφυγή: Καφές/τσάι με σιδηρούχα γεύματα (ταννίνες)<br/>'
      +'&nbsp;&nbsp;🔄 Ενίσχυση: Soaking/sprouting legumes (↓ phytates)<br/><br/>';

    rec+='<b>Vitamin D3 + Calcium</b> (веγάν sources):<br/>'
      +'&nbsp;&nbsp;☀️ Vitamin D3: 10-25 μg/day algae supplement<br/>'
      +'&nbsp;&nbsp;🥛 Calcium: 1000-1200 mg/day από fortified plant milks + tofu<br/><br/>';

    rec+='<b>Omega-3 (ALA → EPA/DHA)</b>:<br/>'
      +'&nbsp;&nbsp;🌱 ALA: Σπόροι (flaxseed 1tbsp, chia 1tbsp, walnuts 1oz)<br/>'
      +'&nbsp;&nbsp;🍃 EPA/DHA: Algae supplement 200-300mg/day<br/><br/>';

    rec+='<b>Magnesium:</b><br/>'
      +'&nbsp;&nbsp;💪 300-400mg/day (ηρεμία, ύπνος, μυική ανάκαμψη)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Σπόροι, καρύδια, dark chocolate (85%+), σκούρα λαχανικά<br/><br/>'
      +'<b>Zinc:</b><br/>'
      +'&nbsp;&nbsp;🛡️ 8-11mg/day (ανοσοποιητικό)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Σπόροι κολοκύθας, κάσιας, φυστίκια, chickpeas<br/><br/>'
      +'<b>Vitamin B6 & Folate:</b><br/>'
      +'&nbsp;&nbsp;⚡ Μεταβολισμό ενέργειας<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Όσπρια, σπόροι, ντομάτες, μπανάνες<br/><br/>'
      +'<b>Άλλα:</b> Ιωδίνη (αλατισμένο αλάτι), Σελήνιο (brazil nuts 2-3/day)<br/>';
  }
  // ══════════════════════════════════════════════════════════════════════════════
  // VEGETARIAN
  // ══════════════════════════════════════════════════════════════════════════════
  else if(isVegetarian){
    rec+='<b>Vitamin B12</b> (χορτοφαγική):<br/>'
      +'&nbsp;&nbsp;💉 Ημερήσια: 10 mcg supplement (ή fortified foods)<br/>'
      +'&nbsp;&nbsp;🔗 Πηγές: Γιαούρτι, αυγά + fortified cereals<br/><br/>';

    rec+='<b>Σίδηρος (Iron)</b> + Vitamin C (enhanced absorption):<br/>'
      +'&nbsp;&nbsp;🥬 Strategy: Φακές/ρεβίθια ΜΕ τομάτες/λεμόνι (6x absorption)<br/>'
      +'&nbsp;&nbsp;⚠️ Αποφυγή: Καφές/τσάι με σιδηρούχα γεύματα (ταννίνες)<br/>'
      +'&nbsp;&nbsp;🔄 Ενίσχυση: Soaking/sprouting legumes (↓ phytates)<br/><br/>';

    rec+='<b>Vitamin D3 + Calcium</b> (χορτοφαγική):<br/>'
      +'&nbsp;&nbsp;☀️ Vitamin D3: 10-25 μg/day supplement (ή fortified)<br/>'
      +'&nbsp;&nbsp;🥛 Calcium: Γιαούρτι (200mg), τυρί, γάλα ενισχυμένο<br/><br/>';

    rec+='<b>Magnesium & Zinc:</b><br/>'
      +'&nbsp;&nbsp;💪 Magnesium: 300-400mg/day από σπόροι, καρύδια<br/>'
      +'&nbsp;&nbsp;🛡️ Zinc: 8-11mg/day (αυγά έχουν λίγο, χρειάζεται supplement)<br/><br/>';

    rec+='<b>Omega-3 (ALA → EPA/DHA):</b><br/>'
      +'&nbsp;&nbsp;🌱 ALA: Σπόροι (flaxseed 1tbsp, chia 1tbsp, walnuts 1oz)<br/>'
      +'&nbsp;&nbsp;🍃 Algae supplement: 200-300mg EPA/DHA/day (consider)<br/><br/>';

    rec+='<b>Vitamin B6 & Folate:</b><br/>'
      +'&nbsp;&nbsp;⚡ Σπόροι, όσπρια, αβοκάντο<br/><br/>'
      +'<b>Άλλα:</b> Ιωδίνη (iodized salt), Σελήνιο (brazil nuts 2-3/day)<br/>';
  }

  rec+='</div>';
  return rec;
}

// Ποιο "tier" παρήγαγε το γεύμα (πρόγραμμα Priority 0-3 στο genPlan) — μικρό badge ενημέρωσης, όχι λειτουργικό
function mealSourceBadge(meal){
  if(!meal) return '';
  var src = meal.source || (meal.fromLibrary ? 'library' : (meal.recipeId ? 'recipe' : null));
  if(!src) return '';
  var MAP = {
    library:   {icon:'⭐', label:'Πρότυπο γεύσης', bg:'#fff8e1', color:'#f9a825'},
    recipe:    {icon:'👨‍🍳', label:'Recipe', bg:'#e3f2fd', color:'#1565C0'},
    saved:     {icon:'💾', label:'Αποθηκευμένο', bg:'#e8f5e9', color:'#2e7d32'},
    generated: {icon:'✨', label:'Δημιουργήθηκε', bg:'#f3e5f5', color:'#8e24aa'},
    template:  {icon:'📋', label:'Πρότυπο', bg:'#f5f5f5', color:'#757575'}
  };
  var m = MAP[src];
  if(!m) return '';
  return '<span class="meal-source-badge" style="display:block;font-size:10px;font-weight:600;padding:1px 5px;border-radius:6px;margin-bottom:3px;background:'+m.bg+';color:'+m.color+';width:fit-content" title="Πηγή γεύματος: '+m.label+'">'+m.icon+' '+m.label+'</span>';
}

// Ξαναδημιουργεί ΜΟΝΟ μία ημέρα (όχι όλη την εβδομάδα) — τρέχει το κανονικό genPlan εσωτερικά
// και κρατάει μόνο το αποτέλεσμα της ζητούμενης ημέρας, επαναφέροντας τις υπόλοιπες όπως ήταν.
function regenerateDay(dayIndex){
  var c=getC();
  if(!c || !c.weekPlan || !Object.keys(c.weekPlan).length) return;
  showConfirmDialog('Αναδημιουργία μόνο της ημέρας «'+DAYS[dayIndex]+'»;', function(){
    var oldPlan = deepClone(c.weekPlan);
    genPlan();
    var newDay = deepClone(c.weekPlan[dayIndex]);
    c.weekPlan = deepClone(oldPlan);
    c.weekPlan[dayIndex] = newDay;
    save();
    renderWeekTable();
    showSuccessToast('🔄 Η ημέρα «'+DAYS[dayIndex]+'» αναδημιουργήθηκε!');
  }, {icon:'🔄', confirmLabel:'Αναδημιουργία'});
}

function renderWeekTable(){
  var c=getC();var con=document.getElementById('week-con');if(!con)return;
  if(!c||!Object.keys(c.weekPlan).length){con.innerHTML='<div style="padding:20px;color:#bbb;font-size:12px">Δεν υπάρχει πλάνο — πάτα «Δημιουργία πλάνου»</div>';return;}
  // Mediterranean compliance score badge
  var scoreHtml=renderMedScore(c.weekPlan);
  var mealNames=(c.weekPlan[0]||[]).map(function(m){return m.name;});
  var numMeals=mealNames.length;

  var trainD=c.trainDays||[false,false,false,false,false,false,false];
  var trainTimes=c.trainTimesByDay||['','','','','','',''];

  // Supplement recommendations now shown in modal only (not inline)

  // ✅ IMPROVEMENT 1: Build summary card with client info
  var tdeeInfo = calcTDEE(c);

  // Define activity & goal labels locally for this function
  var actL = {sed:'Καθιστικός',light:'Ελαφρά ενεργός',mod:'Μέτρια ενεργός',active:'Έντονα ενεργός'};
  var goalL = {mild:'Ήπια απώλεια',loss:'Απώλεια βάρους',maintain:'Διατήρηση',gain:'Αύξηση μάζας'};

  var activityLabel = actL[c.activity] || c.activity;
  var goalLabel = goalL[c.goal] || c.goal;
  var bmiVal = (c.weight && c.height) ? (c.weight / ((c.height/100) * (c.height/100))).toFixed(1) : '—';

  var summaryCard = '<div style="background:linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);border:1.5px solid #c8e6c9;border-radius:12px;padding:14px 16px;margin-bottom:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;box-shadow:0 2px 8px rgba(0,0,0,0.05)">'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">👤 Πελάτης</span>'
      +'<span style="font-size:13px;font-weight:700;color:#025857">' + esc(c.name) + '</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">📊 Μέτρα</span>'
      +'<span style="font-size:13px;font-weight:600;color:#025857">' + c.weight + 'kg / ' + c.height + 'cm (BMI: ' + bmiVal + ')</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">🎯 Στόχος</span>'
      +'<span style="font-size:13px;font-weight:600;color:#025857">' + goalLabel + '</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">🔥 Στόχος Ημέρας</span>'
      +'<span style="font-size:13px;font-weight:600;color:#e65100">' + Math.round(tdeeInfo.target) + ' kcal</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">Μακρο</span>'
      +'<span style="font-size:12px;font-weight:600;color:#555">Π:' + Math.round(tdeeInfo.p) + 'g | Λ:' + Math.round(tdeeInfo.f) + 'g | Υ:' + Math.round(tdeeInfo.carb) + 'g</span>'
    +'</div>'
    +'</div>';

  // ✅ Legend για τις χρωματιστές κουκκίδες τροφίμων — ίδια hex codes με getFoodColorHex()
  var foodDotLegend='<div style="background:#f5f5f5;border:1px solid #e0e0e0;border-radius:6px;padding:6px 10px;margin-bottom:10px;font-size:10px;color:#666;display:flex;flex-wrap:wrap;gap:10px;align-items:center">'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#5DADE2;margin-right:4px;vertical-align:middle"></span>Πρωτεΐνη</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F8B739;margin-right:4px;vertical-align:middle"></span>Δημητριακά/Άλλα</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#52B788;margin-right:4px;vertical-align:middle"></span>Λαχανικά</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#E8A0BF;margin-right:4px;vertical-align:middle"></span>Αυγά/Γαλακτ.</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#C77DFF;margin-right:4px;vertical-align:middle"></span>Φρούτα</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FFB703;margin-right:4px;vertical-align:middle"></span>Ξηροί καρποί</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FB8500;margin-right:4px;vertical-align:middle"></span>Λάδια</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#B5651D;margin-right:4px;vertical-align:middle"></span>Μπαχαρικά</span>'
    +'</div>';

  // Build table HTML — show T/R badge in header + training time
  // Το κουμπί «Προσθήκη γεύματος» εμφανίζεται ΜΟΝΟ όταν υπάρχει ημέρα με 2+ προπονήσεις
  // (2 MET δραστηριότητες στην ίδια ημέρα) — όχι σε κανονικά πλάνα/πρότυπα.
  var dblDays=getDoubleTrainingDays(c);
  var addMealBar='';
  if(dblDays.length){
    var dblNames=dblDays.map(function(i){return DAYS[i];}).join(', ');
    addMealBar='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:10px;flex-wrap:wrap">'
      +'<span style="font-size:11px;color:#025857;background:#e2eee5;border:1px solid #b5dcd6;border-radius:8px;padding:4px 10px">🏋️ Διπλή προπόνηση: <b>'+dblNames+'</b> — πρόσθεσε γεύμα πριν/ανάμεσα στις προπονήσεις</span>'
      +'<button onclick="openAddMealSlotModal()" title="Πρόσθεσε ένα έξτρα γεύμα (π.χ. πριν/μετά 2ης προπόνησης)" style="background:#025857;color:#fff;border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">➕ Προσθήκη γεύματος</button>'
      +'</div>';
  }
  var html=summaryCard+foodDotLegend+addMealBar+'<table class="week-table"><thead><tr><th>Γεύμα</th>';
  DAYS.forEach(function(d,di){
    // ✅ Native title tooltip explains T/R on hover instead of a permanent banner repeating
    // the same explanation once above a table where the badge already appears 7 times.
    var badge=trainD[di]?'<span title="Ημέρα με άσκηση: περισσότερες θερμίδες για ενέργεια + ανάκαμψη" style="background:#025857;color:#fff;border-radius:8px;font-size:10px;padding:1px 5px;margin-left:3px;cursor:help">T</span>':'<span title="Ημέρα ανάπαυσης: λιγότερες θερμίδες λόγω μειωμένης δαπάνης ενέργειας" style="background:#eee;color:#aaa;border-radius:8px;font-size:10px;padding:1px 5px;margin-left:3px;cursor:help">R</span>';
    var timeStr='';
    if(trainD[di]&&trainTimes[di]&&trainTimes[di].length>0){
      timeStr='<div style="font-size:10px;color:#666;margin-top:2px;font-weight:400">🕐 '+trainTimes[di]+'</div>';
    }
    // ✅ Phase 1: Add sport display for training days
    var sportStr='';
    if(trainD[di]&&c.sport){
      sportStr='<div class="sport-header-dietitian" style="font-size:10px;color:#666;margin-top:2px;font-weight:500">'+c.sport+'</div>';
    }
    var copyBtn='<button class="day-copy-btn" onclick="copyDayPrompt(this,'+di+')" title="Αντιγραφή ημέρας σε άλλες" aria-label="Αντιγραφή ημέρας σε άλλες">📋</button>';
    var regenDayBtn='<button class="day-regen-btn" onclick="regenerateDay('+di+')" title="Αναδημιουργία μόνο αυτής της ημέρας" aria-label="Αναδημιουργία μόνο αυτής της ημέρας">🔄</button>';
    html+='<th>'+d+badge+timeStr+sportStr+copyBtn+regenDayBtn+'</th>';
  });
  html+='</tr></thead><tbody>';

  for(var mi=0;mi<numMeals;mi++){
    // ✅ Phase 2: Add meal timing icons with profiles
    var mealTiming='regular';
    if(c.weekPlan[0]&&c.weekPlan[0][mi]&&c.weekPlan[0][mi].mealTiming){
      mealTiming=c.weekPlan[0][mi].mealTiming;
    }
    var timingProf=MEAL_TIMING_PROFILES[mealTiming]||MEAL_TIMING_PROFILES.regular;
    var timingInfo='Π:'+timingProf.p+'% Λ:'+timingProf.f+'% Υ:'+timingProf.c+'% — '+timingProf.desc;

    // ✅ HORIZONTAL LAYOUT: Meal name as section header
    var timingBadge=(mealTiming&&mealTiming!=='regular')
      ?'<span style="background:#025857;color:#fff;border-radius:8px;font-size:10px;padding:1px 7px;margin-left:8px;font-weight:600" title="'+timingProf.desc+'">'+timingProf.label+'</span>'
      :'';
    html+='<tr style="background:linear-gradient(90deg, #f8f8f8 0%, #f0f0f0 100%);box-shadow:0 2px 4px rgba(0,0,0,0.05)"><td colspan="8" class="meal-section-header" data-timing-info="'+timingInfo+'">'
      +'<span style="font-weight:700;color:#025857;font-size:12px">'+timingProf.icon+' '+esc(mealNames[mi])+'</span>'
      +timingBadge
      +'<button onclick="renameMealSlot('+mi+')" title="Μετονομασία γεύματος" aria-label="Μετονομασία γεύματος" style="background:none;border:none;cursor:pointer;font-size:11px;opacity:0.55;margin-left:6px" class="meal-slot-ctl">✏️</button>'
      +'<button onclick="deleteMealSlot('+mi+')" title="Διαγραφή γεύματος (όλες τις ημέρες)" aria-label="Διαγραφή γεύματος (όλες τις ημέρες)" style="background:none;border:none;cursor:pointer;font-size:11px;opacity:0.55" class="meal-slot-ctl">🗑️</button>'
      +'</td></tr>';
    var rowBg=(mi%2===0)?'background:#fafafa':'background:#fff';
    html+='<tr style="'+rowBg+'"><td class="meal-label" style="visibility:hidden"></td>';
    for(var d=0;d<7;d++){
      var foods=(c.weekPlan[d]&&c.weekPlan[d][mi])?c.weekPlan[d][mi].foods:[];
      // ✅ Phase 4: Add meal timing data attribute
      var dayMealTiming='regular';
      if(c.weekPlan[d]&&c.weekPlan[d][mi]&&c.weekPlan[d][mi].mealTiming){
        dayMealTiming=c.weekPlan[d][mi].mealTiming;
      }
      html+='<td class="day-cell" data-d="'+d+'" data-mi="'+mi+'" data-meal-timing="'+dayMealTiming+'" style="'+rowBg+'">';
      html+=mealSourceBadge(c.weekPlan[d]&&c.weekPlan[d][mi]);
      foods.forEach(function(food,fi){
        // Free meal special display
        if(food.n===FREE_MEAL_MARKER){
          html+='<div style="text-align:center;padding:6px 4px;background:#fff8e1;border:1px dashed #f9a825;border-radius:7px;margin-bottom:2px">'
            +'<span style="font-size:11px;font-weight:700;color:#f57f17">🎉 Ελεύθερο γεύμα</span>'
            +'<button class="chip-del" onclick="delF('+d+','+mi+','+fi+')" aria-label="Διαγραφή τροφίμου" style="margin-left:4px;color:#f9a825">&#10005;</button>'
            +'</div>';
          return;
        }
        var hasSrv=PORTIONS[food.n]&&PORTIONS[food.n].length>0;
        var fu=FOOD_UNITS[food.n];
        // Use stored unit (food.u) if available, otherwise use default from FOOD_UNITS
        var displayUnit = food.u !== undefined ? food.u : (fu ? fu.u : 'g');
        var chipVal, chipMax, chipChg;
        if (displayUnit === 'g' || !fu) {
          chipVal = food.g;
          chipMax = 999;
          chipChg = 'updG('+d+','+mi+','+fi+',this.value)';
        } else {
          chipVal = WHOLE_UNIT_FOODS[food.n]
            ? Math.max(1, Math.round(food.g / fu.g))
            : Math.max(0.1, Math.round(food.g / fu.g * 10) / 10);
          chipMax = 10;
          chipChg = 'updG('+d+','+mi+','+fi+',this.value*'+fu.g+')';
        }
        var chipUnit = pluralUnit(displayUnit, chipVal);
        var hasIng=((FOODS[food.n]&&FOODS[food.n].ingredients)||(typeof FYH_RECIPE_EXPAND!=='undefined'&&FYH_RECIPE_EXPAND[food.n]))?'<button class="chip-srv" onclick="showRecipeModal(\''+food.n.replace(/'/g,"\\'")+'\')" title="Δείτε τα συστατικά" aria-label="Δείτε τα συστατικά">📖</button>':'';
        var hasExpand=FYH_RECIPE_EXPAND[food.n]?'<button class="chip-srv" onclick="expandRecipeInPlan('+d+','+mi+','+fi+')" title="Άνοιγμα υλικών — επεξεργασία ποσοτήτων" aria-label="Άνοιγμα υλικών — επεξεργασία ποσοτήτων">🔽</button>':'';
        var borderColor=getFoodColorHex(food.n);
        var rvTip=cm(food.n,food.g);
        var macroTip='<div class="chip-macro-tip">'
          +'<span style="color:#1565C0">Π '+Math.round(rvTip.p)+'</span> '
          +'<span style="color:#B71C1C">Λ '+Math.round(rvTip.f)+'</span> '
          +'<span style="color:#2E7D32">Υ '+Math.round(rvTip.c)+'</span> '
          +'<span style="color:#E65100;font-weight:700">&middot; '+Math.round(rvTip.k)+' kcal</span>'
          +'</div>';
        html+='<div class="food-chip">'
          +macroTip
          +'<div class="chip-r1">'
          +'<span class="food-dot" style="background:'+borderColor+'" title="Ομάδα τροφίμου"></span>'
          +'<div class="chip-name-wrap">'
          +'<input class="chip-inp" type="text" value="'+food.n+'" autocomplete="off" spellcheck="false" title="'+food.n+'"'
          +' data-d="'+d+'" data-mi="'+mi+'" data-fi="'+fi+'"'
          +' oninput="showChipSug(this)" onfocus="showChipSug(this)" onblur="closeDD()">'
          +'</div>'
          +'</div>'
          +'<div class="chip-r2">'
          +hasIng
          +hasExpand
          +(hasSrv?'<button class="chip-srv" onmousedown="event.preventDefault();showPortions(this,'+d+','+mi+','+fi+')" aria-label="Μερίδες">&#8801;</button>':'')
          +'<input class="chip-g" type="number" min="0" step="'+(displayUnit==='g'||!fu?'1':'0.1')+'" max="'+chipMax+'" value="'+chipVal+'" onchange="'+chipChg+'">'
          +'<button class="chip-unit-btn" onclick="cycleUnit('+d+','+mi+','+fi+')" title="Αλλαγή μονάδας" aria-label="Αλλαγή μονάδας">'+chipUnit+'</button>'
          +(fu&&fu.u==='μερίδ.'?'<span class="chip-ghint">('+food.g+'g)</span>':'')
          +'<button class="chip-swap-btn" onclick="showMealAlternatives('+d+','+mi+')" title="Εναλλακτικό γεύμα" aria-label="Εναλλακτικό γεύμα">🔄</button>'
          +'<button class="chip-del" onclick="delF('+d+','+mi+','+fi+')" aria-label="Διαγραφή τροφίμου">&#10005;</button>'
          +'</div>'
          +'</div>';
        // Recipe ingredients — visible only in print/PDF
        if(FOODS[food.n]&&FOODS[food.n].ingredients){
          html+='<div class="chip-ingredients-print">';
          FOODS[food.n].ingredients.forEach(function(ing){
            var prep=ing.prep?' ('+ing.prep+')':'';
            var unit=ing.unit?' '+ing.unit:'';
            var size=ing.size?' '+ing.size:'';
            html+='<div style="font-size:8px;color:#666;padding:1px 0;margin-left:18px">• '+ing.item+': '+ing.qty+unit+size+prep+'</div>';
          });
          if(FOODS[food.n].time){html+='<div style="font-size:8px;color:#999;padding:2px 0;margin-left:18px">⏱️ '+FOODS[food.n].time+'</div>';}
          html+='</div>';
        } else if(typeof FYH_RECIPE_EXPAND!=='undefined'&&FYH_RECIPE_EXPAND[food.n]){
          // FYH/expandable recipe → show its ingredients (scaled to portion) in print/PDF
          var rxPrint=FYH_RECIPE_EXPAND[food.n];
          var scPrint=(food.g||rxPrint.base)/rxPrint.base;
          html+='<div class="chip-ingredients-print">';
          rxPrint.ing.forEach(function(ing){
            var gPrint=Math.max(1,Math.round(ing.g*scPrint));
            html+='<div style="font-size:8px;color:#666;padding:1px 0;margin-left:18px">• '+ing.n+': '+gPrint+'g</div>';
          });
          html+='</div>';
        }
      });
      var mK2=0,mP2=0,mF2=0,mC2=0,mFi2=0;
      foods.forEach(function(f2){var rv=cm(f2.n,f2.g);mK2+=rv.k;mP2+=rv.p;mF2+=rv.f;mC2+=rv.c;mFi2+=rv.fi;});
      if(foods.length){
        var hasFree=foods.some(function(f){return f.n===FREE_MEAL_MARKER;});
        var lowProt=!hasFree&&mP2<15&&mP2>0;
        html+='<div class="meal-mac-bar">'
          +(lowProt?'<span class="prot-warn" title="Χαμηλή πρωτεΐνη — στόχος ≥15g/γεύμα για βέλτιστη MPS">⚠️</span>':'')
          +'<span style="color:#1565C0">Π:'+Math.round(mP2)+'</span> '
          +'<span style="color:#B71C1C">Λ:'+Math.round(mF2)+'</span> '
          +'<span style="color:#2E7D32">Υ:'+Math.round(mC2)+'</span>'
          +(mFi2>=0.5?' <span style="color:#795548" title="Φυτικές ίνες">· 🌾'+mFi2.toFixed(1)+'g</span>':'')
          +' <span style="color:#E65100;font-weight:700">&middot; '+Math.round(mK2)+' kcal</span></div>';
      }
      html+='<button class="chip-add" onclick="addF('+d+','+mi+')">+</button>';
      console.log('DEBUG: Day '+d+', Meal '+mi+', Foods: '+foods.length);
      if(foods.length){
        var menuId='meal-menu-'+d+'-'+mi;
        html+='<div style="display:inline-block;position:relative;margin-left:8px;">'
          +'<button class="chip-add" onclick="toggleMealMenu(\''+menuId+'\')" style="background:#025857;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;" title="Περισσότερες επιλογές">⋮</button>'
          +'<div id="'+menuId+'" class="meal-menu-dropdown" style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #ddd;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:100;min-width:200px;margin-top:4px;">'
          +'<button onclick="toggleFavoriteMeal('+d+','+mi+',this);closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:#333;font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'#f5f5f5\'" onmouseout="this.style.background=\'none\'">⭐ Αγαπημένο</button>'
          +'<button onclick="saveCombo('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:#333;font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'#f5f5f5\'" onmouseout="this.style.background=\'none\'">💾 Αποθήκευση</button>'
          +'<button onclick="balanceMacros('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:#333;font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'#f5f5f5\'" onmouseout="this.style.background=\'none\'">⚖️ Ισορροπία</button>'
          +'<button onclick="copyMealToClipboard('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:#333;font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'#f5f5f5\'" onmouseout="this.style.background=\'none\'">❐ Αντιγραφή</button>'
          +'<hr style="margin:4px 0;border:none;border-top:1px solid #eee;">'
          +'<button onclick="rateMeal('+d+','+mi+',1);closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:#333;font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'#f5f5f5\'" onmouseout="this.style.background=\'none\'">👍 Μου άρεσε</button>'
          +'<button onclick="rateMeal('+d+','+mi+',-1);showMealAlternatives('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:#ff6b35;font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'#f5f5f5\'" onmouseout="this.style.background=\'none\'">👎 Δεν μου άρεσε</button>'
          +'</div>'
          +'</div>';
      }
      html+='</td>';
    }
    html+='</tr>';
  }

  // Totals row
  var tdeeR=calcTDEE(c);
  var effTgtArr=getDayTgtEff(c,tdeeR);
  var fiberDayTgt=getFiberTarget(c.age,c.sex);
  html+='<tr class="totals-row"><td class="meal-label">Σύνολο</td>';
  for(var d=0;d<7;d++){
    var tK=0,tP=0,tF=0,tC=0,tFi=0;
    (c.weekPlan[d]||[]).forEach(function(m){(m.foods||[]).forEach(function(f){var r=cm(f.n,f.g);tK+=r.k;tP+=r.p;tF+=r.f;tC+=r.c;tFi+=r.fi;});});
    var eff=effTgtArr[d]||{k:tdeeR.target,p:tdeeR.p,f:tdeeR.f,c:tdeeR.carb};
    var kPct=eff.k?Math.round(tK/eff.k*100):100;
    var kCls=kPct<88?'low':kPct>112?'over':'ok';
    var trainBadge=trainD[d]?'<span style="font-size:9px;font-weight:700;color:#025857"> T</span>':'';
    // Macro bar helper
    function mBar(actual,target,color){
      var pctW=target?Math.min(100,Math.round(actual/target*100)):100;
      var barColor=pctW<80?'#e67e22':pctW>115?'#c0392b':color;
      return '<div style="width:'+pctW+'%;background:'+barColor+'" class="macro-bar-fill"></div>';
    }
    function mVal(actual,target){return actual&&target?(actual/target<0.8?'#e67e22':actual/target>1.15?'#c0392b':'#555'):'#555';}
    var fiPct=fiberDayTgt?tFi/fiberDayTgt:1;
    var fiValColor=fiPct<0.65?'#B71C1C':fiPct<0.85?'#e67e22':'#5d4037';
    html+='<td>'
      +'<div class="tot-kcal '+kCls+'">'+Math.round(tK)+' / '+eff.k+' kcal '+kPct+'%'+trainBadge+'</div>'
      +'<div class="macro-bar-row">'
        +'<span class="mbr-label" style="color:#1565C0">Π</span>'
        +'<div class="macro-bar">'+mBar(tP,eff.p,'#1565C0')+'</div>'
        +'<span class="mbr-val" style="color:'+mVal(tP,eff.p)+'">'+Math.round(tP)+'/'+Math.round(eff.p)+'g</span>'
      +'</div>'
      +'<div class="macro-bar-row">'
        +'<span class="mbr-label" style="color:#e65100">Λ</span>'
        +'<div class="macro-bar">'+mBar(tF,eff.f,'#e65100')+'</div>'
        +'<span class="mbr-val" style="color:'+mVal(tF,eff.f)+'">'+Math.round(tF)+'/'+Math.round(eff.f)+'g</span>'
      +'</div>'
      +'<div class="macro-bar-row">'
        +'<span class="mbr-label" style="color:#2e7d32">Υ</span>'
        +'<div class="macro-bar">'+mBar(tC,eff.c,'#2e7d32')+'</div>'
        +'<span class="mbr-val" style="color:'+mVal(tC,eff.c)+'">'+Math.round(tC)+'/'+Math.round(eff.c)+'g</span>'
      +'</div>'
      +'<div class="macro-bar-row" title="Φυτικές Ίνες — στόχος '+fiberDayTgt+'g/ημ. (DRI)">'
        +'<span class="mbr-label" style="color:#5d4037">Ί</span>'
        +'<div class="macro-bar">'+mBar(tFi,fiberDayTgt,'#795548')+'</div>'
        +'<span class="mbr-val" style="color:'+fiValColor+'">'+tFi.toFixed(1)+'/'+fiberDayTgt+'g</span>'
      +'</div>'
      +'</td>';
  }
  html+='</tr></tbody></table>';

  // ── Tuna frequency check (mercury risk) ─────────────────────────────────────
  var tunaCount=0;
  for(var tdi2=0;tdi2<7;tdi2++){
    (c.weekPlan[tdi2]||[]).forEach(function(m){
      m.foods.forEach(function(f){if(/τόνο/i.test(f.n))tunaCount++;});
    });
  }
  var tunaWarnHtml='';
  if(tunaCount>=3){
    var isMinorTW=(c.age||0)<18;
    tunaWarnHtml='<div style="background:#fff3e0;border:1px solid #ffb74d;border-radius:8px;padding:7px 12px;font-size:11px;color:#bf360c;margin-bottom:8px">'
      +'🐟 <b>Προσοχή — Τόνος:</b> εμφανίζεται <b>'+tunaCount+'x</b> αυτή την εβδομάδα.'
      +(isMinorTW?' Για ανηλίκους το ανώτατο όριο EFSA (2015) είναι <b>≤2 μερίδες/εβδ.</b> λόγω μεθυλυδραργύρου.'
               :' Συνίσταται <b>max 3-4 μερίδες/εβδ.</b> (EFSA 2015 — μεθυλυδράργυρος).')
      +'</div>';
  }

  // ── Weekly fiber summary banner ────────────────────────────────────────────
  var wkFiTot=0,wkFiTgt=getFiberTarget(c.age,c.sex)*7;
  var wkFiByDay=[];
  for(var wfd=0;wfd<7;wfd++){
    var dFi=0;
    (c.weekPlan[wfd]||[]).forEach(function(m){(m.foods||[]).forEach(function(ff){dFi+=cm(ff.n,ff.g).fi;});});
    wkFiByDay.push(dFi);wkFiTot+=dFi;
  }
  var wkFiPct=wkFiTgt?Math.round(wkFiTot/wkFiTgt*100):100;
  var wkFiColor=wkFiPct>=90?'#4CAF50':wkFiPct>=65?'#FF9800':'#F44336';
  var wkFiTxtColor=wkFiPct>=90?'#1b5e20':wkFiPct>=65?'#E65100':'#B71C1C';
  var dotHtml='';
  DAYS.forEach(function(dn,di){
    var dp=wkFiByDay[di],dPct=getFiberTarget(c.age,c.sex)?Math.round(dp/getFiberTarget(c.age,c.sex)*100):100;
    var dc=dPct>=90?'#4CAF50':dPct>=65?'#FF9800':'#F44336';
    dotHtml+='<span title="'+dn+': '+dp.toFixed(1)+'g ('+dPct+'%)" style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;cursor:default">'
      +'<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+dc+'"></span>'
      +'<span style="font-size:8px;color:#888">'+dn.charAt(0)+'</span>'
    +'</span>';
  });
  var fiberBannerHtml='<div style="background:#fff;border:1px solid #e0e0e0;border-radius:10px;padding:8px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    +'<span style="font-size:15px" title="Φυτικές Ίνες (Dietary Fiber)">🌾</span>'
    +'<span style="font-size:11px;font-weight:700;color:#555">Φυτικές Ίνες Εβδομάδας</span>'
    +'<span style="font-size:17px;font-weight:800;color:'+wkFiTxtColor+'">'+Math.round(wkFiTot)+'g</span>'
    +'<span style="font-size:10px;color:#888">/ '+wkFiTgt+'g στόχος &nbsp;·&nbsp; <b style="color:'+wkFiTxtColor+'">'+wkFiPct+'%</b></span>'
    +'<div style="flex:1;min-width:80px;height:6px;background:#e4e4e4;border-radius:3px;overflow:hidden">'
      +'<div style="width:'+Math.min(100,wkFiPct)+'%;height:100%;background:'+wkFiColor+';border-radius:3px;transition:width .3s"></div>'
    +'</div>'
    +'<div style="display:flex;gap:5px;align-items:center">'+dotHtml+'</div>'
    +(wkFiPct<65?'<span style="font-size:10px;color:#B71C1C;font-weight:600">⚠ Χαμηλή πρόσληψη ινών — στόχος '+getFiberTarget(c.age,c.sex)+'g/ημ. (DRI AI)</span>':'')
  +'</div>';
  // Instead of displaying micronutrients inline, add a button to open the modal
  con.innerHTML=scoreHtml+fiberBannerHtml+tunaWarnHtml+html;

  // ✅ VALIDATE FOOD DISTRIBUTION
  var foodValidation = validateFoodDistribution(c.weekPlan);
  var validationHtml = displayFoodDistributionResults(foodValidation);

  // Create validation container and insert after meal table
  var valDiv = document.createElement('div');
  valDiv.innerHTML = validationHtml;
  con.appendChild(valDiv);

  // Enable drag & drop for meals
  enableMealDragDrop();

  // Small neutral icon row for the analysis tools (previously 4 equally-loud colored
  // buttons competing with the primary save/send actions above the plan)
  var btnContainer=document.createElement('div');
  btnContainer.className='plan-tools-row';
  con.appendChild(btnContainer);

  // Add micronutrients button
  var microBtn=document.createElement('button');
  microBtn.className='plan-tool-btn';
  microBtn.innerHTML='📊';
  microBtn.title='Μικροθρεπτικά & Κρίσιμοι Στόχοι ('+Object.keys(c.weekPlan||{}).length+')';
  microBtn.onclick=openMicroModal;
  btnContainer.appendChild(microBtn);

  // Add supplement suggestions button
  var suppBtn=document.createElement('button');
  suppBtn.className='plan-tool-btn';
  suppBtn.innerHTML='💊';
  suppBtn.title='Προτάσεις Συμπληρωμάτων';
  suppBtn.onclick=openSupplementModal;
  btnContainer.appendChild(suppBtn);

  // Add gap analysis button
  var gapBtn=document.createElement('button');
  gapBtn.className='plan-tool-btn';
  gapBtn.innerHTML='🔬';
  gapBtn.title='Ανάλυση Κενών';
  gapBtn.onclick=openGapAnalysisModal;
  btnContainer.appendChild(gapBtn);

  // Add validation audit button
  var valBtn=document.createElement('button');
  valBtn.className='plan-tool-btn';
  valBtn.innerHTML='🔍';
  valBtn.title='Validate Plan';
  valBtn.onclick=openValidationModal;
  btnContainer.appendChild(valBtn);

  // Attach drag-and-drop to each day-cell
  con.querySelectorAll('.day-cell').forEach(function(cell){
    cell.addEventListener('dragover',function(e){e.preventDefault();cell.classList.add('drag-over');});
    cell.addEventListener('dragleave',function(e){if(!cell.contains(e.relatedTarget))cell.classList.remove('drag-over');});
    cell.addEventListener('drop',function(e){
      e.preventDefault();cell.classList.remove('drag-over');
      var data=e.dataTransfer.getData('text/plain');
      var c2=getC();if(!c2)return;
      var dd=parseInt(cell.dataset.d),mmi=parseInt(cell.dataset.mi);
      if(data.indexOf('combo:')===0){
        // Insert all foods from saved combo
        var cid=data.slice(6);
        var combo=getSavedCombos().filter(function(x){return x.id===cid;})[0];
        if(combo)combo.foods.forEach(function(f){c2.weekPlan[dd][mmi].foods.push({n:f.n,g:f.g});});
      } else {
        if(!FOODS[data])return;
        c2.weekPlan[dd][mmi].foods.push({n:data,g:100});
      }
      renderWeekTable();
    });
  });
}

function updG(d,mi,fi,v){var c=getC();if(!c)return;c.weekPlan[d][mi].foods[fi].g=Math.max(0,parseInt(v)||0);save();renderWeekTable();}
function addF(d,mi){openFoodSelectorModal(d,mi);}

function openFoodSelectorModal(d,mi){
  var c=getC();if(!c)return;
  // Create or reuse the modal
  var existingModal=document.getElementById('food-selector-modal');
  if(existingModal){existingModal.remove();}

  var modal=document.createElement('div');
  modal.id='food-selector-modal';
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999';

  var content=document.createElement('div');
  content.style.cssText='background:#fff;padding:20px;border-radius:8px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3)';

  // Add paste button if there's a meal in clipboard
  var pasteBtn='';
  if(window.mealClipboard){
    pasteBtn='<button onclick="pasteMealFromClipboard('+d+','+mi+');document.getElementById(\'food-selector-modal\').remove()" style="background:#4caf50;color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:11px;margin-right:10px">📋 Επικόλληση Γεύματος</button>';
  }

  content.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:2px solid #E2EEE5;padding-bottom:10px">'
    +'<h2 style="color:#025857;margin:0">🔍 Επιλογή Τροφίματος</h2>'
    +'<div>'+pasteBtn+'<button onclick="document.getElementById(\'food-selector-modal\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666">&times;</button></div>'
    +'</div>'
    +'<input id="food-search-input" class="food-lib-search" type="text" placeholder="Αναζήτηση τροφίμου..." style="width:100%;margin-bottom:15px" oninput="updateFoodSelector(this.value)">'
    +'<div id="food-selector-list" style="max-height:500px;overflow-y:auto;border:1px solid #ddd;border-radius:6px"></div>';

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Store context for food selection
  window.currentFoodContext={d:d,mi:mi};

  // Initial render
  updateFoodSelector('');

  // Close on overlay click
  modal.addEventListener('click',function(e){
    if(e.target===modal){modal.remove();}
  });
}

function updateFoodSelector(query){
  var list=document.getElementById('food-selector-list');
  if(!list)return;

  var q=(query||'').toLowerCase().trim();
  var cats={};

  // Filter foods
  Object.keys(FOODS).forEach(function(n){
    if(q&&n.toLowerCase().indexOf(q)<0)return;
    var cat=FOODS[n].cat;
    if(!cats[cat])cats[cat]=[];
    cats[cat].push(n);
  });

  if(!Object.keys(cats).length){
    list.innerHTML='<div style="color:#bbb;font-size:11px;padding:10px">Δεν βρέθηκε</div>';
    return;
  }

  var html='';
  Object.keys(cats).sort().forEach(function(cat){
    html+='<div style="background:#f5f5f5;padding:8px 10px;font-weight:600;color:#666;border-top:1px solid #e0e0e0;margin-top:8px">'+cat+'</div>';
    cats[cat].forEach(function(n){
      var foodId='food-item-'+Math.random().toString(36).substr(2,9);
      html+='<div style="border-bottom:1px solid #f0f0f0">'
        +'<div id="'+foodId+'" style="padding:8px 10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onmouseover="this.style.background=\'#f9f9f9\'" onmouseout="this.style.background=\'#fff\'" onclick="showFoodQuantityInput(\''+foodId+'\',\''+n.replace(/'/g,"\\'")+'\')">'
          +'<span>'+n+'</span>'
          +'<span style="color:#999;font-size:11px">'+FOODS[n].k+' kcal</span>'
        +'</div>'
        +'<div id="'+foodId+'-qty" style="display:none;padding:10px;background:#f9f9f9;border-top:1px solid #e0e0e0">'
          +'<div style="display:flex;gap:8px;align-items:center">'
            +'<label style="font-size:11px;color:#666">Ποσότητα (gr):</label>'
            +'<input id="qty-input-'+foodId+'" type="number" value="100" min="1" max="500" style="width:70px;padding:4px;border:1px solid #ddd;border-radius:4px;font-size:12px">'
            +'<button onclick="confirmFoodQuantity(\''+foodId+'\',\''+n.replace(/'/g,"\\'")+'\')" style="background:#025857;color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:11px">✓ Προσθήκη</button>'
            +'<button onclick="hideFoodQuantityInput(\''+foodId+'\')" style="background:#999;color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:11px">✕ Άκυρο</button>'
          +'</div>'
        +'</div>'
        +'</div>';
    });
  });

  list.innerHTML=html;
}

function showFoodQuantityInput(foodId,foodName){
  // Hide all other quantity inputs
  var allQtyDivs=document.querySelectorAll('[id$="-qty"]');
  allQtyDivs.forEach(function(div){
    div.style.display='none';
  });

  // Show the quantity input for this food
  var qtyDiv=document.getElementById(foodId+'-qty');
  if(qtyDiv){
    qtyDiv.style.display='block';
    // Focus on input
    var input=document.getElementById('qty-input-'+foodId);
    if(input){
      input.focus();
      input.select();
    }
  }
}

function hideFoodQuantityInput(foodId){
  var qtyDiv=document.getElementById(foodId+'-qty');
  if(qtyDiv)qtyDiv.style.display='none';
}

function confirmFoodQuantity(foodId,foodName){
  var input=document.getElementById('qty-input-'+foodId);
  if(!input)return;

  var quantity=parseInt(input.value)||100;
  if(quantity<1)quantity=100;

  var ctx=window.currentFoodContext;
  if(!ctx)return;

  var c=getC();
  if(!c)return;

  c.weekPlan[ctx.d][ctx.mi].foods.push({n:foodName,g:quantity});
  save();
  renderWeekTable();

  // Close modal
  var modal=document.getElementById('food-selector-modal');
  if(modal)modal.remove();
}

function delF(d,mi,fi){var c=getC();if(!c)return;c.weekPlan[d][mi].foods.splice(fi,1);save();renderWeekTable();}

// Επιστρέφει τους δείκτες ημερών (0-6) που έχουν 2+ προπονήσεις στη MET λίστα
function getDoubleTrainingDays(c){
  if(!c||!c.metActivities||!c.metActivities.length)return [];
  var counts=[0,0,0,0,0,0,0];
  c.metActivities.forEach(function(ma){
    (ma.days||[]).forEach(function(d){if(d>=0&&d<=6)counts[d]++;});
  });
  var out=[];
  for(var i=0;i<7;i++){if(counts[i]>=2)out.push(i);}
  return out;
}

// ── Διαχείριση επιπλέον γευμάτων (slots) ───────────────────────────────────
// Τα γεύματα είναι κοινά slots σε όλες τις 7 ημέρες. Προσθέτουμε ένα νέο slot
// (π.χ. «Pre 2ης προπόνησης») σε όλες τις ημέρες — κενό όπου δεν χρειάζεται.
function openAddMealSlotModal(){
  var c=getC();if(!c||!c.weekPlan||!c.weekPlan[0]){showErrorToast('Δημιούργησε πρώτα πλάνο.');return;}
  var names=(c.weekPlan[0]||[]).map(function(m){return m.name;});
  var posOpts='';
  for(var i=0;i<names.length;i++){
    posOpts+='<option value="'+(i+1)+'">μετά: '+names[i]+'</option>';
  }
  var presetBtns=[
    {n:'Pre 1ης προπόνησης',t:'pre-workout'},
    {n:'Ανάμεσα στις προπονήσεις',t:'post-workout'},
    {n:'Pre 2ης προπόνησης',t:'pre-workout'},
    {n:'Μετά 2ης προπόνησης',t:'recovery'}
  ].map(function(p){
    return '<button type="button" onclick="document.getElementById(\'newMealName\').value=\''+p.n+'\';document.getElementById(\'newMealTiming\').value=\''+p.t+'\'" '
      +'style="background:#e8f5e9;border:1px solid #c8e6c9;color:#025857;border-radius:14px;padding:4px 10px;font-size:11px;cursor:pointer;margin:0 4px 4px 0">'+p.n+'</button>';
  }).join('');
  var timingOpts='';
  for(var k in MEAL_TIMING_PROFILES){
    var pr=MEAL_TIMING_PROFILES[k];
    timingOpts+='<option value="'+k+'"'+(k==='pre-workout'?' selected':'')+'>'+pr.icon+' '+pr.label+'</option>';
  }
  var html='<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1002" onclick="if(event.target===this)closeAddMealSlotModal()">'
    +'<div style="background:#fff;border-radius:12px;padding:20px;max-width:440px;width:90%;box-shadow:0 8px 24px rgba(0,0,0,0.3)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:2px solid #025857;padding-bottom:10px">'
    +'<h2 style="margin:0;color:#025857;font-size:17px">➕ Προσθήκη γεύματος</h2>'
    +'<button onclick="closeAddMealSlotModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#999">&times;</button>'
    +'</div>'
    +'<div style="background:#E8F5E9;padding:10px 12px;border-radius:6px;margin-bottom:14px;font-size:11px;color:#2E7D32;line-height:1.5">'
    +'💡 Το γεύμα μπαίνει σε <b>όλες τις ημέρες</b>. Άφησέ το κενό στις ημέρες που δεν χρειάζεται — εμφανίζεται μόνο το «+».</div>'
    +'<div style="font-size:11px;color:#666;margin-bottom:6px">Γρήγορες επιλογές:</div>'
    +'<div style="margin-bottom:12px">'+presetBtns+'</div>'
    +'<label style="font-weight:600;color:#333;font-size:12px;display:block;margin-bottom:4px">Όνομα γεύματος</label>'
    +'<input id="newMealName" type="text" value="Pre 2ης προπόνησης" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-bottom:12px;box-sizing:border-box">'
    +'<label style="font-weight:600;color:#333;font-size:12px;display:block;margin-bottom:4px">Τύπος (timing → κατανομή μακρο)</label>'
    +'<select id="newMealTiming" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-bottom:12px;box-sizing:border-box">'+timingOpts+'</select>'
    +'<label style="font-weight:600;color:#333;font-size:12px;display:block;margin-bottom:4px">Θέση στη μέρα</label>'
    +'<select id="newMealPos" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;margin-bottom:18px;box-sizing:border-box">'+posOpts+'</select>'
    +'<div style="display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="closeAddMealSlotModal()" style="padding:9px 18px;background:#eee;border:none;border-radius:6px;cursor:pointer">Άκυρο</button>'
    +'<button onclick="confirmAddMealSlot()" style="padding:9px 18px;background:#025857;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">✅ Προσθήκη</button>'
    +'</div></div></div>';
  var overlay=document.createElement('div');
  overlay.id='addMealSlotModal';
  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}
function closeAddMealSlotModal(){var m=document.getElementById('addMealSlotModal');if(m)m.remove();}
function confirmAddMealSlot(){
  var c=getC();if(!c)return;
  var name=(document.getElementById('newMealName').value||'').trim();
  if(!name){showErrorToast('Δώσε όνομα γεύματος.');return;}
  var timing=document.getElementById('newMealTiming').value||'regular';
  var pos=parseInt(document.getElementById('newMealPos').value,10);
  if(isNaN(pos))pos=(c.weekPlan[0]||[]).length;
  Object.keys(c.weekPlan).forEach(function(d){
    if(!c.weekPlan[d])return;
    var insAt=Math.min(pos,c.weekPlan[d].length);
    c.weekPlan[d].splice(insAt,0,{name:name,foods:[],mealTiming:timing});
  });
  save();closeAddMealSlotModal();renderWeekTable();
  showSuccessToast('✅ Προστέθηκε το γεύμα «'+name+'»');
}
function renameMealSlot(mi){
  var c=getC();if(!c||!c.weekPlan[0]||!c.weekPlan[0][mi])return;
  var cur=c.weekPlan[0][mi].name;
  showPromptDialog('Νέο όνομα γεύματος:', cur, function(nv){
    nv=nv.trim();if(!nv)return;
    Object.keys(c.weekPlan).forEach(function(d){
      if(c.weekPlan[d]&&c.weekPlan[d][mi])c.weekPlan[d][mi].name=nv;
    });
    save();renderWeekTable();
  }, {title:'Μετονομασία γεύματος'});
}
function deleteMealSlot(mi){
  var c=getC();if(!c||!c.weekPlan[0]||!c.weekPlan[0][mi])return;
  if((c.weekPlan[0]||[]).length<=1){showErrorToast('Δεν γίνεται να μείνει η μέρα χωρίς γεύματα.');return;}
  var nm=c.weekPlan[0][mi].name;
  showConfirmDialog('Διαγραφή του γεύματος «'+nm+'» από ΟΛΕΣ τις ημέρες;', function(){
    Object.keys(c.weekPlan).forEach(function(d){
      if(c.weekPlan[d]&&c.weekPlan[d].length>mi)c.weekPlan[d].splice(mi,1);
    });
    save();renderWeekTable();
    showSuccessToast('🗑️ Διαγράφηκε το γεύμα «'+nm+'»');
  });
}
function copyDayPrompt(btn,fromDay){
  var c=getC();if(!c||!c.weekPlan[fromDay]||!c.weekPlan[fromDay].length)return;
  var dayNames=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var panelId='copy-panel-'+fromDay;
  var existing=document.getElementById(panelId);
  if(existing){existing.remove();return;}
  // Close any other open copy panels
  document.querySelectorAll('[id^="copy-panel-"]').forEach(function(p){p.remove();});
  var rect=btn.getBoundingClientRect();
  var panel=document.createElement('div');
  panel.id=panelId;
  panel.style.cssText='position:fixed;z-index:9999;background:#fff;border:1px solid #025857;border-radius:8px;padding:10px 12px;box-shadow:0 4px 18px rgba(0,0,0,.18);font-size:11px;min-width:165px;left:'+Math.round(rect.left)+'px;top:'+Math.round(rect.bottom+4)+'px';
  var inner='<div style="font-weight:700;color:#025857;margin-bottom:7px">📋 Αντιγραφή '+dayNames[fromDay]+' σε:</div>';
  inner+='<div style="display:flex;flex-direction:column;gap:5px">';
  for(var di=0;di<7;di++){
    if(di===fromDay)continue;
    inner+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer">'
      +'<input type="checkbox" id="cp-'+di+'" style="accent-color:#025857"> '+dayNames[di]+'</label>';
  }
  inner+='</div><div style="display:flex;gap:6px;margin-top:8px">'
    +'<button onclick="doCopyDay('+fromDay+')" style="flex:1;padding:4px;background:#025857;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer">✓ Εφαρμογή</button>'
    +'<button onclick="document.getElementById(\''+panelId+'\').remove()" style="padding:4px 8px;border:1px solid #ddd;border-radius:5px;font-size:11px;cursor:pointer;background:#fff">✕</button>'
    +'</div>';
  panel.innerHTML=inner;
  document.body.appendChild(panel);
  // Close on outside click
  setTimeout(function(){
    function outsideClick(e){if(!panel.contains(e.target)&&e.target!==btn){panel.remove();document.removeEventListener('mousedown',outsideClick);}}
    document.addEventListener('mousedown',outsideClick);
  },0);
}
function doCopyDay(fromDay){
  var c=getC();if(!c)return;
  var dayNames=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var copied=[];
  for(var di=0;di<7;di++){
    var cb=document.getElementById('cp-'+di);
    if(cb&&cb.checked){c.weekPlan[di]=deepClone(c.weekPlan[fromDay]);copied.push(dayNames[di]);}
  }
  if(!copied.length){showErrorToast('Δεν επιλέχθηκε καμία ημέρα.');return;}
  save();renderWeekTable();
}

/* ---- Meal drag & drop ---- */
function enableMealDragDrop(){
  // Enable drag & drop for copying entire meals between cells
  var cells=document.querySelectorAll('.day-cell');
  cells.forEach(function(cell){
    cell.draggable=true;

    // Add tooltip on hover
    cell.addEventListener('mouseenter', function(){
      if(this.innerText.trim().length > 0){
        this.title='💡 Σύρε το γεύμα σε άλλη ημέρα για αντιγραφή';
      }
    });

    // Store source meal data on drag start
    cell.addEventListener('dragstart',function(e){
      var sourceD=parseInt(this.dataset.d);
      var sourceMi=parseInt(this.dataset.mi);
      var c=getC();
      if(!c||!c.weekPlan[sourceD]||!c.weekPlan[sourceD][sourceMi]){e.preventDefault();return;}

      // Check if meal has foods
      if(!c.weekPlan[sourceD][sourceMi].foods||c.weekPlan[sourceD][sourceMi].foods.length===0){
        showErrorToast('Αυτό το γεύμα δεν έχει τροφίμων για αντιγραφή.');e.preventDefault();return;
      }

      // Store meal data as JSON
      var mealData=JSON.stringify({
        sourceD:sourceD,
        sourceMi:sourceMi,
        foods:c.weekPlan[sourceD][sourceMi].foods||[]
      });

      e.dataTransfer.effectAllowed='copy';
      e.dataTransfer.setData('meal/copy',mealData);

      // Visual feedback
      this.style.opacity='0.6';
      this.style.cursor='grabbing';
    });

    // Reset opacity on drag end
    cell.addEventListener('dragend',function(e){
      this.style.opacity='1';
      this.style.cursor='grab';
    });

    // Prevent default drag over behavior
    cell.addEventListener('dragover',function(e){
      var mealData=e.dataTransfer.getData('meal/copy');
      if(mealData){
        e.preventDefault();
        e.dataTransfer.dropEffect='copy';
        this.classList.add('meal-drag-over');
      }
    });

    // Remove visual feedback when leaving the cell entirely
    cell.addEventListener('dragleave',function(e){
      if(!this.contains(e.relatedTarget))this.classList.remove('meal-drag-over');
    });

    // Handle drop
    cell.addEventListener('drop',function(e){
      e.preventDefault();
      this.classList.remove('meal-drag-over');

      // Get the meal data from the drag source
      var mealDataStr=e.dataTransfer.getData('meal/copy');
      if(!mealDataStr)return;

      try{
        var mealData=JSON.parse(mealDataStr);
        var c=getC();
        if(!c)return;

        var targetD=parseInt(this.dataset.d);
        var targetMi=parseInt(this.dataset.mi);

        // Don't copy to the same cell
        if(targetD===mealData.sourceD&&targetMi===mealData.sourceMi)return;

        // Copy all foods from source to target
        if(mealData.foods&&mealData.foods.length>0){
          // Deep copy foods array
          mealData.foods.forEach(function(food){
            c.weekPlan[targetD][targetMi].foods.push(deepClone(food));
          });

          // Save and refresh UI
          save();
          renderWeekTable();
        }
      }catch(err){
        console.error('Σφάλμα κατά την αντιγραφή του γεύματος:',err);
      }
    });
  });
}

/* ---- Chip food search ---- */
function closeDD(){if(currentDD){currentDD.remove();currentDD=null;}}

function showChipSug(inp){
  closeDD();
  var q=inp.value.toLowerCase().trim();
  var keys=Object.keys(FOODS);
  var matches=q?keys.filter(function(n){return n.toLowerCase().indexOf(q)>=0;}):keys;
  if(!matches.length)return;
  var d=inp.dataset.d,mi=inp.dataset.mi,fi=inp.dataset.fi,mode=inp.dataset.mode||'';
  var html='';
  matches.forEach(function(n){
    html+='<div class="chip-ddi" data-n="'+n+'" data-d="'+d+'" data-mi="'+mi+'" data-fi="'+fi+'" data-mode="'+mode+'" onmousedown="event.preventDefault();pickChip(this)">'
      +'<span>'+n+'</span><span class="chip-ddm">'+FOODS[n].k+' kcal</span></div>';
  });
  var dd=document.createElement('div');dd.className='chip-dd';dd.innerHTML=html;
  inp.parentElement.appendChild(dd);currentDD=dd;
}

function pickChip(el){
  var d=parseInt(el.dataset.d),mi=parseInt(el.dataset.mi),fi=parseInt(el.dataset.fi);
  var selectedFoodName=el.dataset.n;
  if(el.dataset.mode==='tmpl'){
    TMPLS[curTmplGoal][d][mi].foods[fi].n=selectedFoodName;
    closeDD();renderTmplTable();
  } else {
    var c=getC();if(!c)return;
    // Update the food name
    c.weekPlan[d][mi].foods[fi].n=selectedFoodName;
    // If it's an expandable recipe, set its reference portion so the
    // "Άνοιγμα υλικών" button (🔽) scales the ingredients correctly.
    // The recipe stays as a single line — the user opens it on demand.
    var rx=FYH_RECIPE_EXPAND[selectedFoodName];
    if(rx)c.weekPlan[d][mi].foods[fi].g=rx.base;
    save();closeDD();renderWeekTable();
  }
}

/* ---- Portion picker ---- */
function showPortions(btn,d,mi,fi){
  closeDD();
  var c=getC();if(!c)return;
  var food=c.weekPlan[d][mi].foods[fi];
  var portions=PORTIONS[food.n];
  if(!portions||!portions.length)return;
  var html='';
  portions.forEach(function(srv){
    html+='<div class="srv-ddi" onmousedown="event.preventDefault();pickServing('+srv.g+','+d+','+mi+','+fi+')">'
      +'<span>'+srv.n+'</span><span class="srv-ddg">'+srv.g+'g</span></div>';
  });
  var dd=document.createElement('div');
  dd.className='chip-dd';dd.innerHTML=html;
  var chip=btn.closest('.food-chip');
  var wrap=chip?chip.querySelector('.chip-name-wrap'):null;
  if(!wrap)return;
  wrap.appendChild(dd);currentDD=dd;
}

function pickServing(g,d,mi,fi){
  var c=getC();if(!c)return;
  c.weekPlan[d][mi].foods[fi].g=g;
  closeDD();renderWeekTable();
}

/* ── Άνοιγμα συνταγής σε επεξεργάσιμα υλικά (γραμμάρια) ── */
function expandRecipeInPlan(d,mi,fi){
  var c=getC();if(!c)return;
  var food=c.weekPlan[d][mi].foods[fi];
  var rx=FYH_RECIPE_EXPAND[food.n];
  if(!rx){showErrorToast('Αυτή η συνταγή δεν έχει αναλυτικά υλικά για άνοιγμα.');return;}
  // Scale ingredients to the recipe's current portion
  var scale=(food.g||rx.base)/rx.base;
  var ings=rx.ing.map(function(ing){return {n:ing.n,g:Math.max(1,Math.round(ing.g*scale))};});
  // Replace the single recipe line with its ingredient lines
  var args=[fi,1].concat(ings);
  Array.prototype.splice.apply(c.weekPlan[d][mi].foods,args);
  save();renderWeekTable();
}

/* ── FEATURE #1: Custom Meal Times Management ──────────────────────────────── */
function updateMealTime(mealType, timeValue){
  var c=getC();if(!c)return;
  if(!c.mealTimes)c.mealTimes={};
  c.mealTimes[mealType]=timeValue;
  save();
  // Recalculate meal timings if plan exists
  if(c.weekPlan&&Object.keys(c.weekPlan).length>0){
    initializeMealTiming(c);
    renderWeekTable();
  }
}

/* ── FEATURE #2: Weekly Training Schedule Management ────────────────────────── */
function buildWeeklyTrainingScheduleHtml(c){
  var dayNames=['Δευτέρα','Τρίτα','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
  var dayAbbr=['Δ','Τ','Τ','Π','Π','Σ','Κ'];

  var html='<table style="width:100%;border-collapse:collapse;font-size:11px;">';
  html+='<thead><tr style="background:#E2EEE5;border-bottom:2px solid #c5ddd8;">'
    +'<th style="padding:8px;text-align:left;font-weight:700;color:#025857;">Ημέρα</th>'
    +'<th style="padding:8px;text-align:left;font-weight:700;color:#025857;">Προπόνηση</th>'
    +'<th style="padding:8px;text-align:left;font-weight:700;color:#025857;">Ώρα</th>'
    +'<th style="padding:8px;text-align:left;font-weight:700;color:#025857;">Διάρκεια</th>'
    +'</tr></thead>';
  html+='<tbody>';

  for(var d=0;d<7;d++){
    var hasTraining=c.weeklyTraining&&c.weeklyTraining[d]&&c.weeklyTraining[d].training;
    var trainingTime=c.weeklyTraining&&c.weeklyTraining[d]?c.weeklyTraining[d].time:'17:00';
    var trainingDuration=c.weeklyTraining&&c.weeklyTraining[d]?c.weeklyTraining[d].duration:60;

    html+='<tr style="border-bottom:1px solid #e0e0e0;'+(d%2===0?'background:#f9f9f9':'')+'"><td style="padding:8px;">'
      +'<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">'
      +'<input type="checkbox" '+(hasTraining?'checked':'')+' onchange="updateWeeklyTraining('+d+',this.checked)" style="cursor:pointer;">'
      +'<span>'+dayNames[d]+'</span>'
      +'</label>'
      +'</td><td style="padding:8px;">'+(hasTraining?'⚽':'😴')+'</td><td style="padding:8px;">'
      +'<input type="time" '+(hasTraining?'':'disabled')+' id="week-train-time-'+d+'" value="'+trainingTime+'" style="width:90px;padding:4px 6px;border:1px solid #e0e0e0;border-radius:4px;font-size:11px;" onchange="updateWeeklyTraining('+d+',true,this.value)">'
      +'</td><td style="padding:8px;">'
      +'<input type="number" '+(hasTraining?'':'disabled')+' id="week-train-duration-'+d+'" value="'+trainingDuration+'" min="10" max="180" step="5" style="width:70px;padding:4px 6px;border:1px solid #e0e0e0;border-radius:4px;font-size:11px;" onchange="updateWeeklyTraining('+d+',true,null,this.value)"> min'
      +'</td></tr>';
  }

  html+='</tbody></table>';
  return html;
}

function updateWeeklyTraining(dayIndex, hasTraining, time, duration){
  var c=getC();if(!c)return;
  if(!c.weeklyTraining)c.weeklyTraining=[{},{},{},{},{},{},{}];

  c.weeklyTraining[dayIndex].training=hasTraining;
  if(time)c.weeklyTraining[dayIndex].time=time;
  if(duration)c.weeklyTraining[dayIndex].duration=parseInt(duration);

  // Update input states
  document.getElementById('week-train-time-'+dayIndex).disabled=!hasTraining;
  document.getElementById('week-train-duration-'+dayIndex).disabled=!hasTraining;

  save();
  // Recalculate if plan exists
  if(c.weekPlan&&Object.keys(c.weekPlan).length>0){
    initializeMealTiming(c);
    renderWeekTable();
  }
}

/* ── FEATURE #3: Multiple Training Times (2x/day) ────────────────────────── */
function addSecondTraining(enabled){
  var c=getC();if(!c)return;
  c.hasMultipleTrainings=enabled;
  if(enabled&&!c.secondTraining){
    c.secondTraining=[
      {training:false,time:'06:00',duration:60},
      {training:false,time:'06:00',duration:60},
      {training:false,time:'06:00',duration:60},
      {training:false,time:'06:00',duration:60},
      {training:false,time:'06:00',duration:60},
      {training:false,time:'06:00',duration:60},
      {training:false,time:'06:00',duration:60}
    ];
  } else if(!enabled){
    // When disabling 2x training, clear the data
    c.secondTraining=null;
  }
  save();
  renderS1();  // Refresh UI
}

function removeSecondTraining(){
  var c=getC();if(!c)return;
  c.hasMultipleTrainings=false;
  c.secondTraining=null;
  save();
  renderS1();
}

function updateSecondTraining(dayIndex, hasTraining, time, duration){
  var c=getC();if(!c)return;
  if(!c.secondTraining)c.secondTraining=[{},{},{},{},{},{},{}];

  c.secondTraining[dayIndex].training=hasTraining;
  if(time)c.secondTraining[dayIndex].time=time;
  if(duration)c.secondTraining[dayIndex].duration=parseInt(duration);

  document.getElementById('second-train-time-'+dayIndex).disabled=!hasTraining;
  document.getElementById('second-train-duration-'+dayIndex).disabled=!hasTraining;

  save();
  if(c.weekPlan&&Object.keys(c.weekPlan).length>0){
    initializeMealTiming(c);
    renderWeekTable();
  }
}

function buildSecondTrainingScheduleHtml(c){
  var dayNames=['Δευτέρα','Τρίτα','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];

  var html='<table style="width:100%;border-collapse:collapse;font-size:11px;">';
  html+='<thead><tr style="background:#FFE0B2;border-bottom:2px solid #FFB74D;">'
    +'<th style="padding:8px;text-align:left;font-weight:700;color:#E65100;">Ημέρα</th>'
    +'<th style="padding:8px;text-align:left;font-weight:700;color:#E65100;">2η Προπόνηση</th>'
    +'<th style="padding:8px;text-align:left;font-weight:700;color:#E65100;">Ώρα</th>'
    +'<th style="padding:8px;text-align:left;font-weight:700;color:#E65100;">Διάρκεια</th>'
    +'</tr></thead>';
  html+='<tbody>';

  for(var d=0;d<7;d++){
    var hasTraining=c.secondTraining&&c.secondTraining[d]&&c.secondTraining[d].training;
    var trainingTime=c.secondTraining&&c.secondTraining[d]?c.secondTraining[d].time:'06:00';
    var trainingDuration=c.secondTraining&&c.secondTraining[d]?c.secondTraining[d].duration:60;

    html+='<tr style="border-bottom:1px solid #FFE0B2;'+(d%2===0?'background:#fff9e6':'')+'"><td style="padding:8px;">'
      +'<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">'
      +'<input type="checkbox" '+(hasTraining?'checked':'')+' onchange="updateSecondTraining('+d+',this.checked)" style="cursor:pointer;">'
      +'<span>'+dayNames[d]+'</span>'
      +'</label>'
      +'</td><td style="padding:8px;">'+(hasTraining?'⚽':'😴')+'</td><td style="padding:8px;">'
      +'<input type="time" '+(hasTraining?'':'disabled')+' id="second-train-time-'+d+'" value="'+trainingTime+'" style="width:90px;padding:4px 6px;border:1px solid #FFB74D;border-radius:4px;font-size:11px;" onchange="updateSecondTraining('+d+',true,this.value)">'
      +'</td><td style="padding:8px;">'
      +'<input type="number" '+(hasTraining?'':'disabled')+' id="second-train-duration-'+d+'" value="'+trainingDuration+'" min="10" max="180" step="5" style="width:70px;padding:4px 6px;border:1px solid #FFB74D;border-radius:4px;font-size:11px;" onchange="updateSecondTraining('+d+',true,null,this.value)"> min'
      +'</td></tr>';
  }

  html+='</tbody></table>';
  return html;
}

/* ── PHASE 2: Meal Timing Management ────────────────────────────────────── */
function initializeMealTiming(c){
  if(!c||!c.weekPlan)return;
  var trainDays=c.trainDays||[false,false,false,false,false,false,false];
  // ✅ FEATURE #2: Use weeklyTraining if available, otherwise fall back to trainTimes
  var trainTimes=[];
  for(var d=0;d<7;d++){
    if(c.weeklyTraining&&c.weeklyTraining[d]&&c.weeklyTraining[d].training){
      trainTimes[d]=c.weeklyTraining[d].time||'17:00';
      trainDays[d]=true;
    } else {
      trainTimes[d]=c.trainTimes?c.trainTimes[d]:null;
    }
  }

  // ✅ DEFAULT meal times (in HH:MM format)
  var DEFAULT_MEAL_TIMES={
    'Πρωινό':'08:00',
    'Ενδιάμεσο':'15:30',
    'Μεσημεριανό':'13:00',
    'Βραδινό':'20:00'
  };

  // ✅ FEATURE #1: Use CUSTOM meal times if available, otherwise defaults
  var MEAL_TIMES={
    'Πρωινό':(c.mealTimes&&c.mealTimes.breakfast)||DEFAULT_MEAL_TIMES['Πρωινό'],
    'Ενδιάμεσο':(c.mealTimes&&c.mealTimes.snack)||DEFAULT_MEAL_TIMES['Ενδιάμεσο'],
    'Μεσημεριανό':(c.mealTimes&&c.mealTimes.lunch)||DEFAULT_MEAL_TIMES['Μεσημεριανό'],
    'Βραδινό':(c.mealTimes&&c.mealTimes.dinner)||DEFAULT_MEAL_TIMES['Βραδινό']
  };

  for(var d=0;d<7;d++){
    if(!c.weekPlan[d])continue;
    c.weekPlan[d].forEach(function(meal,mi){
      if(!meal.mealTiming){
        var mealName=meal.name;
        var mealTime=MEAL_TIMES[mealName]||'12:00';
        var trainingTime=trainTimes[d];

        // ✅ NEW: If training day AND we know training time, assign pre/post-workout intelligently
        if(trainDays[d]&&trainingTime){
          // Convert times to minutes for calculation
          var [trainH,trainM]=trainingTime.split(':').map(Number);
          var trainingMinutes=trainH*60+trainM;

          var [mealH,mealM]=mealTime.split(':').map(Number);
          var mealMinutes=mealH*60+mealM;

          // Pre-workout: 2-3 hours before training (120-180 min)
          if(mealMinutes>=trainingMinutes-180&&mealMinutes<=trainingMinutes-120){
            meal.mealTiming='pre-workout';
          }
          // Post-workout: 0-30 min after training (assume 60min training duration)
          else if(mealMinutes>trainingMinutes&&mealMinutes<=trainingMinutes+30){
            meal.mealTiming='post-workout';
          }
          // If snack/intermediate is close to pre-workout time, mark it
          else if(/Ενδιάμεσο/.test(mealName)&&mealMinutes>=trainingMinutes-180&&mealMinutes<=trainingMinutes-90){
            meal.mealTiming='pre-workout';
          }
          // Otherwise, use training day defaults
          else if(/Πρωινό/.test(mealName)){
            meal.mealTiming='regular';
          } else if(/Μεσημεριανό/.test(mealName)){
            meal.mealTiming='recovery';
          } else if(/Βραδινό/.test(mealName)){
            meal.mealTiming='recovery';
          } else {
            meal.mealTiming='regular';
          }
        } else {
          // ✅ ORIGINAL LOGIC: If no training time, use defaults
          if(/Πρωινό/.test(mealName)){
            meal.mealTiming=trainDays[d]?'pre-workout':'regular';
          } else if(/Μεσημεριανό/.test(mealName)){
            meal.mealTiming=trainDays[d]?'post-workout':'recovery';
          } else if(/Βραδινό/.test(mealName)){
            meal.mealTiming=trainDays[d]?'recovery':'regular';
          } else {
            meal.mealTiming='regular';
          }
        }
      }
    });
  }
}

function setMealTiming(d,mi,timing){
  var c=getC();if(!c||!c.weekPlan[d]||!c.weekPlan[d][mi])return;
  c.weekPlan[d][mi].mealTiming=timing;
  save();renderWeekTable();
}

function getMealTimingRecommendation(mealTiming){
  var prof=MEAL_TIMING_PROFILES[mealTiming]||MEAL_TIMING_PROFILES.regular;
  return{p:prof.p,f:prof.f,c:prof.c,label:prof.label,icon:prof.icon,notes:prof.notes};
}

/* ── PHASE 3: Micronutrient Adequacy Display ──────────────────────────────── */
function getMicronutrientHtml(c){
  if(!c)return'';
  var targets=getMicronutrientTargets(c);
  var useAthletic=c.sport||((c.trainDays||[]).filter(function(x){return x;}).length>=3);

  var daysMN={};
  for(var d=0;d<7;d++){
    var meals=c.weekPlan[d]||[];
    daysMN[d]=getDayMicronutrients(meals);
  }

  // Calculate weekly average
  var weekMN={Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0};
  Object.keys(daysMN).forEach(function(d){
    var dmn=daysMN[d];
    ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA'].forEach(function(key){
      weekMN[key]+=dmn[key];
    });
  });
  ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA'].forEach(function(key){
    weekMN[key]=Math.round(weekMN[key]/7);
  });

  var adequacy=checkMicronutrientAdequacy(weekMN,targets,useAthletic);
  var criticalCount=0,lowCount=0;
  Object.keys(adequacy).forEach(function(key){
    if(adequacy[key].status==='critical')criticalCount++;
    else if(adequacy[key].status==='low')lowCount++;
  });

  // ════ ENHANCED: DETAILED TABLE WITH ALL MICRONUTRIENTS ════
  var html='<div style="background:white;border-radius:8px;padding:0;margin-top:8px;font-size:11px;border:1px solid #ddd">';

  // Header summary
  html+='<div style="background:#f5f5f5;padding:12px;border-bottom:1px solid #ddd;">';
  html+='<div style="font-weight:700;color:#333;margin-bottom:8px;font-size:12px;">📊 Ανάλυση Μικροθρεπτικών (Ημερήσιος Μέσος Όρος 7 Ημερών)</div>';

  if(criticalCount>0||lowCount>0){
    html+='<div style="background:#fff3e0;border-left:3px solid #ff9800;padding:8px;border-radius:3px;color:#e65100;font-size:10px;">'
      +'<b>⚠️ '+criticalCount+' κρίσιμα</b>, <b>'+lowCount+' χαμηλά</b> — Χρειάζεται προσοχή'
      +'</div>';
  } else {
    html+='<div style="background:#e8f5e9;border-left:3px solid #4caf50;padding:8px;border-radius:3px;color:#2e7d32;font-size:10px;">'
      +'<b>✅ Επαρκής</b> — Όλα τα μικροθρεπτικά στο στόχο'
      +'</div>';
  }
  html+='</div>';

  // Detailed table
  html+='<table style="width:100%;border-collapse:collapse;margin:0;">';
  html+='<thead><tr style="background:#e0e0e0;font-weight:700;text-align:left;border-bottom:2px solid #999;">'
    +'<th style="padding:8px 10px;text-align:left;width:35%;">Μικροθρεπτικό</th>'
    +'<th style="padding:8px 10px;text-align:center;width:15%;">Όντως</th>'
    +'<th style="padding:8px 10px;text-align:center;width:15%;">Στόχος</th>'
    +'<th style="padding:8px 10px;text-align:center;width:15%;">% Στόχου</th>'
    +'<th style="padding:8px 10px;text-align:center;width:20%;">Κατάσταση</th>'
    +'</tr></thead>';
  html+='<tbody>';

  // Sort by status (critical first, then low, then ok)
  var sortedKeys=['Fe','Zn','Mg','Ca','B12','B1','B2','B3','B6','Folate','Omega3','Omega6','Iodine','Choline','DHA'];
  var rows=[];

  sortedKeys.forEach(function(key){
    var adq=adequacy[key];
    var tgt=targets[key.toLowerCase()]||targets[key]||{};
    var label=tgt.label||key;
    var unit=tgt.unit||'';
    var actualVal=Math.round(adq.actual*10)/10;
    var targetVal=Math.round((useAthletic?tgt.athletic:tgt.target)*10)/10;
    var pct=adq.pct;
    var status=adq.status;
    var statusIcon='✅';
    var bgColor='#e8f5e9';

    if(status==='critical'){
      statusIcon='🔴';
      bgColor='#ffebee';
    } else if(status==='low'){
      statusIcon='⚠️';
      bgColor='#fff3e0';
    }

    rows.push({
      key:key,
      label:label,
      actual:actualVal,
      target:targetVal,
      unit:unit,
      pct:pct,
      status:status,
      icon:statusIcon,
      bg:bgColor,
      statusPriority:status==='critical'?0:status==='low'?1:2
    });
  });

  // Sort by priority (critical first)
  rows.sort(function(a,b){return a.statusPriority-b.statusPriority;});

  rows.forEach(function(row){
    html+='<tr style="border-bottom:1px solid #eee;background:'+row.bg+';">';
    html+='<td style="padding:8px 10px;"><strong>'+row.label+'</strong></td>';
    html+='<td style="padding:8px 10px;text-align:center;">'+row.actual+' <span style="font-size:9px;color:#666;">'+row.unit+'</span></td>';
    html+='<td style="padding:8px 10px;text-align:center;"><span style="font-size:10px;color:#666;">'+row.target+' '+row.unit+'</span></td>';
    html+='<td style="padding:8px 10px;text-align:center;"><strong style="font-size:12px;'+(row.pct>=90?'color:#2e7d32;':row.pct>=65?'color:#e65100;':'color:#d32f2f;')+'">'+row.pct+'%</strong></td>';
    var statusLabel=row.status==='critical'?'Κρίσιμο':row.status==='low'?'Χαμηλό':'Επαρκές';
    html+='<td style="padding:8px 10px;text-align:center;"><span style="font-size:13px;">'+row.icon+'</span> <span style="font-size:9px;color:#666;">'+statusLabel+'</span></td>';
    html+='</tr>';
  });

  html+='</tbody></table>';
  html+='</div>';

  // ✅ ADD DAILY TOTALS & STATUS HEADERS
  html+='<div style="margin-top:20px;display:grid;grid-template-columns:repeat(7,1fr);gap:10px;">';
  var tdeeResult = calcTDEE(c);
  var targetTotals = {k: tdeeResult.target}; // ✅ FIX: calcTDEE() returns .target for kcal, not .k — getDayStatus expects .k
  for(var dayIdx = 0; dayIdx < 7; dayIdx++){
    var dayMeals = c.weekPlan[dayIdx] || [];
    var dayTotals = calculateDailyTotals(dayMeals);
    var dayStatus = getDayStatus(dayTotals, targetTotals);

    html+='<div class="day-header">'
      +'<div style="flex:1">'
      +'<div class="day-header-title">'+DAYS[dayIdx]+'</div>'
      +'<div class="day-header-totals" style="margin-top:6px;">'
      +'<div class="day-total-item kcal">'+dayTotals.k+' kcal</div>'
      +'</div>'
      +'<div style="margin-top:4px;font-size:10px;color:#666">'
      +'Π: '+dayTotals.p+'g | Λ: '+dayTotals.f+'g | Υ: '+dayTotals.c+'g'
      +'</div>'
      +'</div>'
      +'<div class="day-status-badge '+dayStatus.status+'">'+dayStatus.label+'</div>'
      +'</div>';
  }
  html+='</div>';

  // Footer note
  html+='<div style="background:#fafafa;padding:10px;border-top:1px solid #ddd;border-radius:0 0 8px 8px;font-size:9px;color:#666;line-height:1.5;">';
  html+='<strong>📌 Σημειώσεις:</strong> Τα ποσοστά βασίζονται σε '+(useAthletic?'<strong>αθλητικούς</strong>':'<strong>κανονικούς</strong>')+' στόχους. Για ελλείψεις <strong>≥25%</strong>, εξετάστε τα συμπληρώματα στην ενότητα 💊 <strong>Προτάσεις</strong>.';
  html+='</div>';

  return html;
}

/* ---- Saved Combos ---- */
function getSavedCombos(){
  var c=getC();
  // Προτεραιότητα 1: Ανάκτηση από client object (backup)
  if(c && c.savedCombos && Array.isArray(c.savedCombos)){
    return c.savedCombos;
  }
  // Προτεραιότητα 2: Ανάκτηση από localStorage (παλαιό σύστημα)
  return safeStorageGet('dieto_combos', []);
}

function setSavedCombos(arr){
  var c=getC();
  // Αποθήκευση στο client object (backup)
  if(c){
    c.savedCombos=arr;
    save();
  }
  // Αποθήκευση και στο localStorage για συμβατότητα
  safeStorageSet('dieto_combos', arr);
}

// ── Lightweight toast notification ─────────────────────────────────────────
function dietoToast(msg, color){
  try{
    var t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:20px;right:20px;background:'+(color||'#4CAF50')+';color:#fff;padding:12px 16px;border-radius:8px;font-size:13px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,0.25);max-width:340px';
    t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(function(){t.remove();},3200);
  }catch(e){console.log(msg);}
}

// ── ⭐ Toggle: mark current client as a "taste template" source ─────────────
// Their plan's meals feed the cross-client taste library used by genPlan.
function toggleMealTemplate(){
  var c=getC();if(!c)return;
  var hasPlan=c.weekPlan && Object.keys(c.weekPlan).length>0;
  if(!c.isMealTemplate && !hasPlan){
    dietoToast('⚠️ Δεν υπάρχει πλάνο σε αυτόν τον πελάτη για να γίνει πρότυπο.', '#e65100');
    return;
  }
  c.isMealTemplate=!c.isMealTemplate;
  save();
  var b=document.getElementById('star-tmpl-btn');
  if(b){
    b.style.background=c.isMealTemplate?'#ffb300':'#eee';
    b.style.color=c.isMealTemplate?'#fff':'#555';
    b.innerHTML=c.isMealTemplate?'⭐ Πρότυπο γεύσης':'☆ Όρισε ως πρότυπο γεύσης';
  }
  if(c.isMealTemplate){
    var n=harvestMealLibrary().length;
    dietoToast('⭐ Προστέθηκε στα πρότυπα γεύσης. Βιβλιοθήκη: '+n+' μοναδικά γεύματα διαθέσιμα για νέα πλάνα.');
  } else {
    dietoToast('Αφαιρέθηκε από τα πρότυπα γεύσης.', '#757575');
  }
}

/* ---- Auto-Backup System (Every 1 Hour) ---- */
function autoBackupClients(){
  try{
    var clientsData=safeStorageGet('clients', []);
    if(!clientsData||!clientsData.length)return; // No clients to backup

    var now=new Date();
    var timestamp=now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0')+'_'+now.getHours().toString().padStart(2,'0')+'-'+now.getMinutes().toString().padStart(2,'0');
    var filename='Dietologist_backup_'+timestamp+'.json';

    // Use correct format that importBackup() expects
    var dataStr=JSON.stringify({clients:clientsData},null,2);
    var blob=new Blob([dataStr],{type:'application/json'});
    var url=URL.createObjectURL(blob);

    var link=document.createElement('a');
    link.href=url;
    link.download=filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show brief notification
    var notif=document.createElement('div');
    notif.style.cssText='position:fixed;bottom:20px;right:20px;background:#4CAF50;color:white;padding:12px 16px;border-radius:8px;font-size:12px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
    notif.innerHTML='✓ Αυτόματο backup αποθηκεύτηκε: '+filename;
    document.body.appendChild(notif);
    setTimeout(function(){notif.remove();},3000);
  }catch(e){console.error('Backup error:',e);}
}

// Start auto-backup every 1 hour (3600000 ms)
function initAutoBackup(){
  autoBackupClients(); // Run once immediately after a delay
  setInterval(autoBackupClients,3600000); // Then every 1 hour
}

// ✅ ACTIVATE AUTO-BACKUP ON PAGE LOAD
window.addEventListener('load', function(){
  setTimeout(initAutoBackup, 2000); // Start after 2 seconds to ensure page is ready
});

// ✅ Phase 3: Enhanced saveCombo with metadata for smart generation
function saveCombo(d,mi){
  var c=getC();if(!c)return;
  var meal=c.weekPlan[d]&&c.weekPlan[d][mi];
  if(!meal||!meal.foods||!meal.foods.length){showErrorToast('Δεν υπάρχουν τρόφιμα για αποθήκευση.');return;}
  showPromptDialog('Όνομα συνδυασμού:', meal.name||'', function(name){
    if(!name||!name.trim())return;

    // Calculate nutritional info for this meal
    var mealKcal=0,mealP=0,mealF=0,mealC=0;
    meal.foods.forEach(function(f){
      var macros=cm(f.n,f.g);
      mealKcal+=macros.k;mealP+=macros.p;mealF+=macros.f;mealC+=macros.c;
    });

    // Create enhanced combo object (for smart generation learning)
    var combo={
      id:'c'+Date.now(),
      name:name.trim(),
      foods:deepClone(meal.foods),
      kcal:Math.round(mealKcal),
      p:Math.round(mealP),f:Math.round(mealF),c:Math.round(mealC),
      mealTiming:meal.mealTiming||'regular',
      dietType:c.dietType||'normal', // so findSavedComboMatch's diet check actually applies
      tags:['approved','manual'], // Mark as dietitian-approved
      createdAt:new Date().toISOString(),
      notes:'' // Optional: why this combo works
    };

    var combos=getSavedCombos();
    combos.push(combo);
    setSavedCombos(combos);
    showSuccessToast('✅ Σύνδυασμός αποθηκευμένος! Το σύστημα θα τον προτείνει στα μελλοντικά πλάνα.');
    renderFoodLib('');
  }, {title:'Αποθήκευση συνδυασμού'});
}

function deleteCombo(id){
  showConfirmDialog('Διαγραφή συνδυασμού;', function(){
    setSavedCombos(getSavedCombos().filter(function(x){return x.id!==id;}));
    renderFoodLib('');
  });
}

function copyMealToClipboard(d,mi){
  var c=getC();if(!c)return;
  var meal=c.weekPlan[d]&&c.weekPlan[d][mi];
  if(!meal||!meal.foods||!meal.foods.length){showErrorToast('Δεν υπάρχουν τρόφιμα για αντιγραφή.');return;}

  // Store meal data in window clipboard buffer
  window.mealClipboard={
    d:d,
    mi:mi,
    meal:deepClone(meal)
  };

  // Show user feedback
  var foodList=meal.foods.map(function(f){return f.n+' ('+f.g+'g)';}).join(', ');
  showSuccessToast('✅ Γεύμα αντιγράφηκε!\n\nΤρόφιμα: '+foodList+'\n\nΌταν πατήσεις + σε άλλο γεύμα, θα δεις επιλογή για επικόλληση.');
}

function pasteMealFromClipboard(d,mi){
  if(!window.mealClipboard){showErrorToast('Δεν υπάρχει γεύμα αποθηκευμένο.');return;}

  var c=getC();if(!c)return;
  var sourceMeal=window.mealClipboard.meal;

  // Copy all foods from clipboard
  sourceMeal.foods.forEach(function(food){
    c.weekPlan[d][mi].foods.push(deepClone(food));
  });

  save();
  renderWeekTable();
  showSuccessToast('✅ Γεύμα επικολλήθηκε!');
}

/* ---- Favorite Meals System ---- */
function getFavoriteMeals(){
  return safeStorageGet('favoriteMeals', []);
}

function saveFavoriteMeals(meals){
  safeStorageSet('favoriteMeals', meals);
}

function toggleFavoriteMeal(d,mi,btn){
  var c=getC();if(!c)return;
  var meal=c.weekPlan[d]&&c.weekPlan[d][mi];
  if(!meal||!meal.foods||!meal.foods.length)return;

  var favs=getFavoriteMeals();
  var mealKey=d+'_'+mi+'_'+(meal.foods.map(function(f){return f.n+f.g;}).join('|'));
  var idx=favs.findIndex(function(f){return f.key===mealKey;});

  if(idx>=0){
    // Remove from favorites
    favs.splice(idx,1);
    btn.style.opacity='0.5';
    showSuccessToast('✅ Αφαιρέθηκε από αγαπημένα');
  } else {
    // Add to favorites
    favs.push({
      key:mealKey,
      name:meal.name||'Γεύμα',
      foods:deepClone(meal.foods),
      createdAt:new Date().toISOString()
    });
    btn.style.opacity='1';
    showErrorToast('⭐ Προστέθηκε στα αγαπημένα!');
  }

  saveFavoriteMeals(favs);
  renderWeekTable();
}

function isFavoriteMeal(d,mi){
  var c=getC();if(!c)return false;
  var meal=c.weekPlan[d]&&c.weekPlan[d][mi];
  if(!meal||!meal.foods)return false;

  var favs=getFavoriteMeals();
  var mealKey=d+'_'+mi+'_'+(meal.foods.map(function(f){return f.n+f.g;}).join('|'));
  return favs.some(function(f){return f.key===mealKey;});
}

function showFavoriteMeals(){
  var favs=getFavoriteMeals();
  if(!favs.length){showErrorToast('Δεν υπάρχουν αγαπημένα γεύματα ακόμη.');return;}

  var html='<div style="background:#fff;border-radius:10px;padding:15px;max-width:500px">';
  html+='<h3 style="color:#025857;margin-top:0;margin-bottom:15px">⭐ Αγαπημένα Γεύματα</h3>';

  favs.forEach(function(fav,idx){
    var foodList=fav.foods.map(function(f){return f.n+' ('+f.g+'g)';}).join(', ');
    html+='<div style="background:#f5f5f5;padding:10px;border-radius:6px;margin-bottom:10px">'
      +'<div style="font-weight:600;color:#025857;margin-bottom:5px">'+fav.name+'</div>'
      +'<div style="font-size:11px;color:#666;margin-bottom:8px">'+foodList+'</div>'
      +'<div style="display:flex;gap:5px">'
        +'<button onclick="pasteFavoriteMeal('+idx+')" style="background:#4caf50;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:10px">📋 Χρήση</button>'
        +'<button onclick="removeFavoriteMeal('+idx+')" style="background:#f44336;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:10px">✕ Διαγραφή</button>'
      +'</div>'
      +'</div>';
  });

  html+='</div>';

  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999';
  modal.innerHTML='<div style="background:#fff;border-radius:10px;padding:20px;max-width:600px;max-height:80vh;overflow-y:auto">'+html+'<button onclick="this.closest(\'div\').parentElement.remove()" style="width:100%;margin-top:15px;padding:8px;background:#999;color:#fff;border:none;border-radius:5px;cursor:pointer">Κλείσιμο</button></div>';
  document.body.appendChild(modal);

  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
}

function pasteFavoriteMeal(idx){
  var favs=getFavoriteMeals();
  var fav=favs[idx];
  if(!fav)return;

  // Ask which meal to paste to
  var c=getC();if(!c)return;
  showPromptDialog('Επιλέξτε ημέρα και γεύμα:', '', function(input){
    if(!input)return;
    var parts=input.split('-');
    var d=parseInt(parts[0]),mi=parseInt(parts[1]);
    if(isNaN(d)||isNaN(mi)||d<0||d>6||mi<0||mi>4){showErrorToast('Άκυρη επιλογή');return;}

    if(!c.weekPlan[d]||!c.weekPlan[d][mi]){showErrorToast('Το γεύμα δεν υπάρχει');return;}

    // Paste the meal
    fav.foods.forEach(function(food){
      c.weekPlan[d][mi].foods.push(deepClone(food));
    });

    save();
    renderWeekTable();
    showSuccessToast('✅ Αγαπημένο γεύμα επικολλήθηκε!');
  }, {title:'Επικόλληση αγαπημένου γεύματος', placeholder:'π.χ. 0-0 για Δευτέρα-Πρωί, 1-0 για Τρίτη-Πρωί'});
}

function removeFavoriteMeal(idx){
  showConfirmDialog('Διαγραφή αγαπημένου γεύματος;', function(){
    var favs=getFavoriteMeals();
    favs.splice(idx,1);
    saveFavoriteMeals(favs);
    showFavoriteMeals();
  });
}

/* ---- Macro Balance Check & Suggestions ---- */
function balanceMacros(d,mi){
  var c=getC();if(!c)return;
  var meal=c.weekPlan[d]&&c.weekPlan[d][mi];
  if(!meal||!meal.foods||!meal.foods.length){showErrorToast('Δεν υπάρχουν τρόφιμα');return;}

  // Calculate current macros
  var totalK=0,totalP=0,totalF=0,totalC=0;
  meal.foods.forEach(function(f){
    var macros=cm(f.n,f.g);
    totalK+=macros.k;totalP+=macros.p;totalF+=macros.f;totalC+=macros.c;
  });

  // Get meal targets (rough estimate: 30% of daily target per meal)
  var tdeeR=calcTDEE(c);
  var targetP=Math.round(tdeeR.p*0.30);
  var targetF=Math.round(tdeeR.f*0.30);
  var targetC=Math.round(tdeeR.carb*0.30);
  var targetK=Math.round(tdeeR.target*0.25);

  // Calculate differences
  var diffP=totalP-targetP;
  var diffF=totalF-targetF;
  var diffC=totalC-targetC;
  var diffK=totalK-targetK;

  // Generate suggestions
  var suggestions=[];
  if(Math.abs(diffP)>5){
    if(diffP<0){
      suggestions.push('➕ <b>Πρωτεΐνη χαμηλή:</b> Προσθέστε κοτόπουλο, ψάρι ή cottage cheese');
    } else {
      suggestions.push('➖ <b>Πρωτεΐνη υψηλή:</b> Μειώστε τη μερίδα κρέατος ή ψαριού');
    }
  }

  if(Math.abs(diffF)>5){
    if(diffF<0){
      suggestions.push('➕ <b>Λιπίδια χαμηλά:</b> Προσθέστε ελαιόλαδο, ξηρούς καρπούς ή σπόρους');
    } else {
      suggestions.push('➖ <b>Λιπίδια υψηλά:</b> Μειώστε το ελαιόλαδο ή τους ξηρούς καρπούς');
    }
  }

  if(Math.abs(diffC)>5){
    if(diffC<0){
      suggestions.push('➕ <b>Υδατάνθρακες χαμηλοί:</b> Προσθέστε ρύζι, πατάτες ή δημητριακά');
    } else {
      suggestions.push('➖ <b>Υδατάνθρακες υψηλοί:</b> Μειώστε τα δημητριακά');
    }
  }

  // Build report
  var report='<div style="background:#fff;border-radius:10px;padding:15px;max-width:500px">';
  report+='<h3 style="color:#025857;margin-top:0">⚖️ Ανάλυση Μακροθρεπτικών</h3>';

  report+='<div style="background:#f5f5f5;padding:12px;border-radius:6px;margin-bottom:15px">';
  report+='<div style="font-weight:600;color:#025857;margin-bottom:8px">📊 Τρέχοντα Macros:</div>';
  report+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">';
  report+='<div>Πρωτεΐνη: <b>'+Math.round(totalP)+'g</b> (στόχος: ~'+targetP+'g)</div>';
  report+='<div>Λιπίδια: <b>'+Math.round(totalF)+'g</b> (στόχος: ~'+targetF+'g)</div>';
  report+='<div>Υδατάνθρακες: <b>'+Math.round(totalC)+'g</b> (στόχος: ~'+targetC+'g)</div>';
  report+='<div>Θερμίδες: <b>'+Math.round(totalK)+'</b> (στόχος: ~'+targetK+')</div>';
  report+='</div></div>';

  if(suggestions.length){
    report+='<div style="background:#fff3cd;padding:12px;border-radius:6px;border-left:4px solid #ffc107">';
    report+='<div style="font-weight:600;color:#856404;margin-bottom:8px">💡 Προτάσεις:</div>';
    suggestions.forEach(function(s){
      report+='<div style="font-size:12px;color:#856404;margin-bottom:6px">'+s+'</div>';
    });
    report+='</div>';
  } else {
    report+='<div style="background:#d4edda;padding:12px;border-radius:6px;border-left:4px solid #28a745">';
    report+='<div style="font-weight:600;color:#155724">✅ Τέλεια ισορροπία!</div>';
    report+='</div>';
  }

  report+='</div>';

  // Show modal
  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999';
  modal.innerHTML='<div style="background:#fff;border-radius:10px;padding:20px;max-width:550px;max-height:80vh;overflow-y:auto">'+report+'<button onclick="this.closest(\'div\').parentElement.remove()" style="width:100%;margin-top:15px;padding:8px;background:#999;color:#fff;border:none;border-radius:5px;cursor:pointer">Κλείσιμο</button></div>';
  document.body.appendChild(modal);

  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
}

/* ---- Food library ---- */
function renderFoodLib(q){
  var el=document.getElementById('lib-list');if(!el)return;
  q=(q||'').toLowerCase().trim();

  // ── Saved combos section (shown only when not searching) ──
  var comboHtml='';
  if(!q){
    var combos=getSavedCombos();
    comboHtml='<div class="combo-section">'
      +'<div class="combo-sec-title">📋 Αποθηκευμένοι Συνδυασμοί</div>';
    if(!combos.length){
      comboHtml+='<div style="font-size:10px;color:#bbb;padding:2px 4px 4px">Κανένας ακόμα — πάτα 💾 σε γεύμα</div>';
    } else {
      combos.forEach(function(combo){
        var cid=combo.id.replace(/'/g,"\\'");
        var preview=combo.foods.slice(0,3).map(function(f){return f.n;}).join(', ')+(combo.foods.length>3?' +':'');
        comboHtml+='<div class="combo-item" draggable="true" data-combo="'+combo.id+'">'
          +'<span class="combo-name">'+combo.name+'</span>'
          +'<span class="combo-count">'+combo.foods.length+'</span>'
          +'<button class="combo-del" onclick="deleteCombo(\''+cid+'\')" title="Διαγραφή">&times;</button>'
          +'</div>'
          +'<div class="combo-preview">'+preview+'</div>';
      });
    }
    comboHtml+='</div>';
  }

  var cats={};
  Object.keys(FOODS).forEach(function(n){
    if(q&&n.toLowerCase().indexOf(q)<0)return;
    var cat=FOODS[n].cat;if(!cats[cat])cats[cat]=[];cats[cat].push(n);
  });
  if(!Object.keys(cats).length){el.innerHTML=comboHtml+'<div style="color:#bbb;font-size:11px;padding:6px">Δεν βρέθηκε</div>';return;}
  var html=comboHtml;
  Object.keys(cats).sort().forEach(function(cat){
    html+='<div class="lib-cat">'+cat+'</div>';
    cats[cat].forEach(function(n){
      var hasIng=(FOODS[n].ingredients||(typeof FYH_RECIPE_EXPAND!=='undefined'&&FYH_RECIPE_EXPAND[n]))?'<button class="lib-recipe-btn" onclick="showRecipeModal(\''+n.replace(/'/g,"\\'")+'\')" title="Δείτε τα συστατικά">📖</button>':'';
      html+='<div class="lib-item" draggable="true" data-food="'+n+'"><span>'+n+'</span>'+hasIng+'<span class="lib-kcal">'+FOODS[n].k+'</span></div>';
    });
  });
  el.innerHTML=html;
  // Drag: saved combos
  el.querySelectorAll('.combo-item').forEach(function(item){
    item.addEventListener('dragstart',function(e){
      e.dataTransfer.setData('text/plain','combo:'+item.dataset.combo);
      e.dataTransfer.effectAllowed='copy';
      setTimeout(function(){item.classList.add('dragging');},0);
    });
    item.addEventListener('dragend',function(){item.classList.remove('dragging');});
  });
  // Drag: foods
  el.querySelectorAll('.lib-item').forEach(function(item){
    item.addEventListener('dragstart',function(e){
      e.dataTransfer.setData('text/plain',item.dataset.food);
      e.dataTransfer.effectAllowed='copy';
      setTimeout(function(){item.classList.add('dragging');},0);
    });
    item.addEventListener('dragend',function(){item.classList.remove('dragging');});
  });
}
function filterLib(inp){renderFoodLib(inp.value);}

/* ---- PDF export (browser print → Save as PDF) ---- */
/* ── English translations for PDF export ─────────────────────────────────── */
var EN_MEAL_NAMES={
  'Πρωινό':'Breakfast','Δεκατιανό':'Morning Snack','Μεσημεριανό':'Lunch',
  'Απογευματινό':'Afternoon Snack','Βραδινό':'Dinner','Βραδινό Σνακ':'Evening Snack',
  'Σνακ':'Snack','Ενδιάμεσο':'Snack','Pre-workout':'Pre-workout','Post-workout':'Post-workout',
  'Πρωινό Σνακ':'Morning Snack','Μεσνύχτιο':'Late Night Snack'
};
var EN_UNITS={
  'τεμ.':'pc.','φέτα':'slice','μερίδ.':'serving','χούφτα':'handful','stick':'stick','scoop':'scoop',
  'φλ.':'cup','κ.σ.':'tbsp','κ.γ.':'tsp',
  '3/4 φλ.':'3/4 cup','1/4 τεμ.':'1/4 pc.','4 τεμ.':'4 pcs.','2 τεμ.':'2 pcs.',
  '12 τεμ.':'12 pcs.','10 τεμ.':'10 pcs.','17 ρόγες':'17 grapes','3 μισά':'3 halves'
};
var EN_FOOD_NAMES={
  // Proteins
  'Κοτόπουλο στήθος (ψητό)':'Chicken Breast (grilled)','Κοτόπουλο μπούτι (ψητό)':'Chicken Thigh (grilled)',
  'Κοτόπουλο σουβλάκι':'Chicken Souvlaki','Κοτόπουλο μπιφτέκι':'Chicken Patty',
  'Γαλοπούλα στήθος':'Turkey (roasted)','Βοδινό άπαχο (ψητό)':'Lean Beef (grilled)',
  'Χοιρινό (μπριζόλα)':'Pork Chop','Αρνί (ψητό)':'Lamb (cooked)','Κουνέλι (μαγ.)':'Rabbit (cooked)',
  'Σολομός (ψητός)':'Salmon (grilled)','Λαβράκι (ψητό)':'Sea Bass (grilled)',
  'Τσιπούρα (ψητή)':'Sea Bream (grilled)','Τόνος (κονσέρβα)':'Tuna (canned)',
  'Σαρδέλες':'Sardines (canned)','Γαρίδες (βραστές)':'Shrimp (boiled)',
  'Χταπόδι (βρ.)':'Octopus (boiled)',
  // Dairy / Eggs
  'Αυγά (ολόκληρα)':'Eggs (whole)','Ασπράδια αυγών':'Egg Whites','Γιαούρτι 2%':'Yogurt 2%','Τυρί φέτα':'Feta Cheese',
  'Μοτσαρέλα':'Mozzarella','Γάλα πλήρες':'Whole Milk','Γάλα αμυγδάλου':'Almond Milk',
  'Πρωτεΐνη σκόνη (whey)':'Whey Protein Powder',
  'Πρωτεΐνη Αμυγδάλου (Amino Animo Organic)':'Almond Protein (Amino Animo Organic)',
  // Grains
  'Βρώμη (ωμή)':'Oats (raw)','Ρύζι άσπρο (βρ.)':'White Rice (cooked)',
  'Ρύζι καστανό (βρ.)':'Brown Rice (cooked)','Κινόα (βρ.)':'Quinoa (cooked)',
  'Μακαρόνια (βρ.)':'Pasta (cooked)','Κριθαράκι (βρ.)':'Orzo (cooked)',
  'Πλιγούρι (βρ.)':'Bulgur (cooked)','Ψωμί σίκαλης':'Rye Bread','Ψωμί λευκό':'White Bread',
  'Πίτα αραβική':'Pita Bread','Κυπριακή πίτα':'Cypriot Pita','Ρυζογκοφρέτες':'Rice Cakes',
  'Μούσλι':'Muesli',
  // Legumes
  'Φασόλια':'Beans','Ρεβίθια':'Chickpeas','Φακές':'Lentils',
  'Μαυρομάτικα':'Black-eyed Peas','Φάβα':'Yellow Split Peas',
  'Tofu (φυσικό)':'Tofu (plain)','Edamame (βρ.)':'Edamame (cooked)',
  // Vegetables
  'Αγγούρι':'Cucumber','Γλυκοπατάτα':'Sweet Potato','Καρότα':'Carrots',
  'Κολοκυθάκια':'Zucchini','Κουνουπίδι':'Cauliflower','Μανιτάρια':'Mushrooms',
  'Μαρούλι':'Lettuce','Μελιτζάνες':'Eggplant','Μπρόκολο':'Broccoli',
  'Μπιζέλια (βραστά/ατμού)':'Green Peas (boiled/steamed)',
  'Πατάτες':'Potatoes','Πιπεριές':'Bell Peppers','Σπανάκι':'Spinach','Παντζάρι (βραστό)':'Beetroot','Παντζάρι (ωμό)':'Beetroot (raw)',
  'Σπαράγγια':'Asparagus','Τομάτες':'Tomatoes','Φασολάκια':'Green Beans',
  'Σαλάτα εποχής':'Seasonal Salad',
  // Fruits
  'Ανανάς':'Pineapple','Αχλάδι':'Pear','Βερίκοκα':'Apricots','Γκρέιπφρούτ':'Grapefruit',
  'Δαμάσκηνα':'Plums','Καρπούζι':'Watermelon','Κεράσια':'Cherries',
  'Μανταρίνι':'Tangerine','Μήλο':'Apple','Μούρα':'Mixed Berries','Μπανάνα':'Banana',
  'Λεμόνι':'Lemon','Νεκταρίνι':'Nectarine','Πεπόνι':'Cantaloupe','Πορτοκάλι':'Orange',
  'Ροδάκινο':'Peach','Σταφίδες':'Raisins','Σταφύλια':'Grapes','Φράουλες':'Strawberries',
  'Μπανάνα αποξηραμένη':'Dried Banana','Βερίκοκα αποξηραμένα':'Dried Apricots',
  'Δαμάσκηνα αποξηραμένα':'Prunes','Cranberries αποξηραμένα':'Dried Cranberries',
  'Μάνγκο αποξηραμένο':'Dried Mango','Ανανάς αποξηραμένος':'Dried Pineapple','Μήλο αποξηραμένο':'Dried Apple',
  // Spices & Herbs
  'Κουρκουμάς':'Turmeric','Μαύρο πιπέρι':'Black Pepper','Κανέλα':'Cinnamon','Τζίντζερ':'Ginger',
  'Ρίγανη':'Oregano','Δεντρολίβανο':'Rosemary','Θυμάρι':'Thyme','Δυόσμος':'Mint','Φασκόμηλο':'Sage',
  'Κουμίν':'Cumin','Γλυκάνισος':'Anise','Κορίανδρος':'Coriander','Τσίλι/Καυτερή πιπ.':'Chili Pepper',
  'Κάρδαμο':'Cardamom','Μοσχοκάρυδο':'Nutmeg','Γαρύφαλλο':'Clove','Σαφράνι':'Saffron','Μάραθος':'Fennel',
  // Nuts / Fats
  'Αμύγδαλα':'Almonds','Καρύδια':'Walnuts','Αβοκάντο':'Avocado',
  'Φυστικοβούτυρο':'Peanut Butter','Αμυγδαλοβούτυρο':'Almond Butter','Ταχίνι':'Tahini','Κάσιους':'Cashews',
  'Ελαιόλαδο':'Olive Oil','Ελιές':'Olives','Μέλι άβραστο':'Raw Honey',
  // FYH Recipes
  'Αυγολέμονο Κυπριακό':'Cypriot Avgolemono','Κοτόπουλο Pesto & Φέτα':'Chicken Pesto & Feta',
  'Pancakes Κυριακής (FYH)':'Sunday Pancakes (FYH)','Βρώμη Πρωινού (FYH)':'Morning Oatmeal (FYH)',
  'Πρωινό Αυγών (FYH)':'Egg Breakfast (FYH)','Τοστ Αυγών (FYH)':'Egg Toast (FYH)',
  'Γιαούρτι Granola (FYH)':'Yogurt & Granola (FYH)','Πίτα Αυγών (FYH)':'Egg Pita (FYH)',
  'Σαλάτα Φακής Μεσογειακή':'Mediterranean Lentil Salad',
  'Μπουλγκούρ-Κινόα Κοτόπουλο':'Bulgur-Quinoa Chicken','Ψάρι στο Φούρνο (FYH)':'Baked Fish (FYH)',
  'Ρύζι-Φακές Stir Fry':'Rice-Lentil Stir Fry','Γκρανόλα χωρίς ζάχαρη':'Sugar-Free Granola',
  'Μπανανόψωμο':'Banana Bread','Muffins Μύρτιλου':'Blueberry Muffins',
  // ✅ Προστέθηκαν 2026-07-05 — συμπλήρωση 171 λειπόντων FOODS (code review)
  // Meat / Poultry
  'Κοτόπουλο βραστό':'Chicken (boiled)','Μπριζόλα άπαχη':'Lean Steak',
  'Βοδινά φιλετάκια':'Beef Strips','Βοδινά μπιφτέκια (ψημένα)':'Beef Patties (grilled)',
  'Μοσχάρι (ψητό)':'Veal (roasted)','Μοσχάρι κιμάς (μαγ.)':'Ground Veal (cooked)',
  'Βοδινός κιμάς (μαγ.)':'Ground Beef (cooked)','Βοδινός κιμάς άπαχος (μαγ.)':'Lean Ground Beef (cooked)',
  'Χοιρινός κιμάς (μαγ.)':'Ground Pork (cooked)','Κιμάς κοτόπουλο (μαγ.)':'Ground Chicken (cooked)',
  'Γαλακτοπουλο (βρ.)':'Turkey (boiled)','Λούτζα':'Lountza (cured pork loin)',
  'Μπιφτέκι Κοτόπουλο Πηδηχτούλης Κόκορας':'Chicken Patty (Pidichtoulis)',
  'Moving Mountains Burger':'Moving Mountains Burger','Grillman Chicken Burger':'Grillman Chicken Burger',
  // Fish / Seafood
  'Μπακαλιάρος (ψητός)':'Cod (grilled)','Σκουμπρί (ψητό)':'Mackerel (grilled)',
  'Καλαμάρι (ψητό)':'Squid (grilled)','Καλαμαράκια (ψητά)':'Baby Squid (grilled)',
  'Μύδια (βρ.)':'Mussels (boiled)','Σούπιες (βρ.)':'Cuttlefish (cooked)',
  'Γαρίδες γίγαντες (βρ.)':'Jumbo Shrimp (cooked)','Καβούρι (βρ.)':'Crab (cooked)',
  'Φιδάκι (ψητό)':'Garfish (grilled)',
  // Dairy / Eggs / Protein products
  'Cottage cheese':'Cottage Cheese','Cream cheese':'Cream Cheese',
  'Στραγγιστό γιαούρτι 0%':'Strained Yogurt 0%','Γιαούρτι πλήρες 5%':'Whole Milk Yogurt 5%',
  'Ανθότυρο':'Anthotyro Cheese','Μυζήθρα':'Myzithra Cheese','Γάλα σόγιας':'Soy Milk',
  'Γάλα βρώμης':'Oat Milk','Γάλα φρέσκο 1.5% Λιπαρά':'Fresh Milk 1.5% Fat',
  'Koko Γιαούρτι Καρύδας (Νηστίσιμο)':'Koko Coconut Yogurt (Vegan)',
  'Γραβιέρα':'Graviera Cheese','Κασέρι':'Kasseri Cheese','Κεφαλοτύρι':'Kefalotyri Cheese',
  'Παρμεζάνα':'Parmesan','Quark (0%)':'Quark (0%)','Ricotta':'Ricotta','Edam light':'Edam Light',
  'Γαλατάκι σοκολάτα delact χωρίς ζάχαρη':'Delact Sugar-Free Chocolate Milk Drink',
  'Χαλλούμι (ψητό)':'Halloumi (grilled)','Χαλλούμι (ωμό)':'Halloumi (raw)',
  'Arla Protein Γιαουρτάκι Σοκολάτα (πουτίγκα)':'Arla Protein Chocolate Yogurt (pudding)',
  'Arla Protein Ρόφημα Σοκολάτα':'Arla Protein Chocolate Drink',
  'Σαγανάκι (τηγανητό)':'Saganaki (fried cheese)','Τυρί Cheddar':'Cheddar Cheese',
  // Grains / Bread
  'Noodles αυγού (M&S)':'Egg Noodles (M&S)','Ψωμάκι Brioche':'Brioche Bun',
  'Ψωμάκι Μπιφτεκιού':'Burger Bun','Τορτίλια (large)':'Tortilla (large)',
  'Ψωμί ολικής άλεσης':'Whole Wheat Bread','Κρίθινο παξιμάδι':'Barley Rusk',
  'Κους κους (βρ.)':'Couscous (cooked)','Σπαγγέτι ολικής (βρ.)':'Whole Wheat Spaghetti (cooked)',
  'Τραχανάς (βρ.)':'Trahana (cooked)','Φρυγανιές':'Rusks','Wasa Φρυγανιές Σίκαλης':'Wasa Rye Crispbread',
  'Κράκερ ολικής':'Whole Wheat Crackers','Popcorn (αέρας)':'Popcorn (air-popped)',
  'Βρώμη (βρ.)':'Oats (cooked)','Ρύζι μαύρο (βρ.)':'Black Rice (cooked)',
  // Legumes
  'Γίγαντες (βρ.)':'Giant Beans (cooked)','Κουκιά (βρ.)':'Fava Beans (cooked)',
  'Αρακάς (βρ.)':'Green Peas (cooked)','Φακές κόκκινες (βρ.)':'Red Lentils (cooked)',
  'Λούπινα (βρ.)':'Lupini Beans (cooked)','Κανελλίνι (βρ.)':'Cannellini Beans (cooked)',
  'Φασόλια μπορλότι (βρ.)':'Borlotti Beans (cooked)','Beyond Beef (φυτικός κιμάς)':'Beyond Beef (plant-based mince)',
  // Vegetables
  'Ρόκα':'Arugula','Πιπεριά κόκκινη':'Red Bell Pepper','Πιπεριά κίτρινη':'Yellow Bell Pepper',
  'Κρεμμύδι':'Onion','Σκόρδο':'Garlic','Κέϊλ (βρ.)':'Kale (cooked)','Ραπανάκι':'Radish',
  'Αγκινάρες (βρ.)':'Artichokes (cooked)','Αγκινάρες καρδιές (κονσ.)':'Artichoke Hearts (canned)',
  'Κρεμμυδάκι (φρέσκο)':'Spring Onion (fresh)','Καλαμπόκι (κονσέρβα)':'Corn (canned)',
  'Καλαμπόκι (ολόκληρο στον ατμό 200g)':'Corn on the Cob (steamed, 200g)',
  'Καλαμπόκι (ολόκληρο στον ατμό 400g - Halvatzis)':'Corn on the Cob (steamed, 400g - Halvatzis)',
  'Μικτά λαχανικά':'Mixed Vegetables',
  // Fruits
  'Σύκα φρέσκα':'Fresh Figs','Σύκα ξερά':'Dried Figs','Ρόδι':'Pomegranate','Ακτινίδιο':'Kiwi',
  'Χουρμάδες (ξερές)':'Dates (dried)','Βύσσινο':'Sour Cherry','Κουμουατ':'Kumquat',
  'Λεμόνι (χυμός)':'Lemon (juice)','Λεμόνι (ξύσμα)':'Lemon (zest)','Χυμό ντομάτας':'Tomato Juice',
  'Πορτοκαλάδα φρέσκια':'Fresh Orange Juice',
  // Nuts / Seeds / Fats
  'Chia seeds':'Chia Seeds','Σκόνη κακάο':'Cocoa Powder','Φιστίκια Αιγίνης':'Aegina Pistachios',
  'Φιστίκια':'Peanuts','Φουντούκια':'Hazelnuts','Κολοκυθόσποροι':'Pumpkin Seeds',
  'Ηλιόσποροι':'Sunflower Seeds','Σουσάμι':'Sesame Seeds','Λιναρόσπορος':'Flaxseed',
  'Βούτυρο':'Butter','Μαργαρίνη light':'Light Margarine','Dark Chocolate 70%':'Dark Chocolate 70%',
  'Ελιές πράσινες':'Green Olives','Ελιές μαύρες':'Black Olives','Κοκος γάλα light':'Light Coconut Milk',
  // Spices / Herbs / Sauces
  'Βασιλικός (φρέσκος)':'Basil (fresh)','Ρίγανη (ξηρή)':'Oregano (dried)','Θυμάρι (φρέσκο)':'Thyme (fresh)',
  'Δυόσμος/Μέντα':'Mint','Άνηθος (φρέσκος)':'Dill (fresh)','Μαϊντανός (φρέσκος)':'Parsley (fresh)',
  'Δεντρολίβανο (φρέσκο)':'Rosemary (fresh)','Κύμινο':'Cumin','Πάπρικα':'Paprika','Μουστάρδα':'Mustard',
  'Βασιλικό':'Basil','Μπούκοβο':'Bukovo (chili flakes)',
  'Βαλσάμικο ξίδι':'Balsamic Vinegar','Σάλτσα γιαουρτιού-άνηθου':'Yogurt-Dill Sauce',
  'Πέστο βασιλικού':'Basil Pesto','Σάλτσα ντομάτας (μαγειρεμένη)':'Tomato Sauce (cooked)',
  'Ταχινοσάλτσα λεμονιού':'Lemon Tahini Sauce','Σάλτσα λεμονιού-ελαιολάδου (λαδολέμονο)':'Lemon-Olive Oil Sauce (Ladolemono)',
  'Τζατζίκι':'Tzatziki','Σάλτσα σόγιας-μελιού':'Soy-Honey Sauce','Σάλτσα σόγιας (μειωμένο αλάτι)':'Soy Sauce (reduced salt)',
  'Σάλσα κόκκινη':'Red Salsa',
  'Μαγιονέζα light':'Light Mayonnaise','Μαρμελάδα φράουλας':'Strawberry Jam','Σάλτσα κάρι light':'Light Curry Sauce',
  'Κύβο λαχανικών':'Vegetable Stock Cube','Αλάτι':'Salt','Αλάτι & μπαχαρικά':'Salt & Spices','Νερό':'Water',
  'Ούζο':'Ouzo','Λευκό κρασί':'White Wine',
  // Snacks / Treats
  'Παστέλι':'Pastelli (sesame-honey bar)','Χαλβάς σεσαμιού':'Sesame Halva','USN Trust Crunch Bar':'USN Trust Crunch Bar',
  // Meals & recipes (High-Protein/Combo)
  'High Protein Ομελέτα Wrap':'High Protein Omelette Wrap','Wrap με τονοσαλάτα':'Tuna Salad Wrap',
  'Chive & Onion Whipped Tofu Toast':'Chive & Onion Whipped Tofu Toast',
  'Berries & Cream Instant Oatmeal':'Berries & Cream Instant Oatmeal',
  'Peanut Butter & Jelly Smoothie Bowl':'Peanut Butter & Jelly Smoothie Bowl',
  'Mixed Berry & Granola Yogurt Parfait':'Mixed Berry & Granola Yogurt Parfait',
  'Ελεύθερο γεύμα':'Free Meal','Korean Beef Bowl':'Korean Beef Bowl','Chicken Lettuce Wraps':'Chicken Lettuce Wraps',
  'Chia Pudding (FYH)':'Chia Pudding (FYH)','Green Protein Smoothie (FYH)':'Green Protein Smoothie (FYH)',
  'Berry Protein Smoothie (FYH)':'Berry Protein Smoothie (FYH)','Protein Pancakes (FYH)':'Protein Pancakes (FYH)',
  'Dark Choc Oat Bites':'Dark Choc Oat Bites','PB Coconut Truffles':'PB Coconut Truffles',
  'Energy Bites (FYH)':'Energy Bites (FYH)','PB Protein Bars':'PB Protein Bars',
  'Σάλτσα Ντομάτας (FYH)':'FYH Tomato Sauce',
  'Breakfast Burrito (Πετρετζίκης)':'Breakfast Burrito (Petretzikis)',
  'Chia Bowl Φράουλα (Πετρετζίκης)':'Strawberry Chia Bowl (Petretzikis)',
  'Overnight Oats Banoffee (Πετρετζίκης)':'Banoffee Overnight Oats (Petretzikis)',
  'Overnight Oats Black Forest (Πετρετζίκης)':'Black Forest Overnight Oats (Petretzikis)',
  'Overnight Oats P.B. & Choco (Πετρετζίκης)':'P.B. & Choco Overnight Oats (Petretzikis)',
  'Αυγά Ποσέ Air Fryer (Πετρετζίκης)':'Air Fryer Poached Eggs (Petretzikis)',
  'Ομελέτα Γαλοπούλα & Λαχ. (Πετρετζίκης)':'Turkey & Veggie Omelette (Petretzikis)',
  'Λιγκουίνι με Γαρίδες (Πετρετζίκης)':'Linguine with Shrimp (Petretzikis)'
};
var EN_CAT_NAMES={
  'Κρέας':'Meat','Ψάρια':'Fish & Seafood','Αυγά/Γαλακτ.':'Eggs & Dairy',
  'Δημητριακά':'Grains','Όσπρια':'Legumes','Λαχανικά':'Vegetables',
  'Φρούτα':'Fruits','Ξηροί καρποί':'Nuts & Seeds','Λάδια':'Oils & Fats',
  'Συνταγές FYH':'FYH Recipes','Άλλα':'Other'
};

// ── 📲 ΔΗΜΟΣΙΕΥΣΗ ΠΛΑΝΟΥ ΣΤΟΝ ΠΕΛΑΤΗ ────────────────────────────────────────
function openPublishModal(){
  var c=getC();
  if(!c){ showErrorToast('Διάλεξε πρώτα πελάτη.'); return; }
  if(!c.weekPlan || !Object.keys(c.weekPlan).length){ showErrorToast('Δεν υπάρχει πλάνο για δημοσίευση.'); return; }
  if(!window.Cloud || !window.Cloud.enabled || !window.Cloud.user){
    showErrorToast('Πρέπει να είσαι συνδεδεμένος στο cloud για να στείλεις πλάνο στον πελάτη.\n(Κάνε αποσύνδεση και ξανασυνδέσου με email/κωδικό.)');
    return;
  }
  // overlay
  var ov=document.getElementById('publish-overlay');
  if(ov) ov.remove();
  ov=document.createElement('div');
  ov.id='publish-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML='<div style="background:#fff;border-radius:16px;max-width:420px;width:100%;padding:22px;box-shadow:0 10px 40px rgba(0,0,0,.25)">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:24px">📲</span><div style="font-size:18px;font-weight:700;color:#014545">Αποστολή πλάνου</div></div>'
    +'<div style="font-size:13px;color:#5a8a82;margin-bottom:16px">Δημιουργία συνδέσμου για τον/την <b>'+esc(c.name||'πελάτη')+'</b>. Ανοίγει στο κινητό — πλάνο, λίστα ψώνια, νερό, συμπληρώματα & πρόοδος.</div>'
    +'<div id="publish-body" style="text-align:center;padding:14px 0"><div style="display:inline-block;width:30px;height:30px;border:3px solid #c5ddd8;border-top-color:#025857;border-radius:50%;animation:fyhspin 1s linear infinite"></div><div style="font-size:13px;color:#5a8a82;margin-top:10px">Δημοσίευση…</div></div>'
    +'<div style="text-align:right;margin-top:8px"><button class="btn" onclick="document.getElementById(\'publish-overlay\').remove()">Κλείσιμο</button></div>'
    +'</div>';
  document.body.appendChild(ov);
  if(!document.getElementById('fyhspin-style')){
    var st=document.createElement('style'); st.id='fyhspin-style'; st.textContent='@keyframes fyhspin{to{transform:rotate(360deg)}}'; document.head.appendChild(st);
  }

  window.Cloud.publishPlan(c).then(function(res){
    var url=res.url;
    var body=document.getElementById('publish-body');
    if(!body)return;
    var expTxt=new Date(res.expiresAt).toLocaleDateString('el-GR',{day:'numeric',month:'long',year:'numeric'});
    var fname=(c.name||'').split(' ')[0];
    var msg='Γεια σου '+fname+'! Εδώ είναι το διατροφικό σου πλάνο: '+url;
    // WhatsApp: αν υπάρχει τηλέφωνο, στείλε κατευθείαν σε αυτό
    var phone=(c.phone||'').replace(/[^0-9]/g,'');
    if(phone && phone.length<=10 && phone.charAt(0)!=='3') phone='30'+phone; // ελληνικός κωδικός χώρας
    var wa='https://wa.me/'+(phone||'')+'?text='+encodeURIComponent(msg);
    // Email: άνοιγμα του email προγράμματος με συμπληρωμένα στοιχεία
    var subj='Το διατροφικό σου πλάνο — Feed Your Health';
    var ebody='Γεια σου '+fname+'!\n\nΕδώ είναι το προσωπικό σου διατροφικό πλάνο. Άνοιξέ το από το κινητό σου:\n\n'+url+'\n\nΘα βρεις το πλάνο διατροφής, τη λίστα για ψώνια, τα συμπληρώματα, την ενυδάτωση και την πρόοδό σου.\n\nΜε εκτίμηση,\nFeed Your Health';
    var mailto='mailto:'+encodeURIComponent(c.email||'')+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(ebody);
    body.style.textAlign='left';
    body.innerHTML='<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">✍️ Προσωπικό μήνυμα στον πελάτη <span style="color:#9fb5b0">(προαιρετικό — φαίνεται στην Αρχική του)</span></div>'
      +'<textarea id="portal-note" rows="2" placeholder="π.χ. Μπράβο για την πρόοδο! Εστίασε στο πρωινό αυτή την εβδομάδα." style="width:100%;box-sizing:border-box;font-size:13px;padding:9px 10px;border:1px solid #c5ddd8;border-radius:8px;resize:vertical;font-family:inherit;color:#1a3330;margin-bottom:8px">'+esc(c.portalNote||'')+'</textarea>'
      +'<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">🎯 Στόχοι για την καρτέλα Πρόοδος <span style="color:#9fb5b0">(προαιρετικό)</span></div>'
      +(c.goalWeight?'':'<div style="font-size:11px;color:#e08a00;margin:-2px 0 8px;line-height:1.4">⚠️ Χωρίς στόχο βάρους ο πελάτης δεν θα δει την κάρτα στόχου στην Αρχική του.</div>')
      +'<div style="display:flex;gap:8px;margin-bottom:8px">'
      +'<div style="flex:1"><label style="font-size:11px;color:#5a8a82">Στόχος βάρους (kg)</label><input type="number" id="portal-goalweight" value="'+(c.goalWeight||'')+'" placeholder="π.χ. 75" step="0.1" style="width:100%;box-sizing:border-box;font-size:13px;padding:8px 10px;border:1px solid #c5ddd8;border-radius:8px;font-family:inherit"></div>'
      +'<div style="flex:1"><label style="font-size:11px;color:#5a8a82">Στόχος % λίπους</label><input type="number" id="portal-goalbf" value="'+(c.goalBF||'')+'" placeholder="π.χ. 15" step="0.1" style="width:100%;box-sizing:border-box;font-size:13px;padding:8px 10px;border:1px solid #c5ddd8;border-radius:8px;font-family:inherit"></div>'
      +'</div>'
      +'<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#1a3330;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="portal-showbfbands"'+(c.portalShowBFBands?' checked':'')+'> Εμφάνιση ζωνών αναφοράς λίπους (ACSM) στον πελάτη</label>'
      +'<button id="portal-note-save" class="btn" style="width:100%;background:#E2EEE5;color:#014545;border:1px solid #c5ddd8;margin-bottom:16px">💾 Αποθήκευση ρυθμίσεων</button>'
      +'<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">Σύνδεσμος πελάτη</div>'
      +'<div style="display:flex;gap:6px;margin-bottom:14px"><input id="publish-url" value="'+esc(url)+'" readonly style="flex:1;font-size:12px;padding:9px 10px;border:1px solid #c5ddd8;border-radius:8px;background:#f4f8f6;color:#014545" onclick="this.select()">'
      +'<button class="btn" style="background:#025857;color:#fff;border:1px solid #025857;white-space:nowrap" onclick="copyPublishUrl(this)">Αντιγραφή</button></div>'
      +'<a href="'+esc(mailto)+'" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#025857;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:8px">📧 Αποστολή με Email'+(c.email?(' ('+esc(c.email)+')'):'')+'</a>'
      +(c.email?'':'<div style="font-size:11px;color:#e08a00;margin:-4px 0 8px;line-height:1.4">⚠️ Δεν έχεις βάλει email στην καρτέλα — θα ανοίξει κενό. Πρόσθεσέ το στα «Βασικά Στοιχεία».</div>')
      +'<a href="'+wa+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#25D366;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:8px">📱 WhatsApp'+(phone?' ('+esc(c.phone)+')':'')+'</a>'
      +'<div style="font-size:11px;color:#9fb5b0;line-height:1.5;margin-bottom:14px">⏳ Ο σύνδεσμος λήγει στις <b>'+expTxt+'</b> ('+window.Cloud.LINK_EXPIRE_DAYS+' μέρες). Όποτε αλλάξεις το πλάνο, πάτα ξανά «Στείλε στον πελάτη» — ο ίδιος σύνδεσμος ενημερώνεται αυτόματα και η λήξη ανανεώνεται.</div>'
      +'<button id="portal-reset-link" class="btn" style="width:100%;background:#fff;color:#c0392b;border:1px solid #f0c2c2;font-size:12px">🔄 Καθαρισμός & νέο σύνδεσμος</button>'
      +'<div style="font-size:11px;color:#9fb5b0;line-height:1.4;margin-top:4px">Σβήνει τον τρέχοντα σύνδεσμο και φτιάχνει καινούριο — χρήσιμο αν ο πελάτης έχει συμπληρώσει νερό/συμπληρώματα/σημειώσεις που θες να «καθαρίσουν». Ο παλιός σύνδεσμος σταματάει να δουλεύει αμέσως.</div>';
    // Αποθήκευση προσωπικού μηνύματος → ξαναδημοσίευση ώστε να μπει στο snapshot
    var noteSave=document.getElementById('portal-note-save'), noteEl=document.getElementById('portal-note');
    if(noteSave&&noteEl){ noteSave.onclick=function(){
      c.portalNote=noteEl.value;
      var gwEl=document.getElementById('portal-goalweight'), gbfEl=document.getElementById('portal-goalbf'), bandsEl=document.getElementById('portal-showbfbands');
      c.goalWeight=(gwEl&&gwEl.value)?parseFloat(gwEl.value):null;
      c.goalBF=(gbfEl&&gbfEl.value)?parseFloat(gbfEl.value):null;
      c.portalShowBFBands=!!(bandsEl&&bandsEl.checked);
      noteSave.disabled=true; noteSave.textContent='Αποθήκευση…';
      window.Cloud.publishPlan(c).then(function(){ noteSave.textContent='✓ Αποθηκεύτηκε'; setTimeout(function(){noteSave.disabled=false;noteSave.textContent='💾 Αποθήκευση ρυθμίσεων';},1600); })
        .catch(function(e){ noteSave.disabled=false; noteSave.textContent='💾 Αποθήκευση ρυθμίσεων'; showErrorToast('Σφάλμα αποθήκευσης: '+(e.message||'')); });
    };}
    // Καθαρισμός & νέο σύνδεσμος → unpublish (σβήνει την παλιά εγγραφή) + νέο token + ξαναδημοσίευση
    var resetBtn=document.getElementById('portal-reset-link');
    if(resetBtn){ resetBtn.onclick=function(){
      // Το #confirmDialog έχει z-index:10000, χαμηλότερο από το publish-overlay (100000) που είναι ήδη ανοιχτό
      // από πάνω του — χωρίς αυτό το boost το κουμπί "Καθαρισμός" θα ήταν οπτικά κρυμμένο πίσω από το τρέχον modal.
      var dlg=document.getElementById('confirmDialog');
      var origZ=dlg?dlg.style.zIndex:'';
      if(dlg) dlg.style.zIndex='100001';
      var restoreZ=function(){ if(dlg) dlg.style.zIndex=origZ; };
      showConfirmDialog('Θα δημιουργηθεί ΝΕΟΣ σύνδεσμος για τον/την «'+esc(c.name||'πελάτη')+'». Ο ΠΑΛΙΟΣ σύνδεσμος θα σταματήσει να δουλεύει αμέσως και όσα είχε καταχωρήσει ο πελάτης (νερό, check-off γευμάτων/συμπληρωμάτων, σημειώσεις βάρους) δεν θα φαίνονται πια — θα χρειαστεί να του στείλεις τον νέο σύνδεσμο.\n\nΣυνέχεια;', function(){
        restoreZ();
        resetBtn.disabled=true; resetBtn.textContent='Γίνεται καθαρισμός…';
        window.Cloud.unpublishPlan(c).then(function(){
          c.shareToken=genSecureToken();
          return window.Cloud.publishPlan(c);
        }).then(function(){
          showSuccessToast('Δημιουργήθηκε νέος, καθαρός σύνδεσμος.');
          openPublishModal();
        }).catch(function(e){
          resetBtn.disabled=false; resetBtn.textContent='🔄 Καθαρισμός & νέο σύνδεσμος';
          showErrorToast('Σφάλμα: '+(e.message||''));
        });
      }, {confirmLabel:'Καθαρισμός', icon:'🔄'});
      var cancelBtn=dlg && dlg.querySelector('button[onclick="closeConfirmDialog()"]');
      if(cancelBtn) cancelBtn.addEventListener('click', restoreZ, {once:true});
    };}
  }).catch(function(e){
    var body=document.getElementById('publish-body');
    if(body) body.innerHTML='<div style="color:#c0392b;font-size:13px">❌ '+esc(e.message||'Σφάλμα δημοσίευσης')+'</div>';
  });
}
function copyPublishUrl(btn){
  var inp=document.getElementById('publish-url');
  if(!inp)return;
  inp.select();
  var ok=false;
  try{ ok=document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(inp.value).then(function(){},function(){}); ok=true; }
  if(ok && btn){ var o=btn.textContent; btn.textContent='✓ Αντιγράφηκε'; setTimeout(function(){btn.textContent=o;},1500); }
}


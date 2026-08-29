// js/plan-gen/plan-transform.js
// Whole-week plan transformation helpers, extracted verbatim from js/app-part3.js
// (module split wave 16): normalizeBreakfasts, removeOatsFromMainMeals,
// reorderMealsToStandardSequence, cloneAndScaleClientPlan. Pure fn declarations
// (take a plan/day structure, return a transformed copy via deepClone); no
// load-time code, no external callers — used only by genPlan & co in app-part3.js
// at runtime. Loads right before app-part3.js.


function normalizeBreakfasts(days, mealTargets){
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

    // ✅ FAT-BUDGET AWARENESS: the standard egg-day recipes (Petretzeakis egg dishes, "Πρωινό Αυγών
    // (FYH)") are all fairly fat-dense (whole eggs + cheese/avocado — confirmed live around ~43-55% of
    // their kcal comes from fat). That's fine at a normal/surplus fat budget, but portion-scaling
    // downstream (scalePlan) can't shrink a whole egg's inherent fat:protein ratio to fit a tight
    // deficit target — confirmed live: a 9g fat/meal target still received ~14g fat from eggs+cheese
    // alone, before the olive oil was even counted, because no gram amount of egg hits that ratio.
    // Below this floor, skip the egg-day override entirely and keep whatever breakfast the goal
    // template itself already chose (already tuned lighter for that calorie level).
    var MIN_FAT_FOR_EGG_BREAKFAST=15; // grams — rough floor an egg-based breakfast needs to fit into
    var brkTarget=(mealTargets&&mealTargets[di]&&mealTargets[di].meals&&mealTargets[di].meals[brkIdx])
      ?mealTargets[di].meals[brkIdx]:null;
    var brkFatTarget=brkTarget?brkTarget.f:null;
    var fatBudgetTooTight=(brkFatTarget!=null&&brkFatTarget>0&&brkFatTarget<MIN_FAT_FOR_EGG_BREAKFAST);

    if(EGG_DAYS[di]&&!fatBudgetTooTight){
      // Egg days → pick whichever egg-based option (3 Petretzeakis recipes + the FYH default) best
      // fits this breakfast's actual fat/protein target, instead of a blind 60/40 random pick.
      // ✅ Confirmed live the old random pick was the direct cause of the teen-athlete fat overshoot:
      // it gave the leanest option ("Ομελέτα Γαλοπούλα & Λαχ." — egg WHITES + turkey, 42.8% fat/35.3%
      // protein-of-kcal) only a 1-in-3 chance whenever the 60%-Petretzeakis branch fired, vs. e.g.
      // "Αυγά Ποσέ Air Fryer" (55.2% fat/17.5% protein — whole eggs + avocado) landing just as often
      // despite being a much worse fit for a protein-forward, tighter-fat target. Same fat%/protein%
      // deviation scoring as findBestRecipe()/findSavedComboMatch() above, applied to this small,
      // fixed candidate set.
      if(!hasEgg){
        var eggCandidates=PETRETZEAKIS_EGG_RECIPES.concat([{n:'Πρωινό Αυγών (FYH)',g:200}]);
        var chosen=null;
        if(brkTarget&&brkTarget.k>0){
          var targetFatPct=(brkTarget.f*9)/brkTarget.k;
          var targetProtPct=(brkTarget.p*4)/brkTarget.k;
          var bestScore=Infinity;
          eggCandidates.forEach(function(cand){
            var v=cm(cand.n,cand.g);
            if(!v.k)return;
            var score=Math.abs((v.f*9)/v.k-targetFatPct)+Math.abs((v.p*4)/v.k-targetProtPct);
            if(score<bestScore){bestScore=score;chosen=cand;}
          });
        }
        if(!chosen){
          // No target info available (e.g. called without mealTargets) — fall back to the old random pick
          var usePetretzeakis=Math.random()<0.6;
          chosen=(usePetretzeakis&&PETRETZEAKIS_EGG_RECIPES.length>0)
            ?PETRETZEAKIS_EGG_RECIPES[di%PETRETZEAKIS_EGG_RECIPES.length]
            :{n:'Πρωινό Αυγών (FYH)',g:200};
        }
        if(chosen.n==='Πρωινό Αυγών (FYH)'){
          meal.foods=[{n:'Πρωινό Αυγών (FYH)',g:200},{n:fruit,g:150}];
        } else {
          meal.foods=[{n:chosen.n,g:chosen.g}];
        }
      }
    } else if(!EGG_DAYS[di]){
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


// ✅ SAFETY: Remove Oats from main meals (lunch/dinner) - Βρώμη only belongs in breakfast
function removeOatsFromMainMeals(tmplDays) {
  for(var d=0; d<7; d++) {
    for(var mi=0; mi<tmplDays[d].length; mi++) {
      var meal = tmplDays[d][mi];

      // Skip breakfast meals - oats are allowed there
      if(classifyMealSlot(meal.name)==='breakfast') continue;

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
//
// 🔧 FIX (2026-08-04, audit finding #1): the previous version matched slots with raw,
// non-lowercased `.includes('Πρωινό')`/etc. substring checks and simply DROPPED any meal
// that didn't match one of the 4 expected names — a custom meal slot (added via
// openAddMealSlotModal), a renamed/lowercased slot, or a 3rd+ "Ενδιάμεσο" silently
// vanished from the plan on every genPlan() call. This now uses the same classifyMealSlot()
// classifier used elsewhere in the pipeline (case-insensitive, stem-based — consistent with
// harvestMealLibrary/findMealAlternates/generateSmartMeal), and — critically — every meal
// from the input day is guaranteed to appear somewhere in the output: only the FIRST
// breakfast/lunch/dinner and the first two snacks are placed in the standard sequence;
// anything left over (extra snacks, duplicate main meals, unrecognized custom slots) is
// appended afterward in its original order instead of being discarded.
function reorderMealsToStandardSequence(tmplDays){
  var reorderedDays=[];
  tmplDays.forEach(function(day){
    if(!day || !day.length){ reorderedDays.push(day||[]); return; }
    var breakfast=null, lunch=null, dinner=null, snacks=[];
    day.forEach(function(m){
      var slot=classifyMealSlot(m && m.name);
      if(slot==='breakfast' && !breakfast) breakfast=m;
      else if(slot==='lunch' && !lunch) lunch=m;
      else if(slot==='dinner' && !dinner) dinner=m;
      else if(slot==='snack') snacks.push(m);
      // else: 'other' (unrecognized name) or a duplicate breakfast/lunch/dinner —
      // preserved below as a leftover instead of being lost.
    });
    var placed=[];
    var newDay=[];
    if(breakfast){newDay.push(breakfast); placed.push(breakfast);}
    if(snacks.length>0){newDay.push(snacks[0]); placed.push(snacks[0]);} // 1st snack (breakfast↔lunch)
    if(lunch){newDay.push(lunch); placed.push(lunch);}
    if(snacks.length>1){newDay.push(snacks[1]); placed.push(snacks[1]);} // 2nd snack (lunch↔dinner)
    if(dinner){newDay.push(dinner); placed.push(dinner);}
    day.forEach(function(m){
      if(placed.indexOf(m)===-1) newDay.push(m); // leftovers, original relative order, nothing lost
    });
    reorderedDays.push(newDay);
  });
  return reorderedDays;
}

// Helper function: Clone and scale a client's plan as basis
function cloneAndScaleClientPlan(baseCId, newClient, newTDEE) {
  var baseClient=null;
  clients.forEach(function(cl){
    if(cl.id===baseCId)baseClient=cl;
  });

  if(!baseClient){
    console.warn('Basis client not found!');
    return null;
  }

  // Check if weekPlan has actual meal data (could be {} or {0: [...], 1: [...], etc})
  var hasWeekPlan = baseClient.weekPlan && (Object.keys(baseClient.weekPlan).length > 0 || baseClient.weekPlan[0]);
  if(!hasWeekPlan){
    console.warn('Basis client has no weekPlan data!');
    return null;
  }

  // Calculate TDEE ratio for scaling
  var baseTDEE=calcTDEE(baseClient);
  var tdeeRatio=newTDEE.target / (baseTDEE.target||1);

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

  return scaledPlan;
}


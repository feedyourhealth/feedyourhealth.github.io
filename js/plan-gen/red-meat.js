// js/plan-gen/red-meat.js
// Red-meat frequency cap for a generated week plan, extracted verbatim from
// js/app-part4.js (module split wave 37): isRedMeat(mealName, mealFoods) and
// enforceRedMeatFrequency(weekPlan, excl, dietType) — trims red-meat main meals
// down to the Mediterranean ceiling. Pure fn declarations, no load-time code.
// Called from genPlan (plan-gen/gen-plan.js) at runtime. Loads with the plan-gen/*
// group, right after med-score.js.

// Identify red meat recipes
function isRedMeat(mealName, mealFoods){
  if(!mealName || !mealFoods)return false;

  var redMeatKeywords = ['Μοσχάρι','Αρνί','Χοιρινό','Κιμάς','Beef','Lamb','Pork'];
  var mealStr = mealName + ' ' + JSON.stringify(mealFoods);

  return redMeatKeywords.some(function(keyword){
    return mealStr.includes(keyword);
  });
}

// Check and enforce red meat frequency (MAX 2x/week)
function enforceRedMeatFrequency(weekPlan, excl, dietType){
  var redMeatCount = 0;
  var redMeatMeals = [];
  excl = excl || [];

  // Count red meat meals
  for(var d=0;d<7;d++){
    if(weekPlan[d]){
      for(var mi=0;mi<weekPlan[d].length;mi++){
        var meal = weekPlan[d][mi];
        if(isRedMeat(meal.name, meal.foods)){
          redMeatCount++;
          redMeatMeals.push({day:d, index:mi, mealName:meal.name});
        }
      }
    }
  }

  // If > 2, replace excess with chicken/fish alternatives (respecting exclusions)
  if(redMeatCount > 2){
    var excessCount = redMeatCount - 2;
    var replacedCount = 0;

    // Replace from the last red meat meals backwards
    for(var i=redMeatMeals.length-1; i>=0 && replacedCount<excessCount; i--){
      var mealLoc = redMeatMeals[i];
      var meal = weekPlan[mealLoc.day][mealLoc.index];

      // meal.kcal isn't a stored field on weekPlan meal objects — compute it from the actual foods,
      // otherwise findBestRecipe's calorie-match compares against undefined (NaN) and never matches anything.
      var mealKcal = (meal.foods||[]).reduce(function(sum,f){ return sum + cm(f.n,f.g).k; }, 0);

      // Find alternative chicken or fish recipe with similar calories, respecting exclusions.
      // MUST use the client's actual dietType, not a hardcoded 'normal' — otherwise a keto client
      // (who legitimately eats red meat >2x/week; this cap is a general cardiovascular guideline,
      // not a keto rule) gets "fixed" straight out of ketosis with a high-carb normal-diet recipe
      // (confirmed live: swapped in a 62g-carb shrimp-orzo dish and a 39g-carb pita souvlaki).
      var altRecipe = findBestRecipe(dietType||'normal', mealKcal, meal.name, excl);
      if(altRecipe && !isRedMeat(altRecipe.name, altRecipe.foods)){
        meal.foods = altRecipe.foods;
        meal.name = altRecipe.name;
        meal.recipeId = altRecipe.id;
        replacedCount++;
        console.log('Red meat limit: Replaced ' + mealLoc.mealName + ' with ' + altRecipe.name);
      }
    }

    console.log('Red meat frequency: ' + redMeatCount + ' → Max 2. Replaced ' + replacedCount);
  }

  return weekPlan;
}


// js/tracking/tracking.js
// The behavioural tracking / meal-alternatives / analytics-dashboard block, extracted
// from js/app-part4.js (module split wave 8). Pure function declarations, zero load-time
// code:
//   loadTrackingData / saveTrackingData / getMealDisplayName / ensureRecipeTrackingEntry
//   logPlanGeneration / logRegenerate / calculateRecipeStats / rateMeal
//   generateDiverseAlternatives / showMealAlternatives / closeAltModal / replaceMeal
//   getMealRatingStats / analyzePatterns / showTrackingDashboard / closeTrackingDashboard
// All refs (safeStorageGet/Set, TRACKING_DATA, getC, cm, deepClone, TMPLS, calcTDEE,
// scalePlan, renderWeekTable, genPlan, findRecipeById, …) are runtime-only. Loads right
// after app-part4.js; app-part4's window-load handler calls loadTrackingData() after all
// scripts have parsed.

// ══════════════════════════════════════════════════════════════════════════════
// BEHAVIORAL TRACKING SYSTEM — Learning from your usage patterns
// ══════════════════════════════════════════════════════════════════════════════

// TRACKING_DATA is initialized earlier in the script.
// Load tracking data from localStorage
function loadTrackingData(){
  var stored = safeStorageGet('dietologist_tracking', null);
  if(stored && typeof stored === 'object'){
    TRACKING_DATA = stored;
  } else {
    TRACKING_DATA = { plans: [], recipes: {}, patterns: {}, lastUpdated: null };
  }
}

// Save tracking data to localStorage
function saveTrackingData(){
  TRACKING_DATA.lastUpdated = new Date().toISOString();
  safeStorageSet('dietologist_tracking', TRACKING_DATA);
}

// Real display name for a tracked meal — meal.name is always just the meal-time slot
// label ("Πρωινό"/"Μεσημεριανό"/"Βραδινό"/"Ενδιάμεσο", set once from TMPLS and never
// overwritten once real foods are filled in), so it's useless for telling recipes apart
// in Tracking Analytics. Prefer the chef recipe's real title, then fall back to the
// actual foods in the meal.
function getMealDisplayName(meal){
  if(meal.recipeId && typeof findRecipeById==='function'){
    var r = findRecipeById(meal.recipeId);
    if(r && r.name) return r.name;
  }
  if(meal.foods && meal.foods.length){
    return meal.foods.slice(0,3).map(function(f){return f.n;}).join(', ');
  }
  return meal.name || 'Γεύμα';
}

// Shared init for a TRACKING_DATA.recipes[trackKey] entry — used by both logPlanGeneration (usage
// stats) and rateMeal (👍/👎), so a rating on a recipe that hasn't been logged yet (edge case) still
// has somewhere real to land instead of throwing.
function ensureRecipeTrackingEntry(trackKey, name){
  if(!TRACKING_DATA.recipes[trackKey]){
    TRACKING_DATA.recipes[trackKey] = {
      id: trackKey,
      name: name || trackKey,
      timesUsed: 0,
      successCount: 0,
      regenerateCount: 0,
      clientsUsedWith: [],
      lastUsed: null,
      ratings: [],           // {date, rating: 1 or -1, clientName}
      thumbsUp: 0,
      thumbsDown: 0
    };
  }
  return TRACKING_DATA.recipes[trackKey];
}

// Log plan generation
function logPlanGeneration(client, weekPlan){
  if(!client || !weekPlan)return;

  var planLog = {
    timestamp: new Date().toISOString(),
    clientName: client.name || 'Unknown',
    goal: client.goal,
    dietType: client.dietType,
    mealsUsed: [],
    mealRatings: {},  // {"0-0": {rating: 1, date}, "0-1": {rating: -1, date}}
    regeneratedAt: null,
    planDuration: 0,
    status: 'active'
  };

  // Extract all recipes used. trackKey identifies the meal for trust tracking regardless of where
  // it came from: a chef recipe's stable id (meal.recipeId), or a taste-library/saved-combo meal's
  // content signature (meal.recipeSig) — most real plans are library-sourced, so without this they'd
  // never accumulate usage history at all.
  for(var d=0;d<7;d++){
    if(weekPlan[d]){
      for(var mi=0;mi<weekPlan[d].length;mi++){
        var meal = weekPlan[d][mi];
        var trackKey = meal.recipeId || meal.recipeSig;
        if(trackKey){
          planLog.mealsUsed.push({
            day: d,
            mealIndex: mi,
            recipeId: trackKey,
            mealName: getMealDisplayName(meal)
          });

          // Update recipe stats
          ensureRecipeTrackingEntry(trackKey, getMealDisplayName(meal));
          TRACKING_DATA.recipes[trackKey].timesUsed++;
          TRACKING_DATA.recipes[trackKey].lastUsed = new Date().toISOString();

          if(!TRACKING_DATA.recipes[trackKey].clientsUsedWith.includes(client.name)){
            TRACKING_DATA.recipes[trackKey].clientsUsedWith.push(client.name);
          }
        }
      }
    }
  }

  TRACKING_DATA.plans.push(planLog);
  saveTrackingData();
}

// Track when plan is regenerated (negative signal)
function logRegenerate(planIndex){
  if(planIndex >= 0 && planIndex < TRACKING_DATA.plans.length){
    var plan = TRACKING_DATA.plans[planIndex];
    plan.regeneratedAt = new Date().toISOString();
    plan.status = 'regenerated';

    // Mark recipes as problematic
    plan.mealsUsed.forEach(function(meal){
      if(TRACKING_DATA.recipes[meal.recipeId]){
        TRACKING_DATA.recipes[meal.recipeId].regenerateCount++;
      }
    });

    saveTrackingData();
    console.log('Regenerate tracked');
  }
}

// Calculate success rate for each recipe
function calculateRecipeStats(){
  var stats = {};

  Object.keys(TRACKING_DATA.recipes).forEach(function(recipeId){
    var recipe = TRACKING_DATA.recipes[recipeId];
    var successRate = recipe.timesUsed > 0 ?
      (1 - (recipe.regenerateCount / recipe.timesUsed)) * 100 : 0;

    stats[recipeId] = {
      name: recipe.name,
      timesUsed: recipe.timesUsed,
      successRate: Math.round(successRate),
      usedWithClients: recipe.clientsUsedWith.length,
      trustScore: calculateTrustScore(recipe),
      lastUsed: recipe.lastUsed
    };
  });

  return stats;
}

// Rate a meal (day + meal index)
function rateMeal(dayIndex, mealIndex, rating){
  var c = getC();
  if(!c || !c.weekPlan || dayIndex === undefined || mealIndex === undefined) return;

  var mealKey = dayIndex + '-' + mealIndex;
  var meal = c.weekPlan[dayIndex][mealIndex];
  var mealName = meal ? meal.name : 'Γεύμα';

  // Find the current plan in TRACKING_DATA
  var currentPlan = TRACKING_DATA.plans[TRACKING_DATA.plans.length - 1];
  if(!currentPlan) return;

  // Initialize mealRatings if needed
  if(!currentPlan.mealRatings) currentPlan.mealRatings = {};

  // Add rating (1 = thumbs up, -1 = thumbs down)
  currentPlan.mealRatings[mealKey] = {
    rating: rating,
    date: new Date().toISOString(),
    mealName: mealName,
    foods: meal && meal.foods ? meal.foods.map(f => f.n).join(', ') : ''
  };

  // ✅ Feed the rating into the SAME recipeId/recipeSig trust-score store logPlanGeneration()
  // already populates (TRACKING_DATA.recipes[trackKey]) — until this fix, thumbsUp/thumbsDown/
  // ratings existed in the schema but were never written or read anywhere (confirmed 2026-07-30,
  // see [[dietologist-pending-work]]), so 👎 had zero effect beyond a history-log entry no future
  // plan generation ever consulted. A single vote is a weak, personal-taste signal (not necessarily
  // "this recipe is bad"), so it only nudges the global trust score (see calculateTrustScore's
  // Laplace smoothing, js/app-part3.js) — the stronger, immediate effect is per-client below.
  var trackKey = meal && (meal.recipeId || meal.recipeSig);
  if(trackKey){
    var entry = ensureRecipeTrackingEntry(trackKey, mealName);
    entry.ratings.push({date: new Date().toISOString(), rating: rating, clientName: c.name || ''});
    if(rating > 0) entry.thumbsUp++; else if(rating < 0) entry.thumbsDown++;

    // ✅ Per-client hard block: a 👎'd recipe/combo should not be re-offered to THIS client on a
    // future regenerate (whole-week or per-day) — the global trust nudge above is too weak to
    // reliably keep one disliked dish from resurfacing for the same person. genPlan()'s recipe/
    // combo lookups (findBestRecipe/findSavedComboMatch/generateSmartMeal) skip anything in
    // c.dislikedRecipeIds. A later 👍 on the same recipe reverses it — reachable if it's cloned
    // into this client's plan again via "Βάση πλάνου" from a different client, or manually re-added.
    c.dislikedRecipeIds = c.dislikedRecipeIds || [];
    var idx = c.dislikedRecipeIds.indexOf(trackKey);
    if(rating < 0 && idx === -1) c.dislikedRecipeIds.push(trackKey);
    else if(rating > 0 && idx !== -1) c.dislikedRecipeIds.splice(idx, 1);
    save();
  }

  // Update UI feedback - change button colors
  var upBtn = document.querySelector('[data-meal-rating="' + mealKey + '"][data-rating="up"]');
  var downBtn = document.querySelector('[data-meal-rating="' + mealKey + '"][data-rating="down"]');

  if(rating > 0){
    if(upBtn) { upBtn.style.background = '#4caf50'; upBtn.style.color = 'white'; }
    if(downBtn) { downBtn.style.background = ''; downBtn.style.color = '#888'; }
  } else if(rating < 0){
    if(downBtn) { downBtn.style.background = '#d9534f'; downBtn.style.color = 'white'; }
    if(upBtn) { upBtn.style.background = ''; upBtn.style.color = '#888'; }
  }

  saveTrackingData();
  console.log('Meal rated: Day ' + dayIndex + ', ' + mealName + ' (' + (rating > 0 ? '👍' : '👎') + ')');
}

// Helper: Generate diverse alternatives (different food categories)
function generateDiverseAlternatives(targetCalories, dayIndex, excludedFoods, mealName, count, macroTargets){
  var alternatives = [];
  macroTargets = macroTargets || {};

  // Determine meal type from name (classifyMealSlot — same classifier the plan-generation
  // pipeline uses, js/app-part3.js — keeps this consistent with genPlan's own meal typing)
  var _slot = classifyMealSlot(mealName);
  var isBreakfast = _slot==='breakfast';
  var isSnack = _slot==='snack';
  var isLunch = _slot==='lunch';
  var isDinner = _slot==='dinner';

  // Macro targets to match
  var targetP = macroTargets.targetProtein || 0;
  var targetF = macroTargets.targetFat || 0;
  var targetC = macroTargets.targetCarbs || 0;
  var excludeFoods = macroTargets.excludeFoods || [];

  // Diet-type awareness (e.g. orthodox_fasting/vegan/vegetarian) — without this, a swap
  // could freely suggest meat/fish/dairy for a fasting client since this generator builds
  // candidates straight from FOODS, bypassing applyDietTypeCategorySafetyNet entirely.
  var dietForbiddenCats = DIET_TYPE_FORBIDDEN_CATS[macroTargets.dietType] || [];
  var dayAllowedCats = (macroTargets.dietExceptionDays &&
    (macroTargets.dietExceptionDays[dayIndex] || macroTargets.dietExceptionDays[String(dayIndex)])) || [];
  var dayAllowedFoods = (macroTargets.dietFoodExceptionDays &&
    (macroTargets.dietFoodExceptionDays[dayIndex] || macroTargets.dietFoodExceptionDays[String(dayIndex)])) || [];
  var dayForbiddenCats = dietForbiddenCats.filter(function(cat){return dayAllowedCats.indexOf(cat)===-1;});
  function isDietForbidden(foodName){
    if(!dayForbiddenCats.length) return false;
    if(dayAllowedFoods.indexOf(foodName)!==-1) return false;
    var fd = FOODS[foodName];
    if(fd && fd.plantBased) return false; // e.g. almond/soy/oat milk — see data.js note
    var foodCat = fd ? fd.cat : '';
    if(dayForbiddenCats.indexOf(foodCat)!==-1) return true;
    // Same composite-dish blind spot as applyDietTypeCategorySafetyNet (js/app-part2.js) —
    // a "Συνταγές FYH"-tagged dish can hide meat/fish/eggs that its own .cat doesn't reveal.
    return !!(fd && fd.containsCats && fd.containsCats.some(function(hc){return dayForbiddenCats.indexOf(hc)!==-1;}));
  }

  // Collect different protein options based on meal type
  var proteinOptions = [];
  var carbOptions = [];
  var veggieOptions = [];
  var dairyOptions = [];
  var fruitOptions = [];

  // Categorize foods
  for(var foodName in FOODS){
    if(!FOODS.hasOwnProperty(foodName)) continue;
    if(excludedFoods && excludedFoods.indexOf(foodName) !== -1) continue;
    if(isDietForbidden(foodName)) continue;

    var lower = foodName.toLowerCase();

    // Heavy proteins (for lunch/dinner)
    if(!isBreakfast && (lower.includes('κοτόπουλο') || lower.includes('ψάρι') || lower.includes('τόνο') ||
       lower.includes('κιμάς') || lower.includes('σολομό') || lower.includes('γαρίδα') ||
       lower.includes('χοιρινό') || lower.includes('αρνί') || lower.includes('βοδινό'))){
      proteinOptions.push(foodName);
    }

    // Light proteins (eggs - for breakfast/snacks, NOT legumes)
    if(lower.includes('αβγό')){
      proteinOptions.push(foodName);
    }

    // Legumes (only for lunch/dinner, NOT breakfast)
    if(!isBreakfast && (lower.includes('φασόλι') || lower.includes('φακή'))){
      proteinOptions.push(foodName);
    }

    // Carb foods - differentiate by type
    if(isBreakfast){
      // Breakfast carbs: δημητριακά, ψωμί, avena
      if(lower.includes('δημητριακά') || lower.includes('ψωμί') || lower.includes('αρτο') ||
         lower.includes('κροασάν') || lower.includes('avena')){
        carbOptions.push(foodName);
      }
    } else {
      // Lunch/dinner carbs: ρύζι, πατάτα, κινόα, κριθάρι
      if(lower.includes('ρύζι') || lower.includes('πατάτα') || lower.includes('κινόα') ||
         lower.includes('κριθάρι') || lower.includes('νουντλς')){
        carbOptions.push(foodName);
      }
    }

    // Veggie/side foods
    if(lower.includes('σαλάτα') || lower.includes('λαχανικό') || lower.includes('ντομάτα') ||
       lower.includes('αγγούρι') || lower.includes('μαρούλι') || lower.includes('παντζάρι')){
      veggieOptions.push(foodName);
    }

    // Dairy (breakfast/snacks)
    if(isBreakfast || isSnack){
      if(lower.includes('γιαούρτι') || lower.includes('φέτα') || lower.includes('τυρί') ||
         lower.includes('γάλα') || lower.includes('κοτάζ')){
        dairyOptions.push(foodName);
      }
    }

    // Fruits (breakfast/snacks)
    if(isBreakfast || isSnack){
      if(lower.includes('μήλο') || lower.includes('μπανάνα') || lower.includes('φράουλα') ||
         lower.includes('πορτοκάλι') || lower.includes('κιβι') || lower.includes('γεγονός')){
        fruitOptions.push(foodName);
      }
    }
  }

  // Create 3 diverse combinations based on meal type (matching macros)
  for(var attempt = 0; attempt < 10 && alternatives.length < 3; attempt++){
    var meal = {foods: []};

    if(isBreakfast){
      // Breakfast: Build meal targeting carbs & protein
      // Select carb source
      if(carbOptions.length > 0){
        var carb = carbOptions[Math.floor(Math.random() * carbOptions.length)];
        if(!excludeFoods.includes(carb)){
          var cMacros = cm(carb, 100);
          var cGrams = targetC > 0 ? (targetC * 0.7 * 100) / cMacros.c : (targetCalories * 0.5) / (cMacros.k / 100);
          meal.foods.push({n: carb, g: Math.round(Math.max(30, Math.min(300, cGrams)))});
        }
      }

      // Select protein source (dairy/eggs for breakfast)
      if(targetP > 0 && (dairyOptions.length > 0 || proteinOptions.length > 0)){
        var protOptions = dairyOptions.concat(proteinOptions.filter(p => !p.includes('κιμάς')));
        if(protOptions.length > 0){
          var prot = protOptions[Math.floor(Math.random() * protOptions.length)];
          if(!excludeFoods.includes(prot)){
            var pMacros = cm(prot, 100);
            var pGrams = (targetP * 0.8 * 100) / pMacros.p;
            meal.foods.push({n: prot, g: Math.round(Math.max(30, Math.min(300, pGrams)))});
          }
        }
      }

      // Add fruit if space
      if(fruitOptions.length > 0 && meal.foods.length < 3){
        var fruit = fruitOptions[Math.floor(Math.random() * fruitOptions.length)];
        if(!excludeFoods.includes(fruit)){
          meal.foods.push({n: fruit, g: 150});
        }
      }
    } else if(isSnack){
      // Snack: Light option matching macros
      if(targetP > 5){
        // Protein-based snack
        var snackProt = dairyOptions.length > 0 ? dairyOptions[Math.floor(Math.random() * dairyOptions.length)] :
                        proteinOptions[Math.floor(Math.random() * proteinOptions.length)];
        if(!excludeFoods.includes(snackProt)){
          meal.foods.push({n: snackProt, g: 150});
        }
      } else if(fruitOptions.length > 0){
        var snackFruit = fruitOptions[Math.floor(Math.random() * fruitOptions.length)];
        if(!excludeFoods.includes(snackFruit)){
          meal.foods.push({n: snackFruit, g: 200});
        }
      }
    } else {
      // Lunch/Dinner: Match protein, carbs, fat
      var mealProto = proteinOptions[Math.floor(Math.random() * proteinOptions.length)];
      if(mealProto && !excludeFoods.includes(mealProto)){
        var prMacros = cm(mealProto, 100);
        var prGrams = targetP > 0 ? (targetP * 100) / prMacros.p : (targetCalories * 0.35) / (prMacros.k / 100);
        meal.foods.push({n: mealProto, g: Math.round(Math.max(50, Math.min(250, prGrams)))});
      }

      if(carbOptions.length > 0){
        var mealCarb = carbOptions[Math.floor(Math.random() * carbOptions.length)];
        if(mealCarb && !excludeFoods.includes(mealCarb)){
          var crMacros = cm(mealCarb, 100);
          var crGrams = targetC > 0 ? (targetC * 100) / crMacros.c : (targetCalories * 0.45) / (crMacros.k / 100);
          meal.foods.push({n: mealCarb, g: Math.round(Math.max(50, Math.min(300, crGrams)))});
        }
      }

      if(veggieOptions.length > 0){
        var mealVeg = veggieOptions[Math.floor(Math.random() * veggieOptions.length)];
        if(!excludeFoods.includes(mealVeg)){
          meal.foods.push({n: mealVeg, g: 150});
        }
      }
    }

    if(meal.foods.length > 0){
      var mealStr = meal.foods.map(f => f.n).join(', ');
      if(!alternatives.some(a => a.foodsStr === mealStr)){
        alternatives.push({foods: meal.foods, foodsStr: mealStr});
      }
    }
  }

  return alternatives.slice(0, count || 3);
}

// Show alternative meal options when user rates meal as 👎
function showMealAlternatives(dayIndex, mealIndex){
  var c = getC();
  if(!c || !c.weekPlan || !c.weekPlan[dayIndex] || !c.weekPlan[dayIndex][mealIndex]) return;

  var currentMeal = c.weekPlan[dayIndex][mealIndex];
  var mealName = currentMeal.name || '';
  var currentCalories = 0;
  var currentProtein = 0, currentFat = 0, currentCarbs = 0;
  var excl = (c.foodExclude || []);
  var currentFoodNames = [];

  // Calculate current meal macros and remember food names
  if(currentMeal.foods){
    currentMeal.foods.forEach(function(f){
      currentFoodNames.push(f.n);
      var r = cm(f.n, f.g);
      currentCalories += r.k;
      currentProtein += r.p;
      currentFat += r.f;
      currentCarbs += r.c;
    });
  }

  // ✅ PRIORITY 1: Check saved combos (favorite meals marked with ⭐)
  var alternatives = [];
  var savedCombos = getSavedCombos();

  if(savedCombos && savedCombos.length > 0) {
    var exclLowerSMA = excl.map(function(x){return (x||'').toLowerCase();}).filter(Boolean);
    // Find saved combos compatible with current meal type and calorie target
    // Use ±100 kcal tolerance for saved combos to find similar meals
    for(var si = 0; si < savedCombos.length; si++) {
      var savedCombo = savedCombos[si];
      var savedComboKcal = savedCombo.kcal || 0;
      var savedComboName = savedCombo.name || mealName;

      // Check: same meal type (breakfast, lunch, dinner, snack) and calorie range
      var isSameMealType = !savedCombo.mealTiming ||
                          (mealName && savedCombo.mealTiming &&
                           mealName.toLowerCase().indexOf(savedCombo.mealTiming.toLowerCase()) !== -1);

      var isWithinCaloricRange = Math.abs(savedComboKcal - currentCalories) <= 120; // ±120 kcal

      // Check: combo's tagged diet type is compatible with this client's diet
      var isDietCompatible = comboDietOK(c.dietType, savedCombo.dietType);

      // Check: no excluded foods in saved combo
      var hasExcludedFood = comboHasExcludedFood(savedCombo.foods, exclLowerSMA);

      // Add to alternatives if compatible (same meal type, within calorie range, diet-compatible, no excluded foods)
      if(isSameMealType && isWithinCaloricRange && isDietCompatible && !hasExcludedFood && savedCombo.foods && savedCombo.foods.length > 0) {
        alternatives.push({
          foods: deepClone(savedCombo.foods),
          isSavedCombo: true,
          comboName: savedComboName,
          priority: 'saved'
        });
      }

      // Limit to 2 saved combos to leave room for generated alternatives
      if(alternatives.length >= 2) break;
    }
  }

  // ✅ PRIORITY 2: Generate new alternatives if we need more options
  var generatedAlternatives = [];
  var alternativesNeeded = 3 - alternatives.length;

  if(alternativesNeeded > 0) {
    generatedAlternatives = generateDiverseAlternatives(currentCalories, dayIndex, excl, mealName, alternativesNeeded, {
      targetProtein: currentProtein,
      targetFat: currentFat,
      targetCarbs: currentCarbs,
      excludeFoods: currentFoodNames,
      dietType: c.dietType,
      dietExceptionDays: c.dietExceptionDays,
      dietFoodExceptionDays: c.dietFoodExceptionDays
    });

    // Add generated alternatives with priority flag
    generatedAlternatives.forEach(function(alt) {
      alternatives.push({
        foods: alt.foods,
        isSavedCombo: false,
        priority: 'generated'
      });
    });
  }

  // Build modal HTML
  var modalHtml = '<div style="max-width:600px">'
    +'<h3 style="color:#d9534f;margin-bottom:15px">Εναλλακτικές επιλογές για ' + mealName + '</h3>'
    +'<p style="color:#666;font-size:12px;margin-bottom:15px">Επιλέξτε μια εναλλακτική ή αφήστε το αρχικό γεύμα</p>';

  // PHASE 1: Generate scaled versions of each alternative
  var scaledAlternatives = [];
  alternatives.forEach(function(alt, idx){
    var tempMeal = {foods: deepClone(alt.foods), name: mealName};
    var effTarget = {
      k: currentCalories,
      p: currentProtein,
      f: currentFat,
      c: currentCarbs
    };
    var scaledMeal = scalePlan([tempMeal], effTarget)[0];
    scaledAlternatives.push({
      original: alt,
      scaled: scaledMeal
    });
  });

  // PHASE 2: Validate each scaled alternative
  var validAlternativesData = [];
  scaledAlternatives.forEach(function(altData, idx){
    var scaledMeal = altData.scaled;

    // Calculate actual macros after scaling
    var altProtein = 0, altFat = 0, altCarbs = 0, altCalories = 0;
    scaledMeal.foods.forEach(function(f){
      var r = cm(f.n, f.g);
      altCalories += r.k;
      altProtein += r.p;
      altFat += r.f;
      altCarbs += r.c;
    });

    // Calculate deviations (for reference only, no filtering)
    var calorieDeviation = Math.abs(altCalories - currentCalories) / currentCalories * 100;
    var proteinDeviation = currentProtein > 0 ? Math.abs(altProtein - currentProtein) / currentProtein * 100 : 0;
    var carbsDeviation = currentCarbs > 0 ? Math.abs(altCarbs - currentCarbs) / currentCarbs * 100 : 0;
    var fatDeviation = currentFat > 0 ? Math.abs(altFat - currentFat) / currentFat * 100 : 0;

    // Accept ALL alternatives (no filtering)
    var isValid = true;

    console.log('Alternative ' + idx + ': K=' + altCalories.toFixed(0) + ' (dev ' + calorieDeviation.toFixed(1) + '%), P=' + altProtein.toFixed(1) + ' (dev ' + proteinDeviation.toFixed(1) + '%), C=' + altCarbs.toFixed(1) + ' (dev ' + carbsDeviation.toFixed(1) + '%), F=' + altFat.toFixed(1) + ' (dev ' + fatDeviation.toFixed(1) + '%) - VALID=' + isValid);

    if(isValid){
      validAlternativesData.push({
        index: idx,
        scaled: scaledMeal,
        calories: altCalories,
        protein: altProtein,
        carbs: altCarbs,
        fat: altFat,
        calorieDeviation: calorieDeviation,
        proteinDeviation: proteinDeviation,
        carbsDeviation: carbsDeviation,
        fatDeviation: fatDeviation
      });
    }
  });

  // PHASE 3: Build modal with only valid alternatives
  validAlternativesData.forEach(function(data, displayIdx){
    var altData = alternatives[data.index];
    var isSaved = altData && altData.isSavedCombo;
    var badgeHtml = isSaved ? '<span style="background:#ff9800;color:white;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:bold;margin-left:6px">⭐ Αγαπημένο</span>' : '';

    modalHtml += '<div style="background:' + (isSaved ? '#fff3e0' : '#f5f5f5') + ';border:' + (isSaved ? '2px solid #ff9800' : '1px solid #ddd') + ';border-radius:6px;padding:10px;margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
      +'<div><b style="color:#025857">Επιλογή ' + (displayIdx+1) + '</b>' + badgeHtml + '</div>'
      +'<div style="font-size:11px;color:#666">'
      + Math.round(data.calories) + ' kcal (±' + data.calorieDeviation.toFixed(1) + '%) | '
      + 'P: ' + Math.round(data.protein) + 'g (±' + data.proteinDeviation.toFixed(1) + '%)'
      +'</div>'
      +'</div>'
      +'<div style="font-size:12px;color:var(--text-strong);margin-bottom:10px">' + data.scaled.foods.map(f => f.n + ' ' + Math.round(f.g) + 'g').join(' + ') + '</div>'
      +'<button onclick="replaceMeal(' + dayIndex + ',' + mealIndex + ',' + data.index + ')" style="background:#4caf50;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:11px">✓ Επιλέξ αυτή</button>'
      +'</div>';

    // Store SCALED version for replacement
    alternatives[data.index].foods = deepClone(data.scaled.foods);
  });

  // Note: All alternatives are now shown (no filtering)

  modalHtml += '<div style="margin-top:15px;padding-top:15px;border-top:1px solid #ddd">'
    +'<button onclick="closeAltModal()" style="background:#888;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:11px">× Κράτησε το αρχικό</button>'
    +'</div></div>';

  // Store alternatives for replaceMeal function
  window.currentAlternatives = alternatives;

  // Show modal
  var modal = document.getElementById('altMealModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'altMealModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000';
    document.body.appendChild(modal);
  }

  var content = modal.querySelector('[role="dialog"]') || document.createElement('div');
  content.role = 'dialog';
  content.style.cssText = 'background:var(--card-bg);border-radius:8px;padding:20px;max-height:80vh;overflow-y:auto;max-width:500px';
  content.innerHTML = modalHtml;

  if(!modal.querySelector('[role="dialog"]')){
    modal.appendChild(content);
  }

  modal.style.display = 'flex';
}

// Close alternatives modal
function closeAltModal(){
  var modal = document.getElementById('altMealModal');
  if(modal) modal.style.display = 'none';
}

// Replace meal with selected alternative
function replaceMeal(dayIndex, mealIndex, altIndex){
  var c = getC();
  if(!c || !c.weekPlan || !window.currentAlternatives || !window.currentAlternatives[altIndex]) return;

  var alt = window.currentAlternatives[altIndex];
  c.weekPlan[dayIndex][mealIndex].foods = deepClone(alt.foods);

  save();
  renderWeekTable();
  closeAltModal();

  console.log('Meal replaced with alternative');
}

// Calculate meal success based on ratings
function getMealRatingStats(){
  var mealStats = {};  // {day-mealIndex: {goodCount, badCount, success%}}

  // Analyze all plans
  TRACKING_DATA.plans.forEach(function(plan){
    if(plan.mealRatings){
      Object.keys(plan.mealRatings).forEach(function(mealKey){
        if(!mealStats[mealKey]){
          mealStats[mealKey] = {
            goodCount: 0,
            badCount: 0,
            meals: [],
            totalRatings: 0
          };
        }
        var rating = plan.mealRatings[mealKey];
        mealStats[mealKey].meals.push({
          mealName: rating.mealName,
          foods: rating.foods,
          date: rating.date
        });
        mealStats[mealKey].totalRatings++;
        if(rating.rating > 0) mealStats[mealKey].goodCount++;
        else if(rating.rating < 0) mealStats[mealKey].badCount++;
      });
    }
  });

  // Calculate success percentages
  Object.keys(mealStats).forEach(function(key){
    var stats = mealStats[key];
    if(stats.totalRatings > 0){
      stats.successPercent = Math.round((stats.goodCount / stats.totalRatings) * 100);
    } else {
      stats.successPercent = 0;
    }
  });

  return mealStats;
}

// Analyze patterns from meal ratings
function analyzePatterns(){
  var mealStats = getMealRatingStats();

  var patterns = {
    topMeals: [],        // Success rate > 70%
    problemMeals: [],    // Success rate < 40%
    recentRatings: [],   // Most recent ratings
    analysisDate: new Date().toISOString()
  };

  // Convert to sortable array
  var mealArray = Object.keys(mealStats).map(function(key){
    return {
      mealKey: key,
      ...mealStats[key]
    };
  }).sort(function(a,b){ return b.successPercent - a.successPercent; });

  // Top meals (success > 70%)
  patterns.topMeals = mealArray.filter(function(m){ return m.successPercent > 70; }).slice(0, 10);

  // Problem meals (success < 40%)
  patterns.problemMeals = mealArray.filter(function(m){ return m.successPercent < 40 && m.totalRatings > 0; }).slice(0, 10);

  // Recent ratings (last 10)
  var allRatings = [];
  TRACKING_DATA.plans.forEach(function(plan){
    if(plan.mealRatings){
      Object.keys(plan.mealRatings).forEach(function(mealKey){
        allRatings.push({
          mealKey: mealKey,
          ...plan.mealRatings[mealKey]
        });
      });
    }
  });
  patterns.recentRatings = allRatings.sort(function(a,b){
    return new Date(b.date) - new Date(a.date);
  }).slice(0, 10);

  TRACKING_DATA.patterns = patterns;
  saveTrackingData();

  return patterns;
}

// Show analytics dashboard
function showTrackingDashboard(){
  closeTrackingDashboard(); // avoid stacking a second overlay if one is already open
  var patterns = analyzePatterns();
  var stats = calculateRecipeStats();

  var html = '<div id="tracking-dashboard-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;overflow:auto;padding:20px;">';
  html += '<div style="background:var(--card-bg);max-width:1000px;margin:0 auto;border-radius:10px;padding:30px;">';
  html += '<div style="position:absolute;top:10px;right:10px;cursor:pointer;font-size:30px;" onclick="closeTrackingDashboard();">&times;</div>';

  html += '<h1 style="color:#025857;">📊 Tracking Analytics - Αξιολογήσεις Γευμάτων</h1>';

  // Top Meals (Success > 70%)
  html += '<h2 style="color:#025857;margin-top:30px;">⭐ Αγαπημένα Γεύματα (>70% επιτυχία)</h2>';
  if(patterns.topMeals.length > 0){
    html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;">';
    html += '<tr style="background:#E2EEE5;"><th style="padding:10px;text-align:left;">Γεύμα</th><th>👍</th><th>👎</th><th>Επιτυχία</th><th>Τρόφιμα</th></tr>';

    patterns.topMeals.forEach(function(meal){
      var mealName = meal.meals && meal.meals[0] ? meal.meals[0].mealName : 'Γεύμα';
      var foods = meal.meals && meal.meals[0] ? meal.meals[0].foods : '-';
      html += '<tr style="border-bottom:1px solid #ddd;">';
      html += '<td style="padding:10px;"><strong>' + esc(mealName) + '</strong></td>';
      html += '<td style="padding:10px;"><span style="color:#4caf50;font-weight:bold;">' + meal.goodCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#d9534f;font-weight:bold;">' + meal.badCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#025857;font-weight:bold;">' + meal.successPercent + '%</span></td>';
      html += '<td style="padding:10px;font-size:12px;color:#666;">' + esc(foods.substring(0, 50)) + (foods.length > 50 ? '...' : '') + '</td>';
      html += '</tr>';
    });
    html += '</table>';
  } else {
    html += '<p style="color:#666;">Δεν έχεις αξιολογήσει γεύματα ακόμα. Κάνε κλικ στα 👍/👎 κουμπιά στο πλάνο!</p>';
  }

  // Problem Meals (Success < 40%)
  if(patterns.problemMeals.length > 0){
    html += '<h2 style="color:#d9534f;margin-top:30px;">⚠️ Προβληματικά Γεύματα (<40% επιτυχία)</h2>';
    html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;">';
    html += '<tr style="background:#f8d7da;"><th style="padding:10px;text-align:left;">Γεύμα</th><th>👍</th><th>👎</th><th>Επιτυχία</th><th>Σχόλιο</th></tr>';

    patterns.problemMeals.forEach(function(meal){
      var mealName = meal.meals && meal.meals[0] ? meal.meals[0].mealName : 'Γεύμα';
      html += '<tr style="border-bottom:1px solid #ddd;">';
      html += '<td style="padding:10px;"><strong>' + esc(mealName) + '</strong></td>';
      html += '<td style="padding:10px;"><span style="color:#4caf50;font-weight:bold;">' + meal.goodCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#d9534f;font-weight:bold;">' + meal.badCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#d9534f;font-weight:bold;">' + meal.successPercent + '%</span></td>';
      html += '<td style="padding:10px;color:#d9534f;font-weight:500;">Αποφύγετε</td>';
      html += '</tr>';
    });
    html += '</table>';
  }

  // Recent Ratings
  if(patterns.recentRatings.length > 0){
    html += '<h2 style="color:#025857;margin-top:30px;">💭 Πρόσφατες Αξιολογήσεις</h2>';
    html += '<div style="background:#f0f8ff;padding:15px;border-radius:5px;margin:10px 0;">';
    patterns.recentRatings.slice(0, 8).forEach(function(rating){
      var icon = rating.rating > 0 ? '👍' : '👎';
      var date = new Date(rating.date).toLocaleDateString('el-GR');
      html += '<div style="padding:8px;border-bottom:1px solid #ddd;"><strong>' + esc(rating.mealName) + '</strong> ' + icon + ' <span style="font-size:12px;color:#666;">(' + date + ')</span></div>';
    });
    html += '</div>';
  }

  // Trust Score per meal/recipe — real usage-based ranking (drives the genPlan weighting in
  // findBestRecipe/findSavedComboMatch), separate from the manual 👍/👎 ratings above. Keyed by
  // either a chef recipe's id or a taste-library/saved-combo meal's food signature.
  var statEntries = Object.keys(stats).map(function(id){ return stats[id]; }).sort(function(a,b){ return b.timesUsed - a.timesUsed; });
  html += '<h2 style="color:#025857;margin-top:30px;">🏆 Trust Score ανά Γεύμα/Συνταγή</h2>';
  if(statEntries.length > 0){
    html += '<p style="color:#666;font-size:13px;margin:0 0 10px;">Πόσο συχνά «κρατιέται» ένα γεύμα σε σχέση με το πόσες φορές το πλάνο του ξαναρολάρεται — αυτό επηρεάζει ποια γεύματα προτιμώνται σε νέα πλάνα.</p>';
    html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;">';
    html += '<tr style="background:#E2EEE5;"><th style="padding:10px;text-align:left;">Γεύμα</th><th>Φορές Χρήσης</th><th>Trust Score</th><th>Πελάτες</th><th>Τελευταία Χρήση</th></tr>';
    statEntries.slice(0, 30).forEach(function(s){
      var trustColor = s.trustScore >= 0.7 ? '#4caf50' : (s.trustScore <= 0.4 ? '#d9534f' : '#f0a500');
      var lastUsed = s.lastUsed ? new Date(s.lastUsed).toLocaleDateString('el-GR') : '-';
      html += '<tr style="border-bottom:1px solid #ddd;">';
      html += '<td style="padding:10px;"><strong>' + esc(s.name||'Γεύμα') + '</strong></td>';
      html += '<td style="padding:10px;text-align:center;">' + s.timesUsed + '</td>';
      html += '<td style="padding:10px;text-align:center;"><span style="color:' + trustColor + ';font-weight:bold;">' + Math.round(s.trustScore*100) + '%</span></td>';
      html += '<td style="padding:10px;text-align:center;">' + s.usedWithClients + '</td>';
      html += '<td style="padding:10px;font-size:12px;color:#666;">' + lastUsed + '</td>';
      html += '</tr>';
    });
    html += '</table>';
  } else {
    html += '<p style="color:#666;">Δεν έχει καταγραφεί ακόμα καμία χρήση γεύματος. Φτιάξε ένα πλάνο για να ξεκινήσει η καταγραφή!</p>';
  }

  // Statistics
  html += '<h2 style="color:#025857;margin-top:30px;">📈 Στατιστικά</h2>';
  html += '<div style="background:var(--panel-bg);padding:15px;border-radius:5px;margin:10px 0;">';
  html += '<p><strong>Συνολικά Πλάνα:</strong> ' + TRACKING_DATA.plans.length + '</p>';
  html += '<p><strong>Αξιολογημένα Γεύματα:</strong> ' + (patterns.recentRatings ? patterns.recentRatings.length : 0) + '</p>';
  html += '<p><strong>Αγαπημένα Γεύματα (>70%):</strong> ' + patterns.topMeals.length + '</p>';
  html += '<p><strong>Προβληματικά Γεύματα (<40%):</strong> ' + patterns.problemMeals.length + '</p>';
  html += '</div>';

  html += '<button onclick="closeTrackingDashboard()" style="margin-top:20px;padding:10px 20px;background:#025857;color:white;border:none;border-radius:5px;cursor:pointer;">Close</button>';

  html += '</div></div>';

  document.body.insertAdjacentHTML('beforeend', html);
}

function closeTrackingDashboard(){
  // Must target this dashboard specifically by id — a generic "[style*=position:fixed]" selector
  // also matches unrelated always-present elements (#context-menu, modals, toasts), so it used to
  // remove whichever of those happened to be first in the DOM instead of the dashboard.
  var dashboard = document.getElementById('tracking-dashboard-overlay');
  if(dashboard)dashboard.remove();
}


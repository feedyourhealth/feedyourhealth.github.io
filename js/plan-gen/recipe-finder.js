// js/plan-gen/recipe-finder.js
// The chef-inspired meal-generation engine, extracted verbatim from js/app-part3.js
// (module split wave 13): calculateMealKcal, calculateTrustScore, getRecipeTrustScore,
// findBestRecipe(dietType,targetKcal,mealType,excl,targetMacros,dislikedIds) and
// generateSmartMeal(...). Pure fn declarations, no load-time code. calculateMealKcal /
// getRecipeTrustScore are called from plan-gen/meal-library.js (which loads just
// before this) inside runtime code paths; findBestRecipe is also used by app-part4.js;
// calculateTrustScore by tracking/tracking.js — all runtime. Loads right before
// app-part3.js, after meal-library.js.

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ PHASE 2: CHEF-INSPIRED MEAL GENERATION RULES ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

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

// Trust score for a recipe based on real usage across all clients' plans (TRACKING_DATA.recipes).
// Recipes never used yet get a neutral 0.5 — no penalty for lack of history. Used elsewhere by
// calculateRecipeStats() (app-part4.js) for the Analytics tab too.
function calculateTrustScore(trackingEntry){
  if(!trackingEntry || !trackingEntry.timesUsed) return 0.5;
  var success = 1 - (trackingEntry.regenerateCount||0) / trackingEntry.timesUsed;
  success = Math.max(0, Math.min(1, success));
  var up=trackingEntry.thumbsUp||0, down=trackingEntry.thumbsDown||0;
  // No explicit 👍/👎 yet (true for every recipe before this feature existed) — unchanged from
  // before, so this is zero-impact on current behavior until ratings actually start coming in.
  if(up===0 && down===0) return success;
  // Laplace-smoothed 👍/👎 signal (+2/+4 pseudo-counts) — starts neutral (0.5) and moves gradually,
  // so a single vote nudges rather than dominates the score; blended as a minority (30%) weight
  // alongside the existing regenerate-based signal (70%), same reasoning as the macro/calorie
  // score blends already used in findBestRecipe/findSavedComboMatch.
  var ratingSignal=(up-down+2)/(up+down+4);
  return Math.max(0, Math.min(1, success*0.7 + ratingSignal*0.3));
}
function getRecipeTrustScore(recipeId){
  var entry = (typeof TRACKING_DATA!=='undefined' && TRACKING_DATA.recipes) ? TRACKING_DATA.recipes[recipeId] : null;
  return calculateTrustScore(entry);
}

// ── Chef-Inspired Recipe Selection ────────────────────────────────────────────
// Finds the best pre-defined recipe for a meal based on diet type and calories
function findBestRecipe(dietType, targetKcal, mealType, excl, targetMacros, dislikedIds){
  // ✅ SNACK DETECTION: If meal name is "Ενδιάμεσο" (Snack), use SNACK_RECIPES
  var isSnack = classifyMealSlot(mealType)==='snack';
  var recipeDB = isSnack ? SNACK_RECIPES : MEAL_RECIPES;

  if(!recipeDB || !recipeDB.length)return null;

  // ✅ Include the dietitian's own custom recipes (Συνταγές page, js/app-part6-recipes.js) so they're
  // eligible for auto-generation too — until now they only showed up in the Recipes page and the
  // manual food-selector's recipe tab, never here. matchesBase/matchesMealTime below apply unchanged
  // to them (calorie window, exclusions, meal-time tag, snack meat/fish guard, etc.), same as any
  // static recipe; customRecipesForGeneration() just canonicalizes their diet-tag casing first.
  var customPool = (typeof customRecipesForGeneration==='function') ? customRecipesForGeneration() : [];
  if(customPool.length) recipeDB = recipeDB.concat(customPool);

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
    var dietMatch;
    if(isSnack){
      // SNACK_RECIPES carry no diet tags at all ("universal" by design), which is fine for diets
      // that only restrict by food category (their forbidden foods are still caught downstream) —
      // but keto restricts by carb content, and several snacks here run 20-38g carbs, enough to
      // blow a whole day's keto carb budget on one snack. Require an explicit Keto/LowCarb tag
      // or a genuinely low-carb macro before treating a snack as keto-appropriate.
      if(dietType==='keto'){
        var tagged = recipe.tags.indexOf('Keto')!==-1 || recipe.tags.indexOf('LowCarb')!==-1;
        var lowCarb = recipe.macro && recipe.macro.c<=10;
        dietMatch = tagged || lowCarb;
      } else {
        dietMatch = true;
      }
      // ✅ Ένα ολόκληρο πιάτο κρέατος/ψαριού (π.χ. "Κρέας Γαλοπούλας με Ρυζογκοφρέτες") δεν είναι
      // λογικό "Ενδιάμεσο" εκτός αν ο πελάτης είναι σε πρωτεϊνο-κεντρικό diet type (bodybuilding_clean) —
      // επιβεβαιωμένο ότι SNACK_RECIPES δεν είχε κανένα φίλτρο εδώ πέρα από το keto carb-check, οπότε ένα
      // κρέας/ψάρι snack φτιαγμένο για bodybuilders μπορούσε να ταιριάξει σε ΟΠΟΙΟΔΗΠΟΤΕ diet type.
      if(dietMatch && isSnack && dietType!=='bodybuilding_clean'){
        var hasMeatOrFish = recipe.foods.some(function(food){
          var fd = FOODS[food.n] || FOODS[resolveFood(food.n)];
          return fd && (fd.cat==='Κρέας' || fd.cat==='Ψάρια');
        });
        if(hasMeatOrFish) dietMatch = false;
      }
    } else {
      dietMatch = dietTags.some(function(tag){return recipe.tags.indexOf(tag)!==-1;});
      // ✅ Custom recipes aren't curated like MEAL_RECIPES — a dietitian can tag one "Keto" in the
      // Συνταγές page without the auto-computed carbs actually being low (easy to miss, since macros
      // come from summing ingredients, not a manual gut-check). Reuses the exact same carb-sanity bar
      // already applied to snacks just above (recipe.macro.c<=10), scoped only to custom recipes so
      // no already-tuned static-recipe matching changes.
      if(dietMatch && dietType==='keto' && recipe.source==='custom'){
        dietMatch = recipe.macro && recipe.macro.c<=10;
      }
    }
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

  // ✅ Skip this specific client's 👎'd recipes (js/app-part4.js rateMeal) — soft preference, so no
  // "never leave zero candidates" fallback needed here either: a null return just falls through to
  // genPlan()'s next priority tier (saved combos → smart generation → template), same as always.
  if(dislikedIds && dislikedIds.length){
    candidates=candidates.filter(function(r){return dislikedIds.indexOf(r.id)===-1;});
  }

  if(!candidates.length)return null;

  // Rank by calorie closeness, nudged by real-world trust (proven recipes vs. ones that keep getting
  // regenerated away). Trust can only sway ~8% of targetKcal worth of ranking — within the 80-120%
  // calorie window already filtered above, a spot-on but untrusted recipe still beats a borderline
  // one that merely has a perfect track record.
  // ✅ MACRO-FIT PENALTY: every recipe already carries macro:{p,f,c} — compare its fat%/protein%-of-
  // calories to the meal's actual target so a recipe that's calorie-close but macro-mismatched
  // (e.g. a fat-heavy dish for a tight deficit meal) loses to one with a genuinely closer ratio,
  // same reasoning and weighting as findSavedComboMatch's macroPenalty.
  function recipeScore(r){
    var calDiff = Math.abs(r.kcal-targetKcal);
    var trustBonus = getRecipeTrustScore(r.id) * targetKcal * 0.08;
    var macroPenalty = 0;
    if(targetMacros && targetMacros.f!=null && targetMacros.p!=null && r.macro && r.kcal>0 && targetKcal>0){
      var targetFatPct=(targetMacros.f*9)/targetKcal;
      var targetProtPct=(targetMacros.p*4)/targetKcal;
      var rFatPct=(r.macro.f*9)/r.kcal;
      var rProtPct=(r.macro.p*4)/r.kcal;
      macroPenalty=(Math.abs(rFatPct-targetFatPct)+Math.abs(rProtPct-targetProtPct))*targetKcal*0.5;
    }
    return calDiff - trustBonus + macroPenalty;
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
function generateSmartMeal(targetKcal, targetMacros, day, savedCombos, mealName, excl, dietType, dislikedIds) {
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
  var mealFromSaved = findSavedComboMatch(savedCombos, targetKcal, targetMacros, 60, excl, classifyMealSlot(mealName), dietType, undefined, dislikedIds);
  if(mealFromSaved) {
    return mealFromSaved;
  }

  // Priority 2: Build from pairing rules - with meal-type AND diet-type awareness
  var mealSlot = classifyMealSlot(mealName);
  var isBreakfast = mealSlot==='breakfast';
  var isSnack = mealSlot==='snack';
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


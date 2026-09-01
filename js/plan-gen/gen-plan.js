// js/plan-gen/gen-plan.js
// The meal-plan generation entry points, extracted verbatim from js/app-part3.js
// (module split wave 17): pregnancyBlockCheck, calorieConsistencyCheck,
// genPlanWithUndo, _genPlanWithUndoProceed, buildClientExclusionList,
// applyPostGenerationCleanup, genPlan. Pure fn declarations, no load-time code.
// genPlan orchestrates everything defined in the other plan-gen/* modules plus
// scalePlan (calc/), applyMediterraneanRules / scrubExcludedFoodsFromWeekPlan /
// buildEffectiveExclusionList (app-part2), renderWeekTable (app-part3) — all called
// at runtime. Entry points are fired from onclick strings + app-part1/4/5 +
// 11-undo-redo, also runtime. Loads right before app-part3.js.

// ✅ Εγκυμοσύνη: συνδυασμοί υψηλού κινδύνου (π.χ. κετογονική+έγκυος) χρειάζονται ρητή επιβεβαίωση
// της διαιτολόγου πριν τη δημιουργία/αναδημιουργία πλάνου — δεν μπλοκάρουμε απόλυτα γιατί μπορεί να
// υπάρχει ιατρικά επιβλεπόμενη εξαίρεση, αλλά δεν προχωράμε σιωπηλά. Κάθε σημείο που μπορεί να
// (ξανα)δημιουργήσει πλάνο (κύριο κουμπί, regenerateDay, regeneratePlan, auto-regen στην αλλαγή
// στοιχείων, Ctrl+P) ΠΡΕΠΕΙ να περνά από εδώ πρώτα — αλλιώς η προειδοποίηση παρακάμπτεται σιωπηλά.
function pregnancyBlockCheck(c, proceedFn){
  var pregFlags=(typeof getPregnancySafetyFlags==='function')?getPregnancySafetyFlags(c):[];
  var blockFlags=pregFlags.filter(function(f){return f.level==='block';});
  if(blockFlags.length>0){
    var msg='🚫 '+blockFlags.map(function(f){return f.msg;}).join('\n\n')+'\n\nΘέλεις να συνεχίσεις ούτως ή άλλως (π.χ. υπό ιατρική παρακολούθηση);';
    showConfirmDialog(msg, proceedFn, {icon:'🚫', confirmLabel:'Συνέχεια ούτως ή άλλως'});
    return;
  }
  var warnFlags=pregFlags.filter(function(f){return f.level==='warn';});
  if(warnFlags.length>0 && typeof showErrorToast==='function'){
    showErrorToast('⚠️ '+warnFlags[0].msg);
  }
  proceedFn();
}

// ⚠️ Surfaces calcTDEE's already-computed warnings[] (double-counted activity, out-of-range
// protein, too-low carbs, oversized deficit/surplus, GDM carb floor, etc.) as a confirm gate
// BEFORE a plan is generated, instead of only after — same pattern as pregnancyBlockCheck above.
function calorieConsistencyCheck(c, proceedFn){
  var t=calcTDEE(c);
  var warnings=t.warnings||[];
  if(warnings.length===0){ proceedFn(); return; }
  // opts.items renders each warning as its own colored row (κόκκινο='alert' πάνω, κίτρινο='warn' κάτω)
  // αντί για ένα αδιαφοροποίητο μπλοκ κειμένου — msg μένει ως fallback για το window.confirm() branch.
  var msg=warnings.map(function(w){return w.msg;}).join('\n\n')+'\n\nΘέλεις να συνεχίσεις με αυτούς τους στόχους;';
  showConfirmDialog(msg, proceedFn, {icon:'⚠️', confirmLabel:'Συνέχεια ούτως ή άλλως', items:warnings, itemsFooter:'Θέλεις να συνεχίσεις με αυτούς τους στόχους;'});
}

// ✅ PHASE 4: GENERATE PLAN WITH UNDO/REDO WRAPPER
function genPlanWithUndo(){
  var c=getC();if(!c)return;
  var errors=validateClientData(c);
  if(errors.length>0){ showValidationErrors(errors); return; }
  // 🥤 CHO Training Protocol gate — 3rd link, no-op unless c.choProtocol.enabled (js/plan-gen/cho-protocol.js).
  var _choGate = (typeof choProtocolCheck === 'function') ? choProtocolCheck : function(_c, fn){ fn(); };
  pregnancyBlockCheck(c, function(){ calorieConsistencyCheck(c, function(){ _choGate(c, function(){ _genPlanWithUndoProceed(c); }); }); });
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

// ✅ Shared exclusion-list assembly — used by BOTH plan-generation paths inside genPlan()
// below (clone-from-client and template-based). Extracted 2026-08-04 (audit finding #2):
// before this, the clone-from-client path built its own, SHORTER `excl` list (only
// c.foodExclude + medical-protocol avoidFoods + parsed "avoid X" free-text preferences) —
// missing c.foodExclusions (the food-exclusion picker) and c.allergies entirely. A client
// created via "Βάση πλάνου" = clone-from-another-client who had allergies or picker-based
// exclusions set got a plan where those foods were never actually filtered out. The
// template path already built the full list correctly; both paths now share it so they
// can't silently diverge again.
function buildClientExclusionList(c, protocolAvoidFoods){
  var excl=c.foodExclude||[];
  (protocolAvoidFoods||[]).forEach(function(food){ if(excl.indexOf(food)===-1) excl.push(food); });
  if(c.foodExclusions && Array.isArray(c.foodExclusions)){
    c.foodExclusions.forEach(function(food){
      if(excl.indexOf(food)===-1)excl.push(food);
    });
  }
  if(c.allergies){
    var allergyList=parseAllergies(c.allergies);
    allergyList.forEach(function(allergy){
      if(excl.indexOf(allergy)===-1)excl.push(allergy);
    });
  }
  parsePreferenceAvoidFoods(c.preferences).forEach(function(food){
    if(excl.indexOf(food)===-1)excl.push(food);
  });
  // 🍽 Ιδέα 2 (2026-08-25): δομημένα chips τροφικών προτιμήσεων από την καρτέλα "📝 Ραντεβού"
  // (c.foodPrefs, βλ. apptFoodPrefsPanelHtml στο js/app-part2.js) — μόνο οι αντιπάθειες (👎) μπαίνουν
  // στο exclusion list· τα "αρέσει" (👍) είναι καθαρά πληροφοριακά, δεν αποκλείουν/προτιμούν τίποτα.
  (c.foodPrefs||[]).forEach(function(fp){
    if(fp.pref==='dislike'&&excl.indexOf(fp.food)===-1)excl.push(fp.food);
  });
  return excl;
}

// ✅ Shared post-generation cleanup pipeline — runs identically after BOTH plan-generation
// paths inside genPlan() finish building c.weekPlan. Extracted 2026-08-04 (audit finding #2)
// after the two paths were found to have drifted from each other at least 3 times historically
// (missed red-meat cap, missed tracking-log, and — found while extracting this — a calorie-
// reconciliation gap: the clone-from-client path never called reconcileMealCaloriesAfterRemoval
// after stripping oats/exclusions, so a cloned plan could silently land under its calorie
// target for that meal, while the template path always compensated). Single source of truth
// for these 5 steps from now on — a future rule change only needs to happen here once.
function applyPostGenerationCleanup(c, excl){
  // 1) Red meat frequency cap (max 2x/week, for cholesterol)
  c.weekPlan = enforceRedMeatFrequency(c.weekPlan, excl, c.dietType);

  // 2) Remove oats from non-breakfast meals (oats only belong in breakfast), reconciling
  // each meal's calories for whatever got removed.
  for(var d=0;d<7;d++){
    if(!c.weekPlan[d])continue;
    for(var mi=0;mi<c.weekPlan[d].length;mi++){
      var meal=c.weekPlan[d][mi];
      if(classifyMealSlot(meal.name)==='breakfast')continue;
      if(meal.foods&&meal.foods.length>0){
        var oatsTargetK=0;
        meal.foods.forEach(function(food){oatsTargetK+=cm(food.n,food.g).k;});
        meal.foods=meal.foods.filter(function(food){
          return !(food.n||'').toLowerCase().includes('βρώμη');
        });
        reconcileMealCaloriesAfterRemoval(meal, oatsTargetK);
      }
    }
  }

  // 3) Three-layer exclusion cleanup (name match → normalized-accent match → recipe-ingredient
  // substring match), last-resort paranoia pass regardless of which generation method put the
  // food there — reconciling calories for what was removed.
  if(excl.length>0){
    var exclNormalized=excl.map(function(x){return normalizeGreekText(x);});
    for(var d=0;d<7;d++){
      if(!c.weekPlan[d])continue;
      for(var mi=0;mi<c.weekPlan[d].length;mi++){
        var meal=c.weekPlan[d][mi];
        if(meal.foods&&meal.foods.length>0){
          var exclTargetK=0;
          meal.foods.forEach(function(food){exclTargetK+=cm(food.n,food.g).k;});
          meal.foods=meal.foods.filter(function(food){
            return !foodIsExcludedByNameOrIngredient(food.n,exclNormalized);
          });
          meal.foods=meal.foods.filter(function(food){
            return food.n && (food.n||'').trim().length>0;
          });
          reconcileMealCaloriesAfterRemoval(meal, exclTargetK);
        }
      }
    }
  }

  // 4) Diet-type category safety net: strip any food from a category the client's diet type
  // forbids, regardless of which code path (recipe, taste library, saved combo, clone...) put it there.
  applyDietTypeCategorySafetyNet(c.weekPlan, c.dietType, c.dietExceptionDays, c.dietFoodExceptionDays);

  // 5) Log to tracking system
  logPlanGeneration(c, c.weekPlan);
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
    var clonedPlan=cloneAndScaleClientPlan(baseCId, c, t);
    if(clonedPlan){
      c.weekPlan=clonedPlan;
      // Apply food exclusions to the cloned plan — full list (picker + allergies + protocols +
      // free-text preferences), see buildClientExclusionList().
      var excl=buildClientExclusionList(c, protocolAvoidFoods);
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

      // ✅ Shared cleanup pipeline (red-meat cap, oats removal, exclusion cleanup, diet-type
      // safety net — the "Βάση πλάνου" client picker lists EVERY client regardless of diet
      // type, so this also catches e.g. cloning an omnivore's plan into a new vegan client —
      // plus the tracking log) — see applyPostGenerationCleanup(). Same steps the
      // template-based path below applies, kept in one place so they can't drift apart again.
      applyPostGenerationCleanup(c, excl);

      c.planGeneratedAt=Date.now();  // ✅ ώστε να ξέρουμε πότε "λήγει" (χρειάζεται ανανέωση) το πλάνο
      saveNow();  // Save immediately, not delayed
      renderWeekTable();
      swTab(2);
      return;
    }
  }

  // Original template-based plan generation
  // Build template key: dietType_goal (e.g., 'vegetarian_loss') or just goal (e.g., 'loss')

  // Diet-type -> TMPLS key prefix. Almost always identical to dietType, EXCEPT keto: its
  // templates are historically named with the 'ketogenic' prefix (TMPLS.ketogenic_mild etc.),
  // so 'keto_'+goal never matched anything and every keto client silently fell through to
  // the generic, non-keto template below (confirmed live: high-carb fruit/rice-cake snacks
  // baked into what should've been a low-carb plan).
  var TMPL_DIET_PREFIX={keto:'ketogenic'};
  var tmplDietPrefix=TMPL_DIET_PREFIX[c.dietType]||c.dietType;
  // ✅ Templates are keyed by the WORD goal code (loss/mild/maintain/gain — c.goalMain), not the
  // numeric kcal-delta string (c.goal, e.g. "-500"). Using c.goal here meant this lookup (and the
  // c.goal fallback below) never matched anything, so every client silently fell through to the
  // 'maintain'/'_maintain' template regardless of their actual goal — only portions were scaled
  // per-goal afterward, not the template's food structure. Same bug class already fixed for the
  // goal-label lookups and the client-list goal filter.
  var templateKey = (c.dietType && c.dietType !== 'normal') ? (tmplDietPrefix + '_' + c.goalMain) : c.goalMain;

  var tmpl=TMPLS[templateKey]||TMPLS[c.dietType]||TMPLS[tmplDietPrefix];
  // This diet type has SOME dedicated template(s), just not for this exact goal (e.g. keto has
  // mild/maintain/gain but no 'loss' — the most common keto goal!). Prefer any same-diet
  // template over jumping straight to a generic one: losing the diet's structure entirely is
  // worse than using a same-diet template tuned for a slightly different goal.
  if(!tmpl && c.dietType && c.dietType!=='normal'){
    ['maintain','mild','gain','loss'].some(function(g){
      tmpl=TMPLS[tmplDietPrefix+'_'+g];
      return !!tmpl;
    });
  }
  tmpl = tmpl || TMPLS[c.goalMain] || TMPLS.maintain;

  if(!tmpl){
    throw new Error('Δεν υπάρχει κατάλληλο πρότυπο για dietType=' + c.dietType + ' goal=' + c.goal);
  }

  if(c.selectedTemplate){
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
  var excl=buildClientExclusionList(c, protocolAvoidFoods);
  // ✅ Reorder meals to standard sequence before other operations
  tmplDays=reorderMealsToStandardSequence(tmplDays);
  // Initial Mediterranean pipeline on templates ONLY
  tmplDays=removeFYHFromMainMeals(tmplDays);           // 0. FYH έξω από κύρια γεύματα (χειροκίνητα)
  tmplDays=removeOatsFromMainMeals(tmplDays);          // 0β. Βρώμη ΜΟΝΟ σε πρωινό (χειροκίνητα)
  var eff=getDayTgtEff(c,t);

  // ✅ PHASE 3A: HYBRID SYSTEM — Allocate per-meal targets from daily totals
  // Βήμα 2b-bis: περνάμε τον πίνακα γευμάτων (όχι μόνο το πλήθος) ώστε το allocateMealTargets
  // να ζυγίζει κάθε γεύμα κατά slot (πρωινό/μεσημεριανό/βραδινό/snack) και όχι κατά θέση index.
  //
  // 🥤 CHO Training Protocol (Phase 2): όταν c.choProtocol.enabled, το computeCHOTargets δίνει
  // pre/post-workout CHO στόχους ανά ημέρα προπόνησης· περνούν ως 3ο όρισμα στο allocateMealTargets,
  // που ανακατανέμει υδατάνθρακες προς τα pre/post γεύματα kcal-neutral. Αδρανές αλλιώς.
  var choByDay=[];
  if(c.choProtocol&&c.choProtocol.enabled&&typeof computeCHOTargets==='function'){
    for(var _cd=0;_cd<7;_cd++){
      try{choByDay[_cd]=computeCHOTargets(c,t,_cd);}catch(_e){choByDay[_cd]=null;}
    }
  }
  for(var d=0;d<7;d++){
    var _mta=null;
    var _cr=choByDay[d];
    if(_cr&&_cr.mealTimingArg&&typeof choMealRoles==='function'){
      _mta=_cr.mealTimingArg;
      _mta.weightKg=_cr.weightBasisKg;
      _mta.perMeal=choMealRoles(tmplDays[d],_cr.sessionStart,c).map(function(role){return{role:role};});
    }
    eff[d].meals = allocateMealTargets(eff[d], tmplDays[d], _mta);
  }

  // ✅ PHASE 3B: TRY SMART GENERATION WITH 3-PRIORITY FALLBACK
  // NOTE: Skip smart generation for Intermittent Fasting entirely (preserves its template
  // structure). Orthodox Fasting normally skips it too (same reason) EXCEPT on a day the
  // dietitian has marked as an exception (c.dietExceptionDays, e.g. a fasting feast day like
  // Ευαγγελισμός/Βαΐα where fish is allowed) — that day runs the same priority chain as any
  // other client, widened to dietType 'normal' so fish/meat recipes can actually be matched
  // (see dietTagMap below); applyDietTypeCategorySafetyNet() still enforces that only the
  // day's specifically-allowed categories survive, everything else gets stripped as usual.
  var isOrthodoxFasting = (c.dietType === 'orthodox_fasting');
  var isIntermittentFasting = (c.dietType === 'intermittent_fasting');

  if(!isIntermittentFasting) {
    var savedCombos = getSavedCombos();
    // 👎 Recipes/combos this specific client has explicitly disliked (js/app-part4.js rateMeal) —
    // a soft per-client preference, skipped by findBestRecipe/findSavedComboMatch below so a
    // regenerate doesn't just bring the same disliked meal straight back.
    var dislikedIds = c.dislikedRecipeIds || [];
    // 🕓 This same client's own recent, reasonably-well-followed meals (see harvestOwnHistory) —
    // tried before the cross-client taste library, so a returning client gets their own proven
    // meals back first instead of always starting from someone else's plan.
    var ownHistory = harvestOwnHistory(c);
    // ⭐ Cross-client taste library: real meals from clients marked as templates
    var mealLibrary = harvestMealLibrary(c.id);
    var usedComboSigs = {};  // variety tracker shared across library + combos this week
    console.log('Own history: '+ownHistory.length+' meals harvested from this client\'s past well-followed plans');
    console.log('Taste library: '+mealLibrary.length+' meals harvested from ⭐ template clients');
    // Only these categories actually need a DIFFERENT dish matched via smart-gen/recipe search —
    // the static orthodox_fasting template has zero meat/fish/egg/dairy dishes to reveal even when
    // excepted. 'Λάδια' (oil) is NOT dish-level: the template already includes olive oil in every
    // day's lunch/dinner (only ever stripped by applyDietTypeCategorySafetyNet on non-exception
    // days) — diverting an oil-only exception day to smart-gen actually backfires, since generated
    // recipes/combos rarely list cooking oil as an explicit food item, so the day ends up with LESS
    // oil than doing nothing. Found 2026-07-29: a dietitian ticked "Όλες οι μέρες" for Λάδια and the
    // generated plan still had zero oil on any day.
    var DISH_LEVEL_EXC_CATS = ['Κρέας','Ψάρια','Αυγά/Γαλακτ.','Γαλακτοκομικά'];
    for(var d=0;d<7;d++){
      var dayExc = (isOrthodoxFasting && c.dietExceptionDays && c.dietExceptionDays[d]) || [];
      // Finer sibling of dayExc — specific allowed foods (e.g. only "Χταπόδι") rather than a whole
      // category — set via the food-picker's "📅 Εξαιρέσεις ημέρας" tab (buildFoodDayExceptionsHtml).
      var dayFoodExc = (isOrthodoxFasting && c.dietFoodExceptionDays && c.dietFoodExceptionDays[d]) || [];
      var dayExcDishLevel = dayExc.filter(function(cat){return DISH_LEVEL_EXC_CATS.indexOf(cat)!==-1;});
      var dayFoodExcDishLevel = dayFoodExc.filter(function(fn){var fd=FOODS[fn];return fd&&DISH_LEVEL_EXC_CATS.indexOf(fd.cat)!==-1;});
      // Orthodox Fasting, non-exception (or oil-only-exception) day: leave the static fasting
      // template untouched — applyDietTypeCategorySafetyNet still uses the FULL (unfiltered)
      // c.dietExceptionDays/c.dietFoodExceptionDays afterwards, so an oil exception still correctly
      // keeps the template's own Ελαιόλαδο entries that day instead of stripping them.
      if(isOrthodoxFasting && dayExcDishLevel.length===0 && dayFoodExcDishLevel.length===0) continue;
      var dayDietType = (dayExcDishLevel.length || dayFoodExcDishLevel.length) ? 'normal' : c.dietType;
      for(var mi=0;mi<tmplDays[d].length;mi++){
        var meal = tmplDays[d][mi];
        var targetKcal = eff[d].meals[mi].k;  // Per-meal calorie target
        var targetMacros = eff[d].meals[mi];  // {k,p,f,c} — same object, used for macro-fit scoring below
        var mealSlot = classifyMealSlot(meal.name);

        // 🕓 Priority -1: this client's own history — a meal they had before and (per portal
        // check-ins) reasonably followed. Takes precedence over every cross-client source.
        if(ownHistory.length > 0){
          var ownMeal = findSavedComboMatch(ownHistory, targetKcal, targetMacros, 80, excl, mealSlot, dayDietType, usedComboSigs, dislikedIds);
          if(ownMeal && ownMeal.foods && ownMeal.foods.length > 0){
            meal.foods = deepClone(ownMeal.foods);
            if(ownMeal.mealTiming) meal.mealTiming = ownMeal.mealTiming;
            meal.fromOwnHistory = true;  // tag for UI/debug
            meal.source = 'own-history';  // for the meal-source badge in renderWeekTable
            meal.recipeSig = ownMeal.sig;
            continue;
          }
        }

        // ⭐ Priority 0: Taste library — real, dietitian-made meals from ⭐ clients
        // (verbatim food combos; portions get scaled to target in PHASE 3D)
        if(mealLibrary.length > 0){
          var libMeal = findSavedComboMatch(mealLibrary, targetKcal, targetMacros, 80, excl, mealSlot, dayDietType, usedComboSigs, dislikedIds);
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
        var recipeMeal = findBestRecipe(dayDietType, targetKcal, meal.name, excl, targetMacros, dislikedIds);
        if(recipeMeal && recipeMeal.foods && recipeMeal.foods.length > 0){
          meal.foods = deepClone(recipeMeal.foods);
          meal.recipeId = recipeMeal.recipeId;  // Track which recipe was used
          meal.source = 'recipe';
          continue;  // Use chef-inspired recipe
        }

        // Priority 2: Check saved combos (user-approved, slot/diet-aware)
        if(savedCombos && savedCombos.length > 0){
          var savedMeal = findSavedComboMatch(savedCombos, targetKcal, targetMacros, 80, excl, mealSlot, dayDietType, usedComboSigs, dislikedIds);
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
        var smartMeal = generateSmartMeal(targetKcal, targetMacros, d, savedCombos, meal.name, excl, dayDietType, dislikedIds);
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
  var isBodybuildingClean = (c.dietType === 'bodybuilding_clean');

  if(!isOrthodoxFasting && !isIntermittentFasting && !isVegan && !isVegetarianDiet && !isKetogenic && !isBodybuildingClean) {
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
    tmplDays=normalizeBreakfasts(tmplDays,eff);          // 7. Πρωινό Αυγών (FYH) Δευ/Τετ/Παρ, γιαούρτι+βρώμη αλλού (fat-target-aware)
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
  } else if(isBodybuildingClean) {
    // For Bodybuilding Clean, skip applyMediterraneanRules() — it unconditionally overwrites each
    // lunch/dinner's protein with a fixed weekly meat/fish rotation (MED_PLAN) by meal NAME, with no
    // awareness that Priority 1 already matched a dietTagMap-tagged bodybuilding_clean/high_protein
    // recipe for that slot. Confirmed live: it was silently swapping in the MED_PLAN rotation's food
    // while leaving the stale recipeId behind, so the plan (and trust-score tracking) no longer
    // matched what was actually served. Same safe subset as Vegetarian above.
    tmplDays=preferWholeGrains(tmplDays);                // 1. ολικής άλεσης δημητριακά (safe, no protein change)
    tmplDays=ensureSaladAndOil(tmplDays);                // 4. σαλάτα εποχής + ελαιόλαδο παντού (safe, no protein change)
    tmplDays=ensureOilWithVegetables(tmplDays);          // 6ε. εξασφάλιση λαδιού με λαχανικά (safe, no protein change)
  }
  // For Ketogenic, skip all Mediterranean rules (templates are already optimized for low-carb)

  if(excl.length)tmplDays=applyFoodExclusions(tmplDays,excl); // 9. αποκλεισμός τροφίμων (μετά όλα τα steps)

  // ✅ PHASE 3D: SCALE ALL MEALS TO PER-MEAL TARGETS (always, as final step)
  // This scales each meal individually to hit its specific calorie target
  // Uses per-meal targets from allocateMealTargets() for precise distribution
  for(var d=0;d<7;d++){
    c.weekPlan[d]=scalePlan(tmplDays[d],eff[d],eff[d].meals);
  }

  // ✅ Shared cleanup pipeline (red-meat cap, oats removal, exclusion cleanup, diet-type
  // safety net, tracking log) — see applyPostGenerationCleanup(). Same steps the
  // clone-from-client path above applies, kept in one place so they can't drift apart again.
  applyPostGenerationCleanup(c, excl);

  c.planGeneratedAt=Date.now();  // ✅ ώστε να ξέρουμε πότε "λήγει" (χρειάζεται ανανέωση) το πλάνο
  save();swTab(2);renderWeekTable();
  }catch(e){
    console.error('GENPLAN ERROR:', e.message);
    console.error('Stack:', e.stack);
    showErrorToast('Σφάλμα στη δημιουργία πλάνου: ' + e.message);
  }
}


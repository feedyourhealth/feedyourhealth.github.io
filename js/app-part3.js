
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
  pregnancyBlockCheck(c, function(){ calorieConsistencyCheck(c, function(){ _genPlanWithUndoProceed(c); }); });
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
  for(var d=0;d<7;d++){
    eff[d].meals = allocateMealTargets(eff[d], tmplDays[d]);
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

  var rec='<div style="background:var(--panel-bg);border-left:4px solid #ff9800;padding:12px 14px;margin:12px 0;border-radius:4px;font-size:12px;line-height:1.6">'
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
    'own-history': {icon:'🕓', label:'Δικό του ιστορικό', bg:'#e0f2f1', color:'#00695c'},
    library:   {icon:'⭐', label:'Πρότυπο γεύσης', bg:'#fff8e1', color:'#f9a825'},
    recipe:    {icon:'👨‍🍳', label:'Συνταγή', bg:'#e3f2fd', color:'#1565C0'},
    saved:     {icon:'💾', label:'Αποθηκευμένο', bg:'#e8f5e9', color:'var(--good)'},
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
  var errors=validateClientData(c);
  if(errors.length>0){ showValidationErrors(errors); return; }
  pregnancyBlockCheck(c, function(){
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
  });
}

function renderWeekTable(){
  var c=getC();var con=document.getElementById('week-con');if(!con)return;
  if(!c||!Object.keys(c.weekPlan).length){con.innerHTML='<div style="padding:20px;color:var(--text-muted);font-size:12px">Δεν υπάρχει πλάνο — πάτα «Δημιουργία πλάνου»</div>';return;}
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

  // ✅ Fallback '—' αντί για το ίδιο το JS "undefined" όταν λείπει εντελώς το πεδίο (π.χ. ελλιπώς
  // συμπληρωμένος πελάτης) — πριν εμφανιζόταν κυριολεκτικά η λέξη "undefined" στο summary card.
  var activityLabel = actL[c.activity] || c.activity || '—';
  var goalLabel = goalL[c.goalMain] || c.goalMain || '—';
  var bmiVal = (c.weight && c.height) ? (c.weight / ((c.height/100) * (c.height/100))).toFixed(1) : '—';

  // ✅ Ring "θερμίδες εβδομάδας" — μ.ο. πραγματικού αθροίσματος γευμάτων (calculateDailyTotals,
  // Dietologist.html, ΙΔΙΑ συνάρτηση με το report modal του app-part3.js) έναντι του ημερήσιου
  // στόχου (per-day c.dayTargets[d].k αν υπάρχει, αλλιώς το γενικό tdeeInfo.target). Ζωντανή ένδειξη
  // "πόσο κοντά είναι το πλάνο στον στόχο" — ξαναϋπολογίζεται σε κάθε renderWeekTable(), δηλ. σε κάθε
  // προσθήκη/αφαίρεση τροφίμου. Μετράει μόνο μέρες που έχουν έστω 1 γεύμα — μια εντελώς άδεια μέρα δεν
  // πρέπει να τραβάει το ποσοστό προς τα κάτω σαν "αποτυχία".
  var weekActualK=0, weekTargetK=0, weekDaysCounted=0;
  for(var _wdi=0;_wdi<7;_wdi++){
    var _wdTotals=calculateDailyTotals(c.weekPlan[_wdi]||[]);
    if(_wdTotals.k>0){
      weekActualK+=_wdTotals.k;
      weekTargetK+=(c.dayTargets&&c.dayTargets[_wdi]&&c.dayTargets[_wdi].k)?c.dayTargets[_wdi].k:tdeeInfo.target;
      weekDaysCounted++;
    }
  }
  var weekKcalPct=weekTargetK>0?Math.max(0,Math.min(150,Math.round(weekActualK/weekTargetK*100))):null;
  var weekKcalRingHtml=weekKcalPct==null?'':(
    pctRing(Math.min(100,weekKcalPct),{size:40,thickness:5,color:weekKcalPct>=100?'var(--good)':'#025857',track:'#e2eee5',label:false})
    +'<span style="font-size:12px;color:#555">'+weekKcalPct+'% μ.ο. στόχου θερμίδων <span style="color:#999">('+weekDaysCounted+' μέρες με γεύματα)</span></span>'
  );

  var divider='<span style="width:1px;height:16px;background:#e0e0e0"></span>';
  var summaryCard = '<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:10px;padding:8px 14px;margin-bottom:12px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">'
    +'<span style="font-size:13px;font-weight:700;color:#025857">👤 ' + esc(c.name) + '</span>'
    +divider
    +'<span style="font-size:12px;color:#555">📊 ' + c.weight + 'kg / ' + c.height + 'cm · BMI ' + bmiVal + '</span>'
    +divider
    +'<span style="font-size:12px;color:#555">🎯 ' + goalLabel + '</span>'
    +divider
    +'<span style="font-size:12px;font-weight:700;color:#e65100">🔥 ' + Math.round(tdeeInfo.target) + ' kcal</span>'
    +divider
    +'<span style="font-size:12px;color:#555">Π:' + Math.round(tdeeInfo.p) + 'g · Λ:' + Math.round(tdeeInfo.f) + 'g · Υ:' + Math.round(tdeeInfo.carb) + 'g</span>'
    +(weekKcalRingHtml?(divider+'<span style="display:flex;align-items:center;gap:8px">'+weekKcalRingHtml+'</span>'):'')
    +'</div>';

  // ✅ Legend για τις χρωματιστές κουκκίδες τροφίμων — ίδια hex codes με getFoodColorHex()
  var foodDotLegend='<div style="background:var(--panel-bg);border:1px solid var(--border-light);border-radius:6px;padding:6px 10px;margin-bottom:10px;font-size:10px;color:#666;display:flex;flex-wrap:wrap;gap:10px;align-items:center">'
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
    var badge=trainD[di]?'<span title="Ημέρα με άσκηση: περισσότερες θερμίδες για ενέργεια + ανάκαμψη" style="background:#025857;color:#fff;border-radius:8px;font-size:10px;padding:1px 5px;margin-left:3px;cursor:help">T</span>':'<span title="Ημέρα ανάπαυσης: λιγότερες θερμίδες λόγω μειωμένης δαπάνης ενέργειας" style="background:#eee;color:var(--text-muted);border-radius:8px;font-size:10px;padding:1px 5px;margin-left:3px;cursor:help">R</span>';
    var timeStr='';
    if(trainD[di]&&trainTimes[di]&&trainTimes[di].length>0){
      timeStr='<div style="font-size:10px;color:#666;margin-top:2px;font-weight:400">🕐 '+trainTimes[di]+'</div>';
    }
    // ✅ Phase 1: Add sport display for training days
    var sportStr='';
    if(trainD[di]&&c.sport){
      sportStr='<div class="sport-header-dietitian" style="font-size:10px;color:#666;margin-top:2px;font-weight:500">'+c.sport+'</div>';
    }
    // ✅ Ένα κουμπί "⋮" αντί για 2 γυμνά εικονίδια — το μενού που ανοίγει έχει ορατό κείμενο
    // ("Αντιγραφή σε άλλες ημέρες" κ.λπ.) αντί να βασίζεται μόνο σε tooltip πάνω σε 2 μικρά
    // εικονίδια δίπλα-δίπλα, δύσκολα να τα ανακαλύψει κανείς την πρώτη φορά.
    var dayMenuId='day-menu-'+di;
    var dayMenuBtn='<button class="day-menu-btn" onclick="event.stopPropagation();toggleDayMenu(\''+dayMenuId+'\')" title="Ενέργειες ημέρας" aria-label="Ενέργειες ημέρας">⋮</button>';
    var dayMenuDropdown='<div id="'+dayMenuId+'" class="day-menu-dropdown">'
      +'<button onclick="copyDayPrompt(this,'+di+');closeDayMenu(\''+dayMenuId+'\')">📋 Αντιγραφή σε άλλες ημέρες</button>'
      +'<button onclick="regenerateDay('+di+');closeDayMenu(\''+dayMenuId+'\')">🔄 Αναδημιουργία μόνο αυτής</button>'
      +'<button onclick="swapDayPrompt(this,'+di+');closeDayMenu(\''+dayMenuId+'\')">🔁 Ανταλλαγή με άλλη ημέρα</button>'
      +'</div>';
    html+='<th style="position:relative">'+d+badge+timeStr+sportStr+dayMenuBtn+dayMenuDropdown+'</th>';
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
    var rowBg=(mi%2===0)?'background:var(--panel-bg)':'background:var(--card-bg)';
    html+='<tr style="'+rowBg+'"><td class="meal-label" style="visibility:hidden"></td>';
    for(var d=0;d<7;d++){
      var foods=(c.weekPlan[d]&&c.weekPlan[d][mi])?c.weekPlan[d][mi].foods:[];
      // ✅ Phase 4: Add meal timing data attribute
      var dayMealTiming='regular';
      if(c.weekPlan[d]&&c.weekPlan[d][mi]&&c.weekPlan[d][mi].mealTiming){
        dayMealTiming=c.weekPlan[d][mi].mealTiming;
      }
      html+='<td class="day-cell" data-d="'+d+'" data-mi="'+mi+'" data-meal-timing="'+dayMealTiming+'" style="'+rowBg+'">';
      if(foods.length){
        html+='<span class="meal-drag-handle" title="Σύρε ΟΛΟΚΛΗΡΟ το γεύμα σε άλλη ημέρα/γεύμα (αντιγραφή)" aria-label="Σύρε ολόκληρο το γεύμα (αντιγραφή)">&#10303;</span>';
      }
      html+=mealSourceBadge(c.weekPlan[d]&&c.weekPlan[d][mi]);
      // Γραμμή-τίτλος έτοιμου/branded γεύματος — ό,τι βλέπει κι ο πελάτης στο link/PDF, με κουμπί × για αφαίρεση.
      var _mObj=c.weekPlan[d]&&c.weekPlan[d][mi];
      if(_mObj&&_mObj.dishLabels&&_mObj.dishLabels.length){
        _mObj.dishLabels.forEach(function(_lbl,_li){
          html+='<div style="display:flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:#025857;background:#e2eee5;border:1px solid #b5dcd6;border-radius:6px;padding:2px 5px;margin-bottom:3px" title="Έτοιμο γεύμα — ο πελάτης το παραγγέλνει με αυτό το όνομα">'
            +'<span style="flex:1;min-width:0">🍽️ '+esc(_lbl)+'</span>'
            +'<button onclick="removeDishLabel('+d+','+mi+','+_li+')" title="Αφαίρεση τίτλου" aria-label="Αφαίρεση τίτλου" style="background:none;border:none;cursor:pointer;font-size:12px;line-height:1;color:#025857;opacity:.6;flex-shrink:0">&times;</button>'
            +'</div>';
        });
      }
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
        html+='<div class="food-chip" data-d="'+d+'" data-mi="'+mi+'" data-fi="'+fi+'" title="Σύρε αυτό το υλικό σε άλλο γεύμα (αντιγραφή)">'
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
          if(FOODS[food.n].time){html+='<div style="font-size:8px;color:var(--text-muted);padding:2px 0;margin-left:18px">⏱️ '+FOODS[food.n].time+'</div>';}
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
      if(foods.length){
        var menuId='meal-menu-'+d+'-'+mi;
        html+='<div style="display:inline-block;position:relative;margin-left:8px;">'
          +'<button class="chip-add" onclick="toggleMealMenu(\''+menuId+'\')" style="background:#025857;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;" title="Περισσότερες επιλογές">⋮</button>'
          +'<div id="'+menuId+'" class="meal-menu-dropdown" style="display:none;position:absolute;right:0;top:100%;background:var(--card-bg);border:1px solid var(--border-light);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:100;min-width:200px;margin-top:4px;">'
          +'<button onclick="toggleFavoriteMeal('+d+','+mi+',this);closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:var(--text-strong);font-size:12px;white-space:nowrap;transition:background 0.2s;opacity:'+(isFavoriteMeal(d,mi)?'1':'0.5')+'" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">'+(isFavoriteMeal(d,mi)?'⭐ Αφαίρεση από Αγαπημένα':'⭐ Προσθήκη στα Αγαπημένα')+'</button>'
          +'<button onclick="saveCombo('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:var(--text-strong);font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">💾 Αποθήκευση</button>'
          +'<button onclick="balanceMacros('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:var(--text-strong);font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">⚖️ Ισορροπία</button>'
          +'<button onclick="copyMealToClipboard('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:var(--text-strong);font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">❐ Αντιγραφή</button>'
          +'<hr style="margin:4px 0;border:none;border-top:1px solid #eee;">'
          +'<button onclick="rateMeal('+d+','+mi+',1);closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:var(--text-strong);font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">👍 Μου άρεσε</button>'
          +'<button onclick="rateMeal('+d+','+mi+',-1);showMealAlternatives('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:#ff6b35;font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">👎 Δεν μου άρεσε</button>'
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
  var fiberBannerHtml='<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:10px;padding:8px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
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
  // ✅ VALIDATE FOOD DISTRIBUTION — μαζί με τα άλλα validation widgets (Μεσογειακή βαθμολογία,
  // ίνες) πριν το εβδομαδιαίο grid, όχι μετά από αυτό — οι παραβιάσεις (π.χ. «πρέπει ακριβώς 2
  // ημέρες κόκκινο κρέας») είναι ακριβώς αυτό που χρειάζεται να δει η δ/γείος ΕΝΩ χτίζει το πλάνο,
  // όχι αφού περάσει scroll από ολόκληρο το πλέγμα.
  var foodValidation = validateFoodDistribution(c.weekPlan);
  var validationHtml = displayFoodDistributionResults(foodValidation);

  // Instead of displaying micronutrients inline, add a button to open the modal
  con.innerHTML=scoreHtml+fiberBannerHtml+validationHtml+tunaWarnHtml+html;

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

  // Attach drag-and-drop + click-to-select to each day-cell
  con.querySelectorAll('.day-cell').forEach(function(cell){
    cell.addEventListener('dragover',function(e){e.preventDefault();cell.classList.add('drag-over');});
    cell.addEventListener('dragleave',function(e){if(!cell.contains(e.relatedTarget))cell.classList.remove('drag-over');});
    cell.addEventListener('drop',function(e){
      e.preventDefault();cell.classList.remove('drag-over');
      var data=e.dataTransfer.getData('text/plain');
      if(insertPlanItemIntoCell(parseInt(cell.dataset.d),parseInt(cell.dataset.mi),data))renderWeekTable();
    });
    // ✅ Click-to-add target: πάτημα σε κελί το κάνει "ενεργό" ώστε το επόμενο κλικ σε
    // τρόφιμο/συνδυασμό απ' τη βιβλιοθήκη να μπαίνει κατευθείαν εκεί, χωρίς drag.
    cell.addEventListener('click',function(){
      setActiveMealTarget(parseInt(cell.dataset.d),parseInt(cell.dataset.mi));
    });
  });
  refreshActiveMealIndicator();
}

// Εισάγει τρόφιμο/συνδυασμό σε συγκεκριμένο κελί — κοινή λογική για drag&drop ΚΑΙ click-to-add,
// ώστε οι δύο τρόποι προσθήκης να συμπεριφέρονται πάντα ίδια (ίδιοι έλεγχοι diet/εξαιρέσεων).
function insertPlanItemIntoCell(d,mi,data){
  var c2=getC();if(!c2||!c2.weekPlan[d]||!c2.weekPlan[d][mi])return false;
  if(data.indexOf('combo:')===0){
    var cid=data.slice(6);
    var combo=getSavedCombos().filter(function(x){return x.id===cid;})[0];
    if(!combo)return false;
    var exclLower2=(c2.foodExclude||[]).map(function(x){return (x||'').toLowerCase();}).filter(Boolean);
    if(!comboDietOK(c2.dietType, combo.dietType) || comboHasExcludedFood(combo.foods, exclLower2)){
      showErrorToast('⚠️ Ο συνδυασμός δεν ταιριάζει με το diet type / τις εξαιρέσεις τροφίμων αυτού του πελάτη.');
      return false;
    }
    combo.foods.forEach(function(f){c2.weekPlan[d][mi].foods.push({n:f.n,g:f.g});});
  } else {
    if(!FOODS[data])return false;
    c2.weekPlan[d][mi].foods.push({n:data,g:100});
  }
  save();
  return true;
}

// Ποιο κελί (ημέρα, γεύμα) στοχεύουν τα κλικ στη βιβλιοθήκη τροφίμων — βλ. insertPlanItemIntoCell.
window._activeMealTarget=window._activeMealTarget||null;
function setActiveMealTarget(d,mi){
  window._activeMealTarget={d:d,mi:mi};
  refreshActiveMealIndicator();
}
function addLibItemToActiveTarget(data){
  var t=window._activeMealTarget;
  if(!t){showErrorToast('👆 Πάτα πρώτα σε ένα γεύμα, μετά πάτα το τρόφιμο για να προστεθεί εκεί.');return;}
  if(insertPlanItemIntoCell(t.d,t.mi,data))renderWeekTable();
}
function refreshActiveMealIndicator(){
  document.querySelectorAll('.day-cell.active-target').forEach(function(el){el.classList.remove('active-target');});
  var el=document.getElementById('active-meal-indicator');
  var c=getC();var t=window._activeMealTarget;
  if(t&&c&&c.weekPlan[t.d]&&c.weekPlan[t.d][t.mi]){
    var cell=document.querySelector('.day-cell[data-d="'+t.d+'"][data-mi="'+t.mi+'"]');
    if(cell)cell.classList.add('active-target');
    if(el){el.className='active-meal-indicator set';el.textContent='🎯 Ενεργό: '+DAYS[t.d]+' · '+c.weekPlan[t.d][t.mi].name;}
  } else if(el){
    el.className='active-meal-indicator';
    el.textContent='👆 Πάτα σε ένα γεύμα για να διαλέξεις πού θα προστεθούν τα τρόφιμα με κλικ';
  }
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
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999';

  var content=document.createElement('div');
  content.style.cssText='background:var(--card-bg);padding:20px;border-radius:8px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3)';

  // Add paste button if there's a meal in clipboard
  var pasteBtn='';
  if(window.mealClipboard){
    pasteBtn='<button onclick="pasteMealFromClipboard('+d+','+mi+');document.getElementById(\'food-selector-modal\').remove()" style="background:#4caf50;color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:11px;margin-right:10px">📋 Επικόλληση Γεύματος</button>';
  }

  content.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:2px solid #E2EEE5;padding-bottom:10px">'
    +'<h2 style="color:#025857;margin:0">🔍 Επιλογή Τροφίματος</h2>'
    +'<div>'+pasteBtn+'<button onclick="document.getElementById(\'food-selector-modal\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666">&times;</button></div>'
    +'</div>'
    +'<div style="display:flex;gap:6px;margin-bottom:10px">'
      +'<button id="food-selector-tab-foods" onclick="setFoodSelectorTab(\'foods\')" style="flex:1;background:#025857;color:#fff;border:none;border-radius:6px;padding:7px;cursor:pointer;font-size:12px;font-weight:600">🥗 Τρόφιμα</button>'
      +'<button id="food-selector-tab-recipes" onclick="setFoodSelectorTab(\'recipes\')" style="flex:1;background:#eee;color:var(--text-strong);border:none;border-radius:6px;padding:7px;cursor:pointer;font-size:12px;font-weight:600">📖 Συνταγές</button>'
    +'</div>'
    +'<div id="recipe-diet-filter-row" style="display:none;flex-wrap:wrap;gap:5px;margin-bottom:10px"></div>'
    +'<input id="food-search-input" class="food-lib-search" type="text" placeholder="Αναζήτηση τροφίμου..." style="width:100%;margin-bottom:15px" oninput="onFoodSelectorSearchInput(this.value)">'
    +'<div id="food-selector-list" style="max-height:500px;overflow-y:auto;border:1px solid var(--border-light);border-radius:6px"></div>'
    +'<div id="recipe-selector-list" style="display:none;max-height:500px;overflow-y:auto;border:1px solid var(--border-light);border-radius:6px"></div>';

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Store context for food selection
  window.currentFoodContext={d:d,mi:mi};

  // Initial render — πάντα ξεκινάει από την καρτέλα Τρόφιμα, χωρίς ενεργά φίλτρα διατροφικού τύπου
  _foodSelectorTab='foods';
  _foodSelectorRecipeDietFilters=[];
  _foodSelectorFavoritesOnly=false;
  _expandedFoodSelectorRecipeIds={};
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
    list.innerHTML='<div style="color:var(--text-muted);font-size:11px;padding:10px">Δεν βρέθηκε</div>';
    return;
  }

  var html='';
  Object.keys(cats).sort().forEach(function(cat){
    html+='<div style="background:var(--panel-bg);padding:8px 10px;font-weight:600;color:#666;border-top:1px solid #e0e0e0;margin-top:8px">'+cat+'</div>';
    cats[cat].forEach(function(n){
      var foodId='food-item-'+Math.random().toString(36).substr(2,9);
      html+='<div style="border-bottom:1px solid #f0f0f0">'
        +'<div id="'+foodId+'" style="padding:8px 10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'var(--card-bg)\'" onclick="showFoodQuantityInput(\''+foodId+'\',\''+n.replace(/'/g,"\\'")+'\')">'
          +'<span>'+n+'</span>'
          +'<span style="color:var(--text-muted);font-size:11px">'+FOODS[n].k+' kcal</span>'
        +'</div>'
        +'<div id="'+foodId+'-qty" style="display:none;padding:10px;background:var(--panel-bg);border-top:1px solid #e0e0e0">'
          +'<div style="display:flex;gap:8px;align-items:center">'
            +'<label style="font-size:11px;color:#666">Ποσότητα (gr):</label>'
            +'<input id="qty-input-'+foodId+'" type="number" value="100" min="1" max="500" style="width:70px;padding:4px;border:1px solid var(--border-light);border-radius:4px;font-size:12px">'
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

// ── Καρτέλα "Συνταγές" μέσα στο food-selector-modal — επιτρέπει να προσθέσεις
// μια ολόκληρη έτοιμη συνταγή (js/data.js MEAL_RECIPES/SNACK_RECIPES + δικές σου custom)
// στο τρέχον γεύμα του πλάνου, αντί να ψάχνεις τρόφιμο-τρόφιμο. ──
var _foodSelectorTab='foods';
// Ενεργά diet-type φίλτρα (κλειδιά από RECIPE_DIET_TAG_DEFS, js/app-part6-recipes.js) στην
// καρτέλα Συνταγές — OR μεταξύ τους (π.χ. Vegan + High Protein επιλεγμένα = φαίνονται και τα δύο).
var _foodSelectorRecipeDietFilters=[];
// Ποιες κάρτες συνταγών έχουν ανοιχτή την προεπισκόπηση υλικών (ίδιο pattern με
// _expandedRecipeIds στο app-part6-recipes.js, αλλά ξεχωριστό state — άλλη λίστα, άλλο context).
var _expandedFoodSelectorRecipeIds={};

function toggleFoodSelectorRecipeExpand(recipeId){
  _expandedFoodSelectorRecipeIds[recipeId]=!_expandedFoodSelectorRecipeIds[recipeId];
  var searchInput=document.getElementById('food-search-input');
  updateRecipeSelectorForPlan(searchInput?searchInput.value:'');
}

function onFoodSelectorSearchInput(val){
  if(_foodSelectorTab==='recipes') updateRecipeSelectorForPlan(val);
  else updateFoodSelector(val);
}

function setFoodSelectorTab(tab){
  _foodSelectorTab=tab;
  var foodsBtn=document.getElementById('food-selector-tab-foods');
  var recipesBtn=document.getElementById('food-selector-tab-recipes');
  var foodsList=document.getElementById('food-selector-list');
  var recipesList=document.getElementById('recipe-selector-list');
  var dietFilterRow=document.getElementById('recipe-diet-filter-row');
  var searchInput=document.getElementById('food-search-input');
  var showRecipes=(tab==='recipes');
  if(foodsBtn){foodsBtn.style.background=showRecipes?'#eee':'#025857';foodsBtn.style.color=showRecipes?'#333':'#fff';}
  if(recipesBtn){recipesBtn.style.background=showRecipes?'#025857':'#eee';recipesBtn.style.color=showRecipes?'#fff':'#333';}
  if(foodsList)foodsList.style.display=showRecipes?'none':'block';
  if(recipesList)recipesList.style.display=showRecipes?'block':'none';
  if(dietFilterRow)dietFilterRow.style.display=showRecipes?'flex':'none';
  if(showRecipes)renderRecipeDietFilterChips();
  if(searchInput){
    searchInput.placeholder=showRecipes?'Αναζήτηση συνταγής...':'Αναζήτηση τροφίμου...';
    if(showRecipes)updateRecipeSelectorForPlan(searchInput.value);
    else updateFoodSelector(searchInput.value);
  }
}

// Χρησιμοποιεί το ήδη υπάρχον "⭐ δημοφιλές" σημάδι ανά συνταγή (isRecipePopular, js/app-part6-recipes.js
// — η ίδια σημαία που φαίνεται στην κύρια καρτέλα Συνταγές), απλά το κάνει διαθέσιμο κι εδώ ως φίλτρο.
var _foodSelectorFavoritesOnly=false;

function renderRecipeDietFilterChips(){
  var row=document.getElementById('recipe-diet-filter-row');
  if(!row)return;
  var favChip='<button onclick="toggleFoodSelectorFavoritesOnly()" style="background:'+(_foodSelectorFavoritesOnly?'#025857':'#eee')+';color:'+(_foodSelectorFavoritesOnly?'#fff':'#333')+';border:none;border-radius:12px;padding:4px 11px;cursor:pointer;font-size:11px;font-weight:'+(_foodSelectorFavoritesOnly?'600':'400')+'">⭐ Μόνο αγαπημένα</button>';
  var defs=(typeof availableRecipeDietTags==='function')?availableRecipeDietTags():[];
  row.innerHTML=favChip+defs.map(function(def){
    var active=_foodSelectorRecipeDietFilters.indexOf(def.key)>-1;
    return '<button onclick="toggleFoodSelectorDietFilter(\''+def.key+'\')" style="background:'+(active?'#025857':'#eee')+';color:'+(active?'#fff':'#333')+';border:none;border-radius:12px;padding:4px 11px;cursor:pointer;font-size:11px;font-weight:'+(active?'600':'400')+'">'+esc(def.label)+'</button>';
  }).join('');
}

function toggleFoodSelectorFavoritesOnly(){
  _foodSelectorFavoritesOnly=!_foodSelectorFavoritesOnly;
  renderRecipeDietFilterChips();
  var searchInput=document.getElementById('food-search-input');
  updateRecipeSelectorForPlan(searchInput?searchInput.value:'');
}

function toggleFoodSelectorDietFilter(key){
  var idx=_foodSelectorRecipeDietFilters.indexOf(key);
  if(idx>-1)_foodSelectorRecipeDietFilters.splice(idx,1);
  else _foodSelectorRecipeDietFilters.push(key);
  renderRecipeDietFilterChips();
  var searchInput=document.getElementById('food-search-input');
  updateRecipeSelectorForPlan(searchInput?searchInput.value:'');
}

// 0 = ταιριάζει στην ώρα του τρέχοντος γεύματος, 1 = χωρίς ώρα ορισμένη ("οποιοδήποτε γεύμα"),
// 2 = ορισμένη για άλλη ώρα γεύματος — έτσι οι άσχετες συνταγές δεν κρύβονται, απλά βουλιάζουν κάτω.
function rankRecipeForMealTime(recipe,targetCategory){
  var times=(typeof getRecipeMealTimes==='function')?getRecipeMealTimes(recipe):(recipe.mealTimes||[]);
  if(!times||!times.length)return 1;
  return times.indexOf(targetCategory)>-1?0:2;
}

function updateRecipeSelectorForPlan(query){
  var list=document.getElementById('recipe-selector-list');
  if(!list)return;
  var q=(query||'').toLowerCase().trim();
  var all=(typeof allRecipesForBrowsing==='function')?allRecipesForBrowsing():[];
  var filtered=all.filter(function(r){return !q||(r.name||'').toLowerCase().indexOf(q)>-1;});

  // Diet-type φίλτρα (chips) — OR μεταξύ επιλεγμένων (π.χ. Vegan + High Protein = φαίνονται και τα δύο).
  if(_foodSelectorRecipeDietFilters.length && typeof recipeHasDietTag==='function'){
    filtered=filtered.filter(function(r){
      return _foodSelectorRecipeDietFilters.some(function(key){return recipeHasDietTag(r,key);});
    });
  }

  // "⭐ Μόνο αγαπημένα" chip — κρατάει μόνο τις συνταγές που ο διαιτολόγος έχει ήδη σημαδέψει
  // ως δημοφιλείς (isRecipePopular, js/app-part6-recipes.js).
  if(_foodSelectorFavoritesOnly && typeof isRecipePopular==='function'){
    filtered=filtered.filter(function(r){return isRecipePopular(r);});
  }

  // Ταξινόμηση: πρώτα κατά ώρα γεύματος, μετά όχι-απορριγμένες-από-τον-πελάτη, μετά αγαπημένες
  // (⭐), μετά όσες ο ΙΔΙΟΣ πελάτης έχει ξαναβαθμολογήσει θετικά (👍) — μόνο όταν αναγνωρίζεται
  // η ώρα του γεύματος γίνεται το πρώτο tier, αλλιώς όλες στο ίδιο ουδέτερο tier.
  var targetCategory=null;
  var ctx=window.currentFoodContext;
  var c=getC();
  if(ctx&&c){
    var meal=c.weekPlan&&c.weekPlan[ctx.d]&&c.weekPlan[ctx.d][ctx.mi];
    if(meal)targetCategory=mealTypeToCategory(meal.name);
  }
  filtered=filtered.map(function(r,idx){return {r:r,idx:idx};}).sort(function(a,b){
    var rankDiff=targetCategory?(rankRecipeForMealTime(a.r,targetCategory)-rankRecipeForMealTime(b.r,targetCategory)):0;
    if(rankDiff)return rankDiff;
    var fbA=getClientRecipeFeedback(a.r,c), fbB=getClientRecipeFeedback(b.r,c);
    var dislikeDiff=(fbA.disliked?1:0)-(fbB.disliked?1:0);
    if(dislikeDiff)return dislikeDiff;
    var favA=(typeof isRecipePopular==='function'&&isRecipePopular(a.r))?0:1;
    var favB=(typeof isRecipePopular==='function'&&isRecipePopular(b.r))?0:1;
    if(favA-favB)return favA-favB;
    var likeDiff=fbB.liked-fbA.liked;
    if(likeDiff)return likeDiff;
    return a.idx-b.idx;
  }).map(function(x){return x.r;});

  if(!filtered.length){
    list.innerHTML='<div style="color:var(--text-muted);font-size:11px;padding:10px">Δεν βρέθηκε συνταγή</div>';
    return;
  }
  var html=targetCategory?('<div style="padding:6px 10px;font-size:10.5px;color:#025857;background:#F3F9F4;border-bottom:1px solid #E2EEE5">↑ Πρώτα συνταγές για: '+esc(targetCategory)+'</div>'):'';
  filtered.forEach(function(r){
    var tagsHtml=(r.tags||[]).slice(0,3).map(function(t){return '<span style="background:#E2EEE5;color:#025857;border-radius:10px;padding:1px 7px;font-size:10px;margin-right:4px">'+esc(t)+'</span>';}).join('');
    var ingCount=(r.foods||[]).length;
    var conflicts=c?getRecipeExclusionConflicts(r,c):[];
    var feedback=getClientRecipeFeedback(r,c);
    var warnHtml=conflicts.length?('<div style="font-size:10.5px;color:#c62828;margin-top:2px">⚠️ Περιέχει αποκλεισμένο: '+esc(conflicts.map(function(f){return f.n;}).join(', '))+'</div>'):'';
    var feedbackHtml=feedback.disliked
      ?'<div style="font-size:10.5px;color:#c62828;margin-top:2px">🚫 Ο πελάτης το απέρριψε πριν (👎)</div>'
      :(feedback.liked>0?'<div style="font-size:10.5px;color:var(--good);margin-top:2px">👍 Άρεσε στον πελάτη '+feedback.liked+' '+(feedback.liked===1?'φορά':'φορές')+'</div>':'');
    var expanded=!!_expandedFoodSelectorRecipeIds[r.id];
    var favorite=typeof isRecipePopular==='function'&&isRecipePopular(r);
    var expandBtn='<button type="button" title="Υλικά" aria-label="Προβολή υλικών" onclick="toggleFoodSelectorRecipeExpand(\''+r.id+'\')" style="background:none;border:none;cursor:pointer;font-size:11px;padding:2px 4px 2px 0;flex-shrink:0;color:var(--text-muted)">'+(expanded?'🔼':'🔽')+'</button>';
    var ingredientsHtml=expanded?('<div style="padding:2px 10px 8px 26px;display:flex;flex-wrap:wrap;gap:5px">'+(r.foods||[]).map(function(f){return '<span style="background:var(--panel-bg);font-size:10.5px;padding:3px 8px;border-radius:4px;color:#666">'+esc(f.n)+' · '+f.g+'g</span>';}).join('')+'</div>'):'';
    html+='<div style="border-bottom:1px solid #f0f0f0">'
      +'<div style="padding:8px 10px 8px 6px;display:flex;justify-content:space-between;align-items:center;gap:8px">'
        +'<div style="display:flex;align-items:flex-start;gap:2px;min-width:0">'
          +expandBtn
          +'<div style="min-width:0">'
            +'<div style="font-weight:600;font-size:12.5px;color:#222">'+(favorite?'⭐ ':'')+esc(r.name)+'</div>'
            +'<div style="font-size:10.5px;color:var(--text-muted)">'+(r.kcal||0)+' kcal · '+ingCount+' υλικά '+tagsHtml+'</div>'
            +warnHtml
            +feedbackHtml
          +'</div>'
        +'</div>'
        +'<button onclick="confirmAddRecipeToMeal(\''+r.id+'\')" style="background:'+((conflicts.length||feedback.disliked)?'#c62828':'#025857')+';color:#fff;border:none;border-radius:4px;padding:5px 10px;cursor:pointer;font-size:11px;white-space:nowrap;flex-shrink:0">➕ Προσθήκη</button>'
      +'</div>'
      +ingredientsHtml
    +'</div>';
  });
  list.innerHTML=html;
}

// Ελέγχει τα υλικά μιας συνταγής (recipe.foods) έναντι της ΙΔΙΑΣ merged λίστας αποκλεισμού που
// χρησιμοποιεί ήδη το genPlan()/scrubExcludedFoodsFromWeekPlan (js/app-part2.js: buildEffectiveExclusionList
// + foodIsExcludedByNameOrIngredient) — foodExclude + πρωτόκολλα + αλλεργίες + preferences.
// Επαναχρησιμοποιούμε αυτή την ήδη-διορθωμένη λογική αντί να ξαναγράψουμε δικό μας name-matching
// (βλ. το bugfix του ίδιου αρχείου στις 2026-07-30 για σύνθετα πιάτα με κρυμμένο αποκλεισμένο συστατικό).
function getRecipeExclusionConflicts(recipe,c){
  if(typeof buildEffectiveExclusionList!=='function'||typeof foodIsExcludedByNameOrIngredient!=='function'||typeof normalizeGreekText!=='function')return [];
  var exclList=buildEffectiveExclusionList(c);
  if(!exclList||!exclList.length)return [];
  var exclNormalized=exclList.map(function(x){return normalizeGreekText(x);});
  return (recipe.foods||[]).filter(function(f){return foodIsExcludedByNameOrIngredient(f.n,exclNormalized);});
}

// Διαβάζει το ΙΔΙΟ trust/dislike store που ήδη γεμίζει το 👍/👎 σύστημα του πλάνου (js/app-part4.js
// rateMeal/logPlanGeneration): meal.recipeId ΓΙΑ ΣΥΝΤΑΓΕΣ ΣΕΦ (MEAL_RECIPES/SNACK_RECIPES/custom) είναι
// πάντα το ίδιο recipe.id — άρα c.dislikedRecipeIds/TRACKING_DATA.recipes[id] είναι απευθείας συγκρίσιμα
// με το recipe.id εδώ, χωρίς να χρειάζεται να ξαναϋπολογίσουμε recipeSig (αυτό αφορά μόνο taste-library/
// saved-combo γεύματα, που δεν εμφανίζονται σε αυτό το picker).
function getClientRecipeFeedback(recipe,c){
  var disliked=!!(c&&c.dislikedRecipeIds&&c.dislikedRecipeIds.indexOf(recipe.id)>-1);
  var liked=0;
  if(typeof TRACKING_DATA!=='undefined'&&TRACKING_DATA.recipes&&TRACKING_DATA.recipes[recipe.id]&&c){
    liked=(TRACKING_DATA.recipes[recipe.id].ratings||[]).filter(function(r2){return r2.clientName===c.name&&r2.rating>0;}).length;
  }
  return {disliked:disliked,liked:liked};
}

function insertRecipeFoodsIntoMeal(recipe,ctx){
  var c=getC();
  if(!c)return;
  var meal=c.weekPlan[ctx.d][ctx.mi];
  (recipe.foods||[]).forEach(function(f){
    meal.foods.push({n:f.n,g:f.g});
  });
  // Έτοιμα/branded γεύματα (tag 'Έτοιμο γεύμα'): κρατάμε το όνομα του πιάτου πάνω στο γεύμα ώστε
  // ο πελάτης να το βλέπει ως γραμμή-τίτλο πάνω από τα υλικά (client link + PDF) και να μπορεί να
  // το παραγγείλει με το όνομά του. Το brand name μένει αυτούσιο σε κάθε γλώσσα (δεν μεταφράζεται).
  if((recipe.tags||[]).indexOf('Έτοιμο γεύμα')>-1 && recipe.name){
    meal.dishLabels=meal.dishLabels||[];
    if(meal.dishLabels.indexOf(recipe.name)===-1) meal.dishLabels.push(recipe.name);
  }
  save();
  renderWeekTable();
  var modal=document.getElementById('food-selector-modal');
  if(modal)modal.remove();
}

// Αφαίρεση μιας γραμμής-τίτλου έτοιμου γεύματος από το γεύμα (κουμπί × στο εβδομαδιαίο πλάνο).
function removeDishLabel(d,mi,li){
  var c=getC();if(!c||!c.weekPlan[d]||!c.weekPlan[d][mi])return;
  var meal=c.weekPlan[d][mi];
  if(!meal.dishLabels)return;
  meal.dishLabels.splice(li,1);
  if(!meal.dishLabels.length)delete meal.dishLabels;
  save();renderWeekTable();
}

function confirmAddRecipeToMeal(recipeId){
  var ctx=window.currentFoodContext;
  if(!ctx)return;
  var c=getC();
  if(!c)return;
  var recipe=(typeof findRecipeById==='function')?findRecipeById(recipeId):null;
  if(!recipe){showErrorToast('Η συνταγή δεν βρέθηκε.');return;}
  var conflicts=getRecipeExclusionConflicts(recipe,c);
  var feedback=getClientRecipeFeedback(recipe,c);
  var reasons=[];
  if(conflicts.length)reasons.push('περιέχει '+conflicts.map(function(f){return f.n;}).join(', ')+' — αποκλεισμένο/αλλεργία για τον πελάτη');
  if(feedback.disliked)reasons.push('ο πελάτης την είχε απορρίψει (👎) σε προηγούμενο πλάνο');
  if(reasons.length && typeof showConfirmDialog==='function'){
    showConfirmDialog(
      'Η συνταγή «'+recipe.name+'» '+reasons.join(' και ')+'. Προσθήκη παρόλα αυτά;',
      function(){insertRecipeFoodsIntoMeal(recipe,ctx);},
      {title:'Προσοχή',icon:'⚠️',confirmLabel:'Προσθήκη παρόλα αυτά'}
    );
  } else {
    insertRecipeFoodsIntoMeal(recipe,ctx);
  }
}

function delF(d,mi,fi){var c=getC();if(!c)return;var m=c.weekPlan[d][mi];m.foods.splice(fi,1);if(!m.foods.length&&m.dishLabels)delete m.dishLabels;save();renderWeekTable();}

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
    +'<div style="background:var(--card-bg);border-radius:12px;padding:20px;max-width:440px;width:90%;box-shadow:0 8px 24px rgba(0,0,0,0.3)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:2px solid #025857;padding-bottom:10px">'
    +'<h2 style="margin:0;color:#025857;font-size:17px">➕ Προσθήκη γεύματος</h2>'
    +'<button onclick="closeAddMealSlotModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted)">&times;</button>'
    +'</div>'
    +'<div style="background:#E8F5E9;padding:10px 12px;border-radius:6px;margin-bottom:14px;font-size:11px;color:#2E7D32;line-height:1.5">'
    +'💡 Το γεύμα μπαίνει σε <b>όλες τις ημέρες</b>. Άφησέ το κενό στις ημέρες που δεν χρειάζεται — εμφανίζεται μόνο το «+».</div>'
    +'<div style="font-size:11px;color:#666;margin-bottom:6px">Γρήγορες επιλογές:</div>'
    +'<div style="margin-bottom:12px">'+presetBtns+'</div>'
    +'<label style="font-weight:600;color:var(--text-strong);font-size:12px;display:block;margin-bottom:4px">Όνομα γεύματος</label>'
    +'<input id="newMealName" type="text" value="Pre 2ης προπόνησης" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px;margin-bottom:12px;box-sizing:border-box">'
    +'<label style="font-weight:600;color:var(--text-strong);font-size:12px;display:block;margin-bottom:4px">Τύπος (timing → κατανομή μακρο)</label>'
    +'<select id="newMealTiming" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px;margin-bottom:12px;box-sizing:border-box">'+timingOpts+'</select>'
    +'<label style="font-weight:600;color:var(--text-strong);font-size:12px;display:block;margin-bottom:4px">Θέση στη μέρα</label>'
    +'<select id="newMealPos" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px;margin-bottom:18px;box-sizing:border-box">'+posOpts+'</select>'
    +'<div style="display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="closeAddMealSlotModal()" style="padding:9px 18px;background:#eee;border:none;border-radius:6px;cursor:pointer">Άκυρο</button>'
    +'<button onclick="confirmAddMealSlot()" style="padding:9px 18px;background:#025857;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">✅ Προσθήκη</button>'
    +'</div></div></div>';
  var overlay=document.createElement('div');
  overlay.id='addMealSlotModal';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
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
function toggleDayMenu(id){
  document.querySelectorAll('.day-menu-dropdown.open').forEach(function(el){if(el.id!==id)el.classList.remove('open');});
  var el=document.getElementById(id);if(!el)return;
  var opening=!el.classList.contains('open');
  el.classList.toggle('open',opening);
  if(opening){
    setTimeout(function(){
      function outside(e){if(!el.contains(e.target)){el.classList.remove('open');document.removeEventListener('mousedown',outside);}}
      document.addEventListener('mousedown',outside);
    },0);
  }
}
function closeDayMenu(id){var el=document.getElementById(id);if(el)el.classList.remove('open');}

// Το μενού "⋮" κάθε γεύματος (💾 Αποθήκευση / ⚖️ Ισορροπία / ❐ Αντιγραφή / 👍👎) καλούσε
// toggleMealMenu/closeMealMenu που δεν υπήρχαν πουθενά στον κώδικα — το κουμπί δεν έκανε τίποτα.
// Ίδια λογική με toggleDayMenu/closeDayMenu, αλλά μέσω style.display (όχι CSS class) γιατί το
// markup του μενού ήδη έχει display:none inline, χωρίς αντίστοιχο CSS hook.
function toggleMealMenu(id){
  document.querySelectorAll('.meal-menu-dropdown').forEach(function(el){if(el.id!==id)el.style.display='none';});
  var el=document.getElementById(id);if(!el)return;
  var opening=el.style.display==='none'||!el.style.display;
  el.style.display=opening?'block':'none';
  if(opening){
    setTimeout(function(){
      function outside(e){if(!el.contains(e.target)){el.style.display='none';document.removeEventListener('mousedown',outside);}}
      document.addEventListener('mousedown',outside);
    },0);
  }
}
function closeMealMenu(id){var el=document.getElementById(id);if(el)el.style.display='none';}
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
  panel.style.cssText='position:fixed;z-index:9999;background:var(--card-bg);border:1px solid #025857;border-radius:8px;padding:10px 12px;box-shadow:0 4px 18px rgba(0,0,0,.18);font-size:11px;min-width:165px;left:'+Math.round(rect.left)+'px;top:'+Math.round(rect.bottom+4)+'px';
  var inner='<div style="font-weight:700;color:#025857;margin-bottom:7px">📋 Αντιγραφή '+dayNames[fromDay]+' σε:</div>';
  inner+='<div style="display:flex;flex-direction:column;gap:5px">';
  for(var di=0;di<7;di++){
    if(di===fromDay)continue;
    inner+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer">'
      +'<input type="checkbox" id="cp-'+di+'" style="accent-color:#025857"> '+dayNames[di]+'</label>';
  }
  inner+='</div><div style="display:flex;gap:6px;margin-top:8px">'
    +'<button onclick="doCopyDay('+fromDay+')" style="flex:1;padding:4px;background:#025857;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer">✓ Εφαρμογή</button>'
    +'<button onclick="document.getElementById(\''+panelId+'\').remove()" style="padding:4px 8px;border:1px solid var(--border-light);border-radius:5px;font-size:11px;cursor:pointer;background:var(--card-bg)">✕</button>'
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

// ✅ Ανταλλαγή φαγητού μεταξύ δύο ημερών — swap ΜΟΝΟ του c.weekPlan[i]/[j] (τα γεύματα/τροφές).
// Προπόνηση (trainDays/trainHoursByDay/trainTimesByDay), στόχοι kcal/carb (dayTargets), match-day
// flag (matchDays) και εξαιρέσεις νηστείας (dietExceptionDays/dietFoodExceptionDays) μένουν στη
// ΘΕΣΗ της ημέρας — δεν ακολουθούν το φαγητό (επιβεβαιωμένο με τον χρήστη, βλ. συζήτηση mockup).
// Άρα το μετακινημένο φαγητό μπορεί να μην ταιριάζει πλέον ακριβώς στον στόχο της νέας ημέρας —
// αναμενόμενο, ο διατροφολόγος το προσαρμόζει χειροκίνητα όπως θα έκανε ούτως ή άλλως.
function swapPlanDays(c,i,j){
  if(!c||!c.weekPlan||i===j)return;
  var tmp=c.weekPlan[i];
  c.weekPlan[i]=c.weekPlan[j];
  c.weekPlan[j]=tmp;
}
function swapDayPrompt(btn,fromDay){
  var c=getC();if(!c||!c.weekPlan[fromDay]||!c.weekPlan[fromDay].length)return;
  var dayNames=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var panelId='swap-panel-'+fromDay;
  var existing=document.getElementById(panelId);
  if(existing){existing.remove();return;}
  // Close any other open swap/copy panels
  document.querySelectorAll('[id^="swap-panel-"],[id^="copy-panel-"]').forEach(function(p){p.remove();});
  var rect=btn.getBoundingClientRect();
  var panel=document.createElement('div');
  panel.id=panelId;
  panel.style.cssText='position:fixed;z-index:9999;background:var(--card-bg);border:1px solid #025857;border-radius:8px;padding:10px 12px;box-shadow:0 4px 18px rgba(0,0,0,.18);font-size:11px;min-width:165px;left:'+Math.round(rect.left)+'px;top:'+Math.round(rect.bottom+4)+'px';
  var inner='<div style="font-weight:700;color:#025857;margin-bottom:7px">🔁 Ανταλλαγή '+dayNames[fromDay]+' με:</div>';
  inner+='<div style="display:flex;flex-direction:column;gap:5px">';
  for(var di=0;di<7;di++){
    if(di===fromDay)continue;
    // ✅ id scoped to fromDay (sw-<from>-<to>, not just sw-<to>) so it can never collide with
    // another swap panel's radios even if the "close other open panels" line above is ever
    // changed/removed — the panel is already scoped by `panelId`/`name`, this just makes the
    // per-input id agree with that instead of being the one un-scoped piece.
    inner+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer">'
      +'<input type="radio" name="sw-target-'+fromDay+'" id="sw-'+fromDay+'-'+di+'" style="accent-color:#025857"> '+dayNames[di]+'</label>';
  }
  inner+='</div><div style="display:flex;gap:6px;margin-top:8px">'
    +'<button onclick="doSwapDay('+fromDay+')" style="flex:1;padding:4px;background:#025857;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer">✓ Αντιστροφή</button>'
    +'<button onclick="document.getElementById(\''+panelId+'\').remove()" style="padding:4px 8px;border:1px solid var(--border-light);border-radius:5px;font-size:11px;cursor:pointer;background:var(--card-bg)">✕</button>'
    +'</div>';
  panel.innerHTML=inner;
  document.body.appendChild(panel);
  // Close on outside click
  setTimeout(function(){
    function outsideClick(e){if(!panel.contains(e.target)&&e.target!==btn){panel.remove();document.removeEventListener('mousedown',outsideClick);}}
    document.addEventListener('mousedown',outsideClick);
  },0);
}
function doSwapDay(fromDay){
  var c=getC();if(!c)return;
  var panel=document.getElementById('swap-panel-'+fromDay);
  var toDay=-1;
  for(var di=0;di<7;di++){
    var rb=document.getElementById('sw-'+fromDay+'-'+di);
    if(rb&&rb.checked){toDay=di;break;}
  }
  if(toDay===-1){showErrorToast('Διάλεξε μια ημέρα για ανταλλαγή.');return;}
  if(panel)panel.remove();
  swapPlanDays(c,fromDay,toDay);
  save();renderWeekTable();
  showSwapUndoToast(fromDay,toDay);
}

// ✅ Ειδικό toast με κουμπί «↩ Αναίρεση» — το γενικό ↶ Αναίρεση πάνω-αριστερά (UndoRedoManager)
// δεν πιάνει swap/copy/regenerate ημέρας (ίδιο κενό είχε ήδη το «Αντιγραφή σε άλλες ημέρες»).
// Μια ανταλλαγή όμως αναιρείται ΑΚΡΙΒΩΣ ξανακάνοντας το ίδιο swap, οπότε αξίζει ειδικό κουμπί
// εδώ αντί να απαιτείται να ξανανοίξεις το μενού και να διαλέξεις ξανά τις δύο ημέρες.
function showSwapUndoToast(dayA,dayB){
  var dayNames=['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
  var existing=document.getElementById('swap-undo-toast');if(existing)existing.remove();
  var t=document.createElement('div');
  t.id='swap-undo-toast';
  t.style.cssText='position:fixed;bottom:20px;right:20px;background:#025857;color:#fff;padding:10px 10px 10px 16px;border-radius:8px;font-size:12px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px;max-width:360px';
  t.innerHTML='<span>✓ Αντιστράφηκε το φαγητό: '+dayNames[dayA]+' ↔ '+dayNames[dayB]+'</span>'
    +'<button style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0">↩ Αναίρεση</button>';
  document.body.appendChild(t);
  var timer=setTimeout(function(){t.remove();},6000);
  t.querySelector('button').onclick=function(){
    clearTimeout(timer);
    var cc=getC();
    if(cc){swapPlanDays(cc,dayA,dayB);save();renderWeekTable();}
    t.remove();
    dietoToast('↩ Η ανταλλαγή αναιρέθηκε');
  };
}

/* ---- Meal & ingredient drag ----
   Custom pointer-drag (ΟΧΙ HTML5 `draggable` — δεν λειτουργεί αξιόπιστα για
   στοιχεία μέσα σε <td>, και όταν το ίδιο το <td> είναι draggable «σκιάζει»
   κάθε εσωτερικό στοιχείο). Πάτα-σύρε-άσε με ποντίκι ή δάχτυλο:
     • σύρσιμο ενός .food-chip        → αντιγραφή ΕΝΟΣ υλικού σε άλλο γεύμα
     • σύρσιμο της λαβής ⠿ (ανά κελί) → αντιγραφή ΟΛΟΥ του γεύματος
   Πάντα ΑΝΤΙΓΡΑΦΗ — η πηγή μένει ανέπαφη. Esc ή pointercancel ακυρώνει.
   Κατώφλι 6px ώστε ένα απλό κλικ να μη ξεκινά σύρσιμο (κρατά το click-to-select). */
var _mealDrag=null; // {info, startX, startY, started, ghost}

function enableMealDragDrop(){
  // (α) Πάτα-σύρε ένα .food-chip → αντιγραφή ΕΝΟΣ υλικού
  document.querySelectorAll('#week-con .food-chip').forEach(function(chip){
    chip.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      // Κουμπιά + το πεδίο γραμμαρίων: όχι σύρσιμο. Το πεδίο ΟΝΟΜΑΤΟΣ επιτρέπεται
      // (το σύρσιμο ξεκινά μόνο μετά από κίνηση 6px — απλό κλικ = εστίαση για γράψιμο).
      // .chip-dd: τα dropdown επιλογής μερίδας (≡ «Μερίδες» → .srv-ddi) και αυτόματης
      // συμπλήρωσης ονόματος (.chip-ddi) ζουν ΜΕΣΑ στο .food-chip — χωρίς αυτή την εξαίρεση
      // το pointerdown πάνω σε μια επιλογή ξεκινούσε σύρσιμο και το e.preventDefault() έπνιγε
      // το mousedown, οπότε το pickServing/pickChip δεν έτρεχε ποτέ (π.χ. αδύνατη η αλλαγή σε φλ.).
      if(e.target.closest&&e.target.closest('button, .chip-g, .chip-unit-btn, .chip-dd'))return;
      var d=parseInt(chip.dataset.d),mi=parseInt(chip.dataset.mi),fi=parseInt(chip.dataset.fi);
      var c=getC();
      if(!c||!c.weekPlan[d]||!c.weekPlan[d][mi]||!c.weekPlan[d][mi].foods[fi])return;
      var food=c.weekPlan[d][mi].foods[fi];
      if(food.n===FREE_MEAL_MARKER)return;
      _startMealPointerDrag(e,{kind:'food',srcD:d,srcMi:mi,food:food,label:food.n+' · '+(food.g||0)+'g'});
    });
  });
  // (β) Πάτα-σύρε τη λαβή ⠿ → αντιγραφή ΟΛΟΥ του γεύματος
  document.querySelectorAll('#week-con .meal-drag-handle').forEach(function(handle){
    handle.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      var cell=handle.closest('.day-cell');if(!cell)return;
      var d=parseInt(cell.dataset.d),mi=parseInt(cell.dataset.mi);
      var c=getC();
      if(!c||!c.weekPlan[d]||!c.weekPlan[d][mi]||!(c.weekPlan[d][mi].foods||[]).length)return;
      _startMealPointerDrag(e,{kind:'meal',srcD:d,srcMi:mi,foods:c.weekPlan[d][mi].foods,label:'Γεύμα · '+c.weekPlan[d][mi].foods.length+' τρόφιμα'});
    });
  });
}

function _startMealPointerDrag(e,info){
  // Μη μπλοκάρεις το pointerdown πάνω σε πεδίο κειμένου — αλλιώς δεν εστιάζει για γράψιμο.
  if(!(e.target.closest&&e.target.closest('input,textarea')))e.preventDefault();
  _mealDrag={info:info,startX:e.clientX,startY:e.clientY,started:false,ghost:null};
  document.addEventListener('pointermove',_onMealDragMove,{capture:true,passive:false});
  document.addEventListener('pointerup',_onMealDragUp,true);
  document.addEventListener('pointercancel',_cancelMealDrag,true);
  document.addEventListener('keydown',_onMealDragKey,true);
}
function _onMealDragKey(e){if(e.key==='Escape')_cancelMealDrag();}

function _onMealDragMove(e){
  var md=_mealDrag;if(!md)return;
  var dx=e.clientX-md.startX, dy=e.clientY-md.startY;
  if(!md.started){
    if(Math.abs(dx)+Math.abs(dy)<6)return;           // κατώφλι — απλό κλικ δεν ξεκινά σύρσιμο
    md.started=true;
    // Το σύρσιμο ξεκίνησε από πεδίο ονόματος → σταμάτα τυχόν επιλογή κειμένου/εστίαση
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
    try{var sel=window.getSelection&&window.getSelection();if(sel&&sel.removeAllRanges)sel.removeAllRanges();}catch(_e){}
    closeDD&&closeDD();
    document.body.style.userSelect='none';
    document.body.style.cursor='grabbing';
    var g=document.createElement('div');
    g.className='meal-drag-ghost';
    g.textContent=(md.info.kind==='meal'?'📋 ':'')+md.info.label;
    document.body.appendChild(g);
    md.ghost=g;
  }
  e.preventDefault();
  md.ghost.style.left=(e.clientX+14)+'px';
  md.ghost.style.top=(e.clientY+14)+'px';
  var prev=document.querySelector('#week-con .day-cell.meal-drag-over');
  if(prev)prev.classList.remove('meal-drag-over');
  var t=_mealDragCellAt(e.clientX,e.clientY);
  if(t&&!(t.d===md.info.srcD&&t.mi===md.info.srcMi))t.cell.classList.add('meal-drag-over');
}
function _mealDragCellAt(x,y){
  var el=document.elementFromPoint(x,y);
  var cell=el&&el.closest?el.closest('#week-con .day-cell'):null;
  if(!cell)return null;
  return {cell:cell,d:parseInt(cell.dataset.d),mi:parseInt(cell.dataset.mi)};
}
function _onMealDragUp(e){
  var md=_mealDrag;
  var didDrop=false;
  if(md&&md.started){
    var t=_mealDragCellAt(e.clientX,e.clientY);
    if(t){
      var c=getC();
      if(c&&c.weekPlan[t.d]&&c.weekPlan[t.d][t.mi]&&!(t.d===md.info.srcD&&t.mi===md.info.srcMi)){
        if(md.info.kind==='food'){
          c.weekPlan[t.d][t.mi].foods.push(deepClone(md.info.food));
        }else{
          md.info.foods.forEach(function(f){c.weekPlan[t.d][t.mi].foods.push(deepClone(f));});
        }
        save();
        didDrop=true;
      }
    }
    // κατάπιε το click που ακολουθεί (να μη «ενεργοποιήσει» το κελί-στόχο)
    var swallow=function(ev){ev.stopPropagation();ev.preventDefault();};
    document.addEventListener('click',swallow,true);
    setTimeout(function(){document.removeEventListener('click',swallow,true);},0);
  }
  _cleanupMealDrag();
  if(didDrop)renderWeekTable();
}
function _cancelMealDrag(){_cleanupMealDrag();}
function _cleanupMealDrag(){
  document.removeEventListener('pointermove',_onMealDragMove,{capture:true,passive:false});
  document.removeEventListener('pointerup',_onMealDragUp,true);
  document.removeEventListener('pointercancel',_cancelMealDrag,true);
  document.removeEventListener('keydown',_onMealDragKey,true);
  var prev=document.querySelector('#week-con .day-cell.meal-drag-over');
  if(prev)prev.classList.remove('meal-drag-over');
  if(_mealDrag&&_mealDrag.ghost)_mealDrag.ghost.remove();
  document.body.style.userSelect='';
  document.body.style.cursor='';
  _mealDrag=null;
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
  var weekMN={Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0,VitD:0};
  Object.keys(daysMN).forEach(function(d){
    var dmn=daysMN[d];
    ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA','VitD'].forEach(function(key){
      weekMN[key]+=dmn[key];
    });
  });
  ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA','VitD'].forEach(function(key){
    weekMN[key]=Math.round(weekMN[key]/7);
  });

  var adequacy=checkMicronutrientAdequacy(weekMN,targets,useAthletic);
  var criticalCount=0,lowCount=0;
  Object.keys(adequacy).forEach(function(key){
    if(adequacy[key].status==='critical')criticalCount++;
    else if(adequacy[key].status==='low')lowCount++;
  });

  // ════ ENHANCED: DETAILED TABLE WITH ALL MICRONUTRIENTS ════
  var html='<div style="background:var(--card-bg);border-radius:8px;padding:0;margin-top:8px;font-size:11px;border:1px solid var(--border-light)">';

  // Header summary
  html+='<div style="background:var(--panel-bg);padding:12px;border-bottom:1px solid #ddd;">';
  html+='<div style="font-weight:700;color:var(--text-strong);margin-bottom:8px;font-size:12px;">📊 Ανάλυση Μικροθρεπτικών (Ημερήσιος Μέσος Όρος 7 Ημερών)</div>';

  if(criticalCount>0||lowCount>0){
    html+='<div style="background:#fff3e0;border-left:3px solid #ff9800;padding:8px;border-radius:3px;color:#e65100;font-size:10px;">'
      +'<b>⚠️ '+criticalCount+' κρίσιμα</b>, <b>'+lowCount+' χαμηλά</b> — Χρειάζεται προσοχή'
      +'</div>';
  } else {
    html+='<div style="background:#e8f5e9;border-left:3px solid #4caf50;padding:8px;border-radius:3px;color:var(--good);font-size:10px;">'
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
  var sortedKeys=['Fe','Zn','Mg','Ca','VitD','B12','B1','B2','B3','B6','Folate','Omega3','Omega6','Iodine','Choline','DHA'];
  var rows=[];

  sortedKeys.forEach(function(key){
    var adq=adequacy[key];
    var tgt=targets[MICRONUTRIENT_KEY_MAP[key]]||{};
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
    html+='<td style="padding:8px 10px;text-align:center;"><strong style="font-size:12px;'+(row.pct>=90?'color:var(--good);':row.pct>=65?'color:#e65100;':'color:#d32f2f;')+'">'+row.pct+'%</strong></td>';
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
  html+='<div style="background:var(--panel-bg);padding:10px;border-top:1px solid #ddd;border-radius:0 0 8px 8px;font-size:9px;color:#666;line-height:1.5;">';
  html+='<strong>📌 Σημειώσεις:</strong> Τα ποσοστά βασίζονται σε '+(useAthletic?'<strong>αθλητικούς</strong>':'<strong>κανονικούς</strong>')+' στόχους. Για ελλείψεις <strong>≥25%</strong>, εξετάστε τα συμπληρώματα στην ενότητα 💊 <strong>Προτάσεις</strong>.';
  html+='</div>';

  return html;
}

/* ---- Saved Combos ----
   Shared across ALL clients, stored under its own localStorage key ('savedCombos') via
   safeStorageGet/safeStorageSet — same pattern as getFavoriteMeals/saveFavoriteMeals below.
   This used to live per-client (c.savedCombos). An earlier version tried a shared key but
   wrote it through the per-client save() path, so each client's save() overwrote the shared
   key with just its own list and clobbered whatever another client had saved — that's how a
   real client's combo list got wiped. Storing it independently of any client's save() avoids
   that: it's read/written directly, never touched by per-client save(). Diet-type mixing
   across clients is guarded by comboDietOK()/comboHasExcludedFood() below, applied at every
   read site (plan generation via findSavedComboMatch, meal-alternative suggestions, the
   food-library sidebar, and drag-and-drop insertion) — a combo tagged for one client's diet
   or saved while another client's food was excluded must never surface for an incompatible
   client. */

// In-memory cache of the shared list, so the many getSavedCombos() call sites (plan
// generation, meal alternatives, food-library render, drag-and-drop, save/delete) don't each
// re-read+JSON.parse localStorage. null means "not loaded from storage yet" (distinct from a
// loaded-but-empty list). Anything that writes 'savedCombos' to storage from outside
// setSavedCombos() (currently just Cloud.load(), in Dietologist.html) must also null this out
// or the cache will keep serving stale data after that write.
var _savedCombosCache = null;

// Diet-type compatibility check shared by every saved-combo consumer. A restrictive client
// diet only accepts same-diet combos; 'normal'/no dietType accepts anything.
function comboDietOK(clientDietType, comboDietType){
  if(!clientDietType || clientDietType==='normal') return true;
  return comboDietType===clientDietType;
}
// Allergen/exclusion check shared by every saved-combo consumer.
function comboHasExcludedFood(foods, exclLower){
  if(!exclLower || !exclLower.length || !foods) return false;
  return foods.some(function(food){
    var nameLower=(food.n||'').toLowerCase();
    return exclLower.some(function(excluded){ return excluded && nameLower.indexOf(excluded)!==-1; });
  });
}
// Merge two saved-combo lists, deduping by id (id-less entries can't be matched against
// existing ones, so they're always kept). Shared by the legacy migration below and by
// importBackup()'s "merge" path (js/app-part4.js).
function mergeSavedComboLists(base, incoming){
  var merged=(base||[]).slice();
  var seenIds={};
  merged.forEach(function(x){ if(x && x.id) seenIds[x.id]=true; });
  (incoming||[]).forEach(function(combo){
    if(combo && (!combo.id || !seenIds[combo.id])){
      if(combo.id) seenIds[combo.id]=true;
      merged.push(combo);
    }
  });
  return merged;
}

// Pull any combos still sitting on old per-client c.savedCombos (from before this became a
// shared list) into the shared 'savedCombos' key, then strip the now-unread field off each
// client so it doesn't linger as dead data.
//
// Deliberately NOT gated by a persistent "already migrated" flag: `clients` can still be a
// stale/partial local cache the first few times this runs (e.g. Cloud.load() hasn't resolved
// yet, or an old snapshot got restored later via restoreFromSnapshot()) — a flag set on that
// first, incomplete pass would permanently strand any legacy combos that show up afterwards.
// Instead we just check current `clients` state on every call; the check is a cheap in-memory
// scan, and it naturally becomes a no-op once every client's c.savedCombos has been cleared.
function migrateLegacyPerClientCombos(){
  var clientsArr = (typeof clients!=='undefined' ? clients : []);
  var hasLegacy = clientsArr.some(function(c){ return c && Array.isArray(c.savedCombos) && c.savedCombos.length; });
  if(!hasLegacy) return;
  var merged=safeStorageGet('savedCombos', []) || [];
  clientsArr.forEach(function(c){
    if(c && Array.isArray(c.savedCombos) && c.savedCombos.length){
      merged=mergeSavedComboLists(merged, c.savedCombos);
      delete c.savedCombos;
    }
  });
  safeStorageSet('savedCombos', merged);
  _savedCombosCache = merged;
  try{ save(); }catch(e){}
}

function getSavedCombos(){
  migrateLegacyPerClientCombos();
  if(_savedCombosCache===null) _savedCombosCache=safeStorageGet('savedCombos', []);
  return _savedCombosCache;
}

function setSavedCombos(arr){
  _savedCombosCache=arr;
  safeStorageSet('savedCombos', arr);
  // Bypasses the per-client save()/_doSave() path on purpose (that's what clobbered this
  // data before — see the doc comment above), so it has to poke Cloud sync directly instead
  // of getting it for free the way client-data saves do.
  if(window.Cloud) try{ window.Cloud.save(); }catch(e){}
}

/* ---- Tips Library (tab «📚 Tips», js/app-part7-tips.js) ----
   Ίδιο μοτίβο με τα Saved Combos ακριβώς από πάνω: μία κοινή λίστα για όλους τους πελάτες,
   δικό της localStorage key ('tipsLibrary'), cache + get/set helpers, sync μέσω Cloud.save()
   (Dietologist.html _pushNow/load/forceReloadFromCloud). Μπαίνει στο SNAP μέσω _buildSnapshot
   (tips:) και εμφανίζεται στο client portal (plan.html tipsCard()) αντί για το παλιό στατικό FAQ. */
var _tipsLibraryCache = null;

// Seed: οι 6 ερωτήσεις/απαντήσεις που ήταν hardcoded στο plan.html (faqQ1..6/faqA1..6) πριν
// γίνει επεξεργάσιμη βιβλιοθήκη — ίδιο ελληνικό/EN/RU/TR κείμενο, καμία απώλεια περιεχομένου.
// Χρησιμοποιείται ΜΟΝΟ σαν default του safeStorageGet, άρα μόνο την πρώτη φορά (πριν ο
// διαιτολόγος αποθηκεύσει έστω και μία φορά το δικό του 'tipsLibrary', έστω άδειο).
function defaultTipsSeed(){
  return [
    {id:'seed1', icon:'🍽️', category:'Πλάνο & Καθημερινότητα',
      title:'Πεινάω ανάμεσα στα γεύματα',
      body:'Φυσιολογικό στην αρχή. Πιες πρώτα ένα ποτήρι νερό — συχνά η δίψα μοιάζει με πείνα. Αν επιμένει, έχεις ελεύθερο ένα ωμό λαχανικό (αγγούρι, καρότο, ντομάτα) όποια ώρα θες, χωρίς όριο.',
      titleEn:'I feel hungry between meals',
      bodyEn:'Normal at first. Drink a glass of water first — thirst often feels like hunger. If it persists, you have a raw vegetable (cucumber, carrot, tomato) freely, any time, no limit.',
      titleRu:'Я хочу есть между приёмами пищи',
      bodyRu:'Это нормально вначале. Сначала выпейте стакан воды — часто жажда похожа на голод. Если чувство не проходит, у вас есть свободный доступ к сырым овощам (огурец, морковь, помидор) в любое время, без ограничений.',
      titleTr:'Öğünler arasında acıkıyorum',
      bodyTr:'Başlangıçta normal. Önce bir bardak su iç — susuzluk çoğu zaman açlık gibi hissettirir. Devam ederse, istediğin zaman sınırsız çiğ sebze (salatalık, havuç, domates) tüketebilirsin.'},
    {id:'seed2', icon:'⚖️', category:'Πλάνο & Καθημερινότητα',
      title:'Ξέφυγα από το πλάνο — τι κάνω;',
      body:'Καμία τραγωδία. Δεν παραλείπεις το επόμενο γεύμα για να «αναπληρώσεις» — απλά συνεχίζεις κανονικά. Αν συμβαίνει συχνά, πες μου το από το Πρόοδος ή γράψε μου, θα προσαρμόσουμε το πλάνο μαζί.',
      titleEn:'I strayed from the plan — what now?',
      bodyEn:'No drama. Don\'t skip the next meal to "make up for it" — just carry on normally. If it keeps happening, tell me from Progress or send a message, and we\'ll adjust the plan together.',
      titleRu:'Я отступил(а) от плана — что делать?',
      bodyRu:'Ничего страшного. Не пропускайте следующий приём пищи, чтобы «компенсировать» — просто продолжайте как обычно. Если это повторяется часто, сообщите мне в разделе «Прогресс» или напишите — вместе скорректируем план.',
      titleTr:'Plandan saptım — ne yapmalıyım?',
      bodyTr:'Sorun değil. "Telafi etmek" için bir sonraki öğünü atlama — sadece normal şekilde devam et. Sık oluyorsa İlerleme sekmesinden söyle veya bana yaz, planı birlikte ayarlayalım.'},
    {id:'seed3', icon:'🥄', category:'Πλάνο & Καθημερινότητα',
      title:'Πώς ζυγίζω τις τροφές;',
      body:'Όλα τα γραμμάρια στο πλάνο είναι ωμό βάρος — ζύγισε πριν το μαγείρεμα, εκτός αν δίπλα στην τροφή αναγράφεται διαφορετικά (π.χ. «μαγειρεμένο»).',
      titleEn:'How do I weigh foods?',
      bodyEn:'All grams in the plan are raw weight — weigh before cooking, unless the food says otherwise (e.g. "cooked").',
      titleRu:'Как взвешивать продукты?',
      bodyRu:'Все граммы в плане указаны в сыром весе — взвешивайте перед готовкой, если рядом с продуктом не указано иное (например, «варёное»).',
      titleTr:'Yiyecekleri nasıl tartmalıyım?',
      bodyTr:'Plandaki tüm gramajlar çiğ ağırlıktır — yanında farklı belirtilmedikçe (örn. "pişmiş") pişirmeden önce tart.'},
    {id:'seed4', icon:'⏰', category:'Πλάνο & Καθημερινότητα',
      title:'Πόσο αυστηρές είναι οι ώρες γευμάτων;',
      body:'Οδηγός είναι, όχι νόμος — ±60 λεπτά δεν αλλάζει τίποτα. Αυτό που μετράει είναι η σειρά και το περιεχόμενο κάθε γεύματος, όχι το ρολόι.',
      titleEn:'How strict are the meal times?',
      bodyEn:'They\'re a guide, not a rule — ±60 minutes changes nothing. What matters is the order and content of each meal, not the clock.',
      titleRu:'Насколько строго нужно соблюдать время приёмов пищи?',
      bodyRu:'Это ориентир, а не правило — ±60 минут ничего не меняют. Важен порядок и содержание каждого приёма пищи, а не часы.',
      titleTr:'Öğün saatleri ne kadar katı?',
      bodyTr:'Bir rehberdir, kural değil — ±60 dakika hiçbir şeyi değiştirmez. Önemli olan saatler değil, her öğünün sırası ve içeriğidir.'},
    {id:'seed5', icon:'☕', category:'Πλάνο & Καθημερινότητα',
      title:'Καφές, τσάι, αλκοόλ — επιτρέπονται;',
      body:'Καφές και τσάι χωρίς ζάχαρη: ελεύθερα, όποια ώρα θες. Αλκοόλ: 1-2 φορές/εβδομάδα με μέτρο, όχι σε ημέρα προπόνησης ή αγώνα.',
      titleEn:'Coffee, tea, alcohol — allowed?',
      bodyEn:'Coffee and tea without sugar: freely, any time. Alcohol: 1-2 times/week in moderation, not on training or match days.',
      titleRu:'Кофе, чай, алкоголь — можно?',
      bodyRu:'Кофе и чай без сахара — свободно, в любое время. Алкоголь: 1-2 раза в неделю в меру, не в день тренировки или матча.',
      titleTr:'Kahve, çay, alkol — izinli mi?',
      bodyTr:'Şekersiz kahve ve çay: istediğin zaman serbest. Alkol: haftada 1-2 kez ölçülü, antrenman veya maç günü hariç.'},
    {id:'seed6', icon:'✈️', category:'Πλάνο & Καθημερινότητα',
      title:'Πάω έξω ή ταξίδι — τι επιλέγω;',
      body:'Διάλεξε ψητό ή βραστό κρέας/ψάρι, σαλάτα, και μία μερίδα αμύλου (ρύζι, πατάτα, ψωμί) — σαν να έφτιαχνες μόνη σου το πιάτο του πλάνου. Απόφυγε τηγανητά και επιδόρπια όποτε γίνεται.',
      titleEn:'Eating out or traveling — what do I pick?',
      bodyEn:'Choose grilled or boiled meat/fish, a salad, and one portion of starch (rice, potato, bread) — as if building your own plate from the plan. Avoid fried food and desserts when you can.',
      titleRu:'Иду в гости или путешествую — что выбрать?',
      bodyRu:'Выбирайте запечённое или отварное мясо/рыбу, салат и одну порцию углеводов (рис, картофель, хлеб) — как если бы вы сами составляли тарелку по плану. По возможности избегайте жареного и десертов.',
      titleTr:'Dışarıda yiyorum veya seyahatteyim — ne seçmeliyim?',
      bodyTr:'Izgara veya haşlanmış et/balık, salata ve bir porsiyon nişasta (pilav, patates, ekmek) seç — sanki plandaki tabağı kendin hazırlıyormuş gibi. Mümkün olduğunca kızartma ve tatlıdan kaçın.'}
  ];
}

function getTipsLibrary(){
  if(_tipsLibraryCache===null) _tipsLibraryCache=safeStorageGet('tipsLibrary', defaultTipsSeed());
  return _tipsLibraryCache;
}

function setTipsLibrary(arr){
  _tipsLibraryCache=arr;
  safeStorageSet('tipsLibrary', arr);
  if(window.Cloud) try{ window.Cloud.save(); }catch(e){}
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

  var html='<div style="background:var(--card-bg);border-radius:10px;padding:15px;max-width:500px">';
  html+='<h3 style="color:#025857;margin-top:0;margin-bottom:15px">⭐ Αγαπημένα Γεύματα</h3>';

  favs.forEach(function(fav,idx){
    var foodList=fav.foods.map(function(f){return f.n+' ('+f.g+'g)';}).join(', ');
    html+='<div style="background:var(--panel-bg);padding:10px;border-radius:6px;margin-bottom:10px">'
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
  modal.innerHTML='<div style="background:var(--card-bg);border-radius:10px;padding:20px;max-width:600px;max-height:80vh;overflow-y:auto">'+html+'<button onclick="this.closest(\'div\').parentElement.remove()" style="width:100%;margin-top:15px;padding:8px;background:#999;color:#fff;border:none;border-radius:5px;cursor:pointer">Κλείσιμο</button></div>';
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
  var report='<div style="background:var(--card-bg);border-radius:10px;padding:15px;max-width:500px">';
  report+='<h3 style="color:#025857;margin-top:0">⚖️ Ανάλυση Μακροθρεπτικών</h3>';

  report+='<div style="background:var(--panel-bg);padding:12px;border-radius:6px;margin-bottom:15px">';
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
  modal.innerHTML='<div style="background:var(--card-bg);border-radius:10px;padding:20px;max-width:550px;max-height:80vh;overflow-y:auto">'+report+'<button onclick="this.closest(\'div\').parentElement.remove()" style="width:100%;margin-top:15px;padding:8px;background:#999;color:#fff;border:none;border-radius:5px;cursor:pointer">Κλείσιμο</button></div>';
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
    var libC=getC();
    var libExclLower=((libC&&libC.foodExclude)||[]).map(function(x){return (x||'').toLowerCase();}).filter(Boolean);
    var combos=getSavedCombos().filter(function(combo){
      return comboDietOK(libC&&libC.dietType, combo.dietType) && !comboHasExcludedFood(combo.foods, libExclLower);
    });
    comboHtml='<div class="combo-section">'
      +'<div class="combo-sec-title">📋 Αποθηκευμένοι Συνδυασμοί</div>';
    if(!combos.length){
      comboHtml+='<div style="font-size:10px;color:var(--text-muted);padding:2px 4px 4px">Κανένας ακόμα — πάτα 💾 σε γεύμα</div>';
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
  if(!Object.keys(cats).length){el.innerHTML=comboHtml+'<div style="color:var(--text-muted);font-size:11px;padding:6px">Δεν βρέθηκε</div>';return;}
  var html=comboHtml;
  Object.keys(cats).sort().forEach(function(cat){
    html+='<div class="lib-cat">'+cat+'</div>';
    cats[cat].forEach(function(n){
      var hasIng=(FOODS[n].ingredients||(typeof FYH_RECIPE_EXPAND!=='undefined'&&FYH_RECIPE_EXPAND[n]))?'<button class="lib-recipe-btn" onclick="showRecipeModal(\''+n.replace(/'/g,"\\'")+'\')" title="Δείτε τα συστατικά">📖</button>':'';
      html+='<div class="lib-item" draggable="true" data-food="'+n+'"><span>'+n+'</span>'+hasIng+'<span class="lib-kcal">'+FOODS[n].k+'</span></div>';
    });
  });
  el.innerHTML=html;
  refreshActiveMealIndicator();
  // Drag: saved combos
  el.querySelectorAll('.combo-item').forEach(function(item){
    item.addEventListener('dragstart',function(e){
      e.dataTransfer.setData('text/plain','combo:'+item.dataset.combo);
      e.dataTransfer.effectAllowed='copy';
      setTimeout(function(){item.classList.add('dragging');},0);
    });
    item.addEventListener('dragend',function(){item.classList.remove('dragging');});
    // ✅ Click-to-add: πάτημα σε συνδυασμό τον προσθέτει στο ενεργό γεύμα (βλ. setActiveMealTarget)
    item.addEventListener('click',function(e){
      if(e.target.closest('.combo-del'))return;
      addLibItemToActiveTarget('combo:'+item.dataset.combo);
    });
  });
  // Drag: foods
  el.querySelectorAll('.lib-item').forEach(function(item){
    item.addEventListener('dragstart',function(e){
      e.dataTransfer.setData('text/plain',item.dataset.food);
      e.dataTransfer.effectAllowed='copy';
      setTimeout(function(){item.classList.add('dragging');},0);
    });
    item.addEventListener('dragend',function(){item.classList.remove('dragging');});
    // ✅ Click-to-add: πάτημα σε τρόφιμο το προσθέτει στο ενεργό γεύμα (βλ. setActiveMealTarget) —
    // εναλλακτικό στο drag, χρήσιμο όταν στόχος/βιβλιοθήκη δεν χωράνε ταυτόχρονα στην οθόνη.
    item.addEventListener('click',function(e){
      if(e.target.closest('.lib-recipe-btn'))return;
      addLibItemToActiveTarget(item.dataset.food);
    });
  });
}
function filterLib(inp){renderFoodLib(inp.value);}


// js/plan-gen/meal-library.js
// The 'chef-inspired meal generation' matching layer, extracted verbatim from
// js/app-part3.js (module split wave 12): classifyMealSlot / mealSignature /
// harvestMealLibrary(excludeClientId) / harvestOwnHistory(c) / findMealAlternates /
// findSavedComboMatch(...). Pure fn declarations, no load-time code. Reads the
// global clients roster at call time; findMealAlternates/findSavedComboMatch call
// comboDietOK/comboHasExcludedFood which are defined later in app-part3.js but only
// referenced inside these fn bodies (resolved at runtime). classifyMealSlot is also
// used (typeof-guarded) by app-part2.js and by tracking/tracking.js. Loads right
// before app-part3.js, after food-distribution.js.

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
  // Templates saved before 2026-07-29 have no dietType field — default to 'normal' like
  // unset-dietType clients above, so restrictive-diet clients (vegan/keto/…) correctly skip them.
  if(typeof customTemplates!=='undefined' && customTemplates && customTemplates.length){
    customTemplates.forEach(function(ct){
      if(!ct || !ct.days) return;
      harvestDays(ct.days, 'tmpl_'+ct.id, ct.dietType||'normal', ct.name);
    });
  }
  return lib;
}

// ── OWN-HISTORY REUSE (Priority -1, tried before the cross-client taste library) ───────────
// Pulls candidate meals from THIS client's own c.savedPlans instead of only ever starting
// from other clients' meals. A saved plan's meals are only offered as candidates if the
// client's portal check-ins (window.Cloud.checkinsFor) show they were reasonably followed
// during that plan's period (>=60% meals completed) — a plan the client didn't actually
// stick to shouldn't get reinforced. Clients with no check-in data (never used the portal)
// still have their saved-plan meals considered: missing data isn't treated as a bad signal,
// only an explicit low completion ratio is. Looks only at the last 3 saved plans so a diet
// from long before the current goal/dietType doesn't keep resurfacing.
function harvestOwnHistory(c){
  var lib=[];
  var seen={};
  if(!c || !c.savedPlans || !c.savedPlans.length) return lib;

  var checkins=(window.Cloud && typeof window.Cloud.checkinsFor==='function') ? window.Cloud.checkinsFor(c) : [];
  var sortedPlans=c.savedPlans.slice().sort(function(a,b){ return (a.date||'').localeCompare(b.date||''); });
  var recentPlans=sortedPlans.slice(-3).reverse(); // most recent first

  recentPlans.forEach(function(plan, idx){
    if(!plan.weekPlan) return;
    var periodStart=plan.date||'';
    var periodEnd=(idx===0) ? '9999-12-31' : (recentPlans[idx-1].date||'9999-12-31'); // exclusive upper bound = next (newer) plan's date
    var periodCheckins=checkins.filter(function(ci){ return ci.date>=periodStart && ci.date<periodEnd; });
    if(periodCheckins.length){
      var totalDone=0, totalTarget=0;
      periodCheckins.forEach(function(ci){ totalDone+=(ci.meals_done||0); totalTarget+=(ci.meals_total||0); });
      if(totalTarget>0 && (totalDone/totalTarget)<0.6) return; // poorly-followed plan — skip its meals
    }
    for(var d=0;d<7;d++){
      var day=plan.weekPlan[d];
      if(!day || !day.length) continue;
      day.forEach(function(meal){
        if(!meal || !meal.foods || !meal.foods.length) return;
        var sig=mealSignature(meal.foods);
        if(!sig || seen[sig]) return;
        var kcal=calculateMealKcal(meal.foods);
        if(kcal<50) return;
        seen[sig]=true;
        lib.push({
          id:'own_'+plan.id+'_'+sig.length+'_'+Math.round(kcal),
          name:meal.name||'',
          foods:deepClone(meal.foods),
          kcal:Math.round(kcal),
          mealTiming:meal.mealTiming||'regular',
          slot:classifyMealSlot(meal.name),
          dietType:plan.dietType||c.dietType||'normal',
          tags:['own-history'],
          source:'own-history'
        });
      });
    }
  });
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
  var exclLower = (excl||[]).map(function(x){return (x||'').toLowerCase();}).filter(Boolean);
  var seen={};
  var cands = lib.filter(function(x){
    if(!x.foods || !x.foods.length) return false;
    var sig = mealSignature(x.foods);
    if(sig===mySig || seen[sig]) return false;
    if(x.slot!=='other' && slot!=='other' && x.slot!==slot) return false;
    if(!comboDietOK(dietType,x.dietType)) return false;
    if(comboHasExcludedFood(x.foods,exclLower)) return false;
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
function findSavedComboMatch(savedCombos, targetKcal, targetMacros, tolerance, excl, slot, dietType, usedSigs, dislikedIds) {
  if(!savedCombos || savedCombos.length === 0) return null;
  tolerance = tolerance || 50; // base ±kcal tolerance
  // Proportional band: meals get scaled afterward, so accept a generous range
  var band = Math.max(tolerance, Math.round((targetKcal||0)*0.30));

  // Normalize exclusion list
  excl = excl || [];
  var exclLower = excl.map(function(x){return (x||'').toLowerCase();});

  // ✅ Ένα ολόκληρο πιάτο κρέατος/ψαριού δεν είναι λογικό "Ενδιάμεσο" — χωρίς αυτό, ένα πραγματικό
  // γεύμα κρέατος/ψαριού αποθηκευμένο ως snack από έναν bodybuilding_clean πελάτη (⭐ taste library ή
  // saved combo) θα μπορούσε να καταλήξει σε ΟΠΟΙΟΥΔΗΠΟΤΕ άλλου diet type το πλάνο, αφού dietOK()
  // δέχεται οποιαδήποτε πηγή για target 'normal'/χωρίς dietType.
  function isMeatOrFishSnack(foods){
    return foods.some(function(food){
      var fd = FOODS[food.n] || FOODS[resolveFood(food.n)];
      return fd && (fd.cat==='Κρέας' || fd.cat==='Ψάρια');
    });
  }

  var best=null, bestScore=Infinity, bestSig=null;
  for(var i = 0; i < savedCombos.length; i++) {
    var combo = savedCombos[i];
    if(!combo || !combo.foods || !combo.foods.length) continue;
    var comboKcal = combo.kcal || 0;
    if(Math.abs(comboKcal - targetKcal) > band) continue;
    // Slot filter: skip only when both slots are known and differ
    if(slot && combo.slot && combo.slot!=='other' && combo.slot!==slot) continue;
    if(!comboDietOK(dietType,combo.dietType)) continue;
    if(slot==='snack' && dietType!=='bodybuilding_clean' && isMeatOrFishSnack(combo.foods)) continue;
    if(comboHasExcludedFood(combo.foods,exclLower)) continue;
    // Score: closeness to target, nudged by real-world trust (same idea as findBestRecipe's
    // recipeScore — proven meals get a small edge), then a strong penalty for meals already used this week.
    var sig=mealSignature(combo.foods);
    // ✅ Skip a combo this specific client already 👎'd (js/app-part4.js rateMeal) — soft preference,
    // not a hard exclusion, so no "never leave zero candidates" fallback needed: genPlan()'s own
    // multi-tier priority chain already handles this function returning null gracefully.
    if(dislikedIds && dislikedIds.indexOf(sig)!==-1) continue;
    var usedCount=(usedSigs && usedSigs[sig])?usedSigs[sig]:0;
    var trustBonus=getRecipeTrustScore(sig)*targetKcal*0.08;
    // ✅ MACRO-FIT PENALTY: candidates get portion-scaled to hit targetKcal afterward, but scaling
    // can't fix a wrong protein/fat RATIO (confirmed live: an avocado+salmon combo scaled down to
    // the right calories still delivered ~28g fat against a 12.5g target). Compare fat% and protein%
    // of calories — saved combos already store p/f/c (saveCombo()); taste-library meals don't, so
    // compute them from foods on the fly (cheap — meals are 2-6 items).
    var macroPenalty=0;
    if(targetMacros && targetMacros.f!=null && targetMacros.p!=null && comboKcal>0 && targetKcal>0){
      var comboP=combo.p, comboF=combo.f;
      if(comboP==null || comboF==null){
        var mm={p:0,f:0};
        combo.foods.forEach(function(fo){var v=cm(fo.n,fo.g);mm.p+=v.p;mm.f+=v.f;});
        comboP=mm.p; comboF=mm.f;
      }
      var targetFatPct=(targetMacros.f*9)/targetKcal;
      var targetProtPct=(targetMacros.p*4)/targetKcal;
      var comboFatPct=(comboF*9)/comboKcal;
      var comboProtPct=(comboP*4)/comboKcal;
      var macroDeviation=Math.abs(comboFatPct-targetFatPct)+Math.abs(comboProtPct-targetProtPct);
      macroPenalty=macroDeviation*targetKcal*0.5;
    }
    var score=Math.abs(comboKcal-targetKcal) - trustBonus + usedCount*100000 + macroPenalty;
    if(score<bestScore){bestScore=score;best=combo;bestSig=sig;}
  }
  if(!best) return null;
  if(usedSigs && bestSig!=null){usedSigs[bestSig]=(usedSigs[bestSig]||0)+1;}
  return {foods: best.foods, mealTiming: best.mealTiming || 'regular', sig: bestSig};
}


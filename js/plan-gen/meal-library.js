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
// Until 2026-09-28 alternates came ONLY from the taste library (⭐ template clients + saved custom
// templates) of the exact same dietType — so a vegetarian client with no vegetarian template
// clients got 0-2 alternates, while ~140 built-in vegetarian template meals and 30 tagged recipes
// sat unused. The pool now pools 5 sources, filtered ONCE per client (buildAlternatesPool), then
// per meal pickMealAlternates() picks 3 of the right slot with DIFFERENT main protein sources.

// Main protein source of a meal = the food contributing the most protein, bucketed. Composite
// dishes ('Συνταγές…') fall back to their first containsCats entry.
function mealProteinGroup(foods){
  var best=null, bestP=-1;
  (foods||[]).forEach(function(f){
    var v=cm(f.n,f.g); if(v.p>bestP){bestP=v.p;best=f.n;}
  });
  var fd=best&&FOODS[best]; if(!fd)return 'other';
  var cat=fd.cat;
  if((cat==='Συνταγές'||cat==='Συνταγές FYH')&&fd.containsCats&&fd.containsCats.length)cat=fd.containsCats[0];
  if(cat==='Κρέας')return 'meat';
  if(cat==='Ψάρια')return 'fish';
  if(cat==='Όσπρια')return 'legume';
  if(cat==='Αυγά/Γαλακτ.'||cat==='Γαλακτοκομικά')return /αυγ|ασπραδ/.test(normalizeGreekText(best))?'egg':'dairy';
  if(fd.plantBased)return 'plant';
  return 'other';
}

// Built-in TMPLS keys that fit a diet type (keto templates are historically 'ketogenic_*', same
// mapping genPlan uses). Plain diets draw from the generic goal/kcal/mediterranean templates.
function _altTemplateKeys(dietType){
  if(typeof TMPLS==='undefined')return [];
  var keys=Object.keys(TMPLS);
  if(!dietType||dietType==='normal'||dietType==='bodybuilding_clean'){
    return keys.filter(function(k){ return ['loss','mild','maintain','gain','mediterranean'].indexOf(k)!==-1 || /^kcal\d+$/.test(k); });
  }
  var prefix=({keto:'ketogenic'})[dietType]||dietType;
  return keys.filter(function(k){ return k===dietType || k===prefix || k.indexOf(prefix+'_')===0; });
}

// Recipe mealTimes category → slot. Untagged MAIN recipes count as lunch/dinner only (a salmon-rice
// dish is a fine lunch swap, not a breakfast one); SNACK_RECIPES are always snacks.
var _ALT_MT_SLOT={'Πρωινά':'breakfast','Ενδιάμεσα':'snack','Μεσημεριανά':'lunch','Βραδινά':'dinner'};
function _altRecipeSlots(r, isSnackDB){
  if(isSnackDB)return ['snack'];
  var mt=(typeof getRecipeMealTimes==='function')?getRecipeMealTimes(r):(r.mealTimes||[]);
  var s=(mt||[]).map(function(x){return _ALT_MT_SLOT[x];}).filter(Boolean);
  if(s.length)return s;
  // Untagged but obviously a breakfast dish (e.g. "Oatmeal με Protein Powder", "Protein Pancakes")
  var txt=normalizeGreekText((r.name||'')+' '+(r.foods||[]).map(function(f){return f.n;}).join(' '));
  if(/βρωμη|pancake|oatmeal|γκρανολα|granola|δημητριακα πρωινου|πρωιν/.test(txt))return ['breakfast'];
  return ['lunch','dinner'];
}

// One-time, per-client candidate pool. `excl` = the client's FULL exclusion list
// (buildEffectiveExclusionList). Each entry: {foods,kcal,sig,slots,group,src,trust}.
function buildAlternatesPool(c, excl){
  var dt=(c&&c.dietType)||'normal';
  var exclLower=(excl||[]).map(function(x){return (x||'').toLowerCase();}).filter(Boolean);
  var disliked=(c&&c.dislikedRecipeIds)||[];
  var pool=[], seen={};
  function add(foods, slots, src, id){
    if(!foods||!foods.length)return;
    var sig=mealSignature(foods);
    if(!sig||seen[sig])return;
    if(disliked.indexOf(sig)!==-1||(id&&disliked.indexOf(id)!==-1))return;   // 👎 by this client
    if(comboHasExcludedFood(foods,exclLower))return;
    var kcal=calculateMealKcal(foods);
    if(kcal<50)return;
    seen[sig]=true;
    pool.push({foods:foods, kcal:kcal, sig:sig, slots:slots, src:src,
      group:mealProteinGroup(foods),
      trust:(typeof getRecipeTrustScore==='function')?getRecipeTrustScore(id||sig):0.5});
  }
  function slotOf(name){ var s=classifyMealSlot(name); return s==='other'?['breakfast','snack','lunch','dinner']:[s]; }

  // 1. This client's own well-followed past meals (harvestOwnHistory's ≥60%-completed rule) —
  //    added FIRST so a meal they already know wins the dedup + gets the 'own' ranking bonus.
  if(c) harvestOwnHistory(c).forEach(function(x){ if(comboDietOK(dt,x.dietType)) add(x.foods, slotOf(x.name), 'own', x.id); });
  // 2. ⭐ template clients + saved custom templates (the previous, only, source)
  harvestMealLibrary(c&&c.id).forEach(function(x){ if(comboDietOK(dt,x.dietType)) add(x.foods, slotOf(x.name), 'library', x.id); });
  // 3. Saved combos (shared list)
  if(typeof getSavedCombos==='function') (getSavedCombos()||[]).forEach(function(x){
    if(!x||!comboDietOK(dt,x.dietType))return;
    add(x.foods, (x.slot&&x.slot!=='other')?[x.slot]:slotOf(x.name||''), 'combo', x.id);
  });
  // 4. Built-in templates of this diet type
  _altTemplateKeys(dt).forEach(function(k){
    (TMPLS[k]||[]).forEach(function(day){ (day||[]).forEach(function(m){ if(m) add(m.foods, slotOf(m.name), 'template', null); }); });
  });
  // 5. Recipe library (static + the dietitian's custom recipes), same diet-tag rules as findBestRecipe
  var tags=RECIPE_DIET_TAGS[dt]||(dt==='mediterranean'?['Mediterranean','Ελληνικό']:null);   // null = any
  var hiddenIds=(typeof hiddenRecipeIdMap==='function')?hiddenRecipeIdMap():{};   // 🙈 κρυμμένες συνταγές
  function recipeOK(r, isSnackDB){
    if(!r||!r.foods||hiddenIds[r.id])return false;
    var rt=r.tags||[];
    if(dt==='keto'){ if(!(rt.indexOf('Keto')!==-1||rt.indexOf('LowCarb')!==-1||(r.macro&&r.macro.c<=10)))return false; }
    else if(!isSnackDB && tags && dt!=='normal' && !tags.some(function(t){return rt.indexOf(t)!==-1;}))return false;
    return true;
  }
  (typeof MEAL_RECIPES!=='undefined'?MEAL_RECIPES:[]).forEach(function(r){ if(recipeOK(r,false)) add(r.foods,_altRecipeSlots(r,false),'recipe',r.id); });
  (typeof SNACK_RECIPES!=='undefined'?SNACK_RECIPES:[]).forEach(function(r){ if(recipeOK(r,true)) add(r.foods,['snack'],'recipe',r.id); });
  ((typeof customRecipesForGeneration==='function')?customRecipesForGeneration():[]).forEach(function(r){ if(recipeOK(r,false)) add(r.foods,_altRecipeSlots(r,false),'recipe',r.id); });
  return pool;
}

// Pick up to `count` alternates for one meal from a pool built above. `isBlocked(foods)` = extra
// per-day veto (diet-type forbidden categories honouring that day's exceptions); defaults to the
// plain diet-type rule. Ranking: calorie closeness, −bonus for the client's own proven meals and
// for trusted (👍 / rarely-regenerated) meals; then greedy pick so each alternate has a DIFFERENT
// main protein (e.g. όσπρια / αυγό / γαλακτοκομικό) instead of 3 variants of one dish.
function pickMealAlternates(pool, meal, c, targetKcal, count, isBlocked){
  count=count||3;
  var dt=(c&&c.dietType)||'normal';
  var slot=classifyMealSlot(meal.name);
  // Ό,τι δεν είναι Πρωινό/Μεσημεριανό/Βραδινό («Pre προπόνησης», «Μετά προπόνησης», «Σνακ», «Γεύμα 2»…)
  // παίρνει εναλλακτικές σαν Ενδιάμεσο — αλλιώς το 'other' διάλεγε από ΟΛΗ τη δεξαμενή μόνο με βάση
  // τις θερμίδες και πρότεινε κυρίως πιάτα (π.χ. κοτόπουλο με ρύζι) σε θέση σνακ.
  if(slot==='other')slot='snack';
  var mySig=mealSignature(meal.foods);
  if(!isBlocked){
    var cats=(typeof DIET_TYPE_FORBIDDEN_CATS!=='undefined'&&DIET_TYPE_FORBIDDEN_CATS[dt])||[];
    isBlocked=function(foods){ return cats.length&&foods.some(function(f){return foodBlockedByDietCats(f.n,dt,cats);}); };
  }
  var tk=targetKcal||1;
  var cands=pool.filter(function(x){
    if(x.sig===mySig)return false;
    if(slot!=='other' && x.slots.indexOf(slot)===-1)return false;
    // Ολόκληρο πιάτο κρέατος/ψαριού δεν είναι «Ενδιάμεσο» (ίδιος κανόνας με findBestRecipe/findSavedComboMatch)
    if(slot==='snack' && dt!=='bodybuilding_clean' && (x.group==='meat'||x.group==='fish'))return false;
    // Βρώμη ΜΟΝΟ σε πρωινό — ίδιος κανόνας με removeOatsFromMainMeals (plan-transform.js)
    if((slot==='lunch'||slot==='dinner') && x.foods.some(function(f){return (f.n||'').toLowerCase().indexOf('βρώμη')!==-1;}))return false;
    return !isBlocked(x.foods);
  });
  function score(x){
    var s=Math.abs(x.kcal-tk)/tk;
    if(x.kcal<tk*0.5||x.kcal>tk*1.8)s+=1;            // would need extreme rescaling — last resort only
    if(x.src==='own')s-=0.15;
    s-=((x.trust||0.5)-0.5)*0.2;
    return s;
  }
  cands.forEach(function(x){x._s=score(x);});
  cands.sort(function(a,b){return a._s-b._s;});
  var picked=[], used={}, curGroup=mealProteinGroup(meal.foods);
  function take(x){ picked.push(x); used[x.group]=true; }
  // 1) new protein group, also different from the current meal's · 2) new group among the picks ·
  // 3) best remaining, whatever the group (so we still reach `count` when the pool is narrow)
  cands.forEach(function(x){ if(picked.length<count && !used[x.group] && x.group!==curGroup) take(x); });
  cands.forEach(function(x){ if(picked.length<count && !used[x.group] && picked.indexOf(x)===-1) take(x); });
  cands.forEach(function(x){ if(picked.length<count && picked.indexOf(x)===-1) take(x); });
  return picked.map(function(x){
    var scaled=scalePlan([{name:meal.name,foods:deepClone(x.foods)}], null, [{k:targetKcal}])[0];
    return {name:meal.name, foods:scaled.foods, src:x.src};
  });
}

// Backward-compatible one-shot wrapper (builds the pool each call — prefer buildAlternatesPool +
// pickMealAlternates when doing a whole week, as _buildSnapshot does).
function findMealAlternates(meal, dietType, excludeClientId, targetKcal, count, excl){
  var c={id:excludeClientId, dietType:dietType};
  return pickMealAlternates(buildAlternatesPool(c, excl), meal, c, targetKcal, count);
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


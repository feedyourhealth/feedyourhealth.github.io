// js/plan-gen/food-distribution.js
// Weekly food-frequency check against nutritionist guidelines, extracted verbatim
// from js/app-part3.js (module split wave 11). NUTRITION_CONSTRAINTS + FOOD_CATEGORIES
// keyword map + countFoodFrequency(weekPlan) + validateFoodDistribution(weekPlan) +
// displayFoodDistributionResults(validation) -> html. Pure, no load-time code; the
// only caller (renderWeekTable in app-part3.js) is runtime, so this loads right
// before app-part3.js, after med-score.js.

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


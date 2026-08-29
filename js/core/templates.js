// js/core/templates.js
// Load-time DEFAULT_TMPLS normalisation + the mutable TMPLS copy + TRACKING_DATA.
// Extracted from js/app-part1.js (module split wave 5). normalizeWholeTmpls /
// trimTemplateAddedFat / boostPlantTemplateProtein run immediately against DEFAULT_TMPLS,
// then `var TMPLS = deepClone(DEFAULT_TMPLS)`. Needs (all load earlier): snapWholeG
// (lib/helpers.js), cm (lib/food-resolve.js), deepClone (core/persistence.js),
// DEFAULT_TMPLS / FOODS / MACRO_TYPE (data/*). Loads right before app-part1.js.

/* ── Default plan templates (one set per goal) ─────────────────────────────── */

// Κανονικοποίηση προτύπων: «κουμπώνει» τα ακέραια τρόφιμα (αυγά/ψωμί/φρούτα)
// στο πλησιέστερο ακέραιο τεμάχιο, ώστε τα ίδια τα πρότυπα να μη δείχνουν ποτέ
// μισές ποσότητες (π.χ. Ψωμί σίκαλης 40g → 30g = 1 φέτα, 80g → 90g = 3 φέτες).
function normalizeWholeTmpls(tmpls){
  Object.keys(tmpls).forEach(function(goal){
    (tmpls[goal]||[]).forEach(function(day){
      (day||[]).forEach(function(meal){
        (meal.foods||[]).forEach(function(f){ f.g=snapWholeG(f.n,f.g); });
      });
    });
  });
  return tmpls;
}
normalizeWholeTmpls(DEFAULT_TMPLS);

// Βήμα D1: τα default templates τρέχουν 31-40% θερμίδων από λίπος ενώ τα macro presets ζητούν
// 23-30% — δομική αναντιστοιχία που ο scalePlan δεν κλείνει (SCALE_CATS floor 0.6 + το μισό λίπος
// κάθεται σε πρωτεϊνικά τρόφιμα). Μετρημένο overshoot +25%…+76% λίπος/εβδομάδα. Δύο ήπια όρια:
//   (α) hard cap 8g ελαιόλαδο ανά γεύμα — τα templates βάζουν 8-12g σε ΚΑΙ μεσημεριανό ΚΑΙ βραδινό
//       (+ ό,τι προσθέτει το ensureSaladAndOil/ensureOilWithVegetables), δηλ. 20-30g/ημέρα.
//   (β) το ημερήσιο added fat (Λάδια + Ξηροί καρποί, incl. αβοκάντο/ταχίνι/φυστικοβούτυρο) δεν
//       ξεπερνά ~13% των θερμίδων της ημέρας· το υπόλοιπο λίπος έρχεται από ολόκληρα τρόφιμα.
// Ίδιο μοτίβο load-time normalizer με το normalizeWholeTmpls από πάνω.
function trimTemplateAddedFat(tmpls){
  var PER_MEAL_OIL_MAX=8, MAX_ADDED_FAT_PCT=0.13, MIN_G=3;
  Object.keys(tmpls).forEach(function(goal){
    (tmpls[goal]||[]).forEach(function(day){
      if(!day||!day.length)return;
      (day||[]).forEach(function(meal){
        (meal.foods||[]).forEach(function(f){
          var cat=FOODS[f.n]?FOODS[f.n].cat:'';
          if(cat==='Λάδια' && f.g>PER_MEAL_OIL_MAX) f.g=PER_MEAL_OIL_MAX;
        });
      });
      var dayK=0, addF=0, addItems=[];
      (day||[]).forEach(function(meal){
        (meal.foods||[]).forEach(function(f){
          var v=cm(f.n,f.g); dayK+=v.k;
          var cat=FOODS[f.n]?FOODS[f.n].cat:'';
          if((MACRO_TYPE[cat]||'k')==='f'){ addF+=v.f; addItems.push(f); }
        });
      });
      if(dayK>0 && addF*9 > dayK*MAX_ADDED_FAT_PCT){
        var r=(dayK*MAX_ADDED_FAT_PCT)/(addF*9);
        addItems.forEach(function(f){ f.g=Math.max(MIN_G, Math.round(f.g*r)); });
      }
    });
  });
  return tmpls;
}
trimTemplateAddedFat(DEFAULT_TMPLS);

// Βήμα D2a: τα vegan_*/orthodox_fasting templates ξεκινούν με ~4.5-5g πρωτεΐνης ανά 100 kcal, ενώ
// ένα 35%-protein preset αντιστοιχεί σε ~8.75g/100kcal — ο scalePlan δεν μπορεί να καλύψει τη
// διαφορά (τα φρουτο-snacks έχουν ~0 πρωτεΐνη, δεν υπάρχει τι να κλιμακωθεί). Μετρήθηκε: vegan-cut
// 54% / orthodox 62% του στόχου πρωτεΐνης ακόμα και μετά τα 2a-2c. Δύο ήπιες κινήσεις, ΜΟΝΟ στα
// plant-diet templates, με υπάρχον (πλήρως wired: en/ru/tr + PORTIONS) τρόφιμο:
//   (α) σε κάθε savory snack με <10g πρωτεΐνη (όχι mini-smoothie με «γάλα», όχι πρωινό) πρόσθεσε
//       Λούπινα (βρ.) 90g — 15.6g πρωτ. / 2.9g λίπος ανά 100g, παραδοσιακά νηστίσιμο ελληνικό.
//   (β) στα κύρια γεύματα, +40% στις υπάρχουσες μερίδες οσπρίων/tofu (<300g), με πλαφόν 340g.
// Δεν υποκαθιστά hand-authored plant templates — baseline ώστε τα ενεργά vegan/νηστίσιμα πλάνα να
// βγουν από την κλινικά ανεπαρκή ζώνη πρωτεΐνης.
function boostPlantTemplateProtein(tmpls){
  var LUPINI='Λούπινα (βρ.)';
  // Τρέχει LOAD-TIME (πριν φορτωθεί το app-part3.js) → δεν μπορούμε να βασιστούμε στο
  // classifyMealSlot· ανίχνευση snack inline από το όνομα του γεύματος.
  var isSnack=function(name){ return /ενδιάμεσ|ενδιαμεσ|δεκατιαν|απογευμ|snack/i.test(name||''); };
  var isMilky=function(n){ return /γάλα/i.test(n); }; // «γάλα ...» σε snack = mini-smoothie, δεν ταιριάζει λούπινο
  Object.keys(tmpls).forEach(function(goal){
    if(!/^(vegan_|orthodox_fasting)/.test(goal))return;
    (tmpls[goal]||[]).forEach(function(day){
      (day||[]).forEach(function(meal){
        var foods=meal.foods||[];
        var mp=0; foods.forEach(function(f){ mp+=cm(f.n,f.g).p; });
        var hasLupini=foods.some(function(f){return f.n===LUPINI;});
        // (β) όλα τα γεύματα: +40% στις υπάρχουσες μερίδες οσπρίων/tofu, με απόλυτο πλαφόν 340g.
        foods.forEach(function(f){
          var cat=FOODS[f.n]?FOODS[f.n].cat:'';
          if(cat==='Όσπρια' && f.n!==LUPINI && f.g<300) f.g=Math.min(340, Math.round(f.g*1.4));
        });
        if(hasLupini) return;
        // (α) Λούπινα ΜΟΝΟ σε savory snack φτωχό σε πρωτεΐνη (<10g) — όχι σε mini-smoothie («γάλα ...»),
        //     όχι σε πρωινό (απέφευγε άβολους συνδυασμούς τύπου ψωμί+ταχίνι+μέλι+λούπινα). 90g = μία
        //     ρεαλιστική «χούφτα» παστά λούπινα (~107 kcal), παραδοσιακό νηστίσιμο.
        if(isSnack(meal.name) && mp<10){
          var milky=foods.some(function(f){return isMilky(f.n);});
          if(!milky) foods.push({n:LUPINI,g:90});
        }
      });
    });
  });
  return tmpls;
}
boostPlantTemplateProtein(DEFAULT_TMPLS);

// Mutable copy — editable by the user
var TMPLS=deepClone(DEFAULT_TMPLS);
// User-saved custom plan templates
var customTemplates=[];

// ✅ TRACKING_DATA - Initialize early to prevent undefined errors
var TRACKING_DATA = {
  plans: [],
  recipes: {},
  patterns: {},
  lastUpdated: null
};

// Load TRACKING_DATA from localStorage if available
try {
  var stored = JSON.parse(localStorage.getItem('TRACKING_DATA'));
  if(stored && stored.plans){
    TRACKING_DATA = stored;
  }
} catch(e) {
  console.warn('Could not load TRACKING_DATA:', e.message);
}


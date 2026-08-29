// js/plan-gen/mediterranean.js
// The Mediterranean-diet rules layer applied to a template during plan generation,
// extracted verbatim from the tail of js/app-part2.js (module split wave 24):
// expandFYHRecipes, removeFYHFromMainMeals, ensureSaladAndOil, applyMediterraneanRules,
// preferWholeGrains, cleanFYHMeals, addPotatoToFishMeals, standardizeMediterraneanSnacks,
// avoidLegumeStarchCombos, avoidDairyWithLegumes, avoidTanninsWithLegumes,
// ensureOilWithVegetables, avoidOxalateWithDairy, ensureOmega3FishIntake + the
// PETRETZEAKIS_OATS_RECIPES / HIGH_/LOW_OXALATE* / OMEGA3_FISH tables, and the
// plan-export dropdown (togglePlanExportMenu/closePlanExportMenu + its outside-click
// listener — the one piece of load-time code here). Every rule fn takes a 7-day
// `days` array and returns a transformed deepClone; all are called from genPlan
// (plan-gen/gen-plan.js) at runtime. Loads with the other plan-gen/* modules.

// FYH recipes that are complete meals on their own — no sides needed

// FYH recipes that the client can't recognize by name — expand to ingredients in the plan
// (Only user-created recipes, NOT feedyourhealth.org recipes which link to a blog post)

// Replaces expandable FYH recipe entries with their actual ingredients (scaled to portion)
function expandFYHRecipes(days){
  var result=deepClone(days);
  result.forEach(function(meals){
    meals.forEach(function(meal){
      var expanded=[];
      meal.foods.forEach(function(food){
        var rx=FYH_RECIPE_EXPAND[food.n];
        if(rx){
          // Ασφαλιστική δικλείδα: αν κάποιο πρότυπο γεύμα (π.χ. MED_PLAN) δώσει κατά λάθος πολύ μικρό g
          // (π.χ. "1" νοώντας "1 μερίδα" αντί για πραγματικά γραμμάρια), μην παράγουμε φάντασμα γεύμα
          // με 0γρ. σε όλα τα συστατικά — ελάχιστο 1γρ. ανά συστατικό, ίδιο floor με το expandRecipeInPlan.
          var scale=food.g/rx.base;
          rx.ing.forEach(function(ing){
            expanded.push({n:ing.n,g:Math.max(1,Math.round(ing.g*scale))});
          });
        } else {
          expanded.push(food);
        }
      });
      meal.foods=expanded;
    });
  });
  return result;
}

// ── Αφαίρεση FYH από κύρια γεύματα ──────────────────────────────────────────
// Τα FYH complete meals δεν χρησιμοποιούνται αυτόματα — ο διαιτολόγος τα προσθέτει χειροκίνητα
// Αντικαθίστανται με ένα βάση κοτόπουλο+υδατάνθρακας για να δουλέψουν τα υπόλοιπα steps
function removeFYHFromMainMeals(days){
  var result=deepClone(days);
  result.forEach(function(meals){
    meals.forEach(function(meal){
      if(meal.name!=='Μεσημεριανό'&&meal.name!=='Βραδινό')return;
      var hasFYH=meal.foods.some(function(f){return FYH_COMPLETE_MEAL[f.n];});
      if(!hasFYH)return;
      meal.foods=deepClone(FYH_DEFAULT_MAIN);
    });
  });
  return result;
}

// Ensure every Μεσημεριανό & Βραδινό has 1 φλ. Σαλάτα εποχής + 1 κ.σ. Ελαιόλαδο
// (skipped for FYH complete meals which are self-contained)
function ensureSaladAndOil(days){
  var result=deepClone(days);
  result.forEach(function(meals){
    meals.forEach(function(meal){
      if(meal.name!=='Μεσημεριανό'&&meal.name!=='Βραδινό')return;
      if(meal.foods.some(function(f){return f.n===FREE_MEAL_MARKER;}))return;
      var hasFYH=meal.foods.some(function(f){return FYH_COMPLETE_MEAL[f.n];});
      if(hasFYH)return;
      var hasSalad=meal.foods.some(function(f){return f.n==='Σαλάτα εποχής';});
      if(!hasSalad)meal.foods.push({n:'Σαλάτα εποχής',g:100});
      var hasOil=meal.foods.some(function(f){return f.n==='Ελαιόλαδο';});
      if(!hasOil)meal.foods.push({n:'Ελαιόλαδο',g:10});
    });
  });
  return result;
}

// ── Free meal marker ─────────────────────────────────────────────────────────

// ── Mediterranean weekly structure ───────────────────────────────────────────
// ΜΕΣΗΜΕΡΙΑΝΑ
//   Δευ: Ρεβίθια+Τόνος+Σαλάτα+Λάδι (fixed)
//   Τρί: Κοτόπουλο σχάρας (swap, template sides)
//   Τετ: Κοτόπουλο μπιφτέκι (swap, template sides)
//   Πέμ: Φακές+Τόνος+Σαλάτα+Λάδι (fixed)
//   Παρ: Κοτόπουλο σχάρας (swap, template sides)
//   Σαβ: Λαβράκι+Κινόα+Σαλάτα+Λάδι (fixed)
//   Κυρ: Χοιρινό μπριζόλα+Πατάτα+Γιαούρτι+Σαλάτα+Λάδι (fixed)
// ΒΡΑΔΙΝΑ
//   Τρί: Λαβράκι+Ρύζι καστανό+Σαλάτα+Λάδι (fixed)
//   Τετ: Βοδινά φιλετάκια+Γλυκοπατάτα+Σαλάτα+Λάδι+Γιαούρτι (fixed)
//   Παρ: Πίτα+Κοτόπουλο+Γιαούρτι+Σαλάτα+Λάδι (σουβλάκι) (fixed)
//   Σαβ: Ελεύθερο γεύμα (free)

function applyMediterraneanRules(days){
  var result=deepClone(days);
  Object.keys(MED_PLAN).forEach(function(di){
    var dayIdx=parseInt(di);
    var rules=MED_PLAN[di];
    if(!result[dayIdx])return;
    result[dayIdx].forEach(function(meal){
      var rule=rules[meal.name];
      if(!rule)return;
      // Skip FYH complete meals
      if(meal.foods.some(function(f){return FYH_COMPLETE_MEAL[f.n];}))return;
      // Find existing protein gram amount (to keep similar quantity after scaling)
      var existG=150;
      meal.foods.forEach(function(f){
        var cat=FOODS[f.n]?FOODS[f.n].cat:'';
        if(PROT_CATS.indexOf(cat)!==-1)existG=f.g;
      });
      if(rule.type==='free'){
        // Free meal — replace with marker, pipeline steps skip this meal
        meal.foods=[{n:FREE_MEAL_MARKER,g:0}];
      } else if(rule.type==='fixed'){
        // Replace entire meal with the fixed meal foods
        meal.foods=deepClone(rule.foods);
      } else if(rule.type==='legumes'){
        // Currently unreachable — no MED_PLAN entry uses type:'legumes' (all are 'fixed'/'meat'/'free').
        // Kept for future MED_PLAN authors who want a legume-based day. Safe to use: the cascade bug this
        // used to trigger (this legume meal → avoidLegumeStarchCombos adding feta → avoidDairyWithLegumes
        // stripping it back out and adding chicken, doubling up protein) was fixed at its root in
        // avoidLegumeStarchCombos (feta-adding removed, see its own comment), so it no longer applies here either.
        // Remove proteins and grains; replace with legume (+ tuna if specified)
        var keep=meal.foods.filter(function(f){
          var cat=FOODS[f.n]?FOODS[f.n].cat:'';
          return PROT_CATS.indexOf(cat)===-1&&GRAIN_CATS.indexOf(cat)===-1
            &&f.n!=='Σαλάτα εποχής'&&f.n!=='Ελαιόλαδο';
        });
        var legBase=[{n:rule.leg,g:200}];
        if(rule.tuna)legBase.push({n:rule.tuna,g:80});
        meal.foods=legBase.concat(keep);
      } else {
        // Swap protein food(s) with target protein
        var swapped=false;
        meal.foods=meal.foods.map(function(f){
          var cat=FOODS[f.n]?FOODS[f.n].cat:'';
          if(PROT_CATS.indexOf(cat)!==-1&&!swapped){swapped=true;return{n:rule.n,g:f.g};}
          if(PROT_CATS.indexOf(cat)!==-1&&swapped)return null; // remove duplicates
          return f;
        }).filter(function(f){return f!==null;});
      }
    });
  });
  return result;
}

// Swap refined grains for whole-grain Mediterranean equivalents
function preferWholeGrains(days){
  var result=deepClone(days);
  result.forEach(function(meals){
    meals.forEach(function(meal){
      if(meal.foods.some(function(f){return FYH_COMPLETE_MEAL[f.n];}))return;
      meal.foods=meal.foods.map(function(f){
        var s=MED_GRAIN_SWAP[f.n];
        return s?{n:s,g:f.g}:f;
      });
    });
  });
  return result;
}

// Remove side dishes from meals that already contain a complete FYH recipe
function cleanFYHMeals(days){
  var result=deepClone(days);
  result.forEach(function(meals){
    meals.forEach(function(meal){
      var hero=null;
      meal.foods.forEach(function(f){if(FYH_COMPLETE_MEAL[f.n])hero=f;});
      if(hero&&meal.foods.length>1)meal.foods=[hero];
    });
  });
  return result;
}

// ── Πατάτα σε γεύματα ψαριού (δεν έχουν υδατάνθρακα) ────────────────────────
function addPotatoToFishMeals(days){
  var result=deepClone(days);
  result.forEach(function(meals){
    meals.forEach(function(meal){
      if(meal.name!=='Μεσημεριανό'&&meal.name!=='Βραδινό')return;
      if(meal.foods.some(function(f){return f.n===FREE_MEAL_MARKER;}))return;
      // Έλεγχος αν το γεύμα περιέχει ψάρι
      var hasFish=meal.foods.some(function(f){
        return FOODS[f.n]&&FOODS[f.n].cat==='Ψάρια';
      });
      if(!hasFish)return;
      // Έλεγχος αν υπάρχει ήδη υδατάνθρακας (δημητριακά, πατάτα, γλυκοπατάτα, ή όσπρια — π.χ. Φακές έχουν ~20g
      // υδατ./100g και ήδη καλύπτουν τον ρόλο του αμύλου σε ένα πιάτο φακές+σαρδέλες).
      // Η Γλυκοπατάτα ελέγχεται ρητά με το όνομά της γιατί είναι καταχωρημένη cat:'Λαχανικά', όχι 'Δημητριακά'.
      var hasCarb=meal.foods.some(function(f){
        if(f.n==='Πατάτες'||f.n==='Γλυκοπατάτα')return true;
        var cat=FOODS[f.n]&&FOODS[f.n].cat;
        return cat==='Δημητριακά'||cat==='Όσπρια';
      });
      if(!hasCarb)meal.foods.push({n:'Πατάτες',g:200});
    });
  });
  return result;
}

// ── Standardize Mediterranean snacks ─────────────────────────────────────────
// Every Ενδιάμεσο should have at least 1 fruit AND 1 nuts/dairy item
// Skip snacks that already contain a FYH snack item

function standardizeMediterraneanSnacks(days){
  var result=deepClone(days);
  result.forEach(function(meals,di){
    meals.forEach(function(meal){
      if(meal.name!=='Ενδιάμεσο')return;
      // Skip if has FYH snack item
      if(meal.foods.some(function(f){return FYH_SNACK_NAMES[f.n];}))return;
      // Check for fruit
      var hasFruit=meal.foods.some(function(f){
        var cat=FOODS[f.n]?FOODS[f.n].cat:'';
        return FRUIT_CAT.indexOf(cat)!==-1;
      });
      // Check for nuts/dairy
      var hasNuts=meal.foods.some(function(f){
        var cat=FOODS[f.n]?FOODS[f.n].cat:'';
        return NUTS_CATS.indexOf(cat)!==-1||cat==='Αυγά/Γαλακτ.';
      });
      // Add fruit if missing — rotate through week
      if(!hasFruit){
        var fruitName=MED_SNACK_FRUITS[di%MED_SNACK_FRUITS.length];
        meal.foods.unshift({n:fruitName,g:150});
      }
      // Add nuts/dried fruits if missing - rotate variety
      if(!hasNuts){
        var nutsVariety=['Αμύγδαλα','Καρύδια','Φιστίκια'];
        var selectedNut=nutsVariety[di%nutsVariety.length];
        var nutGrams=25; // Mediterranean standard: 25-30g nuts/day
        meal.foods.push({n:selectedNut,g:nutGrams});
      }
    });
  });
  return result;
}

// ── Avoid legume + starch combos: use legumes + feta + whole bread instead ──
// Λογική: Όσπρια ΔΕΝ συνδυάζονται με άλλο άμυλο (πατάτες, ρύζι, κ.τ.λ.)
// Αντί γι'αυτό: Περισσότερα όσπρια + Τυρί Φέτα + Ψωμί ολικής άλεσης

function avoidLegumeStarchCombos(days){
  var result=deepClone(days);
  result.forEach(function(dayMeals){
    dayMeals.forEach(function(meal){
      // Ο κανόνας αφορά κύρια γεύματα — αποφεύγουμε να πειράξουμε πρωινό/σνακ κατά λάθος
      // (ίδιο pattern scoping με addPotatoToFishMeals/ensureSaladAndOil)
      if(meal.name!=='Μεσημεριανό'&&meal.name!=='Βραδινό')return;
      // Ελέγχουμε αν υπάρχουν τόσο όσπρια όσο και άλλο άμυλο στο γεύμα
      var hasLegume=false, legumeName='', legumeGrams=0;
      var hasOtherStarch=false, starchNames=[];

      meal.foods.forEach(function(f){
        if(isLegumeFood(f.n)){
          hasLegume=true;
          legumeName=f.n;
          legumeGrams=f.g||200;
        }
        if(OTHER_STARCHES.indexOf(f.n)!==-1){
          hasOtherStarch=true;
          starchNames.push(f.n);
        }
      });

      // Αν υπάρχουν και τα δύο, αντικαθιστούμε τα άλλα αμύλα με φέτα + ψωμί ολικής άλεσης
      if(hasLegume && hasOtherStarch){
        // Αφαιρούμε τα άλλα αμύλα
        meal.foods=meal.foods.filter(function(f){
          return OTHER_STARCHES.indexOf(f.n)===-1;
        });

        // Αυξάνουμε την ποσότητα των όσπριων (από 150-200g σε 250-300g)
        for(var i=0;i<meal.foods.length;i++){
          if(meal.foods[i].n===legumeName){
            meal.foods[i].g=Math.max(meal.foods[i].g, 250);
            break;
          }
        }

        // ΣΗΜΕΙΩΣΗ: εδώ πρόσθεταμε παλιότερα φέτα ως αντικατάσταση του αμύλου, αλλά αυτό προκαλούσε
        // ένα cascade bug — η avoidDairyWithLegumes (αμέσως μετά, όσπριο+γαλακτοκομικό) την έβλεπε,
        // την αφαιρούσε, και πρόσθετε κοτόπουλο· το γεύμα κατέληγε με ΚΑΙ το όσπριο ΚΑΙ κοτόπουλο ως
        // πρωτεΐνη (ίδιο pattern με το bug φακές+σαρδέλες+κοτόπουλο, commit f3926e5). Η ενισχυμένη
        // ποσότητα οσπρίου (250-300g) παραπάνω καλύπτει ήδη την πρωτεΐνη — δεν προσθέτουμε γαλακτοκομικό.

        // Προσθέτουμε ψωμί ολικής άλεσης (30g) αν δεν υπάρχει
        var hasBread=meal.foods.some(function(f){return f.n==='Ολικής άλεσης ψωμί' || f.n.indexOf('ψωμί')!==-1;});
        if(!hasBread){
          meal.foods.push({n:'Ολικής άλεσης ψωμί',g:30});
        }
      }
    });
  });
  return result;
}

// ── Avoid dairy + legumes: calcium inhibits iron absorption from legumes ──
// Ερευνητικά ευρήματα: Το κάλτσιο (γαλακτοκομικά) μειώνει απορρόφηση μη-αιμικού σιδήρου των όσπριων
// Λύση: Αφαιρούμε γαλακτοκομικό + προσθέτουμε βιταμίνη C (λεμόνι) + λευκό κρέας

function avoidDairyWithLegumes(days){
  var result=deepClone(days);
  result.forEach(function(dayMeals){
    dayMeals.forEach(function(meal){
      // Ο κανόνας αφορά κύρια γεύματα — αποφεύγουμε να πειράξουμε πρωινό/σνακ κατά λάθος
      if(meal.name!=='Μεσημεριανό'&&meal.name!=='Βραδινό')return;
      // Ελέγχουμε αν υπάρχουν τόσο όσπρια όσο και γαλακτοκομικό
      var hasLegume=false, legumeName='', legumeFoods=[];
      var hasDairy=false, dairyNames=[];

      meal.foods.forEach(function(f){
        if(isLegumeFood(f.n)){
          hasLegume=true;
          legumeName=f.n;
          legumeFoods.push(f);
        }
        if(DAIRY_FOODS.some(function(d){return f.n.indexOf(d)!==-1;})){
          hasDairy=true;
          dairyNames.push(f.n);
        }
      });

      // Αν υπάρχουν και τα δύο, αφαιρούμε το γαλακτοκομικό και προσθέτουμε λεμόνι + λευκό κρέας
      if(hasLegume && hasDairy){
        // Αφαιρούμε τα γαλακτοκομικά
        meal.foods=meal.foods.filter(function(f){
          return !DAIRY_FOODS.some(function(d){return f.n.indexOf(d)!==-1;});
        });

        // Προσθέτουμε λεμόνι (20ml = ~15-20mg βιταμίνη C) για 3-4x ενίσχυση απορρόφησης σιδήρου
        var hasLemon=meal.foods.some(function(f){return f.n.indexOf('λεμόνι')!==-1 || f.n.indexOf('Λεμόνι')!==-1;});
        if(!hasLemon){
          meal.foods.push({n:'Λεμόνι (χυμός)',g:20});
        }

        // Προσθέτουμε λευκό κρέας - κοτόπουλο (100g) για αιμικό σίδηρο που απορροφάται καλύτερα
        var hasWhiteProtein=meal.foods.some(function(f){
          return WHITE_PROTEINS.some(function(p){return f.n.indexOf(p)!==-1;});
        });
        if(!hasWhiteProtein){
          meal.foods.push({n:'Κοτόπουλο στήθος (ψητό)',g:100});
        }
      }
    });
  });
  return result;
}

// ── Avoid tannins with legume meals: coffee/tea inhibits iron absorption ──
// Ερευνητικά ευρήματα: Ταννίνες (από τσάι/καφές) μειώνουν απορρόφηση σιδήρου κατά 40-70%
// Λύση: Προσθήκη ενημέρωσης/σημείωσης αν υπάρχουν όσπρια να αποφύγει καφές/τσάι κατά τη διάρκεια
function avoidTanninsWithLegumes(days){
  var result=deepClone(days);
  result.forEach(function(dayMeals){
    var dayHasLegume=false;
    dayMeals.forEach(function(meal){
      // Ελέγχουμε αν υπάρχουν όσπρια σε αυτό το γεύμα
      if(meal.foods.some(function(f){return isLegumeFood(f.n);})){
        dayHasLegume=true;
      }
    });

    // Αν ο ημέρα έχει γεύματα με όσπρια, προσθέτουμε σημείωση στο πρώτο snack
    if(dayHasLegume){
      var snackMeal=dayMeals.find(function(m){return m.name && m.name.toLowerCase().includes('ενδιάμεσο');});
      if(snackMeal && !snackMeal.note){
        snackMeal.note='⚠️ Έχει όσπρια στο πλάνο: Αποφύγετε καφές/τσάι κατά τη διάρκεια του γεύματος. Καφές ≥1 ώρα ΜΕΤΑ για καλύτερη απορρόφηση σιδήρου.';
      }
    }
  });
  return result;
}

// ── Ensure oil with vegetables: fat-soluble vitamins A, D, E, K need dietary fat ──
// Ερευνητικά ευρήματα: Βιταμίνες A, D, E, K είναι λιποδιαλυτές - χρειάζονται λάδι για απορρόφηση
// Βήτα-καροτένιο (καρότα, κολοκύθα) + λυκοπένιο (ντομάτες) απαιτούν ≥10% λίπος στη διατροφή

function ensureOilWithVegetables(days){
  var result=deepClone(days);
  result.forEach(function(dayMeals){
    dayMeals.forEach(function(meal){
      // Ο κανόνας αφορά κύρια γεύματα — αποφεύγουμε να πειράξουμε πρωινό/σνακ κατά λάθος
      if(meal.name!=='Μεσημεριανό'&&meal.name!=='Βραδινό')return;
      // Ελέγχουμε αν υπάρχουν λαχανικά που χρειάζονται λάδι
      var hasVeggieNeedingFat=false;
      meal.foods.forEach(function(f){
        if(VEGETABLES_NEEDING_FAT.some(function(v){return f.n.indexOf(v)!==-1;})){
          hasVeggieNeedingFat=true;
        }
      });

      // Αν υπάρχουν λαχανικά, ελέγχουμε αν υπάρχει ελαιόλαδο
      if(hasVeggieNeedingFat){
        var hasOil=meal.foods.some(function(f){return f.n==='Ελαιόλαδο' || f.n.indexOf('λάδι')!==-1;});

        // Αν δεν υπάρχει λάδι, προσθέτουμε ελαιόλαδο (10g = 1 κουταλιά)
        if(!hasOil){
          meal.foods.push({n:'Ελαιόλαδο',g:10});
        }
      }
    });
  });
  return result;
}

// ── Normalize breakfasts: eggs Mon/Wed/Fri, yogurt+oats other days ────────────
// Petretzeakis recipes for automatic generation



var PETRETZEAKIS_OATS_RECIPES=[
  {n:'Overnight Oats Banoffee (Πετρετζίκης)',g:430},
  {n:'Overnight Oats Black Forest (Πετρετζίκης)',g:425},
  {n:'Overnight Oats P.B. & Choco (Πετρετζίκης)',g:470}
];

// ── Avoid high-oxalate vegetables with dairy: oxalate binds calcium ──
// Ερευνητικά ευρήματα: Οξαλικό σε σπανάκι δεσμεύει ασβέστιο - απορρόφηση μόνο 5% (vs 27% από γάλα)
// Λύση: Αποφυγή σπανακιού + γαλακτοκομικά. Χρήση άλλων πράσινων (μπρόκολο, κάλε)
var HIGH_OXALATE_VEGGIES=['Σπανάκι','Σπανάκι ωμό','Σωταρισμένο σπανάκι'];
var LOW_OXALATE_GREENS=['Μπρόκολο','Κάλε','Λάχανο','Αγκινάρες'];

function avoidOxalateWithDairy(days){
  var result=deepClone(days);
  result.forEach(function(dayMeals){
    dayMeals.forEach(function(meal){
      // Ο κανόνας αφορά κύρια γεύματα — αποφεύγουμε να πειράξουμε πρωινό/σνακ κατά λάθος
      if(meal.name!=='Μεσημεριανό'&&meal.name!=='Βραδινό')return;
      // Ελέγχουμε αν υπάρχουν ψηλά οξαλικά + γαλακτοκομικά
      var hasHighOxalate=false, oxalateName='';
      var hasDairy=false;

      meal.foods.forEach(function(f){
        if(HIGH_OXALATE_VEGGIES.some(function(v){return f.n.indexOf(v)!==-1;})){
          hasHighOxalate=true;
          oxalateName=f.n;
        }
        if(DAIRY_FOODS.some(function(d){return f.n.indexOf(d)!==-1;})){
          hasDairy=true;
        }
      });

      // Αν υπάρχουν και τα δύο, αφαιρούμε το σπανάκι και προσθέτουμε κάλε/μπρόκολο
      if(hasHighOxalate && hasDairy){
        // Αφαιρούμε το ψηλό οξαλικό λαχανικό
        meal.foods=meal.foods.filter(function(f){
          return !HIGH_OXALATE_VEGGIES.some(function(v){return f.n.indexOf(v)!==-1;});
        });

        // Προσθέτουμε κάλε ή μπρόκολο (χαμηλό οξαλικό, καλή απορρόφηση ασβεστίου)
        var hasLowOxalateGreen=meal.foods.some(function(f){
          return LOW_OXALATE_GREENS.some(function(g){return f.n.indexOf(g)!==-1;});
        });

        if(!hasLowOxalateGreen){
          meal.foods.push({n:'Μπρόκολο',g:150});
        }
      }
    });
  });
  return result;
}

// ── Ensure adequate fish intake: omega-3 for inflammation control ──
// Ερευνητικά ευρήματα: Ωμέγα-6:3 αναλογία πρέπει να είναι 4:1 (όχι 15:1-20:1)
// Λύση: Παρακολούθηση ότι υπάρχει ψάρι ≥2-3x/εβδάδα (σολομός, σαρδέλες, λαβράκι)
var OMEGA3_FISH=['Σολομός (ψητός)','Σαρδέλες','Λαβράκι (ψητό)','Τόνος (κονσέρβα)','Μπακαλιάρος (ψητός)'];

function ensureOmega3FishIntake(days){
  var result=deepClone(days);
  var fishDays=new Set();

  // Μετράμε πόσες ημέρες έχουν ψάρι πλούσιο σε ωμέγα-3
  result.forEach(function(dayMeals, dayIdx){
    dayMeals.forEach(function(meal){
      meal.foods.forEach(function(f){
        if(OMEGA3_FISH.some(function(fish){return f.n.indexOf(fish)!==-1;})){
          fishDays.add(dayIdx);
        }
      });
    });
  });

  // Αν έχουν <2 ημέρες ψάρι, προσθέτουμε προειδοποίηση στο πρώτο snack
  if(fishDays.size < 2){
    var firstDay=result[0];
    if(firstDay && firstDay.length > 0){
      var snackMeal=firstDay.find(function(m){return m.name && m.name.toLowerCase().includes('ενδιάμεσο');});
      if(snackMeal){
        snackMeal.note=(snackMeal.note || '') +
          '\n⚠️ Ωμέγα-3: Το πλάνο έχει λιγότερο από 2 ημέρες ψάρι. Για βέλτιστη αναλογία ωμέγα-6:3 (4:1), προσθέστε σολομό, σαρδέλες ή λαβράκι ≥2-3x/εβδάδα.';
      }
    }
  }

  return result;
}

function togglePlanExportMenu(btn){
  var menu=document.getElementById('plan-export-menu');
  if(!menu) return;
  menu.classList.toggle('open');
}
function closePlanExportMenu(){
  var menu=document.getElementById('plan-export-menu');
  if(menu) menu.classList.remove('open');
}
document.addEventListener('click',function(e){
  var dd=document.querySelector('.plan-export-dropdown');
  if(dd && !dd.contains(e.target)) closePlanExportMenu();
});

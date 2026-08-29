// js/plan-gen/exclusions.js
// Food-exclusion / allergy / preference-avoidance engine + its editor UI, extracted
// verbatim from js/app-part2.js (module split wave 25): parseAllergies, isFoodAllergy,
// foodIsExcludedByNameOrIngredient, applyFoodExclusions, the PREF_AVOID_MARKERS /
// DAIRY_NOT_ACTUAL_DAIRY / CHEESE_NAME_KEYWORDS / PREF_PHRASE_MAP tables, dairyFoodsList,
// cheeseFoodsList, wordsMatchLoosely, clauseContainsPhrase, parsePreferenceAvoidFoods,
// buildEffectiveExclusionList, scrubExcludedFoodsFromWeekPlan, DIET_TYPE_FORBIDDEN_CATS,
// applyDietTypeCategorySafetyNet, and the exclusion editor (buildExcludeHtml/
// renderExclWrap/toggleFoodExclude/applyQuickExclude/refilterMealPlanExclusions/
// showExclSug/addFoodExclude/clearAllExcludes). Only literal table initialisers run at
// parse time; RED_MEAT_NAME_KEYWORDS / redMeatFoodsList (2026-08-29, "όχι κόκκινο κρέας" →
// ΟΛΑ τα κόκκινα κρέατα) is lazy and typeof-guards its RED_MEAT_FOODS ref. Callers:
// gen-plan.js + food-selector.js (runtime) and renderMain (app-part2.js, runtime).
// Loads with the plan-gen/* group.

// ── Food Exclusion functions ─────────────────────────────────────────────────
// ✅ FIX #2: Parse allergies with proper trimming
function parseAllergies(allergyString) {
  if (!allergyString || typeof allergyString !== 'string') return [];

  return allergyString
    .split(',')
    .map(function(a) { return a.trim().toLowerCase(); })
    .filter(function(a) { return a.length > 0; });
}

// ✅ FIX #2: Check if food matches allergy (with fuzzy matching)
function isFoodAllergy(foodName, allergyList) {
  if (!allergyList || allergyList.length === 0) return false;

  var normalized = (foodName || '').toLowerCase().trim();
  return allergyList.some(function(allergy) {
    return normalized.indexOf(allergy) !== -1 || allergy.indexOf(normalized) !== -1;
  });
}

// Ένα σύνθετο πιάτο (π.χ. "High Protein Ομελέτα Wrap") μπορεί να περιέχει ένα αποκλεισμένο
// τρόφιμο ΜΕΣΑ στα συστατικά του (FOODS[name].ingredients ή FYH_RECIPE_EXPAND[name].ing) χωρίς
// το ίδιο το όνομα του πιάτου να το φανερώνει καθόλου. Κάθε άλλος έλεγχος αποκλεισμού σε αυτό το
// αρχείο συγκρίνει μόνο το όνομα του τροφίμου/πιάτου με τη λίστα αποκλεισμού — ένα πιάτο-συνταγή
// με αποκλεισμένο συστατικό γλιστράει απαρατήρητο από όλα αυτά. Confirmed live 2026-07-30: πελάτης
// με "Αυγά (ολόκληρα)" στη λίστα αποκλεισμού συνέχιζε να παίρνει "High Protein Ομελέτα Wrap"
// (περιέχει "Αυγά" ως συστατικό) σε κάθε διαδρομή δημιουργίας πλάνου.
function foodIsExcludedByNameOrIngredient(foodName,exclNormalized){
  if(!foodName||!exclNormalized||!exclNormalized.length)return false;
  var nameNorm=normalizeGreekText(foodName);
  for(var i=0;i<exclNormalized.length;i++){
    if(nameNorm.indexOf(exclNormalized[i])!==-1)return true;
  }
  var fd=FOODS[foodName];
  if(fd&&fd.ingredients&&fd.ingredients.length){
    for(var j=0;j<fd.ingredients.length;j++){
      var ingNorm=normalizeGreekText(fd.ingredients[j].item||'');
      for(var k=0;k<exclNormalized.length;k++){
        if(ingNorm.indexOf(exclNormalized[k])!==-1)return true;
      }
    }
  }
  if(typeof FYH_RECIPE_EXPAND!=='undefined'&&FYH_RECIPE_EXPAND[foodName]&&FYH_RECIPE_EXPAND[foodName].ing){
    var rx=FYH_RECIPE_EXPAND[foodName].ing;
    for(var m=0;m<rx.length;m++){
      var rxNorm=normalizeGreekText(rx[m].n||'');
      for(var n=0;n<exclNormalized.length;n++){
        if(rxNorm.indexOf(exclNormalized[n])!==-1)return true;
      }
    }
  }
  return false;
}

function applyFoodExclusions(tmplDays,excludeList,allergyList){
  if((!excludeList||!excludeList.length)&&(!allergyList||!allergyList.length))return tmplDays;
  var exclNormalized=(excludeList||[]).map(function(x){return normalizeGreekText(x);});
  var result=deepClone(tmplDays);
  result.forEach(function(meals){
    meals.forEach(function(meal){
      meal.foods=meal.foods.map(function(food){
        // ✅ FIX #2: Check both excludeList AND allergies — name match OR a recipe's own ingredients
        var isExcluded = foodIsExcludedByNameOrIngredient(food.n,exclNormalized);
        var isAllergy = isFoodAllergy(food.n, allergyList);

        if(!isExcluded && !isAllergy) return food;

        // CRITICAL: This food is in the exclusion list OR is an allergy - find a substitute
        var cat=FOODS[food.n]?FOODS[food.n].cat:'';
        var order=SUBST_ORDER[cat]||[cat];
        var sub=null;
        for(var i=0;i<order.length&&!sub;i++){
          var candidates=Object.keys(FOODS).filter(function(n){
            if(!FOODS[n])return false;
            var notExcluded = !foodIsExcludedByNameOrIngredient(n,exclNormalized);
            var notAllergy = !isFoodAllergy(n, allergyList);
            return FOODS[n].cat===order[i] && notExcluded && notAllergy;
          });
          if(candidates.length){
            var origDens=FOODS[food.n]?FOODS[food.n].k:100;
            candidates.sort(function(a,b){
              if(!FOODS[a]||!FOODS[b])return 0;
              return Math.abs(FOODS[a].k-origDens)-Math.abs(FOODS[b].k-origDens);
            });
            sub=candidates[0];
          }
        }
        if(sub){
          var origK=FOODS[food.n]?FOODS[food.n].k:100;
          var subK=FOODS[sub].k||100;
          return{n:sub,g:Math.max(10,Math.round(food.g*(origK/subK)))};
        }
        // CRITICAL FIX: If no substitute found, return EMPTY marker instead of original excluded food
        // This will be filtered out by FINAL CLEANUP stage or by the meal filter below
        // The FINAL CLEANUP will handle removing empty slots and rebalancing
        return{n:'__EXCLUDED__',g:0};  // Marker for exclusion - will be removed by FINAL CLEANUP
      });
    });
  });
  // Filter out the exclusion markers
  result.forEach(function(meals){
    meals.forEach(function(meal){
      if(meal.foods){
        meal.foods = meal.foods.filter(function(f){return f.n !== '__EXCLUDED__';});
      }
    });
  });
  return result;
}

// Λέξεις-κλειδιά που δηλώνουν ρητή αποφυγή μέσα σε μια φράση των ελεύθερων "Προτιμήσεων".
var PREF_AVOID_MARKERS=['οχι ','αποφυγη','αποφευγει','χωρις ','μη ','δεν θελω','δεν τρωει','δεν τρωω','μακρια απο','καθολου '];
// Ειδικές πολυλεκτικές φράσεις που ΔΕΝ πρέπει να λυθούν στη γενική τους κατηγορία (π.χ. "κόκκινο
// κρέας" σημαίνει συγκεκριμένα RED_MEAT_FOODS, όχι όλη την κατηγορία "Κρέας" — αλλιώς θα
// αποκλειόταν και το κοτόπουλο).
//
// "γάλα"/"γαλακτοκομικά" χρειάζονται το ίδιο ειδικό χειρισμό, για αντίθετο λόγο: η κατηγορία
// "Αυγά/Γαλακτ." (η γενική κατηγοριοποίηση-match θα την έβρισκε μέσω "γαλακτ...") ανακατεύει
// αυγά ΜΑΖΙ με το πραγματικό γαλακτοκομικό (γάλα/γιαούρτι/τυριά/whey), ενώ η ξεχωριστή κατηγορία
// "Γαλακτοκομικά" περιέχει μόνο 1 τρόφιμο (Τυρί Cheddar) — confirmed 2026-07-30, βλ.
// [[dietologist-pending-work]]. Χωρίς αυτό, "Αποφεύγει το γάλα" απέκλειε ΜΟΝΟ το Cheddar.
// Υπολογίζεται lazily (όχι hardcoded λίστα σαν RED_MEAT_FOODS) ώστε να ακολουθεί αυτόματα νέα
// γαλακτοκομικά που προστίθενται στο FOODS στο μέλλον, χωρίς να χρειάζεται να ξαναγραφτεί εδώ.
var DAIRY_NOT_ACTUAL_DAIRY=['Αυγά (ολόκληρα)','Ασπράδια αυγών']; // ίδια κατηγορία, αλλά αυγά, όχι γαλακτοκομικό
function dairyFoodsList(){
  var out=[];
  Object.keys(FOODS).forEach(function(n){
    var f=FOODS[n];
    if(!f)return;
    if(f.plantBased)return; // φυτικά "γάλατα" (αμυγδάλου/σόγιας/βρώμης/καρύδας) δεν είναι γαλακτοκομικό
    if(DAIRY_NOT_ACTUAL_DAIRY.indexOf(n)!==-1)return;
    if(f.cat==='Αυγά/Γαλακτ.'||f.cat==='Γαλακτοκομικά') out.push(n);
  });
  return out;
}
// "τυρί"/"τυριά" → ΟΛΑ τα τυριά (όχι όλη η κατηγορία "Αυγά/Γαλακτ." — αυτή ανακατεύει αυγά,
// γιαούρτι, γάλα, whey). Δεν υπάρχει ξεχωριστή κατηγορία μόνο-τυριά, οπότε τα εντοπίζουμε με
// λέξεις-κλειδιά στο όνομα, ΜΕΣΑ στη γαλακτοκομική κατηγορία (ώστε να μη «σκάει» σε πιάτα/συνταγές
// που τυχαία περιέχουν "φέτα" στο όνομα). Υπολογίζεται lazily ώστε νέα τυριά στο FOODS να πιάνονται
// αυτόματα. Το quark μένει ΕΚΤΟΣ επίτηδες (χρησιμοποιείται σαν γιαούρτι-υψηλής-πρωτεΐνης).
var CHEESE_NAME_KEYWORDS=['τυρι','φετα','feta','κασερι','κεφαλοτυρι','κεφαλογραβιερα','λαδοτυρι',
  'γραβιερα','μοτσαρελα','mozzarella','παρμεζανα','parmesan','ανθοτυρο','μυζηθρα','μανουρι',
  'μετσοβονε','κοπανιστη','χαλλουμι','χαλουμι','halloumi','ricotta','ρικοτα','cheddar','τσενταρ',
  'cottage','cream cheese','cheese','edam','γκουντα','gouda','emmental','εμενταλ','σαγανακι',
  'μασκαρπονε','mascarpone','brie','μπρι','camembert','καμαμπερ','roquefort','ροκφορ','blue cheese','μπλε τυρι'];
function cheeseFoodsList(){
  var out=[];
  Object.keys(FOODS).forEach(function(n){
    var f=FOODS[n];
    if(!f||f.plantBased)return;
    if(f.cat!=='Αυγά/Γαλακτ.'&&f.cat!=='Γαλακτοκομικά')return;
    if(DAIRY_NOT_ACTUAL_DAIRY.indexOf(n)!==-1)return;
    var nn=normalizeGreekText(n);
    if(CHEESE_NAME_KEYWORDS.some(function(k){return nn.indexOf(k)!==-1;})) out.push(n);
  });
  return out;
}
// "κόκκινο κρέας" → ΟΛΑ τα πραγματικά κόκκινα κρέατα στο FOODS (μοσχάρι/βοδινό/χοιρινό/αρνί/κατσίκι/
// προβατίνα + επεξεργασμένα: λούτζα/παστουρμάς/σαλάμι/ζαμπόν/μπέικον/λουκάνικο + μοσχαρίσιο συκώτι),
// εντοπισμένα lazily με λέξεις-κλειδιά στο όνομα ώστε νέες καταχωρήσεις κρέατος να πιάνονται αυτόματα —
// αντί για την 5-θέσεων hardcoded RED_MEAT_FOODS (med-score.js), που άφηνε να περνούν π.χ. "Μπριζόλα
// άπαχη", "Βοδινός κιμάς άπαχος (μαγ.)", "Συκώτι μοσχαρίσιο" όταν ο πελάτης έχει γράψει "όχι κόκκινο
// κρέας" στις Προτιμήσεις. Το RED_MEAT_FOODS μένει ως έχει: το χρειάζεται το Mediterranean score
// (μετρά ΜΕΡΕΣ με κόκκινο κρέας), όχι αποκλεισμό τροφίμων. Πουλερικά (κοτόπουλο/γαλοπούλα), κουνέλι
// και φυτικά υποκατάστατα κρέατος ΔΕΝ είναι κόκκινο κρέας. Ίδιο μοτίβο με cheeseFoodsList().
var RED_MEAT_NAME_KEYWORDS=['μοσχαρ','βοδιν','χοιριν','χοιρομερ','αρνι','αρνακ','αρνισ','μπριζολ',
  'παιδακ','κατσικ','γιδιν','προβειο','προβατ','λουτζα','παστουρμα','σαλαμι','προσουτο','ζαμπον',
  'μπεικον','πανσετ','λουκανικ'];
var RED_MEAT_NOT_ACTUAL_RED_MEAT=['κοτοπουλ','γαλοπουλ','κοτετσι','κουνελ']; // πουλερικά/κουνέλι — όχι κόκκινο κρέας
function redMeatFoodsList(){
  var out=[];
  var hard=(typeof RED_MEAT_FOODS!=='undefined')?RED_MEAT_FOODS:[];
  hard.forEach(function(n){ if(FOODS[n]&&out.indexOf(n)===-1) out.push(n); });
  Object.keys(FOODS).forEach(function(n){
    var f=FOODS[n];
    if(!f||f.plantBased)return; // φυτικά "burger" (Moving Mountains κ.λπ.) δεν είναι κόκκινο κρέας
    var nn=normalizeGreekText(n);
    if(RED_MEAT_NOT_ACTUAL_RED_MEAT.some(function(p){return nn.indexOf(p)!==-1;}))return;
    if(RED_MEAT_NAME_KEYWORDS.some(function(k){return nn.indexOf(k)!==-1;})&&out.indexOf(n)===-1) out.push(n);
  });
  return out;
}
var PREF_PHRASE_MAP={
  'κοκκινο κρεας':redMeatFoodsList,
  'γαλα':dairyFoodsList,
  'τυρι':cheeseFoodsList,
  // "όχι φέτα" ως σκέτη φράση — η φέτα είναι το 2ο (όχι κεφαλή) λέξη στο "Τυρί φέτα", οπότε ούτε
  // ο κανόνας λέξης-κεφαλής ούτε το "τυρι" την πιάνουν. Με avoid-marker μπροστά, "φέτα" εννοεί
  // το τυρί (όχι "φέτα ψωμί").
  'φετα':function(){return (typeof FOODS!=='undefined'&&FOODS['Τυρί φέτα'])?['Τυρί φέτα']:[];}
};

// Ελληνικά ουσιαστικά/επίθετα κλίνονται (π.χ. "κρέας"→"κρέατος", "Φιστίκια"→"Φιστικιών") — ένα
// σκέτο substring-match σε ολόκληρη τη λέξη χάνει κλιτούς τύπους. Αντί για πλήρη μορφολογική
// ανάλυση (ρίσκο/πολυπλοκότητα εκτός εμβέλειας εδώ), συγκρίνουμε κοινή "ρίζα": πρόθεμα τουλάχιστον
// 4 χαρακτήρων (ή του 70% της μικρότερης λέξης, όποιο είναι μεγαλύτερο) — αρκετό για τις
// συνηθισμένες καταλήξεις πτώσης/πληθυντικού, αρκετά αυστηρό ώστε να μην ταιριάζει τυχαία σε
// άσχετες μικρές λέξεις (π.χ. "Καρύδια" έναντι "Καρότα" ΔΕΝ ταιριάζουν με αυτό το κατώφλι).
function wordsMatchLoosely(a,b){
  if(!a||!b)return false;
  if(a===b)return true;
  var minLen=Math.min(a.length,b.length);
  if(minLen<4)return false;
  var stemLen=Math.max(4,Math.ceil(minLen*0.7));
  return a.substring(0,stemLen)===b.substring(0,stemLen);
}
// Ελέγχει αν ΟΛΕΣ οι λέξεις μιας φράσης (π.χ. ["κοκκινο","κρεας"]) εμφανίζονται —έστω και σε κλιτό
// τύπο— κάπου μέσα στις λέξεις της πρότασης του πελάτη.
function clauseContainsPhrase(clauseWords,phraseWords){
  if(!phraseWords.length)return false; // άδεια φράση δεν πρέπει ΠΟΤΕ να «ταιριάζει με τα πάντα»
  return phraseWords.every(function(pw){
    return clauseWords.some(function(cw){return wordsMatchLoosely(cw,pw);});
  });
}

// Σαρώνει το ελεύθερο κείμενο "Προτιμήσεις" (π.χ. "Όχι κόκκινο κρέας, Περισσότερο ψάρι") για ρητές
// προτάσεις αποφυγής και τις μετατρέπει σε πραγματικά ονόματα τροφίμων — ώστε το πεδίο να κάνει
// πράγματι αυτό που υπόσχεται στον διαιτολόγο, αντί να είναι σκέτη σημείωση που ο αλγόριθμος ποτέ
// δεν διάβαζε (confirmed 2026-07-30: c.preferences δεν είχε ΚΑΝΕΝΑ call site εκτός του input field).
// Συντηρητική σάρωση, επίτηδες: ταιριάζει ΜΟΝΟ φράσεις με ρητή λέξη-αποφυγής + γνωστή κατηγορία/
// τρόφιμο (έστω και κλιτό — βλ. wordsMatchLoosely). Προτάσεις χωρίς λέξη-αποφυγής (π.χ. μόνο
// "Περισσότερο ψάρι") δεν αγγίζονται καθόλου — μένουν απλή σημείωση όπως πριν, δεν κάνουμε
// μαντεψιά σε ασαφές κείμενο σε εργαλείο διατροφής.
function parsePreferenceAvoidFoods(preferencesText){
  if(!preferencesText)return [];
  var clauses=preferencesText.split(/[,\n;]+/);
  var allCats=[];
  Object.keys(FOODS).forEach(function(n){var c=FOODS[n]&&FOODS[n].cat;if(c&&allCats.indexOf(c)===-1)allCats.push(c);});
  var foods=[];
  clauses.forEach(function(clause){
    var norm=' '+normalizeGreekText(clause)+' ';
    var hasMarker=PREF_AVOID_MARKERS.some(function(m){return norm.indexOf(m)!==-1;});
    if(!hasMarker)return;
    var clauseWords=norm.split(/\s+/).filter(Boolean);

    // Ειδική φράση πρώτα (πιο συγκεκριμένη από τη γενική κατηγορία)
    var matchedPhrase=false;
    Object.keys(PREF_PHRASE_MAP).forEach(function(phrase){
      if(clauseContainsPhrase(clauseWords,phrase.split(' '))){ foods=foods.concat(PREF_PHRASE_MAP[phrase]()); matchedPhrase=true; }
    });
    if(matchedPhrase)return;

    // Ολόκληρη κατηγορία (π.χ. "κρέας"/"κρέατος" → όλα τα τρόφιμα της κατηγορίας "Κρέας")
    var matchedCat=false;
    allCats.forEach(function(cat){
      var catWords=normalizeGreekText(cat).split(/\s+/).filter(Boolean);
      if(clauseContainsPhrase(clauseWords,catWords)){
        Object.keys(FOODS).forEach(function(n){ if(FOODS[n]&&FOODS[n].cat===cat) foods.push(n); });
        matchedCat=true;
      }
    });
    if(matchedCat)return;

    // Συγκεκριμένο τρόφιμο — ταιριάζει αν η πρόταση περιέχει ΕΙΤΕ
    //   (α) ΟΛΕΣ τις ουσιαστικές λέξεις (≥4 χαρακτήρες, αγνοώντας παρενθέσεις) του ονόματος,
    //       έστω σε κλιτό τύπο, ΕΙΤΕ
    //   (β) ΜΟΝΟ τη λέξη-κεφαλή του ονόματος (πρώτη ουσιαστική λέξη) — ώστε το "όχι κοτόπουλο"
    //       να πιάνει "Κοτόπουλο στήθος (ψητό)" / "…μπιφτέκι" / "…σουβλάκι", όχι μόνο τρόφιμα που
    //       ΟΛΟ το όνομά τους είναι εκείνη η μία λέξη (π.χ. "Βρώμη (ωμή)"). Ακριβής ισότητα λέξης-
    //       κεφαλής μετρά πάντα (π.χ. "ρύζι" → όλα τα "Ρύζι …")· χαλαρό (κλιτό) ταίριασμα κεφαλής
    //       μόνο για κεφαλές ≥5 χαρακτήρων, ώστε να μη «σκάει» σε γενικές μικρές λέξεις.
    Object.keys(FOODS).forEach(function(n){
      var nameWords=normalizeGreekText(n).replace(/[()]/g,' ').split(/\s+/).filter(function(w){return w.length>=4;});
      if(!nameWords.length)return;
      var allWords=clauseContainsPhrase(clauseWords,nameWords);
      var head=nameWords[0];
      var headOnly=clauseWords.some(function(cw){ return cw===head || (head.length>=5 && wordsMatchLoosely(cw,head)); });
      if(allWords||headOnly) foods.push(n);
    });
  });
  return foods.filter(function(f,i){return foods.indexOf(f)===i;});
}

// Builds the same merged exclusion list genPlan() itself uses (c.foodExclude + active medical
// protocols' avoidFoods + parsed c.allergies + avoid-phrases parsed from c.preferences) — used so a
// live re-scrub of an ALREADY-generated plan (see scrubExcludedFoodsFromWeekPlan below) matches
// exactly what a fresh regenerate would exclude, not just the picker's own list.
function buildEffectiveExclusionList(c){
  var excl=(c.foodExclude||[]).slice();
  var protocolAvoidFoods=(typeof getProtocolAvoidFoods==='function')?getProtocolAvoidFoods(c):[];
  protocolAvoidFoods.forEach(function(food){ if(excl.indexOf(food)===-1) excl.push(food); });
  if(c.allergies){
    var allergyList=parseAllergies(c.allergies);
    allergyList.forEach(function(a){ if(excl.indexOf(a)===-1) excl.push(a); });
  }
  parsePreferenceAvoidFoods(c.preferences).forEach(function(f){ if(excl.indexOf(f)===-1) excl.push(f); });
  return excl;
}

// Same substitution logic as applyFoodExclusions() above, but mutates an ALREADY-generated
// c.weekPlan in place (a plain object keyed '0'..'6', not an array — see the same note on
// applyDietTypeCategorySafetyNet below) instead of a fresh tmplDays array. Without this, saving
// new exclusions/diet-type rules only takes effect on the NEXT full "Δημιουργία πλάνου" —
// the food the dietitian just excluded keeps showing in the plan already on screen until then,
// which reads as "the save didn't work" even though it did.
function scrubExcludedFoodsFromWeekPlan(weekPlan, excludeList, allergyList){
  if(!weekPlan) return;
  if((!excludeList||!excludeList.length)&&(!allergyList||!allergyList.length)) return;
  var exclNormalized=(excludeList||[]).map(function(x){return normalizeGreekText(x);});
  Object.keys(weekPlan).forEach(function(d){
    if(!weekPlan[d]) return;
    weekPlan[d].forEach(function(meal){
      if(!meal.foods||!meal.foods.length) return;
      meal.foods = meal.foods.map(function(food){
        var isExcluded = foodIsExcludedByNameOrIngredient(food.n,exclNormalized);
        var isAllergy = isFoodAllergy(food.n, allergyList);
        if(!isExcluded && !isAllergy) return food;
        var cat=FOODS[food.n]?FOODS[food.n].cat:'';
        var order=SUBST_ORDER[cat]||[cat];
        var sub=null;
        for(var i=0;i<order.length&&!sub;i++){
          var candidates=Object.keys(FOODS).filter(function(n){
            if(!FOODS[n])return false;
            var notExcluded = !foodIsExcludedByNameOrIngredient(n,exclNormalized);
            var notAllergy = !isFoodAllergy(n, allergyList);
            return FOODS[n].cat===order[i] && notExcluded && notAllergy;
          });
          if(candidates.length){
            var origDens=FOODS[food.n]?FOODS[food.n].k:100;
            candidates.sort(function(a,b){
              if(!FOODS[a]||!FOODS[b])return 0;
              return Math.abs(FOODS[a].k-origDens)-Math.abs(FOODS[b].k-origDens);
            });
            sub=candidates[0];
          }
        }
        if(sub){
          var origK=FOODS[food.n]?FOODS[food.n].k:100;
          var subK=FOODS[sub].k||100;
          return{n:sub,g:Math.max(10,Math.round(food.g*(origK/subK)))};
        }
        return{n:'__EXCLUDED__',g:0};
      }).filter(function(f){return f.n!=='__EXCLUDED__';});
    });
  });
}

// ── Diet-Type Category Safety Net ────────────────────────────────────────────
// Final defense-in-depth pass: regardless of WHICH code path put a food into a meal
// (Mediterranean rules, chef recipes, taste library, saved combos...), this strips
// anything from a category the client's diet type forbids. This matters because saved
// combos carry no dietType tag (see saveCombo()), so the per-path diet checks
// (findSavedComboMatch's dietOK) silently pass an untagged combo through for ANY
// client, including vegan/vegetarian — this catches that regardless of source.
var DIET_TYPE_FORBIDDEN_CATS={
  'vegan':['Κρέας','Ψάρια','Αυγά/Γαλακτ.','Γαλακτοκομικά'],
  'vegetarian':['Κρέας','Ψάρια'],
  // 'Λάδια' (oil) added 2026-07-29 per dietitian request — lets the per-day exceptions grid
  // (buildDietExceptionsHtml) control oil the same way as meat/fish/eggs/dairy: forbidden by
  // default every day, dietitian ticks the days it's allowed (use "Όλες οι μέρες" to allow the
  // whole week in one click, then untick just the strict ξηροφαγία days).
  'orthodox_fasting':['Κρέας','Ψάρια','Αυγά/Γαλακτ.','Γαλακτοκομικά','Λάδια']
};

// exceptionsByDay: optional {dayIndexString: [category,...]} — categories a specific day is
// allowed to keep despite dietType's normal ban (e.g. Ψάρια on a fasting feast day). See
// [[dietologist-taste-library]]/per-day-exceptions plan — c.dietExceptionDays is the caller.
// foodExceptionsByDay: optional {dayIndexString: [foodName,...]} — finer sibling (c.dietFoodExceptionDays)
// letting one specific food through on a day even when its whole category is still forbidden
// that day (e.g. only "Χταπόδι" allowed, not all of Ψάρια).
function applyDietTypeCategorySafetyNet(weekPlan,dietType,exceptionsByDay,foodExceptionsByDay){
  var forbiddenCats=DIET_TYPE_FORBIDDEN_CATS[dietType];
  if(!forbiddenCats||!forbiddenCats.length||!weekPlan)return weekPlan;
  // c.weekPlan is a plain object keyed '0'..'6' (NOT a real Array — c.weekPlan={} then
  // c.weekPlan[d]=... throughout genPlan()), so a numeric `d<weekPlan.length` bound is always
  // undefined and silently skips every day. Iterate its actual keys instead.
  Object.keys(weekPlan).forEach(function(d){
    if(!weekPlan[d])return;
    var dayAllowed=(exceptionsByDay&&exceptionsByDay[d])||[];
    var dayAllowedFoods=(foodExceptionsByDay&&foodExceptionsByDay[d])||[];
    var dayForbidden=dayAllowed.length ? forbiddenCats.filter(function(cat){return dayAllowed.indexOf(cat)===-1;}) : forbiddenCats;
    for(var mi=0;mi<weekPlan[d].length;mi++){
      var meal=weekPlan[d][mi];
      if(!meal.foods||!meal.foods.length)continue;
      meal.foods=meal.foods.map(function(food){
        if(dayAllowedFoods.indexOf(food.n)!==-1)return food; // this specific food is excepted today
        var fd=FOODS[food.n];
        // plantBased:true (data.js, e.g. Γάλα αμυγδάλου/σόγιας/βρώμης) — a dairy-free item that
        // happens to share the 'Αυγά/Γαλακτ.' category with real milk/yogurt/cheese purely for
        // shopping-list/macro-ratio grouping. Never restrict it for vegan/vegetarian/fasting,
        // regardless of category (found 2026-07-29: almond milk was getting swapped for Tofu on
        // every fasting day before this exemption existed).
        if(fd&&fd.plantBased)return food;
        var cat=fd?fd.cat:'';
        // Composite "recipe" FOODS entries (cat:'Συνταγές'/'Συνταγές FYH', e.g. "Κοτόπουλο Pesto
        // & Φέτα" or "Ψάρι στο Φούρνο (FYH)") are tagged generically — their .cat doesn't reveal
        // the meat/fish/egg/dairy actually inside the dish, so without this check they sailed
        // through this safety net completely untouched (found 2026-07-29: a real client reported
        // forbidden foods still appearing in a fasting plan with zero exceptions set). 'containsCats'
        // (data.js) lists any forbidden-category ingredients hiding inside such a dish.
        var hiddenForbidden=(fd&&fd.containsCats)?fd.containsCats.filter(function(hc){return dayForbidden.indexOf(hc)!==-1;}):[];
        // Explicit vegan:false flag (data.js) — catches animal-derived items whose .cat is too
        // broad to forbid wholesale (e.g. Μέλι άβραστο/honey is cat:'Άλλα', shared with plant-safe
        // items like soy sauce/spices, so DIET_TYPE_FORBIDDEN_CATS can't just ban the category).
        // Found 2026-08-01: honey was appearing in every day of vegan clients' plans, unfiltered.
        var explicitlyForbidden=dietType==='vegan' && fd && fd.vegan===false;
        if(dayForbidden.indexOf(cat)===-1 && !hiddenForbidden.length && !explicitlyForbidden)return food;
        // Find a substitute via the existing substitution chain, restricted to allowed categories
        // (for a composite dish, substitute based on its first hidden forbidden category, since
        // its own .cat — e.g. 'Συνταγές FYH' — has no meaningful SUBST_ORDER entry)
        var order=SUBST_ORDER[hiddenForbidden.length?hiddenForbidden[0]:cat]||[hiddenForbidden.length?hiddenForbidden[0]:cat];
        var sub=null;
        for(var i=0;i<order.length&&!sub;i++){
          if(dayForbidden.indexOf(order[i])!==-1)continue; // still forbidden, skip
          var candidates=Object.keys(FOODS).filter(function(n){
            // Never "substitute" a forbidden food with itself (e.g. honey has no same-category
            // gluten/dairy/meat peers, so the closest-kcal match within its own 'Άλλα' category
            // was honey itself — a zero-distance match — silently defeating the vegan:false
            // exclusion above). Also skip any other vegan:false item for vegan clients.
            if(n===food.n)return false;
            if(dietType==='vegan' && FOODS[n] && FOODS[n].vegan===false)return false;
            return FOODS[n]&&FOODS[n].cat===order[i];
          });
          if(candidates.length){
            var origDens=FOODS[food.n]?FOODS[food.n].k:100;
            candidates.sort(function(a,b){
              return Math.abs(FOODS[a].k-origDens)-Math.abs(FOODS[b].k-origDens);
            });
            sub=candidates[0];
          }
        }
        if(sub){
          var origK=FOODS[food.n]?FOODS[food.n].k:100;
          var subK=FOODS[sub].k||100;
          return{n:sub,g:Math.max(10,Math.round(food.g*(origK/subK)))};
        }
        return{n:'__EXCLUDED__',g:0};
      });
      meal.foods=meal.foods.filter(function(f){return f.n!=='__EXCLUDED__';});
    }
  });
  return weekPlan;
}

function buildExcludeHtml(c){
  var excl=c.foodExclude||[];
  var quickBtns='';
  Object.keys(QUICK_EXCL).forEach(function(g){
    var foods=QUICK_EXCL[g];
    var allIn=foods.length>0&&foods.every(function(f){return excl.indexOf(f)!==-1;});
    var gs=g.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    quickBtns+='<button class="excl-qbtn'+(allIn?' active':'')+'" onclick="applyQuickExclude(\''+gs+'\')" title="'+foods.join(', ')+'">'+g+'</button>';
  });
  var tags='';
  excl.forEach(function(name){
    var ns=name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    tags+='<span class="excl-tag">'+name+'<button onclick="toggleFoodExclude(\''+ns+'\')" title="Αφαίρεση">&times;</button></span>';
  });
  var hasExcl=excl.length>0;
  return '<div class="excl-wrap">'
    +'<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">'
    +'<span class="excl-title">🚫 Αποκλεισμός τροφίμων</span>'
    +(hasExcl?'<button class="excl-clear" onclick="clearAllExcludes()">Καθαρισμός όλων</button>':'')
    +'</div>'
    +'<div class="excl-quick-row">'+quickBtns+'</div>'
    +'<div class="excl-search-row">'
    +'<input class="excl-inp" id="excl-inp" placeholder="Αναζήτηση τροφίμου για αποκλεισμό..." oninput="showExclSug(this)" onblur="setTimeout(function(){var s=document.getElementById(\'excl-sug\');if(s)s.classList.remove(\'open\');},200)" autocomplete="off">'
    +'<div class="excl-sug" id="excl-sug"></div>'
    +'</div>'
    +(hasExcl?'<div class="excl-tags">'+tags+'</div>':'<div style="font-size:10px;color:var(--text-muted);margin-top:2px">Κανένα τρόφιμο αποκλεισμένο — χρησιμοποιούνται όλα</div>')
    +'</div>';
}

function renderExclWrap(){
  var c=getC();if(!c)return;
  var el=document.querySelector('.excl-wrap');if(!el)return;
  var tmp=document.createElement('div');
  tmp.innerHTML=buildExcludeHtml(c);
  el.parentNode.replaceChild(tmp.firstChild,el);
}

function toggleFoodExclude(name){
  var c=getC();if(!c)return;
  if(!c.foodExclude)c.foodExclude=[];
  var idx=c.foodExclude.indexOf(name);
  if(idx>-1)c.foodExclude.splice(idx,1);
  else c.foodExclude.push(name);
  save();renderExclWrap();
  // ✅ FIX: Refilter the meal plan to remove excluded foods
  if(c.weekPlan && Object.keys(c.weekPlan).length > 0){
    refilterMealPlanExclusions(c);
  }
}

function applyQuickExclude(groupKey){
  var c=getC();if(!c)return;
  if(!c.foodExclude)c.foodExclude=[];
  var foods=QUICK_EXCL[groupKey];
  if(!foods)return;
  var allIn=foods.every(function(f){return c.foodExclude.indexOf(f)!==-1;});
  if(allIn){
    foods.forEach(function(f){var i=c.foodExclude.indexOf(f);if(i>-1)c.foodExclude.splice(i,1);});
  } else {
    foods.forEach(function(f){if(c.foodExclude.indexOf(f)===-1)c.foodExclude.push(f);});
  }
  save();renderExclWrap();
  // ✅ FIX: Refilter the meal plan to remove/add excluded foods
  if(c.weekPlan && Object.keys(c.weekPlan).length > 0){
    refilterMealPlanExclusions(c);
  }
}

/* ✅ REFILTER: Remove excluded foods from existing meal plan without regenerating */
function refilterMealPlanExclusions(c){
  if(!c || !c.weekPlan || !c.foodExclude || c.foodExclude.length === 0) return;

  var excl = c.foodExclude;
  var exclNormalized = excl.map(function(x){ return normalizeGreekText(x); });

  // Filter each meal's foods
  for(var d=0; d<7; d++){
    if(!c.weekPlan[d]) continue;
    for(var mi=0; mi<c.weekPlan[d].length; mi++){
      var meal = c.weekPlan[d][mi];
      if(!meal.foods || meal.foods.length === 0) continue;

      // Remove excluded foods
      meal.foods = meal.foods.filter(function(food){
        var foodName = (food.n || '');
        var foodNameNormalized = normalizeGreekText(foodName);

        // Check exact match
        if(excl.indexOf(foodName) !== -1) return false;

        // Check normalized match (handles accents)
        for(var ei=0; ei<exclNormalized.length; ei++){
          if(foodNameNormalized.indexOf(exclNormalized[ei]) !== -1){
            return false; // Exclude this food
          }
        }
        return true; // Keep this food
      });
    }
  }

  // Save and re-render
  save();
  renderWeekTable(); // Update the display
}

function showExclSug(inp){
  var q=(inp.value||'').toLowerCase().trim();
  var sug=document.getElementById('excl-sug');
  if(!sug)return;
  if(!q){sug.classList.remove('open');return;}
  var c=getC();if(!c)return;
  var excl=c.foodExclude||[];
  var matches=Object.keys(FOODS).filter(function(n){
    return n.toLowerCase().indexOf(q)!==-1&&excl.indexOf(n)===-1;
  }).slice(0,12);
  if(!matches.length){sug.classList.remove('open');return;}
  sug.innerHTML='';
  matches.forEach(function(n){
    var div=document.createElement('div');
    div.className='excl-sug-item';
    var span1=document.createElement('span');
    span1.textContent=n;
    var span2=document.createElement('span');
    span2.className='excl-sug-cat';
    span2.textContent=FOODS[n].cat||'';
    div.appendChild(span1);
    div.appendChild(span2);
    div.addEventListener('mousedown',function(){addFoodExclude(n);});
    sug.appendChild(div);
  });
  sug.classList.add('open');
}

function addFoodExclude(name){
  var c=getC();if(!c)return;
  if(!c.foodExclude)c.foodExclude=[];
  if(c.foodExclude.indexOf(name)===-1)c.foodExclude.push(name);
  save();renderExclWrap();
}

function clearAllExcludes(){
  var c=getC();if(!c)return;
  c.foodExclude=[];
  save();renderExclWrap();
}


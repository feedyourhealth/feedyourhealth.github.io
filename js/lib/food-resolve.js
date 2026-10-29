// js/lib/food-resolve.js
// resolveFood (alias -> canonical FOODS key), cm (grams -> macros + na/sf; recurses through
// FYH_RECIPE_EXPAND), getFoodColorHex. Extracted from js/app-part1.js (module split wave 5).
// Data-only deps (FOODS, FOOD_ALIASES, FYH_RECIPE_EXPAND, NA_SF); showErrorToast is typeof-guarded.
// Loads after data/* + lib/helpers.js, before core/templates.js (its load-time template
// mutation calls cm()).

// ── Food name aliases: παλιά/εναλλακτικά ονόματα → κανονικό κλειδί στο FOODS ──
// Διορθώνει αποθηκευμένα πλάνα που χρησιμοποιούν διαφορετική ονομασία (αλλιώς cm() έδινε 0 macros)
function resolveFood(n){return (FOODS[n]?n:(FOOD_ALIASES[n]||n));}
function cm(n,g){
  // Expandable recipe → derive macros from its (scaled) ingredients, so the
  // single-line recipe and its opened-up ingredients always show the same totals.
  var rx=(typeof FYH_RECIPE_EXPAND!=='undefined')&&FYH_RECIPE_EXPAND[n];
  if(rx&&rx.ing.every(function(ing){return FOODS[resolveFood(ing.n)];})){
    var scale=(g||rx.base)/rx.base,R={k:0,p:0,c:0,f:0,fi:0,na:0,sf:0};
    rx.ing.forEach(function(ing){var v=cm(ing.n,ing.g*scale);R.k+=v.k;R.p+=v.p;R.f+=v.f;R.c+=v.c;R.fi+=v.fi;R.na+=v.na;R.sf+=v.sf;});
    return{k:+R.k.toFixed(1),p:+R.p.toFixed(1),f:+R.f.toFixed(1),c:+R.c.toFixed(1),fi:+R.fi.toFixed(1),na:Math.round(R.na),sf:+R.sf.toFixed(1)};
  }
  var key=resolveFood(n);var f=FOODS[key];
  if(!f){
    if(typeof console!=='undefined'&&console.warn)console.warn('[cm] Τρόφιμο χωρίς μακροθρεπτικά (δεν βρέθηκε στο FOODS):',n);
    if(typeof window!=='undefined'){
      window._missingFoodWarned=window._missingFoodWarned||{};
      if(!window._missingFoodWarned[n]){
        window._missingFoodWarned[n]=true;
        if(typeof showErrorToast==='function')showErrorToast('⚠️ Η τροφή "'+n+'" δεν βρέθηκε στη βάση τροφίμων — υπολογίζεται ως 0 θερμίδες. Ενημέρωσε τον προγραμματιστή.');
      }
    }
    f={k:0,p:0,c:0,f:0,fi:0};
  }
  // na (mg) / sf (g κορεσμένα) από τον NA_SF (js/data/sodium-satfat.js) — 2026-10-15.
  var ns=(typeof NA_SF!=='undefined'&&NA_SF[key])||[0,0];
  return{k:+(g/100*f.k).toFixed(1),p:+(g/100*f.p).toFixed(1),f:+(g/100*f.f).toFixed(1),c:+(g/100*f.c).toFixed(1),fi:+(g/100*(f.fi||0)).toFixed(1),na:Math.round(g/100*ns[0]),sf:+(g/100*ns[1]).toFixed(1)};}

// ── Μετονομασίες τροφίμων: εφάπαξ ενημέρωση αποθηκευμένων δεδομένων (2026-10-29) ──
// Το FOOD_ALIASES κρατά σωστά τα macros για παλιά ονόματα, αλλά FOOD_UNITS/PORTIONS κ.λπ. διαβάζονται με
// το ακριβές όνομα — γι' αυτό οι πελάτες (πλάνα, ιστορικό, αποκλεισμοί…), τα πρότυπα και οι αποθηκευμένοι
// συνδυασμοί γράφονται μία φορά με το νέο όνομα. Αλλάζει ΜΟΝΟ τιμή/κλειδί ακριβώς ίσο με το παλιό όνομα.
// Χωρίς σημαία έκδοσης: ο έλεγχος τρέχει σε κάθε φόρτωση και αποθηκεύει ΜΟΝΟ αν άλλαξε κάτι — έτσι ένα
// load χωρίς παλιά ονόματα δεν ανεβάζει τίποτα στο cloud (tests/sync_test.py).
var FOOD_RENAMES={'Πατάτες':'Πατάτες (βρ.)',
  // 2026-10-29: όσπρια = βρασμένο βάρος· γλυκοπατάτα με τιμές ψητής· γαλοπούλα ψητή (≠ αλλαντικό)
  'Φασόλια':'Φασόλια (βρ.)','Ρεβίθια':'Ρεβίθια (βρ.)','Φακές':'Φακές (βρ.)','Μαυρομάτικα':'Μαυρομάτικα (βρ.)','Φάβα':'Φάβα (βρ.)','Γλυκοπατάτα':'Γλυκοπατάτα (ψητή)','Γαλοπούλα στήθος':'Γαλοπούλα στήθος (ψητό)',
  'Σαρδέλες':'Σαρδέλες (κονσέρβα, νερό)'};
function renameFoodsDeep(o){
  var n=0;
  if(Array.isArray(o)){
    for(var i=0;i<o.length;i++){
      if(typeof o[i]==='string'&&FOOD_RENAMES[o[i]]){o[i]=FOOD_RENAMES[o[i]];n++;}
      else if(o[i]&&typeof o[i]==='object')n+=renameFoodsDeep(o[i]);
    }
  } else if(o&&typeof o==='object'){
    Object.keys(o).forEach(function(k){
      var v=o[k];
      if(typeof v==='string'&&FOOD_RENAMES[v]){o[k]=FOOD_RENAMES[v];n++;}
      else if(v&&typeof v==='object')n+=renameFoodsDeep(v);
      if(FOOD_RENAMES[k]&&!(FOOD_RENAMES[k] in o)){o[FOOD_RENAMES[k]]=o[k];delete o[k];n++;}
    });
  }
  return n;
}
// Τρέχει μετά τη φόρτωση από το cloud (Cloud._afterLoadMigrations, js/app-part7.js).
function runFoodRenameMigration(){
  var changed=false;
  if(typeof clients!=='undefined'&&clients&&renameFoodsDeep(clients))changed=true;
  if(typeof customTemplates!=='undefined'&&customTemplates&&renameFoodsDeep(customTemplates))changed=true;
  if(typeof safeStorageGet==='function'&&typeof safeStorageSet==='function'){
    var combos=safeStorageGet('savedCombos',[]);
    if(combos&&renameFoodsDeep(combos)){
      safeStorageSet('savedCombos',combos);
      if(typeof _savedCombosCache!=='undefined')_savedCombosCache=combos;
    }
  }
  if(changed&&typeof save==='function')save();
}

/* ✅ Get food color HEX value based on category - RETURNS HEX COLOR */
function getFoodColorHex(foodName){
  var fk=resolveFood(foodName);
  if(!FOODS[fk])return '#F8B739'; // Default carbs (gold)
  var cat=(FOODS[fk].cat||'');

  // PROTEINS (🔵 Blue #5DADE2)
  if(cat==='Κρέας'||cat==='Ψάρια'||cat==='Όσπρια'||cat==='Αμινοξέα & Πρωτεΐνες')
    return '#5DADE2';

  // CARBS (🟡 Gold #F8B739)
  if(cat==='Δημητριακά'||cat==='Συνταγές'||cat==='Άλλα'||cat==='Συνταγές FYH')
    return '#F8B739';

  // VEGETABLES (🟢 Green #52B788)
  if(cat==='Λαχανικά')
    return '#52B788';

  // DAIRY (🩷 Pink #E8A0BF)
  if(cat==='Αυγά/Γαλακτ.')
    return '#E8A0BF';

  // FRUITS (🟣 Purple #C77DFF)
  if(cat==='Φρούτα')
    return '#C77DFF';

  // GRAINS/NUTS (🟠 Amber #FFB703)
  if(cat==='Ξηροί καρποί')
    return '#FFB703';

  // OILS/FATS (🧡 Orange #FB8500)
  if(cat==='Λάδια')
    return '#FB8500';

  // SPICES & HERBS (🟤 Cinnamon #B5651D)
  if(cat==='Μπαχαρικά')
    return '#B5651D';

  // SUPPLEMENTS & SPECIAL (🟦 Teal #06A77D)
  if(cat==='Βιταμίνες & Μέταλλα'||cat==='Αναβολικά & Ορμόνες'||cat==='Ύπνος & Αποκατάσταση'||
     cat==='Pre-Workout'||cat==='⚡ Ενέργεια & Ασφάλεια'||cat==='🧘 Pilates / Yoga'||
     cat==='🥗 Διατροφή & Μακροθρεπτικά'||cat==='🥊 Πολεμικές τέχνες'||cat==='🚶 Περπάτημα'||
     cat==='🚴 Ποδηλασία'||cat==='🔥 Μεταβολισμός / BMR'||cat==='📐 Σωματική Σύνθεση'||
     cat==='💃 Χορός / Αερόβιο'||cat==='🏋️ Βάρη / Γυμναστική'||cat==='🏊 Κολύμβηση'||
     cat==='🏃 Τρέξιμο'||cat==='🏂 Υπαίθριες / Χειμερινές'||cat==='🎾 Ρακέτα / Αντισφαίριση'||
     cat==='⚽ Ομαδικά αθλήματα')
    return '#06A77D';

  return '#F8B739'; // Default
}


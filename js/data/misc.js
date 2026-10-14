// js/data/misc.js
// Split out of js/data.js (module split wave 1). Pure data, no logic except isLegumeFood().
// Contents: MACRO_TYPE, GOAL_*, DIET_TYPE_BADGE, GREEK_MONTHS, FYH_COMPLETE_MEAL, FYH_RECIPE_EXPAND, FYH_DEFAULT_MAIN, FREE_MEAL_MARKER, MED_PLAN + med-diet consts, isLegumeFood, PETRETZEAKIS_*, FX

var MACRO_TYPE={
  'Κρέας':'p','Ψάρια':'p','Αυγά/Γαλακτ.':'p','Όσπρια':'p',
  'Δημητριακά':'c','Φρούτα':'c',
  'Λάδια':'f','Ξηροί καρποί':'f'
  // Βήμα 2a: 'Όσπρια' προστέθηκε στο 'p' bucket ώστε φακές/ρεβίθια/tofu/hummus να κλιμακώνονται
  // με τον λόγο πρωτεΐνης (ratioP) και όχι με τον θερμιδικό (ratioK). Πριν, σε φυτικά/νηστίσιμα
  // πλάνα η κύρια πηγή πρωτεΐνης δεν ανέβαινε ποτέ προς τον στόχο. Cap στο SCALE_CATS['Όσπρια'].
  // Λαχανικά, Συνταγές FYH, Άλλα → fallback to calorie ratio
};
var GOAL_LABELS={loss:'Απώλεια βάρους',mild:'Ήπια απώλεια',maintain:'Διατήρηση',gain:'Αύξηση μάζας',football:'⚽ Ποδόσφαιρο',running:'🏃 Δρομείς',
  kcal2000:'2000 kcal',kcal2300:'2300 kcal',kcal2500:'2500 kcal',kcal2700:'2700 kcal',kcal3000:'3000 kcal',
  mediterranean:'🫒 Μεσογειακή Διατροφή'};
var GOAL_KEYS=['loss','mild','maintain','gain','football','running','kcal2000','kcal2300','kcal2500','kcal2700','kcal3000','mediterranean'];
// Short badge labels for a client/template's dietType — used wherever a saved plan/template
// needs to show which diet it was built for (template manager list, "Βάση πλάνου" dropdown).
var DIET_TYPE_BADGE={normal:'',vegetarian:'🥬 Χορτοφαγική',vegan:'🌱 Vegan',keto:'⚡ Κετογονική',
  orthodox_fasting:'✝️ Νηστεία',intermittent_fasting:'⏰ Intermittent Fasting',
  bodybuilding_clean:'🏋️ Bodybuilding Clean',kids_10_14:'👧 Παιδιά 10-14',mediterranean:'🫒 Μεσογειακή'};
var GREEK_MONTHS=['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος','Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'];
var FYH_COMPLETE_MEAL={
  'Αυγολέμονο Κυπριακό':1,
  'Korean Beef Bowl':1,
  'Chicken Lettuce Wraps':1,
  'Κοτόπουλο Pesto & Φέτα':1,
  'Σαλάτα Φακής Μεσογειακή':1,
  'Μπουλγκούρ-Κινόα Κοτόπουλο':1,
  'Ψάρι στο Φούρνο (FYH)':1,
  'Ρύζι-Φακές Stir Fry':1,
  'Protein Pancakes (FYH)':1,
  'Pancakes Κυριακής (FYH)':1,
  'Βρώμη Πρωινού (FYH)':1,
  'Πρωινό Αυγών (FYH)':1,
  'Τοστ Αυγών (FYH)':1,
  'Γιαούρτι Granola (FYH)':1,
  'Chia Pudding (FYH)':1,
  'Πίτα Αυγών (FYH)':1,
  'Green Protein Smoothie (FYH)':1,
  'Berry Protein Smoothie (FYH)':1,
  // Petretzeakis Breakfast Recipes
  'Breakfast Burrito (Πετρετζίκης)':1,
  'Chia Bowl Φράουλα (Πετρετζίκης)':1,
  'Overnight Oats Banoffee (Πετρετζίκης)':1,
  'Overnight Oats Black Forest (Πετρετζίκης)':1,
  'Overnight Oats P.B. & Choco (Πετρετζίκης)':1,
  'Αυγά Ποσέ Air Fryer (Πετρετζίκης)':1,
  'Ομελέτα Γαλοπούλα & Λαχ. (Πετρετζίκης)':1,
  // Main Course Recipes
  'Λιγκουίνι με Γαρίδες (Πετρετζίκης)':1,
  'Fajita Wrap Κοτόπουλο':1
};
var FYH_RECIPE_EXPAND={
  'Βρώμη Πρωινού (FYH)':{base:375,ing:[
    {n:'Βρώμη (ωμή)',g:40},
    {n:'Γάλα αμυγδάλου',g:160},
    {n:'Φυστικοβούτυρο',g:16},
    {n:'Μπανάνα',g:120},
    {n:'Chia seeds',g:10}
  ]},
  'Πρωινό Αυγών (FYH)':{base:200,ing:[
    {n:'Αυγά (ολόκληρα)',g:110},
    {n:'Ψωμί σίκαλης',g:40},
    {n:'Αβοκάντο',g:50}
  ]},
  'Τοστ Αυγών (FYH)':{base:165,ing:[
    {n:'Αυγά (ολόκληρα)',g:110},
    {n:'Ψωμί σίκαλης',g:45},
    {n:'Μέλι άβραστο',g:7}
  ]},
  'Γιαούρτι Granola (FYH)':{base:310,ing:[
    {n:'Γιαούρτι 2%',g:120},
    {n:'Γκρανόλα χωρίς ζάχαρη',g:40},
    {n:'Μπανάνα',g:150}
  ]},
  'Chia Pudding (FYH)':{base:370,ing:[
    {n:'Chia seeds',g:20},
    {n:'Γάλα αμυγδάλου',g:200},
    {n:'Μήλο',g:150}
  ]},
  'Πίτα Αυγών (FYH)':{base:235,ing:[
    {n:'Αυγά (ολόκληρα)',g:110},
    {n:'Πίτα αραβική',g:55},
    {n:'Cottage cheese',g:30},
    {n:'Σαλάτα εποχής',g:30},
    {n:'Ελαιόλαδο',g:7}
  ]},
  'Green Protein Smoothie (FYH)':{base:375,ing:[
    {n:'Γάλα αμυγδάλου',g:240},
    {n:'Πρωτεΐνη σκόνη (whey)',g:30},
    {n:'Μπανάνα',g:60},
    {n:'Σπανάκι',g:30},
    {n:'Φυστικοβούτυρο',g:16}
  ]},
  'Berry Protein Smoothie (FYH)':{base:247,ing:[
    {n:'Γιαούρτι 2%',g:120},
    {n:'Μούρα',g:80},
    {n:'Πρωτεΐνη σκόνη (whey)',g:30},
    {n:'Chia seeds',g:10},
    {n:'Μέλι άβραστο',g:7}
  ]},
  'Breakfast Burrito (Πετρετζίκης)':{base:420,ing:[
    {n:'Τορτίλια (large)',g:60},
    {n:'Αυγά (ολόκληρα)',g:150},
    {n:'Σπανάκι',g:30},
    {n:'Κασέρι',g:30},
    {n:'Πατάτες',g:100},
    {n:'Πιπεριά κόκκινη',g:50},
    {n:'Ελαιόλαδο',g:5}
  ]},
  'Chia Bowl Φράουλα (Πετρετζίκης)':{base:385,ing:[
    {n:'Γιαούρτι 2%',g:150},
    {n:'Βρώμη (ωμή)',g:40},
    {n:'Chia seeds',g:15},
    {n:'Φράουλες',g:80},
    {n:'Αμύγδαλα',g:15},
    {n:'Μέλι άβραστο',g:5}
  ]},
  'Overnight Oats Banoffee (Πετρετζίκης)':{base:430,ing:[
    {n:'Βρώμη (ωμή)',g:50},
    {n:'Γάλα αμυγδάλου',g:200},
    {n:'Μπανάνα',g:80},
    {n:'Φυστικοβούτυρο',g:20},
    {n:'Μέλι άβραστο',g:10},
    {n:'Σταφύλια',g:10}
  ]},
  'Overnight Oats Black Forest (Πετρετζίκης)':{base:425,ing:[
    {n:'Βρώμη (ωμή)',g:50},
    {n:'Γάλα πλήρες',g:200},
    {n:'Μούρα',g:80},
    {n:'Κεράσια',g:40},
    {n:'Αμύγδαλα',g:10},
    {n:'Πρωτεΐνη σκόνη (whey)',g:20},
    {n:'Μέλι άβραστο',g:8}
  ]},
  'Overnight Oats P.B. & Choco (Πετρετζίκης)':{base:470,ing:[
    {n:'Βρώμη (ωμή)',g:50},
    {n:'Γάλα αμυγδάλου',g:200},
    {n:'Φυστικοβούτυρο',g:25},
    {n:'Μέλι άβραστο',g:25},
    {n:'Μπανάνα',g:60}
  ]},
  'Αυγά Ποσέ Air Fryer (Πετρετζίκης)':{base:370,ing:[
    {n:'Αυγά (ολόκληρα)',g:100},
    {n:'Ψωμί ολικής άλεσης',g:60},
    {n:'Αβοκάντο',g:60},
    {n:'Τομάτες',g:80},
    {n:'Σπανάκι',g:30},
    {n:'Ελαιόλαδο',g:8}
  ]},
  'Ομελέτα Γαλοπούλα & Λαχ. (Πετρετζίκης)':{base:360,ing:[
    {n:'Ασπράδια αυγών',g:120},
    {n:'Cream cheese',g:30},
    {n:'Γαλοπούλα στήθος',g:60},
    {n:'Πιπεριά κόκκινη',g:50},
    {n:'Κρεμμύδι',g:30},
    {n:'Μανιτάρια',g:40},
    {n:'Ελαιόλαδο',g:8},
    {n:'Ψωμί ολικής άλεσης',g:30}
  ]},
  'Λιγκουίνι με Γαρίδες (Πετρετζίκης)':{base:350,ing:[
    {n:'Μακαρόνια (βρ.)',g:130},
    {n:'Γαρίδες (βραστές)',g:155},
    {n:'Κρεμμύδι',g:35},
    {n:'Σκόρδο',g:5},
    {n:'Ελαιόλαδο',g:15},
    {n:'Τομάτες',g:100},
    {n:'Λεμόνι',g:5}
  ]},
  'Fajita Wrap Κοτόπουλο':{base:420,ing:[
    {n:'Τορτίλια (large)',g:60},
    {n:'Κοτόπουλο στήθος (ψητό)',g:150},
    {n:'Πιπεριά κόκκινη',g:60},
    {n:'Πιπεριά κίτρινη',g:40},
    {n:'Κρεμμύδι',g:40},
    {n:'Σάλσα κόκκινη',g:30},
    {n:'Cream cheese',g:20},
    {n:'Ελαιόλαδο',g:10}
  ]},
  'Chive & Onion Whipped Tofu Toast':{base:280,ing:[
    {n:'Tofu (σταθερό)',g:125},
    {n:'Ψωμί (σκληρό)',g:50},
    {n:'Τομάτες',g:100},
    {n:'Ελαιόλαδο',g:5},
    {n:'Nutritional yeast',g:5}
  ]},
  'Berries & Cream Instant Oatmeal':{base:330,ing:[
    {n:'Βρώμη (γρήγορης μαγειρέματος)',g:27},
    {n:'Σόγια γάλα (χωρίς ζάχαρη)',g:240},
    {n:'Soy yogurt (χωρίς ζάχαρη)',g:85},
    {n:'Φρέσκα μούρα (ποικιλία)',g:75},
    {n:'Σπόρια λιναριού (αλεσμένα)',g:10}
  ]},
  'Peanut Butter & Jelly Smoothie Bowl':{base:380,ing:[
    {n:'Σόγια γάλα (χωρίς ζάχαρη)',g:360},
    {n:'Μπανάνα (κατεψυγμένη)',g:240},
    {n:'Φράουλες (κατεψυγμένες)',g:225},
    {n:'Φυστικοβούτυρο (φυσικό, χωρίς ζάχαρη)',g:30}
  ]},
  'Mixed Berry & Granola Yogurt Parfait':{base:320,ing:[
    {n:'Κατεψυγμένα μούρα (ποικιλία)',g:65},
    {n:'Soy yogurt (χωρίς ζάχαρη)',g:130},
    {n:'Vegan granola',g:60},
    {n:'Μπανάνα (φρέσκια)',g:60},
    {n:'Σπόρια λιναριού (αλεσμένα)',g:5}
  ]},
  'Wrap με τονοσαλάτα':{base:285,ing:[
    {n:'Τόνος (κονσέρβα)',g:100},
    {n:'Κρεμμύδι',g:20},
    {n:'Πιπεριά κόκκινη',g:30},
    {n:'Καλαμπόκι (κονσέρβα)',g:30},
    {n:'Λεμόνι',g:10},
    {n:'Μαγιονέζα light',g:15},
    {n:'Τορτίλια (large)',g:60},
    {n:'Ρόκα',g:20}
  ]},
  'High Protein Ομελέτα Wrap':{base:445,ing:[
    {n:'Αυγά (ολόκληρα)',g:165},
    {n:'Πίτα αραβική',g:60},
    {n:'Cottage cheese',g:50},
    {n:'Καλαμπόκι (κονσέρβα)',g:40},
    {n:'Μοτσαρέλα',g:50},
    {n:'Γαλοπούλα στήθος',g:45},
    {n:'Ελαιόλαδο',g:20},
    {n:'Ρόκα',g:15}
  ]}
};
var FYH_DEFAULT_MAIN=[
  {n:'Κοτόπουλο στήθος (ψητό)',g:150},
  {n:'Ρύζι καστανό (βρ.)',g:80},
  {n:'Μπρόκολο',g:120},
  {n:'Ελαιόλαδο',g:8}
];
var FREE_MEAL_MARKER='Ελεύθερο γεύμα';
var MED_PLAN={
  0:{Μεσημεριανό:{type:'fixed', foods:[
    {n:'Ρεβίθια',g:200},{n:'Τόνος (κονσέρβα)',g:80},
    {n:'Σαλάτα εποχής',g:100},{n:'Ελαιόλαδο',g:10}
  ]}},
  1:{Μεσημεριανό:{type:'meat',  n:'Κοτόπουλο στήθος (ψητό)'},
     Βραδινό:    {type:'fixed', foods:[
    {n:'Λαβράκι (ψητό)',g:200},{n:'Ρύζι καστανό (βρ.)',g:100},
    {n:'Σαλάτα εποχής',g:100},{n:'Ελαιόλαδο',g:10}
  ]}},
  2:{Μεσημεριανό:{type:'meat',  n:'Κοτόπουλο μπιφτέκι'},
     Βραδινό:    {type:'fixed', foods:[
    {n:'Σολομός (ψητός)',g:200},{n:'Γλυκοπατάτα',g:200},
    {n:'Σαλάτα εποχής',g:100},{n:'Ελαιόλαδο',g:10},{n:'Γιαούρτι 2%',g:150}
  ]}},
  3:{Μεσημεριανό:{type:'fixed', foods:[
    {n:'Φακές',g:200},{n:'Σαρδέλες',g:80},
    {n:'Σαλάτα εποχής',g:100},{n:'Ελαιόλαδο',g:10}
  ]}},
  4:{Μεσημεριανό:{type:'meat',  n:'Κοτόπουλο στήθος (ψητό)'},
     Βραδινό:    {type:'fixed', foods:[
    {n:'Κυπριακή πίτα',g:90},{n:'Κοτόπουλο σουβλάκι',g:200},
    {n:'Γιαούρτι 2%',g:100},{n:'Σαλάτα εποχής',g:100},{n:'Ελαιόλαδο',g:5}
  ]}},
  5:{Μεσημεριανό:{type:'fixed', foods:[
    {n:'Λαβράκι (ψητό)',g:200},{n:'Κινόα (βρ.)',g:100},
    {n:'Σαλάτα εποχής',g:100},{n:'Ελαιόλαδο',g:10}
  ]},
     Βραδινό:    {type:'free'}},
  6:{Μεσημεριανό:{type:'fixed', foods:[
    {n:'Μπριζόλα άπαχη',g:180},{n:'Πλιγούρι (βρ.)',g:100},
    {n:'Γιαούρτι 2%',g:150},{n:'Σαλάτα εποχής',g:100},{n:'Ελαιόλαδο',g:10}
  ]},
     Βραδινό:    {type:'fixed', foods:[
    {n:'Fajita Wrap Κοτόπουλο',g:420},{n:'Σαλάτα εποχής',g:100}
  ]}}
};
var PROT_CATS=['Κρέας','Ψάρια','Αυγά/Γαλακτ.','Όσπρια'];
var GRAIN_CATS=['Δημητριακά'];
var MED_GRAIN_SWAP={
  'Ρύζι άσπρο (βρ.)':'Ρύζι καστανό (βρ.)',
  'Μακαρόνια (βρ.)': 'Πλιγούρι (βρ.)',
  'Κριθαράκι (βρ.)': 'Κινόα (βρ.)',
  'Ψωμί λευκό':      'Ψωμί σίκαλης'
};
var FYH_SNACK_NAMES={
  'Dark Choc Oat Bites':1,'Energy Bites (FYH)':1,'PB Coconut Truffles':1,
  'PB Protein Bars':1,'Muffins Μύρτιλου':1,'Γκρανόλα χωρίς ζάχαρη':1,
  'Protein Pancakes (FYH)':1,'Μπανανόψωμο':1,
  'Endurance Bar Φράουλα (CrudeSnacks)':1,'Endurance Bar Σοκολάτα (CrudeSnacks)':1,
  'Ultra Bar Φράουλα & Τζίντζερ (CrudeSnacks)':1,'Ultra Bar Σοκολάτα (CrudeSnacks)':1
};
var MED_SNACK_FRUITS=['Μήλο','Μπανάνα','Πορτοκάλι','Αχλάδι','Ροδάκινο'];
var MED_SNACK_NUTS=['Καρύδια','Αμύγδαλα','Κάσιους','Φυστίκι Αιγίνης'];
var FRUIT_CAT=['Φρούτα'];
var NUTS_CATS=['Λιπαρά','Ξηροί καρποί'];
var LEGUME_FOODS_LST=['Φακές','Ρεβίθια','Φασόλια','Μαυρομάτικα','Φάβα'];
// isLegumeFood(): LEGUME_FOODS_LST alone missed 11 of the 16 real 'Όσπρια'-category foods (Tofu,
// Edamame, Hummus, Λούπινα, Κανελλίνι, Φασόλια μπορλότι, Γίγαντες, Κουκιά, Αρακάς, Φακές κόκκινες,
// Beyond Beef — none exact-match the 5-name list) — so legume-combo rules silently skipped plant-based
// meals using them. Fixed 2026-07-10 by also accepting anything tagged cat:'Όσπρια' in FOODS.
function isLegumeFood(n){
  return LEGUME_FOODS_LST.indexOf(n)!==-1 || (FOODS[n]&&FOODS[n].cat==='Όσπρια');
}
var OTHER_STARCHES=['Πατάτα','Γλυκοπατάτα','Πατάτες','Ρύζι άσπρο (βρ.)','Ρύζι καστανό (βρ.)','Κριθαράκι (βρ.)','Μακαρόνια (βρ.)'];
var DAIRY_FOODS=['Γιαούρτι','Τυρί','Φέτα','Μοτσαρέλα','Κεφίρ','Κασέρι','Κότατζε'];
var WHITE_PROTEINS=['Κοτόπουλο στήθος (ψητό)','Γαλοπούλα στήθος','Ψάρι','Λαβράκι','Τόνος'];
var VEGETABLES_NEEDING_FAT=['Καρότα','Κολοκύθα','Γλυκοπατάτα','Ντομάτες','Σπανάκι','Μπρόκολο','Κάλε','Πιπεριές'];
var EGG_DAYS={0:1,2:1,4:1}; // Mon=0, Wed=2, Fri=4
var MED_BRK_FRUITS=['Μήλο','Μπανάνα','Πορτοκάλι','Ροδάκινο','Αχλάδι'];
var PETRETZEAKIS_EGG_RECIPES=[
  {n:'Breakfast Burrito (Πετρετζίκης)',g:420},
  {n:'Αυγά Ποσέ Air Fryer (Πετρετζίκης)',g:370},
  {n:'Ομελέτα Γαλοπούλα & Λαχ. (Πετρετζίκης)',g:360}
];
var PETRETZEAKIS_YOGURT_RECIPES=[
  {n:'Chia Bowl Φράουλα (Πετρετζίκης)',g:385}
];
// Λίστα ανταλλαγής φρούτων — global ώστε να τη χρησιμοποιούν και το PDF export (exportPDF) και το client portal snapshot (_buildSnapshot).
var FX=[
  {n:'Ανανάς',     por:'3/4 φλιτζάνι',            porEn:'3/4 cup',               porRu:'3/4 чашки',                    porTr:'3/4 su bardağı',              g:116},
  {n:'Αχλάδι',     por:'1 μικρό',                  porEn:'1 small',               porRu:'1 маленькая',                  porTr:'1 küçük',                     g:110},
  {n:'Βερίκοκα',   por:'4 ολόκληρα',               porEn:'4 whole',               porRu:'4 целых',                      porTr:'4 adet',                      g:150},
  {n:'Γκρέιπφρούτ',por:'1 ολόκληρο',               porEn:'1 whole',               porRu:'1 целый',                      porTr:'1 adet',                      g:330},
  {n:'Δαμάσκηνα',  por:'2 μέτρια',                 porEn:'2 medium',              porRu:'2 средних',                    porTr:'2 orta boy',                  g:140},
  {n:'Καρπούζι',   por:'1 φέτα',                   porEn:'1 slice',               porRu:'1 ломтик',                     porTr:'1 dilim',                     g:380},
  {n:'Κεράσια',    por:'12 μεγάλα',                porEn:'12 large',              porRu:'12 крупных',                   porTr:'12 büyük',                    g:85},
  {n:'Μανταρίνι',  por:'2 μικρά',                  porEn:'2 small',               porRu:'2 маленьких',                  porTr:'2 küçük',                     g:220},
  {n:'Μήλο',       por:'1 μικρό',                  porEn:'1 small',               porRu:'1 маленькое',                  porTr:'1 küçük',                     g:120},
  {n:'Μούρα',      por:'3/4 φλιτζάνι',             porEn:'3/4 cup',               porRu:'3/4 чашки',                    porTr:'3/4 su bardağı',              g:109},
  {n:'Μπανάνα',    por:'½ μεγάλη ή 1 μικρή',       porEn:'½ large or 1 small',    porRu:'½ большого или 1 маленький',   porTr:'½ büyük veya 1 küçük',        g:120},
  {n:'Νεκταρίνι',  por:'1 μέτριο',                 porEn:'1 medium',              porRu:'1 средний',                    porTr:'1 orta boy',                  g:140},
  {n:'Πεπόνι',     por:'3/4 φλιτζάνι',             porEn:'3/4 cup',               porRu:'3/4 чашки',                    porTr:'3/4 su bardağı',              g:280},
  {n:'Πορτοκάλι',  por:'1 μικρό',                  porEn:'1 small',               porRu:'1 маленький',                  porTr:'1 küçük',                     g:180},
  {n:'Ροδάκινο',   por:'1 μέτριο',                 porEn:'1 medium',              porRu:'1 средний',                    porTr:'1 orta boy',                  g:110},
  {n:'Ρόδι',       por:'½ ρόδι (≈ ½ φλιτζ. σπόροι)', porEn:'½ pomegranate (≈ ½ cup arils)', porRu:'½ граната (≈ ½ чашки зёрен)', porTr:'½ nar (≈ ½ su bardağı tane)', g:85},
  {n:'Σταφίδες',   por:'1 κουτ. σούπας',           porEn:'1 tbsp',                porRu:'1 ст. л.',                     porTr:'1 yemek kaşığı',              g:15},
  {n:'Σταφύλια',   por:'17 ρόγες μικρές',          porEn:'17 small grapes',       porRu:'17 маленьких ягод',            porTr:'17 küçük tane',               g:85},
  {n:'Φράουλες',   por:'10 μικρές ή 1¼ φλιτζάνι', porEn:'10 small or 1¼ cup',    porRu:'10 маленьких или 1¼ чашки',    porTr:'10 küçük veya 1¼ su bardağı', g:190}
];

// ═══════════════════════════════════════════════════════════════════════════════════
// 🛡️ ΑΛΛΕΡΓΙΟΓΟΝΑ — αυτόματη συμπλήρωση των λιστών QUICK_EXCL (2026-10-14)
// Οι λίστες του QUICK_EXCL (js/data/portions.js) γράφονταν με το χέρι και ξέφευγαν όποτε έμπαινε
// νέο τρόφιμο: έλειπαν π.χ. Φιστίκια, Φουντούκια, Σουσάμι, Αμυγδαλοβούτυρο (ξηροί καρποί), Τορτίλια
// και Wraps (γλουτένη), Μαγιονέζα και Αυγολέμονο (αυγά). Εδώ κάθε ομάδα συμπληρώνεται αυτόματα με
// λέξεις-κλειδιά στο όνομα ΚΑΙ στα συστατικά κάθε τροφίμου/συνταγής — ό,τι προστεθεί στο FOODS στο
// μέλλον πιάνεται χωρίς να ξαναγραφτεί λίστα. Οι χειροποίητες λίστες μένουν (ό,τι δεν φαίνεται από
// το όνομα, π.χ. PhD Smart Bar → γάλα).
//   kw        = λέξεις-κλειδιά (χωρίς τόνους, πεζά, κομμάτι λέξης· με κενό μπροστά = αρχή λέξης, π.χ. ' rye' όχι «fryer»)
//   not       = φράσεις που αφαιρούνται από το κείμενο πριν τον έλεγχο (π.χ. «γάλα αμυγδάλου» δεν είναι γαλακτοκομικό)
//   skipPlant = τα φυτικά (plantBased) τρόφιμα δεν μπορεί να ανήκουν στην ομάδα (γάλα/αυγά/ψάρι)
//   terms     = λέξεις στο ελεύθερο πεδίο «Αλλεργίες» που σημαίνουν ΟΛΗ την ομάδα (parseAllergies,
//               js/plan-gen/exclusions.js) — π.χ. «ξηροί καρποί» αποκλείει και φιστίκια, φουντούκια, ταχίνι…
// ═══════════════════════════════════════════════════════════════════════════════════
var ALLERGEN_GROUPS={
  '🌰 Ξηροί καρποί':{
    kw:['αμυγδαλ','καρυδι','φουντουκ','φιστικ','φυστικ','κασιου','πεκαν','μακανταμ','ταχιν','σουσαμ','πραλιν',
        'ξηροι καρποι','ξηρων καρπων','peanut','almond','hazelnut','cashew','pistachi','walnut','pecan',
        'macadamia','sesame','tahini','praline','nut butter','mixed nuts','p.b.'],
    not:['μοσχοκαρυδ','nutmeg'],
    terms:['ξηροι καρποι','ξηρους καρπους','ξηρων καρπων','ξηροκαρπ','καρποι','καρπους','nuts','tree nut','peanut','αραπικ']
  },
  '🌾 Γλουτένη':{
    kw:['ψωμ','μακαρον','σπαγγετ','πεννε','κριθαρ','κριθιν','πιτα','πιτες','αλευρ','σιμιγδαλ','κους κους','κουσκους','πλιγουρ',
        'τραχαν','φρυγαν','παξιμαδ','κρακερ','μπισκοτ','κρουασαν','τορτιγ','τορτιλ','λαζαν','παστιτσ','μουσακ','κανελον',
        'ζυμαρικ','πιτσα','σικαλ','σιταρ','βρωμη','βρωμης','μουσλι','γκρανολα','δημητριακ','μπουγατσ','κουλουρ','μπαγκετ',
        'κεικ','τοστ','τηγανιτ','βαφλ','σειταν','μπυρα','noodle','wrap','tortilla','bread','toast','cracker','cookie','biscuit',
        'brioche','bagel','croissant','pasta','pizza',' oat','granola','muesli','cereal','crispbread',' rye','wheat','barley',
        'muffin','pancake','waffle','cake','seitan','couscous','bulgur','spaghetti','penne','lasagn','beer'],
    not:['χωρις γλουτενη','gluten free','gluten-free','lettuce wrap','ριζογκοφρετ','rice cake','goat','buckwheat'],
    terms:['γλουτεν','gluten','κοιλιοκακ','celiac','coeliac','σιταρ','σιτο','wheat']
  },
  '🥚 Αυγά':{
    kw:['αυγ','ομελετ','φριταλ','μαγιονεζ','καρμποναρ','egg','omelet','frittata','mayo','carbonara'],
    not:['αυγοταραχ','eggplant'],
    skipPlant:true,
    terms:['αυγ','egg','ωου','ωα']
  },
  '🥛 Γαλακτοκομικά':{
    kw:['γαλα','γαλακτ','γιαουρτ','τυρι','τυροπιτ','φετα','κασερι','κεφαλοτυρ','γραβιερ','μοτσαρελ','παρμεζαν','ανθοτυρ','μυζηθρ',
        'χαλλουμ','χαλουμ','ρικοτα','κεφιρ','κρεμα γαλακτ','βουτυρο','παγωτ','σαγανακ','μανουρ','milk','yogurt','yoghurt',
        'cheese','cottage','ricotta','mozzarella','parmesan','feta','halloumi','kefir','whey','butter','cream','quark','skyr','casein'],
    not:['γαλα αμυγδαλου','γαλα βρωμης','γαλα καρυδας','γαλα σογιας','γαλα ριζιου','γαλα φουντουκιου','γαλα κασιου','γιαουρτι σογιας',
         'φυστικοβουτ','φιστικοβουτ','αμυγδαλοβουτ','κακαοβουτ','βουτυρο καρπ','peanut butter','almond butter','nut butter','cocoa butter',
         'σογια γαλα','κοκος γαλα','γαλακτοπουλ','coconut milk','almond milk','oat milk','soy milk','soy yogurt','cream of rice','butternut'],
    skipPlant:true,
    terms:['γαλα','γαλακτ','λακτοζ','dairy','milk','lactose','καζειν','casein','whey']
  },
  '🐟 Ψάρια/Θαλ.':{
    kw:['ψαρ','σολομ','τονος','τονου','τονοσαλατ','σαρδελ','μπακαλιαρ','γαριδ','καλαμαρ','χταπ','μυδια','μυδιων','τσιπουρ','λαβρακ','κοκκινοψαρ',
        'αντζουγ','σκουμπρ','γαυρ','ξιφι','πεστροφ','τιλαπια','πανγκασ','αυγοταραχ','θαλασσιν','καβουρ','αστακ','σουπιε','σουπια',
        'salmon','tuna','fish','shrimp','prawn','sushi','sardine','anchov','mackerel','squid','octopus','mussel','crab','lobster','seafood'],
    not:['ψαρονεφρ'],
    skipPlant:true,
    terms:['ψαρ','fish','θαλασσιν','οστρακ','shellfish','seafood','μαλακοστρακ','καρκινοειδ','γαριδ','shrimp']
  },
  // 🫛 Σόγια / 🫘 Όσπρια — 2026-10-14, για τις αλλεργίες του ερωτηματολογίου (soy, legumes). Η σόγια
  // είναι φυτική, οπότε ΔΕΝ έχει skipPlant. Κενό μπροστά = αρχή λέξης (' αρακ' όχι «μαρακούγια»).
  '🫛 Σόγια':{
    kw:['σογι','soy','soja','tofu','τοφου','edamame','ενταμαμε','tempeh','τεμπε','miso','tamari','ταμαρι','textured vegetable protein'],
    not:[],
    terms:['σογι','soy','soja']
  },
  '🫘 Όσπρια':{
    kw:['φασολ','ρεβιθ','φακες','φακη','φακων','μαυροματ',' φαβα','γιγαντ',' κουκι',' αρακ','λουπιν','κανελλιν','μπορλοτ','χουμους',
        'μουτζεντρ','hummus','lentil','chickpea',' bean','falafel','φαλαφελ','lupin'],
    not:['γαριδες γιγαντ','jelly bean','coffee bean','vanilla bean','cocoa bean'],
    terms:['οσπρι','legume','pulses','φασολ','ρεβιθ','φακ','lentil','chickpea','λουπιν','lupin']
  }
};
function _alNorm(s){
  s=String(s||'').toLowerCase();
  try{ s=s.normalize('NFD').replace(/[̀-ͯ]/g,''); }catch(e){}
  return s;
}
// Τα τρόφιμα του FOODS που ανήκουν σε μια ομάδα αλλεργιογόνων (όνομα + συστατικά + συστατικά συνταγής FYH).
function allergenFoodsFor(groupKey){
  var g=ALLERGEN_GROUPS[groupKey];
  if(!g||typeof FOODS==='undefined') return [];
  var out=[];
  Object.keys(FOODS).forEach(function(n){
    var f=FOODS[n]; if(!f) return;
    if(g.skipPlant && f.plantBased) return;
    var parts=[n];
    (f.ingredients||[]).forEach(function(x){ if(x&&x.item) parts.push(x.item); });
    if(typeof FYH_RECIPE_EXPAND!=='undefined' && FYH_RECIPE_EXPAND[n] && FYH_RECIPE_EXPAND[n].ing){
      FYH_RECIPE_EXPAND[n].ing.forEach(function(x){
        // φυτικό συστατικό (π.χ. «Γάλα αμυγδάλου») δεν βάζει τη συνταγή σε ομάδα γάλα/αυγά/ψάρι
        if(g.skipPlant && FOODS[x.n] && FOODS[x.n].plantBased) return;
        parts.push(x.n);
      });
    }
    var hit=parts.some(function(p){
      var t=' '+_alNorm(p)+' ';
      (g.not||[]).forEach(function(ph){ t=t.split(ph).join(' '); });
      return g.kw.some(function(k){ return t.indexOf(k)!==-1; });
    });
    if(hit) out.push(n);
  });
  return out;
}
// Συμπλήρωση των λιστών QUICK_EXCL (μία φορά, στη φόρτωση). Η σειρά και τα ονόματα των κουμπιών δεν αλλάζουν.
// QUICK_EXCL_BASE = οι χειροποίητες λίστες ΠΡΙΝ τη συμπλήρωση — με αυτές αναγνωρίζεται ποιοι πελάτες είχαν
// πατήσει ένα κουμπί-ομάδα με την παλιά λίστα (βλ. migrateClientAllergenExcl, js/plan-gen/exclusions.js).
var QUICK_EXCL_BASE={};
(function(){
  if(typeof QUICK_EXCL==='undefined') return;
  Object.keys(ALLERGEN_GROUPS).forEach(function(key){
    QUICK_EXCL_BASE[key]=(QUICK_EXCL[key]||[]).slice();
    var list=QUICK_EXCL[key]||(QUICK_EXCL[key]=[]);
    allergenFoodsFor(key).forEach(function(n){ if(list.indexOf(n)===-1) list.push(n); });
  });
})();

var FOODS={
/* fi = dietary fiber (g per 100g) — DRI/USDA FoodData Central values */
'Κοτόπουλο στήθος (ψητό)':{k:165,p:31,c:0,f:3.6,fi:0,cat:'Κρέας',en:'Chicken Breast (grilled)'},
'Κοτόπουλο βραστό':{k:168,p:32,c:0,f:3.7,fi:0,cat:'Κρέας',en:'Chicken (boiled)'},
'Κοτόπουλο μπιφτέκι':{k:190,p:20,c:6,f:10,fi:0,cat:'Κρέας',en:'Chicken Patty'},
'Κοτόπουλο σουβλάκι':{k:165,p:31,c:0,f:3.6,fi:0,cat:'Κρέας',en:'Chicken Souvlaki'},
/* Chef Recipes - Άκης Πετρετζάκης */
'High Protein Ομελέτα Wrap':{k:850,p:60,c:40,f:50,fi:4,cat:'Συνταγές',ingredients:[{item:'Αυγά',qty:'3',size:'μεσαία'},{item:'Πίτα αραβική high protein',qty:'1'},{item:'Cottage cheese',qty:'50g'},{item:'Καλαμπόκι',qty:'40g'},{item:'Μοτσαρέλα light',qty:'50g'},{item:'Γαλοπούλα καπνιστή',qty:'3',size:'φέτες'},{item:'Ελαιόλαδο',qty:'2',unit:'κ.σ.'},{item:'Ρόκα',qty:'κατά απόλυτη επιλογή'}],time:'10 λεπτά',en:'High Protein Omelette Wrap'},
'Wrap με τονοσαλάτα':{k:564,p:45,c:43,f:22,fi:6.3,cat:'Συνταγές',ingredients:[{item:'Τόνο σε ελαιόλαδο',qty:'140g',prep:'στραγγισμένο'},{item:'Φρέσκο κρεμμυδάκι',qty:'½'},{item:'Πιπεριά Φλωρίνης',qty:'½'},{item:'Καλαμπόκι',qty:'30g',prep:'κονσέρβα, στραγγισμένο'},{item:'Ξύσμα λεμονιού',qty:'από ½ λεμόνι'},{item:'Χυμό λεμονιού',qty:'1',unit:'κ.σ.'},{item:'Μαγιονέζα light',qty:'1',unit:'κ.σ.'},{item:'Πιπέρι',qty:'κατά απόλυτη επιλογή'},{item:'Τορτίγια',qty:'1',size:'μεγάλη'},{item:'Ρόκα',qty:'20g',prep:'για σερβίρισμα'}],time:'10 λεπτά',en:'Tuna Salad Wrap'},
/* Vegan/Vegetarian Recipes - PickupLimes */
'Chive & Onion Whipped Tofu Toast':{k:408,p:21.9,c:42.5,f:18.1,fi:5,cat:'Συνταγές',ingredients:[{item:'Tofu (σταθερό)',qty:'125g',prep:'στραγγισμένο'},{item:'Nutritional yeast',qty:'5g'},{item:'Apple cider vinegar',qty:'1',unit:'κ.σ.'},{item:'Ελαιόλαδο',qty:'1',unit:'κ.σ.'},{item:'Ξηρό κρεμμύδι',qty:'½',unit:'κ.γ.'},{item:'Σκόρδο (ξηρό)',qty:'½',unit:'κ.γ.'},{item:'Φρέσκο μαϊντανό',qty:'1',unit:'κ.σ.',prep:'ψιλοκομμένο'},{item:'Άνηθος (ξηρός)',qty:'¼',unit:'κ.γ.'},{item:'Αλάτι & πιπέρι',qty:'κατά απόλυτη επιλογή'},{item:'Ψωμί (σκληρό)',qty:'2',size:'φέτες'},{item:'Ντομάτα',qty:'1',size:'μεσαία',prep:'κομμένη σε φέτες'},{item:'Βασιλικό (φρέσκο)',qty:'κατά απόλυτη επιλογή',prep:'ψιλοκομμένο'}],time:'10 λεπτά',en:'Chive & Onion Whipped Tofu Toast'},
'Berries & Cream Instant Oatmeal':{k:379,p:12.9,c:60.6,f:11.5,fi:9.5,cat:'Συνταγές',ingredients:[{item:'Βρώμη (γρήγορης μαγειρέματος)',qty:'27g',prep:'ωμή'},{item:'Κατεψυγμένα μούρα (raspberry)',qty:'8g'},{item:'Σπόρια λιναριού (αλεσμένα)',qty:'1',unit:'κ.σ.'},{item:'Σόγια γάλα (χωρίς ζάχαρη)',qty:'240ml',unit:'ml'},{item:'Soy yogurt (χωρίς ζάχαρη)',qty:'85g'},{item:'Φρέσκα μούρα (ποικιλία)',qty:'75g'},{item:'Γλυκό κάστανο (προαιρετικό)',qty:'½',unit:'κ.σ.',prep:'για γλύκιση'}],time:'8 λεπτά',en:'Berries & Cream Instant Oatmeal'},
'Peanut Butter & Jelly Smoothie Bowl':{k:346,p:12.7,c:45.5,f:15.4,fi:7.9,cat:'Συνταγές',ingredients:[{item:'Σόγια γάλα (χωρίς ζάχαρη)',qty:'360ml',unit:'ml'},{item:'Μπανάνα (κατεψυγμένη)',qty:'2',size:'μέσιες'},{item:'Φράουλες (κατεψυγμένες)',qty:'225g'},{item:'Φυστικοβούτυρο (φυσικό, χωρίς ζάχαρη)',qty:'3',unit:'κ.σ.'},{item:'Toppings (προαιρετικά): chia seeds',qty:'κατά απόλυτη επιλογή'},{item:'Hemp seeds',qty:'κατά απόλυτη επιλογή'},{item:'Φρέσκα μούρα',qty:'κατά απόλυτη επιλογή'},{item:'Granola',qty:'κατά απόλυτη επιλογή'}],time:'5 λεπτά',en:'Peanut Butter & Jelly Smoothie Bowl'},
'Mixed Berry & Granola Yogurt Parfait':{k:461,p:15.2,c:60.3,f:19.2,fi:11,cat:'Συνταγές',ingredients:[{item:'Κατεψυγμένα μούρα (ποικιλία)',qty:'65g',prep:'μικροκύματα 2-3 λεπτά'},{item:'Soy yogurt (χωρίς ζάχαρη)',qty:'130g'},{item:'Vegan granola',qty:'60g',prep:'σπιτική ή αγορασμένη'},{item:'Μπανάνα (φρέσκια)',qty:'½',size:'μέση',prep:'κομμένη σε φέτες'},{item:'Σπόρια λιναριού (αλεσμένα)',qty:'½',unit:'κ.σ.'},{item:'Ταχίνι ή φυστικοβούτυρο (προαιρετικό)',qty:'½',unit:'κ.σ.',prep:'για επιπλέον γεύση'}],time:'5 λεπτά',en:'Mixed Berry & Granola Yogurt Parfait'},
'Κουνέλι (μαγ.)':{k:197,p:29,c:0,f:8,fi:0,cat:'Κρέας',en:'Rabbit (cooked)'},
'Χοιρινό (μπριζόλα)':{k:242,p:27,c:0,f:14,fi:0,cat:'Κρέας',en:'Pork Chop'},
'Μπριζόλα άπαχη':{k:165,p:28,c:0,f:5.4,fi:0,cat:'Κρέας',en:'Lean Steak'},
'Βοδινό άπαχο (ψητό)':{k:204,p:28,c:0,f:8,fi:0,cat:'Κρέας',en:'Lean Beef (grilled)'},
'Βοδινά φιλετάκια':{k:200,p:28,c:0,f:8,fi:0,cat:'Κρέας',en:'Beef Strips'},
'Βοδινά μπιφτέκια (ψημένα)':{k:193,p:28,c:0,f:9.3,fi:0,cat:'Κρέας',en:'Beef Patties (grilled)'},
'Γαλοπούλα στήθος':{k:135,p:30,c:0,f:1,fi:0,cat:'Κρέας',en:'Turkey (roasted)'},
'Κοτόπουλο μπούτι (ψητό)':{k:189,p:27,c:0,f:8.2,fi:0,cat:'Κρέας',en:'Chicken Thigh (grilled)'},
'Μοσχάρι (ψητό)':{k:200,p:28,c:0,f:8,fi:0,cat:'Κρέας',en:'Veal (roasted)'},
'Μοσχάρι κιμάς (μαγ.)':{k:172,p:24.4,c:0,f:7.6,fi:0,cat:'Κρέας',en:'Ground Veal (cooked)'},
'Βοδινός κιμάς (μαγ.)':{k:250,p:26,c:0,f:16,fi:0,cat:'Κρέας',en:'Ground Beef (cooked)'},
'Βοδινός κιμάς άπαχος (μαγ.)':{k:176,p:27,c:0,f:7,fi:0,cat:'Κρέας',en:'Lean Ground Beef (cooked)'},
'Αρνί (ψητό)':{k:258,p:25.5,c:0,f:16.6,fi:0,cat:'Κρέας',en:'Lamb (cooked)'},
'Χοιρινός κιμάς (μαγ.)':{k:285,p:25,c:0,f:20,fi:0,cat:'Κρέας',en:'Ground Pork (cooked)'},
'Ελεύθερο γεύμα':{k:0,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Free Meal'},
'Μέλι άβραστο':{k:304,p:0.3,c:82,f:0,fi:0.2,cat:'Άλλα',en:'Raw Honey'},
'Μαρμελάδα φράουλας':{k:251,p:0.3,c:62,f:0.1,fi:0.9,cat:'Άλλα',en:'Strawberry Jam'},
'Σάλτσα σόγιας (μειωμένο αλάτι)':{k:58,p:6,c:7,f:0.1,fi:0,cat:'Άλλα',en:'Soy Sauce (reduced salt)'},
/* Ψάρια — fi=0 */
'Σολομός (ψητός)':{k:206,p:22,c:0,f:13,fi:0,cat:'Ψάρια',en:'Salmon (grilled)'},
'Λαβράκι (ψητό)':{k:118,p:18,c:0,f:2.4,fi:0,cat:'Ψάρια',en:'Sea Bass (grilled)'},
'Τόνος (κονσέρβα)':{k:116,p:26,c:0,f:1,fi:0,cat:'Ψάρια',en:'Tuna (canned)'},
'Καλαμπόκι (κονσέρβα)':{k:81,p:3,c:18,f:1.2,fi:2.5,cat:'Λαχανικά',en:'Corn (canned)'},
'Ρόκα':{k:25,p:2.6,c:3.7,f:0.7,fi:1.6,cat:'Λαχανικά',en:'Arugula'},
'Μαγιονέζα light':{k:300,p:0.9,c:9,f:28,fi:0,cat:'Καρυκεύματα',en:'Light Mayonnaise'},
'Γαρίδες (βραστές)':{k:99,p:24,c:0,f:0.3,fi:0,cat:'Ψάρια',en:'Shrimp (boiled)'},
'Σαρδέλες':{k:260,p:30,c:0,f:14,fi:0,cat:'Ψάρια',en:'Sardines (canned)'},
'Τσιπούρα (ψητή)':{k:131,p:26,c:0,f:2.9,fi:0,cat:'Ψάρια',en:'Sea Bream (grilled)'},
'Μπακαλιάρος (ψητός)':{k:105,p:22.8,c:0,f:0.9,fi:0,cat:'Ψάρια',en:'Cod (grilled)'},
'Σκουμπρί (ψητό)':{k:239,p:23.8,c:0,f:15.4,fi:0,cat:'Ψάρια',en:'Mackerel (grilled)'},
'Χταπόδι (βρ.)':{k:164,p:29.8,c:4.4,f:2.1,fi:0,cat:'Ψάρια',en:'Octopus (boiled)'},
'Καλαμάρι (ψητό)':{k:170,p:28,c:5.5,f:2.5,fi:0,cat:'Ψάρια',en:'Squid (grilled)'},
'Μύδια (βρ.)':{k:172,p:23.8,c:7.4,f:4.5,fi:0,cat:'Ψάρια',en:'Mussels (boiled)'},
/* Αυγά / Γαλακτοκομικά — fi≈0 */
'Αυγά (ολόκληρα)':{k:143,p:13,c:1.1,f:10,fi:0,cat:'Αυγά/Γαλακτ.',en:'Eggs (whole)'},
'Ασπράδια αυγών':{k:52,p:11,c:0.7,f:0.2,fi:0,cat:'Αυγά/Γαλακτ.',en:'Egg Whites'},
'Γιαούρτι 2%':{k:73,p:10,c:4,f:2,fi:0,cat:'Αυγά/Γαλακτ.',en:'Yogurt 2%'},
'Arla Protein Γιαουρτάκι Σοκολάτα (πουτίγκα)':{k:77,p:10,c:6.6,f:1.5,fi:0,cat:'Αυγά/Γαλακτ.',en:'Arla Protein Chocolate Yogurt (pudding)'},
'Arla Protein Ρόφημα Σοκολάτα':{k:51,p:5.6,c:4.9,f:0.9,fi:0,cat:'Αυγά/Γαλακτ.',en:'Arla Protein Chocolate Drink'},
'Cottage cheese':{k:98,p:11,c:3.4,f:4.3,fi:0,cat:'Αυγά/Γαλακτ.',en:'Cottage Cheese'},
'Cream cheese':{k:342,p:5.9,c:4.1,f:34,fi:0,cat:'Αυγά/Γαλακτ.',en:'Cream Cheese'},
'Τυρί φέτα':{k:264,p:14,c:4,f:21,fi:0,cat:'Αυγά/Γαλακτ.',en:'Feta Cheese'},
'Μοτσαρέλα':{k:300,p:22,c:2.2,f:22,fi:0,cat:'Αυγά/Γαλακτ.',en:'Mozzarella'},
'Γάλα πλήρες':{k:61,p:3.3,c:4.8,f:3.3,fi:0,cat:'Αυγά/Γαλακτ.',en:'Whole Milk'},
'Γάλα αμυγδάλου':{k:17,p:0.6,c:0.5,f:1.4,fi:0.2,cat:'Αυγά/Γαλακτ.',en:'Almond Milk'},
'Πρωτεΐνη σκόνη (whey)':{k:400,p:80,c:10,f:7,fi:0,cat:'Αυγά/Γαλακτ.',en:'Whey Protein Powder'},
'Πρωτεΐνη Αμυγδάλου (Amino Animo Organic)':{k:375,p:55,c:7,f:16,fi:0,cat:'Αυγά/Γαλακτ.',en:'Almond Protein (Amino Animo Organic)'},
'Στραγγιστό γιαούρτι 0%':{k:59,p:10,c:3.6,f:0.4,fi:0,cat:'Αυγά/Γαλακτ.',en:'Strained Yogurt 0%'},
'Γιαούρτι πλήρες 5%':{k:100,p:9,c:4.7,f:5.0,fi:0,cat:'Αυγά/Γαλακτ.',en:'Whole Milk Yogurt 5%'},
'Ανθότυρο':{k:127,p:13,c:0.5,f:8,fi:0,cat:'Αυγά/Γαλακτ.',en:'Anthotyro Cheese'},
'Μυζήθρα':{k:241,p:12,c:3,f:20,fi:0,cat:'Αυγά/Γαλακτ.',en:'Myzithra Cheese'},
'Γάλα σόγιας':{k:54,p:3.3,c:6.3,f:1.8,fi:0.3,cat:'Αυγά/Γαλακτ.',en:'Soy Milk'},
'Γάλα βρώμης':{k:46,p:1.0,c:8.0,f:1.5,fi:0.5,cat:'Αυγά/Γαλακτ.',en:'Oat Milk'},
'Γάλα φρέσκο 1.5% Λιπαρά':{k:46,p:3.3,c:4.7,f:1.5,fi:0,cat:'Αυγά/Γαλακτ.',en:'Fresh Milk 1.5% Fat'},
'Koko Γιαούρτι Καρύδας (Νηστίσιμο)':{k:79,p:0.6,c:8,f:4.9,fi:0.2,cat:'Αυγά/Γαλακτ.',en:'Koko Coconut Yogurt (Vegan)'},
'Γραβιέρα':{k:400,p:28,c:0.5,f:32,fi:0,cat:'Αυγά/Γαλακτ.',en:'Graviera Cheese'},
'Κασέρι':{k:397,p:25,c:1.0,f:32,fi:0,cat:'Αυγά/Γαλακτ.',en:'Kasseri Cheese'},
'Κεφαλοτύρι':{k:454,p:26,c:1.0,f:38,fi:0,cat:'Αυγά/Γαλακτ.',en:'Kefalotyri Cheese'},
'Παρμεζάνα':{k:431,p:38,c:3.2,f:29,fi:0,cat:'Αυγά/Γαλακτ.',en:'Parmesan'},
'Quark (0%)':{k:65,p:12,c:3.5,f:0.2,fi:0,cat:'Αυγά/Γαλακτ.',en:'Quark (0%)'},
'Ricotta':{k:174,p:11.3,c:3.0,f:13,fi:0,cat:'Αυγά/Γαλακτ.',en:'Ricotta'},
'Edam light':{k:235,p:25,c:1.5,f:15,fi:0,cat:'Αυγά/Γαλακτ.',en:'Edam Light'},
'Γαλατάκι σοκολάτα delact χωρίς ζάχαρη':{k:48,p:3.5,c:4.7,f:1.8,fi:0,cat:'Αυγά/Γαλακτ.',en:'Delact Sugar-Free Chocolate Milk Drink'},
'Χαλλούμι (ψητό)':{k:330,p:24,c:1.8,f:26,fi:0,cat:'Αυγά/Γαλακτ.',en:'Halloumi (grilled)'},
'Χαλλούμι (ωμό)':{k:362,p:21,c:2.0,f:30,fi:0,cat:'Αυγά/Γαλακτ.',en:'Halloumi (raw)'},
/* Δημητριακά */
'Βρώμη (ωμή)':{k:389,p:17,c:66,f:7,fi:10.6,cat:'Δημητριακά',en:'Oats (raw)'},
'Ρύζι άσπρο (βρ.)':{k:130,p:2.4,c:28,f:0.3,fi:0.4,cat:'Δημητριακά',en:'White Rice (cooked)'},
'Ρύζι καστανό (βρ.)':{k:123,p:2.6,c:25,f:1,fi:1.8,cat:'Δημητριακά',en:'Brown Rice (cooked)'},
'Κινόα (βρ.)':{k:120,p:4.1,c:21,f:1.9,fi:2.8,cat:'Δημητριακά',en:'Quinoa (cooked)'},
'Μακαρόνια (βρ.)':{k:158,p:5.8,c:30,f:0.9,fi:1.8,cat:'Δημητριακά',en:'Pasta (cooked)'},
'Noodles αυγού (M&S)':{k:132,p:5,c:26.1,f:0.6,fi:1.3,cat:'Δημητριακά',en:'Egg Noodles (M&S)'},
'Κριθαράκι (βρ.)':{k:158,p:5.8,c:31,f:0.9,fi:1.8,cat:'Δημητριακά',en:'Orzo (cooked)'},
'Πλιγούρι (βρ.)':{k:83,p:3,c:19,f:0.2,fi:3.7,cat:'Δημητριακά',en:'Bulgur (cooked)'},
'Ψωμί σίκαλης':{k:250,p:8.5,c:48,f:3.3,fi:6.2,cat:'Δημητριακά',en:'Rye Bread'},
'Ψωμί λευκό':{k:265,p:9,c:49,f:3.2,fi:2.7,cat:'Δημητριακά',en:'White Bread'},
'Ψωμάκι Brioche':{k:321,p:10.5,c:49.2,f:7.5,fi:2.7,cat:'Δημητριακά',en:'Brioche Bun'},
'Ψωμάκι Μπιφτεκιού':{k:284,p:9.86,c:49.01,f:4.55,fi:3.86,cat:'Δημητριακά',en:'Burger Bun'},
'Πίτα αραβική':{k:266,p:9,c:54,f:1.2,fi:1.7,cat:'Δημητριακά',en:'Pita Bread'},
'Κυπριακή πίτα':{k:270,p:8,c:55,f:2,fi:2.0,cat:'Δημητριακά',en:'Cypriot Pita'},
'Τορτίλια (large)':{k:310,p:8,c:52,f:8,fi:3.0,cat:'Δημητριακά',en:'Tortilla (large)'},
'Τορτίλια ολικής άλεσης (Alphamega)':{k:309,p:7.6,c:50,f:7.7,fi:4.7,cat:'Δημητριακά',en:'Whole Wheat Tortilla (Alphamega)'},
'Ρυζογκοφρέτες':{k:387,p:8,c:83,f:3,fi:4.4,cat:'Δημητριακά',en:'Rice Cakes'},
'Μούσλι':{k:350,p:10,c:62,f:6,fi:7.7,cat:'Δημητριακά',en:'Muesli'},
'Ψωμί ολικής άλεσης':{k:247,p:8.7,c:41,f:3.5,fi:6.8,cat:'Δημητριακά',en:'Whole Wheat Bread'},
'Κρίθινο παξιμάδι':{k:341,p:10,c:72,f:2.5,fi:6.5,cat:'Δημητριακά',en:'Barley Rusk'},
'Κους κους (βρ.)':{k:112,p:3.8,c:23,f:0.2,fi:1.4,cat:'Δημητριακά',en:'Couscous (cooked)'},
'Σπαγγέτι ολικής (βρ.)':{k:124,p:5.3,c:25,f:0.8,fi:3.9,cat:'Δημητριακά',en:'Whole Wheat Spaghetti (cooked)'},
'Τραχανάς (βρ.)':{k:87,p:3.2,c:17,f:0.8,fi:2.1,cat:'Δημητριακά',en:'Trahana (cooked)'},
'Φρυγανιές':{k:385,p:9.5,c:74,f:4,fi:3.5,cat:'Δημητριακά',en:'Rusks'},
'Wasa Φρυγανιές Σίκαλης':{k:336,p:9,c:62,f:1.5,fi:19,cat:'Δημητριακά',en:'Wasa Rye Crispbread'},
'Dark Rye Crispbread (Ryvita)':{k:349,p:10.6,c:67.5,f:0.9,fi:14.3,cat:'Δημητριακά'},
'Κράκερ ολικής':{k:431,p:10,c:68,f:13,fi:8.5,cat:'Δημητριακά',en:'Whole Wheat Crackers'},
'Popcorn (αέρας)':{k:387,p:12.9,c:77.8,f:4.5,fi:14.5,cat:'Δημητριακά',en:'Popcorn (air-popped)'},
/* Όσπρια (βρασμένα) — εξαιρετικές πηγές φυτικών ινών */
'Φασόλια':{k:127,p:9,c:23.7,f:0.5,fi:6.3,cat:'Όσπρια',en:'Beans'},
'Ρεβίθια':{k:164,p:9,c:27.4,f:2.6,fi:7.6,cat:'Όσπρια',en:'Chickpeas'},
'Φακές':{k:116,p:9,c:20.1,f:0.4,fi:7.9,cat:'Όσπρια',en:'Lentils'},
'Μαυρομάτικα':{k:116,p:7.7,c:21,f:0.5,fi:6.5,cat:'Όσπρια',en:'Black-eyed Peas'},
'Φάβα':{k:118,p:8.3,c:21,f:0.4,fi:8.3,cat:'Όσπρια',en:'Yellow Split Peas'},
'Γίγαντες (βρ.)':{k:119,p:8.2,c:21.5,f:0.4,fi:5.8,cat:'Όσπρια',en:'Giant Beans (cooked)'},
'Κουκιά (βρ.)':{k:110,p:7.6,c:19.7,f:0.5,fi:5.4,cat:'Όσπρια',en:'Fava Beans (cooked)'},
'Αρακάς (βρ.)':{k:84,p:5.4,c:15.6,f:0.2,fi:5.5,cat:'Όσπρια',en:'Green Peas (cooked)'},
'Φακές κόκκινες (βρ.)':{k:116,p:9,c:19.9,f:0.4,fi:3.4,cat:'Όσπρια',en:'Red Lentils (cooked)'},
'Λούπινα (βρ.)':{k:119,p:15.6,c:9.9,f:2.9,fi:2.8,cat:'Όσπρια',en:'Lupini Beans (cooked)'},
'Κανελλίνι (βρ.)':{k:127,p:8.7,c:22.6,f:0.5,fi:6.3,cat:'Όσπρια',en:'Cannellini Beans (cooked)'},
'Φασόλια μπορλότι (βρ.)':{k:120,p:8.5,c:21.5,f:0.5,fi:6.5,cat:'Όσπρια',en:'Borlotti Beans (cooked)'},
'Tofu (φυσικό)':{k:76,p:8,c:1.9,f:4.8,fi:0.3,cat:'Όσπρια',en:'Tofu (plain)'},
'Edamame (βρ.)':{k:121,p:11,c:8.9,f:5,fi:5.2,cat:'Όσπρια',en:'Edamame (cooked)'},
'Beyond Beef (φυτικός κιμάς)':{k:221,p:17.7,c:6.2,f:15.9,fi:1.2,cat:'Όσπρια',en:'Beyond Beef (plant-based mince)'},
/* Λαχανικά */
'Αγγούρι':{k:16,p:0.7,c:3.6,f:0.1,fi:0.5,cat:'Λαχανικά',en:'Cucumber'},
'Γλυκοπατάτα':{k:86,p:1.6,c:20,f:0.1,fi:3.0,cat:'Λαχανικά',en:'Sweet Potato'},
'Καρότα':{k:41,p:0.9,c:10,f:0.2,fi:2.8,cat:'Λαχανικά',en:'Carrots'},
'Κολοκυθάκια':{k:17,p:1.2,c:3.1,f:0.3,fi:1.0,cat:'Λαχανικά',en:'Zucchini'},
'Καλαμπόκι (ολόκληρο στον ατμό 200g)':{k:172,p:6.6,c:38,f:2.2,fi:4.8,cat:'Λαχανικά',en:'Corn on the Cob (steamed, 200g)'},
'Καλαμπόκι (ολόκληρο στον ατμό 400g - Halvatzis)':{k:344,p:13.2,c:76,f:4.4,fi:9.6,cat:'Λαχανικά',en:'Corn on the Cob (steamed, 400g - Halvatzis)'},
'Κουνουπίδι':{k:25,p:1.9,c:5,f:0.3,fi:2.0,cat:'Λαχανικά',en:'Cauliflower'},
'Μανιτάρια':{k:22,p:3.1,c:3.3,f:0.3,fi:1.0,cat:'Λαχανικά',en:'Mushrooms'},
'Μαρούλι':{k:15,p:1.4,c:2.9,f:0.2,fi:1.3,cat:'Λαχανικά',en:'Lettuce'},
'Μπιζέλια (βραστά/ατμού)':{k:84,p:5.4,c:15.6,f:0.2,fi:5.5,cat:'Λαχανικά',en:'Green Peas (boiled/steamed)'},
'Μελιτζάνες':{k:25,p:1,c:5.9,f:0.2,fi:3.0,cat:'Λαχανικά',en:'Eggplant'},
'Μπρόκολο':{k:34,p:2.8,c:6.6,f:0.4,fi:2.6,cat:'Λαχανικά',en:'Broccoli'},
'Πατάτες':{k:87,p:2,c:20,f:0.1,fi:2.2,cat:'Λαχανικά',en:'Potatoes'},
'Πιπεριές':{k:26,p:1,c:6,f:0.3,fi:2.1,cat:'Λαχανικά',en:'Bell Peppers'},
'Πιπεριά κόκκινη':{k:30,p:1,c:7,f:0.3,fi:2.1,cat:'Λαχανικά',en:'Red Bell Pepper'},
'Πιπεριά κίτρινη':{k:30,p:1,c:7,f:0.3,fi:2.1,cat:'Λαχανικά',en:'Yellow Bell Pepper'},
'Σάλσα κόκκινη':{k:20,p:0.8,c:4,f:0.2,fi:0.8,cat:'Λαχανικά',en:'Red Salsa'},
'Σπανάκι':{k:23,p:2.9,c:3.6,f:0.4,fi:2.2,cat:'Λαχανικά',en:'Spinach'},
'Παντζάρι (βραστό)':{k:44,p:1.7,c:10,f:0.2,fi:2,cat:'Λαχανικά',en:'Beetroot'},
'Παντζάρι (ωμό)':{k:43,p:1.6,c:9.6,f:0.2,fi:2.8,cat:'Λαχανικά',en:'Beetroot (raw)'},
'Σπαράγγια':{k:20,p:2.2,c:3.9,f:0.2,fi:2.1,cat:'Λαχανικά',en:'Asparagus'},
'Τομάτες':{k:18,p:0.9,c:3.9,f:0.2,fi:1.2,cat:'Λαχανικά',en:'Tomatoes'},
'Φασολάκια':{k:35,p:1.9,c:7.9,f:0.2,fi:3.4,cat:'Λαχανικά',en:'Green Beans'},
'Σαλάτα εποχής':{k:18,p:1,c:3.5,f:0.2,fi:1.5,cat:'Λαχανικά',en:'Seasonal Salad'},
/* Φρούτα */
'Μήλο':{k:52,p:0.3,c:14,f:0.2,fi:2.4,cat:'Φρούτα',en:'Apple'},
'Μπανάνα':{k:89,p:1.1,c:23,f:0.3,fi:2.6,cat:'Φρούτα',en:'Banana'},
'Πορτοκάλι':{k:47,p:0.9,c:12,f:0.1,fi:2.4,cat:'Φρούτα',en:'Orange'},
'Φράουλες':{k:32,p:0.7,c:7.7,f:0.3,fi:2.0,cat:'Φρούτα',en:'Strawberries'},
'Μούρα':{k:43,p:1.4,c:10,f:0.3,fi:5.3,cat:'Φρούτα',en:'Mixed Berries'},
'Αχλάδι':{k:57,p:0.4,c:15,f:0.1,fi:3.1,cat:'Φρούτα',en:'Pear'},
'Ροδάκινο':{k:39,p:0.9,c:10,f:0.3,fi:1.5,cat:'Φρούτα',en:'Peach'},
'Κεράσια':{k:63,p:1.06,c:16,f:0.2,fi:2.1,cat:'Φρούτα',en:'Cherries'},
'Ανανάς':{k:50,p:0.5,c:13,f:0.1,fi:1.4,cat:'Φρούτα',en:'Pineapple'},
'Βερίκοκα':{k:48,p:1.4,c:11,f:0.4,fi:2.0,cat:'Φρούτα',en:'Apricots'},
'Γκρέιπφρούτ':{k:42,p:0.8,c:11,f:0.1,fi:1.6,cat:'Φρούτα',en:'Grapefruit'},
'Δαμάσκηνα':{k:46,p:0.7,c:11,f:0.3,fi:1.4,cat:'Φρούτα',en:'Plums'},
'Καρπούζι':{k:30,p:0.6,c:8,f:0.2,fi:0.4,cat:'Φρούτα',en:'Watermelon'},
'Μανταρίνι':{k:53,p:0.8,c:13,f:0.3,fi:1.8,cat:'Φρούτα',en:'Tangerine'},
'Λεμόνι':{k:29,p:1.1,c:9.3,f:0.3,fi:2.8,cat:'Φρούτα',en:'Lemon'},
'Νεκταρίνι':{k:44,p:1.1,c:11,f:0.3,fi:1.7,cat:'Φρούτα',en:'Nectarine'},
'Πεπόνι':{k:34,p:0.8,c:8,f:0.2,fi:0.9,cat:'Φρούτα',en:'Cantaloupe'},
'Σταφίδες':{k:299,p:3.1,c:79,f:0.5,fi:3.7,cat:'Φρούτα',en:'Raisins'},
'Σταφύλια':{k:69,p:0.7,c:18,f:0.2,fi:0.9,cat:'Φρούτα',en:'Grapes'},
'Σύκα φρέσκα':{k:74,p:0.75,c:19.2,f:0.3,fi:2.9,cat:'Φρούτα',en:'Fresh Figs'},
'Σύκα ξερά':{k:249,p:3.3,c:63.9,f:0.9,fi:9.8,cat:'Φρούτα',en:'Dried Figs'},
'Ρόδι':{k:83,p:1.7,c:18.7,f:1.2,fi:4.0,cat:'Φρούτα',en:'Pomegranate'},
'Ακτινίδιο':{k:61,p:1.1,c:14.7,f:0.5,fi:3.0,cat:'Φρούτα',en:'Kiwi'},
'Χουρμάδες (ξερές)':{k:282,p:2.5,c:75,f:0.4,fi:8.0,cat:'Φρούτα',en:'Dates (dried)'},
'Βύσσινο':{k:50,p:1.0,c:12.2,f:0.3,fi:1.6,cat:'Φρούτα',en:'Sour Cherry'},
'Μπανάνα αποξηραμένη':{k:346,p:3.9,c:88,f:1.8,fi:9.9,cat:'Φρούτα',en:'Dried Banana'},
'Βερίκοκα αποξηραμένα':{k:241,p:3.4,c:62.6,f:0.5,fi:7.3,cat:'Φρούτα',en:'Dried Apricots'},
'Δαμάσκηνα αποξηραμένα':{k:240,p:2.2,c:64,f:0.4,fi:7.1,cat:'Φρούτα',en:'Prunes'},
'Cranberries αποξηραμένα':{k:308,p:0.2,c:82.8,f:1.1,fi:5.3,cat:'Φρούτα',en:'Dried Cranberries'},
'Μάνγκο αποξηραμένο':{k:319,p:2.5,c:79,f:1.2,fi:2.4,cat:'Φρούτα',en:'Dried Mango'},
'Ανανάς αποξηραμένος':{k:350,p:1.25,c:83.8,f:0.7,fi:2.4,cat:'Φρούτα',en:'Dried Pineapple'},
'Μήλο αποξηραμένο':{k:243,p:0.9,c:65.9,f:0.3,fi:8.7,cat:'Φρούτα',en:'Dried Apple'},
/* Ξηροί καρποί / Σπόροι / Λάδια */
'Αμύγδαλα':{k:579,p:21,c:22,f:50,fi:12.5,cat:'Ξηροί καρποί',en:'Almonds'},
'Καρύδια':{k:654,p:15,c:14,f:65,fi:6.7,cat:'Ξηροί καρποί',en:'Walnuts'},
'Αβοκάντο':{k:160,p:2,c:9,f:15,fi:6.7,cat:'Ξηροί καρποί',en:'Avocado'},
'Φυστικοβούτυρο':{k:588,p:25,c:20,f:50,fi:5.7,cat:'Ξηροί καρποί',en:'Peanut Butter'},
'Αμυγδαλοβούτυρο':{k:614,p:21,c:21,f:55,fi:10.8,cat:'Ξηροί καρποί',en:'Almond Butter'},
'Chia seeds':{k:486,p:17,c:42,f:31,fi:34.4,cat:'Ξηροί καρποί',en:'Chia Seeds'},
'Σκόνη κακάο':{k:228,p:19.6,c:57.9,f:13.7,fi:33,cat:'Ξηροί καρποί',en:'Cocoa Powder'},
'Ταχίνι':{k:595,p:17,c:23,f:54,fi:9.3,cat:'Ξηροί καρποί',en:'Tahini'},
'Κάσιους':{k:553,p:18,c:30,f:44,fi:3.3,cat:'Ξηροί καρποί',en:'Cashews'},
'Φιστίκια Αιγίνης':{k:562,p:20.2,c:28,f:45.4,fi:10.3,cat:'Ξηροί καρποί',en:'Aegina Pistachios'},
'Φουντούκια':{k:628,p:15,c:17,f:60.8,fi:9.7,cat:'Ξηροί καρποί',en:'Hazelnuts'},
'Κολοκυθόσποροι':{k:559,p:30,c:10.7,f:49,fi:6.0,cat:'Ξηροί καρποί',en:'Pumpkin Seeds'},
'Ηλιόσποροι':{k:584,p:20.8,c:20,f:51.5,fi:8.6,cat:'Ξηροί καρποί',en:'Sunflower Seeds'},
'USN Trust Crunch Bar':{k:355,p:33,c:27,f:14,fi:12,cat:'Ξηροί καρποί',en:'USN Trust Crunch Bar'},
'Σουσάμι':{k:573,p:17.7,c:23.5,f:49.7,fi:11.8,cat:'Ξηροί καρποί',en:'Sesame Seeds'},
'Λιναρόσπορος':{k:534,p:18.3,c:28.9,f:42.2,fi:27.3,cat:'Ξηροί καρποί',en:'Flaxseed'},
'Ελαιόλαδο':{k:884,p:0,c:0,f:100,fi:0,cat:'Λάδια',en:'Olive Oil'},
'Ελιές':{k:115,p:0.8,c:6.3,f:10.7,fi:3.3,cat:'Λάδια',en:'Olives'},
/* ── Καρυκεύματα, βότανα & σάλτσες (μικρές μερίδες, μεγάλη γεύση) ── */
/* Σημ.: το 'Σκόρδο' ορίζεται ήδη παρακάτω ως 'Λαχανικά' — δεν το ξαναορίζουμε εδώ */
'Βασιλικός (φρέσκος)':{k:23,p:3.2,c:2.7,f:0.6,fi:1.6,cat:'Καρυκεύματα',en:'Basil (fresh)'},
'Ρίγανη (ξηρή)':{k:265,p:9,c:69,f:4.3,fi:42.5,cat:'Καρυκεύματα',en:'Oregano (dried)'},
'Θυμάρι (φρέσκο)':{k:101,p:5.6,c:24.5,f:1.7,fi:14,cat:'Καρυκεύματα',en:'Thyme (fresh)'},
'Δυόσμος/Μέντα':{k:70,p:3.8,c:14.9,f:0.9,fi:8,cat:'Καρυκεύματα',en:'Mint'},
'Άνηθος (φρέσκος)':{k:43,p:3.5,c:7,f:1.1,fi:2.1,cat:'Καρυκεύματα',en:'Dill (fresh)'},
'Μαϊντανός (φρέσκος)':{k:36,p:3,c:6.3,f:0.8,fi:3.3,cat:'Καρυκεύματα',en:'Parsley (fresh)'},
'Δεντρολίβανο (φρέσκο)':{k:131,p:3.3,c:20.7,f:5.9,fi:14.1,cat:'Καρυκεύματα',en:'Rosemary (fresh)'},
'Κύμινο':{k:375,p:18,c:44,f:22,fi:10.5,cat:'Καρυκεύματα',en:'Cumin'},
'Πάπρικα':{k:282,p:14,c:54,f:13,fi:35,cat:'Καρυκεύματα',en:'Paprika'},
'Μουστάρδα':{k:66,p:4,c:5,f:3.3,fi:3.3,cat:'Καρυκεύματα',en:'Mustard'},
'Βαλσάμικο ξίδι':{k:88,p:0.5,c:17,f:0,fi:0,cat:'Καρυκεύματα',en:'Balsamic Vinegar'},
'Σάλτσα γιαουρτιού-άνηθου':{k:60,p:4,c:5,f:2.5,fi:0.2,cat:'Καρυκεύματα',en:'Yogurt-Dill Sauce'},
'Πέστο βασιλικού':{k:300,p:5,c:6,f:29,fi:2,cat:'Καρυκεύματα',en:'Basil Pesto'},
'Σάλτσα ντομάτας (μαγειρεμένη)':{k:32,p:1.6,c:7,f:0.2,fi:1.5,cat:'Καρυκεύματα',en:'Tomato Sauce (cooked)'},
'Ταχινοσάλτσα λεμονιού':{k:200,p:6,c:8,f:17,fi:3,cat:'Καρυκεύματα',en:'Lemon Tahini Sauce'},
'Σάλτσα λεμονιού-ελαιολάδου (λαδολέμονο)':{k:240,p:0.2,c:2,f:26,fi:0.2,cat:'Καρυκεύματα',en:'Lemon-Olive Oil Sauce (Ladolemono)'},
'Τζατζίκι':{k:75,p:3.5,c:4,f:4.8,fi:0.3,cat:'Καρυκεύματα',en:'Tzatziki'},
'Σάλτσα σόγιας-μελιού':{k:120,p:3,c:24,f:0.2,fi:0.2,cat:'Καρυκεύματα',en:'Soy-Honey Sauce'},
/* ── Συνταγές feedyourhealth.org ── macros per 100g (calculated from ingredients) */
'Αυγολέμονο Κυπριακό':{k:82,p:7,c:8,f:3.5,fi:0.4,cat:'Συνταγές FYH',en:'Cypriot Avgolemono'},
'Korean Beef Bowl':{k:149,p:11.8,c:17.7,f:3.9,fi:1.5,cat:'Συνταγές FYH',en:'Korean Beef Bowl'},
'Chicken Lettuce Wraps':{k:138,p:22,c:4.4,f:3,fi:1.5,cat:'Συνταγές FYH',en:'Chicken Lettuce Wraps'},
'Κοτόπουλο Pesto & Φέτα':{k:200,p:24,c:1.3,f:10,fi:0.5,cat:'Συνταγές FYH',en:'Chicken Pesto & Feta'},
'Pancakes Κυριακής (FYH)':{k:188,p:13,c:19,f:6,fi:1.5,cat:'Συνταγές FYH',en:'Sunday Pancakes (FYH)'},
'Βρώμη Πρωινού (FYH)':{k:125,p:5,c:17,f:5,fi:4.0,cat:'Συνταγές FYH',en:'Morning Oatmeal (FYH)'},
'Fajita Wrap Κοτόπουλο':{k:157,p:13.2,c:10.7,f:6.7,fi:1.2,cat:'Συνταγές FYH',en:'Chicken Fajita Wrap'},
'Πρωινό Αυγών (FYH)':{k:168,p:9,c:12,f:10,fi:0.8,cat:'Συνταγές FYH',en:'Egg Breakfast (FYH)'},
'Τοστ Αυγών (FYH)':{k:179,p:11,c:18,f:7,fi:2.2,cat:'Συνταγές FYH',en:'Egg Toast (FYH)'},
'Γιαούρτι Granola (FYH)':{k:106,p:5,c:17,f:3,fi:3.5,cat:'Συνταγές FYH',en:'Yogurt & Granola (FYH)'},
'Chia Pudding (FYH)':{k:80,p:3,c:11,f:4,fi:8.0,cat:'Συνταγές FYH',en:'Chia Pudding (FYH)'},
'Πίτα Αυγών (FYH)':{k:147,p:9,c:11,f:8,fi:1.8,cat:'Συνταγές FYH',en:'Egg Pita (FYH)'},
'Green Protein Smoothie (FYH)':{k:81,p:8,c:6,f:3,fi:2.5,cat:'Συνταγές FYH',en:'Green Protein Smoothie (FYH)'},
'Berry Protein Smoothie (FYH)':{k:131,p:16,c:12,f:3,fi:3.5,cat:'Συνταγές FYH',en:'Berry Protein Smoothie (FYH)'},
'Protein Pancakes (FYH)':{k:141,p:10.6,c:14.3,f:3.8,fi:2.0,cat:'Συνταγές FYH',en:'Protein Pancakes (FYH)'},
'Σαλάτα Φακής Μεσογειακή':{k:110,p:5.4,c:8.8,f:5.6,fi:5.5,cat:'Συνταγές FYH',en:'Mediterranean Lentil Salad'},
'Μπουλγκούρ-Κινόα Κοτόπουλο':{k:175,p:11.5,c:13,f:6,fi:3.0,cat:'Συνταγές FYH',en:'Bulgur-Quinoa Chicken'},
'Ψάρι στο Φούρνο (FYH)':{k:165,p:19,c:0,f:10,fi:0.8,cat:'Συνταγές FYH',en:'Baked Fish (FYH)'},
'Ρύζι-Φακές Stir Fry':{k:159,p:7.8,c:29,f:2.2,fi:3.5,cat:'Συνταγές FYH',en:'Rice-Lentil Stir Fry'},
'Γκρανόλα χωρίς ζάχαρη':{k:484,p:9,c:55,f:26,fi:8.0,cat:'Συνταγές FYH',en:'Sugar-Free Granola'},
'Μπανανόψωμο':{k:285,p:5.5,c:40,f:11,fi:2.5,cat:'Συνταγές FYH',en:'Banana Bread'},
'Muffins Μύρτιλου':{k:220,p:5.8,c:30,f:8,fi:2.5,cat:'Συνταγές FYH',en:'Blueberry Muffins'},
'Dark Choc Oat Bites':{k:268,p:8.5,c:34,f:12,fi:4.5,cat:'Συνταγές FYH',en:'Dark Choc Oat Bites'},
'PB Coconut Truffles':{k:430,p:8,c:28,f:34,fi:3.0,cat:'Συνταγές FYH',en:'PB Coconut Truffles'},
'Energy Bites (FYH)':{k:360,p:7,c:58,f:12,fi:5.5,cat:'Συνταγές FYH',en:'Energy Bites (FYH)'},
'PB Protein Bars':{k:370,p:15,c:35,f:19,fi:3.5,cat:'Συνταγές FYH',en:'PB Protein Bars'},
'Σάλτσα Ντομάτας (FYH)':{k:133,p:1.2,c:8,f:11,fi:1.3,cat:'Συνταγές FYH',en:'FYH Tomato Sauce'},
// Petretzeakis Breakfast Recipes
'Breakfast Burrito (Πετρετζίκης)':{k:420,p:18,c:48,f:16,fi:4.5,cat:'Συνταγές FYH',en:'Breakfast Burrito (Petretzikis)'},
'Chia Bowl Φράουλα (Πετρετζίκης)':{k:385,p:15,c:52,f:12,fi:8.0,cat:'Συνταγές FYH',en:'Strawberry Chia Bowl (Petretzikis)'},
'Overnight Oats Banoffee (Πετρετζίκης)':{k:430,p:13,c:54,f:18,fi:7.0,cat:'Συνταγές FYH',en:'Banoffee Overnight Oats (Petretzikis)'},
'Overnight Oats Black Forest (Πετρετζίκης)':{k:425,p:18,c:56,f:12,fi:8.0,cat:'Συνταγές FYH',en:'Black Forest Overnight Oats (Petretzikis)'},
'Overnight Oats P.B. & Choco (Πετρετζίκης)':{k:470,p:16,c:55,f:20,fi:8.0,cat:'Συνταγές FYH',en:'P.B. & Choco Overnight Oats (Petretzikis)'},
'Αυγά Ποσέ Air Fryer (Πετρετζίκης)':{k:370,p:16,c:38,f:18,fi:6.0,cat:'Συνταγές FYH',en:'Air Fryer Poached Eggs (Petretzikis)'},
'Ομελέτα Γαλοπούλα & Λαχ. (Πετρετζίκης)':{k:360,p:32,c:20,f:15,fi:3.0,cat:'Συνταγές FYH',en:'Turkey & Veggie Omelette (Petretzikis)'},
// Main Course Recipes - Petretzeakis
'Λιγκουίνι με Γαρίδες (Πετρετζίκης)':{k:589,p:31,c:65,f:22,fi:4.8,cat:'Συνταγές FYH',en:'Linguine with Shrimp (Petretzikis)'},
/* Ελληνικά τρόφιμα που πρόσθεσε στη βάση */
'Σαγανάκι (τηγανητό)':{k:380,p:24,c:2,f:31,fi:0,cat:'Αυγά/Γαλακτ.',en:'Saganaki (fried cheese)'},
'Γαλακτοπουλο (βρ.)':{k:135,p:25,c:0,f:3,fi:0,cat:'Κρέας',en:'Turkey (boiled)'},
'Κιμάς κοτόπουλο (μαγ.)':{k:165,p:20,c:0,f:9,fi:0,cat:'Κρέας',en:'Ground Chicken (cooked)'},
'Παστέλι':{k:510,p:15,c:60,f:23,fi:8.0,cat:'Ξηροί καρποί',en:'Pastelli (sesame-honey bar)'},
'Χαλβάς σεσαμιού':{k:512,p:15,c:44,f:31,fi:11.0,cat:'Ξηροί καρποί',en:'Sesame Halva'},
'Κουμουατ':{k:71,p:1.9,c:16,f:0.9,fi:6.5,cat:'Φρούτα',en:'Kumquat'},
'Ελιές πράσινες':{k:145,p:1,c:3.8,f:15,fi:2.4,cat:'Λαχανικά',en:'Green Olives'},
'Ελιές μαύρες':{k:165,p:1,c:3.8,f:18,fi:2.4,cat:'Λαχανικά',en:'Black Olives'},
'Αγκινάρες (βρ.)':{k:53,p:3,c:10,f:0.1,fi:5.2,cat:'Λαχανικά',en:'Artichokes (cooked)'},
'Κρεμμύδι':{k:40,p:1.1,c:9,f:0.1,fi:1.7,cat:'Λαχανικά',en:'Onion'},
'Σκόρδο':{k:149,p:6.4,c:33,f:0.5,fi:2.1,cat:'Λαχανικά',en:'Garlic'},
'Κέϊλ (βρ.)':{k:28,p:2.2,c:6.7,f:0.4,fi:2.6,cat:'Λαχανικά',en:'Kale (cooked)'},
'Ραπανάκι':{k:16,p:0.7,c:3.4,f:0.1,fi:1.6,cat:'Λαχανικά',en:'Radish'},
'Αγκινάρες καρδιές (κονσ.)':{k:20,p:1.5,c:3.8,f:0.5,fi:2.0,cat:'Λαχανικά',en:'Artichoke Hearts (canned)'},
'Σούπιες (βρ.)':{k:134,p:25,c:1.6,f:1.4,fi:0,cat:'Ψάρια',en:'Cuttlefish (cooked)'},
'Γαρίδες γίγαντες (βρ.)':{k:115,p:27,c:0,f:0.5,fi:0,cat:'Ψάρια',en:'Jumbo Shrimp (cooked)'},
'Καβούρι (βρ.)':{k:89,p:19,c:0,f:0.7,fi:0,cat:'Ψάρια',en:'Crab (cooked)'},
'Καλαμαράκια (ψητά)':{k:170,p:28,c:5.5,f:2.5,fi:0,cat:'Ψάρια',en:'Baby Squid (grilled)'},
'Φιδάκι (ψητό)':{k:116,p:24,c:1.2,f:1,fi:0,cat:'Ψάρια',en:'Garfish (grilled)'},
'Λούτζα':{k:243,p:24,c:0.5,f:16,fi:0,cat:'Κρέας',en:'Lountza (cured pork loin)'},
'Moving Mountains Burger':{k:270,p:14.3,c:6.1,f:19.8,fi:5,cat:'Κρέας',en:'Moving Mountains Burger'},
'Grillman Chicken Burger':{k:162,p:18,c:6,f:7.4,fi:1.7,cat:'Κρέας',en:'Grillman Chicken Burger'},
'Μπιφτέκι Κοτόπουλο Πηδηχτούλης Κόκορας':{k:115,p:16.8,c:6.7,f:2.4,fi:0.5,cat:'Κρέας',en:'Chicken Patty (Pidichtoulis)'},
/* Τρόφιμα/καρυκεύματα από συνταγές & αποθηκευμένα πλάνα — τιμές USDA ανά 100g */
'Βούτυρο':{k:717,p:0.9,c:0.1,f:81,fi:0,cat:'Λάδια',en:'Butter'},
'Μαργαρίνη light':{k:292,p:0.3,c:1,f:32,fi:0,cat:'Λάδια',en:'Light Margarine'},
'Dark Chocolate 70%':{k:598,p:7.8,c:45.9,f:42.6,fi:10.9,cat:'Άλλα',en:'Dark Chocolate 70%'},
'Φιστίκια':{k:567,p:26,c:16,f:49,fi:8.5,cat:'Ξηροί καρποί',en:'Peanuts'},
'Χυμό ντομάτας':{k:17,p:0.8,c:4.2,f:0.1,fi:0.4,cat:'Λαχανικά',en:'Tomato Juice'},
'Κρεμμυδάκι (φρέσκο)':{k:32,p:1.8,c:7.3,f:0.2,fi:2.6,cat:'Λαχανικά',en:'Spring Onion (fresh)'},
'Λεμόνι (χυμός)':{k:22,p:0.4,c:6.9,f:0.2,fi:0.3,cat:'Φρούτα',en:'Lemon (juice)'},
'Λεμόνι (ξύσμα)':{k:47,p:1.5,c:16,f:0.3,fi:10.6,cat:'Φρούτα',en:'Lemon (zest)'},
'Βασιλικό':{k:23,p:3.2,c:2.7,f:0.6,fi:1.6,cat:'Λαχανικά',en:'Basil'},
'Κύβο λαχανικών':{k:230,p:9,c:18,f:14,fi:0,cat:'Άλλα',en:'Vegetable Stock Cube'},
'Μπούκοβο':{k:282,p:12,c:50,f:14,fi:35,cat:'Άλλα',en:'Bukovo (chili flakes)'},
'Ούζο':{k:225,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Ouzo'},
'Αλάτι':{k:0,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Salt'},
'Αλάτι & μπαχαρικά':{k:0,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Salt & Spices'},
/* Μπαχαρικά & βότανα — ασήμαντη θερμιδική αξία στις δόσεις χρήσης (0 kcal) */
'Κουρκουμάς':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Turmeric'},
'Μαύρο πιπέρι':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Black Pepper'},
'Κανέλα':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Cinnamon'},
'Τζίντζερ':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Ginger'},
'Ρίγανη':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Oregano'},
'Δεντρολίβανο':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Rosemary'},
'Θυμάρι':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Thyme'},
'Δυόσμος':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Mint'},
'Φασκόμηλο':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Sage'},
'Κουμίν':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Cumin'},
'Γλυκάνισος':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Anise'},
'Κορίανδρος':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Coriander'},
'Τσίλι/Καυτερή πιπ.':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Chili Pepper'},
'Κάρδαμο':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Cardamom'},
'Μοσχοκάρυδο':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Nutmeg'},
'Γαρύφαλλο':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Clove'},
'Σαφράνι':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Saffron'},
'Μάραθος':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Fennel'},
'Νερό':{k:0,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Water'},
/* ✅ Προστέθηκαν 2026-07-04 — τροφές που έλειπαν εντελώς από τη βάση (βλ. αντιστοιχίσεις στο FOOD_ALIASES) */
'Τυρί Cheddar':{k:403,p:25,c:1.3,f:33,fi:0,cat:'Γαλακτοκομικά',en:'Cheddar Cheese'},
'Λευκό κρασί':{k:82,p:0.1,c:2.6,f:0,fi:0,cat:'Άλλα',en:'White Wine'},
'Σάλτσα κάρι light':{k:70,p:2,c:6,f:4,fi:1,cat:'Σάλτσες',en:'Light Curry Sauce'},
'Μικτά λαχανικά':{k:35,p:2,c:6,f:0.3,fi:2.5,cat:'Λαχανικά',en:'Mixed Vegetables'},
'Βρώμη (βρ.)':{k:71,p:2.5,c:12,f:1.4,fi:1.7,cat:'Δημητριακά',en:'Oats (cooked)'},
'Κοκος γάλα light':{k:50,p:0.5,c:3,f:4,fi:0,cat:'Άλλα',en:'Light Coconut Milk'},
'Πορτοκαλάδα φρέσκια':{k:45,p:0.7,c:10.4,f:0.2,fi:0.2,cat:'Ροφήματα',en:'Fresh Orange Juice'},
'Ρύζι μαύρο (βρ.)':{k:123,p:2.7,c:25.6,f:1,fi:1.6,cat:'Δημητριακά',en:'Black Rice (cooked)'},
/* ✅ Προστέθηκαν 2026-07-09 — ίδιο μοτίβο: τροφές που έλειπαν εντελώς από τη βάση, εντοπίστηκαν με
   αυτοματοποιημένο έλεγχο κάθε TMPLS/MEAL_RECIPES/SNACK_RECIPES έναντι FOODS+FOOD_ALIASES (βλ. αντιστοιχίσεις παρακάτω) */
'Hummus':{k:166,p:7.9,c:14.3,f:9.6,fi:6,cat:'Όσπρια'},
'Γάλα καρύδας':{k:180,p:1.8,c:3,f:18,fi:0,cat:'Αυγά/Γαλακτ.',en:'Coconut Milk'},
'Σπόροι κολοκύνθης':{k:559,p:30,c:11,f:49,fi:6,cat:'Ξηροί καρποί',en:'Pumpkin Seeds'},
'Σπόροι λιναρόσπορου':{k:534,p:18,c:29,f:42,fi:27,cat:'Ξηροί καρποί',en:'Flaxseed'},
'Ξηρά δαμάσκηνα':{k:240,p:2.2,c:64,f:0.4,fi:7.1,cat:'Φρούτα',en:'Dried Prunes'},
'Κρέμα γάλακτος':{k:340,p:2.1,c:2.8,f:36,fi:0,cat:'Αυγά/Γαλακτ.',en:'Heavy Cream'},
'Λάχανο':{k:25,p:1.3,c:5.8,f:0.1,fi:2.5,cat:'Λαχανικά',en:'Cabbage'},
'Ψάρι - SKIP':{k:0,p:0,c:0,f:0,fi:0,cat:'Άλλα'}, // σκόπιμο placeholder με g:0 σε μερικά vegetarian templates — όχι λείπον τρόφιμο
/* ✅ Προστέθηκαν 2026-07-10 — 2 από τα 4 vegan "PickupLimes" υλικά στο FYH_RECIPE_EXPAND που δεν είχαν
   καμία αντιστοίχιση (βλ. FOOD_ALIASES για τα υπόλοιπα, που αντιστοιχήθηκαν σε ήδη υπάρχοντα τρόφιμα) */
'Nutritional yeast':{k:375,p:50,c:31,f:6,fi:19,cat:'Άλλα'},
'Soy yogurt (χωρίς ζάχαρη)':{k:55,p:3.5,c:4,f:2.5,fi:0.5,cat:'Αυγά/Γαλακτ.',en:'Soy Yogurt (sugar-free)'},
};
var FOOD_PAIRING_DB={
  // ── PROTEINS ────────────────────────────────────────────────────────────────
  'Κοτόπουλο στήθος (ψητό)':{
    flavor_profile:['mild','umami'],
    best_pairings:['σκόρδο','Ντοματες','Μανιτάρια','Λεμόνι','κρεμμύδι','Σπαράγγια','Μπρόκολο'],
    avoid_with:['ψάρι','φακές','Βρώμη','οβελίσκοι'],
    texture:'tender',
    aromatic_herbs:['βασιλικό','θυμάρι','ροσμαρίνι','δίλ'],
    category:'protein'
  },
  'Σολομός (ψητός)':{
    flavor_profile:['umami','rich','delicate'],
    best_pairings:['λεμόνι','δίλ','σπαράγγια','άσπρο κρασί','ελαιόλαδο','αγκινάρες'],
    avoid_with:['τόνος','κοτόπουλο','φακές'],
    texture:'tender',
    aromatic_herbs:['δίλ','φρέσκος δίλ','άνηθος'],
    category:'protein'
  },
  'Λαβράκι (ψητό)':{
    flavor_profile:['umami','delicate','mild'],
    best_pairings:['λεμόνι','δίλ','σπαράγγια','λαχανικά σιγοψημένα','ελαιόλαδο'],
    avoid_with:['τόνος','κοτόπουλο','φακές'],
    texture:'tender',
    aromatic_herbs:['δίλ','φρέσκος δίλ','θυμάρι'],
    category:'protein'
  },
  'Τόνος (κονσέρβα)':{
    flavor_profile:['umami','strong'],
    best_pairings:['λεμόνι','κρεμμύδι','κάπαρη','σέσκουλα','πατάτες','ντοματα'],
    avoid_with:['ψάρι','φακές','λαβράκι','σολομός'],
    texture:'firm',
    aromatic_herbs:['περιγιάλι','μύρωνο'],
    category:'protein'
  },
  'Φακές':{
    flavor_profile:['earthy','mild'],
    best_pairings:['κρεμμύδι','σκόρδο','καρότο','κολιαντρος','γλυκοπατάτα','ρύζι'],
    avoid_with:['τόνος','ψάρι','κοτόπουλο'],
    texture:'firm',
    aromatic_herbs:['κολιαντρος','μύρωνο','κύμινο'],
    category:'protein'
  },
  'Ρεβίθια':{
    flavor_profile:['earthy','creamy'],
    best_pairings:['σκόρδο','κρεμμύδι','ντοματα','κολιαντρος','σπανάκι','καρότο'],
    avoid_with:['ψάρι','κοτόπουλο'],
    texture:'creamy',
    aromatic_herbs:['κολιαντρος','κύμινο','παπρικά'],
    category:'protein'
  },
  'Γαρίδες (βραστές)':{
    flavor_profile:['umami','delicate','sweet'],
    best_pairings:['λεμόνι','σκόρδο','ελαιόλαδο','φρέσκα χόρτα','ρύζι'],
    avoid_with:['τόνος','φακές'],
    texture:'firm',
    aromatic_herbs:['δίλ','περιγιάλι','χιλιανό πιπέρι'],
    category:'protein'
  },
  'Αυγά (ολόκληρα)':{
    flavor_profile:['mild','versatile'],
    best_pairings:['ντοματα','σπανάκι','κρεμμύδι','λαχανικά','μανιτάρια'],
    avoid_with:[],
    texture:'tender',
    aromatic_herbs:['περιγιάλι','θυμάρι'],
    category:'protein'
  },
  // ── CARBOHYDRATES ──────────────────────────────────────────────────────────
  'Ρύζι άσπρο (βρ.)':{
    flavor_profile:['neutral','mild'],
    best_pairings:['σκόρδο','κρεμμύδι','σόγια','κολιαντρος','γαρίδες','κοτόπουλο'],
    avoid_with:[],
    texture:'fluffy',
    aromatic_herbs:['κολιαντρος'],
    category:'carb'
  },
  'Πατάτες':{
    flavor_profile:['earthy','mild'],
    best_pairings:['σκόρδο','ψάρι','τόνος','βούτυρο','ελαιόλαδο','κρεμμύδι'],
    avoid_with:[],
    texture:'creamy',
    aromatic_herbs:['κολιαντρος','θυμάρι'],
    category:'carb'
  },
  'Γλυκοπατάτα':{
    flavor_profile:['sweet','earthy'],
    best_pairings:['κάρι','κολιαντρος','κοτόπουλο','φακές','αφέλια'],
    avoid_with:[],
    texture:'creamy',
    aromatic_herbs:['κολιαντρος','παπρικά'],
    category:'carb'
  },
  'Πίτα αραβική':{
    flavor_profile:['neutral','mild'],
    best_pairings:['κοτόπουλο','φακές','ρεβίθια','λαχανικά'],
    avoid_with:[],
    texture:'chewy',
    aromatic_herbs:[],
    category:'carb'
  },
  // ── VEGETABLES ─────────────────────────────────────────────────────────────
  'Σπαράγγια':{
    flavor_profile:['fresh','umami'],
    best_pairings:['σολομός','λαβράκι','ψάρι','λεμόνι','σκόρδο','ελαιόλαδο'],
    avoid_with:[],
    texture:'tender-crisp',
    aromatic_herbs:['δίλ','λεμόνι'],
    category:'vegetable'
  },
  'Μπρόκολο':{
    flavor_profile:['earthy','fresh'],
    best_pairings:['σκόρδο','κοτόπουλο','σέσκουλα','ελαιόλαδο','λεμόνι'],
    avoid_with:[],
    texture:'crispy',
    aromatic_herbs:['σκόρδο'],
    category:'vegetable'
  },
  'Σπανάκι':{
    flavor_profile:['earthy','mild'],
    best_pairings:['σκόρδο','αυγά','ψάρι','σέσκουλα','κρεμμύδι','ελαιόλαδο'],
    avoid_with:[],
    texture:'tender',
    aromatic_herbs:['σκόρδο','μουσκάτο'],
    category:'vegetable'
  },
  'Ντοματες':{
    flavor_profile:['acidic','umami','fresh'],
    best_pairings:['βασιλικό','σκόρδο','κρεμμύδι','κοτόπουλο','ψάρι','ελαιόλαδο'],
    avoid_with:[],
    texture:'juicy',
    aromatic_herbs:['βασιλικό'],
    category:'vegetable'
  },
  'Μανιτάρια':{
    flavor_profile:['earthy','umami'],
    best_pairings:['σκόρδο','θυμάρι','κοτόπουλο','σέσκουλα','κρεμμύδι'],
    avoid_with:[],
    texture:'tender',
    aromatic_herbs:['θυμάρι','σκόρδο'],
    category:'vegetable'
  },
  'Πιπεριές':{
    flavor_profile:['sweet','mild'],
    best_pairings:['σκόρδο','κρεμμύδι','κοτόπουλο','ντοματα','ελαιόλαδο'],
    avoid_with:[],
    texture:'crisp',
    aromatic_herbs:['κολιαντρος'],
    category:'vegetable'
  },
  // ── AROMATICS/HERBS (μικρές ποσότητες αλλά μεγάλη επίδραση) ─────────────────
  'Λεμόνι':{
    flavor_profile:['acidic','bright','fresh'],
    best_pairings:['όλα τα ψάρια','σκόρδο','δίλ','ελαιόλαδο'],
    avoid_with:[],
    texture:'liquid',
    aromatic_herbs:[],
    category:'acid'
  },
  'Σκόρδο':{
    flavor_profile:['strong','umami','pungent'],
    best_pairings:['όλα τα κρέας','λαχανικά','ελαιόλαδο'],
    avoid_with:[],
    texture:'paste',
    aromatic_herbs:[],
    category:'aromatic'
  },
  // ── CARBS (BREAKFAST ONLY) ───────────────────────────────────────────────
  'Βρώμη':{
    flavor_profile:['mild','nutty','creamy'],
    best_pairings:['μέλι','μπανάνα','κανέλα','αυγά','protein powder','γάλα'],
    avoid_with:['κοτόπουλο','ψάρι','κρέας','λαχανικά'],
    texture:'creamy',
    aromatic_herbs:['κανέλα','βανίλια'],
    category:'carb_breakfast'
  },
  // ── FATS (υγιεινά λάδια) ───────────────────────────────────────────────────
  'Ελαιόλαδο':{
    flavor_profile:['rich','fruity'],
    best_pairings:['όλα'],
    avoid_with:[],
    texture:'smooth',
    aromatic_herbs:[],
    category:'fat'
  }
};
var FOOD_PAIRING_EXT={
  // ── ΚΡΕΑΣ ──
  'Κοτόπουλο μπούτι (ψητό)':{flavor_profile:['rich','umami'],best_pairings:['Πατάτες','Λεμόνι','Σκόρδο','Πιπεριές','Ρύζι καστανό (βρ.)','Μανιτάρια'],avoid_with:['Σολομός (ψητός)','Τόνος (κονσέρβα)'],texture:'tender',aromatic_herbs:['ροσμαρίνι','θυμάρι','πάπρικα'],category:'protein'},
  'Γαλοπούλα στήθος':{flavor_profile:['mild','lean'],best_pairings:['Ρύζι καστανό (βρ.)','Σπανάκι','Μανιτάρια','Πιπεριές','Κινόα (βρ.)'],avoid_with:['Σολομός (ψητός)'],texture:'tender',aromatic_herbs:['θυμάρι','βασιλικό'],category:'protein'},
  'Μοσχάρι (ψητό)':{flavor_profile:['rich','umami','strong'],best_pairings:['Πατάτες','Μανιτάρια','Κρεμμύδι','Καρότα','Πιπεριά κόκκινη'],avoid_with:['Φακές','ψάρι'],texture:'firm',aromatic_herbs:['ροσμαρίνι','θυμάρι'],category:'protein'},
  'Βοδινό άπαχο (ψητό)':{flavor_profile:['rich','umami'],best_pairings:['Πατάτες','Μανιτάρια','Σπαράγγια','Μπρόκολο','Ρύζι καστανό (βρ.)'],avoid_with:['ψάρι'],texture:'firm',aromatic_herbs:['ροσμαρίνι','θυμάρι'],category:'protein'},
  'Μπριζόλα άπαχη':{flavor_profile:['rich','umami'],best_pairings:['Πατάτες','Σαλάτα εποχής','Μανιτάρια','Πιπεριά κόκκινη'],avoid_with:['ψάρι'],texture:'firm',aromatic_herbs:['ροσμαρίνι','πάπρικα'],category:'protein'},
  'Χοιρινό (μπριζόλα)':{flavor_profile:['rich','savory'],best_pairings:['Πατάτες','Μήλο','Λάχανο','Μουστάρδα','Κρεμμύδι'],avoid_with:['ψάρι'],texture:'firm',aromatic_herbs:['θυμάρι','δεντρολίβανο'],category:'protein'},
  'Αρνί (ψητό)':{flavor_profile:['rich','strong'],best_pairings:['Πατάτες','Λεμόνι','Σκόρδο','Γιαούρτι 2%','Μελιτζάνες'],avoid_with:['ψάρι'],texture:'firm',aromatic_herbs:['ροσμαρίνι','δυόσμος','ρίγανη'],category:'protein'},
  'Κουνέλι (μαγ.)':{flavor_profile:['mild','savory'],best_pairings:['Κρεμμύδι','Ντοματες','Σκόρδο','Πατάτες'],avoid_with:['ψάρι'],texture:'tender',aromatic_herbs:['θυμάρι','δάφνη'],category:'protein'},
  // ── ΨΑΡΙΑ ──
  'Τσιπούρα (ψητή)':{flavor_profile:['delicate','umami'],best_pairings:['Λεμόνι','Σπαράγγια','Σκόρδο','Σπανάκι'],avoid_with:['Κοτόπουλο στήθος (ψητό)','Φακές'],texture:'tender',aromatic_herbs:['άνηθος','θυμάρι'],category:'protein'},
  'Μπακαλιάρος (ψητός)':{flavor_profile:['mild','delicate'],best_pairings:['Σκόρδο','Πατάτες','Λεμόνι','Σπανάκι'],avoid_with:['Κοτόπουλο στήθος (ψητό)'],texture:'flaky',aromatic_herbs:['μαϊντανός','σκόρδο'],category:'protein'},
  'Σαρδέλες':{flavor_profile:['umami','strong','oily'],best_pairings:['Λεμόνι','Ρίγανη','Ντοματες','Κρεμμύδι'],avoid_with:['Κοτόπουλο στήθος (ψητό)','γλυκά'],texture:'tender',aromatic_herbs:['ρίγανη','μαϊντανός'],category:'protein'},
  'Σκουμπρί (ψητό)':{flavor_profile:['umami','strong','oily'],best_pairings:['Λεμόνι','Σκόρδο','Μαϊντανός','Πατάτες'],avoid_with:['γλυκά'],texture:'tender',aromatic_herbs:['μαϊντανός','ρίγανη'],category:'protein'},
  'Χταπόδι (βρ.)':{flavor_profile:['umami','delicate'],best_pairings:['Λεμόνι','Ελιές','Ξίδι','Πατάτες','Σκόρδο'],avoid_with:['γαλακτοκομικά'],texture:'tender-firm',aromatic_herbs:['ρίγανη','μαϊντανός'],category:'protein'},
  'Καλαμάρι (ψητό)':{flavor_profile:['delicate','umami'],best_pairings:['Λεμόνι','Σκόρδο','Μαϊντανός','Πιπεριά κόκκινη'],avoid_with:['γαλακτοκομικά'],texture:'tender',aromatic_herbs:['μαϊντανός','σκόρδο'],category:'protein'},
  'Μύδια (βρ.)':{flavor_profile:['umami','briny'],best_pairings:['Σκόρδο','Λεμόνι','Ντοματες','Μαϊντανός'],avoid_with:['γλυκά'],texture:'tender',aromatic_herbs:['μαϊντανός','σκόρδο'],category:'protein'},
  // ── ΟΣΠΡΙΑ / ΦΥΤΙΚΕΣ ΠΡΩΤΕΪΝΕΣ ──
  'Φασόλια':{flavor_profile:['earthy','creamy'],best_pairings:['Κρεμμύδι','Καρότα','Ντοματες','Σκόρδο','Σέλινο'],avoid_with:['ψάρι'],texture:'creamy',aromatic_herbs:['δάφνη','θυμάρι'],category:'protein'},
  'Μαυρομάτικα':{flavor_profile:['earthy','mild'],best_pairings:['Κρεμμύδι','Σπανάκι','Λεμόνι','Ελαιόλαδο','Άνηθος'],avoid_with:['ψάρι'],texture:'tender',aromatic_herbs:['άνηθος','μαϊντανός'],category:'protein'},
  'Φάβα':{flavor_profile:['creamy','earthy'],best_pairings:['Κρεμμύδι','Λεμόνι','Ελαιόλαδο','Κάπαρη'],avoid_with:['ψάρι'],texture:'creamy',aromatic_herbs:['μαϊντανός'],category:'protein'},
  'Γίγαντες (βρ.)':{flavor_profile:['creamy','earthy'],best_pairings:['Ντοματες','Κρεμμύδι','Σκόρδο','Καρότα','Σέλινο'],avoid_with:['ψάρι'],texture:'creamy',aromatic_herbs:['μαϊντανός','δάφνη'],category:'protein'},
  'Tofu (φυσικό)':{flavor_profile:['neutral','mild'],best_pairings:['Σάλτσα σόγιας (μειωμένο αλάτι)','Σκόρδο','Πιπεριά κόκκινη','Μπρόκολο','Ρύζι άσπρο (βρ.)'],avoid_with:[],texture:'soft',aromatic_herbs:['τζίντζερ','σκόρδο'],category:'protein'},
  'Edamame (βρ.)':{flavor_profile:['fresh','mild'],best_pairings:['Σάλτσα σόγιας (μειωμένο αλάτι)','Ρύζι άσπρο (βρ.)','Σουσάμι'],avoid_with:[],texture:'tender',aromatic_herbs:['σουσάμι'],category:'protein'},
  // ── ΓΑΛΑΚΤΟΚΟΜΙΚΑ ──
  'Τυρί φέτα':{flavor_profile:['salty','tangy'],best_pairings:['Ντοματες','Αγγούρι','Ελιές','Πιπεριές','Ρίγανη'],avoid_with:['ψάρι'],texture:'crumbly',aromatic_herbs:['ρίγανη','βασιλικό'],category:'protein'},
  'Χαλλούμι (ψητό)':{flavor_profile:['salty','savory'],best_pairings:['Ντοματες','Δυόσμος','Λεμόνι','Πεπόνι','Πιπεριά κόκκινη'],avoid_with:[],texture:'firm',aromatic_herbs:['δυόσμος','ρίγανη'],category:'protein'},
  'Γιαούρτι 2%':{flavor_profile:['tangy','creamy'],best_pairings:['Μέλι','Μούρα','Βρώμη','Καρύδια','Αγγούρι'],avoid_with:['ψάρι'],texture:'creamy',aromatic_herbs:['δυόσμος'],category:'protein'},
  'Cottage cheese':{flavor_profile:['mild','creamy'],best_pairings:['Ντοματες','Αγγούρι','Μούρα','Βρώμη'],avoid_with:[],texture:'creamy',aromatic_herbs:['σχοινόπρασο'],category:'protein'},
  // ── ΥΔΑΤΑΝΘΡΑΚΕΣ ──
  'Ρύζι καστανό (βρ.)':{flavor_profile:['nutty','mild'],best_pairings:['Σκόρδο','Κοτόπουλο στήθος (ψητό)','Μπρόκολο','Σάλτσα σόγιας (μειωμένο αλάτι)'],avoid_with:[],texture:'firm',aromatic_herbs:['κολιαντρος'],category:'carb'},
  'Κινόα (βρ.)':{flavor_profile:['nutty','earthy'],best_pairings:['Λεμόνι','Ντοματες','Αγγούρι','Μαϊντανός','Σπανάκι'],avoid_with:[],texture:'fluffy',aromatic_herbs:['μαϊντανός','δυόσμος'],category:'carb'},
  'Μακαρόνια (βρ.)':{flavor_profile:['neutral','mild'],best_pairings:['Ντοματες','Σκόρδο','Βασιλικός','Μανιτάρια','Κιμάς'],avoid_with:[],texture:'tender',aromatic_herbs:['βασιλικό','ρίγανη'],category:'carb'},
  'Σπαγγέτι ολικής (βρ.)':{flavor_profile:['nutty','mild'],best_pairings:['Ντοματες','Σκόρδο','Βασιλικός','Γαρίδες (βραστές)','Ελαιόλαδο'],avoid_with:[],texture:'tender',aromatic_herbs:['βασιλικό'],category:'carb'},
  'Κριθαράκι (βρ.)':{flavor_profile:['neutral','mild'],best_pairings:['Ντοματες','Κοτόπουλο στήθος (ψητό)','Μοσχάρι (ψητό)','Φέτα'],avoid_with:[],texture:'tender',aromatic_herbs:['βασιλικό'],category:'carb'},
  'Κους κους (βρ.)':{flavor_profile:['mild','nutty'],best_pairings:['Λαχανικά','Λεμόνι','Δυόσμος','Κοτόπουλο στήθος (ψητό)'],avoid_with:[],texture:'fluffy',aromatic_herbs:['δυόσμος','μαϊντανός'],category:'carb'},
  'Πλιγούρι (βρ.)':{flavor_profile:['nutty','earthy'],best_pairings:['Ντοματες','Μαϊντανός','Λεμόνι','Κρεμμύδι'],avoid_with:[],texture:'tender',aromatic_herbs:['μαϊντανός','δυόσμος'],category:'carb'},
  'Ψωμί ολικής άλεσης':{flavor_profile:['nutty','mild'],best_pairings:['Αυγά (ολόκληρα)','Τυρί φέτα','Ντοματες','Αβοκάντο'],avoid_with:[],texture:'chewy',aromatic_herbs:[],category:'carb'},
  // ── ΛΑΧΑΝΙΚΑ ──
  'Καρότα':{flavor_profile:['sweet','earthy'],best_pairings:['Κύμινο','Μέλι','Κοτόπουλο στήθος (ψητό)','Φακές'],avoid_with:[],texture:'crisp',aromatic_herbs:['κύμινο','κολιαντρος'],category:'vegetable'},
  'Κολοκυθάκια':{flavor_profile:['mild','fresh'],best_pairings:['Σκόρδο','Λεμόνι','Φέτα','Δυόσμος','Ντοματες'],avoid_with:[],texture:'tender',aromatic_herbs:['δυόσμος','βασιλικό'],category:'vegetable'},
  'Μελιτζάνες':{flavor_profile:['earthy','smoky'],best_pairings:['Ντοματες','Σκόρδο','Φέτα','Κιμάς','Ελαιόλαδο'],avoid_with:[],texture:'soft',aromatic_herbs:['βασιλικό','ρίγανη'],category:'vegetable'},
  'Κουνουπίδι':{flavor_profile:['earthy','mild'],best_pairings:['Σκόρδο','Λεμόνι','Κύμινο','Πάπρικα'],avoid_with:[],texture:'tender',aromatic_herbs:['κύμινο','πάπρικα'],category:'vegetable'},
  'Φασολάκια':{flavor_profile:['fresh','earthy'],best_pairings:['Ντοματες','Σκόρδο','Ελαιόλαδο','Πατάτες'],avoid_with:[],texture:'tender',aromatic_herbs:['μαϊντανός'],category:'vegetable'},
  'Πιπεριά κόκκινη':{flavor_profile:['sweet','fresh'],best_pairings:['Σκόρδο','Κρεμμύδι','Κοτόπουλο στήθος (ψητό)','Φέτα','Ελαιόλαδο'],avoid_with:[],texture:'crisp',aromatic_herbs:['βασιλικό','ρίγανη'],category:'vegetable'},
  'Αγγούρι':{flavor_profile:['fresh','cooling'],best_pairings:['Γιαούρτι 2%','Φέτα','Ντοματες','Δυόσμος','Άνηθος'],avoid_with:[],texture:'crisp',aromatic_herbs:['άνηθος','δυόσμος'],category:'vegetable'},
  'Μαρούλι':{flavor_profile:['fresh','mild'],best_pairings:['Λεμόνι','Άνηθος','Κρεμμυδάκι','Ελαιόλαδο'],avoid_with:[],texture:'crisp',aromatic_herbs:['άνηθος'],category:'vegetable'},
  'Σαλάτα εποχής':{flavor_profile:['fresh','mixed'],best_pairings:['Λεμόνι','Ελαιόλαδο','Βαλσάμικο','Φέτα'],avoid_with:[],texture:'crisp',aromatic_herbs:['ρίγανη'],category:'vegetable'},
  'Τομάτες':{flavor_profile:['acidic','umami','fresh'],best_pairings:['Βασιλικός','Φέτα','Ελιές','Κρεμμύδι','Αγγούρι'],avoid_with:[],texture:'juicy',aromatic_herbs:['βασιλικό','ρίγανη'],category:'vegetable'}
};
var SAUCE_DB={
  'Κρέας':[
    {n:'Σάλτσα ντομάτας (μαγειρεμένη)',g:40},
    {n:'Μουστάρδα',g:12},
    {n:'Σάλτσα λεμονιού-ελαιολάδου (λαδολέμονο)',g:12},
    {n:'Τζατζίκι',g:30}
  ],
  'Ψάρια':[
    {n:'Σάλτσα λεμονιού-ελαιολάδου (λαδολέμονο)',g:15},
    {n:'Σάλτσα γιαουρτιού-άνηθου',g:25},
    {n:'Ταχινοσάλτσα λεμονιού',g:18}
  ],
  'Όσπρια':[
    {n:'Σάλτσα ντομάτας (μαγειρεμένη)',g:40},
    {n:'Σάλτσα λεμονιού-ελαιολάδου (λαδολέμονο)',g:12},
    {n:'Ταχινοσάλτσα λεμονιού',g:18}
  ],
  'Αυγά/Γαλακτ.':[
    {n:'Σάλτσα ντομάτας (μαγειρεμένη)',g:30},
    {n:'Πέστο βασιλικού',g:12},
    {n:'Τζατζίκι',g:30}
  ],
  '_asian':[
    {n:'Σάλτσα σόγιας-μελιού',g:15},
    {n:'Σάλτσα σόγιας (μειωμένο αλάτι)',g:12}
  ]
};
var HERB_FOOD_MAP={
  'βασιλικό':'Βασιλικός (φρέσκος)','βασιλικός':'Βασιλικός (φρέσκος)',
  'ρίγανη':'Ρίγανη (ξηρή)',
  'θυμάρι':'Θυμάρι (φρέσκο)',
  'δυόσμος':'Δυόσμος/Μέντα','δυόσμος/μέντα':'Δυόσμος/Μέντα',
  'άνηθος':'Άνηθος (φρέσκος)','δίλ':'Άνηθος (φρέσκος)','φρέσκος δίλ':'Άνηθος (φρέσκος)',
  'μαϊντανός':'Μαϊντανός (φρέσκος)',
  'ροσμαρίνι':'Δεντρολίβανο (φρέσκο)','δεντρολίβανο':'Δεντρολίβανο (φρέσκο)',
  'κύμινο':'Κύμινο','πάπρικα':'Πάπρικα','παπρικά':'Πάπρικα',
  'σκόρδο':'Σκόρδο','κολιαντρος':'Μαϊντανός (φρέσκος)'
};
var SCALE_CATS={
  'Λαχανικά':{lo:0.7,hi:1.35},
  'Φρούτα':{lo:0.7,hi:1.35},
  'Λάδια':{lo:0.6,hi:1.45},
  'Ξηροί καρποί':{lo:0.6,hi:1.45}
};
var BREAKFAST_FOODS = {
  approved_proteins: ['Αυγά (ολόκληρα)', 'Ασπράδια αυγών', 'Γιαούρτι 2%', 'Γιαούρτι 0%', 'Κεφίρ', 'Τυρί φέτα'],
  approved_carbs: ['Ολικής άλεσης ψωμί', 'Βρώμη', 'Ρύζι καστανό', 'Πατάτα', 'Γλυκοπατάτα'],
  approved_veggies: ['Ντοματες', 'Σπαράγγια', 'Μπρόκολο', 'Σπανάκι', 'Πιπεριές'],
  forbidden_for_breakfast: ['Κοτόπουλο στήθος (ψητό)', 'Μοσχάρι/σταυράκι (ψητό)', 'Κουνέλι', 'Χοίρειο κρέας', 'Τόνος', 'Σολομός'],
  is_breakfast_appropriate: function(foodName) {
    // Check if food is in forbidden list
    for(var i = 0; i < this.forbidden_for_breakfast.length; i++) {
      if(foodName.toLowerCase().includes(this.forbidden_for_breakfast[i].toLowerCase())) {
        return false;
      }
    }
    // Heavy meats = not breakfast
    if(foodName.toLowerCase().includes('ψητό') || foodName.toLowerCase().includes('κρέας')) {
      return false;
    }
    return true;
  }
};
var QUICK_EXCL={
  '🥛 Γαλακτοκομικά':['Γιαούρτι 2%','Cottage cheese','Cream cheese','Τυρί φέτα','Μοτσαρέλα','Γάλα πλήρες','Γάλα αμυγδάλου','Πρωτεΐνη σκόνη (whey)','Στραγγιστό γιαούρτι 0%','Γιαούρτι πλήρες 5%','Ανθότυρο','Μυζήθρα','Γάλα σόγιας','Γάλα βρώμης','Γάλα φρέσκο 1.5% Λιπαρά','Γραβιέρα','Κασέρι','Κεφαλοτύρι','Παρμεζάνα','Quark (0%)','Ricotta','Edam light','Σαγανάκι (τηγανητό)'],
  '🌾 Γλουτένη':['Ψωμί σίκαλης','Ψωμί λευκό','Μακαρόνια (βρ.)','Κριθαράκι (βρ.)','Πίτα αραβική','Κυπριακή πίτα','Μπανανόψωμο','Muffins Μύρτιλου','Ψωμί ολικής άλεσης','Σπαγγέτι ολικής (βρ.)','Τορτίλια (large)','Noodles αυγού (M&S)','Πλιγούρι (βρ.)','Κους κους (βρ.)','Ψωμάκι Brioche','Ψωμάκι Μπιφτεκιού','Κρίθινο παξιμάδι','Τραχανάς (βρ.)','Φρυγανιές','Wasa Φρυγανιές Σίκαλης','Dark Rye Crispbread (Ryvita)','Κράκερ ολικής'],
  '🥩 Κρέας':['Βοδινό άπαχο (ψητό)','Χοιρινό (μπριζόλα)','Κουνέλι (μαγ.)','Αρνί (ψητό)','Βοδινά φιλετάκια','Γαλακτοπουλο (βρ.)','Γαλοπούλα στήθος','Κιμάς κοτόπουλο (μαγ.)','Κοτόπουλο βραστό','Κοτόπουλο μπιφτέκι','Κοτόπουλο μπούτι (ψητό)','Κοτόπουλο σουβλάκι','Κοτόπουλο στήθος (ψητό)','Μοσχάρι (ψητό)','Μοσχάρι κιμάς (μαγ.)','Βοδινός κιμάς (μαγ.)','Βοδινός κιμάς άπαχος (μαγ.)','Μπριζόλα άπαχη','Χοιρινός κιμάς (μαγ.)','Moving Mountains Burger'],
  '🐟 Ψάρια/Θαλ.':['Σολομός (ψητός)','Λαβράκι (ψητό)','Τόνος (κονσέρβα)','Γαρίδες (βραστές)','Σαρδέλες','Τσιπούρα (ψητή)','Μπακαλιάρος (ψητός)','Σκουμπρί (ψητό)','Χταπόδι (βρ.)','Καλαμάρι (ψητό)','Μύδια (βρ.)','Γαρίδες γίγαντες (βρ.)','Καβούρι (βρ.)','Καλαμαράκια (ψητά)','Σούπιες (βρ.)','Φιδάκι (ψητό)'],
  '🫘 Όσπρια':['Φασόλια','Ρεβίθια','Φακές','Μαυρομάτικα','Φάβα','Γίγαντες (βρ.)','Κουκιά (βρ.)','Αρακάς (βρ.)','Φακές κόκκινες (βρ.)','Λούπινα (βρ.)','Κανελλίνι (βρ.)','Φασόλια μπορλότι (βρ.)','Tofu (φυσικό)','Edamame (βρ.)','Beyond Beef (φυτικός κιμάς)'],
  '🥚 Αυγά':['Αυγά (ολόκληρα)','Ασπράδια αυγών'],
  '🌰 Ξηροί καρποί':['Αμύγδαλα','Καρύδια','Φυστικοβούτυρο','Κάσιους','Ταχίνι','Chia seeds','Αβοκάντο']
};
var SUBST_ORDER={
  'Κρέας':       ['Κρέας','Ψάρια','Αυγά/Γαλακτ.','Όσπρια'],
  'Ψάρια':       ['Ψάρια','Κρέας','Αυγά/Γαλακτ.','Όσπρια'],
  'Αυγά/Γαλακτ.':['Αυγά/Γαλακτ.','Κρέας','Ψάρια','Όσπρια'],
  'Δημητριακά':  ['Δημητριακά','Όσπρια','Λαχανικά'],
  'Φρούτα':      ['Φρούτα','Λαχανικά'],
  'Λαχανικά':    ['Λαχανικά','Φρούτα'],
  'Λάδια':       ['Λάδια','Ξηροί καρποί'],
  'Ξηροί καρποί':['Ξηροί καρποί','Λάδια'],
  'Όσπρια':      ['Όσπρια','Δημητριακά','Κρέας'],
  'Συνταγές FYH':['Συνταγές FYH']
};
var FOOD_UNITS={
  // Κρέας — μονάδες ανά κομμάτι
  'Κοτόπουλο σουβλάκι':{g:100,u:'stick'},
  'Κοτόπουλο μπιφτέκι':{g:100,u:'τεμ.'},
  // Αυγά
  'Αυγά (ολόκληρα)':{g:55,u:'τεμ.'},
  'Ασπράδια αυγών':{g:30,u:'τεμ.'},
  // Γαλακτοκομικά
  'Γιαούρτι 2%':{g:200,u:'φλ.'},
  'Arla Protein Γιαουρτάκι Σοκολάτα (πουτίγκα)':{g:200,u:'κύπελλο'},
  'Arla Protein Ρόφημα Σοκολάτα':{g:479,u:'μπουκάλι'},
  'Cottage cheese':{g:200,u:'φλ.'},
  'Γάλα πλήρες':{g:240,u:'φλ.'},
  // Λάδια / Λίπη
  'Αβοκάντο':{g:200,u:'τεμ.'},
  'Ελαιόλαδο':{g:10,u:'κ.σ.'},
  'Μέλι άβραστο':{g:7,u:'κ.γ.'},
  'Μαρμελάδα φράουλας':{g:20,u:'κ.σ.'},
  'Edamame (βρ.)':{g:150,u:'φλ.'},
  // Σαλάτα
  'Σαλάτα εποχής':{g:100,u:'φλ.'},
  // Δημητριακά — σε φλιτζάνι (βρ. = βρασμένο)
  'Βρώμη (ωμή)':{g:80,u:'φλ.'},
  'Ρύζι άσπρο (βρ.)':{g:175,u:'φλ.'},
  'Ρύζι καστανό (βρ.)':{g:175,u:'φλ.'},
  'Μακαρόνια (βρ.)':{g:160,u:'φλ.'},
  'Κριθαράκι (βρ.)':{g:160,u:'φλ.'},
  'Κινόα (βρ.)':{g:185,u:'φλ.'},
  'Πλιγούρι (βρ.)':{g:180,u:'φλ.'},
  // Όσπρια: εμφανίζονται σε γραμμάρια — χρήση PORTIONS (≡) για φλιτζάνια
  'Μούσλι':{g:45,u:'μερίδ.'},
  'Ρυζογκοφρέτες':{g:10,u:'τεμ.'},
  // Ψωμί / Πίτα — ανά τεμάχιο
  'Ψωμί σίκαλης':{g:30,u:'φέτα'},
  'Ψωμί λευκό':{g:30,u:'φέτα'},
  'Ψωμάκι Brioche':{g:90,u:'τεμ.'},
  'Ψωμάκι Μπιφτεκιού':{g:80,u:'τεμ.'},
  'Ψωμί ολικής άλεσης':{g:35,u:'φέτα'},
  'Κρίθινο παξιμάδι':{g:50,u:'τεμ.'},
  'Φρυγανιές':{g:12,u:'τεμ.'},
  'Wasa Φρυγανιές Σίκαλης':{g:11.5,u:'φέτα'},
  'Dark Rye Crispbread (Ryvita)':{g:10.5,u:'φέτα'},
  'Στραγγιστό γιαούρτι 0%':{g:200,u:'φλ.'},
  'Γιαούρτι πλήρες 5%':{g:200,u:'φλ.'},
  'Γάλα σόγιας':{g:240,u:'φλ.'},
  'Γάλα βρώμης':{g:240,u:'φλ.'},
  'Γάλα φρέσκο 1.5% Λιπαρά':{g:240,u:'φλ.'},
  'Koko Γιαούρτι Καρύδας (Νηστίσιμο)':{g:200,u:'φλ.'},
  'Γραβιέρα':{g:30,u:'φέτα'},
  'Κασέρι':{g:30,u:'φέτα'},
  'Κεφαλοτύρι':{g:20,u:'φέτα'},
  'Παρμεζάνα':{g:10,u:'κ.σ.'},
  'Quark (0%)':{g:240,u:'φλ.'},
  'Ricotta':{g:125,u:'τεμ.'},
'Moving Mountains Burger':{g:113,u:'patty'},
'Grillman Chicken Burger':{g:150,u:'τεμ.'},
'Μπιφτέκι Κοτόπουλο Πηδηχτούλης Κόκορας':{g:300,u:'τεμ.'},
  'Edam light':{g:30,u:'φέτα'},
  'Γαλατάκι σοκολάτα delact χωρίς ζάχαρη':{g:250,u:'συσκευασία'},
  'USN Trust Crunch Bar':{g:60,u:'bar'},
  'Σύκα φρέσκα':{g:50,u:'τεμ.'},
  'Σύκα ξερά':{g:20,u:'τεμ.'},
  'Χουρμάδες (ξερές)':{g:15,u:'τεμ.'},
  'Τορτίλια (large)':{g:64,u:'τεμ.'},
  'Τορτίλια ολικής άλεσης (Alphamega)':{g:60,u:'τεμ.'},
  'Βοδινά μπιφτέκια (ψημένα)':{g:100,u:'τεμ.'},
  'Ακτινίδιο':{g:100,u:'τεμ.'},
  'Πίτα αραβική':{g:60,u:'τεμ.'},
  'Κυπριακή πίτα':{g:90,u:'τεμ.'},
  // Αμυλούχα — ανά τεμάχιο
  'Γλυκοπατάτα':{g:130,u:'τεμ.'},
  'Πατάτες':{g:150,u:'τεμ.'},
  // Ξηροί καρποί / Λίπη
  'Αμύγδαλα':{g:28,u:'χούφτα'},
  'Καρύδια':{g:25,u:'χούφτα'},
  'Κάσιους':{g:28,u:'χούφτα'},
  'Φυστικοβούτυρο':{g:16,u:'κ.σ.'},
  'Αμυγδαλοβούτυρο':{g:16,u:'κ.σ.'},
  'Chia seeds':{g:10,u:'κ.σ.'},
  'Ταχίνι':{g:15,u:'κ.σ.'},
  'Σκόνη κακάο':{g:5,u:'κ.σ.'},
  // Φρούτα — 1 μερίδα (σύμφωνα με λίστα ανταλλαγής)
  'Ανανάς':{g:155,u:'φλ.'},
  'Αχλάδι':{g:110,u:'τεμ.'},
  'Βερίκοκα':{g:38,u:'τεμ.'},
  'Γκρέιπφρούτ':{g:330,u:'τεμ.'},
  'Δαμάσκηνα':{g:70,u:'τεμ.'},
  'Καρπούζι':{g:380,u:'φέτα'},
  'Κεράσια':{g:7,u:'τεμ.'},
  'Μανταρίνι':{g:110,u:'τεμ.'},
  'Μήλο':{g:120,u:'τεμ.'},
  'Μούρα':{g:145,u:'φλ.'},
  'Μπανάνα':{g:120,u:'τεμ.'},
  'Λεμόνι':{g:55,u:'τεμ.'},
  'Νεκταρίνι':{g:140,u:'τεμ.'},
  'Πεπόνι':{g:160,u:'φλ.'},
  'Πορτοκάλι':{g:180,u:'τεμ.'},
  'Ροδάκινο':{g:110,u:'τεμ.'},
  'Σταφίδες':{g:15,u:'κ.σ.'},
  'Μπανάνα αποξηραμένη':{g:30,u:'χούφτα'},
  'Βερίκοκα αποξηραμένα':{g:30,u:'χούφτα'},
  'Δαμάσκηνα αποξηραμένα':{g:8,u:'τεμ.'},
  'Cranberries αποξηραμένα':{g:15,u:'κ.σ.'},
  'Μάνγκο αποξηραμένο':{g:30,u:'χούφτα'},
  'Ανανάς αποξηραμένος':{g:30,u:'χούφτα'},
  'Μήλο αποξηραμένο':{g:30,u:'χούφτα'},
  'Σταφύλια':{g:5,u:'ρόγα'},
  'Φράουλες':{g:19,u:'τεμ.'},
  // Μπαχαρικά & βότανα — ανά κουταλάκι
  'Κουρκουμάς':{g:2,u:'κ.γλ.'},'Μαύρο πιπέρι':{g:2,u:'κ.γλ.'},'Κανέλα':{g:2,u:'κ.γλ.'},
  'Τζίντζερ':{g:2,u:'κ.γλ.'},'Ρίγανη':{g:2,u:'κ.γλ.'},'Δεντρολίβανο':{g:2,u:'κ.γλ.'},
  'Θυμάρι':{g:2,u:'κ.γλ.'},'Δυόσμος':{g:2,u:'κ.γλ.'},'Φασκόμηλο':{g:2,u:'κ.γλ.'},
  'Κουμίν':{g:2,u:'κ.γλ.'},'Γλυκάνισος':{g:2,u:'κ.γλ.'},'Κορίανδρος':{g:2,u:'κ.γλ.'},
  'Τσίλι/Καυτερή πιπ.':{g:2,u:'κ.γλ.'},'Κάρδαμο':{g:2,u:'κ.γλ.'},'Μοσχοκάρυδο':{g:2,u:'κ.γλ.'},
  'Γαρύφαλλο':{g:2,u:'κ.γλ.'},'Σαφράνι':{g:0.05,u:'πρέζα'},'Μάραθος':{g:2,u:'κ.γλ.'},
  // Συνταγές FYH — ανά μερίδα
  'Αυγολέμονο Κυπριακό':{g:250,u:'μερίδ.'},
  'Korean Beef Bowl':{g:350,u:'μερίδ.'},
  'Chicken Lettuce Wraps':{g:200,u:'μερίδ.'},
  'Κοτόπουλο Pesto & Φέτα':{g:200,u:'μερίδ.'},
  'Protein Pancakes (FYH)':{g:80,u:'τεμ.'},
  'Pancakes Κυριακής (FYH)':{g:135,u:'μερίδ.'},
  'Βρώμη Πρωινού (FYH)':{g:375,u:'μερίδ.'},
  'Πρωινό Αυγών (FYH)':{g:200,u:'μερίδ.'},
  'Τοστ Αυγών (FYH)':{g:165,u:'μερίδ.'},
  'Γιαούρτι Granola (FYH)':{g:310,u:'μερίδ.'},
  'Chia Pudding (FYH)':{g:370,u:'μερίδ.'},
  'Πίτα Αυγών (FYH)':{g:235,u:'μερίδ.'},
  'Green Protein Smoothie (FYH)':{g:375,u:'μερίδ.'},
  'Berry Protein Smoothie (FYH)':{g:247,u:'μερίδ.'},
  'Γάλα αμυγδάλου':{g:200,u:'φλ.'},
  'Πρωτεΐνη σκόνη (whey)':{g:30,u:'scoop'},
  'Πρωτεΐνη Αμυγδάλου (Amino Animo Organic)':{g:25,u:'scoop'},
  'Σαλάτα Φακής Μεσογειακή':{g:250,u:'μερίδ.'},
  'Μπουλγκούρ-Κινόα Κοτόπουλο':{g:400,u:'μερίδ.'},
  'Ψάρι στο Φούρνο (FYH)':{g:200,u:'μερίδ.'},
  'Ρύζι-Φακές Stir Fry':{g:250,u:'μερίδ.'},
  'Γκρανόλα χωρίς ζάχαρη':{g:45,u:'μερίδ.'},
  'Μπανανόψωμο':{g:50,u:'φέτα'},
  'Muffins Μύρτιλου':{g:60,u:'τεμ.'},
  'Dark Choc Oat Bites':{g:35,u:'τεμ.'},
  'PB Coconut Truffles':{g:30,u:'τεμ.'},
  'Energy Bites (FYH)':{g:30,u:'τεμ.'},
  'PB Protein Bars':{g:50,u:'τεμ.'},
  'Σάλτσα Ντομάτας (FYH)':{g:15,u:'κ.σ.'},
  // Petretzeakis Breakfast Recipes
  'Breakfast Burrito (Πετρετζίκης)':{g:420,u:'μερίδ.'},
  'Chia Bowl Φράουλα (Πετρετζίκης)':{g:385,u:'μερίδ.'},
  'Overnight Oats Banoffee (Πετρετζίκης)':{g:430,u:'μερίδ.'},
  'Overnight Oats Black Forest (Πετρετζίκης)':{g:425,u:'μερίδ.'},
  'Overnight Oats P.B. & Choco (Πετρετζίκης)':{g:470,u:'μερίδ.'},
  'Αυγά Ποσέ Air Fryer (Πετρετζίκης)':{g:370,u:'μερίδ.'},
  'Ομελέτα Γαλοπούλα & Λαχ. (Πετρετζίκης)':{g:360,u:'μερίδ.'},
  'Λιγκουίνι με Γαρίδες (Πετρετζίκης)':{g:350,u:'μερίδ.'},
  /* Chef Recipes - Άκης Πετρετζάκης */
  'High Protein Ομελέτα Wrap':{g:250,u:'μερίδ.'},
  'Wrap με τονοσαλάτα':{g:240,u:'μερίδ.'}
};
var WHOLE_UNIT_FOODS={
  // Αυγά
  'Αυγά (ολόκληρα)':1,'Ασπράδια αυγών':1,
  // Ψωμί / φέτες / φρυγανιές / ρυζογκοφρέτες / πίτες
  'Ψωμί σίκαλης':1,'Ψωμί λευκό':1,'Ψωμί ολικής άλεσης':1,'Κρίθινο παξιμάδι':1,
  'Φρυγανιές':1,'Wasa Φρυγανιές Σίκαλης':1,'Dark Rye Crispbread (Ryvita)':1,'Ρυζογκοφρέτες':1,'Πίτα αραβική':1,'Κυπριακή πίτα':1,'Τορτίλια ολικής άλεσης (Alphamega)':1,
  // Φρούτα ανά τεμάχιο/φέτα/ρόγα
  'Σύκα φρέσκα':1,'Σύκα ξερά':1,'Χουρμάδες (ξερές)':1,'Ακτινίδιο':1,'Αχλάδι':1,'Βερίκοκα':1,
  'Γκρέιπφρούτ':1,'Δαμάσκηνα':1,'Καρπούζι':1,'Κεράσια':1,'Μανταρίνι':1,'Μήλο':1,'Μπανάνα':1,
  'Λεμόνι':1,'Νεκταρίνι':1,'Πορτοκάλι':1,'Ροδάκινο':1,'Δαμάσκηνα αποξηραμένα':1,'Σταφύλια':1,'Φράουλες':1
};
var UNIT_PLURALS={
  // Ελληνικά
  'φέτα':'φέτες','χούφτα':'χούφτες','ρόγα':'ρόγες','πρέζα':'πρέζες',
  'κύπελλο':'κύπελλα','μπουκάλι':'μπουκάλια','συσκευασία':'συσκευασίες',
  // Αγγλικά (όταν isEn)
  'slice':'slices','serving':'servings','handful':'handfuls','cup':'cups',
  'stick':'sticks','scoop':'scoops','pc.':'pcs.','bar':'bars','patty':'patties','bottle':'bottles',
  'pinch':'pinches','grape':'grapes','package':'packages'
};
var COOKED_TO_RAW={
  'Κοτόπουλο στήθος (ψητό)':{f:1.33,label:'ωμό'},
  'Κοτόπουλο μπιφτέκι':{f:1.30,label:'ωμό'},
  'Κοτόπουλο σουβλάκι':{f:1.33,label:'ωμό'},
  'Κουνέλι (μαγ.)':{f:1.35,label:'ωμό'},
  'Χοιρινό (μπριζόλα)':{f:1.38,label:'ωμό'},
  'Βοδινό άπαχο (ψητό)':{f:1.35,label:'ωμό'},
  'Βοδινά φιλετάκια':{f:1.35,label:'ωμά'},
  'Γαλοπούλα στήθος':{f:1.33,label:'ωμό'},
  'Κοτόπουλο μπούτι (ψητό)':{f:1.30,label:'ωμό'},
  'Μοσχάρι (ψητό)':{f:1.35,label:'ωμό'},
  'Αρνί (ψητό)':{f:1.35,label:'ωμό'},
  // ✅ 2026-07-11: υπόλοιπα Κρέας-entries που έλειπαν από τη διασταύρωση με FOODS (ίδιο κενό με
  // το προηγούμενο fix — buyDisp έπεφτε στο "no-conversion" else-branch, αγοράζοντας το μαγειρεμένο
  // βάρος σαν να ήταν ωμό). Συντελεστές: κιμάδες με βάση το λιπαρό της αντίστοιχης FOODS εγγραφής
  // σε σχέση με τα ήδη υπάρχοντα ολόκληρα κομμάτια του ίδιου ζώου (περισσότερο λίπος στο ωμό →
  // περισσότερη απώλεια στο μαγείρεμα άρα υψηλότερος συντελεστής)· τα υπόλοιπα ταιριάχτηκαν με το
  // πιο κοντινό macro-προφίλ ήδη υπάρχουσας εγγραφής του ίδιου κρέατος/κοψίματος.
  'Κοτόπουλο βραστό':{f:1.30,label:'ωμό'},
  'Μπριζόλα άπαχη':{f:1.35,label:'ωμή'},
  'Βοδινά μπιφτέκια (ψημένα)':{f:1.35,label:'ωμά'},
  'Μοσχάρι κιμάς (μαγ.)':{f:1.35,label:'ωμός'},
  'Βοδινός κιμάς (μαγ.)':{f:1.40,label:'ωμός'},
  'Βοδινός κιμάς άπαχος (μαγ.)':{f:1.35,label:'ωμός'},
  'Χοιρινός κιμάς (μαγ.)':{f:1.40,label:'ωμός'},
  'Κιμάς κοτόπουλο (μαγ.)':{f:1.30,label:'ωμός'},
  'Σολομός (ψητός)':{f:1.22,label:'ωμός'},
  'Λαβράκι (ψητό)':{f:1.22,label:'ωμό'},
  'Τσιπούρα (ψητή)':{f:1.22,label:'ωμή'},
  'Μπακαλιάρος (ψητός)':{f:1.20,label:'ωμός'},
  'Σκουμπρί (ψητό)':{f:1.22,label:'ωμό'},
  'Τόνος (κονσέρβα)':{f:1.30,label:'κονσέρβα (στρ.)'},
  'Γαρίδες (βραστές)':{f:1.18,label:'ωμές'},
  'Καλαμάρι (ψητό)':{f:1.18,label:'ωμό'},
  'Καλαμαράκια (ψητά)':{f:1.18,label:'ωμά'},
  // Macro-προφίλ (k:116,p:24,f:1) ταυτίζεται σχεδόν με το ήδη υπάρχον 'Μπακαλιάρος (ψητός)' —
  // ίδιο άπαχο λευκό ψάρι, ίδιος συντελεστής.
  'Φιδάκι (ψητό)':{f:1.20,label:'ωμό'},
  'Αυγά (ολόκληρα)':{f:1.0,label:'τεμ.',isEgg:true},
  'Ρύζι άσπρο (βρ.)':{f:0.33,label:'ωμό'},
  'Ρύζι καστανό (βρ.)':{f:0.37,label:'ωμό'},
  'Κινόα (βρ.)':{f:0.36,label:'ωμή'},
  'Μακαρόνια (βρ.)':{f:0.44,label:'ωμά'},
  'Κριθαράκι (βρ.)':{f:0.45,label:'ωμό'},
  'Πλιγούρι (βρ.)':{f:0.40,label:'ωμό'},
  'Φασόλια':{f:0.43,label:'ξερά'},
  'Ρεβίθια':{f:0.45,label:'ξερά'},
  'Φακές':{f:0.40,label:'ξερές'},
  'Μαυρομάτικα':{f:0.43,label:'ξερά'},
  'Φάβα':{f:0.43,label:'ξερή'}
};
var PORTIONS={
'Βρώμη (ωμή)':[{n:'1 Κ.',g:10},{n:'½ φλ.',g:40},{n:'¾ φλ.',g:60},{n:'1 φλ.',g:80}],
'Ρύζι άσπρο (βρ.)':[{n:'½ φλ.',g:90},{n:'¾ φλ.',g:130},{n:'1 φλ.',g:175}],
'Ρύζι καστανό (βρ.)':[{n:'½ φλ.',g:90},{n:'¾ φλ.',g:130},{n:'1 φλ.',g:175}],
'Κινόα (βρ.)':[{n:'½ φλ.',g:90},{n:'1 φλ.',g:185}],
'Μακαρόνια (βρ.)':[{n:'½ φλ.',g:80},{n:'1 φλ.',g:160},{n:'1½ φλ.',g:240}],
'Κριθαράκι (βρ.)':[{n:'½ φλ.',g:80},{n:'1 φλ.',g:160}],
'Πλιγούρι (βρ.)':[{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Ψωμί σίκαλης':[{n:'1 φέτα',g:30},{n:'2 φέτες',g:60}],
'Ψωμί λευκό':[{n:'1 φέτα',g:30},{n:'2 φέτες',g:60}],
'Ψωμάκι Brioche':[{n:'½ τεμ.',g:45},{n:'1 τεμ.',g:90},{n:'100 γρ.',g:100}],
'Ψωμάκι Μπιφτεκιού':[{n:'½ τεμ.',g:40},{n:'1 τεμ.',g:80},{n:'100 γρ.',g:100}],
'Πίτα αραβική':[{n:'μικρή',g:55},{n:'μεσαία',g:80},{n:'μεγάλη',g:100}],
'Κυπριακή πίτα':[{n:'1/3 τεμ.',g:30},{n:'1/2 τεμ.',g:45},{n:'ολόκληρη',g:90}],
'Ρυζογκοφρέτες':[{n:'1 τεμ.',g:10},{n:'2 τεμ.',g:20},{n:'3 τεμ.',g:30}],
'Μούσλι':[{n:'1 Κ.',g:10},{n:'½ φλ.',g:45},{n:'1 φλ.',g:90}],
'Ψωμί ολικής άλεσης':[{n:'1 φέτα',g:35},{n:'2 φέτες',g:70}],
'Κρίθινο παξιμάδι':[{n:'μικρό',g:25},{n:'μεγάλο',g:50}],
'Κους κους (βρ.)':[{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Σπαγγέτι ολικής (βρ.)':[{n:'½ φλ.',g:80},{n:'1 φλ.',g:160},{n:'1½ φλ.',g:240}],
'Τραχανάς (βρ.)':[{n:'½ φλ.',g:80},{n:'1 φλ.',g:150}],
'Φρυγανιές':[{n:'1 τεμ.',g:12},{n:'2 τεμ.',g:24},{n:'3 τεμ.',g:36},{n:'4 τεμ.',g:48}],
'Wasa Φρυγανιές Σίκαλης':[{n:'1 φέτα',g:11.5},{n:'2 φέτες',g:23},{n:'3 φέτες',g:34.5},{n:'4 φέτες',g:46}],
'Dark Rye Crispbread (Ryvita)':[{n:'1 φέτα',g:10.5},{n:'2 φέτες',g:21},{n:'3 φέτες',g:31.5},{n:'4 φέτες',g:42}],
'Κοτόπουλο στήθος (ψητό)':[{n:'μικρή μερίδα',g:100},{n:'μερίδα',g:150},{n:'μεγάλη',g:200}],
'Κοτόπουλο βραστό':[{n:'μικρή μερίδα',g:100},{n:'μερίδα',g:150},{n:'μεγάλη',g:200},{n:'300g',g:300}],
'Κοτόπουλο μπιφτέκι':[{n:'1 μπιφτέκι',g:100},{n:'2 μπιφτέκια',g:200}],
'Κοτόπουλο σουβλάκι':[{n:'1 stick (100g)',g:100},{n:'2 sticks (200g)',g:200},{n:'3 sticks (300g)',g:300}],
'Γαλοπούλα στήθος':[{n:'1 φέτα',g:15},{n:'2 φέτες',g:30},{n:'μερίδα',g:120}],
'Κοτόπουλο μπούτι (ψητό)':[{n:'1 μπούτι μικρό',g:100},{n:'μερίδα',g:150},{n:'μεγάλη',g:200}],
'Μοσχάρι κιμάς (μαγ.)':[{n:'μερίδα',g:120},{n:'μεγάλη',g:200},{n:'300g',g:300}],
'Βοδινός κιμάς (μαγ.)':[{n:'μερίδα',g:120},{n:'μεγάλη',g:200},{n:'300g',g:300}],
'Βοδινός κιμάς άπαχος (μαγ.)':[{n:'μερίδα',g:120},{n:'μεγάλη',g:200},{n:'300g',g:300}],
'Αρνί (ψητό)':[{n:'μερίδα',g:120},{n:'μεγάλη',g:180},{n:'250g',g:250}],
'Χοιρινός κιμάς (μαγ.)':[{n:'μερίδα',g:120},{n:'μεγάλη',g:200}],
'Χοιρινό (μπριζόλα)':[{n:'1 μπριζόλα',g:180},{n:'2 μπριζόλες',g:360}],
'Βοδινό άπαχο (ψητό)':[{n:'μερίδα',g:120},{n:'μεγάλη',g:200}],
'Βοδινά φιλετάκια':[{n:'μερίδα',g:150},{n:'μεγάλη',g:250}],
'Κουνέλι (μαγ.)':[{n:'μερίδα',g:150}],
'Σολομός (ψητός)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:200}],
'Λαβράκι (ψητό)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:200}],
'Τσιπούρα (ψητή)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:250}],
'Μπακαλιάρος (ψητός)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:250}],
'Σαρδέλες':[{n:'μικρή κονσέρβα',g:80},{n:'μεγάλη κονσέρβα',g:120},{n:'φρέσκιες μερίδα',g:150}],
'Σκουμπρί (ψητό)':[{n:'φιλέτο',g:100},{n:'μερίδα',g:150},{n:'μεγάλη',g:200}],
'Χταπόδι (βρ.)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:250}],
'Καλαμάρι (ψητό)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:250}],
'Μύδια (βρ.)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:250}],
'Τόνος (κονσέρβα)':[{n:'μικρή κονσέρβα',g:80},{n:'μεγάλη κονσέρβα',g:160}],
'Γαρίδες (βραστές)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:250}],
'Αυγά (ολόκληρα)':[{n:'1 αυγό S',g:50},{n:'1 αυγό M',g:55},{n:'1 αυγό L',g:63},{n:'2 αυγά M',g:110},{n:'3 αυγά M',g:165}],
'Ασπράδια αυγών':[{n:'1 ασπράδι',g:30},{n:'2 ασπράδια',g:60},{n:'3 ασπράδια',g:90},{n:'4 ασπράδια',g:120}],
'Στραγγιστό γιαούρτι 0%':[{n:'1 Κ.',g:15},{n:'½ φλ.',g:100},{n:'1 ατομικό',g:170},{n:'1 φλ.',g:200}],
'Γιαούρτι πλήρες 5%':[{n:'1 Κ.',g:15},{n:'½ φλ.',g:100},{n:'1 ατομικό',g:170},{n:'1 φλ.',g:200}],
'Ανθότυρο':[{n:'1 Κ.',g:15},{n:'μεζές',g:50},{n:'μερίδα',g:100}],
'Μυζήθρα':[{n:'1 Κ.',g:15},{n:'μεζές',g:40},{n:'μερίδα',g:80}],
'Γάλα σόγιας':[{n:'½ φλ.',g:120},{n:'1 φλ.',g:240}],
'Γάλα βρώμης':[{n:'½ φλ.',g:120},{n:'1 φλ.',g:240}],
  'Γάλα φρέσκο 1.5% Λιπαρά':[{n:'1 Κ.',g:15},{n:'½ φλ.',g:120},{n:'1 φλ.',g:240}],
'Koko Γιαούρτι Καρύδας (Νηστίσιμο)':[{n:'½ κούπα',g:100},{n:'1 ατομικό',g:150},{n:'1 κούπα',g:200}],
'Γραβιέρα':[{n:'1 φέτα',g:30},{n:'2 φέτες',g:60},{n:'30g',g:30},{n:'50g',g:50}],
'Κασέρι':[{n:'1 φέτα',g:30},{n:'2 φέτες',g:60},{n:'30g',g:30},{n:'50g',g:50}],
'Κεφαλοτύρι':[{n:'1 φέτα',g:20},{n:'2 φέτες',g:40},{n:'20g',g:20},{n:'30g',g:30}],
'Παρμεζάνα':[{n:'1 κ.σ.',g:10},{n:'2 κ.σ.',g:20},{n:'30g',g:30},{n:'50g',g:50}],
'Quark (0%)':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'½ φλ.',g:120}],
'Ricotta':[{n:'50g',g:50},{n:'100g',g:100},{n:'125g',g:125},{n:'200g',g:200}],
'Moving Mountains Burger':[{n:'100g',g:100},{n:'1 patty',g:113},{n:'½ burger',g:150},{n:'1 burger (2 patties)',g:226}],
'Grillman Chicken Burger':[{n:'100g',g:100},{n:'1 μπιφτέκι',g:150},{n:'2 μπιφτέκια',g:300}],
'Μπιφτέκι Κοτόπουλο Πηδηχτούλης Κόκορας':[{n:'100g',g:100},{n:'1 μπιφτέκι',g:300},{n:'½ μπιφτέκι',g:150}],
'Edam light':[{n:'1 φέτα',g:30},{n:'2 φέτες',g:60},{n:'30g',g:30},{n:'50g',g:50}],
'Γιαούρτι 2%':[{n:'1 Κ.',g:15},{n:'½ φλ.',g:100},{n:'1 ατομικό',g:170},{n:'1 φλ.',g:200}],
'Arla Protein Γιαουρτάκι Σοκολάτα (πουτίγκα)':[{n:'½ κύπελλο',g:100},{n:'1 κύπελλο',g:200}],
'Arla Protein Ρόφημα Σοκολάτα':[{n:'½ μπουκάλι',g:240},{n:'1 μπουκάλι',g:479}],
'Cottage cheese':[{n:'1 Κ.',g:15},{n:'1 ατομικό',g:120},{n:'1 φλ.',g:200}],
'Τυρί φέτα':[{n:'1 Κ.',g:10},{n:'1 μεζές',g:20},{n:'1 κύβος',g:30},{n:'2 κύβοι',g:60}],
'Μοτσαρέλα':[{n:'1 Κ.',g:15},{n:'1 φέτα',g:30},{n:'½ πακέτο',g:125}],
'Γάλα πλήρες':[{n:'1 Κ.',g:15},{n:'½ φλ.',g:120},{n:'1 φλ.',g:240}],
'Φασόλια':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'250g',g:250},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Ρεβίθια':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'250g',g:250},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Φακές':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'250g',g:250},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Μαυρομάτικα':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'250g',g:250},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Φάβα':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Γίγαντες (βρ.)':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'250g',g:250},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Κουκιά (βρ.)':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Αρακάς (βρ.)':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Φακές κόκκινες (βρ.)':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'250g',g:250},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Λούπινα (βρ.)':[{n:'50g',g:50},{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200}],
'Κανελλίνι (βρ.)':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'250g',g:250},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Φασόλια μπορλότι (βρ.)':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'250g',g:250},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Tofu (φυσικό)':[{n:'μικρή μερίδα',g:80},{n:'μερίδα',g:150},{n:'μεγάλη',g:200}],
'Edamame (βρ.)':[{n:'½ φλ.',g:80},{n:'1 φλ.',g:150}],
'Μέλι άβραστο':[{n:'1 κ.γ.',g:7},{n:'1 κ.σ.',g:21}],
'Γλυκοπατάτα':[{n:'μικρή',g:130},{n:'μεσαία',g:200},{n:'μεγάλη',g:300}],
'Πατάτες':[{n:'1 μεσαία',g:150},{n:'2 μεσαίες',g:300}],
'Αγγούρι':[{n:'½ αγγούρι',g:150},{n:'1 αγγούρι',g:300}],
'Τομάτες':[{n:'1 μέτρια',g:120},{n:'2 μέτριες',g:240}],
'Φασολάκια':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Φασολάκια (βρ.)':[{n:'100g',g:100},{n:'150g',g:150},{n:'200g',g:200},{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Ανανάς':[{n:'3/4 φλ.',g:116},{n:'1 φλ.',g:155}],
'Αχλάδι':[{n:'1 μικρό',g:110},{n:'1 μεσαίο',g:160}],
'Βερίκοκα':[{n:'4 ολόκληρα',g:150},{n:'6 ολόκληρα',g:225}],
'Γκρέιπφρούτ':[{n:'1 τεμάχιο',g:330}],
'Δαμάσκηνα':[{n:'2 μέτρια',g:140},{n:'3 μέτρια',g:210}],
'Καρπούζι':[{n:'1 φέτα',g:380},{n:'2 φέτες',g:760}],
'Κεράσια':[{n:'12 μεγάλα',g:85},{n:'1 φλ.',g:140}],
'Μανταρίνι':[{n:'2 μικρά',g:220},{n:'1 μεγάλο',g:140}],
'Μήλο':[{n:'1 μικρό',g:120},{n:'1 μεσαίο',g:160},{n:'1 μεγάλο',g:200}],
'Μούρα':[{n:'3/4 φλ.',g:109},{n:'1 φλ.',g:145}],
'Μπανάνα':[{n:'½ μεγάλη / 1 μικρή',g:120},{n:'1 μεγάλη',g:150}],
'Λεμόνι':[{n:'1 κ.γ. χυμό',g:5},{n:'1 κ.σ. χυμό',g:15},{n:'1 μικρό',g:40},{n:'1 μέτριο',g:55},{n:'1 μεγάλο',g:70},{n:'χυμό 1 λεμονιού',g:30}],
'Λεμόνι (χυμός)':[{n:'1 κ.κ.',g:5},{n:'1 κ.σ.',g:15},{n:'2 κ.σ.',g:30},{n:'χυμό 1 λεμονιού',g:30}],
'Νεκταρίνι':[{n:'1 μέτριο',g:140},{n:'1 μεγάλο',g:180}],
'Πεπόνι':[{n:'3/4 φλ.',g:120},{n:'1 φλ.',g:160}],
'Πορτοκάλι':[{n:'1 μικρό',g:180},{n:'1 μεγάλο',g:220}],
'Ροδάκινο':[{n:'1 μέτριο',g:110},{n:'1 μεγάλο',g:160}],
'Σταφίδες':[{n:'1 κ.σ.',g:15},{n:'2 κ.σ.',g:30}],
'Σύκα φρέσκα':[{n:'1 τεμ.',g:50},{n:'2 τεμ.',g:100},{n:'3 τεμ.',g:150}],
'Σύκα ξερά':[{n:'2 τεμ.',g:30},{n:'4 τεμ.',g:60},{n:'6 τεμ.',g:90}],
'Ρόδι':[{n:'½ τεμ.',g:100},{n:'1 τεμ.',g:200}],
'Ακτινίδιο':[{n:'1 μικρό',g:75},{n:'1 μεσαίο',g:100},{n:'2 τεμ.',g:150}],
'Χουρμάδες (ξερές)':[{n:'2 τεμ.',g:30},{n:'4 τεμ.',g:60},{n:'6 τεμ.',g:90}],
'Μπανάνα αποξηραμένη':[{n:'1 χούφτα (30g)',g:30},{n:'50g',g:50}],
'Βερίκοκα αποξηραμένα':[{n:'5 ημίσεις',g:30},{n:'8 ημίσεις',g:48}],
'Δαμάσκηνα αποξηραμένα':[{n:'3 τεμ.',g:24},{n:'5 τεμ.',g:40}],
'Cranberries αποξηραμένα':[{n:'1 κ.σ.',g:15},{n:'2 κ.σ.',g:30}],
'Μάνγκο αποξηραμένο':[{n:'3 φέτες',g:30},{n:'5 φέτες',g:50}],
'Ανανάς αποξηραμένος':[{n:'3 φέτες',g:30},{n:'5 φέτες',g:50}],
'Μήλο αποξηραμένο':[{n:'1 χούφτα (30g)',g:30},{n:'5 φέτες',g:30}],
'Κουρκουμάς':[{n:'1 πρέζα',g:0.5},{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Μαύρο πιπέρι':[{n:'1 πρέζα',g:0.5},{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Κανέλα':[{n:'1 πρέζα',g:0.5},{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Τζίντζερ':[{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2},{n:'1 κ.σ. φρέσκο',g:6}],
'Ρίγανη':[{n:'1 πρέζα',g:0.5},{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Δεντρολίβανο':[{n:'1 πρέζα',g:0.5},{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Θυμάρι':[{n:'1 πρέζα',g:0.5},{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Δυόσμος':[{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2},{n:'λίγα φύλλα',g:3}],
'Φασκόμηλο':[{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Κουμίν':[{n:'1 πρέζα',g:0.5},{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Γλυκάνισος':[{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Κορίανδρος':[{n:'1 πρέζα',g:0.5},{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Τσίλι/Καυτερή πιπ.':[{n:'1 πρέζα',g:0.25},{n:'¼ κ.γλ.',g:0.5},{n:'½ κ.γλ.',g:1}],
'Κάρδαμο':[{n:'1 πρέζα',g:0.5},{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Μοσχοκάρυδο':[{n:'1 πρέζα',g:0.25},{n:'¼ κ.γλ.',g:0.5},{n:'½ κ.γλ.',g:1}],
'Γαρύφαλλο':[{n:'1 πρέζα',g:0.25},{n:'¼ κ.γλ.',g:0.5},{n:'½ κ.γλ.',g:1}],
'Σαφράνι':[{n:'λίγα στίγματα',g:0.03},{n:'1 πρέζα',g:0.05}],
'Μάραθος':[{n:'½ κ.γλ.',g:1},{n:'1 κ.γλ.',g:2}],
'Βύσσινο':[{n:'½ φλ.',g:80},{n:'1 φλ.',g:150}],
'Σταφύλια':[{n:'17 ρόγες',g:85},{n:'1 φλ.',g:150}],
'Φράουλες':[{n:'10 μικρές',g:190},{n:'1 1/4 φλ.',g:190}],
'Αμύγδαλα':[{n:'10 τεμ.',g:14},{n:'20 τεμ.',g:28},{n:'1 χούφτα',g:28}],
'Φιστίκια Αιγίνης':[{n:'1 χούφτα',g:30},{n:'2 χούφτες',g:60},{n:'100g',g:100}],
'Φουντούκια':[{n:'1 χούφτα',g:30},{n:'2 χούφτες',g:60}],
'Κολοκυθόσποροι':[{n:'1 κ.σ.',g:10},{n:'2 κ.σ.',g:20},{n:'1 χούφτα',g:30}],
'Ηλιόσποροι':[{n:'1 κ.σ.',g:10},{n:'2 κ.σ.',g:20},{n:'1 χούφτα',g:30}],
'Σουσάμι':[{n:'1 κ.γ.',g:5},{n:'1 κ.σ.',g:15},{n:'2 κ.σ.',g:30}],
'Λιναρόσπορος':[{n:'1 κ.γ.',g:5},{n:'1 κ.σ.',g:12},{n:'2 κ.σ.',g:24}],
'Καρύδια':[{n:'3 μισά',g:15},{n:'5 μισά',g:25}],
'Αβοκάντο':[{n:'1 Κ.',g:15},{n:'¼ αβοκάντο',g:50},{n:'½ αβοκάντο',g:100}],
'Φυστικοβούτυρο':[{n:'1 κ.σ.',g:16},{n:'2 κ.σ.',g:32}],
'Αμυγδαλοβούτυρο':[{n:'1 κ.γ.',g:10},{n:'1 κ.σ.',g:16},{n:'2 κ.σ.',g:32}],
'Chia seeds':[{n:'1 κ.σ.',g:10},{n:'2 κ.σ.',g:20}],
'Σκόνη κακάο':[{n:'1 κ.γ.',g:2},{n:'1 κ.σ.',g:5},{n:'100 γρ.',g:100}],
'Ταχίνι':[{n:'1 κ.σ.',g:15},{n:'2 κ.σ.',g:30}],
'Κάσιους':[{n:'10 τεμ.',g:14},{n:'1 χούφτα',g:28}],
'Ελαιόλαδο':[{n:'1 κ.γ.',g:5},{n:'1 κ.σ.',g:10},{n:'2 κ.σ.',g:20}],
'Ελιές':[{n:'5 τεμ.',g:20},{n:'10 τεμ.',g:40}],
'Αυγολέμονο Κυπριακό':[{n:'1 μπολ',g:400}],
'Korean Beef Bowl':[{n:'1 μερίδα',g:320}],
'Chicken Lettuce Wraps':[{n:'1 μερίδα (3 wraps)',g:200},{n:'2 μερίδες',g:400}],
'Κοτόπουλο Pesto & Φέτα':[{n:'1 μερίδα',g:230}],
'Protein Pancakes (FYH)':[{n:'1 pancake',g:80},{n:'2 pancakes',g:160},{n:'4 pancakes',g:320}],
'Pancakes Κυριακής (FYH)':[{n:'1 μερίδα (3 pancakes)',g:135},{n:'2 μερίδες',g:270}],
'Βρώμη Πρωινού (FYH)':[{n:'1 μερίδα',g:375}],
'Πρωινό Αυγών (FYH)':[{n:'1 μερίδα',g:200}],
'Τοστ Αυγών (FYH)':[{n:'1 μερίδα',g:165}],
'Γιαούρτι Granola (FYH)':[{n:'1 μερίδα',g:310}],
'Chia Pudding (FYH)':[{n:'1 μερίδα',g:370}],
'Πίτα Αυγών (FYH)':[{n:'1 μερίδα',g:235}],
'Green Protein Smoothie (FYH)':[{n:'1 μερίδα',g:375}],
'Berry Protein Smoothie (FYH)':[{n:'1 μερίδα',g:247}],
'Γάλα αμυγδάλου':[{n:'½ φλ.',g:100},{n:'1 φλ.',g:200},{n:'1½ φλ.',g:300}],
'Πρωτεΐνη σκόνη (whey)':[{n:'1 scoop',g:30},{n:'1½ scoop',g:45},{n:'2 scoops',g:60}],
'Πρωτεΐνη Αμυγδάλου (Amino Animo Organic)':[{n:'1 scoop',g:25},{n:'1½ scoop',g:37},{n:'2 scoops',g:50}],
'Σαλάτα Φακής Μεσογειακή':[{n:'1 μερίδα',g:250},{n:'2 μερίδες',g:500}],
'Μπουλγκούρ-Κινόα Κοτόπουλο':[{n:'1 μερίδα',g:380},{n:'μεγάλη μερίδα',g:500}],
'Ψάρι στο Φούρνο (FYH)':[{n:'1 φιλέτο',g:180},{n:'2 φιλέτα',g:360}],
'Ρύζι-Φακές Stir Fry':[{n:'1 μερίδα',g:360}],
'Γκρανόλα χωρίς ζάχαρη':[{n:'1 Κ.',g:10},{n:'¼ φλ.',g:40},{n:'½ φλ.',g:80}],
'Μπανανόψωμο':[{n:'1 φέτα',g:50},{n:'2 φέτες',g:100}],
'Muffins Μύρτιλου':[{n:'1 muffin',g:65},{n:'2 muffins',g:130}],
'Dark Choc Oat Bites':[{n:'1 κομμάτι',g:35},{n:'2 κομμάτια',g:70},{n:'4 κομμάτια',g:140}],
'PB Coconut Truffles':[{n:'1 truffle',g:30},{n:'2 truffles',g:60},{n:'3 truffles',g:90}],
'Energy Bites (FYH)':[{n:'1 μπαλάκι',g:30},{n:'2 μπαλάκια',g:60},{n:'4 μπαλάκια',g:120}],
'PB Protein Bars':[{n:'1 μπάρα',g:80},{n:'2 μπάρες',g:160}],
'Σάλτσα Ντομάτας (FYH)':[{n:'1 κ.σ.',g:15},{n:'2 κ.σ.',g:30},{n:'50ml',g:50},{n:'100ml',g:100}],
// ════ UNIVERSAL PORTIONS EXPANSION — All remaining foods ════
// Μπριζόλες / Steaks
'Μπριζόλα άπαχη':[{n:'1 μπριζόλα',g:180},{n:'2 μπριζόλες',g:360}],
// Κρέας - Additional meats (without existing PORTIONS)
'Γαλακτοπουλο (βρ.)':[{n:'μερίδα',g:120},{n:'μεγάλη',g:200}],
'Κιμάς κοτόπουλο (μαγ.)':[{n:'μερίδα',g:120},{n:'μεγάλη',g:200}],
// Ψάρια - Additional fish (without existing PORTIONS)
'Σούπιες (βρ.)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:250}],
'Γαρίδες γίγαντες (βρ.)':[{n:'1 λεπτή',g:80},{n:'μερίδα',g:150}],
'Καβούρι (βρ.)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:250}],
'Καλαμαράκια (ψητά)':[{n:'μερίδα',g:150},{n:'μεγάλη',g:250}],
'Φιδάκι (ψητό)':[{n:'φιλέτο',g:150},{n:'μεγάλη μερίδα',g:250}],
// Λαχανικά - Vegetables (without existing PORTIONS)
'Καρότα':[{n:'1 μεσαία',g:100},{n:'2 μεσαίες',g:200},{n:'½ φλ.',g:85}],
'Κολοκυθάκια':[{n:'1 μεσαίο',g:200},{n:'½ φλ. κομμένο',g:90}],
'Κουνουπίδι':[{n:'1 φλιτζάνι',g:100},{n:'1.5 φλιτζάνι',g:150}],
'Μαρούλι':[{n:'2 φλιτζάνια',g:200},{n:'1 κεφάλι μικρό',g:300}],
'Μελιτζάνες':[{n:'1 μεσαία',g:250},{n:'½ φλ.',g:100}],
'Πιπεριές':[{n:'1 μέτρια',g:120},{n:'1 μεγάλη',g:150}],
'Πιπεριά κόκκινη':[{n:'1 μέτρια',g:130},{n:'1 μεγάλη',g:150}],
'Πιπεριά κίτρινη':[{n:'1 μέτρια',g:130},{n:'1 μεγάλη',g:150}],
'Σάλσα κόκκινη':[{n:'½ φλ.',g:120},{n:'1 φλ.',g:240}],
'Ελιές πράσινες':[{n:'5 τεμ.',g:20},{n:'10 τεμ.',g:40}],
'Ελιές μαύρες':[{n:'5 τεμ.',g:20},{n:'10 τεμ.',g:40}],
'Κρεμμύδι':[{n:'1 μεσαίο',g:100},{n:'1 μεγάλο',g:150}],
'Σκόρδο':[{n:'1 κ.γ. θρυμμ.',g:5},{n:'1 κ.σ. θρυμμ.',g:15}],
'Κέϊλ (βρ.)':[{n:'½ φλ.',g:100},{n:'1 φλ.',g:200}],
'Ραπανάκι':[{n:'1/2 δέσμη',g:150},{n:'1 δέσμη',g:300}],
// Φρούτα - Fruits (without existing PORTIONS)
'Κουμουατ':[{n:'1 τεμ.',g:15},{n:'5 τεμ.',g:75}],
// Ξηροί καρποί - Additional nuts/seeds
'Παστέλι':[{n:'1 τεμάχιο',g:25},{n:'2 τεμάχια',g:50}],
'Χαλβάς σεσαμιού':[{n:'1 Κ.',g:15},{n:'1 κ.σ.',g:20},{n:'2 κ.σ.',g:40}],
// Άλλα - Miscellaneous
'Ελεύθερο γεύμα':[{n:'ελεύθερο',g:0}],
// ════ FINAL ADDITIONS — Remaining 20 foods for 100% coverage ════
// Dairy - Cream cheese
'Cream cheese':[{n:'1 κ.σ.',g:15},{n:'2 κ.σ.',g:30},{n:'50g',g:50},{n:'100g',g:100}],
// Vegetables - Those I removed earlier to avoid duplicates
'Αγκινάρες (βρ.)':[{n:'1 αγκινάρα',g:100},{n:'½ φλ.',g:70},{n:'1 φλ.',g:140}],
'Αγκινάρες καρδιές (κονσ.)':[{n:'½ φλ.',g:90},{n:'1 φλ.',g:180}],
'Σαλάτα εποχής':[{n:'2 φλ.',g:200},{n:'1 μπολ',g:250}],
// Breads
'Τορτίλια (large)':[{n:'1 τορτίλια',g:70},{n:'1.5 τορτίλια',g:105}],
'Τορτίλια ολικής άλεσης (Alphamega)':[{n:'1 τορτίλια',g:60},{n:'2 τορτίλιες',g:120}],
// Cheese - Saganaki
'Σαγανάκι (τηγανητό)':[{n:'1 τεμ.',g:80},{n:'2 τεμ.',g:160}],
// FYH Recipes - Petretzeakis breakfast & main courses
'Breakfast Burrito (Πετρετζίκης)':[{n:'1 burrito',g:420},{n:'½ burrito',g:210}],
'Chia Bowl Φράουλα (Πετρετζίκης)':[{n:'1 μπολ',g:385},{n:'½ μπολ',g:190}],
'Overnight Oats Banoffee (Πετρετζίκης)':[{n:'1 μπολ',g:430},{n:'½ μπολ',g:215}],
'Overnight Oats Black Forest (Πετρετζίκης)':[{n:'1 μπολ',g:425},{n:'½ μπολ',g:210}],
'Overnight Oats P.B. & Choco (Πετρετζίκης)':[{n:'1 μπολ',g:470},{n:'½ μπολ',g:235}],
'Αυγά Ποσέ Air Fryer (Πετρετζίκης)':[{n:'1 μπολ',g:370},{n:'μερίδα',g:185}],
'Ομελέτα Γαλοπούλα & Λαχ. (Πετρετζίκης)':[{n:'1 ομελέτα',g:360},{n:'½ ομελέτα',g:180}],
'Λιγκουίνι με Γαρίδες (Πετρετζίκης)':[{n:'1 μερίδα',g:350},{n:'μεγάλη',g:500}],
// Additional wraps
'High Protein Ομελέτα Wrap':[{n:'1 wrap',g:250},{n:'½ wrap',g:125}],
'Wrap με τονοσαλάτα':[{n:'1 wrap',g:240},{n:'½ wrap',g:120}],
// Final 4 vegetables for 100% coverage
'Μανιτάρια':[{n:'1 Κ.',g:10},{n:'½ φλ.',g:85},{n:'1 φλ.',g:170},{n:'1 μπολ',g:200}],
'Μπρόκολο':[{n:'1 κεφάλι μικρό',g:150},{n:'½ φλ. κομμένο',g:85},{n:'1 φλ. κομμένο',g:170}],
'Μπιζέλια (βραστά/ατμού)':[{n:'2 κ.σ.',g:30},{n:'½ φλ.',g:80},{n:'1 φλ.',g:160}],
'Σπανάκι':[{n:'2 φλ. ωμό',g:100},{n:'½ φλ. σιγοψημένο',g:60},{n:'1 φλ. σιγοψημένο',g:120}],
'Παντζάρι (βραστό)':[{n:'1 μεσαίο',g:80},{n:'½ φλ. κύβοι',g:85},{n:'1 φλ. κύβοι',g:170}],
'Παντζάρι (ωμό)':[{n:'1 μεσαίο',g:80},{n:'½ φλ. τριμμένο',g:70},{n:'1 φλ. τριμμένο',g:140}],
'Σπαράγγια':[{n:'6-8 τεμ.',g:100},{n:'12-16 τεμ.',g:200},{n:'1 μπολ',g:150}]
};
var MET_ACTIVITIES=[
  {cat:'🥊 Πολεμικές τέχνες',items:[
    {id:'muay_thai',name:'Muay Thai / Kick Boxing',met:10.3},
    {id:'martial_slow',name:'Πολεμικές τέχνες αργό (εξάσκηση)',met:5.3},
    {id:'boxing_ring',name:'Boxing αγώνας (ring)',met:12.8},
    {id:'boxing_bag',name:'Boxing σάκος (heavy bag)',met:8.3},
    {id:'boxing_spar',name:'Boxing sparring',met:7.8},
    {id:'judo_karate',name:'Judo / Karate / Tae Kwon Do',met:10.3},
    {id:'wrestling',name:'Πάλη (wrestling) αγωνιστικό',met:9.3},
    {id:'bjj_moderate',name:'Brazilian Jiu Jitsu (sparring light)',met:6.0},
    {id:'bjj_vigorous',name:'Brazilian Jiu Jitsu (vigorous/competition)',met:9.0}
  ]},
  {cat:'🏃 Τρέξιμο',items:[
    {id:'jog_gen',name:'Jogging γενικό',met:7.0},
    {id:'run_6',name:'Τρέξιμο 6 km/h (10 min/km)',met:6.0},
    {id:'run_8',name:'Τρέξιμο 8 km/h (12 min/mile)',met:8.3},
    {id:'run_10',name:'Τρέξιμο 10 km/h (6 min/km)',met:9.8},
    {id:'run_11',name:'Τρέξιμο 11 km/h (8.5 min/mile)',met:11.0},
    {id:'run_12',name:'Τρέξιμο 12 km/h (7.5 min/mile)',met:11.5},
    {id:'run_14',name:'Τρέξιμο 14 km/h (6 min/mile)',met:14.5},
    {id:'run_16',name:'Τρέξιμο 16 km/h',met:16.0},
    {id:'run_xc',name:'Τρέξιμο cross country',met:9.0},
    {id:'run_stairs',name:'Τρέξιμο σκάλες ανηφόρα',met:15.0},
    {id:'run_marathon',name:'Μαραθώνιος',met:13.3}
  ]},
  {cat:'🚶 Περπάτημα',items:[
    {id:'walk_3',name:'Περπάτημα αργό 3 km/h',met:2.8},
    {id:'walk_4',name:'Περπάτημα κανονικό 4 km/h',met:3.5},
    {id:'walk_5',name:'Περπάτημα γρήγορο 5-6 km/h',met:5.0},
    {id:'walk_7',name:'Περπάτημα πολύ γρήγορο 7 km/h',met:7.0},
    {id:'walk_uphill',name:'Ανηφόρα (χωρίς φορτίο)',met:6.3},
    {id:'hiking',name:'Πεζοπορία cross country',met:6.0},
    {id:'hiking_pack',name:'Πεζοπορία με σακίδιο',met:7.8},
    {id:'nordic_walk',name:'Nordic walking',met:4.8},
    {id:'stair_slow',name:'Ανέβασμα σκάλες αργό',met:4.0},
    {id:'stair_fast',name:'Ανέβασμα σκάλες γρήγορο',met:8.8}
  ]},
  {cat:'🏋️ Βάρη / Γυμναστική',items:[
    {id:'weights_light',name:'Βάρη ελαφρά (multi-exercises)',met:3.5},
    {id:'weights_heavy',name:'Βάρη βαριά / Power lifting',met:6.0},
    {id:'circuit_mod',name:'Circuit training μέτριο',met:4.3},
    {id:'circuit_vig',name:'Circuit training έντονο (kettlebells)',met:8.0},
    {id:'calisthenics_mod',name:'Κάμψεις/έλξεις/lunges μέτριο',met:3.8},
    {id:'calisthenics_vig',name:'Κάμψεις/έλξεις/jumping jacks έντονο',met:8.0},
    {id:'crossfit',name:'CrossFit / Boot Camp',met:8.0},
    {id:'elliptical',name:'Ελλειπτικό μέτριο',met:5.0},
    {id:'rowing_mod',name:'Κωπηλατικό ergometer μέτριο',met:4.8},
    {id:'rowing_vig',name:'Κωπηλατικό ergometer έντονο',met:7.0},
    {id:'rope_skip',name:'Σκακιστά σχοινί (γενικό)',met:12.3},
    {id:'rope_skip_slow',name:'Σκακιστά σχοινί αργό (<100/min)',met:8.8},
    {id:'health_club',name:'Γυμναστήριο γενικό',met:5.5},
    {id:'gym_artistic',name:'Ενόργανη γυμναστική',met:4.5},
    {id:'gym_rhythmic',name:'Ρυθμική γυμναστική',met:4.5}
  ]},
  {cat:'🧘 Pilates / Yoga',items:[
    {id:'pilates_mat',name:'Pilates mat (γενικό)',met:3.0},
    {id:'pilates_reformer',name:'Pilates reformer',met:3.8},
    {id:'pilates_vig',name:'Pilates έντονο',met:4.5},
    {id:'yoga_hatha',name:'Yoga Hatha (αργό/αναπνοή)',met:2.5},
    {id:'yoga_vinyasa',name:'Yoga Vinyasa / Flow',met:4.0},
    {id:'yoga_power',name:'Power Yoga / Ashtanga',met:5.0},
    {id:'yoga_hot',name:'Hot Yoga / Bikram',met:5.5},
    {id:'stretch_gen',name:'Διατάσεις / Ευλυγισία γενικό',met:2.3},
    {id:'tai_chi',name:'Tai Chi / Qi Gong',met:3.0}
  ]},
  {cat:'🏊 Κολύμβηση',items:[
    {id:'swim_fast',name:'Κολύμβηση ελεύθερο γρήγορο',met:9.8},
    {id:'swim_slow',name:'Κολύμβηση ελεύθερο αργό/μέτριο',met:5.8},
    {id:'swim_gen',name:'Κολύμβηση γενική (lake/ocean)',met:6.0},
    {id:'swim_breast_comp',name:'Πρόσθιο αγωνιστικό',met:10.3},
    {id:'swim_breast_rec',name:'Πρόσθιο αναψυχής',met:5.3},
    {id:'swim_butterfly',name:'Πεταλούδα',met:13.8},
    {id:'swim_backstroke',name:'Ύπτιο αγωνιστικό',met:9.5},
    {id:'swim_crawl_fast',name:'Κρόλ γρήγορο (~75 m/min)',met:10.0},
    {id:'swim_treading',name:'Νερό (treading) έντονο',met:9.8},
    {id:'water_polo',name:'Water polo',met:10.0}
  ]},
  {cat:'🚴 Ποδηλασία',items:[
    {id:'bike_leisure',name:'Ποδηλασία ελεύθερη (<16 km/h)',met:4.0},
    {id:'bike_20',name:'Ποδηλασία 20-22 km/h μέτρια',met:8.0},
    {id:'bike_24',name:'Ποδηλασία 23-25 km/h γρήγορη',met:10.0},
    {id:'bike_racing',name:'Ποδηλασία αγώνας (>30 km/h)',met:15.8},
    {id:'bike_mtn',name:'Mountain bike γενικό',met:8.5},
    {id:'bike_mtn_uphill',name:'Mountain bike ανηφόρα vigorous',met:14.0},
    {id:'bike_stat_mod',name:'Στατικό ποδήλατο μέτριο (90-100W)',met:6.8},
    {id:'bike_stat_vig',name:'Στατικό ποδήλατο έντονο (101-160W)',met:8.8},
    {id:'bike_spin',name:'Spinning / RPM class',met:8.5}
  ]},
  {cat:'⚽ Ομαδικά αθλήματα',items:[
    {id:'soccer_comp',name:'Ποδόσφαιρο αγώνας',met:10.0},
    {id:'soccer_casual',name:'Ποδόσφαιρο casual/γενικό',met:7.0},
    {id:'basketball_game',name:'Μπάσκετ αγώνας',met:8.0},
    {id:'basketball_drill',name:'Μπάσκετ εξάσκηση/drills',met:9.3},
    {id:'volleyball_comp',name:'Βόλεϊ αγωνιστικό (γυμναστήριο)',met:6.0},
    {id:'volleyball_beach',name:'Beach Volley',met:8.0},
    {id:'handball',name:'Χάντμπολ',met:8.0},
    {id:'rugby_comp',name:'Rugby union αγωνιστικό',met:8.3},
    {id:'hockey_ice',name:'Χόκεϊ πάγου',met:8.0},
    {id:'hockey_field',name:'Χόκεϊ γρασίδι',met:7.8},
    {id:'lacrosse',name:'Lacrosse',met:8.0},
    {id:'kickball',name:'Kickball',met:7.0}
  ]},
  {cat:'🎾 Ρακέτα / Αντισφαίριση',items:[
    {id:'tennis_singles',name:'Τένις singles',met:8.0},
    {id:'tennis_doubles',name:'Τένις doubles',met:6.0},
    {id:'squash_gen',name:'Squash γενικό',met:7.3},
    {id:'squash_comp',name:'Squash αγωνιστικό',met:12.0},
    {id:'badminton_comp',name:'Badminton αγωνιστικό',met:7.0},
    {id:'badminton_soc',name:'Badminton social/γενικό',met:4.5},
    {id:'ping_pong',name:'Ping pong / Table tennis',met:4.0},
    {id:'racquetball',name:'Racquetball γενικό',met:7.0},
    {id:'racquetball_comp',name:'Racquetball αγωνιστικό',met:10.0}
  ]},
  {cat:'💃 Χορός / Αερόβιο',items:[
    {id:'aerobic_hi',name:'Aerobic υψηλής έντασης',met:7.3},
    {id:'aerobic_lo',name:'Aerobic χαμηλής έντασης',met:5.0},
    {id:'step_class',name:'Step aerobic (6-8 inch step)',met:8.5},
    {id:'dance_gen',name:'Χορός γενικός (folk, line, salsa)',met:5.5},
    {id:'zumba',name:'Zumba / Dance aerobic',met:7.3}
  ]},
  {cat:'🏂 Υπαίθριες / Χειμερινές',items:[
    {id:'ski_mod',name:'Αλπικό σκι / Snowboard μέτριο',met:5.3},
    {id:'ski_vig',name:'Αλπικό σκι έντονο/αγώνας',met:8.0},
    {id:'ski_xc_mod',name:'Cross country σκι μέτριο',met:9.0},
    {id:'ski_xc_vig',name:'Cross country σκι έντονο',met:12.5},
    {id:'rock_climb',name:'Αναρρίχηση (rock climbing)',met:8.0},
    {id:'kayak_mod',name:'Kayak μέτριο',met:5.0},
    {id:'surf',name:'Surf / Wakeboard',met:6.0},
    {id:'paddle_board',name:'Paddle board standing',met:6.0},
    {id:'rope_jump',name:'Σκοινί αναρρίχησης / Agility',met:12.0}
  ]}
];
var SUPP_TIMINGS=["Πριν το πρωινό","Με το πρωινό","Μεσημεριανό","Πριν προπόνηση (30')","Αμέσως μετά προπόνηση","Βραδινό","Πριν τον ύπνο"];
var EN_SUPP_TIMINGS={
  "Πριν το πρωινό":"Before breakfast","Με το πρωινό":"With breakfast","Μεσημεριανό":"Lunch",
  "Πριν προπόνηση (30')":"Before workout (30min)","Αμέσως μετά προπόνηση":"Immediately post-workout",
  "Βραδινό":"Dinner","Πριν τον ύπνο":"Before bed"
};
var SUPPS=[
 {id:'iron',   name:'Σίδηρος',            nameEn:'Iron',              dose:'',              cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Πριν το πρωινό",d:''}]},
 {id:'multivit',name:'Πολυβιταμίνη',      nameEn:'Multivitamin',      dose:'',              cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Με το πρωινό",d:''},{t:"Μεσημεριανό",d:''}]},
 {id:'bcomplex',name:'Β-Complex',          dose:'',              cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Μεσημεριανό",d:''}]},
 {id:'vit_e',  name:'Βιταμίνη Ε',         nameEn:'Vitamin E',         dose:'',              cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Βραδινό",d:''}]},
 {id:'vit_d3', name:'Βιταμίνη D3',        nameEn:'Vitamin D3',        dose:'1000-4000 IU',  cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Με το πρωινό",d:'1000-2000 IU'},{t:"Βραδινό",d:'1000-2000 IU'}]},
 {id:'magn',   name:'Μαγνήσιο',           nameEn:'Magnesium',         dose:'',              cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Βραδινό",d:''}]},
 {id:'vit_c',  name:'Βιταμίνη C',         nameEn:'Vitamin C',         dose:'500-1000mg',    cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Με το πρωινό",d:'500mg'},{t:"Μεσημεριανό",d:'500mg'}]},
 {id:'calc',   name:'Ασβέστιο',           nameEn:'Calcium',           dose:'1000-1200mg',   cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Με το πρωινό",d:'500mg'},{t:"Βραδινό",d:'500mg'}]},
 {id:'zinc',   name:'Ψευδάργυρος (Zinc)', nameEn:'Zinc',              dose:'15-25mg',       cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Βραδινό",d:'15-25mg'}]},
 {id:'omega3', name:'Omega-3 / Fish Oil',  dose:'1000-3000mg',   cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Με το πρωινό",d:'1000mg'},{t:"Μεσημεριανό",d:'1000mg'}]},
 {id:'coq10', name:'CoQ10',                dose:'100-200mg',     cat:'Βιταμίνες & Μέταλλα', timing:[{t:"Με το πρωινό",d:'100-200mg'}]},
 {id:'hmb',    name:'HMB',                dose:'1g × 3/ημέρα',  cat:'Αμινοξέα & Πρωτεΐνες',timing:[{t:"Με το πρωινό",d:'1g'},{t:"Μεσημεριανό",d:'1g'},{t:"Βραδινό",d:'1g'}]},
 {id:'bcaa',   name:'Αμινοξέα / BCAA',    nameEn:'Amino Acids / BCAA',dose:'',              cat:'Αμινοξέα & Πρωτεΐνες',timing:[{t:"Πριν προπόνηση (30')",d:''}]},
 {id:'glutamine',name:'Γλουταμίνη',       nameEn:'Glutamine',         dose:'8-10g',         cat:'Αμινοξέα & Πρωτεΐνες',timing:[{t:"Αμέσως μετά προπόνηση",d:'8-10g'}]},
 {id:'whey',   name:'Whey Protein',        dose:'0.25-0.40g/kg', cat:'Αμινοξέα & Πρωτεΐνες',timing:[{t:"Αμέσως μετά προπόνηση",d:'0.25-0.40g/kg'}]},
 {id:'casein', name:'Casein',              dose:'',              cat:'Αμινοξέα & Πρωτεΐνες',timing:[{t:"Πριν τον ύπνο",d:''}]},
 {id:'b_alanine',name:'Β-Αλανίνη',        nameEn:'Beta-Alanine',      dose:'4g',            cat:'Pre-Workout',          timing:[{t:"Πριν προπόνηση (30')",d:'4g'}]},
 {id:'citrulline',name:'Κιτρουλλίνη',     nameEn:'Citrulline',        dose:'3g',            cat:'Pre-Workout',          timing:[{t:"Πριν προπόνηση (30')",d:'3g'}]},
 {id:'l_carn', name:'Λ-Καρνιτίνη',        nameEn:'L-Carnitine',       dose:'3g',            cat:'Pre-Workout',          timing:[{t:"Πριν προπόνηση (30')",d:'3g'}]},
 {id:'creatine',name:'Κρεατίνη',          nameEn:'Creatine',          dose:'3-5g',          cat:'Pre-Workout',          timing:[{t:"Αμέσως μετά προπόνηση",d:'3-5g'}]},
 {id:'electro',name:'Ηλεκτρολύτες',       nameEn:'Electrolytes',      dose:'',              cat:'Pre-Workout',          timing:[{t:"Πριν προπόνηση (30')",d:''}]},
 {id:'carbs_pre',name:'Υδατάνθρακες (pre)',nameEn:'Carbs (pre-workout)',dose:'',            cat:'Pre-Workout',          timing:[{t:"Πριν προπόνηση (30')",d:''}]},
 {id:'isotonic',name:'Υποτονικό/Ισοτονικό',nameEn:'Hypotonic/Isotonic Drink',dose:'',        cat:'Pre-Workout',          timing:[{t:"Πριν προπόνηση (30')",d:''}]},
 {id:'soda',   name:'Μαγειρική Σόδα',      nameEn:'Baking Soda',       dose:'',              cat:'Pre-Workout',          timing:[{t:"Πριν προπόνηση (30')",d:''}]},
 {id:'tribulus',name:'Tribulus',           dose:'',              cat:'Αναβολικά & Ορμόνες', timing:[{t:"Με το πρωινό",d:''}]},
 {id:'testoboost',name:'Testoboost',       dose:'D-Ασπ.+Fenugreek',doseEn:'D-Aspartic Acid+Fenugreek',cat:'Αναβολικά & Ορμόνες',timing:[{t:"Με το πρωινό",d:''},{t:"Πριν τον ύπνο",d:'D-Ασπαρτικό + Fenugreek',dEn:'D-Aspartic Acid + Fenugreek'}]},
 {id:'ecdy',   name:'Ecdysterone',         dose:'',              cat:'Αναβολικά & Ορμόνες', timing:[{t:"Αμέσως μετά προπόνηση",d:''}]},
 {id:'hgh',    name:'HGH Boost',           dose:'',              cat:'Αναβολικά & Ορμόνες', timing:[{t:"Πριν τον ύπνο",d:''}]},
 {id:'antiflam',name:'Αντιφλεγμονώδες',   nameEn:'Anti-inflammatory', dose:'',              cat:'Αναβολικά & Ορμόνες', timing:[{t:"Αμέσως μετά προπόνηση",d:''}]},
 {id:'htp',    name:'5-HTP',               dose:'',              cat:'Ύπνος & Αποκατάσταση',timing:[{t:"Πριν τον ύπνο",d:''}]},
 {id:'gaba',   name:'GABA',                dose:'',              cat:'Ύπνος & Αποκατάσταση',timing:[{t:"Πριν τον ύπνο",d:''}]},
 {id:'zma',    name:'ZMA',                 dose:'',              cat:'Ύπνος & Αποκατάσταση',timing:[{t:"Πριν τον ύπνο",d:''}]},
 {id:'valerian',name:'Βαλεριάνα',          nameEn:'Valerian',          dose:'',              cat:'Ύπνος & Αποκατάσταση',timing:[{t:"Πριν τον ύπνο",d:''}]}
];
var MACRO_PRESETS={
  balanced:{label:'Ισορροπημένο',p:25,f:25,c:50,icon:'⚖️'},
  strength:{label:'Δύναμη / Μυϊκή',p:30,f:25,c:45,icon:'🏋️'},
  endurance:{label:'Αντοχή',p:20,f:25,c:55,icon:'🏃'},
  loss:{label:'Απώλεια λίπους',p:35,f:30,c:35,icon:'🔥'},
  martial:{label:'Πολεμικές τέχνες',p:30,f:25,c:45,icon:'🥊'},
  custom:{label:'Προσαρμοσμένο',p:25,f:25,c:50,icon:'✏️'}
};
// Sensible starting preset per goalMain — applied by applyGoalMacros() only as a first-time
// default (never overrides a preset the dietitian already picked deliberately for this client).
var DEFAULT_MACRO_PRESET_BY_GOAL={loss:'loss',mild:'loss',maintain:'balanced',gain:'strength'};
var SPORT_PROFILES={
  bjj:{name:'Brazilian Jiu Jitsu',p:32,f:24,c:44,icon:'🥋',notes:'High protein for explosive power & recovery. Moderate carbs for training endurance.',isMET:true},
  boxing:{name:'Boxing',p:30,f:24,c:46,icon:'🥊',notes:'High protein for power. Strategic carbs for rounds & recovery between sparring.',isMET:true},
  mma:{name:'Mixed Martial Arts',p:32,f:23,c:45,icon:'🤼',notes:'Maximum protein (strength + cardio combo). Balanced carbs for both power & endurance.',isMET:true},
  football:{name:'Ποδόσφαιρο',p:26,f:25,c:49,icon:'⚽',notes:'Balanced macro for mixed sport (speed, power, endurance). High carbs for match intensity.',isMET:true},
  basketball:{name:'Μπάσκετ',p:27,f:25,c:48,icon:'🏀',notes:'Moderate protein. Higher carbs for explosive jumps & court sprints.',isMET:true},
  weightlifting:{name:'Weightlifting',p:32,f:26,c:42,icon:'🏋️',notes:'Maximum protein for strength gains. Moderate carbs to preserve glycogen.',isMET:true},
  cycling:{name:'Ποδηλασία',p:18,f:24,c:58,icon:'🚴',notes:'Very high carbs for endurance. Lower protein (endurance sport). Focus on glycogen.',isMET:true},
  running:{name:'Τρέξιμο',p:16,f:23,c:61,icon:'🏃',notes:'Highest carbs for glycogen stores. Lower protein (endurance-focused). Recovery meals critical.',isMET:true},
  swimming:{name:'Κολύμβηση',p:24,f:24,c:52,icon:'🏊',notes:'High carbs (full-body endurance). Adequate protein for shoulder/arm recovery.',isMET:true},
  crossfit:{name:'CrossFit',p:31,f:25,c:44,icon:'⚡',notes:'High protein (power + metabolic). Moderate carbs (mixed intensity WODs).',isMET:true},
  custom:{name:'Προσαρμοσμένο (χωρίς MET)',p:25,f:25,c:50,icon:'✏️',notes:'Custom macros without MET activity tracking.',isMET:false}
};
var MEAL_TIMING_PROFILES={
  'pre-workout':{
    label:'Pre-workout (2h πριν)',icon:'⚡',
    p:15,f:10,c:75,notes:'High carbs (simple), moderate protein, minimal fat/fiber for fast digestion',
    desc:'2 hours before training — maximize glycogen, minimize GI distress'
  },
  'during-training':{
    label:'During training (>60min)',icon:'🔥',
    p:5,f:5,c:90,notes:'Simple carbs only — fast glucose for continuous energy',
    desc:'During long training sessions >60min — fast carbs (sports drink, gels)'
  },
  'post-workout':{
    label:'Post-workout (0-30min)',icon:'💪',
    p:35,f:8,c:57,notes:'Fast protein + fast carbs for MPS & glycogen, minimal fat',
    desc:'Immediately post-training — maximize muscle protein synthesis window'
  },
  'recovery':{
    label:'Recovery (2h+ post)',icon:'🛌',
    p:25,f:28,c:47,notes:'Balanced nutrition with healthy fats for sustained recovery',
    desc:'2+ hours post-training — complete meal with all nutrients'
  },
  'regular':{
    label:'Regular meal',icon:'🍽️',
    p:25,f:28,c:47,notes:'Balanced macros for standard daily nutrition',
    desc:'No specific timing constraint — standard balanced meal'
  },
  'rest-day':{
    label:'Rest day',icon:'😴',
    p:25,f:28,c:47,notes:'Slightly lower carbs, focus on recovery & micronutrients',
    desc:'Rest/low activity day — focus on nutrient density'
  }
};

// Single source of truth for "which unit does nutrient X use" — referenced by
// SPORT_PROTOCOLS.*.criticalMicronutrients below and by getMicronutrientTargets()
// (js/app-part1.js), so a unit can't silently drift between the two tables again
// (see dietologist-pending-work memory, 2026-07-15 IU/vitamin-D audit).
var NUTRIENT_UNITS={
  iron:'mg',zinc:'mg',magnesium:'mg',calcium:'mg',sodium:'mg',potassium:'mg',
  copper:'µg',selenium:'µg',vitaminD:'mcg',
  b1:'mg',b2:'mg',b3:'mg NE',b6:'mg',b12:'mcg',
  folate:'mcg',omega3:'g',omega6:'g',
  iodine:'mcg',choline:'mg',dha:'mg'
};

var SPORT_PROTOCOLS={
  running:{
    name:'Δρομείς (Τρέξιμο)',category:'Endurance',
    macros:{p:14,f:22,c:64},
    criticalMicronutrients:{
      iron:{target:27,unit:NUTRIENT_UNITS.iron,priority:'CRITICAL',notes:'O2 transport for endurance'},
      calcium:{target:1150,unit:NUTRIENT_UNITS.calcium,priority:'CRITICAL',notes:'Bone density protection'},
      magnesium:{target:365,unit:NUTRIENT_UNITS.magnesium,priority:'CRITICAL',notes:'Muscle function, energy metabolism'},
      vitaminD:{target:37.5,unit:NUTRIENT_UNITS.vitaminD,priority:'HIGH',notes:'Many athletes deficient'}, // 1500 IU ÷ 40
      potassium:{target:3500,unit:NUTRIENT_UNITS.potassium,priority:'HIGH',notes:'Electrolyte balance'}
    },
    recommendedSupplements:[
      {id:'iron',required:false,condition:'if serum ferritin <30µg/L women, <50µg/L men'},
      {id:'vit_d3',required:false,condition:'if deficient'},
      {id:'magn',required:false,condition:'if deficient'}
    ],
    redSAlert:{risk:'Moderate',minCalories:50,details:'Monitor irregular periods (F), hormonal issues, frequent injuries'},
    hydration:{daily:35,training:40,duringEx:'400-800ml/hr',postEx:'150% weight loss / 4hr'},
    hydrationEl:{duringEx:'400-800ml/ώρα',postEx:'150% της απώλειας βάρους / 4 ώρες'},
    mealTiming:{
      preExercise:'2-3hrs before: 1-4g/kg CHO, 0.3-0.5g/kg PRO, <1g/kg FAT',
      duringExercise:'>90min: 30-60g CHO/hr + 500-700mg Na+',
      postExercise:'0-30min: 0.8-1.2g/kg CHO, 0.2-0.4g/kg PRO, 3:1 ratio'
    }
  },
  football:{
    name:'Ποδόσφαιρο (Football/Soccer)',category:'Intermittent High-Intensity',
    macros:{p:18,f:22,c:60},
    criticalMicronutrients:{
      iron:{target:20,unit:NUTRIENT_UNITS.iron,priority:'CRITICAL',notes:'O2 transport for repeated sprints'},
      calcium:{target:1150,unit:NUTRIENT_UNITS.calcium,priority:'CRITICAL',notes:'Bone health (frequent jumping/impact)'},
      magnesium:{target:365,unit:NUTRIENT_UNITS.magnesium,priority:'CRITICAL',notes:'Muscle cramps, energy metabolism'},
      sodium:{target:2000,unit:NUTRIENT_UNITS.sodium,priority:'HIGH',notes:'during match: +500-700mg/hr'},
      potassium:{target:3500,unit:NUTRIENT_UNITS.potassium,priority:'HIGH',notes:'Electrolyte balance'},
      zinc:{target:11,unit:NUTRIENT_UNITS.zinc,priority:'HIGH',notes:'Immune function'}
    },
    recommendedSupplements:[
      {id:'creatine',required:true,dose:'3-5g/day',protocol:'Loading: 5-7g/day×5-7d, then 3-5g/day'},
      {id:'caffeine',required:false,dose:'3-6mg/kg',timing:'60min before match'},
      {id:'betaalanine',required:false,dose:'3-5g/day',protocol:'4-6 weeks loading'},
      {id:'iron',required:false,condition:'if deficient'},
      {id:'vit_d3',required:false,condition:'if deficient'}
    ],
    redSAlert:{risk:'Moderate',minCalories:50,details:'Monitor hormonal health, energy levels'},
    hydration:{daily:35,training:40,beforeMatch:'400-600ml (2-3hrs before)',duringMatch:'150-250ml every 15-20min (6-8% CHO)',postMatch:'150% weight loss / 4-6hrs'},
    hydrationEl:{beforeMatch:'400-600ml (2-3 ώρες πριν)',duringMatch:'150-250ml κάθε 15-20 λεπτά (6-8% υδατ.)',postMatch:'150% της απώλειας βάρους / 4-6 ώρες'},
    mealTiming:{
      matchDay:'3-4hrs before: 1-4g/kg CHO, 0.3-0.5g/kg PRO',
      oneHourBefore:'50-100g CHO (banana, toast with honey)',
      halfTime:'15-30g CHO + electrolytes',
      postMatch:'0-30min: 1-1.2g/kg CHO, 0.3-0.4g/kg PRO, 3:1 ratio'
    }
  },
  judo:{
    name:'Judo (Combat Sport)',category:'Combat - Weight Categories',
    macros:{p:20,f:22,c:58},
    criticalMicronutrients:{
      iron:{target:22,unit:NUTRIENT_UNITS.iron,priority:'CRITICAL',notes:'⚠️ HIGHEST RISK during weight cutting'},
      calcium:{target:1300,unit:NUTRIENT_UNITS.calcium,priority:'CRITICAL',notes:'Bone health, weight cycling risk'},
      magnesium:{target:420,unit:NUTRIENT_UNITS.magnesium,priority:'CRITICAL',notes:'Cramp prevention during weight cut'},
      sodium:{target:2000,unit:NUTRIENT_UNITS.sodium,priority:'CRITICAL',notes:'Weight loss → significant depletion'},
      potassium:{target:3500,unit:NUTRIENT_UNITS.potassium,priority:'HIGH',notes:'Electrolyte balance'},
      zinc:{target:11,unit:NUTRIENT_UNITS.zinc,priority:'HIGH',notes:'Elevated due to stress + weight loss'},
      copper:{target:900,unit:NUTRIENT_UNITS.copper,priority:'HIGH',notes:'Connective tissue (high injury risk)'},
      vitaminD:{target:42.5,unit:NUTRIENT_UNITS.vitaminD,priority:'HIGH',notes:'May need higher'}, // 1700 IU ÷ 40
      selenium:{target:55,unit:NUTRIENT_UNITS.selenium,priority:'HIGH',notes:'Antioxidant, immune function'}
    },
    recommendedSupplements:[
      {id:'creatine',required:true,dose:'3-5g/day',notes:'Improves strength + power'},
      {id:'caffeine',required:true,dose:'3-6mg/kg',timing:'60min before competition'},
      {id:'iron',required:true,condition:'if serum ferritin <30µg/L women, <50µg/L men'},
      {id:'calcium',required:false,condition:'if dietary intake <1000mg/day'},
      {id:'vit_d3',required:false,condition:'if deficient (likely in weight-cutters)'},
      {id:'betaalanine',required:false,dose:'3-5g/day',protocol:'4-6 weeks loading'}
    ],
    redSAlert:{risk:'VERY HIGH',minCalories:55,details:'⚠️ WEIGHT CYCLING HIGH RISK - Monitor irregular periods (F), low testosterone (M), frequent injuries, persistent fatigue, poor concentration'},
    hydration:{daily:35,training:45,duringTraining:'150-250ml every 15-20min',postTraining:'150% weight loss'},
    hydrationEl:{duringTraining:'150-250ml κάθε 15-20 λεπτά',postTraining:'150% της απώλειας βάρους'},
    safeWeightLoss:{
      warning:'⚠️ CRITICAL: Modern safe approach = 0.5-1% per WEEK MAX (NOT 5-10%)',
      normal5to7DaysBefore:'Normal intake, pale urine hydration, normal sodium 1500-2300mg',
      gradualLoss2to3DaysBefore:'0.5-1% body weight per day MAX, 300-500kcal deficit (mostly CHO), MAINTAIN Protein 1.8-2.0g/kg, light technical training only',
      final24Hours:'Minimal loss only: light fluid restriction (2-4hrs before weigh-in), small familiar foods',
      postWeiginCritical:'REHYDRATE: 150% of weight lost over 4-6 hours, Carbs 1.0-1.2g/kg, Protein 0.3-0.4g/kg, Sodium 500-700mg'
    },
    mealTiming:{
      preTraining:'2-3hrs before: 1.5-3.0g/kg CHO, 0.25-0.5g/kg PRO, <1g/kg FAT',
      postTraining:'0-30min: 1.0-1.2g/kg CHO, 0.25-0.4g/kg PRO, 3:1 ratio, +500-700mg Na+'
    }
  }
};
// ✅ Iodine (μg)/Choline (mg)/DHA (mg) προστέθηκαν ανά 100g σε κάθε τρόφιμο παρακάτω (εγκυμοσύνη pass).
// DHA είναι ξεχωριστό από το γενικό Omega3 (Omega3 εδώ = συνολικό, κυρίως ALA σε φυτικά — η μετατροπή
// ALA→DHA είναι ανεπαρκής, γι' αυτό DHA είναι ουσιαστικά μόνο σε ψάρια/θαλασσινά/αυγά, ΟΧΙ σε καρύδια/chia).
// Salmon DHA + tuna/salmon iodine επιβεβαιώθηκαν μέσω USDA/ARS iodine database + ODS-NIH DHA data (verification
// pass). Οι υπόλοιπες τιμές είναι σύμφωνες με τυπικά πρότυπα σύστασης τροφίμων (πχ. αυγό=υψηλή χολίνη,
// γαλακτοκομικά=μέτριο ιώδιο, φυτικά=~0 ιώδιο/DHA) στο ίδιο επίπεδο τεκμηρίωσης με τα υπόλοιπα 9 θρεπτικά
// του πίνακα (ένα γενικό "USDA per 100g", όχι citation ανά κελί) — δεν έχουν όλες επαληθευτεί μεμονωμένα.
// ✅ VitD (mcg per 100g) προστέθηκε 2026-07-15 μόνο στα τρόφιμα με ουσιαστική, καλά τεκμηριωμένη
// περιεκτικότητα (λιπαρά ψάρια, αυγό, βούτυρο, μανιτάρια — USDA FoodData Central τυπικές τιμές).
// Τρόφιμα χωρίς το πεδίο VitD θεωρούνται 0 (ίδια σύμβαση με τα υπόλοιπα πεδία — βλ. getDayMicronutrients'
// (mn.VitD||0)). Ελληνικά γαλακτοκομικά ΔΕΝ θεωρήθηκαν πηγή — δεν εμπλουτίζονται εκ των προτέρων όπως
// στις ΗΠΑ, οπότε η φυσική περιεκτικότητα είναι αμελητέα εκτός αν αναφέρεται ρητά "εμπλουτισμένο".
var MICRONUTRIENTS={
  // Meats
  'Κοτόπουλο στήθος (ψητό)':{Fe:0.8,Zn:0.8,Mg:27,Ca:9,B1:0.07,B2:0.10,B3:9.2,B6:0.90,B12:0.3,Folate:3,Omega3:0.05,Omega6:1.5,Iodine:7,Choline:118,DHA:0},
  'Βοδινό άπαχο (ψητό)':{Fe:2.6,Zn:6.0,Mg:20,Ca:8,B1:0.06,B2:0.17,B3:5.0,B6:0.52,B12:2.4,Folate:7,Omega3:0.05,Omega6:0.9,Iodine:3,Choline:85,DHA:0},
  'Σολομός (ψητός)':{Fe:0.8,Zn:0.8,Mg:27,Ca:13,B1:0.20,B2:0.16,B3:7.2,B6:0.80,B12:3.2,Folate:20,Omega3:2.6,Omega6:1.3,Iodine:15,Choline:90,DHA:1200,VitD:11},
  'Τόνος (κονσέρβα)':{Fe:1.3,Zn:0.6,Mg:34,Ca:7,B1:0.05,B2:0.05,B3:5.1,B6:0.40,B12:1.0,Folate:1,Omega3:0.24,Omega6:0.1,Iodine:9,Choline:65,DHA:230,VitD:2},
  // Dairy & Eggs
  'Ασπράδια αυγών':{Fe:0.03,Zn:0.01,Mg:11,Ca:7,B1:0.01,B2:0.44,B3:0.10,B6:0.01,B12:0.6,Folate:8,Omega3:0,Omega6:0,Iodine:7,Choline:1,DHA:0},
  'Γάλα αγελάδος':{Fe:0.07,Zn:0.37,Mg:13,Ca:113,B1:0.04,B2:0.16,B3:0.10,B6:0.05,B12:0.44,Folate:5,Omega3:0.06,Omega6:1.2,Iodine:19,Choline:12,DHA:0},
  'Γιαούρτι ελληνικό':{Fe:0.10,Zn:0.57,Mg:17,Ca:126,B1:0.06,B2:0.24,B3:0.15,B6:0.08,B12:0.37,Folate:7,Omega3:0.04,Omega6:0.5,Iodine:20,Choline:14,DHA:0},
  'Τυρί φέτα':{Fe:0.70,Zn:3.57,Mg:42,Ca:493,B1:0.03,B2:0.39,B3:0.35,B6:0.25,B12:0.64,Folate:6,Omega3:0.22,Omega6:2.5,Iodine:15,Choline:15,DHA:0},
  // Grains
  'Ρύζι λευκό (βρ.)':{Fe:0.28,Zn:0.62,Mg:12,Ca:10,B1:0.07,B2:0.04,B3:1.6,B6:0.12,B12:0,Folate:20,Omega3:0.05,Omega6:0.9,Iodine:0,Choline:2,DHA:0},
  'Ρύζι καστανό (βρ.)':{Fe:0.66,Zn:1.09,Mg:44,Ca:23,B1:0.12,B2:0.05,B3:3.0,B6:0.35,B12:0,Folate:8,Omega3:0.08,Omega6:1.8,Iodine:0,Choline:9,DHA:0},
  'Ψωμί ολικής άλεσης':{Fe:2.73,Zn:1.91,Mg:83,Ca:167,B1:0.39,B2:0.28,B3:4.6,B6:0.37,B12:0,Folate:38,Omega3:0.70,Omega6:4.5,Iodine:5,Choline:15,DHA:0},
  'Βρώμη (ωμή)':{Fe:4.72,Zn:3.64,Mg:142,Ca:52,B1:0.76,B2:0.13,B3:0.96,B6:0.12,B12:0,Folate:56,Omega3:0.42,Omega6:5.7,Iodine:4,Choline:40,DHA:0},
  // Vegetables & Fruits
  'Σπανάκι (ωμό)':{Fe:2.71,Zn:0.53,Mg:79,Ca:99,B1:0.08,B2:0.19,B3:0.72,B6:0.39,B12:0,Folate:194,Omega3:0.34,Omega6:0.2,Iodine:12,Choline:19,DHA:0},
  'Μπρόκολο':{Fe:0.73,Zn:0.63,Mg:21,Ca:47,B1:0.07,B2:0.12,B3:0.64,B6:0.18,B12:0,Folate:63,Omega3:0.09,Omega6:0.1,Iodine:6,Choline:19,DHA:0},
  'Μπιζέλια (βραστά/ατμού)':{Fe:1.47,Zn:1.19,Mg:33,Ca:27,B1:0.25,B2:0.13,B3:2.09,B6:0.17,B12:0,Folate:65,Omega3:0.04,Omega6:0.08,Iodine:0,Choline:28,DHA:0},
  'Ντομάτα':{Fe:0.27,Zn:0.17,Mg:10,Ca:12,B1:0.04,B2:0.02,B3:0.59,B6:0.08,B12:0,Folate:15,Omega3:0.05,Omega6:0.2,Iodine:0,Choline:7,DHA:0},
  'Λεμόνι':{Fe:0.6,Zn:0.1,Mg:8,Ca:26,B1:0.04,B2:0.02,B3:0.1,B6:0.08,B12:0,Folate:11,Omega3:0.03,Omega6:0.02,Iodine:0,Choline:5,DHA:0},
  // Legumes
  'Φακές':{Fe:3.3,Zn:3.27,Mg:47,Ca:36,B1:0.64,B2:0.19,B3:2.13,B6:0.54,B12:0,Folate:181,Omega3:0.06,Omega6:0.3,Iodine:0,Choline:28,DHA:0},
  'Ρεβίθια':{Fe:2.89,Zn:2.11,Mg:48,Ca:49,B1:0.48,B2:0.21,B3:1.54,B6:0.54,B12:0,Folate:172,Omega3:0.06,Omega6:0.7,Iodine:0,Choline:35,DHA:0},
  // Nuts & Seeds
  'Αμύγδαλα':{Fe:3.71,Zn:3.12,Mg:270,Ca:264,B1:0.20,B2:0.92,B3:3.62,B6:0.10,B12:0,Folate:50,Omega3:0.39,Omega6:12.3,Iodine:0,Choline:52,DHA:0},
  'Chia seeds':{Fe:8.0,Zn:4.58,Mg:335,Ca:631,B1:0.62,B2:0.27,B3:8.83,B6:0.90,B12:0,Folate:78,Omega3:17.83,Omega6:5.8,Iodine:0,Choline:63,DHA:0},
  // Oils
  'Ελαιόλαδο':{Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0.76,Omega6:9.7,Iodine:0,Choline:0,DHA:0},
  // ── Expanded coverage (USDA per 100g) ──────────────────────────────────────
  // Meats / Poultry / Fish (cooked)
  'Κοτόπουλο μπούτι (ψητό)':{Fe:1.13,Zn:1.92,Mg:24,Ca:9,B1:0.096,B2:0.218,B3:6.21,B6:0.462,B12:0.42,Folate:5,Omega3:0.061,Omega6:1.46,Iodine:6,Choline:65,DHA:0},
  'Κοτόπουλο σουβλάκι':{Fe:1.04,Zn:1.0,Mg:29,Ca:15,B1:0.07,B2:0.114,B3:13.7,B6:0.60,B12:0.34,Folate:4,Omega3:0.05,Omega6:1.5,Iodine:6,Choline:65,DHA:0},
  'Κοτόπουλο μπιφτέκι':{Fe:1.1,Zn:1.5,Mg:26,Ca:12,B1:0.08,B2:0.17,B3:10.0,B6:0.53,B12:0.38,Folate:5,Omega3:0.06,Omega6:1.5,Iodine:6,Choline:65,DHA:0},
  'Γαλοπούλα στήθος':{Fe:0.71,Zn:1.72,Mg:32,Ca:9,B1:0.035,B2:0.205,B3:11.8,B6:0.807,B12:0.39,Folate:9,Omega3:0.03,Omega6:0.6,Iodine:35,Choline:65,DHA:0},
  'Μπριζόλα άπαχη':{Fe:1.96,Zn:5.21,Mg:24,Ca:19,B1:0.072,B2:0.128,B3:7.87,B6:0.578,B12:1.91,Folate:9,Omega3:0.02,Omega6:0.3,Iodine:3,Choline:85,DHA:0},
  'Λαβράκι (ψητό)':{Fe:0.37,Zn:0.52,Mg:53,Ca:13,B1:0.13,B2:0.15,B3:1.9,B6:0.46,B12:0.3,Folate:6,Omega3:0.86,Omega6:0.1,Iodine:30,Choline:65,DHA:400,VitD:2},
  'Τσιπούρα (ψητή)':{Fe:0.4,Zn:0.5,Mg:39,Ca:20,B1:0.10,B2:0.12,B3:3.0,B6:0.40,B12:1.0,Folate:8,Omega3:0.50,Omega6:0.1,Iodine:30,Choline:65,DHA:400,VitD:2},
  'Γαρίδες (βραστές)':{Fe:0.5,Zn:1.6,Mg:39,Ca:70,B1:0.03,B2:0.04,B3:2.6,B6:0.16,B12:1.5,Folate:19,Omega3:0.30,Omega6:0.03,Iodine:35,Choline:65,DHA:170},
  // Eggs / Dairy
  'Αυγά (ολόκληρα)':{Fe:1.75,Zn:1.29,Mg:12,Ca:56,B1:0.04,B2:0.457,B3:3.3,B6:0.17,B12:0.89,Folate:47,Omega3:0.036,Omega6:1.53,Iodine:24,Choline:294,DHA:18,VitD:2},
  'Γιαούρτι 2%':{Fe:0.04,Zn:0.60,Mg:11,Ca:115,B1:0.044,B2:0.233,B3:0.197,B6:0.055,B12:0.52,Folate:12,Omega3:0.02,Omega6:0.07,Iodine:20,Choline:14,DHA:0},
  'Arla Protein Γιαουρτάκι Σοκολάτα (πουτίγκα)':{Fe:0.10,Zn:0.55,Mg:24,Ca:160,B1:0.04,B2:0.20,B3:0.15,B6:0.05,B12:0.55,Folate:6,Omega3:0.01,Omega6:0.04,Iodine:8,Choline:12,DHA:0},
  'Arla Protein Ρόφημα Σοκολάτα':{Fe:0.05,Zn:0.45,Mg:13,Ca:135,B1:0.04,B2:0.19,B3:0.12,B6:0.04,B12:0.48,Folate:5,Omega3:0.01,Omega6:0.03,Iodine:8,Choline:10,DHA:0},
  'Cottage cheese':{Fe:0.13,Zn:0.51,Mg:9,Ca:111,B1:0.02,B2:0.251,B3:0.103,B6:0.057,B12:0.47,Folate:8,Omega3:0.01,Omega6:0.04,Iodine:14,Choline:18,DHA:0},
  'Γάλα πλήρες':{Fe:0.03,Zn:0.37,Mg:10,Ca:113,B1:0.046,B2:0.169,B3:0.089,B6:0.036,B12:0.45,Folate:5,Omega3:0.08,Omega6:0.12,Iodine:19,Choline:12,DHA:0},
  // Fruits
  'Μήλο':{Fe:0.12,Zn:0.04,Mg:5,Ca:6,B1:0.02,B2:0.03,B3:0.09,B6:0.04,B12:0,Folate:3,Omega3:0.009,Omega6:0.04,Iodine:0,Choline:3,DHA:0},
  'Μπανάνα':{Fe:0.26,Zn:0.15,Mg:27,Ca:5,B1:0.03,B2:0.07,B3:0.66,B6:0.37,B12:0,Folate:20,Omega3:0.03,Omega6:0.05,Iodine:0,Choline:10,DHA:0},
  'Πορτοκάλι':{Fe:0.10,Zn:0.07,Mg:10,Ca:40,B1:0.09,B2:0.04,B3:0.28,B6:0.06,B12:0,Folate:30,Omega3:0.008,Omega6:0.02,Iodine:0,Choline:8,DHA:0},
  'Φράουλες':{Fe:0.41,Zn:0.14,Mg:13,Ca:16,B1:0.02,B2:0.02,B3:0.39,B6:0.05,B12:0,Folate:24,Omega3:0.065,Omega6:0.09,Iodine:0,Choline:6,DHA:0},
  'Ροδάκινο':{Fe:0.25,Zn:0.17,Mg:9,Ca:6,B1:0.02,B2:0.03,B3:0.80,B6:0.025,B12:0,Folate:4,Omega3:0.002,Omega6:0.08,Iodine:0,Choline:6,DHA:0},
  'Κεράσια':{Fe:0.36,Zn:0.07,Mg:11,Ca:13,B1:0.027,B2:0.033,B3:0.15,B6:0.05,B12:0,Folate:4,Omega3:0.026,Omega6:0.03,Iodine:0,Choline:6,DHA:0},
  'Καρπούζι':{Fe:0.24,Zn:0.10,Mg:10,Ca:7,B1:0.03,B2:0.02,B3:0.18,B6:0.045,B12:0,Folate:3,Omega3:0,Omega6:0.05,Iodine:0,Choline:4,DHA:0},
  'Μούρα':{Fe:0.28,Zn:0.16,Mg:6,Ca:6,B1:0.037,B2:0.04,B3:0.42,B6:0.05,B12:0,Folate:6,Omega3:0.06,Omega6:0.09,Iodine:0,Choline:6,DHA:0},
  // Vegetables
  'Αγγούρι':{Fe:0.28,Zn:0.20,Mg:13,Ca:16,B1:0.027,B2:0.033,B3:0.10,B6:0.04,B12:0,Folate:7,Omega3:0.005,Omega6:0.02,Iodine:0,Choline:6,DHA:0},
  'Τομάτες':{Fe:0.27,Zn:0.17,Mg:11,Ca:10,B1:0.037,B2:0.019,B3:0.59,B6:0.08,B12:0,Folate:15,Omega3:0.003,Omega6:0.08,Iodine:0,Choline:7,DHA:0},
  'Κολοκυθάκια':{Fe:0.37,Zn:0.32,Mg:18,Ca:16,B1:0.045,B2:0.094,B3:0.45,B6:0.16,B12:0,Folate:24,Omega3:0.05,Omega6:0.02,Iodine:0,Choline:9,DHA:0},
  'Μελιτζάνες':{Fe:0.23,Zn:0.16,Mg:14,Ca:9,B1:0.04,B2:0.04,B3:0.65,B6:0.08,B12:0,Folate:22,Omega3:0.013,Omega6:0.06,Iodine:0,Choline:7,DHA:0},
  'Μανιτάρια':{Fe:0.50,Zn:0.52,Mg:9,Ca:3,B1:0.08,B2:0.40,B3:3.6,B6:0.10,B12:0.04,Folate:17,Omega3:0,Omega6:0.13,Iodine:2,Choline:17,DHA:0,VitD:0.2},
  'Σπαράγγια':{Fe:2.1,Zn:0.54,Mg:14,Ca:24,B1:0.14,B2:0.14,B3:0.98,B6:0.09,B12:0,Folate:52,Omega3:0.01,Omega6:0.08,Iodine:0,Choline:16,DHA:0},
  'Φασολάκια':{Fe:1.0,Zn:0.24,Mg:25,Ca:37,B1:0.08,B2:0.10,B3:0.75,B6:0.14,B12:0,Folate:33,Omega3:0.07,Omega6:0.04,Iodine:0,Choline:15,DHA:0},
  'Σπανάκι':{Fe:2.71,Zn:0.53,Mg:79,Ca:99,B1:0.078,B2:0.189,B3:0.72,B6:0.195,B12:0,Folate:194,Omega3:0.14,Omega6:0.03,Iodine:12,Choline:19,DHA:0},
  'Παντζάρι (βραστό)':{Fe:0.79,Zn:0.35,Mg:23,Ca:16,B1:0.027,B2:0.04,B3:0.33,B6:0.067,B12:0,Folate:80,Omega3:0.005,Omega6:0.05,Iodine:0,Choline:6,DHA:0},
  'Παντζάρι (ωμό)':{Fe:0.80,Zn:0.35,Mg:23,Ca:16,B1:0.031,B2:0.04,B3:0.334,B6:0.067,B12:0,Folate:109,Omega3:0.005,Omega6:0.055,Iodine:0,Choline:6,DHA:0},
  'Πιπεριές':{Fe:0.43,Zn:0.25,Mg:12,Ca:10,B1:0.054,B2:0.085,B3:0.98,B6:0.29,B12:0,Folate:46,Omega3:0.03,Omega6:0.05,Iodine:0,Choline:5,DHA:0},
  'Μαρούλι':{Fe:0.86,Zn:0.18,Mg:13,Ca:36,B1:0.07,B2:0.08,B3:0.38,B6:0.09,B12:0,Folate:38,Omega3:0.06,Omega6:0.02,Iodine:3,Choline:7,DHA:0},
  'Σκόρδο':{Fe:1.7,Zn:1.16,Mg:25,Ca:181,B1:0.20,B2:0.11,B3:0.70,B6:1.24,B12:0,Folate:3,Omega3:0.005,Omega6:0.23,Iodine:0,Choline:24,DHA:0},
  'Κρεμμύδι':{Fe:0.21,Zn:0.17,Mg:10,Ca:23,B1:0.046,B2:0.027,B3:0.12,B6:0.12,B12:0,Folate:19,Omega3:0.004,Omega6:0.013,Iodine:1,Choline:6,DHA:0},
  // Grains / Starches (cooked)
  'Γλυκοπατάτα':{Fe:0.69,Zn:0.32,Mg:25,Ca:38,B1:0.11,B2:0.11,B3:1.49,B6:0.29,B12:0,Folate:6,Omega3:0.01,Omega6:0.05,Iodine:0,Choline:13,DHA:0},
  'Κινόα (βρ.)':{Fe:1.49,Zn:1.09,Mg:64,Ca:17,B1:0.107,B2:0.11,B3:0.41,B6:0.12,B12:0,Folate:42,Omega3:0.09,Omega6:1.0,Iodine:0,Choline:23,DHA:0},
  'Πλιγούρι (βρ.)':{Fe:0.96,Zn:0.57,Mg:32,Ca:10,B1:0.057,B2:0.028,B3:1.0,B6:0.08,B12:0,Folate:18,Omega3:0.02,Omega6:0.2,Iodine:0,Choline:9,DHA:0},
  'Μακαρόνια (βρ.)':{Fe:0.50,Zn:0.51,Mg:18,Ca:7,B1:0.02,B2:0.02,B3:0.40,B6:0.049,B12:0,Folate:7,Omega3:0.03,Omega6:0.2,Iodine:0,Choline:5,DHA:0},
  'Κριθαράκι (βρ.)':{Fe:0.50,Zn:0.51,Mg:18,Ca:7,B1:0.02,B2:0.02,B3:0.40,B6:0.049,B12:0,Folate:7,Omega3:0.03,Omega6:0.2,Iodine:0,Choline:5,DHA:0},
  'Ρύζι άσπρο (βρ.)':{Fe:0.28,Zn:0.62,Mg:12,Ca:10,B1:0.07,B2:0.04,B3:1.6,B6:0.12,B12:0,Folate:20,Omega3:0.05,Omega6:0.9,Iodine:0,Choline:2,DHA:0},
  'Πίτα αραβική':{Fe:1.6,Zn:0.6,Mg:26,Ca:86,B1:0.34,B2:0.20,B3:2.9,B6:0.04,B12:0,Folate:45,Omega3:0.02,Omega6:0.5,Iodine:5,Choline:10,DHA:0},
  'Ψωμί σίκαλης':{Fe:2.5,Zn:1.4,Mg:40,Ca:73,B1:0.17,B2:0.17,B3:1.7,B6:0.07,B12:0,Folate:35,Omega3:0.06,Omega6:0.6,Iodine:5,Choline:15,DHA:0},
  'Ψωμί λευκό':{Fe:3.6,Zn:0.7,Mg:23,Ca:151,B1:0.40,B2:0.23,B3:3.9,B6:0.10,B12:0,Folate:85,Omega3:0.03,Omega6:0.5,Iodine:10,Choline:15,DHA:0},
  // Legumes
  'Φασόλια':{Fe:3.7,Zn:1.38,Mg:63,Ca:90,B1:0.118,B2:0.046,B3:0.14,B6:0.093,B12:0,Folate:81,Omega3:0.10,Omega6:0.2,Iodine:0,Choline:28,DHA:0},
  // Fats / Nuts
  'Αβοκάντο':{Fe:0.55,Zn:0.64,Mg:29,Ca:12,B1:0.067,B2:0.13,B3:1.74,B6:0.26,B12:0,Folate:81,Omega3:0.11,Omega6:1.7,Iodine:0,Choline:14,DHA:0},
  'Ελιές':{Fe:3.3,Zn:0.22,Mg:11,Ca:88,B1:0.003,B2:0,B3:0.04,B6:0.009,B12:0,Folate:3,Omega3:0.06,Omega6:1.2,Iodine:0,Choline:0,DHA:0},
  'Καρύδια':{Fe:2.9,Zn:3.1,Mg:158,Ca:98,B1:0.34,B2:0.15,B3:1.1,B6:0.54,B12:0,Folate:98,Omega3:9.1,Omega6:38.1,Iodine:0,Choline:39,DHA:0},
  'Φυστικοβούτυρο':{Fe:1.9,Zn:2.5,Mg:154,Ca:49,B1:0.10,B2:0.11,B3:13.1,B6:0.40,B12:0,Folate:87,Omega3:0.05,Omega6:11.4,Iodine:0,Choline:20,DHA:0},
  // ── Coverage expansion 2026-07-09 (USDA-typical per 100g, same precision level as existing entries) ──
  // Meats
  'Κοτόπουλο βραστό':{Fe:0.7,Zn:0.7,Mg:25,Ca:8,B1:0.06,B2:0.09,B3:8.5,B6:0.85,B12:0.3,Folate:3,Omega3:0.04,Omega6:1.3,Iodine:7,Choline:110,DHA:0},
  'Κουνέλι (μαγ.)':{Fe:1.3,Zn:1.7,Mg:23,Ca:19,B1:0.08,B2:0.13,B3:8.9,B6:0.44,B12:6.9,Folate:9,Omega3:0.1,Omega6:0.4,Iodine:2,Choline:78,DHA:0},
  'Χοιρινό (μπριζόλα)':{Fe:0.9,Zn:2.4,Mg:22,Ca:14,B1:0.7,B2:0.3,B3:5.4,B6:0.5,B12:0.7,Folate:5,Omega3:0.06,Omega6:1.0,Iodine:3,Choline:80,DHA:0},
  'Βοδινά φιλετάκια':{Fe:2.5,Zn:5.8,Mg:21,Ca:9,B1:0.07,B2:0.18,B3:5.2,B6:0.5,B12:2.3,Folate:7,Omega3:0.05,Omega6:0.9,Iodine:3,Choline:83,DHA:0},
  'Βοδινά μπιφτέκια (ψημένα)':{Fe:2.4,Zn:5.3,Mg:20,Ca:16,B1:0.06,B2:0.19,B3:4.7,B6:0.4,B12:2.1,Folate:8,Omega3:0.06,Omega6:1.0,Iodine:3,Choline:80,DHA:0},
  'Μοσχάρι (ψητό)':{Fe:2.6,Zn:5.9,Mg:20,Ca:9,B1:0.07,B2:0.2,B3:6.0,B6:0.45,B12:1.5,Folate:8,Omega3:0.04,Omega6:0.7,Iodine:3,Choline:90,DHA:0},
  'Μοσχάρι κιμάς (μαγ.)':{Fe:2.2,Zn:4.8,Mg:19,Ca:15,B1:0.06,B2:0.19,B3:4.5,B6:0.4,B12:1.8,Folate:9,Omega3:0.07,Omega6:1.1,Iodine:3,Choline:78,DHA:0},
  'Βοδινός κιμάς (μαγ.)':{Fe:2.3,Zn:5.0,Mg:18,Ca:18,B1:0.05,B2:0.18,B3:4.4,B6:0.35,B12:2.2,Folate:9,Omega3:0.08,Omega6:1.4,Iodine:3,Choline:75,DHA:0},
  'Βοδινός κιμάς άπαχος (μαγ.)':{Fe:2.7,Zn:5.5,Mg:21,Ca:10,B1:0.06,B2:0.19,B3:5.0,B6:0.42,B12:2.4,Folate:8,Omega3:0.05,Omega6:0.9,Iodine:3,Choline:82,DHA:0},
  'Αρνί (ψητό)':{Fe:1.9,Zn:4.5,Mg:21,Ca:15,B1:0.1,B2:0.23,B3:6.0,B6:0.14,B12:2.6,Folate:18,Omega3:0.15,Omega6:0.9,Iodine:3,Choline:85,DHA:0},
  'Χοιρινός κιμάς (μαγ.)':{Fe:1.0,Zn:2.6,Mg:20,Ca:16,B1:0.6,B2:0.25,B3:5.0,B6:0.45,B12:0.6,Folate:4,Omega3:0.08,Omega6:1.6,Iodine:3,Choline:78,DHA:0},
  'Γαλακτοπουλο (βρ.)':{Fe:1.2,Zn:3.0,Mg:20,Ca:12,B1:0.09,B2:0.2,B3:5.5,B6:0.3,B12:2.0,Folate:10,Omega3:0.1,Omega6:0.6,Iodine:3,Choline:80,DHA:0},
  'Κιμάς κοτόπουλο (μαγ.)':{Fe:0.9,Zn:1.4,Mg:23,Ca:12,B1:0.06,B2:0.15,B3:6.5,B6:0.4,B12:0.35,Folate:6,Omega3:0.06,Omega6:1.4,Iodine:6,Choline:70,DHA:0},
  'Λούτζα':{Fe:1.0,Zn:2.0,Mg:20,Ca:10,B1:0.5,B2:0.2,B3:5.0,B6:0.4,B12:0.6,Folate:3,Omega3:0.05,Omega6:1.0,Iodine:3,Choline:75,DHA:0},
  'Moving Mountains Burger':{Fe:2.5,Zn:1.8,Mg:30,Ca:40,B1:0.15,B2:0.1,B3:2.0,B6:0.2,B12:0.5,Folate:20,Omega3:0.3,Omega6:3.0,Iodine:0,Choline:20,DHA:0},
  'Grillman Chicken Burger':{Fe:1.0,Zn:1.2,Mg:22,Ca:15,B1:0.07,B2:0.12,B3:7.0,B6:0.4,B12:0.3,Folate:5,Omega3:0.05,Omega6:1.4,Iodine:5,Choline:60,DHA:0},
  'Μπιφτέκι Κοτόπουλο Πηδηχτούλης Κόκορας':{Fe:0.9,Zn:1.3,Mg:22,Ca:14,B1:0.07,B2:0.14,B3:7.5,B6:0.45,B12:0.3,Folate:5,Omega3:0.05,Omega6:1.3,Iodine:5,Choline:65,DHA:0},
  // Fish / Seafood
  'Μπακαλιάρος (ψητός)':{Fe:0.4,Zn:0.5,Mg:33,Ca:16,B1:0.08,B2:0.06,B3:2.1,B6:0.28,B12:1.2,Folate:8,Omega3:0.2,Omega6:0.02,Iodine:110,Choline:65,DHA:130,VitD:1},
  'Σκουμπρί (ψητό)':{Fe:1.6,Zn:0.8,Mg:97,Ca:15,B1:0.18,B2:0.4,B3:9.1,B6:0.4,B12:9.0,Folate:2,Omega3:2.5,Omega6:0.2,Iodine:100,Choline:80,DHA:1000,VitD:14},
  'Χταπόδι (βρ.)':{Fe:5.3,Zn:1.7,Mg:30,Ca:106,B1:0.03,B2:0.08,B3:2.1,B6:0.36,B12:20,Folate:16,Omega3:0.16,Omega6:0.03,Iodine:20,Choline:65,DHA:130},
  'Καλαμάρι (ψητό)':{Fe:0.7,Zn:1.5,Mg:33,Ca:32,B1:0.02,B2:0.4,B3:2.2,B6:0.18,B12:1.3,Folate:5,Omega3:0.5,Omega6:0.02,Iodine:15,Choline:65,DHA:150},
  'Μύδια (βρ.)':{Fe:4.5,Zn:1.6,Mg:34,Ca:26,B1:0.16,B2:0.21,B3:1.6,B6:0.05,B12:12,Folate:42,Omega3:0.4,Omega6:0.03,Iodine:140,Choline:60,DHA:180},
  'Σούπιες (βρ.)':{Fe:6.0,Zn:1.8,Mg:30,Ca:90,B1:0.02,B2:0.09,B3:2.5,B6:0.15,B12:1.3,Folate:8,Omega3:0.3,Omega6:0.02,Iodine:20,Choline:65,DHA:130},
  'Γαρίδες γίγαντες (βρ.)':{Fe:0.5,Zn:1.6,Mg:39,Ca:70,B1:0.03,B2:0.04,B3:2.6,B6:0.16,B12:1.5,Folate:19,Omega3:0.3,Omega6:0.03,Iodine:35,Choline:65,DHA:170},
  'Καβούρι (βρ.)':{Fe:0.7,Zn:3.5,Mg:26,Ca:50,B1:0.08,B2:0.06,B3:2.6,B6:0.24,B12:9.8,Folate:43,Omega3:0.3,Omega6:0.03,Iodine:60,Choline:65,DHA:150},
  'Καλαμαράκια (ψητά)':{Fe:0.7,Zn:1.5,Mg:33,Ca:32,B1:0.02,B2:0.4,B3:2.2,B6:0.18,B12:1.3,Folate:5,Omega3:0.5,Omega6:0.02,Iodine:15,Choline:65,DHA:150},
  'Φιδάκι (ψητό)':{Fe:0.5,Zn:0.5,Mg:35,Ca:15,B1:0.1,B2:0.1,B3:3.0,B6:0.4,B12:2.0,Folate:8,Omega3:0.5,Omega6:0.1,Iodine:25,Choline:65,DHA:300},
  // Eggs / Dairy
  'Cream cheese':{Fe:0.15,Zn:0.15,Mg:5,Ca:98,B1:0.02,B2:0.14,B3:0.05,B6:0.02,B12:0.2,Folate:9,Omega3:0.05,Omega6:0.7,Iodine:5,Choline:20,DHA:0},
  'Μοτσαρέλα':{Fe:0.15,Zn:2.9,Mg:20,Ca:505,B1:0.02,B2:0.28,B3:0.1,B6:0.06,B12:1.2,Folate:7,Omega3:0.1,Omega6:0.5,Iodine:20,Choline:15,DHA:0},
  'Γάλα αμυγδάλου':{Fe:0.3,Zn:0.1,Mg:6,Ca:186,B1:0.01,B2:0.15,B3:0.2,B6:0.01,B12:0,Folate:0,Omega3:0.01,Omega6:0.2,Iodine:0,Choline:5,DHA:0},
  'Πρωτεΐνη σκόνη (whey)':{Fe:0.5,Zn:2.0,Mg:20,Ca:150,B1:0.05,B2:0.6,B3:1.0,B6:0.1,B12:1.0,Folate:10,Omega3:0.05,Omega6:0.3,Iodine:5,Choline:30,DHA:0},
  'Πρωτεΐνη Αμυγδάλου (Amino Animo Organic)':{Fe:3.0,Zn:2.5,Mg:150,Ca:100,B1:0.1,B2:0.3,B3:2.0,B6:0.1,B12:0,Folate:20,Omega3:0.1,Omega6:5.0,Iodine:0,Choline:20,DHA:0},
  'Στραγγιστό γιαούρτι 0%':{Fe:0.04,Zn:0.5,Mg:11,Ca:110,B1:0.03,B2:0.25,B3:0.15,B6:0.05,B12:0.5,Folate:10,Omega3:0.01,Omega6:0.02,Iodine:18,Choline:12,DHA:0},
  'Γιαούρτι πλήρες 5%':{Fe:0.05,Zn:0.55,Mg:11,Ca:115,B1:0.03,B2:0.24,B3:0.15,B6:0.05,B12:0.4,Folate:10,Omega3:0.05,Omega6:0.15,Iodine:18,Choline:14,DHA:0},
  'Ανθότυρο':{Fe:0.2,Zn:0.6,Mg:9,Ca:130,B1:0.02,B2:0.25,B3:0.1,B6:0.05,B12:0.4,Folate:8,Omega3:0.05,Omega6:0.2,Iodine:15,Choline:18,DHA:0},
  'Μυζήθρα':{Fe:0.3,Zn:1.5,Mg:12,Ca:300,B1:0.02,B2:0.3,B3:0.1,B6:0.06,B12:0.5,Folate:10,Omega3:0.1,Omega6:0.5,Iodine:15,Choline:20,DHA:0},
  'Γάλα σόγιας':{Fe:0.6,Zn:0.3,Mg:19,Ca:120,B1:0.05,B2:0.17,B3:0.5,B6:0.05,B12:0.4,Folate:5,Omega3:0.1,Omega6:1.0,Iodine:0,Choline:20,DHA:0},
  'Γάλα βρώμης':{Fe:0.3,Zn:0.1,Mg:8,Ca:120,B1:0.05,B2:0.15,B3:0.3,B6:0.02,B12:0.4,Folate:2,Omega3:0.02,Omega6:0.3,Iodine:0,Choline:5,DHA:0},
  'Γάλα φρέσκο 1.5% Λιπαρά':{Fe:0.03,Zn:0.35,Mg:10,Ca:115,B1:0.045,B2:0.17,B3:0.09,B6:0.036,B12:0.45,Folate:5,Omega3:0.05,Omega6:0.08,Iodine:19,Choline:12,DHA:0},
  'Koko Γιαούρτι Καρύδας (Νηστίσιμο)':{Fe:0.4,Zn:0.3,Mg:15,Ca:20,B1:0.02,B2:0.02,B3:0.3,B6:0.03,B12:0,Folate:2,Omega3:0,Omega6:0.1,Iodine:0,Choline:5,DHA:0},
  'Γραβιέρα':{Fe:0.3,Zn:3.5,Mg:30,Ca:850,B1:0.03,B2:0.4,B3:0.1,B6:0.08,B12:2.0,Folate:10,Omega3:0.3,Omega6:1.0,Iodine:20,Choline:18,DHA:0},
  'Κασέρι':{Fe:0.3,Zn:3.0,Mg:28,Ca:750,B1:0.03,B2:0.35,B3:0.1,B6:0.07,B12:1.8,Folate:8,Omega3:0.3,Omega6:1.0,Iodine:18,Choline:16,DHA:0},
  'Κεφαλοτύρι':{Fe:0.4,Zn:3.8,Mg:32,Ca:900,B1:0.03,B2:0.4,B3:0.1,B6:0.08,B12:2.0,Folate:10,Omega3:0.3,Omega6:1.2,Iodine:20,Choline:18,DHA:0},
  'Παρμεζάνα':{Fe:0.8,Zn:2.75,Mg:44,Ca:1180,B1:0.04,B2:0.37,B3:0.27,B6:0.09,B12:1.5,Folate:8,Omega3:0.2,Omega6:0.8,Iodine:15,Choline:20,DHA:0},
  'Quark (0%)':{Fe:0.1,Zn:0.4,Mg:8,Ca:90,B1:0.03,B2:0.2,B3:0.1,B6:0.04,B12:0.4,Folate:8,Omega3:0.01,Omega6:0.02,Iodine:15,Choline:15,DHA:0},
  'Ricotta':{Fe:0.2,Zn:0.6,Mg:9,Ca:200,B1:0.02,B2:0.2,B3:0.1,B6:0.03,B12:0.3,Folate:12,Omega3:0.1,Omega6:0.3,Iodine:12,Choline:20,DHA:0},
  'Edam light':{Fe:0.3,Zn:2.6,Mg:26,Ca:700,B1:0.03,B2:0.35,B3:0.1,B6:0.07,B12:1.9,Folate:20,Omega3:0.2,Omega6:0.8,Iodine:15,Choline:15,DHA:0},
  'Γαλατάκι σοκολάτα delact χωρίς ζάχαρη':{Fe:0.3,Zn:0.4,Mg:15,Ca:110,B1:0.04,B2:0.15,B3:0.2,B6:0.04,B12:0.4,Folate:5,Omega3:0.02,Omega6:0.1,Iodine:15,Choline:12,DHA:0},
  'Χαλλούμι (ψητό)':{Fe:0.4,Zn:2.5,Mg:25,Ca:600,B1:0.02,B2:0.3,B3:0.1,B6:0.06,B12:1.5,Folate:8,Omega3:0.2,Omega6:0.8,Iodine:15,Choline:15,DHA:0},
  'Χαλλούμι (ωμό)':{Fe:0.4,Zn:2.4,Mg:24,Ca:640,B1:0.02,B2:0.3,B3:0.1,B6:0.06,B12:1.5,Folate:8,Omega3:0.2,Omega6:0.8,Iodine:15,Choline:15,DHA:0},
  'Σαγανάκι (τηγανητό)':{Fe:0.4,Zn:2.8,Mg:25,Ca:650,B1:0.02,B2:0.3,B3:0.1,B6:0.06,B12:1.6,Folate:8,Omega3:0.3,Omega6:2.0,Iodine:15,Choline:16,DHA:0},
  'Γάλα καρύδας':{Fe:1.6,Zn:0.7,Mg:37,Ca:16,B1:0.03,B2:0.0,B3:0.8,B6:0.03,B12:0,Folate:16,Omega3:0,Omega6:0.1,Iodine:0,Choline:8,DHA:0},
  'Κρέμα γάλακτος':{Fe:0.05,Zn:0.2,Mg:6,Ca:65,B1:0.02,B2:0.15,B3:0.05,B6:0.02,B12:0.2,Folate:5,Omega3:0.2,Omega6:0.9,Iodine:8,Choline:15,DHA:0},
  'Τυρί Cheddar':{Fe:0.7,Zn:3.1,Mg:28,Ca:721,B1:0.03,B2:0.38,B3:0.08,B6:0.07,B12:0.83,Folate:18,Omega3:0.2,Omega6:0.9,Iodine:26,Choline:15,DHA:0},
  // Grains
  'Noodles αυγού (M&S)':{Fe:1.3,Zn:0.5,Mg:20,Ca:12,B1:0.15,B2:0.06,B3:1.5,B6:0.03,B12:0.1,Folate:30,Omega3:0.03,Omega6:0.3,Iodine:5,Choline:20,DHA:0},
  'Ψωμάκι Brioche':{Fe:1.8,Zn:0.6,Mg:15,Ca:60,B1:0.2,B2:0.15,B3:2.5,B6:0.05,B12:0.1,Folate:40,Omega3:0.05,Omega6:1.5,Iodine:8,Choline:20,DHA:0},
  'Ψωμάκι Μπιφτεκιού':{Fe:1.7,Zn:0.6,Mg:20,Ca:80,B1:0.25,B2:0.15,B3:2.8,B6:0.04,B12:0,Folate:50,Omega3:0.02,Omega6:0.6,Iodine:10,Choline:15,DHA:0},
  'Κυπριακή πίτα':{Fe:1.5,Zn:0.6,Mg:24,Ca:80,B1:0.3,B2:0.18,B3:2.7,B6:0.04,B12:0,Folate:42,Omega3:0.02,Omega6:0.5,Iodine:5,Choline:10,DHA:0},
  'Τορτίλια (large)':{Fe:1.9,Zn:0.5,Mg:20,Ca:120,B1:0.25,B2:0.15,B3:2.0,B6:0.05,B12:0,Folate:60,Omega3:0.02,Omega6:1.5,Iodine:5,Choline:12,DHA:0},
  'Τορτίλια ολικής άλεσης (Alphamega)':{Fe:2.3,Zn:0.7,Mg:35,Ca:100,B1:0.3,B2:0.18,B3:2.8,B6:0.08,B12:0,Folate:45,Omega3:0.05,Omega6:2.0,Iodine:5,Choline:14,DHA:0},
  'Ρυζογκοφρέτες':{Fe:0.6,Zn:0.8,Mg:25,Ca:5,B1:0.05,B2:0.02,B3:2.0,B6:0.1,B12:0,Folate:8,Omega3:0.02,Omega6:0.3,Iodine:0,Choline:5,DHA:0},
  'Μούσλι':{Fe:3.0,Zn:1.5,Mg:60,Ca:40,B1:0.3,B2:0.15,B3:3.0,B6:0.2,B12:0,Folate:30,Omega3:0.2,Omega6:2.5,Iodine:0,Choline:20,DHA:0},
  'Κρίθινο παξιμάδι':{Fe:2.5,Zn:1.2,Mg:50,Ca:30,B1:0.3,B2:0.1,B3:3.5,B6:0.15,B12:0,Folate:25,Omega3:0.1,Omega6:0.8,Iodine:0,Choline:12,DHA:0},
  'Κους κους (βρ.)':{Fe:0.4,Zn:0.4,Mg:8,Ca:6,B1:0.03,B2:0.02,B3:1.0,B6:0.03,B12:0,Folate:11,Omega3:0.01,Omega6:0.06,Iodine:0,Choline:5,DHA:0},
  'Σπαγγέτι ολικής (βρ.)':{Fe:1.3,Zn:1.0,Mg:44,Ca:15,B1:0.15,B2:0.05,B3:2.0,B6:0.1,B12:0,Folate:15,Omega3:0.05,Omega6:0.4,Iodine:0,Choline:10,DHA:0},
  'Τραχανάς (βρ.)':{Fe:0.8,Zn:0.6,Mg:20,Ca:30,B1:0.06,B2:0.1,B3:1.0,B6:0.05,B12:0.1,Folate:10,Omega3:0.02,Omega6:0.3,Iodine:5,Choline:12,DHA:0},
  'Φρυγανιές':{Fe:2.5,Zn:0.8,Mg:25,Ca:40,B1:0.2,B2:0.1,B3:3.0,B6:0.1,B12:0,Folate:30,Omega3:0.03,Omega6:0.8,Iodine:0,Choline:10,DHA:0},
  'Wasa Φρυγανιές Σίκαλης':{Fe:3.5,Zn:1.8,Mg:90,Ca:30,B1:0.25,B2:0.1,B3:2.5,B6:0.25,B12:0,Folate:30,Omega3:0.1,Omega6:0.5,Iodine:0,Choline:15,DHA:0},
  'Dark Rye Crispbread (Ryvita)':{Fe:3.0,Zn:1.6,Mg:85,Ca:28,B1:0.24,B2:0.1,B3:2.4,B6:0.24,B12:0,Folate:28,Omega3:0.1,Omega6:0.4,Iodine:0,Choline:14,DHA:0},
  'Κράκερ ολικής':{Fe:2.5,Zn:1.2,Mg:60,Ca:30,B1:0.2,B2:0.1,B3:2.5,B6:0.15,B12:0,Folate:25,Omega3:0.1,Omega6:2.0,Iodine:0,Choline:15,DHA:0},
  'Popcorn (αέρας)':{Fe:1.0,Zn:0.9,Mg:44,Ca:6,B1:0.14,B2:0.07,B3:1.8,B6:0.14,B12:0,Folate:9,Omega3:0.05,Omega6:1.8,Iodine:0,Choline:20,DHA:0},
  'Βρώμη (βρ.)':{Fe:1.2,Zn:0.9,Mg:35,Ca:13,B1:0.19,B2:0.03,B3:0.24,B6:0.03,B12:0,Folate:14,Omega3:0.1,Omega6:1.4,Iodine:1,Choline:10,DHA:0},
  'Ρύζι μαύρο (βρ.)':{Fe:0.6,Zn:1.0,Mg:40,Ca:15,B1:0.1,B2:0.05,B3:2.5,B6:0.3,B12:0,Folate:10,Omega3:0.07,Omega6:1.5,Iodine:0,Choline:8,DHA:0},
  // Legumes
  'Μαυρομάτικα':{Fe:2.3,Zn:1.3,Mg:44,Ca:24,B1:0.2,B2:0.06,B3:0.7,B6:0.07,B12:0,Folate:130,Omega3:0.04,Omega6:0.2,Iodine:0,Choline:25,DHA:0},
  'Φάβα':{Fe:1.9,Zn:1.4,Mg:32,Ca:22,B1:0.15,B2:0.06,B3:1.0,B6:0.06,B12:0,Folate:65,Omega3:0.03,Omega6:0.2,Iodine:0,Choline:20,DHA:0},
  'Γίγαντες (βρ.)':{Fe:2.5,Zn:1.0,Mg:40,Ca:40,B1:0.15,B2:0.06,B3:0.6,B6:0.1,B12:0,Folate:60,Omega3:0.05,Omega6:0.2,Iodine:0,Choline:22,DHA:0},
  'Κουκιά (βρ.)':{Fe:1.5,Zn:1.0,Mg:30,Ca:30,B1:0.15,B2:0.06,B3:1.0,B6:0.1,B12:0,Folate:100,Omega3:0.03,Omega6:0.2,Iodine:0,Choline:20,DHA:0},
  'Αρακάς (βρ.)':{Fe:1.47,Zn:1.19,Mg:33,Ca:27,B1:0.25,B2:0.13,B3:2.09,B6:0.17,B12:0,Folate:65,Omega3:0.04,Omega6:0.08,Iodine:0,Choline:28,DHA:0},
  'Φακές κόκκινες (βρ.)':{Fe:2.5,Zn:2.0,Mg:36,Ca:16,B1:0.15,B2:0.06,B3:1.0,B6:0.2,B12:0,Folate:90,Omega3:0.04,Omega6:0.2,Iodine:0,Choline:22,DHA:0},
  'Λούπινα (βρ.)':{Fe:1.5,Zn:1.7,Mg:40,Ca:60,B1:0.15,B2:0.05,B3:1.0,B6:0.1,B12:0,Folate:80,Omega3:0.05,Omega6:1.5,Iodine:0,Choline:20,DHA:0},
  'Κανελλίνι (βρ.)':{Fe:2.5,Zn:1.0,Mg:40,Ca:60,B1:0.15,B2:0.06,B3:0.5,B6:0.1,B12:0,Folate:70,Omega3:0.05,Omega6:0.2,Iodine:0,Choline:22,DHA:0},
  'Φασόλια μπορλότι (βρ.)':{Fe:2.2,Zn:1.0,Mg:40,Ca:50,B1:0.15,B2:0.06,B3:0.5,B6:0.1,B12:0,Folate:70,Omega3:0.05,Omega6:0.2,Iodine:0,Choline:22,DHA:0},
  'Tofu (φυσικό)':{Fe:1.6,Zn:0.8,Mg:30,Ca:150,B1:0.08,B2:0.05,B3:0.3,B6:0.05,B12:0,Folate:15,Omega3:0.2,Omega6:2.5,Iodine:0,Choline:10,DHA:0},
  'Edamame (βρ.)':{Fe:2.3,Zn:1.1,Mg:64,Ca:63,B1:0.16,B2:0.15,B3:1.0,B6:0.07,B12:0,Folate:311,Omega3:0.3,Omega6:2.5,Iodine:0,Choline:30,DHA:0},
  'Beyond Beef (φυτικός κιμάς)':{Fe:4.0,Zn:2.0,Mg:20,Ca:150,B1:0.1,B2:0.1,B3:1.5,B6:0.1,B12:0.5,Folate:15,Omega3:0.3,Omega6:3.0,Iodine:0,Choline:15,DHA:0},
  'Hummus':{Fe:1.6,Zn:1.4,Mg:30,Ca:40,B1:0.1,B2:0.05,B3:0.6,B6:0.14,B12:0,Folate:50,Omega3:0.05,Omega6:2.0,Iodine:0,Choline:15,DHA:0},
  // Vegetables
  'Καλαμπόκι (κονσέρβα)':{Fe:0.5,Zn:0.5,Mg:20,Ca:3,B1:0.02,B2:0.05,B3:1.0,B6:0.05,B12:0,Folate:20,Omega3:0.02,Omega6:0.5,Iodine:0,Choline:20,DHA:0},
  'Ρόκα':{Fe:1.5,Zn:0.5,Mg:47,Ca:160,B1:0.04,B2:0.09,B3:0.3,B6:0.07,B12:0,Folate:97,Omega3:0.1,Omega6:0.13,Iodine:0,Choline:15,DHA:0},
  'Καρότα':{Fe:0.3,Zn:0.24,Mg:12,Ca:33,B1:0.07,B2:0.06,B3:0.98,B6:0.14,B12:0,Folate:19,Omega3:0.001,Omega6:0.11,Iodine:0,Choline:8,DHA:0},
  'Κουνουπίδι':{Fe:0.4,Zn:0.3,Mg:15,Ca:22,B1:0.05,B2:0.06,B3:0.5,B6:0.18,B12:0,Folate:57,Omega3:0.02,Omega6:0.06,Iodine:0,Choline:44,DHA:0},
  'Σάλσα κόκκινη':{Fe:0.4,Zn:0.2,Mg:12,Ca:15,B1:0.04,B2:0.03,B3:0.7,B6:0.1,B12:0,Folate:12,Omega3:0.01,Omega6:0.05,Iodine:0,Choline:7,DHA:0},
  'Σαλάτα εποχής':{Fe:0.6,Zn:0.2,Mg:12,Ca:30,B1:0.05,B2:0.06,B3:0.4,B6:0.08,B12:0,Folate:30,Omega3:0.03,Omega6:0.05,Iodine:0,Choline:8,DHA:0},
  'Ελιές πράσινες':{Fe:3.3,Zn:0.2,Mg:12,Ca:52,B1:0.003,B2:0,B3:0.04,B6:0.01,B12:0,Folate:0,Omega3:0.03,Omega6:0.6,Iodine:0,Choline:0,DHA:0},
  'Ελιές μαύρες':{Fe:3.5,Zn:0.2,Mg:11,Ca:88,B1:0.003,B2:0,B3:0.04,B6:0.009,B12:0,Folate:3,Omega3:0.06,Omega6:1.2,Iodine:0,Choline:0,DHA:0},
  'Αγκινάρες (βρ.)':{Fe:1.3,Zn:0.4,Mg:60,Ca:44,B1:0.07,B2:0.07,B3:1.0,B6:0.08,B12:0,Folate:68,Omega3:0.02,Omega6:0.03,Iodine:0,Choline:44,DHA:0},
  'Ραπανάκι':{Fe:0.3,Zn:0.3,Mg:10,Ca:25,B1:0.01,B2:0.04,B3:0.3,B6:0.07,B12:0,Folate:25,Omega3:0.01,Omega6:0.05,Iodine:0,Choline:6,DHA:0},
  'Αγκινάρες καρδιές (κονσ.)':{Fe:1.0,Zn:0.4,Mg:40,Ca:25,B1:0.05,B2:0.05,B3:0.8,B6:0.06,B12:0,Folate:40,Omega3:0.02,Omega6:0.03,Iodine:0,Choline:30,DHA:0},
  'Κέϊλ (βρ.)':{Fe:1.5,Zn:0.4,Mg:20,Ca:135,B1:0.05,B2:0.1,B3:0.6,B6:0.14,B12:0,Folate:29,Omega3:0.1,Omega6:0.1,Iodine:0,Choline:15,DHA:0},
  'Χυμό ντομάτας':{Fe:0.4,Zn:0.15,Mg:11,Ca:10,B1:0.05,B2:0.03,B3:0.6,B6:0.1,B12:0,Folate:14,Omega3:0.003,Omega6:0.03,Iodine:0,Choline:7,DHA:0},
  'Κρεμμυδάκι (φρέσκο)':{Fe:1.5,Zn:0.4,Mg:20,Ca:70,B1:0.05,B2:0.08,B3:0.5,B6:0.06,B12:0,Folate:64,Omega3:0.01,Omega6:0.02,Iodine:0,Choline:10,DHA:0},
  'Μικτά λαχανικά':{Fe:0.7,Zn:0.4,Mg:18,Ca:30,B1:0.08,B2:0.08,B3:0.7,B6:0.12,B12:0,Folate:40,Omega3:0.04,Omega6:0.1,Iodine:0,Choline:15,DHA:0},
  'Λάχανο':{Fe:0.5,Zn:0.2,Mg:12,Ca:40,B1:0.06,B2:0.04,B3:0.2,B6:0.1,B12:0,Folate:43,Omega3:0.05,Omega6:0.02,Iodine:0,Choline:10,DHA:0},
  'Καλαμπόκι (ολόκληρο στον ατμό 200g)':{Fe:1.0,Zn:1.0,Mg:74,Ca:4,B1:0.4,B2:0.12,B3:3.4,B6:0.4,B12:0,Folate:88,Omega3:0.04,Omega6:1.0,Iodine:0,Choline:80,DHA:0},
  'Καλαμπόκι (ολόκληρο στον ατμό 400g - Halvatzis)':{Fe:2.0,Zn:2.0,Mg:148,Ca:8,B1:0.8,B2:0.24,B3:6.8,B6:0.8,B12:0,Folate:176,Omega3:0.08,Omega6:2.0,Iodine:0,Choline:160,DHA:0},
  'Πιπεριά κόκκινη':{Fe:0.4,Zn:0.25,Mg:10,Ca:8,B1:0.05,B2:0.08,B3:1.0,B6:0.3,B12:0,Folate:46,Omega3:0.02,Omega6:0.05,Iodine:0,Choline:5,DHA:0},
  'Πιπεριά κίτρινη':{Fe:0.4,Zn:0.15,Mg:10,Ca:11,B1:0.03,B2:0.03,B3:1.0,B6:0.25,B12:0,Folate:20,Omega3:0.02,Omega6:0.05,Iodine:0,Choline:5,DHA:0},
  'Βασιλικό':{Fe:3.2,Zn:0.8,Mg:64,Ca:177,B1:0.03,B2:0.08,B3:0.9,B6:0.16,B12:0,Folate:68,Omega3:0.32,Omega6:0.1,Iodine:0,Choline:11,DHA:0},
  // Fruits
  'Αχλάδι':{Fe:0.18,Zn:0.1,Mg:7,Ca:9,B1:0.02,B2:0.03,B3:0.16,B6:0.03,B12:0,Folate:7,Omega3:0.01,Omega6:0.04,Iodine:0,Choline:5,DHA:0},
  'Ανανάς':{Fe:0.29,Zn:0.12,Mg:12,Ca:13,B1:0.08,B2:0.03,B3:0.5,B6:0.11,B12:0,Folate:18,Omega3:0.01,Omega6:0.02,Iodine:0,Choline:5,DHA:0},
  'Βερίκοκα':{Fe:0.4,Zn:0.2,Mg:10,Ca:13,B1:0.03,B2:0.04,B3:0.6,B6:0.05,B12:0,Folate:9,Omega3:0.01,Omega6:0.05,Iodine:0,Choline:2,DHA:0},
  'Γκρέιπφρούτ':{Fe:0.08,Zn:0.08,Mg:9,Ca:22,B1:0.04,B2:0.02,B3:0.27,B6:0.04,B12:0,Folate:10,Omega3:0.02,Omega6:0.03,Iodine:0,Choline:7,DHA:0},
  'Δαμάσκηνα':{Fe:0.17,Zn:0.1,Mg:7,Ca:6,B1:0.03,B2:0.03,B3:0.4,B6:0.03,B12:0,Folate:5,Omega3:0.02,Omega6:0.05,Iodine:0,Choline:2,DHA:0},
  'Μανταρίνι':{Fe:0.15,Zn:0.07,Mg:12,Ca:37,B1:0.06,B2:0.02,B3:0.2,B6:0.08,B12:0,Folate:16,Omega3:0.01,Omega6:0.02,Iodine:0,Choline:10,DHA:0},
  'Νεκταρίνι':{Fe:0.3,Zn:0.17,Mg:9,Ca:6,B1:0.03,B2:0.03,B3:1.0,B6:0.03,B12:0,Folate:5,Omega3:0.001,Omega6:0.08,Iodine:0,Choline:6,DHA:0},
  'Πεπόνι':{Fe:0.2,Zn:0.2,Mg:12,Ca:9,B1:0.04,B2:0.02,B3:0.7,B6:0.07,B12:0,Folate:21,Omega3:0,Omega6:0.02,Iodine:0,Choline:7,DHA:0},
  'Σταφίδες':{Fe:1.9,Zn:0.2,Mg:32,Ca:50,B1:0.11,B2:0.08,B3:0.8,B6:0.17,B12:0,Folate:5,Omega3:0.01,Omega6:0.05,Iodine:0,Choline:11,DHA:0},
  'Σταφύλια':{Fe:0.36,Zn:0.07,Mg:7,Ca:10,B1:0.07,B2:0.07,B3:0.2,B6:0.09,B12:0,Folate:2,Omega3:0.01,Omega6:0.05,Iodine:0,Choline:6,DHA:0},
  'Σύκα φρέσκα':{Fe:0.37,Zn:0.15,Mg:17,Ca:35,B1:0.06,B2:0.05,B3:0.4,B6:0.11,B12:0,Folate:6,Omega3:0.02,Omega6:0.1,Iodine:0,Choline:5,DHA:0},
  'Σύκα ξερά':{Fe:2.0,Zn:0.55,Mg:68,Ca:162,B1:0.09,B2:0.09,B3:0.6,B6:0.11,B12:0,Folate:9,Omega3:0.05,Omega6:0.4,Iodine:0,Choline:15,DHA:0},
  'Ρόδι':{Fe:0.3,Zn:0.35,Mg:12,Ca:10,B1:0.07,B2:0.05,B3:0.3,B6:0.08,B12:0,Folate:38,Omega3:0.01,Omega6:0.06,Iodine:0,Choline:7,DHA:0},
  'Ακτινίδιο':{Fe:0.31,Zn:0.14,Mg:17,Ca:34,B1:0.03,B2:0.03,B3:0.34,B6:0.06,B12:0,Folate:25,Omega3:0.02,Omega6:0.1,Iodine:0,Choline:7,DHA:0},
  'Χουρμάδες (ξερές)':{Fe:1.0,Zn:0.44,Mg:54,Ca:64,B1:0.05,B2:0.06,B3:1.6,B6:0.25,B12:0,Folate:15,Omega3:0.02,Omega6:0.06,Iodine:0,Choline:6,DHA:0},
  'Βύσσινο':{Fe:0.32,Zn:0.1,Mg:11,Ca:16,B1:0.03,B2:0.04,B3:0.4,B6:0.05,B12:0,Folate:8,Omega3:0.03,Omega6:0.1,Iodine:0,Choline:6,DHA:0},
  'Μπανάνα αποξηραμένη':{Fe:1.0,Zn:0.6,Mg:108,Ca:22,B1:0.1,B2:0.25,B3:2.7,B6:1.0,B12:0,Folate:14,Omega3:0.05,Omega6:0.15,Iodine:0,Choline:20,DHA:0},
  'Βερίκοκα αποξηραμένα':{Fe:2.7,Zn:0.4,Mg:32,Ca:55,B1:0.02,B2:0.07,B3:2.6,B6:0.14,B12:0,Folate:10,Omega3:0.02,Omega6:0.1,Iodine:0,Choline:8,DHA:0},
  'Δαμάσκηνα αποξηραμένα':{Fe:0.9,Zn:0.44,Mg:41,Ca:43,B1:0.05,B2:0.19,B3:1.9,B6:0.2,B12:0,Folate:4,Omega3:0.03,Omega6:0.1,Iodine:0,Choline:11,DHA:0},
  'Ξηρά δαμάσκηνα':{Fe:0.9,Zn:0.44,Mg:41,Ca:43,B1:0.05,B2:0.19,B3:1.9,B6:0.2,B12:0,Folate:4,Omega3:0.03,Omega6:0.1,Iodine:0,Choline:11,DHA:0},
  'Cranberries αποξηραμένα':{Fe:0.5,Zn:0.1,Mg:6,Ca:8,B1:0.01,B2:0.02,B3:0.2,B6:0.02,B12:0,Folate:1,Omega3:0.02,Omega6:0.3,Iodine:0,Choline:3,DHA:0},
  'Μάνγκο αποξηραμένο':{Fe:0.5,Zn:0.15,Mg:15,Ca:15,B1:0.03,B2:0.04,B3:0.5,B6:0.1,B12:0,Folate:14,Omega3:0.02,Omega6:0.03,Iodine:0,Choline:8,DHA:0},
  'Ανανάς αποξηραμένος':{Fe:0.6,Zn:0.15,Mg:20,Ca:16,B1:0.08,B2:0.03,B3:0.5,B6:0.1,B12:0,Folate:8,Omega3:0.01,Omega6:0.02,Iodine:0,Choline:5,DHA:0},
  'Μήλο αποξηραμένο':{Fe:0.7,Zn:0.1,Mg:8,Ca:20,B1:0.01,B2:0.05,B3:0.4,B6:0.05,B12:0,Folate:1,Omega3:0.02,Omega6:0.06,Iodine:0,Choline:5,DHA:0},
  'Κουμουατ':{Fe:0.86,Zn:0.17,Mg:20,Ca:62,B1:0.04,B2:0.09,B3:0.4,B6:0.04,B12:0,Folate:17,Omega3:0.02,Omega6:0.05,Iodine:0,Choline:8,DHA:0},
  'Λεμόνι (χυμός)':{Fe:0.08,Zn:0.05,Mg:6,Ca:6,B1:0.02,B2:0.01,B3:0.1,B6:0.03,B12:0,Folate:9,Omega3:0.01,Omega6:0.01,Iodine:0,Choline:2,DHA:0},
  'Λεμόνι (ξύσμα)':{Fe:0.8,Zn:0.2,Mg:12,Ca:134,B1:0.09,B2:0.07,B3:0.4,B6:0.08,B12:0,Folate:8,Omega3:0.03,Omega6:0.06,Iodine:0,Choline:8,DHA:0},
  // Nuts / Seeds / Oils
  'Αμυγδαλοβούτυρο':{Fe:3.5,Zn:3.1,Mg:270,Ca:290,B1:0.15,B2:0.8,B3:3.6,B6:0.15,B12:0,Folate:35,Omega3:0.05,Omega6:14,Iodine:0,Choline:60,DHA:0},
  'Σκόνη κακάο':{Fe:13.9,Zn:6.8,Mg:499,Ca:128,B1:0.08,B2:0.2,B3:2.2,B6:0.12,B12:0,Folate:32,Omega3:0.1,Omega6:0.6,Iodine:0,Choline:12,DHA:0},
  'Ταχίνι':{Fe:9.0,Zn:4.6,Mg:95,Ca:420,B1:1.2,B2:0.47,B3:5.4,B6:0.15,B12:0,Folate:98,Omega3:0.4,Omega6:22,Iodine:0,Choline:60,DHA:0},
  'Κάσιους':{Fe:6.7,Zn:5.8,Mg:292,Ca:37,B1:0.42,B2:0.06,B3:1.06,B6:0.42,B12:0,Folate:25,Omega3:0.1,Omega6:7.8,Iodine:0,Choline:52,DHA:0},
  'Φιστίκια Αιγίνης':{Fe:3.9,Zn:2.2,Mg:121,Ca:105,B1:0.87,B2:0.16,B3:1.3,B6:1.7,B12:0,Folate:51,Omega3:0.25,Omega6:13.5,Iodine:0,Choline:70,DHA:0},
  'Φουντούκια':{Fe:4.7,Zn:2.5,Mg:163,Ca:114,B1:0.64,B2:0.11,B3:1.9,B6:0.56,B12:0,Folate:113,Omega3:0.09,Omega6:7.8,Iodine:0,Choline:56,DHA:0},
  'Κολοκυθόσποροι':{Fe:8.8,Zn:7.8,Mg:592,Ca:46,B1:0.27,B2:0.15,B3:4.99,B6:0.14,B12:0,Folate:58,Omega3:0.1,Omega6:20.7,Iodine:0,Choline:63,DHA:0},
  'Ηλιόσποροι':{Fe:5.25,Zn:5.0,Mg:325,Ca:78,B1:1.48,B2:0.36,B3:8.3,B6:1.34,B12:0,Folate:227,Omega3:0.03,Omega6:23.1,Iodine:0,Choline:55,DHA:0},
  'USN Trust Crunch Bar':{Fe:2.0,Zn:2.0,Mg:40,Ca:150,B1:0.2,B2:0.2,B3:3.0,B6:0.3,B12:1.0,Folate:20,Omega3:0.1,Omega6:2.0,Iodine:0,Choline:20,DHA:0},
  'Σουσάμι':{Fe:14.6,Zn:7.75,Mg:351,Ca:975,B1:0.79,B2:0.25,B3:4.5,B6:0.79,B12:0,Folate:97,Omega3:0.4,Omega6:21,Iodine:0,Choline:25,DHA:0},
  'Λιναρόσπορος':{Fe:5.7,Zn:4.3,Mg:392,Ca:255,B1:1.6,B2:0.16,B3:3.1,B6:0.47,B12:0,Folate:87,Omega3:22.8,Omega6:5.9,Iodine:0,Choline:78,DHA:0},
  'Βούτυρο':{Fe:0.02,Zn:0.09,Mg:2,Ca:24,B1:0.005,B2:0.03,B3:0.04,B6:0.003,B12:0.17,Folate:3,Omega3:0.3,Omega6:2.7,Iodine:5,Choline:19,DHA:0,VitD:0.6},
  'Μαργαρίνη light':{Fe:0,Zn:0,Mg:0,Ca:5,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:1.0,Omega6:15,Iodine:0,Choline:0,DHA:0},
  'Φιστίκια':{Fe:1.3,Zn:3.3,Mg:168,Ca:92,B1:0.64,B2:0.14,B3:12.1,B6:0.35,B12:0,Folate:240,Omega3:0.003,Omega6:15.6,Iodine:0,Choline:53,DHA:0},
  'Παστέλι':{Fe:8.0,Zn:4.0,Mg:180,Ca:550,B1:0.4,B2:0.15,B3:2.5,B6:0.4,B12:0,Folate:50,Omega3:0.2,Omega6:12,Iodine:0,Choline:15,DHA:0},
  'Χαλβάς σεσαμιού':{Fe:6.0,Zn:4.5,Mg:180,Ca:500,B1:0.5,B2:0.2,B3:3.0,B6:0.5,B12:0,Folate:55,Omega3:0.2,Omega6:12,Iodine:0,Choline:15,DHA:0},
  'Σπόροι κολοκύνθης':{Fe:8.8,Zn:7.8,Mg:592,Ca:46,B1:0.27,B2:0.15,B3:4.99,B6:0.14,B12:0,Folate:58,Omega3:0.1,Omega6:20.7,Iodine:0,Choline:63,DHA:0},
  'Σπόροι λιναρόσπορου':{Fe:5.7,Zn:4.3,Mg:392,Ca:255,B1:1.6,B2:0.16,B3:3.1,B6:0.47,B12:0,Folate:87,Omega3:22.8,Omega6:5.9,Iodine:0,Choline:78,DHA:0},
  // Herbs / Condiments / Sauces
  'Βασιλικός (φρέσκος)':{Fe:3.2,Zn:0.8,Mg:64,Ca:177,B1:0.03,B2:0.08,B3:0.9,B6:0.16,B12:0,Folate:68,Omega3:0.32,Omega6:0.1,Iodine:0,Choline:11,DHA:0},
  'Ρίγανη (ξηρή)':{Fe:36.8,Zn:2.7,Mg:160,Ca:1600,B1:0.18,B2:0.53,B3:4.6,B6:1.04,B12:0,Folate:274,Omega3:1.9,Omega6:1.0,Iodine:0,Choline:20,DHA:0},
  'Θυμάρι (φρέσκο)':{Fe:17.5,Zn:1.8,Mg:160,Ca:405,B1:0.05,B2:0.47,B3:1.8,B6:0.34,B12:0,Folate:45,Omega3:0.1,Omega6:0.4,Iodine:0,Choline:15,DHA:0},
  'Δυόσμος/Μέντα':{Fe:5.1,Zn:1.1,Mg:80,Ca:243,B1:0.08,B2:0.26,B3:1.7,B6:0.13,B12:0,Folate:114,Omega3:0.1,Omega6:0.2,Iodine:0,Choline:11,DHA:0},
  'Άνηθος (φρέσκος)':{Fe:6.6,Zn:0.9,Mg:55,Ca:208,B1:0.06,B2:0.3,B3:1.3,B6:0.25,B12:0,Folate:150,Omega3:0.1,Omega6:0.4,Iodine:0,Choline:24,DHA:0},
  'Μαϊντανός (φρέσκος)':{Fe:6.2,Zn:1.1,Mg:50,Ca:138,B1:0.09,B2:0.1,B3:1.3,B6:0.09,B12:0,Folate:152,Omega3:0.1,Omega6:0.2,Iodine:0,Choline:12,DHA:0},
  'Δεντρολίβανο (φρέσκο)':{Fe:6.7,Zn:0.9,Mg:91,Ca:317,B1:0.04,B2:0.15,B3:1.0,B6:0.34,B12:0,Folate:109,Omega3:0.1,Omega6:0.5,Iodine:0,Choline:11,DHA:0},
  'Κύμινο':{Fe:66.4,Zn:4.8,Mg:366,Ca:931,B1:0.6,B2:0.3,B3:4.6,B6:0.4,B12:0,Folate:10,Omega3:0.1,Omega6:3.3,Iodine:0,Choline:17,DHA:0},
  'Πάπρικα':{Fe:21.1,Zn:4.4,Mg:178,Ca:229,B1:0.6,B2:1.75,B3:10.6,B6:2.1,B12:0,Folate:106,Omega3:0.5,Omega6:8.0,Iodine:0,Choline:20,DHA:0},
  'Μουστάρδα':{Fe:1.6,Zn:0.6,Mg:59,Ca:58,B1:0.1,B2:0.1,B3:0.5,B6:0.06,B12:0,Folate:15,Omega3:0.2,Omega6:1.0,Iodine:0,Choline:12,DHA:0},
  'Βαλσάμικο ξίδι':{Fe:0.7,Zn:0.1,Mg:12,Ca:27,B1:0.01,B2:0.01,B3:0.1,B6:0.1,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0},
  'Σάλτσα γιαουρτιού-άνηθου':{Fe:0.2,Zn:0.4,Mg:10,Ca:80,B1:0.03,B2:0.15,B3:0.15,B6:0.05,B12:0.3,Folate:8,Omega3:0.05,Omega6:0.3,Iodine:10,Choline:10,DHA:0},
  'Πέστο βασιλικού':{Fe:1.2,Zn:1.0,Mg:30,Ca:150,B1:0.05,B2:0.15,B3:1.0,B6:0.1,B12:0.2,Folate:20,Omega3:0.4,Omega6:3.0,Iodine:5,Choline:15,DHA:0},
  'Σάλτσα ντομάτας (μαγειρεμένη)':{Fe:0.6,Zn:0.2,Mg:12,Ca:15,B1:0.04,B2:0.03,B3:0.8,B6:0.1,B12:0,Folate:12,Omega3:0.01,Omega6:0.05,Iodine:0,Choline:8,DHA:0},
  'Ταχινοσάλτσα λεμονιού':{Fe:4.5,Zn:2.3,Mg:48,Ca:210,B1:0.6,B2:0.24,B3:2.7,B6:0.08,B12:0,Folate:50,Omega3:0.2,Omega6:11,Iodine:0,Choline:30,DHA:0},
  'Σάλτσα λεμονιού-ελαιολάδου (λαδολέμονο)':{Fe:0.1,Zn:0.05,Mg:2,Ca:5,B1:0.005,B2:0.005,B3:0.02,B6:0.02,B12:0,Folate:3,Omega3:0.2,Omega6:2.6,Iodine:0,Choline:2,DHA:0},
  'Τζατζίκι':{Fe:0.15,Zn:0.5,Mg:12,Ca:90,B1:0.03,B2:0.15,B3:0.15,B6:0.05,B12:0.3,Folate:6,Omega3:0.1,Omega6:0.5,Iodine:12,Choline:12,DHA:0},
  'Σάλτσα σόγιας-μελιού':{Fe:0.8,Zn:0.3,Mg:15,Ca:10,B1:0.02,B2:0.05,B3:0.5,B6:0.05,B12:0,Folate:5,Omega3:0.01,Omega6:0.05,Iodine:0,Choline:5,DHA:0},
  'Μαγιονέζα light':{Fe:0.2,Zn:0.1,Mg:2,Ca:8,B1:0.01,B2:0.02,B3:0.05,B6:0.02,B12:0.1,Folate:3,Omega3:0.5,Omega6:8.0,Iodine:2,Choline:15,DHA:0},
  // Other
  'Μέλι άβραστο':{Fe:0.4,Zn:0.2,Mg:2,Ca:6,B1:0,B2:0.04,B3:0.1,B6:0.02,B12:0,Folate:2,Omega3:0,Omega6:0,Iodine:0,Choline:2,DHA:0},
  'Μαρμελάδα φράουλας':{Fe:0.3,Zn:0.05,Mg:4,Ca:12,B1:0,B2:0,B3:0.1,B6:0.01,B12:0,Folate:2,Omega3:0,Omega6:0,Iodine:0,Choline:1,DHA:0},
  'Σάλτσα σόγιας (μειωμένο αλάτι)':{Fe:2.4,Zn:0.3,Mg:40,Ca:20,B1:0.02,B2:0.15,B3:1.3,B6:0.17,B12:0,Folate:19,Omega3:0.02,Omega6:0.1,Iodine:0,Choline:10,DHA:0},
  'Dark Chocolate 70%':{Fe:11.9,Zn:3.3,Mg:228,Ca:73,B1:0.03,B2:0.08,B3:1.1,B6:0.04,B12:0.3,Folate:14,Omega3:0.05,Omega6:0.4,Iodine:0,Choline:15,DHA:0},
  'Κύβο λαχανικών':{Fe:2.0,Zn:0.5,Mg:20,Ca:100,B1:0.05,B2:0.1,B3:2.0,B6:0.1,B12:0,Folate:10,Omega3:0.05,Omega6:1.0,Iodine:5,Choline:10,DHA:0},
  'Μπούκοβο':{Fe:7.3,Zn:2.5,Mg:150,Ca:148,B1:0.33,B2:0.9,B3:8.7,B6:2.45,B12:0,Folate:106,Omega3:0.5,Omega6:8.0,Iodine:0,Choline:20,DHA:0},
  'Λευκό κρασί':{Fe:0.4,Zn:0.07,Mg:9,Ca:9,B1:0,B2:0.01,B3:0.1,B6:0.05,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:8,DHA:0},
  'Κοκος γάλα light':{Fe:0.8,Zn:0.4,Mg:20,Ca:8,B1:0.02,B2:0,B3:0.4,B6:0.02,B12:0,Folate:8,Omega3:0,Omega6:0.05,Iodine:0,Choline:4,DHA:0},
  'Πορτοκαλάδα φρέσκια':{Fe:0.2,Zn:0.07,Mg:11,Ca:11,B1:0.09,B2:0.02,B3:0.4,B6:0.06,B12:0,Folate:30,Omega3:0.01,Omega6:0.02,Iodine:0,Choline:8,DHA:0},
  'Σαρδέλες':{Fe:2.9,Zn:1.3,Mg:39,Ca:382,B1:0.03,B2:0.23,B3:5.2,B6:0.16,B12:8.9,Folate:11,Omega3:1.5,Omega6:0.2,Iodine:35,Choline:75,DHA:500,VitD:5},
  'Πατάτες':{Fe:0.3,Zn:0.3,Mg:20,Ca:8,B1:0.08,B2:0.02,B3:1.1,B6:0.2,B12:0,Folate:8,Omega3:0.002,Omega6:0.03,Iodine:0,Choline:12,DHA:0},
  'Σάλτσα κάρι light':{Fe:0.5,Zn:0.2,Mg:12,Ca:20,B1:0.03,B2:0.05,B3:0.5,B6:0.05,B12:0,Folate:5,Omega3:0.05,Omega6:0.5,Iodine:0,Choline:8,DHA:0}
};
var FOOD_ALIASES={
  /* ✅ Προστέθηκαν 2026-07-10 — τα υπόλοιπα υλικά (πέρα από Nutritional yeast/Soy yogurt, που πήραν δικές
     τους καταχωρήσεις στο FOODS) από τις 4 vegan "PickupLimes" συνταγές του FYH_RECIPE_EXPAND που δεν
     επιλύονταν καθόλου — expandRecipeInPlan() τα έσπρωχνε ασύρωτα (χωρίς έλεγχο) στο πλάνο πελάτη,
     υπολογίζοντας 0 θερμίδες γι' αυτά τα γεύματα */
  'Tofu (σταθερό)':'Tofu (φυσικό)',
  'Ψωμί (σκληρό)':'Ψωμί ολικής άλεσης',
  'Βρώμη (γρήγορης μαγειρέματος)':'Βρώμη (ωμή)',
  'Σόγια γάλα (χωρίς ζάχαρη)':'Γάλα σόγιας',
  'Φρέσκα μούρα (ποικιλία)':'Μούρα',
  'Κατεψυγμένα μούρα (ποικιλία)':'Μούρα',
  'Σπόρια λιναριού (αλεσμένα)':'Σπόροι λιναρόσπορου',
  'Μπανάνα (κατεψυγμένη)':'Μπανάνα',
  'Μπανάνα (φρέσκια)':'Μπανάνα',
  'Φράουλες (κατεψυγμένες)':'Φράουλες',
  'Φυστικοβούτυρο (φυσικό, χωρίς ζάχαρη)':'Φυστικοβούτυρο',
  'Vegan granola':'Γκρανόλα χωρίς ζάχαρη',
  'Ολικής άλεσης ψωμί':'Ψωμί ολικής άλεσης',
  'Τορτίλια ολικής άλεσης':'Τορτίλια ολικής άλεσης (Alphamega)',
  'Τορτίλια ολικής':'Τορτίλια ολικής άλεσης (Alphamega)',
  'Γιαούρτι Ελληνικό 2%':'Γιαούρτι 2%',
  'Φέτα':'Τυρί φέτα',
  'Ντομάτα':'Τομάτες',
  'Γαρίδες (βρασμένες)':'Γαρίδες (βραστές)',
  'Μέλι':'Μέλι άβραστο',
  'Λιγκουίνι (βρασμένο)':'Μακαρόνια (βρ.)',
  'Μύρτιλα':'Μούρα',
  /* ✅ Προστέθηκαν 2026-07-04 — διόρθωση 84 ονομάτων στο MEAL_RECIPES που δεν αντιστοιχούσαν σε καμία τροφή του FOODS (silent 0-kcal bug) */
  'Κοτόπουλο (στήθος)':'Κοτόπουλο στήθος (ψητό)',
  'Κοτόπουλο (ψητό)':'Κοτόπουλο στήθος (ψητό)',
  'Ρύζι (ψάχνη)':'Ρύζι άσπρο (βρ.)',
  'Λευκό ρύζι (βρ.)':'Ρύζι άσπρο (βρ.)',
  'Ρύζι (βρ.)':'Ρύζι άσπρο (βρ.)',
  'Brown rice (βρ.)':'Ρύζι καστανό (βρ.)',
  'Ντομάτες (σάλτσα)':'Σάλτσα ντομάτας (μαγειρεμένη)',
  'Σάλτσα ντομάτας':'Σάλτσα ντομάτας (μαγειρεμένη)',
  'Σαλάτα':'Σαλάτα εποχής',
  'Σαλάτα χορτ.':'Σαλάτα εποχής',
  'Σαλάτα χορτατοί':'Σαλάτα εποχής',
  'Σαλάτα μικτή':'Σαλάτα εποχής',
  'Σαλάτα ντοματ.':'Σαλάτα εποχής',
  'Μαρούλι/Σαλάτα':'Μαρούλι',
  'Καρότο':'Καρότα',
  'Καρότο (ψητό)':'Καρότα',
  'Πατάτα':'Πατάτες',
  'Πατάτες (ψητές)':'Πατάτες',
  'Πατάτες (βρ.)':'Πατάτες',
  'Ζυμαρικά ολικής':'Σπαγγέτι ολικής (βρ.)',
  'Ντομάτες (φρέσκες)':'Τομάτες',
  'Ντοματάκια Cherry':'Τομάτες',
  'Κολοκυθάκι':'Κολοκυθάκια',
  'Κολοκυθάκι (ψητό)':'Κολοκυθάκια',
  'Ζούχινι':'Κολοκυθάκια',
  'Σάλτσα σόγιας':'Σάλτσα σόγιας (μειωμένο αλάτι)',
  'Σάλτσα':'Σάλτσα σόγιας (μειωμένο αλάτι)',
  'Σάλτσα teriyaki':'Σάλτσα σόγιας-μελιού',
  'Σάλτσα Pesto':'Πέστο βασιλικού',
  'Σάλτσα λεμονιού':'Σάλτσα λεμονιού-ελαιολάδου (λαδολέμονο)',
  'Γαλοπούλα (φιλέ)':'Γαλοπούλα στήθος',
  'Κρέας γαλοπούλας (σαλάμι clean)':'Γαλοπούλα στήθος',
  'Χοιρινό (ψητό)':'Χοιρινό (μπριζόλα)',
  'Ψάρι λευκό':'Λαβράκι (ψητό)',
  'Φιλέτο ψάρι λευκό':'Λαβράκι (ψητό)',
  'Μέρλουσας (ψητή)':'Μπακαλιάρος (ψητός)',
  'Κοντά (ψητή)':'Τσιπούρα (ψητή)',
  'Ψωμί ολικής':'Ψωμί ολικής άλεσης',
  'Ρεβίθια (βρ.)':'Ρεβίθια',
  'Μανιτάρια (ψητά)':'Μανιτάρια',
  'Μπρόκολο (ψητό)':'Μπρόκολο',
  'Γαρίδες':'Γαρίδες (βραστές)',
  'Γλυκοπατάτα (βρ.)':'Γλυκοπατάτα',
  'Γλυκοπατάτα (ψητή)':'Γλυκοπατάτα',
  'Λαχανικά':'Μικτά λαχανικά',
  'Φακές (βρ.)':'Φακές',
  'Σπανάκι (ψητό)':'Σπανάκι',
  'Σπανάκι ωμό':'Σπανάκι',
  'Κιμάς χοιρ. (ψητός)':'Χοιρινός κιμάς (μαγ.)',
  'Κιμάς βοδινό lean':'Βοδινός κιμάς άπαχος (μαγ.)',
  'Κιμάς (ψητός)':'Μοσχάρι κιμάς (μαγ.)',
  'Μελιτζάνα (ψητή)':'Μελιτζάνες',
  'Μελιτζάνα':'Μελιτζάνες',
  'Μύδια':'Μύδια (βρ.)',
  'Μύδια (ψάχνη)':'Μύδια (βρ.)',
  'Καλάμι':'Καλαμαράκια (ψητά)',
  'Tofu σκληρό':'Tofu (φυσικό)',
  'Κόκκινη Πιπερια':'Πιπεριά κόκκινη',
  'Πιπεριά (ψητή)':'Πιπεριά κόκκινη',
  'Κολιάνδρο':'Κορίανδρος',
  'Οβελίσκοι (βρ.)':'Βρώμη (βρ.)',
  'Oβελίσκοι (βρ.)':'Βρώμη (βρ.)',
  'Oatmeal (βρ.)':'Βρώμη (βρ.)',
  'Oatmeal':'Βρώμη (βρ.)',
  'Αρνί (lean cut)':'Αρνί (ψητό)',
  'Αρνί κιμάς (ψητό)':'Αρνί (ψητό)',
  'Πιπέρι':'Μαύρο πιπέρι',
  'Τυρί mozzarella':'Μοτσαρέλα',
  'Αρακάς':'Αρακάς (βρ.)',
  'Αυγά':'Αυγά (ολόκληρα)',
  'Κουνουπίδι (ψητό)':'Κουνουπίδι',
  'Μαρμελάδα φράουλα':'Μαρμελάδα φράουλας',
  'Μάρμελάδα':'Μαρμελάδα φράουλας',
  'Granola (low sugar)':'Γκρανόλα χωρίς ζάχαρη',
  'Protein Powder vanilla':'Πρωτεΐνη σκόνη (whey)',
  'Protein powder vanilla':'Πρωτεΐνη σκόνη (whey)',
  'Black rice (βρ.)':'Ρύζι μαύρο (βρ.)',
  'Χαλούμι':'Χαλλούμι (ωμό)',
  /* ✅ Προστέθηκαν 2026-07-05 — διόρθωση silent 0-kcal bug σε SNACK_RECIPES/templates (βλ. code review) */
  'Cottage Cheese':'Cottage cheese',
  'Granola low sugar':'Γκρανόλα χωρίς ζάχαρη',
  'Almond butter':'Αμυγδαλοβούτυρο',
  'Αυγό (βραστό)':'Αυγά (ολόκληρα)',
  'Αυγό βρασμένο':'Αυγά (ολόκληρα)',
  /* ✅ Προστέθηκαν 2026-07-09 — αυτοματοποιημένος έλεγχος κάθε TMPLS/MEAL_RECIPES/SNACK_RECIPES έναντι FOODS
     βρήκε ~60 ονόματα χωρίς αντιστοιχία (silent 0-kcal bug, χειρότερο στο orthodox_fasting/intermittent_fasting/
     keto/kids_10_14 — βλ. session findings). Νέες τροφές προστέθηκαν στο FOODS (βλ. πάνω)· εδώ μόνο ονόματα
     που αντιστοιχούν σε ήδη υπάρχουσα τροφή. */
  'Tofu':'Tofu (φυσικό)',
  'Tofu grilled':'Tofu (φυσικό)',
  'Tofu scramble':'Tofu (φυσικό)',
  'Tofu stir-fry':'Tofu (φυσικό)',
  'Hummus (chickpea)':'Hummus',
  'Ρεβίθια hummus':'Hummus',
  'Φυτικό γάλα καρύδας':'Γάλα καρύδας',
  'Φυτικό γάλα σόγια':'Γάλα σόγιας',
  'Φυτικό γάλα (σόγια)':'Γάλα σόγιας',
  'Φυτικό γάλα αμύγδαλο':'Γάλα αμυγδάλου',
  'Σπόροι len':'Σπόροι λιναρόσπορου',
  'Σπόροι ηλίανθος':'Ηλιόσποροι',
  'Σπόροι ηλιόσπορου':'Ηλιόσποροι',
  'Σπόροι chia':'Chia seeds',
  'Σπόροι χαμπία':'Chia seeds',
  'Φυστικοβούτυρο (vegan)':'Φυστικοβούτυρο',
  'Φυστικοβούτυρο (φυσικό)':'Φυστικοβούτυρο',
  'φυστικοβούτυρο':'Φυστικοβούτυρο',
  'Ξηρά σύκα':'Σύκα ξερά',
  'Ρύζι αrborio (βρ.)':'Ρύζι άσπρο (βρ.)', // τυπογραφικό (λατινικό "r" μέσα σε ελληνική λέξη) — arborio ρύζι ≈ ίδιες μακροθρεπτικές τιμές με άσπρο ρύζι
  'Cheese':'Κασέρι',
  'Κράτι':'Κασέρι', // πιθανό τυπογραφικό
  'Τυρί':'Κασέρι',
  'Avocado':'Αβοκάντο',
  'Περισσευόμενα φουντούκια':'Φουντούκια',
  'Τομάτες (ψημένες)':'Τομάτες',
  'Τομάτες (φρέσκιες)':'Τομάτες',
  'Τομάτα':'Τομάτες',
  'Σαλάτα ντομάτας':'Τομάτες',
  'Γιαούρτι ελληνικό (2%)':'Γιαούρτι 2%',
  'Γιαούρτι ελληνικό 2%':'Γιαούρτι 2%',
  'Δημητριακά ολικής άλεσης':'Μούσλι',
  'Κοτόπουλο ψητό':'Κοτόπουλο στήθος (ψητό)',
  'Κοτόπουλο κομματιασμένο':'Κοτόπουλο στήθος (ψητό)',
  'Τυρί ασυνάγων λίπους':'Cottage cheese', // "ασυνάγων" — πιθανή αλλοίωση του "χαμηλών λιπαρών"
  'Μπάρα granola (χαμηλή ζάχαρη)':'Γκρανόλα χωρίς ζάχαρη',
  'Γράνολα χαμηλής ζάχαρης':'Γκρανόλα χωρίς ζάχαρη',
  'Φακές (μαγειρεμένες)':'Φακές',
  'Σαλάτα με λάδι':'Σαλάτα εποχής',
  'Τόνος (κονσέρβα σε νερό)':'Τόνος (κονσέρβα)',
  'Ψάρι λευκό ψητό':'Λαβράκι (ψητό)', // resolveFood() κάνει μόνο ένα "hop" — 'Ψάρι λευκό' είναι το ίδιο alias, όχι FOODS key, οπότε δείχνει κατευθείαν στο πραγματικό key
  'Πατάτες (βρασμένες)':'Πατάτες',
  'Σπανάκι σαλάτα':'Σπανάκι',
  'Κουλουράκια (ολικής άλεσης)':'Κράκερ ολικής',
  'Κουλουράκια ολικής άλεσης':'Κράκερ ολικής',
  'Μπερδέ φρούτα':'Μούρα', // πιθανή αλλοίωση του "μπερδεμένα φρούτα" (mixed fruit)
  'Σαλάτα λάχανο':'Λάχανο',
  'Πίτα ολικής άλεσης':'Πίτα αραβική',
  'Αυγό μαγιονέζα (ελαφριά)':'Αυγά (ολόκληρα)', // ίδιος λόγος — 'Αυγό (βραστό)' είναι alias, όχι FOODS key
  'Γαλοπούλα ψητή':'Γαλοπούλα στήθος',
  'Μπάρα σοκολάτας ολικής':'Dark Choc Oat Bites',
  'Dark Choc Oat Bites (vegan)':'Dark Choc Oat Bites',
  'Κολοκυθάκια (ψητά)':'Κολοκυθάκια'
};
var DEFAULT_TMPLS={
loss:[
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Βρώμη (ωμή)',g:40},{n:'Μούρα',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:120},{n:'Αμύγδαλα',g:10}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:180},{n:'Ρύζι άσπρο (βρ.)',g:100},{n:'Μπρόκολο',g:150},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:100},{n:'Ρυζογκοφρέτες',g:20}]},{name:'Βραδινό',foods:[{n:'Τόνος (κονσέρβα)',g:120},{n:'Τομάτες',g:100},{n:'Αγγούρι',g:100},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:40},{n:'Αβοκάντο',g:40},{n:'Μήλο',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Φράουλες',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:160},{n:'Κινόα (βρ.)',g:120},{n:'Σπαράγγια',g:120},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:100},{n:'Αμύγδαλα',g:10}]},{name:'Βραδινό',foods:[{n:'Γαλοπούλα στήθος',g:160},{n:'Κολοκυθάκια',g:150},{n:'Σπανάκι',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:50},{n:'Γάλα πλήρες',g:200},{n:'Μπανάνα',g:80},{n:'Chia seeds',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:55},{n:'Πορτοκάλι',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:220},{n:'Μπρόκολο',g:120},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:25},{n:'Φυστικοβούτυρο',g:20}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:150},{n:'Γλυκοπατάτα',g:130},{n:'Σπανάκι',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:40},{n:'Αβοκάντο',g:40},{n:'Πορτοκάλι',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Μήλο',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Λαβράκι (ψητό)',g:170},{n:'Ρύζι καστανό (βρ.)',g:120},{n:'Φασολάκια',g:130},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:100},{n:'Μούρα',g:80}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:160},{n:'Πλιγούρι (βρ.)',g:120},{n:'Μελιτζάνες',g:130},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Βρώμη (ωμή)',g:40},{n:'Φράουλες',g:100},{n:'Καρύδια',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:150},{n:'Αμύγδαλα',g:10}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:220},{n:'Μανιτάρια',g:100},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Φράουλες',g:100}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:140},{n:'Σπανάκι',g:100},{n:'Τομάτες',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:40},{n:'Φυστικοβούτυρο',g:20},{n:'Μπανάνα',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:55},{n:'Πορτοκάλι',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:170},{n:'Ρύζι άσπρο (βρ.)',g:100},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Μπανάνα',g:80}]},{name:'Βραδινό',foods:[{n:'Τόνος (κονσέρβα)',g:120},{n:'Τομάτες',g:100},{n:'Τυρί φέτα',g:20},{n:'Ελιές',g:15},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:50},{n:'Γιαούρτι 2%',g:200},{n:'Κεράσια',g:100},{n:'Καρύδια',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:120},{n:'Cottage cheese',g:80}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:160},{n:'Κινόα (βρ.)',g:120},{n:'Σπανάκι',g:100},{n:'Ελαιόλαδο',g:8},{n:'Ελιές',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:20},{n:'Αβοκάντο',g:40},{n:'Τομάτες',g:80}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:150},{n:'Γλυκοπατάτα',g:150},{n:'Μπρόκολο',g:100},{n:'Ελαιόλαδο',g:8}]}]
],
mild:[
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:40},{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:65}]},{name:'Μεσημεριανό',foods:[{n:'Korean Beef Bowl',g:320},{n:'Τομάτες',g:100},{n:'Αγγούρι',g:80},{n:'Ελαιόλαδο',g:5}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Μήλο',g:120}]},{name:'Βραδινό',foods:[{n:'Ψάρι στο Φούρνο (FYH)',g:200},{n:'Σπανάκι',g:100},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:50},{n:'Αβοκάντο',g:40},{n:'Μπανάνα',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:60},{n:'Πορτοκάλι',g:180}]},{name:'Μεσημεριανό',foods:[{n:'Μπουλγκούρ-Κινόα Κοτόπουλο',g:380},{n:'Τομάτες',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:100},{n:'Αγγούρι',g:100}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:130},{n:'Γλυκοπατάτα',g:160},{n:'Κολοκυθάκια',g:100},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:40},{n:'Γιαούρτι 2%',g:200},{n:'Φράουλες',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:65},{n:'Μήλο',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:210},{n:'Τομάτες',g:100},{n:'Τυρί φέτα',g:15},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Μπανάνα',g:80}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:130},{n:'Κολοκυθάκια',g:150},{n:'Σπανάκι',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:50},{n:'Αβοκάντο',g:40},{n:'Πορτοκάλι',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:60},{n:'Μούρα',g:80}]},{name:'Μεσημεριανό',foods:[{n:'Korean Beef Bowl',g:320},{n:'Σπανάκι',g:80},{n:'Ελαιόλαδο',g:5}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Μούρα',g:80}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:150},{n:'Κινόα (βρ.)',g:120},{n:'Σπαράγγια',g:100},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:40},{n:'Γιαούρτι 2%',g:200},{n:'Ροδάκινο',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:65}]},{name:'Μεσημεριανό',foods:[{n:'Μπουλγκούρ-Κινόα Κοτόπουλο',g:380},{n:'Τομάτες',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Μούρα',g:80}]},{name:'Βραδινό',foods:[{n:'Γαλοπούλα στήθος',g:150},{n:'Ρύζι καστανό (βρ.)',g:140},{n:'Κολοκυθάκια',g:120},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:50},{n:'Φυστικοβούτυρο',g:20},{n:'Φράουλες',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:60},{n:'Πορτοκάλι',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:140},{n:'Ρύζι καστανό (βρ.)',g:140},{n:'Μπρόκολο',g:150},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Μπανάνα',g:100}]},{name:'Βραδινό',foods:[{n:'Πίτα αραβική',g:80},{n:'Κοτόπουλο στήθος (ψητό)',g:130},{n:'Τομάτες',g:80},{n:'Αγγούρι',g:80},{n:'Τυρί φέτα',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:40},{n:'Γιαούρτι 2%',g:200},{n:'Κεράσια',g:120},{n:'Καρύδια',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:65},{n:'Μήλο',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:210},{n:'Τομάτες',g:80},{n:'Αγγούρι',g:80},{n:'Τυρί φέτα',g:15},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:20},{n:'Αβοκάντο',g:40},{n:'Τομάτες',g:80}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:150},{n:'Σπανάκι',g:100},{n:'Ελαιόλαδο',g:8}]}]
],
maintain:[
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:45},{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:100},{n:'Αμύγδαλα',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:65},{n:'Μήλο',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Korean Beef Bowl',g:350},{n:'Τομάτες',g:100},{n:'Αγγούρι',g:80},{n:'Ελαιόλαδο',g:5}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:170},{n:'Μπανάνα',g:80}]},{name:'Βραδινό',foods:[{n:'Ψάρι στο Φούρνο (FYH)',g:220},{n:'Σπανάκι',g:100},{n:'Ελαιόλαδο',g:8},{n:'Ελιές',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:70},{n:'Αβοκάντο',g:50},{n:'Μπανάνα',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:60},{n:'Πορτοκάλι',g:180}]},{name:'Μεσημεριανό',foods:[{n:'Μπουλγκούρ-Κινόα Κοτόπουλο',g:400},{n:'Τομάτες',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Μούρα',g:80}]},{name:'Βραδινό',foods:[{n:'Μακαρόνια (βρ.)',g:180},{n:'Κοτόπουλο στήθος (ψητό)',g:130},{n:'Τομάτες',g:100},{n:'Τυρί φέτα',g:15},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:45},{n:'Γιαούρτι 2%',g:200},{n:'Φράουλες',g:100},{n:'Chia seeds',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:65},{n:'Μήλο',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Korean Beef Bowl',g:350},{n:'Σπανάκι',g:80},{n:'Ελαιόλαδο',g:5}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:170},{n:'Μπανάνα',g:80}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:160},{n:'Κινόα (βρ.)',g:140},{n:'Σπαράγγια',g:120},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:70},{n:'Αβοκάντο',g:50},{n:'Μούρα',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:60},{n:'Μούρα',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Μπουλγκούρ-Κινόα Κοτόπουλο',g:400},{n:'Τομάτες',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:170},{n:'Μπανάνα',g:100}]},{name:'Βραδινό',foods:[{n:'Πίτα αραβική',g:80},{n:'Κοτόπουλο στήθος (ψητό)',g:150},{n:'Τομάτες',g:100},{n:'Αγγούρι',g:80},{n:'Τυρί φέτα',g:20}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:45},{n:'Γιαούρτι 2%',g:200},{n:'Ροδάκινο',g:150},{n:'Αμύγδαλα',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:65},{n:'Πορτοκάλι',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Korean Beef Bowl',g:350},{n:'Τομάτες',g:100},{n:'Αγγούρι',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Μήλο',g:150}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:150},{n:'Ρύζι καστανό (βρ.)',g:160},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:70},{n:'Αβοκάντο',g:50},{n:'Μπανάνα',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:60},{n:'Μπανάνα',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:150},{n:'Ρύζι καστανό (βρ.)',g:160},{n:'Μπρόκολο',g:150},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:170},{n:'Φράουλες',g:100}]},{name:'Βραδινό',foods:[{n:'Πίτα αραβική',g:80},{n:'Κοτόπουλο στήθος (ψητό)',g:130},{n:'Πιπεριές',g:80},{n:'Αγγούρι',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:45},{n:'Γιαούρτι 2%',g:200},{n:'Κεράσια',g:120},{n:'Καρύδια',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:65},{n:'Μήλο',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Μπουλγκούρ-Κινόα Κοτόπουλο',g:400},{n:'Τομάτες',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:25},{n:'Αβοκάντο',g:50},{n:'Τομάτες',g:80}]},{name:'Βραδινό',foods:[{n:'Μακαρόνια (βρ.)',g:180},{n:'Κοτόπουλο στήθος (ψητό)',g:130},{n:'Τομάτες',g:100},{n:'Ελαιόλαδο',g:8}]}]
],
gain:[
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:50},{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:130},{n:'Αμύγδαλα',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:70},{n:'Μπανάνα',g:100},{n:'Καρύδια',g:10}]},{name:'Μεσημεριανό',foods:[{n:'Μακαρόνια (βρ.)',g:200},{n:'Κοτόπουλο στήθος (ψητό)',g:180},{n:'Τομάτες',g:150},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:100}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:180},{n:'Ρύζι καστανό (βρ.)',g:200},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί σίκαλης',g:80},{n:'Αβοκάντο',g:60},{n:'Μπανάνα',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:70},{n:'Μπανάνα',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Korean Beef Bowl',g:350},{n:'Ρύζι άσπρο (βρ.)',g:100},{n:'Σπανάκι',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:30},{n:'Cottage cheese',g:150},{n:'Μούρα',g:80}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:180},{n:'Γλυκοπατάτα',g:220},{n:'Μπρόκολο',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:50},{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:130},{n:'Chia seeds',g:10},{n:'Καρύδια',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:70},{n:'Πορτοκάλι',g:200}]},{name:'Μεσημεριανό',foods:[{n:'Μπουλγκούρ-Κινόα Κοτόπουλο',g:450},{n:'Τομάτες',g:100},{n:'Ελαιόλαδο',g:5}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:120}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:180},{n:'Κριθαράκι (βρ.)',g:180},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί σίκαλης',g:80},{n:'Αβοκάντο',g:50},{n:'Πορτοκάλι',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μούρα',g:120},{n:'Αμύγδαλα',g:15}]},{name:'Μεσημεριανό',foods:[{n:'Korean Beef Bowl',g:350},{n:'Ρύζι άσπρο (βρ.)',g:100},{n:'Τομάτες',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μούρα',g:120},{n:'Αμύγδαλα',g:15}]},{name:'Βραδινό',foods:[{n:'Πίτα αραβική',g:100},{n:'Κοτόπουλο στήθος (ψητό)',g:180},{n:'Τομάτες',g:100},{n:'Αγγούρι',g:80},{n:'Τυρί φέτα',g:20}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:50},{n:'Γάλα πλήρες',g:250},{n:'Μπανάνα',g:130},{n:'Chia seeds',g:10},{n:'Αμύγδαλα',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:70},{n:'Μήλο',g:150},{n:'Αμύγδαλα',g:15}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:200},{n:'Ρύζι καστανό (βρ.)',g:200},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:130},{n:'Καρύδια',g:15}]},{name:'Βραδινό',foods:[{n:'Μακαρόνια (βρ.)',g:200},{n:'Κοτόπουλο στήθος (ψητό)',g:150},{n:'Τομάτες',g:150},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί σίκαλης',g:80},{n:'Φυστικοβούτυρο',g:25},{n:'Φράουλες',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:130},{n:'Καρύδια',g:15}]},{name:'Μεσημεριανό',foods:[{n:'Μπουλγκούρ-Κινόα Κοτόπουλο',g:450},{n:'Τομάτες',g:100},{n:'Ελαιόλαδο',g:5}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:30},{n:'Αβοκάντο',g:40}]},{name:'Βραδινό',foods:[{n:'Πίτα αραβική',g:100},{n:'Κοτόπουλο στήθος (ψητό)',g:180},{n:'Πιπεριές',g:100},{n:'Αγγούρι',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:50},{n:'Γιαούρτι 2%',g:200},{n:'Φράουλες',g:130},{n:'Αμύγδαλα',g:20}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:130},{n:'Αμύγδαλα',g:20},{n:'Cottage cheese',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Μακαρόνια (βρ.)',g:200},{n:'Κοτόπουλο στήθος (ψητό)',g:180},{n:'Τομάτες',g:150},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μήλο',g:150}]},{name:'Βραδινό',foods:[{n:'Γαρίδες (βραστές)',g:200},{n:'Ρύζι άσπρο (βρ.)',g:200},{n:'Σπανάκι',g:100},{n:'Ελιές',g:20},{n:'Ελαιόλαδο',g:10}]}]
],
/* ── Calorie-level reference templates for adults (Mediterranean diet) ── */
kcal2000:[
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Βρώμη (ωμή)',g:70},{n:'Μπανάνα',g:120},{n:'Μέλι άβραστο',g:15},{n:'Αμύγδαλα',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:150},{n:'Cottage cheese',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:220},{n:'Ψωμί σίκαλης',g:60},{n:'Σαλάτα εποχής',g:150},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Φράουλες',g:100}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:160},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:60},{n:'Αβοκάντο',g:50},{n:'Πορτοκάλι',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Πρωτεΐνη σκόνη (whey)',g:25},{n:'Γάλα αμυγδάλου',g:200},{n:'Μπανάνα',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο μπούτι (ψητό)',g:150},{n:'Ρύζι άσπρο (βρ.)',g:150},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Μούρα',g:80}]},{name:'Βραδινό',foods:[{n:'Γαλοπούλα στήθος',g:180},{n:'Γλυκοπατάτα',g:200},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:40},{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:100},{n:'Μέλι άβραστο',g:15},{n:'Chia seeds',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'USN Trust Crunch Bar',g:50},{n:'Μήλο',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:170},{n:'Μακαρόνια (βρ.)',g:150},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:100},{n:'Φράουλες',g:100}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:130},{n:'Πλιγούρι (βρ.)',g:150},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:70},{n:'Αβοκάντο',g:50},{n:'Μήλο',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:200},{n:'Αμύγδαλα',g:20}]},{name:'Μεσημεριανό',foods:[{n:'Τόνος (κονσέρβα)',g:120},{n:'Ρύζι καστανό (βρ.)',g:150},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μέλι άβραστο',g:10},{n:'Μούρα',g:80}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο σουβλάκι',g:150},{n:'Κυπριακή πίτα',g:80},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:70},{n:'Γάλα αμυγδάλου',g:250},{n:'Μπανάνα',g:120},{n:'Μέλι άβραστο',g:15},{n:'Αμύγδαλα',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:55}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:160},{n:'Γλυκοπατάτα',g:200},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Φράουλες',g:100}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:140},{n:'Κινόα (βρ.)',g:140},{n:'Σαλάτα εποχής',g:150},{n:'Ελιές',g:15},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί ολικής άλεσης',g:70},{n:'Φυστικοβούτυρο',g:20},{n:'Φράουλες',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:120},{n:'Καρύδια',g:10}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο μπιφτέκι',g:150},{n:'Ρύζι άσπρο (βρ.)',g:170},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Πρωτεΐνη σκόνη (whey)',g:25},{n:'Γάλα αμυγδάλου',g:200}]},{name:'Βραδινό',foods:[{n:'Ελεύθερο γεύμα',g:300}]}],
[{name:'Πρωινό',foods:[{n:'Pancakes Κυριακής (FYH)',g:135},{n:'Μέλι άβραστο',g:15},{n:'Μούρα',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:55}]},{name:'Μεσημεριανό',foods:[{n:'Φασόλια',g:240},{n:'Κυπριακή πίτα',g:80},{n:'Σαλάτα εποχής',g:150},{n:'Τυρί φέτα',g:25},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Φράουλες',g:100}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:170},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]}]
],
kcal2300:[
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Βρώμη (ωμή)',g:85},{n:'Μπανάνα',g:140},{n:'Μέλι άβραστο',g:15},{n:'Αμύγδαλα',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:160},{n:'Cottage cheese',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:260},{n:'Ψωμί σίκαλης',g:70},{n:'Σαλάτα εποχής',g:150},{n:'Τυρί φέτα',g:25},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Φράουλες',g:120}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:190},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:70},{n:'Αβοκάντο',g:60},{n:'Πορτοκάλι',g:200}]},{name:'Ενδιάμεσο',foods:[{n:'Πρωτεΐνη σκόνη (whey)',g:30},{n:'Γάλα αμυγδάλου',g:200},{n:'Μπανάνα',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο μπούτι (ψητό)',g:170},{n:'Ρύζι άσπρο (βρ.)',g:170},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:140},{n:'Μούρα',g:80}]},{name:'Βραδινό',foods:[{n:'Γαλοπούλα στήθος',g:200},{n:'Γλυκοπατάτα',g:230},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:50},{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:120},{n:'Μέλι άβραστο',g:15},{n:'Chia seeds',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'USN Trust Crunch Bar',g:55},{n:'Μήλο',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:200},{n:'Μακαρόνια (βρ.)',g:170},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Φράουλες',g:120}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:150},{n:'Πλιγούρι (βρ.)',g:180},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:80},{n:'Αβοκάντο',g:60},{n:'Μήλο',g:180}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:200},{n:'Αμύγδαλα',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Τόνος (κονσέρβα)',g:140},{n:'Ρύζι καστανό (βρ.)',g:170},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μέλι άβραστο',g:15},{n:'Μούρα',g:100}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο σουβλάκι',g:180},{n:'Κυπριακή πίτα',g:90},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:85},{n:'Γάλα αμυγδάλου',g:250},{n:'Μπανάνα',g:140},{n:'Μέλι άβραστο',g:15},{n:'Αμύγδαλα',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:65}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:180},{n:'Γλυκοπατάτα',g:230},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:140},{n:'Φράουλες',g:120}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:160},{n:'Κινόα (βρ.)',g:160},{n:'Σαλάτα εποχής',g:150},{n:'Ελιές',g:20},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί ολικής άλεσης',g:80},{n:'Φυστικοβούτυρο',g:25},{n:'Φράουλες',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:140},{n:'Καρύδια',g:15}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο μπιφτέκι',g:170},{n:'Ρύζι άσπρο (βρ.)',g:190},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Πρωτεΐνη σκόνη (whey)',g:30},{n:'Γάλα αμυγδάλου',g:200}]},{name:'Βραδινό',foods:[{n:'Ελεύθερο γεύμα',g:300}]}],
[{name:'Πρωινό',foods:[{n:'Pancakes Κυριακής (FYH)',g:135},{n:'Μέλι άβραστο',g:15},{n:'Μούρα',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:65}]},{name:'Μεσημεριανό',foods:[{n:'Φασόλια',g:270},{n:'Κυπριακή πίτα',g:90},{n:'Σαλάτα εποχής',g:150},{n:'Τυρί φέτα',g:30},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:140},{n:'Φράουλες',g:100}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:190},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]}]
],
kcal2500:[
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Βρώμη (ωμή)',g:90},{n:'Μπανάνα',g:150},{n:'Μέλι άβραστο',g:20},{n:'Αμύγδαλα',g:20}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:180},{n:'Cottage cheese',g:130}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:290},{n:'Ψωμί σίκαλης',g:70},{n:'Σαλάτα εποχής',g:150},{n:'Τυρί φέτα',g:25},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Φράουλες',g:120}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:200},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί σίκαλης',g:70},{n:'Αβοκάντο',g:60},{n:'Πορτοκάλι',g:200}]},{name:'Ενδιάμεσο',foods:[{n:'Πρωτεΐνη σκόνη (whey)',g:30},{n:'Γάλα αμυγδάλου',g:250},{n:'Μπανάνα',g:130}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο μπούτι (ψητό)',g:180},{n:'Ρύζι άσπρο (βρ.)',g:180},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:150},{n:'Μούρα',g:100}]},{name:'Βραδινό',foods:[{n:'Γαλοπούλα στήθος',g:220},{n:'Γλυκοπατάτα',g:250},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:55},{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:130},{n:'Μέλι άβραστο',g:20},{n:'Chia seeds',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'USN Trust Crunch Bar',g:60},{n:'Μήλο',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:210},{n:'Μακαρόνια (βρ.)',g:190},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:130},{n:'Φράουλες',g:120}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:160},{n:'Πλιγούρι (βρ.)',g:200},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί σίκαλης',g:80},{n:'Αβοκάντο',g:60},{n:'Μήλο',g:180}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:200},{n:'Αμύγδαλα',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Τόνος (κονσέρβα)',g:150},{n:'Ρύζι καστανό (βρ.)',g:190},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μέλι άβραστο',g:15},{n:'Μούρα',g:100}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο σουβλάκι',g:200},{n:'Κυπριακή πίτα',g:90},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:90},{n:'Γάλα αμυγδάλου',g:300},{n:'Μπανάνα',g:150},{n:'Μέλι άβραστο',g:20},{n:'Αμύγδαλα',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:70}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:190},{n:'Γλυκοπατάτα',g:250},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:150},{n:'Φράουλες',g:120}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:170},{n:'Κινόα (βρ.)',g:170},{n:'Σαλάτα εποχής',g:150},{n:'Ελιές',g:20},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί ολικής άλεσης',g:80},{n:'Φυστικοβούτυρο',g:25},{n:'Φράουλες',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:150},{n:'Καρύδια',g:15}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο μπιφτέκι',g:180},{n:'Ρύζι άσπρο (βρ.)',g:210},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Πρωτεΐνη σκόνη (whey)',g:30},{n:'Γάλα αμυγδάλου',g:250}]},{name:'Βραδινό',foods:[{n:'Ελεύθερο γεύμα',g:300}]}],
[{name:'Πρωινό',foods:[{n:'Pancakes Κυριακής (FYH)',g:135},{n:'Μέλι άβραστο',g:20},{n:'Μούρα',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:70}]},{name:'Μεσημεριανό',foods:[{n:'Φασόλια',g:290},{n:'Κυπριακή πίτα',g:90},{n:'Σαλάτα εποχής',g:150},{n:'Τυρί φέτα',g:30},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:140},{n:'Φράουλες',g:100}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:200},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]}]
],
kcal2700:[
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Βρώμη (ωμή)',g:100},{n:'Μπανάνα',g:150},{n:'Μέλι άβραστο',g:20},{n:'Αμύγδαλα',g:20}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:200},{n:'Cottage cheese',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:310},{n:'Ψωμί σίκαλης',g:80},{n:'Σαλάτα εποχής',g:150},{n:'Τυρί φέτα',g:30},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Φράουλες',g:120}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:210},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί σίκαλης',g:80},{n:'Αβοκάντο',g:70},{n:'Πορτοκάλι',g:200}]},{name:'Ενδιάμεσο',foods:[{n:'Πρωτεΐνη σκόνη (whey)',g:30},{n:'Γάλα αμυγδάλου',g:250},{n:'Μπανάνα',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο μπούτι (ψητό)',g:190},{n:'Ρύζι άσπρο (βρ.)',g:200},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:160},{n:'Μούρα',g:100}]},{name:'Βραδινό',foods:[{n:'Γαλοπούλα στήθος',g:240},{n:'Γλυκοπατάτα',g:280},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:60},{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:150},{n:'Μέλι άβραστο',g:20},{n:'Chia seeds',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'USN Trust Crunch Bar',g:65},{n:'Μήλο',g:180}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:220},{n:'Μακαρόνια (βρ.)',g:210},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:150},{n:'Φράουλες',g:150}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:180},{n:'Πλιγούρι (βρ.)',g:230},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί σίκαλης',g:90},{n:'Αβοκάντο',g:70},{n:'Μήλο',g:180}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:250},{n:'Αμύγδαλα',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Τόνος (κονσέρβα)',g:160},{n:'Ρύζι καστανό (βρ.)',g:210},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Μέλι άβραστο',g:15},{n:'Μούρα',g:100}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο σουβλάκι',g:220},{n:'Κυπριακή πίτα',g:100},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:100},{n:'Γάλα αμυγδάλου',g:300},{n:'Μπανάνα',g:160},{n:'Μέλι άβραστο',g:20},{n:'Αμύγδαλα',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:80}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:200},{n:'Γλυκοπατάτα',g:280},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:160},{n:'Φράουλες',g:150}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:180},{n:'Κινόα (βρ.)',g:190},{n:'Σαλάτα εποχής',g:150},{n:'Ελιές',g:25},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί ολικής άλεσης',g:90},{n:'Φυστικοβούτυρο',g:30},{n:'Φράουλες',g:180}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:160},{n:'Καρύδια',g:20}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο μπιφτέκι',g:200},{n:'Ρύζι άσπρο (βρ.)',g:230},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Πρωτεΐνη σκόνη (whey)',g:30},{n:'Γάλα αμυγδάλου',g:250}]},{name:'Βραδινό',foods:[{n:'Ελεύθερο γεύμα',g:300}]}],
[{name:'Πρωινό',foods:[{n:'Pancakes Κυριακής (FYH)',g:170},{n:'Μέλι άβραστο',g:20},{n:'Μούρα',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:80}]},{name:'Μεσημεριανό',foods:[{n:'Φασόλια',g:320},{n:'Κυπριακή πίτα',g:100},{n:'Σαλάτα εποχής',g:150},{n:'Τυρί φέτα',g:35},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:160},{n:'Φράουλες',g:150}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:220},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:15}]}]
],
kcal3000:[
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Βρώμη (ωμή)',g:110},{n:'Μπανάνα',g:160},{n:'Μέλι άβραστο',g:20},{n:'Αμύγδαλα',g:25}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:200},{n:'Cottage cheese',g:160}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:340},{n:'Ψωμί σίκαλης',g:90},{n:'Σαλάτα εποχής',g:160},{n:'Τυρί φέτα',g:30},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Φράουλες',g:150}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:240},{n:'Σαλάτα εποχής',g:160},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί σίκαλης',g:90},{n:'Αβοκάντο',g:80},{n:'Πορτοκάλι',g:200}]},{name:'Ενδιάμεσο',foods:[{n:'Πρωτεΐνη σκόνη (whey)',g:35},{n:'Γάλα αμυγδάλου',g:250},{n:'Μπανάνα',g:160}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο μπούτι (ψητό)',g:210},{n:'Ρύζι άσπρο (βρ.)',g:230},{n:'Σαλάτα εποχής',g:160},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:180},{n:'Μούρα',g:100}]},{name:'Βραδινό',foods:[{n:'Γαλοπούλα στήθος',g:260},{n:'Γλυκοπατάτα',g:300},{n:'Σαλάτα εποχής',g:160},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:70},{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:160},{n:'Μέλι άβραστο',g:20},{n:'Chia seeds',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'USN Trust Crunch Bar',g:70},{n:'Μήλο',g:180}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:240},{n:'Μακαρόνια (βρ.)',g:230},{n:'Σαλάτα εποχής',g:160},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:160},{n:'Φράουλες',g:150}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:200},{n:'Πλιγούρι (βρ.)',g:260},{n:'Σαλάτα εποχής',g:160},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί σίκαλης',g:100},{n:'Αβοκάντο',g:80},{n:'Μήλο',g:200}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:250},{n:'Αμύγδαλα',g:35}]},{name:'Μεσημεριανό',foods:[{n:'Τόνος (κονσέρβα)',g:180},{n:'Ρύζι καστανό (βρ.)',g:240},{n:'Σαλάτα εποχής',g:160},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Μέλι άβραστο',g:15},{n:'Μούρα',g:120}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο σουβλάκι',g:240},{n:'Κυπριακή πίτα',g:110},{n:'Σαλάτα εποχής',g:160},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:110},{n:'Γάλα αμυγδάλου',g:300},{n:'Μπανάνα',g:170},{n:'Μέλι άβραστο',g:20},{n:'Αμύγδαλα',g:20}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:85}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:220},{n:'Γλυκοπατάτα',g:310},{n:'Σαλάτα εποχής',g:160},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:180},{n:'Φράουλες',g:150}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:200},{n:'Κινόα (βρ.)',g:210},{n:'Σαλάτα εποχής',g:160},{n:'Ελιές',g:25},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:165},{n:'Ψωμί ολικής άλεσης',g:100},{n:'Φυστικοβούτυρο',g:30},{n:'Φράουλες',g:200}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:170},{n:'Καρύδια',g:20}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο μπιφτέκι',g:220},{n:'Ρύζι άσπρο (βρ.)',g:250},{n:'Σαλάτα εποχής',g:160},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Πρωτεΐνη σκόνη (whey)',g:35},{n:'Γάλα αμυγδάλου',g:250}]},{name:'Βραδινό',foods:[{n:'Ελεύθερο γεύμα',g:300}]}],
[{name:'Πρωινό',foods:[{n:'Pancakes Κυριακής (FYH)',g:170},{n:'Μέλι άβραστο',g:20},{n:'Μούρα',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:85}]},{name:'Μεσημεριανό',foods:[{n:'Φασόλια',g:350},{n:'Κυπριακή πίτα',g:110},{n:'Σαλάτα εποχής',g:160},{n:'Τυρί φέτα',g:40},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:180},{n:'Φράουλες',g:150}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:240},{n:'Σαλάτα εποχής',g:160},{n:'Ελαιόλαδο',g:15}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// VEGETARIAN & VEGAN MEAL PLANS — SCIENTIFICALLY-BACKED
// ══════════════════════════════════════════════════════════════════════════════
// FOUNDATION: Academy of Nutrition and Dietetics Position Statement (2025)
// https://www.jandonline.org/article/S2212-2672(25)00042-5/fulltext
//
// KEY MICRONUTRIENTS OF CONCERN:
// 1. PROTEIN: AND/ISSN recommend 1.4–2.0 g·kg·day⁻¹ for athletes
//    Strategy: Complete proteins + complementary combinations
//    - Complete: tofu, tempeh, quinoa, buckwheat, chia, hemp
//    - Combinations: rice+beans, lentils+nuts, hummus+whole grain bread
//
// 2. IRON (Non-heme absorption 2-20% vs heme 15-35%):
//    Strategy: Pair with vitamin C (150mg → 30% absorption)
//    - Iron sources: lentils, chickpeas, tofu, spinach, pumpkin seeds, fortified cereals
//    - Vitamin C synergy: citrus, tomatoes, bell peppers, broccoli
//    - Avoid: tea/coffee with meals (tannins inhibit iron)
//    - Enhance: soaking/sprouting/fermenting legumes
//    - Reference: https://veganhealth.org/iron/
//
// 3. VITAMIN B12: MUST supplement (no reliable plant sources)
//    - Daily: 25-100 mcg fortified foods OR 10 mcg supplement
//    - Weekly: 2000 mcg supplement
//    - Sources: fortified plant milks, nutritional yeast, cereals
//    - Reference: https://www.vegansociety.com/resources/nutrition-and-health/nutrients/vitamin-b12
//
// 4. CALCIUM: 1000-1200 mg/day (vegans need fortified sources)
//    - Sources: fortified plant milks, tofu (calcium-set), tahini, kale, broccoli
//    - Avoid oxalates with: spinach (use kale/broccoli instead)
//
// 5. VITAMIN D3: 10-25 μg/day (algae-based for vegans)
//    - Fortified plant milks + algae supplements
//
// 6. OMEGA-3:
//    - ALA: 1.5-3g/day from flaxseeds, chia, walnuts
//    - EPA/DHA: 200-300mg/day algae supplement (5-10% ALA→EPA conversion only)
//    - Reference: https://www.mygenefood.com/blog/the-vegan-omega-3-problem/
//
// 7. OTHER: Iodine (iodized salt), Zinc (legumes/seeds), Selenium (brazil nuts)
//
// ATHLETE-SPECIFIC (ISSN):
// - Strength: 1.6–2.2 g·kg·day⁻¹ protein, 1.0–1.5 g·kg·day⁻¹ fat
// - Endurance: 4–7 g·kg·day⁻¹ carbs (based on training)
// - Post-exercise: carbs + protein within 1–2 hours
// - Creatine: 3–5 g/day monohydrate (vegan-friendly)
// - Reference: https://link.springer.com/article/10.1186/s12970-017-0192-9
// ══════════════════════════════════════════════════════════════════════════════
// VEGETARIAN MEAL PLANS — Χωρίς κρέατα/ψάρια, με αυγά & γαλακτοκομικά
// ══════════════════════════════════════════════════════════════════════════════
vegetarian_loss:[
[{name:'Πρωινό',foods:[{n:'Γιαούρτι ελληνικό (2%)',g:200},{n:'Βρώμη (ωμή)',g:40},{n:'Μούρα',g:80},{n:'Σπόροι chia',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:120},{n:'Αμύγδαλα',g:10}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:210},{n:'Ρύζι άσπρο (βρ.)',g:100},{n:'Τομάτες (ψημένες)',g:80},{n:'Μπρόκολο',g:100},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:100},{n:'Ρυζογκοφρέτες',g:20}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:200},{n:'Τομάτες (φρέσκιες)',g:120},{n:'Κολοκυθάκια',g:100},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:40},{n:'Αβοκάντο',g:40},{n:'Μήλο',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Φράουλες',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Tofu grilled',g:200},{n:'Κινόα (βρ.)',g:120},{n:'Σπαράγγια',g:120},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:100},{n:'Αμύγδαλα',g:10}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:220},{n:'Κολοκυθάκια',g:150},{n:'Σπανάκι',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:50},{n:'Γάλα πλήρες',g:200},{n:'Μπανάνα',g:80},{n:'Chia seeds',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:55},{n:'Πορτοκάλι',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:220},{n:'Μπρόκολο',g:120},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:25},{n:'Φυστικοβούτυρο',g:20}]},{name:'Βραδινό',foods:[{n:'Tofu',g:200},{n:'Γλυκοπατάτα',g:130},{n:'Σπανάκι',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:40},{n:'Αβοκάντο',g:40},{n:'Πορτοκάλι',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Μήλο',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:220},{n:'Ρύζι καστανό (βρ.)',g:120},{n:'Φασολάκια',g:130},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:100},{n:'Μούρα',g:80}]},{name:'Βραδινό',foods:[{n:'Φακές',g:220},{n:'Πλιγούρι (βρ.)',g:120},{n:'Μελιτζάνες',g:130},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Βρώμη (ωμή)',g:40},{n:'Φράουλες',g:100},{n:'Καρύδια',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:150},{n:'Αμύγδαλα',g:10}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:220},{n:'Μανιτάρια',g:100},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Φράουλες',g:100}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:240},{n:'Σπανάκι',g:100},{n:'Τομάτες',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:110},{n:'Ψωμί σίκαλης',g:40},{n:'Φυστικοβούτυρο',g:20},{n:'Μπανάνα',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:55},{n:'Πορτοκάλι',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Tofu stir-fry',g:240},{n:'Ρύζι άσπρο (βρ.)',g:100},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Μπανάνα',g:80}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια hummus',g:120},{n:'Ψάρι - SKIP',g:0},{n:'Τομάτες',g:100},{n:'Τυρί φέτα',g:20},{n:'Ελιές',g:15},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:50},{n:'Γιαούρτι 2%',g:200},{n:'Κεράσια',g:100},{n:'Καρύδια',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:120},{n:'Cottage cheese',g:80}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:200},{n:'Κινόα (βρ.)',g:120},{n:'Σπανάκι',g:100},{n:'Ελαιόλαδο',g:8},{n:'Ελιές',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:20},{n:'Αβοκάντο',g:40},{n:'Τομάτες',g:80}]},{name:'Βραδινό',foods:[{n:'Tofu',g:200},{n:'Γλυκοπατάτα',g:150},{n:'Μπρόκολο',g:100},{n:'Ελαιόλαδο',g:8}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// VEGAN MEAL PLANS — Χωρίς ζωικά προϊόντα, με legumes & plant-based proteins
// ══════════════════════════════════════════════════════════════════════════════
vegan_loss:[
[{name:'Πρωινό',foods:[{n:'Chive & Onion Whipped Tofu Toast',g:408}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:120},{n:'Αμύγδαλα',g:15}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:220},{n:'Ρύζι άσπρο (βρ.)',g:100},{n:'Μπρόκολο',g:150},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Hummus',g:80},{n:'Ρυζογκοφρέτες',g:20}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:200},{n:'Τομάτες',g:100},{n:'Αγγούρι',g:100},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:150},{n:'Ψωμί ολικής άλεσης',g:40},{n:'Αβοκάντο',g:40},{n:'Μήλο',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα καρύδας',g:150},{n:'Φράουλες',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Tofu grilled',g:200},{n:'Κινόα (βρ.)',g:120},{n:'Σπαράγγια',g:120},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:100},{n:'Σπόροι ηλίανθος',g:15}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:220},{n:'Κολοκυθάκια',g:150},{n:'Σπανάκι',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Berries & Cream Instant Oatmeal',g:379}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:55},{n:'Πορτοκάλι',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:220},{n:'Μπρόκολο',g:120},{n:'Ταχίνι',g:15},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:25},{n:'Φυστικοβούτυρο (vegan)',g:20}]},{name:'Βραδινό',foods:[{n:'Tofu',g:200},{n:'Γλυκοπατάτα',g:130},{n:'Σπανάκι',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:140},{n:'Ψωμί σίκαλης',g:40},{n:'Αβοκάντο',g:40},{n:'Πορτοκάλι',g:150}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα σόγια',g:150},{n:'Μήλο',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:220},{n:'Ρύζι καστανό (βρ.)',g:120},{n:'Φασολάκια',g:130},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Hummus',g:90},{n:'Μούρα',g:80}]},{name:'Βραδινό',foods:[{n:'Φακές',g:220},{n:'Πλιγούρι (βρ.)',g:120},{n:'Μελιτζάνες',g:130},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Peanut Butter & Jelly Smoothie Bowl',g:346}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:150},{n:'Φιστίκια',g:15}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:220},{n:'Μανιτάρια',g:100},{n:'Ταχίνι',g:10},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα σόγια',g:150},{n:'Φράουλες',g:100}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:240},{n:'Σπανάκι',g:100},{n:'Τομάτες',g:80},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:140},{n:'Ψωμί ολικής άλεσης',g:40},{n:'Φυστικοβούτυρο (vegan)',g:20},{n:'Μπανάνα',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites (vegan)',g:55},{n:'Πορτοκάλι',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Tofu stir-fry',g:240},{n:'Ρύζι άσπρο (βρ.)',g:100},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα αμύγδαλο',g:150},{n:'Μπανάνα',g:80}]},{name:'Βραδινό',foods:[{n:'Hummus (chickpea)',g:140},{n:'Πίτα αραβική',g:60},{n:'Τομάτες',g:100},{n:'Σαλάτα',g:150},{n:'Ελαιόλαδο',g:8}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:50},{n:'Φυτικό γάλα καρύδας',g:200},{n:'Κεράσια',g:100},{n:'Σπόροι χαμπία',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:120},{n:'Αμύγδαλα',g:15}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:200},{n:'Κινόα (βρ.)',g:120},{n:'Σπανάκι',g:100},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:20},{n:'Αβοκάντο',g:40},{n:'Τομάτες',g:80}]},{name:'Βραδινό',foods:[{n:'Tofu',g:200},{n:'Γλυκοπατάτα',g:150},{n:'Μπρόκολο',g:100},{n:'Ελαιόλαδο',g:8}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// VEGETARIAN MILD — Ήπια απώλεια (+15%)
// ══════════════════════════════════════════════════════════════════════════════
vegetarian_mild:[
[{name:'Πρωινό',foods:[{n:'Mixed Berry & Granola Yogurt Parfait',g:461}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:140},{n:'Αμύγδαλα',g:15}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:240},{n:'Ρύζι άσπρο (βρ.)',g:120},{n:'Σπανάκι',g:170},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Ρυζογκοφρέτες',g:25}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:230},{n:'Τομάτες',g:115},{n:'Αγγούρι',g:115},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:125},{n:'Ψωμί σίκαλης',g:50},{n:'Αβοκάντο',g:45},{n:'Μήλο',g:140}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:170},{n:'Φράουλες',g:115}]},{name:'Μεσημεριανό',foods:[{n:'Tofu grilled',g:230},{n:'Κινόα (βρ.)',g:140},{n:'Σπαράγγια',g:140},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:115},{n:'Αμύγδαλα',g:15}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:250},{n:'Κολοκυθάκια',g:170},{n:'Σπανάκι',g:95},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:60},{n:'Γάλα πλήρες',g:230},{n:'Μπανάνα',g:95},{n:'Chia seeds',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:65},{n:'Πορτοκάλι',g:170}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:250},{n:'Μπρόκολο',g:140},{n:'Τυρί φέτα',g:25},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:30},{n:'Φυστικοβούτυρο',g:25}]},{name:'Βραδινό',foods:[{n:'Tofu',g:230},{n:'Γλυκοπατάτα',g:150},{n:'Σπανάκι',g:95},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:125},{n:'Ψωμί σίκαλης',g:50},{n:'Αβοκάντο',g:45},{n:'Πορτοκάλι',g:170}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:170},{n:'Μήλο',g:115}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:250},{n:'Ρύζι καστανό (βρ.)',g:140},{n:'Φασολάκια',g:150},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Μούρα',g:95}]},{name:'Βραδινό',foods:[{n:'Φακές',g:250},{n:'Πλιγούρι (βρ.)',g:140},{n:'Μελιτζάνες',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:230},{n:'Βρώμη (ωμή)',g:45},{n:'Φράουλες',g:115},{n:'Καρύδια',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:170},{n:'Αμύγδαλα',g:15}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:250},{n:'Μανιτάρια',g:115},{n:'Τυρί φέτα',g:25},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:170},{n:'Φράουλες',g:115}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:270},{n:'Σπανάκι',g:115},{n:'Τομάτες',g:95},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:125},{n:'Ψωμί σίκαλης',g:50},{n:'Φυστικοβούτυρο',g:25},{n:'Μπανάνα',g:115}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:65},{n:'Πορτοκάλι',g:170}]},{name:'Μεσημεριανό',foods:[{n:'Tofu stir-fry',g:270},{n:'Ρύζι άσπρο (βρ.)',g:120},{n:'Κολοκυθάκια',g:170},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:170},{n:'Μπανάνα',g:95}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια hummus',g:140},{n:'Ψάρι - SKIP',g:0},{n:'Τομάτες',g:115},{n:'Τυρί φέτα',g:25},{n:'Ελιές',g:18},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:60},{n:'Γιαούρτι 2%',g:230},{n:'Κεράσια',g:115},{n:'Καρύδια',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:140},{n:'Cottage cheese',g:95}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:230},{n:'Κινόα (βρ.)',g:140},{n:'Σπανάκι',g:115},{n:'Ελαιόλαδο',g:10},{n:'Ελιές',g:18}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:25},{n:'Αβοκάντο',g:45},{n:'Τομάτες',g:95}]},{name:'Βραδινό',foods:[{n:'Tofu',g:230},{n:'Γλυκοπατάτα',g:170},{n:'Μπρόκολο',g:115},{n:'Ελαιόλαδο',g:10}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// VEGETARIAN MAINTAIN — Διατήρηση (+40%)
// ══════════════════════════════════════════════════════════════════════════════
vegetarian_maintain:[
[{name:'Πρωινό',foods:[{n:'Berries & Cream Instant Oatmeal',g:379},{n:'Γιαούρτι 2%',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:170},{n:'Αμύγδαλα',g:20}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:290},{n:'Ρύζι άσπρο (βρ.)',g:145},{n:'Σπανάκι',g:205},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:150},{n:'Ρυζογκοφρέτες',g:30}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:280},{n:'Τομάτες',g:140},{n:'Αγγούρι',g:140},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:155},{n:'Ψωμί σίκαλης',g:60},{n:'Αβοκάντο',g:55},{n:'Μήλο',g:170}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Φράουλες',g:140}]},{name:'Μεσημεριανό',foods:[{n:'Tofu grilled',g:280},{n:'Κινόα (βρ.)',g:170},{n:'Σπαράγγια',g:170},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:140},{n:'Αμύγδαλα',g:20}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:310},{n:'Κολοκυθάκια',g:205},{n:'Σπανάκι',g:115},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:70},{n:'Γάλα πλήρες',g:280},{n:'Μπανάνα',g:115},{n:'Chia seeds',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:80},{n:'Πορτοκάλι',g:205}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:310},{n:'Μπρόκολο',g:170},{n:'Τυρί φέτα',g:30},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:35},{n:'Φυστικοβούτυρο',g:30}]},{name:'Βραδινό',foods:[{n:'Tofu',g:280},{n:'Γλυκοπατάτα',g:185},{n:'Σπανάκι',g:115},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:155},{n:'Ψωμί σίκαλης',g:60},{n:'Αβοκάντο',g:55},{n:'Πορτοκάλι',g:205}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μήλο',g:140}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:310},{n:'Ρύζι καστανό (βρ.)',g:170},{n:'Φασολάκια',g:185},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:150},{n:'Μούρα',g:115}]},{name:'Βραδινό',foods:[{n:'Φακές',g:310},{n:'Πλιγούρι (βρ.)',g:170},{n:'Μελιτζάνες',g:185},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:280},{n:'Βρώμη (ωμή)',g:55},{n:'Φράουλες',g:140},{n:'Καρύδια',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:205},{n:'Αμύγδαλα',g:20}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:310},{n:'Μανιτάρια',g:140},{n:'Τυρί φέτα',g:30},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Φράουλες',g:140}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:335},{n:'Σπανάκι',g:140},{n:'Τομάτες',g:115},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:155},{n:'Ψωμί σίκαλης',g:60},{n:'Φυστικοβούτυρο',g:30},{n:'Μπανάνα',g:140}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:80},{n:'Πορτοκάλι',g:205}]},{name:'Μεσημεριανό',foods:[{n:'Tofu stir-fry',g:335},{n:'Ρύζι άσπρο (βρ.)',g:145},{n:'Κολοκυθάκια',g:205},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:115}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια hummus',g:170},{n:'Ψάρι - SKIP',g:0},{n:'Τομάτες',g:140},{n:'Τυρί φέτα',g:30},{n:'Ελιές',g:20},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:70},{n:'Γιαούρτι 2%',g:280},{n:'Κεράσια',g:140},{n:'Καρύδια',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:170},{n:'Cottage cheese',g:115}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:280},{n:'Κινόα (βρ.)',g:170},{n:'Σπανάκι',g:140},{n:'Ελαιόλαδο',g:12},{n:'Ελιές',g:20}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:30},{n:'Αβοκάντο',g:55},{n:'Τομάτες',g:115}]},{name:'Βραδινό',foods:[{n:'Tofu',g:280},{n:'Γλυκοπατάτα',g:205},{n:'Μπρόκολο',g:140},{n:'Ελαιόλαδο',g:12}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// VEGETARIAN GAIN — Αύξηση μάζας (+65%)
// ══════════════════════════════════════════════════════════════════════════════
vegetarian_gain:[
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:330},{n:'Βρώμη (ωμή)',g:65},{n:'Μούρα',g:135},{n:'Μέλι',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:200},{n:'Αμύγδαλα',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:345},{n:'Ρύζι άσπρο (βρ.)',g:170},{n:'Σπανάκι',g:240},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:200},{n:'Ρυζογκοφρέτες',g:40},{n:'Μέλι',g:10}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:330},{n:'Τομάτες',g:165},{n:'Αγγούρι',g:165},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:185},{n:'Ψωμί σίκαλης',g:75},{n:'Αβοκάντο',g:65},{n:'Μήλο',g:200}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Φράουλες',g:165}]},{name:'Μεσημεριανό',foods:[{n:'Tofu grilled',g:330},{n:'Κινόα (βρ.)',g:200},{n:'Σπαράγγια',g:200},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:165},{n:'Αμύγδαλα',g:30}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:365},{n:'Κολοκυθάκια',g:240},{n:'Σπανάκι',g:135},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:80},{n:'Γάλα πλήρες',g:330},{n:'Μπανάνα',g:135},{n:'Chia seeds',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:100},{n:'Πορτοκάλι',g:240}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:365},{n:'Μπρόκολο',g:200},{n:'Τυρί φέτα',g:40},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:45},{n:'Φυστικοβούτυρο',g:40}]},{name:'Βραδινό',foods:[{n:'Tofu',g:330},{n:'Γλυκοπατάτα',g:215},{n:'Σπανάκι',g:135},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:185},{n:'Ψωμί σίκαλης',g:75},{n:'Αβοκάντο',g:65},{n:'Πορτοκάλι',g:240}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Μήλο',g:165}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:365},{n:'Ρύζι καστανό (βρ.)',g:200},{n:'Φασολάκια',g:215},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:200},{n:'Μούρα',g:135}]},{name:'Βραδινό',foods:[{n:'Φακές',g:365},{n:'Πλιγούρι (βρ.)',g:200},{n:'Μελιτζάνες',g:215},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Γιαούρτι 2%',g:330},{n:'Βρώμη (ωμή)',g:65},{n:'Φράουλες',g:165},{n:'Καρύδια',g:20}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:240},{n:'Αμύγδαλα',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:365},{n:'Μανιτάρια',g:165},{n:'Τυρί φέτα',g:40},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Φράουλες',g:165}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:395},{n:'Σπανάκι',g:165},{n:'Τομάτες',g:135},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:185},{n:'Ψωμί σίκαλης',g:75},{n:'Φυστικοβούτυρο',g:40},{n:'Μπανάνα',g:165}]},{name:'Ενδιάμεσο',foods:[{n:'Energy Bites (FYH)',g:100},{n:'Πορτοκάλι',g:240}]},{name:'Μεσημεριανό',foods:[{n:'Tofu stir-fry',g:395},{n:'Ρύζι άσπρο (βρ.)',g:170},{n:'Κολοκυθάκια',g:240},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Μπανάνα',g:135}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια hummus',g:200},{n:'Ψάρι - SKIP',g:0},{n:'Τομάτες',g:165},{n:'Τυρί φέτα',g:40},{n:'Ελιές',g:25},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:80},{n:'Γιαούρτι 2%',g:330},{n:'Κεράσια',g:165},{n:'Καρύδια',g:20}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:200},{n:'Cottage cheese',g:150}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:330},{n:'Κινόα (βρ.)',g:200},{n:'Σπανάκι',g:165},{n:'Ελαιόλαδο',g:15},{n:'Ελιές',g:25}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:40},{n:'Αβοκάντο',g:65},{n:'Τομάτες',g:135}]},{name:'Βραδινό',foods:[{n:'Tofu',g:330},{n:'Γλυκοπατάτα',g:240},{n:'Μπρόκολο',g:165},{n:'Ελαιόλαδο',g:15}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// KETOGENIC MILD — Ήπια απώλεια (+15%) — Low-carb, high-fat foods only
// ══════════════════════════════════════════════════════════════════════════════
ketogenic_mild:[
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:150},{n:'Αβοκάντο',g:60},{n:'Σπανάκι',g:100},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cheese',g:50},{n:'Αμύγδαλα',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:180},{n:'Μπρόκολο',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:100},{n:'Μέλι',g:5}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:180},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:140},{n:'Ψωμί ολικής άλεσης',g:20},{n:'Βούτυρο',g:10},{n:'Τομάτες',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:100},{n:'Περισσευόμενα φουντούκια',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:200},{n:'Σαλάτα',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Τυρί φέτα',g:50},{n:'Ελιές',g:25}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:200},{n:'Αγγούρι',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:160},{n:'Βούτυρο',g:12},{n:'Μανιτάρια',g:100},{n:'Αλάτι',g:2}]},{name:'Ενδιάμεσο',foods:[{n:'Avocado',g:80},{n:'Αμύγδαλα',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:200},{n:'Σπανάκι',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Κράτι',g:50},{n:'Καρύδια',g:20}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:200},{n:'Μπρόκολο',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:145},{n:'Σολομός (ψητός)',g:80},{n:'Αβοκάντο',g:50},{n:'Αγγούρι',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Μέλι',g:5}]},{name:'Μεσημεριανό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:180},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Τυρί φέτα',g:50},{n:'Ελιές',g:30}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:200},{n:'Σαλάτα',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:140},{n:'Κρέμα γάλακτος',g:50},{n:'Μανιτάρια',g:100},{n:'Τυρί',g:30}]},{name:'Ενδιάμεσο',foods:[{n:'Avocado',g:100},{n:'Αμύγδαλα',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:200},{n:'Μπρόκολο',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:120},{n:'Καρύδια',g:20}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:200},{n:'Σπανάκι',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:150},{n:'Σολομός (ψητός)',g:70},{n:'Αβοκάντο',g:55},{n:'Τομάτες',g:80}]},{name:'Ενδιάμεσο',foods:[{n:'Τυρί φέτα',g:50},{n:'Ελιές',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:190},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:120},{n:'Μέλι',g:5}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:200},{n:'Σαλάτα',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:155},{n:'Βούτυρο',g:12},{n:'Μανιτάρια',g:120},{n:'Τυρί',g:30}]},{name:'Ενδιάμεσο',foods:[{n:'Avocado',g:90},{n:'Αμύγδαλα',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:210},{n:'Μπρόκολο',g:160},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:120},{n:'Καρύδια',g:25}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:210},{n:'Σπανάκι',g:160},{n:'Ελαιόλαδο',g:10}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// KETOGENIC MAINTAIN — Διατήρηση (+40%)
// ══════════════════════════════════════════════════════════════════════════════
ketogenic_maintain:[
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:180},{n:'Αβοκάντο',g:70},{n:'Σπανάκι',g:120},{n:'Ελαιόλαδο',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Cheese',g:60},{n:'Αμύγδαλα',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:220},{n:'Μπρόκολο',g:180},{n:'Ελαιόλαδο',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:130},{n:'Μέλι',g:7}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:220},{n:'Κολοκυθάκια',g:180},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:170},{n:'Ψωμί ολικής άλεσης',g:25},{n:'Βούτυρο',g:12},{n:'Τομάτες',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:130},{n:'Περισσευόμενα φουντούκια',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:240},{n:'Σαλάτα',g:180},{n:'Ελαιόλαδο',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Τυρί φέτα',g:60},{n:'Ελιές',g:30}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:240},{n:'Αγγούρι',g:180},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:190},{n:'Βούτυρο',g:14},{n:'Μανιτάρια',g:120},{n:'Αλάτι',g:2}]},{name:'Ενδιάμεσο',foods:[{n:'Avocado',g:100},{n:'Αμύγδαλα',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:240},{n:'Σπανάκι',g:180},{n:'Ελαιόλαδο',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Κράτι',g:60},{n:'Καρύδια',g:25}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:240},{n:'Μπρόκολο',g:180},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:175},{n:'Σολομός (ψητός)',g:100},{n:'Αβοκάντο',g:60},{n:'Αγγούρι',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:150},{n:'Μέλι',g:7}]},{name:'Μεσημεριανό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:220},{n:'Κολοκυθάκια',g:180},{n:'Ελαιόλαδο',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Τυρί φέτα',g:60},{n:'Ελιές',g:35}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:240},{n:'Σαλάτα',g:180},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:170},{n:'Κρέμα γάλακτος',g:60},{n:'Μανιτάρια',g:120},{n:'Τυρί',g:40}]},{name:'Ενδιάμεσο',foods:[{n:'Avocado',g:120},{n:'Αμύγδαλα',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:240},{n:'Μπρόκολο',g:180},{n:'Ελαιόλαδο',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Καρύδια',g:25}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:240},{n:'Σπανάκι',g:180},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:180},{n:'Σολομός (ψητός)',g:85},{n:'Αβοκάντο',g:65},{n:'Τομάτες',g:100}]},{name:'Ενδιάμεσο',foods:[{n:'Τυρί φέτα',g:60},{n:'Ελιές',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:230},{n:'Κολοκυθάκια',g:180},{n:'Ελαιόλαδο',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:150},{n:'Μέλι',g:7}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:240},{n:'Σαλάτα',g:180},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:185},{n:'Βούτυρο',g:14},{n:'Μανιτάρια',g:140},{n:'Τυρί',g:40}]},{name:'Ενδιάμεσο',foods:[{n:'Avocado',g:110},{n:'Αμύγδαλα',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:250},{n:'Μπρόκολο',g:190},{n:'Ελαιόλαδο',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Καρύδια',g:30}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:250},{n:'Σπανάκι',g:190},{n:'Ελαιόλαδο',g:12}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// KETOGENIC GAIN — Αύξηση μάζας (+65%)
// ══════════════════════════════════════════════════════════════════════════════
ketogenic_gain:[
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:210},{n:'Αβοκάντο',g:85},{n:'Σπανάκι',g:140},{n:'Ελαιόλαδο',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Cheese',g:70},{n:'Αμύγδαλα',g:40}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:260},{n:'Μπρόκολο',g:210},{n:'Ελαιόλαδο',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:160},{n:'Μέλι',g:10}]},{name:'Βραδινό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:260},{n:'Κολοκυθάκια',g:210},{n:'Ελαιόλαδο',g:14}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:200},{n:'Ψωμί ολικής άλεσης',g:30},{n:'Βούτυρο',g:14},{n:'Τομάτες',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:160},{n:'Περισσευόμενα φουντούκια',g:40}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:280},{n:'Σαλάτα',g:210},{n:'Ελαιόλαδο',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Τυρί φέτα',g:70},{n:'Ελιές',g:40}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:280},{n:'Αγγούρι',g:210},{n:'Ελαιόλαδο',g:14}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:220},{n:'Βούτυρο',g:16},{n:'Μανιτάρια',g:140},{n:'Αλάτι',g:2}]},{name:'Ενδιάμεσο',foods:[{n:'Avocado',g:120},{n:'Αμύγδαλα',g:40}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:280},{n:'Σπανάκι',g:210},{n:'Ελαιόλαδο',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Κράτι',g:70},{n:'Καρύδια',g:35}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:280},{n:'Μπρόκολο',g:210},{n:'Ελαιόλαδο',g:14}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:205},{n:'Σολομός (ψητός)',g:120},{n:'Αβοκάντο',g:70},{n:'Αγγούρι',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:180},{n:'Μέλι',g:10}]},{name:'Μεσημεριανό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:260},{n:'Κολοκυθάκια',g:210},{n:'Ελαιόλαδο',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Τυρί φέτα',g:70},{n:'Ελιές',g:40}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:280},{n:'Σαλάτα',g:210},{n:'Ελαιόλαδο',g:14}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:200},{n:'Κρέμα γάλακτος',g:70},{n:'Μανιτάρια',g:140},{n:'Τυρί',g:50}]},{name:'Ενδιάμεσο',foods:[{n:'Avocado',g:140},{n:'Αμύγδαλα',g:40}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:280},{n:'Μπρόκολο',g:210},{n:'Ελαιόλαδο',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:180},{n:'Καρύδια',g:35}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:280},{n:'Σπανάκι',g:210},{n:'Ελαιόλαδο',g:14}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:210},{n:'Σολομός (ψητός)',g:100},{n:'Αβοκάντο',g:75},{n:'Τομάτες',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Τυρί φέτα',g:70},{n:'Ελιές',g:40}]},{name:'Μεσημεριανό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:270},{n:'Κολοκυθάκια',g:210},{n:'Ελαιόλαδο',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:180},{n:'Μέλι',g:10}]},{name:'Βραδινό',foods:[{n:'Λαβράκι (ψητό)',g:280},{n:'Σαλάτα',g:210},{n:'Ελαιόλαδο',g:14}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:215},{n:'Βούτυρο',g:16},{n:'Μανιτάρια',g:160},{n:'Τυρί',g:50}]},{name:'Ενδιάμεσο',foods:[{n:'Avocado',g:130},{n:'Αμύγδαλα',g:40}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:290},{n:'Μπρόκολο',g:220},{n:'Ελαιόλαδο',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:180},{n:'Καρύδια',g:40}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:290},{n:'Σπανάκι',g:220},{n:'Ελαιόλαδο',g:14}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// VEGAN MILD — Ήπια απώλεια (+15%)
// ══════════════════════════════════════════════════════════════════════════════
vegan_mild:[
[{name:'Πρωινό',foods:[{n:'Φυτικό γάλα (σόγια)',g:230},{n:'Βρώμη (ωμή)',g:45},{n:'Μούρα',g:95},{n:'Σπόροι len',g:6}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:140},{n:'Αμύγδαλα',g:20}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:250},{n:'Ρύζι άσπρο (βρ.)',g:120},{n:'Μπρόκολο',g:170},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Hummus',g:95},{n:'Ρυζογκοφρέτες',g:25}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:230},{n:'Τομάτες',g:115},{n:'Αγγούρι',g:115},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:170},{n:'Ψωμί ολικής άλεσης',g:50},{n:'Αβοκάντο',g:45},{n:'Μήλο',g:140}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα καρύδας',g:170},{n:'Φράουλες',g:115}]},{name:'Μεσημεριανό',foods:[{n:'Tofu grilled',g:230},{n:'Κινόα (βρ.)',g:140},{n:'Σπαράγγια',g:140},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:115},{n:'Σπόροι ηλίανθος',g:18}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:250},{n:'Κολοκυθάκια',g:170},{n:'Σπανάκι',g:95},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:60},{n:'Φυτικό γάλα αμύγδαλο',g:230},{n:'Μπανάνα',g:95},{n:'Chia seeds',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:65},{n:'Πορτοκάλι',g:170}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:250},{n:'Μπρόκολο',g:140},{n:'Ταχίνι',g:18},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:30},{n:'Φυστικοβούτυρο (vegan)',g:25}]},{name:'Βραδινό',foods:[{n:'Tofu',g:230},{n:'Γλυκοπατάτα',g:150},{n:'Σπανάκι',g:95},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:160},{n:'Ψωμί σίκαλης',g:50},{n:'Αβοκάντο',g:45},{n:'Πορτοκάλι',g:170}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα σόγια',g:170},{n:'Μήλο',g:115}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:250},{n:'Ρύζι καστανό (βρ.)',g:140},{n:'Φασολάκια',g:150},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Hummus',g:105},{n:'Μούρα',g:95}]},{name:'Βραδινό',foods:[{n:'Φακές',g:250},{n:'Πλιγούρι (βρ.)',g:140},{n:'Μελιτζάνες',g:150},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Φυτικό γάλα καρύδας',g:230},{n:'Βρώμη (ωμή)',g:45},{n:'Φράουλες',g:115},{n:'Σπόροι κολοκύνθης',g:18}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:170},{n:'Φιστίκια',g:18}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:250},{n:'Μανιτάρια',g:115},{n:'Ταχίνι',g:12},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα σόγια',g:170},{n:'Φράουλες',g:115}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:270},{n:'Σπανάκι',g:115},{n:'Τομάτες',g:95},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:160},{n:'Ψωμί ολικής άλεσης',g:50},{n:'Φυστικοβούτυρο (vegan)',g:25},{n:'Μπανάνα',g:115}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites (vegan)',g:65},{n:'Πορτοκάλι',g:170}]},{name:'Μεσημεριανό',foods:[{n:'Tofu stir-fry',g:270},{n:'Ρύζι άσπρο (βρ.)',g:120},{n:'Κολοκυθάκια',g:170},{n:'Ελαιόλαδο',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα αμύγδαλο',g:170},{n:'Μπανάνα',g:95}]},{name:'Βραδινό',foods:[{n:'Hummus (chickpea)',g:160},{n:'Πίτα αραβική',g:70},{n:'Τομάτες',g:115},{n:'Σαλάτα',g:170},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:60},{n:'Φυτικό γάλα καρύδας',g:230},{n:'Κεράσια',g:115},{n:'Σπόροι χαμπία',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:140},{n:'Αμύγδαλα',g:20}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:230},{n:'Κινόα (βρ.)',g:140},{n:'Σπανάκι',g:115},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:25},{n:'Αβοκάντο',g:45},{n:'Τομάτες',g:95}]},{name:'Βραδινό',foods:[{n:'Tofu',g:230},{n:'Γλυκοπατάτα',g:170},{n:'Μπρόκολο',g:115},{n:'Ελαιόλαδο',g:10}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// VEGAN MAINTAIN — Διατήρηση (+40%)
// ══════════════════════════════════════════════════════════════════════════════
vegan_maintain:[
[{name:'Πρωινό',foods:[{n:'Φυτικό γάλα (σόγια)',g:280},{n:'Βρώμη (ωμή)',g:55},{n:'Μούρα',g:115},{n:'Σπόροι len',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:170},{n:'Αμύγδαλα',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:310},{n:'Ρύζι άσπρο (βρ.)',g:145},{n:'Μπρόκολο',g:205},{n:'Ελαιόλαδο',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Hummus',g:115},{n:'Ρυζογκοφρέτες',g:30}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:280},{n:'Τομάτες',g:140},{n:'Αγγούρι',g:140},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:210},{n:'Ψωμί ολικής άλεσης',g:60},{n:'Αβοκάντο',g:55},{n:'Μήλο',g:170}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα καρύδας',g:200},{n:'Φράουλες',g:140}]},{name:'Μεσημεριανό',foods:[{n:'Tofu grilled',g:280},{n:'Κινόα (βρ.)',g:170},{n:'Σπαράγγια',g:170},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:140},{n:'Σπόροι ηλίανθος',g:22}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:310},{n:'Κολοκυθάκια',g:205},{n:'Σπανάκι',g:115},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:70},{n:'Φυτικό γάλα αμύγδαλο',g:280},{n:'Μπανάνα',g:115},{n:'Chia seeds',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:80},{n:'Πορτοκάλι',g:205}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:310},{n:'Μπρόκολο',g:170},{n:'Ταχίνι',g:22},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:35},{n:'Φυστικοβούτυρο (vegan)',g:30}]},{name:'Βραδινό',foods:[{n:'Tofu',g:280},{n:'Γλυκοπατάτα',g:185},{n:'Σπανάκι',g:115},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:195},{n:'Ψωμί σίκαλης',g:60},{n:'Αβοκάντο',g:55},{n:'Πορτοκάλι',g:205}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα σόγια',g:200},{n:'Μήλο',g:140}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:310},{n:'Ρύζι καστανό (βρ.)',g:170},{n:'Φασολάκια',g:185},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Hummus',g:130},{n:'Μούρα',g:115}]},{name:'Βραδινό',foods:[{n:'Φακές',g:310},{n:'Πλιγούρι (βρ.)',g:170},{n:'Μελιτζάνες',g:185},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Φυτικό γάλα καρύδας',g:280},{n:'Βρώμη (ωμή)',g:55},{n:'Φράουλες',g:140},{n:'Σπόροι κολοκύνθης',g:22}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:205},{n:'Φιστίκια',g:22}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:310},{n:'Μανιτάρια',g:140},{n:'Ταχίνι',g:15},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα σόγια',g:200},{n:'Φράουλες',g:140}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:335},{n:'Σπανάκι',g:140},{n:'Τομάτες',g:115},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:195},{n:'Ψωμί ολικής άλεσης',g:60},{n:'Φυστικοβούτυρο (vegan)',g:30},{n:'Μπανάνα',g:140}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites (vegan)',g:80},{n:'Πορτοκάλι',g:205}]},{name:'Μεσημεριανό',foods:[{n:'Tofu stir-fry',g:335},{n:'Ρύζι άσπρο (βρ.)',g:145},{n:'Κολοκυθάκια',g:205},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα αμύγδαλο',g:200},{n:'Μπανάνα',g:115}]},{name:'Βραδινό',foods:[{n:'Hummus (chickpea)',g:200},{n:'Πίτα αραβική',g:80},{n:'Τομάτες',g:140},{n:'Σαλάτα',g:200},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:70},{n:'Φυτικό γάλα καρύδας',g:280},{n:'Κεράσια',g:140},{n:'Σπόροι χαμπία',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:170},{n:'Αμύγδαλα',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:280},{n:'Κινόα (βρ.)',g:170},{n:'Σπανάκι',g:140},{n:'Ελαιόλαδο',g:14}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:30},{n:'Αβοκάντο',g:55},{n:'Τομάτες',g:115}]},{name:'Βραδινό',foods:[{n:'Tofu',g:280},{n:'Γλυκοπατάτα',g:205},{n:'Μπρόκολο',g:140},{n:'Ελαιόλαδο',g:12}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// VEGAN GAIN — Αύξηση μάζας (+65%)
// ══════════════════════════════════════════════════════════════════════════════
vegan_gain:[
[{name:'Πρωινό',foods:[{n:'Φυτικό γάλα (σόγια)',g:330},{n:'Βρώμη (ωμή)',g:65},{n:'Μούρα',g:135},{n:'Σπόροι len',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:200},{n:'Αμύγδαλα',g:35}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:365},{n:'Ρύζι άσπρο (βρ.)',g:170},{n:'Μπρόκολο',g:240},{n:'Ελαιόλαδο',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Hummus',g:140},{n:'Ρυζογκοφρέτες',g:40},{n:'Μέλι',g:12}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:330},{n:'Τομάτες',g:165},{n:'Αγγούρι',g:165},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:250},{n:'Ψωμί ολικής άλεσης',g:75},{n:'Αβοκάντο',g:65},{n:'Μήλο',g:200}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα καρύδας',g:250},{n:'Φράουλες',g:165}]},{name:'Μεσημεριανό',foods:[{n:'Tofu grilled',g:330},{n:'Κινόα (βρ.)',g:200},{n:'Σπαράγγια',g:200},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:165},{n:'Σπόροι ηλίανθος',g:30}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:365},{n:'Κολοκυθάκια',g:240},{n:'Σπανάκι',g:135},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:80},{n:'Φυτικό γάλα αμύγδαλο',g:330},{n:'Μπανάνα',g:135},{n:'Chia seeds',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites',g:100},{n:'Πορτοκάλι',g:240}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:365},{n:'Μπρόκολο',g:200},{n:'Ταχίνι',g:30},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:45},{n:'Φυστικοβούτυρο (vegan)',g:40}]},{name:'Βραδινό',foods:[{n:'Tofu',g:330},{n:'Γλυκοπατάτα',g:215},{n:'Σπανάκι',g:135},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:230},{n:'Ψωμί σίκαλης',g:75},{n:'Αβοκάντο',g:65},{n:'Πορτοκάλι',g:240}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα σόγια',g:250},{n:'Μήλο',g:165}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:365},{n:'Ρύζι καστανό (βρ.)',g:200},{n:'Φασολάκια',g:215},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Hummus',g:160},{n:'Μούρα',g:135}]},{name:'Βραδινό',foods:[{n:'Φακές',g:365},{n:'Πλιγούρι (βρ.)',g:200},{n:'Μελιτζάνες',g:215},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Φυτικό γάλα καρύδας',g:330},{n:'Βρώμη (ωμή)',g:65},{n:'Φράουλες',g:165},{n:'Σπόροι κολοκύνθης',g:30}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:240},{n:'Φιστίκια',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:365},{n:'Μανιτάρια',g:165},{n:'Ταχίνι',g:20},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα σόγια',g:250},{n:'Φράουλες',g:165}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:395},{n:'Σπανάκι',g:165},{n:'Τομάτες',g:135},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Tofu scramble',g:230},{n:'Ψωμί ολικής άλεσης',g:75},{n:'Φυστικοβούτυρο (vegan)',g:40},{n:'Μπανάνα',g:165}]},{name:'Ενδιάμεσο',foods:[{n:'Dark Choc Oat Bites (vegan)',g:100},{n:'Πορτοκάλι',g:240}]},{name:'Μεσημεριανό',foods:[{n:'Tofu stir-fry',g:395},{n:'Ρύζι άσπρο (βρ.)',g:170},{n:'Κολοκυθάκια',g:240},{n:'Ελαιόλαδο',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Φυτικό γάλα αμύγδαλο',g:250},{n:'Μπανάνα',g:135}]},{name:'Βραδινό',foods:[{n:'Hummus (chickpea)',g:240},{n:'Πίτα αραβική',g:95},{n:'Τομάτες',g:165},{n:'Σαλάτα',g:240},{n:'Ελαιόλαδο',g:15}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:80},{n:'Φυτικό γάλα καρύδας',g:330},{n:'Κεράσια',g:165},{n:'Σπόροι χαμπία',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:200},{n:'Αμύγδαλα',g:35}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:330},{n:'Κινόα (βρ.)',g:200},{n:'Σπανάκι',g:165},{n:'Ελαιόλαδο',g:16}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:40},{n:'Αβοκάντο',g:65},{n:'Τομάτες',g:135}]},{name:'Βραδινό',foods:[{n:'Tofu',g:330},{n:'Γλυκοπατάτα',g:240},{n:'Μπρόκολο',g:165},{n:'Ελαιόλαδο',g:15}]}]
],
/* ── INTERMITTENT FASTING: 3 meals/day (lunch 12pm + afternoon snack + dinner 8pm) ── */
intermittent_fasting:[
[{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:200},{n:'Κινόα (βρ.)',g:180},{n:'Σπανάκι',g:150},{n:'Τομάτες',g:100},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Αμύγδαλα',g:30},{n:'Μήλο',g:100}]},{name:'Βραδινό',foods:[{n:'Αυγά (ολόκληρα)',g:180},{n:'Ψωμί σίκαλης',g:60},{n:'Αβοκάντο',g:60},{n:'Τομάτες',g:80},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:220},{n:'Γλυκοπατάτα',g:220},{n:'Μπρόκολο',g:160},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:200},{n:'Καρύδια',g:25},{n:'Μπανάνα',g:120}]},{name:'Βραδινό',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Βρώμη (ωμή)',g:70},{n:'Κεράσια',g:150},{n:'Αμύγδαλα',g:20}]}],
[{name:'Μεσημεριανό',foods:[{n:'Λαβράκι (ψητό)',g:220},{n:'Πλιγούρι (βρ.)',g:180},{n:'Κολοκυθάκια',g:150},{n:'Τομάτες',g:100},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Αυγά (ολόκληρα)',g:120},{n:'Φυστικοβούτυρο',g:25},{n:'Μήλο',g:100}]},{name:'Βραδινό',foods:[{n:'Cottage cheese',g:220},{n:'Φράουλες',g:150},{n:'Ψωμί ολικής άλεσης',g:60},{n:'Αμύγδαλα',g:20}]}],
[{name:'Μεσημεριανό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:220},{n:'Ρύζι καστανό (βρ.)',g:200},{n:'Σπανάκι',g:160},{n:'Τομάτες',g:100},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Καρύδια',g:30},{n:'Πορτοκάλι',g:150}]},{name:'Βραδινό',foods:[{n:'Αυγά (ολόκληρα)',g:160},{n:'Φυστικοβούτυρο',g:25},{n:'Ψωμί σίκαλης',g:50},{n:'Μπανάνα',g:120}]}],
[{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:200},{n:'Κινόα (βρ.)',g:200},{n:'Σαλάτα',g:200},{n:'Ελιές',g:20},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Cottage cheese',g:200},{n:'Αμύγδαλα',g:30},{n:'Μούρα',g:120}]},{name:'Βραδινό',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Βρώμη (ωμή)',g:70},{n:'Κεράσια',g:150},{n:'Καρύδια',g:20}]}],
[{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:220},{n:'Γλυκοπατάτα',g:240},{n:'Σπανάκι',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Αυγά (ολόκληρα)',g:140},{n:'Cottage cheese',g:180},{n:'Μήλο',g:120}]},{name:'Βραδινό',foods:[{n:'Γιαούρτι 2%',g:250},{n:'Βρώμη (ωμή)',g:80},{n:'Μπανάνα',g:150},{n:'Αμύγδαλα',g:25}]}],
[{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:220},{n:'Ρύζι αrborio (βρ.)',g:200},{n:'Μπρόκολο',g:160},{n:'Τομάτες',g:100},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Φυστικοβούτυρο',g:25},{n:'Πορτοκάλι',g:150}]},{name:'Βραδινό',foods:[{n:'Αυγά (ολόκληρα)',g:170},{n:'Ψωμί σίκαλης',g:60},{n:'Αβοκάντο',g:50},{n:'Τομάτες',g:80}]}]
],
/* ── ORTHODOX FASTING: Plant-based (no meat, fish, dairy, eggs, animal oil) ── */
orthodox_fasting:[
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:70},{n:'Φυτικό γάλα αμύγδαλο',g:250},{n:'Μπανάνα',g:120},{n:'Chia seeds',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:150},{n:'Αμύγδαλα',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:240},{n:'Σπανάκι',g:150},{n:'Ταχίνι',g:20},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:200},{n:'Ξηρά σύκα',g:40}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:250},{n:'Κινόα (βρ.)',g:150},{n:'Μανιτάρια',g:120},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Φυτικό γάλα σόγια',g:280},{n:'Βρώμη (ωμή)',g:80},{n:'Φράουλες',g:130},{n:'Σπόροι κολοκύνθης',g:20}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:130},{n:'Φιστίκια',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Φασόλια',g:260},{n:'Ρύζι καστανό (βρ.)',g:160},{n:'Κολοκυθάκια',g:120},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:200},{n:'Σταφίδες',g:30}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:250},{n:'Πλιγούρι (βρ.)',g:150},{n:'Τομάτες',g:120},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:80},{n:'Φυτικό γάλα καρύδας',g:250},{n:'Μήλο',g:130},{n:'Chia seeds',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Κεράσια',g:150},{n:'Αμύγδαλα',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:260},{n:'Σπανάκι',g:160},{n:'Ταχίνι',g:18},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:30},{n:'Φυστικοβούτυρο (vegan)',g:25}]},{name:'Βραδινό',foods:[{n:'Φασόλια',g:260},{n:'Κινόα (βρ.)',g:160},{n:'Μανιτάρια',g:120},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Φυτικό γάλα αμύγδαλο',g:280},{n:'Βρώμη (ωμή)',g:70},{n:'Φράουλες',g:140},{n:'Chia seeds',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:150},{n:'Φιστίκια',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Ρεβίθια',g:270},{n:'Ρύζι άσπρο (βρ.)',g:160},{n:'Σαλάτα',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:180},{n:'Ξηρά δαμάσκηνα',g:40}]},{name:'Βραδινό',foods:[{n:'Φακές',g:240},{n:'Πλιγούρι (βρ.)',g:160},{n:'Κολοκυθάκια',g:120},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Φυτικό γάλα σόγια',g:250},{n:'Βρώμη (ωμή)',g:90},{n:'Μπανάνα',g:140},{n:'Σπόροι ηλιόσπορου',g:20}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:160},{n:'Αμύγδαλα',g:25}]},{name:'Μεσημεριανό',foods:[{n:'Φασόλια',g:260},{n:'Κινόα (βρ.)',g:170},{n:'Σπανάκι',g:140},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Ρυζογκοφρέτες',g:40},{n:'Φυστικοβούτυρο (vegan)',g:25}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:270},{n:'Ρύζι καστανό (βρ.)',g:160},{n:'Τομάτες',g:120},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:80},{n:'Φυτικό γάλα καρύδας',g:280},{n:'Κεράσια',g:140},{n:'Chia seeds',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Μπανάνα',g:140},{n:'Φιστίκια',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Φακές',g:250},{n:'Ρύζι άσπρο (βρ.)',g:160},{n:'Μανιτάρια',g:120},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:180},{n:'Σταφίδες',g:35}]},{name:'Βραδινό',foods:[{n:'Ρεβίθια',g:260},{n:'Πλιγούρι (βρ.)',g:170},{n:'Σαλάτα',g:140},{n:'Ελαιόλαδο',g:12}]}],
[{name:'Πρωινό',foods:[{n:'Φυτικό γάλα αμύγδαλο',g:250},{n:'Βρώμη (ωμή)',g:90},{n:'Φράουλες',g:150},{n:'Σπόροι κολοκύνθης',g:18}]},{name:'Ενδιάμεσο',foods:[{n:'Μήλο',g:160},{n:'Αμύγδαλα',g:30}]},{name:'Μεσημεριανό',foods:[{n:'Φασόλια',g:270},{n:'Κινόα (βρ.)',g:170},{n:'Κολοκυθάκια',g:130},{n:'Ελαιόλαδο',g:12}]},{name:'Ενδιάμεσο',foods:[{n:'Πορτοκάλι',g:180},{n:'Ξηρά δαμάσκηνα',g:40}]},{name:'Βραδινό',foods:[{n:'Φακές',g:250},{n:'Ρύζι καστανό (βρ.)',g:170},{n:'Σπανάκι',g:130},{n:'Ελαιόλαδο',g:12}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// ΠΑΙΔΙΑ 10-14 ΕΤΩΝ — Θρεπτικές ανάγκες για υγιή ανάπτυξη
// ══════════════════════════════════════════════════════════════════════════════
// TDEE: ~2000 kcal | Πρωτεΐνη: 55g | Λίπη: 60g | Υδατάνθρακες: 240g
// Σάντουιτς στο πρωινό ενδιάμεσο για σχολείο + ελαφρά φαγητά
kids_10_14:[
[{name:'Πρωινό',foods:[{n:'Γιαούρτι ελληνικό 2%',g:200},{n:'Δημητριακά ολικής άλεσης',g:40},{n:'Μπανάνα',g:120},{n:'Μέλι',g:15}]},{name:'Ενδιάμεσο',foods:[{n:'Ψωμί ολικής άλεσης',g:60},{n:'Κοτόπουλο ψητό',g:50},{n:'Ντομάτα',g:40},{n:'Μαρούλι',g:30},{n:'Τυρί ασυνάγων λίπους',g:20},{n:'Μήλο',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:150},{n:'Ρύζι άσπρο (βρ.)',g:120},{n:'Μπρόκολο',g:130},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Μπάρα granola (χαμηλή ζάχαρη)',g:30},{n:'Πορτοκάλι',g:120}]},{name:'Βραδινό',foods:[{n:'Φακές (μαγειρεμένες)',g:180},{n:'Ψωμί σίκαλης',g:50},{n:'Σαλάτα με λάδι',g:150},{n:'Ελαιόλαδο',g:5}]}],

[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:100},{n:'Ψωμί σίκαλης',g:50},{n:'Ντομάτα',g:50},{n:'Πορτοκάλι',g:130}]},{name:'Ενδιάμεσο',foods:[{n:'Ψωμί ολικής άλεσης',g:60},{n:'Τόνος (κονσέρβα σε νερό)',g:60},{n:'Αγγούρι',g:50},{n:'Φυστικοβούτυρο (φυσικό)',g:15},{n:'Φράουλες',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Ψάρι λευκό ψητό',g:150},{n:'Πατάτες (βρασμένες)',g:150},{n:'Σπανάκι σαλάτα',g:120},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γάλα πλήρες',g:200},{n:'Κουλουράκια (ολικής άλεσης)',g:40},{n:'Μπανάνα',g:100}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:140},{n:'Πλιγούρι (βρ.)',g:120},{n:'Γλυκοπατάτα',g:100},{n:'Ελαιόλαδο',g:5}]}],

[{name:'Πρωινό',foods:[{n:'Βρώμη (ωμή)',g:50},{n:'Γάλα πλήρες',g:200},{n:'Μπερδέ φρούτα',g:100},{n:'Μέλι',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Ψωμί ολικής άλεσης',g:60},{n:'Κοτόπουλο ψητό',g:50},{n:'Μαρούλι',g:30},{n:'Σαλάτα λάχανο',g:40},{n:'Φυστικοβούτυρο',g:12},{n:'Μήλο',g:130}]},{name:'Μεσημεριανό',foods:[{n:'Λαβράκι (ψητό)',g:150},{n:'Κινόα (βρ.)',g:110},{n:'Σπαράγγια',g:130},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:170},{n:'Μούρα',g:100},{n:'Κουλουράκια ολικής άλεσης',g:25}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο σουβλάκι',g:140},{n:'Πίτα ολικής άλεσης',g:60},{n:'Σαλάτα ντομάτας',g:120},{n:'Ελαιόλαδο',g:5}]}],

[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:100},{n:'Ψωμί ολικής άλεσης',g:50},{n:'Αβοκάντο',g:40},{n:'Μπανάνα',g:120}]},{name:'Ενδιάμεσο',foods:[{n:'Ψωμί σίκαλης',g:60},{n:'Αυγό μαγιονέζα (ελαφριά)',g:15},{n:'Γαλοπούλα ψητή',g:50},{n:'Ντομάτα',g:40},{n:'Αγγούρι',g:40},{n:'Φράουλες',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Φακές (μαγειρεμένες)',g:200},{n:'Ρύζι άσπρο (βρ.)',g:110},{n:'Μπρόκολο',g:130},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γάλα πλήρες',g:200},{n:'Μπάρα σοκολάτας ολικής',g:35},{n:'Πορτοκάλι',g:130}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο κομματιασμένο',g:140},{n:'Ρύζι καστανό (βρ.)',g:120},{n:'Κολοκυθάκια (ψητά)',g:130},{n:'Ελαιόλαδο',g:5}]}],

[{name:'Πρωινό',foods:[{n:'Γιαούρτι ελληνικό 2%',g:200},{n:'Γράνολα χαμηλής ζάχαρης',g:45},{n:'Φράουλες',g:100},{n:'Μέλι',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Ψωμί ολικής άλεσης',g:60},{n:'Τόνος (κονσέρβα)',g:60},{n:'Σαλάτα λάχανο',g:50},{n:'Αγγούρι',g:40},{n:'Φυστικοβούτυρο',g:15},{n:'Μήλο',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Ψάρι λευκό ψητό',g:160},{n:'Πατάτες (βρασμένες)',g:140},{n:'Σπανάκι σαλάτα',g:120},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:150},{n:'Σταφίδες',g:30},{n:'Αμύγδαλα',g:15}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:140},{n:'Πλιγούρι (βρ.)',g:120},{n:'Σαλάτα ντομάτας',g:130},{n:'Ελαιόλαδο',g:5}]}],

[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:100},{n:'Ψωμί σίκαλης',g:50},{n:'φυστικοβούτυρο',g:15},{n:'Μπανάνα',g:130}]},{name:'Ενδιάμεσο',foods:[{n:'Ψωμί ολικής άλεσης',g:60},{n:'Κοτόπουλο ψητό',g:50},{n:'Ντομάτα',g:50},{n:'Φυστικοβούτυρο',g:12},{n:'Πορτοκάλι',g:130}]},{name:'Μεσημεριανό',foods:[{n:'Λαβράκι (ψητό)',g:160},{n:'Πατάτες (βρασμένες)',g:140},{n:'Μπρόκολο',g:120},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γάλα πλήρες',g:200},{n:'Κουλουράκια ολικής άλεσης',g:40},{n:'Μήλο',g:120}]},{name:'Βραδινό',foods:[{n:'Φακές (μαγειρεμένες)',g:180},{n:'Ρύζι άσπρο (βρ.)',g:110},{n:'Σαλάτα λάχανο',g:130},{n:'Ελαιόλαδο',g:5}]}],

[{name:'Πρωινό',foods:[{n:'Γιαούρτι ελληνικό 2%',g:200},{n:'Δημητριακά ολικής άλεσης',g:45},{n:'Μπερδέ φρούτα',g:120},{n:'Μέλι',g:10}]},{name:'Ενδιάμεσο',foods:[{n:'Ψωμί σίκαλης',g:60},{n:'Αυγό βρασμένο',g:50},{n:'Μαρούλι',g:30},{n:'Ντομάτα',g:40},{n:'Φυστικοβούτυρο',g:15},{n:'Φράουλες',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Ψάρι λευκό ψητό',g:160},{n:'Πλιγούρι (βρ.)',g:120},{n:'Γλυκοπατάτα',g:100},{n:'Ελαιόλαδο',g:8}]},{name:'Ενδιάμεσο',foods:[{n:'Γιαούρτι 2%',g:170},{n:'Μούρα',g:100},{n:'Μπάρα granola (χαμηλή ζάχαρη)',g:30}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο κομματιασμένο',g:140},{n:'Ρύζι καστανό (βρ.)',g:120},{n:'Σπανάκι σαλάτα',g:130},{n:'Ελαιόλαδο',g:5}]}]
],
// ══════════════════════════════════════════════════════════════════════════════
// ⚽ ΠΟΔΟΣΦΑΙΡΟ — Αθλητικό πλάνο για ποδοσφαιριστές
// ══════════════════════════════════════════════════════════════════════════════
// Υψηλή πρωτεΐνη για ανάπτυξη μυών + υψηλοί υδατάνθρακες για ενέργεια αγώνων
// Μεσογειακή διατροφή με προσοχή στο timing (πριν/μετά προπόνηση)
football:[
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:140},{n:'Ψωμί ολικής άλεσης',g:80},{n:'Μπανάνα',g:150},{n:'Ελαιόλαδο',g:8}]},{name:'Σνακ πρωί',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Energy Bites (FYH)',g:70},{n:'Πορτοκάλι',g:180}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:200},{n:'Ρύζι καστανό (βρ.)',g:220},{n:'Μπρόκολο',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Σνακ απόγευμα',foods:[{n:'Cottage cheese',g:150},{n:'Μούρα',g:100},{n:'Αμύγδαλα',g:20}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:180},{n:'Γλυκοπατάτα',g:240},{n:'Σπανάκι',g:100},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:60},{n:'Γάλα πλήρες',g:250},{n:'Φράουλες',g:140},{n:'Μέλι',g:15}]},{name:'Σνακ πρωί',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:80},{n:'Ρυζογκοφρέτες',g:35},{n:'Ντομάτα',g:80}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:200},{n:'Κινόα (βρ.)',g:200},{n:'Σπαράγγια',g:140},{n:'Ελαιόλαδο',g:12}]},{name:'Σνακ απόγευμα',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:120},{n:'Αμύγδαλα',g:20}]},{name:'Βραδινό',foods:[{n:'Φακές (μαγειρεμένες)',g:240},{n:'Κοτόπουλο στήθος (ψητό)',g:150},{n:'Τυρί φέτα',g:25},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:140},{n:'Ψωμί σίκαλης',g:90},{n:'Αβοκάντο',g:60},{n:'Μπανάνα',g:120}]},{name:'Σνακ πρωί',foods:[{n:'Cottage cheese',g:160},{n:'Φράουλες',g:120},{n:'Chia seeds',g:10}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:200},{n:'Μακαρόνια (βρ.)',g:200},{n:'Τομάτες',g:150},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:12}]},{name:'Σνακ απόγευμα',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:130},{n:'Αμύγδαλα',g:20}]},{name:'Βραδινό',foods:[{n:'Σολομός (ψητός)',g:180},{n:'Κριθαράκι (βρ.)',g:200},{n:'Κολοκυθάκια',g:150},{n:'Ελιές',g:20},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:60},{n:'Γιαούρτι 2%',g:220},{n:'Μπερδέ φρούτα',g:150},{n:'Μέλι',g:12}]},{name:'Σνακ πρωί',foods:[{n:'Energy Bites (FYH)',g:75},{n:'Μήλο',g:180}]},{name:'Μεσημεριανό',foods:[{n:'Βοδινό άπαχο (ψητό)',g:200},{n:'Ρύζι άσπρο (βρ.)',g:220},{n:'Μανιτάρια',g:130},{n:'Ελαιόλαδο',g:12}]},{name:'Σνακ απόγευμα',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Μπανάνα',g:120},{n:'Καρύδια',g:20}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:180},{n:'Πλιγούρι (βρ.)',g:200},{n:'Σπανάκι',g:120},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:150},{n:'Ψωμί ολικής άλεσης',g:80},{n:'Φυστικοβούτυρο',g:25},{n:'Μπανάνα',g:140}]},{name:'Σνακ πρωί',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Dark Choc Oat Bites',g:75},{n:'Πορτοκάλι',g:180}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:200},{n:'Κινόα (βρ.)',g:200},{n:'Κολοκυθάκια',g:150},{n:'Ελαιόλαδο',g:12}]},{name:'Σνακ απόγευμα',foods:[{n:'Cottage cheese',g:160},{n:'Μούρα',g:120},{n:'Αμύγδαλα',g:20}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:180},{n:'Ρύζι καστανό (βρ.)',g:220},{n:'Τομάτες',g:120},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Γκρανόλα χωρίς ζάχαρη',g:60},{n:'Γάλα πλήρες',g:250},{n:'Κεράσια',g:140},{n:'Καρύδια',g:15}]},{name:'Σνακ πρωί',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:80},{n:'Ρυζογκοφρέτες',g:35},{n:'Τομάτα',g:100}]},{name:'Μεσημεριανό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:200},{n:'Μακαρόνια (βρ.)',g:200},{n:'Μπρόκολο',g:150},{n:'Τυρί φέτα',g:20},{n:'Ελαιόλαδο',g:12}]},{name:'Σνακ απόγευμα',foods:[{n:'Γιαούρτι 2%',g:220},{n:'Μπανάνα',g:130},{n:'Αμύγδαλα',g:20}]},{name:'Βραδινό',foods:[{n:'Γαρίδες (βραστές)',g:220},{n:'Ρύζι άσπρο (βρ.)',g:220},{n:'Σπανάκι',g:100},{n:'Ελιές',g:20},{n:'Ελαιόλαδο',g:10}]}],
[{name:'Πρωινό',foods:[{n:'Αυγά (ολόκληρα)',g:140},{n:'Ψωμί σίκαλης',g:90},{n:'Αβοκάντο',g:50},{n:'Μήλο',g:160}]},{name:'Σνακ πρωί',foods:[{n:'Γιαούρτι 2%',g:200},{n:'Energy Bites (FYH)',g:70},{n:'Μπανάνα',g:120}]},{name:'Μεσημεριανό',foods:[{n:'Σολομός (ψητός)',g:200},{n:'Κριθαράκι (βρ.)',g:200},{n:'Σπαράγγια',g:140},{n:'Ελαιόλαδο',g:12}]},{name:'Σνακ απόγευμα',foods:[{n:'Cottage cheese',g:160},{n:'Φράουλες',g:120},{n:'Καρύδια',g:20}]},{name:'Βραδινό',foods:[{n:'Κοτόπουλο στήθος (ψητό)',g:180},{n:'Γλυκοπατάτα',g:240},{n:'Σπανάκι',g:120},{n:'Ελαιόλαδο',g:10}]}]
]
};
var MEAL_RECIPES=[
  // ═══ NORMAL DIET - MEDITERRANEAN ═══
  {id:'grilled_salmon_rice',name:'Σολομός Ψητός με Ρύζι & Σάλτσα',foods:[
    {n:'Σολομός (ψητός)',g:150},{n:'Ρύζι καστανό (βρ.)',g:80},{n:'Μπρόκολο',g:120},{n:'Σάλτσα λεμονιού',g:15},{n:'Ελαιόλαδο',g:8}
  ],kcal:555,macro:{p:38,f:33,c:28},tags:['Mediterranean','Ψάρι','Ω3','Υγιεινό']},

  {id:'chicken_lemon_vegetables',name:'Κοτόπουλο Λεμονάτο με Λαχανικά',foods:[
    {n:'Κοτόπουλο (στήθος)',g:150},{n:'Λεμόνι (χυμός)',g:20},{n:'Σπανάκι',g:100},{n:'Ντομάτα',g:100},{n:'Ελαιόλαδο',g:10}
  ],kcal:381,macro:{p:50,f:16,c:9},tags:['Ελληνικό','Κοτόπουλο','Ελαφρύ']},

  {id:'beef_roasted_vegetables',name:'Μοσχάρι Ψητό με Ρωστίδες Λαχανικών',foods:[
    {n:'Μοσχάρι (ψητό)',g:120},{n:'Καρότο',g:80},{n:'Πατάτα',g:100},{n:'Κρεμμύδι',g:40},{n:'Ελαιόλαδο',g:10}
  ],kcal:464,macro:{p:37,f:20,c:32},tags:['Comfort','Κρέας','Ψητό']},

  {id:'pasta_seafood',name:'Παστα Θαλασσινών με Δύο Σάλτσες',foods:[
    {n:'Ζυμαρικά ολικής',g:80},{n:'Γαρίδες',g:100},{n:'Μύδια',g:80},{n:'Ντομάτες (φρέσκες)',g:100},{n:'Ελαιόλαδο',g:12}
  ],kcal:391,macro:{p:39,f:15,c:27},tags:['Θαλασσινά','Ιταλική','Πολυθρεπτικό']},

  {id:'greek_salad_feta',name:'Ελληνική Σαλάτα με Φέτα & Ολίες',foods:[
    {n:'Ντομάτα',g:150},{n:'Αγγούρι',g:120},{n:'Φέτα',g:60},{n:'Ελιές',g:30},{n:'Ελαιόλαδο',g:15}
  ],kcal:372,macro:{p:11,f:31,c:14},tags:['Mediterranean','Σαλάτα','Χλωρίδα']},

  // ═══ MEDITERRANEAN - ΕΠΕΚΤΑΣΗ (περισσότερη ποικιλία για κανονική δίαιτα) ═══
  {id:'med_chicken_souvlaki_pita',name:'Κοτόπουλο Σουβλάκι με Πίτα & Τζατζίκι',foods:[
    {n:'Κοτόπουλο στήθος (ψητό)',g:150},{n:'Πίτα αραβική',g:60},{n:'Τζατζίκι',g:40},{n:'Τομάτες',g:80},{n:'Αγγούρι',g:60},{n:'Ελαιόλαδο',g:5}
  ],kcal:505,macro:{p:54,f:13,c:39},tags:['Mediterranean','Ελληνικό','Κοτόπουλο']},

  {id:'med_baked_cod_potato',name:'Μπακαλιάρος Πλακί με Πατάτες & Λαδολέμονο',foods:[
    {n:'Μπακαλιάρος (ψητός)',g:160},{n:'Πατάτες',g:180},{n:'Σκόρδο',g:5},{n:'Λεμόνι',g:15},{n:'Μαϊντανός (φρέσκος)',g:3},{n:'Ελαιόλαδο',g:10}
  ],kcal:426,macro:{p:41,f:12,c:39},tags:['Mediterranean','Ψάρι','Ελαφρύ']},

  {id:'med_gigantes_feta',name:'Γίγαντες Φούρνου με Φέτα & Ντομάτα',foods:[
    {n:'Γίγαντες (βρ.)',g:200},{n:'Τυρί φέτα',g:40},{n:'Τομάτες',g:80},{n:'Μαϊντανός (φρέσκος)',g:3},{n:'Ελαιόλαδο',g:10}
  ],kcal:447,macro:{p:23,f:19,c:48},tags:['Mediterranean','Όσπρια','Ελληνικό']},

  {id:'med_octopus_fava',name:'Χταπόδι με Φάβα & Λεμόνι',foods:[
    {n:'Χταπόδι (βρ.)',g:150},{n:'Φάβα',g:150},{n:'Λεμόνι',g:15},{n:'Μαϊντανός (φρέσκος)',g:3},{n:'Ελαιόλαδο',g:10}
  ],kcal:394,macro:{p:35,f:12,c:36},tags:['Mediterranean','Θαλασσινά','Ελληνικό']},

  {id:'med_orzo_shrimp',name:'Κριθαρότο με Γαρίδες & Ντομάτα',foods:[
    {n:'Κριθαράκι (βρ.)',g:180},{n:'Γαρίδες (βραστές)',g:120},{n:'Τομάτες',g:100},{n:'Σκόρδο',g:5},{n:'Βασιλικός (φρέσκος)',g:3},{n:'Ελαιόλαδο',g:8}
  ],kcal:500,macro:{p:41,f:10,c:61},tags:['Mediterranean','Θαλασσινά','Ζυμαρικά']},

  {id:'med_stuffed_peppers',name:'Πιπεριές Γεμιστές με Ρύζι & Φέτα',foods:[
    {n:'Πιπεριά κόκκινη',g:150},{n:'Ρύζι καστανό (βρ.)',g:120},{n:'Τυρί φέτα',g:40},{n:'Τομάτες',g:80},{n:'Δυόσμος/Μέντα',g:3},{n:'Ελαιόλαδο',g:10}
  ],kcal:403,macro:{p:11,f:20,c:46},tags:['Mediterranean','Λαχανικά','Ελληνικό']},

  // ═══ KETO / LOW-CARB (υψηλά λιπαρά, ελάχιστοι υδατάνθρακες) ═══
  {id:'keto_salmon_avocado',name:'Σολομός με Αβοκάντο & Σπαράγγια',foods:[
    {n:'Σολομός (ψητός)',g:120},{n:'Αβοκάντο',g:60},{n:'Σπαράγγια',g:150},{n:'Λεμόνι',g:10},{n:'Άνηθος (φρέσκος)',g:3},{n:'Ελαιόλαδο',g:8}
  ],kcal:448,macro:{p:31,f:33,c:12},tags:['Keto','LowCarb','Ψάρι','Ω3']},

  {id:'keto_chicken_halloumi',name:'Κοτόπουλο με Χαλούμι & Σαλάτα',foods:[
    {n:'Κοτόπουλο στήθος (ψητό)',g:120},{n:'Χαλλούμι (ψητό)',g:50},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:10}
  ],kcal:478,macro:{p:51,f:28,c:6},tags:['Keto','LowCarb','Κοτόπουλο','high_protein']},

  {id:'keto_beef_broccoli',name:'Μοσχάρι με Μπρόκολο & Σκόρδο',foods:[
    {n:'Βοδινό άπαχο (ψητό)',g:150},{n:'Μπρόκολο',g:150},{n:'Σκόρδο',g:5},{n:'Δεντρολίβανο (φρέσκο)',g:3},{n:'Ελαιόλαδο',g:14}
  ],kcal:492,macro:{p:47,f:27,c:12},tags:['Keto','LowCarb','Κρέας','high_protein']},

  {id:'keto_omelette_feta_avocado',name:'Ομελέτα με Φέτα, Σπανάκι & Αβοκάντο',foods:[
    {n:'Αυγά (ολόκληρα)',g:150},{n:'Τυρί φέτα',g:40},{n:'Σπανάκι',g:100},{n:'Αβοκάντο',g:60},{n:'Ελαιόλαδο',g:8}
  ],kcal:510,macro:{p:29,f:41,c:12},tags:['Keto','LowCarb','Αυγά','Πρωινό']},

  {id:'keto_pork_cauliflower',name:'Χοιρινό με Κουνουπίδι Πουρέ & Λεμόνι',foods:[
    {n:'Χοιρινό (μπριζόλα)',g:150},{n:'Κουνουπίδι',g:180},{n:'Λεμόνι',g:10},{n:'Δεντρολίβανο (φρέσκο)',g:3},{n:'Ελαιόλαδο',g:10}
  ],kcal:503,macro:{p:44,f:32,c:11},tags:['Keto','LowCarb','Κρέας']},

  {id:'keto_tuna_avocado_salad',name:'Σαλάτα Τόνου με Αβοκάντο & Ελιές',foods:[
    {n:'Τόνος (κονσέρβα)',g:120},{n:'Αβοκάντο',g:80},{n:'Μαρούλι',g:100},{n:'Ελιές',g:30},{n:'Ελαιόλαδο',g:8}
  ],kcal:387,macro:{p:34,f:25,c:12},tags:['Keto','LowCarb','Ψάρι','Σαλάτα']},

  // ═══ FYH SIGNATURE — βασισμένα στα ΠΡΑΓΜΑΤΙΚΑ πλάνα/μερίδες της ομάδας ═══
  // (Πηγή: athlete/1200-1400kcal/παιδικά/πελατειακά πλάνα — μερίδες & συνδυασμοί όπως χρησιμοποιούνται)
  {id:'fyh_chicken_quinoa_salad',name:'Κοτόπουλο με Κινόα & Σαλάτα Εποχής',foods:[
    {n:'Κοτόπουλο στήθος (ψητό)',g:120},{n:'Κινόα (βρ.)',g:100},{n:'Σαλάτα εποχής',g:150},{n:'Λεμόνι',g:10},{n:'Ελαιόλαδο',g:10}
  ],kcal:436,macro:{p:43,f:17,c:27},tags:['Mediterranean','Ελληνικό','Κοτόπουλο']},

  {id:'fyh_tuna_rice_salad',name:'Τόνος με Ρύζι Μπασμάτι & Σαλάτα',foods:[
    {n:'Τόνος (κονσέρβα)',g:120},{n:'Ρύζι άσπρο (βρ.)',g:120},{n:'Σαλάτα εποχής',g:150},{n:'Λεμόνι',g:10},{n:'Ελαιόλαδο',g:10}
  ],kcal:414,macro:{p:36,f:12,c:40},tags:['Mediterranean','Ψάρι']},

  {id:'fyh_beef_orzo_salad',name:'Μοσχάρι με Κριθαράκι & Σαλάτα',foods:[
    {n:'Μοσχάρι (ψητό)',g:120},{n:'Κριθαράκι (βρ.)',g:110},{n:'Σαλάτα εποχής',g:150},{n:'Ελαιόλαδο',g:8}
  ],kcal:512,macro:{p:41,f:19,c:39},tags:['Mediterranean','Κρέας']},

  {id:'fyh_salmon_sweetpotato_broccoli',name:'Σολομός με Γλυκοπατάτα & Μπρόκολο',foods:[
    {n:'Σολομός (ψητός)',g:120},{n:'Γλυκοπατάτα',g:150},{n:'Μπρόκολο',g:150},{n:'Λεμόνι',g:10},{n:'Ελαιόλαδο',g:8}
  ],kcal:501,macro:{p:33,f:24,c:41},tags:['Mediterranean','Ψάρι','Ω3']},

  {id:'fyh_shrimp_orzo_tomato',name:'Γαρίδες με Κριθαράκι & Ντομάτα',foods:[
    {n:'Γαρίδες (βραστές)',g:120},{n:'Κριθαράκι (βρ.)',g:110},{n:'Τομάτες',g:100},{n:'Σκόρδο',g:5},{n:'Ελαιόλαδο',g:8}
  ],kcal:389,macro:{p:36,f:10,c:40},tags:['Mediterranean','Θαλασσινά']},

  {id:'fyh_dakos',name:'Κρητικός Ντάκος με Φέτα & Ντομάτα',foods:[
    {n:'Τομάτες',g:150},{n:'Κρίθινο παξιμάδι',g:50},{n:'Τυρί φέτα',g:40},{n:'Ελιές',g:20},{n:'Βαλσάμικο ξίδι',g:10},{n:'Ελαιόλαδο',g:10}
  ],kcal:423,macro:{p:12,f:22,c:46},tags:['Mediterranean','Ελληνικό','Σαλάτα']},

  {id:'fyh_zucchini_eggs',name:'Κολοκυθάκια με Αυγά & Ψωμί Ολικής',foods:[
    {n:'Κολοκυθάκια',g:180},{n:'Αυγά (ολόκληρα)',g:120},{n:'Ψωμί ολικής άλεσης',g:40},{n:'Ελαιόλαδο',g:8}
  ],kcal:372,macro:{p:21,f:22,c:23},tags:['Vegetarian','Ελαφρύ']},

  {id:'fyh_couscous_feta_veg',name:'Κους Κους με Φέτα & Λαχανικά',foods:[
    {n:'Κους κους (βρ.)',g:150},{n:'Τυρί φέτα',g:40},{n:'Πιπεριά κόκκινη',g:100},{n:'Τομάτες',g:80},{n:'Δυόσμος/Μέντα',g:3},{n:'Ελαιόλαδο',g:8}
  ],kcal:391,macro:{p:13,f:17,c:47},tags:['Vegetarian','Μεσογειακό']},

  {id:'fyh_lentils_bread_salad',name:'Φακές με Ψωμί & Αγγουροντομάτα',foods:[
    {n:'Φακές',g:180},{n:'Ψωμί ολικής άλεσης',g:30},{n:'Τομάτες',g:80},{n:'Αγγούρι',g:80},{n:'Ελαιόλαδο',g:10}
  ],kcal:399,macro:{p:20,f:12,c:54},tags:['Vegan','Όσπρια']},

  {id:'fyh_chickpea_carrot',name:'Ρεβίθια με Καρότα & Ψωμί',foods:[
    {n:'Ρεβίθια',g:180},{n:'Καρότα',g:100},{n:'Ψωμί ολικής άλεσης',g:25},{n:'Σκόρδο',g:5},{n:'Κύμινο',g:3},{n:'Ελαιόλαδο',g:8}
  ],kcal:487,macro:{p:20,f:14,c:73},tags:['Vegan','Όσπρια']},

  {id:'fyh_turkey_pita_wrap',name:'Πίτα με Γαλοπούλα & Λαχανικά',foods:[
    {n:'Πίτα αραβική',g:50},{n:'Γαλοπούλα στήθος',g:60},{n:'Τυρί φέτα',g:15},{n:'Μαρούλι',g:60},{n:'Τομάτες',g:60},{n:'Ελαιόλαδο',g:5}
  ],kcal:318,macro:{p:26,f:10,c:32},tags:['Mediterranean','Κρέας','Ελαφρύ']},

  // ═══ VEGAN DIET ═══
  {id:'vegan_buddha_bowl',name:'Buddha Bowl - Κινόα, Νοτ, Λαχανικά',foods:[
    {n:'Κινόα (βρ.)',g:80},{n:'Ρεβίθια (βρ.)',g:100},{n:'Μπρόκολο',g:120},{n:'Καλάμι',g:80},{n:'Ελαιόλαδο',g:10}
  ],kcal:463,macro:{p:28,f:16,c:55},tags:['Vegan','HighFiber','Energizing']},

  {id:'vegan_lentil_curry',name:'Κάρι Λαχανικών με Ρύζι',foods:[
    {n:'Καρότο',g:100},{n:'Μπρόκολο',g:120},{n:'Κολοκυθάκι',g:80},{n:'Κοκος γάλα light',g:100},{n:'Ρύζι (βρ.)',g:70}
  ],kcal:236,macro:{p:7,f:5,c:43},tags:['Vegan','Curry','Ζεστό']},

  {id:'vegan_pasta_marinara',name:'Ζυμαρικά Marinara με Λαχανικά',foods:[
    {n:'Ζυμαρικά ολικής',g:80},{n:'Ντομάτες (σάλτσα)',g:120},{n:'Σκόρδο',g:10},{n:'Μανιτάρια',g:100},{n:'Ελαιόλαδο',g:10}
  ],kcal:263,macro:{p:10,f:11,c:35},tags:['Vegan','Ιταλική','Απλή']},

  {id:'vegan_tofu_stir_fry',name:'Tofu Stir-Fry με Σάλτσα Σόγιας',foods:[
    {n:'Tofu σκληρό',g:150},{n:'Μπρόκολο',g:120},{n:'Κόκκινη Πιπερια',g:80},{n:'Σάλτσα σόγιας',g:15},{n:'Ελαιόλαδο',g:8}
  ],kcal:259,macro:{p:17,f:16,c:18},tags:['Vegan','Ασιατική','Γρήγορη']},

  // ═══ VEGETARIAN ═══
  {id:'veg_egg_scramble',name:'Ωμελέτα με Σπανάκι & Φέτα',foods:[
    {n:'Αυγά (ολόκληρα)',g:120},{n:'Σπανάκι',g:100},{n:'Φέτα',g:40},{n:'Ντομάτα',g:60},{n:'Ελαιόλαδο',g:8}
  ],kcal:382,macro:{p:25,f:29,c:9},tags:['Vegetarian','Πρωινό','Γρήγορη']},

  {id:'veg_chickpea_salad',name:'Σαλάτα Ρεβίθια με Ντομάτες & Κολιανδρο',foods:[
    {n:'Ρεβίθια (βρ.)',g:150},{n:'Ντομάτα',g:100},{n:'Αγγούρι',g:80},{n:'Κολιάνδρο',g:10},{n:'Ελαιόλαδο',g:12}
  ],kcal:383,macro:{p:15,f:16,c:48},tags:['Vegetarian','Σαλάτα','Φρέσκια']},

  // ═══ BODYBUILDING CLEAN EATING - LEAN PROTEINS ═══
  // --- ΚΟΤΟΠΟΥΛΟ (7 recipes) ---
  {id:'bb_chicken_white_rice_broccoli',name:'Κοτόπουλο Λευκό Ρύζι & Μπρόκολο',foods:[
    {n:'Κοτόπουλο (στήθος)',g:220},{n:'Λευκό ρύζι (βρ.)',g:180},{n:'Μπρόκολο',g:150},{n:'Ελαιόλαδο',g:5}
  ],kcal:692,macro:{p:77,f:14,c:60},tags:['bodybuilding_clean','chicken','high_protein','lean_meat','white_rice']},

  {id:'bb_chicken_brown_rice_salad',name:'Κοτόπουλο Καστανό Ρύζι & Σαλάτα',foods:[
    {n:'Κοτόπουλο (στήθος)',g:220},{n:'Brown rice (βρ.)',g:160},{n:'Σαλάτα μικτή',g:150},{n:'Ελαιόλαδο',g:5}
  ],kcal:631,macro:{p:74,f:15,c:45},tags:['bodybuilding_clean','chicken','high_protein','lean_meat','brown_rice']},

  {id:'bb_chicken_potato_veggies',name:'Κοτόπουλο Ψητές Πατάτες & Λαχανικά',foods:[
    {n:'Κοτόπουλο (στήθος)',g:220},{n:'Πατάτες (ψητές)',g:220},{n:'Καρότο',g:80},{n:'Ελαιόλαδο',g:5}
  ],kcal:631,macro:{p:73,f:13,c:52},tags:['bodybuilding_clean','chicken','high_protein','lean_meat','potato']},

  {id:'bb_chicken_quinoa_spinach',name:'Κοτόπουλο Κινόα & Σπανάκι',foods:[
    {n:'Κοτόπουλο (στήθος)',g:220},{n:'Κινόα (βρ.)',g:160},{n:'Σπανάκι',g:120},{n:'Ελαιόλαδο',g:5}
  ],kcal:627,macro:{p:78,f:16,c:38},tags:['bodybuilding_clean','chicken','high_protein','lean_meat','quinoa']},

  {id:'bb_chicken_orzo_tomato',name:'Κοτόπουλο Κριθαράκι & Ντομάτα',foods:[
    {n:'Κοτόπουλο (στήθος)',g:220},{n:'Κριθαράκι (βρ.)',g:180},{n:'Ντομάτα',g:150},{n:'Ελαιόλαδο',g:5}
  ],kcal:719,macro:{p:80,f:15,c:62},tags:['bodybuilding_clean','chicken','high_protein','lean_meat','orzo']},

  {id:'bb_chicken_sweet_potato_rare',name:'Κοτόπουλο Γλυκοπατάτα (Σπάνια)',foods:[
    {n:'Κοτόπουλο (στήθος)',g:220},{n:'Γλυκοπατάτα (βρ.)',g:200},{n:'Λαχανικά',g:100},{n:'Ελαιόλαδο',g:5}
  ],kcal:614,macro:{p:73,f:13,c:46},tags:['bodybuilding_clean','chicken','high_protein','sweet_potato','rare']},

  {id:'bb_chicken_black_rice_rare',name:'Κοτόπουλο Μαύρο Ρύζι (Σπάνια)',foods:[
    {n:'Κοτόπουλο (στήθος)',g:220},{n:'Black rice (βρ.)',g:160},{n:'Σαλάτα',g:150},{n:'Ελαιόλαδο',g:5}
  ],kcal:631,macro:{p:74,f:15,c:46},tags:['bodybuilding_clean','chicken','high_protein','black_rice','rare']},

  // --- ΓΑΛΟΠΟΥΛΑ (4 recipes) ---
  {id:'bb_turkey_white_rice_carrots',name:'Γαλοπούλα Λευκό Ρύζι & Καρότα',foods:[
    {n:'Γαλοπούλα (φιλέ)',g:230},{n:'Λευκό ρύζι (βρ.)',g:180},{n:'Καρότο',g:100},{n:'Ελαιόλαδο',g:5}
  ],kcal:630,macro:{p:74,f:8,c:60},tags:['bodybuilding_clean','turkey','high_protein','lean_meat','white_rice']},

  {id:'bb_turkey_potato_zucchini',name:'Γαλοπούλα Πατάτα & Κολοκυθάκι',foods:[
    {n:'Γαλοπούλα (φιλέ)',g:230},{n:'Πατάτες (βρ.)',g:220},{n:'Κολοκυθάκι',g:100},{n:'Ελαιόλαδο',g:5}
  ],kcal:563,macro:{p:75,f:8,c:47},tags:['bodybuilding_clean','turkey','high_protein','lean_meat','potato']},

  {id:'bb_turkey_quinoa_broccoli',name:'Γαλοπούλα Κινόα & Μπρόκολο',foods:[
    {n:'Γαλοπούλα (φιλέ)',g:230},{n:'Κινόα (βρ.)',g:160},{n:'Μπρόκολο',g:130},{n:'Ελαιόλαδο',g:5}
  ],kcal:591,macro:{p:79,f:11,c:42},tags:['bodybuilding_clean','turkey','high_protein','quinoa']},

  {id:'bb_turkey_brown_rice_veggies',name:'Γαλοπούλα Brown Rice & Μικτά Λαχανικά',foods:[
    {n:'Γαλοπούλα (φιλέ)',g:230},{n:'Brown rice (βρ.)',g:160},{n:'Μικτά λαχανικά',g:120},{n:'Ελαιόλαδο',g:5}
  ],kcal:594,macro:{p:76,f:9,c:47},tags:['bodybuilding_clean','turkey','high_protein','brown_rice']},

  // --- ΨΑΡΙ (6 recipes) ---
  {id:'bb_fish_white_rice_greens',name:'Κοντά Λευκό Ρύζι & Χόρτα',foods:[
    {n:'Κοντά (ψητή)',g:200},{n:'Λευκό ρύζι (βρ.)',g:180},{n:'Μαρούλι/Σαλάτα',g:150},{n:'Λεμόνι',g:10},{n:'Ελαιόλαδο',g:5}
  ],kcal:566,macro:{p:59,f:12,c:56},tags:['bodybuilding_clean','fish','high_protein','lean_meat','white_rice','omega3']},

  {id:'bb_fish_potato_asparagus',name:'Φιλέτο Ψάρι Πατάτες & Σπαράγγια',foods:[
    {n:'Φιλέτο ψάρι λευκό',g:200},{n:'Πατάτες (βρ.)',g:220},{n:'Σπαράγγια',g:120},{n:'Ελαιόλαδο',g:5}
  ],kcal:508,macro:{p:53,f:10,c:49},tags:['bodybuilding_clean','fish','high_protein','lean_meat','potato']},

  {id:'bb_seabass_quinoa_zucchini',name:'Λαβράκι Κινόα & Κολοκυθάκι',foods:[
    {n:'Λαβράκι (ψητό)',g:200},{n:'Κινόα (βρ.)',g:160},{n:'Κολοκυθάκι',g:130},{n:'Ελαιόλαδο',g:5}
  ],kcal:506,macro:{p:54,f:13,c:38},tags:['bodybuilding_clean','fish','high_protein','quinoa','omega3']},

  {id:'bb_bream_brown_rice_tomato',name:'Τσιπούρα Brown Rice & Ντομάτα',foods:[
    {n:'Τσιπούρα (ψητή)',g:200},{n:'Brown rice (βρ.)',g:160},{n:'Ντομάτα',g:150},{n:'Ελαιόλαδο',g:5}
  ],kcal:530,macro:{p:58,f:13,c:46},tags:['bodybuilding_clean','fish','high_protein','brown_rice']},

  {id:'bb_salmon_black_rice_rare',name:'Σολομός Μαύρο Ρύζι (Σπάνια)',foods:[
    {n:'Σολομός (ψητός)',g:180},{n:'Black rice (βρ.)',g:160},{n:'Σαλάτα',g:150},{n:'Ελαιόλαδο',g:5}
  ],kcal:639,macro:{p:45,f:30,c:46},tags:['bodybuilding_clean','fish','high_protein','black_rice','omega3','rare']},

  {id:'bb_haddock_sweet_potato_rare',name:'Μέρλουσας Γλυκοπατάτα (Σπάνια)',foods:[
    {n:'Μέρλουσας (ψητή)',g:210},{n:'Γλυκοπατάτα (βρ.)',g:200},{n:'Λαχανικά',g:100},{n:'Ελαιόλαδο',g:5}
  ],kcal:472,macro:{p:53,f:7,c:46},tags:['bodybuilding_clean','fish','high_protein','sweet_potato','rare']},

  // --- ΑΥΓΑ (3 recipes) ---
  {id:'bb_egg_whites_oats_veggies',name:'Ασπράδια Αυγών Οβελίσκοι & Λαχανικά',foods:[
    {n:'Ασπράδια αυγών',g:300},{n:'Οβελίσκοι (βρ.)',g:160},{n:'Ντομάτα',g:100},{n:'Ελαιόλαδο',g:5}
  ],kcal:332,macro:{p:38,f:8,c:25},tags:['bodybuilding_clean','eggs','high_protein','lean_meat','oats']},

  {id:'bb_whole_eggs_white_rice_spinach',name:'Αυγά (Ολόκληρα) Λευκό Ρύζι & Σπανάκι',foods:[
    {n:'Αυγά (ολόκληρα)',g:180},{n:'Λευκό ρύζι (βρ.)',g:180},{n:'Σπανάκι',g:120},{n:'Ελαιόλαδο',g:5}
  ],kcal:563,macro:{p:31,f:24,c:57},tags:['bodybuilding_clean','eggs','high_protein','white_rice']},

  {id:'bb_eggs_quinoa_tomato',name:'Αυγά Κινόα & Ντομάτα',foods:[
    {n:'Αυγά (ολόκληρα)',g:180},{n:'Κινόα (βρ.)',g:160},{n:'Ντομάτα',g:150},{n:'Ελαιόλαδο',g:5}
  ],kcal:521,macro:{p:31,f:26,c:41},tags:['bodybuilding_clean','eggs','high_protein','quinoa']},

  // --- ΚΟΚΚΙΝΟ ΚΡΕΑΣ - MINIMAL (2 recipes) ---
  {id:'bb_lamb_lean_orzo_veggies',name:'Αρνί (Lean) Κριθαράκι & Λαχανικά',foods:[
    {n:'Αρνί (lean cut)',g:180},{n:'Κριθαράκι (βρ.)',g:180},{n:'Ντομάτα',g:150},{n:'Ελαιόλαδο',g:5}
  ],kcal:820,macro:{p:58,f:37,c:62},tags:['bodybuilding_clean','red_meat','high_protein','lamb','orzo','rare_2x_week']},

  {id:'bb_beef_ground_rice_tomato',name:'Κιμάς Βοδινό (Lean) Ρύζι & Ντομάτα',foods:[
    {n:'Κιμάς βοδινό lean',g:160},{n:'Λευκό ρύζι (βρ.)',g:180},{n:'Ντομάτα',g:150},{n:'Ελαιόλαδο',g:5}
  ],kcal:587,macro:{p:49,f:17,c:56},tags:['bodybuilding_clean','red_meat','high_protein','beef','white_rice','rare_2x_week']},

  // --- LEGUMES (1 recipe) ---
  {id:'bb_lentils_rice_veggies',name:'Φακές Ρύζι & Λαχανικά',foods:[
    {n:'Φακές (βρ.)',g:180},{n:'Λευκό ρύζι (βρ.)',g:160},{n:'Ντομάτα',g:120},{n:'Καρότο',g:80},{n:'Ελαιόλαδο',g:5}
  ],kcal:515,macro:{p:22,f:7,c:94},tags:['bodybuilding_clean','legume','vegetarian','vegan','Vegan','high_carb']},

  // --- VEGAN PLANT PROTEIN (4 recipes) ---
  {id:'bb_tofu_beans_beetroot',name:'Tofu Φασόλια & Παντζάρι',foods:[
    {n:'Tofu (φυσικό)',g:200},{n:'Φασόλια',g:120},{n:'Παντζάρι (βραστό)',g:100},{n:'Πιπεριά κόκκινη',g:100},{n:'Ελαιόλαδο',g:8}
  ],kcal:449,macro:{p:29,f:19,c:49},tags:['bodybuilding_clean','vegan','Vegan','high_protein','tofu','legume']},

  {id:'bb_beyond_beef_wholewheat_pasta',name:'Φυτικός Κιμάς Ολικής Ζυμαρικά & Ντομάτα',foods:[
    {n:'Beyond Beef (φυτικός κιμάς)',g:120},{n:'Σπαγγέτι ολικής (βρ.)',g:120},{n:'Ντομάτα',g:150},{n:'Σκόρδο',g:8},{n:'Ελαιόλαδο',g:5}
  ],kcal:467,macro:{p:27,f:21,c:45},tags:['bodybuilding_clean','vegan','Vegan','high_protein','plant_protein','pasta']},

  {id:'bb_beyond_beef_sweet_potato_greens',name:'Φυτικός Κιμάς Γλυκοπατάτα & Λαχανικά',foods:[
    {n:'Beyond Beef (φυτικός κιμάς)',g:110},{n:'Γλυκοπατάτα (βρ.)',g:200},{n:'Μικτά λαχανικά',g:120},{n:'Ελαιόλαδο',g:5}
  ],kcal:474,macro:{p:23,f:19,c:53},tags:['bodybuilding_clean','vegan','Vegan','high_protein','plant_protein','sweet_potato']},

  {id:'bb_vegan_oat_chia_breakfast',name:'Βρώμη με Chia & Φυστικοβούτυρο (Vegan)',foods:[
    {n:'Βρώμη (ωμή)',g:45},{n:'Γάλα σόγιας',g:200},{n:'Chia seeds',g:10},{n:'Φυστικοβούτυρο',g:15},{n:'Μπανάνα',g:80}
  ],kcal:491,macro:{p:21,f:18,c:68},tags:['bodybuilding_clean','vegan','Vegan','breakfast','high_carb']},

  // --- EXTRA VARIATIONS (2 recipes) ---
  {id:'bb_chicken_sweet_potato_alt',name:'Κοτόπουλο Γλυκοπατάτα Alternative (Σπάνια)',foods:[
    {n:'Κοτόπουλο (στήθος)',g:220},{n:'Γλυκοπατάτα (ψητή)',g:200},{n:'Ζούχινι',g:120},{n:'Ελαιόλαδο',g:5}
  ],kcal:600,macro:{p:73,f:13,c:44},tags:['bodybuilding_clean','chicken','high_protein','sweet_potato','rare']},

  {id:'bb_turkey_white_rice_alt',name:'Γαλοπούλα Λευκό Ρύζι Alternative',foods:[
    {n:'Γαλοπούλα (φιλέ)',g:230},{n:'Λευκό ρύζι (βρ.)',g:180},{n:'Σπαράγγια',g:120},{n:'Ελαιόλαδο',g:5}
  ],kcal:613,macro:{p:76,f:8,c:55},tags:['bodybuilding_clean','turkey','high_protein','white_rice']},

  // ═══ KETOGENIC ═══
  {id:'keto_steak_butter',name:'Μπριζόλα με Αβοκάντο & Σπανάκι',foods:[
    {n:'Μοσχάρι (ψητό)',g:200},{n:'Αβοκάντο',g:80},{n:'Σπανάκι',g:120},{n:'Βούτυρο',g:12},{n:'Αλάτι & μπαχαρικά',g:5}
  ],kcal:642,macro:{p:61,f:38,c:12},tags:['Keto','Κρέας','LowCarb']},

  {id:'keto_salmon_avocado_lemon',name:'Σολομός με Αβοκάντο & Σάλτσα Χυμό Λεμονιού',foods:[
    {n:'Σολομός (ψητός)',g:180},{n:'Αβοκάντο',g:100},{n:'Λεμόνι (χυμός)',g:15},{n:'Αλάτι',g:3},{n:'Πιπέρι',g:2}
  ],kcal:534,macro:{p:42,f:38,c:10},tags:['Keto','Ψάρι','Ω3']},

  {id:'keto_eggs_cheese',name:'Αυγά με Cheddar & Σπανάκι',foods:[
    {n:'Αυγά (ολόκληρα)',g:150},{n:'Τυρί Cheddar',g:50},{n:'Σπανάκι',g:150},{n:'Βούτυρο',g:10}
  ],kcal:522,macro:{p:36,f:40,c:8},tags:['Keto','Πρωινό','HighFat']},

  {id:'keto_zucchini_beef',name:'Κολοκυθάκια με Κιμάς & Τυρί',foods:[
    {n:'Κολοκυθάκι',g:200},{n:'Κιμάς (ψητός)',g:120},{n:'Τυρί mozzarella',g:40},{n:'Ελαιόλαδο',g:10}
  ],kcal:492,macro:{p:41,f:32,c:7},tags:['Keto','Άνετο','LowCarb']},

  {id:'keto_cauliflower_rice',name:'Κουνουπίδι-Ρύζι με Γαρίδες',foods:[
    {n:'Κουνουπίδι',g:200},{n:'Γαρίδες',g:150},{n:'Σάλτσα σόγιας',g:10},{n:'Ελαιόλαδο',g:12}
  ],kcal:311,macro:{p:40,f:13,c:11},tags:['Keto','Θαλασσινά','LowCarb']},

  // ═══ QUICK & EASY ═══
  {id:'quick_chicken_rice',name:'Κοτόπουλο Ψητό + Ρύζι (Express)',foods:[
    {n:'Κοτόπουλο (στήθος)',g:150},{n:'Ρύζι (ψάχνη)',g:80},{n:'Καρότο',g:80},{n:'Σάλτσα',g:20}
  ],kcal:396,macro:{p:50,f:6,c:33},tags:['Γρήγορη','Έξπρες','Κοτόπουλο']},

  // ═══ ΨΑΡΙΑ - ΠΕΤΡΕΤΖΙΚΗΣ STYLE (2-3 φορές/εβδ. = 4-5 σύνταγες) ═══
  {id:'fsh_lemon_grill',name:'Ψάρι Σχάρα με Λεμόνι & Ρύζι',foods:[
    {n:'Ψάρι λευκό',g:180},{n:'Λεμόνι (χυμός)',g:20},{n:'Ρύζι καστανό (βρ.)',g:80},{n:'Σαλάτα χορτατοί',g:150},{n:'Ελαιόλαδο',g:8}
  ],kcal:424,macro:{p:45,f:14,c:27},tags:['Ψάρι','Σχάρα','Γρήγορη','Κυπριακή']},

  {id:'fsh_tomato_rice',name:'Ψάρι Φούρνο με Ντομάτες & Ρύζι',foods:[
    {n:'Ψάρι λευκό',g:180},{n:'Ντομάτες (φρέσκες)',g:150},{n:'Ρύζι άσπρο (βρ.)',g:70},{n:'Κρεμμύδι',g:40},{n:'Ελαιόλαδο',g:10}
  ],kcal:446,macro:{p:45,f:15,c:29},tags:['Ψάρι','Φούρνο','Ντομάτες','Εύκολη']},

  {id:'salmon_lemon',name:'Σολομός Σχάρα με Λεμόνι & Πατάτες',foods:[
    {n:'Σολομός (ψητός)',g:160},{n:'Πατάτες (βρ.)',g:100},{n:'Λεμόνι (χυμός)',g:15},{n:'Μπρόκολο',g:100},{n:'Ελαιόλαδο',g:10}
  ],kcal:542,macro:{p:40,f:31,c:28},tags:['Σολομός','Ω3','Σχάρα']},

  {id:'shrimp_garlic',name:'Γαρίδες με Σκόρδο & Κρασί',foods:[
    {n:'Γαρίδες (βραστές)',g:180},{n:'Σκόρδο',g:10},{n:'Κριθαράκι (βρ.)',g:80},{n:'Αγγούρι',g:120},{n:'Λευκό κρασί',g:50}
  ],kcal:380,macro:{p:49,f:1,c:34},tags:['Γαρίδες','Γρήγορη','Κρασάτη']},

  {id:'mussels_wine',name:'Μύδια με Κρασί & Κριθαράκι',foods:[
    {n:'Μύδια (ψάχνη)',g:200},{n:'Κριθαράκι (βρ.)',g:75},{n:'Λευκό κρασί',g:60},{n:'Σκόρδο',g:8},{n:'Ντομάτα',g:80}
  ],kcal:366,macro:{p:29,f:5,c:38},tags:['Θαλασσινά','Κρασάτη','Ειδική']},

  // ═══ ΚΟΤΟΠΟΥΛΟ - ΠΕΤΡΕΤΖΙΚΗΣ STYLE ═══
  {id:'chk_lemon_rice',name:'Κοτόπουλο Λεμονάτο με Ρύζι',foods:[
    {n:'Κοτόπουλο (στήθος)',g:160},{n:'Ρύζι (ψάχνη)',g:80},{n:'Λεμόνι (χυμός)',g:20},{n:'Σπανάκι ωμό',g:100},{n:'Ελαιόλαδο',g:8}
  ],kcal:466,macro:{p:55,f:14,c:27},tags:['Κοτόπουλο','Κλασική','Γρήγορη']},

  {id:'chk_mushroom',name:'Κοτόπουλο με Μανιτάρια & Κρασί',foods:[
    {n:'Κοτόπουλο (στήθος)',g:160},{n:'Μανιτάρια (ψητά)',g:150},{n:'Κριθαράκι (βρ.)',g:75},{n:'Λευκό κρασί',g:40},{n:'Ελαιόλαδο',g:10}
  ],kcal:537,macro:{p:59,f:17,c:29},tags:['Κοτόπουλο','Κρεμώδης','Έξοχη']},

  {id:'chk_pesto',name:'Κοτόπουλο Pesto με Πατάτες Ψητές',foods:[
    {n:'Κοτόπουλο (στήθος)',g:160},{n:'Πατάτες (ψητές)',g:120},{n:'Σάλτσα Pesto',g:20},{n:'Ντοματάκια Cherry',g:100},{n:'Ελαιόλαδο',g:5}
  ],kcal:491,macro:{p:54,f:17,c:29},tags:['Κοτόπουλο','Pesto','Γρήγορη']},

  {id:'chk_curry_rice',name:'Κοτόπουλο Κάρι με Ρύζι',foods:[
    {n:'Κοτόπουλο (στήθος)',g:160},{n:'Ρύζι καστανό (βρ.)',g:80},{n:'Καρότο (ψητό)',g:100},{n:'Σάλτσα κάρι light',g:30},{n:'Ελαιόλαδο',g:8}
  ],kcal:495,macro:{p:53,f:16,c:32},tags:['Κοτόπουλο','Κάρι','Ασιατική']},

  {id:'chk_feta_tomato',name:'Κοτόπουλο με Φέτα & Ντομάτες',foods:[
    {n:'Κοτόπουλο (στήθος)',g:160},{n:'Φέτα',g:50},{n:'Ντομάτες (φρέσκες)',g:150},{n:'Ρύζι (ψάχνη)',g:75},{n:'Ελαιόλαδο',g:10}
  ],kcal:609,macro:{p:60,f:27,c:29},tags:['Κοτόπουλο','Φέτα','Κλασική']},

  {id:'chk_souvlaki',name:'Κοτόπουλο Souvlaki με Ψωμί & Σαλάτα',foods:[
    {n:'Κοτόπουλο (στήθος)',g:160},{n:'Ψωμί ολικής',g:70},{n:'Σαλάτα χορτ.',g:200},{n:'Τζατζίκι',g:40},{n:'Κρεμμύδι',g:40}
  ],kcal:519,macro:{p:60,f:11,c:41},tags:['Κοτόπουλο','Souvlaki','Street Food']},

  {id:'chk_teriyaki',name:'Κοτόπουλο Teriyaki με Ρύζι & Λαχανικά',foods:[
    {n:'Κοτόπουλο (στήθος)',g:160},{n:'Ρύζι (ψάχνη)',g:80},{n:'Μπρόκολο (ψητό)',g:120},{n:'Σάλτσα teriyaki',g:25},{n:'Ελαιόλαδο',g:5}
  ],kcal:483,macro:{p:56,f:12,c:36},tags:['Κοτόπουλο','Ασιατική','Γρήγορη']},

  {id:'chk_spinach_feta',name:'Κοτόπουλο με Σπανάκι & Φέτα (Σπιράλι)',foods:[
    {n:'Κοτόπουλο (στήθος)',g:160},{n:'Σπανάκι (ψητό)',g:150},{n:'Φέτα',g:50},{n:'Κριθαράκι (βρ.)',g:75},{n:'Ελαιόλαδο',g:10}
  ],kcal:637,macro:{p:65,f:28,c:31},tags:['Κοτόπουλο','Σπανάκι','Ξιφιάσιμο']},

  {id:'chk_honey_mustard',name:'Κοτόπουλο με Μέλι & Μουστάρδα',foods:[
    {n:'Κοτόπουλο (στήθος)',g:160},{n:'Πατάτες (ψητές)',g:120},{n:'Μέλι',g:10},{n:'Μουστάρδα',g:15},{n:'Σαλάτα',g:150}
  ],kcal:436,macro:{p:54,f:7,c:38},tags:['Κοτόπουλο','Γλυκόξινη','Εύκολη']},

  {id:'chk_garlic_lemon',name:'Κοτόπουλο με Σκόρδο & Λεμόνι (Σκορδάτο)',foods:[
    {n:'Κοτόπουλο (στήθος)',g:160},{n:'Σκόρδο',g:15},{n:'Ρύζι (ψάχνη)',g:80},{n:'Λεμόνι (χυμός)',g:15},{n:'Σπανάκι',g:100}
  ],kcal:417,macro:{p:55,f:7,c:32},tags:['Κοτόπουλο','Σκορδάτη','Αρωματική']},

  // ═══ ΑΡΝΙ - ΠΕΤΡΕΤΖΙΚΗΣ STYLE ═══
  {id:'lamb_lentils',name:'Αρνί με Φακές Κόκκινες',foods:[
    {n:'Αρνί (ψητό)',g:140},{n:'Φακές κόκκινες (βρ.)',g:100},{n:'Καρότο (ψητό)',g:80},{n:'Σπανάκι',g:100},{n:'Ελαιόλαδο',g:10}
  ],kcal:621,macro:{p:48,f:34,c:32},tags:['Αρνί','Φακές','Θρεπτική']},

  {id:'lamb_souvlaki',name:'Αρνί Souvlaki με Πατάτες',foods:[
    {n:'Αρνί (ψητό)',g:150},{n:'Πατάτες (ψητές)',g:120},{n:'Σαλάτα',g:150},{n:'Τζατζίκι',g:40},{n:'Κρεμμύδι',g:40}
  ],kcal:564,macro:{p:44,f:27,c:34},tags:['Αρνί','Souvlaki','Κλασική']},

  {id:'lamb_tomato',name:'Αρνί Κοκκινιστό με Ρύζι',foods:[
    {n:'Αρνί (ψητό)',g:140},{n:'Ρύζι (ψάχνη)',g:80},{n:'Ντομάτες (σάλτσα)',g:120},{n:'Κρεμμύδι',g:50},{n:'Ελαιόλαδο',g:12}
  ],kcal:630,macro:{p:40,f:36,c:35},tags:['Αρνί','Κοκκινιστό','Comfort']},

  {id:'lamb_mushroom_wine',name:'Αρνί με Μανιτάρια & Κρασί',foods:[
    {n:'Αρνί (ψητό)',g:140},{n:'Μανιτάρια (ψητά)',g:150},{n:'Κριθαράκι (βρ.)',g:75},{n:'Λευκό κρασί',g:50},{n:'Ελαιόλαδο',g:10}
  ],kcal:642,macro:{p:45,f:34,c:30},tags:['Αρνί','Κρεμώδης','Ιδιαίτερη']},

  {id:'lamb_keftedes',name:'Κεφτεδάκια Αρνιού με Ρύζι & Σαλάτα',foods:[
    {n:'Αρνί κιμάς (ψητό)',g:150},{n:'Ρύζι (ψάχνη)',g:75},{n:'Σαλάτα ντοματ.',g:150},{n:'Σάλτσα ντομάτας',g:30},{n:'Ελαιόλαδο',g:8}
  ],kcal:592,macro:{p:42,f:33,c:28},tags:['Αρνί','Keftedes','Κλασική']},

  // ═══ ΧΟΙΡΙΝΟ - ΠΕΤΡΕΤΖΙΚΗΣ STYLE ═══
  {id:'pork_souvlaki',name:'Χοιρινό Souvlaki με Ψωμί & Σαλάτα',foods:[
    {n:'Χοιρινό (ψητό)',g:160},{n:'Ψωμί ολικής',g:70},{n:'Σαλάτα χορτ.',g:150},{n:'Τζατζίκι',g:40},{n:'Κρεμμύδι',g:40}
  ],kcal:633,macro:{p:53,f:27,c:39},tags:['Χοιρινό','Souvlaki','Street Food']},

  {id:'pork_mushroom',name:'Χοιρινό με Μανιτάρια & Κρασί',foods:[
    {n:'Χοιρινό (ψητό)',g:160},{n:'Μανιτάρια (ψητά)',g:140},{n:'Κριθαράκι (βρ.)',g:75},{n:'Λευκό κρασί',g:40},{n:'Ελαιόλαδο',g:10}
  ],kcal:658,macro:{p:52,f:33,c:29},tags:['Χοιρινό','Κρεμώδης','Γεύση']},

  {id:'pork_mustard',name:'Χοιρινό με Μουστάρδα & Πατάτες',foods:[
    {n:'Χοιρινό (ψητό)',g:160},{n:'Πατάτες (ψητές)',g:120},{n:'Μουστάρδα',g:15},{n:'Σαλάτα',g:150},{n:'Ελαιόλαδο',g:8}
  ],kcal:599,macro:{p:48,f:31,c:30},tags:['Χοιρινό','Μουστάρδα','Απλή']},

  {id:'pork_tomato_rice',name:'Χοιρινό Κοκκινιστό με Ρύζι',foods:[
    {n:'Χοιρινό (ψητό)',g:150},{n:'Ρύζι (ψάχνη)',g:80},{n:'Ντομάτες (φρέσκες)',g:150},{n:'Κρεμμύδι',g:50},{n:'Ελαιόλαδο',g:10}
  ],kcal:602,macro:{p:44,f:32,c:33},tags:['Χοιρινό','Κοκκινιστό','Comfort']},

  // ═══ ΌΣΠΡΙΑ & ΕΛΑΦΡΥ - ΠΕΤΡΕΤΖΙΚΗΣ STYLE ═══
  {id:'lentil_rice',name:'Φακές με Λαχανικά & Ελαιόλαδο',foods:[
    {n:'Φακές (βρ.)',g:170},{n:'Σαλάτα χορτ.',g:150},{n:'Μπρόκολο (ψητό)',g:100},{n:'Κρεμμύδι',g:50},{n:'Ελαιόλαδο',g:10}
  ],kcal:367,macro:{p:20,f:11,c:51},tags:['Φακές','Χορτοφ.','Οικονομική']},

  {id:'chickpea_salad',name:'Σαλάτα Ρεβίθια με Ντομάτες',foods:[
    {n:'Ρεβίθια (βρ.)',g:150},{n:'Ντομάτα',g:120},{n:'Αγγούρι',g:100},{n:'Ελιές',g:30},{n:'Ελαιόλαδο',g:15}
  ],kcal:451,macro:{p:16,f:22,c:51},tags:['Ρεβίθια','Σαλάτα','Δροσερή']},

  {id:'lentil_tomato',name:'Κριθαράκι Κοκκινιστό με Λαχανικά',foods:[
    {n:'Κριθαράκι (βρ.)',g:80},{n:'Ντομάτες (σάλτσα)',g:120},{n:'Μελιτζάνα',g:100},{n:'Κρεμμύδι',g:50},{n:'Ελαιόλαδο',g:12}
  ],kcal:316,macro:{p:8,f:13,c:44},tags:['Κριθαράκι','Κοκκινιστές','Ζεστή']},

  {id:'beans_tomato',name:'Κριθαράκι Γιουβέτσι με Ντομάτες',foods:[
    {n:'Κριθαράκι (βρ.)',g:85},{n:'Ντομάτες (σάλτσα)',g:120},{n:'Κολοκυθάκι',g:100},{n:'Κρεμμύδι',g:50},{n:'Ελαιόλαδο',g:12}
  ],kcal:316,macro:{p:9,f:13,c:42},tags:['Κριθαράκι','Γιουβέτσι','Comfort']},

  // ═══ ONE-POT / ΓΡΗΓΟΡΟ ═══
  {id:'ground_meat_rice',name:'Κιμάς & Ρύζι με Ντομάτες',foods:[
    {n:'Κιμάς χοιρ. (ψητός)',g:140},{n:'Ρύζι (ψάχνη)',g:80},{n:'Ντομάτες (φρέσκες)',g:120},{n:'Κρεμμύδι',g:50},{n:'Ελαιόλαδο',g:10}
  ],kcal:602,macro:{p:33,f:37,c:32},tags:['Κιμάς','One-Pot','Γρήγορη']},

  {id:'halloumi_potatoes',name:'Χαλούμι Σαγανάκι με Πατάτες & Σαλάτα',foods:[
    {n:'Χαλούμι',g:120},{n:'Πατάτες (ψητές)',g:130},{n:'Σαλάτα χορτ.',g:150},{n:'Ντομάτα',g:80},{n:'Ελαιόλαδο',g:15}
  ],kcal:722,macro:{p:30,f:52,c:37},tags:['Χαλούμι','Κυπριακή','Εύκολη']},

  {id:'pasta_chicken',name:'Ζυμαρικά με Κοτόπουλο & Ντομάτες',foods:[
    {n:'Ζυμαρικά ολικής',g:80},{n:'Κοτόπουλο (ψητό)',g:130},{n:'Ντομάτες (σάλτσα)',g:100},{n:'Σκόρδο',g:8},{n:'Ελαιόλαδο',g:10}
  ],kcal:446,macro:{p:47,f:16,c:30},tags:['Pasta','Κοτόπουλο','Κλασική']},

  {id:'rice_fish_vegetables',name:'Ρύζι με Ψάρι & Λαχανικά (Pilaf)',foods:[
    {n:'Ψάρι λευκό',g:150},{n:'Ρύζι (ψάχνη)',g:80},{n:'Καρότο (ψητό)',g:80},{n:'Αρακάς',g:70},{n:'Ελαιόλαδο',g:10}
  ],kcal:470,macro:{p:41,f:14,c:41},tags:['Ψάρι','Pilaf','Ξιφιάσιμη']},

  {id:'minced_vegetables',name:'Κιμάς & Λαχανικά (Κατσαρόλα)',foods:[
    {n:'Κιμάς χοιρ. (ψητός)',g:140},{n:'Κολοκυθάκι (ψητό)',g:120},{n:'Μελιτζάνα (ψητή)',g:100},{n:'Ντομάτες (σάλτσα)',g:80},{n:'Ελαιόλαδο',g:10}
  ],kcal:528,macro:{p:33,f:37,c:15},tags:['Κιμάς','Λαχ.','Low Carb']},

  {id:'egg_fried_rice',name:'Ρύζι Τηγανιτό με Αυγό & Γαμέτες',foods:[
    {n:'Ρύζι (βρ.)',g:90},{n:'Αυγά',g:100},{n:'Κοτόπουλο (ψητό)',g:100},{n:'Πιπεριά (ψητή)',g:80},{n:'Σάλτσα σόγιας',g:10}
  ],kcal:455,macro:{p:47,f:14,c:33},tags:['Ρύζι','Egg Fried','Ασιατική']},

  {id:'tuna_salad',name:'Σαλάτα Τόνου (Tuna Salad)',foods:[
    {n:'Τόνος (κονσέρβα)',g:120},{n:'Σαλάτα χορτ.',g:180},{n:'Ντομάτα',g:100},{n:'Αγγούρι',g:80},{n:'Ελαιόλαδο',g:12}
  ],kcal:308,macro:{p:34,f:14,c:13},tags:['Τόνος','Σαλάτα','Light']},

  {id:'shrimp_pasta',name:'Γαρίδες & Ζυμαρικά με Ντομάτες',foods:[
    {n:'Γαρίδες (βραστές)',g:150},{n:'Ζυμαρικά ολικής',g:75},{n:'Ντομάτες (σάλτσα)',g:100},{n:'Σκόρδο',g:10},{n:'Ελαιόλαδο',g:10}
  ],kcal:377,macro:{p:42,f:11,c:29},tags:['Γαρίδες','Pasta','Γρήγορη']},

  {id:'beef_stir_fry',name:'Μοσχάρι Stir Fry με Ρύζι',foods:[
    {n:'Μοσχάρι (ψητό)',g:140},{n:'Ρύζι (ψάχνη)',g:80},{n:'Μπρόκολο (ψητό)',g:120},{n:'Σάλτσα σόγιας',g:15},{n:'Ελαιόλαδο',g:10}
  ],kcal:522,macro:{p:45,f:22,c:32},tags:['Μοσχάρι','Stir Fry','Ασιατική']},

  {id:'chicken_spinach_pasta',name:'Κοτόπουλο & Σπανάκι Ζυμαρικά',foods:[
    {n:'Κοτόπουλο (ψητό)',g:140},{n:'Ζυμαρικά ολικής',g:80},{n:'Σπανάκι (ψητό)',g:120},{n:'Σάλτσα ντομάτας',g:40},{n:'Ελαιόλαδο',g:10}
  ],kcal:459,macro:{p:52,f:16,c:27},tags:['Κοτόπουλο','Pasta','Πολυθρεπτική']},

  {id:'lamb_rice_beans',name:'Αρνί με Ρύζι & Λαχανικά',foods:[
    {n:'Αρνί (ψητό)',g:130},{n:'Ρύζι (ψάχνη)',g:75},{n:'Μπρόκολο',g:120},{n:'Σαλάτα',g:120},{n:'Ελαιόλαδο',g:12}
  ],kcal:601,macro:{p:40,f:35,c:33},tags:['Αρνί','Ρύζι','Θρεπτική']},

  {id:'fish_vegetables_baked',name:'Ψάρι Φούρνο με Ψητά Λαχανικά',foods:[
    {n:'Ψάρι λευκό',g:170},{n:'Κολοκυθάκι (ψητό)',g:120},{n:'Μελιτζάνα (ψητή)',g:100},{n:'Ντομάτα',g:80},{n:'Ελαιόλαδο',g:10}
  ],kcal:359,macro:{p:42,f:15,c:13},tags:['Ψάρι','Low Carb','Υγιεινή']},

  {id:'chicken_cauliflower',name:'Κοτόπουλο & Κουνουπίδι Ρύζι',foods:[
    {n:'Κοτόπουλο (ψητό)',g:160},{n:'Κουνουπίδι (ψητό)',g:150},{n:'Ρύζι (ψάχνη)',g:70},{n:'Σάλτσα σόγιας',g:10},{n:'Ελαιόλαδο',g:8}
  ],kcal:469,macro:{p:54,f:14,c:28},tags:['Κοτόπουλο','Low Carb','Υγιεινή']},

  {id:'pork_carrots',name:'Χοιρινό & Καρότα Κοκκινιστά',foods:[
    {n:'Χοιρινό (ψητό)',g:150},{n:'Καρότο (ψητό)',g:130},{n:'Κριθαράκι (βρ.)',g:70},{n:'Κρεμμύδι',g:50},{n:'Ελαιόλαδο',g:12}
  ],kcal:653,macro:{p:46,f:34,c:39},tags:['Χοιρινό','Καρότα','Comfort']},

  {id:'chicken_beans',name:'Κοτόπουλο με Ρύζι & Λαχανικά',foods:[
    {n:'Κοτόπουλο (ψητό)',g:130},{n:'Ρύζι (ψάχνη)',g:75},{n:'Μπρόκολο',g:120},{n:'Σαλάτα',g:120},{n:'Ελαιόλαδο',g:12}
  ],kcal:480,macro:{p:47,f:18,c:33},tags:['Κοτόπουλο','Ρύζι','Κυπριακή']},

  // ═══ BODYBUILDING CLEAN EATING - BREAKFASTS ═══
  {id:'bb_breakfast_eggs_oats',name:'Αυγά Ολόκληρα με Βρώμη & Μέλι',foods:[
    {n:'Αυγά (ολόκληρα)',g:180},{n:'Βρώμη (βρ.)',g:60},{n:'Μέλι άβραστο',g:15},{n:'Μπανάνα',g:80}
  ],kcal:417,macro:{p:26,f:19,c:40},tags:['bodybuilding_clean','breakfast','eggs','high_protein']},

  {id:'bb_breakfast_eggs_toast',name:'Αυγά με Ψωμί Ολικής & Μαρμελάδα',foods:[
    {n:'Αυγά (ολόκληρα)',g:180},{n:'Ψωμί ολικής',g:80},{n:'Μαρμελάδα φράουλα',g:12},{n:'Μέλι',g:8}
  ],kcal:509,macro:{p:30,f:21,c:49},tags:['bodybuilding_clean','breakfast','eggs','whole_wheat']},

  {id:'bb_breakfast_eggs_rice',name:'Αυγά με Λευκό Ρύζι & Σπανάκι',foods:[
    {n:'Αυγά (ολόκληρα)',g:180},{n:'Λευκό ρύζι (βρ.)',g:120},{n:'Σπανάκι',g:100},{n:'Ελαιόλαδο',g:8}
  ],kcal:507,macro:{p:29,f:27,c:39},tags:['bodybuilding_clean','breakfast','eggs','white_rice']},

  {id:'bb_breakfast_yogurt_granola',name:'Ελληνικό Γιαούρτι 2% με Granola & Μέλι',foods:[
    {n:'Γιαούρτι Ελληνικό 2%',g:220},{n:'Granola (low sugar)',g:50},{n:'Μέλι άβραστο',g:12},{n:'Μπανάνα',g:60}
  ],kcal:492,macro:{p:27,f:18,c:60},tags:['bodybuilding_clean','breakfast','yogurt','high_protein']},

  {id:'bb_breakfast_eggwhites_toast',name:'Ασπράδια Αυγών με Ψωμί & Χυμό',foods:[
    {n:'Ασπράδια αυγών',g:280},{n:'Ψωμί ολικής',g:60},{n:'Μέλι',g:10},{n:'Πορτοκαλάδα φρέσκια',g:200}
  ],kcal:414,macro:{p:37,f:3,c:56},tags:['bodybuilding_clean','breakfast','eggs','lean_protein','whole_wheat']},

  {id:'bb_breakfast_oatmeal_protein',name:'Oatmeal με Protein Powder & Μπανάνα',foods:[
    {n:'Oatmeal (βρ.)',g:80},{n:'Γάλα αμυγδάλου',g:200},{n:'Protein Powder vanilla',g:30},{n:'Μπανάνα',g:80}
  ],kcal:282,macro:{p:28,f:6,c:32},tags:['bodybuilding_clean','breakfast','protein','high_carb']},

  {id:'bb_breakfast_turkey_ricecakes',name:'Κρέας Γαλοπούλας με Ρυζογκοφρέτες',foods:[
    {n:'Κρέας γαλοπούλας (σαλάμι clean)',g:100},{n:'Ρυζογκοφρέτες',g:40},{n:'Μάρμελάδα',g:12},{n:'Μήλο',g:120}
  ],kcal:382,macro:{p:34,f:2,c:57},tags:['bodybuilding_clean','breakfast','turkey','rice_cakes']},

  {id:'bb_breakfast_pancakes_protein',name:'Protein Pancakes με Μέλι & Φράουλες',foods:[
    {n:'Αυγά (ολόκληρα)',g:120},{n:'Oatmeal',g:50},{n:'Protein powder vanilla',g:25},{n:'Μέλι',g:15},{n:'Φράουλες',g:150}
  ],kcal:401,macro:{p:38,f:15,c:34},tags:['bodybuilding_clean','breakfast','eggs','high_carb','treat']}
];
var SNACK_RECIPES=[
  // ═══ ΓΙΑΟΥΡΤΙ & ΓΑΛΑΚΤΟΚΟΜΙΚΑ ═══
  {id:'snk_yogurt_berries',name:'Γιαούρτι Ελληνικό με Μύρτιλα',foods:[
    {n:'Γιαούρτι Ελληνικό 2%',g:200},{n:'Μύρτιλα',g:120},{n:'Μέλι άβραστο',g:10}
  ],kcal:228,macro:{p:22,f:4,c:28},tags:['Γιαούρτι','Φρούτο','Γρήγορη','Light']},

  {id:'snk_yogurt_honey_nuts',name:'Γιαούρτι με Μέλι & Κάσιους',foods:[
    {n:'Γιαούρτι Ελληνικό 2%',g:180},{n:'Μέλι άβραστο',g:12},{n:'Κάσιους',g:25}
  ],kcal:306,macro:{p:23,f:15,c:25},tags:['Γιαούρτι','Μέλι','Ξηροί Καρποί']},

  {id:'snk_cottage_fruit',name:'Cottage Cheese με Φράουλες',foods:[
    {n:'Cottage Cheese',g:150},{n:'Φράουλες',g:150},{n:'Μέλι',g:8}
  ],kcal:219,macro:{p:18,f:7,c:23},tags:['Cottage','Φρούτο','Πρωτείνη']},

  {id:'snk_feta_olive',name:'Φέτα με Ελιές & Ψωμί Ολικής',foods:[
    {n:'Φέτα',g:50},{n:'Ελιές',g:40},{n:'Ψωμί ολικής',g:50}
  ],kcal:302,macro:{p:12,f:17,c:25},tags:['Φέτα','Ελιές','Κλασική']},

  // ═══ ΦΡΟΥΤΑ & ΞΗΡΟΙ ΚΑΡΠΟΙ ═══
  {id:'snk_apple_almonds',name:'Μήλο με Αμύγδαλα',foods:[
    {n:'Μήλο',g:180},{n:'Αμύγδαλα',g:25},{n:'Νερό',g:250}
  ],kcal:238,macro:{p:6,f:13,c:31},tags:['Φρούτο','Ξηροί Καρποί','Απλή']},

  {id:'snk_banana_pb',name:'Μπανάνα με Φυστικοβούτυρο',foods:[
    {n:'Μπανάνα',g:120},{n:'Φυστικοβούτυρο',g:15}
  ],kcal:195,macro:{p:5,f:8,c:31},tags:['Φρούτο','Ενέργεια','Γρήγορη']},

  {id:'snk_orange_walnuts',name:'Πορτοκάλι με Καρύδια',foods:[
    {n:'Πορτοκάλι',g:200},{n:'Καρύδια',g:20}
  ],kcal:225,macro:{p:5,f:13,c:27},tags:['Φρούτο','Καρύδια','Βιταμίνη C']},

  {id:'snk_pear_cheese',name:'Αχλάδι με Τυρί Φέτα',foods:[
    {n:'Αχλάδι',g:180},{n:'Φέτα',g:40}
  ],kcal:208,macro:{p:6,f:9,c:29},tags:['Φρούτο','Τυρί','Ισορροπημένη']},

  // ═══ RICE CAKES & ΕΛΑΦΡΥ ═══
  {id:'snk_ricecakes_pb',name:'Ρυζογκοφρέτες με Φυστικοβούτυρο',foods:[
    {n:'Ρυζογκοφρέτες',g:25},{n:'Φυστικοβούτυρο',g:18},{n:'Μπανάνα',g:80}
  ],kcal:274,macro:{p:7,f:10,c:43},tags:['Rice Cakes','Φυστικοβούτυρο','Γρήγορη']},

  {id:'snk_ricecakes_honey',name:'Ρυζογκοφρέτες με Μέλι & Αμύγδαλα',foods:[
    {n:'Ρυζογκοφρέτες',g:25},{n:'Μέλι',g:15},{n:'Αμύγδαλα',g:15}
  ],kcal:229,macro:{p:5,f:8,c:36},tags:['Rice Cakes','Μέλι','Ξηροί Καρποί']},

  // ═══ ΤΥΡΙ & ΑΥΓΑ ═══
  {id:'snk_cheese_crackers',name:'Τυρί με Κράκερ Ολικής',foods:[
    {n:'Τυρί Cheddar',g:40},{n:'Κράκερ ολικής',g:30}
  ],kcal:291,macro:{p:13,f:17,c:21},tags:['Τυρί','Κράκερ','Απλή']},

  {id:'snk_boiled_egg_toast',name:'Βραστό Αυγό με Ψωμί Ολικής',foods:[
    {n:'Αυγό (βραστό)',g:60},{n:'Ψωμί ολικής',g:50},{n:'Μαργαρίνη light',g:5}
  ],kcal:224,macro:{p:12,f:9,c:21},tags:['Αυγό','Ψωμί','Πρωτείνη']},

  // ═══ ΣΟΚΟΛΑΤΑ & ΕΝΕΡΓΕΙΑΚΑ ═══
  {id:'snk_dark_chocolate',name:'Dark Chocolate 70% (Κομμάτια)',foods:[
    {n:'Dark Chocolate 70%',g:30},{n:'Καρύδια',g:20}
  ],kcal:310,macro:{p:5,f:26,c:17},tags:['Σοκολάτα','Antioxidants','Έκπληξη']},

  {id:'snk_energy_bites',name:'Energy Bites με Βρώμη & Κολοκύθα',foods:[
    {n:'Energy Bites (FYH)',g:50},{n:'Μήλο',g:100}
  ],kcal:232,macro:{p:4,f:6,c:43},tags:['FYH','Ενέργεια','Γρήγορη']},

  // ═══ ΕΝΑΛΛΑΚΤΙΚΑ ═══
  {id:'snk_mixed_nuts',name:'Μίξ Ξηροί Καρποί & Σταφίδες',foods:[
    {n:'Αμύγδαλα',g:15},{n:'Καρύδια',g:15},{n:'Σταφίδες',g:25}
  ],kcal:260,macro:{p:6,f:17,c:25},tags:['Ξηροί Καρποί','Ενέργεια','Travel']},

  {id:'snk_popcorn_honey',name:'Popcorn (Air Popped) με Μέλι',foods:[
    {n:'Popcorn (αέρας)',g:30},{n:'Μέλι',g:10}
  ],kcal:147,macro:{p:4,f:1,c:32},tags:['Popcorn','Light','Δροσερή']},

  {id:'snk_greek_salad_mini',name:'Μινιατούρα Ελληνικής Σαλάτας',foods:[
    {n:'Ντομάτα',g:100},{n:'Αγγούρι',g:80},{n:'Φέτα',g:30},{n:'Ελιές',g:20},{n:'Ελαιόλαδο',g:5}
  ],kcal:177,macro:{p:6,f:14,c:9},tags:['Σαλάτα','Ελληνική','Δροσερή']},

  // ═══ BODYBUILDING CLEAN - HIGH PROTEIN SNACKS ═══
  {id:'snk_bb_yogurt_honey_granola',name:'Ελληνικό Γιαούρτι 2% με Μέλι & Granola',foods:[
    {n:'Γιαούρτι Ελληνικό 2%',g:200},{n:'Μέλι άβραστο',g:10},{n:'Granola low sugar',g:25}
  ],kcal:297,macro:{p:22,f:11,c:30},tags:['bodybuilding_clean','snack','yogurt','high_protein']},

  {id:'snk_bb_cottage_apple',name:'Cottage Cheese με Μήλο & Μέλι',foods:[
    {n:'Cottage Cheese',g:170},{n:'Μήλο',g:150},{n:'Μέλι',g:8}
  ],kcal:269,macro:{p:19,f:8,c:33},tags:['bodybuilding_clean','snack','cottage','high_protein']},

  {id:'snk_bb_eggwhites_toast',name:'Ασπράδια Αυγών με Ψωμί Ολικής & Μέλι',foods:[
    {n:'Ασπράδια αυγών',g:200},{n:'Ψωμί ολικής',g:40},{n:'Μέλι',g:8}
  ],kcal:227,macro:{p:26,f:2,c:24},tags:['bodybuilding_clean','snack','eggs','high_protein','lean']},

  {id:'snk_bb_ricecakes_almondbutter',name:'Ρυζογκοφρέτες με Almond Butter & Μπανάνα',foods:[
    {n:'Ρυζογκοφρέτες',g:30},{n:'Almond butter',g:15},{n:'Μπανάνα',g:80}
  ],kcal:279,macro:{p:6,f:9,c:46},tags:['bodybuilding_clean','snack','rice_cakes','energy']},

  {id:'snk_bb_turkey_ricecakes',name:'Κρέας Γαλοπούλας με Ρυζογκοφρέτες & Μέλι',foods:[
    {n:'Κρέας γαλοπούλας (σαλάμι clean)',g:80},{n:'Ρυζογκοφρέτες',g:30},{n:'Μέλι',g:10}
  ],kcal:255,macro:{p:26,f:2,c:33},tags:['bodybuilding_clean','snack','turkey','high_protein']},

  {id:'snk_bb_protein_shake_banana',name:'Protein Shake Vanilla με Μπανάνα & Γάλα',foods:[
    {n:'Protein powder vanilla',g:30},{n:'Γάλα αμυγδάλου',g:250},{n:'Μπανάνα',g:100}
  ],kcal:252,macro:{p:27,f:6,c:27},tags:['bodybuilding_clean','snack','protein_shake','high_protein','energy']}
];
var MACRO_TYPE={
  'Κρέας':'p','Ψάρια':'p','Αυγά/Γαλακτ.':'p',
  'Δημητριακά':'c','Φρούτα':'c',
  'Λάδια':'f','Ξηροί καρποί':'f'
  // Λαχανικά, Όσπρια, Συνταγές FYH, Άλλα → fallback to calorie ratio
};
var GOAL_LABELS={loss:'Απώλεια βάρους',mild:'Ήπια απώλεια',maintain:'Διατήρηση',gain:'Αύξηση μάζας',football:'⚽ Ποδόσφαιρο',
  kcal2000:'2000 kcal',kcal2300:'2300 kcal',kcal2500:'2500 kcal',kcal2700:'2700 kcal',kcal3000:'3000 kcal'};
var GOAL_KEYS=['loss','mild','maintain','gain','football','kcal2000','kcal2300','kcal2500','kcal2700','kcal3000'];
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
    {n:'Ντομάτα',g:100},
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
  'Protein Pancakes (FYH)':1,'Μπανανόψωμο':1
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
  {n:'Ανανάς',     por:'3/4 φλιτζάνι',            porEn:'3/4 cup',                g:116},
  {n:'Αχλάδι',     por:'1 μικρό',                  porEn:'1 small',                g:110},
  {n:'Βερίκοκα',   por:'4 ολόκληρα',               porEn:'4 whole',                g:150},
  {n:'Γκρέιπφρούτ',por:'1 ολόκληρο',               porEn:'1 whole',                g:330},
  {n:'Δαμάσκηνα',  por:'2 μέτρια',                 porEn:'2 medium',               g:140},
  {n:'Καρπούζι',   por:'1 φέτα',                   porEn:'1 slice',                g:380},
  {n:'Κεράσια',    por:'12 μεγάλα',                porEn:'12 large',               g:85},
  {n:'Μανταρίνι',  por:'2 μικρά',                  porEn:'2 small',                g:220},
  {n:'Μήλο',       por:'1 μικρό',                  porEn:'1 small',                g:120},
  {n:'Μούρα',      por:'3/4 φλιτζάνι',             porEn:'3/4 cup',                g:109},
  {n:'Μπανάνα',    por:'½ μεγάλη ή 1 μικρή',       porEn:'½ large or 1 small',    g:120},
  {n:'Νεκταρίνι',  por:'1 μέτριο',                 porEn:'1 medium',               g:140},
  {n:'Πεπόνι',     por:'3/4 φλιτζάνι',             porEn:'3/4 cup',                g:280},
  {n:'Πορτοκάλι',  por:'1 μικρό',                  porEn:'1 small',                g:180},
  {n:'Ροδάκινο',   por:'1 μέτριο',                 porEn:'1 medium',               g:110},
  {n:'Σταφίδες',   por:'1 κουτ. σούπας',           porEn:'1 tbsp',                 g:15},
  {n:'Σταφύλια',   por:'17 ρόγες μικρές',          porEn:'17 small grapes',        g:85},
  {n:'Φράουλες',   por:'10 μικρές ή 1¼ φλιτζάνι', porEn:'10 small or 1¼ cup',    g:190}
];

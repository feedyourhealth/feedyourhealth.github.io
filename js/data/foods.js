// js/data/foods.js
// Split out of js/data.js (module split wave 1). Pure data, no logic.
// Contents: FOODS + pairing/sauce/herb DBs

var FOODS={
/* fi = dietary fiber (g per 100g) — DRI/USDA FoodData Central values */
'Κοτόπουλο στήθος (ψητό)':{k:165,p:31,c:0,f:3.6,fi:0,cat:'Κρέας',en:'Chicken Breast (grilled)',ru:'Куриная грудка (гриль)',tr:'Tavuk Göğsü (ızgara)'},
'Κοτόπουλο βραστό':{k:168,p:32,c:0,f:3.7,fi:0,cat:'Κρέας',en:'Chicken (boiled)',ru:'Курица (варёная)',tr:'Tavuk (haşlanmış)'},
'Κοτόπουλο μπιφτέκι':{k:190,p:20,c:6,f:10,fi:0,cat:'Κρέας',en:'Chicken Patty',ru:'Куриный бифштекс',tr:'Tavuk Köftesi'},
'Κοτόπουλο σουβλάκι':{k:165,p:31,c:0,f:3.6,fi:0,cat:'Κρέας',en:'Chicken Souvlaki',ru:'Куриное сувлаки',tr:'Tavuk Souvlaki'},
/* Chef Recipes - Άκης Πετρετζάκης */
'High Protein Ομελέτα Wrap':{k:850,p:60,c:40,f:50,fi:4,cat:'Συνταγές',containsCats:['Αυγά/Γαλακτ.','Κρέας'],ingredients:[{item:'Αυγά',qty:'3',size:'μεσαία'},{item:'Πίτα αραβική high protein',qty:'1'},{item:'Cottage cheese',qty:'50g'},{item:'Καλαμπόκι',qty:'40g'},{item:'Μοτσαρέλα light',qty:'50g'},{item:'Γαλοπούλα καπνιστή',qty:'3',size:'φέτες'},{item:'Ελαιόλαδο',qty:'2',unit:'κ.σ.'},{item:'Ρόκα',qty:'κατά απόλυτη επιλογή'}],time:'10 λεπτά',en:'High Protein Omelette Wrap',ru:'Ролл с омлетом high protein',tr:'Yüksek Proteinli Omlet Wrap'},
'Wrap με τονοσαλάτα':{k:564,p:45,c:43,f:22,fi:6.3,cat:'Συνταγές',containsCats:['Ψάρια'],ingredients:[{item:'Τόνο σε ελαιόλαδο',qty:'140g',prep:'στραγγισμένο'},{item:'Φρέσκο κρεμμυδάκι',qty:'½'},{item:'Πιπεριά Φλωρίνης',qty:'½'},{item:'Καλαμπόκι',qty:'30g',prep:'κονσέρβα, στραγγισμένο'},{item:'Ξύσμα λεμονιού',qty:'από ½ λεμόνι'},{item:'Χυμό λεμονιού',qty:'1',unit:'κ.σ.'},{item:'Μαγιονέζα light',qty:'1',unit:'κ.σ.'},{item:'Πιπέρι',qty:'κατά απόλυτη επιλογή'},{item:'Τορτίγια',qty:'1',size:'μεγάλη'},{item:'Ρόκα',qty:'20g',prep:'για σερβίρισμα'}],time:'10 λεπτά',en:'Tuna Salad Wrap',ru:'Ролл с тунцом',tr:'Ton Balıklı Wrap'},
/* Vegan/Vegetarian Recipes - PickupLimes */
'Chive & Onion Whipped Tofu Toast':{k:408,p:21.9,c:42.5,f:18.1,fi:5,cat:'Συνταγές',ingredients:[{item:'Tofu (σταθερό)',qty:'125g',prep:'στραγγισμένο'},{item:'Nutritional yeast',qty:'5g'},{item:'Apple cider vinegar',qty:'1',unit:'κ.σ.'},{item:'Ελαιόλαδο',qty:'1',unit:'κ.σ.'},{item:'Ξηρό κρεμμύδι',qty:'½',unit:'κ.γ.'},{item:'Σκόρδο (ξηρό)',qty:'½',unit:'κ.γ.'},{item:'Φρέσκο μαϊντανό',qty:'1',unit:'κ.σ.',prep:'ψιλοκομμένο'},{item:'Άνηθος (ξηρός)',qty:'¼',unit:'κ.γ.'},{item:'Αλάτι & πιπέρι',qty:'κατά απόλυτη επιλογή'},{item:'Ψωμί (σκληρό)',qty:'2',size:'φέτες'},{item:'Ντομάτα',qty:'1',size:'μεσαία',prep:'κομμένη σε φέτες'},{item:'Βασιλικό (φρέσκο)',qty:'κατά απόλυτη επιλογή',prep:'ψιλοκομμένο'}],time:'10 λεπτά',en:'Chive & Onion Whipped Tofu Toast',ru:'Тост с взбитым тофу, луком и чесноком',tr:'Frenk Soğanlı Tofu Ezmesi Tost'},
'Berries & Cream Instant Oatmeal':{k:379,p:12.9,c:60.6,f:11.5,fi:9.5,cat:'Συνταγές',ingredients:[{item:'Βρώμη (γρήγορης μαγειρέματος)',qty:'27g',prep:'ωμή'},{item:'Κατεψυγμένα μούρα (raspberry)',qty:'8g'},{item:'Σπόρια λιναριού (αλεσμένα)',qty:'1',unit:'κ.σ.'},{item:'Σόγια γάλα (χωρίς ζάχαρη)',qty:'240ml',unit:'ml'},{item:'Soy yogurt (χωρίς ζάχαρη)',qty:'85g'},{item:'Φρέσκα μούρα (ποικιλία)',qty:'75g'},{item:'Γλυκό κάστανο (προαιρετικό)',qty:'½',unit:'κ.σ.',prep:'για γλύκιση'}],time:'8 λεπτά',en:'Berries & Cream Instant Oatmeal',ru:'Овсянка быстрого приготовления с ягодами и сливками',tr:'Meyveli ve Kremalı Anında Yulaf Ezmesi'},
'Peanut Butter & Jelly Smoothie Bowl':{k:346,p:12.7,c:45.5,f:15.4,fi:7.9,cat:'Συνταγές',ingredients:[{item:'Σόγια γάλα (χωρίς ζάχαρη)',qty:'360ml',unit:'ml'},{item:'Μπανάνα (κατεψυγμένη)',qty:'2',size:'μέσιες'},{item:'Φράουλες (κατεψυγμένες)',qty:'225g'},{item:'Φυστικοβούτυρο (φυσικό, χωρίς ζάχαρη)',qty:'3',unit:'κ.σ.'},{item:'Toppings (προαιρετικά): chia seeds',qty:'κατά απόλυτη επιλογή'},{item:'Hemp seeds',qty:'κατά απόλυτη επιλογή'},{item:'Φρέσκα μούρα',qty:'κατά απόλυτη επιλογή'},{item:'Granola',qty:'κατά απόλυτη επιλογή'}],time:'5 λεπτά',en:'Peanut Butter & Jelly Smoothie Bowl',ru:'Смузи-боул с арахисовой пастой и джемом',tr:'Fıstık Ezmeli ve Reçelli Smoothie Bowl'},
'Mixed Berry & Granola Yogurt Parfait':{k:461,p:15.2,c:60.3,f:19.2,fi:11,cat:'Συνταγές',ingredients:[{item:'Κατεψυγμένα μούρα (ποικιλία)',qty:'65g',prep:'μικροκύματα 2-3 λεπτά'},{item:'Soy yogurt (χωρίς ζάχαρη)',qty:'130g'},{item:'Vegan granola',qty:'60g',prep:'σπιτική ή αγορασμένη'},{item:'Μπανάνα (φρέσκια)',qty:'½',size:'μέση',prep:'κομμένη σε φέτες'},{item:'Σπόρια λιναριού (αλεσμένα)',qty:'½',unit:'κ.σ.'},{item:'Ταχίνι ή φυστικοβούτυρο (προαιρετικό)',qty:'½',unit:'κ.σ.',prep:'για επιπλέον γεύση'}],time:'5 λεπτά',en:'Mixed Berry & Granola Yogurt Parfait',ru:'Парфе с ягодами, гранолой и йогуртом',tr:'Karışık Meyveli ve Granolalı Yoğurt Parfe'},
'Κουνέλι (μαγ.)':{k:197,p:29,c:0,f:8,fi:0,cat:'Κρέας',en:'Rabbit (cooked)',ru:'Кролик (варёный)',tr:'Tavşan (pişmiş)'},
'Χοιρινό (μπριζόλα)':{k:242,p:27,c:0,f:14,fi:0,cat:'Κρέας',en:'Pork Chop',ru:'Свиная отбивная',tr:'Domuz Pirzolası'},
'Μπριζόλα άπαχη':{k:165,p:28,c:0,f:5.4,fi:0,cat:'Κρέας',en:'Lean Steak',ru:'Постный стейк',tr:'Yağsız Biftek'},
'Βοδινό άπαχο (ψητό)':{k:204,p:28,c:0,f:8,fi:0,cat:'Κρέας',en:'Lean Beef (grilled)',ru:'Постная говядина (гриль)',tr:'Yağsız Dana Eti (ızgara)'},
'Βοδινά φιλετάκια':{k:200,p:28,c:0,f:8,fi:0,cat:'Κρέας',en:'Beef Strips',ru:'Полоски говядины',tr:'Dana Eti Şeritleri'},
'Βοδινά μπιφτέκια (ψημένα)':{k:193,p:28,c:0,f:9.3,fi:0,cat:'Κρέας',en:'Beef Patties (grilled)',ru:'Говяжьи котлеты (гриль)',tr:'Dana Köfte (ızgara)'},
'Γαλοπούλα στήθος':{k:135,p:30,c:0,f:1,fi:0,cat:'Κρέας',en:'Turkey (roasted)',ru:'Индейка (запечённая)',tr:'Hindi (fırında)'},
'Κοτόπουλο μπούτι (ψητό)':{k:189,p:27,c:0,f:8.2,fi:0,cat:'Κρέας',en:'Chicken Thigh (grilled)',ru:'Куриное бедро (гриль)',tr:'Tavuk But (ızgara)'},
'Μοσχάρι (ψητό)':{k:200,p:28,c:0,f:8,fi:0,cat:'Κρέας',en:'Veal (roasted)',ru:'Телятина (запечённая)',tr:'Dana Eti (fırında)'},
'Μοσχάρι κιμάς (μαγ.)':{k:172,p:24.4,c:0,f:7.6,fi:0,cat:'Κρέας',en:'Ground Veal (cooked)',ru:'Телячий фарш (готовый)',tr:'Dana Kıyma (pişmiş)'},
'Βοδινός κιμάς (μαγ.)':{k:250,p:26,c:0,f:16,fi:0,cat:'Κρέας',en:'Ground Beef (cooked)',ru:'Говяжий фарш (готовый)',tr:'Dana Kıyma (pişmiş)'},
'Βοδινός κιμάς άπαχος (μαγ.)':{k:176,p:27,c:0,f:7,fi:0,cat:'Κρέας',en:'Lean Ground Beef (cooked)',ru:'Постный говяжий фарш (готовый)',tr:'Yağsız Dana Kıyma (pişmiş)'},
'Αρνί (ψητό)':{k:258,p:25.5,c:0,f:16.6,fi:0,cat:'Κρέας',en:'Lamb (cooked)',ru:'Баранина (запечённая)',tr:'Kuzu Eti (pişmiş)'},
'Χοιρινός κιμάς (μαγ.)':{k:285,p:25,c:0,f:20,fi:0,cat:'Κρέας',en:'Ground Pork (cooked)',ru:'Свиной фарш (готовый)',tr:'Domuz Kıyma (pişmiş)'},
// ✅ 2026-08-26: Συκώτι μοσχαρίσιο — μακροθρεπτικά από USDA FoodData Central FDC ID 168626
// (Beef, variety meats and by-products, liver, cooked, braised· πλησιέστερο επίσημο USDA προφίλ σε
// σχάρα/φούρνο — χωρίς προσθήκη λαδιού όπως το pan-fried). Σημείωση: το συκώτι έχει πραγματικούς
// υδατάνθρακες (γλυκογόνο) σε αντίθεση με τα υπόλοιπα κρέατα — δεν είναι c:0 σκόπιμα.
'Συκώτι μοσχαρίσιο (σχάρα/φούρνο)':{k:191,p:29.1,c:5.1,f:5.3,fi:0,cat:'Κρέας',en:'Beef Liver (grilled/oven)',ru:'Говяжья печень (гриль/духовка)',tr:'Dana Ciğeri (ızgara/fırın)'},
'Ελεύθερο γεύμα':{k:0,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Free Meal',ru:'Свободный приём пищи',tr:'Serbest Öğün'},
'Μέλι άβραστο':{k:304,p:0.3,c:82,f:0,fi:0.2,cat:'Άλλα',en:'Raw Honey',ru:'Мёд сырой',tr:'Çiğ Bal',vegan:false},
'Μαρμελάδα φράουλας':{k:251,p:0.3,c:62,f:0.1,fi:0.9,cat:'Άλλα',en:'Strawberry Jam',ru:'Клубничный джем',tr:'Çilek Reçeli'},
'Μαρμελάδα χωρίς ζάχαρη':{k:130,p:0.5,c:31,f:0.2,fi:1.5,cat:'Άλλα',en:'Sugar-Free Jam',ru:'Джем без сахара',tr:'Şekersiz Reçel'},
'Σάλτσα σόγιας (μειωμένο αλάτι)':{k:58,p:6,c:7,f:0.1,fi:0,cat:'Άλλα',en:'Soy Sauce (reduced salt)',ru:'Соевый соус (с пониженным содержанием соли)',tr:'Soya Sosu (az tuzlu)'},
/* Ψάρια — fi=0 */
'Σολομός (ψητός)':{k:206,p:22,c:0,f:13,fi:0,cat:'Ψάρια',en:'Salmon (grilled)',ru:'Лосось (гриль)',tr:'Somon (ızgara)'},
'Λαβράκι (ψητό)':{k:118,p:18,c:0,f:2.4,fi:0,cat:'Ψάρια',en:'Sea Bass (grilled)',ru:'Сибас (гриль)',tr:'Levrek (ızgara)'},
'Τόνος (κονσέρβα)':{k:116,p:26,c:0,f:1,fi:0,cat:'Ψάρια',en:'Tuna (canned)',ru:'Тунец (консервированный)',tr:'Ton Balığı (konserve)'},
'Καλαμπόκι (κονσέρβα)':{k:81,p:3,c:18,f:1.2,fi:2.5,cat:'Λαχανικά',en:'Corn (canned)',ru:'Кукуруза (консервированная)',tr:'Mısır (konserve)'},
'Ρόκα':{k:25,p:2.6,c:3.7,f:0.7,fi:1.6,cat:'Λαχανικά',en:'Arugula',ru:'Руккола',tr:'Roka'},
'Μαγιονέζα light':{k:300,p:0.9,c:9,f:28,fi:0,cat:'Καρυκεύματα',en:'Light Mayonnaise',ru:'Майонез light',tr:'Light Mayonez'},
'Γαρίδες (βραστές)':{k:99,p:24,c:0,f:0.3,fi:0,cat:'Ψάρια',en:'Shrimp (boiled)',ru:'Креветки (варёные)',tr:'Karides (haşlanmış)'},
'Σαρδέλες':{k:260,p:30,c:0,f:14,fi:0,cat:'Ψάρια',en:'Sardines (canned)',ru:'Сардины (консервированные)',tr:'Sardalya (konserve)'},
'Τσιπούρα (ψητή)':{k:131,p:26,c:0,f:2.9,fi:0,cat:'Ψάρια',en:'Sea Bream (grilled)',ru:'Дорадо (гриль)',tr:'Çipura (ızgara)'},
'Μπακαλιάρος (ψητός)':{k:105,p:22.8,c:0,f:0.9,fi:0,cat:'Ψάρια',en:'Cod (grilled)',ru:'Треска (гриль)',tr:'Morina Balığı (ızgara)'},
'Σκουμπρί (ψητό)':{k:239,p:23.8,c:0,f:15.4,fi:0,cat:'Ψάρια',en:'Mackerel (grilled)',ru:'Скумбрия (гриль)',tr:'Uskumru (ızgara)'},
'Χταπόδι (βρ.)':{k:164,p:29.8,c:4.4,f:2.1,fi:0,cat:'Ψάρια',en:'Octopus (boiled)',ru:'Осьминог (варёный)',tr:'Ahtapot (haşlanmış)'},
'Καλαμάρι (ψητό)':{k:170,p:28,c:5.5,f:2.5,fi:0,cat:'Ψάρια',en:'Squid (grilled)',ru:'Кальмар (гриль)',tr:'Kalamar (ızgara)'},
'Μύδια (βρ.)':{k:172,p:23.8,c:7.4,f:4.5,fi:0,cat:'Ψάρια',en:'Mussels (boiled)',ru:'Мидии (варёные)',tr:'Midye (haşlanmış)'},
/* Αυγά / Γαλακτοκομικά — fi≈0 */
'Αυγά (ολόκληρα)':{k:143,p:13,c:1.1,f:10,fi:0,cat:'Αυγά/Γαλακτ.',en:'Eggs (whole)',ru:'Яйца (целые)',tr:'Yumurta (bütün)'},
'Ασπράδια αυγών':{k:52,p:11,c:0.7,f:0.2,fi:0,cat:'Αυγά/Γαλακτ.',en:'Egg Whites',ru:'Яичные белки',tr:'Yumurta Akı'},
'Γιαούρτι 2%':{k:73,p:10,c:4,f:2,fi:0,cat:'Αυγά/Γαλακτ.',en:'Yogurt 2%',ru:'Йогурт 2%',tr:'Yoğurt %2'},
'Arla Protein Γιαουρτάκι Σοκολάτα (πουτίγκα)':{k:77,p:10,c:6.6,f:1.5,fi:0,cat:'Αυγά/Γαλακτ.',en:'Arla Protein Chocolate Yogurt (pudding)',ru:'Arla Protein шоколадный йогурт (пудинг)',tr:'Arla Protein Çikolatalı Yoğurt (puding)'},
'Arla Protein Ρόφημα Σοκολάτα':{k:51,p:5.6,c:4.9,f:0.9,fi:0,cat:'Αυγά/Γαλακτ.',en:'Arla Protein Chocolate Drink',ru:'Arla Protein шоколадный напиток',tr:'Arla Protein Çikolatalı İçecek'},
'Cottage cheese':{k:98,p:11,c:3.4,f:4.3,fi:0,cat:'Αυγά/Γαλακτ.',en:'Cottage Cheese',ru:'Творог (Cottage cheese)',tr:'Lor Peyniri (Cottage cheese)'},
'Cream cheese':{k:342,p:5.9,c:4.1,f:34,fi:0,cat:'Αυγά/Γαλακτ.',en:'Cream Cheese',ru:'Сливочный сыр',tr:'Krem Peynir'},
'Τυρί φέτα':{k:264,p:14,c:4,f:21,fi:0,cat:'Αυγά/Γαλακτ.',en:'Feta Cheese',ru:'Сыр фета',tr:'Feta Peyniri'},
'Μοτσαρέλα':{k:300,p:22,c:2.2,f:22,fi:0,cat:'Αυγά/Γαλακτ.',en:'Mozzarella',ru:'Моцарелла',tr:'Mozzarella'},
'Γάλα πλήρες':{k:61,p:3.3,c:4.8,f:3.3,fi:0,cat:'Αυγά/Γαλακτ.',en:'Whole Milk',ru:'Цельное молоко',tr:'Tam Yağlı Süt'},
// plantBased:true — genuinely dairy-free despite sharing the 'Αυγά/Γαλακτ.' category with real
// milk/yogurt/cheese (kept for shopping-list/macro-ratio/food-picker grouping, which all work
// fine either way) — see applyDietTypeCategorySafetyNet (js/app-part2.js), which exempts any
// plantBased food from vegan/vegetarian/orthodox_fasting restriction regardless of its .cat.
'Γάλα αμυγδάλου':{k:17,p:0.6,c:0.5,f:1.4,fi:0.2,cat:'Αυγά/Γαλακτ.',plantBased:true,en:'Almond Milk',ru:'Миндальное молоко',tr:'Badem Sütü'},
'Πρωτεΐνη σκόνη (whey)':{k:400,p:80,c:10,f:7,fi:0,cat:'Αυγά/Γαλακτ.',en:'Whey Protein Powder',ru:'Сывороточный протеин (порошок)',tr:'Whey Protein Tozu'},
'Πρωτεΐνη Αμυγδάλου (Amino Animo Organic)':{k:375,p:55,c:7,f:16,fi:0,cat:'Αυγά/Γαλακτ.',en:'Almond Protein (Amino Animo Organic)',ru:'Миндальный протеин (Amino Animo Organic)',tr:'Badem Proteini (Amino Animo Organic)'},
'Στραγγιστό γιαούρτι 0%':{k:59,p:10,c:3.6,f:0.4,fi:0,cat:'Αυγά/Γαλακτ.',en:'Strained Yogurt 0%',ru:'Греческий йогурт 0%',tr:'Süzme Yoğurt %0'},
'Γιαούρτι πλήρες 5%':{k:100,p:9,c:4.7,f:5.0,fi:0,cat:'Αυγά/Γαλακτ.',en:'Whole Milk Yogurt 5%',ru:'Йогурт цельномолочный 5%',tr:'Tam Yağlı Yoğurt %5'},
'Ανθότυρο':{k:127,p:13,c:0.5,f:8,fi:0,cat:'Αυγά/Γαλακτ.',en:'Anthotyro Cheese',ru:'Сыр анфотиро',tr:'Anthotyro Peyniri'},
'Μυζήθρα':{k:241,p:12,c:3,f:20,fi:0,cat:'Αυγά/Γαλακτ.',en:'Myzithra Cheese',ru:'Сыр мизитра',tr:'Myzithra Peyniri'},
'Γάλα σόγιας':{k:54,p:3.3,c:6.3,f:1.8,fi:0.3,cat:'Αυγά/Γαλακτ.',plantBased:true,en:'Soy Milk',ru:'Соевое молоко',tr:'Soya Sütü'},
'Γάλα σόγιας (χωρίς ζάχαρη)':{k:33,p:3.3,c:1,f:1.8,fi:0.4,cat:'Αυγά/Γαλακτ.',plantBased:true,en:'Soy Milk (unsweetened, fortified)',ru:'Соевое молоко (без сахара, обогащённое)',tr:'Soya Sütü (şekersiz, zenginleştirilmiş)'},
'Γάλα βρώμης':{k:46,p:1.0,c:8.0,f:1.5,fi:0.5,cat:'Αυγά/Γαλακτ.',plantBased:true,en:'Oat Milk',ru:'Овсяное молоко',tr:'Yulaf Sütü'},
'Γάλα βρώμης (χωρίς ζάχαρη)':{k:40,p:1.0,c:6.5,f:1.5,fi:0.5,cat:'Αυγά/Γαλακτ.',plantBased:true,en:'Oat Milk (unsweetened, fortified)',ru:'Овсяное молоко (без сахара, обогащённое)',tr:'Yulaf Sütü (şekersiz, zenginleştirilmiş)'},
'Γάλα φρέσκο 1.5% Λιπαρά':{k:46,p:3.3,c:4.7,f:1.5,fi:0,cat:'Αυγά/Γαλακτ.',en:'Fresh Milk 1.5% Fat',ru:'Свежее молоко 1.5% жирности',tr:'Taze Süt %1.5 Yağlı'},
'Koko Γιαούρτι Καρύδας (Νηστίσιμο)':{k:79,p:0.6,c:8,f:4.9,fi:0.2,cat:'Αυγά/Γαλακτ.',plantBased:true,en:'Koko Coconut Yogurt (Vegan)',ru:'Koko кокосовый йогурт (веганский)',tr:'Koko Hindistan Cevizi Yoğurdu (Vegan)'},
'Γραβιέρα':{k:400,p:28,c:0.5,f:32,fi:0,cat:'Αυγά/Γαλακτ.',en:'Graviera Cheese',ru:'Сыр гравьера',tr:'Graviera Peyniri'},
'Κασέρι':{k:397,p:25,c:1.0,f:32,fi:0,cat:'Αυγά/Γαλακτ.',en:'Kasseri Cheese',ru:'Сыр кассери',tr:'Kaşar Peyniri'},
'Κεφαλοτύρι':{k:454,p:26,c:1.0,f:38,fi:0,cat:'Αυγά/Γαλακτ.',en:'Kefalotyri Cheese',ru:'Сыр кефалотири',tr:'Kefalotiri Peyniri'},
'Παρμεζάνα':{k:431,p:38,c:3.2,f:29,fi:0,cat:'Αυγά/Γαλακτ.',en:'Parmesan',ru:'Пармезан',tr:'Parmesan'},
'Quark (0%)':{k:65,p:12,c:3.5,f:0.2,fi:0,cat:'Αυγά/Γαλακτ.',en:'Quark (0%)',ru:'Кварк (0%)',tr:'Quark (%0)'},
'Ricotta':{k:174,p:11.3,c:3.0,f:13,fi:0,cat:'Αυγά/Γαλακτ.',en:'Ricotta',ru:'Рикотта',tr:'Ricotta'},
'Edam light':{k:235,p:25,c:1.5,f:15,fi:0,cat:'Αυγά/Γαλακτ.',en:'Edam Light',ru:'Эдам light',tr:'Edam Light'},
'Γαλατάκι σοκολάτα delact χωρίς ζάχαρη':{k:48,p:3.5,c:4.7,f:1.8,fi:0,cat:'Αυγά/Γαλακτ.',en:'Delact Sugar-Free Chocolate Milk Drink',ru:'Delact шоколадный напиток без сахара',tr:'Delact Şekersiz Çikolatalı Süt İçeceği'},
'Χαλλούμι (ψητό)':{k:330,p:24,c:1.8,f:26,fi:0,cat:'Αυγά/Γαλακτ.',en:'Halloumi (grilled)',ru:'Халуми (гриль)',tr:'Hellim (ızgara)'},
'Χαλλούμι (ωμό)':{k:362,p:21,c:2.0,f:30,fi:0,cat:'Αυγά/Γαλακτ.',en:'Halloumi (raw)',ru:'Халуми (сырой)',tr:'Hellim (çiğ)'},
'Alambra Λευκό Τυρί Υψηλής Πρωτεΐνης':{k:153,p:24,c:0.7,f:6,fi:0,cat:'Αυγά/Γαλακτ.',en:'Alambra High Protein White Cheese',ru:'Alambra белый сыр высокобелковый',tr:'Alambra Yüksek Proteinli Beyaz Peynir'},
/* Δημητριακά */
'Βρώμη (ωμή)':{k:389,p:17,c:66,f:7,fi:10.6,cat:'Δημητριακά',en:'Oats (raw)',ru:'Овсянка (сырая)',tr:'Yulaf (çiğ)'},
'Ρύζι άσπρο (βρ.)':{k:130,p:2.4,c:28,f:0.3,fi:0.4,cat:'Δημητριακά',en:'White Rice (cooked)',ru:'Белый рис (варёный)',tr:'Beyaz Pirinç (pişmiş)'},
'Ρύζι καστανό (βρ.)':{k:123,p:2.6,c:25,f:1,fi:1.8,cat:'Δημητριακά',en:'Brown Rice (cooked)',ru:'Бурый рис (варёный)',tr:'Esmer Pirinç (pişmiş)'},
'Κινόα (βρ.)':{k:120,p:4.1,c:21,f:1.9,fi:2.8,cat:'Δημητριακά',en:'Quinoa (cooked)',ru:'Киноа (варёная)',tr:'Kinoa (pişmiş)'},
'Μακαρόνια (βρ.)':{k:158,p:5.8,c:30,f:0.9,fi:1.8,cat:'Δημητριακά',en:'Pasta (cooked)',ru:'Макароны (варёные)',tr:'Makarna (pişmiş)'},
'Noodles αυγού (M&S)':{k:132,p:5,c:26.1,f:0.6,fi:1.3,cat:'Δημητριακά',en:'Egg Noodles (M&S)',ru:'Яичная лапша (M&S)',tr:'Yumurtalı Erişte (M&S)'},
'Κριθαράκι (βρ.)':{k:158,p:5.8,c:31,f:0.9,fi:1.8,cat:'Δημητριακά',en:'Orzo (cooked)',ru:'Критараки (варёное)',tr:'Arpa Şehriye (pişmiş)'},
'Πλιγούρι (βρ.)':{k:83,p:3,c:19,f:0.2,fi:3.7,cat:'Δημητριακά',en:'Bulgur (cooked)',ru:'Булгур (варёный)',tr:'Bulgur (pişmiş)'},
'Ψωμί σίκαλης':{k:250,p:8.5,c:48,f:3.3,fi:6.2,cat:'Δημητριακά',en:'Rye Bread',ru:'Ржаной хлеб',tr:'Çavdar Ekmeği'},
'Ψωμί λευκό':{k:265,p:9,c:49,f:3.2,fi:2.7,cat:'Δημητριακά',en:'White Bread',ru:'Белый хлеб',tr:'Beyaz Ekmek'},
// ✅ 2026-08-27: Ψωμί προζύμης — μακροθρεπτικά από USDA FoodData Central SR Legacy FDC 172675
// ("Bread, french or vienna, includes sourdough" — το πλησιέστερο επίσημο προφίλ, βάση λευκού αλευριού):
// 272kcal, 10.7g πρωτ., 51.9g υδατ., 2.4g λίπος, 2.2g ίνες ανά 100g.
'Ψωμί προζύμης':{k:272,p:10.7,c:51.9,f:2.4,fi:2.2,cat:'Δημητριακά',en:'Sourdough Bread',ru:'Хлеб на закваске',tr:'Ekşi Mayalı Ekmek'},
'Ψωμάκι Brioche':{k:321,p:10.5,c:49.2,f:7.5,fi:2.7,cat:'Δημητριακά',en:'Brioche Bun',ru:'Булочка бриошь',tr:'Brioş'},
'Ψωμάκι Μπιφτεκιού':{k:284,p:9.86,c:49.01,f:4.55,fi:3.86,cat:'Δημητριακά',en:'Burger Bun',ru:'Булочка для бургера',tr:'Hamburger Ekmeği'},
'Πίτα αραβική':{k:266,p:9,c:54,f:1.2,fi:1.7,cat:'Δημητριακά',en:'Pita Bread',ru:'Питта (арабская лепёшка)',tr:'Pide Ekmeği'},
'Κυπριακή πίτα':{k:270,p:8,c:55,f:2,fi:2.0,cat:'Δημητριακά',en:'Cypriot Pita',ru:'Кипрская питта',tr:'Kıbrıs Pidesi'},
'Τορτίλια (large)':{k:310,p:8,c:52,f:8,fi:3.0,cat:'Δημητριακά',en:'Tortilla (large)',ru:'Тортилья (большая)',tr:'Tortilla (büyük)'},
'Τορτίλια ολικής άλεσης (Alphamega)':{k:309,p:7.6,c:50,f:7.7,fi:4.7,cat:'Δημητριακά',en:'Whole Wheat Tortilla (Alphamega)',ru:'Тортилья цельнозерновая (Alphamega)',tr:'Tam Buğday Tortilla (Alphamega)'},
'Ρυζογκοφρέτες':{k:387,p:8,c:83,f:3,fi:4.4,cat:'Δημητριακά',en:'Rice Cakes',ru:'Рисовые хлебцы',tr:'Pirinç Keki'},
'Μούσλι':{k:350,p:10,c:62,f:6,fi:7.7,cat:'Δημητριακά',en:'Muesli',ru:'Мюсли',tr:'Müsli'},
'Ψωμί ολικής άλεσης':{k:247,p:8.7,c:41,f:3.5,fi:6.8,cat:'Δημητριακά',en:'Whole Wheat Bread',ru:'Цельнозерновой хлеб',tr:'Tam Buğday Ekmeği'},
'Ψωμί ολικής άλεσης (φρυγανισμένο)':{k:300,p:11,c:50,f:4,fi:8,cat:'Δημητριακά',en:'Whole Wheat Bread (toasted)',ru:'Цельнозерновой хлеб (тост)',tr:'Tam Buğday Ekmeği (kızarmış)'},
'Κρίθινο παξιμάδι':{k:341,p:10,c:72,f:2.5,fi:6.5,cat:'Δημητριακά',en:'Barley Rusk',ru:'Ячменный сухарь',tr:'Arpa Peksimeti'},
'Κους κους (βρ.)':{k:112,p:3.8,c:23,f:0.2,fi:1.4,cat:'Δημητριακά',en:'Couscous (cooked)',ru:'Кускус (варёный)',tr:'Kuskus (pişmiş)'},
'Σπαγγέτι ολικής (βρ.)':{k:124,p:5.3,c:25,f:0.8,fi:3.9,cat:'Δημητριακά',en:'Whole Wheat Spaghetti (cooked)',ru:'Спагетти цельнозерновые (варёные)',tr:'Tam Buğday Spagetti (pişmiş)'},
'Τραχανάς (βρ.)':{k:87,p:3.2,c:17,f:0.8,fi:2.1,cat:'Δημητριακά',en:'Trahana (cooked)',ru:'Траханас (варёный)',tr:'Trahana (pişmiş)'},
'Φρυγανιές':{k:385,p:9.5,c:74,f:4,fi:3.5,cat:'Δημητριακά',en:'Rusks',ru:'Сухарики',tr:'Peksimet'},
'Wasa Φρυγανιές Σίκαλης':{k:336,p:9,c:62,f:1.5,fi:19,cat:'Δημητριακά',en:'Wasa Rye Crispbread',ru:'Wasa ржаные хлебцы',tr:'Wasa Çavdar Gevrek Ekmeği'},
'Dark Rye Crispbread (Ryvita)':{k:349,p:10.6,c:67.5,f:0.9,fi:14.3,cat:'Δημητριακά',en:'Dark Rye Crispbread (Ryvita)',ru:'Ryvita тёмные ржаные хлебцы',tr:'Ryvita Koyu Çavdar Gevrek Ekmeği'},
'Κράκερ ολικής':{k:431,p:10,c:68,f:13,fi:8.5,cat:'Δημητριακά',en:'Whole Wheat Crackers',ru:'Цельнозерновые крекеры',tr:'Tam Buğday Kraker'},
'Popcorn (αέρας)':{k:387,p:12.9,c:77.8,f:4.5,fi:14.5,cat:'Δημητριακά',en:'Popcorn (air-popped)',ru:'Попкорн (без масла)',tr:'Patlamış Mısır (havada patlatılmış)'},
/* Όσπρια (βρασμένα) — εξαιρετικές πηγές φυτικών ινών */
'Φασόλια':{k:127,p:9,c:23.7,f:0.5,fi:6.3,cat:'Όσπρια',en:'Beans',ru:'Фасоль',tr:'Fasulye'},
'Ρεβίθια':{k:164,p:9,c:27.4,f:2.6,fi:7.6,cat:'Όσπρια',en:'Chickpeas',ru:'Нут',tr:'Nohut'},
'Φακές':{k:116,p:9,c:20.1,f:0.4,fi:7.9,cat:'Όσπρια',en:'Lentils',ru:'Чечевица',tr:'Mercimek'},
'Μαυρομάτικα':{k:116,p:7.7,c:21,f:0.5,fi:6.5,cat:'Όσπρια',en:'Black-eyed Peas',ru:'Чёрноглазая фасоль',tr:'Börülce'},
'Φάβα':{k:118,p:8.3,c:21,f:0.4,fi:8.3,cat:'Όσπρια',en:'Yellow Split Peas',ru:'Жёлтый колотый горох (фава)',tr:'Sarı Bakla (Fava)'},
'Γίγαντες (βρ.)':{k:119,p:8.2,c:21.5,f:0.4,fi:5.8,cat:'Όσπρια',en:'Giant Beans (cooked)',ru:'Гигантская фасоль (варёная)',tr:'İri Fasulye (pişmiş)'},
'Κουκιά (βρ.)':{k:110,p:7.6,c:19.7,f:0.5,fi:5.4,cat:'Όσπρια',en:'Fava Beans (cooked)',ru:'Бобы (варёные)',tr:'Bakla (pişmiş)'},
'Αρακάς (βρ.)':{k:84,p:5.4,c:15.6,f:0.2,fi:5.5,cat:'Όσπρια',en:'Green Peas (cooked)',ru:'Зелёный горошек (варёный)',tr:'Bezelye (pişmiş)'},
'Φακές κόκκινες (βρ.)':{k:116,p:9,c:19.9,f:0.4,fi:3.4,cat:'Όσπρια',en:'Red Lentils (cooked)',ru:'Красная чечевица (варёная)',tr:'Kırmızı Mercimek (pişmiş)'},
'Λούπινα (βρ.)':{k:119,p:15.6,c:9.9,f:2.9,fi:2.8,cat:'Όσπρια',en:'Lupini Beans (cooked)',ru:'Люпин (варёный)',tr:'Acı Bakla (pişmiş)'},
'Κανελλίνι (βρ.)':{k:127,p:8.7,c:22.6,f:0.5,fi:6.3,cat:'Όσπρια',en:'Cannellini Beans (cooked)',ru:'Фасоль каннеллини (варёная)',tr:'Cannellini Fasulyesi (pişmiş)'},
'Φασόλια μπορλότι (βρ.)':{k:120,p:8.5,c:21.5,f:0.5,fi:6.5,cat:'Όσπρια',en:'Borlotti Beans (cooked)',ru:'Фасоль борлотти (варёная)',tr:'Borlotti Fasulyesi (pişmiş)'},
'Tofu (φυσικό)':{k:76,p:8,c:1.9,f:4.8,fi:0.3,cat:'Όσπρια',en:'Tofu (plain)',ru:'Тофу (натуральный)',tr:'Tofu (sade)'},
'Edamame (βρ.)':{k:121,p:11,c:8.9,f:5,fi:5.2,cat:'Όσπρια',en:'Edamame (cooked)',ru:'Эдамаме (варёные)',tr:'Edamame (pişmiş)'},
'Beyond Beef (φυτικός κιμάς)':{k:221,p:17.7,c:6.2,f:15.9,fi:1.2,cat:'Όσπρια',en:'Beyond Beef (plant-based mince)',ru:'Beyond Beef (растительный фарш)',tr:'Beyond Beef (bitkisel kıyma)'},
/* Λαχανικά */
'Αγγούρι':{k:16,p:0.7,c:3.6,f:0.1,fi:0.5,cat:'Λαχανικά',en:'Cucumber',ru:'Огурец',tr:'Salatalık'},
'Γλυκοπατάτα':{k:86,p:1.6,c:20,f:0.1,fi:3.0,cat:'Λαχανικά',en:'Sweet Potato',ru:'Сладкий картофель (батат)',tr:'Tatlı Patates'},
'Καρότα':{k:41,p:0.9,c:10,f:0.2,fi:2.8,cat:'Λαχανικά',en:'Carrots',ru:'Морковь',tr:'Havuç'},
'Κολοκυθάκια':{k:17,p:1.2,c:3.1,f:0.3,fi:1.0,cat:'Λαχανικά',en:'Zucchini',ru:'Кабачки',tr:'Kabak'},
'Καλαμπόκι (ολόκληρο στον ατμό 200g)':{k:172,p:6.6,c:38,f:2.2,fi:4.8,cat:'Λαχανικά',en:'Corn on the Cob (steamed, 200g)',ru:'Кукуруза в початках (на пару, 200г)',tr:'Mısır Koçanı (buharda, 200g)'},
'Καλαμπόκι (ολόκληρο στον ατμό 400g - Halvatzis)':{k:344,p:13.2,c:76,f:4.4,fi:9.6,cat:'Λαχανικά',en:'Corn on the Cob (steamed, 400g - Halvatzis)',ru:'Кукуруза в початках (на пару, 400г - Halvatzis)',tr:'Mısır Koçanı (buharda, 400g - Halvatzis)'},
'Κουνουπίδι':{k:25,p:1.9,c:5,f:0.3,fi:2.0,cat:'Λαχανικά',en:'Cauliflower',ru:'Цветная капуста',tr:'Karnabahar'},
'Μανιτάρια':{k:22,p:3.1,c:3.3,f:0.3,fi:1.0,cat:'Λαχανικά',en:'Mushrooms',ru:'Грибы',tr:'Mantar'},
'Μαρούλι':{k:15,p:1.4,c:2.9,f:0.2,fi:1.3,cat:'Λαχανικά',en:'Lettuce',ru:'Салат латук',tr:'Marul'},
'Μπιζέλια (βραστά/ατμού)':{k:84,p:5.4,c:15.6,f:0.2,fi:5.5,cat:'Λαχανικά',en:'Green Peas (boiled/steamed)',ru:'Зелёный горошек (варёный/на пару)',tr:'Bezelye (haşlanmış/buharda)'},
'Μελιτζάνες':{k:25,p:1,c:5.9,f:0.2,fi:3.0,cat:'Λαχανικά',en:'Eggplant',ru:'Баклажаны',tr:'Patlıcan'},
'Μπρόκολο':{k:34,p:2.8,c:6.6,f:0.4,fi:2.6,cat:'Λαχανικά',en:'Broccoli',ru:'Брокколи',tr:'Brokoli'},
'Πατάτες':{k:87,p:2,c:20,f:0.1,fi:2.2,cat:'Λαχανικά',en:'Potatoes',ru:'Картофель',tr:'Patates'},
'Πιπεριές':{k:26,p:1,c:6,f:0.3,fi:2.1,cat:'Λαχανικά',en:'Bell Peppers',ru:'Болгарский перец',tr:'Dolmalık Biber'},
'Πιπεριά κόκκινη':{k:30,p:1,c:7,f:0.3,fi:2.1,cat:'Λαχανικά',en:'Red Bell Pepper',ru:'Красный перец',tr:'Kırmızı Biber'},
'Πιπεριά κίτρινη':{k:30,p:1,c:7,f:0.3,fi:2.1,cat:'Λαχανικά',en:'Yellow Bell Pepper',ru:'Жёлтый перец',tr:'Sarı Biber'},
'Σάλσα κόκκινη':{k:20,p:0.8,c:4,f:0.2,fi:0.8,cat:'Λαχανικά',en:'Red Salsa',ru:'Красная сальса',tr:'Kırmızı Salsa'},
'Σπανάκι':{k:23,p:2.9,c:3.6,f:0.4,fi:2.2,cat:'Λαχανικά',en:'Spinach',ru:'Шпинат',tr:'Ispanak'},
'Σέσκουλα':{k:19,p:1.8,c:3.7,f:0.2,fi:1.6,cat:'Λαχανικά',en:'Swiss Chard',ru:'Мангольд',tr:'Pazı'},
'Παντζάρι (βραστό)':{k:44,p:1.7,c:10,f:0.2,fi:2,cat:'Λαχανικά',en:'Beetroot',ru:'Свёкла (варёная)',tr:'Pancar (haşlanmış)'},
'Παντζάρι (ωμό)':{k:43,p:1.6,c:9.6,f:0.2,fi:2.8,cat:'Λαχανικά',en:'Beetroot (raw)',ru:'Свёкла (сырая)',tr:'Pancar (çiğ)'},
'Σπαράγγια':{k:20,p:2.2,c:3.9,f:0.2,fi:2.1,cat:'Λαχανικά',en:'Asparagus',ru:'Спаржа',tr:'Kuşkonmaz'},
'Τομάτες':{k:18,p:0.9,c:3.9,f:0.2,fi:1.2,cat:'Λαχανικά',en:'Tomatoes',ru:'Помидоры',tr:'Domates'},
'Φασολάκια':{k:35,p:1.9,c:7.9,f:0.2,fi:3.4,cat:'Λαχανικά',en:'Green Beans',ru:'Стручковая фасоль',tr:'Taze Fasulye'},
'Σαλάτα εποχής':{k:18,p:1,c:3.5,f:0.2,fi:1.5,cat:'Λαχανικά',en:'Seasonal Salad',ru:'Сезонный салат',tr:'Mevsim Salatası'},
/* Φρούτα */
'Μήλο':{k:52,p:0.3,c:14,f:0.2,fi:2.4,cat:'Φρούτα',en:'Apple',ru:'Яблоко',tr:'Elma'},
'Μπανάνα':{k:89,p:1.1,c:23,f:0.3,fi:2.6,cat:'Φρούτα',en:'Banana',ru:'Банан',tr:'Muz'},
'Πορτοκάλι':{k:47,p:0.9,c:12,f:0.1,fi:2.4,cat:'Φρούτα',en:'Orange',ru:'Апельсин',tr:'Portakal'},
'Φράουλες':{k:32,p:0.7,c:7.7,f:0.3,fi:2.0,cat:'Φρούτα',en:'Strawberries',ru:'Клубника',tr:'Çilek'},
'Μούρα':{k:43,p:1.4,c:10,f:0.3,fi:5.3,cat:'Φρούτα',en:'Mixed Berries',ru:'Ягоды ассорти',tr:'Karışık Meyveler'},
'Αχλάδι':{k:57,p:0.4,c:15,f:0.1,fi:3.1,cat:'Φρούτα',en:'Pear',ru:'Груша',tr:'Armut'},
'Ροδάκινο':{k:39,p:0.9,c:10,f:0.3,fi:1.5,cat:'Φρούτα',en:'Peach',ru:'Персик',tr:'Şeftali'},
'Κεράσια':{k:63,p:1.06,c:16,f:0.2,fi:2.1,cat:'Φρούτα',en:'Cherries',ru:'Черешня',tr:'Kiraz'},
'Ανανάς':{k:50,p:0.5,c:13,f:0.1,fi:1.4,cat:'Φρούτα',en:'Pineapple',ru:'Ананас',tr:'Ananas'},
'Βερίκοκα':{k:48,p:1.4,c:11,f:0.4,fi:2.0,cat:'Φρούτα',en:'Apricots',ru:'Абрикосы',tr:'Kayısı'},
'Γκρέιπφρούτ':{k:42,p:0.8,c:11,f:0.1,fi:1.6,cat:'Φρούτα',en:'Grapefruit',ru:'Грейпфрут',tr:'Greyfurt'},
'Δαμάσκηνα':{k:46,p:0.7,c:11,f:0.3,fi:1.4,cat:'Φρούτα',en:'Plums',ru:'Сливы',tr:'Erik'},
'Καρπούζι':{k:30,p:0.6,c:8,f:0.2,fi:0.4,cat:'Φρούτα',en:'Watermelon',ru:'Арбуз',tr:'Karpuz'},
'Μανταρίνι':{k:53,p:0.8,c:13,f:0.3,fi:1.8,cat:'Φρούτα',en:'Tangerine',ru:'Мандарин',tr:'Mandalina'},
'Λεμόνι':{k:29,p:1.1,c:9.3,f:0.3,fi:2.8,cat:'Φρούτα',en:'Lemon',ru:'Лимон',tr:'Limon'},
'Νεκταρίνι':{k:44,p:1.1,c:11,f:0.3,fi:1.7,cat:'Φρούτα',en:'Nectarine',ru:'Нектарин',tr:'Nektarin'},
'Πεπόνι':{k:34,p:0.8,c:8,f:0.2,fi:0.9,cat:'Φρούτα',en:'Cantaloupe',ru:'Дыня',tr:'Kavun'},
'Σταφίδες':{k:299,p:3.1,c:79,f:0.5,fi:3.7,cat:'Φρούτα',en:'Raisins',ru:'Изюм',tr:'Kuru Üzüm'},
'Σταφύλια':{k:69,p:0.7,c:18,f:0.2,fi:0.9,cat:'Φρούτα',en:'Grapes',ru:'Виноград',tr:'Üzüm'},
'Σύκα φρέσκα':{k:74,p:0.75,c:19.2,f:0.3,fi:2.9,cat:'Φρούτα',en:'Fresh Figs',ru:'Инжир свежий',tr:'Taze İncir'},
'Σύκα ξερά':{k:249,p:3.3,c:63.9,f:0.9,fi:9.8,cat:'Φρούτα',en:'Dried Figs',ru:'Инжир сушёный',tr:'Kuru İncir'},
'Ρόδι':{k:83,p:1.7,c:18.7,f:1.2,fi:4.0,cat:'Φρούτα',en:'Pomegranate',ru:'Гранат',tr:'Nar'},
'Ακτινίδιο':{k:61,p:1.1,c:14.7,f:0.5,fi:3.0,cat:'Φρούτα',en:'Kiwi',ru:'Киви',tr:'Kivi'},
'Χουρμάδες (ξερές)':{k:282,p:2.5,c:75,f:0.4,fi:8.0,cat:'Φρούτα',en:'Dates (dried)',ru:'Финики (сушёные)',tr:'Kuru Hurma'},
'Βύσσινο':{k:50,p:1.0,c:12.2,f:0.3,fi:1.6,cat:'Φρούτα',en:'Sour Cherry',ru:'Вишня',tr:'Vişne'},
'Μπανάνα αποξηραμένη':{k:346,p:3.9,c:88,f:1.8,fi:9.9,cat:'Φρούτα',en:'Dried Banana',ru:'Банан сушёный',tr:'Kuru Muz'},
'Βερίκοκα αποξηραμένα':{k:241,p:3.4,c:62.6,f:0.5,fi:7.3,cat:'Φρούτα',en:'Dried Apricots',ru:'Курага',tr:'Kuru Kayısı'},
'Δαμάσκηνα αποξηραμένα':{k:240,p:2.2,c:64,f:0.4,fi:7.1,cat:'Φρούτα',en:'Prunes',ru:'Чернослив',tr:'Kuru Erik'},
'Cranberries αποξηραμένα':{k:308,p:0.2,c:82.8,f:1.1,fi:5.3,cat:'Φρούτα',en:'Dried Cranberries',ru:'Клюква сушёная',tr:'Kuru Kızılcık'},
'Μάνγκο αποξηραμένο':{k:319,p:2.5,c:79,f:1.2,fi:2.4,cat:'Φρούτα',en:'Dried Mango',ru:'Манго сушёное',tr:'Kuru Mango'},
'Ανανάς αποξηραμένος':{k:350,p:1.25,c:83.8,f:0.7,fi:2.4,cat:'Φρούτα',en:'Dried Pineapple',ru:'Ананас сушёный',tr:'Kuru Ananas'},
'Μήλο αποξηραμένο':{k:243,p:0.9,c:65.9,f:0.3,fi:8.7,cat:'Φρούτα',en:'Dried Apple',ru:'Яблоко сушёное',tr:'Kuru Elma'},
/* Ξηροί καρποί / Σπόροι / Λάδια */
'Αμύγδαλα':{k:579,p:21,c:22,f:50,fi:12.5,cat:'Ξηροί καρποί',en:'Almonds',ru:'Миндаль',tr:'Badem'},
'Καρύδια':{k:654,p:15,c:14,f:65,fi:6.7,cat:'Ξηροί καρποί',en:'Walnuts',ru:'Грецкие орехи',tr:'Ceviz'},
'Αβοκάντο':{k:160,p:2,c:9,f:15,fi:6.7,cat:'Ξηροί καρποί',en:'Avocado',ru:'Авокадо',tr:'Avokado'},
'Φυστικοβούτυρο':{k:588,p:25,c:20,f:50,fi:5.7,cat:'Ξηροί καρποί',en:'Peanut Butter',ru:'Арахисовая паста',tr:'Fıstık Ezmesi'},
'Αμυγδαλοβούτυρο':{k:614,p:21,c:21,f:55,fi:10.8,cat:'Ξηροί καρποί',en:'Almond Butter',ru:'Миндальная паста',tr:'Badem Ezmesi'},
'Chia seeds':{k:486,p:17,c:42,f:31,fi:34.4,cat:'Ξηροί καρποί',en:'Chia Seeds',ru:'Семена чиа',tr:'Chia Tohumu'},
'Σκόνη κακάο':{k:228,p:19.6,c:57.9,f:13.7,fi:33,cat:'Ξηροί καρποί',en:'Cocoa Powder',ru:'Какао-порошок',tr:'Kakao Tozu'},
'Ταχίνι':{k:595,p:17,c:23,f:54,fi:9.3,cat:'Ξηροί καρποί',en:'Tahini',ru:'Тахини',tr:'Tahin'},
'Κάσιους':{k:553,p:18,c:30,f:44,fi:3.3,cat:'Ξηροί καρποί',en:'Cashews',ru:'Кешью',tr:'Kaju'},
'Φιστίκια Αιγίνης':{k:562,p:20.2,c:28,f:45.4,fi:10.3,cat:'Ξηροί καρποί',en:'Aegina Pistachios',ru:'Фисташки (Эгина)',tr:'Egina Antep Fıstığı'},
'Φουντούκια':{k:628,p:15,c:17,f:60.8,fi:9.7,cat:'Ξηροί καρποί',en:'Hazelnuts',ru:'Фундук',tr:'Fındık'},
'Κολοκυθόσποροι':{k:559,p:30,c:10.7,f:49,fi:6.0,cat:'Ξηροί καρποί',en:'Pumpkin Seeds',ru:'Тыквенные семечки',tr:'Kabak Çekirdeği'},
'Ηλιόσποροι':{k:584,p:20.8,c:20,f:51.5,fi:8.6,cat:'Ξηροί καρποί',en:'Sunflower Seeds',ru:'Семечки подсолнуха',tr:'Ayçiçeği Çekirdeği'},
'USN Trust Crunch Bar':{k:355,p:33,c:27,f:14,fi:12,cat:'Ξηροί καρποί',en:'USN Trust Crunch Bar',ru:'USN Trust Crunch (батончик)',tr:'USN Trust Crunch Bar'},
'Σουσάμι':{k:573,p:17.7,c:23.5,f:49.7,fi:11.8,cat:'Ξηροί καρποί',en:'Sesame Seeds',ru:'Кунжут',tr:'Susam'},
'Λιναρόσπορος':{k:534,p:18.3,c:28.9,f:42.2,fi:27.3,cat:'Ξηροί καρποί',en:'Flaxseed',ru:'Семена льна',tr:'Keten Tohumu'},
'Ελαιόλαδο':{k:884,p:0,c:0,f:100,fi:0,cat:'Λάδια',en:'Olive Oil',ru:'Оливковое масло',tr:'Zeytinyağı'},
'Ελιές':{k:115,p:0.8,c:6.3,f:10.7,fi:3.3,cat:'Λάδια',en:'Olives',ru:'Оливки',tr:'Zeytin'},
/* ── Καρυκεύματα, βότανα & σάλτσες (μικρές μερίδες, μεγάλη γεύση) ── */
/* Σημ.: το 'Σκόρδο' ορίζεται ήδη παρακάτω ως 'Λαχανικά' — δεν το ξαναορίζουμε εδώ */
'Βασιλικός (φρέσκος)':{k:23,p:3.2,c:2.7,f:0.6,fi:1.6,cat:'Καρυκεύματα',en:'Basil (fresh)',ru:'Базилик (свежий)',tr:'Fesleğen (taze)'},
'Ρίγανη (ξηρή)':{k:265,p:9,c:69,f:4.3,fi:42.5,cat:'Καρυκεύματα',en:'Oregano (dried)',ru:'Орегано (сушёный)',tr:'Kekik (kuru)'},
'Θυμάρι (φρέσκο)':{k:101,p:5.6,c:24.5,f:1.7,fi:14,cat:'Καρυκεύματα',en:'Thyme (fresh)',ru:'Тимьян (свежий)',tr:'Kekik (taze)'},
'Δυόσμος/Μέντα':{k:70,p:3.8,c:14.9,f:0.9,fi:8,cat:'Καρυκεύματα',en:'Mint',ru:'Мята',tr:'Nane'},
'Άνηθος (φρέσκος)':{k:43,p:3.5,c:7,f:1.1,fi:2.1,cat:'Καρυκεύματα',en:'Dill (fresh)',ru:'Укроп (свежий)',tr:'Dereotu (taze)'},
'Μαϊντανός (φρέσκος)':{k:36,p:3,c:6.3,f:0.8,fi:3.3,cat:'Καρυκεύματα',en:'Parsley (fresh)',ru:'Петрушка (свежая)',tr:'Maydanoz (taze)'},
'Δεντρολίβανο (φρέσκο)':{k:131,p:3.3,c:20.7,f:5.9,fi:14.1,cat:'Καρυκεύματα',en:'Rosemary (fresh)',ru:'Розмарин (свежий)',tr:'Biberiye (taze)'},
'Κύμινο':{k:375,p:18,c:44,f:22,fi:10.5,cat:'Καρυκεύματα',en:'Cumin',ru:'Зира (кумин)',tr:'Kimyon'},
'Πάπρικα':{k:282,p:14,c:54,f:13,fi:35,cat:'Καρυκεύματα',en:'Paprika',ru:'Паприка',tr:'Kırmızı Toz Biber'},
'Μουστάρδα':{k:66,p:4,c:5,f:3.3,fi:3.3,cat:'Καρυκεύματα',en:'Mustard',ru:'Горчица',tr:'Hardal'},
'Βαλσάμικο ξίδι':{k:88,p:0.5,c:17,f:0,fi:0,cat:'Καρυκεύματα',en:'Balsamic Vinegar',ru:'Бальзамический уксус',tr:'Balzamik Sirke'},
'Σάλτσα γιαουρτιού-άνηθου':{k:60,p:4,c:5,f:2.5,fi:0.2,cat:'Καρυκεύματα',en:'Yogurt-Dill Sauce',ru:'Соус йогуртово-укропный',tr:'Yoğurt-Dereotu Sosu'},
'Πέστο βασιλικού':{k:300,p:5,c:6,f:29,fi:2,cat:'Καρυκεύματα',en:'Basil Pesto',ru:'Соус песто базиликовый',tr:'Fesleğen Pesto'},
'Σάλτσα ντομάτας (μαγειρεμένη)':{k:32,p:1.6,c:7,f:0.2,fi:1.5,cat:'Καρυκεύματα',en:'Tomato Sauce (cooked)',ru:'Томатный соус (варёный)',tr:'Domates Sosu (pişmiş)'},
'Ταχινοσάλτσα λεμονιού':{k:200,p:6,c:8,f:17,fi:3,cat:'Καρυκεύματα',en:'Lemon Tahini Sauce',ru:'Соус тахини с лимоном',tr:'Limonlu Tahin Sosu'},
'Σάλτσα λεμονιού-ελαιολάδου (λαδολέμονο)':{k:240,p:0.2,c:2,f:26,fi:0.2,cat:'Καρυκεύματα',en:'Lemon-Olive Oil Sauce (Ladolemono)',ru:'Соус лимон-оливковое масло (ладолемоно)',tr:'Limon-Zeytinyağı Sosu (Ladolemono)'},
'Τζατζίκι':{k:75,p:3.5,c:4,f:4.8,fi:0.3,cat:'Καρυκεύματα',en:'Tzatziki',ru:'Дзадзики',tr:'Cacık'},
'Σάλτσα σόγιας-μελιού':{k:120,p:3,c:24,f:0.2,fi:0.2,cat:'Καρυκεύματα',en:'Soy-Honey Sauce',ru:'Соус соево-медовый',tr:'Soya-Bal Sosu'},
/* ── Συνταγές feedyourhealth.org ── macros per 100g (calculated from ingredients) */
'Αυγολέμονο Κυπριακό':{k:82,p:7,c:8,f:3.5,fi:0.4,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Cypriot Avgolemono',ru:'Кипрское авголемоно',tr:'Kıbrıs Usulü Avgolemono'},
'Korean Beef Bowl':{k:149,p:11.8,c:17.7,f:3.9,fi:1.5,cat:'Συνταγές FYH',containsCats:['Κρέας'],en:'Korean Beef Bowl',ru:'Корейский боул с говядиной',tr:'Kore Usulü Etli Bowl'},
'Chicken Lettuce Wraps':{k:138,p:22,c:4.4,f:3,fi:1.5,cat:'Συνταγές FYH',containsCats:['Κρέας'],en:'Chicken Lettuce Wraps',ru:'Куриные роллы в листьях салата',tr:'Marul Sarma (Tavuklu)'},
'Κοτόπουλο Pesto & Φέτα':{k:200,p:24,c:1.3,f:10,fi:0.5,cat:'Συνταγές FYH',containsCats:['Κρέας','Αυγά/Γαλακτ.'],en:'Chicken Pesto & Feta',ru:'Курица с песто и фетой',tr:'Pestolu ve Fetalı Tavuk'},
// Still genuinely ambiguous, no ingredients found anywhere in this file — flagged, not tagged:
'Pancakes Κυριακής (FYH)':{k:188,p:13,c:19,f:6,fi:1.5,cat:'Συνταγές FYH',en:'Sunday Pancakes (FYH)',ru:'Воскресные панкейки (FYH)',tr:'Pazar Pankekleri (FYH)'},
'Βρώμη Πρωινού (FYH)':{k:125,p:5,c:17,f:5,fi:4.0,cat:'Συνταγές FYH',en:'Morning Oatmeal (FYH)',ru:'Утренняя овсянка (FYH)',tr:'Sabah Yulafı (FYH)'}, // CLEAN 2026-07-30 — almond milk only, no dairy/egg (see FYH_RECIPE_EXPAND)
'Fajita Wrap Κοτόπουλο':{k:157,p:13.2,c:10.7,f:6.7,fi:1.2,cat:'Συνταγές FYH',containsCats:['Κρέας'],en:'Chicken Fajita Wrap',ru:'Ролл фахита с курицей',tr:'Tavuklu Fajita Wrap'},
'Πρωινό Αυγών (FYH)':{k:168,p:9,c:12,f:10,fi:0.8,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Egg Breakfast (FYH)',ru:'Яичный завтрак (FYH)',tr:'Yumurtalı Kahvaltı (FYH)'},
'Τοστ Αυγών (FYH)':{k:179,p:11,c:18,f:7,fi:2.2,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Egg Toast (FYH)',ru:'Тост с яйцом (FYH)',tr:'Yumurtalı Tost (FYH)'},
'Γιαούρτι Granola (FYH)':{k:106,p:5,c:17,f:3,fi:3.5,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Yogurt & Granola (FYH)',ru:'Йогурт с гранолой (FYH)',tr:'Yoğurt ve Granola (FYH)'},
'Chia Pudding (FYH)':{k:80,p:3,c:11,f:4,fi:8.0,cat:'Συνταγές FYH',en:'Chia Pudding (FYH)',ru:'Пудинг из чиа (FYH)',tr:'Chia Puding (FYH)'},
'Πίτα Αυγών (FYH)':{k:147,p:9,c:11,f:8,fi:1.8,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Egg Pita (FYH)',ru:'Питта с яйцом (FYH)',tr:'Yumurtalı Pide (FYH)'},
// containsCats resolved 2026-07-30 from the real ingredient breakdown in FYH_RECIPE_EXPAND below
// (was previously left untagged/ambiguous, no ingredients visible from this object alone):
'Green Protein Smoothie (FYH)':{k:81,p:8,c:6,f:3,fi:2.5,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Green Protein Smoothie (FYH)',ru:'Зелёный протеиновый смузи (FYH)',tr:'Yeşil Proteinli Smoothie (FYH)'}, // whey protein powder
'Berry Protein Smoothie (FYH)':{k:131,p:16,c:12,f:3,fi:3.5,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Berry Protein Smoothie (FYH)',ru:'Ягодный протеиновый смузи (FYH)',tr:'Meyveli Proteinli Smoothie (FYH)'}, // real yogurt + whey
'Protein Pancakes (FYH)':{k:141,p:10.6,c:14.3,f:3.8,fi:2.0,cat:'Συνταγές FYH',en:'Protein Pancakes (FYH)',ru:'Протеиновые панкейки (FYH)',tr:'Proteinli Pankek (FYH)'},
'Σαλάτα Φακής Μεσογειακή':{k:110,p:5.4,c:8.8,f:5.6,fi:5.5,cat:'Συνταγές FYH',en:'Mediterranean Lentil Salad',ru:'Средиземноморский салат с чечевицей',tr:'Akdeniz Usulü Mercimek Salatası'},
'Μπουλγκούρ-Κινόα Κοτόπουλο':{k:175,p:11.5,c:13,f:6,fi:3.0,cat:'Συνταγές FYH',containsCats:['Κρέας'],en:'Bulgur-Quinoa Chicken',ru:'Курица с булгуром и киноа',tr:'Bulgur-Kinoalı Tavuk'},
'Ψάρι στο Φούρνο (FYH)':{k:165,p:19,c:0,f:10,fi:0.8,cat:'Συνταγές FYH',containsCats:['Ψάρια'],en:'Baked Fish (FYH)',ru:'Рыба в духовке (FYH)',tr:'Fırında Balık (FYH)'},
'Ρύζι-Φακές Stir Fry':{k:159,p:7.8,c:29,f:2.2,fi:3.5,cat:'Συνταγές FYH',en:'Rice-Lentil Stir Fry',ru:'Рис с чечевицей стир-фрай',tr:'Pirinç-Mercimek Sote'},
'Γκρανόλα χωρίς ζάχαρη':{k:484,p:9,c:55,f:26,fi:8.0,cat:'Συνταγές FYH',en:'Sugar-Free Granola',ru:'Гранола без сахара',tr:'Şekersiz Granola'},
'Μπανανόψωμο':{k:285,p:5.5,c:40,f:11,fi:2.5,cat:'Συνταγές FYH',en:'Banana Bread',ru:'Банановый хлеб',tr:'Muzlu Kek'},
'Muffins Μύρτιλου':{k:220,p:5.8,c:30,f:8,fi:2.5,cat:'Συνταγές FYH',en:'Blueberry Muffins',ru:'Маффины с черникой',tr:'Yaban Mersinli Muffin'},
'Dark Choc Oat Bites':{k:268,p:8.5,c:34,f:12,fi:4.5,cat:'Συνταγές FYH',en:'Dark Choc Oat Bites',ru:'Овсяные шарики с тёмным шоколадом',tr:'Bitter Çikolatalı Yulaf Topları'},
'PB Coconut Truffles':{k:430,p:8,c:28,f:34,fi:3.0,cat:'Συνταγές FYH',en:'PB Coconut Truffles',ru:'Трюфели арахис-кокос',tr:'Fıstık Ezmeli Hindistan Cevizi Trüfü'},
'Energy Bites (FYH)':{k:360,p:7,c:58,f:12,fi:5.5,cat:'Συνταγές FYH',en:'Energy Bites (FYH)',ru:'Энергетические шарики (FYH)',tr:'Enerji Topları (FYH)'},
'PB Protein Bars':{k:370,p:15,c:35,f:19,fi:3.5,cat:'Συνταγές FYH',en:'PB Protein Bars',ru:'Протеиновые батончики с арахисовой пастой',tr:'Fıstık Ezmeli Protein Bar'},
// ✅ 2026-08-27: CrudeSnacks Endurance Bar & Ultra Bar (brand: CrudeSnacks· τηρούνται στην κατηγορία 'Συνταγές FYH') — μακροθρεπτικά ανά 100g από τις επίσημες ετικέτες.
// Endurance: μπάρα 40g → 158kcal, 2.5g πρωτ., 30.2g υδατ. (19.2g σάκχ.), 2.5g λίπος, 2.7g ίνες → ×2.5 για 100g.
// Ultra: μπάρα 68g → Φράουλα/Τζίντζερ 279kcal·10.2P·40.9C·9.6F·4.1fi | Σοκολάτα 277kcal·10.2P·40.5C·9.6F·4.2fi → ×(100/68).
// Και τα 4: vegan, dairy-free, χωρίς πρόσθετη ζάχαρη. Περιέχουν βρώμη (→ QUICK_EXCL Γλουτένη).
// Ultra επιπλέον: φυστικοβούτυρο (→ Ξηροί καρποί) & απομονωμένη πρωτεΐνη σόγιας (→ Όσπρια).
'Endurance Bar Φράουλα (CrudeSnacks)':{k:395,p:6.3,c:75.5,f:6.3,fi:6.8,cat:'Συνταγές FYH',en:'Endurance Bar Strawberry (CrudeSnacks)',ru:'Endurance Bar «Клубника» (CrudeSnacks)',tr:'Endurance Bar Çilek (CrudeSnacks)'},
'Endurance Bar Σοκολάτα (CrudeSnacks)':{k:395,p:6.3,c:75.5,f:6.3,fi:6.8,cat:'Συνταγές FYH',en:'Endurance Bar Chocolate (CrudeSnacks)',ru:'Endurance Bar «Шоколад» (CrudeSnacks)',tr:'Endurance Bar Çikolata (CrudeSnacks)'},
'Ultra Bar Φράουλα & Τζίντζερ (CrudeSnacks)':{k:410,p:15,c:60.1,f:14.1,fi:6,cat:'Συνταγές FYH',en:'Ultra Bar Strawberries & Ginger (CrudeSnacks)',ru:'Ultra Bar «Клубника и имбирь» (CrudeSnacks)',tr:'Ultra Bar Çilek & Zencefil (CrudeSnacks)'},
'Ultra Bar Σοκολάτα (CrudeSnacks)':{k:407,p:15,c:59.6,f:14.1,fi:6.2,cat:'Συνταγές FYH',en:'Ultra Bar Chocolate (CrudeSnacks)',ru:'Ultra Bar «Шоколад» (CrudeSnacks)',tr:'Ultra Bar Çikolata (CrudeSnacks)'},
'Σάλτσα Ντομάτας (FYH)':{k:133,p:1.2,c:8,f:11,fi:1.3,cat:'Συνταγές FYH',en:'FYH Tomato Sauce',ru:'Томатный соус (FYH)',tr:'Domates Sosu (FYH)'},
// Petretzeakis Breakfast Recipes
'Breakfast Burrito (Πετρετζίκης)':{k:420,p:18,c:48,f:16,fi:4.5,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Breakfast Burrito (Petretzikis)',ru:'Буррито на завтрак (Petretzikis)',tr:'Kahvaltı Burritosu (Petretzikis)'}, // real eggs + Κασέρι cheese
'Chia Bowl Φράουλα (Πετρετζίκης)':{k:385,p:15,c:52,f:12,fi:8.0,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Strawberry Chia Bowl (Petretzikis)',ru:'Чиа-боул с клубникой (Petretzikis)',tr:'Çilekli Chia Bowl (Petretzikis)'}, // real yogurt
// Confirmed CLEAN 2026-07-30 (uses Γάλα αμυγδάλου/almond milk, no real dairy or egg) — no tag needed:
'Overnight Oats Banoffee (Πετρετζίκης)':{k:430,p:13,c:54,f:18,fi:7.0,cat:'Συνταγές FYH',en:'Banoffee Overnight Oats (Petretzikis)',ru:'Овсянка на ночь баноффи (Petretzikis)',tr:'Banoffee Gecelik Yulaf (Petretzikis)'},
'Overnight Oats Black Forest (Πετρετζίκης)':{k:425,p:18,c:56,f:12,fi:8.0,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Black Forest Overnight Oats (Petretzikis)',ru:'Овсянка на ночь «Чёрный лес» (Petretzikis)',tr:'Black Forest Gecelik Yulaf (Petretzikis)'}, // real whole milk + whey
'Overnight Oats P.B. & Choco (Πετρετζίκης)':{k:470,p:16,c:55,f:20,fi:8.0,cat:'Συνταγές FYH',en:'P.B. & Choco Overnight Oats (Petretzikis)',ru:'Овсянка на ночь арахис-шоколад (Petretzikis)',tr:'Fıstık Ezmeli & Çikolatalı Gecelik Yulaf (Petretzikis)'}, // almond milk, clean
'Αυγά Ποσέ Air Fryer (Πετρετζίκης)':{k:370,p:16,c:38,f:18,fi:6.0,cat:'Συνταγές FYH',containsCats:['Αυγά/Γαλακτ.'],en:'Air Fryer Poached Eggs (Petretzikis)',ru:'Яйца пашот в аэрофритюрнице (Petretzikis)',tr:'Air Fryer\'da Çılbır (Petretzikis)'},
'Ομελέτα Γαλοπούλα & Λαχ. (Πετρετζίκης)':{k:360,p:32,c:20,f:15,fi:3.0,cat:'Συνταγές FYH',containsCats:['Κρέας','Αυγά/Γαλακτ.'],en:'Turkey & Veggie Omelette (Petretzikis)',ru:'Омлет с индейкой и овощами (Petretzikis)',tr:'Hindili ve Sebzeli Omlet (Petretzikis)'},
// Main Course Recipes - Petretzeakis
'Λιγκουίνι με Γαρίδες (Πετρετζίκης)':{k:589,p:31,c:65,f:22,fi:4.8,cat:'Συνταγές FYH',containsCats:['Ψάρια'],en:'Linguine with Shrimp (Petretzikis)',ru:'Лингвини с креветками (Petretzikis)',tr:'Karidesli Linguine (Petretzikis)'},
/* Ελληνικά τρόφιμα που πρόσθεσε στη βάση */
'Σαγανάκι (τηγανητό)':{k:380,p:24,c:2,f:31,fi:0,cat:'Αυγά/Γαλακτ.',en:'Saganaki (fried cheese)',ru:'Саганаки (жареный сыр)',tr:'Saganaki (kızarmış peynir)'},
'Γαλακτοπουλο (βρ.)':{k:135,p:25,c:0,f:3,fi:0,cat:'Κρέας',en:'Turkey (boiled)',ru:'Индейка (варёная)',tr:'Hindi (haşlanmış)'},
'Κιμάς κοτόπουλο (μαγ.)':{k:165,p:20,c:0,f:9,fi:0,cat:'Κρέας',en:'Ground Chicken (cooked)',ru:'Куриный фарш (готовый)',tr:'Tavuk Kıyma (pişmiş)'},
'Παστέλι':{k:510,p:15,c:60,f:23,fi:8.0,cat:'Ξηροί καρποί',en:'Pastelli (sesame-honey bar)',ru:'Пастели (кунжутно-медовый батончик)',tr:'Pastelli (susam-bal çubuğu)'},
'Χαλβάς σεσαμιού':{k:512,p:15,c:44,f:31,fi:11.0,cat:'Ξηροί καρποί',en:'Sesame Halva',ru:'Халва кунжутная',tr:'Susam Helvası'},
'Κουμουατ':{k:71,p:1.9,c:16,f:0.9,fi:6.5,cat:'Φρούτα',en:'Kumquat',ru:'Кумкват',tr:'Kumkuat'},
'Ελιές πράσινες':{k:145,p:1,c:3.8,f:15,fi:2.4,cat:'Λαχανικά',en:'Green Olives',ru:'Оливки зелёные',tr:'Yeşil Zeytin'},
'Ελιές μαύρες':{k:165,p:1,c:3.8,f:18,fi:2.4,cat:'Λαχανικά',en:'Black Olives',ru:'Оливки чёрные (маслины)',tr:'Siyah Zeytin'},
'Αγκινάρες (βρ.)':{k:53,p:3,c:10,f:0.1,fi:5.2,cat:'Λαχανικά',en:'Artichokes (cooked)',ru:'Артишоки (варёные)',tr:'Enginar (pişmiş)'},
'Κρεμμύδι':{k:40,p:1.1,c:9,f:0.1,fi:1.7,cat:'Λαχανικά',en:'Onion',ru:'Лук',tr:'Soğan'},
'Σκόρδο':{k:149,p:6.4,c:33,f:0.5,fi:2.1,cat:'Λαχανικά',en:'Garlic',ru:'Чеснок',tr:'Sarımsak'},
'Κέϊλ (βρ.)':{k:28,p:2.2,c:6.7,f:0.4,fi:2.6,cat:'Λαχανικά',en:'Kale (cooked)',ru:'Кале (варёная)',tr:'Kara Lahana (pişmiş)'},
'Ραπανάκι':{k:16,p:0.7,c:3.4,f:0.1,fi:1.6,cat:'Λαχανικά',en:'Radish',ru:'Редис',tr:'Turp'},
'Αγκινάρες καρδιές (κονσ.)':{k:20,p:1.5,c:3.8,f:0.5,fi:2.0,cat:'Λαχανικά',en:'Artichoke Hearts (canned)',ru:'Сердцевины артишоков (консервированные)',tr:'Enginar Kalbi (konserve)'},
'Σούπιες (βρ.)':{k:134,p:25,c:1.6,f:1.4,fi:0,cat:'Ψάρια',en:'Cuttlefish (cooked)',ru:'Каракатица (варёная)',tr:'Mürekkep Balığı (pişmiş)'},
'Γαρίδες γίγαντες (βρ.)':{k:115,p:27,c:0,f:0.5,fi:0,cat:'Ψάρια',en:'Jumbo Shrimp (cooked)',ru:'Королевские креветки (варёные)',tr:'Jumbo Karides (pişmiş)'},
'Καβούρι (βρ.)':{k:89,p:19,c:0,f:0.7,fi:0,cat:'Ψάρια',en:'Crab (cooked)',ru:'Краб (варёный)',tr:'Yengeç (pişmiş)'},
'Καλαμαράκια (ψητά)':{k:170,p:28,c:5.5,f:2.5,fi:0,cat:'Ψάρια',en:'Baby Squid (grilled)',ru:'Мини-кальмары (гриль)',tr:'Küçük Kalamar (ızgara)'},
'Φιδάκι (ψητό)':{k:116,p:24,c:1.2,f:1,fi:0,cat:'Ψάρια',en:'Garfish (grilled)',ru:'Сарган (гриль)',tr:'Zargana (ızgara)'},
// ✅ 2026-09-01: Κοκκινόψαρο (Sebastes mantella / redfish – ocean perch) — ωμό προφίλ ετικέτας EMA
// Foods (emafoods.com.cy): ανά 100g ωμό 79kcal / 16g πρωτ. / 2g λιπ. (0.3g κορ.) / 0g υδατ. / 0.7g αλάτι.
// Αποθηκεύεται ως ψητό (σύμβαση όπως τα υπόλοιπα ψάρια) — ωμές τιμές × 1.20 συντ. μαγειρέματος
// (ίδιος με Μπακαλιάρο/Φιδάκι, άπαχο λευκό ψάρι): k 79→98, p 16→19.2, f 2→2.4.
'Κοκκινόψαρο (ψητό)':{k:98,p:19.2,c:0,f:2.4,fi:0,cat:'Ψάρια',en:'Redfish (grilled)',ru:'Морской окунь (гриль)',tr:'Kızıl Balık (ızgara)'},
'Λούτζα':{k:243,p:24,c:0.5,f:16,fi:0,cat:'Κρέας',en:'Lountza (cured pork loin)',ru:'Лунца (вяленая свиная корейка)',tr:'Lountza (kürlenmiş domuz eti)'},
'Moving Mountains Burger':{k:270,p:14.3,c:6.1,f:19.8,fi:5,cat:'Κρέας',en:'Moving Mountains Burger',ru:'Moving Mountains Burger (бургер)',tr:'Moving Mountains Burger'},
'Grillman Chicken Burger':{k:162,p:18,c:6,f:7.4,fi:1.7,cat:'Κρέας',en:'Grillman Chicken Burger',ru:'Grillman Chicken Burger (куриный бургер)',tr:'Grillman Chicken Burger'},
'Μπιφτέκι Κοτόπουλο Πηδηχτούλης Κόκορας':{k:115,p:16.8,c:6.7,f:2.4,fi:0.5,cat:'Κρέας',en:'Chicken Patty (Pidichtoulis)',ru:'Куриный бифштекс (Pidichtoulis)',tr:'Tavuk Köftesi (Pidichtoulis)'},
/* Τρόφιμα/καρυκεύματα από συνταγές & αποθηκευμένα πλάνα — τιμές USDA ανά 100g */
'Βούτυρο':{k:717,p:0.9,c:0.1,f:81,fi:0,cat:'Λάδια',en:'Butter',ru:'Сливочное масло',tr:'Tereyağı'},
'Μαργαρίνη light':{k:292,p:0.3,c:1,f:32,fi:0,cat:'Λάδια',en:'Light Margarine',ru:'Маргарин light',tr:'Light Margarin'},
'Dark Chocolate 70%':{k:598,p:7.8,c:45.9,f:42.6,fi:10.9,cat:'Άλλα',en:'Dark Chocolate 70%',ru:'Тёмный шоколад 70%',tr:'Bitter Çikolata %70'},
// Ingredients: reconstituted skimmed milk, 12% chocolate flavoured syrup [water, sweetener (sorbitol, polydextrose, maltodextrin, milk protein, cocoa powder 7%, vegetable fat (coconut fat), thickener (pectin), stabilizer (guar gum), sweetener (steviol glycosides), flavorings], 6% brownie pieces [sweetener (maltitol), water, wheat flour, vegetable fat (coconut), fat reduced alkalized cocoa powder, gluten, stabilizer (carrageenan), salt], sweetener (erythritol), polydextrose, milk protein, cocoa powder 3.3%, vegetable fat (coconut fat), maltodextrin, emulsifier (mono- and di-glycerides of fatty acids), stabilizers (carrageenan, locust bean gum, guar gum), sweetener (steviol glycosides), flavouring.
// Allergens: contains milk, wheat, gluten. May contain traces of nuts, peanuts, soya, eggs, sulphites and mustard.
'Kri Kri High Protein Super Spoon Παγωτό Σοκολάτα':{k:139,p:7.5,c:17,f:6,fi:6.8,cat:'Άλλα',en:'Kri Kri High Protein Super Spoon Ice Cream Chocolate Hype',ru:'Kri Kri High Protein мороженое шоколадное',tr:'Kri Kri Yüksek Proteinli Çikolatalı Dondurma'},
'Φιστίκια':{k:567,p:26,c:16,f:49,fi:8.5,cat:'Ξηροί καρποί',en:'Peanuts',ru:'Арахис',tr:'Yer Fıstığı'},
'Χυμό ντομάτας':{k:17,p:0.8,c:4.2,f:0.1,fi:0.4,cat:'Λαχανικά',en:'Tomato Juice',ru:'Томатный сок',tr:'Domates Suyu'},
'Κρεμμυδάκι (φρέσκο)':{k:32,p:1.8,c:7.3,f:0.2,fi:2.6,cat:'Λαχανικά',en:'Spring Onion (fresh)',ru:'Зелёный лук (свежий)',tr:'Taze Soğan'},
'Λεμόνι (χυμός)':{k:22,p:0.4,c:6.9,f:0.2,fi:0.3,cat:'Φρούτα',en:'Lemon (juice)',ru:'Лимон (сок)',tr:'Limon (suyu)'},
'Λεμόνι (ξύσμα)':{k:47,p:1.5,c:16,f:0.3,fi:10.6,cat:'Φρούτα',en:'Lemon (zest)',ru:'Лимон (цедра)',tr:'Limon (kabuğu rendesi)'},
'Βασιλικό':{k:23,p:3.2,c:2.7,f:0.6,fi:1.6,cat:'Λαχανικά',en:'Basil',ru:'Базилик',tr:'Fesleğen'},
'Κύβο λαχανικών':{k:230,p:9,c:18,f:14,fi:0,cat:'Άλλα',en:'Vegetable Stock Cube',ru:'Овощной бульонный кубик',tr:'Sebze Bulyon Küpü'},
'Μπούκοβο':{k:282,p:12,c:50,f:14,fi:35,cat:'Άλλα',en:'Bukovo (chili flakes)',ru:'Буково (хлопья чили)',tr:'Pul Biber (Bukovo)'},
'Ούζο':{k:225,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Ouzo',ru:'Узо',tr:'Ouzo'},
'Αλάτι':{k:0,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Salt',ru:'Соль',tr:'Tuz'},
'Αλάτι & μπαχαρικά':{k:0,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Salt & Spices',ru:'Соль и специи',tr:'Tuz ve Baharat'},
/* Μπαχαρικά & βότανα — ασήμαντη θερμιδική αξία στις δόσεις χρήσης (0 kcal) */
'Κουρκουμάς':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Turmeric',ru:'Куркума',tr:'Zerdeçal'},
'Μαύρο πιπέρι':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Black Pepper',ru:'Чёрный перец',tr:'Karabiber'},
'Κανέλα':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Cinnamon',ru:'Корица',tr:'Tarçın'},
'Τζίντζερ':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Ginger',ru:'Имбирь',tr:'Zencefil'},
'Ρίγανη':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Oregano',ru:'Орегано',tr:'Oregano'},
'Δεντρολίβανο':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Rosemary',ru:'Розмарин',tr:'Biberiye'},
'Θυμάρι':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Thyme',ru:'Тимьян',tr:'Kekik'},
'Δυόσμος':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Mint',ru:'Мята',tr:'Nane'},
'Φασκόμηλο':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Sage',ru:'Шалфей',tr:'Adaçayı'},
'Κουμίν':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Cumin',ru:'Зира (кумин)',tr:'Kimyon'},
'Γλυκάνισος':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Anise',ru:'Анис',tr:'Anason'},
'Κορίανδρος':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Coriander',ru:'Кориандр',tr:'Kişniş'},
'Τσίλι/Καυτερή πιπ.':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Chili Pepper',ru:'Чили/острый перец',tr:'Acı Biber'},
'Κάρδαμο':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Cardamom',ru:'Кардамон',tr:'Kakule'},
'Μοσχοκάρυδο':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Nutmeg',ru:'Мускатный орех',tr:'Muskat'},
'Γαρύφαλλο':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Clove',ru:'Гвоздика',tr:'Karanfil'},
'Σαφράνι':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Saffron',ru:'Шафран',tr:'Safran'},
'Μάραθος':{k:0,p:0,c:0,f:0,fi:0,cat:'Μπαχαρικά',en:'Fennel',ru:'Фенхель',tr:'Rezene'},
'Νερό':{k:0,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Water',ru:'Вода',tr:'Su'},
/* ✅ Προστέθηκαν 2026-07-04 — τροφές που έλειπαν εντελώς από τη βάση (βλ. αντιστοιχίσεις στο FOOD_ALIASES) */
'Τυρί Cheddar':{k:403,p:25,c:1.3,f:33,fi:0,cat:'Γαλακτοκομικά',en:'Cheddar Cheese',ru:'Сыр чеддер',tr:'Cheddar Peyniri'},
'Λευκό κρασί':{k:82,p:0.1,c:2.6,f:0,fi:0,cat:'Άλλα',en:'White Wine',ru:'Белое вино',tr:'Beyaz Şarap'},
'Σάλτσα κάρι light':{k:70,p:2,c:6,f:4,fi:1,cat:'Σάλτσες',en:'Light Curry Sauce',ru:'Соус карри light',tr:'Light Köri Sosu'},
'Μικτά λαχανικά':{k:35,p:2,c:6,f:0.3,fi:2.5,cat:'Λαχανικά',en:'Mixed Vegetables',ru:'Овощная смесь',tr:'Karışık Sebze'},
'Βρώμη (βρ.)':{k:71,p:2.5,c:12,f:1.4,fi:1.7,cat:'Δημητριακά',en:'Oats (cooked)',ru:'Овсянка (варёная)',tr:'Yulaf (pişmiş)'},
'Κοκος γάλα light':{k:50,p:0.5,c:3,f:4,fi:0,cat:'Άλλα',en:'Light Coconut Milk',ru:'Кокосовое молоко light',tr:'Light Hindistan Cevizi Sütü'},
'Πορτοκαλάδα φρέσκια':{k:45,p:0.7,c:10.4,f:0.2,fi:0.2,cat:'Ροφήματα',en:'Fresh Orange Juice',ru:'Свежевыжатый апельсиновый сок',tr:'Taze Portakal Suyu'},
'Ρύζι μαύρο (βρ.)':{k:123,p:2.7,c:25.6,f:1,fi:1.6,cat:'Δημητριακά',en:'Black Rice (cooked)',ru:'Чёрный рис (варёный)',tr:'Siyah Pirinç (pişmiş)'},
/* ✅ Προστέθηκαν 2026-07-09 — ίδιο μοτίβο: τροφές που έλειπαν εντελώς από τη βάση, εντοπίστηκαν με
   αυτοματοποιημένο έλεγχο κάθε TMPLS/MEAL_RECIPES/SNACK_RECIPES έναντι FOODS+FOOD_ALIASES (βλ. αντιστοιχίσεις παρακάτω) */
'Hummus':{k:166,p:7.9,c:14.3,f:9.6,fi:6,cat:'Όσπρια',en:'Hummus',ru:'Хумус',tr:'Humus'},
'Χούμους σπιτικό':{k:237,p:7.8,c:15.0,f:17.8,fi:5.5,cat:'Όσπρια',en:'Homemade Hummus',ru:'Хумус домашний',tr:'Ev Yapımı Humus'},
'Γάλα καρύδας':{k:180,p:1.8,c:3,f:18,fi:0,cat:'Αυγά/Γαλακτ.',plantBased:true,en:'Coconut Milk',ru:'Кокосовое молоко',tr:'Hindistan Cevizi Sütü'},
'Σπόροι κολοκύνθης':{k:559,p:30,c:11,f:49,fi:6,cat:'Ξηροί καρποί',en:'Pumpkin Seeds',ru:'Тыквенные семечки',tr:'Kabak Çekirdeği'},
'Σπόροι λιναρόσπορου':{k:534,p:18,c:29,f:42,fi:27,cat:'Ξηροί καρποί',en:'Flaxseed',ru:'Семена льна',tr:'Keten Tohumu'},
'Ξηρά δαμάσκηνα':{k:240,p:2.2,c:64,f:0.4,fi:7.1,cat:'Φρούτα',en:'Dried Prunes',ru:'Чернослив сушёный',tr:'Kuru Erik'},
'Κρέμα γάλακτος':{k:340,p:2.1,c:2.8,f:36,fi:0,cat:'Αυγά/Γαλακτ.',en:'Heavy Cream',ru:'Сливки',tr:'Krema'},
'Λάχανο':{k:25,p:1.3,c:5.8,f:0.1,fi:2.5,cat:'Λαχανικά',en:'Cabbage',ru:'Капуста',tr:'Lahana'},
'Ψάρι - SKIP':{k:0,p:0,c:0,f:0,fi:0,cat:'Άλλα',en:'Fish - SKIP',ru:'Рыба - SKIP',tr:'Balık - SKIP'}, // σκόπιμο placeholder με g:0 σε μερικά vegetarian templates — όχι λείπον τρόφιμο
/* ✅ Προστέθηκαν 2026-07-10 — 2 από τα 4 vegan "PickupLimes" υλικά στο FYH_RECIPE_EXPAND που δεν είχαν
   καμία αντιστοίχιση (βλ. FOOD_ALIASES για τα υπόλοιπα, που αντιστοιχήθηκαν σε ήδη υπάρχοντα τρόφιμα) */
'Nutritional yeast':{k:375,p:50,c:31,f:6,fi:19,cat:'Άλλα',en:'Nutritional Yeast',ru:'Пищевые дрожжи',tr:'Besin Mayası'},
'Soy yogurt (χωρίς ζάχαρη)':{k:55,p:3.5,c:4,f:2.5,fi:0.5,cat:'Αυγά/Γαλακτ.',plantBased:true,en:'Soy Yogurt (sugar-free)',ru:'Соевый йогурт (без сахара)',tr:'Soya Yoğurdu (şekersiz)'},
// ✅ Προστέθηκε 2026-08-05 για τα κουπέπια — τιμές αναφοράς τύπου USDA για κονσερβοποιημένα/σε άλμη
// αμπελόφυλλα (δεν υπήρχε αντίστοιχο προϊόν στη βάση ούτε γενικό alias). Αν έχεις ετικέτα συγκεκριμένου
// προϊόντος, πες μου να ενημερώσω τις τιμές.
'Αμπελόφυλλα (τουρσί)':{k:93,p:2.3,c:17.1,f:2.1,fi:4.6,cat:'Λαχανικά',en:'Grape Leaves (brined)',ru:'Виноградные листья (в рассоле)',tr:'Asma Yaprağı (turşu)'},
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
  'Συκώτι μοσχαρίσιο (σχάρα/φούρνο)':{flavor_profile:['rich','strong','umami'],best_pairings:['Κρεμμύδι','Πατάτες','Λεμόνι','Σκόρδο'],avoid_with:['ψάρι','γαλακτοκομικά'],texture:'firm',aromatic_herbs:['δεντρολίβανο','θυμάρι'],category:'protein'},
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
  'Ψωμί προζύμης':{flavor_profile:['tangy','nutty','mild'],best_pairings:['Αυγά (ολόκληρα)','Τυρί φέτα','Αβοκάντο','Ντοματες','Ελαιόλαδο'],avoid_with:[],texture:'chewy',aromatic_herbs:[],category:'carb'},
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

// js/data/met-activities.js
// Split out of js/data.js (module split wave 1). Pure data, no logic.
// Contents: MET_ACTIVITIES

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
    {id:'health_club',name:'Γυμναστήριο γενικό',met:5.5}
  ]},
  {cat:'🤸 Ενόργανη Γυμναστική',items:[
    {id:'gym_artistic',name:'Ενόργανη — γενική προπόνηση',met:4.5},
    {id:'gym_floor',name:'Έδαφος (floor)',met:6.0},
    {id:'gym_vault',name:'Άλμα ίππου (vault)',met:4.0},
    {id:'gym_rings',name:'Κρίκοι (rings)',met:6.5},
    {id:'gym_pommel',name:'Πλάγιος ίππος (pommel horse)',met:5.5},
    {id:'gym_pbars',name:'Παράλληλες / δίζυγο (parallel bars)',met:5.5},
    {id:'gym_hbar',name:'Μονόζυγο (horizontal bar)',met:5.5},
    {id:'gym_ubars',name:'Ασύμμετρο δίζυγο (uneven bars)',met:5.5},
    {id:'gym_beam',name:'Δοκός ισορροπίας (beam)',met:4.0},
    {id:'gym_conditioning',name:'Φυσική κατάσταση / ενδυνάμωση',met:6.0},
    {id:'gym_trampoline',name:'Τραμπολίνο (trampoline)',met:3.5},
    {id:'gym_acro',name:'Ακροβατική γυμναστική (acro)',met:5.5},
    {id:'gym_flex',name:'Ζέσταμα / διατάσεις / ευλυγισία',met:2.8}
  ]},
  {cat:'🎀 Ρυθμική Γυμναστική',items:[
    {id:'gym_rhythmic',name:'Ρυθμική — γενική προπόνηση',met:4.5},
    {id:'rg_apparatus',name:'Πρόγραμμα με όργανο (σχοινί/στεφάνι/μπάλα/κορίνες/κορδέλα)',met:5.0},
    {id:'rg_dance',name:'Χορευτικά / βηματολόγιο',met:5.0},
    {id:'rg_flex',name:'Ευλυγισία / body difficulty / διατάσεις',met:3.0},
    {id:'rg_conditioning',name:'Φυσική κατάσταση / ενδυνάμωση',met:5.0}
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

// js/client-editor/render-main.js
// renderMain() — the client editor's main-panel renderer (tab s1) — plus the
// blood-test tri-state indicator (BLOOD_TEST_STATUS_DEFS, cycleBloodTestStatus) and
// the quick-preset picker (QUICK_PRESETS, applyClientPreset) it draws. Extracted
// verbatim from js/app-part2.js (module split wave 31). renderMain stitches together
// buildDayTgtHtml / buildMetHtml / buildMacroDistributionHtml / buildInsightsPanelHtml /
// buildExcludeHtml / buildAppointmentsHtml / buildTrackerHtml / setupFormEventListeners
// — all now in sibling client-editor/*, plan-gen/*, appointments/* modules, resolved
// at call time. It is itself called from ~everywhere (11-undo-redo, app-part1,
// core/persistence, client-editor/*) at runtime. Loads last in the client-editor/
// group, after form-controls.js.

// ✅ Χειροκίνητο tri-state indicator: έχει στείλει ο πελάτης αιματολογικές εξετάσεις; Η δ/γείος το
// ορίζει η ίδια (πάτημα στο κουμπί κάνει κύκλο στις 3 καταστάσεις) — δεν υπάρχει αυτόματο upload/λήψη
// από τον πελάτη, είναι απλή υπενθύμιση/ένδειξη στην κάρτα του.
var BLOOD_TEST_STATUS_DEFS={
  none:{icon:'❌',label:'Δεν έχει σταλεί',bg:'#ffebee',color:'#c62828'},
  pending:{icon:'⏳',label:'Σε αναμονή',bg:'#fff8e1',color:'#8a6100'},
  sent:{icon:'✅',label:'Εστάλησαν',bg:'#e8f5e9',color:'var(--good)'}
};
function cycleBloodTestStatus(){
  var c=getC();if(!c)return;
  var order=['none','pending','sent'];
  var cur=order.indexOf(c.bloodTestStatus)>=0?c.bloodTestStatus:'none';
  c.bloodTestStatus=order[(order.indexOf(cur)+1)%order.length];
  save();
  renderMain();
}

// Συνδυασμοί activity/dietType/macro-split που επαναλαμβάνονται συχνά ανά τύπο πελάτη —
// βλ. applyClientPreset(). Οι τιμές macro% ταιριάζουν με τα όρια των πεδίων στο tab «Στοιχεία».
var QUICK_PRESETS=[
  {key:'martial',icon:'🥋',label:'Πολεμικές τέχνες',activity:'active',dietType:'bodybuilding_clean',macroP:30,macroF:25,macroC:45},
  {key:'runner',icon:'🏃',label:'Δρομέας αντοχής',activity:'mod',dietType:'normal',macroP:20,macroF:20,macroC:60},
  {key:'loss',icon:'📉',label:'Απώλεια βάρους',activity:'light',dietType:'normal',macroP:35,macroF:30,macroC:35,goal:'loss'},
  {key:'preg',icon:'🤰',label:'Εγκυμοσύνη',activity:'sed',dietType:'normal',macroP:25,macroF:30,macroC:45,pregnant:true},
  {key:'custom',icon:'✏️',label:'Χωρίς preset',activity:null}
];
// Προσυμπληρώνει PAL/τύπο διατροφής/macro split από ένα QUICK_PRESETS — όλα τα πεδία μένουν
// επεξεργάσιμα μετά, η δ/γείος απλά δεν ξεκινάει από κενή φόρμα για τους συνηθισμένους τύπους.
function applyClientPreset(key){
  var c=getC();if(!c)return;
  var p=QUICK_PRESETS.filter(function(x){return x.key===key;})[0];
  if(!p)return;
  c.quickPreset=key;
  if(p.activity){
    c.activity=p.activity;
    c.activityFactor=0;
    c.dietType=p.dietType;
    c.macroP=p.macroP;
    c.macroF=p.macroF;
    c.macroC=p.macroC;
    if(p.pregnant)c.pregnant=true;
    // ✅ "Απώλεια βάρους" is literally named after its goal, but until now the preset only set
    // activity/dietType/macros — c.goalMain/c.goal (what the ΚΥΡΙΟΣ ΣΤΟΧΟΣ radio + validateClientData
    // actually check) stayed empty, so clicking it and hitting "Δημιουργία πλάνου" right away always
    // failed with "Παρακαλώ επιλέξτε στόχο". Only 'loss' gets this (the only preset whose own label
    // states an unambiguous calorie direction — martial/runner/preg are genuinely ambiguous either
    // way, so left for the dietitian to pick manually as before). Sets goal/goalMain directly instead
    // of calling applyGoalMacros(), which would also overwrite the macroP/F/C just set above via its
    // own smart-macro-default logic.
    if(p.goal){
      var goalDeltas={loss:-500,maintain:0,gain:300};
      c.goal=String(goalDeltas[p.goal]!==undefined?goalDeltas[p.goal]:0);
      c.goalMain=p.goal;
    }
  }
  save();
  renderMain();
}

function renderMain(){
  var c=getC();if(!c)return;

  // DEFENSIVE: Ensure all required fields exist (migration safety)
  if(!c.metActivities) c.metActivities = [];
  if(!c.weekPlan) c.weekPlan = {};
  if(!c.dayTargets) c.dayTargets = [];
  if(!c.supps) c.supps = [];
  if(!c.suppExclude) c.suppExclude = [];
  if(!c.foodExclude) c.foodExclude = [];
  if(!c.trainDays) c.trainDays = [false, false, false, false, false, false, false];
  if(!c.trainHoursByDay) c.trainHoursByDay = [1, 1, 1, 1, 1, 1, 1];
  if(!c.savedPlans) c.savedPlans = [];  // Initialize saved plans for plan history
  if(c.pregnant===undefined) c.pregnant = false; // ✅ Εγκυμοσύνη: trimester υπολογίζεται από gestationalWeek, βλ. getPregTrimester()
  if(!c.bloodTestStatus) c.bloodTestStatus = 'none'; // ✅ Αιματολογικές εξετάσεις: 'none'|'pending'|'sent', βλ. cycleBloodTestStatus()

  var t=calcTDEE(c);
  // Calculate weekly average target from daily targets (for MET-based accuracy)
  var avgTarget=t.target;
  if(c.dayTargets&&c.dayTargets.length===7){
    var totalKcal=0;
    for(var di=0;di<7;di++){
      totalKcal+=(c.dayTargets[di].k||0);
    }
    avgTarget=Math.round(totalKcal/7);
  }
  var sOpts='<option value=""'+(c.sex?'':' selected')+' disabled>-- Επιλέξτε --</option><option value="M"'+(c.sex==='M'?' selected':'')+'>Άνδρας</option><option value="F"'+(c.sex==='F'?' selected':'')+'>Γυναίκα</option>';
  var aOpts='<option value="sed"'+(c.activity==='sed'?' selected':'')+'>Καθιστικός</option><option value="light"'+(c.activity==='light'?' selected':'')+'>Ελαφρά ενεργός (1-3x)</option><option value="mod"'+(c.activity==='mod'?' selected':'')+'>Μέτρια ενεργός (3-5x)</option><option value="active"'+(c.activity==='active'?' selected':'')+'>Έντονα ενεργός (6-7x)</option>';
  // ✅ NEW: Goal stored as numeric calorie adjustment (-500 to +500)
  var goalCalAdj = (typeof c.goal === 'string' && !isNaN(parseInt(c.goal))) ? parseInt(c.goal) : (c.goal==='loss'?-500:c.goal==='gain'?300:0);
  var gOpts='<option value="maintain"'+(c.goal==='maintain'?' selected':'')+'>➡️ Διατήρηση (TDEE ×1)</option>';

  // Initialize medical conditions if not exist
  if(!c.medConditions) c.medConditions = {};
  if(!c.shareToken) c.shareToken = genSecureToken();
  var dOpts='<option value="normal"'+(c.dietType==='normal'?' selected':'')+'>🍗 Κανονική διατροφή</option><option value="vegetarian"'+(c.dietType==='vegetarian'?' selected':'')+'>🥬 Χορτοφαγική</option><option value="vegan"'+(c.dietType==='vegan'?' selected':'')+'>🌱 Веганι</option><option value="keto"'+(c.dietType==='keto'?' selected':'')+'>⚡ Κετογονική</option><option value="orthodox_fasting"'+(c.dietType==='orthodox_fasting'?' selected':'')+'>✝️ Ορθόδοξη Νηστεία</option><option value="intermittent_fasting"'+(c.dietType==='intermittent_fasting'?' selected':'')+'>⏰ Διαλείπουσα Νηστεία</option><option value="bodybuilding_clean"'+(c.dietType==='bodybuilding_clean'?' selected':'')+'>🏋️ Bodybuilding Clean</option><option value="kids_10_14"'+(c.dietType==='kids_10_14'?' selected':'')+'>👧 Παιδιά 10-14 ετών</option>';
  var fOpts='<option value="mifflin"'+(c.formula==='mifflin'||!c.formula?' selected':'')+'>Mifflin-St Jeor</option><option value="cunningham"'+(c.formula==='cunningham'?' selected':'')+'>Cunningham (αθλητές)</option>';
  var isCunn=c.formula==='cunningham';
  var numTrainDays=(c.trainDays||[]).filter(function(x){return x;}).length;
  // ✅ Activity factor: 4 preset buttons (standard PAL bands) + free numeric override, so the
  // dietitian can type an exact value for the client's actual job when the presets don't fit.
  var PAL_PRESETS=[{k:'sed',v:1.2,lbl:'Καθιστικός'},{k:'light',v:1.375,lbl:'Ελαφρύ'},{k:'mod',v:1.55,lbl:'Μέτριο'},{k:'active',v:1.725,lbl:'Έντονο'}];
  var PAL_BY_KEY={sed:1.2,light:1.375,mod:1.55,active:1.725};
  var effAF=(c.activityFactor>0)?c.activityFactor:(PAL_BY_KEY[c.activity]||'');
  var hydBase=t.hydBase||Math.round(c.weight*35);
  var hydTrain=t.hydTrain||Math.round(hydBase+(c.trainHoursPerDay||1)*500);
  // ✅ Collapsible section state (Βασικά Στοιχεία / Άθλημα) — see getSecState()
  var secState=getSecState(c);
  var ageForPreview=c.birthDate?ageAtDate(c.birthDate):c.age;
  var basicPreview=[c.name||'—', c.sex==='M'?'Άνδρας':(c.sex==='F'?'Γυναίκα':''), (ageForPreview!=null&&!isNaN(ageForPreview))?(ageForPreview+' ετών'):''].filter(function(x){return x;}).join(' · ');
  var sportPreview=[c.sport&&SPORT_PROFILES[c.sport]?SPORT_PROFILES[c.sport].name:'',{sed:'Καθιστικός',light:'Ελαφρά ενεργός',mod:'Μέτρια ενεργός',active:'Έντονα ενεργός'}[c.activity]||''].filter(function(x){return x;}).join(' · ')||'Χωρίς στοιχεία';
  var anthroPreview=[c.weight?c.weight+'kg':'', c.height?c.height+'cm':'', (c.weight&&c.height)?('BMI '+(Math.round(c.weight/((c.height/100)*(c.height/100))*10)/10)):''].filter(function(x){return x;}).join(' · ')||'Χωρίς στοιχεία';
  var goalPreview=(c.goalMain?({loss:'Απώλεια βάρους',maintain:'Διατήρηση',gain:'Αύξηση μάζας'}[c.goalMain]||c.goalMain):'Χωρίς στόχο')+' · '+(goalCalAdj>=0?'+':'')+goalCalAdj+' kcal';
  // ✅ 2026-08-22: class="client-header-row"/"client-header-actions" — audit finding: σε κινητό,
  // χωρίς flex-wrap, ένα μεγαλύτερο ελληνικό όνομα (π.χ. διπλό επώνυμο) + τα 3 κουμπιά δεν χωράνε
  // σε μία σειρά· ζωντανά μετρήθηκε 399px περιεχόμενο σε 355px χώρο, το όνομα συμπιεζόταν στα
  // 144px. Τα classes δίνουν hook στο css/styles.css (@media(max-width:767px)) να σπάει σε 2 σειρές
  // αντί να τα στριμώχνει· χωρίς αλλαγή στο desktop layout (τα inline styles μένουν ίδια).
  var html='<div class="client-header-row" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e0e0e0;"><div style="flex:1"><h2 id="client-header-name" style="margin:0;color:#025857;font-size:18px;">👤 '+esc(c.name)+'</h2></div><div class="client-header-actions" style="display:flex;gap:8px;align-items:center;"><button class="btn" id="undoBtn" style="background:#7cb342;color:white;border:none;cursor:pointer;padding:8px 12px;border-radius:4px;font-weight:bold;" onclick="undo()" title="Αναίρεση (Ctrl+Z)">↶ Αναίρεση</button><button class="btn" id="redoBtn" style="background:#7cb342;color:white;border:none;cursor:pointer;padding:8px 12px;border-radius:4px;font-weight:bold;" onclick="redo()" title="Επανάληψη (Ctrl+Y)">↷ Επανάληψη</button><button class="btn" style="background:#eee;color:#555;border:none;cursor:pointer;padding:8px 12px;border-radius:4px;" onclick="logout()">← Έξοδος</button></div></div>'
    // ✅ 2026-08-22: .stabs-wrap + .stabs-fade — σε κινητό (≤767px) η μπάρα γίνεται οριζόντιο scroll strip
    // αντί να τυλίγεται σε 2-3 σειρές (βλ. css/styles.css, .stabs στο @media(max-width:767px)). Στο desktop
    // ο wrapper δεν αλλάζει τίποτα οπτικά — το ::after fade είναι κρυφό εκεί.
    +'<div class="stabs-wrap"><div class="stabs"><button class="stab active" id="t1" onclick="swTab(1)">Στοιχεία πελάτη</button><button class="stab" id="t2" onclick="swTab(2)">Πλάνο</button><button class="stab" id="t3" onclick="swTab(3)">📐 Ανθρωπομετρία</button><button class="stab" id="t3b" onclick="swTab('+TAB_APPOINTMENTS+')">📝 Ραντεβού</button><button class="stab" id="t4" onclick="swTab(4)">📊 Ιστορικό πλάνων</button></div></div>'
    +'<div id="s1">'

    // ✅ QUICK-START PRESETS — προσυμπληρώνουν PAL/τύπο διατροφής/macro split για συνηθισμένους
    // τύπους πελατών, ώστε η δ/γείος να μην ξαναδακτυλογραφεί τον ίδιο συνδυασμό κάθε φορά.
    // Όλα τα πεδία παραμένουν επεξεργάσιμα μετά — το preset είναι σημείο εκκίνησης, όχι κλείδωμα.
    +'<div style="margin-bottom:14px">'
    +'<div onclick="toggleSec(\'quickstart\')" style="display:flex;justify-content:space-between;align-items:center;background:#f0f7f7;border:1px solid #b2d8d8;border-radius:10px;padding:8px 12px;cursor:pointer;font-size:11px;font-weight:700;color:#025857">'
    +'<span>🚀 Γρήγορη έναρξη'+(secState.quickstart&&c.quickPreset?(' <span style="font-weight:400;color:#6b6b6b">— '+esc((QUICK_PRESETS.filter(function(p){return p.key===c.quickPreset;})[0]||{}).label||'')+'</span>'):'')+'</span>'
    +'<span style="transition:transform .15s;'+(secState.quickstart?'':'transform:rotate(90deg)')+'">›</span>'
    +'</div>'
    +'<div style="display:'+(secState.quickstart?'none':'block')+';margin-top:8px">'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
    +QUICK_PRESETS.map(function(p){
        return '<button type="button" onclick="applyClientPreset(\''+p.key+'\')" style="background:'+(c.quickPreset===p.key?'#025857':'#fff')+';color:'+(c.quickPreset===p.key?'#fff':'#333')+';border:1px solid '+(c.quickPreset===p.key?'#025857':'#ddd')+';border-radius:20px;padding:7px 12px;font-size:11.5px;font-weight:600;cursor:pointer">'+p.icon+' '+p.label+'</button>';
      }).join('')
    +'</div></div></div>'

    // ✅ GOAL SELECTION REMINDER (Only show if goal not set)
    +((!c.goal)?'<div style="background:linear-gradient(135deg, #fff9e6 0%, #fffbf0 100%);border:1.5px solid #ffd54f;border-radius:10px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:12px;box-shadow:0 2px 6px rgba(255,193,7,0.15)">'
    +'<span style="font-size:20px;flex-shrink:0;">💡</span>'
    +'<div style="flex:1">'
    +'<div style="font-size:12px;font-weight:700;color:#f57f17;">🎯 Ορίστε το Σκοπό</div>'
    +'<div style="font-size:11px;color:#ff8f00;margin-top:2px;">Απαραίτητο για σωστές θερμίδες & μακροθρεπτικά</div>'
    +'</div>'
    +'</div>':'')

    // ✅ SUMMARY CARD (Client Overview with Goal)
    +'<div style="background:linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);border:1.5px solid #c8e6c9;border-radius:12px;padding:14px 16px;margin-bottom:12px;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;box-shadow:0 2px 8px rgba(0,0,0,0.05)">'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">👤 Πελάτης</span>'
      +'<span style="font-size:13px;font-weight:700;color:#025857">' + esc(c.name||'—') + '</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">📊 Μέτρα</span>'
      +'<span id="header-measures" style="font-size:13px;font-weight:600;color:#025857">' + (c.weight||'—') + 'kg / ' + (c.height||'—') + 'cm' + (c.weight&&c.height?' (BMI: '+Math.round(c.weight/((c.height/100)*(c.height/100))*10)/10+')':'') + '</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">🎯 Στόχος</span>'
      +'<span id="header-goal" style="font-size:13px;font-weight:600;color:#025857">' + (c.goalMain?({loss:'Απώλεια βάρους',maintain:'Διατήρηση',gain:'Αύξηση μάζας'}[c.goalMain]||c.goalMain):'—') + (c.goal&&parseInt(c.goal)?' ('+(parseInt(c.goal)>=0?'+':'')+parseInt(c.goal)+' kcal)':'') + '</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">🏅 Άθλημα</span>'
      +'<span id="header-sport" style="font-size:13px;font-weight:600;color:#025857">' + esc(c.sport&&SPORT_PROFILES[c.sport]?SPORT_PROFILES[c.sport].name:'—') + '</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">🥗 Διατροφή</span>'
      +'<span id="header-diet" style="font-size:13px;font-weight:600;color:#025857">' + esc(({normal:'Κανονική',vegetarian:'Χορτοφαγική',vegan:'Vegan',keto:'Κετογονική',orthodox_fasting:'Ορθόδοξη Νηστεία',intermittent_fasting:'Διαλείπουσα Νηστεία',bodybuilding_clean:'Bodybuilding Clean',kids_10_14:'Παιδιά 10-14',mediterranean:'🫒 Μεσογειακή'}[c.dietType]||'Κανονική')) + '</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">🚫 Αποφυγές</span>'
      +'<span id="header-exclude" style="font-size:13px;font-weight:600;color:#025857">' + esc((c.foodExclude&&c.foodExclude.length)?c.foodExclude.join(', '):'—') + '</span>'
    +'</div>'
    // ✅ Αιματολογικές εξετάσεις: χειροκίνητο tri-state κουμπί (δεν πρόκειται περί ανεβάσματος/λήψης
    // αρχείου από τον πελάτη — η δ/γείος απλά σημειώνει τι της έχει σταλεί). Κλικ = επόμενη κατάσταση.
    +'<button type="button" onclick="cycleBloodTestStatus()" title="Πάτα για αλλαγή κατάστασης" style="text-align:left;cursor:pointer;border:none;display:flex;flex-direction:column;gap:2px;padding:8px;background:'+BLOOD_TEST_STATUS_DEFS[c.bloodTestStatus].bg+';border-radius:8px;font-family:inherit">'
      +'<span style="font-size:11px;color:#666;font-weight:600">🩸 Αιματολογικές</span>'
      +'<span id="header-bloodtest" style="font-size:13px;font-weight:700;color:'+BLOOD_TEST_STATUS_DEFS[c.bloodTestStatus].color+'">' + BLOOD_TEST_STATUS_DEFS[c.bloodTestStatus].icon + ' ' + BLOOD_TEST_STATUS_DEFS[c.bloodTestStatus].label + '</span>'
    +'</button>'
    +'</div>'

    // ✅ SECTION 1: ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ (Όνομα, Φύλο, Ηλικία) — collapsible, collapsed by default once filled in
    +'<div class="section-card basic">'
    +'<div class="section-header basic sec-collapse-hd" onclick="toggleSec(\'basic\')"><div><span class="section-icon">👤</span>Βασικά Στοιχεία'+(secState.basic?'<div class="sec-collapse-preview">'+esc(basicPreview)+'</div>':'')+'</div><span class="sec-chevron'+(secState.basic?'':' open')+'">▸</span></div>'
    +'<div id="sec-basic-body" style="display:'+(secState.basic?'none':'block')+'">'
    +'<div class="fg"><div class="fgrp"><label>Ονοματεπώνυμο</label><input type="text" id="inp-name" placeholder="π.χ. Γιώργος Παπαδόπουλος" value="'+esc(c.name||'')+'"></div>'
    +'<div class="fgrp"><label>Φύλο</label><select id="inp-sex">'+sOpts+'</select></div>'
    +'<div class="fgrp"><label>Ημερομηνία Γέννησης <span id="age-display" style="color:#025857;font-weight:600;font-size:12px"></span></label><input type="date" id="inp-birthdate" min="1915-01-01" max="'+new Date().toISOString().slice(0,10)+'"></div></div>'
    // ✅ Εγκυμοσύνη: ορατό μόνο όταν Φύλο=Γυναίκα, ίδιο conditional-reveal pattern με formula==='cunningham'
    +'<div class="fg" id="preg-toggle-wrap" style="display:'+(c.sex==='F'?'flex':'none')+'">'
    +'<div class="fgrp" style="flex:1"><label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:600">'
    +'<input type="checkbox" id="inp-pregnant" style="width:16px;height:16px;cursor:pointer"'+(c.pregnant?' checked':'')+'>🤰 Η πελάτισσα είναι έγκυος</label></div></div>'
    +'<div class="fg" id="preg-fields-wrap" style="display:'+(c.pregnant?'flex':'none')+'">'
    +'<div class="fgrp"><label>Εβδομάδα κύησης <span id="preg-tri-badge" style="color:#025857;font-weight:600;font-size:11px">'+esc(getPregTrimesterLabel(c.gestationalWeek))+'</span></label><input type="number" id="inp-gestweek" value="'+(c.gestationalWeek||'')+'" min="1" max="42" placeholder="π.χ. 20"></div>'
    +'<div class="fgrp"><label>Βάρος προ εγκυμοσύνης (kg)</label><input type="number" id="inp-prepregweight" value="'+(c.prePregnancyWeight||'')+'" min="30" max="200" step="0.1" placeholder="π.χ. 63"></div>'
    +'<div class="fgrp" style="justify-content:flex-end"><button type="button" class="btn" onclick="showMedicalProtocol(\'pregnancy\')" style="background:#025857;color:#fff;border:none;border-radius:6px;padding:9px 12px;font-size:12px;font-weight:600;cursor:pointer;">🤰 Πρωτόκολλο Εγκυμοσύνης</button></div></div>'
    +'<div class="fg"><div class="fgrp"><label>📧 Email <span style="color:#9fb5b0;font-weight:400;font-size:11px">(για αποστολή πλάνου)</span></label><input type="email" id="inp-email" placeholder="π.χ. pelatis@gmail.com" value="'+esc(c.email||'')+'"></div>'
    +'<div class="fgrp"><label>📱 Τηλέφωνο <span style="color:#9fb5b0;font-weight:400;font-size:11px">(για WhatsApp)</span></label><input type="tel" id="inp-phone" placeholder="π.χ. 6971234567" value="'+esc(c.phone||'')+'"></div></div>'
    +'<div class="fg"><div class="fgrp"><label>🌐 Γλώσσα πλάνου <span style="color:#9fb5b0;font-weight:400;font-size:11px">(για το link του πελάτη)</span></label><select id="inp-lang"><option value="el">Ελληνικά</option><option value="en">English</option><option value="ru">Русский</option><option value="tr">Türkçe</option></select></div></div>'
    +'<div class="fg"><div class="fgrp"><label>🏷️ Ομάδα <span style="color:#9fb5b0;font-weight:400;font-size:11px">(π.χ. ομάδα/σύλλογος)</span></label>'
    +'<select id="inp-group"></select>'
    +'<div id="inp-group-new-row" style="display:none;gap:8px;margin-top:8px">'
    +'<input type="text" id="inp-group-new" placeholder="Όνομα νέας ομάδας" style="flex:1">'
    +'<button type="button" class="btn" id="inp-group-new-confirm" style="padding:9px 12px;font-size:12px;background:#025857;color:#fff;border:none;border-radius:8px;cursor:pointer;">✓ Προσθήκη</button>'
    +'<button type="button" class="btn" id="inp-group-new-cancel" style="padding:9px 12px;font-size:12px;background:#eee;color:#555;border:none;border-radius:8px;cursor:pointer;">Άκυρο</button>'
    +'</div></div></div>'
    +'</div>'
    +'</div>'

    // ✅ SECTION 2: ΑΝΘΡΩΠΟΜΕΤΡΙΑ (Ενοποιημένη - Βάρος, Ύψος, BMI, Λίπος, Lean Mass)
    +'<div class="section-card anthropometry" id="sec-anthropometry">'
    +'<div class="section-header anthropometry sec-collapse-hd" onclick="toggleSec(\'anthro\')"><div><span class="section-icon">📏</span>Ανθρωπομετρία'+(secState.anthro?'<div class="sec-collapse-preview">'+esc(anthroPreview)+'</div>':'')+'</div><span class="sec-chevron'+(secState.anthro?'':' open')+'">▸</span></div>'
    +'<div id="sec-anthro-body" style="display:'+(secState.anthro?'none':'block')+'">'
    +'<div class="fg fg3"><div class="fgrp"><label>Βάρος (kg)</label><input type="number" id="inp-weight" value="'+(c.weight||'')+'" min="25" max="300" step="0.1"></div>'
    +'<div class="fgrp"><label>Ύψος (cm)</label><input type="number" id="inp-height" value="'+(c.height||'')+'" min="100" max="250"></div>'
    +'<div class="fgrp"><label>% Σώμ. Λίπος</label><input type="number" id="inp-bf" value="'+(c.bf||'')+'" min="3" max="60" step="0.1" placeholder="π.χ. 18.5"></div></div>'
    // ✅ Lean Mass + RMR now inside Anthropometry section
    +'<div class="fg"><div class="fgrp"><label>Lean Mass (kg)</label><input type="number" id="inp-leanmass" value="'+(c.leanmass||'')+'" min="20" max="150" step="0.5" placeholder="π.χ. 63"></div>'
    +'<div class="fgrp"><label>🧪 RMR (kcal)</label><input type="number" id="inp-rmr" value="'+(c.rmr||'')+'" min="500" max="5000" step="1" placeholder="π.χ. 1650 (εργαστηριακή)"></div></div>'
    // ✅ BMI as badge (not input field)
    +(c.weight&&c.height?'<div id="bmi-badge" style="background:#E2EEE5;padding:8px 12px;border-radius:6px;margin-top:8px;font-size:12px;font-weight:600;color:#025857;border-left:3px solid #025857;">📊 BMI: '+Math.round(c.weight/((c.height/100)*(c.height/100))*10)/10+' <span style="font-size:10px;color:#666;font-weight:normal;">('+
    (function(){
      var bmi=Math.round(c.weight/((c.height/100)*(c.height/100))*10)/10;
      if(bmi<18.5)return'Χαμηλό';if(bmi<25)return'Φυσιολογικό';if(bmi<30)return'Υπέρβαρο';return'Παχυσαρκία';
    })()+
    ')</span></div>':'')
    +'</div>'
    +'</div>'
    +'</div>'
    // ✅ SECTION 3: ΑΘΛΗΜΑ (Sport Auto-Sets Activity Level) — collapsible, collapsed by default once filled in
    +'<div class="section-card activity" id="sec-activity">'
    +'<div class="section-header activity sec-collapse-hd" onclick="toggleSec(\'sport\')"><div><span class="section-icon">🏅</span>Άθλημα'+(secState.sport?'<div class="sec-collapse-preview">'+esc(sportPreview)+'</div>':'')+'</div><span class="sec-chevron'+(secState.sport?'':' open')+'">▸</span></div>'
    +'<div id="sec-sport-body" style="display:'+(secState.sport?'none':'block')+'">'
    +'<div class="fg"><div class="fgrp"><label>Επιλογή Αθλήματος</label><select id="inp-sport" onchange="updateActivityFromSport(this.value)">'
    +'<option value="">-- Επιλέξτε άθλημα --</option>'
    +Object.keys(SPORT_PROFILES).map(function(k){var sp=SPORT_PROFILES[k];return'<option value="'+k+'"'+(c.sport===k?' selected':'')+'> '+sp.icon+' '+sp.name+'</option>';}).join('')
    +'</select><div style="font-size:10px;color:#666;margin-top:4px;font-style:italic" id="sport-note"></div></div></div>'
    // ✅ Activity Level — manually selected by dietitian (reflects job + daily life, not just sport)
    // 4 preset buttons (standard PAL bands) as quick-fill shortcuts + a free numeric field so an
    // exact value can be typed in when a client's actual job doesn't match a preset band.
    +'<div class="fg" id="activity-factor-wrap"><div class="fgrp"><label>⚡ Επίπεδο Δραστηριότητας Ημέρας (PAL)'+(t.usedMET?' (NEAT baseline)':'')+'</label>'
    +'<div class="pal-btn-row" style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0">'
    +PAL_PRESETS.map(function(p){
      var isActive=(+effAF===p.v);
      return '<button type="button" class="pal-preset-btn" onclick="setActivityFactor('+p.v+',\''+p.k+'\')" style="padding:6px 10px;border-radius:5px;border:1px solid '+(isActive?'#025857':'#ddd')+';background:'+(isActive?'#025857':'#fff')+';color:'+(isActive?'#fff':'#333')+';font-size:11px;cursor:pointer;">'+p.lbl+' <b>'+p.v+'</b></button>';
    }).join('')
    +'</div>'
    +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><input type="number" id="inp-activity-factor" min="1.0" max="3.0" step="0.01" value="'+effAF+'" placeholder="π.χ. 1.45" style="width:90px;padding:6px;border:1px solid var(--border-light);border-radius:4px"><span style="font-size:11px;color:#666">× BMR — πληκτρολόγησε ακριβή τιμή αν οι παραπάνω κατηγορίες δεν ταιριάζουν</span></div>'
    +'<div style="font-size:10px;color:#666;margin-top:6px;font-style:italic">Ενδεικτικός οδηγός βάσει δουλειάς (όχι απόλυτος κανόνας): Γραφείο/καθιστική 1.2-1.3 · Όρθια εργασία με κίνηση (πωλητής, σερβιτόρος, νοσηλευτής) 1.4-1.6 · Δουλειά με σωματική προσπάθεια (διανομέας, τεχνίτης) 1.6-1.8 · Βαριά χειρωνακτική εργασία 1.8-2.2</div>'
    +'</div></div>'
    // ✅ Sport-Specific Supplement Recommendations (PHASE 4)
    +(c.sport && SPORT_PROTOCOLS[c.sport] ?
      '<div style="background:#E8F5E9;padding:12px;border-radius:5px;margin:10px 0;border-left:4px solid #025857;">'
      +'<label><b style="color:#025857;">🔬 Συνιστώμενα Συμπληρώματα για '+SPORT_PROTOCOLS[c.sport].name+':</b></label>'
      +'<div id="sportSuppsContainer" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:10px;">'
      +SPORT_PROTOCOLS[c.sport].recommendedSupplements.map(function(supp){
        var suppsObj=SUPPS.find(function(s){return s.id===supp.id;});
        var suppName=suppsObj?suppsObj.name:supp.id;
        var isSelected=(c.supps||[]).includes(supp.id);
        return'<label style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--card-bg);border:1px solid var(--border-light);border-radius:4px;cursor:pointer;"><input type="checkbox" value="'+supp.id+'" '+(isSelected?'checked':'')
          +' onchange="toggleSportSupplement(\''+supp.id+'\',this.checked);" style="cursor:pointer;"/><span style="font-size:12px;">'+suppName+(supp.required?' ⭐':'')+'</span></label>';
      }).join('')
      +'</div>'
      +'<div style="font-size:10px;color:#666;margin-top:8px;font-style:italic;">⭐ = Strongly recommended for this sport</div>'
      +'</div>'
    : '')
    // ✅ MET ACTIVITIES - NOW IN MODAL (moved to buttons section)
    +'</div>'
    +'</div>'

    // ✅ SECTION 4: ΣΤΟΧΟΣ & ΠΡΟΣΑΡΜΟΓΗ (Goal Selection + Adjustment + Formula)
    +'<div class="section-card goal" id="sec-goal">'
    +'<div class="section-header goal sec-collapse-hd" onclick="toggleSec(\'goal\')"><div><span class="section-icon">⚡</span>Στόχος &amp; Προσαρμογή'+(secState.goal?'<div class="sec-collapse-preview">'+esc(goalPreview)+'</div>':'')+'</div><span class="sec-chevron'+(secState.goal?'':' open')+'">▸</span></div>'
    +'<div id="sec-goal-body" style="display:'+(secState.goal?'none':'block')+'">'
    // ✅ GOAL SELECTION (NEW) - COMPACT VERSION
    +'<div class="fg"><div class="fgrp"><label style="font-weight:700;color:#025857;font-size:12px;">🎯 Κύριος Στόχος:</label>'
    // ✅ All 3 goal cards share one neutral/teal selection language (selected=teal, unselected=grey)
    // instead of red/teal/green per goal — losing weight isn't "bad" (red) and gaining isn't
    // inherently "good" (green); which goal is right depends entirely on the client.
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:6px;">'
    +'<label style="display:flex;align-items:center;gap:5px;padding:5px 8px;background:'+(c.goalMain==='loss'?'#E2EEE5':'#fff')+';border:1px solid '+(c.goalMain==='loss'?'#025857':'#ddd')+';border-radius:4px;cursor:pointer;font-size:11px;">'
    +'<input type="radio" name="goal-main" value="loss" '+(c.goalMain==='loss'?'checked':'')+' onchange="upd(\'goalMain\', this.value); applyGoalMacros(this.value);" style="cursor:pointer;width:14px;height:14px;">'
    +'<div><div style="font-weight:600;color:var(--text-strong);font-size:11px;">📉 Απώλεια</div><div style="font-size:9px;color:var(--text-muted);">-500 kcal</div></div>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:5px;padding:5px 8px;background:'+(c.goalMain==='maintain'?'#E2EEE5':'#fff')+';border:1px solid '+(c.goalMain==='maintain'?'#025857':'#ddd')+';border-radius:4px;cursor:pointer;font-size:11px;">'
    +'<input type="radio" name="goal-main" value="maintain" '+(c.goalMain==='maintain'?'checked':'')+' onchange="upd(\'goalMain\', this.value); applyGoalMacros(this.value);" style="cursor:pointer;width:14px;height:14px;">'
    +'<div><div style="font-weight:600;color:var(--text-strong);font-size:11px;">➡️ Διατήρηση</div><div style="font-size:9px;color:var(--text-muted);">0 kcal</div></div>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:5px;padding:5px 8px;background:'+(c.goalMain==='gain'?'#E2EEE5':'#fff')+';border:1px solid '+(c.goalMain==='gain'?'#025857':'#ddd')+';border-radius:4px;cursor:pointer;font-size:11px;">'
    +'<input type="radio" name="goal-main" value="gain" '+(c.goalMain==='gain'?'checked':'')+' onchange="upd(\'goalMain\', this.value); applyGoalMacros(this.value);" style="cursor:pointer;width:14px;height:14px;">'
    +'<div><div style="font-weight:600;color:var(--text-strong);font-size:11px;">📈 Αύξηση</div><div style="font-size:9px;color:var(--text-muted);">+300 kcal</div></div>'
    +'</label>'
    +'</div></div></div>'
    +'<div class="fg"><div class="fgrp"><label style="font-weight:700;color:#025857;font-size:13px;">🎯 ΠΡΟΣΑΡΜΟΓΗ ΘΕΡΜΙΔΩΝ (-500 έως +500)</label>'
    +'<div style="text-align:center;background:#E2EEE5;border:2px solid #025857;padding:6px 8px;border-radius:6px;margin:8px 0 6px;">'
    +'<div style="font-size:9px;color:#666;">Προσαρμογή Θερμίδων</div>'
    +'<div style="font-size:18px;font-weight:bold;color:#025857;margin:2px 0;line-height:1.2;" id="goal-display">'+(goalCalAdj>=0?'+':'')+(goalCalAdj)+'</div>'
    +'<div style="font-size:8px;color:var(--text-muted);">kcal/ημέρα</div>'
    +'</div>'
    +'<input type="range" id="goal-slider" min="-500" max="500" step="10" value="'+goalCalAdj+'" style="width:100%;accent-color:#025857;cursor:pointer;display:block;" oninput="document.getElementById(\'goal-display\').textContent=(this.value>=0?\'+\':\'\')+this.value" onchange="setGoalCalories(this.value)">'
    +'<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--text-muted);padding:2px 2px 8px;"><span>-500</span><span>0</span><span>+500</span></div>'
    +'<div style="display:flex;gap:6px;">'
    +'<button type="button" onclick="setGoalCalories(-500)" style="flex:1;background:var(--card-bg);color:#025857;border:1px solid #cfe0dc;padding:7px 4px;border-radius:5px;cursor:pointer;font-weight:600;font-size:11px;">📉 Απώλεια −500</button>'
    +'<button type="button" onclick="setGoalCalories(0)" style="flex:1;background:var(--card-bg);color:#025857;border:1px solid #cfe0dc;padding:7px 4px;border-radius:5px;cursor:pointer;font-weight:600;font-size:11px;">➡️ Διατήρηση 0</button>'
    +'<button type="button" onclick="setGoalCalories(300)" style="flex:1;background:var(--card-bg);color:#025857;border:1px solid #cfe0dc;padding:7px 4px;border-radius:5px;cursor:pointer;font-weight:600;font-size:11px;">📈 Αύξηση +300</button>'
    +'</div>'
    +'<input type="hidden" id="inp-goal" value="'+(goalCalAdj)+'"/>'
    +'<div style="font-size:10px;color:#025857;margin-top:8px;font-style:italic;">⚠️ Αρνητικό = Μείωση | 0 = Διατήρηση | Θετικό = Αύξηση</div>'
    +'</div></div>'
    // ✅ FORMULA AUTO-SELECT (Removed user picker - auto-detects)
    +'<div style="background:#E2EEE5;padding:10px 12px;border-radius:6px;font-size:11px;color:#025857;font-weight:600;margin-top:12px;">'
    +'🧮 Formula: '+
    (function(){
      if(c.rmr)return'<b>RMR (Laboratory-Measured)</b> ← Ακριβέστερη';
      if(c.bf)return'<b>Katch-McArdle</b> (Body Fat %) ← Συνιστώμενη';
      if(c.leanmass)return'<b>Katch-McArdle</b> (Lean Mass) ← Καλή';
      return'<b>Mifflin-St Jeor</b> (Default) ← Γενική';
    })()
    +'</div>'
    +'</div>'
    +'</div>'

    // ✅ SECTION 4b: ΚΑΤΑΝΟΜΗ ΜΑΚΡΟΘΡΕΠΤΙΚΩΝ (macro presets)
    +buildMacroDistributionHtml(c,t)

    // ✅ SECTION 5-7: Moved to Modals (cleaner UI)
    // ✅ QUICK ACCESS BUTTONS FOR ALL SETTINGS (6 Modal Windows)
    +'<div id="modal-btns-grid" style="display:flex;flex-direction:column;gap:8px;margin-bottom:15px;">'
    +'<button class="btn" onclick="openMealTimesModal()" style="background:var(--card-bg);color:var(--text-strong);padding:12px 14px;border-radius:6px;font-weight:600;text-align:left;border:1px solid var(--border-light);border-left:3px solid #025857;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#f0f7f7\';this.style.borderColor=\'#c5ddd8\'" onmouseout="this.style.background=\'var(--card-bg)\';this.style.borderColor=\'var(--border-light)\'">⏱️ Χρόνοι Γευμάτων</button>'
    +'<button class="btn" onclick="openMetActivitiesModal()" style="background:var(--card-bg);color:var(--text-strong);padding:12px 14px;border-radius:6px;font-weight:600;text-align:left;border:1px solid var(--border-light);border-left:3px solid #025857;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#f0f7f7\';this.style.borderColor=\'#c5ddd8\'" onmouseout="this.style.background=\'var(--card-bg)\';this.style.borderColor=\'var(--border-light)\'">🏃 Προπονήσεις (MET)</button>'
    +'<button class="btn" onclick="openDietModal()" style="background:var(--card-bg);color:var(--text-strong);padding:12px 14px;border-radius:6px;font-weight:600;text-align:left;border:1px solid var(--border-light);border-left:3px solid #025857;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#f0f7f7\';this.style.borderColor=\'#c5ddd8\'" onmouseout="this.style.background=\'var(--card-bg)\';this.style.borderColor=\'var(--border-light)\'">🥗 Διατροφή</button>'
    +'<button class="btn" onclick="openMedicalConditionsModal()" style="background:var(--card-bg);color:var(--text-strong);padding:12px 14px;border-radius:6px;font-weight:600;text-align:left;border:1px solid var(--border-light);border-left:3px solid #025857;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#f0f7f7\';this.style.borderColor=\'#c5ddd8\'" onmouseout="this.style.background=\'var(--card-bg)\';this.style.borderColor=\'var(--border-light)\'">🩺 Ιατρικές Συνθήκες</button>'
    +'<button class="btn" onclick="openCombinedSupplementsModal()" style="background:var(--card-bg);color:var(--text-strong);padding:12px 14px;border-radius:6px;font-weight:600;text-align:left;border:1px solid var(--border-light);border-left:3px solid #025857;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#f0f7f7\';this.style.borderColor=\'#c5ddd8\'" onmouseout="this.style.background=\'var(--card-bg)\';this.style.borderColor=\'var(--border-light)\'">💊 Συμπληρώματα</button>'
    +'</div>'
    // ✅ 2x/day training: now handled by adding 2 MET activities on the same day (different times)
    +'<div id="hint-2x-training" style="background:#E8F5E9;padding:8px 12px;border-radius:6px;font-size:11px;color:#2E7D32;margin-bottom:15px;border-left:3px solid #025857;">💡 Για 2 προπονήσεις την ίδια ημέρα, πρόσθεσε 2 δραστηριότητες στις «🏃 Προπονήσεις (MET)» με διαφορετική ώρα.</div>'

    // ✅ MET Activities table moved inside SECTION 3
    // ✅ Day targets table with macros per day (with T/R badges) — S1 ONLY, collapsible (derived from TDEE, rarely hand-edited)
    +'<div class="section-card" id="sec-daytgt" style="margin-top:12px;">'
    +'<div class="section-header sec-collapse-hd" onclick="toggleSec(\'daytgt\')"><div><span class="section-icon">📊</span>Ημερήσιοι Στόχοι ανά Ημέρα'+(secState.daytgt?'<div class="sec-collapse-preview">~'+avgTarget+' kcal/ημέρα (μέσος όρος)</div>':'')+'</div><span class="sec-chevron'+(secState.daytgt?'':' open')+'">▸</span></div>'
    +'<div id="sec-daytgt-body" style="display:'+(secState.daytgt?'none':'block')+'">'
    +buildDayTgtHtml(c,t)
    +'</div>'
    +'</div>'
    // +buildExcludeHtml(c)
    // ✅ TEMPLATE SELECTOR - Show available nutrition plan templates
    +buildTmplSelectorHtml(c)
    // ✅ PLAN GENERATION BUTTON ONLY IN S1
    // ✅ Quick-actions button lives in this same bar (not a separate floating "+") so there's one
    // bottom action bar instead of two overlapping fixed elements — see swTab() for the paired
    // hide/show of the circular .fab, which only reappears on tabs that don't have this bar.
    +'<div id="genplan-row" class="brow"><button class="btn primary" style="flex:1" onclick="genPlanWithUndo()">Δημιουργία πλάνου →</button><button id="fab-btn-alt" class="btn secondary" style="flex:none;padding:10px 14px" onclick="fabMenu()" title="Γρήγορες ενέργειες" aria-label="Γρήγορες ενέργειες">⋯</button></div>'
    +'</div>'
    // ✅ S2: MEAL PLAN VIEW ONLY
    +'<div id="s2" style="display:none">'
    +'<div class="plan-actions-primary">'
      +'<button class="btn primary" onclick="showSavePlanPanel()">&#128190; Αποθήκευση Διατροφής</button>'
      +'<button class="btn secondary" onclick="openPublishModal()" title="Δημιούργησε σύνδεσμο για να δει ο πελάτης το πλάνο στο κινητό του">&#128241; Στείλε στον πελάτη</button>'
    +'</div>'
    +((window.Cloud && window.Cloud.isStale(c))?'<div class="plan-stale-warning" title="Το πλάνο άλλαξε μετά την τελευταία δημοσίευση. Πάτα «Στείλε στον πελάτη» ξανά για να ενημερωθεί ο σύνδεσμος του πελάτη.">&#9888;&#65039; Ο σύνδεσμος πελάτη είναι ξεπερασμένος</div>':'')
    +'<div class="plan-links-row">'
      +'<button class="btn tertiary" onclick="swTab(1)">&#8592; Στοιχεία</button>'
      +'<button class="btn tertiary regen-plan-btn" onclick="regeneratePlan()" title="Αντικαθιστά ΟΛΗ την εβδομάδα με νέο πλάνο">&#8635; Αναδημιουργία</button>'
      +'<button class="btn tertiary" id="star-tmpl-btn" onclick="toggleMealTemplate()" title="Χρήση των γευμάτων αυτού του πελάτη ως έμπνευση σε νέα πλάνα">'+(c.isMealTemplate?'⭐ Πρότυπο γεύσης':'☆ Όρισε ως πρότυπο γεύσης')+'</button>'
      +'<button class="btn tertiary save-tmpl-btn" onclick="showSaveTmplPanel()">&#128190; Αποθ. ως πρότυπο</button>'
    +'</div>'
    +'<div class="plan-export-dropdown">'
      +'<button class="btn plan-export-btn" onclick="togglePlanExportMenu(this)">&#8659; Εξαγωγή &#9662;</button>'
      +'<div class="plan-export-menu" id="plan-export-menu">'
        +'<button onclick="closePlanExportMenu();exportWord()">Word (.rtf)</button>'
        +'<button onclick="closePlanExportMenu();exportGoogleDocs()">Google Docs (.docx)</button>'
        +'<button onclick="closePlanExportMenu();exportPDF()">PDF</button>'
        +'<button onclick="closePlanExportMenu();exportPDF(\'en\')">PDF (English)</button>'
      +'</div>'
    +'</div>'
    +'<div id="save-tmpl-panel" class="save-tmpl-panel" style="display:none">'
    +'<span class="save-tmpl-lbl">Όνομα:</span>'
    +'<input type="text" id="save-tmpl-name" class="save-tmpl-inp" placeholder="π.χ. Πλάνο Muay Thai 1800kcal...">'
    +'<span class="save-tmpl-lbl">Κατηγορία:</span>'
    +'<select id="save-tmpl-goal" class="save-tmpl-sel">'
    +'<option value="loss"'+(c.goalMain==='loss'?' selected':'')+'>Απώλεια βάρους</option>'
    +'<option value="mild"'+(c.goalMain==='mild'?' selected':'')+'>Ήπια απώλεια</option>'
    +'<option value="maintain"'+(c.goalMain==='maintain'?' selected':'')+'>Διατήρηση</option>'
    +'<option value="gain"'+(c.goalMain==='gain'?' selected':'')+'>Αύξηση μάζας</option>'
    +'</select>'
    +'<button class="btn" style="padding:5px 12px;font-size:11px;background:#025857;color:#fff;border:none" onclick="doSaveAsTmpl()">&#10003; Αποθήκευση</button>'
    +'<button class="btn" style="padding:5px 10px;font-size:11px;background:#eee;color:#555;border:none" onclick="closeSaveTmplPanel()">&#10005;</button>'
    +'</div>'
    +'<div class="plan-wrap"><div class="week-main"><div id="week-con"></div></div>'
    +'<div class="food-lib'+(isFoodLibCollapsed()?' collapsed':'')+'" id="food-lib">'
    +'<button class="food-lib-toggle" onclick="toggleFoodLib()" title="Απόκρυψη/εμφάνιση τροφίμων" aria-label="Απόκρυψη/εμφάνιση τροφίμων">'+(isFoodLibCollapsed()?'‹':'›')+'</button>'
    +'<div class="food-lib-body"><div class="food-lib-title">Τρόφιμα</div>'
    +'<div id="active-meal-indicator" class="active-meal-indicator"></div>'
    +'<input class="food-lib-search" type="text" placeholder="Αναζήτηση..." oninput="filterLib(this)">'
    +'<div id="lib-list"></div></div></div></div>'
    +'<div id="supp-notes"></div></div>'
    +'<div id="s3" style="display:none">'+buildTrackerHtml(c)+'</div>'
    +'<div id="s3b" style="display:none">'+buildAppointmentsHtml(c)+'</div>'
    +'<div id="s4" style="display:none">'+buildPlanHistoryHtml(c)+'</div>';
  document.getElementById('main').innerHTML=html;

  // ✅ UPDATE ALL INPUT FIELDS WITH CURRENT CLIENT DATA
  document.getElementById('inp-name').value=c.name||'';
  var _inpEmail=document.getElementById('inp-email');if(_inpEmail)_inpEmail.value=c.email||'';
  var _inpPhone=document.getElementById('inp-phone');if(_inpPhone)_inpPhone.value=c.phone||'';
  var _inpLang=document.getElementById('inp-lang');if(_inpLang)_inpLang.value=c.lang||'el';
  var _inpGroup=document.getElementById('inp-group');
  if(_inpGroup){
    var _groupNames=getAllGroupNames();
    if(c.group && _groupNames.indexOf(c.group)===-1) _groupNames.push(c.group); // παλιά/αρχειοθετημένη τιμή — μη χαθεί σιωπηλά
    var _groupOptsHtml='<option value=""'+(!c.group?' selected':'')+'>— Χωρίς ομάδα —</option>';
    _groupNames.forEach(function(g){_groupOptsHtml+='<option value="'+esc(g)+'"'+(c.group===g?' selected':'')+'>'+esc(g)+'</option>';});
    _groupOptsHtml+='<option value="__new__">+ Νέα ομάδα…</option>';
    _inpGroup.innerHTML=_groupOptsHtml;
  }
  document.getElementById('inp-sex').value=c.sex||'';
  var _inpBirthdate=document.getElementById('inp-birthdate');if(_inpBirthdate)_inpBirthdate.value=(c.birthDate&&/^\d{4}-\d{2}-\d{2}$/.test(c.birthDate))?c.birthDate:'';
  updateAgeDisplay();
  document.getElementById('inp-weight').value=c.weight||'';
  document.getElementById('inp-height').value=c.height||'';
  var afInp0=document.getElementById('inp-activity-factor');
  if(afInp0){var _palByKey={sed:1.2,light:1.375,mod:1.55,active:1.725};afInp0.value=(c.activityFactor>0)?c.activityFactor:(_palByKey[c.activity]||'');}
  // ✅ Update goal display (numeric adjuster)
  var goalVal = (typeof c.goal === 'string' && !isNaN(parseInt(c.goal))) ? parseInt(c.goal) : 0;
  document.getElementById('inp-goal').value=goalVal;
  var goalDisplay=document.getElementById('goal-display');
  if(goalDisplay) goalDisplay.textContent = (goalVal >= 0 ? '+' : '') + goalVal;
  var inpDietType=document.getElementById('inp-dietType');if(inpDietType)inpDietType.value=c.dietType||'normal';
  var inpFormula=document.getElementById('inp-formula');if(inpFormula)inpFormula.value=c.formula||'mifflin';
  var inpBf=document.getElementById('inp-bf');if(inpBf)inpBf.value=c.bf||'';
  var inpLm=document.getElementById('inp-leanmass');if(inpLm)inpLm.value=c.leanmass||'';
  var inpSport=document.getElementById('inp-sport');if(inpSport)inpSport.value=c.sport||'';
  var inpPref=document.getElementById('inp-preferences');if(inpPref)inpPref.value=c.preferences||'';

  // ✅ ADD EVENT LISTENERS
  document.getElementById('inp-name').oninput=function(){upd('name',this.value);};
  if(_inpEmail)_inpEmail.oninput=function(){upd('email',this.value.trim());};
  if(_inpPhone)_inpPhone.oninput=function(){upd('phone',this.value.trim());};
  if(_inpLang)_inpLang.onchange=function(){upd('lang',this.value);};
  if(_inpGroup){
    var _groupNewRow=document.getElementById('inp-group-new-row');
    var _groupNewInput=document.getElementById('inp-group-new');
    _inpGroup.onchange=function(){
      if(this.value==='__new__'){
        _groupNewRow.style.display='flex';
        _groupNewInput.value='';
        _groupNewInput.focus();
      } else {
        _groupNewRow.style.display='none';
        upd('group',this.value);
      }
    };
    var _confirmNewGroup=document.getElementById('inp-group-new-confirm');
    if(_confirmNewGroup)_confirmNewGroup.onclick=function(){
      var name=_groupNewInput.value.trim();
      if(!name) return;
      // αν υπάρχει ήδη ίδια ομάδα (διαφορετικά κεφαλαία/κενά), χρησιμοποίησε την υπάρχουσα ακριβή τιμή
      // αντί να δημιουργήσεις σχεδόν-διπλότυπο κατά λάθος
      var existing=getAllGroupNames().find(function(g){return normalizeGroupName(g)===normalizeGroupName(name);});
      upd('group',existing||name);
      renderMain();
    };
    var _cancelNewGroup=document.getElementById('inp-group-new-cancel');
    if(_cancelNewGroup)_cancelNewGroup.onclick=function(){
      _inpGroup.value=c.group||'';
      _groupNewRow.style.display='none';
    };
  }
  // ⚠️ inp-sex.onchange is (re)assigned by setupFormEventListeners() below, which always runs LAST
  // in this function and would silently clobber a handler set here (same pattern as the historical
  // duplicate rateMeal/validateClientData bugs) — the pregnancy-toggle-visibility logic for sex lives
  // there instead, see the 'inp-sex' special-case in setupFormEventListeners().
  var _bdEl=document.getElementById('inp-birthdate');
  if(_bdEl)_bdEl.onchange=function(){commitBirthdate(c);};
  var _pregCb=document.getElementById('inp-pregnant');
  if(_pregCb)_pregCb.onchange=function(){
    upd('pregnant',this.checked);
    var pf=document.getElementById('preg-fields-wrap');if(pf)pf.style.display=this.checked?'flex':'none';
  };
  var _gestWeekInp=document.getElementById('inp-gestweek');
  if(_gestWeekInp)_gestWeekInp.oninput=function(){
    upd('gestationalWeek',+this.value);
    var badge=document.getElementById('preg-tri-badge');if(badge)badge.textContent=getPregTrimesterLabel(+this.value);
  };
  var _prePregWInp=document.getElementById('inp-prepregweight');
  if(_prePregWInp)_prePregWInp.oninput=function(){upd('prePregnancyWeight',+this.value);};
  document.getElementById('inp-weight').onblur=function(){upd('weight',+this.value);};
  document.getElementById('inp-height').onblur=function(){upd('height',+this.value);};
  var rmrInp=document.getElementById('inp-rmr');
  if(rmrInp){
    // ✅ Save live on every keystroke so the value is never lost if the panel
    //    re-renders (goal/activity/age change → renderMain) while RMR has focus.
    rmrInp.oninput=function(){upd('rmr',+this.value||0);};
    rmrInp.onblur=function(){upd('rmr',+this.value||0);};
  }
  var bfProfInp=document.getElementById('inp-bf');
  if(bfProfInp)bfProfInp.onblur=function(){upd('bf',+this.value||0);};
  var lmInp=document.getElementById('inp-leanmass');
  if(lmInp)lmInp.onblur=function(){upd('leanmass',+this.value||0);};
  var afInp=document.getElementById('inp-activity-factor');
  if(afInp)afInp.onchange=function(){
    var v=parseFloat(this.value);
    if(!v||v<1||v>3){showErrorToast('Η τιμή πρέπει να είναι μεταξύ 1.0 και 3.0');this.value=(getC().activityFactor||'');return;}
    setActivityFactor(v,null);
  };
  document.getElementById('inp-goal').onchange=function(){upd('goal',this.value);};
  // Sport selector — auto-update macros & show sport-specific notes & toggle conditional visibility
  var sportSel=document.getElementById('inp-sport');
  if(sportSel){
    sportSel.onchange=function(){
      upd('sport',this.value);
      updateConditionalVisibility(this.value);
      var noteDiv=document.getElementById('sport-note');
      if(this.value && SPORT_PROFILES[this.value]){
        var prof=SPORT_PROFILES[this.value];
        if(noteDiv)noteDiv.textContent=prof.notes;
        // Auto-update macro preset to match sport
        var macroPresetSel=document.querySelector('[data-preset-sel]');
        if(macroPresetSel){
          macroPresetSel.value=this.value;
          upd('macroPreset',this.value);
        }
      } else {
        if(noteDiv)noteDiv.textContent='';
      }
    };
    // Show initial sport note and set initial visibility
    updateConditionalVisibility(c.sport);
    if(c.sport && SPORT_PROFILES[c.sport]){
      var noteDiv=document.getElementById('sport-note');
      if(noteDiv)noteDiv.textContent=SPORT_PROFILES[c.sport].notes;
    }
  }
  var fSel=document.getElementById('inp-formula');
  if(fSel)fSel.onchange=function(){
    upd('formula',this.value);
    var w=document.getElementById('lbm-wrap');if(w)w.style.display=this.value==='cunningham'?'block':'none';
  };
  var lbmInp=document.getElementById('inp-lbm');
  if(lbmInp)lbmInp.oninput=function(){upd('lbm',+this.value);};
  // ✅ Allergies handler
  var allerInp=document.getElementById('inp-allergies');
  if(allerInp)allerInp.oninput=function(){upd('allergies',this.value);};
  // ✅ Preferences handler
  var prefInp=document.getElementById('inp-preferences');
  if(prefInp)prefInp.oninput=function(){upd('preferences',this.value);};
  // Week table is only rendered in tab 2 (via swTab), not here in s1.

  // ← Setup event listeners for all form inputs (CRITICAL for auto-recalculation)
  setupFormEventListeners();
}


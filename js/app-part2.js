
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// LOGIN / LOGOUT / APP STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function goToApp(){
  // Show app, hide login
  try {
    var loadingGate=document.getElementById('app-loading-gate'); if(loadingGate) loadingGate.style.display='none';
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    renderSB();  // Load client list
    if(typeof renderHome==='function') renderHome();
    if(window.Cloud && typeof window.Cloud.refreshCheckinsCache==='function') window.Cloud.refreshCheckinsCache();
    if(window.Cloud && typeof window.Cloud.refreshClientLogsCache==='function') window.Cloud.refreshClientLogsCache();
    if(window.Cloud && typeof window.Cloud.refreshPlanFeedbackCache==='function') window.Cloud.refreshPlanFeedbackCache();
    if(window.Cloud && typeof window.Cloud.refreshLinkHealthCache==='function') window.Cloud.refreshLinkHealthCache();
    // 2026-08-23: κρατά τα παραπάνω 4 caches ζωντανά όσο ο διαιτολόγος έχει ανοιχτή την εφαρμογή —
    // πριν ανανεώνονταν μόνο εδώ, στο login, βλ. js/app-part1.js.
    if(typeof startPortalPollInterval==='function') startPortalPollInterval();
  } catch(e) {
    console.error('Error in goToApp():', e.message);
    showErrorToast('Σφάλμα: ' + e.message);
  }
}

function createNewAccount(){
  // Show welcome modal and then go to app
  try {
    showSuccessToast('✨ Καλώς ήρθες! Ας ξεκινήσουμε...');
    setTimeout(function(){
      goToApp();
    }, 500);
  } catch(e) {
    console.error('Error in createNewAccount():', e.message);
    showErrorToast('Σφάλμα: ' + e.message);
  }
}

// ✅ PHASE 4: UNDO/REDO WRAPPER FUNCTIONS
function undo(){
  if(!window.undoRedoManager) return;
  window.undoRedoManager.undo();
  renderMain(); // rebuilds the client header (incl. its own #undoBtn/#redoBtn) — must run before the UI sync below
  updateUndoRedoUI();
}

function redo(){
  if(!window.undoRedoManager) return;
  window.undoRedoManager.redo();
  renderMain();
  updateUndoRedoUI();
}

// ✅ TIER 2: CONFIRMATION DIALOG SYSTEM
// Στυλιζαρισμένη εναλλακτική του native confirm() — ίδιο dialog HTML με #confirmDialog.
var _confirmPendingCallback = null;
var _confirmPendingSecondary = null;

// opts.secondary = {label, onClick} — προσθέτει ένα 3ο κουμπί (π.χ. "Αντικατάσταση" ανάμεσα σε
// "Άκυρο"/"Συγχώνευση") για επιλογές με 3 πραγματικές εκβάσεις αντί για confirm()'s true/false.
// opts.items = [{type:'alert'|'warn', msg}] — προαιρετική δομημένη λίστα προειδοποιήσεων (π.χ. από
// calcTDEE().warnings), εμφανίζεται ως ξεχωριστές έγχρωμες σειρές (κόκκινο='alert' πάνω από κίτρινο=
// 'warn') αντί για ένα αδιαφοροποίητο μπλοκ κειμένου — έτσι μια κρίσιμη προειδοποίηση (π.χ. RED-S) δεν
// χάνεται ανάμεσα σε δευτερεύουσες. Όταν δεν δίνεται, η συμπεριφορά είναι ίδια με πριν (plain text).
function showConfirmDialog(message, onConfirm, opts){
  opts = opts || {};
  var dlg = document.getElementById('confirmDialog');
  if(!dlg){ if(window.confirm(message)) onConfirm(); return; }
  document.getElementById('confirmTitle').textContent = opts.title || 'Επιβεβαίωση';
  var msgEl = document.getElementById('confirmMessage');
  if(opts.items && opts.items.length){
    var rows = opts.items.slice().sort(function(a,b){
      return (a.type==='alert'?0:1) - (b.type==='alert'?0:1);
    }).map(function(w){
      var isAlert = w.type==='alert';
      // Το msg συχνά ξεκινάει ήδη με το ίδιο emoji (π.χ. RED-S με 🔴) — αφαιρείται εδώ ώστε να μη
      // διπλασιάζεται με το row icon· άλλα emoji (🤰/🚫/⚠️) μένουν, δίνουν επιπλέον νόημα πέρα από τη σοβαρότητα.
      var text = w.msg.replace(isAlert?/^🔴\s*/:/^🟡\s*/,'');
      return '<div style="display:flex;gap:8px;align-items:flex-start;background:'+(isAlert?'#fdecea':'#fff8e1')+';'
        +'border-radius:8px;padding:8px 10px;margin-bottom:8px;">'
        +'<span style="font-size:15px;line-height:1.4;">'+(isAlert?'🔴':'🟡')+'</span>'
        +'<span style="font-size:13px;color:'+(isAlert?'#c62828':'#8a6100')+';line-height:1.5;">'+esc(text)+'</span>'
        +'</div>';
    }).join('');
    msgEl.innerHTML = rows + (opts.itemsFooter?'<div style="margin-top:2px;">'+esc(opts.itemsFooter)+'</div>':'');
  } else {
    msgEl.textContent = message;
  }
  document.getElementById('confirmIcon').textContent = opts.icon || '⚠️';
  document.getElementById('confirmBtn').textContent = opts.confirmLabel || 'Διαγραφή';
  var secBtn = document.getElementById('confirmSecondaryBtn');
  if(opts.secondary){
    secBtn.textContent = opts.secondary.label;
    secBtn.style.display = 'inline-block';
    _confirmPendingSecondary = opts.secondary.onClick;
  } else {
    secBtn.style.display = 'none';
    _confirmPendingSecondary = null;
  }
  _confirmPendingCallback = onConfirm;
  dlg.style.display = 'flex';
  dlg.setAttribute('data-open', 'true'); // css/styles.css forces #confirmDialog{display:none!important} unless this is set
  var cancelBtn = dlg.querySelector('button[onclick="closeConfirmDialog()"]');
  if(cancelBtn) cancelBtn.focus();
}

function closeConfirmDialog(){
  var dlg = document.getElementById('confirmDialog');
  if(dlg){ dlg.style.display = 'none'; dlg.setAttribute('data-open', 'false'); }
  _confirmPendingCallback = null;
  _confirmPendingSecondary = null;
}

function executeConfirm(){
  var cb = _confirmPendingCallback;
  closeConfirmDialog();
  if(cb) cb();
}

function executeConfirmSecondary(){
  var cb = _confirmPendingSecondary;
  closeConfirmDialog();
  if(cb) cb();
}

// ✅ TEXT INPUT DIALOG SYSTEM — στυλιζαρισμένη εναλλακτική του native prompt().
// onSubmit(value) καλείται ΜΟΝΟ όταν πατηθεί OK (αντίστοιχο του prompt()!==null).
var _promptPendingCallback = null;

function showPromptDialog(message, defaultValue, onSubmit, opts){
  opts = opts || {};
  var dlg = document.getElementById('promptDialog');
  if(!dlg){ var v = window.prompt(message, defaultValue); if(v !== null) onSubmit(v); return; }
  document.getElementById('promptTitle').textContent = opts.title || 'Στοιχείο';
  document.getElementById('promptMessage').textContent = message;
  document.getElementById('promptOkBtn').textContent = opts.okLabel || 'OK';
  var inp = document.getElementById('promptInput');
  inp.type = opts.inputType || 'text';
  inp.value = defaultValue || '';
  inp.placeholder = opts.placeholder || '';
  _promptPendingCallback = onSubmit;
  dlg.style.display = 'flex';
  setTimeout(function(){ inp.focus(); inp.select(); }, 0);
}

function closePromptDialog(){
  var dlg = document.getElementById('promptDialog');
  if(dlg) dlg.style.display = 'none';
  _promptPendingCallback = null;
}

function executePrompt(){
  var cb = _promptPendingCallback;
  var val = document.getElementById('promptInput').value;
  closePromptDialog();
  if(cb) cb(val);
}

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    var pdlg = document.getElementById('promptDialog');
    if(pdlg && pdlg.style.display !== 'none') closePromptDialog();
  }
  if(e.key === 'Enter' && document.activeElement && document.activeElement.id === 'promptInput'){
    var pdlg2 = document.getElementById('promptDialog');
    if(pdlg2 && pdlg2.style.display !== 'none'){ e.preventDefault(); executePrompt(); }
  }
});

document.addEventListener('keydown', function(e){
  if(e.key === 'Escape'){
    var dlg = document.getElementById('confirmDialog');
    if(dlg && dlg.style.display !== 'none') closeConfirmDialog();
  }
});

function updateUndoRedoUI(){
  if(!window.undoRedoManager) return;
  var canUndo = window.undoRedoManager.canUndo();
  var canRedo = window.undoRedoManager.canRedo();
  // 'undoBtn'/'redoBtn' = green pair rendered inside a client's own header (only exists while a
  // client is open); 'undoBtnGlobal'/'redoBtnGlobal' = always-visible sidebar toolbar (added so
  // undo/redo works from list views too, e.g. after deleting a client from Πελάτες).
  ['undoBtn','undoBtnGlobal'].forEach(function(id){
    var btn = document.getElementById(id);
    if(btn){ btn.disabled = !canUndo; btn.style.opacity = canUndo ? '1' : '0.5'; }
  });
  ['redoBtn','redoBtnGlobal'].forEach(function(id){
    var btn = document.getElementById(id);
    if(btn){ btn.disabled = !canRedo; btn.style.opacity = canRedo ? '1' : '0.5'; }
  });
}

function logout(){
  if(typeof stopAutoSaveInterval==='function') stopAutoSaveInterval(); // otherwise the 30s autosave keeps firing (and calling Cloud.save()) after logout
  if(typeof stopPortalPollInterval==='function') stopPortalPollInterval(); // same reason, for the 2-min portal-message poll
  // ☁️ CLOUD: πραγματική αποσύνδεση (σβήνει το session, ξαναφορτώνει στο login)
  if(window.Cloud && window.Cloud.enabled){ window.Cloud.signOut(); return; }
  // Clear current selection
  curId = null;
  // Hide app, show login
  document.getElementById('app-container').style.display = 'none';
  document.getElementById('login-page').style.display = 'flex';
  // Optionally clear data (comment out to keep data)
  // clients = []; customTemplates = []; TRACKING_DATA = { plans: [], recipes: {}, patterns: {}, lastUpdated: null };
  // save();
}

// Ανανεώνει το shareToken ΚΑΘΕ πελάτη που έχει δημοσιευμένο σύνδεσμο portal — διαγράφει την παλιά
// εγγραφή στο shared_plans (ώστε ο παλιός σύνδεσμος να σταματήσει να δουλεύει αμέσως) και δημοσιεύει
// ξανά με νέο, ισχυρό token. Χρήσιμο μετά από πιθανή έκθεση συνδέσμων (π.χ. RLS fix).
function rotateAllShareTokens(){
  if(!window.Cloud || !window.Cloud.enabled){ showErrorToast('Χρειάζεται σύνδεση στο cloud για αυτή την ενέργεια.'); return; }
  var toRotate=clients.filter(function(c){ return c.shareToken && !c.deleted; });
  if(!toRotate.length){ showErrorToast('Κανένας πελάτης δεν έχει δημοσιευμένο σύνδεσμο portal αυτή τη στιγμή.'); return; }
  showConfirmDialog('Θα ανανεωθούν οι σύνδεσμοι portal για '+toRotate.length+' πελάτ'+(toRotate.length===1?'η':'ες')+'. Οι ΠΑΛΙΟΙ σύνδεσμοι θα σταματήσουν να δουλεύουν αμέσως — θα χρειαστεί να στείλεις τον νέο σύνδεσμο σε κάθε πελάτη ξανά.\n\nΣυνέχεια;', function(){
    if(typeof closeSettingsPanel==='function') closeSettingsPanel();
    var done=0, failed=[];
    function next(i){
      if(i>=toRotate.length){
        showSuccessToast('Ολοκληρώθηκε: '+done+' / '+toRotate.length+' σύνδεσμοι ανανεώθηκαν.'+(failed.length?' Απέτυχαν: '+failed.join(', '):''));
        return;
      }
      var c=toRotate[i];
      window.Cloud.unpublishPlan(c).then(function(){
        c.shareToken=genSecureToken();
        return window.Cloud.publishPlan(c);
      }).then(function(){
        done++; next(i+1);
      }).catch(function(){
        failed.push(c.name||'άγνωστος πελάτης'); next(i+1);
      });
    }
    next(0);
  }, {confirmLabel:'Ανανέωση'});
}

// Check if app should start
function initializeApp(){
  // Load clients from localStorage if they exist
  var savedClients = safeStorageGet('fyh_clients', null);
  if(savedClients && Array.isArray(savedClients) && savedClients.length > 0){
    clients = savedClients;
  } else {
    // Try old format (object with client IDs as keys)
    var oldClients = safeStorageGet('clients', null);
    if(oldClients && typeof oldClients === 'object' && !Array.isArray(oldClients)){
      // Convert old format to array
      clients = [];
      for(var key in oldClients){
        if(oldClients.hasOwnProperty(key)){
          clients.push(oldClients[key]);
        }
      }
    }
  }

  // Load custom templates from localStorage
  var savedTemplates = safeStorageGet('fyh_custom_tmpls', null);
  if(savedTemplates && Array.isArray(savedTemplates)){
    customTemplates = savedTemplates;
  }

  // ☁️ CLOUD: το login & η φόρτωση δεδομένων γίνονται μέσω Supabase.
  // Cloud.init() ελέγχει αν υπάρχει ενεργή σύνδεση → φορτώνει cloud → app,
  // αλλιώς δείχνει την οθόνη login. (Τα τοπικά clients μένουν σαν cache.)
  if(window.Cloud){
    window.Cloud.init();
  } else if(clients && clients.length > 0){
    goToApp();
  } else {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
  }

  // Start auto-save interval
  startAutoSaveInterval();
}

function deleteCustomTmpl(id){
  showConfirmDialog('Διαγραφή αυτού του προτύπου;', function(){
    customTemplates=customTemplates.filter(function(t){return t.id!==id;});
    clients.forEach(function(cl){if(cl.selectedTemplate===id)cl.selectedTemplate=null;});
    save();renderTemplateEditor();
  });
}
function selectTmplForClient(id){
  var c=getC();if(!c)return;
  c.selectedTemplate=id||null;
  save();
}

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

// ✅ Single consolidated findings panel — replaces 3 separately-colored, separately-styled boxes
// (RED-S/energy availability, TDEE double-counting/macro warnings, creatine tip) that all read as
// equally urgent. Now one severity dot per row (red=risk, amber=borderline, purple=info-only tip),
// so the actually-serious item is the one that stands out instead of everything shouting at once.
function buildInsightsPanelHtml(c,t){
  var items=[];

  // RED-S / energy availability — thresholds per IOC Consensus Statement on RED-S (2018):
  // EA<30 kcal/kgLBM/day = critical, <45 = borderline. Nothing shown when healthy/unmeasurable.
  // ✅ 2026-08-01: "RED-S" is athlete-specific IOC terminology (Relative Energy Deficiency in
  // SPORT) — for a client with no c.sport, use the generic "χαμηλή ενεργειακή διαθεσιμότητα"
  // wording and drop the sport-specific IOC citation link (same threshold, different label).
  if(t.ea!=null && t.ea<45){
    var isCrit=t.ea<30;
    var isAthlete=!!c.sport;
    var eaLabel=isAthlete
      ?(isCrit?'🔴 Κίνδυνος RED-S':'🟡 Οριακή Ενεργειακή Διαθεσιμότητα')
      :(isCrit?'🔴 Χαμηλή ενεργειακή διαθεσιμότητα':'🟡 Οριακή ενεργειακή πρόσληψη');
    items.push({sev:isCrit?'bad':'warn', text:
      '<b>'+eaLabel+':</b> EA='+t.ea+' kcal/kgLBM ('+(isCrit?'κατώφλι &lt;30':'στόχος &gt;45')+')'
      +(isAthlete?(' <a href="https://stillmed.olympics.com/media/Documents/Athletes/Medical-Scientific/Consensus-Statements/REDs/IOC-consensus-statement-Relative-Energy-Deficiency-in-Sport-2018.pdf" target="_blank" style="color:inherit;text-decoration:underline">IOC Consensus 2018 ↗</a>'):'')
    });
  }

  // General TDEE/macro warnings computed by calcTDEE() (e.g. double-counting risk, protein out of range).
  (t.warnings||[]).forEach(function(w){
    items.push({sev:w.type==='alert'?'bad':'warn', text:esc(w.msg)});
  });

  // Creatine tip — informational only, never a risk, so it's always the lowest-severity row.
  var creatineRelevant=(c.sport && CREATINE_SUGGESTED_SPORTS[c.sport]) || c.dietType==='bodybuilding_clean';
  if(creatineRelevant){
    items.push({sev:'info', text:
      '<b>💊 Κρεατίνη:</b> 3-5g/ημέρα κρεατίνη μονοϋδρική — από τα πιο μελετημένα συμπληρώματα για δύναμη/όγκο, ασφαλές σε μακροχρόνια χρήση.'
      +' <a href="https://link.springer.com/article/10.1186/s12970-017-0173-z" target="_blank" style="color:inherit;text-decoration:underline">ISSN Position Stand 2017 ↗</a>'
    });
  }

  if(!items.length) return '';

  var sevColor={bad:'#c62828',warn:'#f9a825',info:'#6a1b9a'};
  var rowsHtml=items.map(function(it,i){
    var borderStyle=(i<items.length-1)?'border-bottom:1px solid #eee;':'';
    return '<div style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;'+borderStyle+'font-size:12px;color:var(--text-strong)">'
      +'<span style="flex-shrink:0;width:8px;height:8px;border-radius:50%;margin-top:4px;background:'+sevColor[it.sev]+'"></span>'
      +'<span style="flex:1">'+it.text+'</span>'
      +'</div>';
  }).join('');

  return '<div style="margin-top:10px;border:1px solid var(--border-light);border-radius:8px;overflow:hidden;background:var(--card-bg)">'
    +'<div style="padding:8px 10px;background:#f7f7f7;font-size:11px;font-weight:700;color:#555">📋 '+items.length+' εύρημα'+(items.length>1?'τα':'')+' σε αυτό το πλάνο</div>'
    +rowsHtml
    +'</div>';
}

function setDietType(dtype){
  var c=getC();if(!c)return;
  c.dietType=dtype;
  // If keto is selected, automatically set keto macros (Π25/Λ60/Υ15)
  if(dtype==='keto'){
    c.macroPreset='custom';
    c.macroP=25;
    c.macroF=60;
    c.macroC=15;
  }
  save();
  onClientChange();
}
function setMacroPreset(k){
  var c=getC();if(!c)return;
  var pr=MACRO_PRESETS[k];if(!pr)return;
  c.macroPreset=k;
  c._macroPresetManual=true;  // real dietitian click — protects this choice from applyGoalMacros()'s smart default
  c.macroP=pr.p;c.macroF=pr.f;c.macroC=pr.c;
  save();
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

function setMacroCustom(key,val){
  var c=getC();if(!c)return;
  var v=Math.max(5,Math.min(80,parseInt(val)||25));
  // Rescale the other two fields so all three always sum to exactly 100 — otherwise
  // calcTDEE's carb-as-remainder math ((target-protein-fat)/4) can go negative when
  // protein+fat alone already exceed 100% (e.g. 50%+60%), corrupting the whole plan.
  var cur={p:c.macroP!=null?c.macroP:25,f:c.macroF!=null?c.macroF:25,c:c.macroC!=null?c.macroC:50};
  cur[key]=v;
  var otherKeys=['p','f','c'].filter(function(k){return k!==key;});
  var remaining=100-v;
  var otherSum=cur[otherKeys[0]]+cur[otherKeys[1]];
  if(otherSum<=0){
    cur[otherKeys[0]]=Math.round(remaining/2);
  } else {
    cur[otherKeys[0]]=Math.round(remaining*cur[otherKeys[0]]/otherSum);
  }
  cur[otherKeys[1]]=remaining-cur[otherKeys[0]];
  c.macroP=cur.p;c.macroF=cur.f;c.macroC=cur.c;
  save();
  // Trigger update to recalculate TDEE and update table
  upd('macroP',c.macroP);
  upd('macroF',c.macroF);
  upd('macroC',c.macroC);
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

// Πρόοδος πελάτη από το portal (checkins που στέλνει το plan.html στο Supabase).
function buildClientProgressHtml(c){
  if(!c.shareToken) return '';
  var rows=(window.Cloud&&window.Cloud.checkinsFor)?window.Cloud.checkinsFor(c):[];
  if(!rows.length){
    return '<div class="tracker-section"><div class="tracker-head">📲 Πρόοδος πελάτη (portal)</div>'
      +'<div style="font-size:12px;color:#888;padding:6px 0">Ο πελάτης δεν έχει κάνει ακόμα check-in στο πλάνο του.</div></div>';
  }
  var byDate=ckRowsByDate(rows);
  var score=ckWeekScore(byDate,0);
  var streak=ckStreak(byDate);
  var st=ckPillarStats(ckWeekDates(0).map(function(k){return byDate[k];}).filter(Boolean));
  var gap=ckDaysSinceLast(rows);
  var lastTxt=gap===0?'σήμερα':gap===1?'χθες':gap+' μέρες πριν';

  function bar(label,done,tot){
    if(!tot) return '';
    var pct=Math.round(done/tot*100);
    return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span>'+label+'</span><span style="color:#6B756F">'+done+'/'+tot+' μέρες</span></div>'
      +'<div style="height:6px;border-radius:3px;background:#E2EEE5;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:#0F6E56"></div></div></div>';
  }
  var hist='';
  for(var w=-3; w<=0; w++){
    var ws=ckWeekScore(byDate,w);
    var hh=ws==null?4:Math.max(4,Math.round(ws*0.28));
    hist+='<div style="width:14px;height:'+hh+'px;background:'+(ws==null?'#E2EEE5':(ws>=85?'#0F6E56':ws>=60?'#5DCAA5':'#9FE1CB'))+';border-radius:2px" title="Εβδ. '+(w+4)+': '+(ws==null?'—':ws+'%')+'"></div>';
  }

  return '<div class="tracker-section">'
    +'<div class="tracker-head" style="margin-bottom:10px">📲 Πρόοδος πελάτη (portal)</div>'
    +'<div style="display:flex;gap:18px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
    +'<div style="font-size:13px"><b style="font-size:20px;color:#025857">'+(score==null?'—':score+'%')+'</b> σκορ εβδομάδας</div>'
    +'<div style="font-size:13px">🔥 <b>'+streak+'</b> μέρες σερί</div>'
    +'<div style="font-size:12px;color:#888">Τελευταίο check-in: '+lastTxt+'</div>'
    +'</div>'
    +bar('Διατροφή',st.dietDone,st.dietTot)
    +bar('Νερό',st.watDone,st.watTot)
    +bar('Συμπληρώματα',st.supDone,st.supTot)
    +'<div style="display:flex;align-items:center;gap:8px;margin-top:10px"><span style="font-size:11px;color:#888">4 εβδ.:</span><div style="display:flex;gap:4px;align-items:flex-end;height:28px">'+hist+'</div></div>'
    +'</div>';
}

function setDayMacro(key,d,v){
  var c=getC();if(!c)return;
  var t=calcTDEE(c);
  if(!c.dayTargets||typeof c.dayTargets[0]==='number')c.dayTargets=getDayTgtEff(c,t);
  var val=parseFloat(v)||0;
  if(key==='k')val=Math.max(500,Math.min(6000,val||t.target));
  c.dayTargets[d][key]=val;
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

function setTrainDay(d,isT){
  var c=getC();if(!c)return;
  if(!c.trainDays)c.trainDays=[false,false,false,false,false,false,false];
  c.trainDays[d]=isT;
  // Sync hours: when marking as T restore default hours; when R set to 0
  if(!c.trainHoursByDay)c.trainHoursByDay=[1,1,1,1,1,1,1];
  if(isT&&c.trainHoursByDay[d]===0)c.trainHoursByDay[d]=c.trainHoursPerDay||1;
  if(!isT)c.trainHoursByDay[d]=0;
  var t=calcTDEE(c);
  if(!c.dayTargets||typeof c.dayTargets[0]==='number')c.dayTargets=makeDayTgtDefaults(c,t);
  // Recalculate this day using per-day hours
  var baseHrs=c.trainHoursPerDay||1;
  var dayHrs=c.trainHoursByDay[d];
  var hScale=(isT&&baseHrs>0)?(dayHrs/baseHrs):0;
  var boost=(c.carbBoost!=null?c.carbBoost:20)/100;
  var extraC=isT?Math.round(t.carb*boost*hScale):0;
  var dayKcal=t.usedMET?Math.round(t.restTarget+(t.trainTarget-t.restTarget)*hScale):t.target;
  c.dayTargets[d].c=t.carb+extraC;
  c.dayTargets[d].k=dayKcal+extraC*4;
  var kinp=document.getElementById('dt-k-'+d);if(kinp)kinp.value=c.dayTargets[d].k;
  var cinp=document.getElementById('dt-c-'+d);if(cinp)cinp.value=c.dayTargets[d].c;
  // Update hours input appearance
  var hInp=document.getElementById('hrs-'+d);
  if(hInp){hInp.value=c.trainHoursByDay[d];hInp.className='dt-inp hrs-inp '+(isT?'hrs-t':'hrs-r');}
  // Update time input appearance and enable/disable
  var tInp=document.getElementById('time-'+d);
  if(tInp){tInp.disabled=!isT;tInp.className='dt-inp time-inp '+(isT?'time-t':'time-r');}
  save();
  upd('trainDays',c.trainDays);
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

function setTrainHours(d,v){
  var c=getC();if(!c)return;
  if(!c.trainHoursByDay)c.trainHoursByDay=[1,1,1,1,1,1,1];
  var hrs=Math.max(0,Math.min(8,parseFloat(v)||0));
  c.trainHoursByDay[d]=hrs;
  save();
  upd('trainHoursByDay',c.trainHoursByDay);
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}
function setTrainTime(d,v){
  var c=getC();if(!c)return;
  if(!c.trainTimesByDay)c.trainTimesByDay=['','','','','','',''];
  c.trainTimesByDay[d]=(v||'');
  save();
  upd('trainTimesByDay',c.trainTimesByDay);
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION (updates meal timing guide)
}
function setCarbBoost(v){
  var c=getC();if(!c)return;
  var val=parseInt(v);c.carbBoost=Math.max(0,Math.min(60,isNaN(val)?20:val));
  upd('carbBoost',c.carbBoost);
  // If no custom targets, let defaults recompute
  if(c.dayTargets)c.dayTargets=null;
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}
function setEventDate(v){
  var c=getC();if(!c)return;
  c.eventDate=v||null;
  if(c.dayTargets)c.dayTargets=null;
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION (re-applies/clears carb-loading window)
}
function resetDayTargets(){
  var c=getC();if(!c)return;
  c.dayTargets=null;
  renderMain();
}
// Ημέρα αγώνα: ανεξάρτητο σημαδάκι από το trainDays — δεν επηρεάζει θερμίδες/macros, γι' αυτό
// εδώ γίνεται μόνο save()+renderMain() (χωρίς onClientChange, που θα ξανάτρεχε το TDEE cascade).
function setMatchDay(d,isM){
  var c=getC();if(!c)return;
  if(!c.matchDays)c.matchDays=[false,false,false,false,false,false,false];
  c.matchDays[d]=isM;
  save();
  upd('matchDays',c.matchDays);
  renderMain();
}
function setMatchTimeBucket(bucket){
  var c=getC();if(!c)return;
  c.matchTimeBucket=bucket;
  save();
  upd('matchTimeBucket',bucket);
  renderMain();
}

function excludeSupp(id,timing){
  var c=getC();if(!c)return;
  if(!c.suppExclude)c.suppExclude=[];
  var key=id+'|'+timing;
  var idx=c.suppExclude.indexOf(key);
  if(idx>-1)c.suppExclude.splice(idx,1);
  else c.suppExclude.push(key);
  renderSuppNotes();
}

function renderSuppNotes(){
  var c=getC();
  var el=document.getElementById('supp-notes');
  if(!el)return;
  if(!c||!c.supps||!c.supps.length){el.innerHTML='';return;}
  if(!c.suppExclude)c.suppExclude=[];
  var byTiming={};
  SUPP_TIMINGS.forEach(function(t){byTiming[t]=[];});
  c.supps.forEach(function(id){
    var s=null;SUPPS.forEach(function(x){if(x.id===id)s=x;});
    if(!s)return;
    s.timing.forEach(function(ti){
      if(!byTiming[ti.t])return;
      var key=id+'|'+ti.t;
      var excluded=c.suppExclude.indexOf(key)>-1;
      var label=s.name+(ti.d?' ('+ti.d+')':'');
      byTiming[ti.t].push({id:id,timing:ti.t,label:label,excluded:excluded});
    });
  });
  var html='<div class="supp-notes"><div class="supp-notes-hd">Πρωτόκολλο συμπληρωμάτων</div>';
  var any=false;
  SUPP_TIMINGS.forEach(function(t){
    if(!byTiming[t].length)return;
    any=true;
    html+='<div class="supp-note-row"><span class="sntime">'+t+'</span><span class="snitems">';
    byTiming[t].forEach(function(item,i){
      if(item.excluded){
        html+='<span class="supp-excl" onclick="excludeSupp(\''+item.id+'\',\''+item.timing+'\')" title="Επαναφορά">'+item.label+'</span>';
      } else {
        html+='<span class="supp-active">'+item.label+'<button class="supp-rm" onclick="excludeSupp(\''+item.id+'\',\''+item.timing+'\')" title="Αφαίρεση">&times;</button></span>';
      }
      if(i<byTiming[t].length-1)html+=' ';
    });
    html+='</span></div>';
  });
  html+='</div>';
  el.innerHTML=any?html:'';
}

function setupFormEventListeners(){
  // Wire up form inputs to call upd() with cascade recalculation
  var handlers={
    'inp-name':['name',null],
    'inp-weight':['weight','number'],
    'inp-height':['height','number'],
    'inp-bf':['bf','number'],
    'inp-sex':['sex',null],
    'inp-goal':['goal',null],
    'inp-sport':['sport',null],
    'inp-formula':['formula',null],
    'inp-lbm':['lbm','number']
  };

  Object.keys(handlers).forEach(function(elemId){
    var el=document.getElementById(elemId);
    if(!el)return;
    var fieldName=handlers[elemId][0];
    var type=handlers[elemId][1];
    el.onchange=function(){
      var val=type==='number'?parseFloat(this.value)||0:this.value;
      upd(fieldName,val);
      // ✅ Εγκυμοσύνη: το toggle είναι ορατό μόνο για sex==='F' — αυτό ΠΡΕΠΕΙ να ζει εδώ (όχι στο
      // αρχικό wiring πιο πάνω στη renderMain), γιατί αυτή η ανάθεση τρέχει τελευταία και νικάει.
      if(elemId==='inp-sex'){
        var pw=document.getElementById('preg-toggle-wrap');if(pw)pw.style.display=val==='F'?'flex':'none';
        if(val!=='F'){
          var cSex=getC();
          if(cSex && cSex.pregnant){
            upd('pregnant',false);
            var pcb=document.getElementById('inp-pregnant');if(pcb)pcb.checked=false;
            var pf=document.getElementById('preg-fields-wrap');if(pf)pf.style.display='none';
          }
        }
      }
    };
  });
}

// Το "Ραντεβού" tab δεν χωράει στην αρίθμηση 1-4 των per-client tabs (5/6/7 είναι ήδη
// πιασμένα από swTab για global nav) — named constant αντί για γυμνό 100 σε κάθε σημείο
// που το αναφέρεται, ώστε το επόμενο νέο tab να μην χρειαστεί να μαντέψει γιατί υπάρχει (Ε5).
var TAB_APPOINTMENTS=100;

function swTab(n){
  if(n===0){ if(typeof renderHome==='function') renderHome(); return; }
  if(n===5){ if(typeof renderDiets==='function') renderDiets(); return; }
  if(n===6){ if(typeof renderRecipes==='function') renderRecipes(); return; }
  if(n===7){ if(typeof renderClients==='function') renderClients(); return; }
  if(n===8){ if(typeof renderTips==='function') renderTips(); return; }
  // 2026-08-23: renderMessages() μόνη της ζωγραφίζει μόνο ό,τι ήδη υπάρχει στη μνήμη (cache από το
  // login ή το τελευταίο χειροκίνητο "🔄 Ανανέωση") — το άνοιγμα του tab δεν έφερνε ποτέ νέα δεδομένα
  // από μόνο του. Τώρα ζωγραφίζει αμέσως (instant, από cache) και μετά τρέχει msgRefresh στο
  // παρασκήνιο, ώστε ένα μήνυμα που έστειλε ο πελάτης ενώ ο διαιτολόγος είχε ήδη ανοιχτή την
  // εφαρμογή να εμφανιστεί χωρίς να χρειάζεται να το θυμηθεί να πατήσει το κουμπί.
  if(n===9){ if(typeof renderMessages==='function') renderMessages(); if(typeof msgRefresh==='function') msgRefresh(null); return; }
  // ✅ Remembers the last client-detail tab shown, so the delayed fade-in renderMain()
  // wrapper (Dietologist.html) can re-apply it after its own rebuild — see that wrapper
  // for why this is needed (it defaults back to tab 1 otherwise).
  window._lastTabN=n;
  var t1=document.getElementById('t1');if(t1)t1.classList.toggle('active',n===1);
  var t2=document.getElementById('t2');if(t2)t2.classList.toggle('active',n===2);
  var t3=document.getElementById('t3');if(t3)t3.classList.toggle('active',n===3);
  var t3b=document.getElementById('t3b');if(t3b)t3b.classList.toggle('active',n===TAB_APPOINTMENTS);
  var t4=document.getElementById('t4');if(t4)t4.classList.toggle('active',n===4);

  // ✅ HIDE ALL PAGES FIRST
  var s1=document.getElementById('s1');if(s1)s1.style.display='none';
  var s2=document.getElementById('s2');if(s2)s2.style.display='none';
  var s3=document.getElementById('s3');if(s3)s3.style.display='none';
  var s3b=document.getElementById('s3b');if(s3b)s3b.style.display='none';
  var s4=document.getElementById('s4');if(s4)s4.style.display='none';

  // ✅ THEN SHOW ONLY THE SELECTED PAGE
  if(n===1 && s1)s1.style.display='block';
  if(n===2 && s2)s2.style.display='block';
  // ✅ Rebuild s3 fresh every time it's opened — the client-logs cache can finish loading
  // (refreshClientLogsCache) after this div was first built, and swTab() only ever
  // toggled display before, so a stale (pre-fetch) panel could get stuck showing forever.
  if(n===3 && s3){var _c=getC();if(_c)s3.innerHTML=buildTrackerHtml(_c);s3.style.display='block';}
  // TAB_APPOINTMENTS = "📝 Ραντεβού" tab (kept outside the 1-4 numbering since 5/6/7 are already
  // used by swTab for global nav — Διατροφές/Συνταγές/Πελάτες). Rebuilt fresh each open, same reason as s3.
  // 2026-08-23: ίδιος λόγος με το n===9 tab παραπάνω — το άνοιγμα του Ραντεβού tab ζωγράφιζε μόνο
  // ό,τι ήδη υπήρχε στη μνήμη· τώρα τρέχει και refreshClientPortalFeedback στο παρασκήνιο ώστε ένα
  // πρόσφατο μήνυμα/feedback/check-in αυτού του πελάτη να μη μείνει κρυμμένο μέχρι χειροκίνητη ανανέωση.
  if(n===TAB_APPOINTMENTS && s3b){var _c100=getC();if(_c100)s3b.innerHTML=buildAppointmentsHtml(_c100);s3b.style.display='block';if(typeof refreshClientPortalFeedback==='function')refreshClientPortalFeedback(null);}
  if(n===4 && s4)s4.style.display='block';

  // ✅ HIDE FORM SECTIONS EXCEPT IN TAB 1 (Page 1 only - Στοιχεία Πελάτη)
  var sectionIds=['sec-goal','sec-macros','sec-anthropometry','sec-activity','sec-dietary','sec-medical','met-section-wrap','sec-daytgt'];
  sectionIds.forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.style.display=n===1?'block':'none';
  });

  // ✅ HIDE DAY TARGETS TABLE EXCEPT IN TAB 1
  var dayTgtWrap=document.querySelector('.day-tgt-wrap');
  if(dayTgtWrap)dayTgtWrap.style.display=n===1?'block':'none';

  // ✅ HIDE TEMPLATE SELECTOR EXCEPT IN TAB 1
  var tmplSelRow=document.querySelector('.tmpl-sel-row');
  if(tmplSelRow)tmplSelRow.style.display=n===1?'block':'none';

  // ✅ HIDE MODAL BUTTONS GRID EXCEPT IN TAB 1 (Page 1 only)
  // Buttons: Χρόνοι Γευμάτων, Εβδομαδιαίο Πρόγραμμα, MET Activities, Διατροφή, Ιατρικές Συνθήκες, Συμπληρώματα
  var modalButtonsDiv=document.getElementById('modal-btns-grid');
  if(modalButtonsDiv)modalButtonsDiv.style.display=n===1?'flex':'none';

  // ✅ HIDE 2x-TRAINING HINT + "Δημιουργία πλάνου" BUTTON EXCEPT IN TAB 1 (Page 1 only)
  var hint2x=document.getElementById('hint-2x-training');
  if(hint2x)hint2x.style.display=n===1?'':'none';
  var genPlanRow=document.getElementById('genplan-row');
  if(genPlanRow)genPlanRow.style.display=n===1?'':'none';
  // ✅ genplan-row already hosts a "⋯" quick-actions button on tab 1, so hide the floating
  // circular FAB there to avoid two overlapping fixed bottom controls; other tabs still get it.
  var fabBtn=document.getElementById('fab-btn');
  if(fabBtn)fabBtn.style.display=n===1?'none':'';

  if(n===1){setupFormEventListeners();}  // ← SET UP EVENT LISTENERS
  if(n===2){renderFoodLib('');var c=getC();if(c){initializeMealTiming(c);}renderWeekTable();renderSuppNotes();}
  if(n===4){var c=getC();if(c&&c.savedPlans)setTimeout(function(){renderPlanCharts(c);},100);}
}

/* Update the day-target table display when macros change (e.g., carb boost, training days) */
function updateDayTargetTable(c,t){
  var tableEl=document.querySelector('table.day-tgt-table');
  if(!tableEl)return; // Table not on page

  // Get default day targets (respects carb boost, training days, etc.)
  var defs=!c.dayTargets?makeDayTgtDefaults(c,t):getDayTgtEff(c,t);
  if(!defs||defs.length!==7)return;

  // Update each day's displayed values in the table
  // The table has cells with IDs like: dt-k-0, dt-p-0, dt-f-0, dt-c-0, etc.
  var keys=['k','p','f','c'];
  for(var i=0;i<7;i++){
    keys.forEach(function(key){
      var cellEl=document.getElementById('dt-'+key+'-'+i);
      if(cellEl){
        var oldVal=cellEl.value;
        var val=defs[i][key];
        cellEl.value=val;

        // Visual highlight if value changed (flash effect)
        if(oldVal&&oldVal!==String(val)){
          cellEl.style.transition='background-color 0.3s ease';
          cellEl.style.backgroundColor='#fff9c4';  // Light yellow flash
          setTimeout(function(){
            cellEl.style.backgroundColor='';
          }, 500);
        }

        // Also update the display text if there's a separate display element
        var dispEl=document.querySelector('[data-day-'+key+'-'+i+']');
        if(dispEl)dispEl.textContent=val;
      }
    });
  }
}

// ✅ Set the activity multiplier (PAL) — either from one of the 4 preset buttons (presetKey set)
// or from the free numeric field (presetKey null, auto-detects if it happens to match a preset).
function setActivityFactor(val, presetKey) {
  var c = getC();
  if(!c) return;
  val = Math.round(val*1000)/1000;
  c.activityFactor = val;
  if(presetKey){
    c.activity = presetKey;
  } else {
    var PAL_BY_KEY={sed:1.2,light:1.375,mod:1.55,active:1.725};
    var matched = Object.keys(PAL_BY_KEY).filter(function(k){return PAL_BY_KEY[k]===val;})[0];
    c.activity = matched || 'custom';
  }
  saveNow();
  renderMain();
}

// ✅ Set goal calorie adjustment to an absolute value, clamped to -500..+500.
// Shared by the slider (onchange, on release) and the quick-jump buttons.
function setGoalCalories(newGoal) {
  var c = getC();
  if(!c) return;

  newGoal = Math.max(-500, Math.min(500, Math.round(newGoal)));

  // Save the new goal
  c.goal = newGoal.toString();

  // Update the display
  document.getElementById('goal-display').textContent = (newGoal >= 0 ? '+' : '') + newGoal;
  document.getElementById('inp-goal').value = newGoal;
  var slider = document.getElementById('goal-slider');
  if(slider) slider.value = newGoal;

  // Save to localStorage
  saveNow();

  // ✅ Full re-render so daily-targets table + header goal reflect the new adjustment
  renderMain();

  console.log('📊 Goal adjusted to:', newGoal, 'kcal/day');
}

// ✅ GOAL MACROS AUTO-ADJUSTMENT (NEW)
function applyGoalMacros(goalType) {
  var c = getC();
  if(!c) return;

  // Set goal delta based on selection
  var goalDeltas = {
    loss: -500,
    maintain: 0,
    gain: 300
  };

  c.goal = String(goalDeltas[goalType] || 0);
  c.goalMain = goalType;

  // Smart default: pre-fill a sensible macro preset for this goal — but only the first
  // time. Any preset OTHER than 'balanced' (custom/strength/endurance/loss/martial) is
  // unambiguously a deliberate choice already and stays protected as before. 'balanced' is
  // the one ambiguous value — it's BOTH the smart-default for the 'maintain' goal AND a
  // real preset a dietitian can deliberately pick via setMacroPreset(), so a value-only
  // check can't tell those apart; c._macroPresetManual (set only by setMacroPreset()'s real
  // button-click path) disambiguates that one case. Skipped entirely when a sport is
  // selected, since sport-specific ratios already take priority (see recalculateMacros()).
  if(!c.sport && (!c.macroPreset || (c.macroPreset==='balanced' && !c._macroPresetManual))){
    var defPreset=DEFAULT_MACRO_PRESET_BY_GOAL[goalType];
    var defPr=defPreset&&MACRO_PRESETS[defPreset];
    if(defPr){ c.macroPreset=defPreset; c.macroP=defPr.p; c.macroF=defPr.f; c.macroC=defPr.c; }
  }

  // Update display
  var goalDisplay = document.getElementById('goal-display');
  if(goalDisplay) {
    var val = goalDeltas[goalType];
    goalDisplay.textContent = (val >= 0 ? '+' : '') + val;
  }

  // Save changes
  saveNow();

  // ✅ Full re-render so daily-targets table, macros, and header goal all refresh
  // (calcTDEE inside renderMain recomputes everything from c.goal)
  renderMain();

  console.log('✅ Goal macros applied:', goalType, '→', goalDeltas[goalType], 'kcal');
}

// ✅ Calculate age (in years) from a birth-date string (YYYY-MM-DD)
// ✅ Read the single native date input (already ISO "YYYY-MM-DD", same format c.birthDate
// is stored in — no assembly needed), save it, recalc age. Replaces the old 3-dropdown
// (day/month/year) version: same data, one field instead of three.
function commitBirthdate(c){
  var el=document.getElementById('inp-birthdate');
  if(!el)return;
  if(el.value){
    c.birthDate=el.value;
    var a=ageAtDate(c.birthDate);
    updateAgeDisplay();
    if(a!=null){upd('age',a);}else{save();}
  }else{
    c.birthDate='';
    updateAgeDisplay();
    save();
  }
}

// ✅ Update the "(X ετών)" label next to the birth-date field
function updateAgeDisplay(){
  var el=document.getElementById('age-display');if(!el)return;
  var c=getC();if(!c){el.textContent='';return;}
  var a=c.birthDate?ageAtDate(c.birthDate):c.age;
  el.textContent=(a!=null&&!isNaN(a))?'('+a+' ετών)':'';
}

// ✅ Collapsible "Βασικά Στοιχεία" / "Άθλημα" sections — collapsed by default once a
// client already has that data filled in (nothing new to look at every visit), left
// open for a brand-new client so the dietitian sees the empty fields right away.
// State lives per-client for the session; toggling doesn't get reset by re-renders.
window._secState = window._secState || {};
function getSecState(c){
  if(!window._secState[c.id]){
    window._secState[c.id] = {
      // ✅ Only collapse once every field inside is actually filled in — collapsing
      // while something's still missing (e.g. sport set but activity level not) would
      // hide the very field the dietitian needs to fix.
      basic: !!(c.name && c.sex && c.age),
      sport: !!(c.sport && c.activity),
      // ✅ Presets είναι σημείο εκκίνησης μιας φοράς, όχι κάτι που ξαναχρειάζεται συνέχεια —
      // κλειστό by default ώστε στο κινητό να μη σκεπάζει τα στοιχεία πελάτη πριν καν τα δεις.
      quickstart: true,
      macros: (c.macroPreset||'balanced')!=='custom',
      daytgt: true,
      // ✅ Ανθρωπομετρία / Στόχος stay open by default (edited on most visits) —
      // still toggleable like every other section, for when they're not needed.
      anthro: false,
      goal: false
    };
  }
  return window._secState[c.id];
}
function toggleSec(sec){
  var c=getC();if(!c)return;
  var st=getSecState(c);
  st[sec]=!st[sec];
  renderMain();
}

// ✅ Collapsible «Τρόφιμα» panel next to the weekly plan — frees width for the day columns.
// Persisted in localStorage (UI preference, not client data) so it stays collapsed across clients.
function isFoodLibCollapsed(){
  try{ return localStorage.getItem('fyh_foodlib_collapsed')==='1'; }catch(e){ return false; }
}
function toggleFoodLib(){
  var el=document.getElementById('food-lib');
  if(!el)return;
  var collapsed=el.classList.toggle('collapsed');
  try{ localStorage.setItem('fyh_foodlib_collapsed', collapsed?'1':'0'); }catch(e){}
  var btn=el.querySelector('.food-lib-toggle');
  if(btn) btn.textContent = collapsed?'‹':'›';
}
// ✅ Safety net: if plan-generation validation fails on a field that lives inside a
// collapsed accordion (Βασικά Στοιχεία / Άθλημα / Κατανομή Μακρο), force it open so the
// error is actually visible instead of the dietitian hunting for a hidden input.
// ✅ 2026-08-01: added weight/height/bf (→'anthro') and goal_required (→'goal') — these had no
// entry at all, so an error on any of them left "Ανθρωπομετρία"/"Στόχος & Προσαρμογή" collapsed
// (if the dietitian had manually closed it) with nothing forcing it back open.
var SEC_FOR_ERROR={
  name_required:'basic', name_short:'basic', name_long:'basic',
  age_required:'basic', age_invalid:'basic', sex_required:'basic',
  activity_required:'sport',
  weight_required:'anthro', weight_invalid:'anthro',
  height_required:'anthro', height_invalid:'anthro',
  bf_invalid:'anthro',
  goal_required:'goal',
  macros_invalid:'macros'
};
// ✅ 2026-08-01: the error toast told the dietitian WHAT was wrong but never WHERE — on a long
// client form (7+ accordion sections) that meant scrolling around hunting for the actual input.
// Maps each validation error to the input it belongs to, so showValidationErrors() can scroll to
// and briefly highlight it.
var FIELD_ID_FOR_ERROR={
  name_required:'inp-name', name_short:'inp-name', name_long:'inp-name',
  age_required:'inp-birthdate', age_invalid:'inp-birthdate',
  sex_required:'inp-sex',
  weight_required:'inp-weight', weight_invalid:'inp-weight',
  height_required:'inp-height', height_invalid:'inp-height',
  bf_invalid:'inp-bf',
  activity_required:'inp-activity-factor'
};
function scrollToAndHighlightField(errors){
  var fieldId=null;
  for(var i=0;i<(errors||[]).length&&!fieldId;i++){ fieldId=FIELD_ID_FOR_ERROR[errors[i]]; }
  if(!fieldId)return;
  var el=document.getElementById(fieldId);
  if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  el.focus();
  var prevBg=el.style.background, prevBorder=el.style.borderColor, prevShadow=el.style.boxShadow;
  el.style.background='#ffebee';
  el.style.borderColor='#e53935';
  el.style.boxShadow='0 0 0 3px rgba(229,57,53,0.25)';
  setTimeout(function(){
    el.style.background=prevBg;
    el.style.borderColor=prevBorder;
    el.style.boxShadow=prevShadow;
  },1800);
}
function revealSectionsForErrors(errors){
  var c=getC();if(!c)return;
  var st=getSecState(c);
  var changed=false;
  (errors||[]).forEach(function(err){
    var sec=SEC_FOR_ERROR[err];
    if(sec && st[sec]){ st[sec]=false; changed=true; }
  });
  if(changed) renderMain();
}

function upd(k,v){
  var c=getC();if(!c)return;
  var oldValue = c[k];

  // ✅ PHASE 1: VALIDATE INPUT BEFORE SAVING
  var tempClient = deepClone(c);
  tempClient[k] = v;
  var validationErrors = validateClientData(tempClient);

  // If validation fails for critical fields, show error and reject change
  var criticalFields = ['name', 'age', 'weight', 'height', 'bf'];
  if(criticalFields.includes(k)) {
    var fieldErrors = validationErrors.filter(function(err) {
      return err.startsWith(k + '_');
    });
    if(fieldErrors.length > 0) {
      showErrorToast(VALIDATION_MESSAGES_GR[fieldErrors[0]] || 'Δεδομένα μη έγκυρα');
      return; // Don't save invalid data
    }
  }

  // ✅ PHASE 4: UPDATE CLIENT WITH UNDO/REDO
  // All fields whose input fires oninput (every keystroke) are excluded like name —
  // UpdateClientCommand.execute() calls renderMain(), which rebuilds #main's innerHTML
  // and drops focus/cursor on every keystroke while typing. Fields wired to onblur/onchange
  // instead (weight, height, bf, leanmass, formula, goal, activity, age) only fire once
  // per edit, so a full renderMain() there is harmless and stays on the undo/redo path.
  var LIVE_TYPING_FIELDS = {phone:1,email:1,rmr:1,lbm:1,gestationalWeek:1,prePregnancyWeight:1,allergies:1,preferences:1};
  if(window.undoRedoManager && typeof UpdateClientCommand !== 'undefined' && k !== 'name' && !LIVE_TYPING_FIELDS[k] && oldValue !== v){
    var cmd = new UpdateClientCommand(c, k, oldValue, v);
    window.undoRedoManager.execute(cmd);
  } else {
    c[k]=v;save();
  }
  // ✅ Name change: update sidebar + header text IN PLACE (no full re-render — keeps input focus while typing)
  if(k==='name'){
    renderSB();
    var headerName=document.getElementById('client-header-name');
    if(headerName)headerName.textContent='👤 '+(v||'Νέος πελάτης');
    return;
  }
  // ✅ Phone/Email/Allergies/Preferences change: nothing else on screen depends on these — no re-render needed while typing
  if(k==='phone'||k==='email'||k==='allergies'||k==='preferences'){
    return;
  }
  // formula change needs full re-render to update formula tag + LBM field visibility
  // (lbm itself is excluded above — it affects BMR under Cunningham, so it falls through
  // to the in-place BMR/TDEE/macro recompute below instead, same as rmr)
  if(k==='formula'){renderMain();return;}
  // ✅ Goal/Activity change: needs full re-render to update TDEE, macros, and daily targets
  if(k==='goal'||k==='activity'){renderMain();return;}
  var t=calcTDEE(c);
  // Age change: full re-render (formula label + minor banner may change)
  if(k==='age'){renderMain();return;}
  // ✅ Weight/Height change: refresh BMI displays in place (badge was going stale)
  if(k==='weight'||k==='height'){
    if(c.weight&&c.height){
      var bmiVal=Math.round(c.weight/((c.height/100)*(c.height/100))*10)/10;
      var bmiCat=bmiVal<18.5?'Χαμηλό':bmiVal<25?'Φυσιολογικό':bmiVal<30?'Υπέρβαρο':'Παχυσαρκία';
      var badge=document.getElementById('bmi-badge');
      if(badge)badge.innerHTML='📊 BMI: '+bmiVal+' <span style="font-size:10px;color:#666;font-weight:normal;">('+bmiCat+')</span>';
      var hm=document.getElementById('header-measures');
      if(hm)hm.textContent=c.weight+'kg / '+c.height+'cm (BMI: '+bmiVal+')';
    }
  }
  var b=document.getElementById('v-bmr');if(b)b.textContent=t.bmr+' kcal';
  // TDEE — show exercise chip in MET mode
  var tdEl=document.getElementById('v-tdee');
  if(tdEl){
    if(t.usedMET){
      tdEl.innerHTML=t.tdee+' kcal<span class="v-ex-chip" id="v-exday">+'+t.exerciseDaily+'</span>';
    } else {
      tdEl.textContent=t.tdee+' kcal';
    }
  }
  // Calculate weekly average target from daily targets (for MET-based accuracy)
  var avgTarget=t.target;
  if(c.dayTargets&&c.dayTargets.length===7){
    var totalKcal=0;
    for(var di=0;di<7;di++){
      totalKcal+=(c.dayTargets[di].k||0);
    }
    avgTarget=Math.round(totalKcal/7);
  }
  var tg=document.getElementById('v-target');if(tg)tg.textContent=avgTarget+' kcal';
  var m=document.getElementById('v-macros');if(m)m.innerHTML=t.p+'g <span style="font-size:10px;color:#555;font-weight:400">('+t.protGperKg+' g/kg)</span>';
  // Display validation warnings
  var wc=document.getElementById('warnings-container');
  if(wc){
    if(t.warnings&&t.warnings.length>0){
      var whtml='';
      t.warnings.forEach(function(w){
        var bgColor=w.type==='alert'?'#ffebee':'#fff3e0';
        var borderColor=w.type==='alert'?'#f44336':'#ff9800';
        var textColor=w.type==='alert'?'#c62828':'#e65100';
        whtml+='<div style="background:'+bgColor+';border:1px solid '+borderColor+';border-radius:6px;padding:8px 12px;margin:6px 0;font-size:13px;color:'+textColor+'">'+w.msg+'</div>';
      });
      wc.innerHTML=whtml;
    } else {
      wc.innerHTML='';
    }
  }
  // Refresh EA row if present
  var eaEl=document.getElementById('ea-row');
  if(t.ea!==null){
    var eaCls='ea-row '+(t.ea<30?'ea-danger':t.ea<45?'ea-warn':'ea-ok');
    var eaTxt='⚡ Energy Availability: <b>'+t.ea+' kcal/kgLBM</b> &nbsp;'+(t.ea<30?(c.sport?'🔴 Κίνδυνος RED-S — ανεπαρκής ενεργειακή διαθεσιμότητα':'🔴 Χαμηλή ενεργειακή διαθεσιμότητα'):t.ea<45?'🟡 Οριακή EA — παρακολούθηση απαραίτητη':'🟢 Φυσιολογική EA');
    if(eaEl){eaEl.className=eaCls;eaEl.innerHTML=eaTxt;}
  } else if(eaEl){eaEl.style.display='none';}
  // Refresh MET totals if weight changed (kcal depends on weight)
  if(k==='weight'){var mw=document.querySelector('.met-wrap');if(mw&&(c.metActivities||[]).length>0){var mt=buildMetHtml(c,t);var tmp=document.createElement('div');tmp.innerHTML=mt;var newMet=tmp.firstChild;if(newMet)mw.parentNode.replaceChild(newMet,mw);}}
  // Update hydration chips
  var numT=(c.trainDays||[]).filter(function(x){return x;}).length;
  var hc=document.querySelector('.hydration-row');
  if(hc){
    hc.innerHTML='<div class="hydration-chip">&#128167; Ανάπαυση: '+t.hydBase+' ml<span>('+Math.round(t.hydBase/1000*10)/10+'L)</span></div>'
      +(numT>0?'<div class="hydration-chip" style="background:#e8f5e9;color:#2e7d32">&#127947; Προπόνηση: '+t.hydTrain+' ml<span>('+Math.round(t.hydTrain/1000*10)/10+'L)</span></div>':'')
      +'<div class="hydration-chip" style="background:#fff3e0;color:#e65100">&#128197; '+numT+'/7 ημέρες προπόνησης</div>';
  }
  // Keep day-target inputs in sync when no custom targets set
  if(!c.dayTargets){
    var defs=makeDayTgtDefaults(c,t);
    for(var i=0;i<7;i++){['k','p','f','c'].forEach(function(mk){var inp2=document.getElementById('dt-'+mk+'-'+i);if(inp2)inp2.value=defs[i][mk];});}
  }
  // CRITICAL FIX: Rebuild the day-target table display when settings change
  // This ensures the visible macro values update when ANY calculation parameter changes
  // Parameters that affect TDEE (and thus daily targets):
  //   - age, weight, height, sex: affect BMR calculation
  //   - activity: affects TDEE multiplier
  //   - formula: affects BMR method (Mifflin vs Cunningham)
  //   - lbm: used in Cunningham formula
  //   - bf: used for LBM estimation
  //   - goal, customGoalDelta: directly affect target calculation
  //   - macroP, macroF, macroC: change macro distribution
  //   - metActivities: affects exercise energy calculation
  // Parameters that directly affect daily targets:
  //   - carbBoost: redistributes carbs/fats across training days
  //   - trainDays: determines which days are training vs rest
  //   - trainHoursByDay, trainHoursPerDay: affects training day calorie scaling
  // Only skip 'name' and 'formula' (formula requires recalc that happens in renderMain)
  if(k!=='name'){
    updateDayTargetTable(c,t);
  }

  // ← TRIGGER CASCADE RECALCULATION for fields that affect TDEE/macros
  var recalcFields=['weight','age','height','sex','activity','goal','bf','sport','lbm'];
  if(recalcFields.indexOf(k)!==-1){
    onClientChange();
  }
}


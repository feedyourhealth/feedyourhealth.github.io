
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
function showConfirmDialog(message, onConfirm, opts){
  opts = opts || {};
  var dlg = document.getElementById('confirmDialog');
  if(!dlg){ if(window.confirm(message)) onConfirm(); return; }
  document.getElementById('confirmTitle').textContent = opts.title || 'Επιβεβαίωση';
  document.getElementById('confirmMessage').textContent = message;
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

// NAVIGATION: Back to Clients List (Logout)
// ═══════════════════════════════════════════════════════════════
function backToClientsList(){
  if(typeof renderHome==='function') renderHome();
  save();  // Save state to localStorage
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
  if(!c.progressLog) c.progressLog = [];
  if(!c.mealFeedback) c.mealFeedback = {};
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
  var ageForPreview=c.birthDate?calcAgeFromBirthdate(c.birthDate):c.age;
  var basicPreview=[c.name||'—', c.sex==='M'?'Άνδρας':(c.sex==='F'?'Γυναίκα':''), (ageForPreview!=null&&!isNaN(ageForPreview))?(ageForPreview+' ετών'):''].filter(function(x){return x;}).join(' · ');
  var sportPreview=[c.sport&&SPORT_PROFILES[c.sport]?SPORT_PROFILES[c.sport].name:'',{sed:'Καθιστικός',light:'Ελαφρά ενεργός',mod:'Μέτρια ενεργός',active:'Έντονα ενεργός'}[c.activity]||''].filter(function(x){return x;}).join(' · ')||'Χωρίς στοιχεία';
  var anthroPreview=[c.weight?c.weight+'kg':'', c.height?c.height+'cm':'', (c.weight&&c.height)?('BMI '+(Math.round(c.weight/((c.height/100)*(c.height/100))*10)/10)):''].filter(function(x){return x;}).join(' · ')||'Χωρίς στοιχεία';
  var goalPreview=(c.goalMain?({loss:'Απώλεια βάρους',maintain:'Διατήρηση',gain:'Αύξηση μάζας'}[c.goalMain]||c.goalMain):'Χωρίς στόχο')+' · '+(goalCalAdj>=0?'+':'')+goalCalAdj+' kcal';
  var html='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #e0e0e0;"><div style="flex:1"><h2 id="client-header-name" style="margin:0;color:#025857;font-size:18px;">👤 '+esc(c.name)+'</h2></div><div style="display:flex;gap:8px;align-items:center;"><button class="btn" id="undoBtn" style="background:#7cb342;color:white;border:none;cursor:pointer;padding:8px 12px;border-radius:4px;font-weight:bold;" onclick="undo()" title="Αναίρεση (Ctrl+Z)">↶ Αναίρεση</button><button class="btn" id="redoBtn" style="background:#7cb342;color:white;border:none;cursor:pointer;padding:8px 12px;border-radius:4px;font-weight:bold;" onclick="redo()" title="Επανάληψη (Ctrl+Y)">↷ Επανάληψη</button><button class="btn" style="background:#ff6b35;color:white;border:none;cursor:pointer;padding:8px 12px;border-radius:4px;" onclick="logout()">← Έξοδος</button></div></div>'
    +'<div class="stabs"><button class="stab active" id="t1" onclick="swTab(1)">Στοιχεία πελάτη</button><button class="stab" id="t2" onclick="swTab(2)">Εβδομαδιαίο πλάνο</button><button class="stab" id="t3" onclick="swTab(3)">📐 Ανθρωπομετρία</button><button class="stab" id="t4" onclick="swTab(4)">📊 Ιστορικό πλάνων</button></div>'
    +'<div id="s1">'

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
      +'<span id="header-diet" style="font-size:13px;font-weight:600;color:#025857">' + esc(({normal:'Κανονική',vegetarian:'Χορτοφαγική',vegan:'Vegan',keto:'Κετογονική',orthodox_fasting:'Ορθόδοξη Νηστεία',intermittent_fasting:'Διαλείπουσα Νηστεία',bodybuilding_clean:'Bodybuilding Clean',kids_10_14:'Παιδιά 10-14'}[c.dietType]||'Κανονική')) + '</span>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:2px;padding:8px;background:rgba(255,255,255,0.6);border-radius:8px">'
      +'<span style="font-size:11px;color:#666;font-weight:600">🚫 Αποφυγές</span>'
      +'<span id="header-exclude" style="font-size:13px;font-weight:600;color:#025857">' + esc((c.foodExclude&&c.foodExclude.length)?c.foodExclude.join(', '):'—') + '</span>'
    +'</div>'
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
    +'<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><input type="number" id="inp-activity-factor" min="1.0" max="3.0" step="0.01" value="'+effAF+'" placeholder="π.χ. 1.45" style="width:90px;padding:6px;border:1px solid #ddd;border-radius:4px"><span style="font-size:11px;color:#666">× BMR — πληκτρολόγησε ακριβή τιμή αν οι παραπάνω κατηγορίες δεν ταιριάζουν</span></div>'
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
        return'<label style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:white;border:1px solid #ddd;border-radius:4px;cursor:pointer;"><input type="checkbox" value="'+supp.id+'" '+(isSelected?'checked':'')
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
    +'<div><div style="font-weight:600;color:#333;font-size:11px;">📉 Απώλεια</div><div style="font-size:9px;color:#999;">-500 kcal</div></div>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:5px;padding:5px 8px;background:'+(c.goalMain==='maintain'?'#E2EEE5':'#fff')+';border:1px solid '+(c.goalMain==='maintain'?'#025857':'#ddd')+';border-radius:4px;cursor:pointer;font-size:11px;">'
    +'<input type="radio" name="goal-main" value="maintain" '+(c.goalMain==='maintain'?'checked':'')+' onchange="upd(\'goalMain\', this.value); applyGoalMacros(this.value);" style="cursor:pointer;width:14px;height:14px;">'
    +'<div><div style="font-weight:600;color:#333;font-size:11px;">➡️ Διατήρηση</div><div style="font-size:9px;color:#999;">0 kcal</div></div>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:5px;padding:5px 8px;background:'+(c.goalMain==='gain'?'#E2EEE5':'#fff')+';border:1px solid '+(c.goalMain==='gain'?'#025857':'#ddd')+';border-radius:4px;cursor:pointer;font-size:11px;">'
    +'<input type="radio" name="goal-main" value="gain" '+(c.goalMain==='gain'?'checked':'')+' onchange="upd(\'goalMain\', this.value); applyGoalMacros(this.value);" style="cursor:pointer;width:14px;height:14px;">'
    +'<div><div style="font-weight:600;color:#333;font-size:11px;">📈 Αύξηση</div><div style="font-size:9px;color:#999;">+300 kcal</div></div>'
    +'</label>'
    +'</div></div></div>'
    +'<div class="fg"><div class="fgrp"><label style="font-weight:700;color:#025857;font-size:13px;">🎯 ΠΡΟΣΑΡΜΟΓΗ ΘΕΡΜΙΔΩΝ (-500 έως +500)</label>'
    +'<div style="text-align:center;background:#E2EEE5;border:2px solid #025857;padding:6px 8px;border-radius:6px;margin:8px 0 6px;">'
    +'<div style="font-size:9px;color:#666;">Προσαρμογή Θερμίδων</div>'
    +'<div style="font-size:18px;font-weight:bold;color:#025857;margin:2px 0;line-height:1.2;" id="goal-display">'+(goalCalAdj>=0?'+':'')+(goalCalAdj)+'</div>'
    +'<div style="font-size:8px;color:#999;">kcal/ημέρα</div>'
    +'</div>'
    +'<input type="range" id="goal-slider" min="-500" max="500" step="10" value="'+goalCalAdj+'" style="width:100%;accent-color:#025857;cursor:pointer;display:block;" oninput="document.getElementById(\'goal-display\').textContent=(this.value>=0?\'+\':\'\')+this.value" onchange="setGoalCalories(this.value)">'
    +'<div style="display:flex;justify-content:space-between;font-size:9px;color:#999;padding:2px 2px 8px;"><span>-500</span><span>0</span><span>+500</span></div>'
    +'<div style="display:flex;gap:6px;">'
    +'<button type="button" onclick="setGoalCalories(-500)" style="flex:1;background:#fff;color:#025857;border:1px solid #cfe0dc;padding:7px 4px;border-radius:5px;cursor:pointer;font-weight:600;font-size:11px;">📉 Απώλεια −500</button>'
    +'<button type="button" onclick="setGoalCalories(0)" style="flex:1;background:#fff;color:#025857;border:1px solid #cfe0dc;padding:7px 4px;border-radius:5px;cursor:pointer;font-weight:600;font-size:11px;">➡️ Διατήρηση 0</button>'
    +'<button type="button" onclick="setGoalCalories(300)" style="flex:1;background:#fff;color:#025857;border:1px solid #cfe0dc;padding:7px 4px;border-radius:5px;cursor:pointer;font-weight:600;font-size:11px;">📈 Αύξηση +300</button>'
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
    +'<button class="btn" onclick="openMealTimesModal()" style="background:#fff;color:#1a1a1a;padding:12px 14px;border-radius:6px;font-weight:600;text-align:left;border:1px solid #e0e0e0;border-left:3px solid #025857;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#f0f7f7\';this.style.borderColor=\'#c5ddd8\'" onmouseout="this.style.background=\'#fff\';this.style.borderColor=\'#e0e0e0\'">⏱️ Χρόνοι Γευμάτων</button>'
    +'<button class="btn" onclick="openMetActivitiesModal()" style="background:#fff;color:#1a1a1a;padding:12px 14px;border-radius:6px;font-weight:600;text-align:left;border:1px solid #e0e0e0;border-left:3px solid #025857;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#f0f7f7\';this.style.borderColor=\'#c5ddd8\'" onmouseout="this.style.background=\'#fff\';this.style.borderColor=\'#e0e0e0\'">🏃 Προπονήσεις (MET)</button>'
    +'<button class="btn" onclick="openDietModal()" style="background:#fff;color:#1a1a1a;padding:12px 14px;border-radius:6px;font-weight:600;text-align:left;border:1px solid #e0e0e0;border-left:3px solid #025857;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#f0f7f7\';this.style.borderColor=\'#c5ddd8\'" onmouseout="this.style.background=\'#fff\';this.style.borderColor=\'#e0e0e0\'">🥗 Διατροφή</button>'
    +'<button class="btn" onclick="openMedicalConditionsModal()" style="background:#fff;color:#1a1a1a;padding:12px 14px;border-radius:6px;font-weight:600;text-align:left;border:1px solid #e0e0e0;border-left:3px solid #025857;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#f0f7f7\';this.style.borderColor=\'#c5ddd8\'" onmouseout="this.style.background=\'#fff\';this.style.borderColor=\'#e0e0e0\'">🩺 Ιατρικές Συνθήκες</button>'
    +'<button class="btn" onclick="openCombinedSupplementsModal()" style="background:#fff;color:#1a1a1a;padding:12px 14px;border-radius:6px;font-weight:600;text-align:left;border:1px solid #e0e0e0;border-left:3px solid #025857;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background=\'#f0f7f7\';this.style.borderColor=\'#c5ddd8\'" onmouseout="this.style.background=\'#fff\';this.style.borderColor=\'#e0e0e0\'">💊 Συμπληρώματα</button>'
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
    +'<div id="genplan-row" class="brow"><button class="btn primary" style="flex:1" onclick="genPlanWithUndo()">Δημιουργία πλάνου →</button><button class="btn secondary" style="flex:none;padding:10px 14px" onclick="fabMenu()" title="Γρήγορες ενέργειες" aria-label="Γρήγορες ενέργειες">⋯</button></div>'
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
      +'<button class="btn tertiary" onclick="regeneratePlan()">&#8635; Αναδημιουργία</button>'
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
    +'<option value="loss"'+(c.goal==='loss'?' selected':'')+'>Απώλεια βάρους</option>'
    +'<option value="mild"'+(c.goal==='mild'?' selected':'')+'>Ήπια απώλεια</option>'
    +'<option value="maintain"'+(c.goal==='maintain'?' selected':'')+'>Διατήρηση</option>'
    +'<option value="gain"'+(c.goal==='gain'?' selected':'')+'>Αύξηση μάζας</option>'
    +'</select>'
    +'<button class="btn" style="padding:5px 12px;font-size:11px;background:#025857;color:#fff;border:none" onclick="doSaveAsTmpl()">&#10003; Αποθήκευση</button>'
    +'<button class="btn" style="padding:5px 10px;font-size:11px;background:#eee;color:#555;border:none" onclick="closeSaveTmplPanel()">&#10005;</button>'
    +'</div>'
    +'<div class="plan-wrap"><div class="week-main"><div id="week-con"></div></div>'
    +'<div class="food-lib'+(isFoodLibCollapsed()?' collapsed':'')+'" id="food-lib">'
    +'<button class="food-lib-toggle" onclick="toggleFoodLib()" title="Απόκρυψη/εμφάνιση τροφίμων" aria-label="Απόκρυψη/εμφάνιση τροφίμων">'+(isFoodLibCollapsed()?'‹':'›')+'</button>'
    +'<div class="food-lib-body"><div class="food-lib-title">Τρόφιμα</div>'
    +'<input class="food-lib-search" type="text" placeholder="Αναζήτηση..." oninput="filterLib(this)">'
    +'<div id="lib-list"></div></div></div></div>'
    +'<div id="supp-notes"></div></div>'
    +'<div id="s3" style="display:none">'+buildTrackerHtml(c)+'</div>'
    +'<div id="s4" style="display:none">'+buildPlanHistoryHtml(c)+'</div>';
  document.getElementById('main').innerHTML=html;

  // ✅ UPDATE ALL INPUT FIELDS WITH CURRENT CLIENT DATA
  document.getElementById('inp-name').value=c.name||'';
  var _inpEmail=document.getElementById('inp-email');if(_inpEmail)_inpEmail.value=c.email||'';
  var _inpPhone=document.getElementById('inp-phone');if(_inpPhone)_inpPhone.value=c.phone||'';
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
  // ✅ FIX: Don't render week table in s1, only render when swTab(2) is called
  // renderFoodLib('');
  // if(Object.keys(c.weekPlan).length){initializeMealTiming(c);renderWeekTable();}
  // renderSuppNotes();

  // ← Setup event listeners for all form inputs (CRITICAL for auto-recalculation)
  setupFormEventListeners();
}

// Whole days between today and a client's event date (c.eventDate, 'YYYY-MM-DD'). null if unset/invalid.
function daysUntilEvent(dateStr){
  if(!dateStr) return null;
  var target=new Date(dateStr+'T00:00:00');
  if(isNaN(target.getTime())) return null;
  var today=new Date(); today.setHours(0,0,0,0);
  return Math.round((target-today)/86400000);
}

// Carbohydrate loading (ISSN Position Stand: Nutrient Timing — ~8-12g carbs/kg/day, 1-3 days pre-event).
// Only returns day-of-week indexes (0=Mon..6=Sun, matching trainDays/weekPlan) when c.eventDate is set
// AND the event is actually imminent (0-10 days out) for THIS plan generation — inert otherwise, so a
// client with no event date, or one far from any event, behaves exactly as before.
function getCarbLoadDayIndexes(c){
  var daysLeft=daysUntilEvent(c.eventDate);
  if(daysLeft==null||daysLeft<0||daysLeft>10) return [];
  var loadDays=c.carbLoadDays!=null?c.carbLoadDays:3;
  var eventDow=new Date(c.eventDate+'T00:00:00').getDay(); // 0=Sun..6=Sat
  var eventIdx=(eventDow+6)%7; // convert to 0=Mon..6=Sun
  var idxs=[];
  for(var k=0;k<loadDays;k++) idxs.push(((eventIdx-k)%7+7)%7);
  return idxs;
}

function makeDayTgtDefaults(c,t){
  var boost=(c.carbBoost!=null?c.carbBoost:20)/100;
  var baseHrs=c.trainHoursPerDay||1;
  var carbLoadIdxs=(typeof getCarbLoadDayIndexes==='function')?getCarbLoadDayIndexes(c):[];
  var r=[];
  for(var i=0;i<7;i++){
    var isT=c.trainDays&&c.trainDays[i];
    // Per-day hours: use trainHoursByDay if set, otherwise fallback to global trainHoursPerDay
    var dayHrs=(c.trainHoursByDay&&c.trainHoursByDay[i]!=null)?c.trainHoursByDay[i]:(isT?baseHrs:0);
    var hScale=(isT&&baseHrs>0)?(dayHrs/baseHrs):0;
    // Carb boost: REDISTRIBUTE (don't add calories)
    // On training days: add extra carbs, subtract from fat to keep total kcal same
    var extraC=isT?Math.round(t.carb*boost*(t.usedMET?1:hScale)):0;
    var dayP=t.p;
    var dayF=t.f;
    var dayC=t.carb+extraC;
    if(extraC>0){
      // Reduce fat by the carb increase amount (carbs are 4kcal/g, fat is 9kcal/g)
      var kcalFromExtraC=extraC*4;
      dayF=Math.max(0,Math.round(dayF-(kcalFromExtraC/9)));
    }
    // MET active: use precise per-day kcal from assigned activities
    // With carb boost=0%, all days should have same kcal (no redistribution across days)
    var dayKcal;
    if(t.usedMET){
      dayKcal=t.trainTargetByDay?t.trainTargetByDay[i]:t.restTarget;
    } else if(boost===0){
      // Zero carb boost: all days identical target
      dayKcal=t.target;
    } else {
      // Carb boost > 0: adjust daily targets based on training days
      dayKcal=isT?Math.round(t.target+(t.trainTarget-t.restTarget)):t.target;
    }

    // 🛡️ SAFETY FLOOR: a daily target must never fall below BMR/RMR.
    // Aggressive deficits on low-RMR clients (esp. on rest days with no exercise)
    // can push the day's target below basal metabolism — clinically unsafe and it
    // also makes an otherwise-balanced plan read as 150-170% on those days.
    // t.bmr = measured RMR when available, otherwise the formula BMR.
    if(t.bmr && dayKcal < t.bmr) dayKcal = t.bmr;

    // CRITICAL FIX v2: Recalculate macros based on ACTUAL daily kcal, not average
    // When using MET activities, each day has different kcal so macros must be recalculated
    var pPct=t.pPct/100;
    var fPct=t.fPct/100;
    var cPct=t.cPct/100;

    var dayP=Math.round(dayKcal*pPct/4);
    var dayF=Math.round(dayKcal*fPct/9);
    var dayC=Math.round((dayKcal-dayP*4-dayF*9)/4);

    // Apply carb boost redistribution on top of daily macro targets
    if(extraC>0){
      // Reduce fat by the carb increase amount (carbs are 4kcal/g, fat is 9kcal/g)
      var kcalFromExtraC=extraC*4;
      dayF=Math.max(0,Math.round(dayF-(kcalFromExtraC/9)));
      dayC=dayC+extraC;
    }

    // 🏁 Carb-loading override (only on the specific pre-event days computed above; no-op for everyone else).
    // Reduces fat kcal-for-kcal to make room, same pattern as the training-day carb boost above.
    if(carbLoadIdxs.indexOf(i)!==-1){
      var loadCarbG=Math.round((c.weight||70)*10); // ISSN: ~10g/kg/day carb-loading target
      // ⚕️ Cap at any active protocol's carb% ceiling (e.g. Διαβήτης) — the protocol always wins over
      // the event-prep target, so carb-loading never silently exceeds a clinical limit on those days.
      var protocolCarbCapPct=(typeof getProtocolCarbCapPct==='function')?getProtocolCarbCapPct(c):null;
      if(protocolCarbCapPct!=null){
        var capGrams=Math.round(dayKcal*protocolCarbCapPct/100/4);
        if(capGrams<loadCarbG) loadCarbG=capGrams;
      }
      if(loadCarbG>dayC){
        var extraLoadC=loadCarbG-dayC;
        var kcalFromExtraLoadC=extraLoadC*4;
        dayF=Math.max(0,Math.round(dayF-(kcalFromExtraLoadC/9)));
        dayC=loadCarbG;
      }
    }

    r.push({k:dayKcal,p:dayP,f:dayF,c:dayC});
  }
  return r;
}
function getDayTgtEff(c,t){
  // DEFENSIVE: Check for null client object
  if(!c){
    console.warn('⚠️ getDayTgtEff called with null client');
    return {};
  }
  // CRITICAL FIX: Always recalculate daily targets to ensure growthAdd is included
  // Don't rely on cached c.dayTargets as it may be stale
  var eff=makeDayTgtDefaults(c,t);
  // Store freshly calculated values for persistence
  if(c) c.dayTargets=eff;
  return eff;

}

// ✅ PHASE 3: ALLOCATE PER-MEAL CALORIE TARGETS
// Splits daily targets across 5 meals with intelligent distribution
function allocateMealTargets(dailyTarget, numMeals, mealTiming) {
  // Default distribution: breakfast 22%, lunch 28%, dinner 25%, snacks 12-13%
  // This ensures larger meals when appetite is higher (lunch/dinner)
  // and smaller snacks between meals
  var mealAlloc = [0.22, 0.28, 0.25, 0.12, 0.13];

  if(!dailyTarget || !dailyTarget.k) {
    console.warn('⚠️ allocateMealTargets: Invalid daily target');
    return [];
  }

  var targets = [];
  for (var i = 0; i < Math.min(numMeals, mealAlloc.length); i++) {
    targets.push({
      k: Math.round(dailyTarget.k * mealAlloc[i]),
      p: Math.round(dailyTarget.p * mealAlloc[i]),
      f: Math.round(dailyTarget.f * mealAlloc[i]),
      c: Math.round(dailyTarget.c * mealAlloc[i])
    });
  }

  // Handle excess meals (if > 5) by distributing evenly
  if(numMeals > mealAlloc.length) {
    var remainingKcal = dailyTarget.k;
    for(var i = 0; i < mealAlloc.length; i++) {
      remainingKcal -= targets[i].k;
    }
    var perExtraMeal = Math.round(remainingKcal / (numMeals - mealAlloc.length));
    for(var i = mealAlloc.length; i < numMeals; i++) {
      targets.push({
        k: perExtraMeal,
        p: Math.round(dailyTarget.p * (perExtraMeal / dailyTarget.k)),
        f: Math.round(dailyTarget.f * (perExtraMeal / dailyTarget.k)),
        c: Math.round(dailyTarget.c * (perExtraMeal / dailyTarget.k))
      });
    }
  }

  return targets;
}

function getMealTimingGuide(c){
  var abbr=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var td=c.trainDays||[false,false,false,false,false,false,false];
  var times=c.trainTimesByDay||['','','','','','',''];
  var hasAnyTime=times.some(function(t,i){return t&&td[i];});
  if(!hasAnyTime)return'';

  function timingFor(trainTime){
    var parts=trainTime.split(':');
    var h=parseInt(parts[0],10);
    var m=parseInt(parts[1],10)||0;
    if(isNaN(h)||h<0||h>23)return null;

    // Pre-workout: 2 hours before
    var preH=(h-2)<0?(h-2+24):(h-2);
    var preTime=String(preH).padStart(2,'0')+':'+'00';

    // Post-workout: 30 min after
    var postMin=m+30;
    var postH=h;
    if(postMin>=60){postH=(h+1)%24;postMin=postMin-60;}
    var postTime=String(postH).padStart(2,'0')+':'+String(postMin).padStart(2,'0');

    return {trainTime:trainTime,preTime:preTime,postTime:postTime};
  }

  var rows=[];
  for(var i=0;i<7;i++){
    if(!td[i]||!times[i])continue;
    var tm=timingFor(times[i]);
    if(!tm)continue;
    rows.push({day:abbr[i],trainTime:tm.trainTime,preTime:tm.preTime,postTime:tm.postTime});
  }
  if(!rows.length)return'';

  var guide='<div style="background:#e8f5e9;border:1px solid #c8e6c9;border-radius:8px;padding:10px 12px;margin-bottom:10px">'
    +'<div style="font-size:11px;font-weight:700;color:#2e7d32;margin-bottom:6px">⏰ Προτεινόμενα γεύματα ανά ημέρα</div>';

  // ✅ When every training day shares the exact same schedule, show one summary
  // row instead of repeating identical text once per day.
  var allSame=rows.every(function(r){return r.trainTime===rows[0].trainTime&&r.preTime===rows[0].preTime&&r.postTime===rows[0].postTime;});

  if(allSame){
    var dayList=rows.map(function(r){return r.day;}).join(', ');
    guide+='<div style="font-size:10px;color:#333;padding:4px 6px;background:#f1f8f6;border-radius:4px">'
      +'<b>'+dayList+'</b> <span style="color:#2e7d32;font-weight:600">(ίδιο κάθε μέρα)</span> — προπόνηση στις '+rows[0].trainTime
      +' | <span style="color:#1565C0">⚡Pre (2h πριν): '+rows[0].preTime+'</span>'
      +' | <span style="color:#e65100">💪Post (30min μετά): '+rows[0].postTime+'</span>'
      +'</div>';
  } else {
    rows.forEach(function(r){
      guide+='<div style="font-size:10px;color:#333;margin-bottom:5px;padding:4px 6px;background:#f1f8f6;border-radius:4px">'
        +'<b>'+r.day+'</b> — προπόνηση στις '+r.trainTime
        +' | <span style="color:#1565C0">⚡Pre (2h πριν): '+r.preTime+'</span>'
        +' | <span style="color:#e65100">💪Post (30min μετά): '+r.postTime+'</span>'
        +'</div>';
    });
  }

  guide+='</div>';
  return guide;
}

function buildDayTgtHtml(c,t){
  var abbr=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var eff=getDayTgtEff(c,t);
  var td=c.trainDays||[false,false,false,false,false,false,false];
  var macros=[
    {key:'k',label:'Kcal',cls:'mrow-k',icls:'dt-inp-k',mn:500,mx:6000},
    {key:'p',label:'Πρωτεΐνη g',cls:'mrow-p',icls:'dt-inp-p',mn:0,mx:500},
    {key:'f',label:'Λιπαρά g',cls:'mrow-f',icls:'dt-inp-f',mn:0,mx:300},
    {key:'c',label:'Υδατάνθρακες g',cls:'mrow-c',icls:'dt-inp-c',mn:0,mx:800}
  ];
  var thead='<tr><th></th>';
  abbr.forEach(function(a){thead+='<th>'+a+'</th>';});
  thead+='</tr>';
  // Training day toggle row
  var trainRow='<tr class="train-row"><td>Τύπος</td>';
  for(var ti=0;ti<7;ti++){
    var isT=td[ti];
    trainRow+='<td><button class="train-tog '+(isT?'train-t':'train-r')+'" onclick="setTrainDay('+ti+','+(isT?'false':'true')+')">'+(isT?'T':'R')+'</button></td>';
  }
  trainRow+='</tr>';
  // Per-day row: activity names (MET mode) or manual hours (non-MET)
  var dayRowHtml='';
  var useMET=c.metActivities&&c.metActivities.length>0;
  if(useMET){
    // Activity row: show which activities happen each day
    var actRow='<tr class="act-row"><td>🏃 Άσκηση</td>';
    var dAbbrA=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
    for(var ai=0;ai<7;ai++){
      var dayActs=[];
      c.metActivities.forEach(function(ma){
        var dList=ma.days;
        if(!dList){var n=ma.daysPerWeek||3;dList=[];for(var x=0;x<7&&dList.length<n;x++){if(td[x])dList.push(x);}if(!dList.length){for(var x=0;x<n&&x<7;x++)dList.push(x);}}
        if(dList.indexOf(ai)>-1)dayActs.push(ma.name+' <b>'+ma.mins+'λ.</b>');
      });
      actRow+='<td class="act-cell">'+(dayActs.length?dayActs.join('<br>'):'—')+'</td>';
    }
    actRow+='</tr>';
    // Time of training row (for MET mode too)
    var timeRow='<tr class="time-row"><td>🕐 Ώρα</td>';
    if(!c.trainTimesByDay)c.trainTimesByDay=['','','','','','',''];
    for(var ti=0;ti<7;ti++){
      var tiT=td[ti];
      var tVal=(c.trainTimesByDay&&c.trainTimesByDay[ti])?c.trainTimesByDay[ti]:'';
      timeRow+='<td><input class="dt-inp time-inp '+(tiT?'time-t':'time-r')+'" type="time"'
        +' value="'+tVal+'" id="time-'+ti+'" '+(tiT?'':'disabled')+' onchange="setTrainTime('+ti+',this.value)"></td>';
    }
    timeRow+='</tr>';
    dayRowHtml=actRow+timeRow;
  } else {
    // Manual hours row
    var hrsRow='<tr class="hrs-row"><td>⏱ ώρες</td>';
    for(var hi=0;hi<7;hi++){
      var hiT=td[hi];
      var hVal=(c.trainHoursByDay&&c.trainHoursByDay[hi]!=null)?c.trainHoursByDay[hi]:(hiT?(c.trainHoursPerDay||1):0);
      hrsRow+='<td><input class="dt-inp hrs-inp '+(hiT?'hrs-t':'hrs-r')+'" type="number" min="0" max="8" step="0.5"'
        +' value="'+hVal+'" id="hrs-'+hi+'" onchange="setTrainHours('+hi+',this.value)"></td>';
    }
    hrsRow+='</tr>';
    // Time of training row (when during the day)
    var timeRow='<tr class="time-row"><td>🕐 Ώρα</td>';
    if(!c.trainTimesByDay)c.trainTimesByDay=['','','','','','',''];
    for(var ti=0;ti<7;ti++){
      var tiT=td[ti];
      var tVal=(c.trainTimesByDay&&c.trainTimesByDay[ti])?c.trainTimesByDay[ti]:'';
      timeRow+='<td><input class="dt-inp time-inp '+(tiT?'time-t':'time-r')+'" type="time"'
        +' value="'+tVal+'" id="time-'+ti+'" '+(tiT?'':'disabled')+' onchange="setTrainTime('+ti+',this.value)"></td>';
    }
    timeRow+='</tr>';
    dayRowHtml=hrsRow+timeRow;
  }
  var tbody=trainRow+dayRowHtml;
  macros.forEach(function(m){
    tbody+='<tr class="'+m.cls+'"><td>'+m.label+'</td>';
    for(var i=0;i<7;i++){
      var val=eff[i][m.key]||'';
      tbody+='<td><input class="dt-inp '+m.icls+'" type="number" min="'+m.mn+'" max="'+m.mx+'" value="'+val+'"'
        +' id="dt-'+m.key+'-'+i+'" onchange="setDayMacro(\''+m.key+'\','+i+',this.value)"></td>';
    }
    tbody+='</tr>';
  });
  var carbBoostVal=c.carbBoost!=null?c.carbBoost:20;
  var timingGuide=getMealTimingGuide(c);
  // 🏁 Carb-loading status (ISSN Position Stand: Nutrient Timing) — only shows when an event date is set
  // AND imminent (see getCarbLoadDayIndexes); silent otherwise.
  var carbLoadIdxs=(typeof getCarbLoadDayIndexes==='function')?getCarbLoadDayIndexes(c):[];
  var carbLoadNote='';
  if(carbLoadIdxs.length){
    var dAbbrCL=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
    var namesCL=carbLoadIdxs.slice().sort(function(a,b){return a-b;}).map(function(ix){return dAbbrCL[ix];});
    var loadCarbGPreview=Math.round((c.weight||70)*10);
    carbLoadNote='<div style="background:#fff3e0;border:1px solid #ffb74d;border-radius:6px;padding:8px 12px;margin-top:8px;font-size:11px;color:#e65100"><b>🏁 Ενεργή καρβοφόρτωση:</b> '+namesCL.join(', ')+' — στόχος ~'+loadCarbGPreview+'g υδατάνθρακες/ημέρα (ISSN: 8-12g/kg)</div>';
  }
  return '<div class="day-tgt-wrap">'
    +'<div class="day-tgt-head"><span class="day-tgt-title">Θερμίδες &amp; μακροθρεπτικά ανά ημέρα</span>'
    +'<button class="day-tgt-reset" onclick="resetDayTargets()">&#8635; Επαναφορά TDEE</button></div>'
    +timingGuide
    +'<div class="carb-boost-row">'
    +'<label>&#127947; Carb boost ημέρας προπόνησης:</label>'
    +'<input class="carb-boost-inp" type="number" min="0" max="60" value="'+carbBoostVal+'" onchange="setCarbBoost(this.value)">%'
    +'</div>'
    +'<div class="carb-boost-row">'
    +'<label>&#127937; Ημερομηνία αγώνα (καρβοφόρτωση):</label>'
    +'<input class="carb-boost-inp" type="date" value="'+(c.eventDate||'')+'" onchange="setEventDate(this.value)" style="width:auto">'
    +'</div>'
    +carbLoadNote
    +'<div style="font-size:10px;color:#999;margin:4px 0 6px;font-style:italic">T=προπόνηση &nbsp;·&nbsp; R=ανάπαυση &nbsp;·&nbsp; ⏱ ώρες: οι θερμίδες κλιμακώνονται ανάλογα με τη διάρκεια &nbsp;·&nbsp; 🕐 Ώρα: ώρα έναρξης προπόνησης (pre: -2h, post: +30min) &nbsp;·&nbsp; Carb boost: +'+carbBoostVal+'%</div>'
    +'<div style="background:#f0f7ff;border:1px solid #80d4ff;border-radius:6px;padding:8px 12px;margin-top:8px;font-size:11px;color:#0056b3">'
    +'<div style="font-weight:700;margin-bottom:4px">⚡ Προσαρμογή Macros ανάλογα Προπόνησης</div>'
    +'<div style="line-height:1.5">'
    +'<div>📈 <b>Ημέρες Προπόνησης (T):</b> +10% Πρωτεΐνη, +20% Υδατάνθρακες, -15% Λιπαρά (ανάρρωση μυών + γλυκογόνο)</div>'
    +'<div>😴 <b>Ημέρες Ανάπαυσης (R):</b> Σταθερή Πρωτεΐνη, -15% Υδατάνθρακες, +15% Λιπαρά (ορμονική ισορροπία)</div>'
    +'</div>'
    +'</div>'
    +'<table class="day-tgt-table"><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table></div>';
}

/* ── MET Activities UI ───────────────────────────────────────────────────── */
function buildMetHtml(c,t){
  if(!c.metActivities)c.metActivities=[];
  var acts=c.metActivities;

  // Category select (no default - user must choose)
  var catSel='<select class="met-cat-sel" id="met-cat" onchange="metCatChange()">';
  catSel+='<option value="">Επίλεξε κατηγορία</option>';
  MET_ACTIVITIES.forEach(function(g,i){
    catSel+='<option value="'+i+'">'+g.cat+'</option>';
  });
  catSel+='</select>';

  // Activity select (no default selection - user must choose)
  var actSel='<select class="met-act-sel" id="met-act">';
  actSel+='<option value="">Επίλεξε αθλήματα</option>';
  MET_ACTIVITIES[0].items.forEach(function(a){
    actSel+='<option value="'+a.id+'">'+a.name+' — '+a.met+' METs</option>';
  });
  actSel+='</select>';

  // List of added activities
  var dAbbrM=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var listHtml='';
  acts.forEach(function(ma,i){
    var kcalSess=Math.round(ma.met*3.5*(c.weight||80)/200*ma.mins);
    // Resolve day list
    var dList=ma.days;
    if(!dList){var n=ma.daysPerWeek||3;dList=[];var td2=c.trainDays||[];for(var x=0;x<7&&dList.length<n;x++){if(td2[x])dList.push(x);}if(!dList.length){for(var x=0;x<n&&x<7;x++)dList.push(x);}}
    var kcalWk=kcalSess*dList.length;
    var dayChips=dList.map(function(d){return '<span class="met-item-day">'+dAbbrM[d]+'</span>';}).join('');
    listHtml+='<div class="met-item">'
      +'<span class="met-item-name">'+ma.name+'</span>'
      +'<span class="met-item-met">'+ma.met+' METs</span>'
      +'<span class="met-item-days">'+dayChips+'</span>'
      +(ma.time?'<span class="met-item-time" style="color:#ff6b35;font-weight:600">🕐 '+ma.time+'</span>':'')  // ← Show training time (HH:MM format)
      +'<span class="met-item-detail">'+ma.mins+' λεπτ./φορά</span>'
      +'<span class="met-item-kcal">= '+kcalWk+' kcal/εβδ.</span>'
      +'<button class="met-del" onclick="removeMetActivity('+i+')" title="Αφαίρεση">&#10005;</button>'
      +'</div>';
  });

  var useMET=acts.length>0;
  var totalStr='';
  if(useMET){
    totalStr='<div class="met-total">'
      +'<span>📊 Σύνολο άσκησης: <b>'+t.exerciseWeekly+' kcal/εβδ.</b> · <b>~'+t.exerciseDaily+' kcal/ημέρα</b></span>'
      +'<span class="met-note">TDEE = BMR×1.37 (NEAT) + άσκηση MET</span>'
      +'</div>';
  }

  // Day toggle buttons for the add row
  var dAbbrAdd=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var dayToggles='<div class="met-day-row">';
  dAbbrAdd.forEach(function(a,i){
    dayToggles+='<button type="button" class="met-day-btn" id="met-day-'+i+'" onclick="toggleMetDay('+i+')">'+a+'</button>';
  });
  dayToggles+='</div>';

  return '<div class="met-wrap" id="met-section-wrap">'
    +'<div class="met-head">'
    +'<span class="met-title">⚡ Αθλητική δραστηριότητα (MET-based)</span>'
    +(useMET?'<span class="met-badge">MET ✓ ενεργό</span>':'')
    +'</div>'

    // ✅ IMPROVED LAYOUT: Organized sections
    +(useMET?'<div class="met-added-section"><div class="met-added-title">✓ Δραστηριότητες που προστέθηκαν:</div><div class="met-list">'+listHtml+'</div>'+totalStr+'</div>':'')

    +'<div class="met-input-section">'
    +'<div class="met-input-title">Προσθήκη νέας δραστηριότητας:</div>'
    +'<div class="met-form-group">'
    +'<label>Κατηγορία αθλήματος:</label>'
    +catSel
    +'<label>Επιλέξτε δραστηριότητα:</label>'
    +actSel
    +'<label>Διάρκεια:</label>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +'<input class="met-mins-inp" type="number" id="met-mins" min="10" max="300" step="5" value="60">'
    +'<span style="font-size:12px;color:#666">λεπτά</span>'
    +'</div>'
    +'</div>'

    +'<div class="met-form-group">'
    +'<label>⏰ Ώρα Προπόνησης:</label>'
    +'<input type="time" id="met-time" value="17:00" style="padding:10px 12px;border:1.5px solid #e0e0e0;border-radius:7px;background:#fff;font-size:14px;font-weight:600;color:#ff6b35;">'
    +'</div>'

    +'<div class="met-form-group">'
    +'<label>Ημέρες εκτέλεσης:</label>'
    +dayToggles
    +'</div>'

    +'<div style="padding-top:8px;border-top:1px solid #e0e0e0;margin-top:8px">'
    +'<button class="btn primary" style="padding:8px 16px;font-size:12px" onclick="addMetActivity()">+ Προσθήκη δραστηριότητας</button>'
    +'</div>'
    +'</div>'

    +(useMET?'':'<div class="met-note" style="margin-top:8px;padding:8px 12px;background:#f5f5f5;border-left:3px solid #ff9800">💡 Χωρίς επιλογή δραστηριότητας χρησιμοποιείται ο παραδοσιακός πολλαπλασιαστής δραστηριότητας.</div>')

    +'</div>';
}

function metCatChange(){
  var catIdx=parseInt(document.getElementById('met-cat').value)||0;
  var sel=document.getElementById('met-act');
  if(!sel)return;
  sel.innerHTML='';
  (MET_ACTIVITIES[catIdx]||MET_ACTIVITIES[0]).items.forEach(function(a){
    var opt=document.createElement('option');
    opt.value=a.id;
    opt.textContent=a.name+' — '+a.met+' METs';
    sel.appendChild(opt);
  });
}

function toggleMetDay(d){
  var btn=document.getElementById('met-day-'+d);
  if(!btn)return;
  btn.classList.toggle('met-day-on');
}

function addMetActivity(){
  var c=getC();if(!c)return;
  if(!c.metActivities)c.metActivities=[];
  var catIdx=parseInt(document.getElementById('met-cat').value)||0;
  var actId=document.getElementById('met-act').value;
  var mins=parseInt(document.getElementById('met-mins').value)||60;
  var trainingTime=document.getElementById('met-time').value||'17:00';  // ← NEW: Get training time (format: HH:MM)
  // Collect selected days
  var days=[];
  for(var d=0;d<7;d++){
    var btn=document.getElementById('met-day-'+d);
    if(btn&&btn.classList.contains('met-day-on'))days.push(d);
  }
  if(!days.length){showErrorToast('Επίλεξε τουλάχιστον μία ημέρα!');return;}
  var found=null;
  (MET_ACTIVITIES[catIdx]||MET_ACTIVITIES[0]).items.forEach(function(a){if(a.id===actId)found=a;});
  if(!found)return;
  // ✅ NEW: Store training time with the activity
  c.metActivities.push({id:found.id,name:found.name,met:found.met,mins:mins,time:trainingTime,days:days});
  // Auto-mark days as training days and sync hours
  if(!c.trainDays)c.trainDays=[false,false,false,false,false,false,false];
  if(!c.trainHoursByDay)c.trainHoursByDay=[0,0,0,0,0,0,0];
  if(!c.trainTimes)c.trainTimes=[null,null,null,null,null,null,null];  // ← NEW: Store training times per day
  if(!c.trainTimesByDay)c.trainTimesByDay=['','','','','','',''];  // ← Keep in sync for exports (PDF/Word)
  days.forEach(function(d){
    c.trainDays[d]=true;
    c.trainHoursByDay[d]=Math.max(c.trainHoursByDay[d],+(mins/60).toFixed(1));
    c.trainTimes[d]=trainingTime;  // ← NEW: Store the training time for this day
    c.trainTimesByDay[d]=trainingTime;  // ← Sync so exports show the training time too
  });
  c.dayTargets=null; // recalculate
  save();
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

/* ── Conditional Visibility System ──────────────────────────────────────────*/
// Show/hide Activity Factor or MET section based on sport selection
// IMPORTANT: Activity Factor (Δραστηριότητα & Στόχος) MUST ALWAYS be visible for user selection
function updateConditionalVisibility(sportId){
  var metWrap=document.getElementById('met-section-wrap');
  var afWrap=document.getElementById('activity-factor-wrap');

  if(!metWrap||!afWrap)return;

  // ✅ ALWAYS SHOW Activity Factor/Goal section (user must be able to select these)
  afWrap.style.display='block';

  // If no sport selected, only show Activity Factor
  if(!sportId){
    metWrap.style.display='none';
    return;
  }

  // If sport selected, check isMET flag
  var sport=SPORT_PROFILES[sportId];
  if(!sport){
    metWrap.style.display='none';
    return;
  }

  // Show/hide MET section based on sport type (but Activity Factor is ALWAYS shown)
  if(sport.isMET){
    // MET-based sport: show BOTH MET section AND Activity Factor for flexibility
    metWrap.style.display='block';
    afWrap.style.display='block';
  } else {
    // Non-MET sport: show Activity Factor, hide MET section
    metWrap.style.display='none';
    afWrap.style.display='block';
  }
}

/* ── UX OPTIMIZATION: Auto-update Activity from Sport Selection ──────────── */
function updateActivityFromSport(sportId){
  var c=getC();if(!c)return;
  upd('sport', sportId);

  if(sportId){
    var sport=SPORT_PROFILES[sportId];
    if(!sport)return;

    // ✅ Used to auto-set c.activity from sport.category here, but SPORT_PROFILES entries
    // have no category field at all — that line threw on every single sport (undefined.includes),
    // silently aborting the rest of this function every time. Activity level stays purely
    // manual (the 4 PAL buttons below), which is what was actually happening in practice anyway.
    updateConditionalVisibility(sportId);
    var noteDiv=document.getElementById('sport-note');
    if(noteDiv)noteDiv.textContent=sport.notes||'';
  } else {
    // ✅ Cleared sport selection: activity isn't auto-set above, so nothing else
    // triggers a re-render — force one so the header "Άθλημα" tile reflects "—".
    renderMain();
  }

  onClientChange();
}

// ── Sport Protocol Supplement Management (PHASE 4) ──────────────────────────
function toggleSportSupplement(suppId, isChecked){
  var c=getC();if(!c)return;
  if(!c.supps)c.supps=[];

  if(isChecked){
    if(!c.supps.includes(suppId)){
      c.supps.push(suppId);
    }
  } else {
    var idx=c.supps.indexOf(suppId);
    if(idx!==-1)c.supps.splice(idx,1);
  }

  save();
  onClientChange(); // Recalculate supplement suggestions
}

function removeMetActivity(idx){
  var c=getC();if(!c||!c.metActivities)return;
  c.metActivities.splice(idx,1);
  // ✅ Rebuild training-day arrays from remaining activities (MET = single source of truth)
  c.trainDays=[false,false,false,false,false,false,false];
  c.trainHoursByDay=[0,0,0,0,0,0,0];
  c.trainTimes=[null,null,null,null,null,null,null];
  c.trainTimesByDay=['','','','','','',''];
  c.metActivities.forEach(function(ma){
    (ma.days||[]).forEach(function(d){
      c.trainDays[d]=true;
      c.trainHoursByDay[d]=Math.max(c.trainHoursByDay[d],+((ma.mins||60)/60).toFixed(1));
      if(ma.time){c.trainTimes[d]=ma.time;c.trainTimesByDay[d]=ma.time;}
    });
  });
  c.dayTargets=null; // recalculate
  save();
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

/* ── Macro Preset UI ─────────────────────────────────────────────────────── */
// ✅ Focused macro-distribution block for Page 1 (presets + split bar only — diet type lives in its own modal)
function buildMacroDistributionHtml(c,t){
  var preset=c.macroPreset||'balanced';
  var secState=getSecState(c);
  var macroPreview=(MACRO_PRESETS[preset]?MACRO_PRESETS[preset].label:preset)+' · Π'+t.pPct+'% Λ'+t.fPct+'% Υ'+t.cPct+'%';
  var html='<div class="section-card" id="sec-macros" style="margin-top:12px;">'
    +'<div class="section-header sec-collapse-hd" onclick="toggleSec(\'macros\')"><div><span class="section-icon">🎯</span>Κατανομή Μακροθρεπτικών'+(secState.macros?'<div class="sec-collapse-preview">'+esc(macroPreview)+'</div>':'')+'</div><span class="sec-chevron'+(secState.macros?'':' open')+'">▸</span></div>'
    +'<div id="sec-macros-body" style="display:'+(secState.macros?'none':'block')+'">'
    +'<div class="macro-preset-btns">';
  Object.keys(MACRO_PRESETS).forEach(function(k){
    var pr=MACRO_PRESETS[k];
    html+='<button class="macro-preset-btn'+(preset===k?' active':'')+'" onclick="setMacroPreset(\''+k+'\')" title="Π:'+pr.p+'% Λ:'+pr.f+'% Υ:'+pr.c+'%">'+pr.icon+' '+pr.label+'</button>';
  });
  html+='</div>';
  if(preset==='custom'){
    html+='<div class="macro-custom-row">'
      +'<label>Πρωτεΐνη %</label><input class="macro-custom-inp" type="number" min="10" max="60" value="'+(c.macroP||25)+'" onchange="setMacroCustom(\'p\',this.value)">'
      +'<label>Λιπαρά %</label><input class="macro-custom-inp" type="number" min="10" max="70" value="'+(c.macroF||25)+'" onchange="setMacroCustom(\'f\',this.value)">'
      +'<label>Υδατ. %</label><input class="macro-custom-inp" type="number" min="10" max="75" value="'+(c.macroC||50)+'" onchange="setMacroCustom(\'c\',this.value)">'
      +'</div>';
  }
  html+='<div class="macro-split-bar">'
    +'<span class="macro-split-p" style="width:'+t.pPct+'%">Π '+t.pPct+'%</span>'
    +'<span class="macro-split-f" style="width:'+t.fPct+'%">Λ '+t.fPct+'%</span>'
    +'<span class="macro-split-c" style="width:'+t.cPct+'%">Υ '+t.cPct+'%</span>'
    +'</div>'
    +'<div class="macro-split-vals">'
    +'<span class="macro-p-val">Πρωτεΐνη: '+t.p+'g&nbsp;&nbsp;('+t.pPct+'%)</span>'
    +'<span class="macro-f-val">Λιπαρά: '+t.f+'g&nbsp;&nbsp;('+t.fPct+'%)</span>'
    +'<span class="macro-c-val">Υδατ/κες: '+t.carb+'g&nbsp;&nbsp;('+t.cPct+'%)</span>'
    +'</div>'
    +'<div style="font-size:10px;color:#666;margin-top:6px;font-style:italic">Προσαρμόζεται αυτόματα από το άθλημα — αλλάξτε ελεύθερα χειροκίνητα.</div>'
    +buildInsightsPanelHtml(c,t)
    +'</div>'
    +'</div>';
  return html;
}

// 💊 Creatine monohydrate suggestion for strength/power sports (ISSN Position Stand, Kreider et al. 2017).
// Purely informational — no food exclusion or macro change. Empty for any other sport/diet type.
var CREATINE_SUGGESTED_SPORTS={weightlifting:1,crossfit:1,mma:1,bjj:1,boxing:1};

// ✅ Single consolidated findings panel — replaces 3 separately-colored, separately-styled boxes
// (RED-S/energy availability, TDEE double-counting/macro warnings, creatine tip) that all read as
// equally urgent. Now one severity dot per row (red=risk, amber=borderline, purple=info-only tip),
// so the actually-serious item is the one that stands out instead of everything shouting at once.
function buildInsightsPanelHtml(c,t){
  var items=[];

  // RED-S / energy availability — thresholds per IOC Consensus Statement on RED-S (2018):
  // EA<30 kcal/kgLBM/day = critical, <45 = borderline. Nothing shown when healthy/unmeasurable.
  if(t.ea!=null && t.ea<45){
    var isCrit=t.ea<30;
    items.push({sev:isCrit?'bad':'warn', text:
      '<b>'+(isCrit?'🔴 Κίνδυνος RED-S':'🟡 Οριακή Ενεργειακή Διαθεσιμότητα')+':</b> EA='+t.ea+' kcal/kgLBM ('+(isCrit?'κατώφλι &lt;30':'στόχος &gt;45')+')'
      +' <a href="https://stillmed.olympics.com/media/Documents/Athletes/Medical-Scientific/Consensus-Statements/REDs/IOC-consensus-statement-Relative-Energy-Deficiency-in-Sport-2018.pdf" target="_blank" style="color:inherit;text-decoration:underline">IOC Consensus 2018 ↗</a>'
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
    return '<div style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;'+borderStyle+'font-size:12px;color:#333">'
      +'<span style="flex-shrink:0;width:8px;height:8px;border-radius:50%;margin-top:4px;background:'+sevColor[it.sev]+'"></span>'
      +'<span style="flex:1">'+it.text+'</span>'
      +'</div>';
  }).join('');

  return '<div style="margin-top:10px;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;background:#fff">'
    +'<div style="padding:8px 10px;background:#f7f7f7;font-size:11px;font-weight:700;color:#555">📋 '+items.length+' εύρημα'+(items.length>1?'τα':'')+' σε αυτό το πλάνο</div>'
    +rowsHtml
    +'</div>';
}

function buildMacroPresetHtml(c,t){
  var preset=c.macroPreset||'balanced';
  var dietType=c.dietType||'normal';
  var html='<div class="macro-preset-wrap">'
    +'<div class="macro-preset-head">🎯 Κατανομή μακροθρεπτικών</div>'
    +'<div class="macro-preset-btns">';
  Object.keys(MACRO_PRESETS).forEach(function(k){
    var pr=MACRO_PRESETS[k];
    html+='<button class="macro-preset-btn'+(preset===k?' active':'')+'" onclick="setMacroPreset(\''+k+'\')" title="Π:'+pr.p+'% Λ:'+pr.f+'% Υ:'+pr.c+'%">'+pr.icon+' '+pr.label+'</button>';
  });
  html+='</div>'
    +'<div class="macro-preset-head" style="margin-top:12px">🍽️ Τύπος Διατροφής</div>'
    +'<div class="macro-preset-btns">'
    +'<button class="macro-preset-btn'+(dietType==='normal'?' active':'')+'" onclick="setDietType(\'normal\')" title="Κανονική διατροφή">🍗 Κανονική</button>'
    +'<button class="macro-preset-btn'+(dietType==='vegetarian'?' active':'')+'" onclick="setDietType(\'vegetarian\')" title="Χορτοφαγική διατροφή">🥬 Χορτοφαγική</button>'
    +'<button class="macro-preset-btn'+(dietType==='vegan'?' active':'')+'" onclick="setDietType(\'vegan\')" title="Веγανική διατροφή">🌱 Веγανι</button>'
    +'<button class="macro-preset-btn'+(dietType==='keto'?' active':'')+'" onclick="setDietType(\'keto\')" title="Κετογονική διατροφή">⚡ Κετογονική</button>'
    +'<button class="macro-preset-btn'+(dietType==='bodybuilding_clean'?' active':'')+'" onclick="setDietType(\'bodybuilding_clean\')" title="Bodybuilding Clean Eating">🏋️ Bodybuilding Clean</button>'
    +'<button class="macro-preset-btn'+(dietType==='intermittent_fasting'?' active':'')+'" onclick="setDietType(\'intermittent_fasting\')" title="Διαλείπουσα νηστεία">⏰ Διαλείπουσα Νηστεία</button>'
    +'<button class="macro-preset-btn'+(dietType==='orthodox_fasting'?' active':'')+'" onclick="setDietType(\'orthodox_fasting\')" title="Ορθόδοξη νηστεία">✝️ Ορθόδοξη Νηστεία</button>'
    +'<button class="macro-preset-btn'+(dietType==='kids_10_14'?' active':'')+'" onclick="setDietType(\'kids_10_14\')" title="Πλάνο για παιδιά 10-14 ετών">👧 Παιδιά 10-14</button>'
    +'</div>';
  if(preset==='custom'){
    html+='<div class="macro-custom-row">'
      +'<label>Πρωτεΐνη %</label><input class="macro-custom-inp" type="number" min="10" max="60" value="'+(c.macroP||25)+'" onchange="setMacroCustom(\'p\',this.value)">'
      +'<label>Λιπαρά %</label><input class="macro-custom-inp" type="number" min="10" max="70" value="'+(c.macroF||25)+'" onchange="setMacroCustom(\'f\',this.value)">'
      +'<label>Υδατ. %</label><input class="macro-custom-inp" type="number" min="10" max="75" value="'+(c.macroC||50)+'" onchange="setMacroCustom(\'c\',this.value)">'
      +'</div>';
  }
  html+='<div class="macro-split-bar">'
    +'<span class="macro-split-p" style="width:'+t.pPct+'%">Π '+t.pPct+'%</span>'
    +'<span class="macro-split-f" style="width:'+t.fPct+'%">Λ '+t.fPct+'%</span>'
    +'<span class="macro-split-c" style="width:'+t.cPct+'%">Υ '+t.cPct+'%</span>'
    +'</div>'
    +'<div class="macro-split-vals">'
    +'<span class="macro-p-val">Πρωτεΐνη: '+t.p+'g&nbsp;&nbsp;('+t.pPct+'%)</span>'
    +'<span class="macro-f-val">Λιπαρά: '+t.f+'g&nbsp;&nbsp;('+t.fPct+'%)</span>'
    +'<span class="macro-c-val">Υδατ/κες: '+t.carb+'g&nbsp;&nbsp;('+t.cPct+'%)</span>'
    +'</div>'
    +'</div>';
  return html;
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
  c.macroP=pr.p;c.macroF=pr.f;c.macroC=pr.c;
  save();
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

function setMacroCustom(key,val){
  var c=getC();if(!c)return;
  var v=Math.max(5,Math.min(80,parseInt(val)||25));
  if(key==='p')c.macroP=v;
  else if(key==='f')c.macroF=v;
  else if(key==='c')c.macroC=v;
  save();
  // Trigger update to recalculate TDEE and update table
  if(key==='p')upd('macroP',c.macroP);
  else if(key==='f')upd('macroF',c.macroF);
  else if(key==='c')upd('macroC',c.macroC);
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

/* ── Body Composition & Consultation Tracker ────────────────────────────── */
// Καταχωρήσεις βάρους/σημειώσεων που έστειλε ο ίδιος ο πελάτης από το portal (client_logs, χωρίς login).
// Δεν μπαίνουν αυτόματα στο επίσημο weightLog — ο διαιτολόγος επιβεβαιώνει με ένα κλικ.
// Ο πελάτης μπορεί προαιρετικά να επισημάνει ένα πλαίσιο ημέρας (ταξίδι/γιορτή/αρρώστια) από το portal —
// αποθηκεύεται ως πρόθεμα "[tag:id] " μέσα στο ίδιο πεδίο note (καμία νέα στήλη στο client_logs), το ξεχωρίζουμε εδώ.
var CLIENT_LOG_TAG_DEFS={travel:{icon:'✈️',label:'Ταξίδι'},party:{icon:'🎉',label:'Γιορτή'},sick:{icon:'🤒',label:'Άρρωστος/η'}};
function clientLogsPanelHtml(c){
  if(!window.Cloud || typeof window.Cloud.allClientLogsFor!=='function') return '';
  var entries=window.Cloud.allClientLogsFor(c);
  if(!entries.length) return '';
  var rows=entries.map(function(e){
    var w=e.weight_kg?('<b>'+e.weight_kg+' kg</b>'):'';
    var noteRaw=e.note||'';
    var tagMatch=/^\[tag:(travel|party|sick)\]\s*/.exec(noteRaw);
    var tagHtml='';
    if(tagMatch){
      var td=CLIENT_LOG_TAG_DEFS[tagMatch[1]];
      noteRaw=noteRaw.slice(tagMatch[0].length);
      tagHtml='<span style="background:#e8f5e9;color:#014545;border-radius:999px;padding:2px 8px;font-size:10px;margin-right:6px;white-space:nowrap">'+td.icon+' '+td.label+'</span>';
    }
    var n=noteRaw?('<span style="color:#666">'+esc(noteRaw)+'</span>'):'';
    return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #eee;font-size:11px">'
      +tagHtml+'<span>'+e.date+' — '+w+(w&&n?' · ':'')+n+'</span></div>';
  }).join('');
  return '<div class="tracker-section" style="background:#f1f8f6;border:1px solid #cfe8e0;border-radius:8px;padding:10px 12px;margin-bottom:10px">'
    +'<div style="font-size:11px;font-weight:700;color:#025857;margin-bottom:4px">📥 Ιστορικό καταχωρήσεων πελάτη <span style="font-weight:400;color:#666">(δικά του μέτρα — για σύγκριση, δεν επηρεάζουν το ιστορικό σου)</span></div>'
    +rows+'</div>';
}

function buildTrackerHtml(c){
  if(!c.weightLog)c.weightLog=[];
  if(!c.consultLog)c.consultLog=[];
  if(migrateClientSkinfoldBF(c))save();
  var today=new Date().toISOString().slice(0,10);

  // Weight / body composition section
  var isMinorC=(c.age||0)<18;
  var defaultProto=isMinorC?'slaughter':'jp4';
  var wHtml=buildClientProgressHtml(c)+'<div class="tracker-section">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    +'<div class="tracker-head" style="margin-bottom:0">📐 Ανθρωπομετρία &amp; Σωματική Σύνθεση</div>'
    +'<div style="display:flex;gap:6px">'
    +'<button class="btn" style="padding:4px 11px;font-size:11px;background:#025857;color:#fff;border:none" title="Επίλεξε 1 αρχείο για άμεσο έλεγχο, ή πολλά μαζί για μαζική εισαγωγή ιστορικού" onclick="triggerErgoCSVImport()">📤 Εισαγωγή CSV (εργομετρικά)</button>'
    +'<input type="file" id="ergo-csv-input" accept=".csv" multiple style="display:none" onchange="handleErgoCSVFile(event)">'
    +'<button class="btn" style="padding:4px 11px;font-size:11px;background:#025857;color:#fff;border:none" onclick="exportLipometriaPDF()">🖨️ Έντυπο Λιπομέτρησης</button>'
    +(c.weightLog&&c.weightLog.length?'<button class="btn" style="padding:4px 11px;font-size:11px;background:#025857;color:#fff;border:none" onclick="exportBodyCompPDF()">📊 Ιστορικό PDF</button>':'')
    +'</div>'
    +'</div>'
    // ── Skinfold panel ────────────────────────────────────────────────────────
    +'<div class="sf-panel" id="sf-panel">'
    +'<div class="sf-header" onclick="toggleSkinfoldPanel()">'
    +'<span>📐 Δερματοπτυχόμετρο <span style="font-size:10px;font-weight:400;color:#888">&nbsp;— υπολογισμός %BF από δερματοπτυχές</span></span>'
    +'<span id="sf-toggle-icon" style="font-size:11px;color:#888;font-weight:400">▼ άνοιγμα</span>'
    +'</div>'
    +'<div id="sf-body" style="display:none;padding-top:10px">'
    +(isMinorC?'<div style="font-size:10px;color:#e65100;background:#fff8e1;border-radius:5px;padding:4px 8px;margin-bottom:8px">👶 Ηλικία &lt;18 — προεπιλογή Slaughter (1988), ειδική εξίσωση για παιδιά/εφήβους</div>':'')
    +'<div class="tracker-add-row" style="gap:6px;margin-bottom:8px;align-items:center">'
    +'<label style="font-size:10px;color:#666">Πρωτόκολλο:</label>'
    +'<select id="sf-proto" class="tracker-inp" style="width:210px;font-size:11px" onchange="updateSkinfoldFields()">'
    +'<option value="jp4"'+(defaultProto==='jp4'?' selected':'')+'>JP 4-site ★ (Κοιλ./Υπλγ./Τρικ./Μηρός)</option>'
    +'<option value="jp3"'+(defaultProto==='jp3'?' selected':'')+'>JP 3-site (κλασικό)</option>'
    +'<option value="jp7"'+(defaultProto==='jp7'?' selected':'')+'>JP 7-site (πλήρες)</option>'
    +'<option value="slaughter"'+(defaultProto==='slaughter'?' selected':'')+'>Slaughter (1988) — παιδιά/έφηβοι</option>'
    +'</select>'
    +'<span id="sf-ref" style="font-size:9px;color:#aaa"></span>'
    +'</div>'
    +'<div id="sf-fields" class="tracker-add-row" style="gap:5px;flex-wrap:wrap;margin-bottom:8px"></div>'
    +'<div id="sf-result" style="display:none"></div>'
    +'</div>'
    +'</div>'
    +clientLogsPanelHtml(c)
    // ── Standard entry row ────────────────────────────────────────────────────
    +'<div class="tracker-add-row" style="flex-wrap:wrap;gap:5px">'
    +'<input type="date" id="tr-date" value="'+today+'" class="tracker-inp">'
    +'<input type="number" id="tr-weight" placeholder="Βάρος kg" min="20" max="300" step="0.1" class="tracker-inp" style="width:86px">'
    +'<input type="number" id="tr-bf" placeholder="Λίπος %" min="3" max="60" step="0.1" class="tracker-inp" style="width:72px">'
    +'<input type="number" id="tr-waist" placeholder="Μέση cm" min="40" max="200" step="0.5" class="tracker-inp" style="width:80px">'
    +'<input type="number" id="tr-hip" placeholder="Γοφοί cm" min="50" max="200" step="0.5" class="tracker-inp" style="width:80px">'
    +'<input type="number" id="tr-arm" placeholder="Δικέφ. cm" min="15" max="60" step="0.5" class="tracker-inp" style="width:80px">'
    +'</div>'
    +'<div class="tracker-add-row" style="flex-wrap:wrap;gap:5px;margin-top:5px">'
    +'<label style="font-size:10px;color:#666;align-self:center">Ύπνος:</label>'
    +'<select id="tr-sleep" class="tracker-inp" style="width:110px;font-size:11px">'
    +'<option value="">—</option><option value="5">5 ⭐ Εξαιρετικός</option><option value="4">4 ⭐ Καλός</option><option value="3">3 ⭐ Μέτριος</option><option value="2">2 ⭐ Κακός</option><option value="1">1 ⭐ Πολύ κακός</option>'
    +'</select>'
    +'<label style="font-size:10px;color:#666;align-self:center">Ενέργεια:</label>'
    +'<select id="tr-energy" class="tracker-inp" style="width:110px;font-size:11px">'
    +'<option value="">—</option><option value="5">5 ⚡ Άριστη</option><option value="4">4 ⚡ Καλή</option><option value="3">3 ⚡ Μέτρια</option><option value="2">2 ⚡ Χαμηλή</option><option value="1">1 ⚡ Εξαντλητική</option>'
    +'</select>'
    +'<label style="font-size:10px;color:#666;align-self:center">Συμμόρφωση:</label>'
    +'<select id="tr-compliance" class="tracker-inp" style="width:120px;font-size:11px">'
    +'<option value="">—</option><option value="10">10 — Πλήρης</option><option value="9">9 — Σχεδόν πλήρης</option><option value="8">8 — Πολύ καλή</option><option value="7">7 — Καλή</option><option value="6">6 — Μέτρια</option><option value="5">5 — Μισή</option><option value="4">4 — Κακή</option><option value="3">3 — Πολύ κακή</option>'
    +'</select>'
    +'<input type="text" id="tr-notes" placeholder="Σημειώσεις..." class="tracker-inp" style="flex:1;min-width:120px">'
    +'<button class="btn" style="padding:5px 11px;font-size:11px" onclick="addWeightEntry()">+ Προσθήκη</button>'
    +'</div>';
  if(c.weightLog.length>0){
    // ✅ Current Status Card (latest measurement)
    var latest=c.weightLog[c.weightLog.length-1];
    var latestLBM=latest.bf>0?+(latest.weight*(1-latest.bf/100)).toFixed(1):null;
    var latestFM=latest.bf>0?+(latest.weight-latestLBM).toFixed(1):null;
    var latestBMI=+(latest.weight/((c.height/100)*(c.height/100))).toFixed(1);
    var latestBMIStatus='';
    if(latestBMI<18.5)latestBMIStatus='Underweight ℹ️';
    else if(latestBMI<25)latestBMIStatus='Normal ✓';
    else if(latestBMI<30)latestBMIStatus='Overweight ⚠️';
    else latestBMIStatus='Obese 🔴';
    var latestBMIColor=latestBMI<18.5?'#ff6b35':latestBMI<25?'#2e7d32':latestBMI<30?'#ff9800':'#c62828';

    wHtml+='<div style="background:#fff8e1;border:1px solid #ffb74d;border-radius:8px;padding:12px;margin-bottom:10px">'
      +'<div style="font-size:10px;color:#e65100;font-weight:700;margin-bottom:8px">📊 Τρέχουσα Κατάσταση ('+latest.date+')</div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;font-size:10px">'
      +'<div style="background:#fff;padding:8px;border-radius:5px;border-left:3px solid #2e7d32">'
      +'<div style="color:#666">Βάρος</div><div style="font-size:14px;font-weight:700;color:#025857">'+latest.weight+' kg</div></div>'
      +(latest.bf?'<div style="background:#fff;padding:8px;border-radius:5px;border-left:3px solid #ff9999"><div style="color:#666">Λίπος</div><div style="font-size:14px;font-weight:700;color:#c62828">'+latest.bf+'%</div></div>':'')
      +(latestLBM?'<div style="background:#fff;padding:8px;border-radius:5px;border-left:3px solid #1565C0"><div style="color:#666">Lean Mass</div><div style="font-size:14px;font-weight:700;color:#1565C0">'+latestLBM+' kg</div></div>':'')
      +'<div style="background:#fff;padding:8px;border-radius:5px;border-left:3px solid '+latestBMIColor+'">'
      +'<div style="color:#666">BMI</div><div style="font-size:14px;font-weight:700;color:'+latestBMIColor+'">'+latestBMI+' ('+latestBMIStatus+')</div></div>'
      +(latest.waist?'<div style="background:#fff;padding:8px;border-radius:5px;border-left:3px solid #9c27b0"><div style="color:#666">Μέση</div><div style="font-size:14px;font-weight:700;color:#9c27b0">'+latest.waist+' cm</div></div>':'')
      +(latest.hip?'<div style="background:#fff;padding:8px;border-radius:5px;border-left:3px solid #f57c00"><div style="color:#666">Γοφοί</div><div style="font-size:14px;font-weight:700;color:#f57c00">'+latest.hip+' cm</div></div>':'')
      +'</div>'
      +'</div>';

    // ✅ TREND LINES: Weight & Body Fat % Charts
    if(c.weightLog.length>=2){
      wHtml+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px">'
        +'<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px">'
        +'<canvas id="trendWeightChart"></canvas>'
        +'</div>'
        +'<div style="background:#fff;border:1px solid #e0e0e0;border-radius:8px;padding:12px">'
        +'<canvas id="trendBFChart"></canvas>'
        +'</div>'
        +'</div>';
    }

    // ── Progress summary ───────────────────────────────────────────────────────
    if(c.weightLog.length>=2){
      var sorted2=c.weightLog.slice().sort(function(a,b){return a.date<b.date?-1:1;});
      var first=sorted2[0],last=sorted2[sorted2.length-1];
      var wDiff=+(last.weight-first.weight).toFixed(1);
      var wCol=wDiff<0?'#2e7d32':wDiff>0?'#c62828':'#888';
      var bfDiff=(first.bf>0&&last.bf>0)?+(last.bf-first.bf).toFixed(1):null;
      var lbmFirst=first.bf>0?+(first.weight*(1-first.bf/100)).toFixed(1):null;
      var lbmLast=last.bf>0?+(last.weight*(1-last.bf/100)).toFixed(1):null;
      var lbmDiff=(lbmFirst&&lbmLast)?+(lbmLast-lbmFirst).toFixed(1):null;
      var wstDiff=(first.waist>0&&last.waist>0)?+(last.waist-first.waist).toFixed(1):null;
      // Compliance average
      var compEntries=c.weightLog.filter(function(e){return e.compliance>0;});
      var compAvg=compEntries.length?+(compEntries.reduce(function(s,e){return s+e.compliance;},0)/compEntries.length).toFixed(1):null;
      // ✅ Enhanced progress summary with visual body composition
    var lastLBM=last.bf>0?+(last.weight*(1-last.bf/100)).toFixed(1):null;
    var lastFM=last.bf>0?+(last.weight-lastLBM).toFixed(1):null;
    var lastBMI=+(last.weight/((c.height/100)*(c.height/100))).toFixed(1);
    var bmiStatus='';
    if(lastBMI<18.5)bmiStatus='Underweight';
    else if(lastBMI<25)bmiStatus='Normal ✓';
    else if(lastBMI<30)bmiStatus='Overweight';
    else bmiStatus='Obese';
    var bmiColor=lastBMI<18.5?'#ff6b35':lastBMI<25?'#2e7d32':lastBMI<30?'#ff9800':'#c62828';

    wHtml+='<div style="background:#f0f9f8;border:1px solid #c5ddd8;border-radius:9px;padding:12px 14px;margin-bottom:10px">'
        +'<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px">'
        +'<span style="font-size:11px;font-weight:700;color:#025857">📈 Σύνοψη προόδου</span>'
        +'<span style="font-size:11px">Βάρος: <b style="color:'+wCol+'">'+(wDiff>0?'+':'')+wDiff+' kg</b> ('+first.weight+'→'+last.weight+'kg)</span>'
        +(bfDiff!==null?'<span style="font-size:11px">Λίπος: <b style="color:'+(bfDiff<0?'#2e7d32':'#c62828')+'">'+(bfDiff>0?'+':'')+bfDiff+'%</b></span>':'')
        +(lbmDiff!==null?'<span style="font-size:11px">Lean Mass: <b style="color:'+(lbmDiff>0?'#1565C0':'#888')+'">'+(lbmDiff>0?'+':'')+lbmDiff+' kg</b></span>':'')
        +'<span style="font-size:11px">BMI: <b style="color:'+bmiColor+'">'+lastBMI+' ('+bmiStatus+')</b></span>'
        +'<span style="font-size:10px;color:#aaa;margin-left:auto">'+sorted2.length+' μετρήσεις</span>'
        +'</div>'
        // Visual body composition bar
        +(lastLBM&&lastFM?'<div style="margin-top:8px">'
          +'<div style="font-size:9px;color:#666;margin-bottom:3px">Σύσταση σώματος (τελευταία):</div>'
          +'<div style="display:flex;gap:1px;height:18px;border-radius:3px;overflow:hidden;background:#eee">'
          +'<div style="width:'+(lastLBM/last.weight*100)+'%;background:#1565C0;display:flex;align-items:center;justify-content:center">'
          +(lastLBM/last.weight*100>15?'<span style="color:#fff;font-size:8px;font-weight:700">'+lastLBM+'kg</span>':'')
          +'</div>'
          +'<div style="width:'+(lastFM/last.weight*100)+'%;background:#ff9999;display:flex;align-items:center;justify-content:center">'
          +(lastFM/last.weight*100>15?'<span style="color:#fff;font-size:8px;font-weight:700">'+lastFM+'kg</span>':'')
          +'</div>'
          +'</div>'
          +'<div style="display:flex;gap:15px;font-size:9px;margin-top:4px">'
          +'<span><span style="display:inline-block;width:12px;height:12px;background:#1565C0;border-radius:2px;vertical-align:middle;margin-right:3px"></span>Lean Mass: '+lastLBM+' kg ('+(lastLBM/last.weight*100).toFixed(1)+'%)</span>'
          +'<span><span style="display:inline-block;width:12px;height:12px;background:#ff9999;border-radius:2px;vertical-align:middle;margin-right:3px"></span>Fat Mass: '+lastFM+' kg ('+last.bf+'%)</span>'
          +'</div>'
          +'</div>':'')
        +'</div>';
    }
    wHtml+='<div style="overflow-x:auto"><table class="tracker-table"><thead><tr>'
        +'<th title="Ημερομηνία μέτρησης">Ημ/νία</th>'
        +'<th title="Σωματικό βάρος (kg)">Βάρος</th>'
        +'<th title="Ποσοστό σωματικού λίπους">Λίπος%</th>'
        +'<th title="Lean Body Mass - μυϊκή μάζα (kg)">LBM</th>'
        +'<th title="Περίμετρος μέσης (cm)">Μέση</th>'
        +'<th title="Περίμετρος γοφών (cm)">Γοφοί</th>'
        +'<th title="Περίμετρος δικέφαλου (cm)">Δικέφ.</th>'
        +'<th title="Ποιότητα ύπνου">Ύπνος</th>'
        +'<th title="Επίπεδο ενέργειας">Ενέρ.</th>'
        +'<th title="Συμμόρφωση με πλάνο (0-10)">Συμμ.</th>'
        +'<th title="Διάφορες σημειώσεις">Σημειώσεις</th>'
        +'<th></th></tr></thead><tbody>';
    c.weightLog.slice().reverse().forEach(function(e,ri){
      var i=c.weightLog.length-1-ri;
      var lbm=(e.bf>0)?+(e.weight*(1-e.bf/100)).toFixed(1):'—';
      var sleepStars=e.sleep?'⭐'.repeat(e.sleep):'—';
      var energyBolts=e.energy?'⚡'.repeat(e.energy):'—';
      var sfProtoLabel={jp4:'JP4',jp3:'JP3',jp7:'JP7',slaughter:'SL'};
      var sfBadge=e.sfProtocol?'<span title="Μέτρηση με δερματοπτυχόμετρο ('+e.sfProtocol.toUpperCase()+')" style="font-size:8px;background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:1px 4px;margin-left:3px;font-weight:700;cursor:default">📐'+(sfProtoLabel[e.sfProtocol]||e.sfProtocol)+'</span>':'';
      wHtml+='<tr>'
        +'<td style="white-space:nowrap">'+e.date+'</td>'
        +'<td><b>'+e.weight+' kg</b></td>'
        +'<td>'+(e.bf?e.bf+'%'+sfBadge:'—')+'</td>'
        +'<td>'+(lbm!=='—'?lbm+' kg':'—')+'</td>'
        +'<td>'+(e.waist?e.waist+' cm':'—')+'</td>'
        +'<td>'+(e.hip?e.hip+' cm':'—')+'</td>'
        +'<td>'+(e.arm?e.arm+' cm':'—')+'</td>'
        +'<td style="font-size:9px">'+sleepStars+'</td>'
        +'<td style="font-size:9px">'+energyBolts+'</td>'
        +'<td>'+(e.compliance?'<b>'+e.compliance+'/10</b>':'—')+'</td>'
        +'<td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#666">'+esc(e.notes||'')+'</td>'
        +'<td><button class="met-del" onclick="removeWeightEntry('+i+')">&#10005;</button></td>'
        +'</tr>';
    });
    wHtml+='</tbody></table></div>';
  } else {
    wHtml+='<div class="tracker-empty">Δεν υπάρχουν καταχωρήσεις ακόμα. Πρόσθεσε το πρώτο μέτρημα!</div>';
  }
  wHtml+='</div>';

  // Consultation log section
  var cHtml='<div class="tracker-section">'
    +'<div class="tracker-head">📝 Ημερολόγιο συμβουλευτικής</div>'
    +'<div class="tracker-add-row" style="align-items:flex-start">'
    +'<input type="date" id="cons-date" value="'+today+'" class="tracker-inp" style="align-self:center">'
    +'<textarea id="cons-notes" placeholder="Σημειώσεις συνεδρίας (βάρος, εντυπώσεις, αλλαγές, στόχοι...)..." class="tracker-textarea"></textarea>'
    +'<button class="btn" style="padding:5px 11px;font-size:11px;align-self:flex-end" onclick="addConsultEntry()">+ Καταχώρηση</button>'
    +'</div>';
  if(c.consultLog.length>0){
    cHtml+='<div class="consult-log">';
    c.consultLog.slice().reverse().forEach(function(e,ri){
      var i=c.consultLog.length-1-ri;
      cHtml+='<div class="consult-entry">'
        +'<div class="consult-date">'+e.date+(e.weight?' · βάρος: <b>'+e.weight+' kg</b>':'')+'</div>'
        +'<div class="consult-text">'+e.notes.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>'
        +'<button class="met-del" onclick="removeConsultEntry('+i+')" title="Διαγραφή">&#10005;</button>'
        +'</div>';
    });
    cHtml+='</div>';
  } else {
    cHtml+='<div class="tracker-empty">Δεν υπάρχουν καταχωρήσεις. Πρόσθεσε την πρώτη σημείωση!</div>';
  }
  cHtml+='</div>';

  // ✅ Initialize trend charts after HTML is inserted
  if(c.weightLog && c.weightLog.length>=2){
    setTimeout(function(){ initTrendCharts(c); }, 100);
  }

  return '<div style="padding:16px 20px">'+wHtml+cHtml+'</div>';
}

// ✅ TREND LINES CHARTS - Weight & Body Fat %
function initTrendCharts(c){
  if(!c || !c.weightLog || c.weightLog.length<2) return;

  var sorted=c.weightLog.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  var dates=sorted.map(function(e){return e.date.substring(5);});
  var weights=sorted.map(function(e){return e.weight;});
  var bfs=sorted.map(function(e){return e.bf>0?e.bf:null;});

  // Weight Trend Chart
  var wCtx=document.getElementById('trendWeightChart');
  if(wCtx){
    new Chart(wCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Βάρος (kg)',
          data: weights,
          borderColor: '#025857',
          backgroundColor: 'rgba(2,88,87,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#025857'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: true, labels: { font: { size: 11 }, color: '#666' } }, title: { display: true, text: '📈 Weight Trend', font: { size: 13, weight: 'bold' }, color: '#025857' } },
        scales: { y: { beginAtZero: false, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } }
      }
    });
  }

  // Body Fat % Trend Chart
  var bfCtx=document.getElementById('trendBFChart');
  if(bfCtx){
    new Chart(bfCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Body Fat %',
          data: bfs,
          borderColor: '#ff6b35',
          backgroundColor: 'rgba(255,107,53,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#ff6b35'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: true, labels: { font: { size: 11 }, color: '#666' } }, title: { display: true, text: '📊 Body Fat % Trend', font: { size: 13, weight: 'bold' }, color: '#ff6b35' } },
        scales: { y: { beginAtZero: false, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } }
      }
    });
  }
}

/* ── Skinfold Calculator ─────────────────────────────────────────────────── */
function calcSkinfoldBF(protocol,sex,age,fields){
  var bf=null,bd=null,sum=0;
  if(protocol==='jp4'){
    // JP 4-site: κοιλιά + υπερλαγόνιο + τρικέφαλος + μηρός — δίνει απευθείας %BF (όχι μέσω BD/Siri)
    // Jackson & Pollock (1985) "Practical assessment of body composition." Physician and Sportsmedicine 13:76-90
    sum=(fields.abdomen||0)+(fields.suprailiac||0)+(fields.tricep||0)+(fields.thigh||0);
    if(sum>0){
      if(sex==='M') bf=0.29288*sum-0.0005*sum*sum+0.15845*age-5.76377;
      else bf=0.29669*sum-0.00043*sum*sum+0.02963*age+1.4072;
    }
  } else if(protocol==='jp3'){
    if(sex==='M') sum=(fields.chest||0)+(fields.abdomen||0)+(fields.thigh||0);
    else sum=(fields.tricep||0)+(fields.suprailiac||0)+(fields.thigh||0);
    if(sum>0){
      if(sex==='M') bd=1.10938-0.0008267*sum+0.0000016*sum*sum-0.0002574*age;
      else bd=1.0994921-0.0009929*sum+0.0000023*sum*sum-0.0001392*age;
      bf=(4.95/bd-4.50)*100;
    }
  } else if(protocol==='jp7'){
    sum=(fields.chest||0)+(fields.midaxillary||0)+(fields.tricep||0)+(fields.subscapular||0)+(fields.abdomen||0)+(fields.suprailiac||0)+(fields.thigh||0);
    if(sum>0){
      if(sex==='M') bd=1.112-0.00043499*sum+0.00000055*sum*sum-0.00028826*age;
      else bd=1.097-0.00046971*sum+0.00000056*sum*sum-0.00012828*age;
      bf=(4.95/bd-4.50)*100;
    }
  } else if(protocol==='slaughter'){
    sum=(fields.tricep||0)+(fields.calf||0);
    if(sum>0){
      if(sex==='M') bf=sum<=35?0.735*sum+1.0:0.546*sum+9.7;
      else bf=0.610*sum+5.1;
    }
  }
  if(bf!==null) bf=Math.max(3,Math.min(60,+bf.toFixed(1)));
  return{bf:bf,bd:bd?+bd.toFixed(5):null,sum:sum};
}

function toggleSkinfoldPanel(){
  var body=document.getElementById('sf-body');
  var icon=document.getElementById('sf-toggle-icon');
  if(!body)return;
  var isOpen=body.style.display!=='none';
  body.style.display=isOpen?'none':'block';
  if(icon)icon.textContent=isOpen?'▼ άνοιγμα':'▲ κλείσιμο';
  if(!isOpen)updateSkinfoldFields();
}

function updateSkinfoldFields(){
  var c=getC();if(!c)return;
  var protoEl=document.getElementById('sf-proto');
  if(!protoEl)return;
  var p=protoEl.value;
  var sex=c.sex||'M';
  var fieldsDiv=document.getElementById('sf-fields');
  var refSpan=document.getElementById('sf-ref');
  if(!fieldsDiv)return;
  var defs=[];
  var ref='';
  if(p==='jp4'){
    ref='Jackson & Pollock, 1985 — 4 σημεία';
    defs=[
      {k:'abdomen',   lbl:'1. Κοιλιά mm'},
      {k:'suprailiac',lbl:'2. Υπερλαγόνιο mm'},
      {k:'tricep',    lbl:'3. Τρικέφαλος mm'},
      {k:'thigh',     lbl:'4. Μηρός (τετρακέφαλος) mm'}
    ];
  } else if(p==='jp3'){
    ref='Jackson & Pollock, 1978/1980';
    if(sex==='M') defs=[{k:'chest',lbl:'Στήθος mm'},{k:'abdomen',lbl:'Κοιλιά mm'},{k:'thigh',lbl:'Μηρός mm'}];
    else defs=[{k:'tricep',lbl:'Τρικέφαλος mm'},{k:'suprailiac',lbl:'Υπερλαγόνιο mm'},{k:'thigh',lbl:'Μηρός mm'}];
  } else if(p==='jp7'){
    ref='Jackson & Pollock, 1978/1980';
    defs=[{k:'chest',lbl:'Στήθος'},{k:'midaxillary',lbl:'Μεσομάσχαλο'},{k:'tricep',lbl:'Τρικέφαλος'},{k:'subscapular',lbl:'Υποπλάτιο'},{k:'abdomen',lbl:'Κοιλιά'},{k:'suprailiac',lbl:'Υπερλαγόνιο'},{k:'thigh',lbl:'Μηρός'}];
  } else {
    ref='Slaughter et al., 1988';
    defs=[{k:'tricep',lbl:'Τρικέφαλος mm'},{k:'calf',lbl:'Γαστροκνήμιος mm'}];
  }
  if(refSpan)refSpan.textContent=ref;
  var html='';
  defs.forEach(function(f){
    html+='<input type="number" id="sf-'+f.k+'" placeholder="'+f.lbl+'" min="1" max="80" step="0.5" class="tracker-inp" style="width:140px" oninput="updateSkinfoldCalc()">';
  });
  fieldsDiv.innerHTML=html;
  var resDiv=document.getElementById('sf-result');
  if(resDiv)resDiv.style.display='none';
}

function updateSkinfoldCalc(){
  var c=getC();if(!c)return;
  var protoEl=document.getElementById('sf-proto');
  if(!protoEl)return;
  var p=protoEl.value;
  var sex=c.sex||'M';
  var age=c.age||25;
  var wInp=document.getElementById('tr-weight');
  var weight=wInp?parseFloat(wInp.value)||0:c.weight||0;
  var fields={};
  ['chest','abdomen','thigh','tricep','suprailiac','midaxillary','subscapular','calf'].forEach(function(k){
    var el=document.getElementById('sf-'+k);
    if(el&&el.value)fields[k]=parseFloat(el.value)||0;
  });
  var res=calcSkinfoldBF(p,sex,age,fields);
  var resDiv=document.getElementById('sf-result');
  if(!resDiv)return;
  if(res.bf===null){resDiv.style.display='none';return;}
  var lbm=weight>0?+(weight*(1-res.bf/100)).toFixed(1):null;
  var fm=weight>0?+(weight*res.bf/100).toFixed(1):null;
  var bfClass=res.bf<10?'#1565C0':res.bf<20?'#2e7d32':res.bf<30?'#e65100':'#c62828';
  var bdTxt=res.bd?'<span style="font-size:10px;color:#aaa;margin-left:4px">BD: '+res.bd+'</span>':'';
  resDiv.className='sf-result-row';
  resDiv.innerHTML='<span><b>%BF:</b> <span style="color:'+bfClass+';font-size:14px;font-weight:700">'+res.bf+'%</span>'+bdTxt+'</span>'
    +(lbm?'<span><b>LBM:</b> '+lbm+' kg</span>':'')
    +(fm?'<span><b>FM:</b> '+fm+' kg</span>':'')
    +'<span style="font-size:10px;color:#aaa">Άθροισμα: '+res.sum+' mm</span>'
    +'<button class="btn primary" style="padding:4px 10px;font-size:11px;margin-left:auto" onclick="applySkinfoldBF()">✓ Χρήση ως %BF</button>';
  resDiv.style.display='flex';
}

function applySkinfoldBF(){
  var c=getC();if(!c)return;
  var protoEl=document.getElementById('sf-proto');
  if(!protoEl)return;
  var fields={};
  ['chest','abdomen','thigh','tricep','suprailiac','midaxillary','subscapular','calf'].forEach(function(k){
    var el=document.getElementById('sf-'+k);
    if(el&&el.value)fields[k]=parseFloat(el.value)||0;
  });
  var res=calcSkinfoldBF(protoEl.value,c.sex||'M',c.age||25,fields);
  if(res.bf===null)return;
  var bfInp=document.getElementById('tr-bf');
  if(bfInp){bfInp.value=res.bf;bfInp.style.background='#e8f5e9';bfInp.style.borderColor='#81c784';setTimeout(function(){bfInp.style.background='';bfInp.style.borderColor='';},1200);}
}

function getSkinfoldEntry(){
  var protoEl=document.getElementById('sf-proto');
  var bodyEl=document.getElementById('sf-body');
  if(!protoEl||!bodyEl||bodyEl.style.display==='none')return null;
  var p=protoEl.value;
  var fields={};
  var any=false;
  ['chest','abdomen','thigh','tricep','suprailiac','midaxillary','subscapular','calf'].forEach(function(k){
    var el=document.getElementById('sf-'+k);
    if(el&&el.value){fields[k]=parseFloat(el.value)||0;any=true;}
  });
  if(!any)return null;
  return{protocol:p,fields:fields};
}

/* ── Ergometric CSV Import ──────────────────────────────────────────────────
   Reads a CSV exported from the ergometric device (Weight, Height, DoB,
   Skinfold Tricep/Subscapular/Abdominal/Supraspinale/Front Thigh, ...) and
   pre-fills the tracker entry + skinfold panel (JP 4-site). Supraspinale is
   treated as equivalent to the suprailiac/JP4 site; Subscapular is kept in
   sfFields for the record but isn't used by the JP4 formula. */
function triggerErgoCSVImport(){
  var inp=document.getElementById('ergo-csv-input');
  if(inp)inp.click();
}

function parseErgoCSVRows(text){
  var lines=text.split(/\r\n|\n|\r/).filter(function(l){return l.trim().length>0;});
  if(lines.length<2)return[];
  var headers=lines[0].split(',').map(function(h){return h.trim();});
  var num=function(v){var n=parseFloat(v);return isNaN(n)?null:n;};
  var isoDate=function(v){return v&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:null;};
  return lines.slice(1).map(function(line){
    var cells=line.split(',');
    var row={};
    headers.forEach(function(h,i){row[h]=(cells[i]||'').trim();});
    var height=num(row['Height']);
    if(height!=null&&height<=3)height=+(height*100).toFixed(1); // meters -> cm
    return{
      testDate:isoDate(row['Test Date']),
      weight:num(row['Weight']),
      height:height,
      birthDate:isoDate(row['DoB']),
      tricep:num(row['Skinfold Tricep']),
      subscapular:num(row['Skinfold Subscapular']),
      abdomen:num(row['Skinfold Abdominal']),
      suprailiac:num(row['Skinfold Supraspinale']),
      thigh:num(row['Skinfold Front Thigh'])
    };
  }).filter(function(r){return r.testDate&&r.weight!=null;});
}

function parseErgoCSV(text){
  var rows=parseErgoCSVRows(text);
  if(!rows.length)return null;
  rows.sort(function(a,b){return a.testDate<b.testDate?-1:a.testDate>b.testDate?1:0;});
  return rows[rows.length-1];
}

function ageAtDate(birthDate,atDateStr){
  if(!birthDate)return null;
  var b=new Date(birthDate);if(isNaN(b.getTime()))return null;
  var t=atDateStr?new Date(atDateStr):new Date();
  if(isNaN(t.getTime()))t=new Date();
  var a=t.getFullYear()-b.getFullYear();
  var m=t.getMonth()-b.getMonth();
  if(m<0||(m===0&&t.getDate()<b.getDate()))a--;
  return (a>=0&&a<=150)?a:null;
}

/* One-time, idempotent fix for the old "JP5" protocol, which wrongly applied the
   JP7 (7-site) regression coefficients to a 5-site skinfold sum and systematically
   underestimated %BF. Recomputes bf from the raw sfFields already stored on each
   weightLog entry using the correct JP4 (Jackson & Pollock 1985) formula — no
   re-measurement needed. Uses age-at-measurement-date via ageAtDate when birthDate
   is known, falling back to the client's current age otherwise. */
function migrateClientSkinfoldBF(c){
  if(!c||!c.weightLog||!c.weightLog.length)return false;
  var changed=false;
  c.weightLog.forEach(function(e){
    if(e.sfProtocol==='jp5'&&e.sfFields){
      var age=ageAtDate(c.birthDate,e.date)||c.age||25;
      var res=calcSkinfoldBF('jp4',c.sex||'M',age,e.sfFields);
      if(res.bf!=null)e.bf=res.bf;
      e.sfProtocol='jp4';
      changed=true;
    }
  });
  if(changed){
    var latest=c.weightLog[c.weightLog.length-1];
    if(latest&&latest.bf>0){c.bf=latest.bf;c.lbm=+(latest.weight*(1-latest.bf/100)).toFixed(1);}
  }
  return changed;
}

function applyErgoCSVData(data){
  var c=getC();if(!c)return;
  var profileChanged=false;
  if(data.height!=null&&!c.height){c.height=data.height;profileChanged=true;}
  if(data.birthDate&&!c.birthDate&&!c.age){
    c.birthDate=data.birthDate;
    var a=calcAgeFromBirthdate(data.birthDate);
    if(a!=null)c.age=a;
    profileChanged=true;
  }
  if(profileChanged)save();

  var s3=document.getElementById('s3');
  if(s3)s3.innerHTML=buildTrackerHtml(c);

  var dateInp=document.getElementById('tr-date');
  if(dateInp&&data.testDate)dateInp.value=data.testDate;
  var wInp=document.getElementById('tr-weight');
  if(wInp&&data.weight!=null)wInp.value=data.weight;

  toggleSkinfoldPanel();
  var protoEl=document.getElementById('sf-proto');
  if(protoEl){protoEl.value='jp4';updateSkinfoldFields();}
  ['tricep','subscapular','abdomen','suprailiac','thigh'].forEach(function(k){
    var el=document.getElementById('sf-'+k);
    if(el&&data[k]!=null)el.value=data[k];
  });
  updateSkinfoldCalc();
  applySkinfoldBF();

  var hEl=document.getElementById('inp-height');
  if(hEl&&c.height)hEl.value=c.height;
  updateAgeDisplay();

  showSuccessToast('✅ Εισήχθησαν δεδομένα από το CSV. Έλεγξε τις τιμές και πάτησε "+ Προσθήκη" για να αποθηκευτούν.');
}

function handleErgoCSVFile(evt){
  var files=evt.target.files;
  if(!files||!files.length)return;
  if(files.length===1){
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var data=parseErgoCSV(e.target.result);
        if(!data){showErrorToast('Δεν βρέθηκαν αναγνωρίσιμα δεδομένα στο CSV.');return;}
        applyErgoCSVData(data);
      }catch(err){showErrorToast('Σφάλμα ανάγνωσης CSV: '+err.message);}
      evt.target.value='';
    };
    reader.readAsText(files[0],'UTF-8');
    return;
  }
  // ✅ Batch import — multiple older CSVs at once, merged into history by Test Date
  var texts=new Array(files.length);
  var pending=files.length;
  Array.prototype.forEach.call(files,function(file,i){
    var r=new FileReader();
    r.onload=function(e){texts[i]=e.target.result;if(--pending===0)finishBatchErgoImport(texts);};
    r.onerror=function(){if(--pending===0)finishBatchErgoImport(texts);};
    r.readAsText(file,'UTF-8');
  });
  evt.target.value='';
}

function finishBatchErgoImport(texts){
  var c=getC();if(!c)return;
  var allRows=[];
  texts.forEach(function(t){if(t)allRows=allRows.concat(parseErgoCSVRows(t));});
  if(!allRows.length){showErrorToast('Δεν βρέθηκαν αναγνωρίσιμα δεδομένα στα CSV.');return;}
  var byDate={};
  allRows.forEach(function(r){byDate[r.testDate]=r;}); // later file wins on same date
  var rows=Object.keys(byDate).map(function(d){return byDate[d];}).sort(function(a,b){return a.testDate<b.testDate?-1:1;});

  if(!c.weightLog)c.weightLog=[];
  var existingDates={};
  c.weightLog.forEach(function(e){existingDates[e.date]=true;});
  var toAdd=rows.filter(function(r){return !existingDates[r.testDate];});
  var skipped=rows.length-toAdd.length;
  if(!toAdd.length){showErrorToast('Όλες οι ημερομηνίες υπάρχουν ήδη στο ιστορικό ('+skipped+' παραλείφθηκαν).');return;}

  var summary=toAdd.map(function(r){return r.testDate+' — '+r.weight+'kg';}).join('\n');
  var msg='Θα προστεθούν '+toAdd.length+' μετρήσεις στο ιστορικό (ταξινομημένες κατά ημερομηνία):\n\n'+summary
    +(skipped?'\n\n('+skipped+' παραλείφθηκαν — υπάρχουν ήδη ίδιες ημερομηνίες στο ιστορικό)':'')
    +'\n\nΣυνέχεια;';
  showConfirmDialog(msg, function(){
    var profileChanged=false;
    var withHeight=rows.filter(function(r){return r.height!=null;})[0];
    if(withHeight&&!c.height){c.height=withHeight.height;profileChanged=true;}
    var withDob=rows.filter(function(r){return r.birthDate;})[0];
    if(withDob&&!c.birthDate&&!c.age){
      c.birthDate=withDob.birthDate;
      var a0=calcAgeFromBirthdate(withDob.birthDate);
      if(a0!=null)c.age=a0;
      profileChanged=true;
    }

    toAdd.forEach(function(r){
      var age=ageAtDate(c.birthDate||r.birthDate,r.testDate)||c.age||25;
      var fields={tricep:r.tricep||0,subscapular:r.subscapular||0,abdomen:r.abdomen||0,suprailiac:r.suprailiac||0,thigh:r.thigh||0};
      var res=calcSkinfoldBF('jp4',c.sex||'M',age,fields);
      c.weightLog.push({date:r.testDate,weight:r.weight,bf:res.bf||0,waist:0,hip:0,arm:0,sleep:0,energy:0,compliance:0,notes:'',sfProtocol:'jp4',sfFields:fields});
    });
    c.weightLog.sort(function(a,b){return a.date<b.date?-1:1;});

    var latest=c.weightLog[c.weightLog.length-1];
    if(latest.bf>0){c.lbm=+(latest.weight*(1-latest.bf/100)).toFixed(1);c.bf=latest.bf;}
    c.weight=latest.weight;
    profileChanged=true;

    save();
    var s3=document.getElementById('s3');
    if(s3)s3.innerHTML=buildTrackerHtml(c);
    var hEl=document.getElementById('inp-height');if(hEl&&c.height)hEl.value=c.height;
    updateAgeDisplay();

    showSuccessToast('✅ Προστέθηκαν '+toAdd.length+' μετρήσεις στο ιστορικό.'+(skipped?' ('+skipped+' παραλείφθηκαν λόγω ίδιας ημερομηνίας)':''));
  }, {confirmLabel:'Προσθήκη'});
}

function addWeightEntry(){
  var c=getC();if(!c)return;
  if(!c.weightLog)c.weightLog=[];
  var date=document.getElementById('tr-date').value;
  var weight=parseFloat(document.getElementById('tr-weight').value);
  var bf=parseFloat(document.getElementById('tr-bf').value)||0;
  var waist=parseFloat((document.getElementById('tr-waist')||{}).value)||0;
  var hip=parseFloat((document.getElementById('tr-hip')||{}).value)||0;
  var arm=parseFloat((document.getElementById('tr-arm')||{}).value)||0;
  var sleep=parseInt((document.getElementById('tr-sleep')||{}).value)||0;
  var energy=parseInt((document.getElementById('tr-energy')||{}).value)||0;
  var compliance=parseInt((document.getElementById('tr-compliance')||{}).value)||0;
  var notes=(document.getElementById('tr-notes').value||'').trim();
  if(!date||!weight||weight<20)return;
  var sfEntry=getSkinfoldEntry();
  var entry={date:date,weight:weight,bf:bf,waist:waist,hip:hip,arm:arm,sleep:sleep,energy:energy,compliance:compliance,notes:notes};
  if(sfEntry){entry.sfProtocol=sfEntry.protocol;entry.sfFields=sfEntry.fields;}
  c.weightLog.push(entry);
  c.weightLog.sort(function(a,b){return a.date<b.date?-1:1;});
  // Auto-update LBM + profile BF% if body fat was entered
  if(bf>0){c.lbm=+(weight*(1-bf/100)).toFixed(1);c.bf=bf;c.weight=weight;}
  // Sync weight even if no BF%
  if(weight>0)c.weight=weight;
  save();
  var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
}

function removeWeightEntry(idx){
  var c=getC();if(!c||!c.weightLog)return;
  c.weightLog.splice(idx,1);
  save();
  var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
}

function addConsultEntry(){
  var c=getC();if(!c)return;
  if(!c.consultLog)c.consultLog=[];
  var date=document.getElementById('cons-date').value;
  var notes=(document.getElementById('cons-notes').value||'').trim();
  if(!date||!notes)return;
  c.consultLog.push({date:date,notes:notes,weight:c.weight||null});
  c.consultLog.sort(function(a,b){return a.date<b.date?-1:1;});
  save();
  var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
}

function removeConsultEntry(idx){
  var c=getC();if(!c||!c.consultLog)return;
  c.consultLog.splice(idx,1);
  save();
  var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
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

function excludeSupp(id,timing){
  var c=getC();if(!c)return;
  if(!c.suppExclude)c.suppExclude=[];
  var key=id+'|'+timing;
  var idx=c.suppExclude.indexOf(key);
  if(idx>-1)c.suppExclude.splice(idx,1);
  else c.suppExclude.push(key);
  renderSuppNotes();
}

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

function applyFoodExclusions(tmplDays,excludeList,allergyList){
  if((!excludeList||!excludeList.length)&&(!allergyList||!allergyList.length))return tmplDays;
  var result=deepClone(tmplDays);
  result.forEach(function(meals){
    meals.forEach(function(meal){
      meal.foods=meal.foods.map(function(food){
        // ✅ FIX #2: Check both excludeList AND allergies
        var isExcluded = excludeList && excludeList.indexOf(food.n) !== -1;
        var isAllergy = isFoodAllergy(food.n, allergyList);

        if(!isExcluded && !isAllergy) return food;

        // CRITICAL: This food is in the exclusion list OR is an allergy - find a substitute
        var cat=FOODS[food.n]?FOODS[food.n].cat:'';
        var order=SUBST_ORDER[cat]||[cat];
        var sub=null;
        for(var i=0;i<order.length&&!sub;i++){
          var candidates=Object.keys(FOODS).filter(function(n){
            if(!FOODS[n])return false;
            var notExcluded = !excludeList || excludeList.indexOf(n) === -1;
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
    +(hasExcl?'<div class="excl-tags">'+tags+'</div>':'<div style="font-size:10px;color:#bbb;margin-top:2px">Κανένα τρόφιμο αποκλεισμένο — χρησιμοποιούνται όλα</div>')
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

function swTab(n){
  if(n===0){ if(typeof renderHome==='function') renderHome(); return; }
  if(n===5){ if(typeof renderDiets==='function') renderDiets(); return; }
  if(n===6){ if(typeof renderRecipes==='function') renderRecipes(); return; }
  if(n===7){ if(typeof renderClients==='function') renderClients(); return; }
  var t1=document.getElementById('t1');if(t1)t1.classList.toggle('active',n===1);
  var t2=document.getElementById('t2');if(t2)t2.classList.toggle('active',n===2);
  var t3=document.getElementById('t3');if(t3)t3.classList.toggle('active',n===3);
  var t4=document.getElementById('t4');if(t4)t4.classList.toggle('active',n===4);

  // ✅ HIDE ALL PAGES FIRST
  var s1=document.getElementById('s1');if(s1)s1.style.display='none';
  var s2=document.getElementById('s2');if(s2)s2.style.display='none';
  var s3=document.getElementById('s3');if(s3)s3.style.display='none';
  var s4=document.getElementById('s4');if(s4)s4.style.display='none';

  // ✅ THEN SHOW ONLY THE SELECTED PAGE
  if(n===1 && s1)s1.style.display='block';
  if(n===2 && s2)s2.style.display='block';
  // ✅ Rebuild s3 fresh every time it's opened — the client-logs cache can finish loading
  // (refreshClientLogsCache) after this div was first built, and swTab() only ever
  // toggled display before, so a stale (pre-fetch) panel could get stuck showing forever.
  if(n===3 && s3){var _c=getC();if(_c)s3.innerHTML=buildTrackerHtml(_c);s3.style.display='block';}
  if(n===4 && s4)s4.style.display='block';

  // ✅ HIDE FORM SECTIONS EXCEPT IN TAB 1 (Page 1 only - Στοιχεία Πελάτη)
  var sectionIds=['sec-goal','sec-macros','sec-anthropometry','sec-activity','sec-dietary','sec-medical','met-section-wrap'];
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

// ✅ Kept for compatibility with any other caller that still adjusts by a relative delta.
function adjGoalCalories(delta) {
  var c = getC();
  if(!c) return;
  var currentGoal = (typeof c.goal === 'string' && !isNaN(parseInt(c.goal))) ? parseInt(c.goal) : 0;
  setGoalCalories(currentGoal + delta);
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

// ✅ RED-S RISK FLAGGING (NEW)
function flagRedSRisk(status) {
  var c = getC();
  if(!c) return;

  if(status === 'absent') {
    showErrorToast('⚠️ ΚΡΙΤΙΚΗ ΠΡΟΕΙΔΟΠΟΙΗΣΗ:\n\nΗ απουσία εμμήνων κύκλου δείχνει HIGH RED-S RISK!\n\nΣυστάσεις:\n• Αυξήστε τις θερμίδες σταδιακά\n• Μειώστε τον όγκο άσκησης\n• Δείτε ενδοκρινολόγο\n\nΓυναίκες αθλήτριες σε RED-S κίνδυνο δεν θα πρέπει να χάνουν >0.5kg/εβδ');
  }

  console.log('🚨 RED-S Status:', status);
}

// ✅ CURRENT SUPPLEMENTS TRACKER (NEW)
function openCurrentSupplementsTracker() {
  var c = getC();
  if(!c) {
    showErrorToast('Δημιουργήστε πρώτα ένα προφίλ πελάτη');
    return;
  }

  // Create modal for tracking current supplements
  var modal = document.createElement('div');
  modal.id = 'currentSuppsModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1002;';

  var modalContent = document.createElement('div');
  modalContent.style.cssText = 'background:white;padding:20px;border-radius:8px;max-width:500px;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3);';

  var title = document.createElement('h3');
  title.textContent = '✅ Συμπληρώματα που παίρνει ήδη';
  title.style.cssText = 'color:#025857;margin-bottom:15px;';

  var suppList = document.createElement('div');
  suppList.style.cssText = 'display:grid;gap:10px;';

  // Show all available supplements as checkboxes
  SUPPS.forEach(function(supp) {
    var isChecked = (c.currentSupplements || []).some(s => s.id === supp.id);

    var label = document.createElement('label');
    label.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px;background:#f5f5f5;border-radius:4px;cursor:pointer;';

    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isChecked;
    checkbox.style.cssText = 'cursor:pointer;width:18px;height:18px;';

    checkbox.onchange = function() {
      if(!c.currentSupplements) c.currentSupplements = [];

      if(this.checked) {
        // Add supplement
        if(!c.currentSupplements.find(s => s.id === supp.id)) {
          c.currentSupplements.push({id: supp.id, name: supp.name});
        }
      } else {
        // Remove supplement
        c.currentSupplements = c.currentSupplements.filter(s => s.id !== supp.id);
      }

      saveNow();
      updateCurrentSuppsPreview();
    };

    var text = document.createElement('span');
    text.textContent = supp.name;
    text.style.cssText = 'font-size:13px;';

    label.appendChild(checkbox);
    label.appendChild(text);
    suppList.appendChild(label);
  });

  var closeBtn = document.createElement('button');
  closeBtn.textContent = '✓ Κλείσιμο';
  closeBtn.style.cssText = 'width:100%;padding:12px;background:#025857;color:white;border:none;border-radius:4px;cursor:pointer;margin-top:15px;font-weight:bold;';
  closeBtn.onclick = function() {
    document.body.removeChild(modal);
  };

  modalContent.appendChild(title);
  modalContent.appendChild(suppList);
  modalContent.appendChild(closeBtn);

  modal.appendChild(modalContent);
  modal.onclick = function(e) {
    if(e.target === this) document.body.removeChild(this);
  };

  document.body.appendChild(modal);
}

// ✅ UPDATE CURRENT SUPPLEMENTS PREVIEW
function updateCurrentSuppsPreview() {
  var c = getC();
  var preview = document.getElementById('current-supp-preview');

  if(!preview || !c) return;

  if((c.currentSupplements || []).length > 0) {
    var names = c.currentSupplements.map(s => s.name).slice(0, 3).join(', ');
    var suffix = c.currentSupplements.length > 3 ? '...' : '';
    preview.textContent = '✓ ' + names + suffix;
  } else {
    preview.textContent = '💡 Κάνε κλικ για να εισάγεις συμπληρώματα που παίρνει';
  }
}

// ✅ Calculate age (in years) from a birth-date string (YYYY-MM-DD)
function calcAgeFromBirthdate(birthDate){
  if(!birthDate)return null;
  var b=new Date(birthDate);if(isNaN(b.getTime()))return null;
  var t=new Date();
  var a=t.getFullYear()-b.getFullYear();
  var m=t.getMonth()-b.getMonth();
  if(m<0||(m===0&&t.getDate()<b.getDate()))a--;
  return (a>=0&&a<=150)?a:null;
}

// ✅ Read the single native date input (already ISO "YYYY-MM-DD", same format c.birthDate
// is stored in — no assembly needed), save it, recalc age. Replaces the old 3-dropdown
// (day/month/year) version: same data, one field instead of three.
function commitBirthdate(c){
  var el=document.getElementById('inp-birthdate');
  if(!el)return;
  if(el.value){
    c.birthDate=el.value;
    var a=calcAgeFromBirthdate(c.birthDate);
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
  var a=c.birthDate?calcAgeFromBirthdate(c.birthDate):c.age;
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
var SEC_FOR_ERROR={
  name_required:'basic', name_short:'basic', name_long:'basic',
  age_required:'basic', age_invalid:'basic', sex_required:'basic',
  activity_required:'sport',
  macros_invalid:'macros'
};
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
  var criticalFields = ['name', 'age', 'weight', 'height'];
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
  if(window.undoRedoManager && typeof UpdateClientCommand !== 'undefined' && k !== 'name' && oldValue !== v){
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
  // formula/lbm changes need full re-render to update formula tag + LBM field visibility
  if(k==='formula'||k==='lbm'){renderMain();return;}
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
    var eaTxt='⚡ Energy Availability: <b>'+t.ea+' kcal/kgLBM</b> &nbsp;'+(t.ea<30?'🔴 Κίνδυνος RED-S — ανεπαρκής ενεργειακή διαθεσιμότητα':t.ea<45?'🟡 Οριακή EA — παρακολούθηση απαραίτητη':'🟢 Φυσιολογική EA');
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
      // Έλεγχος αν υπάρχει ήδη υδατάνθρακας (δημητριακά ή πατάτα)
      var hasCarb=meal.foods.some(function(f){
        if(f.n==='Πατάτες')return true;
        return FOODS[f.n]&&FOODS[f.n].cat==='Δημητριακά';
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
        var nutsVariety=['Αμύγδαλα','Καρύδια','Φιστίκια','Κομπόστα σταφίδας'];
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
      // Ελέγχουμε αν υπάρχουν τόσο όσπρια όσο και άλλο άμυλο στο γεύμα
      var hasLegume=false, legumeName='', legumeGrams=0;
      var hasOtherStarch=false, starchNames=[];

      meal.foods.forEach(function(f){
        if(LEGUME_FOODS_LST.indexOf(f.n)!==-1){
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

        // Προσθέτουμε φέτα (30-50g) αν δεν υπάρχει
        var hasDairy=meal.foods.some(function(f){return f.n==='Τυρί φέτα';});
        if(!hasDairy){
          meal.foods.push({n:'Τυρί φέτα',g:40});
        }

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
      // Ελέγχουμε αν υπάρχουν τόσο όσπρια όσο και γαλακτοκομικό
      var hasLegume=false, legumeName='', legumeFoods=[];
      var hasDairy=false, dairyNames=[];

      meal.foods.forEach(function(f){
        if(LEGUME_FOODS_LST.indexOf(f.n)!==-1){
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
      if(meal.foods.some(function(f){return LEGUME_FOODS_LST.indexOf(f.n)!==-1;})){
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


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
    if(window.Cloud && typeof window.Cloud.refreshIntakeStatuses==='function') window.Cloud.refreshIntakeStatuses();
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


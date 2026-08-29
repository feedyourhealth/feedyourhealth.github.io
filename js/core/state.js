// js/core/state.js
// Client roster + selection state and everything that hangs directly off it, extracted
// from js/app-part1.js (module split wave 6). clients/curId/currentDD, JSON_CACHE,
// TOUCH_HANDLERS + MOBILE_VIEWPORT (+ orientationchange/touchmove listeners), PERF_METRICS,
// field-validation (FIELD_VALIDATION_RULES / VALIDATION_MESSAGES_GR / validateClientData /
// showValidationErrors / showErrorToast), toggleSidebar (+ its load handler), the client
// CRUD (addClient / deleteClient / restoreClient / archiveClient / unarchiveClient /
// permanentlyDeleteClient / selectClient) and getC.
// Loads after core/templates.js, before app-part1.js. Refs to renderSB / UndoRedoManager /
// CreateClientCommand etc. are runtime-only or typeof/window-guarded.

var clients=[],curId=null,currentDD=null;

// ✅ PERFORMANCE: JSON CACHE - Cache parsed JSON to avoid repeated parsing
var JSON_CACHE={
  storage: {},
  maxSize: 100,

  set: function(key, obj){
    if(Object.keys(this.storage).length >= this.maxSize){
      delete this.storage[Object.keys(this.storage)[0]];
    }
    this.storage[key] = obj;
  },

  get: function(key){
    return this.storage[key];
  },

  parseAndCache: function(jsonStr, key){
    if(!jsonStr) return null;
    var cached = this.get(key);
    if(cached) return cached;
    try {
      var parsed = JSON.parse(jsonStr);
      if(key) this.set(key, parsed);
      return parsed;
    } catch(e) {
      console.error('[CACHE] JSON parse error for key:', key, e);
      return null;
    }
  },

  clear: function(){
    this.storage = {};
  }
};

// ✅ MOBILE: Touch event handling
var TOUCH_HANDLERS={
  // Detect if device is touch-capable
  isTouchDevice: function(){
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
  },

  // Initialize touch handlers
  init: function(){
    if(!this.isTouchDevice()) return;

    // Add touch-friendly feedback to buttons
    document.addEventListener('touchstart', function(e){
      var el = e.target.closest('button, .btn, input[type="button"]');
      if(el){
        el.style.opacity = '0.8';
        el.style.transform = 'scale(0.95)';
      }
    }, {passive: true});

    document.addEventListener('touchend', function(e){
      var el = e.target.closest('button, .btn, input[type="button"]');
      if(el){
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
      }
    }, {passive: true});

    console.log('✅ Touch handlers initialized');
  }
};

// ✅ MOBILE: Viewport optimization
var MOBILE_VIEWPORT={
  isMobile: function(){
    return window.innerWidth <= 767;
  },

  isSmallPhone: function(){
    return window.innerWidth <= 479;
  },

  isTablet: function(){
    return window.innerWidth >= 768 && window.innerWidth <= 1024;
  },

  onResize: function(){
    // Adjust layout on resize
    if(this.isMobile()){
      console.log('📱 Mobile layout');
    } else if(this.isTablet()){
      console.log('📱 Tablet layout');
    } else {
      console.log('🖥️ Desktop layout');
    }
  }
};

// Listen for orientation changes
window.addEventListener('orientationchange', function(){
  MOBILE_VIEWPORT.onResize();
  PERF_METRICS.startRender();
  setTimeout(function(){ PERF_METRICS.endRender(); }, 100);
}, {passive: true});

// ✅ MOBILE: Prevent rubber-band scroll bounce
document.addEventListener('touchmove', function(e){
  // Allow scroll on specific elements
  var scrollable = e.target.closest('.sb, .main, .week-table');
  if(!scrollable && e.cancelable){
    e.preventDefault();
  }
}, {passive: false});

// ✅ PERFORMANCE MONITORING
var PERF_METRICS={
  renderStart: 0,
  renderEnd: 0,
  saveStart: 0,
  saveEnd: 0,

  startRender: function(){ this.renderStart = performance.now(); },
  endRender: function(){
    this.renderEnd = performance.now();
    var duration = this.renderEnd - this.renderStart;
    if(duration > 100) console.warn('⚠️  Slow render: ' + Math.round(duration) + 'ms');
  },

  startSave: function(){ this.saveStart = performance.now(); },
  endSave: function(){
    this.saveEnd = performance.now();
    var duration = this.saveEnd - this.saveStart;
    if(duration > 50) console.warn('⚠️  Slow save: ' + Math.round(duration) + 'ms');
  }
};

// ✅ PHASE 4: CREATE CLIENT WITH UNDO/REDO
// ✅ PHASE 1: COMPREHENSIVE INPUT VALIDATION
// Named distinctly from the calculation-audit VALIDATION_RULES above (line ~344) —
// both used the same global name, and this one, loading second, silently won and
// broke validateAllCalculations()/logValidation() (rule.validate was undefined).
var FIELD_VALIDATION_RULES = {
  'name': {min: 2, max: 100, required: true, pattern: /^[^\n]{2,100}$/},
  'age': {min: 13, max: 120, required: true},
  'weight': {min: 20, max: 300, required: true},
  'height': {min: 100, max: 250, required: true},
  'activity': {required: true, values: ['sed', 'light', 'mod', 'active', 'vactive']},
  'goal': {required: true, values: ['gain', 'loss', 'maint']},
  'sex': {required: true, values: ['M', 'F']},
  'formula': {required: true, values: ['mifflin', 'harris', 'cunningham']}
};

var VALIDATION_MESSAGES_GR = {
  'name_required': '⚠️ Παρακαλώ εισάγετε όνομα πελάτη',
  'name_short': '⚠️ Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες',
  'name_long': '⚠️ Το όνομα δεν πρέπει να υπερβαίνει τα 100 χαρακτήρες',
  'age_required': '⚠️ Παρακαλώ εισάγετε ηλικία',
  'age_invalid': '⚠️ Η ηλικία πρέπει να είναι μεταξύ 13-120 ετών',
  'weight_required': '⚠️ Παρακαλώ εισάγετε βάρος',
  'weight_invalid': '⚠️ Το βάρος πρέπει να είναι μεταξύ 20-300 kg',
  'height_required': '⚠️ Παρακαλώ εισάγετε ύψος',
  'height_invalid': '⚠️ Το ύψος πρέπει να είναι μεταξύ 100-250 cm',
  'bf_invalid': '⚠️ Το ποσοστό λίπους πρέπει να είναι μεταξύ 3-60%',
  'activity_required': '⚠️ Παρακαλώ επιλέξτε επίπεδο δραστηριότητας',
  'goal_required': '⚠️ Παρακαλώ επιλέξτε στόχο',
  'sex_required': '⚠️ Παρακαλώ επιλέξτε φύλο',
  'formula_required': '⚠️ Παρακαλώ επιλέξτε τύπο υπολογισμού',
  'macros_invalid': '⚠️ Τα μακροθρεπτικά πρέπει να αθροίζονται σωστά (P+F+C ~= 100%)',
  'tdee_invalid': '⚠️ Οι θερμίδες πρέπει να είναι μεταξύ 1200-5000 kcal',
  'validation_error': '❌ Σφάλμα επικύρωσης: Ελέγξτε τα δεδομένα'
};

function validateClientData(client) {
  var errors = [];

  // Name validation
  if(!client.name || client.name.trim() === '') {
    errors.push('name_required');
  } else if(client.name.length < 2) {
    errors.push('name_short');
  } else if(client.name.length > 100) {
    errors.push('name_long');
  }

  // Age validation
  if(!client.age) {
    errors.push('age_required');
  } else {
    var age = parseInt(client.age);
    if(isNaN(age) || age < 13 || age > 120) {
      errors.push('age_invalid');
    }
  }

  // Weight validation
  if(!client.weight) {
    errors.push('weight_required');
  } else {
    var weight = parseFloat(client.weight);
    if(isNaN(weight) || weight < 20 || weight > 300) {
      errors.push('weight_invalid');
    }
  }

  // Height validation
  if(!client.height) {
    errors.push('height_required');
  } else {
    var height = parseFloat(client.height);
    if(isNaN(height) || height < 100 || height > 250) {
      errors.push('height_invalid');
    }
  }

  // Body-fat % validation — optional field, but if entered it must be in the range calcTDEE()
  // actually clamps to (3-60); previously an out-of-range value like 95 saved silently and only
  // got clamped invisibly at calc time, with no indication to the dietitian (audit finding Ε2).
  // ✅ 2026-08-01 fix: addClient() defaults new clients to bf:0, and the old `!==undefined &&
  // !==null && !==''` guard treated that untouched 0 as "entered", so bf_invalid fired on every
  // brand-new client's very first "Δημιουργία πλάνου" before they'd ever touched this field
  // (confirmed live). 0 is never a real entered value here — bf is always ≥3 physiologically —
  // and every other bf read in this codebase already treats bf<=0 as "not set" (`c.bf>0`,
  // `c.bf||0`, etc.), so a plain truthy check matches existing convention.
  if(client.bf) {
    var bf = parseFloat(client.bf);
    if(isNaN(bf) || bf < 3 || bf > 60) {
      errors.push('bf_invalid');
    }
  }

  // Activity validation
  if(!client.activity) {
    errors.push('activity_required');
  }

  // Goal validation
  if(!client.goal) {
    errors.push('goal_required');
  }

  // Sex validation
  if(!client.sex) {
    errors.push('sex_required');
  }

  // Macros validation (if plan exists)
  if(client.macroP || client.macroF || client.macroC) {
    var totalMacro = (client.macroP || 0) + (client.macroF || 0) + (client.macroC || 0);
    if(totalMacro < 90 || totalMacro > 110) {
      errors.push('macros_invalid');
    }
    // ✅ Το άθροισμα μπορεί να είναι 90-110% ενώ ΠΡΩΤΕΪΝΗ%+ΛΙΠΟΣ% μόνα τους ξεπερνούν το 100%
    // (π.χ. Π=70%,Λ=40%,Υ=0% → άθροισμα 110, περνάει τον παραπάνω έλεγχο) — αυτό παράγει ΑΡΝΗΤΙΚΟΥΣ
    // υδατάνθρακες στο calcTDEE (carbG=(target-protG*4-fatG*9)/4). Ελέγχουμε αυτό ξεχωριστά.
    if(((client.macroP || 0) + (client.macroF || 0)) > 100) {
      errors.push('macros_invalid');
    }
  }

  return errors;
}

function showValidationErrors(errors) {
  if(errors.length === 0) return true;

  if(typeof revealSectionsForErrors==='function') revealSectionsForErrors(errors);
  // ✅ 2026-08-01: scroll to + briefly highlight the first offending field, instead of leaving the
  // dietitian to hunt for it after just reading the toast message (see scrollToAndHighlightField,
  // js/app-part2.js, for why).
  if(typeof scrollToAndHighlightField==='function') scrollToAndHighlightField(errors);

  var message = 'Παρακαλώ διορθώστε τα εξής σφάλματα:\n\n';
  errors.forEach(function(err) {
    message += '• ' + (VALIDATION_MESSAGES_GR[err] || err) + '\n';
  });

  showErrorToast(message);
  console.warn('Validation errors:', errors);
  return false;
}

function showErrorToast(message) {
  var errorToast = document.getElementById('errorToast');
  if(!errorToast) {
    errorToast = document.createElement('div');
    errorToast.id = 'errorToast';
    errorToast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#c62828;color:white;padding:14px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.25);z-index:9999;font-weight:600;font-size:14px;animation:slideIn 0.3s ease-out;white-space:pre-line;max-width:320px;';
    document.body.appendChild(errorToast);
  }

  errorToast.textContent = message;
  errorToast.style.display = 'block';

  clearTimeout(errorToast._hideTimer);
  errorToast._hideTimer = setTimeout(function() {
    errorToast.style.display = 'none';
  }, 7000);
}

// ✅ Toggle Sidebar (Collapsible)
function toggleSidebar(){
  var sidebar = document.getElementById('sidebar');
  if(sidebar){
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
}

// Restore sidebar state on load
window.addEventListener('load', function(){
  var isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
  if(isCollapsed){
    var sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.add('collapsed');
  }
});

function addClient(prefillName){
  try {
    var id='c'+Date.now();
    var newClient={id:id,name:(prefillName||'').trim(),sex:'',age:null,weight:null,height:null,bf:0,leanmass:0,activity:'',goal:'',formula:'mifflin',lbm:0,trainDays:[false,false,false,false,false,false,false],trainHoursByDay:[1,1,1,1,1,1,1],trainTimesByDay:['','','','','','',''],matchDays:[false,false,false,false,false,false,false],matchTimeBucket:'απόγευμα',carbBoost:20,trainHoursPerDay:1,metActivities:[],weekPlan:{},dayTargets:null,supps:[],suppExclude:[],macroPreset:'balanced',macroP:25,macroF:25,macroC:50,weightLog:[],consultLog:[],selectedTemplate:null,foodExclude:[],dietType:'normal',lastAccess:Date.now()};

    if(window.undoRedoManager && typeof CreateClientCommand !== 'undefined'){
      var cmd = new CreateClientCommand(newClient);
      window.undoRedoManager.execute(cmd);
    } else {
      clients.push(newClient);
      upd(); // Save to localStorage
    }

    selectClient(id);
    showSuccessToast('✅ Νέος πελάτης προστέθηκε!');
    console.log('✅ Συνολικοί πελάτες:', clients.length);
  } catch(e) {
    console.error('❌ Σφάλμα στη δημιουργία πελάτη:', e.message);
    console.error('Stack:', e.stack);
    showErrorToast('❌ Σφάλμα: ' + e.message);
  }
}

// ✅ PHASE 4: DELETE CLIENT WITH UNDO/REDO
function deleteClient(id){
  var clientToDelete = clients.find(function(c){return c.id===id;});
  if(!clientToDelete) return;

  if(window.undoRedoManager && typeof DeleteClientCommand !== 'undefined'){
    var cmd = new DeleteClientCommand(clientToDelete);
    window.undoRedoManager.execute(cmd);
  } else {
    // ✅ SOFT DELETE: Mark as deleted instead of removing
    clientToDelete.deleted = true;
    clientToDelete.deletedAt = new Date().toISOString();

    if(curId===id){
      curId=null;
      if(typeof renderHome==='function') renderHome();
    }

    save();
    renderSB();
  }
}

function restoreClient(id){
  var clientToRestore = clients.find(function(c){return c.id===id;});
  if(!clientToRestore) return;

  // ✅ RESTORE: Unmark as deleted
  clientToRestore.deleted = false;
  delete clientToRestore.deletedAt;

  // This manual restore bypasses the undo/redo command system, so purge any
  // DeleteClientCommand for this client from the history — otherwise a later
  // redo (Ctrl+Y) could silently re-delete the client we just restored.
  if(window.undoRedoManager && typeof DeleteClientCommand !== 'undefined'){
    var mgr = window.undoRedoManager;
    var removedUpToIndex = 0;
    mgr.history = mgr.history.filter(function(cmd, idx){
      var isMatch = (cmd instanceof DeleteClientCommand) && cmd.client === clientToRestore;
      if(isMatch && idx <= mgr.currentIndex) removedUpToIndex++;
      return !isMatch;
    });
    mgr.currentIndex -= removedUpToIndex;
    if(typeof updateUndoRedoUI==='function') updateUndoRedoUI();
  }

  save();
  renderSB();
}

// ✅ ARCHIVE: separate from soft-delete — hides a client from the active list without marking it for deletion
function archiveClient(id){
  var c = clients.find(function(x){return x.id===id;});
  if(!c) return;
  c.archived = true;
  c.archivedAt = new Date().toISOString();

  if(curId===id){
    curId=null;
    if(typeof renderHome==='function') renderHome();
  }

  save();
  renderSB();
}

function unarchiveClient(id){
  var c = clients.find(function(x){return x.id===id;});
  if(!c) return;
  c.archived = false;
  delete c.archivedAt;

  save();
  renderSB();
}

function permanentlyDeleteClient(id){
  showConfirmDialog('Διαγραφή ΜΟΝΙΜΑ; Δεν θα μπορείς να ανακτήσεις τα δεδομένα!', function(){
    // ✅ HARD DELETE: Permanently remove
    clients = clients.filter(function(c){return c.id!==id;});

    if(curId===id){
      curId=null;
      if(typeof renderHome==='function') renderHome();
    }

    save();
    renderSB();
  }, {confirmLabel:'Μόνιμη διαγραφή'});
}
function selectClient(id){
  try {
    curId=id;
    window._activeMealTarget=null; // δεν έχει νόημα το target ενός πελάτη σε άλλον πελάτη
    // ✅ Update lastAccess timestamp for sorting
    var c=clients.find(function(x){return x.id===id;});
    if(c){
      c.lastAccess=Date.now();
      save(); // Save the lastAccess update
    }

    var tb=document.getElementById('tmpl-sb-btn');
    if(tb) tb.classList.remove('active');

    renderSB();
    renderMain();

    // Show first tab (client details)
    swTab(1);

    // Hide FAB menu
    var fabMenu = document.getElementById('fab-menu');
    if(fabMenu) fabMenu.style.display = 'none';
  } catch(e) {
    console.error('❌ Σφάλμα στη επιλογή πελάτη:', e.message);
    console.error('Stack:', e.stack);
    console.error('Full error:', e);
    // showErrorToast('❌ Σφάλμα φόρτωσης στοιχείων: ' + e.message);
  }
}
function getC(){return clients.filter(function(c){return c.id===curId;})[0];}

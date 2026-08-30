// ── Cloud Integration: legacy localStorage key prefix ─────────────────────────────────────────────
// cloudUsername/getStorageKey were fed by a postMessage('CLOUD_USER', ...) listener from the old
// app_wrapper.html iframe prototype (deleted 2026-07-03, see [[dietologist-cloud-supabase]] memory —
// real auth is Supabase now, window.Cloud). Nothing in the app ever sends that postMessage anymore,
// so cloudUsername was always null in practice; the listener + its loadCloudData() re-load (which
// reassigned the whole global `clients` array with no re-validation of curId/open client — a real
// stale-object race if it ever DID fire) were removed 2026-07-10 as confirmed-dead code. getStorageKey
// itself is kept since safeStorageGet/safeStorageSet (js/app-part1.js) still call it on every read/write.
var cloudUsername = null;

function getStorageKey(baseKey) {
  if (cloudUsername) {
    return 'cloud_' + cloudUsername + '_' + baseKey;
  }
  return baseKey;
}

// ── Auto-load from localStorage on startup ───────────────────────────────────
(function(){
  // Load custom templates
  var parsedCt = safeStorageGet('fyh_custom_tmpls', null);
  if(Array.isArray(parsedCt)) customTemplates = parsedCt;

  // Load clients data
  var d = safeStorageGet('fyh_clients', null);
  if(Array.isArray(d) && d.length){
    clients = d;
    // Migrate: ensure new fields exist on old client objects
    clients.forEach(function(c){
      if(!c.metActivities)c.metActivities=[];
      if(!c.weightLog)c.weightLog=[];
      if(!c.consultLog)c.consultLog=[];
      migrateClientSkinfoldBF(c);
      if(c.macroP==null)c.macroP=25;
      if(c.macroF==null)c.macroF=25;
      if(c.macroC==null)c.macroC=50;
      if(!c.macroPreset)c.macroPreset='balanced';
      if(!c.suppExclude)c.suppExclude=[];
      if(!c.foodExclude)c.foodExclude=[];
      if(c.selectedTemplate===undefined)c.selectedTemplate=null;
      // ✅ keep the denormalised c.age cache in step with birthDate on load — see the same
      // refresh in selectClient (js/core/state.js). Covers the roster list + any boot-time
      // calc before the client is opened.
      if(c.birthDate && typeof ageAtDate==='function'){ var _ca=ageAtDate(c.birthDate); if(_ca!=null)c.age=_ca; }
    });
    if(typeof mergeDuplicateGroupNames==='function') mergeDuplicateGroupNames(clients);
    renderSB();
  }
})();


// Regenerate plan with tracking
function regeneratePlan(){
  var c=getC();
  if(!c || !TRACKING_DATA.plans.length)return;
  var errors=validateClientData(c);
  if(errors.length>0){ showValidationErrors(errors); return; }
  pregnancyBlockCheck(c, function(){
    showConfirmDialog('Αναδημιουργία ολόκληρου του εβδομαδιαίου πλάνου; Όλες οι μέρες θα αντικατασταθούν.', function(){
      // Find and mark the last plan as regenerated (negative signal)
      var lastPlanIndex = TRACKING_DATA.plans.length - 1;
      logRegenerate(lastPlanIndex);

      // Generate new plan (through undo/redo so this regeneration can be undone too)
      var oldPlan = deepClone(c.weekPlan);
      if(window.undoRedoManager && typeof GeneratePlanCommand !== 'undefined'){
        var cmd = new GeneratePlanCommand(c, oldPlan);
        window.undoRedoManager.execute(cmd);
      } else {
        genPlan();
      }
      showErrorToast('Το σχέδιο δημιουργήθηκε ξανά. Το σύστημα θα μάθει από αυτό!');
    }, {icon:'🔄', confirmLabel:'Αναδημιουργία'});
  });
}

// Initialize tracking on page load
/* ---- Backup Import via Button (works with file:// protocol) ---- */
function importBackup(){
  var inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json';
  inp.style.display = 'none';
  inp.onchange = function(event){
    var f = inp.files[0];
    if(!f) return;
    // Remove from DOM after selection
    setTimeout(function(){if(inp.parentNode) inp.parentNode.removeChild(inp);}, 0);
    var r = new FileReader();
    r.onload = function(e){
      var data;
      try{
        data = JSON.parse(e.target.result);
        if(!data.clients || !Array.isArray(data.clients)){
          showErrorToast('Λάθος format αρχείου!');
          return;
        }
      }catch(ex){
        showErrorToast('Σφάλμα: ' + ex.message);
        return;
      }

      var incoming = data.clients.length;
      var existing = clients.length;

      function finish(){
        curId = null;
        saveNow();
        renderSB();
        showSuccessToast('✅ Εισαγωγή επιτυχής! ' + clients.length + ' πελάτες φορτώθηκαν.');
      }
      function doMerge(){
        var existingIds = clients.map(function(c){return c.id;});
        var toAdd = data.clients.filter(function(c){return existingIds.indexOf(c.id) < 0;});
        clients = clients.concat(toAdd);
        if(Array.isArray(data.savedCombos) && data.savedCombos.length){
          setSavedCombos(mergeSavedComboLists(getSavedCombos(), data.savedCombos));
        }
        finish();
      }
      function doReplace(){
        clients = data.clients;
        // Only overwrite if this backup actually has combos — an older backup (from before
        // combos got their own key) shouldn't wipe out combos saved since then.
        if(Array.isArray(data.savedCombos)) setSavedCombos(data.savedCombos);
        finish();
      }

      if(existing > 0){
        showConfirmDialog(
          'Βρέθηκαν ' + incoming + ' πελάτες, υπάρχουν ήδη ' + existing + '.',
          doMerge,
          {title:'Συγχώνευση ή αντικατάσταση;', icon:'📥', confirmLabel:'Συγχώνευση ('+(existing+incoming)+')', secondary:{label:'Αντικατάσταση', onClick:doReplace}}
        );
      } else {
        doMerge();
      }
    };
    r.readAsText(f);
  };
  // Add to DOM and click to open file picker
  document.body.appendChild(inp);
  inp.click();
}

window.addEventListener('load', function(){
  loadTrackingData();
  // Start auto-backup system
  setTimeout(initAutoBackup, 2000); // Wait 2 seconds to ensure data is fully loaded
});

// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// INITIALIZE APP ON LOAD
// ══════════════════════════════════════════════════════════════════════════════
window.addEventListener('load', function(){
  console.log('=== PAGE LOAD STARTED ===');
  console.log('genPlan defined?', typeof genPlan);
  console.log('getC defined?', typeof getC);
  console.log('calcTDEE defined?', typeof calcTDEE);
  console.log('allocateMealTargets defined?', typeof allocateMealTargets);

  loadTrackingData();  // Load tracking data from localStorage
  initializeApp();     // Show login or app based on whether clients exist

  // ✅ PHASE 3: INITIALIZE MOBILE OPTIMIZATIONS
  TOUCH_HANDLERS.init();
  MOBILE_VIEWPORT.onResize();
  console.log('✅ Mobile optimizations initialized');

  // ✅ PHASE 4: INITIALIZE UNDO/REDO SYSTEM
  setTimeout(function(){
    if(typeof UndoRedoManager !== 'undefined' && !window.undoRedoManager){
      window.undoRedoManager = new UndoRedoManager();
      console.log('✅ UndoRedoManager initialized');

      // Setup keyboard shortcuts
      document.addEventListener('keydown', function(e){
        if((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey){
          e.preventDefault();
          undo();
        }
        if((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))){
          e.preventDefault();
          redo();
        }
      });
      console.log('✅ Keyboard shortcuts registered (Ctrl+Z, Ctrl+Y)');
      updateUndoRedoUI();
    }
  }, 500);

  console.log('=== PAGE LOAD COMPLETE ===');
});

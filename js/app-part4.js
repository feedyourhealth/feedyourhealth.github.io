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
    });
    if(typeof mergeDuplicateGroupNames==='function') mergeDuplicateGroupNames(clients);
    renderSB();
  }
})();


// Identify red meat recipes
function isRedMeat(mealName, mealFoods){
  if(!mealName || !mealFoods)return false;

  var redMeatKeywords = ['Μοσχάρι','Αρνί','Χοιρινό','Κιμάς','Beef','Lamb','Pork'];
  var mealStr = mealName + ' ' + JSON.stringify(mealFoods);

  return redMeatKeywords.some(function(keyword){
    return mealStr.includes(keyword);
  });
}

// Check and enforce red meat frequency (MAX 2x/week)
function enforceRedMeatFrequency(weekPlan, excl, dietType){
  var redMeatCount = 0;
  var redMeatMeals = [];
  excl = excl || [];

  // Count red meat meals
  for(var d=0;d<7;d++){
    if(weekPlan[d]){
      for(var mi=0;mi<weekPlan[d].length;mi++){
        var meal = weekPlan[d][mi];
        if(isRedMeat(meal.name, meal.foods)){
          redMeatCount++;
          redMeatMeals.push({day:d, index:mi, mealName:meal.name});
        }
      }
    }
  }

  // If > 2, replace excess with chicken/fish alternatives (respecting exclusions)
  if(redMeatCount > 2){
    var excessCount = redMeatCount - 2;
    var replacedCount = 0;

    // Replace from the last red meat meals backwards
    for(var i=redMeatMeals.length-1; i>=0 && replacedCount<excessCount; i--){
      var mealLoc = redMeatMeals[i];
      var meal = weekPlan[mealLoc.day][mealLoc.index];

      // meal.kcal isn't a stored field on weekPlan meal objects — compute it from the actual foods,
      // otherwise findBestRecipe's calorie-match compares against undefined (NaN) and never matches anything.
      var mealKcal = (meal.foods||[]).reduce(function(sum,f){ return sum + cm(f.n,f.g).k; }, 0);

      // Find alternative chicken or fish recipe with similar calories, respecting exclusions.
      // MUST use the client's actual dietType, not a hardcoded 'normal' — otherwise a keto client
      // (who legitimately eats red meat >2x/week; this cap is a general cardiovascular guideline,
      // not a keto rule) gets "fixed" straight out of ketosis with a high-carb normal-diet recipe
      // (confirmed live: swapped in a 62g-carb shrimp-orzo dish and a 39g-carb pita souvlaki).
      var altRecipe = findBestRecipe(dietType||'normal', mealKcal, meal.name, excl);
      if(altRecipe && !isRedMeat(altRecipe.name, altRecipe.foods)){
        meal.foods = altRecipe.foods;
        meal.name = altRecipe.name;
        meal.recipeId = altRecipe.id;
        replacedCount++;
        console.log('Red meat limit: Replaced ' + mealLoc.mealName + ' with ' + altRecipe.name);
      }
    }

    console.log('Red meat frequency: ' + redMeatCount + ' → Max 2. Replaced ' + replacedCount);
  }

  return weekPlan;
}

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

// PART 4: GAP ANALYSIS MODAL INTEGRATION ════════════════════════════════════════

function openGapAnalysisModal(){
  var c = getC();
  if(!c || !c.weekPlan){
    showErrorToast('Δημιουργήστε πρώτα ένα πλάνο');
    return;
  }

  // Run the analysis chain
  var weekAnalysis = getWeekMicronutrients(c.weekPlan);
  var gaps = detectMicronutrientGaps(weekAnalysis, c);
  var recommendations = matchSupplementsToGaps(gaps, SUPPS);

  // Build HTML report
  var html = buildGapAnalysisHTML(gaps, recommendations, weekAnalysis, c);

  // Create/populate modal
  var modal = document.getElementById('gap-analysis-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'gap-analysis-modal';
    modal.className = 'gap-modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = html;
  modal.style.display = 'flex';

  // Close on background click
  modal.addEventListener('click', function(e){
    if(e.target === modal) closeGapAnalysisModal();
  });
}

function buildGapAnalysisHTML(gaps, recommendations, weekAnalysis, c){
  // Header with summary
  var html = '<div class="gap-modal-content">';
  html += '<div class="gap-modal-header">';
  html += '<h2 style="color:#025857;margin:0;">🔬 Ανάλυση Κενών Μικροθρεπτικών & Συμπληρώματα</h2>';
  html += '<button onclick="closeGapAnalysisModal()" style="background:#ff6b35;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;color:white;font-weight:bold;font-size:16px;">✕</button>';
  html += '</div>';

  // Show methodology notes
  var methodologyNote = '📋 Προσαρμογές (Επιστημονικές μελέτες 2024-2025): ';
  var adjustments = [];
  if(c.sport) adjustments.push('🏆 Άθλημα-ειδικές ανάγκες');
  if(c.dietType && (c.dietType==='vegan' || c.dietType==='vegetarian' || c.dietType==='orthodox_fasting')) {
    adjustments.push('🥗 ' + (c.dietType==='vegan' ? 'Vegan' : c.dietType==='vegetarian' ? 'Χορτοφαγικές' : 'Ορθόδοξη Νηστεία') + ' ανάγκες');
  }
  if(c.altitudeTraining) adjustments.push('⛰️ Προπόνηση σε ύψος');
  if(adjustments.length > 0) {
    html += '<div style="background:#e3f2fd;border-left:4px solid #1976d2;padding:10px;margin-bottom:15px;border-radius:4px;font-size:11px;color:#1565C0;">';
    html += methodologyNote + adjustments.join(' + ');
    html += '</div>';
  }

  // Critical gaps section
  if(gaps.filter(function(g){return g.severity==='critical';}).length > 0){
    html += '<div class="gap-section">';
    html += '<h3 style="color:#d32f2f;margin-top:0;">🔴 ΚΡΙΣΙΜΑ ΚΕΝΑ</h3>';
    gaps.filter(function(g){return g.severity==='critical';}).forEach(function(gap){
      html += '<div class="gap-item critical">';
      html += '<span style="flex:1;"><strong>' + gap.nutrient + '</strong>';
      if(gap.supplementRequired) html += ' <span style="background:#d32f2f;color:white;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:bold;margin-left:8px;">⚠️ ΣΥΜΠΛΗΡΩΜΑ</span>';
      html += '</span>';
      html += '<span style="text-align:right;">' + gap.actual.toFixed(1) + ' / ' + gap.target + ' ' + gap.unit + ' (' + gap.percent + '%)</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Low/moderate gaps section
  if(gaps.filter(function(g){return g.severity!=='critical';}).length > 0){
    html += '<div class="gap-section">';
    html += '<h3 style="color:#e65100;margin-top:0;">⚠️ ΕΛΛΕΙΨΕΙΣ</h3>';
    gaps.filter(function(g){return g.severity!=='critical';}).forEach(function(gap){
      html += '<div class="gap-item">';
      html += '<span style="flex:1;"><strong>' + gap.nutrient + '</strong></span>';
      html += '<span style="text-align:right;">' + gap.actual.toFixed(1) + ' / ' + gap.target + ' ' + gap.unit + ' (' + gap.percent + '%)</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Recommended supplements section
  if(recommendations.length > 0){
    html += '<div class="gap-section">';
    html += '<h3 style="color:#1976d2;margin-top:0;">💊 ΣΥΝΙΣΤΩΜΕΝΑ ΣΥΜΠΛΗΡΩΜΑΤΑ</h3>';
    recommendations.forEach(function(rec){
      html += '<div class="supp-rec">';
      html += '<div style="font-weight:bold;color:#1976d2;">' + rec.supplement + ' - ' + rec.recommendedDose + ' ' + rec.unit + '</div>';
      html += '<div style="font-size:12px;color:#666;margin-top:3px;">' + rec.nutrient + ' | ' + rec.reason + '</div>';
      if(rec.timing){
        html += '<div style="font-size:11px;color:#666;margin-top:2px;">⏰ ' + rec.timing.t + '</div>';
      }
      if(rec.interactions && rec.interactions.length > 0){
        html += '<div style="font-size:11px;color:#d32f2f;margin-top:2px;">⚠️ ' + rec.timing_note + ': ' + rec.interactions.join(', ') + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  if(recommendations.length === 0 && gaps.length === 0){
    html += '<div style="text-align:center;padding:40px;color:var(--text-muted);">';
    html += '<p style="font-size:14px;font-weight:bold;">✅ Εξαιρετική κάλυψη!</p>';
    html += '<p>Το πλάνο διατροφής σας καλύπτει τις περισσότερες μικροθρεπτικές σας ανάγκες.</p>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function closeGapAnalysisModal(){
  var modal = document.getElementById('gap-analysis-modal');
  if(modal) modal.style.display = 'none';
}

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

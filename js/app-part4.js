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


/* Recipe Modal Display */
function showRecipeModal(foodName){
  var food=FOODS[foodName];
  var rxModal=(typeof FYH_RECIPE_EXPAND!=='undefined')&&FYH_RECIPE_EXPAND[foodName];
  if((!food||!food.ingredients)&&!rxModal){showErrorToast('Δεν υπάρχουν συστατικά για αυτό το τρόφιμο');return;}

  var modal=document.getElementById('recipe-modal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='recipe-modal';
    modal.className='recipe-modal hidden';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    document.body.appendChild(modal);
  }

  var ingHtml='';
  if(food&&food.ingredients){
    food.ingredients.forEach(function(ing){
      var prep=ing.prep?' <span class="recipe-ingredient-prep">('+ing.prep+')</span>':'';
      var unit=ing.unit?' '+ing.unit:'';
      var size=ing.size?' '+ing.size:'';
      ingHtml+='<div class="recipe-ingredient-row">'
        +'<span class="recipe-ingredient-name">'+ing.item+'</span>'
        +'<span class="recipe-ingredient-qty">'+ing.qty+unit+size+'</span>'
        +prep
        +'</div>';
    });
  } else if(rxModal){
    // FYH/expandable recipe → derive readable list from its ingredients (name + grams)
    rxModal.ing.forEach(function(ing){
      ingHtml+='<div class="recipe-ingredient-row">'
        +'<span class="recipe-ingredient-name">'+ing.n+'</span>'
        +'<span class="recipe-ingredient-qty">'+ing.g+'g</span>'
        +'</div>';
    });
  }

  var timeHtml=(food&&food.time)?'<div class="recipe-time">⏱️ Χρόνος: '+food.time+'</div>':'';

  modal.innerHTML='<div class="recipe-modal-content">'
    +'<div class="recipe-modal-title">'
    +'<span>'+foodName+'</span>'
    +'<button class="recipe-modal-close" onclick="closeRecipeModal()">&times;</button>'
    +'</div>'
    +'<div class="recipe-ingredients">'+ingHtml+'</div>'
    +timeHtml
    +'</div>';

  modal.classList.remove('hidden');
  modal.addEventListener('click',function(e){
    if(e.target===modal)closeRecipeModal();
  });
}

function closeRecipeModal(){
  var modal=document.getElementById('recipe-modal');
  if(modal)modal.classList.add('hidden');
}

/* Micronutrients Modal */
function openMicroModal(){
  var c=getC();
  if(!c||!c.weekPlan){
    showErrorToast('Δημιουργήστε πρώτα ένα πλάνο');
    return;
  }

  var modal=document.getElementById('micro-modal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='micro-modal';
    modal.className='micro-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    document.body.appendChild(modal);
  }

  var microHtml=getMicronutrientHtml(c);
  modal.innerHTML='<div class="micro-modal-content">'
    +'<div class="micro-modal-header">'
    +'<h2 style="margin:0;color:#025857;">📊 Μικροθρεπτικά & Κρίσιμες Στόχοι</h2>'
    +'<button onclick="closeMicroModal()" style="background:#ff6b35;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;color:white;font-weight:bold;font-size:14px;padding:8px 12px;">✕ Κλείσιμο</button>'
    +'</div>'
    +'<div id="micro-modal-content" style="overflow-y:auto;max-height:calc(85vh - 80px);">'+microHtml+'</div>'
    +'</div>';

  modal.style.display='flex';
  modal.addEventListener('click',function(e){
    if(e.target===modal)closeMicroModal();
  });
}

function closeMicroModal(){
  var modal=document.getElementById('micro-modal');
  if(modal)modal.style.display='none';
}

/* Toggle supplement checkbox - custom checkbox handler */
function toggleSuppCheckbox(containerEl){
  var suppId=containerEl.getAttribute('data-supp-id');
  var checkbox=document.getElementById(suppId);
  if(!checkbox)return;

  // Toggle the checkbox
  checkbox.checked=!checkbox.checked;

  // Get current state
  var isChecked=checkbox.checked;

  // Update visual appearance
  var checkboxDiv=containerEl.querySelector('.supp-visual-checkbox');
  if(checkboxDiv){
    // Update checkmark
    if(isChecked){
      if(!checkboxDiv.querySelector('span')){
        var checkmark=document.createElement('span');
        checkmark.style.cssText='width:14px;height:14px;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;';
        checkmark.textContent='✓';
        checkboxDiv.appendChild(checkmark);
      }
      checkboxDiv.style.background='#025857';
    } else {
      var checkmark=checkboxDiv.querySelector('span');
      if(checkmark)checkmark.remove();
      checkboxDiv.style.background='white';
    }
  }

  // Update border color based on checkbox state
  var borderColor=isChecked?'#4caf50':'#ff6b35';
  containerEl.style.borderLeftColor=borderColor;
}

/* Supplement Suggestions Modal */
function openSupplementModal(){
  try {
    var c=getC();
    if(!c || !c.weekPlan){
      showErrorToast('Δημιουργήστε πρώτα ένα πλάνο');
      return;
    }

    console.log('[DEBUG] openSupplementModal - Client loaded, weekPlan exists');

    var modal=document.getElementById('supp-modal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='supp-modal';
      modal.className='supp-modal';
      modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');
      document.body.appendChild(modal);
      console.log('[DEBUG] openSupplementModal - Modal div created');
    }

    // ═════ GENERATE DYNAMIC RECOMMENDATIONS FROM GAP ANALYSIS ═════
    console.log('[DEBUG] openSupplementModal - Calling getWeekMicronutrients');
    var weekAnalysis=getWeekMicronutrients(c.weekPlan);

    console.log('[DEBUG] openSupplementModal - Calling detectMicronutrientGaps');
    var gaps=detectMicronutrientGaps(weekAnalysis, c);

    console.log('[DEBUG] openSupplementModal - Calling matchSupplementsToGaps');
    var gapBasedRecs=matchSupplementsToGaps(gaps, SUPPS);

    // ═════ COMBINE WITH STATIC RECOMMENDATIONS ═════
    console.log('[DEBUG] openSupplementModal - Calling buildDynamicSupplementHtml');
    var suppHtml=buildDynamicSupplementHtml(c, gapBasedRecs, gaps);
    console.log('[DEBUG] openSupplementModal - HTML built, length:', suppHtml.length);

    modal.innerHTML='<div class="supp-modal-content">'
      +'<div class="supp-modal-header">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">'
      +'<div>'
      +'<h2 style="margin:0;color:#025857;">💊 Προτάσεις Συμπληρωμάτων (Βάσει Ανάλυσης)</h2>'
      +'<p style="font-size:11px;color:#666;margin:4px 0 0;">Συνιστώμενα βάσει ανάλυσης του πλάνου — συνδυάζονται στο PDF με όσα ήδη παίρνει ο πελάτης (Tab 1, «💊 Συμπληρώματα»).</p>'
      +'</div>'
      +'<button onclick="closeSupplementModal()" style="background:#025857;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;color:white;font-weight:bold;font-size:14px;white-space:nowrap;">✕ Κλείσιμο</button>'
      +'</div>'
      +'</div>'
      +'<div id="supp-modal-content" style="overflow-y:auto;max-height:calc(85vh - 120px);">'+suppHtml+'</div>'
      +'</div>';

    console.log('[DEBUG] openSupplementModal - Modal innerHTML set');

    modal.style.display='flex';
    console.log('[DEBUG] openSupplementModal - Modal display set to flex');

    modal.addEventListener('click',function(e){
      if(e.target===modal)closeSupplementModal();
    });

    console.log('[DEBUG] openSupplementModal - COMPLETE - Modal should be visible');
  } catch(err) {
    console.error('[ERROR] openSupplementModal failed:', err.message);
    console.error('[ERROR] Stack:', err.stack);
    showErrorToast('Σφάλμα κατά το άνοιγμα του προτάσεων συμπληρωμάτων: ' + err.message);
  }
}

function closeSupplementModal(){
  var modal=document.getElementById('supp-modal');
  if(modal)modal.style.display='none';
}

// Save selected supplements to client
function saveSupplementSelection(){
  var c=getC();
  if(!c){
    showErrorToast('Δημιουργήστε πρώτα ένα πλάνο');
    return;
  }

  // Get all checked checkboxes
  var checkboxes=document.querySelectorAll('#supp-modal input[type="checkbox"]:checked');
  var selectedSupps=[];

  checkboxes.forEach(function(cb){
    var parent=cb.closest('div');
    var label=parent.querySelector('label');
    var infoDiv=parent.querySelector('div');

    if(label && infoDiv){
      var suppName=label.textContent.split(' - ')[0].trim();
      var doseText=label.textContent.split(' - ')[1]||'';
      var infoText=infoDiv.textContent;

      selectedSupps.push({
        supplement: suppName,
        dose: doseText,
        info: infoText
      });
    }
  });

  if(selectedSupps.length===0){
    showErrorToast('Επιλέξτε τουλάχιστον ένα συμπλήρωμα');
    return;
  }

  // ✅ Merge instead of overwrite: this modal only lists gap-based recommendation candidates
  // (checked or not, all under #supp-modal input[type=checkbox]), so keep whatever the "already
  // taking" modal (Tab 1, "💊 Συμπληρώματα") saved for names outside that candidate set —
  // otherwise saving here would silently wipe those out of c.selectedSupplements.
  var allCandidateNames=[];
  document.querySelectorAll('#supp-modal input[type="checkbox"]').forEach(function(cb){
    var parent=cb.closest('div');
    var label=parent.querySelector('label');
    if(label) allCandidateNames.push(label.textContent.split(' - ')[0].trim());
  });
  var keepFromOther=(c.selectedSupplements||[]).filter(function(s){
    return allCandidateNames.indexOf(s.supplement)===-1;
  });

  // Save to client
  c.selectedSupplements=keepFromOther.concat(selectedSupps);
  save();

  // Show success message
  showSuccessToast('✅ Επιλογή αποθηκεύτηκε! ' + selectedSupps.length + ' συμπληρώματα θα εμφανιστούν στο PDF.');

  // Close modal and update display
  closeSupplementModal();
  renderWeekTable();
}

// ══════════════════════════════════════════════════════════════════════════════
// STRATEGY A: TWO-LEVEL SUPPLEMENT SYSTEM - Helper function to get supplement names
// ══════════════════════════════════════════════════════════════════════════════
function getSupplementNameFromId(suppId){
  var supp=SUPPS.find(function(s){return s.id===suppId;});
  return supp ? supp.name : '';
}

// ══════════════════════════════════════════════════════════════════════════════
// BUILD DYNAMIC SUPPLEMENT RECOMMENDATIONS FROM GAP ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════
function buildDynamicSupplementHtml(c, gapBasedRecs, gaps){
  var html='';
  var savedSupps=c.selectedSupplements||[];

  // STRATEGY A: Get currently taken supplements (Page 1)
  var currentSupps=c.supps||[];
  var currentSuppNames={};
  currentSupps.forEach(function(suppId){
    var name=getSupplementNameFromId(suppId);
    if(name) currentSuppNames[name]=suppId;
  });

  // STRATEGY A: Show current supplements summary
  if(currentSupps.length > 0){
    html += '<div style="background:#e8f5e9;border-left:4px solid #4caf50;padding:12px;margin-bottom:15px;border-radius:4px;">';
    html += '<h4 style="color:#2e7d32;margin-top:0;margin-bottom:8px;">✓ Συμπληρώματα που παίρνετε ήδη</h4>';
    var currentSuppsList=currentSupps.map(function(id){return getSupplementNameFromId(id);}).filter(function(n){return n;}).join(', ');
    html += '<p style="font-size:12px;color:#555;margin:0;">'+currentSuppsList+'</p>';
    html += '</div>';
  }

  // SECTION 1: GAP-BASED RECOMMENDATIONS (from actual meal plan analysis)
  html += '<div style="background:#fff3e0;border-left:4px solid #e65100;padding:15px;margin-bottom:20px;border-radius:4px;">';
  html += '<h3 style="color:#e65100;margin-top:0;">🎯 Προτάσεις Βάσει Ανάλυσης Διατροφής</h3>';
  html += '<p style="font-size:12px;color:#666;margin-bottom:10px;">Επιλέξτε ποια συμπληρώματα θέλετε να συστήσετε στο PDF (⭐ = παίρνετε ήδη):</p>';

  if(gapBasedRecs.length > 0){
    gapBasedRecs.forEach(function(rec, idx){
      // STRATEGY A: Check if this recommendation overlaps with current supplements
      var alreadyTaking=rec.supplement && currentSuppNames.hasOwnProperty(rec.supplement);

      var suppId='supp_'+idx;
      var isChecked=savedSupps.some(function(s){return s.supplement===rec.supplement;});
      var borderColor=alreadyTaking?'#4caf50':'#ff6b35';

      // Build the container
      html += '<div data-supp-id="'+suppId+'" style="padding:10px;background:var(--card-bg);margin-bottom:10px;border-radius:4px;border-left:3px solid '+borderColor+';display:flex;align-items:center;gap:12px;'+(alreadyTaking?'opacity:0.8;':'')+'transition:border-color 0.2s;cursor:pointer;" onclick="toggleSuppCheckbox(this)">';

      // Hidden native checkbox for form submission
      html += '<input type="checkbox" id="'+suppId+'" '+( isChecked ? 'checked' : '')+' style="display:none;" class="supp-checkbox">';

      // Custom visible checkbox
      html += '<div class="supp-visual-checkbox" style="flex-shrink:0;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:2px solid '+(alreadyTaking?'#4caf50':'#025857')+';border-radius:4px;background:'+(isChecked?'#025857':'white')+';transition:all 0.2s;position:relative;">';
      if(isChecked) html += '<span style="width:14px;height:14px;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">✓</span>';
      html += '</div>';

      // Content
      html += '<div style="flex:1;min-width:0;">';
      html += '<div style="cursor:pointer;font-weight:bold;color:'+(alreadyTaking?'#2e7d32':'#e65100')+';font-size:13px;display:block;user-select:none;margin-bottom:4px;">';
      html += rec.supplement + ' - ' + rec.recommendedDose + rec.unit;
      if(alreadyTaking) html += ' <span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;margin-left:6px;">⭐ Παίρνετε ήδη</span>';
      html += '</div>';
      html += '<div style="font-size:11px;color:#666;margin-top:3px;">';
      html += '📊 Στόχος: ' + rec.nutrient + ' | Ελλείπει: ' + rec.gap.toFixed(1) + rec.unit;
      html += ' (έχετε ' + rec.actual.toFixed(1) + '/' + rec.target + ')';
      html += '</div>';
      if(rec.timing){
        html += '<div style="font-size:11px;color:#666;margin-top:2px;">⏰ ' + rec.timing.t + '</div>';
      }
      if(rec.interactions && rec.interactions.length > 0){
        html += '<div style="font-size:11px;color:#d32f2f;margin-top:2px;">⚠️ Λάβετε σε διαφορετικές ώρες (2+ ώρες): ' + rec.interactions.join(', ') + '</div>';
      }
      if(alreadyTaking){
        html += '<div style="font-size:11px;background:#c8e6c9;color:#2e7d32;padding:4px 6px;margin-top:4px;border-radius:3px;">ℹ️ Αυτό το συμπλήρωμα είναι ήδη στο σχέδιό σας από τη Σελίδα 1</div>';
      }
      html += '</div></div>';
    });
  } else {
    html += '<div style="padding:10px;background:#e8f5e9;border-radius:4px;color:#2e7d32;font-size:12px;">';
    html += '✅ Εξαιρετική κάλυψη! Δεν εντοπίστηκαν σημαντικές ελλείψεις στη διατροφή σας.';
    html += '</div>';
  }

  html += '</div>';

  // SECTION 2: GENERAL GUIDELINES (based on diet type)
  html += '<div style="background:var(--panel-bg);padding:15px;border-radius:4px;margin-bottom:20px;">';
  html += '<h3 style="color:#666;margin-top:0;">📖 Γενικές Κατευθυντήριες (Τύπος Διατροφής)</h3>';

  // Add static recommendations from getSupplementRecommendations
  var staticRecs = getSupplementRecommendations(c);
  html += staticRecs;

  html += '</div>';

  // SECTION 3: SAVE SELECTION BUTTON
  html += '<div style="background:#E2EEE5;padding:15px;border-radius:4px;border-left:4px solid #025857;">';
  html += '<button onclick="saveSupplementSelection()" style="background:#025857;color:white;padding:12px 20px;border:none;border-radius:5px;cursor:pointer;font-weight:bold;font-size:14px;width:100%;margin-bottom:10px;">';
  html += '✅ Αποθήκευση Επιλογής στο Πλάνο';
  html += '</button>';
  html += '<p style="font-size:11px;color:#666;margin:0;">Τα επιλεγμένα συμπληρώματα θα εμφανιστούν στο PDF εξαγωγή και στο πλάνο διατροφής.</p>';
  html += '</div>';

  return html;
}

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

// ══════════════════════════════════════════════════════════════════════════════
// BEHAVIORAL TRACKING SYSTEM — Learning from your usage patterns
// ══════════════════════════════════════════════════════════════════════════════

// TRACKING_DATA is initialized earlier in the script.
// Load tracking data from localStorage
function loadTrackingData(){
  var stored = safeStorageGet('dietologist_tracking', null);
  if(stored && typeof stored === 'object'){
    TRACKING_DATA = stored;
  } else {
    TRACKING_DATA = { plans: [], recipes: {}, patterns: {}, lastUpdated: null };
  }
}

// Save tracking data to localStorage
function saveTrackingData(){
  TRACKING_DATA.lastUpdated = new Date().toISOString();
  safeStorageSet('dietologist_tracking', TRACKING_DATA);
}

// Real display name for a tracked meal — meal.name is always just the meal-time slot
// label ("Πρωινό"/"Μεσημεριανό"/"Βραδινό"/"Ενδιάμεσο", set once from TMPLS and never
// overwritten once real foods are filled in), so it's useless for telling recipes apart
// in Tracking Analytics. Prefer the chef recipe's real title, then fall back to the
// actual foods in the meal.
function getMealDisplayName(meal){
  if(meal.recipeId && typeof findRecipeById==='function'){
    var r = findRecipeById(meal.recipeId);
    if(r && r.name) return r.name;
  }
  if(meal.foods && meal.foods.length){
    return meal.foods.slice(0,3).map(function(f){return f.n;}).join(', ');
  }
  return meal.name || 'Γεύμα';
}

// Shared init for a TRACKING_DATA.recipes[trackKey] entry — used by both logPlanGeneration (usage
// stats) and rateMeal (👍/👎), so a rating on a recipe that hasn't been logged yet (edge case) still
// has somewhere real to land instead of throwing.
function ensureRecipeTrackingEntry(trackKey, name){
  if(!TRACKING_DATA.recipes[trackKey]){
    TRACKING_DATA.recipes[trackKey] = {
      id: trackKey,
      name: name || trackKey,
      timesUsed: 0,
      successCount: 0,
      regenerateCount: 0,
      clientsUsedWith: [],
      lastUsed: null,
      ratings: [],           // {date, rating: 1 or -1, clientName}
      thumbsUp: 0,
      thumbsDown: 0
    };
  }
  return TRACKING_DATA.recipes[trackKey];
}

// Log plan generation
function logPlanGeneration(client, weekPlan){
  if(!client || !weekPlan)return;

  var planLog = {
    timestamp: new Date().toISOString(),
    clientName: client.name || 'Unknown',
    goal: client.goal,
    dietType: client.dietType,
    mealsUsed: [],
    mealRatings: {},  // {"0-0": {rating: 1, date}, "0-1": {rating: -1, date}}
    regeneratedAt: null,
    planDuration: 0,
    status: 'active'
  };

  // Extract all recipes used. trackKey identifies the meal for trust tracking regardless of where
  // it came from: a chef recipe's stable id (meal.recipeId), or a taste-library/saved-combo meal's
  // content signature (meal.recipeSig) — most real plans are library-sourced, so without this they'd
  // never accumulate usage history at all.
  for(var d=0;d<7;d++){
    if(weekPlan[d]){
      for(var mi=0;mi<weekPlan[d].length;mi++){
        var meal = weekPlan[d][mi];
        var trackKey = meal.recipeId || meal.recipeSig;
        if(trackKey){
          planLog.mealsUsed.push({
            day: d,
            mealIndex: mi,
            recipeId: trackKey,
            mealName: getMealDisplayName(meal)
          });

          // Update recipe stats
          ensureRecipeTrackingEntry(trackKey, getMealDisplayName(meal));
          TRACKING_DATA.recipes[trackKey].timesUsed++;
          TRACKING_DATA.recipes[trackKey].lastUsed = new Date().toISOString();

          if(!TRACKING_DATA.recipes[trackKey].clientsUsedWith.includes(client.name)){
            TRACKING_DATA.recipes[trackKey].clientsUsedWith.push(client.name);
          }
        }
      }
    }
  }

  TRACKING_DATA.plans.push(planLog);
  saveTrackingData();
}

// Track when plan is regenerated (negative signal)
function logRegenerate(planIndex){
  if(planIndex >= 0 && planIndex < TRACKING_DATA.plans.length){
    var plan = TRACKING_DATA.plans[planIndex];
    plan.regeneratedAt = new Date().toISOString();
    plan.status = 'regenerated';

    // Mark recipes as problematic
    plan.mealsUsed.forEach(function(meal){
      if(TRACKING_DATA.recipes[meal.recipeId]){
        TRACKING_DATA.recipes[meal.recipeId].regenerateCount++;
      }
    });

    saveTrackingData();
    console.log('Regenerate tracked');
  }
}

// Calculate success rate for each recipe
function calculateRecipeStats(){
  var stats = {};

  Object.keys(TRACKING_DATA.recipes).forEach(function(recipeId){
    var recipe = TRACKING_DATA.recipes[recipeId];
    var successRate = recipe.timesUsed > 0 ?
      (1 - (recipe.regenerateCount / recipe.timesUsed)) * 100 : 0;

    stats[recipeId] = {
      name: recipe.name,
      timesUsed: recipe.timesUsed,
      successRate: Math.round(successRate),
      usedWithClients: recipe.clientsUsedWith.length,
      trustScore: calculateTrustScore(recipe),
      lastUsed: recipe.lastUsed
    };
  });

  return stats;
}

// Rate a meal (day + meal index)
function rateMeal(dayIndex, mealIndex, rating){
  var c = getC();
  if(!c || !c.weekPlan || dayIndex === undefined || mealIndex === undefined) return;

  var mealKey = dayIndex + '-' + mealIndex;
  var meal = c.weekPlan[dayIndex][mealIndex];
  var mealName = meal ? meal.name : 'Γεύμα';

  // Find the current plan in TRACKING_DATA
  var currentPlan = TRACKING_DATA.plans[TRACKING_DATA.plans.length - 1];
  if(!currentPlan) return;

  // Initialize mealRatings if needed
  if(!currentPlan.mealRatings) currentPlan.mealRatings = {};

  // Add rating (1 = thumbs up, -1 = thumbs down)
  currentPlan.mealRatings[mealKey] = {
    rating: rating,
    date: new Date().toISOString(),
    mealName: mealName,
    foods: meal && meal.foods ? meal.foods.map(f => f.n).join(', ') : ''
  };

  // ✅ Feed the rating into the SAME recipeId/recipeSig trust-score store logPlanGeneration()
  // already populates (TRACKING_DATA.recipes[trackKey]) — until this fix, thumbsUp/thumbsDown/
  // ratings existed in the schema but were never written or read anywhere (confirmed 2026-07-30,
  // see [[dietologist-pending-work]]), so 👎 had zero effect beyond a history-log entry no future
  // plan generation ever consulted. A single vote is a weak, personal-taste signal (not necessarily
  // "this recipe is bad"), so it only nudges the global trust score (see calculateTrustScore's
  // Laplace smoothing, js/app-part3.js) — the stronger, immediate effect is per-client below.
  var trackKey = meal && (meal.recipeId || meal.recipeSig);
  if(trackKey){
    var entry = ensureRecipeTrackingEntry(trackKey, mealName);
    entry.ratings.push({date: new Date().toISOString(), rating: rating, clientName: c.name || ''});
    if(rating > 0) entry.thumbsUp++; else if(rating < 0) entry.thumbsDown++;

    // ✅ Per-client hard block: a 👎'd recipe/combo should not be re-offered to THIS client on a
    // future regenerate (whole-week or per-day) — the global trust nudge above is too weak to
    // reliably keep one disliked dish from resurfacing for the same person. genPlan()'s recipe/
    // combo lookups (findBestRecipe/findSavedComboMatch/generateSmartMeal) skip anything in
    // c.dislikedRecipeIds. A later 👍 on the same recipe reverses it — reachable if it's cloned
    // into this client's plan again via "Βάση πλάνου" from a different client, or manually re-added.
    c.dislikedRecipeIds = c.dislikedRecipeIds || [];
    var idx = c.dislikedRecipeIds.indexOf(trackKey);
    if(rating < 0 && idx === -1) c.dislikedRecipeIds.push(trackKey);
    else if(rating > 0 && idx !== -1) c.dislikedRecipeIds.splice(idx, 1);
    save();
  }

  // Update UI feedback - change button colors
  var upBtn = document.querySelector('[data-meal-rating="' + mealKey + '"][data-rating="up"]');
  var downBtn = document.querySelector('[data-meal-rating="' + mealKey + '"][data-rating="down"]');

  if(rating > 0){
    if(upBtn) { upBtn.style.background = '#4caf50'; upBtn.style.color = 'white'; }
    if(downBtn) { downBtn.style.background = ''; downBtn.style.color = '#888'; }
  } else if(rating < 0){
    if(downBtn) { downBtn.style.background = '#d9534f'; downBtn.style.color = 'white'; }
    if(upBtn) { upBtn.style.background = ''; upBtn.style.color = '#888'; }
  }

  saveTrackingData();
  console.log('Meal rated: Day ' + dayIndex + ', ' + mealName + ' (' + (rating > 0 ? '👍' : '👎') + ')');
}

// Helper: Generate diverse alternatives (different food categories)
function generateDiverseAlternatives(targetCalories, dayIndex, excludedFoods, mealName, count, macroTargets){
  var alternatives = [];
  macroTargets = macroTargets || {};

  // Determine meal type from name (classifyMealSlot — same classifier the plan-generation
  // pipeline uses, js/app-part3.js — keeps this consistent with genPlan's own meal typing)
  var _slot = classifyMealSlot(mealName);
  var isBreakfast = _slot==='breakfast';
  var isSnack = _slot==='snack';
  var isLunch = _slot==='lunch';
  var isDinner = _slot==='dinner';

  // Macro targets to match
  var targetP = macroTargets.targetProtein || 0;
  var targetF = macroTargets.targetFat || 0;
  var targetC = macroTargets.targetCarbs || 0;
  var excludeFoods = macroTargets.excludeFoods || [];

  // Diet-type awareness (e.g. orthodox_fasting/vegan/vegetarian) — without this, a swap
  // could freely suggest meat/fish/dairy for a fasting client since this generator builds
  // candidates straight from FOODS, bypassing applyDietTypeCategorySafetyNet entirely.
  var dietForbiddenCats = DIET_TYPE_FORBIDDEN_CATS[macroTargets.dietType] || [];
  var dayAllowedCats = (macroTargets.dietExceptionDays &&
    (macroTargets.dietExceptionDays[dayIndex] || macroTargets.dietExceptionDays[String(dayIndex)])) || [];
  var dayAllowedFoods = (macroTargets.dietFoodExceptionDays &&
    (macroTargets.dietFoodExceptionDays[dayIndex] || macroTargets.dietFoodExceptionDays[String(dayIndex)])) || [];
  var dayForbiddenCats = dietForbiddenCats.filter(function(cat){return dayAllowedCats.indexOf(cat)===-1;});
  function isDietForbidden(foodName){
    if(!dayForbiddenCats.length) return false;
    if(dayAllowedFoods.indexOf(foodName)!==-1) return false;
    var fd = FOODS[foodName];
    if(fd && fd.plantBased) return false; // e.g. almond/soy/oat milk — see data.js note
    var foodCat = fd ? fd.cat : '';
    if(dayForbiddenCats.indexOf(foodCat)!==-1) return true;
    // Same composite-dish blind spot as applyDietTypeCategorySafetyNet (js/app-part2.js) —
    // a "Συνταγές FYH"-tagged dish can hide meat/fish/eggs that its own .cat doesn't reveal.
    return !!(fd && fd.containsCats && fd.containsCats.some(function(hc){return dayForbiddenCats.indexOf(hc)!==-1;}));
  }

  // Collect different protein options based on meal type
  var proteinOptions = [];
  var carbOptions = [];
  var veggieOptions = [];
  var dairyOptions = [];
  var fruitOptions = [];

  // Categorize foods
  for(var foodName in FOODS){
    if(!FOODS.hasOwnProperty(foodName)) continue;
    if(excludedFoods && excludedFoods.indexOf(foodName) !== -1) continue;
    if(isDietForbidden(foodName)) continue;

    var lower = foodName.toLowerCase();

    // Heavy proteins (for lunch/dinner)
    if(!isBreakfast && (lower.includes('κοτόπουλο') || lower.includes('ψάρι') || lower.includes('τόνο') ||
       lower.includes('κιμάς') || lower.includes('σολομό') || lower.includes('γαρίδα') ||
       lower.includes('χοιρινό') || lower.includes('αρνί') || lower.includes('βοδινό'))){
      proteinOptions.push(foodName);
    }

    // Light proteins (eggs - for breakfast/snacks, NOT legumes)
    if(lower.includes('αβγό')){
      proteinOptions.push(foodName);
    }

    // Legumes (only for lunch/dinner, NOT breakfast)
    if(!isBreakfast && (lower.includes('φασόλι') || lower.includes('φακή'))){
      proteinOptions.push(foodName);
    }

    // Carb foods - differentiate by type
    if(isBreakfast){
      // Breakfast carbs: δημητριακά, ψωμί, avena
      if(lower.includes('δημητριακά') || lower.includes('ψωμί') || lower.includes('αρτο') ||
         lower.includes('κροασάν') || lower.includes('avena')){
        carbOptions.push(foodName);
      }
    } else {
      // Lunch/dinner carbs: ρύζι, πατάτα, κινόα, κριθάρι
      if(lower.includes('ρύζι') || lower.includes('πατάτα') || lower.includes('κινόα') ||
         lower.includes('κριθάρι') || lower.includes('νουντλς')){
        carbOptions.push(foodName);
      }
    }

    // Veggie/side foods
    if(lower.includes('σαλάτα') || lower.includes('λαχανικό') || lower.includes('ντομάτα') ||
       lower.includes('αγγούρι') || lower.includes('μαρούλι') || lower.includes('παντζάρι')){
      veggieOptions.push(foodName);
    }

    // Dairy (breakfast/snacks)
    if(isBreakfast || isSnack){
      if(lower.includes('γιαούρτι') || lower.includes('φέτα') || lower.includes('τυρί') ||
         lower.includes('γάλα') || lower.includes('κοτάζ')){
        dairyOptions.push(foodName);
      }
    }

    // Fruits (breakfast/snacks)
    if(isBreakfast || isSnack){
      if(lower.includes('μήλο') || lower.includes('μπανάνα') || lower.includes('φράουλα') ||
         lower.includes('πορτοκάλι') || lower.includes('κιβι') || lower.includes('γεγονός')){
        fruitOptions.push(foodName);
      }
    }
  }

  // Create 3 diverse combinations based on meal type (matching macros)
  for(var attempt = 0; attempt < 10 && alternatives.length < 3; attempt++){
    var meal = {foods: []};

    if(isBreakfast){
      // Breakfast: Build meal targeting carbs & protein
      // Select carb source
      if(carbOptions.length > 0){
        var carb = carbOptions[Math.floor(Math.random() * carbOptions.length)];
        if(!excludeFoods.includes(carb)){
          var cMacros = cm(carb, 100);
          var cGrams = targetC > 0 ? (targetC * 0.7 * 100) / cMacros.c : (targetCalories * 0.5) / (cMacros.k / 100);
          meal.foods.push({n: carb, g: Math.round(Math.max(30, Math.min(300, cGrams)))});
        }
      }

      // Select protein source (dairy/eggs for breakfast)
      if(targetP > 0 && (dairyOptions.length > 0 || proteinOptions.length > 0)){
        var protOptions = dairyOptions.concat(proteinOptions.filter(p => !p.includes('κιμάς')));
        if(protOptions.length > 0){
          var prot = protOptions[Math.floor(Math.random() * protOptions.length)];
          if(!excludeFoods.includes(prot)){
            var pMacros = cm(prot, 100);
            var pGrams = (targetP * 0.8 * 100) / pMacros.p;
            meal.foods.push({n: prot, g: Math.round(Math.max(30, Math.min(300, pGrams)))});
          }
        }
      }

      // Add fruit if space
      if(fruitOptions.length > 0 && meal.foods.length < 3){
        var fruit = fruitOptions[Math.floor(Math.random() * fruitOptions.length)];
        if(!excludeFoods.includes(fruit)){
          meal.foods.push({n: fruit, g: 150});
        }
      }
    } else if(isSnack){
      // Snack: Light option matching macros
      if(targetP > 5){
        // Protein-based snack
        var snackProt = dairyOptions.length > 0 ? dairyOptions[Math.floor(Math.random() * dairyOptions.length)] :
                        proteinOptions[Math.floor(Math.random() * proteinOptions.length)];
        if(!excludeFoods.includes(snackProt)){
          meal.foods.push({n: snackProt, g: 150});
        }
      } else if(fruitOptions.length > 0){
        var snackFruit = fruitOptions[Math.floor(Math.random() * fruitOptions.length)];
        if(!excludeFoods.includes(snackFruit)){
          meal.foods.push({n: snackFruit, g: 200});
        }
      }
    } else {
      // Lunch/Dinner: Match protein, carbs, fat
      var mealProto = proteinOptions[Math.floor(Math.random() * proteinOptions.length)];
      if(mealProto && !excludeFoods.includes(mealProto)){
        var prMacros = cm(mealProto, 100);
        var prGrams = targetP > 0 ? (targetP * 100) / prMacros.p : (targetCalories * 0.35) / (prMacros.k / 100);
        meal.foods.push({n: mealProto, g: Math.round(Math.max(50, Math.min(250, prGrams)))});
      }

      if(carbOptions.length > 0){
        var mealCarb = carbOptions[Math.floor(Math.random() * carbOptions.length)];
        if(mealCarb && !excludeFoods.includes(mealCarb)){
          var crMacros = cm(mealCarb, 100);
          var crGrams = targetC > 0 ? (targetC * 100) / crMacros.c : (targetCalories * 0.45) / (crMacros.k / 100);
          meal.foods.push({n: mealCarb, g: Math.round(Math.max(50, Math.min(300, crGrams)))});
        }
      }

      if(veggieOptions.length > 0){
        var mealVeg = veggieOptions[Math.floor(Math.random() * veggieOptions.length)];
        if(!excludeFoods.includes(mealVeg)){
          meal.foods.push({n: mealVeg, g: 150});
        }
      }
    }

    if(meal.foods.length > 0){
      var mealStr = meal.foods.map(f => f.n).join(', ');
      if(!alternatives.some(a => a.foodsStr === mealStr)){
        alternatives.push({foods: meal.foods, foodsStr: mealStr});
      }
    }
  }

  return alternatives.slice(0, count || 3);
}

// Show alternative meal options when user rates meal as 👎
function showMealAlternatives(dayIndex, mealIndex){
  var c = getC();
  if(!c || !c.weekPlan || !c.weekPlan[dayIndex] || !c.weekPlan[dayIndex][mealIndex]) return;

  var currentMeal = c.weekPlan[dayIndex][mealIndex];
  var mealName = currentMeal.name || '';
  var currentCalories = 0;
  var currentProtein = 0, currentFat = 0, currentCarbs = 0;
  var excl = (c.foodExclude || []);
  var currentFoodNames = [];

  // Calculate current meal macros and remember food names
  if(currentMeal.foods){
    currentMeal.foods.forEach(function(f){
      currentFoodNames.push(f.n);
      var r = cm(f.n, f.g);
      currentCalories += r.k;
      currentProtein += r.p;
      currentFat += r.f;
      currentCarbs += r.c;
    });
  }

  // ✅ PRIORITY 1: Check saved combos (favorite meals marked with ⭐)
  var alternatives = [];
  var savedCombos = getSavedCombos();

  if(savedCombos && savedCombos.length > 0) {
    var exclLowerSMA = excl.map(function(x){return (x||'').toLowerCase();}).filter(Boolean);
    // Find saved combos compatible with current meal type and calorie target
    // Use ±100 kcal tolerance for saved combos to find similar meals
    for(var si = 0; si < savedCombos.length; si++) {
      var savedCombo = savedCombos[si];
      var savedComboKcal = savedCombo.kcal || 0;
      var savedComboName = savedCombo.name || mealName;

      // Check: same meal type (breakfast, lunch, dinner, snack) and calorie range
      var isSameMealType = !savedCombo.mealTiming ||
                          (mealName && savedCombo.mealTiming &&
                           mealName.toLowerCase().indexOf(savedCombo.mealTiming.toLowerCase()) !== -1);

      var isWithinCaloricRange = Math.abs(savedComboKcal - currentCalories) <= 120; // ±120 kcal

      // Check: combo's tagged diet type is compatible with this client's diet
      var isDietCompatible = comboDietOK(c.dietType, savedCombo.dietType);

      // Check: no excluded foods in saved combo
      var hasExcludedFood = comboHasExcludedFood(savedCombo.foods, exclLowerSMA);

      // Add to alternatives if compatible (same meal type, within calorie range, diet-compatible, no excluded foods)
      if(isSameMealType && isWithinCaloricRange && isDietCompatible && !hasExcludedFood && savedCombo.foods && savedCombo.foods.length > 0) {
        alternatives.push({
          foods: deepClone(savedCombo.foods),
          isSavedCombo: true,
          comboName: savedComboName,
          priority: 'saved'
        });
      }

      // Limit to 2 saved combos to leave room for generated alternatives
      if(alternatives.length >= 2) break;
    }
  }

  // ✅ PRIORITY 2: Generate new alternatives if we need more options
  var generatedAlternatives = [];
  var alternativesNeeded = 3 - alternatives.length;

  if(alternativesNeeded > 0) {
    generatedAlternatives = generateDiverseAlternatives(currentCalories, dayIndex, excl, mealName, alternativesNeeded, {
      targetProtein: currentProtein,
      targetFat: currentFat,
      targetCarbs: currentCarbs,
      excludeFoods: currentFoodNames,
      dietType: c.dietType,
      dietExceptionDays: c.dietExceptionDays,
      dietFoodExceptionDays: c.dietFoodExceptionDays
    });

    // Add generated alternatives with priority flag
    generatedAlternatives.forEach(function(alt) {
      alternatives.push({
        foods: alt.foods,
        isSavedCombo: false,
        priority: 'generated'
      });
    });
  }

  // Build modal HTML
  var modalHtml = '<div style="max-width:600px">'
    +'<h3 style="color:#d9534f;margin-bottom:15px">Εναλλακτικές επιλογές για ' + mealName + '</h3>'
    +'<p style="color:#666;font-size:12px;margin-bottom:15px">Επιλέξτε μια εναλλακτική ή αφήστε το αρχικό γεύμα</p>';

  // PHASE 1: Generate scaled versions of each alternative
  var scaledAlternatives = [];
  alternatives.forEach(function(alt, idx){
    var tempMeal = {foods: deepClone(alt.foods), name: mealName};
    var effTarget = {
      k: currentCalories,
      p: currentProtein,
      f: currentFat,
      c: currentCarbs
    };
    var scaledMeal = scalePlan([tempMeal], effTarget)[0];
    scaledAlternatives.push({
      original: alt,
      scaled: scaledMeal
    });
  });

  // PHASE 2: Validate each scaled alternative
  var validAlternativesData = [];
  scaledAlternatives.forEach(function(altData, idx){
    var scaledMeal = altData.scaled;

    // Calculate actual macros after scaling
    var altProtein = 0, altFat = 0, altCarbs = 0, altCalories = 0;
    scaledMeal.foods.forEach(function(f){
      var r = cm(f.n, f.g);
      altCalories += r.k;
      altProtein += r.p;
      altFat += r.f;
      altCarbs += r.c;
    });

    // Calculate deviations (for reference only, no filtering)
    var calorieDeviation = Math.abs(altCalories - currentCalories) / currentCalories * 100;
    var proteinDeviation = currentProtein > 0 ? Math.abs(altProtein - currentProtein) / currentProtein * 100 : 0;
    var carbsDeviation = currentCarbs > 0 ? Math.abs(altCarbs - currentCarbs) / currentCarbs * 100 : 0;
    var fatDeviation = currentFat > 0 ? Math.abs(altFat - currentFat) / currentFat * 100 : 0;

    // Accept ALL alternatives (no filtering)
    var isValid = true;

    console.log('Alternative ' + idx + ': K=' + altCalories.toFixed(0) + ' (dev ' + calorieDeviation.toFixed(1) + '%), P=' + altProtein.toFixed(1) + ' (dev ' + proteinDeviation.toFixed(1) + '%), C=' + altCarbs.toFixed(1) + ' (dev ' + carbsDeviation.toFixed(1) + '%), F=' + altFat.toFixed(1) + ' (dev ' + fatDeviation.toFixed(1) + '%) - VALID=' + isValid);

    if(isValid){
      validAlternativesData.push({
        index: idx,
        scaled: scaledMeal,
        calories: altCalories,
        protein: altProtein,
        carbs: altCarbs,
        fat: altFat,
        calorieDeviation: calorieDeviation,
        proteinDeviation: proteinDeviation,
        carbsDeviation: carbsDeviation,
        fatDeviation: fatDeviation
      });
    }
  });

  // PHASE 3: Build modal with only valid alternatives
  validAlternativesData.forEach(function(data, displayIdx){
    var altData = alternatives[data.index];
    var isSaved = altData && altData.isSavedCombo;
    var badgeHtml = isSaved ? '<span style="background:#ff9800;color:white;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:bold;margin-left:6px">⭐ Αγαπημένο</span>' : '';

    modalHtml += '<div style="background:' + (isSaved ? '#fff3e0' : '#f5f5f5') + ';border:' + (isSaved ? '2px solid #ff9800' : '1px solid #ddd') + ';border-radius:6px;padding:10px;margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
      +'<div><b style="color:#025857">Επιλογή ' + (displayIdx+1) + '</b>' + badgeHtml + '</div>'
      +'<div style="font-size:11px;color:#666">'
      + Math.round(data.calories) + ' kcal (±' + data.calorieDeviation.toFixed(1) + '%) | '
      + 'P: ' + Math.round(data.protein) + 'g (±' + data.proteinDeviation.toFixed(1) + '%)'
      +'</div>'
      +'</div>'
      +'<div style="font-size:12px;color:var(--text-strong);margin-bottom:10px">' + data.scaled.foods.map(f => f.n + ' ' + Math.round(f.g) + 'g').join(' + ') + '</div>'
      +'<button onclick="replaceMeal(' + dayIndex + ',' + mealIndex + ',' + data.index + ')" style="background:#4caf50;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:11px">✓ Επιλέξ αυτή</button>'
      +'</div>';

    // Store SCALED version for replacement
    alternatives[data.index].foods = deepClone(data.scaled.foods);
  });

  // Note: All alternatives are now shown (no filtering)

  modalHtml += '<div style="margin-top:15px;padding-top:15px;border-top:1px solid #ddd">'
    +'<button onclick="closeAltModal()" style="background:#888;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:11px">× Κράτησε το αρχικό</button>'
    +'</div></div>';

  // Store alternatives for replaceMeal function
  window.currentAlternatives = alternatives;

  // Show modal
  var modal = document.getElementById('altMealModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'altMealModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000';
    document.body.appendChild(modal);
  }

  var content = modal.querySelector('[role="dialog"]') || document.createElement('div');
  content.role = 'dialog';
  content.style.cssText = 'background:var(--card-bg);border-radius:8px;padding:20px;max-height:80vh;overflow-y:auto;max-width:500px';
  content.innerHTML = modalHtml;

  if(!modal.querySelector('[role="dialog"]')){
    modal.appendChild(content);
  }

  modal.style.display = 'flex';
}

// Close alternatives modal
function closeAltModal(){
  var modal = document.getElementById('altMealModal');
  if(modal) modal.style.display = 'none';
}

// Replace meal with selected alternative
function replaceMeal(dayIndex, mealIndex, altIndex){
  var c = getC();
  if(!c || !c.weekPlan || !window.currentAlternatives || !window.currentAlternatives[altIndex]) return;

  var alt = window.currentAlternatives[altIndex];
  c.weekPlan[dayIndex][mealIndex].foods = deepClone(alt.foods);

  save();
  renderWeekTable();
  closeAltModal();

  console.log('Meal replaced with alternative');
}

// Calculate meal success based on ratings
function getMealRatingStats(){
  var mealStats = {};  // {day-mealIndex: {goodCount, badCount, success%}}

  // Analyze all plans
  TRACKING_DATA.plans.forEach(function(plan){
    if(plan.mealRatings){
      Object.keys(plan.mealRatings).forEach(function(mealKey){
        if(!mealStats[mealKey]){
          mealStats[mealKey] = {
            goodCount: 0,
            badCount: 0,
            meals: [],
            totalRatings: 0
          };
        }
        var rating = plan.mealRatings[mealKey];
        mealStats[mealKey].meals.push({
          mealName: rating.mealName,
          foods: rating.foods,
          date: rating.date
        });
        mealStats[mealKey].totalRatings++;
        if(rating.rating > 0) mealStats[mealKey].goodCount++;
        else if(rating.rating < 0) mealStats[mealKey].badCount++;
      });
    }
  });

  // Calculate success percentages
  Object.keys(mealStats).forEach(function(key){
    var stats = mealStats[key];
    if(stats.totalRatings > 0){
      stats.successPercent = Math.round((stats.goodCount / stats.totalRatings) * 100);
    } else {
      stats.successPercent = 0;
    }
  });

  return mealStats;
}

// Analyze patterns from meal ratings
function analyzePatterns(){
  var mealStats = getMealRatingStats();

  var patterns = {
    topMeals: [],        // Success rate > 70%
    problemMeals: [],    // Success rate < 40%
    recentRatings: [],   // Most recent ratings
    analysisDate: new Date().toISOString()
  };

  // Convert to sortable array
  var mealArray = Object.keys(mealStats).map(function(key){
    return {
      mealKey: key,
      ...mealStats[key]
    };
  }).sort(function(a,b){ return b.successPercent - a.successPercent; });

  // Top meals (success > 70%)
  patterns.topMeals = mealArray.filter(function(m){ return m.successPercent > 70; }).slice(0, 10);

  // Problem meals (success < 40%)
  patterns.problemMeals = mealArray.filter(function(m){ return m.successPercent < 40 && m.totalRatings > 0; }).slice(0, 10);

  // Recent ratings (last 10)
  var allRatings = [];
  TRACKING_DATA.plans.forEach(function(plan){
    if(plan.mealRatings){
      Object.keys(plan.mealRatings).forEach(function(mealKey){
        allRatings.push({
          mealKey: mealKey,
          ...plan.mealRatings[mealKey]
        });
      });
    }
  });
  patterns.recentRatings = allRatings.sort(function(a,b){
    return new Date(b.date) - new Date(a.date);
  }).slice(0, 10);

  TRACKING_DATA.patterns = patterns;
  saveTrackingData();

  return patterns;
}

// Show analytics dashboard
function showTrackingDashboard(){
  closeTrackingDashboard(); // avoid stacking a second overlay if one is already open
  var patterns = analyzePatterns();
  var stats = calculateRecipeStats();

  var html = '<div id="tracking-dashboard-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;overflow:auto;padding:20px;">';
  html += '<div style="background:var(--card-bg);max-width:1000px;margin:0 auto;border-radius:10px;padding:30px;">';
  html += '<div style="position:absolute;top:10px;right:10px;cursor:pointer;font-size:30px;" onclick="closeTrackingDashboard();">&times;</div>';

  html += '<h1 style="color:#025857;">📊 Tracking Analytics - Αξιολογήσεις Γευμάτων</h1>';

  // Top Meals (Success > 70%)
  html += '<h2 style="color:#025857;margin-top:30px;">⭐ Αγαπημένα Γεύματα (>70% επιτυχία)</h2>';
  if(patterns.topMeals.length > 0){
    html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;">';
    html += '<tr style="background:#E2EEE5;"><th style="padding:10px;text-align:left;">Γεύμα</th><th>👍</th><th>👎</th><th>Επιτυχία</th><th>Τρόφιμα</th></tr>';

    patterns.topMeals.forEach(function(meal){
      var mealName = meal.meals && meal.meals[0] ? meal.meals[0].mealName : 'Γεύμα';
      var foods = meal.meals && meal.meals[0] ? meal.meals[0].foods : '-';
      html += '<tr style="border-bottom:1px solid #ddd;">';
      html += '<td style="padding:10px;"><strong>' + esc(mealName) + '</strong></td>';
      html += '<td style="padding:10px;"><span style="color:#4caf50;font-weight:bold;">' + meal.goodCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#d9534f;font-weight:bold;">' + meal.badCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#025857;font-weight:bold;">' + meal.successPercent + '%</span></td>';
      html += '<td style="padding:10px;font-size:12px;color:#666;">' + esc(foods.substring(0, 50)) + (foods.length > 50 ? '...' : '') + '</td>';
      html += '</tr>';
    });
    html += '</table>';
  } else {
    html += '<p style="color:#666;">Δεν έχεις αξιολογήσει γεύματα ακόμα. Κάνε κλικ στα 👍/👎 κουμπιά στο πλάνο!</p>';
  }

  // Problem Meals (Success < 40%)
  if(patterns.problemMeals.length > 0){
    html += '<h2 style="color:#d9534f;margin-top:30px;">⚠️ Προβληματικά Γεύματα (<40% επιτυχία)</h2>';
    html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;">';
    html += '<tr style="background:#f8d7da;"><th style="padding:10px;text-align:left;">Γεύμα</th><th>👍</th><th>👎</th><th>Επιτυχία</th><th>Σχόλιο</th></tr>';

    patterns.problemMeals.forEach(function(meal){
      var mealName = meal.meals && meal.meals[0] ? meal.meals[0].mealName : 'Γεύμα';
      html += '<tr style="border-bottom:1px solid #ddd;">';
      html += '<td style="padding:10px;"><strong>' + esc(mealName) + '</strong></td>';
      html += '<td style="padding:10px;"><span style="color:#4caf50;font-weight:bold;">' + meal.goodCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#d9534f;font-weight:bold;">' + meal.badCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#d9534f;font-weight:bold;">' + meal.successPercent + '%</span></td>';
      html += '<td style="padding:10px;color:#d9534f;font-weight:500;">Αποφύγετε</td>';
      html += '</tr>';
    });
    html += '</table>';
  }

  // Recent Ratings
  if(patterns.recentRatings.length > 0){
    html += '<h2 style="color:#025857;margin-top:30px;">💭 Πρόσφατες Αξιολογήσεις</h2>';
    html += '<div style="background:#f0f8ff;padding:15px;border-radius:5px;margin:10px 0;">';
    patterns.recentRatings.slice(0, 8).forEach(function(rating){
      var icon = rating.rating > 0 ? '👍' : '👎';
      var date = new Date(rating.date).toLocaleDateString('el-GR');
      html += '<div style="padding:8px;border-bottom:1px solid #ddd;"><strong>' + esc(rating.mealName) + '</strong> ' + icon + ' <span style="font-size:12px;color:#666;">(' + date + ')</span></div>';
    });
    html += '</div>';
  }

  // Trust Score per meal/recipe — real usage-based ranking (drives the genPlan weighting in
  // findBestRecipe/findSavedComboMatch), separate from the manual 👍/👎 ratings above. Keyed by
  // either a chef recipe's id or a taste-library/saved-combo meal's food signature.
  var statEntries = Object.keys(stats).map(function(id){ return stats[id]; }).sort(function(a,b){ return b.timesUsed - a.timesUsed; });
  html += '<h2 style="color:#025857;margin-top:30px;">🏆 Trust Score ανά Γεύμα/Συνταγή</h2>';
  if(statEntries.length > 0){
    html += '<p style="color:#666;font-size:13px;margin:0 0 10px;">Πόσο συχνά «κρατιέται» ένα γεύμα σε σχέση με το πόσες φορές το πλάνο του ξαναρολάρεται — αυτό επηρεάζει ποια γεύματα προτιμώνται σε νέα πλάνα.</p>';
    html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;">';
    html += '<tr style="background:#E2EEE5;"><th style="padding:10px;text-align:left;">Γεύμα</th><th>Φορές Χρήσης</th><th>Trust Score</th><th>Πελάτες</th><th>Τελευταία Χρήση</th></tr>';
    statEntries.slice(0, 30).forEach(function(s){
      var trustColor = s.trustScore >= 0.7 ? '#4caf50' : (s.trustScore <= 0.4 ? '#d9534f' : '#f0a500');
      var lastUsed = s.lastUsed ? new Date(s.lastUsed).toLocaleDateString('el-GR') : '-';
      html += '<tr style="border-bottom:1px solid #ddd;">';
      html += '<td style="padding:10px;"><strong>' + esc(s.name||'Γεύμα') + '</strong></td>';
      html += '<td style="padding:10px;text-align:center;">' + s.timesUsed + '</td>';
      html += '<td style="padding:10px;text-align:center;"><span style="color:' + trustColor + ';font-weight:bold;">' + Math.round(s.trustScore*100) + '%</span></td>';
      html += '<td style="padding:10px;text-align:center;">' + s.usedWithClients + '</td>';
      html += '<td style="padding:10px;font-size:12px;color:#666;">' + lastUsed + '</td>';
      html += '</tr>';
    });
    html += '</table>';
  } else {
    html += '<p style="color:#666;">Δεν έχει καταγραφεί ακόμα καμία χρήση γεύματος. Φτιάξε ένα πλάνο για να ξεκινήσει η καταγραφή!</p>';
  }

  // Statistics
  html += '<h2 style="color:#025857;margin-top:30px;">📈 Στατιστικά</h2>';
  html += '<div style="background:var(--panel-bg);padding:15px;border-radius:5px;margin:10px 0;">';
  html += '<p><strong>Συνολικά Πλάνα:</strong> ' + TRACKING_DATA.plans.length + '</p>';
  html += '<p><strong>Αξιολογημένα Γεύματα:</strong> ' + (patterns.recentRatings ? patterns.recentRatings.length : 0) + '</p>';
  html += '<p><strong>Αγαπημένα Γεύματα (>70%):</strong> ' + patterns.topMeals.length + '</p>';
  html += '<p><strong>Προβληματικά Γεύματα (<40%):</strong> ' + patterns.problemMeals.length + '</p>';
  html += '</div>';

  html += '<button onclick="closeTrackingDashboard()" style="margin-top:20px;padding:10px 20px;background:#025857;color:white;border:none;border-radius:5px;cursor:pointer;">Close</button>';

  html += '</div></div>';

  document.body.insertAdjacentHTML('beforeend', html);
}

function closeTrackingDashboard(){
  // Must target this dashboard specifically by id — a generic "[style*=position:fixed]" selector
  // also matches unrelated always-present elements (#context-menu, modals, toasts), so it used to
  // remove whichever of those happened to be first in the DOM instead of the dashboard.
  var dashboard = document.getElementById('tracking-dashboard-overlay');
  if(dashboard)dashboard.remove();
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

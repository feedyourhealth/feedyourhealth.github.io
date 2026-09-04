function openValidationModal() {
  var c = getC();
  // Check if weekPlan exists and has at least one day with meals
  if(!c || !c.weekPlan || Object.keys(c.weekPlan).length === 0){
    showErrorToast('Please generate a meal plan first');
    return;
  }

  // ✅ Use the REAL engine — same calcTDEE + macros the actual plan uses (not a duplicate calc)
  var t = calcTDEE(c);
  var bmr = t.bmr;
  var tdee = t.tdee;
  var actFactor = bmr ? (tdee/bmr) : 1.55;   // derived for display (also correct in MET mode)
  var adjTDEE = t.target;                      // goal-adjusted daily target
  var protein = t.p;
  var fat = t.f;
  var carbs = t.carb;
  var weeklyKcal = adjTDEE * 7;

  // Static reference values for the "Test Cases" section below
  function calcBMR(w, h, a, s) {
    if(s === 'M') return 10*w + 6.25*h - 5*a + 5;
    return 10*w + 6.25*h - 5*a - 161;
  }
  var actFactors = {sed:1.2, light:1.375, mod:1.55, active:1.725};

  // DEBUG PANEL
  var debugHTML = '<div style="padding:10px;background:var(--card-bg);border-radius:4px;">';
  debugHTML += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;"><span>Name:</span><strong>'+esc(c.name)+'</strong></div>';
  debugHTML += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;"><span>BMR:</span><strong>'+bmr.toFixed(0)+' kcal</strong></div>';
  debugHTML += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;"><span>Activity:</span><strong>'+actFactor.toFixed(2)+'x</strong></div>';
  debugHTML += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;"><span>TDEE:</span><strong>'+adjTDEE.toFixed(0)+' kcal</strong></div>';
  debugHTML += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;"><span>Protein:</span><strong>'+protein.toFixed(0)+'g</strong></div>';
  debugHTML += '<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #eee;"><span>Fat:</span><strong>'+fat.toFixed(0)+'g</strong></div>';
  debugHTML += '<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Carbs:</span><strong>'+carbs.toFixed(0)+'g</strong></div>';
  debugHTML += '</div>';
  document.getElementById('valDebugPanel').innerHTML = debugHTML;

  // VALIDATION CHECKLIST
  var checks = [
    {name: 'TDEE (1500-3500)', pass: adjTDEE >= 1500 && adjTDEE <= 3500, val: adjTDEE.toFixed(0)},
    {name: 'Protein (1.6-2.2g/kg)', pass: (protein/c.weight) >= 1.6 && (protein/c.weight) <= 2.2, val: (protein/c.weight).toFixed(2)},
    {name: 'Carbs (2-5g/kg)', pass: (carbs/c.weight) >= 2 && (carbs/c.weight) <= 5, val: (carbs/c.weight).toFixed(2)},
    {name: 'Fat (0.8-1.2g/kg)', pass: (fat/c.weight) >= 0.8 && (fat/c.weight) <= 1.2, val: (fat/c.weight).toFixed(2)},
    {name: 'Macro Total (~TDEE)', pass: Math.abs((protein*4 + fat*9 + carbs*4) - adjTDEE) < adjTDEE*0.05, val: (protein*4+fat*9+carbs*4).toFixed(0)}
  ];

  var checkHTML = '<div style="padding:10px;background:var(--card-bg);border-radius:4px;">';
  checks.forEach(function(ch){
    checkHTML += '<div style="display:flex;align-items:center;gap:8px;padding:6px;margin:4px 0;">';
    checkHTML += '<span style="font-size:16px;'+(ch.pass?'color:#4caf50':'color:#f44336')+'">'+(ch.pass?'✓':'✗')+'</span>';
    checkHTML += '<span style="flex:1;">'+ch.name+'</span>';
    checkHTML += '<strong>'+ch.val+'</strong>';
    checkHTML += '</div>';
  });
  checkHTML += '</div>';
  document.getElementById('valCheckList').innerHTML = checkHTML;

  // TEST CASES
  var tests = [
    {name:'Low TDEE',w:65,h:170,a:30,s:'F',act:'sed'},
    {name:'High TDEE',w:85,h:185,a:25,s:'M',act:'active'},
    {name:'Moderate',w:75,h:175,a:30,s:'M',act:'mod'}
  ];

  var testHTML = '';
  tests.forEach(function(t){
    var b = calcBMR(t.w, t.h, t.a, t.s);
    var d = b * actFactors[t.act];
    var p = t.w * 1.8;
    testHTML += '<div style="padding:10px;background:var(--card-bg);border-radius:4px;border-left:4px solid #025857;">';
    testHTML += '<strong>'+t.name+'</strong><br/>';
    testHTML += 'TDEE: <strong>'+d.toFixed(0)+'</strong> kcal<br/>';
    testHTML += 'P: <strong>'+p.toFixed(0)+'g</strong><br/>';
    testHTML += '</div>';
  });
  document.getElementById('valTestCases').innerHTML = testHTML;

  // CORRELATION
  var corrHTML = '<strong>Client Profile</strong> → BMR ('+bmr.toFixed(0)+' kcal)<br/>';
  corrHTML += '↓<br/>';
  corrHTML += '<strong>Activity</strong> ('+actFactor.toFixed(2)+'x) → TDEE ('+tdee.toFixed(0)+' kcal)<br/>';
  corrHTML += '↓<br/>';
  corrHTML += '<strong>Goal Adjustment</strong> → Adjusted TDEE ('+adjTDEE.toFixed(0)+' kcal)<br/>';
  corrHTML += '↓<br/>';
  corrHTML += '<strong>Macro Distribution</strong> → P: '+protein.toFixed(0)+'g | F: '+fat.toFixed(0)+'g | C: '+carbs.toFixed(0)+'g<br/>';
  corrHTML += '↓<br/>';
  corrHTML += '<strong>Weekly Total</strong> → '+weeklyKcal.toFixed(0)+' kcal for 7 days';
  document.getElementById('valCorrelation').innerHTML = corrHTML;

  document.getElementById('validationModal').style.display = 'flex';
}

function closeValidationModal() {
  document.getElementById('validationModal').style.display = 'none';
}

document.addEventListener('keydown', function(e){
  var vm = document.getElementById('validationModal');
  if(e.key === 'Escape' && vm && vm.style.display !== 'none'){
    closeValidationModal();
  }
});

// #validationModal υπάρχει πάντα στο Dietologist.html· ο null-guard είναι για το
// test/smoke.html harness, που φορτώνει αυτό το αρχείο χωρίς το markup του modal.
var _valModal = document.getElementById('validationModal');
if(_valModal) _valModal.addEventListener('click', function(e){
  if(e.target === this) closeValidationModal();
});

/* ════════════════════════════════════════════════════════════════════════
   ✅ PAGE 1 MODALS - 6 Pop-up Windows για καθαρότερη σελίδα
   ════════════════════════════════════════════════════════════════════════ */

// ✅ MODAL 3: CUSTOM MEAL TIMES
function openMealTimesModal(){
  var c=getC();if(!c)return;
  var html='<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1002;" id="mealTimesOverlay" onclick="if(event.target===this)closeMealTimesModal()">'
    +'<div style="background:var(--card-bg);border-radius:12px;padding:20px;max-width:500px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.3)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:2px solid #025857;padding-bottom:10px">'
    +'<h2 style="margin:0;color:#025857;font-size:18px">⏱️ Χρόνοι Γευμάτων</h2>'
    +'<button onclick="closeMealTimesModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted)">&times;</button>'
    +'</div>'
    +'<div style="background:#E2EEE5;padding:12px;border-radius:6px;margin-bottom:15px;font-size:12px;color:#025857">'
    +'💡 Ορίστε τους χρόνους των γευμάτων. Θα χρησιμοποιηθούν για meal planning.'
    +'</div>'
    +'<div style="display:grid;gap:12px">'
    +'<div><label style="font-weight:600;color:var(--text-strong)">🌅 Πρωινό</label><input type="time" id="meal-breakfast" value="'+(c.mealTimes?.breakfast||'07:00')+'" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px"></div>'
    +'<div><label style="font-weight:600;color:var(--text-strong)">🥤 Πρωινό Ενδιάμεσο</label><input type="time" id="meal-snack" value="'+(c.mealTimes?.snack||'10:00')+'" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px"></div>'
    +'<div><label style="font-weight:600;color:var(--text-strong)">🍽️ Μεσημέρι</label><input type="time" id="meal-lunch" value="'+(c.mealTimes?.lunch||'13:00')+'" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px"></div>'
    +'<div><label style="font-weight:600;color:var(--text-strong)">🍎 Απογευματινό Ενδιάμεσο</label><input type="time" id="meal-snack2" value="'+(c.mealTimes?.snack2||'16:00')+'" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px"></div>'
    +'<div><label style="font-weight:600;color:var(--text-strong)">🌙 Βράδυ</label><input type="time" id="meal-dinner" value="'+(c.mealTimes?.dinner||'19:00')+'" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px"></div>'
    // 3ο πεδίο ώρας ενδιάμεσου — για μέρες με 3+ γεύματα ονομασμένα 'Ενδιάμεσο' (π.χ. διπλή προπόνηση
    // στην ίδια μέρα). Το snapshot (_buildSnapshot, Dietologist.html) κάνει cycle [snack,snack2,snack3]
    // ανά εμφάνιση 'Ενδιάμεσο'/'Δεκατιανό' μέσα στην ίδια μέρα — προαιρετικό πεδίο, δεν επηρεάζει πελάτες
    // με το κλασικό σχήμα 2 ενδιαμέσων/μέρα.
    +'<div><label style="font-weight:600;color:var(--text-strong)">🥪 Έξτρα Ενδιάμεσο (3ο)</label><input type="time" id="meal-snack3" value="'+(c.mealTimes?.snack3||'21:00')+'" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px"></div>'
    +'</div>'
    +'<div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="closeMealTimesModal()" style="padding:10px 20px;background:#eee;border:none;border-radius:6px;cursor:pointer">❌ Κλείσιμο</button>'
    +'<button onclick="saveMealTimes()" style="padding:10px 20px;background:#025857;color:white;border:none;border-radius:6px;cursor:pointer">✅ Αποθήκευση</button>'
    +'</div>'
    +'</div>'
    +'</div>';

  var overlay=document.createElement('div');
  overlay.innerHTML=html;
  overlay.id='mealTimesModal';
  document.body.appendChild(overlay);
}

function closeMealTimesModal(){
  var m=document.getElementById('mealTimesModal');
  if(m)m.remove();
}

function saveMealTimes(){
  var c=getC();if(!c)return;
  if(!c.mealTimes)c.mealTimes={};
  c.mealTimes.breakfast=document.getElementById('meal-breakfast').value;
  c.mealTimes.snack=document.getElementById('meal-snack').value;
  c.mealTimes.lunch=document.getElementById('meal-lunch').value;
  c.mealTimes.snack2=document.getElementById('meal-snack2').value;
  c.mealTimes.snack3=document.getElementById('meal-snack3').value;
  c.mealTimes.dinner=document.getElementById('meal-dinner').value;
  save();
  closeMealTimesModal();
  showSuccessToast('✅ Χρόνοι γευμάτων αποθηκεύτηκαν!');
}

// ✅ MODAL 4: MET ACTIVITIES
function openMetActivitiesModal(){
  var c=getC();if(!c)return;
  var html='<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1002;" id="metActivOverlay" onclick="if(event.target===this)closeMetActivitiesModal()">'
    +'<div style="background:var(--card-bg);border-radius:12px;padding:20px;max-width:700px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.3)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:2px solid #025857;padding-bottom:10px">'
    +'<h2 style="margin:0;color:#025857;font-size:18px">🏃 MET Activities (Δραστηριότητες)</h2>'
    +'<button onclick="closeMetActivitiesModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted)">&times;</button>'
    +'</div>'
    +'<div style="background:#E2EEE5;padding:12px;border-radius:6px;margin-bottom:15px;font-size:12px;color:#025857">'
    +'💡 Προσθέστε συγκεκριμένες δραστηριότητες για ακριβή υπολογισμό θερμίδων.'
    +'</div>'
    +'<div id="metActivContent" style="font-size:13px"></div>'
    +'<div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="closeMetActivitiesModal()" style="padding:10px 20px;background:#eee;border:none;border-radius:6px;cursor:pointer">❌ Κλείσιμο</button>'
    +'<button onclick="closeMetActivitiesModal();save()" style="padding:10px 20px;background:#025857;color:white;border:none;border-radius:6px;cursor:pointer">✅ Αποθήκευση</button>'
    +'</div>'
    +'</div>'
    +'</div>';

  var overlay=document.createElement('div');
  overlay.innerHTML=html;
  overlay.id='metActivModal';
  document.body.appendChild(overlay);

  var t=calcTDEE(c);
  document.getElementById('metActivContent').innerHTML=buildMetHtml(c,t);
}

function closeMetActivitiesModal(){
  var m=document.getElementById('metActivModal');
  if(m)m.remove();
}

// ✅ MODAL 5: ΙΑΤΡΙΚΕΣ ΣΥΝΘΗΚΕΣ
function openMedicalConditionsModal(){
  var c=getC();if(!c)return;
  var html='<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1002;" id="medicalOverlay" onclick="if(event.target===this)closeMedicalConditionsModal()">'
    +'<div style="background:var(--card-bg);border-radius:12px;padding:20px;max-width:600px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.3)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:2px solid #025857;padding-bottom:10px">'
    +'<h2 style="margin:0;color:#025857;font-size:18px">🩺 Ιατρικές Συνθήκες</h2>'
    +'<button onclick="closeMedicalConditionsModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted)">&times;</button>'
    +'</div>'
    +'<div style="background:#FFEBEE;padding:12px;border-radius:6px;margin-bottom:15px;font-size:12px;color:#c62828">'
    +'⚠️ Επιλέξτε τυχόν ενεργές ιατρικές συνθήκες για προσαρμογή του πλάνου.'
    +'</div>'
    // ✅ One neutral row background for all 8 conditions — the 6 arbitrary pastel colors here
    // had no legend and no consistent meaning (unlike the 3-tier menstrual-cycle colors below,
    // which do mean something). Reserving color for the genuine risk callouts above/below.
    +'<div style="display:grid;gap:10px;margin-bottom:20px">'
    +'<label style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--panel-bg);border-radius:6px;cursor:pointer">'
    +'<input type="checkbox" id="chk-diabetes-modal" '+(c.medConditions?.diabetes?'checked':'')+' style="width:18px;height:18px">'
    +'<span style="font-weight:600">🍬 Διαβήτης</span>'
    +'<button type="button" onclick="event.stopPropagation();event.preventDefault();showMedicalProtocol(\'diabetes\')" style="margin-left:auto;background:var(--card-bg);border:1px solid #025857;color:#025857;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;white-space:nowrap">📋 Πρωτόκολλο</button>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--panel-bg);border-radius:6px;cursor:pointer">'
    +'<input type="checkbox" id="chk-hypertension-modal" '+(c.medConditions?.hypertension?'checked':'')+' style="width:18px;height:18px">'
    +'<span style="font-weight:600">🩸 Υψηλή Πίεση</span>'
    +'<button type="button" onclick="event.stopPropagation();event.preventDefault();showMedicalProtocol(\'hypertension\')" style="margin-left:auto;background:var(--card-bg);border:1px solid #025857;color:#025857;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;white-space:nowrap">📋 Πρωτόκολλο</button>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--panel-bg);border-radius:6px;cursor:pointer">'
    +'<input type="checkbox" id="chk-cholesterol-modal" '+(c.medConditions?.cholesterol?'checked':'')+' style="width:18px;height:18px">'
    +'<span style="font-weight:600">🩸 Υψηλή Χοληστερόλη</span>'
    +'<button type="button" onclick="event.stopPropagation();event.preventDefault();showMedicalProtocol(\'cholesterol\')" style="margin-left:auto;background:var(--card-bg);border:1px solid #025857;color:#025857;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;white-space:nowrap">📋 Πρωτόκολλο</button>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--panel-bg);border-radius:6px;cursor:pointer">'
    +'<input type="checkbox" id="chk-celiac-modal" '+(c.medConditions?.celiac?'checked':'')+' style="width:18px;height:18px">'
    +'<span style="font-weight:600">🌾 Κοιλιοκάκη</span>'
    +'<button type="button" onclick="event.stopPropagation();event.preventDefault();showMedicalProtocol(\'celiac\')" style="margin-left:auto;background:var(--card-bg);border:1px solid #025857;color:#025857;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;white-space:nowrap">📋 Πρωτόκολλο</button>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--panel-bg);border-radius:6px;cursor:pointer">'
    +'<input type="checkbox" id="chk-ibs-modal" '+(c.medConditions?.ibs?'checked':'')+' style="width:18px;height:18px">'
    +'<span style="font-weight:600">🔄 IBS</span>'
    +'<button type="button" onclick="event.stopPropagation();event.preventDefault();showMedicalProtocol(\'ibs\')" style="margin-left:auto;background:var(--card-bg);border:1px solid #025857;color:#025857;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;white-space:nowrap">📋 Πρωτόκολλο</button>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--panel-bg);border-radius:6px;cursor:pointer">'
    +'<input type="checkbox" id="chk-lactose-modal" '+(c.medConditions?.lactose?'checked':'')+' style="width:18px;height:18px">'
    +'<span style="font-weight:600">🥛 Δυσανεξία Λακτόζης</span>'
    +'<button type="button" onclick="event.stopPropagation();event.preventDefault();showMedicalProtocol(\'lactose\')" style="margin-left:auto;background:var(--card-bg);border:1px solid #025857;color:#025857;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;white-space:nowrap">📋 Πρωτόκολλο</button>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--panel-bg);border-radius:6px;cursor:pointer">'
    +'<input type="checkbox" id="chk-ironDeficiency-modal" '+(c.medConditions?.ironDeficiency?'checked':'')+' style="width:18px;height:18px">'
    +'<span style="font-weight:600">🔋 Σιδηροπενία / Αναιμία (Αθλητές)</span>'
    +'<button type="button" onclick="event.stopPropagation();event.preventDefault();showMedicalProtocol(\'ironDeficiency\')" style="margin-left:auto;background:var(--card-bg);border:1px solid #025857;color:#025857;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;white-space:nowrap">📋 Πρωτόκολλο</button>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--panel-bg);border-radius:6px;cursor:pointer">'
    +'<input type="checkbox" id="chk-hydration-modal" '+(c.medConditions?.hydration?'checked':'')+' style="width:18px;height:18px">'
    +'<span style="font-weight:600">💧 Ενυδάτωση & Ηλεκτρολύτες (Αθλητές)</span>'
    +'<button type="button" onclick="event.stopPropagation();event.preventDefault();showMedicalProtocol(\'hydration\')" style="margin-left:auto;background:var(--card-bg);border:1px solid #025857;color:#025857;border-radius:4px;padding:4px 8px;font-size:11px;cursor:pointer;white-space:nowrap">📋 Πρωτόκολλο</button>'
    +'</label>'
    +'</div>'
    +'<div style="border-top:2px solid #ddd;padding-top:15px;margin-bottom:20px">'
    +'<label for="medications-modal" style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:8px">💊 Φάρμακα / συμπληρώματα:</label>'
    +'<textarea id="medications-modal" style="width:100%;padding:10px;border:1px solid var(--border-light);border-radius:4px;font-size:14px;height:64px" placeholder="π.χ. Λεβοθυροξίνη 50mcg το πρωί — ή κενό">'+esc(c.medications||'')+'</textarea>'
    +'<div style="font-size:10px;color:var(--text-muted);margin-top:2px">Σημείωση αναφοράς — δεν αλλάζει αυτόματα το πλάνο. Συμπληρώνεται και από το ερωτηματολόγιο εισαγωγής.</div>'
    +'</div>'
    +'<div style="border-top:2px solid #ddd;padding-top:15px">'
    +'<label style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:10px">👩 Μητρικός Κύκλος (Γυναίκες):</label>'
    +'<div style="display:grid;gap:8px">'
    +'<label style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--panel-bg);border-radius:4px">'
    +'<input type="radio" name="menstrual" value="regular" '+(c.menstrualCycle!=='irregular'&&c.menstrualCycle!=='absent'?'checked':'')+' style="width:16px;height:16px">'
    +'<span>✅ Κανονικός</span>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:8px;padding:8px;background:#FFF3E0;border-radius:4px">'
    +'<input type="radio" name="menstrual" value="irregular" '+(c.menstrualCycle==='irregular'?'checked':'')+' style="width:16px;height:16px">'
    +'<span>⚠️ Ακανόνιστος (Monitor RED-S)</span>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:8px;padding:8px;background:#FFCDD2;border-radius:4px">'
    +'<input type="radio" name="menstrual" value="absent" '+(c.menstrualCycle==='absent'?'checked':'')+' style="width:16px;height:16px">'
    +'<span>🔴 Απών (HIGH RED-S RISK!)</span>'
    +'</label>'
    +'</div>'
    +'</div>'
    +'<div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="closeMedicalConditionsModal()" style="padding:10px 20px;background:#eee;border:none;border-radius:6px;cursor:pointer">❌ Κλείσιμο</button>'
    +'<button onclick="saveMedicalConditions()" style="padding:10px 20px;background:#025857;color:white;border:none;border-radius:6px;cursor:pointer">✅ Αποθήκευση</button>'
    +'</div>'
    +'</div>'
    +'</div>';

  var overlay=document.createElement('div');
  overlay.innerHTML=html;
  overlay.id='medicalModal';
  document.body.appendChild(overlay);
}

function closeMedicalConditionsModal(){
  var m=document.getElementById('medicalModal');
  if(m)m.remove();
}

function saveMedicalConditions(){
  var c=getC();if(!c)return;
  if(!c.medConditions)c.medConditions={};

  // Snapshot BEFORE overwriting, so we can tell which condition(s) were just newly turned on.
  var prevConditions={};
  Object.keys(c.medConditions).forEach(function(k){ prevConditions[k]=c.medConditions[k]; });

  c.medConditions.diabetes=document.getElementById('chk-diabetes-modal').checked;
  c.medConditions.hypertension=document.getElementById('chk-hypertension-modal').checked;
  c.medConditions.cholesterol=document.getElementById('chk-cholesterol-modal').checked;
  c.medConditions.celiac=document.getElementById('chk-celiac-modal').checked;
  c.medConditions.ibs=document.getElementById('chk-ibs-modal').checked;
  c.medConditions.lactose=document.getElementById('chk-lactose-modal').checked;
  c.medConditions.ironDeficiency=document.getElementById('chk-ironDeficiency-modal').checked;
  c.medConditions.hydration=document.getElementById('chk-hydration-modal').checked;

  var menstrualValue=document.querySelector('input[name="menstrual"]:checked').value;
  c.menstrualCycle=menstrualValue;

  var medsEl=document.getElementById('medications-modal');
  if(medsEl) c.medications=medsEl.value.trim();

  // ⚕️ Give the client a correct starting macro-% distribution, but only when one of the conditions that was
  // JUST turned on (off→on) actually specifies a macro target itself (e.g. Διαβήτης). Otherwise leave macros
  // untouched — adding an unrelated condition (e.g. Υπέρταση, which has no macro target) must not silently
  // overwrite a manual edit the dietitian already made in Κατανομή Μακροθρεπτικών.
  var newlyActivatedWithMacroTarget=Object.keys(c.medConditions).some(function(k){
    if(!c.medConditions[k] || prevConditions[k]) return false; // not a fresh off→on transition
    var p=getProtocol(k);
    return !!(p && p.restrictions && (p.restrictions.carbPercentage!=null || p.restrictions.proteinPercentage!=null));
  });
  var macrosApplied=(newlyActivatedWithMacroTarget && typeof applyProtocolMacros==='function')?applyProtocolMacros(c):false;

  save();
  closeMedicalConditionsModal();
  showSuccessToast(macrosApplied?'✅ Ιατρικές συνθήκες αποθηκεύτηκαν! Τα μακροθρεπτικά ενημερώθηκαν βάσει πρωτοκόλλου.':'✅ Ιατρικές συνθήκες αποθηκεύτηκαν!');
  renderMain();
}

// ✅ MODAL 6: ΔΙΑΤΡΟΦΗ & ΑΠΟΚΛΕΙΣΜΟΙ
// Per-day exception grid (e.g. fish allowed on a fasting feast day like Ευαγγελισμός/Βαΐα) —
// only shown for diet types that actually forbid categories (DIET_TYPE_FORBIDDEN_CATS,
// js/app-part2.js). `dietType` is passed separately from `c` so the grid can be re-rendered
// live off the (possibly unsaved) dietType-modal select value on change.
// Known Orthodox-fasting feast days that traditionally allow fish, offered as a shortcut so
// the dietitian doesn't have to remember/look up the date each time — still requires picking
// which weekday it falls on THIS week, since the plan is a repeating weekly template with no
// real calendar anchor (see [[dietologist-taste-library]] for why: same weekday repeats forever).
var FASTING_FEAST_PRESETS=[
  {name:'Ευαγγελισμός (25 Μαρτίου)', cat:'Ψάρια'},
  {name:'Κυριακή των Βαΐων', cat:'Ψάρια'},
  {name:'Άλλη γιορτή με ψάρι', cat:'Ψάρια'}
];
function buildDietExceptionsHtml(dietType, exceptionDays){
  var cats=DIET_TYPE_FORBIDDEN_CATS[dietType];
  if(!cats||!cats.length)return '';
  exceptionDays=exceptionDays||{};
  var feastPresetHtml='';
  if(dietType==='orthodox_fasting'){
    var feastOptions=FASTING_FEAST_PRESETS.map(function(f,i){return '<option value="'+i+'">'+esc(f.name)+'</option>';}).join('');
    var dayOptions=DAYS.map(function(d,i){return '<option value="'+i+'">'+esc(d)+'</option>';}).join('');
    feastPresetHtml='<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:10px;padding:8px 10px;background:#f7faf9;border-radius:6px;font-size:11px">'
      +'<span style="font-weight:600;color:#025857">🐟 Γνωστή γιορτή:</span>'
      +'<select id="exc-feast-select" style="padding:3px 5px;border:1px solid var(--border-light);border-radius:4px;font-size:11px">'+feastOptions+'</select>'
      +'<span style="color:#666">σε ημέρα</span>'
      +'<select id="exc-feast-day" style="padding:3px 5px;border:1px solid var(--border-light);border-radius:4px;font-size:11px">'+dayOptions+'</select>'
      +'<button type="button" onclick="applyFastingFeastPreset()" style="padding:3px 10px;background:#025857;color:#fff;border:none;border-radius:4px;font-size:11px;cursor:pointer">Εφαρμογή</button>'
      +'</div>';
  }
  var head='<th style="text-align:left;padding:4px 6px;font-weight:600;color:var(--text-strong);font-size:11px">Ημέρα</th>'
    +cats.map(function(cat){return '<th style="padding:4px 6px;font-weight:600;color:var(--text-strong);font-size:11px">'+esc(cat)+'</th>';}).join('');
  // "Select all days" row — one checkbox per category column, checks/unchecks that category for
  // all 7 days at once (e.g. the client isn't strict about dairy at all → one click instead of 7).
  var allDaysRow='<tr>'
    +'<td style="padding:4px 6px;font-size:11px;font-weight:600;color:#025857">Όλες οι μέρες</td>'
    +cats.map(function(cat){
      var catEsc=cat.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      return '<td style="text-align:center;padding:4px 6px"><input type="checkbox" onchange="toggleExcCategoryAllDays(this,\''+catEsc+'\')"></td>';
    }).join('')
    +'</tr>';
  var rows='';
  DAYS.forEach(function(dayName,d){
    var allowed=exceptionDays[d]||exceptionDays[String(d)]||[];
    rows+='<tr>'
      +'<td style="padding:4px 6px;font-size:12px">'+esc(dayName)+'</td>'
      +cats.map(function(cat){
        var checked=allowed.indexOf(cat)!==-1?' checked':'';
        return '<td style="text-align:center;padding:4px 6px"><input type="checkbox" data-exc-day="'+d+'" data-exc-cat="'+esc(cat)+'"'+checked+'></td>';
      }).join('')
      +'</tr>';
  });
  return '<div style="margin-bottom:20px">'
    +'<label style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:8px">📅 Εξαιρέσεις ανά ημέρα:</label>'
    +'<div style="font-size:11px;color:#666;margin-bottom:6px">Τσέκαρε την κατηγορία που επιτρέπεται εκείνη τη μέρα (π.χ. ψάρι σε γιορτή νηστείας) — το πλάνο θα προσπαθήσει να βάλει αντίστοιχο γεύμα αυτόματα εκείνη την ημέρα. Με «Όλες οι μέρες» επιλέγεις μια κατηγορία για όλη την εβδομάδα με ένα κλικ.</div>'
    +feastPresetHtml
    +'<table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<thead><tr>'+head+'</tr>'+allDaysRow+'</thead><tbody>'+rows+'</tbody></table>'
    +'</div>';
}
// "Όλες οι μέρες" header checkbox for one category column — checks/unchecks every day's
// exception checkbox in that category at once (buildDietExceptionsHtml's category grid).
function toggleExcCategoryAllDays(headerCb, cat){
  var checked=headerCb.checked;
  document.querySelectorAll('[data-exc-cat]').forEach(function(cb){
    if(cb.getAttribute('data-exc-cat')===cat)cb.checked=checked;
  });
}
// Feast-day shortcut (buildDietExceptionsHtml's "🐟 Γνωστή γιορτή" row) — just checks the
// matching day/category checkbox for the dietitian, same as ticking it by hand.
function applyFastingFeastPreset(){
  var feastSel=document.getElementById('exc-feast-select');
  var daySel=document.getElementById('exc-feast-day');
  if(!feastSel||!daySel)return;
  var feast=FASTING_FEAST_PRESETS[Number(feastSel.value)];
  if(!feast)return;
  var day=daySel.value;
  var cb=document.querySelector('[data-exc-day="'+day+'"][data-exc-cat="'+feast.cat+'"]');
  if(cb)cb.checked=true;
  if(typeof dietoToast==='function')dietoToast('✓ '+feast.name+' → '+DAYS[Number(day)]+' ('+feast.cat+' επιτρέπεται)');
}
function refreshDietExceptionsSection(){
  var c=getC();if(!c)return;
  var sel=document.getElementById('dietType-modal');
  var section=document.getElementById('diet-exceptions-section');
  if(!sel||!section)return;
  section.innerHTML=buildDietExceptionsHtml(sel.value, c.dietExceptionDays);
}

function openDietModal(){
  var c=getC();if(!c)return;
  var html='<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1002;" id="dietOverlay" onclick="if(event.target===this)closeDietModal()">'
    +'<div style="background:var(--card-bg);border-radius:12px;padding:20px;max-width:600px;width:90%;max-height:85vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.3)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:2px solid #025857;padding-bottom:10px">'
    +'<h2 style="margin:0;color:#025857;font-size:18px">🥗 Διατροφή & Αποκλεισμοί</h2>'
    +'<button onclick="closeDietModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted)">&times;</button>'
    +'</div>'
    +'<div style="margin-bottom:20px">'
    +'<label style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:8px">📋 Τύπος Διατροφής:</label>'
    +'<select id="dietType-modal" onchange="refreshDietExceptionsSection()" style="width:100%;padding:10px;border:1px solid var(--border-light);border-radius:4px;font-size:14px">'
    +'<option value="normal" '+(c.dietType==='normal'?'selected':'')+'>🍗 Κανονική</option>'
    +'<option value="vegetarian" '+(c.dietType==='vegetarian'?'selected':'')+'>🥬 Χορτοφαγική</option>'
    +'<option value="vegan" '+(c.dietType==='vegan'?'selected':'')+'>🌱 Vegan</option>'
    +'<option value="keto" '+(c.dietType==='keto'?'selected':'')+'>⚡ Κετογονική</option>'
    +'<option value="bodybuilding_clean" '+(c.dietType==='bodybuilding_clean'?'selected':'')+'>🏋️ Bodybuilding Clean</option>'
    +'<option value="intermittent_fasting" '+(c.dietType==='intermittent_fasting'?'selected':'')+'>⏰ Intermittent Fasting</option>'
    +'<option value="orthodox_fasting" '+(c.dietType==='orthodox_fasting'?'selected':'')+'>✝️ Ορθόδοξη Νηστεία</option>'
    +'<option value="kids_10_14" '+(c.dietType==='kids_10_14'?'selected':'')+'>👧 Παιδιά 10-14</option>'
    +'<option value="mediterranean" '+(c.dietType==='mediterranean'?'selected':'')+'>🫒 Μεσογειακή Διατροφή</option>'
    +'</select>'
    +'</div>'
    +'<div id="diet-exceptions-section">'+buildDietExceptionsHtml(c.dietType, c.dietExceptionDays)+'</div>'
    +'<div style="margin-bottom:20px">'
    +'<label style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:8px">🚫 Αποκλεισμοί Τροφών:</label>'
    +'<button onclick="openFoodPickerModal()" style="width:100%;padding:12px;background:#025857;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;margin-bottom:8px">'
    +'📋 Επιλέξτε τρόφιμα που δεν του αρέσουν ('+(c.foodExclude?.length||0)+')'
    +'</button>'
    +'<div style="font-size:11px;color:#666;padding:8px;background:#FFF3E0;border-radius:4px">'
    +(c.foodExclude&&c.foodExclude.length>0?'✓ '+c.foodExclude.slice(0,3).join(', ')+(c.foodExclude.length>3?'...':''):'💡 Κάνε κλικ για να επιλέξεις τρόφιμα')
    +'</div>'
    +'</div>'
    +'<div style="margin-bottom:20px">'
    +'<label style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:8px">💡 Προτιμήσεις (comma-separated):</label>'
    +'<textarea id="preferences-modal" oninput="updatePreferencesDetectedHint()" style="width:100%;padding:10px;border:1px solid var(--border-light);border-radius:4px;font-size:14px;height:80px;font-family:monospace" placeholder="π.χ. Όχι κόκκινο κρέας, Περισσότερο ψάρι">'+(c.preferences||'')+'</textarea>'
    +'<div id="preferences-detected-hint" style="font-size:11px;color:#025857;margin-top:6px"></div>'
    +'<div style="font-size:10px;color:var(--text-muted);margin-top:2px">Μόνο ρητές φράσεις αποφυγής (π.χ. «Όχι…», «Αποφυγή…») μετατρέπονται αυτόματα σε αποκλεισμό τροφίμων — όλα τα άλλα παραμένουν απλή σημείωση.</div>'
    +'</div>'
    +'<div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="closeDietModal()" style="padding:10px 20px;background:#eee;border:none;border-radius:6px;cursor:pointer">❌ Κλείσιμο</button>'
    +'<button onclick="saveDietSettings()" style="padding:10px 20px;background:#025857;color:white;border:none;border-radius:6px;cursor:pointer">✅ Αποθήκευση</button>'
    +'</div>'
    +'</div>'
    +'</div>';

  var overlay=document.createElement('div');
  overlay.innerHTML=html;
  overlay.id='dietModal';
  document.body.appendChild(overlay);
  updatePreferencesDetectedHint();
}

// Δείχνει στον διαιτολόγο, ζωντανά καθώς γράφει, ποια τρόφιμα εντόπισε το parsePreferenceAvoidFoods
// (js/app-part2.js) στο ελεύθερο κείμενο — ώστε ο αυτόματος αποκλεισμός να μην είναι μαύρο κουτί.
function updatePreferencesDetectedHint(){
  var ta=document.getElementById('preferences-modal');
  var hint=document.getElementById('preferences-detected-hint');
  if(!ta||!hint)return;
  var foods=parsePreferenceAvoidFoods(ta.value);
  hint.textContent=foods.length?('🔍 Εντοπίστηκε αποφυγή: '+foods.join(', ')):'';
}

function closeDietModal(){
  var m=document.getElementById('dietModal');
  if(m)m.remove();
}

function saveDietSettings(){
  var c=getC();if(!c)return;

  c.dietType=document.getElementById('dietType-modal').value;
  // ✅ FIX: Only sync exclusions when the Food Picker is actually open in the DOM.
  // Otherwise the picker checkboxes don't exist, the query returns 0, and we would
  // wipe c.foodExclude — destroying exclusions the user already saved via the picker.
  var pickerBoxes=document.querySelectorAll('[data-food-excl]');
  if(pickerBoxes.length){
    var selectedExclusions=[];
    pickerBoxes.forEach(function(cb){ if(cb.checked) selectedExclusions.push(cb.value); });
    c.foodExclude=selectedExclusions;
  }
  c.preferences=document.getElementById('preferences-modal').value;

  // ✅ Per-day diet exceptions (e.g. fish allowed on a fasting feast day) — only present in the
  // DOM when the current dietType has forbidden categories (buildDietExceptionsHtml).
  var excBoxes=document.querySelectorAll('[data-exc-day]');
  if(excBoxes.length){
    var byDay={};
    excBoxes.forEach(function(cb){
      if(!cb.checked)return;
      var d=cb.getAttribute('data-exc-day');
      var cat=cb.getAttribute('data-exc-cat');
      if(!byDay[d])byDay[d]=[];
      byDay[d].push(cat);
    });
    c.dietExceptionDays=byDay;
  }

  // ✅ Apply the just-saved exclusions/diet-type rules to the ALREADY-generated plan too, not
  // just the next full regenerate — see scrubExcludedFoodsFromWeekPlan (js/app-part2.js) for why.
  if(c.weekPlan && Object.keys(c.weekPlan).length){
    scrubExcludedFoodsFromWeekPlan(c.weekPlan, buildEffectiveExclusionList(c));
    applyDietTypeCategorySafetyNet(c.weekPlan, c.dietType, c.dietExceptionDays, c.dietFoodExceptionDays);
  }

  save();
  closeDietModal();
  showSuccessToast('✅ Διατροφικές ρυθμίσεις αποθηκεύτηκαν!');
  renderMain();
}

// Per-day FOOD-level exceptions (finer than the category grid in buildDietExceptionsHtml —
// e.g. only "Χταπόδι" allowed on a given day, not the whole Ψάρια category). Only foods from
// the client's dietType's forbidden categories are listed (picking a day-exception for a food
// that's already allowed every day would be meaningless). Stored separately from
// c.dietExceptionDays (category-level) as c.dietFoodExceptionDays — {dayIndex:[foodName,...]} —
// so the two UIs (Διατροφή modal's grid vs this food-picker tab) never clobber each other.
function buildFoodDayExceptionsHtml(c){
  var cats=DIET_TYPE_FORBIDDEN_CATS[c.dietType];
  if(!cats||!cats.length){
    return '<div style="padding:20px;color:var(--text-muted);font-style:italic;text-align:center">Δεν ισχύουν εξαιρέσεις για τον τύπο διατροφής «'+esc(c.dietType||'normal')+'».</div>';
  }
  var dayAbbr=DAYS.map(function(d){return d.substring(0,3);});
  var exc=c.dietFoodExceptionDays||{};
  var html='<div style="font-size:11px;color:#666;margin-bottom:10px">Τσέκαρε τις μέρες που επιτρέπεται ΣΥΓΚΕΚΡΙΜΕΝΑ αυτό το τρόφιμο (π.χ. μόνο «Χταπόδι» σε γιορτή, όχι όλη η κατηγορία Ψάρια).</div>';
  cats.forEach(function(cat){
    var foodsInCat=Object.keys(FOODS).filter(function(n){return FOODS[n]&&FOODS[n].cat===cat;}).sort();
    if(!foodsInCat.length)return;
    html+='<div style="margin-bottom:16px">'
      +'<div style="font-weight:700;color:#025857;padding:8px 10px;background:#E2EEE5;border-radius:6px;margin-bottom:8px">📁 '+esc(cat)+'</div>';
    foodsInCat.forEach(function(foodName){
      html+='<div style="display:flex;align-items:center;gap:10px;padding:5px 8px;border-bottom:1px solid #f0f0f0">'
        +'<span style="font-size:12px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(foodName)+'</span>'
        +'<div style="display:flex;gap:4px">';
      dayAbbr.forEach(function(abbr,d){
        var allowed=(exc[d]||exc[String(d)]||[]).indexOf(foodName)!==-1;
        html+='<label title="'+DAYS[d]+'" style="display:flex;flex-direction:column;align-items:center;font-size:9px;color:#666;cursor:pointer">'
          +abbr
          +'<input type="checkbox" data-food-day-exc="'+esc(foodName)+'" data-food-day-exc-day="'+d+'" '+(allowed?'checked':'')+' style="width:13px;height:13px;cursor:pointer;margin-top:2px">'
          +'</label>';
      });
      html+='</div></div>';
    });
    html+='</div>';
  });
  return html;
}

// ✅ MODAL 7: FOOD PICKER (for exclusions + per-day food exceptions)
function openFoodPickerModal(){
  var c=getC();if(!c)return;

  // Organize foods by category
  var foodsByCategory={};
  for(var foodName in FOODS){
    var food=FOODS[foodName];
    var cat=food.cat||'Άλλα';
    if(!foodsByCategory[cat])foodsByCategory[cat]=[];
    foodsByCategory[cat].push(foodName);
  }

  var hasExceptionTab=!!(DIET_TYPE_FORBIDDEN_CATS[c.dietType]&&DIET_TYPE_FORBIDDEN_CATS[c.dietType].length);

  var html='<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1002;" id="foodPickerOverlay" onclick="if(event.target===this)closeFoodPickerModal()">'
    +'<div style="background:var(--card-bg);border-radius:12px;padding:20px;max-width:700px;width:90%;max-height:90vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.3)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:2px solid #025857;padding-bottom:10px">'
    +'<h2 style="margin:0;color:#025857;font-size:18px">🚫 Αποκλεισμοί Τροφών</h2>'
    +'<button onclick="closeFoodPickerModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted)">&times;</button>'
    +'</div>'

    +(hasExceptionTab
      ?'<div style="display:flex;gap:6px;margin-bottom:15px;border-bottom:1px solid #eee">'
        +'<button id="fp-tab-btn-excl" onclick="switchFoodPickerTab(\'excl\')" style="padding:8px 14px;border:none;background:none;border-bottom:2px solid #025857;color:#025857;font-weight:600;cursor:pointer;font-size:13px">🚫 Αποκλεισμοί</button>'
        +'<button id="fp-tab-btn-dayexc" onclick="switchFoodPickerTab(\'dayexc\')" style="padding:8px 14px;border:none;background:none;border-bottom:2px solid transparent;color:#666;font-weight:600;cursor:pointer;font-size:13px">📅 Εξαιρέσεις ημέρας</button>'
        +'</div>'
      :'')

    +'<div id="fp-tab-excl">'
    +'<div style="margin-bottom:15px">'
    +'<input type="text" id="foodSearch" placeholder="🔍 Αναζήτησε τρόφιμο..." style="width:100%;padding:12px;border:1px solid var(--border-light);border-radius:6px;font-size:14px" oninput="filterFoodPicker(this.value)">'
    +'</div>'

    +'<div style="margin-bottom:15px;max-height:300px;overflow-y:auto" id="foodPickerContent">'
    +'</div>'

    +'<div style="border-top:2px solid #ddd;padding-top:15px;margin-top:15px">'
    +'<label style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:10px">✅ ΕΠΙΛΕΓΜΕΝΑ:</label>'
    +'<div id="selectedFoodsChips" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:15px"></div>'
    +'</div>'
    +'</div>'

    +'<div id="fp-tab-dayexc" style="display:none;max-height:400px;overflow-y:auto">'
    +(hasExceptionTab?buildFoodDayExceptionsHtml(c):'')
    +'</div>'

    +'<div style="display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="closeFoodPickerModal()" style="padding:10px 20px;background:#eee;border:none;border-radius:6px;cursor:pointer">❌ Κλείσιμο</button>'
    +'<button onclick="saveFoodExclusions()" style="padding:10px 20px;background:#025857;color:white;border:none;border-radius:6px;cursor:pointer">✅ Αποθήκευση</button>'
    +'</div>'
    +'</div>'
    +'</div>';

  var overlay=document.createElement('div');
  overlay.innerHTML=html;
  overlay.id='foodPickerModal';
  document.body.appendChild(overlay);

  // Render all categories
  var categories=Object.keys(foodsByCategory).sort();
  var contentHtml='';
  categories.forEach(function(cat){
    contentHtml+='<div style="margin-bottom:20px">'
      +'<div style="font-weight:700;color:#025857;padding:10px;background:#E2EEE5;border-radius:6px;margin-bottom:10px">📁 '+cat+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-left:10px">';

    foodsByCategory[cat].forEach(function(foodName){
      var isSelected=(c.foodExclude||[]).includes(foodName);
      contentHtml+='<label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:6px;border-radius:4px;transition:all 0.2s" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'\'">'
        +'<input type="checkbox" data-food-excl value="'+foodName+'" '+(isSelected?'checked':'')+' style="width:16px;height:16px;cursor:pointer" onchange="updateFoodChips()">'
        +'<span style="font-size:13px">'+foodName+'</span>'
        +'</label>';
    });

    contentHtml+='</div></div>';
  });

  document.getElementById('foodPickerContent').innerHTML=contentHtml;
  updateFoodChips();
}

function switchFoodPickerTab(tab){
  var exclDiv=document.getElementById('fp-tab-excl');
  var dayexcDiv=document.getElementById('fp-tab-dayexc');
  var exclBtn=document.getElementById('fp-tab-btn-excl');
  var dayexcBtn=document.getElementById('fp-tab-btn-dayexc');
  if(!exclDiv||!dayexcDiv)return;
  exclDiv.style.display=(tab==='excl')?'block':'none';
  dayexcDiv.style.display=(tab==='dayexc')?'block':'none';
  if(exclBtn)exclBtn.style.borderBottomColor=(tab==='excl')?'#025857':'transparent';
  if(exclBtn)exclBtn.style.color=(tab==='excl')?'#025857':'#666';
  if(dayexcBtn)dayexcBtn.style.borderBottomColor=(tab==='dayexc')?'#025857':'transparent';
  if(dayexcBtn)dayexcBtn.style.color=(tab==='dayexc')?'#025857':'#666';
}

function closeFoodPickerModal(){
  var m=document.getElementById('foodPickerModal');
  if(m)m.remove();
}

function filterFoodPicker(query){
  var checkboxes=document.querySelectorAll('[data-food-excl]');
  var q=query.toLowerCase();
  checkboxes.forEach(function(cb){
    var label=cb.value.toLowerCase();
    var parentLabel=cb.closest('label');
    if(parentLabel){
      parentLabel.style.display=label.includes(q)?'flex':'none';
    }
  });
}

function updateFoodChips(){
  var selected=[];
  document.querySelectorAll('[data-food-excl]:checked').forEach(function(cb){
    selected.push(cb.value);
  });

  var chipsHtml='';
  selected.forEach(function(food){
    chipsHtml+='<div style="background:#025857;color:white;padding:6px 12px;border-radius:16px;display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600">'
      +food
      +'<button onclick="removeFoodExclusion(\''+food+'\')" style="background:none;border:none;color:white;cursor:pointer;font-size:16px;padding:0">×</button>'
      +'</div>';
  });

  document.getElementById('selectedFoodsChips').innerHTML=chipsHtml||'<div style="color:var(--text-muted);font-style:italic">Δεν έχεις επιλέξει κανένα τρόφιμο</div>';
}

function removeFoodExclusion(foodName){
  var cb=document.querySelector('[data-food-excl][value="'+foodName+'"]');
  if(cb)cb.checked=false;
  updateFoodChips();
}

function saveFoodExclusions(){
  var c=getC();if(!c)return;

  var selected=[];
  document.querySelectorAll('[data-food-excl]:checked').forEach(function(cb){
    selected.push(cb.value);
  });

  c.foodExclude=selected;

  // ✅ Per-day FOOD-level exceptions (finer-grained sibling of c.dietExceptionDays' category
  // grid — see buildFoodDayExceptionsHtml). Stored under its own key so this save never clobbers
  // the category-level exceptions set via the Διατροφή modal, and vice versa.
  var dayExcBoxes=document.querySelectorAll('[data-food-day-exc]');
  if(dayExcBoxes.length){
    var byDay={};
    dayExcBoxes.forEach(function(cb){
      if(!cb.checked)return;
      var foodName=cb.getAttribute('data-food-day-exc');
      var d=cb.getAttribute('data-food-day-exc-day');
      if(!byDay[d])byDay[d]=[];
      byDay[d].push(foodName);
    });
    c.dietFoodExceptionDays=byDay;
  }

  // ✅ Apply immediately to the already-generated plan too (see saveDietSettings for why —
  // otherwise a food just excluded here keeps showing in the plan until the next regenerate).
  if(c.weekPlan && Object.keys(c.weekPlan).length){
    scrubExcludedFoodsFromWeekPlan(c.weekPlan, buildEffectiveExclusionList(c));
    applyDietTypeCategorySafetyNet(c.weekPlan, c.dietType, c.dietExceptionDays, c.dietFoodExceptionDays);
  }

  save();
  closeFoodPickerModal();
  showSuccessToast('✅ Αποκλεισμοί τροφών αποθηκεύτηκαν! ('+(selected.length)+' τρόφιμα)');

  // The underlying Διατροφή modal (if still open behind this one) built its exclusion-count
  // button/summary text from the OLD c.foodExclude at open time — refresh it so it doesn't
  // keep showing a stale count/list after this save.
  if(document.getElementById('dietModal')){
    closeDietModal();
    openDietModal();
  }
}

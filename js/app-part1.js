/* Fiber target (g/day) — DRI Adequate Intake by age & sex */
function getFiberTarget(age,sex){
  age=age||30;sex=sex||'M';
  if(age<4)return 19;
  if(age<9)return 25;
  if(age<14)return sex==='M'?31:26;
  if(age<19)return sex==='M'?38:26;
  if(sex==='M')return age<=50?38:30;
  return age<=50?25:21;
}

// ── Calculate micronutrient totals for a day ──────────────────────────────────
function getDayMicronutrients(meals){
  var result={Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0,VitD:0};
  (meals||[]).forEach(function(meal){
    (meal.foods||[]).forEach(function(food){
      var mn=MICRONUTRIENTS[resolveFood(food.n)];
      if(mn){
        result.Fe+=(mn.Fe||0)*food.g/100;
        result.Zn+=(mn.Zn||0)*food.g/100;
        result.Mg+=(mn.Mg||0)*food.g/100;
        result.Ca+=(mn.Ca||0)*food.g/100;
        result.B1+=(mn.B1||0)*food.g/100;
        result.B2+=(mn.B2||0)*food.g/100;
        result.B3+=(mn.B3||0)*food.g/100;
        result.B6+=(mn.B6||0)*food.g/100;
        result.B12+=(mn.B12||0)*food.g/100;
        result.Folate+=(mn.Folate||0)*food.g/100;
        result.Omega3+=(mn.Omega3||0)*food.g/100;
        result.Omega6+=(mn.Omega6||0)*food.g/100;
        result.Iodine+=(mn.Iodine||0)*food.g/100;
        result.Choline+=(mn.Choline||0)*food.g/100;
        result.DHA+=(mn.DHA||0)*food.g/100;
        result.VitD+=(mn.VitD||0)*food.g/100;
      }
    });
  });
  return result;
}

// Maps the short food-intake keys (Fe/Zn/Mg/Ca/... — used by MICRONUTRIENTS/getDayMicronutrients)
// to the full-name keys getMicronutrientTargets() actually returns (iron/zinc/magnesium/calcium/...).
// A plain key.toLowerCase() only happens to work for the B-vitamins/folate/omega/iodine/choline/dha
// (their abbreviation lowercased already equals their target key) — it silently fails for Fe/Zn/Mg/Ca,
// which caused those 4 to always fall back to an empty {} target and read as a fabricated 100%/"OK"
// regardless of real intake. See dietologist-pending-work memory, 2026-07-15.
var MICRONUTRIENT_KEY_MAP={
  Fe:'iron',Zn:'zinc',Mg:'magnesium',Ca:'calcium',
  B1:'b1',B2:'b2',B3:'b3',B6:'b6',B12:'b12',
  Folate:'folate',Omega3:'omega3',Omega6:'omega6',
  Iodine:'iodine',Choline:'choline',DHA:'dha',VitD:'vitaminD'
};

// ── Check micronutrient adequacy for the day ────────────────────────────────
function checkMicronutrientAdequacy(dayMN,targets,useAthletic){
  var result={};
  ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA','VitD'].forEach(function(key){
    var tgt=targets[MICRONUTRIENT_KEY_MAP[key]]||{};
    var target=useAthletic?tgt.athletic:tgt.target;
    var actual=dayMN[key]||0;
    var pct=target?Math.round(actual/target*100):100;
    result[key]={actual:actual,target:target,pct:pct,status:pct>=90?'ok':pct>=65?'low':'critical'};
  });
  return result;
}

// ✅ SMART MICRONUTRIENT GAP ANALYSIS - PART 1: WEEKLY ANALYZER
function getWeekMicronutrients(weekPlan){
  // INPUT: 7-day meal plan (weekPlan[0-6] each with meals)
  // OUTPUT: Weekly aggregate {Fe: 126, Ca: 8400, ...} and daily averages

  var weekTotals={Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0,VitD:0};
  var dailyAverage={};

  for(var d=0;d<7;d++){
    var dayMN=getDayMicronutrients(weekPlan[d]||[]); // Reuse existing function
    Object.keys(dayMN).forEach(function(nutrient){
      weekTotals[nutrient]+=dayMN[nutrient];
    });
  }

  // Calculate 7-day averages
  Object.keys(weekTotals).forEach(function(nutrient){
    dailyAverage[nutrient]=Math.round(weekTotals[nutrient]/7);
  });

  return {
    weekTotals: weekTotals,    // Sum across 7 days
    dailyAverage: dailyAverage // Average per day
  };
}

// ✅ SMART MICRONUTRIENT GAP ANALYSIS - PART 2: GAP DETECTOR
function detectMicronutrientGaps(weekAnalysis, c){
  // INPUT: weekAnalysis (from Part 1), client profile c
  // OUTPUT: Array of gaps with priority, deficiency level, recommended supplement

  var targets=getMicronutrientTargets(c); // Reuse existing (Line 1503)
  var isAthlete=c.trainDays&&c.trainDays.filter(function(x){return x;}).length>=3;

  var gaps=[]; // Array of {nutrient, target, actual, gap, percent, severity, recommendedDose}

  // Map micronutrient keys to target object keys
  var keyMap={'Fe':'iron','Zn':'zinc','Mg':'magn','Ca':'calcium','B1':'b1','B3':'b3','B6':'b6','B12':'b12','D3':'vit_d3','Omega3':'omega3','Folate':'folate'};

  Object.keys(targets).forEach(function(tgtKey){
    var tgt=targets[tgtKey];
    // Use science-based adjusted targets if available (vegan, altitude, sport-specific)
    var useTarget=tgt.adjusted||tgt.athletic||tgt.target;
    var mnKey=tgtKey.substring(0,1).toUpperCase()+tgtKey.substring(1); // Fe, Zn, etc.

    // Handle special keys
    if(tgtKey==='iron')mnKey='Fe';
    else if(tgtKey==='zinc')mnKey='Zn';
    else if(tgtKey==='magnesium')mnKey='Mg';
    else if(tgtKey==='calcium')mnKey='Ca';
    else if(tgtKey==='b1')mnKey='B1';
    else if(tgtKey==='b3')mnKey='B3';
    else if(tgtKey==='b6')mnKey='B6';
    else if(tgtKey==='b12')mnKey='B12';
    else if(tgtKey==='folate')mnKey='Folate';
    else if(tgtKey==='omega3')mnKey='Omega3';
    else if(tgtKey==='vitaminD')mnKey='VitD';
    else if(tgtKey==='vit_d3')mnKey='D3'; // dead: no target key is ever actually named 'vit_d3' (that's a SUPPS catalog id, not a targets key)
    // 'dha' would default to 'Dha' (only first letter capitalized) via the generic rule above,
    // which never matches the all-caps 'DHA' key weekTotals/dailyAverage actually use (see
    // weekTotals init a few lines up in getWeekMicronutrients) — so DHA intake always read as 0
    // regardless of real diet content, same bug class as the other explicit overrides here.
    else if(tgtKey==='dha')mnKey='DHA';

    var actual=weekAnalysis.dailyAverage[mnKey]||0;
    var pct=Math.round(actual/useTarget*100);

    if(pct<80){ // Gap threshold: <80% is a gap
      var severity=pct<50?'critical':pct<65?'low':'moderate';

      gaps.push({
        nutrient: tgt.label,           // e.g., "Iron (Fe)"
        key: mnKey,                    // e.g., "Fe" (for supplement matching)
        target: useTarget,             // Science-adjusted or athletic or base
        unit: tgt.unit,
        actual: Math.round(actual*10)/10,
        gap: Math.round((useTarget-actual)*10)/10,       // How much is missing
        percent: pct,                  // % of target achieved
        severity: severity,            // critical/low/moderate
        notes: tgt.notes,
        supplementRequired: tgt.supplementRequired // e.g., B12 for vegans
      });
    }
  });

  // Sort by severity (critical first)
  gaps.sort(function(a,b){
    var severity_order={'critical':0,'low':1,'moderate':2};
    return severity_order[a.severity]-severity_order[b.severity];
  });

  return gaps;
}

// ✅ SMART MICRONUTRIENT GAP ANALYSIS - PART 3: SUPPLEMENT MATCHER & DOSER
function matchSupplementsToGaps(gaps, supp_opts){
  // INPUT: gaps array (from Part 2), supplement options (SUPPS)
  // OUTPUT: Recommended supplements with dosages and interactions flagged

  var nutrient_to_supplement={
    'Fe': 'iron',
    'Zn': 'zinc',
    'Mg': 'magn',
    'Ca': 'calc',
    'B1': 'bcomplex',
    'B3': 'bcomplex',
    'B6': 'bcomplex',
    'B12': 'bcomplex',
    // detectMicronutrientGaps() always names this gap 'VitD' (see the vitaminD→VitD override
    // a few lines up in that function) — this key used to be 'D3', which never matched, so
    // Vitamin D deficiencies silently never got a supplement recommendation.
    'VitD': 'vit_d3',
    'Omega3': 'omega3',
    'Folate': 'multivit',
    // Iodine has no dedicated SUPPS entry — same 'multivit' catch-all already used for Folate above.
    'Iodine': 'multivit',
    // DHA is covered by the same fish-oil product as Omega3 (ALA) — 'omega3' already stocks EPA/DHA.
    'DHA': 'omega3'
  };

  var recommendations=[];

  gaps.forEach(function(gap){
    var supp_id=nutrient_to_supplement[gap.key];
    if(!supp_id)return; // No supplement available for this nutrient

    // Find supplement in SUPPS array
    var supp=null;
    for(var i=0;i<SUPPS.length;i++){
      if(SUPPS[i].id===supp_id){supp=SUPPS[i];break;}
    }
    if(!supp)return;

    // Calculate dosage based on gap size
    var dose=calculateOptimalDose(gap, supp);

    recommendations.push({
      supplement: supp.name,
      supplement_id: supp.id,
      nutrient: gap.nutrient,
      gap: gap.gap,
      unit: gap.unit,
      actual: gap.actual,
      target: gap.target,
      recommendedDose: dose,
      timing: supp.timing[0]||{t:'Με το πρωινό',d:dose},
      severity: gap.severity,
      reason: gap.gap.toFixed(1)+' '+gap.unit+' missing from diet'
    });
  });

  // Flag interactions (e.g., Zn and Ca shouldn't be at same time)
  flagSupplementInteractions(recommendations);

  return recommendations;
}

function calculateOptimalDose(gap, supplement){
  // BASE DOSE: designed to fill 50-70% of gap
  var fillPercent=0.65;
  var optimalDose=Math.round(gap.gap*fillPercent);

  // CLAMP to safe ranges per nutrient
  var safe_ranges={
    'iron': {min:8,max:45},
    'zinc': {min:8,max:40},
    'magn': {min:200,max:420},
    'calc': {min:1000,max:2000},
    // mcg, not IU — gap.gap/gap.unit for Vitamin D are mcg-scale (NUTRIENT_UNITS.vitaminD),
    // matching the SUPPS 'vit_d3' generic label of "1000-4000 IU" (1 mcg = 40 IU: 25-100mcg).
    // Was previously {min:1000,max:4000} in IU, which — mixed with an mcg-scale gap — meant
    // every Vitamin D recommendation clamped to a mislabeled "1000 mcg" (≈40,000 IU, well
    // past the safe upper limit).
    'vit_d3': {min:25,max:100},
    'omega3': {min:500,max:3000},
    'bcomplex': {min:1,max:100},
    'multivit': {min:1,max:2}
  };

  if(safe_ranges[supplement.id]){
    var range=safe_ranges[supplement.id];
    optimalDose=Math.max(range.min, Math.min(range.max, optimalDose));
  }

  return optimalDose;
}

function flagSupplementInteractions(recommendations){
  // Flag known interactions
  var interactions={
    'zinc': ['calc','iron'],
    'calc': ['zinc','iron'],
    'iron': ['calc','zinc','magn']
  };

  recommendations.forEach(function(rec){
    rec.interactions=[];
    if(interactions[rec.supplement_id]){
      var conflicting=[];
      for(var i=0;i<recommendations.length;i++){
        var r=recommendations[i];
        if(r.supplement_id!==rec.supplement_id){
          for(var j=0;j<interactions[rec.supplement_id].length;j++){
            if(interactions[rec.supplement_id][j]===r.supplement_id){
              conflicting.push(r.supplement);
              break;
            }
          }
        }
      }
      if(conflicting.length>0){
        rec.interactions=conflicting;
        rec.timing_note='Take at different times (2+ hours apart)';
      }
    }
  });
}


// NORMALIZE GREEK TEXT: Remove accents/diacritics for food exclusion matching
// This ensures "Αυγά" matches "αυγών" by removing accent differences
function normalizeGreekText(text) {
  if (!text) return '';

  // Greek accent/diacritic mappings
  var accentMap = {
    'ά': 'α', 'έ': 'ε', 'ή': 'η', 'ί': 'ι', 'ό': 'ο', 'ύ': 'υ', 'ώ': 'ω',
    'Ά': 'Α', 'Έ': 'Ε', 'Ή': 'Η', 'Ί': 'Ι', 'Ό': 'Ο', 'Ύ': 'Υ', 'Ώ': 'Ω',
    'ΐ': 'ι', 'ΰ': 'υ', 'ϊ': 'ι', 'ϋ': 'υ'
  };

  var normalized = text.toLowerCase();
  for (var accented in accentMap) {
    normalized = normalized.replace(new RegExp(accented, 'g'), accentMap[accented]);
  }
  return normalized;
}


// ══════════════════════════════════════════════════════════════════════════════
// CHEF-INSPIRED MEAL RECIPES — Culinary-sensible combinations
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
// SNACK RECIPES — Κατάλληλα για Ενδιάμεσα Γεύματα (ΜΟΝΟ! Όχι κύρια)
// ══════════════════════════════════════════════════════════════════════════════

// Maps each food category to the macro it primarily contributes
// Used by scalePlan for per-macro scaling


/* ===== Γρήγορες ενέργειες πλαϊνής μπάρας: Νέο πλάνο / Γρήγορη μέτρηση ===== */
function closeAllQA(){
  ['qa-newplan','qa-quickmeasure','qa-quickappt'].forEach(function(p){
    var panel=document.getElementById(p);
    var btn=document.getElementById('qa-toggle-'+p.replace('qa-',''));
    if(panel) panel.style.display='none';
    if(btn) btn.setAttribute('aria-expanded','false');
  });
}

function toggleQA(id){
  var panel=document.getElementById(id);
  var wasOpen = panel && panel.style.display==='block';
  closeAllQA();
  if(!wasOpen && panel){
    panel.style.display='block';
    var btn=document.getElementById('qa-toggle-'+id.replace('qa-',''));
    if(btn) btn.setAttribute('aria-expanded','true');
    var inp=document.getElementById(id+'-input');
    if(inp){ inp.value=''; inp.focus(); }
    if(id==='qa-newplan') renderQANewPlan('');
    else if(id==='qa-quickmeasure') renderQAQuickMeasure('');
    else renderQAQuickAppt('');
  }
}

function qaMatchingClients(q){
  q=(q||'').toLowerCase().trim();
  return clients.filter(function(c){
    return !c.deleted && !c.archived && (!q || (c.name||'').toLowerCase().indexOf(q)>-1);
  }).sort(function(a,b){ return (a.name||'').localeCompare(b.name||'','el'); });
}

function qaPlanStatusText(c){
  if(!c.weekPlan || !Object.keys(c.weekPlan).length) return 'χωρίς πλάνο';
  if(window.Cloud && window.Cloud.isStale && window.Cloud.isStale(c)) return 'ο σύνδεσμος είναι ξεπερασμένος';
  return 'έχει ενεργό πλάνο';
}

function renderQANewPlan(q){
  var results=document.getElementById('qa-newplan-results'); if(!results) return;
  var list=qaMatchingClients(q), html='';
  list.forEach(function(c){
    html+='<div class="qa-row" onclick="qaStartPlan(\''+c.id+'\')"><span>'+esc(c.name||'Νέος πελάτης')+'</span><span class="qa-row-sub">'+qaPlanStatusText(c)+'</span></div>';
  });
  html+='<div class="qa-row qa-row-new" onclick="qaCreateAndPlan(document.getElementById(\'qa-newplan-input\').value)">+ Δημιούργησε νέο πελάτη'+(q?' «'+esc(q)+'»':'')+'</div>';
  results.innerHTML=html;
}

function renderQAQuickMeasure(q){
  var results=document.getElementById('qa-quickmeasure-results'); if(!results) return;
  var list=qaMatchingClients(q), html='';
  list.forEach(function(c){
    var sub = (c.weightLog && c.weightLog.length) ? ('τελ. μέτρηση '+c.weightLog[c.weightLog.length-1].date) : 'καμία μέτρηση ακόμα';
    html+='<div class="qa-row" onclick="qaStartMeasure(\''+c.id+'\')"><span>'+esc(c.name||'Νέος πελάτης')+'</span><span class="qa-row-sub">'+sub+'</span></div>';
  });
  html+='<div class="qa-row qa-row-new" onclick="qaCreateAndMeasure(document.getElementById(\'qa-quickmeasure-input\').value)">+ Δημιούργησε νέο πελάτη'+(q?' «'+esc(q)+'»':'')+'</div>';
  results.innerHTML=html;
}

function qaStartPlan(id){
  selectClient(id);
  genPlanWithUndo();
  closeAllQA();
}
function qaCreateAndPlan(name){
  addClient(name);
  genPlanWithUndo();
  closeAllQA();
}
function qaStartMeasure(id){
  selectClient(id);
  swTab(3);
  closeAllQA();
}
function qaCreateAndMeasure(name){
  addClient(name);
  swTab(3);
  closeAllQA();
}

function renderQAQuickAppt(q){
  var results=document.getElementById('qa-quickappt-results'); if(!results) return;
  var list=qaMatchingClients(q), html='';
  list.forEach(function(c){
    var lastAppt = c.appointments && c.appointments.length ? c.appointments[c.appointments.length-1] : null;
    var sub = lastAppt ? ((clientHasFlaggedAppointment(c)?'🚩 ':'')+'τελ. ραντεβού '+lastAppt.date) : 'καμία καταχώρηση ακόμα';
    html+='<div class="qa-row" onclick="qaStartAppt(\''+c.id+'\')"><span>'+esc(c.name||'Νέος πελάτης')+'</span><span class="qa-row-sub">'+sub+'</span></div>';
  });
  html+='<div class="qa-row qa-row-new" onclick="qaCreateAndAppt(document.getElementById(\'qa-quickappt-input\').value)">+ Δημιούργησε νέο πελάτη'+(q?' «'+esc(q)+'»':'')+'</div>';
  results.innerHTML=html;
}
function qaStartAppt(id){
  selectClient(id);
  swTab(TAB_APPOINTMENTS);
  closeAllQA();
}
function qaCreateAndAppt(name){
  addClient(name);
  swTab(TAB_APPOINTMENTS);
  closeAllQA();
}

// ✅ 2026-08-22: mobile "Περισσότερα" sheet — βλ. σχόλιο πάνω από το markup στο Dietologist.html.
// Ίδιο accordion μοτίβο με toggleQA/closeAllQA (πάνω), αλλά σε δικά του msheet-qa-* ids ώστε να μη
// συγκρούεται με τα ήδη υπάρχοντα ids του πλαϊνού μενού — και τα δύο σετ στοιχείων συνυπάρχουν στο
// DOM ταυτόχρονα (το πλαϊνό είναι απλά display:none σε κινητό, όχι αφαιρεμένο).
function toggleMoreSheet(){
  var sheet=document.getElementById('more-sheet');
  if(sheet && sheet.style.display==='block') closeMoreSheet(); else openMoreSheet();
}
// ✅ 2026-08-22: a11y polish — Escape κλείνει το sheet, το focus μπαίνει σε αυτό όταν ανοίγει και
// επιστρέφει στο κουμπί "Περισσότερα" όταν κλείνει (πληκτρολόγιο/screen reader, ήταν εντελώς
// mouse/touch-only πριν). _moreSheetEscHandler κρατιέται σε module scope ώστε το removeEventListener
// στο closeMoreSheet να αφαιρεί ΑΚΡΙΒΩΣ τον listener που πρόσθεσε το openMoreSheet — ένα ανώνυμο
// function σε κάθε toggle θα άφηνε πολλαπλά "σκουπίδια" listeners στο document.
var _moreSheetEscHandler=null;
function openMoreSheet(){
  var sheet=document.getElementById('more-sheet'), scrim=document.getElementById('more-scrim'), btn=document.getElementById('more-nav-btn');
  if(!sheet||!scrim) return;
  sheet.style.display='block';
  scrim.style.display='block';
  if(btn) btn.setAttribute('aria-expanded','true');
  sheet.focus();
  _moreSheetEscHandler=function(e){ if(e.key==='Escape') closeMoreSheet(); };
  document.addEventListener('keydown',_moreSheetEscHandler);
}
function closeMoreSheet(){
  var sheet=document.getElementById('more-sheet'), scrim=document.getElementById('more-scrim'), btn=document.getElementById('more-nav-btn');
  var wasOpen = sheet && sheet.style.display==='block';
  if(sheet) sheet.style.display='none';
  if(scrim) scrim.style.display='none';
  if(btn) btn.setAttribute('aria-expanded','false');
  closeAllMSheetQA();
  if(_moreSheetEscHandler){ document.removeEventListener('keydown',_moreSheetEscHandler); _moreSheetEscHandler=null; }
  if(wasOpen && btn) btn.focus();
}
function closeAllMSheetQA(){
  ['newplan','quickmeasure','quickappt'].forEach(function(k){
    var panel=document.getElementById('msheet-qa-'+k);
    var btn=document.getElementById('msheet-qa-toggle-'+k);
    if(panel) panel.style.display='none';
    if(btn) btn.setAttribute('aria-expanded','false');
  });
}
function toggleMSheetQA(kind){
  var panel=document.getElementById('msheet-qa-'+kind);
  var wasOpen = panel && panel.style.display==='block';
  closeAllMSheetQA();
  if(!wasOpen && panel){
    panel.style.display='block';
    var btn=document.getElementById('msheet-qa-toggle-'+kind);
    if(btn) btn.setAttribute('aria-expanded','true');
    var inp=document.getElementById('msheet-qa-'+kind+'-input');
    if(inp){ inp.value=''; inp.focus(); }
    renderMSheetQA(kind,'');
  }
}
// Ίδια λογική με renderQANewPlan/renderQAQuickMeasure/renderQAQuickAppt (πάνω), ενοποιημένη σε μία
// συνάρτηση με τα 3 msheet-qa-* result containers αντί να τριπλασιάζεται ο κώδικας — οι ίδιες
// qaStartPlan/qaCreateAndPlan/qaStartMeasure/qaCreateAndMeasure/qaStartAppt/qaCreateAndAppt (πάνω,
// αναλλοίωτες) κάνουν την πραγματική ενέργεια, εδώ μόνο αλλάζει πού ζωγραφίζονται τα αποτελέσματα.
function renderMSheetQA(kind,q){
  var results=document.getElementById('msheet-qa-'+kind+'-results'); if(!results) return;
  var list=qaMatchingClients(q), html='';
  var startFn = kind==='newplan'?'qaStartPlan':(kind==='quickmeasure'?'qaStartMeasure':'qaStartAppt');
  var createFn = kind==='newplan'?'qaCreateAndPlan':(kind==='quickmeasure'?'qaCreateAndMeasure':'qaCreateAndAppt');
  list.forEach(function(c){
    var sub;
    if(kind==='newplan'){ sub=qaPlanStatusText(c); }
    else if(kind==='quickmeasure'){ sub=(c.weightLog&&c.weightLog.length)?('τελ. μέτρηση '+c.weightLog[c.weightLog.length-1].date):'καμία μέτρηση ακόμα'; }
    else { var lastAppt=c.appointments&&c.appointments.length?c.appointments[c.appointments.length-1]:null; sub=lastAppt?((clientHasFlaggedAppointment(c)?'🚩 ':'')+'τελ. ραντεβού '+lastAppt.date):'καμία καταχώρηση ακόμα'; }
    html+='<div class="qa-row" onclick="'+startFn+'(\''+c.id+'\');closeMoreSheet();"><span>'+esc(c.name||'Νέος πελάτης')+'</span><span class="qa-row-sub">'+sub+'</span></div>';
  });
  html+='<div class="qa-row qa-row-new" onclick="'+createFn+'(document.getElementById(\'msheet-qa-'+kind+'-input\').value);closeMoreSheet();">+ Δημιούργησε νέο πελάτη'+(q?' «'+esc(q)+'»':'')+'</div>';
  results.innerHTML=html;
}

/* ======== TEMPLATE EDITOR ======== */
var curTmplGoal='maintain';

function selectTmpl(){
  curId=null;renderSB();
  var btn=document.getElementById('tmpl-sb-btn');
  if(btn)btn.classList.add('active');
  renderTemplateEditor();
}

function renderTemplateEditor(){
  var tabs='';
  GOAL_KEYS.forEach(function(g){
    tabs+='<button class="tmpl-goal-tab'+(g===curTmplGoal?' active':'')+'" onclick="swTmplGoal(\''+g+'\')">'+GOAL_LABELS[g]+'</button>';
  });
  // Custom templates section
  var custHtml='';
  if(customTemplates.length){
    custHtml='<div class="custom-tmpls-section">'
      +'<div class="custom-tmpls-head">⭐ Αποθηκευμένα πρότυπα ('+customTemplates.length+')</div>'
      +'<div class="custom-tmpls-list">';
    customTemplates.forEach(function(ct){
      var gl=GOAL_LABELS[ct.goal]||ct.goal;
      var db=DIET_TYPE_BADGE[ct.dietType||'normal'];
      custHtml+='<div class="custom-tmpl-item">'
        +'<div class="custom-tmpl-info">'
        +'<span class="custom-tmpl-name">'+esc(ct.name)+'</span>'
        +'<span class="custom-tmpl-meta">'+gl+(db?' · '+db:'')+' · '+esc(ct.createdAt)+(ct.clientName?' · από: '+esc(ct.clientName):'')+'</span>'
        +'</div>'
        +'<button class="met-del" onclick="deleteCustomTmpl(\''+ct.id+'\')" title="Διαγραφή">&#10005;</button>'
        +'</div>';
    });
    custHtml+='</div></div>';
  }
  var html='<div style="padding:16px 20px">'
    +'<div style="font-size:14px;font-weight:700;color:#025857;margin-bottom:10px">&#9998; Επεξεργασία προτύπων</div>'
    +custHtml
    +'<div class="tmpl-goal-tabs">'+tabs+'</div>'
    +'<div class="tmpl-info">Τα τρόφιμα και οι αναλογίες εδώ είναι η βάση κάθε νέου πλάνου. Τα γραμμάρια προσαρμόζονται αυτόματα στις θερμίδες του πελάτη.</div>'
    +'<div class="brow">'
    +'<button class="tmpl-reset-btn" onclick="resetTmpl(\''+curTmplGoal+'\')">&#8635; Επαναφορά αρχικών ('+GOAL_LABELS[curTmplGoal]+')</button>'
    +'</div>'
    +'<div class="plan-wrap"><div class="week-main"><div id="tmpl-con"></div></div>'
    +'<div class="food-lib"><div class="food-lib-title">Τρόφιμα</div>'
    +'<input class="food-lib-search" type="text" placeholder="Αναζήτηση..." oninput="filterLib(this)">'
    +'<div id="lib-list"></div></div></div></div>';
  document.getElementById('main').innerHTML=html;
  renderFoodLib('');
  renderTmplTable();
}

function swTmplGoal(g){curTmplGoal=g;renderTemplateEditor();}

function renderTmplTable(){
  var con=document.getElementById('tmpl-con');if(!con)return;
  var tmpl=TMPLS[curTmplGoal];
  var mealNames=tmpl[0].map(function(m){return m.name;});
  var html='<table class="week-table"><thead><tr><th>Γεύμα</th>';
  DAYS.forEach(function(d){html+='<th>'+d+'</th>';});
  html+='</tr></thead><tbody>';
  for(var mi=0;mi<mealNames.length;mi++){
    html+='<tr><td class="meal-label">'+mealNames[mi]+'</td>';
    for(var d=0;d<7;d++){
      var foods=tmpl[d][mi]?tmpl[d][mi].foods:[];
      html+='<td class="day-cell tmpl-cell" data-d="'+d+'" data-mi="'+mi+'">';
      foods.forEach(function(food,fi){
        var tfu=FOOD_UNITS[food.n];
        var tDisplayUnit = food.u !== undefined ? food.u : (tfu ? tfu.u : 'g');
        var tVal, tMax, tChg;
        if (tDisplayUnit === 'g' || !tfu) {
          tVal = food.g;
          tMax = 999;
          tChg = 'tmplUpdG('+d+','+mi+','+fi+',this.value)';
        } else {
          tVal = WHOLE_UNIT_FOODS[food.n]
            ? Math.max(1, Math.round(food.g / tfu.g))
            : Math.max(0.1, Math.round(food.g / tfu.g * 10) / 10);
          tMax = 10;
          tChg = 'tmplUpdG('+d+','+mi+','+fi+',this.value*'+tfu.g+')';
        }
        var tUnit = pluralUnit(tDisplayUnit, tVal);
        html+='<div class="food-chip">'
          +'<div class="chip-name-wrap">'
          +'<input class="chip-inp" type="text" value="'+food.n+'" autocomplete="off" spellcheck="false"'
          +' data-d="'+d+'" data-mi="'+mi+'" data-fi="'+fi+'" data-mode="tmpl"'
          +' oninput="showChipSug(this)" onfocus="showChipSug(this)" onblur="closeDD()">'
          +'</div>'
          +'<input class="chip-g" type="number" min="0" step="'+(tDisplayUnit==='g'||!tfu?'1':'0.1')+'" max="'+tMax+'" value="'+tVal+'" onchange="'+tChg+'">'
          +'<span class="chip-unit">'+tUnit+'</span>'
          +'<button class="chip-del" onclick="tmplDelF('+d+','+mi+','+fi+')" aria-label="Διαγραφή τροφίμου">&#10005;</button>'
          +'</div>';
      });
      html+='<button class="chip-add" onclick="tmplAddF('+d+','+mi+')">+</button></td>';
    }
    html+='</tr>';
  }
  html+='</tbody></table>';
  con.innerHTML=html;
  // drag-drop: drop food library item onto template cell
  con.querySelectorAll('.tmpl-cell').forEach(function(cell){
    cell.addEventListener('dragover',function(e){e.preventDefault();cell.classList.add('drag-over');});
    cell.addEventListener('dragleave',function(e){if(!cell.contains(e.relatedTarget))cell.classList.remove('drag-over');});
    cell.addEventListener('drop',function(e){
      e.preventDefault();cell.classList.remove('drag-over');
      var name=e.dataTransfer.getData('text/plain');
      if(!name||!FOODS[name])return;
      var dd=parseInt(cell.dataset.d),mmi=parseInt(cell.dataset.mi);
      TMPLS[curTmplGoal][dd][mmi].foods.push({n:name,g:100});
      renderTmplTable();
    });
  });
}

function tmplUpdG(d,mi,fi,v){
  var parsed=parseInt(v,10);
  if(isNaN(parsed)||parsed<0)return;
  TMPLS[curTmplGoal][d][mi].foods[fi].g=parsed;
  renderTmplTable();
}
function tmplAddF(d,mi){TMPLS[curTmplGoal][d][mi].foods.push({n:Object.keys(FOODS)[0],g:100});renderTmplTable();}
function tmplDelF(d,mi,fi){TMPLS[curTmplGoal][d][mi].foods.splice(fi,1);renderTmplTable();}
function resetTmpl(goal){
  TMPLS[goal]=deepClone(DEFAULT_TMPLS[goal]);
  renderTemplateEditor();
}

/* ── Custom Template Management ──────────────────────────────────────────── */
function buildTmplSelectorHtml(c){
  var sel=c.selectedTemplate||'';
  // c.goalMain is genuinely unset for a brand-new client until the dietitian picks a goal
  // (see the 2026-07-01 addClient() fix — it deliberately stopped prefilling a fake default).
  // Without this fallback, GOAL_LABELS[undefined]||undefined stringifies to the literal
  // text "undefined" in the option label.
  var goalLabel=GOAL_LABELS[c.goalMain]||c.goalMain||'χωρίς στόχο';
  var opts='<option value="">📋 Προεπιλεγμένο ('+goalLabel+')</option>';

  // Hide this selector on page 2 and others — only show on Tab 1
  if(typeof swTab !== 'undefined'){
    // This will be hidden by swTab logic
  }
  // Built-in calorie-level reference templates
  var kcalKeys=['kcal2000','kcal2300','kcal2500','kcal2700','kcal3000','mediterranean'];
  kcalKeys.forEach(function(k){
    opts+='<option value="__kcal_'+k+'"'+(sel==='__kcal_'+k?' selected':'')+'>📊 '+GOAL_LABELS[k]+'</option>';
  });
  // User-saved custom templates — same-diet templates first (e.g. a fasting client sees their
  // "Νηστεία" templates at the top of the list instead of buried among unrelated ones).
  var sameDietTmpls=[], otherTmpls=[];
  customTemplates.forEach(function(ct){
    ((ct.dietType||'normal')===(c.dietType||'normal') ? sameDietTmpls : otherTmpls).push(ct);
  });
  sameDietTmpls.concat(otherTmpls).forEach(function(ct){
    var gl=GOAL_LABELS[ct.goal]||ct.goal;
    var db=DIET_TYPE_BADGE[ct.dietType||'normal'];
    opts+='<option value="'+ct.id+'"'+(sel===ct.id?' selected':'')+'>⭐ '+esc(ct.name)+' — '+gl+(db?' · '+db:'')+' ('+esc(ct.createdAt)+')</option>';
  });
  // Existing clients' plans (as basis for new plans) — same-diet clients first, same reasoning.
  var clientsWithPlans=clients.filter(function(cl){
    var hasWeekPlan=Object.keys(cl.weekPlan||{}).length>0;
    return cl.id!==c.id && hasWeekPlan;
  });
  var sameDietClients=[], otherClients=[];
  clientsWithPlans.forEach(function(cl){
    ((cl.dietType||'normal')===(c.dietType||'normal') ? sameDietClients : otherClients).push(cl);
  });
  clientsWithPlans=sameDietClients.concat(otherClients);
  if(clientsWithPlans.length>0){
    opts+='<optgroup label="━━━ Υπάρχοντα πλάνα πελατών ━━━">';
    clientsWithPlans.forEach(function(cl){
      var cGoal=GOAL_LABELS[cl.goalMain]||cl.goalMain;
      var cName=cl.name||'Νέος πελάτης';
      var cdb=DIET_TYPE_BADGE[cl.dietType||'normal'];
      opts+='<option value="__client_'+cl.id+'"'+(sel==='__client_'+cl.id?' selected':'')+'>👤 '+esc(cName)+' — '+cGoal+(cdb?' · '+cdb:'')+'</option>';
    });
    opts+='</optgroup>';
  }
  return '<div class="tmpl-sel-row">'
    +'<label>📋 Βάση πλάνου:</label>'
    +'<select class="tmpl-sel-drop" onchange="selectTmplForClient(this.value)">'+opts+'</select>'
    +'</div>';
}

function showSaveTmplPanel(){
  var p=document.getElementById('save-tmpl-panel');
  if(p)p.style.display=p.style.display==='none'?'flex':'none';
}
function closeSaveTmplPanel(){
  var p=document.getElementById('save-tmpl-panel');if(p)p.style.display='none';
}
function doSaveAsTmpl(){
  var c=getC();
  if(!c||!Object.keys(c.weekPlan||{}).length){showErrorToast('Δεν υπάρχει πλάνο για αποθήκευση!');return;}
  var nameInp=document.getElementById('save-tmpl-name');
  var goalSel=document.getElementById('save-tmpl-goal');
  var name=(nameInp?nameInp.value.trim():'');
  var goal=goalSel?goalSel.value:(c.goal||'loss');
  if(!name){if(nameInp)nameInp.focus();return;}
  var days=[];
  for(var d=0;d<7;d++)days.push(deepClone(c.weekPlan[d]||[]));
  var id='ct'+Date.now();
  customTemplates.push({id:id,name:name,goal:goal,days:days,dietType:c.dietType||'normal',
    createdAt:new Date().toISOString().slice(0,10),
    clientName:c.name||''});
  save();
  closeSaveTmplPanel();
  // Brief success feedback on button
  var btn=document.querySelector('.save-tmpl-btn');
  if(btn){var orig=btn.innerHTML;btn.innerHTML='&#10003; Αποθηκεύτηκε!';btn.style.background='#2e7d32';
    setTimeout(function(){btn.innerHTML=orig;btn.style.background='';},2500);}
}

// ═══════════════════════════════════════════════════════════════
// NUTRITION PLAN HISTORY - SAVE & VIEW MACRONUTRIENT EVOLUTION
// ═══════════════════════════════════════════════════════════════
function showSavePlanPanel(){
  var c=getC();
  if(!c||!Object.keys(c.weekPlan||{}).length){showErrorToast('Δεν υπάρχει πλάνο για αποθήκευση!');return;}
  var modal=document.getElementById('savePlanModal');
  if(modal){
    modal.style.display='flex';
    var dateElem=document.getElementById('plan-save-date');
    if(dateElem)dateElem.textContent=new Date().toLocaleDateString('el-GR');
    var noteElem=document.getElementById('plan-save-note');
    if(noteElem)noteElem.value='';
  }
}

function closeSavePlanPanel(){
  var modal=document.getElementById('savePlanModal');
  if(modal)modal.style.display='none';
}

function doSavePlan(){
  var c=getC();
  if(!c||!Object.keys(c.weekPlan||{}).length){showErrorToast('Δεν υπάρχει πλάνο για αποθήκευση!');return;}

  // Initialize savedPlans if it doesn't exist
  if(!c.savedPlans)c.savedPlans=[];

  // Get macro totals for the week
  var k=0,p=0,f=0,carbs=0;
  var debugFoodCount=0;
  for(var d=0;d<7;d++){
    if(!c.weekPlan[d])continue;
    for(var mi=0;mi<c.weekPlan[d].length;mi++){
      var meal=c.weekPlan[d][mi];
      if(meal.foods){
        for(var fi=0;fi<meal.foods.length;fi++){
          var fd=meal.foods[fi];
          // Try to use pre-calculated macros first, otherwise calculate with cm()
          if(fd.k && fd.k > 0){
            k+=(fd.k||0);p+=(fd.p||0);f+=(fd.f||0);carbs+=(fd.c||0);
          } else if(fd.n && fd.g){
            // Calculate using cm() if not already calculated
            var mv=cm(fd.n,fd.g);
            k+=mv.k;p+=mv.p;f+=mv.f;carbs+=mv.c;
          }
          debugFoodCount++;
        }
      }
    }
  }

  // Debug: Log the calculation
  console.log('[SAVE PLAN] Debug info:', {
    weekPlanDays: Object.keys(c.weekPlan||{}).length,
    foodCount: debugFoodCount,
    totalK: k,
    totalP: p,
    totalF: f,
    totalCarbs: carbs
  });

  var avgDaily={k:Math.round(k/7),p:Math.round(p/7),f:Math.round(f/7),c:Math.round(carbs/7)};

  var noteElem=document.getElementById('plan-save-note');
  var note=noteElem?noteElem.value.trim():'';

  var planNum=c.savedPlans.length+1;
  var planEntry={
    id:'plan_'+Date.now(),
    number:planNum,
    date:new Date().toISOString().slice(0,10),
    time:new Date().toLocaleTimeString('el-GR'),
    note:note,
    macros:avgDaily,
    weekPlan:deepClone(c.weekPlan),
    goal:c.goal,
    dietType:c.dietType
  };

  c.savedPlans.push(planEntry);
  save();
  closeSavePlanPanel();

  // Show toast notification
  var toast=document.getElementById('autosave-toast');
  if(toast){
    toast.innerHTML='✓ Πλάνο #'+planNum+' αποθηκεύτηκε!';
    toast.style.opacity='1';
    clearTimeout(toast._ft);
    toast._ft=setTimeout(function(){toast.style.opacity='0';},2500);
  }

  // Update the plan history tab immediately
  var s4=document.getElementById('s4');
  if(s4){
    s4.innerHTML=buildPlanHistoryHtml(c);
    // Render charts after update
    setTimeout(function(){renderPlanCharts(c);},100);
  }

  // Auto-navigate to history tab to show the saved plan (with small delay to ensure HTML is updated)
  setTimeout(function(){
    swTab(4);
    console.log('[SAVE PLAN] Navigated to history tab, s4 display:', document.getElementById('s4').style.display);
  }, 50);
}

function renderPlanCharts(c){
  if(!c.savedPlans||c.savedPlans.length===0)return;
  for(var i=0;i<c.savedPlans.length;i++){
    var plan=c.savedPlans[i];
    var chartElem=document.getElementById('plan-chart-'+plan.id);
    if(!chartElem)continue;

    // Skip if chart already exists (Chart.js instance)
    if(chartElem.chart)continue;

    try{
      chartElem.chart=new Chart(chartElem,{
        type:'doughnut',
        data:{
          labels:['Πρωτεΐνες','Λίπος','Υδατάνθρακες'],
          datasets:[{
            data:[plan.macros.p*4,plan.macros.f*9,plan.macros.c*4],
            backgroundColor:['#f57c00','#d32f2f','#388e3c'],
            borderColor:'#fff',
            borderWidth:2
          }]
        },
        options:{
          responsive:true,
          maintainAspectRatio:false,
          plugins:{
            legend:{position:'bottom',labels:{font:{size:11},color:'#666',padding:10}},
            tooltip:{callbacks:{label:function(ctx){var total=ctx.dataset.data.reduce(function(a,b){return a+b;});var pct=(ctx.parsed*100/total).toFixed(1);return ctx.label+': '+ctx.parsed+' kcal ('+pct+'%)'}}}
          }
        }
      });
    }catch(e){
      console.error('Error rendering plan chart:',e);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// PLAN HISTORY HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function calculatePlanStats(plans){
  if(!plans||plans.length===0)return{count:0,avgK:0,minK:0,maxK:0,avgP:0,minP:0,maxP:0};
  var ks=plans.map(p=>(p.macros&&p.macros.k)||0);
  var ps=plans.map(p=>(p.macros&&p.macros.p)||0);
  return{
    count:plans.length,
    avgK:Math.round(ks.reduce((a,b)=>a+b)/ks.length),
    minK:Math.min(...ks),
    maxK:Math.max(...ks),
    avgP:Math.round(ps.reduce((a,b)=>a+b)/ps.length),
    minP:Math.min(...ps),
    maxP:Math.max(...ps)
  };
}

function loadPlanAsActive(planIndex){
  var c=getC();
  if(!c||!c.savedPlans||!c.savedPlans[planIndex])return;
  var plan=c.savedPlans[planIndex];
  showConfirmDialog('Φόρτωση του πλάνου #'+plan.number+' ως ενεργό; Θα αντικαταστήσει το τρέχον εβδομαδιαίο πλάνο.', function(){
    c.weekPlan=deepClone(plan.weekPlan);
    save();
    showSuccessToast('✅ Πλάνο #'+plan.number+' φορτώθηκε! Πήγαινε στο "Εβδομαδιαίο πλάνο" για να το δεις.');
    renderMain();
  }, {icon:'📥', confirmLabel:'Φόρτωση'});
}

function deletePlanFromHistory(planIndex){
  var c=getC();
  if(!c||!c.savedPlans||!c.savedPlans[planIndex])return;
  showConfirmDialog('Είσαι σίγουρος ότι θέλεις να διαγράψεις το πλάνο #'+c.savedPlans[planIndex].number+';', function(){
    c.savedPlans.splice(planIndex,1);
    save();
    var s4=document.getElementById('s4');
    if(s4)s4.innerHTML=buildPlanHistoryHtml(c);
  });
}

function duplicatePlan(planIndex){
  var c=getC();
  if(!c||!c.savedPlans||!c.savedPlans[planIndex])return;
  var original=c.savedPlans[planIndex];
  var newPlan={
    id:'plan_'+Date.now(),
    number:c.savedPlans.length+1,
    date:new Date().toISOString().slice(0,10),
    time:new Date().toLocaleTimeString('el-GR'),
    note:'[Αντιγραφή] '+original.note,
    macros:original.macros,
    weekPlan:deepClone(original.weekPlan),
    goal:original.goal,
    dietType:original.dietType
  };
  c.savedPlans.push(newPlan);
  save();
  var s4=document.getElementById('s4');
  if(s4)s4.innerHTML=buildPlanHistoryHtml(c);
  console.log('[PLAN HISTORY] Duplicated plan',planIndex);
}

function buildPlanHistoryHtml(c){
  var dbg='<div style="margin:8px 20px 0;display:flex;justify-content:flex-end">'
    +'<button class="btn tertiary" style="padding:5px 10px;font-size:11px" onclick="recoverSavedPlansFor(\''+esc((c&&c.id)||'')+'\')" title="Ελέγχει αν υπάρχουν πλάνα σε τοπικό backup που λείπουν από το ιστορικό αυτού του πελάτη">🔎 Έλεγχος για χαμένα πλάνα σε backups</button>'
    +'</div>';
  if(!c.savedPlans||c.savedPlans.length===0){
    return dbg+'<div style="padding:20px;text-align:center;color:var(--text-muted)"><div style="font-size:16px;font-weight:600;margin-bottom:10px">📊 Ιστορικό Πλάνων</div><p>Δεν υπάρχουν αποθηκευμένα πλάνα.<br>Πάτησε "Αποθήκευση Διατροφής" για να αποθηκεύσεις το πλάνο</p></div>';
  }
  try{
  return dbg+buildPlanHistoryHtmlInner(c);
  }catch(e){
    console.error('[PLAN HISTORY] Render failed:',e);
    return dbg+'<div style="padding:20px;text-align:center;color:#c62828"><div style="font-size:16px;font-weight:600;margin-bottom:10px">⚠️ Σφάλμα εμφάνισης ιστορικού πλάνων</div><p style="font-size:12px;color:#666">'+esc(e.message)+'</p></div>';
  }
}

function buildPlanHistoryHtmlInner(c){
  var html='<div style="padding:16px 20px"><h2 style="color:#025857;margin-top:0">📊 Ιστορικό Πλάνων ('+c.savedPlans.length+')</h2>';

  // Calculate stats
  var stats=calculatePlanStats(c.savedPlans);

  // ✅ One consolidated card (stats + comparison + trend) instead of 3 separately-colored
  // boxes stacked on top of each other — sections are divided by hairlines, not competing
  // background colors, and deltas use one neutral tone (a higher kcal between two plans
  // isn't inherently "bad" the way red implied) instead of red/green.
  html+='<div style="background:var(--card-bg);border:1px solid var(--border-light);border-left:3px solid #025857;border-radius:8px;padding:14px 16px;margin-bottom:16px">'
    +'<div style="font-weight:700;color:#025857;margin-bottom:8px;font-size:13px">📈 Στατιστικά Πλάνων</div>'
    +'<div style="font-size:12px;line-height:1.8;display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    +'<div>📊 Σύνολο: <strong>'+stats.count+' πλάνα</strong></div>'
    +'<div>📊 Μέσο Kcal: <strong>'+stats.avgK+'</strong> ('+stats.minK+'-'+stats.maxK+')</div>'
    +'<div>📊 Μέσο Protein: <strong>'+stats.avgP+'g</strong> ('+stats.minP+'-'+stats.maxP+'g)</div>'
    +'<div>📊 Τελευταίο: <strong>'+c.savedPlans[c.savedPlans.length-1].date+'</strong></div>'
    +'</div>';

  // Comparison section
  if(c.savedPlans.length>1){
    var prev=c.savedPlans[c.savedPlans.length-2].macros||{k:0,p:0,f:0,c:0};
    var last=c.savedPlans[c.savedPlans.length-1].macros||{k:0,p:0,f:0,c:0};
    var kDiff=last.k-prev.k;
    var pDiff=last.p-prev.p;
    var fDiff=last.f-prev.f;
    html+='<div style="border-top:1px solid #eee;margin-top:12px;padding-top:12px">'
      +'<div style="font-weight:700;color:#025857;margin-bottom:8px;font-size:12px">Σύγκριση Τελευταίων 2 Πλάνων</div>'
      +'<div style="font-size:12px;line-height:1.8;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'
      +'<div>Kcal: '+prev.k+' → '+last.k+' <span style="color:#666;font-weight:600">('+(kDiff>0?'+':'')+kDiff+')</span></div>'
      +'<div>Πρωτεΐνες: '+prev.p+'g → '+last.p+'g <span style="color:#666;font-weight:600">('+(pDiff>0?'+':'')+pDiff+'g)</span></div>'
      +'<div>Λίπος: '+prev.f+'g → '+last.f+'g <span style="color:#666;font-weight:600">('+(fDiff>0?'+':'')+fDiff+'g)</span></div>'
      +'</div></div>';
  }

  // Macro trend visualization
  html+='<div style="border-top:1px solid #eee;margin-top:12px;padding-top:12px">'
    +'<div style="font-weight:700;color:#025857;margin-bottom:8px;font-size:12px">Τάση Macros</div>'
    +'<div style="font-size:11px;line-height:1.6">';
  for(var i=0;i<c.savedPlans.length;i++){
    var plan=c.savedPlans[i];
    plan.macros=plan.macros||{k:0,p:0,f:0,c:0};
    var barWidth=stats.maxK?Math.round((plan.macros.k/stats.maxK)*100):0;
    html+='<div style="margin-bottom:6px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:2px">'
      +'<span>Πλάνο #'+plan.number+':</span>'
      +'<span style="font-weight:600">'+plan.macros.k+' kcal</span>'
      +'</div>'
      +'<div style="background:#e0e0e0;border-radius:3px;height:12px;overflow:hidden">'
      +'<div style="background:#025857;width:'+barWidth+'%;height:100%;"></div>'
      +'</div>'
      +'</div>';
  }
    html+='</div></div>'
    +'</div>';

  // Plans list — timeline: newest first, one node per plan, a dot+line down to the previous
  // node so the client's history reads as a story rather than a stack of identical cards.
  // Same c.savedPlans data as before; only the reading order and layout changed.
  html+='<div style="border-top:1px solid #e0e0e0;padding-top:16px">'
    +'<div style="font-weight:700;color:#025857;margin-bottom:12px;font-size:13px">🕐 Χρονολόγιο Πλάνων</div>';
  for(var di=c.savedPlans.length-1;di>=0;di--){
    var i=di;
    var plan=c.savedPlans[i];
    var planId='plan-'+i;
    var isOldest=(di===0);
    var isNewest=(di===c.savedPlans.length-1);
    var deltaTxt;
    if(i>0){
      var prevM=c.savedPlans[i-1].macros||{k:0,p:0,f:0,c:0};
      var curM=plan.macros||{k:0,p:0,f:0,c:0};
      var dk=curM.k-prevM.k, dp=curM.p-prevM.p;
      deltaTxt=(dk>0?'+':'')+dk+' kcal, '+(dp>0?'+':'')+dp+'g πρωτ. από το προηγούμενο';
    } else {
      deltaTxt='πρώτο καταγεγραμμένο πλάνο';
    }
    html+='<div style="display:flex;gap:10px">'
      +'<div style="width:14px;display:flex;flex-direction:column;align-items:center;flex-shrink:0">'
      +'<div style="width:10px;height:10px;border-radius:50%;background:#025857;margin-top:5px;flex-shrink:0"></div>'
      +(isOldest?'':'<div style="flex:1;width:2px;background:#e0e0e0;margin-top:4px"></div>')
      +'</div>'
      +'<div style="flex:1;min-width:0;padding-bottom:16px">'
      +'<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;cursor:pointer" onclick="var d=document.getElementById(\'tl-'+i+'\');d.style.display=d.style.display===\'none\'?\'block\':\'none\'">'
      +'<span style="font-size:11px;color:var(--text-muted);min-width:64px">'+plan.date+'</span>'
      +'<span style="font-weight:600;color:#025857;font-size:13px">📋 Πλάνο #'+plan.number+' — '+plan.macros.k+' kcal</span>'
      +'<span style="font-size:11px;color:#666">'+deltaTxt+'</span>'
      +'</div>'
      +'<div id="tl-'+i+'" style="display:'+(isNewest?'block':'none')+';margin-top:8px;background:var(--panel-bg);border:1px solid var(--border-light);border-radius:6px;padding:12px">'
      +'<div style="background:var(--card-bg);padding:10px;border-radius:4px;font-size:12px;margin-bottom:8px">'
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">'
      +'<div><strong>Kcal:</strong> <span style="color:#025857;font-weight:600">'+plan.macros.k+'</span></div>'
      +'<div><strong>Πρωτ:</strong> <span style="color:#025857;font-weight:600">'+plan.macros.p+'g</span></div>'
      +'<div><strong>Λίπος:</strong> <span style="color:#025857;font-weight:600">'+plan.macros.f+'g</span></div>'
      +'<div><strong>Υδατ:</strong> <span style="color:#025857;font-weight:600">'+plan.macros.c+'g</span></div>'
      +'</div>'
      +(plan.note?'<div style="margin-top:8px;padding:8px;background:#fffbea;border-left:3px solid #ffc107;font-style:italic;color:#666">💬 '+esc(plan.note)+'</div>':'')
      +'</div>'
      // Action buttons — shared .btn classes instead of 4 unrelated hardcoded colors:
      // one primary view action, two secondary utility actions, one danger action.
      +'<div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">'
      +'<button class="btn secondary" onclick="loadPlanAsActive('+i+')" style="flex:1;font-size:11px;padding:6px 10px;min-height:auto">📥 Φόρτωση</button>'
      +'<button class="btn secondary" onclick="duplicatePlan('+i+')" style="flex:1;font-size:11px;padding:6px 10px;min-height:auto">📋 Αντιγραφή</button>'
      +'<button class="btn danger" onclick="deletePlanFromHistory('+i+')" style="flex:1;font-size:11px;padding:6px 10px;min-height:auto">🗑️ Διαγραφή</button>'
      +'</div>'
      +'<button class="btn primary" onclick="document.getElementById(\''+planId+'\').style.display=document.getElementById(\''+planId+'\').style.display===\'none\'?\'block\':\'none\'" style="width:100%;font-size:11px;padding:6px 12px;min-height:auto">🍽️ Δες το πλάνο διατροφής</button>'
      +'<div id="'+planId+'" style="display:none;margin-top:10px;padding:10px;background:#f0f8ff;border-radius:4px;border:1px solid #b3e5fc;max-height:400px;overflow-y:auto;font-size:11px">';

    // Show week plan meals
    if(plan.weekPlan){
      var daysOfWeek=['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
      for(var d=0;d<7;d++){
        if(plan.weekPlan[d]){
          html+='<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #ccc">'
            +'<strong style="color:#025857">'+daysOfWeek[d]+'</strong><br>';
          for(var mi=0;mi<plan.weekPlan[d].length;mi++){
            var meal=plan.weekPlan[d][mi];
            html+='<div style="margin-top:4px;padding:4px;background:var(--card-bg);border-radius:3px">'
              +'<strong>'+esc(meal.name)+':</strong> ';
            if(meal.foods){
              var foodNames=[];
              for(var fi=0;fi<meal.foods.length;fi++){
                foodNames.push(esc(meal.foods[fi].n)+' ('+meal.foods[fi].g+'g)');
              }
              html+=foodNames.join(', ');
            }
            html+='</div>';
          }
          html+='</div>';
        }
      }
    }

    html+='</div>';
    html+='</div>';
    html+='</div>';
    html+='</div>';
  }
  html+='</div></div>';

  return html;
}

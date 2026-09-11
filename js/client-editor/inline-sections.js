// js/client-editor/inline-sections.js
// Unfolds the five "modal" settings (Χρόνοι Γευμάτων / Προπονήσεις MET / Διατροφή /
// Ιατρικές Συνθήκες / Συμπληρώματα) into inline collapsible section-cards inside the
// s1 tab's #modal-btns-grid container — same collapse pattern (getSecState/toggleSec +
// preview line) as Βασικά/Ανθρωπομετρία. The dietitian tabs down the page once instead
// of opening five modals.
//
// The section BODIES reuse the exact input IDs the existing modal save functions read
// (meal-breakfast…, dietType-modal, chk-*-modal, medications-modal, supp checkboxes),
// so each "✓ Εφαρμογή" button just calls the existing saveMealTimes / saveDietSettings /
// saveMedicalConditions (unchanged — their closeXModal() calls are no-ops with no modal
// in the DOM) plus a renderMain() where the save fn doesn't already do one. Supplements
// gets a thin applySuppsInline() because savePage1Supplements() is hard-scoped to the
// #supp-selector-modal element it also hides on save.
//
// The modal openers stay defined (one internal caller: saveFoodPicker's stale-count
// refresh) but no button opens them anymore. Loads right after overview.js.

function _inlSecHd(key, icon, title, previewWhenCollapsed){
  var st=(typeof getSecState==='function' && typeof getC==='function' && getC()) ? getSecState(getC()) : {};
  var collapsed=!!st[key];
  return '<div class="section-header sec-collapse-hd" onclick="toggleSec(\''+key+'\')">'
    +'<div><span class="section-icon">'+icon+'</span>'+title
    +(collapsed?'<div class="sec-collapse-preview">'+esc(previewWhenCollapsed||'')+'</div>':'')
    +'</div><span class="sec-chevron'+(collapsed?'':' open')+'">▸</span></div>';
}
function _inlSecBodyOpen(key){
  var st=(typeof getSecState==='function' && typeof getC==='function' && getC()) ? getSecState(getC()) : {};
  return '<div id="sec-'+key+'-body" style="display:'+(st[key]?'none':'block')+'">';
}
function _inlApplyBtn(onclick){
  return '<div style="margin-top:12px;text-align:right"><button type="button" class="btn primary" style="font-size:12px;padding:8px 16px" onclick="'+onclick+'">✓ Εφαρμογή</button></div>';
}

// ── Χρόνοι Γευμάτων ─────────────────────────────────────────────────────────
function _inlMealTimesSection(c){
  var mt=c.mealTimes||{};
  var preview=[mt.breakfast||'—', mt.lunch||'—', mt.dinner||'—'].join(' · ');
  var row=function(id,icon,label,dflt){
    return '<div><label style="font-weight:600;font-size:12px;color:var(--text-strong);display:block;margin-bottom:3px">'+icon+' '+label+'</label>'
      +'<input type="time" id="'+id+'" value="'+(mt[id.replace('meal-','')]||dflt)+'" style="width:100%;padding:7px;border:1px solid var(--border-light);border-radius:5px;font-size:13px"></div>';
  };
  return '<div class="section-card" id="sec-mealtimes">'
    +_inlSecHd('mealtimes','⏱️','Χρόνοι Γευμάτων', mt.breakfast?preview:'προεπιλογή')
    +_inlSecBodyOpen('mealtimes')
    +'<div style="background:#E2EEE5;padding:9px 11px;border-radius:6px;margin-bottom:12px;font-size:11.5px;color:#025857">💡 Εμφανίζονται στο link/PDF του πελάτη.</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
      +row('meal-breakfast','🌅','Πρωινό','07:00')
      +row('meal-snack','🥤','Πρωινό ενδιάμεσο','10:00')
      +row('meal-lunch','🍽️','Μεσημέρι','13:00')
      +row('meal-snack2','🍎','Απογευματινό ενδιάμεσο','16:00')
      +row('meal-dinner','🌙','Βράδυ','19:00')
      +row('meal-snack3','🥪','Έξτρα ενδιάμεσο (3ο)','21:00')
    +'</div>'
    +_inlApplyBtn('saveMealTimes();renderMain()')
    +'</div></div>';
}

// ── Προπονήσεις (MET) — buildMetHtml self-wires via upd/save + renderMain ────
function _inlMetSection(c,t){
  var n=(c.metActivities||[]).length;
  return '<div class="section-card" id="sec-mettrain">'
    +_inlSecHd('mettrain','🏃','Προπονήσεις (MET)', n?(n+' δραστηριότητ'+(n===1?'α':'ες')):'χωρίς — απλός πολλαπλασιαστής (PAL)')
    +_inlSecBodyOpen('mettrain')
    +'<div style="background:#E2EEE5;padding:9px 11px;border-radius:6px;margin-bottom:12px;font-size:11.5px;color:#025857">💡 Συγκεκριμένες δραστηριότητες για ακριβέστερο υπολογισμό θερμίδων. Για 2 προπονήσεις/μέρα, πρόσθεσε 2 με διαφορετική ώρα.</div>'
    +buildMetHtml(c,t)
    +'</div></div>';
}

// ── Διατροφή & Αποκλεισμοί ──────────────────────────────────────────────────
var _INL_DIET_OPTS=[['normal','🍗 Κανονική'],['vegetarian','🥬 Χορτοφαγική'],['vegan','🌱 Vegan'],['keto','⚡ Κετογονική'],['bodybuilding_clean','🏋️ Bodybuilding Clean'],['intermittent_fasting','⏰ Intermittent Fasting'],['orthodox_fasting','✝️ Ορθόδοξη Νηστεία'],['kids_10_14','👧 Παιδιά 10-14'],['mediterranean','🫒 Μεσογειακή']];
var _INL_DIET_LBL={normal:'Κανονική',vegetarian:'Χορτοφαγική',vegan:'Vegan',keto:'Κετογονική',bodybuilding_clean:'BB Clean',intermittent_fasting:'IF',orthodox_fasting:'Νηστεία',kids_10_14:'Παιδιά 10-14',mediterranean:'Μεσογειακή'};
function _inlDietSection(c){
  var dt=c.dietType||'normal';
  var nx=(c.foodExclude||[]).length;
  var preview=(_INL_DIET_LBL[dt]||dt)+(nx?(' · '+nx+' αποκλεισμ'+(nx===1?'ός':'οί')):'');
  var opts=_INL_DIET_OPTS.map(function(o){return '<option value="'+o[0]+'"'+(dt===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('');
  return '<div class="section-card" id="sec-dietsec">'
    +_inlSecHd('dietsec','🥗','Διατροφή &amp; αποφυγές', preview)
    +_inlSecBodyOpen('dietsec')
    +'<div style="margin-bottom:14px"><label style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:6px;font-size:12px">📋 Τύπος διατροφής</label>'
      +'<select id="dietType-modal" onchange="refreshDietExceptionsSection()" style="width:100%;padding:9px;border:1px solid var(--border-light);border-radius:5px;font-size:13px">'+opts+'</select></div>'
    +'<div id="diet-exceptions-section">'+((typeof buildDietExceptionsHtml==='function')?buildDietExceptionsHtml(dt, c.dietExceptionDays):'')+'</div>'
    +'<div style="margin-bottom:14px"><label style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:6px;font-size:12px">🚫 Αποκλεισμοί τροφών</label>'
      +'<button type="button" onclick="openFoodPickerModal()" style="width:100%;padding:10px;background:#025857;color:#fff;border:none;border-radius:5px;cursor:pointer;font-weight:600;font-size:13px">📋 Επίλεξε τρόφιμα ('+nx+')</button>'
      +'<div style="font-size:11px;color:#666;padding:7px 9px;background:#FFF3E0;border-radius:4px;margin-top:6px">'
      +((c.foodExclude&&c.foodExclude.length)?('✓ '+esc(c.foodExclude.slice(0,4).join(', '))+(c.foodExclude.length>4?'…':'')):'💡 Κάνε κλικ για να επιλέξεις')
      +'</div></div>'
    +'<div style="margin-bottom:4px"><label style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:6px;font-size:12px">💡 Προτιμήσεις</label>'
      +'<textarea id="preferences-modal" oninput="updatePreferencesDetectedHint()" style="width:100%;padding:9px;border:1px solid var(--border-light);border-radius:5px;font-size:13px;height:64px;font-family:inherit" placeholder="π.χ. Όχι κόκκινο κρέας, Περισσότερο ψάρι">'+esc(c.preferences||'')+'</textarea>'
      +'<div id="preferences-detected-hint" style="font-size:11px;color:#025857;margin-top:5px"></div>'
      +'<div style="font-size:10px;color:var(--text-muted);margin-top:2px">Μόνο ρητές φράσεις αποφυγής («Όχι…», «Αποφυγή…») γίνονται αυτόματα αποκλεισμός.</div></div>'
    +_inlApplyBtn('saveDietSettings()')
    +'</div></div>';
}

// ── Ιατρικές Συνθήκες ──────────────────────────────────────────────────────
var _INL_MED_CHK=[['diabetes','🍬 Διαβήτης'],['hypertension','🩸 Υψηλή Πίεση'],['cholesterol','🩸 Υψηλή Χοληστερόλη'],['celiac','🌾 Κοιλιοκάκη'],['ibs','🔄 IBS'],['lactose','🥛 Δυσανεξία Λακτόζης'],['ironDeficiency','🔋 Σιδηροπενία/Αναιμία'],['hydration','💧 Ενυδάτωση & Ηλεκτρολύτες']];
function _inlMedicalSection(c){
  var mc=c.medConditions||{};
  var active=_INL_MED_CHK.filter(function(x){return mc[x[0]];}).map(function(x){return x[1].replace(/^\S+\s/,'');});
  var mens=(c.menstrualCycle==='irregular'||c.menstrualCycle==='absent')?c.menstrualCycle:'regular';
  var preview=active.length?active.join(', '):'— καμία —';
  var chk=_INL_MED_CHK.map(function(x){
    return '<label style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--panel-bg);border-radius:5px;cursor:pointer;font-size:12px;font-weight:600">'
      +'<input type="checkbox" id="chk-'+x[0]+'-modal"'+(mc[x[0]]?' checked':'')+' style="width:16px;height:16px">'
      +'<span style="flex:1">'+x[1]+'</span>'
      +'<button type="button" onclick="event.stopPropagation();event.preventDefault();showMedicalProtocol(\''+x[0]+'\')" style="background:var(--card-bg);border:1px solid #025857;color:#025857;border-radius:4px;padding:3px 7px;font-size:10px;cursor:pointer;white-space:nowrap">📋</button>'
      +'</label>';
  }).join('');
  var mr=function(v,lbl,bg){
    return '<label style="display:flex;align-items:center;gap:8px;padding:7px 9px;background:'+bg+';border-radius:4px;font-size:12px">'
      +'<input type="radio" name="menstrual" value="'+v+'"'+(mens===v?' checked':'')+' style="width:15px;height:15px"><span>'+lbl+'</span></label>';
  };
  return '<div class="section-card" id="sec-medsec">'
    +_inlSecHd('medical','🩺','Ιατρικές Συνθήκες', preview)
    +_inlSecBodyOpen('medical')
    +'<div style="background:#FFEBEE;padding:9px 11px;border-radius:6px;margin-bottom:12px;font-size:11.5px;color:#c62828">⚠️ Ενεργές συνθήκες → προσαρμογή του πλάνου.</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">'+chk+'</div>'
    +'<div style="margin-bottom:14px"><label for="medications-modal" style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:6px;font-size:12px">💊 Φάρμακα / συμπληρώματα</label>'
      +'<textarea id="medications-modal" style="width:100%;padding:9px;border:1px solid var(--border-light);border-radius:5px;font-size:13px;height:56px;font-family:inherit" placeholder="π.χ. Λεβοθυροξίνη 50mcg το πρωί — ή κενό">'+esc(c.medications||'')+'</textarea></div>'
    +'<div><label style="font-weight:600;color:var(--text-strong);display:block;margin-bottom:8px;font-size:12px">👩 Μητρικός κύκλος (γυναίκες)</label>'
      +'<div style="display:grid;gap:6px">'
      +mr('regular','✅ Κανονικός','var(--panel-bg)')
      +mr('irregular','⚠️ Ακανόνιστος (Monitor RED-S)','#FFF3E0')
      +mr('absent','🔴 Απών (HIGH RED-S RISK!)','#FFCDD2')
      +'</div></div>'
    +_inlApplyBtn('saveMedicalConditions()')
    +'</div></div>';
}

// ── Συμπληρώματα ───────────────────────────────────────────────────────────
function _inlSuppsSection(c){
  var n=(c.selectedSupplements||[]).length;
  var list=(typeof COMMON_SUPPS!=='undefined')?COMMON_SUPPS:[];
  var rows=list.map(function(s,idx){
    var sel=(c.selectedSupplements||[]).some(function(x){return x.supplement===s.name;});
    return '<label style="display:flex;align-items:flex-start;gap:9px;padding:9px 10px;background:var(--panel-bg);border-radius:5px;cursor:pointer;border:1.5px solid '+(sel?'#025857':'var(--border-light)')+'">'
      +'<input type="checkbox" data-supp-idx="'+idx+'"'+(sel?' checked':'')+' style="width:16px;height:16px;margin-top:2px">'
      +'<div style="flex:1"><div style="font-weight:600;color:var(--text-strong);font-size:12.5px">'+esc(s.name)+'</div>'
      +'<div style="font-size:10.5px;color:#666">📋 '+esc(s.dosage||'')+'</div>'
      +'<div style="font-size:10.5px;color:var(--text-muted)">⏰ '+esc(s.timing||'')+'</div></div></label>';
  }).join('');
  return '<div class="section-card" id="sec-suppsec">'
    +_inlSecHd('suppsec','💊','Συμπληρώματα', n?(n+' επιλεγμέν'+(n===1?'ο':'α')):'—')
    +_inlSecBodyOpen('suppsec')
    +'<div style="background:#E2EEE5;padding:9px 11px;border-radius:6px;margin-bottom:12px;font-size:11.5px;color:#025857">💡 Ό,τι παίρνει ήδη τακτικά. Προτάσεις βάσει πλάνου: «💊» στην καρτέλα «Πλάνο».</div>'
    +'<div style="display:grid;gap:8px">'+rows+'</div>'
    +_inlApplyBtn('applySuppsInline()')
    +'</div></div>';
}

// Faithful copy of savePage1Supplements()'s merge core, scoped to the inline section
// (savePage1Supplements() is hard-wired to the #supp-selector-modal element it also hides).
function applySuppsInline(){
  var c=(typeof getC==='function')?getC():null; if(!c) return;
  var body=document.getElementById('sec-suppsec-body'); if(!body) return;
  var list=(typeof COMMON_SUPPS!=='undefined')?COMMON_SUPPS:[];
  var picked=[];
  body.querySelectorAll('input[type="checkbox"][data-supp-idx]:checked').forEach(function(cb){
    var s=list[parseInt(cb.getAttribute('data-supp-idx'),10)];
    if(s) picked.push({supplement:s.name, dose:s.dosage, info:'', timing:s.timing||''});
  });
  var names=list.map(function(s){return s.name;});
  var keepFromOther=(c.selectedSupplements||[]).filter(function(s){return names.indexOf(s.supplement)===-1;});
  c.selectedSupplements=keepFromOther.concat(picked);
  if(typeof save==='function') save();
  if(typeof renderMain==='function') renderMain();
  if(typeof showSuccessToast==='function') showSuccessToast('✓ Συμπληρώματα αποθηκεύτηκαν!');
}

// The full #modal-btns-grid replacement — 5 collapsible sections instead of 5 modal buttons.
function buildInlineModalSectionsHtml(c,t){
  if(!c) return '';
  return _inlMealTimesSection(c)
    + _inlMetSection(c,t)
    + _inlDietSection(c)
    + _inlMedicalSection(c)
    + _inlSuppsSection(c);
}

// js/plan-gen/meal-slots.js
// Plan meal-slot & day operations + the small in-cell UI helpers, extracted
// verbatim from js/app-part3.js (module split wave 21): getDoubleTrainingDays,
// add/rename/delete meal slot + its modal, day & meal context menus, copy-day /
// swap-day (+ undo toast), the meal drag-and-drop engine (_mealDrag + _onMealDrag*),
// chip food search (closeDD/showChipSug/pickChip), the portion picker
// (showPortions/pickServing), expandRecipeInPlan, and initializeMealTiming. Only
// `var _mealDrag = null` runs at parse time. Every caller is a week-table.js /
// app-part1.js onclick string or a runtime call from renderWeekTable / app-part2 —
// all runtime. Loads right after food-selector.js, before app-part3.js.

// Επιστρέφει τους δείκτες ημερών (0-6) που έχουν 2+ προπονήσεις στη MET λίστα
function getDoubleTrainingDays(c){
  if(!c||!c.metActivities||!c.metActivities.length)return [];
  var counts=[0,0,0,0,0,0,0];
  c.metActivities.forEach(function(ma){
    (ma.days||[]).forEach(function(d){if(d>=0&&d<=6)counts[d]++;});
  });
  var out=[];
  for(var i=0;i<7;i++){if(counts[i]>=2)out.push(i);}
  return out;
}

// ── Διαχείριση επιπλέον γευμάτων (slots) ───────────────────────────────────
// Τα γεύματα είναι κοινά slots σε όλες τις 7 ημέρες. Προσθέτουμε ένα νέο slot
// (π.χ. «Pre 2ης προπόνησης») σε όλες τις ημέρες — κενό όπου δεν χρειάζεται.
function openAddMealSlotModal(){
  var c=getC();if(!c||!c.weekPlan||!c.weekPlan[0]){showErrorToast('Δημιούργησε πρώτα πλάνο.');return;}
  var names=(c.weekPlan[0]||[]).map(function(m){return m.name;});
  var posOpts='';
  for(var i=0;i<names.length;i++){
    posOpts+='<option value="'+(i+1)+'">μετά: '+names[i]+'</option>';
  }
  var presetBtns=[
    {n:'Pre 1ης προπόνησης',t:'pre-workout'},
    {n:'Ανάμεσα στις προπονήσεις',t:'post-workout'},
    {n:'Pre 2ης προπόνησης',t:'pre-workout'},
    {n:'Μετά 2ης προπόνησης',t:'recovery'}
  ].map(function(p){
    return '<button type="button" onclick="document.getElementById(\'newMealName\').value=\''+p.n+'\';document.getElementById(\'newMealTiming\').value=\''+p.t+'\'" '
      +'style="background:#e8f5e9;border:1px solid #c8e6c9;color:#025857;border-radius:14px;padding:4px 10px;font-size:11px;cursor:pointer;margin:0 4px 4px 0">'+p.n+'</button>';
  }).join('');
  var timingOpts='';
  for(var k in MEAL_TIMING_PROFILES){
    var pr=MEAL_TIMING_PROFILES[k];
    timingOpts+='<option value="'+k+'"'+(k==='pre-workout'?' selected':'')+'>'+pr.icon+' '+pr.label+'</option>';
  }
  var html='<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1002" onclick="if(event.target===this)closeAddMealSlotModal()">'
    +'<div style="background:var(--card-bg);border-radius:12px;padding:20px;max-width:440px;width:90%;box-shadow:0 8px 24px rgba(0,0,0,0.3)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:2px solid #025857;padding-bottom:10px">'
    +'<h2 style="margin:0;color:#025857;font-size:17px">➕ Προσθήκη γεύματος</h2>'
    +'<button onclick="closeAddMealSlotModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-muted)">&times;</button>'
    +'</div>'
    +'<div style="background:#E8F5E9;padding:10px 12px;border-radius:6px;margin-bottom:14px;font-size:11px;color:#2E7D32;line-height:1.5">'
    +'💡 Το γεύμα μπαίνει σε <b>όλες τις ημέρες</b>. Άφησέ το κενό στις ημέρες που δεν χρειάζεται — εμφανίζεται μόνο το «+».</div>'
    +'<div style="font-size:11px;color:#666;margin-bottom:6px">Γρήγορες επιλογές:</div>'
    +'<div style="margin-bottom:12px">'+presetBtns+'</div>'
    +'<label style="font-weight:600;color:var(--text-strong);font-size:12px;display:block;margin-bottom:4px">Όνομα γεύματος</label>'
    +'<input id="newMealName" type="text" value="Pre 2ης προπόνησης" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px;margin-bottom:12px;box-sizing:border-box">'
    +'<label style="font-weight:600;color:var(--text-strong);font-size:12px;display:block;margin-bottom:4px">Τύπος (timing → κατανομή μακρο)</label>'
    +'<select id="newMealTiming" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px;margin-bottom:12px;box-sizing:border-box">'+timingOpts+'</select>'
    +'<label style="font-weight:600;color:var(--text-strong);font-size:12px;display:block;margin-bottom:4px">Θέση στη μέρα</label>'
    +'<select id="newMealPos" style="width:100%;padding:8px;border:1px solid var(--border-light);border-radius:4px;margin-bottom:18px;box-sizing:border-box">'+posOpts+'</select>'
    +'<div style="display:flex;gap:10px;justify-content:flex-end">'
    +'<button onclick="closeAddMealSlotModal()" style="padding:9px 18px;background:#eee;border:none;border-radius:6px;cursor:pointer">Άκυρο</button>'
    +'<button onclick="confirmAddMealSlot()" style="padding:9px 18px;background:#025857;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:600">✅ Προσθήκη</button>'
    +'</div></div></div>';
  var overlay=document.createElement('div');
  overlay.id='addMealSlotModal';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}
function closeAddMealSlotModal(){var m=document.getElementById('addMealSlotModal');if(m)m.remove();}
function confirmAddMealSlot(){
  var c=getC();if(!c)return;
  var name=(document.getElementById('newMealName').value||'').trim();
  if(!name){showErrorToast('Δώσε όνομα γεύματος.');return;}
  var timing=document.getElementById('newMealTiming').value||'regular';
  var pos=parseInt(document.getElementById('newMealPos').value,10);
  if(isNaN(pos))pos=(c.weekPlan[0]||[]).length;
  Object.keys(c.weekPlan).forEach(function(d){
    if(!c.weekPlan[d])return;
    var insAt=Math.min(pos,c.weekPlan[d].length);
    c.weekPlan[d].splice(insAt,0,{name:name,foods:[],mealTiming:timing});
  });
  save();closeAddMealSlotModal();renderWeekTable();
  showSuccessToast('✅ Προστέθηκε το γεύμα «'+name+'»');
}
function renameMealSlot(mi){
  var c=getC();if(!c||!c.weekPlan[0]||!c.weekPlan[0][mi])return;
  var cur=c.weekPlan[0][mi].name;
  showPromptDialog('Νέο όνομα γεύματος:', cur, function(nv){
    nv=nv.trim();if(!nv)return;
    Object.keys(c.weekPlan).forEach(function(d){
      if(c.weekPlan[d]&&c.weekPlan[d][mi])c.weekPlan[d][mi].name=nv;
    });
    save();renderWeekTable();
  }, {title:'Μετονομασία γεύματος'});
}
function deleteMealSlot(mi){
  var c=getC();if(!c||!c.weekPlan[0]||!c.weekPlan[0][mi])return;
  if((c.weekPlan[0]||[]).length<=1){showErrorToast('Δεν γίνεται να μείνει η μέρα χωρίς γεύματα.');return;}
  var nm=c.weekPlan[0][mi].name;
  showConfirmDialog('Διαγραφή του γεύματος «'+nm+'» από ΟΛΕΣ τις ημέρες;', function(){
    Object.keys(c.weekPlan).forEach(function(d){
      if(c.weekPlan[d]&&c.weekPlan[d].length>mi)c.weekPlan[d].splice(mi,1);
    });
    save();renderWeekTable();
    showSuccessToast('🗑️ Διαγράφηκε το γεύμα «'+nm+'»');
  });
}
function toggleDayMenu(id){
  document.querySelectorAll('.day-menu-dropdown.open').forEach(function(el){if(el.id!==id)el.classList.remove('open');});
  var el=document.getElementById(id);if(!el)return;
  var opening=!el.classList.contains('open');
  el.classList.toggle('open',opening);
  if(opening){
    setTimeout(function(){
      function outside(e){if(!el.contains(e.target)){el.classList.remove('open');document.removeEventListener('mousedown',outside);}}
      document.addEventListener('mousedown',outside);
    },0);
  }
}
function closeDayMenu(id){var el=document.getElementById(id);if(el)el.classList.remove('open');}

// Το μενού "⋮" κάθε γεύματος (💾 Αποθήκευση / ⚖️ Ισορροπία / ❐ Αντιγραφή / 👍👎) καλούσε
// toggleMealMenu/closeMealMenu που δεν υπήρχαν πουθενά στον κώδικα — το κουμπί δεν έκανε τίποτα.
// Ίδια λογική με toggleDayMenu/closeDayMenu, αλλά μέσω style.display (όχι CSS class) γιατί το
// markup του μενού ήδη έχει display:none inline, χωρίς αντίστοιχο CSS hook.
function toggleMealMenu(id){
  document.querySelectorAll('.meal-menu-dropdown').forEach(function(el){if(el.id!==id)el.style.display='none';});
  var el=document.getElementById(id);if(!el)return;
  var opening=el.style.display==='none'||!el.style.display;
  el.style.display=opening?'block':'none';
  if(opening){
    setTimeout(function(){
      function outside(e){if(!el.contains(e.target)){el.style.display='none';document.removeEventListener('mousedown',outside);}}
      document.addEventListener('mousedown',outside);
    },0);
  }
}
function closeMealMenu(id){var el=document.getElementById(id);if(el)el.style.display='none';}
function copyDayPrompt(btn,fromDay){
  var c=getC();if(!c||!c.weekPlan[fromDay]||!c.weekPlan[fromDay].length)return;
  var dayNames=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var panelId='copy-panel-'+fromDay;
  var existing=document.getElementById(panelId);
  if(existing){existing.remove();return;}
  // Close any other open copy panels
  document.querySelectorAll('[id^="copy-panel-"]').forEach(function(p){p.remove();});
  var rect=btn.getBoundingClientRect();
  var panel=document.createElement('div');
  panel.id=panelId;
  panel.style.cssText='position:fixed;z-index:9999;background:var(--card-bg);border:1px solid #025857;border-radius:8px;padding:10px 12px;box-shadow:0 4px 18px rgba(0,0,0,.18);font-size:11px;min-width:165px;left:'+Math.round(rect.left)+'px;top:'+Math.round(rect.bottom+4)+'px';
  var inner='<div style="font-weight:700;color:#025857;margin-bottom:7px">📋 Αντιγραφή '+dayNames[fromDay]+' σε:</div>';
  inner+='<div style="display:flex;flex-direction:column;gap:5px">';
  for(var di=0;di<7;di++){
    if(di===fromDay)continue;
    inner+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer">'
      +'<input type="checkbox" id="cp-'+di+'" style="accent-color:#025857"> '+dayNames[di]+'</label>';
  }
  inner+='</div><div style="display:flex;gap:6px;margin-top:8px">'
    +'<button onclick="doCopyDay('+fromDay+')" style="flex:1;padding:4px;background:#025857;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer">✓ Εφαρμογή</button>'
    +'<button onclick="document.getElementById(\''+panelId+'\').remove()" style="padding:4px 8px;border:1px solid var(--border-light);border-radius:5px;font-size:11px;cursor:pointer;background:var(--card-bg)">✕</button>'
    +'</div>';
  panel.innerHTML=inner;
  document.body.appendChild(panel);
  // Close on outside click
  setTimeout(function(){
    function outsideClick(e){if(!panel.contains(e.target)&&e.target!==btn){panel.remove();document.removeEventListener('mousedown',outsideClick);}}
    document.addEventListener('mousedown',outsideClick);
  },0);
}
function doCopyDay(fromDay){
  var c=getC();if(!c)return;
  var dayNames=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var copied=[];
  for(var di=0;di<7;di++){
    var cb=document.getElementById('cp-'+di);
    if(cb&&cb.checked){c.weekPlan[di]=deepClone(c.weekPlan[fromDay]);copied.push(dayNames[di]);}
  }
  if(!copied.length){showErrorToast('Δεν επιλέχθηκε καμία ημέρα.');return;}
  save();renderWeekTable();
}

// ✅ Ανταλλαγή φαγητού μεταξύ δύο ημερών — swap ΜΟΝΟ του c.weekPlan[i]/[j] (τα γεύματα/τροφές).
// Προπόνηση (trainDays/trainHoursByDay/trainTimesByDay), στόχοι kcal/carb (dayTargets), match-day
// flag (matchDays) και εξαιρέσεις νηστείας (dietExceptionDays/dietFoodExceptionDays) μένουν στη
// ΘΕΣΗ της ημέρας — δεν ακολουθούν το φαγητό (επιβεβαιωμένο με τον χρήστη, βλ. συζήτηση mockup).
// Άρα το μετακινημένο φαγητό μπορεί να μην ταιριάζει πλέον ακριβώς στον στόχο της νέας ημέρας —
// αναμενόμενο, ο διατροφολόγος το προσαρμόζει χειροκίνητα όπως θα έκανε ούτως ή άλλως.
function swapPlanDays(c,i,j){
  if(!c||!c.weekPlan||i===j)return;
  var tmp=c.weekPlan[i];
  c.weekPlan[i]=c.weekPlan[j];
  c.weekPlan[j]=tmp;
}
function swapDayPrompt(btn,fromDay){
  var c=getC();if(!c||!c.weekPlan[fromDay]||!c.weekPlan[fromDay].length)return;
  var dayNames=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
  var panelId='swap-panel-'+fromDay;
  var existing=document.getElementById(panelId);
  if(existing){existing.remove();return;}
  // Close any other open swap/copy panels
  document.querySelectorAll('[id^="swap-panel-"],[id^="copy-panel-"]').forEach(function(p){p.remove();});
  var rect=btn.getBoundingClientRect();
  var panel=document.createElement('div');
  panel.id=panelId;
  panel.style.cssText='position:fixed;z-index:9999;background:var(--card-bg);border:1px solid #025857;border-radius:8px;padding:10px 12px;box-shadow:0 4px 18px rgba(0,0,0,.18);font-size:11px;min-width:165px;left:'+Math.round(rect.left)+'px;top:'+Math.round(rect.bottom+4)+'px';
  var inner='<div style="font-weight:700;color:#025857;margin-bottom:7px">🔁 Ανταλλαγή '+dayNames[fromDay]+' με:</div>';
  inner+='<div style="display:flex;flex-direction:column;gap:5px">';
  for(var di=0;di<7;di++){
    if(di===fromDay)continue;
    // ✅ id scoped to fromDay (sw-<from>-<to>, not just sw-<to>) so it can never collide with
    // another swap panel's radios even if the "close other open panels" line above is ever
    // changed/removed — the panel is already scoped by `panelId`/`name`, this just makes the
    // per-input id agree with that instead of being the one un-scoped piece.
    inner+='<label style="display:flex;align-items:center;gap:6px;cursor:pointer">'
      +'<input type="radio" name="sw-target-'+fromDay+'" id="sw-'+fromDay+'-'+di+'" style="accent-color:#025857"> '+dayNames[di]+'</label>';
  }
  inner+='</div><div style="display:flex;gap:6px;margin-top:8px">'
    +'<button onclick="doSwapDay('+fromDay+')" style="flex:1;padding:4px;background:#025857;color:#fff;border:none;border-radius:5px;font-size:11px;cursor:pointer">✓ Αντιστροφή</button>'
    +'<button onclick="document.getElementById(\''+panelId+'\').remove()" style="padding:4px 8px;border:1px solid var(--border-light);border-radius:5px;font-size:11px;cursor:pointer;background:var(--card-bg)">✕</button>'
    +'</div>';
  panel.innerHTML=inner;
  document.body.appendChild(panel);
  // Close on outside click
  setTimeout(function(){
    function outsideClick(e){if(!panel.contains(e.target)&&e.target!==btn){panel.remove();document.removeEventListener('mousedown',outsideClick);}}
    document.addEventListener('mousedown',outsideClick);
  },0);
}
function doSwapDay(fromDay){
  var c=getC();if(!c)return;
  var panel=document.getElementById('swap-panel-'+fromDay);
  var toDay=-1;
  for(var di=0;di<7;di++){
    var rb=document.getElementById('sw-'+fromDay+'-'+di);
    if(rb&&rb.checked){toDay=di;break;}
  }
  if(toDay===-1){showErrorToast('Διάλεξε μια ημέρα για ανταλλαγή.');return;}
  if(panel)panel.remove();
  swapPlanDays(c,fromDay,toDay);
  save();renderWeekTable();
  showSwapUndoToast(fromDay,toDay);
}

// ✅ Ειδικό toast με κουμπί «↩ Αναίρεση» — το γενικό ↶ Αναίρεση πάνω-αριστερά (UndoRedoManager)
// δεν πιάνει swap/copy/regenerate ημέρας (ίδιο κενό είχε ήδη το «Αντιγραφή σε άλλες ημέρες»).
// Μια ανταλλαγή όμως αναιρείται ΑΚΡΙΒΩΣ ξανακάνοντας το ίδιο swap, οπότε αξίζει ειδικό κουμπί
// εδώ αντί να απαιτείται να ξανανοίξεις το μενού και να διαλέξεις ξανά τις δύο ημέρες.
function showSwapUndoToast(dayA,dayB){
  var dayNames=['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
  var existing=document.getElementById('swap-undo-toast');if(existing)existing.remove();
  var t=document.createElement('div');
  t.id='swap-undo-toast';
  t.style.cssText='position:fixed;bottom:20px;right:20px;background:#025857;color:#fff;padding:10px 10px 10px 16px;border-radius:8px;font-size:12px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px;max-width:360px';
  t.innerHTML='<span>✓ Αντιστράφηκε το φαγητό: '+dayNames[dayA]+' ↔ '+dayNames[dayB]+'</span>'
    +'<button style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0">↩ Αναίρεση</button>';
  document.body.appendChild(t);
  var timer=setTimeout(function(){t.remove();},6000);
  t.querySelector('button').onclick=function(){
    clearTimeout(timer);
    var cc=getC();
    if(cc){swapPlanDays(cc,dayA,dayB);save();renderWeekTable();}
    t.remove();
    dietoToast('↩ Η ανταλλαγή αναιρέθηκε');
  };
}

/* ---- Meal & ingredient drag ----
   Custom pointer-drag (ΟΧΙ HTML5 `draggable` — δεν λειτουργεί αξιόπιστα για
   στοιχεία μέσα σε <td>, και όταν το ίδιο το <td> είναι draggable «σκιάζει»
   κάθε εσωτερικό στοιχείο). Πάτα-σύρε-άσε με ποντίκι ή δάχτυλο:
     • σύρσιμο ενός .food-chip        → αντιγραφή ΕΝΟΣ υλικού σε άλλο γεύμα
     • σύρσιμο της λαβής ⠿ (ανά κελί) → αντιγραφή ΟΛΟΥ του γεύματος
   Πάντα ΑΝΤΙΓΡΑΦΗ — η πηγή μένει ανέπαφη. Esc ή pointercancel ακυρώνει.
   Κατώφλι 6px ώστε ένα απλό κλικ να μη ξεκινά σύρσιμο (κρατά το click-to-select). */
var _mealDrag=null; // {info, startX, startY, started, ghost}

function enableMealDragDrop(){
  // (α) Πάτα-σύρε ένα .food-chip → αντιγραφή ΕΝΟΣ υλικού
  document.querySelectorAll('#week-con .food-chip').forEach(function(chip){
    chip.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      // Κουμπιά + το πεδίο γραμμαρίων: όχι σύρσιμο. Το πεδίο ΟΝΟΜΑΤΟΣ επιτρέπεται
      // (το σύρσιμο ξεκινά μόνο μετά από κίνηση 6px — απλό κλικ = εστίαση για γράψιμο).
      // .chip-dd: τα dropdown επιλογής μερίδας (≡ «Μερίδες» → .srv-ddi) και αυτόματης
      // συμπλήρωσης ονόματος (.chip-ddi) ζουν ΜΕΣΑ στο .food-chip — χωρίς αυτή την εξαίρεση
      // το pointerdown πάνω σε μια επιλογή ξεκινούσε σύρσιμο και το e.preventDefault() έπνιγε
      // το mousedown, οπότε το pickServing/pickChip δεν έτρεχε ποτέ (π.χ. αδύνατη η αλλαγή σε φλ.).
      if(e.target.closest&&e.target.closest('button, .chip-g, .chip-unit-btn, .chip-dd'))return;
      var d=parseInt(chip.dataset.d),mi=parseInt(chip.dataset.mi),fi=parseInt(chip.dataset.fi);
      var c=getC();
      if(!c||!c.weekPlan[d]||!c.weekPlan[d][mi]||!c.weekPlan[d][mi].foods[fi])return;
      var food=c.weekPlan[d][mi].foods[fi];
      if(food.n===FREE_MEAL_MARKER)return;
      _startMealPointerDrag(e,{kind:'food',srcD:d,srcMi:mi,food:food,label:food.n+' · '+(food.g||0)+'g'});
    });
  });
  // (β) Πάτα-σύρε τη λαβή ⠿ → αντιγραφή ΟΛΟΥ του γεύματος
  document.querySelectorAll('#week-con .meal-drag-handle').forEach(function(handle){
    handle.addEventListener('pointerdown',function(e){
      if(e.pointerType==='mouse'&&e.button!==0)return;
      var cell=handle.closest('.day-cell');if(!cell)return;
      var d=parseInt(cell.dataset.d),mi=parseInt(cell.dataset.mi);
      var c=getC();
      if(!c||!c.weekPlan[d]||!c.weekPlan[d][mi]||!(c.weekPlan[d][mi].foods||[]).length)return;
      _startMealPointerDrag(e,{kind:'meal',srcD:d,srcMi:mi,foods:c.weekPlan[d][mi].foods,label:'Γεύμα · '+c.weekPlan[d][mi].foods.length+' τρόφιμα'});
    });
  });
}

function _startMealPointerDrag(e,info){
  // Μη μπλοκάρεις το pointerdown πάνω σε πεδίο κειμένου — αλλιώς δεν εστιάζει για γράψιμο.
  if(!(e.target.closest&&e.target.closest('input,textarea')))e.preventDefault();
  _mealDrag={info:info,startX:e.clientX,startY:e.clientY,started:false,ghost:null};
  document.addEventListener('pointermove',_onMealDragMove,{capture:true,passive:false});
  document.addEventListener('pointerup',_onMealDragUp,true);
  document.addEventListener('pointercancel',_cancelMealDrag,true);
  document.addEventListener('keydown',_onMealDragKey,true);
}
function _onMealDragKey(e){if(e.key==='Escape')_cancelMealDrag();}

function _onMealDragMove(e){
  var md=_mealDrag;if(!md)return;
  var dx=e.clientX-md.startX, dy=e.clientY-md.startY;
  if(!md.started){
    if(Math.abs(dx)+Math.abs(dy)<6)return;           // κατώφλι — απλό κλικ δεν ξεκινά σύρσιμο
    md.started=true;
    // Το σύρσιμο ξεκίνησε από πεδίο ονόματος → σταμάτα τυχόν επιλογή κειμένου/εστίαση
    if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();
    try{var sel=window.getSelection&&window.getSelection();if(sel&&sel.removeAllRanges)sel.removeAllRanges();}catch(_e){}
    closeDD&&closeDD();
    document.body.style.userSelect='none';
    document.body.style.cursor='grabbing';
    var g=document.createElement('div');
    g.className='meal-drag-ghost';
    g.textContent=(md.info.kind==='meal'?'📋 ':'')+md.info.label;
    document.body.appendChild(g);
    md.ghost=g;
  }
  e.preventDefault();
  md.ghost.style.left=(e.clientX+14)+'px';
  md.ghost.style.top=(e.clientY+14)+'px';
  var prev=document.querySelector('#week-con .day-cell.meal-drag-over');
  if(prev)prev.classList.remove('meal-drag-over');
  var t=_mealDragCellAt(e.clientX,e.clientY);
  if(t&&!(t.d===md.info.srcD&&t.mi===md.info.srcMi))t.cell.classList.add('meal-drag-over');
}
function _mealDragCellAt(x,y){
  var el=document.elementFromPoint(x,y);
  var cell=el&&el.closest?el.closest('#week-con .day-cell'):null;
  if(!cell)return null;
  return {cell:cell,d:parseInt(cell.dataset.d),mi:parseInt(cell.dataset.mi)};
}
function _onMealDragUp(e){
  var md=_mealDrag;
  var didDrop=false;
  if(md&&md.started){
    var t=_mealDragCellAt(e.clientX,e.clientY);
    if(t){
      var c=getC();
      if(c&&c.weekPlan[t.d]&&c.weekPlan[t.d][t.mi]&&!(t.d===md.info.srcD&&t.mi===md.info.srcMi)){
        if(md.info.kind==='food'){
          c.weekPlan[t.d][t.mi].foods.push(deepClone(md.info.food));
        }else{
          md.info.foods.forEach(function(f){c.weekPlan[t.d][t.mi].foods.push(deepClone(f));});
        }
        save();
        didDrop=true;
      }
    }
    // κατάπιε το click που ακολουθεί (να μη «ενεργοποιήσει» το κελί-στόχο)
    var swallow=function(ev){ev.stopPropagation();ev.preventDefault();};
    document.addEventListener('click',swallow,true);
    setTimeout(function(){document.removeEventListener('click',swallow,true);},0);
  }
  _cleanupMealDrag();
  if(didDrop)renderWeekTable();
}
function _cancelMealDrag(){_cleanupMealDrag();}
function _cleanupMealDrag(){
  document.removeEventListener('pointermove',_onMealDragMove,{capture:true,passive:false});
  document.removeEventListener('pointerup',_onMealDragUp,true);
  document.removeEventListener('pointercancel',_cancelMealDrag,true);
  document.removeEventListener('keydown',_onMealDragKey,true);
  var prev=document.querySelector('#week-con .day-cell.meal-drag-over');
  if(prev)prev.classList.remove('meal-drag-over');
  if(_mealDrag&&_mealDrag.ghost)_mealDrag.ghost.remove();
  document.body.style.userSelect='';
  document.body.style.cursor='';
  _mealDrag=null;
}

/* ---- Chip food search ---- */
function closeDD(){if(currentDD){currentDD.remove();currentDD=null;}}

function showChipSug(inp){
  closeDD();
  var q=inp.value.toLowerCase().trim();
  var keys=Object.keys(FOODS);
  var matches=q?keys.filter(function(n){return n.toLowerCase().indexOf(q)>=0;}):keys;
  if(!matches.length)return;
  var d=inp.dataset.d,mi=inp.dataset.mi,fi=inp.dataset.fi,mode=inp.dataset.mode||'';
  var html='';
  matches.forEach(function(n){
    html+='<div class="chip-ddi" data-n="'+n+'" data-d="'+d+'" data-mi="'+mi+'" data-fi="'+fi+'" data-mode="'+mode+'" onmousedown="event.preventDefault();pickChip(this)">'
      +'<span>'+n+'</span><span class="chip-ddm">'+FOODS[n].k+' kcal</span></div>';
  });
  var dd=document.createElement('div');dd.className='chip-dd';dd.innerHTML=html;
  inp.parentElement.appendChild(dd);currentDD=dd;
}

function pickChip(el){
  var d=parseInt(el.dataset.d),mi=parseInt(el.dataset.mi),fi=parseInt(el.dataset.fi);
  var selectedFoodName=el.dataset.n;
  if(el.dataset.mode==='tmpl'){
    TMPLS[curTmplGoal][d][mi].foods[fi].n=selectedFoodName;
    closeDD();renderTmplTable();
  } else {
    var c=getC();if(!c)return;
    // Update the food name
    c.weekPlan[d][mi].foods[fi].n=selectedFoodName;
    // If it's an expandable recipe, set its reference portion so the
    // "Άνοιγμα υλικών" button (🔽) scales the ingredients correctly.
    // The recipe stays as a single line — the user opens it on demand.
    var rx=FYH_RECIPE_EXPAND[selectedFoodName];
    if(rx)c.weekPlan[d][mi].foods[fi].g=rx.base;
    save();closeDD();renderWeekTable();
  }
}

/* ---- Portion picker ---- */
function showPortions(btn,d,mi,fi){
  closeDD();
  var c=getC();if(!c)return;
  var food=c.weekPlan[d][mi].foods[fi];
  var portions=PORTIONS[food.n];
  if(!portions||!portions.length)return;
  var html='';
  portions.forEach(function(srv){
    html+='<div class="srv-ddi" onmousedown="event.preventDefault();pickServing('+srv.g+','+d+','+mi+','+fi+')">'
      +'<span>'+srv.n+'</span><span class="srv-ddg">'+srv.g+'g</span></div>';
  });
  var dd=document.createElement('div');
  dd.className='chip-dd';dd.innerHTML=html;
  var chip=btn.closest('.food-chip');
  var wrap=chip?chip.querySelector('.chip-name-wrap'):null;
  if(!wrap)return;
  wrap.appendChild(dd);currentDD=dd;
}

function pickServing(g,d,mi,fi){
  var c=getC();if(!c)return;
  c.weekPlan[d][mi].foods[fi].g=g;
  closeDD();renderWeekTable();
}

/* ── Άνοιγμα συνταγής σε επεξεργάσιμα υλικά (γραμμάρια) ── */
function expandRecipeInPlan(d,mi,fi){
  var c=getC();if(!c)return;
  var food=c.weekPlan[d][mi].foods[fi];
  var rx=FYH_RECIPE_EXPAND[food.n];
  if(!rx){showErrorToast('Αυτή η συνταγή δεν έχει αναλυτικά υλικά για άνοιγμα.');return;}
  // Scale ingredients to the recipe's current portion
  var scale=(food.g||rx.base)/rx.base;
  var ings=rx.ing.map(function(ing){return {n:ing.n,g:Math.max(1,Math.round(ing.g*scale))};});
  // Replace the single recipe line with its ingredient lines
  var args=[fi,1].concat(ings);
  Array.prototype.splice.apply(c.weekPlan[d][mi].foods,args);
  save();renderWeekTable();
}

/* ── PHASE 2: Meal Timing Management ────────────────────────────────────── */
function initializeMealTiming(c){
  if(!c||!c.weekPlan)return;
  var trainDays=c.trainDays||[false,false,false,false,false,false,false];
  // ✅ FEATURE #2: Use weeklyTraining if available, otherwise fall back to trainTimes
  var trainTimes=[];
  for(var d=0;d<7;d++){
    if(c.weeklyTraining&&c.weeklyTraining[d]&&c.weeklyTraining[d].training){
      trainTimes[d]=c.weeklyTraining[d].time||'17:00';
      trainDays[d]=true;
    } else {
      trainTimes[d]=c.trainTimes?c.trainTimes[d]:null;
    }
  }

  // ✅ DEFAULT meal times (in HH:MM format)
  var DEFAULT_MEAL_TIMES={
    'Πρωινό':'08:00',
    'Ενδιάμεσο':'15:30',
    'Μεσημεριανό':'13:00',
    'Βραδινό':'20:00'
  };

  // ✅ FEATURE #1: Use CUSTOM meal times if available, otherwise defaults
  var MEAL_TIMES={
    'Πρωινό':(c.mealTimes&&c.mealTimes.breakfast)||DEFAULT_MEAL_TIMES['Πρωινό'],
    'Ενδιάμεσο':(c.mealTimes&&c.mealTimes.snack)||DEFAULT_MEAL_TIMES['Ενδιάμεσο'],
    'Μεσημεριανό':(c.mealTimes&&c.mealTimes.lunch)||DEFAULT_MEAL_TIMES['Μεσημεριανό'],
    'Βραδινό':(c.mealTimes&&c.mealTimes.dinner)||DEFAULT_MEAL_TIMES['Βραδινό']
  };

  for(var d=0;d<7;d++){
    if(!c.weekPlan[d])continue;
    c.weekPlan[d].forEach(function(meal,mi){
      if(!meal.mealTiming){
        var mealName=meal.name;
        var mealTime=MEAL_TIMES[mealName]||'12:00';
        var trainingTime=trainTimes[d];

        // ✅ NEW: If training day AND we know training time, assign pre/post-workout intelligently
        if(trainDays[d]&&trainingTime){
          // Convert times to minutes for calculation
          var [trainH,trainM]=trainingTime.split(':').map(Number);
          var trainingMinutes=trainH*60+trainM;

          var [mealH,mealM]=mealTime.split(':').map(Number);
          var mealMinutes=mealH*60+mealM;

          // Pre-workout: 2-3 hours before training (120-180 min)
          if(mealMinutes>=trainingMinutes-180&&mealMinutes<=trainingMinutes-120){
            meal.mealTiming='pre-workout';
          }
          // Post-workout: 0-30 min after training (assume 60min training duration)
          else if(mealMinutes>trainingMinutes&&mealMinutes<=trainingMinutes+30){
            meal.mealTiming='post-workout';
          }
          // If snack/intermediate is close to pre-workout time, mark it
          else if(/Ενδιάμεσο/.test(mealName)&&mealMinutes>=trainingMinutes-180&&mealMinutes<=trainingMinutes-90){
            meal.mealTiming='pre-workout';
          }
          // Otherwise, use training day defaults
          else if(/Πρωινό/.test(mealName)){
            meal.mealTiming='regular';
          } else if(/Μεσημεριανό/.test(mealName)){
            meal.mealTiming='recovery';
          } else if(/Βραδινό/.test(mealName)){
            meal.mealTiming='recovery';
          } else {
            meal.mealTiming='regular';
          }
        } else {
          // ✅ ORIGINAL LOGIC: If no training time, use defaults
          if(/Πρωινό/.test(mealName)){
            meal.mealTiming=trainDays[d]?'pre-workout':'regular';
          } else if(/Μεσημεριανό/.test(mealName)){
            meal.mealTiming=trainDays[d]?'post-workout':'recovery';
          } else if(/Βραδινό/.test(mealName)){
            meal.mealTiming=trainDays[d]?'recovery':'regular';
          } else {
            meal.mealTiming='regular';
          }
        }
      }
    });
  }
}


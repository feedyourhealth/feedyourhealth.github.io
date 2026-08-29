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

/* ── PHASE 3: Micronutrient Adequacy Display ──────────────────────────────── */
function getMicronutrientHtml(c){
  if(!c)return'';
  var targets=getMicronutrientTargets(c);
  var useAthletic=c.sport||((c.trainDays||[]).filter(function(x){return x;}).length>=3);

  var daysMN={};
  for(var d=0;d<7;d++){
    var meals=c.weekPlan[d]||[];
    daysMN[d]=getDayMicronutrients(meals);
  }

  // Calculate weekly average
  var weekMN={Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0,VitD:0};
  Object.keys(daysMN).forEach(function(d){
    var dmn=daysMN[d];
    ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA','VitD'].forEach(function(key){
      weekMN[key]+=dmn[key];
    });
  });
  ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA','VitD'].forEach(function(key){
    weekMN[key]=Math.round(weekMN[key]/7);
  });

  var adequacy=checkMicronutrientAdequacy(weekMN,targets,useAthletic);
  var criticalCount=0,lowCount=0;
  Object.keys(adequacy).forEach(function(key){
    if(adequacy[key].status==='critical')criticalCount++;
    else if(adequacy[key].status==='low')lowCount++;
  });

  // ════ ENHANCED: DETAILED TABLE WITH ALL MICRONUTRIENTS ════
  var html='<div style="background:var(--card-bg);border-radius:8px;padding:0;margin-top:8px;font-size:11px;border:1px solid var(--border-light)">';

  // Header summary
  html+='<div style="background:var(--panel-bg);padding:12px;border-bottom:1px solid #ddd;">';
  html+='<div style="font-weight:700;color:var(--text-strong);margin-bottom:8px;font-size:12px;">📊 Ανάλυση Μικροθρεπτικών (Ημερήσιος Μέσος Όρος 7 Ημερών)</div>';

  if(criticalCount>0||lowCount>0){
    html+='<div style="background:#fff3e0;border-left:3px solid #ff9800;padding:8px;border-radius:3px;color:#e65100;font-size:10px;">'
      +'<b>⚠️ '+criticalCount+' κρίσιμα</b>, <b>'+lowCount+' χαμηλά</b> — Χρειάζεται προσοχή'
      +'</div>';
  } else {
    html+='<div style="background:#e8f5e9;border-left:3px solid #4caf50;padding:8px;border-radius:3px;color:var(--good);font-size:10px;">'
      +'<b>✅ Επαρκής</b> — Όλα τα μικροθρεπτικά στο στόχο'
      +'</div>';
  }
  html+='</div>';

  // Detailed table
  html+='<table style="width:100%;border-collapse:collapse;margin:0;">';
  html+='<thead><tr style="background:#e0e0e0;font-weight:700;text-align:left;border-bottom:2px solid #999;">'
    +'<th style="padding:8px 10px;text-align:left;width:35%;">Μικροθρεπτικό</th>'
    +'<th style="padding:8px 10px;text-align:center;width:15%;">Όντως</th>'
    +'<th style="padding:8px 10px;text-align:center;width:15%;">Στόχος</th>'
    +'<th style="padding:8px 10px;text-align:center;width:15%;">% Στόχου</th>'
    +'<th style="padding:8px 10px;text-align:center;width:20%;">Κατάσταση</th>'
    +'</tr></thead>';
  html+='<tbody>';

  // Sort by status (critical first, then low, then ok)
  var sortedKeys=['Fe','Zn','Mg','Ca','VitD','B12','B1','B2','B3','B6','Folate','Omega3','Omega6','Iodine','Choline','DHA'];
  var rows=[];

  sortedKeys.forEach(function(key){
    var adq=adequacy[key];
    var tgt=targets[MICRONUTRIENT_KEY_MAP[key]]||{};
    var label=tgt.label||key;
    var unit=tgt.unit||'';
    var actualVal=Math.round(adq.actual*10)/10;
    var targetVal=Math.round((useAthletic?tgt.athletic:tgt.target)*10)/10;
    var pct=adq.pct;
    var status=adq.status;
    var statusIcon='✅';
    var bgColor='#e8f5e9';

    if(status==='critical'){
      statusIcon='🔴';
      bgColor='#ffebee';
    } else if(status==='low'){
      statusIcon='⚠️';
      bgColor='#fff3e0';
    }

    rows.push({
      key:key,
      label:label,
      actual:actualVal,
      target:targetVal,
      unit:unit,
      pct:pct,
      status:status,
      icon:statusIcon,
      bg:bgColor,
      statusPriority:status==='critical'?0:status==='low'?1:2
    });
  });

  // Sort by priority (critical first)
  rows.sort(function(a,b){return a.statusPriority-b.statusPriority;});

  rows.forEach(function(row){
    html+='<tr style="border-bottom:1px solid #eee;background:'+row.bg+';">';
    html+='<td style="padding:8px 10px;"><strong>'+row.label+'</strong></td>';
    html+='<td style="padding:8px 10px;text-align:center;">'+row.actual+' <span style="font-size:9px;color:#666;">'+row.unit+'</span></td>';
    html+='<td style="padding:8px 10px;text-align:center;"><span style="font-size:10px;color:#666;">'+row.target+' '+row.unit+'</span></td>';
    html+='<td style="padding:8px 10px;text-align:center;"><strong style="font-size:12px;'+(row.pct>=90?'color:var(--good);':row.pct>=65?'color:#e65100;':'color:#d32f2f;')+'">'+row.pct+'%</strong></td>';
    var statusLabel=row.status==='critical'?'Κρίσιμο':row.status==='low'?'Χαμηλό':'Επαρκές';
    html+='<td style="padding:8px 10px;text-align:center;"><span style="font-size:13px;">'+row.icon+'</span> <span style="font-size:9px;color:#666;">'+statusLabel+'</span></td>';
    html+='</tr>';
  });

  html+='</tbody></table>';
  html+='</div>';

  // ✅ ADD DAILY TOTALS & STATUS HEADERS
  html+='<div style="margin-top:20px;display:grid;grid-template-columns:repeat(7,1fr);gap:10px;">';
  var tdeeResult = calcTDEE(c);
  var targetTotals = {k: tdeeResult.target}; // ✅ FIX: calcTDEE() returns .target for kcal, not .k — getDayStatus expects .k
  for(var dayIdx = 0; dayIdx < 7; dayIdx++){
    var dayMeals = c.weekPlan[dayIdx] || [];
    var dayTotals = calculateDailyTotals(dayMeals);
    var dayStatus = getDayStatus(dayTotals, targetTotals);

    html+='<div class="day-header">'
      +'<div style="flex:1">'
      +'<div class="day-header-title">'+DAYS[dayIdx]+'</div>'
      +'<div class="day-header-totals" style="margin-top:6px;">'
      +'<div class="day-total-item kcal">'+dayTotals.k+' kcal</div>'
      +'</div>'
      +'<div style="margin-top:4px;font-size:10px;color:#666">'
      +'Π: '+dayTotals.p+'g | Λ: '+dayTotals.f+'g | Υ: '+dayTotals.c+'g'
      +'</div>'
      +'</div>'
      +'<div class="day-status-badge '+dayStatus.status+'">'+dayStatus.label+'</div>'
      +'</div>';
  }
  html+='</div>';

  // Footer note
  html+='<div style="background:var(--panel-bg);padding:10px;border-top:1px solid #ddd;border-radius:0 0 8px 8px;font-size:9px;color:#666;line-height:1.5;">';
  html+='<strong>📌 Σημειώσεις:</strong> Τα ποσοστά βασίζονται σε '+(useAthletic?'<strong>αθλητικούς</strong>':'<strong>κανονικούς</strong>')+' στόχους. Για ελλείψεις <strong>≥25%</strong>, εξετάστε τα συμπληρώματα στην ενότητα 💊 <strong>Προτάσεις</strong>.';
  html+='</div>';

  return html;
}

/* ---- Auto-Backup System (Every 1 Hour) ---- */
function autoBackupClients(){
  try{
    var clientsData=safeStorageGet('clients', []);
    if(!clientsData||!clientsData.length)return; // No clients to backup

    var now=new Date();
    var timestamp=now.getFullYear()+'-'+(now.getMonth()+1).toString().padStart(2,'0')+'-'+now.getDate().toString().padStart(2,'0')+'_'+now.getHours().toString().padStart(2,'0')+'-'+now.getMinutes().toString().padStart(2,'0');
    var filename='Dietologist_backup_'+timestamp+'.json';

    // Use correct format that importBackup() expects
    var dataStr=JSON.stringify({clients:clientsData},null,2);
    var blob=new Blob([dataStr],{type:'application/json'});
    var url=URL.createObjectURL(blob);

    var link=document.createElement('a');
    link.href=url;
    link.download=filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show brief notification
    var notif=document.createElement('div');
    notif.style.cssText='position:fixed;bottom:20px;right:20px;background:#4CAF50;color:white;padding:12px 16px;border-radius:8px;font-size:12px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,0.2);';
    notif.innerHTML='✓ Αυτόματο backup αποθηκεύτηκε: '+filename;
    document.body.appendChild(notif);
    setTimeout(function(){notif.remove();},3000);
  }catch(e){console.error('Backup error:',e);}
}

// Start auto-backup every 1 hour (3600000 ms)
function initAutoBackup(){
  autoBackupClients(); // Run once immediately after a delay
  setInterval(autoBackupClients,3600000); // Then every 1 hour
}

// ✅ ACTIVATE AUTO-BACKUP ON PAGE LOAD
window.addEventListener('load', function(){
  setTimeout(initAutoBackup, 2000); // Start after 2 seconds to ensure page is ready
});

// ✅ Phase 3: Enhanced saveCombo with metadata for smart generation
function saveCombo(d,mi){
  var c=getC();if(!c)return;
  var meal=c.weekPlan[d]&&c.weekPlan[d][mi];
  if(!meal||!meal.foods||!meal.foods.length){showErrorToast('Δεν υπάρχουν τρόφιμα για αποθήκευση.');return;}
  showPromptDialog('Όνομα συνδυασμού:', meal.name||'', function(name){
    if(!name||!name.trim())return;

    // Calculate nutritional info for this meal
    var mealKcal=0,mealP=0,mealF=0,mealC=0;
    meal.foods.forEach(function(f){
      var macros=cm(f.n,f.g);
      mealKcal+=macros.k;mealP+=macros.p;mealF+=macros.f;mealC+=macros.c;
    });

    // Create enhanced combo object (for smart generation learning)
    var combo={
      id:'c'+Date.now(),
      name:name.trim(),
      foods:deepClone(meal.foods),
      kcal:Math.round(mealKcal),
      p:Math.round(mealP),f:Math.round(mealF),c:Math.round(mealC),
      mealTiming:meal.mealTiming||'regular',
      dietType:c.dietType||'normal', // so findSavedComboMatch's diet check actually applies
      tags:['approved','manual'], // Mark as dietitian-approved
      createdAt:new Date().toISOString(),
      notes:'' // Optional: why this combo works
    };

    var combos=getSavedCombos();
    combos.push(combo);
    setSavedCombos(combos);
    showSuccessToast('✅ Σύνδυασμός αποθηκευμένος! Το σύστημα θα τον προτείνει στα μελλοντικά πλάνα.');
    renderFoodLib('');
  }, {title:'Αποθήκευση συνδυασμού'});
}

function deleteCombo(id){
  showConfirmDialog('Διαγραφή συνδυασμού;', function(){
    setSavedCombos(getSavedCombos().filter(function(x){return x.id!==id;}));
    renderFoodLib('');
  });
}

function copyMealToClipboard(d,mi){
  var c=getC();if(!c)return;
  var meal=c.weekPlan[d]&&c.weekPlan[d][mi];
  if(!meal||!meal.foods||!meal.foods.length){showErrorToast('Δεν υπάρχουν τρόφιμα για αντιγραφή.');return;}

  // Store meal data in window clipboard buffer
  window.mealClipboard={
    d:d,
    mi:mi,
    meal:deepClone(meal)
  };

  // Show user feedback
  var foodList=meal.foods.map(function(f){return f.n+' ('+f.g+'g)';}).join(', ');
  showSuccessToast('✅ Γεύμα αντιγράφηκε!\n\nΤρόφιμα: '+foodList+'\n\nΌταν πατήσεις + σε άλλο γεύμα, θα δεις επιλογή για επικόλληση.');
}

function pasteMealFromClipboard(d,mi){
  if(!window.mealClipboard){showErrorToast('Δεν υπάρχει γεύμα αποθηκευμένο.');return;}

  var c=getC();if(!c)return;
  var sourceMeal=window.mealClipboard.meal;

  // Copy all foods from clipboard
  sourceMeal.foods.forEach(function(food){
    c.weekPlan[d][mi].foods.push(deepClone(food));
  });

  save();
  renderWeekTable();
  showSuccessToast('✅ Γεύμα επικολλήθηκε!');
}

/* ---- Favorite Meals System ---- */
function getFavoriteMeals(){
  return safeStorageGet('favoriteMeals', []);
}

function saveFavoriteMeals(meals){
  safeStorageSet('favoriteMeals', meals);
}

function toggleFavoriteMeal(d,mi,btn){
  var c=getC();if(!c)return;
  var meal=c.weekPlan[d]&&c.weekPlan[d][mi];
  if(!meal||!meal.foods||!meal.foods.length)return;

  var favs=getFavoriteMeals();
  var mealKey=d+'_'+mi+'_'+(meal.foods.map(function(f){return f.n+f.g;}).join('|'));
  var idx=favs.findIndex(function(f){return f.key===mealKey;});

  if(idx>=0){
    // Remove from favorites
    favs.splice(idx,1);
    btn.style.opacity='0.5';
    showSuccessToast('✅ Αφαιρέθηκε από αγαπημένα');
  } else {
    // Add to favorites
    favs.push({
      key:mealKey,
      name:meal.name||'Γεύμα',
      foods:deepClone(meal.foods),
      createdAt:new Date().toISOString()
    });
    btn.style.opacity='1';
    showErrorToast('⭐ Προστέθηκε στα αγαπημένα!');
  }

  saveFavoriteMeals(favs);
  renderWeekTable();
}

function isFavoriteMeal(d,mi){
  var c=getC();if(!c)return false;
  var meal=c.weekPlan[d]&&c.weekPlan[d][mi];
  if(!meal||!meal.foods)return false;

  var favs=getFavoriteMeals();
  var mealKey=d+'_'+mi+'_'+(meal.foods.map(function(f){return f.n+f.g;}).join('|'));
  return favs.some(function(f){return f.key===mealKey;});
}

function showFavoriteMeals(){
  var favs=getFavoriteMeals();
  if(!favs.length){showErrorToast('Δεν υπάρχουν αγαπημένα γεύματα ακόμη.');return;}

  var html='<div style="background:var(--card-bg);border-radius:10px;padding:15px;max-width:500px">';
  html+='<h3 style="color:#025857;margin-top:0;margin-bottom:15px">⭐ Αγαπημένα Γεύματα</h3>';

  favs.forEach(function(fav,idx){
    var foodList=fav.foods.map(function(f){return f.n+' ('+f.g+'g)';}).join(', ');
    html+='<div style="background:var(--panel-bg);padding:10px;border-radius:6px;margin-bottom:10px">'
      +'<div style="font-weight:600;color:#025857;margin-bottom:5px">'+fav.name+'</div>'
      +'<div style="font-size:11px;color:#666;margin-bottom:8px">'+foodList+'</div>'
      +'<div style="display:flex;gap:5px">'
        +'<button onclick="pasteFavoriteMeal('+idx+')" style="background:#4caf50;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:10px">📋 Χρήση</button>'
        +'<button onclick="removeFavoriteMeal('+idx+')" style="background:#f44336;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:10px">✕ Διαγραφή</button>'
      +'</div>'
      +'</div>';
  });

  html+='</div>';

  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999';
  modal.innerHTML='<div style="background:var(--card-bg);border-radius:10px;padding:20px;max-width:600px;max-height:80vh;overflow-y:auto">'+html+'<button onclick="this.closest(\'div\').parentElement.remove()" style="width:100%;margin-top:15px;padding:8px;background:#999;color:#fff;border:none;border-radius:5px;cursor:pointer">Κλείσιμο</button></div>';
  document.body.appendChild(modal);

  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
}

function pasteFavoriteMeal(idx){
  var favs=getFavoriteMeals();
  var fav=favs[idx];
  if(!fav)return;

  // Ask which meal to paste to
  var c=getC();if(!c)return;
  showPromptDialog('Επιλέξτε ημέρα και γεύμα:', '', function(input){
    if(!input)return;
    var parts=input.split('-');
    var d=parseInt(parts[0]),mi=parseInt(parts[1]);
    if(isNaN(d)||isNaN(mi)||d<0||d>6||mi<0||mi>4){showErrorToast('Άκυρη επιλογή');return;}

    if(!c.weekPlan[d]||!c.weekPlan[d][mi]){showErrorToast('Το γεύμα δεν υπάρχει');return;}

    // Paste the meal
    fav.foods.forEach(function(food){
      c.weekPlan[d][mi].foods.push(deepClone(food));
    });

    save();
    renderWeekTable();
    showSuccessToast('✅ Αγαπημένο γεύμα επικολλήθηκε!');
  }, {title:'Επικόλληση αγαπημένου γεύματος', placeholder:'π.χ. 0-0 για Δευτέρα-Πρωί, 1-0 για Τρίτη-Πρωί'});
}

function removeFavoriteMeal(idx){
  showConfirmDialog('Διαγραφή αγαπημένου γεύματος;', function(){
    var favs=getFavoriteMeals();
    favs.splice(idx,1);
    saveFavoriteMeals(favs);
    showFavoriteMeals();
  });
}

/* ---- Macro Balance Check & Suggestions ---- */
function balanceMacros(d,mi){
  var c=getC();if(!c)return;
  var meal=c.weekPlan[d]&&c.weekPlan[d][mi];
  if(!meal||!meal.foods||!meal.foods.length){showErrorToast('Δεν υπάρχουν τρόφιμα');return;}

  // Calculate current macros
  var totalK=0,totalP=0,totalF=0,totalC=0;
  meal.foods.forEach(function(f){
    var macros=cm(f.n,f.g);
    totalK+=macros.k;totalP+=macros.p;totalF+=macros.f;totalC+=macros.c;
  });

  // Get meal targets (rough estimate: 30% of daily target per meal)
  var tdeeR=calcTDEE(c);
  var targetP=Math.round(tdeeR.p*0.30);
  var targetF=Math.round(tdeeR.f*0.30);
  var targetC=Math.round(tdeeR.carb*0.30);
  var targetK=Math.round(tdeeR.target*0.25);

  // Calculate differences
  var diffP=totalP-targetP;
  var diffF=totalF-targetF;
  var diffC=totalC-targetC;
  var diffK=totalK-targetK;

  // Generate suggestions
  var suggestions=[];
  if(Math.abs(diffP)>5){
    if(diffP<0){
      suggestions.push('➕ <b>Πρωτεΐνη χαμηλή:</b> Προσθέστε κοτόπουλο, ψάρι ή cottage cheese');
    } else {
      suggestions.push('➖ <b>Πρωτεΐνη υψηλή:</b> Μειώστε τη μερίδα κρέατος ή ψαριού');
    }
  }

  if(Math.abs(diffF)>5){
    if(diffF<0){
      suggestions.push('➕ <b>Λιπίδια χαμηλά:</b> Προσθέστε ελαιόλαδο, ξηρούς καρπούς ή σπόρους');
    } else {
      suggestions.push('➖ <b>Λιπίδια υψηλά:</b> Μειώστε το ελαιόλαδο ή τους ξηρούς καρπούς');
    }
  }

  if(Math.abs(diffC)>5){
    if(diffC<0){
      suggestions.push('➕ <b>Υδατάνθρακες χαμηλοί:</b> Προσθέστε ρύζι, πατάτες ή δημητριακά');
    } else {
      suggestions.push('➖ <b>Υδατάνθρακες υψηλοί:</b> Μειώστε τα δημητριακά');
    }
  }

  // Build report
  var report='<div style="background:var(--card-bg);border-radius:10px;padding:15px;max-width:500px">';
  report+='<h3 style="color:#025857;margin-top:0">⚖️ Ανάλυση Μακροθρεπτικών</h3>';

  report+='<div style="background:var(--panel-bg);padding:12px;border-radius:6px;margin-bottom:15px">';
  report+='<div style="font-weight:600;color:#025857;margin-bottom:8px">📊 Τρέχοντα Macros:</div>';
  report+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px">';
  report+='<div>Πρωτεΐνη: <b>'+Math.round(totalP)+'g</b> (στόχος: ~'+targetP+'g)</div>';
  report+='<div>Λιπίδια: <b>'+Math.round(totalF)+'g</b> (στόχος: ~'+targetF+'g)</div>';
  report+='<div>Υδατάνθρακες: <b>'+Math.round(totalC)+'g</b> (στόχος: ~'+targetC+'g)</div>';
  report+='<div>Θερμίδες: <b>'+Math.round(totalK)+'</b> (στόχος: ~'+targetK+')</div>';
  report+='</div></div>';

  if(suggestions.length){
    report+='<div style="background:#fff3cd;padding:12px;border-radius:6px;border-left:4px solid #ffc107">';
    report+='<div style="font-weight:600;color:#856404;margin-bottom:8px">💡 Προτάσεις:</div>';
    suggestions.forEach(function(s){
      report+='<div style="font-size:12px;color:#856404;margin-bottom:6px">'+s+'</div>';
    });
    report+='</div>';
  } else {
    report+='<div style="background:#d4edda;padding:12px;border-radius:6px;border-left:4px solid #28a745">';
    report+='<div style="font-weight:600;color:#155724">✅ Τέλεια ισορροπία!</div>';
    report+='</div>';
  }

  report+='</div>';

  // Show modal
  var modal=document.createElement('div');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999';
  modal.innerHTML='<div style="background:var(--card-bg);border-radius:10px;padding:20px;max-width:550px;max-height:80vh;overflow-y:auto">'+report+'<button onclick="this.closest(\'div\').parentElement.remove()" style="width:100%;margin-top:15px;padding:8px;background:#999;color:#fff;border:none;border-radius:5px;cursor:pointer">Κλείσιμο</button></div>';
  document.body.appendChild(modal);

  modal.addEventListener('click',function(e){if(e.target===modal)modal.remove();});
}

/* ---- Food library ---- */
function renderFoodLib(q){
  var el=document.getElementById('lib-list');if(!el)return;
  q=(q||'').toLowerCase().trim();

  // ── Saved combos section (shown only when not searching) ──
  var comboHtml='';
  if(!q){
    var libC=getC();
    var libExclLower=((libC&&libC.foodExclude)||[]).map(function(x){return (x||'').toLowerCase();}).filter(Boolean);
    var combos=getSavedCombos().filter(function(combo){
      return comboDietOK(libC&&libC.dietType, combo.dietType) && !comboHasExcludedFood(combo.foods, libExclLower);
    });
    comboHtml='<div class="combo-section">'
      +'<div class="combo-sec-title">📋 Αποθηκευμένοι Συνδυασμοί</div>';
    if(!combos.length){
      comboHtml+='<div style="font-size:10px;color:var(--text-muted);padding:2px 4px 4px">Κανένας ακόμα — πάτα 💾 σε γεύμα</div>';
    } else {
      combos.forEach(function(combo){
        var cid=combo.id.replace(/'/g,"\\'");
        var preview=combo.foods.slice(0,3).map(function(f){return f.n;}).join(', ')+(combo.foods.length>3?' +':'');
        comboHtml+='<div class="combo-item" draggable="true" data-combo="'+combo.id+'">'
          +'<span class="combo-name">'+combo.name+'</span>'
          +'<span class="combo-count">'+combo.foods.length+'</span>'
          +'<button class="combo-del" onclick="deleteCombo(\''+cid+'\')" title="Διαγραφή">&times;</button>'
          +'</div>'
          +'<div class="combo-preview">'+preview+'</div>';
      });
    }
    comboHtml+='</div>';
  }

  var cats={};
  Object.keys(FOODS).forEach(function(n){
    if(q&&n.toLowerCase().indexOf(q)<0)return;
    var cat=FOODS[n].cat;if(!cats[cat])cats[cat]=[];cats[cat].push(n);
  });
  if(!Object.keys(cats).length){el.innerHTML=comboHtml+'<div style="color:var(--text-muted);font-size:11px;padding:6px">Δεν βρέθηκε</div>';return;}
  var html=comboHtml;
  Object.keys(cats).sort().forEach(function(cat){
    html+='<div class="lib-cat">'+cat+'</div>';
    cats[cat].forEach(function(n){
      var hasIng=(FOODS[n].ingredients||(typeof FYH_RECIPE_EXPAND!=='undefined'&&FYH_RECIPE_EXPAND[n]))?'<button class="lib-recipe-btn" onclick="showRecipeModal(\''+n.replace(/'/g,"\\'")+'\')" title="Δείτε τα συστατικά">📖</button>':'';
      html+='<div class="lib-item" draggable="true" data-food="'+n+'"><span>'+n+'</span>'+hasIng+'<span class="lib-kcal">'+FOODS[n].k+'</span></div>';
    });
  });
  el.innerHTML=html;
  refreshActiveMealIndicator();
  // Drag: saved combos
  el.querySelectorAll('.combo-item').forEach(function(item){
    item.addEventListener('dragstart',function(e){
      e.dataTransfer.setData('text/plain','combo:'+item.dataset.combo);
      e.dataTransfer.effectAllowed='copy';
      setTimeout(function(){item.classList.add('dragging');},0);
    });
    item.addEventListener('dragend',function(){item.classList.remove('dragging');});
    // ✅ Click-to-add: πάτημα σε συνδυασμό τον προσθέτει στο ενεργό γεύμα (βλ. setActiveMealTarget)
    item.addEventListener('click',function(e){
      if(e.target.closest('.combo-del'))return;
      addLibItemToActiveTarget('combo:'+item.dataset.combo);
    });
  });
  // Drag: foods
  el.querySelectorAll('.lib-item').forEach(function(item){
    item.addEventListener('dragstart',function(e){
      e.dataTransfer.setData('text/plain',item.dataset.food);
      e.dataTransfer.effectAllowed='copy';
      setTimeout(function(){item.classList.add('dragging');},0);
    });
    item.addEventListener('dragend',function(){item.classList.remove('dragging');});
    // ✅ Click-to-add: πάτημα σε τρόφιμο το προσθέτει στο ενεργό γεύμα (βλ. setActiveMealTarget) —
    // εναλλακτικό στο drag, χρήσιμο όταν στόχος/βιβλιοθήκη δεν χωράνε ταυτόχρονα στην οθόνη.
    item.addEventListener('click',function(e){
      if(e.target.closest('.lib-recipe-btn'))return;
      addLibItemToActiveTarget(item.dataset.food);
    });
  });
}
function filterLib(inp){renderFoodLib(inp.value);}


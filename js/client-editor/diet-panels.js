// js/client-editor/diet-panels.js
// The last of app-part1.js (module split wave 35 — app-part1.js is now removed).
// The template-editor panel of the client editor:
//   TEMPLATE EDITOR: curTmplGoal, selectTmpl, renderTemplateEditor, swTmplGoal,
//     renderTmplTable, tmplUpdG/tmplAddF/tmplDelF, resetTmpl, buildTmplSelectorHtml,
//     showSaveTmplPanel/closeSaveTmplPanel/doSaveAsTmpl
// PLAN HISTORY moved to js/client-editor/plan-history.js (2026-10-22).
// Only `var curTmplGoal = 'maintain'` runs at parse time. Callers (renderMain,
// core/persistence save-hook, form-controls tab switch, app-part2 selectTmplForClient,
// meal-slots) are all runtime. Loads last in the client-editor/ group.

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
        // Ακέραιο τρόφιμο με γραμμάρια < μισή μερίδα → δείξε πραγματικά γραμμάρια, όχι «1 φέτα».
        var tSubUnitWhole = tfu && tDisplayUnit !== 'g' && WHOLE_UNIT_FOODS[food.n] && Math.round(food.g / tfu.g) < 1;
        if (tDisplayUnit === 'g' || !tfu || tSubUnitWhole) {
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
        var tUnit = pluralUnit(tSubUnitWhole ? 'g' : tDisplayUnit, tVal);
        html+='<div class="food-chip">'
          +'<div class="chip-name-wrap">'
          +'<input class="chip-inp" type="text" value="'+food.n+'" autocomplete="off" spellcheck="false"'
          +' data-d="'+d+'" data-mi="'+mi+'" data-fi="'+fi+'" data-mode="tmpl"'
          +' oninput="showChipSug(this)" onfocus="showChipSug(this)" onblur="closeDD()">'
          +'</div>'
          +'<input class="chip-g" type="number" min="0" step="'+(tDisplayUnit==='g'||!tfu||tSubUnitWhole?'1':'0.1')+'" max="'+tMax+'" value="'+tVal+'" onchange="'+tChg+'">'
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
  // Built-in reference templates: calorie-level references + sport-specific plans
  // (football/running are keyed in DEFAULT_TMPLS like any goal but have no "κύριος στόχος"
  // radio — expose them here so a dietitian can base any client's plan on them).
  var kcalKeys=['kcal2000','kcal2300','kcal2500','kcal2700','kcal3000','mediterranean','running','football'];
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
    // 2026-11-22: χωρίς στόχο έβγαινε «— undefined» — παραλείπεται το κομμάτι αντί για κενό/undefined.
    opts+='<option value="'+ct.id+'"'+(sel===ct.id?' selected':'')+'>⭐ '+esc(ct.name)+(gl?' — '+esc(gl):'')+(db?' · '+db:'')+(ct.createdAt?' ('+esc(ct.createdAt)+')':'')+'</option>';
  });
  // Existing clients' plans (as basis for new plans) — same-diet clients first, same reasoning.
  var clientsWithPlans=clients.filter(function(cl){
    var hasWeekPlan=Object.keys(cl.weekPlan||{}).length>0;
    // 2026-11-22: όχι πελάτες στον κάδο (εκτός αν είναι ήδη η επιλεγμένη βάση, για να μην αλλάξει σιωπηλά).
    return cl.id!==c.id && hasWeekPlan && (!cl.deleted || sel==='__client_'+cl.id);
  });
  // 2026-11-22: ~170 επιλογές → δύο ομάδες: ⭐ πελάτες-πρότυπα γεύσης (οι «καλές» εβδομάδες σου) και
  // όλοι οι άλλοι. Σε κάθε ομάδα: ίδιος τύπος διατροφής πρώτα, μετά πιο πρόσφατο πλάνο πρώτα (πριν ήταν
  // σειρά δημιουργίας). Δίπλα πόσο παλιό είναι το πλάνο. + αναζήτηση (tmplSelFilter).
  function planAgeMs(cl){ return (typeof planRenewalBaseMs==='function')?planRenewalBaseMs(cl):(+cl.planGeneratedAt||0); }
  function rank(cl){ return ((cl.dietType||'normal')===(c.dietType||'normal')?0:1); }
  clientsWithPlans.sort(function(a,b){ return rank(a)-rank(b) || planAgeMs(b)-planAgeMs(a); });
  function clientOpt(cl){
    var cGoal=GOAL_LABELS[cl.goalMain]||cl.goalMain;
    var cName=cl.name||'Νέος πελάτης';
    var cdb=DIET_TYPE_BADGE[cl.dietType||'normal'];
    var t=planAgeMs(cl), days=t?Math.floor((Date.now()-t)/86400000):null;
    var age=days==null?'':(days<1?' · σήμερα':(days<60?' · πριν '+days+' ημ.':' · πριν '+Math.round(days/30)+' μήνες'));
    return '<option value="__client_'+cl.id+'"'+(sel==='__client_'+cl.id?' selected':'')+'>'+(cl.isMealTemplate?'⭐ ':'👤 ')+esc(cName)+(cGoal?' — '+esc(cGoal):'')+(cdb?' · '+cdb:'')+age+'</option>';
  }
  var starred=clientsWithPlans.filter(function(cl){ return cl.isMealTemplate; });
  var others=clientsWithPlans.filter(function(cl){ return !cl.isMealTemplate; });
  if(starred.length) opts+='<optgroup label="⭐ Πελάτες-πρότυπα γεύσης ('+starred.length+')">'+starred.map(clientOpt).join('')+'</optgroup>';
  if(others.length) opts+='<optgroup label="👤 Πλάνα πελατών — πιο πρόσφατα πρώτα ('+others.length+')">'+others.map(clientOpt).join('')+'</optgroup>';
  return '<div class="tmpl-sel-row">'
    +'<label for="tmpl-sel-drop">📋 Βάση πλάνου:</label>'
    +'<input type="search" class="tmpl-sel-search" placeholder="🔍 Αναζήτηση πελάτη ή προτύπου…" aria-label="Αναζήτηση στη βάση πλάνου" oninput="tmplSelFilter(this)" onkeydown="tmplSelSearchKey(event,this)">'
    +'<select id="tmpl-sel-drop" class="tmpl-sel-drop" onchange="tmplSelFilterReset(this);selectTmplForClient(this.value)">'+opts+'</select>'
    +'<span class="tmpl-sel-count" aria-live="polite"></span>'
    +'</div>';
}
// 🔍 Φιλτράρει τις επιλογές της «Βάσης πλάνου» (χωρίς τόνους/κεφαλαία). Με κείμενο, η λίστα
// ανοίγει επί τόπου (size) ώστε να φαίνονται τα αποτελέσματα· κλικ ή Enter = επιλογή.
function tmplSelNorm(s){ s=String(s||'').toLowerCase(); return (typeof normalizeGreekText==='function')?normalizeGreekText(s):s; }
function tmplSelFilter(inp){
  var row=inp.closest('.tmpl-sel-row'), sel=row&&row.querySelector('select'), cnt=row&&row.querySelector('.tmpl-sel-count');
  if(!sel) return;
  var q=tmplSelNorm(inp.value.trim()), n=0;
  Array.prototype.forEach.call(sel.options,function(o,i){
    var show=!q || i===0 || tmplSelNorm(o.textContent).indexOf(q)>-1;
    o.hidden=!show; if(q && show && i>0) n++;
  });
  Array.prototype.forEach.call(sel.querySelectorAll('optgroup'),function(g){
    g.hidden=!Array.prototype.some.call(g.children,function(o){ return !o.hidden; });
  });
  var gVis=Array.prototype.filter.call(sel.querySelectorAll('optgroup'),function(g){ return !g.hidden; }).length;
  sel.size=q?Math.max(2,Math.min(10,n+1+gVis)):1;   // +1 «Προεπιλεγμένο», + τίτλοι ομάδων
  // η γραμμή είναι τελευταία πριν τη μόνιμη μπάρα «Δημιουργία πλάνου» — κύλισε ώστε να φαίνεται όλη η λίστα
  if(q){ try{ row.scrollIntoView({block:'nearest'}); var m=document.querySelector('.main'); if(m) m.scrollTop+=80; }catch(e){} }
  if(cnt) cnt.textContent=q?(n?n+' αποτελέσματα':'κανένα αποτέλεσμα'):'';
}
function tmplSelSearchKey(e,inp){
  if(e.key!=='Enter' && e.key!=='ArrowDown') return;
  var sel=inp.closest('.tmpl-sel-row').querySelector('select');
  var first=Array.prototype.filter.call(sel.options,function(o,i){ return i>0 && !o.hidden; })[0];
  if(!first) return;
  e.preventDefault();
  if(e.key==='ArrowDown'){ sel.focus(); first.selected=true; return; }
  sel.value=first.value; tmplSelFilterReset(sel); selectTmplForClient(first.value);
}
function tmplSelFilterReset(sel){
  var row=sel.closest('.tmpl-sel-row'), inp=row&&row.querySelector('.tmpl-sel-search');
  if(inp && inp.value){ inp.value=''; tmplSelFilter(inp); }
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

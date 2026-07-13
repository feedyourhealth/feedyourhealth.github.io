// ═══════════════════════════════════════════════════════════════
// ΣΥΝΤΑΓΕΣ — recipe library with meal-time categories (Phase 5)
// ═══════════════════════════════════════════════════════════════
// MEAL_RECIPES/SNACK_RECIPES (js/data.js) are static, code-defined
// datasets shared by the whole app. The dietitian's own categorization
// (mealTimes, ⭐ δημοφιλές) is personal workflow state, so — like the
// existing favoriteMeals feature — it's kept separately in localStorage,
// keyed by recipe id, and overlaid on top of the static recipe data.

var RECIPE_MEAL_TIME_CATEGORIES=['Πρωινά','Ενδιάμεσα','Μεσημεριανά','Βραδινά'];

// Curated diet-type filter options. Recipe `tags` (js/data.js) are a free mix of diet-type,
// ingredient and descriptor words (~80 distinct values) — we whitelist the nutritionally
// meaningful ones here rather than exposing every raw tag as a filter option.
var RECIPE_DIET_TAG_DEFS=[
  {key:'mediterranean',label:'Mediterranean',match:['mediterranean']},
  {key:'keto',label:'Keto',match:['keto','ketogenic']},
  {key:'lowcarb',label:'Low Carb',match:['lowcarb']},
  {key:'vegan',label:'Vegan',match:['vegan']},
  {key:'vegetarian',label:'Vegetarian',match:['vegetarian']},
  {key:'bodybuilding_clean',label:'Bodybuilding',match:['bodybuilding_clean']},
  {key:'high_protein',label:'Υψηλή πρωτεΐνη',match:['high_protein']}
];
function recipeHasDietTag(recipe,defKey){
  var def=RECIPE_DIET_TAG_DEFS.find(function(d){return d.key===defKey;});
  if(!def) return false;
  var tags=(recipe.tags||[]).map(function(t){return t.toLowerCase().replace(/\s+/g,'');});
  return def.match.some(function(m){return tags.indexOf(m)>-1;});
}
// Only offer diet-type options that currently match at least one recipe (avoids dead-end filters).
function availableRecipeDietTags(){
  var all=allRecipesForBrowsing();
  return RECIPE_DIET_TAG_DEFS.filter(function(def){
    return all.some(function(r){return recipeHasDietTag(r,def.key);});
  });
}

function getRecipeMeta(){ return safeStorageGet('recipeMeta', {}); }
function saveRecipeMetaAll(meta){ safeStorageSet('recipeMeta', meta); }

// Ενεργές κατηγορίες γεύματος μιας συνταγής. Άδειο/ανύπαρκτο = "οποιοδήποτε γεύμα" (καμία αλλαγή στη σημερινή συμπεριφορά).
function getRecipeMealTimes(recipe){
  var meta=getRecipeMeta();
  var ov=meta[recipe.id];
  if(ov && ov.mealTimes && ov.mealTimes.length) return ov.mealTimes;
  return recipe.mealTimes||[];
}
function isRecipePopular(recipe){
  var meta=getRecipeMeta();
  var ov=meta[recipe.id];
  if(ov && typeof ov.popular==='boolean') return ov.popular;
  return !!recipe.popular;
}
function setRecipeMealTimes(recipeId,mealTimes){
  var meta=getRecipeMeta();
  meta[recipeId]=meta[recipeId]||{};
  meta[recipeId].mealTimes=mealTimes;
  saveRecipeMetaAll(meta);
  // recipeMeta ζει σε localStorage αλλά ταξιδεύει στο cloud μέσα στο user_data blob (βλ. Cloud._pushNow) —
  // χωρίς αυτό το save() η αλλαγή συγχρονιζόταν μόνο ευκαιριακά, όποτε τύχαινε κάποιο άλλο save().
  if(typeof save==='function') save();
}
function toggleRecipePopular(recipe){
  var meta=getRecipeMeta();
  meta[recipe.id]=meta[recipe.id]||{};
  meta[recipe.id].popular=!isRecipePopular(recipe);
  saveRecipeMetaAll(meta);
  if(typeof save==='function') save();
}

function allRecipesForBrowsing(){
  return (typeof MEAL_RECIPES!=='undefined'?MEAL_RECIPES:[]).concat(typeof SNACK_RECIPES!=='undefined'?SNACK_RECIPES:[]).concat(window.customRecipes||[]);
}
function findRecipeById(id){
  return allRecipesForBrowsing().find(function(r){return r.id===id;});
}

// Χαρτογραφεί το όνομα γεύματος (π.χ. "Μεσημεριανό", "Ενδιάμεσο") στη μία από τις 4 κατηγορίες.
// Επιστρέφει null όταν δεν αναγνωρίζεται — τότε δεν μπαίνει κανένας περιορισμός (ασφαλές fallback).
function mealTypeToCategory(mealType){
  var s=(mealType||'').toLowerCase();
  if(s.indexOf('πρωιν')>-1) return 'Πρωινά';
  if(s.indexOf('μεσημεριαν')>-1) return 'Μεσημεριανά';
  if(s.indexOf('βραδιν')>-1) return 'Βραδινά';
  if(s.indexOf('ενδιάμεσ')>-1||s.indexOf('δεκατιαν')>-1||s.indexOf('απογευματιν')>-1||s.indexOf('σνακ')>-1||s.indexOf('μεσνύχτι')>-1||s.indexOf('workout')>-1) return 'Ενδιάμεσα';
  return null;
}

// ── Οθόνη Συνταγές ──
var _recipeSearchTerm='';
var _recipeCategoryFilter='';
var _recipeDietFilter='';
var _recipeSortMode='';
// Ποιες κάρτες έχουν ανοιχτά τα 4 κουμπιά επεξεργασίας ώρας γεύματος (αντί για τη μία συνοπτική ετικέτα).
var _categoryEditIds={};
// Ποιες κάρτες έχουν ανοιχτή τη λίστα υλικών.
var _expandedRecipeIds={};

function filterRecipes(val){ _recipeSearchTerm=(val||'').toLowerCase().trim(); renderRecipesList(); }
function setRecipeCategoryFilter(val){
  _recipeCategoryFilter=val;
  var chips=document.querySelectorAll('.rcp-filter-chip');
  chips.forEach(function(ch){ ch.classList.toggle('active', ch.dataset.val===val); });
  renderRecipesList();
}
function setRecipeDietFilter(val){ _recipeDietFilter=val; renderRecipesList(); }
function setRecipeSortMode(val){ _recipeSortMode=val; renderRecipesList(); }
function toggleCategoryEdit(recipeId){ _categoryEditIds[recipeId]=!_categoryEditIds[recipeId]; renderRecipesList(); }
function toggleRecipeExpand(recipeId){ _expandedRecipeIds[recipeId]=!_expandedRecipeIds[recipeId]; renderRecipesList(); }
function toggleRecipeMealTime(recipeId,category){
  var recipe=findRecipeById(recipeId);
  if(!recipe) return;
  var current=getRecipeMealTimes(recipe).slice();
  var idx=current.indexOf(category);
  if(idx>-1) current.splice(idx,1); else current.push(category);
  setRecipeMealTimes(recipeId,current);
  renderRecipesList();
}
function onToggleRecipePopular(recipeId){
  var recipe=findRecipeById(recipeId);
  if(!recipe) return;
  toggleRecipePopular(recipe);
  renderRecipesList();
}

// Περιοχή κατηγορίας ώρας γεύματος: μία συνοπτική ετικέτα by default (χωρίς κατηγορία, ή τα ενεργά tags),
// επεκτείνεται στα 4 κουμπιά επεξεργασίας μόνο όταν ο χρήστης το ζητήσει (toggleCategoryEdit) — έτσι οι
// 116+23 κάρτες δεν δείχνουν όλες 4 ανενεργά κουμπιά ταυτόχρονα.
function recipeCategoryHtml(recipe,mealTimes){
  if(_categoryEditIds[recipe.id]){
    var chips=RECIPE_MEAL_TIME_CATEGORIES.map(function(cat){
      var active=mealTimes.indexOf(cat)>-1;
      return '<button type="button" class="rcp-chip'+(active?' active':'')+'" onclick="toggleRecipeMealTime(\''+recipe.id+'\',\''+cat+'\')">'+cat+'</button>';
    }).join('');
    return '<div class="rcp-chips">'+chips+'<button type="button" class="rcp-cat-done" onclick="toggleCategoryEdit(\''+recipe.id+'\')">✓ Κλείσιμο</button></div>';
  }
  if(mealTimes.length){
    return '<div class="rcp-chips">'+mealTimes.map(function(cat){
      return '<span class="rcp-cat-pill active" onclick="toggleCategoryEdit(\''+recipe.id+'\')">'+cat+'</span>';
    }).join('')+'</div>';
  }
  return '<div class="rcp-chips"><button type="button" class="rcp-cat-pill" onclick="toggleCategoryEdit(\''+recipe.id+'\')">Χωρίς κατηγορία ▾</button></div>';
}

// Ζωντανή προσομοίωση κλιμάκωσης θερμίδων μιας συνταγής — καθαρά "τι θα γινόταν αν" εργαλείο, δεν
// αποθηκεύει/μεταβάλλει ποτέ τη MEAL_RECIPES/SNACK_RECIPES. Επαναχρησιμοποιεί το ήδη υπάρχον
// per-category αναλογικό scaling του scalePlan() (js/app-part1.js) αντί για νέα μαθηματικά.
// `scope` απομονώνει τα DOM ids ώστε το ίδιο scaler να μπορεί να υπάρχει ταυτόχρονα στην inline
// προεπισκόπηση της λίστας ΚΑΙ στο detail modal (Phase 3) για την ίδια συνταγή, χωρίς συγκρούσεις.
function recipeScalerHtml(recipe,scope){
  scope=scope||'row';
  var base=recipe.kcal||0;
  if(!base) return '';
  var min=Math.max(50,Math.round(base*0.5/10)*10);
  var max=Math.round(base*1.8/10)*10;
  var m=recipe.macro||{};
  return '<div class="rcp-scaler">'
    +'<div class="rcp-scaler-row">'
    +'<label for="rcp-scale-slider-'+scope+'-'+recipe.id+'">Στόχος θερμίδων</label>'
    +'<span id="rcp-scale-kcal-'+scope+'-'+recipe.id+'" class="rcp-scaler-out">'+base+' kcal</span>'
    +'</div>'
    +'<input type="range" id="rcp-scale-slider-'+scope+'-'+recipe.id+'" min="'+min+'" max="'+max+'" step="10" value="'+base+'" oninput="onRecipeScaleInput(\''+recipe.id+'\',this.value,\''+scope+'\')">'
    +'<div class="rcp-scaler-macros">'
    +'<span id="rcp-scale-p-'+scope+'-'+recipe.id+'">Π'+(m.p||0)+'</span>'
    +'<span id="rcp-scale-c-'+scope+'-'+recipe.id+'">Υ'+(m.c||0)+'</span>'
    +'<span id="rcp-scale-f-'+scope+'-'+recipe.id+'">Λ'+(m.f||0)+'</span>'
    +'</div>'
    +'</div>';
}
// Χειριστής του slider — ενημερώνει τα συγκεκριμένα DOM στοιχεία απευθείας (όχι renderRecipesList,
// που θα ξανάχτιζε όλη τη λίστα και θα διέκοπτε το drag του χρήστη).
function onRecipeScaleInput(recipeId,targetKcalStr,scope){
  scope=scope||'row';
  var recipe=findRecipeById(recipeId);
  if(!recipe) return;
  var targetKcal=parseInt(targetKcalStr,10);
  if(!targetKcal) return;
  var scaled=scalePlan([{name:recipe.name,foods:recipe.foods}],null,[{k:targetKcal}])[0];
  var totals={k:0,p:0,f:0,c:0};
  scaled.foods.forEach(function(f,idx){
    var v=cm(f.n,f.g);
    totals.k+=v.k;totals.p+=v.p;totals.f+=v.f;totals.c+=v.c;
    var el=document.getElementById('rcp-ing-g-'+scope+'-'+recipeId+'-'+idx);
    if(el) el.textContent=f.g+'g';
    // Ο στόχος θερμίδων ξανασκαλώνει πάντα από την ΑΡΧΙΚΗ recipe.foods — αν το υλικό είχε
    // αντικατασταθεί (Phase 4 swap) πριν κινηθεί ο slider, το όνομα ξαναγράφεται στο αρχικό
    // ώστε να μη μείνει "μπερδεμένο" όνομα με γραμμάρια υπολογισμένα για άλλο τρόφιμο.
    var nameEl=document.getElementById('rcp-ing-n-'+scope+'-'+recipeId+'-'+idx);
    if(nameEl) nameEl.textContent=f.n;
    var swapPanel=document.getElementById('rd-swap-panel-'+recipeId+'-'+idx);
    if(swapPanel){ swapPanel.style.display='none'; swapPanel.innerHTML=''; }
  });
  var kcalOut=document.getElementById('rcp-scale-kcal-'+scope+'-'+recipeId);
  if(kcalOut) kcalOut.textContent=Math.round(totals.k)+' kcal';
  var pOut=document.getElementById('rcp-scale-p-'+scope+'-'+recipeId);
  if(pOut) pOut.textContent='Π'+Math.round(totals.p);
  var cOut=document.getElementById('rcp-scale-c-'+scope+'-'+recipeId);
  if(cOut) cOut.textContent='Υ'+Math.round(totals.c);
  var fOut=document.getElementById('rcp-scale-f-'+scope+'-'+recipeId);
  if(fOut) fOut.textContent='Λ'+Math.round(totals.f);
}

function recipeRow(recipe){
  var mealTimes=getRecipeMealTimes(recipe);
  var popular=isRecipePopular(recipe);
  var m=recipe.macro||{};
  var expanded=!!_expandedRecipeIds[recipe.id];
  var ingredientsHtml=expanded
    ?'<div class="rcp-ingredients">'+(recipe.foods||[]).map(function(f,idx){return '<span class="rcp-ing">'+esc(f.n)+' · <span id="rcp-ing-g-row-'+recipe.id+'-'+idx+'">'+f.g+'g</span></span>';}).join('')+'</div>'+recipeScalerHtml(recipe,'row')
    :'';
  return '<div class="rcp-row">'
    +'<div class="rcp-row-top">'
    +'<div class="rcp-row-left">'
    +'<button type="button" class="rcp-expand-btn" title="Υλικά" aria-label="Προβολή υλικών" onclick="toggleRecipeExpand(\''+recipe.id+'\')">'+(expanded?'🔼':'🔽')+'</button>'
    +'<button type="button" class="rcp-name rcp-name-link" title="Πλήρης προβολή συνταγής" onclick="showRecipeDetailModal(\''+recipe.id+'\')">'+esc(recipe.name)+'</button>'
    +(recipe.source==='custom'?'<span class="rcp-custom-badge" title="Δική σου συνταγή">δική σου</span>':'')
    +'</div>'
    +'<button type="button" class="rcp-star'+(popular?' active':'')+'" title="Δημοφιλές" onclick="onToggleRecipePopular(\''+recipe.id+'\')">⭐</button>'
    +'</div>'
    +'<div class="rcp-sub">'+recipe.kcal+' kcal · Π'+(m.p||0)+' Λ'+(m.f||0)+' Υ'+(m.c||0)+'</div>'
    +ingredientsHtml
    +recipeCategoryHtml(recipe,mealTimes)
    +'</div>';
}

function renderRecipesList(){
  var container=document.getElementById('rcp-list');
  var countEl=document.getElementById('rcp-count');
  if(!container) return;
  var q=_recipeSearchTerm;
  var all=allRecipesForBrowsing();
  var filtered=all.filter(function(r){
    if(q){
      var nameMatch=(r.name||'').toLowerCase().indexOf(q)>-1;
      var tagMatch=(r.tags||[]).some(function(t){return t.toLowerCase().indexOf(q)>-1;});
      if(!nameMatch && !tagMatch) return false;
    }
    if(_recipeCategoryFilter==='popular' && !isRecipePopular(r)) return false;
    if(_recipeCategoryFilter && _recipeCategoryFilter!=='popular' && getRecipeMealTimes(r).indexOf(_recipeCategoryFilter)===-1) return false;
    if(_recipeDietFilter && !recipeHasDietTag(r,_recipeDietFilter)) return false;
    return true;
  });
  if(_recipeSortMode==='name'){
    filtered.sort(function(a,b){return (a.name||'').localeCompare(b.name||'','el');});
  } else if(_recipeSortMode==='kcal'){
    filtered.sort(function(a,b){return (a.kcal||0)-(b.kcal||0);});
  } else if(_recipeSortMode==='protein'){
    filtered.sort(function(a,b){return ((b.macro&&b.macro.p)||0)-((a.macro&&a.macro.p)||0);});
  }
  if(!filtered.length){
    container.innerHTML='<div class="hm-empty">Καμία συνταγή δεν βρέθηκε</div>';
  } else {
    container.innerHTML=filtered.map(recipeRow).join('');
  }
  if(countEl){
    var untagged=all.filter(function(r){return getRecipeMealTimes(r).length===0;}).length;
    countEl.textContent=filtered.length+' / '+all.length+' συνταγές'+(untagged?' · '+untagged+' χωρίς κατηγορία ώρας':'');
  }
}

function renderRecipes(){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">🍽️ Συνταγές</div>';

  html+='<div class="rcp-toolbar">';
  html+='<input type="text" class="rcp-search" placeholder="🔍 Αναζήτηση συνταγής ή τύπου διατροφής..." aria-label="Αναζήτηση συνταγής" oninput="filterRecipes(this.value)">';
  html+='<button type="button" class="rcp-add-btn" onclick="openNewRecipeModal()">+ Νέα συνταγή</button>';
  var dietDefs=availableRecipeDietTags();
  if(dietDefs.length){
    html+='<select class="clients-toolbar-select" aria-label="Φίλτρο διατροφικού τύπου" onchange="setRecipeDietFilter(this.value)">'
      +'<option value="">Όλοι οι τύποι</option>'
      +dietDefs.map(function(d){return '<option value="'+d.key+'">'+d.label+'</option>';}).join('')
      +'</select>';
  }
  html+='<select class="clients-toolbar-select" aria-label="Ταξινόμηση συνταγών" onchange="setRecipeSortMode(this.value)">'
    +'<option value="">Προεπιλεγμένη σειρά</option>'
    +'<option value="name">🔤 Όνομα (Α-Ω)</option>'
    +'<option value="kcal">⬇️ Λιγότερα kcal πρώτα</option>'
    +'<option value="protein">💪 Περισσότερη πρωτεΐνη πρώτα</option>'
    +'</select>';
  html+='</div>';

  html+='<div class="rcp-filter-row">';
  html+='<button type="button" class="rcp-filter-chip active" data-val="" onclick="setRecipeCategoryFilter(\'\')">Όλες</button>';
  RECIPE_MEAL_TIME_CATEGORIES.forEach(function(cat){
    html+='<button type="button" class="rcp-filter-chip" data-val="'+cat+'" onclick="setRecipeCategoryFilter(\''+cat+'\')">'+cat+'</button>';
  });
  html+='<button type="button" class="rcp-filter-chip" data-val="popular" onclick="setRecipeCategoryFilter(\'popular\')">⭐ Δημοφιλή</button>';
  html+='</div>';
  html+='<div id="rcp-count" class="rcp-count"></div>';
  html+='<div id="rcp-list" class="rcp-list"></div>';
  html+='</div>';

  main.innerHTML=html;
  renderRecipesList();
  renderSB();
}

// ── Νέα συνταγή (cloud-synced custom recipes, δικές του του διαιτολόγου — δεν αγγίζει τη στατική
// MEAL_RECIPES/SNACK_RECIPES). Ίδιο lazy-modal pattern με το showRecipeModal (js/app-part4.js). ──
var _newRecipeIngredientCount=0;
var _newRecipeSelectedTags=[];

function newRecipeIngredientRowHtml(idx){
  return '<div class="nr-ing-row" id="nr-ing-row-'+idx+'">'
    +'<input type="text" class="nr-ing-name" placeholder="Υλικό (π.χ. Στήθος κοτόπουλου)" aria-label="Όνομα υλικού">'
    +'<input type="number" class="nr-ing-g" placeholder="γρ." aria-label="Γραμμάρια" min="0">'
    +'<button type="button" class="nr-ing-remove" title="Αφαίρεση" aria-label="Αφαίρεση υλικού" onclick="removeNewRecipeIngredientRow('+idx+')">×</button>'
    +'</div>';
}
function addNewRecipeIngredientRow(){
  var container=document.getElementById('nr-ingredients');
  if(!container) return;
  var idx=_newRecipeIngredientCount++;
  container.insertAdjacentHTML('beforeend', newRecipeIngredientRowHtml(idx));
}
function removeNewRecipeIngredientRow(idx){
  var row=document.getElementById('nr-ing-row-'+idx);
  if(row) row.remove();
}
function toggleNewRecipeTag(key){
  var el=document.getElementById('nr-tag-'+key);
  var idx=_newRecipeSelectedTags.indexOf(key);
  if(idx>-1){ _newRecipeSelectedTags.splice(idx,1); if(el) el.classList.remove('active'); }
  else { _newRecipeSelectedTags.push(key); if(el) el.classList.add('active'); }
}

function newRecipeModalHtml(){
  var tagPills=RECIPE_DIET_TAG_DEFS.map(function(d){
    return '<button type="button" class="rcp-chip" id="nr-tag-'+d.key+'" onclick="toggleNewRecipeTag(\''+d.key+'\')">'+d.label+'</button>';
  }).join('');
  return '<div class="recipe-modal-content nr-modal-content">'
    +'<div class="recipe-modal-title"><span>Νέα συνταγή</span><button class="recipe-modal-close" onclick="closeNewRecipeModal()">&times;</button></div>'
    +'<div class="nr-field"><label>Όνομα συνταγής</label><input type="text" id="nr-name" placeholder="π.χ. Ομελέτα με σπανάκι"></div>'
    +'<div class="nr-macro-grid">'
    +'<div class="nr-field"><label>Θερμίδες</label><input type="number" id="nr-kcal" min="0" placeholder="420"></div>'
    +'<div class="nr-field"><label>Πρωτ. (g)</label><input type="number" id="nr-p" min="0" placeholder="35"></div>'
    +'<div class="nr-field"><label>Υδατ. (g)</label><input type="number" id="nr-c" min="0" placeholder="30"></div>'
    +'<div class="nr-field"><label>Λίπη (g)</label><input type="number" id="nr-f" min="0" placeholder="14"></div>'
    +'</div>'
    +'<div class="nr-field"><label>Χρόνος προετοιμασίας (λεπτά)</label><input type="number" id="nr-prep" min="0" placeholder="15" style="width:120px"></div>'
    +'<div class="nr-field"><label>Ετικέτες</label><div class="rcp-chips">'+tagPills+'</div></div>'
    +'<div class="nr-field"><label>Υλικά</label><div id="nr-ingredients">'
      +[0,1,2].map(newRecipeIngredientRowHtml).join('')
    +'</div><button type="button" class="nr-add-ing" onclick="addNewRecipeIngredientRow()">+ Πρόσθεσε υλικό</button></div>'
    +'<div class="nr-field"><label>Οδηγίες παρασκευής</label><textarea id="nr-instructions" rows="3" placeholder="Περίγραψε τα βήματα παρασκευής..."></textarea></div>'
    +'<div id="nr-error" class="nr-error"></div>'
    +'<button type="button" class="nr-save-btn" onclick="saveNewRecipe()">💾 Αποθήκευσε συνταγή</button>'
    +'</div>';
}

function openNewRecipeModal(){
  if(!window.Cloud || !window.Cloud.user){
    if(typeof showErrorToast==='function') showErrorToast('Χρειάζεται σύνδεση στο cloud για να αποθηκεύσεις δικές σου συνταγές');
    return;
  }
  _newRecipeIngredientCount=3;
  _newRecipeSelectedTags=[];
  var modal=document.getElementById('recipe-form-modal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='recipe-form-modal';
    modal.className='recipe-modal hidden';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){ if(e.target===modal) closeNewRecipeModal(); });
  }
  modal.innerHTML=newRecipeModalHtml();
  modal.classList.remove('hidden');
}
function closeNewRecipeModal(){
  var modal=document.getElementById('recipe-form-modal');
  if(modal) modal.classList.add('hidden');
}

function saveNewRecipe(){
  var errorEl=document.getElementById('nr-error');
  var name=(document.getElementById('nr-name').value||'').trim();
  var kcal=parseInt(document.getElementById('nr-kcal').value,10)||0;
  var p=parseInt(document.getElementById('nr-p').value,10)||0;
  var c=parseInt(document.getElementById('nr-c').value,10)||0;
  var f=parseInt(document.getElementById('nr-f').value,10)||0;
  var prep=parseInt(document.getElementById('nr-prep').value,10)||null;
  var instructions=(document.getElementById('nr-instructions').value||'').trim();

  var foods=[];
  document.querySelectorAll('#nr-ingredients .nr-ing-row').forEach(function(row){
    var nEl=row.querySelector('.nr-ing-name');
    var gEl=row.querySelector('.nr-ing-g');
    var n=(nEl&&nEl.value||'').trim();
    var g=parseInt(gEl&&gEl.value,10)||0;
    if(n && g>0) foods.push({n:n,g:g});
  });

  if(!name){ if(errorEl) errorEl.textContent='Χρειάζεται όνομα συνταγής.'; return; }
  if(!foods.length){ if(errorEl) errorEl.textContent='Πρόσθεσε τουλάχιστον ένα υλικό με γραμμάρια.'; return; }
  if(errorEl) errorEl.textContent='';

  var saveBtn=document.querySelector('#recipe-form-modal .nr-save-btn');
  if(saveBtn){ saveBtn.disabled=true; saveBtn.textContent='Αποθήκευση...'; }

  window.Cloud.saveCustomRecipe({
    name:name, kcal:kcal, macro:{p:p,c:c,f:f}, tags:_newRecipeSelectedTags.slice(),
    instructions:instructions, prepTimeMin:prep, foods:foods
  }).then(function(result){
    if(!result.ok){
      if(errorEl) errorEl.textContent='Η αποθήκευση απέτυχε: '+((result.error&&result.error.message)||'άγνωστο σφάλμα');
      if(saveBtn){ saveBtn.disabled=false; saveBtn.textContent='💾 Αποθήκευσε συνταγή'; }
      return;
    }
    closeNewRecipeModal();
    renderRecipesList();
  });
}

// ── Πλήρης προβολή συνταγής + λίστα αγορών (Phase 3). Ίδιο lazy-modal pattern, νέο id ώστε να μη
// συγκρούεται με το showRecipeModal (js/app-part4.js, άλλος σκοπός: υλικά σύνθετων τροφίμων) ούτε
// με το recipe-form-modal (Phase 2b). Ο scaler μέσα εδώ επαναχρησιμοποιεί το recipeScalerHtml/
// onRecipeScaleInput του Phase 1 με scope='modal' ώστε να μη συγκρούεται με τυχόν ανοιχτό inline
// preview της ίδιας συνταγής στη λίστα (scope='row'). ──
function recipeDetailModalHtml(recipe){
  var tags=(recipe.tags||[]).slice(0,6);
  var tagsHtml=tags.length?'<div class="rcp-chips">'+tags.map(function(t){return '<span class="rcp-chip active">'+esc(t)+'</span>';}).join('')+'</div>':'';
  var prepHtml=recipe.prepTimeMin?'<div class="rd-meta">⏱️ '+recipe.prepTimeMin+' λεπτά</div>':'';
  var ingredientsHtml='<div class="rd-ingredients">'+(recipe.foods||[]).map(function(f,idx){
    return '<div class="rd-ing-row">'
      +'<span class="rd-ing-name" id="rcp-ing-n-modal-'+recipe.id+'-'+idx+'">'+esc(f.n)+'</span>'
      +'<span class="rd-ing-g" id="rcp-ing-g-modal-'+recipe.id+'-'+idx+'">'+f.g+'g</span>'
      +'<button type="button" class="rd-swap-btn" title="Αντικατέστησε υλικό" aria-label="Αντικατέστησε υλικό" onclick="toggleSwapPanel(\''+recipe.id+'\','+idx+')">⇄</button>'
      +'</div>'
      +'<div class="rd-swap-panel" id="rd-swap-panel-'+recipe.id+'-'+idx+'" style="display:none"></div>';
  }).join('')+'</div>';
  // Οι στατικές MEAL_RECIPES/SNACK_RECIPES δεν έχουν πεδίο instructions σήμερα — μόνο οι νέες
  // custom συνταγές (Phase 2b) το έχουν. Γνωστό, σκόπιμο κενό, δεν καλύπτεται τώρα.
  var instructionsHtml=recipe.instructions?('<div class="rd-section-title">Οδηγίες παρασκευής</div><div class="rd-instructions">'+esc(recipe.instructions)+'</div>'):'';
  return '<div class="recipe-modal-content rd-modal-content">'
    +'<div class="recipe-modal-title"><span>'+esc(recipe.name)+'</span><button class="recipe-modal-close" onclick="closeRecipeDetailModal()">&times;</button></div>'
    +prepHtml
    +tagsHtml
    +'<div class="rd-section-title">Υλικά</div>'
    +ingredientsHtml
    +recipeScalerHtml(recipe,'modal')
    +instructionsHtml
    +'<button type="button" class="rcp-add-btn rd-shop-btn" onclick="toggleRecipeShoppingList(\''+recipe.id+'\')">🛒 <span id="rd-shop-label-'+recipe.id+'">Πρόσθεσε στη λίστα αγορών</span></button>'
    +'<div id="rd-shop-panel-'+recipe.id+'" class="rd-shop-panel" style="display:none"></div>'
    +'</div>';
}

function showRecipeDetailModal(recipeId){
  var recipe=findRecipeById(recipeId);
  if(!recipe) return;
  var modal=document.getElementById('recipe-detail-modal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='recipe-detail-modal';
    modal.className='recipe-modal hidden';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){ if(e.target===modal) closeRecipeDetailModal(); });
  }
  modal.innerHTML=recipeDetailModalHtml(recipe);
  modal.classList.remove('hidden');
}
function closeRecipeDetailModal(){
  var modal=document.getElementById('recipe-detail-modal');
  if(modal) modal.classList.add('hidden');
}

// Δείχνει/κρύβει μια απλή λίστα με τα ΤΡΕΧΟΝΤΑ (πιθανόν κλιμακωμένα από το scaler) υλικά —
// καθαρή προβολή, καμία αποθήκευση/persist, όπως στο εγκεκριμένο mockup.
function toggleRecipeShoppingList(recipeId){
  var panel=document.getElementById('rd-shop-panel-'+recipeId);
  var label=document.getElementById('rd-shop-label-'+recipeId);
  if(!panel) return;
  var open=panel.style.display!=='none';
  if(open){ panel.style.display='none'; if(label) label.textContent='Πρόσθεσε στη λίστα αγορών'; return; }
  var recipe=findRecipeById(recipeId);
  if(!recipe) return;
  var itemsHtml=(recipe.foods||[]).map(function(f,idx){
    var nameEl=document.getElementById('rcp-ing-n-modal-'+recipeId+'-'+idx);
    var gEl=document.getElementById('rcp-ing-g-modal-'+recipeId+'-'+idx);
    var n=nameEl?nameEl.textContent:f.n;
    var g=gEl?gEl.textContent:f.g+'g';
    return '<div class="rd-shop-item">'+esc(n)+' — '+g+'</div>';
  }).join('');
  panel.innerHTML=itemsHtml;
  panel.style.display='block';
  if(label) label.textContent='Προστέθηκε στη λίστα';
}

// ── Αντικατάσταση υλικού με βάση macro-εγγύτητα (Phase 4). Δουλεύει ΜΟΝΟ πάνω στο DOM του detail
// modal (ποτέ δεν αγγίζει recipe.foods, που είναι απευθείας αναφορά μέσα στη MEAL_RECIPES/
// SNACK_RECIPES/customRecipes) — καθαρά "τι θα γινόταν αν", ίδιο πνεύμα με το scaler του Phase 1.
// Επαναχρησιμοποιεί το ήδη υπάρχον SUBST_ORDER (js/data.js) + τη λογική εγγύτητας πυκνότητας
// θερμίδων που ήδη χρησιμοποιεί το applyFoodExclusions() (js/app-part2.js) για auto-εξαιρέσεις,
// απλά επιστρέφει τις κορυφαίες 2-3 εναλλακτικές αντί να διαλέγει αυτόματα τη μία καλύτερη.
function findIngredientSwapCandidates(foodName){
  var cat=FOODS[foodName]?FOODS[foodName].cat:'';
  var order=(cat && SUBST_ORDER[cat])?SUBST_ORDER[cat]:(cat?[cat]:[]);
  for(var i=0;i<order.length;i++){
    var catAtI=order[i];
    var candidates=Object.keys(FOODS).filter(function(n){
      return n!==foodName && FOODS[n] && FOODS[n].cat===catAtI;
    });
    if(candidates.length){
      var origDens=FOODS[foodName]?FOODS[foodName].k:100;
      candidates.sort(function(a,b){ return Math.abs(FOODS[a].k-origDens)-Math.abs(FOODS[b].k-origDens); });
      return candidates.slice(0,3);
    }
  }
  return [];
}
function fmtSignedInt(n){ n=Math.round(n); return (n>=0?'+':'')+n; }

function toggleSwapPanel(recipeId,idx){
  var panel=document.getElementById('rd-swap-panel-'+recipeId+'-'+idx);
  if(!panel) return;
  var willOpen=panel.style.display==='none';
  document.querySelectorAll('.rd-swap-panel').forEach(function(p){ p.style.display='none'; p.innerHTML=''; });
  if(!willOpen) return;
  var nameEl=document.getElementById('rcp-ing-n-modal-'+recipeId+'-'+idx);
  var gEl=document.getElementById('rcp-ing-g-modal-'+recipeId+'-'+idx);
  var currentName=nameEl?nameEl.textContent:'';
  var currentG=gEl?parseInt(gEl.textContent,10):0;
  var candidates=findIngredientSwapCandidates(currentName);
  if(!candidates.length){
    panel.innerHTML='<div class="rd-swap-empty">Δεν βρέθηκαν εναλλακτικές για αυτό το υλικό.</div>';
    panel.style.display='block';
    return;
  }
  var origV=cm(currentName,currentG);
  var origDens=FOODS[currentName]?FOODS[currentName].k:100;
  panel.innerHTML=candidates.map(function(subName){
    var subDens=FOODS[subName].k||100;
    var subG=Math.max(10,Math.round(currentG*(origDens/subDens)));
    var subV=cm(subName,subG);
    var dk=fmtSignedInt(subV.k-origV.k),dp=fmtSignedInt(subV.p-origV.p);
    return '<button type="button" class="rd-swap-option" onclick="applyIngredientSwap(\''+recipeId+'\','+idx+',\''+subName+'\','+subG+')">'
      +'<span>'+esc(subName)+'</span>'
      +'<span class="rd-swap-delta">'+dk+' kcal, '+dp+'g πρωτ.</span>'
      +'</button>';
  }).join('');
  panel.style.display='block';
}

function applyIngredientSwap(recipeId,idx,subName,subGrams){
  var nameEl=document.getElementById('rcp-ing-n-modal-'+recipeId+'-'+idx);
  var gEl=document.getElementById('rcp-ing-g-modal-'+recipeId+'-'+idx);
  if(nameEl) nameEl.textContent=subName;
  if(gEl) gEl.textContent=subGrams+'g';
  var panel=document.getElementById('rd-swap-panel-'+recipeId+'-'+idx);
  if(panel){ panel.style.display='none'; panel.innerHTML=''; }
  recomputeModalTotals(recipeId);
}

// Ξαναϋπολογίζει τα macro-σύνολα του modal διαβάζοντας το ΤΡΕΧΟΝ όνομα/γραμμάρια κάθε γραμμής
// υλικού από το DOM (όχι από recipe.foods) — έτσι αντανακλά σωστά τυχόν swap. Γράφει στα ίδια
// spans που ενημερώνει και το scaler (scope='modal'), οπότε υπάρχει μία ενιαία "τρέχουσα εικόνα".
function recomputeModalTotals(recipeId){
  var recipe=findRecipeById(recipeId);
  if(!recipe) return;
  var totals={k:0,p:0,f:0,c:0};
  (recipe.foods||[]).forEach(function(f,idx){
    var nameEl=document.getElementById('rcp-ing-n-modal-'+recipeId+'-'+idx);
    var gEl=document.getElementById('rcp-ing-g-modal-'+recipeId+'-'+idx);
    var n=nameEl?nameEl.textContent:f.n;
    var g=gEl?parseInt(gEl.textContent,10):f.g;
    var v=cm(n,g);
    totals.k+=v.k;totals.p+=v.p;totals.f+=v.f;totals.c+=v.c;
  });
  var kcalOut=document.getElementById('rcp-scale-kcal-modal-'+recipeId);
  if(kcalOut) kcalOut.textContent=Math.round(totals.k)+' kcal';
  var pOut=document.getElementById('rcp-scale-p-modal-'+recipeId);
  if(pOut) pOut.textContent='Π'+Math.round(totals.p);
  var cOut=document.getElementById('rcp-scale-c-modal-'+recipeId);
  if(cOut) cOut.textContent='Υ'+Math.round(totals.c);
  var fOut=document.getElementById('rcp-scale-f-modal-'+recipeId);
  if(fOut) fOut.textContent='Λ'+Math.round(totals.f);
}

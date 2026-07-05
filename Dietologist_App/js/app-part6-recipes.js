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
}
function toggleRecipePopular(recipe){
  var meta=getRecipeMeta();
  meta[recipe.id]=meta[recipe.id]||{};
  meta[recipe.id].popular=!isRecipePopular(recipe);
  saveRecipeMetaAll(meta);
}

function allRecipesForBrowsing(){
  return (typeof MEAL_RECIPES!=='undefined'?MEAL_RECIPES:[]).concat(typeof SNACK_RECIPES!=='undefined'?SNACK_RECIPES:[]);
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

function recipeRow(recipe){
  var mealTimes=getRecipeMealTimes(recipe);
  var popular=isRecipePopular(recipe);
  var m=recipe.macro||{};
  var expanded=!!_expandedRecipeIds[recipe.id];
  var ingredientsHtml=expanded
    ?'<div class="rcp-ingredients">'+(recipe.foods||[]).map(function(f){return '<span class="rcp-ing">'+esc(f.n)+' · '+f.g+'g</span>';}).join('')+'</div>'
    :'';
  return '<div class="rcp-row">'
    +'<div class="rcp-row-top">'
    +'<div class="rcp-row-left">'
    +'<button type="button" class="rcp-expand-btn" title="Υλικά" aria-label="Προβολή υλικών" onclick="toggleRecipeExpand(\''+recipe.id+'\')">'+(expanded?'🔼':'🔽')+'</button>'
    +'<span class="rcp-name">'+esc(recipe.name)+'</span>'
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

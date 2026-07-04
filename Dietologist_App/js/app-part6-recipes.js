// ═══════════════════════════════════════════════════════════════
// ΣΥΝΤΑΓΕΣ — recipe library with meal-time categories (Phase 5)
// ═══════════════════════════════════════════════════════════════
// MEAL_RECIPES/SNACK_RECIPES (js/data.js) are static, code-defined
// datasets shared by the whole app. The dietitian's own categorization
// (mealTimes, ⭐ δημοφιλές) is personal workflow state, so — like the
// existing favoriteMeals feature — it's kept separately in localStorage,
// keyed by recipe id, and overlaid on top of the static recipe data.

var RECIPE_MEAL_TIME_CATEGORIES=['Πρωινά','Ενδιάμεσα','Μεσημεριανά','Βραδινά'];

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

function filterRecipes(val){ _recipeSearchTerm=(val||'').toLowerCase().trim(); renderRecipesList(); }
function setRecipeCategoryFilter(val){
  _recipeCategoryFilter=val;
  var chips=document.querySelectorAll('.rcp-filter-chip');
  chips.forEach(function(ch){ ch.classList.toggle('active', ch.dataset.val===val); });
  renderRecipesList();
}
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

function recipeRow(recipe){
  var mealTimes=getRecipeMealTimes(recipe);
  var popular=isRecipePopular(recipe);
  var m=recipe.macro||{};
  var chips=RECIPE_MEAL_TIME_CATEGORIES.map(function(cat){
    var active=mealTimes.indexOf(cat)>-1;
    return '<button type="button" class="rcp-chip'+(active?' active':'')+'" onclick="toggleRecipeMealTime(\''+recipe.id+'\',\''+cat+'\')">'+cat+'</button>';
  }).join('');
  return '<div class="rcp-row">'
    +'<div class="rcp-row-top">'
    +'<span class="rcp-name">'+esc(recipe.name)+'</span>'
    +'<button type="button" class="rcp-star'+(popular?' active':'')+'" title="Δημοφιλές" onclick="onToggleRecipePopular(\''+recipe.id+'\')">⭐</button>'
    +'</div>'
    +'<div class="rcp-sub">'+recipe.kcal+' kcal · Π'+(m.p||0)+' Λ'+(m.f||0)+' Υ'+(m.c||0)+'</div>'
    +'<div class="rcp-chips">'+chips+(mealTimes.length?'':'<span class="rcp-chip-hint">όλες οι ώρες</span>')+'</div>'
    +'</div>';
}

function renderRecipesList(){
  var container=document.getElementById('rcp-list');
  var countEl=document.getElementById('rcp-count');
  if(!container) return;
  var q=_recipeSearchTerm;
  var all=allRecipesForBrowsing();
  var filtered=all.filter(function(r){
    if(q && (r.name||'').toLowerCase().indexOf(q)===-1) return false;
    if(_recipeCategoryFilter==='popular') return isRecipePopular(r);
    if(_recipeCategoryFilter) return getRecipeMealTimes(r).indexOf(_recipeCategoryFilter)>-1;
    return true;
  });
  if(!filtered.length){
    container.innerHTML='<div class="hm-empty">Καμία συνταγή δεν βρέθηκε</div>';
  } else {
    container.innerHTML=filtered.map(recipeRow).join('');
  }
  if(countEl) countEl.textContent=filtered.length+' / '+all.length+' συνταγές';
}

function renderRecipes(){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">🍽️ Συνταγές</div>';
  html+='<input type="text" class="rcp-search" placeholder="🔍 Αναζήτηση συνταγής..." aria-label="Αναζήτηση συνταγής" oninput="filterRecipes(this.value)">';
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

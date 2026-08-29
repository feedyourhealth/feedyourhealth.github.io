// js/plan-gen/food-selector.js
// The plan meal-cell editing layer + the add-food / add-recipe modal, extracted
// verbatim from js/app-part3.js (module split wave 20): insertPlanItemIntoCell,
// setActiveMealTarget/addLibItemToActiveTarget/refreshActiveMealIndicator, updG/addF,
// openFoodSelectorModal/updateFoodSelector/showFoodQuantityInput/hideFoodQuantityInput/
// confirmFoodQuantity, the _foodSelector* state vars + tab/filter helpers,
// updateRecipeSelectorForPlan/getRecipeExclusionConflicts/getClientRecipeFeedback/
// insertRecipeFoodsIntoMeal/removeDishLabel/confirmAddRecipeToMeal, delF. Only literal
// `var _x = …` initialisers run at parse time. Callers are week-table.js onclick
// strings + drag handler — all runtime. Loads right after week-table.js, before app-part3.js.

// Εισάγει τρόφιμο/συνδυασμό σε συγκεκριμένο κελί — κοινή λογική για drag&drop ΚΑΙ click-to-add,
// ώστε οι δύο τρόποι προσθήκης να συμπεριφέρονται πάντα ίδια (ίδιοι έλεγχοι diet/εξαιρέσεων).
function insertPlanItemIntoCell(d,mi,data){
  var c2=getC();if(!c2||!c2.weekPlan[d]||!c2.weekPlan[d][mi])return false;
  if(data.indexOf('combo:')===0){
    var cid=data.slice(6);
    var combo=getSavedCombos().filter(function(x){return x.id===cid;})[0];
    if(!combo)return false;
    var exclLower2=(c2.foodExclude||[]).map(function(x){return (x||'').toLowerCase();}).filter(Boolean);
    if(!comboDietOK(c2.dietType, combo.dietType) || comboHasExcludedFood(combo.foods, exclLower2)){
      showErrorToast('⚠️ Ο συνδυασμός δεν ταιριάζει με το diet type / τις εξαιρέσεις τροφίμων αυτού του πελάτη.');
      return false;
    }
    combo.foods.forEach(function(f){c2.weekPlan[d][mi].foods.push({n:f.n,g:f.g});});
  } else {
    if(!FOODS[data])return false;
    c2.weekPlan[d][mi].foods.push({n:data,g:100});
  }
  save();
  return true;
}

// Ποιο κελί (ημέρα, γεύμα) στοχεύουν τα κλικ στη βιβλιοθήκη τροφίμων — βλ. insertPlanItemIntoCell.
window._activeMealTarget=window._activeMealTarget||null;
function setActiveMealTarget(d,mi){
  window._activeMealTarget={d:d,mi:mi};
  refreshActiveMealIndicator();
}
function addLibItemToActiveTarget(data){
  var t=window._activeMealTarget;
  if(!t){showErrorToast('👆 Πάτα πρώτα σε ένα γεύμα, μετά πάτα το τρόφιμο για να προστεθεί εκεί.');return;}
  if(insertPlanItemIntoCell(t.d,t.mi,data))renderWeekTable();
}
function refreshActiveMealIndicator(){
  document.querySelectorAll('.day-cell.active-target').forEach(function(el){el.classList.remove('active-target');});
  var el=document.getElementById('active-meal-indicator');
  var c=getC();var t=window._activeMealTarget;
  if(t&&c&&c.weekPlan[t.d]&&c.weekPlan[t.d][t.mi]){
    var cell=document.querySelector('.day-cell[data-d="'+t.d+'"][data-mi="'+t.mi+'"]');
    if(cell)cell.classList.add('active-target');
    if(el){el.className='active-meal-indicator set';el.textContent='🎯 Ενεργό: '+DAYS[t.d]+' · '+c.weekPlan[t.d][t.mi].name;}
  } else if(el){
    el.className='active-meal-indicator';
    el.textContent='👆 Πάτα σε ένα γεύμα για να διαλέξεις πού θα προστεθούν τα τρόφιμα με κλικ';
  }
}

function updG(d,mi,fi,v){var c=getC();if(!c)return;c.weekPlan[d][mi].foods[fi].g=Math.max(0,parseInt(v)||0);save();renderWeekTable();}
function addF(d,mi){openFoodSelectorModal(d,mi);}

function openFoodSelectorModal(d,mi){
  var c=getC();if(!c)return;
  // Create or reuse the modal
  var existingModal=document.getElementById('food-selector-modal');
  if(existingModal){existingModal.remove();}

  var modal=document.createElement('div');
  modal.id='food-selector-modal';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:9999';

  var content=document.createElement('div');
  content.style.cssText='background:var(--card-bg);padding:20px;border-radius:8px;width:90%;max-width:600px;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3)';

  // Add paste button if there's a meal in clipboard
  var pasteBtn='';
  if(window.mealClipboard){
    pasteBtn='<button onclick="pasteMealFromClipboard('+d+','+mi+');document.getElementById(\'food-selector-modal\').remove()" style="background:#4caf50;color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:11px;margin-right:10px">📋 Επικόλληση Γεύματος</button>';
  }

  content.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;border-bottom:2px solid #E2EEE5;padding-bottom:10px">'
    +'<h2 style="color:#025857;margin:0">🔍 Επιλογή Τροφίματος</h2>'
    +'<div>'+pasteBtn+'<button onclick="document.getElementById(\'food-selector-modal\').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666">&times;</button></div>'
    +'</div>'
    +'<div style="display:flex;gap:6px;margin-bottom:10px">'
      +'<button id="food-selector-tab-foods" onclick="setFoodSelectorTab(\'foods\')" style="flex:1;background:#025857;color:#fff;border:none;border-radius:6px;padding:7px;cursor:pointer;font-size:12px;font-weight:600">🥗 Τρόφιμα</button>'
      +'<button id="food-selector-tab-recipes" onclick="setFoodSelectorTab(\'recipes\')" style="flex:1;background:#eee;color:var(--text-strong);border:none;border-radius:6px;padding:7px;cursor:pointer;font-size:12px;font-weight:600">📖 Συνταγές</button>'
    +'</div>'
    +'<div id="recipe-diet-filter-row" style="display:none;flex-wrap:wrap;gap:5px;margin-bottom:10px"></div>'
    +'<input id="food-search-input" class="food-lib-search" type="text" placeholder="Αναζήτηση τροφίμου..." style="width:100%;margin-bottom:15px" oninput="onFoodSelectorSearchInput(this.value)">'
    +'<div id="food-selector-list" style="max-height:500px;overflow-y:auto;border:1px solid var(--border-light);border-radius:6px"></div>'
    +'<div id="recipe-selector-list" style="display:none;max-height:500px;overflow-y:auto;border:1px solid var(--border-light);border-radius:6px"></div>';

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Store context for food selection
  window.currentFoodContext={d:d,mi:mi};

  // Initial render — πάντα ξεκινάει από την καρτέλα Τρόφιμα, χωρίς ενεργά φίλτρα διατροφικού τύπου
  _foodSelectorTab='foods';
  _foodSelectorRecipeDietFilters=[];
  _foodSelectorFavoritesOnly=false;
  _expandedFoodSelectorRecipeIds={};
  updateFoodSelector('');

  // Close on overlay click
  modal.addEventListener('click',function(e){
    if(e.target===modal){modal.remove();}
  });
}

function updateFoodSelector(query){
  var list=document.getElementById('food-selector-list');
  if(!list)return;

  var q=(query||'').toLowerCase().trim();
  var cats={};

  // Filter foods
  Object.keys(FOODS).forEach(function(n){
    if(q&&n.toLowerCase().indexOf(q)<0)return;
    var cat=FOODS[n].cat;
    if(!cats[cat])cats[cat]=[];
    cats[cat].push(n);
  });

  if(!Object.keys(cats).length){
    list.innerHTML='<div style="color:var(--text-muted);font-size:11px;padding:10px">Δεν βρέθηκε</div>';
    return;
  }

  var html='';
  Object.keys(cats).sort().forEach(function(cat){
    html+='<div style="background:var(--panel-bg);padding:8px 10px;font-weight:600;color:#666;border-top:1px solid #e0e0e0;margin-top:8px">'+cat+'</div>';
    cats[cat].forEach(function(n){
      var foodId='food-item-'+Math.random().toString(36).substr(2,9);
      html+='<div style="border-bottom:1px solid #f0f0f0">'
        +'<div id="'+foodId+'" style="padding:8px 10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'var(--card-bg)\'" onclick="showFoodQuantityInput(\''+foodId+'\',\''+n.replace(/'/g,"\\'")+'\')">'
          +'<span>'+n+'</span>'
          +'<span style="color:var(--text-muted);font-size:11px">'+FOODS[n].k+' kcal</span>'
        +'</div>'
        +'<div id="'+foodId+'-qty" style="display:none;padding:10px;background:var(--panel-bg);border-top:1px solid #e0e0e0">'
          +'<div style="display:flex;gap:8px;align-items:center">'
            +'<label style="font-size:11px;color:#666">Ποσότητα (gr):</label>'
            +'<input id="qty-input-'+foodId+'" type="number" value="100" min="1" max="500" style="width:70px;padding:4px;border:1px solid var(--border-light);border-radius:4px;font-size:12px">'
            +'<button onclick="confirmFoodQuantity(\''+foodId+'\',\''+n.replace(/'/g,"\\'")+'\')" style="background:#025857;color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:11px">✓ Προσθήκη</button>'
            +'<button onclick="hideFoodQuantityInput(\''+foodId+'\')" style="background:#999;color:#fff;border:none;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:11px">✕ Άκυρο</button>'
          +'</div>'
        +'</div>'
        +'</div>';
    });
  });

  list.innerHTML=html;
}

function showFoodQuantityInput(foodId,foodName){
  // Hide all other quantity inputs
  var allQtyDivs=document.querySelectorAll('[id$="-qty"]');
  allQtyDivs.forEach(function(div){
    div.style.display='none';
  });

  // Show the quantity input for this food
  var qtyDiv=document.getElementById(foodId+'-qty');
  if(qtyDiv){
    qtyDiv.style.display='block';
    // Focus on input
    var input=document.getElementById('qty-input-'+foodId);
    if(input){
      input.focus();
      input.select();
    }
  }
}

function hideFoodQuantityInput(foodId){
  var qtyDiv=document.getElementById(foodId+'-qty');
  if(qtyDiv)qtyDiv.style.display='none';
}

function confirmFoodQuantity(foodId,foodName){
  var input=document.getElementById('qty-input-'+foodId);
  if(!input)return;

  var quantity=parseInt(input.value)||100;
  if(quantity<1)quantity=100;

  var ctx=window.currentFoodContext;
  if(!ctx)return;

  var c=getC();
  if(!c)return;

  c.weekPlan[ctx.d][ctx.mi].foods.push({n:foodName,g:quantity});
  save();
  renderWeekTable();

  // Close modal
  var modal=document.getElementById('food-selector-modal');
  if(modal)modal.remove();
}

// ── Καρτέλα "Συνταγές" μέσα στο food-selector-modal — επιτρέπει να προσθέσεις
// μια ολόκληρη έτοιμη συνταγή (js/data.js MEAL_RECIPES/SNACK_RECIPES + δικές σου custom)
// στο τρέχον γεύμα του πλάνου, αντί να ψάχνεις τρόφιμο-τρόφιμο. ──
var _foodSelectorTab='foods';
// Ενεργά diet-type φίλτρα (κλειδιά από RECIPE_DIET_TAG_DEFS, js/app-part6-recipes.js) στην
// καρτέλα Συνταγές — OR μεταξύ τους (π.χ. Vegan + High Protein επιλεγμένα = φαίνονται και τα δύο).
var _foodSelectorRecipeDietFilters=[];
// Ποιες κάρτες συνταγών έχουν ανοιχτή την προεπισκόπηση υλικών (ίδιο pattern με
// _expandedRecipeIds στο app-part6-recipes.js, αλλά ξεχωριστό state — άλλη λίστα, άλλο context).
var _expandedFoodSelectorRecipeIds={};

function toggleFoodSelectorRecipeExpand(recipeId){
  _expandedFoodSelectorRecipeIds[recipeId]=!_expandedFoodSelectorRecipeIds[recipeId];
  var searchInput=document.getElementById('food-search-input');
  updateRecipeSelectorForPlan(searchInput?searchInput.value:'');
}

function onFoodSelectorSearchInput(val){
  if(_foodSelectorTab==='recipes') updateRecipeSelectorForPlan(val);
  else updateFoodSelector(val);
}

function setFoodSelectorTab(tab){
  _foodSelectorTab=tab;
  var foodsBtn=document.getElementById('food-selector-tab-foods');
  var recipesBtn=document.getElementById('food-selector-tab-recipes');
  var foodsList=document.getElementById('food-selector-list');
  var recipesList=document.getElementById('recipe-selector-list');
  var dietFilterRow=document.getElementById('recipe-diet-filter-row');
  var searchInput=document.getElementById('food-search-input');
  var showRecipes=(tab==='recipes');
  if(foodsBtn){foodsBtn.style.background=showRecipes?'#eee':'#025857';foodsBtn.style.color=showRecipes?'#333':'#fff';}
  if(recipesBtn){recipesBtn.style.background=showRecipes?'#025857':'#eee';recipesBtn.style.color=showRecipes?'#fff':'#333';}
  if(foodsList)foodsList.style.display=showRecipes?'none':'block';
  if(recipesList)recipesList.style.display=showRecipes?'block':'none';
  if(dietFilterRow)dietFilterRow.style.display=showRecipes?'flex':'none';
  if(showRecipes)renderRecipeDietFilterChips();
  if(searchInput){
    searchInput.placeholder=showRecipes?'Αναζήτηση συνταγής...':'Αναζήτηση τροφίμου...';
    if(showRecipes)updateRecipeSelectorForPlan(searchInput.value);
    else updateFoodSelector(searchInput.value);
  }
}

// Χρησιμοποιεί το ήδη υπάρχον "⭐ δημοφιλές" σημάδι ανά συνταγή (isRecipePopular, js/app-part6-recipes.js
// — η ίδια σημαία που φαίνεται στην κύρια καρτέλα Συνταγές), απλά το κάνει διαθέσιμο κι εδώ ως φίλτρο.
var _foodSelectorFavoritesOnly=false;

function renderRecipeDietFilterChips(){
  var row=document.getElementById('recipe-diet-filter-row');
  if(!row)return;
  var favChip='<button onclick="toggleFoodSelectorFavoritesOnly()" style="background:'+(_foodSelectorFavoritesOnly?'#025857':'#eee')+';color:'+(_foodSelectorFavoritesOnly?'#fff':'#333')+';border:none;border-radius:12px;padding:4px 11px;cursor:pointer;font-size:11px;font-weight:'+(_foodSelectorFavoritesOnly?'600':'400')+'">⭐ Μόνο αγαπημένα</button>';
  var defs=(typeof availableRecipeDietTags==='function')?availableRecipeDietTags():[];
  row.innerHTML=favChip+defs.map(function(def){
    var active=_foodSelectorRecipeDietFilters.indexOf(def.key)>-1;
    return '<button onclick="toggleFoodSelectorDietFilter(\''+def.key+'\')" style="background:'+(active?'#025857':'#eee')+';color:'+(active?'#fff':'#333')+';border:none;border-radius:12px;padding:4px 11px;cursor:pointer;font-size:11px;font-weight:'+(active?'600':'400')+'">'+esc(def.label)+'</button>';
  }).join('');
}

function toggleFoodSelectorFavoritesOnly(){
  _foodSelectorFavoritesOnly=!_foodSelectorFavoritesOnly;
  renderRecipeDietFilterChips();
  var searchInput=document.getElementById('food-search-input');
  updateRecipeSelectorForPlan(searchInput?searchInput.value:'');
}

function toggleFoodSelectorDietFilter(key){
  var idx=_foodSelectorRecipeDietFilters.indexOf(key);
  if(idx>-1)_foodSelectorRecipeDietFilters.splice(idx,1);
  else _foodSelectorRecipeDietFilters.push(key);
  renderRecipeDietFilterChips();
  var searchInput=document.getElementById('food-search-input');
  updateRecipeSelectorForPlan(searchInput?searchInput.value:'');
}

// 0 = ταιριάζει στην ώρα του τρέχοντος γεύματος, 1 = χωρίς ώρα ορισμένη ("οποιοδήποτε γεύμα"),
// 2 = ορισμένη για άλλη ώρα γεύματος — έτσι οι άσχετες συνταγές δεν κρύβονται, απλά βουλιάζουν κάτω.
function rankRecipeForMealTime(recipe,targetCategory){
  var times=(typeof getRecipeMealTimes==='function')?getRecipeMealTimes(recipe):(recipe.mealTimes||[]);
  if(!times||!times.length)return 1;
  return times.indexOf(targetCategory)>-1?0:2;
}

function updateRecipeSelectorForPlan(query){
  var list=document.getElementById('recipe-selector-list');
  if(!list)return;
  var q=(query||'').toLowerCase().trim();
  var all=(typeof allRecipesForBrowsing==='function')?allRecipesForBrowsing():[];
  var filtered=all.filter(function(r){return !q||(r.name||'').toLowerCase().indexOf(q)>-1;});

  // Diet-type φίλτρα (chips) — OR μεταξύ επιλεγμένων (π.χ. Vegan + High Protein = φαίνονται και τα δύο).
  if(_foodSelectorRecipeDietFilters.length && typeof recipeHasDietTag==='function'){
    filtered=filtered.filter(function(r){
      return _foodSelectorRecipeDietFilters.some(function(key){return recipeHasDietTag(r,key);});
    });
  }

  // "⭐ Μόνο αγαπημένα" chip — κρατάει μόνο τις συνταγές που ο διαιτολόγος έχει ήδη σημαδέψει
  // ως δημοφιλείς (isRecipePopular, js/app-part6-recipes.js).
  if(_foodSelectorFavoritesOnly && typeof isRecipePopular==='function'){
    filtered=filtered.filter(function(r){return isRecipePopular(r);});
  }

  // Ταξινόμηση: πρώτα κατά ώρα γεύματος, μετά όχι-απορριγμένες-από-τον-πελάτη, μετά αγαπημένες
  // (⭐), μετά όσες ο ΙΔΙΟΣ πελάτης έχει ξαναβαθμολογήσει θετικά (👍) — μόνο όταν αναγνωρίζεται
  // η ώρα του γεύματος γίνεται το πρώτο tier, αλλιώς όλες στο ίδιο ουδέτερο tier.
  var targetCategory=null;
  var ctx=window.currentFoodContext;
  var c=getC();
  if(ctx&&c){
    var meal=c.weekPlan&&c.weekPlan[ctx.d]&&c.weekPlan[ctx.d][ctx.mi];
    if(meal)targetCategory=mealTypeToCategory(meal.name);
  }
  filtered=filtered.map(function(r,idx){return {r:r,idx:idx};}).sort(function(a,b){
    var rankDiff=targetCategory?(rankRecipeForMealTime(a.r,targetCategory)-rankRecipeForMealTime(b.r,targetCategory)):0;
    if(rankDiff)return rankDiff;
    var fbA=getClientRecipeFeedback(a.r,c), fbB=getClientRecipeFeedback(b.r,c);
    var dislikeDiff=(fbA.disliked?1:0)-(fbB.disliked?1:0);
    if(dislikeDiff)return dislikeDiff;
    var favA=(typeof isRecipePopular==='function'&&isRecipePopular(a.r))?0:1;
    var favB=(typeof isRecipePopular==='function'&&isRecipePopular(b.r))?0:1;
    if(favA-favB)return favA-favB;
    var likeDiff=fbB.liked-fbA.liked;
    if(likeDiff)return likeDiff;
    return a.idx-b.idx;
  }).map(function(x){return x.r;});

  if(!filtered.length){
    list.innerHTML='<div style="color:var(--text-muted);font-size:11px;padding:10px">Δεν βρέθηκε συνταγή</div>';
    return;
  }
  var html=targetCategory?('<div style="padding:6px 10px;font-size:10.5px;color:#025857;background:#F3F9F4;border-bottom:1px solid #E2EEE5">↑ Πρώτα συνταγές για: '+esc(targetCategory)+'</div>'):'';
  filtered.forEach(function(r){
    var tagsHtml=(r.tags||[]).slice(0,3).map(function(t){return '<span style="background:#E2EEE5;color:#025857;border-radius:10px;padding:1px 7px;font-size:10px;margin-right:4px">'+esc(t)+'</span>';}).join('');
    var ingCount=(r.foods||[]).length;
    var conflicts=c?getRecipeExclusionConflicts(r,c):[];
    var feedback=getClientRecipeFeedback(r,c);
    var warnHtml=conflicts.length?('<div style="font-size:10.5px;color:#c62828;margin-top:2px">⚠️ Περιέχει αποκλεισμένο: '+esc(conflicts.map(function(f){return f.n;}).join(', '))+'</div>'):'';
    var feedbackHtml=feedback.disliked
      ?'<div style="font-size:10.5px;color:#c62828;margin-top:2px">🚫 Ο πελάτης το απέρριψε πριν (👎)</div>'
      :(feedback.liked>0?'<div style="font-size:10.5px;color:var(--good);margin-top:2px">👍 Άρεσε στον πελάτη '+feedback.liked+' '+(feedback.liked===1?'φορά':'φορές')+'</div>':'');
    var expanded=!!_expandedFoodSelectorRecipeIds[r.id];
    var favorite=typeof isRecipePopular==='function'&&isRecipePopular(r);
    var expandBtn='<button type="button" title="Υλικά" aria-label="Προβολή υλικών" onclick="toggleFoodSelectorRecipeExpand(\''+r.id+'\')" style="background:none;border:none;cursor:pointer;font-size:11px;padding:2px 4px 2px 0;flex-shrink:0;color:var(--text-muted)">'+(expanded?'🔼':'🔽')+'</button>';
    var ingredientsHtml=expanded?('<div style="padding:2px 10px 8px 26px;display:flex;flex-wrap:wrap;gap:5px">'+(r.foods||[]).map(function(f){return '<span style="background:var(--panel-bg);font-size:10.5px;padding:3px 8px;border-radius:4px;color:#666">'+esc(f.n)+' · '+f.g+'g</span>';}).join('')+'</div>'):'';
    html+='<div style="border-bottom:1px solid #f0f0f0">'
      +'<div style="padding:8px 10px 8px 6px;display:flex;justify-content:space-between;align-items:center;gap:8px">'
        +'<div style="display:flex;align-items:flex-start;gap:2px;min-width:0">'
          +expandBtn
          +'<div style="min-width:0">'
            +'<div style="font-weight:600;font-size:12.5px;color:#222">'+(favorite?'⭐ ':'')+esc(r.name)+'</div>'
            +'<div style="font-size:10.5px;color:var(--text-muted)">'+(r.kcal||0)+' kcal · '+ingCount+' υλικά '+tagsHtml+'</div>'
            +warnHtml
            +feedbackHtml
          +'</div>'
        +'</div>'
        +'<button onclick="confirmAddRecipeToMeal(\''+r.id+'\')" style="background:'+((conflicts.length||feedback.disliked)?'#c62828':'#025857')+';color:#fff;border:none;border-radius:4px;padding:5px 10px;cursor:pointer;font-size:11px;white-space:nowrap;flex-shrink:0">➕ Προσθήκη</button>'
      +'</div>'
      +ingredientsHtml
    +'</div>';
  });
  list.innerHTML=html;
}

// Ελέγχει τα υλικά μιας συνταγής (recipe.foods) έναντι της ΙΔΙΑΣ merged λίστας αποκλεισμού που
// χρησιμοποιεί ήδη το genPlan()/scrubExcludedFoodsFromWeekPlan (js/app-part2.js: buildEffectiveExclusionList
// + foodIsExcludedByNameOrIngredient) — foodExclude + πρωτόκολλα + αλλεργίες + preferences.
// Επαναχρησιμοποιούμε αυτή την ήδη-διορθωμένη λογική αντί να ξαναγράψουμε δικό μας name-matching
// (βλ. το bugfix του ίδιου αρχείου στις 2026-07-30 για σύνθετα πιάτα με κρυμμένο αποκλεισμένο συστατικό).
function getRecipeExclusionConflicts(recipe,c){
  if(typeof buildEffectiveExclusionList!=='function'||typeof foodIsExcludedByNameOrIngredient!=='function'||typeof normalizeGreekText!=='function')return [];
  var exclList=buildEffectiveExclusionList(c);
  if(!exclList||!exclList.length)return [];
  var exclNormalized=exclList.map(function(x){return normalizeGreekText(x);});
  return (recipe.foods||[]).filter(function(f){return foodIsExcludedByNameOrIngredient(f.n,exclNormalized);});
}

// Διαβάζει το ΙΔΙΟ trust/dislike store που ήδη γεμίζει το 👍/👎 σύστημα του πλάνου (js/app-part4.js
// rateMeal/logPlanGeneration): meal.recipeId ΓΙΑ ΣΥΝΤΑΓΕΣ ΣΕΦ (MEAL_RECIPES/SNACK_RECIPES/custom) είναι
// πάντα το ίδιο recipe.id — άρα c.dislikedRecipeIds/TRACKING_DATA.recipes[id] είναι απευθείας συγκρίσιμα
// με το recipe.id εδώ, χωρίς να χρειάζεται να ξαναϋπολογίσουμε recipeSig (αυτό αφορά μόνο taste-library/
// saved-combo γεύματα, που δεν εμφανίζονται σε αυτό το picker).
function getClientRecipeFeedback(recipe,c){
  var disliked=!!(c&&c.dislikedRecipeIds&&c.dislikedRecipeIds.indexOf(recipe.id)>-1);
  var liked=0;
  if(typeof TRACKING_DATA!=='undefined'&&TRACKING_DATA.recipes&&TRACKING_DATA.recipes[recipe.id]&&c){
    liked=(TRACKING_DATA.recipes[recipe.id].ratings||[]).filter(function(r2){return r2.clientName===c.name&&r2.rating>0;}).length;
  }
  return {disliked:disliked,liked:liked};
}

function insertRecipeFoodsIntoMeal(recipe,ctx){
  var c=getC();
  if(!c)return;
  var meal=c.weekPlan[ctx.d][ctx.mi];
  (recipe.foods||[]).forEach(function(f){
    meal.foods.push({n:f.n,g:f.g});
  });
  // Έτοιμα/branded γεύματα (tag 'Έτοιμο γεύμα'): κρατάμε το όνομα του πιάτου πάνω στο γεύμα ώστε
  // ο πελάτης να το βλέπει ως γραμμή-τίτλο πάνω από τα υλικά (client link + PDF) και να μπορεί να
  // το παραγγείλει με το όνομά του. Το brand name μένει αυτούσιο σε κάθε γλώσσα (δεν μεταφράζεται).
  if((recipe.tags||[]).indexOf('Έτοιμο γεύμα')>-1 && recipe.name){
    meal.dishLabels=meal.dishLabels||[];
    if(meal.dishLabels.indexOf(recipe.name)===-1) meal.dishLabels.push(recipe.name);
  }
  save();
  renderWeekTable();
  var modal=document.getElementById('food-selector-modal');
  if(modal)modal.remove();
}

// Αφαίρεση μιας γραμμής-τίτλου έτοιμου γεύματος από το γεύμα (κουμπί × στο εβδομαδιαίο πλάνο).
function removeDishLabel(d,mi,li){
  var c=getC();if(!c||!c.weekPlan[d]||!c.weekPlan[d][mi])return;
  var meal=c.weekPlan[d][mi];
  if(!meal.dishLabels)return;
  meal.dishLabels.splice(li,1);
  if(!meal.dishLabels.length)delete meal.dishLabels;
  save();renderWeekTable();
}

function confirmAddRecipeToMeal(recipeId){
  var ctx=window.currentFoodContext;
  if(!ctx)return;
  var c=getC();
  if(!c)return;
  var recipe=(typeof findRecipeById==='function')?findRecipeById(recipeId):null;
  if(!recipe){showErrorToast('Η συνταγή δεν βρέθηκε.');return;}
  var conflicts=getRecipeExclusionConflicts(recipe,c);
  var feedback=getClientRecipeFeedback(recipe,c);
  var reasons=[];
  if(conflicts.length)reasons.push('περιέχει '+conflicts.map(function(f){return f.n;}).join(', ')+' — αποκλεισμένο/αλλεργία για τον πελάτη');
  if(feedback.disliked)reasons.push('ο πελάτης την είχε απορρίψει (👎) σε προηγούμενο πλάνο');
  if(reasons.length && typeof showConfirmDialog==='function'){
    showConfirmDialog(
      'Η συνταγή «'+recipe.name+'» '+reasons.join(' και ')+'. Προσθήκη παρόλα αυτά;',
      function(){insertRecipeFoodsIntoMeal(recipe,ctx);},
      {title:'Προσοχή',icon:'⚠️',confirmLabel:'Προσθήκη παρόλα αυτά'}
    );
  } else {
    insertRecipeFoodsIntoMeal(recipe,ctx);
  }
}

function delF(d,mi,fi){var c=getC();if(!c)return;var m=c.weekPlan[d][mi];m.foods.splice(fi,1);if(!m.foods.length&&m.dishLabels)delete m.dishLabels;save();renderWeekTable();}


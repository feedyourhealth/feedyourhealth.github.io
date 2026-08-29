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


// js/plan-gen/week-table.js
// The weekly-plan table renderer, extracted verbatim from js/app-part3.js
// (module split wave 19): mealSourceBadge, regenerateDay, renderWeekTable.
// Pure fn declarations, no load-time code. renderWeekTable is the app's main
// plan view; it calls getMicronutrientHtml / renderMedScore / validateFoodDistribution
// / getSupplementRecommendations / enableMealDragDrop / initializeMealTiming etc.
// — some in sibling plan-gen/* modules, some still further down app-part3.js — all
// at call time (runtime). External callers (11-undo-redo, app-part2/4, gen-plan.js,
// tracking.js) are runtime too. Loads right before app-part3.js.

/* ======== WEEKLY TABLE ======== */
// Ποιο "tier" παρήγαγε το γεύμα (πρόγραμμα Priority 0-3 στο genPlan) — μικρό badge ενημέρωσης, όχι λειτουργικό
function mealSourceBadge(meal){
  if(!meal) return '';
  var src = meal.source || (meal.fromLibrary ? 'library' : (meal.recipeId ? 'recipe' : null));
  if(!src) return '';
  var MAP = {
    'own-history': {icon:'🕓', label:'Δικό του ιστορικό', bg:'#e0f2f1', color:'#00695c'},
    library:   {icon:'⭐', label:'Πρότυπο γεύσης', bg:'#fff8e1', color:'#f9a825'},
    recipe:    {icon:'👨‍🍳', label:'Συνταγή', bg:'#e3f2fd', color:'#1565C0'},
    saved:     {icon:'💾', label:'Αποθηκευμένο', bg:'#e8f5e9', color:'var(--good)'},
    generated: {icon:'✨', label:'Δημιουργήθηκε', bg:'#f3e5f5', color:'#8e24aa'},
    template:  {icon:'📋', label:'Πρότυπο', bg:'#f5f5f5', color:'#757575'}
  };
  var m = MAP[src];
  if(!m) return '';
  return '<span class="meal-source-badge" style="display:block;font-size:10px;font-weight:600;padding:1px 5px;border-radius:6px;margin-bottom:3px;background:'+m.bg+';color:'+m.color+';width:fit-content" title="Πηγή γεύματος: '+m.label+'">'+m.icon+' '+m.label+'</span>';
}

// Ξαναδημιουργεί ΜΟΝΟ μία ημέρα (όχι όλη την εβδομάδα) — τρέχει το κανονικό genPlan εσωτερικά
// και κρατάει μόνο το αποτέλεσμα της ζητούμενης ημέρας, επαναφέροντας τις υπόλοιπες όπως ήταν.
function regenerateDay(dayIndex){
  var c=getC();
  if(!c || !c.weekPlan || !Object.keys(c.weekPlan).length) return;
  var errors=validateClientData(c);
  if(errors.length>0){ showValidationErrors(errors); return; }
  pregnancyBlockCheck(c, function(){
    showConfirmDialog('Αναδημιουργία μόνο της ημέρας «'+DAYS[dayIndex]+'»;', function(){
      var oldPlan = deepClone(c.weekPlan);
      genPlan();
      var newDay = deepClone(c.weekPlan[dayIndex]);
      c.weekPlan = deepClone(oldPlan);
      c.weekPlan[dayIndex] = newDay;
      save();
      renderWeekTable();
      showSuccessToast('🔄 Η ημέρα «'+DAYS[dayIndex]+'» αναδημιουργήθηκε!');
    }, {icon:'🔄', confirmLabel:'Αναδημιουργία'});
  });
}

function renderWeekTable(){
  var c=getC();var con=document.getElementById('week-con');if(!con)return;
  if(!c||!Object.keys(c.weekPlan).length){con.innerHTML='<div style="padding:20px;color:var(--text-muted);font-size:12px">Δεν υπάρχει πλάνο — πάτα «Δημιουργία πλάνου»</div>';return;}
  // Mediterranean compliance score badge
  var scoreHtml=renderMedScore(c.weekPlan);
  var mealNames=(c.weekPlan[0]||[]).map(function(m){return m.name;});
  var numMeals=mealNames.length;

  var trainD=c.trainDays||[false,false,false,false,false,false,false];
  var trainTimes=c.trainTimesByDay||['','','','','','',''];

  // Supplement recommendations now shown in modal only (not inline)

  // ✅ IMPROVEMENT 1: Build summary card with client info
  var tdeeInfo = calcTDEE(c);

  // Define activity & goal labels locally for this function
  var actL = {sed:'Καθιστικός',light:'Ελαφρά ενεργός',mod:'Μέτρια ενεργός',active:'Έντονα ενεργός'};
  var goalL = {mild:'Ήπια απώλεια',loss:'Απώλεια βάρους',maintain:'Διατήρηση',gain:'Αύξηση μάζας',running:'Δρομείς'};

  // ✅ Fallback '—' αντί για το ίδιο το JS "undefined" όταν λείπει εντελώς το πεδίο (π.χ. ελλιπώς
  // συμπληρωμένος πελάτης) — πριν εμφανιζόταν κυριολεκτικά η λέξη "undefined" στο summary card.
  var activityLabel = actL[c.activity] || c.activity || '—';
  var goalLabel = goalL[c.goalMain] || c.goalMain || '—';
  var bmiVal = (c.weight && c.height) ? (c.weight / ((c.height/100) * (c.height/100))).toFixed(1) : '—';

  // ✅ Ring "θερμίδες εβδομάδας" — μ.ο. πραγματικού αθροίσματος γευμάτων (calculateDailyTotals,
  // Dietologist.html, ΙΔΙΑ συνάρτηση με το report modal του app-part3.js) έναντι του ημερήσιου
  // στόχου (per-day c.dayTargets[d].k αν υπάρχει, αλλιώς το γενικό tdeeInfo.target). Ζωντανή ένδειξη
  // "πόσο κοντά είναι το πλάνο στον στόχο" — ξαναϋπολογίζεται σε κάθε renderWeekTable(), δηλ. σε κάθε
  // προσθήκη/αφαίρεση τροφίμου. Μετράει μόνο μέρες που έχουν έστω 1 γεύμα — μια εντελώς άδεια μέρα δεν
  // πρέπει να τραβάει το ποσοστό προς τα κάτω σαν "αποτυχία".
  var weekActualK=0, weekTargetK=0, weekDaysCounted=0;
  for(var _wdi=0;_wdi<7;_wdi++){
    var _wdTotals=calculateDailyTotals(c.weekPlan[_wdi]||[]);
    if(_wdTotals.k>0){
      weekActualK+=_wdTotals.k;
      weekTargetK+=(c.dayTargets&&c.dayTargets[_wdi]&&c.dayTargets[_wdi].k)?c.dayTargets[_wdi].k:tdeeInfo.target;
      weekDaysCounted++;
    }
  }
  var weekKcalPct=weekTargetK>0?Math.max(0,Math.min(150,Math.round(weekActualK/weekTargetK*100))):null;
  var weekKcalRingHtml=weekKcalPct==null?'':(
    pctRing(Math.min(100,weekKcalPct),{size:40,thickness:5,color:weekKcalPct>=100?'var(--good)':'#025857',track:'#e2eee5',label:false})
    +'<span style="font-size:12px;color:#555">'+weekKcalPct+'% μ.ο. στόχου θερμίδων <span style="color:#999">('+weekDaysCounted+' μέρες με γεύματα)</span></span>'
  );

  var divider='<span style="width:1px;height:16px;background:#e0e0e0"></span>';
  var summaryCard = '<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:10px;padding:8px 14px;margin-bottom:12px;display:flex;align-items:center;gap:14px;flex-wrap:wrap">'
    +'<span style="font-size:13px;font-weight:700;color:#025857">👤 ' + esc(c.name) + '</span>'
    +divider
    +'<span style="font-size:12px;color:#555">📊 ' + c.weight + 'kg / ' + c.height + 'cm · BMI ' + bmiVal + '</span>'
    +divider
    +'<span style="font-size:12px;color:#555">🎯 ' + goalLabel + '</span>'
    +divider
    +'<span style="font-size:12px;font-weight:700;color:#e65100">🔥 ' + Math.round(tdeeInfo.target) + ' kcal</span>'
    +divider
    +'<span style="font-size:12px;color:#555">Π:' + Math.round(tdeeInfo.p) + 'g · Λ:' + Math.round(tdeeInfo.f) + 'g · Υ:' + Math.round(tdeeInfo.carb) + 'g</span>'
    +(weekKcalRingHtml?(divider+'<span style="display:flex;align-items:center;gap:8px">'+weekKcalRingHtml+'</span>'):'')
    +'</div>';

  // ✅ Legend για τις χρωματιστές κουκκίδες τροφίμων — ίδια hex codes με getFoodColorHex()
  var foodDotLegend='<div style="background:var(--panel-bg);border:1px solid var(--border-light);border-radius:6px;padding:6px 10px;margin-bottom:10px;font-size:10px;color:#666;display:flex;flex-wrap:wrap;gap:10px;align-items:center">'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#5DADE2;margin-right:4px;vertical-align:middle"></span>Πρωτεΐνη</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F8B739;margin-right:4px;vertical-align:middle"></span>Δημητριακά/Άλλα</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#52B788;margin-right:4px;vertical-align:middle"></span>Λαχανικά</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#E8A0BF;margin-right:4px;vertical-align:middle"></span>Αυγά/Γαλακτ.</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#C77DFF;margin-right:4px;vertical-align:middle"></span>Φρούτα</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FFB703;margin-right:4px;vertical-align:middle"></span>Ξηροί καρποί</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#FB8500;margin-right:4px;vertical-align:middle"></span>Λάδια</span>'
    +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#B5651D;margin-right:4px;vertical-align:middle"></span>Μπαχαρικά</span>'
    +'</div>';

  // Build table HTML — show T/R badge in header + training time
  // Το κουμπί «Προσθήκη γεύματος» εμφανίζεται ΜΟΝΟ όταν υπάρχει ημέρα με 2+ προπονήσεις
  // (2 MET δραστηριότητες στην ίδια ημέρα) — όχι σε κανονικά πλάνα/πρότυπα.
  var dblDays=getDoubleTrainingDays(c);
  var addMealBar='';
  if(dblDays.length){
    var dblNames=dblDays.map(function(i){return DAYS[i];}).join(', ');
    addMealBar='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:10px;flex-wrap:wrap">'
      +'<span style="font-size:11px;color:#025857;background:#e2eee5;border:1px solid #b5dcd6;border-radius:8px;padding:4px 10px">🏋️ Διπλή προπόνηση: <b>'+dblNames+'</b> — πρόσθεσε γεύμα πριν/ανάμεσα στις προπονήσεις</span>'
      +'<button onclick="openAddMealSlotModal()" title="Πρόσθεσε ένα έξτρα γεύμα (π.χ. πριν/μετά 2ης προπόνησης)" style="background:#025857;color:#fff;border:none;padding:7px 14px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600">➕ Προσθήκη γεύματος</button>'
      +'</div>';
  }
  var html=summaryCard+foodDotLegend+addMealBar+'<table class="week-table"><thead><tr><th>Γεύμα</th>';
  DAYS.forEach(function(d,di){
    // ✅ Native title tooltip explains T/R on hover instead of a permanent banner repeating
    // the same explanation once above a table where the badge already appears 7 times.
    var badge=trainD[di]?'<span title="Ημέρα με άσκηση: περισσότερες θερμίδες για ενέργεια + ανάκαμψη" style="background:#025857;color:#fff;border-radius:8px;font-size:10px;padding:1px 5px;margin-left:3px;cursor:help">T</span>':'<span title="Ημέρα ανάπαυσης: λιγότερες θερμίδες λόγω μειωμένης δαπάνης ενέργειας" style="background:#eee;color:var(--text-muted);border-radius:8px;font-size:10px;padding:1px 5px;margin-left:3px;cursor:help">R</span>';
    var timeStr='';
    if(trainD[di]&&trainTimes[di]&&trainTimes[di].length>0){
      timeStr='<div style="font-size:10px;color:#666;margin-top:2px;font-weight:400">🕐 '+trainTimes[di]+'</div>';
    }
    // ✅ Phase 1: Add sport display for training days
    var sportStr='';
    if(trainD[di]&&c.sport){
      sportStr='<div class="sport-header-dietitian" style="font-size:10px;color:#666;margin-top:2px;font-weight:500">'+c.sport+'</div>';
    }
    // ✅ Ένα κουμπί "⋮" αντί για 2 γυμνά εικονίδια — το μενού που ανοίγει έχει ορατό κείμενο
    // ("Αντιγραφή σε άλλες ημέρες" κ.λπ.) αντί να βασίζεται μόνο σε tooltip πάνω σε 2 μικρά
    // εικονίδια δίπλα-δίπλα, δύσκολα να τα ανακαλύψει κανείς την πρώτη φορά.
    var dayMenuId='day-menu-'+di;
    var dayMenuBtn='<button class="day-menu-btn" onclick="event.stopPropagation();toggleDayMenu(\''+dayMenuId+'\')" title="Ενέργειες ημέρας" aria-label="Ενέργειες ημέρας">⋮</button>';
    var dayMenuDropdown='<div id="'+dayMenuId+'" class="day-menu-dropdown">'
      +'<button onclick="copyDayPrompt(this,'+di+');closeDayMenu(\''+dayMenuId+'\')">📋 Αντιγραφή σε άλλες ημέρες</button>'
      +'<button onclick="regenerateDay('+di+');closeDayMenu(\''+dayMenuId+'\')">🔄 Αναδημιουργία μόνο αυτής</button>'
      +'<button onclick="swapDayPrompt(this,'+di+');closeDayMenu(\''+dayMenuId+'\')">🔁 Ανταλλαγή με άλλη ημέρα</button>'
      +'</div>';
    html+='<th style="position:relative">'+d+badge+timeStr+sportStr+dayMenuBtn+dayMenuDropdown+'</th>';
  });
  html+='</tr></thead><tbody>';

  for(var mi=0;mi<numMeals;mi++){
    // ✅ Phase 2: Add meal timing icons with profiles
    var mealTiming='regular';
    if(c.weekPlan[0]&&c.weekPlan[0][mi]&&c.weekPlan[0][mi].mealTiming){
      mealTiming=c.weekPlan[0][mi].mealTiming;
    }
    var timingProf=MEAL_TIMING_PROFILES[mealTiming]||MEAL_TIMING_PROFILES.regular;
    var timingInfo='Π:'+timingProf.p+'% Λ:'+timingProf.f+'% Υ:'+timingProf.c+'% — '+timingProf.desc;

    // ✅ HORIZONTAL LAYOUT: Meal name as section header
    var timingBadge=(mealTiming&&mealTiming!=='regular')
      ?'<span style="background:#025857;color:#fff;border-radius:8px;font-size:10px;padding:1px 7px;margin-left:8px;font-weight:600" title="'+timingProf.desc+'">'+timingProf.label+'</span>'
      :'';
    html+='<tr style="background:linear-gradient(90deg, #f8f8f8 0%, #f0f0f0 100%);box-shadow:0 2px 4px rgba(0,0,0,0.05)"><td colspan="8" class="meal-section-header" data-timing-info="'+timingInfo+'">'
      +'<span style="font-weight:700;color:#025857;font-size:12px">'+timingProf.icon+' '+esc(mealNames[mi])+'</span>'
      +timingBadge
      +'<button onclick="renameMealSlot('+mi+')" title="Μετονομασία γεύματος" aria-label="Μετονομασία γεύματος" style="background:none;border:none;cursor:pointer;font-size:11px;opacity:0.55;margin-left:6px" class="meal-slot-ctl">✏️</button>'
      +'<button onclick="deleteMealSlot('+mi+')" title="Διαγραφή γεύματος (όλες τις ημέρες)" aria-label="Διαγραφή γεύματος (όλες τις ημέρες)" style="background:none;border:none;cursor:pointer;font-size:11px;opacity:0.55" class="meal-slot-ctl">🗑️</button>'
      +'</td></tr>';
    var rowBg=(mi%2===0)?'background:var(--panel-bg)':'background:var(--card-bg)';
    html+='<tr style="'+rowBg+'"><td class="meal-label" style="visibility:hidden"></td>';
    for(var d=0;d<7;d++){
      var foods=(c.weekPlan[d]&&c.weekPlan[d][mi])?c.weekPlan[d][mi].foods:[];
      // ✅ Phase 4: Add meal timing data attribute
      var dayMealTiming='regular';
      if(c.weekPlan[d]&&c.weekPlan[d][mi]&&c.weekPlan[d][mi].mealTiming){
        dayMealTiming=c.weekPlan[d][mi].mealTiming;
      }
      html+='<td class="day-cell" data-d="'+d+'" data-mi="'+mi+'" data-meal-timing="'+dayMealTiming+'" style="'+rowBg+'">';
      if(foods.length){
        html+='<span class="meal-drag-handle" title="Σύρε ΟΛΟΚΛΗΡΟ το γεύμα σε άλλη ημέρα/γεύμα (αντιγραφή)" aria-label="Σύρε ολόκληρο το γεύμα (αντιγραφή)">&#10303;</span>';
      }
      html+=mealSourceBadge(c.weekPlan[d]&&c.weekPlan[d][mi]);
      // Γραμμή-τίτλος έτοιμου/branded γεύματος — ό,τι βλέπει κι ο πελάτης στο link/PDF, με κουμπί × για αφαίρεση.
      var _mObj=c.weekPlan[d]&&c.weekPlan[d][mi];
      if(_mObj&&_mObj.dishLabels&&_mObj.dishLabels.length){
        _mObj.dishLabels.forEach(function(_lbl,_li){
          html+='<div style="display:flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:#025857;background:#e2eee5;border:1px solid #b5dcd6;border-radius:6px;padding:2px 5px;margin-bottom:3px" title="Έτοιμο γεύμα — ο πελάτης το παραγγέλνει με αυτό το όνομα">'
            +'<span style="flex:1;min-width:0">🍽️ '+esc(_lbl)+'</span>'
            +'<button onclick="removeDishLabel('+d+','+mi+','+_li+')" title="Αφαίρεση τίτλου" aria-label="Αφαίρεση τίτλου" style="background:none;border:none;cursor:pointer;font-size:12px;line-height:1;color:#025857;opacity:.6;flex-shrink:0">&times;</button>'
            +'</div>';
        });
      }
      foods.forEach(function(food,fi){
        // Free meal special display
        if(food.n===FREE_MEAL_MARKER){
          html+='<div style="text-align:center;padding:6px 4px;background:#fff8e1;border:1px dashed #f9a825;border-radius:7px;margin-bottom:2px">'
            +'<span style="font-size:11px;font-weight:700;color:#f57f17">🎉 Ελεύθερο γεύμα</span>'
            +'<button class="chip-del" onclick="delF('+d+','+mi+','+fi+')" aria-label="Διαγραφή τροφίμου" style="margin-left:4px;color:#f9a825">&#10005;</button>'
            +'</div>';
          return;
        }
        var hasSrv=PORTIONS[food.n]&&PORTIONS[food.n].length>0;
        var fu=FOOD_UNITS[food.n];
        // Use stored unit (food.u) if available, otherwise use default from FOOD_UNITS
        var displayUnit = food.u !== undefined ? food.u : (fu ? fu.u : 'g');
        var chipVal, chipMax, chipChg;
        if (displayUnit === 'g' || !fu) {
          chipVal = food.g;
          chipMax = 999;
          chipChg = 'updG('+d+','+mi+','+fi+',this.value)';
        } else {
          chipVal = WHOLE_UNIT_FOODS[food.n]
            ? Math.max(1, Math.round(food.g / fu.g))
            : Math.max(0.1, Math.round(food.g / fu.g * 10) / 10);
          chipMax = 10;
          chipChg = 'updG('+d+','+mi+','+fi+',this.value*'+fu.g+')';
        }
        var chipUnit = pluralUnit(displayUnit, chipVal);
        var hasIng=((FOODS[food.n]&&FOODS[food.n].ingredients)||(typeof FYH_RECIPE_EXPAND!=='undefined'&&FYH_RECIPE_EXPAND[food.n]))?'<button class="chip-srv" onclick="showRecipeModal(\''+food.n.replace(/'/g,"\\'")+'\')" title="Δείτε τα συστατικά" aria-label="Δείτε τα συστατικά">📖</button>':'';
        var hasExpand=FYH_RECIPE_EXPAND[food.n]?'<button class="chip-srv" onclick="expandRecipeInPlan('+d+','+mi+','+fi+')" title="Άνοιγμα υλικών — επεξεργασία ποσοτήτων" aria-label="Άνοιγμα υλικών — επεξεργασία ποσοτήτων">🔽</button>':'';
        var borderColor=getFoodColorHex(food.n);
        var rvTip=cm(food.n,food.g);
        var macroTip='<div class="chip-macro-tip">'
          +'<span style="color:#1565C0">Π '+Math.round(rvTip.p)+'</span> '
          +'<span style="color:#B71C1C">Λ '+Math.round(rvTip.f)+'</span> '
          +'<span style="color:#2E7D32">Υ '+Math.round(rvTip.c)+'</span> '
          +'<span style="color:#E65100;font-weight:700">&middot; '+Math.round(rvTip.k)+' kcal</span>'
          +'</div>';
        html+='<div class="food-chip" data-d="'+d+'" data-mi="'+mi+'" data-fi="'+fi+'" title="Σύρε αυτό το υλικό σε άλλο γεύμα (αντιγραφή)">'
          +macroTip
          +'<div class="chip-r1">'
          +'<span class="food-dot" style="background:'+borderColor+'" title="Ομάδα τροφίμου"></span>'
          +'<div class="chip-name-wrap">'
          +'<input class="chip-inp" type="text" value="'+food.n+'" autocomplete="off" spellcheck="false" title="'+food.n+'"'
          +' data-d="'+d+'" data-mi="'+mi+'" data-fi="'+fi+'"'
          +' oninput="showChipSug(this)" onfocus="showChipSug(this)" onblur="closeDD()">'
          +'</div>'
          +'</div>'
          +'<div class="chip-r2">'
          +hasIng
          +hasExpand
          +(hasSrv?'<button class="chip-srv" onmousedown="event.preventDefault();showPortions(this,'+d+','+mi+','+fi+')" aria-label="Μερίδες">&#8801;</button>':'')
          +'<input class="chip-g" type="number" min="0" step="'+(displayUnit==='g'||!fu?'1':'0.1')+'" max="'+chipMax+'" value="'+chipVal+'" onchange="'+chipChg+'">'
          +'<button class="chip-unit-btn" onclick="cycleUnit('+d+','+mi+','+fi+')" title="Αλλαγή μονάδας" aria-label="Αλλαγή μονάδας">'+chipUnit+'</button>'
          +(fu&&fu.u==='μερίδ.'?'<span class="chip-ghint">('+food.g+'g)</span>':'')
          +'<button class="chip-swap-btn" onclick="showMealAlternatives('+d+','+mi+')" title="Εναλλακτικό γεύμα" aria-label="Εναλλακτικό γεύμα">🔄</button>'
          +'<button class="chip-del" onclick="delF('+d+','+mi+','+fi+')" aria-label="Διαγραφή τροφίμου">&#10005;</button>'
          +'</div>'
          +'</div>';
        // Recipe ingredients — visible only in print/PDF
        if(FOODS[food.n]&&FOODS[food.n].ingredients){
          html+='<div class="chip-ingredients-print">';
          FOODS[food.n].ingredients.forEach(function(ing){
            var prep=ing.prep?' ('+ing.prep+')':'';
            var unit=ing.unit?' '+ing.unit:'';
            var size=ing.size?' '+ing.size:'';
            html+='<div style="font-size:8px;color:#666;padding:1px 0;margin-left:18px">• '+ing.item+': '+ing.qty+unit+size+prep+'</div>';
          });
          if(FOODS[food.n].time){html+='<div style="font-size:8px;color:var(--text-muted);padding:2px 0;margin-left:18px">⏱️ '+FOODS[food.n].time+'</div>';}
          html+='</div>';
        } else if(typeof FYH_RECIPE_EXPAND!=='undefined'&&FYH_RECIPE_EXPAND[food.n]){
          // FYH/expandable recipe → show its ingredients (scaled to portion) in print/PDF
          var rxPrint=FYH_RECIPE_EXPAND[food.n];
          var scPrint=(food.g||rxPrint.base)/rxPrint.base;
          html+='<div class="chip-ingredients-print">';
          rxPrint.ing.forEach(function(ing){
            var gPrint=Math.max(1,Math.round(ing.g*scPrint));
            html+='<div style="font-size:8px;color:#666;padding:1px 0;margin-left:18px">• '+ing.n+': '+gPrint+'g</div>';
          });
          html+='</div>';
        }
      });
      var mK2=0,mP2=0,mF2=0,mC2=0,mFi2=0;
      foods.forEach(function(f2){var rv=cm(f2.n,f2.g);mK2+=rv.k;mP2+=rv.p;mF2+=rv.f;mC2+=rv.c;mFi2+=rv.fi;});
      if(foods.length){
        var hasFree=foods.some(function(f){return f.n===FREE_MEAL_MARKER;});
        var lowProt=!hasFree&&mP2<15&&mP2>0;
        html+='<div class="meal-mac-bar">'
          +(lowProt?'<span class="prot-warn" title="Χαμηλή πρωτεΐνη — στόχος ≥15g/γεύμα για βέλτιστη MPS">⚠️</span>':'')
          +'<span style="color:#1565C0">Π:'+Math.round(mP2)+'</span> '
          +'<span style="color:#B71C1C">Λ:'+Math.round(mF2)+'</span> '
          +'<span style="color:#2E7D32">Υ:'+Math.round(mC2)+'</span>'
          +(mFi2>=0.5?' <span style="color:#795548" title="Φυτικές ίνες">· 🌾'+mFi2.toFixed(1)+'g</span>':'')
          +' <span style="color:#E65100;font-weight:700">&middot; '+Math.round(mK2)+' kcal</span></div>';
      }
      html+='<button class="chip-add" onclick="addF('+d+','+mi+')">+</button>';
      if(foods.length){
        var menuId='meal-menu-'+d+'-'+mi;
        html+='<div style="display:inline-block;position:relative;margin-left:8px;">'
          +'<button class="chip-add" onclick="toggleMealMenu(\''+menuId+'\')" style="background:#025857;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:bold;" title="Περισσότερες επιλογές">⋮</button>'
          +'<div id="'+menuId+'" class="meal-menu-dropdown" style="display:none;position:absolute;right:0;top:100%;background:var(--card-bg);border:1px solid var(--border-light);border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:100;min-width:200px;margin-top:4px;">'
          +'<button onclick="toggleFavoriteMeal('+d+','+mi+',this);closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:var(--text-strong);font-size:12px;white-space:nowrap;transition:background 0.2s;opacity:'+(isFavoriteMeal(d,mi)?'1':'0.5')+'" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">'+(isFavoriteMeal(d,mi)?'⭐ Αφαίρεση από Αγαπημένα':'⭐ Προσθήκη στα Αγαπημένα')+'</button>'
          +'<button onclick="saveCombo('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:var(--text-strong);font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">💾 Αποθήκευση</button>'
          +'<button onclick="balanceMacros('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:var(--text-strong);font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">⚖️ Ισορροπία</button>'
          +'<button onclick="copyMealToClipboard('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:var(--text-strong);font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">❐ Αντιγραφή</button>'
          +'<hr style="margin:4px 0;border:none;border-top:1px solid #eee;">'
          +'<button onclick="rateMeal('+d+','+mi+',1);closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:var(--text-strong);font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">👍 Μου άρεσε</button>'
          +'<button onclick="rateMeal('+d+','+mi+',-1);showMealAlternatives('+d+','+mi+');closeMealMenu(\''+menuId+'\')" style="display:block;width:100%;text-align:left;padding:10px 12px;background:none;border:none;cursor:pointer;color:#ff6b35;font-size:12px;white-space:nowrap;transition:background 0.2s;" onmouseover="this.style.background=\'var(--panel-bg)\'" onmouseout="this.style.background=\'none\'">👎 Δεν μου άρεσε</button>'
          +'</div>'
          +'</div>';
      }
      html+='</td>';
    }
    html+='</tr>';
  }

  // Totals row
  var tdeeR=calcTDEE(c);
  var effTgtArr=getDayTgtEff(c,tdeeR);
  var fiberDayTgt=getFiberTarget(c.age,c.sex);
  html+='<tr class="totals-row"><td class="meal-label">Σύνολο</td>';
  for(var d=0;d<7;d++){
    var tK=0,tP=0,tF=0,tC=0,tFi=0;
    (c.weekPlan[d]||[]).forEach(function(m){(m.foods||[]).forEach(function(f){var r=cm(f.n,f.g);tK+=r.k;tP+=r.p;tF+=r.f;tC+=r.c;tFi+=r.fi;});});
    var eff=effTgtArr[d]||{k:tdeeR.target,p:tdeeR.p,f:tdeeR.f,c:tdeeR.carb};
    var kPct=eff.k?Math.round(tK/eff.k*100):100;
    var kCls=kPct<88?'low':kPct>112?'over':'ok';
    var trainBadge=trainD[d]?'<span style="font-size:9px;font-weight:700;color:#025857"> T</span>':'';
    // Macro bar helper
    function mBar(actual,target,color){
      var pctW=target?Math.min(100,Math.round(actual/target*100)):100;
      var barColor=pctW<80?'#e67e22':pctW>115?'#c0392b':color;
      return '<div style="width:'+pctW+'%;background:'+barColor+'" class="macro-bar-fill"></div>';
    }
    function mVal(actual,target){return actual&&target?(actual/target<0.8?'#e67e22':actual/target>1.15?'#c0392b':'#555'):'#555';}
    var fiPct=fiberDayTgt?tFi/fiberDayTgt:1;
    var fiValColor=fiPct<0.65?'#B71C1C':fiPct<0.85?'#e67e22':'#5d4037';
    html+='<td>'
      +'<div class="tot-kcal '+kCls+'">'+Math.round(tK)+' / '+eff.k+' kcal '+kPct+'%'+trainBadge+'</div>'
      +'<div class="macro-bar-row">'
        +'<span class="mbr-label" style="color:#1565C0">Π</span>'
        +'<div class="macro-bar">'+mBar(tP,eff.p,'#1565C0')+'</div>'
        +'<span class="mbr-val" style="color:'+mVal(tP,eff.p)+'">'+Math.round(tP)+'/'+Math.round(eff.p)+'g</span>'
      +'</div>'
      +'<div class="macro-bar-row">'
        +'<span class="mbr-label" style="color:#e65100">Λ</span>'
        +'<div class="macro-bar">'+mBar(tF,eff.f,'#e65100')+'</div>'
        +'<span class="mbr-val" style="color:'+mVal(tF,eff.f)+'">'+Math.round(tF)+'/'+Math.round(eff.f)+'g</span>'
      +'</div>'
      +'<div class="macro-bar-row">'
        +'<span class="mbr-label" style="color:#2e7d32">Υ</span>'
        +'<div class="macro-bar">'+mBar(tC,eff.c,'#2e7d32')+'</div>'
        +'<span class="mbr-val" style="color:'+mVal(tC,eff.c)+'">'+Math.round(tC)+'/'+Math.round(eff.c)+'g</span>'
      +'</div>'
      +'<div class="macro-bar-row" title="Φυτικές Ίνες — στόχος '+fiberDayTgt+'g/ημ. (DRI)">'
        +'<span class="mbr-label" style="color:#5d4037">Ί</span>'
        +'<div class="macro-bar">'+mBar(tFi,fiberDayTgt,'#795548')+'</div>'
        +'<span class="mbr-val" style="color:'+fiValColor+'">'+tFi.toFixed(1)+'/'+fiberDayTgt+'g</span>'
      +'</div>'
      +'</td>';
  }
  html+='</tr></tbody></table>';

  // ── Tuna frequency check (mercury risk) ─────────────────────────────────────
  var tunaCount=0;
  for(var tdi2=0;tdi2<7;tdi2++){
    (c.weekPlan[tdi2]||[]).forEach(function(m){
      m.foods.forEach(function(f){if(/τόνο/i.test(f.n))tunaCount++;});
    });
  }
  var tunaWarnHtml='';
  if(tunaCount>=3){
    var isMinorTW=(c.age||0)<18;
    tunaWarnHtml='<div style="background:#fff3e0;border:1px solid #ffb74d;border-radius:8px;padding:7px 12px;font-size:11px;color:#bf360c;margin-bottom:8px">'
      +'🐟 <b>Προσοχή — Τόνος:</b> εμφανίζεται <b>'+tunaCount+'x</b> αυτή την εβδομάδα.'
      +(isMinorTW?' Για ανηλίκους το ανώτατο όριο EFSA (2015) είναι <b>≤2 μερίδες/εβδ.</b> λόγω μεθυλυδραργύρου.'
               :' Συνίσταται <b>max 3-4 μερίδες/εβδ.</b> (EFSA 2015 — μεθυλυδράργυρος).')
      +'</div>';
  }

  // ── Weekly fiber summary banner ────────────────────────────────────────────
  var wkFiTot=0,wkFiTgt=getFiberTarget(c.age,c.sex)*7;
  var wkFiByDay=[];
  for(var wfd=0;wfd<7;wfd++){
    var dFi=0;
    (c.weekPlan[wfd]||[]).forEach(function(m){(m.foods||[]).forEach(function(ff){dFi+=cm(ff.n,ff.g).fi;});});
    wkFiByDay.push(dFi);wkFiTot+=dFi;
  }
  var wkFiPct=wkFiTgt?Math.round(wkFiTot/wkFiTgt*100):100;
  var wkFiColor=wkFiPct>=90?'#4CAF50':wkFiPct>=65?'#FF9800':'#F44336';
  var wkFiTxtColor=wkFiPct>=90?'#1b5e20':wkFiPct>=65?'#E65100':'#B71C1C';
  var dotHtml='';
  DAYS.forEach(function(dn,di){
    var dp=wkFiByDay[di],dPct=getFiberTarget(c.age,c.sex)?Math.round(dp/getFiberTarget(c.age,c.sex)*100):100;
    var dc=dPct>=90?'#4CAF50':dPct>=65?'#FF9800':'#F44336';
    dotHtml+='<span title="'+dn+': '+dp.toFixed(1)+'g ('+dPct+'%)" style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;cursor:default">'
      +'<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+dc+'"></span>'
      +'<span style="font-size:8px;color:#888">'+dn.charAt(0)+'</span>'
    +'</span>';
  });
  var fiberBannerHtml='<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:10px;padding:8px 14px;margin-bottom:8px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    +'<span style="font-size:15px" title="Φυτικές Ίνες (Dietary Fiber)">🌾</span>'
    +'<span style="font-size:11px;font-weight:700;color:#555">Φυτικές Ίνες Εβδομάδας</span>'
    +'<span style="font-size:17px;font-weight:800;color:'+wkFiTxtColor+'">'+Math.round(wkFiTot)+'g</span>'
    +'<span style="font-size:10px;color:#888">/ '+wkFiTgt+'g στόχος &nbsp;·&nbsp; <b style="color:'+wkFiTxtColor+'">'+wkFiPct+'%</b></span>'
    +'<div style="flex:1;min-width:80px;height:6px;background:#e4e4e4;border-radius:3px;overflow:hidden">'
      +'<div style="width:'+Math.min(100,wkFiPct)+'%;height:100%;background:'+wkFiColor+';border-radius:3px;transition:width .3s"></div>'
    +'</div>'
    +'<div style="display:flex;gap:5px;align-items:center">'+dotHtml+'</div>'
    +(wkFiPct<65?'<span style="font-size:10px;color:#B71C1C;font-weight:600">⚠ Χαμηλή πρόσληψη ινών — στόχος '+getFiberTarget(c.age,c.sex)+'g/ημ. (DRI AI)</span>':'')
  +'</div>';
  // ✅ VALIDATE FOOD DISTRIBUTION — μαζί με τα άλλα validation widgets (Μεσογειακή βαθμολογία,
  // ίνες) πριν το εβδομαδιαίο grid, όχι μετά από αυτό — οι παραβιάσεις (π.χ. «πρέπει ακριβώς 2
  // ημέρες κόκκινο κρέας») είναι ακριβώς αυτό που χρειάζεται να δει η δ/γείος ΕΝΩ χτίζει το πλάνο,
  // όχι αφού περάσει scroll από ολόκληρο το πλέγμα.
  var foodValidation = validateFoodDistribution(c.weekPlan);
  var validationHtml = displayFoodDistributionResults(foodValidation);

  // Instead of displaying micronutrients inline, add a button to open the modal
  con.innerHTML=scoreHtml+fiberBannerHtml+validationHtml+tunaWarnHtml+html;

  // Enable drag & drop for meals
  enableMealDragDrop();

  // Small neutral icon row for the analysis tools (previously 4 equally-loud colored
  // buttons competing with the primary save/send actions above the plan)
  var btnContainer=document.createElement('div');
  btnContainer.className='plan-tools-row';
  con.appendChild(btnContainer);

  // Add micronutrients button
  var microBtn=document.createElement('button');
  microBtn.className='plan-tool-btn';
  microBtn.innerHTML='📊';
  microBtn.title='Μικροθρεπτικά & Κρίσιμοι Στόχοι ('+Object.keys(c.weekPlan||{}).length+')';
  microBtn.onclick=openMicroModal;
  btnContainer.appendChild(microBtn);

  // Add supplement suggestions button
  var suppBtn=document.createElement('button');
  suppBtn.className='plan-tool-btn';
  suppBtn.innerHTML='💊';
  suppBtn.title='Προτάσεις Συμπληρωμάτων';
  suppBtn.onclick=openSupplementModal;
  btnContainer.appendChild(suppBtn);

  // Add gap analysis button
  var gapBtn=document.createElement('button');
  gapBtn.className='plan-tool-btn';
  gapBtn.innerHTML='🔬';
  gapBtn.title='Ανάλυση Κενών';
  gapBtn.onclick=openGapAnalysisModal;
  btnContainer.appendChild(gapBtn);

  // Add validation audit button
  var valBtn=document.createElement('button');
  valBtn.className='plan-tool-btn';
  valBtn.innerHTML='🔍';
  valBtn.title='Validate Plan';
  valBtn.onclick=openValidationModal;
  btnContainer.appendChild(valBtn);

  // Attach drag-and-drop + click-to-select to each day-cell
  con.querySelectorAll('.day-cell').forEach(function(cell){
    cell.addEventListener('dragover',function(e){e.preventDefault();cell.classList.add('drag-over');});
    cell.addEventListener('dragleave',function(e){if(!cell.contains(e.relatedTarget))cell.classList.remove('drag-over');});
    cell.addEventListener('drop',function(e){
      e.preventDefault();cell.classList.remove('drag-over');
      var data=e.dataTransfer.getData('text/plain');
      if(insertPlanItemIntoCell(parseInt(cell.dataset.d),parseInt(cell.dataset.mi),data))renderWeekTable();
    });
    // ✅ Click-to-add target: πάτημα σε κελί το κάνει "ενεργό" ώστε το επόμενο κλικ σε
    // τρόφιμο/συνδυασμό απ' τη βιβλιοθήκη να μπαίνει κατευθείαν εκεί, χωρίς drag.
    cell.addEventListener('click',function(){
      setActiveMealTarget(parseInt(cell.dataset.d),parseInt(cell.dataset.mi));
    });
  });
  refreshActiveMealIndicator();
}


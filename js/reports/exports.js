// js/reports/exports.js
// Every client-facing export / report generator, extracted from js/app-part4.js
// (module split wave 7). Pure function declarations, zero load-time code:
//   shopRound / shopDisp (shopping-list rounding)
//   exportPDF, exportWord, exportGoogleDocs (the weekly plan)
//   escRtf, exportLipometriaPDF, exportBodyCompPDF, sendBodyCompReport (body comp)
//   showDebugPanel, showReferences
//   exportBackup, exportClientsJSON, importClientsJSON
// All refs (getC, cm, esc, FOODS, TMPLS, jsPDF/JSZip via CDN, renderWeekTable, …)
// are runtime-only, so this loads between app-part3.js and app-part4.js.

// Shared by exportPDF() and exportWord()'s shopping list: round a raw gram amount up to a
// sensible "buy this much" increment, and format it as grams or kg for display.
function shopRound(g){if(g<100)return Math.ceil(g/10)*10;if(g<500)return Math.ceil(g/25)*25;if(g<1000)return Math.ceil(g/50)*50;return Math.ceil(g/100)*100;}
// gramLabel lets callers with a language toggle (exportPDF) show 'γρ.' for Greek; omitted/undefined
// keeps the original always-'g' behavior (exportWord has no language toggle at all).
function shopDisp(g,gramLabel){if(g>=1000)return(Math.round(g/100)/10).toFixed(1)+' kg';return g+(gramLabel||'g');}

function exportPDF(lang){
  var isEn=lang==='en';
  var c=getC();
  if(!c||!Object.keys(c.weekPlan||{}).length){showErrorToast(isEn?'Create a plan first!':'Πρώτα δημιούργησε πλάνο!');return;}
  // Calculate weekly average target for MET-based accuracy
  var t=calcTDEE(c);
  var avgTarget=t.target;
  if(c.dayTargets&&c.dayTargets.length===7){
    var totalKcal=0;
    for(var di=0;di<7;di++){
      totalKcal+=(c.dayTargets[di].k||0);
    }
    avgTarget=Math.round(totalKcal/7);
  }
  // Expand FYH recipes to individual ingredients for PDF display
  var expandedWeekPlan=[];
  for(var d=0;d<7;d++){
    expandedWeekPlan[d]=[];
    if(c.weekPlan[d]){
      expandedWeekPlan[d]=deepClone(c.weekPlan[d]);
    }
  }
  // Translation helpers
  function fn(name){var food=FOODS[name];return (isEn&&food&&food.en)||name;}       // food name
  function tMn(name){return (isEn&&EN_MEAL_NAMES[name])||name;}      // meal name
  function tu(u){return (isEn&&EN_UNITS[u])||u;}                      // unit label
  function tc(cat){return (isEn&&EN_CAT_NAMES[cat])||cat;}            // category name
  var goalL=isEn
    ?{mild:'Mild Weight Loss',loss:'Weight Loss',maintain:'Maintenance',gain:'Muscle Gain',running:'Running / Endurance'}
    :{mild:'Ήπια απώλεια',loss:'Απώλεια βάρους',maintain:'Διατήρηση',gain:'Αύξηση μάζας',running:'Δρομείς'};
  var actL=isEn
    ?{sed:'Sedentary',light:'Lightly Active',mod:'Moderately Active',active:'Highly Active'}
    :{sed:'Καθιστικός',light:'Ελαφρά ενεργός',mod:'Μέτρια ενεργός',active:'Έντονα ενεργός'};
  var numTDays=(c.trainDays||[]).filter(function(x){return x;}).length;
  var hydBase=t.hydBase||Math.round(c.weight*35);
  var hydTrain=t.hydTrain||Math.round(hydBase+(c.trainHoursPerDay||1)*500);
  var hydStr=isEn
    ?'Hydration – Rest: '+hydBase+'ml  /  Training: '+hydTrain+'ml'
    :'Ενυδάτωση Ανάπαυση: '+hydBase+'ml  /  Προπόνηση: '+hydTrain+'ml';

  // Prepare week plan data with expanded recipes for header calculations
  var weekPlanForPDF=expandedWeekPlan;

  // logo via canvas (larger, crisp)
  var logoSrc='';
  try{
    var lc2=document.createElement('canvas');lc2.width=120;lc2.height=120;
    var lx2=lc2.getContext('2d');
    lx2.fillStyle='#e5e5e5';lx2.fillRect(0,0,120,120);
    lx2.fillStyle='#025857';lx2.font='bold 54px Georgia,serif';
    lx2.textAlign='center';lx2.textBaseline='middle';lx2.fillText('fyh',60,60);
    logoSrc=lc2.toDataURL('image/png');
  }catch(e){}

  var isMinorPdf=(c.age||0)<16;
  var mealNames=(weekPlanForPDF[0]||[]).map(function(m){return m.name;});
  var dayFull=isEn
    ?['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    :['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
  // Detect meal type from name
  function mealType(name){
    var n=(name||'').toLowerCase();
    if(n.indexOf('πρω')>-1||n.indexOf('reakfast')>-1)return'b';
    if(n.indexOf('εσημ')>-1||n.indexOf('unch')>-1)return'l';
    if(n.indexOf('ραδ')>-1||n.indexOf('inner')>-1)return'd';
    return's';
  }
  var kidsSnackIdx=0;
  var kidsSnackIcons=['🍎','🥛'];

  // ── Day header row ──────────────────────────────────────────────────────────
  var kDayColors=['#FF6B35','#FFD166','#06D6A0','#118AB2','#EF476F','#9B5DE5','#FF6B35'];
  var thead='<tr><th class="th-corner">'+(isEn?'Meal':'Γεύμα')+'</th>';
  for(var hd=0;hd<7;hd++){
    var hdK=0;
    (weekPlanForPDF[hd]||[]).forEach(function(m){m.foods.forEach(function(f){hdK+=cm(f.n,f.g).k;});});
    var tb=(c.trainDays&&c.trainDays[hd])?' <span class="tbadge">T</span>':'';
    if(isMinorPdf){
      var dc=kDayColors[hd];var lightDay=(hd===1||hd===6);
      thead+='<th style="background:'+dc+';color:'+(lightDay?'#333':'#fff')+';border-radius:8px;">'+esc(dayFull[hd])+tb+'</th>';
    } else {
      thead+='<th style="background:linear-gradient(160deg,#025857,#037a7a);color:#fff;">'+esc(dayFull[hd])+tb+'</th>';
    }
  }
  thead+='</tr>';

  // ── Meal rows (label cell + content) ────────────────────────────────────────
  var tbody='';
  var kidsIcons={b:'🌅',l:'🥗',d:'🌙',s:null};
  for(var mi=0;mi<mealNames.length;mi++){
    var mt=mealType(mealNames[mi]);
    tbody+='<tr class="meal-'+mt+'">';
    // Label cell
    var mLabel=esc(tMn(mealNames[mi]));
    if(isMinorPdf){
      var ico=(mt==='s')?kidsSnackIcons[kidsSnackIdx++%kidsSnackIcons.length]:kidsIcons[mt];
      tbody+='<td class="mlbl"><span class="mlbl-icon">'+(ico||'')+'</span><span class="mlbl-txt">'+mLabel+'</span></td>';
    } else {
      tbody+='<td class="mlbl"><span class="mlbl-txt">'+mLabel+'</span></td>';
    }
    // 7 day cells
    for(var dd=0;dd<7;dd++){
      var _mForPdf=weekPlanForPDF[dd]&&weekPlanForPDF[dd][mi];
      var fds=_mForPdf?_mForPdf.foods:[];
      var mK=0;var ch='';
      // Γραμμή-τίτλος έτοιμου/branded γεύματος πάνω από τα υλικά (brand name αυτούσιο σε κάθε γλώσσα).
      if(_mForPdf&&_mForPdf.dishLabels&&_mForPdf.dishLabels.length){
        ch+='<div class="fr" style="font-weight:700;color:#025857">🍽️ '+esc(_mForPdf.dishLabels.join(' + '))+'</div>';
      }
      fds.forEach(function(fd){
        var mv=cm(fd.n,fd.g);mK+=mv.k;
        if(fd.n===FREE_MEAL_MARKER){ch+='<div class="free">🎉 '+(isEn?'Free Meal':'Ελεύθερο')+'</div>';return;}
        var g_=isEn?'g':'γρ.';
        var _qd=fmtFoodQty(fd,g_,tu);
        var pdMain=_qd.main,pdSub=_qd.sub;
        ch+='<div class="fr"><span class="fn">'+esc(fn(fd.n))+'</span>'
          +' <span class="fg">'+pdMain+'</span>'
          +(pdSub?' <span class="fghint">'+pdSub+'</span>':'')
          +'</div>';
      });
      if(fds.length)ch+='<div class="mt2">'+Math.round(mK)+' kcal</div>';
      tbody+='<td class="dcell">'+(ch||'&nbsp;')+'</td>';
    }
    tbody+='</tr>';
  }
  // Macro summary row
  tbody+='<tr class="macrow"><td class="macrow-lbl">'+(isEn?'Totals':'Σύνολα')+'</td>';
  for(var dm=0;dm<7;dm++){
    var tK=0,tP=0,tF=0,tC=0,tFiPdf=0;
    (weekPlanForPDF[dm]||[]).forEach(function(m){m.foods.forEach(function(f){var v=cm(f.n,f.g);tK+=v.k;tP+=v.p;tF+=v.f;tC+=v.c;tFiPdf+=v.fi;});});
    tbody+='<td><b>'+Math.round(tK)+' kcal</b><br>'+(isEn?'P':'Π')+':'+Math.round(tP)+' '+(isEn?'F':'Λ')+':'+Math.round(tF)+' '+(isEn?'C':'Υ')+':'+Math.round(tC)+(isEn?'g':'γρ.')
      +'<br><span style="color:#795548;font-size:9px">🌾 '+(isEn?'Fiber':'Ίνες')+':'+tFiPdf.toFixed(1)+(isEn?'g':'γρ.')+'</span></td>';
  }
  tbody+='</tr>';

  // ── Supplements ─────────────────────────────────────────────────────────────
  var suppHtml='';
  if(c.supps&&c.supps.length){
    if(!c.suppExclude)c.suppExclude=[];
    var sByT={};
    SUPP_TIMINGS.forEach(function(tm){sByT[tm]=[];});
    c.supps.forEach(function(id){
      var sx=null;SUPPS.forEach(function(x){if(x.id===id)sx=x;});
      if(!sx)return;
      sx.timing.forEach(function(ti){
        if(!sByT[ti.t])return;
        if(c.suppExclude.indexOf(id+'|'+ti.t)>-1)return;
        var suppName=(isEn&&sx.nameEn)||sx.name;
        var suppDose=ti.d&&((isEn&&ti.dEn)||ti.d);
        sByT[ti.t].push(suppName+(suppDose?' ('+suppDose+')':''));
      });
    });
    var sAny=false;SUPP_TIMINGS.forEach(function(tm){if(sByT[tm].length)sAny=true;});
    if(sAny){
      suppHtml='<div class="sec-title">'+(isEn?'Supplement Protocol':'Πρωτόκολλο Συμπληρωμάτων')+'</div>';
      suppHtml+='<table class="st"><thead><tr><th class="st-t">'+(isEn?'Timing':'Χρόνος Λήψης')+'</th><th>'+(isEn?'Supplements &amp; Dosage':'Συμπληρώματα &amp; Δοσολογία')+'</th></tr></thead><tbody>';
      var salt=false;
      SUPP_TIMINGS.forEach(function(tm){
        if(!sByT[tm].length)return;
        suppHtml+='<tr'+(salt?' class="alt"':'')+'><td class="st-t">'+esc((isEn&&EN_SUPP_TIMINGS[tm])||tm)+'</td><td>'+esc(sByT[tm].join('   •   '))+'</td></tr>';
        salt=!salt;
      });
      suppHtml+='</tbody></table>';
    }
  }

  // ── Fruit Exchange List ── (FX είναι πλέον global, ορίζεται στο js/data.js — εδώ μόνο χρήση) ──
  var fxHtml='<div class="sec-title">'+(isEn?'Fruit Exchange List':'Λίστα Ανταλλαγής Φρούτων')+'</div>';
  fxHtml+='<div class="fxnote">'+(isEn?'Each option equals 1 fruit serving — feel free to swap between them':'Κάθε επιλογή αντιστοιχεί σε 1 μερίδα φρούτου — αλλάζτε ελεύθερα μεταξύ τους')+'</div>';
  var fxH1=isEn?'Fruit':'Φρούτο', fxH2=isEn?'Serving':'Μερίδα', fxH3=isEn?'g':'Γρ.';
  fxHtml+='<table class="fxt"><thead><tr>'
    +'<th style="width:18%">'+fxH1+'</th><th style="width:28%">'+fxH2+'</th>'
    +'<th style="width:8%" class="ctr">'+fxH3+'</th><th style="width:10%" class="ctr">~kcal</th>'
    +'<th style="width:18%">'+fxH1+'</th><th style="width:28%">'+fxH2+'</th>'
    +'<th style="width:8%" class="ctr">'+fxH3+'</th><th style="width:10%" class="ctr">~kcal</th>'
    +'</tr></thead><tbody>';
  var fxHalf=Math.ceil(FX.length/2);
  for(var fxi=0;fxi<fxHalf;fxi++){
    var fa=FX[fxi], fb=FX[fxi+fxHalf];
    var faK=FOODS[fa.n]?Math.round(FOODS[fa.n].k*fa.g/100):'-';
    fxHtml+='<tr'+(fxi%2?' class="alt"':'')+'>'
      +'<td class="fxname">'+esc(fn(fa.n))+'</td>'
      +'<td class="fxpor">'+esc(isEn?fa.porEn:fa.por)+'</td>'
      +'<td class="fxg">'+fa.g+'</td>'
      +'<td class="fxk">'+faK+'</td>';
    if(fb){
      var fbK=FOODS[fb.n]?Math.round(FOODS[fb.n].k*fb.g/100):'-';
      fxHtml+='<td class="fxname">'+esc(fn(fb.n))+'</td>'
        +'<td class="fxpor">'+esc(isEn?fb.porEn:fb.por)+'</td>'
        +'<td class="fxg">'+fb.g+'</td>'
        +'<td class="fxk">'+fbK+'</td>';
    }else{fxHtml+='<td colspan="4"></td>';}
    fxHtml+='</tr>';
  }
  fxHtml+='</tbody></table>';

  // ── Spices & Herbs Guide (client-facing reference) ───────────────────────────
  var SPICES=[
    {n:'Κουρκουμάς',en:'Turmeric',ben:'Αντιφλεγμονώδες, αντιοξειδωτικό',benEn:'Anti-inflammatory, antioxidant',use:'1-3 γρ./ημέρα (1 κ.γλ.)',useEn:'1 tsp/day',note:'Με μαύρο πιπέρι για απορρόφηση',noteEn:'With black pepper for absorption'},
    {n:'Μαύρο πιπέρι',en:'Black Pepper',ben:'Βελτίωση απορρόφησης θρεπτικών, αντιμικροβιακό',benEn:'Nutrient absorption, antimicrobial',use:'1-2 γρ./ημέρα',useEn:'½ tsp/day',note:'Συνδυάζεται με κουρκουμά',noteEn:'Pairs with turmeric'},
    {n:'Κανέλα',en:'Cinnamon',ben:'Ρύθμιση σακχάρου, αντιοξειδωτικό',benEn:'Blood sugar control, antioxidant',use:'1-4 γρ./ημέρα (1 κ.γλ.)',useEn:'1 tsp/day',note:'Προτιμήστε Κεϋλάνης για ασφάλεια',noteEn:'Prefer Ceylon for safety'},
    {n:'Τζίντζερ',en:'Ginger',ben:'Αντιφλεγμονώδες, πέψη, ναυτία',benEn:'Anti-inflammatory, digestion, nausea relief',use:'2-5 γρ./ημέρα (1-2 κ.γλ.)',useEn:'1-2 tsp/day',note:'Φρέσκο ή σκόνη',noteEn:'Fresh or powder'},
    {n:'Σκόρδο',en:'Garlic',ben:'Καρδιοπροστασία, αντιμικροβιακό',benEn:'Cardiovascular, antimicrobial',use:'1-2 σκελίδες/ημέρα',useEn:'1-2 cloves/day',note:'Καλύτερο ωμό',noteEn:'Best raw'},
    {n:'Ρίγανη',en:'Oregano',ben:'Αντιμικροβιακό, αντιοξειδωτικό',benEn:'Antimicrobial, antioxidant',use:'1-2 γρ./ημέρα (1 κ.γλ.)',useEn:'1 tsp/day',note:'Ρίγανη ελληνική ισχυρή',noteEn:'Greek oregano is potent'},
    {n:'Δεντρολίβανο',en:'Rosemary',ben:'Γνωστική λειτουργία, αντιοξειδωτικό',benEn:'Cognitive support, antioxidant',use:'1-2 γρ./ημέρα (1 κ.γλ.)',useEn:'1 tsp/day',note:'Φρέσκο ή αποξηραμένο',noteEn:'Fresh or dried'},
    {n:'Θυμάρι',en:'Thyme',ben:'Αντιμικροβιακό, αναπνευστική υγεία',benEn:'Antimicrobial, respiratory health',use:'1-2 γρ./ημέρα',useEn:'1 tsp/day',note:'Χρήση σε ροφήματα',noteEn:'Use in teas/infusions'},
    {n:'Βασιλικός',en:'Basil',ben:'Αντιφλεγμονώδες, καρδιαγγειακή υγεία',benEn:'Anti-inflammatory, cardiovascular health',use:'2-5 γρ./ημέρα (φρέσκα φύλλα)',useEn:'Few leaves/day',note:'Προτιμήστε φρέσκο',noteEn:'Prefer fresh'},
    {n:'Δυόσμος',en:'Mint',ben:'Πέψη, αναπνευστικό',benEn:'Digestion, respiratory',use:'2-3 γρ./ημέρα ή 1 φλιτζάνι τσάι',useEn:'1 cup tea/day',note:'Ανακουφίζει από φούσκωμα',noteEn:'Relieves bloating'},
    {n:'Φασκόμηλο',en:'Sage',ben:'Μνήμη, αντιφλεγμονώδες',benEn:'Memory support, anti-inflammatory',use:'2-3 γρ./ημέρα ή 1 φλιτζάνι τσάι',useEn:'1 cup tea/day',note:'Σε γυναίκες βοηθά και στην εμμηνόπαυση',noteEn:'May help women in menopause'},
    {n:'Κουμίν',en:'Cumin',ben:'Πέψη, αντιοξειδωτικό',benEn:'Digestion, antioxidant',use:'1-3 γρ./ημέρα (1 κ.γλ.)',useEn:'1 tsp/day',note:'Συνήθως με φακές/όσπρια',noteEn:'Usually with lentils/legumes'},
    {n:'Γλυκάνισος',en:'Anise',ben:'Αναπνευστικό, πέψη',benEn:'Respiratory, digestion',use:'1-2 γρ./ημέρα ή 1 φλιτζάνι τσάι',useEn:'1 cup tea/day',note:'Χρήση σε ροφήματα',noteEn:'Use in teas/infusions'},
    {n:'Κορίανδρος',en:'Coriander',ben:'Ρύθμιση σακχάρου, πέψη',benEn:'Blood sugar control, digestion',use:'1-3 γρ./ημέρα',useEn:'1 tsp/day',note:'Φρέσκο ή σπόροι',noteEn:'Fresh or seeds'},
    {n:'Τσίλι/Καυτερή πιπ.',en:'Chili Pepper',ben:'Μεταβολισμός, αντιφλεγμονώδες',benEn:'Metabolism boost, anti-inflammatory',use:'0.5-1 γρ./ημέρα (1/4 κ.γλ.)',useEn:'1/4 tsp/day',note:'Προσοχή σε στομάχι',noteEn:'Caution with sensitive stomach'},
    {n:'Κάρδαμο',en:'Cardamom',ben:'Πέψη, αντιοξειδωτικό',benEn:'Digestion, antioxidant',use:'1-2 γρ./ημέρα',useEn:'1 tsp/day',note:'Χρήση σε τσάι',noteEn:'Use in tea'},
    {n:'Μοσχοκάρυδο',en:'Nutmeg',ben:'Χαλάρωση, πέψη',benEn:'Relaxation, digestion',use:'Μικρή ποσότητα (0.5-1 γρ.)',useEn:'1/4 tsp/day',note:'Υπερβολή → τοξικό',noteEn:'Excess is toxic'},
    {n:'Γαρύφαλλο',en:'Clove',ben:'Αντιμικροβιακό, αντιοξειδωτικό',benEn:'Antimicrobial, antioxidant',use:'0.5-1 γρ./ημέρα (1/4-1/2 κ.γλ.)',useEn:'1/4 tsp/day',note:'Ισχυρή δράση',noteEn:'Potent action'},
    {n:'Σαφράνι',en:'Saffron',ben:'Διάθεση, αντιοξειδωτικό',benEn:'Mood, antioxidant',use:'30-50 mg/ημέρα',useEn:'30-50 mg/day',note:'Ακριβό, μικρή δόση',noteEn:'Expensive, small dose'},
    {n:'Μάραθος',en:'Fennel',ben:'Πέψη, αντιφλεγμονώδες',benEn:'Digestion, anti-inflammatory',use:'1-3 γρ./ημέρα ή 1 φλιτζάνι τσάι',useEn:'1 cup tea/day',note:'Χρήση σε βραστά',noteEn:'Use in cooked dishes'}
  ];
  var spH1=isEn?'Spice / Herb':'Μπαχαρικό / Βότανο', spH2=isEn?'Benefits':'Οφέλη', spH3=isEn?'Recommended Use':'Συνιστώμενη Χρήση', spH4=isEn?'Notes':'Σημειώσεις';
  var spicesHtml='<div class="sec-title">🌿 '+(isEn?'Spices &amp; Herbs Guide':'Οδηγός Μπαχαρικών &amp; Βοτάνων')+'</div>';
  spicesHtml+='<div class="fxnote">'+(isEn?'Therapeutic spices &amp; herbs — suggested daily use. Not a substitute for medical advice.':'Θεραπευτικά μπαχαρικά &amp; βότανα — ενδεικτική ημερήσια χρήση. Δεν υποκαθιστά ιατρική συμβουλή.')+'</div>';
  spicesHtml+='<table class="fxt spt"><thead><tr>'
    +'<th style="width:16%">'+spH1+'</th><th style="width:30%">'+spH2+'</th>'
    +'<th style="width:27%">'+spH3+'</th><th style="width:27%">'+spH4+'</th>'
    +'</tr></thead><tbody>';
  for(var spi=0;spi<SPICES.length;spi++){
    var sp=SPICES[spi];
    spicesHtml+='<tr'+(spi%2?' class="alt"':'')+'>'
      +'<td class="fxname">'+esc(isEn?sp.en:sp.n)+'</td>'
      +'<td>'+esc(isEn?sp.benEn:sp.ben)+'</td>'
      +'<td>'+esc(isEn?sp.useEn:sp.use)+'</td>'
      +'<td>'+esc(isEn?sp.noteEn:sp.note)+'</td>'
      +'</tr>';
  }
  spicesHtml+='</tbody></table>';

  // ── STRATEGY A: Consolidated Supplement List (Existing + Recommended) ───────────
  var selectedSuppHtml='';
  var consolidatedSupps=[];
  var processedSuppNames=new Set();

  // Step 1: Add currently taken supplements (from Page 1 - c.supps)
  var currentSupps=c.supps||[];
  currentSupps.forEach(function(suppId){
    var suppObj=SUPPS.find(function(s){return s.id===suppId;});
    if(suppObj){
      consolidatedSupps.push({
        supplement:(isEn&&suppObj.nameEn)||suppObj.name,
        dose:suppObj.dose||(isEn?'(per product label)':'(βάσει ετικέτας προϊόντος)'),
        source:'existing',
        id:suppId
      });
      processedSuppNames.add(suppObj.name);
    }
  });

  // Step 2: Add recommended supplements that aren't already taken (from Page 2 - selected)
  if(c.selectedSupplements && c.selectedSupplements.length > 0){
    c.selectedSupplements.forEach(function(supp){
      if(!processedSuppNames.has(supp.supplement)){
        consolidatedSupps.push({
          supplement:supp.supplement,
          dose:supp.dose||supp.info||'',
          source:'recommended',
          info:supp.info
        });
        processedSuppNames.add(supp.supplement);
      }
    });
  }

  // Step 3: Generate PDF section with consolidated list
  if(consolidatedSupps.length > 0){
    selectedSuppHtml='<div class="sec-title">💊 '+(isEn?'Supplement Protocol':'Πρωτόκολλο Συμπληρωμάτων')+'</div>';
    selectedSuppHtml+='<table class="st"><thead><tr><th class="st-t">'+(isEn?'Supplement':'Συμπλήρωμα')+'</th><th style="font-size:9px">'+(isEn?'Status':'Κατάσταση')+'</th><th>'+(isEn?'Dosage &amp; Notes':'Δοσολογία &amp; Σημειώσεις')+'</th></tr></thead><tbody>';
    var saltSel=false;
    consolidatedSupps.forEach(function(supp){
      var statusBadge=supp.source==='existing'?'<span style="background:#4caf50;color:white;padding:2px 6px;border-radius:3px;font-size:8px;font-weight:600">✓ '+(isEn?'Current':'Ήδη')+'</span>':'<span style="background:#ff6b35;color:white;padding:2px 6px;border-radius:3px;font-size:8px;font-weight:600">+ '+(isEn?'New':'Νέο')+'</span>';
      selectedSuppHtml+='<tr'+(saltSel?' class="alt"':'')+'><td class="st-t">'+esc(supp.supplement)+'</td><td style="font-size:9px;text-align:center;">'+statusBadge+'</td><td>'+esc(supp.dose||'')+'</td></tr>';
      saltSel=!saltSel;
    });
    selectedSuppHtml+='</tbody></table>';
  }

  // ── Hydration protocol (below supplements) ───────────────────────────────────
  var hydrationHtml='';
  (function(){
    var hb=t.hydBase||Math.round(c.weight*35);
    var ht=t.hydTrain||(hb+500);
    var rows='<tr><td class="st-t">'+(isEn?'Daily baseline':'Ημερήσια βάση')+'</td><td>'+hb+' ml ('+(hb/1000).toFixed(1)+' L)</td></tr>';
    rows+='<tr class="alt"><td class="st-t">'+(isEn?'Training day':'Ημέρα προπόνησης')+'</td><td>'+ht+' ml ('+(ht/1000).toFixed(1)+' L)</td></tr>';
    var spProto=(c.sport&&SPORT_PROTOCOLS[c.sport])?SPORT_PROTOCOLS[c.sport]:null;
    var sp=spProto?spProto.hydration:null;
    var spEl=spProto?spProto.hydrationEl:null;
    if(sp){
      var labelMap=isEn
        ?{beforeMatch:'Before',preEx:'Before',duringEx:'During',duringMatch:'During',duringTraining:'During',postEx:'After',postMatch:'After',postTraining:'After'}
        :{beforeMatch:'Πριν',preEx:'Πριν',duringEx:'Κατά τη διάρκεια',duringMatch:'Κατά τη διάρκεια',duringTraining:'Κατά τη διάρκεια',postEx:'Μετά',postMatch:'Μετά',postTraining:'Μετά'};
      var order=['beforeMatch','preEx','duringEx','duringMatch','duringTraining','postEx','postMatch','postTraining'];
      var alt=false;
      order.forEach(function(k){
        if(sp[k]){var val=(!isEn&&spEl&&spEl[k])||sp[k];rows+='<tr'+(alt?' class="alt"':'')+'><td class="st-t">'+labelMap[k]+'</td><td>'+esc(val)+'</td></tr>';alt=!alt;}
      });
    }
    hydrationHtml='<div class="sec-title">💧 '+(isEn?'Hydration Protocol':'Πρωτόκολλο Ενυδάτωσης')+'</div>'
      +'<table class="st"><thead><tr><th class="st-t">'+(isEn?'Timing':'Χρόνος')+'</th><th>'+(isEn?'Amount':'Ποσότητα')+'</th></tr></thead><tbody>'+rows+'</tbody></table>';
  })();

  // ── Shopping list ────────────────────────────────────────────────────────────
  var shopHtml='';
  var shopTotals={};
  for(var sdi=0;sdi<7;sdi++){
    (weekPlanForPDF[sdi]||[]).forEach(function(meal){meal.foods.forEach(function(food){shopTotals[food.n]=(shopTotals[food.n]||0)+food.g;});});
  }
  var slCats=['Κρέας','Ψάρια','Αυγά/Γαλακτ.','Δημητριακά','Όσπρια','Λαχανικά','Φρούτα','Ξηροί καρποί','Λάδια','Συνταγές FYH'];
  var shopBC={};slCats.forEach(function(cat){shopBC[cat]=[];});shopBC['Άλλα']=[];
  Object.keys(shopTotals).forEach(function(name){
    var cat=(FOODS[name]&&FOODS[name].cat)||'Άλλα';
    if(!shopBC[cat])shopBC[cat]=[];
    var planG=Math.round(shopTotals[name]);
    var conv=COOKED_TO_RAW[name];
    var rawG,buyDisp,sublabel,changed;
    if(conv&&conv.isEgg){rawG=planG;buyDisp=Math.ceil(planG/55)+(isEn?' pcs.':' τεμ.');sublabel='('+planG+(isEn?'g':'γρ.')+')';changed=true;}
    else if(conv){rawG=shopRound(planG*conv.f);buyDisp=shopDisp(rawG,isEn?'g':'γρ.');sublabel=isEn?'raw':conv.label;changed=true;}
    else{rawG=shopRound(planG);buyDisp=shopDisp(rawG,isEn?'g':'γρ.');sublabel='';changed=false;}
    shopBC[cat].push({name:name,planG:planG,buyDisp:buyDisp,sublabel:sublabel,changed:changed});
  });
  var hasSI=slCats.concat(['Άλλα']).some(function(cat){return shopBC[cat]&&shopBC[cat].length>0;});
  if(hasSI){
    var slEmoji={'Κρέας':'🥩','Ψάρια':'🐟','Αυγά/Γαλακτ.':'🥚','Δημητριακά':'🌾',
      'Όσπρια':'🫘','Λαχανικά':'🥦','Φρούτα':'🍎','Ξηροί καρποί':'🌰',
      'Λάδια':'🫒','Συνταγές FYH':'🍽️','Άλλα':'📦'};
    // Collect non-empty cats, split into 2 balanced columns by item count
    var filledCats=[];
    slCats.concat(['Άλλα']).forEach(function(cat){if(shopBC[cat]&&shopBC[cat].length)filledCats.push(cat);});
    var totalSI=filledCats.reduce(function(s,c){return s+shopBC[c].length;},0);
    var col1=[],col2=[],col1n=0,switchDone=false;
    filledCats.forEach(function(cat){
      if(!switchDone&&col1n>=Math.ceil(totalSI/2)&&col1.length>0)switchDone=true;
      if(!switchDone){col1.push(cat);col1n+=shopBC[cat].length;}
      else{col2.push(cat);}
    });
    // Build a card for one category
    function slCard(cat){
      var items=shopBC[cat];
      var html='<div class="slcard">';
      html+='<div class="slcard-hdr">'+(slEmoji[cat]||'•')+' '+esc(tc(cat))+'</div>';
      items.forEach(function(item,idx){
        html+='<div class="slrow'+(idx%2?' sla':'')+'">'
          +'<span class="sl-chk">☐</span>'
          +'<span class="sl-nm">'+esc(fn(item.name))+'</span>'
          +'<span class="sl-pg">'+shopDisp(item.planG,isEn?'g':'γρ.')+'</span>'
          +'<span class="sl-amt">'+esc(item.buyDisp)
          +(item.sublabel?'<span class="sl-lbl"> '+esc(item.sublabel)+'</span>':'')
          +'</span>'
          +'</div>';
      });
      return html+'</div>';
    }
    shopHtml='<div class="sec-title">🛒 '+(isEn?'Weekly Shopping List':'Λίστα Αγορών Εβδομάδας')+'</div>';
    shopHtml+='<div class="shop-note">'+(isEn?'Cooked amounts have been converted to raw/dry for accurate shopping':'Οι ποσότητες σε ψητό/βρ. έχουν μετατραπεί σε ωμό/ξερό για σωστή αγορά')+'</div>';
    shopHtml+='<table class="sl2col"><tr>';
    // Column 1
    shopHtml+='<td class="slcol"><div class="slcards">';
    col1.forEach(function(cat){shopHtml+=slCard(cat);});
    shopHtml+='</div></td>';
    // Column 2
    shopHtml+='<td class="slcol"><div class="slcards">';
    col2.forEach(function(cat){shopHtml+=slCard(cat);});
    shopHtml+='</div></td>';
    shopHtml+='</tr></table>';
  }

  // 🥤 CHO Training Protocol section (Phase 3b) — one compact row per training day.
  // Only when the dietitian has opted the client in; reuses the supplements table style
  // (class "st") for visual consistency and stays on one page (page-break-inside:avoid).
  var choPdfHtml='';
  if(c.choProtocol&&c.choProtocol.enabled&&typeof computeCHOTargets==='function'){
    var choRows='', choN=0;
    for(var chd=0;chd<7;chd++){
      var chr=null; try{chr=computeCHOTargets(c,t,chd);}catch(e){chr=null;}
      if(!chr||(!chr.isTrainingDay&&!chr.isMatchDay))continue;
      choN++;
      var chDur=chr.during.applicable
        ? ('<b>'+chr.during.gramsPerHour+(isEn?' g/hr':' g/ώρα')+'</b> <span style="color:#777">(~'+chr.during.totalGrams+' g)</span>')
        : '<span style="color:#777">'+(isEn?'not needed':'δεν χρειάζεται')+'</span>';
      var chPreT=chr.pre.timeLabel?' <span style="color:#777">'+chr.pre.timeLabel+'</span>':'';
      var chPostT=chr.post.timeLabel?' <span style="color:#777">'+chr.post.timeLabel+'</span>':'';
      choRows+='<tr'+(choN%2===0?' class="alt"':'')+'>'
        +'<td style="white-space:nowrap;font-weight:700;color:#025857">'+dayFull[chd]+'</td>'
        +'<td><b>'+chr.pre.grams+' g</b>'+chPreT+'</td>'
        +'<td>'+chDur+'</td>'
        +'<td><b>'+chr.post.grams+' g</b>'+chPostT+'</td>'
        +'</tr>';
    }
    if(choRows){
      choPdfHtml='<div style="page-break-inside:avoid;break-inside:avoid;margin-top:8px">'
        +'<div class="sec-title">'+(isEn?'Carbohydrates around training':'Υδατάνθρακες γύρω από την προπόνηση')+'</div>'
        +'<table class="st"><thead><tr>'
        +'<th>'+(isEn?'Day':'Ημέρα')+'</th><th>⚡ '+(isEn?'Before':'Πριν')+'</th>'
        +'<th>🔥 '+(isEn?'During':'Κατά')+'</th><th>💪 '+(isEn?'After':'Μετά')+'</th>'
        +'</tr></thead><tbody>'+choRows+'</tbody></table>'
        +'<div style="font-size:5pt;color:#777;font-style:italic;margin:-6px 0 8px">'
        +(isEn
          ? 'Part of the daily total, not extra. Example foods: banana + bread with honey (before) · sports drink / gel + water (during) · rice + chicken or a smoothie (after). Source: Thomas 2016.'
          : 'Μέρος του ημερήσιου συνόλου, όχι επιπλέον. Ενδεικτικά: μπανάνα + ψωμί με μέλι (πριν) · αθλητικό ποτό / gel + νερό (κατά) · ρύζι + κοτόπουλο ή smoothie (μετά). Πηγή: Thomas 2016.')
        +'</div></div>';
    }
  }

  // ── Assemble HTML ─────────────────────────────────────────────────────────────
  var FF="'Century Gothic','Avant Garde',Avantgarde,'Trebuchet MS',Trebuchet,sans-serif";
  var html='<!DOCTYPE html><html lang="'+(isEn?'en':'el')+'"><head><meta charset="UTF-8">'
    +'<title>'+(isEn?'Plan - ':'Πλάνο - ')+esc(c.name||(isEn?'Client':'Πελάτης'))+'</title><style>'
    +'@page{size:A4 landscape;margin:0}'
    +'*{box-sizing:border-box;margin:0;padding:0}'
    +'body{font-family:'+FF+';font-size:6pt;color:var(--text-strong);padding:7mm}'
    +'.no-print{padding:6px;background:var(--panel-bg);border-bottom:1px solid #ddd;display:flex;gap:10px;align-items:center;margin-bottom:8px;margin:-7mm -7mm 8px}'
    // Header
    +'.hdr{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:5px;padding-bottom:4px;border-bottom:2px solid #025857}'
    +'.hl{display:flex;flex-direction:column;align-items:flex-start;gap:2px}'
    +'.hl img{width:42px;height:42px}'
    +'.hlurl{font-size:5pt;font-weight:700;color:#008080;letter-spacing:.5px;margin-top:1px}'
    +'.hr{text-align:right}'
    +'.hrname{font-size:10.5pt;font-weight:700;color:#025857;line-height:1.2}'
    +'.hrinfo{font-size:5.5pt;color:#555;margin-top:2px}'
    +'.hrtgt{font-size:6.5pt;font-weight:700;color:#025857;margin-top:2px}'
    +'.hrdef{font-size:5.5pt;color:#777;margin-top:1px;font-style:italic}'
    +'.hrhyd{font-size:5.5pt;color:#1565C0;margin-top:1px}'
    // Main plan table — compact layout fits on 1 page
    +'table.mt{border-collapse:separate;border-spacing:0;width:100%;table-layout:fixed;margin-bottom:5px}'
    +'table.mt th{padding:4px 3px;font-size:6.5pt;font-weight:900;border:1px solid #c5ddd8;text-align:center;vertical-align:middle}'
    +'th.th-corner{background:#025857;color:#fff;text-align:left;padding-left:5px;min-width:58px;}'
    +'.tbadge{background:#c8e6c9;color:#1b5e20;border-radius:3px;padding:0 2px;font-size:4.5pt}'
    +'.dkcal{font-weight:600;font-size:5pt}'
    // Meal label column
    +'td.mlbl{padding:3px 5px;vertical-align:middle;text-align:center;white-space:nowrap;border:1px solid #c5ddd8;font-size:6.5pt;font-weight:800;}'
    +'tr.meal-b td.mlbl{background:linear-gradient(90deg,#FFF3E0,#FFF9F5);border-left:3px solid #FF9800;color:#E65100;}'
    +'tr.meal-l td.mlbl{background:linear-gradient(90deg,#E8F5E9,#F2FAF2);border-left:3px solid #43A047;color:#2E7D32;}'
    +'tr.meal-d td.mlbl{background:linear-gradient(90deg,#E3F2FD,#EEF6FD);border-left:3px solid #1E88E5;color:#1565C0;}'
    +'tr.meal-s td.mlbl{background:linear-gradient(90deg,#FFFDE7,#FEFEF5);border-left:3px solid #F9A825;color:#F57F17;}'
    +'.mlbl-icon{display:block;font-size:9pt;margin-bottom:0px;}'
    +'.mlbl-txt{display:block;font-size:5.5pt;}'
    // Food cells by meal type
    +'td.dcell{padding:2px 3px;vertical-align:top;border:1px solid #dde8e6;font-size:6pt;}'
    +'tr.meal-b td.dcell{background:#FFFAF5;}'
    +'tr.meal-l td.dcell{background:#F7FBF7;}'
    +'tr.meal-d td.dcell{background:#F5F9FF;}'
    +'tr.meal-s td.dcell{background:#FFFEF0;}'
    // Kids overrides
    +(isMinorPdf?'tr.meal-b td.mlbl{background:linear-gradient(135deg,#FF6B35,#FF9A5C);color:#fff;border-left:none;border-radius:8px;}'
      +'tr.meal-l td.mlbl{background:linear-gradient(135deg,#06D6A0,#0BEBA9);color:#fff;border-left:none;border-radius:8px;}'
      +'tr.meal-d td.mlbl{background:linear-gradient(135deg,#118AB2,#23A8D9);color:#fff;border-left:none;border-radius:8px;}'
      +'tr.meal-s td.mlbl{background:linear-gradient(135deg,#FFD166,#FFDF85);color:var(--text-strong);border-left:none;border-radius:8px;}'
      +'tr.meal-b td.dcell{background:#FFF5F0;border:1px solid #FFD5C0;border-radius:8px;}'
      +'tr.meal-l td.dcell{background:#F0FEEE;border:1px solid #C0F0D8;border-radius:8px;}'
      +'tr.meal-d td.dcell{background:#F0F8FF;border:1px solid #BFD9F0;border-radius:8px;}'
      +'tr.meal-s td.dcell{background:#FFFBF0;border:1px solid #FFE8A0;border-radius:8px;}'
      +'table.mt{border-spacing:2px;}':'')
    +'.fr{line-height:1.22}'
    +'.fn{color:var(--text-strong);font-weight:700}'
    +'.fg{color:#025857;font-weight:700}'
    +'.fghint{color:#000;font-size:5pt;font-weight:400;margin-left:1px}'
    +'.mt2{font-size:5pt;color:#555;border-top:1px dotted #aac7bf;margin-top:2px;padding-top:1px}'
    +'.free{color:#f57f17;font-weight:700}'
    +'tr.macrow td{background:#f5faf9;border-top:2px solid #025857;border:1px solid #c5ddd8;padding:3px 4px;font-size:5.5pt;text-align:center;color:#025857}'
    +'td.macrow-lbl{background:#e8f5f4;border-top:2px solid #025857;border:1px solid #c5ddd8;padding:3px 5px;font-size:6pt;text-align:center;font-weight:700;color:#025857;vertical-align:middle;}'
    +(isMinorPdf?'tr.macrow td{background:#F5F0FF;border-radius:6px;font-size:6pt;text-align:center;color:#9B5DE5;font-weight:800;padding:4px 2px;border:none;}'
      +'td.macrow-lbl{background:#F5F0FF;border-radius:6px;font-size:6pt;text-align:center;font-weight:800;color:#9B5DE5;border:none;padding:4px 2px;}':'')
    // Color legend (adult only)
    +(!isMinorPdf?'.legend{display:flex;gap:12px;margin-bottom:7px;flex-wrap:wrap;align-items:center;}'
      +'.leg-item{display:flex;align-items:center;gap:4px;font-size:6pt;color:#555;}'
      +'.leg-dot{width:9px;height:9px;border-radius:2px;flex-shrink:0;}':'')
    // Section titles
    +'.sec-title{font-size:9.5pt;font-weight:700;color:#025857;margin:10px 0 4px;padding-bottom:3px;border-bottom:2px solid #025857;page-break-after:avoid;break-after:avoid}'
    // Supplements table
    +'table.st{border-collapse:collapse;width:100%;margin-bottom:10px}'
    +'table.st th{background:#025857;color:#fff;padding:3px 8px;font-size:6.5pt;text-align:left;border:1px solid #013f3f}'
    +'table.st td{padding:3px 8px;border:1px solid #c5ddd8;font-size:6.5pt;vertical-align:middle}'
    +'table.st tr.alt td{background:#E2EEE5}'
    +'.st-t{font-weight:700;color:#025857;width:26%}'
    // Fruit exchange list
    +'table.fxt{border-collapse:collapse;width:100%;margin-bottom:6px}'
    +'table.fxt th{background:#025857;color:#fff;padding:3px 7px;font-size:6.5pt;text-align:left;border:1px solid #013f3f}'
    +'table.fxt th.ctr{text-align:center}'
    +'table.fxt td{padding:2px 7px;border:1px solid #c5ddd8;font-size:6.5pt;vertical-align:middle}'
    +'table.fxt tr.alt td{background:#f7fcf9}'
    +'tr.fxcat td{background:#E2EEE5;font-weight:700;color:#025857;font-size:5.5pt;padding:2px 7px;letter-spacing:.3px;text-transform:uppercase}'
    +'.fxname{font-weight:700;color:var(--text-strong);white-space:nowrap}'
    +'.fxpor{color:#555;white-space:nowrap}'
    +'.fxg{color:#025857;font-weight:700;text-align:center}'
    +'.fxk{color:#888;text-align:center}'
    +'.fxnote{font-size:5pt;color:var(--text-muted);margin-bottom:4px}'
    // Spices & herbs guide table
    +'table.spt td{white-space:normal;vertical-align:top}'
    +'table.spt .fxname{white-space:nowrap}'
    // Shopping list (separate page)
    +'.shop-page{page-break-before:always;break-before:page;padding-top:4mm}'
    +'.shop-note{font-size:5.5pt;color:#777;margin-bottom:8px;page-break-after:avoid;break-after:avoid}'
    +'.sl2col{width:100%;border-collapse:collapse;table-layout:fixed}'
    +'.slcol{width:50%;vertical-align:top}'
    +'.slcol:first-child{padding-right:6px}'
    +'.slcol:last-child{padding-left:6px}'
    +'.slcards{display:flex;flex-direction:column;gap:7px}'
    +'.slcard{border:1px solid #b2d8d8;border-radius:7px;overflow:hidden;page-break-inside:avoid;break-inside:avoid}'
    +'.slcard-hdr{background:#025857;color:#fff;padding:4px 10px;font-size:7pt;font-weight:700;letter-spacing:.3px}'
    +'.slrow{display:flex;align-items:baseline;padding:3px 9px;font-size:6.3pt;border-bottom:1px dotted #daeee9;gap:4px}'
    +'.slrow:last-child{border-bottom:none}'
    +'.slrow.sla{background:#f5fbf9}'
    +'.sl-chk{color:#c5ddd8;flex-shrink:0;margin-right:2px;font-size:7.5pt;line-height:1}'
    +'.sl-nm{flex:1;font-weight:600;color:var(--text-strong)}'
    +'.sl-pg{font-size:5pt;color:var(--text-muted);flex-shrink:0}'
    +'.sl-amt{font-weight:700;color:#025857;white-space:nowrap;font-size:7pt;flex-shrink:0;margin-left:4px}'
    +'.sl-lbl{font-size:5pt;color:#77a;font-weight:400;margin-left:2px}'
    // Footer
    +(isMinorPdf
      ?'.footer{margin-top:8px;padding-top:6px;border-top:3px dashed #FFD166;font-size:5.5pt;display:flex;justify-content:space-between;align-items:center;}'
       +'.footer-msg{color:#FF6B35;font-weight:700;font-size:6.5pt;}'
      :'.footer{margin-top:8px;padding-top:4px;border-top:1px solid #c5ddd8;font-size:5.5pt;color:#025857}')
    +'.minor-pdf-note{background:#fff8e1;border:1px solid #ffd54f;border-radius:4px;padding:4px 8px;font-size:6pt;color:#e65100;margin-bottom:6px}'
    // Kids sticker bar
    +(isMinorPdf?'.sticker-bar{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px;}'
      +'.sticker{border-radius:20px;padding:3px 10px;font-size:6.5pt;font-weight:700;display:inline-flex;align-items:center;gap:4px;}'
      +'.s-orange{background:#FFF3E0;color:#E65100;border:1.5px solid #FFCC80;}'
      +'.s-green{background:#E8F5E9;color:#2E7D32;border:1.5px solid #A5D6A7;}'
      +'.s-blue{background:#E3F2FD;color:#1565C0;border:1.5px solid #90CAF9;}'
      +'.s-purple{background:#F3E5F5;color:#6A1B9A;border:1.5px solid #CE93D8;}'
      +'.week-banner{background:linear-gradient(90deg,#9B5DE5,#C77DFF);color:#fff;border-radius:10px;padding:6px 14px;font-size:8.5pt;font-weight:800;margin-bottom:10px;}'
      +'':'')
    +'@media print{.no-print{display:none}body{padding:8mm;color-adjust:exact;-webkit-print-color-adjust:exact;print-color-adjust:exact}*{color-adjust:exact;-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
    +'</style></head><body>'
    // Kids: top rainbow band
    +(isMinorPdf?'<div style="height:7px;background:linear-gradient(90deg,#FF6B35,#FFD166,#06D6A0,#118AB2,#9B5DE5);margin:-12mm -12mm 0;"></div>':'')
    +'<div class="no-print">'
    +'<button onclick="window.print()" style="padding:6px 18px;background:#025857;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700">🖨️ '+(isEn?'Print / PDF':'Εκτύπωση / PDF')+'</button>'
    +'<span style="font-size:11px;color:#666">'+(isEn?'Select <b>Save as PDF</b>, <b>Landscape</b> and <b>disable headers/footers</b> for a clean result':'Επίλεξε <b>Αποθήκευση ως PDF</b>, <b>Landscape</b> και <b>απενεργοποίησε τις κεφαλίδες/υποσέλιδα</b> για καθαρό αποτέλεσμα')+'</span>'
    +'</div>'
    // ── KIDS HEADER ──
    +(isMinorPdf
      ?'<div class="hdr" style="margin-bottom:8px;padding-bottom:8px;border-bottom:2px solid #FFD166;align-items:center;">'
       +'<div class="hl">'+(logoSrc?'<img src="'+logoSrc+'" alt="fyh" style="width:46px;height:46px;border-radius:10px;">':'')+'<div class="hlurl">WWW.FEEDYOURHEALTH.ORG</div></div>'
       +'<div style="flex:1;margin:0 14px;background:linear-gradient(135deg,#06D6A0,#118AB2);border-radius:12px;padding:8px 14px;color:#fff;">'
       +'<div style="font-size:13pt;font-weight:900;">'+esc(c.name||(isEn?'Athlete':'Αθλητής'))+'</div>'
       +'<div style="font-size:6.5pt;margin-top:2px;opacity:.9;">'+(isEn?(c.sex==='M'?'Boy':'Girl')+', '+c.age+' yrs old':(c.sex==='M'?'Αγόρι':'Κορίτσι')+', '+c.age+' ετών')+' &nbsp;·&nbsp; '+c.weight+'kg / '+c.height+'cm</div>'
       +'<div style="margin-top:5px;"><span style="background:rgba(255,255,255,.22);border-radius:20px;padding:2px 10px;font-size:7.5pt;font-weight:700;">🎯 '+avgTarget+' kcal '+(isEn?'(avg)':'(μέσο)')+'</span></div>'
       +'</div>'
       +'<div style="text-align:right;">'
       +'<div style="background:#EEF9FF;border:2px solid #118AB2;border-radius:10px;padding:5px 9px;font-size:6.5pt;font-weight:700;color:#118AB2;">💧 '+t.hydBase+'ml<br><span style="font-weight:400;font-size:5.5pt;">'+(isEn?'+500ml training':'+500ml προπόνηση')+'</span></div>'
       +'</div>'
       +'</div>'
       // Sticker bar
       +'<div class="sticker-bar">'
       +(t.growthAdd>0?'<span class="sticker s-orange">🔥 '+(isEn?'Growth Allowance: +':'Αύξηση Ανάπτυξης: +')+t.growthAdd+' kcal</span>':'')
       +(numTDays>0?'<span class="sticker s-green">💪 '+numTDays+' '+(isEn?'training days':'ημέρες προπόνηση')+'</span>':'')
       +'<span class="sticker s-blue">🎯 '+avgTarget+' kcal '+(isEn?'(avg/week)':'(μέσο/εβδ.)')+'</span>'
       +'<span class="sticker s-purple">📅 '+(isEn?'Weekly Plan':'Εβδομαδιαίο Πλάνο')+'</span>'
       +'</div>'
       +'<div class="week-banner">'+(isEn?'📆 &nbsp; Your plan this week — give it your best! 💪':'📆 &nbsp; Το πλάνο σου αυτή την εβδομάδα — δώσε τα δυνατά σου! 💪')+'</div>'
      // ── ADULT HEADER ──
      :'<div class="hdr">'
       +'<div class="hl">'+(logoSrc?'<img src="'+logoSrc+'" alt="fyh">':'')+'<div class="hlurl">WWW.FEEDYOURHEALTH.ORG</div></div>'
       +'<div class="hr">'
       +'<div class="hrname">'+esc(c.name||(isEn?'Client':'Πελάτης'))+'</div>'
       +'<div class="hrinfo">'+esc((isEn?(c.sex==='M'?'Male':'Female'):(c.sex==='M'?'Άνδρας':'Γυναίκα'))+', '+c.age+(isEn?' yrs old':' ετών')+'  |  '+c.weight+'kg / '+c.height+'cm  |  '+(goalL[c.goalMain]||''))+'</div>'
       +'<div style="margin-top:3px;"><span style="background:#E8F5F4;border-radius:20px;padding:2px 10px;font-size:7pt;font-weight:700;color:#025857;">🎯 '+(isEn?'Goal: ':'Στόχος: ')+avgTarget+' kcal '+(isEn?'(avg)':'(μέσο)')+'  ·  '+(isEn?'P':'Π')+':'+t.p+(isEn?'g':'γρ.')+'  '+(isEn?'F':'Λ')+':'+t.f+(isEn?'g':'γρ.')+'  '+(isEn?'C':'Υ')+':'+t.carb+(isEn?'g':'γρ.')+'</span></div>'
       +(function(){
         var defDelta={mild:-250,loss:-500,maintain:0,gain:300};
         var delta=defDelta[c.goal]||0;
         if(delta===0)return'';
         var kgPerWeek=+(Math.abs(delta)*7/7700).toFixed(2);
         var lbl=delta<0?(isEn?'Caloric deficit: ':'Θερμιδικό έλλειμμα: '):(isEn?'Caloric surplus: ':'Θερμιδικό πλεόνασμα: ');
         var result=delta<0?(isEn?'≈ weight loss ~'+kgPerWeek+'kg/week':'≈ απώλεια ~'+kgPerWeek+'kg/εβδ.'):(isEn?'≈ muscle gain phase':'≈ φάση αύξησης μάζας');
         return'<div class="hrdef">'+lbl+'<b>'+(delta<0?'':'+')+(isEn?delta+' kcal/day':delta+' kcal/ημ.')+'</b>  '+result+'</div>';
       })()
       +'<div class="hrhyd">'+esc(hydStr)+'  ('+numTDays+(isEn?' training days':' ημ. προπ.')+')</div>'
       +'</div></div>'
       // Color legend
       +'<div class="legend">'
       +'<div class="leg-item"><div class="leg-dot" style="background:#FF9800"></div>'+(isEn?'Breakfast':'Πρωινό')+'</div>'
       +'<div class="leg-item"><div class="leg-dot" style="background:#43A047"></div>'+(isEn?'Lunch':'Μεσημεριανό')+'</div>'
       +'<div class="leg-item"><div class="leg-dot" style="background:#1E88E5"></div>'+(isEn?'Dinner':'Βραδινό')+'</div>'
       +'<div class="leg-item"><div class="leg-dot" style="background:#F9A825"></div>'+(isEn?'Snack':'Σνακ')+'</div>'
       +'</div>'
    )
    +'<table class="mt"><thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table>'
    +choPdfHtml
    +selectedSuppHtml
    +suppHtml
    +hydrationHtml
    +'<div class="shop-page">'+fxHtml+spicesHtml+(shopHtml?'</div><div class="shop-page">'+shopHtml:'')
    +'<div class="footer">'
    +(isMinorPdf
      ?'<span class="footer-msg">'+(isEn?'🌟 Keep it up — every meal brings you closer to your goal!':'🌟 Συνέχισε έτσι — κάθε γεύμα σε φέρνει πιο κοντά στον στόχο σου!')+'</span><span style="color:var(--text-muted)">Feed Your Health © 2025</span>'
      :(isEn?'Abbreviations: g = grams &nbsp; cup = 240-250 ml &nbsp; tbsp = tablespoon (10-14g) &nbsp; tsp = teaspoon (5-7g)':'Συντομογραφίες: γρ. = γραμμάρια &nbsp; φλ. = φλυτζάνι (240-250 ml) &nbsp; Κ = κουτάλι της σούπας (10-14 gr) &nbsp; κ/κι = κουταλάκι (5-7 gr)'))
    +'</div></div>'
    // Kids: bottom rainbow band
    +(isMinorPdf?'<div style="height:7px;background:linear-gradient(90deg,#9B5DE5,#118AB2,#06D6A0,#FFD166,#FF6B35);margin:0 -12mm -12mm;"></div>':'')
    +'</body></html>';

  var w=window.open('','_blank');
  if(!w){showErrorToast(isEn?'Please allow pop-ups for this page to export PDF.':'Επέτρεψε τα pop-ups για αυτή τη σελίδα για να εξαχθεί PDF.');return;}
  w.document.write(html);
  w.document.close();
  setTimeout(function(){w.print();},800);
}

/* ---- RTF export (landscape table, fixed Greek encoding) ---- */
function escRtf(s){
  if(!s)return'';
  var o='';
  for(var i=0;i<s.length;i++){
    var code=s.charCodeAt(i);
    if(s[i]==='\\')o+='\\\\';
    else if(s[i]==='{')o+='\\{';
    else if(s[i]==='}')o+='\\}';
    else if(code>127)o+='\\uc0\\u'+code+' ';
    else o+=s[i];
  }
  return o;
}

/* ── Έντυπο Λιπομέτρησης PDF ─────────────────────────────────────────────── */
function exportLipometriaPDF(){
  var c=getC();if(!c)return;
  var isEn=(c.lang==='en'); // client-facing report — auto-translate when client's plan language is English, so they can read their own body-comp report
  function T(el,en){return isEn?en:el;}
  function blank(label,w){return '<div class="field" style="width:'+(w||'auto')+'"><div class="flbl">'+label+'</div><div class="fval"></div></div>';}
  function filled(label,val,w,col){return '<div class="field" style="width:'+(w||'auto')+'"><div class="flbl">'+label+'</div><div class="fval" style="'+(col?'color:'+col+';font-weight:700':'')+'">'+esc(val)+'</div></div>';}
  function pct(v,min,max){return Math.max(0,Math.min(100,(v-min)/(max-min)*100));}
  function gradientCSS(boundaries,max){
    var stops=[];
    for(var i=0;i<boundaries.length;i++){
      var startPct=pct(boundaries[i].v,boundaries[0].v,max);
      stops.push(boundaries[i].col+' '+startPct.toFixed(0)+'%');
      if(i<boundaries.length-1){var endPct=pct(boundaries[i+1].v,boundaries[0].v,max);stops.push(boundaries[i].col+' '+endPct.toFixed(0)+'%');}
    }
    return 'linear-gradient(90deg,'+stops.join(',')+')';
  }
  function deltaSpan(delta,decimals,unit,goodDir){
    if(delta==null||isNaN(delta))return '';
    var eps=decimals===0?0.5:(decimals===2?0.005:0.05);
    var flat=Math.abs(delta)<eps;
    var improving=goodDir==='down'?delta<0:delta>0;
    var col=flat?'#8a9490':(improving?'#2e7d32':'#c62828');
    var arrow=flat?'—':(delta>0?'▲':'▼');
    return ' <span style="color:'+col+';font-weight:700">'+arrow+Math.abs(delta).toFixed(decimals)+(unit||'')+'</span>';
  }
  function rangeBar(label,valTxt,valCol,catTxt,deltaHtmlStr,boundaries,max,curVal,goalVal){
    // boundaries=null → plain number row, no adult reference bands (used for minors, where the
    // adult category/color bands would still visually characterize them even without the text label)
    if(!boundaries){
      return '<div style="margin-bottom:11px">'
        +'<div style="display:flex;justify-content:space-between;font-size:7.5pt;color:#5b6b67"><span>'+label+'</span><b style="color:'+valCol+'">'+valTxt+(deltaHtmlStr||'')+'</b></div>'
        +'</div>';
    }
    var curPct=curVal!=null?pct(curVal,boundaries[0].v,max):null;
    var goalPct=goalVal!=null?pct(goalVal,boundaries[0].v,max):null;
    return '<div style="margin-bottom:11px">'
      +'<div style="display:flex;justify-content:space-between;font-size:7.5pt;color:#5b6b67;margin-bottom:3px"><span>'+label+'</span><b style="color:'+valCol+'">'+valTxt+(deltaHtmlStr||'')+(catTxt?' · '+catTxt:'')+'</b></div>'
      +'<div style="height:7px;border-radius:4px;background:'+gradientCSS(boundaries,max)+';position:relative">'
      +(curPct!=null?'<div style="position:absolute;left:'+curPct.toFixed(1)+'%;top:-3px;width:2px;height:13px;background:#111"></div>':'')
      +(goalPct!=null?'<div style="position:absolute;left:'+goalPct.toFixed(1)+'%;top:-9px;width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:6px solid #025857"></div>':'')
      +'</div></div>';
  }
  function sparkline(vals,color){
    var v=vals.filter(function(x){return x!=null;});
    if(v.length<2)return '<div style="font-size:7.5pt;color:var(--text-muted);padding:16px 0;text-align:center">'+T('Ανεπαρκή δεδομένα','Insufficient data')+'</div>';
    var min=Math.min.apply(null,v),max=Math.max.apply(null,v),range=(max-min)||1,n=v.length;
    var pts=v.map(function(x,i){return (5+i/(n-1)*90).toFixed(1)+','+(5+(1-(x-min)/range)*40).toFixed(1);}).join(' ');
    return '<svg viewBox="0 0 100 50" width="100%" height="42"><polyline points="'+pts+'" fill="none" stroke="'+color+'" stroke-width="2"/></svg>';
  }

  // Use latest tracker entry if available, else use client profile
  var entry=null,sorted=null,prevEntry=null;
  if(c.weightLog&&c.weightLog.length){
    sorted=c.weightLog.slice().sort(function(a,b){return a.date<b.date?-1:1;});
    entry=sorted[sorted.length-1];
    prevEntry=sorted.length>1?sorted[sorted.length-2]:null;
  }
  var today=new Date().toISOString().slice(0,10);
  var entryDate=entry?entry.date:today;
  var weight=entry?entry.weight:(c.weight||null);
  var bf=entry&&entry.bf>0?entry.bf:(c.bf>0?c.bf:null);
  var lbm=(bf&&weight)?+(weight*(1-bf/100)).toFixed(1):null;
  var fm=(bf&&weight)?+(weight*bf/100).toFixed(1):null;
  var h=c.height||0;
  var bmi=(h>0&&weight)?+(weight/((h/100)*(h/100))).toFixed(1):null;
  var isMinor=(c.age!=null && c.age>0 && c.age<18); // adult WHO BMI cutoffs (18.5/25/30) don't clinically apply to minors — number only, no category
  var bmiCat=(bmi&&!isMinor)?bmi<18.5?T('Ελλιποβαρές','Underweight'):bmi<25?T('Φυσιολογικό','Normal'):bmi<30?T('Υπέρβαρο','Overweight'):bmi<35?T('Παχυσαρκία Ι','Obesity I'):bmi<40?T('Παχυσαρκία ΙΙ','Obesity II'):T('Παχυσαρκία ΙΙΙ','Obesity III'):'—';
  var bmiCol=(bmi&&!isMinor)?bmi<18.5?'#1565C0':bmi<25?'#2e7d32':bmi<30?'#f57c00':'#c62828':'#555';
  var isFem=(c.sex||'M')==='F';
  var waist=entry&&entry.waist?entry.waist:null;
  var hip=entry&&entry.hip?entry.hip:null;
  var whr=waist&&hip?+(waist/hip).toFixed(2):null;
  var whtr=(waist&&h>0)?+(waist/h).toFixed(2):null;
  var whtrCatLabel=whtr!=null?(whtr<0.5?T('Φυσιολογικό','Normal'):whtr<0.6?T('Αυξημένος κίνδυνος','Increased risk'):T('Υψηλός κίνδυνος','High risk')):'—';
  var whtrCatCol=whtr!=null?(whtr<0.5?'#2e7d32':whtr<0.6?'#f57c00':'#c62828'):'#555';
  var bmr=(h>0&&weight&&c.age)?Math.round(10*weight+6.25*h-5*c.age+(isFem?-161:5)):null;

  // Skinfold raw data from latest entry
  var sfProto=entry&&entry.sfProtocol?entry.sfProtocol:null;
  var sfFields=entry&&entry.sfFields?entry.sfFields:{};
  var sfKeys=Object.keys(sfFields);
  var sfSum=sfKeys.length?Object.values(sfFields).reduce(function(s,v){return s+v;},0):null;
  var sfProtoLabel={jp4:'Jackson & Pollock 4-site (1985)',jp3:'Jackson & Pollock 3-site',jp7:'Jackson & Pollock 7-site',slaughter:'Slaughter (1988)'};
  var sfNames=isEn?{tricep:'Triceps',subscapular:'Subscapular',abdomen:'Abdomen',suprailiac:'Suprailiac',thigh:'Thigh',chest:'Chest',midaxillary:'Midaxillary',calf:'Calf'}:{tricep:'Τρικέφαλος',subscapular:'Υποπλάτιο',abdomen:'Κοιλιά',suprailiac:'Υπερλαγόνιο',thigh:'Μηρός',chest:'Στήθος',midaxillary:'Μεσομάσχαλο',calf:'Γαστροκνήμιος'};
  var isJp4Layout=!sfProto||sfProto==='jp4';
  var prevSfSum=null;
  if(prevEntry&&prevEntry.sfFields){var pv=Object.values(prevEntry.sfFields);if(pv.length)prevSfSum=pv.reduce(function(s,v){return s+v;},0);}
  var sfSumDelta=(sfSum!=null&&prevSfSum!=null)?Math.round(sfSum-prevSfSum):null;

  // %BF reference bands — shared model from js/lib/bf-norms.js (BF_BANDS); the
  // language-neutral keys get this exporter's own T() labels here.
  var BF_LBL={essential:T('Απαραίτητο','Essential'),athletic:T('Αθλητικό','Athletic'),fitness:T('Φυσιολογικό','Fitness'),acceptable:T('Αποδεκτό','Acceptable'),obesity:T('Παχυσαρκία','Obesity')};
  var bfRefs=BF_BANDS(isFem?'F':'M').map(function(b){return{lo:b.lo,hi:b.hi,col:b.col,lbl:BF_LBL[b.key]};});
  var bfCatLabel='—',bfCatCol='#555';
  if(bf){bfRefs.forEach(function(r){if(bf>=r.lo){bfCatLabel=r.lbl;bfCatCol=r.col;}});}
  var bfGoal=bfGoalTarget(c); // c.goalBF when the dietitian set one, else top of "Fitness"
  // ✅ age-adjusted verdict (Gallagher 2000) when the client's age is known — overrides the
  // non-age-adjusted ACE category for the label/colour and the range-bar zones below.
  var GBF_LBL={low:T('Κάτω από το υγιές','Below healthy'),healthy:T('Υγιές','Healthy'),overfat:T('Υπέρβαρο','Overweight'),obese:T('Παχυσαρκία','Obesity')};
  var bfGv=(bf&&typeof bfHealthByAge==='function')?bfHealthByAge(bf,isFem?'F':'M',c.age):null;
  var bfSrcLbl=bfGv?T('υγιή εύρη κατά ηλικία & φύλο (Gallagher 2000)','age & sex healthy ranges (Gallagher 2000)'):T('κατηγορίες ACE/ACSM','ACE/ACSM categories');
  if(bfGv){ bfCatLabel=GBF_LBL[bfGv.key]+' ('+bfGv.ageBand+')'; bfCatCol=bfGv.col; }
  var bfBoundaries=(bfGv&&typeof bfHealthBoundaries==='function')?bfHealthBoundaries(bfGv)
    :[{v:isFem?5:0,col:bfRefs[0].col},{v:bfRefs[1].lo,col:bfRefs[1].col},{v:bfRefs[2].lo,col:bfRefs[2].col},{v:bfRefs[3].lo,col:bfRefs[3].col},{v:bfRefs[4].lo,col:bfRefs[4].col}];

  // Deltas vs previous tracker entry
  var wDelta=(prevEntry&&prevEntry.weight!=null&&weight!=null)?+(weight-prevEntry.weight).toFixed(1):null;
  var prevBf=prevEntry&&prevEntry.bf>0?prevEntry.bf:null;
  var bfDelta=(bf&&prevBf)?+(bf-prevBf).toFixed(1):null;
  var prevLbm=(prevEntry&&prevBf&&prevEntry.weight)?+(prevEntry.weight*(1-prevBf/100)).toFixed(1):null;
  var lbmDelta=(lbm&&prevLbm)?+(lbm-prevLbm).toFixed(1):null;
  var bmiDelta=null;
  if(prevEntry&&prevEntry.weight&&h>0&&bmi){bmiDelta=+(bmi-(prevEntry.weight/((h/100)*(h/100)))).toFixed(1);}
  var waistDelta=(waist&&prevEntry&&prevEntry.waist)?+(waist-prevEntry.waist).toFixed(1):null;
  var whtrDelta=null;
  if(whtr!=null&&prevEntry&&prevEntry.waist&&h>0){whtrDelta=+(whtr-(prevEntry.waist/h)).toFixed(2);}

  // Auto-generated suggestion (no arbitrary score — grounded in ACSM category + trend)
  function buildSuggestion(){
    if(!bf)return T('Συμπλήρωσε δερματοπτυχές σε τουλάχιστον μία μέτρηση για αυτόματη πρόταση.','Add skinfold measurements to at least one entry for an automatic suggestion.');
    var parts=[];
    if(bfDelta!=null){
      if(bfDelta<0)parts.push(T('Καλή πορεία — το % λίπους μειώθηκε κατά '+Math.abs(bfDelta).toFixed(1)+'% από την προηγούμενη μέτρηση.','Good progress — body fat % decreased by '+Math.abs(bfDelta).toFixed(1)+'% since the previous measurement.'));
      else if(bfDelta>0)parts.push(T('Το % λίπους αυξήθηκε κατά '+bfDelta.toFixed(1)+'% από την προηγούμενη μέτρηση — αξίζει επανεξέταση προσλαμβανόμενων θερμίδων.','Body fat % increased by '+bfDelta.toFixed(1)+'% since the previous measurement — worth reviewing calorie intake.'));
      else parts.push(T('Το % λίπους παρέμεινε σταθερό από την προηγούμενη μέτρηση.','Body fat % stayed stable since the previous measurement.'));
    }
    if(bf>bfGoal){
      var fmGoalKg=+(weight*(bf-bfGoal)/100).toFixed(1);
      parts.push(T('Στόχος: %BF εντός φυσιολογικού εύρους (~'+fmGoalKg+'kg λιπώδης μάζα ακόμα).','Goal: %BF within the normal range (~'+fmGoalKg+'kg fat mass to go).'));
    } else {
      parts.push(T('Το %BF είναι ήδη εντός φυσιολογικού εύρους — στόχος διατήρηση.','%BF is already within the normal range — the goal is maintenance.'));
    }
    parts.push(T('Διατήρησε πρωτεϊνική πρόσληψη ~1.6g/kg σωματικού βάρους για προστασία της άλιπης μάζας.','Maintain protein intake at ~1.6g/kg body weight to protect lean mass.'));
    return parts.join(' ');
  }

  // Logo
  var logoSrc='';
  try{var lc=document.createElement('canvas');lc.width=80;lc.height=80;var lx=lc.getContext('2d');lx.fillStyle='#025857';lx.fillRect(0,0,80,80);lx.fillStyle='#fff';lx.font='bold 34px Georgia,serif';lx.textAlign='center';lx.textBaseline='middle';lx.fillText('fyh',40,40);logoSrc=lc.toDataURL('image/png');}catch(e){}

  // Body outline (shared path for the skinfold-site diagram)
  var BODY_PATH='M 129.9,45.4 Q 135,43 140.1,45.4 L 153.9,51.6 Q 159,54 160.1,61.6 L 163.8,79.4 Q 165,86 164.1,92.8 L 161.8,109.2 Q 161,116 160.1,117.6 L 157.8,121.4 Q 157,123 155.4,121.8 L 151.6,118.2 Q 150,117 149.8,110.8 L 149.2,93.2 Q 149,86 148.3,80.6 L 146.3,65.4 Q 145.6,60 144.4,71.7 L 141.2,98.3 Q 140,109 141.8,112.6 L 146.5,121.4 Q 148.5,125 148,134 L 146.8,157 Q 146.3,166 145.3,172.4 L 142.9,189 Q 142,195.5 141.5,202.2 L 140.3,219.6 Q 140,226 141.4,227.4 L 145,231 Q 146.5,232.4 144.3,231.3 L 138.9,228.5 Q 136.7,227.4 136,220.1 L 134.2,202 Q 133.7,195 133.4,180.6 L 132.8,144.4 Q 132.6,130 133,129.1 L 134.2,126.7 Q 134.7,125.8 135.2,126.7 L 136.4,129.1 Q 136.8,130 136.6,144.4 L 136,180.6 Q 135.7,195 135,202 L 133.2,220.1 Q 132.5,227.4 130.2,228.5 L 124.8,231.3 Q 122.6,232.4 124.1,231 L 127.7,227.4 Q 129.1,226 128.8,219.6 L 127.6,202.2 Q 127.1,195.5 126.2,189 L 123.8,172.4 Q 122.8,166 122.3,157 L 121.1,134 Q 120.6,125 122.6,121.4 L 127.3,112.6 Q 129.1,109 127.9,98.3 L 124.7,71.7 Q 123.5,60 122.8,65.4 L 120.8,80.6 Q 120.1,86 119.9,93.2 L 119.3,110.8 Q 119.1,117 117.5,118.2 L 113.7,121.8 Q 112.1,123 111.3,121.4 L 109,117.6 Q 108.1,116 107.3,109.2 L 105,92.8 Q 104.1,86 105.3,79.4 L 109,61.6 Q 110.1,54 115.2,51.6 L 129.9,45.4 Z';
  var siteMeta={
    tricep:{x:150,y:90,lx:215,ly:70,anchor:'start',label:T('Τρικέφαλος','Triceps')},
    suprailiac:{x:120,y:87,lx:30,ly:65,anchor:'start',label:T('Υπερλαγόνιο','Suprailiac')},
    abdomen:{x:137,y:135,lx:215,ly:150,anchor:'start',label:T('Κοιλιά','Abdomen')},
    thigh:{x:127,y:165,lx:30,ly:180,anchor:'start',label:T('Μηρός','Thigh')}
  };
  function skinfoldDiagram(){
    var svg='<svg viewBox="0 0 260 300" width="230" height="265">'
      +'<path d="'+BODY_PATH+'" fill="#eef4f3" stroke="#025857" stroke-width="1.6" stroke-linejoin="round"/>'
      +'<circle cx="135" cy="27" r="17" fill="#eef4f3" stroke="#025857" stroke-width="1.6"/>';
    Object.keys(siteMeta).forEach(function(k){
      var m=siteMeta[k];var v=sfFields[k];
      svg+='<circle cx="'+m.x+'" cy="'+m.y+'" r="3" fill="'+(v!=null?'#c62828':'#ccc')+'"/>'
        +'<line x1="'+m.x+'" y1="'+m.y+'" x2="'+m.lx+'" y2="'+m.ly+'" stroke="#c5ddd8" stroke-width="1"/>'
        +'<text x="'+m.lx+'" y="'+(m.ly-4)+'" font-size="9" fill="#5b6b67">'+m.label+'</text>'
        +'<text x="'+m.lx+'" y="'+(m.ly+8)+'" font-size="10" font-weight="700" fill="'+(v!=null?'#025857':'#ccc')+'">'+(v!=null?v+' mm':'___ mm')+'</text>';
    });
    svg+='</svg>';
    return svg;
  }

  var html='<!DOCTYPE html><html lang="'+(isEn?'en':'el')+'"><head><meta charset="UTF-8"><title>'+T('Έντυπο Λιπομέτρησης','Body Composition Report')+'</title><style>'
    +'*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:8.5pt;color:#111;background:var(--card-bg);padding:8mm 10mm}'
    +'.hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #025857;padding-bottom:6px;margin-bottom:12px}'
    +'.brand{display:flex;align-items:center;gap:8px}.brand img{width:38px;height:38px;border-radius:6px}'
    +'.brand-name{font-size:11pt;font-weight:700;color:#025857;letter-spacing:.5px}'
    +'.brand-sub{font-size:7.5pt;color:#8a9490;margin-top:1px}'
    +'.doc-date{text-align:right;font-size:7.5pt;color:#8a9490}'
    +'.card{border:1px solid #e3ece9;border-radius:8px;padding:10px 12px;margin-bottom:11px}'
    +'.card-lbl{font-size:7.5pt;font-weight:700;color:#025857;text-transform:uppercase;letter-spacing:.3px;margin-bottom:8px}'
    +'.grid2{display:grid;grid-template-columns:1fr 1fr;gap:11px}'
    +'.field{display:flex;flex-direction:column;min-width:60px}'
    +'.flbl{font-size:6.5pt;color:#888;text-transform:uppercase;letter-spacing:.3px;margin-bottom:1px}'
    +'.fval{font-size:9pt;font-weight:600;color:#111;border-bottom:1px solid #ccc;min-width:60px;padding-bottom:1px;min-height:15px}'
    +'.notes-line{border-bottom:1px solid #ddd;margin-bottom:8px;height:16px}'
    +'.footer{margin-top:6px;padding-top:4px;border-top:1px solid #c5ddd8;font-size:6.5pt;color:#888}'
    +'.footer-row{display:flex;justify-content:space-between}'
    +'@media print{.no-print{display:none}body{color-adjust:exact;-webkit-print-color-adjust:exact;print-color-adjust:exact}*{color-adjust:exact;-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
    +'</style></head><body>'
    +'<div class="no-print" style="margin-bottom:8px;display:flex;gap:8px;align-items:center">'
    +'<button onclick="window.print()" style="padding:6px 18px;background:#025857;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700">🖨️ '+T('Εκτύπωση / PDF','Print / PDF')+'</button>'
    +'<span style="font-size:11px;color:#666">'+T('Portrait · Χωρίς κεφαλίδες/υποσέλιδα','Portrait · No headers/footers')+'</span></div>'
    // Header
    +'<div class="hdr">'
    +'<div class="brand">'+(logoSrc?'<img src="'+logoSrc+'" alt="FYH">':'')+'<div><div class="brand-name">'+T('ΑΝΑΛΥΣΗ ΣΩΜΑΤΙΚΗΣ ΣΥΝΘΕΣΗΣ','BODY COMPOSITION ANALYSIS')+'</div><div class="brand-sub">'+esc(c.name||'')+' · '+T(isFem?'Γυναίκα':'Άνδρας',isFem?'Female':'Male')+(c.age?' · '+c.age+T(' ετών',' years old'):'')+(h?' · '+h+' cm':'')+'</div></div></div>'
    +'<div class="doc-date">'+(entry
      ?(T('Ημερομηνία μέτρησης','Measurement date')+(prevEntry?T(' · προηγούμενη',' · previous'):'')+'<br><b style="color:#3d4d49;font-size:9pt">'+esc(entryDate)+'</b>'+(prevEntry?' <span style="color:#b3bab8">(vs '+esc(prevEntry.date)+')</span>':''))
      :('<b style="color:#b26a00;font-size:8.5pt">⚠ '+T('Στοιχεία προφίλ — καμία μέτρηση tracker','Profile data — no tracker measurement')+'</b>'))
    +'</div>'
    +'</div>'

    // Donut + Overall analysis
    +'<div class="grid2">'
    +'<div class="card" style="text-align:center">'
    +'<div class="card-lbl">'+T('Σύσταση βάρους (kg)','Body composition (kg)')+'</div>'
    +(weight&&lbm&&fm?(
      '<svg viewBox="0 0 140 140" width="120" height="120" style="margin:0 auto;display:block">'
      +'<circle cx="70" cy="70" r="52" fill="none" stroke="#eef4f3" stroke-width="16"/>'
      +'<circle cx="70" cy="70" r="52" fill="none" stroke="#1565C0" stroke-width="16" stroke-dasharray="'+(326.7*lbm/weight).toFixed(1)+' 326.7" transform="rotate(-90 70 70)"/>'
      +'<circle cx="70" cy="70" r="52" fill="none" stroke="#e65100" stroke-width="16" stroke-dasharray="'+(326.7*fm/weight).toFixed(1)+' 326.7" stroke-dashoffset="-'+(326.7*lbm/weight).toFixed(1)+'" transform="rotate(-90 70 70)"/>'
      +'<text x="70" y="63" text-anchor="middle" font-size="18" font-weight="700" fill="#3d4d49">'+weight+'</text>'
      +'<text x="70" y="77" text-anchor="middle" font-size="7" fill="#8a9490">'+T('kg ΣΥΝΟΛΟ','kg TOTAL')+'</text>'
      +(wDelta!=null?'<text x="70" y="90" text-anchor="middle" font-size="7.5" font-weight="700" fill="'+(wDelta<0?'#2e7d32':wDelta>0?'#c62828':'#8a9490')+'">'+(wDelta<0?'▼':wDelta>0?'▲':'—')+Math.abs(wDelta).toFixed(1)+'kg</text>':'')
      +'</svg>'
      +'<div style="display:flex;justify-content:center;gap:12px;margin-top:4px;font-size:8pt">'
      +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#1565C0;margin-right:3px"></span>'+T('Άλιπη ','Lean ')+lbm+'kg</span>'
      +'<span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#e65100;margin-right:3px"></span>'+T('Λίπος ','Fat ')+fm+'kg</span>'
      +'</div>'
    ):'<div style="padding:40px 0;color:var(--text-muted);font-size:8pt">'+T('Συμπλήρωσε βάρος και δερματοπτυχές','Enter weight and skinfolds')+'</div>')
    +'</div>'

    +'<div class="card">'
    +'<div class="card-lbl">'+T('Συνολική ανάλυση','Overall analysis')+' <span style="font-weight:400;color:#b3bab8;text-transform:none">· ◆ '+T('στόχος','goal')+'</span></div>'
    +rangeBar(T('ΔΜΣ','BMI'),bmi?String(bmi):'—',bmiCol,(bmi&&!isMinor)?bmiCat:null,deltaSpan(bmiDelta,1,'','down'),isMinor?null:[{v:15,col:'#1565C0'},{v:18.5,col:'#2e7d32'},{v:25,col:'#f57c00'},{v:30,col:'#c62828'}],40,bmi,24.9)
    +rangeBar(T('% Λίπους','% Body fat'),bf?bf+'%':'—',bfCatCol,bf?bfCatLabel:null,deltaSpan(bfDelta,1,'','down'),bfBoundaries,isFem?45:35,bf,bfGoal)
    +(whtr!=null?rangeBar('WHtR',String(whtr),whtrCatCol,whtrCatLabel,deltaSpan(whtrDelta,2,'','down'),[{v:0.35,col:'#2e7d32'},{v:0.5,col:'#f57c00'},{v:0.6,col:'#c62828'}],0.75,whtr,0.5):'')
    +'</div>'
    +'</div>'

    // Suggestion
    +'<div class="card" style="border-color:#f0dcb8;background:#fffaf0">'
    +'<div class="card-lbl" style="color:#8a5a00">'+T('Πρόταση','Suggestion')+'</div>'
    +'<div style="font-size:8.5pt;color:#3d4d49;line-height:1.5">'+esc(buildSuggestion())+'</div>'
    +'</div>'

    // Skinfold sites
    +'<div class="card">'
    +'<div class="card-lbl">'+T('Σημεία δερματοπτυχών','Skinfold sites')+' — '+esc(isJp4Layout?sfProtoLabel.jp4:(sfProtoLabel[sfProto]||sfProto))+'</div>'
    +(isJp4Layout?
      '<div style="display:flex;justify-content:center">'+skinfoldDiagram()+'</div>'
      +'<div style="text-align:center;font-size:7.5pt;color:#8a9490;margin-top:2px">'+T('Σύνολο δερματοπτυχών','Skinfold sum')+': '+(sfSum!=null?Math.round(sfSum)+' mm':'—')+(sfSumDelta!=null?deltaSpan(sfSumDelta,0,'mm','down'):'')+'</div>'
    :
      '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px 16px">'
      +sfKeys.map(function(k,i){return '<div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:2px 0"><span style="font-size:7.5pt;color:#444">'+(i+1)+'. '+(sfNames[k]||k)+'</span><span style="font-size:8.5pt;font-weight:700;color:#025857">'+sfFields[k]+' mm</span></div>';}).join('')
      +'<div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:2px 0"><span style="font-size:7.5pt;font-weight:700">'+T('Σύνολο','Total')+'</span><span style="font-size:8.5pt;font-weight:700">'+(sfSum!=null?Math.round(sfSum)+' mm':'—')+'</span></div>'
      +'</div>'
    )
    +'</div>'

    // History
    +'<div class="card">'
    +'<div class="card-lbl">'+T('Ιστορικό','History')+'</div>'
    +(sorted&&sorted.length>1?(function(){
      var hist=sorted.slice(-8);
      var hw=hist.map(function(e){return e.weight;});
      var hb=hist.map(function(e){return e.bf>0?e.bf:null;});
      var hl=hist.map(function(e){return e.bf>0?+(e.weight*(1-e.bf/100)).toFixed(1):null;});
      return '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">'
        +'<div style="text-align:center">'+sparkline(hw,'#1565C0')+'<div style="font-size:7pt;color:#8a9490">'+T('Βάρος','Weight')+'</div><div style="font-size:9pt;font-weight:700;color:#1565C0">'+(weight||'—')+' kg'+deltaSpan(wDelta,1,'','down')+'</div></div>'
        +'<div style="text-align:center">'+sparkline(hb,'#c62828')+'<div style="font-size:7pt;color:#8a9490">'+T('% Λίπους','% Body fat')+'</div><div style="font-size:9pt;font-weight:700;color:#c62828">'+(bf?bf+'%':'—')+deltaSpan(bfDelta,1,'','down')+'</div></div>'
        +'<div style="text-align:center">'+sparkline(hl,'#2e7d32')+'<div style="font-size:7pt;color:#8a9490">'+T('Άλιπη μάζα','Lean mass')+'</div><div style="font-size:9pt;font-weight:700;color:#2e7d32">'+(lbm||'—')+' kg'+deltaSpan(lbmDelta,1,'','up')+'</div></div>'
        +'</div>';
    })():'<div style="font-size:8pt;color:var(--text-muted);text-align:center;padding:10px 0">'+T('Χρειάζονται τουλάχιστον 2 καταχωρήσεις tracker','At least 2 tracker entries needed')+'</div>')
    +'</div>'

    // Other indicators + comments
    +'<div class="grid2">'
    +'<div class="card">'
    +'<div class="card-lbl">'+T('Λοιποί δείκτες','Other indicators')+'</div>'
    +'<table style="width:100%;font-size:8pt;border-collapse:collapse">'
    +(waist?'<tr><td style="padding:3px 0;color:#5b6b67">'+T('Μέση','Waist')+'</td><td style="text-align:right;font-weight:700">'+waist+' cm'+deltaSpan(waistDelta,1,'','down')+'</td></tr>':'')
    +(hip?'<tr><td style="padding:3px 0;color:#5b6b67">'+T('Γοφοί','Hips')+'</td><td style="text-align:right;font-weight:700">'+hip+' cm</td></tr>':'')
    +(whr!=null?'<tr><td style="padding:3px 0;color:#5b6b67">WHR</td><td style="text-align:right;font-weight:700">'+whr+'</td></tr>':'')
    +'<tr><td style="padding:3px 0;color:#5b6b67">'+T('Βασικός μεταβολισμός (BMR)*','Basal metabolic rate (BMR)*')+'</td><td style="text-align:right;font-weight:700">'+(bmr?bmr+' kcal':'—')+'</td></tr>'
    +'</table>'
    +'<div style="font-size:6.5pt;color:#b3bab8;margin-top:5px">'+T('*εκτίμηση Mifflin-St Jeor, όχι μέτρηση BIA','*Mifflin-St Jeor estimate, not a BIA measurement')+'</div>'
    +'</div>'
    +'<div class="card">'
    +'<div class="card-lbl">'+T('Σχόλια','Comments')+'</div>'
    +'<div class="notes-line"></div><div class="notes-line"></div><div class="notes-line"></div>'
    +'</div>'
    +'</div>'

    // Footer
    +'<div class="footer">'
    +'<div class="footer-row"><span>Feed Your Health &mdash; '+T('Ανάλυση Σωματικής Σύνθεσης','Body Composition Analysis')+' &nbsp;|&nbsp; '+bfSrcLbl+'</span><span>'+T('Επόμενο ραντεβού','Next appointment')+': ________________</span></div>'
    +'<div style="margin-top:2px;color:#b3bab8">'+T('Οι τάσεις (▲▼) συγκρίνουν με την προηγούμενη καταχώρηση tracker. Χωρίς ζυγαριά βιοηλεκτρικής εμπέδησης (BIA) — δεν εμφανίζονται νερό/πρωτεΐνη/οστά/σπλαχνικό λίπος.','Trends (▲▼) compare against the previous tracker entry. No bioelectrical impedance (BIA) scale — water/protein/bone/visceral fat are not shown.')+'</div>'
    +'<div style="margin-top:2px;color:#b3bab8">'+T('ΔΜΣ = Δείκτης Μάζας Σώματος (kg/m²) · WHtR = Λόγος Περιμέτρου Μέσης προς Ύψος. Οι κατηγορίες %BF είναι στατιστικά όρια αναφοράς, όχι ιατρική διάγνωση.','BMI = Body Mass Index (kg/m²) · WHtR = Waist-to-Height Ratio. %BF categories are statistical reference ranges, not a medical diagnosis.')+'</div>'
    +'</div></body></html>';

  var w=window.open('','_blank');
  if(!w){showErrorToast(T('Επέτρεψε τα pop-ups για να ανοίξει το PDF.','Allow pop-ups to open the PDF.'));return;}
  w.document.write(html);w.document.close();
  setTimeout(function(){w.print();},600);
}

/* ── Body Composition PDF ─────────────────────────────────────────────────── */
function exportBodyCompPDF(){
  var c=getC();if(!c)return;
  var isEn=(c.lang==='en'); // client-facing report — auto-translate when client's plan language is English, so they can read their own history PDF
  function T(el,en){return isEn?en:el;}
  if(!c.weightLog||!c.weightLog.length){showErrorToast(T('Δεν υπάρχουν εγγραφές tracker.','No tracker entries yet.'));return;}
  var sorted=c.weightLog.slice().sort(function(a,b){return a.date<b.date?-1:1;});
  var latest=sorted[sorted.length-1];
  var latestBF=latest.bf>0?latest.bf:null;
  var latestLBM=latestBF?+(latest.weight*(1-latestBF/100)).toFixed(1):null;
  var latestFM=latestBF?+(latest.weight*latestBF/100).toFixed(1):null;
  var today=new Date().toISOString().slice(0,10);
  var sex=c.sex||'M';
  var isFem=sex==='F';

  // %BF reference bands — shared model from js/lib/bf-norms.js (BF_BANDS).
  var BF_LBL={essential:T('Απαραίτητο','Essential'),athletic:T('Αθλητικό','Athletic'),fitness:T('Φυσιολογικό','Fitness'),acceptable:T('Αποδεκτό','Acceptable'),obesity:T('Παχυσαρκία','Obesity')};
  var bfRefs=BF_BANDS(isFem?'F':'M').map(function(b){return{lbl:BF_LBL[b.key],lo:b.lo,hi:b.hi,col:b.col};});
  // Find current category
  var bfCatLabel='—',bfCatCol='#555';
  if(latestBF){
    bfRefs.forEach(function(r){if(latestBF>=r.lo){bfCatLabel=r.lbl;bfCatCol=r.col;}});
  }
  // ✅ age-adjusted verdict (Gallagher 2000) when the client's age is known.
  var GBF_LBL={low:T('Κάτω από το υγιές','Below healthy'),healthy:T('Υγιές','Healthy'),overfat:T('Υπέρβαρο','Overweight'),obese:T('Παχυσαρκία','Obesity')};
  var bfGv=(latestBF&&typeof bfHealthByAge==='function')?bfHealthByAge(latestBF,sex,c.age):null;
  var bfSrcLbl=bfGv?T('υγιή εύρη κατά ηλικία & φύλο (Gallagher 2000)','age & sex healthy ranges (Gallagher 2000)'):T('κατηγορίες ACE/ACSM','ACE/ACSM categories');
  if(bfGv){ bfCatLabel=GBF_LBL[bfGv.key]+' ('+bfGv.ageBand+')'; bfCatCol=bfGv.col; }

  // ── SVG dual chart ─────────────────────────────────────────────────────────
  var weights=sorted.map(function(e){return e.weight;});
  var bfArr=sorted.map(function(e){return e.bf>0?e.bf:null;});
  var hasBF=bfArr.some(function(v){return v!==null;});
  var n=sorted.length;
  var minW=Math.min.apply(null,weights),maxW=Math.max.apply(null,weights),rangeW=maxW-minW||1;
  var W=560,H=130,pL=36,pR=hasBF?40:12,pT=16,pB=28;
  var cW=W-pL-pR,cH=H-pT-pB;
  function xp(i){return pL+i/(n>1?n-1:1)*cW;}
  function yw(w){return pT+cH-(w-minW)/rangeW*cH;}
  // X axis date labels
  var xLabels='';
  var step=n<=8?1:n<=16?2:Math.ceil(n/8);
  sorted.forEach(function(e,i){
    if(i%step===0||i===n-1){
      var lbl=e.date.slice(5);// MM-DD
      xLabels+='<text x="'+xp(i).toFixed(1)+'" y="'+(H-4)+'" fill="#888" font-size="7" font-family="sans-serif" text-anchor="middle">'+lbl+'</text>';
    }
  });
  // Weight axis + line
  var svgContent='<line x1="'+pL+'" y1="'+pT+'" x2="'+pL+'" y2="'+(pT+cH)+'" stroke="#025857" stroke-width="0.7"/>';
  svgContent+='<text x="'+(pL-3)+'" y="'+(pT+5)+'" fill="#025857" font-size="8" font-family="sans-serif" text-anchor="end">'+maxW+'kg</text>';
  svgContent+='<text x="'+(pL-3)+'" y="'+(pT+cH)+'" fill="#025857" font-size="8" font-family="sans-serif" text-anchor="end">'+minW+'kg</text>';
  var ptsW=sorted.map(function(e,i){return xp(i).toFixed(1)+','+yw(e.weight).toFixed(1);});
  svgContent+='<polyline points="'+ptsW.join(' ')+'" fill="none" stroke="#025857" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>';
  sorted.forEach(function(e,i){
    svgContent+='<circle cx="'+xp(i).toFixed(1)+'" cy="'+yw(e.weight).toFixed(1)+'" r="3" fill="#025857" stroke="#fff" stroke-width="1.5"/>';
  });
  // BF% axis + line
  if(hasBF){
    var bfVals=bfArr.filter(function(v){return v!==null;});
    var minBF=Math.min.apply(null,bfVals),maxBF=Math.max.apply(null,bfVals),rangeBF=maxBF-minBF||1;
    function yb(v){return pT+cH-(v-minBF)/rangeBF*cH;}
    svgContent+='<line x1="'+(W-pR)+'" y1="'+pT+'" x2="'+(W-pR)+'" y2="'+(pT+cH)+'" stroke="#1565C0" stroke-width="0.7"/>';
    svgContent+='<text x="'+(W-pR+3)+'" y="'+(pT+5)+'" fill="#1565C0" font-size="8" font-family="sans-serif">'+maxBF+'%</text>';
    svgContent+='<text x="'+(W-pR+3)+'" y="'+(pT+cH)+'" fill="#1565C0" font-size="8" font-family="sans-serif">'+minBF+'%</text>';
    var segs=[],seg=[];
    sorted.forEach(function(e,i){
      if(e.bf>0){seg.push(xp(i).toFixed(1)+','+yb(e.bf).toFixed(1));}
      else if(seg.length){segs.push(seg.slice());seg=[];}
    });
    if(seg.length)segs.push(seg);
    segs.forEach(function(s){
      if(s.length>1)svgContent+='<polyline points="'+s.join(' ')+'" fill="none" stroke="#1565C0" stroke-width="2" stroke-dasharray="5,3" stroke-linejoin="round"/>';
      if(s.length===1)svgContent+='<circle cx="'+s[0].split(',')[0]+'" cy="'+s[0].split(',')[1]+'" r="3" fill="#1565C0" stroke="#fff" stroke-width="1"/>';
    });
    sorted.forEach(function(e,i){
      if(e.bf>0)svgContent+='<circle cx="'+xp(i).toFixed(1)+'" cy="'+yb(e.bf).toFixed(1)+'" r="2.5" fill="#1565C0" stroke="#fff" stroke-width="1"/>';
    });
  }
  svgContent+=xLabels;
  var chartHtml='<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block;height:130px;border:1px solid var(--border-light);border-radius:6px;background:#fafffe">'+svgContent+'</svg>';

  // ── History table ────────────────────────────────────────────────────────
  var protoLabel={jp4:'JP 4-site',jp3:'JP 3-site',jp7:'JP 7-site',slaughter:'Slaughter'};
  var sfFieldLabels=isEn?{chest:'Chest',abdomen:'Abdomen',thigh:'Thigh',tricep:'Triceps',suprailiac:'Suprailiac',midaxillary:'Midaxillary',subscapular:'Subscapular',calf:'Calf'}:{chest:'Στήθος',abdomen:'Κοιλιά',thigh:'Μηρός',tricep:'Τρικέφαλος',suprailiac:'Υπερλαγόνιο',midaxillary:'Μεσομάσχαλο',subscapular:'Υποπλάτιο',calf:'Γαστροκν.'};
  var tblRows='';
  sorted.slice().reverse().forEach(function(e,ri){
    var lbm=e.bf>0?+(e.weight*(1-e.bf/100)).toFixed(1):'—';
    var fm=e.bf>0?+(e.weight*e.bf/100).toFixed(1):'—';
    var sfNote='';
    if(e.sfProtocol&&e.sfFields){
      var mm=Object.keys(e.sfFields).map(function(k){return (sfFieldLabels[k]||k)+': '+e.sfFields[k]+'mm';}).join('  ');
      sfNote='<br><span style="font-size:6pt;color:#888">'+esc(protoLabel[e.sfProtocol]||e.sfProtocol)+(mm?' — '+esc(mm):'')+'</span>';
    }
    var bfCell=e.bf?e.bf+'%'+(e.sfProtocol?'<span style="font-size:5.5pt;color:#2e7d32;margin-left:3px">📐</span>':''):'—';
    tblRows+='<tr class="'+(ri%2?'alt':'')+'">'
      +'<td>'+esc(e.date)+'</td>'
      +'<td>'+e.weight+' kg</td>'
      +'<td>'+bfCell+sfNote+'</td>'
      +'<td>'+(lbm!=='—'?lbm+' kg':'—')+'</td>'
      +'<td>'+(fm!=='—'?fm+' kg':'—')+'</td>'
      +'<td>'+(e.waist?e.waist+' cm':'—')+'</td>'
      +'<td>'+(e.hip?e.hip+' cm':'—')+'</td>'
      +'</tr>';
  });

  // ── BF% reference bar ─────────────────────────────────────────────────────
  // Age-adjusted 4 zones (Gallagher 2000) when the client's age is known, else the
  // non-age-adjusted ACE 5-band. `refRows` normalises both to {lbl, lo, hi, col}.
  var refRows;
  if(bfGv){
    var _oCap=bfGv.obeseLo+8;
    refRows=[
      {lbl:GBF_LBL.low,     lo:isFem?5:0,      hi:bfGv.healthy[0], col:'#1565C0'},
      {lbl:GBF_LBL.healthy, lo:bfGv.healthy[0],hi:bfGv.healthy[1], col:'#2e7d32'},
      {lbl:GBF_LBL.overfat, lo:bfGv.healthy[1],hi:bfGv.obeseLo,    col:'#f57c00'},
      {lbl:GBF_LBL.obese,   lo:bfGv.obeseLo,   hi:_oCap,           col:'#c62828'}
    ];
  } else { refRows=bfRefs; }
  var refBarHtml='<div style="margin:10px 0 14px">';
  var totalRange=refRows[refRows.length-1].hi-refRows[0].lo;
  refBarHtml+='<div style="display:flex;height:12px;border-radius:4px;overflow:hidden;margin-bottom:4px">';
  refRows.forEach(function(r){
    var w=Math.round((r.hi-r.lo)/totalRange*100);
    refBarHtml+='<div style="flex:'+w+';background:'+r.col+';opacity:.7" title="'+r.lbl+'"></div>';
  });
  refBarHtml+='</div>';
  refBarHtml+='<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:6.5pt">';
  refRows.forEach(function(r){
    refBarHtml+='<span><span style="display:inline-block;width:8px;height:8px;background:'+r.col+';border-radius:2px;vertical-align:middle;margin-right:2px;opacity:.8"></span>'+r.lbl+' ('+r.lo+'–'+r.hi+'%)</span>';
  });
  refBarHtml+='</div></div>';

  // ── Logo ───────────────────────────────────────────────────────────────────
  var logoSrc='';
  try{var lc=document.createElement('canvas');lc.width=90;lc.height=90;var lx=lc.getContext('2d');lx.fillStyle='#e5e5e5';lx.fillRect(0,0,90,90);lx.fillStyle='#025857';lx.font='bold 40px Georgia,serif';lx.textAlign='center';lx.textBaseline='middle';lx.fillText('fyh',45,45);logoSrc=lc.toDataURL('image/png');}catch(e){}

  // ── Assemble HTML ──────────────────────────────────────────────────────────
  var html='<!DOCTYPE html><html lang="'+(isEn?'en':'el')+'"><head><meta charset="UTF-8">'
    +'<title>'+T('Σωματική Σύνθεση','Body Composition')+' — '+esc(c.name||T('Πελάτης','Client'))+'</title>'
    +'<style>'
    +'*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:8pt;color:var(--text-strong);padding:10mm 12mm;background:var(--card-bg)}'
    +'.hdr{display:flex;align-items:center;justify-content:space-between;border-bottom:2.5px solid #025857;padding-bottom:7px;margin-bottom:12px}'
    +'.hdr-logo{height:36px;width:36px;margin-right:10px;border-radius:6px}'
    +'.hdr-name{font-size:14pt;font-weight:700;color:#025857}'
    +'.hdr-info{font-size:7.5pt;color:#555;margin-top:2px}'
    +'.hdr-date{font-size:7.5pt;color:#888;text-align:right}'
    +'.sec-title{font-size:9.5pt;font-weight:700;color:#025857;border-bottom:1px solid #c5ddd8;padding-bottom:3px;margin-bottom:8px;margin-top:14px}'
    +'.kpi-row{display:flex;gap:10px;margin-bottom:12px}'
    +'.kpi{flex:1;background:#f0f9f8;border:1px solid #c5ddd8;border-radius:7px;padding:8px 10px;text-align:center}'
    +'.kpi-lbl{font-size:6.5pt;color:#555;font-weight:600;text-transform:uppercase;letter-spacing:.3px}'
    +'.kpi-val{font-size:14pt;font-weight:700;color:#025857;line-height:1.2;margin-top:2px}'
    +'.kpi-sub{font-size:6pt;color:#888;margin-top:1px}'
    +'.kpi.cat{border-color:'+bfCatCol+';background:'+bfCatCol+'15}'
    +'.kpi.cat .kpi-val{color:'+bfCatCol+'}'
    +'table{border-collapse:collapse;width:100%;font-size:7.5pt}'
    +'th{background:#025857;color:#fff;padding:4px 6px;text-align:left;font-weight:600}'
    +'td{padding:4px 6px;border-bottom:1px solid #f0f0f0;vertical-align:top}'
    +'.alt td{background:#f8fffe}'
    +'.legend{display:flex;gap:14px;font-size:7pt;color:#555;margin-top:5px;align-items:center}'
    +'.footer{margin-top:12px;padding-top:5px;border-top:1px solid #c5ddd8;font-size:6pt;color:#888;display:flex;justify-content:space-between}'
    +'@media print{.no-print{display:none}body{color-adjust:exact;-webkit-print-color-adjust:exact;print-color-adjust:exact}*{color-adjust:exact;-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
    +'</style></head><body>'
    +'<div class="no-print" style="margin-bottom:10px">'
    +'<button onclick="window.print()" style="padding:6px 18px;background:#025857;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700">🖨️ '+T('Εκτύπωση / PDF','Print / PDF')+'</button>'
    +'<span style="font-size:11px;color:#666;margin-left:10px">'+T('Επίλεξε <b>Portrait</b> και <b>απενεργοποίησε</b> κεφαλίδες/υποσέλιδα','Choose <b>Portrait</b> and <b>turn off</b> headers/footers')+'</span>'
    +'</div>'
    // Header
    +'<div class="hdr">'
    +'<div style="display:flex;align-items:center">'
    +(logoSrc?'<img src="'+logoSrc+'" class="hdr-logo" alt="fyh">':'')
    +'<div><div class="hdr-name">'+esc(c.name||T('Πελάτης','Client'))+'</div>'
    +'<div class="hdr-info">'+esc(T(isFem?'Γυναίκα':'Άνδρας',isFem?'Female':'Male')+' · '+c.age+T(' ετών',' years old')+' · '+c.weight+'kg · '+c.height+'cm')+'</div>'
    +'</div></div>'
    +'<div class="hdr-date"><b>Feed Your Health</b><br>WWW.FEEDYOURHEALTH.ORG<br>'+T('Τελευταία ανανέωση','Last updated')+': '+today+'</div>'
    +'</div>'
    // KPIs
    +'<div class="sec-title">'+T('Τελευταία Μέτρηση','Latest Measurement')+' &nbsp;<span style="font-size:7.5pt;font-weight:400;color:#888">'+esc(latest.date)+'</span></div>'
    +'<div class="kpi-row">'
    +'<div class="kpi"><div class="kpi-lbl">'+T('Βάρος','Weight')+'</div><div class="kpi-val">'+latest.weight+' kg</div><div class="kpi-sub">&nbsp;</div></div>'
    +(latestBF?'<div class="kpi cat"><div class="kpi-lbl">'+T('Λίπος σώματος','Body fat')+'</div><div class="kpi-val">'+latestBF+'%</div><div class="kpi-sub">'+bfCatLabel+'</div></div>':'')
    +(latestLBM?'<div class="kpi"><div class="kpi-lbl">'+T('Άλιπη μάζα (LBM)','Lean mass (LBM)')+'</div><div class="kpi-val" style="color:#1565C0">'+latestLBM+' kg</div><div class="kpi-sub">&nbsp;</div></div>':'')
    +(latestFM?'<div class="kpi"><div class="kpi-lbl">'+T('Λιπώδης μάζα (FM)','Fat mass (FM)')+'</div><div class="kpi-val" style="color:#e65100">'+latestFM+' kg</div><div class="kpi-sub">&nbsp;</div></div>':'')
    +(latest.waist?'<div class="kpi"><div class="kpi-lbl">'+T('Μέση','Waist')+'</div><div class="kpi-val">'+latest.waist+' cm</div><div class="kpi-sub">&nbsp;</div></div>':'')
    +'</div>'
    // Chart
    +(sorted.length>=2?'<div class="sec-title">'+T('Πορεία Βάρους & %BF','Weight & %BF Trend')+'</div>'+chartHtml+'<div class="legend">'
      +'<svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="#025857" stroke-width="2.5"/></svg><span>'+T('Βάρος (kg) — αριστερός άξονας','Weight (kg) — left axis')+'</span>'
      +(hasBF?'<svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="#1565C0" stroke-width="2" stroke-dasharray="5,3"/></svg><span>'+T('Λίπος σώματος (%) — δεξί άξονας','Body fat (%) — right axis')+'</span>':'')
      +'</div>':'')
    // Ref ranges
    +'<div class="sec-title">'+T('Τιμές Αναφοράς %BF','%BF Reference Values')+' &nbsp;<span style="font-size:7pt;font-weight:400;color:#888">'+bfSrcLbl+'</span></div>'
    +refBarHtml
    // History table
    +'<div class="sec-title">'+T('Ιστορικό Μετρήσεων','Measurement History')+'</div>'
    +'<table><thead><tr><th>'+T('Ημερομηνία','Date')+'</th><th>'+T('Βάρος','Weight')+'</th><th>%BF</th><th>LBM</th><th>FM</th><th>'+T('Μέση','Waist')+'</th><th>'+T('Γοφοί','Hips')+'</th></tr></thead>'
    +'<tbody>'+tblRows+'</tbody></table>'
    +'<div style="font-size:6.5pt;color:var(--text-muted);margin-top:4px">'+T('📐 = μέτρηση με δερματοπτυχόμετρο','📐 = skinfold caliper measurement')+' · JP 4-site: Jackson &amp; Pollock (1985) · JP 3-site / JP 7-site: Jackson &amp; Pollock (1978/1980) · Slaughter: Slaughter et al. (1988)</div>'
    +'<div style="font-size:6.5pt;color:var(--text-muted);margin-top:2px">'+T('%BF = Ποσοστό Λίπους Σώματος · LBM = Άλιπη Μάζα Σώματος · FM = Λιπώδης Μάζα','%BF = Body Fat Percentage · LBM = Lean Body Mass · FM = Fat Mass')+'</div>'
    +'<div style="font-size:6.5pt;color:var(--text-muted);margin-top:2px">'+T('Οι κατηγορίες %BF είναι στατιστικά όρια αναφοράς, όχι ιατρική διάγνωση.','%BF categories are statistical reference ranges, not a medical diagnosis.')+'</div>'
    // Footer
    +'<div class="footer"><span>Feed Your Health — '+T('Ιστορικό Σωματικής Σύνθεσης','Body Composition History')+'</span><span>'+esc(c.name||'')+'  ·  '+T('Εκτυπώθηκε','Printed')+': '+today+'</span></div>'
    +'</body></html>';

  var w=window.open('','_blank');
  if(!w){showErrorToast(T('Επέτρεψε τα pop-ups για να ανοίξει το PDF.','Allow pop-ups to open the PDF.'));return;}
  w.document.write(html);w.document.close();
  setTimeout(function(){w.print();},600);
}

// Ανοίγει το ίδιο έντυπο Ιστορικού (exportBodyCompPDF) για αποθήκευση ως PDF, και ταυτόχρονα
// προετοιμάζει WhatsApp ή Email προς τον πελάτη με έτοιμο μήνυμα — ο διαιτολόγος απλά επισυνάπτει
// το PDF που μόλις αποθήκευσε. Δεν γίνεται αυτόματη επισύναψη: τα wa.me/mailto links δεν το
// υποστηρίζουν (browser security), ίδιος περιορισμός όπως στο sendFeedbackReminder.
function sendBodyCompReport(channel){
  var c=getC();if(!c)return;
  if(!c.weightLog||!c.weightLog.length){showErrorToast('Δεν υπάρχουν εγγραφές tracker.');return;}
  var fname=(c.name||'').split(' ')[0]||'σου';
  var d=clientMsgDict(c);
  var msg=d.bodyComp(fname);
  if(channel==='wa'){
    var phone=normalizePhoneIntl(c.phone);
    if(!phone){showErrorToast('Δεν υπάρχει τηλέφωνο για τον/την '+(c.name||'πελάτη')+'.');return;}
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  } else {
    if(!c.email){showErrorToast('Δεν υπάρχει email για τον/την '+(c.name||'πελάτη')+'.');return;}
    location.href='mailto:'+encodeURIComponent(c.email).replace(/%40/g,'@')+'?subject='+encodeURIComponent(d.bodyCompSubj)+'&body='+encodeURIComponent(msg);
  }
  exportBodyCompPDF();
  showSuccessToast('Άνοιξε το PDF για αποθήκευση — επισύναψέ το στο μήνυμα που άνοιξε.');
}

/* ── Debug Panel / Error Reporting ──────────────────────────────────────────── */
function showDebugPanel(){
  var existing=document.getElementById('debug-modal');
  if(existing){existing.remove();return;}

  var audit=LOGGER.getAuditTrail();
  var modal=document.createElement('div');
  modal.id='debug-modal';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999';

  var content=document.createElement('div');
  content.style.cssText='background:var(--card-bg);border-radius:8px;padding:20px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3)';

  var html='<h2 style="color:#d32f2f;margin-top:0">🔧 Σφάλματα &amp; Αναφορά</h2>';
  html+='<div style="margin-bottom:15px;padding:10px;background:var(--panel-bg);border-radius:4px;font-size:12px">';
  html+='<strong>Σύνοψη:</strong> Σφάλματα: '+audit.total.errors+' | Προειδοποιήσεις: '+audit.total.warnings+' | Πληροφορίες: '+audit.total.infos+'</div>';

  // Errors
  if(audit.errors.length>0){
    html+='<h3 style="color:#d32f2f;font-size:13px;margin-top:15px">❌ Σφάλματα ('+audit.errors.length+')</h3>';
    html+='<div style="background:#ffebee;border-left:4px solid #d32f2f;padding:10px;margin-bottom:10px;border-radius:3px;font-size:11px;max-height:150px;overflow-y:auto">';
    audit.errors.forEach(function(e){
      html+='<div style="padding:3px 0;border-bottom:1px solid rgba(0,0,0,0.1)">';
      html+='<strong>['+esc(e.timestamp)+']</strong> '+esc(e.msg);
      if(e.data)html+=' <code style="color:#666;font-size:10px">'+esc(JSON.stringify(e.data).substring(0,100))+'</code>';
      html+='</div>';
    });
    html+='</div>';
  }

  // Warnings
  if(audit.warnings.length>0){
    html+='<h3 style="color:#ff9800;font-size:13px;margin-top:15px">⚠️ Προειδοποιήσεις ('+audit.warnings.length+')</h3>';
    html+='<div style="background:#fff3e0;border-left:4px solid #ff9800;padding:10px;margin-bottom:10px;border-radius:3px;font-size:11px;max-height:150px;overflow-y:auto">';
    audit.warnings.forEach(function(w){
      html+='<div style="padding:3px 0;border-bottom:1px solid rgba(0,0,0,0.1)">';
      html+='<strong>['+esc(w.timestamp)+']</strong> '+esc(w.msg);
      if(w.data)html+=' <code style="color:#666;font-size:10px">'+esc(JSON.stringify(w.data).substring(0,100))+'</code>';
      html+='</div>';
    });
    html+='</div>';
  }

  // Actions
  html+='<div style="margin-top:15px;display:flex;gap:8px">';
  html+='<button onclick="LOGGER.clear();alert(\'Τα logs διαγράφηκαν\');document.getElementById(\\\'debug-modal\\\').remove()" style="flex:1;padding:8px;background:#4caf50;color:white;border:none;border-radius:4px;cursor:pointer">Διαγραφή logs</button>';
  html+='<button onclick="var txt=LOGGER.exportLogs();var a=document.createElement(\'a\');a.href=\'data:text/plain,\'+encodeURIComponent(txt);a.download=\'debug_'+new Date().toISOString().slice(0,10)+'.txt\';a.click()" style="flex:1;padding:8px;background:#2196f3;color:white;border:none;border-radius:4px;cursor:pointer">Εξαγωγή logs</button>';
  html+='<button onclick="document.getElementById(\'debug-modal\').remove()" style="flex:1;padding:8px;background:#999;color:white;border:none;border-radius:4px;cursor:pointer">Κλείσιμο</button>';
  html+='</div>';

  content.innerHTML=html;
  modal.appendChild(content);

  modal.onclick=function(e){if(e.target===modal)modal.remove()};
  document.body.appendChild(modal);

  LOGGER.INFO('Debug panel opened');
}

/* ── Scientific References Panel ─────────────────────────────────────────── */
function showReferences(){
  var existing=document.getElementById('ref-modal');
  if(existing){existing.remove();return;}
  var refs=[
    {cat:'🔥 Μεταβολισμός / BMR',items:[
      {label:'Mifflin-St Jeor (1990)',desc:'Εξίσωση BMR — χρυσό πρότυπο για ενήλικες',citation:'Mifflin MD et al. "A new predictive equation for resting energy expenditure in healthy individuals." <i>Am J Clin Nutr</i> 1990;51(2):241-247.',url:'https://pubmed.ncbi.nlm.nih.gov/2305711/'},
      {label:'Harris-Benedict αναθ. (1984)',desc:'Κλασική εξίσωση BMR (αναθεωρημένη Roza & Shizgal)',citation:'Roza AM, Shizgal HM. "The Harris Benedict equation reevaluated." <i>Am J Clin Nutr</i> 1984;40(1):168-182.',url:'https://pubmed.ncbi.nlm.nih.gov/6741850/'},
      {label:'Katch-McArdle (1996)',desc:'BMR βάσει άλιπης μάζας (LBM)',citation:'McArdle WD, Katch FI, Katch VL. <i>Exercise Physiology</i> 4th ed. 1996. Lippincott Williams & Wilkins.',url:''},
      {label:'Schofield (1985)',desc:'BMR παιδιών & εφήβων <18 ετών',citation:'Schofield WN. "Predicting basal metabolic rate, new standards and review of previous work." <i>Hum Nutr Clin Nutr</i> 1985;39C(Suppl 1):5-41.',url:'https://pubmed.ncbi.nlm.nih.gov/4044297/'},
      {label:'WHO/FAO/UNU (2004)',desc:'Συντελεστές φυσικής δραστηριότητας (PAL)',citation:'WHO/FAO/UNU. "Human Energy Requirements." <i>FAO Food and Nutrition Technical Report Series</i> 2004;1.',url:'https://www.fao.org/3/y5686e/y5686e.pdf'}
    ]},
    {cat:'📐 Σωματική Σύνθεση',items:[
      {label:'Jackson & Pollock (1978) — Άνδρες',desc:'JP3 & JP7 — εξισώσεις δερματοπτυχόμετρου για άνδρες',citation:'Jackson AS, Pollock ML. "Generalized equations for predicting body density of men." <i>Br J Nutr</i> 1978;40(3):497-504.',url:'https://pubmed.ncbi.nlm.nih.gov/718832/'},
      {label:'Jackson, Pollock & Ward (1980) — Γυναίκες',desc:'JP3 & JP7 — εξισώσεις για γυναίκες',citation:'Jackson AS, Pollock ML, Ward A. "Generalized equations for predicting body density of women." <i>Med Sci Sports Exerc</i> 1980;12(3):175-181.',url:'https://pubmed.ncbi.nlm.nih.gov/7402053/'},
      {label:'Jackson & Pollock (1985) — JP4',desc:'JP4 — 4 σημεία (κοιλιά/υπερλαγόνιο/τρικέφαλος/μηρός), απευθείας %BF χωρίς ενδιάμεσο βήμα BD/Siri',citation:'Jackson AS, Pollock ML. "Practical assessment of body composition." <i>Physician and Sportsmedicine</i> 1985;13(5):76-90.',url:''},
      {label:'Slaughter et al. (1988)',desc:'Δερματοπτυχόμετρο για παιδιά & εφήβους (τρικέφαλος + γαστροκνήμιο)',citation:'Slaughter MH et al. "Skinfold equations for estimation of body fatness in children and youth." <i>Hum Biol</i> 1988;60(5):709-723.',url:'https://pubmed.ncbi.nlm.nih.gov/3224965/'},
      {label:'Siri Equation (1956)',desc:'Μετατροπή σωματικής πυκνότητας σε %ΛΣ: (4.95/BD − 4.50) × 100',citation:'Siri WE. "Body composition from fluid spaces and density: Analysis of methods." <i>Univ Calif Berkeley Donner Lab Med Physics Rep</i> 1956.',url:''},
      {label:'ACSM Body Fat Norms',desc:'Κατηγορίες %ΛΣ (Essential/Athletic/Fitness/Average/Obese)',citation:'American College of Sports Medicine. <i>ACSM&#39;s Guidelines for Exercise Testing and Prescription</i>, 11th ed. 2021. Wolters Kluwer.',url:'https://www.acsm.org/'}
    ]},
    {cat:'🥗 Διατροφή & Μακροθρεπτικά',items:[
      {label:'Πρωτεΐνη 1.6–2.2 g/kg',desc:'Βέλτιστη πρόσληψη για υπερτροφία/απώλεια λίπους σε αθλητές',citation:'Morton RW et al. "A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength." <i>Br J Sports Med</i> 2018;52(6):376-384.',url:'https://pubmed.ncbi.nlm.nih.gov/28698222/'},
      {label:'Φυτικές ίνες — DRI (2005)',desc:'Adequate Intake ανά ηλικία & φύλο',citation:'Institute of Medicine. "Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids." <i>National Academies Press</i> 2005.',url:'https://doi.org/10.17226/10490'},
      {label:'Φυτικές ίνες — EFSA (2017)',desc:'25g/ημ. για ενήλικες ως ελάχιστο',citation:'EFSA Panel on Nutrition. "Dietary reference values for dietary fibre." <i>EFSA J</i> 2017;15(1):4588.',url:'https://doi.org/10.2903/j.efsa.2017.4588'},
      {label:'Μεσογειακή Διατροφή',desc:'Σκορ συμμόρφωσης & προστατευτικά αποτελέσματα',citation:'Trichopoulou A et al. "Adherence to a Mediterranean diet and survival in a Greek population." <i>NEJM</i> 2003;348:2599-2608.',url:'https://pubmed.ncbi.nlm.nih.gov/12826634/'},
      {label:'Τιμές τροφίμων (macros & fiber)',desc:'Βάση δεδομένων για kcal, πρωτεΐνη, υδατάνθρακες, λίπος, φυτικές ίνες',citation:'USDA FoodData Central 2024. U.S. Department of Agriculture, Agricultural Research Service.',url:'https://fdc.nal.usda.gov/'}
    ]},
    {cat:'⚡ Ενέργεια & Ασφάλεια',items:[
      {label:'RED-S / Energy Availability',desc:'EA <30 kcal/kgLBM = κίνδυνος, <45 = οριακή',citation:'Mountjoy M et al. "The IOC consensus statement: beyond the Female Athlete Triad — Relative Energy Deficiency in Sport (RED-S)." <i>Br J Sports Med</i> 2014;48:491-497.',url:'https://pubmed.ncbi.nlm.nih.gov/24620037/'},
      {label:'MET τιμές δραστηριοτήτων',desc:'Αντιστοιχία MET για κάθε δραστηριότητα',citation:'Ainsworth BE et al. "2011 Compendium of Physical Activities: a second update of codes and MET values." <i>Med Sci Sports Exerc</i> 2011;43(8):1575-1581.',url:'https://pubmed.ncbi.nlm.nih.gov/21681120/'},
      {label:'Τόνος & Μεθυλυδράργυρος',desc:'Μέγιστα όρια κατανάλωσης τόνου',citation:'EFSA CONTAM Panel. "Scientific Opinion on the risk for public health related to the presence of mercury and methylmercury in food." <i>EFSA J</i> 2012;10(12):2985; EFSA 2015 update.',url:'https://doi.org/10.2903/j.efsa.2012.2985'},
      {label:'Ενυδάτωση',desc:'35 ml/kg/ημ. βάση — +500ml/ώρα άσκησης',citation:'EFSA Panel on Dietetic Products. "Scientific Opinion on Dietary Reference Values for water." <i>EFSA J</i> 2010;8(3):1459.',url:'https://doi.org/10.2903/j.efsa.2010.1459'}
    ]}
  ];
  var overlay=document.createElement('div');
  overlay.id='ref-modal';
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99998;display:flex;align-items:flex-start;justify-content:center;padding:24px 12px;overflow-y:auto';
  var box=document.createElement('div');
  box.style.cssText='background:var(--card-bg);border-radius:14px;max-width:760px;width:100%;padding:22px 24px;box-shadow:0 8px 40px rgba(0,0,0,.25);position:relative;font-family:inherit';
  var h='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
    +'<div style="font-size:16px;font-weight:800;color:#025857">📚 Βιβλιογραφία &amp; Επιστημονικές Πηγές</div>'
    +'<button onclick="document.getElementById(\'ref-modal\').remove()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#888;padding:4px">✕</button>'
    +'</div>'
    +'<div style="font-size:11px;color:#888;margin-bottom:16px;padding:8px 12px;background:#f8f9fa;border-radius:7px;border-left:3px solid #025857">'
    +'Όλοι οι τύποι, στόχοι και τιμές αναφοράς βασίζονται σε peer-reviewed επιστημονικές δημοσιεύσεις.</div>';
  refs.forEach(function(sec){
    h+='<div style="margin-bottom:18px"><div style="font-size:13px;font-weight:700;color:#025857;margin-bottom:8px;padding-bottom:5px;border-bottom:2px solid #e0f2f1">'+sec.cat+'</div>';
    h+='<div style="display:flex;flex-direction:column;gap:7px">';
    sec.items.forEach(function(r){
      var warn=r.label.indexOf('⚠️')>-1;
      var bg=warn?'#fff8e1':'#f9fffe';
      var border=warn?'#ffe082':'#c5ddd8';
      h+='<div style="background:'+bg+';border:1px solid '+border+';border-radius:8px;padding:9px 12px">'
        +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">'
        +'<div>'
        +'<span style="font-size:11px;font-weight:700;color:'+(warn?'#e65100':'#025857')+'">'+r.label+'</span>'
        +'<span style="font-size:10px;color:#666;margin-left:8px">'+r.desc+'</span>'
        +'</div>'
        +(r.url?'<a href="'+r.url+'" target="_blank" style="font-size:10px;color:#1565C0;white-space:nowrap;text-decoration:none;border:1px solid #bbdefb;border-radius:5px;padding:2px 7px;flex-shrink:0">PubMed ↗</a>':'')
        +'</div>'
        +'<div style="font-size:10px;color:#555;margin-top:4px;line-height:1.5">'+r.citation+'</div>'
        +'</div>';
    });
    h+='</div></div>';
  });
  box.innerHTML=h;
  overlay.appendChild(box);
  overlay.addEventListener('click',function(e){if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

function exportBackup(){
  var data=JSON.stringify({
    clients:clients,
    customTemplates:customTemplates,
    version:3,
    exportedAt:new Date().toISOString(),
    totalClients:clients.length
  },null,2);
  var blob=new Blob([data],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='FYH_backup_'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
}

// ── Export All Data to JSON (for Google Drive) ──
function exportClientsJSON(){
  if((!clients||clients.length===0)&&(!customTemplates||customTemplates.length===0)){
    showErrorToast('Δεν υπάρχουν δεδομένα για εξαγωγή');return;
  }
  var data=JSON.stringify({
    clients:clients,
    customTemplates:customTemplates,
    version:3,
    exportedAt:new Date().toISOString(),
    totalClients:clients.length,
    totalTemplates:customTemplates.length,
    notes:'Όλα τα δεδομένα: πελάτες + πρότυπα + ρυθμίσεις'
  },null,2);
  var blob=new Blob([data],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='FYH_AllData_'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  setTimeout(function(){showSuccessToast('✅ Κατεβάστηκε!\n\nPelátai: '+clients.length+'\nPrótupa: '+customTemplates.length+'\n\nΒήμα 1: Ανεβάσμε το αρχείο στο Google Drive\nΒήμα 2: Σε άλλο PC, κάνε κλικ "Ανεβάσμε" και επίλεξε το αρχείο');},500);
}

// ── Import All Data from JSON (from Google Drive) ──
function importClientsJSON(){
  var inp=document.createElement('input');
  inp.type='file';inp.accept='.json';
  inp.onchange=function(){
    var f=inp.files[0];if(!f)return;
    var r=new FileReader();
    r.onload=function(e){
      var d;
      try{
        d=JSON.parse(e.target.result);
        if(!d.clients||!Array.isArray(d.clients))throw new Error('Λάθος format αρχείου');
      }catch(ex){showErrorToast('❌ Σφάλμα: '+ex.message);return;}

      var incoming=d.clients.length;
      var incomingTmpls=(d.customTemplates||[]).length;
      var existing=clients.length;
      var existingTmpls=customTemplates.length;

      function doMerge(){
        var existingIds=clients.map(function(c){return c.id;});
        var toAdd=d.clients.filter(function(c){return existingIds.indexOf(c.id)<0;});
        var dupes=d.clients.length-toAdd.length;
        clients=clients.concat(toAdd);
        var existingTmplIds=customTemplates.map(function(t){return t.id;});
        var toAddTmpls=(d.customTemplates||[]).filter(function(t){return existingTmplIds.indexOf(t.id)<0;});
        customTemplates=customTemplates.concat(toAddTmpls);
        finishImport('✅ Εισαγωγή επιτυχής! Προστέθηκαν '+toAdd.length+' πελάτες ('+dupes+' ήδη υπάρχοντες), '+toAddTmpls.length+' πρότυπα. Σύνολο: '+clients.length+' πελάτες, '+customTemplates.length+' πρότυπα.');
      }
      function doReplace(){
        clients=d.clients;
        customTemplates=d.customTemplates||[];
        finishImport('✅ Αντικαταστάθηκαν όλα τα δεδομένα! Σύνολο: '+clients.length+' πελάτες, '+customTemplates.length+' πρότυπα.');
      }
      function finishImport(msg){
        curId=null;
        saveNow();
        renderSB();
        document.getElementById('main').innerHTML='<div class="empty">'
          +'<div style="font-size:44px;margin-bottom:12px">☁️</div>'
          +'<div style="font-size:15px;font-weight:600;margin-bottom:6px">Εισαγωγή επιτυχής!</div>'
          +'<div style="font-size:12px;color:#555">Πελάτες: '+clients.length+' · Πρότυπα: '+customTemplates.length
          +(d.exportedAt?' · Αρχείο από: '+d.exportedAt.slice(0,10):'')
          +'</div></div>';
        showSuccessToast(msg);
      }

      if(existing>0){
        showConfirmDialog(
          'Αρχείο: '+incoming+' πελάτες, '+incomingTmpls+' πρότυπα.\nΤρέχον: '+existing+' πελάτες, '+existingTmpls+' πρότυπα.',
          doMerge,
          {title:'Συγχώνευση ή αντικατάσταση;', icon:'📥', confirmLabel:'Συγχώνευση', secondary:{label:'Αντικατάσταση', onClick:doReplace}}
        );
      } else {
        doMerge();
      }
    };
    r.readAsText(f);
  };
  inp.click();
}

function exportWord(){
  var c=getC();
  if(!c||!Object.keys(c.weekPlan||{}).length){showErrorToast('Πρώτα δημιούργησε πλάνο!');return;}
  var t=calcTDEE(c);
  // Calculate weekly average target for MET-based accuracy
  var avgTarget=t.target;
  if(c.dayTargets&&c.dayTargets.length===7){
    var totalKcal=0;
    for(var di=0;di<7;di++){
      totalKcal+=(c.dayTargets[di].k||0);
    }
    avgTarget=Math.round(totalKcal/7);
  }
  var goalL={mild:'Ήπια απώλεια (-250 kcal)',loss:'Απώλεια βάρους (-500 kcal)',maintain:'Διατήρηση βάρους',gain:'Αύξηση μάζας (+300 kcal)'};
  var actL={sed:'Καθιστικός',light:'Ελαφρά ενεργός',mod:'Μέτρια ενεργός',active:'Έντονα ενεργός'};

  // Landscape A4: paperw=16838 paperh=11906 twips; margins 720 each
  // Usable width: 16838 - 1440 = 15398 → left text edge=720, right=16118
  var LM=720, R_EDGE=16118, LABEL_W=1600;
  var DAY_W=Math.floor((R_EDGE-LM-LABEL_W)/7); // ~1971 twips each

  // Absolute cellx right-edges (from left paper edge)
  var CX=[LM+LABEL_W];
  for(var j=1;j<=7;j++) CX.push(LM+LABEL_W+j*DAY_W);
  CX[7]=R_EDGE; // snap last column to exact right margin

  // Cell border + background definition
  function cellDef(x,bg){
    var s='\\clbrdrt\\brdrs\\brdrw15\\clbrdrl\\brdrs\\brdrw15\\clbrdrb\\brdrs\\brdrw15\\clbrdrr\\brdrs\\brdrw15\\clvertalt';
    if(bg===1)s+='\\clcbpat1'; // dark green
    if(bg===3)s+='\\clcbpat3'; // light green
    return s+'\\cellx'+x;
  }

  // Build a complete row definition (8 columns)
  function makeRow(bgs,h){
    var s='\\trowd\\trqc\\trgaph0'+(h?'\\trrh'+h:'');
    for(var k=0;k<CX.length;k++) s+=cellDef(CX[k],bgs[k]||0);
    return s+'\n';
  }

  // RTF document header
  var r='{\\rtf1\\ansi\\ansicpg1252\\deff0'
    +'{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}}'
    +'{\\colortbl;\\red2\\green88\\blue87;\\red255\\green255\\blue255;\\red226\\green238\\blue229;\\red100\\green100\\blue100;}'
    +'\\paperw16838\\paperh11906\\margl720\\margr720\\margt720\\margb720\\landscape\n';

  // ── Title block ──────────────────────────────────────────────────────────────
  r+='{\\pard\\qc\\f0\\b\\fs52\\cf1 '+escRtf(c.name||'Πελάτης')+'\\par}\n';
  r+='{\\pard\\qc\\f0\\b\\fs28\\cf4 '+escRtf('Εβδομαδιαίο Διατροφικό Πλάνο')+'\\par}\n';
  r+='{\\pard\\qc\\f0\\fs22\\cf4 '
    +escRtf((c.sex==='M'?'Άνδρας':'Γυναίκα'))+', '+c.age+escRtf(' ετών')
    +' | '+c.weight+'kg / '+c.height+'cm'
    +' | '+escRtf(goalL[c.goalMain]||'')
    +'\\par}\n';
  r+='{\\pard\\qc\\f0\\b\\fs24\\cf1 '+escRtf('Ενεργειακός Στόχος: ')+avgTarget+' kcal (μέσο εβδομάδας)'
    +'   P:'+t.p+'g   F:'+t.f+'g   C:'+t.carb+'g'
    +'\\par}\\par\n';

  // ── Header row (all dark-green bg, white text) ───────────────────────────────
  r+=makeRow([1,1,1,1,1,1,1,1],560);
  r+='\\pard\\intbl\\qc\\f0\\b\\fs22\\cf2 '+escRtf('Γεύμα')+'\\cell\n';
  for(var d=0;d<7;d++){
    var dK=0,dP=0,dF=0,dC=0;
    (c.weekPlan[d]||[]).forEach(function(m){
      m.foods.forEach(function(f){var rv=cm(f.n,f.g);dK+=rv.k;dP+=rv.p;dF+=rv.f;dC+=rv.c;});
    });
    r+='\\pard\\intbl\\qc\\f0\\b\\fs22\\cf2 '+escRtf(DAYS[d])
      +'\\fs18\\line '+Math.round(dK)+' kcal'
      +'\\fs14\\line P:'+Math.round(dP)+' F:'+Math.round(dF)+' C:'+Math.round(dC)+'g'
      +'\\cell\n';
  }
  r+='\\pard\\row\n';

  // ── Meal rows ────────────────────────────────────────────────────────────────
  var mealNames=(c.weekPlan[0]||[]).map(function(m){return m.name;});
  var rowBgs=[3,0,0,0,0,0,0,0]; // label=light-green, days=white

  for(var mi=0;mi<mealNames.length;mi++){
    r+=makeRow(rowBgs,0);
    r+='\\pard\\intbl\\qc\\f0\\b\\fs20\\cf1 '+escRtf(mealNames[mi])+'\\cell\n';
    for(var d=0;d<7;d++){
      var _mW=c.weekPlan[d]&&c.weekPlan[d][mi];
      var foods=_mW?_mW.foods:[];
      var mK=0,cc='';
      // Γραμμή-τίτλος έτοιμου/branded γεύματος πάνω από τα υλικά (brand name αυτούσιο σε κάθε γλώσσα).
      if(_mW&&_mW.dishLabels&&_mW.dishLabels.length){
        cc+='\\pard\\intbl\\ql\\li60\\f0\\b\\fs16\\cf1 '+escRtf(_mW.dishLabels.join(' + '))+'\\b0\\cf0\\line\n';
      }
      foods.forEach(function(food){
        var mv=cm(food.n,food.g);mK+=mv.k;
        var _rq=fmtFoodQty(food,'g');
        var rtfGStr=_rq.main+(_rq.sub?' '+_rq.sub:'');
        cc+='\\pard\\intbl\\ql\\li60\\f0\\fs16 '+escRtf(food.n)
          +'\\b\\cf1  '+escRtf(rtfGStr)+'\\b0\\cf0\\line\n';
      });
      if(foods.length){
        cc+='\\pard\\intbl\\ql\\li60\\f0\\b\\fs14\\cf4 '+escRtf('Σύνολο')+': '+Math.round(mK)+' kcal';
      }
      r+=cc+'\\cell\n';
    }
    r+='\\pard\\row\n';
  }

  // 🥤 CHO Training Protocol (Phase 3b) — compact per-training-day paragraphs (no table, keeps
  // the RTF geometry untouched). Only when the dietitian has opted the client in.
  if(c.choProtocol&&c.choProtocol.enabled&&typeof computeCHOTargets==='function'){
    var choRtf='';
    for(var wchd=0;wchd<7;wchd++){
      var wchr=null; try{wchr=computeCHOTargets(c,t,wchd);}catch(e){wchr=null;}
      if(!wchr||(!wchr.isTrainingDay&&!wchr.isMatchDay))continue;
      var wDur=wchr.during.applicable
        ? (wchr.during.gramsPerHour+'g/'+escRtf('ώρα')+' (~'+wchr.during.totalGrams+'g)')
        : escRtf('δεν χρειάζεται');
      choRtf+='{\\pard\\f0\\fs18\\cf0 \\b '+escRtf(DAYS[wchd])+':\\b0  '
        +escRtf('Πριν ')+'\\b '+wchr.pre.grams+'g\\b0'+(wchr.pre.timeLabel?escRtf(' ('+wchr.pre.timeLabel+')'):'')
        +escRtf('   Κατά ')+wDur
        +escRtf('   Μετά ')+'\\b '+wchr.post.grams+'g\\b0'+(wchr.post.timeLabel?escRtf(' ('+wchr.post.timeLabel+')'):'')
        +'\\par}\n';
    }
    if(choRtf){
      r+='\\par{\\pard\\f0\\b\\fs24\\cf1 '+escRtf('Υδατάνθρακες γύρω από την προπόνηση')+'\\par}\n'
        +choRtf
        +'{\\pard\\f0\\i\\fs14\\cf4 '+escRtf('Μέρος του ημερήσιου συνόλου, όχι επιπλέον. Πηγή: Thomas 2016.')+'\\i0\\par}\\par\n';
    }
  }

  // ── Supplements section ──── (TWO-LEVEL CONSOLIDATION) ────────────────────────
  // STRATEGY A: Consolidated Supplement List (Existing + Recommended)
  var consolidatedSuppsByT={};
  var processedSuppNames=new Set();

  // Step 1: Add currently taken supplements (from Page 1 - c.supps)
  if(c.supps&&c.supps.length){
    if(!c.suppExclude)c.suppExclude=[];
    c.supps.forEach(function(suppId){
      var suppObj=SUPPS.find(function(s){return s.id===suppId;});
      if(suppObj){
        processedSuppNames.add(suppObj.name);
        suppObj.timing.forEach(function(ti){
          if(!SUPP_TIMINGS.includes(ti.t))return;
          if(c.suppExclude.indexOf(suppId+'|'+ti.t)>-1)return;
          if(!consolidatedSuppsByT[ti.t])consolidatedSuppsByT[ti.t]=[];
          consolidatedSuppsByT[ti.t].push({
            name:suppObj.name,
            dose:suppObj.dose||'(per product label)',
            source:'existing',
            dosage:ti.d||''
          });
        });
      }
    });
  }

  // Step 2: Add recommended supplements that aren't already taken (from Page 2 - selected)
  if(c.selectedSupplements && c.selectedSupplements.length > 0){
    c.selectedSupplements.forEach(function(supp){
      if(!processedSuppNames.has(supp.supplement)){
        processedSuppNames.add(supp.supplement);
        // Find timing from SUPPS database if available
        var suppObj=SUPPS.find(function(s){return s.name===supp.supplement;});
        if(suppObj&&suppObj.timing){
          suppObj.timing.forEach(function(ti){
            if(!SUPP_TIMINGS.includes(ti.t))return;
            if(!consolidatedSuppsByT[ti.t])consolidatedSuppsByT[ti.t]=[];
            consolidatedSuppsByT[ti.t].push({
              name:supp.supplement,
              dose:supp.dose||supp.info||'',
              source:'recommended',
              dosage:ti.d||''
            });
          });
        } else {
          // If no timing found, add to 'During meals' as default
          if(!consolidatedSuppsByT['During meals'])consolidatedSuppsByT['During meals']=[];
          consolidatedSuppsByT['During meals'].push({
            name:supp.supplement,
            dose:supp.dose||supp.info||'',
            source:'recommended',
            dosage:''
          });
        }
      }
    });
  }

  // Step 3: Generate RTF section with consolidated list
  var suppAny=false;
  Object.keys(consolidatedSuppsByT).forEach(function(tm){if(consolidatedSuppsByT[tm].length)suppAny=true;});
  if(suppAny){
    r+='\\par\n';
    r+='{\\pard\\ql\\f0\\b\\fs30\\cf1 '+escRtf('Πρωτόκολλο Συμπληρωμάτων')+'\\par}\\par\n';
    // 3-column table: timing col | supplement col | status col
    var ST_W=2400; // timing column width
    var SS_W=2000; // supplement column width
    var SR_W=1200; // status column width
    var SCX0=LM+ST_W, SCX1=SCX0+SS_W, SCX2=R_EDGE;
    function sCell(x,bg){
      var s='\\clbrdrt\\brdrs\\brdrw12\\clbrdrl\\brdrs\\brdrw12\\clbrdrb\\brdrs\\brdrw12\\clbrdrr\\brdrs\\brdrw12\\clvertalt';
      if(bg===1)s+='\\clcbpat1';
      if(bg===3)s+='\\clcbpat3';
      return s+'\\cellx'+x;
    }
    // header
    r+='\\trowd\\trgaph0'+sCell(SCX0,1)+sCell(SCX1,1)+sCell(SCX2,1)+'\n';
    r+='\\pard\\intbl\\ql\\li80\\f0\\b\\fs20\\cf2 '+escRtf('Χρόνος')+'\\cell\n';
    r+='\\pard\\intbl\\ql\\li80\\f0\\b\\fs20\\cf2 '+escRtf('Συμπλήρωμα')+'\\cell\n';
    r+='\\pard\\intbl\\qc\\f0\\b\\fs20\\cf2 '+escRtf('Κατάστ.')+'\\cell\n';
    r+='\\pard\\row\n';
    var sRowBg=0;
    SUPP_TIMINGS.forEach(function(tm){
      if(!consolidatedSuppsByT[tm]||!consolidatedSuppsByT[tm].length)return;
      sRowBg=sRowBg?0:3;
      var suppsInTiming=consolidatedSuppsByT[tm];
      suppsInTiming.forEach(function(supp,idx){
        var tmLabel=idx===0?tm:'';
        var statusMark=supp.source==='existing'?'✓':'NEW';
        var statusCol=supp.source==='existing'?4:2; // cf4=gray, cf2=black
        r+='\\trowd\\trgaph0'+sCell(SCX0,sRowBg?3:0)+sCell(SCX1,0)+sCell(SCX2,0)+'\n';
        r+='\\pard\\intbl\\ql\\li80\\f0\\b\\fs18\\cf1 '+escRtf(tmLabel)+'\\cell\n';
        r+='\\pard\\intbl\\ql\\li80\\f0\\fs18\\cf0 '+escRtf(supp.name+(supp.dose?' - '+supp.dose:''))+'\\cell\n';
        r+='\\pard\\intbl\\qc\\f0\\b\\fs18\\cf'+statusCol+' '+escRtf(statusMark)+'\\cell\n';
        r+='\\pard\\row\n';
      });
    });
  }

  r+='}';
  var blob=new Blob([r],{type:'application/rtf'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=(c.name||'Pelatis').replace(/\s+/g,'_')+'_WeeklyPlan.rtf';
  a.click();
}

function exportGoogleDocs(){
  var c=getC();
  if(!c||!Object.keys(c.weekPlan||{}).length){showErrorToast('Πρώτα δημιούργησε πλάνο!');return;}
  if(typeof JSZip==='undefined'){showErrorToast('Η βιβλιοθήκη JSZip δεν φορτώθηκε. Έλεγξε τη σύνδεση internet.');return;}
  var t=calcTDEE(c);
  // Calculate weekly average target for MET-based accuracy
  var avgTarget=t.target;
  if(c.dayTargets&&c.dayTargets.length===7){
    var totalKcal=0;
    for(var di=0;di<7;di++){
      totalKcal+=(c.dayTargets[di].k||0);
    }
    avgTarget=Math.round(totalKcal/7);
  }
  var goalL={mild:'Ήπια απώλεια (-250 kcal)',loss:'Απώλεια βάρους (-500 kcal)',maintain:'Διατήρηση βάρους',gain:'Αύξηση μάζας (+300 kcal)'};
  var actL={sed:'Καθιστικός',light:'Ελαφρά ενεργός',mod:'Μέτρια ενεργός',active:'Έντονα ενεργός'};

  // helpers
  function xe(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function rp(b,sz,col){
    return '<w:rPr>'+(b?'<w:b/>':'')
      +'<w:color w:val="'+(col||'1A1A1A')+'"/>'
      +'<w:sz w:val="'+sz+'"/><w:szCs w:val="'+sz+'"/>'
      +'</w:rPr>';
  }
  function pp(al,sb,sa){
    return '<w:pPr>'
      +'<w:spacing w:before="'+(sb||0)+'" w:after="'+(sa||0)+'"/>'
      +(al?'<w:jc w:val="'+al+'"/>':'')
      +'</w:pPr>';
  }
  function para1(tx,al,b,sz,col,sb,sa){
    return '<w:p>'+pp(al,sb,sa)+'<w:r>'+rp(b,sz,col)+'<w:t xml:space="preserve">'+xe(tx)+'</w:t></w:r></w:p>';
  }
  function ep(){return '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>';}
  function brd(col){var c2=col||'CCCCCC';return '<w:top w:val="single" w:sz="4" w:color="'+c2+'"/><w:left w:val="single" w:sz="4" w:color="'+c2+'"/><w:bottom w:val="single" w:sz="4" w:color="'+c2+'"/><w:right w:val="single" w:sz="4" w:color="'+c2+'"/>';}
  function tcp(w,fill){
    return '<w:tcPr>'
      +'<w:tcW w:w="'+w+'" w:type="dxa"/>'
      +'<w:tcBorders>'+brd()+'</w:tcBorders>'
      +'<w:shd w:val="clear" w:color="auto" w:fill="'+(fill||'FFFFFF')+'"/>'
      +'<w:tcMar><w:top w:w="40" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tcMar>'
      +'</w:tcPr>';
  }

  // column widths (landscape A4 = 16838, margins 360 each → usable 16118)
  var PAGE_W=16118;
  var LABEL_W=1400;
  var DAY_W=Math.floor((PAGE_W-LABEL_W)/7);
  var LAST_W=PAGE_W-LABEL_W-DAY_W*6;
  var colW=[LABEL_W];
  for(var cj=0;cj<6;cj++)colW.push(DAY_W);
  colW.push(LAST_W);

  var grid='<w:tblGrid>';
  for(var gi=0;gi<colW.length;gi++)grid+='<w:gridCol w:w="'+colW[gi]+'"/>';
  grid+='</w:tblGrid>';
  var tpr='<w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="'+PAGE_W+'" w:type="dxa"/><w:tblLook w:val="0000"/></w:tblPr>';

  // colors
  var CT='025857',CL='E2EEE5',CW='FFFFFF',CD='1A1A1A',CG='888888',CM='555555';

  // --- FYH Logo (half size, top-left) ---
  var logoBytes=null;
  try{
    var lc=document.createElement('canvas');lc.width=120;lc.height=120;
    var lx=lc.getContext('2d');
    lx.fillStyle='#e5e5e5';lx.fillRect(0,0,120,120);
    lx.fillStyle='#025857';lx.font='bold 54px Georgia,serif';
    lx.textAlign='center';lx.textBaseline='middle';lx.fillText('fyh',60,60);
    var lBin=atob(lc.toDataURL('image/png').split(',')[1]);
    logoBytes=new Uint8Array(lBin.length);
    for(var li=0;li<lBin.length;li++)logoBytes[li]=lBin.charCodeAt(li);
  }catch(e){logoBytes=null;}
  var LEMU=400000; // half of original
  var HLOGO_W=900,HINFO_W=PAGE_W-HLOGO_W;
  var logoInner=logoBytes?
    '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">'
    +'<wp:extent cx="'+LEMU+'" cy="'+LEMU+'"/><wp:effectExtent l="0" t="0" r="0" b="0"/>'
    +'<wp:docPr id="1" name="FYH_Logo" descr="FYH Logo"/>'
    +'<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>'
    +'<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
    +'<pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="fyh_logo.png"/><pic:cNvPicPr/></pic:nvPicPr>'
    +'<pic:blipFill><a:blip r:embed="rId2"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
    +'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+LEMU+'" cy="'+LEMU+'"/></a:xfrm>'
    +'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
    +'</pic:pic></a:graphicData></a:graphic>'
    +'</wp:inline></w:drawing></w:r>':'';

  // no-border cell helper (header table)
  function tcpNB(w,va){
    return '<w:tcPr><w:tcW w:w="'+w+'" w:type="dxa"/>'
      +'<w:tcBorders>'
      +'<w:top w:val="none" w:sz="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:color="auto"/>'
      +'<w:bottom w:val="single" w:sz="16" w:color="'+CT+'"/>'
      +'<w:right w:val="none" w:sz="0" w:color="auto"/>'
      +'</w:tcBorders>'+(va?'<w:vAlign w:val="'+va+'"/>':'')
      +'</w:tcPr>';
  }

  // compact header: logo left | client info right
  var numTDays=(c.trainDays||[]).filter(function(x){return x;}).length;
  var hydStr='Ενυδάτωση Ανάπαυση: '+(t.hydBase||Math.round(c.weight*35))+'ml  /  Προπόνηση: '+(t.hydTrain||Math.round((t.hydBase||c.weight*35)+(c.trainHoursPerDay||1)*500))+'ml  ('+numTDays+' ημ. προπ.)';
  var headerTbl='<w:tbl>'
    +'<w:tblPr><w:tblW w:w="'+PAGE_W+'" w:type="dxa"/>'
    +'<w:tblBorders>'
    +'<w:top w:val="none" w:sz="0" w:color="auto"/><w:left w:val="none" w:sz="0" w:color="auto"/>'
    +'<w:bottom w:val="single" w:sz="16" w:color="'+CT+'"/>'
    +'<w:right w:val="none" w:sz="0" w:color="auto"/>'
    +'<w:insideH w:val="none" w:sz="0" w:color="auto"/><w:insideV w:val="none" w:sz="0" w:color="auto"/>'
    +'</w:tblBorders><w:tblLook w:val="0000"/></w:tblPr>'
    +'<w:tblGrid><w:gridCol w:w="'+HLOGO_W+'"/><w:gridCol w:w="'+HINFO_W+'"/></w:tblGrid>'
    +'<w:tr>'
    +'<w:tc>'+tcpNB(HLOGO_W,'center')
    +'<w:p><w:pPr><w:jc w:val="left"/><w:spacing w:before="0" w:after="0"/></w:pPr>'+logoInner+'</w:p>'
    +'</w:tc>'
    +'<w:tc>'+tcpNB(HINFO_W,'bottom')
    +'<w:p>'+pp('left',0,0)
    +'<w:r>'+rp(true,44,CT)+'<w:t xml:space="preserve">'+xe(c.name||'Πελάτης')+'</w:t></w:r>'
    +'<w:r>'+rp(false,22,CM)+'<w:t xml:space="preserve">  ·  Εβδομαδιαίο Διατροφικό Πλάνο</w:t></w:r>'
    +'</w:p>'
    +'<w:p>'+pp('left',20,20)
    +'<w:r>'+rp(false,17,CG)+'<w:t xml:space="preserve">'+xe((c.sex==='M'?'Άνδρας':'Γυναίκα')+', '+c.age+' ετών  |  '+c.weight+'kg / '+c.height+'cm  |  '+(goalL[c.goalMain]||''))+'</w:t></w:r>'
    +'<w:r>'+rp(true,17,CT)+'<w:t xml:space="preserve">    Στόχος: '+xe(t.target+' kcal  Π:'+t.p+'g  Λ:'+t.f+'g  Υ:'+t.carb+'g')+'</w:t></w:r>'
    +'<w:r>'+rp(false,17,'1565C0')+'<w:t xml:space="preserve">    '+xe(hydStr)+'</w:t></w:r>'
    +'</w:p>'
    +'</w:tc>'
    +'</w:tr></w:tbl>';

  var body=headerTbl;

  // main meal table
  body+='<w:tbl>'+tpr+grid;

  // header row
  body+='<w:tr>';
  body+='<w:tc>'+tcp(colW[0],CT)
    +'<w:p>'+pp('center',0,0)+'<w:r>'+rp(true,22,CW)+'<w:t>'+xe('Γεύμα')+'</w:t></w:r></w:p>'
    +'</w:tc>';
  for(var hd=0;hd<7;hd++){
    var hdK=0,hdP=0,hdF=0,hdC=0;
    (c.weekPlan[hd]||[]).forEach(function(m){m.foods.forEach(function(f){var v=cm(f.n,f.g);hdK+=v.k;hdP+=v.p;hdF+=v.f;hdC+=v.c;});});
    body+='<w:tc>'+tcp(colW[hd+1],CT)
      +'<w:p>'+pp('center',0,0)
      +'<w:r>'+rp(true,20,CW)+'<w:t>'+xe(DAYS[hd])+'</w:t></w:r>'
      +'<w:r>'+rp(false,16,CW)+'<w:br/></w:r>'
      +'<w:r>'+rp(false,16,CW)+'<w:t>'+Math.round(hdK)+' kcal</w:t></w:r>'
      +'<w:r>'+rp(false,13,CW)+'<w:br/></w:r>'
      +'<w:r>'+rp(false,13,CW)+'<w:t>P:'+Math.round(hdP)+' F:'+Math.round(hdF)+' C:'+Math.round(hdC)+'g</w:t></w:r>'
      +'</w:p></w:tc>';
  }
  body+='</w:tr>';

  // meal rows
  var mealNames=(c.weekPlan[0]||[]).map(function(m){return m.name;});
  for(var mi=0;mi<mealNames.length;mi++){
    body+='<w:tr>';
    body+='<w:tc>'+tcp(colW[0],CL)
      +'<w:p>'+pp('center',0,0)+'<w:r>'+rp(true,18,CT)+'<w:t>'+xe(mealNames[mi])+'</w:t></w:r></w:p>'
      +'</w:tc>';
    for(var di=0;di<7;di++){
      var fds=(c.weekPlan[di]&&c.weekPlan[di][mi])?c.weekPlan[di][mi].foods:[];
      var mK2=0;
      var cp='<w:p>'+pp('left',0,0);
      var nbr=false;
      for(var fi=0;fi<fds.length;fi++){
        var fd=fds[fi];var mv2=cm(fd.n,fd.g);mK2+=mv2.k;
        if(nbr){cp+='<w:r>'+rp(false,14,CD)+'<w:br/></w:r>';}
        var _dq=fmtFoodQty(fd,'g');
        var docxGStr=_dq.main+(_dq.sub?' '+_dq.sub:'');
        cp+='<w:r>'+rp(false,14,CD)+'<w:t xml:space="preserve">'+xe(fd.n)+'</w:t></w:r>'
          +'<w:r>'+rp(true,14,CT)+'<w:t xml:space="preserve"> '+xe(docxGStr)+'</w:t></w:r>';
        nbr=true;
      }
      if(fds.length){
        cp+='<w:r>'+rp(false,12,CM)+'<w:br/></w:r>'
          +'<w:r>'+rp(true,12,CM)+'<w:t>'+xe('Σύνολο: '+Math.round(mK2)+' kcal')+'</w:t></w:r>';
      }
      cp+='</w:p>';
      body+='<w:tc>'+tcp(colW[di+1],CW)+cp+'</w:tc>';
    }
    body+='</w:tr>';
  }
  body+='</w:tbl>';

  // ── supplements ──── (TWO-LEVEL CONSOLIDATION) ────────────────────────────────
  // STRATEGY A: Consolidated Supplement List (Existing + Recommended)
  var consolidatedSuppsByT2={};
  var processedSuppNames2=new Set();

  // Step 1: Add currently taken supplements (from Page 1 - c.supps)
  if(c.supps&&c.supps.length){
    if(!c.suppExclude)c.suppExclude=[];
    c.supps.forEach(function(suppId){
      var suppObj=SUPPS.find(function(s){return s.id===suppId;});
      if(suppObj){
        processedSuppNames2.add(suppObj.name);
        suppObj.timing.forEach(function(ti){
          if(!SUPP_TIMINGS.includes(ti.t))return;
          if(c.suppExclude.indexOf(suppId+'|'+ti.t)>-1)return;
          if(!consolidatedSuppsByT2[ti.t])consolidatedSuppsByT2[ti.t]=[];
          consolidatedSuppsByT2[ti.t].push({
            name:suppObj.name,
            dose:suppObj.dose||'(per product label)',
            source:'existing',
            dosage:ti.d||''
          });
        });
      }
    });
  }

  // Step 2: Add recommended supplements that aren't already taken (from Page 2 - selected)
  if(c.selectedSupplements && c.selectedSupplements.length > 0){
    c.selectedSupplements.forEach(function(supp){
      if(!processedSuppNames2.has(supp.supplement)){
        processedSuppNames2.add(supp.supplement);
        // Find timing from SUPPS database if available
        var suppObj=SUPPS.find(function(s){return s.name===supp.supplement;});
        if(suppObj&&suppObj.timing){
          suppObj.timing.forEach(function(ti){
            if(!SUPP_TIMINGS.includes(ti.t))return;
            if(!consolidatedSuppsByT2[ti.t])consolidatedSuppsByT2[ti.t]=[];
            consolidatedSuppsByT2[ti.t].push({
              name:supp.supplement,
              dose:supp.dose||supp.info||'',
              source:'recommended',
              dosage:ti.d||''
            });
          });
        } else {
          // If no timing found, add to 'During meals' as default
          if(!consolidatedSuppsByT2['During meals'])consolidatedSuppsByT2['During meals']=[];
          consolidatedSuppsByT2['During meals'].push({
            name:supp.supplement,
            dose:supp.dose||supp.info||'',
            source:'recommended',
            dosage:''
          });
        }
      }
    });
  }

  // Step 3: Generate DOCX section with consolidated list
  var sAny2=false;
  Object.keys(consolidatedSuppsByT2).forEach(function(tm){if(consolidatedSuppsByT2[tm].length)sAny2=true;});
  if(sAny2){
    body+=ep();
    body+=para1('Πρωτόκολλο Συμπληρωμάτων','left',true,30,CT,120,80);
    var STW2=3200,SNW2=2400,SSW2=PAGE_W-STW2-SNW2;
    var sgrid2='<w:tblGrid><w:gridCol w:w="'+STW2+'"/><w:gridCol w:w="'+SNW2+'"/><w:gridCol w:w="'+SSW2+'"/></w:tblGrid>';
    var stpr2='<w:tblPr><w:tblW w:w="'+PAGE_W+'" w:type="dxa"/><w:tblLook w:val="0000"/></w:tblPr>';
    body+='<w:tbl>'+stpr2+sgrid2;
    body+='<w:tr>'
      +'<w:tc>'+tcp(STW2,CT)+'<w:p>'+pp('left',0,0)+'<w:r>'+rp(true,22,CW)+'<w:t>'+xe('Χρόνος')+'</w:t></w:r></w:p></w:tc>'
      +'<w:tc>'+tcp(SNW2,CT)+'<w:p>'+pp('left',0,0)+'<w:r>'+rp(true,22,CW)+'<w:t>'+xe('Συμπλήρωμα')+'</w:t></w:r></w:p></w:tc>'
      +'<w:tc>'+tcp(SSW2,CT)+'<w:p>'+pp('center',0,0)+'<w:r>'+rp(true,22,CW)+'<w:t>'+xe('Κατάστ.')+'</w:t></w:r></w:p></w:tc>'
      +'</w:tr>';
    var sAlt2=false;
    SUPP_TIMINGS.forEach(function(stm2){
      if(!consolidatedSuppsByT2[stm2]||!consolidatedSuppsByT2[stm2].length)return;
      var suppsInTiming=consolidatedSuppsByT2[stm2];
      suppsInTiming.forEach(function(supp,idx){
        var tmLabel=idx===0?stm2:'';
        var sbg=sAlt2?CL:CW;
        if(idx===suppsInTiming.length-1)sAlt2=!sAlt2;
        var statusText=supp.source==='existing'?'✓':'NEW';
        var statusCol=supp.source==='existing'?CG:CD;
        body+='<w:tr>'
          +'<w:tc>'+tcp(STW2,sbg)+'<w:p>'+pp('left',0,0)+'<w:r>'+rp(true,18,CT)+'<w:t>'+xe(tmLabel)+'</w:t></w:r></w:p></w:tc>'
          +'<w:tc>'+tcp(SNW2,sbg)+'<w:p>'+pp('left',0,0)+'<w:r>'+rp(false,18,CD)+'<w:t>'+xe(supp.name+(supp.dose?' - '+supp.dose:''))+'</w:t></w:r></w:p></w:tc>'
          +'<w:tc>'+tcp(SSW2,sbg)+'<w:p>'+pp('center',0,0)+'<w:r>'+rp(true,18,statusCol)+'<w:t>'+xe(statusText)+'</w:t></w:r></w:p></w:tc>'
          +'</w:tr>';
      });
    });
    body+='</w:tbl>';
  }

  // ── Shopping List ────────────────────────────────────────────────────────────

  // Aggregate all food grams across the whole week
  var shopTotals2={};
  for(var sdi=0;sdi<7;sdi++){
    (c.weekPlan[sdi]||[]).forEach(function(meal){
      meal.foods.forEach(function(food){shopTotals2[food.n]=(shopTotals2[food.n]||0)+food.g;});
    });
  }

  var slCatOrder=['Κρέας','Ψάρια','Αυγά/Γαλακτ.','Δημητριακά','Όσπρια','Λαχανικά','Φρούτα','Ξηροί καρποί','Λάδια','Συνταγές FYH'];
  var shopByCat={};
  slCatOrder.forEach(function(cat){shopByCat[cat]=[];});
  shopByCat['Άλλα']=[];

  Object.keys(shopTotals2).forEach(function(name){
    var cat=(FOODS[name]&&FOODS[name].cat)||'Άλλα';
    if(!shopByCat[cat])shopByCat[cat]=[];
    var planG=Math.round(shopTotals2[name]);
    var conv=COOKED_TO_RAW[name];
    var rawG,buyDisp,sublabel,changed;
    if(conv&&conv.isEgg){
      rawG=planG;
      buyDisp=Math.ceil(planG/55)+' τεμ.';
      sublabel='('+planG+'g)';
      changed=true;
    } else if(conv){
      rawG=shopRound(planG*conv.f);
      buyDisp=shopDisp(rawG);
      sublabel=conv.label;
      changed=true;
    } else {
      rawG=shopRound(planG);
      buyDisp=shopDisp(rawG);
      sublabel=cat==='Συνταγές FYH'?'FYH':'';
      changed=false;
    }
    shopByCat[cat].push({name:name,planG:planG,rawG:rawG,buyDisp:buyDisp,sublabel:sublabel,changed:changed});
  });

  var hasShopItems=slCatOrder.concat(['Άλλα']).some(function(cat){return shopByCat[cat]&&shopByCat[cat].length>0;});
  if(hasShopItems){
    body+=ep();
    body+=para1('Λίστα Αγορών Εβδομάδας','left',true,32,CT,120,40);
    body+=para1('Οι ποσότητες σε ψητό/βρ. έχουν μετατραπεί σε ωμό/ξερό για σωστή αγορά στο σούπερ μάρκετ','left',false,16,CG,0,80);

    var SL1=7980,SL2=2940,SL3=5198; // total=PAGE_W=16118
    function tcpS(w,fill,span){
      return '<w:tcPr>'+(span>1?'<w:gridSpan w:val="'+span+'"/>':'')
        +'<w:tcW w:w="'+w+'" w:type="dxa"/>'
        +'<w:tcBorders>'+brd()+'</w:tcBorders>'
        +'<w:shd w:val="clear" w:color="auto" w:fill="'+(fill||CW)+'"/>'
        +'<w:tcMar><w:top w:w="60" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tcMar>'
        +'</w:tcPr>';
    }
    var slGrid='<w:tblGrid><w:gridCol w:w="'+SL1+'"/><w:gridCol w:w="'+SL2+'"/><w:gridCol w:w="'+SL3+'"/></w:tblGrid>';
    var slTpr='<w:tblPr><w:tblW w:w="'+PAGE_W+'" w:type="dxa"/><w:tblLook w:val="0000"/></w:tblPr>';
    body+='<w:tbl>'+slTpr+slGrid;
    // Header row
    body+='<w:tr>'
      +'<w:tc>'+tcpS(SL1,CT)+'<w:p>'+pp('left',0,0)+'<w:r>'+rp(true,20,CW)+'<w:t>Τρόφιμο</w:t></w:r></w:p></w:tc>'
      +'<w:tc>'+tcpS(SL2,CT)+'<w:p>'+pp('center',0,0)+'<w:r>'+rp(true,20,CW)+'<w:t>Πλάνο (μαγ.)</w:t></w:r></w:p></w:tc>'
      +'<w:tc>'+tcpS(SL3,CT)+'<w:p>'+pp('center',0,0)+'<w:r>'+rp(true,20,CW)+'<w:t>Αγοράστε (ωμό/ξερό)</w:t></w:r></w:p></w:tc>'
      +'</w:tr>';

    var slAlt=false;
    slCatOrder.concat(['Άλλα']).forEach(function(cat){
      var items=shopByCat[cat];
      if(!items||!items.length)return;
      // Category header — spans all 3 columns
      body+='<w:tr>'
        +'<w:tc>'+tcpS(PAGE_W,CL,3)
        +'<w:p>'+pp('left',0,0)
        +'<w:r>'+rp(true,18,CT)+'<w:t>'+xe(cat)+'</w:t></w:r>'
        +'</w:p></w:tc>'
        +'</w:tr>';
      slAlt=false;
      items.forEach(function(item){
        slAlt=!slAlt;
        var rowBg=slAlt?'F5F5F5':CW;
        var buyCol=item.changed?CT:CD;
        // Col1: food name + conversion label
        var nameCell='<w:p>'+pp('left',0,0)
          +'<w:r>'+rp(false,18,CD)+'<w:t xml:space="preserve">'+xe(item.name)+'</w:t></w:r>'
          +(item.sublabel?'<w:r>'+rp(false,14,CG)+'<w:t xml:space="preserve">  '+xe(item.sublabel)+'</w:t></w:r>':'')
          +'</w:p>';
        // Col2: plan grams (as in plan — cooked/as-purchased)
        var planCell='<w:p>'+pp('center',0,0)
          +'<w:r>'+rp(false,18,CG)+'<w:t>'+shopDisp(item.planG)+'</w:t></w:r>'
          +'</w:p>';
        // Col3: buy quantity (converted to raw/dry, bold teal if changed)
        var buyCell='<w:p>'+pp('center',0,0)
          +'<w:r>'+rp(true,22,buyCol)+'<w:t>'+xe(item.buyDisp)+'</w:t></w:r>'
          +'</w:p>';
        body+='<w:tr>'
          +'<w:tc>'+tcpS(SL1,rowBg)+nameCell+'</w:tc>'
          +'<w:tc>'+tcpS(SL2,rowBg)+planCell+'</w:tc>'
          +'<w:tc>'+tcpS(SL3,rowBg)+buyCell+'</w:tc>'
          +'</w:tr>';
      });
    });
    body+='</w:tbl>';
  }

  body+='<w:sectPr>'
    +'<w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/>'
    +'<w:pgMar w:top="360" w:right="360" w:bottom="360" w:left="360" w:header="0" w:footer="0"/>'
    +'</w:sectPr>';

  // assemble document.xml
  var docXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<w:document'
    +' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'
    +' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
    +' xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
    +' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"'
    +' xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"'
    +' xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"'
    +' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"'
    +' mc:Ignorable="w14">'
    +'<w:body>'+body+'</w:body></w:document>';

  var stylesXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    +'<w:docDefaults><w:rPrDefault><w:rPr>'
    +'<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>'
    +'<w:sz w:val="22"/><w:szCs w:val="22"/>'
    +'</w:rPr></w:rPrDefault></w:docDefaults>'
    +'<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/>'
    +'<w:tblPr><w:tblBorders>'
    +'<w:top w:val="single" w:sz="4" w:color="auto"/>'
    +'<w:left w:val="single" w:sz="4" w:color="auto"/>'
    +'<w:bottom w:val="single" w:sz="4" w:color="auto"/>'
    +'<w:right w:val="single" w:sz="4" w:color="auto"/>'
    +'<w:insideH w:val="single" w:sz="4" w:color="auto"/>'
    +'<w:insideV w:val="single" w:sz="4" w:color="auto"/>'
    +'</w:tblBorders></w:tblPr></w:style>'
    +'</w:styles>';

  var ctXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    +'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    +'<Default Extension="xml" ContentType="application/xml"/>'
    +'<Default Extension="png" ContentType="image/png"/>'
    +'<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    +'<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    +'</Types>';

  var relsXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
    +'</Relationships>';

  var docRelsXml='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    +'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    +'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    +(logoBytes?'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/fyh_logo.png"/>':"")
    +'</Relationships>';

  var zip=new JSZip();
  zip.file('[Content_Types].xml',ctXml);
  zip.folder('_rels').file('.rels',relsXml);
  var wf=zip.folder('word');
  wf.file('document.xml',docXml);
  wf.file('styles.xml',stylesXml);
  wf.folder('_rels').file('document.xml.rels',docRelsXml);
  if(logoBytes){wf.folder('media').file('fyh_logo.png',logoBytes,{binary:true});}
  zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})
    .then(function(blob){
      var a2=document.createElement('a');
      a2.href=URL.createObjectURL(blob);
      a2.download=(c.name||'Pelatis').replace(/\s+/g,'_')+'_WeeklyPlan.docx';
      a2.click();
    });
}


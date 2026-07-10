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
  var t=calcTDEE(c);
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  // Translation helpers
  function fn(name){return (isEn&&EN_FOOD_NAMES[name])||name;}       // food name
  function tMn(name){return (isEn&&EN_MEAL_NAMES[name])||name;}      // meal name
  function tu(u){return (isEn&&EN_UNITS[u])||u;}                      // unit label
  function tc(cat){return (isEn&&EN_CAT_NAMES[cat])||cat;}            // category name
  var goalL=isEn
    ?{mild:'Mild Weight Loss',loss:'Weight Loss',maintain:'Maintenance',gain:'Muscle Gain'}
    :{mild:'Ήπια απώλεια',loss:'Απώλεια βάρους',maintain:'Διατήρηση',gain:'Αύξηση μάζας'};
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

  var isMinorPdf=(c.age||0)<18;
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
      var fds=(weekPlanForPDF[dd]&&weekPlanForPDF[dd][mi])?weekPlanForPDF[dd][mi].foods:[];
      var mK=0;var ch='';
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
    tbody+='<td><b>'+Math.round(tK)+' kcal</b><br>'+(isEn?'P':'Π')+':'+Math.round(tP)+' '+(isEn?'F':'Λ')+':'+Math.round(tF)+' '+(isEn?'C':'Υ')+':'+Math.round(tC)+'g'
      +'<br><span style="color:#795548;font-size:9px">🌾 '+(isEn?'Fiber':'Ίνες')+':'+tFiPdf.toFixed(1)+'g</span></td>';
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
        sByT[ti.t].push(sx.name+(ti.d?' ('+ti.d+')':''));
      });
    });
    var sAny=false;SUPP_TIMINGS.forEach(function(tm){if(sByT[tm].length)sAny=true;});
    if(sAny){
      suppHtml='<div class="sec-title">'+(isEn?'Supplement Protocol':'Πρωτόκολλο Συμπληρωμάτων')+'</div>';
      suppHtml+='<table class="st"><thead><tr><th class="st-t">'+(isEn?'Timing':'Χρόνος Λήψης')+'</th><th>'+(isEn?'Supplements &amp; Dosage':'Συμπληρώματα &amp; Δοσολογία')+'</th></tr></thead><tbody>';
      var salt=false;
      SUPP_TIMINGS.forEach(function(tm){
        if(!sByT[tm].length)return;
        suppHtml+='<tr'+(salt?' class="alt"':'')+'><td class="st-t">'+esc(tm)+'</td><td>'+esc(sByT[tm].join('   •   '))+'</td></tr>';
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
        supplement:suppObj.name,
        dose:suppObj.dose||'(per product label)',
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
    var sp=(c.sport&&SPORT_PROTOCOLS[c.sport])?SPORT_PROTOCOLS[c.sport].hydration:null;
    if(sp){
      var labelMap=isEn
        ?{beforeMatch:'Before',preEx:'Before',duringEx:'During',duringMatch:'During',duringTraining:'During',postEx:'After',postMatch:'After',postTraining:'After'}
        :{beforeMatch:'Πριν',preEx:'Πριν',duringEx:'Κατά τη διάρκεια',duringMatch:'Κατά τη διάρκεια',duringTraining:'Κατά τη διάρκεια',postEx:'Μετά',postMatch:'Μετά',postTraining:'Μετά'};
      var order=['beforeMatch','preEx','duringEx','duringMatch','duringTraining','postEx','postMatch','postTraining'];
      var alt=false;
      order.forEach(function(k){
        if(sp[k]){rows+='<tr'+(alt?' class="alt"':'')+'><td class="st-t">'+labelMap[k]+'</td><td>'+esc(sp[k])+'</td></tr>';alt=!alt;}
      });
    }
    hydrationHtml='<div class="sec-title">💧 '+(isEn?'Hydration Protocol':'Πρωτόκολλο Ενυδάτωσης')+'</div>'
      +'<table class="st"><thead><tr><th class="st-t">'+(isEn?'Timing':'Χρόνος')+'</th><th>'+(isEn?'Amount':'Ποσότητα')+'</th></tr></thead><tbody>'+rows+'</tbody></table>';
  })();

  // ── Shopping list ────────────────────────────────────────────────────────────
  var shopHtml='';
  function shopRound(g){if(g<100)return Math.ceil(g/10)*10;if(g<500)return Math.ceil(g/25)*25;if(g<1000)return Math.ceil(g/50)*50;return Math.ceil(g/100)*100;}
  function shopDisp(g){if(g>=1000)return(Math.round(g/100)/10).toFixed(1)+' kg';return g+'g';}
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
    if(conv&&conv.isEgg){rawG=planG;buyDisp=Math.ceil(planG/55)+(isEn?' pcs.':' τεμ.');sublabel='('+planG+'g)';changed=true;}
    else if(conv){rawG=shopRound(planG*conv.f);buyDisp=shopDisp(rawG);sublabel=isEn?'raw':conv.label;changed=true;}
    else{rawG=shopRound(planG);buyDisp=shopDisp(rawG);sublabel='';changed=false;}
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
          +'<span class="sl-pg">'+shopDisp(item.planG)+'</span>'
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

  // ── Assemble HTML ─────────────────────────────────────────────────────────────
  var FF="'Century Gothic','Avant Garde',Avantgarde,'Trebuchet MS',Trebuchet,sans-serif";
  var html='<!DOCTYPE html><html lang="el"><head><meta charset="UTF-8">'
    +'<title>Πλάνο - '+esc(c.name||'Πελάτης')+'</title><style>'
    +'@page{size:A4 landscape;margin:0}'
    +'*{box-sizing:border-box;margin:0;padding:0}'
    +'body{font-family:'+FF+';font-size:6pt;color:#1a1a1a;padding:7mm}'
    +'.no-print{padding:6px;background:#f5f5f5;border-bottom:1px solid #ddd;display:flex;gap:10px;align-items:center;margin-bottom:8px;margin:-7mm -7mm 8px}'
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
      +'tr.meal-s td.mlbl{background:linear-gradient(135deg,#FFD166,#FFDF85);color:#333;border-left:none;border-radius:8px;}'
      +'tr.meal-b td.dcell{background:#FFF5F0;border:1px solid #FFD5C0;border-radius:8px;}'
      +'tr.meal-l td.dcell{background:#F0FEEE;border:1px solid #C0F0D8;border-radius:8px;}'
      +'tr.meal-d td.dcell{background:#F0F8FF;border:1px solid #BFD9F0;border-radius:8px;}'
      +'tr.meal-s td.dcell{background:#FFFBF0;border:1px solid #FFE8A0;border-radius:8px;}'
      +'table.mt{border-spacing:2px;}':'')
    +'.fr{line-height:1.22}'
    +'.fn{color:#1a1a1a;font-weight:700}'
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
    +'.fxname{font-weight:700;color:#1a1a1a;white-space:nowrap}'
    +'.fxpor{color:#555;white-space:nowrap}'
    +'.fxg{color:#025857;font-weight:700;text-align:center}'
    +'.fxk{color:#888;text-align:center}'
    +'.fxnote{font-size:5pt;color:#aaa;margin-bottom:4px}'
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
    +'.sl-nm{flex:1;font-weight:600;color:#1a1a1a}'
    +'.sl-pg{font-size:5pt;color:#ccc;flex-shrink:0}'
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
       +'<div style="font-size:13pt;font-weight:900;">'+esc(c.name||'Αθλητής')+'</div>'
       +'<div style="font-size:6.5pt;margin-top:2px;opacity:.9;">'+(c.sex==='M'?'Αγόρι':'Κορίτσι')+', '+c.age+' ετών &nbsp;·&nbsp; '+c.weight+'kg / '+c.height+'cm</div>'
       +'<div style="margin-top:5px;"><span style="background:rgba(255,255,255,.22);border-radius:20px;padding:2px 10px;font-size:7.5pt;font-weight:700;">🎯 '+avgTarget+' kcal (μέσο)</span></div>'
       +'</div>'
       +'<div style="text-align:right;">'
       +'<div style="background:#EEF9FF;border:2px solid #118AB2;border-radius:10px;padding:5px 9px;font-size:6.5pt;font-weight:700;color:#118AB2;">💧 '+t.hydBase+'ml<br><span style="font-weight:400;font-size:5.5pt;">+500ml προπόνηση</span></div>'
       +'</div>'
       +'</div>'
       // Sticker bar
       +'<div class="sticker-bar">'
       +(t.growthAdd>0?'<span class="sticker s-orange">🔥 Growth Allowance: +'+t.growthAdd+' kcal</span>':'')
       +(numTDays>0?'<span class="sticker s-green">💪 '+numTDays+' ημέρες προπόνηση</span>':'')
       +'<span class="sticker s-blue">🎯 '+avgTarget+' kcal (μέσο/week)</span>'
       +'<span class="sticker s-purple">📅 Εβδομαδιαίο Πλάνο</span>'
       +'</div>'
       +'<div class="week-banner">📆 &nbsp; Το πλάνο σου αυτή την εβδομάδα — δώσε τα δυνατά σου! 💪</div>'
      // ── ADULT HEADER ──
      :'<div class="hdr">'
       +'<div class="hl">'+(logoSrc?'<img src="'+logoSrc+'" alt="fyh">':'')+'<div class="hlurl">WWW.FEEDYOURHEALTH.ORG</div></div>'
       +'<div class="hr">'
       +'<div class="hrname">'+esc(c.name||'Πελάτης')+'</div>'
       +'<div class="hrinfo">'+esc((isEn?(c.sex==='M'?'Male':'Female'):(c.sex==='M'?'Άνδρας':'Γυναίκα'))+', '+c.age+(isEn?' yrs old':' ετών')+'  |  '+c.weight+'kg / '+c.height+'cm  |  '+(goalL[c.goal]||''))+'</div>'
       +'<div style="margin-top:3px;"><span style="background:#E8F5F4;border-radius:20px;padding:2px 10px;font-size:7pt;font-weight:700;color:#025857;">🎯 '+(isEn?'Goal: ':'Στόχος: ')+avgTarget+' kcal (avg)  ·  '+(isEn?'P':'Π')+':'+t.p+'g  '+(isEn?'F':'Λ')+':'+t.f+'g  '+(isEn?'C':'Υ')+':'+t.carb+'g</span></div>'
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
    +selectedSuppHtml
    +suppHtml
    +hydrationHtml
    +'<div class="shop-page">'+fxHtml+spicesHtml+(shopHtml?'</div><div class="shop-page">'+shopHtml:'')
    +'<div class="footer">'
    +(isMinorPdf
      ?'<span class="footer-msg">🌟 Συνέχισε έτσι — κάθε γεύμα σε φέρνει πιο κοντά στον στόχο σου!</span><span style="color:#aaa">Feed Your Health © 2025</span>'
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
  function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function blank(label,w){return '<div class="field" style="width:'+(w||'auto')+'"><div class="flbl">'+label+'</div><div class="fval"></div></div>';}
  function filled(label,val,w,col){return '<div class="field" style="width:'+(w||'auto')+'"><div class="flbl">'+label+'</div><div class="fval" style="'+(col?'color:'+col+';font-weight:700':'')+'">'+esc(val)+'</div></div>';}

  // Use latest tracker entry if available, else use client profile
  var entry=null;
  if(c.weightLog&&c.weightLog.length){
    var sorted=c.weightLog.slice().sort(function(a,b){return a.date<b.date?-1:1;});
    entry=sorted[sorted.length-1];
  }
  var today=new Date().toISOString().slice(0,10);
  var entryDate=entry?entry.date:today;
  var weight=entry?entry.weight:(c.weight||'—');
  var bf=entry&&entry.bf>0?entry.bf:(c.bf>0?c.bf:null);
  var lbm=bf?+(weight*(1-bf/100)).toFixed(1):null;
  var fm=bf?+(weight*bf/100).toFixed(1):null;
  var h=c.height||0;
  var bmi=h>0?+(weight/((h/100)*(h/100))).toFixed(1):null;
  var bmiCat=bmi?bmi<18.5?'Ελλιποβαρές':bmi<25?'Φυσιολογικό':bmi<30?'Υπέρβαρο':bmi<35?'Παχυσαρκία Ι':bmi<40?'Παχυσαρκία ΙΙ':'Παχυσαρκία ΙΙΙ':'—';
  var bmiCol=bmi?bmi<18.5?'#1565C0':bmi<25?'#2e7d32':bmi<30?'#f57c00':'#c62828':null;
  var isFem=(c.sex||'M')==='F';
  var waist=entry&&entry.waist?entry.waist:null;
  var hip=entry&&entry.hip?entry.hip:null;
  var arm=entry&&entry.arm?entry.arm:null;
  var whr=waist&&hip?+(waist/hip).toFixed(2):null;
  var whtr=waist&&h>0?+(waist/h).toFixed(2):null;

  // Skinfold raw data from latest entry
  var sfProto=entry&&entry.sfProtocol?entry.sfProtocol:null;
  var sfFields=entry&&entry.sfFields?entry.sfFields:{};
  var sfSum=sfProto?Object.values(sfFields).reduce(function(s,v){return s+v;},0):null;
  var sfProtoLabel={jp4:'Jackson & Pollock 4-site (1985)',jp3:'Jackson & Pollock 3-site',jp7:'Jackson & Pollock 7-site',slaughter:'Slaughter (1988)'};
  var sfNames={tricep:'Τρικέφαλος',subscapular:'Υποπλάτιο',abdomen:'Κοιλιά',suprailiac:'Υπερλαγόνιο',thigh:'Μηρός',chest:'Στήθος',midaxillary:'Μεσομάσχαλο',calf:'Γαστροκνήμιος'};

  // BF% category (ACSM)
  var bfCatLabel='—',bfCatCol='#555';
  if(bf){
    var bfRefs=isFem
      ?[{lo:10,hi:13,lbl:'Απαραίτητο',col:'#1565C0'},{lo:14,hi:20,lbl:'Αθλητικό',col:'#2e7d32'},{lo:21,hi:24,lbl:'Φυσιολογικό',col:'#558b2f'},{lo:25,hi:31,lbl:'Αποδεκτό',col:'#f57c00'},{lo:32,hi:60,lbl:'Παχυσαρκία',col:'#c62828'}]
      :[{lo:2,hi:5,lbl:'Απαραίτητο',col:'#1565C0'},{lo:6,hi:13,lbl:'Αθλητικό',col:'#2e7d32'},{lo:14,hi:17,lbl:'Φυσιολογικό',col:'#558b2f'},{lo:18,hi:24,lbl:'Αποδεκτό',col:'#f57c00'},{lo:25,hi:60,lbl:'Παχυσαρκία',col:'#c62828'}];
    bfRefs.forEach(function(r){if(bf>=r.lo&&bf<=r.hi){bfCatLabel=r.lbl;bfCatCol=r.col;}});
  }

  // Logo
  var logoSrc='';
  try{var lc=document.createElement('canvas');lc.width=80;lc.height=80;var lx=lc.getContext('2d');lx.fillStyle='#025857';lx.fillRect(0,0,80,80);lx.fillStyle='#fff';lx.font='bold 34px Georgia,serif';lx.textAlign='center';lx.textBaseline='middle';lx.fillText('fyh',40,40);logoSrc=lc.toDataURL('image/png');}catch(e){}

  var html='<!DOCTYPE html><html lang="el"><head><meta charset="UTF-8"><title>Έντυπο Λιπομέτρησης</title><style>'
    +'*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:8.5pt;color:#111;background:#fff;padding:8mm 10mm}'
    +'.hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #025857;padding-bottom:6px;margin-bottom:10px}'
    +'.brand{display:flex;align-items:center;gap:8px}.brand img{width:38px;height:38px;border-radius:6px}'
    +'.brand-name{font-size:14pt;font-weight:700;color:#025857;letter-spacing:1px}'
    +'.brand-url{font-size:7pt;color:#888}'
    +'.doc-title{text-align:right;font-size:11pt;font-weight:700;color:#025857}'
    +'.doc-date{font-size:7.5pt;color:#888}'
    +'.sec{margin-bottom:8px;border:1px solid #c5ddd8;border-radius:6px;overflow:hidden}'
    +'.sec-hdr{background:#025857;color:#fff;font-size:8pt;font-weight:700;padding:4px 8px;letter-spacing:.3px}'
    +'.sec-body{padding:7px 8px;display:flex;flex-wrap:wrap;gap:6px 14px}'
    +'.field{display:flex;flex-direction:column;min-width:70px}'
    +'.flbl{font-size:6.5pt;color:#888;text-transform:uppercase;letter-spacing:.3px;margin-bottom:1px}'
    +'.fval{font-size:9pt;font-weight:600;color:#111;border-bottom:1px solid #ccc;min-width:70px;padding-bottom:1px;min-height:15px}'
    +'.sf-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px 16px;padding:7px 8px}'
    +'.sf-item{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding:2px 0}'
    +'.sf-lbl{font-size:7.5pt;color:#444}'
    +'.sf-val{font-size:8.5pt;font-weight:700;color:#025857;min-width:50px;text-align:right}'
    +'.result-row{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:7px 8px}'
    +'.kpi{text-align:center;background:#f0f9f8;border-radius:6px;padding:6px 4px}'
    +'.kpi-lbl{font-size:6pt;color:#666;text-transform:uppercase;letter-spacing:.3px}'
    +'.kpi-val{font-size:13pt;font-weight:700;color:#025857;line-height:1.2;margin-top:1px}'
    +'.kpi-sub{font-size:6.5pt;margin-top:1px}'
    +'.ref-wrap{padding:6px 8px}'
    +'.ref-bar{display:flex;height:10px;border-radius:4px;overflow:hidden;margin-bottom:4px}'
    +'.ref-labels{display:flex;gap:8px;flex-wrap:wrap;font-size:6.5pt}'
    +'.notes-area{padding:6px 8px;min-height:36px}'
    +'.notes-line{border-bottom:1px solid #ddd;margin-bottom:8px;height:16px}'
    +'.footer{margin-top:8px;padding-top:4px;border-top:1px solid #c5ddd8;display:flex;justify-content:space-between;font-size:6.5pt;color:#888}'
    +'@media print{.no-print{display:none}}'
    +'</style></head><body>'
    +'<div class="no-print" style="margin-bottom:8px;display:flex;gap:8px;align-items:center">'
    +'<button onclick="window.print()" style="padding:6px 18px;background:#025857;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700">🖨️ Εκτύπωση / PDF</button>'
    +'<span style="font-size:11px;color:#666">Portrait · Χωρίς κεφαλίδες/υποσέλιδα</span></div>'
    // Header
    +'<div class="hdr">'
    +'<div class="brand">'+(logoSrc?'<img src="'+logoSrc+'" alt="FYH">':'')+'<div><div class="brand-name">FEED YOUR HEALTH</div><div class="brand-url">www.feedyourhealth.org</div></div></div>'
    +'<div><div class="doc-title">ΈΝΤΥΠΟ ΛΙΠΟΜΕΤΡΗΣΗΣ</div><div class="doc-date">Ημερομηνία: '+esc(entryDate)+'</div></div>'
    +'</div>'
    // Στοιχεία πελάτη
    +'<div class="sec"><div class="sec-hdr">ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ</div><div class="sec-body">'
    +filled('Ονοματεπώνυμο',c.name,'220px')
    +filled('Ηλικία',c.age?c.age+' έτη':'','60px')
    +filled('Φύλο',isFem?'Γυναίκα':'Άνδρας','75px')
    +filled('Ύψος',h?h+' cm':'','65px')
    +filled('Βάρος',weight?weight+' kg':'','65px')
    +(bmi?filled('ΔΜΣ',bmi+' kg/m²','80px')+filled('Κατηγορία ΔΜΣ',bmiCat,'90px',bmiCol):'')
    +'</div></div>'
    // Δερματοπτυχές
    +(sfProto?
      '<div class="sec"><div class="sec-hdr">ΔΕΡΜΑΤΟΠΤΥΧΕΣ &mdash; '+esc(sfProtoLabel[sfProto]||sfProto)+'</div>'
      +'<div class="sf-grid">'
      +Object.keys(sfFields).map(function(k,i){
        return '<div class="sf-item"><span class="sf-lbl">'+(i+1)+'. '+(sfNames[k]||k)+'</span><span class="sf-val">'+sfFields[k]+' mm</span></div>';
      }).join('')
      +'<div class="sf-item"><span class="sf-lbl" style="font-weight:700">Σύνολο</span><span class="sf-val" style="color:#111">'+Math.round(sfSum)+' mm</span></div>'
      +'</div></div>'
    :
      '<div class="sec"><div class="sec-hdr">ΔΕΡΜΑΤΟΠΤΥΧΕΣ — Jackson &amp; Pollock 4-site (1985)</div>'
      +'<div class="sf-grid">'
      +['1. Κοιλιά','2. Υπερλαγόνιο','3. Τρικέφαλος','4. Μηρός'].map(function(s){
        return '<div class="sf-item"><span class="sf-lbl">'+s+'</span><span class="sf-val" style="color:#ccc">_____ mm</span></div>';
      }).join('')
      +'<div class="sf-item"><span class="sf-lbl" style="font-weight:700">Σύνολο</span><span class="sf-val" style="color:#ccc">_____</span></div>'
      +'</div></div>'
    )
    // Αποτελέσματα
    +'<div class="sec"><div class="sec-hdr">ΑΠΟΤΕΛΕΣΜΑΤΑ ΣΩΜΑΤΙΚΗΣ ΣΥΝΘΕΣΗΣ</div>'
    +'<div class="result-row">'
    +(bf?'<div class="kpi"><div class="kpi-lbl">% Λίπους</div><div class="kpi-val" style="color:'+bfCatCol+'">'+bf+'%</div><div class="kpi-sub" style="color:'+bfCatCol+'">'+bfCatLabel+'</div></div>':'<div class="kpi"><div class="kpi-lbl">% Λίπους</div><div class="kpi-val" style="color:#ccc">—</div><div class="kpi-sub">&nbsp;</div></div>')
    +(lbm?'<div class="kpi"><div class="kpi-lbl">Άλιπη Μάζα (LBM)</div><div class="kpi-val" style="color:#1565C0">'+lbm+' kg</div><div class="kpi-sub">&nbsp;</div></div>':'<div class="kpi"><div class="kpi-lbl">Άλιπη Μάζα (LBM)</div><div class="kpi-val" style="color:#ccc">—</div><div class="kpi-sub">&nbsp;</div></div>')
    +(fm?'<div class="kpi"><div class="kpi-lbl">Λιπώδης Μάζα (FM)</div><div class="kpi-val" style="color:#e65100">'+fm+' kg</div><div class="kpi-sub">&nbsp;</div></div>':'<div class="kpi"><div class="kpi-lbl">Λιπώδης Μάζα (FM)</div><div class="kpi-val" style="color:#ccc">—</div><div class="kpi-sub">&nbsp;</div></div>')
    +(bmi?'<div class="kpi"><div class="kpi-lbl">ΔΜΣ</div><div class="kpi-val" style="color:'+bmiCol+'">'+bmi+'</div><div class="kpi-sub" style="color:'+bmiCol+'">'+bmiCat+'</div></div>':'<div class="kpi"><div class="kpi-lbl">ΔΜΣ</div><div class="kpi-val" style="color:#ccc">—</div><div class="kpi-sub">&nbsp;</div></div>')
    +'</div>'
    // Ref bar
    +'<div class="ref-wrap"><div style="font-size:6.5pt;color:#888;margin-bottom:3px">Τιμές αναφοράς %BF — ACSM ('+( isFem?'Γυναίκες':'Άνδρες')+')</div>'
    +'<div class="ref-bar">'
    +(isFem
      ?'<div style="flex:3;background:#1565C0;opacity:.75"></div><div style="flex:6;background:#2e7d32;opacity:.75"></div><div style="flex:3;background:#558b2f;opacity:.75"></div><div style="flex:6;background:#f57c00;opacity:.75"></div><div style="flex:10;background:#c62828;opacity:.75"></div>'
      :'<div style="flex:3;background:#1565C0;opacity:.75"></div><div style="flex:7;background:#2e7d32;opacity:.75"></div><div style="flex:3;background:#558b2f;opacity:.75"></div><div style="flex:6;background:#f57c00;opacity:.75"></div><div style="flex:8;background:#c62828;opacity:.75"></div>'
    )
    +'</div><div class="ref-labels">'
    +(isFem
      ?'<span><span style="display:inline-block;width:8px;height:8px;background:#1565C0;border-radius:2px;vertical-align:middle;opacity:.8;margin-right:2px"></span>Απαραίτητο 10-13%</span><span><span style="display:inline-block;width:8px;height:8px;background:#2e7d32;border-radius:2px;vertical-align:middle;opacity:.8;margin-right:2px"></span>Αθλητικό 14-20%</span><span><span style="display:inline-block;width:8px;height:8px;background:#558b2f;border-radius:2px;vertical-align:middle;opacity:.8;margin-right:2px"></span>Φυσιολογικό 21-24%</span><span><span style="display:inline-block;width:8px;height:8px;background:#f57c00;border-radius:2px;vertical-align:middle;opacity:.8;margin-right:2px"></span>Αποδεκτό 25-31%</span><span><span style="display:inline-block;width:8px;height:8px;background:#c62828;border-radius:2px;vertical-align:middle;opacity:.8;margin-right:2px"></span>Παχυσαρκία ≥32%</span>'
      :'<span><span style="display:inline-block;width:8px;height:8px;background:#1565C0;border-radius:2px;vertical-align:middle;opacity:.8;margin-right:2px"></span>Απαραίτητο 2-5%</span><span><span style="display:inline-block;width:8px;height:8px;background:#2e7d32;border-radius:2px;vertical-align:middle;opacity:.8;margin-right:2px"></span>Αθλητικό 6-13%</span><span><span style="display:inline-block;width:8px;height:8px;background:#558b2f;border-radius:2px;vertical-align:middle;opacity:.8;margin-right:2px"></span>Φυσιολογικό 14-17%</span><span><span style="display:inline-block;width:8px;height:8px;background:#f57c00;border-radius:2px;vertical-align:middle;opacity:.8;margin-right:2px"></span>Αποδεκτό 18-24%</span><span><span style="display:inline-block;width:8px;height:8px;background:#c62828;border-radius:2px;vertical-align:middle;opacity:.8;margin-right:2px"></span>Παχυσαρκία ≥25%</span>'
    )
    +'</div></div></div>'
    // Περιφέρειες
    +'<div class="sec"><div class="sec-hdr">ΠΕΡΙΦΕΡΕΙΕΣ &amp; ΔΕΙΚΤΕΣ</div><div class="sec-body">'
    +(waist?filled('Μέση',waist+' cm','70px'):blank('Μέση','70px'))
    +(hip?filled('Γοφοί',hip+' cm','70px'):blank('Γοφοί','70px'))
    +(arm?filled('Δικέφαλος',arm+' cm','80px'):blank('Δικέφαλος','80px'))
    +blank('Γαστροκν.','80px')
    +(whr?filled('WHR',whr,'60px',whr>(isFem?0.85:0.90)?'#c62828':'#2e7d32'):blank('WHR','60px'))
    +(whtr?filled('WHtR',whtr,'60px',whtr>0.5?'#f57c00':'#2e7d32'):blank('WHtR','60px'))
    +'</div></div>'
    // Σχόλια / Στόχοι
    +'<div class="sec"><div class="sec-hdr">ΣΧΟΛΙΑ &amp; ΣΤΟΧΟΙ</div>'
    +'<div class="notes-area"><div class="notes-line"></div><div class="notes-line"></div><div class="notes-line"></div></div></div>'
    // Footer
    +'<div class="footer">'
    +'<span>Feed Your Health &mdash; Έντυπο Λιπομέτρησης &nbsp;|&nbsp; Jackson &amp; Pollock (1985) &nbsp;|&nbsp; ACSM Reference Ranges</span>'
    +'<span>'+esc(c.name||'')+'&nbsp;&nbsp;Επόμενο ραντεβού: ________________</span>'
    +'</div></body></html>';

  var w=window.open('','_blank');
  if(!w){showErrorToast('Επέτρεψε τα pop-ups για να ανοίξει το PDF.');return;}
  w.document.write(html);w.document.close();
  setTimeout(function(){w.print();},600);
}

/* ── Body Composition PDF ─────────────────────────────────────────────────── */
function exportBodyCompPDF(){
  var c=getC();if(!c)return;
  if(!c.weightLog||!c.weightLog.length){showErrorToast('Δεν υπάρχουν εγγραφές tracker.');return;}
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  var sorted=c.weightLog.slice().sort(function(a,b){return a.date<b.date?-1:1;});
  var latest=sorted[sorted.length-1];
  var latestBF=latest.bf>0?latest.bf:null;
  var latestLBM=latestBF?+(latest.weight*(1-latestBF/100)).toFixed(1):null;
  var latestFM=latestBF?+(latest.weight*latestBF/100).toFixed(1):null;
  var today=new Date().toISOString().slice(0,10);
  var sex=c.sex||'M';
  var isFem=sex==='F';

  // ACSM Body Fat Reference Ranges by sex
  var bfRefs=isFem
    ?[{lbl:'Απαραίτητο',lo:10,hi:13,col:'#1565C0'},{lbl:'Αθλητικό',lo:14,hi:20,col:'#2e7d32'},{lbl:'Φυσιολογικό',lo:21,hi:24,col:'#558b2f'},{lbl:'Αποδεκτό',lo:25,hi:31,col:'#f57c00'},{lbl:'Παχυσαρκία',lo:32,hi:45,col:'#c62828'}]
    :[{lbl:'Απαραίτητο',lo:2,hi:5,col:'#1565C0'},{lbl:'Αθλητικό',lo:6,hi:13,col:'#2e7d32'},{lbl:'Φυσιολογικό',lo:14,hi:17,col:'#558b2f'},{lbl:'Αποδεκτό',lo:18,hi:24,col:'#f57c00'},{lbl:'Παχυσαρκία',lo:25,hi:45,col:'#c62828'}];
  // Find current category
  var bfCatLabel='—',bfCatCol='#555';
  if(latestBF){
    bfRefs.forEach(function(r){if(latestBF>=r.lo&&latestBF<=r.hi){bfCatLabel=r.lbl;bfCatCol=r.col;}});
  }

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
  var chartHtml='<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block;height:130px;border:1px solid #e0e0e0;border-radius:6px;background:#fafffe">'+svgContent+'</svg>';

  // ── History table ────────────────────────────────────────────────────────
  var protoLabel={jp4:'JP 4-site',jp3:'JP 3-site',jp7:'JP 7-site',slaughter:'Slaughter'};
  var sfFieldLabels={chest:'Στήθος',abdomen:'Κοιλιά',thigh:'Μηρός',tricep:'Τρικέφαλος',suprailiac:'Υπερλαγόνιο',midaxillary:'Μεσομάσχαλο',subscapular:'Υποπλάτιο',calf:'Γαστροκν.'};
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
  var refBarHtml='<div style="margin:10px 0 14px">';
  var totalRange=bfRefs[bfRefs.length-1].hi-bfRefs[0].lo;
  refBarHtml+='<div style="display:flex;height:12px;border-radius:4px;overflow:hidden;margin-bottom:4px">';
  bfRefs.forEach(function(r){
    var w=Math.round((r.hi-r.lo)/totalRange*100);
    refBarHtml+='<div style="flex:'+w+';background:'+r.col+';opacity:.7" title="'+r.lbl+'"></div>';
  });
  refBarHtml+='</div>';
  refBarHtml+='<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:6.5pt">';
  bfRefs.forEach(function(r){
    refBarHtml+='<span><span style="display:inline-block;width:8px;height:8px;background:'+r.col+';border-radius:2px;vertical-align:middle;margin-right:2px;opacity:.8"></span>'+r.lbl+' ('+r.lo+'–'+r.hi+'%)</span>';
  });
  refBarHtml+='</div></div>';

  // ── Logo ───────────────────────────────────────────────────────────────────
  var logoSrc='';
  try{var lc=document.createElement('canvas');lc.width=90;lc.height=90;var lx=lc.getContext('2d');lx.fillStyle='#e5e5e5';lx.fillRect(0,0,90,90);lx.fillStyle='#025857';lx.font='bold 40px Georgia,serif';lx.textAlign='center';lx.textBaseline='middle';lx.fillText('fyh',45,45);logoSrc=lc.toDataURL('image/png');}catch(e){}

  // ── Assemble HTML ──────────────────────────────────────────────────────────
  var html='<!DOCTYPE html><html lang="el"><head><meta charset="UTF-8">'
    +'<title>Σωματική Σύνθεση — '+esc(c.name||'Πελάτης')+'</title>'
    +'<style>'
    +'*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:8pt;color:#1a1a1a;padding:10mm 12mm;background:#fff}'
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
    +'@media print{.no-print{display:none}}'
    +'</style></head><body>'
    +'<div class="no-print" style="margin-bottom:10px">'
    +'<button onclick="window.print()" style="padding:6px 18px;background:#025857;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700">🖨️ Εκτύπωση / PDF</button>'
    +'<span style="font-size:11px;color:#666;margin-left:10px">Επίλεξε <b>Portrait</b> και <b>απενεργοποίησε</b> κεφαλίδες/υποσέλιδα</span>'
    +'</div>'
    // Header
    +'<div class="hdr">'
    +'<div style="display:flex;align-items:center">'
    +(logoSrc?'<img src="'+logoSrc+'" class="hdr-logo" alt="fyh">':'')
    +'<div><div class="hdr-name">'+esc(c.name||'Πελάτης')+'</div>'
    +'<div class="hdr-info">'+esc((isFem?'Γυναίκα':'Άνδρας')+' · '+c.age+' ετών · '+c.weight+'kg · '+c.height+'cm')+'</div>'
    +'</div></div>'
    +'<div class="hdr-date"><b>Feed Your Health</b><br>WWW.FEEDYOURHEALTH.ORG<br>Τελευταία ανανέωση: '+today+'</div>'
    +'</div>'
    // KPIs
    +'<div class="sec-title">Τελευταία Μέτρηση &nbsp;<span style="font-size:7.5pt;font-weight:400;color:#888">'+esc(latest.date)+'</span></div>'
    +'<div class="kpi-row">'
    +'<div class="kpi"><div class="kpi-lbl">Βάρος</div><div class="kpi-val">'+latest.weight+' kg</div><div class="kpi-sub">&nbsp;</div></div>'
    +(latestBF?'<div class="kpi cat"><div class="kpi-lbl">Λίπος σώματος</div><div class="kpi-val">'+latestBF+'%</div><div class="kpi-sub">'+bfCatLabel+'</div></div>':'')
    +(latestLBM?'<div class="kpi"><div class="kpi-lbl">Άλιπη μάζα (LBM)</div><div class="kpi-val" style="color:#1565C0">'+latestLBM+' kg</div><div class="kpi-sub">&nbsp;</div></div>':'')
    +(latestFM?'<div class="kpi"><div class="kpi-lbl">Λιπώδης μάζα (FM)</div><div class="kpi-val" style="color:#e65100">'+latestFM+' kg</div><div class="kpi-sub">&nbsp;</div></div>':'')
    +(latest.waist?'<div class="kpi"><div class="kpi-lbl">Μέση</div><div class="kpi-val">'+latest.waist+' cm</div><div class="kpi-sub">&nbsp;</div></div>':'')
    +'</div>'
    // Chart
    +(sorted.length>=2?'<div class="sec-title">Πορεία Βάρους & %BF</div>'+chartHtml+'<div class="legend">'
      +'<svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="#025857" stroke-width="2.5"/></svg><span>Βάρος (kg) — αριστερός άξονας</span>'
      +(hasBF?'<svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="#1565C0" stroke-width="2" stroke-dasharray="5,3"/></svg><span>Λίπος σώματος (%) — δεξί άξονας</span>':'')
      +'</div>':'')
    // Ref ranges
    +'<div class="sec-title">Τιμές Αναφοράς %BF &nbsp;<span style="font-size:7pt;font-weight:400;color:#888">ACSM (American College of Sports Medicine)</span></div>'
    +refBarHtml
    // History table
    +'<div class="sec-title">Ιστορικό Μετρήσεων</div>'
    +'<table><thead><tr><th>Ημερομηνία</th><th>Βάρος</th><th>%BF</th><th>LBM</th><th>FM</th><th>Μέση</th><th>Γοφοί</th></tr></thead>'
    +'<tbody>'+tblRows+'</tbody></table>'
    +'<div style="font-size:6.5pt;color:#aaa;margin-top:4px">📐 = μέτρηση με δερματοπτυχόμετρο · JP 4-site: Jackson &amp; Pollock (1985) · JP 3-site / JP 7-site: Jackson &amp; Pollock (1978/1980) · Slaughter: Slaughter et al. (1988)</div>'
    // Footer
    +'<div class="footer"><span>Feed Your Health — Εργαλείο Διαιτολόγου</span><span>'+esc(c.name||'')+'  ·  Εκτυπώθηκε: '+today+'</span></div>'
    +'</body></html>';

  var w=window.open('','_blank');
  if(!w){showErrorToast('Επέτρεψε τα pop-ups για να ανοίξει το PDF.');return;}
  w.document.write(html);w.document.close();
  setTimeout(function(){w.print();},600);
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
  content.style.cssText='background:#fff;border-radius:8px;padding:20px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3)';

  var html='<h2 style="color:#d32f2f;margin-top:0">🔧 Debug Panel - Error Reporting</h2>';
  html+='<div style="margin-bottom:15px;padding:10px;background:#f5f5f5;border-radius:4px;font-size:12px">';
  html+='<strong>Summary:</strong> Errors: '+audit.total.errors+' | Warnings: '+audit.total.warnings+' | Infos: '+audit.total.infos+'</div>';

  // Errors
  if(audit.errors.length>0){
    html+='<h3 style="color:#d32f2f;font-size:13px;margin-top:15px">❌ Errors ('+audit.errors.length+')</h3>';
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
    html+='<h3 style="color:#ff9800;font-size:13px;margin-top:15px">⚠️ Warnings ('+audit.warnings.length+')</h3>';
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
  html+='<button onclick="LOGGER.clear();alert(\'Logs cleared\');document.getElementById(\\\'debug-modal\\\').remove()" style="flex:1;padding:8px;background:#4caf50;color:white;border:none;border-radius:4px;cursor:pointer">Clear Logs</button>';
  html+='<button onclick="var txt=LOGGER.exportLogs();var a=document.createElement(\'a\');a.href=\'data:text/plain,\'+encodeURIComponent(txt);a.download=\'debug_'+new Date().toISOString().slice(0,10)+'.txt\';a.click()" style="flex:1;padding:8px;background:#2196f3;color:white;border:none;border-radius:4px;cursor:pointer">Export Logs</button>';
  html+='<button onclick="document.getElementById(\'debug-modal\').remove()" style="flex:1;padding:8px;background:#999;color:white;border:none;border-radius:4px;cursor:pointer">Close</button>';
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
  box.style.cssText='background:#fff;border-radius:14px;max-width:760px;width:100%;padding:22px 24px;box-shadow:0 8px 40px rgba(0,0,0,.25);position:relative;font-family:inherit';
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
    +' | '+escRtf(goalL[c.goal])
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
      var foods=(c.weekPlan[d]&&c.weekPlan[d][mi])?c.weekPlan[d][mi].foods:[];
      var mK=0,cc='';
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
    +'<w:r>'+rp(false,17,CG)+'<w:t xml:space="preserve">'+xe((c.sex==='M'?'Άνδρας':'Γυναίκα')+', '+c.age+' ετών  |  '+c.weight+'kg / '+c.height+'cm  |  '+(goalL[c.goal]||''))+'</w:t></w:r>'
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
  function shopRound(g){
    if(g<100)return Math.ceil(g/10)*10;
    if(g<500)return Math.ceil(g/25)*25;
    if(g<1000)return Math.ceil(g/50)*50;
    return Math.ceil(g/100)*100;
  }
  function shopDisp(g){
    if(g>=1000)return (Math.round(g/100)/10).toFixed(1)+' kg';
    return g+'g';
  }

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

// ── Cloud Integration: legacy localStorage key prefix ─────────────────────────────────────────────
// cloudUsername/getStorageKey were fed by a postMessage('CLOUD_USER', ...) listener from the old
// app_wrapper.html iframe prototype (deleted 2026-07-03, see [[dietologist-cloud-supabase]] memory —
// real auth is Supabase now, window.Cloud). Nothing in the app ever sends that postMessage anymore,
// so cloudUsername was always null in practice; the listener + its loadCloudData() re-load (which
// reassigned the whole global `clients` array with no re-validation of curId/open client — a real
// stale-object race if it ever DID fire) were removed 2026-07-10 as confirmed-dead code. getStorageKey
// itself is kept since safeStorageGet/safeStorageSet (js/app-part1.js) still call it on every read/write.
var cloudUsername = null;

function getStorageKey(baseKey) {
  if (cloudUsername) {
    return 'cloud_' + cloudUsername + '_' + baseKey;
  }
  return baseKey;
}

// ── Auto-load from localStorage on startup ───────────────────────────────────
(function(){
  // Load custom templates
  var parsedCt = safeStorageGet('fyh_custom_tmpls', null);
  if(Array.isArray(parsedCt)) customTemplates = parsedCt;

  // Load clients data
  var d = safeStorageGet('fyh_clients', null);
  if(Array.isArray(d) && d.length){
    clients = d;
    // Migrate: ensure new fields exist on old client objects
    clients.forEach(function(c){
      if(!c.metActivities)c.metActivities=[];
      if(!c.weightLog)c.weightLog=[];
      if(!c.consultLog)c.consultLog=[];
      migrateClientSkinfoldBF(c);
      if(c.macroP==null)c.macroP=25;
      if(c.macroF==null)c.macroF=25;
      if(c.macroC==null)c.macroC=50;
      if(!c.macroPreset)c.macroPreset='balanced';
      if(!c.suppExclude)c.suppExclude=[];
      if(!c.foodExclude)c.foodExclude=[];
      if(c.selectedTemplate===undefined)c.selectedTemplate=null;
    });
    renderSB();
  }
})();


/* Recipe Modal Display */
function showRecipeModal(foodName){
  var food=FOODS[foodName];
  var rxModal=(typeof FYH_RECIPE_EXPAND!=='undefined')&&FYH_RECIPE_EXPAND[foodName];
  if((!food||!food.ingredients)&&!rxModal){showErrorToast('Δεν υπάρχουν συστατικά για αυτό το τρόφιμο');return;}

  var modal=document.getElementById('recipe-modal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='recipe-modal';
    modal.className='recipe-modal hidden';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    document.body.appendChild(modal);
  }

  var ingHtml='';
  if(food&&food.ingredients){
    food.ingredients.forEach(function(ing){
      var prep=ing.prep?' <span class="recipe-ingredient-prep">('+ing.prep+')</span>':'';
      var unit=ing.unit?' '+ing.unit:'';
      var size=ing.size?' '+ing.size:'';
      ingHtml+='<div class="recipe-ingredient-row">'
        +'<span class="recipe-ingredient-name">'+ing.item+'</span>'
        +'<span class="recipe-ingredient-qty">'+ing.qty+unit+size+'</span>'
        +prep
        +'</div>';
    });
  } else if(rxModal){
    // FYH/expandable recipe → derive readable list from its ingredients (name + grams)
    rxModal.ing.forEach(function(ing){
      ingHtml+='<div class="recipe-ingredient-row">'
        +'<span class="recipe-ingredient-name">'+ing.n+'</span>'
        +'<span class="recipe-ingredient-qty">'+ing.g+'g</span>'
        +'</div>';
    });
  }

  var timeHtml=(food&&food.time)?'<div class="recipe-time">⏱️ Χρόνος: '+food.time+'</div>':'';

  modal.innerHTML='<div class="recipe-modal-content">'
    +'<div class="recipe-modal-title">'
    +'<span>'+foodName+'</span>'
    +'<button class="recipe-modal-close" onclick="closeRecipeModal()">&times;</button>'
    +'</div>'
    +'<div class="recipe-ingredients">'+ingHtml+'</div>'
    +timeHtml
    +'</div>';

  modal.classList.remove('hidden');
  modal.addEventListener('click',function(e){
    if(e.target===modal)closeRecipeModal();
  });
}

function closeRecipeModal(){
  var modal=document.getElementById('recipe-modal');
  if(modal)modal.classList.add('hidden');
}

/* Micronutrients Modal */
function openMicroModal(){
  var c=getC();
  if(!c||!c.weekPlan){
    showErrorToast('Δημιουργήστε πρώτα ένα πλάνο');
    return;
  }

  var modal=document.getElementById('micro-modal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='micro-modal';
    modal.className='micro-modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    document.body.appendChild(modal);
  }

  var microHtml=getMicronutrientHtml(c);
  modal.innerHTML='<div class="micro-modal-content">'
    +'<div class="micro-modal-header">'
    +'<h2 style="margin:0;color:#025857;">📊 Μικροθρεπτικά & Κρίσιμες Στόχοι</h2>'
    +'<button onclick="closeMicroModal()" style="background:#ff6b35;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;color:white;font-weight:bold;font-size:14px;padding:8px 12px;">✕ Κλείσιμο</button>'
    +'</div>'
    +'<div id="micro-modal-content" style="overflow-y:auto;max-height:calc(85vh - 80px);">'+microHtml+'</div>'
    +'</div>';

  modal.style.display='flex';
  modal.addEventListener('click',function(e){
    if(e.target===modal)closeMicroModal();
  });
}

function closeMicroModal(){
  var modal=document.getElementById('micro-modal');
  if(modal)modal.style.display='none';
}

/* Toggle supplement checkbox - custom checkbox handler */
function toggleSuppCheckbox(containerEl){
  var suppId=containerEl.getAttribute('data-supp-id');
  var checkbox=document.getElementById(suppId);
  if(!checkbox)return;

  // Toggle the checkbox
  checkbox.checked=!checkbox.checked;

  // Get current state
  var isChecked=checkbox.checked;

  // Update visual appearance
  var checkboxDiv=containerEl.querySelector('.supp-visual-checkbox');
  if(checkboxDiv){
    // Update checkmark
    if(isChecked){
      if(!checkboxDiv.querySelector('span')){
        var checkmark=document.createElement('span');
        checkmark.style.cssText='width:14px;height:14px;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;';
        checkmark.textContent='✓';
        checkboxDiv.appendChild(checkmark);
      }
      checkboxDiv.style.background='#025857';
    } else {
      var checkmark=checkboxDiv.querySelector('span');
      if(checkmark)checkmark.remove();
      checkboxDiv.style.background='white';
    }
  }

  // Update border color based on checkbox state
  var borderColor=isChecked?'#4caf50':'#ff6b35';
  containerEl.style.borderLeftColor=borderColor;
}

/* Supplement Suggestions Modal */
function openSupplementModal(){
  try {
    var c=getC();
    if(!c || !c.weekPlan){
      showErrorToast('Δημιουργήστε πρώτα ένα πλάνο');
      return;
    }

    console.log('[DEBUG] openSupplementModal - Client loaded, weekPlan exists');

    var modal=document.getElementById('supp-modal');
    if(!modal){
      modal=document.createElement('div');
      modal.id='supp-modal';
      modal.className='supp-modal';
      modal.setAttribute('role','dialog');
      modal.setAttribute('aria-modal','true');
      document.body.appendChild(modal);
      console.log('[DEBUG] openSupplementModal - Modal div created');
    }

    // ═════ GENERATE DYNAMIC RECOMMENDATIONS FROM GAP ANALYSIS ═════
    console.log('[DEBUG] openSupplementModal - Calling getWeekMicronutrients');
    var weekAnalysis=getWeekMicronutrients(c.weekPlan);
    console.log('[DEBUG] openSupplementModal - weekAnalysis:', weekAnalysis);

    console.log('[DEBUG] openSupplementModal - Calling detectMicronutrientGaps');
    var gaps=detectMicronutrientGaps(weekAnalysis, c);
    console.log('[DEBUG] openSupplementModal - gaps detected:', gaps);

    console.log('[DEBUG] openSupplementModal - Calling matchSupplementsToGaps');
    var gapBasedRecs=matchSupplementsToGaps(gaps, SUPPS);
    console.log('[DEBUG] openSupplementModal - gapBasedRecs:', gapBasedRecs);

    // ═════ COMBINE WITH STATIC RECOMMENDATIONS ═════
    console.log('[DEBUG] openSupplementModal - Calling buildDynamicSupplementHtml');
    var suppHtml=buildDynamicSupplementHtml(c, gapBasedRecs, gaps);
    console.log('[DEBUG] openSupplementModal - HTML built, length:', suppHtml.length);

    modal.innerHTML='<div class="supp-modal-content">'
      +'<div class="supp-modal-header">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">'
      +'<div>'
      +'<h2 style="margin:0;color:#025857;">💊 Προτάσεις Συμπληρωμάτων (Βάσει Ανάλυσης)</h2>'
      +'<p style="font-size:11px;color:#666;margin:4px 0 0;">Συνιστώμενα βάσει ανάλυσης του πλάνου — συνδυάζονται στο PDF με όσα ήδη παίρνει ο πελάτης (Tab 1, «💊 Συμπληρώματα»).</p>'
      +'</div>'
      +'<button onclick="closeSupplementModal()" style="background:#025857;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;color:white;font-weight:bold;font-size:14px;white-space:nowrap;">✕ Κλείσιμο</button>'
      +'</div>'
      +'</div>'
      +'<div id="supp-modal-content" style="overflow-y:auto;max-height:calc(85vh - 120px);">'+suppHtml+'</div>'
      +'</div>';

    console.log('[DEBUG] openSupplementModal - Modal innerHTML set');

    modal.style.display='flex';
    console.log('[DEBUG] openSupplementModal - Modal display set to flex');

    modal.addEventListener('click',function(e){
      if(e.target===modal)closeSupplementModal();
    });

    console.log('[DEBUG] openSupplementModal - COMPLETE - Modal should be visible');
  } catch(err) {
    console.error('[ERROR] openSupplementModal failed:', err.message);
    console.error('[ERROR] Stack:', err.stack);
    showErrorToast('Σφάλμα κατά το άνοιγμα του προτάσεων συμπληρωμάτων: ' + err.message);
  }
}

function closeSupplementModal(){
  var modal=document.getElementById('supp-modal');
  if(modal)modal.style.display='none';
}

// Save selected supplements to client
function saveSupplementSelection(){
  var c=getC();
  if(!c){
    showErrorToast('Δημιουργήστε πρώτα ένα πλάνο');
    return;
  }

  // Get all checked checkboxes
  var checkboxes=document.querySelectorAll('#supp-modal input[type="checkbox"]:checked');
  var selectedSupps=[];

  checkboxes.forEach(function(cb){
    var parent=cb.closest('div');
    var label=parent.querySelector('label');
    var infoDiv=parent.querySelector('div');

    if(label && infoDiv){
      var suppName=label.textContent.split(' - ')[0].trim();
      var doseText=label.textContent.split(' - ')[1]||'';
      var infoText=infoDiv.textContent;

      selectedSupps.push({
        supplement: suppName,
        dose: doseText,
        info: infoText
      });
    }
  });

  if(selectedSupps.length===0){
    showErrorToast('Επιλέξτε τουλάχιστον ένα συμπλήρωμα');
    return;
  }

  // ✅ Merge instead of overwrite: this modal only lists gap-based recommendation candidates
  // (checked or not, all under #supp-modal input[type=checkbox]), so keep whatever the "already
  // taking" modal (Tab 1, "💊 Συμπληρώματα") saved for names outside that candidate set —
  // otherwise saving here would silently wipe those out of c.selectedSupplements.
  var allCandidateNames=[];
  document.querySelectorAll('#supp-modal input[type="checkbox"]').forEach(function(cb){
    var parent=cb.closest('div');
    var label=parent.querySelector('label');
    if(label) allCandidateNames.push(label.textContent.split(' - ')[0].trim());
  });
  var keepFromOther=(c.selectedSupplements||[]).filter(function(s){
    return allCandidateNames.indexOf(s.supplement)===-1;
  });

  // Save to client
  c.selectedSupplements=keepFromOther.concat(selectedSupps);
  save();

  // Show success message
  showSuccessToast('✅ Επιλογή αποθηκεύτηκε! ' + selectedSupps.length + ' συμπληρώματα θα εμφανιστούν στο PDF.');

  // Close modal and update display
  closeSupplementModal();
  renderWeekTable();
}

// ══════════════════════════════════════════════════════════════════════════════
// STRATEGY A: TWO-LEVEL SUPPLEMENT SYSTEM - Helper function to get supplement names
// ══════════════════════════════════════════════════════════════════════════════
function getSupplementNameFromId(suppId){
  var supp=SUPPS.find(function(s){return s.id===suppId;});
  return supp ? supp.name : '';
}

// ══════════════════════════════════════════════════════════════════════════════
// BUILD DYNAMIC SUPPLEMENT RECOMMENDATIONS FROM GAP ANALYSIS
// ══════════════════════════════════════════════════════════════════════════════
function buildDynamicSupplementHtml(c, gapBasedRecs, gaps){
  var html='';
  var savedSupps=c.selectedSupplements||[];

  // STRATEGY A: Get currently taken supplements (Page 1)
  var currentSupps=c.supps||[];
  var currentSuppNames={};
  currentSupps.forEach(function(suppId){
    var name=getSupplementNameFromId(suppId);
    if(name) currentSuppNames[name]=suppId;
  });

  // STRATEGY A: Show current supplements summary
  if(currentSupps.length > 0){
    html += '<div style="background:#e8f5e9;border-left:4px solid #4caf50;padding:12px;margin-bottom:15px;border-radius:4px;">';
    html += '<h4 style="color:#2e7d32;margin-top:0;margin-bottom:8px;">✓ Συμπληρώματα που παίρνετε ήδη</h4>';
    var currentSuppsList=currentSupps.map(function(id){return getSupplementNameFromId(id);}).filter(function(n){return n;}).join(', ');
    html += '<p style="font-size:12px;color:#555;margin:0;">'+currentSuppsList+'</p>';
    html += '</div>';
  }

  // SECTION 1: GAP-BASED RECOMMENDATIONS (from actual meal plan analysis)
  html += '<div style="background:#fff3e0;border-left:4px solid #e65100;padding:15px;margin-bottom:20px;border-radius:4px;">';
  html += '<h3 style="color:#e65100;margin-top:0;">🎯 Προτάσεις Βάσει Ανάλυσης Διατροφής</h3>';
  html += '<p style="font-size:12px;color:#666;margin-bottom:10px;">Επιλέξτε ποια συμπληρώματα θέλετε να συστήσετε στο PDF (⭐ = παίρνετε ήδη):</p>';

  if(gapBasedRecs.length > 0){
    gapBasedRecs.forEach(function(rec, idx){
      // STRATEGY A: Check if this recommendation overlaps with current supplements
      var alreadyTaking=rec.supplement && currentSuppNames.hasOwnProperty(rec.supplement);

      var suppId='supp_'+idx;
      var isChecked=savedSupps.some(function(s){return s.supplement===rec.supplement;});
      var borderColor=alreadyTaking?'#4caf50':'#ff6b35';

      // Build the container
      html += '<div data-supp-id="'+suppId+'" style="padding:10px;background:white;margin-bottom:10px;border-radius:4px;border-left:3px solid '+borderColor+';display:flex;align-items:center;gap:12px;'+(alreadyTaking?'opacity:0.8;':'')+'transition:border-color 0.2s;cursor:pointer;" onclick="toggleSuppCheckbox(this)">';

      // Hidden native checkbox for form submission
      html += '<input type="checkbox" id="'+suppId+'" '+( isChecked ? 'checked' : '')+' style="display:none;" class="supp-checkbox">';

      // Custom visible checkbox
      html += '<div class="supp-visual-checkbox" style="flex-shrink:0;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:2px solid '+(alreadyTaking?'#4caf50':'#025857')+';border-radius:4px;background:'+(isChecked?'#025857':'white')+';transition:all 0.2s;position:relative;">';
      if(isChecked) html += '<span style="width:14px;height:14px;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">✓</span>';
      html += '</div>';

      // Content
      html += '<div style="flex:1;min-width:0;">';
      html += '<div style="cursor:pointer;font-weight:bold;color:'+(alreadyTaking?'#2e7d32':'#e65100')+';font-size:13px;display:block;user-select:none;margin-bottom:4px;">';
      html += rec.supplement + ' - ' + rec.recommendedDose + rec.unit;
      if(alreadyTaking) html += ' <span style="background:#e8f5e9;color:#2e7d32;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:600;margin-left:6px;">⭐ Παίρνετε ήδη</span>';
      html += '</div>';
      html += '<div style="font-size:11px;color:#666;margin-top:3px;">';
      html += '📊 Στόχος: ' + rec.nutrient + ' | Ελλείπει: ' + rec.gap.toFixed(1) + rec.unit;
      html += ' (έχετε ' + rec.actual.toFixed(1) + '/' + rec.target + ')';
      html += '</div>';
      if(rec.timing){
        html += '<div style="font-size:11px;color:#666;margin-top:2px;">⏰ ' + rec.timing.t + '</div>';
      }
      if(rec.interactions && rec.interactions.length > 0){
        html += '<div style="font-size:11px;color:#d32f2f;margin-top:2px;">⚠️ Λάβετε σε διαφορετικές ώρες (2+ ώρες): ' + rec.interactions.join(', ') + '</div>';
      }
      if(alreadyTaking){
        html += '<div style="font-size:11px;background:#c8e6c9;color:#2e7d32;padding:4px 6px;margin-top:4px;border-radius:3px;">ℹ️ Αυτό το συμπλήρωμα είναι ήδη στο σχέδιό σας από τη Σελίδα 1</div>';
      }
      html += '</div></div>';
    });
  } else {
    html += '<div style="padding:10px;background:#e8f5e9;border-radius:4px;color:#2e7d32;font-size:12px;">';
    html += '✅ Εξαιρετική κάλυψη! Δεν εντοπίστηκαν σημαντικές ελλείψεις στη διατροφή σας.';
    html += '</div>';
  }

  html += '</div>';

  // SECTION 2: GENERAL GUIDELINES (based on diet type)
  html += '<div style="background:#f5f5f5;padding:15px;border-radius:4px;margin-bottom:20px;">';
  html += '<h3 style="color:#666;margin-top:0;">📖 Γενικές Κατευθυντήριες (Τύπος Διατροφής)</h3>';

  // Add static recommendations from getSupplementRecommendations
  var staticRecs = getSupplementRecommendations(c);
  html += staticRecs;

  html += '</div>';

  // SECTION 3: SAVE SELECTION BUTTON
  html += '<div style="background:#E2EEE5;padding:15px;border-radius:4px;border-left:4px solid #025857;">';
  html += '<button onclick="saveSupplementSelection()" style="background:#025857;color:white;padding:12px 20px;border:none;border-radius:5px;cursor:pointer;font-weight:bold;font-size:14px;width:100%;margin-bottom:10px;">';
  html += '✅ Αποθήκευση Επιλογής στο Πλάνο';
  html += '</button>';
  html += '<p style="font-size:11px;color:#666;margin:0;">Τα επιλεγμένα συμπληρώματα θα εμφανιστούν στο PDF εξαγωγή και στο πλάνο διατροφής.</p>';
  html += '</div>';

  return html;
}

// Identify red meat recipes
function isRedMeat(mealName, mealFoods){
  if(!mealName || !mealFoods)return false;

  var redMeatKeywords = ['Μοσχάρι','Αρνί','Χοιρινό','Κιμάς','Beef','Lamb','Pork'];
  var mealStr = mealName + ' ' + JSON.stringify(mealFoods);

  return redMeatKeywords.some(function(keyword){
    return mealStr.includes(keyword);
  });
}

// Check and enforce red meat frequency (MAX 2x/week)
function enforceRedMeatFrequency(weekPlan, excl, dietType){
  var redMeatCount = 0;
  var redMeatMeals = [];
  excl = excl || [];

  // Count red meat meals
  for(var d=0;d<7;d++){
    if(weekPlan[d]){
      for(var mi=0;mi<weekPlan[d].length;mi++){
        var meal = weekPlan[d][mi];
        if(isRedMeat(meal.name, meal.foods)){
          redMeatCount++;
          redMeatMeals.push({day:d, index:mi, mealName:meal.name});
        }
      }
    }
  }

  // If > 2, replace excess with chicken/fish alternatives (respecting exclusions)
  if(redMeatCount > 2){
    var excessCount = redMeatCount - 2;
    var replacedCount = 0;

    // Replace from the last red meat meals backwards
    for(var i=redMeatMeals.length-1; i>=0 && replacedCount<excessCount; i--){
      var mealLoc = redMeatMeals[i];
      var meal = weekPlan[mealLoc.day][mealLoc.index];

      // meal.kcal isn't a stored field on weekPlan meal objects — compute it from the actual foods,
      // otherwise findBestRecipe's calorie-match compares against undefined (NaN) and never matches anything.
      var mealKcal = (meal.foods||[]).reduce(function(sum,f){ return sum + cm(f.n,f.g).k; }, 0);

      // Find alternative chicken or fish recipe with similar calories, respecting exclusions.
      // MUST use the client's actual dietType, not a hardcoded 'normal' — otherwise a keto client
      // (who legitimately eats red meat >2x/week; this cap is a general cardiovascular guideline,
      // not a keto rule) gets "fixed" straight out of ketosis with a high-carb normal-diet recipe
      // (confirmed live: swapped in a 62g-carb shrimp-orzo dish and a 39g-carb pita souvlaki).
      var altRecipe = findBestRecipe(dietType||'normal', mealKcal, meal.name, excl);
      if(altRecipe && !isRedMeat(altRecipe.name, altRecipe.foods)){
        meal.foods = altRecipe.foods;
        meal.name = altRecipe.name;
        meal.recipeId = altRecipe.id;
        replacedCount++;
        console.log('Red meat limit: Replaced ' + mealLoc.mealName + ' with ' + altRecipe.name);
      }
    }

    console.log('Red meat frequency: ' + redMeatCount + ' → Max 2. Replaced ' + replacedCount);
  }

  return weekPlan;
}

// Regenerate plan with tracking
function regeneratePlan(){
  var c=getC();
  if(!c || !TRACKING_DATA.plans.length)return;
  var errors=validateClientData(c);
  if(errors.length>0){ showValidationErrors(errors); return; }
  pregnancyBlockCheck(c, function(){
    // Find and mark the last plan as regenerated (negative signal)
    var lastPlanIndex = TRACKING_DATA.plans.length - 1;
    logRegenerate(lastPlanIndex);

    // Generate new plan (through undo/redo so this regeneration can be undone too)
    var oldPlan = deepClone(c.weekPlan);
    if(window.undoRedoManager && typeof GeneratePlanCommand !== 'undefined'){
      var cmd = new GeneratePlanCommand(c, oldPlan);
      window.undoRedoManager.execute(cmd);
    } else {
      genPlan();
    }
    showErrorToast('Το σχέδιο δημιουργήθηκε ξανά. Το σύστημα θα μάθει από αυτό!');
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// BEHAVIORAL TRACKING SYSTEM — Learning from your usage patterns
// ══════════════════════════════════════════════════════════════════════════════

// Data structure for tracking - ✅ MOVED TO TOP OF FILE FOR EARLY INITIALIZATION
// var TRACKING_DATA = { ... } - Already initialized earlier in the script

// Load tracking data from localStorage
function loadTrackingData(){
  var stored = safeStorageGet('dietologist_tracking', null);
  if(stored && typeof stored === 'object'){
    TRACKING_DATA = stored;
  } else {
    TRACKING_DATA = { plans: [], recipes: {}, patterns: {}, lastUpdated: null };
  }
}

// Save tracking data to localStorage
function saveTrackingData(){
  TRACKING_DATA.lastUpdated = new Date().toISOString();
  safeStorageSet('dietologist_tracking', TRACKING_DATA);
}

// Real display name for a tracked meal — meal.name is always just the meal-time slot
// label ("Πρωινό"/"Μεσημεριανό"/"Βραδινό"/"Ενδιάμεσο", set once from TMPLS and never
// overwritten once real foods are filled in), so it's useless for telling recipes apart
// in Tracking Analytics. Prefer the chef recipe's real title, then fall back to the
// actual foods in the meal.
function getMealDisplayName(meal){
  if(meal.recipeId && typeof findRecipeById==='function'){
    var r = findRecipeById(meal.recipeId);
    if(r && r.name) return r.name;
  }
  if(meal.foods && meal.foods.length){
    return meal.foods.slice(0,3).map(function(f){return f.n;}).join(', ');
  }
  return meal.name || 'Γεύμα';
}

// Log plan generation
function logPlanGeneration(client, weekPlan){
  if(!client || !weekPlan)return;

  var planLog = {
    timestamp: new Date().toISOString(),
    clientName: client.name || 'Unknown',
    goal: client.goal,
    dietType: client.dietType,
    mealsUsed: [],
    mealRatings: {},  // {"0-0": {rating: 1, date}, "0-1": {rating: -1, date}}
    regeneratedAt: null,
    planDuration: 0,
    status: 'active'
  };

  // Extract all recipes used. trackKey identifies the meal for trust tracking regardless of where
  // it came from: a chef recipe's stable id (meal.recipeId), or a taste-library/saved-combo meal's
  // content signature (meal.recipeSig) — most real plans are library-sourced, so without this they'd
  // never accumulate usage history at all.
  for(var d=0;d<7;d++){
    if(weekPlan[d]){
      for(var mi=0;mi<weekPlan[d].length;mi++){
        var meal = weekPlan[d][mi];
        var trackKey = meal.recipeId || meal.recipeSig;
        if(trackKey){
          planLog.mealsUsed.push({
            day: d,
            mealIndex: mi,
            recipeId: trackKey,
            mealName: getMealDisplayName(meal)
          });

          // Update recipe stats
          if(!TRACKING_DATA.recipes[trackKey]){
            TRACKING_DATA.recipes[trackKey] = {
              id: trackKey,
              name: getMealDisplayName(meal),
              timesUsed: 0,
              successCount: 0,
              regenerateCount: 0,
              clientsUsedWith: [],
              lastUsed: null,
              ratings: [],           // {date, rating: 1 or -1, clientName}
              thumbsUp: 0,
              thumbsDown: 0
            };
          }
          TRACKING_DATA.recipes[trackKey].timesUsed++;
          TRACKING_DATA.recipes[trackKey].lastUsed = new Date().toISOString();

          if(!TRACKING_DATA.recipes[trackKey].clientsUsedWith.includes(client.name)){
            TRACKING_DATA.recipes[trackKey].clientsUsedWith.push(client.name);
          }
        }
      }
    }
  }

  TRACKING_DATA.plans.push(planLog);
  saveTrackingData();
  console.log('Plan logged:', client.name);
}

// Track when plan is regenerated (negative signal)
function logRegenerate(planIndex){
  if(planIndex >= 0 && planIndex < TRACKING_DATA.plans.length){
    var plan = TRACKING_DATA.plans[planIndex];
    plan.regeneratedAt = new Date().toISOString();
    plan.status = 'regenerated';

    // Mark recipes as problematic
    plan.mealsUsed.forEach(function(meal){
      if(TRACKING_DATA.recipes[meal.recipeId]){
        TRACKING_DATA.recipes[meal.recipeId].regenerateCount++;
      }
    });

    saveTrackingData();
    console.log('Regenerate tracked');
  }
}

// Calculate success rate for each recipe
function calculateRecipeStats(){
  var stats = {};

  Object.keys(TRACKING_DATA.recipes).forEach(function(recipeId){
    var recipe = TRACKING_DATA.recipes[recipeId];
    var successRate = recipe.timesUsed > 0 ?
      (1 - (recipe.regenerateCount / recipe.timesUsed)) * 100 : 0;

    stats[recipeId] = {
      name: recipe.name,
      timesUsed: recipe.timesUsed,
      successRate: Math.round(successRate),
      usedWithClients: recipe.clientsUsedWith.length,
      trustScore: calculateTrustScore(recipe),
      lastUsed: recipe.lastUsed
    };
  });

  return stats;
}

// Rate a meal (day + meal index)
function rateMeal(dayIndex, mealIndex, rating){
  var c = getC();
  if(!c || !c.weekPlan || dayIndex === undefined || mealIndex === undefined) return;

  var mealKey = dayIndex + '-' + mealIndex;
  var meal = c.weekPlan[dayIndex][mealIndex];
  var mealName = meal ? meal.name : 'Γεύμα';

  // Find the current plan in TRACKING_DATA
  var currentPlan = TRACKING_DATA.plans[TRACKING_DATA.plans.length - 1];
  if(!currentPlan) return;

  // Initialize mealRatings if needed
  if(!currentPlan.mealRatings) currentPlan.mealRatings = {};

  // Add rating (1 = thumbs up, -1 = thumbs down)
  currentPlan.mealRatings[mealKey] = {
    rating: rating,
    date: new Date().toISOString(),
    mealName: mealName,
    foods: meal && meal.foods ? meal.foods.map(f => f.n).join(', ') : ''
  };

  // Update UI feedback - change button colors
  var upBtn = document.querySelector('[data-meal-rating="' + mealKey + '"][data-rating="up"]');
  var downBtn = document.querySelector('[data-meal-rating="' + mealKey + '"][data-rating="down"]');

  if(rating > 0){
    if(upBtn) { upBtn.style.background = '#4caf50'; upBtn.style.color = 'white'; }
    if(downBtn) { downBtn.style.background = ''; downBtn.style.color = '#888'; }
  } else if(rating < 0){
    if(downBtn) { downBtn.style.background = '#d9534f'; downBtn.style.color = 'white'; }
    if(upBtn) { upBtn.style.background = ''; upBtn.style.color = '#888'; }
  }

  saveTrackingData();
  console.log('Meal rated: Day ' + dayIndex + ', ' + mealName + ' (' + (rating > 0 ? '👍' : '👎') + ')');
}

// Helper: Generate diverse alternatives (different food categories)
function generateDiverseAlternatives(targetCalories, dayIndex, excludedFoods, mealName, count, macroTargets){
  var alternatives = [];
  macroTargets = macroTargets || {};

  // Determine meal type from name
  var lower = (mealName || '').toLowerCase();
  var isBreakfast = lower.includes('πρωινό');
  var isSnack = lower.includes('ενδιάμεσο');
  var isLunch = lower.includes('μεσημεριανό');
  var isDinner = lower.includes('βραδινό');

  // Macro targets to match
  var targetP = macroTargets.targetProtein || 0;
  var targetF = macroTargets.targetFat || 0;
  var targetC = macroTargets.targetCarbs || 0;
  var excludeFoods = macroTargets.excludeFoods || [];

  // Collect different protein options based on meal type
  var proteinOptions = [];
  var carbOptions = [];
  var veggieOptions = [];
  var dairyOptions = [];
  var fruitOptions = [];

  // Categorize foods
  for(var foodName in FOODS){
    if(!FOODS.hasOwnProperty(foodName)) continue;
    if(excludedFoods && excludedFoods.indexOf(foodName) !== -1) continue;

    var lower = foodName.toLowerCase();

    // Heavy proteins (for lunch/dinner)
    if(!isBreakfast && (lower.includes('κοτόπουλο') || lower.includes('ψάρι') || lower.includes('τόνο') ||
       lower.includes('κιμάς') || lower.includes('σολομό') || lower.includes('γαρίδα') ||
       lower.includes('χοιρινό') || lower.includes('αρνί') || lower.includes('βοδινό'))){
      proteinOptions.push(foodName);
    }

    // Light proteins (eggs - for breakfast/snacks, NOT legumes)
    if(lower.includes('αβγό')){
      proteinOptions.push(foodName);
    }

    // Legumes (only for lunch/dinner, NOT breakfast)
    if(!isBreakfast && (lower.includes('φασόλι') || lower.includes('φακή'))){
      proteinOptions.push(foodName);
    }

    // Carb foods - differentiate by type
    if(isBreakfast){
      // Breakfast carbs: δημητριακά, ψωμί, avena
      if(lower.includes('δημητριακά') || lower.includes('ψωμί') || lower.includes('αρτο') ||
         lower.includes('κροασάν') || lower.includes('avena')){
        carbOptions.push(foodName);
      }
    } else {
      // Lunch/dinner carbs: ρύζι, πατάτα, κινόα, κριθάρι
      if(lower.includes('ρύζι') || lower.includes('πατάτα') || lower.includes('κινόα') ||
         lower.includes('κριθάρι') || lower.includes('νουντλς')){
        carbOptions.push(foodName);
      }
    }

    // Veggie/side foods
    if(lower.includes('σαλάτα') || lower.includes('λαχανικό') || lower.includes('ντομάτα') ||
       lower.includes('αγγούρι') || lower.includes('μαρούλι') || lower.includes('παντζάρι')){
      veggieOptions.push(foodName);
    }

    // Dairy (breakfast/snacks)
    if(isBreakfast || isSnack){
      if(lower.includes('γιαούρτι') || lower.includes('φέτα') || lower.includes('τυρί') ||
         lower.includes('γάλα') || lower.includes('κοτάζ')){
        dairyOptions.push(foodName);
      }
    }

    // Fruits (breakfast/snacks)
    if(isBreakfast || isSnack){
      if(lower.includes('μήλο') || lower.includes('μπανάνα') || lower.includes('φράουλα') ||
         lower.includes('πορτοκάλι') || lower.includes('κιβι') || lower.includes('γεγονός')){
        fruitOptions.push(foodName);
      }
    }
  }

  // Create 3 diverse combinations based on meal type (matching macros)
  for(var attempt = 0; attempt < 10 && alternatives.length < 3; attempt++){
    var meal = {foods: []};

    if(isBreakfast){
      // Breakfast: Build meal targeting carbs & protein
      // Select carb source
      if(carbOptions.length > 0){
        var carb = carbOptions[Math.floor(Math.random() * carbOptions.length)];
        if(!excludeFoods.includes(carb)){
          var cMacros = cm(carb, 100);
          var cGrams = targetC > 0 ? (targetC * 0.7 * 100) / cMacros.c : (targetCalories * 0.5) / (cMacros.k / 100);
          meal.foods.push({n: carb, g: Math.round(Math.max(30, Math.min(300, cGrams)))});
        }
      }

      // Select protein source (dairy/eggs for breakfast)
      if(targetP > 0 && (dairyOptions.length > 0 || proteinOptions.length > 0)){
        var protOptions = dairyOptions.concat(proteinOptions.filter(p => !p.includes('κιμάς')));
        if(protOptions.length > 0){
          var prot = protOptions[Math.floor(Math.random() * protOptions.length)];
          if(!excludeFoods.includes(prot)){
            var pMacros = cm(prot, 100);
            var pGrams = (targetP * 0.8 * 100) / pMacros.p;
            meal.foods.push({n: prot, g: Math.round(Math.max(30, Math.min(300, pGrams)))});
          }
        }
      }

      // Add fruit if space
      if(fruitOptions.length > 0 && meal.foods.length < 3){
        var fruit = fruitOptions[Math.floor(Math.random() * fruitOptions.length)];
        if(!excludeFoods.includes(fruit)){
          meal.foods.push({n: fruit, g: 150});
        }
      }
    } else if(isSnack){
      // Snack: Light option matching macros
      if(targetP > 5){
        // Protein-based snack
        var snackProt = dairyOptions.length > 0 ? dairyOptions[Math.floor(Math.random() * dairyOptions.length)] :
                        proteinOptions[Math.floor(Math.random() * proteinOptions.length)];
        if(!excludeFoods.includes(snackProt)){
          meal.foods.push({n: snackProt, g: 150});
        }
      } else if(fruitOptions.length > 0){
        var snackFruit = fruitOptions[Math.floor(Math.random() * fruitOptions.length)];
        if(!excludeFoods.includes(snackFruit)){
          meal.foods.push({n: snackFruit, g: 200});
        }
      }
    } else {
      // Lunch/Dinner: Match protein, carbs, fat
      var mealProto = proteinOptions[Math.floor(Math.random() * proteinOptions.length)];
      if(mealProto && !excludeFoods.includes(mealProto)){
        var prMacros = cm(mealProto, 100);
        var prGrams = targetP > 0 ? (targetP * 100) / prMacros.p : (targetCalories * 0.35) / (prMacros.k / 100);
        meal.foods.push({n: mealProto, g: Math.round(Math.max(50, Math.min(250, prGrams)))});
      }

      if(carbOptions.length > 0){
        var mealCarb = carbOptions[Math.floor(Math.random() * carbOptions.length)];
        if(mealCarb && !excludeFoods.includes(mealCarb)){
          var crMacros = cm(mealCarb, 100);
          var crGrams = targetC > 0 ? (targetC * 100) / crMacros.c : (targetCalories * 0.45) / (crMacros.k / 100);
          meal.foods.push({n: mealCarb, g: Math.round(Math.max(50, Math.min(300, crGrams)))});
        }
      }

      if(veggieOptions.length > 0){
        var mealVeg = veggieOptions[Math.floor(Math.random() * veggieOptions.length)];
        if(!excludeFoods.includes(mealVeg)){
          meal.foods.push({n: mealVeg, g: 150});
        }
      }
    }

    if(meal.foods.length > 0){
      var mealStr = meal.foods.map(f => f.n).join(', ');
      if(!alternatives.some(a => a.foodsStr === mealStr)){
        alternatives.push({foods: meal.foods, foodsStr: mealStr});
      }
    }
  }

  return alternatives.slice(0, count || 3);
}

// Show alternative meal options when user rates meal as 👎
function showMealAlternatives(dayIndex, mealIndex){
  var c = getC();
  if(!c || !c.weekPlan || !c.weekPlan[dayIndex] || !c.weekPlan[dayIndex][mealIndex]) return;

  var currentMeal = c.weekPlan[dayIndex][mealIndex];
  var mealName = currentMeal.name || '';
  var currentCalories = 0;
  var currentProtein = 0, currentFat = 0, currentCarbs = 0;
  var excl = (c.excl || []);
  var currentFoodNames = [];

  // Calculate current meal macros and remember food names
  if(currentMeal.foods){
    currentMeal.foods.forEach(function(f){
      currentFoodNames.push(f.n);
      var r = cm(f.n, f.g);
      currentCalories += r.k;
      currentProtein += r.p;
      currentFat += r.f;
      currentCarbs += r.c;
    });
  }

  // ✅ PRIORITY 1: Check saved combos (favorite meals marked with ⭐)
  var alternatives = [];
  var savedCombos = getSavedCombos();

  if(savedCombos && savedCombos.length > 0) {
    // Find saved combos compatible with current meal type and calorie target
    // Use ±100 kcal tolerance for saved combos to find similar meals
    for(var si = 0; si < savedCombos.length; si++) {
      var savedCombo = savedCombos[si];
      var savedComboKcal = savedCombo.kcal || 0;
      var savedComboName = savedCombo.name || mealName;

      // Check: same meal type (breakfast, lunch, dinner, snack) and calorie range
      var isSameMealType = !savedCombo.mealTiming ||
                          (mealName && savedCombo.mealTiming &&
                           mealName.toLowerCase().indexOf(savedCombo.mealTiming.toLowerCase()) !== -1);

      var isWithinCaloricRange = Math.abs(savedComboKcal - currentCalories) <= 120; // ±120 kcal

      // Check: no excluded foods in saved combo
      var hasExcludedFood = false;
      if(savedCombo.foods) {
        for(var ei = 0; ei < excl.length; ei++) {
          var excluded = excl[ei] || '';
          for(var fi = 0; fi < savedCombo.foods.length; fi++) {
            if((savedCombo.foods[fi].n || '').toLowerCase().indexOf(excluded.toLowerCase()) !== -1) {
              hasExcludedFood = true;
              break;
            }
          }
          if(hasExcludedFood) break;
        }
      }

      // Add to alternatives if compatible (same meal type, within calorie range, no excluded foods)
      if(isSameMealType && isWithinCaloricRange && !hasExcludedFood && savedCombo.foods && savedCombo.foods.length > 0) {
        alternatives.push({
          foods: deepClone(savedCombo.foods),
          isSavedCombo: true,
          comboName: savedComboName,
          priority: 'saved'
        });
      }

      // Limit to 2 saved combos to leave room for generated alternatives
      if(alternatives.length >= 2) break;
    }
  }

  // ✅ PRIORITY 2: Generate new alternatives if we need more options
  var generatedAlternatives = [];
  var alternativesNeeded = 3 - alternatives.length;

  if(alternativesNeeded > 0) {
    generatedAlternatives = generateDiverseAlternatives(currentCalories, dayIndex, excl, mealName, alternativesNeeded, {
      targetProtein: currentProtein,
      targetFat: currentFat,
      targetCarbs: currentCarbs,
      excludeFoods: currentFoodNames
    });

    // Add generated alternatives with priority flag
    generatedAlternatives.forEach(function(alt) {
      alternatives.push({
        foods: alt.foods,
        isSavedCombo: false,
        priority: 'generated'
      });
    });
  }

  // Build modal HTML
  var modalHtml = '<div style="max-width:600px">'
    +'<h3 style="color:#d9534f;margin-bottom:15px">Εναλλακτικές επιλογές για ' + mealName + '</h3>'
    +'<p style="color:#666;font-size:12px;margin-bottom:15px">Επιλέξτε μια εναλλακτική ή αφήστε το αρχικό γεύμα</p>';

  // PHASE 1: Generate scaled versions of each alternative
  var scaledAlternatives = [];
  alternatives.forEach(function(alt, idx){
    var tempMeal = {foods: deepClone(alt.foods), name: mealName};
    var effTarget = {
      k: currentCalories,
      p: currentProtein,
      f: currentFat,
      c: currentCarbs
    };
    var scaledMeal = scalePlan([tempMeal], effTarget)[0];
    scaledAlternatives.push({
      original: alt,
      scaled: scaledMeal
    });
  });

  // PHASE 2: Validate each scaled alternative
  var validAlternativesData = [];
  scaledAlternatives.forEach(function(altData, idx){
    var scaledMeal = altData.scaled;

    // Calculate actual macros after scaling
    var altProtein = 0, altFat = 0, altCarbs = 0, altCalories = 0;
    scaledMeal.foods.forEach(function(f){
      var r = cm(f.n, f.g);
      altCalories += r.k;
      altProtein += r.p;
      altFat += r.f;
      altCarbs += r.c;
    });

    // Calculate deviations (for reference only, no filtering)
    var calorieDeviation = Math.abs(altCalories - currentCalories) / currentCalories * 100;
    var proteinDeviation = currentProtein > 0 ? Math.abs(altProtein - currentProtein) / currentProtein * 100 : 0;
    var carbsDeviation = currentCarbs > 0 ? Math.abs(altCarbs - currentCarbs) / currentCarbs * 100 : 0;
    var fatDeviation = currentFat > 0 ? Math.abs(altFat - currentFat) / currentFat * 100 : 0;

    // Accept ALL alternatives (no filtering)
    var isValid = true;

    console.log('Alternative ' + idx + ': K=' + altCalories.toFixed(0) + ' (dev ' + calorieDeviation.toFixed(1) + '%), P=' + altProtein.toFixed(1) + ' (dev ' + proteinDeviation.toFixed(1) + '%), C=' + altCarbs.toFixed(1) + ' (dev ' + carbsDeviation.toFixed(1) + '%), F=' + altFat.toFixed(1) + ' (dev ' + fatDeviation.toFixed(1) + '%) - VALID=' + isValid);

    if(isValid){
      validAlternativesData.push({
        index: idx,
        scaled: scaledMeal,
        calories: altCalories,
        protein: altProtein,
        carbs: altCarbs,
        fat: altFat,
        calorieDeviation: calorieDeviation,
        proteinDeviation: proteinDeviation,
        carbsDeviation: carbsDeviation,
        fatDeviation: fatDeviation
      });
    }
  });

  // PHASE 3: Build modal with only valid alternatives
  validAlternativesData.forEach(function(data, displayIdx){
    var altData = alternatives[data.index];
    var isSaved = altData && altData.isSavedCombo;
    var badgeHtml = isSaved ? '<span style="background:#ff9800;color:white;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:bold;margin-left:6px">⭐ Αγαπημένο</span>' : '';

    modalHtml += '<div style="background:' + (isSaved ? '#fff3e0' : '#f5f5f5') + ';border:' + (isSaved ? '2px solid #ff9800' : '1px solid #ddd') + ';border-radius:6px;padding:10px;margin-bottom:10px">'
      +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
      +'<div><b style="color:#025857">Επιλογή ' + (displayIdx+1) + '</b>' + badgeHtml + '</div>'
      +'<div style="font-size:11px;color:#666">'
      + Math.round(data.calories) + ' kcal (±' + data.calorieDeviation.toFixed(1) + '%) | '
      + 'P: ' + Math.round(data.protein) + 'g (±' + data.proteinDeviation.toFixed(1) + '%)'
      +'</div>'
      +'</div>'
      +'<div style="font-size:12px;color:#333;margin-bottom:10px">' + data.scaled.foods.map(f => f.n + ' ' + Math.round(f.g) + 'g').join(' + ') + '</div>'
      +'<button onclick="replaceMeal(' + dayIndex + ',' + mealIndex + ',' + data.index + ')" style="background:#4caf50;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:11px">✓ Επιλέξ αυτή</button>'
      +'</div>';

    // Store SCALED version for replacement
    alternatives[data.index].foods = deepClone(data.scaled.foods);
  });

  // Note: All alternatives are now shown (no filtering)

  modalHtml += '<div style="margin-top:15px;padding-top:15px;border-top:1px solid #ddd">'
    +'<button onclick="closeAltModal()" style="background:#888;color:white;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-size:11px">× Κράτησε το αρχικό</button>'
    +'</div></div>';

  // Store alternatives for replaceMeal function
  window.currentAlternatives = alternatives;

  // Show modal
  var modal = document.getElementById('altMealModal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'altMealModal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:1000';
    document.body.appendChild(modal);
  }

  var content = modal.querySelector('[role="dialog"]') || document.createElement('div');
  content.role = 'dialog';
  content.style.cssText = 'background:white;border-radius:8px;padding:20px;max-height:80vh;overflow-y:auto;max-width:500px';
  content.innerHTML = modalHtml;

  if(!modal.querySelector('[role="dialog"]')){
    modal.appendChild(content);
  }

  modal.style.display = 'flex';
}

// Close alternatives modal
function closeAltModal(){
  var modal = document.getElementById('altMealModal');
  if(modal) modal.style.display = 'none';
}

// Replace meal with selected alternative
function replaceMeal(dayIndex, mealIndex, altIndex){
  var c = getC();
  if(!c || !c.weekPlan || !window.currentAlternatives || !window.currentAlternatives[altIndex]) return;

  var alt = window.currentAlternatives[altIndex];
  c.weekPlan[dayIndex][mealIndex].foods = deepClone(alt.foods);

  save();
  renderWeekTable();
  closeAltModal();

  console.log('Meal replaced with alternative');
}

// Calculate meal success based on ratings
function getMealRatingStats(){
  var mealStats = {};  // {day-mealIndex: {goodCount, badCount, success%}}

  // Analyze all plans
  TRACKING_DATA.plans.forEach(function(plan){
    if(plan.mealRatings){
      Object.keys(plan.mealRatings).forEach(function(mealKey){
        if(!mealStats[mealKey]){
          mealStats[mealKey] = {
            goodCount: 0,
            badCount: 0,
            meals: [],
            totalRatings: 0
          };
        }
        var rating = plan.mealRatings[mealKey];
        mealStats[mealKey].meals.push({
          mealName: rating.mealName,
          foods: rating.foods,
          date: rating.date
        });
        mealStats[mealKey].totalRatings++;
        if(rating.rating > 0) mealStats[mealKey].goodCount++;
        else if(rating.rating < 0) mealStats[mealKey].badCount++;
      });
    }
  });

  // Calculate success percentages
  Object.keys(mealStats).forEach(function(key){
    var stats = mealStats[key];
    if(stats.totalRatings > 0){
      stats.successPercent = Math.round((stats.goodCount / stats.totalRatings) * 100);
    } else {
      stats.successPercent = 0;
    }
  });

  return mealStats;
}

// Analyze patterns from meal ratings
function analyzePatterns(){
  var mealStats = getMealRatingStats();

  var patterns = {
    topMeals: [],        // Success rate > 70%
    problemMeals: [],    // Success rate < 40%
    recentRatings: [],   // Most recent ratings
    analysisDate: new Date().toISOString()
  };

  // Convert to sortable array
  var mealArray = Object.keys(mealStats).map(function(key){
    return {
      mealKey: key,
      ...mealStats[key]
    };
  }).sort(function(a,b){ return b.successPercent - a.successPercent; });

  // Top meals (success > 70%)
  patterns.topMeals = mealArray.filter(function(m){ return m.successPercent > 70; }).slice(0, 10);

  // Problem meals (success < 40%)
  patterns.problemMeals = mealArray.filter(function(m){ return m.successPercent < 40 && m.totalRatings > 0; }).slice(0, 10);

  // Recent ratings (last 10)
  var allRatings = [];
  TRACKING_DATA.plans.forEach(function(plan){
    if(plan.mealRatings){
      Object.keys(plan.mealRatings).forEach(function(mealKey){
        allRatings.push({
          mealKey: mealKey,
          ...plan.mealRatings[mealKey]
        });
      });
    }
  });
  patterns.recentRatings = allRatings.sort(function(a,b){
    return new Date(b.date) - new Date(a.date);
  }).slice(0, 10);

  TRACKING_DATA.patterns = patterns;
  saveTrackingData();

  return patterns;
}

// Show analytics dashboard
function showTrackingDashboard(){
  closeTrackingDashboard(); // avoid stacking a second overlay if one is already open
  var patterns = analyzePatterns();
  var stats = calculateRecipeStats();

  var html = '<div id="tracking-dashboard-overlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;overflow:auto;padding:20px;">';
  html += '<div style="background:white;max-width:1000px;margin:0 auto;border-radius:10px;padding:30px;">';
  html += '<div style="position:absolute;top:10px;right:10px;cursor:pointer;font-size:30px;" onclick="closeTrackingDashboard();">&times;</div>';

  html += '<h1 style="color:#025857;">📊 Tracking Analytics - Αξιολογήσεις Γευμάτων</h1>';

  // Top Meals (Success > 70%)
  html += '<h2 style="color:#025857;margin-top:30px;">⭐ Αγαπημένα Γεύματα (>70% επιτυχία)</h2>';
  if(patterns.topMeals.length > 0){
    html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;">';
    html += '<tr style="background:#E2EEE5;"><th style="padding:10px;text-align:left;">Γεύμα</th><th>👍</th><th>👎</th><th>Επιτυχία</th><th>Τρόφιμα</th></tr>';

    patterns.topMeals.forEach(function(meal){
      var mealName = meal.meals && meal.meals[0] ? meal.meals[0].mealName : 'Γεύμα';
      var foods = meal.meals && meal.meals[0] ? meal.meals[0].foods : '-';
      html += '<tr style="border-bottom:1px solid #ddd;">';
      html += '<td style="padding:10px;"><strong>' + esc(mealName) + '</strong></td>';
      html += '<td style="padding:10px;"><span style="color:#4caf50;font-weight:bold;">' + meal.goodCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#d9534f;font-weight:bold;">' + meal.badCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#025857;font-weight:bold;">' + meal.successPercent + '%</span></td>';
      html += '<td style="padding:10px;font-size:12px;color:#666;">' + esc(foods.substring(0, 50)) + (foods.length > 50 ? '...' : '') + '</td>';
      html += '</tr>';
    });
    html += '</table>';
  } else {
    html += '<p style="color:#666;">Δεν έχεις αξιολογήσει γεύματα ακόμα. Κάνε κλικ στα 👍/👎 κουμπιά στο πλάνο!</p>';
  }

  // Problem Meals (Success < 40%)
  if(patterns.problemMeals.length > 0){
    html += '<h2 style="color:#d9534f;margin-top:30px;">⚠️ Προβληματικά Γεύματα (<40% επιτυχία)</h2>';
    html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;">';
    html += '<tr style="background:#f8d7da;"><th style="padding:10px;text-align:left;">Γεύμα</th><th>👍</th><th>👎</th><th>Επιτυχία</th><th>Σχόλιο</th></tr>';

    patterns.problemMeals.forEach(function(meal){
      var mealName = meal.meals && meal.meals[0] ? meal.meals[0].mealName : 'Γεύμα';
      html += '<tr style="border-bottom:1px solid #ddd;">';
      html += '<td style="padding:10px;"><strong>' + esc(mealName) + '</strong></td>';
      html += '<td style="padding:10px;"><span style="color:#4caf50;font-weight:bold;">' + meal.goodCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#d9534f;font-weight:bold;">' + meal.badCount + '</span></td>';
      html += '<td style="padding:10px;"><span style="color:#d9534f;font-weight:bold;">' + meal.successPercent + '%</span></td>';
      html += '<td style="padding:10px;color:#d9534f;font-weight:500;">Αποφύγετε</td>';
      html += '</tr>';
    });
    html += '</table>';
  }

  // Recent Ratings
  if(patterns.recentRatings.length > 0){
    html += '<h2 style="color:#025857;margin-top:30px;">💭 Πρόσφατες Αξιολογήσεις</h2>';
    html += '<div style="background:#f0f8ff;padding:15px;border-radius:5px;margin:10px 0;">';
    patterns.recentRatings.slice(0, 8).forEach(function(rating){
      var icon = rating.rating > 0 ? '👍' : '👎';
      var date = new Date(rating.date).toLocaleDateString('el-GR');
      html += '<div style="padding:8px;border-bottom:1px solid #ddd;"><strong>' + esc(rating.mealName) + '</strong> ' + icon + ' <span style="font-size:12px;color:#666;">(' + date + ')</span></div>';
    });
    html += '</div>';
  }

  // Trust Score per meal/recipe — real usage-based ranking (drives the genPlan weighting in
  // findBestRecipe/findSavedComboMatch), separate from the manual 👍/👎 ratings above. Keyed by
  // either a chef recipe's id or a taste-library/saved-combo meal's food signature.
  var statEntries = Object.keys(stats).map(function(id){ return stats[id]; }).sort(function(a,b){ return b.timesUsed - a.timesUsed; });
  html += '<h2 style="color:#025857;margin-top:30px;">🏆 Trust Score ανά Γεύμα/Συνταγή</h2>';
  if(statEntries.length > 0){
    html += '<p style="color:#666;font-size:13px;margin:0 0 10px;">Πόσο συχνά «κρατιέται» ένα γεύμα σε σχέση με το πόσες φορές το πλάνο του ξαναρολάρεται — αυτό επηρεάζει ποια γεύματα προτιμώνται σε νέα πλάνα.</p>';
    html += '<table style="width:100%;border-collapse:collapse;margin:10px 0;">';
    html += '<tr style="background:#E2EEE5;"><th style="padding:10px;text-align:left;">Γεύμα</th><th>Φορές Χρήσης</th><th>Trust Score</th><th>Πελάτες</th><th>Τελευταία Χρήση</th></tr>';
    statEntries.slice(0, 30).forEach(function(s){
      var trustColor = s.trustScore >= 0.7 ? '#4caf50' : (s.trustScore <= 0.4 ? '#d9534f' : '#f0a500');
      var lastUsed = s.lastUsed ? new Date(s.lastUsed).toLocaleDateString('el-GR') : '-';
      html += '<tr style="border-bottom:1px solid #ddd;">';
      html += '<td style="padding:10px;"><strong>' + esc(s.name||'Γεύμα') + '</strong></td>';
      html += '<td style="padding:10px;text-align:center;">' + s.timesUsed + '</td>';
      html += '<td style="padding:10px;text-align:center;"><span style="color:' + trustColor + ';font-weight:bold;">' + Math.round(s.trustScore*100) + '%</span></td>';
      html += '<td style="padding:10px;text-align:center;">' + s.usedWithClients + '</td>';
      html += '<td style="padding:10px;font-size:12px;color:#666;">' + lastUsed + '</td>';
      html += '</tr>';
    });
    html += '</table>';
  } else {
    html += '<p style="color:#666;">Δεν έχει καταγραφεί ακόμα καμία χρήση γεύματος. Φτιάξε ένα πλάνο για να ξεκινήσει η καταγραφή!</p>';
  }

  // Statistics
  html += '<h2 style="color:#025857;margin-top:30px;">📈 Στατιστικά</h2>';
  html += '<div style="background:#f5f5f5;padding:15px;border-radius:5px;margin:10px 0;">';
  html += '<p><strong>Συνολικά Πλάνα:</strong> ' + TRACKING_DATA.plans.length + '</p>';
  html += '<p><strong>Αξιολογημένα Γεύματα:</strong> ' + (patterns.recentRatings ? patterns.recentRatings.length : 0) + '</p>';
  html += '<p><strong>Αγαπημένα Γεύματα (>70%):</strong> ' + patterns.topMeals.length + '</p>';
  html += '<p><strong>Προβληματικά Γεύματα (<40%):</strong> ' + patterns.problemMeals.length + '</p>';
  html += '</div>';

  html += '<button onclick="closeTrackingDashboard()" style="margin-top:20px;padding:10px 20px;background:#025857;color:white;border:none;border-radius:5px;cursor:pointer;">Close</button>';

  html += '</div></div>';

  document.body.insertAdjacentHTML('beforeend', html);
}

function closeTrackingDashboard(){
  // Must target this dashboard specifically by id — a generic "[style*=position:fixed]" selector
  // also matches unrelated always-present elements (#context-menu, modals, toasts), so it used to
  // remove whichever of those happened to be first in the DOM instead of the dashboard.
  var dashboard = document.getElementById('tracking-dashboard-overlay');
  if(dashboard)dashboard.remove();
}

// Initialize tracking on page load
/* ---- Backup Import via Button (works with file:// protocol) ---- */
function importBackup(){
  var inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json';
  inp.style.display = 'none';
  inp.onchange = function(event){
    var f = inp.files[0];
    if(!f) return;
    // Remove from DOM after selection
    setTimeout(function(){if(inp.parentNode) inp.parentNode.removeChild(inp);}, 0);
    var r = new FileReader();
    r.onload = function(e){
      var data;
      try{
        data = JSON.parse(e.target.result);
        if(!data.clients || !Array.isArray(data.clients)){
          showErrorToast('Λάθος format αρχείου!');
          return;
        }
      }catch(ex){
        showErrorToast('Σφάλμα: ' + ex.message);
        return;
      }

      var incoming = data.clients.length;
      var existing = clients.length;

      function finish(){
        curId = null;
        saveNow();
        renderSB();
        showSuccessToast('✅ Εισαγωγή επιτυχής! ' + clients.length + ' πελάτες φορτώθηκαν.');
      }
      function doMerge(){
        var existingIds = clients.map(function(c){return c.id;});
        var toAdd = data.clients.filter(function(c){return existingIds.indexOf(c.id) < 0;});
        clients = clients.concat(toAdd);
        finish();
      }
      function doReplace(){
        clients = data.clients;
        finish();
      }

      if(existing > 0){
        showConfirmDialog(
          'Βρέθηκαν ' + incoming + ' πελάτες, υπάρχουν ήδη ' + existing + '.',
          doMerge,
          {title:'Συγχώνευση ή αντικατάσταση;', icon:'📥', confirmLabel:'Συγχώνευση ('+(existing+incoming)+')', secondary:{label:'Αντικατάσταση', onClick:doReplace}}
        );
      } else {
        doMerge();
      }
    };
    r.readAsText(f);
  };
  // Add to DOM and click to open file picker
  document.body.appendChild(inp);
  inp.click();
}

window.addEventListener('load', function(){
  loadTrackingData();
  // Start auto-backup system
  setTimeout(initAutoBackup, 2000); // Wait 2 seconds to ensure data is fully loaded
});

// ══════════════════════════════════════════════════════════════════════════════

// PART 4: GAP ANALYSIS MODAL INTEGRATION ════════════════════════════════════════

function openGapAnalysisModal(){
  var c = getC();
  if(!c || !c.weekPlan){
    showErrorToast('Δημιουργήστε πρώτα ένα πλάνο');
    return;
  }

  // Run the analysis chain
  var weekAnalysis = getWeekMicronutrients(c.weekPlan);
  var gaps = detectMicronutrientGaps(weekAnalysis, c);
  var recommendations = matchSupplementsToGaps(gaps, SUPPS);

  // Build HTML report
  var html = buildGapAnalysisHTML(gaps, recommendations, weekAnalysis, c);

  // Create/populate modal
  var modal = document.getElementById('gap-analysis-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'gap-analysis-modal';
    modal.className = 'gap-modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = html;
  modal.style.display = 'flex';

  // Close on background click
  modal.addEventListener('click', function(e){
    if(e.target === modal) closeGapAnalysisModal();
  });
}

function buildGapAnalysisHTML(gaps, recommendations, weekAnalysis, c){
  // Header with summary
  var html = '<div class="gap-modal-content">';
  html += '<div class="gap-modal-header">';
  html += '<h2 style="color:#025857;margin:0;">🔬 Ανάλυση Κενών Μικροθρεπτικών & Συμπληρώματα</h2>';
  html += '<button onclick="closeGapAnalysisModal()" style="background:#ff6b35;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;color:white;font-weight:bold;font-size:16px;">✕</button>';
  html += '</div>';

  // Show methodology notes
  var methodologyNote = '📋 Προσαρμογές (Επιστημονικές μελέτες 2024-2025): ';
  var adjustments = [];
  if(c.sport) adjustments.push('🏆 Άθλημα-ειδικές ανάγκες');
  if(c.dietType && (c.dietType==='vegan' || c.dietType==='vegetarian' || c.dietType==='orthodox_fasting')) {
    adjustments.push('🥗 ' + (c.dietType==='vegan' ? 'Vegan' : c.dietType==='vegetarian' ? 'Χορτοφαγικές' : 'Ορθόδοξη Νηστεία') + ' ανάγκες');
  }
  if(c.altitudeTraining) adjustments.push('⛰️ Προπόνηση σε ύψος');
  if(adjustments.length > 0) {
    html += '<div style="background:#e3f2fd;border-left:4px solid #1976d2;padding:10px;margin-bottom:15px;border-radius:4px;font-size:11px;color:#1565C0;">';
    html += methodologyNote + adjustments.join(' + ');
    html += '</div>';
  }

  // Critical gaps section
  if(gaps.filter(function(g){return g.severity==='critical';}).length > 0){
    html += '<div class="gap-section">';
    html += '<h3 style="color:#d32f2f;margin-top:0;">🔴 ΚΡΙΣΙΜΑ ΚΕΝΑ</h3>';
    gaps.filter(function(g){return g.severity==='critical';}).forEach(function(gap){
      html += '<div class="gap-item critical">';
      html += '<span style="flex:1;"><strong>' + gap.nutrient + '</strong>';
      if(gap.supplementRequired) html += ' <span style="background:#d32f2f;color:white;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:bold;margin-left:8px;">⚠️ ΣΥΜΠΛΗΡΩΜΑ</span>';
      html += '</span>';
      html += '<span style="text-align:right;">' + gap.actual.toFixed(1) + ' / ' + gap.target + ' ' + gap.unit + ' (' + gap.percent + '%)</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Low/moderate gaps section
  if(gaps.filter(function(g){return g.severity!=='critical';}).length > 0){
    html += '<div class="gap-section">';
    html += '<h3 style="color:#e65100;margin-top:0;">⚠️ ΕΛΛΕΙΨΕΙΣ</h3>';
    gaps.filter(function(g){return g.severity!=='critical';}).forEach(function(gap){
      html += '<div class="gap-item">';
      html += '<span style="flex:1;"><strong>' + gap.nutrient + '</strong></span>';
      html += '<span style="text-align:right;">' + gap.actual.toFixed(1) + ' / ' + gap.target + ' ' + gap.unit + ' (' + gap.percent + '%)</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Recommended supplements section
  if(recommendations.length > 0){
    html += '<div class="gap-section">';
    html += '<h3 style="color:#1976d2;margin-top:0;">💊 ΣΥΝΙΣΤΩΜΕΝΑ ΣΥΜΠΛΗΡΩΜΑΤΑ</h3>';
    recommendations.forEach(function(rec){
      html += '<div class="supp-rec">';
      html += '<div style="font-weight:bold;color:#1976d2;">' + rec.supplement + ' - ' + rec.recommendedDose + ' ' + rec.unit + '</div>';
      html += '<div style="font-size:12px;color:#666;margin-top:3px;">' + rec.nutrient + ' | ' + rec.reason + '</div>';
      if(rec.timing){
        html += '<div style="font-size:11px;color:#666;margin-top:2px;">⏰ ' + rec.timing.t + '</div>';
      }
      if(rec.interactions && rec.interactions.length > 0){
        html += '<div style="font-size:11px;color:#d32f2f;margin-top:2px;">⚠️ ' + rec.timing_note + ': ' + rec.interactions.join(', ') + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  if(recommendations.length === 0 && gaps.length === 0){
    html += '<div style="text-align:center;padding:40px;color:#999;">';
    html += '<p style="font-size:14px;font-weight:bold;">✅ Εξαιρετική κάλυψη!</p>';
    html += '<p>Το πλάνο διατροφής σας καλύπτει τις περισσότερες μικροθρεπτικές σας ανάγκες.</p>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function closeGapAnalysisModal(){
  var modal = document.getElementById('gap-analysis-modal');
  if(modal) modal.style.display = 'none';
}

// ══════════════════════════════════════════════════════════════════════════════
// INITIALIZE APP ON LOAD
// ══════════════════════════════════════════════════════════════════════════════
window.addEventListener('load', function(){
  console.log('=== PAGE LOAD STARTED ===');
  console.log('genPlan defined?', typeof genPlan);
  console.log('getC defined?', typeof getC);
  console.log('calcTDEE defined?', typeof calcTDEE);
  console.log('allocateMealTargets defined?', typeof allocateMealTargets);

  loadTrackingData();  // Load tracking data from localStorage
  initializeApp();     // Show login or app based on whether clients exist

  // ✅ PHASE 3: INITIALIZE MOBILE OPTIMIZATIONS
  TOUCH_HANDLERS.init();
  MOBILE_VIEWPORT.onResize();
  console.log('✅ Mobile optimizations initialized');

  // ✅ PHASE 4: INITIALIZE UNDO/REDO SYSTEM
  setTimeout(function(){
    if(typeof UndoRedoManager !== 'undefined' && !window.undoRedoManager){
      window.undoRedoManager = new UndoRedoManager();
      console.log('✅ UndoRedoManager initialized');

      // Setup keyboard shortcuts
      document.addEventListener('keydown', function(e){
        if((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey){
          e.preventDefault();
          undo();
        }
        if((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))){
          e.preventDefault();
          redo();
        }
      });
      console.log('✅ Keyboard shortcuts registered (Ctrl+Z, Ctrl+Y)');
      updateUndoRedoUI();
    }
  }, 500);

  console.log('=== PAGE LOAD COMPLETE ===');
});

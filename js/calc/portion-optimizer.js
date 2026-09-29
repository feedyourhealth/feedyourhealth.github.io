// js/calc/portion-optimizer.js
// «⚖️ Προσαρμογή ποσοτήτων»: φέρνει ένα ΗΔΗ έτοιμο πλάνο όσο πιο κοντά γίνεται στους στόχους
// kcal/Π/Λ/Υ κάθε ημέρας, αλλάζοντας ΜΟΝΟ γραμμάρια — κανένα τρόφιμο δεν προστίθεται/αφαιρείται.
// Διαφορά από τη scalePlan (plan-energy.js): εκείνη τρέχει μόνο στη δημιουργία πλάνου και
// κλιμακώνει ανά κατηγορία με έναν λόγο (προσεγγιστικά). Εδώ λύνεται ένα μικρό πρόβλημα
// ελαχίστων τετραγώνων με όρια ανά τρόφιμο, οπότε πιάνει και πλάνα διορθωμένα με το χέρι.
// Σταθεροί κανόνες (χωρίς ρυθμίσεις στο UI — ρητή επιλογή της διαιτολόγου: «ένα κουμπί»):
//   • προτεραιότητα θερμίδες (βάρος 1000 ≈ υποχρεωτικό) > μακροθρεπτικά (10)
//   • κάθε τρόφιμο αλλάζει το πολύ ±PO_MAX_CHANGE
//   • κάθε γεύμα μένει κοντά στις θερμίδες που είχε (όχι «όλοι οι υδατάνθρακες στο βραδινό»)
//   • WHOLE_UNIT_FOODS + συσκευασμένα (μπάρα/κύπελλο/…) αλλάζουν μόνο κατά ολόκληρα τεμάχια
//   • αλλαγές < PO_MIN_CHANGE αγνοούνται (θόρυβος τύπου 180→175g)
//   • πρωτεΐνη ανά κύριο γεύμα: η κύρια πηγή δεν πέφτει κάτω από ~0.3 g/kg ανά γεύμα
//     (Schoenfeld & Aragon 2018: 0.4 g/kg × ≥4 γεύματα) ούτε κάτω από πραγματική μερίδα
//     κρέατος/ψαριού (PO_MEAT_MIN_G)
//   • ημέρες προπόνησης: οι υδατάνθρακες στα pre/post-workout γεύματα δεν μειώνονται
//     (Thomas et al. 2016 — ίδιο πλαίσιο με το cho-protocol.js)
//   • όλη η εβδομάδα: το ίδιο τρόφιμο με την ίδια αρχική μερίδα παίρνει την ίδια νέα μερίδα
//     σε όλες τις ημέρες (meal prep / λίστα αγορών) — λύνεται ως ΚΟΙΝΗ μεταβλητή
// Deps (runtime): cm, FOODS, resolveFood, FOOD_UNITS, WHOLE_UNIT_FOODS, classifyMealSlot, deepClone,
// getC, calcTDEE, getDayTgtEff, save, renderWeekTable, DAYS, esc, dietoToast, showErrorToast.

var PO_MAX_CHANGE=0.5, PO_MIN_CHANGE=0.10, PO_OK_BAND=10; // PO_OK_BAND: ±% πέρα από το οποίο το toast προειδοποιεί (στενότερο = θόρυβος για 106%)
// PO_W_KCAL πολύ υψηλό = οι θερμίδες λειτουργούν πρακτικά ως υποχρεωτικός στόχος (επιλογή διαιτολόγου:
// «θερμίδες πρώτα»). Με 60 σε πλάνο με λίπος 192% οι θερμίδες έπεφταν 99%→92% για να κλείσει το λίπος.
var PO_W_KCAL=1000, PO_W_MACRO=10, PO_W_STAY=0.04, PO_W_MEAL=0.4;
var PO_PROT_PER_MEAL_GKG=0.3, PO_MEAT_MIN_G=80;
// Συσκευασμένα προϊόντα: η μονάδα τους είναι μια συσκευασία — «155g» από κύπελλο 150g δεν έχει νόημα.
var PO_PACK_UNITS={'μπάρα':1,'bar':1,'κύπελλο':1,'μπουκάλι':1,'συσκευασία':1,'scoop':1,'patty':1};
var PO_NO_TIE_CATS={'Λάδια':1,'Ξηροί καρποί':1};

function _poWholeG(n){
  var fu=FOOD_UNITS[n];
  if(!fu||!fu.g)return 0;
  return (WHOLE_UNIT_FOODS[n]||PO_PACK_UNITS[fu.u])?fu.g:0;
}

// Χτίζει τις μεταβλητές για τις ημέρες dayIdxs. Κάθε «ομάδα» = μία μεταβλητή γραμμαρίων· τρόφιμα με
// ίδιο όνομα + ίδια αρχική ποσότητα μοιράζονται ομάδα (ίδια νέα μερίδα παντού).
function _poBuild(c, dayIdxs, effByDay, extraLocks){
  var items=[],groups=[],byKey={},days=[];
  var trainDays=c.trainDays||[];
  var protFloorMeal=(c.weight>0?c.weight:0)*PO_PROT_PER_MEAL_GKG;
  dayIdxs.forEach(function(d){
    var meals=c.weekPlan[d],T=effByDay[d];
    var mealK0=meals.map(function(m){return (m.foods||[]).reduce(function(s,f){return s+cm(f.n,f.g).k;},0);});
    days.push({d:d,T:T,mealK0:mealK0});
    meals.forEach(function(m,mi){
      var slot=(typeof classifyMealSlot==='function')?classifyMealSlot(m.name):'other';
      var isMain=slot==='breakfast'||slot==='lunch'||slot==='dinner';
      var isTrainMeal=!!trainDays[d]&&(m.mealTiming==='pre-workout'||m.mealTiming==='post-workout');
      var mealItems=[];
      (m.foods||[]).forEach(function(f,fi){
        var v=cm(f.n,100),g0=+f.g||0,wholeG=_poWholeG(f.n);
        var cat=(FOODS[resolveFood(f.n)]||{}).cat||'';
        // Λάδια/ξηροί καρποί ΔΕΝ δένονται μεταξύ ημερών: είναι το «ρυθμιστικό» του λίπους κάθε ημέρας
        // και 5g vs 8g λάδι δεν αφορά το meal prep. Δεμένα, το λίπος ανέβαινε 104%→121% σε 3/7 ημέρες.
        // Το '#'+index είναι σταθερό ανάμεσα στα δύο builds (ίδια σειρά), οπότε δουλεύει και για extraLocks.
        var key=PO_NO_TIE_CATS[cat]?('#'+items.length):(f.n+'|'+g0);
        // Κλειδωμένα: μηδενικές θερμίδες (μπαχαρικά/άγνωστα), μηδενική ποσότητα, ή ακέραιο/συσκευασμένο
        // τρόφιμο που ΔΕΝ είναι ήδη σε ακέραια τεμάχια (π.χ. ½ πίτα) — αλλιώς θα «στρογγυλευόταν» σε ολόκληρο.
        var locked=v.k<=0||g0<=0||(extraLocks&&extraLocks[key])||(wholeG&&Math.abs(g0/wholeG-Math.round(g0/wholeG))>0.01);
        // Κάτω όριο: ±PO_MAX_CHANGE (+ ελάχιστο 5g). ΟΧΙ minScaleG — για τρόφιμα με μεγάλη μονάδα
        // «κλείδωνε» κάθε μερίδα κάτω από μισό τεμάχιο (βλ. MIN_SCALE_G_OVERRIDE στο plan-energy.js).
        var lo=Math.max(g0*(1-PO_MAX_CHANGE),Math.min(5,g0)),hi=g0*(1+PO_MAX_CHANGE);
        // Προπόνηση: τρόφιμα με ≥50% θερμίδων από υδατάνθρακες δεν μειώνονται στα pre/post-workout.
        if(isTrainMeal&&v.k>0&&v.c*4/v.k>=0.5)lo=g0;
        var tieKey=locked?('#'+items.length):key;
        var it={d:d,mi:mi,fi:fi,n:f.n,g0:g0,k:v.k/100,p:v.p/100,f:v.f/100,c:v.c/100,wholeG:wholeG,
          locked:!!locked,lo:lo,hi:hi,key:key,tieKey:tieKey,cat:cat};
        items.push(it);mealItems.push(it);
      });
      // Πρωτεΐνη κύριου γεύματος: η μεγαλύτερη πηγή κρατά το μερίδιό της στο ελάχιστο ανά γεύμα.
      if(isMain&&protFloorMeal>0){
        var mealP=mealItems.reduce(function(s,it){return s+it.p*it.g0;},0);
        var top=mealItems.filter(function(it){return !it.locked&&it.p>0;}).sort(function(a,b){return b.p*b.g0-a.p*a.g0;})[0];
        if(top&&mealP>0){
          var need=protFloorMeal*(top.p*top.g0/mealP)/top.p;
          if(top.cat==='Κρέας'||top.cat==='Ψάρια')need=Math.max(need,PO_MEAT_MIN_G);
          top.lo=Math.max(top.lo,Math.min(top.g0,need));
        }
      }
    });
  });
  items.forEach(function(it){
    var gi=byKey[it.tieKey];
    if(gi==null){gi=byKey[it.tieKey]=groups.length;groups.push({items:[],g0:it.g0,g:it.g0,lo:it.lo,hi:it.hi,wholeG:it.wholeG,locked:it.locked,key:it.key});}
    var gr=groups[gi];gr.items.push(it);it.gi=gi;
    gr.lo=Math.max(gr.lo,it.lo);gr.hi=Math.min(gr.hi,it.hi);
  });
  groups.forEach(function(gr){if(gr.locked){gr.lo=gr.hi=gr.g0;}});
  return {items:items,groups:groups,days:days};
}

function _poSolve(M){
  var items=M.items,groups=M.groups,R=[];
  function row(w,t,pick){ // pick(it) → συντελεστής του item στη γραμμή
    var a={};items.forEach(function(it){var v=pick(it);if(v)a[it.gi]=(a[it.gi]||0)+v;});
    R.push({w:w,t:t,a:a});
  }
  M.days.forEach(function(D){
    var T=D.T;
    row(PO_W_KCAL,1,function(it){return it.d===D.d?it.k/T.k:0;});
    ['p','f','c'].forEach(function(x){
      if(T[x]>0)row(PO_W_MACRO,1,function(it){return it.d===D.d?it[x]/T[x]:0;});
    });
    D.mealK0.forEach(function(k0,mi){
      if(k0>0)row(PO_W_MEAL,1,function(it){return it.d===D.d&&it.mi===mi?it.k/k0:0;});
    });
  });
  groups.forEach(function(gr,gi){
    var s=Math.max(gr.g0,20),a={};a[gi]=1/s;
    R.push({w:PO_W_STAY*gr.items.length,t:gr.g0/s,a:a});
  });
  var colRows=groups.map(function(){return [];});
  R.forEach(function(r,j){Object.keys(r.a).forEach(function(gi){colRows[gi].push(j);});});
  // Coordinate descent: κάθε μεταβλητή έχει κλειστή λύση (τετραγωνική), μετά clamp στα όρια.
  function pass(){
    var res=R.map(function(r){var s=-r.t;for(var gi in r.a)s+=r.a[gi]*groups[gi].g;return s;});
    for(var sw=0;sw<800;sw++){
      var moved=0;
      groups.forEach(function(gr,gi){
        if(gr.locked||gr.fixed)return;
        var num=0,den=0;
        colRows[gi].forEach(function(j){var r=R[j],a=r.a[gi];num+=r.w*a*res[j];den+=r.w*a*a;});
        if(!den)return;
        var ng=Math.min(gr.hi,Math.max(gr.lo,gr.g-num/den)),d=ng-gr.g;
        if(d){colRows[gi].forEach(function(j){res[j]+=R[j].a[gi]*d;});gr.g=ng;moved+=Math.abs(d);}
      });
      if(moved<0.01)break;
    }
  }
  pass();
  // Ακέραια/συσκευασμένα → πλησιέστερο ακέραιο τεμάχιο ΜΕΣΑ στα όρια, και ξανά λύση για τα υπόλοιπα.
  groups.forEach(function(gr){
    if(gr.locked||!gr.wholeG)return;
    var minU=Math.max(1,Math.ceil(gr.lo/gr.wholeG-1e-9)),maxU=Math.floor(gr.hi/gr.wholeG+1e-9);
    var u=Math.round(gr.g/gr.wholeG);
    gr.g=(minU<=maxU)?Math.min(maxU,Math.max(minU,u))*gr.wholeG:gr.g0;
    gr.fixed=true;
  });
  pass();
  groups.forEach(function(gr){
    if(gr.locked||gr.wholeG)return;
    var st=gr.g<25?1:5;
    gr.g=Math.min(Math.round(gr.hi),Math.max(Math.round(gr.lo),Math.round(gr.g/st)*st));
  });
}

// Επιστρέφει {byDay:{d:meals}, changed, changedDays, touched} χωρίς να αγγίζει το c.weekPlan.
function optimizePlanPortions(c, dayIdxs, effByDay){
  var M=_poBuild(c,dayIdxs,effByDay);
  _poSolve(M);
  // Δεύτερο πέρασμα: ό,τι άλλαξε λιγότερο από PO_MIN_CHANGE μένει όπως ήταν, και ξαναλύνεται.
  var extra={},any=false;
  M.groups.forEach(function(gr){if(!gr.locked&&gr.g!==gr.g0&&Math.abs(gr.g/gr.g0-1)<PO_MIN_CHANGE){extra[gr.key]=1;any=true;}});
  if(any){M=_poBuild(c,dayIdxs,effByDay,extra);_poSolve(M);}
  var byDay={},changed=0,touched={};
  dayIdxs.forEach(function(d){byDay[d]=deepClone(c.weekPlan[d]);});
  M.items.forEach(function(it){
    var g=M.groups[it.gi].g;
    if(g!==it.g0){byDay[it.d][it.mi].foods[it.fi].g=g;changed++;touched[it.d]=1;}
  });
  return {byDay:byDay,changed:changed,changedDays:Object.keys(touched).length,touched:touched};
}

function _poTot(meals){
  var t={k:0,p:0,f:0,c:0};
  meals.forEach(function(m){(m.foods||[]).forEach(function(f){var v=cm(f.n,f.g);t.k+=v.k;t.p+=v.p;t.f+=v.f;t.c+=v.c;});});
  return t;
}

// Ποια μακροθρεπτικά ΔΕΝ φτάνουν ±PO_OK_BAND, με τις 2 κύριες πηγές όταν είναι πάνω από τον στόχο.
function _poMisses(meals, T){
  var names={p:'πρωτεΐνη',f:'λίπος',c:'υδατάνθρακες'},out=[];
  ['p','f','c'].forEach(function(x){
    if(!(T[x]>0))return;
    var tot=_poTot(meals)[x],pct=Math.round(tot/T[x]*100);
    if(Math.abs(pct-100)<=PO_OK_BAND)return;
    var msg=names[x]+' '+pct+'%';
    if(pct>100){
      var agg={};
      meals.forEach(function(m){(m.foods||[]).forEach(function(f){agg[f.n]=(agg[f.n]||0)+cm(f.n,f.g)[x];});});
      var top=Object.keys(agg).sort(function(a,b){return agg[b]-agg[a];}).slice(0,2);
      if(top.length)msg+=' (κυρίως '+top.join(', ')+')';
    }
    out.push(msg);
  });
  return out;
}

// dayIndex: αριθμός → μόνο αυτή η ημέρα· undefined → όλη η εβδομάδα.
function adjustPlanPortions(dayIndex){
  var c=getC();
  if(!c||!c.weekPlan||!Object.keys(c.weekPlan).length){showErrorToast('Δεν υπάρχει πλάνο για προσαρμογή.');return;}
  var tdee=calcTDEE(c),eff=getDayTgtEff(c,tdee),effByDay={};
  var days=((typeof dayIndex==='number')?[dayIndex]:[0,1,2,3,4,5,6]).filter(function(d){
    var meals=c.weekPlan[d];
    if(!meals||!meals.length)return false;
    var e=eff[d]||{k:tdee.target,p:tdee.p,f:tdee.f,c:tdee.carb};
    if(!(e.k>0))return false;
    effByDay[d]=e;return true;
  });
  if(!days.length){showErrorToast('Δεν υπάρχει πλάνο για προσαρμογή.');return;}
  var oldPlan=deepClone(c.weekPlan);
  var r=optimizePlanPortions(c,days,effByDay),misses=[];
  days.forEach(function(d){
    if(r.touched[d])c.weekPlan[d]=r.byDay[d];
    var m=_poMisses(c.weekPlan[d],effByDay[d]);
    if(m.length)misses.push(DAYS[d]+': '+m.join(', '));
  });
  if(r.changed){save();renderWeekTable();}
  showPortionAdjustToast(r.changed,r.changedDays,misses,r.changed?oldPlan:null,dayIndex);
}

function showPortionAdjustToast(changed,touchedDays,misses,oldPlan,dayIndex){
  var existing=document.getElementById('portion-adjust-toast');if(existing)existing.remove();
  var scope=(typeof dayIndex==='number')?('Προσαρμόστηκε η '+DAYS[dayIndex])
    :(touchedDays===1?'Προσαρμόστηκε 1 ημέρα':'Προσαρμόστηκαν '+touchedDays+' ημέρες');
  var head=changed?('✓ '+scope+' · '+changed+(changed===1?' τρόφιμο άλλαξε':' τρόφιμα άλλαξαν')+' ποσότητα')
                  :'✓ Το πλάνο είναι ήδη όσο πιο κοντά γίνεται στους στόχους';
  var warn=misses.length?('<div style="margin-top:6px;opacity:.95">⚠️ Δεν φτάνουν μόνο με ποσότητες — σκέψου αλλαγή τροφίμου:<br>'
    +misses.map(esc).join('<br>')+'</div>'):'';
  var t=document.createElement('div');
  t.id='portion-adjust-toast';
  t.style.cssText='position:fixed;bottom:20px;right:20px;background:#025857;color:#fff;padding:10px 10px 10px 16px;border-radius:8px;font-size:12px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;align-items:flex-start;gap:12px;max-width:420px';
  t.innerHTML='<div>'+esc(head)+warn+'</div>'
    +(oldPlan?'<button style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0">↩ Αναίρεση</button>'
             :'<button aria-label="Κλείσιμο" style="background:none;border:0;color:#fff;font-size:16px;cursor:pointer;line-height:1;flex-shrink:0">×</button>');
  document.body.appendChild(t);
  var timer=setTimeout(function(){t.remove();},misses.length?15000:7000);
  t.querySelector('button').onclick=function(){
    clearTimeout(timer);t.remove();
    if(!oldPlan)return;
    var cc=getC();
    if(cc){cc.weekPlan=oldPlan;save();renderWeekTable();}
    dietoToast('↩ Η προσαρμογή ποσοτήτων αναιρέθηκε');
  };
}

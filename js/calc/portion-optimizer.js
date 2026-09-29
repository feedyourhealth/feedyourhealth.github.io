// js/calc/portion-optimizer.js
// «⚖️ Προσαρμογή ποσοτήτων»: φέρνει ένα ΗΔΗ έτοιμο πλάνο όσο πιο κοντά γίνεται στους στόχους
// kcal/Π/Λ/Υ της ημέρας, αλλάζοντας ΜΟΝΟ γραμμάρια — κανένα τρόφιμο δεν προστίθεται/αφαιρείται.
// Διαφορά από τη scalePlan (plan-energy.js): εκείνη τρέχει μόνο στη δημιουργία πλάνου και
// κλιμακώνει ανά κατηγορία με έναν λόγο (προσεγγιστικά). Εδώ λύνεται ένα μικρό πρόβλημα
// ελαχίστων τετραγώνων με όρια ανά τρόφιμο, οπότε πιάνει και πλάνα διορθωμένα με το χέρι.
// Σταθεροί κανόνες (χωρίς ρυθμίσεις στο UI):
//   • προτεραιότητα θερμίδες (βάρος 1000) > μακροθρεπτικά (10)
//   • κάθε τρόφιμο αλλάζει το πολύ ±PO_MAX_CHANGE
//   • κάθε γεύμα μένει κοντά στις θερμίδες που είχε (όχι «όλοι οι υδατάνθρακες στο βραδινό»)
//   • WHOLE_UNIT_FOODS αλλάζουν μόνο κατά ολόκληρα τεμάχια (αν ήταν ήδη ακέραια)
//   • αλλαγές < PO_MIN_CHANGE αγνοούνται (θόρυβος τύπου 180→175g)
// Deps (runtime): cm, resolveFood, FOODS, FOOD_UNITS, WHOLE_UNIT_FOODS, deepClone,
// getC, calcTDEE, getDayTgtEff, save, renderWeekTable, DAYS.

var PO_MAX_CHANGE=0.5, PO_MIN_CHANGE=0.10, PO_OK_BAND=10; // PO_OK_BAND: ±% πέρα από το οποίο το toast προειδοποιεί (στενότερο = θόρυβος για 106%)
// PO_W_KCAL πολύ υψηλό = οι θερμίδες λειτουργούν πρακτικά ως υποχρεωτικός στόχος (επιλογή διαιτολόγου:
// «θερμίδες πρώτα»). Με 60 σε πλάνο με λίπος 192% οι θερμίδες έπεφταν 99%→92% για να κλείσει το λίπος.
var PO_W_KCAL=1000, PO_W_MACRO=10, PO_W_STAY=0.04, PO_W_MEAL=0.4;

function _poItems(dayMeals, extraLocks){
  var items=[];
  dayMeals.forEach(function(m,mi){(m.foods||[]).forEach(function(f,fi){
    var v=cm(f.n,100), g0=+f.g||0, id=mi+':'+fi;
    var fu=FOOD_UNITS[f.n], wholeG=(WHOLE_UNIT_FOODS[f.n]&&fu&&fu.g)?fu.g:0;
    // Κλειδωμένα: μηδενικές θερμίδες (μπαχαρικά/άγνωστα), μηδενική ποσότητα, ή ακέραιο τρόφιμο
    // που ΔΕΝ είναι ήδη σε ακέραια τεμάχια (π.χ. ½ πίτα) — αλλιώς θα «στρογγυλευόταν» σε ολόκληρο.
    var locked=v.k<=0||g0<=0||(extraLocks&&extraLocks[id])||(wholeG&&Math.abs(g0/wholeG-Math.round(g0/wholeG))>0.01);
    // Κάτω όριο: μόνο το ±PO_MAX_CHANGE (+ ελάχιστο 5g). ΟΧΙ minScaleG — για τρόφιμα με μεγάλη
    // μονάδα (Αβοκάντο 200g/τεμ. → minScaleG 100g) «κλείδωνε» κάθε μερίδα κάτω από μισό τεμάχιο.
    var lo=Math.max(g0*(1-PO_MAX_CHANGE),Math.min(5,g0)), hi=g0*(1+PO_MAX_CHANGE);
    items.push({id:id,n:f.n,g0:g0,g:g0,mi:mi,k:v.k/100,p:v.p/100,f:v.f/100,c:v.c/100,wholeG:wholeG,
      locked:!!locked,lo:locked?g0:lo,hi:locked?g0:hi});
  });});
  return items;
}

function _poSolve(items, T, mealK0){
  var R=[{w:PO_W_KCAL,t:1,a:items.map(function(it){return it.k/T.k;})}];
  ['p','f','c'].forEach(function(x){
    if(T[x]>0)R.push({w:PO_W_MACRO,t:1,a:items.map(function(it){return it[x]/T[x];})});
  });
  items.forEach(function(it,i){
    var s=Math.max(it.g0,20),a=items.map(function(){return 0;});a[i]=1/s;
    R.push({w:PO_W_STAY,t:it.g0/s,a:a});
  });
  mealK0.forEach(function(k0,mi){
    if(k0>0)R.push({w:PO_W_MEAL,t:1,a:items.map(function(it){return it.mi===mi?it.k/k0:0;})});
  });
  // Coordinate descent: κάθε μεταβλητή έχει κλειστή λύση (τετραγωνική), μετά clamp στα όρια.
  function pass(){
    var res=R.map(function(r){return r.a.reduce(function(s,a,i){return s+a*items[i].g;},0)-r.t;});
    for(var sw=0;sw<800;sw++){
      var moved=0;
      items.forEach(function(it,i){
        if(it.locked||it.fixed)return;
        var num=0,den=0;
        R.forEach(function(r,j){var a=r.a[i];if(a){num+=r.w*a*res[j];den+=r.w*a*a;}});
        if(!den)return;
        var ng=Math.min(it.hi,Math.max(it.lo,it.g-num/den)),d=ng-it.g;
        if(d){R.forEach(function(r,j){if(r.a[i])res[j]+=r.a[i]*d;});it.g=ng;moved+=Math.abs(d);}
      });
      if(moved<0.01)break;
    }
  }
  pass();
  // Ακέραια τρόφιμα → πλησιέστερο ακέραιο τεμάχιο ΜΕΣΑ στα όρια, και ξανά λύση για τα υπόλοιπα.
  items.forEach(function(it){
    if(it.locked||!it.wholeG)return;
    var minU=Math.max(1,Math.ceil(it.lo/it.wholeG-1e-9)),maxU=Math.floor(it.hi/it.wholeG+1e-9);
    var u=Math.round(it.g/it.wholeG);
    it.g=(minU<=maxU)?Math.min(maxU,Math.max(minU,u))*it.wholeG:it.g0;
    it.fixed=true;
  });
  pass();
  items.forEach(function(it){
    if(it.locked||it.wholeG)return;
    var st=it.g<25?1:5;
    it.g=Math.round(it.g/st)*st;
  });
}

// Επιστρέφει {meals, changed, before, after} χωρίς να αγγίζει το dayMeals.
function optimizeDayPortions(dayMeals, T){
  var mealK0=dayMeals.map(function(m){return (m.foods||[]).reduce(function(s,f){return s+cm(f.n,f.g).k;},0);});
  var items=_poItems(dayMeals);
  _poSolve(items,T,mealK0);
  // Δεύτερο πέρασμα: ό,τι άλλαξε λιγότερο από PO_MIN_CHANGE μένει όπως ήταν, και ξαναλύνεται.
  var extra={},any=false;
  items.forEach(function(it){if(!it.locked&&it.g!==it.g0&&Math.abs(it.g/it.g0-1)<PO_MIN_CHANGE){extra[it.id]=1;any=true;}});
  if(any){items=_poItems(dayMeals,extra);_poSolve(items,T,mealK0);}
  var out=deepClone(dayMeals),k=0,changed=0;
  out.forEach(function(m){(m.foods||[]).forEach(function(f){var it=items[k++];if(it.g!==it.g0){f.g=it.g;changed++;}});});
  return {meals:out,changed:changed,before:_poTot(dayMeals),after:_poTot(out)};
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
  var tdee=calcTDEE(c),eff=getDayTgtEff(c,tdee);
  var days=(typeof dayIndex==='number')?[dayIndex]:[0,1,2,3,4,5,6];
  var oldPlan=deepClone(c.weekPlan),changed=0,touchedDays=0,misses=[];
  days.forEach(function(d){
    var meals=c.weekPlan[d];
    if(!meals||!meals.length)return;
    var e=eff[d]||{k:tdee.target,p:tdee.p,f:tdee.f,c:tdee.carb};
    if(!(e.k>0))return;
    var r=optimizeDayPortions(meals,e);
    if(r.changed){c.weekPlan[d]=r.meals;changed+=r.changed;touchedDays++;}
    var m=_poMisses(r.changed?r.meals:meals,e);
    if(m.length)misses.push(DAYS[d]+': '+m.join(', '));
  });
  if(changed){save();renderWeekTable();}
  showPortionAdjustToast(changed,touchedDays,misses,changed?oldPlan:null,dayIndex);
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

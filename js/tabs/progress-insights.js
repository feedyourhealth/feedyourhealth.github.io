// js/tabs/progress-insights.js
// 📈 Πρόοδος πελάτη — 4 κάρτες + 2 προσθήκες στις «🔄 Αντικαταστάσεις» (2026-10-22, μετά από mockup).
// Όλα από δεδομένα που ΗΔΗ στέλνει το link (plan.html) — τίποτα νέο δεν ζητιέται από τον πελάτη:
//   progressSkipsHtml      ποιο γεύμα παραλείπει + καθημερινές/Σαββατοκύριακο   (client_meal_log)
//   piSwapDetailHtml       πλάνο ↔ τι έφαγε, με γραμμάρια/μακρο, μέσα στη λίστα αντικαταστάσεων
//   piSwapPrefsHtml        τι προτιμά ανά γεύμα (4 εβδ.)
//   progressSuppsHtml      ποιο συμπλήρωμα ξεχνά                                  (client_supp_log)
//   progressShopHtml       λίστα αγορών: τι έχει τσεκάρει τώρα                     (client_shop_log)
// Οι κάρτες με κενά δεδομένα ΔΕΝ εμφανίζονται. Η σημερινή μέρα δεν μετρά (δεν έχει τελειώσει).
// Το openProgressClient (progress.js) τις καλεί πίσω από typeof guards.

var PI_DAYS=28;                // παράθυρο για ποσοστά παράλειψης / συμπληρώματα
var PI_MIN_DAYS=7;             // λιγότερες μέρες καταγραφής ⇒ η κάρτα παράλειψης δεν βγαίνει
var PI_SKIP_FLAG_PCT=60;       // γεύμα κάτω από αυτό, και ≥15 μονάδες κάτω από το καλύτερο ⇒ μήνυμα
var PI_WEEKEND_GAP_PP=15;      // διαφορά καθημερινές/Σ-Κ που αξίζει μήνυμα

// Μέρες από (σήμερα − PI_DAYS) έως ΧΘΕΣ, όχι πριν από την πρώτη καταγραφή του πελάτη.
function piPastDates(firstKey){
  var out=[], d=new Date(); d.setHours(0,0,0,0);
  for(var i=PI_DAYS;i>=1;i--){
    var x=new Date(d); x.setDate(d.getDate()-i);
    var k=ckDayKey(x);
    if(!firstKey || k>=firstKey) out.push(k);
  }
  return out;
}
function piWeekday(key){ return (new Date(key+'T00:00:00').getDay()+6)%7; }
function piFirstKey(rows,log){
  var ks=Object.keys(log||{}).sort();
  return [rows&&rows.length?rows[0].date:null, ks[0]||null].filter(Boolean).sort()[0]||null;
}

// Ετικέτες γευμάτων μιας ημέρας: τα πολλά «Ενδιάμεσο» ξεχωρίζουν από τη θέση τους ως προς
// μεσημεριανό/βραδινό (αλλιώς θα ενώνονταν σε μία γραμμή).
function piSlotLabels(meals){
  var names=(meals||[]).map(function(m){ return (m&&m.name)||''; });
  var lunch=names.indexOf('Μεσημεριανό'), dinner=names.indexOf('Βραδινό'), seen={};
  return names.map(function(n,i){
    if(n!=='Ενδιάμεσο') return n||('Γεύμα '+(i+1));
    var w=(lunch>-1 && i<lunch)?'πρωί':(dinner>-1 && i>dinner)?'βράδυ':(lunch>-1 && i>lunch)?'απόγευμα':'';
    var lbl='Ενδιάμεσο'+(w?' '+w:'');
    seen[lbl]=(seen[lbl]||0)+1;
    return seen[lbl]>1?lbl+' '+seen[lbl]:lbl;
  });
}

// ── 1. Ποιο γεύμα παραλείπει + καθημερινές ή Σαββατοκύριακο ─────────────────────────────────
function progressSkipsHtml(c,ckRows){
  var log=(window.Cloud && Cloud.mealLogFor)?Cloud.mealLogFor(c):{};
  var firstKey=piFirstKey(ckRows,log);
  if(!firstKey) return '';
  var dates=piPastDates(firstKey);
  if(dates.length<PI_MIN_DAYS) return '';
  var ckByDate=ckRowsByDate(ckRows), order=[], by={}, grp={wd:{on:0,tot:0},we:{on:0,tot:0}};
  dates.forEach(function(k){
    var wd=piWeekday(k), meals=((c.weekPlan||{})[wd])||[], labels=piSlotLabels(meals);
    var tot=progressSwapMealsTotal(c,ckByDate[k],k), m=log[k]||{}, g=grp[wd>=5?'we':'wd'];
    for(var j=0;j<tot;j++){
      var lbl=labels[j]||('Γεύμα '+(j+1));
      if(!by[lbl]){ by[lbl]={on:0,tot:0}; order.push(lbl); }
      by[lbl].tot++; g.tot++;
      if(m[j]){ by[lbl].on++; g.on++; }
    }
  });
  if(!order.length) return '';
  function pct(o){ return o.tot?Math.round(o.on/o.tot*100):0; }
  var best=Math.max.apply(null,order.map(function(l){return pct(by[l]);}));
  var worst=order.slice().sort(function(a,b){return pct(by[a])-pct(by[b]);})[0];
  var html='<div class="hm-card" style="margin-bottom:14px"><div class="hm-card-title">🍽 Ποιο γεύμα παραλείπει'
    +'<span style="margin-left:auto;font-size:12px;font-weight:400;color:var(--text-muted)">τελευταίες '+dates.length+' μέρες · χωρίς σήμερα</span></div>';
  html+='<div class="pi-bars">'+order.map(function(l){
    var p=pct(by[l]), low=p<PI_SKIP_FLAG_PCT;
    return '<span class="pi-bl">'+esc(l)+'</span><span class="pi-bt"><span class="pi-bf'+(low?' pi-low':'')+'" style="width:'+p+'%"></span></span>'
      +'<span class="pi-bv'+(low?' pi-lowt':'')+'">'+p+'%</span><span class="pi-bn">'+by[l].on+'/'+by[l].tot+'</span>';
  }).join('')+'</div>';
  var wp=pct(by[worst]);
  if(wp<PI_SKIP_FLAG_PCT && best-wp>=15)
    html+='<div class="pi-note">Το «'+esc(worst)+'» τσεκάρεται μόνο '+Math.round(wp/10)+' στις 10 φορές — ίσως θέλει πιο εύκολη επιλογή ή άλλη ώρα.</div>';
  var a=pct(grp.wd), b=pct(grp.we);
  if(grp.wd.tot && grp.we.tot){
    html+='<div class="pr-wk-tiles" style="margin-top:12px">'
      +'<div class="pr-wk-tile"><div class="pr-wk-tl">Καθημερινές (Δε–Πα)</div><div class="pr-wk-tv">'+a+'%</div></div>'
      +'<div class="pr-wk-tile"><div class="pr-wk-tl">Σαββατοκύριακο</div><div class="pr-wk-tv"'+(a-b>=PI_WEEKEND_GAP_PP?' style="color:#8a5b00"':'')+'>'+b+'%</div></div>'
      +'</div>';
    if(a-b>=PI_WEEKEND_GAP_PP) html+='<div class="pi-note">Το Σαββατοκύριακο πέφτει '+(a-b)+' μονάδες — αξίζει κουβέντα στο ραντεβού.</div>';
    else if(b-a>=PI_WEEKEND_GAP_PP) html+='<div class="pi-note">Τις καθημερινές πέφτει '+(b-a)+' μονάδες σε σχέση με το Σαββατοκύριακο.</div>';
  }
  html+='<div class="pi-foot">% = γεύματα που τσέκαρε στο link (όπως στο πλάνο ή με εναλλακτική). Μέρα χωρίς καμία καταγραφή μετρά ως μη τσεκαρισμένη.</div>';
  return html+'</div>';
}

// ── 2. Πλάνο ↔ τι έφαγε ──────────────────────────────────────────────────────────────────────
// Τα παλιά λινκ (πριν τις 12/10) έγραφαν τον τίτλο με γραμμάρια — «Γιαούρτι 2% (200 γρ.), …» —
// ενώ το mealShortTitle δεν τα έχει. Χωρίς αυτή την κανονικοποίηση 17 από τις 48 πραγματικές
// αντικαταστάσεις δεν έβρισκαν το αρχικό τους γεύμα (έλεγχος 2026-10-22).
function piNormTitle(o){ return String(o||'').replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').replace(/ ,/g,',').trim(); }
function piMealMatches(m,s,o){ return m && (m.name||'')===s && mealShortTitle(m.foods)===o; }
// Το γεύμα του πλάνου που αντικαταστάθηκε: πρώτα το πλάνο που είχε σταλεί εκείνη τη μέρα (Ιστορικό
// πλάνων), μετά το τρέχον, μετά τα αντίγραφα ασφαλείας. {foods:[{n,g}], partial} ή null.
function piPlannedMeal(c,x){
  var wd=piWeekday(x.date), o=piNormTitle(x.o), plans=[];
  var sent=(c.savedPlans||[]).filter(function(p){return p&&p.weekPlan;}).sort(function(a,b){return (a.date||'')<(b.date||'')?-1:1;});
  var before=sent.filter(function(p){return (p.date||'')<=x.date;});
  if(before.length) plans.push(before[before.length-1].weekPlan);
  plans.push(c.weekPlan);
  (c.planBackups||[]).forEach(function(b){ if(b&&b.weekPlan) plans.push(b.weekPlan); });
  sent.forEach(function(p){ plans.push(p.weekPlan); });
  for(var i=0;i<plans.length;i++){
    var hit=((plans[i]||{})[wd]||[]).filter(function(m){return piMealMatches(m,x.s,o);})[0];
    if(hit) return {foods:(hit.foods||[]).map(function(f){return {n:f.n,g:Math.round(f.g)};}), partial:false};
  }
  // Τελευταία λύση: τα γραμμάρια μέσα στον ίδιο τον παλιό τίτλο (έως 3 τρόφιμα, «…» = υπάρχουν κι άλλα).
  var parts=String(x.o||'').replace(/…$/,'').split(/,\s*(?![^()]*\))/), foods=[];
  parts.forEach(function(p){ var mm=p.match(/^(.*?)\s*\((\d+(?:[.,]\d+)?)\s*γρ\.\)\s*$/); if(mm) foods.push({n:mm[1].trim(),g:Math.round(parseFloat(mm[2].replace(',','.')))}); });
  return foods.length?{foods:foods, partial:/…$/.test(String(x.o||''))}:null;
}
// Μακρο χωρίς το toast «δεν βρέθηκε στη βάση» του cm(): τρόφιμο εκτός FOODS (π.χ. δική σου συνταγή) ⇒ null.
function piMacros(foods){
  var R={k:0,p:0,c:0,f:0}, ok=true;
  (foods||[]).forEach(function(f){
    var known=(typeof FYH_RECIPE_EXPAND!=='undefined' && FYH_RECIPE_EXPAND[f.n]) || (typeof resolveFood==='function' && typeof FOODS!=='undefined' && FOODS[resolveFood(f.n)]);
    if(!known){ ok=false; return; }
    var v=cm(f.n,f.g); R.k+=v.k; R.p+=v.p; R.c+=v.c; R.f+=v.f;
  });
  return ok?{k:Math.round(R.k),p:Math.round(R.p),c:Math.round(R.c),f:Math.round(R.f)}:null;
}
function piFoodsHtml(foods){ return foods.map(function(f){ return '<div>'+esc(f.n)+' · '+f.g+' γρ.</div>'; }).join(''); }
function piMacroLine(m){ return m?'<div class="pi-mac">'+m.k+' kcal · Π '+m.p+' · Υ '+m.c+' · Λ '+m.f+' γρ.</div>':''; }
function piSwapDetailHtml(c,x){
  var plan=piPlannedMeal(c,x);
  var ate=(x.f||[]).map(function(p){ return {n:p[0], g:Math.round(p[1])}; });
  var pm=plan&&!plan.partial?piMacros(plan.foods):null, am=ate.length?piMacros(ate):null;
  var html='<div class="pi-det"><div class="pi-side"><div class="pi-sh">ΣΤΟ ΠΛΑΝΟ</div>'
    +(plan?piFoodsHtml(plan.foods)+(plan.partial?'<div class="pi-mac">…και άλλα τρόφιμα</div>':'')+piMacroLine(pm):'<div>'+esc(x.o)+'</div><div class="pi-mac">Δεν βρέθηκαν τα γραμμάρια.</div>')
    +'</div><div class="pi-side pi-ate"><div class="pi-sh">ΕΦΑΓΕ</div>'
    +(ate.length?piFoodsHtml(ate)+piMacroLine(am):'<div>'+esc(x.n)+'</div><div class="pi-mac">Παλιό link — μόνο το όνομα. Τα γραμμάρια φαίνονται σε links από 12/10 και μετά.</div>')
    +'</div></div>';
  if(pm && am){
    var dk=am.k-pm.k;
    function chip(lbl,d,warn){ return '<span class="pi-chip'+(warn?' pi-chip-w':'')+'">'+lbl+' '+(d>0?'+':'')+d+'</span>'; }
    html+='<div class="pi-chips">'
      +'<span class="pi-chip'+(Math.abs(dk)>=100?' pi-chip-w':'')+'">'+(Math.abs(dk)<50?'Θερμίδες ίδιες ('+(dk>0?'+':'')+dk+')':'Θερμίδες '+(dk>0?'+':'')+dk)+'</span>'
      +chip('Πρωτεΐνη',am.p-pm.p,am.p-pm.p<=-10)+chip('Υδατάνθρακες',am.c-pm.c,Math.abs(am.c-pm.c)>=15)+chip('Λίπος',am.f-pm.f,Math.abs(am.f-pm.f)>=10)
      +'</div>';
  }
  return html;
}

// ── 3. Τι προτιμά ανά γεύμα (πάντα 4 εβδ.) ──────────────────────────────────────────────────
function piSwapPrefsHtml(swaps4w){
  if(!swaps4w || swaps4w.length<3) return '';
  var bySlot={}, order=[];
  swaps4w.forEach(function(x){
    var s=x.s||'Γεύμα';
    if(!bySlot[s]){ bySlot[s]={n:0,to:{},from:{}}; order.push(s); }
    var e=bySlot[s]; e.n++; e.to[x.n]=(e.to[x.n]||0)+1; var o=piNormTitle(x.o); e.from[o]=(e.from[o]||0)+1;
  });
  function top(obj){ return Object.keys(obj).map(function(k){return {k:k,n:obj[k]};}).sort(function(a,b){return b.n-a.n;}); }
  var html='<div class="pr-sw-sub">Τι προτιμά ανά γεύμα (4 εβδομάδες)</div><div class="pi-prefs">';
  order.sort(function(a,b){return bySlot[b].n-bySlot[a].n;}).forEach(function(s){
    var e=bySlot[s], to=top(e.to).slice(0,3), from=top(e.from)[0];
    html+='<div class="pi-pref"><div class="pi-pref-h">'+esc(s)+' <span>· '+e.n+(e.n===1?' αλλαγή':' αλλαγές')+'</span></div>'
      +to.map(function(t){ return '<div class="pi-pref-r"><span>'+esc(t.k)+'</span><b>'+t.n+'×</b></div>'; }).join('')
      +(from && from.n>=2?'<div class="pi-pref-f">Αντικαθιστά συχνότερα το «'+esc(from.k)+'» ('+from.n+'×)</div>':'')
      +'</div>';
  });
  return html+'</div>';
}

// ── 4. Ποιο συμπλήρωμα ξεχνά ────────────────────────────────────────────────────────────────
// Τα κλειδιά του client_supp_log είναι τα ονόματα ΟΠΩΣ στο snapshot (μεταφρασμένα για en/ru/tr) —
// εμφανίζονται στα ελληνικά μέσω του SUPPS.
function piSuppGreek(name){
  if(typeof SUPPS==='undefined') return name;
  var hit=SUPPS.filter(function(x){ return x.name===name || x.nameEn===name || x.nameRu===name || x.nameTr===name; })[0];
  return hit?hit.name:name;
}
function progressSuppsHtml(c){
  var log=(window.Cloud && Cloud.suppLogFor)?Cloud.suppLogFor(c):{};
  var snap=(window.Cloud && Cloud.publishedSnapshotFor)?Cloud.publishedSnapshotFor(c):null;
  var names=((snap&&snap.supps)||[]).map(function(s){return s.name;}).filter(Boolean);
  Object.keys(log).forEach(function(k){ Object.keys(log[k]||{}).forEach(function(n){ if(log[k][n] && names.indexOf(n)<0) names.push(n); }); });
  if(!names.length) return '';
  var logKeys=Object.keys(log).sort();
  var html='<div class="hm-card" style="margin-bottom:14px"><div class="hm-card-title">💊 Ποιο συμπλήρωμα ξεχνά</div>';
  if(!logKeys.length) return html+'<div class="hm-empty">Δεν έχει τσεκάρει ακόμα συμπληρώματα στο link.</div></div>';
  var wk=ckWeekDates(0), today=ckDayKey(new Date()), past=piPastDates(logKeys[0]);
  html+='<div class="pr-wk-scroll"><table class="pr-sw-grid"><thead><tr><th></th>'
    +PROGRESS_SWAP_DAYS.map(function(d){return '<th>'+d+'</th>';}).join('')+'<th>4 εβδ.</th></tr></thead><tbody>';
  var low=[];
  names.forEach(function(n){
    var taken=past.filter(function(k){ return log[k] && log[k][n]; }).length;
    var p=past.length?Math.round(taken/past.length*100):0;
    if(past.length>=PI_MIN_DAYS && p<50) low.push(piSuppGreek(n));
    html+='<tr><td class="pr-sw-rl">'+esc(piSuppGreek(n))+'</td>'+wk.map(function(k){
      if(k>today || k<logKeys[0]) return '<td><span class="pr-sw-c pr-sw-cf"></span></td>';
      return log[k]&&log[k][n]?'<td><span class="pr-sw-c pr-sw-cp" title="Το πήρε"></span></td>':'<td><span class="pr-sw-c pr-sw-cn" title="Δεν τσεκαρίστηκε"></span></td>';
    }).join('')+'<td style="white-space:nowrap;font-weight:600'+(p<50?';color:#8a5b00':'')+'">'+taken+'/'+past.length+'</td></tr>';
  });
  html+='</tbody></table></div>';
  if(low.length) html+='<div class="pi-note">Λιγότερο από τις μισές μέρες: '+low.map(esc).join(', ')+'.</div>';
  html+='<div class="pi-foot">«4 εβδ.» = μέρες που το τσέκαρε / μέρες από την πρώτη καταγραφή, χωρίς σήμερα.</div>';
  return html+'</div>';
}

// ── 5. Λίστα αγορών ──────────────────────────────────────────────────────────────────────────
// Μόνο η ΤΡΕΧΟΥΣΑ κατάσταση (ο πελάτης την καθαρίζει) — δείχνει αν ψωνίζει με βάση το πλάνο.
function progressShopHtml(c){
  var snap=(window.Cloud && Cloud.publishedSnapshotFor)?Cloud.publishedSnapshotFor(c):null;
  var cats=(snap&&snap.shopping)||[];
  var items=[]; cats.forEach(function(cat){ (cat.items||[]).forEach(function(it){ if(it&&it.name) items.push(it.name); }); });
  if(!items.length) return '';
  var shop=(window.Cloud && Cloud.shopFor)?Cloud.shopFor(c):null, checks=(shop&&shop.checks)||{};
  var done=items.filter(function(n){return checks[n];}), miss=items.filter(function(n){return !checks[n];});
  var html='<div class="hm-card" style="margin-bottom:14px"><div class="hm-card-title">🛒 Λίστα αγορών'
    +(shop&&shop.updated_at?'<span style="margin-left:auto;font-size:12px;font-weight:400;color:var(--text-muted)">τελευταία αλλαγή '+progressShortDate(String(shop.updated_at).slice(0,10))+'</span>':'')+'</div>';
  if(!done.length) return html+'<div class="hm-empty">Δεν έχει τσεκάρει κανένα είδος στη λίστα αγορών του link.</div></div>';
  html+='<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px"><span style="font-size:24px;font-weight:700;color:var(--teal)">'+done.length+' / '+items.length+'</span><span class="hm-row-sub">είδη τσεκαρισμένα τώρα</span></div>';
  if(miss.length) html+='<div style="font-size:13px">Δεν έχει τσεκάρει: <b>'+miss.slice(0,12).map(esc).join(', ')+'</b>'+(miss.length>12?' και άλλα '+(miss.length-12):'')+'</div>';
  html+='<div class="pi-foot">Ο πελάτης μπορεί να καθαρίσει τη λίστα, οπότε δείχνει μόνο τη σημερινή εικόνα, όχι ιστορικό.</div>';
  return html+'</div>';
}

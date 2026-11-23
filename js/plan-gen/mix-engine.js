// js/plan-gen/mix-engine.js
// 🧩 Μενού επιλογών (Mix & Match) — ο υπολογισμός. Καθαρές συναρτήσεις, χωρίς DOM.
//
// Αντί για σταθερό ημερήσιο πλάνο, ο πελάτης παίρνει για κάθε κύριο γεύμα μια «φόρμουλα πιάτου»
// (① πρωτεΐνη + ② υδατάνθρακας + ③ λαχανικά + ④ λίπος) με τα γραμμάρια ΗΔΗ υπολογισμένα από τους
// στόχους του γεύματος, και έτοιμες ιδέες για πρωινό/ενδιάμεσα.
//
// Πηγές (τίποτα καινούργιο):
//   • στόχοι γεύματος  → tsBuildDay() (targets-sheet.js): ίδιος υπολογισμός με το «📊 Αποστολή στόχων»,
//     άρα ώρες, «πριν/μετά» την προπόνηση και CHO ανά μέρα από τις Προπονήσεις (MET)
//   • τρόφιμα          → FOODS (μαγειρεμένο βάρος) · ρόλοι MIX_ROLES (js/data/mix-roles.js)
//   • ωμό/ψημένο       → COOKED_TO_RAW · τεμάχια/φέτες → FOOD_UNITS · μερίδες σπιτιού → PORTIONS
//   • αποκλεισμοί      → buildEffectiveExclusionList + clientAllergenChecker + τύπος διατροφής ανά μέρα
//                        (ίδιοι κανόνες/εξαιρέσεις ημέρας με το applyDietTypeCategorySafetyNet)
//   • ιδέες πρωινού/σνακ → το πρότυπο του πελάτη (resolveClientTemplate) + τα ⭐ Αγαπημένα γεύματα
//
// Τα γραμμάρια ΔΕΝ αποθηκεύονται ποτέ: c.mixMenu κρατά μόνο ΤΙ διάλεξε ο διαιτολόγος, και όλα
// υπολογίζονται κάθε φορά από τους τρέχοντες στόχους (αλλάζει βάρος/στόχος → σωστό αμέσως).

var MIX_VEG={g:200,p:2,c:10,f:0.3};        // ③ λαχανικά/σαλάτα ≥200 g — σταθερή συνεισφορά
var MIX_OIL_G=10;                           // 1 κ.σ. ελαιόλαδο (FOOD_UNITS.Ελαιόλαδο)
var MIX_PROT_FLOOR=0.75;                    // η πρωτεΐνη του πιάτου ποτέ κάτω από 75% του στόχου P
var MIX_BREAD_MAX=4;                        // ψωμί: έως 4 φέτες, ό,τι λείπει → 1 φρούτο
var MIX_UNIT_BREAD_MAX_G=180;               // πίτες/τορτίλιες: έως ~180 g
var MIX_LEGUME_MAX_G=450;                   // όσπρια-πιάτο: έως ~2½ φλ. μαγειρεμένα
var MIX_KCAL_TOL=0.10, MIX_FAT_TOL=0.20;    // έλεγχος συνδυασμών: ±10% kcal, λίπος ≤ +20%
var MIX_FRUIT='Μπανάνα';

var MIX_TXT={
  el:{cooked:'ψημένο',raw:'ωμό',drained:'στραγγ.',can1:'μικρή κονσέρβα',canN:'μικρές κονσέρβες',
      cup:'φλ.',pc:'τεμ.',slice:'φέτα',slices:'φέτες',egg:'αυγό',eggs:'αυγά',white:'ασπράδι',whites:'ασπράδια',
      sameRaw:'ίδιο ωμό',plusFruit:'+ 1 μπανάνα',oil1:'1 κ.σ. ελαιόλαδο',oilHalf:'½ κ.σ. ελαιόλαδο',oil0:'χωρίς λάδι',
      noOilDay:'σήμερα χωρίς λάδι',or:'ή',veg:'Λαχανικά / σαλάτα ≥ 200 g',cooked2:'μαγ.'},
  en:{cooked:'cooked',raw:'raw',drained:'drained',can1:'small can',canN:'small cans',
      cup:'cup',pc:'pc',slice:'slice',slices:'slices',egg:'egg',eggs:'eggs',white:'egg white',whites:'egg whites',
      sameRaw:'same raw',plusFruit:'+ 1 banana',oil1:'1 tbsp olive oil',oilHalf:'½ tbsp olive oil',oil0:'no oil',
      noOilDay:'no oil today',or:'or',veg:'Vegetables / salad ≥ 200 g',cooked2:'cooked'},
  // ru/tr: μόνο για το link του πελάτη (φάση 2)· το PDF μένει el/en όπως το «Στόχοι»
  ru:{cooked:'готовое',raw:'сырое',drained:'без жидкости',can1:'маленькая банка',canN:'маленькие банки',
      cup:'чаш.',pc:'шт.',slice:'ломтик',slices:'ломт.',egg:'яйцо',eggs:'яйца',white:'белок',whites:'белков',
      sameRaw:'столько же сырого',plusFruit:'+ 1 банан',oil0:'без масла',
      noOilDay:'сегодня без масла',or:'или',veg:'Овощи / салат ≥ 200 г',cooked2:'готов.'},
  tr:{cooked:'pişmiş',raw:'çiğ',drained:'süzülmüş',can1:'küçük kutu',canN:'küçük kutu',
      cup:'su bardağı',pc:'adet',slice:'dilim',slices:'dilim',egg:'yumurta',eggs:'yumurta',white:'yumurta akı',whites:'yumurta akı',
      sameRaw:'çiğ de aynı',plusFruit:'+ 1 muz',oil0:'yağsız',
      noOilDay:'bugün yağsız',or:'veya',veg:'Sebze / salata ≥ 200 g',cooked2:'pişmiş'}
};
var MIX_OIL_UNIT={el:'κ.σ. ελαιόλαδο',en:'tbsp olive oil',ru:'ст. л. оливкового масла',tr:'yemek kaşığı zeytinyağı'};
// Ετικέτες COOKED_TO_RAW.label → γλώσσα του πελάτη (ίδιες τιμές με τα RAW_LABEL του _buildSnapshot)
var MIX_RAW_LBL={
  en:{'ωμό':'raw','ωμά':'raw','ωμές':'raw','ωμή':'raw','ωμός':'raw','ξερά':'dried','ξερές':'dried','ξερή':'dried'},
  ru:{'ωμό':'сырое','ωμά':'сырые','ωμές':'сырые','ωμή':'сырая','ωμός':'сырой','ξερά':'сушёные','ξερές':'сушёные','ξερή':'сушёная'},
  tr:{'ωμό':'çiğ','ωμά':'çiğ','ωμές':'çiğ','ωμή':'çiğ','ωμός':'çiğ','ξερά':'kuru','ξερές':'kuru','ξερή':'kuru'}
};
function mixRawLbl(label,lang){ var d=MIX_RAW_LBL[lang]; return d?(d[label]||d['ωμό']):label; }

function mixLang(c){ return (typeof tsLang==='function')?tsLang(c):'el'; }   // ru/tr → en (όπως το «Στόχοι»)
function mixT(lang){ return MIX_TXT[lang]||MIX_TXT.el; }
function mixRound(g){ var s=g<50?5:10; return Math.max(s,Math.round(g/s)*s); }
function mixHalf(x){ return Math.round(x*2)/2; }
function mixFmtHalf(x){ var w=Math.floor(x), h=(x-w)>=0.5; return (w>0?String(w):'')+(h?'½':'')||'0'; }
function mixFoodName(n,lang){
  if(n===MIX_OMELETTE.key) return (lang&&lang!=='el'&&MIX_OMELETTE[lang])||MIX_OMELETTE.name;
  var fd=FOODS[n]; return (lang&&lang!=='el'&&fd&&fd[lang])?fd[lang]:n;
}
function mixMac(n,g){ var fd=FOODS[n]; if(!fd) return {p:0,c:0,f:0,k:0}; var r=g/100; return {p:fd.p*r,c:fd.c*r,f:fd.f*r,k:fd.k*r}; }
function mixAdd(a,b){ return {p:a.p+b.p,c:a.c+b.c,f:a.f+b.f,k:a.k+b.k}; }
function mixZero(){ return {p:0,c:0,f:0,k:0}; }

// ── Ποιος μπορεί ────────────────────────────────────────────────────────────
// Απόφαση 23/11: ΟΧΙ για ανήλικους (ίδιος έλεγχος με plan-energy.js) — άρα ούτε ημέρα αγώνα.
function mixIsMinor(c){ return !!(c&&c.age!=null&&c.age>0&&c.age<18); }
function mixCanUse(c){
  if(!c) return {ok:false,why:'Διάλεξε πρώτα πελάτη.'};
  if(mixIsMinor(c)) return {ok:false,why:'Το Μενού επιλογών δεν είναι για ανήλικους (<18): χρειάζονται σταθερό πλάνο.'};
  if(c.pregnant) return {ok:false,why:'Σε εγκυμοσύνη χρησιμοποίησε ημερήσιο πλάνο.'};
  var t=(typeof calcTDEE==='function')?calcTDEE(c):null;
  if(!t||t.incomplete) return {ok:false,why:'Συμπλήρωσε βάρος, ύψος και ηλικία για να υπολογιστούν οι στόχοι.'};
  return {ok:true};
}
function mixIsActive(c){ return !!(c&&c.planMode==='mix'&&c.mixMenu); }

// ── Αποκλεισμοί ανά μέρα ────────────────────────────────────────────────────
function mixCtx(c){
  var excl=(c.foodExclude||[]).slice();
  if(typeof buildEffectiveExclusionList==='function') buildEffectiveExclusionList(c).forEach(function(x){ if(excl.indexOf(x)===-1) excl.push(x); });
  var norm=excl.map(function(x){ return normalizeGreekText(String(x)); }).filter(function(x){ return x.length; });
  var allergen=(typeof clientAllergenChecker==='function')?clientAllergenChecker(c):function(){return null;};
  var cats=(typeof DIET_TYPE_FORBIDDEN_CATS!=='undefined'&&DIET_TYPE_FORBIDDEN_CATS[c.dietType])||[];
  return {c:c,exclNorm:norm,allergen:allergen,cats:cats,cache:{}};
}
function mixDayCats(ctx,d){
  var c=ctx.c;
  var catEx=(c.dietExceptionDays&&(c.dietExceptionDays[d]||c.dietExceptionDays[String(d)]))||[];
  return ctx.cats.filter(function(cat){ return catEx.indexOf(cat)===-1; });
}
function mixDayFoodEx(ctx,d){
  var c=ctx.c; return (c.dietFoodExceptionDays&&(c.dietFoodExceptionDays[d]||c.dietFoodExceptionDays[String(d)]))||[];
}
// Επιτρέπεται το τρόφιμο (ή η «Ομελέτα») τη μέρα d; Λόγος αν όχι: 'excl' | 'allergy' | 'diet'
function mixBlockReason(ctx,n,d){
  var key=n+'|'+d; if(key in ctx.cache) return ctx.cache[key];
  var r=null;
  if(n===MIX_OMELETTE.key){
    r=mixBlockReason(ctx,MIX_OMELETTE.egg,d)||mixBlockReason(ctx,MIX_OMELETTE.white,d);
  } else if(!FOODS[n]) r='missing';
  else if(ctx.allergen(n)) r='allergy';
  else if(typeof foodIsExcludedByNameOrIngredient==='function'&&foodIsExcludedByNameOrIngredient(n,ctx.exclNorm)) r='excl';
  else if(ctx.cats.length&&mixDayFoodEx(ctx,d).indexOf(n)===-1&&typeof foodBlockedByDietCats==='function'
          &&foodBlockedByDietCats(n,ctx.c.dietType,mixDayCats(ctx,d))) r='diet';
  ctx.cache[key]=r; return r;
}
function mixAllowed(ctx,n,d){ return !mixBlockReason(ctx,n,d); }
function mixAllowedDays(ctx,n){ var o=[]; for(var d=0;d<7;d++) if(mixAllowed(ctx,n,d)) o.push(d); return o; }
// Πεσμένο σε ΟΛΕΣ τις μέρες για λόγο που δεν είναι η μέρα (αλλεργία/αποκλεισμός) → 🔒 κρυμμένο
function mixLockedEverywhere(ctx,n){ return mixAllowedDays(ctx,n).length===0; }

// ── Στόχοι γευμάτων ανά μέρα (από τον ίδιο υπολογισμό με το «Αποστολή στόχων») ──
function mixSlotOf(name,L){
  if(name===L.breakfast) return 'breakfast';
  if(name===L.lunch) return 'lunch';
  if(name===L.dinner) return 'dinner';
  if(name===L.bite) return 'bite';
  return 'snack';
}
function mixWeekTargets(c,lang){
  var t=calcTDEE(c); if(!t||t.incomplete) return null;
  lang=lang||'el';
  var L=TS_TXT[lang]||TS_TXT.el, eff=makeDayTgtDefaults(c,t), days=[];
  for(var d=0;d<7;d++){
    var cho=null;
    if(c.choProtocol&&c.choProtocol.enabled&&typeof computeCHOTargets==='function'){ try{ cho=computeCHOTargets(c,t,d); }catch(e){ cho=null; } }
    var day=tsBuildDay(c,d,eff[d],L,cho), meals=[], trains=[];
    day.rows.forEach(function(r){
      if(r.train){ trains.push({time:r.time,name:r.name}); return; }
      var slot=mixSlotOf(r.name,L);
      meals.push({slot:slot,main:(slot==='lunch'||slot==='dinner'),name:r.name,time:r.time,
        tag:r.tag?r.tag.cls:null,tagLabel:r.tag?r.tag.label:'',p:r.p,c:r.c,f:r.f,k:Math.round(r.k)});
    });
    days.push({d:d,label:day.label,short:day.short,kind:day.kind,kindLabel:day.kindLabel,sub:day.sub,
      k:day.k,p:day.p,c:day.c,f:day.f,meals:meals,trains:trains});
  }
  return days;
}

// ── ② Υδατάνθρακας: γραμμάρια για C g του γεύματος ─────────────────────────
function mixCupOf(n,g){   // «≈ ½ φλ.» από το PORTIONS (μόνο όπου υπάρχει «1 φλ.»)
  var po=(typeof PORTIONS!=='undefined')&&PORTIONS[n]; if(!po) return null;
  var one=null; po.forEach(function(x){ if(/^1 φλ/.test(x.n)) one=x.g; });
  if(!one){ po.forEach(function(x){ if(/^½ φλ/.test(x.n)) one=x.g*2; }); }
  return one?Math.max(0.5,mixHalf(g/one)):null;
}
function mixCarbPortion(n,C,lang){
  var X=mixT(lang), fd=FOODS[n]; if(!fd||!(fd.c>0)) return null;
  var need=Math.max(10,C-MIX_VEG.c), fu=FOOD_UNITS[n], out={n:n,fruit:null,alt:''};
  if(fu&&(fu.u==='φέτα'||(WHOLE_UNIT_FOODS[n]&&fu.u==='τεμ.'&&fd.c>=40))){
    // ψωμί σε φέτες / πίτες σε τεμάχια (½)
    var perU=fd.c*fu.g/100, units=Math.max(0.5,mixHalf(need/perU));
    var cap=fu.u==='φέτα'?MIX_BREAD_MAX:Math.max(0.5,Math.floor(MIX_UNIT_BREAD_MAX_G/fu.g*2)/2);
    if(fu.u==='φέτα') units=Math.max(1,units);
    if(units>cap){ units=cap; if(need-units*perU>=12) out.fruit={n:MIX_FRUIT,g:(FOOD_UNITS[MIX_FRUIT]||{g:120}).g}; }
    out.g=Math.round(units*fu.g);
    var lbl=fu.u==='φέτα'?(units>=2?X.slices:X.slice):X.pc;
    out.main=mixFmtHalf(units)+' '+lbl; out.alt=out.g+' g'+(out.fruit?' '+X.plusFruit:'');
  } else {
    var g=mixRound(need/fd.c*100), cr=COOKED_TO_RAW[n];
    out.g=g;
    if(cr&&cr.f<1){                                   // ρύζι/ζυμαρικά/όσπρια: ωμό πρώτο
      var lbl2=mixRawLbl(cr.label,lang);
      out.main=mixRound(g*cr.f)+' g '+lbl2; out.alt='≈ '+g+' g '+X.cooked2;
    } else if(fu&&fu.u==='τεμ.'){                       // πατάτες / γλυκοπατάτα: g + τεμάχια
      out.main=g+' g'; out.alt='≈ '+mixFmtHalf(Math.max(0.5,mixHalf(g/fu.g)))+' '+X.pc;
    } else {                                           // χωρίς συντελεστή: g + μερίδα σπιτιού
      var cups=mixCupOf(n,g);
      out.main=g+' g'+(/(βρ\.)|ψητ/.test(n)?' '+X.cooked2:''); out.alt=cups?'≈ '+mixFmtHalf(cups)+' '+X.cup:'';
    }
  }
  var m=mixMac(n,out.g); if(out.fruit) m=mixAdd(m,mixMac(out.fruit.n,out.fruit.g));
  out.mac=m; return out;
}

// ── ① Πρωτεΐνη: συμπληρώνει ό,τι δεν δίνουν υδατάνθρακας + λαχανικά, ≥75% του P ──
function mixCanG(n){ var po=PORTIONS[n]; return (po&&po[0]&&/κονσέρβα/.test(po[0].n))?po[0].g:0; }
function mixProteinPortion(n,P,carbP,lang,floorPct){
  var X=mixT(lang);
  var need=Math.max(P*(floorPct==null?MIX_PROT_FLOOR:floorPct),P-(carbP||0)-MIX_VEG.p);
  if(n===MIX_OMELETTE.key){
    var e=FOODS[MIX_OMELETTE.egg], w=FOODS[MIX_OMELETTE.white];
    var eg=FOOD_UNITS[MIX_OMELETTE.egg].g, wg=FOOD_UNITS[MIX_OMELETTE.white].g;
    var ePer=e.p*eg/100, wPer=w.p*wg/100;
    var eggs=MIX_OMELETTE.eggs, whites=Math.round((need-eggs*ePer)/wPer);
    if(whites<0){ eggs=Math.max(1,Math.round(need/ePer)); whites=0; }
    whites=Math.min(MIX_OMELETTE.maxWhites,whites);
    var foods=[[MIX_OMELETTE.egg,eggs*eg]]; if(whites>0) foods.push([MIX_OMELETTE.white,whites*wg]);
    var mm=mixZero(); foods.forEach(function(x){ mm=mixAdd(mm,mixMac(x[0],x[1])); });
    return {n:n,g:eggs*eg+whites*wg,foods:foods,mac:mm,
      main:eggs+' '+(eggs>1?X.eggs:X.egg)+(whites?' + '+whites+' '+(whites>1?X.whites:X.white):''),alt:''};
  }
  var fd=FOODS[n]; if(!fd||!(fd.p>0)) return null;
  var g=mixRound(need/fd.p*100), out={n:n,g:g,foods:[[n,g]],alt:''};
  var can=mixCanG(n), cr=COOKED_TO_RAW[n], fu=FOOD_UNITS[n];
  if(can){
    var cans=Math.max(0.5,mixHalf(g/can));
    out.main=g+' g '+X.drained; out.alt='≈ '+mixFmtHalf(cans)+' '+(cans>1?X.canN:X.can1);
  } else if(fu&&/^(τεμ\.|stick|patty)$/.test(fu.u)&&fu.g>=50){
    out.main=g+' g'; out.alt='≈ '+mixFmtHalf(Math.max(0.5,mixHalf(g/fu.g)))+' '+X.pc;
  } else {
    var cookedTag=/(ψητ|μαγ\.|βρ\.|βραστ|ψημέν)/.test(n)?' '+X.cooked:'';
    out.main=g+' g'+cookedTag;
    if(cr&&cr.f>1&&!cr.isEgg){
      var lbl=mixRawLbl(cr.label,lang);
      out.alt='≈ '+mixRound(g*cr.f)+' g '+lbl;
    }
  }
  out.mac=mixMac(n,g); return out;
}

// ── ④ Λίπος: ό,τι λίπος λείπει στο γεύμα, σε κουταλιές ελαιόλαδο (0 / ½ / 1 / 1½ / 2) ──
// Πρώτη ιδέα ήταν «ανάλογα με το λίπος της πρωτεΐνης» (≥10 g → χωρίς, 6–10 → ½, αλλιώς 1), αλλά με
// σταθερή 1 κ.σ. το ~30% των συνδυασμών έβγαινε πάνω από τον στόχο λίπους (ομελέτα, σολομός, μέρες
// ξεκούρασης με χαμηλό λίπος). Εδώ: στόχος λίπους − λίπος πρωτεΐνης − λαχανικά − ~1 g του υδατάνθρακα.
// carbFat: λίπος του υδατάνθρακα στο πιάτο (ακριβές στο mixPlate· στη λίστα πρωτεϊνών = διάμεσος
// των υδατανθράκων του μενού για αυτό το γεύμα, ώστε η ένδειξη «λάδι» δίπλα στην πρωτεΐνη να ισχύει
// για τον συνηθισμένο συνδυασμό — η διαφορά με κινόα/ψωμί είναι ≤ ½ κ.σ.).
var MIX_CARB_FAT_ALLOW=1;
function mixOilSpoons(prot,meal,carbFat){
  if(!meal) return 1;
  var pf=prot&&prot.mac?prot.mac.f:0;
  var left=meal.f-pf-MIX_VEG.f-(carbFat==null?MIX_CARB_FAT_ALLOW:carbFat);
  return Math.max(0,Math.min(2,mixHalf(left/MIX_OIL_G)));
}
// Λάδι τη μέρα d; Σε νηστεία χωρίς λάδι → πρώτο επιτρεπτό από MIX_ROLES.fatAlt (σε ½ μερίδα σπιτιού).
function mixFatFor(ctx,d,spoons,lang){
  var X=mixT(lang);
  if(spoons<=0) return {n:null,g:0,sp:0,txt:X.oil0,mac:mixZero()};
  if(mixAllowed(ctx,'Ελαιόλαδο',d)){
    var g=MIX_OIL_G*spoons;
    return {n:'Ελαιόλαδο',g:g,sp:spoons,txt:mixOilTxt(spoons,lang),mac:mixMac('Ελαιόλαδο',g)};
  }
  for(var i=0;i<MIX_ROLES.fatAlt.length;i++){
    var a=MIX_ROLES.fatAlt[i]; if(!mixAllowed(ctx,a,d)) continue;
    var po=PORTIONS[a]&&PORTIONS[a][0], ag=Math.round((po?po.g:15)*spoons);
    if(a==='Αβοκάντο') ag=Math.round(50*spoons);
    return {n:a,g:ag,sp:spoons,txt:mixFoodName(a,lang)+' '+ag+' g ('+X.noOilDay+')',mac:mixMac(a,ag)};
  }
  return {n:null,g:0,sp:0,txt:X.noOilDay,mac:mixZero()};
}
function mixOilTxt(sp,lang){
  var X=mixT(lang); if(sp<=0) return X.oil0;
  return mixFmtHalf(sp)+' '+(MIX_OIL_UNIT[lang]||MIX_OIL_UNIT.el);
}

// ── Ένα πιάτο: υδατάνθρακας πρώτα, μετά η πρωτεΐνη, μετά το λίπος ─────────────
// opt.carbP / opt.carbFat: ό,τι υποθέτει η λίστα (διάμεσος των υδατανθράκων του μενού) — ο έλεγχος
// συνδυασμών περνά τα ίδια, ώστε να ελέγχει ΑΚΡΙΒΩΣ ό,τι θα φάει ο πελάτης (ίδια γραμμάρια, ίδιο λάδι).
function mixPlate(ctx,d,meal,protN,carbN,lang,opt){
  opt=opt||{};
  var cq=mixCarbPortion(carbN,meal.c,lang); if(!cq) return null;
  var pq=mixProteinPortion(protN,meal.p,opt.carbP!=null?opt.carbP:cq.mac.p,lang); if(!pq) return null;
  var fat=mixFatFor(ctx,d,mixOilSpoons(pq,meal,opt.carbFat!=null?opt.carbFat:cq.mac.f),lang);
  var tot=mixAdd(mixAdd(mixAdd(pq.mac,cq.mac),fat.mac),{p:MIX_VEG.p,c:MIX_VEG.c,f:MIX_VEG.f,k:MIX_VEG.p*4+MIX_VEG.c*4+MIX_VEG.f*9});
  return {prot:pq,carb:cq,fat:fat,tot:tot};
}
// 🫘 Όσπρια-πιάτο: το όσπριο καλύπτει τον υδατάνθρακα· αν λείπει πρωτεΐνη ≥6 g → μικρή πρωτεΐνη
function mixLegumeAddon(ctx,d){
  for(var i=0;i<MIX_ROLES.legumeAddon.length;i++){ var a=MIX_ROLES.legumeAddon[i]; if(mixAllowed(ctx,a,d)) return a; }
  return null;
}
var MIX_LEGUME_MAX_CUPS=2;       // όπως στα πλάνα του γραφείου: 1–2 φλ. όσπρια (+ ψωμί αν θέλει κι άλλο υδατάνθρακα)
function mixLegumeBread(ctx,d,menu){
  var list=((menu&&menu.carb)||[]).concat(['Ψωμί ολικής άλεσης','Ψωμί σίκαλης']);
  for(var i=0;i<list.length;i++){ var n=list[i], fu=FOOD_UNITS[n]; if(fu&&fu.u==='φέτα'&&mixAllowed(ctx,n,d)) return n; }
  return null;
}
function mixLegumePlate(ctx,d,meal,legN,lang,menu){
  var X=mixT(lang), fd=FOODS[legN]; if(!fd||!(fd.c>0)) return null;
  var cupG=null; (PORTIONS[legN]||[]).forEach(function(x){ if(/^1 φλ/.test(x.n)) cupG=x.g; });
  var maxG=cupG?cupG*MIX_LEGUME_MAX_CUPS:MIX_LEGUME_MAX_G;
  var g=Math.min(maxG,mixRound(Math.max(10,meal.c-MIX_VEG.c)/fd.c*100)), cr=COOKED_TO_RAW[legN];
  var leg={n:legN,g:g,mac:mixMac(legN,g),alt:''};
  if(cr&&cr.f<1){ leg.main=mixRound(g*cr.f)+' g '+mixRawLbl(cr.label,lang); leg.alt='≈ '+g+' g '+X.cooked2; }
  else { leg.main=g+' g'; }
  var cups=mixCupOf(legN,g); if(cups) leg.alt=(leg.alt?leg.alt+' · ':'≈ ')+mixFmtHalf(cups)+' '+X.cup;
  // υδατάνθρακας που λείπει → φέτες ψωμί (έως 3)
  var bread=null, remC=meal.c-MIX_VEG.c-leg.mac.c, bn=remC>=12?mixLegumeBread(ctx,d,menu):null;
  if(bn){
    var bu=FOOD_UNITS[bn], per=FOODS[bn].c*bu.g/100, sl=Math.min(3,Math.max(0.5,mixHalf(remC/per)));
    bread={n:bn,g:Math.round(sl*bu.g),main:mixFmtHalf(sl)+' '+(sl>=2?X.slices:X.slice)};
    bread.mac=mixMac(bn,bread.g);
  }
  var short=meal.p-leg.mac.p-MIX_VEG.p-(bread?bread.mac.p:0), add=null, addN=mixLegumeAddon(ctx,d);
  if(short>=6&&addN){ add=mixProteinPortion(addN,short,0,lang,1); }
  var base=mixAdd(leg.mac,{p:MIX_VEG.p,c:MIX_VEG.c,f:MIX_VEG.f,k:MIX_VEG.p*4+MIX_VEG.c*4+MIX_VEG.f*9});
  if(bread) base=mixAdd(base,bread.mac);
  if(add) base=mixAdd(base,add.mac);
  var sp=Math.max(0,Math.min(2,mixHalf((meal.f-base.f)/MIX_OIL_G)));
  var fat=mixFatFor(ctx,d,sp,lang);
  return {leg:leg,bread:bread,add:add,fat:fat,tot:mixAdd(base,fat.mac)};
}
// 🐟 Λιπαρά ψάρια (ωμέγα-3): Σολομός, Σκουμπρί, Σαρδέλες — κατηγορία Ψάρια με λίπος ≥ 6 g/100 g.
// Απόφαση 2026-11-24: το λίπος ΤΟΥ ΙΔΙΟΥ του ψαριού δεν μετράει ως υπέρβαση στον έλεγχο (σε πελάτες με
// χαμηλό λίπος, π.χ. 16% των θερμίδων, ο σολομός έβγαινε πάντα «εκτός»). Το υπόλοιπο πιάτο (υδατάνθρακας,
// λάδι, λαχανικά) ελέγχεται κανονικά· θερμίδες = όριο ±10% + οι θερμίδες του λίπους του ψαριού.
var MIX_OILY_FISH_F=6;
function mixIsOilyFish(n){ var fd=FOODS[n]; return !!(fd&&fd.cat==='Ψάρια'&&fd.f>=MIX_OILY_FISH_F); }
function mixPlateOk(tot,meal,fishF){
  fishF=fishF||0;
  var tk=meal.p*4+meal.c*4+meal.f*9;
  var kd=(tot.k-tk)/tk, fd=meal.f>0?(tot.f-meal.f)/meal.f:0;               // ό,τι βλέπει ο διαιτολόγος
  // συγχωρείται ΜΟΝΟ όσο λίπος του ψαριού περισσεύει πάνω από τον στόχο λίπους του γεύματος
  var excess=Math.min(fishF,Math.max(0,tot.f-meal.f));
  var kA=(tot.k-excess*9-tk)/tk, fA=meal.f>0?(tot.f-excess-meal.f)/meal.f:0;
  return {ok:Math.abs(kA)<=MIX_KCAL_TOL&&fA<=MIX_FAT_TOL,kPct:Math.round(kd*100),fPct:Math.round(fd*100),fish:excess>0};
}
function mixFishFat(prot){ return (prot&&prot.n&&mixIsOilyFish(prot.n))?prot.mac.f:0; }

// Η ποσότητα πρωτεΐνης που γράφεται στη λίστα (χωρίς να ξέρουμε ποιον υδατάνθρακα θα διαλέξει ο πελάτης)
// υπολογίζεται με τη ΔΙΑΜΕΣΗ πρωτεΐνη των υδατανθράκων του μενού — αλλιώς κοτόπουλο + ρύζι έβγαινε
// ~15% πάνω στην πρωτεΐνη (το ρύζι/τα ζυμαρικά φέρνουν 8–13 g). Ίδια λογική με το λάδι (carbFat).
function mixMedianCarbP(carbs){
  var cp=(carbs||[]).map(function(x){ return x.mac.p; }).sort(function(a,b){return a-b;});
  return cp.length?cp[Math.floor(cp.length/2)]:null;
}

// ── Το μενού του πελάτη ─────────────────────────────────────────────────────
function mixPlantFirst(c){ return c.dietType==='vegan'||c.dietType==='vegetarian'||c.dietType==='orthodox_fasting'; }
// Προεπιλογή: τα ⭐ που επιτρέπονται τουλάχιστον μία μέρα (+ φυτικές για χορτοφάγους/vegan/νηστεία)
function mixDefaultMenu(c){
  var ctx=mixCtx(c), ok=function(n){ return !mixLockedEverywhere(ctx,n); };
  var prot=MIX_ROLES.protein.star.filter(ok);
  if(mixPlantFirst(c)) MIX_ROLES.protein.plant.forEach(function(n){ if(ok(n)&&prot.indexOf(n)===-1) prot.push(n); });
  var now=new Date().toISOString();
  return {v:1,createdAt:now,updatedAt:now,
    protein:prot,carb:MIX_ROLES.carb.star.filter(ok),legume:MIX_ROLES.legume.star.filter(ok),
    ideasOff:[],hiddenCombos:[],rules:{fish:2,legumes:2,redMeatMax:2}};
}
// Υποψήφια για «＋ τρόφιμο» ενός ρόλου (όσα δεν είναι ήδη στο μενού), με tier και κατάσταση
function mixCandidates(c,role){
  var ctx=mixCtx(c), menu=c.mixMenu||{}, have=menu[role]||[], R=MIX_ROLES[role], out=[];
  ['star','plant','more','warn'].forEach(function(tier){
    (R[tier]||[]).forEach(function(n){
      if(have.indexOf(n)!==-1||out.some(function(x){return x.n===n;})) return;
      out.push({n:n,tier:tier,locked:mixLockedEverywhere(ctx,n),days:mixAllowedDays(ctx,n)});
    });
  });
  if(role==='protein'){   // νέα τρόφιμα Κρέας/Ψάρια με μερίδα που δεν είναι σε καμία λίστα (mixRoleOf)
    Object.keys(FOODS).forEach(function(n){
      if(have.indexOf(n)!==-1||out.some(function(x){return x.n===n;})) return;
      var r=mixRoleOf(n); if(r&&r.role==='protein') out.push({n:n,tier:r.tier,locked:mixLockedEverywhere(ctx,n),days:mixAllowedDays(ctx,n)});
    });
  }
  return out;
}

// ── Ιδέες πρωινού / ενδιάμεσων (πρότυπο + ⭐ Αγαπημένα), κλιμακωμένες στο γεύμα ──
function mixIdeaKey(foods){ return foods.map(function(f){return f.n;}).sort().join('|'); }
function mixIdeaPool(c){
  var pool={breakfast:[],snack:[]}, seen={};
  function add(slot,foods,src){
    foods=(foods||[]).filter(function(f){ return f&&FOODS[f.n]&&f.g>0; });
    if(!foods.length) return;
    var key=slot+':'+mixIdeaKey(foods); if(seen[key]) return; seen[key]=1;
    pool[slot].push({key:key,src:src,foods:foods.map(function(f){return {n:f.n,g:f.g};})});
  }
  var tmpl=(typeof resolveClientTemplate==='function')?resolveClientTemplate(c):null;
  if(tmpl){
    for(var d=0;d<7;d++){
      (tmpl[d]||tmpl[0]||[]).forEach(function(m){
        if(m.name==='Πρωινό') add('breakfast',m.foods,'tmpl');
        else if(m.name==='Ενδιάμεσο') add('snack',m.foods,'tmpl');
      });
    }
  }
  var favs=(typeof getFavoriteMeals==='function')?getFavoriteMeals():[];
  (favs||[]).forEach(function(f){
    if(f.name==='Πρωινό') add('breakfast',f.foods,'fav');
    else if(f.name==='Ενδιάμεσο') add('snack',f.foods,'fav');
  });
  return pool;
}
function mixScaleIdea(idea,meal){
  var k=0; idea.foods.forEach(function(f){ k+=mixMac(f.n,f.g).k; });
  if(!(k>0)) return null;
  var tk=meal.p*4+meal.c*4+meal.f*9, r=Math.max(0.5,Math.min(2,tk/k)), tot=mixZero();
  var foods=idea.foods.map(function(f){
    var g=(typeof scaledG==='function')?scaledG(f.n,f.g,r):Math.round(f.g*r);
    if(typeof snapWholeG==='function') g=snapWholeG(f.n,g);
    tot=mixAdd(tot,mixMac(f.n,g)); return {n:f.n,g:g};
  });
  return {key:idea.key,src:idea.src,foods:foods,tot:tot};
}
function mixIdeasFor(c,ctx,d,meal,pool){
  var slot=meal.slot==='breakfast'?'breakfast':'snack', off=(c.mixMenu&&c.mixMenu.ideasOff)||[];
  pool=pool||mixIdeaPool(c);
  return pool[slot].filter(function(i){
    return off.indexOf(i.key)===-1&&i.foods.every(function(f){ return mixAllowed(ctx,f.n,d); });
  }).map(function(i){ return mixScaleIdea(i,meal); }).filter(Boolean);
}
// «1¼ φλ. (250 g)» — η μονάδα σπιτιού της εφαρμογής (fmtFoodQty) + τα γραμμάρια· σκέτο g αν δεν έχει μονάδα
function mixIdeaQty(f,lang){
  var q=(typeof fmtFoodQty==='function')?fmtFoodQty(f,' g'):{main:f.g+' g',sub:''};
  return q.main+(q.sub?' '+q.sub:'');
}

// ── Όλη η εβδομάδα: ό,τι χρειάζονται editor και PDF ──────────────────────────
// Επιστρέφει {days:[{...στόχοι, meals:[{...στόχος, plates|legumes|ideas}]}], check:{...}}
function mixBuildWeek(c,lang){
  lang=lang||'el';
  var menu=c.mixMenu||mixDefaultMenu(c), ctx=mixCtx(c), days=mixWeekTargets(c,lang);
  if(!days) return null;
  var pool=mixIdeaPool(c), hidden=menu.hiddenCombos||[];
  var check={total:0,ok:0,bad:{}};
  days.forEach(function(day){
    var d=day.d;
    day.oilOk=mixAllowed(ctx,'Ελαιόλαδο',d);
    day.meals.forEach(function(m){
      if(!m.main){ m.ideas=mixIdeasFor(c,ctx,d,m,pool); return; }
      var prots=(menu.protein||[]).filter(function(n){ return mixAllowed(ctx,n,d); });
      var carbs=(menu.carb||[]).filter(function(n){ return mixAllowed(ctx,n,d); });
      m.carb=carbs.map(function(n){ return mixCarbPortion(n,m.c,lang); }).filter(Boolean);
      var cf=m.carb.map(function(x){ return x.mac.f; }).sort(function(a,b){return a-b;});
      m.carbFat=cf.length?cf[Math.floor(cf.length/2)]:MIX_CARB_FAT_ALLOW;
      m.carbProt=mixMedianCarbP(m.carb);
      m.prot=prots.map(function(n){ var q=mixProteinPortion(n,m.p,m.carbProt,lang); if(q) q.oil=mixOilSpoons(q,m,m.carbFat); return q; }).filter(Boolean);
      m.legumes=(menu.legume||[]).filter(function(n){ return mixAllowed(ctx,n,d); })
        .map(function(n){ var lp=mixLegumePlate(ctx,d,m,n,lang,menu); if(lp){ lp.ok=mixPlateOk(lp.tot,m,lp.add?mixFishFat(lp.add):0); } return lp; }).filter(Boolean);
      m.fat=mixFatFor(ctx,d,1,lang);
      // έλεγχος όλων των συνδυασμών πρωτεΐνη × υδατάνθρακας για αυτό το γεύμα
      prots.forEach(function(pn){ carbs.forEach(function(cn){
        var pair=pn+'|'+cn; if(hidden.indexOf(pair)!==-1) return;
        var pl=mixPlate(ctx,d,m,pn,cn,lang,{carbP:m.carbProt}); if(!pl) return;   // λάδι = ακριβές για το πιάτο, όπως στο link
        var r=mixPlateOk(pl.tot,m,mixFishFat(pl.prot)); check.total++;
        if(r.ok&&r.fish&&r.fPct>MIX_FAT_TOL*100) check.fishOk=(check.fishOk||0)+1;
        if(r.ok){ check.ok++; return; }
        var b=check.bad[pair]||(check.bad[pair]={prot:pn,carb:cn,n:0,kPct:0,fPct:0});
        b.n++; if(Math.abs(r.kPct)>Math.abs(b.kPct)) b.kPct=r.kPct; if(r.fPct>b.fPct) b.fPct=r.fPct;
      }); });
    });
  });
  check.badList=Object.keys(check.bad).map(function(k){ return check.bad[k]; })
    .sort(function(a,b){ return Math.max(Math.abs(b.kPct),b.fPct)-Math.max(Math.abs(a.kPct),a.fPct); });
  return {lang:lang,menu:menu,days:days,check:check};
}

// Εβδομαδιαίοι κανόνες ποικιλίας → κείμενο (για PDF/editor)
function mixIsFish(n){ var fd=FOODS[n]; return !!(fd&&fd.cat==='Ψάρια'); }
function mixIsRedMeat(n){ return MIX_RED_MEAT.indexOf(n)!==-1; }

// Ταυτότητα στόχων μιας μέρας (για ομαδοποίηση ίδιων ημερών στο PDF)
function mixDaySig(day){
  return day.meals.map(function(m){ return m.slot+'@'+m.time+':'+m.p+'/'+m.c+'/'+m.f+(m.tag||''); }).join(';')+'|oil'+(day.oilOk?1:0);
}

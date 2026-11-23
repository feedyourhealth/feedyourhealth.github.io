// js/plan-gen/mix-snapshot.js
// 🧩 Μενού επιλογών — φάση 2: ό,τι στέλνεται στο link του πελάτη (plan.html).
//
// Το link ΔΕΝ υπολογίζει τίποτα· παίρνει έτοιμες ποσότητες από το mix-engine.js. Κρατάμε το ΙΔΙΟ σχήμα
// SNAP.days[i].meals[j] με το ημερήσιο πλάνο (θέσεις γευμάτων με τους στόχους τους), ώστε Αρχική /
// σκορ εβδομάδας / check-in / σερί / ειδοποιήσεις του διαιτολόγου να δουλεύουν όπως είναι. Επιπλέον:
//   snap.mode='mix'
//   snap.mix.foods = [{n (όνομα στη γλώσσα του πελάτη), el (ελληνικό όνομα FOODS), e (emoji),
//                     r:'p'|'c'|'l' (πρωτεΐνη/υδατ./όσπριο), s:1 = στο μενού του διαιτολόγου,
//                     t:'star'|'plant'|'more'|'warn', fi:1 ψάρι, rm:1 κόκκινο κρέας}]
//   snap.mix.q     = ποσότητες ενός κύριου γεύματος, κοινές για ίδια γεύματα (π.χ. όλα τα «μετά την
//                    προπόνηση» με ίδιους στόχους):
//                    {p:[[foodIdx, ποσότητα, παρένθεση, λάδι, [P,C,F,k] πρωτεΐνης, [P,C,F,k] λαδιού, [[τρόφιμο,g]…]]],
//                     c:[[foodIdx, ποσότητα, παρένθεση, [P,C,F,k], [[τρόφιμο,g]…]]],
//                     l:[[foodIdx, ποσότητα, παρένθεση, συνοδευτικά, [P,C,F,k] όλου του πιάτου, [[τρόφιμο,g]…]]]}
//   meal.mix='plate' + meal.mq (δείκτης στο q) · meal.mix='ideas' + meal.mi = [{d,el,f,k,m}]

var MIX_SLOT_LBL={
  breakfast:{el:'Πρωινό',en:'Breakfast',ru:'Завтрак',tr:'Kahvaltı'},
  snack:{el:'Ενδιάμεσο',en:'Snack',ru:'Перекус',tr:'Ara öğün'},
  lunch:{el:'Μεσημεριανό',en:'Lunch',ru:'Обед',tr:'Öğle yemeği'},
  dinner:{el:'Βραδινό',en:'Dinner',ru:'Ужин',tr:'Akşam yemeği'},
  bite:{el:'Μικρό γεύμα',en:'Light bite',ru:'Лёгкий перекус',tr:'Hafif atıştırma'}
};
function mixR1(x){ return Math.round(x*10)/10; }
function mixMacArr(m){ return [mixR1(m.p),mixR1(m.c),mixR1(m.f),Math.round(m.k)]; }

// Ποσότητα ιδέας στη γλώσσα του πελάτη: μονάδα σπιτιού (μεταφρασμένη όπως στο ημερήσιο link) + g
function mixIdeaQtyLang(f,lang){
  if(lang==='el') return mixIdeaQty(f,'el');
  var UD={en:(typeof EN_UNITS!=='undefined'?EN_UNITS:null),ru:(typeof RU_UNITS!=='undefined'?RU_UNITS:null),tr:(typeof TR_UNITS!=='undefined'?TR_UNITS:null)}[lang];
  var q=(typeof fmtFoodQty==='function')?fmtFoodQty(f,' g',function(u){ return (UD&&UD[u])||u; }):{main:f.g+' g',sub:''};
  return q.main+(q.sub?' '+q.sub:'');
}

function mixSnapshotPart(c,lang){
  lang=(['en','ru','tr'].indexOf(lang)>-1)?lang:'el';
  var menu=c.mixMenu||mixDefaultMenu(c), ctx=mixCtx(c), days=mixWeekTargets(c,'el');
  if(!days) return null;
  var foods=[], fIdx={};
  function fi(n,role,inMenu,tier){
    var k=role+'|'+n;
    if(fIdx[k]==null){
      fIdx[k]=foods.length;
      var e={n:mixFoodName(n,lang),el:n,e:mixFoodEmoji(n),r:role.charAt(0),t:tier||'star'};
      if(inMenu) e.s=1;
      if(n!==MIX_OMELETTE.key&&mixIsFish(n)) e.fi=1;
      if(n!==MIX_OMELETTE.key&&mixIsOilyFish(n)) e.o3=1;   // 🐟 ωμέγα-3: το λίπος του δεν μετράει ως υπέρβαση
      if(mixIsRedMeat(n)) e.rm=1;
      foods.push(e);
    }
    return fIdx[k];
  }
  // Σειρά: πρώτα το μενού του διαιτολόγου (⭐ στο link), μετά τα υπόλοιπα επιτρεπτά (🔍 αναζήτηση).
  function items(role){
    return (menu[role]||[]).map(function(n){ return {n:n,s:1,t:'star'}; })
      .concat(mixCandidates(c,role).filter(function(x){ return !x.locked; }).map(function(x){ return {n:x.n,t:x.tier}; }));
  }
  var IT={protein:items('protein'),carb:items('carb'),legume:items('legume')};
  var q=[], qIdx={}, pool=mixIdeaPool(c), outDays=[];
  days.forEach(function(day){
    var d=day.d;
    var meals=day.meals.map(function(m){
      var sl=MIX_SLOT_LBL[m.slot]||MIX_SLOT_LBL.snack;
      var base={label:sl[lang], time:m.time, slot:sl.el, tag:m.tag||'',
        kcal:m.k, macros:{p:m.p,c:m.c,f:m.f}, title:'', elTitle:'', foods:[], alternates:[], altSpares:[]};
      if(!m.main){
        base.mix='ideas';
        base.mi=mixIdeasFor(c,ctx,d,m,pool).slice(0,6).map(function(i){
          return {d:i.foods.map(function(f){ return mixFoodName(f.n,lang)+' '+mixIdeaQtyLang(f,lang); }).join(' + '),
            el:i.foods.map(function(f){ return f.n; }).join(' + '),
            f:i.foods.map(function(f){ return [f.n,Math.round(f.g)]; }), k:Math.round(i.tot.k),
            m:{p:Math.round(i.tot.p),c:Math.round(i.tot.c),f:Math.round(i.tot.f)}};
        });
        return base;
      }
      base.mix='plate';
      var P=[],C=[],LG=[],cf=[];
      var cpMenu=[];
      IT.carb.forEach(function(x){
        if(!mixAllowed(ctx,x.n,d)) return;
        var cq=mixCarbPortion(x.n,m.c,lang); if(!cq) return;
        if(x.s){ cf.push(cq.mac.f); cpMenu.push(cq); }
        var f=[[x.n,cq.g]]; if(cq.fruit) f.push([cq.fruit.n,cq.fruit.g]);
        C.push([fi(x.n,'carb',x.s,x.t),cq.main,cq.alt||'',mixMacArr(cq.mac),f]);
      });
      cf.sort(function(a,b){return a-b;});
      var cfMed=cf.length?cf[Math.floor(cf.length/2)]:MIX_CARB_FAT_ALLOW;   // ίδιο με τον editor/PDF
      var cpMed=mixMedianCarbP(cpMenu);
      IT.protein.forEach(function(x){
        if(!mixAllowed(ctx,x.n,d)) return;
        var pq=mixProteinPortion(x.n,m.p,cpMed,lang); if(!pq) return;   // ίδια ποσότητα με editor/PDF
        var fat=mixFatFor(ctx,d,mixOilSpoons(pq,m,cfMed),lang);
        P.push([fi(x.n,'protein',x.s,x.t),pq.main,pq.alt||'',fat.txt,mixMacArr(pq.mac),mixMacArr(fat.mac),
          pq.foods.concat(fat.n?[[fat.n,fat.g]]:[])]);
      });
      IT.legume.forEach(function(x){
        if(!mixAllowed(ctx,x.n,d)) return;
        var lp=mixLegumePlate(ctx,d,m,x.n,lang,menu); if(!lp) return;
        var extra=[];
        if(lp.bread) extra.push('+ '+lp.bread.main+' '+mixFoodName(lp.bread.n,lang));
        if(lp.add) extra.push('+ '+mixFoodName(lp.add.n,lang)+' '+lp.add.main+(lp.add.alt?' ('+lp.add.alt+')':''));
        extra.push('+ '+lp.fat.txt);
        var lf=[[x.n,lp.leg.g]];
        if(lp.bread) lf.push([lp.bread.n,lp.bread.g]);
        if(lp.add) lf=lf.concat(lp.add.foods);
        if(lp.fat.n) lf.push([lp.fat.n,lp.fat.g]);
        LG.push([fi(x.n,'legume',x.s,x.t),lp.leg.main,lp.leg.alt||'',extra.join(' '),mixMacArr(lp.tot),lf]);
      });
      var item={p:P,c:C,l:LG}, key=JSON.stringify(item);
      if(qIdx[key]==null){ qIdx[key]=q.length; q.push(item); }
      base.mq=qIdx[key];
      return base;
    });
    outDays.push({meals:meals,oilOk:mixAllowed(ctx,'Ελαιόλαδο',d),kcal:day.k,macros:{p:day.p,c:day.c,f:day.f}});
  });
  var hid=[];
  (menu.hiddenCombos||[]).forEach(function(pair){
    var a=pair.split('|'), pi=fIdx['protein|'+a[0]], ci=fIdx['carb|'+a[1]];
    if(pi!=null&&ci!=null) hid.push(pi+'|'+ci);
  });
  var r=menu.rules||{};
  return {days:outDays, mix:{v:1, foods:foods, q:q, hidden:hid,
    rules:{fish:r.fish!=null?r.fish:2, legumes:r.legumes!=null?r.legumes:2, redMeatMax:r.redMeatMax!=null?r.redMeatMax:2},
    veg:mixMacArr({p:MIX_VEG.p,c:MIX_VEG.c,f:MIX_VEG.f,k:MIX_VEG.p*4+MIX_VEG.c*4+MIX_VEG.f*9}),
    // λάδι στο link: ακριβές για το πιάτο που φτιάχνει ο πελάτης = (στόχος λίπους − πρωτεΐνη − υδατ. − λαχανικά)
    // σε ½ κ.σ. (0–2), ίδιος κανόνας με mixOilSpoons. Σε μέρα χωρίς λάδι (νηστεία) μένει το p[i][3] όπως είναι.
    oil:{g:MIX_OIL_G,f:FOODS['Ελαιόλαδο'].f*MIX_OIL_G/100,k:Math.round(FOODS['Ελαιόλαδο'].k*MIX_OIL_G/100*10)/10,
      unit:MIX_OIL_UNIT[lang]||MIX_OIL_UNIT.el,none:mixT(lang).oil0,max:2},
    vegTxt:mixT(lang).veg}};
}

// «Άλλαξε το μενού από τη δημοσίευση;» — ό,τι επηρεάζει το link: λίστες, κανόνες, κρυμμένα, αποκλεισμοί,
// τύπος διατροφής/εξαιρέσεις ημέρας και οι στόχοι κάθε γεύματος (βάρος/στόχος/προπονήσεις).
function mixHashInput(c){
  var m=c.mixMenu||{}, days=null;
  try{ days=mixWeekTargets(c,'el'); }catch(e){ days=null; }
  return {mode:'mix',protein:m.protein||[],carb:m.carb||[],legume:m.legume||[],ideasOff:m.ideasOff||[],
    hiddenCombos:m.hiddenCombos||[],rules:m.rules||{},
    excl:(typeof buildEffectiveExclusionList==='function')?buildEffectiveExclusionList(c):[],
    diet:c.dietType||'',ex:c.dietExceptionDays||{},fex:c.dietFoodExceptionDays||{},
    t:(days||[]).map(function(d){ return d.meals.map(function(x){ return x.slot+x.time+':'+x.p+'/'+x.c+'/'+x.f; }).join(','); })};
}

// 📊 Ιστορικό: κάθε αποστολή μενού κρατιέται χωριστά από τα ημερήσια πλάνα (c.savedPlans είναι γραμμένο
// γύρω από το weekPlan — σύγκριση, γραφήματα, «Φόρτωση» — και ένα μενού εκεί θα τα χαλούσε).
function recordMixSent(c){
  if(!c||!c.mixMenu) return null;
  var today=(typeof phToday==='function')?phToday():new Date().toISOString().slice(0,10);
  c.mixSent=c.mixSent||[];
  var menu=JSON.parse(JSON.stringify(c.mixMenu)); delete menu.updatedAt; delete menu.createdAt;
  var sig=JSON.stringify(menu), last=c.mixSent[c.mixSent.length-1];
  var t=(typeof calcTDEE==='function')?calcTDEE(c):{};
  if(last&&last.sig===sig){
    if(last.sentDates[last.sentDates.length-1]!==today) last.sentDates.push(today);
    return {isNew:false};
  }
  c.mixSent.push({date:today,sentDates:[today],sig:sig,menu:menu,kcal:Math.round(t.target||0)});
  while(c.mixSent.length>30) c.mixSent.shift();
  return {isNew:true};
}

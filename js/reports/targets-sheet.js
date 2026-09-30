// js/reports/targets-sheet.js
// «📊 Στόχοι χωρίς πλάνο» — για πελάτες που ΔΕΝ θέλουν διατροφικό πλάνο, μόνο τα μακροθρεπτικά
// κάθε ημέρας και τις ώρες που τρώνε, δεμένα στο προπονητικό τους. Δεν χρειάζεται c.weekPlan.
//
//   buildTargetsSheet(c)   -> καθαρό object (το ίδιο πάει στο PDF, στο modal και στο link)
//   exportTargetsPDF()     -> print window (browser «Αποθήκευση ως PDF»), ίδιο μοτίβο με exportPDF
//   openTargetsModal()     -> προεπισκόπηση + PDF + σύνδεσμος πελάτη (stoxoi.html)
//   publishTargetsLink(c)  -> γράφει το sheet στο shared_plans με ΔΙΚΟ ΤΟΥ token (c.targetsToken)
//
// Τα σύνολα ημέρας είναι ΑΚΡΙΒΩΣ ο πίνακας «Θερμίδες & μακροθρεπτικά ανά ημέρα» της σελίδας 1
// (makeDayTgtDefaults) — εδώ προστίθεται μόνο η μοιρασιά ανά γεύμα/ώρα. Οι ώρες γευμάτων
// ξεκινούν από το c.mealTimes και μετακινούνται γύρω από κάθε προπόνηση (πριν ~2,5h / μετά ~30′·
// προπόνηση πριν τις 09:00 → μικρό γεύμα 45′ πριν αντί για «πριν» στις 05:00). Με ενεργό το
// Πρωτόκολλο CHO και ΜΙΑ προπόνηση, τα γραμμάρια πριν/κατά/μετά έρχονται από το computeCHOTargets.
//
// Εξαρτήσεις (όλες φορτώνουν νωρίτερα, runtime μόνο): calcTDEE, makeDayTgtDefaults,
// computeCHOTargets, SPORT_PROFILES, esc, normalizePhoneIntl, genSecureToken, getC, save,
// showErrorToast, window.Cloud.

var TARGETS_BASE='https://feedyourhealth.github.io/stoxoi.html';

// Ίδιες προεπιλογές ωρών με το _buildSnapshot (js/app-part7.js) όταν λείπει το c.mealTimes.
var TS_DEFAULT_MEAL_MIN={breakfast:480,snack:660,lunch:780,snack2:1020,dinner:1200};
// Βάρη ανά τύπο γεύματος — ίδια με το allocateMealTargets (js/client-editor/day-targets.js).
var TS_SLOT_W={breakfast:0.22,lunch:0.28,dinner:0.25,snack:0.125};
var TS_EARLY_START_MIN=540;   // προπόνηση πριν τις 09:00 → μικρό γεύμα 45′ πριν
var TS_PRE_LEAD_MIN=150;      // κανονικό «πριν»: 2,5 ώρες πριν την έναρξη
var TS_POST_DELAY_MIN=30;     // «μετά»: 30′ από το τέλος
var TS_MERGE_GAP_MIN=60;      // προπονήσεις με κενό < 60′ μετράνε ως μία για τα γεύματα

var TS_TXT={
  el:{
    days:['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'],
    short:['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'],
    breakfast:'Πρωινό',snack:'Ενδιάμεσο',lunch:'Μεσημεριανό',dinner:'Βραδινό',bite:'Μικρό γεύμα',
    preOne:'πριν την προπόνηση',postOne:'μετά την προπόνηση',
    ord:['την 1η','τη 2η','την 3η','την 4η'],pre:'πριν',post:'μετά',
    nth:['1η','2η','3η','4η'],session:'προπόνηση',training:'Προπόνηση',
    kindT:'προπόνηση',kindR:'ξεκούραση',kindD:'διπλή προπόνηση',rest:'Ξεκούραση',
    perHr:'g υδατ./ώρα',water:'νερό',noTime:'χωρίς ώρα',at:'στις',
    title:'Οι διατροφικοί σου στόχοι',phTitle:'Οι στόχοι σου',sub:'Μακροθρεπτικά και ώρες ανά ημέρα',
    weight:'Βάρος',bf:'Λίπος σώματος',lean:'Άλιπη μάζα',avgK:'Μ.Ο. θερμίδων',
    day:'Ημέρα',time:'Ώρα',meal:'Γεύμα',kcal:'kcal',prot:'Πρωτεΐνη g',carb:'Υδατ. g',fat:'Λιπαρά g',
    protL:'πρωτεΐνη g',carbL:'υδατ. g',fatL:'λιπαρά g',pS:'Π',cS:'Υ',fS:'Λ',
    total:'Σύνολο ημέρας',week:'Η εβδομάδα σου',updated:'Ενημέρωση',
    howTitle:'Πώς να το χρησιμοποιήσεις',
    how:['Στόχος είναι το σύνολο της ημέρας· η μοιρασιά ανά γεύμα είναι οδηγός, όχι κανόνας.',
         'Οι ώρες μετακινούνται ±30′ χωρίς πρόβλημα. Αν αλλάξει η ώρα προπόνησης, μετακίνησε μαζί το «πριν» και το «μετά».',
         'Απόκλιση ±5% στις θερμίδες και ±10 g ανά μακροθρεπτικό είναι εντός στόχου.'],
    howDbl:'Σε ημέρα με δύο προπονήσεις, το γεύμα ανάμεσα είναι το πιο σημαντικό: μην το παραλείψεις.',
    print:'Εκτύπωση / Αποθήκευση PDF',
    msg:function(n,u){return 'Γεια σου '+n+'! Εδώ είναι οι διατροφικοί σου στόχοι ανά ημέρα: '+u;},
    subj:'Οι διατροφικοί σου στόχοι — Feed Your Health',
    body:function(n,u){return 'Γεια σου '+n+'!\n\nΕδώ είναι οι διατροφικοί σου στόχοι: θερμίδες και μακροθρεπτικά για κάθε ημέρα, με τις ώρες των γευμάτων γύρω από την προπόνησή σου. Άνοιξέ το από το κινητό σου:\n\n'+u+'\n\nΜε εκτίμηση,\nFeed Your Health';}
  },
  en:{
    days:['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    short:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    breakfast:'Breakfast',snack:'Snack',lunch:'Lunch',dinner:'Dinner',bite:'Light bite',
    preOne:'before training',postOne:'after training',
    ord:['session 1','session 2','session 3','session 4'],pre:'before',post:'after',
    nth:['1st','2nd','3rd','4th'],session:'session',training:'Training',
    kindT:'training',kindR:'rest',kindD:'double session',rest:'Rest day',
    perHr:'g carbs/hr',water:'water',noTime:'no time set',at:'at',
    title:'Your nutrition targets',phTitle:'Your targets',sub:'Macros and timing for each day',
    weight:'Weight',bf:'Body fat',lean:'Lean mass',avgK:'Avg. calories',
    day:'Day',time:'Time',meal:'Meal',kcal:'kcal',prot:'Protein g',carb:'Carbs g',fat:'Fat g',
    protL:'protein g',carbL:'carbs g',fatL:'fat g',pS:'P',cS:'C',fS:'F',
    total:'Day total',week:'Your week',updated:'Updated',
    howTitle:'How to use this',
    how:['The day total is the target; the split per meal is a guide, not a rule.',
         'Times can shift ±30 min. If your training time changes, move the "before" and "after" meals with it.',
         'Within ±5% on calories and ±10 g per macro counts as on target.'],
    howDbl:'On a double-session day the meal between sessions matters most: don\'t skip it.',
    print:'Print / Save as PDF',
    msg:function(n,u){return 'Hi '+n+'! Here are your daily nutrition targets: '+u;},
    subj:'Your nutrition targets — Feed Your Health',
    body:function(n,u){return 'Hi '+n+'!\n\nHere are your nutrition targets: calories and macros for each day, with meal times set around your training. Open it from your phone:\n\n'+u+'\n\nBest,\nFeed Your Health';}
  }
};
// ru/tr πελάτες παίρνουν αγγλικά (το έντυπο έχει μόνο el/en κείμενα)· οτιδήποτε άλλο → ελληνικά.
function tsLang(c){ var l=c&&c.lang; return (l==='en'||l==='ru'||l==='tr')?'en':'el'; }

function tsMin(hhmm){
  if(!hhmm) return null;
  var p=String(hhmm).split(':'), h=parseInt(p[0],10), m=parseInt(p[1],10)||0;
  return (isNaN(h)||h<0||h>23)?null:h*60+m;
}
function tsHHMM(min){
  var t=((Math.round(min)%1440)+1440)%1440;
  return String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');
}
function tsRound15(min){ return Math.round(min/15)*15; }

// Οι προπονήσεις της ημέρας d με ώρα έναρξης (λεπτά) και διάρκεια, ταξινομημένες. Κάθε MET
// δραστηριότητα κρατά τη δική της ώρα (ma.time)· σε ημέρα με ΜΙΑ δραστηριότητα υπερισχύει η ώρα
// της γραμμής «🕐 Ώρα» του πίνακα (c.trainTimesByDay), που είναι αυτό που βλέπει ο διαιτολόγος.
function tsDaySessions(c,d){
  var td=c.trainDays||[], out=[];
  (c.metActivities||[]).forEach(function(ma){
    var dList=ma.days;
    if(!dList){ // παλιό format (daysPerWeek) — ίδιο fallback με το calcMETkcal
      var n=ma.daysPerWeek||3; dList=[];
      for(var i=0;i<7&&dList.length<n;i++){ if(td[i]) dList.push(i); }
      if(!dList.length){ for(var j=0;j<n&&j<7;j++) dList.push(j); }
    }
    if(dList.indexOf(d)===-1) return;
    out.push({name:ma.name||'', mins:Math.max(5,+ma.mins||60), start:tsMin(ma.time)});
  });
  var dayTime=tsMin((c.trainTimesByDay||[])[d]);
  if(!out.length){
    if(!td[d]) return [];
    var hrs=(c.trainHoursByDay&&c.trainHoursByDay[d]!=null)?+c.trainHoursByDay[d]:(c.trainHoursPerDay||1);
    var sp=(c.sport&&c.sport!=='custom'&&typeof SPORT_PROFILES!=='undefined'&&SPORT_PROFILES[c.sport])?SPORT_PROFILES[c.sport].name:'';
    out.push({name:sp, mins:Math.max(5,Math.round((hrs||1)*60)), start:dayTime});
  } else if(out.length===1){
    if(dayTime!=null) out[0].start=dayTime;
  } else {
    out.forEach(function(s){ if(s.start==null) s.start=dayTime; });
  }
  out.sort(function(a,b){ return (a.start==null?1e9:a.start)-(b.start==null?1e9:b.start); });
  // δύο δραστηριότητες με την ίδια/επικαλυπτόμενη ώρα → η δεύτερη ξεκινά όταν τελειώνει η πρώτη
  for(var k=1;k<out.length;k++){
    var pv=out[k-1];
    if(out[k].start!=null&&pv.start!=null&&out[k].start<pv.start+pv.mins) out[k].start=pv.start+pv.mins;
  }
  return out;
}

// Μοιράζει το σύνολο `total` (g) στα γεύματα με βάρη `ws`, ακέραια, με άθροισμα ΑΚΡΙΒΩΣ total
// (το υπόλοιπο της στρογγυλοποίησης πάει στο γεύμα με το μεγαλύτερο βάρος).
function tsSplit(total,ws){
  var sum=ws.reduce(function(a,b){return a+b;},0), out=ws.map(function(){return 0;});
  if(!(total>0)||!(sum>0)) return out;
  var acc=0, big=0;
  ws.forEach(function(w,i){ out[i]=Math.round(total*w/sum); acc+=out[i]; if(w>ws[big]) big=i; });
  out[big]=Math.max(0,out[big]+(total-acc));
  return out;
}

// Μία ημέρα: γεύματα με ώρα/ρόλο + γραμμές προπόνησης. tgt={k,p,f,c} (σύνολο ημέρας από τον
// πίνακα), cho = computeCHOTargets(c,t,d) | null.
function tsBuildDay(c,d,tgt,L,cho){
  var mt=c.mealTimes||{};
  function tm(key){ var v=tsMin(mt[key]); return v!=null?v:TS_DEFAULT_MEAL_MIN[key]; }
  var meals=[
    {slot:'breakfast',name:L.breakfast,t:tm('breakfast'),roles:[]},
    {slot:'snack',name:L.snack,t:tm('snack'),roles:[]},
    {slot:'lunch',name:L.lunch,t:tm('lunch'),roles:[]},
    {slot:'snack',name:L.snack,t:tm('snack2'),roles:[]},
    {slot:'dinner',name:L.dinner,t:tm('dinner'),roles:[]}
  ];
  var sessions=tsDaySessions(c,d);
  var timed=sessions.filter(function(s){return s.start!=null;});
  // blocks: συνεχόμενες προπονήσεις (κενό < 60′) = ένα μπλοκ για τα γεύματα
  var blocks=[];
  timed.forEach(function(s){
    var e=s.start+s.mins, last=blocks[blocks.length-1];
    if(last&&s.start-last.end<TS_MERGE_GAP_MIN){ last.end=Math.max(last.end,e); }
    else blocks.push({start:s.start,end:e});
  });
  function nearestFree(ideal,radius){
    var best=null, bd=Infinity;
    meals.forEach(function(m){
      if(m.roles.length) return;
      var dd=Math.abs(m.t-ideal);
      if(dd<bd){ bd=dd; best=m; }   // ισοπαλία → το νωρίτερο γεύμα (σειρά πίνακα)
    });
    return (best&&bd<=radius)?best:null;
  }
  var early=false;
  blocks.forEach(function(b,bi){
    // ── ΠΡΙΝ ──
    if(b.start<TS_EARLY_START_MIN){
      early=true;
      meals.push({slot:'bite',name:L.bite,t:b.start-45,roles:[{k:'pre',n:bi}]});
    } else {
      var dbl=null;
      meals.forEach(function(m){
        if(!dbl&&m.roles.some(function(r){return r.k==='post';})&&m.t>=b.start-210&&m.t<=b.start-60) dbl=m;
      });
      if(dbl){ dbl.roles.push({k:'pre',n:bi}); }
      else {
        var ideal=b.start-TS_PRE_LEAD_MIN, pm=nearestFree(ideal,120);
        if(pm){ if(pm.t<b.start-210||pm.t>b.start-90) pm.t=ideal; pm.roles.push({k:'pre',n:bi}); }
        else meals.push({slot:'snack',name:L.snack,t:ideal,roles:[{k:'pre',n:bi}]});
      }
    }
    // ── ΜΕΤΑ ──
    // Ελεύθερο γεύμα που πέφτει ΠΑΝΩ στην προπόνηση πρέπει ούτως ή άλλως να μετακινηθεί — αυτό
    // γίνεται το «μετά» (π.χ. πρωινό 08:00 με long run 08:00–10:00 → πρωινό στις 10:30), αντί να
    // σπρωχτεί πριν την προπόνηση και το «μετά» να το πάρει ένα μικρό ενδιάμεσο.
    var pIdeal=tsRound15(b.end+TS_POST_DELAY_MIN), qm=null;
    meals.forEach(function(m){ if(!m.roles.length&&m.t>b.start-75&&m.t<b.end+15) qm=m; });
    if(!qm) qm=nearestFree(pIdeal,150);
    if(qm){ if(qm.t<b.end+15||qm.t>b.end+75) qm.t=pIdeal; qm.roles.push({k:'post',n:bi}); }
    else meals.push({slot:'snack',name:L.snack,t:pIdeal,roles:[{k:'post',n:bi}]});
  });
  // άλλο ελεύθερο γεύμα που έπεσε πάνω σε προπόνηση → 90′ πριν την έναρξη (ή, αν αυτό βγαίνει
  // πριν τις 06:00, 2 ώρες μετά το τέλος)
  meals.forEach(function(m){
    if(m.roles.length) return;
    blocks.forEach(function(b){
      if(m.t>b.start-75&&m.t<b.end+15) m.t=(b.start-90>=360)?b.start-90:b.end+120;
    });
  });
  meals.sort(function(a,b){return a.t-b.t;});
  // αποστάσεις: ελεύθερα γεύματα ≥90′ από το προηγούμενο· τα «πριν/μετά» δεν μετακινούνται
  for(var i=1;i<meals.length;i++){
    if(!meals[i].roles.length&&meals[i].t-meals[i-1].t<90) meals[i].t=meals[i-1].t+90;
  }
  for(var j=meals.length-2;j>=0;j--){
    if(!meals[j].roles.length&&meals[j+1].t-meals[j].t<60){
      var nt=meals[j+1].t-90;
      if(j===0||nt-meals[j-1].t>=60) meals[j].t=nt;
    }
  }
  meals.sort(function(a,b){return a.t-b.t;});

  // ── βάρη ανά μακροθρεπτικό ──
  var wP=[],wC=[],wF=[];
  meals.forEach(function(m){
    var isPre=m.roles.some(function(r){return r.k==='pre';}), isPost=m.roles.some(function(r){return r.k==='post';});
    if(m.slot==='bite'){ wP.push(0.04); wC.push(0.10); wF.push(0.03); return; }
    var base=TS_SLOT_W[m.slot]||0.125, snack=(m.slot==='snack');
    var p=1,cc=1,f=1;
    if(isPre&&isPost){ p=1.1; cc=1.4; f=0.6; }
    else if(isPre){ if(snack){p=0.7;cc=1.5;f=0.4;} else {p=1;cc=1.25;f=0.8;} }
    else if(isPost){ if(snack){p=1.5;cc=1.5;f=0.5;} else {p=1.1;cc=1.2;f=0.8;} }
    wP.push(base*p); wC.push(base*cc); wF.push(base*f);
  });
  var gP=tsSplit(tgt.p,wP), gF=tsSplit(tgt.f,wF), gC;

  // ── Πρωτόκολλο CHO: γραμμάρια πριν/κατά/μετά όταν υπάρχει ΜΙΑ προπόνηση ──
  var duringG=0, duringPerHr=0;
  var useCho=!!(cho&&blocks.length===1&&(cho.isTrainingDay||cho.isMatchDay));
  if(useCho){
    var preIdx=-1, postIdx=-1;
    meals.forEach(function(m,ix){
      m.roles.forEach(function(r){ if(r.k==='pre'&&!early) preIdx=ix; if(r.k==='post') postIdx=ix; });
    });
    var preG=(preIdx>-1&&cho.pre)?cho.pre.grams:0, postG=(postIdx>-1&&cho.post)?cho.post.grams:0;
    if(cho.during&&cho.during.applicable){ duringG=cho.during.totalGrams||0; duringPerHr=cho.during.gramsPerHour||0; }
    var fixed=preG+postG+duringG, cap=Math.round(tgt.c*0.75);
    if(fixed>cap&&fixed>0){ var sc=cap/fixed; preG=Math.round(preG*sc); postG=Math.round(postG*sc); duringG=Math.round(duringG*sc); }
    var restW=wC.map(function(w,ix){ return (ix===preIdx||ix===postIdx)?0:w; });
    gC=tsSplit(Math.max(0,tgt.c-preG-postG-duringG),restW);
    if(preIdx>-1) gC[preIdx]=preG;
    if(postIdx>-1) gC[postIdx]=postG;
  } else {
    gC=tsSplit(tgt.c,wC);
  }

  // ── γραμμές εξόδου ──
  var multi=blocks.length>1;
  function tagOf(m){
    if(!m.roles.length) return null;
    var pre=null, post=null;
    m.roles.forEach(function(r){ if(r.k==='pre') pre=r; else post=r; });
    function lbl(r){ return multi?((r.k==='pre'?L.pre:L.post)+' '+(L.ord[r.n]||'')):(r.k==='pre'?L.preOne:L.postOne); }
    if(pre&&post) return {cls:'mid',label:lbl(post)+' · '+lbl(pre)};
    return pre?{cls:'pre',label:lbl(pre)}:{cls:'post',label:lbl(post)};
  }
  var rows=meals.map(function(m,ix){
    return {t:m.t,time:tsHHMM(m.t),name:m.name,tag:tagOf(m),p:gP[ix],c:gC[ix],f:gF[ix],k:gP[ix]*4+gC[ix]*4+gF[ix]*9};
  });
  sessions.forEach(function(s,si){
    var nm=(sessions.length>1?(L.nth[si]||'')+' '+L.session+' · ':'')+(s.name||L.training)+' '+s.mins+'′';
    var r={train:true,t:(s.start!=null?s.start:-1),time:(s.start!=null?tsHHMM(s.start):'—'),name:nm,note:''};
    if(useCho&&duringG>0&&si===0){ r.c=duringG; r.k=duringG*4; r.note=duringPerHr+' '+L.perHr; }
    rows.push(r);
  });
  rows.sort(function(a,b){ return a.t-b.t || (a.train?1:-1); });
  rows.forEach(function(r){ delete r.t; });

  var kind=!sessions.length?'R':(sessions.length>1?'D':'T');
  var sub=!sessions.length?L.rest:sessions.map(function(s){
    return (s.name||L.training)+' '+s.mins+'′'+(s.start!=null?' · '+tsHHMM(s.start):'');
  }).join(' + ');
  return {label:L.days[d],short:L.short[d],kind:kind,kindLabel:L['kind'+kind],sub:sub,
    trainName:!sessions.length?L.rest:sessions.map(function(s){return (s.name||L.training)+' '+s.mins+'′';}).join(' + '),
    trainTime:timed.length?timed.map(function(s){return tsHHMM(s.start);}).join(' · '):'—',
    missingTime:sessions.length>timed.length,
    k:tgt.k,p:tgt.p,c:tgt.c,f:tgt.f,rows:rows};
}

// Το πλήρες έντυπο. Επιστρέφει null όταν λείπουν βάρος/ύψος/ηλικία (t.incomplete).
function buildTargetsSheet(c){
  if(!c) return null;
  var t=calcTDEE(c);
  if(t.incomplete) return null;
  var lang=tsLang(c), L=TS_TXT[lang];
  var eff=makeDayTgtDefaults(c,t);
  var days=[], sumK=0, anyDbl=false;
  for(var d=0;d<7;d++){
    var cho=null;
    if(c.choProtocol&&c.choProtocol.enabled&&typeof computeCHOTargets==='function'){
      try{ cho=computeCHOTargets(c,t,d); }catch(e){ cho=null; }
    }
    var day=tsBuildDay(c,d,eff[d],L,cho);
    if(day.kind==='D') anyDbl=true;
    sumK+=eff[d].k||0;
    days.push(day);
  }
  // %λίπους: τελευταία μέτρηση του tracker, αλλιώς το πεδίο της καρτέλας
  var bf=null;
  var wl=(c.weightLog||[]).filter(function(e){return e&&e.bf>0;}).sort(function(a,b){return a.date<b.date?1:-1;});
  if(wl.length) bf=wl[0].bf; else if(c.bf>0) bf=c.bf;
  var w=c.weight>0?c.weight:null;
  var how=L.how.slice(); if(anyDbl) how.splice(2,0,L.howDbl);
  var now=new Date();
  return {
    v:1, kind:'targets', lang:lang,
    name:(c.name||'').split(' ')[0], fullName:c.name||'',
    date:String(now.getDate()).padStart(2,'0')+'/'+String(now.getMonth()+1).padStart(2,'0')+'/'+now.getFullYear(),
    weight:w, bf:(bf!=null?+(+bf).toFixed(1):null),
    lean:(w&&bf!=null)?+(w*(1-bf/100)).toFixed(1):null,
    avgK:Math.round(sumK/7),
    days:days,
    txt:{title:L.title,phTitle:L.phTitle,sub:L.sub,weight:L.weight,bf:L.bf,lean:L.lean,avgK:L.avgK,
      day:L.day,time:L.time,meal:L.meal,training:L.training,kcal:L.kcal,prot:L.prot,carb:L.carb,fat:L.fat,
      protL:L.protL,carbL:L.carbL,fatL:L.fatL,pS:L.pS,cS:L.cS,fS:L.fS,
      total:L.total,week:L.week,updated:L.updated,howTitle:L.howTitle,how:how,print:L.print}
  };
}

// ── HTML του εντύπου (PDF) ──────────────────────────────────────────────────
function tsNum(n){ return String(n==null?'':n).replace(/\B(?=(\d{3})+(?!\d))/g,'.'); }
function tsWeekTableHtml(sh){
  var X=sh.txt;
  var h='<table class="ts-t"><tr><th>'+esc(X.day)+'</th><th>'+esc(X.training)+'</th><th>'+esc(X.time)+'</th><th>'+esc(X.kcal)+'</th><th>'+esc(X.prot)+'</th><th>'+esc(X.carb)+'</th><th>'+esc(X.fat)+'</th></tr>';
  sh.days.forEach(function(d){
    h+='<tr'+(d.kind==='R'?' class="rest"':'')+'><td>'+esc(d.label)+'</td><td>'+esc(d.trainName)+'</td><td>'+esc(d.trainTime)+'</td><td>'+tsNum(d.k)+'</td>'
      +'<td class="cp">'+d.p+'</td><td class="cc">'+d.c+'</td><td class="cf">'+d.f+'</td></tr>';
  });
  return h+'</table>';
}
function tsDayCardHtml(d,X){
  var rows='', sp=0, sc=0, sf=0;
  d.rows.forEach(function(r){
    if(r.train){
      rows+='<tr class="train"><td>'+esc(r.time)+'</td><td'+(r.c?'':' colspan="5"')+'>&#9654; '+esc(r.name)+(r.note?' &middot; '+esc(r.note):'')+'</td>'
        +(r.c?'<td>'+r.k+'</td><td>&mdash;</td><td>'+r.c+'</td><td>&mdash;</td>':'')+'</tr>';
      if(r.c) sc+=r.c;
      return;
    }
    sp+=r.p; sc+=r.c; sf+=r.f;
    rows+='<tr><td>'+esc(r.time)+'</td><td>'+esc(r.name)+(r.tag?' <span class="pill '+r.tag.cls+'">'+esc(r.tag.label)+'</span>':'')+'</td>'
      +'<td>'+r.k+'</td><td class="cp">'+r.p+'</td><td class="cc">'+r.c+'</td><td class="cf">'+r.f+'</td></tr>';
  });
  return '<div class="ts-day"><div class="ts-dhd"><h2>'+esc(d.label)+' <span class="pill k'+d.kind+'">'+esc(d.kindLabel)+'</span></h2><div class="ts-dsub">'+esc(d.sub)+'</div></div>'
    +'<table class="ts-t"><tr><th>'+esc(X.time)+'</th><th>'+esc(X.meal)+'</th><th>'+esc(X.kcal)+'</th><th>'+esc(X.prot)+'</th><th>'+esc(X.carb)+'</th><th>'+esc(X.fat)+'</th></tr>'
    +rows+'<tr class="tot"><td></td><td>'+esc(X.total)+'</td><td>'+tsNum(d.k)+'</td><td class="cp">'+sp+'</td><td class="cc">'+sc+'</td><td class="cf">'+sf+'</td></tr></table></div>';
}
var TS_CSS='*{box-sizing:border-box}body{margin:0;background:#f4f6f5;color:#1d2b2a;font-family:"Segoe UI",system-ui,Arial,sans-serif;padding:16px}'
  +'.ts-wrap{max-width:780px;margin:0 auto}.ts-sheet,.ts-day{background:#fff;border:1px solid #dde5e3;border-radius:14px;padding:18px;margin-bottom:12px}'
  +'.ts-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}h1{font-size:20px;margin:0;color:#025857}'
  +'.ts-sub{font-size:13px;color:#6b7a78;margin-top:3px}.ts-brand{font-size:12px;color:#6b7a78;text-align:right}.ts-brand b{color:#025857;font-size:13px}'
  +'.ts-tiles{display:flex;gap:10px;margin:14px 0}.ts-tile{flex:1;background:#f2fbf8;border-radius:10px;padding:9px 12px}'
  +'.ts-tile .l{font-size:11px;color:#6b7a78}.ts-tile .v{font-size:18px;font-weight:700;color:#025857}'
  +'.ts-t{width:100%;border-collapse:collapse}.ts-t th,.ts-t td{padding:7px 6px;font-size:12.5px;text-align:right;border-bottom:1px solid #dde5e3}'
  +'.ts-t th{font-size:11.5px;color:#6b7a78;font-weight:600}.ts-t th:nth-child(-n+2),.ts-t td:nth-child(-n+2){text-align:left}'
  +'.ts-t tr.rest td{color:#6b7a78}.cp{color:#1565c0;font-weight:600}.cc{color:#2e7d32;font-weight:600}.cf{color:#d84315;font-weight:600}'
  +'.ts-t tr.rest .cp,.ts-t tr.rest .cc,.ts-t tr.rest .cf{color:#6b7a78;font-weight:400}'
  +'.pill{font-size:10.5px;padding:2px 8px;border-radius:999px;font-weight:600;white-space:nowrap}'
  +'.pill.pre{background:#fff4e5;color:#8a5200}.pill.post{background:#e8f5e9;color:#2e7d32}.pill.mid{background:#e3f2fd;color:#0d47a1}'
  +'.pill.kT{background:#025857;color:#fff}.pill.kR{background:#e9eeed;color:#6b7a78}.pill.kD{background:#e65100;color:#fff}'
  +'h2{font-size:15px;margin:0;color:#025857}.ts-dhd{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:6px}'
  +'.ts-dsub{font-size:12px;color:#6b7a78}.ts-t tr.train td{background:#f2fbf8;font-weight:600;color:#025857}.ts-t tr.tot td{font-weight:700;border-bottom:none}'
  +'h3{font-size:13.5px;color:#025857;margin:0 0 6px}ul{margin:0;padding-left:18px;font-size:12.5px;line-height:1.6}'
  +'.ts-bar{text-align:center;margin-bottom:12px}.ts-bar button{padding:7px 18px;background:#025857;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700}'
  +'@page{size:A4;margin:11mm}@media print{body{background:#fff;padding:0}.ts-bar{display:none}.ts-sheet,.ts-day{break-inside:avoid;page-break-inside:avoid}'
  +'*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}';
function tsSheetHtml(sh){
  var X=sh.txt;
  function tile(l,v){ return '<div class="ts-tile"><div class="l">'+esc(l)+'</div><div class="v">'+v+'</div></div>'; }
  var tiles='';
  if(sh.weight!=null) tiles+=tile(X.weight,sh.weight+' kg');
  if(sh.bf!=null) tiles+=tile(X.bf,sh.bf+'%');
  if(sh.lean!=null) tiles+=tile(X.lean,sh.lean+' kg');
  tiles+=tile(X.avgK,tsNum(sh.avgK));
  return '<div class="ts-wrap"><div class="ts-bar"><button onclick="window.print()">&#128424;&#65039; '+esc(X.print)+'</button></div>'
    +'<div class="ts-sheet"><div class="ts-hd"><div><h1>'+esc(X.title)+'</h1><div class="ts-sub">'+esc(sh.fullName)+' &middot; '+esc(sh.date)+'</div></div>'
    +'<div class="ts-brand"><b>Feed Your Health</b><br>WWW.FEEDYOURHEALTH.ORG</div></div>'
    +'<div class="ts-tiles">'+tiles+'</div>'+tsWeekTableHtml(sh)+'</div>'
    +sh.days.map(function(d){return tsDayCardHtml(d,X);}).join('')
    +'<div class="ts-sheet"><h3>'+esc(X.howTitle)+'</h3><ul>'+sh.txt.how.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ul></div></div>';
}

function tsGetSheetOrToast(){
  var c=getC();
  if(!c){ showErrorToast('Διάλεξε πρώτα πελάτη.'); return null; }
  var sh=buildTargetsSheet(c);
  if(!sh){ showErrorToast('Συμπλήρωσε βάρος, ύψος και ηλικία για να υπολογιστούν οι στόχοι.'); return null; }
  return sh;
}
function exportTargetsPDF(){
  var sh=tsGetSheetOrToast(); if(!sh) return;
  var html='<!DOCTYPE html><html lang="'+sh.lang+'"><head><meta charset="UTF-8"><title>'+esc(sh.txt.title)+' — '+esc(sh.fullName)+'</title><style>'+TS_CSS+'</style></head><body>'+tsSheetHtml(sh)+'</body></html>';
  var w=window.open('','_blank');
  if(!w){ showErrorToast('Ο browser μπλόκαρε το νέο παράθυρο — επίτρεψε τα pop-ups για να ανοίξει το PDF.'); return; }
  w.document.write(html); w.document.close();
  setTimeout(function(){ try{ w.print(); }catch(e){} },600);
}

// ── Σύνδεσμος πελάτη ────────────────────────────────────────────────────────
// Ίδιος πίνακας με το πλάνο (shared_plans → RPC get_shared_plan), αλλά ΞΕΧΩΡΙΣΤΟ token
// (c.targetsToken) ώστε να μην πατάει τον σύνδεσμο πλάνου αν ο πελάτης έχει και τα δύο. Το
// snapshot έχει kind:'targets' και το διαβάζει το stoxoi.html. Ίδια λήξη/ανανέωση με το πλάνο.
function publishTargetsLink(c){
  var C=window.Cloud;
  if(!C||!C.enabled||!C.user) return Promise.reject(new Error('Πρέπει να είσαι συνδεδεμένος στο cloud για να στείλεις σύνδεσμο.'));
  var snap=buildTargetsSheet(c);
  if(!snap) return Promise.reject(new Error('Συμπλήρωσε βάρος, ύψος και ηλικία για να υπολογιστούν οι στόχοι.'));
  return C.sb.auth.getSession().then(function(res){
    var session=(res&&res.data)?res.data.session:null;
    if(!session||!session.user){
      C.user=null; C._showLogin();
      throw new Error('Η σύνδεσή σου στο cloud έχει λήξει. Συνδέσου ξανά και ξαναπροσπάθησε.');
    }
    C.user=session.user;
    var doWrite=function(tok,isRetry){
      var expiresAt=new Date(Date.now()+C.LINK_EXPIRE_DAYS*86400000).toISOString();
      var row={token:tok,dietitian_id:session.user.id,snapshot:snap,client_name:c.name||'',updated_at:new Date().toISOString(),expires_at:expiresAt};
      return C.sb.from('shared_plans').upsert(row,{onConflict:'token'}).then(function(res2){
        if(res2.error){
          var isRls=/row-level security/i.test(res2.error.message||'');
          // ίδιο fallback με το publishPlan: token από ξένη/παλιά γραμμή → δοκίμασε με νέο token
          if(isRls&&!isRetry){ var nt=genSecureToken(); c.targetsToken=nt; return doWrite(nt,true); }
          throw new Error('Απέτυχε η δημιουργία του συνδέσμου. Δοκίμασε ξανά.'+(res2.error.message?' ['+res2.error.message+']':''));
        }
        try{ if(typeof save==='function') save(); }catch(e){}   // κράτα το targetsToken στο cloud
        return {url:TARGETS_BASE+'?t='+tok,expiresAt:expiresAt};
      });
    };
    var tok=c.targetsToken;
    if(!tok){ tok=genSecureToken(); c.targetsToken=tok; }
    return doWrite(tok,false);
  });
}

function openTargetsModal(){
  var sh=tsGetSheetOrToast(); if(!sh) return;
  var c=getC();
  var ov=document.getElementById('targets-overlay');
  if(ov) ov.remove();
  ov=document.createElement('div');
  ov.id='targets-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  var missing=sh.days.filter(function(d){return d.missingTime;}).map(function(d){return d.short;});
  var rows=sh.days.map(function(d){
    return '<tr style="border-bottom:1px solid #e3ece9'+(d.kind==='R'?';color:#8aa':'')+'"><td style="padding:5px 4px;text-align:left;font-weight:600">'+esc(d.short)+'</td>'
      +'<td style="padding:5px 4px;text-align:left">'+esc(d.trainName)+(d.trainTime!=='—'?' <span style="color:#8aa">'+esc(d.trainTime)+'</span>':'')+'</td>'
      +'<td style="padding:5px 4px">'+tsNum(d.k)+'</td><td style="padding:5px 4px;color:#1565c0">'+d.p+'</td><td style="padding:5px 4px;color:#2e7d32">'+d.c+'</td><td style="padding:5px 4px;color:#d84315">'+d.f+'</td></tr>';
  }).join('');
  ov.innerHTML='<div style="background:var(--card-bg);border-radius:16px;max-width:520px;width:100%;padding:22px;box-shadow:0 10px 40px rgba(0,0,0,.25);max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:24px">📊</span><div style="font-size:18px;font-weight:700;color:#014545">Αποστολή στόχων</div></div>'
    +'<div style="font-size:13px;color:#5a8a82;margin-bottom:12px">Για τον/την <b>'+esc(c.name||'πελάτη')+'</b>, χωρίς διατροφικό πλάνο: θερμίδες και μακροθρεπτικά κάθε ημέρας, με ώρες γευμάτων γύρω από την προπόνηση. Τα νούμερα είναι ο πίνακας της σελίδας 1.</div>'
    +'<div style="overflow-x:auto;margin-bottom:10px"><table style="width:100%;border-collapse:collapse;font-size:12px;text-align:right">'
    +'<tr style="color:#5a8a82;border-bottom:1px solid #c5ddd8"><th style="padding:5px 4px;text-align:left">Ημέρα</th><th style="padding:5px 4px;text-align:left">Προπόνηση</th><th style="padding:5px 4px">kcal</th><th style="padding:5px 4px">Π</th><th style="padding:5px 4px">Υ</th><th style="padding:5px 4px">Λ</th></tr>'
    +rows+'</table></div>'
    +(missing.length?'<div style="font-size:11px;color:#e08a00;margin:0 0 10px;line-height:1.4">⚠️ Λείπει ώρα προπόνησης ('+esc(missing.join(', '))+') — τα γεύματα εκείνων των ημερών δεν δένονται με την προπόνηση. Συμπλήρωσε τη γραμμή «🕐 Ώρα» στον πίνακα.</div>':'')
    +'<button class="btn" style="width:100%;background:#025857;color:#fff;border:1px solid #025857;margin-bottom:8px" onclick="exportTargetsPDF()">🖨️ PDF (όλη η εβδομάδα αναλυτικά)</button>'
    +'<div id="targets-link-body"><button class="btn" style="width:100%;background:#E2EEE5;color:#014545;border:1px solid #c5ddd8" onclick="createTargetsLink()">🔗 Δημιουργία συνδέσμου για το κινητό του πελάτη</button></div>'
    +'<div style="text-align:right;margin-top:12px"><button class="btn" onclick="document.getElementById(\'targets-overlay\').remove()">Κλείσιμο</button></div>'
    +'</div>';
  document.body.appendChild(ov);
}
function createTargetsLink(){
  var c=getC(), body=document.getElementById('targets-link-body');
  if(!c||!body) return;
  body.innerHTML='<div style="font-size:13px;color:#5a8a82;text-align:center;padding:10px 0">Δημιουργία συνδέσμου…</div>';
  publishTargetsLink(c).then(function(res){
    var b=document.getElementById('targets-link-body'); if(!b) return;
    var L=TS_TXT[tsLang(c)], fname=(c.name||'').split(' ')[0], url=res.url;
    var msg=L.msg(fname,url), ebody=L.body(fname,url);
    var phone=normalizePhoneIntl(c.phone);
    var wa='https://wa.me/'+(phone||'')+'?text='+encodeURIComponent(msg);
    var gmail='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(c.email||'')+'&su='+encodeURIComponent(L.subj)+'&body='+encodeURIComponent(ebody);
    var mailto='mailto:'+encodeURIComponent(c.email||'').replace(/%40/g,'@')+'?subject='+encodeURIComponent(L.subj)+'&body='+encodeURIComponent(ebody);
    var expTxt=new Date(res.expiresAt).toLocaleDateString('el-GR',{day:'numeric',month:'long',year:'numeric'});
    var aSt='display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;color:#fff;padding:10px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:6px';
    b.innerHTML='<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">Σύνδεσμος πελάτη</div>'
      +'<div style="display:flex;gap:6px;margin-bottom:10px"><input id="targets-url" value="'+esc(url)+'" readonly style="flex:1;font-size:12px;padding:9px 10px;border:1px solid #c5ddd8;border-radius:8px;background:#f4f8f6;color:#014545" onclick="this.select()">'
      +'<button class="btn" style="background:#025857;color:#fff;border:1px solid #025857;white-space:nowrap" onclick="copyTargetsUrl(this)">Αντιγραφή</button></div>'
      +'<a href="'+esc(wa)+'" target="_blank" rel="noopener" style="'+aSt+';background:#25D366">📱 WhatsApp'+(phone?' ('+esc(c.phone)+')':'')+'</a>'
      +'<a href="'+esc(gmail)+'" target="_blank" rel="noopener" style="'+aSt+';background:#c2483a">✉️ Gmail στον browser</a>'
      +'<a href="'+esc(mailto)+'" style="'+aSt+';background:#025857">📧 Πρόγραμμα Email'+(c.email?' ('+esc(c.email)+')':'')+'</a>'
      +'<div style="font-size:11px;color:#9fb5b0;line-height:1.5">⏳ Ο σύνδεσμος λήγει στις <b>'+expTxt+'</b>. Αν αλλάξεις κάτι στη σελίδα 1, πάτα ξανά «Αποστολή στόχων» → «Δημιουργία συνδέσμου»: ο ίδιος σύνδεσμος ενημερώνεται.</div>';
  }).catch(function(e){
    var b=document.getElementById('targets-link-body');
    if(b) b.innerHTML='<div style="color:#c0392b;font-size:13px;margin-bottom:6px">❌ '+esc((e&&e.message)||'Σφάλμα δημιουργίας συνδέσμου')+'</div>'
      +'<button class="btn" style="width:100%;background:#E2EEE5;color:#014545;border:1px solid #c5ddd8" onclick="createTargetsLink()">🔗 Δοκίμασε ξανά</button>';
  });
}
function copyTargetsUrl(btn){
  var inp=document.getElementById('targets-url');
  if(!inp) return;
  inp.select();
  var ok=false;
  try{ ok=document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(inp.value).then(function(){},function(){}); ok=true; }
  if(ok&&btn){ var o=btn.textContent; btn.textContent='✓ Αντιγράφηκε'; setTimeout(function(){btn.textContent=o;},1500); }
}

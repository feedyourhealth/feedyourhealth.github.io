// js/tabs/progress-mix.js
// 🧩 Μενού επιλογών: τι βλέπει ο διαιτολόγος (2026-11-24, mockup docs/dietologist-mix-progress-mockup.html, προτάσεις 1–5).
//
// Ο πελάτης σε Μενού γράφει στο client_meal_log ό,τι και ο ημερήσιος, αλλά η τιμή είναι:
//   {mx:1, n:'Κοτόπουλο στήθος (ψητό) + Ρύζι λευκό (βρ.)', d, s:'Μεσημεριανό', f:[[τρόφιμο,g]…], k, m:{p,c,f}, t:{fi,rm}}  πιάτο
//   {mx:1, n:'Φακές (βρ.)', …, t:{le:1}}                                                                         όσπρια
//   {mx:1, n:'Γιαούρτι 2% + Βρώμη (ωμή)', d, s:'Πρωινό', f, k, m}  (χωρίς t)                                        ιδέα
//   true  = «κάτι παρόμοιο» (υπάρχει μόνο στα γεύματα με ιδέες)
// Οι θέσεις γευμάτων (ετικέτες/στόχοι) βγαίνουν από mixWeekTargets — ΟΧΙ από το κρυμμένο c.weekPlan.
//
// Δίνει: την κάρτα «🧩 Τι διάλεξε από το Μενού» στην Πρόοδο (αντί για «🔄 Αντικαταστάσεις»), τους
// κανόνες εβδομάδας, το «Τι προτιμά», ειδοποιήσεις με κουμπί, και τα νούμερα για τον editor του
// Μενού (×N / 💤 στα τρόφιμα) + το πάνελ «📲 Ο πελάτης» (plan-insights.js).

var PMX_WEEKS=4;          // παράθυρο για προτιμήσεις / κανόνες / ειδοποιήσεις
var PMX_SIM_MIN=4;        // «κάτι παρόμοιο» ≥ τόσες φορές σε ένα γεύμα με ιδέες …
var PMX_SIM_PCT=40;       // … και ≥ τόσο % των τσεκ εκείνου του γεύματος ⇒ ειδοποίηση
var PMX_NEVER_MIN=6;      // πιάτα στο 4βδομαδο πριν δείξουμε «💤 ποτέ»
var PMX_WEEK_MIN=3;       // πιάτα σε μια εβδομάδα για να μετρήσει στον έλεγχο ψάρι/όσπρια
var PMX_LIST_SHOW=12;     // γραμμές λίστας πριν το «Δες όλα»
var _pmxFlags={};         // clientId → flags της τελευταίας σχεδίασης (για τα κουμπιά)
var _pmxTgt={id:null,t:0,days:null};

function pmxIsMix(c){ return typeof mixIsActive==='function' && mixIsActive(c); }
function pmxTargets(c){
  if(_pmxTgt.id===c.id && Date.now()-_pmxTgt.t<2000) return _pmxTgt.days;
  var d=null; try{ d=(typeof mixWeekTargets==='function')?mixWeekTargets(c,'el'):null; }catch(e){ d=null; }
  _pmxTgt={id:c.id,t:Date.now(),days:d};
  return d;
}
function pmxDayMeals(c,wd){ var d=pmxTargets(c); return (d&&d[wd]&&d[wd].meals)||[]; }
// Το όνομα θέσης όπως το γράφει το link στο v.s (MIX_SLOT_LBL.el)
function pmxSlotName(m){
  var L=(typeof MIX_SLOT_LBL!=='undefined')&&m&&MIX_SLOT_LBL[m.slot];
  return L?L.el:((m&&m.name)||'');
}
function pmxTagTxt(t){ return t==='pre'?'πριν':t==='post'?'μετά':t==='mid'?'ανάμεσα':''; }
function pmxWd(key){ return (new Date(key+'T00:00:00').getDay()+6)%7; }

function pmxKind(v){
  if(!v) return 'missed';
  if(v===true) return 'similar';
  if(typeof v==='object' && v.mx) return v.t?(v.t.le?'leg':'plate'):'idea';
  return 'similar';   // παλιά εναλλακτική από ημερήσιο link — δεν ξέρουμε τι, μετρά ως «παρόμοιο»
}
function pmxParts(v){ return String((v&&v.n)||'').split(' + ').filter(Boolean); }
function pmxIdeaEmoji(n){
  var s=(typeof normalizeGreekText==='function')?normalizeGreekText(n):String(n).toLowerCase();
  if(/γιαουρτ|βρωμ|δημητρ|μουσλι|granola/.test(s)) return '🥣';
  if(/αυγ|ομελετ/.test(s)) return '🍳';
  if(/γαλα|ροφημ|whey|πρωτειν|kefir|κεφιρ/.test(s)) return '🥛';
  if(/αμυγδαλ|καρυδ|φιστικ|φυστικ|κασιους|ξηρ|ταχιν|βουτυρο/.test(s)) return '🥜';
  if(/ψωμ|τοστ|φρυγαν|κρακερ|ρυζογκοφρ|πιτα/.test(s)) return '🍞';
  if(/τυρ|cottage|κοτατζ|φετα|ανθοτυρ/.test(s)) return '🧀';
  if(/μηλ|μπαναν|πορτοκ|αχλαδ|σταφυλ|ακτινιδ|φρουτ|φραουλ|μουρ|ροδακ|καρπουζ|πεπον/.test(s)) return '🍎';
  return '🍽';
}
function pmxEmoji(v){
  var k=pmxKind(v), parts=pmxParts(v);
  if(k==='plate') return parts.map(function(n){ return (typeof mixFoodEmoji==='function')?mixFoodEmoji(n):''; }).join('');
  if(k==='leg') return (typeof mixFoodEmoji==='function')?mixFoodEmoji(parts[0]||''):'🫘';
  if(k==='idea') return pmxIdeaEmoji(parts[0]||'');
  return '';
}
function pmxNice(n){ return (typeof mixFoodName==='function')?mixFoodName(n,'el'):n; }
function pmxPickName(v){
  var k=pmxKind(v);
  if(k==='plate'||k==='leg') return pmxParts(v).map(pmxNice).join(' + ')+(k==='leg'&&v.f&&v.f.length>2?' (+ συνοδευτικά)':'');
  if(k==='idea') return v.d||v.n||'';
  return '';
}

// Η πρώτη μέρα που μετράει: πρώτη καταγραφή, αλλά όχι πριν σταλεί το πρώτο Μενού (c.mixSent).
function pmxFirstKey(c,log,ckRows){
  var ks=Object.keys(log||{}).sort();
  var first=[ckRows&&ckRows.length?ckRows[0].date:null, ks[0]||null].filter(Boolean).sort()[0]||null;
  var start=(c.mixSent&&c.mixSent.length)?c.mixSent[0].date:null;
  if(first && start && start>first) first=start;
  return first;
}

// Όλα τα γεύματα των τελευταίων `weeks` εβδομάδων (μέχρι σήμερα), κατηγοριοποιημένα.
function pmxCollect(c,weeks){
  var C=window.Cloud;
  var log=(C&&typeof C.mealLogFor==='function')?C.mealLogFor(c):{};
  var ckRows=(C&&typeof C.checkinsFor==='function')?(C.checkinsFor(c)||[]):[];
  var ckBy=(typeof ckRowsByDate==='function')?ckRowsByDate(ckRows):{};
  var firstKey=pmxFirstKey(c,log,ckRows);
  var st={log:log,ckBy:ckBy,firstKey:firstKey,entries:[],tot:0,menu:0,similar:0,missed:0};
  if(!firstKey) return st;
  progressSwapDates(weeks).forEach(function(k){
    if(k<firstKey) return;
    var wd=pmxWd(k), meals=pmxDayMeals(c,wd), tot=progressSwapMealsTotal(c,ckBy[k],k), m=log[k]||{};
    for(var j=0;j<tot;j++){
      var v=m[j], kind=pmxKind(v), mm=meals[j]||null;
      st.entries.push({date:k,wd:wd,idx:j,v:v,kind:kind,slot:(mm&&pmxSlotName(mm))||(v&&v.s)||('Γεύμα '+(j+1)),tag:(mm&&mm.tag)||'',target:mm});
      st.tot++;
      if(kind==='missed') st.missed++; else if(kind==='similar') st.similar++; else st.menu++;
    }
  });
  return st;
}

// 📆 ψάρι / όσπρια / κόκκινο κρέας ανά εβδομάδα (ίδια μέτρηση με το mxWeekCounts του link)
function pmxRules(c){ var r=(c.mixMenu&&c.mixMenu.rules)||{}; return {fish:r.fish!=null?r.fish:2,legumes:r.legumes!=null?r.legumes:2,red:r.redMeatMax!=null?r.redMeatMax:2}; }
function pmxWeeks(c,log,firstKey){
  var out=[];
  for(var off=-(PMX_WEEKS-1);off<=0;off++){
    var ks=ckWeekDates(off), w={off:off,key:ks[0],fi:0,le:0,rm:0,picks:0,cur:off===0,
      tracked:!!(firstKey && ks[6]>=firstKey), full:!!(firstKey && off<0 && ks[0]>=firstKey)};
    ks.forEach(function(k){
      var m=log[k]||{};
      Object.keys(m).forEach(function(i){ var v=m[i]; if(v&&v.mx&&v.t){ w.picks++; if(v.t.fi)w.fi++; if(v.t.le)w.le++; if(v.t.rm)w.rm++; } });
    });
    out.push(w);
  }
  return out;
}

// Τι διαλέγει (πάντα στις 4 εβδ.)
function pmxPrefs(c,st){
  var P={protein:{},carb:{},legume:{},plates:0,slots:{},slotOrder:[]};
  function inc(o,k){ o[k]=(o[k]||0)+1; }
  st.entries.forEach(function(e){
    var parts=pmxParts(e.v), s=e.slot;
    if(e.kind==='plate'){ P.plates++; if(parts[0]) inc(P.protein,parts[0]); if(parts[1]) inc(P.carb,parts[1]); }
    else if(e.kind==='leg'){ P.plates++; if(parts[0]) inc(P.legume,parts[0]); }
    var mainSlot=e.target?e.target.main:(e.kind==='plate'||e.kind==='leg');
    if(!mainSlot){
      if(!P.slots[s]){ P.slots[s]={ideas:{},similar:0,picked:0,total:0}; P.slotOrder.push(s); }
      var x=P.slots[s]; x.total++;
      if(e.kind==='idea'){ x.picked++; inc(x.ideas,e.v.d||e.v.n); }
      else if(e.kind==='similar') x.similar++;
    }
  });
  // στο μενού αλλά ποτέ επιλεγμένα
  var menu=c.mixMenu||{};
  P.never={};
  ['protein','carb','legume'].forEach(function(r){ P.never[r]=(menu[r]||[]).filter(function(n){ return !P[r][n]; }); });
  return P;
}
function pmxTop(o){ return Object.keys(o).map(function(k){ return {n:k,c:o[k]}; }).sort(function(a,b){ return b.c-a.c; }); }

// Ειδοποιήσεις (σχήμα ίδιο με progressSwapFlags): {key,sig,t,s,act,role,add,note}
function pmxFlags(c,st4,weeks,P){
  var R=pmxRules(c), out=[], dis=c.mixFlagDismissed||{};
  function hidden(f){ return dis[f.key]!=null && (typeof f.sig==='number'?dis[f.key]>=f.sig:dis[f.key]===f.sig); }
  // 1. γεύμα με ιδέες όπου διαλέγει συνέχεια «κάτι παρόμοιο»
  P.slotOrder.forEach(function(s){
    var x=P.slots[s], done=x.similar+x.picked;
    if(x.similar>=PMX_SIM_MIN && x.similar*100>=done*PMX_SIM_PCT){
      var top=pmxTop(x.ideas);
      out.push({key:'sim|'+s,sig:x.similar,kind:'sim',
        t:s+': «κάτι παρόμοιο» '+x.similar+' φορές στις '+PMX_WEEKS+' εβδομάδες',
        s:top.length?'Από τις ιδέες διαλέγει μόνο: '+top.slice(0,2).map(function(i){ return '«'+i.n+'» ('+i.c+'×)'; }).join(', ')+'.':'Δεν διάλεξε καμία από τις ιδέες που του έδωσες.',
        note:'🧩 '+s+': διαλέγει «κάτι παρόμοιο» αντί για τις ιδέες του Μενού ('+x.similar+' φορές σε 4 εβδ.) — να δούμε τι τρώει στο ραντεβού.'});
    }
  });
  // 2–3. ψάρι / όσπρια κάτω από τον στόχο σε ΟΛΕΣ τις ολόκληρες εβδομάδες (≥2) με αρκετά πιάτα
  var full=weeks.filter(function(w){ return w.full && w.picks>=PMX_WEEK_MIN; });
  function under(field,goal,role,lbl,emo,cands,whoTxt){
    if(!(goal>0) || full.length<2) return;
    if(!full.every(function(w){ return w[field]<goal; })) return;
    var last=full[full.length-1];
    out.push({key:field+'|under',sig:last.key,kind:'under',role:role,add:cands.slice(0,2),
      t:emo+' '+lbl+' κάτω από τον στόχο '+full.length+' εβδομάδες στη σειρά ('+full.map(function(w){ return w[field]; }).join(', ')+' / '+goal+')',
      s:whoTxt,
      note:'🧩 '+lbl+' κάτω από τον στόχο ('+full.map(function(w){ return w[field]; }).join(', ')+' / '+goal+' την εβδομάδα) — να το συζητήσουμε στο ραντεβού.'});
  }
  var cand=function(role,f){ return (typeof mixCandidates==='function'?mixCandidates(c,role):[]).filter(function(x){ return !x.locked && x.tier!=='warn' && (!f||f(x.n)); }).map(function(x){ return x.n; }); };
  var legTop=pmxTop(P.legume), fishTop=pmxTop(P.protein).filter(function(x){ return typeof mixIsFish==='function'&&mixIsFish(x.n); });
  under('le',R.legumes,'legume','Όσπρια','🫘',cand('legume'),
    legTop.length?'Όταν διαλέγει όσπρια, παίρνει: '+legTop.slice(0,3).map(function(x){ return pmxNice(x.n)+' ('+x.c+'×)'; }).join(', ')+'.':'Δεν έχει διαλέξει όσπρια από το Μενού.');
  under('fi',R.fish,'protein','Ψάρι','🐟',cand('protein',function(n){ return typeof mixIsFish==='function'&&mixIsFish(n); }),
    fishTop.length?'Ψάρια που διαλέγει: '+fishTop.slice(0,3).map(function(x){ return pmxNice(x.n)+' ('+x.c+'×)'; }).join(', ')+'.':'Δεν έχει διαλέξει ψάρι από το Μενού.');
  // 4. κόκκινο κρέας πάνω από το όριο (οποιαδήποτε εβδομάδα, και η τρέχουσα)
  var over=weeks.filter(function(w){ return w.tracked && w.rm>R.red; });
  if(over.length){
    var w=over[over.length-1];
    out.push({key:'rm|over',sig:w.key,kind:'over',
      t:'🥩 Κόκκινο κρέας '+w.rm+' φορές την εβδομάδα '+progressShortDate(w.key)+(w.cur?' (τρέχουσα)':'')+' — όριο '+R.red,
      s:over.length>1?'Πάνω από το όριο '+over.length+' από τις '+PMX_WEEKS+' εβδομάδες.':'',
      note:'🧩 Κόκκινο κρέας πάνω από το όριο ('+w.rm+' / έως '+R.red+' την εβδομάδα) — να το συζητήσουμε στο ραντεβού.'});
  }
  return out.filter(function(f){ return !hidden(f); });
}

// Όλα μαζί για 4 εβδ. — τα χρησιμοποιούν η κάρτα, ο editor του Μενού και το πάνελ «📲 Ο πελάτης».
function pmxSummary(c){
  var st=pmxCollect(c,PMX_WEEKS);
  if(!st.firstKey) return null;
  var weeks=pmxWeeks(c,st.log,st.firstKey), P=pmxPrefs(c,st);
  return {st:st,weeks:weeks,prefs:P,flags:pmxFlags(c,st,weeks,P),rules:pmxRules(c)};
}

// ── Ενέργειες από τις ειδοποιήσεις ──────────────────────────────────────────────────────────
function pmxFlagOf(id,fi){ return (_pmxFlags[id]||[])[fi]; }
function pmxFlagOpenMenu(id){ if(typeof selectClient==='function') selectClient(id); if(typeof swTab==='function') swTab(2); }
function pmxFlagStar(id,fi){
  var c=clients.find(function(x){ return x.id===id; }), fl=pmxFlagOf(id,fi);
  if(!c || !c.mixMenu || !fl || !fl.add || !fl.add.length) return;
  var role=fl.role, list=c.mixMenu[role]=(c.mixMenu[role]||[]);
  fl.add.forEach(function(n){ if(list.indexOf(n)===-1) list.push(n); });
  c.mixMenu.updatedAt=new Date().toISOString();
  save();
  if(typeof showSuccessToast==='function') showSuccessToast('Προστέθηκαν στο Μενού ως ⭐. Ξαναδημοσίευσε το link για να τα δει ο πελάτης.');
  openProgressClient(id);
}
function pmxFlagNote(id,fi){
  var c=clients.find(function(x){ return x.id===id; }), fl=pmxFlagOf(id,fi);
  if(!c || !fl) return;
  if(!c.dietologistNotes) c.dietologistNotes=[];
  c.dietologistNotes.push({date:new Date().toISOString().slice(0,10),note:fl.note});
  save();
  if(typeof showSuccessToast==='function') showSuccessToast('Προστέθηκε στο ιστορικό του πελάτη.');
  openProgressClient(id);
}
function pmxFlagDismiss(id,fi){
  var c=clients.find(function(x){ return x.id===id; }), fl=pmxFlagOf(id,fi);
  if(!c || !fl) return;
  if(!c.mixFlagDismissed) c.mixFlagDismissed={};
  c.mixFlagDismissed[fl.key]=fl.sig;
  save();
  openProgressClient(id);
}

// ── Η κάρτα στην Πρόοδο ─────────────────────────────────────────────────────────────────────
function pmxMacLine(k,m){ return '<div class="pi-mac">'+Math.round(k||0)+' kcal · Π '+Math.round(m.p||0)+' · Υ '+Math.round(m.c||0)+' · Λ '+Math.round(m.f||0)+' γρ.</div>'; }
function pmxDetailHtml(e){
  var v=e.v, t=e.target, ate=(v.f||[]);
  var h='<div class="pi-det"><div class="pi-side"><div class="pi-sh">ΣΤΟΧΟΣ ΓΕΥΜΑΤΟΣ</div>'
    +(t?'<div>Π '+Math.round(t.p)+' · Υ '+Math.round(t.c)+' · Λ '+Math.round(t.f)+' γρ.</div><div class="pi-mac">≈ '+Math.round(t.k)+' kcal (με τους σημερινούς στόχους)</div>':'<div class="pi-mac">—</div>')
    +'</div><div class="pi-side pi-ate"><div class="pi-sh">'+(e.kind==='idea'?'Η ΙΔΕΑ ΠΟΥ ΔΙΑΛΕΞΕ':'ΤΟ ΠΙΑΤΟ ΤΟΥ')+'</div>'
    +ate.map(function(p){ return '<div>'+esc(pmxNice(p[0]))+' · '+Math.round(p[1])+' γρ.</div>'; }).join('')
    +(e.kind==='plate'||e.kind==='leg'?'<div>Λαχανικά / σαλάτα · ≥ 200 γρ.</div>':'')
    +(v.m?pmxMacLine(v.k,v.m):'')+'</div></div>';
  if(t && v.m){
    var dk=Math.round((v.k||0)-t.k), fish=!!(v.t&&v.t.fi);
    function chip(lbl,d,warn){ return '<span class="pi-chip'+(warn?' pi-chip-w':'')+'">'+lbl+' '+(d>0?'+':'')+d+'</span>'; }
    var dp=Math.round(v.m.p-t.p), dc=Math.round(v.m.c-t.c), df=Math.round(v.m.f-t.f);
    h+='<div class="pi-chips">'
      +'<span class="pi-chip'+(Math.abs(dk)>=100?' pi-chip-w':'')+'">'+(Math.abs(dk)<50?'Θερμίδες ίδιες ('+(dk>0?'+':'')+dk+')':'Θερμίδες '+(dk>0?'+':'')+dk)+'</span>'
      +chip('Πρωτεΐνη',dp,dp<=-10)+chip('Υδατάνθρακες',dc,Math.abs(dc)>=15)
      +'<span class="pi-chip'+(Math.abs(df)>=10&&!(fish&&df>0)?' pi-chip-w':'')+'">Λίπος '+(df>0?'+':'')+df+(fish&&df>0?' (ψάρι 🐟, ωμέγα-3)':'')+'</span>'
      +'</div>';
  }
  return h;
}
function pmxRowLabel(e){ return esc(e.slot)+(pmxTagTxt(e.tag)?' <small class="pmx-tag">'+pmxTagTxt(e.tag)+'</small>':''); }

function progressMixHtml(c,ckRows){
  var cid=c.id, range=(typeof _progressSwapRange!=='undefined'&&_progressSwapRange==='4w')?'4w':'week';
  var head='<div class="hm-card pr-sw pmx" style="margin-bottom:14px"><div class="hm-card-title">🧩 Τι διάλεξε από το Μενού';
  var S=pmxSummary(c);
  if(!S) return head+'</div><div class="hm-empty">Δεν υπάρχουν ακόμα επιλογές από το Μενού στο link.</div></div>';
  var st=range==='4w'?S.st:pmxCollect(c,1);
  function rb(r,lbl){ return '<button type="button" class="pr-sw-rb'+(range===r?' on':'')+'" onclick="progressSwapSetRange(\''+cid+'\',\''+r+'\')">'+lbl+'</button>'; }
  var html=head+'<span style="margin-left:auto;display:flex;gap:4px">'+rb('week','Αυτή η εβδομάδα')+rb('4w','4 εβδομάδες')+'</span></div>';
  function pct(n){ return st.tot?' <small>· '+Math.round(n/st.tot*100)+'%</small>':''; }
  html+='<div class="pr-wk-tiles">'
    +'<div class="pr-wk-tile"><div class="pr-wk-tl">Πιάτο / ιδέα από το μενού</div><div class="pr-wk-tv">'+st.menu+' <small>/ '+st.tot+'</small></div></div>'
    +'<div class="pr-wk-tile"><div class="pr-wk-tl">«Κάτι παρόμοιο»</div><div class="pr-wk-tv" style="color:#1565c0">'+st.similar+pct(st.similar)+'</div></div>'
    +'<div class="pr-wk-tile"><div class="pr-wk-tl">Δεν τσεκαρίστηκαν</div><div class="pr-wk-tv"'+(st.missed?' style="color:#8a5b00"':'')+'>'+st.missed+'</div></div>'
    +'</div>';

  // ⚠️ ειδοποιήσεις (4 εβδ.)
  _pmxFlags[cid]=S.flags;
  S.flags.slice(0,3).forEach(function(fl,fi){
    var btns='';
    if(fl.kind==='sim') btns+='<button type="button" class="hm-action-btn" onclick="pmxFlagOpenMenu(\''+cid+'\')">Άνοιξε το Μενού</button>';
    if(fl.kind==='under' && fl.add && fl.add.length) btns+='<button type="button" class="hm-action-btn" onclick="pmxFlagStar(\''+cid+'\','+fi+')">Κάνε ⭐ '+esc(fl.add.map(pmxNice).join(' & '))+' στο Μενού</button>';
    html+='<div class="pr-sw-flag"><div class="pr-sw-flag-t">⚠️ '+esc(fl.t)+'</div>'
      +(fl.s?'<div class="pr-sw-flag-s">'+esc(fl.s)+'</div>':'')
      +'<div class="pr-sw-flag-a">'+btns
      +'<button type="button" class="hm-action-btn" style="background:#fff;color:#8a5b00;border:1px solid #f0d998" onclick="pmxFlagNote(\''+cid+'\','+fi+')">📝 Σημείωσέ το για το ραντεβού</button>'
      +'<button type="button" class="pr-sw-link" onclick="pmxFlagDismiss(\''+cid+'\','+fi+')">Αγνόησε</button>'
      +'</div></div>';
  });

  // Πίνακας μέρα × γεύμα της τρέχουσας εβδομάδας
  var wk=ckWeekDates(0), today=ckDayKey(new Date()), log=S.st.log, ckBy=S.st.ckBy, firstKey=S.st.firstKey;
  var maxN=0, rowLbl=[];
  wk.forEach(function(k){ maxN=Math.max(maxN,progressSwapMealsTotal(c,ckBy[k],k)); });
  for(var j=0;j<maxN;j++){
    var lbl='';
    for(var d=0;d<7&&!lbl;d++){ var mm=pmxDayMeals(c,d)[j]; if(mm) lbl=pmxRowLabel({slot:pmxSlotName(mm),tag:mm.tag}); }
    rowLbl.push(lbl||('Γεύμα '+(j+1)));
  }
  if(maxN){
    html+='<div class="pr-sw-sub">Τι έφαγε αυτή την εβδομάδα</div><div class="pr-wk-scroll"><table class="pr-sw-grid pmx-grid"><thead><tr><th></th>'
      +PROGRESS_SWAP_DAYS.map(function(d){ return '<th>'+d+'</th>'; }).join('')+'</tr></thead><tbody>';
    for(var r=0;r<maxN;r++){
      html+='<tr><td class="pr-sw-rl">'+rowLbl[r]+'</td>';
      wk.forEach(function(k){
        var tot=progressSwapMealsTotal(c,ckBy[k],k);
        if(k>today || r>=tot || k<firstKey){ html+='<td><span class="pr-sw-c pr-sw-cf"></span></td>'; return; }
        var v=(log[k]||{})[r], kind=pmxKind(v), mm=pmxDayMeals(c,pmxWd(k))[r], where=(mm?pmxSlotName(mm):'');
        if(kind==='missed') html+='<td><span class="pr-sw-c pr-sw-cn" title="'+esc(where)+': δεν τσεκαρίστηκε"></span></td>';
        else if(kind==='similar') html+='<td><span class="pr-sw-c pmx-cs" title="'+esc(where)+': κάτι παρόμοιο">≈</span></td>';
        else html+='<td><span class="pr-sw-c pr-sw-cp pmx-ce" title="'+esc(where+': '+pmxPickName(v))+'">'+pmxEmoji(v)+'</span></td>';
      });
      html+='</tr>';
    }
    html+='</tbody></table></div>'
      +'<div class="pr-wk-legend"><span><span class="pr-sw-c pr-sw-cp pmx-ce">🐔</span>πιάτο / ιδέα από το μενού (ποντίκι από πάνω = όνομα)</span><span><span class="pr-sw-c pmx-cs">≈</span>κάτι παρόμοιο</span><span><span class="pr-sw-c pr-sw-cn"></span>δεν τσεκαρίστηκε</span></div>';
  }

  // Λίστα πιάτων (νεότερα πρώτα)
  var rows=st.entries.filter(function(e){ return e.kind!=='missed'; })
    .sort(function(a,b){ return a.date<b.date?1:(a.date>b.date?-1:a.idx-b.idx); });
  html+='<div class="pr-sw-sub">Λίστα επιλογών'+(range==='4w'?' (4 εβδομάδες)':' (αυτή η εβδομάδα)')+'</div>';
  if(!rows.length) html+='<div class="hm-empty">Καμία επιλογή'+(range==='4w'?' τις τελευταίες 4 εβδομάδες.':' αυτή την εβδομάδα.')+'</div>';
  function rowHtml(e){
    var when='<span class="pr-sw-when">'+PROGRESS_SWAP_DAYS[e.wd]+' '+progressShortDate(e.date)+' · '+pmxRowLabel(e)+'</span>';
    if(e.kind==='similar') return '<div class="pr-sw-row pmx-row">'+when+'<span class="pmx-sim">≈ κάτι παρόμοιο</span><span></span></div>';
    var k=e.v.k?'<span class="pmx-k">'+Math.round(e.v.k)+' kcal</span>':'<span></span>';
    return '<details class="pr-sw-det"><summary class="pr-sw-row pmx-row" title="Δες γραμμάρια και Π/Υ/Λ">'+when
      +'<span class="pr-sw-to">'+pmxEmoji(e.v)+' '+esc(pmxPickName(e.v))+'</span>'+k+'</summary>'+pmxDetailHtml(e)+'</details>';
  }
  html+=rows.slice(0,PMX_LIST_SHOW).map(rowHtml).join('');
  if(rows.length>PMX_LIST_SHOW) html+='<details class="pmx-more"><summary>Δες όλες ('+rows.length+')</summary>'+rows.slice(PMX_LIST_SHOW).map(rowHtml).join('')+'</details>';

  html+=pmxRulesHtml(S)+pmxPrefsHtml(S);
  return html+'</div>';
}

function pmxRulesHtml(S){
  var R=S.rules, W=S.weeks.filter(function(w){ return w.tracked; });
  if(!W.length) return '';
  function cells(field,goal,max){
    return '<div class="pmx-wk">'+W.map(function(w){
      var v=w[field], cls=max?(v>goal?'bad':'ok'):(v>=goal?'ok':(w.cur?'cur':'lo'));
      return '<span class="'+cls+'" title="Εβδομάδα '+progressShortDate(w.key)+(w.cur?' (τρέχουσα)':'')+'">'+v+'</span>';
    }).join('')+'</div>';
  }
  return '<div class="pr-sw-sub">📆 Κανόνες εβδομάδας ('+W.length+' εβδ., η τρέχουσα δεξιά)</div><div class="pmx-rules">'
    +'<div class="pmx-rule"><b>🐟 Ψάρι</b> <small>στόχος ≥ '+R.fish+'</small>'+cells('fi',R.fish)+'</div>'
    +'<div class="pmx-rule"><b>🫘 Όσπρια</b> <small>στόχος ≥ '+R.legumes+'</small>'+cells('le',R.legumes)+'</div>'
    +'<div class="pmx-rule"><b>🥩 Κόκκινο κρέας</b> <small>έως '+R.red+'</small>'+cells('rm',R.red,true)+'</div>'
    +'</div>';
}

function pmxPrefsHtml(S){
  var P=S.prefs, html='', boxes=[];
  function box(title,n,top,never){
    if(!top.length && !never.length) return '';
    var mx=top.length?top[0].c:1;
    return '<div class="pi-pref"><div class="pi-pref-h">'+title+' <span>· '+n+'</span></div>'
      +top.slice(0,4).map(function(x){ return '<div class="pi-pref-r"><span>'+esc(x.lbl||pmxNice(x.n))+'</span><b'+(x.sim?' style="color:#1565c0"':'')+'>'+x.c+'×</b></div>'
        +'<div class="pmx-bar'+(x.sim?' sim':'')+'" style="width:'+Math.round(x.c/mx*100)+'%"></div>'; }).join('')
      +(never.length?'<div class="pmx-never">💤 Ποτέ: '+esc(never.map(pmxNice).join(', '))+'</div>':'')+'</div>';
  }
  var showNever=P.plates>=PMX_NEVER_MIN;
  var prot=pmxTop(P.protein).concat(pmxTop(P.legume)).sort(function(a,b){ return b.c-a.c; });
  boxes.push(box('🍗 Πρωτεΐνη / όσπρια',P.plates+' πιάτα',prot,showNever?P.never.protein.concat(P.never.legume):[]));
  boxes.push(box('🍚 Υδατάνθρακας',Object.keys(P.carb).reduce(function(s,k){ return s+P.carb[k]; },0)+' πιάτα',pmxTop(P.carb),showNever?P.never.carb:[]));
  P.slotOrder.forEach(function(s){
    var x=P.slots[s], top=pmxTop(x.ideas);
    if(x.similar) top.push({n:'',lbl:'«Κάτι παρόμοιο»',c:x.similar,sim:1});
    top.sort(function(a,b){ return b.c-a.c; });
    boxes.push(box(pmxIdeaEmoji(top[0]&&!top[0].sim?top[0].n:'')+' '+esc(s),(x.picked+x.similar)+' τσεκ',top,[]));
  });
  boxes=boxes.filter(Boolean);
  if(!boxes.length) return '';
  return '<div class="pr-sw-sub">Τι προτιμά ('+PMX_WEEKS+' εβδομάδες)</div><div class="pi-prefs">'+boxes.join('')+'</div>';
}

// ── Για τον editor του Μενού (Πλάνο) ────────────────────────────────────────────────────────
// {slot:{food:count}} για πιάτα και ιδέες + ανά θέση {done,total,similar} — null αν δεν υπάρχει τίποτα.
function pmxEditorCounts(c){
  if(!c || !c.shareToken || !pmxIsMix(c)) return null;
  var S=pmxSummary(c); if(!S || !S.st.tot) return null;
  var out={bySlot:{},slot:{},plates:S.prefs.plates,S:S};
  S.st.entries.forEach(function(e){
    var key=e.slot+(e.tag?'|'+e.tag:'');
    var sl=out.slot[key]||(out.slot[key]={done:0,total:0,similar:0});
    sl.total++; if(e.kind!=='missed') sl.done++; if(e.kind==='similar') sl.similar++;
    var b=out.bySlot[e.slot]||(out.bySlot[e.slot]={__n:0});
    if(e.kind!=='missed') b.__n++;
    if(e.kind==='plate'||e.kind==='leg') pmxParts(e.v).forEach(function(n){ b[n]=(b[n]||0)+1; });
    else if(e.kind==='idea'){ var ik=pmxParts(e.v).slice().sort().join('|'); b['idea:'+ik]=(b['idea:'+ik]||0)+1; }
  });
  return out;
}

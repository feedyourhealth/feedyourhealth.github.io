// js/plan-gen/mix-editor.js
// 🧩 Μενού επιλογών — η οθόνη στην καρτέλα «Πλάνο» (φάση 1: editor + PDF· το link έρχεται στη φάση 2).
//
// c.planMode: 'daily' (προεπιλογή, όλοι οι σημερινοί πελάτες) | 'mix'
// c.mixMenu : ΤΙ διάλεξε ο διαιτολόγος (λίστες ονομάτων) — τα γραμμάρια βγαίνουν πάντα από το
//             mix-engine.js με τους τρέχοντες στόχους. Το c.weekPlan ΔΕΝ αγγίζεται: κρύβεται όσο ο
//             πελάτης είναι σε Μενού επιλογών και ξαναφαίνεται αν γυρίσεις σε «Ημερήσιο πλάνο».
//
// Όλα τα κουμπιά περνούν από ΕΝΑΝ delegated click handler (data-mx="…"), ώστε τα ονόματα τροφίμων
// (με παρενθέσεις, «&», εισαγωγικά) να μη μπαίνουν ποτέ μέσα σε onclick="…".

var _mixDay=null;           // επιλεγμένη μέρα στον editor (0=Δευ)
var _mixPicker=null;        // {role} όταν είναι ανοιχτό το «＋ τρόφιμο»
var _mixPickQ='';
var _mixUndo=null;          // {label, menu, cid} — η τελευταία αλλαγή, για «↩ Αναίρεση»

function mixTodayIdx(){ return (new Date().getDay()+6)%7; }
function mixClone(o){ return JSON.parse(JSON.stringify(o)); }

// ── Είσοδος / αλλαγή τύπου ─────────────────────────────────────────────────
// «🧩 Μενού επιλογών →» στα Στοιχεία: όπως το «Δημιουργία πλάνου →», αλλά φτιάχνει μενού.
function mixStart(){
  var c=getC(); var ok=mixCanUse(c);
  if(!ok.ok){ showErrorToast(ok.why); return; }
  if(!c.mixMenu) c.mixMenu=mixDefaultMenu(c);
  c.planMode='mix';
  saveNow();
  swTab(2);
  showSuccessToast('🧩 Μενού επιλογών: οι λίστες φτιάχτηκαν από τους στόχους και τους αποκλεισμούς του πελάτη.');
}
function mixSetMode(mode){
  var c=getC(); if(!c) return;
  if(mode==='mix'){
    var ok=mixCanUse(c); if(!ok.ok){ showErrorToast(ok.why); return; }
    if(!c.mixMenu) c.mixMenu=mixDefaultMenu(c);
    c.planMode='mix';
  } else {
    c.planMode='daily';
  }
  save();
  mixApplyMode();
  if(mode!=='mix'&&typeof renderWeekTable==='function') renderWeekTable();
}
// Καλείται από το swTab(2): κρύβει/δείχνει τα κομμάτια του ημερήσιου πλάνου και ζωγραφίζει τον editor.
function mixApplyMode(){
  var c=getC(), s2=document.getElementById('s2'); if(!c||!s2) return;
  // Ανήλικος που μπήκε σε Mix πριν αλλάξει η ηλικία του → πίσω σε ημερήσιο (απόφαση 23/11)
  if(c.planMode==='mix'&&mixIsMinor(c)){ c.planMode='daily'; save(); }
  var on=mixIsActive(c);
  s2.classList.toggle('mix-mode',on);
  var sw=document.getElementById('mix-mode-switch');
  if(sw) sw.innerHTML=mixSwitchHtml(c);
  var box=document.getElementById('mix-editor');
  if(!box) return;
  if(!on){ box.innerHTML=''; box.style.display='none'; return; }
  box.style.display='block';
  if(!box._mixBound){ box.addEventListener('click',mixOnClick); box.addEventListener('input',mixOnInput); box.addEventListener('change',mixOnChange); box._mixBound=true; }
  mixRenderEditor();
}
function mixSwitchHtml(c){
  var on=mixIsActive(c), can=mixCanUse(c);
  var plan=c.weekPlan&&Object.keys(c.weekPlan).length;
  var h='<span class="mix-sw-lbl">Τύπος:</span>'
    +'<div class="mix-sw" role="tablist">'
    +'<button type="button" role="tab" aria-selected="'+(!on)+'" class="'+(!on?'on':'')+'" onclick="mixSetMode(\'daily\')">📅 Ημερήσιο πλάνο</button>'
    +'<button type="button" role="tab" aria-selected="'+on+'" class="'+(on?'on':'')+'"'+(can.ok?'':' disabled title="'+esc(can.why)+'"')+' onclick="mixSetMode(\'mix\')">🧩 Μενού επιλογών</button>'
    +'</div>';
  if(on&&plan) h+='<span class="mix-sw-note">Το ημερήσιο πλάνο δεν σβήνεται — κρύβεται όσο είσαι εδώ.</span>';
  if(!can.ok&&mixIsMinor(c)) h+='<span class="mix-sw-note">🔒 Όχι για ανήλικους</span>';
  return h;
}

// ── Αλλαγές στο μενού ──────────────────────────────────────────────────────
function mixChange(label,fn){
  var c=getC(); if(!c||!c.mixMenu) return;
  _mixUndo={label:label,menu:mixClone(c.mixMenu),cid:c.id};
  fn(c.mixMenu);
  c.mixMenu.updatedAt=new Date().toISOString();
  save();
  mixRenderEditor();
}
function mixUndoLast(){
  var c=getC(); if(!c||!_mixUndo||_mixUndo.cid!==c.id) return;
  c.mixMenu=_mixUndo.menu; _mixUndo=null; save(); mixRenderEditor();
}
function mixRoleLabel(role){ return {protein:'πρωτεΐνη',carb:'υδατάνθρακα',legume:'όσπριο'}[role]||''; }

function mixOnClick(e){
  var b=e.target.closest('[data-mx]'); if(!b) return;
  var act=b.getAttribute('data-mx'), n=b.getAttribute('data-n'), role=b.getAttribute('data-role');
  if(act==='day'){ _mixDay=+b.getAttribute('data-d'); mixRenderEditor(); return; }
  if(act==='undo'){ mixUndoLast(); return; }
  if(act==='rm'){ mixChange('Αφαιρέθηκε: '+mixFoodName(n,'el'),function(m){ m[role]=(m[role]||[]).filter(function(x){return x!==n;}); }); return; }
  if(act==='pick'){
    _mixPicker=(_mixPicker&&_mixPicker.role===role)?null:{role:role}; _mixPickQ='';
    mixRenderEditor(); var q=document.getElementById('mix-pick-q'); if(q) q.focus(); return;
  }
  if(act==='add'){ _mixPicker=null; mixChange('Προστέθηκε: '+mixFoodName(n,'el'),function(m){ (m[role]=m[role]||[]); if(m[role].indexOf(n)===-1) m[role].push(n); }); return; }
  if(act==='idea-off'){ mixChange('Κρύφτηκε μια ιδέα',function(m){ (m.ideasOff=m.ideasOff||[]).push(n); }); return; }
  if(act==='ideas-reset'){ mixChange('Επανήλθαν οι ιδέες',function(m){ m.ideasOff=[]; }); return; }
  if(act==='hide-combo'){ mixChange('Κρύφτηκε ο συνδυασμός',function(m){ (m.hiddenCombos=m.hiddenCombos||[]).push(n); }); return; }
  if(act==='combos-reset'){ mixChange('Επανήλθαν οι συνδυασμοί',function(m){ m.hiddenCombos=[]; }); return; }
  if(act==='reset-menu'){
    showConfirmDialog('Να ξαναφτιαχτεί το μενού από την αρχή (προτεινόμενα + αποκλεισμοί του πελάτη); Οι αλλαγές σου στις λίστες χάνονται (υπάρχει Αναίρεση).',function(){
      mixChange('Το μενού ξαναφτιάχτηκε',function(m){ var d=mixDefaultMenu(getC()); Object.keys(d).forEach(function(k){ if(k!=='createdAt') m[k]=d[k]; }); });
    },{title:'Νέο μενού',icon:'🧩'});
    return;
  }
}
function mixOnInput(e){
  if(e.target.id==='mix-pick-q'){
    _mixPickQ=e.target.value;
    var l=document.getElementById('mix-pick-list'); if(l&&_mixPicker) l.innerHTML=mixPickerListHtml(getC(),_mixPicker.role);
  }
}
function mixOnChange(e){
  var r=e.target.getAttribute('data-rule'); if(!r) return;
  var v=Math.max(0,Math.min(7,parseInt(e.target.value,10)||0));
  mixChange('Κανόνας εβδομάδας',function(m){ (m.rules=m.rules||{})[r]=v; });
}

// ── Ζωγραφική ──────────────────────────────────────────────────────────────
function mixMacHtml(p,c,f){
  return '<span class="mx-p">Π '+Math.round(p)+'</span> · <span class="mx-c">Υ '+Math.round(c)+'</span> · <span class="mx-f">Λ '+Math.round(f)+'</span>';
}
function mixFoodEmoji(n){
  if(n===MIX_OMELETTE.key) return '🍳';
  var fd=FOODS[n]||{}, s=normalizeGreekText(n);
  if(fd.cat==='Ψάρια') return /γαριδ|καλαμαρ|χταποδ|σουπι/.test(s)?'🦐':(/τονος|σαρδελ/.test(s)?'🥫':'🐟');
  if(fd.cat==='Κρέας') return /κοτοπουλ|γαλοπουλ|κουνελ|grillman/.test(s)?'🐔':'🥩';
  if(fd.cat==='Όσπρια') return /tofu|edamame|beyond|λουπιν/.test(s)?'🌱':'🫘';
  if(/ρυζ/.test(s)) return '🍚';
  if(/πατατ/.test(s)) return '🥔';
  if(/ψωμ|πιτα|τορτιλ/.test(s)) return '🍞';
  if(/μακαρον|σπαγγετ|κριθαρ|noodles|κους/.test(s)) return '🍝';
  if(/καλαμποκ/.test(s)) return '🌽';
  return '🌾';
}
function mixChipHtml(role,n,main,alt,extra,canRm){
  return '<span class="mx-chip"><span class="mx-chip-e">'+mixFoodEmoji(n)+'</span>'
    +'<span class="mx-chip-n">'+esc(mixFoodName(n,'el'))+'</span> <b>'+esc(main)+'</b>'
    +(alt?' <span class="mx-chip-s">('+esc(alt)+')</span>':'')
    +(extra?' <span class="mx-chip-x">'+extra+'</span>':'')
    +(canRm?'<button type="button" class="mx-chip-rm" data-mx="rm" data-role="'+role+'" data-n="'+esc(n)+'" title="Αφαίρεση από το μενού (όλες οι μέρες)" aria-label="Αφαίρεση">×</button>':'')
    +'</span>';
}
function mixPickerHtml(c,role){
  return '<div class="mx-picker"><input id="mix-pick-q" class="mx-pick-q" type="search" placeholder="Αναζήτηση '+mixRoleLabel(role)+'…" value="'+esc(_mixPickQ)+'">'
    +'<div id="mix-pick-list" class="mx-pick-list">'+mixPickerListHtml(c,role)+'</div></div>';
}
var MIX_TIER_LBL={star:'⭐ προτεινόμενο',plant:'🌱 φυτικό',more:'🔍',warn:'⚠️ οριακό'};
var MIX_DAY_LETTERS=['Δ','Τ','Τ','Π','Π','Σ','Κ'];
function mixPickerListHtml(c,role){
  var q=normalizeGreekText(_mixPickQ||'');
  var list=mixCandidates(c,role).filter(function(x){
    if(!q) return true; var fd=FOODS[x.n]||{};
    return normalizeGreekText(mixFoodName(x.n,'el')).indexOf(q)!==-1||normalizeGreekText(fd.en||'').indexOf(q)!==-1;
  });
  if(!list.length) return '<div class="mx-empty">Τίποτα άλλο διαθέσιμο.</div>';
  return list.map(function(x){
    var days=x.locked?'':(x.days.length<7?' <span class="mx-pick-days">μόνο '+x.days.map(function(d){return MIX_DAY_LETTERS[d];}).join('·')+'</span>':'');
    return '<button type="button" class="mx-pick-row'+(x.locked?' locked':'')+'"'
      +(x.locked?' disabled title="Αποκλείεται για αυτόν τον πελάτη (αλλεργία / αποκλεισμός / τύπος διατροφής)"':' data-mx="add" data-role="'+role+'" data-n="'+esc(x.n)+'"')+'>'
      +(x.locked?'🔒 ':mixFoodEmoji(x.n)+' ')+esc(mixFoodName(x.n,'el'))
      +' <span class="mx-tier mx-tier-'+x.tier+'">'+(MIX_TIER_LBL[x.tier]||'')+'</span>'+days+'</button>';
  }).join('');
}
function mixAddBtn(role){
  return '<button type="button" class="mx-chip mx-chip-add'+(_mixPicker&&_mixPicker.role===role?' on':'')+'" data-mx="pick" data-role="'+role+'">＋ '+mixRoleLabel(role)+'</button>';
}
function mixNotTodayHtml(c,ctx,role,d){
  var off=((c.mixMenu&&c.mixMenu[role])||[]).filter(function(n){ return !mixAllowed(ctx,n,d); });
  if(!off.length) return '';
  return '<div class="mx-nottoday">🔒 Όχι αυτή τη μέρα: '+off.map(function(n){return esc(mixFoodName(n,'el'));}).join(', ')+'</div>';
}
function mixMealHd(m,extra){
  return '<div class="mx-meal-hd"><span class="mx-time">'+esc(m.time)+'</span> <b>'+esc(m.name)+'</b>'
    +(m.tag?' <span class="mx-tag mx-tag-'+m.tag+'">'+esc(m.tagLabel)+'</span>':'')+(extra||'')
    +'<span class="mx-meal-mac">'+mixMacHtml(m.p,m.c,m.f)+' · '+m.k+' kcal</span></div>';
}
// first = το πρώτο κύριο γεύμα της μέρας: εκεί είναι τα κουμπιά ＋/× (οι λίστες είναι κοινές για όλα τα γεύματα)
function mixMainMealHtml(c,ctx,day,m,first){
  var h='<div class="mx-meal">'+mixMealHd(m,first?'':' <span class="mx-sub">— ίδιες λίστες, δικές του ποσότητες</span>');
  h+='<div class="mx-comp"><div class="mx-lab mx-lab-p">① Πρωτεΐνη</div><div><div class="mx-chips">'
    +m.prot.map(function(q){ return mixChipHtml('protein',q.n,q.main,q.alt,'· '+esc(day.oilOk?mixOilTxt(q.oil,'el'):m.fat.txt),first); }).join('')
    +(first?mixAddBtn('protein'):'')+'</div>'
    +(first&&_mixPicker&&_mixPicker.role==='protein'?mixPickerHtml(c,'protein'):'')
    +(first?mixNotTodayHtml(c,ctx,'protein',day.d):'')+'</div></div>';
  h+='<div class="mx-comp"><div class="mx-lab mx-lab-c">② Υδατάνθρακας</div><div><div class="mx-chips">'
    +m.carb.map(function(q){ return mixChipHtml('carb',q.n,q.main,q.alt,'',first); }).join('')
    +(first?mixAddBtn('carb'):'')+'</div>'
    +(first&&_mixPicker&&_mixPicker.role==='carb'?mixPickerHtml(c,'carb'):'')
    +(first?mixNotTodayHtml(c,ctx,'carb',day.d):'')+'</div></div>';
  h+='<div class="mx-comp"><div class="mx-lab">③ Λαχανικά · ④ Λίπος</div><div class="mx-chips">'
    +'<span class="mx-chip mx-chip-fixed">🥗 Λαχανικά / σαλάτα ≥ 200 g</span>'
    +'<span class="mx-chip mx-chip-fixed">🫒 '+(day.oilOk?'Ελαιόλαδο: όσο γράφει δίπλα στην πρωτεΐνη':esc(m.fat.txt))+'</span></div></div>';
  h+='<div class="mx-comp"><div class="mx-lab">🫘 Ή όσπρια<br><small>(αντί για ①+②)</small></div><div><div class="mx-chips">'
    +m.legumes.map(function(lp){
      var extra=[];
      if(lp.bread) extra.push('+ '+esc(lp.bread.main)+' '+esc(mixFoodName(lp.bread.n,'el').toLowerCase()));
      if(lp.add) extra.push('+ '+esc(mixFoodName(lp.add.n,'el'))+' '+esc(lp.add.main)+(lp.add.alt?' ('+esc(lp.add.alt)+')':''));
      extra.push('· '+esc(lp.fat.txt));
      if(!lp.ok.ok) extra.push('<span class="mx-warn">⚠️ kcal '+(lp.ok.kPct>0?'+':'')+lp.ok.kPct+'%</span>');
      return mixChipHtml('legume',lp.leg.n,lp.leg.main,lp.leg.alt,extra.join(' '),first);
    }).join('')
    +(first?mixAddBtn('legume'):'')+'</div>'
    +(first&&_mixPicker&&_mixPicker.role==='legume'?mixPickerHtml(c,'legume'):'')+'</div></div>';
  return h+'</div>';
}
function mixIdeasMealHtml(m){
  var B=m.slot==='breakfast';
  var h='<div class="mx-meal mx-meal-ideas">'+mixMealHd(m,' <span class="mx-sub">— έτοιμες ιδέες</span>');
  if(!m.ideas.length){
    h+='<div class="mx-empty">Δεν βρέθηκαν ιδέες που να ταιριάζουν στους αποκλεισμούς αυτής της μέρας. Πρόσθεσε ⭐ Αγαπημένα γεύματα «'+(B?'Πρωινό':'Ενδιάμεσο')+'».</div>';
  } else {
    h+='<div class="mx-ideas">'+m.ideas.slice(0,MIX_IDEAS_MAX).map(function(i){
      return '<div class="mx-idea">'+(i.src==='fav'?'<span title="Από τα Αγαπημένα γεύματα">⭐</span> ':'')
        +i.foods.map(function(f){ return esc(f.n)+' <b>'+esc(mixIdeaQty(f,'el'))+'</b>'; }).join(' + ')
        +' <span class="mx-idea-k">'+Math.round(i.tot.k)+' kcal</span>'
        +'<button type="button" class="mx-chip-rm" data-mx="idea-off" data-n="'+esc(i.key)+'" title="Να μη φαίνεται αυτή η ιδέα" aria-label="Απόκρυψη">×</button></div>';
    }).join('')+'</div>';
  }
  return h+'</div>';
}
function mixCheckHtml(w){
  var ck=w.check, hidden=(w.menu.hiddenCombos||[]).length;
  if(!ck.total) return '';
  var pct=Math.round(ck.ok/ck.total*100);
  var h='<div class="mx-check'+(ck.badList.length?' warn':'')+'"><b>🔎 Έλεγχος συνδυασμών</b> '
    +'<span>✓ '+ck.ok+' / '+ck.total+' ('+pct+'%) εντός ±10% θερμίδων με λίπος έως +20% — όλες οι μέρες, μεσημεριανό και βραδινό</span>';
  if(ck.fishOk) h+='<span class="mx-sub">🐟 Στα λιπαρά ψάρια (σολομός, σκουμπρί, σαρδέλες) το λίπος του ψαριού (ωμέγα-3) δεν μετράει ως υπέρβαση — '+ck.fishOk+' συνδυασμοί είναι εντός χάρη σε αυτό.</span>';
  if(ck.badList.length){
    // οι 3 χειρότεροι πάντα ορατοί, οι υπόλοιποι σε «δες όλους» (ανοιχτό αν ήταν ανοιχτό)
    var bad=function(b){
      var parts=[]; if(b.fPct>20) parts.push('λίπος +'+b.fPct+'%'); if(Math.abs(b.kPct)>10) parts.push('kcal '+(b.kPct>0?'+':'')+b.kPct+'%');
      return '<span class="mx-bad">'+esc(mixFoodName(b.prot,'el'))+' + '+esc(mixFoodName(b.carb,'el'))+' <small>('+parts.join(', ')+' · '+b.n+' γεύμ.)</small>'
        +'<button type="button" data-mx="hide-combo" data-n="'+esc(b.prot+'|'+b.carb)+'" title="Να μην προτείνεται αυτός ο συνδυασμός">κρύψε</button></span>';
    };
    h+='<div class="mx-check-list">⚠️ Εκτός: '+ck.badList.slice(0,3).map(bad).join('')+'</div>';
    if(ck.badList.length>3) h+='<details class="mx-check-more"'+(_mixCheckOpen?' open':'')+' ontoggle="_mixCheckOpen=this.open"><summary>Δες όλους ('+ck.badList.length+')</summary>'
      +'<div class="mx-check-list">'+ck.badList.slice(3).map(bad).join('')+'</div></details>';
  }
  if(hidden) h+='<div class="mx-check-hidden">'+hidden+' συνδυασμ'+(hidden===1?'ός κρυμμένος':'οί κρυμμένοι')+' · <button type="button" data-mx="combos-reset">επαναφορά</button></div>';
  return h+'</div>';
}
var MIX_IDEAS_MAX=6;
var _mixCheckOpen=false;
function mixRenderEditor(){
  var c=getC(), box=document.getElementById('mix-editor'); if(!c||!box||!mixIsActive(c)) return;
  var w=mixBuildWeek(c,'el');
  if(!w){ box.innerHTML='<div class="mx-empty">Συμπλήρωσε βάρος, ύψος και ηλικία για να υπολογιστούν οι στόχοι.</div>'; return; }
  if(_mixDay==null) _mixDay=mixTodayIdx();
  if(_mixUndo&&_mixUndo.cid!==c.id) _mixUndo=null;
  var day=w.days[_mixDay], ctx=mixCtx(c), menu=c.mixMenu, rules=menu.rules||{};
  var h='';
  if(_mixUndo) h+='<div class="mx-undo">'+esc(_mixUndo.label)+' · <button type="button" data-mx="undo">↩ Αναίρεση</button></div>';
  // 📱 κατάσταση του link: ξεπερασμένο (άλλαξε κάτι μετά την αποστολή) / δείχνει ακόμα ημερήσιο / ενημερωμένο
  var stale=!!(window.Cloud&&Cloud.isStale&&Cloud.isStale(c));
  h+='<div class="mx-phase'+(stale?' warn':'')+'">'+(!c.shareToken?'📱 Πάτα «Στείλε στον πελάτη»: θα βλέπει το μενού στο κινητό, με τις ποσότητες έτοιμες. Ή δώσε το <b>PDF</b> (Εξαγωγή ▾).'
    :(stale?'⚠️ Άλλαξες το μενού (ή τους στόχους) μετά την αποστολή — πάτα «Στείλε στον πελάτη» για να ενημερωθεί το link του.'
      :'📱 Ο πελάτης βλέπει αυτό το μενού στο link του.'))+'</div>';
  h+=mixCheckHtml(w);
  h+='<div class="mx-days" role="tablist">'+w.days.map(function(x){
    var tr=x.kind!=='R';
    return '<button type="button" role="tab" aria-selected="'+(x.d===_mixDay)+'" class="mx-day'+(x.d===_mixDay?' on':'')+'" data-mx="day" data-d="'+x.d+'">'
      +esc(x.short)+'<small>'+(tr?'● προπ.':'ξεκ.')+'</small></button>';
  }).join('')+'</div>';
  h+='<div class="mx-day-sub"><b>'+esc(day.label)+'</b> · '+esc(day.sub)+' · '+day.k+' kcal · '+mixMacHtml(day.p,day.c,day.f)
    +(day.oilOk?'':' · <span class="mx-warn">χωρίς λάδι σήμερα (νηστεία)</span>')+'</div>';
  var firstMain=true;
  day.meals.forEach(function(m){
    if(m.main){ h+=mixMainMealHtml(c,ctx,day,m,firstMain); firstMain=false; }
    else h+=mixIdeasMealHtml(m);
  });
  if(day.trains.length) h+='<div class="mx-train">🏃 '+day.trains.map(function(t){return esc(t.time)+' '+esc(t.name);}).join(' · ')+'</div>';
  h+='<div class="mx-rules"><b>📆 Εβδομάδα</b>'
    +'<label>🐟 Ψάρι ≥ <input type="number" min="0" max="7" data-rule="fish" value="'+(rules.fish!=null?rules.fish:2)+'"></label>'
    +'<label>🫘 Όσπρια ≥ <input type="number" min="0" max="7" data-rule="legumes" value="'+(rules.legumes!=null?rules.legumes:2)+'"></label>'
    +'<label>🥩 Κόκκινο κρέας ≤ <input type="number" min="0" max="7" data-rule="redMeatMax" value="'+(rules.redMeatMax!=null?rules.redMeatMax:2)+'"></label>'
    +'<span class="mx-sub">Μέρες προπόνησης: από τις Προπονήσεις (MET) — δεν τις ξαναγράφεις.</span></div>';
  h+='<div class="mx-foot">'+((menu.ideasOff||[]).length?'<button type="button" class="btn tertiary" data-mx="ideas-reset">Επαναφορά κρυμμένων ιδεών ('+menu.ideasOff.length+')</button>':'')
    +'<button type="button" class="btn tertiary" data-mx="reset-menu">↻ Νέο μενού από τα προτεινόμενα</button></div>';
  box.innerHTML=h;
}

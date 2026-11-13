// ── 🏠 Νοικοκυριό (ζευγάρια, αδέρφια, οικογένειες) ─────────────────────────────────────
// Χαλαρή σύνδεση 2–4 πελατών που τρώνε από την ίδια κουζίνα. Κάθε μέλος κρατά ΠΑΝΤΑ το δικό του,
// ανεξάρτητο c.weekPlan: η «↔️ Εφαρμογή σε…» αντιγράφει ένα γεύμα/μια ημέρα ΕΚΕΙΝΗ τη στιγμή
// (κλιμακωμένο στον καθένα) και μετά τα πλάνα δεν έχουν καμία σχέση μεταξύ τους. Έτσι η αποχώρηση
// ενός μέλους (χωρισμός, μετακόμιση) δεν «σπάει» τίποτα — απλώς φεύγει η ετικέτα.
//
// Πεδία πελάτη: c.householdId, c.householdName, c.kitchenToken (ίδιο σε όλα τα μέλη — link κουζίνας).
// Πεδίο γεύματος: meal.hhKey — ίδιο κλειδί στα αντίγραφα του ίδιου κοινού γεύματος· το link κουζίνας
// ομαδοποιεί με αυτό. Είναι μόνο σήμανση: δεν συγχρονίζει τίποτα.

var HH_MAX_MEMBERS=4;

function hhMembers(c){
  if(!c||!c.householdId) return [];
  return clients.filter(function(x){ return !x.deleted && x.householdId===c.householdId; })
    .sort(function(a,b){ return (a.id===c.id?-1:b.id===c.id?1:0) || String(a.name||'').localeCompare(String(b.name||''),'el'); });
}
function hhOthers(c){ return hhMembers(c).filter(function(x){ return x.id!==c.id; }); }
function hhFirstName(x){ return String((x&&x.name)||'—').trim().split(/\s+/)[0]; }
function hhSurname(x){ var p=String((x&&x.name)||'').trim().split(/\s+/); return p.length>1?p[p.length-1]:''; }

// Πελάτες που μπορούν να μπουν στο νοικοκυριό του c (όχι ήδη σε άλλο νοικοκυριό).
function hhCandidates(c){
  return clients.filter(function(x){
    return x.id!==c.id && !x.deleted && !x.archived && !x.isMealTemplate && !x.householdId;
  }).sort(function(a,b){ return String(a.name||'').localeCompare(String(b.name||''),'el'); });
}

// Ετικέτες για το πεδίο αναζήτησης· συνονόματοι ξεχωρίζουν με τηλέφωνο/email (αλλιώς #2, #3).
function hhCandLabels(cands){
  var seen={};
  cands.forEach(function(x){ var n=x.name||'—'; seen[n]=(seen[n]||0)+1; });
  var idx={};
  return cands.map(function(x){
    var n=x.name||'—', label=n;
    if(seen[n]>1){ idx[n]=(idx[n]||0)+1; label=n+' · '+(x.phone||x.email||('#'+idx[n])); }
    return {id:x.id, label:label};
  });
}
// Από το κείμενο του πεδίου → πελάτης: ακριβής ετικέτα, αλλιώς ΜΟΝΑΔΙΚΟ μερικό ταίριασμα
// (χωρίς τόνους/πεζά-κεφαλαία). Αν ταιριάζουν πολλοί, δεν μαντεύουμε.
function hhPickCandidate(inp){
  var c=getC(); if(!c||!inp) return;
  var q=normalizeGreekText(String(inp.value||'').trim()); if(!q) return;
  var opts=hhCandLabels(hhCandidates(c));
  var hit=opts.filter(function(o){ return normalizeGreekText(o.label)===q; });
  if(!hit.length) hit=opts.filter(function(o){ return normalizeGreekText(o.label).indexOf(q)>=0; });
  if(hit.length===1){ inp.value=''; hhAddMember(hit[0].id); return; }
  showErrorToast(hit.length?'Ταιριάζουν '+hit.length+' πελάτες — γράψε περισσότερα ή διάλεξε από τη λίστα.':'Δεν βρέθηκε πελάτης «'+inp.value+'» (ή ανήκει ήδη σε νοικοκυριό / είναι αρχειοθετημένος).');
}

function hhAddMember(otherId){
  var c=getC(), o=clients.find(function(x){ return x.id===otherId; });
  if(!c||!o) return;
  if(o.householdId){ showErrorToast('Ο/Η '+(o.name||'πελάτης')+' ανήκει ήδη σε άλλο νοικοκυριό.'); return; }
  if(c.householdId && hhMembers(c).length>=HH_MAX_MEMBERS){ showErrorToast('Ένα νοικοκυριό έχει έως '+HH_MAX_MEMBERS+' μέλη.'); return; }
  if(c.householdId && !hhOthers(c).length){ delete c.householdName; }   // απομεινάρι (τα άλλα μέλη διαγράφηκαν)
  if(!c.householdId) c.householdId='h'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  if(!c.householdName){
    var sn=hhSurname(c)||hhSurname(o);
    c.householdName=sn?('Οικογένεια '+sn):(hhFirstName(c)+' & '+hhFirstName(o));
  }
  o.householdId=c.householdId;
  o.householdName=c.householdName;
  if(c.kitchenToken) o.kitchenToken=c.kitchenToken;
  save();
  renderMain();
  dietoToast('🏠 '+hhFirstName(o)+' προστέθηκε στο νοικοκυριό', '#025857');
}

// Αποχώρηση: φεύγει μόνο η ετικέτα. Τα πλάνα μένουν όπως είναι· σβήνεται μόνο η σήμανση «κοινό»
// (hhKey) από τα γεύματα αυτού που φεύγει. Αν μείνει ένα μόνο μέλος, διαλύεται το νοικοκυριό.
function hhLeave(memberId){
  var m=clients.find(function(x){ return x.id===memberId; });
  if(!m||!m.householdId) return;
  var others=hhOthers(m);
  var msg='Αποχώρηση του/της '+(m.name||'πελάτη')+' από το νοικοκυριό;\n\nΤο πλάνο του/της ΔΕΝ αλλάζει. Απλώς δεν θα συνδέεται πια με '
    +(others.length?others.map(hhFirstName).join(', '):'τα υπόλοιπα μέλη')+' και δεν θα εμφανίζεται στο link κουζίνας.';
  var go=function(){
    var tok=m.kitchenToken||(others[0]&&others[0].kitchenToken);
    hhClear(m);
    if(others.length===1) hhClear(others[0]);
    // ο σύνδεσμος κουζίνας δεν πρέπει να δείχνει πια το μέλος που έφυγε
    if(tok && typeof kitchenLinkAfterLeave==='function') kitchenLinkAfterLeave(tok, others.length>=2?others:[]);
    save();
    renderMain();
    dietoToast('✂️ Η σύνδεση νοικοκυριού αφαιρέθηκε — τα πλάνα έμειναν ως είχαν', '#025857');
  };
  showConfirmDialog(msg, go, {title:'Αποχώρηση από νοικοκυριό', okLabel:'Αποχώρηση'});
}
function hhClear(x){
  delete x.householdId; delete x.householdName; delete x.kitchenToken;
  Object.keys(x.weekPlan||{}).forEach(function(d){ (x.weekPlan[d]||[]).forEach(function(meal){ if(meal) delete meal.hhKey; }); });
}

function hhRename(){
  var c=getC(); if(!c||!c.householdId) return;
  var apply=function(v){
    v=String(v||'').trim(); if(!v) return;
    hhMembers(c).forEach(function(x){ x.householdName=v; });
    save(); renderMain();
  };
  showPromptDialog('Όνομα νοικοκυριού (π.χ. Οικογένεια Παπαδοπούλου)', c.householdName||'', apply, {title:'🏠 Νοικοκυριό'});
}

// Ενότητα στα στοιχεία πελάτη (κάτω από «🏷️ Ομάδα»).
function buildHouseholdSectionHtml(c){
  var members=hhMembers(c);
  if(members.length<2) members=[];   // μόνος του (τα άλλα μέλη διαγράφηκαν) = χωρίς νοικοκυριό
  var chipCss='display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;font-size:12px;border:1px solid var(--border-light,#c5ddd8);background:var(--card-bg,#fff);color:var(--text-strong,#014545)';
  var h='<div class="fg"><div class="fgrp"><label>🏠 Νοικοκυριό <span style="color:#9fb5b0;font-weight:400;font-size:11px">(τρώνε μαζί: ζευγάρι, αδέρφια, οικογένεια)</span></label>';
  if(members.length){
    h+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px">'
      +'<b style="font-size:13px;color:var(--text-strong,#014545)">'+esc(c.householdName||'Νοικοκυριό')+'</b>'
      +'<button type="button" class="btn" style="padding:3px 8px;font-size:11px" onclick="hhRename()" title="Μετονομασία">✏️</button></div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap">';
    members.forEach(function(x){
      var me=x.id===c.id;
      h+='<span style="'+chipCss+(me?';background:var(--teal-tint,#E2EEE5);font-weight:700':'')+'">'
        +(me?esc(hhFirstName(x))+' (αυτός/ή)':'<a href="#" style="color:inherit" onclick="event.preventDefault();selectClient(\''+escJsAttr(x.id)+'\')" title="Άνοιγμα πελάτη">'+esc(x.name||'—')+'</a>')
        +'<button type="button" onclick="hhLeave(\''+escJsAttr(x.id)+'\')" title="Αποχώρηση από το νοικοκυριό (το πλάνο δεν αλλάζει)" aria-label="Αποχώρηση" style="border:none;background:none;cursor:pointer;color:#9fb5b0;font-size:12px;padding:0">✕</button></span>';
    });
    h+='</div>';
  }
  var cands=(members.length>=HH_MAX_MEMBERS)?[]:hhCandidates(c);
  if(cands.length){
    // Πεδίο αναζήτησης (native datalist): γράφεις όνομα ή επώνυμο, διαλέγεις, Enter/επιλογή = προσθήκη.
    h+='<input type="text" list="hh-cand-list" style="margin-top:8px" autocomplete="off" placeholder="🔍 '+(members.length?'Προσθήκη μέλους — γράψε όνομα ή επώνυμο…':'Σύνδεση με πελάτη — γράψε όνομα ή επώνυμο…')+'" aria-label="Αναζήτηση πελάτη για το νοικοκυριό" '
      +'onchange="hhPickCandidate(this)" onkeydown="if(event.key===\'Enter\'){event.preventDefault();hhPickCandidate(this);}">'
      +'<datalist id="hh-cand-list">'+hhCandLabels(cands).map(function(o){ return '<option value="'+esc(o.label)+'">'; }).join('')+'</datalist>';
  } else if(!members.length){
    h+='<div style="font-size:12px;color:#9fb5b0">Δεν υπάρχουν άλλοι πελάτες για σύνδεση.</div>';
  }
  if(members.length){
    h+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">'
      +'<button type="button" class="btn" style="padding:6px 10px;font-size:12px;background:#E2EEE5;color:#014545;border:1px solid #c5ddd8" onclick="openKitchenLinkModal()">🏠 Link κουζίνας</button></div>'
      +'<div style="font-size:11px;color:#9fb5b0;margin-top:6px;line-height:1.4">Κάθε μέλος έχει το δικό του πλάνο. Στο πλάνο, από το ⋮ ενός γεύματος ή μιας ημέρας: «↔️ Εφαρμογή σε…».</div>';
  }
  return h+'</div></div>';
}

// Μικρή μπάρα πάνω από τον πίνακα εβδομάδας: ποιοι είναι στο σπίτι + γρήγορη μετάβαση.
function buildHouseholdPlanBar(c){
  var others=hhOthers(c);
  if(!others.length) return '';
  return '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;margin:0 0 8px;padding:6px 10px;border-radius:8px;background:var(--teal-tint,#E2EEE5);color:var(--text-strong,#014545)">'
    +'<span>🏠 <b>'+esc(c.householdName||'Νοικοκυριό')+'</b> · τρώει μαζί με:</span>'
    +others.map(function(x){ return '<a href="#" style="color:inherit;font-weight:600" onclick="event.preventDefault();selectClient(\''+escJsAttr(x.id)+'\')">'+esc(hhFirstName(x))+'</a>'; }).join(' · ')
    +'<span style="opacity:.7">— «↔️ Εφαρμογή σε…» στο ⋮ γεύματος/ημέρας</span></div>';
}

// ── ↔️ Εφαρμογή σε άλλα μέλη ────────────────────────────────────────────────────────────

// Το αντίστοιχο γεύμα στον άλλο: ίδιο όνομα θέσης και ίδια «σειρά εμφάνισης» του ονόματος
// (2ο 'Ενδιάμεσο' → 2ο 'Ενδιάμεσο'). -1 αν δεν υπάρχει.
function hhMatchSlot(srcMeals, mi, dstMeals){
  var name=srcMeals[mi]&&srcMeals[mi].name, k=0;
  for(var i=0;i<mi;i++) if(srcMeals[i]&&srcMeals[i].name===name) k++;
  for(var j=0,seen=0;j<(dstMeals||[]).length;j++){
    if(dstMeals[j]&&dstMeals[j].name===name){ if(seen===k) return j; seen++; }
  }
  return -1;
}
function hhMealKcal(meal){
  var k=0; (meal&&meal.foods||[]).forEach(function(f){ k+=cm(f.n,f.g).k||0; }); return k;
}
function hhDayTarget(x,d){
  try{ var t=calcTDEE(x), eff=getDayTgtEff(x,t); return (eff&&eff[d]&&eff[d].k)||t.target||0; }catch(e){ return 0; }
}
// Λόγος κλίμακας: τόσο όσο ήταν το γεύμα που αντικαθίσταται στον άλλον (κρατά την κατανομή
// θερμίδων της ημέρας του)· αν η θέση ήταν άδεια, ο λόγος των ημερήσιων στόχων.
function hhRatio(src, srcMeal, dst, dstMeal, d){
  var sk=hhMealKcal(srcMeal), dk=hhMealKcal(dstMeal), r;
  if(sk>0 && dk>0) r=dk/sk;
  else { var st=hhDayTarget(src,d), dt=hhDayTarget(dst,d); r=(st>0&&dt>0)?dt/st:1; }
  return Math.max(0.4, Math.min(2.5, r));
}
function hhScaledMeal(srcMeal, dstMeal, r, key){
  var m=deepClone(srcMeal);
  m.name=dstMeal?dstMeal.name:srcMeal.name;
  if(dstMeal&&dstMeal.mealTiming) m.mealTiming=dstMeal.mealTiming;
  m.foods=(srcMeal.foods||[]).map(function(f){
    var o=deepClone(f);
    if(f.n!==FREE_MEAL_MARKER) o.g=scaledG(f.n,f.g,r);
    return o;
  });
  m.hhKey=key;
  return m;
}

// Τρόφιμα του γεύματος που ο άλλος δεν τρώει (αποκλεισμοί, αλλεργίες, χορτοφαγία/vegan).
function hhConflicts(x, foods){
  var exNorm=(typeof buildEffectiveExclusionList==='function'?buildEffectiveExclusionList(x):[]).map(function(s){ return normalizeGreekText(s); });
  var alg=(typeof clientAllergenChecker==='function')?clientAllergenChecker(x):function(){ return null; };
  var dietBan={};
  if(x.dietType && !/fast/.test(x.dietType) && typeof dietAutoExcludedFoods==='function') dietAutoExcludedFoods(x.dietType).forEach(function(n){ dietBan[n]=1; });
  var out=[];
  (foods||[]).forEach(function(f){
    if(!f||!f.n||out.indexOf(f.n)>-1) return;
    if(alg(f.n) || dietBan[f.n] || foodIsExcludedByNameOrIngredient(f.n, exNorm)) out.push(f.n);
  });
  return out;
}

// mode: 'meal' (d,mi) ή 'day' (d). Ανοίγει μικρό παράθυρο επιλογής μελών.
function openHouseholdApply(mode, d, mi){
  var c=getC(); if(!c) return;
  var others=hhOthers(c);
  if(!others.length){
    showErrorToast('Ο/Η '+(c.name||'πελάτης')+' δεν ανήκει σε νοικοκυριό. Σύνδεσέ τον/την με άλλο πελάτη από τα στοιχεία του (🏠 Νοικοκυριό).');
    return;
  }
  var srcMeals=c.weekPlan[d]||[];
  var meals=mode==='meal'?[srcMeals[mi]]:srcMeals;
  var foods=[]; meals.forEach(function(m){ (m&&m.foods||[]).forEach(function(f){ foods.push(f); }); });
  if(!foods.length){ showErrorToast('Το γεύμα είναι άδειο.'); return; }
  var what=mode==='meal'?('«'+srcMeals[mi].name+'» της '+DAYS[d]):('όλη την '+DAYS[d]);
  var rows=others.map(function(x){
    var conf=hhConflicts(x, foods), hasPlan=x.weekPlan&&x.weekPlan[d]&&x.weekPlan[d].length;
    var slotMissing=hasPlan&&mode==='meal'&&hhMatchSlot(srcMeals,mi,x.weekPlan[d])<0;
    var note=!hasPlan?'<div style="font-size:11px;color:#c0392b">Δεν έχει ακόμη πλάνο — φτιάξε πρώτα το δικό του.</div>'
      :slotMissing?'<div style="font-size:11px;color:#c0392b">Δεν έχει γεύμα «'+esc(srcMeals[mi].name)+'» εκείνη τη μέρα.</div>'
      :conf.length?'<div style="font-size:11px;color:#e08a00">⚠️ Δεν τρώει: '+esc(conf.join(', '))+'</div>':'';
    var ok=hasPlan&&!slotMissing;
    return '<label style="display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #eef4f2;cursor:'+(ok?'pointer':'default')+'">'
      +'<input type="checkbox" class="hh-apply-cb" value="'+esc(x.id)+'"'+(ok&&!conf.length?' checked':'')+(ok?'':' disabled')+' style="margin-top:3px">'
      +'<div><div style="font-weight:600">'+esc(x.name||'—')+'</div>'+note+'</div></label>';
  }).join('');
  var ov=document.getElementById('hh-apply-overlay'); if(ov) ov.remove();
  ov=document.createElement('div');
  ov.id='hh-apply-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML='<div style="background:var(--card-bg,#fff);border-radius:16px;max-width:440px;width:100%;padding:20px;box-shadow:0 10px 40px rgba(0,0,0,.25);max-height:90vh;overflow-y:auto">'
    +'<div style="font-size:17px;font-weight:700;color:#014545;margin-bottom:4px">↔️ Εφαρμογή σε μέλη νοικοκυριού</div>'
    +'<div style="font-size:13px;color:#5a8a82;margin-bottom:10px">Αντιγράφει '+esc(what)+' με <b>τα ίδια τρόφιμα</b> και ποσότητες προσαρμοσμένες στον καθένα. Μετά τα πλάνα μένουν ανεξάρτητα.</div>'
    +rows
    +(mode==='meal'?'<label style="display:flex;gap:8px;align-items:center;font-size:12px;margin-top:10px;cursor:pointer"><input type="checkbox" id="hh-apply-week"> Και στις άλλες ημέρες, όπου το «'+esc(srcMeals[mi].name)+'» είναι κοινό;</label>'
      +'<div style="font-size:11px;color:#9fb5b0;margin:2px 0 0 22px">Αντιγράφει το «'+esc(srcMeals[mi].name)+'» κάθε ημέρας του/της '+esc(hhFirstName(c))+' στην ίδια ημέρα των άλλων. Όπου υπάρχει τρόφιμο που κάποιος δεν τρώει, εκείνη η ημέρα παραλείπεται γι\' αυτόν.</div>':'')
    +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">'
    +'<button class="btn" onclick="document.getElementById(\'hh-apply-overlay\').remove()">Άκυρο</button>'
    +'<button class="btn" style="background:#025857;color:#fff;border:1px solid #025857" onclick="confirmHouseholdApply(\''+mode+'\','+d+','+(mi==null?-1:mi)+')">Εφαρμογή</button></div></div>';
  document.body.appendChild(ov);
}

function confirmHouseholdApply(mode, d, mi){
  var c=getC(); if(!c) return;
  var ids=[].slice.call(document.querySelectorAll('.hh-apply-cb:checked')).map(function(cb){ return cb.value; });
  var weekEl=document.getElementById('hh-apply-week'), wholeWeek=!!(weekEl&&weekEl.checked);
  var ov=document.getElementById('hh-apply-overlay'); if(ov) ov.remove();
  if(!ids.length){ showErrorToast('Δεν επιλέχθηκε κανένα μέλος.'); return; }
  var targets=ids.map(function(id){ return clients.find(function(x){ return x.id===id; }); }).filter(Boolean);
  var before={}; targets.forEach(function(x){ before[x.id]=deepClone(x.weekPlan); });
  var srcBefore=deepClone(c.weekPlan);
  var days=(mode==='meal'&&wholeWeek)?[0,1,2,3,4,5,6]:[d];
  var done=0, skipped=[];
  days.forEach(function(dd){
    var src=c.weekPlan[dd]||[];
    var idxs=mode==='day'?src.map(function(_,i){ return i; }):(dd===d?[mi]:(function(){ var j=hhMatchSlot(c.weekPlan[d],mi,src); return j>=0?[j]:[]; })());
    idxs.forEach(function(si){
      var sm=src[si]; if(!sm||!sm.foods||!sm.foods.length) return;
      var key=sm.hhKey||('k'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
      var applied=false;
      targets.forEach(function(x){
        var dm=x.weekPlan&&x.weekPlan[dd]; if(!dm||!dm.length){ skipped.push(hhFirstName(x)+' ('+DAYS[dd]+')'); return; }
        var ti=hhMatchSlot(src,si,dm); if(ti<0){ skipped.push(hhFirstName(x)+' ('+DAYS[dd]+' '+sm.name+')'); return; }
        // Στις υπόλοιπες ημέρες (όχι αυτή που είδε στο παράθυρο) ποτέ σιωπηλή αντιγραφή τροφίμου που δεν τρώει.
        if(dd!==d){ var cf=hhConflicts(x, sm.foods); if(cf.length){ skipped.push(hhFirstName(x)+' ('+DAYS[dd]+': '+cf.join(', ')+')'); return; } }
        dm[ti]=hhScaledMeal(sm, dm[ti], hhRatio(c,sm,x,dm[ti],dd), key);
        applied=true; done++;
      });
      if(applied) sm.hhKey=key;
    });
  });
  if(!done){ showErrorToast('Δεν εφαρμόστηκε πουθενά.'+(skipped.length?'\nΧωρίς αντίστοιχο γεύμα: '+skipped.join(', '):'')); return; }
  save();
  renderWeekTable();
  hhShowUndoToast(c.id, srcBefore, before, done, targets, skipped);
}

function hhShowUndoToast(srcId, srcBefore, before, done, targets, skipped){
  var t=document.getElementById('hh-undo-toast'); if(t) t.remove();
  t=document.createElement('div');
  t.id='hh-undo-toast';
  t.style.cssText='position:fixed;bottom:20px;right:20px;background:#025857;color:#fff;padding:10px 10px 10px 16px;border-radius:8px;font-size:12px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px;max-width:380px';
  t.innerHTML='<span>✓ Εφαρμόστηκε σε '+esc(targets.map(hhFirstName).join(', '))+' ('+done+(done===1?' γεύμα':' γεύματα')+')'
    +(skipped.length?'<br><span style="opacity:.85">Παραλείφθηκαν: '+esc(skipped.join(', '))+'</span>':'')
    +'<br><span style="opacity:.85">Αν θες, πάτα ⚖️ στο πλάνο τους για ακριβή στόχους.</span></span>'
    +'<button style="background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.4);color:#fff;border-radius:6px;padding:4px 10px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0">↩ Αναίρεση</button>';
  document.body.appendChild(t);
  var timer=setTimeout(function(){ t.remove(); },10000);
  t.querySelector('button').onclick=function(){
    clearTimeout(timer);
    Object.keys(before).forEach(function(id){ var x=clients.find(function(y){ return y.id===id; }); if(x) x.weekPlan=before[id]; });
    var s=clients.find(function(y){ return y.id===srcId; }); if(s) s.weekPlan=srcBefore;
    save(); renderWeekTable(); t.remove();
    dietoToast('↩ Η εφαρμογή αναιρέθηκε');
  };
}

// «Όχι πια κοινό»: σβήνει τη σήμανση από όλα τα αντίγραφα (τα τρόφιμα δεν αλλάζουν).
function hhUnshareMeal(d, mi){
  var c=getC(); var m=c&&c.weekPlan[d]&&c.weekPlan[d][mi]; if(!m||!m.hhKey) return;
  var key=m.hhKey;
  hhMembers(c).concat([c]).forEach(function(x){
    (x.weekPlan&&x.weekPlan[d]||[]).forEach(function(mm){ if(mm&&mm.hhKey===key) delete mm.hhKey; });
  });
  save(); renderWeekTable();
  dietoToast('Το γεύμα δεν είναι πια κοινό (τα τρόφιμα έμειναν ίδια)');
}
// Κοινό = το ίδιο κλειδί υπάρχει ΤΗΝ ΙΔΙΑ ΗΜΕΡΑ και σε άλλο μέλος. Η «Αντιγραφή σε άλλες ημέρες»,
// η «Ανταλλαγή ημέρας» και το σύρσιμο γεύματος αντιγράφουν/μετακινούν και το hhKey· χωρίς τον
// έλεγχο ημέρας, ένα γεύμα που οι άλλοι τρώνε Δευτέρα θα έδειχνε «Κοινό» και την Παρασκευή.
function hhIsShared(c, meal, d){
  if(!meal||!meal.hhKey||!c||!c.householdId) return false;
  return hhOthers(c).some(function(x){
    return (x.weekPlan&&x.weekPlan[d]||[]).some(function(mm){ return mm&&mm.hhKey===meal.hhKey; });
  });
}

// ── 🔍 Αυτόματη εύρεση ίδιων γευμάτων ───────────────────────────────────────────────────
// Όταν τα πλάνα φτιάχτηκαν χωριστά (όχι με «Εφαρμογή σε…»), τα ίδια γεύματα δεν έχουν hhKey.
// Ίδιο = ίδια ημέρα, ίδια θέση (όνομα + σειρά, όπως hhMatchSlot), ίδιο ΣΥΝΟΛΟ τροφίμων· τα γραμμάρια
// μπορεί να διαφέρουν. «Σχεδόν ίδιο» = διαφέρουν το πολύ κατά 1 τρόφιμο σε κάθε πλευρά, με τα μισά
// τουλάχιστον κοινά. Η σήμανση βάζει ΜΟΝΟ hhKey — δεν αλλάζει ποτέ τρόφιμα ή γραμμάρια.
function _hhMealNames(meal){
  var out=[];
  (meal&&meal.foods||[]).forEach(function(f){ if(f&&f.n&&f.n!==FREE_MEAL_MARKER&&f.g>0&&out.indexOf(f.n)<0) out.push(f.n); });
  return out;
}
function _hhGrams(meal, n){
  var s=0; (meal.foods||[]).forEach(function(f){ if(f&&f.n===n&&f.g>0) s+=f.g; }); return Math.round(s);
}
function _hhAllSameKey(list){
  var k=list[0].meal.hhKey;
  return !!k && list.every(function(e){ return e.meal.hhKey===k; });
}
function _hhNear(a, b){
  var common=a.filter(function(n){ return b.indexOf(n)>=0; }).length;
  var ea=a.length-common, eb=b.length-common;
  return common>=1 && ea<=1 && eb<=1 && (ea+eb)>=1 && common*2>=Math.max(a.length,b.length);
}
function hhFindSameMeals(c){
  var res={exact:[], near:[]};
  var members=hhMembers(c).filter(function(x){ return x.weekPlan&&Object.keys(x.weekPlan).length; });
  if(members.length<2) return res;
  var mkRow=function(d, list, exact){
    var anchor=list[0].names;
    var common=anchor.filter(function(n){ return list.every(function(e){ return e.names.indexOf(n)>=0; }); });
    return {
      d:d, slot:list[0].meal.name||'', exact:exact,
      names:common,
      refs:list.map(function(e){
        return {id:e.x.id, mi:e.mi, who:hhFirstName(e.x),
          grams:common.map(function(n){ return _hhGrams(e.meal,n); }),
          extra:e.names.filter(function(n){ return common.indexOf(n)<0; }).map(function(n){ return {n:n, g:_hhGrams(e.meal,n)}; })};
      })
    };
  };
  for(var d=0; d<7; d++){
    var slots={}, sOrder=[];
    members.forEach(function(x){
      var cnt={};
      (x.weekPlan[d]||[]).forEach(function(meal, mi){
        if(!meal) return;
        var nm=meal.name||'', occ=cnt[nm]||0; cnt[nm]=occ+1;
        var names=_hhMealNames(meal); if(!names.length) return;
        var k=nm+'#'+occ;
        if(!slots[k]){ slots[k]=[]; sOrder.push(k); }
        slots[k].push({x:x, mi:mi, meal:meal, names:names, sig:names.slice().sort().join('|')});
      });
    });
    sOrder.forEach(function(k){
      var groups=[], bySig={};
      slots[k].forEach(function(e){
        if(!(e.sig in bySig)){ bySig[e.sig]=groups.length; groups.push([]); }
        groups[bySig[e.sig]].push(e);
      });
      groups.forEach(function(g){ if(g.length>=2 && !_hhAllSameKey(g)) res.exact.push(mkRow(d,g,true)); });
      for(var i=0;i<groups.length;i++) for(var j=i+1;j<groups.length;j++){
        var all=groups[i].concat(groups[j]);
        if(_hhNear(groups[i][0].names, groups[j][0].names) && !_hhAllSameKey(all)) res.near.push(mkRow(d,all,false));
      }
    });
  }
  return res;
}
// Βάζει κοινό hhKey στα γεύματα κάθε σειράς. Επιστρέφει λίστα αναίρεσης [{id,d,mi,prev}].
// Αν δύο σειρές αγγίζουν το ίδιο γεύμα, ενώνονται σε ένα κλειδί (ποτέ μισό-κοινό πιάτο).
function hhMarkSameMeals(rows){
  var undo=[], touched={};   // "id|d|mi" → κλειδί που μπήκε σε αυτό το πέρασμα
  var mealOf=function(r){ var x=clients.find(function(y){ return y.id===r.id; }); return x&&x.weekPlan&&x.weekPlan[r.d]&&x.weekPlan[r.d][r.mi]; };
  rows.forEach(function(row){
    var refs=row.refs.map(function(r){ return {id:r.id, d:row.d, mi:r.mi}; }).filter(function(r){ return mealOf(r); });
    if(refs.length<2) return;
    var runKeys=[];
    refs.forEach(function(r){ var k=touched[r.id+'|'+r.d+'|'+r.mi]; if(k&&runKeys.indexOf(k)<0) runKeys.push(k); });
    var key=runKeys[0]||('k'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
    // ένωση: ό,τι πήρε άλλο κλειδί σε αυτό το πέρασμα και ανήκει σε αυτή τη σειρά → ίδιο κλειδί
    Object.keys(touched).forEach(function(t){
      if(runKeys.indexOf(touched[t])>0){ var p=t.split('|'), m=mealOf({id:p[0],d:+p[1],mi:+p[2]}); if(m){ m.hhKey=key; touched[t]=key; } }
    });
    refs.forEach(function(r){
      var t=r.id+'|'+r.d+'|'+r.mi, m=mealOf(r);
      if(!(t in touched)) undo.push({id:r.id, d:r.d, mi:r.mi, prev:m.hhKey});
      m.hhKey=key; touched[t]=key;
    });
  });
  return undo;
}
function hhUndoMarkSameMeals(undo){
  (undo||[]).forEach(function(u){
    var x=clients.find(function(y){ return y.id===u.id; }), m=x&&x.weekPlan&&x.weekPlan[u.d]&&x.weekPlan[u.d][u.mi];
    if(!m) return;
    if(u.prev) m.hhKey=u.prev; else delete m.hhKey;
  });
}

// Διαγραφή πελάτη (κάδος): κρατά το householdId του διαγραμμένου (αν γίνει ανάκτηση, ξαναμπαίνει),
// αλλά το link κουζίνας δεν πρέπει να τον δείχνει: ξαναδημοσιεύεται χωρίς αυτόν ή λήγει αν μένει
// ένα μόνο μέλος. Καλείται από deleteClient() και DeleteClientCommand.execute().
function hhAfterMemberRemoved(x){
  if(!x||!x.householdId) return;
  var rest=clients.filter(function(y){ return !y.deleted && y.householdId===x.householdId; });
  var tok=x.kitchenToken||(rest.filter(function(y){ return y.kitchenToken; })[0]||{}).kitchenToken;
  if(tok && typeof kitchenLinkAfterLeave==='function') kitchenLinkAfterLeave(tok, rest.length>=2?rest:[]);
}

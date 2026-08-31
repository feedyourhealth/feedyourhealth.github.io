// js/client-editor/form-controls.js
// The client editor's form plumbing + the remaining editor helpers, extracted
// verbatim from js/app-part2.js (module split wave 30): buildInsightsPanelHtml,
// setDietType/setMacroPreset/setMacroCustom, buildClientProgressHtml; the day-target
// setters (setDayMacro/setTrainDay/setTrainHours/setTrainTime/setCarbBoost/setEventDate/
// resetDayTargets), match-day setters (setMatchDay/setMatchTimeBucket), excludeSupp,
// renderSuppNotes, setupFormEventListeners, TAB_APPOINTMENTS, swTab, updateDayTargetTable,
// setActivityFactor/setGoalCalories/applyGoalMacros, commitBirthdate/updateAgeDisplay,
// section-collapse (getSecState/toggleSec/isFoodLibCollapsed/toggleFoodLib) and the
// validation error-scroll (SEC_FOR_ERROR/FIELD_ID_FOR_ERROR/scrollToAndHighlightField/
// revealSectionsForErrors), plus upd(). Pure fn declarations + literal tables. Every
// caller (onclick strings, app-part1/5, core/state.js's typeof-guarded hooks,
// plan-gen/*) is runtime. Loads in the client-editor/ group after day-targets.js.

// ✅ Single consolidated findings panel — replaces 3 separately-colored, separately-styled boxes
// (RED-S/energy availability, TDEE double-counting/macro warnings, creatine tip) that all read as
// equally urgent. Now one severity dot per row (red=risk, amber=borderline, purple=info-only tip),
// so the actually-serious item is the one that stands out instead of everything shouting at once.
function buildInsightsPanelHtml(c,t){
  var items=[];

  // RED-S / energy availability — thresholds per IOC Consensus Statement on RED-S (2018):
  // EA<30 kcal/kgLBM/day = critical, <45 = borderline. Nothing shown when healthy/unmeasurable.
  // ✅ 2026-08-01: "RED-S" is athlete-specific IOC terminology (Relative Energy Deficiency in
  // SPORT) — for a client with no c.sport, use the generic "χαμηλή ενεργειακή διαθεσιμότητα"
  // wording and drop the sport-specific IOC citation link (same threshold, different label).
  if(t.ea!=null && t.ea<45){
    var isCrit=t.ea<30;
    var isAthlete=!!c.sport;
    var eaLabel=isAthlete
      ?(isCrit?'🔴 Κίνδυνος RED-S':'🟡 Οριακή Ενεργειακή Διαθεσιμότητα')
      :(isCrit?'🔴 Χαμηλή ενεργειακή διαθεσιμότητα':'🟡 Οριακή ενεργειακή πρόσληψη');
    items.push({sev:isCrit?'bad':'warn', text:
      '<b>'+eaLabel+':</b> EA='+t.ea+' kcal/kgLBM ('+(isCrit?'κατώφλι &lt;30':'στόχος &gt;45')+')'
      +(isAthlete?(' <a href="https://stillmed.olympics.com/media/Documents/Athletes/Medical-Scientific/Consensus-Statements/REDs/IOC-consensus-statement-Relative-Energy-Deficiency-in-Sport-2018.pdf" target="_blank" style="color:inherit;text-decoration:underline">IOC Consensus 2018 ↗</a>'):'')
    });
  }

  // General TDEE/macro warnings computed by calcTDEE() (e.g. double-counting risk, protein out of range).
  (t.warnings||[]).forEach(function(w){
    items.push({sev:w.type==='alert'?'bad':'warn', text:esc(w.msg)});
  });

  // Creatine tip — informational only, never a risk, so it's always the lowest-severity row.
  var creatineRelevant=(c.sport && CREATINE_SUGGESTED_SPORTS[c.sport]) || c.dietType==='bodybuilding_clean';
  if(creatineRelevant){
    items.push({sev:'info', text:
      '<b>💊 Κρεατίνη:</b> 3-5g/ημέρα κρεατίνη μονοϋδρική — από τα πιο μελετημένα συμπληρώματα για δύναμη/όγκο, ασφαλές σε μακροχρόνια χρήση.'
      +' <a href="https://link.springer.com/article/10.1186/s12970-017-0173-z" target="_blank" style="color:inherit;text-decoration:underline">ISSN Position Stand 2017 ↗</a>'
    });
  }

  if(!items.length) return '';

  var sevColor={bad:'#c62828',warn:'#f9a825',info:'#6a1b9a'};
  var rowsHtml=items.map(function(it,i){
    var borderStyle=(i<items.length-1)?'border-bottom:1px solid #eee;':'';
    return '<div style="display:flex;gap:8px;align-items:flex-start;padding:8px 10px;'+borderStyle+'font-size:12px;color:var(--text-strong)">'
      +'<span style="flex-shrink:0;width:8px;height:8px;border-radius:50%;margin-top:4px;background:'+sevColor[it.sev]+'"></span>'
      +'<span style="flex:1">'+it.text+'</span>'
      +'</div>';
  }).join('');

  return '<div style="margin-top:10px;border:1px solid var(--border-light);border-radius:8px;overflow:hidden;background:var(--card-bg)">'
    +'<div style="padding:8px 10px;background:#f7f7f7;font-size:11px;font-weight:700;color:#555">📋 '+items.length+' εύρημα'+(items.length>1?'τα':'')+' σε αυτό το πλάνο</div>'
    +rowsHtml
    +'</div>';
}

function setDietType(dtype){
  var c=getC();if(!c)return;
  c.dietType=dtype;
  // If keto is selected, automatically set keto macros (Π25/Λ60/Υ15)
  if(dtype==='keto'){
    c.macroPreset='custom';
    c.macroP=25;
    c.macroF=60;
    c.macroC=15;
  }
  save();
  onClientChange();
}
function setMacroPreset(k){
  var c=getC();if(!c)return;
  var pr=MACRO_PRESETS[k];if(!pr)return;
  c.macroPreset=k;
  c._macroPresetManual=true;  // real dietitian click — protects this choice from applyGoalMacros()'s smart default
  c.macroP=pr.p;c.macroF=pr.f;c.macroC=pr.c;
  save();
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

function setMacroCustom(key,val){
  var c=getC();if(!c)return;
  var v=Math.max(5,Math.min(80,parseInt(val)||25));
  // Rescale the other two fields so all three always sum to exactly 100 — otherwise
  // calcTDEE's carb-as-remainder math ((target-protein-fat)/4) can go negative when
  // protein+fat alone already exceed 100% (e.g. 50%+60%), corrupting the whole plan.
  var cur={p:c.macroP!=null?c.macroP:25,f:c.macroF!=null?c.macroF:25,c:c.macroC!=null?c.macroC:50};
  cur[key]=v;
  var otherKeys=['p','f','c'].filter(function(k){return k!==key;});
  var remaining=100-v;
  var otherSum=cur[otherKeys[0]]+cur[otherKeys[1]];
  if(otherSum<=0){
    cur[otherKeys[0]]=Math.round(remaining/2);
  } else {
    cur[otherKeys[0]]=Math.round(remaining*cur[otherKeys[0]]/otherSum);
  }
  cur[otherKeys[1]]=remaining-cur[otherKeys[0]];
  c.macroP=cur.p;c.macroF=cur.f;c.macroC=cur.c;
  save();
  // Trigger update to recalculate TDEE and update table
  upd('macroP',c.macroP);
  upd('macroF',c.macroF);
  upd('macroC',c.macroC);
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

// Πρόοδος πελάτη από το portal (checkins που στέλνει το plan.html στο Supabase).
function buildClientProgressHtml(c){
  if(!c.shareToken) return '';
  var rows=(window.Cloud&&window.Cloud.checkinsFor)?window.Cloud.checkinsFor(c):[];
  if(!rows.length){
    return '<div class="tracker-section"><div class="tracker-head">📲 Πρόοδος πελάτη (portal)</div>'
      +'<div style="font-size:12px;color:#888;padding:6px 0">Ο πελάτης δεν έχει κάνει ακόμα check-in στο πλάνο του.</div></div>';
  }
  var byDate=ckRowsByDate(rows);
  var score=ckWeekScore(byDate,0);
  var streak=ckStreak(byDate);
  var st=ckPillarStats(ckWeekDates(0).map(function(k){return byDate[k];}).filter(Boolean));
  var gap=ckDaysSinceLast(rows);
  var lastTxt=gap===0?'σήμερα':gap===1?'χθες':gap+' μέρες πριν';

  function bar(label,done,tot){
    if(!tot) return '';
    var pct=Math.round(done/tot*100);
    return '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px"><span>'+label+'</span><span style="color:#6B756F">'+done+'/'+tot+' μέρες</span></div>'
      +'<div style="height:6px;border-radius:3px;background:#E2EEE5;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:#0F6E56"></div></div></div>';
  }
  var hist='';
  for(var w=-3; w<=0; w++){
    var ws=ckWeekScore(byDate,w);
    var hh=ws==null?4:Math.max(4,Math.round(ws*0.28));
    hist+='<div style="width:14px;height:'+hh+'px;background:'+(ws==null?'#E2EEE5':(ws>=85?'#0F6E56':ws>=60?'#5DCAA5':'#9FE1CB'))+';border-radius:2px" title="Εβδ. '+(w+4)+': '+(ws==null?'—':ws+'%')+'"></div>';
  }

  return '<div class="tracker-section">'
    +'<div class="tracker-head" style="margin-bottom:10px">📲 Πρόοδος πελάτη (portal)</div>'
    +'<div style="display:flex;gap:18px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
    +'<div style="font-size:13px"><b style="font-size:20px;color:#025857">'+(score==null?'—':score+'%')+'</b> σκορ εβδομάδας</div>'
    +'<div style="font-size:13px">🔥 <b>'+streak+'</b> μέρες σερί</div>'
    +'<div style="font-size:12px;color:#888">Τελευταίο check-in: '+lastTxt+'</div>'
    +'</div>'
    +bar('Διατροφή',st.dietDone,st.dietTot)
    +bar('Νερό',st.watDone,st.watTot)
    +bar('Συμπληρώματα',st.supDone,st.supTot)
    +'<div style="display:flex;align-items:center;gap:8px;margin-top:10px"><span style="font-size:11px;color:#888">4 εβδ.:</span><div style="display:flex;gap:4px;align-items:flex-end;height:28px">'+hist+'</div></div>'
    +'</div>';
}

function setDayMacro(key,d,v){
  var c=getC();if(!c)return;
  var t=calcTDEE(c);
  if(!c.dayTargets||typeof c.dayTargets[0]==='number')c.dayTargets=getDayTgtEff(c,t);
  var val=parseFloat(v)||0;
  if(key==='k')val=Math.max(500,Math.min(6000,val||t.target));
  c.dayTargets[d][key]=val;
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

function setTrainDay(d,isT){
  var c=getC();if(!c)return;
  if(!c.trainDays)c.trainDays=[false,false,false,false,false,false,false];
  c.trainDays[d]=isT;
  // Sync hours: when marking as T restore default hours; when R set to 0
  if(!c.trainHoursByDay)c.trainHoursByDay=[1,1,1,1,1,1,1];
  if(isT&&c.trainHoursByDay[d]===0)c.trainHoursByDay[d]=c.trainHoursPerDay||1;
  if(!isT)c.trainHoursByDay[d]=0;
  var t=calcTDEE(c);
  if(!c.dayTargets||typeof c.dayTargets[0]==='number')c.dayTargets=makeDayTgtDefaults(c,t);
  // Recalculate this day using per-day hours
  var baseHrs=c.trainHoursPerDay||1;
  var dayHrs=c.trainHoursByDay[d];
  var hScale=(isT&&baseHrs>0)?(dayHrs/baseHrs):0;
  var boost=(c.carbBoost!=null?c.carbBoost:20)/100;
  var extraC=isT?Math.round(t.carb*boost*hScale):0;
  var dayKcal=t.usedMET?Math.round(t.restTarget+(t.trainTarget-t.restTarget)*hScale):t.target;
  c.dayTargets[d].c=t.carb+extraC;
  c.dayTargets[d].k=dayKcal+extraC*4;
  var kinp=document.getElementById('dt-k-'+d);if(kinp)kinp.value=c.dayTargets[d].k;
  var cinp=document.getElementById('dt-c-'+d);if(cinp)cinp.value=c.dayTargets[d].c;
  // Update hours input appearance
  var hInp=document.getElementById('hrs-'+d);
  if(hInp){hInp.value=c.trainHoursByDay[d];hInp.className='dt-inp hrs-inp '+(isT?'hrs-t':'hrs-r');}
  // Update time input appearance and enable/disable
  var tInp=document.getElementById('time-'+d);
  if(tInp){tInp.disabled=!isT;tInp.className='dt-inp time-inp '+(isT?'time-t':'time-r');}
  save();
  upd('trainDays',c.trainDays);
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}

function setTrainHours(d,v){
  var c=getC();if(!c)return;
  if(!c.trainHoursByDay)c.trainHoursByDay=[1,1,1,1,1,1,1];
  var hrs=Math.max(0,Math.min(8,parseFloat(v)||0));
  c.trainHoursByDay[d]=hrs;
  save();
  upd('trainHoursByDay',c.trainHoursByDay);
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}
function setTrainTime(d,v){
  var c=getC();if(!c)return;
  if(!c.trainTimesByDay)c.trainTimesByDay=['','','','','','',''];
  c.trainTimesByDay[d]=(v||'');
  save();
  upd('trainTimesByDay',c.trainTimesByDay);
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION (updates meal timing guide)
}
function setCarbBoost(v){
  var c=getC();if(!c)return;
  var val=parseInt(v);c.carbBoost=Math.max(0,Math.min(60,isNaN(val)?20:val));
  upd('carbBoost',c.carbBoost);
  // If no custom targets, let defaults recompute
  if(c.dayTargets)c.dayTargets=null;
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION
}
function setEventDate(v){
  var c=getC();if(!c)return;
  c.eventDate=v||null;
  if(c.dayTargets)c.dayTargets=null;
  onClientChange();  // ← TRIGGER CASCADE RECALCULATION (re-applies/clears carb-loading window)
}
function resetDayTargets(){
  var c=getC();if(!c)return;
  c.dayTargets=null;
  renderMain();
}
// Ημέρα αγώνα: ανεξάρτητο σημαδάκι από το trainDays — δεν επηρεάζει θερμίδες/macros, γι' αυτό
// εδώ γίνεται μόνο save()+renderMain() (χωρίς onClientChange, που θα ξανάτρεχε το TDEE cascade).
function setMatchDay(d,isM){
  var c=getC();if(!c)return;
  if(!c.matchDays)c.matchDays=[false,false,false,false,false,false,false];
  c.matchDays[d]=isM;
  save();
  upd('matchDays',c.matchDays);
  renderMain();
}
function setMatchTimeBucket(bucket){
  var c=getC();if(!c)return;
  c.matchTimeBucket=bucket;
  save();
  upd('matchTimeBucket',bucket);
  renderMain();
}

function excludeSupp(id,timing){
  var c=getC();if(!c)return;
  if(!c.suppExclude)c.suppExclude=[];
  var key=id+'|'+timing;
  var idx=c.suppExclude.indexOf(key);
  if(idx>-1)c.suppExclude.splice(idx,1);
  else c.suppExclude.push(key);
  renderSuppNotes();
}

function renderSuppNotes(){
  var c=getC();
  var el=document.getElementById('supp-notes');
  if(!el)return;
  if(!c||!c.supps||!c.supps.length){el.innerHTML='';return;}
  if(!c.suppExclude)c.suppExclude=[];
  var byTiming={};
  SUPP_TIMINGS.forEach(function(t){byTiming[t]=[];});
  c.supps.forEach(function(id){
    var s=null;SUPPS.forEach(function(x){if(x.id===id)s=x;});
    if(!s)return;
    s.timing.forEach(function(ti){
      if(!byTiming[ti.t])return;
      var key=id+'|'+ti.t;
      var excluded=c.suppExclude.indexOf(key)>-1;
      var label=s.name+(ti.d?' ('+ti.d+')':'');
      byTiming[ti.t].push({id:id,timing:ti.t,label:label,excluded:excluded});
    });
  });
  var html='<div class="supp-notes"><div class="supp-notes-hd">Πρωτόκολλο συμπληρωμάτων</div>';
  var any=false;
  SUPP_TIMINGS.forEach(function(t){
    if(!byTiming[t].length)return;
    any=true;
    html+='<div class="supp-note-row"><span class="sntime">'+t+'</span><span class="snitems">';
    byTiming[t].forEach(function(item,i){
      if(item.excluded){
        html+='<span class="supp-excl" onclick="excludeSupp(\''+item.id+'\',\''+item.timing+'\')" title="Επαναφορά">'+item.label+'</span>';
      } else {
        html+='<span class="supp-active">'+item.label+'<button class="supp-rm" onclick="excludeSupp(\''+item.id+'\',\''+item.timing+'\')" title="Αφαίρεση">&times;</button></span>';
      }
      if(i<byTiming[t].length-1)html+=' ';
    });
    html+='</span></div>';
  });
  html+='</div>';
  el.innerHTML=any?html:'';
}

function setupFormEventListeners(){
  // Wire up form inputs to call upd() with cascade recalculation
  var handlers={
    'inp-name':['name',null],
    'inp-weight':['weight','number'],
    'inp-height':['height','number'],
    'inp-bf':['bf','number'],
    'inp-sex':['sex',null],
    'inp-goal':['goal',null],
    'inp-sport':['sport',null],
    'inp-formula':['formula',null],
    'inp-lbm':['lbm','number']
  };

  Object.keys(handlers).forEach(function(elemId){
    var el=document.getElementById(elemId);
    if(!el)return;
    var fieldName=handlers[elemId][0];
    var type=handlers[elemId][1];
    el.onchange=function(){
      var val=type==='number'?parseFloat(this.value)||0:this.value;
      upd(fieldName,val);
      // ✅ Εγκυμοσύνη: το toggle είναι ορατό μόνο για sex==='F' — αυτό ΠΡΕΠΕΙ να ζει εδώ (όχι στο
      // αρχικό wiring πιο πάνω στη renderMain), γιατί αυτή η ανάθεση τρέχει τελευταία και νικάει.
      if(elemId==='inp-sex'){
        var pw=document.getElementById('preg-toggle-wrap');if(pw)pw.style.display=val==='F'?'flex':'none';
        if(val!=='F'){
          var cSex=getC();
          if(cSex && cSex.pregnant){
            upd('pregnant',false);
            var pcb=document.getElementById('inp-pregnant');if(pcb)pcb.checked=false;
            var pf=document.getElementById('preg-fields-wrap');if(pf)pf.style.display='none';
          }
        }
      }
    };
  });
}

// Το "Ραντεβού" tab δεν χωράει στην αρίθμηση 1-4 των per-client tabs (5/6/7 είναι ήδη
// πιασμένα από swTab για global nav) — named constant αντί για γυμνό 100 σε κάθε σημείο
// που το αναφέρεται, ώστε το επόμενο νέο tab να μην χρειαστεί να μαντέψει γιατί υπάρχει (Ε5).
var TAB_APPOINTMENTS=100;

function swTab(n){
  if(n===0){ if(typeof renderHome==='function') renderHome(); return; }
  if(n===5){ if(typeof renderDiets==='function') renderDiets(); return; }
  if(n===6){ if(typeof renderRecipes==='function') renderRecipes(); return; }
  if(n===7){ if(typeof renderClients==='function') renderClients(); return; }
  if(n===8){ if(typeof renderTips==='function') renderTips(); return; }
  // 2026-08-23: renderMessages() μόνη της ζωγραφίζει μόνο ό,τι ήδη υπάρχει στη μνήμη (cache από το
  // login ή το τελευταίο χειροκίνητο "🔄 Ανανέωση") — το άνοιγμα του tab δεν έφερνε ποτέ νέα δεδομένα
  // από μόνο του. Τώρα ζωγραφίζει αμέσως (instant, από cache) και μετά τρέχει msgRefresh στο
  // παρασκήνιο, ώστε ένα μήνυμα που έστειλε ο πελάτης ενώ ο διαιτολόγος είχε ήδη ανοιχτή την
  // εφαρμογή να εμφανιστεί χωρίς να χρειάζεται να το θυμηθεί να πατήσει το κουμπί.
  if(n===9){ if(typeof renderMessages==='function') renderMessages(); if(typeof msgRefresh==='function') msgRefresh(null); return; }
  // ✅ Remembers the last client-detail tab shown, so the delayed fade-in renderMain()
  // wrapper (Dietologist.html) can re-apply it after its own rebuild — see that wrapper
  // for why this is needed (it defaults back to tab 1 otherwise).
  window._lastTabN=n;
  var t1=document.getElementById('t1');if(t1)t1.classList.toggle('active',n===1);
  var t2=document.getElementById('t2');if(t2)t2.classList.toggle('active',n===2);
  var t3=document.getElementById('t3');if(t3)t3.classList.toggle('active',n===3);
  var t3b=document.getElementById('t3b');if(t3b)t3b.classList.toggle('active',n===TAB_APPOINTMENTS);
  var t4=document.getElementById('t4');if(t4)t4.classList.toggle('active',n===4);

  // ✅ HIDE ALL PAGES FIRST
  var s1=document.getElementById('s1');if(s1)s1.style.display='none';
  var s2=document.getElementById('s2');if(s2)s2.style.display='none';
  var s3=document.getElementById('s3');if(s3)s3.style.display='none';
  var s3b=document.getElementById('s3b');if(s3b)s3b.style.display='none';
  var s4=document.getElementById('s4');if(s4)s4.style.display='none';

  // ✅ THEN SHOW ONLY THE SELECTED PAGE
  if(n===1 && s1)s1.style.display='block';
  if(n===2 && s2)s2.style.display='block';
  // ✅ Rebuild s3 fresh every time it's opened — the client-logs cache can finish loading
  // (refreshClientLogsCache) after this div was first built, and swTab() only ever
  // toggled display before, so a stale (pre-fetch) panel could get stuck showing forever.
  if(n===3 && s3){var _c=getC();if(_c)s3.innerHTML=buildTrackerHtml(_c);s3.style.display='block';}
  // TAB_APPOINTMENTS = "📝 Ραντεβού" tab (kept outside the 1-4 numbering since 5/6/7 are already
  // used by swTab for global nav — Διατροφές/Συνταγές/Πελάτες). Rebuilt fresh each open, same reason as s3.
  // 2026-08-23: ίδιος λόγος με το n===9 tab παραπάνω — το άνοιγμα του Ραντεβού tab ζωγράφιζε μόνο
  // ό,τι ήδη υπήρχε στη μνήμη· τώρα τρέχει και refreshClientPortalFeedback στο παρασκήνιο ώστε ένα
  // πρόσφατο μήνυμα/feedback/check-in αυτού του πελάτη να μη μείνει κρυμμένο μέχρι χειροκίνητη ανανέωση.
  if(n===TAB_APPOINTMENTS && s3b){var _c100=getC();if(_c100)s3b.innerHTML=buildAppointmentsHtml(_c100);s3b.style.display='block';if(typeof refreshClientPortalFeedback==='function')refreshClientPortalFeedback(null);}
  if(n===4 && s4)s4.style.display='block';

  // ✅ HIDE FORM SECTIONS EXCEPT IN TAB 1 (Page 1 only - Στοιχεία Πελάτη)
  var sectionIds=['sec-goal','sec-macros','sec-anthropometry','sec-activity','sec-dietary','sec-medical','met-section-wrap','sec-daytgt'];
  sectionIds.forEach(function(id){
    var el=document.getElementById(id);
    if(el)el.style.display=n===1?'block':'none';
  });

  // ✅ HIDE DAY TARGETS TABLE EXCEPT IN TAB 1
  var dayTgtWrap=document.querySelector('.day-tgt-wrap');
  if(dayTgtWrap)dayTgtWrap.style.display=n===1?'block':'none';

  // ✅ HIDE TEMPLATE SELECTOR EXCEPT IN TAB 1
  var tmplSelRow=document.querySelector('.tmpl-sel-row');
  if(tmplSelRow)tmplSelRow.style.display=n===1?'block':'none';

  // ✅ HIDE MODAL BUTTONS GRID EXCEPT IN TAB 1 (Page 1 only)
  // Buttons: Χρόνοι Γευμάτων, Εβδομαδιαίο Πρόγραμμα, MET Activities, Διατροφή, Ιατρικές Συνθήκες, Συμπληρώματα
  var modalButtonsDiv=document.getElementById('modal-btns-grid');
  if(modalButtonsDiv)modalButtonsDiv.style.display=n===1?'flex':'none';

  // ✅ HIDE 2x-TRAINING HINT + "Δημιουργία πλάνου" BUTTON EXCEPT IN TAB 1 (Page 1 only)
  var hint2x=document.getElementById('hint-2x-training');
  if(hint2x)hint2x.style.display=n===1?'':'none';
  var genPlanRow=document.getElementById('genplan-row');
  if(genPlanRow)genPlanRow.style.display=n===1?'':'none';
  // ✅ genplan-row already hosts a "⋯" quick-actions button on tab 1, so hide the floating
  // circular FAB there to avoid two overlapping fixed bottom controls; other tabs still get it.
  var fabBtn=document.getElementById('fab-btn');
  if(fabBtn)fabBtn.style.display=n===1?'none':'';

  if(n===1){setupFormEventListeners();}  // ← SET UP EVENT LISTENERS
  if(n===2){renderFoodLib('');var c=getC();if(c){initializeMealTiming(c);}renderWeekTable();renderSuppNotes();}
  if(n===4){var c=getC();if(c&&c.savedPlans)setTimeout(function(){renderPlanCharts(c);},100);}
}

/* Update the day-target table display when macros change (e.g., carb boost, training days) */
function updateDayTargetTable(c,t){
  var tableEl=document.querySelector('table.day-tgt-table');
  if(!tableEl)return; // Table not on page

  // Get default day targets (respects carb boost, training days, etc.)
  var defs=!c.dayTargets?makeDayTgtDefaults(c,t):getDayTgtEff(c,t);
  if(!defs||defs.length!==7)return;

  // Update each day's displayed values in the table
  // The table has cells with IDs like: dt-k-0, dt-p-0, dt-f-0, dt-c-0, etc.
  var keys=['k','p','f','c'];
  for(var i=0;i<7;i++){
    keys.forEach(function(key){
      var cellEl=document.getElementById('dt-'+key+'-'+i);
      if(cellEl){
        var oldVal=cellEl.value;
        var val=defs[i][key];
        cellEl.value=val;

        // Visual highlight if value changed (flash effect)
        if(oldVal&&oldVal!==String(val)){
          cellEl.style.transition='background-color 0.3s ease';
          cellEl.style.backgroundColor='#fff9c4';  // Light yellow flash
          setTimeout(function(){
            cellEl.style.backgroundColor='';
          }, 500);
        }

        // Also update the display text if there's a separate display element
        var dispEl=document.querySelector('[data-day-'+key+'-'+i+']');
        if(dispEl)dispEl.textContent=val;
      }
    });
  }
}

// ✅ Set the activity multiplier (PAL) — either from one of the 4 preset buttons (presetKey set)
// or from the free numeric field (presetKey null, auto-detects if it happens to match a preset).
function setActivityFactor(val, presetKey) {
  var c = getC();
  if(!c) return;
  val = Math.round(val*1000)/1000;
  c.activityFactor = val;
  if(presetKey){
    c.activity = presetKey;
  } else {
    var PAL_BY_KEY={sed:1.2,light:1.375,mod:1.55,active:1.725};
    var matched = Object.keys(PAL_BY_KEY).filter(function(k){return PAL_BY_KEY[k]===val;})[0];
    c.activity = matched || 'custom';
  }
  saveNow();
  renderMain();
}

// ✅ Set goal calorie adjustment to an absolute value, clamped to -500..+500.
// Shared by the slider (onchange, on release) and the quick-jump buttons.
function setGoalCalories(newGoal) {
  var c = getC();
  if(!c) return;

  newGoal = Math.max(-500, Math.min(500, Math.round(newGoal)));

  // Save the new goal
  c.goal = newGoal.toString();

  // Update the display
  document.getElementById('goal-display').textContent = (newGoal >= 0 ? '+' : '') + newGoal;
  document.getElementById('inp-goal').value = newGoal;
  var slider = document.getElementById('goal-slider');
  if(slider) slider.value = newGoal;

  // Save to localStorage
  saveNow();

  // ✅ Full re-render so daily-targets table + header goal reflect the new adjustment
  renderMain();

  console.log('📊 Goal adjusted to:', newGoal, 'kcal/day');
}

// ✅ GOAL MACROS AUTO-ADJUSTMENT (NEW)
function applyGoalMacros(goalType) {
  var c = getC();
  if(!c) return;

  // Set goal delta based on selection
  var goalDeltas = {
    loss: -500,
    maintain: 0,
    gain: 300,
    running: 0   // δρομείς: ξεκίνα σε συντήρηση — ο διαιτολόγος ρυθμίζει το ±kcal με τον slider ανάλογα με τον όγκο προπόνησης
  };

  c.goal = String(goalDeltas[goalType] || 0);
  c.goalMain = goalType;

  // Smart default: pre-fill a sensible macro preset for this goal — but only the first
  // time. Any preset OTHER than 'balanced' (custom/strength/endurance/loss/martial) is
  // unambiguously a deliberate choice already and stays protected as before. 'balanced' is
  // the one ambiguous value — it's BOTH the smart-default for the 'maintain' goal AND a
  // real preset a dietitian can deliberately pick via setMacroPreset(), so a value-only
  // check can't tell those apart; c._macroPresetManual (set only by setMacroPreset()'s real
  // button-click path) disambiguates that one case. Skipped entirely when a sport is
  // selected, since sport-specific ratios already take priority (see recalculateMacros()).
  if(!c.sport && (!c.macroPreset || (c.macroPreset==='balanced' && !c._macroPresetManual))){
    var defPreset=DEFAULT_MACRO_PRESET_BY_GOAL[goalType];
    var defPr=defPreset&&MACRO_PRESETS[defPreset];
    if(defPr){ c.macroPreset=defPreset; c.macroP=defPr.p; c.macroF=defPr.f; c.macroC=defPr.c; }
  }

  // Update display
  var goalDisplay = document.getElementById('goal-display');
  if(goalDisplay) {
    var val = goalDeltas[goalType];
    goalDisplay.textContent = (val >= 0 ? '+' : '') + val;
  }

  // Save changes
  saveNow();

  // ✅ Full re-render so daily-targets table, macros, and header goal all refresh
  // (calcTDEE inside renderMain recomputes everything from c.goal)
  renderMain();

  console.log('✅ Goal macros applied:', goalType, '→', goalDeltas[goalType], 'kcal');
}

// ✅ Calculate age (in years) from a birth-date string (YYYY-MM-DD)
// ✅ Read the single native date input (already ISO "YYYY-MM-DD", same format c.birthDate
// is stored in — no assembly needed), save it, recalc age. Replaces the old 3-dropdown
// (day/month/year) version: same data, one field instead of three.
function commitBirthdate(c){
  var el=document.getElementById('inp-birthdate');
  if(!el)return;
  if(el.value){
    c.birthDate=el.value;
    var a=ageAtDate(c.birthDate);
    updateAgeDisplay();
    if(a!=null){upd('age',a);}else{save();}
  }else{
    c.birthDate='';
    updateAgeDisplay();
    save();
  }
}

// ✅ Update the "(X ετών)" label next to the birth-date field
function updateAgeDisplay(){
  var el=document.getElementById('age-display');if(!el)return;
  var c=getC();if(!c){el.textContent='';return;}
  var a=c.birthDate?ageAtDate(c.birthDate):c.age;
  el.textContent=(a!=null&&!isNaN(a))?'('+a+' ετών)':'';
}

// ✅ Collapsible "Βασικά Στοιχεία" / "Άθλημα" sections — collapsed by default once a
// client already has that data filled in (nothing new to look at every visit), left
// open for a brand-new client so the dietitian sees the empty fields right away.
// State lives per-client for the session; toggling doesn't get reset by re-renders.
window._secState = window._secState || {};
function getSecState(c){
  if(!window._secState[c.id]){
    window._secState[c.id] = {
      // ✅ Only collapse once every field inside is actually filled in — collapsing
      // while something's still missing (e.g. sport set but activity level not) would
      // hide the very field the dietitian needs to fix.
      basic: !!(c.name && c.sex && c.age),
      sport: !!(c.sport && c.activity),
      // ✅ Presets είναι σημείο εκκίνησης μιας φοράς, όχι κάτι που ξαναχρειάζεται συνέχεια —
      // κλειστό by default ώστε στο κινητό να μη σκεπάζει τα στοιχεία πελάτη πριν καν τα δεις.
      quickstart: true,
      macros: (c.macroPreset||'balanced')!=='custom',
      daytgt: true,
      // ✅ Ανθρωπομετρία / Στόχος stay open by default (edited on most visits) —
      // still toggleable like every other section, for when they're not needed.
      anthro: false,
      goal: false
    };
  }
  return window._secState[c.id];
}
function toggleSec(sec){
  var c=getC();if(!c)return;
  var st=getSecState(c);
  st[sec]=!st[sec];
  renderMain();
}

// ✅ Collapsible «Τρόφιμα» panel next to the weekly plan — frees width for the day columns.
// Persisted in localStorage (UI preference, not client data) so it stays collapsed across clients.
function isFoodLibCollapsed(){
  try{ return localStorage.getItem('fyh_foodlib_collapsed')==='1'; }catch(e){ return false; }
}
function toggleFoodLib(){
  var el=document.getElementById('food-lib');
  if(!el)return;
  var collapsed=el.classList.toggle('collapsed');
  try{ localStorage.setItem('fyh_foodlib_collapsed', collapsed?'1':'0'); }catch(e){}
  var btn=el.querySelector('.food-lib-toggle');
  if(btn) btn.textContent = collapsed?'‹':'›';
}
// ✅ Safety net: if plan-generation validation fails on a field that lives inside a
// collapsed accordion (Βασικά Στοιχεία / Άθλημα / Κατανομή Μακρο), force it open so the
// error is actually visible instead of the dietitian hunting for a hidden input.
// ✅ 2026-08-01: added weight/height/bf (→'anthro') and goal_required (→'goal') — these had no
// entry at all, so an error on any of them left "Ανθρωπομετρία"/"Στόχος & Προσαρμογή" collapsed
// (if the dietitian had manually closed it) with nothing forcing it back open.
var SEC_FOR_ERROR={
  name_required:'basic', name_short:'basic', name_long:'basic',
  age_required:'basic', age_invalid:'basic', sex_required:'basic',
  activity_required:'sport',
  weight_required:'anthro', weight_invalid:'anthro',
  height_required:'anthro', height_invalid:'anthro',
  bf_invalid:'anthro',
  goal_required:'goal',
  macros_invalid:'macros'
};
// ✅ 2026-08-01: the error toast told the dietitian WHAT was wrong but never WHERE — on a long
// client form (7+ accordion sections) that meant scrolling around hunting for the actual input.
// Maps each validation error to the input it belongs to, so showValidationErrors() can scroll to
// and briefly highlight it.
var FIELD_ID_FOR_ERROR={
  name_required:'inp-name', name_short:'inp-name', name_long:'inp-name',
  age_required:'inp-birthdate', age_invalid:'inp-birthdate',
  sex_required:'inp-sex',
  weight_required:'inp-weight', weight_invalid:'inp-weight',
  height_required:'inp-height', height_invalid:'inp-height',
  bf_invalid:'inp-bf',
  activity_required:'inp-activity-factor'
};
function scrollToAndHighlightField(errors){
  var fieldId=null;
  for(var i=0;i<(errors||[]).length&&!fieldId;i++){ fieldId=FIELD_ID_FOR_ERROR[errors[i]]; }
  if(!fieldId)return;
  var el=document.getElementById(fieldId);
  if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  el.focus();
  var prevBg=el.style.background, prevBorder=el.style.borderColor, prevShadow=el.style.boxShadow;
  el.style.background='#ffebee';
  el.style.borderColor='#e53935';
  el.style.boxShadow='0 0 0 3px rgba(229,57,53,0.25)';
  setTimeout(function(){
    el.style.background=prevBg;
    el.style.borderColor=prevBorder;
    el.style.boxShadow=prevShadow;
  },1800);
}
function revealSectionsForErrors(errors){
  var c=getC();if(!c)return;
  var st=getSecState(c);
  var changed=false;
  (errors||[]).forEach(function(err){
    var sec=SEC_FOR_ERROR[err];
    if(sec && st[sec]){ st[sec]=false; changed=true; }
  });
  if(changed) renderMain();
}

function upd(k,v){
  var c=getC();if(!c)return;
  var oldValue = c[k];

  // ✅ PHASE 1: VALIDATE INPUT BEFORE SAVING
  var tempClient = deepClone(c);
  tempClient[k] = v;
  var validationErrors = validateClientData(tempClient);

  // If validation fails for critical fields, show error and reject change
  var criticalFields = ['name', 'age', 'weight', 'height', 'bf'];
  if(criticalFields.includes(k)) {
    var fieldErrors = validationErrors.filter(function(err) {
      return err.startsWith(k + '_');
    });
    if(fieldErrors.length > 0) {
      showErrorToast(VALIDATION_MESSAGES_GR[fieldErrors[0]] || 'Δεδομένα μη έγκυρα');
      return; // Don't save invalid data
    }
  }

  // ✅ PHASE 4: UPDATE CLIENT WITH UNDO/REDO
  // All fields whose input fires oninput (every keystroke) are excluded like name —
  // UpdateClientCommand.execute() calls renderMain(), which rebuilds #main's innerHTML
  // and drops focus/cursor on every keystroke while typing. Fields wired to onblur/onchange
  // instead (weight, height, bf, leanmass, formula, goal, activity, age) only fire once
  // per edit, so a full renderMain() there is harmless and stays on the undo/redo path.
  var LIVE_TYPING_FIELDS = {phone:1,email:1,rmr:1,lbm:1,gestationalWeek:1,prePregnancyWeight:1,allergies:1,preferences:1};
  if(window.undoRedoManager && typeof UpdateClientCommand !== 'undefined' && k !== 'name' && !LIVE_TYPING_FIELDS[k] && oldValue !== v){
    var cmd = new UpdateClientCommand(c, k, oldValue, v);
    window.undoRedoManager.execute(cmd);
  } else {
    c[k]=v;save();
  }
  // ✅ Name change: update sidebar + header text IN PLACE (no full re-render — keeps input focus while typing)
  if(k==='name'){
    renderSB();
    var headerName=document.getElementById('client-header-name');
    if(headerName)headerName.textContent='👤 '+(v||'Νέος πελάτης');
    return;
  }
  // ✅ Phone/Email/Allergies/Preferences change: nothing else on screen depends on these — no re-render needed while typing
  if(k==='phone'||k==='email'||k==='allergies'||k==='preferences'){
    return;
  }
  // formula change needs full re-render to update formula tag + LBM field visibility
  // (lbm itself is excluded above — it affects BMR under Cunningham, so it falls through
  // to the in-place BMR/TDEE/macro recompute below instead, same as rmr)
  if(k==='formula'){renderMain();return;}
  // ✅ Goal/Activity change: needs full re-render to update TDEE, macros, and daily targets
  if(k==='goal'||k==='activity'){renderMain();return;}
  var t=calcTDEE(c);
  // Age change: full re-render (formula label + minor banner may change)
  if(k==='age'){renderMain();return;}
  // ✅ Weight/Height change: refresh BMI displays in place (badge was going stale)
  if(k==='weight'||k==='height'){
    if(c.weight&&c.height){
      var bmiVal=Math.round(c.weight/((c.height/100)*(c.height/100))*10)/10;
      var bmiCat=bmiVal<18.5?'Χαμηλό':bmiVal<25?'Φυσιολογικό':bmiVal<30?'Υπέρβαρο':'Παχυσαρκία';
      var badge=document.getElementById('bmi-badge');
      if(badge)badge.innerHTML='📊 BMI: '+bmiVal+' <span style="font-size:10px;color:#666;font-weight:normal;">('+bmiCat+')</span>';
      var hm=document.getElementById('header-measures');
      if(hm)hm.textContent=c.weight+'kg / '+c.height+'cm (BMI: '+bmiVal+')';
    }
  }
  var b=document.getElementById('v-bmr');if(b)b.textContent=t.bmr+' kcal';
  // TDEE — show exercise chip in MET mode
  var tdEl=document.getElementById('v-tdee');
  if(tdEl){
    if(t.usedMET){
      tdEl.innerHTML=t.tdee+' kcal<span class="v-ex-chip" id="v-exday">+'+t.exerciseDaily+'</span>';
    } else {
      tdEl.textContent=t.tdee+' kcal';
    }
  }
  // Calculate weekly average target from daily targets (for MET-based accuracy)
  var avgTarget=t.target;
  if(c.dayTargets&&c.dayTargets.length===7){
    var totalKcal=0;
    for(var di=0;di<7;di++){
      totalKcal+=(c.dayTargets[di].k||0);
    }
    avgTarget=Math.round(totalKcal/7);
  }
  var tg=document.getElementById('v-target');if(tg)tg.textContent=avgTarget+' kcal';
  var m=document.getElementById('v-macros');if(m)m.innerHTML=t.p+'g <span style="font-size:10px;color:#555;font-weight:400">('+t.protGperKg+' g/kg)</span>';
  // Display validation warnings
  var wc=document.getElementById('warnings-container');
  if(wc){
    if(t.warnings&&t.warnings.length>0){
      var whtml='';
      t.warnings.forEach(function(w){
        var bgColor=w.type==='alert'?'#ffebee':'#fff3e0';
        var borderColor=w.type==='alert'?'#f44336':'#ff9800';
        var textColor=w.type==='alert'?'#c62828':'#e65100';
        whtml+='<div style="background:'+bgColor+';border:1px solid '+borderColor+';border-radius:6px;padding:8px 12px;margin:6px 0;font-size:13px;color:'+textColor+'">'+w.msg+'</div>';
      });
      wc.innerHTML=whtml;
    } else {
      wc.innerHTML='';
    }
  }
  // Refresh EA row if present
  var eaEl=document.getElementById('ea-row');
  if(t.ea!==null){
    var eaCls='ea-row '+(t.ea<30?'ea-danger':t.ea<45?'ea-warn':'ea-ok');
    var eaTxt='⚡ Energy Availability: <b>'+t.ea+' kcal/kgLBM</b> &nbsp;'+(t.ea<30?(c.sport?'🔴 Κίνδυνος RED-S — ανεπαρκής ενεργειακή διαθεσιμότητα':'🔴 Χαμηλή ενεργειακή διαθεσιμότητα'):t.ea<45?'🟡 Οριακή EA — παρακολούθηση απαραίτητη':'🟢 Φυσιολογική EA');
    if(eaEl){eaEl.className=eaCls;eaEl.innerHTML=eaTxt;}
  } else if(eaEl){eaEl.style.display='none';}
  // Refresh MET totals if weight changed (kcal depends on weight)
  if(k==='weight'){var mw=document.querySelector('.met-wrap');if(mw&&(c.metActivities||[]).length>0){var mt=buildMetHtml(c,t);var tmp=document.createElement('div');tmp.innerHTML=mt;var newMet=tmp.firstChild;if(newMet)mw.parentNode.replaceChild(newMet,mw);}}
  // Update hydration chips
  var numT=(c.trainDays||[]).filter(function(x){return x;}).length;
  var hc=document.querySelector('.hydration-row');
  if(hc){
    hc.innerHTML='<div class="hydration-chip">&#128167; Ανάπαυση: '+t.hydBase+' ml<span>('+Math.round(t.hydBase/1000*10)/10+'L)</span></div>'
      +(numT>0?'<div class="hydration-chip" style="background:#e8f5e9;color:#2e7d32">&#127947; Προπόνηση: '+t.hydTrain+' ml<span>('+Math.round(t.hydTrain/1000*10)/10+'L)</span></div>':'')
      +'<div class="hydration-chip" style="background:#fff3e0;color:#e65100">&#128197; '+numT+'/7 ημέρες προπόνησης</div>';
  }
  // Keep day-target inputs in sync when no custom targets set
  if(!c.dayTargets){
    var defs=makeDayTgtDefaults(c,t);
    for(var i=0;i<7;i++){['k','p','f','c'].forEach(function(mk){var inp2=document.getElementById('dt-'+mk+'-'+i);if(inp2)inp2.value=defs[i][mk];});}
  }
  // CRITICAL FIX: Rebuild the day-target table display when settings change
  // This ensures the visible macro values update when ANY calculation parameter changes
  // Parameters that affect TDEE (and thus daily targets):
  //   - age, weight, height, sex: affect BMR calculation
  //   - activity: affects TDEE multiplier
  //   - formula: affects BMR method (Mifflin vs Cunningham)
  //   - lbm: used in Cunningham formula
  //   - bf: used for LBM estimation
  //   - goal, customGoalDelta: directly affect target calculation
  //   - macroP, macroF, macroC: change macro distribution
  //   - metActivities: affects exercise energy calculation
  // Parameters that directly affect daily targets:
  //   - carbBoost: redistributes carbs/fats across training days
  //   - trainDays: determines which days are training vs rest
  //   - trainHoursByDay, trainHoursPerDay: affects training day calorie scaling
  // Only skip 'name' and 'formula' (formula requires recalc that happens in renderMain)
  if(k!=='name'){
    updateDayTargetTable(c,t);
  }

  // ← TRIGGER CASCADE RECALCULATION for fields that affect TDEE/macros
  var recalcFields=['weight','age','height','sex','activity','goal','bf','sport','lbm'];
  if(recalcFields.indexOf(k)!==-1){
    onClientChange();
  }
}


// js/client-editor/plan-history-athlete.js
// 🏁 Athlete layer of the 📊 Ιστορικό πλάνων (plan-history.js) — 2026-10-22.
//
// Data (per client, only used when phaIsAthlete(c)):
//   c.races[]   {id, name, date 'YYYY-MM-DD', type, prio:'A'|'B', debrief?}
//               debrief = {perf 1-5, result, energy, wPre, wPost, fluidsMl, choG, durMin, gi[], note, at}
//   c.planTag   {phase, raceId, note} — the tag the NEXT history entry gets (save modal / auto-save
//               on publish / «Επανάληψη»). raceId is dropped once that race is in the past.
//   plan.phase, plan.raceId          — per history entry, editable in its detail card
//   plan.ctx.athlete                 — snapshot at save time: {sport, ea, exDaily, exWeekly, ffm,
//                                      days:[{t,m,l,act,cho}]} (train/match/carb-load flags, MET
//                                      activity names, CHO-protocol g/kg target of that day)
//
// Everything here is display + small editors; plan generation is not touched. plan-history.js
// calls these behind typeof guards, so a non-athlete client renders exactly as before.

var PHA_PHASES=[
  {k:'offseason',l:'Εκτός περιόδου',bg:'#eef2f2',fg:'#3d4a4a'},
  {k:'prep',l:'Προετοιμασία',bg:'#dfe9f3',fg:'#1d4f7a'},
  {k:'comp',l:'Αγωνιστική',bg:'#e3efdc',fg:'#3f6a2c'},
  {k:'taper',l:'Taper / εβδ. αγώνα',bg:'#fbe6c4',fg:'#7a4a00'},
  {k:'recovery',l:'Αποθεραπεία',bg:'#ece3f5',fg:'#5b2a86'},
  {k:'injury',l:'Τραυματισμός',bg:'#fbe9e3',fg:'#8a2f12'},
  {k:'cut',l:'Weight cut',bg:'#fdf0d5',fg:'#7a4a00'}
];
var PHA_RACE_TYPES={endurance:'Αγώνας αντοχής',tournament:'Τουρνουά (πολλοί αγώνες)',weighin:'Αγώνας με ζύγιση',team:'Αγώνας ομαδικού',other:'Άλλο'};
var PHA_GI=['Φούσκωμα','Ναυτία','Κράμπες','Τουαλέτα','Καούρα'];

function phaIsAthlete(c){
  if(!c)return false;
  return !!(c.sport&&c.sport!=='custom')||((c.metActivities||[]).length>0)||((c.races||[]).length>0);
}
function phaPhase(k){for(var i=0;i<PHA_PHASES.length;i++){if(PHA_PHASES[i].k===k)return PHA_PHASES[i];}return null;}
function phaRace(c,id){var r=c.races||[];for(var i=0;i<r.length;i++){if(r[i].id===id)return r[i];}return null;}
function phaRacesSorted(c){return (c.races||[]).slice().sort(function(a,b){return a.date<b.date?-1:(a.date>b.date?1:0);});}
function phaUpcoming(c){var t=phToday();return phaRacesSorted(c).filter(function(r){return r.date>=t;});}
function phaDaysTo(date){return phDaysBetween(phToday(),date);}
function phaRaceLabel(r){return esc(r.name||'Αγώνας')+' · '+phFmtShort(r.date);}
// Mon=0..Sun=6 of an ISO date
function phaDow(iso){return (new Date(iso+'T00:00:00').getDay()+6)%7;}

// Tag the next history entry gets: c.planTag, minus a race that already happened.
function phaCurrentTag(c){
  var t=c.planTag||{};
  var race=t.raceId?phaRace(c,t.raceId):null;
  return {phase:t.phase||null,raceId:(race&&race.date>=phToday())?race.id:null,note:t.note||''};
}

/* ── snapshot at save time ─────────────────────────────────────────────── */
function phaSnapshot(c){
  if(!phaIsAthlete(c))return null;
  var t=null;try{t=calcTDEE(c);}catch(e){}
  if(!t)return null;
  var load=(typeof getCarbLoadDayIndexes==='function')?getCarbLoadDayIndexes(c):[];
  var days=[];
  for(var d=0;d<7;d++){
    var acts=[];
    (c.metActivities||[]).forEach(function(ma){
      var ds=(typeof _metDaysOf==='function')?_metDaysOf(c,ma):(ma.days||[]);
      if(ds.indexOf(d)>=0)acts.push(ma.name+(ma.mins?' '+ma.mins+'′':''));
    });
    var cho=null;
    if(typeof computeCHOTargets==='function'){try{var r=computeCHOTargets(c,t,d);cho=(r&&r.dailyCHO)?r.dailyCHO.gPerKg:null;}catch(e){}}
    days.push({t:!!((c.trainDays||[])[d]||(t.byDay&&t.byDay[d]>0)),m:!!((c.matchDays||[])[d]),l:load.indexOf(d)>=0,act:acts.join(', '),cho:cho});
  }
  return {sport:c.sport||null,ea:t.ea!=null?t.ea:null,exDaily:t.exerciseDaily||0,exWeekly:t.exerciseWeekly||0,ffm:t.lbmForEA||null,days:days};
}

/* ── per-plan metrics ──────────────────────────────────────────────────── */
function phaDayMacro(wp,d,key){
  var s=0;((wp&&wp[d])||[]).forEach(function(meal){(meal.foods||[]).forEach(function(fd){s+=phFoodMacros(fd)[key]||0;});});
  return s;
}
function phaChoPerDay(plan,w){
  var out=[];for(var d=0;d<7;d++){var g=phaDayMacro(plan.weekPlan,d,'c');out.push(w&&g>0?g/w:null);}
  return out;
}
function phaChoRange(plan,w){
  var v=phaChoPerDay(plan,w).filter(function(x){return x!=null;});
  if(!v.length)return null;
  return {min:Math.min.apply(null,v),max:Math.max.apply(null,v)};
}
// Average protein per meal slot (name + n-th occurrence that day, so two «Ενδιάμεσο» stay apart).
function phaProteinMeals(plan){
  var acc={},order=[];
  for(var d=0;d<7;d++){
    var seen={};
    ((plan.weekPlan&&plan.weekPlan[d])||[]).forEach(function(meal){
      var nm=meal.name||'Γεύμα';seen[nm]=(seen[nm]||0)+1;
      var key=nm+(seen[nm]>1?' '+seen[nm]:'');
      var p=0;(meal.foods||[]).forEach(function(fd){p+=phFoodMacros(fd).p||0;});
      if(!acc[key]){acc[key]={s:0,n:0};order.push(key);}
      acc[key].s+=p;acc[key].n++;
    });
  }
  return order.map(function(k){return {name:k,g:Math.round(acc[k].s/acc[k].n)};});
}
function phaEA(plan){
  var a=plan.ctx&&plan.ctx.athlete;
  if(!a||!(a.ffm>0))return null;
  var k=(plan.macros&&plan.macros.k)||0;
  return Math.round((k-(a.exDaily||0))/a.ffm);
}
function phaEAStyle(ea){
  if(ea>=45)return 'background:#e5f2ec;color:#1b5e3f';
  if(ea>=30)return 'background:#fbf0dc;color:#7a4a00';
  return 'background:#fbe9e3;color:#8a2f12';
}
function phaEALabel(ea){return ea>=45?'επαρκής (≥45)':(ea>=30?'χαμηλή — παρακολούθηση (30–45)':'κρίσιμη — κίνδυνος RED-S (<30)');}

/* ── badges / row extras ───────────────────────────────────────────────── */
function phaBadges(c,plan){
  var h='',ph=phaPhase(plan.phase);
  if(ph)h+='<span class="ph-badge" style="background:'+ph.bg+';color:'+ph.fg+'">'+esc(ph.l)+'</span>';
  var r=plan.raceId?phaRace(c,plan.raceId):null;
  if(r)h+='<span class="ph-badge" style="background:#fff;border:1px solid #d9b98a;color:#8a4b00">🏁 '+phaRaceLabel(r)+(r.debrief?' · '+r.debrief.perf+'/5':'')+'</span>';
  return h;
}
function phaRowExtra(c,plan,body){
  if(!phaIsAthlete(c))return '';
  var h='',rg=phaChoRange(plan,body.w),ea=phaEA(plan);
  if(rg)h+='<span class="ph-muted">CHO '+phDec(rg.min)+'–'+phDec(rg.max)+' g/kg</span>';
  if(ea!=null)h+='<span class="ph-pill" style="'+phaEAStyle(ea)+'" title="Energy Availability (kcal/kg άλιπης μάζας)">EA '+ea+'</span>';
  return h;
}

/* ── plan detail: tag editor + athlete metrics + debrief summary ───────── */
function phaDetailHtml(c,plan,body,isActive){
  if(!phaIsAthlete(c))return '';
  var id=esc(plan.id),w=body.w;
  var h='<div class="ph-sec" style="gap:10px">';
  // tag editor
  var phOpts='<option value="">— φάση —</option>'+PHA_PHASES.map(function(p){return '<option value="'+p.k+'"'+(plan.phase===p.k?' selected':'')+'>'+esc(p.l)+'</option>';}).join('');
  var rOpts='<option value="">— χωρίς αγώνα —</option>'+phaRacesSorted(c).map(function(r){return '<option value="'+esc(r.id)+'"'+(plan.raceId===r.id?' selected':'')+'>'+phaRaceLabel(r)+'</option>';}).join('')+'<option value="__new">+ Νέος αγώνας…</option>';
  h+='<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px">'
    +'<span class="ph-lbl">Φάση & αγώνας</span>'
    +'<select class="phc-sel" aria-label="Φάση πλάνου" onchange="phaSetPlanPhase(\''+id+'\',this.value)">'+phOpts+'</select>'
    +'<select class="phc-sel" aria-label="Αγώνας πλάνου" onchange="phaSetPlanRace(\''+id+'\',this.value)">'+rOpts+'</select>'
    +'</div>';

  // CHO per day
  var cho=phaChoPerDay(plan,w),snap=plan.ctx&&plan.ctx.athlete,race=plan.raceId?phaRace(c,plan.raceId):null;
  var raceDow=race?phaDow(race.date):-1;
  var mx=Math.max.apply(null,cho.map(function(x){return x||0;}).concat([1]));
  var valid=cho.filter(function(x){return x!=null;});
  var avg=valid.length?valid.reduce(function(a,b){return a+b;},0)/valid.length:null;
  if(w){
    h+='<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px"><span class="ph-lbl">Υδατάνθρακες ανά ημέρα (g/kg)</span>'
      +'<span class="ph-muted" style="font-size:11.5px">μ.ο. '+phDec(avg)+' g/kg'+(snap?'':' · ο τύπος ημέρας δεν είχε καταγραφεί σε αυτό το πλάνο')+'</span></div>'
      +'<div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px">';
    for(var d=0;d<7;d++){
      var di=snap&&snap.days?snap.days[d]:null;
      var isRace=!!race&&d===raceDow&&phDaysBetween(plan.date,race.date)>=0&&phDaysBetween(plan.date,race.date)<=13;
      var kind=di?(di.m?'Αγώνας':(di.l?'Φόρτιση':(di.t?'Προπόνηση':'Ξεκούραση'))):'';
      if(isRace)kind='ΑΓΩΝΑΣ';
      var col=isRace||(di&&di.m)?'#8a4b00':(di&&di.l?'#d08a2e':(di&&di.t?'#025857':(di?'#9cb5b5':'#5f8f8f')));
      var tgt=di&&di.cho!=null?di.cho:null;
      var v=cho[d],hh=v?Math.round(v*100/mx):0;
      h+='<div style="background:var(--card-bg);border:'+(isRace?'2px solid #8a4b00':'1px solid var(--border-light)')+';border-radius:8px;padding:6px;display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0" title="'+PH_DAYS[d]+(di&&di.act?' · '+esc(di.act):'')+(tgt!=null?' · στόχος CHO protocol '+tgt+' g/kg':'')+'">'
        +'<span style="font-size:10.5px;'+(isRace?'font-weight:700;color:#8a4b00':'')+'" class="'+(isRace?'':'ph-muted')+'">'+PH_DAYS_SHORT[d]+'</span>'
        +'<div style="width:100%;height:54px;display:flex;align-items:flex-end;position:relative">'
        +(tgt!=null&&mx?'<div style="position:absolute;left:0;right:0;bottom:'+Math.min(100,Math.round(tgt*100/mx))+'%;border-top:2px dashed #c2410c" aria-hidden="true"></div>':'')
        +'<div style="width:100%;height:'+hh+'%;background:'+col+';border-radius:4px 4px 0 0"></div></div>'
        +'<span style="font-size:13px;font-weight:700">'+(v!=null?phDec(v):'—')+'</span>'
        +(kind?'<span style="font-size:10px;text-align:center;line-height:1.2" class="ph-muted">'+kind+'</span>':'')
        +(tgt!=null?'<span style="font-size:10px;color:#c2410c">στόχος '+phDec(tgt)+'</span>':'')
        +'</div>';
    }
    h+='</div>';
    if(snap&&snap.days.some(function(x){return x.cho!=null;}))h+='<div class="ph-muted" style="font-size:11px">Η διακεκομμένη γραμμή = στόχος CHO ημέρας του CHO Protocol εκείνη τη στιγμή.</div>';
  }

  // markers
  var ea=phaEA(plan),pm=phaProteinMeals(plan),thr=w?Math.round(0.3*w):20;
  var okMeals=pm.filter(function(x){return x.g>=thr;}).length;
  h+='<div class="ph-grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">'
    +'<div class="ph-sec"><span class="ph-lbl">Energy Availability</span>'
    +(ea!=null?'<div class="ph-tile"><div class="v">'+ea+' <span style="font-size:12px;font-weight:400">kcal/kg FFM</span></div><div class="s" style="'+phaEAStyle(ea)+';display:inline-block;border-radius:6px;padding:1px 6px;margin-top:2px">'+phaEALabel(ea)+'</div>'
      +'<div class="ph-muted" style="font-size:11px;margin-top:4px">(kcal πλάνου '+((plan.macros&&plan.macros.k)||0)+' − άσκηση '+Math.round(snap.exDaily)+') / άλιπη '+phDec(snap.ffm)+' kg</div></div>'
      :'<div class="ph-muted" style="font-size:12px">Δεν υπολογίζεται για πλάνα πριν από αυτή την έκδοση (λείπει άλιπη μάζα / άσκηση εκείνης της στιγμής).</div>')
    +(snap?'<div class="ph-muted" style="font-size:12px">'+snap.days.filter(function(x){return x.t;}).length+' μέρες προπόνησης · '+Math.round(snap.exWeekly)+' kcal άσκησης/εβδ.'+(snap.sport&&typeof SPORT_PROFILES!=='undefined'&&SPORT_PROFILES[snap.sport]?' · '+esc(SPORT_PROFILES[snap.sport].name):'')+'</div>':'')
    +'</div>'
    +'<div class="ph-sec"><span class="ph-lbl">Πρωτεΐνη ανά γεύμα (στόχος ≥'+thr+' g = 0,3 g/kg)</span>'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px">'+pm.map(function(x){return '<span class="ph-tag '+(x.g>=thr?'ph-add':'ph-rem')+'">'+esc(x.name)+' '+x.g+' g</span>';}).join('')+'</div>'
    +'<div class="ph-muted" style="font-size:12px">'+okMeals+' από '+pm.length+' γεύματα πιάνουν τον στόχο'+(w?' · σύνολο '+phDec(((plan.macros&&plan.macros.p)||0)/w)+' g/kg':'')+'</div>'
    +'</div></div>';

  // race debrief summary + actions
  if(race){
    var past=race.date<=phToday();
    h+='<div style="background:#fffaf1;border:1px solid #f0d9b5;border-radius:10px;padding:10px 12px;display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;font-size:12.5px;color:#3d2a00">'
      +'<span style="font-weight:700;color:#7a4a00">🏁 '+phaRaceLabel(race)+'</span>';
    if(race.debrief){
      var x=phaDebriefCalc(race.debrief);
      h+='<span>Απόδοση <b>'+race.debrief.perf+'/5</b>'+(race.debrief.result?' · '+esc(race.debrief.result):'')+'</span>'
        +'<span>Γαστρεντερικά: <b>'+((race.debrief.gi||[]).length?esc(race.debrief.gi.join(', ')):'όχι')+'</b></span>'
        +(x.lossPct!=null?'<span>Απώλεια '+phDec(x.loss)+' kg ('+phDec(x.lossPct)+'%)</span>':'')
        +(x.sweat!=null?'<span>Sweat rate ~'+phDec(x.sweat)+' L/h</span>':'')
        +(x.choH!=null?'<span>CHO κατά '+x.choH+' g/h</span>':'')
        +(race.debrief.note?'<span style="font-style:italic">«'+esc(race.debrief.note)+'»</span>':'');
    } else {
      h+='<span>'+(past?'Ο αγώνας έγινε — δεν υπάρχει ακόμα απολογισμός.':'σε '+phaDaysTo(race.date)+' μέρες')+'</span>';
    }
    h+='<span style="margin-left:auto;display:flex;flex-wrap:wrap;gap:6px">'
      +(past?'<button class="btn secondary" style="font-size:12px;padding:6px 10px;min-height:auto" onclick="phaOpenDebrief(\''+esc(race.id)+'\')">'+(race.debrief?'Επεξεργασία απολογισμού':'Απολογισμός αγώνα')+'</button>':'')
      +(phaUpcoming(c).length?'<button class="btn secondary" style="font-size:12px;padding:6px 10px;min-height:auto" onclick="phaOpenRepeat(\''+id+'\')">↻ Επανάληψη για επόμενο αγώνα</button>':'')
      +'</span></div>';
  }
  h+='</div>';
  return h;
}

function phaSetPlanPhase(id,val){
  var c=getC();if(!c)return;var p=phFind(c,id);if(!p)return;
  p.phase=val||null;
  if(phIsEmpty(c.weekPlan)||phHash(c.weekPlan)===phPlanHash(p)){c.planTag=c.planTag||{};c.planTag.phase=p.phase;}
  save();phRefresh(c);
}
function phaSetPlanRace(id,val){
  var c=getC();if(!c)return;var p=phFind(c,id);if(!p)return;
  if(val==='__new'){phaOpenRaceModal(null,function(r){p.raceId=r.id;save();phRefresh(c);});phRefresh(c);return;}
  p.raceId=val||null;
  if(phHash(c.weekPlan)===phPlanHash(p)){c.planTag=c.planTag||{};c.planTag.raceId=p.raceId;}
  save();phRefresh(c);
}

/* ── top of the tab: next race banner + race list ──────────────────────── */
function phaBestSourcePlan(c,plans){
  // most recent plan linked to a past race — prefer one whose race went well (perf ≥4)
  var cands=plans.filter(function(p){var r=p.raceId&&phaRace(c,p.raceId);return r&&r.date<=phToday();});
  var good=cands.filter(function(p){var r=phaRace(c,p.raceId);return r.debrief&&r.debrief.perf>=4;});
  var pool=good.length?good:cands;
  return pool.length?pool[pool.length-1]:null;
}
function phaTopHtml(c,plans){
  if(!phaIsAthlete(c))return '';
  var up=phaUpcoming(c),next=up[0],src=phaBestSourcePlan(c,plans),h='';
  if(next){
    var dl=phaDaysTo(next.date),linked=plans.some(function(p){return p.raceId===next.id;});
    h+='<div class="ph-card" style="border-color:#f0d9b5;display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px">'
      +'<div style="font-size:24px" aria-hidden="true">🏁</div>'
      +'<div style="flex:1;min-width:220px;display:flex;flex-direction:column;gap:2px">'
      +'<span class="ph-lbl" style="color:#7a4a00">Επόμενος αγώνας</span>'
      +'<span style="font-size:15.5px;font-weight:700">'+esc(next.name||'Αγώνας')+' · '+PH_DAYS[phaDow(next.date)]+' '+phFmtShort(next.date)+' · '+(dl===0?'σήμερα':'σε '+dl+' '+(dl===1?'μέρα':'μέρες'))+'</span>'
      +'<span class="ph-muted" style="font-size:12px">'+(linked?'Υπάρχει πλάνο συνδεδεμένο με αυτόν τον αγώνα.':'Δεν υπάρχει ακόμα πλάνο για αυτόν τον αγώνα.')+(next.type&&PHA_RACE_TYPES[next.type]?' · '+PHA_RACE_TYPES[next.type]:'')+(next.prio?' · σημασία '+next.prio:'')+'</span></div>'
      +(src?'<button class="btn primary" style="font-size:12.5px;padding:8px 12px;min-height:auto" onclick="phaOpenRepeat(\''+esc(src.id)+'\',\''+esc(next.id)+'\')">↻ Επανάληψη πλάνου αγώνα #'+src.number+'</button>':'')
      +'</div>';
  }
  // race list
  var all=phaRacesSorted(c).slice().reverse();
  h+='<div class="ph-card" style="display:flex;flex-direction:column;gap:8px">'
    +'<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px"><h3 class="ph-h">🏁 Αγώνες</h3>'
    +'<button class="btn secondary" style="font-size:12px;padding:6px 10px;min-height:auto" onclick="phaOpenRaceModal()">+ Νέος αγώνας</button></div>';
  if(!all.length)h+='<div class="ph-muted" style="font-size:12.5px">Πρόσθεσε τους αγώνες του αθλητή για να συνδέεις πλάνα με αυτούς, να κρατάς απολογισμό και να επαναλαμβάνεις ό,τι δούλεψε.</div>';
  all.forEach(function(r){
    var past=r.date<=phToday(),nPlans=plans.filter(function(p){return p.raceId===r.id;}).length;
    h+='<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;font-size:13px;padding:6px 0;border-top:1px solid var(--border-light)">'
      +'<span class="ph-date">'+phFmt(r.date)+'</span>'
      +'<span style="font-weight:700">'+esc(r.name||'Αγώνας')+'</span>'
      +(r.prio?'<span class="ph-badge ph-b-man">'+esc(r.prio)+'</span>':'')
      +'<span class="ph-muted">'+(past?(r.debrief?'απόδοση '+r.debrief.perf+'/5'+((r.debrief.gi||[]).length?' · ΓΕ: '+esc(r.debrief.gi.join(', ')):''):'χωρίς απολογισμό'):'σε '+phaDaysTo(r.date)+' μέρες')+'</span>'
      +'<span class="ph-muted">'+nPlans+' πλάνο'+(nPlans===1?'':'α')+'</span>'
      +'<span style="margin-left:auto;display:flex;gap:6px">'
      +(past?'<button class="btn '+(r.debrief?'tertiary':'secondary')+'" style="font-size:11.5px;padding:5px 9px;min-height:auto" onclick="phaOpenDebrief(\''+esc(r.id)+'\')">'+(r.debrief?'Απολογισμός':'+ Απολογισμός')+'</button>':'')
      +'<button class="btn tertiary" style="font-size:11.5px;padding:5px 9px;min-height:auto" onclick="phaOpenRaceModal(\''+esc(r.id)+'\')">Επεξεργασία</button>'
      +'</span></div>';
  });
  h+='</div>';
  return h;
}

/* ── chart layers (phase bands + race flags) ───────────────────────────── */
function phaChartEnd(c,lastEnd){
  var up=phaUpcoming(c).filter(function(r){return phaDaysTo(r.date)<=120;});
  return up.length&&up[up.length-1].date>lastEnd?up[up.length-1].date:lastEnd;
}
function phaChartBands(c,plans,xOf,Y0,Y1){
  var s='',any=false;
  plans.forEach(function(p,i){
    var ph=phaPhase(p.phase);if(!ph)return;any=true;
    var to=i<plans.length-1?plans[i+1].date:phToday();
    var xa=xOf(p.date),xb=xOf(to);if(xb-xa<1)xb=xa+3;
    s+='<rect x="'+xa.toFixed(1)+'" y="'+Y0+'" width="'+(xb-xa).toFixed(1)+'" height="'+(Y1-Y0)+'" fill="'+ph.bg+'" opacity=".75"><title>'+esc(ph.l)+'</title></rect>';
  });
  return any?s:'';
}
function phaChartFlags(c,xOf,first,end,Y0,Y1){
  var s='';
  phaRacesSorted(c).forEach(function(r){
    if(r.date<first||r.date>end)return;
    var x=xOf(r.date).toFixed(1),past=r.date<=phToday();
    s+='<line x1="'+x+'" y1="'+(Y0-6)+'" x2="'+x+'" y2="'+Y1+'" stroke="#8a4b00" stroke-width="2"'+(past?'':' stroke-dasharray="4 3"')+'/>'
      +'<path d="M'+x+' '+(Y0-8)+' h14 l-4 5 l4 5 h-14 z" fill="'+(past?'#8a4b00':'#fff')+'" stroke="#8a4b00" stroke-width="1.2"><title>'+esc(r.name||'Αγώνας')+' · '+phFmtShort(r.date)+(r.debrief?' · απόδοση '+r.debrief.perf+'/5':'')+'</title></path>';
  });
  if(end>phToday()){
    var xt=xOf(phToday()).toFixed(1);
    s+='<line x1="'+xt+'" y1="'+Y0+'" x2="'+xt+'" y2="'+Y1+'" style="stroke:var(--text-muted)" stroke-width="1" stroke-dasharray="2 3"/><text x="'+(+xt+3)+'" y="'+(Y1-4)+'" font-size="10" style="fill:var(--text-muted)">σήμερα</text>';
  }
  return s;
}

/* ── save-modal section ────────────────────────────────────────────────── */
function phaSaveSectionHtml(c){
  if(!phaIsAthlete(c))return '';
  var tag=phaCurrentTag(c);
  if(!tag.phase){var ps=phSorted(c);if(ps.length)tag.phase=ps[ps.length-1].phase||null;}
  var h='<div style="margin-bottom:12px"><label style="font-weight:600;display:block;margin-bottom:4px" for="pha-save-phase">🏁 Φάση</label>'
    +'<select id="pha-save-phase" class="phc-sel" style="width:100%"><option value="">— χωρίς φάση —</option>'
    +PHA_PHASES.map(function(p){return '<option value="'+p.k+'"'+(tag.phase===p.k?' selected':'')+'>'+esc(p.l)+'</option>';}).join('')+'</select></div>'
    +'<div style="margin-bottom:16px"><label style="font-weight:600;display:block;margin-bottom:4px" for="pha-save-race">Αφορά αγώνα;</label>'
    +'<select id="pha-save-race" class="phc-sel" style="width:100%"><option value="">— κανένας συγκεκριμένος —</option>'
    +phaUpcoming(c).map(function(r){return '<option value="'+esc(r.id)+'"'+(tag.raceId===r.id?' selected':'')+'>'+phaRaceLabel(r)+' · σε '+phaDaysTo(r.date)+' μέρες</option>';}).join('')
    +'</select><div style="font-size:11px;color:var(--text-muted);margin-top:4px">Νέο αγώνα προσθέτεις από το Ιστορικό → 🏁 Αγώνες.</div></div>';
  return h;
}
function phaReadSaveSection(c){
  var ph=document.getElementById('pha-save-phase'),rc=document.getElementById('pha-save-race');
  if(!ph&&!rc)return;
  c.planTag=c.planTag||{};
  if(ph)c.planTag.phase=ph.value||null;
  if(rc)c.planTag.raceId=rc.value||null;
}

/* ── modals ────────────────────────────────────────────────────────────── */
function phaModal(inner){
  phEnsureStyle();
  var ov=document.getElementById('pha-overlay');
  if(!ov){ov=document.createElement('div');ov.id='pha-overlay';ov.addEventListener('click',function(e){if(e.target===ov)phaCloseModal();});document.body.appendChild(ov);}
  ov.setAttribute('style','position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:10002;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:24px 12px');
  ov.innerHTML='<div class="phc-box" role="dialog" aria-modal="true" style="max-width:560px">'+inner+'</div>';
}
function phaCloseModal(){var ov=document.getElementById('pha-overlay');if(ov)ov.remove();}
function phaField(id,label,val,attrs){
  return '<div style="display:flex;flex-direction:column;gap:4px;min-width:0"><label for="'+id+'" style="font-size:12px" class="ph-muted">'+label+'</label>'
    +'<input id="'+id+'" value="'+esc(val==null?'':val)+'" '+(attrs||'')+' style="font:inherit;font-size:13px;padding:8px 10px;border:1px solid var(--border-light);border-radius:8px;background:var(--card-bg);color:inherit;min-width:0"></div>';
}

var _phaRaceCb=null;
function phaOpenRaceModal(id,cb){
  var c=getC();if(!c)return;
  _phaRaceCb=cb||null;
  var r=id?phaRace(c,id):null;
  var defDate=r?r.date:((c.eventDate&&!(c.races||[]).some(function(x){return x.date===c.eventDate;}))?c.eventDate:'');
  var types=Object.keys(PHA_RACE_TYPES).map(function(k){return '<option value="'+k+'"'+(r&&r.type===k?' selected':'')+'>'+PHA_RACE_TYPES[k]+'</option>';}).join('');
  phaModal('<h2 style="margin:0;color:#025857;font-size:18px">'+(r?'Επεξεργασία αγώνα':'Νέος αγώνας')+'</h2>'
    +'<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'
    +phaField('pha-r-name','Όνομα',r?r.name:'','placeholder="π.χ. Ημιμαραθώνιος Λευκωσίας"')
    +phaField('pha-r-date','Ημερομηνία',defDate,'type="date"')
    +'<div style="display:flex;flex-direction:column;gap:4px"><label for="pha-r-type" class="ph-muted" style="font-size:12px">Τύπος</label><select id="pha-r-type" class="phc-sel">'+types+'</select></div>'
    +'<div style="display:flex;flex-direction:column;gap:4px"><label for="pha-r-prio" class="ph-muted" style="font-size:12px">Σημασία</label><select id="pha-r-prio" class="phc-sel"><option value="A"'+(r&&r.prio==='B'?'':' selected')+'>Α — κύριος στόχος</option><option value="B"'+(r&&r.prio==='B'?' selected':'')+'>Β — προετοιμασίας</option></select></div>'
    +'</div>'
    +'<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">'
    +(r?'<button class="btn danger" style="font-size:12.5px" onclick="phaDeleteRace(\''+esc(r.id)+'\')">Διαγραφή</button>':'<span></span>')
    +'<span style="display:flex;gap:8px"><button class="btn secondary" onclick="phaCloseModal()">Ακύρωση</button>'
    +'<button class="btn primary" onclick="phaSaveRace('+(r?'\''+esc(r.id)+'\'':'null')+')">Αποθήκευση</button></span></div>');
}
function phaSaveRace(id){
  var c=getC();if(!c)return;
  var name=(document.getElementById('pha-r-name').value||'').trim(),date=document.getElementById('pha-r-date').value;
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)){showErrorToast('Βάλε ημερομηνία αγώνα.');return;}
  c.races=c.races||[];
  var r=id?phaRace(c,id):null;
  if(!r){r={id:'race_'+Date.now()};c.races.push(r);}
  r.name=name||'Αγώνας';r.date=date;r.type=document.getElementById('pha-r-type').value;r.prio=document.getElementById('pha-r-prio').value;
  save();phaCloseModal();
  var cb=_phaRaceCb;_phaRaceCb=null;if(cb)cb(r);
  phRefresh(c);
}
function phaDeleteRace(id){
  var c=getC();if(!c)return;
  var r=phaRace(c,id);if(!r)return;
  phaCloseModal();
  showConfirmDialog('Διαγραφή του αγώνα «'+(r.name||'Αγώνας')+'» ('+phFmt(r.date)+')'+(r.debrief?' μαζί με τον απολογισμό του':'')+'; Τα πλάνα μένουν, απλώς αποσυνδέονται.',function(){
    c.races=(c.races||[]).filter(function(x){return x.id!==id;});
    (c.savedPlans||[]).forEach(function(p){if(p.raceId===id)p.raceId=null;});
    if(c.planTag&&c.planTag.raceId===id)c.planTag.raceId=null;
    save();phRefresh(c);
  });
}

/* debrief */
function phaDebriefCalc(d){
  var out={loss:null,lossPct:null,sweat:null,choH:null};
  var a=parseFloat(d.wPre),b=parseFloat(d.wPost),dur=parseFloat(d.durMin),fl=parseFloat(d.fluidsMl)||0,ch=parseFloat(d.choG);
  if(a>0&&b>0){out.loss=a-b;out.lossPct=(a-b)*100/a;}
  if(out.loss!=null&&dur>0)out.sweat=(out.loss+fl/1000)/(dur/60);
  if(ch>0&&dur>0)out.choH=Math.round(ch/(dur/60));
  return out;
}
function phaNum(id){var v=(document.getElementById(id)||{}).value;if(v==null||v==='')return null;var n=parseFloat(String(v).replace(',','.'));return isNaN(n)?null:n;}
var _phaPerf=null,_phaGi=[];
function phaOpenDebrief(raceId){
  var c=getC();if(!c)return;var r=phaRace(c,raceId);if(!r)return;
  var d=r.debrief||{};
  _phaPerf=d.perf||null;_phaGi=(d.gi||[]).slice();
  var wDef=d.wPre!=null?d.wPre:(phLatestBody(c).w||'');
  phaModal('<div><div class="ph-lbl" style="color:#7a4a00">Απολογισμός αγώνα</div><h2 style="margin:2px 0 0;color:#025857;font-size:18px">'+phaRaceLabel(r)+'</h2></div>'
    +'<div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;font-weight:600">Απόδοση</span><div id="pha-perf" style="display:flex;gap:6px">'
    +[1,2,3,4,5].map(function(n){return '<button type="button" class="ph-chip'+(_phaPerf===n?' on':'')+'" style="flex:1;border:1px solid var(--border-light);border-radius:8px;min-height:40px" onclick="phaPickPerf('+n+')">'+n+'</button>';}).join('')
    +'</div></div>'
    +'<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'
    +phaField('pha-d-result','Χρόνος / αποτέλεσμα',d.result||'','placeholder="π.χ. 1:31:40 (PB)"')
    +phaField('pha-d-dur','Διάρκεια (λεπτά)',d.durMin,'inputmode="decimal"')
    +phaField('pha-d-wpre','Βάρος πριν (kg)',wDef,'inputmode="decimal"')
    +phaField('pha-d-wpost','Βάρος μετά (kg)',d.wPost,'inputmode="decimal"')
    +phaField('pha-d-fl','Υγρά κατά τον αγώνα (ml)',d.fluidsMl,'inputmode="decimal"')
    +phaField('pha-d-cho','Υδατάνθρακες κατά (g)',d.choG,'inputmode="decimal"')
    +'</div>'
    +'<div id="pha-d-calc" style="background:var(--panel-bg);border-radius:8px;padding:8px 10px;font-size:12.5px"></div>'
    +'<div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;font-weight:600">Γαστρεντερικές ενοχλήσεις</span><div id="pha-gi" style="display:flex;flex-wrap:wrap;gap:6px"></div></div>'
    +'<div style="display:flex;flex-direction:column;gap:4px"><label for="pha-d-energy" style="font-size:13px;font-weight:600">Ενέργεια στο τελευταίο κομμάτι</label><select id="pha-d-energy" class="phc-sel">'
    +['','Καλή — χωρίς «τοίχο»','Μέτρια','Έπεσε / «τοίχος»'].map(function(o){return '<option'+((d.energy||'')===o?' selected':'')+'>'+o+'</option>';}).join('')+'</select></div>'
    +'<div style="display:flex;flex-direction:column;gap:4px"><label for="pha-d-note" style="font-size:13px;font-weight:600">Τι δούλεψε / τι αλλάζουμε την επόμενη φορά</label>'
    +'<textarea id="pha-d-note" rows="3" style="font:inherit;font-size:13px;padding:8px 10px;border:1px solid var(--border-light);border-radius:8px;background:var(--card-bg);color:inherit;resize:vertical">'+esc(d.note||'')+'</textarea></div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn secondary" onclick="phaCloseModal()">Ακύρωση</button><button class="btn primary" onclick="phaSaveDebrief(\''+esc(r.id)+'\')">Αποθήκευση απολογισμού</button></div>');
  phaRenderGi();phaUpdCalc();
  ['pha-d-dur','pha-d-wpre','pha-d-wpost','pha-d-fl','pha-d-cho'].forEach(function(i){var el=document.getElementById(i);if(el)el.addEventListener('input',phaUpdCalc);});
}
function phaPickPerf(n){_phaPerf=n;document.querySelectorAll('#pha-perf button').forEach(function(b,i){b.classList.toggle('on',i+1===n);});}
function phaRenderGi(){
  var box=document.getElementById('pha-gi');if(!box)return;
  box.innerHTML='<button type="button" class="ph-chip'+(_phaGi.length?'':' on')+'" style="border:1px solid var(--border-light)" onclick="phaToggleGi(null)">Καμία</button>'
    +PHA_GI.map(function(g){return '<button type="button" class="ph-chip'+(_phaGi.indexOf(g)>=0?' on':'')+'" style="border:1px solid var(--border-light)" onclick="phaToggleGi(\''+g+'\')">'+g+'</button>';}).join('');
}
function phaToggleGi(g){
  if(g==null)_phaGi=[];else{var i=_phaGi.indexOf(g);if(i>=0)_phaGi.splice(i,1);else _phaGi.push(g);}
  phaRenderGi();
}
function phaUpdCalc(){
  var el=document.getElementById('pha-d-calc');if(!el)return;
  var x=phaDebriefCalc({wPre:phaNum('pha-d-wpre'),wPost:phaNum('pha-d-wpost'),durMin:phaNum('pha-d-dur'),fluidsMl:phaNum('pha-d-fl'),choG:phaNum('pha-d-cho')});
  var parts=[];
  if(x.lossPct!=null)parts.push('Απώλεια <b>'+phDec(x.loss)+' kg = '+phDec(x.lossPct)+'%</b>'+(x.lossPct>2?' <span style="color:#8a2f12">(>2%)</span>':''));
  if(x.sweat!=null)parts.push('Sweat rate ≈ <b>'+phDec(x.sweat)+' L/h</b>');
  if(x.choH!=null)parts.push('CHO κατά ≈ <b>'+x.choH+' g/h</b>');
  el.innerHTML=parts.length?parts.join(' · '):'<span class="ph-muted">Βάλε βάρος πριν/μετά και διάρκεια για απώλεια %, sweat rate και CHO ανά ώρα.</span>';
}
function phaSaveDebrief(raceId){
  var c=getC();if(!c)return;var r=phaRace(c,raceId);if(!r)return;
  if(!_phaPerf){showErrorToast('Διάλεξε απόδοση 1–5.');return;}
  r.debrief={perf:_phaPerf,result:(document.getElementById('pha-d-result').value||'').trim(),durMin:phaNum('pha-d-dur'),
    wPre:phaNum('pha-d-wpre'),wPost:phaNum('pha-d-wpost'),fluidsMl:phaNum('pha-d-fl'),choG:phaNum('pha-d-cho'),
    gi:_phaGi.slice(),energy:document.getElementById('pha-d-energy').value||'',note:(document.getElementById('pha-d-note').value||'').trim(),at:new Date().toISOString()};
  save();phaCloseModal();phRefresh(c);
  showSuccessToast('✓ Ο απολογισμός του αγώνα αποθηκεύτηκε');
}

/* repeat a race plan for another race */
function phaScaleFood(fd,r){
  var o=+fd.g||0;if(!o||Math.abs(r-1)<0.02)return;
  var n=(typeof scaledG==='function')?scaledG(fd.n,o,r):Math.round(o*r);
  if(fd.k){var f=n/o;['k','p','f','c','fi'].forEach(function(k){if(fd[k]!=null)fd[k]=+(fd[k]*f).toFixed(1);});}
  fd.g=n;
}
function phaBuildRepeat(c,src,target){
  var srcRace=src.raceId?phaRace(c,src.raceId):null;
  var shift=(srcRace&&target)?((phaDow(target.date)-phaDow(srcRace.date))%7+7)%7:0;
  var wThen=phBodyAt(c,src).w,wNow=phLatestBody(c).w||c.weight;
  var ratio=(wThen&&wNow)?wNow/wThen:1;
  var wp={};
  for(var d=0;d<7;d++){
    var day=deepClone((src.weekPlan&&src.weekPlan[d])||[]);
    day.forEach(function(meal){(meal.foods||[]).forEach(function(fd){phaScaleFood(fd,ratio);});});
    wp[(d+shift)%7]=day;
  }
  return {wp:wp,shift:shift,ratio:ratio,wThen:wThen,wNow:wNow,srcRace:srcRace};
}
function phaOpenRepeat(srcId,targetId){
  var c=getC();if(!c)return;var src=phFind(c,srcId);if(!src)return;
  phCloseMenus();
  var up=phaUpcoming(c);if(!up.length){showErrorToast('Πρόσθεσε πρώτα τον επόμενο αγώνα (🏁 Αγώνες → + Νέος αγώνας).');return;}
  var target=(targetId&&phaRace(c,targetId))||up[0];
  var x=phaBuildRepeat(c,src,target),note=x.srcRace&&x.srcRace.debrief?x.srcRace.debrief.note:'';
  var rows=[
    ['Από',' Πλάνο #'+src.number+(x.srcRace?' · '+phaRaceLabel(x.srcRace):'')+(x.srcRace&&x.srcRace.debrief?' · απόδοση '+x.srcRace.debrief.perf+'/5':'')],
    ['Στοίχιση ημερών',x.srcRace?('μέρα αγώνα '+PH_DAYS[phaDow(x.srcRace.date)]+' → '+PH_DAYS[phaDow(target.date)]+(x.shift?' (μετατόπιση '+x.shift+' μ.)':' (ίδια μέρα)')):'όπως ήταν (το πηγαίο πλάνο δεν έχει αγώνα)'],
    ['Κλιμάκωση βάρους',x.wThen&&x.wNow?phDec(x.wThen)+' → '+phDec(x.wNow)+' kg (×'+phDec(x.ratio,2)+')'+(Math.abs(x.ratio-1)<0.02?' — χωρίς αλλαγή':''):'χωρίς (λείπει βάρος)'],
    ['Φάση','Taper / εβδ. αγώνα']
  ];
  var opts=up.map(function(r){return '<option value="'+esc(r.id)+'"'+(r.id===target.id?' selected':'')+'>'+phaRaceLabel(r)+'</option>';}).join('');
  phaModal('<div><div class="ph-lbl">Επανάληψη πλάνου αγώνα</div><h2 style="margin:2px 0 0;color:#025857;font-size:18px">Πλάνο #'+src.number+' → επόμενος αγώνας</h2></div>'
    +'<div style="display:flex;flex-direction:column;gap:4px"><label for="pha-rp-target" class="ph-muted" style="font-size:12px">Για τον αγώνα</label><select id="pha-rp-target" class="phc-sel" onchange="phaOpenRepeat(\''+esc(src.id)+'\',this.value)">'+opts+'</select></div>'
    +'<div style="display:flex;flex-direction:column;font-size:13px">'+rows.map(function(r){return '<div style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--border-light)"><span class="ph-muted">'+r[0]+'</span><span style="font-weight:600;text-align:right">'+r[1]+'</span></div>';}).join('')+'</div>'
    +(note?'<label style="display:flex;align-items:flex-start;gap:8px;font-size:13px;background:#fffaf1;border:1px solid #f0d9b5;border-radius:8px;padding:9px 11px;color:#3d2a00"><input type="checkbox" id="pha-rp-note" checked style="margin-top:2px;accent-color:#025857"><span><b>Κράτα τη σημείωση του απολογισμού</b><br><span style="font-size:12px">«'+esc(note)+'»</span></span></label>':'')
    +'<div class="ph-muted" style="font-size:12px">Το τωρινό πλάνο, αν δεν είναι αποθηκευμένο, κρατιέται αυτόματα ως backup. Οι στόχοι υδατανθράκων της εβδομάδας δεν αλλάζουν αυτόματα — έλεγξέ τους πριν το στείλεις.</div>'
    +'<div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn secondary" onclick="phaCloseModal()">Ακύρωση</button><button class="btn primary" onclick="phaDoRepeat(\''+esc(src.id)+'\',\''+esc(target.id)+'\')">Φόρτωση ως ενεργό πλάνο</button></div>');
}
function phaDoRepeat(srcId,targetId){
  var c=getC();if(!c)return;var src=phFind(c,srcId),target=phaRace(c,targetId);if(!src||!target)return;
  var x=phaBuildRepeat(c,src,target);
  var keep=document.getElementById('pha-rp-note');
  var note=(keep&&keep.checked&&x.srcRace&&x.srcRace.debrief)?('Από #'+src.number+': '+x.srcRace.debrief.note):'';
  phBackupIfUnsaved(c,'Πριν την «Επανάληψη» του Πλάνου #'+src.number);
  c.weekPlan=x.wp;
  c.planTag={phase:'taper',raceId:target.id,note:note};
  save();phaCloseModal();
  showSuccessToast('✅ Το πλάνο αγώνα #'+src.number+' φορτώθηκε για «'+(target.name||'αγώνα')+'». Έλεγξέ το στο «Εβδομαδιαίο πλάνο» και στείλ\' το — θα μπει στο Ιστορικό με φάση & αγώνα.');
  renderMain();
}

// js/client-editor/overview.js
// The "📇 Επισκόπηση" client sub-tab — read-only aggregation over data the app already holds,
// laid out in the order of an appointment (2026-11-24 redesign, mockup Desktop/docs/episkopisi-prin-meta.html):
//   Α  header: who + clinical flags (allergies / conditions / meds / pregnancy) + today/next appt, race, link
//   Β  «Τι συμφωνήσαμε» — the last real appointment before today (plan action, kcal change, chips, note)
//   Γ  «Η προσπάθεια από τότε» — weight / body fat / link adherence + pillars / workouts for the period
//      since that appointment, each compared with the previous period, + a day strip
//   Δ  «Τι μου είπε» — client messages, day tags, home weigh-ins and weekly feedback in the period
//   Ε  weight + body-fat chart with plan-change markers
//   ΣΤ right rail «Για συζήτηση σήμερα» — auto agenda (ticks are momentary, not saved) + quick
//      appointment entry (note + plan action) + next appointment date
//   Ζ  collapsed: full chronological history (with filters) and background (intake, notes, waits)
// Below #s0ov, render-main.js still emits the «📝 Ραντεβού» <details> (#ov-appt-wrap → #s3b) with the
// full form and past entries.
//
// Zero new storage: buildOverviewHtml(c) recomputes everything on each open from c.* and the
// window.Cloud portal caches. ovRefresh() re-renders it in place (called wherever #s3b is
// re-rendered, so async cache loads and new entries show up here too).

function ovDateShort(d){
  try{ return new Date(d).toLocaleDateString('el-GR',{day:'numeric',month:'short',year:'numeric'}); }
  catch(e){ return String(d||''); }
}
function ovDayMonth(key){
  try{ return new Date(String(key).slice(0,10)+'T00:00:00').toLocaleDateString('el-GR',{day:'numeric',month:'short'}); }
  catch(e){ return String(key||''); }
}
function ovAgo(ts){
  var ms=Date.now()-(+ts||0);
  var days=Math.floor(ms/86400000);
  if(days<=0) return 'σήμερα';
  if(days===1) return 'χθες';
  if(days<7)  return 'πριν '+days+' ημέρες';
  if(days<60) return 'πριν '+Math.floor(days/7)+' εβδ.';
  if(days<730)return 'πριν '+Math.floor(days/30)+' μήνες';
  return 'πριν '+Math.floor(days/365)+' χρόνια';
}
function ovStars(v){
  var n=Math.max(0,Math.min(5,Math.round(+v||0)));
  return '<span style="color:#f0b429;letter-spacing:1px;font-size:13px">'+('★★★★★').slice(0,n)+('☆☆☆☆☆').slice(0,5-n)+'</span>';
}
var OV_DIET_LBL={normal:'Κανονική',vegetarian:'Χορτοφαγική',vegan:'Vegan',keto:'Κετογονική',orthodox_fasting:'Ορθόδοξη Νηστεία',intermittent_fasting:'Διαλείπουσα Νηστεία',bodybuilding_clean:'Bodybuilding Clean',kids_10_14:'Παιδιά 10-14',mediterranean:'Μεσογειακή'};
var OV_GOAL_LBL={loss:'Απώλεια βάρους',mild:'Ήπια απώλεια',maintain:'Διατήρηση',gain:'Αύξηση μάζας',running:'Δρομείς'};
var OV_MED_LBL={diabetes:'🍬 Διαβήτης',hypertension:'🩸 Υψηλή πίεση',cholesterol:'🩸 Υψηλή χοληστερόλη',celiac:'🌾 Κοιλιοκάκη',ibs:'🔄 IBS',fodmap:'🌿 Low-FODMAP',lactose:'🥛 Δυσανεξία λακτόζης',ironDeficiency:'🔋 Σιδηροπενία',hydration:'💧 Ενυδάτωση/ηλεκτρολύτες'};

// Τικ της ατζέντας: μόνο για τη στιγμή (δεν αποθηκεύονται), αλλά επιβιώνουν ένα ovRefresh().
var OV_TICKS={};

function ovTodayKey(){ return (typeof ckDayKey==='function')?ckDayKey(new Date()):new Date().toISOString().slice(0,10); }
function ovAddDays(key,n){ var d=new Date(key+'T00:00:00'); d.setDate(d.getDate()+n); return (typeof ckDayKey==='function')?ckDayKey(d):d.toISOString().slice(0,10); }
function ovDaysBetween(a,b){ return Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/86400000); }
function ovKeys(from,to){ var out=[],k=from,g=0; while(k<=to && g<400){ out.push(k); k=ovAddDays(k,1); g++; } return out; }
function ovDec(x,n){ if(x==null||isNaN(x)) return '—'; var v=(n==null)?x:(+(+x).toFixed(n)); return String(v).replace('.',','); }
function ovSigned(x,n){ if(x==null||isNaN(x)) return '—'; var v=+(+x).toFixed(n==null?1:n); return (v>0?'+':(v<0?'−':'±'))+ovDec(Math.abs(v)); }

// Τήρηση link για ένα διάστημα [from,to] — ίδιοι ορισμοί με Πρόοδο/Ραντεβού (ckPillarStats/ckOverallScore).
function ovAdherence(rows,from,to){
  if(typeof ckPillarStats!=='function') return null;
  var r=(rows||[]).filter(function(x){return x.date>=from && x.date<=to;});
  var st=ckPillarStats(r);
  if(!st.anyData) return null;
  function pct(d,t){ return t?Math.round(d/t*100):null; }
  return {score:ckOverallScore(st), diet:pct(st.dietDone,st.dietTot), wat:pct(st.watDone,st.watTot), sup:pct(st.supDone,st.supTot), days:r.length};
}
// Προπονήσεις για [from,to] από το client_workout_log — ίδιος κανόνας με την Πρόοδο (progressWorkoutCell).
function ovWorkouts(c,wlog,from,to){
  if(typeof progressWorkoutCell!=='function') return null;
  var todayKey=ovTodayKey(), plan=0, done=0, extra=0;
  ovKeys(from,to).forEach(function(k){
    if(k>=todayKey) return;                       // σήμερα δεν «καταδικάζεται» ακόμα
    var i=(new Date(k+'T00:00:00').getDay()+6)%7;
    var g=progressWorkoutCell(c,wlog,k,i,todayKey);
    if(g.cl==='d'){plan++;done++;} else if(g.cl==='m') plan++; else if(g.cl==='x') extra++;
  });
  if(!plan && !extra) return null;
  return {plan:plan,done:done,extra:extra};
}

function buildOverviewHtml(c){
  if(!c) return '';
  var CL=window.Cloud||{};
  var fb    =(typeof CL.planFeedbackFor==='function')  ? (CL.planFeedbackFor(c)||[])   : [];
  var clogs =(typeof CL.allClientLogsFor==='function') ? (CL.allClientLogsFor(c)||[])  : [];
  var ckRows=(c.shareToken && typeof CL.checkinsFor==='function') ? (CL.checkinsFor(c)||[]) : [];
  var wlog  =(typeof CL.workoutLogFor==='function')    ? (CL.workoutLogFor(c)||{})     : {};
  var linkH =(typeof CL.linkHealthFor==='function')    ? CL.linkHealthFor(c)           : {checked:false};
  var stale =(typeof CL.isStale==='function')          ? CL.isStale(c)                 : false;
  var intakePayload=(window.INTAKE_PAYLOAD_CACHE && c.intakeToken && Object.prototype.hasOwnProperty.call(window.INTAKE_PAYLOAD_CACHE,c.intakeToken))
    ? window.INTAKE_PAYLOAD_CACHE[c.intakeToken] : null;
  var todayKey=ovTodayKey();

  var age=(c.birthDate && typeof ageAtDate==='function') ? ageAtDate(c.birthDate) : c.age;
  var sexTxt=c.sex==='M'?'Άνδρας':(c.sex==='F'?'Γυναίκα':'');
  var goalUp=(c.goalMain==='gain');
  var goalFlat=(c.goalMain==='maintain');

  // ── appointments: the last REAL one before today frames the review ──
  var appts=(c.appointments||[]).filter(function(e){return e && e.date;}).slice().sort(function(a,b){return a.date<b.date?-1:(a.date>b.date?1:0);});
  var realAppts=appts.filter(function(e){return !e.status;});
  var refAppts=realAppts.filter(function(e){return e.date<todayKey;});
  var lastRef=refAppts.length?refAppts[refAppts.length-1]:null;
  var prevRef=refAppts.length>1?refAppts[refAppts.length-2]:null;
  var todayIdx=-1;
  (c.appointments||[]).forEach(function(e,i){ if(e && e.date===todayKey && !e.status) todayIdx=i; });
  var todayEntry=todayIdx>-1?c.appointments[todayIdx]:null;

  // period = since the last appointment (or the last 4 weeks when there is none)
  var pStart=lastRef?lastRef.date:ovAddDays(todayKey,-28);
  var pLen=Math.max(1,ovDaysBetween(pStart,todayKey));
  var qStart=prevRef?prevRef.date:ovAddDays(pStart,-pLen);
  var qEnd=ovAddDays(pStart,-1);
  var periodLbl=lastRef?(ovDayMonth(pStart)+' → σήμερα · '+pLen+' ημέρες'):'τελευταίες 4 εβδομάδες (δεν υπάρχει προηγούμενο ραντεβού)';

  // ── weight / body fat ──
  var wl=(c.weightLog||[]).filter(function(e){return e && e.date;}).slice().sort(function(a,b){return (a.date<b.date)?-1:(a.date>b.date?1:0);});
  var wW=wl.filter(function(e){return e.weight>0;});
  var wB=wl.filter(function(e){return e.bf>0;});
  var goalW=c.goalWeight||c.targetWeight||null;
  var goalBf=c.goalBF||null;

  // ── plan-link status ──
  var hasLink=!!c.shareToken;
  var linkTxt='', linkCls='';
  if(hasLink){
    var lp=[];
    if(linkH && linkH.checked && linkH.exists===false){ lp.push('δεν βρέθηκε'); linkCls='bad'; }
    else if(linkH && linkH.checked && linkH.expired){ lp.push('έληξε'); linkCls='bad'; }
    else{
      lp.push(stale?'παλιό πλάνο':'ενημερωμένο'); if(stale) linkCls='warn';
      if(linkH && linkH.checked && linkH.expiresAt){
        var dl=Math.ceil((new Date(linkH.expiresAt)-Date.now())/86400000);
        if(dl>=0){ lp.push('λήγει σε '+dl+' ημ.'); if(dl<=14 && !linkCls) linkCls='warn'; }
      }
    }
    linkTxt='🔗 Link '+lp.join(' · ');
  } else linkTxt='🔗 Δεν έχει σταλεί πλάνο ακόμη';

  // ═════ Α. Header ═════
  var createdTs=parseInt(String(c.id||'').replace(/^c/,''),10);
  var sinceKey=(createdTs>1e12)?ovTodayKeyFrom(createdTs):(wl.length?wl[0].date:null);
  var kcalNow=(typeof apptCurrentKcalTarget==='function')?(function(){try{return apptCurrentKcalTarget(c);}catch(e){return 0;}})():0;
  var sportTxt=(c.sport && typeof SPORT_PROFILES!=='undefined' && SPORT_PROFILES[c.sport])?(SPORT_PROFILES[c.sport].icon||'🏅')+' '+SPORT_PROFILES[c.sport].name:'';
  var goalTxt=c.goalMain?('🎯 '+(OV_GOAL_LBL[c.goalMain]||c.goalMain)+(c.goal&&parseInt(c.goal)?' '+(parseInt(c.goal)>0?'+':'−')+Math.abs(parseInt(c.goal))+' kcal':'')):'';
  var meta=[sexTxt,(age!=null&&!isNaN(age))?age+' ετών':'',sportTxt,goalTxt,kcalNow?kcalNow+' kcal/ημ.':'',
    sinceKey?('πελάτης από '+ovDayMonth(sinceKey)+' ('+Math.max(1,Math.round(ovDaysBetween(sinceKey,todayKey)/7))+' εβδ.)'):''].filter(Boolean);

  var flags=[];
  try{
    if(typeof clientAllergyKeys==='function') clientAllergyKeys(c).forEach(function(k){ flags.push({t:'⚠️ '+allergyDef(k).label,cls:'bad'}); });
  }catch(e){}
  if(c.allergies && String(c.allergies).trim()) flags.push({t:'⚠️ '+String(c.allergies).trim(),cls:'bad'});
  try{
    var pend=(typeof intakePendingAllergyKeys==='function')?intakePendingAllergyKeys(c).length:0;
    if(typeof intakePendingAllergyOther==='function' && intakePendingAllergyOther(c)) pend++;
    if(pend) flags.push({t:'📄 '+pend+' αλλεργ'+(pend===1?'ία':'ίες')+' από ερωτηματολόγιο δεν εφαρμόστηκ'+(pend===1?'ε':'αν'),cls:'warn'});
  }catch(e){}
  var medSeen={};
  Object.keys(c.medConditions||{}).forEach(function(k){ if(c.medConditions[k] && OV_MED_LBL[k]){ flags.push({t:OV_MED_LBL[k],cls:'bad'}); medSeen[k]=1; } });
  if(intakePayload && intakePayload.conditions && intakePayload.conditions.length){
    var IL=(typeof INTAKE_LBL!=='undefined')?INTAKE_LBL:{};
    intakePayload.conditions.forEach(function(k){ if(k==='none'||medSeen[k]) return; var l=(IL.cond&&IL.cond[k])||k; flags.push({t:'🩺 '+l,cls:'bad'}); });
  }
  var meds=String(c.medications||'').trim()||(intakePayload&&intakePayload.meds?String(intakePayload.meds).trim():'');
  if(meds) flags.push({t:'💊 '+(meds.length>60?meds.slice(0,58)+'…':meds),cls:'bad',title:meds});
  if(c.pregnant) flags.push({t:'🤰 Εγκυμοσύνη'+(c.gestationalWeek?' · εβδ. '+c.gestationalWeek:''),cls:'bad'});
  if(c.dietType && c.dietType!=='normal' && OV_DIET_LBL[c.dietType]) flags.push({t:'🥗 '+OV_DIET_LBL[c.dietType],cls:''});
  try{
    if(typeof headerExcludeSummary==='function'){ var hx=headerExcludeSummary(c.foodExclude); if(hx && hx.title) flags.push({t:'🚫 '+hx.text,cls:'',title:hx.title}); }
  }catch(e){}
  var flagsHtml=flags.map(function(f){ return '<span class="ov-flag'+(f.cls?' '+f.cls:'')+'"'+(f.title?' title="'+esc(f.title)+'"':'')+'>'+esc(f.t)+'</span>'; }).join('');

  var side=[];
  var nextDays=c.nextAppointmentDate?ovDaysBetween(todayKey,c.nextAppointmentDate):null;
  if(todayEntry || nextDays===0) side.push('<span class="ov-today">📅 Ραντεβού σήμερα · '+(refAppts.length+1)+'ο</span>');
  else if(nextDays!=null && nextDays>0) side.push('<span class="ov-next">📅 Επόμενο ραντεβού σε '+nextDays+' ημ. · '+esc(ovDayMonth(c.nextAppointmentDate))+'</span>');
  if(lastRef) side.push('<span class="ov-sm">'+ovDaysBetween(lastRef.date,todayKey)+' ημέρες από το προηγούμενο ('+esc(ovDayMonth(lastRef.date))+')</span>');
  var evDays=(c.eventDate && typeof daysUntilEvent==='function')?daysUntilEvent(c.eventDate):null;
  if(evDays!=null && evDays>=0) side.push('<span class="ov-sm" style="font-weight:700;color:'+(evDays<=14?'#c62828':'var(--text-strong)')+'">🏁 Αγώνας/weigh-in σε '+evDays+' ημ. · '+esc(ovDayMonth(c.eventDate))+'</span>');
  side.push('<span class="ov-link '+linkCls+'">'+esc(linkTxt)+'</span>');

  var portalUrl=(hasLink && CL.PORTAL_BASE) ? (CL.PORTAL_BASE+'?t='+encodeURIComponent(c.shareToken)) : '';
  var headerHtml='<div class="ov-top">'
    +'<div class="ov-who"><h2>'+esc(c.name||'—')+'</h2>'
      +'<div class="ov-meta">'+esc(meta.join(' · '))+'</div>'
      +(flagsHtml?'<div class="ov-flags">'+flagsHtml+'</div>':'')
      +'<div class="ov-btns">'
        +(portalUrl?'<button type="button" class="ov-mini" onclick="window.open(\''+portalUrl+'\',\'_blank\',\'noopener\')">📱 Link πελάτη</button>':'')
        +'<button type="button" class="ov-mini" onclick="swTab(2)">📊 Πλάνο &amp; αποστολή</button>'
        +'<button type="button" class="ov-mini" onclick="swTab(1)">✏️ Στοιχεία</button>'
      +'</div></div>'
    +'<div class="ov-side">'+side.join('')+'</div>'
  +'</div>';

  // ═════ Β. Τι συμφωνήσαμε ═════
  var agreedHtml='';
  if(lastRef){
    var am=(typeof apptPlanActionMeta==='function')?apptPlanActionMeta(lastRef.planAction):null;
    var kc='';
    if(lastRef.kcalAtEntry>0){
      kc=(prevRef && prevRef.kcalAtEntry>0 && prevRef.kcalAtEntry!==lastRef.kcalAtEntry)?(prevRef.kcalAtEntry+' → '+lastRef.kcalAtEntry+' kcal'):(lastRef.kcalAtEntry+' kcal');
    }
    var sentAfter=(c.savedPlans||[]).filter(function(p){ var d=p.date||p.createdAt; if(!d) return false; var k=ovTodayKeyFrom(+new Date(d)); return p.kind==='sent' && k>=lastRef.date; })
      .map(function(p){ return 'Πλάνο #'+(p.number||'?')+' στάλθηκε '+ovDayMonth(ovTodayKeyFrom(+new Date(p.date||p.createdAt))); });
    var planBits=[];
    if(am) planBits.push('<span class="ov-chip" style="background:'+am.color+'1f;color:'+am.color+'">'+am.icon+' '+esc(am.label)+'</span>');
    if(kc) planBits.push(esc(kc));
    if(sentAfter.length) planBits.push(esc(sentAfter.join(' · ')));
    var chips=(lastRef.chips||[]).concat(lastRef.sportChips||[]);
    var rows=[];
    if(planBits.length) rows.push('<div class="ov-row"><b>Πλάνο</b><span>'+planBits.join(' · ')+'</span></div>');
    if(chips.length) rows.push('<div class="ov-row"><b>Θέματα</b><span>'+chips.map(function(x){return '<span class="ov-chip">'+esc(x)+'</span>';}).join('')+'</span></div>');
    if(lastRef.notes) rows.push('<div class="ov-row"><b>Σημείωση</b><span class="ov-quote">'+esc(lastRef.notes)+'</span></div>');
    if(!rows.length) rows.push('<div class="ov-row"><span class="ov-muted">Το ραντεβού καταχωρήθηκε χωρίς σημειώσεις.</span></div>');
    agreedHtml='<div class="ov-blk"><div class="ov-bh"><h4>Τι συμφωνήσαμε στις '+esc(ovDayMonth(lastRef.date))+'</h4><span>'+refAppts.length+'ο ραντεβού</span></div>'+rows.join('')+'</div>';
  }

  // ═════ Γ. Η προσπάθεια ═════
  var tiles=[];
  function deltaCls(d){ if(d==null||Math.abs(d)<0.05||goalFlat) return ''; return ((d<0)!==goalUp)?'ov-good':'ov-bad'; }
  if(wW.length){
    var lw=wW[wW.length-1], pw=wW.length>1?wW[wW.length-2]:null, fw=wW[0];
    var d1=pw?lw.weight-pw.weight:null, d0=wW.length>1?lw.weight-fw.weight:null;
    var dTxt=[]; if(d1!=null) dTxt.push(ovSigned(d1)+' από '+ovDayMonth(pw.date)); if(d0!=null && wW.length>2) dTxt.push(ovSigned(d0)+' από αρχή');
    var gp=(typeof clientGoalWeightPct==='function' && goalW)?clientGoalWeightPct(c):null;
    var home=clogs.filter(function(l){return l.weight_kg!=null && l.date>lw.date;}).sort(function(a,b){return a.date<b.date?1:-1;})[0];
    var sub=[]; if(goalW) sub.push((gp!=null?gp+'% του στόχου · ':'')+'στόχος '+ovDec(goalW)); if(home) sub.push('σπίτι '+ovDayMonth(home.date)+': '+ovDec(home.weight_kg));
    if(lw.date<pStart) sub.push('καμία μέτρηση από '+ovDayMonth(pStart));
    tiles.push('<div class="ov-kpi"><div class="l">Βάρος</div><div class="v">'+ovDec(lw.weight)+'<small> kg</small></div>'
      +(dTxt.length?'<div class="d '+deltaCls(d1!=null?d1:d0)+'">'+esc(dTxt.join(' · '))+'</div>':'<div class="d">μέτρηση '+esc(ovDayMonth(lw.date))+'</div>')
      +(gp!=null?'<div class="ov-bar"><div style="width:'+gp+'%"></div></div>':'')
      +(sub.length?'<div class="s">'+esc(sub.join(' · '))+'</div>':'')+'</div>');
  }
  if(wB.length){
    var lb=wB[wB.length-1], pb=wB.length>1?wB[wB.length-2]:null, fb0=wB[0];
    var b1=pb?lb.bf-pb.bf:null, b0=wB.length>2?lb.bf-fb0.bf:null;
    var bt=[]; if(b1!=null) bt.push(ovSigned(b1)+' από '+ovDayMonth(pb.date)); if(b0!=null) bt.push(ovSigned(b0)+' από αρχή');
    var bfCls=(b1==null||Math.abs(b1)<0.05)?'':(b1<0?'ov-good':'ov-bad');
    var fatKg=(lb.weight>0)?(lb.weight*lb.bf/100):null;
    var bsub=[]; if(goalBf) bsub.push('στόχος '+ovDec(goalBf)+'%'); if(fatKg) bsub.push(ovDec(fatKg,1)+' kg λίπους');
    tiles.push('<div class="ov-kpi"><div class="l">Λίπος'+(lb.bfMethod?' '+esc(lb.bfMethod):'')+'</div><div class="v">'+ovDec(lb.bf,1)+'<small> %</small></div>'
      +(bt.length?'<div class="d '+bfCls+'">'+esc(bt.join(' · '))+'</div>':'<div class="d">μέτρηση '+esc(ovDayMonth(lb.date))+'</div>')
      +(bsub.length?'<div class="s">'+esc(bsub.join(' · '))+'</div>':'')+'</div>');
  }
  var adh=ovAdherence(ckRows,pStart,todayKey), adhPrev=ovAdherence(ckRows,qStart,qEnd);
  if(adh && adh.score!=null){
    var ad=(adhPrev&&adhPrev.score!=null)?adh.score-adhPrev.score:null;
    var pil=function(ic,v){ return v==null?'':'<div class="ov-pil"><span>'+ic+'</span><div class="ov-bar"><div style="width:'+v+'%;'+(v<75?'background:#f0b429':'')+'"></div></div><span>'+v+'%</span></div>'; };
    tiles.push('<div class="ov-kpi"><div class="l">Τήρηση link</div><div class="v">'+adh.score+'<small> %</small></div>'
      +(ad!=null?'<div class="d '+(ad>=(typeof CK_TREND_MIN_PP!=='undefined'?CK_TREND_MIN_PP:5)?'ov-good':(ad<=-(typeof CK_TREND_MIN_PP!=='undefined'?CK_TREND_MIN_PP:5)?'ov-bad':''))+'">'+(ad>0?'↑':(ad<0?'↓':'→'))+' από '+adhPrev.score+'%</div>':'<div class="d">'+adh.days+' ημέρες με καταγραφή</div>')
      +pil('🍽',adh.diet)+pil('💧',adh.wat)+pil('💊',adh.sup)+'</div>');
  }
  var wk=ovWorkouts(c,wlog,pStart,todayKey), wkPrev=ovWorkouts(c,wlog,qStart,qEnd);
  var streak=(ckRows.length && typeof ckStreak==='function')?ckStreak(ckRowsByDate(ckRows)):0;
  var attWin=appts.slice(-10), attMiss=attWin.filter(function(e){return e.status==='noshow'||e.status==='cancelled';}).length;
  if(wk){
    var wsub=[]; if(wk.extra) wsub.push('+'+wk.extra+' εξτρά'); if(streak) wsub.push('σερί '+streak+' ημερών'); if(attWin.length) wsub.push('προσέλευση '+(attWin.length-attMiss)+'/'+attWin.length);
    tiles.push('<div class="ov-kpi"><div class="l">Προπονήσεις</div><div class="v">'+wk.done+'<small>/'+wk.plan+'</small></div>'
      +(wkPrev&&wkPrev.plan?'<div class="d '+((wk.plan&&wk.done/wk.plan>wkPrev.done/wkPrev.plan)?'ov-good':((wk.plan&&wk.done/wk.plan<wkPrev.done/wkPrev.plan)?'ov-bad':''))+'">από '+wkPrev.done+'/'+wkPrev.plan+'</div>':'<div class="d">σημειωμένες στο link</div>')
      +(wsub.length?'<div class="s">'+esc(wsub.join(' · '))+'</div>':'')+'</div>');
  } else if(attWin.length>1 || streak){
    var asub=[]; if(streak) asub.push('σερί '+streak+' ημερών στο link');
    tiles.push('<div class="ov-kpi"><div class="l">Προσέλευση</div><div class="v">'+(attWin.length-attMiss)+'<small>/'+attWin.length+'</small></div>'
      +'<div class="d '+(attMiss?'ov-bad':'')+'">'+(attMiss?attMiss+' απουσία/ακύρωση':'χωρίς απουσίες')+'</div>'
      +(asub.length?'<div class="s">'+esc(asub.join(' · '))+'</div>':'')+'</div>');
  }
  var stripHtml='';
  if(ckRows.length && typeof progressDayClass==='function'){
    var by=ckRowsByDate(ckRows);
    var noteDays={}; clogs.forEach(function(l){ if(l.note) noteDays[l.date]=1; });
    var sKeys=ovKeys(pStart,todayKey).slice(-42);
    var cells=sKeys.map(function(k){ var cl=progressDayClass(by[k]); return '<span class="ov-d '+cl+(noteDays[k]?' n':'')+'" title="'+esc(ovDayMonth(k))+'"></span>'; }).join('');
    stripHtml='<div class="ov-days" style="grid-template-columns:repeat('+sKeys.length+',1fr)">'+cells+'</div>'
      +'<div class="ov-dayl"><span>'+esc(ovDayMonth(sKeys[0]))+'</span><span><i class="ov-d g"></i>όλα · <i class="ov-d a"></i>μερικά · <i class="ov-d r"></i>λίγα · <i class="ov-d e"></i>τίποτα · <i class="ov-d e n"></i>σημείωση</span><span>σήμερα</span></div>';
  }
  var effortHtml=(tiles.length||stripHtml)?('<div class="ov-blk"><div class="ov-bh"><h4>'+(lastRef?'Η προσπάθεια από τότε':'Η προσπάθεια')+'</h4><span>'+esc(periodLbl)+(lastRef?' · σε σύγκριση με το προηγούμενο διάστημα':'')+'</span></div>'
    +(tiles.length?'<div class="ov-kpis">'+tiles.join('')+'</div>':'')+stripHtml+'</div>'):'';

  // ═════ Δ. Τι μου είπε ═════
  var voice=[];
  clogs.filter(function(l){return l.date>=pStart;}).forEach(function(l){
    var noteRaw=l.note||'', tag='';
    var tm=/^\[tag:(travel|party|sick)\]\s*/.exec(noteRaw);
    if(tm){ noteRaw=noteRaw.slice(tm[0].length); var td=(typeof CLIENT_LOG_TAG_DEFS!=='undefined'&&CLIENT_LOG_TAG_DEFS[tm[1]])||null; if(td) tag=td.icon+' '+td.label; }
    var bits=[];
    if(tag) bits.push('<span class="ov-tag">'+esc(tag)+'</span>');
    if(l.weight_kg!=null) bits.push('⚖️ '+ovDec(l.weight_kg)+' kg στο σπίτι');
    if(noteRaw) bits.push('«'+esc(noteRaw)+'»');
    if(bits.length) voice.push({k:l.date,h:bits.join(' · ')});
  });
  var PFL=(typeof PF_ROW_LABELS!=='undefined')?PF_ROW_LABELS:{breakfast:'Πρωινό',lunch:'Μεσημεριανό',dinner:'Βραδινό',snacks:'Σνακ',recipes_ease:'Συνταγές',ingredients_ease:'Υλικά',training_energy:'Προπόνηση'};
  var starMax=(typeof PF_ATTENTION_STAR_MAX!=='undefined')?PF_ATTENTION_STAR_MAX:2;
  fb.filter(function(r){return r.week_start && r.week_start>=ovAddDays(pStart,-6);}).forEach(function(r){
    var parts=Object.keys(PFL).filter(function(k){return r[k]!=null;}).map(function(k){
      var low=r[k]<=starMax; return '<span'+(low?' class="ov-lo"':'')+'>'+esc(PFL[k])+' '+r[k]+'</span>'; });
    if(r.continue_likelihood!=null) parts.push('<span'+(r.continue_likelihood<=4?' class="ov-lo"':'')+'>Συνέχεια '+r.continue_likelihood+'/10</span>');
    var rz=ovReasons(r);
    voice.push({k:r.week_start,h:'⭐ <span class="ov-fb">'+parts.join('')+'</span>'+(rz?'<div class="ov-quote" style="margin-top:3px">'+esc(rz)+'</div>':'')});
  });
  voice.sort(function(a,b){return a.k<b.k?1:(a.k>b.k?-1:0);});
  var voiceHtml=voice.length?('<div class="ov-blk"><div class="ov-bh"><h4>Τι μου είπε</h4><span>μηνύματα και feedback του διαστήματος</span></div>'
    +voice.slice(0,10).map(function(v){ return '<div class="ov-vi"><span class="dt">'+esc(ovDayMonth(v.k))+'</span><span>'+v.h+'</span></div>'; }).join('')
    +(voice.length>10?'<div class="ov-muted" style="font-size:12px">+'+(voice.length-10)+' ακόμη στο πλήρες ιστορικό</div>':'')+'</div>'):'';

  // ═════ Ε. Γράφημα πορείας ═════
  var chartHtml=ovChartHtml(c,wW,wB,realAppts);

  // ═════ ΣΤ. Ατζέντα ═════
  var ag=[];
  function add(key,sev,txt,why,act){ ag.push({key:key,sev:sev,txt:txt,why:why||'',act:act||''}); }
  if(evDays!=null && evDays>=0 && evDays<=28) add('event','r','🏁 Αγώνας/weigh-in σε '+evDays+' ημ.',ovDayMonth(c.eventDate));
  (c.appointments||[]).forEach(function(e,i){ if(e && e.flagged) add('flag'+i,'r','🚩 Σημειωμένο ραντεβού '+ovDayMonth(e.date),e.notes?String(e.notes).slice(0,70):'',
    '<button type="button" class="ov-go" onclick="resolveAppointmentFlag('+i+');ovRefresh()">✅ Έγινε</button>'); });
  clogs.forEach(function(l){
    var t=(l.note||'').replace(/^\[tag:(travel|party|sick)\]\s*/,'').trim();
    if(!t) return;
    if(typeof clientNoteNeedsReply==='function' && !clientNoteNeedsReply(t)) return;
    if(typeof isNoteReplied==='function' && isNoteReplied(c,l.date)) return;
    add('msg'+l.date,'r','💬 Ερώτηση χωρίς απάντηση ('+ovDayMonth(l.date)+')','«'+t.slice(0,80)+'»',
      (typeof replyToClientNote==='function')?'<button type="button" class="ov-go" onclick="replyToClientNote(\''+c.id+'\',\''+l.date+'\',\''+escJsAttr(t)+'\')">↩️</button>':'');
  });
  var fbLatest=fb[0];
  if(fbLatest && fbLatest.week_start>=ovAddDays(pStart,-6)){
    Object.keys(PFL).forEach(function(k){
      if(fbLatest[k]!=null && fbLatest[k]<=starMax){
        var rz=ovReasons(fbLatest);
        add('fb'+k,'y','⭐ '+PFL[k]+' '+fbLatest[k]+'/5',rz?('«'+rz.slice(0,70)+'»'):'εβδομάδα '+ovDayMonth(fbLatest.week_start));
      }
    });
    if(fbLatest.continue_likelihood!=null && fbLatest.continue_likelihood<=4) add('nps','r','📉 Πιθανότητα συνέχισης '+fbLatest.continue_likelihood+'/10','εβδομάδα '+ovDayMonth(fbLatest.week_start));
  }
  clogs.filter(function(l){return l.date>=pStart && /^\[tag:(travel|party|sick)\]/.test(l.note||'');}).forEach(function(l){
    if(ag.some(function(a){return a.key==='msg'+l.date;})) return;   // ήδη στην ατζέντα ως ερώτηση
    var tm=/^\[tag:(travel|party|sick)\]\s*/.exec(l.note); var td=(typeof CLIENT_LOG_TAG_DEFS!=='undefined'&&CLIENT_LOG_TAG_DEFS[tm[1]])||{icon:'🏷',label:tm[1]};
    add('tag'+l.date,'y',td.icon+' '+td.label+' ('+ovDayMonth(l.date)+')',l.note.slice(tm[0].length).slice(0,70));
  });
  if(adh && adhPrev && adh.score!=null && adhPrev.score!=null && adh.score<=adhPrev.score-10) add('adh','y','📶 Η τήρηση έπεσε '+adhPrev.score+'% → '+adh.score+'%','');
  if(adh){
    var pl=[['🍽 Γεύματα',adh.diet],['💧 Νερό',adh.wat],['💊 Συμπληρώματα',adh.sup]].filter(function(p){return p[1]!=null;}).sort(function(a,b){return a[1]-b[1];});
    if(pl.length>1 && pl[0][1]<75) add('pil','y',pl[0][0]+' '+pl[0][1]+'%','ο πιο αδύναμος πυλώνας');
  }
  if(wk && wk.plan>=3 && wk.done/wk.plan<0.6) add('wk','y','🏃 Προπονήσεις '+wk.done+'/'+wk.plan,'σημειωμένες στο link');
  var lu=(typeof linkUsage==='function')?linkUsage(c):null;
  if(lu && lu.state==='never') add('lu','y','📵 Δεν ξεκίνησε το link','πριν '+lu.days+' ημέρες στάλθηκε');
  else if(lu && lu.state==='stopped') add('lu','y','⏸ Σταμάτησε το link πριν '+lu.days+' ημ.','');
  if(wW.length>1 && !goalFlat){
    var lw2=wW[wW.length-1], pw2=wW[wW.length-2], dd=lw2.weight-pw2.weight;
    if(Math.abs(dd)>=0.3 && ((dd>0)!==goalUp)) add('wdir','y','⚖️ Βάρος '+ovSigned(dd)+' kg αντίθετα με τον στόχο',ovDayMonth(pw2.date)+' → '+ovDayMonth(lw2.date));
  }
  if(lastRef && lastRef.notes) add('agreed','b','🔁 Έλεγχος συμφωνίας '+ovDayMonth(lastRef.date),'«'+String(lastRef.notes).slice(0,80)+'»');
  if(!wW.length || wW[wW.length-1].date<todayKey) add('meas','b','📐 Μέτρηση σήμερα',wW.length?'τελευταία '+ovDayMonth(wW[wW.length-1].date):'καμία μέτρηση ακόμα',
    '<button type="button" class="ov-go" onclick="swTab(3)">📐</button>');
  if(hasLink && linkCls) add('link','b',linkTxt,'',  '<button type="button" class="ov-go" onclick="swTab(2)">📊</button>');
  else if(typeof dietsNeedsRenewal==='function' && dietsNeedsRenewal(c)) add('renew','b','🔄 Το πλάνο χρειάζεται ανανέωση','','<button type="button" class="ov-go" onclick="swTab(2)">📊</button>');
  var ticks=OV_TICKS[c.id]||{};
  var agendaItems=ag.length?ag.map(function(a){
    return '<div class="ov-ai"><span class="sev '+a.sev+'"></span><input type="checkbox" data-k="'+esc(a.key)+'" onchange="ovTick(this)"'+(ticks[a.key]?' checked':'')+' aria-label="'+esc(a.txt)+'">'
      +'<span class="tx'+(ticks[a.key]?' done':'')+'">'+esc(a.txt)+(a.why?'<span class="why">'+esc(a.why)+'</span>':'')+'</span>'+a.act+'</div>';
  }).join(''):'<div class="ov-muted" style="font-size:12px;padding:6px 0">Τίποτα ιδιαίτερο από τα δεδομένα.</div>';
  var entryHtml;
  if(todayEntry){
    var tm2=(typeof apptPlanActionMeta==='function')?apptPlanActionMeta(todayEntry.planAction):null;
    entryHtml='<div class="ov-done">✓ Το σημερινό ραντεβού καταχωρήθηκε'+(tm2?' · '+tm2.icon+' '+esc(tm2.label):'')
      +(todayEntry.notes?'<div class="ov-quote" style="margin-top:4px">'+esc(todayEntry.notes)+'</div>':'')
      +'<button type="button" class="ov-mini" style="margin-top:6px" onclick="ovOpenFullForm('+todayIdx+')">✏️ Επεξεργασία</button></div>';
  } else {
    entryHtml='<textarea id="ov-today-notes" class="ov-notes" placeholder="Σημειώσεις σημερινού ραντεβού…"></textarea>'
      +'<div class="appt-plan-action-group ov-pa" id="ov-plan-action">'+((typeof apptPlanActionBtns==='function')?apptPlanActionBtns(null):'')+'</div>'
      +'<button type="button" class="btn primary ov-add" onclick="ovQuickAddAppt()">+ Καταχώρηση ραντεβού</button>'
      +'<div id="ov-add-msg" class="ov-muted" style="font-size:12px;min-height:16px"></div>'
      +'<button type="button" class="ov-link-btn" onclick="ovOpenFullForm(-1)">Πλήρης φόρμα (κλίμακες, chips, 🚩) ↓</button>';
  }
  var agendaHtml='<aside class="ov-agenda" aria-label="Σημερινό ραντεβού">'
    +'<h4>Για συζήτηση σήμερα</h4><div class="ov-hint">Από τα δεδομένα· τσεκάρεις ό,τι καλύψατε.</div>'
    +agendaItems
    +'<div class="ov-sep"></div>'+entryHtml
    +'<label class="ov-nextl">📅 Επόμενο ραντεβού <input type="date" id="ov-next-appt" value="'+esc(c.nextAppointmentDate||'')+'" onchange="ovSetNextAppt(this.value)"></label>'
  +'</aside>';

  // ═════ Ζ. Κλειστά: πλήρες ιστορικό + υπόβαθρο ═════
  var lower=ovHistoryHtml(c,wl,fb,clogs,appts,realAppts,intakePayload)+ovBackgroundHtml(c,intakePayload,realAppts);

  return ''
    +'<style>'
    +'.ov-top{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:flex-start;background:var(--panel-bg,#f6faf9);border:1px solid var(--border-light);border-radius:12px;padding:13px 16px;margin-bottom:14px}'
    +'.ov-who{min-width:0;flex:1 1 380px}.ov-who h2{margin:0;color:#025857;font-size:18px}'
    +'.ov-meta{font-size:12.5px;color:#4a7972;font-weight:600;margin-top:2px}'
    +'.ov-flags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}'
    +'.ov-flag{font-size:12px;font-weight:600;border-radius:6px;padding:3px 8px;border:1px solid var(--border-light);background:var(--card-bg);color:var(--text-muted)}'
    +'.ov-flag.bad{border-color:#f1b4b3;background:#fdecea;color:#c62828;font-weight:700}.ov-flag.warn{border-color:#f0d9a0;background:#fff8e1;color:#8a6100}'
    +'.ov-btns{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.ov-btns .ov-mini{width:auto!important;flex:0 0 auto!important}'
    +'.ov-side{display:flex;flex-direction:column;gap:5px;align-items:flex-end;text-align:right}'
    +'.ov-today{font-size:12px;font-weight:800;color:#fff;background:#025857;border-radius:999px;padding:5px 12px}'
    +'.ov-next{font-size:12px;font-weight:700;color:#025857}.ov-sm{font-size:12px;color:#5c6b68}'
    +'.ov-link{font-size:12px;font-weight:600;color:#2e7d32}.ov-link.warn{color:#8a6100}.ov-link.bad{color:#c62828}'
    +'.ov-grid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px;align-items:start}'
    +'@media(max-width:900px){.ov-grid{grid-template-columns:1fr}.ov-agenda{position:static!important}.ov-side{align-items:flex-start;text-align:left}.ov-kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}}'
    +'.ov-blk{background:var(--card-bg);border:1px solid var(--border-light);border-radius:12px;padding:13px 14px;margin-bottom:12px}'
    +'.ov-bh{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:9px}'
    +'.ov-bh h4{margin:0;font-size:13.5px;color:var(--text-strong)}.ov-bh span{font-size:12px;color:var(--text-muted)}'
    +'.ov-row{display:flex;gap:8px;font-size:12.5px;align-items:flex-start;margin:5px 0}.ov-row>b{min-width:80px;color:var(--text-muted);font-weight:600;font-size:12px}'
    +'.ov-chip{display:inline-block;font-size:12px;font-weight:600;border-radius:999px;padding:2px 9px;background:#e7f3f1;color:#025857;margin:0 4px 3px 0}'
    +'.ov-quote{border-left:3px solid #7aa6a2;padding:1px 0 1px 9px;font-style:italic;color:#4a5a57;font-size:12.5px;white-space:pre-wrap}'
    +'.ov-muted{color:var(--text-muted)}'
    +'.ov-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px}'
    +'.ov-kpi{border:1px solid var(--border-light);border-radius:10px;padding:10px 11px;background:var(--panel-bg,#f6faf9);min-width:0}'
    +'.ov-kpi .l{font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:.04em;text-transform:uppercase}'
    +'.ov-kpi .v{font-size:21px;font-weight:800;color:var(--text-strong);font-variant-numeric:tabular-nums;margin-top:2px}.ov-kpi .v small{font-size:12px;color:var(--text-muted)}'
    +'.ov-kpi .d{font-size:12px;font-weight:700;color:#5c6b68}.ov-kpi .s{font-size:11.5px;color:var(--text-muted);margin-top:3px}'
    +'.ov-good{color:#2e7d32!important}.ov-bad{color:#c62828!important}'
    +'.ov-bar{height:5px;border-radius:3px;background:var(--border-light);overflow:hidden;margin-top:6px}.ov-bar>div{height:100%;background:#0b7a77}'
    +'.ov-pil{display:grid;grid-template-columns:18px 1fr 34px;gap:5px;align-items:center;font-size:11px;color:var(--text-muted);margin-top:4px}.ov-pil .ov-bar{margin:0}'
    +'.ov-days{display:grid;gap:3px;margin-top:11px}.ov-days .ov-d{aspect-ratio:1;max-height:22px}'
    +'.ov-d{display:inline-block;border-radius:3px;background:var(--border-light)}.ov-d.g{background:#2e9e6b}.ov-d.a{background:#f0b429}.ov-d.r{background:#e57373}.ov-d.n{outline:2px solid #7b6fd0;outline-offset:-2px}'
    +'.ov-dayl{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:11px;color:var(--text-muted);margin-top:4px}.ov-dayl i.ov-d{width:9px;height:9px;vertical-align:-1px;margin:0 2px 0 4px}'
    +'.ov-vi{display:grid;grid-template-columns:56px minmax(0,1fr);gap:8px;font-size:12.5px;padding:5px 0;border-top:1px solid var(--border-light)}.ov-vi:first-of-type{border-top:0}'
    +'.ov-vi .dt{font-size:11.5px;font-weight:700;color:var(--text-muted)}.ov-tag{font-weight:700;color:#6f61c9}'
    +'.ov-fb{display:inline-flex;flex-wrap:wrap;gap:2px 10px;vertical-align:top}.ov-fb span{white-space:nowrap}.ov-fb .ov-lo{color:#c62828;font-weight:800}'
    +'.ov-agenda{background:var(--card-bg);border:1.5px solid #0b7a77;border-radius:12px;padding:13px 14px;position:sticky;top:10px}'
    +'.ov-agenda h4{margin:0;font-size:14px;color:#025857}.ov-hint{font-size:11.5px;color:var(--text-muted);margin-bottom:6px}'
    +'.ov-ai{display:flex;gap:7px;align-items:flex-start;padding:6px 0;border-top:1px solid var(--border-light);font-size:12.5px}.ov-ai:first-of-type{border-top:0}'
    +'.ov-ai input{margin-top:3px;accent-color:#025857;flex:none}.ov-ai .tx{flex:1;min-width:0}.ov-ai .tx.done{color:var(--text-muted);text-decoration:line-through}'
    +'.ov-ai .why{display:block;font-size:11.5px;color:var(--text-muted);text-decoration:none}'
    +'.ov-ai .sev{width:7px;height:7px;border-radius:50%;flex:none;margin-top:6px}.sev.r{background:#c62828}.sev.y{background:#f0b429}.sev.b{background:#0b7a77}'
    +'.ov-go{font:inherit;font-size:12px;background:#eef6f4;border:1px solid #cde2dc;border-radius:6px;padding:2px 7px;cursor:pointer;flex:none}'
    +'.ov-sep{border-top:1px dashed var(--border-light);margin:10px 0}'
    +'.ov-notes{width:100%;box-sizing:border-box;min-height:80px;border:1px solid var(--border-light);border-radius:8px;padding:8px;font:inherit;font-size:12.5px;resize:vertical;background:var(--card-bg);color:var(--text-strong)}'
    +'.ov-pa{margin:6px 0}.ov-pa .appt-plan-action-btn{font-size:11.5px;padding:4px 8px}'
    +'.ov-add{width:100%;padding:9px;font-size:13px}'
    +'.ov-link-btn{font:inherit;font-size:12px;background:none;border:0;color:#025857;text-decoration:underline;cursor:pointer;padding:2px 0}'
    +'.ov-done{font-size:12.5px;font-weight:700;color:#2e7d32}'
    +'.ov-nextl{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);margin-top:10px}.ov-nextl input{font-size:12px;border:1px solid var(--border-light);border-radius:5px;padding:2px 4px}'
    +'.ov-mini{font:inherit;font-size:12px;font-weight:700;background:#eef6f4;color:#025857;border:1px solid #cde2dc;border-radius:6px;padding:5px 9px;cursor:pointer}.ov-mini:hover{background:#e0efeb}'
    +'.ov-fold{border:1px solid var(--border-light);border-radius:12px;background:var(--panel-bg,#f6faf9);margin-top:10px}'
    +'.ov-fold>summary{cursor:pointer;padding:11px 14px;font-weight:700;color:#025857;font-size:13px}.ov-fold>summary span{font-weight:400;color:var(--text-muted);font-size:12px}'
    +'.ov-fold .in{padding:0 14px 14px}'
    +'.ov-fchips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px}.ov-fchips button{font:inherit;font-size:12px;font-weight:700;border:1px solid var(--border-light);border-radius:999px;padding:3px 10px;background:var(--card-bg);color:var(--text-muted);cursor:pointer}.ov-fchips button.on{background:#025857;border-color:#025857;color:#fff}'
    +'.ov-feed{position:relative;padding-left:26px}.ov-feed::before{content:"";position:absolute;left:7px;top:4px;bottom:8px;width:2px;background:var(--border-light)}'
    +'.ov-bg{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}'
    +'.ov-chart text{fill:var(--text-muted);font-size:10px}'
    +'</style>'
    +headerHtml
    +'<div class="ov-grid">'
      +'<div style="min-width:0">'+agreedHtml+effortHtml+voiceHtml+chartHtml
        +((!agreedHtml&&!effortHtml&&!voiceHtml&&!chartHtml)?'<div class="ov-blk ov-muted" style="font-size:12.5px">Δεν υπάρχουν ακόμη ραντεβού, μετρήσεις ή καταγραφές από το link. Μόλις υπάρξουν, εδώ θα φαίνεται η πρόοδος από ραντεβού σε ραντεβού.</div>':'')
      +'</div>'
      +agendaHtml
    +'</div>'
    +lower;
}

// low_rating_reasons: παλιά μορφή = λίστα/κείμενο, νέα = {breakfast:['Πεινάω'],...}.
function ovReasons(r){
  var x=r&&r.low_rating_reasons; if(!x) return '';
  if(typeof x==='string') return x;
  if(Array.isArray(x)) return x.join(', ');
  var L=(typeof PF_ROW_LABELS!=='undefined')?PF_ROW_LABELS:{};
  return Object.keys(x).map(function(k){ var v=x[k]; v=Array.isArray(v)?v.join(', '):String(v||''); return v?((L[k]||k)+': '+v):''; }).filter(Boolean).join(' · ');
}
function ovTodayKeyFrom(ts){ var d=new Date(+ts); return (typeof ckDayKey==='function')?ckDayKey(d):d.toISOString().slice(0,10); }

// Βάρος (γραμμή) + λίπος (δεύτερη γραμμή, δική της κλίμακα) ανά μέτρηση· κάθετα σημάδια = ραντεβού με αλλαγή πλάνου.
function ovChartHtml(c,wW,wB,realAppts){
  if(wW.length<2) return '';
  var W=560,H=160,L=34,R=40,T=16,B=26;
  var t0=+new Date(wW[0].date+'T00:00:00'), t1=+new Date(wW[wW.length-1].date+'T00:00:00');
  if(t1<=t0) return '';
  var sx=function(k){ return L+((+new Date(k+'T00:00:00'))-t0)/(t1-t0)*(W-L-R); };
  var ws=wW.map(function(e){return e.weight;}); var goalW=c.goalWeight||null;
  var mn=Math.min.apply(null,ws.concat(goalW&&Math.abs(goalW-ws[ws.length-1])<8?[goalW]:[])), mx=Math.max.apply(null,ws);
  if(mx-mn<2){ var mid=(mx+mn)/2; mn=mid-1; mx=mid+1; }
  mn=Math.floor(mn); mx=Math.ceil(mx);
  var sy=function(v){ return T+(1-(v-mn)/(mx-mn))*(H-T-B); };
  var svg='<svg class="ov-chart" viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Πορεία βάρους και λίπους">';
  [mn,(mn+mx)/2,mx].forEach(function(v){ svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+sy(v)+'" y2="'+sy(v)+'" stroke="var(--border-light)"/><text x="4" y="'+(sy(v)+3)+'">'+ovDec(Math.round(v*10)/10)+'</text>'; });
  if(goalW && goalW>=mn && goalW<=mx) svg+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+sy(goalW)+'" y2="'+sy(goalW)+'" stroke="#0b7a77" stroke-dasharray="4 4" opacity=".6"/><text x="'+(W-R+3)+'" y="'+(sy(goalW)+3)+'" style="fill:#0b7a77">στόχος</text>';
  (realAppts||[]).forEach(function(e){
    if(!(e.planAction==='new'||e.planAction==='adjust')) return;
    var x=sx(e.date); if(x<L||x>W-R) return;
    var m=(typeof apptPlanActionMeta==='function')?apptPlanActionMeta(e.planAction):null;
    svg+='<line x1="'+x+'" x2="'+x+'" y1="'+T+'" y2="'+(H-B)+'" stroke="'+(m?m.color:'#999')+'" stroke-dasharray="2 3" opacity=".55"><title>'+esc(e.date+(m?' · '+m.label:''))+'</title></line>';
  });
  if(wB.length>1){
    var bs=wB.map(function(e){return e.bf;}), bmn=Math.min.apply(null,bs), bmx=Math.max.apply(null,bs); if(bmx-bmn<1){bmn-=.5;bmx+=.5;}
    var by=function(v){ return T+8+(1-(v-bmn)/(bmx-bmn))*(H-T-B-16); };
    var bpts=wB.filter(function(e){return e.date>=wW[0].date && e.date<=wW[wW.length-1].date;});
    if(bpts.length>1){
      svg+='<polyline fill="none" stroke="#7b6fd0" stroke-width="2" stroke-linejoin="round" opacity=".85" points="'+bpts.map(function(e){return sx(e.date)+','+by(e.bf);}).join(' ')+'"/>';
      var lb=bpts[bpts.length-1]; svg+='<circle cx="'+sx(lb.date)+'" cy="'+by(lb.bf)+'" r="3.5" fill="#7b6fd0"/><text x="'+(sx(lb.date)+5)+'" y="'+(by(lb.bf)+12)+'" style="fill:#7b6fd0">'+ovDec(lb.bf,1)+'%</text>';
    }
  }
  svg+='<polyline fill="none" stroke="#025857" stroke-width="2.5" stroke-linejoin="round" points="'+wW.map(function(e){return sx(e.date)+','+sy(e.weight);}).join(' ')+'"/>';
  wW.forEach(function(e,i){ svg+='<circle cx="'+sx(e.date)+'" cy="'+sy(e.weight)+'" r="'+(i===wW.length-1?4.5:3)+'" fill="#025857"><title>'+esc(e.date+': '+e.weight+' kg'+(e.bf>0?' · '+e.bf+'%':''))+'</title></circle>'; });
  var le=wW[wW.length-1]; svg+='<text x="'+(sx(le.date)+6)+'" y="'+(sy(le.weight)-6)+'" style="fill:#025857;font-weight:700">'+ovDec(le.weight)+'</text>';
  svg+='<text x="'+L+'" y="'+(H-8)+'">'+esc(ovDayMonth(wW[0].date))+'</text><text x="'+(W-R)+'" y="'+(H-8)+'" text-anchor="end">'+esc(ovDayMonth(le.date))+'</text>';
  svg+='</svg>';
  return '<div class="ov-blk"><div class="ov-bh"><h4>Πορεία από την αρχή</h4><span><b style="color:#025857">—</b> βάρος · <b style="color:#7b6fd0">—</b> λίπος · διακεκομμένη κάθετη = αλλαγή πλάνου</span></div>'+svg+'</div>';
}

// Πλήρες ιστορικό (η παλιά ροή) — κλειστό, με φίλτρα.
function ovHistoryHtml(c,wl,fb,clogs,appts,realAppts,intakePayload){
  var ev=[];
  function push(ts,kind,title,detail){ if(ts==null||isNaN(+new Date(ts)))return; ev.push({ts:+new Date(ts),kind:kind,title:title,detail:detail||''}); }
  var createdTs=parseInt(String(c.id||'').replace(/^c/,''),10);
  if(createdTs>1e12) push(createdTs,'other','👤 Ο πελάτης δημιουργήθηκε','');
  wl.forEach(function(e){
    var bits=[e.weight!=null?ovDec(e.weight)+' kg':null,(e.bf>0)?ovDec(e.bf)+'% λίπος'+(e.bfMethod?' ('+esc(e.bfMethod)+')':''):null,e.waist?('μέση '+ovDec(e.waist)+' cm'):null].filter(Boolean);
    push(e.date+'T12:00:00','meas','📐 Μέτρηση',bits.join(' · '));
  });
  (c.savedPlans||[]).forEach(function(p){
    var pNote=String(p.note||'').trim();
    push(p.date||p.createdAt,'plan','📱 Πλάνο #'+(p.number||'?')+(p.kind==='sent'?' στάλθηκε':' αποθηκεύτηκε'),(pNote&&!/^\d+$/.test(pNote))?esc(pNote):'');
  });
  if(c.planGeneratedAt){
    var newestSaved=(c.savedPlans||[]).reduce(function(m,p){var t=+new Date(p.date||p.createdAt||0);return t>m?t:m;},0);
    if(c.planGeneratedAt>newestSaved+3600000) push(c.planGeneratedAt,'plan','✨ Το πλάνο (ανα)δημιουργήθηκε','');
  }
  fb.forEach(function(r){
    var sc=[r.breakfast,r.lunch,r.dinner,r.snacks].filter(function(x){return x!=null;});
    var avg=sc.length?Math.round(sc.reduce(function(a,b){return a+(+b||0);},0)/sc.length):null;
    var rtxt=ovReasons(r);
    var det=[]; if(avg!=null) det.push('γεύματα ~'+avg+'/5'); if(r.recipes_ease!=null) det.push('συνταγές '+r.recipes_ease+'/5'); if(r.training_energy!=null) det.push('ενέργεια προπ. '+r.training_energy+'/5'); if(r.continue_likelihood!=null) det.push('θα συνέχιζε '+r.continue_likelihood+'/10');
    push(r.week_start+'T12:00:00','voice','⭐ Feedback εβδομάδας',esc(det.join(' · '))+(rtxt?' — «'+esc(rtxt)+'»':''));
  });
  clogs.forEach(function(l){
    var bits=[]; if(l.weight_kg!=null) bits.push('βάρος (δικό του) '+ovDec(l.weight_kg)+' kg');
    var noteRaw=l.note||'', tm=/^\[tag:(travel|party|sick)\]\s*/.exec(noteRaw);
    if(tm){ var td=(typeof CLIENT_LOG_TAG_DEFS!=='undefined'&&CLIENT_LOG_TAG_DEFS[tm[1]])||null; noteRaw=noteRaw.slice(tm[0].length); if(td) bits.push(esc(td.icon+' '+td.label)); }
    if(noteRaw) bits.push('«'+esc(noteRaw)+'»');
    if(bits.length) push(l.date+'T12:00:00','voice','💬 Καταχώρηση πελάτη',bits.join(' · '));
  });
  realAppts.forEach(function(e){
    var d=[]; if(e.chips&&e.chips.length) d.push(esc(e.chips.join(', '))); if(e.notes) d.push('«'+esc(e.notes)+'»');
    var m=(typeof apptPlanActionMeta==='function')?apptPlanActionMeta(e.planAction):null;
    push(e.date+'T13:00:00','appt','🗓 Ραντεβού'+(m?' · '+m.icon+' '+esc(m.label):''),d.join(' — '));
  });
  appts.filter(function(e){return e.status;}).forEach(function(e){ push(e.date+'T13:00:00','appt','🚫 Απουσία',e.notes?('«'+esc(e.notes)+'»'):''); });
  if(c.intakeSentAt) push(c.intakeSentAt,'other','📋 Ερωτηματολόγιο στάλθηκε','');
  if(c.intakeSubmittedAt) push(c.intakeSubmittedAt,'other','📋 Ερωτηματολόγιο υποβλήθηκε',intakePayload?'σύνοψη στο «Υπόβαθρο»':'');
  ev.sort(function(a,b){return b.ts-a.ts;});
  var DOT={meas:'#4a90d9',plan:'#025857',voice:'#9c8fd9',appt:'#8a9a97',other:'#c5c5c5'};
  var feed=ev.length?ev.map(function(e){
    return '<div class="ov-ev" data-kind="'+e.kind+'" style="position:relative;margin-bottom:12px">'
      +'<span style="position:absolute;left:-26px;top:3px;width:16px;height:16px;border-radius:50%;background:var(--card-bg);border:3px solid '+(DOT[e.kind]||'#bbb')+'"></span>'
      +'<div style="font-size:12px;font-weight:700;color:#7aa6a2;margin-bottom:2px">'+esc(ovDateShort(new Date(e.ts))).toUpperCase()+'</div>'
      +'<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:10px;padding:9px 12px">'
        +'<div style="font-size:13px;font-weight:600;color:var(--text-strong)">'+e.title+'</div>'
        +(e.detail?'<div style="font-size:12px;color:#5c6b68;margin-top:3px">'+e.detail+'</div>':'')
      +'</div></div>';
  }).join(''):'<div class="ov-muted" style="font-size:12px;padding:6px 0">Δεν υπάρχει ιστορικό ακόμη.</div>';
  var F=[['all','Όλα'],['appt','Ραντεβού'],['meas','Μετρήσεις'],['plan','Πλάνα'],['voice','Η φωνή του/της']];
  return '<details class="ov-fold" id="ov-hist"'+(ovFoldOpen('hist')?' open':'')+' ontoggle="ovFoldRemember(\'hist\',this.open)">'
    +'<summary>🗂 Πλήρες ιστορικό <span>'+ev.length+' εγγραφές</span></summary><div class="in">'
    +'<div class="ov-fchips">'+F.map(function(f,i){return '<button type="button" data-f="'+f[0]+'"'+(i===0?' class="on"':'')+' onclick="ovFilterFeed(this)">'+f[1]+'</button>';}).join('')+'</div>'
    +'<div class="ov-feed">'+feed+'</div></div></details>';
}

// Υπόβαθρο: ερωτηματολόγιο, δικές σου σημειώσεις/προτιμήσεις, ιστορικό αναμονών — κλειστό.
function ovBackgroundHtml(c,intakePayload,realAppts){
  var card='background:var(--card-bg);border:1px solid var(--border-light);border-radius:11px;padding:12px 13px';
  var intake='';
  if(intakePayload){
    var p=intakePayload, L=(typeof INTAKE_LBL!=='undefined')?INTAKE_LBL:{};
    var kv=function(k,v){ return v?'<div style="font-size:12px;color:#4a5a57;margin:3px 0"><b style="color:var(--text-strong)">'+k+':</b> '+esc(v)+'</div>':''; };
    var tr=function(dict,keys){ return (keys&&keys.length)?keys.map(function(k){return (L[dict]&&L[dict][k])||k;}).join(', '):''; };
    var hab=p.habits||{};
    intake='<div style="'+card+'"><h4 style="margin:0 0 6px;font-size:12px;color:#025857">📋 Από το ερωτηματολόγιο</h4>'
      +kv('Στόχος',((L.goal&&L.goal[p.goal])||p.goal||'')+((p.goal==='other'&&p.goalOther)?' — '+p.goalOther:''))
      +kv('Ιατρικά',tr('cond',p.conditions))+kv('Αλλεργίες',[tr('allergy',p.allergies),p.allergiesOther].filter(Boolean).join(', '))
      +kv('Αποφεύγει',tr('avoid',p.avoid))+(p.pregnancyBreastfeeding?kv('Εγκυμοσύνη/θηλασμός','Ναι'):'')+kv('Φάρμακα',p.meds)
      +kv('Γεύματα/ημ.',hab.mealsPerDay)+kv('Πρωινό',(L.breakfast&&L.breakfast[hab.breakfast])||hab.breakfast)
      +kv('Μαγείρεμα',(L.cooking&&L.cooking[hab.cooking])||hab.cooking)+kv('Άσκηση',hab.exercise)
      +kv('Αρέσουν',p.likes)+kv('Δεν αρέσουν',p.dislikes)+kv('Σχόλιο',p.note)+'</div>';
  } else if(c.intakeStatus){
    var st={sent:'στάλθηκε — εκκρεμεί',submitted:'υποβλήθηκε '+(c.intakeSubmittedAt?esc(ovDateShort(c.intakeSubmittedAt)):''),superseded:'αντικαταστάθηκε από νεότερο'}[c.intakeStatus]||c.intakeStatus;
    intake='<div style="'+card+'"><h4 style="margin:0 0 6px;font-size:12px;color:#025857">📋 Ερωτηματολόγιο</h4><div style="font-size:12px;color:#5c6b68">'+st+'</div></div>';
  }
  var notes='<div style="'+card+'"><h4 style="margin:0 0 6px;font-size:12px;color:#025857">📝 Σημειώσεις / προτιμήσεις</h4>'
    +'<div style="border:1px dashed #cbd8d5;border-radius:8px;background:var(--panel-bg);padding:8px 10px;font-size:12px;color:#5c6b68;white-space:pre-wrap;min-height:40px">'+(esc(c.preferences||'').trim()||'—')+'</div>'
    +'</div>';
  var waits=(typeof waitHistoryCardHtml==='function')?waitHistoryCardHtml(c):'';
  return '<details class="ov-fold" id="ov-bg"'+(ovFoldOpen('bg')?' open':'')+' ontoggle="ovFoldRemember(\'bg\',this.open)">'
    +'<summary>📋 Υπόβαθρο <span>ερωτηματολόγιο, σημειώσεις, αναμονές</span></summary>'
    +'<div class="in"><div class="ov-bg">'+intake+notes+waits+'</div></div></details>';
}

function ovFoldOpen(k){ try{ return localStorage.getItem('fyh_ov_fold_'+k)==='1'; }catch(e){ return false; } }
function ovFoldRemember(k,open){ try{ localStorage.setItem('fyh_ov_fold_'+k,open?'1':'0'); }catch(e){} }
function ovFilterFeed(btn){
  var f=btn.getAttribute('data-f'), wrap=btn.closest('.in'); if(!wrap) return;
  Array.prototype.forEach.call(wrap.querySelectorAll('.ov-fchips button'),function(b){ b.classList.toggle('on',b===btn); });
  Array.prototype.forEach.call(wrap.querySelectorAll('.ov-ev'),function(e){ e.style.display=(f==='all'||e.getAttribute('data-kind')===f)?'':'none'; });
}
function ovTick(cb){
  var c=getC(); if(!c) return;
  var t=OV_TICKS[c.id]||(OV_TICKS[c.id]={});
  t[cb.getAttribute('data-k')]=cb.checked;
  var tx=cb.parentNode.querySelector('.tx'); if(tx) tx.classList.toggle('done',cb.checked);
}

// Ξαναζωγραφίζει την Επισκόπηση αν φαίνεται — κρατά ό,τι γράφεται στη σημείωση και την επιλεγμένη ενέργεια.
function ovRefresh(){
  var el=document.getElementById('s0ov');
  if(!el || el.style.display!=='block' || typeof getC!=='function') return;
  var c=getC(); if(!c) return;
  var ta=document.getElementById('ov-today-notes'), pa=document.getElementById('ov-plan-action');
  var keepNotes=ta?ta.value:'', keepPa=pa?pa.getAttribute('data-selected'):'';
  var focused=document.activeElement===ta;
  el.innerHTML=buildOverviewHtml(c);
  var ta2=document.getElementById('ov-today-notes');
  if(ta2 && keepNotes){ ta2.value=keepNotes; }
  if(ta2 && focused){ ta2.focus(); }
  if(keepPa){ var b=document.querySelector('#ov-plan-action .appt-plan-action-btn[data-val="'+keepPa+'"]'); if(b && typeof setApptPlanAction==='function') setApptPlanAction(b); }
}

// Γρήγορη καταχώρηση από το δεξί πλαίσιο: ίδια εγγραφή με την πλήρη φόρμα (addAppointmentEntry), χωρίς κλίμακες/chips.
function ovQuickAddAppt(){
  var c=getC(); if(!c) return;
  if(!c.appointments) c.appointments=[];
  var notes=((document.getElementById('ov-today-notes')||{}).value||'').trim();
  var pa=document.getElementById('ov-plan-action');
  var planAction=pa?(pa.getAttribute('data-selected')||''):'';
  var msg=document.getElementById('ov-add-msg');
  if(!notes && !planAction){ if(msg) msg.textContent='Γράψε σημείωση ή διάλεξε ενέργεια για το πλάνο.'; return; }
  c.appointments.push({date:ovTodayKey(),gi:0,compliance:0,chips:[],sportChips:[],notes:notes,flagged:false,planAction:planAction,
    kcalAtEntry:(typeof apptCurrentKcalTarget==='function')?apptCurrentKcalTarget(c):0});
  c.appointments.sort(function(a,b){return a.date<b.date?-1:1;});
  save();
  var s3b=document.getElementById('s3b'); if(s3b && typeof buildAppointmentsHtml==='function') s3b.innerHTML=buildAppointmentsHtml(c);
  var ta=document.getElementById('ov-today-notes'); if(ta) ta.value='';
  ovRefresh();
}
function ovOpenFullForm(editIdx){
  var w=document.getElementById('ov-appt-wrap'); if(!w) return;
  var ta=document.getElementById('ov-today-notes');
  w.open=true;
  if(editIdx>=0 && typeof editAppointmentEntry==='function') editAppointmentEntry(editIdx);
  else if(ta && ta.value){ var full=document.getElementById('appt-notes'); if(full && !full.value) full.value=ta.value; }
  setTimeout(function(){ try{ w.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){} },60);
}
function ovSetNextAppt(val){
  var c=getC(); if(!c) return;
  c.nextAppointmentDate=val||null;
  save();
  ovRefresh();
}

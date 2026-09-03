// js/tabs/home-diets.js
// Two cross-client overview tabs, extracted verbatim from js/app-part5-home.js
// (module split wave 40):
//   ΑΡΧΙΚΗ (home): renderHome + all home* helpers (attention buckets, weight-trend /
//     pregnancy / stale-link / portal-activity alerts, groups card, taste-library
//     status, approaching-renewal, birthdays via c.birthDate, name-days via the
//     curated NAME_DAYS dict + normalizeGreekName, updateHomeNavBadge), plus the
//     portal outreach helpers (isFeedbackReminderWindow, sendFeedbackReminder,
//     weeklyWeightDeltaText, buildWeeklyRecapText, sendWeeklyRecap, sendActivityNudge)
//   ΔΙΑΤΡΟΦΕΣ (diets): renderDiets + diets* helpers + PLAN_RENEWAL_DAYS
// Pure fn declarations + literal tables, zero load-time code. renderHome/renderDiets
// are called (typeof-guarded) from swTab, core/state, 11-undo-redo, app-part2 — all
// runtime. Loads in the tabs/ group.

// ═══════════════════════════════════════════════════════════════
// ΑΡΧΙΚΗ — control-tower dashboard (Phase 2)
// ═══════════════════════════════════════════════════════════════

// Πελάτες (ενεργοί, μη-αρχειοθετημένοι) που χρειάζονται προσοχή για οποιονδήποτε από τους λόγους
// που ήδη χρησιμοποιεί το clientNeedsAttention() (app-part1.js) για την ταξινόμηση στο Πελάτες —
// έτσι τα δύο ταμπ δεν διαφωνούν πια για το ποιος "χρειάζεται προσοχή". Ένας πελάτης χωρίς πλάνο
// ή με πλάνο 30+ ημερών δεν εμφανιζόταν πουθενά στην Αρχική πριν αν είχε πρόσφατη μέτρηση βάρους.
// Ο ξεπερασμένος σύνδεσμος portal εξαιρείται σκόπιμα εδώ (έχει ήδη δική του κάρτα με δικό της κουμπί).
function homeClientsNeedingAttention(){
  var WEIGHT_GAP_DAYS=30, CHECKIN_GAP_DAYS=2, INTAKE_PENDING_DAYS=3;
  var now=Date.now();
  var out=[];
  clients.filter(function(c){return !c.deleted && !c.archived;}).forEach(function(c){
    if(c.attentionSnoozeUntil && now<c.attentionSnoozeUntil) return;
    var flaggedAppt=(c.appointments||[]).slice().reverse().find(function(a){return a.flagged;});
    if(flaggedAppt){
      var flaggedIdx=c.appointments.indexOf(flaggedAppt);
      out.push({c:c,tier:-1,gap:0,label:'🚩 σημειωμένο για παρακολούθηση (ραντεβού '+flaggedAppt.date+')',
        action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();selectClient(\''+c.id+'\');swTab(TAB_APPOINTMENTS);">Δες ραντεβού</button>'
          +'<button type="button" class="hm-action-btn" style="background:#eaf3de;color:#27500a" onclick="event.stopPropagation();homeResolveAppointmentFlag(\''+c.id+'\','+flaggedIdx+')" title="Σήμανση ως διευθετημένο">✅</button>'});
      return;
    }
    if(typeof clientHasLowPlanFeedback==='function' && clientHasLowPlanFeedback(c)){
      var latestPf=window.Cloud.planFeedbackFor(c)[0];
      var npsTxt=latestPf.continue_likelihood!=null?(latestPf.continue_likelihood+'/10 πιθανότητα συνέχισης'):'χαμηλή βαθμολογία σε γεύμα';
      // ✅ 2026-08-01: swTab(3) ήταν η Ανθρωπομετρία, όπου παλιά ζούσε το plan-feedback panel — μετά
      // τη μεταφορά του στο Ραντεβού tab, το κουμπί έδειχνε σε άδεια σελίδα. Διορθώθηκε σε TAB_APPOINTMENTS.
      out.push({c:c,tier:-1,gap:0,label:'😕 χαμηλή ικανοποίηση πλάνου ('+npsTxt+', εβδ. '+latestPf.week_start+')',
        action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();replyToPlanFeedback(\''+c.id+'\',\''+latestPf.week_start+'\',null)">↩️ Απάντησε</button>'});
      return;
    }
    // ✅ 2026-08-01: νέα γραπτή σημείωση πελάτη (client_logs, portal, χωρίς login) — πριν δεν
    // εμφανιζόταν πουθενά στην Αρχική, μόνο ως 💬 badge στη λίστα Πελάτες, οπότε ο διαιτολόγος έπρεπε
    // να ανοίξει κάθε πελάτη για να το δει. Ίδιο tier -1 με 🚩/😕, ίδιο μοτίβο.
    if(typeof clientHasNewClientNote==='function' && clientHasNewClientNote(c)){
      var latestLog=window.Cloud.allClientLogsFor(c)[0];
      out.push({c:c,tier:-1,gap:0,label:'💬 νέα σημείωση πελάτη ('+esc(latestLog.date)+')',
        action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();selectClient(\''+c.id+'\');swTab(TAB_APPOINTMENTS);">Δες σημείωση</button>'});
      return;
    }
    // 📋 Ερωτηματολόγιο εισαγωγής στάλθηκε αλλά δεν συμπληρώθηκε ακόμα (Upgrades Phase 2d).
    // Έρχεται ΠΡΙΝ το "χωρίς πλάνο": δεν μπορείς να ετοιμάσεις πλάνο όσο εκκρεμεί το ερωτηματολόγιο.
    // c.intakeSentAt / c.intakeStatus συντηρούνται από Cloud.sendIntake + fetchIntakeStatus +
    // (μαζικά, στην Αρχική) refreshIntakeStatuses.
    if(c.intakeToken && c.intakeStatus==='sent' && c.intakeSentAt){
      var intakeGap=Math.floor((now-new Date(c.intakeSentAt))/86400000);
      if(intakeGap>=INTAKE_PENDING_DAYS){
        out.push({c:c,tier:0,gap:intakeGap,label:'📋 ερωτηματολόγιο εισαγωγής εκκρεμεί '+intakeGap+' ημέρες',
          action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();homeResendIntake(\''+c.id+'\')">Ξαναστείλε</button>'});
        return;
      }
    }
    var hasPlan=(typeof dietsHasPlan==='function')?dietsHasPlan(c):!!(c.weekPlan&&Object.keys(c.weekPlan).length>0);
    if(!hasPlan){
      out.push({c:c,tier:0,gap:0,label:'χωρίς πλάνο ακόμα',
        action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickCreatePlan(\''+c.id+'\')">Δημιούργησε πλάνο</button>'});
      return;
    }
    if(typeof dietsNeedsRenewal==='function' && dietsNeedsRenewal(c)){
      var daysOld=Math.floor((now-c.planGeneratedAt)/86400000);
      out.push({c:c,tier:1,gap:daysOld,label:'το πλάνο έγινε πριν '+daysOld+' ημέρες',
        action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickCreatePlan(\''+c.id+'\')">Δημιούργησε νέο πλάνο</button>'});
      return;
    }
    var wl=c.weightLog||[];
    var last=wl.length?wl[wl.length-1].date:null;
    var gapDays=last?Math.round((now-new Date(last+'T00:00:00'))/86400000):Infinity;
    if(gapDays>=WEIGHT_GAP_DAYS){
      out.push({c:c,tier:2,gap:gapDays,label:isFinite(gapDays)?(gapDays+' ημ. χωρίς μέτρηση'):'καμία μέτρηση ακόμα'});
      return;
    }
    if(c.shareToken && window.Cloud && window.Cloud.checkinsFor){
      var rows=window.Cloud.checkinsFor(c);
      var ckGap=rows.length?ckDaysSinceLast(rows):Infinity;
      if(rows.length && ckGap>=CHECKIN_GAP_DAYS){
        out.push({c:c,tier:3,gap:ckGap,label:'χωρίς check-in στο portal '+ckGap+' ημέρες',
          action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();sendActivityNudge(\''+c.id+'\')">🔔 Υπενθύμιση</button>'});
      }
    }
  });
  out.forEach(function(x){
    x.action=(x.action||'')+'<button type="button" class="hm-action-btn" style="background:#F1EFE8;color:#5F5E5A" onclick="event.stopPropagation();homeSnoozeClient(\''+x.c.id+'\')" title="Απόκρυψη από τη λίστα για 7 ημέρες">🔕</button>';
  });
  out.sort(function(a,b){ return a.tier!==b.tier ? a.tier-b.tier : b.gap-a.gap; });
  return out;
}
// Κρύβει έναν πελάτη από τις λίστες "χρειάζονται προσοχή" (Αρχική + Διατροφές) για 7 ημέρες —
// η υποκείμενη κατάσταση (χωρίς πλάνο, μπαγιατεμένο κ.λπ.) δεν αλλάζει, απλά δεν ξαναφαίνεται
// μέχρι να περάσει το διάστημα, ώστε "το είδα, θα το ξανακοιτάξω αργότερα" να μην απαιτεί να λυθεί
// οριστικά για να φύγει από τη λίστα.
function homeSnoozeClient(clientId){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  c.attentionSnoozeUntil=Date.now()+7*86400000;
  save();
  // #hm-bucket-list only exists on the Αρχική markup — a cheap way to tell which of the two
  // screens that can show this button is currently on-page, without a separate nav-state variable.
  if(document.getElementById('hm-bucket-list')) renderHome(); else renderDiets();
}

// "Ξαναστείλε" στη γραμμή "ερωτηματολόγιο εισαγωγής εκκρεμεί" (Upgrades Phase 2d) — ανοίγει τον
// πελάτη + το modal αποστολής (link view με WhatsApp/Gmail/copy + «🔄 Νέος σύνδεσμος»).
function homeResendIntake(clientId){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  selectClient(clientId);
  if(typeof openIntakeModal==='function') openIntakeModal();
}

// Πελάτες με στόχο απώλειας/αύξησης (goalMain) που η τάση βάρους τους (τελευταίες έως 5 μετρήσεις,
// γραμμή πρώτη→τελευταία) κινείται ΑΝΤΙΘΕΤΑ από τον στόχο τους — π.χ. στόχος απώλειας αλλά ανεβαίνει.
// Στόχος "διατήρησης" (maintain) εξαιρείται σκόπιμα: δεν υπάρχει "λάθος" κατεύθυνση για να τη σημάνουμε.
// Απαιτεί τουλάχιστον 10 ημέρες span (μειώνει θόρυβο από μία μεμονωμένη διακύμανση) και ρυθμό
// ≥0.15 κ/εβδ αντίθετο στον στόχο (αγνοεί φυσιολογικές ημερήσιες διακυμάνσεις).
function homeWeightTrendAlerts(){
  var MIN_SPAN_DAYS=10, MIN_RATE=0.15;
  var out=[];
  clients.filter(function(c){return !c.deleted && !c.archived && (c.goalMain==='loss'||c.goalMain==='gain');}).forEach(function(c){
    var wl=(c.weightLog||[]).slice(-5);
    if(wl.length<2) return;
    var first=wl[0], last=wl[wl.length-1];
    var days=(new Date(last.date+'T00:00:00')-new Date(first.date+'T00:00:00'))/86400000;
    if(days<MIN_SPAN_DAYS) return;
    var rate=(last.weight-first.weight)/(days/7);
    var wrong=c.goalMain==='loss'?(rate>MIN_RATE):(rate<-MIN_RATE);
    if(!wrong) return;
    out.push({c:c,rate:rate});
  });
  out.sort(function(a,b){ return Math.abs(b.rate)-Math.abs(a.rate); });
  return out;
}

function homeTrendRow(c,rate){
  var arrow=rate>0?'↑':(rate<0?'↓':'→');
  var txt=arrow+' '+(rate>0?'+':'')+rate.toFixed(1)+' κ/εβδ';
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\')">'
    +'<div class="hm-avatar hm-avatar-red">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-trend-badge hm-trend-bad">'+txt+'</span>'
    +'</div>';
}

// Έγκυες πελάτισσες με αύξηση βάρους εκτός του εύρους IOM (βλ. checkGestationalWeightGain, js/app-part1.js) —
// ξεχωριστό από homeWeightTrendAlerts γιατί ο "στόχος" εδώ είναι εύρος, όχι κατεύθυνση loss/gain.
function homePregnancyWeightAlerts(){
  var out=[];
  clients.filter(function(c){return !c.deleted && !c.archived && c.pregnant;}).forEach(function(c){
    var wg=(typeof checkGestationalWeightGain==='function')?checkGestationalWeightGain(c):null;
    if(wg && wg.status!=='ontrack') out.push({c:c,wg:wg});
  });
  return out;
}
function homePregWeightRow(c,wg){
  var txt=wg.status==='above'?('+'+wg.gained+'kg · πάνω από '+wg.range.max+'kg'):('+'+wg.gained+'kg · κάτω από αναμενόμενο');
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\')">'
    +'<div class="hm-avatar hm-avatar-red">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-trend-badge hm-trend-bad">'+txt+'</span>'
    +'</div>';
}

// Πελάτες με δημοσιευμένο σύνδεσμο portal που δείχνει πλέον ξεπερασμένο πλάνο.
function homeStaleLinks(){
  return clients.filter(function(c){return !c.deleted && !c.archived && window.Cloud && window.Cloud.isStale && window.Cloud.isStale(c);});
}

function fmtDateLocal(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
// Πελάτες που καταχώρησαν μέτρηση σήμερα (τοπική ημερομηνία).
function homeMeasuredToday(){
  var today=fmtDateLocal(new Date());
  return clients.filter(function(c){return !c.deleted && !c.archived;})
    .filter(function(c){
      var wl=c.weightLog||[];
      return wl.length && wl[wl.length-1].date===today;
    });
}

// Πελάτες με πρόσφατο check-in στο portal, ταξινομημένοι με το πιο πρόσφατο πρώτα.
// Κάθε εγγραφή κουβαλάει και το σκορ εβδομάδας (ίδιος υπολογισμός με το πάνελ "📲 Πρόοδος
// πελάτη" στο Ραντεβού) + σημαίες hasNote/hasFeedback, ώστε η κάρτα της Αρχικής να δείχνει
// με μια ματιά αν υπάρχει κάτι να διαβάσεις, χωρίς να ανοίξεις τον πελάτη.
function homePortalActivity(){
  if(!window.Cloud || !window.Cloud.checkinsFor) return [];
  var wkStart=ckWeekDates(0)[0];
  return clients.filter(function(c){return !c.deleted && !c.archived && c.shareToken;})
    .map(function(c){
      var rows=window.Cloud.checkinsFor(c);
      var byDate=rows.length?ckRowsByDate(rows):{};
      var score=rows.length?ckWeekScore(byDate,0):null;
      var prevScore=rows.length?ckWeekScore(byDate,-1):null;
      var pillars=rows.length?ckPillarStats(ckWeekDates(0).map(function(k){return byDate[k];}).filter(Boolean)):null;
      var hasNote=(typeof clientHasNewClientNote==='function') && clientHasNewClientNote(c);
      var pfLatest=(window.Cloud.planFeedbackFor?window.Cloud.planFeedbackFor(c)[0]:null);
      var hasFeedback=!!(pfLatest && pfLatest.week_start===wkStart);
      return {c:c, rows:rows, gap:ckDaysSinceLast(rows), score:score, prevScore:prevScore, pillars:pillars, hasNote:hasNote, hasFeedback:hasFeedback};
    })
    .filter(function(x){return x.rows.length && isFinite(x.gap);})
    .sort(function(a,b){return a.gap-b.gap;});
}
// Χρωματιστό chip σκορ εβδομάδας (ίδιες ζώνες με pctStatusColor: ≥66 καλό, 33-65 μέτριο, <33 κακό).
// Στο hover ανοίγει tooltip με ανάλυση ανά πυλώνα (ckPillarStats: γεύματα/νερό/συμπληρώματα).
function homeActivityScoreChipHtml(score,pillars){
  if(score==null) return '';
  var band=score>=66?'good':(score>=33?'warn':'bad');
  return '<span class="hm-act-score hm-act-score-'+band+'" title="Σκορ τήρησης αυτής της εβδομάδας — hover για ανάλυση">'
    +score+'%'+homeActivityPillarsHtml(pillars)+'</span>';
}
// Tooltip περιεχόμενο: μία στήλη ανά πυλώνα με δεδομένα (ημέρες που τηρήθηκε πλήρως / ημέρες με
// καταγραφή). Ο πιο αδύναμος πυλώνας (<60%) βάφεται κόκκινος ώστε να ξεχωρίζει με μια ματιά ΤΙ χάνει.
function homeActivityPillarsHtml(ps){
  if(!ps || !ps.anyData) return '';
  var parts=[];
  function seg(icon,done,tot){
    if(!tot) return;
    var cls=(done/tot)<0.6?' class="hm-pill-lo"':'';
    parts.push('<span'+cls+'>'+icon+' '+done+'/'+tot+'</span>');
  }
  seg('🍽',ps.dietDone,ps.dietTot);
  seg('💧',ps.watDone,ps.watTot);
  seg('💊',ps.supDone,ps.supTot);
  return parts.length?'<span class="hm-pillars">'+parts.join(' · ')+'</span>':'';
}
// Βέλος τάσης vs προηγούμενη εβδομάδα — μόνο όταν η μεταβολή είναι ουσιαστική (CK_TREND_MIN_PP),
// αλλιώς η γραμμή γεμίζει θόρυβο από φυσιολογικές μικροδιακυμάνσεις.
function homeActivityTrendHtml(score,prev){
  if(score==null || prev==null) return '';
  var d=score-prev;
  if(d>=CK_TREND_MIN_PP) return '<span class="hm-act-trend hm-act-trend-up" title="από '+prev+'% την περασμένη εβδομάδα">▲</span>';
  if(d<=-CK_TREND_MIN_PP) return '<span class="hm-act-trend hm-act-trend-down" title="από '+prev+'% την περασμένη εβδομάδα">▼</span>';
  return '';
}
// Γραμμή της κάρτας "📱 Πρόσφατη δραστηριότητα": ίδιο look με homeRow (avatar/όνομα/sub) +
// σκορ % + 💬/⭐ σήματα, και κλικ που πάει ΚΑΤΕΥΘΕΙΑΝ στο tab "📝 Ραντεβού" (εκεί ζει το
// πλήρες πάνελ προόδου/σημειώσεων/feedback), όχι στη γενική καρτέλα του πελάτη.
function homeActivityRow(x,sub){
  var c=x.c;
  var sig='';
  if(x.hasNote) sig+='<span class="hm-act-sig" title="Νέα γραπτή σημείωση πελάτη">💬</span>';
  if(x.hasFeedback) sig+='<span class="hm-act-sig" title="Νέο εβδομαδιαίο feedback πλάνου">⭐</span>';
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\');swTab(TAB_APPOINTMENTS)">'
    +'<div class="hm-avatar hm-avatar-teal">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +sig
    +homeActivityScoreChipHtml(x.score,x.pillars)
    +homeActivityTrendHtml(x.score,x.prevScore)
    +'<span class="hm-act-goto">→ Ραντεβού</span>'
    +'<span class="hm-row-sub">'+sub+'</span>'
    +'</div>';
}

// Πελάτες που ΗΤΑΝ σταθερά ενεργοί στο portal (σκορ σε προηγούμενη εβδομάδα ή/και μεγάλο σερί) και
// έχουν σιωπήσει ≥ CHURN_SILENCE_DAYS ημέρες — early warning για πελάτη που "χάνεται" χωρίς να το πει.
// Ξεχωριστό, πιο αυστηρό σήμα από το tier-3 του homeClientsNeedingAttention (κατώφλι 2 ημ., χωρίς
// απαίτηση προηγούμενης συνέπειας): εδώ μπαίνει ΜΟΝΟ όποιος πραγματικά κατέγραφε τακτικά. skipIds =
// πελάτες που ήδη φαίνονται στη λίστα προσοχής (🚩/😕/💬) ώστε να μη διπλοεμφανίζονται.
function homeStoppedLogging(skipIds){
  if(!window.Cloud || typeof window.Cloud.checkinsFor!=='function') return [];
  var CHURN_SILENCE_DAYS=6;
  return clients.filter(function(c){return !c.deleted && !c.archived && c.shareToken;})
    .filter(function(c){return !(skipIds && skipIds[c.id]);})
    .map(function(c){
      var rows=window.Cloud.checkinsFor(c);
      if(!rows.length) return null;
      var byDate=ckRowsByDate(rows);
      var gap=ckDaysSinceLast(rows);
      if(!isFinite(gap) || gap<CHURN_SILENCE_DAYS) return null;
      var prev1=ckWeekScore(byDate,-1), prev2=ckWeekScore(byDate,-2);
      var wasConsistent=(rows.length>=6) && (prev1!=null || prev2!=null);
      if(!wasConsistent) return null;
      return {c:c, gap:gap, hadScore:(prev1!=null?prev1:prev2),
        run:homeRunEndingAt(byDate, rows[rows.length-1].date)};
    })
    .filter(Boolean)
    .sort(function(a,b){return b.gap-a.gap;});
}
// Μήκος σερί "καλών" ημερών (ckIsGoodDay, Dietologist.html) που ΤΕΛΕΙΩΝΕΙ στο endKey — όπως το
// ckStreak, απλώς αγκυρωμένο σε συγκεκριμένη ημερομηνία αντί για το σήμερα.
function homeRunEndingAt(byDate,endKey){
  var n=0, d=new Date(endKey+'T00:00:00'), guard=0;
  while(ckIsGoodDay(byDate[ckDayKey(d)])){ n++; d.setDate(d.getDate()-1); if(++guard>400) break; }
  return n;
}
function homeStoppedLoggingRow(x){
  var c=x.c;
  var had=x.hadScore!=null
    ? '<span class="hm-churn-had" title="Σκορ εβδομάδας πριν σταματήσει">ήταν '+x.hadScore+'%</span>' : '';
  var runTxt=x.run>=3?' · έχασε 🔥 '+x.run:'';
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\');swTab(TAB_APPOINTMENTS)">'
    +'<div class="hm-avatar hm-avatar-teal">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +had
    +'<span class="hm-row-sub"><span class="hm-churn-sub">σιωπή '+x.gap+' ημέρες</span>'+runTxt+'</span>'
    +'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();sendActivityNudge(\''+c.id+'\')">🔔 Υπενθύμιση</button>'
    +'</div>';
}

// Bottom-3: ενεργοί πελάτες με πλάνο ΚΑΙ πρόσφατο check-in (<=FRESH_DAYS) που έχουν το χαμηλότερο
// σκορ εβδομάδας (<LOW_MAX). Διαφορετικό από το homeStoppedLogging: αυτοί ΚΑΤΑΓΡΑΦΟΥΝ, απλά δεν
// τηρούν το πλάνο -> nudge ή απλούστερο πλάνο. Το «χαμηλό σκορ» δεν είναι σήμα στο
// homeClientsNeedingAttention, οπότε χωρίς αυτή την κάρτα περνάει απαρατήρητο. skipIds ίδια λογική.
function homeLowAdherence(skipIds){
  if(!window.Cloud || typeof window.Cloud.checkinsFor!=='function') return [];
  var LOW_MAX=45, FRESH_DAYS=3;
  return clients.filter(function(c){return !c.deleted && !c.archived && c.shareToken;})
    .filter(function(c){return !(skipIds && skipIds[c.id]);})
    .filter(function(c){return (typeof dietsHasPlan==='function')?dietsHasPlan(c):!!(c.weekPlan&&Object.keys(c.weekPlan).length>0);})
    .map(function(c){
      var rows=window.Cloud.checkinsFor(c);
      if(!rows.length) return null;
      var byDate=ckRowsByDate(rows);
      var gap=ckDaysSinceLast(rows), score=ckWeekScore(byDate,0);
      if(score==null || !isFinite(gap) || gap>FRESH_DAYS || score>=LOW_MAX) return null;
      return {c:c, score:score, gap:gap};
    })
    .filter(Boolean)
    .sort(function(a,b){return a.score-b.score;})
    .slice(0,3);
}
function homeLowAdherenceRow(x){
  var c=x.c;
  var band=x.score>=33?'warn':'bad';
  var sub=x.gap===0?'check-in σήμερα':(x.gap===1?'check-in χθες':'check-in πριν '+x.gap+' μέρες');
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\');swTab(TAB_APPOINTMENTS)">'
    +'<div class="hm-avatar hm-avatar-teal">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-act-score hm-act-score-'+band+'" title="Σκορ τήρησης αυτής της εβδομάδας">'+x.score+'%</span>'
    +'<span class="hm-row-sub">'+sub+'</span>'
    +'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();sendActivityNudge(\''+c.id+'\')">🔔 Υπενθύμιση</button>'
    +'</div>';
}

// «🌱 Πρώτη εβδομάδα» — πελάτες με πλάνο < FIRSTWEEK_DAYS ημερών που ΕΧΟΥΝ αρχίσει check-in (soft-touch,
// ίδιο ύφος με 🎂/🥳: χωρίς κουμπί ενέργειας). Μηδέν check-in -> πάει ήδη στο «χρειάζονται προσοχή»,
// δεν το διπλώνουμε εδώ. Μετράμε μόνο check-in ΑΠΟ τη δημοσίευση του πλάνου (c.planGeneratedAt).
function homeFirstWeek(){
  if(!window.Cloud || typeof window.Cloud.checkinsFor!=='function') return [];
  var FIRSTWEEK_DAYS=10, now=Date.now();
  return clients.filter(function(c){return !c.deleted && !c.archived && c.shareToken && c.planGeneratedAt;})
    .map(function(c){
      var ageD=Math.floor((now-c.planGeneratedAt)/86400000);
      if(ageD<0 || ageD>=FIRSTWEEK_DAYS) return null;
      var rows=window.Cloud.checkinsFor(c);
      if(!rows.length) return null;
      var since=ckDayKey(new Date(c.planGeneratedAt));
      var n=rows.filter(function(r){return r.date>=since;}).length;
      return n?{c:c, ageD:ageD, n:n}:null;
    })
    .filter(Boolean)
    .sort(function(a,b){return a.ageD-b.ageD;});
}
function homeFirstWeekRow(x){
  var ageTxt=x.ageD===0?'σήμερα':(x.ageD===1?'χθες':'πριν '+x.ageD+' μέρες');
  return homeRow(x.c, 'πλάνο '+ageTxt+' · '+x.n+' check-in ✓', 'teal');
}

// Μέση τήρηση ανά ημέρα εβδομάδας (Δε–Κυ), όλοι οι πελάτες με σύνδεσμο, ~4 εβδομάδες. ckOverallScore
// ανά ημέρα -> μέσος όρος ανά weekday. Δείχνει ΠΟΤΕ πέφτει η δέσμευση (π.χ. Κυριακή -> nudge Σάββατο).
function homeWeekdayHeatmap(){
  if(!window.Cloud || typeof window.Cloud.checkinsFor!=='function') return null;
  var sums=[0,0,0,0,0,0,0], cnts=[0,0,0,0,0,0,0];
  var wk0=ckWeekDates(0)[0];
  var minKey=ckDayKey(new Date(new Date(wk0+'T00:00:00').getTime()-21*86400000));
  var todayKey=ckDayKey(new Date());
  clients.filter(function(c){return !c.deleted && !c.archived && c.shareToken;}).forEach(function(c){
    window.Cloud.checkinsFor(c).forEach(function(r){
      if(!r.date || r.date<minKey || r.date>todayKey) return;
      var sc=ckOverallScore(ckPillarStats([r]));
      if(sc==null) return;
      var js=new Date(r.date+'T00:00:00').getDay(), wd=(js===0?6:js-1);
      sums[wd]+=sc; cnts[wd]++;
    });
  });
  if(!cnts.some(function(n){return n>0;})) return null;
  return sums.map(function(s,i){ return cnts[i]?Math.round(s/cnts[i]):null; });
}
function homeWeekdayHeatmapHtml(vals){
  if(!vals) return '';
  var names=['Δε','Τρ','Τε','Πε','Πα','Σα','Κυ'];
  var cells=vals.map(function(v,i){
    var bg=v==null?'var(--panel-bg)':(v>=75?'#0F6E56':v>=60?'#3f9e82':v>=45?'#5DCAA5':v>=33?'#9FE1CB':v>=20?'#f0c39a':'#e79a9a');
    var fg=v==null?'#888':(v<45?'#333':'#fff');
    return '<div style="flex:1;text-align:center">'
      +'<div style="font-size:10px;color:#888;margin-bottom:3px">'+names[i]+'</div>'
      +'<div style="font-size:10px;font-weight:700;padding:5px 0;border-radius:6px;background:'+bg+';color:'+fg+'">'+(v==null?'—':v+'%')+'</div>'
      +'</div>';
  }).join('');
  return '<div class="hm-card hm-card-info"><div class="hm-card-title">🗓 Τήρηση ανά ημέρα (4 εβδ.)</div>'
    +'<div style="display:flex;gap:5px;margin-top:4px">'+cells+'</div></div>';
}

// Ίδιο day-of-week gate με την ⭐ κάρτα feedback στο plan.html (Παρ/Σαβ/Κυρ) — δεν έχει νόημα να
// ζητάμε υπενθύμιση feedback τις μέρες που ο πελάτης δεν βλέπει καν τη φόρμα.
function isFeedbackReminderWindow(){
  var weekDates=ckWeekDates(0);
  return weekDates.indexOf(ckDayKey(new Date()))>=4;
}
// Πελάτες με δημοσιευμένο portal που δεν έχουν στείλει feedback για την ΤΡΕΧΟΥΣΑ εβδομάδα ακόμα.
// Πηγή αλήθειας: τα πραγματικά plan_feedback rows από το cloud (window.Cloud.planFeedbackFor),
// όχι κάποιο τοπικό sync-state του πελάτη — αν η γραμμή υπάρχει εκεί, μετράει ως σταλμένη.
function homeClientsNeedingFeedbackReminder(){
  if(!isFeedbackReminderWindow()) return [];
  var weekStart=ckWeekDates(0)[0];
  if(!window.Cloud || typeof window.Cloud.planFeedbackFor!=='function') return [];
  return clients.filter(function(c){return !c.deleted && !c.archived && c.shareToken;})
    .filter(function(c){
      var latest=window.Cloud.planFeedbackFor(c)[0];
      return !(latest && latest.week_start===weekStart);
    });
}
// Ανοίγει WhatsApp (ή email αν δεν υπάρχει τηλέφωνο) με έτοιμο μήνυμα προς τον ΗΔΗ υπάρχοντα
// σύνδεσμο portal — δεν ξαναδημοσιεύει το πλάνο (ο πελάτης έχει ήδη ενεργό link), απλά ζητάει feedback.
function sendFeedbackReminder(clientId){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c || !c.shareToken) return;
  var base=(window.Cloud&&window.Cloud.PORTAL_BASE)||'https://feedyourhealth.github.io/plan.html';
  var url=base+'?t='+c.shareToken;
  var fname=(c.name||'').split(' ')[0];
  var d=clientMsgDict(c);
  var msg=d.fbReminder(fname,url);
  var phone=normalizePhoneIntl(c.phone);
  var sent=false;
  if(phone){
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
    sent=true;
  } else if(c.email){
    location.href='mailto:'+encodeURIComponent(c.email).replace(/%40/g,'@')+'?subject='+encodeURIComponent(d.fbReminderSubj)+'&body='+encodeURIComponent(msg);
    sent=true;
  } else {
    showErrorToast('Δεν υπάρχει τηλέφωνο ή email για τον/την '+(c.name||'πελάτη')+'.');
  }
  // 2026-08-14: καταγράφουμε ΠΟΤΕ στάλθηκε η τελευταία υπενθύμιση (c.lastReminderSent, cloud-synced
  // σαν κάθε άλλο πεδίο πελάτη) ώστε το digest να δείχνει "υπενθ. πριν Χ" αντί να ξαναφωνάζει το
  // ίδιο μήνυμα σε κάθε άνοιγμα της καρτέλας, ό,τι κι αν έχει ήδη γίνει.
  if(sent){
    c.lastReminderSent=new Date().toISOString();
    save();
    var s3b=document.getElementById('s3b');
    if(s3b && typeof getC==='function' && typeof buildAppointmentsHtml==='function'){
      var cur=getC(); if(cur && cur.id===c.id) s3b.innerHTML=buildAppointmentsHtml(cur);
    }
  }
}

// Μεταβολή βάρους αυτής της εβδομάδας για το ανακεφαλαιωτικό μήνυμα: τελευταία μέτρηση έναντι
// της πιο πρόσφατης μέτρησης πριν από 7+ ημέρες (όχι απλά "πρώτη vs τελευταία αυτής της εβδομάδας"
// — έτσι ο πελάτης βλέπει πραγματική εβδομαδιαία τάση ακόμα κι αν μετριέται σπάνια).
function weeklyWeightDeltaText(c){
  var wl=(c.weightLog||[]).slice().sort(function(a,b){return a.date<b.date?-1:(a.date>b.date?1:0);});
  if(wl.length<2) return null;
  var last=wl[wl.length-1];
  var cutoff=new Date(last.date+'T00:00:00'); cutoff.setDate(cutoff.getDate()-7);
  var cutoffKey=fmtDateLocal(cutoff);
  var base=null;
  for(var i=wl.length-2;i>=0;i--){ if(wl[i].date<=cutoffKey){ base=wl[i]; break; } }
  if(!base) base=wl[0];
  if(base===last) return null;
  var d=Math.round((last.weight-base.weight)*10)/10;
  if(d===0) return null;
  return (d<0?'−':'+')+Math.abs(d).toString().replace('.',',')+'kg';
}
// Πραγματικό ανακεφαλαιωτικό κείμενο εβδομάδας — σκορ/σερί από τα ίδια ckWeekScore/ckStreak που
// υπολογίζουν το πλακίδιο "Χρειάζονται παρακολούθηση" (ίδια πηγή αλήθειας, τα cloud checkins),
// όχι νέα λογική. null αν δεν υπάρχει ΤΙΠΟΤΑ ακόμα να πούμε (νέος πελάτης, καμία δραστηριότητα).
function buildWeeklyRecapText(c){
  if(!window.Cloud || !window.Cloud.checkinsFor) return null;
  var rows=window.Cloud.checkinsFor(c);
  var byDate=ckRowsByDate(rows);
  var score=ckWeekScore(byDate,0);
  var streak=ckStreak(byDate);
  var wDelta=weeklyWeightDeltaText(c);
  var fname=(c.name||'').split(' ')[0];
  var d=clientMsgDict(c);
  var parts=[];
  if(score!=null) parts.push(d.recapAdherence(score));
  if(wDelta) parts.push(d.recapWeight(wDelta));
  if(streak>0) parts.push(d.recapStreak(streak));
  if(!parts.length) return null;
  return d.recap(fname,parts.join(', '));
}
// Στέλνει το πραγματικό ανακεφαλαιωτικό (σκορ/βάρος/σερί) ΣΤΟΝ πελάτη — το αντίστροφο του κουμπιού
// «Κοινοποίησε την πρόοδό σου» στο plan.html, που ο πελάτης πρέπει ο ίδιος να το πατήσει και να
// το μοιραστεί. Εδώ το κείμενο είναι ήδη έτοιμο με πραγματικούς αριθμούς — ένα κλικ του διαιτολόγου.
function sendWeeklyRecap(clientId){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c || !c.shareToken) return;
  var msg=buildWeeklyRecapText(c);
  if(!msg){ showErrorToast('Δεν υπάρχουν ακόμα δεδομένα προόδου για '+(c.name||'τον/την πελάτη')+'.'); return; }
  var phone=normalizePhoneIntl(c.phone);
  if(phone){
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  } else if(c.email){
    location.href='mailto:'+encodeURIComponent(c.email).replace(/%40/g,'@')+'?subject='+encodeURIComponent(clientMsgDict(c).recapSubj)+'&body='+encodeURIComponent(msg);
  } else {
    showErrorToast('Δεν υπάρχει τηλέφωνο ή email για τον/την '+(c.name||'πελάτη')+'.');
  }
}
// Ίδιο μοτίβο με sendFeedbackReminder, αλλά για πελάτες που δεν έχουν κάνει ΚΑΝΕΝΑ check-in στο
// portal εδώ και μέρες (tier 3 στο homeClientsNeedingAttention) — διαφορετικό μήνυμα, ρωτάει αν
// όλα καλά αντί να ζητάει feedback για πλάνο που ίσως δεν έχει καν ανοίξει.
function sendActivityNudge(clientId){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c || !c.shareToken) return;
  var base=(window.Cloud&&window.Cloud.PORTAL_BASE)||'https://feedyourhealth.github.io/plan.html';
  var url=base+'?t='+c.shareToken;
  var fname=(c.name||'').split(' ')[0];
  var d=clientMsgDict(c);
  var msg=d.nudge(fname,url);
  var phone=normalizePhoneIntl(c.phone);
  if(phone){
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  } else if(c.email){
    location.href='mailto:'+encodeURIComponent(c.email).replace(/%40/g,'@')+'?subject='+encodeURIComponent(d.nudgeSubj)+'&body='+encodeURIComponent(msg);
  } else {
    showErrorToast('Δεν υπάρχει τηλέφωνο ή email για τον/την '+(c.name||'πελάτη')+'.');
  }
}

// initials() moved to js/app-part1.js — it's called from renderSB() there, which can run
// (via an early auth-callback in app-part4.js) before this later-loading file exists yet.

// Ενοποιεί τα σήματα του homeClientsNeedingAttention() (tier -1/0/1 = χρειάζονται ενέργεια τώρα)
// και του homeStaleLinks() σε ένα "🔴 Χρειάζονται προσοχή", τα πιο ήπια σήματα (tier 2/3 = μέτρηση/
// check-in gap) σε "🟡 Μπαγιατεμένα", και όλους τους υπόλοιπους ενεργούς πελάτες σε "🟢 Εντάξει".
// Αυτή η λίστα (πλακίδια + γραμμές από κάτω) είναι ΤΟ σημείο για "χρειάζονται προσοχή" στην Αρχική —
// η παλιά ξεχωριστή ⚠️ κάρτα στο grid έδειχνε ακριβώς τους ίδιους πελάτες (union red+amber) και
// αφαιρέθηκε: επανέλαβε το ίδιο σήμα και ανακάτευε επείγον (tier ≤1) με μπαγιάτικο (tier 2/3) χωρίς
// διαχωρισμό, ενώ εδώ κόκκινο/κίτρινο είναι ήδη χωριστά πλακίδια με δικό τους μέτρημα.
function homeAttentionBuckets(){
  var attn=homeClientsNeedingAttention();
  var red=[],amber=[],redIds={};
  // Ξεχωριστός φακός πάνω στα ίδια tier -1 στοιχεία (🚩/😕/💬) — επίτηδες μετράει ΚΑΙ εδώ ΚΑΙ στο
  // red bucket παρακάτω, ώστε το πλακίδιο "Νέα από πελάτες" να δείχνει μόνο ό,τι ήρθε από τον ίδιο
  // τον πελάτη, χωρίς να ανακατεύεται με "χωρίς πλάνο"/"μπαγιατεμένο" που είναι διαχειριστικά, όχι δραστηριότητα.
  var activity=attn.filter(function(x){return x.tier===-1;}).map(function(x){return {c:x.c,label:x.label,action:x.action};});
  // Κρατάμε το x.action (Δημιούργησε πλάνο / 🔔 Υπενθύμιση / ↩️ Απάντησε / 🔕 κ.λπ.) πάνω στη γραμμή —
  // η λίστα κάτω από τα πλακίδια είναι πλέον το μοναδικό σημείο για "χρειάζονται προσοχή", οπότε πρέπει
  // να μπορείς να ενεργήσεις από εκεί χωρίς να ανοίξεις τον πελάτη (πριν, μόνο η καταργημένη ⚠️ κάρτα τα είχε).
  attn.forEach(function(x){
    if(x.tier<=1){ if(!redIds[x.c.id]){redIds[x.c.id]=true;red.push({c:x.c,label:x.label,action:x.action});} }
    else { amber.push({c:x.c,label:x.label,action:x.action}); }
  });
  homeStaleLinks().forEach(function(c){
    if(!redIds[c.id]){redIds[c.id]=true;red.push({c:c,label:'ο σύνδεσμος δείχνει παλιό πλάνο',
      action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();homeQuickRepublish(\''+c.id+'\',this)">Ξαναδημοσίευσε</button>'});}
  });
  var amberIds={}; amber.forEach(function(x){amberIds[x.c.id]=true;});
  var green=clients.filter(function(c){return !c.deleted&&!c.archived&&!redIds[c.id]&&!amberIds[c.id];})
    .map(function(c){return {c:c,label:'ενεργό πλάνο, όλα εντάξει'};});
  return {red:red,amber:amber,green:green,activity:activity};
}
var _homeBucketSel='red';
function homeBucketRow(x,accent){
  return '<div class="hm-row" onclick="selectClient(\''+x.c.id+'\')">'
    +'<div class="hm-avatar hm-avatar-'+accent+'">'+initials(x.c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(x.c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-row-sub">'+x.label+'</span>'
    +(x.action||'')
    +'</div>';
}
// Τίτλος + γραμμές του επιλεγμένου bucket. Ένας helper, δύο κλήσεις (αρχικό render + κάθε αλλαγή
// πλακιδίου) ώστε ο τίτλος να μη χάνεται στο re-render και να μη διπλογράφεται σε δύο σημεία.
var HM_BUCKET_TITLES={
  red:'🔴 Χρειάζονται προσοχή τώρα',
  amber:'🟡 Μπαγιάτικα / χωρίς πρόσφατη μέτρηση',
  green:'🟢 Ενεργοί πελάτες — όλα εντάξει',
  activity:'💬 Νέα από πελάτες'
};
function homeBucketListInnerHtml(buckets){
  buckets=buckets||homeAttentionBuckets();
  var accent=_homeBucketSel==='red'?'red':(_homeBucketSel==='amber'?'amber':'teal');
  var items=buckets[_homeBucketSel]||[];
  var head='<div class="hm-card-title">'+(HM_BUCKET_TITLES[_homeBucketSel]||'')
    +' <span style="font-weight:400;font-size:10px;color:var(--text-muted)">('+items.length+')</span></div>';
  return head+(items.length
    ? items.map(function(x){return homeBucketRow(x,accent);}).join('')
    : '<div class="hm-empty">Κανένας πελάτης σε αυτή την κατηγορία 👍</div>');
}
function homeRenderBucketList(){
  var el=document.getElementById('hm-bucket-list');
  if(!el) return;
  el.innerHTML=homeBucketListInnerHtml();
}
function homeSelectBucket(color){
  _homeBucketSel=color;
  document.querySelectorAll('.hm-tile').forEach(function(t){t.classList.remove('sel');});
  var el=document.getElementById('hm-tile-'+color);
  if(el) el.classList.add('sel');
  homeRenderBucketList();
}

// Ραντεβού με "Ενέργεια για το πλάνο" (νέο/προσαρμογή/μόνο μέτρηση, βλ. APPT_PLAN_ACTIONS στο app-part2.js)
// που δεν έχουν σημανθεί ακόμα ως έγιναν — δίνει στην Αρχική ένα σαφές to-do "τι πλάνο έχω να ετοιμάσω, για ποιον".
// "Ίδιο πλάνο" εξαιρείται σκόπιμα, δεν χρειάζεται καμία ενέργεια.
// excludeIds: πελάτες που ήδη εμφανίζονται στο "⚠️ Χρειάζονται προσοχή" (π.χ. χωρίς πλάνο, σημειωμένοι,
// χαμηλή ικανοποίηση) — δεν έχει νόημα να τους ξαναδείξουμε εδώ, η ενέργεια είναι ήδη σαφής από εκείνο το card.
function homePendingPlanActions(excludeIds){
  var out=[];
  clients.filter(function(c){return !c.deleted && !c.archived && !(excludeIds&&excludeIds[c.id]);}).forEach(function(c){
    (c.appointments||[]).forEach(function(a,idx){
      if(a.planAction && a.planAction!=='same' && !a.planActionDone) out.push({c:c,idx:idx,appt:a});
    });
  });
  out.sort(function(a,b){ return new Date(b.appt.date)-new Date(a.appt.date); });
  return out;
}
function homePendingPlanActionRow(x){
  var m=(typeof apptPlanActionMeta==='function')?apptPlanActionMeta(x.appt.planAction):null;
  var badge=m?'<span class="hm-plan-action-badge" style="--pa-color:'+m.color+'">'+m.icon+' '+esc(m.label)+'</span>':'';
  var days=Math.floor((Date.now()-new Date(x.appt.date))/86400000);
  var sub=days<=0?'ραντεβού σήμερα':(days===1?'ραντεβού χθες':'ραντεβού πριν '+days+' ημέρες');
  return '<div class="hm-row" onclick="selectClient(\''+x.c.id+'\')">'
    +'<div class="hm-avatar hm-avatar-teal">'+initials(x.c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(x.c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-row-sub">'+sub+'</span>'
    +badge
    +'<button type="button" class="hm-action-btn" style="background:#F1EFE8;color:#5F5E5A" onclick="event.stopPropagation();homeResolvePlanAction(\''+x.c.id+'\','+x.idx+')" title="Έγινε — αφαίρεση από τη λίστα">✓</button>'
    +'</div>';
}
// Σημαίνει μια εκκρεμότητα πλάνου ως ολοκληρωμένη· δεν αλλάζει το ίδιο το ραντεβού/ιστορικό, μόνο κρύβεται από τη λίστα.
function homeResolvePlanAction(clientId,apptIdx){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c || !c.appointments || !c.appointments[apptIdx]) return;
  c.appointments[apptIdx].planActionDone=true;
  save();
  renderHome();
}
// Ίδιο μοτίβο με homeResolvePlanAction — resolveAppointmentFlag (app-part2.js) υποθέτει επιλεγμένο
// πελάτη (getC()) και ανανεώνει το #s3b, που δεν υπάρχουν στην Αρχική· εδώ ψάχνουμε τον πελάτη με id
// και ανανεώνουμε ολόκληρη την Αρχική.
function homeResolveAppointmentFlag(clientId,apptIdx){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c || !c.appointments || !c.appointments[apptIdx]) return;
  c.appointments[apptIdx].flagged=false;
  save();
  renderHome();
}

// Ομαδοποίηση πελατών ανά c.group (βλ. getAllGroupNames, app-part1.js), με το ίδιο κόκκινο/κίτρινο/
// πράσινο σήμα του homeAttentionBuckets() ώστε να φαίνεται με μια ματιά ποια ομάδα χρειάζεται προσοχή —
// χρήσιμο όταν πολλαπλοί προπονητές/ομάδες μοιράζονται τον ίδιο λογαριασμό.
function homeGroupBreakdown(buckets){
  var groupNames=(typeof getAllGroupNames==='function')?getAllGroupNames():[];
  if(!groupNames.length) return [];
  var statusOf={};
  buckets.red.forEach(function(x){statusOf[x.c.id]='red';});
  buckets.amber.forEach(function(x){if(!statusOf[x.c.id])statusOf[x.c.id]='amber';});
  var out=groupNames.map(function(g){
    var members=clients.filter(function(c){return !c.deleted && !c.archived && c.group===g;});
    var red=0,amber=0;
    members.forEach(function(c){ if(statusOf[c.id]==='red')red++; else if(statusOf[c.id]==='amber')amber++; });
    return {name:g,total:members.length,red:red,amber:amber};
  });
  out.sort(function(a,b){ return b.red!==a.red?b.red-a.red:b.amber-a.amber; });
  return out;
}
function homeGroupChip(g){
  var accent=g.red>0?'red':(g.amber>0?'amber':'green');
  // Ίδιο μοτίβο διαφυγής μονού εισαγωγικού με app-part2.js (π.χ. :2818) — το group name είναι
  // ελεύθερο κείμενο από τον χρήστη, όχι id, άρα δεν είναι ασφαλές να μπει ωμό μέσα σε onclick="...".
  var gJs=g.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  var sub=g.red>0?(g.red+' 🔴'):(g.amber>0?(g.amber+' 🟡'):'✓ όλα εντάξει');
  return '<span class="hm-group-chip hm-group-chip-'+accent+'" onclick="setClientFilter(\'group\',\''+gJs+'\');swTab(7)" title="Δες τους πελάτες της ομάδας '+esc(g.name)+'">🏷️ '+esc(g.name)+' · '+g.total+' · '+sub+'</span>';
}
function homeGroupsCardHtml(groups){
  if(!groups.length) return '';
  return '<div class="hm-card hm-card-info"><div class="hm-card-title">🏷️ Ανά ομάδα</div>'
    +'<div class="hm-group-chips">'+groups.map(homeGroupChip).join('')+'</div></div>';
}

// Μόνο οι πελάτες που ο διαιτολόγος έχει σημειώσει ⭐ (c.isMealTemplate, βλ. toggleMealTemplate
// στο app-part3.js) τροφοδοτούν την κοινή "βιβλιοθήκη γεύσης" — genPlan τη χρησιμοποιεί ως
// Priority 0, πριν τις έτοιμες συνταγές (βλ. [[dietologist-taste-library]]). Αν πολύ λίγοι είναι
// σημειωμένοι, όλοι οι υπόλοιποι παίρνουν πιο μηχανικά πλάνα χωρίς αυτό να φαίνεται πουθενά αλλού —
// αυτή η κάρτα το κάνει ορατό. Επιστρέφει null όταν η κάλυψη είναι ήδη αρκετή (δεν χρειάζεται νόημα).
var TASTE_LIBRARY_LOW_THRESHOLD=3;
function homeTasteLibraryStatus(){
  var active=clients.filter(function(c){return !c.deleted && !c.archived;});
  if(!active.length) return null;
  var starred=active.filter(function(c){return c.isMealTemplate;});
  if(starred.length>=TASTE_LIBRARY_LOW_THRESHOLD) return null;
  return {starred:starred.length, total:active.length};
}
function homeTasteLibraryCardHtml(status){
  if(!status) return '';
  return '<div class="hm-card hm-card-info"><div class="hm-card-title">🌟 Βιβλιοθήκη γεύσης</div>'
    +'<div class="hm-empty" style="font-style:normal">Μόνο '+status.starred+' από '+status.total+' πελάτες συνεισφέρουν ακόμα (⭐ στο πλάνο τους) — τα υπόλοιπα πλάνα βασίζονται περισσότερο σε έτοιμες συνταγές. Σημείωσε μερικά ακόμα καλά πλάνα με ⭐ για πιο ποικίλα αποτελέσματα σε όλους.</div></div>';
}

// Πελάτες που πλησιάζουν το όριο ανανέωσης πλάνου (βλ. dietsNeedsRenewal/PLAN_RENEWAL_DAYS πιο κάτω
// σε αυτό το αρχείο) αλλά δεν το έχουν περάσει ακόμα — ώστε ο διαιτολόγος να προλάβει να ετοιμάσει το
// επόμενο πλάνο πριν γίνει "μπαγιατεμένο" (tier 1 στο homeClientsNeedingAttention), όχι μόνο αφού συμβεί.
// Πελάτες ήδη σε tier 1 (πέρασαν το όριο) εξαιρούνται σκόπιμα — αυτοί εμφανίζονται ήδη στο κόκκινο.
var RENEWAL_WARNING_DAYS=5;
function homeApproachingRenewal(){
  var out=[];
  clients.filter(function(c){return !c.deleted && !c.archived;}).forEach(function(c){
    if(c.attentionSnoozeUntil && Date.now()<c.attentionSnoozeUntil) return;
    if(!c.planGeneratedAt || !dietsHasPlan(c) || dietsNeedsRenewal(c)) return;
    var threshold=c.renewalDays>0?c.renewalDays:PLAN_RENEWAL_DAYS;
    var daysOld=Math.floor((Date.now()-c.planGeneratedAt)/86400000);
    var daysLeft=threshold-daysOld;
    if(daysLeft>0 && daysLeft<=RENEWAL_WARNING_DAYS) out.push({c:c,daysLeft:daysLeft});
  });
  out.sort(function(a,b){ return a.daysLeft-b.daysLeft; });
  return out;
}
function homeApproachingRenewalRow(x){
  var sub=x.daysLeft===1?'ανανέωση αύριο':'ανανέωση σε '+x.daysLeft+' ημέρες';
  return homeRow(x.c, sub, 'amber',
    '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickCreatePlan(\''+x.c.id+'\')">Δημιούργησε πλάνο τώρα</button>');
}

// Πάει στη σελίδα Πελάτες με καθαρά φίλτρα + μόνο το ζητούμενο status, ώστε ο αριθμός που έδειξε το
// στατιστικό στην Αρχική να ταιριάζει ακριβώς με ό,τι θα δει ο χρήστης μετά το κλικ — αντί να
// κληρονομήσει ένα τυχόν παλιό φίλτρο goal/sport/group/αναζήτησης που έχει μείνει ενεργό από πριν.
function homeGoToClients(status){
  _clientSearchTerm='';
  _clientFilterGoal='';
  _clientFilterSport='';
  _clientFilterGroup='';
  setClientFilter('status',status);
  swTab(7);
}

// Ενημερώνει το κόκκινο badge πάνω στο κουμπί "Αρχική" (sidebar + mobile bottom-nav) με το ίδιο
// νούμερο του κόκκινου tile της Αρχικής, ώστε η εκκρεμότητα να φαίνεται ακόμα κι όταν βρίσκεσαι
// σε άλλο tab. Καλείται από renderSB() (app-part1.js), που τρέχει μετά από σχεδόν κάθε ενέργεια.
function updateHomeNavBadge(){
  var n=0;
  try{ n=homeAttentionBuckets().red.length; }catch(e){ n=0; }
  ['home-nav-badge','home-nav-badge-mobile'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    el.textContent=n>99?'99+':String(n);
    el.style.display=n>0?'inline-block':'none';
  });
}

// Γενέθλια πελατών μέσα στις επόμενες BIRTHDAY_WINDOW_DAYS μέρες — καθαρά ενημερωτικό
// (όχι tier προσοχής/εκκρεμότητας σαν τα υπόλοιπα cards), γι' αυτό ζει στο κάτω μέρος του grid.
// Χρησιμοποιεί το ήδη υπάρχον c.birthDate (ISO "YYYY-MM-DD", ίδιο πεδίο με τη φόρμα πελάτη/ageAtDate).
var BIRTHDAY_WINDOW_DAYS=7;
function homeUpcomingBirthdays(){
  var out=[];
  var today=new Date(); today.setHours(0,0,0,0);
  clients.filter(function(c){return !c.deleted && !c.archived && c.birthDate;}).forEach(function(c){
    var b=new Date(c.birthDate);
    if(isNaN(b.getTime())) return;
    // Τα γενέθλια φέτος, ή του επόμενου χρόνου αν έχουν ήδη περάσει — ώστε το μέτρημα ημερών να
    // δουλεύει σωστά και όταν το παράθυρο τυλίγει γύρω από αλλαγή έτους (π.χ. σήμερα 28 Δεκ, γενέθλια 2 Ιαν).
    var next=new Date(today.getFullYear(), b.getMonth(), b.getDate());
    if(next<today) next=new Date(today.getFullYear()+1, b.getMonth(), b.getDate());
    var daysLeft=Math.round((next-today)/86400000);
    if(daysLeft<=BIRTHDAY_WINDOW_DAYS) out.push({c:c,daysLeft:daysLeft});
  });
  out.sort(function(a,b){ return a.daysLeft-b.daysLeft; });
  return out;
}
function homeBirthdayRow(x){
  var sub=x.daysLeft===0?'🎉 σήμερα!':(x.daysLeft===1?'αύριο':'σε '+x.daysLeft+' ημέρες');
  return homeRow(x.c, sub, 'teal');
}

// Ονομαστικές εορτές — δουλεύει αυτόματα, χωρίς καμία νέα καταχώρηση: βγάζει το μικρό όνομα από το
// ήδη υπάρχον c.name (πρώτη λέξη, ίδια σύμβαση "Όνομα Επώνυμο" με τη φόρμα πελάτη/initials()) και το
// κοιτάζει στο NAME_DAYS. Curated λίστα με τα πιο συνηθισμένα ελληνικά ονόματα — σκόπιμα ΔΕΝ είναι
// εξαντλητική· περιλαμβάνει μόνο ονόματα με σταθερή (όχι κινητή/πασχαλινή) γιορτή που ξέρουμε με
// σιγουριά, ώστε να μη δείξουμε ποτέ λάθος ημερομηνία. Εύκολα επεκτάσιμη με περισσότερα ονόματα.
// Τιμές: [μήνας 1-12, μέρα]. Κλειδιά: πεζά, χωρίς τόνους (βλ. normalizeGreekName).
var NAME_DAYS={
  // — Άνδρες —
  'γιωργος':[4,23],'γεωργιος':[4,23],
  'γιαννης':[1,7],'ιωαννης':[1,7],
  'κωνσταντινος':[5,21],'κωστας':[5,21],'ντινος':[5,21],
  'δημητρης':[10,26],'δημητριος':[10,26],'μητσος':[10,26],
  'νικος':[12,6],'νικολαος':[12,6],
  'χαραλαμπος':[2,10],'μπαμπης':[2,10],
  'παναγιωτης':[8,15],'τακης':[8,15],'πανος':[8,15],
  'αθανασιος':[1,18],'θανασης':[1,18],'νασος':[1,18],
  'ευαγγελος':[3,25],'βαγγελης':[3,25],
  'σπυριδων':[12,12],'σπυρος':[12,12],
  'στυλιανος':[11,26],'στελιος':[11,26],
  'στεφανος':[12,27],
  'βασιλειος':[1,1],'βασιλης':[1,1],'βασος':[1,1],
  'ανδρεας':[11,30],
  'θεοδωρος':[2,17],'θοδωρης':[2,17],
  'παυλος':[6,29],
  'πετρος':[6,29],
  'μιχαηλ':[11,8],'μιχαλης':[11,8],
  'εμμανουηλ':[12,25],'μανωλης':[12,25],
  'αλεξανδρος':[8,30],'αλεκος':[8,30],
  'αντωνιος':[1,17],'αντωνης':[1,17],
  'φωτιος':[2,6],'φωτης':[2,6],
  'γρηγοριος':[1,25],'γρηγορης':[1,25],
  'ηλιας':[7,20],
  'κυριακος':[7,7],
  'σαββας':[12,5],
  'φιλιππος':[11,14],
  'τιμοθεος':[1,22],
  'νεκταριος':[11,9],
  'παντελης':[7,27],'παντελεημων':[7,27],
  // — Γυναίκες —
  'μαρια':[8,15],'μαριαννα':[8,15],'μαρω':[8,15],
  'ελενη':[5,21],'λενα':[5,21],
  'αικατερινη':[11,25],'κατερινα':[11,25],'καιτη':[11,25],
  'ευαγγελια':[3,25],'βαγγελιω':[3,25],
  'δημητρα':[10,26],'μιμη':[10,26],
  'αννα':[12,9],
  'σοφια':[9,17],
  'ειρηνη':[5,5],
  'παρασκευη':[7,26],'βουλα':[7,26],
  'χριστινα':[7,24],
  'βασιλικη':[1,1],'βασω':[1,1],
  'γεωργια':[4,23],
  'κωνσταντινα':[5,21],'ντινα':[5,21],
  'αναστασια':[12,22],'τασια':[12,22],
  'ευφροσυνη':[9,25],'εφη':[9,25],
  'θεοδωρα':[9,11],
  'στυλιανη':[11,26],
  'δεσποινα':[11,21],
  'παναγιωτα':[8,15],'γιωτα':[8,15],
  'αγγελικη':[11,8],
  'θεοφανια':[1,6],'φανη':[1,6],
  'μαρινα':[7,17],
  'νεκταρια':[11,9],
  'ραφαελα':[6,9],
  'σταυρουλα':[9,14],
  'φωτεινη':[2,26],
  'ιωαννα':[1,7],'γιαννα':[1,7]
};
var NAMEDAY_WINDOW_DAYS=7;
function normalizeGreekName(s){
  if(!s) return '';
  var accentMap={'ά':'α','έ':'ε','ή':'η','ί':'ι','ό':'ο','ύ':'υ','ώ':'ω','ϊ':'ι','ΐ':'ι','ϋ':'υ','ΰ':'υ'};
  return s.toLowerCase().trim().split('').map(function(ch){ return accentMap[ch]||ch; }).join('');
}
function homeUpcomingNameDays(){
  var out=[];
  var today=new Date(); today.setHours(0,0,0,0);
  clients.filter(function(c){return !c.deleted && !c.archived && c.name;}).forEach(function(c){
    var firstName=normalizeGreekName(c.name.trim().split(/\s+/)[0]);
    var nd=NAME_DAYS[firstName];
    if(!nd) return;
    var next=new Date(today.getFullYear(), nd[0]-1, nd[1]);
    if(next<today) next=new Date(today.getFullYear()+1, nd[0]-1, nd[1]);
    var daysLeft=Math.round((next-today)/86400000);
    if(daysLeft<=NAMEDAY_WINDOW_DAYS) out.push({c:c,daysLeft:daysLeft});
  });
  out.sort(function(a,b){ return a.daysLeft-b.daysLeft; });
  return out;
}
function homeNameDayRow(x){
  var sub=x.daysLeft===0?'🎉 σήμερα!':(x.daysLeft===1?'αύριο':'σε '+x.daysLeft+' ημέρες');
  return homeRow(x.c, sub, 'teal');
}

function homeRow(c,sub,accent,actionHtml){
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\')">'
    +'<div class="hm-avatar hm-avatar-'+accent+'">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-row-sub">'+sub+'</span>'
    +(actionHtml||'')
    +'</div>';
}

// Επιστρέφει '' όταν δεν υπάρχει τίποτα να δείξει — οι κάρτες της Αρχικής εμφανίζονται μόνο όταν έχουν
// πραγματική εκκρεμότητα, αντί να γεμίζουν τη σελίδα με μόνιμα "όλα εντάξει 👍" καρτέλες.
function homeCard(title,items,moreLabel,variant){
  if(!items.length) return '';
  var html='<div class="hm-card hm-card-'+variant+'"><div class="hm-card-title">'+title+'</div>';
  items.slice(0,8).forEach(function(row){ html+=row; });
  if(items.length>8) html+='<div class="hm-more">+'+(items.length-8)+' '+moreLabel+'</div>';
  html+='</div>';
  return html;
}

// Μια ζώνη της Αρχικής: επικεφαλίδα + πλήθος καρτών + το grid τους. collapsed=true -> <details>
// κλειστό εξ ορισμού (για τα soft-touch, που δεν είναι εκκρεμότητες). Άδεια ζώνη -> ''.
function homeZoneHtml(label, cards, collapsed){
  if(!cards.length) return '';
  var head=label+' <span class="hm-zone-n">'+cards.length+'</span>';
  var grid='<div class="hm-grid">'+cards.join('')+'</div>';
  return collapsed
    ? '<details class="hm-zone"><summary class="hm-zone-h">'+head+'</summary>'+grid+'</details>'
    : '<div class="hm-zone"><div class="hm-zone-h">'+head+'</div>'+grid+'</div>';
}

// Ξαναδημοσιεύει το πλάνο ενός πελάτη απευθείας από την Αρχική, χωρίς να φύγουμε από τη σελίδα.
function homeQuickRepublish(clientId,btn){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  if(!window.Cloud || !window.Cloud.publishPlan){ showErrorToast('Το cloud δεν είναι διαθέσιμο αυτή τη στιγμή.'); return; }
  var orig=btn.textContent;
  btn.disabled=true; btn.textContent='Δημοσίευση...';
  window.Cloud.publishPlan(c).then(function(){
    renderHome();
  }).catch(function(e){
    btn.disabled=false; btn.textContent=orig;
    showErrorToast('Σφάλμα δημοσίευσης: '+(e.message||''));
  });
}

// Ξαναδημοσιεύει ΟΛΟΥΣ τους πελάτες με ξεπερασμένο σύνδεσμο σε ένα κλικ, αντί ένα-ένα με το
// υπάρχον κουμπί ανά πελάτη. Σειριακά (ένα-ένα προς το cloud, όχι ταυτόχρονα) — γλιτώνει τα
// επαναλαμβανόμενα κλικ, δεν είναι ακαριαίο. Συνεχίζει και μετά από τυχόν αποτυχία ενός πελάτη,
// ώστε ένα σφάλμα να μην μπλοκάρει την υπόλοιπη παρτίδα.
function homeBulkRepublish(btn){
  var staleClients=homeStaleLinks();
  if(!staleClients.length) return;
  if(!window.Cloud || !window.Cloud.publishPlan){ showErrorToast('Το cloud δεν είναι διαθέσιμο αυτή τη στιγμή.'); return; }
  btn.disabled=true;
  var idx=0, failed=[];
  function next(){
    if(idx>=staleClients.length){
      if(failed.length) showErrorToast('Απέτυχε η δημοσίευση για: '+failed.map(function(c){return c.name||'πελάτη';}).join(', '));
      renderHome();
      return;
    }
    var c=staleClients[idx];
    btn.textContent='Δημοσίευση... ('+(idx+1)+'/'+staleClients.length+')';
    window.Cloud.publishPlan(c).then(function(){ idx++; next(); }).catch(function(){ failed.push(c); idx++; next(); });
  }
  next();
}

function renderHome(){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;

  if(!clients || !clients.length){
    main.innerHTML='<div class="empty" id="empty-state">'
      +'<div style="font-size:64px;margin-bottom:12px">👥</div>'
      +'<div style="font-size:16px;font-weight:600;margin-bottom:8px;color:#025857">Καλώς ήρθες στον Διαιτολόγο!</div>'
      +'<div style="font-size:13px;color:var(--text-muted);margin-bottom:20px;max-width:400px">Δημιουργήστε τον πρώτο σας πελάτη για να ξεκινήσετε τη διαχείριση διατροφικών σχεδίων</div>'
      +'<button class="btn primary" onclick="addClient()" style="font-size:14px;padding:12px 24px;">+ Δημιουργήστε Πρώτο Πελάτη</button>'
      +'</div>';
    renderSB();
    return;
  }

  var _visibleClients=clients.filter(function(c){return !c.deleted&&!c.archived;});
  var metrics={
    total:_visibleClients.length,
    active:_visibleClients.filter(function(c){return c.weekPlan&&Object.keys(c.weekPlan).length>0;}).length
  };
  // attentionIds τροφοδοτεί μόνο το homePendingPlanActions() πιο κάτω (εξαιρεί πελάτες που ήδη
  // φαίνονται στη λίστα προσοχής). Οι ίδιες οι γραμμές "χρειάζονται προσοχή" ζωγραφίζονται πλέον
  // αποκλειστικά από τη λίστα πλακιδίων (homeAttentionBuckets), όχι από ξεχωριστή ⚠️ κάρτα.
  var attentionIds={};
  homeClientsNeedingAttention().forEach(function(x){attentionIds[x.c.id]=true;});
  var staleClients=homeStaleLinks();
  var staleRows=staleClients.map(function(c){
    return homeRow(c,'ο σύνδεσμος δείχνει παλιό πλάνο','amber',
      '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();homeQuickRepublish(\''+c.id+'\',this)">Ξαναδημοσίευσε</button>');
  });
  // Bulk κουμπί μόνο όταν αξίζει (2+ πελάτες) — για 1 το ήδη υπάρχον ανά-γραμμή κουμπί αρκεί.
  var staleCardTitle='🔗 Ξεπερασμένοι σύνδεσμοι'+(staleClients.length>1
    ?(' <button type="button" class="hm-action-btn" onclick="event.stopPropagation();homeBulkRepublish(this)">Ξαναδημοσίευσε όλους ('+staleClients.length+')</button>')
    :'');
  var activityRows=homePortalActivity().map(function(x){
    var sub=x.gap===0?'σήμερα':(x.gap===1?'χθες':'πριν '+x.gap+' ημέρες');
    return homeActivityRow(x,sub);
  });
  var stoppedLoggingRows=homeStoppedLogging(attentionIds).map(homeStoppedLoggingRow);
  var lowAdherenceRows=homeLowAdherence(attentionIds).map(homeLowAdherenceRow);
  var firstWeekRows=homeFirstWeek().map(homeFirstWeekRow);
  var weekdayHeat=homeWeekdayHeatmap();
  var trendRows=homeWeightTrendAlerts().map(function(x){ return homeTrendRow(x.c,x.rate); });
  var pregWeightRows=homePregnancyWeightAlerts().map(function(x){ return homePregWeightRow(x.c,x.wg); });
  var reminderRows=homeClientsNeedingFeedbackReminder().map(function(c){
    return homeRow(c,'δεν έχει στείλει feedback ακόμα','teal',
      '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();sendFeedbackReminder(\''+c.id+'\')">🔔 Υπενθύμιση</button>'
      +'<button type="button" class="hm-action-btn" style="background:#e8f5e9;color:var(--good)" onclick="event.stopPropagation();sendWeeklyRecap(\''+c.id+'\')" title="Στείλε έτοιμη ανακεφαλαίωση με σκορ/βάρος/σερί">📊 Ανακεφαλαίωση</button>');
  });
  var pendingPlanRows=homePendingPlanActions(attentionIds).map(homePendingPlanActionRow);
  var approachingRenewalRows=homeApproachingRenewal().map(homeApproachingRenewalRow);
  var birthdayRows=homeUpcomingBirthdays().map(homeBirthdayRow);
  var nameDayRows=homeUpcomingNameDays().map(homeNameDayRow);

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">🏠 Αρχική</div>';

  var buckets=homeAttentionBuckets();
  // Προεπιλογή κόκκινο· αλλά αν το κόκκινο είναι άδειο ενώ υπάρχουν μπαγιάτικα, ξεκίνα στο κίτρινο —
  // αλλιώς μια άδεια λίστα "χρειάζονται προσοχή" διαβάζεται σαν "τίποτα να κάνω" ενώ υπάρχουν εκκρεμότητες.
  _homeBucketSel=(buckets.red.length===0 && buckets.amber.length>0)?'amber':'red';
  // key = bucket του homeAttentionBuckets / id-suffix / όρισμα homeSelectBucket· cssColor = υπάρχουσα
  // κλάση χρώματος στο styles.css (το "activity" bucket δανείζεται το .hm-tile-teal, δεν έχει δικό του).
  var _hmTile=function(key,cssColor,num,lbl){
    return '<div class="hm-tile hm-tile-'+cssColor+(_homeBucketSel===key?' sel':'')+'" id="hm-tile-'+key+'" onclick="homeSelectBucket(\''+key+'\')">'
      +'<div class="hm-tile-num">'+num+'</div><div class="hm-tile-lbl">'+lbl+'</div></div>';
  };
  html+='<div class="hm-tiles">'
    +_hmTile('red','red',buckets.red.length,'🔴 Χρειάζονται προσοχή')
    +_hmTile('amber','amber',buckets.amber.length,'🟡 Μπαγιατεμένα πλάνα')
    +_hmTile('green','green',buckets.green.length,'🟢 Ενεργοί, εντάξει')
    +_hmTile('activity','teal',buckets.activity.length,'💬 Νέα από πελάτες')
    +'</div>'
    +'<div class="hm-card" style="margin-bottom:20px" id="hm-bucket-list">'+homeBucketListInnerHtml(buckets)+'</div>';

  var measuredToday=homeMeasuredToday();
  // ✅ Ring "ενεργοί με πρόσφατο check-in" — πάνω στο ΗΔΗ υπάρχον homePortalActivity()/checkinsFor(),
  // την ίδια πηγή αλήθειας που τροφοδοτεί το tile "💬 Νέα από πελάτες" πιο πάνω. Παρονομαστής: πελάτες
  // που έχουν καν σύνδεσμο portal (c.shareToken) — όσοι δεν έχουν στείλει ποτέ πλάνο δεν έχουν πώς να
  // κάνουν check-in, δεν πρέπει να τραβάνε το ποσοστό προς τα κάτω σαν να αδιαφορούν.
  var _withLink=clients.filter(function(c){return !c.deleted&&!c.archived&&c.shareToken;});
  var _recentActiveN=homePortalActivity().filter(function(x){return x.gap<=7;}).length;
  var _activePct=_withLink.length?Math.round(_recentActiveN/_withLink.length*100):null;
  // «Παλμός πρακτικής»: Μ.Ο. σκορ τήρησης portal αυτή την εβδομάδα + μεταβολή vs προηγούμενη
  // (ckWeekScore 0 vs -1, μόνο πελάτες με δεδομένα). Το «−N» εδώ πιάνει κάτι συστημικό πριν
  // φανεί πελάτη-πελάτη στις κάρτες.
  function _avgWk(off){
    var v=_withLink.map(function(c){
      var r=(window.Cloud&&window.Cloud.checkinsFor)?window.Cloud.checkinsFor(c):[];
      return r.length?ckWeekScore(ckRowsByDate(r),off):null;
    }).filter(function(x){return x!=null;});
    return v.length?Math.round(v.reduce(function(a,b){return a+b;},0)/v.length):null;
  }
  var _avgAdh=_avgWk(0), _avgAdhPrev=_avgWk(-1);
  var _adhWow=(_avgAdh!=null&&_avgAdhPrev!=null)?(_avgAdh-_avgAdhPrev):null;
  html+='<div class="hm-stats">'
    +'<div class="hm-stat hm-stat-clickable" onclick="homeGoToClients(\'\')" onkeydown="if(event.key===\'Enter\')homeGoToClients(\'\')" role="button" tabindex="0" title="Δες όλους τους πελάτες"><div class="hm-stat-num">'+metrics.total+'</div><div class="hm-stat-lbl">Πελάτες</div></div>'
    +'<div class="hm-stat hm-stat-clickable" onclick="homeGoToClients(\'active\')" onkeydown="if(event.key===\'Enter\')homeGoToClients(\'active\')" role="button" tabindex="0" title="Δες πελάτες με ενεργό πλάνο"><div class="hm-stat-num">'+metrics.active+'</div><div class="hm-stat-lbl">Ενεργά πλάνα</div></div>'
    +'<div class="hm-stat hm-stat-clickable" onclick="toggleQA(\'qa-quickmeasure\')" onkeydown="if(event.key===\'Enter\')toggleQA(\'qa-quickmeasure\')" role="button" tabindex="0" title="Άνοιγμα γρήγορης μέτρησης"><div class="hm-stat-num">'+measuredToday.length+'</div><div class="hm-stat-lbl">Μετρήσεις σήμερα</div>'
    +(measuredToday.length?'<div class="hm-stat-names">'+measuredToday.map(function(c){return esc(c.name||'');}).join(', ')+'</div>':'')
    +'</div>'
    +(_activePct==null?'':(
      '<div class="hm-stat hm-stat-clickable" onclick="homeGoToClients(\'\')" onkeydown="if(event.key===\'Enter\')homeGoToClients(\'\')" role="button" tabindex="0" title="Πελάτες με check-in στις τελευταίες 7 μέρες, από όσους έχουν σύνδεσμο portal" style="display:flex;align-items:center;gap:10px;justify-content:center">'
      +pctRing(_activePct,{size:48,thickness:6,color:pctStatusColor(_activePct),track:'var(--panel-bg)'})
      +'<span style="text-align:left"><span class="hm-stat-lbl" style="display:block">Ενεργοί με<br>check-in (7 ημ.)</span></span>'
      +'</div>'
    ))
    +(_avgAdh==null?'':(
      '<div class="hm-stat" title="Μέσος όρος σκορ τήρησης portal αυτή την εβδομάδα, από πελάτες με σύνδεσμο">'
      +'<div class="hm-stat-num">'+_avgAdh+'%</div><div class="hm-stat-lbl">Μ.Ο. τήρησης (εβδ.)</div>'
      +(_adhWow==null?'':(function(){
        var big=Math.abs(_adhWow)>=CK_TREND_MIN_PP;
        var cls=!big?'flat':(_adhWow>0?'up':'dn');
        var txt=!big?'≈ ίδιο':(_adhWow>0?'▲ +'+_adhWow:'▼ '+_adhWow);
        return '<div class="hm-stat-wow '+cls+'">'+txt+' vs προηγ.</div>';
      })())
      +'</div>'
    ))
    +'</div>';

  var groupBreakdown=homeGroupBreakdown(buckets);
  var tasteLibraryStatus=homeTasteLibraryStatus();
  // 3 ζώνες αντί για έναν επίπεδο τοίχο ~11 καρτών: «Δράση τώρα» (κόκκινες/warning που θέλουν
  // ενέργεια), «Παρακολούθηση» (portal σήματα + admin), «Soft-touch» (💛, collapsed — δεν είναι
  // εκκρεμότητες). Καμία κάρτα δεν αφαιρείται· η homeCard() επιστρέφει '' όταν είναι άδεια.
  var zActNow=[
    homeCard('📈 Τάση βάρους', trendRows, 'ακόμα', 'danger'),
    homeCard('🤰 Αύξηση βάρους κύησης', pregWeightRows, 'ακόμα', 'danger'),
    homeCard('📋 Εκκρεμότητες πλάνου', pendingPlanRows, 'ακόμα', 'warning'),
    homeCard(staleCardTitle, staleRows, 'ακόμα', 'warning'),
    homeCard('🔜 Πλησιάζει ανανέωση', approachingRenewalRows, 'ακόμα', 'warning')
  ].filter(Boolean);
  var zWatch=[
    homeCard('📉 Σταμάτησαν να καταγράφουν', stoppedLoggingRows, 'ακόμα', 'warning'),
    homeCard('📊 Χαμηλή τήρηση αυτή την εβδομάδα', lowAdherenceRows, 'ακόμα', 'warning'),
    isFeedbackReminderWindow()?homeCard('🔔 Υπενθύμιση feedback', reminderRows, 'ακόμα', 'info'):'',
    homeCard('📱 Πρόσφατη δραστηριότητα', activityRows, 'ακόμα', 'info'),
    weekdayHeat?homeWeekdayHeatmapHtml(weekdayHeat):'',
    groupBreakdown.length?homeGroupsCardHtml(groupBreakdown):'',
    tasteLibraryStatus?homeTasteLibraryCardHtml(tasteLibraryStatus):''
  ].filter(Boolean);
  var zSoft=[
    homeCard('🌱 Πρώτη εβδομάδα', firstWeekRows, 'ακόμα', 'info'),
    homeCard('🎂 Γενέθλια', birthdayRows, 'ακόμα', 'info'),
    homeCard('🥳 Ονομαστικές εορτές', nameDayRows, 'ακόμα', 'info')
  ].filter(Boolean);

  if(zActNow.length+zWatch.length+zSoft.length){
    html+=homeZoneHtml('⚠️ Δράση τώρα', zActNow, false)
        +homeZoneHtml('👁 Παρακολούθηση', zWatch, false)
        +homeZoneHtml('💛 Soft-touch', zSoft, true);
  } else {
    html+='<div class="hm-empty" style="text-align:center;padding:20px 0">Καμία εκκρεμότητα αυτή τη στιγμή — όλοι οι πελάτες είναι εντάξει 👍</div>';
  }

  html+='</div>';

  main.innerHTML=html;
  renderSB();
}

// ═══════════════════════════════════════════════════════════════
// ΔΙΑΤΡΟΦΕΣ — cross-client plan overview (Phase 4)
// ═══════════════════════════════════════════════════════════════

function dietsHasPlan(c){ return !!(c.weekPlan && Object.keys(c.weekPlan).length>0); }

// Οι πραγματικοί πελάτες ξαναέρχονται για νέο πλάνο κάθε ~30-40 μέρες — μετά τις 30 το πλάνο
// θεωρείται προς ανανέωση. Άγνωστη ημερομηνία δημιουργίας (πλάνα από πριν αυτό το feature) = δεν επισημαίνεται.
// c.renewalDays υπερισχύει όταν έχει οριστεί ρητά ανά πελάτη (π.χ. 14 ημέρες για αγωνιστή σε
// προετοιμασία, ή 45 για πελάτη διατήρησης) — βλ. setClientRenewalDays().
var PLAN_RENEWAL_DAYS=30;
function dietsNeedsRenewal(c){
  var threshold=c.renewalDays>0?c.renewalDays:PLAN_RENEWAL_DAYS;
  return !!(c.planGeneratedAt && (Date.now()-c.planGeneratedAt)/86400000>=threshold);
}
// Θέτει προσαρμοσμένο όριο ανανέωσης για έναν πελάτη (αντί του καθολικού PLAN_RENEWAL_DAYS).
function setClientRenewalDays(clientId,val){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  var n=parseInt(val,10);
  if(!n||n<1) return;
  c.renewalDays=n;
  save();
  renderDiets();
}

// Χωρίς πλάνο ακόμα, ή με δημοσιευμένο σύνδεσμο που δείχνει ξεπερασμένο πλάνο, ή πλάνο που χρειάζεται ανανέωση.
// Πελάτες σε αναβολή (homeSnoozeClient) εξαιρούνται προσωρινά — η υποκείμενη κατάσταση δεν αλλάζει.
function dietsNeedsAction(){
  return clients.filter(function(c){return !c.deleted && !c.archived;})
    .filter(function(c){ return !(c.attentionSnoozeUntil && Date.now()<c.attentionSnoozeUntil); })
    .filter(function(c){ return !dietsHasPlan(c) || (window.Cloud&&window.Cloud.isStale&&window.Cloud.isStale(c)) || dietsNeedsRenewal(c); });
}
// Ενεργός πελάτης με τρέχον πλάνο που δεν χρειάζεται ενέργεια.
function dietsActive(){
  return clients.filter(function(c){return !c.deleted && !c.archived;})
    .filter(function(c){ return dietsHasPlan(c) && !(window.Cloud&&window.Cloud.isStale&&window.Cloud.isStale(c)) && !dietsNeedsRenewal(c); });
}
// Αρχειοθετημένοι πελάτες που έχουν πλάνο — κρατιέται ως ιστορικό αναφοράς.
function dietsHistory(){
  return clients.filter(function(c){return !c.deleted && c.archived && dietsHasPlan(c);});
}

function dietsRow(c,sub,actionHtml,accent){
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\');swTab(2)">'
    +'<div class="hm-avatar'+(accent?' hm-avatar-'+accent:'')+'">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-row-sub">'+sub+'</span>'
    +(actionHtml||'')
    +'</div>';
}

// Δημιουργεί πλάνο απευθείας από τη λίστα "Χρειάζονται ενέργεια" — ίδιο μονοπάτι με το "Ξεκίνα πλάνο τώρα" (Phase 1):
// πάει στον πελάτη και προσπαθεί να γεννήσει πλάνο, ώστε η υπάρχουσα επικύρωση/toast να συνεχίσει να ισχύει.
function dietsQuickCreatePlan(clientId){
  selectClient(clientId);
  genPlanWithUndo();
}

// Ξαναδημοσιεύει το πλάνο ενός πελάτη χωρίς να φύγουμε από τη λίστα Διατροφές.
function dietsQuickRepublish(clientId,btn){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  if(!window.Cloud || !window.Cloud.publishPlan){ showErrorToast('Το cloud δεν είναι διαθέσιμο αυτή τη στιγμή.'); return; }
  var orig=btn.textContent;
  btn.disabled=true; btn.textContent='Δημοσίευση...';
  window.Cloud.publishPlan(c).then(function(){
    renderDiets();
  }).catch(function(e){
    btn.disabled=false; btn.textContent=orig;
    showErrorToast('Σφάλμα δημοσίευσης: '+(e.message||''));
  });
}

function dietsSection(title,items,rowFn,emptyText,variant){
  var html='<div class="hm-card'+(variant?' hm-card-'+variant:'')+'" style="margin-bottom:16px"><div class="hm-card-title">'+esc(title)+' ('+items.length+')</div>';
  if(!items.length){ html+='<div class="hm-empty">'+emptyText+'</div>'; }
  else { items.forEach(function(c){ html+=rowFn(c); }); }
  html+='</div>';
  return html;
}

function renderDiets(){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;

  var html='<div class="hm-wrap">';
  html+='<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px">'
    +'<div class="hm-title" style="margin-bottom:0">📊 Διατροφές</div>'
    +'<button type="button" class="hm-action-btn" style="padding:8px 14px;font-size:12px" onclick="showTrackingDashboard()">📈 Στατιστικά Γευμάτων</button>'
    +'</div>';

  html+=dietsSection('🔴 Χρειάζονται ενέργεια', dietsNeedsAction(), function(c){
    // Προτεραιότητα: "χωρίς πλάνο" > "ξεπερασμένος σύνδεσμος" > "χρειάζεται ανανέωση" — ένας πελάτης
    // με άδειο weekPlan αλλά παλιό δημοσιευμένο hash θα δείξει isStale()=true κι αυτός, αλλά χρειάζεται
    // νέο πλάνο πρώτα, όχι απλή επαναδημοσίευση του κενού.
    var snoozeBtn='<button type="button" class="hm-action-btn" style="background:#F1EFE8;color:#5F5E5A" onclick="event.stopPropagation();homeSnoozeClient(\''+c.id+'\')" title="Απόκρυψη για 7 ημέρες">🔕</button>';
    if(!dietsHasPlan(c)){
      return dietsRow(c, 'χωρίς πλάνο ακόμα', '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickCreatePlan(\''+c.id+'\')">Δημιούργησε πλάνο</button>'+snoozeBtn, 'red');
    }
    if(window.Cloud && window.Cloud.isStale && window.Cloud.isStale(c)){
      return dietsRow(c, 'ο σύνδεσμος δείχνει παλιό πλάνο', '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickRepublish(\''+c.id+'\',this)">Ξαναδημοσίευσε</button>'+snoozeBtn, 'red');
    }
    var daysOld=Math.floor((Date.now()-c.planGeneratedAt)/86400000);
    // ✅ 2026-08-22: class="renewal-days-inp" — το inline style κάτω μένει ως desktop/mouse
    // baseline (compact 34px), το class δίνει ένα touch-only μεγέθυνσης hook (css/styles.css,
    // @media(hover:none)) χωρίς να πειράζει την πυκνή desktop εμφάνιση.
    var thresholdInp='<span style="font-size:10px;color:var(--text-muted);margin-left:6px;white-space:nowrap" title="Όριο ανανέωσης για αυτόν τον πελάτη" onclick="event.stopPropagation()">⚙ <input type="number" class="renewal-days-inp" value="'+(c.renewalDays||PLAN_RENEWAL_DAYS)+'" min="7" max="120" style="width:34px;font-size:10px;padding:1px 3px;border:1px solid var(--border-light);border-radius:4px" onchange="setClientRenewalDays(\''+c.id+'\',this.value)"> ημ.</span>';
    return dietsRow(c, 'το πλάνο έγινε πριν '+daysOld+' ημέρες'+thresholdInp, '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickCreatePlan(\''+c.id+'\')">Δημιούργησε νέο πλάνο</button>'+snoozeBtn, 'red');
  }, 'Όλοι είναι εντάξει 👍', 'danger');

  html+=dietsSection('🟢 Ενεργά', dietsActive(), function(c){
    return dietsRow(c, 'τελ. ενημέρωση '+fmtLastAccess(c.lastAccess), null, 'green');
  }, 'Κανένας πελάτης με ενεργό πλάνο ακόμα', 'success');

  html+=dietsSection('📁 Ιστορικό', dietsHistory(), function(c){
    return dietsRow(c, c.archivedAt?('αρχειοθετήθηκε '+fmtLastAccess(new Date(c.archivedAt).getTime())):'αρχειοθετημένος');
  }, 'Κανένας αρχειοθετημένος πελάτης με πλάνο');

  html+='</div>';

  main.innerHTML=html;
  renderSB();
}


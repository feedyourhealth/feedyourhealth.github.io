// ═══════════════════════════════════════════════════════════════
// ΑΡΧΙΚΗ — control-tower dashboard (Phase 2)
// ═══════════════════════════════════════════════════════════════

// Πελάτες (ενεργοί, μη-αρχειοθετημένοι) που χρειάζονται προσοχή για οποιονδήποτε από τους λόγους
// που ήδη χρησιμοποιεί το clientNeedsAttention() (app-part1.js) για την ταξινόμηση στο Πελάτες —
// έτσι τα δύο ταμπ δεν διαφωνούν πια για το ποιος "χρειάζεται προσοχή". Ένας πελάτης χωρίς πλάνο
// ή με πλάνο 30+ ημερών δεν εμφανιζόταν πουθενά στην Αρχική πριν αν είχε πρόσφατη μέτρηση βάρους.
// Ο ξεπερασμένος σύνδεσμος portal εξαιρείται σκόπιμα εδώ (έχει ήδη δική του κάρτα με δικό της κουμπί).
function homeClientsNeedingAttention(){
  var WEIGHT_GAP_DAYS=30, CHECKIN_GAP_DAYS=2;
  var now=Date.now();
  var out=[];
  clients.filter(function(c){return !c.deleted && !c.archived;}).forEach(function(c){
    if(c.attentionSnoozeUntil && now<c.attentionSnoozeUntil) return;
    var flaggedAppt=(c.appointments||[]).slice().reverse().find(function(a){return a.flagged;});
    if(flaggedAppt){
      out.push({c:c,tier:-1,gap:0,label:'🚩 σημειωμένο για παρακολούθηση (ραντεβού '+flaggedAppt.date+')',
        action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();selectClient(\''+c.id+'\');swTab(TAB_APPOINTMENTS);">Δες ραντεβού</button>'});
      return;
    }
    if(typeof clientHasLowPlanFeedback==='function' && clientHasLowPlanFeedback(c)){
      var latestPf=window.Cloud.planFeedbackFor(c)[0];
      var npsTxt=latestPf.continue_likelihood!=null?(latestPf.continue_likelihood+'/10 πιθανότητα συνέχισης'):'χαμηλή βαθμολογία σε γεύμα';
      out.push({c:c,tier:-1,gap:0,label:'😕 χαμηλή ικανοποίηση πλάνου ('+npsTxt+', εβδ. '+latestPf.week_start+')',
        action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();selectClient(\''+c.id+'\');swTab(3);">Δες feedback</button>'});
      return;
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
        out.push({c:c,tier:3,gap:ckGap,label:'χωρίς check-in στο portal '+ckGap+' ημέρες'});
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
function homePortalActivity(){
  if(!window.Cloud || !window.Cloud.checkinsFor) return [];
  return clients.filter(function(c){return !c.deleted && !c.archived && c.shareToken;})
    .map(function(c){
      var rows=window.Cloud.checkinsFor(c);
      return {c:c, rows:rows, gap:ckDaysSinceLast(rows)};
    })
    .filter(function(x){return x.rows.length && isFinite(x.gap);})
    .sort(function(a,b){return a.gap-b.gap;});
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
  var msg='Γεια σου '+fname+'! Πριν φτιάξω το πλάνο της επόμενης εβδομάδας, πες μου γρήγορα πώς πήγε αυτή — 30 δευτερόλεπτα, στην καρτέλα Πρόοδος: '+url;
  var phone=(c.phone||'').replace(/[^0-9]/g,'');
  if(phone && phone.length<=10 && phone.charAt(0)!=='3') phone='30'+phone; // ελληνικός κωδικός χώρας, ίδιο μοτίβο με openPublishModal
  if(phone){
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  } else if(c.email){
    location.href='mailto:'+encodeURIComponent(c.email)+'?subject='+encodeURIComponent('Πες μου πώς πήγε η εβδομάδα — Feed Your Health')+'&body='+encodeURIComponent(msg);
  } else {
    showErrorToast('Δεν υπάρχει τηλέφωνο ή email για τον/την '+(c.name||'πελάτη')+'.');
  }
}

// initials() moved to js/app-part1.js — it's called from renderSB() there, which can run
// (via an early auth-callback in app-part4.js) before this later-loading file exists yet.

// Ενοποιεί τα σήματα του homeClientsNeedingAttention() (tier -1/0/1 = χρειάζονται ενέργεια τώρα)
// και του homeStaleLinks() σε ένα "🔴 Χρειάζονται προσοχή", τα πιο ήπια σήματα (tier 2/3 = μέτρηση/
// check-in gap) σε "🟡 Μπαγιατεμένα", και όλους τους υπόλοιπους ενεργούς πελάτες σε "🟢 Εντάξει" —
// ώστε η Αρχική να έχει ένα σημείο εισόδου αντί το ίδιο σήμα να εμφανίζεται σε 3 διαφορετικές κάρτες.
function homeAttentionBuckets(){
  var attn=homeClientsNeedingAttention();
  var red=[],amber=[],redIds={};
  attn.forEach(function(x){
    if(x.tier<=1){ if(!redIds[x.c.id]){redIds[x.c.id]=true;red.push({c:x.c,label:x.label});} }
    else { amber.push({c:x.c,label:x.label}); }
  });
  homeStaleLinks().forEach(function(c){
    if(!redIds[c.id]){redIds[c.id]=true;red.push({c:c,label:'ο σύνδεσμος δείχνει παλιό πλάνο'});}
  });
  var amberIds={}; amber.forEach(function(x){amberIds[x.c.id]=true;});
  var green=clients.filter(function(c){return !c.deleted&&!c.archived&&!redIds[c.id]&&!amberIds[c.id];})
    .map(function(c){return {c:c,label:'ενεργό πλάνο, όλα εντάξει'};});
  return {red:red,amber:amber,green:green};
}
var _homeBucketSel='red';
function homeBucketRow(x,accent){
  return '<div class="hm-row" onclick="selectClient(\''+x.c.id+'\')">'
    +'<div class="hm-avatar hm-avatar-'+accent+'">'+initials(x.c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(x.c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-row-sub">'+x.label+'</span>'
    +'</div>';
}
function homeRenderBucketList(){
  var el=document.getElementById('hm-bucket-list');
  if(!el) return;
  var buckets=homeAttentionBuckets();
  var accent=_homeBucketSel==='red'?'red':(_homeBucketSel==='amber'?'amber':'teal');
  var items=buckets[_homeBucketSel]||[];
  el.innerHTML=items.length?items.map(function(x){return homeBucketRow(x,accent);}).join(''):'<div class="hm-empty">Κανένας πελάτης σε αυτή την κατηγορία 👍</div>';
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

function renderHome(){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;

  if(!clients || !clients.length){
    main.innerHTML='<div class="empty" id="empty-state">'
      +'<div style="font-size:64px;margin-bottom:12px">👥</div>'
      +'<div style="font-size:16px;font-weight:600;margin-bottom:8px;color:#025857">Καλώς ήρθες στον Διαιτολόγο!</div>'
      +'<div style="font-size:13px;color:#999;margin-bottom:20px;max-width:400px">Δημιουργήστε τον πρώτο σας πελάτη για να ξεκινήσετε τη διαχείριση διατροφικών σχεδίων</div>'
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
  var attentionList=homeClientsNeedingAttention();
  var attentionIds={};
  attentionList.forEach(function(x){attentionIds[x.c.id]=true;});
  var attentionRows=attentionList.map(function(x){
    return homeRow(x.c, x.label, 'red', x.action);
  });
  // Η κάρτα δείχνει ΟΛΑ τα tiers (και τα πιο ήπια 2/3 = μέτρηση/check-in gap), ενώ το κόκκινο
  // πλακίδιο από πάνω μετράει μόνο tier<=1 (βλ. homeAttentionBuckets) — χωρίς αυτή τη διευκρίνιση
  // ένας πελάτης μπορεί να εμφανίζεται εδώ αλλά όχι στο "0" του πλακιδίου, μπερδεύοντας ποιο νούμερο ισχύει.
  var attentionMildCount=attentionList.filter(function(x){return x.tier>1;}).length;
  var attentionCardTitle='⚠️ Χρειάζονται προσοχή'+(attentionMildCount?(' <span style="font-weight:400;font-size:10px;color:#999" title="Το πάνω κόκκινο πλακίδιο μετράει μόνο τα πιο επείγοντα· αυτή η κάρτα δείχνει και τα πιο ήπια θέματα.">('+attentionMildCount+' πιο ήπια 🟡)</span>'):'');
  var staleRows=homeStaleLinks().map(function(c){
    return homeRow(c,'ο σύνδεσμος δείχνει παλιό πλάνο','amber',
      '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();homeQuickRepublish(\''+c.id+'\',this)">Ξαναδημοσίευσε</button>');
  });
  var activityRows=homePortalActivity().map(function(x){
    var sub=x.gap===0?'σήμερα':(x.gap===1?'χθες':'πριν '+x.gap+' ημέρες');
    return homeRow(x.c,sub,'teal');
  });
  var trendRows=homeWeightTrendAlerts().map(function(x){ return homeTrendRow(x.c,x.rate); });
  var pregWeightRows=homePregnancyWeightAlerts().map(function(x){ return homePregWeightRow(x.c,x.wg); });
  var reminderRows=homeClientsNeedingFeedbackReminder().map(function(c){
    return homeRow(c,'δεν έχει στείλει feedback ακόμα','teal',
      '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();sendFeedbackReminder(\''+c.id+'\')">🔔 Υπενθύμιση</button>');
  });
  var pendingPlanRows=homePendingPlanActions(attentionIds).map(homePendingPlanActionRow);
  var approachingRenewalRows=homeApproachingRenewal().map(homeApproachingRenewalRow);

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">🏠 Αρχική</div>';

  var buckets=homeAttentionBuckets();
  _homeBucketSel='red';
  html+='<div class="hm-tiles">'
    +'<div class="hm-tile hm-tile-red sel" id="hm-tile-red" onclick="homeSelectBucket(\'red\')"><div class="hm-tile-num">'+buckets.red.length+'</div><div class="hm-tile-lbl">🔴 Χρειάζονται προσοχή</div></div>'
    +'<div class="hm-tile hm-tile-amber" id="hm-tile-amber" onclick="homeSelectBucket(\'amber\')"><div class="hm-tile-num">'+buckets.amber.length+'</div><div class="hm-tile-lbl">🟡 Μπαγιατεμένα πλάνα</div></div>'
    +'<div class="hm-tile hm-tile-green" id="hm-tile-green" onclick="homeSelectBucket(\'green\')"><div class="hm-tile-num">'+buckets.green.length+'</div><div class="hm-tile-lbl">🟢 Ενεργοί, εντάξει</div></div>'
    +'</div>'
    +'<div class="hm-card" style="margin-bottom:20px" id="hm-bucket-list">'
    +(buckets.red.length?buckets.red.map(function(x){return homeBucketRow(x,'red');}).join(''):'<div class="hm-empty">Κανένας πελάτης σε αυτή την κατηγορία 👍</div>')
    +'</div>';

  var measuredToday=homeMeasuredToday();
  html+='<div class="hm-stats">'
    +'<div class="hm-stat"><div class="hm-stat-num">'+metrics.total+'</div><div class="hm-stat-lbl">Πελάτες</div></div>'
    +'<div class="hm-stat"><div class="hm-stat-num">'+metrics.active+'</div><div class="hm-stat-lbl">Ενεργά πλάνα</div></div>'
    +'<div class="hm-stat hm-stat-clickable" onclick="toggleQA(\'qa-quickmeasure\')" onkeydown="if(event.key===\'Enter\')toggleQA(\'qa-quickmeasure\')" role="button" tabindex="0" title="Άνοιγμα γρήγορης μέτρησης"><div class="hm-stat-num">'+measuredToday.length+'</div><div class="hm-stat-lbl">Μετρήσεις σήμερα</div>'
    +(measuredToday.length?'<div class="hm-stat-names">'+measuredToday.map(function(c){return esc(c.name||'');}).join(', ')+'</div>':'')
    +'</div>'
    +'</div>';

  var groupBreakdown=homeGroupBreakdown(buckets);
  var gridCards=[
    homeCard('📋 Εκκρεμότητες πλάνου', pendingPlanRows, 'ακόμα', 'warning'),
    homeCard(attentionCardTitle, attentionRows, 'ακόμα', 'danger'),
    homeCard('🔜 Πλησιάζει ανανέωση', approachingRenewalRows, 'ακόμα', 'warning'),
    homeCard('📈 Τάση βάρους', trendRows, 'ακόμα', 'danger'),
    homeCard('🤰 Αύξηση βάρους κύησης', pregWeightRows, 'ακόμα', 'danger'),
    homeCard('🔗 Ξεπερασμένοι σύνδεσμοι', staleRows, 'ακόμα', 'warning'),
    isFeedbackReminderWindow()?homeCard('🔔 Υπενθύμιση feedback', reminderRows, 'ακόμα', 'info'):'',
    groupBreakdown.length?homeGroupsCardHtml(groupBreakdown):'',
    homeCard('📱 Πρόσφατη δραστηριότητα', activityRows, 'ακόμα', 'info')
  ].filter(function(c){return c;});

  if(gridCards.length){
    html+='<div class="hm-grid">'+gridCards.join('')+'</div>';
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
    var thresholdInp='<span style="font-size:10px;color:#999;margin-left:6px;white-space:nowrap" title="Όριο ανανέωσης για αυτόν τον πελάτη" onclick="event.stopPropagation()">⚙ <input type="number" value="'+(c.renewalDays||PLAN_RENEWAL_DAYS)+'" min="7" max="120" style="width:34px;font-size:10px;padding:1px 3px;border:1px solid #ddd;border-radius:4px" onchange="setClientRenewalDays(\''+c.id+'\',this.value)"> ημ.</span>';
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

// ═══════════════════════════════════════════════════════════════
// ΠΕΛΑΤΕΣ — client browsing page (moved out of the sidebar so the
// sidebar stays just navigation + quick actions, matching the design)
// ═══════════════════════════════════════════════════════════════

function sel(current,value){ return current===value?' selected':''; }

// Κοινός χάρτης αθλημάτων: χρησιμοποιείται τόσο στο φίλτρο της σελίδας Πελάτες όσο και στην κάρτα κάθε πελάτη.
var SPORT_INFO={
  bjj:{icon:'🥋',label:'BJJ'},
  boxing:{icon:'🥊',label:'Boxing'},
  mma:{icon:'🤼',label:'MMA'},
  football:{icon:'⚽',label:'Ποδόσφαιρο'},
  basketball:{icon:'🏀',label:'Μπάσκετ'},
  weightlifting:{icon:'🏋️',label:'Weightlifting'},
  cycling:{icon:'🚴',label:'Ποδηλασία'},
  running:{icon:'🏃',label:'Τρέξιμο'},
  swimming:{icon:'🏊',label:'Κολύμβηση'},
  crossfit:{icon:'⚡',label:'CrossFit'},
  custom:{icon:'✏️',label:'Προσαρμοσμένο'}
};

function renderClients(){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">👥 Πελάτες</div>';

  html+='<div class="clients-toolbar">';
  html+='<input type="text" id="client-search" class="client-search-inp" placeholder="🔍 Αναζήτηση πελάτη..." aria-label="Αναζήτηση πελάτη" value="'+esc(_clientSearchTerm)+'" oninput="filterClients(this.value)">';
  html+='<select id="client-filter-goal" class="clients-toolbar-select" aria-label="Φίλτρο στόχου" onchange="setClientFilter(\'goal\',this.value)">'
    +'<option value=""'+sel(_clientFilterGoal,'')+'>Όλοι οι στόχοι</option>'
    +'<option value="loss"'+sel(_clientFilterGoal,'loss')+'>Απώλεια βάρους</option>'
    +'<option value="mild"'+sel(_clientFilterGoal,'mild')+'>Ήπια απώλεια</option>'
    +'<option value="maintain"'+sel(_clientFilterGoal,'maintain')+'>Διατήρηση</option>'
    +'<option value="gain"'+sel(_clientFilterGoal,'gain')+'>Αύξηση μάζας</option>'
    +'</select>';
  html+='<select id="client-filter-sport" class="clients-toolbar-select" aria-label="Φίλτρο αθλήματος" onchange="setClientFilter(\'sport\',this.value)">'
    +'<option value=""'+sel(_clientFilterSport,'')+'>Όλα τα αθλήματα</option>';
  Object.keys(SPORT_INFO).forEach(function(key){
    html+='<option value="'+key+'"'+sel(_clientFilterSport,key)+'>'+SPORT_INFO[key].icon+' '+SPORT_INFO[key].label+'</option>';
  });
  html+='</select>';
  var groupNames=getAllGroupNames();
  if(groupNames.length){
    html+='<select id="client-filter-group" class="clients-toolbar-select" aria-label="Φίλτρο ομάδας" onchange="setClientFilter(\'group\',this.value)">'
      +'<option value=""'+sel(_clientFilterGroup,'')+'>Όλες οι ομάδες</option>';
    groupNames.forEach(function(g){
      html+='<option value="'+esc(g)+'"'+sel(_clientFilterGroup,g)+'>🏷️ '+esc(g)+'</option>';
    });
    html+='</select>';
  }
  html+='<select id="client-sort" class="clients-toolbar-select" aria-label="Ταξινόμηση πελατών" onchange="setClientSort(this.value)">'
    +'<option value="recent"'+sel(_clientSortMode,'recent')+'>🕐 Πρόσφατη επίσκεψη πρώτα</option>'
    +'<option value="attention"'+sel(_clientSortMode,'attention')+'>🔔 Χρειάζονται προσοχή πρώτα</option>'
    +'<option value="oldest"'+sel(_clientSortMode,'oldest')+'>⏳ Παλαιότερη επίσκεψη πρώτα</option>'
    +'<option value="name"'+sel(_clientSortMode,'name')+'>🔤 Όνομα (Α-Ω)</option>'
    +'<option value="stale"'+sel(_clientSortMode,'stale')+'>⚠️ Μπαγιατεμένο πλάνο πρώτα</option>'
    +'</select>';
  html+='<button class="add-btn add-btn-toolbar" onclick="addClient()">+ Νέος πελάτης</button>';
  html+='</div>';

  html+='<div id="client-list" class="clients-list-page"></div>';
  html+='</div>';

  main.innerHTML=html;
  renderSB();
}

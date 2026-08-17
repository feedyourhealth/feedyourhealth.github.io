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
  var phone=normalizePhoneIntl(c.phone);
  var sent=false;
  if(phone){
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
    sent=true;
  } else if(c.email){
    location.href='mailto:'+encodeURIComponent(c.email)+'?subject='+encodeURIComponent('Πες μου πώς πήγε η εβδομάδα — Feed Your Health')+'&body='+encodeURIComponent(msg);
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
  var parts=[];
  if(score!=null) parts.push(score+'% τήρηση αυτή την εβδομάδα');
  if(wDelta) parts.push(wDelta+' βάρος');
  if(streak>0) parts.push('🔥 '+streak+' '+(streak===1?'μέρα':'μέρες')+' σερί');
  if(!parts.length) return null;
  return 'Καλή Κυριακή '+fname+'! Η εβδομάδα σου: '+parts.join(', ')+' 👏';
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
    location.href='mailto:'+encodeURIComponent(c.email)+'?subject='+encodeURIComponent('Η εβδομάδα σου — Feed Your Health')+'&body='+encodeURIComponent(msg);
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
  var msg='Γεια σου '+fname+'! Είδα ότι δεν έχεις τσεκάρει τίποτα στο πλάνο σου τελευταία — όλα καλά; Το link είναι εδώ αν θες να ρίξεις μια ματιά: '+url;
  var phone=normalizePhoneIntl(c.phone);
  if(phone){
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  } else if(c.email){
    location.href='mailto:'+encodeURIComponent(c.email)+'?subject='+encodeURIComponent('Πώς πάει; — Feed Your Health')+'&body='+encodeURIComponent(msg);
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
  // Ξεχωριστός φακός πάνω στα ίδια tier -1 στοιχεία (🚩/😕/💬) — επίτηδες μετράει ΚΑΙ εδώ ΚΑΙ στο
  // red bucket παρακάτω, ώστε το πλακίδιο "Νέα από πελάτες" να δείχνει μόνο ό,τι ήρθε από τον ίδιο
  // τον πελάτη, χωρίς να ανακατεύεται με "χωρίς πλάνο"/"μπαγιατεμένο" που είναι διαχειριστικά, όχι δραστηριότητα.
  var activity=attn.filter(function(x){return x.tier===-1;}).map(function(x){return {c:x.c,label:x.label,action:x.action};});
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
  var attentionList=homeClientsNeedingAttention();
  var attentionIds={};
  attentionList.forEach(function(x){attentionIds[x.c.id]=true;});
  var attentionRows=attentionList.map(function(x){
    return homeRow(x.c, x.label, 'red', x.action);
  });
  // Η κάρτα δείχνει ΟΛΑ τα tiers (και τα πιο ήπια 2/3 = μέτρηση/check-in gap), ενώ το κόκκινο
  // πλακίδιο από πάνω μετράει μόνο tier<=1 (βλ. homeAttentionBuckets). Επίτηδες διαφορετικό label
  // από το πλακίδιο ("παρακολούθηση" αντί "προσοχή") ώστε το "0" του πλακιδίου να μη διαβάζεται σαν
  // αντίφαση με το σύνολο της λίστας από κάτω.
  var attentionCardTitle='⚠️ Χρειάζονται παρακολούθηση'+(attentionList.length?(' <span style="font-weight:400;font-size:10px;color:var(--text-muted)">('+attentionList.length+')</span>'):'');
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
    return homeRow(x.c,sub,'teal');
  });
  var trendRows=homeWeightTrendAlerts().map(function(x){ return homeTrendRow(x.c,x.rate); });
  var pregWeightRows=homePregnancyWeightAlerts().map(function(x){ return homePregWeightRow(x.c,x.wg); });
  var reminderRows=homeClientsNeedingFeedbackReminder().map(function(c){
    return homeRow(c,'δεν έχει στείλει feedback ακόμα','teal',
      '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();sendFeedbackReminder(\''+c.id+'\')">🔔 Υπενθύμιση</button>'
      +'<button type="button" class="hm-action-btn" style="background:#e8f5e9;color:#2e7d32" onclick="event.stopPropagation();sendWeeklyRecap(\''+c.id+'\')" title="Στείλε έτοιμη ανακεφαλαίωση με σκορ/βάρος/σερί">📊 Ανακεφαλαίωση</button>');
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
    +'<div class="hm-tile hm-tile-teal" id="hm-tile-activity" onclick="homeSelectBucket(\'activity\')"><div class="hm-tile-num">'+buckets.activity.length+'</div><div class="hm-tile-lbl">💬 Νέα από πελάτες</div></div>'
    +'</div>'
    +'<div class="hm-card" style="margin-bottom:20px" id="hm-bucket-list">'
    +(buckets.red.length?buckets.red.map(function(x){return homeBucketRow(x,'red');}).join(''):'<div class="hm-empty">Κανένας πελάτης σε αυτή την κατηγορία 👍</div>')
    +'</div>';

  var measuredToday=homeMeasuredToday();
  html+='<div class="hm-stats">'
    +'<div class="hm-stat hm-stat-clickable" onclick="homeGoToClients(\'\')" onkeydown="if(event.key===\'Enter\')homeGoToClients(\'\')" role="button" tabindex="0" title="Δες όλους τους πελάτες"><div class="hm-stat-num">'+metrics.total+'</div><div class="hm-stat-lbl">Πελάτες</div></div>'
    +'<div class="hm-stat hm-stat-clickable" onclick="homeGoToClients(\'active\')" onkeydown="if(event.key===\'Enter\')homeGoToClients(\'active\')" role="button" tabindex="0" title="Δες πελάτες με ενεργό πλάνο"><div class="hm-stat-num">'+metrics.active+'</div><div class="hm-stat-lbl">Ενεργά πλάνα</div></div>'
    +'<div class="hm-stat hm-stat-clickable" onclick="toggleQA(\'qa-quickmeasure\')" onkeydown="if(event.key===\'Enter\')toggleQA(\'qa-quickmeasure\')" role="button" tabindex="0" title="Άνοιγμα γρήγορης μέτρησης"><div class="hm-stat-num">'+measuredToday.length+'</div><div class="hm-stat-lbl">Μετρήσεις σήμερα</div>'
    +(measuredToday.length?'<div class="hm-stat-names">'+measuredToday.map(function(c){return esc(c.name||'');}).join(', ')+'</div>':'')
    +'</div>'
    +'</div>';

  var groupBreakdown=homeGroupBreakdown(buckets);
  var tasteLibraryStatus=homeTasteLibraryStatus();
  var gridCards=[
    homeCard('📋 Εκκρεμότητες πλάνου', pendingPlanRows, 'ακόμα', 'warning'),
    homeCard(attentionCardTitle, attentionRows, 'ακόμα', 'danger'),
    homeCard('🔜 Πλησιάζει ανανέωση', approachingRenewalRows, 'ακόμα', 'warning'),
    homeCard('📈 Τάση βάρους', trendRows, 'ακόμα', 'danger'),
    homeCard('🤰 Αύξηση βάρους κύησης', pregWeightRows, 'ακόμα', 'danger'),
    homeCard(staleCardTitle, staleRows, 'ακόμα', 'warning'),
    isFeedbackReminderWindow()?homeCard('🔔 Υπενθύμιση feedback', reminderRows, 'ακόμα', 'info'):'',
    groupBreakdown.length?homeGroupsCardHtml(groupBreakdown):'',
    tasteLibraryStatus?homeTasteLibraryCardHtml(tasteLibraryStatus):'',
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
    var thresholdInp='<span style="font-size:10px;color:var(--text-muted);margin-left:6px;white-space:nowrap" title="Όριο ανανέωσης για αυτόν τον πελάτη" onclick="event.stopPropagation()">⚙ <input type="number" value="'+(c.renewalDays||PLAN_RENEWAL_DAYS)+'" min="7" max="120" style="width:34px;font-size:10px;padding:1px 3px;border:1px solid var(--border-light);border-radius:4px" onchange="setClientRenewalDays(\''+c.id+'\',this.value)"> ημ.</span>';
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
  html+='<select id="client-filter-status" class="clients-toolbar-select" aria-label="Φίλτρο κατάστασης πλάνου" onchange="setClientFilter(\'status\',this.value)">'
    +'<option value=""'+sel(_clientFilterStatus,'')+'>Κάθε κατάσταση πλάνου</option>'
    +'<option value="active"'+sel(_clientFilterStatus,'active')+'>📊 Έχει ενεργό πλάνο</option>'
    +'<option value="noplan"'+sel(_clientFilterStatus,'noplan')+'>⭕ Χωρίς πλάνο</option>'
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
  html+='<button class="add-btn add-btn-toolbar" onclick="toggleClientBulkMode()">'+(_clientBulkMode?'✕ Έξοδος επιλογής':'☑️ Επιλογή πολλαπλών')+'</button>';
  html+='<button class="add-btn add-btn-toolbar" onclick="addClient()">+ Νέος πελάτης</button>';
  // Πλέγμα/Λίστα (βλ. setClientViewMode/clientCardsOrTable, js/app-part1.js) — τα κουμπιά ζουν εδώ
  // στο στατικό toolbar, όχι μέσα στο #client-list, γι' αυτό το setClientViewMode τα ενημερώνει
  // απευθείας με classList αντί να περιμένει ξαναχτίσιμο όλου του toolbar.
  html+='<div class="client-view-toggle" role="group" aria-label="Προβολή πελατών">'
    +'<button type="button" id="client-view-grid-btn" class="cvt-btn'+(_clientViewMode!=='list'?' active':'')+'" onclick="setClientViewMode(\'grid\')" title="Προβολή πλέγματος" aria-label="Προβολή πλέγματος">▦</button>'
    +'<button type="button" id="client-view-list-btn" class="cvt-btn'+(_clientViewMode==='list'?' active':'')+'" onclick="setClientViewMode(\'list\')" title="Προβολή λίστας" aria-label="Προβολή λίστας">☰</button>'
    +'</div>';
  html+='</div>';

  html+='<div id="client-list" class="clients-list-page"></div>';
  html+='</div>';

  main.innerHTML=html;
  renderSB();
}

// ── Πολλαπλή επιλογή πελατών (bulk ανάθεση ομάδας) ──────────────────────────
// Δεν υπήρχε κανένα bulk εργαλείο μέχρι τώρα (ανάθεση ομάδας γινόταν ένα-ένα, μέσα στο
// προφίλ κάθε πελάτη) — αυτό αφήνει το ίδιο πάτημα καρτών, απλά αλλάζει τι κάνει το κλικ.
function toggleClientBulkMode(){
  _clientBulkMode=!_clientBulkMode;
  if(!_clientBulkMode) _clientBulkSelected={};
  renderSB();
}
function toggleClientBulkSelect(clientId){
  if(_clientBulkSelected[clientId]) delete _clientBulkSelected[clientId];
  else _clientBulkSelected[clientId]=true;
  renderSB();
}
// Ίδιο μοτίβο reveal με το single-client group picker (js/app-part2.js, inp-group.onchange) —
// "+ Νέα ομάδα…" αποκαλύπτει ένα πεδίο κειμένου αντί να δημιουργεί κατευθείαν.
function onBulkGroupSelectChange(selEl){
  var row=document.getElementById('bulk-group-new-row');
  if(!row) return;
  if(selEl.value==='__new__'){
    row.style.display='inline-flex';
    var inp=document.getElementById('bulk-group-new');
    if(inp){ inp.value=''; inp.focus(); }
  } else {
    row.style.display='none';
  }
}
function _bulkSelectedClientIds(){
  return Object.keys(_clientBulkSelected).filter(function(id){return _clientBulkSelected[id];});
}
function _applyGroupToSelected(groupValue){
  var ids=_bulkSelectedClientIds();
  if(!ids.length) return;
  ids.forEach(function(id){
    var c=clients.find(function(x){return x.id===id;});
    if(c) c.group=groupValue;
  });
  save();
  _clientBulkMode=false;
  _clientBulkSelected={};
  renderSB();
}
function applyBulkGroupAssign(){
  var sel=document.getElementById('bulk-group-select');
  var val=sel?sel.value:'';
  if(!val || val==='__new__') return; // "+ Νέα ομάδα…" εφαρμόζεται μέσω applyBulkGroupNew(), όχι εδώ
  _applyGroupToSelected(val==='__none__'?'':val);
}
function applyBulkGroupNew(){
  var inp=document.getElementById('bulk-group-new');
  var name=(inp&&inp.value||'').trim();
  if(!name) return;
  // αν υπάρχει ήδη ίδια ομάδα (διαφορετικά κεφαλαία/κενά), χρησιμοποίησε την υπάρχουσα ακριβή τιμή
  // αντί να δημιουργήσεις σχεδόν-διπλότυπο κατά λάθος (ίδιο σκεπτικό με το single-client picker)
  var existing=(typeof getAllGroupNames==='function'?getAllGroupNames():[]).find(function(g){return normalizeGroupName(g)===normalizeGroupName(name);});
  _applyGroupToSelected(existing||name);
}

// ═══════════════════════════════════════════════════════════════
// "💬 Μηνύματα" — ενιαία, χρονολογική λίστα με ΟΛΑ όσα στέλνουν οι πελάτες από το δικό τους
// portal link (χωρίς login): γραπτές σημειώσεις (client_logs) + εβδομαδιαίο ⭐ feedback πλάνου
// (plan_feedback) όταν είναι χαμηλό. Πριν, αυτά ζούσαν σκόρπια σε 3 σημεία (ανά-πελάτη tab
// "📝 Ραντεβού", ένα-item-ανά-πελάτη στην Αρχική, badge 💬/😕 χωρίς περιεχόμενο στη λίστα Πελάτες) —
// δεν υπήρχε πουθενά ένα σημείο με όλα τα μηνύματα όλων των πελατών μαζί. Επαναχρησιμοποιεί τις ΙΔΙΕΣ
// συναρτήσεις reply/resolve (replyToClientNote/replyToPlanFeedback, js/app-part2.js) ώστε το
// "απαντήθηκε" να είναι μία πηγή αλήθειας είτε ανοίξεις το μήνυμα από εδώ είτε από τον πελάτη.
// Flagged ραντεβού (🚩) ΔΕΝ μπαίνουν εδώ — είναι σημείωση του ίδιου του διαιτολόγου σε ραντεβού από
// κοντά, όχι κάτι που "έστειλε ο πελάτης από το link του" (βλ. homeClientsNeedingAttention για εκείνα).
// low-rated πλάνο feedback: μέχρι 26 εβδομάδες πίσω (~6 μήνες) ανά πελάτη, όχι μόνο η πιο πρόσφατη —
// πριν έδειχνε μόνο entries[0], οπότε 2-3 συνεχόμενες χαμηλές εβδομάδες φαίνονταν σαν μία. Το 26 είναι
// σκόπιμο cap (όχι απεριόριστο ιστορικό μηνών/ετών) ώστε η λίστα να μη γεμίζει με πολύ παλιά, ήδη
// ξεχασμένα χαμηλά feedback από πελάτες με χρόνια ιστορικό.
var MSG_PF_HISTORY_WEEKS=26;
function collectAllClientMessages(){
  var out=[];
  if(!window.Cloud) return out;
  clients.filter(function(c){return !c.deleted && !c.archived && c.shareToken;}).forEach(function(c){
    if(typeof window.Cloud.allClientLogsFor==='function'){
      window.Cloud.allClientLogsFor(c).forEach(function(e){
        var noteRaw=e.note||'';
        var tagMatch=/^\[tag:(travel|party|sick)\]\s*/.exec(noteRaw);
        var tag=null;
        if(tagMatch){ tag=tagMatch[1]; noteRaw=noteRaw.slice(tagMatch[0].length); }
        noteRaw=noteRaw.trim();
        if(!noteRaw) return; // μόνο μέτρηση βάρους, χωρίς κείμενο — δεν είναι "μήνυμα", ήδη φαίνεται αλλού
        var replied=(typeof isNoteReplied==='function')&&isNoteReplied(c,e.date);
        var seen=!replied&&(typeof isNoteSeen==='function')&&isNoteSeen(c,e.date);
        out.push({c:c,type:'note',sortKey:e.date,date:e.date,noteRaw:noteRaw,tag:tag,weight:e.weight_kg,
          replied:replied,seen:seen,handled:replied||seen});
      });
    }
    if(typeof window.Cloud.planFeedbackFor==='function' && typeof PF_ROW_LABELS!=='undefined'){
      window.Cloud.planFeedbackFor(c).slice(0,MSG_PF_HISTORY_WEEKS).forEach(function(entry){
        var lowKeys=Object.keys(PF_ROW_LABELS).filter(function(k){return entry[k]!=null && entry[k]<=PF_ATTENTION_STAR_MAX;});
        var lowNps=entry.continue_likelihood!=null && entry.continue_likelihood<=PF_ATTENTION_NPS_MAX;
        if(!lowKeys.length && !lowNps) return;
        var replied=(typeof isPfReplied==='function')&&(isPfReplied(c,entry.week_start,null)
          || (lowKeys.length>0 && lowKeys.every(function(k){return isPfReplied(c,entry.week_start,k);})));
        var seen=!replied&&(typeof isPfSeen==='function')&&isPfSeen(c,entry.week_start);
        out.push({c:c,type:'feedback',sortKey:entry.week_start,date:entry.week_start,entry:entry,
          lowKeys:lowKeys,lowNps:lowNps,replied:!!replied,seen:!!seen,handled:!!(replied||seen)});
      });
    }
  });
  // sortKey είναι πάντα ISO-ταξινομήσιμο string (ημερομηνία ή week_start) — πιο πρόσφατο πρώτα.
  out.sort(function(a,b){ return a.sortKey<b.sortKey?1:(a.sortKey>b.sortKey?-1:0); });
  return out;
}
// "σήμερα"/"χθες"/"πριν X ημέρες" — ίδια διατύπωση με το homePortalActivity παραπάνω.
function msgDaysAgoText(dateStr){
  var days=Math.floor((Date.now()-new Date(dateStr+'T00:00:00'))/86400000);
  if(days<=0) return 'σήμερα';
  if(days===1) return 'χθες';
  return 'πριν '+days+' ημέρες';
}
// Μαρκάρει ένα μήνυμα ως "το είδα" χωρίς να ανοίξει WhatsApp/email (isNoteSeen/isPfSeen, js/app-part2.js)
// — για μηνύματα που δεν χρειάζονται πραγματική απάντηση, ώστε να μη μένουν για πάντα στα "Αναπάντητα".
function msgMarkSeen(clientId,type,dateKey){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  if(type==='note'){ if(typeof markNoteSeen==='function') markNoteSeen(c,dateKey); }
  else { if(typeof markPfSeen==='function') markPfSeen(c,dateKey); }
  save();
  // renderSB() ξαναϋπολογίζει ΚΑΙ το sidebar badge του "💬 Μηνύματα" (updateMessagesNavBadge) ΚΑΙ
  // αυτό της "Αρχικής" — χωρίς αυτό, τα badges έμεναν με το παλιό νούμερο μέχρι την επόμενη άσχετη
  // ενέργεια που έτυχε να καλέσει renderSB() (π.χ. επιλογή άλλου πελάτη).
  if(typeof renderSB==='function') renderSB();
  renderMessages();
}
// compact=true παραλείπει avatar/όνομα πελάτη — χρησιμοποιείται στην ομαδοποιημένη προβολή (👤 Ανά
// πελάτη), όπου το όνομα φαίνεται ήδη μία φορά στην επικεφαλίδα της κάρτας.
function msgRowHtml(m,compact){
  var c=m.c;
  var accent=m.handled?'teal':'red';
  var urgent=!m.handled && (Math.floor((Date.now()-new Date(m.date+'T00:00:00'))/86400000)>=3);
  var subline, bodyHtml, replyOnclick;
  var ageTxt=msgDaysAgoText(m.date);
  if(m.type==='note'){
    var tagHtml='';
    if(m.tag && typeof CLIENT_LOG_TAG_DEFS!=='undefined' && CLIENT_LOG_TAG_DEFS[m.tag]){
      var td=CLIENT_LOG_TAG_DEFS[m.tag];
      tagHtml='<span style="background:#e8f5e9;color:#014545;border-radius:999px;padding:2px 8px;font-size:10px;margin-right:6px;white-space:nowrap">'+td.icon+' '+td.label+'</span>';
    }
    var weightHtml=m.weight?(' · <b>'+m.weight+' kg</b>'):'';
    subline=(urgent?'⏳ ':'💬 ')+m.date+' · '+ageTxt;
    bodyHtml=tagHtml+esc(m.noteRaw)+weightHtml;
    replyOnclick="replyToClientNote('"+c.id+"','"+m.date+"','"+escJsAttr(m.noteRaw)+"');setTimeout(function(){if(typeof renderSB==='function')renderSB();renderMessages();},50);";
  } else {
    var e=m.entry;
    // ✅ Χρωματιστά chips (ίδιο στυλ με τα reason-tags του planFeedbackPanelHtml, js/app-part2.js)
    // αντί για ένα άτονο κείμενο με κόμματα — η χαμηλή κατηγορία ξεχωρίζει με μια ματιά.
    bodyHtml=m.lowKeys.map(function(k){
      var reasons=((e.low_rating_reasons||{})[k]||[]).join(', ');
      var lbl=(PF_ROW_LABELS[k]||k)+' '+e[k]+'★'+(reasons?(' · '+reasons):'');
      return '<span style="background:#fbe9e7;color:#c0392b;border-radius:999px;padding:2px 8px;font-size:10px;margin-right:4px;display:inline-block;margin-bottom:2px;white-space:nowrap">'+esc(lbl)+'</span>';
    }).join('')
    +(m.lowNps?'<span style="background:#fff3e0;color:#e65100;border-radius:999px;padding:2px 8px;font-size:10px;display:inline-block;margin-bottom:2px">πιθανότητα συνέχισης '+e.continue_likelihood+'/10</span>':'');
    subline=(urgent?'⏳ 😕 εβδ. ':'😕 εβδ. ')+m.date+' · '+ageTxt;
    replyOnclick="replyToPlanFeedback('"+c.id+"','"+e.week_start+"',null);setTimeout(function(){if(typeof renderSB==='function')renderSB();renderMessages();},50);";
  }
  var actionsHtml;
  if(m.replied){
    actionsHtml='<span class="hm-row-sub" style="color:#2e7d32;font-weight:600">✓ Απαντήθηκε</span>';
  } else if(m.seen){
    actionsHtml='<span class="hm-row-sub" title="Μαρκαρίστηκε ως αναγνωσμένο, χωρίς απάντηση">👁️ Αναγνωσμένο</span>';
  } else {
    actionsHtml='<button type="button" class="note-reply-btn" onclick="event.stopPropagation();'+replyOnclick+'">↩️ Απάντησε</button>'
      +'<button type="button" class="note-reply-btn" style="margin-left:4px" title="Μαρκάρισμα ως αναγνωσμένο χωρίς απάντηση" onclick="event.stopPropagation();msgMarkSeen(\''+c.id+'\',\''+m.type+'\',\''+m.date+'\')">👁️ Το είδα</button>';
  }
  var nameHtml=compact?'':('<span class="hm-row-name" style="display:inline">'+esc(c.name||'Νέος πελάτης')+'</span> ');
  return '<div class="hm-row" style="align-items:flex-start;cursor:pointer" onclick="selectClient(\''+c.id+'\');swTab(TAB_APPOINTMENTS);">'
    +(compact?'':('<div class="hm-avatar hm-avatar-'+accent+'">'+initials(c.name)+'</div>'))
    +'<div style="flex:1;min-width:0">'
      +'<div>'+nameHtml+'<span class="hm-row-sub">'+subline+'</span></div>'
      +'<div style="font-size:11.5px;color:#666;margin-top:2px;white-space:normal">'+bodyHtml+'</div>'
    +'</div>'
    +'<div style="display:flex;align-items:center;flex-shrink:0">'+actionsHtml+'</div>'
    +'</div>';
}
// Ομαδοποιεί μια ήδη ταξινομημένη (πιο πρόσφατο πρώτα) λίστα μηνυμάτων ανά πελάτη — η σειρά των
// group ακολουθεί το πιο πρόσφατο μήνυμα κάθε πελάτη (πρώτη εμφάνιση στη sorted λίστα).
function groupMessagesByClient(list){
  var order=[],byId={};
  list.forEach(function(m){
    if(!byId[m.c.id]){ byId[m.c.id]=[]; order.push(m.c); }
    byId[m.c.id].push(m);
  });
  return order.map(function(c){ return {c:c,items:byId[c.id]}; });
}
function msgGroupCardHtml(g){
  var anyUnhandled=g.items.some(function(m){return !m.handled;});
  return '<div class="hm-card" style="margin-bottom:12px">'
    +'<div class="hm-card-title" style="cursor:pointer" onclick="selectClient(\''+g.c.id+'\');swTab(TAB_APPOINTMENTS);">'
      +'<div class="hm-avatar hm-avatar-'+(anyUnhandled?'red':'teal')+'">'+initials(g.c.name)+'</div>'
      +esc(g.c.name||'Νέος πελάτης')+' <span style="font-weight:400;color:var(--text-muted);font-size:11px">('+g.items.length+')</span>'
    +'</div>'
    +g.items.map(function(m){return msgRowHtml(m,true);}).join('')
    +'</div>';
}
// Μαζικό "όλα ως αναγνωσμένα" — για επιστροφή μετά από μέρες απουσίας με δεκάδες αναπάντητα.
// Επηρεάζει ΜΟΝΟ ό,τι είναι ορατό αυτή τη στιγμή (σέβεται το ενεργό φίλτρο), όχι τυφλά τα πάντα.
function msgMarkAllSeen(){
  var all=collectAllClientMessages();
  // Πάντα μόνο τα ΜΗ χειρισμένα, ανεξάρτητα από το ενεργό φίλτρο — στο φίλτρο "Όλα" δεν έχει νόημα
  // να ξαναμαρκάρουμε ήδη απαντημένα/αναγνωσμένα μηνύματα.
  var unhandled=all.filter(function(m){return !m.handled;});
  if(!unhandled.length) return;
  var n=unhandled.length;
  var doIt=function(){
    unhandled.forEach(function(m){
      if(m.type==='note'){ if(typeof markNoteSeen==='function') markNoteSeen(m.c,m.date); }
      else { if(typeof markPfSeen==='function') markPfSeen(m.c,m.entry.week_start); }
    });
    save();
    if(typeof renderSB==='function') renderSB();
    renderMessages();
  };
  if(typeof showConfirmDialog==='function'){
    showConfirmDialog('Μαρκάρισμα '+n+' μηνυμάτων ως αναγνωσμένα, χωρίς απάντηση;',doIt,{icon:'👁️',confirmLabel:'Μαρκάρισμα όλων'});
  } else doIt();
}
// Χειροκίνητο "🔄 Ανανέωση" των δύο portal caches (client_logs/plan_feedback) on-demand, χωρίς reload
// — ίδιο σκεπτικό με το refreshClientPortalFeedback (js/app-part2.js), αλλά ξανασχεδιάζει το #main
// (renderMessages) αντί για το #s3b, αφού εδώ δεν υπάρχει επιλεγμένος πελάτης.
function msgRefresh(btn){
  if(!window.Cloud) return;
  if(btn){ btn.disabled=true; btn.textContent='⏳ Ανανέωση...'; }
  var restore=function(){ if(btn){ btn.disabled=false; btn.textContent='🔄 Ανανέωση'; } renderMessages(); };
  Promise.all([
    typeof window.Cloud.refreshClientLogsCache==='function'?window.Cloud.refreshClientLogsCache():Promise.resolve(),
    typeof window.Cloud.refreshPlanFeedbackCache==='function'?window.Cloud.refreshPlanFeedbackCache():Promise.resolve()
  ]).then(restore).catch(restore);
}
var _msgFilter='unread';
var _msgGroupBy=false;
// filter: 'unread'|'all' — προαιρετικό, αλλιώς ξαναχρησιμοποιεί το τελευταίο επιλεγμένο φίλτρο
// (π.χ. όταν ξαναζωγραφίζεται μετά από ↩️ Απάντησε, για να μη χάνεται η επιλογή του χρήστη).
function renderMessages(filter){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;
  if(filter) _msgFilter=filter;
  var all=collectAllClientMessages();
  var unreadCount=all.filter(function(m){return !m.handled;}).length;
  var shown=_msgFilter==='unread'?all.filter(function(m){return !m.handled;}):all;

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">💬 Μηνύματα</div>';
  html+='<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">'
    +'<button type="button" class="hm-action-btn" style="'+(_msgFilter==='unread'?'':'background:#f0f7f7;color:var(--teal)')+'" onclick="renderMessages(\'unread\')">Αναπάντητα ('+unreadCount+')</button>'
    +'<button type="button" class="hm-action-btn" style="'+(_msgFilter==='all'?'':'background:#f0f7f7;color:var(--teal)')+'" onclick="renderMessages(\'all\')">Όλα ('+all.length+')</button>'
    +'<span style="width:1px;height:18px;background:#e0e0e0;margin:0 2px"></span>'
    +'<button type="button" class="hm-action-btn" style="'+(_msgGroupBy?'':'background:#f0f7f7;color:var(--teal)')+'" onclick="_msgGroupBy=!_msgGroupBy;renderMessages();">👤 Ανά πελάτη</button>'
    +'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal)" onclick="msgRefresh(this)">🔄 Ανανέωση</button>'
    +(shown.some(function(m){return !m.handled;})?'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal)" onclick="msgMarkAllSeen()">👁️ Όλα ως αναγνωσμένα</button>':'')
    +'</div>';
  var bodyHtml;
  if(!shown.length){
    bodyHtml='<div class="hm-card"><div class="hm-empty">'+(_msgFilter==='unread'?'Κανένα αναπάντητο μήνυμα 👍':'Κανένα μήνυμα ακόμα.')+'</div></div>';
  } else if(_msgGroupBy){
    bodyHtml=groupMessagesByClient(shown).map(msgGroupCardHtml).join('');
  } else {
    bodyHtml='<div class="hm-card">'+shown.map(function(m){return msgRowHtml(m,false);}).join('')+'</div>';
  }
  html+=bodyHtml+'</div>';
  main.innerHTML=html;
}
// Κόκκινο badge πάνω στο κουμπί "💬 Μηνύματα" (sidebar) — ίδιο μοτίβο με updateHomeNavBadge, δικό
// του σύνολο (αναπάντητα μηνύματα — ούτε απαντημένα ούτε μαρκαρισμένα ως "το είδα").
function updateMessagesNavBadge(){
  var n=0;
  try{ n=collectAllClientMessages().filter(function(m){return !m.handled;}).length; }catch(e){ n=0; }
  var el=document.getElementById('messages-nav-badge');
  if(!el) return;
  el.textContent=n>99?'99+':String(n);
  el.style.display=n>0?'inline-block':'none';
}

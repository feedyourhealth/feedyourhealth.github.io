// js/client-list/roster-ui.js
// Client roster sidebar: search / filter / sort / view-mode state, group-name
// helpers, per-client attention signals, and the card / row / table renderers
// culminating in renderSB(). Extracted verbatim from js/app-part1.js (module
// split wave 9). Pure function declarations + literal-initialised state vars —
// zero load-time execution. Consumes clients / curId / getC (core/state.js),
// FOODS / TMPLS (data + core/templates.js) and calls renderHome / updateHomeNavBadge
// / updateMessagesNavBadge / updateBreadcrumbs when present; all runtime-only, so
// this loads right after app-part1.js, before app-part2.js.

var _clientSearchTerm='';
function filterClients(val){_clientSearchTerm=(val||'').toLowerCase().trim();renderSB();}
var _clientFilterGoal='';
var _clientFilterSport='';
var _clientFilterGroup='';
var _clientFilterStatus=''; // '' | 'active' (έχει πλάνο) | 'noplan' (χωρίς πλάνο) — βλ. setClientFilter
// Λειτουργία πολλαπλής επιλογής στη σελίδα Πελάτες (βλ. toggleClientBulkMode/applyBulkGroupAssign,
// js/app-part5-home.js) — δηλώνονται εδώ, όχι εκεί, γιατί renderSB() (πιο κάτω σε αυτό το αρχείο) τις
// διαβάζει και ένα early auth-callback μπορεί να καλέσει renderSB() πριν προλάβει να φορτώσει εκείνο
// το αρχείο (ίδιο ζήτημα με το initials() πιο πάνω).
var _clientBulkMode=false;
var _clientBulkSelected={}; // clientId -> true
// Ενιαία πηγή αλήθειας για "ποιες ομάδες υπάρχουν" — χρησιμοποιείται και από το φίλτρο
// στη σελίδα Πελάτες και από το επιλογέα ομάδας στο προφίλ πελάτη, ώστε να μη διαφωνήσουν ποτέ.
function getAllGroupNames(){
  return Array.from(new Set(clients.filter(function(c){return !c.deleted && !c.archived && c.group;}).map(function(c){return c.group;})))
    .sort(function(a,b){return a.localeCompare(b,'el');});
}
// Κανονικοποίηση ονόματος ομάδας για σύγκριση: πεζά + αφαίρεση τόνων/διαλυτικών, ώστε
// "ΑΠΟΛΛΩΝ" (κεφαλαία χωρίς τόνο, όπως συνήθως γράφεται) να ταιριάζει με "Απόλλων".
function normalizeGroupName(s){
  return String(s||'').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
}
// Ενοποιεί ομάδες που διαφέρουν μόνο σε πεζά/κεφαλαία/τόνους (π.χ. δεδομένα από πριν
// υπήρχε το dedupe-on-add στο προφίλ πελάτη) σε μία ενιαία γραφή — η πιο συχνά
// χρησιμοποιημένη γραφή σε κάθε ομάδα γίνεται η κανονική. Idempotent, ασφαλές να τρέξει
// σε κάθε φόρτωση δεδομένων (τοπική ή cloud). Επιστρέφει true αν άλλαξε κάτι.
function mergeDuplicateGroupNames(list){
  var buckets={};
  (list||clients).forEach(function(c){
    if(!c.group) return;
    var key=normalizeGroupName(c.group);
    if(!key) return;
    (buckets[key]=buckets[key]||[]).push(c);
  });
  var changed=false;
  Object.keys(buckets).forEach(function(key){
    var group=buckets[key];
    var counts={};
    group.forEach(function(c){counts[c.group]=(counts[c.group]||0)+1;});
    var rawValues=Object.keys(counts);
    if(rawValues.length<=1) return; // ήδη ενιαία γραφή
    rawValues.sort(function(a,b){
      var diff=counts[b]-counts[a];
      return diff!==0?diff:a.localeCompare(b,'el');
    });
    var canonical=rawValues[0];
    group.forEach(function(c){
      if(c.group!==canonical){c.group=canonical;changed=true;}
    });
  });
  return changed;
}
function setClientFilter(type,val){
  if(type==='goal') _clientFilterGoal=val;
  else if(type==='sport') _clientFilterSport=val;
  else if(type==='group') _clientFilterGroup=val;
  else if(type==='status') _clientFilterStatus=val;
  renderSB();
}
var _clientSortMode='recent'; // 'recent' | 'oldest' | 'name' | 'stale' | 'attention'
function setClientSort(val){ _clientSortMode=val; renderSB(); }

// Πλέγμα (κάρτες) vs Λίστα (πίνακας) για τη σελίδα Πελάτες. Τα δύο κουμπιά εναλλαγής ζουν στο
// στατικό toolbar HTML (renderClients, js/app-part5-home.js) — γι' αυτό εδώ ενημερώνονται απευθείας
// με classList αντί να περιμένουν ένα πλήρες re-render του toolbar (ίδιο ζήτημα συγχρονισμού με το
// dropdown κατάστασης πλάνου, βλ. setClientQuickFilter πιο πάνω, εδώ λύνεται πιο απλά μια και είναι
// μόνο δύο κουμπιά, όχι ένα <select> με πολλές τιμές).
var _clientViewMode='grid'; // 'grid' | 'list'
function setClientViewMode(m){
  _clientViewMode=m;
  var gridBtn=document.getElementById('client-view-grid-btn');
  var listBtn=document.getElementById('client-view-list-btn');
  if(gridBtn) gridBtn.classList.toggle('active',m==='grid');
  if(listBtn) listBtn.classList.toggle('active',m==='list');
  renderSB();
}

// Γρήγορα φίλτρα-chips πάνω από τη λίστα Πελάτες (ένα κλικ, χωρίς dropdown). '' | 'attention' | 'today'.
// Το "Χωρίς πλάνο" ΔΕΝ έχει δικό του state εδώ — ξαναχρησιμοποιεί το ήδη υπάρχον _clientFilterStatus='noplan'
// (ίδιο dropdown option) ώστε chip και dropdown να μη διαφωνήσουν ποτέ για το ίδιο πράγμα. Τα τρία chips
// είναι μεταξύ τους αμοιβαία αποκλειόμενα (ένα ξαναπάτημα το σβήνει) — απλούστερο και προβλέψιμο αντί για
// συνδυασμούς που θα μπέρδευαν το "πόσα ταιριάζουν" της κάθε ετικέτας.
var _clientFilterQuick='';
function setClientQuickFilter(key){
  if(key==='all'){
    // 2026-08-06: πριν δεν υπήρχε ρητό "δείξε τους όλους" chip — ο μόνος τρόπος να γυρίσεις πίσω
    // ήταν να ξαναπατήσεις το ήδη ενεργό chip, όχι προφανές (ο χρήστης το ζήτησε ρητά).
    _clientFilterQuick='';
    if(_clientFilterStatus==='noplan') _clientFilterStatus='';
  } else if(key==='noplan'){
    _clientFilterStatus=(_clientFilterStatus==='noplan')?'':'noplan';
    _clientFilterQuick='';
  } else {
    _clientFilterQuick=(_clientFilterQuick===key)?'':key;
    if(_clientFilterStatus==='noplan') _clientFilterStatus='';
  }
  // Το dropdown "Κάθε κατάσταση πλάνου" ζει στο στατικό toolbar HTML (renderClients, μία φορά ανά
  // άνοιγμα tab) — renderSB() παρακάτω δεν το ξαναχτίζει, οπότε χωρίς αυτή τη γραμμή θα έμενε οπτικά
  // στην παλιά επιλογή ενώ το chip/η λίστα θα έδειχναν ήδη το νέο φίλτρο (ισχύει και για 'all'/'noplan').
  var statusSel=document.getElementById('client-filter-status');
  if(statusSel) statusSel.value=_clientFilterStatus;
  renderSB();
}
// Μετρήματα στην ετικέτα κάθε chip υπολογισμένα πάνω στο "base" (χωρίς διαγραμμένους/αρχειοθετημένους,
// αγνοώντας αναζήτηση/άλλα φίλτρα) ώστε ο αριθμός να δείχνει πάντα το σταθερό σύνολο, όχι να αναπηδά
// ανάλογα με τι άλλο έχει ήδη επιλεγεί.
function clientQuickChipsHtml(base){
  var attnCount=base.filter(clientNeedsAttention).length;
  var noplanCount=base.filter(function(c){return !(c.weekPlan && Object.keys(c.weekPlan).length>0);}).length;
  var todayCount=base.filter(function(c){return c.lastAccess && Math.floor((Date.now()-c.lastAccess)/86400000)===0;}).length;
  var isAll=(_clientFilterQuick===''&&_clientFilterStatus!=='noplan');
  function chip(key,label,count,active){
    return '<button type="button" class="client-quick-chip'+(active?' active':'')+'" onclick="setClientQuickFilter(\''+key+'\')">'
      +label+' <span class="client-quick-chip-count">('+count+')</span></button>';
  }
  return '<div class="client-quick-chips">'
    +chip('all','Όλοι',base.length,isAll)
    +chip('attention','🚩 Χρειάζονται προσοχή',attnCount,_clientFilterQuick==='attention')
    +chip('noplan','⭕ Χωρίς πλάνο',noplanCount,_clientFilterStatus==='noplan')
    +chip('today','🕐 Ενεργοί σήμερα',todayCount,_clientFilterQuick==='today')
    +'</div>';
}

// Πόσο καιρό πριν άνοιξε τελευταία φορά ο φάκελος αυτού του πελάτη.
function fmtLastAccess(ts){
  if(!ts) return 'ποτέ';
  var days=Math.floor((Date.now()-ts)/86400000);
  if(days<=0) return 'σήμερα';
  if(days===1) return 'χθες';
  return 'πριν '+days+' ημέρες';
}
// Έγχρωμη εκδοχή του παραπάνω για την κάρτα πελάτη — πράσινο/πορτοκαλί/κόκκινο ώστε η καθυστέρηση
// να φαίνεται με μια ματιά αντί να χρειάζεται ανάγνωση του κειμένου. Ίδια παλέτα/κατώφλια με το
// progressBadge δίπλα του (0-3 πράσινο, 4-13 πορτοκαλί, 14+ κόκκινο) ώστε τα δύο badges να μη
// διαφωνούν οπτικά. "ποτέ" μένει ουδέτερο (γκρι) — δεν σημαίνει απαραίτητα παραμέλημα, απλώς δεν έχει
// καταγραφεί ποτέ άνοιγμα του φακέλου (π.χ. παλιά δεδομένα πριν υπάρξει το πεδίο).
function lastAccessChipHtml(ts){
  var label=fmtLastAccess(ts);
  if(!ts) return '<span class="cc-lastaccess">'+label+'</span>';
  var days=Math.floor((Date.now()-ts)/86400000);
  var bg='#E8F5E9', fg='#1E5E24';
  if(days>=14){ bg='#FCEBEB'; fg='#791F1F'; }
  else if(days>=4){ bg='#FAEEDA'; fg='#633806'; }
  return '<span class="cc-lastaccess" style="background:'+bg+';color:'+fg+';padding:2px 7px;border-radius:10px;font-weight:700">'+label+'</span>';
}
// Μικρό badge κατάστασης δίπλα σε κάθε πελάτη στη λίστα (βασισμένο στα cloud checkins από το portal).
// Σκόπιμα διαφορετικό λεξιλόγιο από το "Ενεργό/Χωρίς σχέδιο" cc-status badge δίπλα του — αυτό εδώ αφορά
// αποκλειστικά τη δραστηριότητα check-in στο portal, όχι αν υπάρχει πλάνο, ώστε τα δύο badges να μη
// διαβάζονται σαν αντιφατικά (π.χ. "Ενεργό σχέδιο" + "Δεν έχει ξεκινήσει" δίπλα-δίπλα ήταν μπερδεμένο).
function progressBadge(c){
  // Πριν επέστρεφε '' εδώ — η θέση του badge εξαφανιζόταν σιωπηλά, χωρίς εξήγηση γιατί λείπει η
  // αξιολόγηση (2026-08-06: μόνο 2/15 κάρτες στο πραγματικό στιγμιότυπο είχαν ποσοστό, οι υπόλοιποι
  // δεν εξηγούσαν τον λόγο). Τώρα η θέση εμφανίζεται ΠΑΝΤΑ με κάποιο νόημα.
  if(!c.shareToken) return '<span style="background:#F1EFE8;color:#444441;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap">Χωρίς portal link</span>';
  var rows=(window.Cloud&&window.Cloud.checkinsFor)?window.Cloud.checkinsFor(c):[];
  if(!rows.length) return '<span style="background:#F1EFE8;color:#444441;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap">Χωρίς check-in ακόμα</span>';
  var gap=ckDaysSinceLast(rows);
  if(gap>=2) return '<span style="background:#FCEBEB;color:#791F1F;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap">⚠ '+gap+'ημ. χωρίς check-in</span>';
  var byDate=ckRowsByDate(rows), score=ckWeekScore(byDate,0);
  if(score==null) return '<span style="background:#F1EFE8;color:#444441;font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap">Χωρίς check-in ακόμα</span>';
  var ok=score>=85;
  return '<span style="background:'+(ok?'#E8F5E9':'#FAEEDA')+';color:'+(ok?'#1E5E24':'#633806')+';font-size:9px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap">'+score+'%</span>';
}

// Πελάτης με τουλάχιστον μία καταχώρηση ραντεβού σημειωμένη 🚩 για παρακολούθηση. Μένει true μέχρι
// να διαγραφεί η ίδια η καταχώρηση (δεν υπάρχει ξεχωριστό "resolved" state) — δες removeAppointmentEntry.
function clientHasFlaggedAppointment(c){
  return !!(c.appointments && c.appointments.some(function(a){return a.flagged;}));
}
// Πελάτης με χαμηλή ικανοποίηση στην πιο ΠΡΟΣΦΑΤΗ εβδομαδιαία αξιολόγηση πλάνου (plan_feedback).
// Σε αντίθεση με το 🚩 ραντεβού flag αυτό ΔΕΝ είναι μόνιμο — ελέγχει πάντα μόνο την τελευταία
// καταχώρηση, οπότε καθαρίζει μόνο του μόλις η επόμενη εβδομάδα βελτιωθεί.
var PF_ATTENTION_NPS_MAX=4, PF_ATTENTION_STAR_MAX=2;
function clientHasLowPlanFeedback(c){
  if(!window.Cloud || typeof window.Cloud.planFeedbackFor!=='function') return false;
  var latest=window.Cloud.planFeedbackFor(c)[0];
  if(!latest) return false;
  if(latest.continue_likelihood!=null && latest.continue_likelihood<=PF_ATTENTION_NPS_MAX) return true;
  return ['breakfast','snacks','lunch','dinner','recipes_ease','ingredients_ease','training_energy'].some(function(k){
    return latest[k]!=null && latest[k]<=PF_ATTENTION_STAR_MAX;
  });
}
// Πελάτης με τουλάχιστον μία ΓΡΑΠΤΗ σημείωση από το portal (client_logs.note, χωρίς login — βλ.
// clientLogsPanelHtml στο js/app-part2.js) που δεν έχει απαντηθεί ακόμα. "Απαντήθηκε" = πατήθηκε το
// κουμπί ↩️ Απάντησε (noteReplyKey/replyToClientNote, js/app-part2.js) — ΟΧΙ απλά ότι πέρασε ο χρόνος.
// 2026-08-14: πριν κοιτούσε μόνο "τελευταία σημείωση + <2 μέρες", οπότε μια σημείωση που δεν
// απαντήθηκε ποτέ εξαφανιζόταν σιωπηλά από το badge μετά από 2 μέρες σαν να είχε απαντηθεί —
// τώρα σαρώνει τις τελευταίες (μέχρι 15, ήδη το όριο του allClientLogsFor) για οποιαδήποτε
// αναπάντητη. Μόνο καταχωρήσεις με πραγματικό κείμενο μετράνε — μια καταχώρηση μόνο βάρους ήδη
// φαίνεται αλλού (buildClientProgressHtml) και δεν είναι "μήνυμα".
function clientHasNewClientNote(c){
  if(!window.Cloud || typeof window.Cloud.allClientLogsFor!=='function') return false;
  var entries=window.Cloud.allClientLogsFor(c);
  return entries.some(function(e){
    var noteText=(e.note||'').replace(/^\[tag:(travel|party|sick)\]\s*/,'').trim();
    if(!noteText) return false;
    if(typeof isNoteReplied!=='function') return true; // δεν μπορούμε να ξέρουμε αν απαντήθηκε → μετράει ως νέα
    return !isNoteReplied(c,e.date);
  });
}
// EA (Energy Availability) στην κρίσιμη ζώνη RED-S (<30 kcal/kgLBM, ίδιο κατώφλι με το confirm-gate
// στο calorieConsistencyCheck) — πριν αυτό υπήρχε μόνο μέσα στο breakdown ενός συγκεκριμένου πελάτη,
// έπρεπε να ανοίξεις κάθε προφίλ για να το δεις. try/catch γιατί τρέχει για ΚΑΘΕ πελάτη σε κάθε
// render της λίστας — ένα σφάλμα εδώ δεν πρέπει ποτέ να ρίξει ολόκληρη τη λίστα πελατών.
function clientCriticalEA(c){
  try{
    var t=(typeof calcTDEE==='function')?calcTDEE(c):null;
    return !!(t && t.ea!=null && t.ea<30);
  }catch(e){ return false; }
}
// Ένας πελάτης "χρειάζεται προσοχή" αν: έχει σημειωμένο ραντεβού για παρακολούθηση, ή έδωσε χαμηλή
// αξιολόγηση πλάνου την τελευταία εβδομάδα, ή δεν έχει καθόλου πλάνο, ή το δημοσιευμένο portal link
// του είναι ξεπερασμένο, ή το πλάνο του είναι 30+ ημερών (ίδια κριτήρια με το Διατροφές "needs action"),
// ή έχει δημοσιευμένο portal αλλά 2+ μέρες χωρίς check-in.
function clientNeedsAttention(c){
  if(clientHasFlaggedAppointment(c)) return true;
  if(clientHasLowPlanFeedback(c)) return true;
  if(typeof dietsHasPlan==='function' && !dietsHasPlan(c)) return true;
  if(window.Cloud && window.Cloud.isStale && window.Cloud.isStale(c)) return true;
  if(typeof dietsNeedsRenewal==='function' && dietsNeedsRenewal(c)) return true;
  if(c.shareToken && window.Cloud && window.Cloud.checkinsFor){
    var rows=window.Cloud.checkinsFor(c);
    if(rows.length && ckDaysSinceLast(rows)>=2) return true;
  }
  return false;
}
// Αρχικά ενός ονόματος για το avatar κάθε γραμμής (π.χ. "Γιώργος Παπαδόπουλος" → "ΓΠ").
// Ζει εδώ (όχι στο app-part5-home.js, που φορτώνει αργότερα) γιατί ένα early callback
// από το app-part4.js μπορεί να καλέσει renderSB() πριν προλάβει να φορτώσει εκείνο το αρχείο.
function initials(name){
  var parts=(name||'').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return '?';
  if(parts.length===1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0]+parts[1][0]).toUpperCase();
}
// Χτίζει το HTML μιας κάρτας πελάτη. Μοναδική πηγή αλήθειας — τη χρησιμοποιούν τόσο το κανονικό
// πλέγμα Πελάτες όσο και το block "Χρειάζονται προσοχή" από πάνω του (βλ. renderSB), ώστε μια
// αλλαγή στην κάρτα (π.χ. νέο badge) να μην ξεχαστεί στο ένα από τα δύο σημεία.
function clientCardHtml(c){
  var hasActive = c.weekPlan && Object.keys(c.weekPlan).length > 0;
  var sportInfo=(typeof SPORT_INFO!=='undefined')?SPORT_INFO[c.sport]:null;
  var sport=sportInfo?(' • '+sportInfo.icon+' '+sportInfo.label):'';
  var groupTag=c.group?(' <span class="cc-group-tag">🏷️ '+esc(c.group)+'</span>'):'';
  var isSel=!!_clientBulkSelected[c.id];
  var cardClick=_clientBulkMode?('toggleClientBulkSelect(\''+c.id+'\')'):('selectClient(\''+c.id+'\')');
  // ✅ Ring στόχου βάρους — μόνο όταν υπάρχουν αρκετά δεδομένα (clientGoalWeightPct, app-part1.js).
  // Κρύβεται εντελώς σε bulk mode: εκεί το checkbox χρειάζεται τον ίδιο χώρο στη γωνία της κάρτας.
  var goalPct=_clientBulkMode?null:clientGoalWeightPct(c);
  var goalRingHtml=goalPct==null?'':('<div style="flex-shrink:0;align-self:center" title="'+goalPct+'% προς τον στόχο βάρους ('+c.goalWeight+' kg)">'
    +pctRing(goalPct,{size:38,thickness:5,color:'var(--teal)',track:'var(--teal-tint)',fontSize:10})+'</div>');
  // ✅ audit fix (2026-08-24, finding #1): data-client-id ώστε το δεξί-κλικ context menu να ξέρει
  // ΠΟΙΟΝ πελάτη πάτησες (βλ. contextmenu listener στο Dietologist.html), αντί να υποθέτει ότι
  // εννοείς τον ήδη επιλεγμένο (curId) — τα δύο μπορεί να διαφέρουν.
  return '<div class="client-card'+(_clientBulkMode&&isSel?' cc-selected':'')+'" data-client-id="'+esc(c.id)+'" onclick="'+cardClick+'">'
    +'<div class="cc-top">'
    +(_clientBulkMode
      ?('<div class="cc-bulk-check'+(isSel?' checked':'')+'">'+(isSel?'✓':'')+'</div>')
      :('<div class="cc-avatar'+(hasActive?' cc-avatar-active':'')+'">'+initials(c.name)+'</div>'))
    +'<div class="cc-headtext">'
    +'<div class="cc-name" title="'+esc(c.name||'Νέος πελάτης')+'">'+esc(c.name||'Νέος πελάτης')+(clientHasFlaggedAppointment(c)?' <span title="Σημειωμένο για παρακολούθηση από ραντεβού">🚩</span>':'')+(clientHasLowPlanFeedback(c)?' <span title="Χαμηλή ικανοποίηση στην τελευταία αξιολόγηση πλάνου">😕</span>':'')+(clientHasNewClientNote(c)?' <span title="Νέα σημείωση από τον πελάτη">💬</span>':'')+(clientCriticalEA(c)?' <span class="cc-ea-badge" title="'+(c.sport?'Κίνδυνος RED-S — χαμηλή ενεργειακή διαθεσιμότητα':'Χαμηλή ενεργειακή διαθεσιμότητα')+' (EA &lt;30 kcal/kgLBM)">🔴 EA</span>':'')+'</div>'
    +'<div class="cc-sub">'+(c.age||'?')+' ετών • '+(c.weight||'?')+'kg'+sport+groupTag+'</div>'
    +'</div>'
    +goalRingHtml
    +(_clientBulkMode?'':(
      '<div class="cc-actions">'
      +'<button class="carch" title="Αρχειοθέτηση" aria-label="Αρχειοθέτηση πελάτη" onclick="event.stopPropagation();archiveClient(\''+c.id+'\')">📦</button>'
      +'<button class="cdel" aria-label="Διαγραφή πελάτη" onclick="event.stopPropagation();deleteClient(\''+c.id+'\')">✕</button>'
      +'</div>'
    ))
    +'</div>'
    +'<div class="cc-bottom">'
    +'<span class="cc-status '+(hasActive?'cc-status-active':'cc-status-none')+'">'+(hasActive?'📊 Ενεργό σχέδιο':'⭕ Χωρίς σχέδιο')+'</span>'
    +progressBadge(c)
    +lastAccessChipHtml(c.lastAccess)
    +'</div>'
    +'</div>';
}
// Ίδια δεδομένα με το clientCardHtml, σε γραμμή πίνακα — για την προβολή "Λίστα" (βλ.
// _clientViewMode/clientCardsOrTable). Κρατημένο δίπλα στο clientCardHtml σκόπιμα ώστε μια αλλαγή σε
// ένα badge/κατάσταση να θυμίζει στον επόμενο που θα το αγγίξει να ενημερώσει και τα δύο.
function clientRowHtml(c){
  var hasActive=c.weekPlan && Object.keys(c.weekPlan).length>0;
  var sportInfo=(typeof SPORT_INFO!=='undefined')?SPORT_INFO[c.sport]:null;
  var sport=sportInfo?(sportInfo.icon+' '+sportInfo.label):'—';
  var isSel=!!_clientBulkSelected[c.id];
  var rowClick=_clientBulkMode?('toggleClientBulkSelect(\''+c.id+'\')'):('selectClient(\''+c.id+'\')');
  var nameBadges=(clientHasFlaggedAppointment(c)?' <span title="Σημειωμένο για παρακολούθηση από ραντεβού">🚩</span>':'')
    +(clientHasLowPlanFeedback(c)?' <span title="Χαμηλή ικανοποίηση στην τελευταία αξιολόγηση πλάνου">😕</span>':'')
    +(clientHasNewClientNote(c)?' <span title="Νέα σημείωση από τον πελάτη">💬</span>':'')
    +(clientCriticalEA(c)?' <span class="cc-ea-badge" title="'+(c.sport?'Κίνδυνος RED-S — χαμηλή ενεργειακή διαθεσιμότητα':'Χαμηλή ενεργειακή διαθεσιμότητα')+' (EA &lt;30 kcal/kgLBM)">🔴 EA</span>':'');
  // ✅ audit fix (2026-08-24, finding #1): ίδιο data-client-id με το clientCardHtml — για το
  // δεξί-κλικ context menu στην προβολή "Λίστα".
  return '<tr class="cr'+(_clientBulkMode&&isSel?' cc-selected':'')+'" data-client-id="'+esc(c.id)+'" onclick="'+rowClick+'">'
    +'<td class="cr-name-cell">'
    +(_clientBulkMode
      ?('<div class="cc-bulk-check'+(isSel?' checked':'')+'">'+(isSel?'✓':'')+'</div>')
      :('<div class="cc-avatar'+(hasActive?' cc-avatar-active':'')+'">'+initials(c.name)+'</div>'))
    +'<span class="cr-name" title="'+esc(c.name||'Νέος πελάτης')+'">'+esc(c.name||'Νέος πελάτης')+'</span>'+nameBadges
    +'</td>'
    +'<td class="num">'+(c.age||'?')+'</td>'
    +'<td class="num">'+(c.weight||'?')+'kg</td>'
    +'<td>'+sport+(c.group?' <span class="cc-group-tag">🏷️ '+esc(c.group)+'</span>':'')+'</td>'
    +'<td><span class="cc-status '+(hasActive?'cc-status-active':'cc-status-none')+'">'+(hasActive?'📊 Ενεργό σχέδιο':'⭕ Χωρίς σχέδιο')+'</span></td>'
    +'<td>'+progressBadge(c)+'</td>'
    +'<td>'+lastAccessChipHtml(c.lastAccess)+'</td>'
    +'<td class="cr-actions">'+(_clientBulkMode?'':(
      '<button class="carch" title="Αρχειοθέτηση" aria-label="Αρχειοθέτηση πελάτη" onclick="event.stopPropagation();archiveClient(\''+c.id+'\')">📦</button>'
      +'<button class="cdel" aria-label="Διαγραφή πελάτη" onclick="event.stopPropagation();deleteClient(\''+c.id+'\')">✕</button>'
    ))+'</td>'
    +'</tr>';
}
function clientTableHtml(list){
  return '<div class="clients-table-wrap"><table class="clients-table">'
    +'<thead><tr><th>Πελάτης</th><th class="num">Ηλικία</th><th class="num">Βάρος</th><th>Άθλημα</th><th>Κατάσταση πλάνου</th><th>Τήρηση</th><th>Τελ. επίσκεψη</th><th></th></tr></thead>'
    +'<tbody>'+list.map(clientRowHtml).join('')+'</tbody>'
    +'</table></div>';
}
// Ενιαίο σημείο κλήσης όπου πριν υπήρχε '<div class="clients-grid">'+list.map(clientCardHtml)...
// ώστε το toggle Πλέγμα/Λίστα να επηρεάζει και το block "Χρειάζονται προσοχή" και το κύριο πλέγμα με
// μία αλλαγή. Οι ενότητες Αρχειοθετημένοι/Διαγραμμένοι πιο κάτω ΔΕΝ περνάνε από εδώ — παραμένουν πάντα
// σε κάρτες (σπάνια μεγάλες λίστες, διαφορετικό, πιο απλό markup από το clientCardHtml).
function clientCardsOrTable(list){
  return _clientViewMode==='list' ? clientTableHtml(list) : ('<div class="clients-grid">'+list.map(clientCardHtml).join('')+'</div>');
}
function renderSB(){
  var term=_clientSearchTerm;
  // ✅ FILTER: Exclude deleted + archived clients from the main list
  var base=clients.filter(function(c){return !c.deleted && !c.archived;});
  var list=base.filter(function(c){
    if(term && (c.name||'Νέος πελάτης').toLowerCase().indexOf(term)===-1) return false;
    if(_clientFilterGoal && c.goalMain!==_clientFilterGoal) return false;
    if(_clientFilterSport && c.sport!==_clientFilterSport) return false;
    if(_clientFilterGroup && c.group!==_clientFilterGroup) return false;
    var hasPlan=c.weekPlan && Object.keys(c.weekPlan).length>0;
    if(_clientFilterStatus==='active' && !hasPlan) return false;
    if(_clientFilterStatus==='noplan' && hasPlan) return false;
    if(_clientFilterQuick==='attention' && !clientNeedsAttention(c)) return false;
    if(_clientFilterQuick==='today' && !(c.lastAccess && Math.floor((Date.now()-c.lastAccess)/86400000)===0)) return false;
    return true;
  });
  // ✅ Sort according to the selected mode (default: most recent visit first)
  if(_clientSortMode==='name'){
    list.sort(function(a,b){return (a.name||'').localeCompare(b.name||'','el');});
  } else if(_clientSortMode==='oldest'){
    list.sort(function(a,b){return (a.lastAccess||0)-(b.lastAccess||0);});
  } else if(_clientSortMode==='stale'){
    list.sort(function(a,b){
      var sa=(window.Cloud&&window.Cloud.isStale)?window.Cloud.isStale(a):false;
      var sb=(window.Cloud&&window.Cloud.isStale)?window.Cloud.isStale(b):false;
      if(sa!==sb) return sa?-1:1;
      return (b.lastAccess||0)-(a.lastAccess||0);
    });
  } else if(_clientSortMode==='attention'){
    list.sort(function(a,b){
      var na=clientNeedsAttention(a), nb=clientNeedsAttention(b);
      if(na!==nb) return na?-1:1;
      return (b.lastAccess||0)-(a.lastAccess||0);
    });
  } else {
    list.sort(function(a,b){return(b.lastAccess||0)-(a.lastAccess||0);});
  }
  // ✅ 2026-08-06: μετρητής μετακινήθηκε πάνω από τη λίστα (πριν ζούσε θαμμένος στο τέλος σε 9px
  // γκρι κείμενο μετά τους αρχειοθετημένους/διαγραμμένους — εύκολο να μη φανεί καν χωρίς scroll).
  // Ένα σημείο τώρα, όχι δύο· ίδια λογική "Ν από Μ" μόνο όταν κάτι είναι φιλτραρισμένο.
  var html='<div class="clients-count-line">'
    +(list.length===base.length
      ? (base.length+' πελ'+(base.length===1?'άτης':'άτες'))
      : ('Εμφανίζονται '+list.length+' από '+base.length))
    +'</div>';
  // ✅ 🔗 Υγεία συνδέσμων της επιλεγμένης ομάδας — πάνω στο ήδη υπάρχον isStale() (βλ. Dietologist.html
  // "🔗 ΥΓΕΙΑ ΣΥΝΔΕΣΜΟΥ PORTAL"). Μετράει μόνο πελάτες που ΕΧΟΥΝ ήδη σύνδεσμο (c.shareToken) — όσοι δεν
  // έχουν στείλει ποτέ πλάνο δεν είναι ούτε "ενημερωμένοι" ούτε "ξεπερασμένοι", απλά άσχετοι με το μέτρο.
  // Χρησιμοποιεί base (πριν το φιλτράρισμα αναζήτησης), ώστε το % να αντιπροσωπεύει ΟΛΗ την ομάδα.
  if(_clientFilterGroup){
    var _grpMembers=base.filter(function(c){return c.group===_clientFilterGroup;});
    var _grpWithLink=_grpMembers.filter(function(c){return !!c.shareToken;});
    if(_grpWithLink.length){
      var _grpHealthyN=_grpWithLink.filter(function(c){return !(window.Cloud&&window.Cloud.isStale&&window.Cloud.isStale(c));}).length;
      var _grpPct=Math.round(_grpHealthyN/_grpWithLink.length*100);
      html+='<div style="display:flex;align-items:center;gap:10px;background:var(--panel-bg);border:1px solid var(--border-light);border-radius:12px;padding:8px 14px;margin-bottom:12px">'
        +pctRing(_grpPct,{size:34,thickness:5,color:pctStatusColor(_grpPct),track:'var(--border-light)',label:false})
        +'<span style="font-size:11.5px;color:var(--text-muted)"><b style="color:var(--text-strong)">'+_grpPct+'%</b> ενημερωμένοι σύνδεσμοι στην ομάδα «'+esc(_clientFilterGroup)+'» ('+_grpHealthyN+'/'+_grpWithLink.length+')</span>'
        +'</div>';
    }
  }
  // ✅ Γρήγορα chips (βλ. setClientQuickFilter πιο πάνω) — κρύβονται σε bulk mode, μαζί με το block
  // "Χρειάζονται προσοχή" που ήδη κρύβεται εκεί, ίδιος λόγος: οι κάρτες επιλέγουν αντί να ανοίγουν.
  if(!_clientBulkMode) html+=clientQuickChipsHtml(base);
  if((term||_clientFilterGoal||_clientFilterSport||_clientFilterGroup||_clientFilterStatus||_clientFilterQuick)&&list.length===0){
    html+='<div style="font-size:12px;color:var(--text-muted);padding:20px 0;text-align:center;font-style:italic">Κανένα αποτέλεσμα</div>';
  } else {
    // ✅ 2026-08-05: block "Χρειάζονται προσοχή" καρφωμένο πάνω από το κανονικό πλέγμα, ώστε αυτοί οι
    // πελάτες να μη χαθούν μέσα στη λίστα ανεξάρτητα από την επιλεγμένη ταξινόμηση/σελίδα scroll.
    // Ίδιο κριτήριο (clientNeedsAttention) με το sort mode "attention" εδώ και με την Αρχική
    // (homeClientsNeedingAttention, app-part5-home.js) — μία πηγή αλήθειας παντού. Κρύβεται σε bulk
    // mode: οι κάρτες εκεί επιλέγουν αντί να ανοίγουν προφίλ, θα μπέρδευε να εμφανίζεται δύο φορές.
    if(!_clientBulkMode){
      var attnClients=list.filter(clientNeedsAttention);
      if(attnClients.length){
        attnClients.sort(function(a,b){return (b.lastAccess||0)-(a.lastAccess||0);});
        html+='<div class="clients-attn-block">'
          +'<div class="clients-attn-title">🔔 Χρειάζονται προσοχή <span class="clients-attn-count">('+attnClients.length+')</span></div>'
          +clientCardsOrTable(attnClients)
          +'</div>';
      }
    }
    html+=clientCardsOrTable(list);
  }
  if(_clientBulkMode){
    var _bulkSelCount=Object.keys(_clientBulkSelected).filter(function(id){return _clientBulkSelected[id];}).length;
    var _bulkGroupNames=(typeof getAllGroupNames==='function')?getAllGroupNames():[];
    var _bulkBarHtml='<div class="bulk-action-bar">'
      +'<span class="bulk-count">'+_bulkSelCount+' επιλεγμένοι</span>'
      +'<select id="bulk-group-select" class="clients-toolbar-select" aria-label="Ομάδα προορισμού" onchange="onBulkGroupSelectChange(this)">'
      +'<option value="">— Επίλεξε ομάδα —</option>'
      +'<option value="__none__">Χωρίς ομάδα (αφαίρεση)</option>'
      +_bulkGroupNames.map(function(g){return '<option value="'+esc(g)+'">'+esc(g)+'</option>';}).join('')
      +'<option value="__new__">+ Νέα ομάδα…</option>'
      +'</select>'
      +'<span id="bulk-group-new-row" style="display:none;gap:6px;align-items:center">'
      +'<input type="text" id="bulk-group-new" placeholder="Όνομα νέας ομάδας" class="client-search-inp" style="width:160px;margin:0">'
      +'<button type="button" class="hm-action-btn" onclick="applyBulkGroupNew()">✓ Εφαρμογή</button>'
      +'</span>'
      +'<button type="button" class="hm-action-btn" onclick="applyBulkGroupAssign()"'+(_bulkSelCount?'':' disabled')+'>Εφαρμογή σε '+_bulkSelCount+'</button>'
      +'<button type="button" class="hm-action-btn" style="background:#F1EFE8;color:#5F5E5A" onclick="toggleClientBulkMode()">Άκυρο</button>'
      +'</div>';
    html=_bulkBarHtml+html;
  }

  // ✅ ARCHIVE SECTION: Show archived (but not deleted) clients
  var archivedClients = clients.filter(function(c){return c.archived && !c.deleted;});
  if(archivedClients.length > 0 && !term){
    html+='<div class="clients-section-title">📦 Αρχειοθετημένοι ('+archivedClients.length+')</div>';
    html+='<div class="clients-grid">';
    archivedClients.forEach(function(c){
      html+='<div class="client-card cc-muted">'
        +'<div class="cc-name cc-muted-name">'+esc(c.name||'Νέος πελάτης')+'</div>'
        +'<div class="cc-sub cc-muted-sub">Αρχειοθετήθηκε</div>'
        +'<div class="cc-muted-actions">'
        +'<button class="cc-restore" onclick="event.stopPropagation();unarchiveClient(\''+c.id+'\');renderSB()">↶ Επαναφορά</button>'
        +'<button class="cc-permadelete" onclick="event.stopPropagation();deleteClient(\''+c.id+'\');renderSB()">🗑️ Διαγραφή</button>'
        +'</div>'
        +'</div>';
    });
    html+='</div>';
  }

  // ✅ TRASH SECTION: Show deleted clients
  var deletedClients = clients.filter(function(c){return c.deleted;});
  if(deletedClients.length > 0 && !term){
    html+='<div class="clients-section-title">🗑️ Διαγραμμένοι ('+deletedClients.length+')</div>';
    html+='<div class="clients-grid">';
    deletedClients.forEach(function(c){
      html+='<div class="client-card cc-muted">'
        +'<div class="cc-name cc-muted-name">'+esc(c.name||'Νέος πελάτης')+'</div>'
        +'<div class="cc-sub cc-muted-sub">Διαγράφηκε</div>'
        +'<div class="cc-muted-actions">'
        +'<button class="cc-restore" onclick="event.stopPropagation();restoreClient(\''+c.id+'\');renderSB()">↶ Ανάκτηση</button>'
        +'<button class="cc-permadelete" onclick="event.stopPropagation();permanentlyDeleteClient(\''+c.id+'\');renderSB()">🗑️ Μόνιμα</button>'
        +'</div>'
        +'</div>';
    });
    html+='</div>';
  }

  var clientListEl=document.getElementById('client-list');
  if(clientListEl) clientListEl.innerHTML=html;

  // ✅ Update breadcrumbs after rendering
  if(typeof updateBreadcrumbs === 'function') updateBreadcrumbs();
  // ✅ Keep the "Αρχική" nav badge in sync — renderSB() runs after nearly every action app-wide,
  // so this is the one place that guarantees the badge is fresh no matter which tab is open.
  if(typeof updateHomeNavBadge === 'function') updateHomeNavBadge();
  // Ίδιο σκεπτικό για το badge του "💬 Μηνύματα" (js/app-part5-home.js).
  if(typeof updateMessagesNavBadge === 'function') updateMessagesNavBadge();
}


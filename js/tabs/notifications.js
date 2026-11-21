// js/tabs/notifications.js
// 🔔 Ειδοποιήσεις (2026-11-21) — καμπανάκι πάνω δεξιά + πάνελ με ό,τι κάνουν οι πελάτες στο link τους.
// Δύο επίπεδα ώστε να μην κουράζει:
//   • «Χρειάζονται εσένα» — ό,τι θέλει κίνηση (ερώτηση ❓, χαμηλή βαθμολογία πλάνου, νέο ερωτηματολόγιο,
//     και προαιρετικά σχόλιο ημέρας). ΜΟΝΟ αυτά μετράνε στον κόκκινο αριθμό του καμπανακιού.
//   • «Σύνοψη ημέρας» — όλα τα υπόλοιπα ομαδοποιημένα («8 συμπλήρωσαν τη μέρα τους»), χωρίς badge.
// Τι πάει πού το ορίζει ο χρήστης στις ρυθμίσεις του πάνελ (notifPrefs, ταξιδεύει στο cloud blob).
// Σίγαση πελάτη (c.notifMuted): τα «Χρειάζονται εσένα» του πάνε στη σύνοψη, χωρίς badge.
// ΔΕΝ φέρνει δικά του δεδομένα — διαβάζει τα caches που ήδη γεμίζουν goToApp + το 2λεπτο poll
// (client_logs, plan_feedback, checkins, workout_log, intake, food_diary). Το «Το είδα»/«Απάντηση» για
// ερωτήσεις/feedback είναι τα ΙΔΙΑ flags με το «💬 Μηνύματα» (markNoteSeen/markPfSeen/reply*), ώστε
// ό,τι χειρίζεσαι εδώ να φεύγει κι από εκεί και το αντίστροφο.

var NOTIF_DAYS=7;                 // πόσες μέρες πίσω δείχνει η σύνοψη
var NOTIF_INTAKE_FRESH_DAYS=14;   // ερωτηματολόγια παλιότερα από αυτό δεν εμφανίζονται ως νέα
var NOTIF_TYPES=[
  {k:'q',       label:'Γράφει ερώτηση',              sub:'«Ρώτησέ με» στο link (❓)',               action:true, def:'alert'},
  {k:'fb',      label:'Χαμηλή βαθμολογία πλάνου',    sub:'Εβδομαδιαίο feedback',                    action:true, def:'alert'},
  {k:'intake',  label:'Συμπλήρωσε ερωτηματολόγιο',   sub:'Έτοιμο για «Εφαρμογή»',                   action:true, def:'alert'},
  {k:'comment', label:'Σχόλιο στη μέρα του',         sub:'Σημείωση ημέρας στο link',                action:true, def:'digest'},
  {k:'day',     label:'Συμπλήρωσε τη μέρα του',      sub:'Check-in γευμάτων / νερού / συμπληρωμάτων', def:'digest'},
  {k:'workout', label:'Κατέγραψε προπόνηση',         sub:'Τσεκάρισμα στο link',                     def:'digest'},
  {k:'weight',  label:'Έγραψε βάρος',                sub:'Ζύγιση από το link',                       def:'digest'},
  {k:'diary',   label:'Ημερολόγιο φαγητού',          sub:'Νέα καταγραφή στο ημερολόγιο',             def:'digest'},
  {k:'streak',  label:'Σερί 7 / 14 / 21… ημερών',    sub:'Ευκαιρία για ένα «μπράβο»',                def:'digest'},
  {k:'nudge',   label:'Σταμάτησε να καταγράφει',     sub:'3+ μέρες χωρίς τίποτα (Πρόοδος)',          def:'digest'}
];
var NOTIF_MODE_LABELS={alert:'Ειδοποίηση',digest:'Σύνοψη',off:'Όχι'};

var _notifOpen=false, _notifView='list', _notifOpenDays={}, _notifRefreshedAt=0, _notifRefreshing=false;

// ── Ρυθμίσεις ─────────────────────────────────────────────────────────────
function notifPrefs(){
  var p=(typeof safeStorageGet==='function'?safeStorageGet('notifPrefs',null):null);
  return (p && typeof p==='object')?p:{};
}
function notifMode(k){
  var p=notifPrefs(), t=NOTIF_TYPES.filter(function(x){return x.k===k;})[0];
  var m=p[k];
  if(m==='alert' && t && !t.action) m=null;   // μόνο τα «χειρίσιμα» μπορούν να ανεβάζουν badge
  return (m==='alert'||m==='digest'||m==='off')?m:(t?t.def:'digest');
}
function notifSetMode(k,m){
  var p=notifPrefs(); p[k]=m;
  if(typeof safeStorageSet==='function') safeStorageSet('notifPrefs',p);
  if(typeof save==='function') save();
  updateNotifBell(); renderNotifPanel();
}
// 📧 Βραδινό email (φάση 2): το διαβάζει το scripts/notif_digest.py από το cloud blob — false = σταμάτα.
function notifEmailOn(){ return notifPrefs().email!==false; }
function notifSetEmail(on){
  var p=notifPrefs(); p.email=!!on;
  if(typeof safeStorageSet==='function') safeStorageSet('notifPrefs',p);
  if(typeof save==='function') save();
  renderNotifPanel();
}
function notifSetMuted(clientId,on){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  if(on) c.notifMuted=true; else delete c.notifMuted;
  if(typeof save==='function') save();
  updateNotifBell(); renderNotifPanel();
}
function notifMuteByName(name){
  name=String(name||'').trim().toLowerCase();
  if(!name) return;
  var c=notifActiveClients().filter(function(x){return (x.name||'').trim().toLowerCase()===name;})[0];
  if(!c){ if(typeof showErrorToast==='function') showErrorToast('Δεν βρέθηκε πελάτης με αυτό το όνομα.'); return; }
  notifSetMuted(c.id,true);
}

// ── Βοηθητικά ─────────────────────────────────────────────────────────────
function notifActiveClients(){ return (window.clients||[]).filter(function(c){return c && !c.deleted && !c.archived;}); }
function notifDayKey(off){ var d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-off); return ckDayKey(d); }
function notifShortName(c){
  var parts=String(c.name||'Πελάτης').trim().split(/\s+/);
  return parts.length>1?(parts[0]+' '+parts[parts.length-1].charAt(0)+'.'):parts[0];
}
function notifNameList(list,max){
  max=max||3;
  var names=list.slice(0,max).map(function(c){return esc(notifShortName(c));});
  var rest=list.length-names.length;
  return names.join(', ')+(rest>0?(' και '+rest+' ακόμη'):'');
}
function notifDayLabel(key){
  if(key===notifDayKey(0)) return 'Σήμερα';
  if(key===notifDayKey(1)) return 'Χθες';
  var d=new Date(key+'T00:00:00');
  return ['Κυρ','Δευ','Τρί','Τετ','Πέμ','Παρ','Σάβ'][d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1);
}
function notifAgo(key){
  if(typeof msgDaysAgoText==='function') return msgDaysAgoText(key);
  return key;
}
function notifParseNote(raw){
  raw=String(raw||'');
  var m=/^\[tag:(travel|party|sick)\]\s*/.exec(raw), tag=null;
  if(m){ tag=m[1]; raw=raw.slice(m[0].length); }
  return {tag:tag, text:raw.trim()};
}
function notifClip(s,n){ s=String(s||''); return s.length>n?(s.slice(0,n)+'…'):s; }

// ── Συλλογή: ό,τι «χρειάζεται εσένα» (ανεξάρτητα από τη ρύθμιση — αυτή εφαρμόζεται στο split) ──
function notifCollectActions(){
  var out=[];
  // ❓ ερωτήσεις + 😕 χαμηλό feedback: ακριβώς τα αναπάντητα του «💬 Μηνύματα»
  if(typeof collectAllClientMessages==='function'){
    collectAllClientMessages().forEach(function(m){
      if(m.handled) return;
      out.push({k:m.type==='note'?'q':'fb', c:m.c, date:m.date, m:m});
    });
  }
  var oldest=notifDayKey(NOTIF_DAYS-1);
  notifActiveClients().forEach(function(c){
    // 💬 σχόλια ημέρας (χωρίς ❓) — τελευταίες NOTIF_DAYS μέρες, όχι ήδη «το είδα»/απαντημένα
    if(c.shareToken && window.Cloud && typeof window.Cloud.allClientLogsFor==='function'){
      window.Cloud.allClientLogsFor(c).forEach(function(e){
        if(!e.date || e.date<oldest) return;
        var p=notifParseNote(e.note);
        if(!p.text) return;
        if(typeof clientNoteNeedsReply==='function' && clientNoteNeedsReply(p.text)) return; // = ερώτηση, πιάστηκε πάνω
        if((typeof isNoteSeen==='function' && isNoteSeen(c,e.date)) || (typeof isNoteReplied==='function' && isNoteReplied(c,e.date))) return;
        out.push({k:'comment', c:c, date:e.date, text:p.text, tag:p.tag});
      });
    }
    // 📋 ερωτηματολόγιο που υποβλήθηκε (και δεν το έχεις ήδη δει από εδώ)
    if(c.intakeStatus==='submitted' && c.intakeSubmittedAt && c.intakeNotifSeen!==c.intakeSubmittedAt){
      var sub=new Date(c.intakeSubmittedAt);
      if(!isNaN(sub) && (Date.now()-sub.getTime())<=NOTIF_INTAKE_FRESH_DAYS*86400000){
        out.push({k:'intake', c:c, date:ckDayKey(sub)});
      }
    }
  });
  out.sort(function(a,b){ return a.date<b.date?1:(a.date>b.date?-1:0); });
  return out;
}
// alert = στο «Χρειάζονται εσένα» + badge· quiet = στη σύνοψη της ημέρας τους
function notifSplit(){
  var alert=[], quiet=[];
  notifCollectActions().forEach(function(it){
    var mode=notifMode(it.k);
    if(mode==='off') return;
    if(mode==='alert' && !it.c.notifMuted) alert.push(it); else quiet.push(it);
  });
  return {alert:alert, quiet:quiet};
}
function notifAlertCount(){ try{ return notifSplit().alert.length; }catch(e){ return 0; } }

// ── Σύνοψη ανά ημέρα ──────────────────────────────────────────────────────
function notifDigestFor(key,quiet){
  var isToday=key===notifDayKey(0);
  var hasCloud=!!window.Cloud;
  var res={day:[], workout:[], weight:[], diary:[], quiet:quiet.filter(function(it){return it.date===key;}), streak:[], nudge:0};
  notifActiveClients().forEach(function(c){
    if(hasCloud && c.shareToken){
      if(notifMode('day')!=='off' && typeof window.Cloud.checkinsFor==='function'){
        var r=window.Cloud.checkinsFor(c).filter(function(x){return x.date===key;})[0];
        if(r && (r.meals_done>0 || r.supps_done>0 || r.water_glasses>0)) res.day.push(c);
      }
      if(notifMode('workout')!=='off' && typeof window.Cloud.workoutLogFor==='function'){
        var w=window.Cloud.workoutLogFor(c)[key];
        if(w && (w.d || w.e)){
          var lbl='';
          if(w.e && typeof PROGRESS_WK_TYPES!=='undefined') lbl=(PROGRESS_WK_TYPES[w.e.t]||'')+(w.e.m?(' '+w.e.m+'′'):'');
          res.workout.push({c:c, lbl:lbl});
        }
      }
      if(notifMode('weight')!=='off' && typeof window.Cloud.allClientLogsFor==='function'){
        var logs=window.Cloud.allClientLogsFor(c).filter(function(e){return e.weight_kg!=null && e.weight_kg!=='';});
        for(var i=0;i<logs.length;i++){
          if(logs[i].date!==key) continue;
          var prev=logs[i+1], delta=null;
          if(prev) delta=Math.round((Number(logs[i].weight_kg)-Number(prev.weight_kg))*10)/10;
          res.weight.push({c:c, kg:logs[i].weight_kg, delta:delta});
          break;
        }
      }
    }
    if(notifMode('diary')!=='off' && c.diaryLastEntryAt){
      var dd=new Date(c.diaryLastEntryAt);
      if(!isNaN(dd) && ckDayKey(dd)===key) res.diary.push(c);
    }
    if(isToday && notifMode('streak')!=='off' && hasCloud && c.shareToken && typeof window.Cloud.checkinsFor==='function' && typeof ckStreak==='function'){
      var rows=window.Cloud.checkinsFor(c);
      if(rows.length){
        var n=ckStreak(ckRowsByDate(rows));
        if(n>=7 && n%7===0) res.streak.push({c:c, n:n});
      }
    }
  });
  if(isToday && notifMode('nudge')!=='off' && typeof progressRosterData==='function'){
    try{ res.nudge=progressRosterData().filter(function(x){return x.flags.indexOf('nudge')>=0 || x.flags.indexOf('gone')>=0;}).length; }catch(e){}
  }
  res.total=res.day.length+res.workout.length+res.weight.length+res.diary.length+res.quiet.length+res.streak.length+res.nudge;
  return res;
}
function notifQuietLabel(it){
  if(it.k==='q') return '❓ έγραψε ερώτηση';
  if(it.k==='fb') return '😕 χαμηλή βαθμολογία πλάνου';
  if(it.k==='intake') return '📋 συμπλήρωσε ερωτηματολόγιο';
  return '💬 «'+esc(notifClip(it.text,70))+'»';
}
function notifOneLiner(g){
  var parts=[];
  if(g.day.length) parts.push(g.day.length+' συμπλήρωσαν τη μέρα');
  if(g.workout.length) parts.push(g.workout.length+' '+(g.workout.length===1?'προπόνηση':'προπονήσεις'));
  if(g.weight.length) parts.push(g.weight.length+' '+(g.weight.length===1?'βάρος':'βάρη'));
  if(g.diary.length) parts.push(g.diary.length+' ημερολόγ.');
  var cm=g.quiet.length;
  if(cm) parts.push(cm+' '+(cm===1?'σχόλιο/μήνυμα':'σχόλια/μηνύματα'));
  return parts.join(' · ');
}

// ── Ενέργειες ─────────────────────────────────────────────────────────────
function notifAfterAction(){
  if(typeof save==='function') save();
  if(typeof renderSB==='function') renderSB();
  updateNotifBell(); renderNotifPanel();
}
function notifSeen(k,clientId,date){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  if(k==='q' || k==='comment'){ if(typeof markNoteSeen==='function') markNoteSeen(c,date); }
  else if(k==='fb'){ if(typeof markPfSeen==='function') markPfSeen(c,date); }
  else if(k==='intake'){ c.intakeNotifSeen=c.intakeSubmittedAt; }
  notifAfterAction();
}
function notifReply(k,clientId,date){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  if(k==='fb'){ if(typeof replyToPlanFeedback==='function') replyToPlanFeedback(clientId,date,null); }
  else {
    var e=(window.Cloud && window.Cloud.allClientLogsFor?window.Cloud.allClientLogsFor(c):[]).filter(function(x){return x.date===date;})[0];
    var txt=e?notifParseNote(e.note).text:'';
    if(typeof replyToClientNote==='function') replyToClientNote(clientId,date,txt);
  }
  setTimeout(notifAfterAction,50);
}
function notifOpenClient(clientId,tab){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  closeNotifPanel();
  if(typeof selectClient==='function') selectClient(clientId);
  if(typeof swTab==='function') swTab(tab);
}
function notifOpenIntake(clientId){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  c.intakeNotifSeen=c.intakeSubmittedAt;
  if(typeof save==='function') save();
  updateNotifBell();
  notifOpenClient(clientId,1);
}
function notifGoTab(tab){ closeNotifPanel(); if(typeof swTab==='function') swTab(tab); }
function notifSendBravo(clientId,n){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  var fname=(c.name||'').split(' ')[0];
  var d=(typeof clientMsgDict==='function')?clientMsgDict(c):null;
  var msg=(d && d.streakBravo)?d.streakBravo(fname,n):('Μπράβο '+fname+'! 👏 '+n+' μέρες στη σειρά!');
  var phone=(typeof normalizePhoneIntl==='function')?normalizePhoneIntl(c.phone):'';
  if(phone) window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  else if(c.email) location.href='mailto:'+encodeURIComponent(c.email).replace(/%40/g,'@')+'?body='+encodeURIComponent(msg);
  else { if(typeof showErrorToast==='function') showErrorToast('Δεν υπάρχει τηλέφωνο ή email για τον/την '+(c.name||'πελάτη')+'.'); return; }
  c.notifBravoSent=notifDayKey(0)+'|'+n;
  if(typeof markDietologistContacted==='function') markDietologistContacted(c);
  notifAfterAction();
}
function notifMarkAllSeen(){
  var items=notifSplit().alert;
  if(!items.length) return;
  var doIt=function(){
    items.forEach(function(it){
      if(it.k==='q' || it.k==='comment'){ if(typeof markNoteSeen==='function') markNoteSeen(it.c,it.date); }
      else if(it.k==='fb'){ if(typeof markPfSeen==='function') markPfSeen(it.c,it.date); }
      else if(it.k==='intake'){ it.c.intakeNotifSeen=it.c.intakeSubmittedAt; }
    });
    notifAfterAction();
  };
  if(typeof showConfirmDialog==='function') showConfirmDialog('Μαρκάρισμα '+items.length+' ειδοποιήσεων ως διαβασμένες, χωρίς απάντηση;',doIt,{icon:'👁️',confirmLabel:'Όλα διαβασμένα'});
  else doIt();
}
function notifToggleDay(key){ _notifOpenDays[key]=!_notifOpenDays[key]; renderNotifPanel(); }
function notifSetView(v){ _notifView=v; renderNotifPanel(); }

// Φρεσκάρει τα caches όταν ανοίγει το πάνελ (αν πέρασε >1′ από το τελευταίο) — αλλιώς βλέπεις ό,τι
// έφερε το 2λεπτο poll. Ποτέ δεν μπλοκάρει το άνοιγμα: πρώτα ζωγραφίζει από τη μνήμη.
function notifRefresh(force){
  if(!window.Cloud || !window.Cloud.enabled || _notifRefreshing) return;
  if(!force && Date.now()-_notifRefreshedAt<60000) return;
  _notifRefreshing=true; renderNotifPanel();
  var C=window.Cloud, call=function(fn){ return (typeof C[fn]==='function')?Promise.resolve(C[fn]()).catch(function(){}):Promise.resolve(); };
  Promise.all(['refreshClientLogsCache','refreshPlanFeedbackCache','refreshCheckinsCache','refreshWorkoutLogCache','refreshIntakeStatuses','refreshFoodDiaryStatuses'].map(call))
    .then(function(){ _notifRefreshing=false; _notifRefreshedAt=Date.now(); updateNotifBell(); renderNotifPanel(); });
}

// ── Καμπανάκι & πάνελ ─────────────────────────────────────────────────────
function updateNotifBell(){
  var n=notifAlertCount();
  var badge=document.getElementById('notif-bell-badge');
  if(badge){ badge.textContent=n>99?'99+':String(n); badge.style.display=n>0?'flex':'none'; }
  var bell=document.getElementById('notif-bell');
  if(bell) bell.setAttribute('aria-label','Ειδοποιήσεις'+(n>0?(' — '+n+' χρειάζονται εσένα'):''));
}
function toggleNotifPanel(){ if(_notifOpen) closeNotifPanel(); else openNotifPanel(); }
function openNotifPanel(){
  _notifOpen=true; _notifView='list';
  var bell=document.getElementById('notif-bell'); if(bell){ bell.classList.add('open'); bell.setAttribute('aria-expanded','true'); }
  renderNotifPanel();
  notifRefresh(false);
}
function closeNotifPanel(){
  _notifOpen=false;
  var p=document.getElementById('notif-panel'); if(p) p.style.display='none';
  var bell=document.getElementById('notif-bell'); if(bell){ bell.classList.remove('open'); bell.setAttribute('aria-expanded','false'); }
}
function notifActionCardHtml(it){
  var c=it.c, id=c.id, kindTxt, body='', primary='';
  var dArg="'"+it.k+"','"+id+"','"+it.date+"'";
  if(it.k==='q'){
    kindTxt='❓ Έγραψε ερώτηση';
    body='«'+esc(notifClip(it.m.noteRaw,160))+'»';
    primary='<button type="button" class="nt-btn nt-btn-pri" onclick="notifReply('+dArg+')">↩️ Απάντηση</button>';
  } else if(it.k==='fb'){
    var e=it.m.entry;
    kindTxt='😕 Χαμηλή βαθμολογία πλάνου';
    body=it.m.lowKeys.map(function(k){
      var reasons=((e.low_rating_reasons||{})[k]||[]).join(', ');
      return esc(((typeof PF_ROW_LABELS!=='undefined'&&PF_ROW_LABELS[k])||k)+' '+e[k]+'★'+(reasons?(' · '+reasons):''));
    }).join(' · ')+(it.m.lowNps?((it.m.lowKeys.length?' · ':'')+'συνέχιση '+e.continue_likelihood+'/10'):'');
    primary='<button type="button" class="nt-btn nt-btn-pri" onclick="notifReply('+dArg+')">↩️ Απάντηση</button>';
  } else if(it.k==='intake'){
    kindTxt='📋 Συμπλήρωσε το ερωτηματολόγιο';
    body='Έτοιμο για «Εφαρμογή» στον φάκελό του/της.';
    primary='<button type="button" class="nt-btn nt-btn-pri" onclick="notifOpenIntake(\''+id+'\')">Άνοιγμα</button>';
  } else {
    kindTxt='💬 Σχόλιο στη μέρα του';
    body='«'+esc(notifClip(it.text,160))+'»';
    primary='<button type="button" class="nt-btn nt-btn-pri" onclick="notifReply('+dArg+')">↩️ Απάντηση</button>';
  }
  return '<div class="nt-card">'
    +'<button type="button" class="nt-avatar" title="Άνοιγμα πελάτη" onclick="notifOpenClient(\''+id+'\',TAB_APPOINTMENTS)">'+esc(initials(c.name))+'</button>'
    +'<div class="nt-card-body">'
      +'<div class="nt-card-top"><button type="button" class="nt-name" onclick="notifOpenClient(\''+id+'\',TAB_APPOINTMENTS)">'+esc(c.name||'Πελάτης')+'</button><span class="nt-when">'+esc(notifAgo(it.date))+'</span></div>'
      +'<div class="nt-kind">'+kindTxt+'</div>'
      +'<div class="nt-text">'+body+'</div>'
      +'<div class="nt-actions">'+primary+'<button type="button" class="nt-btn" onclick="notifSeen('+dArg+')">👁️ Το είδα</button></div>'
    +'</div></div>';
}
function notifRowHtml(icon,html,sub,extra,onclick){
  return '<div class="nt-row'+(onclick?' nt-row-link':'')+'"'+(onclick?(' role="button" tabindex="0" onclick="'+onclick+'" onkeydown="if(event.key===\'Enter\')this.click()"'):'')+'>'
    +'<span class="nt-row-ic" aria-hidden="true">'+icon+'</span>'
    +'<div class="nt-row-main"><div>'+html+'</div>'+(sub?('<div class="nt-row-sub">'+sub+'</div>'):'')+'</div>'
    +(extra||'')+'</div>';
}
function notifDigestHtml(g,key){
  var h='';
  if(g.day.length) h+=notifRowHtml('✅','<b>'+g.day.length+' '+(g.day.length===1?'πελάτης':'πελάτες')+'</b> συμπλήρωσαν τη μέρα τους',notifNameList(g.day),'',"notifGoTab(10)");
  if(g.workout.length){
    var wsub=g.workout.slice(0,3).map(function(x){return esc(notifShortName(x.c))+(x.lbl?(' ('+esc(x.lbl.trim())+')'):'');}).join(', ')+(g.workout.length>3?(' και '+(g.workout.length-3)+' ακόμη'):'');
    h+=notifRowHtml('🏃','<b>'+g.workout.length+'</b> κατέγραψαν προπόνηση',wsub,'',"notifGoTab(10)");
  }
  if(g.weight.length){
    var wt=g.weight.slice(0,3).map(function(x){
      var d=x.delta==null?(x.kg+' kg'):((x.delta>0?'+':(x.delta<0?'−':'±'))+Math.abs(x.delta).toFixed(1).replace('.',',')+' kg');
      return esc(notifShortName(x.c))+' '+d;
    }).join(' · ')+(g.weight.length>3?(' · +'+(g.weight.length-3)):'');
    h+=notifRowHtml('⚖️','<b>'+g.weight.length+'</b> '+(g.weight.length===1?'νέα μέτρηση':'νέες μετρήσεις')+' βάρους',wt,'');
  }
  if(g.diary.length) h+=notifRowHtml('📒','<b>'+g.diary.length+'</b> '+(g.diary.length===1?'ημερολόγιο':'ημερολόγια')+' φαγητού',notifNameList(g.diary),'',g.diary.length===1?("notifOpenClient('"+g.diary[0].id+"',1)"):'');
  g.quiet.forEach(function(it){
    h+=notifRowHtml(it.c.notifMuted?'🔇':'💬','<b>'+esc(notifShortName(it.c))+'</b> '+notifQuietLabel(it),'','',
      it.k==='intake'?("notifOpenIntake('"+it.c.id+"')"):("notifOpenClient('"+it.c.id+"',TAB_APPOINTMENTS)"));
  });
  g.streak.forEach(function(x){
    var sent=x.c.notifBravoSent===(key+'|'+x.n);
    var btn=sent?'<span class="nt-row-done">✓ στάλθηκε</span>'
      :('<button type="button" class="nt-btn" onclick="event.stopPropagation();notifSendBravo(\''+x.c.id+'\','+x.n+')">👏 Στείλε μπράβο</button>');
    h+=notifRowHtml('⭐','<b>'+esc(notifShortName(x.c))+'</b> έφτασε '+x.n+' μέρες στη σειρά','Καλή ευκαιρία για ένα «μπράβο»',btn);
  });
  if(g.nudge) h+=notifRowHtml('🔔','<b>'+g.nudge+'</b> δεν έχουν καταγράψει 3+ μέρες','Δες τους στην Πρόοδο για υπενθύμιση','',"notifGoTab(10)");
  return h;
}
function notifListHtml(){
  var sp=notifSplit();
  var h='<div class="nt-sec"><span class="nt-dot nt-dot-red"></span><span class="nt-sec-t nt-sec-red">Χρειάζονται εσένα</span><span class="nt-sec-n">· '+sp.alert.length+'</span></div>';
  if(!sp.alert.length) h+='<div class="nt-empty">Όλα χειρισμένα 👍</div>';
  else h+=sp.alert.map(notifActionCardHtml).join('');
  var anyDigest=false;
  for(var off=0;off<NOTIF_DAYS;off++){
    var key=notifDayKey(off), g=notifDigestFor(key,sp.quiet);
    if(off===0){
      h+='<div class="nt-sec nt-sec-sep"><span class="nt-dot"></span><span class="nt-sec-t">Σήμερα με μια ματιά</span><span class="nt-sec-n">· σύνοψη, χωρίς badge</span></div>';
      h+=g.total?('<div class="nt-digest">'+notifDigestHtml(g,key)+'</div>'):'<div class="nt-empty nt-empty-soft">Τίποτα ακόμα σήμερα.</div>';
      anyDigest=true;
      continue;
    }
    if(!g.total) continue;
    var open=!!_notifOpenDays[key];
    h+='<button type="button" class="nt-day" aria-expanded="'+open+'" onclick="notifToggleDay(\''+key+'\')">'
      +'<span class="nt-day-l">'+notifDayLabel(key)+'</span><span class="nt-day-s">'+notifOneLiner(g)+'</span><span aria-hidden="true">'+(open?'▴':'▾')+'</span></button>';
    if(open) h+='<div class="nt-digest">'+notifDigestHtml(g,key)+'</div>';
  }
  return h;
}
function notifSettingsHtml(){
  var h='<div class="nt-set-intro">Μόνο ό,τι είναι στο «Ειδοποίηση» ανεβάζει τον κόκκινο αριθμό. Τα υπόλοιπα μπαίνουν ήσυχα στη σύνοψη της ημέρας.</div>';
  NOTIF_TYPES.forEach(function(t){
    var cur=notifMode(t.k), modes=t.action?['alert','digest','off']:['digest','off'];
    h+='<div class="nt-set-row"><div class="nt-set-l"><div class="nt-set-t">'+t.label+'</div><div class="nt-set-s">'+t.sub+'</div></div>'
      +'<div class="nt-seg" role="group" aria-label="'+esc(t.label)+'">'
      +modes.map(function(m){
        return '<button type="button" class="nt-seg-b'+(m===cur?' on':'')+'" aria-pressed="'+(m===cur)+'" onclick="notifSetMode(\''+t.k+'\',\''+m+'\')">'+NOTIF_MODE_LABELS[m]+'</button>';
      }).join('')
      +'</div></div>';
  });
  var em=notifEmailOn();
  h+='<div class="nt-set-row nt-set-email"><div class="nt-set-l"><div class="nt-set-t">📧 Βραδινό email στις 21:00</div>'
    +'<div class="nt-set-s">Η ίδια σύνοψη στο Gmail σου κάθε βράδυ, χωρίς να ανοίξεις το πρόγραμμα. Ακολουθεί τις ρυθμίσεις από πάνω.</div></div>'
    +'<div class="nt-seg" role="group" aria-label="Βραδινό email">'
    +'<button type="button" class="nt-seg-b'+(em?' on':'')+'" aria-pressed="'+em+'" onclick="notifSetEmail(true)">Ναι</button>'
    +'<button type="button" class="nt-seg-b'+(!em?' on':'')+'" aria-pressed="'+(!em)+'" onclick="notifSetEmail(false)">Όχι</button>'
    +'</div></div>';
  var muted=notifActiveClients().filter(function(c){return c.notifMuted;});
  h+='<div class="nt-set-mute"><div class="nt-set-t">🔇 Σίγαση πελάτη</div>'
    +'<div class="nt-set-s">Για όσους γράφουν πολύ συχνά: ό,τι στέλνουν μπαίνει μόνο στη σύνοψη, χωρίς κόκκινο αριθμό.</div>'
    +'<div class="nt-chips">'+(muted.length?muted.map(function(c){
        return '<span class="nt-chip">'+esc(c.name||'Πελάτης')+'<button type="button" aria-label="Αφαίρεση σίγασης '+esc(c.name||'')+'" onclick="notifSetMuted(\''+c.id+'\',false)">×</button></span>';
      }).join(''):'<span class="nt-set-s">Κανένας σε σίγαση.</span>')+'</div>'
    +'<div class="nt-mute-add"><input type="text" id="notif-mute-inp" list="notif-mute-dl" placeholder="Όνομα πελάτη…" aria-label="Πελάτης για σίγαση" onkeydown="if(event.key===\'Enter\'){notifMuteByName(this.value);}">'
    +'<datalist id="notif-mute-dl">'+notifActiveClients().filter(function(c){return !c.notifMuted;}).map(function(c){return '<option value="'+esc(c.name||'')+'">';}).join('')+'</datalist>'
    +'<button type="button" class="nt-btn" onclick="notifMuteByName(document.getElementById(\'notif-mute-inp\').value)">+ Σίγαση</button></div>'
    +'</div>';
  return h;
}
function renderNotifPanel(){
  if(!_notifOpen) return;
  var p=document.getElementById('notif-panel');
  if(!p){
    p=document.createElement('section');
    p.id='notif-panel'; p.className='nt-panel'; p.setAttribute('aria-label','Ειδοποιήσεις');
    var host=document.getElementById('app-container')||document.body;
    host.appendChild(p);
  }
  var body=p.querySelector('.nt-body'), scroll=body?body.scrollTop:0;
  var isSet=_notifView==='settings';
  var n=isSet?0:notifSplit().alert.length;
  var ago=_notifRefreshing?'⏳ Ενημέρωση…':(_notifRefreshedAt?('Ενημερώθηκε '+(Date.now()-_notifRefreshedAt<60000?'μόλις τώρα':('πριν '+Math.round((Date.now()-_notifRefreshedAt)/60000)+'′'))):'');
  p.innerHTML='<div class="nt-head">'
      +(isSet?'<button type="button" class="nt-icon-b" aria-label="Πίσω" onclick="notifSetView(\'list\')">←</button>':'')
      +'<h2 class="nt-title">'+(isSet?'Τι να μου λέει':'Ειδοποιήσεις')+'</h2>'
      +'<div class="nt-head-r">'
        +(!isSet && n?'<button type="button" class="nt-link-b" onclick="notifMarkAllSeen()">Όλα διαβασμένα</button>':'')
        +(isSet?'':'<button type="button" class="nt-icon-b" aria-label="Ρυθμίσεις ειδοποιήσεων" title="Τι να μου λέει" onclick="notifSetView(\'settings\')">⚙️</button>')
        +'<button type="button" class="nt-icon-b" aria-label="Κλείσιμο" onclick="closeNotifPanel()">✕</button>'
      +'</div></div>'
    +'<div class="nt-body">'+(isSet?notifSettingsHtml():notifListHtml())+'</div>'
    +(isSet?'':('<div class="nt-foot"><button type="button" class="nt-link-b" onclick="notifRefresh(true)">🔄 '+(ago||'Ανανέωση')+'</button>'
      +'<button type="button" class="nt-link-b" onclick="notifGoTab(9)">Όλα τα μηνύματα →</button></div>'));
  p.style.display='flex';
  var nb=p.querySelector('.nt-body'); if(nb) nb.scrollTop=scroll;
}
// Κλείσιμο με κλικ έξω / Esc
document.addEventListener('mousedown',function(ev){
  if(!_notifOpen) return;
  var p=document.getElementById('notif-panel'), b=document.getElementById('notif-bell');
  if((p && p.contains(ev.target)) || (b && b.contains(ev.target))) return;
  closeNotifPanel();
});
document.addEventListener('keydown',function(ev){ if(_notifOpen && ev.key==='Escape') closeNotifPanel(); });

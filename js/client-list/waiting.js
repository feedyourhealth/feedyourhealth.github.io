// ⏳ Σε αναμονή (2026-10-21) — ο πελάτης «κρέμεται» ανάμεσα στο ραντεβού και στο τελικό πλάνο
// γιατί περιμένουμε κάτι (αναλύσεις, προπονητικό, γνώμη γιατρού…). Κάθε αναμονή είναι μία εγγραφή
// στο c.waitItems (cloud-synced σαν κάθε πεδίο πελάτη):
//   {id, reasons:['labs',…], otherText, due:'YYYY-MM-DD'|'', note, current:'temp'|'none'|'old',
//    createdAt:'YYYY-MM-DD', remindedAt, closedAt}
// Ανοιχτή = χωρίς closedAt. Οι κλειστές μένουν ως ιστορικό (Επισκόπηση → «⏳ Ιστορικό αναμονών»).
// Φορτώνει ΠΡΙΝ το roster-ui.js: το renderSB() (κάρτες/φίλτρο Πελατών) διαβάζει clientActiveWaits()
// και ένα early auth-callback μπορεί να το καλέσει πριν φορτώσουν τα πιο πίσω αρχεία.
var WAIT_REASONS=[
  {key:'labs',icon:'🩸',label:'Αναλύσεις'},
  {key:'training',icon:'🏋️',label:'Προπονητικό πλάνο'},
  {key:'doctor',icon:'👨‍⚕️',label:'Γνώμη γιατρού'},
  {key:'measure',icon:'📏',label:'Νέες μετρήσεις'},
  {key:'change',icon:'✏️',label:'Αλλαγή πλάνου'},
  {key:'other',icon:'📌',label:'Άλλο'}
];
var WAIT_CURRENT_LBL={temp:'Προσωρινό πλάνο',none:'Τίποτα ακόμα',old:'Το παλιό του πλάνο'};

// Δική της τοπική ημερομηνία (όχι fmtDateLocal, που ζει στο home-diets.js και φορτώνει αργότερα).
function waitDateKey(d){
  d=d||new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function waitAddDays(n){ var d=new Date(); d.setDate(d.getDate()+n); return waitDateKey(d); }
function waitFmtDM(key){ if(!key) return ''; var p=key.split('-'); return p[2]+'/'+p[1]; }
// Ημέρες μέχρι την ημερομηνία (αρνητικό = καθυστερεί). null = χωρίς ημερομηνία.
function waitDaysLeft(w){
  if(!w || !w.due) return null;
  var a=new Date(waitDateKey()+'T00:00:00'), b=new Date(w.due+'T00:00:00');
  return Math.round((b-a)/86400000);
}
function clientActiveWaits(c){
  return ((c && c.waitItems)||[]).filter(function(w){return w && !w.closedAt;}).sort(waitCompare);
}
function clientIsWaiting(c){ return clientActiveWaits(c).length>0; }
// Πιο επείγον πρώτα: καθυστερημένες → πιο κοντινή ημερομηνία → χωρίς ημερομηνία στο τέλος.
function waitCompare(a,b){
  var da=waitDaysLeft(a), db=waitDaysLeft(b);
  if(da==null && db==null) return 0;
  if(da==null) return 1;
  if(db==null) return -1;
  return da-db;
}
function clientWaitUrgency(c){
  var w=clientActiveWaits(c)[0];
  if(!w) return null;
  var d=waitDaysLeft(w);
  return d==null?9999:d;
}
function waitFindReason(k){ return WAIT_REASONS.filter(function(r){return r.key===k;})[0]; }
function waitReasonsText(w){
  return (w.reasons||[]).map(function(k){
    var r=waitFindReason(k); if(!r) return '';
    return r.icon+' '+(k==='other' && w.otherText?w.otherText:r.label);
  }).filter(Boolean).join(' + ');
}
// Ετικέτα κατάστασης: κόκκινο = καθυστερεί, πορτοκαλί = σήμερα/αύριο, πράσινο = αργότερα, γκρι = χωρίς ημ/νία.
function waitStatus(w){
  var d=waitDaysLeft(w);
  if(d==null) return {cls:'none',text:'χωρίς ημ/νία'};
  if(d<0) return {cls:'late',text:'καθυστερεί '+(-d)+' μ.'};
  if(d===0) return {cls:'soon',text:'σήμερα'};
  if(d===1) return {cls:'soon',text:'αύριο'};
  return {cls:'ok',text:'σε '+d+' μέρες'};
}
function waitStatusChip(w){
  var s=waitStatus(w);
  return '<span class="wait-chip wait-chip-'+s.cls+'">'+s.text+'</span>';
}
function waitFindClient(id){ return clients.find(function(x){return x.id===id;}); }
function waitFindItem(c,wid){ return ((c&&c.waitItems)||[]).filter(function(w){return w.id===wid;})[0]; }

// Ξαναζωγραφίζει ό,τι δείχνει αναμονές, όπου κι αν βρίσκεται ο χρήστης.
function waitRefresh(c){
  // #hm-find-list (datalist της κεφαλίδας) υπάρχει μόνο όταν η Αρχική είναι ανοιχτή.
  if(document.getElementById('hm-find-list') && typeof renderHome==='function'){ renderHome(); return; }
  var slot=document.getElementById('wait-banner-slot');
  if(slot && c && typeof curId!=='undefined' && curId===c.id) slot.innerHTML=waitBannerHtml(c);
  var hb=document.getElementById('client-wait-btn');
  if(hb && c && curId===c.id) hb.outerHTML=waitHeaderBtnHtml(c);
  var s0ov=document.getElementById('s0ov');
  if(s0ov && s0ov.style.display==='block' && typeof buildOverviewHtml==='function' && c && curId===c.id) s0ov.innerHTML=buildOverviewHtml(c);
  if(document.getElementById('client-list') && typeof renderSB==='function') renderSB();
}

// ── Παράθυρο «Βάλε σε αναμονή» (νέα ή επεξεργασία/παράταση υπάρχουσας) ──────────────────────
function openWaitModal(clientId,waitId){
  var c=waitFindClient(clientId||(typeof curId!=='undefined'?curId:null));
  if(!c){ showErrorToast('Διάλεξε πρώτα πελάτη.'); return; }
  var w=waitId?waitFindItem(c,waitId):null;
  var reasons=w?(w.reasons||[]):[];
  var due=w?(w.due||''):waitAddDays(7);
  var current=w?(w.current||'temp'):((c.weekPlan&&Object.keys(c.weekPlan).length)?'temp':'none');
  var hasContact=!!(normalizePhoneIntl(c.phone)||c.email);
  var ov=document.getElementById('wait-overlay'); if(ov) ov.remove();
  ov=document.createElement('div');
  ov.id='wait-overlay';
  ov.className='wait-overlay';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  var chips=WAIT_REASONS.map(function(r){
    var on=reasons.indexOf(r.key)>-1;
    return '<button type="button" class="wait-reason'+(on?' on':'')+'" data-key="'+r.key+'" aria-pressed="'+on+'" onclick="waitToggleReason(this)">'+r.icon+' '+r.label+'</button>';
  }).join('');
  var quick=[[3,'+3 μέρες'],[7,'+1 εβδ.'],[14,'+2 εβδ.']].map(function(q){
    return '<button type="button" class="wait-quick" data-due="'+waitAddDays(q[0])+'" onclick="waitPickDue(this)">'+q[1]+'</button>';
  }).join('')+'<button type="button" class="wait-quick" data-due="" onclick="waitPickDue(this)">Χωρίς ημερομηνία</button>';
  var radios=['temp','none','old'].map(function(k){
    return '<label class="wait-radio"><input type="radio" name="wait-current" value="'+k+'"'+(current===k?' checked':'')+'> '+WAIT_CURRENT_LBL[k]+'</label>';
  }).join('');
  ov.innerHTML='<div class="wait-modal" role="dialog" aria-modal="true" aria-labelledby="wait-modal-title">'
    +'<div class="wait-modal-head"><div><div id="wait-modal-title" class="wait-modal-title">⏳ '+(w?'Επεξεργασία αναμονής':'Βάλε σε αναμονή')+'</div>'
    +'<div class="wait-modal-sub">'+esc(c.name||'Νέος πελάτης')+'</div></div>'
    +'<button type="button" class="wait-x" aria-label="Κλείσιμο" onclick="document.getElementById(\'wait-overlay\').remove()">✕</button></div>'
    +'<div class="wait-lbl">Τι περιμένεις; <span>(μπορείς πολλά)</span></div>'
    +'<div class="wait-reasons">'+chips+'</div>'
    +'<input type="text" id="wait-other" class="wait-input" placeholder="Τι άλλο περιμένεις; (π.χ. νέο ωράριο βάρδιας)" aria-label="Τι άλλο περιμένεις" value="'+esc(w&&w.otherText||'')+'" style="display:'+(reasons.indexOf('other')>-1?'block':'none')+'">'
    +'<div class="wait-lbl">Μέχρι πότε το περιμένεις;</div>'
    +'<div class="wait-dues">'+quick
    +'<label class="wait-date">📅 <input type="date" id="wait-due" value="'+esc(due)+'" aria-label="Ημερομηνία" oninput="waitMarkQuick()"></label></div>'
    +'<label class="wait-lbl" for="wait-note">Σημείωση <span>(προαιρετικό)</span></label>'
    +'<textarea id="wait-note" class="wait-input" rows="3" placeholder="π.χ. θέλω σίδηρο, φερριτίνη, B12, θυρεοειδή πριν ανεβάσω θερμίδες">'+esc(w&&w.note||'')+'</textarea>'
    +'<div class="wait-current"><div class="wait-lbl" style="margin:0 0 6px">Τι έχει τώρα ο πελάτης;</div><div class="wait-radios">'+radios+'</div></div>'
    +(w?'':'<label class="wait-send"><input type="checkbox" id="wait-send-now"'+(hasContact?'':' disabled')+'> Στείλε τώρα μήνυμα στον πελάτη ότι το περιμένω'
      +(hasContact?' <span>('+(normalizePhoneIntl(c.phone)?'WhatsApp':'email')+')</span>':' <span>(δεν υπάρχει τηλέφωνο ή email)</span>')+'</label>')
    +'<div class="wait-actions">'
    +(w?'<button type="button" class="wait-btn wait-btn-done" onclick="closeWaitItem(\''+c.id+'\',\''+w.id+'\')">✅ Ήρθε</button><span style="flex:1"></span>':'')
    +'<button type="button" class="wait-btn" onclick="document.getElementById(\'wait-overlay\').remove()">Άκυρο</button>'
    +'<button type="button" class="wait-btn wait-btn-primary" onclick="saveWaitModal(\''+c.id+'\',\''+(w?w.id:'')+'\')">⏳ Αποθήκευση</button>'
    +'</div></div>';
  document.body.appendChild(ov);
  waitMarkQuick();
}
function waitToggleReason(btn){
  var on=!btn.classList.contains('on');
  btn.classList.toggle('on',on);
  btn.setAttribute('aria-pressed',on);
  if(btn.getAttribute('data-key')==='other'){
    var o=document.getElementById('wait-other');
    if(o){ o.style.display=on?'block':'none'; if(on) o.focus(); }
  }
}
function waitPickDue(btn){
  var inp=document.getElementById('wait-due');
  if(inp) inp.value=btn.getAttribute('data-due');
  waitMarkQuick();
}
// Φωτίζει το γρήγορο κουμπί που αντιστοιχεί στην ημερομηνία του πεδίου (αν υπάρχει).
function waitMarkQuick(){
  var inp=document.getElementById('wait-due'); if(!inp) return;
  document.querySelectorAll('#wait-overlay .wait-quick').forEach(function(b){
    b.classList.toggle('on',b.getAttribute('data-due')===inp.value);
  });
}
function saveWaitModal(clientId,waitId){
  var c=waitFindClient(clientId); if(!c) return;
  var reasons=[].map.call(document.querySelectorAll('#wait-overlay .wait-reason.on'),function(b){return b.getAttribute('data-key');});
  if(!reasons.length){ showErrorToast('Διάλεξε τι περιμένεις (π.χ. 🩸 Αναλύσεις).'); return; }
  var otherText=(document.getElementById('wait-other').value||'').trim();
  if(reasons.indexOf('other')<0) otherText='';
  var curEl=document.querySelector('#wait-overlay input[name="wait-current"]:checked');
  var sendEl=document.getElementById('wait-send-now');
  var data={
    reasons:reasons,
    otherText:otherText,
    due:document.getElementById('wait-due').value||'',
    note:(document.getElementById('wait-note').value||'').trim(),
    current:curEl?curEl.value:'none'
  };
  var w=waitId?waitFindItem(c,waitId):null;
  if(w){ Object.keys(data).forEach(function(k){ w[k]=data[k]; }); }
  else {
    w=Object.assign({id:'w'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),createdAt:waitDateKey()},data);
    c.waitItems=(c.waitItems||[]).concat([w]);
  }
  // Το πλακίδιο «Αιματολογικές» της καρτέλας ακολουθεί: περιμένω αναλύσεις → «Σε αναμονή».
  if(reasons.indexOf('labs')>-1 && c.bloodTestStatus!=='sent') c.bloodTestStatus='pending';
  save();
  document.getElementById('wait-overlay').remove();
  showSuccessToast('⏳ '+(c.name||'Ο πελάτης')+': σε αναμονή για '+waitReasonsText(w));
  waitRefresh(c);
  if(sendEl && sendEl.checked) sendWaitReminder(c.id,w.id);
}
// «✅ Ήρθε» — κλείνει την αναμονή· μένει στο ιστορικό με την ημερομηνία που ήρθε.
function closeWaitItem(clientId,waitId,silent){
  var c=waitFindClient(clientId); if(!c) return;
  var w=waitFindItem(c,waitId); if(!w || w.closedAt) return;
  w.closedAt=waitDateKey();
  if((w.reasons||[]).indexOf('labs')>-1 && c.bloodTestStatus==='pending') c.bloodTestStatus='sent';
  save();
  var ov=document.getElementById('wait-overlay'); if(ov) ov.remove();
  if(!silent) showSuccessToast('✅ Ήρθε — έκλεισε η αναμονή για '+waitReasonsText(w));
  waitRefresh(c);
}

// ── Υπενθύμιση στον πελάτη (WhatsApp, αλλιώς email) στη γλώσσα του ──────────────────────────
function waitReminderText(c,w){
  var d=clientMsgDict(c);
  var isEl=(c.lang||'el')==='el';
  // Το ελεύθερο κείμενο του «Άλλο» είναι γραμμένο στα ελληνικά — σε ξένο πελάτη μπαίνει η γενική φράση.
  var whats=(w.reasons||[]).map(function(k){ return (k==='other' && w.otherText && isEl)?w.otherText:d.waitWhat[k]; }).filter(Boolean);
  var fname=(c.name||'').trim().split(/\s+/)[0]||'';
  if(isEl && typeof greekVocative==='function') fname=greekVocative(fname);
  return d.waitReminder(fname, whats.join(d.waitAnd), w.current==='temp');
}
function sendWaitReminder(clientId,waitId){
  var c=waitFindClient(clientId); if(!c) return;
  var w=waitFindItem(c,waitId)||clientActiveWaits(c)[0]; if(!w) return;
  var msg=waitReminderText(c,w);
  var phone=normalizePhoneIntl(c.phone);
  if(phone){
    window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
  } else if(c.email){
    location.href='mailto:'+encodeURIComponent(c.email).replace(/%40/g,'@')+'?subject='+encodeURIComponent(clientMsgDict(c).waitReminderSubj)+'&body='+encodeURIComponent(msg);
  } else {
    showErrorToast('Δεν υπάρχει τηλέφωνο ή email για τον/την '+(c.name||'πελάτη')+'.');
    return;
  }
  w.remindedAt=waitDateKey();
  markDietologistContacted(c);
  save();
  waitRefresh(c);
}

// ── Κομμάτια HTML που δείχνουν οι άλλες σελίδες ──────────────────────────────────────────
// Κουμπί στην κεφαλίδα του πελάτη (render-main.js) — πορτοκαλί όταν ήδη περιμένουμε κάτι.
function waitHeaderBtnHtml(c){
  var on=clientIsWaiting(c);
  return '<button type="button" id="client-wait-btn" class="btn wait-head-btn'+(on?' on':'')+'" onclick="openWaitModal(\''+c.id+'\')" title="Σημείωσε ότι περιμένεις κάτι για να ολοκληρώσεις το πλάνο">⏳ '+(on?'Σε αναμονή':'Βάλε σε αναμονή')+'</button>';
}
// Λωρίδα πάνω-πάνω στην καρτέλα πελάτη, μία γραμμή ανά ανοιχτή αναμονή.
function waitBannerHtml(c){
  var list=clientActiveWaits(c);
  if(!list.length) return '';
  return list.map(function(w){
    var s=waitStatus(w);
    var meta=['ζητήθηκε '+waitFmtDM(w.createdAt)];
    if(w.due) meta.push('έως '+waitFmtDM(w.due));
    return '<div class="wait-banner wait-banner-'+s.cls+'">'
      +'<span class="wait-banner-ico" aria-hidden="true">⏳</span>'
      +'<div class="wait-banner-body">'
      +'<div class="wait-banner-top"><b>Περιμένεις: '+esc(waitReasonsText(w))+'</b>'+waitStatusChip(w)
      +(w.current?'<span class="wait-chip wait-chip-none">'+(w.current==='temp'?'έχει προσωρινό πλάνο':(w.current==='old'?'έχει το παλιό του πλάνο':'δεν έχει πλάνο ακόμα'))+'</span>':'')+'</div>'
      +'<div class="wait-banner-meta">'+meta.join(' · ')+(w.note?' · «'+esc(w.note)+'»':'')+'</div>'
      +(w.remindedAt?'<div class="wait-banner-sent">📱 Υπενθύμιση στάλθηκε '+waitFmtDM(w.remindedAt)+'</div>':'')
      +'</div>'
      +'<div class="wait-banner-btns">'
      +'<button type="button" class="wait-pill" onclick="sendWaitReminder(\''+c.id+'\',\''+w.id+'\')">📱 Υπενθύμιση</button>'
      +'<button type="button" class="wait-pill" onclick="openWaitModal(\''+c.id+'\',\''+w.id+'\')">📅 Παράταση</button>'
      +'<button type="button" class="wait-pill wait-pill-done" onclick="closeWaitItem(\''+c.id+'\',\''+w.id+'\')">✅ Ήρθε</button>'
      +'</div></div>';
  }).join('');
}
// Γραμμές για την κάρτα «⏳ Σε αναμονή» της Αρχικής (home-diets.js) — όλοι οι ενεργοί πελάτες,
// πιο επείγον πρώτα. Επιστρέφει {rows, late}.
function homeWaitingRows(){
  var items=[];
  clients.filter(function(c){return !c.deleted && !c.archived;}).forEach(function(c){
    clientActiveWaits(c).forEach(function(w){ items.push({c:c,w:w}); });
  });
  items.sort(function(a,b){ return waitCompare(a.w,b.w); });
  var late=0;
  var rows=items.map(function(x){
    var c=x.c, w=x.w, s=waitStatus(w);
    if(s.cls==='late') late++;
    var av={late:'red',soon:'amber',ok:'teal',none:''}[s.cls];
    var meta=[esc(waitReasonsText(w))];
    if(w.note) meta.push('«'+esc(w.note)+'»');
    if(w.due) meta.push('έως '+waitFmtDM(w.due));
    if(w.remindedAt) meta.push('📱 '+waitFmtDM(w.remindedAt));
    var showRemind=(s.cls==='late'||s.cls==='soon');
    return '<div class="hm-row hm-wait-row'+(s.cls==='late'?' hm-wait-late':'')+'" onclick="selectClient(\''+c.id+'\')">'
      +'<div class="hm-avatar'+(av?' hm-avatar-'+av:'')+'">'+initials(c.name)+'</div>'
      +'<div class="hm-wait-text"><div class="hm-wait-line"><span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'+waitStatusChip(w)+'</div>'
      +'<div class="hm-wait-meta">'+meta.join(' · ')+'</div>'
      // Κουμπιά μέσα στο μπλοκ κειμένου (όχι δίπλα): η κάρτα είναι στενή (3 στη σειρά) και το
      // @container κανόνας του .hm-row θα τα άπλωνε σε όλο το πλάτος.
      +'<div class="hm-wait-btns">'
      +(showRemind?'<button type="button" class="hm-action-btn hm-wait-remind" onclick="event.stopPropagation();sendWaitReminder(\''+c.id+'\',\''+w.id+'\')" title="Έτοιμο μήνυμα στον πελάτη">📱 Υπενθύμιση</button>':'')
      +'<button type="button" class="hm-action-btn hm-wait-done" onclick="event.stopPropagation();closeWaitItem(\''+c.id+'\',\''+w.id+'\')" title="Ήρθε — κλείσε την αναμονή">✅ Ήρθε</button>'
      +'</div></div></div>';
  });
  return {rows:rows,late:late};
}
// Μικρή ετικέτα για κάρτα/γραμμή στη λίστα Πελατών (roster-ui.js).
function clientWaitBadgeHtml(c){
  var w=clientActiveWaits(c)[0];
  if(!w) return '';
  var s=waitStatus(w);
  return '<span class="wait-chip wait-chip-'+s.cls+'" title="Σε αναμονή: '+esc(waitReasonsText(w))+(w.due?' · έως '+waitFmtDM(w.due):'')+'">⏳ '+esc(waitReasonsText(w))+' · '+s.text+'</span>';
}
// Κάρτα «⏳ Ιστορικό αναμονών» στην Επισκόπηση — όλες, ανοιχτές πρώτα.
function waitHistoryCardHtml(c){
  var all=(c.waitItems||[]).slice();
  if(!all.length) return '';
  all.sort(function(a,b){
    if(!a.closedAt!==!b.closedAt) return a.closedAt?1:-1;
    return (b.createdAt||'')<(a.createdAt||'')?-1:1;
  });
  var rows=all.slice(0,8).map(function(w){
    var right;
    if(w.closedAt){
      var days=Math.round((new Date(w.closedAt+'T00:00:00')-new Date((w.createdAt||w.closedAt)+'T00:00:00'))/86400000);
      right=waitFmtDM(w.createdAt)+' → ήρθε '+waitFmtDM(w.closedAt)+' ('+days+' μ.)';
    } else right=waitFmtDM(w.createdAt)+' → <b class="wait-open">ανοιχτό</b>';
    return '<div class="wait-hist-row"><span class="wait-hist-mark'+(w.closedAt?' done':'')+'">'+(w.closedAt?'✓':'●')+'</span>'
      +'<span class="wait-hist-what">'+esc(waitReasonsText(w))+'</span><span class="wait-hist-when">'+right+'</span></div>';
  }).join('');
  return '<div class="wait-hist-card"><div class="wait-hist-title">⏳ Ιστορικό αναμονών</div>'+rows+'</div>';
}
// Μπλοκ μέσα στο παράθυρο «Αποστολή πλάνου» (publish-modal.js): ήρθε αυτό που περιμέναμε;
function waitPublishPromptHtml(c){
  var list=clientActiveWaits(c);
  if(!list.length) return '';
  return '<div id="wait-publish-prompt" class="wait-publish">'
    +'<div class="wait-publish-title">⏳ Σε αναμονή για: '+esc(list.map(waitReasonsText).join(' · '))+'</div>'
    +'<div class="wait-publish-q">Ήρθαν και αυτό είναι το τελικό πλάνο;</div>'
    +'<div class="wait-publish-btns">'
    +'<button type="button" class="wait-pill wait-pill-done" onclick="waitPublishAnswer(\''+c.id+'\',true)">✅ Ναι, κλείσε την αναμονή</button>'
    +'<button type="button" class="wait-pill" onclick="waitPublishAnswer(\''+c.id+'\',false)">Όχι, είναι ακόμα προσωρινό</button>'
    +'</div></div>';
}
function waitPublishAnswer(clientId,arrived){
  var c=waitFindClient(clientId); if(!c) return;
  var box=document.getElementById('wait-publish-prompt');
  if(arrived){
    clientActiveWaits(c).forEach(function(w){ closeWaitItem(c.id,w.id,true); });
    if(box) box.innerHTML='<div class="wait-publish-title" style="margin:0">✅ Η αναμονή έκλεισε</div>';
  } else if(box){
    box.innerHTML='<div class="wait-publish-q" style="margin:0">⏳ Η αναμονή μένει ανοιχτή — θα τη δεις στην Αρχική.</div>';
  }
}

// js/leads/leads-tab.js
// "🤝 Leads" top-level tab (swTab(11), js/client-editor/form-controls.js) — kanban pipeline
// over the `leads` collection (js/leads/leads-state.js), plus the semi-automatic follow-up
// send (WhatsApp / Viber / email one-click — NOT unattended/background sending, see
// dietologist-crm-leads plan). Loads after leads-state.js and js/lib/helpers.js
// (needs clientMsgDict/normalizePhoneIntl/esc/markDietologistContacted/setMoreNavBadgeCount).

var LEAD_NUDGE_MIN_GAP=3; // days — matches PROGRESS_NUDGE_MIN_GAP's naming convention (js/tabs/progress.js)

// Ένα lead χρειάζεται follow-up μόνο όσο είναι ακόμα στο "Νέο" — αν προχώρησε στάδιο,
// σταματάει να "τρέχει" (βλ. κλειδί στο stageChangedAt, όχι στο createdAt, στο setLeadStage()).
function leadNeedsNudge(lead){
  if(!lead || lead.deleted || lead.stage!=='new') return false;
  if(Math.floor((Date.now()-lead.stageChangedAt)/86400000) < LEAD_NUDGE_MIN_GAP) return false;
  if(lead.lastDietologistContact && Math.floor((Date.now()-lead.lastDietologistContact)/86400000) < LEAD_NUDGE_MIN_GAP) return false;
  return true;
}

function renderLeads(){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;
  var active=leads.filter(function(l){return !l.deleted;});
  var nudgeN=active.filter(leadNeedsNudge).length;

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">🤝 Leads</div>';
  html+='<div style="font-size:12.5px;color:var(--text-muted);margin-bottom:14px">Προοπτικοί πελάτες πριν γίνουν πελάτες — '+active.length+' συνολικά'+(nudgeN?', <b style="color:#c0392b">'+nudgeN+' χρειάζονται follow-up</b>':'')+'</div>';

  html+='<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">'
    +'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal)" onclick="toggleQA(\'qa-newlead\')">+ Νέο lead</button>'
    +'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal)" onclick="triggerLeadsCSVImport()">📥 Εισαγωγή από Fresha CSV</button>'
    +'</div>';

  html+='<div class="leads-board">';
  LEAD_STAGES.forEach(function(stage){
    var col=active.filter(function(l){return l.stage===stage;});
    html+='<div class="leads-col">';
    html+='<div class="leads-col-hd">'+esc(LEAD_STAGE_LABELS[stage])+'<span class="leads-col-n">'+col.length+'</span></div>';
    html+=col.length?col.map(leadCardHtml).join(''):'<div class="leads-col-empty">—</div>';
    html+='</div>';
  });
  html+='</div>';

  // Hidden file input for the CSV importer (js/leads/leads-csv-import.js) — lives inside this
  // render's own HTML, same convention as the Ergo CSV input in buildTrackerHtml() (tracker.js).
  html+='<input type="file" id="leads-csv-input" accept=".csv" style="display:none" onchange="handleLeadsCSVFile(event)">';
  html+='</div>';
  main.innerHTML=html;
}

function leadCardHtml(lead){
  var days=Math.floor((Date.now()-lead.stageChangedAt)/86400000);
  var nudge=leadNeedsNudge(lead);
  var html='<div class="leads-card'+(nudge?' leads-card-nudge':'')+'">';
  html+='<div class="leads-card-name">'+esc(lead.name||'—')+'</div>';
  html+='<div class="leads-card-sub">'+esc(LEAD_SOURCE_LABELS[lead.source]||lead.source)
       +' · '+(days<=0?'σήμερα':days+'μ')
       +(nudge?' · <b style="color:#c0392b">🔔 follow-up</b>':'')+'</div>';

  html+='<select class="qa-input leads-card-stage" aria-label="Στάδιο lead ‘'+esc(lead.name)+'’" onchange="setLeadStageUI(\''+lead.id+'\',this.value)">';
  LEAD_STAGES.forEach(function(s){
    html+='<option value="'+s+'"'+(s===lead.stage?' selected':'')+'>'+esc(LEAD_STAGE_LABELS[s])+'</option>';
  });
  html+='</select>';

  if(lead.stage==='client'){
    html+='<div class="leads-card-converted">→ βλ. καρτέλα Πελάτες</div>';
  } else {
    html+='<div class="leads-card-actions">';
    if(lead.phone){
      html+='<button type="button" class="leads-mini-btn" title="WhatsApp" aria-label="Follow-up μέσω WhatsApp" onclick="sendLeadFollowup(\''+lead.id+'\',\'whatsapp\')">💬</button>';
      html+='<button type="button" class="leads-mini-btn" title="Viber" aria-label="Follow-up μέσω Viber" onclick="sendLeadFollowup(\''+lead.id+'\',\'viber\')">📱</button>';
    }
    if(lead.email){
      html+='<button type="button" class="leads-mini-btn" title="Email" aria-label="Follow-up μέσω email" onclick="sendLeadFollowup(\''+lead.id+'\',\'email\')">📧</button>';
    }
    if(lead.stage==='booked'){
      html+='<button type="button" class="leads-mini-btn" title="Έγινε πελάτης" aria-label="Μετατροπή σε πελάτη" onclick="convertLeadToClientUI(\''+lead.id+'\')">✅</button>';
    }
    html+='<button type="button" class="leads-mini-btn" title="Διαγραφή" aria-label="Διαγραφή lead" onclick="deleteLeadUI(\''+lead.id+'\')">🗑️</button>';
    html+='</div>';
  }
  html+='</div>';
  return html;
}

function setLeadStageUI(id,stage){
  setLeadStage(id,stage);
  if(curTab===11) renderLeads();
  if(typeof updateLeadsNavBadge==='function') updateLeadsNavBadge();
}

function convertLeadToClientUI(id){
  var c=convertLeadToClient(id);
  if(curTab===11) renderLeads();
  if(typeof updateLeadsNavBadge==='function') updateLeadsNavBadge();
  if(c && typeof showSuccessToast==='function') showSuccessToast('✅ Ο/Η '+c.name+' έγινε πελάτης');
}

function deleteLeadUI(id){
  var lead=getLead(id);
  if(!lead) return;
  var go=function(){
    deleteLead(id);
    if(curTab===11) renderLeads();
    if(typeof updateLeadsNavBadge==='function') updateLeadsNavBadge();
  };
  if(typeof showConfirmDialog==='function'){
    showConfirmDialog('Διαγραφή του lead «'+lead.name+'»;', go);
  } else if(window.confirm('Διαγραφή του lead «'+lead.name+'»;')){
    go();
  }
}

// channel: 'whatsapp'|'viber'|'email' — ένα κλικ, χωρίς αυτόματη/αθόρυβη αποστολή (βλ. σημείωση
// στην κεφαλίδα του αρχείου). Δεν ξαναχρησιμοποιεί sendActivityNudge (js/tabs/home-diets.js) γιατί
// εκείνο απαιτεί c.shareToken (link portal) που τα leads δεν έχουν ποτέ.
function sendLeadFollowup(id,channel){
  var lead=getLead(id);
  if(!lead) return;
  var d=clientMsgDict(lead);
  var fn=(lead.name||'').trim().split(' ')[0]||lead.name;
  var msg=d.leadFollowup(fn);
  if(channel==='whatsapp' && lead.phone){
    window.open('https://wa.me/'+normalizePhoneIntl(lead.phone)+'?text='+encodeURIComponent(msg),'_blank','noopener');
  } else if(channel==='viber' && lead.phone){
    window.open('viber://chat?number='+normalizePhoneIntl(lead.phone)+'&text='+encodeURIComponent(msg),'_blank','noopener');
  } else if(channel==='email' && lead.email){
    location.href='mailto:'+encodeURIComponent(lead.email).replace(/%40/g,'@')+'?subject='+encodeURIComponent(d.leadFollowupSubj)+'&body='+encodeURIComponent(msg);
  } else {
    if(typeof showErrorToast==='function') showErrorToast('❌ Λείπει στοιχείο επικοινωνίας για αυτό το κανάλι');
    return;
  }
  markDietologistContacted(lead);
  save();
  if(curTab===11) renderLeads();
  if(typeof updateLeadsNavBadge==='function') updateLeadsNavBadge();
}

// "+ Νέο lead" — γρήγορη φόρμα στο πλαϊνό μενού (qa-btn/qa-panel, js/client-list/quick-actions.js).
function qaCreateLead(){
  var nameEl=document.getElementById('qa-newlead-input');
  var contactEl=document.getElementById('qa-newlead-contact');
  var sourceEl=document.getElementById('qa-newlead-source');
  var name=(nameEl&&nameEl.value||'').trim();
  if(!name){
    if(typeof showErrorToast==='function') showErrorToast('❌ Βάλε όνομα για το lead');
    return;
  }
  var contact=(contactEl&&contactEl.value||'').trim();
  var isEmail=contact.indexOf('@')!==-1;
  addLead({name:name,phone:isEmail?'':contact,email:isEmail?contact:'',source:(sourceEl&&sourceEl.value)||'other'});
  if(nameEl) nameEl.value='';
  if(contactEl) contactEl.value='';
  if(sourceEl) sourceEl.value='other';
  if(typeof closeAllQA==='function') closeAllQA();
  if(typeof showSuccessToast==='function') showSuccessToast('✅ Το lead προστέθηκε');
  if(curTab===11) renderLeads();
  if(typeof updateLeadsNavBadge==='function') updateLeadsNavBadge();
}

// Κόκκινο badge στο κουμπί "🤝 Leads" (sidebar + mobile) — μετράει ΜΟΝΟ leads που χρειάζονται
// follow-up τώρα, όχι το σύνολο (ίδιο σκεπτικό με updateMessagesNavBadge/"αναπάντητα").
function updateLeadsNavBadge(){
  var n=0;
  try{ n=leads.filter(function(l){return !l.deleted && leadNeedsNudge(l);}).length; }catch(e){ n=0; }
  var txt=n>99?'99+':String(n);
  ['leads-nav-badge','leads-nav-badge-mobile'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    el.textContent=txt;
    el.style.display=n>0?'inline-block':'none';
  });
  if(typeof setMoreNavBadgeCount==='function') setMoreNavBadgeCount('leads',n);
}

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
    // ✂️ Μεγάλες σημειώσεις (>140 χαρακτήρες) περικόπτονται με "περισσότερα ▾" — καθαρό DOM toggle
    // μέσα στο ίδιο onclick, όχι re-render όλης της λίστας (θα έχανε το scroll position).
    var noteTextHtml;
    if(m.noteRaw.length>140){
      var shortTxt=esc(m.noteRaw.slice(0,140))+'…';
      noteTextHtml='<span class="msg-note-body" data-expanded="0">'
        +'<span class="msg-note-short">'+shortTxt+'</span>'
        +'<span class="msg-note-full" style="display:none">'+esc(m.noteRaw)+'</span>'
        +' <button type="button" style="background:none;border:none;color:var(--teal);font-size:10.5px;font-weight:600;cursor:pointer;padding:0" onclick="event.stopPropagation();var w=this.parentElement;var exp=w.getAttribute(\'data-expanded\')===\'1\';w.setAttribute(\'data-expanded\',exp?\'0\':\'1\');w.querySelector(\'.msg-note-short\').style.display=exp?\'inline\':\'none\';w.querySelector(\'.msg-note-full\').style.display=exp?\'none\':\'inline\';this.textContent=exp?\'περισσότερα ▾\':\'λιγότερα ▴\';">περισσότερα ▾</button>'
        +'</span>';
    } else {
      noteTextHtml=esc(m.noteRaw);
    }
    bodyHtml=tagHtml+noteTextHtml+weightHtml;
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
    actionsHtml='<span class="hm-row-sub" style="color:var(--good);font-weight:600">✓ Απαντήθηκε</span>';
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
// (renderMessages) αντί για το #s3b, αφού εδώ δεν υπάρχει επιλεγμένος πελάτης. Συγκρίνει το πλήθος
// αναπάντητων πριν/μετά και δείχνει toast αν βρέθηκε κάτι νέο — αλλιώς η ανανέωση γίνεται αθόρυβα
// και δεν ξέρεις αν άξιζε τον κόπο να την πατήσεις.
function msgRefresh(btn){
  if(!window.Cloud) return;
  var beforeCount=0;
  try{ beforeCount=collectAllClientMessages().filter(function(m){return !m.handled;}).length; }catch(e){}
  if(btn){ btn.disabled=true; btn.textContent='⏳ Ανανέωση...'; }
  var restore=function(){
    if(btn){ btn.disabled=false; btn.textContent='🔄 Ανανέωση'; }
    var afterCount=0;
    try{ afterCount=collectAllClientMessages().filter(function(m){return !m.handled;}).length; }catch(e){}
    renderMessages();
    var diff=afterCount-beforeCount;
    if(diff>0 && typeof showSuccessToast==='function'){
      showSuccessToast('📬 '+(diff===1?'1 νέο μήνυμα.':diff+' νέα μηνύματα.'));
    }
  };
  Promise.all([
    typeof window.Cloud.refreshClientLogsCache==='function'?window.Cloud.refreshClientLogsCache():Promise.resolve(),
    typeof window.Cloud.refreshPlanFeedbackCache==='function'?window.Cloud.refreshPlanFeedbackCache():Promise.resolve()
  ]).then(restore).catch(restore);
}
var _msgFilter='unread';
var _msgGroupBy=false;
var _msgSearch='';
// Ενημερώνει ΜΟΝΟ το #msg-results (όχι όλο το #main) — έτσι το ίδιο το search input δεν
// ξαναφτιάχνεται σε κάθε πληκτροπάτημα και δεν χάνει το focus/cursor στη μέση της πληκτρολόγησης
// (σε αντίθεση με το πλήρες renderMessages() που καλούν τα κουμπιά φίλτρου/ομαδοποίησης).
function msgSetSearch(val){
  _msgSearch=(val||'').toLowerCase();
  var el=document.getElementById('msg-results');
  if(el) el.innerHTML=msgResultsHtml(collectAllClientMessages());
}
function msgResultsHtml(all){
  var shown=_msgFilter==='unread'?all.filter(function(m){return !m.handled;}):all;
  var term=_msgSearch.trim();
  if(term) shown=shown.filter(function(m){return (m.c.name||'').toLowerCase().indexOf(term)>=0;});
  if(!shown.length){
    var emptyMsg=term?('Κανένα μήνυμα για "'+esc(_msgSearch.trim())+'".')
      :(_msgFilter==='unread'?'Κανένα αναπάντητο μήνυμα 👍':'Κανένα μήνυμα ακόμα.');
    return '<div class="hm-card"><div class="hm-empty">'+emptyMsg+'</div></div>';
  }
  if(_msgGroupBy) return groupMessagesByClient(shown).map(msgGroupCardHtml).join('');
  return '<div class="hm-card">'+shown.map(function(m){return msgRowHtml(m,false);}).join('')+'</div>';
}
// filter: 'unread'|'all' — προαιρετικό, αλλιώς ξαναχρησιμοποιεί το τελευταίο επιλεγμένο φίλτρο
// (π.χ. όταν ξαναζωγραφίζεται μετά από ↩️ Απάντησε, για να μη χάνεται η επιλογή του χρήστη).
function renderMessages(filter){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;
  if(filter) _msgFilter=filter;
  var all=collectAllClientMessages();
  var unreadCount=all.filter(function(m){return !m.handled;}).length;

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">💬 Μηνύματα</div>';
  // ✅ Ring απαντημένων — ίδιος ορισμός με το "handled" που ήδη μετράει το unreadCount/nav badge
  // (replied ΚΑΙ seen μετράνε ως χειρισμένα, βλ. msgRowHtml). Μόνο όταν υπάρχει έστω 1 μήνυμα.
  if(all.length){
    var handledN=all.length-unreadCount;
    var handledPct=Math.round(handledN/all.length*100);
    html+='<div style="display:flex;align-items:center;gap:12px;background:var(--teal-tint);border:1px solid #c5ddd8;border-radius:12px;padding:10px 16px;margin-bottom:14px;max-width:340px">'
      +pctRing(handledPct,{size:52,thickness:7,color:'var(--teal)',track:'#fff'})
      +'<div><div style="font-weight:700;font-size:12.5px">Χειρισμένα μηνύματα</div>'
      +'<div style="font-size:10.5px;color:var(--text-muted)">'+handledN+' από '+all.length+' — απαντημένα ή αναγνωσμένα</div></div>'
      +'</div>';
  }
  html+='<input type="text" id="msg-search" class="client-search-inp" style="max-width:260px" placeholder="🔍 Αναζήτηση πελάτη..." value="'+esc(_msgSearch)+'" oninput="msgSetSearch(this.value)">';
  html+='<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">'
    +'<button type="button" class="hm-action-btn" style="'+(_msgFilter==='unread'?'':'background:#f0f7f7;color:var(--teal)')+'" onclick="renderMessages(\'unread\')">Αναπάντητα ('+unreadCount+')</button>'
    +'<button type="button" class="hm-action-btn" style="'+(_msgFilter==='all'?'':'background:#f0f7f7;color:var(--teal)')+'" onclick="renderMessages(\'all\')">Όλα ('+all.length+')</button>'
    +'<span style="width:1px;height:18px;background:#e0e0e0;margin:0 2px"></span>'
    +'<button type="button" class="hm-action-btn" style="'+(_msgGroupBy?'':'background:#f0f7f7;color:var(--teal)')+'" onclick="_msgGroupBy=!_msgGroupBy;renderMessages();">👤 Ανά πελάτη</button>'
    +'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal)" onclick="msgRefresh(this)">🔄 Ανανέωση</button>'
    +(unreadCount>0?'<button type="button" class="hm-action-btn" style="background:#f0f7f7;color:var(--teal)" onclick="msgMarkAllSeen()">👁️ Όλα ως αναγνωσμένα</button>':'')
    +'</div>';
  html+='<div id="msg-results">'+msgResultsHtml(all)+'</div>';
  html+='</div>';
  main.innerHTML=html;
}
// Κόκκινο badge πάνω στο κουμπί "💬 Μηνύματα" (sidebar) — ίδιο μοτίβο με updateHomeNavBadge, δικό
// του σύνολο (αναπάντητα μηνύματα — ούτε απαντημένα ούτε μαρκαρισμένα ως "το είδα").
// 2026-08-22: ίδιο σύνολο τώρα ενημερώνει ΚΑΙ το "Μηνύματα" row μέσα στο mobile "Περισσότερα" sheet
// ΚΑΙ το εξωτερικό κουμπί "⋯ Περισσότερα" του bottom-nav (ώστε να φαίνεται από έξω, χωρίς να χρειάζεται
// να ανοίξει κανείς το sheet για να δει αν υπάρχουν αναπάντητα) — το πλαϊνό μενού με το πρωτότυπο badge
// είναι πάντα κρυφό σε κινητό, άρα το 'messages-nav-badge' μόνο του δεν έφτανε ποτέ εκεί.
function updateMessagesNavBadge(){
  var n=0;
  try{ n=collectAllClientMessages().filter(function(m){return !m.handled;}).length; }catch(e){ n=0; }
  var txt=n>99?'99+':String(n);
  ['messages-nav-badge','messages-nav-badge-mobile','more-nav-badge-mobile'].forEach(function(id){
    var el=document.getElementById(id);
    if(!el) return;
    el.textContent=txt;
    el.style.display=n>0?'inline-block':'none';
  });
}

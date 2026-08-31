// js/client-list/clients-tab.js
// The ΠΕΛΑΤΕΣ client-browsing page (moved out of the sidebar), extracted verbatim
// from js/app-part5-home.js (module split wave 41): sel, SPORT_INFO (shared with
// client-list/roster-ui.js), renderClients, and the bulk group-assign flow
// (toggleClientBulkMode, toggleClientBulkSelect, onBulkGroupSelectChange,
// _bulkSelectedClientIds, _applyGroupToSelected, applyBulkGroupAssign,
// applyBulkGroupNew). Pure fn declarations + one literal map, zero load-time code.
// renderClients is a typeof-guarded runtime call from swTab; SPORT_INFO is read
// typeof-guarded by roster-ui.js. Loads in the client-list/ group.

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
    +'<option value="running"'+sel(_clientFilterGoal,'running')+'>🏃 Δρομείς</option>'
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


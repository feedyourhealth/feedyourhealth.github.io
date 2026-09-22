// js/leads/leads-csv-import.js
// Manual, on-demand CSV import from a Fresha client/appointment export — run whenever the
// dietologist wants (no schedule), always preview-then-confirm, never auto-syncs. Matches
// rows to existing leads/clients by normalized email/phone (NEVER by name — names drift via
// typos/nicknames/transliteration) and only ever CREATES leads for genuinely new contacts;
// it never updates an existing lead or client. This is what keeps this manual reconciliation
// from becoming the "two lists diverge" failure mode the app has hit before (see project notes).
// Loads after js/leads/leads-tab.js. Fresha has no export API (confirmed) — only a manual CSV
// download from its dashboard (Clients → Options → Export → CSV).
// Confirmed 2026-09-22 against a real Fresha "client-list" export. Real headers:
// "Client","Gender","Age","Mobile number","Email","Added on","First appt.","Last appt.",
// "Loyalty points balance","Loyalty tier","Client source","Referred by" — quoted fields, and the
// date columns ("Added on"/"First appt."/"Last appt.") contain a literal comma inside the quotes
// (e.g. "14 Nov 2022, 12:00am"), so a naive split(',') misaligns every column after them. Rows are
// parsed with a real quote-aware CSV splitter below rather than String.split(',').

function triggerLeadsCSVImport(){
  var inp=document.getElementById('leads-csv-input');
  if(inp) inp.click();
}

function splitCSVLine(line){
  var cells=[], cur='', inQuotes=false;
  for(var i=0;i<line.length;i++){
    var ch=line[i];
    if(inQuotes){
      if(ch==='"'){
        if(line[i+1]==='"'){ cur+='"'; i++; }
        else inQuotes=false;
      } else cur+=ch;
    } else {
      if(ch==='"') inQuotes=true;
      else if(ch===','){ cells.push(cur); cur=''; }
      else cur+=ch;
    }
  }
  cells.push(cur);
  return cells.map(function(c){return c.trim();});
}

// Fresha date cells look like "14 Nov 2022, 12:00am" — parsed by hand (not via `new Date()`,
// which reinterprets the local midnight through UTC and silently shifts the date by a day).
var _FRESHA_MONTHS={jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
function parseFreshaDateCell(raw){
  if(!raw) return '';
  var m=raw.split(',')[0].trim().match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})$/);
  if(!m) return '';
  var mon=_FRESHA_MONTHS[m[2].toLowerCase()];
  if(!mon) return '';
  return m[3]+'-'+mon+'-'+('0'+m[1]).slice(-2);
}

function parseFreshaCSVRows(text){
  var lines=text.split(/\r\n|\n|\r/).filter(function(l){return l.trim().length>0;});
  if(lines.length<2) return [];
  var headers=splitCSVLine(lines[0]);
  var idxOf=function(re){
    for(var i=0;i<headers.length;i++){ if(re.test(headers[i])) return i; }
    return -1;
  };
  var iName=idxOf(/^(full\s*name|client\s*name|client|name)$/i);
  var iFirst=idxOf(/^first\s*name$/i);
  var iLast=idxOf(/^last\s*name$/i);
  var iEmail=idxOf(/email/i);
  var iPhone=idxOf(/phone|mobile|tel/i);
  var iSource=idxOf(/source/i);
  var iAdded=idxOf(/added\s*on/i);
  // "First appt." non-empty means this contact already had at least one Fresha appointment —
  // i.e. they're a past/existing client of the practice, not someone who inquired and never
  // booked. Confirmed 2026-09-22: of a real 551-row export, 507 already had an appointment and
  // only 44 never did — importing all 551 as "Νέο" leads flooded the board with people who
  // aren't prospects and made the "hi, saw you reached out recently" follow-up message nonsensical
  // for them. categorizeImportRow() below excludes these from the 'new' (lead-creating) bucket.
  var iFirstAppt=idxOf(/^first\s*appt\.?$/i);
  return lines.slice(1).map(function(line){
    var cells=splitCSVLine(line);
    var name='';
    if(iName>-1) name=cells[iName]||'';
    else if(iFirst>-1 || iLast>-1) name=((cells[iFirst]||'')+' '+(cells[iLast]||'')).trim();
    var row={name:name, email:iEmail>-1?(cells[iEmail]||''):'', phone:iPhone>-1?(cells[iPhone]||''):''};
    if(iSource>-1 && cells[iSource]) row.freshaSource=cells[iSource];
    if(iAdded>-1 && cells[iAdded]){ var fc=parseFreshaDateCell(cells[iAdded]); if(fc) row.firstContactDate=fc; }
    if(iFirstAppt>-1) row.hadFreshaAppt=!!(cells[iFirstAppt]);
    return row;
  }).filter(function(r){return r.name;});
}

function categorizeImportRow(row){
  var email=(row.email||'').trim().toLowerCase();
  var phone=normalizePhoneIntl(row.phone);
  if(!email && !phone) return{row:row,bucket:'ambiguous',reason:'Χωρίς email/τηλέφωνο'};
  var clientMatch=clients.find(function(c){
    return !c.deleted && ((email && (c.email||'').toLowerCase()===email) || (phone && normalizePhoneIntl(c.phone)===phone));
  });
  if(clientMatch) return{row:row,bucket:'existing-client',match:clientMatch};
  var leadMatches=leads.filter(function(l){
    return !l.deleted && ((email && (l.email||'').toLowerCase()===email) || (phone && normalizePhoneIntl(l.phone)===phone));
  });
  if(leadMatches.length===1) return{row:row,bucket:'existing-lead',match:leadMatches[0]};
  if(leadMatches.length>1) return{row:row,bucket:'ambiguous',reason:'Ταιριάζει με πάνω από ένα lead'};
  if(row.hadFreshaAppt) return{row:row,bucket:'already-served',reason:'Είχε ήδη ραντεβού στο Fresha — δεν είναι νέο lead'};
  return{row:row,bucket:'new'};
}

function buildImportPreview(rows){
  var result={newRows:[],existingLeadRows:[],existingClientRows:[],alreadyServedRows:[],ambiguousRows:[]};
  rows.forEach(function(row){
    var cat=categorizeImportRow(row);
    if(cat.bucket==='new') result.newRows.push(cat);
    else if(cat.bucket==='existing-lead') result.existingLeadRows.push(cat);
    else if(cat.bucket==='existing-client') result.existingClientRows.push(cat);
    else if(cat.bucket==='already-served') result.alreadyServedRows.push(cat);
    else result.ambiguousRows.push(cat);
  });
  return result;
}

function handleLeadsCSVFile(evt){
  var files=evt.target.files;
  if(!files || !files.length) return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var rows=parseFreshaCSVRows(e.target.result);
      if(!rows.length){
        if(typeof showErrorToast==='function') showErrorToast('❌ Δεν βρέθηκαν αναγνωρίσιμες γραμμές στο CSV.');
      } else {
        openLeadsImportDialog(buildImportPreview(rows));
      }
    }catch(err){
      if(typeof showErrorToast==='function') showErrorToast('❌ Σφάλμα ανάγνωσης CSV: '+err.message);
    }
    evt.target.value='';
  };
  reader.readAsText(files[0]);
}

var _leadsImportPending=null;

function leadsImportRowLine(cat,note){
  var r=cat.row;
  return '<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 2px;font-size:12px;border-top:1px solid #f0f0f0">'
    +'<span>'+esc(r.name||'—')+'</span>'
    +'<span style="color:#999;text-align:right">'+esc(note||(r.email||r.phone||''))+'</span>'
    +'</div>';
}

function leadsImportBodyHtml(preview){
  var html='';
  if(preview.newRows.length){
    html+='<div style="font-weight:700;color:#025857;font-size:12.5px;margin-top:8px">✅ '+preview.newRows.length+' νέες επαφές θα προστεθούν ως leads</div>';
    html+=preview.newRows.map(function(cat){return leadsImportRowLine(cat);}).join('');
  }
  var existingN=preview.existingClientRows.length+preview.existingLeadRows.length;
  if(existingN){
    html+='<div style="font-weight:700;color:#6b6b6b;font-size:12.5px;margin-top:14px">⏭ '+existingN+' υπάρχουν ήδη — παραλείπονται αυτόματα</div>';
    html+=preview.existingClientRows.map(function(cat){return leadsImportRowLine(cat,'ήδη πελάτης');}).join('');
    html+=preview.existingLeadRows.map(function(cat){return leadsImportRowLine(cat,'ήδη lead');}).join('');
  }
  if(preview.alreadyServedRows.length){
    html+='<div style="font-weight:700;color:#6b6b6b;font-size:12.5px;margin-top:14px">🕐 '+preview.alreadyServedRows.length+' είχαν ήδη ραντεβού στο Fresha — δεν είναι νέα leads, παραλείπονται</div>';
    html+=preview.alreadyServedRows.map(function(cat){return leadsImportRowLine(cat,'παλιός πελάτης Fresha');}).join('');
  }
  if(preview.ambiguousRows.length){
    html+='<div style="font-weight:700;color:#e65100;font-size:12.5px;margin-top:14px">⚠️ '+preview.ambiguousRows.length+' ασαφή — χρειάζονται τον έλεγχό σου</div>';
    html+=preview.ambiguousRows.map(function(cat){return leadsImportRowLine(cat,cat.reason);}).join('');
  }
  return html || '<div style="color:#999;font-size:12.5px;margin-top:8px">Καμία γραμμή προς εμφάνιση.</div>';
}

function openLeadsImportDialog(preview){
  _leadsImportPending=preview;
  var dlg=document.getElementById('leadsImportDialog');
  if(!dlg) return;
  var total=preview.newRows.length+preview.existingLeadRows.length+preview.existingClientRows.length+preview.alreadyServedRows.length+preview.ambiguousRows.length;
  var summaryEl=document.getElementById('leadsImportSummary');
  if(summaryEl) summaryEl.textContent=total+' γραμμ'+(total===1?'ή':'ές')+' στο αρχείο — ταίριασμα με βάση email/τηλέφωνο, ποτέ όνομα.';
  var bodyEl=document.getElementById('leadsImportBody');
  if(bodyEl) bodyEl.innerHTML=leadsImportBodyHtml(preview);
  var btn=document.getElementById('leadsImportConfirmBtn');
  if(btn){
    btn.disabled=!preview.newRows.length;
    btn.style.opacity=preview.newRows.length?'1':'.5';
    btn.textContent='✓ Επιβεβαίωση εισαγωγής ('+preview.newRows.length+')';
  }
  dlg.style.display='flex';
}

function closeLeadsImportDialog(){
  var dlg=document.getElementById('leadsImportDialog');
  if(dlg) dlg.style.display='none';
  _leadsImportPending=null;
}

function confirmLeadsImport(){
  if(!_leadsImportPending || !_leadsImportPending.newRows.length){ closeLeadsImportDialog(); return; }
  var n=0;
  _leadsImportPending.newRows.forEach(function(cat){
    var r=cat.row;
    addLead({
      name:r.name, email:r.email, phone:r.phone, source:'fresha',
      firstContactDate:r.firstContactDate,
      notes:r.freshaSource?('Πηγή (Fresha): '+r.freshaSource):''
    });
    n++;
  });
  closeLeadsImportDialog();
  if(typeof showSuccessToast==='function') showSuccessToast('✅ Προστέθηκαν '+n+' νέα leads');
  if(curTab===11 && typeof renderLeads==='function') renderLeads();
  if(typeof updateLeadsNavBadge==='function') updateLeadsNavBadge();
}

document.addEventListener('keydown', function(e){
  if(e.key==='Escape'){
    var dlg=document.getElementById('leadsImportDialog');
    if(dlg && dlg.style.display!=='none') closeLeadsImportDialog();
  }
});

// ── Καθαρισμός λάθος-εισαγμένων Fresha leads ──────────────────────────────────────────────
// One-time fix for imports done before categorizeImportRow() learned to exclude "First appt."
// rows (see the 2026-09-22 note at the top of this file). Re-parses the SAME Fresha CSV and
// finds EXISTING leads (source:'fresha', stage:'new', not deleted) whose email/phone matches a
// row that had already had a Fresha appointment — those were never real "new" leads. Preview
// then confirm, same as the import above; never touches leads that were manually moved to a
// different stage (a sign the dietologist already engaged with them).
function triggerLeadsCleanupImport(){
  var inp=document.getElementById('leads-cleanup-csv-input');
  if(inp) inp.click();
}

function handleLeadsCleanupCSVFile(evt){
  var files=evt.target.files;
  if(!files || !files.length) return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var rows=parseFreshaCSVRows(e.target.result);
      var emailKeys={}, phoneKeys={};
      rows.forEach(function(r){
        if(!r.hadFreshaAppt) return;
        var email=(r.email||'').trim().toLowerCase();
        var phone=r.phone?normalizePhoneIntl(r.phone):'';
        if(email) emailKeys[email]=true;
        if(phone) phoneKeys[phone]=true;
      });
      var matches=leads.filter(function(l){
        if(l.deleted || l.source!=='fresha' || l.stage!=='new') return false;
        var email=(l.email||'').trim().toLowerCase();
        var phone=l.phone?normalizePhoneIntl(l.phone):'';
        return (email && emailKeys[email]) || (phone && phoneKeys[phone]);
      });
      if(!matches.length){
        if(typeof showErrorToast==='function') showErrorToast('✅ Δεν βρέθηκαν λάθος-εισαγμένα leads.');
      } else {
        openLeadsCleanupDialog(matches);
      }
    }catch(err){
      if(typeof showErrorToast==='function') showErrorToast('❌ Σφάλμα ανάγνωσης CSV: '+err.message);
    }
    evt.target.value='';
  };
  reader.readAsText(files[0]);
}

var _leadsCleanupPending=null;

function openLeadsCleanupDialog(matches){
  _leadsCleanupPending=matches;
  var dlg=document.getElementById('leadsCleanupDialog');
  if(!dlg) return;
  var summaryEl=document.getElementById('leadsCleanupSummary');
  if(summaryEl) summaryEl.textContent='Αυτά τα '+matches.length+' leads είχαν ήδη ραντεβού στο Fresha παλιότερα — δεν ήταν ποτέ πραγματικά "νέα" leads, μπήκαν λάθος στη στήλη "Νέο". Θα αφαιρεθούν (ανακτήσιμα, δεν σβήνονται μόνιμα).';
  var bodyEl=document.getElementById('leadsCleanupBody');
  if(bodyEl) bodyEl.innerHTML=matches.map(function(l){
    return leadsImportRowLine({row:{name:l.name,email:l.email,phone:l.phone}});
  }).join('');
  var btn=document.getElementById('leadsCleanupConfirmBtn');
  if(btn) btn.textContent='🗑️ Αφαίρεση ('+matches.length+')';
  dlg.style.display='flex';
}

function closeLeadsCleanupDialog(){
  var dlg=document.getElementById('leadsCleanupDialog');
  if(dlg) dlg.style.display='none';
  _leadsCleanupPending=null;
}

function confirmLeadsCleanup(){
  if(!_leadsCleanupPending || !_leadsCleanupPending.length){ closeLeadsCleanupDialog(); return; }
  var n=_leadsCleanupPending.length;
  _leadsCleanupPending.forEach(function(l){ deleteLead(l.id); });
  closeLeadsCleanupDialog();
  if(typeof showSuccessToast==='function') showSuccessToast('✅ Αφαιρέθηκαν '+n+' λάθος-εισαγμένα leads');
  if(curTab===11 && typeof renderLeads==='function') renderLeads();
  if(typeof updateLeadsNavBadge==='function') updateLeadsNavBadge();
}

document.addEventListener('keydown', function(e){
  if(e.key==='Escape'){
    var dlg=document.getElementById('leadsCleanupDialog');
    if(dlg && dlg.style.display!=='none') closeLeadsCleanupDialog();
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 🏋️ Γυμναστές / Προπονητές — φάση 1 (2026-11-23)
//   • Λίστα γυμναστών/προπονητών (localStorage 'fyh_trainers' + cloud blob `trainers`)
//   • Ανά πελάτη: c.trainerId + συναίνεση (c.trainerConsent / c.trainerConsentAt) + «ήρθε από σύσταση»
//   • «📤 Στείλε στον γυμναστή»: αναφορά μέτρησης ως link (gymnastis.html) με ΔΙΚΟ της token
//     (c.trainerToken) στο shared_plans, snapshot.kind==='trainer' — χωρίς SQL migration,
//     ίδιο μοτίβο με το stoxoi.html (targets-sheet.js).
// Ασφάλεια/GDPR: στέλνεται ΜΟΝΟ με συναίνεση· ιατρικό ιστορικό, σημειώσεις, πλάνο δεν μπαίνουν ποτέ
// στο snapshot. Αλλαγή γυμναστή ή ανάκληση συναίνεσης → σβήνεται η γραμμή του link (παύει να ανοίγει).
// ═══════════════════════════════════════════════════════════════════════════════════

var TRAINER_BASE='https://feedyourhealth.github.io/gymnastis.html';
var TRAINER_LINK_DAYS=90;
var TRAINER_KIND_LABEL={trainer:'Γυμναστής',coach:'Προπονητής'};
var TRAINER_SIGNATURE={el:'Στέφανος Πίσινος, Κλινικός Διαιτολόγος · Feed Your Health',en:'Stephanos Pissinos, Clinical Dietitian · Feed Your Health'};
var _trFilter='all', _trSearch='', _trOpenId=null;

// Χρώματα της καρτέλας σε μεταβλητές, ώστε να ακολουθούν και το σκούρο θέμα (body.dark-mode).
(function _trInjectStyle(){
  if(document.getElementById('tr-style')) return;
  var st=document.createElement('style'); st.id='tr-style';
  st.textContent='body{--tr-sub:#5a8a82;--tr-head:#014545;--tr-av-bg:#E2EEE5;--tr-av-fg:#025857;'
    +'--tr-good-bg:#e8f4e9;--tr-good-fg:#2e7d32;--tr-warn-bg:#fff4df;--tr-warn-fg:#9a6200;--tr-warn-bd:#f0c46e;'
    +'--tr-bad-bg:#fdecea;--tr-bad-fg:#c0392b;--tr-mute-bg:#eef4f2;--tr-mute-fg:#5a8a82}'
    +'body.dark-mode{--tr-sub:#9fbcb6;--tr-head:#7fdcc8;--tr-av-bg:#0f2a24;--tr-av-fg:#7fdcc8;'
    +'--tr-good-bg:#14301a;--tr-good-fg:#8bc98f;--tr-warn-bg:#3a2c14;--tr-warn-fg:#f0c46e;--tr-warn-bd:#6b5220;'
    +'--tr-bad-bg:#3a1a1a;--tr-bad-fg:#f09595;--tr-mute-bg:#242424;--tr-mute-fg:#b0b0b0}'
    +'.tr-card{cursor:pointer;border:1px solid var(--border-light);border-radius:12px;padding:14px;background:var(--card-bg);display:flex;flex-direction:column;gap:8px}'
    +'.tr-card:hover{border-color:var(--tr-av-fg)}'
    +'.tr-card.tr-pending{border-left:4px solid var(--tr-warn-bd);padding-left:11px}'
    +'.tr-kv{display:grid;grid-template-columns:max-content 1fr;gap:5px 14px;font-size:13px}'
    +'.tr-kv dt{color:var(--text-muted)} .tr-kv dd{margin:0;overflow-wrap:anywhere}'
    +'.tr-box{background:var(--card-bg);border:1px solid var(--border-light);border-radius:14px;padding:16px}'
    +'.tr-del{background:none;border:none;color:var(--text-muted);font:inherit;font-size:12px;cursor:pointer;padding:4px 0;text-decoration:underline}'
    +'.tr-del:hover{color:var(--tr-bad-fg)}';
  (document.head||document.documentElement).appendChild(st);
})();

// ── Αποθήκευση ─────────────────────────────────────────────────────────────────────
function getTrainers(){
  var l=(typeof safeStorageGet==='function')?safeStorageGet('fyh_trainers',[]):[];
  return Array.isArray(l)?l:[];
}
function saveTrainers(list){
  if(typeof safeStorageSet==='function') safeStorageSet('fyh_trainers',list||[]);
  if(typeof save==='function') save();            // ανεβαίνει στο cloud blob (Cloud._blobBody)
}
function getTrainer(id){ return getTrainers().filter(function(t){return t.id===id;})[0]||null; }
function trainerClients(id){ return (window.clients||[]).filter(function(c){return c&&c.trainerId===id;}); }

// ── Μικρά βοηθητικά ────────────────────────────────────────────────────────────────
function _trInitials(n){ return String(n||'?').trim().split(/\s+/).slice(0,2).map(function(w){return w.charAt(0);}).join('').toUpperCase(); }
function _trDateShort(iso){ if(!iso) return '—'; var d=new Date(iso); if(isNaN(d)) return '—'; return d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear(); }
function _trYmdShort(ymd){ var p=String(ymd||'').split('-'); return p.length===3?(+p[2])+'/'+(+p[1]):'—'; }
function _trDaysAgo(iso){ if(!iso) return null; var d=new Date(iso); if(isNaN(d)) return null; return Math.floor((Date.now()-d.getTime())/86400000); }
function _trLastMeas(c){
  var l=(c&&c.weightLog||[]).filter(function(e){return e&&e.weight>0;}).slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
  return l.length?l[l.length-1]:null;
}
function _trLastSend(c){ var s=(c&&c.trainerSends)||[]; return s.length?s[s.length-1]:null; }
// 'none' (καμία μέτρηση) · 'sent' (η τελευταία μέτρηση έχει σταλεί) · 'pending' (νέα μέτρηση, όχι ακόμα σταλμένη)
function trainerSendStatus(c){
  var m=_trLastMeas(c); if(!m) return 'none';
  var s=_trLastSend(c);
  if(s && s.trainerId===c.trainerId && s.measDate>=m.date) return 'sent';
  return 'pending';
}
function _trLastSendForTrainer(id){
  var best=null;
  (window.clients||[]).forEach(function(c){ ((c&&c.trainerSends)||[]).forEach(function(s){ if(s.trainerId===id && (!best||s.at>best)) best=s.at; }); });
  return best;
}
function _trPill(txt,kind){
  var k=kind||'mute';
  return '<span style="display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600;background:var(--tr-'+k+'-bg);color:var(--tr-'+k+'-fg)">'+txt+'</span>';
}
function _trOverlay(id,inner,maxW){
  var ov=document.getElementById(id); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id=id;
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML='<div style="background:var(--card-bg);border-radius:16px;max-width:'+(maxW||520)+'px;width:100%;padding:22px;box-shadow:0 10px 40px rgba(0,0,0,.25);max-height:90vh;overflow-y:auto;-webkit-overflow-scrolling:touch">'+inner+'</div>';
  document.body.appendChild(ov);
  return ov;
}
function _trCloseBtn(id){ return '<button class="btn" onclick="document.getElementById(\''+id+'\').remove()">Κλείσιμο</button>'; }

// ── Ανάκληση link (αλλαγή γυμναστή / ανάκληση συναίνεσης) ─────────────────────────
function _trDeleteRow(tok){
  var C=window.Cloud;
  if(!tok||!(C&&C.enabled&&C.user&&C.sb)) return;
  try{
    C.sb.from('shared_plans').delete().eq('token',tok).then(function(r){
      if(r&&r.error){
        console.warn('[trainer] delete row',r.error);
        C.sb.from('shared_plans').update({expires_at:new Date(Date.now()-60000).toISOString()}).eq('token',tok).then(function(){});
      }
    });
  }catch(e){ console.warn('[trainer] delete row',e); }
}
function trainerRevokeLink(c){
  if(!c||!c.trainerToken) return;
  var tok=c.trainerToken;
  c.trainerToken=null;
  var C=window.Cloud;
  if(C&&C.enabled&&C.user&&C.sb){
    try{
      // Διαγραφή (λιγότερα δεδομένα υγείας στη βάση)· αν αποτύχει, λήξη στο παρελθόν → «έληξε».
      C.sb.from('shared_plans').delete().eq('token',tok).then(function(r){
        if(r&&r.error){
          console.warn('[trainer] revoke link',r.error);
          C.sb.from('shared_plans').update({expires_at:new Date(Date.now()-60000).toISOString()}).eq('token',tok).then(function(){});
        }
      });
    }catch(e){ console.warn('[trainer] revoke link',e); }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// Καρτέλα «🏋️ Γυμναστές» (swTab(11))
// ═══════════════════════════════════════════════════════════════════════════════════
function renderTrainers(){
  curId=null;
  var main=document.getElementById('main'); if(!main) return;
  if(_trOpenId && getTrainer(_trOpenId)){ main.innerHTML=_trProfileHtml(getTrainer(_trOpenId)); if(typeof renderSB==='function') renderSB(); return; }
  _trOpenId=null;
  var all=getTrainers();
  var chip=function(k,l,n){ return '<button type="button" class="rcp-filter-chip'+(_trFilter===k?' active':'')+'" onclick="_trFilter=\''+k+'\';renderTrainersList()">'+l+' ('+n+')</button>'; };
  var stale=all.filter(function(t){ var d=_trDaysAgo(_trLastSendForTrainer(t.id)); return trainerClients(t.id).length && (d==null||d>30); }).length;
  var html='<div class="hm-wrap">'
    +'<div class="hm-title">🏋️ Γυμναστές &amp; Προπονητές</div>'
    +'<div style="font-size:13px;color:var(--text-muted);margin:-4px 0 12px">Οι γυμναστές/προπονητές των πελατών σου. Μετά από κάθε μέτρηση, με τη συναίνεση του πελάτη, του στέλνεις αναφορά με ένα κλικ.</div>'
    +'<div class="rcp-toolbar">'
    +'<input type="text" class="rcp-search" placeholder="🔍 Όνομα, γυμναστήριο, ομάδα..." aria-label="Αναζήτηση γυμναστή" value="'+esc(_trSearch)+'" oninput="_trSearch=this.value;renderTrainersList()">'
    +'<button type="button" class="rcp-add-btn" onclick="openTrainerEdit(null)">+ Νέος γυμναστής</button>'
    +'</div>'
    +'<div class="rcp-filter-row">'
    +chip('all','Όλοι',all.length)
    +chip('trainer','Γυμναστές',all.filter(function(t){return t.kind!=='coach';}).length)
    +chip('coach','Προπονητές',all.filter(function(t){return t.kind==='coach';}).length)
    +chip('stale','Χωρίς αποστολή 30+ ημ.',stale)
    +'</div>'
    +'<div id="tr-list"></div>'
    +'</div>';
  main.innerHTML=html;
  renderTrainersList();
  if(typeof renderSB==='function') renderSB();
}

function renderTrainersList(){
  var box=document.getElementById('tr-list'); if(!box) return;
  // ανανέωση ενεργού chip χωρίς πλήρες re-render (κρατά το focus της αναζήτησης)
  document.querySelectorAll('.rcp-filter-row .rcp-filter-chip').forEach(function(b){
    var m=(b.getAttribute('onclick')||'').match(/_trFilter='(\w+)'/); if(m) b.classList.toggle('active',m[1]===_trFilter);
  });
  var q=(typeof foldGreekForCompare==='function')?foldGreekForCompare(_trSearch||''):String(_trSearch||'').toLowerCase();
  var list=getTrainers().filter(function(t){
    if(_trFilter==='trainer'&&t.kind==='coach') return false;
    if(_trFilter==='coach'&&t.kind!=='coach') return false;
    if(_trFilter==='stale'){ var d=_trDaysAgo(_trLastSendForTrainer(t.id)); if(!(trainerClients(t.id).length&&(d==null||d>30))) return false; }
    if(q){ var hay=[t.name,t.place,t.specialty].join(' '); hay=(typeof foldGreekForCompare==='function')?foldGreekForCompare(hay):hay.toLowerCase(); if(hay.indexOf(q)<0) return false; }
    return true;
  });
  var _pend=function(t){ return trainerClients(t.id).filter(function(c){return c.trainerConsent&&trainerSendStatus(c)==='pending';}).length; };
  list.sort(function(a,b){ var pa=_pend(a)>0, pb=_pend(b)>0; if(pa!==pb) return pa?-1:1; return String(a.name||'').localeCompare(String(b.name||''),'el'); });
  if(!getTrainers().length){
    box.innerHTML='<div style="text-align:center;padding:36px 12px;color:var(--text-muted)"><div style="font-size:34px">🏋️</div><div style="font-weight:600;margin:6px 0">Δεν έχεις προσθέσει ακόμα γυμναστές</div><div style="font-size:13px;margin-bottom:12px">Πρόσθεσε τον πρώτο και σύνδεσέ τον με τους πελάτες του.</div><button class="btn primary" onclick="openTrainerEdit(null)">+ Νέος γυμναστής</button></div>';
    return;
  }
  if(!list.length){ box.innerHTML='<div style="padding:20px;color:var(--text-muted);text-align:center">Κανένα αποτέλεσμα.</div>'; return; }
  box.innerHTML='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">'+list.map(function(t){
    var cl=trainerClients(t.id), ref=cl.filter(function(c){return c.trainerReferred;}).length;
    var pend=cl.filter(function(c){return c.trainerConsent&&trainerSendStatus(c)==='pending';}).length;
    var last=_trLastSendForTrainer(t.id), d=_trDaysAgo(last);
    var status=!cl.length?_trPill('Χωρίς πελάτες','mute'):(pend?_trPill('📤 '+pend+' μέτρηση'+(pend>1?'εις':'')+' να σταλ'+(pend>1?'ούν':'εί'),'warn'):(d!=null&&d<=30?_trPill('Ενημερωμένος','good'):_trPill('⏳ Καιρό χωρίς ενημέρωση','warn')));
    return '<div role="button" tabindex="0" onclick="openTrainerProfile(\''+escJsAttr(t.id)+'\')" onkeydown="if(event.key===\'Enter\')openTrainerProfile(\''+escJsAttr(t.id)+'\')" class="tr-card'+(pend?' tr-pending':'')+'"'+(pend?' title="Υπάρχουν μετρήσεις που δεν έχουν σταλεί"':'')+'>'
      +'<div style="display:flex;gap:10px;align-items:center"><div style="width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:700;background:var(--tr-av-bg);color:var(--tr-av-fg);flex:none">'+esc(_trInitials(t.name))+'</div>'
      +'<div style="min-width:0"><div style="font-weight:700">'+esc(t.name)+'</div><div style="font-size:12.5px;color:var(--text-muted)">'+esc(TRAINER_KIND_LABEL[t.kind]||'Γυμναστής')+(t.place?' · '+esc(t.place):'')+'</div></div></div>'
      +'<div style="display:flex;gap:16px;font-size:12px;color:var(--text-muted)">'
      +'<span><b style="display:block;font-size:15px;color:var(--text-strong)">'+cl.length+'</b>πελάτες</span>'
      +'<span><b style="display:block;font-size:15px;color:var(--text-strong)">'+ref+'</b>σου έφερε</span>'
      +'<span><b style="display:block;font-size:15px;color:var(--text-strong)">'+(d==null?'—':(d===0?'σήμερα':d+' ημ.'))+'</b>τελ. αποστολή</span>'
      +'</div><div>'+status+'</div></div>';
  }).join('')+'</div>';
}

function openTrainerProfile(id){ _trOpenId=id; if(typeof swTab==='function') swTab(11); else renderTrainers(); }
function closeTrainerProfile(){ _trOpenId=null; renderTrainers(); }

function _trProfileHtml(t){
  var cl=trainerClients(t.id).slice().sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'el');});
  var phone=(typeof normalizePhoneIntl==='function')?normalizePhoneIntl(t.phone):'';
  var row=function(l,v){ return v?'<dt>'+l+'</dt><dd>'+v+'</dd>':''; };
  var avail=(window.clients||[]).filter(function(c){return c&&!c.trainerId;}).sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'el');});
  var rows=cl.map(function(c){
    var m=_trLastMeas(c), st=trainerSendStatus(c), s=_trLastSend(c);
    var cons=c.trainerConsent?_trPill('✓ '+_trDateShort(c.trainerConsentAt),'good'):_trPill('Όχι ακόμα','bad');
    var sent=st==='none'?'<span style="color:var(--text-muted)">—</span>':(st==='sent'?_trPill(_trDateShort(s.at),'good'):_trPill('Εκκρεμεί','warn'));
    return '<tr style="border-top:1px solid var(--border-light)">'
      +'<td style="padding:8px 6px"><a href="javascript:void(0)" onclick="selectClient(\''+escJsAttr(c.id)+'\')" style="font-weight:600;color:var(--tr-head)">'+esc(c.name||'—')+'</a>'+(c.trainerReferred?' <span title="Ήρθε από σύσταση του γυμναστή">🤝</span>':'')+'</td>'
      +'<td style="padding:8px 6px">'+cons+'</td>'
      +'<td style="padding:8px 6px">'+(m?_trYmdShort(m.date):'—')+'</td>'
      +'<td style="padding:8px 6px">'+sent+'</td>'
      +'<td style="padding:8px 6px;text-align:right">'+(m?'<button class="btn" style="font-size:12px;padding:5px 10px" onclick="openTrainerSend(\''+escJsAttr(c.id)+'\')">📤 Αποστολή</button>':'')+'</td></tr>';
  }).join('');
  return '<div class="hm-wrap">'
    +'<div style="margin-bottom:10px"><button class="btn" onclick="closeTrainerProfile()">← Όλοι οι γυμναστές</button></div>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px;align-items:start">'
    // στοιχεία
    +'<div class="tr-box">'
    +'<div style="display:flex;gap:12px;align-items:center;margin-bottom:10px"><div style="width:56px;height:56px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:18px;background:var(--tr-av-bg);color:var(--tr-av-fg);flex:none">'+esc(_trInitials(t.name))+'</div>'
    +'<div><div style="font-size:18px;font-weight:700;color:var(--tr-head)">'+esc(t.name)+'</div><div style="font-size:13px;color:var(--text-muted)">'+esc(TRAINER_KIND_LABEL[t.kind]||'Γυμναστής')+(t.place?' · '+esc(t.place):'')+'</div></div></div>'
    +'<dl class="tr-kv" style="margin:4px 0 0">'
    +row('Τηλέφωνο',esc(t.phone||''))+row('Email',esc(t.email||''))
    +row('Γλώσσα αναφοράς',t.lang==='en'?'English':'Ελληνικά')
    +row('Ειδικότητα',esc(t.specialty||''))+row('Σημειώσεις',esc(t.notes||'').replace(/\n/g,'<br>'))
    +'</dl>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'
    +'<button class="btn" onclick="openTrainerEdit(\''+escJsAttr(t.id)+'\')">✏️ Επεξεργασία</button>'
    +(phone?'<a class="btn" style="background:#25D366;color:#fff;border-color:#25D366;text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/'+esc(phone)+'">💬 WhatsApp</a>':'')
    +(t.email?'<a class="btn" style="text-decoration:none" href="mailto:'+esc(t.email)+'">✉️ Email</a>':'')
    +'</div>'
    +_trHubCardHtml(t)
    +'<div style="text-align:right;margin-top:14px;border-top:1px solid var(--border-light);padding-top:6px"><button class="tr-del" onclick="deleteTrainer(\''+escJsAttr(t.id)+'\')">Διαγραφή γυμναστή</button></div>'
    +'</div>'
    // πελάτες
    +'<div class="tr-box">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px"><div style="font-weight:700;color:var(--tr-head)">Πελάτες ('+cl.length+')</div>'
    // 🔍 Σύνδεση πελάτη με αναζήτηση (όνομα ή τηλέφωνο) αντί για μακριά λίστα
    +(avail.length?'<div style="position:relative;width:240px;max-width:100%"><input type="search" id="tr-link-q" placeholder="🔍 Σύνδεση πελάτη (όνομα/τηλ.)…" autocomplete="off" style="width:100%;font-size:13px" oninput="_trLinkSearch(\''+escJsAttr(t.id)+'\',this.value)" onfocus="_trLinkSearch(\''+escJsAttr(t.id)+'\',this.value)" onkeydown="if(event.key===\'Enter\'){var b=document.querySelector(\'#tr-link-res button\');if(b){event.preventDefault();b.click();}}else if(event.key===\'Escape\'){this.value=\'\';_trLinkSearch(\''+escJsAttr(t.id)+'\',\'\');}">'
      +'<div id="tr-link-res" style="display:none;position:absolute;right:0;left:0;top:calc(100% + 4px);z-index:20;background:var(--card-bg);border:1px solid var(--border-light);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.15);max-height:280px;overflow-y:auto"></div></div>':'')
    +'</div>'
    +(cl.length?'<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="color:var(--text-muted);font-size:12px;text-align:left"><th style="padding:6px">Πελάτης</th><th style="padding:6px">Συναίνεση</th><th style="padding:6px">Τελ. μέτρηση</th><th style="padding:6px">Στάλθηκε</th><th></th></tr>'+rows+'</table></div>'
      :'<div style="font-size:13px;color:var(--text-muted);padding:10px 0">Δεν έχει συνδεθεί ακόμα κανένας πελάτης. Σύνδεσε από εδώ ή από τα «Στοιχεία» του πελάτη.</div>')
    +'<div style="font-size:12px;color:var(--text-muted);margin-top:10px">🤝 = ήρθε από σύσταση αυτού του γυμναστή. Χωρίς συναίνεση δεν στέλνεται τίποτα.</div>'
    +'</div>'
    +'</div></div>';
}

document.addEventListener('click',function(e){ var b=document.getElementById('tr-link-res'); if(b&&b.style.display!=='none'&&!e.target.closest('#tr-link-res')&&e.target.id!=='tr-link-q') b.style.display='none'; });
function _trFold(x){ return (typeof foldGreekForCompare==='function')?foldGreekForCompare(String(x||'')):String(x||'').toLowerCase(); }
function _trLinkSearch(tid,q){
  var box=document.getElementById('tr-link-res'); if(!box) return;
  q=String(q||'').trim();
  if(!q){ box.style.display='none'; box.innerHTML=''; return; }
  var fq=_trFold(q), dq=q.replace(/[^0-9]/g,'');
  var all=(window.clients||[]).filter(function(c){ return c && c.trainerId!==tid; });
  var hits=all.filter(function(c){
    if(_trFold(c.name).indexOf(fq)>=0) return true;
    return dq.length>=3 && String(c.phone||'').replace(/[^0-9]/g,'').indexOf(dq)>=0;
  }).sort(function(a,b){
    var sa=_trFold(a.name).indexOf(fq)===0?0:1, sb=_trFold(b.name).indexOf(fq)===0?0:1;   // πρώτα όσοι ξεκινούν έτσι
    if(sa!==sb) return sa-sb;
    if(!a.trainerId!==!b.trainerId) return a.trainerId?1:-1;                              // πρώτα όσοι δεν έχουν γυμναστή
    return String(a.name||'').localeCompare(String(b.name||''),'el');
  });
  var more=hits.length>8; hits=hits.slice(0,8);
  box.innerHTML=hits.length?hits.map(function(c){
    var other=c.trainerId?getTrainer(c.trainerId):null;
    return '<button type="button" onclick="trainerLinkClientFromProfile(\''+escJsAttr(tid)+'\',\''+escJsAttr(c.id)+'\')" style="display:block;width:100%;text-align:left;background:none;border:none;border-bottom:1px solid var(--border-light);padding:8px 12px;font:inherit;font-size:13px;cursor:pointer;color:inherit">'
      +'<b>'+esc(c.name||'—')+'</b>'+(c.phone?' <span style="color:var(--text-muted);font-size:12px">'+esc(c.phone)+'</span>':'')
      +(other?'<div style="font-size:11.5px;color:var(--tr-warn-fg)">έχει ήδη: '+esc(other.name)+' (θα αλλάξει)</div>':'')+'</button>';
  }).join('')+(more?'<div style="padding:6px 12px;font-size:12px;color:var(--text-muted)">…γράψε περισσότερα για να στενέψει</div>':'')
    :'<div style="padding:10px 12px;font-size:13px;color:var(--text-muted)">Κανένας πελάτης «'+esc(q)+'».</div>';
  box.style.display='block';
}

function trainerLinkClientFromProfile(tid,cid){
  if(!cid){ var sel=document.getElementById('tr-link-client'); cid=sel&&sel.value; }
  if(!cid) return;
  var c=(window.clients||[]).filter(function(x){return x.id===cid;})[0]; if(!c) return;
  if(c.trainerId && c.trainerId!==tid){
    var o=getTrainer(c.trainerId);
    if(!confirm('Ο/Η '+(c.name||'πελάτης')+' είναι ήδη με '+((o&&o.name)||'άλλο γυμναστή')+'.\n\nΑλλαγή; Ο σύνδεσμος του προηγούμενου θα σταματήσει να ανοίγει.')) return;
  }
  setClientTrainer(c,tid,true);
  showSuccessToast('✅ '+(c.name||'Ο πελάτης')+' συνδέθηκε');
  renderTrainers();
}

// ── Νέος / επεξεργασία ─────────────────────────────────────────────────────────────
function openTrainerEdit(id,afterSaveClientId){
  var t=id?getTrainer(id):null, v=t||{kind:'trainer',lang:'el'};
  var inp=function(fid,lbl,val,type,ph){ return '<div style="margin-bottom:10px"><label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:3px">'+lbl+'</label><input type="'+(type||'text')+'" id="'+fid+'" value="'+esc(val||'')+'" placeholder="'+esc(ph||'')+'" style="width:100%"></div>'; };
  _trOverlay('tr-edit-ov',
    '<div style="font-size:18px;font-weight:700;color:var(--tr-head);margin-bottom:12px">'+(t?'✏️ Επεξεργασία γυμναστή':'🏋️ Νέος γυμναστής / προπονητής')+'</div>'
    +inp('tre-name','Ονοματεπώνυμο *',v.name,'text','π.χ. Ανδρέας Κωνσταντίνου')
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    +'<div style="margin-bottom:10px"><label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:3px">Ιδιότητα</label><select id="tre-kind" style="width:100%"><option value="trainer"'+(v.kind!=='coach'?' selected':'')+'>Γυμναστής (personal trainer)</option><option value="coach"'+(v.kind==='coach'?' selected':'')+'>Προπονητής (άθλημα/ομάδα)</option></select></div>'
    +'<div style="margin-bottom:10px"><label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:3px">Γλώσσα αναφοράς</label><select id="tre-lang" style="width:100%"><option value="el"'+(v.lang!=='en'?' selected':'')+'>Ελληνικά</option><option value="en"'+(v.lang==='en'?' selected':'')+'>English</option></select></div>'
    +'</div>'
    +inp('tre-place','Γυμναστήριο / σύλλογος / άθλημα',v.place,'text','π.χ. Elevate Gym · Judo Λεμεσού')
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+inp('tre-phone','📱 Τηλέφωνο (WhatsApp)',v.phone,'tel','π.χ. 99123456')+inp('tre-email','📧 Email',v.email,'email','')+'</div>'
    +inp('tre-spec','Ειδικότητα',v.specialty,'text','π.χ. υπερτροφία, judo, τρέξιμο')
    +'<div style="margin-bottom:10px"><label style="display:block;font-size:12.5px;font-weight:600;margin-bottom:3px">Σημειώσεις (μόνο για σένα)</label><textarea id="tre-notes" rows="3" style="width:100%">'+esc(v.notes||'')+'</textarea></div>'
    +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">'+_trCloseBtn('tr-edit-ov')
    +'<button class="btn primary" onclick="saveTrainerEdit('+(id?'\''+escJsAttr(id)+'\'':'null')+','+(afterSaveClientId?'\''+escJsAttr(afterSaveClientId)+'\'':'null')+')">💾 Αποθήκευση</button></div>',480);
  setTimeout(function(){ var n=document.getElementById('tre-name'); if(n) n.focus(); },30);
}

function saveTrainerEdit(id,afterSaveClientId){
  var g=function(k){ var e=document.getElementById(k); return e?String(e.value||'').trim():''; };
  var name=g('tre-name');
  if(!name){ showErrorToast('Χρειάζεται ονοματεπώνυμο.'); var n=document.getElementById('tre-name'); if(n) n.focus(); return; }
  var list=getTrainers(), t=id?list.filter(function(x){return x.id===id;})[0]:null;
  if(!t){ t={id:'tr_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),createdAt:new Date().toISOString()}; list.push(t); }
  t.name=name; t.kind=g('tre-kind')==='coach'?'coach':'trainer'; t.lang=g('tre-lang')==='en'?'en':'el';
  t.place=g('tre-place'); t.phone=g('tre-phone'); t.email=g('tre-email'); t.specialty=g('tre-spec'); t.notes=g('tre-notes');
  t.updatedAt=new Date().toISOString();
  saveTrainers(list);
  var ov=document.getElementById('tr-edit-ov'); if(ov) ov.remove();
  showSuccessToast('✅ Αποθηκεύτηκε: '+name);
  if(afterSaveClientId){
    var c=(window.clients||[]).filter(function(x){return x.id===afterSaveClientId;})[0];
    if(c){ setClientTrainer(c,t.id,true); _trRefreshClientCard(); }
    return;
  }
  if(curTab===11) renderTrainers();
}

function deleteTrainer(id){
  var t=getTrainer(id); if(!t) return;
  var cl=trainerClients(id);
  if(!confirm('Διαγραφή του/της «'+t.name+'»;'+(cl.length?'\n\nΘα αποσυνδεθεί από '+cl.length+' πελάτη/ες και οι σύνδεσμοι αναφοράς τους θα σταματήσουν να ανοίγουν.':''))) return;
  cl.forEach(function(c){ trainerRevokeLink(c); c.trainerId=null; c.trainerConsent=false; c.trainerConsentAt=null; c.trainerReferred=false; });
  if(t.hubToken) _trDeleteRow(t.hubToken);   // ο προσωπικός του σύνδεσμος σταματά να ανοίγει
  saveTrainers(getTrainers().filter(function(x){return x.id!==id;}));
  _trOpenId=null;
  showSuccessToast('🗑 Διαγράφηκε.');
  renderTrainers();
}

// ═══════════════════════════════════════════════════════════════════════════════════
// Στον πελάτη: κάρτα «🏋️ Γυμναστής / Προπονητής» (Στοιχεία, δίπλα σε ερωτηματολόγιο/ημερολόγιο)
// ═══════════════════════════════════════════════════════════════════════════════════
function setClientTrainer(c,tid,silent){
  if(!c) return;
  if((c.trainerId||null)===(tid||null)) return;
  var oldTid=c.trainerId||null;
  trainerRevokeLink(c);                    // ο προηγούμενος γυμναστής δεν βλέπει πια τίποτα
  c.trainerId=tid||null;
  if(oldTid) trainerHubRefresh(oldTid);    // …ούτε στον προσωπικό του σύνδεσμο
  c.trainerConsent=false; c.trainerConsentAt=null;
  c.trainerReferred=false;
  c.trainerSince=tid?new Date().toISOString().slice(0,10):null;
  if(typeof save==='function') save();
  if(!silent && tid) showSuccessToast('✅ Συνδέθηκε με '+((getTrainer(tid)||{}).name||'γυμναστή'));
}
function setClientTrainerConsent(on){
  var c=getC(); if(!c||!c.trainerId) return;
  if(on){ c.trainerConsent=true; c.trainerConsentAt=new Date().toISOString(); c.trainerConsentRevokedAt=null; }
  else {
    if(c.trainerToken && !confirm('Ανάκληση συναίνεσης;\n\nΟ σύνδεσμος που έχει ήδη ο γυμναστής θα σταματήσει να ανοίγει.')){ _trRefreshClientCard(); return; }
    trainerRevokeLink(c); c.trainerConsent=false; c.trainerConsentRevokedAt=new Date().toISOString();
    trainerHubRefresh(c.trainerId);
  }
  if(typeof save==='function') save();
  _trRefreshClientCard();
}
function setClientTrainerReferred(on){ var c=getC(); if(!c) return; c.trainerReferred=!!on; if(typeof save==='function') save(); }
function onClientTrainerSelect(v){
  var c=getC(); if(!c) return;
  if(v==='__new'){ openTrainerEdit(null,c.id); _trRefreshClientCard(); return; }
  if(c.trainerId && v!==c.trainerId && c.trainerToken && !confirm('Αλλαγή γυμναστή;\n\nΟ σύνδεσμος του προηγούμενου θα σταματήσει να ανοίγει.')){ _trRefreshClientCard(); return; }
  setClientTrainer(c,v||null);
  _trRefreshClientCard();
}
function _trRefreshClientCard(){
  var el=document.getElementById('sec-trainer'), c=getC();
  if(el&&c){ var w=document.createElement('div'); w.innerHTML=buildTrainerCardHtml(c); el.replaceWith(w.firstChild); }
}

function buildTrainerCardHtml(c){
  if(!c) return '';
  var list=getTrainers().slice().sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''),'el');});
  var t=c.trainerId?getTrainer(c.trainerId):null;
  var opts='<option value="">— Κανένας —</option>'+list.map(function(x){return '<option value="'+esc(x.id)+'"'+(t&&x.id===t.id?' selected':'')+'>'+esc(x.name)+(x.place?' · '+esc(x.place):'')+'</option>';}).join('')+'<option value="__new">＋ Νέος γυμναστής…</option>';
  var body;
  if(!t){
    body='<div style="font-size:12.5px;color:var(--tr-sub);margin-bottom:8px">Ποιος τον/την γυμνάζει; Με τη συναίνεσή του/της, θα στέλνεις στον γυμναστή αναφορά μετά από κάθε μέτρηση.</div>'
      +'<select onchange="onClientTrainerSelect(this.value)" style="width:100%">'+opts+'</select>';
  } else {
    var st=trainerSendStatus(c), s=_trLastSend(c);
    var line=!c.trainerConsent?'Χωρίς συναίνεση — δεν στέλνεται τίποτα'
      :(st==='none'?'Δεν υπάρχει ακόμα μέτρηση':(st==='sent'?'Στάλθηκε η τελευταία μέτρηση ('+_trDateShort(s.at)+')':'Νέα μέτρηση, δεν έχει σταλεί'));
    var dot=!c.trainerConsent?'#9fb5b0':(st==='pending'?'#e08a00':(st==='sent'?'#2e7d32':'#9fb5b0'));
    body='<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">'
      +'<div style="width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-weight:700;background:var(--tr-av-bg);color:var(--tr-av-fg);flex:none">'+esc(_trInitials(t.name))+'</div>'
      +'<div style="min-width:0;flex:1"><a href="javascript:void(0)" onclick="openTrainerProfile(\''+escJsAttr(t.id)+'\')" style="font-weight:700;color:var(--tr-head)">'+esc(t.name)+'</a>'
      +'<div style="font-size:12px;color:var(--tr-sub)">'+esc(TRAINER_KIND_LABEL[t.kind]||'Γυμναστής')+(t.place?' · '+esc(t.place):'')+'</div></div></div>'
      +'<label style="display:flex;gap:8px;align-items:flex-start;font-size:13px;cursor:pointer;margin-bottom:4px"><input type="checkbox" style="margin-top:2px" '+(c.trainerConsent?'checked ':'')+'onchange="setClientTrainerConsent(this.checked)">'
      +'<span>Ο/Η πελάτης συμφωνεί να λαμβάνει αναφορές ο '+(t.kind==='coach'?'προπονητής':'γυμναστής')+(c.trainerConsent&&c.trainerConsentAt?' <span style="color:var(--tr-sub)">(από '+_trDateShort(c.trainerConsentAt)+')</span>':'')+'</span></label>'
      +'<label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer;margin-bottom:8px"><input type="checkbox" '+(c.trainerReferred?'checked ':'')+'onchange="setClientTrainerReferred(this.checked)"><span>🤝 Ήρθε από σύσταση του/της</span></label>'
      +'<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--tr-sub);margin-bottom:10px"><span style="width:8px;height:8px;border-radius:50%;background:'+dot+';flex:none"></span>'+esc(line)+'</div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
      +(c.trainerConsent&&st!=='none'?'<button class="btn" style="background:#025857;color:#fff;border:1px solid #025857;font-size:12px" onclick="openTrainerSend()">📤 Αποστολή αναφοράς</button>':'')
      +'<select onchange="onClientTrainerSelect(this.value)" style="font-size:12px;max-width:180px" aria-label="Αλλαγή γυμναστή">'+opts.replace(' selected','')+'</select>'
      +'</div>';
    body=body.replace('<option value="">— Κανένας —</option>','<option value="" disabled selected>Αλλαγή…</option><option value="">✕ Αφαίρεση</option>');
  }
  return '<div class="section-card" id="sec-trainer" style="margin-top:12px">'
    +'<div class="section-header" style="cursor:default"><div><span class="section-icon">🏋️</span>Γυμναστής / Προπονητής</div></div>'
    +'<div style="padding:2px 2px 4px">'+body+'</div></div>';
}

// Κουμπί στην κορυφή των Μετρήσεων (tracker.js) — μόνο αν υπάρχει γυμναστής
function trainerTrackerButtonHtml(c){
  if(!c||!c.trainerId) return '';
  var t=getTrainer(c.trainerId); if(!t) return '';
  var st=trainerSendStatus(c); if(st==='none') return '';
  var first=String(t.name||'').split(/\s+/)[0];
  if(!c.trainerConsent) return '<button class="btn secondary" title="Ο πελάτης δεν έχει δώσει ακόμα συναίνεση — άνοιξε για να την καταγράψεις" onclick="openTrainerSend()">🏋️ Στον '+esc(first)+'</button>';
  if(st==='pending') return '<button class="btn" style="background:var(--tr-warn-bg);color:var(--tr-warn-fg);border:1px solid var(--tr-warn-bd);font-weight:700" title="Νέα μέτρηση που δεν έχει σταλεί στον γυμναστή" onclick="openTrainerSend()">📤 Στείλε στον '+esc(first)+'</button>';
  return '<button class="btn secondary" title="Η τελευταία μέτρηση έχει ήδη σταλεί — ξαναστείλε αν θέλεις" onclick="openTrainerSend()">🏋️ Στον '+esc(first)+' ✓</button>';
}

// ═══════════════════════════════════════════════════════════════════════════════════
// Snapshot για gymnastis.html — ΜΟΝΟ ό,τι επιλέχθηκε· ποτέ ιατρικά/σημειώσεις/πλάνο
// ═══════════════════════════════════════════════════════════════════════════════════
var TRAINER_SF_EN={abdomen:'Abdomen',suprailiac:'Suprailiac',tricep:'Triceps',thigh:'Thigh',chest:'Chest',midaxillary:'Midaxillary',subscapular:'Subscapular',calf:'Calf'};
var TRAINER_PROTO_EN={jp4:'Jackson & Pollock 4-site',jp3:'Jackson & Pollock 3-site',jp7:'Jackson & Pollock 7-site',slaughter:'Slaughter (1988)'};

function _trPhaseKey(g){
  if(g==='loss') return 'deficit';
  if(g==='mild') return 'mild';
  if(g==='gain') return 'surplus';
  if(g==='football'||g==='running') return 'sport';
  if(g==='maintain'||g==='mediterranean') return 'maintain';
  return 'custom';
}

function buildTrainerSnapshot(c,o){
  o=o||{};
  var t=getTrainer(c.trainerId)||{};
  var lang=o.lang==='en'?'en':'el';
  var log=(c.weightLog||[]).filter(function(e){return e&&e.weight>0;}).slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
  if(!log.length) return null;
  var n=Math.max(1,Math.min(o.history||6,12));
  var meas=log.slice(-n).map(function(e){
    var bf=e.bf>0?+(+e.bf).toFixed(1):null;
    return {d:e.date,w:+(+e.weight).toFixed(1),bf:bf,fm:bf!=null?+(e.weight*bf/100).toFixed(1):null,lbm:bf!=null?+(e.weight*(1-bf/100)).toFixed(1):null};
  });
  var last=log[log.length-1];
  var snap={v:1,kind:'trainer',lang:lang,
    client:{name:c.name||'',sex:c.sex==='F'?'F':'M',age:(c.age>0?c.age:null)},
    trainer:{name:t.name||'',kind:t.kind==='coach'?'coach':'trainer'},
    from:TRAINER_SIGNATURE[lang],
    sentAt:new Date().toISOString(),
    meas:meas,
    note:String(o.note||'').trim().slice(0,1200),
    wa:(window.Cloud&&window.Cloud.CLINIC&&window.Cloud.CLINIC.wa)||''};
  if(o.sf && last.sfFields && last.sfProtocol){
    var defs=skinfoldSiteDefs(last.sfProtocol,c.sex||'M').defs;
    var prev=log.slice(0,-1).filter(function(e){return e.sfProtocol===last.sfProtocol&&e.sfFields;}).slice(-1)[0];
    snap.sf={proto:lang==='en'?(TRAINER_PROTO_EN[last.sfProtocol]||last.sfProtocol):(QM_PROTO_LABEL[last.sfProtocol]||last.sfProtocol),
      prevDate:prev?prev.date:null,
      sites:defs.map(function(f){
        var mm=last.sfFields[f.k]; if(!(mm>0)) return null;
        return {lbl:lang==='en'?(TRAINER_SF_EN[f.k]||f.k):f.lbl.replace(/^\d+\.\s*/,'').replace(/\s*mm$/,''),mm:+mm,prev:(prev&&prev.sfFields&&prev.sfFields[f.k]>0)?+prev.sfFields[f.k]:null};
      }).filter(Boolean)};
  }
  if(o.phase){
    try{
      var td=calcTDEE(c);
      if(td&&!td.incomplete){
        var eff=makeDayTgtDefaults(c,td), k=0, p=0;
        for(var i=0;i<7;i++){ k+=(eff[i].k||0); p+=(eff[i].p||0); }
        k=Math.round(k/7); p=Math.round(p/7);
        var w=last.weight||c.weight||0;
        snap.phase={key:_trPhaseKey(c.goalMain),kcal:k,protG:p,protGkg:w>0?+(p/w).toFixed(1):null};
      }
    }catch(e){ console.warn('[trainer] phase',e); }
  }
  return snap;
}

function publishTrainerLink(c,snap){
  var C=window.Cloud;
  if(!C||!C.enabled||!C.user) return Promise.reject(new Error('Πρέπει να είσαι συνδεδεμένος στο cloud για να στείλεις σύνδεσμο.'));
  return C.sb.auth.getSession().then(function(res){
    var session=(res&&res.data)?res.data.session:null;
    if(!session||!session.user){ C.user=null; if(C._showLogin) C._showLogin(); throw new Error('Η σύνδεσή σου στο cloud έχει λήξει. Συνδέσου ξανά και ξαναπροσπάθησε.'); }
    C.user=session.user;
    var doWrite=function(tok,isRetry){
      var expiresAt=new Date(Date.now()+TRAINER_LINK_DAYS*86400000).toISOString();
      var row={token:tok,dietitian_id:session.user.id,snapshot:snap,client_name:c.name||'',updated_at:new Date().toISOString(),expires_at:expiresAt};
      return C.sb.from('shared_plans').upsert(row,{onConflict:'token'}).then(function(r2){
        if(r2.error){
          if(/row-level security/i.test(r2.error.message||'')&&!isRetry){ var nt=genSecureToken(); c.trainerToken=nt; return doWrite(nt,true); }
          throw new Error('Απέτυχε η δημιουργία του συνδέσμου. Δοκίμασε ξανά.'+(r2.error.message?' ['+r2.error.message+']':''));
        }
        return {url:TRAINER_BASE+'?t='+tok,expiresAt:expiresAt};
      });
    };
    var tok=c.trainerToken; if(!tok){ tok=genSecureToken(); c.trainerToken=tok; }
    return doWrite(tok,false);
  });
}

// ═══════════════════════════════════════════════════════════════════════════════════
// Παράθυρο «📤 Αναφορά για <γυμναστή>»
// ═══════════════════════════════════════════════════════════════════════════════════
var TRAINER_NOTE_CHIPS={
  el:['Καλή πρόοδος, συνεχίζουμε έτσι.','Δώσε έμφαση στην ανάκαμψη αυτές τις μέρες.','Αλλάζουμε στόχο, θα σου πω λεπτομέρειες.','Αν δεις πτώση απόδοσης, ενημέρωσέ με.'],
  en:['Good progress, we keep going.','Please focus on recovery these days.','We are changing the goal, I will share details.','If you notice a drop in performance, let me know.']
};
var _trSendClientId=null;

function openTrainerSend(clientId){
  var c=clientId?(window.clients||[]).filter(function(x){return x.id===clientId;})[0]:getC();
  if(!c) return;
  var t=c.trainerId?getTrainer(c.trainerId):null;
  if(!t){ showErrorToast('Δεν έχει οριστεί γυμναστής γι\' αυτόν τον πελάτη (Στοιχεία → «🏋️ Γυμναστής»).'); return; }
  var last=_trLastMeas(c);
  if(!last){ showErrorToast('Δεν υπάρχει ακόμα μέτρηση για να σταλεί.'); return; }
  _trSendClientId=c.id;
  var lang=t.lang==='en'?'en':'el';
  var log=(c.weightLog||[]).filter(function(e){return e&&e.weight>0;});
  var hasSf=!!(last.sfFields&&last.sfProtocol);
  var chk=function(id,on,title,sub,dis){ return '<label style="display:flex;gap:9px;align-items:flex-start;padding:6px 0;cursor:'+(dis?'default':'pointer')+(dis?';opacity:.55':'')+'"><input type="checkbox" id="'+id+'"'+(on?' checked':'')+(dis?' disabled':'')+' style="margin-top:3px"><div><div style="font-weight:600;font-size:13.5px">'+title+'</div><div style="font-size:12px;color:var(--tr-sub)">'+sub+'</div></div></label>'; };
  _trOverlay('tr-send-ov',
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:4px"><span style="font-size:24px">📤</span><div style="font-size:18px;font-weight:700;color:var(--tr-head)">Αναφορά για '+esc(t.name)+'</div></div>'
    +'<div style="font-size:13px;color:var(--tr-sub);margin-bottom:12px"><b>'+esc(c.name||'')+'</b> · μέτρηση '+_trDateShort(last.date+'T12:00:00')+(log.length>1?' · '+log.length+' μετρήσεις συνολικά':'')+'</div>'
    +'<div style="font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--tr-sub)">Τι περιλαμβάνει</div>'
    +chk('trs-comp',true,'Σύσταση σώματος','Ονοματεπώνυμο πελάτη, βάρος, % λίπος, μάζα λίπους, άλιπη μάζα',true)
    +chk('trs-hist',log.length>1,'Πορεία τελευταίων μετρήσεων','Γράφημα και αλλαγές από μέτρηση σε μέτρηση (έως 6)',log.length<2)
    +chk('trs-phase',true,'Διατροφική φάση και στόχοι','Φάση (έλλειμμα/διατήρηση/…), ~θερμίδες, πρωτεΐνη g/kg')
    +chk('trs-sf',false,'Δερματοπτυχές ανά σημείο',hasSf?'mm ανά σημείο και αλλαγή από την προηγούμενη':'Η τελευταία μέτρηση δεν έχει δερματοπτυχές',!hasSf)
    +'<div style="display:flex;gap:9px;padding:6px 0;opacity:.55"><span>🔒</span><div style="font-size:12.5px">Ιατρικό ιστορικό, εξετάσεις, προσωπικές σημειώσεις και πλάνο γευμάτων <b>δεν μοιράζονται ποτέ</b>.</div></div>'
    +'<div style="display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;margin-top:8px">'
    +'<div style="font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--tr-sub)">Σημείωμα προς '+(t.kind==='coach'?'προπονητή':'γυμναστή')+' (προαιρετικό)</div>'
    +'<select id="trs-lang" onchange="_trRenderChips()" style="font-size:12px"><option value="el"'+(lang==='el'?' selected':'')+'>🇬🇷 Ελληνικά</option><option value="en"'+(lang==='en'?' selected':'')+'>🇬🇧 English</option></select>'
    +'</div>'
    +'<textarea id="trs-note" rows="3" style="width:100%;margin-top:6px;font:inherit;font-size:13px;padding:8px;border-radius:8px" placeholder="π.χ. Καλή πρόοδος, ανεβάζουμε λίγο τους υδατάνθρακες τις μέρες με πόδια."></textarea>'
    +'<div id="trs-chips" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"></div>'
    +(c.trainerConsent
      ?'<div style="font-size:12.5px;color:#2e7d32;margin-top:12px">✓ Συναίνεση πελάτη από '+_trDateShort(c.trainerConsentAt)+'</div>'
      :'<label style="display:flex;gap:9px;align-items:flex-start;margin-top:12px;padding:10px;border-radius:10px;background:var(--tr-warn-bg);cursor:pointer"><input type="checkbox" id="trs-consent" style="margin-top:3px"><span style="font-size:13px"><b>Ο/Η '+esc(String(c.name||'').split(' ')[0])+' συμφωνεί σήμερα</b> να σταλεί η αναφορά στον/στην '+esc(t.name)+'. <span style="color:var(--tr-warn-fg)">(Καταγράφεται με ημερομηνία· ανακαλείται από τα Στοιχεία.)</span></span></label>')
    +'<div id="trs-result" style="margin-top:14px"><button class="btn" style="width:100%;background:#025857;color:#fff;border:1px solid #025857;padding:11px" onclick="createTrainerLink()">🔗 Δημιουργία αναφοράς</button></div>'
    +'<div style="text-align:right;margin-top:12px">'+_trCloseBtn('tr-send-ov')+'</div>',520);
  _trRenderChips();
}

function _trRenderChips(){
  var box=document.getElementById('trs-chips'); if(!box) return;
  var lang=(document.getElementById('trs-lang')||{}).value==='en'?'en':'el';
  box.innerHTML=TRAINER_NOTE_CHIPS[lang].map(function(s,i){ return '<button type="button" class="btn" style="font-size:11.5px;padding:3px 9px;border-radius:999px" onclick="_trAddChip('+i+')">+ '+esc(s)+'</button>'; }).join('');
}
function _trAddChip(i){
  var lang=(document.getElementById('trs-lang')||{}).value==='en'?'en':'el';
  var ta=document.getElementById('trs-note'); if(!ta) return;
  var s=TRAINER_NOTE_CHIPS[lang][i]; if(!s) return;
  ta.value=(ta.value.trim()?ta.value.trim()+' ':'')+s; ta.focus();
}

function _trVoc(n){ return (typeof greekVocative==='function')?greekVocative(n):n; }
function _trWaMessage(c,t,url,lang){
  var cf=String(c.name||'').trim(), tf=String(t.name||'').split(/\s+/)[0];
  if(lang!=='en') tf=_trVoc(tf);
  if(lang==='en') return 'Hi '+tf+', '+cf+' had a body composition assessment at Feed Your Health. Here is the report, shared with their consent:\n'+url+'\n\n'+TRAINER_SIGNATURE.en;
  return 'Γεια σου '+tf+', ο/η '+cf+' έκανε μέτρηση σύστασης σώματος στο Feed Your Health. Η αναφορά, με τη συναίνεσή του/της:\n'+url+'\n\n'+TRAINER_SIGNATURE.el;
}

function createTrainerLink(){
  var c=(window.clients||[]).filter(function(x){return x.id===_trSendClientId;})[0]; if(!c) return;
  var t=getTrainer(c.trainerId); if(!t) return;
  if(!c.trainerConsent){
    var cb=document.getElementById('trs-consent');
    if(!cb||!cb.checked){ showErrorToast('Χρειάζεται η συναίνεση του πελάτη πριν σταλεί οτιδήποτε.'); if(cb&&cb.parentNode){ cb.parentNode.style.outline='2px solid #e57373'; setTimeout(function(){cb.parentNode.style.outline='';},1500);} return; }
    c.trainerConsent=true; c.trainerConsentAt=new Date().toISOString(); c.trainerConsentRevokedAt=null;
  }
  var v=function(id){ var e=document.getElementById(id); return !!(e&&e.checked&&!e.disabled); };
  var lang=(document.getElementById('trs-lang')||{}).value==='en'?'en':'el';
  var snap=buildTrainerSnapshot(c,{lang:lang,history:v('trs-hist')?6:1,phase:v('trs-phase'),sf:v('trs-sf'),note:(document.getElementById('trs-note')||{}).value||''});
  if(!snap){ showErrorToast('Δεν υπάρχει μέτρηση για αποστολή.'); return; }
  var box=document.getElementById('trs-result');
  if(box) box.innerHTML='<div style="text-align:center;color:var(--tr-sub);font-size:13px;padding:10px">Δημιουργία συνδέσμου…</div>';
  publishTrainerLink(c,snap).then(function(res){
    var last=_trLastMeas(c);
    if(!c.trainerSends) c.trainerSends=[];
    c.trainerSends.push({at:new Date().toISOString(),measDate:last?last.date:null,trainerId:t.id,lang:lang});
    if(c.trainerSends.length>40) c.trainerSends=c.trainerSends.slice(-40);
    if(typeof save==='function') save();
    trainerHubRefresh(t.id);
    var phone=(typeof normalizePhoneIntl==='function')?normalizePhoneIntl(t.phone):'';
    var msg=_trWaMessage(c,t,res.url,lang);
    if(t.hubToken) msg+=(lang==='en'?'\n\nAll our shared clients: ':'\n\nΌλοι οι κοινοί μας πελάτες: ')+TRAINER_BASE+'?h='+t.hubToken;
    var subj=lang==='en'?'Body composition report: '+(c.name||''):'Αναφορά μέτρησης: '+(c.name||'');
    if(!box) return;
    box.innerHTML='<div style="font-size:13px;color:#2e7d32;font-weight:600;margin-bottom:8px">✅ Η αναφορά είναι έτοιμη (ισχύει '+TRAINER_LINK_DAYS+' ημέρες).</div>'
      +(phone?'<a href="https://wa.me/'+esc(phone)+'?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#25D366;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:8px">💬 Στείλε στο WhatsApp ('+esc(t.phone)+')</a>'
        :'<div style="font-size:12px;color:var(--tr-warn-fg);margin-bottom:8px">Δεν υπάρχει τηλέφωνο για τον/την '+esc(t.name)+' — πρόσθεσέ το στην καρτέλα Γυμναστές.</div>')
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">'
      +(t.email?'<a class="btn" style="text-decoration:none;text-align:center" href="mailto:'+esc(t.email)+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(msg)+'">✉️ Email</a>':'<button class="btn" disabled title="Λείπει email">✉️ Email</button>')
      +'<button class="btn" onclick="_trCopy(this)" data-msg="'+esc(msg)+'">📋 Αντιγραφή</button>'
      +'<a class="btn" style="text-decoration:none;text-align:center" href="'+esc(res.url)+'" target="_blank" rel="noopener">👁 Άνοιγμα / PDF</a>'
      +'</div>';
    _trAfterSendRefresh();
  }).catch(function(err){
    if(box) box.innerHTML='<div style="color:var(--tr-bad-fg);font-size:13px;margin-bottom:8px">'+esc(err&&err.message||'Σφάλμα')+'</div><button class="btn" style="width:100%" onclick="createTrainerLink()">↻ Δοκίμασε ξανά</button>';
  });
}
function _trCopy(btn){
  var m=btn.getAttribute('data-msg')||'';
  var ok=function(){ btn.textContent='✓ Αντιγράφηκε'; setTimeout(function(){btn.textContent='📋 Αντιγραφή';},1500); };
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(m).then(ok,function(){ prompt('Αντέγραψε:',m); });
  else prompt('Αντέγραψε:',m);
}
function _trAfterSendRefresh(){
  _trRefreshClientCard();
  if(curTab===3){ var c=getC(), el=document.getElementById('s3'); if(c&&el&&typeof buildTrackerHtml==='function') el.innerHTML=buildTrackerHtml(c); }
  if(curTab===11 && _trOpenId){ var m=document.getElementById('main'), t=getTrainer(_trOpenId); if(m&&t) m.innerHTML=_trProfileHtml(t); }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// 🔗 Προσωπικός σύνδεσμος γυμναστή (φάση 2 · βήμα 1, 2026-11-23)
//   Ένα μόνιμο link (gymnastis.html?h=<t.hubToken>) με όλους τους κοινούς πελάτες που έχουν δώσει
//   συναίνεση ΚΑΙ έχουν ενεργή αναφορά. Ίδιο shared_plans, snapshot.kind==='trainer_hub' — χωρίς SQL.
//   Ξαναδημοσιεύεται μόνο του σε κάθε αποστολή / ανάκληση / αλλαγή γυμναστή. Περιέχει μόνο όνομα,
//   ημερομηνία και % λίπους ανά πελάτη + το token της αναφοράς του (η αναφορά έχει το υπόλοιπο).
// ═══════════════════════════════════════════════════════════════════════════════════
var TRAINER_HUB_DAYS=180;

function buildTrainerHubSnapshot(t){
  var lang=t.lang==='en'?'en':'el';
  var list=trainerClients(t.id).filter(function(c){ return c.trainerConsent && c.trainerToken; }).map(function(c){
    var s=(c.trainerSends||[]).filter(function(x){return x.trainerId===t.id;}).slice(-1)[0]||null;
    var log=(c.weightLog||[]).filter(function(e){return e&&e.weight>0;}).slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
    var md=s&&s.measDate, i=-1;
    for(var k=log.length-1;k>=0;k--){ if(!md||log[k].date<=md){ i=k; break; } }
    var m=i>=0?log[i]:null, pv=i>0?log[i-1]:null;
    return {name:c.name||'', token:c.trainerToken, sentAt:s?s.at:null, measDate:m?m.date:null,
      bf:(m&&m.bf>0)?+(+m.bf).toFixed(1):null,
      dBf:(m&&pv&&m.bf>0&&pv.bf>0)?Math.round((m.bf-pv.bf)*10)/10:null,
      w:m?+(+m.weight).toFixed(1):null};
  }).sort(function(a,b){ return String(b.sentAt||'').localeCompare(String(a.sentAt||'')); });
  return {v:1,kind:'trainer_hub',lang:lang,
    trainer:{name:t.name||'',kind:t.kind==='coach'?'coach':'trainer',
      greet:(function(f){ return lang==='en'?f:_trVoc(f); })(String(t.name||'').split(/\s+/)[0])},
    from:TRAINER_SIGNATURE[lang], updatedAt:new Date().toISOString(),
    wa:(window.Cloud&&window.Cloud.CLINIC&&window.Cloud.CLINIC.wa)||'',
    clients:list};
}

function publishTrainerHub(t){
  var C=window.Cloud;
  if(!C||!C.enabled||!C.user||!C.sb) return Promise.reject(new Error('Πρέπει να είσαι συνδεδεμένος στο cloud.'));
  if(!t.hubToken){ t.hubToken=genSecureToken(); t.hubCreatedAt=new Date().toISOString(); _trSaveOne(t); }
  var tok=t.hubToken;
  var row={token:tok,dietitian_id:C.user.id,snapshot:buildTrainerHubSnapshot(t),client_name:'🏋️ '+(t.name||''),
    updated_at:new Date().toISOString(),expires_at:new Date(Date.now()+TRAINER_HUB_DAYS*86400000).toISOString()};
  return C.sb.from('shared_plans').upsert(row,{onConflict:'token'}).then(function(r){
    if(r.error) throw new Error('Απέτυχε η ενημέρωση του συνδέσμου.'+(r.error.message?' ['+r.error.message+']':''));
    t.hubUpdatedAt=row.updated_at; _trSaveOne(t);
    return {url:TRAINER_BASE+'?h='+tok};
  });
}
function _trSaveOne(t){
  var list=getTrainers(), i=list.findIndex(function(x){return x.id===t.id;});
  if(i<0) return;
  list[i]=t;
  if(typeof safeStorageSet==='function') safeStorageSet('fyh_trainers',list);
  if(typeof save==='function') save();
}
// Σιωπηλή ανανέωση — μόνο αν ο γυμναστής έχει ήδη προσωπικό σύνδεσμο.
function trainerHubRefresh(tid){
  var t=tid&&getTrainer(tid);
  if(!t||!t.hubToken) return;
  var C=window.Cloud; if(!C||!C.enabled||!C.user) return;
  publishTrainerHub(t).catch(function(e){ console.warn('[trainer] hub refresh',e); });
}

function _trHubCardHtml(t){
  var n=trainerClients(t.id).filter(function(c){return c.trainerConsent&&c.trainerToken;}).length;
  var id=escJsAttr(t.id);
  var head='<div style="margin-top:14px;padding:12px;border:1px solid var(--border-light);border-radius:12px;background:var(--panel-bg)">'
    +'<div style="font-weight:700;color:var(--tr-head);margin-bottom:4px">🔗 Ο προσωπικός του σύνδεσμος</div>';
  if(!t.hubToken){
    return head+'<div style="font-size:12.5px;color:var(--tr-sub);margin-bottom:8px">Ένα link που κρατάει στο κινητό του, με όλους τους κοινούς πελάτες (μόνο όσους έχουν δώσει συναίνεση). Ενημερώνεται μόνο του σε κάθε αναφορά.</div>'
      +'<button class="btn primary" style="font-size:12.5px" onclick="createTrainerHub(\''+id+'\')">🔗 Δημιουργία συνδέσμου</button></div>';
  }
  return head+'<div style="font-size:12.5px;color:var(--tr-sub);margin-bottom:8px">Ενεργός · '+n+' πελάτ'+(n===1?'ης':'ες')+' μέσα · ενημερώθηκε '+_trDateShort(t.hubUpdatedAt||t.hubCreatedAt)+'</div>'
    +'<div id="tr-hub-act" style="display:flex;gap:6px;flex-wrap:wrap">'
    +'<button class="btn" style="font-size:12.5px;background:#25D366;color:#fff;border-color:#25D366" onclick="sendTrainerHub(\''+id+'\',\'wa\')">💬 Στείλε στο WhatsApp</button>'
    +'<button class="btn" style="font-size:12.5px" onclick="sendTrainerHub(\''+id+'\',\'copy\')">📋 Αντιγραφή</button>'
    +'<a class="btn" style="font-size:12.5px;text-decoration:none" target="_blank" rel="noopener" href="'+esc(TRAINER_BASE+'?h='+t.hubToken)+'">👁 Άνοιγμα</a>'
    +'<button class="btn" style="font-size:12.5px" title="Αν τον έχασε ή τον προώθησε κάπου: ο παλιός σταματά να ανοίγει" onclick="rotateTrainerHub(\''+id+'\')">🔄 Νέος σύνδεσμος</button>'
    +'</div></div>';
}

function _trHubMessage(t){
  var url=TRAINER_BASE+'?h='+t.hubToken, f=String(t.name||'').split(/\s+/)[0];
  if(t.lang!=='en') f=_trVoc(f);
  if(t.lang==='en') return 'Hi '+f+', this is your personal page with all our shared clients at Feed Your Health (only those who gave consent). Every new assessment report appears there automatically. Save it on your phone:\n'+url+'\n\n'+TRAINER_SIGNATURE.en;
  return 'Γεια σου '+f+', αυτή είναι η προσωπική σου σελίδα με όλους τους κοινούς μας πελάτες στο Feed Your Health (μόνο όσους έχουν δώσει συναίνεση). Κάθε νέα αναφορά μέτρησης εμφανίζεται εκεί αυτόματα. Κράτησέ τη στο κινητό σου:\n'+url+'\n\n'+TRAINER_SIGNATURE.el;
}
function createTrainerHub(tid){
  var t=getTrainer(tid); if(!t) return;
  publishTrainerHub(t).then(function(){
    showSuccessToast('✅ Ο σύνδεσμος του/της '+t.name+' είναι έτοιμος');
    _trAfterSendRefresh();
  }).catch(function(e){ showErrorToast(e.message||'Σφάλμα'); });
}
function sendTrainerHub(tid,how){
  var t=getTrainer(tid); if(!t||!t.hubToken) return;
  // πάντα φρέσκο πριν το στείλεις
  publishTrainerHub(t).then(function(){
    var msg=_trHubMessage(t);
    if(how==='wa'){
      var phone=(typeof normalizePhoneIntl==='function')?normalizePhoneIntl(t.phone):'';
      if(!phone){ showErrorToast('Λείπει τηλέφωνο για τον/την '+t.name+' (✏️ Επεξεργασία).'); return; }
      window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');
    } else {
      var ok=function(){ showSuccessToast('📋 Αντιγράφηκε'); };
      if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(msg).then(ok,function(){ prompt('Αντέγραψε:',msg); });
      else prompt('Αντέγραψε:',msg);
    }
  }).catch(function(e){ showErrorToast(e.message||'Σφάλμα'); });
}
function rotateTrainerHub(tid){
  var t=getTrainer(tid); if(!t||!t.hubToken) return;
  if(!confirm('Νέος σύνδεσμος για '+t.name+';\n\nΟ παλιός θα σταματήσει να ανοίγει και θα πρέπει να του στείλεις τον καινούργιο.')) return;
  _trDeleteRow(t.hubToken);
  t.hubToken=null;
  publishTrainerHub(t).then(function(){
    showSuccessToast('🔄 Νέος σύνδεσμος — στείλ\' τον στον/στην '+t.name);
    _trAfterSendRefresh();
  }).catch(function(e){ showErrorToast(e.message||'Σφάλμα'); });
}

// js/client-editor/intake.js
// Upgrades Phase 2 — the intake questionnaire, dietitian side.
// A card in the client editor's "Στοιχεία πελάτη" tab (s1, see render-main.js) +
// the send modal (WhatsApp / Gmail / copy link), mirroring publish-modal.js.
// The client-facing form is the standalone intake.html; the cloud plumbing
// (sendIntake / fetchIntakeStatus, table client_intake) lives in window.Cloud
// (Dietologist.html). Greek + English only. Loads right after render-main.js.

// ── message text (WhatsApp / email), el + en only ──────────────────────────
var INTAKE_MSG_DICTS={
  el:{
    msg:function(fn,url){ return 'Γεια σου '+fn+'! Πριν ετοιμάσω το πλάνο σου, συμπλήρωσε αυτό το σύντομο ερωτηματολόγιο (3–4 λεπτά): '+url; },
    subj:'Ερωτηματολόγιο εισαγωγής — Feed Your Health',
    body:function(fn,url){ return 'Γεια σου '+fn+'!\n\nΠριν ετοιμάσω το διατροφικό σου πλάνο, θα ήθελα μερικές πληροφορίες. Συμπλήρωσε αυτό το σύντομο ερωτηματολόγιο από το κινητό σου — παίρνει 3–4 λεπτά:\n\n'+url+'\n\nΜπορείς να σταματήσεις και να συνεχίσεις αργότερα από τον ίδιο σύνδεσμο.\n\nΜε εκτίμηση,\nFeed Your Health'; }
  },
  en:{
    msg:function(fn,url){ return 'Hi '+fn+'! Before I build your plan, please fill in this short questionnaire (3–4 min): '+url; },
    subj:'Intake questionnaire — Feed Your Health',
    body:function(fn,url){ return 'Hi '+fn+'!\n\nBefore I build your nutrition plan I need a few details. Please fill in this short questionnaire from your phone — it takes 3–4 minutes:\n\n'+url+'\n\nYou can stop and continue later from the same link.\n\nBest,\nFeed Your Health'; }
  }
};
function intakeLangFor(c){ return (c && (c.intakeLang==='en' || (!c.intakeLang && c.lang==='en'))) ? 'en' : 'el'; }
function intakeHandoffMsg(c,url,lang){
  var d=INTAKE_MSG_DICTS[lang]||INTAKE_MSG_DICTS.el;
  var fn=(c.name||'').split(' ')[0]||'';
  return { msg:d.msg(fn,url), subj:d.subj, ebody:d.body(fn,url) };
}

// ── status card (rendered inside renderMain / s1) ──────────────────────────
function intakeDateShort(iso){
  if(!iso) return '';
  var d=new Date(iso); if(isNaN(d)) return '';
  return d.toLocaleDateString('el-GR',{day:'numeric',month:'short'});
}
function buildIntakeCardHtml(c){
  if(!c) return '';
  var hasCloud=!!(window.Cloud && window.Cloud.enabled);
  var st=c.intakeToken ? (c.intakeStatus||'sent') : 'none';
  var dot, line, actions;

  if(st==='submitted'){
    dot='#2e7d32';
    line='Συμπληρώθηκε '+intakeDateShort(c.intakeSubmittedAt||c.intakeSentAt);
    actions='<button class="btn" style="background:var(--card-bg);color:#014545;border:1px solid #c5ddd8;font-size:12px" onclick="openIntakeModal()">🔄 Νέα αποστολή</button>'
      +'<button class="btn" style="background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8;font-size:12px" onclick="refreshIntakeCard(this)" title="Επαναφόρτωση απαντήσεων">↻ Ανανέωση</button>';
  } else if(st==='sent'){
    dot='#e08a00';
    line='Στάλθηκε '+intakeDateShort(c.intakeSentAt)+' · εκκρεμεί';
    actions='<button class="btn" style="background:var(--card-bg);color:#014545;border:1px solid #c5ddd8;font-size:12px" onclick="openIntakeModal()">Άνοιγμα / αντιγραφή</button>'
      +'<button class="btn" style="background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8;font-size:12px" onclick="refreshIntakeCard(this)" title="Έλεγχος αν συμπληρώθηκε">↻ Ανανέωση</button>';
  } else if(st==='superseded'){
    dot='#9fb5b0';
    line='Ο προηγούμενος σύνδεσμος αντικαταστάθηκε';
    actions='<button class="btn" style="background:#025857;color:#fff;border:1px solid #025857;font-size:12px" onclick="openIntakeModal()">📋 Νέα αποστολή</button>';
  } else {
    dot='#9fb5b0';
    line='Δεν έχει σταλεί';
    actions='<button class="btn" style="background:#025857;color:#fff;border:1px solid #025857;font-size:12px" onclick="openIntakeModal()">📋 Αποστολή ερωτηματολογίου</button>';
  }

  return '<div class="section-card" id="sec-intake" style="margin-top:12px">'
    +'<div class="section-header" style="cursor:default"><div><span class="section-icon">📋</span>Ερωτηματολόγιο εισαγωγής</div></div>'
    +'<div style="padding:2px 2px 4px">'
    +(hasCloud?'':'<div style="font-size:11px;color:#e08a00;margin-bottom:8px">Χρειάζεται σύνδεση στο cloud για να στείλεις ερωτηματολόγιο.</div>')
    +'<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#5a8a82;font-family:ui-monospace,Menlo,monospace;margin-bottom:10px">'
      +'<span style="width:8px;height:8px;border-radius:50%;background:'+dot+';flex:none"></span>'+esc(line)+'</div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap">'+actions+'</div>'
    +(st==='submitted'?buildIntakeReadbackHtml(c):'')
    +'</div></div>';
}

// ── read-back panel (Upgrades Phase 2b) ───────────────────────────────────
// Shows the client's submitted answers inside the card, grouped, plus a "τι
// διαφέρει από την καρτέλα" strip and a copy-summary button. The full payload
// is NOT stored on the client blob — it lives in a runtime-only cache keyed by
// token (see ensureIntakePayload), re-fetched once per session.
var INTAKE_PAYLOAD_CACHE = {};
try{ window.INTAKE_PAYLOAD_CACHE = INTAKE_PAYLOAD_CACHE; }catch(e){}

var INTAKE_LBL={
  goal:{weight_loss:'Απώλεια βάρους',muscle_gain:'Μυϊκή μάζα',maintenance:'Συντήρηση',health:'Βελτίωση υγείας',other:'Άλλο'},
  cond:{diabetes:'Διαβήτης',hypertension:'Υπέρταση',hypothyroid:'Υποθυρεοειδισμός',cholesterol:'Χοληστερίνη',ibs:'Ευερέθιστο έντερο',none:'Κανένα από τα παραπάνω'},
  allergy:{milk:'Γάλα / λακτόζη',egg:'Αυγό',nuts:'Ξηροί καρποί',fish:'Ψάρι & θαλασσινά',gluten:'Σιτάρι / γλουτένη',soy:'Σόγια',legumes:'Όσπρια'},
  avoid:{red_meat:'Κόκκινο κρέας',pork:'Χοιρινό',fish:'Ψάρι',dairy:'Γαλακτοκομικά',vegetarian:'Χορτοφαγία',vegan:'Vegan',none:'Κανένα'},
  breakfast:{yes:'Ναι',sometimes:'Μερικές μέρες',no:'Όχι'},
  cooking:{home:'Κυρίως σπίτι',mixed:'Μισό-μισό',out:'Κυρίως έξω'}
};
function intakeMap(dict,keys){
  if(!keys || !keys.length) return '';
  return keys.map(function(k){ return (INTAKE_LBL[dict] && INTAKE_LBL[dict][k]) || k; }).join(', ');
}
function intakeNum(v){ var x=parseFloat(v); return isNaN(x)?null:x; }

// runtime cache accessor + fetcher — called from selectClient (state.js) and refreshIntakeCard
function ensureIntakePayload(c){
  if(!c || !c.intakeToken || c.intakeStatus!=='submitted') return Promise.resolve(null);
  if(Object.prototype.hasOwnProperty.call(INTAKE_PAYLOAD_CACHE, c.intakeToken))
    return Promise.resolve(INTAKE_PAYLOAD_CACHE[c.intakeToken]);
  if(!window.Cloud || typeof window.Cloud.fetchIntakePayload!=='function') return Promise.resolve(null);
  return window.Cloud.fetchIntakePayload(c).then(function(p){
    INTAKE_PAYLOAD_CACHE[c.intakeToken] = p || null;
    return INTAKE_PAYLOAD_CACHE[c.intakeToken];
  }).catch(function(){ return null; });
}

// "τι διαφέρει από την καρτέλα" — profile mismatches + safety-relevant new info.
function intakeDiffRows(c,p){
  var rows=[], prof=(p && p.profile) || {};
  var pb=prof.birthDate||'', cb=c.birthDate||'';
  if(pb && pb!==cb) rows.push(['Ημ. γέννησης', cb||'—', pb]);
  var ph=intakeNum(prof.heightCm), ch=intakeNum(c.height);
  if(ph!=null && ph!==ch) rows.push(['Ύψος', (ch!=null?ch+' εκ.':'—'), ph+' εκ.']);
  var pw=intakeNum(prof.weightKg), cw=intakeNum(c.weight);
  if(pw!=null && (cw==null || Math.abs(pw-cw)>=0.5)) rows.push(['Βάρος', (cw!=null?cw+' κιλά':'—'), pw+' κιλά']);
  var pn=(prof.name||'').trim(), cn=(c.name||'').trim();
  if(pn && pn!==cn) rows.push(['Όνομα', cn||'—', pn]);
  if(p && p.pregnancyBreastfeeding && !c.pregnant)
    rows.push(['Εγκυμοσύνη / θηλασμός', 'Όχι (καρτέλα)', 'ΝΑΙ (ερωτηματολόγιο)']);
  return rows;
}

function intakeReadRow(label,val){
  if(val==null || val==='') return '';
  return '<div style="display:flex;gap:8px;padding:3px 0;font-size:12px;line-height:1.45">'
    +'<span style="color:#9fb5b0;flex:0 0 128px">'+esc(label)+'</span>'
    +'<span style="color:#014545;flex:1;min-width:0">'+esc(val)+'</span></div>';
}

function buildIntakeReadbackHtml(c){
  if(!c || !c.intakeToken || c.intakeStatus!=='submitted') return '';
  var cache=(window.INTAKE_PAYLOAD_CACHE||{});
  var p = Object.prototype.hasOwnProperty.call(cache,c.intakeToken) ? cache[c.intakeToken] : undefined;
  if(p===undefined)
    return '<div style="font-size:11.5px;color:#9fb5b0;margin-top:12px">Φόρτωση απαντήσεων…</div>';
  if(p===null)
    return '<div style="font-size:11.5px;color:#c0392b;margin-top:12px">Δεν φορτώθηκαν οι απαντήσεις — πάτα «↻ Ανανέωση».</div>';

  var prof=p.profile||{}, hab=p.habits||{};
  var goalTxt=(INTAKE_LBL.goal[p.goal]||p.goal||'—')+(p.goal==='other'&&p.goalOther?(' — '+p.goalOther):'');
  var conds=(p.conditions||[]).filter(function(k){return k!=='none';});
  var allerg=(p.allergies||[]).slice();
  var allergTxt=intakeMap('allergy',allerg)+((p.allergiesOther?((allerg.length?', ':'')+p.allergiesOther):''));
  var avoid=(p.avoid||[]).filter(function(k){return k!=='none';});

  var diff=intakeDiffRows(c,p);
  var diffHtml='';
  if(diff.length){
    diffHtml='<div style="margin:10px 0 4px;padding:8px 10px;border:1px solid #f0d8a8;background:#fff9ec;border-radius:8px">'
      +'<div style="font-size:11px;font-weight:700;color:#a15c00;margin-bottom:4px">🔺 Διαφορετικό από την καρτέλα</div>'
      +diff.map(function(r){
        return '<div style="font-size:12px;color:#7a5a1e;line-height:1.5"><b>'+esc(r[0])+':</b> '+esc(r[1])+' → <b>'+esc(r[2])+'</b></div>';
      }).join('')
      +'</div>';
  }

  var body=''
    +intakeReadRow('Στόχος', goalTxt)
    +intakeReadRow('Παθήσεις', conds.length?intakeMap('cond',conds):'—')
    +intakeReadRow('Εγκυμοσύνη/θηλ.', p.pregnancyBreastfeeding?'Ναι':'Όχι')
    +intakeReadRow('Φάρμακα / συμπλ.', p.meds||'—')
    +intakeReadRow('Αλλεργίες', allergTxt||'—')
    +intakeReadRow('Αποφεύγει', avoid.length?intakeMap('avoid',avoid):'—')
    +intakeReadRow('Γεύματα/μέρα', hab.mealsPerDay!=null?String(hab.mealsPerDay):'')
    +intakeReadRow('Πρωινό', INTAKE_LBL.breakfast[hab.breakfast]||'')
    +intakeReadRow('Μαγείρεμα', INTAKE_LBL.cooking[hab.cooking]||'')
    +intakeReadRow('Πεινάει πιο πολύ', hab.hungerTime)
    +intakeReadRow('Νερό', hab.water)
    +intakeReadRow('Ύπνος', hab.sleep)
    +intakeReadRow('Άσκηση', hab.exercise)
    +intakeReadRow('Προτιμά', p.likes)
    +intakeReadRow('Δεν του αρέσουν', p.dislikes)
    +intakeReadRow('Σχόλιο', p.note);

  return '<details open style="margin-top:12px;border-top:1px solid #e4efec;padding-top:8px">'
    +'<summary style="cursor:pointer;font-size:12px;font-weight:700;color:#025857;list-style:none">📄 Απαντήσεις πελάτη</summary>'
    +diffHtml
    +'<div style="margin-top:6px">'+body+'</div>'
    +'<button type="button" class="btn" style="width:100%;margin-top:10px;background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8;font-size:11.5px" onclick="copyIntakeSummary(this)">📋 Αντιγραφή σύνοψης (για επικόλληση στις σημειώσεις)</button>'
    +'</details>';
}

// ↻ / re-check the DB, pull the payload if it flipped to submitted, re-render.
function copyIntakeSummary(btn){
  var c=getC(); if(!c) return;
  var p=(window.INTAKE_PAYLOAD_CACHE||{})[c.intakeToken];
  if(!p){ showErrorToast('Οι απαντήσεις δεν έχουν φορτωθεί ακόμα.'); return; }
  var prof=p.profile||{}, hab=p.habits||{};
  var conds=(p.conditions||[]).filter(function(k){return k!=='none';});
  var avoid=(p.avoid||[]).filter(function(k){return k!=='none';});
  var allerg=(p.allergies||[]).slice();
  var allergTxt=intakeMap('allergy',allerg)+((p.allergiesOther?((allerg.length?', ':'')+p.allergiesOther):''));
  var when=intakeDateShort(c.intakeSubmittedAt||c.intakeSentAt);
  var L=[];
  L.push('— Ερωτηματολόγιο εισαγωγής'+(when?(' ('+when+')'):'')+' —');
  L.push('Στόχος: '+((INTAKE_LBL.goal[p.goal]||p.goal||'—'))+(p.goal==='other'&&p.goalOther?(' — '+p.goalOther):''));
  if(conds.length) L.push('Παθήσεις: '+intakeMap('cond',conds));
  if(p.pregnancyBreastfeeding) L.push('Εγκυμοσύνη/θηλασμός: ΝΑΙ');
  if(p.meds) L.push('Φάρμακα/συμπληρώματα: '+p.meds);
  if(allergTxt) L.push('Αλλεργίες: '+allergTxt);
  if(avoid.length) L.push('Αποφεύγει: '+intakeMap('avoid',avoid));
  var h=[];
  if(hab.mealsPerDay!=null) h.push(hab.mealsPerDay+' γεύματα/μέρα');
  if(hab.breakfast) h.push('πρωινό: '+(INTAKE_LBL.breakfast[hab.breakfast]||hab.breakfast));
  if(hab.cooking) h.push('μαγείρεμα: '+(INTAKE_LBL.cooking[hab.cooking]||hab.cooking));
  if(hab.hungerTime) h.push('πεινάει: '+hab.hungerTime);
  if(hab.water) h.push('νερό: '+hab.water);
  if(hab.sleep) h.push('ύπνος: '+hab.sleep);
  if(hab.exercise) h.push('άσκηση: '+hab.exercise);
  if(h.length) L.push('Συνήθειες: '+h.join(' · '));
  if(p.likes) L.push('Προτιμά: '+p.likes);
  if(p.dislikes) L.push('Δεν του αρέσουν: '+p.dislikes);
  if(p.note) L.push('Σχόλιο: '+p.note);
  var txt=L.join('\n');
  var ta=document.createElement('textarea');
  ta.value=txt; ta.style.cssText='position:fixed;left:-9999px;top:-9999px';
  document.body.appendChild(ta); ta.select();
  var ok=false; try{ ok=document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(txt).then(function(){},function(){}); ok=true; }
  ta.remove();
  if(ok && btn){ var o=btn.textContent; btn.textContent='✓ Αντιγράφηκε — επικόλλησέ το όπου θες'; setTimeout(function(){btn.textContent=o;},2200); }
}

// ↻ button — re-check the DB, (re)load the submitted payload, re-render.
// On the "submitted" card this also force-refreshes the answers (busts the cache).
function refreshIntakeCard(btn){
  var c=getC(); if(!c || !c.intakeToken || !window.Cloud || !window.Cloud.fetchIntakeStatus) return;
  var o=btn?btn.textContent:'';
  if(btn){ btn.disabled=true; btn.textContent='↻ …'; }
  try{ if(window.INTAKE_PAYLOAD_CACHE) delete window.INTAKE_PAYLOAD_CACHE[c.intakeToken]; }catch(e){}
  var done=function(changed){
    if(changed && typeof renderMain==='function') renderMain();
    else if(btn){ btn.disabled=false; btn.textContent=o; }
  };
  window.Cloud.fetchIntakeStatus(c).then(function(changed){
    if(c.intakeStatus==='submitted' && typeof ensureIntakePayload==='function'){
      ensureIntakePayload(c).then(function(){ done(true); }).catch(function(){ done(changed); });
    } else { done(changed); }
  }).catch(function(){ if(btn){ btn.disabled=false; btn.textContent=o; } });
}

// ── send modal ────────────────────────────────────────────────────────────
function openIntakeModal(){
  var c=getC();
  if(!c){ showErrorToast('Διάλεξε πρώτα πελάτη.'); return; }
  if(!window.Cloud || !window.Cloud.enabled || !window.Cloud.user){
    showErrorToast('Πρέπει να είσαι συνδεδεμένος στο cloud για να στείλεις ερωτηματολόγιο.\n(Κάνε αποσύνδεση και ξανασυνδέσου με email/κωδικό.)');
    return;
  }
  var ov=document.getElementById('intake-overlay');
  if(ov) ov.remove();
  ov=document.createElement('div');
  ov.id='intake-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML='<div id="intake-modal" style="background:var(--card-bg);border-radius:16px;max-width:420px;width:100%;padding:22px;box-shadow:0 10px 40px rgba(0,0,0,.25);max-height:92vh;overflow:auto">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:24px">📋</span><div style="font-size:18px;font-weight:700;color:#014545">Αποστολή ερωτηματολογίου</div></div>'
    +'<div style="font-size:13px;color:#5a8a82;margin-bottom:16px">Για τον/την <b>'+esc(c.name||'πελάτη')+'</b>. Ανοίγει στο κινητό — 3–4 λεπτά, μία υποβολή, μετά κλειδώνει.</div>'
    +'<div id="intake-body"></div>'
    +'<div style="text-align:right;margin-top:14px"><button class="btn" onclick="document.getElementById(\'intake-overlay\').remove()">Κλείσιμο</button></div>'
    +'</div>';
  document.body.appendChild(ov);

  var active = c.intakeToken && c.intakeStatus!=='superseded';
  if(active) renderIntakeLinkView(c);
  else renderIntakeCreateView(c);
}

// step 1 — pick language, create the link
function renderIntakeCreateView(c){
  var body=document.getElementById('intake-body'); if(!body) return;
  var lg=intakeLangFor(c);
  body.innerHTML='<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">Γλώσσα ερωτηματολογίου</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:14px" id="intake-lang">'
      +'<button type="button" data-l="el" class="btn" style="flex:1;'+(lg==='el'?'background:#025857;color:#fff;border:1px solid #025857':'background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8')+'">Ελληνικά</button>'
      +'<button type="button" data-l="en" class="btn" style="flex:1;'+(lg==='en'?'background:#025857;color:#fff;border:1px solid #025857':'background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8')+'">English</button>'
    +'</div>'
    +'<button id="intake-create-btn" class="btn primary" style="width:100%">Δημιουργία συνδέσμου</button>'
    +'<div id="intake-create-err" style="color:#c0392b;font-size:12px;margin-top:8px;display:none"></div>';
  var chosen={l:lg};
  body.querySelectorAll('#intake-lang button').forEach(function(b){
    b.onclick=function(){
      chosen.l=b.dataset.l;
      body.querySelectorAll('#intake-lang button').forEach(function(x){
        var on=x.dataset.l===chosen.l;
        x.style.cssText='flex:1;'+(on?'background:#025857;color:#fff;border:1px solid #025857':'background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8');
      });
    };
  });
  document.getElementById('intake-create-btn').onclick=function(){
    var btn=this; btn.disabled=true; btn.textContent='Δημιουργία…';
    window.Cloud.sendIntake(c,chosen.l).then(function(){
      if(typeof renderMain==='function') renderMain();
      renderIntakeLinkView(c);
    }).catch(function(e){
      btn.disabled=false; btn.textContent='Δημιουργία συνδέσμου';
      var er=document.getElementById('intake-create-err');
      if(er){ er.textContent='❌ '+(e.message||'Σφάλμα'); er.style.display='block'; }
    });
  };
}

// step 2 — the link + send channels
function renderIntakeLinkView(c){
  var body=document.getElementById('intake-body'); if(!body) return;
  var url=window.Cloud.INTAKE_BASE+'?t='+c.intakeToken;
  var lg=intakeLangFor(c);
  var hm=intakeHandoffMsg(c,url,lg);
  var phone=(typeof normalizePhoneIntl==='function')?normalizePhoneIntl(c.phone):'';
  var wa='https://wa.me/'+(phone||'')+'?text='+encodeURIComponent(hm.msg);
  var gmail='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(c.email||'')+'&su='+encodeURIComponent(hm.subj)+'&body='+encodeURIComponent(hm.ebody);
  var mailto='mailto:'+encodeURIComponent(c.email||'')+'?subject='+encodeURIComponent(hm.subj)+'&body='+encodeURIComponent(hm.ebody);
  var submittedNote = (c.intakeStatus==='submitted')
    ? '<div style="font-size:11.5px;color:#2e7d32;margin:0 0 10px">✓ Ο πελάτης έχει ήδη υποβάλει αυτό το ερωτηματολόγιο. Νέα αποστολή θα δημιουργήσει νέο, κενό.</div>' : '';

  body.innerHTML=submittedNote
    +'<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">Σύνδεσμος πελάτη <span style="color:#9fb5b0">('+(lg==='en'?'English':'Ελληνικά')+')</span></div>'
    +'<div style="display:flex;gap:6px;margin-bottom:12px">'
      +'<input id="intake-url" value="'+esc(url)+'" readonly style="flex:1;font-size:12px;padding:9px 10px;border:1px solid #c5ddd8;border-radius:8px;background:#f4f8f6;color:#014545" onclick="this.select()">'
      +'<button class="btn" style="background:#025857;color:#fff;border:1px solid #025857;white-space:nowrap" onclick="copyIntakeUrl(this)">Αντιγραφή</button>'
    +'</div>'
    +'<a href="'+esc(wa)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#25D366;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:4px">📱 WhatsApp'+(phone?' ('+esc(c.phone)+')':'')+'</a>'
    +(phone?'':'<div style="font-size:11px;color:#e08a00;margin:0 0 8px;line-height:1.4">⚠️ Δεν έχεις βάλει τηλέφωνο στην καρτέλα — δεν θα ανοίξει συνομιλία με συγκεκριμένο παραλήπτη.</div>')
    +'<a href="'+esc(gmail)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#c2483a;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:4px">✉️ Gmail στον browser</a>'
    +'<a href="'+esc(mailto)+'" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#025857;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:4px">📧 Πρόγραμμα Email'+(c.email?(' ('+esc(c.email)+')'):'')+'</a>'
    +(c.email?'':'<div style="font-size:11px;color:#e08a00;margin:0 0 6px;line-height:1.4">⚠️ Δεν έχεις βάλει email στην καρτέλα.</div>')
    +'<textarea id="intake-msg" style="position:absolute;left:-9999px;top:-9999px" readonly>'+esc(hm.msg)+'</textarea>'
    +'<button type="button" class="btn" style="width:100%;background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8;font-size:11.5px;margin-bottom:10px" onclick="copyIntakeMsg(this)">📋 Δεν άνοιξε κανένα; Αντιγραφή μηνύματος</button>'
    +'<div style="font-size:11px;color:#9fb5b0;line-height:1.5;margin-bottom:12px">Ο σύνδεσμος <b>δεν λήγει</b>. Κλειδώνει μόλις τον υποβάλει ο πελάτης — μία φορά.</div>'
    +'<button id="intake-new-btn" class="btn" style="width:100%;background:var(--card-bg);color:#c0392b;border:1px solid #f0c2c2;font-size:12px">🔄 Νέος σύνδεσμος</button>'
    +'<div style="font-size:11px;color:#9fb5b0;line-height:1.4;margin-top:4px">Ο τρέχων σύνδεσμος παύει να δουλεύει· χρήσιμο για αλλαγή γλώσσας ή αν θες ο πελάτης να το ξανασυμπληρώσει.</div>';

  document.getElementById('intake-new-btn').onclick=function(){
    var dlg=document.getElementById('confirmDialog');
    var origZ=dlg?dlg.style.zIndex:'';
    if(dlg) dlg.style.zIndex='100001';
    var restore=function(){ if(dlg) dlg.style.zIndex=origZ; };
    var q = (c.intakeStatus==='submitted')
      ? 'Ο πελάτης έχει ήδη υποβάλει. Θα δημιουργηθεί ΝΕΟΣ, κενός σύνδεσμος και ο παλιός θα πάψει να ισχύει. Συνέχεια;'
      : 'Θα δημιουργηθεί ΝΕΟΣ σύνδεσμος και ο τρέχων θα πάψει να δουλεύει αμέσως. Ό,τι έχει ήδη γράψει ο πελάτης (χωρίς υποβολή) θα χαθεί. Συνέχεια;';
    showConfirmDialog(q, function(){
      restore();
      var b=document.getElementById('intake-new-btn');
      if(b){ b.disabled=true; b.textContent='Γίνεται…'; }
      window.Cloud.sendIntake(c,intakeLangFor(c)).then(function(){
        if(typeof renderMain==='function') renderMain();
        showSuccessToast('Δημιουργήθηκε νέος σύνδεσμος.');
        renderIntakeLinkView(c);
      }).catch(function(e){
        if(b){ b.disabled=false; b.textContent='🔄 Νέος σύνδεσμος'; }
        showErrorToast('Σφάλμα: '+(e.message||''));
      });
    }, {confirmLabel:'Νέος σύνδεσμος', icon:'🔄'});
    var cancelBtn=dlg && dlg.querySelector('button[onclick="closeConfirmDialog()"]');
    if(cancelBtn) cancelBtn.addEventListener('click', restore, {once:true});
  };
}

function copyIntakeUrl(btn){
  var inp=document.getElementById('intake-url'); if(!inp) return;
  inp.select();
  var ok=false; try{ ok=document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(inp.value).then(function(){},function(){}); ok=true; }
  if(ok && btn){ var o=btn.textContent; btn.textContent='✓ Αντιγράφηκε'; setTimeout(function(){btn.textContent=o;},1500); }
}
function copyIntakeMsg(btn){
  var ta=document.getElementById('intake-msg'); if(!ta) return;
  ta.select();
  var ok=false; try{ ok=document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(ta.value).then(function(){},function(){}); ok=true; }
  if(ok && btn){ var o=btn.textContent; btn.textContent='✓ Αντιγράφηκε — επικόλλησέ το στον πελάτη'; setTimeout(function(){btn.textContent=o;},2200); }
}

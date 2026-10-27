// js/client-editor/food-diary.js
// 📒 Ημερολόγιο φαγητού, dietitian side.
// A card next to «📋 Ερωτηματολόγιο εισαγωγής» in the client editor's s1 (render-main.js),
// the send modal (WhatsApp / Gmail / copy link, like intake.js) and the viewer: a
// week-by-week table of what the client wrote, with per-meal comments (👍/⚠️/❓ + text,
// shown to the client under the meal) and private per-week notes.
// The client page is the standalone imerologio.html; cloud plumbing (sendFoodDiary /
// fetchFoodDiary / saveFoodDiaryField / endFoodDiary, table food_diary) lives in
// window.Cloud (js/app-part7.js). 4 weeks from the send date. Greek + English only.

var FD_SLOTS=[['breakfast','Πρωινό'],['snack1','Δεκατιανό'],['lunch','Μεσημεριανό'],['snack2','Απογευματινό'],['dinner','Βραδινό'],['extra','Κάτι άλλο']];
var FD_DAYS=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
var FD_FEEL=['😣','😐','😊'];
// Reactions: one click, stored as the emoji in comments[...].r; imerologio.html shows the label
// in the client's language when no text is written (keep its rLabel map in step with this list).
var FD_REACT=[['👍','Μπράβο'],['💪','Πολύ καλή επιλογή'],['⚠️','Να το δούμε'],['🤦','Έλεος'],['❓','Πόσο περίπου;']];
// Ready-made advice: one click writes the phrase into the comment box, in the diary's language
// (c.diaryLang), so it stays editable and an English client reads it in English.
var FD_TIPS=[
  ['🥩','Πρωτεΐνη',     {el:'Πρόσθεσε λίγη πρωτεΐνη εδώ.',             en:'Add some protein here.'}],
  ['🥗','Λαχανικά',     {el:'Πρόσθεσε λαχανικά ή σαλάτα.',             en:'Add some vegetables or a salad.'}],
  ['🍞','Μικρότερη μερίδα',{el:'Λίγο μικρότερη μερίδα την επόμενη φορά.', en:'A slightly smaller portion next time.'}],
  ['⏰','Μην το παραλείπεις',{el:'Προσπάθησε να μην το παραλείπεις.',    en:'Try not to skip this meal.'}],
  ['💧','Νερό',         {el:'Μην ξεχνάς το νερό.',                     en:'Don’t forget your water.'}],
  ['🔄','Αντί γι\' αυτό…',{el:'Δοκίμασε αντί γι\' αυτό: ',              en:'Try this instead: '}]
];

// ── dates as 'YYYY-MM-DD' strings (same helpers as imerologio.html) ──────────
function foodDiaryTodayStr(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function fdUTC(s){ var p=String(s).slice(0,10).split('-'); return Date.UTC(+p[0],+p[1]-1,+p[2]); }
function fdAdd(s,n){ return new Date(fdUTC(s)+n*86400000).toISOString().slice(0,10); }
function fdDiff(a,b){ return Math.round((fdUTC(a)-fdUTC(b))/86400000); }
function fdDow(s){ return (new Date(fdUTC(s)).getUTCDay()+6)%7; }
function fdDM(s){ return s?(s.slice(8,10)+'/'+s.slice(5,7)):''; }
function fdEnd(c){ return fdAdd(c.diaryStart, (c.diaryWeeks||4)*7-1); }
function fdDayFilled(day){
  if(!day) return false;
  if(day.feel!=null) return true;
  var m=day.meals||{};
  return Object.keys(m).some(function(k){ return m[k] && String(m[k]).trim(); });
}

// Shown state: 'none' | 'active' | 'ended' (incl. an active row past its 4 weeks)
function foodDiaryState(c){
  if(!c || !c.diaryToken) return 'none';
  if(c.diaryStatus==='superseded') return 'none';
  if(c.diaryStatus==='ended') return 'ended';
  if(c.diaryStart && foodDiaryTodayStr()>fdEnd(c)) return 'ended';
  return 'active';
}

// Short summary on the client blob (counts only, never the texts). Returns true if it changed.
function foodDiaryApplySummary(c,row){
  if(!c || !row) return false;
  var before=foodDiarySig(c);
  c.diaryStatus=row.status||c.diaryStatus;
  if(row.start_date) c.diaryStart=String(row.start_date).slice(0,10);
  if(row.weeks) c.diaryWeeks=row.weeks;
  c.diaryLastEntryAt=row.last_entry_at||null;
  var weeks=c.diaryWeeks||4, wd=[], total=0, ent=row.entries||{};
  for(var w=0;w<weeks;w++) wd.push(0);
  Object.keys(ent).forEach(function(k){
    if(!c.diaryStart || !fdDayFilled(ent[k])) return;
    var i=Math.floor(fdDiff(k,c.diaryStart)/7);
    if(i>=0 && i<weeks){ wd[i]++; total++; }
  });
  c.diaryWeekDays=wd; c.diaryDays=total;
  return foodDiarySig(c)!==before;
}
function foodDiarySig(c){ return [c.diaryStatus,c.diaryLastEntryAt||'',(c.diaryWeekDays||[]).join(',')].join('|'); }
function foodDiaryHasNew(c){ return !!(c && c.diaryLastEntryAt && (!c.diarySeenAt || c.diaryLastEntryAt>c.diarySeenAt)); }

// ── message text (WhatsApp / email), el + en ─────────────────────────────────
var FOOD_DIARY_MSG_DICTS={
  el:{
    msg:function(fn,url,end){ return 'Γεια σου '+fn+'! Για τις επόμενες 4 εβδομάδες (έως '+end+') γράψε εδώ τι τρως κάθε μέρα, με δικά σου λόγια — χωρίς ποσότητες, 1 λεπτό τη μέρα. Θα το βλέπω και θα σου αφήνω σχόλια: '+url; },
    subj:'Ημερολόγιο φαγητού — Feed Your Health',
    body:function(fn,url,end){ return 'Γεια σου '+fn+'!\n\nΓια τις επόμενες 4 εβδομάδες (έως '+end+') θα ήθελα να γράφεις τι τρως κάθε μέρα, με δικά σου λόγια. Δεν χρειάζονται ποσότητες ή θερμίδες — αρκεί 1 λεπτό τη μέρα:\n\n'+url+'\n\nΘα το βλέπω και θα σου αφήνω σχόλια κάτω από τα γεύματα. Κράτα τον σύνδεσμο (π.χ. στην αρχική οθόνη του κινητού).\n\nΜε εκτίμηση,\nFeed Your Health'; }
  },
  en:{
    msg:function(fn,url,end){ return 'Hi '+fn+'! For the next 4 weeks (until '+end+') please write here what you eat each day, in your own words — no amounts, about 1 minute a day. I’ll read it and leave you comments: '+url; },
    subj:'Food diary — Feed Your Health',
    body:function(fn,url,end){ return 'Hi '+fn+'!\n\nFor the next 4 weeks (until '+end+') I’d like you to write down what you eat each day, in your own words. No amounts or calories needed — about 1 minute a day:\n\n'+url+'\n\nI’ll read it and leave comments under your meals. Keep the link handy (e.g. on your phone’s home screen).\n\nBest,\nFeed Your Health'; }
  }
};
function foodDiaryLangFor(c){ return (c && (c.diaryLang==='en' || (!c.diaryLang && c.lang==='en'))) ? 'en' : 'el'; }

// ── status card (rendered inside renderMain / s1, next to the intake card) ──
function fdCardBtn(label,onclick,primary,title){
  return '<button class="btn" style="'+(primary?'background:#025857;color:#fff;border:1px solid #025857':'background:var(--card-bg);color:#014545;border:1px solid #c5ddd8')+';font-size:12px"'
    +(title?' title="'+esc(title)+'"':'')+' onclick="'+onclick+'">'+label+'</button>';
}
function buildFoodDiaryCardHtml(c){
  if(!c) return '';
  var hasCloud=!!(window.Cloud && window.Cloud.enabled);
  var st=foodDiaryState(c);
  var dot, line, actions, extra='';
  if(st==='active'){
    var wk=Math.min((c.diaryWeeks||4), Math.floor(fdDiff(foodDiaryTodayStr(),c.diaryStart)/7)+1);
    dot='#e08a00';
    line='Εβδομάδα '+Math.max(1,wk)+' από '+(c.diaryWeeks||4)+' · λήγει '+fdDM(fdEnd(c));
    extra=fdMiniWeeksHtml(c, wk-1);
    actions=fdCardBtn('👀 Άνοιγμα ημερολογίου','openFoodDiaryViewer()',true)
      +fdCardBtn('📱 Λινκ / αποστολή','openFoodDiaryModal()',false)
      +fdCardBtn('⏹ Τερματισμός','endFoodDiaryConfirm()',false,'Το λινκ μένει μόνο για ανάγνωση');
  } else if(st==='ended'){
    dot='#2e7d32';
    line='Ολοκληρώθηκε · '+(c.diaryDays||0)+'/'+((c.diaryWeeks||4)*7)+' μέρες · '+fdDM(c.diaryStart)+'–'+fdDM(fdEnd(c));
    extra=fdMiniWeeksHtml(c,-1);
    actions=fdCardBtn('👀 Άνοιγμα ημερολογίου','openFoodDiaryViewer()',false)
      +fdCardBtn('📒 Νέα αποστολή','openFoodDiaryModal(true)',true);
  } else {
    dot='#9fb5b0';
    line='Δεν έχει σταλεί';
    actions=fdCardBtn('📒 Αποστολή ημερολογίου','openFoodDiaryModal()',true);
  }
  var isNew=(st!=='none') && foodDiaryHasNew(c);
  return '<div class="section-card" id="sec-food-diary" style="margin-top:12px">'
    +'<div class="section-header" style="cursor:default"><div><span class="section-icon">📒</span>Ημερολόγιο φαγητού'
      +(isNew?' <span style="font-size:11px;font-weight:700;color:#fff;background:#e08a00;border-radius:99px;padding:1px 8px;margin-left:6px;vertical-align:middle">νέα καταγραφή</span>':'')
    +'</div></div>'
    +'<div style="padding:2px 2px 4px">'
    +(hasCloud?'':'<div style="font-size:11px;color:#e08a00;margin-bottom:8px">Χρειάζεται σύνδεση στο cloud για να στείλεις ημερολόγιο.</div>')
    +'<div style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#5a8a82;font-family:ui-monospace,Menlo,monospace;margin-bottom:10px">'
      +'<span style="width:8px;height:8px;border-radius:50%;background:'+dot+';flex:none"></span>'+esc(line)+'</div>'
    +extra
    +'<div style="display:flex;gap:6px;flex-wrap:wrap">'+actions+'</div>'
    +(st==='none'?'<div style="font-size:11px;color:#9fb5b0;margin-top:8px;line-height:1.45">Ο πελάτης γράφει με δικά του λόγια τι έφαγε, για 4 εβδομάδες. Εσύ το βλέπεις ανά εβδομάδα και σχολιάζεις.</div>':'')
    +'</div></div>';
}
function fdMiniWeeksHtml(c,curIdx){
  var wd=c.diaryWeekDays||[], n=c.diaryWeeks||4, today=foodDiaryTodayStr(), h='';
  for(var w=0;w<n;w++){
    var first=fdAdd(c.diaryStart,w*7), fut=first>today, v=wd[w]||0;
    h+='<div style="border:1px solid '+(w===curIdx?'#025857':'#c5ddd8')+';border-radius:8px;padding:5px 7px;font-size:11px;color:#5a8a82;display:flex;flex-direction:column;gap:3px">'
      +'<span>Εβδ '+(w+1)+' · '+fdDM(first)+'</span><b style="color:var(--text-strong);font-variant-numeric:tabular-nums">'+(fut?'—':v+'/7')+'</b>'
      +'<span style="height:4px;border-radius:2px;background:var(--panel-bg);overflow:hidden"><span style="display:block;height:100%;width:'+Math.round(v/7*100)+'%;background:#2e7d32"></span></span></div>';
  }
  return '<div style="display:grid;grid-template-columns:repeat('+n+',1fr);gap:6px;margin-bottom:10px">'+h+'</div>';
}

function endFoodDiaryConfirm(){
  var c=getC(); if(!c || !window.Cloud || !window.Cloud.endFoodDiary) return;
  showConfirmDialog('Τερματισμός ημερολογίου; Ο πελάτης θα μπορεί μόνο να το δει, όχι να γράψει. Ό,τι έχει γράψει μένει.', function(){
    window.Cloud.endFoodDiary(c).then(function(){
      showSuccessToast('Το ημερολόγιο τερματίστηκε.');
      if(typeof renderMain==='function') renderMain();
    }).catch(function(e){ showErrorToast('Σφάλμα: '+(e.message||'')); });
  }, {confirmLabel:'Τερματισμός', icon:'⏹'});
}

// ── send modal ────────────────────────────────────────────────────────────
function openFoodDiaryModal(forceNew){
  var c=getC();
  if(!c){ showErrorToast('Διάλεξε πρώτα πελάτη.'); return; }
  if(!window.Cloud || !window.Cloud.enabled || !window.Cloud.user){
    showErrorToast('Πρέπει να είσαι συνδεδεμένος στο cloud για να στείλεις ημερολόγιο.\n(Κάνε αποσύνδεση και ξανασυνδέσου με email/κωδικό.)');
    return;
  }
  var ov=document.getElementById('fd-send-overlay'); if(ov) ov.remove();
  ov=document.createElement('div');
  ov.id='fd-send-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML='<div style="background:var(--card-bg);border-radius:16px;max-width:420px;width:100%;padding:22px;box-shadow:0 10px 40px rgba(0,0,0,.25);max-height:92vh;overflow:auto">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:24px">📒</span><div style="font-size:18px;font-weight:700;color:#014545">Ημερολόγιο φαγητού</div></div>'
    +'<div style="font-size:13px;color:#5a8a82;margin-bottom:16px">Για τον/την <b>'+esc(c.name||'πελάτη')+'</b>. 4 εβδομάδες από σήμερα· ο πελάτης γράφει με δικά του λόγια τι έφαγε.</div>'
    +'<div id="fd-send-body"></div>'
    +'<div style="text-align:right;margin-top:14px"><button class="btn" onclick="document.getElementById(\'fd-send-overlay\').remove()">Κλείσιμο</button></div>'
    +'</div>';
  document.body.appendChild(ov);
  if(!forceNew && foodDiaryState(c)==='active') fdRenderLinkView(c);
  else fdRenderCreateView(c);
}
function fdLangBtnStyle(on){ return 'flex:1;'+(on?'background:#025857;color:#fff;border:1px solid #025857':'background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8'); }
function fdRenderCreateView(c){
  var body=document.getElementById('fd-send-body'); if(!body) return;
  var chosen={l:foodDiaryLangFor(c)};
  var replacing=foodDiaryState(c)!=='none';
  body.innerHTML='<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">Γλώσσα</div>'
    +'<div style="display:flex;gap:8px;margin-bottom:14px" id="fd-lang">'
      +'<button type="button" data-l="el" class="btn" style="'+fdLangBtnStyle(chosen.l==='el')+'">Ελληνικά</button>'
      +'<button type="button" data-l="en" class="btn" style="'+fdLangBtnStyle(chosen.l==='en')+'">English</button>'
    +'</div>'
    +(replacing?'<div style="font-size:11.5px;color:#a15c00;margin:0 0 10px;line-height:1.45">Το προηγούμενο ημερολόγιο θα πάψει να δέχεται καταγραφές. Θα το βλέπεις ακόμα στο ιστορικό του λινκ του (αποθηκεύεται στη βάση).</div>':'')
    +'<button id="fd-create-btn" class="btn primary" style="width:100%">Δημιουργία συνδέσμου</button>'
    +'<div id="fd-create-err" style="color:#c0392b;font-size:12px;margin-top:8px;display:none"></div>';
  body.querySelectorAll('#fd-lang button').forEach(function(b){
    b.onclick=function(){
      chosen.l=b.dataset.l;
      body.querySelectorAll('#fd-lang button').forEach(function(x){ x.style.cssText=fdLangBtnStyle(x.dataset.l===chosen.l); });
    };
  });
  document.getElementById('fd-create-btn').onclick=function(){
    var btn=this; btn.disabled=true; btn.textContent='Δημιουργία…';
    window.Cloud.sendFoodDiary(c,chosen.l).then(function(){
      if(typeof renderMain==='function') renderMain();
      fdRenderLinkView(c);
    }).catch(function(e){
      btn.disabled=false; btn.textContent='Δημιουργία συνδέσμου';
      var er=document.getElementById('fd-create-err');
      if(er){ er.textContent='❌ '+(e.message||'Σφάλμα'); er.style.display='block'; }
    });
  };
}
function fdRenderLinkView(c){
  var body=document.getElementById('fd-send-body'); if(!body) return;
  var url=window.Cloud.FOOD_DIARY_BASE+'?t='+c.diaryToken;
  var lg=foodDiaryLangFor(c), d=FOOD_DIARY_MSG_DICTS[lg];
  var fn=(c.name||'').split(' ')[0]||'', end=fdDM(fdEnd(c));
  var msg=d.msg(fn,url,end), subj=d.subj, ebody=d.body(fn,url,end);
  var phone=(typeof normalizePhoneIntl==='function')?normalizePhoneIntl(c.phone):'';
  var wa='https://wa.me/'+(phone||'')+'?text='+encodeURIComponent(msg);
  var gmail='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(c.email||'')+'&su='+encodeURIComponent(subj)+'&body='+encodeURIComponent(ebody);
  var mailto='mailto:'+encodeURIComponent(c.email||'').replace(/%40/g,'@')+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(ebody);
  body.innerHTML='<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">Σύνδεσμος πελάτη <span style="color:#9fb5b0">('+(lg==='en'?'English':'Ελληνικά')+' · '+fdDM(c.diaryStart)+'–'+end+')</span></div>'
    +'<div style="display:flex;gap:6px;margin-bottom:12px">'
      +'<input id="fd-url" value="'+esc(url)+'" readonly style="flex:1;font-size:12px;padding:9px 10px;border:1px solid #c5ddd8;border-radius:8px;background:#f4f8f6;color:#014545" onclick="this.select()">'
      +'<button class="btn" style="background:#025857;color:#fff;border:1px solid #025857;white-space:nowrap" onclick="fdCopy(\'fd-url\',this,\'✓ Αντιγράφηκε\')">Αντιγραφή</button>'
    +'</div>'
    +'<a href="'+esc(wa)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#25D366;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:4px">📱 WhatsApp'+(phone?' ('+esc(c.phone)+')':'')+'</a>'
    +(phone?'':'<div style="font-size:11px;color:#e08a00;margin:0 0 8px;line-height:1.4">⚠️ Δεν έχεις βάλει τηλέφωνο στην καρτέλα — δεν θα ανοίξει συνομιλία με συγκεκριμένο παραλήπτη.</div>')
    +'<a href="'+esc(gmail)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#c2483a;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:4px">✉️ Gmail στον browser</a>'
    +'<a href="'+esc(mailto)+'" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#025857;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:4px">📧 Πρόγραμμα Email'+(c.email?(' ('+esc(c.email)+')'):'')+'</a>'
    +'<textarea id="fd-msg" style="position:absolute;left:-9999px;top:-9999px" readonly>'+esc(msg)+'</textarea>'
    +'<button type="button" class="btn" style="width:100%;background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8;font-size:11.5px;margin-bottom:10px" onclick="fdCopy(\'fd-msg\',this,\'✓ Αντιγράφηκε — επικόλλησέ το στον πελάτη\')">📋 Δεν άνοιξε κανένα; Αντιγραφή μηνύματος</button>'
    +'<div style="font-size:11px;color:#9fb5b0;line-height:1.5">Ισχύει 4 εβδομάδες (έως <b>'+end+'</b>), μετά κλειδώνει και μένει μόνο για ανάγνωση.</div>';
}
function fdCopy(id,btn,okTxt){
  var n=document.getElementById(id); if(!n) return;
  n.select();
  var ok=false; try{ ok=document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(n.value).then(function(){},function(){}); ok=true; }
  if(ok && btn){ var o=btn.textContent; btn.textContent=okTxt; setTimeout(function(){btn.textContent=o;},1800); }
}

// ── viewer ────────────────────────────────────────────────────────────────
var FD_VIEW=null;   // {c, row, week, cell, draftR}
function fdInjectCss(){
  if(document.getElementById('fd-css')) return;
  var s=document.createElement('style'); s.id='fd-css';
  s.textContent=''
    +'#fd-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:flex-start;justify-content:center;padding:18px;overflow:auto}'
    +'#fd-box{background:var(--card-bg);color:var(--text-strong);border-radius:14px;max-width:1180px;width:100%;padding:18px;box-shadow:0 10px 40px rgba(0,0,0,.25);display:flex;flex-direction:column;gap:14px}'
    +'.fd-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}'
    +'.fd-pill{font-size:11.5px;padding:3px 10px;border-radius:99px;background:var(--panel-bg);color:var(--text-muted);font-weight:600;font-variant-numeric:tabular-nums}'
    +'.fd-pill.ok{background:var(--success-tint);color:var(--good)}'
    +'.fd-wtabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px}'
    +'.fd-wtab{font:inherit;text-align:left;border:1px solid var(--border-light);background:var(--card-bg);color:var(--text-strong);border-radius:10px;padding:7px 10px;cursor:pointer;display:flex;flex-direction:column;gap:2px}'
    +'.fd-wtab small{font-size:11px;color:var(--text-muted);font-variant-numeric:tabular-nums}'
    +'.fd-wtab.sel{border-color:var(--teal);background:var(--teal-tint)}'
    +'.fd-wtab:disabled{opacity:.45;cursor:default}'
    +'.fd-scroll{overflow-x:auto;border:1px solid var(--border-light);border-radius:10px}'
    +'.fd-tbl{border-collapse:collapse;width:100%;min-width:760px;font-size:12.5px}'
    +'.fd-tbl th,.fd-tbl td{border-bottom:1px solid var(--border-light);border-right:1px solid var(--border-light);padding:7px 8px;text-align:left;vertical-align:top}'
    +'.fd-tbl th{background:var(--panel-bg);font-weight:600;font-size:11.5px;color:var(--text-muted);white-space:nowrap}'
    +'.fd-tbl th.today{color:var(--teal)}'
    +'.fd-tbl td.slot{font-weight:600;color:var(--text-muted);white-space:nowrap;background:var(--panel-bg);font-size:11.5px}'
    +'.fd-tbl td.cell{cursor:pointer;min-width:100px;max-width:150px;white-space:pre-wrap;word-break:break-word}'
    +'.fd-tbl td.cell:hover{background:var(--teal-tint)}'
    +'.fd-tbl td.cell.sel{outline:2px solid var(--teal);outline-offset:-2px}'
    +'.fd-tbl td.cell.empty{color:var(--text-muted);opacity:.55}'
    +'.fd-tbl td.fut{background:var(--panel-bg);opacity:.5}'
    +'.fd-mk{display:inline-block;margin-left:4px;font-size:11px}'
    +'.fd-panel{display:grid;grid-template-columns:1fr 1fr;gap:14px}'
    +'@media (max-width:760px){.fd-panel{grid-template-columns:1fr}}'
    +'.fd-pbox{border:1px solid var(--border-light);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px;min-width:0}'
    +'.fd-lbl{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted);font-weight:700}'
    +'.fd-pbox textarea{width:100%;font:inherit;font-size:13px;border:1px solid var(--border-light);border-radius:8px;padding:8px;background:var(--card-bg);color:var(--text-strong);resize:vertical;min-height:64px;box-sizing:border-box}'
    +'.fd-react{display:flex;gap:6px;flex-wrap:wrap}'
    +'.fd-react button{font:inherit;font-size:12px;border:1px solid var(--border-light);background:var(--card-bg);color:var(--text-strong);border-radius:99px;padding:3px 11px;cursor:pointer}'
    +'.fd-react button.on{border-color:#2b6cb0;background:#e8f1fb;color:#2b6cb0}'
    +'body.dark-mode .fd-react button.on{background:#1d2b3a;color:#8db8e3;border-color:#8db8e3}';
  document.head.appendChild(s);
}
function openFoodDiaryViewer(){
  var c=getC(); if(!c || !c.diaryToken) return;
  if(!window.Cloud || !window.Cloud.enabled || !window.Cloud.user){ showErrorToast('Πρέπει να είσαι συνδεδεμένος στο cloud.'); return; }
  fdInjectCss();
  var ov=document.getElementById('fd-overlay'); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id='fd-overlay';
  ov.onclick=function(e){ if(e.target===ov) closeFoodDiaryViewer(); };
  ov.innerHTML='<div id="fd-box"><div style="padding:30px;text-align:center;color:var(--text-muted)">Φόρτωση ημερολογίου…</div></div>';
  document.body.appendChild(ov);
  window.Cloud.fetchFoodDiary(c).then(function(row){
    if(!row){ document.getElementById('fd-box').innerHTML='<div style="padding:30px;text-align:center">Δεν βρέθηκε το ημερολόγιο στη βάση. <button class="btn" onclick="closeFoodDiaryViewer()">Κλείσιμο</button></div>'; return; }
    row.entries=row.entries||{}; row.comments=row.comments||{}; row.notes=row.notes||{};
    var today=foodDiaryTodayStr();
    var wk=Math.floor(fdDiff(today>fdEnd(c)?fdEnd(c):today, c.diaryStart)/7);
    FD_VIEW={c:c,row:row,week:Math.max(0,Math.min(wk,(c.diaryWeeks||4)-1)),cell:null,draftR:null};
    c.diarySeenAt=new Date().toISOString();
    try{ save(); }catch(e){}
    fdRenderViewer();
  });
}
function closeFoodDiaryViewer(){
  var ov=document.getElementById('fd-overlay'); if(ov) ov.remove();
  fdFlushNotes();
  FD_VIEW=null;
  if(typeof renderMain==='function') renderMain();
}
function fdRenderViewer(){
  var V=FD_VIEW; if(!V) return;
  var c=V.c, row=V.row, n=c.diaryWeeks||4, today=foodDiaryTodayStr();
  var nCm=Object.keys(row.comments).length;
  var tabs='';
  for(var w=0;w<n;w++){
    var first=fdAdd(c.diaryStart,w*7), fut=first>today, cnt=(c.diaryWeekDays||[])[w]||0;
    tabs+='<button type="button" class="fd-wtab'+(w===V.week?' sel':'')+'" data-w="'+w+'"'+(fut?' disabled':'')+'><b>Εβδομάδα '+(w+1)+'</b><small>'+fdDM(first)+' – '+fdDM(fdAdd(first,6))+' · '+(fut?'δεν ξεκίνησε':cnt+'/7 μέρες')+'</small></button>';
  }
  var st=foodDiaryState(c);
  document.getElementById('fd-box').innerHTML=
    '<div class="fd-top"><div><div style="font-size:17px;font-weight:700;color:var(--teal)">📒 '+esc(c.name||'')+' · Ημερολόγιο φαγητού</div>'
      +'<div style="font-size:12px;color:var(--text-muted)">'+fdDM(c.diaryStart)+' – '+fdDM(fdEnd(c))+(st==='ended'?' · ολοκληρώθηκε':'')+'</div></div>'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
        +'<span class="fd-pill ok">'+(c.diaryDays||0)+'/'+(n*7)+' μέρες</span><span class="fd-pill">'+nCm+' σχόλια</span>'
        +'<button class="btn" style="font-size:12px" onclick="fdReload(this)" title="Φέρε ό,τι έγραψε στο μεταξύ">↻ Ανανέωση</button>'
        +'<button class="btn" style="font-size:12px" onclick="closeFoodDiaryViewer()">✕ Κλείσιμο</button>'
      +'</div></div>'
    +'<div class="fd-wtabs" id="fd-wtabs">'+tabs+'</div>'
    +'<div class="fd-scroll"><table class="fd-tbl" id="fd-tbl"></table></div>'
    +'<div class="fd-panel">'
      +'<div class="fd-pbox" id="fd-sel"></div>'
      +'<div class="fd-pbox"><span class="fd-lbl" id="fd-notes-lbl"></span>'
        +'<textarea id="fd-notes" style="min-height:140px" placeholder="π.χ. πρωινό σταθερό, βράδυ τσιμπολόγημα, να βρούμε επιλογές για το γραφείο…"></textarea>'
        +'<span style="font-size:11px;color:var(--text-muted)" id="fd-notes-st">Μόνο για σένα — ο πελάτης δεν τις βλέπει. Αποθηκεύονται αυτόματα.</span></div>'
    +'</div>';
  document.getElementById('fd-wtabs').onclick=function(e){
    var b=e.target.closest('.fd-wtab'); if(!b||b.disabled) return;
    fdFlushNotes(); V.week=+b.dataset.w; V.cell=null; V.draftR=null; fdRenderViewer();
  };
  var nt=document.getElementById('fd-notes');
  nt.value=row.notes[String(V.week)]||'';
  nt.oninput=function(){ row.notes[String(V.week)]=nt.value; fdQueueNotes(); };
  document.getElementById('fd-notes-lbl').textContent='Σημειώσεις εβδομάδας '+(V.week+1)+' (μόνο για σένα)';
  fdRenderTable(); fdRenderSel();
}
function fdRenderTable(){
  var V=FD_VIEW, c=V.c, row=V.row, today=foodDiaryTodayStr();
  var days=[]; for(var i=0;i<7;i++) days.push(fdAdd(c.diaryStart,V.week*7+i));
  var h='<tr><th></th>'+days.map(function(d){ return '<th class="'+(d===today?'today':'')+'">'+FD_DAYS[fdDow(d)]+' '+fdDM(d)+(d===today?' · σήμερα':'')+'</th>'; }).join('')+'</tr>';
  FD_SLOTS.forEach(function(s){
    h+='<tr><td class="slot">'+s[1]+'</td>'+days.map(function(d){
      if(d>today) return '<td class="fut"></td>';
      var m=((row.entries[d]||{}).meals)||{}, v=m[s[0]]||'', id=d+'|'+s[0], cm=row.comments[id];
      return '<td class="cell'+(String(v).trim()?'':' empty')+(V.cell===id?' sel':'')+'" data-c="'+id+'" tabindex="0">'
        +(String(v).trim()?esc(v):'·')+(cm?'<span class="fd-mk">'+esc(cm.r||'💬')+'</span>':'')+'</td>';
    }).join('')+'</tr>';
  });
  h+='<tr><td class="slot">Η μέρα</td>'+days.map(function(d){ var f=(row.entries[d]||{}).feel; return '<td>'+(f!=null&&FD_FEEL[f]?FD_FEEL[f]:'')+'</td>'; }).join('')+'</tr>';
  var t=document.getElementById('fd-tbl'); t.innerHTML=h;
  var pick=function(td){ fdFlushNotes(); V.cell=td.dataset.c; V.draftR=(V.row.comments[V.cell]||{}).r||null; fdRenderTable(); fdRenderSel(); };
  t.onclick=function(e){ var td=e.target.closest('td.cell'); if(td) pick(td); };
  t.onkeydown=function(e){ if((e.key==='Enter'||e.key===' ') && e.target.matches && e.target.matches('td.cell')){ e.preventDefault(); pick(e.target); } };
}
function fdRenderSel(){
  var V=FD_VIEW, box=document.getElementById('fd-sel'); if(!box) return;
  if(!V.cell){
    box.innerHTML='<span class="fd-lbl">Σχόλιο</span><span style="font-size:13px;color:var(--text-muted)">Κάνε κλικ σε ένα γεύμα στον πίνακα για να το σχολιάσεις. Το σχόλιο εμφανίζεται στο λινκ του πελάτη, κάτω από το γεύμα.</span>';
    return;
  }
  var p=V.cell.split('|'), d=p[0], k=p[1];
  var lab=(FD_SLOTS.filter(function(s){return s[0]===k;})[0]||['',''])[1];
  var v=(((V.row.entries[d]||{}).meals)||{})[k]||'';
  var cm=V.row.comments[V.cell]||{};
  box.innerHTML='<span class="fd-lbl">'+FD_DAYS[fdDow(d)]+' '+fdDM(d)+' · '+lab+'</span>'
    +'<div style="font-size:14px;white-space:pre-wrap">'+(String(v).trim()?esc(v):'<span style="color:var(--text-muted)">Δεν έχει γράψει κάτι.</span>')+'</div>'
    +'<div class="fd-react" id="fd-react">'+FD_REACT.map(function(r){ return '<button type="button" data-r="'+r[0]+'" class="'+(V.draftR===r[0]?'on':'')+'">'+r[0]+' '+r[1]+'</button>'; }).join('')+'</div>'
    +'<div style="display:flex;flex-direction:column;gap:5px"><span style="font-size:11px;color:var(--text-muted)">Έτοιμες συμβουλές'+(foodDiaryLangFor(V.c)==='en'?' (γράφονται στα αγγλικά, όπως το λινκ)':'')+'</span>'
      +'<div class="fd-react fd-tips" id="fd-tips">'+FD_TIPS.map(function(t,i){ return '<button type="button" data-i="'+i+'">'+t[0]+' '+esc(t[1])+'</button>'; }).join('')+'</div></div>'
    +'<textarea id="fd-cmt" placeholder="Σχόλιο για τον πελάτη (προαιρετικό)…" maxlength="500">'+esc(cm.t||'')+'</textarea>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
      +'<button class="btn primary" style="font-size:12.5px" id="fd-cmt-save">Αποθήκευση σχολίου</button>'
      +(V.row.comments[V.cell]?'<button class="btn" style="font-size:12.5px;color:#c0392b" id="fd-cmt-del">Διαγραφή</button>':'')
      +'<span style="font-size:11.5px;color:var(--text-muted)" id="fd-cmt-st"></span>'
    +'</div>';
  document.getElementById('fd-react').onclick=function(e){
    var b=e.target.closest('button'); if(!b) return;
    V.draftR=(V.draftR===b.dataset.r)?null:b.dataset.r;
    document.querySelectorAll('#fd-react button').forEach(function(x){ x.classList.toggle('on',x.dataset.r===V.draftR); });
  };
  document.getElementById('fd-tips').onclick=function(e){
    var b=e.target.closest('button'); if(!b) return;
    var ta=document.getElementById('fd-cmt'), tip=FD_TIPS[+b.dataset.i]; if(!ta||!tip) return;
    var phrase=tip[2][foodDiaryLangFor(V.c)]||tip[2].el;
    if(ta.value.indexOf(phrase.trim())>=0 && phrase.slice(-1)!==' ') return;   // already there
    var cur=ta.value.replace(/\s+$/,'');
    ta.value=(cur?cur+(/[.!;?…:]$/.test(cur)?' ':'. '):'')+phrase;
    ta.focus(); ta.setSelectionRange(ta.value.length,ta.value.length);
  };
  document.getElementById('fd-cmt-save').onclick=function(){
    var t=document.getElementById('fd-cmt').value.trim();
    if(!V.draftR && !t){ delete V.row.comments[V.cell]; }
    else V.row.comments[V.cell]={r:V.draftR||'💬', t:t, at:new Date().toISOString()};
    fdSaveComments(this);
  };
  var del=document.getElementById('fd-cmt-del');
  if(del) del.onclick=function(){ delete V.row.comments[V.cell]; V.draftR=null; fdSaveComments(this); };
}
function fdSaveComments(btn){
  var V=FD_VIEW; if(!V) return;
  if(btn){ btn.disabled=true; }
  window.Cloud.saveFoodDiaryField(V.c,'comments',V.row.comments).then(function(){
    fdRenderViewer();
    var s=document.getElementById('fd-cmt-st'); if(s) s.textContent='✓ Αποθηκεύτηκε — το βλέπει ο πελάτης';
  }).catch(function(e){
    if(btn) btn.disabled=false;
    showErrorToast(e.message||'Δεν αποθηκεύτηκε.');
  });
}
var _fdNotesT=null, _fdNotesDirty=false;
function fdQueueNotes(){
  _fdNotesDirty=true;
  var s=document.getElementById('fd-notes-st'); if(s) s.textContent='Αποθηκεύεται…';
  clearTimeout(_fdNotesT); _fdNotesT=setTimeout(fdFlushNotes,1000);
}
function fdFlushNotes(){
  clearTimeout(_fdNotesT);
  if(!_fdNotesDirty || !FD_VIEW) return;
  _fdNotesDirty=false;
  window.Cloud.saveFoodDiaryField(FD_VIEW.c,'notes',FD_VIEW.row.notes).then(function(){
    var s=document.getElementById('fd-notes-st'); if(s) s.textContent='✓ Αποθηκεύτηκε · μόνο για σένα';
  }).catch(function(e){ _fdNotesDirty=true; showErrorToast(e.message||'Οι σημειώσεις δεν αποθηκεύτηκαν.'); });
}
function fdReload(btn){
  var V=FD_VIEW; if(!V) return;
  fdFlushNotes();
  if(btn){ btn.disabled=true; btn.textContent='↻ …'; }
  window.Cloud.fetchFoodDiary(V.c).then(function(row){
    if(row && FD_VIEW){
      row.entries=row.entries||{}; row.comments=row.comments||{}; row.notes=row.notes||{};
      FD_VIEW.row=row; V.c.diarySeenAt=new Date().toISOString(); try{ save(); }catch(e){}
    }
    fdRenderViewer();
  });
}

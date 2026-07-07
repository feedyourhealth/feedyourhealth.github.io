// ═══════════════════════════════════════════════════════════════
// ΑΡΧΙΚΗ — control-tower dashboard (Phase 2)
// ═══════════════════════════════════════════════════════════════

// Πελάτες (ενεργοί, μη-αρχειοθετημένοι) που χρειάζονται προσοχή για οποιονδήποτε από τους λόγους
// που ήδη χρησιμοποιεί το clientNeedsAttention() (app-part1.js) για την ταξινόμηση στο Πελάτες —
// έτσι τα δύο ταμπ δεν διαφωνούν πια για το ποιος "χρειάζεται προσοχή". Ένας πελάτης χωρίς πλάνο
// ή με πλάνο 30+ ημερών δεν εμφανιζόταν πουθενά στην Αρχική πριν αν είχε πρόσφατη μέτρηση βάρους.
// Ο ξεπερασμένος σύνδεσμος portal εξαιρείται σκόπιμα εδώ (έχει ήδη δική του κάρτα με δικό της κουμπί).
function homeClientsNeedingAttention(){
  var WEIGHT_GAP_DAYS=30, CHECKIN_GAP_DAYS=2;
  var now=Date.now();
  var out=[];
  clients.filter(function(c){return !c.deleted && !c.archived;}).forEach(function(c){
    var hasPlan=(typeof dietsHasPlan==='function')?dietsHasPlan(c):!!(c.weekPlan&&Object.keys(c.weekPlan).length>0);
    if(!hasPlan){
      out.push({c:c,tier:0,gap:0,label:'χωρίς πλάνο ακόμα',
        action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickCreatePlan(\''+c.id+'\')">Δημιούργησε πλάνο</button>'});
      return;
    }
    if(typeof dietsNeedsRenewal==='function' && dietsNeedsRenewal(c)){
      var daysOld=Math.floor((now-c.planGeneratedAt)/86400000);
      out.push({c:c,tier:1,gap:daysOld,label:'το πλάνο έγινε πριν '+daysOld+' ημέρες',
        action:'<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickCreatePlan(\''+c.id+'\')">Δημιούργησε νέο πλάνο</button>'});
      return;
    }
    var wl=c.weightLog||[];
    var last=wl.length?wl[wl.length-1].date:null;
    var gapDays=last?Math.round((now-new Date(last+'T00:00:00'))/86400000):Infinity;
    if(gapDays>=WEIGHT_GAP_DAYS){
      out.push({c:c,tier:2,gap:gapDays,label:isFinite(gapDays)?(gapDays+' ημ. χωρίς μέτρηση'):'καμία μέτρηση ακόμα'});
      return;
    }
    if(c.shareToken && window.Cloud && window.Cloud.checkinsFor){
      var rows=window.Cloud.checkinsFor(c);
      var ckGap=rows.length?ckDaysSinceLast(rows):Infinity;
      if(rows.length && ckGap>=CHECKIN_GAP_DAYS){
        out.push({c:c,tier:3,gap:ckGap,label:'χωρίς check-in στο portal '+ckGap+' ημέρες'});
      }
    }
  });
  out.sort(function(a,b){ return a.tier!==b.tier ? a.tier-b.tier : b.gap-a.gap; });
  return out;
}

// Πελάτες με στόχο απώλειας/αύξησης (goalMain) που η τάση βάρους τους (τελευταίες έως 5 μετρήσεις,
// γραμμή πρώτη→τελευταία) κινείται ΑΝΤΙΘΕΤΑ από τον στόχο τους — π.χ. στόχος απώλειας αλλά ανεβαίνει.
// Στόχος "διατήρησης" (maintain) εξαιρείται σκόπιμα: δεν υπάρχει "λάθος" κατεύθυνση για να τη σημάνουμε.
// Απαιτεί τουλάχιστον 10 ημέρες span (μειώνει θόρυβο από μία μεμονωμένη διακύμανση) και ρυθμό
// ≥0.15 κ/εβδ αντίθετο στον στόχο (αγνοεί φυσιολογικές ημερήσιες διακυμάνσεις).
function homeWeightTrendAlerts(){
  var MIN_SPAN_DAYS=10, MIN_RATE=0.15;
  var out=[];
  clients.filter(function(c){return !c.deleted && !c.archived && (c.goalMain==='loss'||c.goalMain==='gain');}).forEach(function(c){
    var wl=(c.weightLog||[]).slice(-5);
    if(wl.length<2) return;
    var first=wl[0], last=wl[wl.length-1];
    var days=(new Date(last.date+'T00:00:00')-new Date(first.date+'T00:00:00'))/86400000;
    if(days<MIN_SPAN_DAYS) return;
    var rate=(last.weight-first.weight)/(days/7);
    var wrong=c.goalMain==='loss'?(rate>MIN_RATE):(rate<-MIN_RATE);
    if(!wrong) return;
    out.push({c:c,rate:rate});
  });
  out.sort(function(a,b){ return Math.abs(b.rate)-Math.abs(a.rate); });
  return out;
}

function homeTrendRow(c,rate){
  var arrow=rate>0?'↑':(rate<0?'↓':'→');
  var txt=arrow+' '+(rate>0?'+':'')+rate.toFixed(1)+' κ/εβδ';
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\')">'
    +'<div class="hm-avatar hm-avatar-red">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-trend-badge hm-trend-bad">'+txt+'</span>'
    +'</div>';
}

// Πελάτες με δημοσιευμένο σύνδεσμο portal που δείχνει πλέον ξεπερασμένο πλάνο.
function homeStaleLinks(){
  return clients.filter(function(c){return !c.deleted && !c.archived && window.Cloud && window.Cloud.isStale && window.Cloud.isStale(c);});
}

function fmtDateLocal(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
// Πελάτες που καταχώρησαν μέτρηση σήμερα (τοπική ημερομηνία).
function homeMeasuredToday(){
  var today=fmtDateLocal(new Date());
  return clients.filter(function(c){return !c.deleted && !c.archived;})
    .filter(function(c){
      var wl=c.weightLog||[];
      return wl.length && wl[wl.length-1].date===today;
    });
}

// Πελάτες με πρόσφατο check-in στο portal, ταξινομημένοι με το πιο πρόσφατο πρώτα.
function homePortalActivity(){
  if(!window.Cloud || !window.Cloud.checkinsFor) return [];
  return clients.filter(function(c){return !c.deleted && !c.archived && c.shareToken;})
    .map(function(c){
      var rows=window.Cloud.checkinsFor(c);
      return {c:c, rows:rows, gap:ckDaysSinceLast(rows)};
    })
    .filter(function(x){return x.rows.length && isFinite(x.gap);})
    .sort(function(a,b){return a.gap-b.gap;});
}

// initials() moved to js/app-part1.js — it's called from renderSB() there, which can run
// (via an early auth-callback in app-part4.js) before this later-loading file exists yet.

function homeRow(c,sub,accent,actionHtml){
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\')">'
    +'<div class="hm-avatar hm-avatar-'+accent+'">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-row-sub">'+sub+'</span>'
    +(actionHtml||'')
    +'</div>';
}

function homeCard(title,items,emptyText,moreLabel,variant){
  var html='<div class="hm-card hm-card-'+variant+'"><div class="hm-card-title">'+title+'</div>';
  if(!items.length){
    html+='<div class="hm-empty">'+emptyText+'</div>';
  } else {
    items.slice(0,8).forEach(function(row){ html+=row; });
    if(items.length>8) html+='<div class="hm-more">+'+(items.length-8)+' '+moreLabel+'</div>';
  }
  html+='</div>';
  return html;
}

// Ξαναδημοσιεύει το πλάνο ενός πελάτη απευθείας από την Αρχική, χωρίς να φύγουμε από τη σελίδα.
function homeQuickRepublish(clientId,btn){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  if(!window.Cloud || !window.Cloud.publishPlan){ showErrorToast('Το cloud δεν είναι διαθέσιμο αυτή τη στιγμή.'); return; }
  var orig=btn.textContent;
  btn.disabled=true; btn.textContent='Δημοσίευση...';
  window.Cloud.publishPlan(c).then(function(){
    renderHome();
  }).catch(function(e){
    btn.disabled=false; btn.textContent=orig;
    showErrorToast('Σφάλμα δημοσίευσης: '+(e.message||''));
  });
}

function renderHome(){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;

  if(!clients || !clients.length){
    main.innerHTML='<div class="empty" id="empty-state">'
      +'<div style="font-size:64px;margin-bottom:12px">👥</div>'
      +'<div style="font-size:16px;font-weight:600;margin-bottom:8px;color:#025857">Καλώς ήρθες στον Διαιτολόγο!</div>'
      +'<div style="font-size:13px;color:#999;margin-bottom:20px;max-width:400px">Δημιουργήστε τον πρώτο σας πελάτη για να ξεκινήσετε τη διαχείριση διατροφικών σχεδίων</div>'
      +'<button class="btn primary" onclick="addClient()" style="font-size:14px;padding:12px 24px;">+ Δημιουργήστε Πρώτο Πελάτη</button>'
      +'</div>';
    renderSB();
    return;
  }

  var metrics=(typeof ANALYTICS!=='undefined'&&ANALYTICS.getClientMetrics)?ANALYTICS.getClientMetrics():{total:clients.length,active:0};
  var attentionRows=homeClientsNeedingAttention().map(function(x){
    return homeRow(x.c, x.label, 'red', x.action);
  });
  var staleRows=homeStaleLinks().map(function(c){
    return homeRow(c,'ο σύνδεσμος δείχνει παλιό πλάνο','amber',
      '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();homeQuickRepublish(\''+c.id+'\',this)">Ξαναδημοσίευσε</button>');
  });
  var activityRows=homePortalActivity().map(function(x){
    var sub=x.gap===0?'σήμερα':(x.gap===1?'χθες':'πριν '+x.gap+' ημέρες');
    return homeRow(x.c,sub,'teal');
  });
  var trendRows=homeWeightTrendAlerts().map(function(x){ return homeTrendRow(x.c,x.rate); });

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">🏠 Αρχική</div>';

  var measuredToday=homeMeasuredToday();
  html+='<div class="hm-stats">'
    +'<div class="hm-stat"><div class="hm-stat-num">'+metrics.total+'</div><div class="hm-stat-lbl">Πελάτες</div></div>'
    +'<div class="hm-stat"><div class="hm-stat-num">'+metrics.active+'</div><div class="hm-stat-lbl">Ενεργά πλάνα</div></div>'
    +'<div class="hm-stat"><div class="hm-stat-num">'+measuredToday.length+'</div><div class="hm-stat-lbl">Μετρήσεις σήμερα</div>'
    +(measuredToday.length?'<div class="hm-stat-names">'+measuredToday.map(function(c){return esc(c.name||'');}).join(', ')+'</div>':'')
    +'</div>'
    +'</div>';

  html+='<div class="hm-grid">';
  html+=homeCard('⚠️ Χρειάζονται προσοχή', attentionRows, 'Όλοι οι πελάτες έχουν πρόσφατη μέτρηση 👍', 'ακόμα', 'danger');
  html+=homeCard('📈 Τάση βάρους', trendRows, 'Καμία ανησυχητική τάση βάρους αυτή τη στιγμή 👍', 'ακόμα', 'danger');
  html+=homeCard('🔗 Ξεπερασμένοι σύνδεσμοι', staleRows, 'Κανένας σύνδεσμος δεν χρειάζεται ανανέωση 👍', 'ακόμα', 'warning');
  html+=homeCard('📱 Πρόσφατη δραστηριότητα', activityRows, 'Καμία πρόσφατη δραστηριότητα από το portal', 'ακόμα', 'info');
  html+='</div>';

  html+='</div>';

  main.innerHTML=html;
  renderSB();
}

// ═══════════════════════════════════════════════════════════════
// ΔΙΑΤΡΟΦΕΣ — cross-client plan overview (Phase 4)
// ═══════════════════════════════════════════════════════════════

function dietsHasPlan(c){ return !!(c.weekPlan && Object.keys(c.weekPlan).length>0); }

// Οι πραγματικοί πελάτες ξαναέρχονται για νέο πλάνο κάθε ~30-40 μέρες — μετά τις 30 το πλάνο
// θεωρείται προς ανανέωση. Άγνωστη ημερομηνία δημιουργίας (πλάνα από πριν αυτό το feature) = δεν επισημαίνεται.
var PLAN_RENEWAL_DAYS=30;
function dietsNeedsRenewal(c){
  return !!(c.planGeneratedAt && (Date.now()-c.planGeneratedAt)/86400000>=PLAN_RENEWAL_DAYS);
}

// Χωρίς πλάνο ακόμα, ή με δημοσιευμένο σύνδεσμο που δείχνει ξεπερασμένο πλάνο, ή πλάνο που χρειάζεται ανανέωση.
function dietsNeedsAction(){
  return clients.filter(function(c){return !c.deleted && !c.archived;})
    .filter(function(c){ return !dietsHasPlan(c) || (window.Cloud&&window.Cloud.isStale&&window.Cloud.isStale(c)) || dietsNeedsRenewal(c); });
}
// Ενεργός πελάτης με τρέχον πλάνο που δεν χρειάζεται ενέργεια.
function dietsActive(){
  return clients.filter(function(c){return !c.deleted && !c.archived;})
    .filter(function(c){ return dietsHasPlan(c) && !(window.Cloud&&window.Cloud.isStale&&window.Cloud.isStale(c)) && !dietsNeedsRenewal(c); });
}
// Αρχειοθετημένοι πελάτες που έχουν πλάνο — κρατιέται ως ιστορικό αναφοράς.
function dietsHistory(){
  return clients.filter(function(c){return !c.deleted && c.archived && dietsHasPlan(c);});
}

function dietsRow(c,sub,actionHtml,accent){
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\');swTab(2)">'
    +'<div class="hm-avatar'+(accent?' hm-avatar-'+accent:'')+'">'+initials(c.name)+'</div>'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-row-sub">'+sub+'</span>'
    +(actionHtml||'')
    +'</div>';
}

// Δημιουργεί πλάνο απευθείας από τη λίστα "Χρειάζονται ενέργεια" — ίδιο μονοπάτι με το "Ξεκίνα πλάνο τώρα" (Phase 1):
// πάει στον πελάτη και προσπαθεί να γεννήσει πλάνο, ώστε η υπάρχουσα επικύρωση/toast να συνεχίσει να ισχύει.
function dietsQuickCreatePlan(clientId){
  selectClient(clientId);
  genPlanWithUndo();
}

// Ξαναδημοσιεύει το πλάνο ενός πελάτη χωρίς να φύγουμε από τη λίστα Διατροφές.
function dietsQuickRepublish(clientId,btn){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  if(!window.Cloud || !window.Cloud.publishPlan){ showErrorToast('Το cloud δεν είναι διαθέσιμο αυτή τη στιγμή.'); return; }
  var orig=btn.textContent;
  btn.disabled=true; btn.textContent='Δημοσίευση...';
  window.Cloud.publishPlan(c).then(function(){
    renderDiets();
  }).catch(function(e){
    btn.disabled=false; btn.textContent=orig;
    showErrorToast('Σφάλμα δημοσίευσης: '+(e.message||''));
  });
}

function dietsSection(title,items,rowFn,emptyText,variant){
  var html='<div class="hm-card'+(variant?' hm-card-'+variant:'')+'" style="margin-bottom:16px"><div class="hm-card-title">'+esc(title)+' ('+items.length+')</div>';
  if(!items.length){ html+='<div class="hm-empty">'+emptyText+'</div>'; }
  else { items.forEach(function(c){ html+=rowFn(c); }); }
  html+='</div>';
  return html;
}

function renderDiets(){
  curId=null;
  var main=document.getElementById('main');
  if(!main) return;

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">📊 Διατροφές</div>';

  html+=dietsSection('🔴 Χρειάζονται ενέργεια', dietsNeedsAction(), function(c){
    // Προτεραιότητα: "χωρίς πλάνο" > "ξεπερασμένος σύνδεσμος" > "χρειάζεται ανανέωση" — ένας πελάτης
    // με άδειο weekPlan αλλά παλιό δημοσιευμένο hash θα δείξει isStale()=true κι αυτός, αλλά χρειάζεται
    // νέο πλάνο πρώτα, όχι απλή επαναδημοσίευση του κενού.
    if(!dietsHasPlan(c)){
      return dietsRow(c, 'χωρίς πλάνο ακόμα', '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickCreatePlan(\''+c.id+'\')">Δημιούργησε πλάνο</button>', 'red');
    }
    if(window.Cloud && window.Cloud.isStale && window.Cloud.isStale(c)){
      return dietsRow(c, 'ο σύνδεσμος δείχνει παλιό πλάνο', '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickRepublish(\''+c.id+'\',this)">Ξαναδημοσίευσε</button>', 'red');
    }
    var daysOld=Math.floor((Date.now()-c.planGeneratedAt)/86400000);
    return dietsRow(c, 'το πλάνο έγινε πριν '+daysOld+' ημέρες', '<button type="button" class="hm-action-btn" onclick="event.stopPropagation();dietsQuickCreatePlan(\''+c.id+'\')">Δημιούργησε νέο πλάνο</button>', 'red');
  }, 'Όλοι είναι εντάξει 👍', 'danger');

  html+=dietsSection('🟢 Ενεργά', dietsActive(), function(c){
    return dietsRow(c, 'τελ. ενημέρωση '+fmtLastAccess(c.lastAccess), null, 'green');
  }, 'Κανένας πελάτης με ενεργό πλάνο ακόμα', 'success');

  html+=dietsSection('📁 Ιστορικό', dietsHistory(), function(c){
    return dietsRow(c, c.archivedAt?('αρχειοθετήθηκε '+fmtLastAccess(new Date(c.archivedAt).getTime())):'αρχειοθετημένος');
  }, 'Κανένας αρχειοθετημένος πελάτης με πλάνο');

  html+='</div>';

  main.innerHTML=html;
  renderSB();
}

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
  html+='<select id="client-filter-sport" class="clients-toolbar-select" aria-label="Φίλτρο αθλήματος" onchange="setClientFilter(\'sport\',this.value)">'
    +'<option value=""'+sel(_clientFilterSport,'')+'>Όλα τα αθλήματα</option>';
  Object.keys(SPORT_INFO).forEach(function(key){
    html+='<option value="'+key+'"'+sel(_clientFilterSport,key)+'>'+SPORT_INFO[key].icon+' '+SPORT_INFO[key].label+'</option>';
  });
  html+='</select>';
  html+='<select id="client-sort" class="clients-toolbar-select" aria-label="Ταξινόμηση πελατών" onchange="setClientSort(this.value)">'
    +'<option value="recent"'+sel(_clientSortMode,'recent')+'>🕐 Πρόσφατη επίσκεψη πρώτα</option>'
    +'<option value="attention"'+sel(_clientSortMode,'attention')+'>🔔 Χρειάζονται προσοχή πρώτα</option>'
    +'<option value="oldest"'+sel(_clientSortMode,'oldest')+'>⏳ Παλαιότερη επίσκεψη πρώτα</option>'
    +'<option value="name"'+sel(_clientSortMode,'name')+'>🔤 Όνομα (Α-Ω)</option>'
    +'<option value="stale"'+sel(_clientSortMode,'stale')+'>⚠️ Μπαγιατεμένο πλάνο πρώτα</option>'
    +'</select>';
  html+='<button class="add-btn add-btn-toolbar" onclick="addClient()">+ Νέος πελάτης</button>';
  html+='</div>';

  html+='<div id="client-list" class="clients-list-page"></div>';
  html+='</div>';

  main.innerHTML=html;
  renderSB();
}

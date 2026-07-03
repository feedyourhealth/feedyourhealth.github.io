// ═══════════════════════════════════════════════════════════════
// ΑΡΧΙΚΗ — control-tower dashboard (Phase 2)
// ═══════════════════════════════════════════════════════════════

// Πελάτες (ενεργοί, μη-αρχειοθετημένοι) χωρίς πρόσφατη μέτρηση βάρους/σώματος.
function homeClientsNeedingAttention(){
  var THRESHOLD_DAYS=30;
  var now=Date.now();
  return clients.filter(function(c){return !c.deleted && !c.archived;})
    .map(function(c){
      var wl=c.weightLog||[];
      var last=wl.length?wl[wl.length-1].date:null;
      var days=last?Math.round((now-new Date(last+'T00:00:00'))/86400000):Infinity;
      return {c:c,days:days};
    })
    .filter(function(x){return x.days>=THRESHOLD_DAYS;})
    .sort(function(a,b){return b.days-a.days;});
}

// Πελάτες με δημοσιευμένο σύνδεσμο portal που δείχνει πλέον ξεπερασμένο πλάνο.
function homeStaleLinks(){
  return clients.filter(function(c){return !c.deleted && !c.archived && window.Cloud && window.Cloud.isStale && window.Cloud.isStale(c);});
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

function homeRow(c,sub){
  return '<div class="hm-row" onclick="selectClient(\''+c.id+'\')">'
    +'<span class="hm-row-name">'+esc(c.name||'Νέος πελάτης')+'</span>'
    +'<span class="hm-row-sub">'+sub+'</span>'
    +'</div>';
}

function homeCard(title,items,emptyText,moreLabel){
  var html='<div class="hm-card"><div class="hm-card-title">'+title+'</div>';
  if(!items.length){
    html+='<div class="hm-empty">'+emptyText+'</div>';
  } else {
    items.slice(0,8).forEach(function(row){ html+=row; });
    if(items.length>8) html+='<div class="hm-more">+'+(items.length-8)+' '+moreLabel+'</div>';
  }
  html+='</div>';
  return html;
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
    return homeRow(x.c, isFinite(x.days)?(x.days+' ημ. χωρίς μέτρηση'):'καμία μέτρηση ακόμα');
  });
  var staleRows=homeStaleLinks().map(function(c){
    return homeRow(c,'ο σύνδεσμος δείχνει παλιό πλάνο');
  });
  var activityRows=homePortalActivity().map(function(x){
    var sub=x.gap===0?'σήμερα':(x.gap===1?'χθες':'πριν '+x.gap+' ημέρες');
    return homeRow(x.c,sub);
  });

  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">🏠 Αρχική</div>';

  html+='<div class="hm-stats">'
    +'<div class="hm-stat"><div class="hm-stat-num">'+metrics.total+'</div><div class="hm-stat-lbl">Πελάτες</div></div>'
    +'<div class="hm-stat"><div class="hm-stat-num">'+metrics.active+'</div><div class="hm-stat-lbl">Ενεργά πλάνα</div></div>'
    +'</div>';

  html+='<div class="hm-grid">';
  html+=homeCard('⚠️ Χρειάζονται προσοχή', attentionRows, 'Όλοι οι πελάτες έχουν πρόσφατη μέτρηση 👍', 'ακόμα');
  html+=homeCard('🔗 Ξεπερασμένοι σύνδεσμοι', staleRows, 'Κανένας σύνδεσμος δεν χρειάζεται ανανέωση 👍', 'ακόμα');
  html+=homeCard('📱 Πρόσφατη δραστηριότητα', activityRows, 'Καμία πρόσφατη δραστηριότητα από το portal', 'ακόμα');
  html+='</div>';

  html+='</div>';

  main.innerHTML=html;
  renderSB();
}

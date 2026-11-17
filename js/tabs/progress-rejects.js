// ── 👎 «Δεν του αρέσουν» στην Πρόοδο (2026-11-17, μετά από mockup) ─────────────────────────────
// Ο πελάτης πατά 👎 «Όχι για μένα» σε μια εναλλακτική στο link (plan.html) → client_alt_reject
// (Cloud.altRejectsFor). Εδώ ο διαιτολόγος βλέπει:
//   • τρόφιμο που επανέρχεται σε ≥ PROGRESS_REJ_FOOD_MIN απορρίψεις → πρόταση για αποκλεισμό
//     (ΠΟΤΕ αυτόματα — αλλιώς ο πελάτης θα έκοβε μόνος του λαχανικά/ψάρι)
//   • γιατί απορρίπτει (δεν μου αρέσει / δεν έχω χρόνο / δεν το βρίσκω) + μια γραμμή για το ραντεβού
//   • λίστα με «Επαναφορά» → c.altRejectRestored[sig] = ώρα· ξαναμπαίνει στις εναλλακτικές στην επόμενη
//     δημοσίευση (clientRejectedAltSigs, meal-library.js).
// Ό,τι απορρίπτει βγαίνει ήδη από τις εναλλακτικές στην επόμενη δημοσίευση — δεν χρειάζεται ενέργεια.
var PROGRESS_REJ_FOOD_MIN=3;
var PROGRESS_REJ_REASONS={taste:'Δεν μου αρέσει', time:'Δεν έχω χρόνο', find:'Δεν το βρίσκω', '':'Χωρίς λόγο'};
var _progressRejFoods={};   // clientId → [ {n,count} ] της τελευταίας σχεδίασης (για τα κουμπιά)
var _progressRejSigs={};    // clientId → [sig] της τελευταίας σχεδίασης

// Ενεργές απορρίψεις: όχι αναιρεμένες από τον πελάτη, όχι επαναφερμένες από τον διαιτολόγο. Νεότερη πρώτη.
function progressActiveRejects(c){
  var rej=(window.Cloud && typeof window.Cloud.altRejectsFor==='function')?window.Cloud.altRejectsFor(c):{};
  var restored=c.altRejectRestored||{};
  return Object.keys(rej).map(function(sig){ return rej[sig]; })
    .filter(function(e){ return e && !e.x && !(restored[e.sig] && restored[e.sig]>=(e.t||'')); })
    .sort(function(a,b){ return String(b.t||'')<String(a.t||'')?-1:1; });
}
function progressRejFoodName(n){
  if(typeof FOODS!=='undefined' && FOODS[n]) return n;
  var r=(typeof resolveFood==='function')?resolveFood(n):null;
  return (r && typeof FOODS!=='undefined' && FOODS[r])?r:n;
}
// Τρόφιμα που επανέρχονται — εκτός όσων είναι ήδη αποκλεισμένα ή «Αγνόησε» στο ίδιο/μεγαλύτερο πλήθος.
function progressRejFoodFlags(c,list){
  var cnt={};
  list.forEach(function(e){
    var seen={};
    (e.f||[]).forEach(function(p){
      var n=progressRejFoodName(Array.isArray(p)?p[0]:'');
      if(!n || seen[n]) return; seen[n]=1;
      cnt[n]=(cnt[n]||0)+1;
    });
  });
  var excl=c.foodExclude||[], dis=c.altRejectFoodDismissed||{};
  return Object.keys(cnt)
    .filter(function(n){ return cnt[n]>=PROGRESS_REJ_FOOD_MIN && excl.indexOf(n)===-1 && !(dis[n]>=cnt[n]); })
    .map(function(n){ return {n:n, count:cnt[n]}; })
    .sort(function(a,b){ return b.count-a.count; });
}
function progressRejDate(t){
  var d=new Date(t||''); if(isNaN(d)) return '';
  return ['Κυρ','Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ'][d.getDay()]+' '+d.getDate()+'/'+(d.getMonth()+1);
}

function progressRejectsHtml(c){
  var head='<div class="hm-card pr-rj" style="margin-bottom:14px"><div class="hm-card-title">👎 Δεν του αρέσουν <span style="font-weight:400;font-size:12px;color:#666">— «Όχι για μένα» στις εναλλακτικές του link</span></div>';
  var list=progressActiveRejects(c);
  if(!list.length) return head+'<div class="hm-empty">Δεν έχει απορρίψει καμία εναλλακτική.</div></div>';
  var cid=c.id;
  var foods=progressRejFoodFlags(c,list);
  _progressRejFoods[cid]=foods;
  _progressRejSigs[cid]=list.map(function(e){ return e.sig; });
  var html=head;

  // Τρόφιμο που επανέρχεται → πρόταση αποκλεισμού (έως 2 κάρτες)
  foods.slice(0,2).forEach(function(fl,fi){
    html+='<div class="pr-sw-flag">'
      +'<div class="pr-sw-flag-t">'+esc(fl.n)+' σε '+fl.count+' από τις '+list.length+' απορρίψεις</div>'
      +'<div class="pr-sw-flag-s">Θες να μπει στους αποκλεισμούς του; Τότε δεν θα μπαίνει ούτε στο πλάνο ούτε στις εναλλακτικές.</div>'
      +'<div class="pr-sw-flag-a">'
      +'<button type="button" class="hm-action-btn" onclick="progressRejExclude(\''+cid+'\','+fi+')">🚫 Προσθήκη στους αποκλεισμούς</button>'
      +'<button type="button" class="pr-sw-link" onclick="progressRejFoodDismiss(\''+cid+'\','+fi+')">Αγνόησε</button>'
      +'</div></div>';
  });

  // Γιατί τα απορρίπτει
  var rc={taste:0,time:0,find:0,'':0};
  list.forEach(function(e){ var r=PROGRESS_REJ_REASONS[e.r||'']!==undefined?(e.r||''):''; rc[r]++; });
  var order=['time','taste','find',''].filter(function(k){ return rc[k]; }).sort(function(a,b){ return rc[b]-rc[a]; });
  html+='<div class="pr-sw-sub">Γιατί τα απορρίπτει</div><div class="pr-rj-reasons">';
  order.forEach(function(k){
    html+='<div class="pr-rj-r"><span class="pr-rj-rl">'+PROGRESS_REJ_REASONS[k]+'</span>'
      +'<span class="pr-rj-bar"><span style="width:'+Math.round(rc[k]/list.length*100)+'%"></span></span><b>'+rc[k]+'</b></div>';
  });
  html+='</div>';
  var top=order.filter(function(k){ return k; })[0];
  var tips={
    time:'Κυρίως «δεν έχω χρόνο». Στο ραντεβού συζήτησε πιο γρήγορα γεύματα ή προετοιμασία από πριν.',
    taste:'Κυρίως «δεν μου αρέσει». Αξίζει μια κουβέντα για τις προτιμήσεις του στο ραντεβού.',
    find:'Κυρίως «δεν το βρίσκω». Προτίμησε τρόφιμα που βρίσκει εύκολα εκεί που ψωνίζει.'
  };
  if(top && rc[top]>=2) html+='<div class="pr-rj-tip">'+tips[top]+'</div>';

  // Λίστα
  html+='<div class="pr-sw-sub">Τι απέρριψε ('+list.length+')</div>';
  list.slice(0,20).forEach(function(e,i){
    html+='<div class="pr-rj-row">'
      +'<span class="pr-rj-d">'+esc(progressRejDate(e.t))+'</span>'
      +'<span class="pr-rj-s">'+esc(e.s||'')+'</span>'
      +'<span class="pr-rj-n">'+esc(e.el||e.sig||'')+'</span>'
      +'<span class="pr-rj-why">'+esc(PROGRESS_REJ_REASONS[e.r||'']||PROGRESS_REJ_REASONS[''])+'</span>'
      +'<button type="button" class="pr-sw-link" style="color:var(--teal)" title="Να ξαναμπεί στις εναλλακτικές στην επόμενη δημοσίευση" onclick="progressRejRestore(\''+cid+'\','+i+')">Επαναφορά</button>'
      +'</div>';
  });
  if(list.length>20) html+='<div class="hm-empty">…και '+(list.length-20)+' παλιότερες.</div>';
  html+='<div class="pr-rj-foot">Τίποτα δεν αποκλείεται αυτόματα. Ό,τι απορρίπτει απλώς δεν ξαναπροτείνεται ως εναλλακτική στην επόμενη δημοσίευση. Με «Επαναφορά» ξαναμπαίνει.</div>';
  return html+'</div>';
}

function progressRejRestore(id,i){
  var c=clients.find(function(x){return x.id===id;});
  var sig=(_progressRejSigs[id]||[])[i];
  if(!c || !sig) return;
  if(!c.altRejectRestored) c.altRejectRestored={};
  c.altRejectRestored[sig]=new Date().toISOString();
  save();
  if(typeof showSuccessToast==='function') showSuccessToast('↩️ Θα ξαναμπεί στις εναλλακτικές στην επόμενη δημοσίευση.');
  openProgressClient(id);
}
function progressRejFoodDismiss(id,fi){
  var c=clients.find(function(x){return x.id===id;});
  var fl=(_progressRejFoods[id]||[])[fi];
  if(!c || !fl) return;
  if(!c.altRejectFoodDismissed) c.altRejectFoodDismissed={};
  c.altRejectFoodDismissed[fl.n]=fl.count;   // ξαναεμφανίζεται μόνο αν συνεχίσει να το απορρίπτει
  save();
  openProgressClient(id);
}
function progressRejExclude(id,fi){
  var c=clients.find(function(x){return x.id===id;});
  var fl=(_progressRejFoods[id]||[])[fi];
  if(!c || !fl) return;
  var hasPlan=Object.keys(c.weekPlan||{}).length>0;
  var q='Το «'+fl.n+'» θα μπει στους αποκλεισμούς του πελάτη.'+(hasPlan?'\n\nΘα αφαιρεθεί και από το υπάρχον πλάνο.':'')+'\n\nΣυνέχεια;';
  function doIt(){
    if(!c.foodExclude) c.foodExclude=[];
    if(c.foodExclude.indexOf(fl.n)===-1) c.foodExclude.push(fl.n);
    save();
    if(hasPlan && typeof refilterMealPlanExclusions==='function') refilterMealPlanExclusions(c);
    if(typeof showSuccessToast==='function') showSuccessToast('🚫 Το «'+fl.n+'» αποκλείστηκε. Δημοσίευσε ξανά το πλάνο για να φτάσει στο link.');
    openProgressClient(id);
  }
  if(typeof showConfirmDialog==='function') showConfirmDialog(q, doIt, {confirmLabel:'Αποκλεισμός', icon:'🚫'});
  else if(confirm(q)) doIt();
}

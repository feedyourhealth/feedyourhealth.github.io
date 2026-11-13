// ── 🏠 Link κουζίνας (kouzina.html) ───────────────────────────────────────────────────────
// Ένας σύνδεσμος για όλο το νοικοκυριό, για όποιον μαγειρεύει/ψωνίζει (συχνά ο γονιός).
// Δείχνει ΜΟΝΟ τα κοινά γεύματα (meal.hhKey σε ≥2 μέλη): «μαγειρέψτε συνολικά» + «μοιράστε στα
// πιάτα» ανά μέλος, και μια λίστα αγορών με ΟΛΑ τα τρόφιμα του σπιτιού (και τα ατομικά), χωρίς
// να φαίνεται ποιος τρώει τι. Ποτέ βάρη, στόχοι, μετρήσεις ή σημειώσεις.
// Αποθήκευση: shared_plans + get_shared_plan (όπως το stoxoi.html), snapshot.kind==='kitchen',
// token c.kitchenToken (ίδιο σε όλα τα μέλη). Χωρίς SQL migration.

var KITCHEN_BASE='https://feedyourhealth.github.io/kouzina.html';

function _kShortName(n){ return String(n||'').replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim(); }
function _kQty(n,g){ var q=fmtFoodQty({n:n,g:Math.round(g)},' γρ.'); return {main:q.main, sub:q.sub}; }

function buildKitchenSnapshot(c){
  var members=hhMembers(c).filter(function(x){ return x.weekPlan&&Object.keys(x.weekPlan).length; });
  var days=[], shopDays=[], meta={};
  for(var d=0; d<7; d++){
    // κοινά γεύματα: ομαδοποίηση με hhKey, μόνο όσα έχουν ≥2 μέλη
    var groups={}, order=[];
    members.forEach(function(x){
      var seenKey={};   // ίδιο κλειδί 2 φορές στην ίδια μέρα (σύρσιμο/αντιγραφή γεύματος) → ένα πιάτο
      (x.weekPlan[d]||[]).forEach(function(meal, mi){
        if(!meal||!meal.hhKey||!meal.foods||!meal.foods.length||seenKey[meal.hhKey]) return;
        seenKey[meal.hhKey]=1;
        if(!groups[meal.hhKey]){ groups[meal.hhKey]={slot:meal.name, pos:mi, dish:'', plates:[]}; order.push(meal.hhKey); }
        var gr=groups[meal.hhKey];
        if(!gr.dish && meal.dishLabels&&meal.dishLabels.length) gr.dish=meal.dishLabels.join(' + ');
        gr.plates.push({who:hhFirstName(x), foods:meal.foods.filter(function(f){ return f&&f.n&&f.n!==FREE_MEAL_MARKER&&f.g>0; })});
      });
    });
    var meals=order.map(function(k){ return groups[k]; }).filter(function(gr){ return gr.plates.length>=2; })
      .sort(function(a,b){ return a.pos-b.pos; })
      .map(function(gr){
        var tot={}, tOrder=[];
        gr.plates.forEach(function(p){ p.foods.forEach(function(f){ if(!(f.n in tot)){ tot[f.n]=0; tOrder.push(f.n); } tot[f.n]+=f.g; }); });
        var dish=gr.dish||tOrder.slice(0,3).map(_kShortName).join(', ');
        return {
          slot:gr.slot, dish:dish,
          total:tOrder.map(function(n){ var q=_kQty(n,tot[n]); return {n:_kShortName(n), k:n, g:Math.round(tot[n]), main:q.main}; }),
          plates:gr.plates.map(function(p){
            return {who:p.who, items:p.foods.map(function(f){ var q=_kQty(f.n,f.g); return {n:_kShortName(f.n), main:q.main, sub:q.sub}; })};
          })
        };
      });
    days.push({meals:meals});

    // λίστα αγορών: όλα τα γεύματα όλων των μελών εκείνης της ημέρας (χωρίς «ποιος»)
    var sd={};
    members.forEach(function(x){
      (x.weekPlan[d]||[]).forEach(function(meal){
        (meal&&meal.foods||[]).forEach(function(f){
          if(!f||!f.n||f.n===FREE_MEAL_MARKER||!(f.g>0)) return;
          sd[f.n]=(sd[f.n]||0)+f.g;
          if(!meta[f.n]){
            var conv=(typeof COOKED_TO_RAW!=='undefined')?COOKED_TO_RAW[f.n]:null;
            meta[f.n]={name:_kShortName(f.n), cat:(FOODS[f.n]&&FOODS[f.n].cat)||'Άλλα'};
            if(conv){ if(conv.isEgg) meta[f.n].egg=1; else { meta[f.n].f=conv.f; meta[f.n].lbl=conv.label; } }
          }
        });
      });
    });
    Object.keys(sd).forEach(function(n){ sd[n]=Math.round(sd[n]); });
    shopDays.push(sd);
  }
  // Προειδοποιήσεις για όλο το τραπέζι — ποτέ με όνομα μέλους, και ΜΟΝΟ οι ομάδες τροφίμων
  // (κουτάκια ⚠️ Αλλεργίες). Το ελεύθερο κείμενο «Άλλες αλλεργίες» μπορεί να έχει ιατρικά
  // στοιχεία (π.χ. φάρμακα) που δεν πρέπει να φαίνονται σε link όλου του σπιτιού.
  var warn=[];
  members.forEach(function(x){
    if(typeof clientAllergyKeys==='function') clientAllergyKeys(x).forEach(function(k){ var df=allergyDef(k); if(df&&warn.indexOf(df.label)===-1) warn.push(df.label); });
  });
  return {
    kind:'kitchen', v:1,
    name:c.householdName||'Νοικοκυριό',
    members:members.map(hhFirstName),
    allergyWarn:warn,
    days:days, shopDays:shopDays, foods:meta,
    updated:new Date().toISOString()
  };
}

function publishKitchenLink(c){
  var C=window.Cloud;
  if(!C||!C.enabled||!C.user) return Promise.reject(new Error('Πρέπει να είσαι συνδεδεμένος στο cloud για να στείλεις σύνδεσμο.'));
  var snap=buildKitchenSnapshot(c);
  if(snap.members.length<2) return Promise.reject(new Error('Χρειάζονται τουλάχιστον 2 μέλη με πλάνο.'));
  var members=hhMembers(c);
  return C.sb.auth.getSession().then(function(res){
    var session=(res&&res.data)?res.data.session:null;
    if(!session||!session.user){ C.user=null; C._showLogin(); throw new Error('Η σύνδεσή σου στο cloud έχει λήξει. Συνδέσου ξανά και ξαναπροσπάθησε.'); }
    C.user=session.user;
    var setTok=function(t){ members.forEach(function(x){ x.kitchenToken=t; }); };
    var doWrite=function(tok,isRetry){
      var expiresAt=new Date(Date.now()+C.LINK_EXPIRE_DAYS*86400000).toISOString();
      var row={token:tok,dietitian_id:session.user.id,snapshot:snap,client_name:snap.name,updated_at:new Date().toISOString(),expires_at:expiresAt};
      return C.sb.from('shared_plans').upsert(row,{onConflict:'token'}).then(function(res2){
        if(res2.error){
          if(/row-level security/i.test(res2.error.message||'')&&!isRetry){ var nt=genSecureToken(); setTok(nt); return doWrite(nt,true); }
          throw new Error('Απέτυχε η δημιουργία του συνδέσμου. Δοκίμασε ξανά.'+(res2.error.message?' ['+res2.error.message+']':''));
        }
        try{ save(); }catch(e){}
        return {url:KITCHEN_BASE+'?t='+tok, expiresAt:expiresAt, snap:snap};
      });
    };
    var tok=c.kitchenToken||(members.filter(function(x){ return x.kitchenToken; })[0]||{}).kitchenToken;
    if(!tok) tok=genSecureToken();
    setTok(tok);
    return doWrite(tok,false);
  });
}

// Όταν αλλάζει η σύνθεση (αποχώρηση μέλους): αν μένουν ≥2, ξαναδημοσιεύεται χωρίς αυτόν·
// αν διαλύεται, ο σύνδεσμος λήγει. Σιωπηλά — δεν πρέπει να μείνει ορατό ένα πρώην μέλος.
function kitchenLinkAfterLeave(tok, remaining){
  var C=window.Cloud;
  if(!tok||!C||!C.enabled||!C.user) return;
  if(remaining&&remaining.length>=2&&remaining[0].kitchenToken===tok){
    publishKitchenLink(remaining[0]).catch(function(e){ console.warn('[kitchen] republish after leave failed',e); });
  } else {
    C.sb.from('shared_plans').update({expires_at:new Date(Date.now()-60000).toISOString()}).eq('token',tok)
      .then(function(r){ if(r.error) console.warn('[kitchen] expire failed',r.error); });
  }
}

// Ενότητα «🔍 Βρέθηκαν ίδια γεύματα» μέσα στο παράθυρο. Τα ίδια = τσεκαρισμένα, τα σχεδόν ίδια = όχι.
var _kitSameRows=[], _kitSameUndo=null;
function _kitSameRowHtml(row, i){
  var foods=row.names.map(_kShortName).join(', ');
  var exWho={}, exOrder=[];   // «Αμύγδαλα (Νίκος, Γιώργος)» αντί για μία φορά ανά μέλος
  row.refs.forEach(function(r){ r.extra.forEach(function(e){ if(!exWho[e.n]){ exWho[e.n]=[]; exOrder.push(e.n); } exWho[e.n].push(r.who); }); });
  var extras=exOrder.map(function(n){ return _kShortName(n)+' ('+exWho[n].join(', ')+')'; });
  if(extras.length) foods+=(foods?' + ':'')+'<span style="color:#b36b00">'+esc(extras.join(' / '))+'</span>';
  else foods=esc(foods);
  var grams=row.refs.map(function(r){
    var s=esc(r.who)+' '+(r.grams.length?r.grams.join(' / ')+' γρ.':'');
    if(r.extra.length) s+=(r.grams.length?' + ':'')+r.extra.map(function(e){ return esc(_kShortName(e.n))+' '+e.g+' γρ.'; }).join(', ');
    return s;
  }).join(' · ');
  return '<label style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-top:1px solid #eef4f2;cursor:pointer">'
    +'<input type="checkbox" class="kit-same-cb" value="'+i+'"'+(row.exact?' checked':'')+' style="margin-top:3px" onchange="kitchenSameCount()">'
    +'<div><div style="font-size:11px;color:#5a8a82">'+esc(DAYS[row.d])+' · '+esc(row.slot)+'</div>'
    +'<div style="font-size:13px;color:#014545">'+foods+'</div>'
    +'<div style="font-size:11px;color:#9fb5b0">'+grams+'</div></div></label>';
}
function _kitSameSectionHtml(c){
  var found=hhFindSameMeals(c);
  _kitSameRows=found.exact.concat(found.near);
  if(!_kitSameRows.length) return '';
  var nE=found.exact.length;
  var h='<div style="border:1px solid #c5ddd8;border-radius:10px;padding:10px 12px;margin-bottom:10px">'
    +'<div style="font-size:13px;color:#014545;margin-bottom:4px">🔍 '+(nE?('Βρέθηκαν <b>'+nE+(nE===1?' γεύμα':' γεύματα')+'</b> ίδια στα πλάνα (ίδια μέρα, ίδιο γεύμα, ίδια τρόφιμα) που δεν είναι ακόμη σημειωμένα ως κοινά.'):'Βρέθηκαν γεύματα που είναι σχεδόν ίδια στα πλάνα.')+'</div>'
    +'<div style="font-size:11px;color:#5a8a82;margin-bottom:6px">Μπαίνει μόνο η ετικέτα «κοινό» — τα γραμμάρια του καθενός μένουν όπως τα έβαλες.</div>'
    +'<div style="max-height:260px;overflow-y:auto">';
  if(nE) h+=found.exact.map(function(r,i){ return _kitSameRowHtml(r,i); }).join('');
  if(found.near.length){
    h+='<div style="font-size:11px;color:#b36b00;margin:8px 0 2px">Σχεδόν ίδια — διαφέρουν σε 1 τρόφιμο (διάλεξε αν τα θες κοινά· στο link το διαφορετικό φαίνεται στο πιάτο του καθενός):</div>'
      +found.near.map(function(r,i){ return _kitSameRowHtml(r,nE+i); }).join('');
  }
  h+='</div><button class="btn" id="kit-same-btn" style="width:100%;margin-top:8px;background:#E2EEE5;color:#014545;border:1px solid #c5ddd8" onclick="kitchenMarkSame()"></button></div>';
  return h;
}
function kitchenSameCount(){
  var n=document.querySelectorAll('.kit-same-cb:checked').length, b=document.getElementById('kit-same-btn');
  if(b) b.textContent=n?('✓ Σημείωσε '+n+(n===1?' γεύμα':' γεύματα')+' ως κοινά'):'Δεν επιλέχθηκε κανένα γεύμα';
}
function kitchenMarkSame(){
  var rows=[].slice.call(document.querySelectorAll('.kit-same-cb:checked')).map(function(cb){ return _kitSameRows[+cb.value]; }).filter(Boolean);
  if(!rows.length){ showErrorToast('Δεν επιλέχθηκε κανένα γεύμα.'); return; }
  _kitSameUndo=hhMarkSameMeals(rows);
  save();
  if(document.getElementById('week-con')&&typeof renderWeekTable==='function') renderWeekTable();
  openKitchenLinkModal({marked:rows.length});
}
function kitchenUndoSame(){
  hhUndoMarkSameMeals(_kitSameUndo); _kitSameUndo=null;
  save();
  if(document.getElementById('week-con')&&typeof renderWeekTable==='function') renderWeekTable();
  openKitchenLinkModal();
}

function openKitchenLinkModal(opts){
  var c=getC(); if(!c||!c.householdId) return;
  opts=(opts&&typeof opts==='object')?opts:{};
  if(!opts.marked) _kitSameUndo=null;
  var snap=buildKitchenSnapshot(c);
  var nShared=snap.days.reduce(function(s,d){ return s+d.meals.length; },0);
  var sameHtml=_kitSameSectionHtml(c);
  var noPlan=hhMembers(c).filter(function(x){ return !x.weekPlan||!Object.keys(x.weekPlan).length; }).map(hhFirstName);
  var ov=document.getElementById('kitchen-overlay'); if(ov) ov.remove();
  ov=document.createElement('div');
  ov.id='kitchen-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML='<div style="background:var(--card-bg,#fff);border-radius:16px;max-width:480px;width:100%;padding:22px;box-shadow:0 10px 40px rgba(0,0,0,.25);max-height:90vh;overflow-y:auto">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:24px">🏠</span><div style="font-size:18px;font-weight:700;color:#014545">Link κουζίνας</div></div>'
    +'<div style="font-size:13px;color:#5a8a82;margin-bottom:10px">Για όποιον μαγειρεύει στο σπίτι «'+esc(snap.name)+'» ('+esc(snap.members.join(', '))+'). '
    +'Δείχνει τα <b>κοινά γεύματα</b> με τη συνολική ποσότητα και τη μερίδα του καθενός, και τη <b>λίστα αγορών</b> όλου του σπιτιού. Δεν δείχνει βάρη, στόχους ή μετρήσεις.</div>'
    +(opts.marked&&_kitSameUndo?'<div style="font-size:13px;margin-bottom:10px;padding:8px 10px;border-radius:8px;background:#E2EEE5;color:#014545;display:flex;align-items:center;gap:8px;justify-content:space-between">'
      +'<span>✓ '+opts.marked+(opts.marked===1?' γεύμα σημειώθηκε':' γεύματα σημειώθηκαν')+' ως κοινά. Δεν άλλαξε κανένα γραμμάριο.</span>'
      +'<button class="btn" style="padding:3px 10px;font-size:12px;white-space:nowrap" onclick="kitchenUndoSame()">↩ Αναίρεση</button></div>':'')
    +((nShared||!sameHtml)?'<div style="font-size:13px;margin-bottom:10px;padding:8px 10px;border-radius:8px;background:'+(nShared?'#E2EEE5;color:#014545':'#fff4e5;color:#8a5200')+'">'
    +(nShared?('✓ '+nShared+(nShared===1?' κοινό γεύμα':' κοινά γεύματα')+' αυτή την εβδομάδα')
      :'⚠️ Δεν υπάρχουν ακόμη κοινά γεύματα. Στο πλάνο, από το ⋮ ενός γεύματος: «↔️ Εφαρμογή σε…». Η λίστα αγορών λειτουργεί ήδη.')+'</div>':'')
    +sameHtml
    +(noPlan.length?'<div style="font-size:12px;color:#e08a00;margin-bottom:10px">Χωρίς πλάνο (δεν θα εμφανιστούν): '+esc(noPlan.join(', '))+'</div>':'')
    +'<div id="kitchen-link-body"><button class="btn" style="width:100%;background:#025857;color:#fff;border:1px solid #025857" onclick="createKitchenLink()">🔗 '+(c.kitchenToken?'Ενημέρωση συνδέσμου':'Δημιουργία συνδέσμου')+'</button></div>'
    +'<div style="text-align:right;margin-top:12px"><button class="btn" onclick="document.getElementById(\'kitchen-overlay\').remove()">Κλείσιμο</button></div></div>';
  document.body.appendChild(ov);
  kitchenSameCount();
}

function createKitchenLink(){
  var c=getC(), body=document.getElementById('kitchen-link-body');
  if(!c||!body) return;
  body.innerHTML='<div style="font-size:13px;color:#5a8a82;text-align:center;padding:10px 0">Δημιουργία συνδέσμου…</div>';
  publishKitchenLink(c).then(function(res){
    var b=document.getElementById('kitchen-link-body'); if(!b) return;
    var url=res.url;
    var msg='Γεια σας! Εδώ είναι ο σύνδεσμος κουζίνας για το σπίτι: τα κοινά γεύματα της εβδομάδας με τη μερίδα του καθενός, και η λίστα για τα ψώνια.\n\n'+url;
    var aSt='display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;color:#fff;padding:10px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:6px';
    var expTxt=new Date(res.expiresAt).toLocaleDateString('el-GR',{day:'numeric',month:'long',year:'numeric'});
    b.innerHTML='<div style="display:flex;gap:6px;margin-bottom:10px"><input id="kitchen-url" value="'+esc(url)+'" readonly style="flex:1;font-size:12px;padding:9px 10px;border:1px solid #c5ddd8;border-radius:8px;background:#f4f8f6;color:#014545" onclick="this.select()">'
      +'<button class="btn" style="background:#025857;color:#fff;border:1px solid #025857;white-space:nowrap" onclick="copyKitchenUrl(this)">Αντιγραφή</button></div>'
      +'<a href="https://wa.me/?text='+esc(encodeURIComponent(msg))+'" target="_blank" rel="noopener" style="'+aSt+';background:#25D366">📱 WhatsApp (επιλέγεις παραλήπτη)</a>'
      +'<a href="mailto:?subject='+esc(encodeURIComponent('Η κουζίνα της εβδομάδας'))+'&body='+esc(encodeURIComponent(msg))+'" style="'+aSt+';background:#025857">📧 Email</a>'
      +'<div style="font-size:11px;color:#9fb5b0;line-height:1.5">⏳ Λήγει στις <b>'+expTxt+'</b>. Όταν αλλάξεις κάποιο πλάνο, πάτα ξανά «🏠 Link κουζίνας» → «Ενημέρωση»: ο ίδιος σύνδεσμος ανανεώνεται.</div>';
  }).catch(function(e){
    var b=document.getElementById('kitchen-link-body');
    if(b) b.innerHTML='<div style="color:#c0392b;font-size:13px;margin-bottom:6px">❌ '+esc((e&&e.message)||'Σφάλμα δημιουργίας συνδέσμου')+'</div>'
      +'<button class="btn" style="width:100%;background:#E2EEE5;color:#014545;border:1px solid #c5ddd8" onclick="createKitchenLink()">🔗 Δοκίμασε ξανά</button>';
  });
}
function copyKitchenUrl(btn){
  var inp=document.getElementById('kitchen-url'); if(!inp) return;
  inp.select();
  try{ document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard) navigator.clipboard.writeText(inp.value).then(function(){},function(){});
  var o=btn.textContent; btn.textContent='✓ Αντιγράφηκε'; setTimeout(function(){ btn.textContent=o; },1500);
}

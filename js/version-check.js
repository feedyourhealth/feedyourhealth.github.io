// 🔄 Έλεγχος έκδοσης (2026-10-14). Το GitHub Pages κρατά κάθε αρχείο 10' στην cache, οπότε
// μετά από push ο browser μπορούσε να ανακατέψει παλιό Dietologist.html με νέα js (ή το ανάποδο)
// → «περίεργα» λάθη μέχρι Ctrl+F5. Τα <script>/<link> έχουν ?v=<hash> (scripts/stamp-version.py)
// και το <meta name="fyh-build"> λέει ποια έκδοση είναι αυτή η σελίδα. Εδώ τη συγκρίνουμε με το
// version.json (πάντα φρέσκο, no-store):
//   • στο άνοιγμα, αν η σελίδα είναι παλιά → ένα σιωπηλό reload σε ?v=<νέο> (νέο URL = όχι cache)·
//   • σε ανοιχτή εφαρμογή (κάθε 30' / όταν ξαναγυρνάς στην καρτέλα) → μπάρα «Ανανέωση», ποτέ αυτόματα.
// Τρέχει πρώτο (χωρίς defer), δεν εξαρτάται από τίποτα άλλο.
(function(){
  var meta = document.querySelector('meta[name="fyh-build"]');
  var mine = meta && meta.content;
  if(!mine || location.protocol === 'file:' || !window.fetch) return;
  var GUARD = 'fyh_build_reload', CHECK_EVERY = 30*60*1000, lastCheck = Date.now();

  function check(onNew){
    lastCheck = Date.now();
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ if(j && j.build && j.build !== mine) onNew(j.build); })
      .catch(function(){});
  }
  function freshUrl(build){
    var q = location.search.replace(/([?&])v=[^&]*&?/, '$1').replace(/[?&]$/, '');
    return location.pathname + (q ? q + '&' : '?') + 'v=' + build + location.hash;
  }
  function showBanner(build){
    if(document.getElementById('fyh-update-banner') || !document.body) return;
    var b = document.createElement('div');
    b.id = 'fyh-update-banner';
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:100000;'
      + 'background:#025857;color:#fff;padding:10px 12px 10px 16px;border-radius:12px;font-size:14px;'
      + 'box-shadow:0 6px 20px rgba(0,0,0,.25);display:flex;gap:10px;align-items:center;max-width:calc(100vw - 32px)';
    b.innerHTML = '<span>🔄 Υπάρχει νέα έκδοση της εφαρμογής.</span>'
      + '<button type="button" style="background:#fff;color:#025857;border:none;border-radius:8px;padding:7px 12px;font-weight:700;cursor:pointer">Ανανέωση</button>'
      + '<button type="button" aria-label="Αργότερα" title="Αργότερα" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer;opacity:.75">✕</button>';
    var btns = b.getElementsByTagName('button');
    btns[0].onclick = function(){
      // Τοπική αποθήκευση πριν φύγουμε· ό,τι δεν πρόλαβε το cloud το ανεβάζει το επόμενο άνοιγμα (fyh_local_dirty).
      try{ if(typeof saveNow === 'function') saveNow(); }catch(e){}
      location.replace(freshUrl(build));
    };
    btns[1].onclick = function(){ b.remove(); };
    document.body.appendChild(b);
  }

  // Στο άνοιγμα: σιωπηλό reload — εκτός αν είμαστε σε σύνδεσμο αλλαγής κωδικού (το #access_token
  // το καταναλώνει το supabase-js και θα χανόταν). Ένα reload ανά build ανά καρτέλα (όχι loop).
  check(function(build){
    var h = location.hash || '';
    var guard = null;
    try{ guard = sessionStorage.getItem(GUARD); }catch(e){}
    if(guard === build || h.indexOf('access_token') !== -1 || h.indexOf('type=recovery') !== -1){
      if(document.body) showBanner(build); else document.addEventListener('DOMContentLoaded', function(){ showBanner(build); });
      return;
    }
    try{ sessionStorage.setItem(GUARD, build); }catch(e){ return; }
    location.replace(freshUrl(build));
  });

  setInterval(function(){ if(document.visibilityState === 'visible') check(showBanner); }, CHECK_EVERY);
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'visible' && Date.now() - lastCheck > 10*60*1000) check(showBanner);
  });
})();

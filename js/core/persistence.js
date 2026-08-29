// js/core/persistence.js
// State persistence core, extracted from js/app-part1.js (module split wave 4).
// deepClone, safeStorageGet/Set, LOGGER; the debounced save (_doSave/save/saveNow +
// beforeunload flush); the multi-tab write lock (…_tabLockTick + its top-level start);
// rolling snapshots + restoreFromSnapshot/recoverSavedPlansFor; the File System Access
// backup-folder path; the auto-save / portal-poll intervals; exportData.
// Loads after data/* + lib/helpers.js + calc/plan-energy.js, before app-part1.js. Its
// runtime refs to clients/customTemplates/TMPLS/TRACKING_DATA resolve from app-part1.js
// globals by the time anything here is actually called.

function deepClone(obj){
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch(e){
    console.warn('[deepClone] failed, returning safe default:', e && e.message);
    return Array.isArray(obj) ? [] : (obj && typeof obj === 'object' ? {} : null);
  }
}

/* ── Safe Storage Wrappers ────────────────────────────────────────────────────
   Protects against: Safari private mode, quota exceeded, storage disabled
*/
function safeStorageGet(key, defaultVal) {
  try {
    var val = localStorage.getItem(getStorageKey(key));
    return val ? JSON.parse(val) : (defaultVal || null);
  } catch(e) {
    console.warn('⚠️ Storage read failed for key: ' + key, e.message);
    // ✅ PHASE 1: Better error reporting
    if(e.name === 'SyntaxError') {
      console.error('❌ Corrupted data for key: ' + key + '. Clearing and using defaults.');
      try {
        localStorage.removeItem(getStorageKey(key));
      } catch(clearErr) {
        console.error('Could not clear corrupted key', clearErr);
      }
    }
    return defaultVal || null;
  }
}

function safeStorageSet(key, val) {
  try {
    localStorage.setItem(getStorageKey(key), JSON.stringify(val));
    return true;
  } catch(e) {
    console.warn('⚠️ Storage write failed for key: ' + key, e.message);

    // ✅ PHASE 1: QUOTA EXCEEDED HANDLING
    if(e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      showErrorToast('❌ Χώρος αποθήκευσης ανεπαρκής. Διαγράψτε παλιά δεδομένα.');
      console.error('💾 localStorage quota exceeded. Current size:',
        Object.keys(localStorage).reduce(function(sum, key) {
          return sum + (localStorage.getItem(key) || '').length;
        }, 0) + ' bytes');
      return false;
    }

    // Data stays in memory but won't persist — tell the user instead of failing silently
    try { showErrorToast('❌ Η αποθήκευση απέτυχε: ' + (e.message || 'άγνωστο σφάλμα')); } catch(e2){}
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// LOGGER & VALIDATION SYSTEM — Error tracking, warnings, and data validation
// ═══════════════════════════════════════════════════════════════════════════════════

var LOGGER={
  errors:[],
  warnings:[],
  infos:[],

  // Log levels
  ERROR:function(msg,data){
    var entry={timestamp:new Date().toLocaleTimeString(),msg:msg,data:data,type:'ERROR'};
    this.errors.push(entry);
    console.error('[ERROR] '+msg,data||'');
    return entry;
  },

  WARN:function(msg,data){
    var entry={timestamp:new Date().toLocaleTimeString(),msg:msg,data:data,type:'WARN'};
    this.warnings.push(entry);
    console.warn('[WARN] '+msg,data||'');
    return entry;
  },

  INFO:function(msg,data){
    var entry={timestamp:new Date().toLocaleTimeString(),msg:msg,data:data,type:'INFO'};
    this.infos.push(entry);
    console.log('[INFO] '+msg,data||'');
    return entry;
  },

  DEBUG:function(msg,data){
    console.log('[DEBUG] '+msg,data||'');
  },

  // Get audit trail
  getAuditTrail:function(){
    return{
      errors:this.errors.slice(-20),
      warnings:this.warnings.slice(-20),
      infos:this.infos.slice(-20),
      total:{errors:this.errors.length,warnings:this.warnings.length,infos:this.infos.length}
    };
  },

  // Clear logs
  clear:function(){
    this.errors=[];this.warnings=[];this.infos=[];
  },

  // Export logs
  exportLogs:function(){
    return JSON.stringify(this.getAuditTrail(),null,2);
  }
};

// Data integrity check
/* ── Autosave system ──────────────────────────────────────────────────────────
   save()     = debounced 800ms — καλείται σε κάθε αλλαγή, δεν σπαταλά πόρους
   saveNow()  = άμεσα — για import/backup, beforeunload
   Toast "✓ Αποθηκεύτηκε" εμφανίζεται μετά από κάθε αποθήκευση
*/
var _saveTimer=null;
function _doSave(){
  // 🔒 CROSS-TAB LOCK: a tab that doesn't hold the edit lock never writes — see the lock
  // system below (_tabLockTick/_isLockOwner). Silently skipping here (instead of e.g.
  // throwing) is deliberate: reads/navigation must keep working in a read-only tab, only
  // persistence is suppressed.
  if(!_isLockOwner){
    console.warn('[LOCK] save skipped — this tab does not hold the edit lock (see cross-tab banner)');
    return;
  }
  var okClients=safeStorageSet('fyh_clients', clients);
  var okTmpls=safeStorageSet('fyh_custom_tmpls', customTemplates);
  try { localStorage.setItem('fyh_local_updated_at', new Date().toISOString()); } catch(e){}
  try { _rollingSnapshot(); } catch(e){ console.warn('[BACKUP] snapshot hook', e && e.message); }
  try { _writeFileBackup(false); } catch(e){ console.warn('[BACKUP] file hook', e && e.message); }
  try { if(window.Cloud) window.Cloud.save(); } catch(e){ console.warn('[CLOUD] save hook', e && e.message); }
  if(!okClients || !okTmpls) return; // storage write failed — safeStorageSet already told the user, don't also claim success
  var t=document.getElementById('autosave-toast');
  if(t){t.style.opacity='1';clearTimeout(t._ft);t._ft=setTimeout(function(){t.style.opacity='0';},1600);}
}
function save(){clearTimeout(_saveTimer);_saveTimer=setTimeout(_doSave,800);}
function saveNow(){clearTimeout(_saveTimer);_doSave();}
window.addEventListener('beforeunload',function(){
  saveNow();
  // Cloud.save() (called from _doSave above) only *schedules* a push 1500ms later — that
  // debounce almost never gets to fire before the tab actually tears down, so an edit made
  // right before closing/reloading can silently never reach the cloud (audit finding Ε3).
  // Bypass the debounce here and push immediately, fire-and-forget.
  try{ if(window.Cloud && typeof Cloud._pushNow==='function') Cloud._pushNow(); }catch(e){}
});

// ═══════════════════════════════════════════════════════════════════════════════════
// 🔒 CROSS-TAB EDIT LOCK (2026-08-04, audit finding Ε4 — actually fixed, not just flagged)
// Two open tabs on the same device used to both write the whole 'fyh_clients' array with no
// version check — whichever saved last silently erased the other's edits, with only a passive
// warning toast (no actual prevention). Now: exactly ONE tab may hold the "edit lock" at a
// time (tracked via a heartbeat in localStorage, since tabs can't otherwise coordinate). Any
// OTHER tab opened on the same device goes read-only automatically — _doSave() (above) refuses
// to persist anything while _isLockOwner is false — and shows a banner with a manual
// "Ανάλαβε εδώ" override for when the lock-holding tab was actually closed/crashed.
// ═══════════════════════════════════════════════════════════════════════════════════
var TAB_LOCK_KEY='fyh_active_tab_lock';
var TAB_LOCK_TICK_MS=4000;   // heartbeat renewal / stale-lock retry interval
var TAB_LOCK_STALE_MS=9000;  // >2 missed heartbeats ⇒ previous owner tab probably closed/crashed
var _tabId=Date.now().toString(36)+Math.random().toString(36).slice(2,8);
var _isLockOwner=false;

function _readTabLock(){
  try{ var raw=localStorage.getItem(TAB_LOCK_KEY); return raw?JSON.parse(raw):null; }catch(e){ return null; }
}
function _writeTabLock(){
  try{ localStorage.setItem(TAB_LOCK_KEY, JSON.stringify({tabId:_tabId, ts:Date.now()})); }catch(e){}
}
function _releaseTabLockIfOwner(){
  if(!_isLockOwner) return;
  try{
    var lock=_readTabLock();
    if(lock && lock.tabId===_tabId) localStorage.removeItem(TAB_LOCK_KEY);
  }catch(e){}
}

function _showTabLockBanner(){
  var b=document.getElementById('tab-lock-banner');
  if(!b){
    b=document.createElement('div');
    b.id='tab-lock-banner';
    b.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;background:#c62828;color:#fff;'
      +'padding:10px 16px;text-align:center;font-size:13px;font-weight:600;display:flex;'
      +'align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;box-shadow:0 2px 8px rgba(0,0,0,.25)';
    b.innerHTML='⚠️ Το Dietologist είναι ήδη ανοιχτό σε άλλη καρτέλα — εδώ είναι ΜΟΝΟ ΓΙΑ ΑΝΑΓΝΩΣΗ, οι αλλαγές ΔΕΝ αποθηκεύονται.'
      +' <button id="tab-lock-takeover-btn" style="background:var(--card-bg);color:#c62828;border:none;border-radius:6px;'
      +'padding:4px 10px;font-weight:700;cursor:pointer">Ανάλαβε εδώ</button>';
    document.body.appendChild(b);
    document.getElementById('tab-lock-takeover-btn').addEventListener('click', function(){
      // ✅ audit fix (2026-08-16): was native confirm() — the only spot in the app not using the
      // styled dialog everyone else uses (showConfirmDialog, app-part2.js), so it ignored dark mode
      // and looked out of place. showConfirmDialog is defined in app-part2.js, loaded before this
      // banner can ever be clicked (user interaction, not parse time), so it's always available here.
      showConfirmDialog('Αν αναλάβεις εδώ, η άλλη καρτέλα θα γίνει read-only. Τυχόν μη αποθηκευμένες αλλαγές εκεί θα χαθούν. Συνέχεια;', function(){
        _writeTabLock();
        _isLockOwner=true;
        _hideTabLockBanner();
      }, {title:'Ανάληψη καρτέλας', confirmLabel:'Ανάλαβε εδώ', icon:'⚠️'});
    });
  }
  b.style.display='flex';
}
function _hideTabLockBanner(){
  var b=document.getElementById('tab-lock-banner');
  if(b) b.style.display='none';
}

function _tabLockTick(){
  var lock=_readTabLock();
  var stale=!lock || (Date.now()-(lock.ts||0))>TAB_LOCK_STALE_MS;
  if(!lock || lock.tabId===_tabId || stale){
    // Free, ours already, or the previous owner went silent long enough to assume gone —
    // claim/renew it.
    _writeTabLock();
    if(!_isLockOwner){ _isLockOwner=true; _hideTabLockBanner(); }
  } else if(_isLockOwner){
    // We thought we were the owner but a fresher heartbeat from a different tab is present
    // (shouldn't normally happen since we renew every tick, but stay safe) — step down.
    _isLockOwner=false;
    _showTabLockBanner();
  } else {
    _showTabLockBanner();
  }
}
_tabLockTick();
setInterval(_tabLockTick, TAB_LOCK_TICK_MS);

// Near-instant reaction when ANOTHER tab explicitly clicks "Ανάλαβε εδώ" (don't wait for the
// next tick) — otherwise a just-preempted tab could still slip in one more save before noticing.
window.addEventListener('storage', function(e){
  if(e.key !== TAB_LOCK_KEY) return;
  var lock=_readTabLock();
  if(lock && lock.tabId!==_tabId && _isLockOwner){
    _isLockOwner=false;
    _showTabLockBanner();
    if(typeof showErrorToast === 'function'){
      showErrorToast('⚠️ Μια άλλη καρτέλα ανέλαβε την επεξεργασία εδώ.\nΑυτή η καρτέλα είναι πλέον μόνο για ανάγνωση.');
    }
  } else if(lock && lock.tabId===_tabId && !_isLockOwner){
    _isLockOwner=true;
    _hideTabLockBanner();
  }
});

window.addEventListener('beforeunload', _releaseTabLockIfOwner);

// ═══════════════════════════════════════════════════════════════════════════════════
// 🛡️ AUTOMATIC BACKUP SYSTEM
// Three layers of protection against data loss (cache-clear / corruption / mistakes):
//   1) Rolling in-app snapshots (instant restore, last 5)
//   2) Silent backups to a real disk folder (survives cache-clear) via File System Access
//   3) One-click restore
// ═══════════════════════════════════════════════════════════════════════════════════

// Canonical backup object shared by every backup path.
function _buildBackupObj(){
  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    clients: clients,
    customTemplates: customTemplates,
    trackingData: (typeof TRACKING_DATA !== 'undefined' ? TRACKING_DATA : null),
    totalClients: (clients ? clients.length : 0)
  };
}

// Lightweight signature to detect real changes (so we don't back up identical data).
function _dataSignature(){
  try { return clients.length + ':' + JSON.stringify(clients).length + ':' + JSON.stringify(customTemplates).length; }
  catch(e){ return String(Date.now()); }
}

// ── Layer 1: Rolling in-app snapshots ──────────────────────────────────────────────
var _BACKUP_SNAP_KEY = 'fyh_snapshots';
var _BACKUP_SNAP_MAX = 5;
var _lastSnapSig = null;

function _rollingSnapshot(){
  try {
    var sig = _dataSignature();
    if(sig === _lastSnapSig) return;             // nothing changed since last snapshot
    if(!clients || clients.length === 0) return; // never overwrite good snapshots with empty data
    var snaps = [];
    try { snaps = JSON.parse(localStorage.getItem(_BACKUP_SNAP_KEY)) || []; } catch(e){ snaps = []; }
    snaps.push({ ts: new Date().toISOString(), count: clients.length, sig: sig, data: _buildBackupObj() });
    while(snaps.length > _BACKUP_SNAP_MAX) snaps.shift();
    // Quota-safe write: if it doesn't fit, drop the oldest snapshot and retry.
    var ok = false;
    while(snaps.length && !ok){
      try { localStorage.setItem(_BACKUP_SNAP_KEY, JSON.stringify(snaps)); ok = true; }
      catch(e){ snaps.shift(); }
    }
    _lastSnapSig = sig;
  } catch(e){ console.warn('[BACKUP] snapshot failed', e && e.message); }
}

function restoreFromSnapshot(){
  var snaps = [];
  try { snaps = JSON.parse(localStorage.getItem(_BACKUP_SNAP_KEY)) || []; } catch(e){ snaps = []; }
  if(!snaps.length){ showErrorToast('Δεν υπάρχουν διαθέσιμα snapshots ακόμη.\nΘα δημιουργηθούν αυτόματα καθώς δουλεύετε.'); return; }
  var rev = snaps.slice().reverse(); // newest first
  var msg = 'Επιλέξτε snapshot για επαναφορά:\n\n';
  rev.forEach(function(s, i){
    msg += (i+1) + ') ' + new Date(s.ts).toLocaleString('el-GR') + '  —  ' + s.count + ' πελάτες\n';
  });
  msg += '\nΓράψτε τον αριθμό (1 = πιο πρόσφατο):';
  showPromptDialog(msg, '1', function(pick){
    var idx = parseInt(pick, 10);
    if(!(idx >= 1 && idx <= rev.length)){ showErrorToast('Άκυρη επιλογή.'); return; }
    var chosen = rev[idx-1];
    showConfirmDialog('⚠️ Θα αντικατασταθούν ΟΛΑ τα τρέχοντα δεδομένα με το snapshot της '
        + new Date(chosen.ts).toLocaleString('el-GR') + ' (' + chosen.count + ' πελάτες).\n\nΣυνέχεια;', function(){
      var d = chosen.data || {};
      clients = d.clients || [];
      customTemplates = d.customTemplates || [];
      if(d.trackingData && typeof TRACKING_DATA !== 'undefined') TRACKING_DATA = d.trackingData;
      _doSave();
      curId = null;
      if(typeof renderSB === 'function') renderSB();
      if(typeof renderMain === 'function') renderMain();
      showSuccessToast('✅ Επαναφορά ολοκληρώθηκε: ' + clients.length + ' πελάτες.');
    }, {confirmLabel:'Αντικατάσταση'});
  }, {title:'Επαναφορά από snapshot'});
}

// Στοχευμένη ανάκτηση: ψάχνει ΜΟΝΟ τα savedPlans ενός πελάτη μέσα στα τοπικά snapshots
// και τα προσθέτει πίσω, χωρίς να πειράξει κανέναν άλλο πελάτη ή δεδομένο (σε αντίθεση
// με το restoreFromSnapshot() που αντικαθιστά τα πάντα).
function recoverSavedPlansFor(clientId){
  var snaps=[];
  try{ snaps=JSON.parse(localStorage.getItem(_BACKUP_SNAP_KEY))||[]; }catch(e){ snaps=[]; }
  if(!snaps.length){ showErrorToast('Δεν βρέθηκαν τοπικά snapshots σε αυτόν τον υπολογιστή/browser.'); return; }
  var rev=snaps.slice().reverse(); // πιο πρόσφατο πρώτα
  var found=null;
  for(var i=0;i<rev.length;i++){
    var snapClients=(rev[i].data&&rev[i].data.clients)||[];
    var sc=null;
    for(var j=0;j<snapClients.length;j++){ if(snapClients[j].id===clientId){ sc=snapClients[j]; break; } }
    if(sc && sc.savedPlans && sc.savedPlans.length){ found={snap:rev[i],client:sc}; break; }
  }
  if(!found){ showErrorToast('Ελέγχθηκαν '+snaps.length+' τοπικά snapshots — κανένα δεν έχει αποθηκευμένα πλάνα για αυτόν τον πελάτη.'); return; }
  var c=getC();
  if(!c||c.id!==clientId){ showErrorToast('Σφάλμα: δεν βρέθηκε ο τρέχων πελάτης.'); return; }
  var existing=c.savedPlans||[];
  var existingIds={}; existing.forEach(function(p){existingIds[p.id]=true;});
  var toAdd=found.client.savedPlans.filter(function(p){return !existingIds[p.id];});
  if(!toAdd.length){ showErrorToast('Βρέθηκε snapshot της '+new Date(found.snap.ts).toLocaleString('el-GR')+', αλλά δεν έχει επιπλέον πλάνα από όσα ήδη υπάρχουν.'); return; }
  showConfirmDialog('Βρέθηκαν '+toAdd.length+' αποθηκευμένα πλάνα σε τοπικό snapshot της '+new Date(found.snap.ts).toLocaleString('el-GR')+' που λείπουν τώρα από τον πελάτη.\n\nΝα προστεθούν πίσω (δεν πειράζεται τίποτα άλλο σε κανέναν πελάτη);', function(){
    c.savedPlans=existing.concat(toAdd).sort(function(a,b){return (a.number||0)-(b.number||0);});
    save();
    var s4=document.getElementById('s4'); if(s4) s4.innerHTML=buildPlanHistoryHtml(c);
    showSuccessToast('✅ Επαναφέρθηκαν '+toAdd.length+' πλάνα από το snapshot της '+new Date(found.snap.ts).toLocaleString('el-GR')+'.');
  }, {confirmLabel:'Προσθήκη'});
}

// ── Layer 2: Silent backups to a real disk folder (File System Access API) ──────────
var _backupDirHandle = null;
var _BACKUP_DIR_DB = 'fyh_backup_db';
var _lastFileBackupSig = null;
var _lastFileBackupTime = 0;

function backupFolderSupported(){ return typeof window.showDirectoryPicker === 'function'; }

// Tiny IndexedDB helpers to remember the chosen folder across reloads.
function _idbGet(cb){
  try{
    var req = indexedDB.open(_BACKUP_DIR_DB, 1);
    req.onupgradeneeded = function(){ req.result.createObjectStore('h'); };
    req.onsuccess = function(){
      try{
        var tx = req.result.transaction('h','readonly');
        var g = tx.objectStore('h').get('dir');
        g.onsuccess = function(){ cb(g.result || null); };
        g.onerror = function(){ cb(null); };
      }catch(e){ cb(null); }
    };
    req.onerror = function(){ cb(null); };
  }catch(e){ cb(null); }
}
function _idbSet(val){
  try{
    var req = indexedDB.open(_BACKUP_DIR_DB, 1);
    req.onupgradeneeded = function(){ req.result.createObjectStore('h'); };
    req.onsuccess = function(){
      try{ req.result.transaction('h','readwrite').objectStore('h').put(val, 'dir'); }catch(e){}
    };
  }catch(e){}
}

function chooseBackupFolder(){
  if(!backupFolderSupported()){
    showErrorToast('Ο browser σας δεν υποστηρίζει αυτόματο backup σε φάκελο.\n\n'
      + 'Χρησιμοποιήστε «Αντίγραφο ασφαλείας (.json)» χειροκίνητα, ή ανοίξτε την εφαρμογή σε Chrome/Edge.');
    return;
  }
  window.showDirectoryPicker({ mode:'readwrite' }).then(function(handle){
    _backupDirHandle = handle;
    _idbSet(handle);
    _writeFileBackup(true);
    showSuccessToast('✅ Συνδέθηκε φάκελος backup.\n\nΑπό εδώ και πέρα αποθηκεύεται αυτόματα αντίγραφο σε κάθε αλλαγή '
      + '(Dietologist_Backup_latest.json + ημερήσιο αρχείο).');
  }).catch(function(e){ if(e && e.name !== 'AbortError') console.warn('[BACKUP] folder pick', e && e.message); });
}

function _ensureDirPermission(cb){
  if(!_backupDirHandle){ cb(false); return; }
  try{
    _backupDirHandle.queryPermission({ mode:'readwrite' }).then(function(p){
      if(p === 'granted'){ cb(true); return; }
      _backupDirHandle.requestPermission({ mode:'readwrite' })
        .then(function(p2){ cb(p2 === 'granted'); })
        .catch(function(){ cb(false); });
    }).catch(function(){ cb(false); });
  }catch(e){ cb(false); }
}

function _writeToDir(name, content){
  try{
    _backupDirHandle.getFileHandle(name, { create:true })
      .then(function(fh){ return fh.createWritable(); })
      .then(function(w){ return w.write(content).then(function(){ return w.close(); }); })
      .catch(function(e){ console.warn('[BACKUP] write ' + name, e && e.message); });
  }catch(e){ console.warn('[BACKUP] write ' + name, e && e.message); }
}

function _writeFileBackup(force){
  if(!_backupDirHandle) return;
  var sig = _dataSignature();
  var now = Date.now();
  if(!force && sig === _lastFileBackupSig) return;          // no change since last file backup
  if(!force && (now - _lastFileBackupTime) < 60000) return; // throttle: at most once per minute
  _ensureDirPermission(function(granted){
    if(!granted) return;
    var json = JSON.stringify(_buildBackupObj(), null, 2);
    _writeToDir('Dietologist_Backup_latest.json', json);                                  // always-current copy
    _writeToDir('Dietologist_Backup_' + new Date().toISOString().slice(0,10) + '.json', json); // daily rotating copy
    _lastFileBackupSig = sig;
    _lastFileBackupTime = now;
  });
}

// On load, silently restore the previously chosen folder handle (re-grant happens on next user click).
document.addEventListener('DOMContentLoaded', function(){
  if(!backupFolderSupported()) return;
  _idbGet(function(handle){ if(handle){ _backupDirHandle = handle; } });
});

// ═══════════════════════════════════════════════════════════════════════════════════
// AUTO-SAVE INTERVAL (Every 30 seconds)
// ═══════════════════════════════════════════════════════════════════════════════════
var _autoSaveInterval=null;
function startAutoSaveInterval(){
  if(_autoSaveInterval) clearInterval(_autoSaveInterval);
  _autoSaveInterval=setInterval(function(){
    // Save without user intervention
    _doSave();
    console.log('[AUTO-SAVE] Saved at ' + new Date().toLocaleTimeString());
  }, 30000);  // 30 seconds
}
function stopAutoSaveInterval(){
  if(_autoSaveInterval){
    clearInterval(_autoSaveInterval);
    _autoSaveInterval=null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// PORTAL-MESSAGE POLL INTERVAL (every 2 minutes, while logged in)
// ═══════════════════════════════════════════════════════════════════════════════════
// 2026-08-23: πριν, τα portal caches (client_logs/plan_feedback/checkins/link-health — ό,τι
// γράφει ο πελάτης από το δικό του link) ανανεώνονταν ΜΟΝΟ μία φορά στο login και όποτε ο
// διαιτολόγος πατούσε χειροκίνητα "🔄 Ανανέωση" — ούτε καν το άνοιγμα του "💬 Μηνύματα" tab ή
// του "📝 Ραντεβού" tab έκανε νέο fetch, απλά ξαναζωγράφιζε ό,τι ήδη υπήρχε στη μνήμη. Αν ο
// πελάτης έγραφε κάτι ενώ ο διαιτολόγος είχε ήδη ανοιχτή την εφαρμογή, δεν εμφανιζόταν πουθενά
// (badge/tab) μέχρι νέο login ή χειροκίνητη ανανέωση — αυτό ανέφερε ο χρήστης ως "μηνύματα που
// δεν φαίνονται". Κάθε refresh*Cache() ήδη ξανασχεδιάζει μόνο του ό,τι χρειάζεται όταν τελειώσει
// (renderSB/renderHome/#s3b, βλ. js/app-part2.js), οπότε αυτό το interval απλά τα ξανατρέχει
// περιοδικά στο παρασκήνιο — καμία αλλαγή στο ίδιο το UI αν δεν βρεθεί κάτι νέο.
var _portalPollInterval=null;
function startPortalPollInterval(){
  if(_portalPollInterval) clearInterval(_portalPollInterval);
  _portalPollInterval=setInterval(function(){
    if(!window.Cloud || !window.Cloud.enabled) return;
    if(typeof window.Cloud.refreshClientLogsCache==='function') window.Cloud.refreshClientLogsCache();
    if(typeof window.Cloud.refreshPlanFeedbackCache==='function') window.Cloud.refreshPlanFeedbackCache();
    if(typeof window.Cloud.refreshCheckinsCache==='function') window.Cloud.refreshCheckinsCache();
    if(typeof window.Cloud.refreshLinkHealthCache==='function') window.Cloud.refreshLinkHealthCache();
  }, 120000);  // 2 λεπτά
}
function stopPortalPollInterval(){
  if(_portalPollInterval){
    clearInterval(_portalPollInterval);
    _portalPollInterval=null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════════
// EXPORT/IMPORT FUNCTIONALITY
// ═══════════════════════════════════════════════════════════════════════════════════

function exportData(){
  // Create export object with timestamp
  var exportObj={
    version: '2.0',
    exportedAt: new Date().toISOString(),
    clients: deepClone(clients),  // Deep copy
    customTemplates: deepClone(customTemplates),
    trackingData: TRACKING_DATA || {},
    savedCombos: deepClone(safeStorageGet('savedCombos', [])),
    backupCount: (safeStorageGet('backup_count') || 0) + 1
  };

  // Create blob and download
  var dataStr=JSON.stringify(exportObj, null, 2);
  var blob=new Blob([dataStr], {type:'application/json'});
  var url=URL.createObjectURL(blob);
  var link=document.createElement('a');
  link.href=url;
  link.download='Dietologist_Backup_' + new Date().toISOString().split('T')[0] + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  // Show confirmation
  var t=document.getElementById('autosave-toast');
  if(t){
    t.innerHTML='✅ Δεδομένα εξαγωγής με επιτυχία';
    t.style.opacity='1';
    clearTimeout(t._ft);
    t._ft=setTimeout(function(){t.innerHTML='💾 Αυτόματη αποθήκευση...'; t.style.opacity='0';},2000);
  }

  console.log('[EXPORT] Created backup with ' + clients.length + ' clients');
}


// ✅ MICRONUTRIENTS MODAL — παλιά εκδοχή αφαιρέθηκε (dead code, ίδιο όνομα openMicroModal/closeMicroModal
// με το πραγματικό στο js/app-part4.js, το οποίο φορτώνει ΜΕΤΑ και σιωπηλά υπέγραφε αυτό εδώ — ίδιο
// πρότυπο με το confirmDialog duplicate ακριβώς από κάτω). Το ενεργό modal (#micro-modal, δημιουργείται
// δυναμικά) ζει στο js/app-part4.js openMicroModal()/closeMicroModal().

// ✅ TIER 2: CONFIRMATION DIALOG FUNCTIONS — υλοποιημένες πλέον στο js/app-part2.js
// (showConfirmDialog/closeConfirmDialog/executeConfirm). Αυτό εδώ ήταν παλιότερη εκδοχή που
// ποτέ δεν καλούνταν πουθενά (dead code, ίδιο id="confirmDialog" αλλά διαφορετική σειρά params)
// — αφαιρέθηκε γιατί φόρτωνε ΜΕΤΑ το app-part2.js και σιωπηλά υπέγραφε (override) τη σωστή έκδοση.

// ✅ TIER 2: ENHANCED TOAST NOTIFICATIONS
function showSuccessToast(message) {
  var toast = document.getElementById('successToast');
  document.getElementById('successToastText').textContent = message;
  toast.setAttribute('data-show', 'true');
  toast.style.display = 'block';

  // Auto-hide (5s — long enough for the multi-line confirmations toast now carries)
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(function() {
    toast.setAttribute('data-show', 'false');
    toast.style.display = 'none';
  }, 5000);
}

// ✅ MODIFIED DELETE CLIENT WITH CONFIRMATION
var _originalDeleteClient = deleteClient;
deleteClient = function(id) {
  var client = clients.find(function(c) { return c.id === id; });
  if(client) {
    showConfirmDialog(
      'Είστε σίγουρο ότι θέλετε να διαγράψετε τον πελάτη "' + (client.name || 'Unnamed') + '";\nΘα μεταφερθεί στους «Διαγραμμένοι» απ\' όπου μπορείς να τον ανακτήσεις όποτε θες.',
      function() {
        _originalDeleteClient(id);
        showSuccessToast('✓ Πελάτης διαγράφηκε με επιτυχία');
      },
      { title: 'Διαγραφή Πελάτη', icon: '🗑️' }
    );
  }
};

// Close confirmation dialog on overlay click
document.addEventListener('DOMContentLoaded', function() {
  var dialog = document.getElementById('confirmDialog');
  if(dialog) {
    dialog.addEventListener('click', function(e) {
      if (e.target === this) {
        closeConfirmDialog();
      }
    });
  }
});

// ✅ TIER 3: DARK MODE FUNCTIONS
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  var isDarkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('dietologist-dark-mode', isDarkMode ? '1' : '0');
  showSuccessToast(isDarkMode ? '🌙 Dark Mode ενεργοποιήθηκε' : '☀️ Light Mode ενεργοποιήθηκε');
}

function initializeDarkMode() {
  var isDarkMode = localStorage.getItem('dietologist-dark-mode') === '1';
  if(isDarkMode) {
    document.body.classList.add('dark-mode');
  }
}

// ✅ TIER 3: KEYBOARD SHORTCUTS
document.addEventListener('keydown', function(e) {
  // Check if user is typing in an input field
  var isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT';

  // Ctrl+N: New Client
  if(e.ctrlKey && e.key === 'n' && !isInput) {
    e.preventDefault();
    addClient();
    showSuccessToast('✨ Νέος πελάτης δημιουργήθηκε');
  }

  // Ctrl+S: Save (Auto-save is on, but provide visual feedback)
  if(e.ctrlKey && e.key === 's') {
    e.preventDefault();
    showSuccessToast('✓ Αποθηκεύτηκε (Αυτόματη αποθήκευση ενεργή)');
  }

  // Shift+D: Dark Mode Toggle
  if(e.shiftKey && e.key === 'D' && !isInput) {
    e.preventDefault();
    toggleDarkMode();
  }

  // Ctrl+P: Create Plan (routes through genPlanWithUndo so the shortcut gets
  // the same validation/undo-tracking as the button — see audit finding Ε1)
  if(e.ctrlKey && e.key === 'p' && !isInput) {
    e.preventDefault();
    if(!getC()) {
      showErrorToast('Παρακαλώ επιλέξτε πρώτα ένα πελάτη');
      return;
    }
    genPlanWithUndo();
  }

  // Ctrl+?: Show Help
  if(e.ctrlKey && e.key === '?' && !isInput) {
    e.preventDefault();
    toggleKeyboardHelp();
  }
});

function toggleKeyboardHelp() {
  var helpPanel = document.getElementById('keyboardHelpPanel');
  if(helpPanel) {
    helpPanel.style.display = helpPanel.style.display === 'block' ? 'none' : 'block';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeDarkMode();
});

// ✅ PHASE 2: SETTINGS PANEL FUNCTIONS
function toggleSettingsPanel() {
  var panel = document.getElementById('settingsPanel');
  if(panel.style.display === 'none') {
    updateSettingsPanelStats();
    panel.style.display = 'flex';
  } else {
    panel.style.display = 'none';
  }
}

function closeSettingsPanel() {
  document.getElementById('settingsPanel').style.display = 'none';
}

function updateSettingsPanelStats() {
  // Update statistics
  var totalPlans = clients.reduce(function(sum, c) {
    return sum + (c.savedPlans ? c.savedPlans.length : 0);
  }, 0);

  var totalBackups = Object.keys(localStorage).filter(function(key) {
    return key.startsWith('backup_');
  }).length;

  var storageSize = Object.keys(localStorage).reduce(function(sum, key) {
    return sum + (localStorage.getItem(key) || '').length;
  }, 0);

  document.getElementById('statClients').textContent = clients.length;
  document.getElementById('statPlans').textContent = totalPlans;
  document.getElementById('statBackups').textContent = totalBackups;
  document.getElementById('statStorage').textContent = (Math.round(storageSize / 1024 * 10) / 10) + ' KB';

  // Update preferences
  document.getElementById('prefDarkMode').checked = document.body.classList.contains('dark-mode');
  document.getElementById('prefAutoSave').value = localStorage.getItem('dietologist-autosave-interval') || '30';

  document.getElementById('clinicTel').value = localStorage.getItem('fyh-clinic-tel') || '';
  document.getElementById('clinicWa').value = localStorage.getItem('fyh-clinic-wa') || '';
  document.getElementById('clinicEmail').value = localStorage.getItem('fyh-clinic-email') || '';
}

function toggleDarkModeFromSettings() {
  toggleDarkMode();
}

// Αποθηκεύει τα στοιχεία επικοινωνίας τοπικά ΚΑΙ τα ενημερώνει άμεσα στο Cloud.CLINIC,
// ώστε η επόμενη δημοσίευση πλάνου (χωρίς reload) να τα περιλαμβάνει ήδη — βλ. audit finding Ε16.
function saveClinicContact() {
  var tel = document.getElementById('clinicTel').value.trim();
  var wa = document.getElementById('clinicWa').value.trim();
  var email = document.getElementById('clinicEmail').value.trim();
  localStorage.setItem('fyh-clinic-tel', tel);
  localStorage.setItem('fyh-clinic-wa', wa);
  localStorage.setItem('fyh-clinic-email', email);
  if (window.Cloud && Cloud.CLINIC) {
    Cloud.CLINIC.tel = tel;
    Cloud.CLINIC.wa = wa;
    Cloud.CLINIC.email = email;
  }
  // Σκανδάλισε cloud sync — το _pushNow() διαβάζει τα clinic πεδία από το Cloud.CLINIC (μόλις
  // ενημερώθηκε παραπάνω) και τα ανεβάζει μέσα στο ενιαίο user_data blob, ώστε να ταξιδεύουν
  // μεταξύ συσκευών όπως τα υπόλοιπα δεδομένα.
  try { if (typeof save === 'function') save(); } catch (e) {}
  // Η αποθήκευση γίνεται σιωπηλά σε κάθε onblur — χωρίς αυτό δεν υπάρχει καμία ένδειξη
  // ότι κάτι αποθηκεύτηκε, οπότε έμοιαζε "δεν σώζεται" παρόλο που η τιμή περνούσε κανονικά.
  if (typeof showSuccessToast === 'function') showSuccessToast('✓ Τα στοιχεία επικοινωνίας αποθηκεύτηκαν');
}

// ✅ PHASE 2: BACKUP SYSTEM
function createManualBackup() {
  try {
    var backup = {
      version: '3.0',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('el-GR'),
      clients: clients,
      customTemplates: window.customTemplates || [],
      settings: {
        darkMode: document.body.classList.contains('dark-mode'),
        autoSaveInterval: localStorage.getItem('dietologist-autosave-interval') || '30'
      }
    };

    var key = 'backup_' + Date.now();
    localStorage.setItem(key, JSON.stringify(backup));

    // Keep only last 7 backups
    var allBackups = Object.keys(localStorage)
      .filter(function(k) { return k.startsWith('backup_'); })
      .sort()
      .reverse();

    if(allBackups.length > 7) {
      for(var i = 7; i < allBackups.length; i++) {
        localStorage.removeItem(allBackups[i]);
      }
    }

    showSuccessToast('✓ Εφεδρικό αντίγραφο δημιουργήθηκε: ' + backup.date);
    updateSettingsPanelStats();
  } catch(e) {
    showErrorToast('❌ Σφάλμα δημιουργίας εφεδρικού αντιγράφου: ' + e.message);
  }
}

function exportAllDataAsJSON() {
  try {
    var exportData = {
      version: '3.0',
      exportDate: new Date().toISOString(),
      clients: clients,
      customTemplates: window.customTemplates || []
    };

    var jsonString = JSON.stringify(exportData, null, 2);
    var blob = new Blob([jsonString], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'dietologist_backup_' + Date.now() + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccessToast('✓ Δεδομένα εξάχθησαν με επιτυχία');
  } catch(e) {
    showErrorToast('❌ Σφάλμα εξαγωγής: ' + e.message);
  }
}

function showClearCacheConfirm() {
  showConfirmDialog(
    'Διαγραφή Προσωρινής Μνήμης',
    'Αυτό θα διαγράψει ΟΛΕΣ τις αποθηκευμένες πληροφορίες εκτός από τις εφεδρικές. Είστε σίγουρο;',
    '🗑️',
    function() {
      clearAppCache();
    }
  );
}

function clearAppCache() {
  try {
    var backupKeys = Object.keys(localStorage).filter(function(k) {
      return k.startsWith('backup_');
    });

    // Clear everything except backups
    Object.keys(localStorage).forEach(function(key) {
      if(!backupKeys.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    clients = [];
    curId = null;

    showSuccessToast('✓ Προσωρινή μνήμη διαγράφηκε. Σελίδα θα ανανεωθεί...');
    setTimeout(function() {
      location.reload();
    }, 1500);
  } catch(e) {
    showErrorToast('❌ Σφάλμα διαγραφής: ' + e.message);
  }
}

// Show settings panel button when dark mode is active
document.addEventListener('DOMContentLoaded', function() {
  var isDarkMode = localStorage.getItem('dietologist-dark-mode') === '1';
  var settingsToggle = document.getElementById('settingsToggle');
  if(isDarkMode && settingsToggle) {
    settingsToggle.style.display = 'block';
  }
});

// Close settings panel on overlay click
document.addEventListener('DOMContentLoaded', function() {
  var panel = document.getElementById('settingsPanel');
  if(panel) {
    panel.addEventListener('click', function(e) {
      if(e.target === this) {
        closeSettingsPanel();
      }
    });
  }
});

// ✅ PHASE 3: ACCESSIBILITY ENHANCEMENTS
function announceToScreenReaders(message) {
  // Create a live region for screen reader announcements
  var announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-9999px';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(function() {
    document.body.removeChild(announcement);
  }, 2000);
}

// Keyboard navigation for modals
document.addEventListener('keydown', function(e) {
  // ESC key closes modals
  if(e.key === 'Escape') {
    var confirmDialog = document.getElementById('confirmDialog');
    if(confirmDialog && confirmDialog.style.display !== 'none') {
      closeConfirmDialog();
    }

    var settingsPanel = document.getElementById('settingsPanel');
    if(settingsPanel && settingsPanel.style.display === 'flex') {
      closeSettingsPanel();
    }

    var microModal = document.getElementById('micro-modal');
    if(microModal && microModal.style.display === 'flex') {
      closeMicroModal();
    }

    var recipeModal = document.getElementById('recipe-modal');
    if(recipeModal && !recipeModal.classList.contains('hidden')) {
      closeRecipeModal();
    }

    var suppModal = document.getElementById('supp-modal');
    if(suppModal && suppModal.style.display === 'flex') {
      closeSupplementModal();
    }

    // Modals που κλείνουν με .remove() αντί για display toggle — απλά κλειδί/id lookup
    ['debug-modal','ref-modal','food-selector-modal','addMealSlotModal'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.remove();
    });
  }

  // Tab key focus management (optional enhancement)
  if(e.key === 'Tab') {
    var activeElement = document.activeElement;
    if(activeElement) {
      // Log focus for accessibility debugging
      if(window.DEBUG_ACCESSIBILITY) {
        console.log('Focused element:', activeElement.tagName, activeElement.id || activeElement.className);
      }
    }
  }
});

// Enable accessibility debugging mode (add ?debug=a11y to URL)
if(window.location.search.includes('debug=a11y')) {
  window.DEBUG_ACCESSIBILITY = true;
  console.log('🔍 Accessibility debugging enabled. Monitor tab/focus navigation.');
}

// ✅ BUSINESS SUITE: CLIENT PORTAL + PROGRESS + FEEDBACK + SHOPPING LIST

// Κρυπτογραφικά ασφαλές token (χρησιμοποιείται στα shareable links του client portal —
// είναι η μόνη προστασία δεδομένων υγείας πελάτη εκεί, οπότε ΔΕΝ πρέπει να παράγεται με Math.random()).
function genSecureToken(bytes) {
  var arr = new Uint8Array(bytes || 24);
  crypto.getRandomValues(arr);
  var s = ''; for (var i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// NOTE: rateMeal() is defined earlier (writes ratings to TRACKING_DATA so the
// Meal Stats dashboard can read them, and updates the 👍/👎 button colors).
// A second, inferior duplicate used to live here (wrote to c.mealFeedback and
// popped a prompt()); it overrode the real one and broke the dashboard feed, so
// it was removed.

// NOTE: The real weekly shopping list is generated inside the PDF/plan export
// (computed from the actual weekPlan, with cooked→raw conversion). The old
// standalone .txt generateShoppingList() here used hardcoded placeholder data
// and was never wired to any button — removed to avoid confusion.

// ═══════════════════════════════════════════════════════════════════
// 5B. MEDICAL CONDITIONS PROTOCOL SYSTEM
// ═══════════════════════════════════════════════════════════════════

// Define medical protocols for each condition with OFFICIAL SOURCES
var MEDICAL_PROTOCOLS = {
  diabetes: {
    name: 'Σακχαρώδης Διαβήτης',
    icon: '🩺',
    restrictions: {
      // ✅ 2026-08-01: added 'Μέλι' — concentrated sugar in the same vein as the 4 items already
      // here, but was missing, so raw honey appeared repeatedly (9x/week confirmed live) in
      // diabetic clients' plans unfiltered.
      avoidFoods: ['Σοκολάτα', 'Γλυκίσματα', 'Αναψυκτικά', 'Γλυκά δημητριακά', 'Μέλι'],
      reduceCarbs: true,
      carbPercentage: 40,
      increaseProtein: true,
      proteinPercentage: 35,
      preferFiber: true,
      minFiberGrams: 30
    },
    foodReplacements: {
      'Ρύζι λευκό': 'Ρύζι ολικής',
      'Ψωμί λευκό': 'Ψωμί ολικής',
      'Ζυμαρικά λευκά': 'Ζυμαρικά ολικής'
    },
    supplements: ['Μαγνήσιο', 'Χρώμιο', 'Ψευδάργυρος'],
    notes: 'Σταθερή ζάχαρη αίματος. Αποφύγετε γρήγορες αλλαγές γευμάτων.',
    sources: [
      { name: 'American Diabetes Association (ADA)', url: 'https://www.diabetes.org/nutrition', official: true },
      { name: 'NIH - Diabetes Nutrition Guidelines', url: 'https://www.niddk.nih.gov/health-information/diabetes', official: true },
      { name: 'WHO - Global Diabetes Recommendations', url: 'https://www.who.int/news-room/fact-sheets/detail/diabetes', official: true }
    ]
  },

  hypertension: {
    name: 'Υψηλή Πίεση (Υπέρταση)',
    icon: '❤️',
    restrictions: {
      maxSodium: 2300,
      avoidFoods: ['Αλάτι', 'Παστράμι', 'Ζαμπόν', 'Διάφορα ξηρά'],
      increaseKalium: true,
      minKaliumFoods: ['Μπανάνα', 'Ντομάτα', 'Σπανάκι', 'Σέλινο']
    },
    foodReplacements: {
      'Ψάρι αλατισμένο': 'Ψάρι φρέσκο',
      'Ζαμπόν': 'Κοτόπουλο φρέσκο'
    },
    supplements: ['Κάλιο', 'Μαγνήσιο', 'Ασβέστιο'],
    notes: 'Περιορίστε το αλάτι. Αυξήστε φρούτα και λαχανικά.',
    sources: [
      { name: 'American Heart Association (AHA)', url: 'https://www.heart.org/blood-pressure', official: true },
      { name: 'DASH Diet Official Site', url: 'https://www.nhlbi.nih.gov/health-topics/dash-eating-plan', official: true },
      { name: 'ACC - Blood Pressure Guidelines', url: 'https://www.acc.org/latest-in-cardiology/articles/2017/11/08/11/47/2017-acc-aha-guideline', official: true }
    ]
  },

  cholesterol: {
    name: 'Υψηλή Χοληστερόλη (Υπερχοληστερολαιμία)',
    icon: '🩸',
    restrictions: {
      avoidFoods: ['Κόκκινο κρέας', 'Επεξεργασμένα αλλαντικά (μπέικον, ζαμπόν, λουκάνικα)', 'Βούτυρο & κρέμα', 'Πλήρη γαλακτοκομικά', 'Φοινικέλαιο/Καρυδέλαιο', 'Τηγανητά & βιομηχανική ζαχαροπλαστική (trans λιπαρά)'],
      maxSaturatedFatPercentage: 7,
      avoidTransFat: true,
      preferUnsaturatedFat: true,
      preferSolubleFiber: true,
      minFiberGrams: 30,
      preferPhytosterols: true,
      minPhytosterolGrams: 2
    },
    foodReplacements: {
      'Βούτυρο': 'Ελαιόλαδο',
      'Κόκκινο κρέας': 'Ψάρι / Κοτόπουλο / Όσπρια',
      'Πλήρες γάλα': 'Ημίπαχο / Άπαχο γάλα',
      'Λευκά δημητριακά': 'Δημητριακά ολικής αλέσεως (βρώμη/κριθάρι)',
      'Σνακ/Πατατάκια': 'Ανάλατοι ξηροί καρποί'
    },
    supplements: ['Ω-3 (ιχθυέλαιο)', 'Διαλυτές ίνες / Ψύλλιο', 'Φυτικές στερόλες/στανόλες'],
    notes: 'Κορεσμένα λιπαρά <7% θερμίδων, μηδενικά trans. Αντικαταστήστε κορεσμένα με ακόρεστα (ελαιόλαδο, ξηροί καρποί, λιπαρά ψάρια). 25–30g ίνες/ημέρα με έμφαση σε διαλυτές (βρώμη, ψύλλιο, όσπρια) + ~2g φυτικές στερόλες/ημέρα.',
    sources: [
      { name: 'American Heart Association (AHA) — Saturated Fats', url: 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/saturated-fats', official: true },
      { name: 'NHLBI/NIH — Therapeutic Lifestyle Changes (TLC)', url: 'https://www.nhlbi.nih.gov/health/TLC-Therapeutic-Lifestyle-Changes-Lower-Cholesterol', official: true },
      { name: 'NCEP ATP III Guidelines (NIH)', url: 'https://www.nhlbi.nih.gov/files/docs/guidelines/atp3xsum.pdf', official: true }
    ]
  },

  celiac: {
    name: 'Κοιλιοκάκη',
    icon: '🌾',
    restrictions: {
      // Σκόπιμα αντλεί από το QUICK_EXCL['🌾 Γλουτένη'] (data.js) αντί για δική του λίστα — ήταν
      // δύο ξεχωριστές, αποκλίνουσες λίστες (η παλιά εδώ έλεγχε μόνο 'Σίτος'/'Κριθή'/'Σίκαλη'/'Ψωμί'/
      // 'Ζυμαρικά (κανονικά)' ως substring match, άφηνε Κυπριακή πίτα/Τορτίλια/Κους κους/Πλιγούρι/
      // Noodles να περάσουν αφιλτράριστα σε πραγματικό πλάνο — επιβεβαιωμένο). Γενικοί όροι ('Σίτος'
      // κ.λπ.) μένουν σαν επιπλέον ασφάλεια για μελλοντικές τροφές που δεν έχουν προλάβει να μπουν
      // στο QUICK_EXCL.
      avoidFoods: ['Σίτος', 'Κριθή', 'Σίκαλη', 'Ψωμί', 'Ζυμαρικά (κανονικά)'].concat(QUICK_EXCL['🌾 Γλουτένη'] || []),
      glutenFree: true
    },
    foodReplacements: {
      'Ψωμί': 'Ψωμί χωρίς γλουτένη',
      'Ζυμαρικά': 'Ζυμαρικά κινόας/ρυζιού',
      'Σίτος': 'Αμάρανθος / Κινόα / Ρύζι'
    },
    supplements: ['Σίδηρος', 'Ασβέστιο', 'Βιταμίνη Β12', 'Ψευδάργυρος'],
    notes: 'Απόλυτη αποφυγή γλουτένης. Ελέγξτε όλα τα επεξεργασμένα τρόφιμα.',
    sources: [
      { name: 'Celiac Disease Foundation', url: 'https://celiac.org/gluten-free-living/gluten-free-diet/', official: true },
      { name: 'American Gastroenterological Association', url: 'https://gastro.org/resource/celiac-disease/', official: true },
      { name: 'NIH Celiac Disease Info', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/celiac-disease', official: true }
    ]
  },

  ibs: {
    name: 'Σύνδρομο Ευερέθιστου Εντέρου (IBS)',
    icon: '🔴',
    restrictions: {
      avoidFoods: ['Μεγάλες ποσότητες λίπους', 'Φρυγανιές', 'Αερώδη ποτά'],
      smallFrequentMeals: true,
      mealsPerDay: 5,
      increaseIsolubileFiber: true
    },
    foodReplacements: {
      'Μεγάλα γεύματα': 'Μικρά, συχνά γεύματα',
      'Τηγανιτά': 'Βραστά/Ψητά'
    },
    supplements: ['Προβιοτικά', 'Ίνα', 'Σπιρουλίνα'],
    notes: 'Μικρά γεύματα κάθε 3-4 ώρες. Αποφύγετε γρήγορες αλλαγές διατροφής.',
    sources: [
      { name: 'American College of Gastroenterology', url: 'https://gi.org/topics/irritable-bowel-syndrome/', official: true },
      { name: 'Digestive Health Association', url: 'https://www.digestivehealth.org/ibs', official: true },
      { name: 'NIH IBS Information', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/irritable-bowel-syndrome', official: true }
    ]
  },

  lactose: {
    name: 'Δυσανεξία Λακτόζης',
    icon: '🥛',
    restrictions: {
      // ✅ 2026-08-01 fix: bare 'Γάλα' matched as a SUBSTRING (foodIsExcludedByNameOrIngredient),
      // so it was ALSO wrongly excluding the plant-milk replacements this same protocol recommends
      // below ('Γάλα αμυγδάλου'/'Γάλα σόγιας'/'Γάλα βρώμης' all contain 'Γάλα'). Replaced with the
      // two actual dairy-milk product names. Also added real cheese/yogurt items (φέτα, γιαούρτι,
      // ανθότυρο, μυζήθρα, etc.) — foodReplacements below already implied these needed a swap, but
      // they were never in avoidFoods (the array genPlan() actually filters against), so a lactose
      // client's plan could still fill up with feta/yogurt/soft cheese unfiltered (confirmed live:
      // 15 dairy hits across one week for a lactose-intolerant client).
      avoidFoods: ['Γάλα πλήρες', 'Γάλα φρέσκο 1.5% Λιπαρά', 'Κρέμα', 'Πάγωτο',
        'Γιαούρτι 2%', 'Γιαούρτι πλήρες 5%', 'Στραγγιστό γιαούρτι 0%',
        'Τυρί φέτα', 'Μοτσαρέλα', 'Ανθότυρο', 'Μυζήθρα',
        'Cottage cheese', 'Cream cheese', 'Γραβιέρα', 'Κασέρι', 'Κεφαλοτύρι',
        'Παρμεζάνα', 'Quark (0%)', 'Ricotta', 'Edam light', 'Σαγανάκι (τηγανητό)'],
      lactoseFree: true
    },
    foodReplacements: {
      'Γάλα': 'Φυτικό γάλα (αμύγδαλο, ρύζι, σόγια)',
      'Γιαούρτι': 'Γιαούρτι χωρίς λακτόζη',
      'Τυρί': 'Τυρί χαμηλής λακτόζης'
    },
    supplements: ['Ασβέστιο', 'Βιταμίνη D'],
    notes: 'Αποφύγετε το γάλα. Χρησιμοποιήστε φυτικές εναλλακτικές.',
    sources: [
      { name: 'National Institute of Health (NIH)', url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/lactose-intolerance', official: true },
      { name: 'American Gastroenterological Association', url: 'https://gi.org/topics/lactose-intolerance/', official: true },
      { name: 'Mayo Clinic - Lactose Intolerance', url: 'https://www.mayoclinic.org/diseases-conditions/lactose-intolerance/diagnosis-treatment/drc-20374232', official: true }
    ]
  },

  ironDeficiency: {
    name: 'Σιδηροπενία / Αναιμία (Αθλητές)',
    icon: '🔋',
    restrictions: {
      avoidFoods: [], // καμία τροφή προς αποκλεισμό — η καθοδήγηση αφορά χρονισμό/συνδυασμούς, όχι απαγόρευση
      preferIronRich: true
    },
    foodReplacements: {},
    supplements: ['Σίδηρος (θειούχος ή bisglycinate, κατόπιν εξέτασης φερριτίνης)', 'Βιταμίνη C (ενισχύει απορρόφηση σιδήρου)', 'Βιταμίνη Β12 (αν χαμηλή)'],
    notes: 'Συχνό σε αθλητές αντοχής (π.χ. δρομείς — "footstrike hemolysis") και γυναίκες αθλήτριες. Το λογισμικό ήδη αποφεύγει αυτόματα συνδυασμούς οσπρίων με τανίνες (καφές/τσάι) ή γαλακτοκομικά στο ίδιο γεύμα, που βελτιώνει την απορρόφηση σιδήρου. Ελέγξτε περιοδικά φερριτίνη σε αθλητές αντοχής υψηλού όγκου προπόνησης.',
    sources: [
      { name: 'Sim M, et al. "Iron considerations for the athlete: a narrative review." Eur J Appl Physiol. 2019', url: 'https://pubmed.ncbi.nlm.nih.gov/31055680/', official: true }
    ]
  },

  hydration: {
    name: 'Ενυδάτωση & Ηλεκτρολύτες (Αθλητές)',
    icon: '💧',
    restrictions: {
      avoidFoods: [], // καμία τροφή προς αποκλεισμό — αφορά στόχους υγρών/ηλεκτρολυτών
      hydrationFocus: true
    },
    foodReplacements: {},
    supplements: ['Νάτριο/Ηλεκτρολύτες (προπονήσεις >60 λεπτών ή έντονη εφίδρωση)', 'Ισοτονικό ρόφημα κατά τη διάρκεια παρατεταμένης άσκησης'],
    notes: 'Στόχος: αποφυγή απώλειας >2% σωματικού βάρους από υγρά κατά την άσκηση. Πριν: σταδιακή ενυδάτωση ώρες πριν. Κατά τη διάρκεια (>60 λεπτά, υψηλή ένταση): εξατομικευμένη αναπλήρωση λόγω μεγάλης διακύμανσης ρυθμού εφίδρωσης μεταξύ ατόμων.',
    sources: [
      { name: 'Sawka MN, et al. "ACSM Position Stand: Exercise and Fluid Replacement." Med Sci Sports Exerc. 2007', url: 'https://pubmed.ncbi.nlm.nih.gov/17277604/', official: true }
    ]
  },

  pregnancy: {
    name: 'Εγκυμοσύνη',
    icon: '🤰',
    restrictions: {
      // avoidFoods σκόπιμα κενό εκτός συκωτιού: η βάση τροφίμων FOODS δεν περιέχει αλλαντικά, ωμό
      // ψάρι/κρέας ή μη παστεριωμένα γαλακτοκομικά (είναι ήδη whole-foods βάση) — δεν υπάρχει τίποτα
      // ουσιαστικό να αποκλειστεί μηχανικά εκεί· η καθοδήγηση γι' αυτά είναι συμπεριφορική (βλ. notes)
      // και αφορά τη διαιτολόγο/πελάτισσα εκτός του παραγόμενου πλάνου.
      // ✅ 2026-08-26: το συκώτι ΠΡΟΣΤΕΘΗΚΕ ρητά μετά την προσθήκη 'Συκώτι μοσχαρίσιο (σχάρα/φούρνο)'
      // στη FOODS — εξαιρετικά υψηλή βιταμίνη Α (~9442 mcg RAE/100g, ~1000% DV), τερατογόνος κίνδυνος
      // σε υπερβολή· ACOG/NHS συστήνουν αποφυγή συκωτιού στην εγκυμοσύνη.
      avoidFoods: ['Συκώτι μοσχαρίσιο (σχάρα/φούρνο)'],
      maxCaffeineMg: 200
    },
    foodReplacements: {},
    supplements: ['Φυλλικό οξύ (600 μg/ημ.)', 'Σίδηρος (27 mg/ημ.)', 'Ασβέστιο (1000 mg/ημ.)', 'Ιώδιο (220 μg/ημ.)', 'Χολίνη (450 mg/ημ., ανώτατο όριο ασφαλείας 3500 mg/ημ.)', 'DHA (≥200 mg/ημ.)', 'Βιταμίνη D (600 IU/ημ.)'],
    notes: 'Ενεργειακή πρόσληψη: +0 kcal Α\' τρίμηνο, +340 kcal Β\' τρίμηνο, +452 kcal Γ\' τρίμηνο πάνω από το TDEE προ εγκυμοσύνης (IOM/DRI). Πρωτεΐνη-στόχος: 1.1 g/kg βάρους προ εγκυμοσύνης (~71g/ημ.). Καφεΐνη <200mg/ημέρα. Αλκοόλ: πλήρης αποφυγή. Αλλαντικά: μόνο καλά αναθερμασμένα (≥74°C, κίνδυνος λιστερίας). Ψάρια: 227-340g/εβδομάδα ποικιλίας χαμηλού υδραργύρου (σολομός/τόνος κονσέρβα εντάξει, όχι σε κάθε γεύμα). Άσκηση: αποφυγή υπερθέρμανσης (ειδικά Α\' τρίμηνο) και ύπτιας θέσης μετά τις 20 εβδομάδες.',
    sources: [
      { name: 'ACOG — Nutrition During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/healthy-eating-during-pregnancy', official: true },
      { name: 'National Academies — Nutrition During Pregnancy and Lactation (DRI for Energy)', url: 'https://www.nationalacademies.org/read/25841/chapter/3', official: true },
      { name: 'National Academies Press — Weight Gain During Pregnancy: Reexamining the Guidelines (IOM 2009)', url: 'https://nap.nationalacademies.org/read/12584/chapter/9', official: true },
      { name: 'WHO — Calcium Supplementation During Pregnancy for Prevention of Pre-eclampsia', url: 'https://www.who.int/publications/i/item/9789241550451', official: true },
      { name: 'CDC — Safer Food Choices for Pregnant Women', url: 'https://www.cdc.gov/food-safety/foods/pregnant-women.html', official: true },
      { name: 'ODS/NIH — Dietary Supplements and Life Stages: Pregnancy', url: 'https://ods.od.nih.gov/factsheets/Pregnancy-HealthProfessional/', official: true },
      { name: 'ACOG — Physical Activity and Exercise During Pregnancy', url: 'https://www.acog.org/womens-health/faqs/exercise-during-pregnancy', official: true }
    ]
  }
};

// Trimester-specific σημείωση (χρησιμοποιείται στο showMedicalProtocol όταν condition==='pregnancy' και
// υπάρχει ενεργός πελάτης με gestationalWeek — τα υπόλοιπα πεδία του πρωτοκόλλου παραμένουν σταθερά).
function getPregnancyTrimesterNote(week){
  var tri=(typeof getPregTrimester==='function')?getPregTrimester(week):null;
  if(tri===1) return 'Α\' τρίμηνο: το φυλλικό οξύ είναι κρίσιμο ΤΩΡΑ (κλείσιμο νευρικού σωλήνα, εβδ. 4-6) — δεν πρέπει να ξεκινά μετά τη διάγνωση. Ναυτία/έμετος συχνά: μικρά, συχνά γεύματα.';
  if(tri===2) return 'Β\' τρίμηνο: αυξημένη ανάγκη σιδήρου λόγω επέκτασης όγκου αίματος. Καλή στιγμή για σταθεροποίηση διατροφικών συνηθειών.';
  if(tri===3) return 'Γ\' τρίμηνο: καούρα/παλινδρόμηση συχνή — μικρότερα, συχνότερα γεύματα, αποφυγή ξάπλωσης αμέσως μετά το φαγητό.';
  return 'Συμπλήρωσε την εβδομάδα κύησης στη φόρμα πελάτη για συγκεκριμένη καθοδήγηση τριμήνου.';
}

// ✅ Κεντρική συνάρτηση ασφαλείας εγκυμοσύνης — τρέχει ΠΑΝΩ από οποιονδήποτε συνδυασμό dietType/άλλου
// ενεργού πρωτοκόλλου, αντί να διορθώνεται το κάθε πρωτόκολλο ξεχωριστά (π.χ. Διαβήτης+έγκυος+keto
// ταυτόχρονα πρέπει να ελέγχεται ενιαία). level: 'block' (χρειάζεται ρητή επιβεβαίωση διαιτολόγου πριν
// τη δημιουργία πλάνου), 'warn' (εμφανίζεται αλλά δεν μπλοκάρει), 'info' (μόνο στο πρωτόκολλο modal).
function getPregnancySafetyFlags(client){
  var flags=[];
  if(!client || !client.pregnant) return flags;
  var mc=client.medConditions||{};

  if(client.dietType==='keto'){
    flags.push({level:'block', msg:'Κετογονική δίαιτα + εγκυμοσύνη: δεν συστήνεται χωρίς στενή ιατρική παρακολούθηση — μελέτες δείχνουν ~30% αυξημένο κίνδυνο ανεγκεφαλίας/spina bifida σε χαμηλή πρόσληψη υδατανθράκων, πέρα από κίνδυνο ανεπάρκειας φυλλικού/μαγνησίου/βιταμινών Α&D. Το 60% των κλινικών δεν τη συστήνει σε εγκυμοσύνη.'});
  }
  if(client.dietType==='intermittent_fasting'){
    flags.push({level:'warn', msg:'Διαλείπουσα νηστεία + εγκυμοσύνη: τα δεδομένα είναι ηπιότερα απ\' ό,τι για την κετογονική (μικρή, οριακή μείωση βάρους γέννησης σε μετα-ανάλυση, όχι αυξημένος κίνδυνος χαμηλού βάρους) — αλλά παρατεταμένη νηστεία στο Α\' τρίμηνο αυξάνει κίνδυνο ναυτίας/αφυδάτωσης. Εξέτασε εναλλακτικό πρότυπο γευμάτων.'});
  }
  if(mc.diabetes){
    flags.push({level:'info', msg:'Διαβήτης + εγκυμοσύνη (πιθανό GDM): μην αφήσεις τους υδατάνθρακες κάτω από 175g/ημέρα (ελάχιστο ασφαλείας IOM/ADA για εγκέφαλο εμβρύου) ακόμα κι αν το πρωτόκολλο διαβήτη ζητά χαμηλότερο ποσοστό. Απόφυγε το Χρώμιο σε μορφή συμπληρώματος — ανεπαρκή δεδομένα ασφάλειας σε εγκυμοσύνη, προτίμησε πηγές από τροφή.'});
  }
  if(mc.hypertension){
    flags.push({level:'info', msg:'Υπέρταση + εγκυμοσύνη: ο περιορισμός νατρίου ΔΕΝ συστήνεται για πρόληψη/διαχείριση προεκλαμψίας (WHO) — μη σφίγγεις το αλάτι πέρα από τη γενική καθοδήγηση. Το Ασβέστιο (ήδη στο πρωτόκολλο υπέρτασης) είναι το τεκμηριωμένο μέτρο πρόληψης προεκλαμψίας.'});
  }
  if(mc.cholesterol){
    flags.push({level:'info', msg:'Χοληστερόλη + εγκυμοσύνη: απόφυγε Φυτικές στερόλες/στανόλες (δεν συστήνονται σε εγκυμοσύνη/θηλασμό, ανεπαρκή δεδομένα ασφάλειας). Χαλάρωσε την ένταση περιορισμού λίπους/κορεσμένων — η φυσιολογική άνοδος χοληστερόλης στην εγκυμοσύνη δεν χρειάζεται επιθετική διορθωτική δίαιτα, και τα λιπαρά/DHA είναι τώρα πιο σημαντικά.'});
  }
  if(mc.ibs){
    flags.push({level:'info', msg:'IBS + εγκυμοσύνη: Σπιρουλίνα μόνο από πιστοποιημένη, ελεγμένη πηγή (κίνδυνος μόλυνσης βαρέων μετάλλων/μικροκυστινών σε μη ελεγμένες πηγές) — Προβιοτικά/Ίνες παραμένουν ασφαλή.'});
  }
  return flags;
}

// Get protocol for a specific condition
function getProtocol(condition) {
  return MEDICAL_PROTOCOLS[condition] || null;
}

// Get all active protocols for a client
function getActiveProtocols(client) {
  var protocols = [];
  // ✅ Εγκυμοσύνη ρέει αυτόματα εδώ από c.pregnant (φόρμα πελάτη) — όχι ξεχωριστό checkbox
  // στο modal Ιατρικές Συνθήκες, ώστε να μην υπάρχουν δύο σημαίες που μπορούν να αποσυγχρονιστούν.
  if(client.pregnant){
    var pregProtocol = getProtocol('pregnancy');
    if(pregProtocol) protocols.push(pregProtocol);
  }
  if(!client.medConditions) return protocols;

  Object.keys(client.medConditions).forEach(function(condition) {
    if(client.medConditions[condition]) {
      var protocol = getProtocol(condition);
      if(protocol) protocols.push(protocol);
    }
  });

  return protocols;
}

// Union of avoidFoods across every active protocol (e.g. Διαβήτης + Χοληστερόλη at once) — feeds genPlan()'s exclusion list.
function getProtocolAvoidFoods(client) {
  var avoid = [];
  getActiveProtocols(client).forEach(function(protocol) {
    (protocol.restrictions.avoidFoods || []).forEach(function(food) {
      if (avoid.indexOf(food) === -1) avoid.push(food);
    });
  });
  return avoid;
}

// Sets the client's macro-% distribution (c.macroP/F/C) from any active protocol that specifies one
// (currently only Διαβήτης: carbPercentage/proteinPercentage). If more than one active protocol specifies
// a target, the most restrictive wins (lowest carb%, highest protein%; remainder to fat).
// This is a one-time starting point applied when protocols are saved — NOT continuously enforced,
// so the dietitian can freely edit it afterward in Κατανομή Μακροθρεπτικών without it snapping back.
// Returns true if it changed anything (so callers can tailor their confirmation message).
function applyProtocolMacros(client) {
  var carbCandidates = [], proteinCandidates = [];
  getActiveProtocols(client).forEach(function(protocol) {
    var r = protocol.restrictions || {};
    if (r.carbPercentage != null) carbCandidates.push(r.carbPercentage);
    if (r.proteinPercentage != null) proteinCandidates.push(r.proteinPercentage);
  });
  if (!carbCandidates.length && !proteinCandidates.length) return false;

  var carbPct = carbCandidates.length ? Math.min.apply(null, carbCandidates) : (client.macroC != null ? client.macroC : 50);
  var proteinPct = proteinCandidates.length ? Math.max.apply(null, proteinCandidates) : (client.macroP != null ? client.macroP : 25);

  // 🛡️ Το λιπαρό πρέπει να έχει minimum 10% (κλινικό κατώφλι) ΚΑΙ το άθροισμα να είναι πάντα
  // ακριβώς 100% — αν carbPct+proteinPct ξεπερνά το 90 (π.χ. δύο ενεργά πρωτόκολλα μαζί με
  // υψηλά και τα δύο %), τα δύο αυτά ποσοστά scale down αναλογικά ώστε να χωρέσει το λιπαρό
  // floor, αντί να αφήσουμε το άθροισμα να ξεφύγει πάνω από 100%. Χωρίς αυτό, το εμφανιζόμενο
  // "Υ:X%" θα διαφωνούσε με τα πραγματικά γραμμάρια carbs — το calcTDEE υπολογίζει πάντα τους
  // carbs ως υπόλοιπο θερμίδων (target-πρωτεΐνη-λιπαρά), όχι από το ίδιο το αποθηκευμένο %.
  var fatPct = 100 - carbPct - proteinPct;
  if (fatPct < 10) {
    var pctSum = carbPct + proteinPct;
    fatPct = 10;
    carbPct = pctSum > 0 ? Math.round(90 * carbPct / pctSum) : 45;
    proteinPct = 90 - carbPct;
  }

  client.macroPreset = 'custom';
  client.macroP = proteinPct;
  client.macroC = carbPct;
  client.macroF = fatPct;
  return true;
}

// Lowest carbPercentage among all active protocols (most restrictive), or null if none define one.
// Used to cap carb-loading (see makeDayTgtDefaults in app-part2.js) so an event-prep carb boost never
// silently exceeds a clinical limit — e.g. Διαβήτης — on those days. The protocol always wins.
function getProtocolCarbCapPct(client) {
  var candidates = [];
  getActiveProtocols(client).forEach(function(protocol) {
    var r = protocol.restrictions || {};
    if (r.carbPercentage != null) candidates.push(r.carbPercentage);
  });
  return candidates.length ? Math.min.apply(null, candidates) : null;
}

// Show medical protocol details with official sources
function showMedicalProtocol(condition) {
  var protocol = getProtocol(condition);
  if(!protocol) {
    showErrorToast('Δεν βρέθηκε πρωτόκολο για: ' + condition);
    return;
  }

  var html = '<div style="padding:20px;max-width:600px;font-family:Arial,sans-serif;">';
  html += '<h3 style="color:#025857;margin-top:0;border-bottom:3px solid #E2EEE5;padding-bottom:10px;">' + protocol.icon + ' ' + protocol.name + '</h3>';

  // ✅ ΕΓΚΥΜΟΣΥΝΗ: δυναμικό μπλοκ τριμήνου βάσει της εβδομάδας κύησης του ενεργού πελάτη
  if(condition==='pregnancy'){
    var pc=getC();
    if(pc && pc.pregnant){
      var pt=calcTDEE(pc);
      html += '<div style="background:#E2EEE5;padding:12px;border-radius:6px;margin-bottom:15px;">';
      html += '<strong style="color:#025857;">'+esc(getPregTrimesterLabel(pc.gestationalWeek)||'Τρίμηνο άγνωστο')+'</strong>';
      html += '<div style="display:flex;gap:16px;margin-top:6px;font-size:13px;color:var(--text-strong);">';
      html += '<span>Επιπλέον θερμίδες: <strong>+'+(pt.pregAdd||0)+' kcal</strong></span>';
      html += '<span>Στόχος: <strong>'+pt.target+' kcal</strong> · Π:'+pt.p+'g</span>';
      html += '</div>';
      html += '<div style="margin-top:8px;font-size:12px;color:var(--text-strong);line-height:1.5;">'+esc(getPregnancyTrimesterNote(pc.gestationalWeek))+'</div>';
      html += '</div>';

      var pFlags=(typeof getPregnancySafetyFlags==='function')?getPregnancySafetyFlags(pc):[];
      if(pFlags.length>0){
        html += '<div style="margin-bottom:15px;"><strong style="color:var(--text-strong);font-size:13px;">🔗 Αλληλεπιδράσεις με άλλα ενεργά πρωτόκολλα/ρυθμίσεις:</strong>';
        pFlags.forEach(function(f){
          var bg=f.level==='block'?'#fdecea':(f.level==='warn'?'#fff3e0':'#f5f5f5');
          var bd=f.level==='block'?'#d32f2f':(f.level==='warn'?'#ff9800':'#999');
          var ic=f.level==='block'?'🚫':(f.level==='warn'?'⚠️':'ℹ️');
          html += '<div style="background:'+bg+';border-left:4px solid '+bd+';padding:8px 10px;border-radius:4px;margin-top:6px;font-size:12px;color:var(--text-strong);line-height:1.5;">'+ic+' '+esc(f.msg)+'</div>';
        });
        html += '</div>';
      }

      var wg=(typeof checkGestationalWeightGain==='function')?checkGestationalWeightGain(pc):null;
      if(wg){
        var wgBg=wg.status==='above'?'#fdecea':(wg.status==='below'?'#fff3e0':'#e8f5e9');
        var wgBd=wg.status==='above'?'#d32f2f':(wg.status==='below'?'#ff9800':'#4caf50');
        var wgTxt=wg.status==='above'?'Πάνω από το συνολικό εύρος IOM':(wg.status==='below'?'Κάτω από το αναμενόμενο κοντά στον τοκετό':'Εντός εύρους IOM');
        html += '<div style="background:'+wgBg+';border-left:4px solid '+wgBd+';padding:10px 12px;border-radius:4px;margin-bottom:15px;font-size:12px;color:var(--text-strong);">';
        html += '<strong>⚖️ Αύξηση βάρους κύησης:</strong> '+wg.gained+' kg μέχρι τώρα (ΔΜΣ προ εγκυμοσύνης '+wg.bmi+' — '+wg.range.label+', εύρος IOM '+wg.range.min+'-'+wg.range.max+' kg) — <strong>'+wgTxt+'</strong>';
        html += '</div>';
      }
    }
  }

  // RESTRICTIONS (some protocols, e.g. sports supplement/education-only ones, have nothing to avoid)
  if(protocol.restrictions.avoidFoods && protocol.restrictions.avoidFoods.length > 0) {
    html += '<div style="margin-bottom:15px;"><strong style="color:#d32f2f;">🚫 Αποφύγετε:</strong>';
    html += '<ul style="margin:8px 0;color:var(--text-strong);">';
    protocol.restrictions.avoidFoods.forEach(function(food) {
      html += '<li style="margin:4px 0;">' + food + '</li>';
    });
    html += '</ul></div>';
  }

  // FOOD REPLACEMENTS
  if(protocol.foodReplacements && Object.keys(protocol.foodReplacements).length > 0) {
    html += '<div style="margin-bottom:15px;background:var(--panel-bg);padding:10px;border-radius:6px;"><strong style="color:#0277bd;">🔄 Αντικαταστάσεις τροφίμων:</strong>';
    html += '<ul style="margin:8px 0;color:var(--text-strong);">';
    Object.keys(protocol.foodReplacements).forEach(function(original) {
      html += '<li style="margin:4px 0;"><em>"' + original + '"</em> → <strong>"' + protocol.foodReplacements[original] + '"</strong></li>';
    });
    html += '</ul></div>';
  }

  // SUPPLEMENTS
  if(protocol.supplements && protocol.supplements.length > 0) {
    html += '<div style="margin-bottom:15px;"><strong style="color:#388e3c;">💊 Συνιστώμενα συμπληρώματα:</strong>';
    html += '<ul style="margin:8px 0;color:var(--text-strong);">';
    protocol.supplements.forEach(function(supp) {
      html += '<li style="margin:4px 0;">' + supp + '</li>';
    });
    html += '</ul></div>';
  }

  // NOTES
  html += '<div style="background:#e8f5e9;padding:12px;border-left:4px solid #4caf50;margin-bottom:15px;border-radius:4px;">';
  html += '<strong style="color:#1b5e20;">📋 Σημειώσεις:</strong><br>';
  html += '<span style="color:#2e7d32;line-height:1.6;">' + protocol.notes + '</span>';
  html += '</div>';

  // OFFICIAL SOURCES
  if(protocol.sources && protocol.sources.length > 0) {
    html += '<div style="background:#e3f2fd;padding:12px;border-left:4px solid #2196f3;border-radius:4px;">';
    html += '<strong style="color:#0d47a1;">📚 Επίσημες Πηγές:</strong>';
    html += '<ul style="margin:8px 0;color:#0d47a1;">';
    protocol.sources.forEach(function(source) {
      html += '<li style="margin:6px 0;">';
      html += '<a href="' + source.url + '" target="_blank" rel="noopener noreferrer" style="color:#1976d2;text-decoration:none;font-weight:500;">';
      html += source.name + ' ↗';
      html += '</a>';
      html += ' <span style="color:var(--text-muted);font-size:11px;">[Επίσημη πηγή]</span>';
      html += '</li>';
    });
    html += '</ul>';
    html += '<small style="color:#555;margin-top:8px;display:block;">Κλικ για πρόσβαση στις επίσημες κατευθύνσεις</small>';
    html += '</div>';
  }

  // DISCLAIMER
  html += '<div style="background:#fff3e0;padding:10px;border-left:4px solid #ff9800;margin-top:15px;border-radius:4px;font-size:12px;color:#666;">';
  html += '<strong style="color:#e65100;">⚠️ ΣΗΜΑΝΤΙΚΟ:</strong><br>';
  html += 'Αυτές οι κατευθύνσεις βασίζονται σε επίσημες οργανώσεις υγείας. Συμβουλευθείτε πάντα έναν ιατρό πριν αλλάξετε τη διατροφή του πελάτη.';
  html += '</div>';

  html += '</div>';

  // ✅ FIX #3: Clean up old modals before creating new one (prevents memory leak)
  var oldOverlay = document.querySelector('[data-medical-modal-overlay]');
  var oldModal = document.querySelector('[data-medical-modal]');
  if (oldOverlay && oldOverlay.parentNode) oldOverlay.parentNode.removeChild(oldOverlay);
  if (oldModal && oldModal.parentNode) oldModal.parentNode.removeChild(oldModal);

  // Use modal instead of alert for better display
  var modalDiv = document.createElement('div');
  modalDiv.setAttribute('data-medical-modal', 'true');
  modalDiv.innerHTML = html;
  modalDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--card-bg);padding:0;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:9999;max-height:90vh;overflow-y:auto;width:90%;max-width:650px;';

  // Close button
  var closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕ Κλείσιμο';
  closeBtn.style.cssText = 'position:absolute;top:10px;right:10px;background:#ff6b35;color:white;border:none;padding:8px 15px;border-radius:4px;cursor:pointer;font-weight:bold;';
  closeBtn.onclick = function() {
    if (overlay.parentNode) document.body.removeChild(overlay);
    if (modalDiv.parentNode) document.body.removeChild(modalDiv);
  };
  modalDiv.appendChild(closeBtn);

  // Overlay
  var overlay = document.createElement('div');
  overlay.setAttribute('data-medical-modal-overlay', 'true');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9998;';
  overlay.onclick = function() {
    if (overlay.parentNode) document.body.removeChild(overlay);
    if (modalDiv.parentNode) document.body.removeChild(modalDiv);
  };

  document.body.appendChild(overlay);
  document.body.appendChild(modalDiv);
}

// Apply medical protocols when checkbox changes
function applyMedicalProtocol(condition, isChecked) {
  var c = getC();
  if(!c) return;

  var protocol = getProtocol(condition);
  if(!protocol) return;

  if(isChecked) {
    showSuccessToast('✅ ' + protocol.icon + ' ' + protocol.name + ' ενεργοποιήθηκε');
  } else {
    showSuccessToast('❌ ' + protocol.icon + ' ' + protocol.name + ' απενεργοποιήθηκε');
  }

  // If there's an active plan, show recommendation to regenerate
  if(c.weekPlan && c.weekPlan.length > 0) {
    var msg = protocol.icon + ' ' + protocol.name + ' ενεργοποιήθηκε.\n\n';
    msg += 'Θέλετε να δημιουργήσετε νέο πλάνο με αυτό το πρωτόκολο;';
    showConfirmDialog(msg, function(){
      genPlanWithUndo();
    }, {icon: protocol.icon, confirmLabel:'Δημιουργία'});
  }
}

// 5. Generate progress report
// ✅ IMPROVED UX: FAB Menu Toggle
function fabMenu(){
  var menu = document.getElementById('fab-menu');
  // ✅ 2026-08-06: η σελίδα Πελάτες έχει πλέον δικό της "+ Νέος πελάτης" κουμπί στο toolbar (βλ.
  // renderClients, js/client-list/clients-tab.js) — η ίδια γραμμή εδώ μέσα είναι διπλότυπη ΜΟΝΟ όσο είσαι ήδη
  // εκεί. Σε κάθε άλλο tab (Αρχική/Διατροφές/Συνταγές/προφίλ πελάτη) παραμένει η μοναδική γρήγορη
  // πρόσβαση, οπότε δεν αφαιρείται ολόκληρη — κρύβεται μόνο όταν είναι πράγματι περιττή. Το
  // #client-list υπάρχει στο DOM μόνο όσο είναι ανοιχτή η λίστα Πελάτες (renderMain/renderHome/κ.λπ.
  // αντικαθιστούν ολόκληρο το #main όταν φεύγεις από εκεί).
  var newClientBtn = document.getElementById('fab-menu-newclient');
  if(newClientBtn) newClientBtn.style.display = document.getElementById('client-list') ? 'none' : '';
  if(menu.style.display === 'none' || !menu.style.display){
    menu.style.display = 'block';
  } else {
    menu.style.display = 'none';
  }
}

// Close FAB menu when clicking elsewhere. Two different buttons open this same menu — the
// circular "+" (#fab-btn) and the "⋯" quick-actions button (#fab-btn-alt) shown instead of it on
// the plan tab (see swTab()) — so a click on either must count as "inside", not just the first one.
document.addEventListener('click', function(e){
  var fab = document.getElementById('fab-btn');
  var fabAlt = document.getElementById('fab-btn-alt');
  var menu = document.getElementById('fab-menu');
  var insideTrigger = (fab && fab.contains(e.target)) || (fabAlt && fabAlt.contains(e.target));
  if(!insideTrigger && !menu.contains(e.target)){
    menu.style.display = 'none';
  }
});

// ✅ IMPROVED UX: Update Breadcrumbs
function updateBreadcrumbs(){
  var c = getC();
  var bc = document.getElementById('breadcrumbs');
  var current = document.getElementById('breadcrumb-current');

  // ✅ Safety checks - breadcrumbs may not exist in all layouts
  if(!bc || !current) return;

  if(c){
    bc.style.display = 'flex';
    current.textContent = '👤 ' + (c.name || 'Πελάτης');
  } else {
    bc.style.display = 'none';
  }
}

// ✅ IMPROVED UX: Onboarding Tour (first time only)
function initOnboarding(){
  if(localStorage.getItem('dietologist-tour-done')) return;

  // Show onboarding tooltip after 1 second
  setTimeout(function(){
    showSuccessToast('💡 Tip: Πάτα το + για γρήγορες ενέργειες!');
    localStorage.setItem('dietologist-tour-done', 'true');
  }, 1000);
}

// ✅ IMPROVED UX: Smooth animations for client cards
// ✅ IMPROVED UX: Show onboarding on first load
// ✅ SUPPLEMENT SELECTOR (Page 1)
// Single shared source for the "already taking" quick-pick list — was previously
// duplicated (with independently-editable dosage strings) in both
// toggleSupplementSelector() and savePage1Supplements().
var COMMON_SUPPS = [
  { name: 'Πολυβιταμίνη', dosage: '1 δισκίο/ημέρα', timing: 'πρωί με φαγητό' },
  { name: 'Βιταμίνη D3', dosage: '1000-2000 IU/ημέρα', timing: 'πρωί με φαγητό' },
  { name: 'Ωμέγα-3', dosage: '1000-2000 mg/ημέρα', timing: 'με φαγητό' },
  { name: 'Μαγνήσιο', dosage: '300-400 mg/ημέρα', timing: 'βράδυ' },
  { name: 'Ασβέστιο', dosage: '800-1000 mg/ημέρα', timing: 'με φαγητό' },
  { name: 'Σίδηρος', dosage: '18 mg/ημέρα', timing: 'πρωί χωρίς καφές' },
  { name: 'Ψευδάργυρος', dosage: '10-15 mg/ημέρα', timing: 'με φαγητό' },
  { name: 'Βιταμίνη B12', dosage: '1000 mcg/εβδομάδα', timing: 'οποιαδήποτε ώρα' },
  { name: 'Κρεατίνη', dosage: '5 g/ημέρα', timing: 'με γεύμα' },
  { name: 'Πρωτεΐνη Σκόνη', dosage: '25-50 g/ημέρα', timing: 'μετά την άσκηση' }
];

// ✅ NEW: Combined supplements modal (merges current + recommended)
function openCombinedSupplementsModal() {
  toggleSupplementSelector(); // Use existing logic
}

function toggleSupplementSelector() {
  var c = getC();
  if (!c) {
    showErrorToast('Δημιουργήστε πρώτα έναν πελάτη');
    return;
  }

  // Create modal if not exists
  var modal = document.getElementById('supp-selector-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'supp-selector-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;z-index:2000;';
    document.body.appendChild(modal);
  }

  // Build HTML with supplement checkboxes
  var suppListHtml = '<div style="background:var(--card-bg);border-radius:10px;padding:25px;max-width:600px;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3);">';
  suppListHtml += '<h2 style="color:#025857;margin:0 0 15px 0;">💊 Συμπληρώματα που Παίρνει Ήδη ο Πελάτης</h2>';
  suppListHtml += '<p style="color:#666;font-size:12px;margin:0 0 15px 0;">Τικάρετε ό,τι χρησιμοποιεί ήδη τακτικά. Για προτάσεις νέων συμπληρωμάτων βάσει του πλάνου, δες «💊» στο «Πλάνο» — και τα δύο εμφανίζονται μαζί στο PDF.</p>';

  // List common supplements
  var commonSupps = COMMON_SUPPS;

  suppListHtml += '<div style="display:grid;gap:10px;margin:15px 0;">';

  commonSupps.forEach(function(supp, idx) {
    var isSelected = c.selectedSupplements && c.selectedSupplements.some(function(s) { return s.supplement === supp.name; });
    suppListHtml += '<label style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:var(--panel-bg);border-radius:6px;cursor:pointer;border:2px solid '+(isSelected?'#025857':'#ddd')+';transition:all 0.2s;">';
    suppListHtml += '<input type="checkbox" id="supp-cb-'+idx+'" '+(isSelected?'checked':'')+' style="width:18px;height:18px;cursor:pointer;margin-top:2px;">';
    suppListHtml += '<div style="flex:1;">';
    suppListHtml += '<div style="font-weight:600;color:var(--text-strong);">'+supp.name+'</div>';
    suppListHtml += '<div style="font-size:11px;color:#666;">📋 '+supp.dosage+'</div>';
    suppListHtml += '<div style="font-size:11px;color:var(--text-muted);">⏰ '+supp.timing+'</div>';
    suppListHtml += '</div>';
    suppListHtml += '</label>';
  });

  suppListHtml += '</div>';
  suppListHtml += '<div style="display:flex;gap:10px;margin-top:20px;border-top:1px solid #ddd;padding-top:15px;">';
  suppListHtml += '<button onclick="savePage1Supplements()" style="flex:1;background:#025857;color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;">✓ Αποθήκευση</button>';
  suppListHtml += '<button onclick="closePage1SupplementSelector()" style="flex:1;background:#999;color:white;border:none;padding:12px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;">✕ Κλείσιμο</button>';
  suppListHtml += '</div>';
  suppListHtml += '</div>';

  modal.innerHTML = suppListHtml;
  modal.style.display = 'flex';

  // Close on overlay click
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closePage1SupplementSelector();
  });
}

function closePage1SupplementSelector() {
  var modal = document.getElementById('supp-selector-modal');
  if (modal) modal.style.display = 'none';
}

function savePage1Supplements() {
  var c = getC();
  if (!c) return;

  var checkboxes = document.querySelectorAll('#supp-selector-modal input[type="checkbox"]:checked');
  var selectedSupps = [];

  // Common supplements data
  var commonSupps = COMMON_SUPPS;

  checkboxes.forEach(function(cb) {
    var id = cb.id.replace('supp-cb-', '');
    var supp = commonSupps[id];
    if (supp) {
      selectedSupps.push({
        supplement: supp.name,
        dose: supp.dosage,
        info: ''
      });
    }
  });

  // ✅ Merge instead of overwrite: this modal only knows about the fixed "already taking"
  // list above, so keep whatever the plan-based suggestions modal (Tab 2, "💊" in Εβδομαδιαίο
  // πλάνο) already saved for names outside that list — otherwise saving here would silently
  // wipe out those recommendations from c.selectedSupplements.
  var thisModalNames = commonSupps.map(function(s) { return s.name; });
  var keepFromOther = (c.selectedSupplements || []).filter(function(s) {
    return thisModalNames.indexOf(s.supplement) === -1;
  });
  c.selectedSupplements = keepFromOther.concat(selectedSupps);
  save();
  closePage1SupplementSelector();

  showSuccessToast('✓ Συμπληρώματα αποθηκεύτηκαν!');
}

// ✅ FOOD UNIT CYCLING FUNCTION
function cycleUnit(d, mi, fi) {
  var c = getC();
  if (!c || !c.weekPlan[d] || !c.weekPlan[d][mi] || !c.weekPlan[d][mi].foods[fi]) return;

  var food = c.weekPlan[d][mi].foods[fi];
  var fu = FOOD_UNITS[food.n];

  if (!fu) {
    // No predefined units - just use grams
    if (!food.u || food.u === 'g') return;
    food.u = 'g';
  } else {
    // Cycle through: stored unit → g → stored unit
    var possibleUnits = ['g', fu.u];
    var currentIdx = possibleUnits.indexOf(food.u !== undefined ? food.u : fu.u);
    var nextIdx = (currentIdx + 1) % possibleUnits.length;
    food.u = possibleUnits[nextIdx];
  }

  save();
  renderWeekTable();
}

// ✅ MEAL MENU DROPDOWN FUNCTIONS
function toggleMealMenu(menuId) {
  var menu = document.getElementById(menuId);
  if (!menu) return;

  // Close all other menus first
  document.querySelectorAll('.meal-menu-dropdown').forEach(function(m) {
    if (m.id !== menuId) {
      m.style.display = 'none';
    }
  });

  // Toggle current menu
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';

  // Smart positioning: if menu would be cut off on the left, flip it to open to the right
  if (menu.style.display === 'block') {
    // Reset to default (opens leftward) before measuring
    menu.style.left = 'auto';
    menu.style.right = '0';
    var rect = menu.getBoundingClientRect();
    if (rect.left < 4) {
      // Not enough room on the left → open toward the right side instead
      menu.style.right = 'auto';
      menu.style.left = '0';
    }
  }
}

function closeMealMenu(menuId) {
  var menu = document.getElementById(menuId);
  if (menu) {
    menu.style.display = 'none';
  }
}

// Close meal menus when clicking outside
document.addEventListener('click', function(event) {
  if (!event.target.closest('.meal-menu-dropdown') && !event.target.closest('[onclick*="toggleMealMenu"]')) {
    document.querySelectorAll('.meal-menu-dropdown').forEach(function(menu) {
      menu.style.display = 'none';
    });
  }
});

// Onboarding tip ("Πάτα το + για γρήγορες ενέργειες") is triggered from Cloud._enterApp()
// AFTER login — not on DOMContentLoaded, which fired it on the login screen where there is
// no "+" yet. initOnboarding() keeps its own once-per-browser guard + 1s delay.

// ✅ IMPROVED UX: Enhanced notifications with animations
var originalShowSuccessToast = showSuccessToast;
window.showSuccessToast = function(message) {
  originalShowSuccessToast(message);
  var toast = document.querySelector('[role="status"]');
  if(toast) toast.classList.add('slide-in', 'pulse');
};

var originalShowErrorToast = showErrorToast;
window.showErrorToast = function(message) {
  originalShowErrorToast(message);
  var toast = document.querySelector('[role="alert"]');
  if(toast) toast.classList.add('shake');
};

// ✅ IMPROVED UX: Smooth transitions for renderMain
var originalRenderMain = renderMain;
window.renderMain = function() {
  var main = document.getElementById('main');
  if(main) main.style.opacity = '0.5';

  setTimeout(function(){
    originalRenderMain();
    // originalRenderMain() rebuilds #main from scratch, always defaulting to tab 1 —
    // re-apply whichever client-detail tab (swTab argument) was actually requested most
    // recently, so this delayed rebuild doesn't silently undo a swTab() call that ran
    // synchronously right after renderMain() (e.g. selectClient() + swTab(N) from the
    // sidebar quick actions), which would otherwise always land back on tab 1.
    if(typeof swTab==='function' && window._lastTabN!=null) swTab(window._lastTabN);
    if(main) {
      main.style.opacity = '1';
      main.style.transition = 'opacity 0.3s ease-out';
    }
  }, 100);
};

// ✅ CONTEXT MENU: Right-click actions
// ✅ audit fix (2026-08-24, finding #1): ο selector έψαχνε '.ci', μια κλάση που δεν υπάρχει πουθενά
// στο σημερινό markup της λίστας πελατών (renderSB()/clientCardHtml()/clientRowHtml() βγάζουν πλέον
// '.client-card'/'.cr') — το μενού δεν άνοιγε ΠΟΤΕ. Επιπλέον, contextMenuClientId δηλωνόταν αλλά δεν
// γραφόταν/διαβαζόταν πουθενά· τα κουμπιά του μενού (editClient/duplicateClient/exportClientData/
// deleteClient) δούλευαν πάνω στο global curId, δηλαδή στον ΤΡΕΧΟΝΤΑ επιλεγμένο πελάτη — όχι σε αυτόν
// που δεξί-κλικάρεις. Τώρα πιάνουμε το πραγματικό data-client-id της κάρτας/γραμμής.
var contextMenuClientId = null;
document.addEventListener('contextmenu', function(e){
  var clientEl = e.target.closest('.client-card, .cr');
  if(clientEl){
    e.preventDefault();
    contextMenuClientId = clientEl.getAttribute('data-client-id') || null;
    showContextMenu(e.clientX, e.clientY);
  }
});

function showContextMenu(x, y){
  var menu = document.getElementById('context-menu');
  menu.style.display = 'block';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
}

function hideContextMenu(){
  document.getElementById('context-menu').style.display = 'none';
}

// Close context menu on click elsewhere
document.addEventListener('click', function(){
  hideContextMenu();
});

// ✅ audit fix (2026-08-24, finding #1): κοινή βοηθητική για εύρεση πελάτη by id — το context menu
// πλέον δουλεύει πάνω σε ΣΥΓΚΕΚΡΙΜΕΝΟ πελάτη (contextMenuClientId), όχι στον τρέχοντα επιλεγμένο (curId).
function getClientById(id){ return clients.filter(function(c){return c.id===id;})[0]; }

function editClient(){
  hideContextMenu();
  var c = getClientById(contextMenuClientId);
  if(!c) return;
  // Πριν, αυτό το κουμπί δεν έκανε τίποτα ουσιαστικό (μόνο toast). Τώρα πραγματικά ανοίγει τον
  // πελάτη στην καρτέλα "Στοιχεία πελάτη" (Βασικά Στοιχεία κ.λπ.) — selectClient() ήδη κάνει
  // swTab(1) μόνη της, όπως θα περίμενε κανείς από "Επεξεργασία".
  selectClient(c.id);
}

function duplicateClient(){
  var c = getClientById(contextMenuClientId);
  if(!c) return;

  var newClient = deepClone(c);
  // ✅ audit fix (2026-08-24, finding #1): πριν, το αντίγραφο κρατούσε το ΙΔΙΟ id με τον αρχικό
  // (το deepClone δεν αλλάζει id) — δύο εγγραφές με ίδιο id μπερδεύουν κάθε getC()/επιλογή by id.
  // Χρειάζεται νέο, μοναδικό id, ίδιο format με το addClient().
  newClient.id = 'c'+Date.now();
  newClient.name = c.name + ' (Αντιγραφή)';
  // ✅ το αντίγραφο δεν πρέπει να μοιράζεται δημόσιο link (shareToken) με τον αρχικό πελάτη — αλλιώς
  // ένα "Δημιουργία Πλάνου" πάνω στο αντίγραφο θα αντικαθιστούσε αθόρυβα το πλάνο που βλέπει ήδη ο
  // πραγματικός πελάτης στο link του. window.Cloud.publishPlan() φτιάχνει καινούριο token μόνο του
  // την επόμενη φορά που θα δημοσιευτεί (βλ. js/app-part2.js: "if(!c.shareToken) c.shareToken=...").
  newClient.shareToken = null;
  clients.push(newClient);
  upd();
  showSuccessToast('📋 Πελάτης αντιγράφηκε!');
  renderSB();
  hideContextMenu();
}

function exportClientData(){
  var c = getClientById(contextMenuClientId);
  if(!c) return;

  var data = JSON.stringify(c, null, 2);
  var blob = new Blob([data], {type: 'application/json'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = (c.name || 'Client') + '_data.json';
  a.click();
  showSuccessToast('💾 Πελάτης εξάχθηκε!');
  hideContextMenu();
}

// ✅ BOTTOM NAVIGATION: Update active button
var originalSwTab = swTab;
window.swTab = function(tabNum){
  originalSwTab(tabNum);
  updateBottomNav(tabNum);
};

function updateBottomNav(tabNum){
  var btns = document.querySelectorAll('.bottom-nav-btn');
  btns.forEach(function(btn){
    btn.classList.remove('active');
    if(btn.getAttribute('data-tab') == tabNum){
      btn.classList.add('active');
    }
  });
}

// ✅ IMPROVED SEARCH: Live filtering with animations
var searchTimeout;
document.addEventListener('input', function(e){
  if(e.target.id === 'client-search'){
    clearTimeout(searchTimeout);
    var inp = e.target;
    inp.style.borderColor = '#025857';

    searchTimeout = setTimeout(function(){
      filterClients(inp.value);
      inp.style.borderColor = '#ddd';
    }, 300);
  }
});

// ✅ Mobile optimization: Swipe gestures
var touchStartX = 0;
var touchEndX = 0;

document.addEventListener('touchstart', function(e){
  touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', function(e){
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}, false);

function handleSwipe(){
  var diff = touchEndX - touchStartX;
  if(Math.abs(diff) > 50){ // Swipe threshold
    if(diff > 0 && currentTab > 0){
      swTab(currentTab - 1);
    } else if(diff < 0 && currentTab < 4){
      swTab(currentTab + 1);
    }
  }
}

// ✅ PLAN PAGE ENHANCEMENTS: Daily Totals, Status, Quick Swap

function calculateDailyTotals(dayMeals){
  // Calculate total macros for a single day
  var totals = {k: 0, p: 0, f: 0, c: 0};

  if(!dayMeals || dayMeals.length === 0) return totals;

  dayMeals.forEach(function(meal){
    if(!meal || !meal.foods) return;

    meal.foods.forEach(function(food){
      if(!food) return;
      var foodData = FOODS[food.n];
      if(!foodData) return;

      var qty = food.g || 0;
      totals.k += (foodData.k * qty / 100) || 0;
      totals.p += (foodData.p * qty / 100) || 0;
      totals.f += (foodData.f * qty / 100) || 0;
      totals.c += (foodData.c * qty / 100) || 0;
    });
  });

  return {
    k: Math.round(totals.k),
    p: Math.round(totals.p),
    f: Math.round(totals.f),
    c: Math.round(totals.c)
  };
}

function getDayStatus(dayTotals, targetTotals){
  // Determine if day is OK, Close to limit, or Over
  var kcalDiff = dayTotals.k - targetTotals.k;
  var tolerance = targetTotals.k * 0.05; // ±5% tolerance

  if(Math.abs(kcalDiff) <= tolerance){
    return {status: 'ok', label: '✅ Σωστό', color: 'var(--good)'};
  } else if(kcalDiff > 0 && kcalDiff <= tolerance * 2){
    return {status: 'close', label: '🟡 Κοντά', color: '#e65100'};
  } else if(kcalDiff > tolerance * 2){
    return {status: 'over', label: '🔴 Υπέρβαση', color: '#c62828'};
  } else {
    return {status: 'low', label: '❌ Χαμηλά', color: '#1565C0'};
  }
}


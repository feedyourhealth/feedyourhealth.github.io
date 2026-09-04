// js/client-editor/tracker.js
// The client editor's body-composition & consultation tracker sub-tab (s3),
// extracted verbatim from js/app-part2.js (module split wave 28): _weightEditIdx,
// weightSelectOptions, buildTrackerHtml, initTrendCharts, the skinfold estimator
// (calcSkinfoldBF / toggleSkinfoldPanel / updateSkinfoldFields / updateSkinfoldCalc /
// applySkinfoldBF / getSkinfoldEntry), the ergometry CSV importer (triggerErgoCSVImport
// / parseErgoCSVRows / parseErgoCSV / applyErgoCSVData / handleErgoCSVFile /
// finishBatchErgoImport), ageAtDate, migrateClientSkinfoldBF, and the weight /
// consultation entry CRUD (addWeightEntry / editWeightEntry / cancelWeightEdit /
// removeWeightEntry / addConsultEntry / removeConsultEntry). Only `var _weightEditIdx
// = -1` runs at parse time. migrateClientSkinfoldBF is called from app-part4.js's
// parse-time client-load IIFE, so this must load before app-part4.js — it does, in
// the new js/client-editor/ group right after portal-comms/.

// ✅ index of the weightLog entry currently being edited via editWeightEntry(), or -1 when the
// form below is in normal "add a new measurement" mode. Same pattern as _apptEditIdx.
var _weightEditIdx=-1;
// Builds <option> tags for the Ύπνος/Ενέργεια/Συμμόρφωση selects, marking whichever one matches
// `selected` (a number when editing, '' when adding new) — lets the edit form reuse the exact
// same select markup as the add form instead of duplicating it.
function weightSelectOptions(selected,opts){
  return opts.map(function(o){
    return '<option value="'+o[0]+'"'+(String(selected)===String(o[0])?' selected':'')+'>'+o[1]+'</option>';
  }).join('');
}

function buildTrackerHtml(c){
  if(!c.weightLog)c.weightLog=[];
  if(!c.consultLog)c.consultLog=[];
  if(migrateClientSkinfoldBF(c))save();
  var today=new Date().toISOString().slice(0,10);
  // ✅ when editing an existing entry, `ee` holds it and every field below prefills from it
  // instead of starting blank; addWeightEntry() checks _weightEditIdx to know whether to push a
  // new entry or replace this one in place.
  var ee=(_weightEditIdx>=0 && c.weightLog[_weightEditIdx])?c.weightLog[_weightEditIdx]:null;

  // Weight / body composition section
  var isMinorC=(c.age!=null && c.age>0 && c.age<18); // don't coerce a not-yet-entered age to 0 and misclassify as a minor
  var defaultProto=isMinorC?'slaughter':'jp4';
  // ✅ when editing an entry that has stored skinfold data, the panel below needs to open on
  // that entry's own protocol — not fall back to the age-based default — otherwise the mm
  // fields it prefills (see the setTimeout near the end of this function) would be labelled
  // for the wrong protocol.
  var protoForSelect=(ee&&ee.sfProtocol)?ee.sfProtocol:defaultProto;
  // ✅ 2026-08-01: buildClientProgressHtml/clientLogsPanelHtml/planFeedbackPanelHtml moved to the
  // "📝 Ραντεβού" tab (buildAppointmentsHtml) — αυτά είναι το feedback του πελάτη (portal check-ins,
  // δικές του σημειώσεις, αξιολόγηση πλάνου), όχι σωματομετρικά, οπότε ανήκουν εκεί όπου γίνεται η
  // απόφαση για το πλάνο, όχι θαμμένα πάνω από τις δερματοπτυχές.
  var wHtml='<div class="tracker-section">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'
    +'<div class="tracker-head" style="margin-bottom:0">📐 Ανθρωπομετρία &amp; Σωματική Σύνθεση</div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap">'
    +'<button class="btn" style="padding:4px 11px;font-size:11px;background:#025857;color:#fff;border:none" title="Επίλεξε 1 αρχείο για άμεσο έλεγχο, ή πολλά μαζί για μαζική εισαγωγή ιστορικού" onclick="triggerErgoCSVImport()">📤 Εισαγωγή CSV (εργομετρικά)</button>'
    +'<input type="file" id="ergo-csv-input" accept=".csv" multiple style="display:none" onchange="handleErgoCSVFile(event)">'
    +'<button class="btn" style="padding:4px 11px;font-size:11px;background:#025857;color:#fff;border:none" onclick="exportLipometriaPDF()">🖨️ Έντυπο Λιπομέτρησης</button>'
    // ── αποστολή του εντύπου λιπομέτρησης στον πελάτη (WhatsApp / Email) ────────
    // πάντα ορατά (το έντυπο βγαίνει και χωρίς εγγραφές tracker), απενεργοποιημένα
    // μόνο όταν λείπει τηλέφωνο / email από την καρτέλα.
    +(c.phone?'<button class="btn" style="padding:4px 11px;font-size:11px;background:#25D366;color:#fff;border:none" title="Άνοιγμα του εντύπου λιπομέτρησης για αποθήκευση + WhatsApp με έτοιμο μήνυμα προς τον πελάτη" onclick="sendLipometriaReport(\'wa\')">📱 WhatsApp</button>':'<button class="btn" disabled style="padding:4px 11px;font-size:11px;background:#ddd;color:var(--text-muted);border:none;cursor:not-allowed" title="Λείπει τηλέφωνο από την καρτέλα του πελάτη — συμπλήρωσέ το στην καρτέλα «Στοιχεία»">📱 WhatsApp</button>')
    +(c.email?'<button class="btn" style="padding:4px 11px;font-size:11px;background:#025857;color:#fff;border:none" title="Άνοιγμα του εντύπου λιπομέτρησης για αποθήκευση + Email με έτοιμο μήνυμα προς τον πελάτη" onclick="sendLipometriaReport(\'mail\')">📧 Email</button>':'<button class="btn" disabled style="padding:4px 11px;font-size:11px;background:#ddd;color:var(--text-muted);border:none;cursor:not-allowed" title="Λείπει email από την καρτέλα του πελάτη — συμπλήρωσέ το στην καρτέλα «Στοιχεία»">📧 Email</button>')
    +(c.weightLog&&c.weightLog.length?'<button class="btn" style="padding:4px 11px;font-size:11px;background:#025857;color:#fff;border:none" title="Αποθήκευση/εκτύπωση του ιστορικού μετρήσεων" onclick="exportBodyCompPDF()">📊 Ιστορικό PDF</button>':'')
    +'</div>'
    +'</div>'
    // ✅ persistent (non-hover) caption for the CSV button — the old title-only tooltip explaining
    // single-file-vs-batch import was invisible until someone hovered over it
    +'<div style="font-size:10px;color:var(--text-muted);margin:-4px 0 8px">📤 CSV: 1 αρχείο = άμεσος έλεγχος στοιχείων &nbsp;·&nbsp; πολλά αρχεία μαζί = μαζική εισαγωγή ιστορικού</div>'
    // ── Skinfold panel ────────────────────────────────────────────────────────
    +'<div class="sf-panel" id="sf-panel">'
    +'<div class="sf-header" onclick="toggleSkinfoldPanel()">'
    +'<span>📐 Δερματοπτυχόμετρο <span style="font-size:10px;font-weight:400;color:#888">&nbsp;— υπολογισμός %BF από δερματοπτυχές</span></span>'
    +'<span id="sf-toggle-icon" class="sec-chevron'+(ee&&ee.sfFields?' open':'')+'">▸</span>'
    +'</div>'
    // ✅ opens automatically (instead of the usual collapsed-by-default) when editing an entry
    // that has stored skinfold data — otherwise the mm fields below stay empty/collapsed and
    // saving would silently drop that entry's sfProtocol/sfFields (getSkinfoldEntry() returns
    // null whenever this panel is closed, so addWeightEntry() had nothing to carry forward)
    +'<div id="sf-body" style="display:'+(ee&&ee.sfFields?'block':'none')+';padding-top:10px">'
    +(ee&&ee.sfFields?'<div style="font-size:10px;color:#8d6e00;background:#fff8e1;border-radius:5px;padding:4px 8px;margin-bottom:8px">✏️ Αυτή η μέτρηση είχε δερματοπτυχές — άνοιξε αυτόματα ώστε η επεξεργασία σου να μην τις σβήσει.</div>':'')
    +(isMinorC?'<div style="font-size:10px;color:#e65100;background:#fff8e1;border-radius:5px;padding:4px 8px;margin-bottom:8px">👶 Ηλικία &lt;18 — προεπιλογή Slaughter (1988), ειδική εξίσωση για παιδιά/εφήβους</div>':'')
    +'<div class="tracker-add-row" style="gap:6px;margin-bottom:8px;align-items:center">'
    +'<label style="font-size:10px;color:#666">Πρωτόκολλο:</label>'
    +'<select id="sf-proto" class="tracker-inp" style="width:270px;font-size:11px" onchange="updateSkinfoldFields()" title="Το πρωτόκολλο καθορίζει ποια σημεία μετριούνται παρακάτω">'
    +'<option value="jp4"'+(protoForSelect==='jp4'?' selected':'')+'>JP 4-site ★ (Κοιλιά/Υπερλαγόνιο/Τρικέφαλος/Μηρός)</option>'
    +'<option value="jp3"'+(protoForSelect==='jp3'?' selected':'')+'>JP 3-site (κλασικό)</option>'
    +'<option value="jp7"'+(protoForSelect==='jp7'?' selected':'')+'>JP 7-site (πλήρες)</option>'
    +'<option value="slaughter"'+(protoForSelect==='slaughter'?' selected':'')+'>Slaughter (1988) — παιδιά/έφηβοι</option>'
    +'</select>'
    +'<span id="sf-ref" style="font-size:9px;color:var(--text-muted)"></span>'
    +'</div>'
    // ✅ always-visible site list (was only guessable from the truncated dropdown text) —
    // no hover tooltip here on purpose: the app logs "📱 Tablet layout", so anything that
    // only shows on :hover is unreachable on a touchscreen
    +'<div id="sf-sites" style="font-size:10px;color:#666;background:#f7fbfa;border-radius:5px;padding:4px 8px;margin-bottom:8px"></div>'
    +'<div id="sf-fields" class="tracker-add-row" style="gap:5px;flex-wrap:wrap;margin-bottom:8px"></div>'
    +'<div id="sf-result" style="display:none"></div>'
    +'</div>'
    +'</div>'
    +dislikedRecipesPanelHtml(c)
    // ── Standard entry row ────────────────────────────────────────────────────
    // ✅ split into labeled groups (was one dense unlabeled row of 6 mixed-width fields —
    // placeholder-only text vanished while typing, and Βασικά/Περιφέρειες were impossible to
    // tell apart at a glance)
    +(ee?'<div style="width:100%;background:#fff8e1;border:1px solid #ffe082;border-radius:6px;padding:6px 10px;margin-bottom:8px;font-size:11px;color:#8d6e00">✏️ Επεξεργασία μέτρησης της '+ee.date+' — άλλαξε ό,τι χρειάζεται και πάτα «Αποθήκευση αλλαγών» παρακάτω, ή «Άκυρο» για έξοδο χωρίς αλλαγές.</div>':'')
    +'<div style="font-size:10px;color:var(--text-muted);width:100%;margin-bottom:2px">Βασικά</div>'
    +'<div class="tracker-add-row" style="flex-wrap:wrap;gap:5px">'
    +'<label style="font-size:10px;color:#666;align-self:center">Ημερομηνία:</label>'
    +'<input type="date" id="tr-date" value="'+(ee?ee.date:today)+'" class="tracker-inp">'
    +'<label style="font-size:10px;color:#666;align-self:center">Βάρος:</label>'
    +'<input type="number" id="tr-weight" placeholder="kg" min="20" max="300" step="0.1" class="tracker-inp" style="width:64px" value="'+(ee&&ee.weight?ee.weight:'')+'">'
    +'<label style="font-size:10px;color:#666;align-self:center" title="Χειροκίνητη τιμή, ή πάτα «✓ Χρήση ως %BF» στο δερματοπτυχόμετρο παραπάνω για αυτόματη συμπλήρωση">🧮 Λίπος %:</label>'
    +'<input type="number" id="tr-bf" placeholder="%" min="3" max="60" step="0.1" class="tracker-inp" style="width:56px" title="Χειροκίνητη τιμή, ή πάτα «✓ Χρήση ως %BF» στο δερματοπτυχόμετρο παραπάνω για αυτόματη συμπλήρωση" value="'+(ee&&ee.bf?ee.bf:'')+'">'
    // ✅ πώς μετρήθηκε το %BF — αποθηκεύεται στο entry.bfMethod μαζί με τη μέτρηση. Το δερματοπτυχόμετρο
    // παραπάνω γεμίζει αυτό σε 'caliper' αυτόματα (applySkinfoldBF). Παλιές μετρήσεις δεν έχουν .bfMethod.
    +'<select id="tr-bf-method" class="tracker-inp" style="width:132px;font-size:10px" title="Πώς μετρήθηκε το ποσοστό λίπους — αποθηκεύεται μαζί με τη μέτρηση">'
    +weightSelectOptions(ee?ee.bfMethod:'',[['','μέθοδος %…'],['caliper','📐 Δερματοπτυχές'],['bia','⚡ Λιπομετρητής/BIA'],['dexa','🩻 DEXA/εργαστ.'],['estimate','≈ Εκτίμηση/άλλο']])
    +'</select>'
    +'</div>'
    +'<div style="font-size:10px;color:var(--text-muted);width:100%;margin:8px 0 2px">Περιφέρειες (cm)</div>'
    +'<div class="tracker-add-row" style="flex-wrap:wrap;gap:5px">'
    +'<label style="font-size:10px;color:#666;align-self:center">Μέση:</label>'
    +'<input type="number" id="tr-waist" placeholder="cm" min="40" max="200" step="0.5" class="tracker-inp" style="width:60px" value="'+(ee&&ee.waist?ee.waist:'')+'">'
    +'<label style="font-size:10px;color:#666;align-self:center">Γοφοί:</label>'
    +'<input type="number" id="tr-hip" placeholder="cm" min="50" max="200" step="0.5" class="tracker-inp" style="width:60px" value="'+(ee&&ee.hip?ee.hip:'')+'">'
    +'<label style="font-size:10px;color:#666;align-self:center">Δικέφαλος:</label>'
    +'<input type="number" id="tr-arm" placeholder="cm" min="15" max="60" step="0.5" class="tracker-inp" style="width:60px" value="'+(ee&&ee.arm?ee.arm:'')+'">'
    +'</div>'
    +'<div style="font-size:10px;color:var(--text-muted);width:100%;margin:8px 0 2px">Καθημερινότητα &amp; σημειώσεις</div>'
    +'<div class="tracker-add-row" style="flex-wrap:wrap;gap:5px;margin-top:5px">'
    +'<label style="font-size:10px;color:#666;align-self:center">Ύπνος:</label>'
    +'<select id="tr-sleep" class="tracker-inp" style="width:110px;font-size:11px">'
    +weightSelectOptions(ee?ee.sleep:'',[['','—'],['5','5 ⭐ Εξαιρετικός'],['4','4 ⭐ Καλός'],['3','3 ⭐ Μέτριος'],['2','2 ⭐ Κακός'],['1','1 ⭐ Πολύ κακός']])
    +'</select>'
    +'<label style="font-size:10px;color:#666;align-self:center">Ενέργεια:</label>'
    +'<select id="tr-energy" class="tracker-inp" style="width:110px;font-size:11px">'
    +weightSelectOptions(ee?ee.energy:'',[['','—'],['5','5 ⚡ Άριστη'],['4','4 ⚡ Καλή'],['3','3 ⚡ Μέτρια'],['2','2 ⚡ Χαμηλή'],['1','1 ⚡ Εξαντλητική']])
    +'</select>'
    +'<label style="font-size:10px;color:#666;align-self:center">Συμμόρφωση:</label>'
    +'<select id="tr-compliance" class="tracker-inp" style="width:120px;font-size:11px">'
    +weightSelectOptions(ee?ee.compliance:'',[['','—'],['10','10 — Πλήρης'],['9','9 — Σχεδόν πλήρης'],['8','8 — Πολύ καλή'],['7','7 — Καλή'],['6','6 — Μέτρια'],['5','5 — Μισή'],['4','4 — Κακή'],['3','3 — Πολύ κακή']])
    +'</select>'
    +'<input type="text" id="tr-notes" placeholder="Σημειώσεις..." class="tracker-inp" style="flex:1;min-width:120px" value="'+(ee?esc(ee.notes||''):'')+'">'
    +(ee?'<button class="btn" style="padding:5px 11px;font-size:11px;background:#888;color:#fff;border:none" onclick="cancelWeightEdit()">Άκυρο</button>':'')
    +'<button class="btn" style="padding:5px 11px;font-size:11px" onclick="addWeightEntry()">'+(ee?'✓ Αποθήκευση αλλαγών':'+ Προσθήκη')+'</button>'
    +'</div>';
  if(c.weightLog.length>0){
    // ✅ Current Status Card (latest measurement)
    var latest=c.weightLog[c.weightLog.length-1];
    var latestLBM=latest.bf>0?+(latest.weight*(1-latest.bf/100)).toFixed(1):null;
    var latestFM=latest.bf>0?+(latest.weight-latestLBM).toFixed(1):null;
    var latestBMI=c.height>0?+(latest.weight/((c.height/100)*(c.height/100))).toFixed(1):null; // no height yet — don't divide by 0
    // ⚠️ Τα σταθερά όρια (18.5/25/30) είναι κατηγοριοποίηση ενηλίκων (WHO) — δεν ισχύουν κλινικά
    // για ανήλικους (χρειάζεται BMI-for-age percentile). Για ανήλικους δείχνουμε μόνο τον αριθμό,
    // χωρίς χαρακτηρισμό/χρωματισμό που θα ήταν παραπλανητικός.
    var latestBMIStatus='';
    if(latestBMI!=null && !isMinorC){
      if(latestBMI<18.5)latestBMIStatus='Λιποβαρής ℹ️';
      else if(latestBMI<25)latestBMIStatus='Φυσιολογικό ✓';
      else if(latestBMI<30)latestBMIStatus='Υπέρβαρος ⚠️';
      else latestBMIStatus='Παχυσαρκία 🔴';
    }
    var latestBMIColor=(latestBMI==null||isMinorC)?'#999':latestBMI<18.5?'#ff6b35':latestBMI<25?'var(--good)':latestBMI<30?'#ff9800':'#c62828';

    wHtml+='<div style="background:#fff8e1;border:1px solid #ffb74d;border-radius:8px;padding:12px;margin-bottom:10px">'
      +'<div style="font-size:10px;color:#e65100;font-weight:700;margin-bottom:8px">📊 Τρέχουσα Κατάσταση ('+latest.date+')</div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;font-size:10px">'
      +'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #2e7d32">'
      +'<div style="color:#666">Βάρος</div><div style="font-size:14px;font-weight:700;color:#025857">'+latest.weight+' kg</div></div>'
      +(latest.bf?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #ff9999"><div style="color:#666">Λίπος</div><div style="font-size:14px;font-weight:700;color:#c62828">'+latest.bf+'%</div></div>':'')
      +(latestLBM?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #1565C0"><div style="color:#666">Lean Mass</div><div style="font-size:14px;font-weight:700;color:#1565C0">'+latestLBM+' kg</div></div>':'')
      +(latestBMI!=null?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid '+latestBMIColor+'">'
      +'<div style="color:#666">BMI</div><div style="font-size:14px;font-weight:700;color:'+latestBMIColor+'">'+latestBMI+(latestBMIStatus?' ('+latestBMIStatus+')':'')+'</div></div>'
      // ✅ BMI used to just silently disappear with no height set — nothing told the practitioner
      // why the card was missing, or what to do about it
      :'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #ccc"><div style="color:#666">BMI</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Χρειάζεται ύψος — συμπλήρωσέ το στα Στοιχεία πελάτη</div></div>')
      +(latest.waist?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #9c27b0"><div style="color:#666">Μέση</div><div style="font-size:14px;font-weight:700;color:#9c27b0">'+latest.waist+' cm</div></div>':'')
      +(latest.hip?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #f57c00"><div style="color:#666">Γοφοί</div><div style="font-size:14px;font-weight:700;color:#f57c00">'+latest.hip+' cm</div></div>':'')
      +'</div>'
      +bfGaugeHtml(latest.bf,c.sex||'M',isMinorC,c.goalBF,(c.birthDate?ageAtDate(c.birthDate):c.age))
      +'</div>';

    // ✅ TREND LINES: Weight & Body Fat % Charts
    if(c.weightLog.length>=2){
      wHtml+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px">'
        +'<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:8px;padding:12px">'
        +'<canvas id="trendWeightChart"></canvas>'
        +'</div>'
        +'<div style="background:var(--card-bg);border:1px solid var(--border-light);border-radius:8px;padding:12px">'
        +'<canvas id="trendBFChart"></canvas>'
        +'</div>'
        +'</div>';
    } else if(c.weightLog.length===1){
      // ✅ tells the practitioner why there's no chart yet instead of just silently omitting it
      wHtml+='<div style="font-size:10.5px;color:var(--text-muted);background:var(--panel-bg);border:1px dashed #ddd;border-radius:8px;padding:8px 12px;margin-bottom:15px">📈 Το γράφημα τάσης θα εμφανιστεί μετά τη 2η μέτρηση.</div>';
    }

    // ── Progress summary ───────────────────────────────────────────────────────
    if(c.weightLog.length>=2){
      var sorted2=c.weightLog.slice().sort(function(a,b){return a.date<b.date?-1:1;});
      var first=sorted2[0],last=sorted2[sorted2.length-1];
      var wDiff=+(last.weight-first.weight).toFixed(1);
      var wCol=wDiff<0?'var(--good)':wDiff>0?'#c62828':'#888';
      var bfDiff=(first.bf>0&&last.bf>0)?+(last.bf-first.bf).toFixed(1):null;
      var lbmFirst=first.bf>0?+(first.weight*(1-first.bf/100)).toFixed(1):null;
      var lbmLast=last.bf>0?+(last.weight*(1-last.bf/100)).toFixed(1):null;
      var lbmDiff=(lbmFirst&&lbmLast)?+(lbmLast-lbmFirst).toFixed(1):null;
      var wstDiff=(first.waist>0&&last.waist>0)?+(last.waist-first.waist).toFixed(1):null;
      // Compliance average
      var compEntries=c.weightLog.filter(function(e){return e.compliance>0;});
      var compAvg=compEntries.length?+(compEntries.reduce(function(s,e){return s+e.compliance;},0)/compEntries.length).toFixed(1):null;
      // ✅ Enhanced progress summary with visual body composition
    var lastLBM=last.bf>0?+(last.weight*(1-last.bf/100)).toFixed(1):null;
    var lastFM=last.bf>0?+(last.weight-lastLBM).toFixed(1):null;
    var lastBMI=c.height>0?+(last.weight/((c.height/100)*(c.height/100))).toFixed(1):null;
    // ⚠️ Ίδιος περιορισμός με το latestBMIStatus παραπάνω — τα όρια ενηλίκων δεν ισχύουν κλινικά
    // για ανήλικους (isMinorC, ήδη υπολογισμένο στην αρχή αυτής της συνάρτησης).
    var bmiStatus='';
    if(lastBMI!=null && !isMinorC){
      if(lastBMI<18.5)bmiStatus='Λιποβαρής';
      else if(lastBMI<25)bmiStatus='Φυσιολογικό ✓';
      else if(lastBMI<30)bmiStatus='Υπέρβαρος';
      else bmiStatus='Παχυσαρκία';
    }
    var bmiColor=(lastBMI==null||isMinorC)?'#999':lastBMI<18.5?'#ff6b35':lastBMI<25?'var(--good)':lastBMI<30?'#ff9800':'#c62828';

    wHtml+='<div style="background:#f0f9f8;border:1px solid #c5ddd8;border-radius:9px;padding:12px 14px;margin-bottom:10px">'
        +'<div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-bottom:10px">'
        +'<span style="font-size:11px;font-weight:700;color:#025857">📈 Σύνοψη προόδου</span>'
        +'<span style="font-size:11px">Βάρος: <b style="color:'+wCol+'">'+(wDiff>0?'+':'')+wDiff+' kg</b> ('+first.weight+'→'+last.weight+'kg)</span>'
        +(bfDiff!==null?'<span style="font-size:11px">Λίπος: <b style="color:'+(bfDiff<0?'var(--good)':'#c62828')+'">'+(bfDiff>0?'+':'')+bfDiff+'%</b></span>':'')
        +(lbmDiff!==null?'<span style="font-size:11px">Lean Mass: <b style="color:'+(lbmDiff>0?'#1565C0':'#888')+'">'+(lbmDiff>0?'+':'')+lbmDiff+' kg</b></span>':'')
        +(lastBMI!=null?'<span style="font-size:11px">BMI: <b style="color:'+bmiColor+'">'+lastBMI+(bmiStatus?' ('+bmiStatus+')':'')+'</b></span>':'')
        +'<span style="font-size:10px;color:var(--text-muted);margin-left:auto">'+sorted2.length+' μετρήσεις</span>'
        +'</div>'
        // Visual body composition bar
        +(lastLBM&&lastFM?'<div style="margin-top:8px">'
          +'<div style="font-size:9px;color:#666;margin-bottom:3px">Σύσταση σώματος (τελευταία):</div>'
          +'<div style="display:flex;gap:1px;height:18px;border-radius:3px;overflow:hidden;background:#eee">'
          +'<div style="width:'+(lastLBM/last.weight*100)+'%;background:#1565C0;display:flex;align-items:center;justify-content:center">'
          +(lastLBM/last.weight*100>15?'<span style="color:#fff;font-size:8px;font-weight:700">'+lastLBM+'kg</span>':'')
          +'</div>'
          +'<div style="width:'+(lastFM/last.weight*100)+'%;background:#ff9999;display:flex;align-items:center;justify-content:center">'
          +(lastFM/last.weight*100>15?'<span style="color:#fff;font-size:8px;font-weight:700">'+lastFM+'kg</span>':'')
          +'</div>'
          +'</div>'
          +'<div style="display:flex;gap:15px;font-size:9px;margin-top:4px">'
          +'<span><span style="display:inline-block;width:12px;height:12px;background:#1565C0;border-radius:2px;vertical-align:middle;margin-right:3px"></span>Lean Mass: '+lastLBM+' kg ('+(lastLBM/last.weight*100).toFixed(1)+'%)</span>'
          +'<span><span style="display:inline-block;width:12px;height:12px;background:#ff9999;border-radius:2px;vertical-align:middle;margin-right:3px"></span>Fat Mass: '+lastFM+' kg ('+last.bf+'%)</span>'
          +'</div>'
          +'</div>':'')
        +'</div>';
    }
    wHtml+='<div style="overflow-x:auto"><table class="tracker-table"><thead><tr>'
        +'<th title="Ημερομηνία μέτρησης">Ημ/νία</th>'
        +'<th title="Σωματικό βάρος (kg)">Βάρος</th>'
        +'<th title="Ποσοστό σωματικού λίπους">Λίπος%</th>'
        +'<th title="Lean Body Mass - μυϊκή μάζα (kg)">LBM</th>'
        +'<th title="Περίμετρος μέσης (cm)">Μέση</th>'
        +'<th title="Περίμετρος γοφών (cm)">Γοφοί</th>'
        +'<th title="Περίμετρος δικέφαλου (cm)">Δικέφ.</th>'
        +'<th title="Ποιότητα ύπνου">Ύπνος</th>'
        +'<th title="Επίπεδο ενέργειας">Ενέρ.</th>'
        +'<th title="Συμμόρφωση με πλάνο (0-10)">Συμμ.</th>'
        +'<th title="Διάφορες σημειώσεις">Σημειώσεις</th>'
        +'<th></th></tr></thead><tbody>';
    c.weightLog.slice().reverse().forEach(function(e,ri){
      var i=c.weightLog.length-1-ri;
      var lbm=(e.bf>0)?+(e.weight*(1-e.bf/100)).toFixed(1):'—';
      var sleepStars=e.sleep?'⭐'.repeat(e.sleep):'—';
      var energyBolts=e.energy?'⚡'.repeat(e.energy):'—';
      var sfProtoLabel={jp4:'JP4',jp3:'JP3',jp7:'JP7',slaughter:'SL'};
      var sfBadge=e.sfProtocol?'<span title="Μέτρηση με δερματοπτυχόμετρο ('+e.sfProtocol.toUpperCase()+')" style="font-size:8px;background:#e8f5e9;color:#2e7d32;border-radius:3px;padding:1px 4px;margin-left:3px;font-weight:700;cursor:default">📐'+(sfProtoLabel[e.sfProtocol]||e.sfProtocol)+'</span>':'';
      // ✅ μέθοδος μέτρησης για μη-δερματοπτυχικές εγγραφές (οι δερματοπτυχικές έχουν ήδη το 📐 badge)
      var bfMethodLabel={caliper:'📐',bia:'⚡BIA',dexa:'🩻DEXA',estimate:'≈'};
      var methBadge=(e.bfMethod&&!e.sfProtocol)?'<span title="Μέθοδος μέτρησης λίπους" style="font-size:8px;background:#eef2f7;color:#456;border-radius:3px;padding:1px 4px;margin-left:3px;font-weight:700;cursor:default">'+(bfMethodLabel[e.bfMethod]||e.bfMethod)+'</span>':'';
      wHtml+='<tr>'
        +'<td style="white-space:nowrap">'+e.date+'</td>'
        +'<td><b>'+e.weight+' kg</b></td>'
        +'<td>'+(e.bf?e.bf+'%'+sfBadge+methBadge:'—')+'</td>'
        +'<td>'+(lbm!=='—'?lbm+' kg':'—')+'</td>'
        +'<td>'+(e.waist?e.waist+' cm':'—')+'</td>'
        +'<td>'+(e.hip?e.hip+' cm':'—')+'</td>'
        +'<td>'+(e.arm?e.arm+' cm':'—')+'</td>'
        +'<td style="font-size:9px">'+sleepStars+'</td>'
        +'<td style="font-size:9px">'+energyBolts+'</td>'
        +'<td>'+(e.compliance?'<b>'+e.compliance+'/10</b>':'—')+'</td>'
        +'<td style="max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#666">'+esc(e.notes||'')+'</td>'
        +'<td style="white-space:nowrap"><button class="met-del" onclick="editWeightEntry('+i+')" title="Επεξεργασία">✏️</button> <button class="met-del" onclick="removeWeightEntry('+i+')" title="Διαγραφή">&#10005;</button></td>'
        +'</tr>';
    });
    wHtml+='</tbody></table></div>';
  } else {
    // ✅ icon-circle + dashed card instead of a bare italic line — matches the treatment used
    // for the "1 μέτρηση, θα εμφανιστεί γράφημα" hint above so empty vs in-progress states read
    // as the same visual family
    wHtml+='<div class="tracker-empty" style="text-align:center;font-style:normal;padding:18px 12px;background:var(--panel-bg);border:1px dashed #ddd;border-radius:10px">'
      +'<div style="width:32px;height:32px;border-radius:50%;background:var(--card-bg);border:1px solid var(--border-light);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-size:14px">📈</div>'
      +'Δεν υπάρχουν καταχωρήσεις ακόμα. Πρόσθεσε την πρώτη μέτρηση παραπάνω για να ξεκινήσει το ιστορικό προόδου — το γράφημα τάσης ενεργοποιείται από τη 2η μέτρηση.'
      +'</div>';
  }
  wHtml+='</div>';

  // Consultation log section
  var cHtml='<div class="tracker-section">'
    +'<div class="tracker-head">📝 Ημερολόγιο συμβουλευτικής</div>'
    +'<div class="tracker-add-row" style="align-items:flex-start">'
    +'<input type="date" id="cons-date" value="'+today+'" class="tracker-inp" style="align-self:center">'
    +'<textarea id="cons-notes" placeholder="Σημειώσεις συνεδρίας (βάρος, εντυπώσεις, αλλαγές, στόχοι...)..." class="tracker-textarea"></textarea>'
    +'<button class="btn" style="padding:5px 11px;font-size:11px;align-self:flex-end" onclick="addConsultEntry()">+ Καταχώρηση</button>'
    +'</div>';
  if(c.consultLog.length>0){
    cHtml+='<div class="consult-log">';
    c.consultLog.slice().reverse().forEach(function(e,ri){
      var i=c.consultLog.length-1-ri;
      cHtml+='<div class="consult-entry">'
        +'<div class="consult-date">'+e.date+(e.weight?' · βάρος: <b>'+e.weight+' kg</b>':'')+'</div>'
        +'<div class="consult-text">'+e.notes.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'</div>'
        +'<button class="met-del" onclick="removeConsultEntry('+i+')" title="Διαγραφή">&#10005;</button>'
        +'</div>';
    });
    cHtml+='</div>';
  } else {
    cHtml+='<div class="tracker-empty" style="text-align:center;font-style:normal;padding:18px 12px;background:var(--panel-bg);border:1px dashed #ddd;border-radius:10px">'
      +'<div style="width:32px;height:32px;border-radius:50%;background:var(--card-bg);border:1px solid var(--border-light);display:flex;align-items:center;justify-content:center;margin:0 auto 8px;font-size:14px">📝</div>'
      +'Δεν υπάρχουν καταχωρήσεις ακόμα. Πρόσθεσε μια σημείωση μετά από κάθε συνεδρία, ώστε να θυμάσαι τι ειπώθηκε πριν την επόμενη επίσκεψη.'
      +'</div>';
  }
  cHtml+='</div>';

  // ✅ Initialize trend charts after HTML is inserted
  if(c.weightLog && c.weightLog.length>=2){
    setTimeout(function(){ initTrendCharts(c); }, 100);
  }

  // ✅ the skinfold panel above already opened on ee.sfProtocol (via protoForSelect) and
  // rendered its "✏️ ...άνοιξε αυτόματα" notice, but the actual mm inputs are built by
  // updateSkinfoldFields() and don't exist in the DOM until it runs — reuse it here the same
  // way toggleSkinfoldPanel() normally would, then drop in the stored mm values and recompute
  // %BF so the edit form shows exactly what was originally measured.
  if(ee&&ee.sfFields&&ee.sfProtocol){
    setTimeout(function(){
      var protoEl=document.getElementById('sf-proto');
      if(protoEl)protoEl.value=ee.sfProtocol;
      updateSkinfoldFields();
      Object.keys(ee.sfFields).forEach(function(k){
        var el=document.getElementById('sf-'+k);
        if(el)el.value=ee.sfFields[k];
      });
      updateSkinfoldCalc();
    },50);
  }

  return '<div style="padding:16px 20px">'+wHtml+cHtml+'</div>';
}

// ✅ TREND LINES CHARTS - Weight & Body Fat %
function initTrendCharts(c){
  if(!c || !c.weightLog || c.weightLog.length<2) return;
  // Chart.js φορτώνεται κατ' απαίτηση (βγήκε από το boot path) — φέρ' το και ξανακάλεσε.
  if(typeof Chart==='undefined'){ ensureChart().then(function(){ initTrendCharts(c); }, function(e){ console.warn('[chart] ', e && e.message); }); return; }

  var sorted=c.weightLog.slice().sort(function(a,b){return new Date(a.date)-new Date(b.date);});
  var dates=sorted.map(function(e){return e.date.substring(5);});
  var weights=sorted.map(function(e){return e.weight;});
  var bfs=sorted.map(function(e){return e.bf>0?e.bf:null;});

  // Weight Trend Chart
  var wCtx=document.getElementById('trendWeightChart');
  if(wCtx){
    // ✅ every add/edit/remove/CSV-import re-render schedules a fresh 100ms-delayed
    // initTrendCharts() call (below); two of those firing close together used to throw
    // "Canvas is already in use" because the previous Chart.js instance on this canvas was
    // never destroyed. Chart.getChart() (Chart.js 3.7+) finds it regardless of how it got here.
    var existingW=Chart.getChart(wCtx);
    if(existingW)existingW.destroy();
    new Chart(wCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Βάρος (kg)',
          data: weights,
          borderColor: '#025857',
          backgroundColor: 'rgba(2,88,87,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#025857'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: true, labels: { font: { size: 11 }, color: '#666' } }, title: { display: true, text: '📈 Weight Trend', font: { size: 13, weight: 'bold' }, color: '#025857' } },
        scales: { y: { beginAtZero: false, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } }
      }
    });
  }

  // Body Fat % Trend Chart
  var bfCtx=document.getElementById('trendBFChart');
  if(bfCtx){
    var existingBF=Chart.getChart(bfCtx);
    if(existingBF)existingBF.destroy();
    new Chart(bfCtx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'Body Fat %',
          data: bfs,
          borderColor: '#ff6b35',
          backgroundColor: 'rgba(255,107,53,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#ff6b35'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: true, labels: { font: { size: 11 }, color: '#666' } }, title: { display: true, text: '📊 Body Fat % Trend', font: { size: 13, weight: 'bold' }, color: '#ff6b35' } },
        scales: { y: { beginAtZero: false, grid: { color: '#f0f0f0' } }, x: { grid: { display: false } } }
      }
    });
  }
}

/* ── Skinfold Calculator ─────────────────────────────────────────────────── */
function calcSkinfoldBF(protocol,sex,age,fields){
  var bf=null,bd=null,sum=0;
  if(protocol==='jp4'){
    // JP 4-site: κοιλιά + υπερλαγόνιο + τρικέφαλος + μηρός — δίνει απευθείας %BF (όχι μέσω BD/Siri)
    // Jackson & Pollock (1985) "Practical assessment of body composition." Physician and Sportsmedicine 13:76-90
    sum=(fields.abdomen||0)+(fields.suprailiac||0)+(fields.tricep||0)+(fields.thigh||0);
    if(sum>0){
      if(sex==='M') bf=0.29288*sum-0.0005*sum*sum+0.15845*age-5.76377;
      else bf=0.29669*sum-0.00043*sum*sum+0.02963*age+1.4072;
    }
  } else if(protocol==='jp3'){
    if(sex==='M') sum=(fields.chest||0)+(fields.abdomen||0)+(fields.thigh||0);
    else sum=(fields.tricep||0)+(fields.suprailiac||0)+(fields.thigh||0);
    if(sum>0){
      if(sex==='M') bd=1.10938-0.0008267*sum+0.0000016*sum*sum-0.0002574*age;
      else bd=1.0994921-0.0009929*sum+0.0000023*sum*sum-0.0001392*age;
      bf=(4.95/bd-4.50)*100;
    }
  } else if(protocol==='jp7'){
    sum=(fields.chest||0)+(fields.midaxillary||0)+(fields.tricep||0)+(fields.subscapular||0)+(fields.abdomen||0)+(fields.suprailiac||0)+(fields.thigh||0);
    if(sum>0){
      if(sex==='M') bd=1.112-0.00043499*sum+0.00000055*sum*sum-0.00028826*age;
      else bd=1.097-0.00046971*sum+0.00000056*sum*sum-0.00012828*age;
      bf=(4.95/bd-4.50)*100;
    }
  } else if(protocol==='slaughter'){
    // Slaughter et al. (1988) triceps+calf equation — a single linear formula per sex,
    // with NO sum-based branch (that >35mm split/0.783|0.546 pair belongs to the DIFFERENT
    // triceps+subscapular equation, not this one — confirmed against secondary sources
    // quoting the original paper; verification pass 2026-07-11, see audit notes).
    sum=(fields.tricep||0)+(fields.calf||0);
    if(sum>0){
      if(sex==='M') bf=0.735*sum+1.0;
      else bf=0.610*sum+5.0;
    }
  }
  if(bf!==null) bf=Math.max(3,Math.min(60,+bf.toFixed(1)));
  return{bf:bf,bd:bd?+bd.toFixed(5):null,sum:sum};
}

function toggleSkinfoldPanel(){
  var body=document.getElementById('sf-body');
  var icon=document.getElementById('sf-toggle-icon');
  if(!body)return;
  var isOpen=body.style.display!=='none';
  body.style.display=isOpen?'none':'block';
  if(icon)icon.classList.toggle('open',!isOpen);
  if(!isOpen)updateSkinfoldFields();
}

function updateSkinfoldFields(){
  var c=getC();if(!c)return;
  var protoEl=document.getElementById('sf-proto');
  if(!protoEl)return;
  var p=protoEl.value;
  var sex=c.sex||'M';
  var fieldsDiv=document.getElementById('sf-fields');
  var refSpan=document.getElementById('sf-ref');
  if(!fieldsDiv)return;
  // ✅ carry over any mm values already typed before switching protocol — this used to wipe the
  // whole panel silently (rebuilds fieldsDiv from scratch below), so picking the wrong protocol
  // first and correcting it lost everything you'd entered so far. Sites shared between protocols
  // (e.g. abdomen/thigh between JP4 and JP3) now keep their value; sites unique to the old
  // protocol are simply dropped since the new one has nowhere to show them.
  var carryOver={};
  ['chest','abdomen','thigh','tricep','suprailiac','midaxillary','subscapular','calf'].forEach(function(k){
    var el=document.getElementById('sf-'+k);
    if(el&&el.value)carryOver[k]=el.value;
  });
  var defs=[];
  var ref='';
  if(p==='jp4'){
    ref='Jackson & Pollock, 1985 — 4 σημεία';
    defs=[
      {k:'abdomen',   lbl:'1. Κοιλιά mm'},
      {k:'suprailiac',lbl:'2. Υπερλαγόνιο mm'},
      {k:'tricep',    lbl:'3. Τρικέφαλος mm'},
      {k:'thigh',     lbl:'4. Μηρός (τετρακέφαλος) mm'}
    ];
  } else if(p==='jp3'){
    ref='Jackson & Pollock, 1978/1980';
    if(sex==='M') defs=[{k:'chest',lbl:'Στήθος mm'},{k:'abdomen',lbl:'Κοιλιά mm'},{k:'thigh',lbl:'Μηρός mm'}];
    else defs=[{k:'tricep',lbl:'Τρικέφαλος mm'},{k:'suprailiac',lbl:'Υπερλαγόνιο mm'},{k:'thigh',lbl:'Μηρός mm'}];
  } else if(p==='jp7'){
    ref='Jackson & Pollock, 1978/1980';
    defs=[{k:'chest',lbl:'Στήθος'},{k:'midaxillary',lbl:'Μεσομάσχαλο'},{k:'tricep',lbl:'Τρικέφαλος'},{k:'subscapular',lbl:'Υποπλάτιο'},{k:'abdomen',lbl:'Κοιλιά'},{k:'suprailiac',lbl:'Υπερλαγόνιο'},{k:'thigh',lbl:'Μηρός'}];
  } else {
    ref='Slaughter et al., 1988';
    defs=[{k:'tricep',lbl:'Τρικέφαλος mm'},{k:'calf',lbl:'Γαστροκνήμιος mm'}];
  }
  if(refSpan)refSpan.textContent=ref;
  var sitesDiv=document.getElementById('sf-sites');
  if(sitesDiv){
    var siteNames=defs.map(function(f){return f.lbl.replace(/^\d+\.\s*/,'').replace(/\s*mm$/,'');});
    sitesDiv.textContent='📍 Σημεία: '+siteNames.join(' · ');
  }
  var html='';
  defs.forEach(function(f){
    // ✅ persistent label above the field (was placeholder-only — label used to vanish while
    // typing, which cost accuracy during fast in-clinic entry across many clients)
    html+='<div style="display:flex;flex-direction:column;gap:2px">'
      +'<label for="sf-'+f.k+'" style="font-size:9px;color:var(--text-muted)">'+f.lbl+'</label>'
      +'<input type="number" id="sf-'+f.k+'" placeholder="mm" min="1" max="80" step="0.5" class="tracker-inp" style="width:120px" oninput="updateSkinfoldCalc()"'+(carryOver[f.k]?' value="'+carryOver[f.k]+'"':'')+'>'
      +'</div>';
  });
  fieldsDiv.innerHTML=html;
  var resDiv=document.getElementById('sf-result');
  if(Object.keys(carryOver).length){updateSkinfoldCalc();} // re-show %BF immediately if carried-over values already form a complete set for the new protocol
  else if(resDiv)resDiv.style.display='none';
}

function updateSkinfoldCalc(){
  var c=getC();if(!c)return;
  var protoEl=document.getElementById('sf-proto');
  if(!protoEl)return;
  var p=protoEl.value;
  var sex=c.sex||'M';
  var age=c.age||25;
  var wInp=document.getElementById('tr-weight');
  var weight=wInp?parseFloat(wInp.value)||0:c.weight||0;
  var fields={};
  ['chest','abdomen','thigh','tricep','suprailiac','midaxillary','subscapular','calf'].forEach(function(k){
    var el=document.getElementById('sf-'+k);
    if(el&&el.value)fields[k]=parseFloat(el.value)||0;
  });
  var res=calcSkinfoldBF(p,sex,age,fields);
  var resDiv=document.getElementById('sf-result');
  if(!resDiv)return;
  if(res.bf===null){resDiv.style.display='none';return;}
  var lbm=weight>0?+(weight*(1-res.bf/100)).toFixed(1):null;
  var fm=weight>0?+(weight*res.bf/100).toFixed(1):null;
  var bfClass=res.bf<10?'#1565C0':res.bf<20?'var(--good)':res.bf<30?'#e65100':'#c62828';
  var bdTxt=res.bd?'<span style="font-size:10px;color:var(--text-muted);margin-left:4px">BD: '+res.bd+'</span>':'';
  resDiv.className='sf-result-row';
  resDiv.innerHTML='<span><b>%BF:</b> <span style="color:'+bfClass+';font-size:14px;font-weight:700">'+res.bf+'%</span>'+bdTxt+'</span>'
    +(lbm?'<span><b>LBM:</b> '+lbm+' kg</span>':'')
    +(fm?'<span><b>FM:</b> '+fm+' kg</span>':'')
    +'<span style="font-size:10px;color:var(--text-muted)">Άθροισμα: '+res.sum+' mm</span>'
    +'<button class="btn primary" style="padding:4px 10px;font-size:11px;margin-left:auto" onclick="applySkinfoldBF()">✓ Χρήση ως %BF</button>';
  resDiv.style.display='flex';
}

function applySkinfoldBF(){
  var c=getC();if(!c)return;
  var protoEl=document.getElementById('sf-proto');
  if(!protoEl)return;
  var fields={};
  ['chest','abdomen','thigh','tricep','suprailiac','midaxillary','subscapular','calf'].forEach(function(k){
    var el=document.getElementById('sf-'+k);
    if(el&&el.value)fields[k]=parseFloat(el.value)||0;
  });
  var res=calcSkinfoldBF(protoEl.value,c.sex||'M',c.age||25,fields);
  if(res.bf===null)return;
  var bfInp=document.getElementById('tr-bf');
  if(bfInp){bfInp.value=res.bf;bfInp.style.background='#e8f5e9';bfInp.style.borderColor='#81c784';setTimeout(function(){bfInp.style.background='';bfInp.style.borderColor='';},1200);}
  // ✅ a skinfold-derived %BF is a caliper measurement — mark the method select to match
  var mSel=document.getElementById('tr-bf-method');
  if(mSel)mSel.value='caliper';
}

function getSkinfoldEntry(){
  var protoEl=document.getElementById('sf-proto');
  var bodyEl=document.getElementById('sf-body');
  if(!protoEl||!bodyEl||bodyEl.style.display==='none')return null;
  var p=protoEl.value;
  var fields={};
  var any=false;
  ['chest','abdomen','thigh','tricep','suprailiac','midaxillary','subscapular','calf'].forEach(function(k){
    var el=document.getElementById('sf-'+k);
    if(el&&el.value){fields[k]=parseFloat(el.value)||0;any=true;}
  });
  if(!any)return null;
  return{protocol:p,fields:fields};
}

/* ── Ergometric CSV Import ──────────────────────────────────────────────────
   Reads a CSV exported from the ergometric device (Weight, Height, DoB,
   Skinfold Tricep/Subscapular/Abdominal/Supraspinale/Front Thigh, ...) and
   pre-fills the tracker entry + skinfold panel (JP 4-site). Supraspinale is
   treated as equivalent to the suprailiac/JP4 site; Subscapular is kept in
   sfFields for the record but isn't used by the JP4 formula. */
function triggerErgoCSVImport(){
  var inp=document.getElementById('ergo-csv-input');
  if(inp)inp.click();
}

function parseErgoCSVRows(text){
  var lines=text.split(/\r\n|\n|\r/).filter(function(l){return l.trim().length>0;});
  if(lines.length<2)return[];
  var headers=lines[0].split(',').map(function(h){return h.trim();});
  var num=function(v){var n=parseFloat(v);return isNaN(n)?null:n;};
  var isoDate=function(v){return v&&/^\d{4}-\d{2}-\d{2}$/.test(v)?v:null;};
  return lines.slice(1).map(function(line){
    var cells=line.split(',');
    var row={};
    headers.forEach(function(h,i){row[h]=(cells[i]||'').trim();});
    var height=num(row['Height']);
    if(height!=null&&height<=3)height=+(height*100).toFixed(1); // meters -> cm
    return{
      testDate:isoDate(row['Test Date']),
      weight:num(row['Weight']),
      height:height,
      birthDate:isoDate(row['DoB']),
      tricep:num(row['Skinfold Tricep']),
      subscapular:num(row['Skinfold Subscapular']),
      abdomen:num(row['Skinfold Abdominal']),
      suprailiac:num(row['Skinfold Supraspinale']),
      thigh:num(row['Skinfold Front Thigh'])
    };
  }).filter(function(r){return r.testDate&&r.weight!=null;});
}

function parseErgoCSV(text){
  var rows=parseErgoCSVRows(text);
  if(!rows.length)return null;
  rows.sort(function(a,b){return a.testDate<b.testDate?-1:a.testDate>b.testDate?1:0;});
  return rows[rows.length-1];
}

function ageAtDate(birthDate,atDateStr){
  if(!birthDate)return null;
  var b=new Date(birthDate);if(isNaN(b.getTime()))return null;
  var t=atDateStr?new Date(atDateStr):new Date();
  if(isNaN(t.getTime()))t=new Date();
  var a=t.getFullYear()-b.getFullYear();
  var m=t.getMonth()-b.getMonth();
  if(m<0||(m===0&&t.getDate()<b.getDate()))a--;
  return (a>=0&&a<=150)?a:null;
}

/* One-time, idempotent fix for the old "JP5" protocol, which wrongly applied the
   JP7 (7-site) regression coefficients to a 5-site skinfold sum and systematically
   underestimated %BF. Recomputes bf from the raw sfFields already stored on each
   weightLog entry using the correct JP4 (Jackson & Pollock 1985) formula — no
   re-measurement needed. Uses age-at-measurement-date via ageAtDate when birthDate
   is known, falling back to the client's current age otherwise. */
function migrateClientSkinfoldBF(c){
  if(!c||!c.weightLog||!c.weightLog.length)return false;
  var changed=false;
  c.weightLog.forEach(function(e){
    if(e.sfProtocol==='jp5'&&e.sfFields){
      var age=ageAtDate(c.birthDate,e.date)||c.age||25;
      var res=calcSkinfoldBF('jp4',c.sex||'M',age,e.sfFields);
      if(res.bf!=null)e.bf=res.bf;
      e.sfProtocol='jp4';
      changed=true;
    }
  });
  if(changed){
    var latest=c.weightLog[c.weightLog.length-1];
    if(latest&&latest.bf>0){c.bf=latest.bf;c.lbm=+(latest.weight*(1-latest.bf/100)).toFixed(1);}
  }
  return changed;
}

function applyErgoCSVData(data){
  var c=getC();if(!c)return;
  var profileChanged=false;
  if(data.height!=null&&!c.height){c.height=data.height;profileChanged=true;}
  if(data.birthDate&&!c.birthDate&&!c.age){
    c.birthDate=data.birthDate;
    var a=ageAtDate(data.birthDate);
    if(a!=null)c.age=a;
    profileChanged=true;
  }
  if(profileChanged)save();

  var s3=document.getElementById('s3');
  if(s3)s3.innerHTML=buildTrackerHtml(c);

  var dateInp=document.getElementById('tr-date');
  if(dateInp&&data.testDate)dateInp.value=data.testDate;
  var wInp=document.getElementById('tr-weight');
  if(wInp&&data.weight!=null)wInp.value=data.weight;

  toggleSkinfoldPanel();
  var protoEl=document.getElementById('sf-proto');
  if(protoEl){protoEl.value='jp4';updateSkinfoldFields();}
  ['tricep','subscapular','abdomen','suprailiac','thigh'].forEach(function(k){
    var el=document.getElementById('sf-'+k);
    if(el&&data[k]!=null)el.value=data[k];
  });
  updateSkinfoldCalc();
  applySkinfoldBF();

  var hEl=document.getElementById('inp-height');
  if(hEl&&c.height)hEl.value=c.height;
  updateAgeDisplay();

  showSuccessToast('✅ Εισήχθησαν δεδομένα από το CSV. Έλεγξε τις τιμές και πάτησε "+ Προσθήκη" για να αποθηκευτούν.');
}

function handleErgoCSVFile(evt){
  var files=evt.target.files;
  if(!files||!files.length)return;
  if(files.length===1){
    var reader=new FileReader();
    reader.onload=function(e){
      try{
        var data=parseErgoCSV(e.target.result);
        if(!data){showErrorToast('Δεν βρέθηκαν αναγνωρίσιμα δεδομένα στο CSV.');return;}
        applyErgoCSVData(data);
      }catch(err){showErrorToast('Σφάλμα ανάγνωσης CSV: '+err.message);}
      evt.target.value='';
    };
    reader.readAsText(files[0],'UTF-8');
    return;
  }
  // ✅ Batch import — multiple older CSVs at once, merged into history by Test Date
  var texts=new Array(files.length);
  var pending=files.length;
  Array.prototype.forEach.call(files,function(file,i){
    var r=new FileReader();
    r.onload=function(e){texts[i]=e.target.result;if(--pending===0)finishBatchErgoImport(texts);};
    r.onerror=function(){if(--pending===0)finishBatchErgoImport(texts);};
    r.readAsText(file,'UTF-8');
  });
  evt.target.value='';
}

function finishBatchErgoImport(texts){
  var c=getC();if(!c)return;
  var allRows=[];
  texts.forEach(function(t){if(t)allRows=allRows.concat(parseErgoCSVRows(t));});
  if(!allRows.length){showErrorToast('Δεν βρέθηκαν αναγνωρίσιμα δεδομένα στα CSV.');return;}
  var byDate={};
  allRows.forEach(function(r){byDate[r.testDate]=r;}); // later file wins on same date
  var rows=Object.keys(byDate).map(function(d){return byDate[d];}).sort(function(a,b){return a.testDate<b.testDate?-1:1;});

  if(!c.weightLog)c.weightLog=[];
  var existingDates={};
  c.weightLog.forEach(function(e){existingDates[e.date]=true;});
  var toAdd=rows.filter(function(r){return !existingDates[r.testDate];});
  var skipped=rows.length-toAdd.length;
  if(!toAdd.length){showErrorToast('Όλες οι ημερομηνίες υπάρχουν ήδη στο ιστορικό ('+skipped+' παραλείφθηκαν).');return;}

  var summary=toAdd.map(function(r){return r.testDate+' — '+r.weight+'kg';}).join('\n');
  var msg='Θα προστεθούν '+toAdd.length+' μετρήσεις στο ιστορικό (ταξινομημένες κατά ημερομηνία):\n\n'+summary
    +(skipped?'\n\n('+skipped+' παραλείφθηκαν — υπάρχουν ήδη ίδιες ημερομηνίες στο ιστορικό)':'')
    +'\n\nΣυνέχεια;';
  showConfirmDialog(msg, function(){
    var profileChanged=false;
    var withHeight=rows.filter(function(r){return r.height!=null;})[0];
    if(withHeight&&!c.height){c.height=withHeight.height;profileChanged=true;}
    var withDob=rows.filter(function(r){return r.birthDate;})[0];
    if(withDob&&!c.birthDate&&!c.age){
      c.birthDate=withDob.birthDate;
      var a0=ageAtDate(withDob.birthDate);
      if(a0!=null)c.age=a0;
      profileChanged=true;
    }

    toAdd.forEach(function(r){
      var age=ageAtDate(c.birthDate||r.birthDate,r.testDate)||c.age||25;
      var fields={tricep:r.tricep||0,subscapular:r.subscapular||0,abdomen:r.abdomen||0,suprailiac:r.suprailiac||0,thigh:r.thigh||0};
      var res=calcSkinfoldBF('jp4',c.sex||'M',age,fields);
      c.weightLog.push({date:r.testDate,weight:r.weight,bf:res.bf||0,waist:0,hip:0,arm:0,sleep:0,energy:0,compliance:0,notes:'',sfProtocol:'jp4',sfFields:fields,bfMethod:'caliper'});
    });
    c.weightLog.sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});

    var latest=c.weightLog[c.weightLog.length-1];
    if(latest.bf>0){c.lbm=+(latest.weight*(1-latest.bf/100)).toFixed(1);c.bf=latest.bf;}
    c.weight=latest.weight;
    profileChanged=true;

    save();
    var s3=document.getElementById('s3');
    if(s3)s3.innerHTML=buildTrackerHtml(c);
    var hEl=document.getElementById('inp-height');if(hEl&&c.height)hEl.value=c.height;
    updateAgeDisplay();

    showSuccessToast('✅ Προστέθηκαν '+toAdd.length+' μετρήσεις στο ιστορικό.'+(skipped?' ('+skipped+' παραλείφθηκαν λόγω ίδιας ημερομηνίας)':''));
  }, {confirmLabel:'Προσθήκη'});
}

function addWeightEntry(){
  var c=getC();if(!c)return;
  if(!c.weightLog)c.weightLog=[];
  var date=document.getElementById('tr-date').value;
  var weight=parseFloat(document.getElementById('tr-weight').value);
  var bf=parseFloat(document.getElementById('tr-bf').value)||0;
  if(bf>0)bf=Math.max(3,Math.min(60,bf)); // clamp to physiological range — HTML min/max are bypassable by typing
  var waist=parseFloat((document.getElementById('tr-waist')||{}).value)||0;
  // ✅ audit fix (2026-08-16): waist/hip/arm had no clamp at all (unlike weight/bf above) — a typed
  // negative or out-of-range value saved silently and could later feed nonsense into body-comp
  // charts/ACSM bands. Same "HTML min/max are bypassable by typing" clamp pattern as bf, matching
  // each field's own input min/max (see the tr-waist/tr-hip/tr-arm inputs in buildTrackerHtml).
  if(waist>0)waist=Math.max(40,Math.min(200,waist));
  var hip=parseFloat((document.getElementById('tr-hip')||{}).value)||0;
  if(hip>0)hip=Math.max(50,Math.min(200,hip));
  var arm=parseFloat((document.getElementById('tr-arm')||{}).value)||0;
  if(arm>0)arm=Math.max(15,Math.min(60,arm));
  var sleep=parseInt((document.getElementById('tr-sleep')||{}).value)||0;
  var energy=parseInt((document.getElementById('tr-energy')||{}).value)||0;
  var compliance=parseInt((document.getElementById('tr-compliance')||{}).value)||0;
  var notes=(document.getElementById('tr-notes').value||'').trim();
  // ✅ was a silent no-op on invalid input — clicking "+ Προσθήκη" with no weight looked
  // identical to a successful save, so nothing told the practitioner it didn't go through
  if(!date){
    showErrorToast('Χρειάζεται ημερομηνία για να καταχωρηθεί η μέτρηση.');
    var dateInp=document.getElementById('tr-date');
    if(dateInp){dateInp.style.borderColor='#e57373';setTimeout(function(){dateInp.style.borderColor='';},1500);}
    return;
  }
  if(!weight||weight<20||weight>300){
    showErrorToast('Χρειάζεται έγκυρο βάρος (20-300 kg) για να καταχωρηθεί η μέτρηση.');
    var weightInp=document.getElementById('tr-weight');
    if(weightInp){weightInp.style.background='#ffebee';weightInp.style.borderColor='#e57373';setTimeout(function(){weightInp.style.background='';weightInp.style.borderColor='';},1500);}
    return;
  }
  var sfEntry=getSkinfoldEntry();
  var bfMethodSel=(document.getElementById('tr-bf-method')||{}).value||'';
  var entry={date:date,weight:weight,bf:bf,waist:waist,hip:hip,arm:arm,sleep:sleep,energy:energy,compliance:compliance,notes:notes};
  if(sfEntry){entry.sfProtocol=sfEntry.protocol;entry.sfFields=sfEntry.fields;}
  // ✅ record HOW the %BF was obtained — skinfold panel open ⇒ 'caliper' implicitly, otherwise
  // whatever the dietitian picked in #tr-bf-method. Only when a %BF value was actually entered;
  // older entries just have no .bfMethod (Phase 1 percentile work treats that as "unknown").
  if(bf>0){ var _bfm=sfEntry?'caliper':bfMethodSel; if(_bfm)entry.bfMethod=_bfm; }
  var wasEdit=(_weightEditIdx>=0 && !!c.weightLog[_weightEditIdx]); // captured before the reset below, so the toast message can tell add apart from edit
  if(wasEdit){
    // ✅ editing an existing entry (editWeightEntry) — replace it in place instead of pushing a
    // duplicate; previously there was no way to fix a typo without deleting + fully retyping
    c.weightLog[_weightEditIdx]=entry;
    _weightEditIdx=-1;
  } else {
    c.weightLog.push(entry);
  }
  // ✅ was `a.date<b.date?-1:1`, which returns 1 (not 0) for equal dates — two entries logged on
  // the same day could non-deterministically swap order on every re-render/re-sort
  c.weightLog.sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
  // Auto-update LBM + profile BF% if body fat was entered
  if(bf>0){c.lbm=+(weight*(1-bf/100)).toFixed(1);c.bf=bf;c.weight=weight;}
  // Sync weight even if no BF%
  if(weight>0)c.weight=weight;
  save();
  // ✅ the error path already told the practitioner when a save failed (showErrorToast above);
  // a successful save was still silent — nothing but the table quietly changing underneath —
  // so there was no way to tell "it worked" from "I clicked the wrong thing" at a glance
  showSuccessToast(wasEdit?'✅ Η μέτρηση της '+date+' ενημερώθηκε.':'✅ Η μέτρηση προστέθηκε.');
  var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
}

// ✅ opens the entry form pre-filled with weightLog[idx] instead of the previous edit-free
// delete-and-retype-everything workflow
function editWeightEntry(idx){
  var c=getC();if(!c||!c.weightLog||!c.weightLog[idx])return;
  _weightEditIdx=idx;
  var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
  var dateInp=document.getElementById('tr-date');
  if(dateInp)dateInp.scrollIntoView({block:'center'}); // form is above the table — without this the pre-filled fields aren't visible
}
function cancelWeightEdit(){
  _weightEditIdx=-1;
  var c=getC();if(!c)return;
  var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
}

function removeWeightEntry(idx){
  var c=getC();if(!c||!c.weightLog||!c.weightLog[idx])return;
  var entry=c.weightLog[idx];
  showConfirmDialog('Διαγραφή της μέτρησης της '+entry.date+' ('+entry.weight+'kg);', function(){
    c.weightLog.splice(idx,1);
    // ✅ keep _weightEditIdx pointing at the right entry (or clear it) if the row being deleted
    // sits before/at the one currently open in the edit form
    if(_weightEditIdx===idx)_weightEditIdx=-1;
    else if(_weightEditIdx>idx)_weightEditIdx--;
    save();
    var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
  }, {icon:'🗑️', confirmLabel:'Διαγραφή'});
}

function addConsultEntry(){
  var c=getC();if(!c)return;
  if(!c.consultLog)c.consultLog=[];
  var date=document.getElementById('cons-date').value;
  var notes=(document.getElementById('cons-notes').value||'').trim();
  if(!date||!notes)return;
  c.consultLog.push({date:date,notes:notes,weight:c.weight||null});
  c.consultLog.sort(function(a,b){return a.date<b.date?-1:1;});
  save();
  var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
}

function removeConsultEntry(idx){
  var c=getC();if(!c||!c.consultLog||!c.consultLog[idx])return;
  var entry=c.consultLog[idx];
  showConfirmDialog('Διαγραφή της σημείωσης συμβουλευτικής της '+entry.date+';', function(){
    c.consultLog.splice(idx,1);
    save();
    var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
  }, {icon:'🗑️', confirmLabel:'Διαγραφή'});
}


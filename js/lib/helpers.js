// js/lib/helpers.js
// Pure leaf helpers extracted from the top of js/app-part1.js (module split wave 2).
// Display/format (esc, escJsAttr, DAYS, snapWholeG, pluralUnit, fmtFoodQty),
// progress rings / ACSM gauge (pctRing, pctStatusColor, bfGaugeHtml, clientGoalWeightPct),
// phone normalisation (normalizePhoneIntl), pregnancy (getPregTrimester[Label],
// getIOMWeightGainRange, checkGestationalWeightGain), and the FOOD_PAIRING_EXT->DB
// merge. Depends only on js/data/* (loaded earlier). Loads between data/* and app-part1.js.

// Global HTML-escape helper — sanitizes user input (client names, notes, etc.)
// before it is injected into innerHTML. Prevents broken markup / XSS.
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
// Κυκλικό δαχτυλίδι προόδου 0-100% (.pct-ring, css/styles.css) — μοιράζεται το ίδιο markup σε
// κάθε σημείο του app που δείχνει ποσοστό. opts: size/thickness σε px, color/track = CSS color
// string (π.χ. 'var(--teal)' ή αποτέλεσμα του pctStatusColor()), label:false για μικρά badge-size
// rings χωρίς κείμενο στο κέντρο (δεν χωράει κάτω από ~32px), fontSize προαιρετικό override.
function pctRing(pct,opts){
  opts=opts||{};
  var p=Math.max(0,Math.min(100,Math.round(pct||0)));
  var size=opts.size||56;
  var thick=opts.thickness||7;
  var color=opts.color||'var(--teal)';
  var track=opts.track||'var(--teal-tint)';
  var fontSize=opts.fontSize||Math.max(9,Math.round(size*0.24));
  var labelHtml=opts.label===false?'':'<span class="pct-ring-label" style="font-size:'+fontSize+'px">'+p+'%</span>';
  return '<div class="pct-ring" style="--pr-size:'+size+'px;--pr-thick:'+thick+'px;--pr-p:'+p+'%;--pr-color:'+color+';--pr-track:'+track+'">'+labelHtml+'</div>';
}
// Χρώμα κατάστασης (καλά/προσοχή/κρίσιμο) για rings όπου το νόημα είναι "πόσο πρόσφατο/υγιές" αντί
// για "πρόοδος προς στόχο" — π.χ. ημέρες από τελ. check-in. Για progress-προς-στόχο rings (goalPct
// κ.λπ.) χρησιμοποίησε var(--teal) απευθείας, όχι αυτό — εκεί το χρώμα δεν είναι καλό/κακό.
function pctStatusColor(pct){
  if(pct>=66) return 'var(--good)';
  if(pct>=33) return 'var(--warn)';
  return 'var(--danger)';
}
// Ημικυκλικό gauge — θέση του %BF στις ζώνες αναφοράς (.bf-gauge-*, css/styles.css).
// Όλα τα δεδομένα από js/lib/bf-norms.js. Όταν δίνεται ηλικία (age>0) το gauge δείχνει
// τα age×sex ΥΓΙΗ ΕΥΡΗ του Gallagher 2000 (bfHealthByAge) — 4 ζώνες, ηλικιακά διορθωμένες.
// Χωρίς ηλικία, πέφτει πίσω στο μη-ηλικιακά-διορθωμένο 5-band ACE/ACSM (BF_BANDS).
// Επιστρέφει '' όταν λείπει %BF ή για ανήλικους. goalBF: ο στόχος %BF του πελάτη (c.goalBF)
// — σχεδιάζει έναν ◆ δείκτη στο τόξο· παραλείπεται αν 0/κενό.
function bfGaugeHtml(bf,sex,isMinor,goalBF,age){
  if(!(bf>0)||isMinor)return'';
  var gv=(typeof bfHealthByAge==='function')?bfHealthByAge(bf,sex,age):null;
  var bands,visualMax,headerTxt,stampTxt,zoneLbl,zoneCol,extraLine='';
  if(gv){
    // Gallagher 2000 — τέσσερις ηλικιακά-εξειδικευμένες ζώνες γύρω από το υγιές εύρος.
    var hLo=gv.healthy[0],hHi=gv.healthy[1],oLo=gv.obeseLo;
    bands=[{hi:hLo,col:'#1565C0'},{hi:hHi,col:'#2e7d32'},{hi:oLo-1,col:'#f57c00'},{hi:9999,col:'#c62828'}];
    visualMax=oLo+7;
    var GLBL={low:'Κάτω από το υγιές',healthy:'Υγιές',overfat:'Υπέρβαρο',obese:'Παχυσαρκία'};
    zoneLbl=GLBL[gv.key];zoneCol=gv.col;
    headerTxt='🎯 Θέση %BF — υγιές εύρος για '+(sex==='F'?'γυναίκα':'άνδρα')+' '+gv.ageBand+' ετών';
    stampTxt='υγιή εύρη %BF κατά ηλικία & φύλο (Gallagher 2000) — όχι διάγνωση';
    extraLine='<div style="text-align:center;font-size:10px;color:var(--text-muted);margin-top:1px">Υγιές εύρος: '+hLo+'–'+hHi+'%</div>';
  } else {
    // Χωρίς ηλικία — 5-band ACE/ACSM (χωρίς διόρθωση ηλικίας).
    var aceBands=BF_BANDS(sex);
    var LBL={essential:'Απαραίτητο',athletic:'Αθλητικό',fitness:'Φυσιολογικό',acceptable:'Αποδεκτό',obesity:'Παχυσαρκία'};
    bands=aceBands.map(function(b){return{hi:b.hi,col:b.col,key:b.key};});
    visualMax=aceBands[3].hi+7;
    var z=bands.find(function(b){return bf<=b.hi;})||bands[bands.length-1];
    zoneLbl=LBL[z.key];zoneCol=z.col;
    headerTxt='🎯 Θέση %BF — κατηγορίες ACE/ACSM (5 ζώνες, χωρίς διόρθωση ηλικίας)';
    stampTxt='στατιστικά όρια αναφοράς, όχι διάγνωση';
  }
  // Η τελευταία ζώνη είναι ανοιχτή — σε γραμμική κλίμακα θα κατάπινε οπτικά το τόξο. Η κλίμακα
  // ΚΟΒΕΤΑΙ στο visualMax· η βελόνα "καρφώνεται" εκεί για πολύ υψηλές τιμές, αλλά η ΕΤΙΚΕΤΑ
  // (zoneLbl, υπολογισμένη πιο πάνω στα πραγματικά όρια) παραμένει σωστή.
  var acc=0,stops=[];
  bands.forEach(function(b){
    var pct=Math.min(b.hi,visualMax)/visualMax*50;
    if(pct>acc){stops.push(b.col+' '+acc.toFixed(2)+'% '+pct.toFixed(2)+'%');acc=pct;}
  });
  // from 270deg: το conic-gradient μετρά τις γωνίες από τις 12 (0deg) δεξιόστροφα — 270deg = 9 η ώρα
  // (αριστερά). Σαρώνοντας δεξιόστροφα 0%→50% διαγράφεται το πάνω μισό του κύκλου (το μόνο ορατό —
  // .bf-gauge-wrap κόβει το κάτω μισό με overflow:hidden).
  var gradient='conic-gradient(from 270deg,'+stops.join(',')+',transparent 50% 100%)';
  var angle=(Math.max(0,Math.min(visualMax,bf))/visualMax*180-90).toFixed(1);
  // ✅ per-client goal marker — ο στόχος %BF (c.goalBF)· ίδιο transform-origin με τη βελόνα.
  var goalTick='';
  if(goalBF>0){
    var gAngle=(Math.max(0,Math.min(visualMax,goalBF))/visualMax*180-90).toFixed(1);
    goalTick='<div class="bf-gauge-goal" style="transform:rotate('+gAngle+'deg)"></div>';
  }
  return '<div style="margin-top:10px;padding:10px 10px 12px;background:var(--card-bg);border:1px solid var(--border-light);border-radius:8px">'
    +'<div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">'+headerTxt+'</div>'
    +'<div class="bf-gauge-wrap"><div class="bf-gauge-arc" style="background:'+gradient+'"></div>'+goalTick+'<div class="bf-gauge-needle" style="transform:rotate('+angle+'deg)"></div></div>'
    +'<div style="text-align:center;font-size:13px;font-weight:700;color:'+zoneCol+'">'+bf+'% — '+zoneLbl+'</div>'
    +extraLine
    +(goalBF>0?'<div style="text-align:center;font-size:10px;color:var(--text-muted);margin-top:1px">🎯 Στόχος: '+goalBF+'%</div>':'')
    +'<div style="text-align:center;font-size:9px;color:var(--text-muted);margin-top:3px">'+stampTxt+'</div>'
    +'</div>';
}
// Ποσοστό προόδου προς τον στόχο βάρους — ίδιος ακριβώς υπολογισμός με το goalBarHtml στην
// περίληψη ραντεβού (js/app-part2.js, γύρω από "Νέα κάρτα Στόχος βάρους"). Κοινό helper ώστε το
// ring στην κάρτα πελάτη (Πελάτες) και στο client portal να μη διπλασιάζουν/αποκλίνουν τη λογική.
// null όταν δεν υπάρχουν αρκετά δεδομένα (χωρίς goalWeight, χωρίς μέτρηση, ή η πρώτη μέτρηση ήταν
// ήδη πρακτικά πάνω στον στόχο — οπότε "% προόδου" δεν έχει νόημα) — τότε απλά δεν εμφανίζεται ring.
function clientGoalWeightPct(c){
  if(!(c.goalWeight>0))return null;
  var wl=c.weightLog||[];
  if(!wl.length)return null;
  var lastW=wl[wl.length-1],firstW=wl[0];
  if(!lastW||!firstW||Math.abs(firstW.weight-c.goalWeight)<=0.05)return null;
  return Math.max(0,Math.min(100,Math.round((firstW.weight-lastW.weight)/(firstW.weight-c.goalWeight)*100)));
}
// Ασφαλές string για μέσα σε onclick="fn('...')": πρώτα escape για το JS string
// literal (\ και '), μετά escape για το ίδιο το HTML attribute (" < > &) —
// χωρίς το δεύτερο βήμα, ένα " στο κείμενο του πελάτη σπάει έξω από το onclick="..."
// (βλ. audit finding: app-part2.js noteJs, στο client-portal note field).
// Οι αλλαγές γραμμής γίνονται \n/\r ΜΕΤΑ το διπλασιασμό του backslash — ένα raw newline
// μέσα σε single-quoted JS string literal είναι SyntaxError, οπότε ο inline handler δεν
// μεταγλωττιζόταν καθόλου (π.χ. «↩️ Απάντησε» σε πολύγραμμο μήνυμα πελάτη από <textarea>).
function escJsAttr(s){
  return String(s==null?'':s)
    .replace(/&/g,'&amp;')
    .replace(/\\/g,'\\\\')
    .replace(/'/g,"\\'")
    .replace(/"/g,'&quot;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\r/g,'\\r')
    .replace(/\n/g,'\\n');
}
var DAYS=['Δευτέρα','Τρίτη','Τετάρτη','Πέμπτη','Παρασκευή','Σάββατο','Κυριακή'];
// Κοινή κανονικοποίηση τηλεφώνου για wa.me links — πελάτες σε Ελλάδα (10ψήφιο, χωρίς/με 30) ΚΑΙ
// Κύπρο (8ψήφιο, χωρίς/με 357) μοιράζονται τον ίδιο λογαριασμό, οπότε ΔΕΝ μπορούμε να υποθέσουμε
// πάντα +30 όπως έκανε παλιότερα ο κώδικας (έσπαγε τους Κύπριους πελάτες). Το μήκος χωρίς κωδικό
// χώρας αρκεί για να ξεχωρίσει τις δύο χώρες αξιόπιστα (καμία επικάλυψη: 8 vs 10 ψηφία), οπότε δεν
// χρειάζεται νέο πεδίο "χώρα" στην καρτέλα πελάτη. Αφαιρεί αρχικά μηδενικά (διεθνές 00-πρόθεμα ή
// τυπογραφικό λάθος) πριν τον έλεγχο μήκους.
function normalizePhoneIntl(raw){
  var phone=(raw||'').replace(/[^0-9]/g,'');
  if(!phone) return '';
  if(phone.charAt(0)==='0') phone=phone.replace(/^0+/,'');
  if(phone.indexOf('30')===0 && phone.length===12) return phone;
  if(phone.indexOf('357')===0 && phone.length===11) return phone;
  if(phone.length===8) return '357'+phone;
  if(phone.length===10) return '30'+phone;
  return phone;
}

// ── Client-facing hand-off messages (WhatsApp / Email) in the client's plan language ──────
// c.lang: 'el' | 'en' | 'ru' | 'tr', mirroring PUBLISH_MSG_DICTS (js/plan-gen/publish-modal.js).
// Consumed at runtime by the dietitian's one-click sends: feedback reminder / weekly recap /
// activity nudge (js/tabs/home-diets.js), client-note & plan-feedback replies
// (js/portal-comms/portal-comms.js), body-comp report send (js/reports/exports.js).
// NOTE: the plan-feedback category label (lbl) passed to replyPfRow still comes from the
// Greek PF_ROW_LABELS map and is not translated yet — only the sentence frame is localised.
var CLIENT_MSG_DICTS={
  el:{
    fbReminder:function(fn,url){return 'Γεια σου '+fn+'! Πριν φτιάξω το πλάνο της επόμενης εβδομάδας, πες μου γρήγορα πώς πήγε αυτή — 30 δευτερόλεπτα, στην καρτέλα Πρόοδος: '+url;},
    fbReminderSubj:'Πες μου πώς πήγε η εβδομάδα — Feed Your Health',
    recapAdherence:function(pct){return pct+'% τήρηση αυτή την εβδομάδα';},
    recapWeight:function(delta){return delta+' βάρος';},
    recapStreak:function(n){return '🔥 '+n+' '+(n===1?'μέρα':'μέρες')+' σερί';},
    recap:function(fn,parts){return 'Καλή Κυριακή '+fn+'! Η εβδομάδα σου: '+parts+' 👏';},
    recapSubj:'Η εβδομάδα σου — Feed Your Health',
    nudge:function(fn,url){return 'Γεια σου '+fn+'! Είδα ότι δεν έχεις τσεκάρει τίποτα στο πλάνο σου τελευταία — όλα καλά; Το link είναι εδώ αν θες να ρίξεις μια ματιά: '+url;},
    nudgeSubj:'Πώς πάει; — Feed Your Health',
    replyNote:function(fn,note){return 'Γεια σου '+fn+'! Είδα το μήνυμά σου: «'+note+'» — ';},
    replySubj:'Απάντηση — Feed Your Health',
    replyPfRow:function(fn,lbl,reasons){return 'Γεια σου '+fn+'! Είδα ότι το '+lbl+' σου φάνηκε λίγο'+(reasons?(' ('+reasons+')'):'')+' αυτή την εβδομάδα — ας το προσαρμόσουμε μαζί, πες μου τι θα σε βόλευε καλύτερα.';},
    replyPfGeneral:function(fn){return 'Γεια σου '+fn+'! Είδα το feedback σου για το πλάνο αυτής της εβδομάδας — θέλω να το προσαρμόσουμε ώστε να σου ταιριάζει καλύτερα. Πες μου τι σε δυσκόλεψε περισσότερο.';},
    bodyComp:function(fn){return 'Γεια σου '+fn+'! Σου στέλνω το ιστορικό μετρήσεών σου (βάρος, σύσταση σώματος) σε PDF 📎';},
    bodyCompSubj:'Το ιστορικό μετρήσεών σου — Feed Your Health',
    lipoForm:function(fn){return 'Γεια σου '+fn+'! Σου στέλνω το έντυπο λιπομέτρησής σου (σύσταση σώματος, δερματοπτυχές, περιφέρειες) σε PDF 📎';},
    lipoFormSubj:'Το έντυπο λιπομέτρησής σου — Feed Your Health'
  },
  en:{
    fbReminder:function(fn,url){return 'Hi '+fn+'! Before I build next week’s plan, tell me quickly how this one went — 30 seconds, on the Progress tab: '+url;},
    fbReminderSubj:'Tell me how your week went — Feed Your Health',
    recapAdherence:function(pct){return pct+'% adherence this week';},
    recapWeight:function(delta){return delta+' weight';},
    recapStreak:function(n){return '🔥 '+n+' '+(n===1?'day':'days')+' streak';},
    recap:function(fn,parts){return 'Happy Sunday '+fn+'! Your week: '+parts+' 👏';},
    recapSubj:'Your week — Feed Your Health',
    nudge:function(fn,url){return 'Hi '+fn+'! I noticed you haven’t checked anything off in your plan lately — all good? Here’s the link if you want to take a look: '+url;},
    nudgeSubj:'How’s it going? — Feed Your Health',
    replyNote:function(fn,note){return 'Hi '+fn+'! I saw your message: “'+note+'” — ';},
    replySubj:'Reply — Feed Your Health',
    replyPfRow:function(fn,lbl,reasons){return 'Hi '+fn+'! I saw that '+lbl+' felt a bit off'+(reasons?(' ('+reasons+')'):'')+' this week — let’s adjust it together, tell me what would work better for you.';},
    replyPfGeneral:function(fn){return 'Hi '+fn+'! I saw your feedback on this week’s plan — I want to adjust it so it fits you better. Tell me what was hardest for you.';},
    bodyComp:function(fn){return 'Hi '+fn+'! Sending you your measurement history (weight, body composition) as a PDF 📎';},
    bodyCompSubj:'Your measurement history — Feed Your Health',
    lipoForm:function(fn){return 'Hi '+fn+'! Sending you your body-composition report (body composition, skinfolds, girths) as a PDF 📎';},
    lipoFormSubj:'Your body-composition report — Feed Your Health'
  },
  ru:{
    fbReminder:function(fn,url){return 'Привет, '+fn+'! Прежде чем я составлю план на следующую неделю, расскажи коротко, как прошла эта — 30 секунд, во вкладке «Прогресс»: '+url;},
    fbReminderSubj:'Расскажи, как прошла неделя — Feed Your Health',
    recapAdherence:function(pct){return pct+'% выполнения на этой неделе';},
    recapWeight:function(delta){return delta+' вес';},
    recapStreak:function(n){var m=n%10,h=n%100;var w=(m===1&&h!==11)?'день':((m>=2&&m<=4)&&(h<10||h>=20)?'дня':'дней');return '🔥 '+n+' '+w+' подряд';},
    recap:function(fn,parts){return 'Хорошего воскресенья, '+fn+'! Твоя неделя: '+parts+' 👏';},
    recapSubj:'Твоя неделя — Feed Your Health',
    nudge:function(fn,url){return 'Привет, '+fn+'! Я заметил, что ты давно ничего не отмечал в плане — всё в порядке? Вот ссылка, если хочешь заглянуть: '+url;},
    nudgeSubj:'Как дела? — Feed Your Health',
    replyNote:function(fn,note){return 'Привет, '+fn+'! Я видел твоё сообщение: «'+note+'» — ';},
    replySubj:'Ответ — Feed Your Health',
    replyPfRow:function(fn,lbl,reasons){return 'Привет, '+fn+'! Я вижу, что «'+lbl+'» на этой неделе показалось не очень'+(reasons?(' ('+reasons+')'):'')+' — давай подстроим вместе, скажи, что было бы удобнее.';},
    replyPfGeneral:function(fn){return 'Привет, '+fn+'! Я видел твой отзыв о плане на эту неделю — хочу подстроить его под тебя. Скажи, что было сложнее всего.';},
    bodyComp:function(fn){return 'Привет, '+fn+'! Отправляю тебе историю измерений (вес, состав тела) в PDF 📎';},
    bodyCompSubj:'История твоих измерений — Feed Your Health',
    lipoForm:function(fn){return 'Привет, '+fn+'! Отправляю тебе отчёт по составу тела (состав тела, кожные складки, обхваты) в PDF 📎';},
    lipoFormSubj:'Отчёт по составу тела — Feed Your Health'
  },
  tr:{
    fbReminder:function(fn,url){return 'Merhaba '+fn+'! Gelecek haftanın planını hazırlamadan önce bu haftanın nasıl geçtiğini kısaca söyle — 30 saniye, İlerleme sekmesinde: '+url;},
    fbReminderSubj:'Haftan nasıl geçti anlat — Feed Your Health',
    recapAdherence:function(pct){return 'bu hafta %'+pct+' uyum';},
    recapWeight:function(delta){return delta+' kilo';},
    recapStreak:function(n){return '🔥 '+n+' gün üst üste';},
    recap:function(fn,parts){return 'İyi pazarlar '+fn+'! Haftan: '+parts+' 👏';},
    recapSubj:'Haftan — Feed Your Health',
    nudge:function(fn,url){return 'Merhaba '+fn+'! Son zamanlarda planında hiçbir şey işaretlemediğini fark ettim — her şey yolunda mı? Bakmak istersen link burada: '+url;},
    nudgeSubj:'Nasıl gidiyor? — Feed Your Health',
    replyNote:function(fn,note){return 'Merhaba '+fn+'! Mesajını gördüm: “'+note+'” — ';},
    replySubj:'Yanıt — Feed Your Health',
    replyPfRow:function(fn,lbl,reasons){return 'Merhaba '+fn+'! Bu hafta '+lbl+' biraz iyi gelmemiş'+(reasons?(' ('+reasons+')'):'')+' — birlikte ayarlayalım, sana ne daha iyi gelir söyle.';},
    replyPfGeneral:function(fn){return 'Merhaba '+fn+'! Bu haftaki plan hakkındaki geri bildirimini gördüm — sana daha iyi uyması için ayarlamak istiyorum. En çok ne zorladı söyle.';},
    bodyComp:function(fn){return 'Merhaba '+fn+'! Ölçüm geçmişini (kilo, vücut kompozisyonu) PDF olarak gönderiyorum 📎';},
    bodyCompSubj:'Ölçüm geçmişin — Feed Your Health',
    lipoForm:function(fn){return 'Merhaba '+fn+'! Vücut kompozisyonu raporunu (vücut kompozisyonu, deri kıvrımları, çevre ölçümleri) PDF olarak gönderiyorum 📎';},
    lipoFormSubj:'Vücut kompozisyonu raporun — Feed Your Health'
  }
};
// Το λεξικό hand-off μηνυμάτων στη γλώσσα του πελάτη — fallback στα ελληνικά για κενό/άγνωστο c.lang.
function clientMsgDict(c){ return CLIENT_MSG_DICTS[(c&&c.lang)] || CLIENT_MSG_DICTS.el; }

// ═══════════════════════════════════════════════════════════════════════════════
// ✅ PHASE 1: FOOD PAIRING DATABASE — Chef-Inspired Meal Combinations
// ═══════════════════════════════════════════════════════════════════════════════
// Each food has: flavor_profile, best_pairings, avoid_with, texture, aromatic_herbs, category
// Based on culinary science (shared aromatic compounds) + user feedback

// ── ΕΠΕΚΤΑΣΗ PAIRING DB: κλειδιά ΑΚΡΙΒΩΣ όπως στο FOODS ──────────────────────
// Διπλασιάζει την κάλυψη ώστε η μηχανή συνδυασμού να έχει υλικό για κάθε τρόφιμο.
// Συγχώνευση επέκτασης στη βασική βάση (χωρίς να πειραχτεί η αρχική)
for(var __fpk in FOOD_PAIRING_EXT){ if(FOOD_PAIRING_EXT.hasOwnProperty(__fpk)){ FOOD_PAIRING_DB[__fpk]=FOOD_PAIRING_EXT[__fpk]; } }

// ── ΣΑΛΤΣΕΣ & ΦΙΝΙΡΙΣΜΑ ανά κατηγορία πρωτεΐνης ──────────────────────────────
// Κάθε καταχώρηση = {n: όνομα τροφίμου στο FOODS, g: γραμμάρια}. Επιλέγεται
// μία σάλτσα ώστε το πιάτο να μην βγαίνει «γυμνό».
// Αντιστοίχιση ονόματος βοτάνου (όπως γράφεται στα aromatic_herbs) → τρόφιμο FOODS

// Category scaling caps: foods in these categories scale with limits
// Proteins/Carbs/FYH recipes = no cap (scale fully)

// ✅ BREAKFAST CONSTRAINTS: Approved proteins & foods for morning meals
// Mediterranean breakfast should be light & nutritious, not heavy meats

// ── Food Exclusion: quick groups & substitution order ────────────────────────
// Fallback substitution order per category (most similar first)

// ── Practical units ───────────────────────────────────────────────────────────
// Maps food name → { g: grams per 1 unit, u: unit label shown to client }
// Add any food here to display it in the plan as units instead of grams.

// Τρόφιμα που ο πελάτης τρώει ΑΚΕΡΑΙΑ — δεν έχει νόημα «2.3 αυγό» ή «1.2 φέτα ψωμί».
// Για αυτά, τα γραμμάρια «κουμπώνουν» (snap) στο πλησιέστερο ακέραιο τεμάχιο κατά τη
// δημιουργία πλάνου (scalePlan) και εμφανίζονται ως ακέραιος αριθμός παντού.
// (Αυγά, ψωμί/φέτες/φρυγανιές/πίτες, φρούτα ανά τεμάχιο — ΟΧΙ μπιφτέκια/τορτίγια/τυριά σε φέτες.)

// Επιστρέφει γραμμάρια «κουμπωμένα» σε ακέραιο τεμάχιο για τα WHOLE_UNIT_FOODS
// (π.χ. 127g αυγό → 110g = 2 τεμ.). Για τα υπόλοιπα τρόφιμα επιστρέφει g ως έχει.
function snapWholeG(n,g){
  if(!WHOLE_UNIT_FOODS[n])return g;
  var u=FOOD_UNITS[n];
  if(!u||!u.g)return g;
  var units=Math.round(g/u.g);
  if(units<1)units=1;
  return Math.round(units*u.g);
}

// Συντακτικά σωστός πληθυντικός μονάδας: «2 φέτα» → «2 φέτες».
// Πληθυντικός όταν count ≥ 2 (το 1, ½, 1½ μένουν ενικός: «μιάμιση φέτα»).
// Καλύπτει ελληνικά + αγγλικά· οι συντομογραφίες (τεμ., φλ., κ.σ., μερίδ.) μένουν ως έχουν.
function pluralUnit(label, count){
  return (count>=2 && UNIT_PLURALS[label]) ? UNIT_PLURALS[label] : label;
}

// Single source of truth for how a food's quantity is shown in printed outputs
// (PDF + Word). Mirrors the on-screen editor so all three views agree.
// Honors the per-food unit toggle (food.u==='g' forces grams).
// Returns {main, sub}: main = headline (e.g. "1½ τεμ." or "120γρ."), sub = "(120γρ.)".
function fmtFoodQty(food, gLabel, tuFn){
  gLabel = gLabel || 'γρ.';
  tuFn = tuFn || function(u){return u;};
  var fu = FOOD_UNITS[food.n];
  // Show grams when the food has no unit, or the user toggled it to grams.
  if(!fu || food.u === 'g') return {main: food.g + gLabel, sub: ''};
  // Ακέραια τρόφιμα (αυγά/ψωμί/φρούτα): πάντα ακέραιος αριθμός τεμαχίων.
  if(WHOLE_UNIT_FOODS[food.n]){
    var wholeN = Math.max(1, Math.round(food.g / fu.g));
    return {main: wholeN + ' ' + pluralUnit(tuFn(fu.u), wholeN), sub: '(' + food.g + gLabel + ')'};
  }
  var r = Math.round(food.g / fu.g * 4) / 4;   // nearest quarter unit
  var w = Math.floor(r), fr = r - w, str = w > 0 ? '' + w : '';
  if(Math.abs(fr-0.25)<0.01) str += '¼';
  else if(Math.abs(fr-0.5)<0.01) str += '½';
  else if(Math.abs(fr-0.75)<0.01) str += '¾';
  if(!str) str = '<¼';                          // smaller than a quarter unit
  return {main: str + ' ' + pluralUnit(tuFn(fu.u), r), sub: '(' + food.g + gLabel + ')'};
}

// Cooked/boiled → raw/dry conversion for shopping list
// factor: multiply plan grams by this to get raw grams to purchase
// Meats (ψητό/μαγ.): cooked loses ~25-30% weight → buy more
// Grains (βρ.): boiled triples in weight → buy less (raw)
// Legumes (βρ.): boiled doubles in weight → buy less (dry)


// ── MET Activities (2011 Compendium of Physical Activities) ──────────────────
// Formula: kcal/min = MET × 3.5 × weight(kg) / 200


// ── Macro Presets ─────────────────────────────────────────────────────────────

// ── Sport-Specific Macro Profiles ──────────────────────────────────────────────
// isMET flag: true = conditional visibility shows MET section, false = shows Activity Factor section

// ── PHASE 2: Meal Timing Profiles ──────────────────────────────────────────────
// Nutritional optimization for different meal purposes relative to training

// ── ΕΓΚΥΜΟΣΥΝΗ: τρίμηνο υπολογίζεται πάντα από την εβδομάδα κύησης (όχι ξεχωριστό πεδίο) ──
// ώστε να μην μπορούν να διαφωνήσουν δύο χειροκίνητα πεδία μεταξύ τους.
function getPregTrimester(week){
  if(!week || week<1) return null;
  if(week<=13) return 1;
  if(week<=27) return 2;
  return 3;
}
function getPregTrimesterLabel(week){
  var t=getPregTrimester(week);
  if(!t) return '';
  return ['','(Α\' τρίμηνο)','(Β\' τρίμηνο)','(Γ\' τρίμηνο)'][t];
}

// IOM 2009 εύρος συνολικής αύξησης βάρους κύησης ανά κατηγορία ΔΜΣ προ εγκυμοσύνης (verified, βλ. memory).
function getIOMWeightGainRange(prePregBMI){
  if(prePregBMI<18.5) return {min:12.5,max:18,label:'Λιποβαρής'};
  if(prePregBMI<25) return {min:11.5,max:16,label:'Φυσιολογικός'};
  if(prePregBMI<30) return {min:7,max:11.5,label:'Υπέρβαρη'};
  return {min:5,max:9.1,label:'Παχύσαρκη'};
}
// Σύγκριση πραγματικής αύξησης βάρους με το εύρος IOM — διαφορετική λογική από το γενικό weight-trend
// (goalMain loss/gain), εδώ ο "στόχος" είναι ένα εύρος, όχι κατεύθυνση. Το "below" είναι σκόπιμα συντηρητικό
// (μόνο κοντά στον τοκετό, με γενναίο περιθώριο) γιατί δεν έχουμε επιβεβαιωμένο εβδομαδιαίο ρυθμό-στόχο ανά ΔΜΣ,
// μόνο το συνολικό εύρος — δεν προσποιούμαστε ακρίβεια που δεν έχουμε τεκμηριώσει.
function checkGestationalWeightGain(c){
  if(!c || !c.pregnant || !(c.prePregnancyWeight>0) || !(c.height>0)) return null;
  var wl=(c.weightLog||[]).slice().sort(function(a,b){return a.date<b.date?-1:1;});
  if(!wl.length) return null;
  var latest=wl[wl.length-1];
  var gained=+(latest.weight-c.prePregnancyWeight).toFixed(1);
  var bmi=c.prePregnancyWeight/((c.height/100)*(c.height/100));
  var range=getIOMWeightGainRange(bmi);
  var week=c.gestationalWeek||null;
  var status='ontrack';
  if(gained>range.max) status='above';
  else if(week>=36 && gained<range.min*0.7) status='below';
  return {gained:gained, range:range, bmi:+bmi.toFixed(1), week:week, status:status};
}


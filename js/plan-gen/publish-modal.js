// js/plan-gen/publish-modal.js
// The 'send plan to client' publish modal + the EN/RU/TR translation tables it and
// the PDF/Word exporters share. Extracted verbatim from js/app-part3.js (module
// split wave 14): EN_/RU_/TR_MEAL_NAMES, EN_/RU_/TR_UNITS, EN_/RU_/TR_CAT_NAMES,
// PUBLISH_MSG_DICTS, publishHandoffMsg, openPublishModal, togglePublishSettings,
// copyPublishUrl, copyPublishEmailBody, copyPublishViberMsg. Plain var/object +
// function declarations, no load-time code. EN_* tables are read at runtime by
// reports/exports.js; openPublishModal is invoked from an app-part2.js onclick
// string — all runtime. Loads right before app-part3.js.

/* ---- PDF export (browser print → Save as PDF) ---- */
/* ── English translations for PDF export ─────────────────────────────────── */
var EN_MEAL_NAMES={
  'Πρωινό':'Breakfast','Δεκατιανό':'Morning Snack','Μεσημεριανό':'Lunch',
  'Απογευματινό':'Afternoon Snack','Βραδινό':'Dinner','Βραδινό Σνακ':'Evening Snack',
  'Σνακ':'Snack','Ενδιάμεσο':'Snack','Pre-workout':'Pre-workout','Post-workout':'Post-workout',
  'Πρωινό Σνακ':'Morning Snack','Μεσνύχτιο':'Late Night Snack'
};
// ── ru/tr counterparts, ίδια δομή/κλειδιά με το EN_MEAL_NAMES παραπάνω (βλ. [[dietologist-ru-tr-portal-prep]]) ──
var RU_MEAL_NAMES={
  'Πρωινό':'Завтрак','Δεκατιανό':'Утренний перекус','Μεσημεριανό':'Обед',
  'Απογευματινό':'Полдник','Βραδινό':'Ужин','Βραδινό Σνακ':'Вечерний перекус',
  'Σνακ':'Перекус','Ενδιάμεσο':'Перекус','Pre-workout':'Перед тренировкой','Post-workout':'После тренировки',
  'Πρωινό Σνακ':'Утренний перекус','Μεσνύχτιο':'Поздний перекус'
};
var TR_MEAL_NAMES={
  'Πρωινό':'Kahvaltı','Δεκατιανό':'Sabah ara öğünü','Μεσημεριανό':'Öğle yemeği',
  'Απογευματινό':'İkindi ara öğünü','Βραδινό':'Akşam yemeği','Βραδινό Σνακ':'Akşam ara öğünü',
  'Σνακ':'Ara öğün','Ενδιάμεσο':'Ara öğün','Pre-workout':'Antrenman öncesi','Post-workout':'Antrenman sonrası',
  'Πρωινό Σνακ':'Sabah ara öğünü','Μεσνύχτιο':'Gece ara öğünü'
};
// Note: fmtFoodQty() always calls this on the bare base unit (fu.u) before the count/fraction
// is prepended and before pluralUnit() runs — so only single, un-prefixed unit keys are ever
// looked up here. A compound key like '17 ρόγες' can never match and was removed as dead weight.
var EN_UNITS={
  'τεμ.':'pc.','φέτα':'slice','μερίδ.':'serving','χούφτα':'handful','stick':'stick','scoop':'scoop',
  'φλ.':'cup','κ.σ.':'tbsp','κ.γ.':'tsp','κ.γλ.':'tsp','πρέζα':'pinch',
  'κύπελλο':'cup','μπουκάλι':'bottle','ρόγα':'grape','συσκευασία':'package'
};
var RU_UNITS={
  'τεμ.':'шт.','φέτα':'ломтик','μερίδ.':'порция','χούφτα':'горсть','stick':'брусок','scoop':'мерная ложка',
  'φλ.':'чашка','κ.σ.':'ст. л.','κ.γ.':'ч. л.','κ.γλ.':'ч. л.','πρέζα':'щепотка',
  'κύπελλο':'чашка','μπουκάλι':'бутылка','ρόγα':'виноградина','συσκευασία':'упаковка'
};
var TR_UNITS={
  'τεμ.':'adet','φέτα':'dilim','μερίδ.':'porsiyon','χούφτα':'avuç','stick':'çubuk','scoop':'ölçek',
  'φλ.':'su bardağı','κ.σ.':'yemek kaşığı','κ.γ.':'çay kaşığı','κ.γλ.':'çay kaşığı','πρέζα':'tutam',
  'κύπελλο':'bardak','μπουκάλι':'şişe','ρόγα':'tane','συσκευασία':'paket'
};
var EN_CAT_NAMES={
  'Κρέας':'Meat','Ψάρια':'Fish & Seafood','Αυγά/Γαλακτ.':'Eggs & Dairy',
  'Δημητριακά':'Grains','Όσπρια':'Legumes','Λαχανικά':'Vegetables',
  'Φρούτα':'Fruits','Ξηροί καρποί':'Nuts & Seeds','Λάδια':'Oils & Fats',
  'Συνταγές FYH':'FYH Recipes','Άλλα':'Other',
  'Γαλακτοκομικά':'Dairy','Καρυκεύματα':'Seasonings','Μπαχαρικά':'Spices',
  'Ροφήματα':'Beverages','Σάλτσες':'Sauces','Συνταγές':'Recipes'
};
var RU_CAT_NAMES={
  'Κρέας':'Мясо','Ψάρια':'Рыба и морепродукты','Αυγά/Γαλακτ.':'Яйца и молочные продукты',
  'Δημητριακά':'Злаки','Όσπρια':'Бобовые','Λαχανικά':'Овощи',
  'Φρούτα':'Фрукты','Ξηροί καρποί':'Орехи и семена','Λάδια':'Масла и жиры',
  'Συνταγές FYH':'Рецепты FYH','Άλλα':'Другое',
  'Γαλακτοκομικά':'Молочные продукты','Καρυκεύματα':'Приправы','Μπαχαρικά':'Специи',
  'Ροφήματα':'Напитки','Σάλτσες':'Соусы','Συνταγές':'Рецепты'
};
var TR_CAT_NAMES={
  'Κρέας':'Et','Ψάρια':'Balık ve Deniz Ürünleri','Αυγά/Γαλακτ.':'Yumurta ve Süt Ürünleri',
  'Δημητριακά':'Tahıllar','Όσπρια':'Baklagiller','Λαχανικά':'Sebzeler',
  'Φρούτα':'Meyveler','Ξηροί καρποί':'Kuruyemişler ve Tohumlar','Λάδια':'Yağlar',
  'Συνταγές FYH':'FYH Tarifleri','Άλλα':'Diğer',
  'Γαλακτοκομικά':'Süt Ürünleri','Καρυκεύματα':'Çeşniler','Μπαχαρικά':'Baharatlar',
  'Ροφήματα':'İçecekler','Σάλτσες':'Soslar','Συνταγές':'Tarifler'
};

// ── 📲 ΔΗΜΟΣΙΕΥΣΗ ΠΛΑΝΟΥ ΣΤΟΝ ΠΕΛΑΤΗ ────────────────────────────────────────
// ✅ audit fix (2026-08-24, finding #2): το μήνυμα WhatsApp/Email που στέλνει το link ήταν πάντα
// στα ελληνικά, ανεξαρτήτως του "🌐 Γλώσσα πλάνου" (c.lang) που έχει οριστεί για τον πελάτη — ένας
// en/ru/tr πελάτης έπαιρνε ελληνικό μήνυμα με σύνδεσμο προς πλάνο στη δική του γλώσσα. Ίδιο ύφος/
// χαιρετισμός με το I18N object του plan.html (greeting: Γεια σου/Hi/Привет/Merhaba).
var PUBLISH_MSG_DICTS={
  el:{ msg:function(fname,url){return 'Γεια σου '+fname+'! Εδώ είναι το διατροφικό σου πλάνο: '+url;},
       subj:'Το διατροφικό σου πλάνο — Feed Your Health',
       body:function(fname,url){return 'Γεια σου '+fname+'!\n\nΕδώ είναι το προσωπικό σου διατροφικό πλάνο. Άνοιξέ το από το κινητό σου:\n\n'+url+'\n\nΘα βρεις το πλάνο διατροφής, τη λίστα για ψώνια, τα συμπληρώματα, την ενυδάτωση και την πρόοδό σου.\n\nΜε εκτίμηση,\nFeed Your Health';} },
  en:{ msg:function(fname,url){return 'Hi '+fname+'! Here is your nutrition plan: '+url;},
       subj:'Your nutrition plan — Feed Your Health',
       body:function(fname,url){return 'Hi '+fname+'!\n\nHere is your personal nutrition plan. Open it from your phone:\n\n'+url+'\n\nYou will find your meal plan, shopping list, supplements, hydration and progress there.\n\nBest,\nFeed Your Health';} },
  ru:{ msg:function(fname,url){return 'Привет, '+fname+'! Вот твой план питания: '+url;},
       subj:'Твой план питания — Feed Your Health',
       body:function(fname,url){return 'Привет, '+fname+'!\n\nВот твой персональный план питания. Открой его с телефона:\n\n'+url+'\n\nТам ты найдёшь план питания, список покупок, добавки, водный режим и прогресс.\n\nС уважением,\nFeed Your Health';} },
  tr:{ msg:function(fname,url){return 'Merhaba '+fname+'! İşte beslenme planın: '+url;},
       subj:'Beslenme planın — Feed Your Health',
       body:function(fname,url){return 'Merhaba '+fname+'!\n\nİşte kişisel beslenme planın. Telefonundan aç:\n\n'+url+'\n\nBurada beslenme planını, alışveriş listeni, takviyelerini, su tüketimini ve ilerlemeni bulacaksın.\n\nSaygılarımla,\nFeed Your Health';} }
};
function publishHandoffMsg(c,url){
  var d=PUBLISH_MSG_DICTS[c.lang]||PUBLISH_MSG_DICTS.el;
  var fname=(c.name||'').split(' ')[0];
  return {msg:d.msg(fname,url), subj:d.subj, ebody:d.body(fname,url)};
}
function openPublishModal(){
  var c=getC();
  if(!c){ showErrorToast('Διάλεξε πρώτα πελάτη.'); return; }
  if(!c.weekPlan || !Object.keys(c.weekPlan).length){ showErrorToast('Δεν υπάρχει πλάνο για δημοσίευση.'); return; }
  if(!window.Cloud || !window.Cloud.enabled || !window.Cloud.user){
    showErrorToast('Πρέπει να είσαι συνδεδεμένος στο cloud για να στείλεις πλάνο στον πελάτη.\n(Κάνε αποσύνδεση και ξανασυνδέσου με email/κωδικό.)');
    return;
  }
  // overlay
  var ov=document.getElementById('publish-overlay');
  if(ov) ov.remove();
  ov=document.createElement('div');
  ov.id='publish-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:18px';
  ov.onclick=function(e){ if(e.target===ov) ov.remove(); };
  ov.innerHTML='<div style="background:var(--card-bg);border-radius:16px;max-width:420px;width:100%;padding:22px;box-shadow:0 10px 40px rgba(0,0,0,.25)">'
    +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="font-size:24px">📲</span><div style="font-size:18px;font-weight:700;color:#014545">Αποστολή πλάνου</div></div>'
    +'<div style="font-size:13px;color:#5a8a82;margin-bottom:16px">Δημιουργία συνδέσμου για τον/την <b>'+esc(c.name||'πελάτη')+'</b>. Ανοίγει στο κινητό — πλάνο, λίστα ψώνια, νερό, συμπληρώματα & πρόοδος.</div>'
    +'<div id="publish-body" style="text-align:center;padding:14px 0"><div style="display:inline-block;width:30px;height:30px;border:3px solid #c5ddd8;border-top-color:#025857;border-radius:50%;animation:fyhspin 1s linear infinite"></div><div style="font-size:13px;color:#5a8a82;margin-top:10px">Δημοσίευση…</div></div>'
    +'<div style="text-align:right;margin-top:8px"><button class="btn" onclick="document.getElementById(\'publish-overlay\').remove()">Κλείσιμο</button></div>'
    +'</div>';
  document.body.appendChild(ov);
  if(!document.getElementById('fyhspin-style')){
    var st=document.createElement('style'); st.id='fyhspin-style'; st.textContent='@keyframes fyhspin{to{transform:rotate(360deg)}}'; document.head.appendChild(st);
  }

  window.Cloud.publishPlan(c).then(function(res){
    var url=res.url;
    var body=document.getElementById('publish-body');
    if(!body)return;
    var expTxt=new Date(res.expiresAt).toLocaleDateString('el-GR',{day:'numeric',month:'long',year:'numeric'});
    // ✅ audit fix (2026-08-24, finding #2): μήνυμα πλέον στη γλώσσα του πελάτη (c.lang) — βλ.
    // PUBLISH_MSG_DICTS/publishHandoffMsg παραπάνω.
    var hm=publishHandoffMsg(c,url);
    var msg=hm.msg;
    // WhatsApp: αν υπάρχει τηλέφωνο, στείλε κατευθείαν σε αυτό
    var phone=normalizePhoneIntl(c.phone);
    var wa='https://wa.me/'+(phone||'')+'?text='+encodeURIComponent(msg);
    // Viber: σε αντίθεση με το wa.me, το επίσημο viber://chat?number= δεν υποστηρίζει pre-filled
    // κείμενο μαζί με συγκεκριμένο αριθμό (μόνο το viber://forward?text= το κάνει, αλλά χωρίς
    // προεπιλεγμένο παραλήπτη — ανοίγει λίστα επαφών). Οπότε: με τηλέφωνο → ανοίγει κατευθείαν
    // το chat ΚΑΙ το onclick του link αντιγράφει αυτόματα το μήνυμα στο clipboard (ο διαιτολόγος
    // απλώς επικολλά)· χωρίς τηλέφωνο → forward με το μήνυμα έτοιμο, ο διαιτολόγος διαλέγει επαφή.
    var vb=phone?('viber://chat?number='+encodeURIComponent('+'+phone)):('viber://forward?text='+encodeURIComponent(msg));
    // Email: άνοιγμα του email προγράμματος με συμπληρωμένα στοιχεία
    var subj=hm.subj;
    var ebody=hm.ebody;
    var mailto='mailto:'+encodeURIComponent(c.email||'')+'?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(ebody);
    // ✅ audit fix follow-up: το mailto: δεν κάνει ΤΙΠΟΤΑ ορατό όταν δεν υπάρχει προεπιλεγμένο
    // πρόγραμμα email (π.χ. ο χρήστης χρησιμοποιεί μόνο Gmail στον browser) — βλ. σχόλιο παρακάτω.
    // Gmail compose URL (view=cm) δουλεύει σε κάθε browser χωρίς προεπιλεγμένο mail client,
    // αρκεί ο χρήστης να είναι ήδη συνδεδεμένος στο Gmail (αλλιώς ζητάει πρώτα login).
    var gmailUrl='https://mail.google.com/mail/?view=cm&fs=1&to='+encodeURIComponent(c.email||'')+'&su='+encodeURIComponent(subj)+'&body='+encodeURIComponent(ebody);
    body.style.textAlign='left';
    // ✅ UX fix: αυτή η ενότητα (μήνυμα/στόχοι/ACSM) δεν έχει σχέση με το "στείλε το link" — είναι
    // ρυθμίσεις του portal του πελάτη που τυχαίνει να ζουν εδώ. Μαζί με τα 3 κανάλια αποστολής το
    // modal ξεπερνούσε το ύψος της οθόνης (το "Κλείσιμο" έμενε κομμένο). Διπλωμένη από προεπιλογή
    // όποτε υπάρχει ήδη στόχος βάρους (δηλ. ο πελάτης έχει ξαναρυθμιστεί) — έτσι το συνηθισμένο
    // "ξαναστείλε το ίδιο πλάνο" ανοίγει κατευθείαν στο link+κανάλια. Χωρίς στόχο βάρους μένει
    // ανοιχτή ώστε η προειδοποίηση από κάτω να μη χαθεί.
    var settingsOpen=!c.goalWeight;
    body.innerHTML='<div class="sf-panel" style="padding:8px 10px;margin-bottom:12px">'
      +'<div class="sf-header" onclick="togglePublishSettings()"><span>⚙️ Ρυθμίσεις πελάτη <span style="font-size:10px;font-weight:400;color:#9fb5b0">— μήνυμα Αρχικής, στόχοι Προόδου</span></span><span id="publish-settings-chevron" class="sec-chevron'+(settingsOpen?' open':'')+'">▸</span></div>'
      +'<div id="publish-settings-body" style="display:'+(settingsOpen?'block':'none')+';margin-top:10px">'
      +'<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">✍️ Προσωπικό μήνυμα στον πελάτη <span style="color:#9fb5b0">(προαιρετικό)</span></div>'
      +'<textarea id="portal-note" rows="2" placeholder="π.χ. Μπράβο για την πρόοδο! Εστίασε στο πρωινό αυτή την εβδομάδα." style="width:100%;box-sizing:border-box;font-size:13px;padding:9px 10px;border:1px solid #c5ddd8;border-radius:8px;resize:vertical;font-family:inherit;color:#1a3330;margin-bottom:4px">'+esc(c.portalNote||'')+'</textarea>'
      +'<div style="font-size:10px;color:#9fb5b0;margin:0 0 8px;line-height:1.3">Φαίνεται μόνο στην Αρχική του πελάτη στο portal — δεν μπαίνει στο μήνυμα WhatsApp/Viber/Email.</div>'
      +'<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">🎯 Στόχοι για την καρτέλα Πρόοδος <span style="color:#9fb5b0">(προαιρετικό)</span></div>'
      +(c.goalWeight?'':'<div style="font-size:11px;color:#e08a00;margin:-2px 0 8px;line-height:1.4">⚠️ Χωρίς στόχο βάρους ο πελάτης δεν θα δει την κάρτα στόχου στην Αρχική του.</div>')
      +'<div style="display:flex;gap:8px;margin-bottom:8px">'
      +'<div style="flex:1"><label style="font-size:11px;color:#5a8a82">Στόχος βάρους (kg)</label><input type="number" id="portal-goalweight" value="'+(c.goalWeight||'')+'" placeholder="π.χ. 75" step="0.1" min="20" max="300" style="width:100%;box-sizing:border-box;font-size:13px;padding:8px 10px;border:1px solid #c5ddd8;border-radius:8px;font-family:inherit"></div>'
      +'<div style="flex:1"><label style="font-size:11px;color:#5a8a82">Στόχος % λίπους</label><input type="number" id="portal-goalbf" value="'+(c.goalBF||'')+'" placeholder="π.χ. 15" step="0.1" min="3" max="60" style="width:100%;box-sizing:border-box;font-size:13px;padding:8px 10px;border:1px solid #c5ddd8;border-radius:8px;font-family:inherit"></div>'
      +'</div>'
      +'<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#1a3330;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="portal-showbfbands"'+(c.portalShowBFBands?' checked':'')+'> Εμφάνιση ζωνών αναφοράς λίπους (ACSM) στον πελάτη</label>'
      +'<button id="portal-note-save" class="btn" style="width:100%;background:#E2EEE5;color:#014545;border:1px solid #c5ddd8">💾 Αποθήκευση ρυθμίσεων</button>'
      +'</div></div>'
      +'<div style="font-size:12px;color:#5a8a82;margin-bottom:6px">Σύνδεσμος πελάτη</div>'
      +'<div style="display:flex;gap:6px;margin-bottom:14px"><input id="publish-url" value="'+esc(url)+'" readonly style="flex:1;font-size:12px;padding:9px 10px;border:1px solid #c5ddd8;border-radius:8px;background:#f4f8f6;color:#014545" onclick="this.select()">'
      +'<button class="btn" style="background:#025857;color:#fff;border:1px solid #025857;white-space:nowrap" onclick="copyPublishUrl(this)">Αντιγραφή</button></div>'
      +'<a href="'+esc(wa)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#25D366;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:4px">📱 WhatsApp'+(phone?' ('+esc(c.phone)+')':'')+'</a>'
      +(phone?'':'<div style="font-size:11px;color:#e08a00;margin:0 0 8px;line-height:1.4">⚠️ Δεν έχεις βάλει τηλέφωνο στην καρτέλα — δεν θα ανοίξει συνομιλία με συγκεκριμένο παραλήπτη. Πρόσθεσέ το στα «Βασικά Στοιχεία».</div>')
      +'<a href="'+esc(vb)+'" target="_blank" rel="noopener"'+(phone?' onclick="var b=document.getElementById(\'publish-viber-copy\');if(b)copyPublishViberMsg(b);"':'')+' style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#7360F2;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:4px">💬 Viber'+(phone?' ('+esc(c.phone)+')':'')+'</a>'
      +(phone?'<textarea id="publish-viber-msg" style="position:absolute;left:-9999px;top:-9999px;" readonly>'+esc(msg)+'</textarea>'
        +'<div style="font-size:11px;color:#5a8a82;line-height:1.4;margin:2px 0 6px">📋 Το Viber δεν δέχεται έτοιμο κείμενο — <b>αντιγράφεται αυτόματα</b> μόλις πατήσεις το κουμπί. Στη συνομιλία: κράτα πατημένο στο πεδίο → <b>Επικόλληση</b>.</div>'
        +'<button id="publish-viber-copy" type="button" class="btn" style="width:100%;background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8;font-size:11.5px;margin-bottom:8px" onclick="copyPublishViberMsg(this)">📋 Αντιγραφή μηνύματος ξανά</button>'
        :'<div style="font-size:11px;color:#9fb5b0;line-height:1.4;margin-bottom:8px">Θα ανοίξει η λίστα επαφών του Viber με το μήνυμα έτοιμο — διάλεξε τον/την '+esc(c.name||'πελάτη')+'.</div>')
      +'<a href="'+esc(mailto)+'" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#025857;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:4px">📧 Πρόγραμμα Email'+(c.email?(' ('+esc(c.email)+')'):'')+'</a>'
      // Δεύτερο, ισότιμο κουμπί (audit finding: "δεν ανοίγει κάτι στο email" — το mailto: δεν κάνει
      // ΤΙΠΟΤΑ ορατό όταν δεν υπάρχει προεπιλεγμένο πρόγραμμα email, π.χ. Gmail μόνο στον browser).
      // Το Gmail compose ανοίγει πάντα κάτι ορατό (νέα καρτέλα), άρα καλύπτει ακριβώς αυτό το κενό.
      // Χρώμα Gmail-ish (#c2483a) για να ξεχωρίζει οπτικά από το γενικό "πρόγραμμα email" κουμπί.
      +'<a href="'+esc(gmailUrl)+'" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;background:#c2483a;color:#fff;padding:11px;border-radius:10px;font-size:14px;font-weight:600;margin-bottom:4px">✉️ Gmail στον browser</a>'
      +(c.email?'':'<div style="font-size:11px;color:#e08a00;margin:0 0 6px;line-height:1.4">⚠️ Δεν έχεις βάλει email στην καρτέλα — θα ανοίξει κενό παραλήπτη. Πρόσθεσέ το στα «Βασικά Στοιχεία».</div>')
      +'<textarea id="publish-email-body" style="position:absolute;left:-9999px;top:-9999px;" readonly>'+esc(subj+'\n\n'+ebody)+'</textarea>'
      +'<button id="publish-email-copy" type="button" class="btn" style="width:100%;background:var(--card-bg);color:#5a8a82;border:1px solid #c5ddd8;font-size:11.5px;margin-bottom:8px" onclick="copyPublishEmailBody(this)">📋 Δεν άνοιξε κανένα; Αντιγραφή μηνύματος</button>'
      +'<div style="font-size:11px;color:#9fb5b0;line-height:1.5;margin-bottom:14px">⏳ Ο σύνδεσμος λήγει στις <b>'+expTxt+'</b> ('+window.Cloud.LINK_EXPIRE_DAYS+' μέρες). Όποτε αλλάξεις το πλάνο, πάτα ξανά «Στείλε στον πελάτη» — ο ίδιος σύνδεσμος ενημερώνεται αυτόματα και η λήξη ανανεώνεται.</div>'
      +'<button id="portal-reset-link" class="btn" style="width:100%;background:var(--card-bg);color:#c0392b;border:1px solid #f0c2c2;font-size:12px">🔄 Καθαρισμός & νέο σύνδεσμος</button>'
      +'<div style="font-size:11px;color:#9fb5b0;line-height:1.4;margin-top:4px">Σβήνει τον τρέχοντα σύνδεσμο και φτιάχνει καινούριο — χρήσιμο αν ο πελάτης έχει συμπληρώσει νερό/συμπληρώματα/σημειώσεις που θες να «καθαρίσουν». Ο παλιός σύνδεσμος σταματάει να δουλεύει αμέσως.</div>';
    // Αποθήκευση προσωπικού μηνύματος → ξαναδημοσίευση ώστε να μπει στο snapshot
    var noteSave=document.getElementById('portal-note-save'), noteEl=document.getElementById('portal-note');
    if(noteSave&&noteEl){ noteSave.onclick=function(){
      c.portalNote=noteEl.value;
      var gwEl=document.getElementById('portal-goalweight'), gbfEl=document.getElementById('portal-goalbf'), bandsEl=document.getElementById('portal-showbfbands');
      // ✅ audit fix (2026-08-16): these two had no min/max on the input NOR any check in JS before
      // save — a stray 0/negative value saved silently and showed on the client's Πρόοδος tab.
      // Same "clamp to physiological range, HTML min/max are bypassable by typing" pattern as
      // weight/bf/waist/hip/arm elsewhere in this file.
      var gwRaw=(gwEl&&gwEl.value)?parseFloat(gwEl.value):NaN;
      c.goalWeight=!isNaN(gwRaw)?Math.max(20,Math.min(300,gwRaw)):null;
      var gbfRaw=(gbfEl&&gbfEl.value)?parseFloat(gbfEl.value):NaN;
      c.goalBF=!isNaN(gbfRaw)?Math.max(3,Math.min(60,gbfRaw)):null;
      c.portalShowBFBands=!!(bandsEl&&bandsEl.checked);
      noteSave.disabled=true; noteSave.textContent='Αποθήκευση…';
      window.Cloud.publishPlan(c).then(function(){ noteSave.textContent='✓ Αποθηκεύτηκε'; setTimeout(function(){noteSave.disabled=false;noteSave.textContent='💾 Αποθήκευση ρυθμίσεων';},1600); })
        .catch(function(e){ noteSave.disabled=false; noteSave.textContent='💾 Αποθήκευση ρυθμίσεων'; showErrorToast('Σφάλμα αποθήκευσης: '+(e.message||'')); });
    };}
    // Καθαρισμός & νέο σύνδεσμος → unpublish (σβήνει την παλιά εγγραφή) + νέο token + ξαναδημοσίευση
    var resetBtn=document.getElementById('portal-reset-link');
    if(resetBtn){ resetBtn.onclick=function(){
      // Το #confirmDialog έχει z-index:10000, χαμηλότερο από το publish-overlay (100000) που είναι ήδη ανοιχτό
      // από πάνω του — χωρίς αυτό το boost το κουμπί "Καθαρισμός" θα ήταν οπτικά κρυμμένο πίσω από το τρέχον modal.
      var dlg=document.getElementById('confirmDialog');
      var origZ=dlg?dlg.style.zIndex:'';
      if(dlg) dlg.style.zIndex='100001';
      var restoreZ=function(){ if(dlg) dlg.style.zIndex=origZ; };
      showConfirmDialog('Θα δημιουργηθεί ΝΕΟΣ σύνδεσμος για τον/την «'+esc(c.name||'πελάτη')+'». Ο ΠΑΛΙΟΣ σύνδεσμος θα σταματήσει να δουλεύει αμέσως και όσα είχε καταχωρήσει ο πελάτης (νερό, check-off γευμάτων/συμπληρωμάτων, σημειώσεις βάρους) δεν θα φαίνονται πια — θα χρειαστεί να του στείλεις τον νέο σύνδεσμο.\n\nΣυνέχεια;', function(){
        restoreZ();
        resetBtn.disabled=true; resetBtn.textContent='Γίνεται καθαρισμός…';
        window.Cloud.unpublishPlan(c).then(function(){
          c.shareToken=genSecureToken();
          return window.Cloud.publishPlan(c);
        }).then(function(){
          showSuccessToast('Δημιουργήθηκε νέος, καθαρός σύνδεσμος.');
          openPublishModal();
        }).catch(function(e){
          resetBtn.disabled=false; resetBtn.textContent='🔄 Καθαρισμός & νέο σύνδεσμος';
          showErrorToast('Σφάλμα: '+(e.message||''));
        });
      }, {confirmLabel:'Καθαρισμός', icon:'🔄'});
      var cancelBtn=dlg && dlg.querySelector('button[onclick="closeConfirmDialog()"]');
      if(cancelBtn) cancelBtn.addEventListener('click', restoreZ, {once:true});
    };}
  }).catch(function(e){
    var body=document.getElementById('publish-body');
    if(body) body.innerHTML='<div style="color:#c0392b;font-size:13px">❌ '+esc(e.message||'Σφάλμα δημοσίευσης')+'</div>';
  });
}
// Διπλώνει/ξεδιπλώνει την ενότητα "⚙️ Ρυθμίσεις πελάτη" μέσα στο modal αποστολής πλάνου —
// ίδιο πατέντο με toggleSkinfoldPanel (js/app-part2.js): toggle display + κλάση 'open' στο chevron.
function togglePublishSettings(){
  var body=document.getElementById('publish-settings-body');
  var icon=document.getElementById('publish-settings-chevron');
  if(!body)return;
  var isOpen=body.style.display!=='none';
  body.style.display=isOpen?'none':'block';
  if(icon)icon.classList.toggle('open',!isOpen);
}
function copyPublishUrl(btn){
  var inp=document.getElementById('publish-url');
  if(!inp)return;
  inp.select();
  var ok=false;
  try{ ok=document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(inp.value).then(function(){},function(){}); ok=true; }
  if(ok && btn){ var o=btn.textContent; btn.textContent='✓ Αντιγράφηκε'; setTimeout(function(){btn.textContent=o;},1500); }
}

// Fallback για όταν το "mailto:" δεν ανοίγει τίποτα (κανένα προεπιλεγμένο πρόγραμμα email) —
// αντιγράφει το ίδιο μήνυμα ώστε ο διαιτολόγος να το επικολλήσει χειροκίνητα σε ένα νέο email.
function copyPublishEmailBody(btn){
  var ta=document.getElementById('publish-email-body');
  if(!ta)return;
  ta.select();
  var ok=false;
  try{ ok=document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(ta.value).then(function(){},function(){}); ok=true; }
  if(ok && btn){ var o=btn.textContent; btn.textContent='✓ Αντιγράφηκε — επικόλλησέ το σε ένα νέο email'; setTimeout(function(){btn.textContent=o;},2200); }
}

// Fallback για το Viber: το viber://chat?number= ανοίγει κατευθείαν το chat του πελάτη αλλά
// (σε αντίθεση με το wa.me) δεν υποστηρίζει προσυμπληρωμένο κείμενο — ο διαιτολόγος αντιγράφει
// εδώ το ίδιο μήνυμα που στέλνεται και μέσω WhatsApp/Email και το επικολλάει στο Viber.
function copyPublishViberMsg(btn){
  var ta=document.getElementById('publish-viber-msg');
  if(!ta)return;
  ta.select();
  var ok=false;
  try{ ok=document.execCommand('copy'); }catch(e){}
  if(navigator.clipboard){ navigator.clipboard.writeText(ta.value).then(function(){},function(){}); ok=true; }
  if(ok && btn){ var o=btn.textContent; btn.textContent='✓ Αντιγράφηκε — επικόλλησέ το στο Viber'; setTimeout(function(){btn.textContent=o;},2200); }
}


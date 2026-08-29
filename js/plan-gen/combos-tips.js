// js/plan-gen/combos-tips.js
// Two localStorage-backed shared libraries with the same lazy-cache pattern, plus
// two small helpers, extracted verbatim from js/app-part3.js (module split wave 15):
//   Saved Combos: _savedCombosCache, comboDietOK, comboHasExcludedFood,
//     mergeSavedComboLists, migrateLegacyPerClientCombos, getSavedCombos, setSavedCombos
//   Tips Library: _tipsLibraryCache, defaultTipsSeed, getTipsLibrary, setTipsLibrary
//   dietoToast (toast helper), toggleMealTemplate (⭐ taste-template toggle)
// Only `var x = null` initialisers run at parse time. comboDietOK/comboHasExcludedFood
// are called from plan-gen/meal-library.js + tracking/tracking.js; getSavedCombos from
// app-part4.js; getTipsLibrary/setTipsLibrary/dietoToast from app-part7-tips.js;
// toggleMealTemplate from an app-part2.js onclick — all runtime. Loads before app-part3.js.

/* ---- Saved Combos ----
   Shared across ALL clients, stored under its own localStorage key ('savedCombos') via
   safeStorageGet/safeStorageSet — same pattern as getFavoriteMeals/saveFavoriteMeals below.
   This used to live per-client (c.savedCombos). An earlier version tried a shared key but
   wrote it through the per-client save() path, so each client's save() overwrote the shared
   key with just its own list and clobbered whatever another client had saved — that's how a
   real client's combo list got wiped. Storing it independently of any client's save() avoids
   that: it's read/written directly, never touched by per-client save(). Diet-type mixing
   across clients is guarded by comboDietOK()/comboHasExcludedFood() below, applied at every
   read site (plan generation via findSavedComboMatch, meal-alternative suggestions, the
   food-library sidebar, and drag-and-drop insertion) — a combo tagged for one client's diet
   or saved while another client's food was excluded must never surface for an incompatible
   client. */

// In-memory cache of the shared list, so the many getSavedCombos() call sites (plan
// generation, meal alternatives, food-library render, drag-and-drop, save/delete) don't each
// re-read+JSON.parse localStorage. null means "not loaded from storage yet" (distinct from a
// loaded-but-empty list). Anything that writes 'savedCombos' to storage from outside
// setSavedCombos() (currently just Cloud.load(), in Dietologist.html) must also null this out
// or the cache will keep serving stale data after that write.
var _savedCombosCache = null;

// Diet-type compatibility check shared by every saved-combo consumer. A restrictive client
// diet only accepts same-diet combos; 'normal'/no dietType accepts anything.
function comboDietOK(clientDietType, comboDietType){
  if(!clientDietType || clientDietType==='normal') return true;
  return comboDietType===clientDietType;
}
// Allergen/exclusion check shared by every saved-combo consumer.
function comboHasExcludedFood(foods, exclLower){
  if(!exclLower || !exclLower.length || !foods) return false;
  return foods.some(function(food){
    var nameLower=(food.n||'').toLowerCase();
    return exclLower.some(function(excluded){ return excluded && nameLower.indexOf(excluded)!==-1; });
  });
}
// Merge two saved-combo lists, deduping by id (id-less entries can't be matched against
// existing ones, so they're always kept). Shared by the legacy migration below and by
// importBackup()'s "merge" path (js/app-part4.js).
function mergeSavedComboLists(base, incoming){
  var merged=(base||[]).slice();
  var seenIds={};
  merged.forEach(function(x){ if(x && x.id) seenIds[x.id]=true; });
  (incoming||[]).forEach(function(combo){
    if(combo && (!combo.id || !seenIds[combo.id])){
      if(combo.id) seenIds[combo.id]=true;
      merged.push(combo);
    }
  });
  return merged;
}

// Pull any combos still sitting on old per-client c.savedCombos (from before this became a
// shared list) into the shared 'savedCombos' key, then strip the now-unread field off each
// client so it doesn't linger as dead data.
//
// Deliberately NOT gated by a persistent "already migrated" flag: `clients` can still be a
// stale/partial local cache the first few times this runs (e.g. Cloud.load() hasn't resolved
// yet, or an old snapshot got restored later via restoreFromSnapshot()) — a flag set on that
// first, incomplete pass would permanently strand any legacy combos that show up afterwards.
// Instead we just check current `clients` state on every call; the check is a cheap in-memory
// scan, and it naturally becomes a no-op once every client's c.savedCombos has been cleared.
function migrateLegacyPerClientCombos(){
  var clientsArr = (typeof clients!=='undefined' ? clients : []);
  var hasLegacy = clientsArr.some(function(c){ return c && Array.isArray(c.savedCombos) && c.savedCombos.length; });
  if(!hasLegacy) return;
  var merged=safeStorageGet('savedCombos', []) || [];
  clientsArr.forEach(function(c){
    if(c && Array.isArray(c.savedCombos) && c.savedCombos.length){
      merged=mergeSavedComboLists(merged, c.savedCombos);
      delete c.savedCombos;
    }
  });
  safeStorageSet('savedCombos', merged);
  _savedCombosCache = merged;
  try{ save(); }catch(e){}
}

function getSavedCombos(){
  migrateLegacyPerClientCombos();
  if(_savedCombosCache===null) _savedCombosCache=safeStorageGet('savedCombos', []);
  return _savedCombosCache;
}

function setSavedCombos(arr){
  _savedCombosCache=arr;
  safeStorageSet('savedCombos', arr);
  // Bypasses the per-client save()/_doSave() path on purpose (that's what clobbered this
  // data before — see the doc comment above), so it has to poke Cloud sync directly instead
  // of getting it for free the way client-data saves do.
  if(window.Cloud) try{ window.Cloud.save(); }catch(e){}
}

/* ---- Tips Library (tab «📚 Tips», js/app-part7-tips.js) ----
   Ίδιο μοτίβο με τα Saved Combos ακριβώς από πάνω: μία κοινή λίστα για όλους τους πελάτες,
   δικό της localStorage key ('tipsLibrary'), cache + get/set helpers, sync μέσω Cloud.save()
   (Dietologist.html _pushNow/load/forceReloadFromCloud). Μπαίνει στο SNAP μέσω _buildSnapshot
   (tips:) και εμφανίζεται στο client portal (plan.html tipsCard()) αντί για το παλιό στατικό FAQ. */
var _tipsLibraryCache = null;

// Seed: οι 6 ερωτήσεις/απαντήσεις που ήταν hardcoded στο plan.html (faqQ1..6/faqA1..6) πριν
// γίνει επεξεργάσιμη βιβλιοθήκη — ίδιο ελληνικό/EN/RU/TR κείμενο, καμία απώλεια περιεχομένου.
// Χρησιμοποιείται ΜΟΝΟ σαν default του safeStorageGet, άρα μόνο την πρώτη φορά (πριν ο
// διαιτολόγος αποθηκεύσει έστω και μία φορά το δικό του 'tipsLibrary', έστω άδειο).
function defaultTipsSeed(){
  return [
    {id:'seed1', icon:'🍽️', category:'Πλάνο & Καθημερινότητα',
      title:'Πεινάω ανάμεσα στα γεύματα',
      body:'Φυσιολογικό στην αρχή. Πιες πρώτα ένα ποτήρι νερό — συχνά η δίψα μοιάζει με πείνα. Αν επιμένει, έχεις ελεύθερο ένα ωμό λαχανικό (αγγούρι, καρότο, ντομάτα) όποια ώρα θες, χωρίς όριο.',
      titleEn:'I feel hungry between meals',
      bodyEn:'Normal at first. Drink a glass of water first — thirst often feels like hunger. If it persists, you have a raw vegetable (cucumber, carrot, tomato) freely, any time, no limit.',
      titleRu:'Я хочу есть между приёмами пищи',
      bodyRu:'Это нормально вначале. Сначала выпейте стакан воды — часто жажда похожа на голод. Если чувство не проходит, у вас есть свободный доступ к сырым овощам (огурец, морковь, помидор) в любое время, без ограничений.',
      titleTr:'Öğünler arasında acıkıyorum',
      bodyTr:'Başlangıçta normal. Önce bir bardak su iç — susuzluk çoğu zaman açlık gibi hissettirir. Devam ederse, istediğin zaman sınırsız çiğ sebze (salatalık, havuç, domates) tüketebilirsin.'},
    {id:'seed2', icon:'⚖️', category:'Πλάνο & Καθημερινότητα',
      title:'Ξέφυγα από το πλάνο — τι κάνω;',
      body:'Καμία τραγωδία. Δεν παραλείπεις το επόμενο γεύμα για να «αναπληρώσεις» — απλά συνεχίζεις κανονικά. Αν συμβαίνει συχνά, πες μου το από το Πρόοδος ή γράψε μου, θα προσαρμόσουμε το πλάνο μαζί.',
      titleEn:'I strayed from the plan — what now?',
      bodyEn:'No drama. Don\'t skip the next meal to "make up for it" — just carry on normally. If it keeps happening, tell me from Progress or send a message, and we\'ll adjust the plan together.',
      titleRu:'Я отступил(а) от плана — что делать?',
      bodyRu:'Ничего страшного. Не пропускайте следующий приём пищи, чтобы «компенсировать» — просто продолжайте как обычно. Если это повторяется часто, сообщите мне в разделе «Прогресс» или напишите — вместе скорректируем план.',
      titleTr:'Plandan saptım — ne yapmalıyım?',
      bodyTr:'Sorun değil. "Telafi etmek" için bir sonraki öğünü atlama — sadece normal şekilde devam et. Sık oluyorsa İlerleme sekmesinden söyle veya bana yaz, planı birlikte ayarlayalım.'},
    {id:'seed3', icon:'🥄', category:'Πλάνο & Καθημερινότητα',
      title:'Πώς ζυγίζω τις τροφές;',
      body:'Όλα τα γραμμάρια στο πλάνο είναι ωμό βάρος — ζύγισε πριν το μαγείρεμα, εκτός αν δίπλα στην τροφή αναγράφεται διαφορετικά (π.χ. «μαγειρεμένο»).',
      titleEn:'How do I weigh foods?',
      bodyEn:'All grams in the plan are raw weight — weigh before cooking, unless the food says otherwise (e.g. "cooked").',
      titleRu:'Как взвешивать продукты?',
      bodyRu:'Все граммы в плане указаны в сыром весе — взвешивайте перед готовкой, если рядом с продуктом не указано иное (например, «варёное»).',
      titleTr:'Yiyecekleri nasıl tartmalıyım?',
      bodyTr:'Plandaki tüm gramajlar çiğ ağırlıktır — yanında farklı belirtilmedikçe (örn. "pişmiş") pişirmeden önce tart.'},
    {id:'seed4', icon:'⏰', category:'Πλάνο & Καθημερινότητα',
      title:'Πόσο αυστηρές είναι οι ώρες γευμάτων;',
      body:'Οδηγός είναι, όχι νόμος — ±60 λεπτά δεν αλλάζει τίποτα. Αυτό που μετράει είναι η σειρά και το περιεχόμενο κάθε γεύματος, όχι το ρολόι.',
      titleEn:'How strict are the meal times?',
      bodyEn:'They\'re a guide, not a rule — ±60 minutes changes nothing. What matters is the order and content of each meal, not the clock.',
      titleRu:'Насколько строго нужно соблюдать время приёмов пищи?',
      bodyRu:'Это ориентир, а не правило — ±60 минут ничего не меняют. Важен порядок и содержание каждого приёма пищи, а не часы.',
      titleTr:'Öğün saatleri ne kadar katı?',
      bodyTr:'Bir rehberdir, kural değil — ±60 dakika hiçbir şeyi değiştirmez. Önemli olan saatler değil, her öğünün sırası ve içeriğidir.'},
    {id:'seed5', icon:'☕', category:'Πλάνο & Καθημερινότητα',
      title:'Καφές, τσάι, αλκοόλ — επιτρέπονται;',
      body:'Καφές και τσάι χωρίς ζάχαρη: ελεύθερα, όποια ώρα θες. Αλκοόλ: 1-2 φορές/εβδομάδα με μέτρο, όχι σε ημέρα προπόνησης ή αγώνα.',
      titleEn:'Coffee, tea, alcohol — allowed?',
      bodyEn:'Coffee and tea without sugar: freely, any time. Alcohol: 1-2 times/week in moderation, not on training or match days.',
      titleRu:'Кофе, чай, алкоголь — можно?',
      bodyRu:'Кофе и чай без сахара — свободно, в любое время. Алкоголь: 1-2 раза в неделю в меру, не в день тренировки или матча.',
      titleTr:'Kahve, çay, alkol — izinli mi?',
      bodyTr:'Şekersiz kahve ve çay: istediğin zaman serbest. Alkol: haftada 1-2 kez ölçülü, antrenman veya maç günü hariç.'},
    {id:'seed6', icon:'✈️', category:'Πλάνο & Καθημερινότητα',
      title:'Πάω έξω ή ταξίδι — τι επιλέγω;',
      body:'Διάλεξε ψητό ή βραστό κρέας/ψάρι, σαλάτα, και μία μερίδα αμύλου (ρύζι, πατάτα, ψωμί) — σαν να έφτιαχνες μόνη σου το πιάτο του πλάνου. Απόφυγε τηγανητά και επιδόρπια όποτε γίνεται.',
      titleEn:'Eating out or traveling — what do I pick?',
      bodyEn:'Choose grilled or boiled meat/fish, a salad, and one portion of starch (rice, potato, bread) — as if building your own plate from the plan. Avoid fried food and desserts when you can.',
      titleRu:'Иду в гости или путешествую — что выбрать?',
      bodyRu:'Выбирайте запечённое или отварное мясо/рыбу, салат и одну порцию углеводов (рис, картофель, хлеб) — как если бы вы сами составляли тарелку по плану. По возможности избегайте жареного и десертов.',
      titleTr:'Dışarıda yiyorum veya seyahatteyim — ne seçmeliyim?',
      bodyTr:'Izgara veya haşlanmış et/balık, salata ve bir porsiyon nişasta (pilav, patates, ekmek) seç — sanki plandaki tabağı kendin hazırlıyormuş gibi. Mümkün olduğunca kızartma ve tatlıdan kaçın.'}
  ];
}

function getTipsLibrary(){
  if(_tipsLibraryCache===null) _tipsLibraryCache=safeStorageGet('tipsLibrary', defaultTipsSeed());
  return _tipsLibraryCache;
}

function setTipsLibrary(arr){
  _tipsLibraryCache=arr;
  safeStorageSet('tipsLibrary', arr);
  if(window.Cloud) try{ window.Cloud.save(); }catch(e){}
}

// ── Lightweight toast notification ─────────────────────────────────────────
function dietoToast(msg, color){
  try{
    var t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:20px;right:20px;background:'+(color||'#4CAF50')+';color:#fff;padding:12px 16px;border-radius:8px;font-size:13px;z-index:10000;box-shadow:0 2px 8px rgba(0,0,0,0.25);max-width:340px';
    t.textContent=msg;
    document.body.appendChild(t);
    setTimeout(function(){t.remove();},3200);
  }catch(e){console.log(msg);}
}

// ── ⭐ Toggle: mark current client as a "taste template" source ─────────────
// Their plan's meals feed the cross-client taste library used by genPlan.
function toggleMealTemplate(){
  var c=getC();if(!c)return;
  var hasPlan=c.weekPlan && Object.keys(c.weekPlan).length>0;
  if(!c.isMealTemplate && !hasPlan){
    dietoToast('⚠️ Δεν υπάρχει πλάνο σε αυτόν τον πελάτη για να γίνει πρότυπο.', '#e65100');
    return;
  }
  c.isMealTemplate=!c.isMealTemplate;
  save();
  var b=document.getElementById('star-tmpl-btn');
  if(b){
    b.style.background=c.isMealTemplate?'#ffb300':'#eee';
    b.style.color=c.isMealTemplate?'#fff':'#555';
    b.innerHTML=c.isMealTemplate?'⭐ Πρότυπο γεύσης':'☆ Όρισε ως πρότυπο γεύσης';
  }
  if(c.isMealTemplate){
    var n=harvestMealLibrary().length;
    dietoToast('⭐ Προστέθηκε στα πρότυπα γεύσης. Βιβλιοθήκη: '+n+' μοναδικά γεύματα διαθέσιμα για νέα πλάνα.');
  } else {
    dietoToast('Αφαιρέθηκε από τα πρότυπα γεύσης.', '#757575');
  }
}


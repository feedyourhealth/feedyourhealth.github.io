// ── Tab «📚 Tips» ─────────────────────────────────────────────────────────
// Βιβλιοθήκη tips/οδηγιών (αντικαθιστά το παλιό στατικό FAQ του client portal — βλ.
// [[dietologist-tips-library]]). Ίδιο σκελετό με το tab Συνταγές (js/app-part6-recipes.js):
// toolbar+φίλτρα+λίστα καρτών + lazy modal για προσθήκη/επεξεργασία. Δεδομένα/αποθήκευση στο
// getTipsLibrary()/setTipsLibrary() (js/app-part3.js) — μία κοινή λίστα για όλους τους πελάτες.
var _tipsSearchTerm='';
var _tipsCategoryFilter='';

function tipIconChoices(){
  return ['💡','🍽️','⚖️','🥄','⏰','☕','✈️','💧','🫒','🥗','🕌','🏃'];
}

function getTipById(id){
  var all=getTipsLibrary();
  for(var i=0;i<all.length;i++){ if(all[i].id===id) return all[i]; }
  return null;
}

function tipCategories(){
  var all=getTipsLibrary(), cats=[];
  all.forEach(function(t){ if(t.category && cats.indexOf(t.category)===-1) cats.push(t.category); });
  return cats;
}

// Χαλαρή σύγκριση κατηγοριών για το saveTip() παρακάτω: πεζά/κεφαλαία ΚΑΙ τόνοι δεν μετράνε
// (π.χ. "ενυδατωση" χωρίς τόνο πρέπει να ταιριάζει με "Ενυδάτωση") — αλλιώς μια γρήγορα
// πληκτρολογημένη κατηγορία χωρίς τόνο θα δημιουργούσε ξεχωριστό, σχεδόν-διπλότυπο φίλτρο.
function foldGreekForCompare(s){
  // Χτίζει το εύρος Unicode "Combining Diacritical Marks" (0x0300–0x036f — τόνοι/διαλυτικά
  // μετά από NFD decomposition) από κωδικούς χαρακτήρων αντί για literal γλύφους μέσα στο
  // regex, ώστε να μην υπάρχει καμία αμφιβολία τι ακριβώς περιέχει.
  var cls='['+String.fromCharCode(0x0300)+'-'+String.fromCharCode(0x036f)+']';
  var combiningMarks=new RegExp(cls,'g');
  return String(s||'').toLowerCase().normalize('NFD').replace(combiningMarks,'');
}

function renderTips(){
  curId=null;
  _tipsCategoryFilter='';
  var main=document.getElementById('main');
  if(!main) return;
  var html='<div class="hm-wrap">';
  html+='<div class="hm-title">📚 Tips</div>';
  html+='<div class="rcp-toolbar">';
  html+='<input type="text" class="rcp-search" placeholder="🔍 Αναζήτηση tip ή κατηγορίας..." aria-label="Αναζήτηση tip" oninput="filterTips(this.value)">';
  html+='<button type="button" class="rcp-add-btn" onclick="openNewTipModal()">+ Νέο tip</button>';
  html+='</div>';
  html+='<div id="tip-filter-row" class="rcp-filter-row"></div>';
  html+='<div id="tip-count" class="rcp-count"></div>';
  html+='<div id="tip-list" class="rcp-list"></div>';
  html+='</div>';
  main.innerHTML=html;
  renderTipsList();
  renderSB();
}

function filterTips(v){ _tipsSearchTerm=foldGreekForCompare(v); renderTipsList(); }
function setTipsCategoryFilter(cat){ _tipsCategoryFilter=cat; renderTipsList(); }

// opts.canReorder/isFirst/isLast: τα βέλη ▲▼ εμφανίζονται ΜΟΝΟ στην πλήρη, αφιλτράριστη λίστα
// (βλ. renderTipsList) — σε φιλτραρισμένη προβολή η θέση στην οθόνη δεν είναι η ίδια με τη θέση
// στην πραγματική λίστα, οπότε "πάνω/κάτω" θα μπέρδευε παρά θα βοηθούσε.
function tipRow(tip, opts){
  opts=opts||{};
  var hiddenBadge = tip.visible===false ? '<span class="cc-ea-badge" title="Δεν φαίνεται στους πελάτες">🙈 Κρυφό</span>' : '';
  var reorderHtml='';
  if(opts.canReorder){
    reorderHtml='<div class="tip-reorder">'
      +'<button type="button" class="tip-reorder-btn" title="Μετακίνηση πάνω" aria-label="Μετακίνηση πάνω"'+(opts.isFirst?' disabled':'')+' onclick="moveTipUp(\''+tip.id+'\')">▲</button>'
      +'<button type="button" class="tip-reorder-btn" title="Μετακίνηση κάτω" aria-label="Μετακίνηση κάτω"'+(opts.isLast?' disabled':'')+' onclick="moveTipDown(\''+tip.id+'\')">▼</button>'
      +'</div>';
  }
  var langBadges='<div class="tip-lang-row">'
    +'<span class="cc-status cc-status-active">EL</span>'
    +'<span class="cc-status '+(tip.titleEn?'cc-status-active':'cc-status-none')+'">EN</span>'
    +'<span class="cc-status '+(tip.titleRu?'cc-status-active':'cc-status-none')+'">RU</span>'
    +'<span class="cc-status '+(tip.titleTr?'cc-status-active':'cc-status-none')+'">TR</span>'
    +'</div>';
  return '<div class="rcp-row'+(tip.visible===false?' tip-hidden':'')+'">'
    +'<div class="rcp-row-top">'
    +reorderHtml
    +'<div class="rcp-row-left"><button type="button" class="rcp-name rcp-name-link" onclick="openNewTipModal(\''+tip.id+'\')">'+esc((tip.icon||'💡')+' '+tip.title)+'</button>'+hiddenBadge+'</div>'
    +'<button type="button" class="row-del" title="Διαγραφή" aria-label="Διαγραφή tip" onclick="deleteTip(\''+tip.id+'\')">🗑</button>'
    +'</div>'
    +'<div class="rcp-sub"><span class="rcp-cat-pill">'+esc(tip.category||'Γενικά')+'</span></div>'
    +langBadges
    +'</div>';
}

// Αναδιάταξη — χειρίζεται πάντα την ΠΛΗΡΗ λίστα (getTipsLibrary), ποτέ τη φιλτραρισμένη προβολή.
function moveTip(id, dir){
  var list=getTipsLibrary().slice();
  var idx=-1;
  for(var i=0;i<list.length;i++){ if(list[i].id===id){ idx=i; break; } }
  if(idx===-1) return;
  var swapWith=idx+dir;
  if(swapWith<0 || swapWith>=list.length) return;
  var tmp=list[idx]; list[idx]=list[swapWith]; list[swapWith]=tmp;
  setTipsLibrary(list);
  renderTipsList();
}
function moveTipUp(id){ moveTip(id,-1); }
function moveTipDown(id){ moveTip(id,1); }

function renderTipsList(){
  var container=document.getElementById('tip-list');
  var countEl=document.getElementById('tip-count');
  var filterRow=document.getElementById('tip-filter-row');
  if(!container) return;
  var all=getTipsLibrary();
  var cats=tipCategories();

  if(filterRow){
    var chips='<button type="button" class="rcp-filter-chip'+(!_tipsCategoryFilter?' active':'')+'" onclick="setTipsCategoryFilter(\'\')">Όλες ('+all.length+')</button>';
    cats.forEach(function(cat){
      var n=all.filter(function(t){return t.category===cat;}).length;
      chips+='<button type="button" class="rcp-filter-chip'+(_tipsCategoryFilter===cat?' active':'')+'" onclick="setTipsCategoryFilter(\''+escJsAttr(cat)+'\')">'+esc(cat)+' ('+n+')</button>';
    });
    filterRow.innerHTML=chips;
  }

  var q=_tipsSearchTerm;
  var filtered=all.filter(function(t){
    if(_tipsCategoryFilter && t.category!==_tipsCategoryFilter) return false;
    if(q){
      var hay=foldGreekForCompare((t.title||'')+' '+(t.body||'')+' '+(t.category||''));
      if(hay.indexOf(q)===-1) return false;
    }
    return true;
  });

  var canReorder = !_tipsCategoryFilter && !_tipsSearchTerm;
  container.innerHTML = filtered.length ? filtered.map(function(t){
    var fullIdx=all.indexOf(t);
    return tipRow(t, {canReorder:canReorder, isFirst:fullIdx===0, isLast:fullIdx===all.length-1});
  }).join('') : '<div class="hm-empty">Κανένα tip δεν βρέθηκε</div>';
  if(countEl) countEl.textContent = 'Εμφανίζονται '+filtered.length+' από '+all.length+' tips';
}

// ── Modal «Νέο tip» / «Επεξεργασία tip» — ίδιο lazy-modal μοτίβο με openNewRecipeModal()
// (js/app-part6-recipes.js): ένα κρυφό div φτιάχνεται μία φορά, ξαναγεμίζεται το innerHTML
// σε κάθε άνοιγμα. Καμία in-place edit δεν υπήρχε ήδη στο εργαλείο για custom περιεχόμενο
// (ούτε καν οι συνταγές το έχουν, μόνο προσθήκη+διαγραφή) — εδώ ξαναχρησιμοποιείται η ίδια
// φόρμα προσυμπληρωμένη, με το ίδιο id, και το saveTip() αντικαθιστά αντί να προσθέτει.
var TIP_LANG_LABELS={en:'English', ru:'Русский', tr:'Türkçe'};
var TIP_LANG_SUFFIX_JS={en:'En', ru:'Ru', tr:'Tr'};

function newTipModalHtml(tip){
  tip=tip||{};
  var icons=tipIconChoices();
  var selIcon=tip.icon||'💡';
  var iconHtml=icons.map(function(ic){
    return '<div class="icon-opt'+(ic===selIcon?' sel':'')+'" data-icon="'+ic+'" onclick="pickTipIcon(this)">'+ic+'</div>';
  }).join('');

  var cats=tipCategories();
  var catOptions=cats.map(function(c){return '<option value="'+esc(c)+'">';}).join('');

  var langTabs=['en','ru','tr'].map(function(lg,i){
    return '<button type="button" class="rcp-chip'+(i===0?' active':'')+'" data-lang="'+lg+'" onclick="switchTipLangTab(this)">'+TIP_LANG_LABELS[lg]+'</button>';
  }).join('');
  var langFields=['en','ru','tr'].map(function(lg,i){
    var sfx=TIP_LANG_SUFFIX_JS[lg];
    return '<div class="tip-lang-fields" data-lang-fields="'+lg+'" style="display:'+(i===0?'block':'none')+'">'
      +'<div class="nr-field"><label>Τίτλος</label><input type="text" id="tip-title-'+lg+'" value="'+esc(tip['title'+sfx]||'')+'"></div>'
      +'<div class="nr-field" style="margin-bottom:0"><label>Κείμενο</label><textarea id="tip-body-'+lg+'">'+esc(tip['body'+sfx]||'')+'</textarea></div>'
      +'</div>';
  }).join('');

  return '<div class="recipe-modal-content nr-modal-content">'
    +'<div class="recipe-modal-title"><span>'+(tip.id?'Επεξεργασία tip':'Νέο tip')+'</span><button class="recipe-modal-close" onclick="closeNewTipModal()">&times;</button></div>'
    +'<input type="hidden" id="tip-id" value="'+esc(tip.id||'')+'">'
    +'<div class="nr-field"><label>Εικονίδιο</label><div class="icon-row" id="tip-icon-row">'+iconHtml+'</div></div>'
    +'<div class="nr-field"><label>Κατηγορία</label><input type="text" id="tip-cat" list="tip-cat-list" placeholder="π.χ. Ενυδάτωση" value="'+esc(tip.category||'')+'"><datalist id="tip-cat-list">'+catOptions+'</datalist></div>'
    +'<div class="nr-field"><label>Τίτλος (Ελληνικά)</label><input type="text" id="tip-title-el" value="'+esc(tip.title||'')+'"></div>'
    +'<div class="nr-field"><label>Κείμενο (Ελληνικά)</label><textarea id="tip-body-el">'+esc(tip.body||'')+'</textarea></div>'
    +'<div class="nr-field"><label class="tip-visible-label"><input type="checkbox" id="tip-visible"'+(tip.visible===false?'':' checked')+'> Ορατό στους πελάτες</label></div>'
    +'<div class="nr-divider">'
      +'<div class="nr-divider-lbl">Μεταφράσεις (προαιρετικό)</div>'
      +'<div class="nr-divider-sub">Αν αφήσεις μια γλώσσα κενή, ο πελάτης θα βλέπει τα Ελληνικά.</div>'
      +'<div class="rcp-chips" style="margin-bottom:10px">'+langTabs+'</div>'
      +langFields
    +'</div>'
    +'<div id="tip-error" class="nr-error"></div>'
    +'<button type="button" class="nr-save-btn" onclick="saveTip()">💾 Αποθήκευσε tip</button>'
    +'</div>';
}

function openNewTipModal(id){
  var tip=id?getTipById(id):null;
  var modal=document.getElementById('tip-form-modal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='tip-form-modal';
    modal.className='recipe-modal hidden';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    document.body.appendChild(modal);
    modal.addEventListener('click',function(e){ if(e.target===modal) closeNewTipModal(); });
  }
  modal.innerHTML=newTipModalHtml(tip);
  modal.classList.remove('hidden');
}

function closeNewTipModal(){
  var modal=document.getElementById('tip-form-modal');
  if(modal) modal.classList.add('hidden');
}

function pickTipIcon(el){
  var row=document.getElementById('tip-icon-row');
  if(!row) return;
  var opts=row.querySelectorAll('.icon-opt');
  for(var i=0;i<opts.length;i++) opts[i].classList.remove('sel');
  el.classList.add('sel');
}

function switchTipLangTab(btn){
  var group=btn.parentElement;
  var tabs=group.querySelectorAll('.rcp-chip');
  for(var i=0;i<tabs.length;i++) tabs[i].classList.remove('active');
  btn.classList.add('active');
  var lang=btn.getAttribute('data-lang');
  var fields=document.querySelectorAll('.tip-lang-fields');
  for(var j=0;j<fields.length;j++){
    fields[j].style.display = (fields[j].getAttribute('data-lang-fields')===lang) ? 'block' : 'none';
  }
}

function saveTip(){
  var errEl=document.getElementById('tip-error');
  if(errEl) errEl.textContent='';
  var id=document.getElementById('tip-id').value;
  var iconEl=document.querySelector('#tip-icon-row .icon-opt.sel');
  var icon=iconEl?iconEl.getAttribute('data-icon'):'💡';
  var category=(document.getElementById('tip-cat').value||'').trim();
  var titleEl=(document.getElementById('tip-title-el').value||'').trim();
  var bodyEl=(document.getElementById('tip-body-el').value||'').trim();
  var visibleEl=document.getElementById('tip-visible');
  var visible=visibleEl?visibleEl.checked:true;
  if(!category){ if(errEl) errEl.textContent='Συμπλήρωσε κατηγορία.'; return; }
  if(!titleEl){ if(errEl) errEl.textContent='Συμπλήρωσε τίτλο (Ελληνικά).'; return; }
  if(!bodyEl){ if(errEl) errEl.textContent='Συμπλήρωσε κείμενο (Ελληνικά).'; return; }

  // Κανονικοποίηση κατηγορίας: αν υπάρχει ήδη μία που ταιριάζει case-insensitive (π.χ. έγραψες
  // "ενυδατωση" και ήδη υπάρχει "Ενυδάτωση"), κρατάμε την υπάρχουσα γραφή — αλλιώς η λίστα
  // φίλτρων γεμίζει σχεδόν-διπλότυπες κατηγορίες με τον καιρό.
  var existingCats=tipCategories();
  var categoryFold=foldGreekForCompare(category);
  for(var ci=0;ci<existingCats.length;ci++){
    if(foldGreekForCompare(existingCats[ci])===categoryFold){ category=existingCats[ci]; break; }
  }

  var tip={
    id: id || ('tip_'+Date.now()+'_'+Math.random().toString(36).slice(2,8)),
    icon: icon,
    category: category,
    visible: visible,
    title: titleEl,
    body: bodyEl,
    titleEn:(document.getElementById('tip-title-en').value||'').trim(),
    bodyEn:(document.getElementById('tip-body-en').value||'').trim(),
    titleRu:(document.getElementById('tip-title-ru').value||'').trim(),
    bodyRu:(document.getElementById('tip-body-ru').value||'').trim(),
    titleTr:(document.getElementById('tip-title-tr').value||'').trim(),
    bodyTr:(document.getElementById('tip-body-tr').value||'').trim()
  };

  var list=getTipsLibrary().slice();
  var idx=-1;
  for(var i=0;i<list.length;i++){ if(list[i].id===tip.id){ idx=i; break; } }
  var isEdit=idx>-1;
  if(isEdit) list[idx]=tip; else list.push(tip);
  setTipsLibrary(list);
  closeNewTipModal();
  renderTipsList();
  if(typeof dietoToast==='function') dietoToast(isEdit?'✅ Το tip ενημερώθηκε':'✅ Το tip προστέθηκε');
}

function doDeleteTip(id){
  var list=getTipsLibrary().filter(function(t){ return t.id!==id; });
  setTipsLibrary(list);
  renderTipsList();
  if(typeof dietoToast==='function') dietoToast('🗑 Το tip διαγράφηκε');
}

function deleteTip(id){
  showConfirmDialog('Θα διαγραφεί μόνιμα αυτό το tip — θα σταματήσει να φαίνεται σε όλους τους πελάτες μετά το επόμενο μοίρασμα/ανανέωση πλάνου τους. Συνέχεια;', function(){ doDeleteTip(id); });
}

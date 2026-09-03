// js/appointments/appointments.js
// The "📝 Ραντεβού" tab — in-appointment questionnaire/notes, food-preference
// bridge, plan-action chips, sparklines, correlation chart, attention digest,
// buildAppointmentsHtml, absence log, appointment-entry CRUD, setNextAppointmentDate,
// resolveAppointmentFlag + the APPT_* constant tables. Extracted verbatim from
// js/app-part2.js (module split wave 26). Only literal `var _appt* = …` initialisers
// run at parse time. Callers: renderMain/swTab (app-part2.js) + a portal-refresh
// handler in app-part5-home.js — all runtime. Loads right after app-part2.js.

// ── "📝 Ραντεβού" tab (in-appointment questionnaire/notes) ──────────────────
var APPT_COMMON_CHIPS=['Καλή διάθεση','Κόπωση','Πείνα εκτός γευμάτων','Φούσκωμα','Δυσκοιλιότητα','Διάρροια/GI stress','Πόνος/τραυματισμός','Στρες','Λείπει ύπνος'];
// ✨ Idea 6 (2026-08-14): γρήγορα πρότυπα για το ελεύθερο πεδίο σημειώσεων — ίδιας λογικής με τα
// APPT_COMMON_CHIPS από πάνω, αλλά γεμίζουν το textarea αντί να λειτουργούν σαν tags. Βλ. insertApptTemplate().
var APPT_NOTE_TEMPLATES=['Καλή πρόοδος, συνεχίζουμε το ίδιο πλάνο.','Δυσκολία με τα σνακ — να απλοποιηθούν τα υλικά.','Αύξηση θερμίδων λόγω έντασης προπόνησης.','Χρειάζεται πλήρες νέο πλάνο από την επόμενη εβδομάδα.'];
function apptTemplateRowHtml(textareaId){
  return '<div class="appt-tmpl-row">'+APPT_NOTE_TEMPLATES.map(function(t){
    return '<button type="button" class="appt-tmpl-chip" onclick="insertApptTemplate(\''+t.replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\',\''+textareaId+'\')">'+esc(t.length>28?t.slice(0,27)+'…':t)+'</button>';
  }).join('')+'</div>';
}
// Προσθέτει (δεν αντικαθιστά) το πρότυπο στο τέλος του υπάρχοντος κειμένου — ο διαιτολόγος μπορεί
// να το πειράξει μετά. Δουλεύει και στη φόρμα νέας καταχώρησης (#appt-notes) και στην επεξεργασία
// παλιάς (#appt-edit-notes-<i>), αφού δέχεται το target id ως παράμετρο.
function insertApptTemplate(text,textareaId){
  var ta=document.getElementById(textareaId);
  if(!ta)return;
  ta.value=ta.value?(ta.value.replace(/\s+$/,'')+' '+text):text;
  ta.focus();
}
// ✅ Ιδέα 1 (2026-08-25): "γέφυρα" από τη σκέτη σημείωση ραντεβού προς τις Προτιμήσεις του πελάτη
// (c.preferences) — το πεδίο εκείνο ήδη περνάει από parsePreferenceAvoidFoods() και επηρεάζει
// πραγματικά το επόμενο πλάνο, ενώ το appt-notes είναι απλώς αρχειοθετημένο κείμενο που ΚΑΝΕΝΑΣ
// αλγόριθμος δε διαβάζει. Αν ο διαιτολόγος έχει επιλέξει (selection) κομμάτι της σημείωσης στέλνει
// μόνο αυτό, αλλιώς όλη τη σημείωση. Δουλεύει είτε στη φόρμα νέας καταχώρησης (#appt-notes) είτε
// στην επεξεργασία παλιάς (#appt-edit-notes-<i>), αφού δέχεται το target id ως παράμετρο — ίδιο
// μοτίβο με insertApptTemplate() πιο πάνω.
function apptSendNoteToPreferences(textareaId,btn){
  var ta=document.getElementById(textareaId);
  if(!ta)return;
  var selStart=ta.selectionStart,selEnd=ta.selectionEnd;
  var text=(selEnd>selStart?ta.value.slice(selStart,selEnd):ta.value).trim();
  if(!text)return;
  var c=getC();if(!c)return;
  var newVal=c.preferences?(c.preferences.replace(/\s+$/,'')+'\n'+text):text;
  upd('preferences',newVal);
  if(btn){
    var orig=btn.textContent;
    btn.textContent='✅ Προστέθηκε';
    btn.disabled=true;
    setTimeout(function(){btn.textContent=orig;btn.disabled=false;},1400);
  }
}
// 🍽 Ιδέα 2 (2026-08-25): δομημένη καταγραφή τροφικών προτιμήσεων ανά πελάτη (c.foodPrefs) — αντί
// να θάβεται μια πρόταση σε ελεύθερο κείμενο, γίνεται chip με τρόφιμο + κατεύθυνση (αρέσει/δεν
// αρέσει) + προαιρετική ώρα. Μένει ΜΟΝΙΜΑ στον πελάτη (όχι ανά ραντεβού) — δεν χάνεται μέσα στο
// ιστορικό. Οι αντιπάθειες τροφοδοτούν αυτόματα το exclusion list του genPlan() μέσω
// buildClientExclusionList() (js/app-part3.js). Η ώρα είναι προς το παρόν μόνο πληροφοριακή/
// για να τη βλέπει ο διαιτολόγος — το genPlan() δεν είναι (ακόμα) meal-slot-aware ώστε να την
// τηρεί αυτόματα· ηθελημένα συντηρητικό, για να μην αποκλείει λάθος γεύμα.
var _apptFoodDatalistCache=null;
function apptFoodDatalistHtml(){
  if(_apptFoodDatalistCache)return _apptFoodDatalistCache;
  var names=Object.keys(FOODS).filter(function(n){return FOODS[n]&&FOODS[n].cat!=='Συνταγές';}).sort();
  _apptFoodDatalistCache='<datalist id="appt-fp-datalist">'+names.map(function(n){return '<option value="'+esc(n)+'">';}).join('')+'</datalist>';
  return _apptFoodDatalistCache;
}
var _apptFoodNameLookup=null;
// Αναγνωρίζει το πληκτρολογημένο κείμενο ως γνωστό τρόφιμο (ανεκτικό σε τόνους/πεζά-κεφαλαία μέσω
// normalizeGreekText — ίδιος μηχανισμός με το parsePreferenceAvoidFoods) ώστε το chip να αποθηκεύει
// πάντα το ΚΑΝΟΝΙΚΟ όνομα από το FOODS και να ταιριάζει 1-1 με ό,τι ελέγχει το exclusion list.
function apptResolveFoodName(typed){
  if(!typed)return null;
  if(!_apptFoodNameLookup){
    _apptFoodNameLookup={};
    Object.keys(FOODS).forEach(function(n){
      if(FOODS[n]&&FOODS[n].cat!=='Συνταγές')_apptFoodNameLookup[normalizeGreekText(n)]=n;
    });
  }
  return _apptFoodNameLookup[normalizeGreekText(typed.trim())]||null;
}
function apptFoodPrefTagsHtml(c){
  var prefs=c.foodPrefs||[];
  if(!prefs.length)return '<div style="font-size:11px;color:#999">Καμία καταχώρηση ακόμα.</div>';
  return prefs.map(function(fp,i){
    var icon=fp.pref==='like'?'👍':'👎';
    var timeTxt=fp.time?(' · '+esc(fp.time)):'';
    return '<span class="foodpref-tag foodpref-'+fp.pref+'">'+icon+' '+esc(fp.food)+timeTxt
      +' <span class="foodpref-x" onclick="removeFoodPref('+i+')" title="Αφαίρεση">✕</span></span>';
  }).join('');
}
function apptFoodPrefsPanelHtml(c){
  return '<div class="tracker-section">'
    +'<div class="tracker-head">🍽 Τροφικές προτιμήσεις</div>'
    +'<div style="font-size:11px;color:#888;margin-bottom:8px">Μόνιμη λίστα για τον πελάτη — οι αντιπάθειες αποκλείονται αυτόματα από τα επόμενα πλάνα.</div>'
    +apptFoodDatalistHtml()
    +'<div id="appt-foodprefs-list" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">'+apptFoodPrefTagsHtml(c)+'</div>'
    +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">'
    +'<input type="text" id="appt-fp-food" list="appt-fp-datalist" placeholder="Τρόφιμο..." class="tracker-inp" style="flex:1;min-width:140px">'
    +'<div class="foodpref-dir-group" id="appt-fp-dir" data-selected="dislike">'
    +'<button type="button" class="foodpref-dir-btn active" data-val="dislike" onclick="toggleFoodPrefDir(this)">👎 Δεν αρέσει</button>'
    +'<button type="button" class="foodpref-dir-btn" data-val="like" onclick="toggleFoodPrefDir(this)">👍 Αρέσει</button>'
    +'</div>'
    +'<select id="appt-fp-time" class="tracker-inp">'
    +'<option value="">Οποιαδήποτε ώρα</option><option value="πρωί">Πρωί</option><option value="μεσημέρι">Μεσημέρι</option><option value="βράδυ">Βράδυ</option>'
    +'</select>'
    +'<button type="button" class="btn" style="padding:5px 12px;font-size:11px;background:#025857;color:#fff;border:none" onclick="addFoodPref()">+ Προσθήκη</button>'
    +'</div>'
    +'</div>';
}
function toggleFoodPrefDir(btn){
  var wrap=btn.parentElement;
  Array.prototype.forEach.call(wrap.querySelectorAll('.foodpref-dir-btn'),function(b){b.classList.remove('active');});
  btn.classList.add('active');
  wrap.setAttribute('data-selected',btn.getAttribute('data-val'));
}
// Ενημερώνει ΜΟΝΟ το #appt-foodprefs-list in-place (όχι ολόκληρη την καρτέλα) — γιατί μια πλήρης
// επανεμφάνιση θα έσβηνε ό,τι έχει ήδη γράψει ο διαιτολόγος στο appt-notes/chips/scales από κάτω,
// ίδιος προβληματισμός με τα LIVE_TYPING_FIELDS στο upd().
function addFoodPref(){
  var c=getC();if(!c)return;
  var inp=document.getElementById('appt-fp-food');
  var resolved=apptResolveFoodName(inp?inp.value:'');
  if(!resolved){
    if(inp){inp.style.borderColor='#c62828';setTimeout(function(){inp.style.borderColor='';},1200);}
    return;
  }
  var dirWrap=document.getElementById('appt-fp-dir');
  var dir=dirWrap?dirWrap.getAttribute('data-selected'):'dislike';
  var timeSel=document.getElementById('appt-fp-time');
  var time=timeSel?timeSel.value:'';
  if(!c.foodPrefs)c.foodPrefs=[];
  // Ίδιο τρόφιμο+ώρα ήδη καταχωρημένο → ενημέρωση αντί για διπλότυπο (π.χ. άλλαξε γνώμη από 👎 σε 👍).
  var dup=c.foodPrefs.filter(function(fp){return fp.food===resolved&&fp.time===time;})[0];
  if(dup){dup.pref=dir;dup.date=today_appt_iso();}
  else c.foodPrefs.push({food:resolved,pref:dir,time:time,date:today_appt_iso()});
  save();
  if(inp)inp.value='';
  if(timeSel)timeSel.value='';
  var list=document.getElementById('appt-foodprefs-list');
  if(list)list.innerHTML=apptFoodPrefTagsHtml(c);
}
function removeFoodPref(idx){
  var c=getC();if(!c||!c.foodPrefs)return;
  c.foodPrefs.splice(idx,1);
  save();
  var list=document.getElementById('appt-foodprefs-list');
  if(list)list.innerHTML=apptFoodPrefTagsHtml(c);
}
function today_appt_iso(){return new Date().toISOString().slice(0,10);}
var APPT_SPORT_CHIPS={
  boxing:['Κοντά σε ζύγιση','Cut βάρους','Camp προπόνησης'],
  bjj:['Camp προπόνησης','Πόνος αρθρώσεων'],
  mma:['Camp προπόνησης','Cut βάρους'],
  football:['Κοντά σε αγώνα','Back-to-back αγώνες','Περίοδος μεταγραφών/έντασης'],
  basketball:['Κοντά σε αγώνα','Back-to-back αγώνες','Πολλά λεπτά συμμετοχής'],
  weightlifting:['Meet προσεχώς','DOMS έντονο'],
  cycling:['Long ride αυτή την εβδομάδα'],
  running:['Αγώνας προσεχώς','DOMS έντονο'],
  swimming:['Διπλή προπόνηση (πρωί/απόγευμα)','Taper πριν αγώνα','Ερεθισμός χλωρίου/δέρμα'],
  crossfit:['DOMS έντονο','WOD έντονο πρόσφατα']
};
var APPT_PLAN_ACTIONS=[
  {val:'new',icon:'🆕',label:'Νέο πλάνο',color:'#c62828'},
  {val:'same',icon:'↔️',label:'Ίδιο πλάνο',color:'#2e7d32'},
  {val:'adjust',icon:'🔧',label:'Μικρή προσαρμογή',color:'#ff9800'},
  {val:'measure',icon:'📏',label:'Μόνο μέτρηση',color:'#1565C0'}
];
function apptPlanActionMeta(val){
  for(var i=0;i<APPT_PLAN_ACTIONS.length;i++)if(APPT_PLAN_ACTIONS[i].val===val)return APPT_PLAN_ACTIONS[i];
  return null;
}
function apptPlanActionBtns(selectedVal){
  return APPT_PLAN_ACTIONS.map(function(a){
    return '<button type="button" class="appt-plan-action-btn'+(a.val===selectedVal?' active':'')+'" data-val="'+a.val+'" style="--pa-color:'+a.color+'" onclick="setApptPlanAction(this)">'+a.icon+' '+esc(a.label)+'</button>';
  }).join('');
}
function setApptPlanAction(btn){
  var wrap=btn.parentElement;
  Array.prototype.forEach.call(wrap.querySelectorAll('.appt-plan-action-btn'),function(b){b.classList.remove('active');});
  btn.classList.add('active');
  wrap.setAttribute('data-selected',btn.getAttribute('data-val'));
}
function apptPlanActionBadgeHtml(val){
  var m=apptPlanActionMeta(val);
  if(!m)return '';
  return '<div style="margin:4px 0"><span class="appt-chip active" style="background:'+m.color+';border-color:'+m.color+';cursor:default">'+m.icon+' '+esc(m.label)+'</span></div>';
}
function fmtDateShortAppt(iso){
  if(!iso)return '';
  var d=new Date(iso+'T00:00:00');if(isNaN(d.getTime()))return '';
  return d.getDate()+'/'+(d.getMonth()+1);
}
function apptScaleButtons(prefix,val){
  var html='';
  for(var i=1;i<=5;i++){
    html+='<button type="button" class="appt-scale-btn'+(val&&i===val?' active':'')+'" data-val="'+i+'" onclick="setApptScale(this)">'+i+'</button>';
  }
  return html;
}
var _apptEditIdx=-1;
function setApptScale(btn){
  var scale=btn.parentElement;
  Array.prototype.forEach.call(scale.querySelectorAll('.appt-scale-btn'),function(b){b.classList.remove('active');});
  btn.classList.add('active');
  scale.setAttribute('data-selected',btn.getAttribute('data-val'));
}
function toggleApptChip(btn){
  btn.classList.toggle('active');
}
function apptSparkline(log,key,color,label,mn,mx){
  var pts=log.filter(function(e){return e[key]>0;});
  if(pts.length<2)return '';
  var W=280,H=90,padL=8,padB=16,padT=8;
  if(mn==null)mn=1; if(mx==null)mx=5; // προεπιλογή: οι κλίμακες 1-5 (GI/compliance) — προαιρετικά override για άλλες μονάδες (π.χ. kcal)
  var sx=function(i){return padL+(i/(pts.length-1))*(W-padL-8);};
  var sy=function(v){return padT+(1-(v-mn)/(mx-mn))*(H-padT-padB);};
  var polyPts=pts.map(function(e,i){return sx(i)+','+sy(e[key]);}).join(' ');
  var svg='<div style="font-size:10px;font-weight:700;color:#025857;margin-bottom:2px">'+esc(label)+'</div><svg viewBox="0 0 '+W+' '+H+'" width="100%">';
  svg+='<polyline points="'+polyPts+'" fill="none" stroke="'+color+'" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
  svg+='<circle cx="'+sx(pts.length-1)+'" cy="'+sy(pts[pts.length-1][key])+'" r="4" fill="'+color+'"/>';
  svg+='<text x="'+padL+'" y="'+(H-4)+'" font-size="9" fill="#999">'+fmtDateShortAppt(pts[0].date)+'</text>';
  svg+='<text x="'+(W-8)+'" y="'+(H-4)+'" font-size="9" fill="#999" text-anchor="end">'+fmtDateShortAppt(pts[pts.length-1].date)+'</text>';
  svg+='</svg>';
  return svg;
}
// Τρέχων μέσος ημερήσιος στόχος θερμίδων — ίδιος υπολογισμός με το avgTarget στην καρτέλα "Πλάνο"
// (calcTDEE + μέσος όρος c.dayTargets[].k όταν υπάρχουν ήδη per-day macro targets, βλ. app-part2.js
// γύρω από τη γραμμή 347). Χρησιμοποιείται για να "φωτογραφίζουμε" τον στόχο τη στιγμή κάθε ραντεβού.
function apptCurrentKcalTarget(c){
  var t=calcTDEE(c);
  var avg=t.target;
  if(c.dayTargets&&c.dayTargets.length===7&&typeof c.dayTargets[0]==='object'){
    var total=0;
    for(var i=0;i<7;i++)total+=(c.dayTargets[i].k||0);
    avg=Math.round(total/7);
  }
  return avg||0;
}
// ✨ Idea 7 (2026-08-14): συνδυασμένο γράφημα τήρησης/συμπτωμάτων/βάρους σε ΚΟΙΝΟ άξονα ημερομηνιών
// — αντικατέστησε 2 ξεχωριστά sparklines (apptSparkline για GI/τήρηση, + ένα παλιότερο
// apptWeightSparklineWithMarkers μόνο για βάρος), το καθένα με το ΔΙΚΟ ΤΟΥ index-based άξονα πάνω σε
// διαφορετικό array (appointments/weightLog) — άρα δεν ήταν πραγματικά συγκρίσιμα οπτικά παρά τη
// γειτονική τοποθέτηση. Εδώ: 2 κάθετοι άξονες
// (αριστερά σταθερή κλίμακα 1-5 για GI/τήρηση — ίδιες μονάδες, δεξιά το πραγματικό εύρος kg για το
// βάρος) πάνω από ΚΟΙΝΟ οριζόντιο άξονα ημερομηνιών (ένωση appointment+weightLog ημερομηνιών). Κάθε
// σειρά σχεδιάζεται ΜΟΝΟ στις ημερομηνίες που έχει πραγματική τιμή — καμία σειρά δεν "τραβάει"
// τεχνητά σημεία σε κενές ημερομηνίες (καμία παρεμβολή/carry-forward).
function apptCorrelationChart(appts,wl){
  var realAppts=(appts||[]).filter(function(e){return !e.status;});
  var giCompAppts=realAppts.filter(function(e){return e.gi>0||e.compliance>0;});
  var weightPts=(wl||[]).filter(function(e){return e.weight>0;});
  var dateSet={};
  giCompAppts.forEach(function(e){dateSet[e.date]=1;});
  weightPts.forEach(function(e){dateSet[e.date]=1;});
  var dates=Object.keys(dateSet).sort();
  if(dates.length<2)return '';

  var W=560,H=150,padL=22,padR=32,padB=18,padT=10;
  var sx=function(i){return padL+(i/(dates.length-1))*(W-padL-padR);};
  var y1=function(v){return padT+(1-(v-1)/4)*(H-padT-padB);}; // αριστερός άξονας: σταθερή κλίμακα 1-5 (GI/τήρηση)

  var wVals=weightPts.map(function(e){return e.weight;});
  var wmn=wVals.length?Math.min.apply(null,wVals):0, wmx=wVals.length?Math.max.apply(null,wVals):1;
  if(wmn===wmx){wmn-=1;wmx+=1;} // αποφυγή διαίρεσης με το 0 όταν το βάρος δεν έχει αλλάξει καθόλου
  var y2=function(v){return padT+(1-(v-wmn)/(wmx-wmn))*(H-padT-padB);}; // δεξιός άξονας: εύρος βάρους

  var apptByDate={},wByDate={};
  giCompAppts.forEach(function(e){apptByDate[e.date]=e;});
  weightPts.forEach(function(e){wByDate[e.date]=e;});

  function seriesLine(key,color){
    var pts=[];
    dates.forEach(function(d,i){
      var e=apptByDate[d];
      if(e && e[key]>0)pts.push({i:i,v:e[key]});
    });
    if(pts.length<2)return '';
    return '<polyline points="'+pts.map(function(p){return sx(p.i)+','+y1(p.v);}).join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  var giLine=seriesLine('gi','#c62828');
  var compLine=seriesLine('compliance','#025857');

  var wPtsIdx=[];
  dates.forEach(function(d,i){ if(wByDate[d])wPtsIdx.push({i:i,e:wByDate[d]}); });
  var wLine=wPtsIdx.length>=2?('<polyline points="'+wPtsIdx.map(function(p){return sx(p.i)+','+y2(p.e.weight);}).join(' ')+'" fill="none" stroke="#1565C0" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>'):'';
  // Ίδια λογική χρωματιστών κουκκίδων με το παλιό apptWeightSparklineWithMarkers — 🆕/↔️/🔧/📏 ανάλογα
  // με την ενέργεια πλάνου εκείνης της ημέρας, ώστε να μη χαθεί αυτό το feature στη συγχώνευση.
  var wDots=wPtsIdx.map(function(p){
    var appt=apptByDate[p.e.date];
    var meta=appt?apptPlanActionMeta(appt.planAction):null;
    var color=meta?meta.color:'#1565C0';
    return '<circle cx="'+sx(p.i)+'" cy="'+y2(p.e.weight)+'" r="'+(meta?4:2.5)+'" fill="'+color+'"><title>'+p.e.date+': '+p.e.weight+'kg'+(meta?' — '+meta.label:'')+'</title></circle>';
  }).join('');

  // ⚠️ Οι ετικέτες κάθε άξονα εμφανίζονται ΜΟΝΟ όταν υπάρχει πραγματικά σχεδιασμένη σειρά σε αυτόν —
  // αλλιώς έδειχνε π.χ. "1kg-0kg" δεξιά όταν δεν υπάρχει καθόλου βάρος, σαν να υπήρχε άδειος άξονας.
  var hasGiOrComp=!!(giLine||compLine), hasWeight=wPtsIdx.length>0;
  var svg='<svg viewBox="0 0 '+W+' '+H+'" width="100%">'
    +(hasGiOrComp?(
      '<line x1="'+padL+'" y1="'+y1(5)+'" x2="'+(W-padR)+'" y2="'+y1(5)+'" stroke="#eee" stroke-width="1"/>'
      +'<line x1="'+padL+'" y1="'+y1(3)+'" x2="'+(W-padR)+'" y2="'+y1(3)+'" stroke="#eee" stroke-width="1"/>'
      +'<line x1="'+padL+'" y1="'+y1(1)+'" x2="'+(W-padR)+'" y2="'+y1(1)+'" stroke="#eee" stroke-width="1"/>'
      +'<text x="1" y="'+(y1(5)+3)+'" font-size="8" fill="#999">5</text>'
      +'<text x="1" y="'+(y1(1)+3)+'" font-size="8" fill="#999">1</text>'
    ):'')
    +(hasWeight?(
      '<text x="'+(W-1)+'" y="'+(y2(wmx)+3)+'" font-size="8" fill="#999" text-anchor="end">'+Math.round(wmx)+'</text>'
      +'<text x="'+(W-1)+'" y="'+(y2(wmn)+3)+'" font-size="8" fill="#999" text-anchor="end">'+Math.round(wmn)+'</text>'
    ):'')
    +giLine+compLine+wLine+wDots
    +'<text x="'+padL+'" y="'+(H-3)+'" font-size="9" fill="#999">'+fmtDateShortAppt(dates[0])+'</text>'
    +'<text x="'+(W-padR)+'" y="'+(H-3)+'" font-size="9" fill="#999" text-anchor="end">'+fmtDateShortAppt(dates[dates.length-1])+'</text>'
    +'</svg>';

  var legendHtml='<div class="appt-corr-legend">'
    +(compLine?'<span><i style="background:#025857"></i>Τήρηση προπόνησης</span>':'')
    +(giLine?'<span><i style="background:#c62828"></i>Πεπτικά συμπτώματα</span>':'')
    +(hasWeight?'<span><i style="background:#1565C0"></i>Βάρος (kg, δεξιός άξονας)</span>':'')
    +'</div>';
  return legendHtml+svg;
}
// ✅ Χειροκίνητο "🔄 Ανανέωση" — τα portal caches (check-ins/σημειώσεις/plan feedback) ανανεώνονται
// αλλιώς μόνο μία φορά, στο login. Το κουμπί ξαναφέρνει τα 3 caches on-demand χωρίς να χρειάζεται
// reload· κάθε refresh*Cache() ήδη ξανασχεδιάζει μόνο του το #s3b/renderSB/renderHome όταν τελειώσει.
function refreshClientPortalFeedback(btn){
  if(!window.Cloud) return;
  if(btn){ btn.disabled=true; btn.textContent='⏳ Ανανέωση...'; }
  var restore=function(){ if(btn){ btn.disabled=false; btn.textContent='🔄 Ανανέωση'; } };
  Promise.all([
    typeof Cloud.refreshCheckinsCache==='function'?Cloud.refreshCheckinsCache():Promise.resolve(),
    typeof Cloud.refreshClientLogsCache==='function'?Cloud.refreshClientLogsCache():Promise.resolve(),
    typeof Cloud.refreshPlanFeedbackCache==='function'?Cloud.refreshPlanFeedbackCache():Promise.resolve(),
    typeof Cloud.refreshLinkHealthCache==='function'?Cloud.refreshLinkHealthCache():Promise.resolve()
  ]).then(restore).catch(restore);
}
// Ξαναδημοσιεύει το πλάνο απευθείας από το κουμπί του digest ("🔗⚠️ Το link δεν λειτουργεί") — ίδιο
// μονοπάτι με dietsQuickRepublish (js/app-part5-home.js), αλλά ξανασχεδιάζει το #s3b (Ραντεβού) και
// ξανατρέχει το linkHealth check ώστε το digest item να εξαφανιστεί αμέσως αν η δημοσίευση πέτυχε.
function apptDigestRepublishLink(clientId,btn){
  var c=clients.find(function(x){return x.id===clientId;});
  if(!c) return;
  if(!window.Cloud || !window.Cloud.publishPlan){ showErrorToast('Το cloud δεν είναι διαθέσιμο αυτή τη στιγμή.'); return; }
  var orig=btn.textContent;
  btn.disabled=true; btn.textContent='Δημοσίευση...';
  window.Cloud.publishPlan(c).then(function(){
    return window.Cloud.refreshLinkHealthCache?window.Cloud.refreshLinkHealthCache():null;
  }).then(function(){
    if(typeof showSuccessToast==='function') showSuccessToast('✅ Το link δημοσιεύτηκε ξανά.');
    var s3b=document.getElementById('s3b');
    if(s3b && typeof getC==='function' && typeof buildAppointmentsHtml==='function'){
      var cur=getC(); if(cur) s3b.innerHTML=buildAppointmentsHtml(cur);
    }
  }).catch(function(e){
    btn.disabled=false; btn.textContent=orig;
    showErrorToast('Σφάλμα δημοσίευσης: '+(e.message||''));
  });
}
// ✨ Idea 3 (2026-08-14): "Χρειάζεται προσοχή" — συγκεντρώνει σε μια λίστα, με ενέργεια δίπλα σε
// κάθε στοιχείο, ΟΛΑ τα σήματα που ήδη υπολογίζει το clientNeedsAttention() (js/app-part1.js, ίδιο
// που τροφοδοτεί τα badges της λίστας πελατών: 🚩/😕/χωρίς πλάνο/ξεπερασμένο link/ανανέωση/check-in
// gap) ΣΥΝ το αναπάντητο μήνυμα πελάτη (clientHasNewClientNote — δεν είναι μέρος του
// clientNeedsAttention, αλλά είναι το ίδιο το παράδειγμα με το οποίο ζητήθηκε αυτό το digest).
// Σκόπιμα ΙΔΙΑ κατώφλια (PF_ATTENTION_NPS_MAX/STAR_MAX) με το 😕 badge ώστε να μη δείχνουν
// αντιφατικά πράγματα το digest εδώ μέσα και η sidebar.
// Ηλικία πελάτη σε ημέρες, με βάση το ίδιο το id (μορφή 'c'+Date.now(), βλ. addClient στο
// js/app-part1.js) — δεν υπάρχει ξεχωριστό πεδίο createdAt στο client object. null αν το id δεν
// ταιριάζει με αυτή τη μορφή (π.χ. εισαγμένος/παλιός πελάτης) — έτσι η περίοδος χάριτος παρακάτω
// ΠΟΤΕ δεν ενεργοποιείται αναξιόπιστα, μόνο σε πελάτες που σίγουρα δημιουργήθηκαν πρόσφατα.
function clientAgeDays(c){
  if(!c || typeof c.id!=='string' || c.id.charAt(0)!=='c') return null;
  var ts=parseInt(c.id.slice(1),10);
  if(!ts || isNaN(ts)) return null;
  if(ts<1577836800000 || ts>2208988800000) return null; // εκτός εύρους 2020-2040 → δεν το εμπιστευόμαστε
  return Math.max(0,Math.floor((Date.now()-ts)/86400000));
}
// Πόσο "παλιά" ήταν μια τελευταία υπενθύμιση, για το μικρό "υπενθ. πριν Χ" δίπλα στα κουμπιά
// υπενθύμισης — βλ. c.lastReminderSent (js/app-part5-home.js, sendFeedbackReminder).
function fmtRelativeSince(iso){
  if(!iso) return null;
  var ms=Date.now()-new Date(iso).getTime();
  if(isNaN(ms) || ms<0) return null;
  var mins=Math.floor(ms/60000);
  if(mins<60) return mins<=1?'μόλις τώρα':('πριν '+mins+' λεπτά');
  var hrs=Math.floor(mins/60);
  if(hrs<24) return 'πριν '+hrs+(hrs===1?' ώρα':' ώρες');
  var days=Math.floor(hrs/24);
  return 'πριν '+days+(days===1?' μέρα':' μέρες');
}
function reminderMetaHtml(c){
  var rel=fmtRelativeSince(c.lastReminderSent);
  return rel?('<span class="meta">υπενθ. '+rel+'</span>'):'';
}
function buildApptAttentionDigestHtml(c){
  var items=[];
  // 2026-08-14: πελάτης με λιγότερες από 14 ημέρες ζωής — τα σήματα "χωρίς πλάνο / χωρίς feedback
  // / χωρίς check-in" είναι αναμενόμενη κατάσταση εκκίνησης, όχι πρόβλημα. Τα ΠΡΑΓΜΑΤΙΚΑ γεγονότα
  // (🚩 σημειωμένο ραντεβού, 💬 μήνυμα πελάτη, ⭐ χαμηλή βαθμολογία) ΔΕΝ κρύβονται ποτέ — αυτά
  // σημαίνουν ότι κάτι όντως συνέβη, ανεξάρτητα από την ηλικία του πελάτη.
  var ageDays=clientAgeDays(c);
  var isNewClient=(ageDays!=null && ageDays<14);
  var suppressedForNewClient=false;

  c.appointments.forEach(function(e,idx){
    if(e.flagged){
      items.push('<div class="appt-digest-item">🚩 Σημειωμένο ραντεβού ('+fmtDateShortAppt(e.date)+') περιμένει παρακολούθηση'
        +'<button type="button" class="go" onclick="resolveAppointmentFlag('+idx+')">✅ Διευθετήθηκε</button></div>');
    }
  });

  // 2026-08-14: το link σπάει σιωπηλά (πρώτα το ανακαλύπτει ο πελάτης, χτυπώντας "Το πλάνο δεν
  // βρέθηκε") — αυτό ΔΕΝ είναι μέρος του isStale() πιο κάτω (εκείνο βλέπει μόνο τοπικές αλλαγές μετά
  // τη δημοσίευση, όχι αν η γραμμή shared_plans χάθηκε). ΠΟΤΕ δεν κρύβεται στην περίοδο χάριτος —
  // ένα link που δεν λειτουργεί είναι πρόβλημα ανεξάρτητα από την ηλικία του πελάτη.
  var linkBroken=false;
  if(c.shareToken && window.Cloud && typeof window.Cloud.linkHealthFor==='function'){
    var lh=window.Cloud.linkHealthFor(c);
    if(lh.checked && lh.exists===false){
      linkBroken=true;
      items.push('<div class="appt-digest-item">🔗⚠️ Το link του πελάτη δεν βρέθηκε στο σύστημα — πιθανώς δεν λειτουργεί'
        +'<button type="button" class="go" onclick="apptDigestRepublishLink(\''+c.id+'\',this)">🔄 Δημοσίευσε ξανά</button></div>');
    } else if(lh.checked && lh.expired){
      linkBroken=true;
      items.push('<div class="appt-digest-item">🔗⏰ Το link του πελάτη έχει λήξει'
        +'<button type="button" class="go" onclick="apptDigestRepublishLink(\''+c.id+'\',this)">🔄 Δημοσίευσε ξανά</button></div>');
    }
  }

  if(window.Cloud && typeof window.Cloud.allClientLogsFor==='function'){
    var unanswered=window.Cloud.allClientLogsFor(c).filter(function(e){
      var t=(e.note||'').replace(/^\[tag:(travel|party|sick)\]\s*/,'').trim();
      if(!t)return false;
      return !isNoteReplied(c,e.date);
    }).slice(0,3);
    unanswered.forEach(function(e){
      var t=(e.note||'').replace(/^\[tag:(travel|party|sick)\]\s*/,'').trim();
      var noteJs=escJsAttr(t);
      items.push('<div class="appt-digest-item">💬 Μήνυμα πελάτη ('+fmtDateShortAppt(e.date)+') χωρίς απάντηση'
        +'<button type="button" class="go" onclick="replyToClientNote(\''+c.id+'\',\''+e.date+'\',\''+noteJs+'\')">↩️ Απάντησε</button></div>');
    });
  }

  if(window.Cloud && typeof window.Cloud.planFeedbackFor==='function'){
    var pfAll=window.Cloud.planFeedbackFor(c);
    var pfLatest=pfAll[0];
    if(pfLatest){
      Object.keys(PF_ROW_LABELS).forEach(function(key){
        var v=pfLatest[key];
        if(v!=null && v<=PF_ATTENTION_STAR_MAX){
          items.push('<div class="appt-digest-item">⭐ «'+esc(PF_ROW_LABELS[key])+'» βαθμολογήθηκε '+v+'/5 αυτή την εβδομάδα'
            +'<button type="button" class="go" onclick="replyToPlanFeedback(\''+c.id+'\',\''+pfLatest.week_start+'\',\''+key+'\')">↩️ Απάντησε</button></div>');
        }
      });
      if(pfLatest.continue_likelihood!=null && pfLatest.continue_likelihood<=PF_ATTENTION_NPS_MAX){
        items.push('<div class="appt-digest-item">📉 Χαμηλή πιθανότητα συνέχισης ('+pfLatest.continue_likelihood+'/10) αυτή την εβδομάδα'
          +'<button type="button" class="go" onclick="replyToPlanFeedback(\''+c.id+'\',\''+pfLatest.week_start+'\',null)">↩️ Απάντησε</button></div>');
      }
    } else if(c.shareToken){
      // Idea 4 (2026-08-14): ξεχωριστό από "χαμηλή βαθμολογία" — αυτός ο πελάτης έχει portal link
      // αλλά δεν έχει υποβάλει ΠΟΤΕ feedback πλάνου, άρα δεν υπάρχει καν pfLatest να ελεγχθεί.
      if(!isNewClient){
        items.push('<div class="appt-digest-item">🆕 Δεν έχει βαθμολογήσει ποτέ το πλάνο'+reminderMetaHtml(c)
          +'<button type="button" class="go" onclick="sendFeedbackReminder(\''+c.id+'\')">📲 Στείλε το link</button></div>');
      } else { suppressedForNewClient=true; }
    }
  }

  if(typeof dietsHasPlan==='function' && !dietsHasPlan(c)){
    if(!isNewClient){
      items.push('<div class="appt-digest-item">📋 Χωρίς ενεργό πλάνο<button type="button" class="go" onclick="swTab(2)">Άνοιξε Πλάνο</button></div>');
    } else { suppressedForNewClient=true; }
  }

  if(!linkBroken && window.Cloud && window.Cloud.isStale && window.Cloud.isStale(c)){
    if(!isNewClient){
      items.push('<div class="appt-digest-item">🔗 Ο σύνδεσμος portal δείχνει παλιότερη έκδοση του πλάνου<button type="button" class="go" onclick="swTab(2)">Άνοιξε Πλάνο</button></div>');
    } else { suppressedForNewClient=true; }
  }

  if(typeof dietsNeedsRenewal==='function' && dietsNeedsRenewal(c)){
    if(!isNewClient){
      items.push('<div class="appt-digest-item">🔄 Το πλάνο χρειάζεται ανανέωση<button type="button" class="go" onclick="swTab(2)">Άνοιξε Πλάνο</button></div>');
    } else { suppressedForNewClient=true; }
  }

  if(c.shareToken && window.Cloud && window.Cloud.checkinsFor){
    var ckRows=window.Cloud.checkinsFor(c);
    if(ckRows.length){
      var ckGap=ckDaysSinceLast(ckRows);
      if(ckGap>=2){
        // ✅ Ring αντί για στατικό emoji — κανονικοποιημένη "φρεσκάδα" check-in (0 μέρες=100%,
        // 21+ μέρες=0%), ίδιο χρωματικό κώδικα με τα υπόλοιπα status rings του app (pctStatusColor).
        // Δεν είναι "% συμμόρφωσης" (δεν υπάρχει schedule data για κάτι τέτοιο) — καθαρά recency.
        var ckPct=Math.max(0,100-Math.round(ckGap/21*100));
        items.push('<div class="appt-digest-item">'+pctRing(ckPct,{size:22,thickness:3,color:pctStatusColor(ckPct),track:'var(--border-light)',label:false})+' '+ckGap+' μέρες χωρίς check-in στο portal'+reminderMetaHtml(c)
          +'<button type="button" class="go" onclick="sendFeedbackReminder(\''+c.id+'\')">📲 Υπενθύμιση</button></div>');
      }
    } else {
      // Idea 4: "ποτέ δεν έκανε check-in" είναι διαφορετικό μήνυμα από "είχε συνήθεια και σταμάτησε" —
      // το πρώτο σημαίνει ότι ο πελάτης δεν έχει καν δοκιμάσει το portal.
      if(!isNewClient){
        items.push('<div class="appt-digest-item">'+pctRing(0,{size:22,thickness:3,color:pctStatusColor(0),track:'var(--border-light)',label:false})+' Δεν έχει κάνει ποτέ check-in στο portal'+reminderMetaHtml(c)
          +'<button type="button" class="go" onclick="sendFeedbackReminder(\''+c.id+'\')">📲 Στείλε το link</button></div>');
      } else { suppressedForNewClient=true; }
    }
  }

  if(!items.length){
    if(isNewClient && suppressedForNewClient){
      return '<div class="tracker-section"><div class="tracker-head">⚠️ Χρειάζεται προσοχή</div><div class="appt-digest-list">'
        +'<div class="appt-digest-item soft">🌱 Νέος πελάτης ('+ageDays+' '+(ageDays===1?'ημέρα':'ημέρες')+') — τα σήματα προσοχής ενεργοποιούνται μετά τις πρώτες 14 ημέρες</div>'
        +'</div></div>';
    }
    return '';
  }
  return '<div class="tracker-section"><div class="tracker-head">⚠️ Χρειάζεται προσοχή <span style="font-weight:400;font-size:11px;color:#888">'+items.length+' στοιχεί'+(items.length===1?'ο':'α')+'</span></div><div class="appt-digest-list">'+items.join('')+'</div></div>';
}
function buildAppointmentsHtml(c){
  if(!c.appointments)c.appointments=[];
  if(!c.foodPrefs)c.foodPrefs=[];
  var today=new Date().toISOString().slice(0,10);

  // ✅ 2026-08-01: Το feedback του πελάτη (portal check-ins, δικές του σημειώσεις, ⭐ αξιολόγηση
  // πλάνου) μπήκε εδώ πάνω-πάνω αντί στην Ανθρωπομετρία — εδώ είναι το σημείο απόφασης "νέο πλάνο/
  // προσαρμογή/ίδιο", οπότε έχει νόημα να βλέπεις τι λέει ο πελάτης πριν αποφασίσεις. Κάθε πάνελ
  // επιστρέφει '' μόνο του όταν δεν υπάρχουν δεδομένα (χωρίς shareToken/χωρίς καταχωρήσεις).
  var portalFeedbackBody=buildClientProgressHtml(c)+clientLogsPanelHtml(c)+planFeedbackPanelHtml(c);
  // Το κουμπί ανανέωσης φαίνεται μόνο όταν ο πελάτης έχει portal link (αλλιώς δεν υπάρχει τίποτα να
  // ανανεωθεί) — ακόμα κι όταν δεν έχει στείλει τίποτα ακόμα, χρήσιμο να το δει η διαιτολόγος αμέσως.
  var portalFeedbackHtml=c.shareToken
    ?('<div style="display:flex;justify-content:flex-end;margin-bottom:6px">'
      +'<button type="button" class="btn" style="padding:4px 11px;font-size:11px;background:var(--card-bg);color:#025857;border:1px solid #cfe8e0" onclick="refreshClientPortalFeedback(this)">🔄 Ανανέωση</button>'
      +'</div>'+portalFeedbackBody)
    :portalFeedbackBody;

  // ── Summary strip (read-only, pulled from other tabs) ──
  var wl=c.weightLog||[];
  var lastW=wl.length?wl[wl.length-1]:null;
  var prevW=wl.length>1?wl[wl.length-2]:null;
  var wDeltaHtml='—';
  if(lastW&&prevW){
    var wd=+(lastW.weight-prevW.weight).toFixed(1);
    wDeltaHtml='<span style="color:'+(wd<0?'var(--good)':wd>0?'#c62828':'#888')+'">'+(wd>0?'↑':wd<0?'↓':'→')+' '+Math.abs(wd)+' kg από '+fmtDateShortAppt(prevW.date)+'</span>';
  }
  var hasActive=c.weekPlan&&Object.keys(c.weekPlan).length>0;
  var planDaysOld=c.planGeneratedAt?Math.floor((Date.now()-c.planGeneratedAt)/86400000):null;
  var daysLeft=daysUntilEvent(c.eventDate);
  var lastAppt=c.appointments.length?c.appointments[c.appointments.length-1]:null;
  var daysSinceAppt=lastAppt?Math.floor((Date.now()-new Date(lastAppt.date))/86400000):null;

  // ✨ Idea 2 (2026-08-14): "Τι άλλαξε από το προηγούμενο ραντεβού" — σύγκριση των 2 πιο πρόσφατων
  // ΠΡΑΓΜΑΤΙΚΩΝ καταχωρήσεων (αγνοεί 🚫/❌ απουσίες — δεν είναι πραγματικό ραντεβού) ώστε να φαίνεται
  // "πού είχαμε μείνει" πριν καν ανοίξεις τη φόρμα ή σκρολάρεις στο ιστορικό. Το βάρος επαναχρησιμοποιεί
  // το ήδη υπολογισμένο wDeltaHtml (τελευταίες 2 μετρήσεις weightLog) αντί να ψάχνει μέτρηση ακριβώς
  // στην ημερομηνία του ραντεβού — μικρή προσέγγιση, συνεπής με ό,τι ήδη δείχνει η κάρτα "Τελευταία
  // μέτρηση" λίγο πιο κάτω. Το kcal target συγκρίνει το kcalAtEntry (φωτογραφία τη στιγμή κάθε
  // ραντεβού), ΟΧΙ τον σημερινό στόχο — παλιές καταχωρήσεις χωρίς την τιμή απλώς λείπουν από τη σύγκριση.
  var apptDiffHtml='';
  var realAppts=c.appointments.filter(function(e){return !e.status;});
  if(realAppts.length>=2){
    var diffCur=realAppts[realAppts.length-1], diffPrev=realAppts[realAppts.length-2];
    var diffItems=[];
    if(lastW&&prevW)diffItems.push('<div class="appt-diffitem"><span class="lbl">Βάρος</span><span class="val">'+wDeltaHtml+'</span></div>');

    // Portal deltas: σκορ τήρησης / σερί / πυλώνες — σύγκριση της εβδομάδας του ΠΡΟΗΓΟΥΜΕΝΟΥ
    // ραντεβού με την τρέχουσα. Ίδια cached πηγή (window.Cloud.checkinsFor) με το "📲 Πρόοδος πελάτη".
    if(c.shareToken && window.Cloud && typeof window.Cloud.checkinsFor==='function'){
      var _ckRows=window.Cloud.checkinsFor(c);
      if(_ckRows.length){
        var _bd=ckRowsByDate(_ckRows);
        var _stNow=ckPillarStats(ckWeekDates(0).map(function(k){return _bd[k];}).filter(Boolean));
        var _stPrev=ckPillarStats(ckWeekKeysFor(diffPrev.date).map(function(k){return _bd[k];}).filter(Boolean));
        var _scNow=_stNow.anyData?ckOverallScore(_stNow):null;
        var _scPrev=_stPrev.anyData?ckOverallScore(_stPrev):null;
        if(_scNow!=null && _scPrev!=null){
          var _scCls=_scNow>_scPrev?'good':(_scNow<_scPrev?'bad':'');
          diffItems.push('<div class="appt-diffitem"><span class="lbl">Τήρηση portal</span><span class="val '+_scCls+'">'+_scPrev+'% → '+_scNow+'%</span></div>');
        }
        if(typeof homeRunEndingAt==='function'){
          var _rNow=ckStreak(_bd), _rPrev=homeRunEndingAt(_bd, diffPrev.date);
          if(_rNow!==_rPrev){
            diffItems.push('<div class="appt-diffitem"><span class="lbl">Σερί</span><span class="val '+(_rNow>_rPrev?'good':'bad')+'">'+_rPrev+' → '+_rNow+' μέρες</span></div>');
          }
        }
        var _pill=[];
        [['🍽','diet'],['💧','wat'],['💊','sup']].forEach(function(p){
          var dt=_stNow[p[1]+'Tot'], pt=_stPrev[p[1]+'Tot'];
          if(!dt && !pt) return;
          var nr=dt?_stNow[p[1]+'Done']/dt:0, pr=pt?_stPrev[p[1]+'Done']/pt:0;
          if(Math.abs(nr-pr)<0.14) return;
          _pill.push('<span'+(nr<pr?' style="color:#c62828"':'')+'>'+p[0]+' '+Math.round(pr*100)+'%→'+Math.round(nr*100)+'%</span>');
        });
        if(_pill.length) diffItems.push('<div class="appt-diffitem"><span class="lbl">Πυλώνες</span><span class="val">'+_pill.join(' · ')+'</span></div>');
      }
    }

    if(diffCur.gi>0&&diffPrev.gi>0){
      var diffGiCls=diffCur.gi<diffPrev.gi?'good':(diffCur.gi>diffPrev.gi?'bad':'');
      diffItems.push('<div class="appt-diffitem"><span class="lbl">Πεπτικά συμπτώματα</span><span class="val '+diffGiCls+'">'+diffPrev.gi+' → '+diffCur.gi+'</span></div>');
    }
    if(diffCur.compliance>0&&diffPrev.compliance>0){
      var diffCompCls=diffCur.compliance>diffPrev.compliance?'good':(diffCur.compliance<diffPrev.compliance?'bad':'');
      diffItems.push('<div class="appt-diffitem"><span class="lbl">Τήρηση προπόνησης</span><span class="val '+diffCompCls+'">'+diffPrev.compliance+' → '+diffCur.compliance+'</span></div>');
    }
    if(diffCur.kcalAtEntry>0&&diffPrev.kcalAtEntry>0){
      var diffKcalTxt=diffCur.kcalAtEntry===diffPrev.kcalAtEntry?(diffCur.kcalAtEntry+' kcal (ίδιο)'):(diffPrev.kcalAtEntry+' → '+diffCur.kcalAtEntry+' kcal');
      diffItems.push('<div class="appt-diffitem"><span class="lbl">Στόχος θερμίδων</span><span class="val">'+diffKcalTxt+'</span></div>');
    }
    var diffMeta=apptPlanActionMeta(diffCur.planAction);
    diffItems.push('<div class="appt-diffitem"><span class="lbl">Ενέργεια πλάνου</span><span class="val" style="color:'+(diffMeta?diffMeta.color:'#888')+'">'+(diffMeta?diffMeta.icon+' '+esc(diffMeta.label):'—')+'</span></div>');
    if(diffItems.length){
      apptDiffHtml='<div class="tracker-section"><div class="tracker-head">↔️ Από το προηγούμενο ραντεβού <span style="font-weight:400;font-size:11px;color:#888">'+fmtDateShortAppt(diffPrev.date)+' → '+fmtDateShortAppt(diffCur.date)+'</span></div><div class="appt-diffbox">'+diffItems.join('')+'</div></div>';
    }
  }

  // ── Κάρτα 1 extra: % λίπους/μέση από την ίδια τελευταία εγγραφή weightLog (ίδιο πεδίο με την
  // Ανθρωπομετρία — δεν είναι νέο δεδομένο, απλώς δεν φαινόταν εδώ πριν) ──
  var lastMeasureExtra='';
  if(lastW){
    var extraBits=[];
    if(lastW.bf>0)extraBits.push(lastW.bf+'% λίπος');
    if(lastW.waist>0)extraBits.push(lastW.waist+'cm μέση');
    if(extraBits.length)lastMeasureExtra='<div class="appt-sum-sub">'+extraBits.join(' · ')+'</div>';
  }

  // ── Νέα κάρτα "Στόχος βάρους": μόνο όταν είναι ορισμένος ο c.goalWeight (ίδιο πεδίο με το portal
  // του πελάτη) — δείχνει πόσα kg μένουν + προαιρετική μπάρα προόδου όταν έχουμε αφετηρία (1η μέτρηση). ──
  var goalCardHtml='';
  if(c.goalWeight>0&&lastW){
    var diffToGoal=+(lastW.weight-c.goalWeight).toFixed(1);
    var goalDone=Math.abs(diffToGoal)<0.05;
    var goalTxt=goalDone?'✅ Στόχος!':(Math.abs(diffToGoal)+' kg ακόμα ('+(diffToGoal>0?'απώλεια':'αύξηση')+')');
    var firstW=wl.length?wl[0]:null;
    var goalBarHtml='';
    if(firstW&&Math.abs(firstW.weight-c.goalWeight)>0.05){
      var goalPct=Math.max(0,Math.min(100,Math.round((firstW.weight-lastW.weight)/(firstW.weight-c.goalWeight)*100)));
      goalBarHtml='<div style="height:5px;border-radius:3px;background:#E2EEE5;overflow:hidden;margin-top:5px"><div style="height:100%;width:'+goalPct+'%;background:'+(goalDone?'var(--good)':'var(--teal)')+'"></div></div>';
    }
    goalCardHtml='<div class="appt-sum-card"><div class="appt-sum-lbl">🎯 Στόχος βάρους</div><div class="appt-sum-val">'+c.goalWeight+' kg</div><div class="appt-sum-sub">'+goalTxt+'</div>'+goalBarHtml+'</div>';
  }

  // ── Κάρτα 2 extra: τρέχων μέσος στόχος θερμίδων (apptCurrentKcalTarget — ίδιος υπολογισμός με
  // το avgTarget στην καρτέλα "Πλάνο") ──
  var kcalTargetNow=apptCurrentKcalTarget(c);
  var planSub=(planDaysOld!=null?planDaysOld+' ημέρες από δημιουργία':'—')+(kcalTargetNow?' · 🎯 '+kcalTargetNow+' kcal/ημ':'');

  // ── Κάρτα 4 extra: προβολή "με τον τρέχοντα ρυθμό βάρους, στόχος σε ~X μέρες" έναντι countdown
  // αγώνα/weigh-in — μόνο όταν υπάρχουν goalWeight + τουλάχιστον 2 μετρήσεις με αρκετή απόσταση
  // ημερών ώστε ο ρυθμός να έχει νόημα (≥3 μέρες). Ρυθμός = γραμμικός, από τις τελευταίες έως 4
  // μετρήσεις (χωρίς πλήρη regression — αρκετό για ένδειξη, όχι κλινική πρόβλεψη). ──
  var eventSub=(c.eventDate?fmtDateShortAppt(c.eventDate):'Δεν έχει οριστεί ημερομηνία');
  var projDanger=false;
  if(daysLeft!=null&&daysLeft>=0&&c.goalWeight>0&&wl.length>=2){
    var recentSpan=wl.slice(-4);
    var spanFirst=recentSpan[0],spanLast=recentSpan[recentSpan.length-1];
    var daysSpan=Math.round((new Date(spanLast.date)-new Date(spanFirst.date))/86400000);
    if(daysSpan>=3){
      var ratePerDay=(spanLast.weight-spanFirst.weight)/daysSpan; // αρνητικό = χάνει βάρος
      var toGoalNow=spanLast.weight-c.goalWeight;
      if(ratePerDay!==0&&(toGoalNow>0)===(ratePerDay<0)){
        var projDays=Math.round(toGoalNow/(-ratePerDay));
        eventSub+=' · με τον τρέχοντα ρυθμό: στόχος σε ~'+projDays+' μέρες';
        if(projDays>daysLeft)projDanger=true;
      }
    }
  }

  // ── Νέα κάρτα "Επόμενο ραντεβού": ένα απλό, χειροκίνητο πεδίο ημερομηνίας (c.nextAppointmentDate)
  // που ο διαιτολόγος ορίζει ο ίδιος στο τέλος κάθε συνεδρίας — συμπληρώνει το "Τελευταίο ραντεβού"
  // ώστε να φαίνεται ο πλήρης κύκλος (τι έγινε + τι είναι προγραμματισμένο) στο ίδιο strip. ──
  var nextApptDaysLeft=c.nextAppointmentDate?daysUntilEvent(c.nextAppointmentDate):null;
  var nextApptCardHtml='<div class="appt-sum-card'+(nextApptDaysLeft!=null&&nextApptDaysLeft<0?' appt-sum-danger':'')+'">'
    +'<div class="appt-sum-lbl">📅 Επόμενο ραντεβού</div>'
    +'<div class="appt-sum-val">'+(nextApptDaysLeft!=null?(nextApptDaysLeft>=0?nextApptDaysLeft+' μέρες':'πέρασε — προγραμμάτισε νέο'):'—')+'</div>'
    +'<div class="appt-sum-sub"><input type="date" value="'+(c.nextAppointmentDate||'')+'" onchange="setNextAppointmentDate(this.value)" style="font-size:10px;border:1px solid var(--border-light);border-radius:4px;padding:2px 4px;width:100%;box-sizing:border-box;font-family:inherit"></div>'
    +'</div>';

  // ✨ Idea 4 (2026-08-14): "Προσέλευση" — ποσοστό πραγματικών ραντεβού (όχι 🚫/❌) στις τελευταίες
  // 10 καταχωρήσεις (ή όλες, αν είναι λιγότερες από 10). Έγκαιρο σήμα αποδέσμευσης πριν φανεί στο
  // βάρος ή στο πλάνο — δεν αντικαθιστά το 🚩/😕 flag, είναι δικό του, ανεξάρτητο σήμα.
  var attendanceCardHtml='';
  if(c.appointments.length>0){
    var apptWindow=c.appointments.slice(-10);
    var apptMissed=apptWindow.filter(function(e){return e.status==='noshow'||e.status==='cancelled';}).length;
    var apptAttended=apptWindow.length-apptMissed;
    var apptPct=Math.round(apptAttended/apptWindow.length*100);
    attendanceCardHtml='<div class="appt-sum-card'+(apptPct<70?' appt-sum-danger':'')+'">'
      +'<div class="appt-sum-lbl">🗓 Προσέλευση</div>'
      +'<div class="appt-sum-val">'+apptPct+'%</div>'
      +'<div class="appt-sum-sub">'+apptAttended+'/'+apptWindow.length+' τελευταία ραντεβού'+(apptMissed?' · '+apptMissed+' απουσία/ακύρωση':'')+'</div>'
      +'</div>';
  }

  var strip='<div class="appt-summary-strip">'
    +'<div class="appt-sum-card"><div class="appt-sum-lbl">Τελευταία μέτρηση</div><div class="appt-sum-val">'+(lastW?lastW.weight+' kg':'—')+'</div><div class="appt-sum-sub">'+wDeltaHtml+'</div>'+lastMeasureExtra+'</div>'
    +goalCardHtml
    +'<div class="appt-sum-card"><div class="appt-sum-lbl">Κατάσταση πλάνου</div><div class="appt-sum-val">'+(hasActive?'Ενεργό':'Χωρίς πλάνο')+'</div><div class="appt-sum-sub">'+planSub+'</div></div>'
    +'<div class="appt-sum-card'+(daysSinceAppt!=null&&daysSinceAppt>30?' appt-sum-danger':'')+'"><div class="appt-sum-lbl">📅 Τελευταίο ραντεβού</div><div class="appt-sum-val">'+(daysSinceAppt!=null?daysSinceAppt+' μέρες πριν':'—')+'</div><div class="appt-sum-sub">'+(lastAppt?fmtDateShortAppt(lastAppt.date):'Καμία καταχώρηση ακόμα')+'</div></div>'
    +nextApptCardHtml
    +'<div class="appt-sum-card'+((daysLeft!=null&&daysLeft<=14)||projDanger?' appt-sum-danger':'')+'"><div class="appt-sum-lbl">🗓 Αγώνας/Weigh-in</div><div class="appt-sum-val">'+(daysLeft!=null?(daysLeft>=0?daysLeft+' μέρες':'πέρασε'):'—')+'</div><div class="appt-sum-sub">'+eventSub+'</div></div>'
    +attendanceCardHtml
    +'</div>';

  // ── Trend charts (from appointment entries logged over time + το official weightLog) ──
  // ✨ Idea 7 (2026-08-14): η τήρηση/GI/βάρος πλέον ένα συνδυασμένο γράφημα (apptCorrelationChart,
  // βλ. πιο πάνω) αντί για 3 ξεχωριστά sparklines — ίδιο gating με πριν (δουλεύει είτε υπάρχουν
  // appointments είτε μόνο weightLog, αφού ο άξονας είναι ένωση και των δύο).
  var corrChart=apptCorrelationChart(c.appointments,wl);
  var corrHtml=corrChart?('<div class="tracker-section" style="margin-bottom:14px"><div class="tracker-head">📈 Τήρηση, συμπτώματα &amp; βάρος</div>'+corrChart+'</div>'):'';
  var trendsCards=[];
  if(c.appointments.length>=2){
    // 🎯 Στόχος θερμίδων ανά ραντεβού — μόνο entries που έχουν kcalAtEntry (φωτογραφημένο τη στιγμή
    // της καταχώρησης, βλ. addAppointmentEntry). Παλιές καταχωρήσεις πριν από αυτό το feature δεν
    // έχουν την τιμή, οπότε απλώς λείπουν από το γράφημα αντί να δείχνουν λάθος αριθμό.
    var kcalPts=c.appointments.filter(function(e){return e.kcalAtEntry>0;});
    if(kcalPts.length>=2){
      var kcalVals=kcalPts.map(function(e){return e.kcalAtEntry;});
      var kmn=Math.min.apply(null,kcalVals),kmx=Math.max.apply(null,kcalVals);
      if(kmn===kmx){kmn-=100;kmx+=100;}
      trendsCards.push('<div style="flex:1;min-width:220px">'+apptSparkline(c.appointments,'kcalAtEntry','#e65100','Στόχος θερμίδων (kcal)',kmn,kmx)+'</div>');
    }
  }
  var trendsHtml=corrHtml+(trendsCards.length?('<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">'+trendsCards.join('')+'</div>'):'');

  // ── New appointment entry form ──
  var sportKey=c.sport;
  var sportChipsList=APPT_SPORT_CHIPS[sportKey]||[];
  var sportInfo=sportKey&&SPORT_PROFILES[sportKey]?SPORT_PROFILES[sportKey]:null;
  var formHtml='<div class="tracker-section">'
    +'<div class="tracker-head">📝 Νέο ραντεβού</div>'
    +'<div style="margin-bottom:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
    +'<input type="date" id="appt-date" value="'+today+'" class="tracker-inp">'
    +'<button type="button" class="btn" style="padding:4px 10px;font-size:10px;background:var(--card-bg);color:#c62828;border:1px solid #f1b4b3" title="Καταγραφή χωρίς να συμπληρωθεί όλη η φόρμα — μετράει σαν επαφή, όχι σαν πραγματικό ραντεβού" onclick="logAppointmentAbsence(\'noshow\')">🚫 Δεν ήρθε</button>'
    +'<button type="button" class="btn" style="padding:4px 10px;font-size:10px;background:var(--card-bg);color:#888;border:1px solid var(--border-light)" onclick="logAppointmentAbsence(\'cancelled\')">❌ Ακύρωσε</button>'
    +'</div>'
    +'<div style="font-size:10px;color:#888;font-weight:600;margin-bottom:4px">Ενέργεια για το πλάνο</div>'
    +'<div class="appt-plan-action-group" id="appt-plan-action">'+apptPlanActionBtns(null)+'</div>'
    +'<div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:8px">'
    +'<div><div style="font-size:10px;color:#888;font-weight:600;margin-bottom:4px">Πεπτικά συμπτώματα</div><div class="appt-scale" id="appt-gi-scale">'+apptScaleButtons('appt-gi')+'</div></div>'
    +'<div><div style="font-size:10px;color:#888;font-weight:600;margin-bottom:4px">Τήρηση προπόνησης</div><div class="appt-scale" id="appt-compliance-scale">'+apptScaleButtons('appt-compliance')+'</div></div>'
    +'</div>'
    +'<div class="appt-chips" id="appt-common-chips">'+APPT_COMMON_CHIPS.map(function(ch){return '<button type="button" class="appt-chip" data-chip="'+esc(ch)+'" onclick="toggleApptChip(this)">'+esc(ch)+'</button>';}).join('')+'</div>'
    +(sportChipsList.length?('<div style="font-size:10px;color:#888;font-weight:600;margin:8px 0 4px">Ειδικά για '+(sportInfo?sportInfo.icon+' '+esc(sportInfo.name):'άθλημα')+'</div><div class="appt-chips" id="appt-sport-chips">'+sportChipsList.map(function(ch){return '<button type="button" class="appt-chip" data-chip="'+esc(ch)+'" onclick="toggleApptChip(this)">'+esc(ch)+'</button>';}).join('')+'</div>'):'')
    +apptTemplateRowHtml('appt-notes')
    +'<textarea id="appt-notes" placeholder="Σημειώσεις ραντεβού..." class="tracker-textarea"></textarea>'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">'
    +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
    +'<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#c62828;cursor:pointer"><input type="checkbox" id="appt-flag" style="width:14px;height:14px">🚩 Σημείωσε για παρακολούθηση</label>'
    +'<button type="button" class="btn" style="padding:3px 10px;font-size:10px;background:var(--card-bg);color:#025857;border:1px solid #cfe8e0" onclick="apptSendNoteToPreferences(\'appt-notes\',this)" title="Στέλνει το επιλεγμένο κείμενο (ή όλη τη σημείωση, αν δεν έχεις επιλέξει κάτι) στις Προτιμήσεις του πελάτη, ώστε να ληφθεί υπόψη στο επόμενο πλάνο">➕ Στις Προτιμήσεις</button>'
    +'</div>'
    +'<button class="btn" style="padding:6px 14px;font-size:11px;background:#025857;color:#fff;border:none" onclick="addAppointmentEntry()">+ Καταχώρηση</button>'
    +'</div>'
    +'</div>';

  // ── Past entries (reverse-chronological) ──
  // ✨ Φίλτρο ιστορικού (idea 8, 2026-08-14): καθαρά front-end — κάθε κάρτα ήδη υπάρχει στο DOM με
  // ένα data-appt-tags, τα chips απλά κρύβουν/δείχνουν μέσω apptFilterHistory() χωρίς re-render,
  // save() ή άγγιγμα δεδομένων. Η κάρτα σε επεξεργασία (edit mode) μένει χωρίς tag ώστε να μη
  // κρύβεται ποτέ κατά λάθος ενώ την επεξεργάζεσαι.
  var apptFlagCount=0,apptPlanCount=0,apptAbsenceCount=0;
  c.appointments.forEach(function(e){
    if(e.status){apptAbsenceCount++;return;}
    if(e.flagged)apptFlagCount++;
    if(e.planAction==='new'||e.planAction==='adjust')apptPlanCount++;
  });
  var filterbarHtml=c.appointments.length>0?('<div class="appt-filterbar">'
    +'<span class="appt-fchip active" data-f="all" onclick="apptFilterHistory(\'all\',this)">Όλα ('+c.appointments.length+')</span>'
    +(apptFlagCount?'<span class="appt-fchip" data-f="flag" onclick="apptFilterHistory(\'flag\',this)">🚩 Επισημασμένα ('+apptFlagCount+')</span>':'')
    +(apptPlanCount?'<span class="appt-fchip" data-f="plan" onclick="apptFilterHistory(\'plan\',this)">🔧 Αλλαγή πλάνου ('+apptPlanCount+')</span>':'')
    +(apptAbsenceCount?'<span class="appt-fchip" data-f="absence" onclick="apptFilterHistory(\'absence\',this)">🚫 Απουσίες ('+apptAbsenceCount+')</span>':'')
    +'</div>'):'';
  var listHtml='';
  if(c.appointments.length>0){
    listHtml+='<div class="consult-log">';
    c.appointments.slice().reverse().forEach(function(e,ri){
      var i=c.appointments.length-1-ri;
      if(i===_apptEditIdx){
        var eChips=e.chips||[],eSportChips=e.sportChips||[];
        listHtml+='<div class="appt-entry appt-entry-editing">'
          +'<div style="margin-bottom:8px"><input type="date" id="appt-edit-date-'+i+'" value="'+e.date+'" class="tracker-inp"></div>'
          +'<div style="font-size:10px;color:#888;font-weight:600;margin-bottom:4px">Ενέργεια για το πλάνο</div>'
          +'<div class="appt-plan-action-group" id="appt-edit-plan-action-'+i+'">'+apptPlanActionBtns(e.planAction)+'</div>'
          +'<div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:8px">'
          +'<div><div style="font-size:10px;color:#888;font-weight:600;margin-bottom:4px">Πεπτικά συμπτώματα</div><div class="appt-scale" id="appt-edit-gi-scale-'+i+'" data-selected="'+(e.gi||0)+'">'+apptScaleButtons('appt-edit-gi-'+i,e.gi)+'</div></div>'
          +'<div><div style="font-size:10px;color:#888;font-weight:600;margin-bottom:4px">Τήρηση προπόνησης</div><div class="appt-scale" id="appt-edit-compliance-scale-'+i+'" data-selected="'+(e.compliance||0)+'">'+apptScaleButtons('appt-edit-compliance-'+i,e.compliance)+'</div></div>'
          +'</div>'
          +'<div class="appt-chips" id="appt-edit-common-chips-'+i+'">'+APPT_COMMON_CHIPS.map(function(ch){return '<button type="button" class="appt-chip'+(eChips.indexOf(ch)!==-1?' active':'')+'" data-chip="'+esc(ch)+'" onclick="toggleApptChip(this)">'+esc(ch)+'</button>';}).join('')+'</div>'
          +(sportChipsList.length?('<div class="appt-chips" id="appt-edit-sport-chips-'+i+'">'+sportChipsList.map(function(ch){return '<button type="button" class="appt-chip'+(eSportChips.indexOf(ch)!==-1?' active':'')+'" data-chip="'+esc(ch)+'" onclick="toggleApptChip(this)">'+esc(ch)+'</button>';}).join('')+'</div>'):'')
          +apptTemplateRowHtml('appt-edit-notes-'+i)
          +'<textarea id="appt-edit-notes-'+i+'" class="tracker-textarea">'+esc(e.notes||'')+'</textarea>'
          +'<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;flex-wrap:wrap;gap:8px">'
          +'<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
          +'<label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#c62828;cursor:pointer"><input type="checkbox" id="appt-edit-flag-'+i+'" style="width:14px;height:14px"'+(e.flagged?' checked':'')+'>🚩 Σημείωσε για παρακολούθηση</label>'
          +'<button type="button" class="btn" style="padding:3px 10px;font-size:10px;background:var(--card-bg);color:#025857;border:1px solid #cfe8e0" onclick="apptSendNoteToPreferences(\'appt-edit-notes-'+i+'\',this)" title="Στέλνει το επιλεγμένο κείμενο (ή όλη τη σημείωση) στις Προτιμήσεις του πελάτη">➕ Στις Προτιμήσεις</button>'
          +'</div>'
          +'<div style="display:flex;gap:6px">'
          +'<button class="btn" style="padding:6px 14px;font-size:11px;background:#888;color:#fff;border:none" onclick="cancelAppointmentEdit()">Άκυρο</button>'
          +'<button class="btn" style="padding:6px 14px;font-size:11px;background:#025857;color:#fff;border:none" onclick="saveAppointmentEdit('+i+')">Αποθήκευση</button>'
          +'</div>'
          +'</div>'
          +'</div>';
        return;
      }
      if(e.status){
        // 🚫/❌ Καταχώρηση απουσίας — δεν έχει plan action/GI/compliance/chips, οπότε ξεχωριστό
        // (πιο απλό) rendering αντί να "γεμίσουμε" τα κανονικά πεδία με κενές τιμές. Χωρίς κουμπί
        // επεξεργασίας — μόνο διαγραφή, μιας κι εδώ δεν υπάρχει φόρμα επεξεργασίας που να ταιριάζει.
        var am=APPT_ABSENCE_META[e.status]||{icon:'❓',label:e.status,color:'#888'};
        listHtml+='<div class="appt-entry appt-entry-absence" data-appt-tags="absence">'
          +'<div class="appt-entry-actions"><button class="met-del" onclick="removeAppointmentEntry('+i+')" title="Διαγραφή">&#10005;</button></div>'
          +'<div class="consult-date">'+e.date+'</div>'
          +'<div style="font-size:11px;font-weight:700;color:'+am.color+'">'+am.icon+' '+am.label+'</div>'
          +(e.notes?'<div class="consult-text">'+esc(e.notes)+'</div>':'')
          +'</div>';
        return;
      }
      var allChips=(e.chips||[]).concat(e.sportChips||[]);
      var entryTags=(e.flagged?'flag ':'')+((e.planAction==='new'||e.planAction==='adjust')?'plan':'');
      listHtml+='<div class="appt-entry'+(e.flagged?' appt-entry-flagged':'')+'" data-appt-tags="'+entryTags.trim()+'">'
        +'<div class="appt-entry-actions">'
        +(e.flagged?'<button class="appt-action-resolve" onclick="resolveAppointmentFlag('+i+')" title="Σήμανση ως διευθετημένο">✅</button>':'')
        +'<button class="met-del" onclick="editAppointmentEntry('+i+')" title="Επεξεργασία">✏️</button>'
        +'<button class="met-del" onclick="removeAppointmentEntry('+i+')" title="Διαγραφή">&#10005;</button>'
        +'</div>'
        +'<div class="consult-date">'+e.date+(e.flagged?' · 🚩':'')+'</div>'
        +apptPlanActionBadgeHtml(e.planAction)
        +(e.kcalAtEntry?'<div style="font-size:10px;color:#e65100;margin:2px 0">🎯 '+e.kcalAtEntry+' kcal στόχος εκείνη τη στιγμή</div>':'')
        +(allChips.length?'<div class="appt-chips" style="margin:4px 0">'+allChips.map(function(ch){return '<span class="appt-chip active" style="cursor:default">'+esc(ch)+'</span>';}).join('')+'</div>':'')
        +(e.notes?'<div class="consult-text">'+esc(e.notes)+'</div>':'')
        +'</div>';
    });
    listHtml+='</div>';
  } else {
    listHtml='<div class="tracker-empty">Δεν υπάρχουν καταχωρήσεις ραντεβού ακόμα. Πρόσθεσε την πρώτη!</div>';
  }

  // ── Ροή αποφάσεων: συνοπτική σειρά από badges (🆕/↔️/🔧/📏) σε χρονολογική σειρά, ώστε να φαίνεται
  // αμέσως ο ρυθμός αλλαγών πλάνου χωρίς να ανοίγεις κάθε entry ξεχωριστά. ──
  var timelineHtml='';
  if(c.appointments.length>=2){
    var timelineChips=c.appointments.map(function(e){
      if(e.status){
        var am=APPT_ABSENCE_META[e.status]||{icon:'❓',label:e.status,color:'#888'};
        return '<span title="'+e.date+' — '+esc(am.label)+'" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:'+am.color+'22;color:'+am.color+';font-size:12px">'+am.icon+'</span>';
      }
      var meta=apptPlanActionMeta(e.planAction);
      if(!meta)return '<span title="'+e.date+'" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#eee;color:var(--text-muted);font-size:10px">•</span>';
      return '<span title="'+e.date+' — '+esc(meta.label)+'" style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:'+meta.color+'22;color:'+meta.color+';font-size:12px">'+meta.icon+'</span>';
    }).join('<span style="color:var(--text-muted);font-size:10px">→</span>');
    timelineHtml='<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:10px;font-size:10px;color:#888">'
      +'<span style="margin-right:4px">Ροή αποφάσεων:</span>'+timelineChips+'</div>';
  }

  return '<div style="padding:16px 20px">'+buildApptAttentionDigestHtml(c)+portalFeedbackHtml+apptDiffHtml+strip+trendsHtml+apptFoodPrefsPanelHtml(c)+formHtml+'<div class="tracker-section"><div class="tracker-head">📋 Ιστορικό ραντεβού</div>'+timelineHtml+filterbarHtml+listHtml+'</div></div>';
}
// ✨ Idea 8 (2026-08-14): φιλτράρισμα ιστορικού ραντεβού — καθαρά front-end, καμία επανάκτηση
// δεδομένων. Οι κάρτες είναι ήδη στο DOM (buildAppointmentsHtml) με data-appt-tags· εδώ απλά
// κρύβουμε/δείχνουμε. Καμία κάρτα σε επεξεργασία (χωρίς data-appt-tags) δεν κρύβεται ποτέ.
function apptFilterHistory(f,btn){
  var bar=btn.parentElement;
  if(bar)Array.prototype.forEach.call(bar.querySelectorAll('.appt-fchip'),function(c){c.classList.remove('active');});
  btn.classList.add('active');
  var log=document.querySelector('.consult-log');
  if(!log)return;
  Array.prototype.forEach.call(log.querySelectorAll('.appt-entry'),function(row){
    var tags=(row.getAttribute('data-appt-tags')||'').split(' ');
    var show=(f==='all')||tags.indexOf(f)!==-1;
    row.classList.toggle('appt-entry-hidden',!show);
  });
}
// 🚫/❌ No-show / ακύρωση — καταγράφεται σαν ξεχωριστό, ελαφρύ appointment entry (μόνο date+status+
// notes, όχι όλη τη φόρμα) ώστε να μη χαθεί εντελώς η επαφή από το ιστορικό, αλλά να ΜΗΝ μπερδεύεται
// με πραγματικό ραντεβού στα sparklines GI/compliance/kcal (αυτά φιλτράρουν ήδη με e[key]>0, οπότε
// ένα entry χωρίς αυτά τα πεδία αγνοείται μόνο του — καμία επιπλέον λογική χρειάστηκε εκεί).
var APPT_ABSENCE_META={noshow:{icon:'🚫',label:'Δεν ήρθε',color:'#c62828'},cancelled:{icon:'❌',label:'Ακύρωσε',color:'#888'}};
function logAppointmentAbsence(status){
  var c=getC();if(!c)return;
  if(!c.appointments)c.appointments=[];
  var date=(document.getElementById('appt-date')||{}).value;
  if(!date)return;
  var notes=((document.getElementById('appt-notes')||{}).value||'').trim();
  c.appointments.push({date:date,status:status,notes:notes});
  c.appointments.sort(function(a,b){return a.date<b.date?-1:1;});
  save();
  var el=document.getElementById('s3b');if(el)el.innerHTML=buildAppointmentsHtml(c);
}
function addAppointmentEntry(){
  var c=getC();if(!c)return;
  if(!c.appointments)c.appointments=[];
  var date=(document.getElementById('appt-date')||{}).value;
  if(!date)return;
  var planActionWrap=document.getElementById('appt-plan-action');
  var planAction=planActionWrap?(planActionWrap.getAttribute('data-selected')||''):'';
  var giScale=document.getElementById('appt-gi-scale');
  var compScale=document.getElementById('appt-compliance-scale');
  var gi=giScale?(parseInt(giScale.getAttribute('data-selected'))||0):0;
  var compliance=compScale?(parseInt(compScale.getAttribute('data-selected'))||0):0;
  var notes=((document.getElementById('appt-notes')||{}).value||'').trim();
  var flagged=!!(document.getElementById('appt-flag')||{}).checked;
  var chips=[];
  var commonWrap=document.getElementById('appt-common-chips');
  if(commonWrap)Array.prototype.forEach.call(commonWrap.querySelectorAll('.appt-chip.active'),function(b){chips.push(b.getAttribute('data-chip'));});
  var sportChips=[];
  var sportWrap=document.getElementById('appt-sport-chips');
  if(sportWrap)Array.prototype.forEach.call(sportWrap.querySelectorAll('.appt-chip.active'),function(b){sportChips.push(b.getAttribute('data-chip'));});
  if(!notes&&!chips.length&&!sportChips.length&&!gi&&!compliance&&!planAction)return;
  // 🎯 "Φωτογραφία" του τρέχοντος μέσου στόχου θερμίδων τη στιγμή του ραντεβού — μόνιμο πλέον στην
  // καταχώρηση, ώστε το sparkline "Στόχος θερμίδων" να δείχνει πραγματικό ιστορικό αλλαγών.
  c.appointments.push({date:date,gi:gi,compliance:compliance,chips:chips,sportChips:sportChips,notes:notes,flagged:flagged,planAction:planAction,kcalAtEntry:apptCurrentKcalTarget(c)});
  c.appointments.sort(function(a,b){return a.date<b.date?-1:1;});
  save();
  var el=document.getElementById('s3b');if(el)el.innerHTML=buildAppointmentsHtml(c);
}
function removeAppointmentEntry(idx){
  var c=getC();if(!c||!c.appointments)return;
  c.appointments.splice(idx,1);
  save();
  var el=document.getElementById('s3b');if(el)el.innerHTML=buildAppointmentsHtml(c);
}
function editAppointmentEntry(idx){
  var c=getC();if(!c)return;
  _apptEditIdx=idx;
  var el=document.getElementById('s3b');if(el)el.innerHTML=buildAppointmentsHtml(c);
}
function cancelAppointmentEdit(){
  var c=getC();if(!c)return;
  _apptEditIdx=-1;
  var el=document.getElementById('s3b');if(el)el.innerHTML=buildAppointmentsHtml(c);
}
function saveAppointmentEdit(idx){
  var c=getC();if(!c||!c.appointments||!c.appointments[idx])return;
  var date=(document.getElementById('appt-edit-date-'+idx)||{}).value;
  if(!date)return;
  var planActionWrap=document.getElementById('appt-edit-plan-action-'+idx);
  var planAction=planActionWrap?(planActionWrap.getAttribute('data-selected')||''):'';
  var giScale=document.getElementById('appt-edit-gi-scale-'+idx);
  var compScale=document.getElementById('appt-edit-compliance-scale-'+idx);
  var gi=giScale?(parseInt(giScale.getAttribute('data-selected'))||0):0;
  var compliance=compScale?(parseInt(compScale.getAttribute('data-selected'))||0):0;
  var notes=((document.getElementById('appt-edit-notes-'+idx)||{}).value||'').trim();
  var flagged=!!(document.getElementById('appt-edit-flag-'+idx)||{}).checked;
  var chips=[];
  var commonWrap=document.getElementById('appt-edit-common-chips-'+idx);
  if(commonWrap)Array.prototype.forEach.call(commonWrap.querySelectorAll('.appt-chip.active'),function(b){chips.push(b.getAttribute('data-chip'));});
  var sportChips=[];
  var sportWrap=document.getElementById('appt-edit-sport-chips-'+idx);
  if(sportWrap)Array.prototype.forEach.call(sportWrap.querySelectorAll('.appt-chip.active'),function(b){sportChips.push(b.getAttribute('data-chip'));});
  // ⚠️ Κρατάμε το ΑΡΧΙΚΟ kcalAtEntry (τη στιγμή που πρωτο-καταχωρήθηκε) — αν το ξαναϋπολογίζαμε εδώ
  // στο επεξεργασία θα "ξανάγραφε" την ιστορία με τον ΣΗΜΕΡΙΝΟ στόχο, χαλώντας το ιστορικό sparkline.
  // Παλιές καταχωρήσεις χωρίς την τιμή (πριν από αυτό το feature) μένουν undefined, όχι fabricated.
  c.appointments[idx]={date:date,gi:gi,compliance:compliance,chips:chips,sportChips:sportChips,notes:notes,flagged:flagged,planAction:planAction,kcalAtEntry:c.appointments[idx].kcalAtEntry};
  c.appointments.sort(function(a,b){return a.date<b.date?-1:1;});
  _apptEditIdx=-1;
  save();
  var el=document.getElementById('s3b');if(el)el.innerHTML=buildAppointmentsHtml(c);
}
// 📅 Επόμενο προγραμματισμένο ραντεβού — μονή τιμή στον πελάτη (όχι entry στο appointments log,
// αφού δεν έχει ακόμα συμβεί). Καθαρίζεται χειροκίνητα αδειάζοντας το πεδίο ημερομηνίας.
function setNextAppointmentDate(val){
  var c=getC();if(!c)return;
  c.nextAppointmentDate=val||null;
  save();
  var el=document.getElementById('s3b');if(el)el.innerHTML=buildAppointmentsHtml(c);
}
function resolveAppointmentFlag(idx){
  var c=getC();if(!c||!c.appointments||!c.appointments[idx])return;
  c.appointments[idx].flagged=false;
  save();
  var el=document.getElementById('s3b');if(el)el.innerHTML=buildAppointmentsHtml(c);
}


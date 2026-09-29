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

// ── Body-composition insights (dietitian-only — NOT shown in the portal or the PDFs) ─────────
// Pure helpers behind the FFMI / target-weight tiles and the «Τι έχασε από τι» / «Ρυθμός» /
// «Πού χάνει λίπος» blocks in the tracker. Each returns null when the data can't support it,
// and the caller just omits that block.

// FFMI = LBM / height². Same thresholds as exportLipometriaPDF (exports.js) so the screen and
// the PDF never disagree. Minors: number only (adult norms don't apply), like BMI.
function trackerFfmi(lbm,heightCm,sex,isMinor){
  if(!(lbm>0)||!(heightCm>0))return null;
  var v=+(lbm/((heightCm/100)*(heightCm/100))).toFixed(1);
  if(isMinor)return {v:v,cat:'',col:'#555'};
  var fem=sex==='F',lo=fem?15:18,mid=fem?18:20,hi=fem?21:23;
  return {v:v,
    cat:v<lo?'χαμηλή μυϊκή μάζα':v<mid?'φυσιολογική':v<hi?'αυξημένη μυϊκή μάζα':'υψηλή μυϊκή μάζα',
    col:v<lo?'#1565C0':v<hi?'#2e7d32':'#f57c00'};
}

// Weight at which the client would sit at a given %BF, holding lean mass constant:
// LBM / (1 − target%). Targets = the dietitian's c.goalBF (if set) + the Gallagher healthy-range
// top / middle / bottom for the client's age, keeping only those below the current %BF.
function trackerTargetWeights(weight,bf,goalBF,sex,age){
  if(!(weight>0)||!(bf>0))return null;
  var lbm=weight*(1-bf/100),rows=[],seen={};
  function add(pct,lbl){
    pct=Math.round(pct);
    if(!(pct>0)||pct>=bf-0.5||seen[pct])return;
    seen[pct]=1;
    var w=+(lbm/(1-pct/100)).toFixed(1);
    rows.push({pct:pct,lbl:lbl,w:w,d:+(w-weight).toFixed(1)});
  }
  if(goalBF>0)add(goalBF,'στόχος πελάτη');
  var gv=bfHealthByAge(bf,sex,age);
  if(gv){
    add(gv.healthy[1],'πάνω όριο υγιούς');
    add((gv.healthy[0]+gv.healthy[1])/2,'μέση υγιούς');
    add(gv.healthy[0],'κάτω όριο υγιούς');
  }
  rows.sort(function(a,b){return b.pct-a.pct;});
  return {rows:rows,healthy:gv?gv.healthy:null};
}

// Fat vs lean split of the weight change between two measurements that both have %BF.
function trackerLossSplit(first,last){
  if(!first||!last||!(first.bf>0)||!(last.bf>0)||first===last)return null;
  var f0=first.weight*first.bf/100,f1=last.weight*last.bf/100;
  var l0=first.weight-f0,l1=last.weight-f1;
  var dW=last.weight-first.weight,dF=f1-f0,dL=l1-l0;
  var r={f0:+f0.toFixed(1),f1:+f1.toFixed(1),l0:+l0.toFixed(1),l1:+l1.toFixed(1),
    dW:+dW.toFixed(1),dF:+dF.toFixed(1),dL:+dL.toFixed(1),kind:'stable',share:null};
  if(dW<=-0.5){ r.kind='loss'; r.share=dL>=0?100:Math.round(dF/dW*100); }
  else if(dW>=0.5){ r.kind='gain'; r.share=dF<=0?100:Math.round(dL/dW*100); }
  return r;
}

// Weekly weight trend: least-squares slope over the last ~8 weeks (falls back to all entries
// if that window has < 2 points). Needs ≥ 14 days of span. ETA to c.goalWeight when the trend
// is heading toward it.
function trackerWeightRate(sorted,goalWeight){
  if(!sorted||sorted.length<2)return null;
  var DAY=86400000,last=sorted[sorted.length-1],tLast=new Date(last.date).getTime();
  var win=sorted.filter(function(e){return tLast-new Date(e.date).getTime()<=56*DAY;});
  if(win.length<2)win=sorted;
  var t0=new Date(win[0].date).getTime(),span=(tLast-t0)/DAY;
  if(span<14)return null;
  var xs=win.map(function(e){return (new Date(e.date).getTime()-t0)/DAY;}),ys=win.map(function(e){return e.weight;});
  var n=xs.length,mx=xs.reduce(function(s,v){return s+v;},0)/n,my=ys.reduce(function(s,v){return s+v;},0)/n,num=0,den=0;
  for(var i=0;i<n;i++){num+=(xs[i]-mx)*(ys[i]-my);den+=(xs[i]-mx)*(xs[i]-mx);}
  if(!den)return null;
  var kgWk=num/den*7,pctWk=kgWk/last.weight*100;
  var r={kgWk:+kgWk.toFixed(2),pctWk:+pctWk.toFixed(2),weeksUsed:Math.round(span/7),n:n,eta:null,etaWeeks:null,goal:null,status:''};
  var a=Math.abs(pctWk);
  r.status=Math.abs(kgWk)<0.1?'stable':(kgWk<0?(a>1?'fast-loss':'loss'):(a>0.5?'fast-gain':'gain'));
  if(goalWeight>0){
    r.goal=goalWeight;
    var toGo=goalWeight-last.weight;
    if(Math.abs(toGo)<0.3)r.status2='reached';
    else if(Math.abs(kgWk)>=0.05&&(toGo<0)===(kgWk<0)){
      var wks=toGo/kgWk;
      if(wks<=104){ r.etaWeeks=Math.round(wks); r.eta=new Date(tLast+wks*7*DAY).toISOString().slice(0,10); }
      else r.status2='too-slow';
    } else r.status2='away';
  }
  return r;
}

// Regional skinfold change between the first and last measurements that have skinfold mm.
// Only sites measured in BOTH are compared (JP4 vs JP7 use different sites).
var TRACKER_SF_TRUNK=['abdomen','suprailiac','subscapular','chest','midaxillary'];
var TRACKER_SF_LIMB=['tricep','thigh','calf'];
var TRACKER_SF_LBL={abdomen:'Κοιλιά',suprailiac:'Υπερλαγόνιο',subscapular:'Υποπλάτιο',chest:'Στήθος',midaxillary:'Μεσομάσχαλο',tricep:'Τρικέφαλος',thigh:'Μηρός',calf:'Γάμπα'};
function trackerRegionalSf(sorted){
  var sf=(sorted||[]).filter(function(e){return e.sfFields&&Object.keys(e.sfFields).some(function(k){return e.sfFields[k]>0;});});
  if(sf.length<2)return null;
  var a=sf[0].sfFields,b=sf[sf.length-1].sfFields;
  var keys=Object.keys(TRACKER_SF_LBL).filter(function(k){return a[k]>0&&b[k]>0;});
  if(!keys.length)return null;
  function grp(list){
    var ks=keys.filter(function(k){return list.indexOf(k)>=0;});
    if(!ks.length)return null;
    var s0=ks.reduce(function(s,k){return s+a[k];},0),s1=ks.reduce(function(s,k){return s+b[k];},0);
    return {s0:+s0.toFixed(1),s1:+s1.toFixed(1),pct:Math.round((s1-s0)/s0*100)};
  }
  return {from:sf[0].date,to:sf[sf.length-1].date,trunk:grp(TRACKER_SF_TRUNK),limb:grp(TRACKER_SF_LIMB),total:grp(keys),
    sites:keys.map(function(k){return {k:k,lbl:TRACKER_SF_LBL[k],a:a[k],b:b[k]};})};
}

function _fmtDateGr(iso){ var p=String(iso||'').split('-'); return p.length===3?(+p[2])+'/'+(+p[1])+'/'+p[0]:iso; }
function _sgn(v){ return (v>0?'+':'')+v; }

// «Τι έχασε από τι» + «Ρυθμός & πρόβλεψη» + «Πού χάνει λίπος», rendered inside the Σύνοψη
// προόδου card. `sorted` = weightLog sorted by date ascending.
function trackerInsightsHtml(c,sorted){
  var box='background:var(--card-bg);border:1px solid var(--border-light);border-radius:7px;padding:10px 12px;min-width:0';
  var head=function(t,sub){return '<div style="font-size:11px;font-weight:700;color:#025857;margin-bottom:6px">'+t+(sub?' <span style="font-weight:400;color:#9fb5b0">'+sub+'</span>':'')+'</div>';};
  var out=[];

  // B1 — fat vs lean share of the change, first → last measurement that both have %BF
  var bfE=sorted.filter(function(e){return e.bf>0;});
  var sp=bfE.length>=2?trackerLossSplit(bfE[0],bfE[bfE.length-1]):null;
  if(sp){
    var mx=Math.max(sp.f0+sp.l0,sp.f1+sp.l1);
    var bar=function(lbl,l,f){return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="width:38px;font-size:10px;color:#666">'+lbl+'</span>'
      +'<div style="flex:1;display:flex;height:16px;gap:1px"><div style="width:'+(l/mx*100)+'%;background:#1565C0;border-radius:3px 0 0 3px;color:#fff;font-size:8.5px;font-weight:700;display:flex;align-items:center;padding-left:4px;white-space:nowrap;overflow:hidden">'+l+'</div>'
      +'<div style="width:'+(f/mx*100)+'%;background:#ff9999;border-radius:0 3px 3px 0;color:#fff;font-size:8.5px;font-weight:700;display:flex;align-items:center;padding-left:3px;white-space:nowrap;overflow:hidden">'+f+'</div></div></div>';};
    var msg,msgCol='#025857';
    if(sp.kind==='loss'){
      if(sp.dL>=0){ msg='Όλη η απώλεια ήταν λίπος'+(sp.dL>0?' — και η άλιπη μάζα αυξήθηκε':'')+'.'; msgCol='var(--good)'; }
      else if(sp.share>=75){ msg='<b>'+sp.share+'%</b> της απώλειας ήταν λίπος — πολύ καλή ποιότητα απώλειας.'; msgCol='var(--good)'; }
      else if(sp.share>=60){ msg='<b>'+sp.share+'%</b> της απώλειας ήταν λίπος.'; }
      else { msg='⚠️ Μόνο <b>'+Math.max(sp.share,0)+'%</b> της απώλειας ήταν λίπος — χάνεται άλιπη μάζα. Έλεγξε πρωτεΐνη, προπόνηση δύναμης, ρυθμό απώλειας.'; msgCol='#e65100'; }
    } else if(sp.kind==='gain'){
      if(sp.dF<=0){ msg='Όλο το κέρδος ήταν άλιπη μάζα'+(sp.dF<0?' — και το λίπος μειώθηκε':'')+'.'; msgCol='var(--good)'; }
      else { msg='<b>'+Math.max(sp.share,0)+'%</b> του κέρδους ήταν άλιπη μάζα, '+(100-Math.max(sp.share,0))+'% λίπος.'; if(sp.share<50)msgCol='#e65100'; }
    } else {
      msg=(sp.dF<0&&sp.dL>0)?'Ανασύνθεση: σταθερό βάρος, λιγότερο λίπος και περισσότερη άλιπη μάζα.':'Το βάρος έμεινε σχεδόν σταθερό.';
      if(sp.dF<0&&sp.dL>0)msgCol='var(--good)';
    }
    out.push('<div style="'+box+'">'+head('⚖️ Τι '+({gain:'πήρε',loss:'έχασε'}[sp.kind]||'άλλαξε')+' από τι',_fmtDateGr(bfE[0].date)+' → '+_fmtDateGr(bfE[bfE.length-1].date))
      +bar('Πριν',sp.l0,sp.f0)+bar('Τώρα',sp.l1,sp.f1)
      +'<div style="display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;margin:4px 0 6px"><span>Βάρος <b>'+_sgn(sp.dW)+' kg</b></span><span style="color:#d9534f">Λίπος <b>'+_sgn(sp.dF)+' kg</b></span><span style="color:#1565C0">Άλιπη <b>'+_sgn(sp.dL)+' kg</b></span></div>'
      +'<div style="font-size:11px;color:'+msgCol+';line-height:1.4">'+msg+'</div></div>');
  }

  // B3 — weekly rate + ETA to the weight goal
  var goalW=c.goalWeight||c.targetWeight||null;
  var rt=trackerWeightRate(sorted,goalW);
  if(rt){
    var stMap={'stable':['σταθερό','#888'],'loss':['ασφαλής ρυθμός','var(--good)'],'fast-loss':['γρήγορος ρυθμός (>1%/εβδ)','#e65100'],'gain':['αύξηση','#1565C0'],'fast-gain':['γρήγορη αύξηση','#e65100']};
    var st=stMap[rt.status];
    var eta='';
    if(rt.goal){
      if(rt.status2==='reached')eta='🎯 Ο στόχος των <b>'+rt.goal+' kg</b> έχει επιτευχθεί.';
      else if(rt.eta)eta='Με αυτόν τον ρυθμό, ο στόχος των <b>'+rt.goal+' kg</b> πιάνεται γύρω στις <b>'+_fmtDateGr(rt.eta)+'</b> (~'+rt.etaWeeks+' εβδ.).';
      else if(rt.status2==='too-slow')eta='Με αυτόν τον ρυθμό ο στόχος των '+rt.goal+' kg θέλει πάνω από 2 χρόνια.';
      else eta='Η τάση δεν κινείται προς τον στόχο των '+rt.goal+' kg.';
    } else eta='<span style="color:#9fb5b0">Όρισε στόχο βάρους για να δεις πρόβλεψη ημερομηνίας.</span>';
    out.push('<div style="'+box+'">'+head('📉 Ρυθμός & πρόβλεψη','τελευταίες ~'+rt.weeksUsed+' εβδ. · '+rt.n+' μετρήσεις')
      +'<div style="display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px"><span style="font-size:18px;font-weight:800;color:#025857">'+_sgn(rt.kgWk)+' kg/εβδ</span>'
      +'<span style="font-size:11px">'+_sgn(rt.pctWk)+'% βάρους/εβδ</span>'
      +'<span style="font-size:10px;font-weight:700;color:'+st[1]+'">'+st[0]+'</span></div>'
      +'<div style="font-size:11px;margin-top:6px;line-height:1.4">'+eta+'</div></div>');
  }

  // B4 — regional skinfold change (trunk vs limbs)
  var rg=trackerRegionalSf(sorted);
  if(rg){
    var groups=[['Κορμός',rg.trunk],['Άκρα',rg.limb],['Σύνολο',rg.total]].filter(function(g){return g[1];});
    var mxp=Math.max(10,Math.max.apply(null,groups.map(function(g){return Math.abs(g[1].pct);})));
    out.push('<div style="'+box+'">'+head('📐 Πού χάνει λίπος',_fmtDateGr(rg.from)+' → '+_fmtDateGr(rg.to))
      +groups.map(function(g){var p=g[1].pct,col=p<=0?(g[0]==='Σύνολο'?'#78909c':'#00897b'):'#f57c00';
        return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px" title="'+g[1].s0+' → '+g[1].s1+' mm"><span style="width:48px;font-size:10px;color:#666">'+g[0]+'</span>'
          +'<div style="flex:1;height:14px"><div style="width:'+(Math.abs(p)/mxp*100)+'%;min-width:2px;height:100%;background:'+col+';border-radius:3px"></div></div>'
          +'<span style="width:44px;text-align:right;font-size:11px;font-weight:700;color:'+col+'">'+_sgn(p)+'%</span></div>';}).join('')
      +'<div style="font-size:9.5px;color:#888;margin-top:4px;line-height:1.5">'+rg.sites.map(function(s){return s.lbl+' '+s.a+'→'+s.b;}).join(' · ')+' mm</div></div>');
  }

  if(!out.length)return '';
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-top:12px">'+out.join('')+'</div>';
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
    +'<button class="btn" style="padding:4px 11px;font-size:11px;background:#025857;color:#fff;border:none" title="Κλινικό PDF στιγμιότυπου — για φάκελο/γιατρό/εκτύπωση. Για τον πελάτη χρησιμοποίησε τα κουμπιά WhatsApp/Email δεξιά (ζωντανό link)." onclick="exportLipometriaPDF()">🖨️ Έντυπο Λιπομέτρησης</button>'
    // ── αποστολή του εντύπου λιπομέτρησης στον πελάτη (WhatsApp / Email) ────────
    // πάντα ορατά (το έντυπο βγαίνει και χωρίς εγγραφές tracker), απενεργοποιημένα
    // μόνο όταν λείπει τηλέφωνο / email από την καρτέλα.
    +(c.phone?'<button class="btn" style="padding:4px 11px;font-size:11px;background:#25D366;color:#fff;border:none" title="Δημοσίευση ζωντανού συνδέσμου μετρήσεων (metriseis.html) + WhatsApp με έτοιμο μήνυμα — ενημερώνεται μόνος του σε κάθε νέα μέτρηση, χωρίς re-send" onclick="sendLipometriaReport(\'wa\')">📱 WhatsApp</button>':'<button class="btn" disabled style="padding:4px 11px;font-size:11px;background:#ddd;color:var(--text-muted);border:none;cursor:not-allowed" title="Λείπει τηλέφωνο από την καρτέλα του πελάτη — συμπλήρωσέ το στην καρτέλα «Στοιχεία»">📱 WhatsApp</button>')
    +(c.email?'<button class="btn" style="padding:4px 11px;font-size:11px;background:#025857;color:#fff;border:none" title="Δημοσίευση ζωντανού συνδέσμου μετρήσεων (metriseis.html) + Email με έτοιμο μήνυμα — ενημερώνεται μόνος του σε κάθε νέα μέτρηση, χωρίς re-send" onclick="sendLipometriaReport(\'mail\')">📧 Email</button>':'<button class="btn" disabled style="padding:4px 11px;font-size:11px;background:#ddd;color:var(--text-muted);border:none;cursor:not-allowed" title="Λείπει email από την καρτέλα του πελάτη — συμπλήρωσέ το στην καρτέλα «Στοιχεία»">📧 Email</button>')
    +(c.weightLog&&c.weightLog.length?'<button class="btn" style="padding:4px 11px;font-size:11px;background:#025857;color:#fff;border:none" title="Αποθήκευση/εκτύπωση του ιστορικού μετρήσεων" onclick="exportBodyCompPDF()">📊 Ιστορικό PDF</button>':'')
    +'</div>'
    +'</div>'
    // ✅ persistent (non-hover) caption for the CSV button — the old title-only tooltip explaining
    // single-file-vs-batch import was invisible until someone hovered over it
    +'<div style="font-size:10px;color:var(--text-muted);margin:-4px 0 8px">📤 CSV: 1 αρχείο = άμεσος έλεγχος στοιχείων &nbsp;·&nbsp; πολλά αρχεία μαζί = μαζική εισαγωγή ιστορικού</div>'
    // ✅ βάση σύγκρισης για όλα τα Δ / τάσεις / ρυθμό στο Έντυπο Λιπομέτρησης — ο διαιτολόγος το
    // επιλέγει πριν πατήσει «Έντυπο / WhatsApp / Email». Μόνο με ≥2 μετρήσεις έχει νόημα.
    +((c.weightLog&&c.weightLog.length>1)?'<div style="font-size:10px;color:var(--text-muted);margin:-2px 0 8px">📅 Σύγκριση εντύπου λιπομέτρησης με: <select id="lipo-baseline" class="tracker-inp" style="font-size:10px;width:auto;padding:1px 4px"><option value="first">1η μέτρηση</option><option value="prev">προηγούμενη μέτρηση</option>'+(c.planGeneratedAt?'<option value="plan">έναρξη τρέχοντος πλάνου</option>':'')+'</select></div>':'')
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
    var ageC=c.birthDate?ageAtDate(c.birthDate):c.age;
    var ffmiC=trackerFfmi(latestLBM,c.height,c.sex||'M',isMinorC);
    // adult targets only — Gallagher ranges / a %BF goal don't apply to a growing child
    var tgtC=isMinorC?null:trackerTargetWeights(latest.weight,latest.bf,c.goalBF,c.sex||'M',ageC);
    var tgtHtml='';
    if(tgtC){
      tgtHtml='<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #00897b;grid-column:1/-1" title="Άλιπη μάζα / (1 − %BF στόχου), με σταθερή άλιπη μάζα — μόνο για τον διαιτολόγο">'
        +'<div style="color:#666">🎯 Βάρος-στόχος για %BF <span style="color:#9fb5b0">(ίδια άλιπη μάζα)</span></div>'
        +(tgtC.rows.length
          ?tgtC.rows.map(function(r){return '<div style="display:flex;gap:8px;align-items:baseline;margin-top:3px;max-width:420px"><span style="min-width:34px;font-weight:700;color:#00695c">'+r.pct+'%</span><span style="font-size:13px;font-weight:700;color:#025857">'+r.w+' kg</span><span style="color:#888">('+(r.d>0?'+':'')+r.d+')</span><span style="color:#9fb5b0;margin-left:auto">'+r.lbl+'</span></div>';}).join('')
          :'<div style="font-size:11px;color:var(--good);margin-top:3px">Ήδη στο κάτω όριο του υγιούς εύρους'+(tgtC.healthy?' ('+tgtC.healthy[0]+'–'+tgtC.healthy[1]+'%)':'')+' — δεν χρειάζεται μείωση λίπους.</div>')
        +'</div>';
    }

    wHtml+='<div style="background:#fff8e1;border:1px solid #ffb74d;border-radius:8px;padding:12px;margin-bottom:10px">'
      +'<div style="font-size:10px;color:#e65100;font-weight:700;margin-bottom:8px">📊 Τρέχουσα Κατάσταση ('+latest.date+')</div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;font-size:10px">'
      +'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #2e7d32">'
      +'<div style="color:#666">Βάρος</div><div style="font-size:14px;font-weight:700;color:#025857">'+latest.weight+' kg</div></div>'
      +(latest.bf?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #ff9999"><div style="color:#666">Λίπος</div><div style="font-size:14px;font-weight:700;color:#c62828">'+latest.bf+'%</div>'+(latestFM!=null?'<div style="font-size:11px;font-weight:600;color:#d9534f" title="Λιπώδης μάζα = βάρος × %BF">'+latestFM.toFixed(1)+' kg</div>':'')+'</div>':'')
      +(latestLBM?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #1565C0"><div style="color:#666">Lean Mass</div><div style="font-size:14px;font-weight:700;color:#1565C0">'+latestLBM+' kg</div></div>':'')
      +(latestBMI!=null?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid '+latestBMIColor+'">'
      +'<div style="color:#666">BMI</div><div style="font-size:14px;font-weight:700;color:'+latestBMIColor+'">'+latestBMI+(latestBMIStatus?' ('+latestBMIStatus+')':'')+'</div></div>'
      // ✅ BMI used to just silently disappear with no height set — nothing told the practitioner
      // why the card was missing, or what to do about it
      :'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #ccc"><div style="color:#666">BMI</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Χρειάζεται ύψος — συμπλήρωσέ το στα Στοιχεία πελάτη</div></div>')
      +(latest.waist?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #9c27b0"><div style="color:#666">Μέση</div><div style="font-size:14px;font-weight:700;color:#9c27b0">'+latest.waist+' cm</div></div>':'')
      +(latest.hip?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid #f57c00"><div style="color:#666">Γοφοί</div><div style="font-size:14px;font-weight:700;color:#f57c00">'+latest.hip+' cm</div></div>':'')
      +(ffmiC?'<div style="background:var(--card-bg);padding:8px;border-radius:5px;border-left:3px solid '+ffmiC.col+'" title="FFMI = άλιπη μάζα / ύψος² — δείχνει αν το ΔΜΣ οφείλεται σε μυ ή σε λίπος">'
        +'<div style="color:#666">FFMI</div><div style="font-size:14px;font-weight:700;color:'+ffmiC.col+'">'+ffmiC.v+(ffmiC.cat?' <span style="font-size:10px;font-weight:600">('+ffmiC.cat+')</span>':'')+'</div></div>':'')
      +tgtHtml
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
        +trackerInsightsHtml(c,sorted2)
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
        +'<td>'+(e.bf?e.bf+'%'+(lbm!=='—'?' <span style="color:#888;font-size:0.92em" title="Λιπώδης μάζα = βάρος × %BF">('+(e.weight-lbm).toFixed(1)+' kg)</span>':'')+sfBadge+methBadge:'—')+'</td>'
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
    // dashed line from the last measurement to the projected goal date (see trackerWeightRate)
    var wLabels=dates.slice(),wData=weights.slice(),projSets=[];
    var rtP=trackerWeightRate(sorted,c.goalWeight||c.targetWeight||null);
    if(rtP&&rtP.eta){
      wLabels.push('~'+rtP.eta.substring(5)); wData.push(null);
      var proj=weights.map(function(){return null;}); proj[proj.length-1]=weights[weights.length-1]; proj.push(rtP.goal);
      projSets.push({label:'Πρόβλεψη',data:proj,borderColor:'#025857',borderDash:[6,4],borderWidth:2,fill:false,pointRadius:proj.map(function(v,i){return i===proj.length-1?5:0;}),pointBackgroundColor:'#fff',pointBorderColor:'#2e7d32',pointBorderWidth:2,spanGaps:true,tension:0});
    }
    new Chart(wCtx, {
      type: 'line',
      data: {
        labels: wLabels,
        datasets: [{
          label: 'Βάρος (kg)',
          data: wData,
          borderColor: '#025857',
          backgroundColor: 'rgba(2,88,87,0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#025857'
        }].concat(projSets)
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


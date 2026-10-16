// js/client-editor/tracker-results.js
// Client-facing results dashboard of the Ανθρωπομετρία sub-tab (s3). buildTrackerHtml()
// (tracker.js) calls trackerResultsHtml() in place of the old «Τρέχουσα Κατάσταση» card.
// Everything here follows ONE comparison base (_trackerCmp: previous visit or 1st measurement):
// KPI tiles + sparklines, «Με απλά λόγια» summary, goal bar, age-adjusted %BF zone bar,
// milestones, fat/lean per visit, circumference figure, skinfold map, before/after card
// (+ PNG for WhatsApp). _trackerPresent = «Λειτουργία παρουσίασης»: buildTrackerHtml hides
// the entry form, private notes and the consultation log while it's on.
// Nothing runs at parse time except the two state vars + constant tables.

var _trackerPresent=false;
var _trackerCmp='prev';

function _trRerender(){
  var c=getC();if(!c)return;
  var el=document.getElementById('s3');if(el)el.innerHTML=buildTrackerHtml(c);
}
function toggleTrackerPresent(){ _trackerPresent=!_trackerPresent; _trRerender(); }
function setTrackerCmp(v){ _trackerCmp=(v==='first')?'first':'prev'; _trRerender(); }

function trSorted(c){
  return (c.weightLog||[]).slice().sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:0;});
}
// How %BF was measured. Skinfold entries carry sfProtocol; old entries may have neither → ''.
function trMethod(e){ return e?(e.sfProtocol?'caliper':(e.bfMethod||'')):''; }
// Two %BF values are only comparable when measured the same way. Unknown on either side →
// we can't tell, so we don't flag (old data has no bfMethod at all).
function trMethodMismatch(a,b){ var ma=trMethod(a),mb=trMethod(b); return !!(ma&&mb&&ma!==mb); }
var TR_METHOD_LBL={caliper:'δερματοπτυχόμετρο',bia:'BIA',dexa:'DEXA',estimate:'εκτίμηση'};

// Which direction is "good" for body weight: from c.goal, else from goalWeight vs start.
function trWeightDir(c,sorted){
  if(c.goal==='gain')return 'higher';
  if(c.goal==='maintain')return null;
  var g=c.goalWeight||c.targetWeight;
  if(g>0&&sorted.length&&g>sorted[0].weight+0.5)return 'higher';
  return 'lower';
}

// noise = change below which the difference is within measurement error (grey chip, and the
// summary text says «σταθερό»): caliper %BF ≈ ±1, scale ≈ ±0.3 kg, tape ≈ ±1 cm.
function trMetrics(c,sorted){
  var wd=trWeightDir(c,sorted);
  return [
    {k:'weight',lbl:'Βάρος',u:' kg',dec:1,dir:wd,noise:0.3,get:function(e){return e.weight>0?e.weight:null;}},
    {k:'bf',lbl:'Λίπος',u:'%',dec:1,dir:'lower',noise:1,bf:true,get:function(e){return e.bf>0?e.bf:null;}},
    {k:'fm',lbl:'Λιπώδης μάζα',u:' kg',dec:1,dir:'lower',noise:0.8,bf:true,get:function(e){return e.bf>0?e.weight*e.bf/100:null;}},
    {k:'lm',lbl:'Άλιπη μάζα',u:' kg',dec:1,dir:'higher',noise:0.8,bf:true,get:function(e){return e.bf>0?e.weight*(1-e.bf/100):null;}},
    {k:'waist',lbl:'Μέση',u:' cm',dec:1,dir:wd==='higher'?null:'lower',noise:1,get:function(e){return e.waist>0?e.waist:null;}},
    {k:'hip',lbl:'Γοφοί',u:' cm',dec:1,dir:wd==='higher'?null:'lower',noise:1,get:function(e){return e.hip>0?e.hip:null;}},
    {k:'arm',lbl:'Δικέφαλος',u:' cm',dec:1,dir:null,noise:0.5,get:function(e){return e.arm>0?e.arm:null;}}
  ];
}

// Latest value of a metric + the value it's compared with (previous visit that HAS the metric,
// or the first one that has it) + the whole series for the sparkline.
function trPair(sorted,get,cmp,bfMetric){
  var idx=[];
  sorted.forEach(function(e,i){if(get(e)!=null)idx.push(i);});
  if(!idx.length)return null;
  var li=idx[idx.length-1],bi=idx.length>1?(cmp==='first'?idx[0]:idx[idx.length-2]):null;
  // sparkline: for %BF-derived metrics drop points measured with another method than the latest
  // (one BIA reading among caliper ones would draw a fake spike)
  var sIdx=bfMetric?idx.filter(function(i){return !trMethodMismatch(sorted[i],sorted[li]);}):idx;
  return {L:sorted[li],B:bi!=null?sorted[bi]:null,lv:get(sorted[li]),bv:bi!=null?get(sorted[bi]):null,
    series:sIdx.map(function(i){return get(sorted[i]);})};
}

function _trFmtD(d,dec){ return (d>0?'+':d<0?'−':'±')+Math.abs(d).toFixed(dec); }
var TR_CHIP={good:['#e8f5e9','#2e7d32'],bad:['#fdecea','#c62828'],neu:['#eef2f7','#456'],noise:['#f1f1f1','#777']};
function _trChip(kind,txt,title){
  var k=TR_CHIP[kind];
  return '<span style="display:inline-block;font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:9px;background:'+k[0]+';color:'+k[1]+';white-space:nowrap"'+(title?' title="'+esc(title)+'"':'')+'>'+txt+'</span>';
}
// Delta chip for a metric pair. Grey when within measurement noise or when %BF methods differ.
function trDeltaChip(m,p){
  if(!p||p.bv==null)return '';
  if(m.bf&&trMethodMismatch(p.L,p.B))return _trChip('noise','≠ μέθοδος','Μετρήθηκε με διαφορετική μέθοδο από τη μέτρηση σύγκρισης — η διαφορά δεν είναι αξιόπιστη');
  var d=+(p.lv-p.bv).toFixed(m.dec),txt=_trFmtD(d,m.dec)+m.u;
  if(Math.abs(d)<m.noise)return _trChip('noise',Math.abs(d)<0.05?'σταθερό':txt,'Μέσα στο περιθώριο σφάλματος της μέτρησης');
  var good=m.dir==='lower'?d<0:m.dir==='higher'?d>0:null;
  return _trChip(good===null?'neu':good?'good':'bad',txt);
}
// Small coloured "+0.4" after a value in the history table (vs the previous visit by date).
function trTableDelta(e,prev,m){
  if(!prev)return '';
  var a=m.get(e),b=m.get(prev);
  if(a==null||b==null)return '';
  if(m.bf&&trMethodMismatch(e,prev))return ' <span style="font-size:9px;color:#b26a00" title="Διαφορετική μέθοδος από την προηγούμενη μέτρηση">≠</span>';
  var d=+(a-b).toFixed(1);
  var good=m.dir==='lower'?d<0:m.dir==='higher'?d>0:null;
  var col=Math.abs(d)<m.noise?'#999':good===null?'#456':good?'#2e7d32':'#c62828';
  return ' <span style="font-size:9.5px;font-weight:700;color:'+col+'">'+_trFmtD(d,1)+'</span>';
}

function trSparkSvg(series){
  if(!series||series.length<2)return '';
  var mn=Math.min.apply(null,series),mx=Math.max.apply(null,series),rng=mx-mn||1,n=series.length;
  var pts=series.map(function(v,i){return [+(3+i*(94/(n-1))).toFixed(1),+(21-(v-mn)/rng*17).toFixed(1)];});
  var last=pts[pts.length-1];
  return '<svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true" style="display:block;margin-top:4px">'
    +'<polyline points="'+pts.map(function(p){return p.join(',');}).join(' ')+'" fill="none" stroke="#025857" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>'
    +'<circle cx="'+last[0]+'" cy="'+last[1]+'" r="2.6" fill="#025857"/></svg>';
}

var _TR_BOX='background:var(--card-bg);border:1px solid var(--border-light);border-radius:9px;padding:10px 12px;min-width:0';
function _trHead(t,sub){ return '<div style="font-size:11px;font-weight:700;color:#025857;margin-bottom:8px">'+t+(sub?' <span style="font-weight:400;color:#9fb5b0">'+sub+'</span>':'')+'</div>'; }

// ── 8. «Με απλά λόγια» ──────────────────────────────────────────────────────────────
function trStoryHtml(c,sorted,cmp){
  if(sorted.length<2)return '';
  var L=sorted[sorted.length-1],B=cmp==='first'?sorted[0]:sorted[sorted.length-2];
  var parts=[],good=0,bad=0;
  var dW=+(L.weight-B.weight).toFixed(1),wd=trWeightDir(c,sorted);
  if(Math.abs(dW)<0.3)parts.push('το βάρος σου έμεινε σταθερό');
  else{ parts.push((dW<0?'έχασες ':'πήρες ')+'<b>'+Math.abs(dW)+' kg</b>'); if(wd)((wd==='lower')===(dW<0)?good++:bad++); }
  var s1='Από '+(cmp==='first'?'την 1η μέτρηση':'την προηγούμενη μέτρηση')+' ('+_fmtDateGr(B.date)+') '+parts.join('')+'.';
  var s2='';
  if(L.bf>0&&B.bf>0){
    if(trMethodMismatch(L,B)){
      s2='Το λίπος αυτή τη φορά μετρήθηκε με '+(TR_METHOD_LBL[trMethod(L)]||'άλλη μέθοδο')+' αντί για '+(TR_METHOD_LBL[trMethod(B)]||'την προηγούμενη')+', οπότε δεν το συγκρίνουμε — οι δύο μέθοδοι δίνουν διαφορετικά νούμερα.';
    } else if(Math.abs(L.bf-B.bf)<1){
      s2='Η σύσταση του σώματός σου (λίπος/μυϊκή μάζα) έμεινε ίδια — η διαφορά είναι μέσα στο περιθώριο σφάλματος της μέτρησης.';
    } else {
      var dF=+(L.weight*L.bf/100-B.weight*B.bf/100).toFixed(1),dL=+((L.weight-L.weight*L.bf/100)-(B.weight-B.weight*B.bf/100)).toFixed(1);
      var f=dF<0?'έχασες <b>'+Math.abs(dF)+' kg λίπος</b>':'το λίπος αυξήθηκε <b>'+dF+' kg</b>';
      var l=Math.abs(dL)<0.5?'η μυϊκή σου μάζα έμεινε σταθερή':dL>0?'κέρδισες <b>'+dL+' kg άλιπη (μυϊκή) μάζα</b>':'η άλιπη μάζα μειώθηκε '+Math.abs(dL)+' kg';
      s2='Σε αυτό το διάστημα '+f+' και '+l+'.';
      dF<0?good++:bad++;
      if(dL<=-0.5)bad++; else if(dL>=0.5)good++;
    }
  }
  var s3='';
  if(L.waist>0&&B.waist>0&&Math.abs(L.waist-B.waist)>=1){
    var dWa=+(L.waist-B.waist).toFixed(1);
    s3='Η μέση σου '+(dWa<0?'μίκρυνε':'μεγάλωσε')+' <b>'+Math.abs(dWa)+' cm</b>.';
    if(wd!=='higher')(dWa<0?good++:bad++);
  }
  var pos=good>0&&bad===0;
  var bg=pos?'#e8f5e9':'#f0f9f8',bd=pos?'#a5d6a7':'#c5ddd8',col=pos?'#1b5e20':'#025857';
  return '<div style="background:'+bg+';border:1px solid '+bd+';border-radius:9px;padding:10px 14px;margin-bottom:10px">'
    +'<div style="font-size:11px;font-weight:700;color:'+col+';margin-bottom:4px">💬 Με απλά λόγια</div>'
    +'<div style="font-size:13px;line-height:1.55;color:'+col+'">'+s1+(s2?' '+s2:'')+(s3?' '+s3:'')+'</div></div>';
}

// ── 4. KPI tiles with delta chip + sparkline ─────────────────────────────────────────
function trTilesHtml(c,sorted,cmp,isMinor){
  var ms=trMetrics(c,sorted),out=[];
  var BORDER={weight:'#2e7d32',bf:'#ff9999',fm:'#d9534f',lm:'#1565C0',waist:'#9c27b0',hip:'#f57c00',arm:'#00897b'};
  ms.forEach(function(m){
    var p=trPair(sorted,m.get,cmp,m.bf);if(!p)return;
    out.push('<div style="background:var(--card-bg);padding:8px 10px;border-radius:7px;border-left:3px solid '+BORDER[m.k]+';min-width:0">'
      +'<div style="font-size:10px;color:#666">'+m.lbl+'</div>'
      +'<div style="font-size:16px;font-weight:700;color:#025857;margin:1px 0 3px">'+(+p.lv.toFixed(m.dec))+m.u+'</div>'
      +trDeltaChip(m,p)+trSparkSvg(p.series)+'</div>');
  });
  var L=sorted[sorted.length-1];
  if(c.height>0){
    var bmi=+(L.weight/((c.height/100)*(c.height/100))).toFixed(1);
    var cat=isMinor?'':bmi<18.5?'λιποβαρές':bmi<25?'φυσιολογικό':bmi<30?'υπέρβαρο':'παχυσαρκία';
    var bcol=isMinor?'#999':bmi<18.5?'#ff6b35':bmi<25?'#2e7d32':bmi<30?'#ff9800':'#c62828';
    out.push('<div style="background:var(--card-bg);padding:8px 10px;border-radius:7px;border-left:3px solid '+bcol+'"><div style="font-size:10px;color:#666">BMI</div><div style="font-size:16px;font-weight:700;color:'+bcol+'">'+bmi+'</div>'+(cat?'<div style="font-size:10px;color:'+bcol+'">'+cat+'</div>':'')+'</div>');
  }
  else out.push('<div style="background:var(--card-bg);padding:8px 10px;border-radius:7px;border-left:3px solid #ccc"><div style="font-size:10px;color:#666">BMI</div><div style="font-size:10px;color:var(--text-muted);margin-top:2px">Χρειάζεται ύψος — συμπλήρωσέ το στα Στοιχεία πελάτη</div></div>');
  var lmP=trPair(sorted,function(e){return e.bf>0?e.weight*(1-e.bf/100):null;},cmp);
  var ff=lmP?trackerFfmi(+lmP.lv.toFixed(1),c.height,c.sex||'M',isMinor):null;
  if(ff)out.push('<div style="background:var(--card-bg);padding:8px 10px;border-radius:7px;border-left:3px solid '+ff.col+'" title="FFMI = άλιπη μάζα / ύψος²"><div style="font-size:10px;color:#666">FFMI</div><div style="font-size:16px;font-weight:700;color:'+ff.col+'">'+ff.v+'</div>'+(ff.cat?'<div style="font-size:10px;color:'+ff.col+'">'+ff.cat+'</div>':'')+'</div>');
  return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:8px;margin-bottom:10px">'+out.join('')+'</div>';
}

// ── 5. Goal bar ───────────────────────────────────────────────────────────────────────
function trGoalBarHtml(c,sorted){
  var g=c.goalWeight||c.targetWeight;
  if(!(g>0)||!sorted.length)return '';
  var s=sorted[0].weight,n=sorted[sorted.length-1].weight;
  if(Math.abs(s-g)<0.3)return '';
  var pct=Math.max(0,Math.min(100,Math.round((s-n)/(s-g)*100)));
  var rt=trackerWeightRate(sorted,g),eta='';
  if(Math.abs(n-g)<0.3)eta='🎯 Ο στόχος επιτεύχθηκε!';
  else if(rt&&rt.eta)eta='Με τον τωρινό ρυθμό ('+_sgn(rt.kgWk)+' kg/εβδ.) ο στόχος πιάνεται γύρω στις <b>'+_fmtDateGr(rt.eta)+'</b>.';
  else eta='Απομένουν <b>'+Math.abs(+(g-n).toFixed(1))+' kg</b> ως τον στόχο.';
  return '<div style="'+_TR_BOX+'">'+_trHead('🎯 Πορεία προς τον στόχο')
    +'<div style="height:14px;background:#e8eeed;border-radius:7px;overflow:hidden"><div style="width:'+pct+'%;height:100%;background:#2e7d32;border-radius:7px"></div></div>'
    +'<div style="display:flex;justify-content:space-between;gap:6px;font-size:10.5px;color:#666;margin-top:5px"><span>Αρχή '+s+' kg</span><span style="color:#025857;font-weight:700">Τώρα '+n+' kg · '+pct+'%</span><span>Στόχος '+g+' kg</span></div>'
    +'<div style="font-size:11px;margin-top:6px;line-height:1.4;color:#444">'+eta+'</div></div>';
}

// ── 10. Age-adjusted %BF zone bar (replaces the two-needle gauge) ─────────────────────
function trZoneBarHtml(c,sorted,cmp,isMinor,age){
  var bfP=trPair(sorted,function(e){return e.bf>0?e.bf:null;},cmp);
  if(!bfP||isMinor)return '';
  var sex=c.sex||'M',gv=bfHealthByAge(bfP.lv,sex,age);
  if(!gv)return '<div style="min-width:0">'+bfGaugeHtml(bfP.lv,sex,isMinor,c.goalBF,age)+'</div>';
  var lo=Math.max(2,gv.healthy[0]-8),hi=gv.obeseLo+8;
  var X=function(v){return Math.max(0,Math.min(100,(v-lo)/(hi-lo)*100));};
  var segs=[[lo,gv.healthy[0],'#90caf9','κάτω από υγιές'],[gv.healthy[0],gv.healthy[1],'#a5d6a7','υγιές'],[gv.healthy[1],gv.obeseLo,'#ffcc80','αυξημένο'],[gv.obeseLo,hi,'#ef9a9a','υψηλό']];
  var bar=segs.map(function(s){return '<div style="position:absolute;top:18px;height:14px;left:'+X(s[0])+'%;width:'+(X(s[1])-X(s[0]))+'%;background:'+s[2]+'"></div>'
    +'<div style="position:absolute;top:36px;left:'+X(s[0])+'%;width:'+(X(s[1])-X(s[0]))+'%;text-align:center;font-size:9.5px;color:#666;white-space:nowrap;overflow:hidden">'+s[3]+'</div>';}).join('');
  var cur='<div style="position:absolute;top:12px;height:26px;width:3px;margin-left:-1px;background:#263238;left:'+X(bfP.lv)+'%"></div>'
    +'<div style="position:absolute;top:-2px;transform:translateX(-50%);left:'+X(bfP.lv)+'%;font-size:11px;font-weight:700;color:#263238;white-space:nowrap">εσύ '+(+bfP.lv.toFixed(1))+'%</div>';
  var base='';
  if(bfP.bv!=null&&!trMethodMismatch(bfP.L,bfP.B))base='<div title="'+(cmp==='first'?'1η μέτρηση':'Προηγούμενη')+': '+bfP.bv+'%" style="position:absolute;top:14px;height:22px;border-left:2px dashed #78909c;left:'+X(bfP.bv)+'%"></div>';
  var goal=c.goalBF>0?'<div title="Στόχος '+c.goalBF+'%" style="position:absolute;top:20px;width:10px;height:10px;margin-left:-5px;background:#025857;transform:rotate(45deg);border:1px solid #fff;left:'+X(c.goalBF)+'%"></div>':'';
  return '<div style="'+_TR_BOX+'">'+_trHead('📍 Λίπος σε σχέση με '+(sex==='F'?'γυναίκες':'άνδρες')+' '+gv.ageBand+' ετών')
    +'<div style="position:relative;height:52px;margin:0 4px">'+bar+base+goal+cur+'</div>'
    +'<div style="font-size:10px;color:var(--text-muted);margin-top:2px;line-height:1.5">Υγιές εύρος '+gv.healthy[0]+'–'+gv.healthy[1]+'%'
    +(base?' · διακεκομμένη = '+(cmp==='first'?'1η μέτρηση':'προηγούμενη')+' ('+bfP.bv+'%)':'')+(goal?' · ◆ στόχος '+c.goalBF+'%':'')
    +' · Gallagher 2000, όχι διάγνωση</div></div>';
}

// ── 11. Milestones ────────────────────────────────────────────────────────────────────
function trMilestones(c,sorted,age,isMinor){
  if(!sorted.length)return [];
  var F=sorted[0],L=sorted[sorted.length-1],out=[],next=null,wd=trWeightDir(c,sorted);
  var dW=+(L.weight-F.weight).toFixed(1);
  if(wd==='lower'&&!isMinor){
    var steps=[2,3,5,8,10,15,20,25,30],got=null;
    steps.forEach(function(s){ if(-dW>=s)got=s; else if(!next&&-dW>0)next={ic:'🔒',t:'−'+s+' kg (λείπουν '+(+(s+dW).toFixed(1))+')'}; });
    if(got)out.push({ic:'🏆',t:'−'+got+' kg από την αρχή'});
  }
  var bfE=sorted.filter(function(e){return e.bf>0;});
  if(bfE.length>=2&&!trMethodMismatch(bfE[0],bfE[bfE.length-1])){
    var a=bfE[0],b=bfE[bfE.length-1],dF=b.weight*b.bf/100-a.weight*a.bf/100,dL=(b.weight-b.weight*b.bf/100)-(a.weight-a.weight*a.bf/100);
    [10,5,3,2].some(function(s){ if(-dF>=s){out.push({ic:'🔥',t:'−'+s+' kg λίπος'});return true;} return false; });
    if(wd==='higher')[3,2,1].some(function(s){ if(dL>=s){out.push({ic:'💪',t:'+'+s+' kg άλιπη μάζα'});return true;} return false; });
    if(!isMinor){
      var g0=bfHealthByAge(a.bf,c.sex||'M',age),g1=bfHealthByAge(b.bf,c.sex||'M',age);
      if(g0&&g1&&a.bf>g0.healthy[1]&&b.bf<=g1.healthy[1])out.push({ic:'💚',t:'Μπήκες στο υγιές εύρος λίπους'});
    }
  }
  // IDF waist thresholds (abdominal-obesity risk): men 94 cm, women 80 cm
  var wF=sorted.filter(function(e){return e.waist>0;});
  if(wF.length>=2&&!isMinor){
    var thr=(c.sex==='F')?80:94,w0=wF[0].waist,w1=wF[wF.length-1].waist;
    if(w0>=thr&&w1<thr)out.push({ic:'📏',t:'Μέση κάτω από '+thr+' cm'});
    else if(w0-w1>=5)out.push({ic:'📏',t:'−'+Math.floor(w0-w1)+' cm μέση'});
  }
  var g=c.goalWeight||c.targetWeight;
  if(g>0&&Math.abs(F.weight-g)>=0.3){
    var pct=(F.weight-L.weight)/(F.weight-g)*100;
    if(pct>=100)out.push({ic:'🎯',t:'Στόχος βάρους!'}); else if(pct>=50)out.push({ic:'⛰️',t:'Μισή διαδρομή ως τον στόχο'});
  }
  [20,10,5].some(function(s){ if(sorted.length>=s){out.push({ic:'📅',t:s+' μετρήσεις — συνέπεια!'});return true;} return false; });
  if(next)out.push({ic:next.ic,t:next.t,locked:true});
  return out;
}
function trMilestonesHtml(c,sorted,age,isMinor){
  var ms=trMilestones(c,sorted,age,isMinor);
  if(!ms.filter(function(m){return !m.locked;}).length)return '';
  return '<div style="'+_TR_BOX+';margin-bottom:10px">'+_trHead('🏅 Ορόσημα')
    +'<div style="display:flex;flex-wrap:wrap;gap:6px">'+ms.map(function(m){
      return '<span style="font-size:11.5px;padding:4px 10px;border-radius:14px;'+(m.locked?'background:#f1f1f1;color:#888;border:1px dashed #ccc':'background:#e8f5e9;color:#1b5e20;border:1px solid #a5d6a7;font-weight:700')+'">'+m.ic+' '+m.t+'</span>';
    }).join('')+'</div></div>';
}

// ── 6. Fat vs lean per visit ──────────────────────────────────────────────────────────
function trFatLeanHtml(sorted){
  var bfE=sorted.filter(function(e){return e.bf>0;}).slice(-8);
  if(bfE.length<2)return '';
  var mx=Math.max.apply(null,bfE.map(function(e){return e.weight;}));
  return '<div style="'+_TR_BOX+'">'+_trHead('📊 Λίπος & άλιπη μάζα ανά επίσκεψη')
    +bfE.map(function(e,i){
      var fm=+(e.weight*e.bf/100).toFixed(1),lm=+(e.weight-fm).toFixed(1),mm=i>0&&trMethodMismatch(e,bfE[i-1]);
      return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><span style="width:62px;font-size:10px;color:#666;white-space:nowrap">'+_fmtDateGr(e.date).replace(/\/\d{4}$/,'')+(mm?' <span title="Άλλη μέθοδος μέτρησης" style="color:#b26a00">≠</span>':'')+'</span>'
        +'<div style="flex:1;display:flex;gap:1px;height:15px"><div style="width:'+(lm/mx*100)+'%;background:#1565C0;border-radius:3px 0 0 3px;color:#fff;font-size:8.5px;font-weight:700;display:flex;align-items:center;padding-left:4px;overflow:hidden;white-space:nowrap">'+lm+'</div>'
        +'<div style="width:'+(fm/mx*100)+'%;background:#ff9999;border-radius:0 3px 3px 0"></div></div>'
        +'<span style="width:48px;text-align:right;font-size:10.5px;font-weight:700;color:#d9534f">'+fm+' kg</span></div>';
    }).join('')
    +'<div style="display:flex;gap:12px;font-size:10px;color:#666;margin-top:6px"><span><span style="display:inline-block;width:10px;height:10px;background:#1565C0;border-radius:2px;vertical-align:middle"></span> Άλιπη μάζα</span><span><span style="display:inline-block;width:10px;height:10px;background:#ff9999;border-radius:2px;vertical-align:middle"></span> Λίπος (kg δεξιά)</span></div></div>';
}

// Simple front-view figure shared by the circumference + skinfold infographics. `extra` = SVG
// markup drawn on top. viewBox 0 0 90 200.
function _trBodySvg(extra,title){
  var s='fill="none" stroke="#9fb5b0" stroke-width="1.5"';
  return '<svg viewBox="0 0 90 200" width="74" role="img" aria-label="'+esc(title)+'" style="flex:none">'
    +'<circle cx="45" cy="18" r="13" '+s+'/><rect x="24" y="34" width="42" height="70" rx="12" '+s+'/>'
    +'<rect x="8" y="38" width="12" height="58" rx="6" '+s+'/><rect x="70" y="38" width="12" height="58" rx="6" '+s+'/>'
    +'<rect x="26" y="106" width="16" height="84" rx="7" '+s+'/><rect x="48" y="106" width="16" height="84" rx="7" '+s+'/>'
    +extra+'</svg>';
}

// ── 7. Circumferences on the body ─────────────────────────────────────────────────────
function trCircHtml(c,sorted,cmp){
  var ms=trMetrics(c,sorted).filter(function(m){return m.k==='waist'||m.k==='hip'||m.k==='arm';});
  var rows=[],lines={waist:'<line x1="22" y1="80" x2="68" y2="80" stroke="#9c27b0" stroke-width="3"/>',hip:'<line x1="22" y1="100" x2="68" y2="100" stroke="#f57c00" stroke-width="3"/>',arm:'<line x1="68" y1="55" x2="84" y2="55" stroke="#00897b" stroke-width="3"/>'},svg='';
  ms.forEach(function(m){
    var p=trPair(sorted,m.get,cmp);if(!p)return;
    svg+=lines[m.k];
    rows.push('<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--border-light)"><span style="font-size:11px">'+m.lbl+' <b style="color:#025857">'+p.lv+' cm</b></span>'+trDeltaChip(m,p)+'</div>');
  });
  if(!rows.length)return '';
  var wP=trPair(sorted,function(e){return e.waist>0?e.waist:null;},cmp),whtr='';
  if(wP&&c.height>0){
    var r=+(wP.lv/c.height).toFixed(2);
    whtr='<div style="font-size:10.5px;margin-top:6px;color:'+(r<0.5?'#2e7d32':'#e65100')+'">Λόγος μέσης/ύψους <b>'+r+'</b> — '+(r<0.5?'κάτω από το όριο κινδύνου 0.5':'πάνω από το όριο κινδύνου 0.5')+'</div>';
  }
  return '<div style="'+_TR_BOX+'">'+_trHead('📏 Περιφέρειες')
    +'<div style="display:flex;gap:12px;align-items:center">'+_trBodySvg(svg,'Σημεία μέτρησης περιφερειών')+'<div style="flex:1;min-width:0">'+rows.join('')+whtr+'</div></div></div>';
}

// ── 14. Skinfold map ──────────────────────────────────────────────────────────────────
var TR_SF_POS={chest:[36,46],subscapular:[54,44],midaxillary:[62,62],tricep:[76,58],abdomen:[40,82],suprailiac:[58,94],thigh:[34,142],calf:[56,174]};
function trSkinfoldMapHtml(sorted,cmp){
  var sf=sorted.filter(function(e){return e.sfFields&&Object.keys(e.sfFields).some(function(k){return e.sfFields[k]>0;});});
  if(sf.length<2)return '';
  var L=sf[sf.length-1],B=cmp==='first'?sf[0]:sf[sf.length-2],a=B.sfFields,b=L.sfFields;
  var keys=Object.keys(TRACKER_SF_LBL).filter(function(k){return a[k]>0&&b[k]>0;});
  if(!keys.length)return '';
  var colOf=function(p){return p<=-15?'#00796b':p<=-5?'#4db6ac':p<5?'#b0bec5':'#f57c00';};
  var dots='',rows=[];
  keys.forEach(function(k){
    var p=Math.round((b[k]-a[k])/a[k]*100),pos=TR_SF_POS[k];
    if(pos)dots+='<circle cx="'+pos[0]+'" cy="'+pos[1]+'" r="6" fill="'+colOf(p)+'" stroke="#fff" stroke-width="1.5"><title>'+TRACKER_SF_LBL[k]+' '+_sgn(p)+'%</title></circle>';
    rows.push('<div style="display:flex;justify-content:space-between;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border-light);font-size:11px"><span><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+colOf(p)+';vertical-align:middle"></span> '+TRACKER_SF_LBL[k]+' <span style="color:#888">'+a[k]+'→'+b[k]+' mm</span></span>'
      +_trChip(p<=-5?'good':p<5?'noise':'bad',_sgn(p)+'%')+'</div>');
  });
  return '<div style="'+_TR_BOX+'">'+_trHead('📐 Από πού φεύγει το λίπος',_fmtDateGr(B.date)+' → '+_fmtDateGr(L.date))
    +'<div style="display:flex;gap:12px;align-items:center">'+_trBodySvg(dots,'Χάρτης δερματοπτυχών')+'<div style="flex:1;min-width:0">'+rows.join('')+'</div></div>'
    +'<div style="font-size:10px;color:var(--text-muted);margin-top:5px">Πιο σκούρο πράσινο = μεγαλύτερη μείωση· πορτοκαλί = αύξηση.</div></div>';
}

// ── 13. Before / now card (+ PNG for WhatsApp) ────────────────────────────────────────
function _trCardData(c,sorted,cmp){
  if(sorted.length<2)return null;
  var L=sorted[sorted.length-1],B=cmp==='first'?sorted[0]:sorted[sorted.length-2];
  var d={B:B,L:L,lines:[]},sameM=!trMethodMismatch(L,B);
  if(L.bf>0&&B.bf>0&&sameM&&Math.abs(L.bf-B.bf)>=1){
    var dF=+(L.weight*L.bf/100-B.weight*B.bf/100).toFixed(1),dL=+((L.weight*(1-L.bf/100))-(B.weight*(1-B.bf/100))).toFixed(1);
    d.lines.push(_trFmtD(dF,1)+' kg λίπος');
    d.lines.push(Math.abs(dL)<0.5?'μύες σταθεροί':_trFmtD(dL,1)+' kg άλιπη μάζα');
  }
  if(L.waist>0&&B.waist>0&&Math.abs(L.waist-B.waist)>=1)d.lines.push(_trFmtD(+(L.waist-B.waist).toFixed(1),1)+' cm μέση');
  d.showBf=L.bf>0&&B.bf>0&&sameM;
  return d;
}
var _TR_MONTHS=['Ιανουάριος','Φεβρουάριος','Μάρτιος','Απρίλιος','Μάιος','Ιούνιος','Ιούλιος','Αύγουστος','Σεπτέμβριος','Οκτώβριος','Νοέμβριος','Δεκέμβριος'];
function _trMonthLbl(iso){ var p=String(iso).split('-'); return p.length===3?_TR_MONTHS[(+p[1])-1]+' '+p[0]:iso; }
function trBeforeAfterHtml(c,sorted,cmp){
  var d=_trCardData(c,sorted,cmp);if(!d)return '';
  var col=function(e,lbl,hl){return '<div style="text-align:center;min-width:0"><div style="font-size:10px;color:#888">'+lbl+'</div><div style="font-size:22px;font-weight:800;color:'+(hl?'#2e7d32':'#025857')+'">'+e.weight+'<span style="font-size:12px"> kg</span></div>'+(d.showBf?'<div style="font-size:11px;color:'+(hl?'#2e7d32':'#666')+'">'+e.bf+'% λίπος</div>':'')+'</div>';};
  return '<div style="'+_TR_BOX+';margin-bottom:10px">'+_trHead('🖼️ Πριν / Τώρα','κάρτα για τον πελάτη')
    +'<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">'
    +'<div style="flex:1;min-width:240px;max-width:380px;border:1px solid #c5ddd8;border-radius:12px;padding:12px;background:#f7fbfa">'
    +'<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:6px;align-items:center">'+col(d.B,_trMonthLbl(d.B.date),false)+'<span style="font-size:18px;color:#9fb5b0">→</span>'+col(d.L,_trMonthLbl(d.L.date),true)+'</div>'
    +(d.lines.length?'<div style="text-align:center;font-size:11.5px;font-weight:700;color:#025857;margin-top:8px">'+d.lines.join(' · ')+'</div>':'')
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:6px"><button class="btn" style="padding:5px 12px;font-size:11px;background:#25D366;color:#fff;border:none" onclick="shareTrackerCard()" title="Φτιάχνει εικόνα PNG της κάρτας· στο tablet/κινητό ανοίγει απευθείας η κοινοποίηση (WhatsApp κ.λπ.), αλλιώς κατεβαίνει για επισύναψη">📷 Εικόνα για WhatsApp</button></div>'
    +'</div></div>';
}
function _trCardCanvas(c,d){
  var W=1080,H=1080,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  var x=cv.getContext('2d'),F='"Segoe UI",Roboto,Arial,sans-serif';
  x.fillStyle='#ffffff';x.fillRect(0,0,W,H);
  x.fillStyle='#025857';x.fillRect(0,0,W,150);
  x.fillStyle='#ffffff';x.textAlign='left';x.font='700 44px '+F;x.fillText('Feed Your Health',60,92);
  x.textAlign='right';x.font='400 34px '+F;x.fillText(String(c.name||'').split(' ')[0],W-60,92);
  var colX=[270,810];
  [[d.B,false],[d.L,true]].forEach(function(p,i){
    var e=p[0],hl=p[1];x.textAlign='center';
    x.fillStyle='#7a8f8b';x.font='400 36px '+F;x.fillText(_trMonthLbl(e.date),colX[i],290);
    x.fillStyle=hl?'#2e7d32':'#025857';x.font='800 150px '+F;x.fillText(String(e.weight),colX[i],460);
    x.font='600 40px '+F;x.fillText('kg',colX[i],520);
    if(d.showBf){x.fillStyle=hl?'#2e7d32':'#5f6f6c';x.font='600 44px '+F;x.fillText(e.bf+'% λίπος',colX[i],600);}
  });
  x.fillStyle='#9fb5b0';x.font='400 90px '+F;x.textAlign='center';x.fillText('→',W/2,440);
  x.strokeStyle='#e0ebe8';x.lineWidth=3;x.beginPath();x.moveTo(80,690);x.lineTo(W-80,690);x.stroke();
  x.fillStyle='#025857';x.font='700 46px '+F;
  d.lines.forEach(function(t,i){x.fillText(t,W/2,790+i*72);});
  x.fillStyle='#9fb5b0';x.font='400 28px '+F;x.fillText(_fmtDateGr(d.B.date)+' → '+_fmtDateGr(d.L.date),W/2,H-50);
  return cv;
}
function shareTrackerCard(){
  var c=getC();if(!c)return;
  var d=_trCardData(c,trSorted(c),_trackerCmp);if(!d)return;
  var cv=_trCardCanvas(c,d),fname='proodos-'+String(c.name||'pelatis').split(' ')[0]+'-'+d.L.date+'.png';
  cv.toBlob(function(blob){
    if(!blob)return;
    var file=null;
    try{ file=new File([blob],fname,{type:'image/png'}); }catch(e){}
    if(file&&navigator.canShare&&navigator.canShare({files:[file]})){
      navigator.share({files:[file],title:'Η πρόοδός σου'}).catch(function(){});
      return;
    }
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fname;
    document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1500);
    if(typeof showSuccessToast==='function')showSuccessToast('📷 Η εικόνα κατέβηκε — επισύναψέ την στο WhatsApp του πελάτη');
  },'image/png');
}

// ── Comparison switch (2) ─────────────────────────────────────────────────────────────
function trCmpSwitchHtml(sorted){
  if(sorted.length<2)return '';
  var b=function(v,lbl){var on=_trackerCmp===v;return '<button class="btn" onclick="setTrackerCmp(\''+v+'\')" style="padding:3px 10px;font-size:11px;'+(on?'background:#025857;color:#fff;border:1px solid #025857':'background:var(--card-bg);color:#025857;border:1px solid #c5ddd8')+'">'+lbl+'</button>';};
  return '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span style="font-size:10.5px;color:#666">Σύγκριση με:</span>'
    +b('prev','Προηγούμενη ('+_fmtDateGr(sorted[sorted.length-2].date)+')')+b('first','1η μέτρηση ('+_fmtDateGr(sorted[0].date)+')')+'</div>';
}

// The whole dashboard. `extraHtml` = dietitian-only block (target weights) shown under the tiles
// outside presentation mode.
function trackerResultsHtml(c,isMinor,extraHtml){
  var sorted=trSorted(c);
  if(!sorted.length)return '';
  var cmp=sorted.length>1?_trackerCmp:'prev',L=sorted[sorted.length-1];
  var age=c.birthDate?ageAtDate(c.birthDate):c.age;
  var pair=[trGoalBarHtml(c,sorted),trZoneBarHtml(c,sorted,cmp,isMinor,age)].filter(Boolean);
  var info=[trFatLeanHtml(sorted),trCircHtml(c,sorted,cmp),trSkinfoldMapHtml(sorted,cmp)].filter(Boolean);
  var grid=function(a){return a.length?'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px;margin-bottom:10px">'+a.join('')+'</div>':'';};
  return '<div style="background:#f7fbfa;border:1px solid #c5ddd8;border-radius:10px;padding:12px;margin-bottom:12px">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:10px">'
    +'<div style="font-size:12px;font-weight:700;color:#025857">📊 Αποτελέσματα — '+_fmtDateGr(L.date)+'</div>'+trCmpSwitchHtml(sorted)+'</div>'
    +trStoryHtml(c,sorted,cmp)
    +trTilesHtml(c,sorted,cmp,isMinor)
    +(extraHtml||'')
    +grid(pair)
    +trMilestonesHtml(c,sorted,age,isMinor)
    +grid(info)
    +trBeforeAfterHtml(c,sorted,cmp)
    +'</div>';
}

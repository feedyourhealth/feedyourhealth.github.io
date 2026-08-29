// js/plan-gen/micronutrient-html.js
// getMicronutrientHtml(c) — PHASE 3 micronutrient-adequacy display for the plan
// view. Extracted verbatim from js/app-part3.js (module split wave 22). Single
// pure fn declaration, no load-time code. Called from renderWeekTable
// (plan-gen/week-table.js) and app-part4.js, all at runtime. Loads right before
// app-part3.js.

/* ── PHASE 3: Micronutrient Adequacy Display ──────────────────────────────── */
function getMicronutrientHtml(c){
  if(!c)return'';
  var targets=getMicronutrientTargets(c);
  var useAthletic=c.sport||((c.trainDays||[]).filter(function(x){return x;}).length>=3);

  var daysMN={};
  for(var d=0;d<7;d++){
    var meals=c.weekPlan[d]||[];
    daysMN[d]=getDayMicronutrients(meals);
  }

  // Calculate weekly average
  var weekMN={Fe:0,Zn:0,Mg:0,Ca:0,B1:0,B2:0,B3:0,B6:0,B12:0,Folate:0,Omega3:0,Omega6:0,Iodine:0,Choline:0,DHA:0,VitD:0};
  Object.keys(daysMN).forEach(function(d){
    var dmn=daysMN[d];
    ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA','VitD'].forEach(function(key){
      weekMN[key]+=dmn[key];
    });
  });
  ['Fe','Zn','Mg','Ca','B1','B2','B3','B6','B12','Folate','Omega3','Omega6','Iodine','Choline','DHA','VitD'].forEach(function(key){
    weekMN[key]=Math.round(weekMN[key]/7);
  });

  var adequacy=checkMicronutrientAdequacy(weekMN,targets,useAthletic);
  var criticalCount=0,lowCount=0;
  Object.keys(adequacy).forEach(function(key){
    if(adequacy[key].status==='critical')criticalCount++;
    else if(adequacy[key].status==='low')lowCount++;
  });

  // ════ ENHANCED: DETAILED TABLE WITH ALL MICRONUTRIENTS ════
  var html='<div style="background:var(--card-bg);border-radius:8px;padding:0;margin-top:8px;font-size:11px;border:1px solid var(--border-light)">';

  // Header summary
  html+='<div style="background:var(--panel-bg);padding:12px;border-bottom:1px solid #ddd;">';
  html+='<div style="font-weight:700;color:var(--text-strong);margin-bottom:8px;font-size:12px;">📊 Ανάλυση Μικροθρεπτικών (Ημερήσιος Μέσος Όρος 7 Ημερών)</div>';

  if(criticalCount>0||lowCount>0){
    html+='<div style="background:#fff3e0;border-left:3px solid #ff9800;padding:8px;border-radius:3px;color:#e65100;font-size:10px;">'
      +'<b>⚠️ '+criticalCount+' κρίσιμα</b>, <b>'+lowCount+' χαμηλά</b> — Χρειάζεται προσοχή'
      +'</div>';
  } else {
    html+='<div style="background:#e8f5e9;border-left:3px solid #4caf50;padding:8px;border-radius:3px;color:var(--good);font-size:10px;">'
      +'<b>✅ Επαρκής</b> — Όλα τα μικροθρεπτικά στο στόχο'
      +'</div>';
  }
  html+='</div>';

  // Detailed table
  html+='<table style="width:100%;border-collapse:collapse;margin:0;">';
  html+='<thead><tr style="background:#e0e0e0;font-weight:700;text-align:left;border-bottom:2px solid #999;">'
    +'<th style="padding:8px 10px;text-align:left;width:35%;">Μικροθρεπτικό</th>'
    +'<th style="padding:8px 10px;text-align:center;width:15%;">Όντως</th>'
    +'<th style="padding:8px 10px;text-align:center;width:15%;">Στόχος</th>'
    +'<th style="padding:8px 10px;text-align:center;width:15%;">% Στόχου</th>'
    +'<th style="padding:8px 10px;text-align:center;width:20%;">Κατάσταση</th>'
    +'</tr></thead>';
  html+='<tbody>';

  // Sort by status (critical first, then low, then ok)
  var sortedKeys=['Fe','Zn','Mg','Ca','VitD','B12','B1','B2','B3','B6','Folate','Omega3','Omega6','Iodine','Choline','DHA'];
  var rows=[];

  sortedKeys.forEach(function(key){
    var adq=adequacy[key];
    var tgt=targets[MICRONUTRIENT_KEY_MAP[key]]||{};
    var label=tgt.label||key;
    var unit=tgt.unit||'';
    var actualVal=Math.round(adq.actual*10)/10;
    var targetVal=Math.round((useAthletic?tgt.athletic:tgt.target)*10)/10;
    var pct=adq.pct;
    var status=adq.status;
    var statusIcon='✅';
    var bgColor='#e8f5e9';

    if(status==='critical'){
      statusIcon='🔴';
      bgColor='#ffebee';
    } else if(status==='low'){
      statusIcon='⚠️';
      bgColor='#fff3e0';
    }

    rows.push({
      key:key,
      label:label,
      actual:actualVal,
      target:targetVal,
      unit:unit,
      pct:pct,
      status:status,
      icon:statusIcon,
      bg:bgColor,
      statusPriority:status==='critical'?0:status==='low'?1:2
    });
  });

  // Sort by priority (critical first)
  rows.sort(function(a,b){return a.statusPriority-b.statusPriority;});

  rows.forEach(function(row){
    html+='<tr style="border-bottom:1px solid #eee;background:'+row.bg+';">';
    html+='<td style="padding:8px 10px;"><strong>'+row.label+'</strong></td>';
    html+='<td style="padding:8px 10px;text-align:center;">'+row.actual+' <span style="font-size:9px;color:#666;">'+row.unit+'</span></td>';
    html+='<td style="padding:8px 10px;text-align:center;"><span style="font-size:10px;color:#666;">'+row.target+' '+row.unit+'</span></td>';
    html+='<td style="padding:8px 10px;text-align:center;"><strong style="font-size:12px;'+(row.pct>=90?'color:var(--good);':row.pct>=65?'color:#e65100;':'color:#d32f2f;')+'">'+row.pct+'%</strong></td>';
    var statusLabel=row.status==='critical'?'Κρίσιμο':row.status==='low'?'Χαμηλό':'Επαρκές';
    html+='<td style="padding:8px 10px;text-align:center;"><span style="font-size:13px;">'+row.icon+'</span> <span style="font-size:9px;color:#666;">'+statusLabel+'</span></td>';
    html+='</tr>';
  });

  html+='</tbody></table>';
  html+='</div>';

  // ✅ ADD DAILY TOTALS & STATUS HEADERS
  html+='<div style="margin-top:20px;display:grid;grid-template-columns:repeat(7,1fr);gap:10px;">';
  var tdeeResult = calcTDEE(c);
  var targetTotals = {k: tdeeResult.target}; // ✅ FIX: calcTDEE() returns .target for kcal, not .k — getDayStatus expects .k
  for(var dayIdx = 0; dayIdx < 7; dayIdx++){
    var dayMeals = c.weekPlan[dayIdx] || [];
    var dayTotals = calculateDailyTotals(dayMeals);
    var dayStatus = getDayStatus(dayTotals, targetTotals);

    html+='<div class="day-header">'
      +'<div style="flex:1">'
      +'<div class="day-header-title">'+DAYS[dayIdx]+'</div>'
      +'<div class="day-header-totals" style="margin-top:6px;">'
      +'<div class="day-total-item kcal">'+dayTotals.k+' kcal</div>'
      +'</div>'
      +'<div style="margin-top:4px;font-size:10px;color:#666">'
      +'Π: '+dayTotals.p+'g | Λ: '+dayTotals.f+'g | Υ: '+dayTotals.c+'g'
      +'</div>'
      +'</div>'
      +'<div class="day-status-badge '+dayStatus.status+'">'+dayStatus.label+'</div>'
      +'</div>';
  }
  html+='</div>';

  // Footer note
  html+='<div style="background:var(--panel-bg);padding:10px;border-top:1px solid #ddd;border-radius:0 0 8px 8px;font-size:9px;color:#666;line-height:1.5;">';
  html+='<strong>📌 Σημειώσεις:</strong> Τα ποσοστά βασίζονται σε '+(useAthletic?'<strong>αθλητικούς</strong>':'<strong>κανονικούς</strong>')+' στόχους. Για ελλείψεις <strong>≥25%</strong>, εξετάστε τα συμπληρώματα στην ενότητα 💊 <strong>Προτάσεις</strong>.';
  html+='</div>';

  return html;
}


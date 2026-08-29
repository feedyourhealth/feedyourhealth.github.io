// js/client-editor/gap-analysis.js
// The micronutrient gap-analysis modal, extracted verbatim from js/app-part4.js
// (module split wave 38): openGapAnalysisModal, buildGapAnalysisHTML(gaps,
// recommendations, weekAnalysis, c), closeGapAnalysisModal. Pure fn declarations,
// no load-time code. buildGapAnalysisHTML calls getWeekMicronutrients /
// detectMicronutrientGaps / matchSupplementsToGaps (calc/micronutrients.js);
// openGapAnalysisModal is fired from an onclick — all runtime. Loads right after
// client-editor/modals.js.

// PART 4: GAP ANALYSIS MODAL INTEGRATION ════════════════════════════════════════

function openGapAnalysisModal(){
  var c = getC();
  if(!c || !c.weekPlan){
    showErrorToast('Δημιουργήστε πρώτα ένα πλάνο');
    return;
  }

  // Run the analysis chain
  var weekAnalysis = getWeekMicronutrients(c.weekPlan);
  var gaps = detectMicronutrientGaps(weekAnalysis, c);
  var recommendations = matchSupplementsToGaps(gaps, SUPPS);

  // Build HTML report
  var html = buildGapAnalysisHTML(gaps, recommendations, weekAnalysis, c);

  // Create/populate modal
  var modal = document.getElementById('gap-analysis-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'gap-analysis-modal';
    modal.className = 'gap-modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = html;
  modal.style.display = 'flex';

  // Close on background click
  modal.addEventListener('click', function(e){
    if(e.target === modal) closeGapAnalysisModal();
  });
}

function buildGapAnalysisHTML(gaps, recommendations, weekAnalysis, c){
  // Header with summary
  var html = '<div class="gap-modal-content">';
  html += '<div class="gap-modal-header">';
  html += '<h2 style="color:#025857;margin:0;">🔬 Ανάλυση Κενών Μικροθρεπτικών & Συμπληρώματα</h2>';
  html += '<button onclick="closeGapAnalysisModal()" style="background:#ff6b35;padding:8px 12px;border:none;border-radius:4px;cursor:pointer;color:white;font-weight:bold;font-size:16px;">✕</button>';
  html += '</div>';

  // Show methodology notes
  var methodologyNote = '📋 Προσαρμογές (Επιστημονικές μελέτες 2024-2025): ';
  var adjustments = [];
  if(c.sport) adjustments.push('🏆 Άθλημα-ειδικές ανάγκες');
  if(c.dietType && (c.dietType==='vegan' || c.dietType==='vegetarian' || c.dietType==='orthodox_fasting')) {
    adjustments.push('🥗 ' + (c.dietType==='vegan' ? 'Vegan' : c.dietType==='vegetarian' ? 'Χορτοφαγικές' : 'Ορθόδοξη Νηστεία') + ' ανάγκες');
  }
  if(c.altitudeTraining) adjustments.push('⛰️ Προπόνηση σε ύψος');
  if(adjustments.length > 0) {
    html += '<div style="background:#e3f2fd;border-left:4px solid #1976d2;padding:10px;margin-bottom:15px;border-radius:4px;font-size:11px;color:#1565C0;">';
    html += methodologyNote + adjustments.join(' + ');
    html += '</div>';
  }

  // Critical gaps section
  if(gaps.filter(function(g){return g.severity==='critical';}).length > 0){
    html += '<div class="gap-section">';
    html += '<h3 style="color:#d32f2f;margin-top:0;">🔴 ΚΡΙΣΙΜΑ ΚΕΝΑ</h3>';
    gaps.filter(function(g){return g.severity==='critical';}).forEach(function(gap){
      html += '<div class="gap-item critical">';
      html += '<span style="flex:1;"><strong>' + gap.nutrient + '</strong>';
      if(gap.supplementRequired) html += ' <span style="background:#d32f2f;color:white;padding:2px 6px;border-radius:3px;font-size:10px;font-weight:bold;margin-left:8px;">⚠️ ΣΥΜΠΛΗΡΩΜΑ</span>';
      html += '</span>';
      html += '<span style="text-align:right;">' + gap.actual.toFixed(1) + ' / ' + gap.target + ' ' + gap.unit + ' (' + gap.percent + '%)</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Low/moderate gaps section
  if(gaps.filter(function(g){return g.severity!=='critical';}).length > 0){
    html += '<div class="gap-section">';
    html += '<h3 style="color:#e65100;margin-top:0;">⚠️ ΕΛΛΕΙΨΕΙΣ</h3>';
    gaps.filter(function(g){return g.severity!=='critical';}).forEach(function(gap){
      html += '<div class="gap-item">';
      html += '<span style="flex:1;"><strong>' + gap.nutrient + '</strong></span>';
      html += '<span style="text-align:right;">' + gap.actual.toFixed(1) + ' / ' + gap.target + ' ' + gap.unit + ' (' + gap.percent + '%)</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Recommended supplements section
  if(recommendations.length > 0){
    html += '<div class="gap-section">';
    html += '<h3 style="color:#1976d2;margin-top:0;">💊 ΣΥΝΙΣΤΩΜΕΝΑ ΣΥΜΠΛΗΡΩΜΑΤΑ</h3>';
    recommendations.forEach(function(rec){
      html += '<div class="supp-rec">';
      html += '<div style="font-weight:bold;color:#1976d2;">' + rec.supplement + ' - ' + rec.recommendedDose + ' ' + rec.unit + '</div>';
      html += '<div style="font-size:12px;color:#666;margin-top:3px;">' + rec.nutrient + ' | ' + rec.reason + '</div>';
      if(rec.timing){
        html += '<div style="font-size:11px;color:#666;margin-top:2px;">⏰ ' + rec.timing.t + '</div>';
      }
      if(rec.interactions && rec.interactions.length > 0){
        html += '<div style="font-size:11px;color:#d32f2f;margin-top:2px;">⚠️ ' + rec.timing_note + ': ' + rec.interactions.join(', ') + '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  if(recommendations.length === 0 && gaps.length === 0){
    html += '<div style="text-align:center;padding:40px;color:var(--text-muted);">';
    html += '<p style="font-size:14px;font-weight:bold;">✅ Εξαιρετική κάλυψη!</p>';
    html += '<p>Το πλάνο διατροφής σας καλύπτει τις περισσότερες μικροθρεπτικές σας ανάγκες.</p>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function closeGapAnalysisModal(){
  var modal = document.getElementById('gap-analysis-modal');
  if(modal) modal.style.display = 'none';
}


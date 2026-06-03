// ✅ PHASE 5: ANALYTICS UI
// File: js/13-analytics-ui.js
// Description: Analytics dashboard rendering and UI components

/**
 * renderAnalyticsDashboard - Render the complete analytics dashboard
 */
function renderAnalyticsDashboard() {
  const analyticsDiv = document.getElementById('analyticsContent');
  if (!analyticsDiv) {
    console.warn('⚠️ analyticsContent div not found');
    return;
  }

  try {
    // Get metrics
    const metrics = ANALYTICS.getClientMetrics();
    const avgMetrics = ANALYTICS.getAverageClientMetrics();
    const dietDist = ANALYTICS.getDietTypeDistribution();
    const goalDist = ANALYTICS.getGoalDistribution();

    // Build HTML
    let html = '<div style="padding: 20px; background: #f9f9f9; min-height: 600px;">';

    // Header
    html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #025857; padding-bottom: 15px;">';
    html += '<h2 style="color: #025857; margin: 0;">📊 Αναλυτικά & Στατιστικά</h2>';
    html += '<div style="display: flex; gap: 10px;">';
    html += '<button onclick="location.reload()" style="padding: 8px 12px; background: #025857; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">🔄 Ανανέωση</button>';
    html += '<button onclick="downloadAnalyticsCSV()" style="padding: 8px 12px; background: #7cb342; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">⬇️ Λήψη CSV</button>';
    html += '</div>';
    html += '</div>';

    // Metrics Cards
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px;">';

    html += '<div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
    html += '<div style="font-size: 12px; color: #666; margin-bottom: 8px;">Σύνολο Πελατών</div>';
    html += '<div style="font-size: 28px; font-weight: bold; color: #025857;">' + metrics.total + '</div>';
    html += '</div>';

    html += '<div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
    html += '<div style="font-size: 12px; color: #666; margin-bottom: 8px;">Με Πλάνο</div>';
    html += '<div style="font-size: 28px; font-weight: bold; color: #7cb342;">' + metrics.withPlans + '</div>';
    html += '</div>';

    html += '<div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
    html += '<div style="font-size: 12px; color: #666; margin-bottom: 8px;">Dropout Rate</div>';
    html += '<div style="font-size: 28px; font-weight: bold; color: #ff6b35;">' + metrics.dropoutRate + '</div>';
    html += '</div>';

    html += '<div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
    html += '<div style="font-size: 12px; color: #666; margin-bottom: 8px;">Μ.Ο. Ηλικία</div>';
    html += '<div style="font-size: 28px; font-weight: bold; color: #1976d2;">' + avgMetrics.avgAge + '</div>';
    html += '</div>';

    html += '</div>';

    // Diet Type Distribution
    html += '<div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">';
    html += '<h3 style="color: #025857; margin-top: 0;">Τύπος Διατροφής</h3>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr style="background: #f0f0f0;"><th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Τύπος</th><th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Πλήθος</th></tr>';

    for (let diet in dietDist) {
      html += '<tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">' + (diet || 'Κανονική') + '</td><td style="padding: 8px; text-align: right;">' + dietDist[diet] + '</td></tr>';
    }

    html += '</table>';
    html += '</div>';

    // Goal Distribution
    html += '<div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px;">';
    html += '<h3 style="color: #025857; margin-top: 0;">Στόχος Πελατών</h3>';
    html += '<table style="width: 100%; border-collapse: collapse;">';
    html += '<tr style="background: #f0f0f0;"><th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Στόχος</th><th style="padding: 8px; text-align: right; border-bottom: 1px solid #ddd;">Πλήθος</th></tr>';

    for (let goal in goalDist) {
      html += '<tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px;">' + (goal || 'Διατήρηση') + '</td><td style="padding: 8px; text-align: right;">' + goalDist[goal] + '</td></tr>';
    }

    html += '</table>';
    html += '</div>';

    html += '</div>';

    analyticsDiv.innerHTML = html;
    console.log('✅ Analytics dashboard rendered');
  } catch (e) {
    console.error('❌ Error rendering analytics:', e);
    analyticsDiv.innerHTML = '<div style="padding: 20px; color: red;">Σφάλμα φόρτωσης αναλυτικών. Δείτε την κονσόλα.</div>';
  }
}

/**
 * downloadAnalyticsCSV - Download analytics data as CSV
 */
function downloadAnalyticsCSV() {
  const metrics = ANALYTICS.getClientMetrics();
  const avgMetrics = ANALYTICS.getAverageClientMetrics();

  let csv = 'Μετρική,Τιμή\n';
  csv += 'Σύνολο Πελατών,' + metrics.total + '\n';
  csv += 'Με Πλάνο,' + metrics.withPlans + '\n';
  csv += 'Dropout Rate,' + metrics.dropoutRate + '\n';
  csv += 'Μ.Ο. Ηλικία,' + avgMetrics.avgAge + '\n';
  csv += 'Μ.Ο. Βάρος,' + avgMetrics.avgWeight + '\n';
  csv += 'Μ.Ο. Ύψος,' + avgMetrics.avgHeight + '\n';

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'analytics-' + new Date().toISOString().split('T')[0] + '.csv';
  link.click();

  console.log('✅ Analytics CSV downloaded');
}

console.log('✅ js/13-analytics-ui.js loaded');

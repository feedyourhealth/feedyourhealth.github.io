// ✅ TIER 3 #9: MULTI-CLIENT COMPARISON
// File: js/14-multi-client-comparison.js
// Description: Compare metrics across multiple clients

const MULTI_CLIENT_COMPARISON = {
  selectedClients: [],
  maxClients: 4,

  /**
   * Get comparison metrics for selected clients
   */
  getComparisonMetrics(clientIds) {
    if (!clientIds || clientIds.length < 2) {
      console.warn('Need at least 2 clients to compare');
      return null;
    }

    const metrics = [];
    clientIds.forEach(id => {
      const c = clients.find(cli => cli.id === id);
      if (!c) return;

      const t = calcTDEE(c);
      const hasPlan = c.weekPlan && Object.keys(c.weekPlan).length > 0;

      metrics.push({
        id: c.id,
        name: c.name || 'Νέος πελάτης',
        age: c.age || 0,
        weight: c.weight || 0,
        height: c.height || 0,
        sex: c.sex || 'M',
        goal: c.goal || 'maintain',
        dietType: c.dietType || 'normal',
        tdee: t.target || 0,
        bmr: t.bmr || 0,
        protein: c.macroP || 25,
        fat: c.macroF || 25,
        carbs: c.macroC || 50,
        hasPlan: hasPlan,
        trainDays: (c.trainDays || []).filter(x => x).length
      });
    });

    return metrics;
  },

  /**
   * Build comparison table HTML
   */
  buildComparisonTable(metrics) {
    if (!metrics || metrics.length < 2) return '';

    let html = '<table style="width:100%;border-collapse:collapse;margin:20px 0;">';
    html += '<tr style="background:#025857;color:#fff;">';
    html += '<th style="padding:10px;text-align:left;">Μέτρηση</th>';

    metrics.forEach(m => {
      html += '<th style="padding:10px;text-align:center;">' + m.name + '</th>';
    });

    html += '</tr>';

    const rows = [
      { label: 'Ηλικία', key: 'age' },
      { label: 'Βάρος (kg)', key: 'weight' },
      { label: 'Ύψος (cm)', key: 'height' },
      { label: 'Στόχος', key: 'goal' },
      { label: 'Διατροφή', key: 'dietType' },
      { label: 'TDEE (kcal)', key: 'tdee' },
      { label: 'Πρωτεΐνη %', key: 'protein' },
      { label: 'Λίπος %', key: 'fat' },
      { label: 'Υδατάνθρακες %', key: 'carbs' },
      { label: 'Ημέρες Προπόνησης', key: 'trainDays' },
      { label: 'Έχει Πλάνο', key: 'hasPlan' }
    ];

    rows.forEach((row, idx) => {
      const bgColor = idx % 2 === 0 ? '#f9f9f9' : '#fff';
      html += '<tr style="background:' + bgColor + ';">';
      html += '<td style="padding:8px;font-weight:600;border-bottom:1px solid #eee;">' + row.label + '</td>';

      const values = metrics.map(m => m[row.key]);
      const isNumeric = values.every(v => typeof v === 'number');

      metrics.forEach(m => {
        const value = m[row.key];
        const isMin = isNumeric && value === Math.min(...values);
        const isMax = isNumeric && value === Math.max(...values);
        const highlight = isMin ? '#ffffcc' : isMax ? '#e0f4ff' : 'transparent';

        let displayValue = value;
        if (typeof value === 'boolean') displayValue = value ? '✓' : '✗';

        html += '<td style="padding:8px;text-align:center;border-bottom:1px solid #eee;background:' + highlight + ';">';
        html += displayValue;
        html += '</td>';
      });

      html += '</tr>';
    });

    html += '</table>';

    return html;
  },

  /**
   * Render comparison view
   */
  render(clientIds) {
    const metrics = this.getComparisonMetrics(clientIds);
    if (!metrics) return;

    const html = '<div style="padding:20px;">' +
      '<h2 style="color:#025857;">📊 Σύγκριση Πελατών</h2>' +
      '<p style="font-size:12px;color:#666;">Min values highlighted in yellow, Max in blue</p>' +
      this.buildComparisonTable(metrics) +
      '</div>';

    return html;
  },

  /**
   * Export comparison to CSV
   */
  exportToCSV(clientIds) {
    const metrics = this.getComparisonMetrics(clientIds);
    if (!metrics) return;

    let csv = 'Μέτρηση,' + metrics.map(m => m.name).join(',') + '\n';

    const rows = [
      { label: 'Ηλικία', key: 'age' },
      { label: 'Βάρος', key: 'weight' },
      { label: 'Ύψος', key: 'height' },
      { label: 'Στόχος', key: 'goal' },
      { label: 'TDEE', key: 'tdee' },
      { label: 'Πρωτεΐνη %', key: 'protein' },
      { label: 'Λίπος %', key: 'fat' },
      { label: 'Υδατάνθρακες %', key: 'carbs' }
    ];

    rows.forEach(row => {
      csv += row.label + ',' + metrics.map(m => m[row.key]).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'comparison-' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();

    console.log('✅ Comparison exported to CSV');
  }
};

console.log('✅ js/14-multi-client-comparison.js loaded');

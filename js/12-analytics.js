// ✅ PHASE 5: ANALYTICS ENGINE
// File: js/12-analytics.js
// Description: Core analytics calculations and metrics

const ANALYTICS = {
  /**
   * Get client metrics summary
   */
  getClientMetrics() {
    const visible = clients.filter(c => !c.deleted && !c.archived);
    const total = visible.length;
    const active = visible.filter(c => c.weekPlan && Object.keys(c.weekPlan).length > 0).length;
    const withPlans = active;
    const dropoutRate = total > 0 ? Math.round(((total - active) / total) * 100) : 0;

    return {
      total: total,
      active: active,
      withPlans: withPlans,
      dropoutRate: dropoutRate + '%'
    };
  },

};

console.log('✅ js/12-analytics.js loaded');

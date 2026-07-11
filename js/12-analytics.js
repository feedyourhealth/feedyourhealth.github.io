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

  /**
   * Get diet type distribution
   */
  getDietTypeDistribution() {
    const distribution = {};
    clients.forEach(c => {
      const diet = c.dietType || 'normal';
      distribution[diet] = (distribution[diet] || 0) + 1;
    });
    return distribution;
  },

  /**
   * Get goal distribution
   */
  getGoalDistribution() {
    const distribution = {};
    clients.forEach(c => {
      const goal = c.goal || 'maintain';
      distribution[goal] = (distribution[goal] || 0) + 1;
    });
    return distribution;
  },

  /**
   * Get average metrics for active clients
   */
  getAverageClientMetrics() {
    const activeClients = clients.filter(c => c.weekPlan && Object.keys(c.weekPlan).length > 0);
    if (activeClients.length === 0) {
      return { avgAge: 0, avgWeight: 0, avgHeight: 0 };
    }

    const sumAge = activeClients.reduce((sum, c) => sum + (c.age || 0), 0);
    const sumWeight = activeClients.reduce((sum, c) => sum + (c.weight || 0), 0);
    const sumHeight = activeClients.reduce((sum, c) => sum + (c.height || 0), 0);

    return {
      avgAge: Math.round(sumAge / activeClients.length),
      avgWeight: Math.round(sumWeight / activeClients.length * 10) / 10,
      avgHeight: Math.round(sumHeight / activeClients.length)
    };
  }
};

console.log('✅ js/12-analytics.js loaded');

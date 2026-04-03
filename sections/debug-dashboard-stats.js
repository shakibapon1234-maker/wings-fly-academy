/**
 * Debug dashboard stats - check what data is being used
 */
window.debugDashboardStats = function() {
  console.log('=== DEBUG DASHBOARD STATS ===');
  
  const settings = window.globalData?.settings || {};
  console.log('Settings:', settings);
  console.log('Running Batch:', settings.runningBatch);
  console.log('Date Start:', settings.runningBatchDateStart);
  console.log('Date End:', settings.runningBatchDateEnd);
  
  const finance = window.globalData?.finance || [];
  console.log('\nFinance records:', finance.length);
  
  // Check April 2nd transactions
  const apr2 = finance.filter(f => f.date && f.date.includes('2026-04-02'));
  console.log('April 2nd transactions:', apr2.length);
  apr2.forEach(f => {
    console.log(`  - ${f.type}: ৳${f.amount} | ${f.description} | studentId: ${f.studentId}`);
  });
  
  // Show income calculation
  const STAT_INCOME = window.FE_STAT_INCOME || ['Income', 'Registration', 'Refund'];
  let studentIncome = 0;
  finance.forEach(f => {
    if (f._deleted) return;
    if (!STAT_INCOME.includes(f.type)) return;
    const amt = parseFloat(f.amount) || 0;
    const cat = (f.category || '').toLowerCase();
    const isStudentRelated = cat.includes('student') || cat.includes('installment') ||
      cat.includes('admission') || cat.includes('fee') || (f.studentId && f.studentId.trim() !== '');
    if (isStudentRelated) studentIncome += amt;
  });
  console.log('\nAll-time student income:', studentIncome);
  
  return settings;
};

console.log('✅ debug-dashboard-stats.js loaded. Run: debugDashboardStats()');
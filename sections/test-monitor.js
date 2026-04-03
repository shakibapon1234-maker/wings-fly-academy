/**
 * Debug: Test monitor recording
 */
window.testMonitor = function() {
  console.log('=== TESTING MONITOR ===');
  
  // Force rebuild and record
  if (typeof window.feRebuildAllBalances === 'function') {
    window.feRebuildAllBalances();
    console.log('✅ Balance rebuilt');
  }
  
  // Record a test change
  recordMonitorChange('test_manual');
  console.log('✅ Monitor recorded');
  
  // Get history
  const history = getMonitorHistory();
  console.log('Monitor history:', history.length, 'records');
  
  if (history.length > 0) {
    const latest = history[0];
    console.log('Latest snapshot:', latest);
    console.log('  Cash:', latest.snapshot?.cash);
    console.log('  Grand:', latest.snapshot?.grand);
    console.log('  Counts:', latest.counts);
  }
  
  // Render monitor UI
  if (typeof window.renderMonitor === 'function') {
    window.renderMonitor();
    console.log('✅ Monitor UI rendered');
  }
  
  return history;
};

console.log('✅ test-monitor.js loaded. Run: testMonitor()');
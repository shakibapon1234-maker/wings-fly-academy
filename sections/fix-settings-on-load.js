/**
 * Debug: Check settings on page load and fix if needed
 */
window.fixSettingsOnLoad = function() {
  console.log('=== FIXING SETTINGS ON LOAD ===');
  
  // Check current settings
  const current = window.globalData?.settings || {};
  console.log('Current settings:', current);
  console.log('Running batch:', current.runningBatch);
  console.log('Date start:', current.runningBatchDateStart);
  console.log('Date end:', current.runningBatchDateEnd);
  
  // Check if there's a backup
  const backup = localStorage.getItem('wingsfly_settings_backup');
  if (backup) {
    const backupSettings = JSON.parse(backup);
    console.log('Settings backup:', backupSettings);
    
    // If current is empty but backup has data, restore
    if (!current.runningBatch && backupSettings.runningBatch) {
      console.log('⚠️ Restoring settings from backup...');
      window.globalData.settings = backupSettings;
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      console.log('✅ Settings restored!');
    }
  }
  
  // Force refresh dashboard
  if (typeof updateGlobalStats === 'function') {
    updateGlobalStats();
    console.log('✅ Dashboard stats updated');
  }
};

console.log('✅ fix-settings-on-load.js loaded. Run: fixSettingsOnLoad()');
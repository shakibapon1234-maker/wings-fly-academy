/**
 * Auto-fix settings on app initialization
 * Run this early to ensure settings are restored from backup if needed
 */
(function() {
  // Wait for globalData to be available
  function applySettingsFix() {
    if (!window.globalData) return;
    
    const current = window.globalData.settings || {};
    const backup = localStorage.getItem('wingsfly_settings_backup');
    
    if (backup && !current.runningBatch) {
      try {
        const backupSettings = JSON.parse(backup);
        if (backupSettings.runningBatch) {
          console.log('[SettingsFix] Restoring from backup:', backupSettings.runningBatch);
          window.globalData.settings = { ...current, ...backupSettings };
          localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
        }
      } catch(e) {
        console.warn('[SettingsFix] Backup parse error:', e);
      }
    }
  }
  
  // Try immediately
  applySettingsFix();
  
  // Also try after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySettingsFix);
  }
  
  // And after globalData loads
  setTimeout(applySettingsFix, 2000);
  
  console.log('✅ settings-auto-fix.js loaded');
})();
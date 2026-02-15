// ===================================
// DATA RECOVERY & AUTO-BACKUP SYSTEM
// Version: 6.0 - PERMANENT DATA PROTECTION
// ===================================
// 🛡️ Multi-layer data protection
// 🔄 Automatic hourly backups
// 💾 5 backup slots (rolling)
// 🚨 Instant recovery on data loss
// ===================================

console.log('🛡️ Data Protection System Loading...');

// ===================================
// BACKUP CONFIGURATION
// ===================================
const BACKUP_CONFIG = {
  MAX_BACKUPS: 5,                    // Keep last 5 backups
  AUTO_BACKUP_INTERVAL: 3600000,     // 1 hour in milliseconds
  EMERGENCY_BACKUP_INTERVAL: 300000, // 5 minutes for emergency backup
  BACKUP_PREFIX: 'wingsfly_backup_',
  EMERGENCY_PREFIX: 'wingsfly_emergency_',
  MAIN_DATA_KEY: 'wingsfly_data'
};

// ===================================
// AUTO-BACKUP TIMER
// ===================================
let autoBackupTimer = null;
let emergencyBackupTimer = null;

// ===================================
// CREATE BACKUP
// ===================================
function createBackup(isEmergency = false) {
  try {
    const currentData = localStorage.getItem(BACKUP_CONFIG.MAIN_DATA_KEY);
    
    if (!currentData || currentData === '{}' || currentData === 'null') {
      console.warn('⚠️ No data to backup');
      return false;
    }

    const timestamp = Date.now();
    const prefix = isEmergency ? BACKUP_CONFIG.EMERGENCY_PREFIX : BACKUP_CONFIG.BACKUP_PREFIX;
    const backupKey = `${prefix}${timestamp}`;
    
    // Save backup
    localStorage.setItem(backupKey, currentData);
    localStorage.setItem(`${backupKey}_meta`, JSON.stringify({
      timestamp: timestamp,
      date: new Date(timestamp).toISOString(),
      size: currentData.length,
      type: isEmergency ? 'emergency' : 'regular'
    }));

    console.log(`✅ Backup created: ${backupKey}`);
    
    // Clean old backups
    cleanOldBackups(prefix);
    
    return true;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return false;
  }
}

// ===================================
// CLEAN OLD BACKUPS
// ===================================
function cleanOldBackups(prefix) {
  try {
    const backups = [];
    
    // Find all backups
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && !key.endsWith('_meta')) {
        const metaKey = `${key}_meta`;
        const meta = localStorage.getItem(metaKey);
        if (meta) {
          backups.push({
            key: key,
            metaKey: metaKey,
            timestamp: JSON.parse(meta).timestamp
          });
        }
      }
    }

    // Sort by timestamp (newest first)
    backups.sort((a, b) => b.timestamp - a.timestamp);

    // Keep only MAX_BACKUPS, delete the rest
    if (backups.length > BACKUP_CONFIG.MAX_BACKUPS) {
      const toDelete = backups.slice(BACKUP_CONFIG.MAX_BACKUPS);
      toDelete.forEach(backup => {
        localStorage.removeItem(backup.key);
        localStorage.removeItem(backup.metaKey);
        console.log(`🗑️ Deleted old backup: ${backup.key}`);
      });
    }
  } catch (error) {
    console.error('❌ Backup cleanup failed:', error);
  }
}

// ===================================
// LIST ALL BACKUPS
// ===================================
function listAllBackups() {
  const backups = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(BACKUP_CONFIG.BACKUP_PREFIX) || key.startsWith(BACKUP_CONFIG.EMERGENCY_PREFIX)) && !key.endsWith('_meta')) {
      const metaKey = `${key}_meta`;
      const meta = localStorage.getItem(metaKey);
      if (meta) {
        const metaData = JSON.parse(meta);
        backups.push({
          key: key,
          ...metaData
        });
      }
    }
  }

  backups.sort((a, b) => b.timestamp - a.timestamp);
  
  console.log('📦 Available Backups:');
  backups.forEach((backup, index) => {
    console.log(`  ${index + 1}. ${backup.date} (${backup.type}) - ${(backup.size / 1024).toFixed(2)} KB`);
  });
  
  return backups;
}

// ===================================
// RESTORE FROM BACKUP
// ===================================
function restoreFromBackup(backupIndex = 0) {
  try {
    const backups = listAllBackups();
    
    if (backups.length === 0) {
      console.error('❌ No backups available!');
      alert('❌ No backups found! Cannot restore data.');
      return false;
    }

    const backup = backups[backupIndex];
    const backupData = localStorage.getItem(backup.key);
    
    if (!backupData) {
      console.error('❌ Backup data not found!');
      return false;
    }

    // Restore data
    localStorage.setItem(BACKUP_CONFIG.MAIN_DATA_KEY, backupData);
    
    // Parse and update global data
    window.globalData = JSON.parse(backupData);
    
    console.log('✅ Data restored from backup:', backup.date);
    alert(`✅ Data restored from backup!\n\nBackup Date: ${backup.date}\nType: ${backup.type}`);
    
    // Reload page to refresh UI
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('❌ Restore failed:', error);
    alert('❌ Failed to restore data: ' + error.message);
    return false;
  }
}

// ===================================
// AUTO-DETECT DATA LOSS & AUTO-RESTORE
// ===================================
function detectAndRecoverDataLoss() {
  try {
    const currentData = localStorage.getItem(BACKUP_CONFIG.MAIN_DATA_KEY);
    
    // Check if data is missing or empty
    if (!currentData || currentData === '{}' || currentData === 'null' || currentData === '[]') {
      console.warn('🚨 DATA LOSS DETECTED!');
      
      const backups = listAllBackups();
      
      if (backups.length > 0) {
        console.log('🔄 Auto-recovering from latest backup...');
        
        const latestBackup = backups[0];
        const backupData = localStorage.getItem(latestBackup.key);
        
        if (backupData) {
          localStorage.setItem(BACKUP_CONFIG.MAIN_DATA_KEY, backupData);
          window.globalData = JSON.parse(backupData);
          
          console.log('✅ Data auto-recovered!');
          alert(`✅ DATA RECOVERED AUTOMATICALLY!\n\nYour data was lost but has been restored from backup.\n\nBackup Date: ${latestBackup.date}`);
          
          // Reload to refresh UI
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
          return true;
        }
      } else {
        console.error('❌ No backups available for recovery!');
        alert('❌ DATA LOSS DETECTED!\n\nNo backups available to recover.\nPlease restore from Firebase Cloud.');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Data loss detection failed:', error);
    return false;
  }
}

// ===================================
// START AUTO-BACKUP SYSTEM
// ===================================
function startAutoBackup() {
  // Create initial backup
  createBackup(false);
  
  // Regular backup every hour
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
  }
  
  autoBackupTimer = setInterval(() => {
    console.log('⏰ Running scheduled backup...');
    createBackup(false);
  }, BACKUP_CONFIG.AUTO_BACKUP_INTERVAL);
  
  // Emergency backup every 5 minutes
  if (emergencyBackupTimer) {
    clearInterval(emergencyBackupTimer);
  }
  
  emergencyBackupTimer = setInterval(() => {
    createBackup(true);
  }, BACKUP_CONFIG.EMERGENCY_BACKUP_INTERVAL);
  
  console.log('✅ Auto-backup system started');
  console.log(`   Regular backups: Every ${BACKUP_CONFIG.AUTO_BACKUP_INTERVAL / 60000} minutes`);
  console.log(`   Emergency backups: Every ${BACKUP_CONFIG.EMERGENCY_BACKUP_INTERVAL / 60000} minutes`);
}

// ===================================
// STOP AUTO-BACKUP SYSTEM
// ===================================
function stopAutoBackup() {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
  }
  
  if (emergencyBackupTimer) {
    clearInterval(emergencyBackupTimer);
    emergencyBackupTimer = null;
  }
  
  console.log('⏸️ Auto-backup system stopped');
}

// ===================================
// MANUAL BACKUP BUTTON
// ===================================
function manualBackup() {
  const success = createBackup(false);
  if (success) {
    alert('✅ Manual backup created successfully!');
  } else {
    alert('❌ Backup failed! Check console for details.');
  }
}

// ===================================
// EXPORT BACKUP TO FILE
// ===================================
function exportBackupToFile() {
  try {
    const currentData = localStorage.getItem(BACKUP_CONFIG.MAIN_DATA_KEY);
    
    if (!currentData) {
      alert('❌ No data to export!');
      return;
    }

    const blob = new Blob([currentData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wingsfly_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('✅ Backup exported to file');
    alert('✅ Backup file downloaded!');
  } catch (error) {
    console.error('❌ Export failed:', error);
    alert('❌ Failed to export backup: ' + error.message);
  }
}

// ===================================
// IMPORT BACKUP FROM FILE
// ===================================
function importBackupFromFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target.result;
        const parsed = JSON.parse(data);
        
        // Validate data structure
        if (!parsed.students || !parsed.finance) {
          alert('❌ Invalid backup file!');
          return;
        }
        
        if (confirm('⚠️ This will replace all current data!\n\nDo you want to continue?')) {
          localStorage.setItem(BACKUP_CONFIG.MAIN_DATA_KEY, data);
          window.globalData = parsed;
          
          alert('✅ Backup imported successfully!');
          window.location.reload();
        }
      } catch (error) {
        console.error('❌ Import failed:', error);
        alert('❌ Failed to import backup: ' + error.message);
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// ===================================
// OVERRIDE SAVE FUNCTION TO AUTO-BACKUP
// ===================================
const originalSaveToStorage = window.saveToStorage;

window.saveToStorage = function() {
  // Call original save
  if (typeof originalSaveToStorage === 'function') {
    originalSaveToStorage();
  } else {
    localStorage.setItem(BACKUP_CONFIG.MAIN_DATA_KEY, JSON.stringify(window.globalData));
  }
  
  // Create emergency backup after every save
  createBackup(true);
};

// ===================================
// EXPOSE FUNCTIONS GLOBALLY
// ===================================
window.createBackup = createBackup;
window.listAllBackups = listAllBackups;
window.restoreFromBackup = restoreFromBackup;
window.manualBackup = manualBackup;
window.exportBackupToFile = exportBackupToFile;
window.importBackupFromFile = importBackupFromFile;
window.detectAndRecoverDataLoss = detectAndRecoverDataLoss;
window.startAutoBackup = startAutoBackup;
window.stopAutoBackup = stopAutoBackup;

// ===================================
// AUTO-START ON PAGE LOAD
// ===================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Check for data loss first
    setTimeout(() => {
      detectAndRecoverDataLoss();
      startAutoBackup();
    }, 2000);
  });
} else {
  setTimeout(() => {
    detectAndRecoverDataLoss();
    startAutoBackup();
  }, 2000);
}

// Backup before page unload
window.addEventListener('beforeunload', () => {
  createBackup(true);
});

console.log('✅ Data Protection System Ready (Version 6.0)');
console.log('🛡️ Features:');
console.log('   - Auto-backup every hour');
console.log('   - Emergency backup every 5 minutes');
console.log('   - Auto-recovery on data loss');
console.log('   - 5 backup slots (rolling)');
console.log('   - Export/Import backup files');
console.log('');
console.log('📋 Available Commands:');
console.log('   listAllBackups() - View all backups');
console.log('   restoreFromBackup(0) - Restore latest backup');
console.log('   manualBackup() - Create backup now');
console.log('   exportBackupToFile() - Download backup file');
console.log('   importBackupFromFile() - Upload backup file');

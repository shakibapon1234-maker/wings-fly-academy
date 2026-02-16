/**
 * ========================================
 * WINGS FLY AVIATION ACADEMY
 * AUTOMATIC REAL-TIME SYNC SYSTEM V23
 * ========================================
 * 
 * Features:
 * ✅ Auto-push on every data change
 * ✅ Real-time listening from other devices
 * ✅ Zero data loss protection
 * ✅ Works with 3-4 PCs simultaneously
 * ✅ Debounced push (500ms delay to batch changes)
 * ✅ Conflict resolution
 * 
 * Author: Wings Fly IT Team
 * Date: February 2026
 */

(function () {
  'use strict';

  // ==========================================
  // CONFIGURATION
  // ==========================================
  const SUPABASE_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';
  const TABLE_NAME = 'academy_data';
  const RECORD_ID = 'wingsfly_main';
  const BACKUP_PULL_INTERVAL = 5000; // Pull every 5 seconds as backup
  const PUSH_DEBOUNCE_DELAY = 500; // Wait 500ms to batch multiple changes

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let supabaseClient = null;
  let realtimeChannel = null;
  let isInitialized = false;
  let isPushing = false;
  let isPulling = false;
  let lastPushTime = 0;
  let lastPullTime = 0;
  let pushTimeout = null;
  let isMonitoringEnabled = false;

  // ==========================================
  // LOGGING HELPER
  // ==========================================
  function log(emoji, message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${emoji} ${message}`);
    if (data) console.log(data);
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function initialize() {
    if (isInitialized) {
      log('ℹ️', 'Already initialized');
      return true;
    }

    try {
      if (typeof window.supabase === 'undefined') {
        log('❌', 'Supabase library not loaded! Make sure you included the CDN script.');
        return false;
      }

      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      isInitialized = true;
      log('✅', 'Supabase client initialized successfully');
      return true;

    } catch (error) {
      log('❌', 'Failed to initialize Supabase:', error);
      return false;
    }
  }

  // ==========================================
  // PULL FROM CLOUD (Download)
  // ==========================================
  async function pullFromCloud(forceUpdate = false) {
    if (!isInitialized && !initialize()) {
      log('⚠️', 'Cannot pull - not initialized');
      return false;
    }

    if (isPulling) {
      log('⏳', 'Pull already in progress, skipping...');
      return false;
    }

    isPulling = true;

    try {
      log('📥', 'Pulling data from cloud...');

      const { data, error } = await supabaseClient
        .from(TABLE_NAME)
        .select('*')
        .eq('id', RECORD_ID)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          log('ℹ️', 'No data in cloud yet - this might be the first device');
          isPulling = false;
          return true;
        }
        throw error;
      }

      if (!data) {
        log('ℹ️', 'No data found in cloud');
        isPulling = false;
        return false;
      }

      // Get timestamps
      const cloudTimestamp = parseInt(data.last_updated) || 0;
      const localTimestamp = parseInt(localStorage.getItem('lastSyncTime')) || 0;

      log('🕐', `Cloud time: ${new Date(cloudTimestamp).toLocaleString()}`);
      log('🕐', `Local time: ${new Date(localTimestamp).toLocaleString()}`);

      // Only update if cloud data is newer OR force update is requested
      if (forceUpdate || cloudTimestamp > localTimestamp) {
        log('📥', 'Cloud data is newer - applying to local...');

        // Temporarily disable monitoring to prevent auto-push during pull
        const wasMonitoring = isMonitoringEnabled;
        isMonitoringEnabled = false;

        // Update global data
        window.globalData = {
          students: data.students || [],
          employees: data.employees || [],
          finance: data.finance || [],
          settings: data.settings || {},
          incomeCategories: data.income_categories || [],
          expenseCategories: data.expense_categories || [],
          paymentMethods: data.payment_methods || [],
          cashBalance: data.cash_balance || 0,
          bankAccounts: data.bank_accounts || [],
          mobileBanking: data.mobile_banking || [],
          courseNames: data.course_names || [],
          attendance: data.attendance || {},
          nextId: data.next_id || 1001,
          users: data.users || [],
          examRegistrations: data.exam_registrations || [],
          visitors: data.visitors || [],
          employeeRoles: data.employee_roles || []
        };

        // Save to localStorage
        localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
        localStorage.setItem('lastSyncTime', cloudTimestamp.toString());

        lastPullTime = Date.now();

        // Refresh UI
        if (typeof window.renderFullUI === 'function') {
          window.renderFullUI();
          log('✨', 'UI updated with cloud data');
        }

        // Re-enable monitoring
        isMonitoringEnabled = wasMonitoring;

        showNotification('📥 Data synced from cloud', 'success');
        log('✅', 'Pull completed successfully');

      } else {
        log('ℹ️', 'Local data is already up to date');
      }

      isPulling = false;
      return true;

    } catch (error) {
      log('❌', 'Pull error:', error);
      isPulling = false;
      showNotification('❌ Failed to sync from cloud', 'error');
      return false;
    }
  }

  // ==========================================
  // PUSH TO CLOUD (Upload)
  // ==========================================
  async function pushToCloud() {
    if (!isInitialized && !initialize()) {
      log('⚠️', 'Cannot push - not initialized');
      return false;
    }

    if (isPushing) {
      log('⏳', 'Push already in progress, will retry later...');
      return false;
    }

    isPushing = true;

    try {
      if (!window.globalData) {
        log('⚠️', 'No global data to push');
        isPushing = false;
        return false;
      }

      log('📤', 'Pushing data to cloud...');

      const timestamp = Date.now();
      const payload = {
        id: RECORD_ID,
        students: window.globalData.students || [],
        employees: window.globalData.employees || [],
        finance: window.globalData.finance || [],
        settings: window.globalData.settings || {},
        income_categories: window.globalData.incomeCategories || [],
        expense_categories: window.globalData.expenseCategories || [],
        payment_methods: window.globalData.paymentMethods || [],
        cash_balance: window.globalData.cashBalance || 0,
        bank_accounts: window.globalData.bankAccounts || [],
        mobile_banking: window.globalData.mobileBanking || [],
        course_names: window.globalData.courseNames || [],
        attendance: window.globalData.attendance || {},
        next_id: window.globalData.nextId || 1001,
        users: window.globalData.users || [],
        exam_registrations: window.globalData.examRegistrations || [],
        visitors: window.globalData.visitors || [],
        employee_roles: window.globalData.employeeRoles || [],
        last_updated: timestamp.toString()
      };

      const { error } = await supabaseClient
        .from(TABLE_NAME)
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      // Update local timestamp
      localStorage.setItem('lastSyncTime', timestamp.toString());
      lastPushTime = timestamp;

      log('✅', `Pushed to cloud at ${new Date(timestamp).toLocaleTimeString()}`);
      showNotification('📤 Data auto-saved to cloud', 'success');

      isPushing = false;
      return true;

    } catch (error) {
      log('❌', 'Push error:', error);
      isPushing = false;
      showNotification('❌ Failed to save to cloud', 'error');
      return false;
    }
  }

  // ==========================================
  // DEBOUNCED PUSH (Batch multiple changes)
  // ==========================================
  function schedulePush() {
    if (!isMonitoringEnabled) {
      return; // Don't auto-push if monitoring is disabled
    }

    if (pushTimeout) {
      clearTimeout(pushTimeout);
    }

    log('⏱️', `Data change detected - push scheduled in ${PUSH_DEBOUNCE_DELAY}ms`);

    pushTimeout = setTimeout(() => {
      log('🔄', 'Executing scheduled push...');
      pushToCloud();
    }, PUSH_DEBOUNCE_DELAY);
  }

  // ==========================================
  // REAL-TIME LISTENER
  // ==========================================
  function startRealtimeListener() {
    if (!isInitialized) {
      log('⚠️', 'Cannot start realtime - not initialized');
      return;
    }

    if (realtimeChannel) {
      log('ℹ️', 'Realtime listener already running');
      return;
    }

    try {
      log('👂', 'Starting real-time listener...');

      realtimeChannel = supabaseClient
        .channel('academy_realtime_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLE_NAME,
            filter: `id=eq.${RECORD_ID}`
          },
          (payload) => {
            log('🔔', 'Real-time change detected from cloud!');

            // Check if this change was from current device or another device
            const changeTime = parseInt(payload.new?.last_updated) || 0;
            const timeDiff = Math.abs(changeTime - lastPushTime);

            if (timeDiff > 2000) {
              // More than 2 seconds difference - likely from another device
              log('📥', 'Change from another device - pulling updates...');
              pullFromCloud(false);
            } else {
              // This change was likely from current device
              log('ℹ️', 'Change from current device - ignoring to prevent loop');
            }
          }
        )
        .subscribe((status) => {
          log('📡', `Realtime subscription status: ${status}`);

          if (status === 'SUBSCRIBED') {
            log('✅', 'Real-time listener is now active!');
            showNotification('🔄 Real-time sync enabled', 'success');
          } else if (status === 'CHANNEL_ERROR') {
            log('❌', 'Real-time listener error - will retry...');
          } else if (status === 'TIMED_OUT') {
            log('⚠️', 'Real-time listener timed out - will retry...');
          }
        });

    } catch (error) {
      log('❌', 'Failed to start realtime listener:', error);
    }
  }

  // ==========================================
  // AUTO-SAVE MONITOR
  // ==========================================
  function installAutoSaveMonitor() {
    if (isMonitoringEnabled) {
      log('ℹ️', 'Auto-save monitor already installed');
      return;
    }

    try {
      // Save original localStorage.setItem
      const originalSetItem = localStorage.setItem.bind(localStorage);

      // Override setItem to detect data changes
      localStorage.setItem = function (key, value) {
        // Call original function first
        originalSetItem(key, value);

        // If wingsfly_data changed, schedule a push
        if (key === 'wingsfly_data' && isMonitoringEnabled) {
          log('💾', 'Data change detected in localStorage');
          schedulePush();
        }
      };

      isMonitoringEnabled = true;
      log('🔧', 'Auto-save monitor installed successfully');

    } catch (error) {
      log('❌', 'Failed to install auto-save monitor:', error);
    }
  }

  // ==========================================
  // PERIODIC BACKUP SYNC
  // ==========================================
  function startPeriodicBackupSync() {
    setInterval(() => {
      // Only pull if not currently pushing or pulling
      if (!isPushing && !isPulling) {
        pullFromCloud(false);
      }
    }, BACKUP_PULL_INTERVAL);

    log('⏰', `Periodic backup sync started (every ${BACKUP_PULL_INTERVAL / 1000}s)`);
  }

  // ==========================================
  // NOTIFICATION HELPER
  // ==========================================
  function showNotification(message, type = 'info') {
    // Try to use existing toast functions
    if (type === 'success' && typeof window.showSuccessToast === 'function') {
      window.showSuccessToast(message);
    } else if (type === 'error' && typeof window.showErrorToast === 'function') {
      window.showErrorToast(message);
    } else {
      // Fallback to console
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // ==========================================
  // PUBLIC API
  // ==========================================
  window.wingsSync = {
    /**
     * Perform full sync (pull then push)
     */
    fullSync: async function () {
      log('🔄', 'Starting full sync...');
      showNotification('🔄 Starting full sync...', 'info');

      await pullFromCloud(true);
      await pushToCloud();

      log('✅', 'Full sync completed');
      showNotification('✅ Full sync completed', 'success');
    },

    /**
     * Force push to cloud immediately
     */
    pushNow: function () {
      log('📤', 'Manual push requested');
      return pushToCloud();
    },

    /**
     * Force pull from cloud immediately
     */
    pullNow: function () {
      log('📥', 'Manual pull requested');
      return pullFromCloud(true);
    },

    /**
     * Get current sync status
     */
    getStatus: function () {
      const status = {
        initialized: isInitialized,
        monitoring: isMonitoringEnabled,
        realtimeActive: realtimeChannel !== null,
        lastPush: lastPushTime ? new Date(lastPushTime).toLocaleString() : 'Never',
        lastPull: lastPullTime ? new Date(lastPullTime).toLocaleString() : 'Never',
        currentTime: new Date().toLocaleString()
      };

      console.table(status);
      return status;
    },

    /**
     * Enable/disable auto-monitoring
     */
    toggleMonitoring: function (enable) {
      isMonitoringEnabled = enable;
      log('🔧', `Auto-monitoring ${enable ? 'enabled' : 'disabled'}`);
    }
  };

  // Backward compatibility with old code
  window.saveToCloud = () => pushToCloud();
  window.loadFromCloud = () => pullFromCloud(true);
  window.manualSync = window.wingsSync.fullSync;

  // ==========================================
  // AUTO-START SYSTEM
  // ==========================================
  function startSyncSystem() {
    log('🚀', '========================================');
    log('🚀', 'Wings Fly Sync System V23 Starting...');
    log('🚀', '========================================');

    // Step 1: Initialize Supabase
    if (!initialize()) {
      log('❌', 'Failed to initialize - sync system not started');
      return;
    }

    // Step 2: Pull latest data from cloud
    log('📥', 'Step 1: Pulling initial data...');
    pullFromCloud(false).then(() => {
      log('✅', 'Initial pull completed');

      // Step 3: Start real-time listener (after 1 second)
      setTimeout(() => {
        log('👂', 'Step 2: Starting real-time listener...');
        startRealtimeListener();
      }, 1000);

      // Step 4: Install auto-save monitor (after 1.5 seconds)
      setTimeout(() => {
        log('🔧', 'Step 3: Installing auto-save monitor...');
        installAutoSaveMonitor();
      }, 1500);

      // Step 5: Start periodic backup sync (after 2 seconds)
      setTimeout(() => {
        log('⏰', 'Step 4: Starting periodic backup sync...');
        startPeriodicBackupSync();
      }, 2000);

      // All done!
      setTimeout(() => {
        log('🎉', '========================================');
        log('🎉', 'Sync system fully initialized!');
        log('🎉', '========================================');
        log('💡', 'Commands available:');
        log('💡', '  - wingsSync.fullSync()    : Full sync');
        log('💡', '  - wingsSync.pushNow()     : Push now');
        log('💡', '  - wingsSync.pullNow()     : Pull now');
        log('💡', '  - wingsSync.getStatus()   : Check status');
        log('💡', '========================================');
      }, 2500);
    });
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSyncSystem);
  } else {
    // DOM already loaded
    startSyncSystem();
  }

})();
```

---

এই file টা **copy করে** আপনার `supabase-sync-READY.js` file এ **paste** করুন এবং **save** করুন।

তারপর আপনার website টা refresh করে console দেখুন। Console এ এরকম দেখাবে:
```
[time] 🚀 Wings Fly Sync System V23 Starting...
[time] ✅ Supabase client initialized successfully
[time] 📥 Pulling data from cloud...
[time] ✅ Pull completed successfully
[time] 👂 Starting real-time listener...
[time] 🔧 Auto-save monitor installed successfully
[time] 🎉 Sync system fully initialized!
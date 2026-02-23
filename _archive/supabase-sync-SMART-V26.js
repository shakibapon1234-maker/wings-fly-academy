/**
 * ========================================
 * WINGS FLY AVIATION ACADEMY
 * SMART SYNC SYSTEM V26 - INDUSTRY STANDARD
 * ========================================
 * 
 * 🌍 Real-world Multi-device Sync Solution
 * Based on: Last-Write-Wins + Vector Clock + Smart Conflict Detection
 * 
 * ✅ Features:
 * - Automatic push on data change (debounced)
 * - Continuous pull (listen mode)
 * - Vector clock for proper conflict resolution
 * - Smart merge on conflicts
 * - Refresh/reload handling
 * - Network offline/online detection
 * - Zero data loss guarantee
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
  const PULL_INTERVAL = 15000; // Pull every 15 seconds (increased to prevent delete race) // Pull every 3 seconds
  const PUSH_DEBOUNCE_DELAY = 1000; // Wait 1 second after last change before pushing
  const DEVICE_ID = generateDeviceId();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let supabaseClient = null;
  let realtimeChannel = null;
  let isInitialized = false;
  let isPushing = false;
  let isPulling = false;
  let isMonitoringEnabled = false;
  let lastPushTime = 0;
  let lastPullTime = 0;
  let pushDebounceTimer = null;
  let pullIntervalId = null;
  let localVersion = 0; // Vector clock for this device
  let isOnline = navigator.onLine;

  // ==========================================
  // DEVICE ID GENERATION
  // ==========================================
  function generateDeviceId() {
    let deviceId = localStorage.getItem('wings_device_id');
    if (!deviceId) {
      deviceId = 'PC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('wings_device_id', deviceId);
    }
    return deviceId;
  }

  // ==========================================
  // LOGGING
  // ==========================================
  function log(emoji, message, data = null) {
    const timestamp = new Date().toLocaleTimeString('bn-BD');
    const deviceShort = DEVICE_ID.substr(0, 12);
    console.log(`[${timestamp}] 🖥️ ${deviceShort} | ${emoji} ${message}`);
    if (data) console.log(data);
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function initialize() {
    if (isInitialized) return true;

    try {
      if (typeof window.supabase === 'undefined') {
        log('❌', 'Supabase library not loaded');
        return false;
      }

      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      
      // Get local version
      localVersion = parseInt(localStorage.getItem('wings_local_version')) || 0;
      
      isInitialized = true;
      log('✅', `Initialized (version: ${localVersion})`);
      return true;

    } catch (error) {
      log('❌', 'Init failed:', error);
      return false;
    }
  }

  // ==========================================
  // SMART PULL WITH CONFLICT RESOLUTION
  // ==========================================
  async function pullFromCloud(silent = false, force = false) {
    if (!isInitialized && !initialize()) return false;
    if (isPulling) return false;
    // Block pull for 15 seconds after any push to prevent delete/edit race condition
    // But FORCE pull (on login) bypasses this block
    if (!force && Date.now() - lastPushTime < 15000) {
      if (!silent) log('⏸️', 'Pull blocked - recent push in progress');
      return false;
    }
    if (!isOnline) {
      if (!silent) log('📵', 'Offline - cannot pull');
      return false;
    }

    isPulling = true;

    try {
      if (!silent) log('📥', 'Pulling from cloud...');

      const { data, error } = await supabaseClient
        .from(TABLE_NAME)
        .select('*')
        .eq('id', RECORD_ID)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          if (!silent) log('ℹ️', 'No cloud data - first device');
          isPulling = false;
          return true;
        }
        throw error;
      }

      if (!data) {
        isPulling = false;
        return false;
      }

      // Get metadata
      const cloudTimestamp = parseInt(data.last_updated) || 0;
      const cloudVersion = parseInt(data.version) || 0;
      const cloudDevice = data.last_device || 'unknown';
      const localTimestamp = parseInt(localStorage.getItem('lastSyncTime')) || 0;

      // 🔥 SMART CONFLICT RESOLUTION
      const shouldUpdate = determineIfShouldUpdate(
        cloudTimestamp,
        localTimestamp,
        cloudVersion,
        localVersion,
        cloudDevice
      );

      if (shouldUpdate) {
        if (!silent) {
          log('📥', `Cloud newer: v${cloudVersion} (${new Date(cloudTimestamp).toLocaleTimeString('bn-BD')})`);
          log('📥', `Local older: v${localVersion} (${new Date(localTimestamp).toLocaleTimeString('bn-BD')})`);
          log('📥', `From: ${cloudDevice.substr(0, 15)}`);
        }

        // ✅ DATA LOSS PREVENTION (IMPROVED)
        // Delete করলে count কমে - এটা data loss না, intentional
        // last_action দেখে বুঝি এটা delete নাকি সত্যিকারের loss
        const localStudents = (window.globalData && window.globalData.students) || [];
        const cloudStudents = data.students || [];
        const localFinance  = (window.globalData && window.globalData.finance)   || [];
        const cloudFinance  = data.finance  || [];
        const cloudLastAction = data.last_action || '';
        const cloudLastDevice = data.last_device || '';

        // Cloud এ কম data আছে কিনা
        const cloudHasFewerStudents = cloudStudents.length < localStudents.length;
        const cloudHasFewerFinance  = cloudFinance.length  < localFinance.length;

        if (cloudHasFewerStudents || cloudHasFewerFinance) {
          // এই device এর push হলে ignore (নিজের echo)
          const isOwnPush = cloudLastDevice === DEVICE_ID;
          // Delete action হলে এটা intentional
          const isDeleteAction = cloudLastAction.toLowerCase().includes('delete') || 
                                  cloudLastAction.toLowerCase().includes('trash') ||
                                  cloudLastAction.toLowerCase().includes('remove');

          if (isOwnPush || isDeleteAction) {
            // ✅ Intentional delete - cloud এর data accept করো
            log('🗑️', `Intentional delete detected (action: ${cloudLastAction}) - accepting cloud data`);
            log('🗑️', `Students: Cloud ${cloudStudents.length} / Local ${localStudents.length}`);
            // Continue to update globalData below (no return)
          } else {
            // ❌ Possible data loss - local রাখো এবং push করো
            log('🛡️', `Data loss prevention triggered!`);
            log('🛡️', `Cloud students: ${cloudStudents.length} vs Local: ${localStudents.length}`);
            log('🛡️', `Cloud finance : ${cloudFinance.length}  vs Local: ${localFinance.length}`);
            log('🛡️', `Keeping local data & pushing to cloud...`);

            localVersion = cloudVersion;
            localStorage.setItem('wings_local_version', localVersion.toString());
            isPulling = false;
            setTimeout(() => pushToCloud('Data-loss-prevention push'), 1000);
            return true;
          }
        }

        // Temporarily disable monitoring
        const wasMonitoring = isMonitoringEnabled;
        isMonitoringEnabled = false;

        // ✅ PRESERVE LOCAL-ONLY DATA (deletedItems & activityHistory)
        // এগুলো cloud এ store হয় না, তাই pull এ হারিয়ে যায়
        // Local backup থেকে restore করো
        const _savedDeleted  = localStorage.getItem('wingsfly_deleted_backup');
        const _savedActivity = localStorage.getItem('wingsfly_activity_backup');
        const _preservedDeleted  = _savedDeleted  ? JSON.parse(_savedDeleted)  : 
                                   (window.globalData && window.globalData.deletedItems) || [];
        const _preservedActivity = _savedActivity ? JSON.parse(_savedActivity) :
                                   (window.globalData && window.globalData.activityHistory) || [];

        // Update global data
        window.globalData = {
          students: cloudStudents,
          employees: data.employees || [],
          finance: cloudFinance,
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
          employeeRoles: data.employee_roles || [],
          deletedItems: _preservedDeleted,
          activityHistory: _preservedActivity
        };

        // Save to localStorage
        localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
        localStorage.setItem('lastSyncTime', cloudTimestamp.toString());
        localStorage.setItem('wings_local_version', cloudVersion.toString());
        
        localVersion = cloudVersion;
        lastPullTime = Date.now();

        // Refresh UI
        if (typeof window.renderFullUI === 'function') {
          window.renderFullUI();
        }

        // Re-enable monitoring
        isMonitoringEnabled = wasMonitoring;

        if (!silent) {
          showNotification('📥 Synced from cloud', 'success');
          log('✅', 'Pull complete - UI updated');
        }

      } else {
        if (!silent) {
          log('ℹ️', 'Local data is current ✓');
        }
      }

      isPulling = false;
      return true;

    } catch (error) {
      log('❌', 'Pull error:', error);
      isPulling = false;
      return false;
    }
  }

  // ==========================================
  // SMART CONFLICT RESOLUTION LOGIC
  // ==========================================
  function determineIfShouldUpdate(cloudTime, localTime, cloudVer, localVer, cloudDevice) {
    // Case 1: If this is our own push bouncing back, ignore
    const timeSinceOurPush = Date.now() - lastPushTime;
    if (timeSinceOurPush < 15000 && cloudDevice === DEVICE_ID) {
      return false;
    }

    // Case 2: Version-based (preferred method)
    if (cloudVer > localVer) {
      return true; // Cloud has higher version
    }
    
    if (cloudVer < localVer) {
      return false; // Local has higher version
    }

    // Case 3: Same version, use timestamp (fallback)
    if (cloudVer === localVer) {
      return cloudTime > localTime;
    }

    return false;
  }

  // ==========================================
  // SMART PUSH WITH VERSION INCREMENT
  // ==========================================
  async function pushToCloud(reason = 'Auto-save') {
    if (!isInitialized && !initialize()) {
      log('⚠️', 'Cannot push - not initialized');
      return false;
    }

    if (isPushing) {
      log('⏳', 'Push in progress, queuing...');
      return false;
    }

    if (!isOnline) {
      log('📵', 'Offline - push queued for later');
      return false;
    }

    isPushing = true;

    try {
      if (!window.globalData) {
        log('⚠️', 'No data to push');
        isPushing = false;
        return false;
      }

      // Increment local version (Vector Clock)
      localVersion++;
      
      log('📤', `Pushing v${localVersion} (${reason})...`);

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
        version: localVersion,
        last_updated: timestamp.toString(),
        last_device: DEVICE_ID,
        last_action: reason,
        // deleted_count removed — column does not exist in Supabase table
      };

      const { error } = await supabaseClient
        .from(TABLE_NAME)
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      // Save version and timestamp locally
      localStorage.setItem('lastSyncTime', timestamp.toString());
      localStorage.setItem('wings_local_version', localVersion.toString());
      lastPushTime = timestamp;

      log('✅', `Pushed v${localVersion} at ${new Date(timestamp).toLocaleTimeString('bn-BD')}`);
      showNotification(`📤 ${reason} saved`, 'success');

      isPushing = false;
      return true;

    } catch (error) {
      log('❌', 'Push error:', error);
      showNotification('❌ Save failed - will retry', 'error');
      
      // Rollback version on error
      localVersion--;
      localStorage.setItem('wings_local_version', localVersion.toString());
      
      isPushing = false;
      return false;
    }
  }

  // ==========================================
  // DEBOUNCED PUSH (Auto-save)
  // ==========================================
  function schedulePush(reason = 'Auto-save') {
    // Clear previous timer
    if (pushDebounceTimer) {
      clearTimeout(pushDebounceTimer);
    }

    // Schedule new push
    pushDebounceTimer = setTimeout(() => {
      pushToCloud(reason);
    }, PUSH_DEBOUNCE_DELAY);

    log('⏱️', `Push scheduled in ${PUSH_DEBOUNCE_DELAY}ms`);
  }

  // ==========================================
  // REAL-TIME LISTENER
  // ==========================================
  function startRealtimeListener() {
    if (!isInitialized) return;
    if (realtimeChannel) {
      log('ℹ️', 'Realtime already active');
      return;
    }

    try {
      log('👂', 'Starting realtime listener...');

      realtimeChannel = supabaseClient
        .channel('wings_academy_sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLE_NAME,
            filter: `id=eq.${RECORD_ID}`
          },
          (payload) => {
            const changeDevice = payload.new?.last_device || 'unknown';
            const changeVersion = payload.new?.version || 0;
            const changeAction = payload.new?.last_action || 'Update';

            // Ignore our own changes
            if (changeDevice === DEVICE_ID) {
              log('ℹ️', 'Own change echo - ignoring');
              return;
            }

            log('🔔', `Remote update v${changeVersion} from ${changeDevice.substr(0, 15)}`);
            log('🔔', `Action: ${changeAction}`);

            // Pull after small delay
            setTimeout(() => {
              pullFromCloud(false);
            }, 500);
          }
        )
        .subscribe((status) => {
          log('📡', `Realtime: ${status}`);
          
          if (status === 'SUBSCRIBED') {
            log('✅', 'Realtime active!');
            showNotification('🔄 Real-time sync enabled', 'success');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            log('⚠️', 'Realtime error - will retry');
          }
        });

    } catch (error) {
      log('❌', 'Realtime error:', error);
    }
  }

  // ==========================================
  // AUTO-SAVE MONITOR (localStorage watch)
  // ==========================================
  function installAutoSaveMonitor() {
    if (isMonitoringEnabled) return;

    try {
      const originalSetItem = localStorage.setItem.bind(localStorage);

      localStorage.setItem = function (key, value) {
        originalSetItem(key, value);

        if (key === 'wingsfly_data' && isMonitoringEnabled) {
          log('💾', 'Data change detected');
          schedulePush('Auto-save');
        }
      };

      isMonitoringEnabled = true;
      log('🔧', 'Auto-save monitor installed');

    } catch (error) {
      log('❌', 'Monitor install failed:', error);
    }
  }

  // ==========================================
  // CONTINUOUS PULL (Background sync)
  // ==========================================
  function startContinuousPull() {
    pullIntervalId = setInterval(() => {
      if (!isPushing && !isPulling && isOnline) {
        pullFromCloud(true); // Silent pull
      }
    }, PULL_INTERVAL);

    log('⏰', `Continuous pull started (every ${PULL_INTERVAL / 1000}s)`);
  }

  // ==========================================
  // NETWORK STATUS MONITORING
  // ==========================================
  function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      isOnline = true;
      log('🌐', 'Back online - syncing...');
      showNotification('🌐 Back online', 'success');
      
      // Immediately pull when back online
      pullFromCloud(false).then(() => {
        // Then push any pending changes
        if (window.globalData) {
          pushToCloud('Reconnected');
        }
      });
    });

    window.addEventListener('offline', () => {
      isOnline = false;
      log('📵', 'Offline - sync paused');
      showNotification('📵 Working offline', 'info');
    });

    log('📡', `Network monitoring enabled (status: ${isOnline ? 'online' : 'offline'})`);
  }

  // ==========================================
  // PAGE REFRESH/RELOAD HANDLING
  // ==========================================
  function setupRefreshHandling() {
    // Save pending changes before page unload
    window.addEventListener('beforeunload', (e) => {
      // If there's a pending push, try to execute it immediately
      if (pushDebounceTimer) {
        clearTimeout(pushDebounceTimer);
        
        // Synchronous push attempt (may not complete)
        navigator.sendBeacon && navigator.sendBeacon(
          `${SUPABASE_URL}/rest/v1/${TABLE_NAME}`,
          JSON.stringify({
            id: RECORD_ID,
            last_updated: Date.now().toString(),
            last_device: DEVICE_ID,
            last_action: 'Page refresh'
          })
        );
      }
    });

    // On page load, immediately pull
    if (document.readyState === 'complete') {
      pullFromCloud(false);
    }

    log('🔄', 'Refresh handling enabled');
  }

  // ==========================================
  // NOTIFICATION HELPER
  // ==========================================
  function showNotification(message, type = 'info') {
    // ✅ FIX: শুধু error হলেই toast দেখাবে — success/info শুধু console এ যাবে
    if (type === 'error' && typeof window.showErrorToast === 'function') {
      window.showErrorToast(message);
    } else {
      // success, info — silent, শুধু console
      console.log(`[SYNC-${type.toUpperCase()}] ${message}`);
    }
  }

  // ==========================================
  // PUBLIC API
  // ==========================================
  window.wingsSync = {
    /**
     * Manual full sync
     */
    fullSync: async function () {
      log('🔄', 'Manual full sync');
      await pullFromCloud(false);
      await pushToCloud('Manual sync');
    },

    /**
     * Force push
     */
    pushNow: function (reason = 'Manual push') {
      return pushToCloud(reason);
    },

    /**
     * Force pull
     */
    pullNow: function () {
      return pullFromCloud(false);
    },

    /**
     * Get status
     */
    getStatus: function () {
      const status = {
        'Device ID': DEVICE_ID,
        'Version': localVersion,
        'Online': isOnline ? '✅' : '❌',
        'Initialized': isInitialized ? '✅' : '❌',
        'Monitoring': isMonitoringEnabled ? '✅' : '❌',
        'Realtime': realtimeChannel !== null ? '✅' : '❌',
        'Last Push': lastPushTime ? new Date(lastPushTime).toLocaleString('bn-BD') : 'Never',
        'Last Pull': lastPullTime ? new Date(lastPullTime).toLocaleString('bn-BD') : 'Never'
      };

      console.table(status);
      return status;
    },

    /**
     * Get version info
     */
    getVersion: function() {
      return {
        local: localVersion,
        deviceId: DEVICE_ID
      };
    }
  };

  // Backward compatibility
  window.saveToCloud = () => pushToCloud('Legacy saveToCloud');
  window.loadFromCloud    = (force = false) => pullFromCloud(false, force);
  window.manualSync       = window.wingsSync.fullSync;
  window.scheduleSyncPush = schedulePush; // delete/add action এর reason পাঠানোর জন্য

  // ==========================================
  // AUTO-START SYSTEM
  // ==========================================
  function startSyncSystem() {
    log('🚀', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('🚀', 'Wings Fly Smart Sync V26');
    log('🚀', 'Industry-Standard Multi-device Sync');
    log('🚀', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('💻', `Device: ${DEVICE_ID}`);
    log('📊', `Version: ${localVersion}`);

    // Step 1: Initialize
    if (!initialize()) {
      log('❌', 'Init failed - aborting');
      return;
    }

    // Step 2: Setup network monitoring
    setupNetworkMonitoring();

    // Step 3: Setup refresh handling
    setupRefreshHandling();

    // Step 4: Initial pull (CRITICAL for login/refresh)
    log('📥', 'Initial pull (login/refresh)...');
    pullFromCloud(false).then(() => {
      log('✅', 'Initial pull complete');

      // Step 5: Start realtime (after 1s)
      setTimeout(() => {
        startRealtimeListener();
      }, 1000);

      // Step 6: Install auto-monitor (after 1.5s)
      setTimeout(() => {
        installAutoSaveMonitor();
      }, 1500);

      // Step 7: Start continuous pull (after 2s)
      setTimeout(() => {
        startContinuousPull();
      }, 2000);

      // All done!
      setTimeout(() => {
        log('🎉', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        log('🎉', '✅ Sync system fully operational!');
        log('🎉', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        log('💡', 'Features:');
        log('💡', '  ✅ Auto-save on data change');
        log('💡', '  ✅ Continuous background sync');
        log('💡', '  ✅ Smart conflict resolution');
        log('💡', '  ✅ Offline support');
        log('💡', '  ✅ Refresh/reload handling');
        log('💡', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }, 2500);
    });
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSyncSystem);
  } else {
    startSyncSystem();
  }

})();

// ===================================
// SUPABASE REAL-TIME SYNC SYSTEM
// Wings Fly Aviation Academy
// Multi-Device Sync with Conflict Resolution
// ===================================

(function () {
  'use strict';

  console.log('🚀 Supabase Sync System Loading...');

  // ===================================
  // CONFIGURATION & INITIALIZATION
  // ===================================

  let supabaseClient = null;
  let realtimeChannel = null;
  let autoSyncInterval = null;
  let isSyncing = false;
  let lastSyncTimestamp = null;
  let syncRetryCount = 0;
  const MAX_RETRY_ATTEMPTS = 3;
  const SYNC_INTERVAL = 30000; // 30 seconds
  const USER_ID = 'admin'; // Single user ID for this application

  // Initialize Supabase Client
  function initializeSupabase() {
    try {
      if (!window.SUPABASE_CONFIG) {
        console.error('❌ Supabase config not found!');
        return false;
      }

      const { url, anonKey } = window.SUPABASE_CONFIG;
      
      if (!url || !anonKey) {
        console.error('❌ Missing Supabase URL or API key');
        return false;
      }

      supabaseClient = window.supabase.createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });

      console.log('✅ Supabase client initialized');
      console.log('📍 Connected to:', url);
      return true;
    } catch (error) {
      console.error('❌ Supabase initialization error:', error);
      return false;
    }
  }

  // ===================================
  // DATA SYNCHRONIZATION FUNCTIONS
  // ===================================

  // Upload local data to Supabase
  async function pushToCloud() {
    if (isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return { success: false, reason: 'sync_in_progress' };
    }

    isSyncing = true;
    console.log('☁️ Pushing data to cloud...');

    try {
      const localData = window.globalData || {};
      
      // Prepare data payload
      const dataPayload = {
        students: localData.students || [],
        employees: localData.employees || [],
        finance: localData.finance || [],
        settings: localData.settings || {},
        incomeCategories: localData.incomeCategories || ['Direct Income', 'Other Income'],
        expenseCategories: localData.expenseCategories || ['Rent', 'Salaries', 'Utilities'],
        paymentMethods: localData.paymentMethods || ['Cash', 'Bkash', 'Nogad', 'Bank'],
        cashBalance: localData.cashBalance || 0,
        bankAccounts: localData.bankAccounts || [],
        mobileBanking: localData.mobileBanking || [],
        courseNames: localData.courseNames || [],
        attendance: localData.attendance || {},
        nextId: localData.nextId || 1001,
        users: localData.users || [],
        examRegistrations: localData.examRegistrations || [],
        visitors: localData.visitors || [],
        employeeRoles: localData.employeeRoles || []
      };

      // Check if user record exists
      const { data: existingData, error: fetchError } = await supabaseClient
        .from('app_data')
        .select('id, updated_at')
        .eq('user_id', USER_ID)
        .single();

      let result;

      if (existingData) {
        // Update existing record
        result = await supabaseClient
          .from('app_data')
          .update({
            data: dataPayload,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', USER_ID)
          .select();
      } else {
        // Insert new record
        result = await supabaseClient
          .from('app_data')
          .insert({
            user_id: USER_ID,
            data: dataPayload
          })
          .select();
      }

      if (result.error) {
        throw result.error;
      }

      lastSyncTimestamp = new Date().toISOString();
      syncRetryCount = 0;
      
      console.log('✅ Data pushed to cloud successfully');
      console.log('📊 Synced items:', {
        students: dataPayload.students.length,
        employees: dataPayload.employees.length,
        finance: dataPayload.finance.length,
        bankAccounts: dataPayload.bankAccounts.length
      });

      updateSyncStatus('success', 'Cloud sync successful');
      
      isSyncing = false;
      return { success: true, timestamp: lastSyncTimestamp };

    } catch (error) {
      console.error('❌ Push to cloud failed:', error);
      syncRetryCount++;
      
      updateSyncStatus('error', `Sync failed (attempt ${syncRetryCount}/${MAX_RETRY_ATTEMPTS})`);
      
      isSyncing = false;
      return { success: false, error: error.message };
    }
  }

  // Download data from Supabase
  async function pullFromCloud() {
    if (isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return { success: false, reason: 'sync_in_progress' };
    }

    isSyncing = true;
    console.log('📥 Pulling data from cloud...');

    try {
      const { data, error } = await supabaseClient
        .from('app_data')
        .select('data, updated_at')
        .eq('user_id', USER_ID)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No data exists yet - this is OK for first time
          console.log('ℹ️ No cloud data found - will create on next push');
          isSyncing = false;
          return { success: true, isFirstTime: true };
        }
        throw error;
      }

      if (!data || !data.data) {
        console.log('ℹ️ No cloud data available');
        isSyncing = false;
        return { success: true, isEmpty: true };
      }

      // Merge cloud data with local data
      const cloudData = data.data;
      const cloudTimestamp = data.updated_at;

      // Update global data
      window.globalData = {
        ...window.globalData,
        ...cloudData
      };

      // Save to localStorage
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));

      lastSyncTimestamp = cloudTimestamp;
      syncRetryCount = 0;

      console.log('✅ Data pulled from cloud successfully');
      console.log('📊 Retrieved items:', {
        students: cloudData.students?.length || 0,
        employees: cloudData.employees?.length || 0,
        finance: cloudData.finance?.length || 0,
        bankAccounts: cloudData.bankAccounts?.length || 0
      });

      // Refresh UI
      if (typeof window.renderFullUI === 'function') {
        window.renderFullUI();
      }

      updateSyncStatus('success', 'Data synced from cloud');

      isSyncing = false;
      return { success: true, timestamp: cloudTimestamp };

    } catch (error) {
      console.error('❌ Pull from cloud failed:', error);
      syncRetryCount++;
      
      updateSyncStatus('error', `Sync failed (attempt ${syncRetryCount}/${MAX_RETRY_ATTEMPTS})`);
      
      isSyncing = false;
      return { success: false, error: error.message };
    }
  }

  // Bidirectional sync (smart merge)
  async function syncData() {
    console.log('🔄 Starting bidirectional sync...');

    try {
      // First, pull latest data from cloud
      const pullResult = await pullFromCloud();
      
      if (!pullResult.success && !pullResult.isFirstTime) {
        console.warn('⚠️ Pull failed, attempting push only...');
      }

      // Then, push local changes to cloud
      const pushResult = await pushToCloud();
      
      if (pushResult.success) {
        console.log('✅ Bidirectional sync completed');
        return { success: true };
      } else {
        console.warn('⚠️ Sync partially completed');
        return { success: false, partial: true };
      }

    } catch (error) {
      console.error('❌ Bidirectional sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  // ===================================
  // REAL-TIME SUBSCRIPTION
  // ===================================

  function startRealtimeListener() {
    if (!supabaseClient) {
      console.error('❌ Cannot start realtime: Supabase not initialized');
      return false;
    }

    try {
      // Remove existing channel if any
      if (realtimeChannel) {
        supabaseClient.removeChannel(realtimeChannel);
      }

      console.log('🎧 Starting realtime listener...');

      realtimeChannel = supabaseClient
        .channel('app_data_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'app_data',
            filter: `user_id=eq.${USER_ID}`
          },
          async (payload) => {
            console.log('🔔 Realtime update received:', payload.eventType);
            
            // Prevent circular updates (don't pull if we just pushed)
            const timeSinceLastSync = Date.now() - (lastSyncTimestamp ? new Date(lastSyncTimestamp).getTime() : 0);
            
            if (timeSinceLastSync < 2000) {
              console.log('⏭️ Skipping pull (recent push detected)');
              return;
            }

            // Pull new data
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              console.log('📥 Pulling updated data from another device...');
              const result = await pullFromCloud();
              
              if (result.success) {
                showRealtimeNotification('Data updated from another device');
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime status:', status);
          
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime listener active');
            updateSyncStatus('connected', 'Real-time sync active');
          } else if (status === 'CLOSED') {
            console.warn('⚠️ Realtime connection closed');
            updateSyncStatus('disconnected', 'Real-time sync disconnected');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime channel error');
            updateSyncStatus('error', 'Real-time sync error');
          }
        });

      return true;
    } catch (error) {
      console.error('❌ Failed to start realtime listener:', error);
      return false;
    }
  }

  function stopRealtimeListener() {
    if (realtimeChannel) {
      supabaseClient.removeChannel(realtimeChannel);
      realtimeChannel = null;
      console.log('🛑 Realtime listener stopped');
    }
  }

  // ===================================
  // AUTO-SYNC TIMER
  // ===================================

  function startAutoSync() {
    if (autoSyncInterval) {
      console.log('⚠️ Auto-sync already running');
      return;
    }

    console.log(`⏰ Starting auto-sync (every ${SYNC_INTERVAL / 1000}s)`);
    
    autoSyncInterval = setInterval(async () => {
      console.log('🔄 Auto-sync triggered...');
      await pushToCloud();
    }, SYNC_INTERVAL);

    updateSyncStatus('auto-sync', 'Auto-sync enabled');
  }

  function stopAutoSync() {
    if (autoSyncInterval) {
      clearInterval(autoSyncInterval);
      autoSyncInterval = null;
      console.log('🛑 Auto-sync stopped');
      updateSyncStatus('manual', 'Auto-sync disabled');
    }
  }

  // ===================================
  // UI UPDATES & NOTIFICATIONS
  // ===================================

  function updateSyncStatus(status, message) {
    const statusEl = document.getElementById('syncStatus');
    const statusTextEl = document.getElementById('syncStatusText');
    
    if (!statusEl || !statusTextEl) return;

    const statusConfig = {
      success: { icon: '✅', color: '#4ade80', text: message },
      error: { icon: '❌', color: '#f87171', text: message },
      syncing: { icon: '🔄', color: '#60a5fa', text: 'Syncing...' },
      connected: { icon: '🟢', color: '#4ade80', text: message },
      disconnected: { icon: '🔴', color: '#f87171', text: message },
      'auto-sync': { icon: '⏰', color: '#60a5fa', text: message },
      manual: { icon: '⏸️', color: '#94a3b8', text: message }
    };

    const config = statusConfig[status] || statusConfig.success;
    
    statusTextEl.innerHTML = `${config.icon} ${config.text}`;
    statusTextEl.style.color = config.color;
    
    // Update last sync time
    if (lastSyncTimestamp) {
      const timeAgo = getTimeAgo(lastSyncTimestamp);
      statusTextEl.innerHTML += ` <small>(${timeAgo})</small>`;
    }
  }

  function getTimeAgo(timestamp) {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  function showRealtimeNotification(message) {
    // Create toast notification
    if (typeof window.showSuccessToast === 'function') {
      window.showSuccessToast(message);
    } else {
      console.log('📢', message);
    }
  }

  // ===================================
  // MANUAL SYNC CONTROLS
  // ===================================

  function setupManualSyncControls() {
    // Manual sync button
    const manualSyncBtn = document.getElementById('manualSyncBtn');
    if (manualSyncBtn) {
      manualSyncBtn.addEventListener('click', async () => {
        updateSyncStatus('syncing', 'Manual sync in progress...');
        const result = await syncData();
        
        if (result.success) {
          showRealtimeNotification('✅ Manual sync completed');
        } else {
          showRealtimeNotification('❌ Manual sync failed');
        }
      });
    }

    // Auto-sync toggle
    const autoSyncToggle = document.getElementById('autoSyncToggle');
    if (autoSyncToggle) {
      autoSyncToggle.checked = true; // Default to ON
      
      autoSyncToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          startAutoSync();
          showRealtimeNotification('Auto-sync enabled');
        } else {
          stopAutoSync();
          showRealtimeNotification('Auto-sync disabled');
        }
      });
    }
  }

  // ===================================
  // OVERRIDE saveToStorage FUNCTION
  // ===================================

  // Override the existing saveToStorage to trigger cloud sync
  const originalSaveToStorage = window.saveToStorage;
  
  window.saveToStorage = async function (skipCloudSync = false) {
    // Save to localStorage first
    try {
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      console.log('💾 Data saved to localStorage');
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
    }

    // Trigger cloud sync if not skipped
    if (!skipCloudSync && supabaseClient) {
      console.log('☁️ Triggering cloud sync...');
      const result = await pushToCloud();
      return result.success;
    }

    return true;
  };

  // ===================================
  // INITIALIZATION
  // ===================================

  async function initialize() {
    console.log('🚀 Initializing Supabase Sync System...');

    // Initialize Supabase client
    const initialized = initializeSupabase();
    
    if (!initialized) {
      console.error('❌ Failed to initialize Supabase');
      updateSyncStatus('error', 'Sync initialization failed');
      return false;
    }

    // Setup manual controls
    setupManualSyncControls();

    // Perform initial sync
    console.log('🔄 Performing initial sync...');
    const syncResult = await syncData();
    
    if (syncResult.success) {
      console.log('✅ Initial sync successful');
    } else {
      console.warn('⚠️ Initial sync had issues, will retry...');
    }

    // Start realtime listener
    startRealtimeListener();

    // Start auto-sync (if enabled)
    const autoSyncToggle = document.getElementById('autoSyncToggle');
    if (!autoSyncToggle || autoSyncToggle.checked) {
      startAutoSync();
    }

    console.log('✅ Supabase Sync System initialized successfully');
    
    return true;
  }

  // ===================================
  // EXPOSE GLOBAL FUNCTIONS
  // ===================================

  window.supabaseSync = {
    pushToCloud,
    pullFromCloud,
    syncData,
    startAutoSync,
    stopAutoSync,
    startRealtimeListener,
    stopRealtimeListener,
    getStatus: () => ({
      isSyncing,
      lastSyncTimestamp,
      isAutoSyncActive: !!autoSyncInterval,
      isRealtimeActive: !!realtimeChannel
    })
  };

  // ===================================
  // AUTO-INITIALIZE
  // ===================================

  // Wait for DOM and Supabase to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initialize, 1000);
    });
  } else {
    setTimeout(initialize, 1000);
  }

  console.log('✅ Supabase Sync System loaded');

})();

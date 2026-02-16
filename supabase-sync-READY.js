// ===================================
// SUPABASE CONFIGURATION
// Real-time Multi-user Sync System
// ===================================
// ✅ CREDENTIALS ALREADY CONFIGURED - Ready to use!

const SUPABASE_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';

// Supabase client initialization
let sbClient = null;
let isSupabaseReady = false;
let realtimeChannel = null;
let hasLoadedFromCloud = false; // Safety flag

/**
 * Initialize Supabase client
 */
function initializeSupabase() {
  try {
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      console.error('❌ Supabase library not loaded. Add this to your HTML:');
      console.error('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
      return false;
    }

    // Create Supabase client
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (!sbClient) {
      console.error('❌ Failed to create Supabase client');
      return false;
    }

    isSupabaseReady = true;
    console.log('✅ Supabase initialized successfully');
    console.log('📡 Server:', SUPABASE_URL);

    return true;
  } catch (error) {
    console.error('❌ Supabase initialization error:', error);
    return false;
  }
}

/**
 * Save data to Supabase
 * @param {boolean} showNotification - Show toast notification
 * @returns {Promise<boolean>}
 */
async function saveToCloud(showNotification = true) {
  if (!isSupabaseReady) {
    console.warn('⚠️ Supabase not ready. Saving locally only.');
    return false;
  }

  try {
    const currentUser = sessionStorage.getItem('username') || 'unknown';
    const timestamp = new Date().toISOString();

    // 🛡️ SAFETY CHECK: Don't save if local data is empty and we haven't loaded from cloud yet
    const hasLocalData = (window.globalData.students && window.globalData.students.length > 0) ||
      (window.globalData.finance && window.globalData.finance.length > 0);

    if (!hasLocalData && !hasLoadedFromCloud) {
      console.warn('🛡️ Sync blocked: Local data is empty and cloud data not yet verified. Prevents accidental wipe.');
      return false;
    }

    // Prepare data for cloud storage
    const cloudData = {
      id: 'wingsfly_main',
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
      last_updated: timestamp,
      updated_by: currentUser
    };

    // Upsert data
    const { data, error } = await sbClient
      .from('academy_data')
      .upsert(cloudData, { onConflict: 'id' });

    if (error) {
      console.error('❌ Supabase save error:', error);
      if (showNotification && typeof showErrorToast === 'function') {
        showErrorToast('⚠️ Cloud sync failed: ' + error.message);
      }
      return false;
    }

    console.log('☁️ Data synced to Supabase successfully');
    localStorage.setItem('lastCloudUpdate', timestamp);

    if (showNotification && typeof showSuccessToast === 'function') {
      showSuccessToast('☁️ Data synced to cloud');
    }

    return true;
  } catch (error) {
    console.error('❌ Cloud sync error:', error);
    if (showNotification && typeof showErrorToast === 'function') {
      showErrorToast('⚠️ Sync failed. Data saved locally.');
    }
    return false;
  }
}

/**
 * Load data from Supabase
 */
async function loadFromCloud(showNotification = true) {
  if (!isSupabaseReady) {
    console.warn('⚠️ Supabase not ready. Loading from localStorage only.');
    return false;
  }

  try {
    const { data, error } = await sbClient
      .from('academy_data')
      .select('*')
      .eq('id', 'wingsfly_main')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('📝 No cloud data found correctly. This might be a new database.');
        // If we have local data, let's push it, otherwise just stop
        if (window.globalData && window.globalData.students && window.globalData.students.length > 0) {
          console.log('📤 Pushing existing local data to new cloud database...');
          await saveToCloud(false);
        } else {
          console.log('ℹ️ New device and no cloud data. Starting with fresh state.');
        }
        return true;
      }

      console.error('❌ Supabase load error:', error);
      if (showNotification && typeof showErrorToast === 'function') {
        showErrorToast('⚠️ Failed to load from cloud: ' + error.message);
      }
      return false;
    }

    if (!data) {
      console.log('📝 No cloud data available');
      return false;
    }

    console.log('📊 Cloud data received from:', data.updated_by);
    console.log('📅 Last updated:', new Date(data.last_updated).toLocaleString());

    // Update global data
    hasLoadedFromCloud = true; // Mark as safely loaded
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

    localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
    localStorage.setItem('lastCloudUpdate', data.last_updated);

    console.log('✅ Data loaded from cloud successfully');

    if (showNotification && typeof showSuccessToast === 'function') {
      showSuccessToast('✅ Synced with cloud');
    }

    refreshAllUI();
    return true;
  } catch (error) {
    console.error('❌ Cloud load error:', error);
    if (showNotification && typeof showErrorToast === 'function') {
      showErrorToast('⚠️ Failed to sync from cloud');
    }
    return false;
  }
}

/**
 * Refresh all UI components
 */
function refreshAllUI() {
  try {
    if (typeof render === 'function') render(window.globalData.students);
    if (typeof renderFinanceTable === 'function') renderFinanceTable();
    if (typeof renderEmployeeList === 'function') renderEmployeeList();
    if (typeof renderAccountList === 'function') renderAccountList();
    if (typeof renderMobileBankingList === 'function') renderMobileBankingList();
    if (typeof renderCashBalance === 'function') renderCashBalance();
    if (typeof updateGrandTotal === 'function') updateGrandTotal();
    if (typeof updateCharts === 'function') updateCharts();
  } catch (error) {
    console.error('Error refreshing UI:', error);
  }
}

/**
 * Start real-time listener
 */
function startRealtimeSync() {
  if (!isSupabaseReady) {
    console.warn('⚠️ Supabase not ready. Real-time sync disabled.');
    return;
  }

  if (realtimeChannel) {
    console.log('🎧 Real-time listener already running');
    return;
  }

  try {
    const currentUser = sessionStorage.getItem('username') || 'unknown';

    realtimeChannel = sbClient
      .channel('academy_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'academy_data',
          filter: `id=eq.wingsfly_main`
        },
        (payload) => {
          console.log('🔄 Real-time change detected:', payload);

          const updatedBy = payload.new?.updated_by || 'unknown';

          if (updatedBy !== currentUser) {
            console.log(`📥 Updating data from: ${updatedBy}`);

            window.globalData = {
              students: payload.new.students || [],
              employees: payload.new.employees || [],
              finance: payload.new.finance || [],
              settings: payload.new.settings || {},
              incomeCategories: payload.new.income_categories || [],
              expenseCategories: payload.new.expense_categories || [],
              paymentMethods: payload.new.payment_methods || [],
              cashBalance: payload.new.cash_balance || 0,
              bankAccounts: payload.new.bank_accounts || [],
              mobileBanking: payload.new.mobile_banking || [],
              courseNames: payload.new.course_names || [],
              attendance: payload.new.attendance || {},
              nextId: payload.new.next_id || 1001,
              users: payload.new.users || [],
              examRegistrations: payload.new.exam_registrations || [],
              visitors: payload.new.visitors || [],
              employeeRoles: payload.new.employee_roles || []
            };

            localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
            refreshAllUI();

            if (typeof showSuccessToast === 'function') {
              showSuccessToast(`🔄 Data updated by ${updatedBy}`);
            }
          } else {
            console.log('ℹ️ Ignoring own update');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('🎧 Real-time sync active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time connection error');
        } else if (status === 'TIMED_OUT') {
          console.warn('⏱️ Real-time connection timed out');
        }
      });

    console.log('🎧 Real-time listener started');
  } catch (error) {
    console.error('❌ Failed to start real-time sync:', error);
  }
}

/**
 * Stop real-time listener
 */
function stopRealtimeSync() {
  if (realtimeChannel) {
    sbClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
    console.log('🛑 Real-time sync stopped');
  }
}

/**
 * Manual Sync - Public function for UI buttons
 */
async function manualSync() {
  console.log('🔄 Manual sync triggered...');
  if (typeof showSuccessToast === 'function') showSuccessToast('🔄 Syncing...');

  // 1. Force load from cloud
  const loadOk = await loadFromCloud(true);

  // 2. Refresh local UI
  if (typeof refreshUI === 'function') refreshUI();
  if (typeof renderDashboard === 'function') renderDashboard();

  // 3. Save current state back (merging handled by loadOk logic if implemented)
  await saveToCloud(true);

  return true;
}

/**
 * Auto-sync interval
 */
let autoSyncInterval = null;

function startAutoSync(intervalSeconds = 30) {
  if (autoSyncInterval) {
    console.log('⏰ Auto-sync already running');
    return;
  }

  autoSyncInterval = setInterval(async () => {
    console.log('⏰ Auto-sync: Checking for updates...');
    await loadFromCloud(false);
  }, intervalSeconds * 1000);

  console.log(`⏰ Auto-sync started (checking every ${intervalSeconds}s)`);
}

function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
    console.log('⏹️ Auto-sync stopped');
  }
}

/**
 * Upload photo to Supabase Storage
 */
async function uploadPhotoToCloud(studentId, file) {
  if (!isSupabaseReady) {
    console.warn('⚠️ Supabase Storage not available. Saving locally.');
    return processAndSaveStudentPhoto(studentId, file);
  }

  try {
    const fileName = `${studentId}_${Date.now()}.jpg`;
    const filePath = `student_photos/${fileName}`;

    const { data, error } = await sbClient.storage
      .from('student-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Photo upload error:', error);
      return processAndSaveStudentPhoto(studentId, file);
    }

    const { data: urlData } = sbClient.storage
      .from('student-photos')
      .getPublicUrl(filePath);

    const publicURL = urlData.publicUrl;
    console.log('☁️ Photo uploaded to cloud:', publicURL);

    return publicURL;
  } catch (error) {
    console.error('❌ Photo upload error:', error);
    return processAndSaveStudentPhoto(studentId, file);
  }
}

/**
 * Delete photo from cloud
 */
async function deletePhotoFromCloud(photoURL) {
  if (!isSupabaseReady || !photoURL) return;

  try {
    const urlParts = photoURL.split('/student_photos/');
    if (urlParts.length < 2) return;

    const filePath = `student_photos/${urlParts[1]}`;

    const { error } = await sbClient.storage
      .from('student-photos')
      .remove([filePath]);

    if (error) {
      console.error('❌ Photo delete error:', error);
    } else {
      console.log('🗑️ Photo deleted from cloud');
    }
  } catch (error) {
    console.error('❌ Photo delete error:', error);
  }
}

/**
 * Check connection status
 */
async function checkCloudConnection() {
  if (!isSupabaseReady) {
    return { status: 'offline', message: 'Supabase not initialized' };
  }

  try {
    const { data, error } = await sbClient
      .from('academy_data')
      .select('last_updated')
      .eq('id', 'wingsfly_main')
      .single();

    if (error) {
      return { status: 'error', message: error.message };
    }

    return {
      status: 'online',
      message: 'Connected',
      lastUpdate: data?.last_updated
    };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

// Export functions
window.initializeSupabase = initializeSupabase;
window.saveToCloud = saveToCloud;
window.loadFromCloud = loadFromCloud;
window.startRealtimeSync = startRealtimeSync;
window.stopRealtimeSync = stopRealtimeSync;
window.startAutoSync = startAutoSync;
window.stopAutoSync = stopAutoSync;
window.uploadPhotoToCloud = uploadPhotoToCloud;
window.deletePhotoFromCloud = deletePhotoFromCloud;
window.checkCloudConnection = checkCloudConnection;
window.refreshAllUI = refreshAllUI;
window.manualSync = manualSync;
window.smartSync = manualSync; // Alias for UI

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing Supabase multi-user sync system...');
  const initialized = initializeSupabase();

  if (initialized) {
    console.log('✅ Supabase ready for multi-user collaboration');
    // Start initial sync sequence
    setTimeout(async () => {
      console.log('🏁 Starting initial data pull...');
      await loadFromCloud(true);
      startRealtimeSync();
      startAutoSync(30);
    }, 1000);
  } else {
    console.log('📴 Running in offline mode (localStorage only)');
  }
});

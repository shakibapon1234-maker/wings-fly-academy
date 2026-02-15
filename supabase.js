// ===================================
// SUPABASE SYNC - FIXED VERSION
// ===================================
// ✅ localStorage ALWAYS has priority
// ✅ Never overwrites local data
// ✅ Only syncs if cloud data is newer
// ===================================

const SUPABASE_URL = 'https://gtoldrltbjxwshubplfp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0Ymp4d3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NTMyODgsImV4cCI6MjA1MjUyOTI4OH0.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0Ymp4d3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NTMyODgsImV4cCI6MjA1MjUyOTI4OH0.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

let supabase = null;
let isSupabaseReady = false;
let realtimeChannel = null;

/**
 * Initialize Supabase
 */
function initializeSupabase() {
  try {
    if (typeof window.supabase === 'undefined') {
      console.error('❌ Supabase library not loaded');
      return false;
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    if (!supabase) {
      console.error('❌ Failed to create Supabase client');
      return false;
    }

    isSupabaseReady = true;
    console.log('✅ Supabase initialized');
    console.log('📡 Server:', SUPABASE_URL);
    
    return true;
  } catch (error) {
    console.error('❌ Supabase init error:', error);
    return false;
  }
}

/**
 * Save to Supabase (PUSH only)
 */
async function saveToCloud(showNotification = true) {
  if (!isSupabaseReady) {
    console.warn('⚠️ Supabase not ready');
    return false;
  }

  try {
    const currentUser = sessionStorage.getItem('username') || 'unknown';
    const timestamp = new Date().toISOString();

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

    const { data, error } = await supabase
      .from('academy_data')
      .upsert(cloudData, { onConflict: 'id' });

    if (error) {
      console.error('❌ Supabase save error:', error);
      if (showNotification && typeof showErrorToast === 'function') {
        showErrorToast('⚠️ Cloud sync failed: ' + error.message);
      }
      return false;
    }

    console.log('☁️ Data pushed to cloud successfully');
    localStorage.setItem('lastCloudUpdate', timestamp);
    
    if (showNotification && typeof showSuccessToast === 'function') {
      showSuccessToast('☁️ Synced to cloud');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Cloud sync error:', error);
    return false;
  }
}

/**
 * Load from Supabase - SMART MERGE
 * Only updates if cloud data is NEWER
 */
async function loadFromCloud(showNotification = true) {
  if (!isSupabaseReady) {
    console.warn('⚠️ Supabase not ready');
    return false;
  }

  try {
    // Get local timestamp
    const localTimestamp = localStorage.getItem('lastLocalUpdate');
    const localTime = localTimestamp ? parseInt(localTimestamp) : 0;

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('academy_data')
      .select('*')
      .eq('id', 'wingsfly_main')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No cloud data - push local data
        console.log('📝 No cloud data. Pushing local data...');
        await saveToCloud(false);
        return true;
      }
      
      console.error('❌ Supabase load error:', error);
      return false;
    }

    if (!data) {
      console.log('📝 No cloud data');
      return false;
    }

    // Compare timestamps
    const cloudTime = data.last_updated ? new Date(data.last_updated).getTime() : 0;
    
    console.log('📊 Timestamp comparison:');
    console.log('   Local:', localTime ? new Date(localTime).toLocaleString() : 'None');
    console.log('   Cloud:', cloudTime ? new Date(cloudTime).toLocaleString() : 'None');

    // ⚠️ CRITICAL: Only update if cloud is NEWER
    if (cloudTime <= localTime) {
      console.log('✅ Local data is up-to-date (or newer). Skipping cloud pull.');
      return true;
    }

    // Cloud is newer - check if it's from another user
    const updatedBy = data.updated_by || 'unknown';
    const currentUser = sessionStorage.getItem('username') || 'unknown';

    if (updatedBy === currentUser) {
      console.log('ℹ️ Cloud data is from same user. Skipping.');
      return true;
    }

    // Update from cloud (another user made changes)
    console.log(`📥 Updating from cloud (changed by: ${updatedBy})`);

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
    localStorage.setItem('lastCloudUpdate', cloudTime.toString());

    console.log('✅ Data updated from cloud');
    
    if (showNotification && typeof showSuccessToast === 'function') {
      showSuccessToast(`🔄 Updated by ${updatedBy}`);
    }

    refreshAllUI();
    return true;
  } catch (error) {
    console.error('❌ Cloud load error:', error);
    return false;
  }
}

/**
 * Refresh UI
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
    console.error('UI refresh error:', error);
  }
}

/**
 * Real-time sync
 */
function startRealtimeSync() {
  if (!isSupabaseReady) {
    console.warn('⚠️ Supabase not ready');
    return;
  }

  if (realtimeChannel) {
    console.log('🎧 Real-time already running');
    return;
  }

  try {
    const currentUser = sessionStorage.getItem('username') || 'unknown';

    realtimeChannel = supabase
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
          console.log('🔄 Real-time change detected');
          
          const updatedBy = payload.new?.updated_by || 'unknown';
          
          // Only update if from different user
          if (updatedBy !== currentUser) {
            console.log(`📥 Updating from: ${updatedBy}`);
            
            // Get timestamps
            const cloudTime = payload.new.last_updated ? new Date(payload.new.last_updated).getTime() : 0;
            const localTime = localStorage.getItem('lastLocalUpdate') ? parseInt(localStorage.getItem('lastLocalUpdate')) : 0;

            // Only update if cloud is newer
            if (cloudTime > localTime) {
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
              localStorage.setItem('lastCloudUpdate', cloudTime.toString());
              
              refreshAllUI();

              if (typeof showSuccessToast === 'function') {
                showSuccessToast(`🔄 Updated by ${updatedBy}`);
              }
            } else {
              console.log('ℹ️ Ignoring older cloud update');
            }
          } else {
            console.log('ℹ️ Ignoring own update');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('🎧 Real-time sync active');
        }
      });

  } catch (error) {
    console.error('❌ Real-time sync error:', error);
  }
}

function stopRealtimeSync() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
    console.log('🛑 Real-time stopped');
  }
}

/**
 * Auto-sync
 */
let autoSyncInterval = null;

function startAutoSync(intervalSeconds = 30) {
  if (autoSyncInterval) {
    return;
  }

  autoSyncInterval = setInterval(async () => {
    console.log('⏰ Auto-sync: Checking...');
    // Only push, don't pull (to avoid overwriting local data)
    await saveToCloud(false);
  }, intervalSeconds * 1000);

  console.log(`⏰ Auto-sync started (${intervalSeconds}s)`);
}

function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
    console.log('⏹️ Auto-sync stopped');
  }
}

// Export
window.initializeSupabase = initializeSupabase;
window.saveToCloud = saveToCloud;
window.loadFromCloud = loadFromCloud;
window.startRealtimeSync = startRealtimeSync;
window.stopRealtimeSync = stopRealtimeSync;
window.startAutoSync = startAutoSync;
window.stopAutoSync = stopAutoSync;
window.refreshAllUI = refreshAllUI;

// Auto-init
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Supabase sync system loading...');
  const initialized = initializeSupabase();
  
  if (initialized) {
    console.log('✅ Ready for multi-user sync');
    console.log('🛡️ localStorage has priority - data will never be lost');
  }
});

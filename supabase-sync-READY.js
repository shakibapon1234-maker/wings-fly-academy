/**
 * SUPABASE SYNC SYSTEM - V21 (REAL-TIME SHIELDED SYNC)
 * 🛡️ Anti-Zero Protection: Never overwrites local with older cloud data.
 * ⚡ Real-time: Listens for changes and updates UI instantly.
 */

(function () {
  'use strict';

  var SYNC_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
  var SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';

  window.sbSyncClient = null;
  var isReady = false;
  var hasFetched = false;
  var isProcessingSync = false;

  function init() {
    if (window.sbSyncClient) return true;
    try {
      if (typeof window.supabase === 'undefined') return false;
      window.sbSyncClient = window.supabase.createClient(SYNC_URL, SYNC_KEY);
      isReady = true;
      return true;
    } catch (e) { return false; }
  }

  /**
   * PULL: Just Collects Data
   */
  async function pull(force = false) {
    if (!isReady || !window.sbSyncClient) { if (!init()) return; }
    if (isProcessingSync && !force) return;

    isProcessingSync = true;
    try {
      const { data, error } = await window.sbSyncClient
        .from('academy_data')
        .select('*')
        .eq('id', 'wingsfly_main')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        console.log('ℹ️ Cloud is clean.');
        hasFetched = true;
        isProcessingSync = false;
        return;
      }

      const cloudTime = parseInt(data.last_updated) || 0;
      const localTime = parseInt(localStorage.getItem('lastLocalUpdate')) || 0;

      // PREVENT OVERWRITING LOCAL WITH OLDER CLOUD DATA (CRITICAL)
      if (!force && cloudTime <= localTime && hasFetched) {
        isProcessingSync = false;
        return;
      }

      console.log('📥 Sycing data from cloud...');

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
      localStorage.setItem('lastLocalUpdate', cloudTime.toString());

      hasFetched = true;

      // Update UI
      if (typeof window.renderFullUI === 'function') {
        window.renderFullUI();
        console.log('✨ UI Re-rendered from cloud data.');
      }
    } catch (e) { console.error('Pull Error:', e); }
    isProcessingSync = false;
  }

  /**
   * PUSH: Action Sender
   */
  async function push() {
    if (!isReady || !window.sbSyncClient) { if (!init()) return; }
    if (!window.globalData) return;

    // Data Loss Protection: Don't push if we haven't successfully pulled yet
    if (!hasFetched) {
      console.warn('🛡️ Blocked: Waiting for first pull to avoid overwrite.');
      return;
    }

    try {
      const updateTime = Date.now().toString();
      const payload = {
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
        last_updated: updateTime
      };

      const { error } = await window.sbSyncClient.from('academy_data').upsert(payload);
      if (error) throw error;

      localStorage.setItem('lastLocalUpdate', updateTime);
      console.log('📤 Cloud saved successfully.');
      return true;
    } catch (e) { console.error('Push Error:', e); return false; }
  }

  /**
   * REAL-TIME LISTENER
   */
  function startRealtime() {
    if (!window.sbSyncClient) return;
    const channel = window.sbSyncClient.channel('realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'academy_data' }, (payload) => {
        console.log('🔥 Real-time change detected on Cloud!');
        pull(false);
      })
      .subscribe();
  }

  window.saveToCloud = function () { return push(); };
  window.loadFromCloud = function (force = false) { return pull(force); };

  window.manualSync = async function () {
    if (typeof showSuccessToast === 'function') showSuccessToast('🔄 Full Sync started...');
    await pull(true); // Always pull from cloud first to merge
    await push();
    if (typeof showSuccessToast === 'function') showSuccessToast('✅ Sync Complete');
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (init()) {
      console.log('🟢 Wings Fly Shielded Sync (V21) Ready.');
      setTimeout(() => {
        pull(false).then(() => {
          startRealtime(); // Listen for others' changes
          // Regular fallback pull every 10s
          setInterval(() => pull(false), 10000);
        });
      }, 1000);
    }
  });

})();

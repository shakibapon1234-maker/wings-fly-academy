/**
 * SUPABASE SYNC SYSTEM - V16 (DOWNTIME & DATA-LOSS PROTECTION)
 * 🛡️ Anti-Overwrite Protection Enabled
 */

(function () {
  'use strict';

  var SYNC_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
  var SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';

  window.sbSyncClient = null;
  var isReady = false;
  var hasFetched = false; // Safety flag
  var syncInProgress = false;

  function init() {
    if (window.sbSyncClient) return true;
    try {
      if (typeof window.supabase === 'undefined') return false;
      window.sbSyncClient = window.supabase.createClient(SYNC_URL, SYNC_KEY);
      isReady = true;
      return true;
    } catch (e) { return false; }
  }

  async function pull(force = false) {
    if (!isReady || !window.sbSyncClient) { if (!init()) return; }
    if (syncInProgress && !force) return;

    syncInProgress = true;
    try {
      const { data, error } = await window.sbSyncClient.from('academy_data').select('*').eq('id', 'wingsfly_main').single();

      // If No Cloud Record Exists (First time using the app)
      if (error && error.code === 'PGRST116') {
        console.log('ℹ️ Cloud empty. Ready for first push.');
        hasFetched = true; // Allow pushing since we confirmed cloud is empty
        syncInProgress = false;
        return;
      }

      if (error || !data) {
        syncInProgress = false;
        return;
      }

      const cloudTime = parseInt(data.last_updated) || 0;
      const localTime = parseInt(localStorage.getItem('lastLocalUpdate')) || 0;

      // Only overwrite local if cloud is strictly newer OR we haven't fetched yet
      if (!force && cloudTime <= localTime && hasFetched) {
        syncInProgress = false;
        return;
      }

      console.log('📥 Syncing newer data from cloud...');

      // Map strictly to window.globalData
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

      // Global backup update
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      localStorage.setItem('lastLocalUpdate', cloudTime.toString());

      hasFetched = true; // Now safe to push local changes

      // Update UI
      if (typeof window.renderFullUI === 'function') {
        window.renderFullUI();
        console.log('✅ UI Updated from Cloud.');
      }
    } catch (e) { console.error('Cloud Pull Error:', e); }
    syncInProgress = false;
  }

  async function push(isManual = false) {
    if (!isReady || !window.sbSyncClient) { if (!init()) return false; }

    // 🛡️ DATA LOSS PROTECTION:
    // Never push if we haven't successfully checked the cloud yet.
    // This prevents an empty PC from overwriting the Main PC's data on startup.
    if (!hasFetched && !isManual) {
      console.warn('🛡️ Sync Shield: Push blocked until first cloud pull completes.');
      return false;
    }

    if (!window.globalData || !window.globalData.students) return false;

    try {
      const updateTime = Date.now().toString();
      const payload = {
        id: 'wingsfly_main',
        students: window.globalData.students,
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
      return true;
    } catch (e) {
      console.error('Cloud Push Error:', e);
      return false;
    }
  }

  // Bind hooks for app.js
  window.saveToCloud = function () { return push(false); };
  window.loadFromCloud = function (force = false) { return pull(force); };

  window.manualSync = async function () {
    if (typeof showSuccessToast === 'function') showSuccessToast('🔄 Synchronizing...');
    const pushed = await push(true);
    const pulled = await pull(true);
    if (pushed && pulled && typeof showSuccessToast === 'function') {
      showSuccessToast('✅ Sync Complete');
    }
  };

  // Auto-Initialization
  document.addEventListener('DOMContentLoaded', () => {
    if (init()) {
      console.log('🟢 Wings Fly Shielded Sync Engine Ready');
      // Small delay to let app.js load its local data first
      setTimeout(() => {
        pull(false); // Initial Pull
        // Faster interval for real-time feel (2 seconds)
        setInterval(() => pull(false), 2000);
      }, 1000);
    }
  });

})();

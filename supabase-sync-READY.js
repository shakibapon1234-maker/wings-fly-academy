/**
 * SUPABASE SYNC SYSTEM - V12 (ULTRA REAL-TIME ENABLED)
 * Optimized for Wings Fly Aviation Academy
 */

(function () {
  'use strict';

  // Configuration
  var SYNC_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
  var SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';

  // State
  window.sbSyncClient = null;
  var isReady = false;
  var hasFetched = false;
  var autoSyncInterval = null;

  /**
   * Initialize Supabase Client
   */
  function init() {
    if (window.sbSyncClient) return true;
    try {
      if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase library missing');
        return false;
      }
      window.sbSyncClient = window.supabase.createClient(SYNC_URL, SYNC_KEY);
      isReady = true;
      return true;
    } catch (e) {
      console.error('❌ Supabase Init Error:', e);
      return false;
    }
  }

  /**
   * Refresh individual UI components of app.js
   */
  window.refreshAllUI = function () {
    console.log('🔄 Performing UI Refresh...');
    try {
      // These functions are expected in app.js
      if (typeof renderRecentAdmissions === 'function') renderRecentAdmissions();
      if (typeof render === 'function') render(window.globalData.students || []);
      if (typeof renderLedger === 'function') renderLedger(window.globalData.finance || []);
      if (typeof renderDashboard === 'function') {
        if (typeof updateGlobalStats === 'function') updateGlobalStats();
        renderDashboard();
      }
      if (typeof renderCashBalance === 'function') renderCashBalance();
      if (typeof updateGrandTotal === 'function') updateGrandTotal();
      if (typeof updateDashboardBankBalance === 'function') updateDashboardBankBalance();
      if (typeof populateDropdowns === 'function') populateDropdowns();
    } catch (e) {
      console.warn('⚠️ UI Refresh partial failure:', e);
    }
  };

  /**
   * Pull data from Cloud (Supabase)
   */
  async function pull(force = false) {
    if (!isReady || !window.sbSyncClient) {
      if (!init()) return false;
    }

    try {
      const { data, error } = await window.sbSyncClient
        .from('academy_data')
        .select('*')
        .eq('id', 'wingsfly_main')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ No cloud record found, waiting for first push.');
          hasFetched = true;
          return true;
        }
        throw error;
      }

      if (!data) return false;

      const cloudTime = parseInt(data.last_updated) || 0;
      const localTime = parseInt(localStorage.getItem('lastLocalUpdate')) || 0;

      // Strict timestamp check to avoid loops
      if (!force && cloudTime <= localTime && hasFetched) {
        console.log('✅ Local data is newer or same as cloud.');
        return true;
      }

      console.log('📥 Pulling newer data from cloud...');
      hasFetched = true;

      // Map Supabase columns to app.js globalData structure
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

      // Persistence
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      localStorage.setItem('lastLocalUpdate', cloudTime.toString());

      window.refreshAllUI();
      return true;
    } catch (e) {
      console.error('📥 Cloud Pull Failed:', e);
      return false;
    }
  }

  /**
   * Push data to Cloud (Supabase)
   */
  async function push(isManual = false) {
    if (!isReady || !window.sbSyncClient) {
      if (!init()) return false;
    }

    // Safety lock to prevent accidental cloud wipes
    const studentCount = (window.globalData && window.globalData.students) ? window.globalData.students.length : 0;
    if (studentCount === 0 && !hasFetched && !isManual) {
      console.warn('🛡️ Push blocked: Preventing wipe of cloud data.');
      return false;
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

      const { error } = await window.sbSyncClient
        .from('academy_data')
        .upsert(payload);

      if (error) throw error;

      localStorage.setItem('lastLocalUpdate', updateTime);
      console.log('📤 Cloud Push Successful.');
      return true;
    } catch (e) {
      console.error('📤 Cloud Push Failed:', e);
      return false;
    }
  }

  /**
   * Start/Stop Auto Sync Helpers (Used by app.js)
   */
  window.startAutoSync = function (seconds = 30) {
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    autoSyncInterval = setInterval(() => pull(false), seconds * 1000);
    console.log(`🤖 Auto-Sync active every ${seconds}s`);
  };

  window.stopAutoSync = function () {
    if (autoSyncInterval) clearInterval(autoSyncInterval);
    autoSyncInterval = null;
    console.log('🤖 Auto-Sync paused');
  };

  /**
   * Public wrapper for app.js (Triggered immediately on data change)
   */
  window.saveToCloud = async function () {
    console.log('⚡ Data change detected -> Immediate Cloud Push');
    return await push(false);
  };

  window.loadFromCloud = async function (force = false) {
    return await pull(force);
  };

  window.manualSync = async function () {
    if (typeof showSuccessToast === 'function') showSuccessToast('🔄 Full Synchronizing...');
    hasFetched = true; // Trust local for this session
    const pushed = await push(true);
    const pulled = await pull(true);
    if (pushed && pulled) {
      if (typeof showSuccessToast === 'function') showSuccessToast('✅ Sync Complete');
    }
    return pushed && pulled;
  };

  // Auto-Initialization
  document.addEventListener('DOMContentLoaded', () => {
    if (init()) {
      console.log('🟢 Wings Fly Sync Engine Active');
      // Wait 1.5s then do first pull
      setTimeout(() => {
        pull(false);
        window.startAutoSync(10); // Start ultra-fast 10s auto-pull
      }, 1500);
    }
  });

})();

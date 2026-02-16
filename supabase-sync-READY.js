/**
 * SUPABASE SYNC SYSTEM - V15 (STRICT VARIABLE MAPPING)
 * FIX: 'finance' vs 'finances' conflict resolved.
 */

(function () {
  'use strict';

  var SYNC_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
  var SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';

  window.sbSyncClient = null;
  var isReady = false;
  var hasFetched = false;
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
      if (error || !data) {
        syncInProgress = false;
        return;
      }

      const cloudTime = parseInt(data.last_updated) || 0;
      const localTime = parseInt(localStorage.getItem('lastLocalUpdate')) || 0;

      if (!force && cloudTime <= localTime && hasFetched) {
        syncInProgress = false;
        return;
      }

      console.log('📥 New data detected from another device...');

      // CRITICAL: Strict Mapping to globalData (Matches app.js structure)
      window.globalData = {
        students: data.students || [],
        employees: data.employees || [],
        finance: data.finance || [], // MUST BE SINGULAR 'finance'
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

      // IF UI RENDERER EXISTS, CALL IT IMMEDIATELY
      if (typeof window.renderFullUI === 'function') {
        window.renderFullUI();
      } else {
        console.warn('⚠️ renderFullUI not found. UI might need manual refresh.');
      }
    } catch (e) { console.error('Pull Failed:', e); }
    syncInProgress = false;
  }

  async function push() {
    if (!isReady || !window.sbSyncClient) { if (!init()) return; }
    if (!window.globalData || !window.globalData.students) return;

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

      await window.sbSyncClient.from('academy_data').upsert(payload);
      localStorage.setItem('lastLocalUpdate', updateTime);
      return true;
    } catch (e) { return false; }
  }

  // Public hooks
  window.saveToCloud = function () { return push(); };
  window.loadFromCloud = function (force = false) { return pull(force); };

  window.manualSync = async function () {
    if (typeof showSuccessToast === 'function') showSuccessToast('🔄 Full Synchronizing...');
    await push();
    await pull(true);
    if (typeof showSuccessToast === 'function') showSuccessToast('✅ Sync Success');
  };

  // Auto-check every 3 seconds for almost real-time experience
  document.addEventListener('DOMContentLoaded', () => {
    if (init()) {
      console.log('🟢 Wings Fly V15 Active');
      setTimeout(() => {
        pull(false);
        setInterval(() => pull(false), 3000);
      }, 1000);
    }
  });

})();

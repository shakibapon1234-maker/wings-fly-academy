// ===================================
// SUPABASE SYNC SYSTEM - ULTIMATE FIX
// ===================================

(function () {
  'use strict';

  // Using var to avoid "already declared" errors in global scope
  var SYNC_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
  var SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';

  window.sbSyncClient = null;
  var isReady = false;
  var hasFetched = false;

  function init() {
    if (window.sbSyncClient) return true;

    try {
      if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase library missing');
        return false;
      }
      window.sbSyncClient = window.supabase.createClient(SYNC_URL, SYNC_KEY);
      isReady = true;
      console.log('✅ Sync Client Ready');
      return true;
    } catch (e) {
      console.error('❌ Init error:', e);
      return false;
    }
  }

  async function pull() {
    if (!isReady || !window.sbSyncClient) return;
    try {
      const { data, error } = await window.sbSyncClient.from('academy_data').select('*').eq('id', 'wingsfly_main').single();
      if (error || !data) return;

      hasFetched = true;
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
      if (typeof window.refreshAllUI === 'function') window.refreshAllUI();
      console.log('☁️ Data synced from cloud');
    } catch (e) { console.error(e); }
  }

  async function push() {
    if (!isReady || !window.sbSyncClient || !hasFetched) return;
    try {
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
        last_updated: new Date().toISOString()
      };
      await window.sbSyncClient.from('academy_data').upsert(cloudData);
    } catch (e) { console.error(e); }
  }

  // Export to window
  window.manualSync = async function () {
    console.log('🔄 Syncing...');
    await pull();
    await push();
    if (typeof window.showSuccessToast === 'function') window.showSuccessToast('✅ Synced');
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (init()) {
      setTimeout(pull, 1500);
      setInterval(pull, 60000); // Auto pull every minute
    }
  });

})();

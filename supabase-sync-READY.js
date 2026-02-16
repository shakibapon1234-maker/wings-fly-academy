// ===================================
// SUPABASE SYNC SYSTEM - V10 (SYNC RECOVERY)
// ===================================

(function () {
  'use strict';

  var SYNC_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
  var SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';

  window.sbSyncClient = null;
  var isReady = false;
  var hasFetched = false;

  function init() {
    if (window.sbSyncClient) return true;
    try {
      if (typeof window.supabase === 'undefined') return false;
      window.sbSyncClient = window.supabase.createClient(SYNC_URL, SYNC_KEY);
      isReady = true;
      return true;
    } catch (e) { return false; }
  }

  window.refreshAllUI = function () {
    console.log('🎨 UI Refresh Triggered');
    try {
      if (typeof renderStudents === 'function') renderStudents();
      if (typeof renderFinances === 'function') renderFinances();
      if (typeof renderDashboard === 'function') renderDashboard();
      if (typeof renderBankList === 'function') renderBankList();
      if (typeof renderMobileBankingList === 'function') renderMobileBankingList();
      if (typeof renderEmployeeList === 'function') renderEmployeeList();
    } catch (e) { console.warn('UI Refresh:', e); }
  };

  async function pull(force = false) {
    if (!isReady || !window.sbSyncClient) return;
    try {
      console.log('📥 Checking cloud for data...');
      const { data, error } = await window.sbSyncClient.from('academy_data').select('*').eq('id', 'wingsfly_main').single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Cloud empty. Ready to push local data.');
          hasFetched = true;
          return;
        }
        throw error;
      }

      if (!data) return;

      // SAFETY: If we already have local data from MANUALLY importing, 
      // DON'T let an automatic pull overwrite it unless forced.
      const hasLocalData = window.globalData && window.globalData.students && window.globalData.students.length > 0;
      if (hasLocalData && !force && !hasFetched) {
        console.warn('🛡️ Local data exists. Skipping auto-pull to prevent overwrite. Click SYNC to merge.');
        hasFetched = true;
        return;
      }

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
      window.refreshAllUI();
      console.log('✅ Data pulled and applied from cloud.');
    } catch (e) { console.error('Pull Error:', e); }
  }

  async function push(isManual = false) {
    if (!isReady || !window.sbSyncClient) return;

    // Block auto-push if we haven't pulled yet (safety)
    if (!hasFetched && !isManual) {
      console.warn('🛡️ Auto-push blocked until first successful pull.');
      return;
    }

    try {
      console.log('📤 Pushing data to cloud...');
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

      const { error } = await window.sbSyncClient.from('academy_data').upsert(cloudData);
      if (error) throw error;

      console.log('☁️ Data pushed successfully!');
      if (isManual && typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('✅ Data Saved to Cloud');
      }
    } catch (e) { console.error('Push Error:', e); }
  }

  window.manualSync = async function () {
    console.log('🚀 Manual Sync Started...');
    if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🔄 Syncing...');

    // Since user manually imported, we TRUST the local data now.
    hasFetched = true;
    await push(true);
    await pull(true); // Double check
  };

  window.saveToCloud = function () { push(false); };
  window.loadFromCloud = function () { pull(false); };

  document.addEventListener('DOMContentLoaded', () => {
    if (init()) {
      setTimeout(() => pull(false), 3000);
      setInterval(() => pull(false), 60000);
    }
  });

})();

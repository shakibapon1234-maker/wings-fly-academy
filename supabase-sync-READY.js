/**
 * SUPABASE SYNC SYSTEM - V14 (ULTRA-AUTO-SYNC)
 * Optimized for multi-device real-time collaboration
 */

(function () {
  'use strict';

  var SYNC_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
  var SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';

  window.sbSyncClient = null;
  var isReady = false;
  var hasFetched = false;
  var autoPullInterval = null;

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

    try {
      const { data, error } = await window.sbSyncClient.from('academy_data').select('*').eq('id', 'wingsfly_main').single();
      if (error || !data) {
        if (error && error.code === 'PGRST116') { hasFetched = true; }
        return;
      }

      const cloudTime = parseInt(data.last_updated) || 0;
      const localTime = parseInt(localStorage.getItem('lastLocalUpdate')) || 0;

      // IF NO NEW DATA ON CLOUD, SKIP
      if (!force && cloudTime <= localTime && hasFetched) {
        return;
      }

      console.log('📥 New data found on cloud. Synchronizing UI...');

      // Apply Cloud Data to Global State
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

      // TRIGGER AUTOMATIC UI REFRESH (No manual F5 needed)
      if (typeof window.renderFullUI === 'function') {
        window.renderFullUI();
        console.log('✅ UI Synchronized Automatically.');
      }
    } catch (e) { console.error('Pull Error:', e); }
  }

  async function push(isManual = false) {
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
      console.log('📤 Local changes pushed to cloud.');
      return true;
    } catch (e) { console.error('Push Error:', e); return false; }
  }

  // Exported for app.js
  window.saveToCloud = function () { return push(false); };
  window.loadFromCloud = function (force = false) { return pull(force); };

  window.manualSync = async function () {
    if (typeof showSuccessToast === 'function') showSuccessToast('🔄 Full Syncing...');
    await push(true);
    await pull(true);
    if (typeof showSuccessToast === 'function') showSuccessToast('✅ Sync Success');
  };

  // Auto Pull every 5 seconds (Real-time Feel)
  function startAutoSync() {
    if (autoPullInterval) clearInterval(autoPullInterval);
    autoPullInterval = setInterval(() => pull(false), 5000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (init()) {
      console.log('🟢 Wings Fly Auto-Sync Engine V14 Started');
      setTimeout(() => {
        pull(false); // First pull
        startAutoSync(); // Continuous check
      }, 1000);
    }
  });

})();

/**
 * SUPABASE SYNC SYSTEM - V19 (ACTION-ONLY PUSH)
 * 🛡️ COLLECT ONLY: Periodically checks and pulls data from Cloud.
 * ⚡ PUSH ONLY: Only sends to cloud when a user performs a SAVE action.
 */

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

  /**
   * PULL: The "Collector" - Just collects data from Cloud
   */
  async function pull(force = false) {
    if (!isReady || !window.sbSyncClient) { if (!init()) return; }

    try {
      const { data, error } = await window.sbSyncClient.from('academy_data').select('*').eq('id', 'wingsfly_main').single();
      if (error || !data) {
        if (error && error.code === 'PGRST116') hasFetched = true;
        return;
      }

      const cloudTime = parseInt(data.last_updated) || 0;
      const localTime = parseInt(localStorage.getItem('lastLocalUpdate')) || 0;

      if (!force && cloudTime <= localTime && hasFetched) return;

      console.log('📥 Collecting newest data from cloud...');

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

      // Update UI Automatically
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
    } catch (e) { console.error('Pull Error:', e); }
  }

  /**
   * PUSH: The "Action Sender" - Only sends when triggered by a Save button
   */
  async function push() {
    if (!isReady || !window.sbSyncClient) { if (!init()) return; }

    // Safety: ensure we don't push empty if we have nothing local
    if (!window.globalData || (!window.globalData.students?.length && !window.globalData.finance?.length)) {
      console.warn('🛡️ Shield: Blocking push of empty data.');
      return;
    }

    console.log('� Action Triggered! Pushing data to Cloud...');
    try {
      const updateTime = Date.now().toString();
      const payload = {
        id: 'wingsfly_main',
        students: window.globalData.students,
        finance: window.globalData.finance,
        employees: window.globalData.employees || [],
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
      console.log('✅ Changes pushed successfully.');
      return true;
    } catch (e) { console.error('Push Error:', e); return false; }
  }

  // Expose Hooks for app.js
  window.saveToCloud = function () { return push(); }; // THIS IS CALLED ONLY ON SAVE BUTTON
  window.loadFromCloud = function (force = false) { return pull(force); };

  window.manualSync = async function () {
    await push();
    await pull(true);
    if (typeof showSuccessToast === 'function') showSuccessToast('✅ Sync Success');
  };

  // Auto-Collection Only (Every 3 seconds)
  document.addEventListener('DOMContentLoaded', () => {
    if (init()) {
      console.log('🟢 Wings Fly Action-Driven Sync Active');
      setTimeout(() => {
        pull(false); // First Collection
        setInterval(() => pull(false), 3000); // Keep Collecting
      }, 1000);
    }
  });

})();

/**
 * SUPABASE SYNC SYSTEM - V17 (ACTION-DRIVEN SYNC)
 * 🛡️ Security: Only pushes on local user action. Always pulls periodically.
 */

(function () {
  'use strict';

  var SYNC_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
  var SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';

  window.sbSyncClient = null;
  var isReady = false;
  var lastSyncedTimestamp = 0;

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
   * PULL Logic: "Just Collect" data from Cloud
   */
  async function pull(force = false) {
    if (!isReady || !window.sbSyncClient) { if (!init()) return; }

    try {
      const { data, error } = await window.sbSyncClient.from('academy_data').select('*').eq('id', 'wingsfly_main').single();
      if (error || !data) return;

      const cloudTime = parseInt(data.last_updated) || 0;
      const localTime = parseInt(localStorage.getItem('lastLocalUpdate')) || 0;

      // Only update local if cloud has newer data
      if (!force && cloudTime <= localTime) return;

      console.log('📥 Collecting new data from cloud...');

      // Map strictly to window.globalData (Matches app.js keys exactly)
      window.globalData = {
        students: data.students || [],
        employees: data.employees || [],
        finance: data.finance || [], // Finance correctly mapped
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

      // Save to local disk as backup
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      localStorage.setItem('lastLocalUpdate', cloudTime.toString());

      // Update Screen without refresh
      if (typeof window.renderFullUI === 'function') {
        window.renderFullUI();
      }
    } catch (e) { console.error('Pull Error:', e); }
  }

  /**
   * PUSH Logic: Only triggered when user ADDS/EDITS data locally
   */
  async function push() {
    if (!isReady || !window.sbSyncClient) { if (!init()) return; }
    if (!window.globalData) return;

    console.log('� Local action detected! Sending to cloud...');
    try {
      const updateTime = Date.now().toString();
      const payload = {
        id: 'wingsfly_main',
        students: window.globalData.students || [],
        finance: window.globalData.finance || [],
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

      const { error } = await window.sbSyncClient.from('academy_data').upsert(payload);
      if (!error) {
        localStorage.setItem('lastLocalUpdate', updateTime);
        console.log('✅ Changes successfully saved to cloud.');
      }
    } catch (e) { console.error('Push Error:', e); }
  }

  // Bind to app.js Hooks
  window.saveToCloud = function () { return push(); }; // Called on Save button click
  window.loadFromCloud = function (force = false) { return pull(force); };

  // Auto-Collection (Every 3 seconds)
  document.addEventListener('DOMContentLoaded', () => {
    if (init()) {
      console.log('🟢 Wings Fly Action Sync (V17) Ready.');
      // Initial Pull
      setTimeout(() => pull(false), 1000);
      // Periodic Collection
      setInterval(() => pull(false), 3000);
    }
  });

})();

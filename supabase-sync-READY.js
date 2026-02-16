/**
 * SUPABASE SYNC SYSTEM - V20 (STRICT ACTION LOGIC)
 * � SHIELD: Prevents zero-overwrite cycles.
 * ⚡ TRIGGER: Push only on explicit local action.
 * 📥 RECOVERY: Periodically pulls newer data from cloud.
 */

(function () {
  'use strict';

  var SYNC_URL = 'https://gtoldrltxjrwshubplfp.supabase.co';
  var SYNC_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';

  window.sbSyncClient = null;
  var isReady = false;
  var hasPerformedInitialPull = false;
  var isPushingNow = false;

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
   * PULL: The "Checker"
   * It only downloads data if the Cloud version is strictly NEWER than local.
   */
  async function pull(force = false) {
    if (!isReady || !window.sbSyncClient) { if (!init()) return; }
    if (isPushingNow && !force) return; // Don't pull while we are pushing

    try {
      const { data, error } = await window.sbSyncClient.from('academy_data').select('*').eq('id', 'wingsfly_main').single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        console.log('ℹ️ Cloud is clean/empty.');
        hasPerformedInitialPull = true;
        return;
      }

      const cloudTime = parseInt(data.last_updated) || 0;
      const localTime = parseInt(localStorage.getItem('lastLocalUpdate')) || 0;

      // ONLY OVERWRITE IF CLOUD IS NEWER
      if (!force && cloudTime <= localTime && hasPerformedInitialPull) {
        return;
      }

      console.log('📥 Found newer data on cloud! Updating local device...');

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

      // Save and timestamp
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      localStorage.setItem('lastLocalUpdate', cloudTime.toString());

      hasPerformedInitialPull = true;

      // Trigger UI Update
      if (typeof window.renderFullUI === 'function') {
        window.renderFullUI();
        console.log('✨ UI Updated automatically from cloud data.');
      }
    } catch (e) { console.error('Cloud Pull Error:', e); }
  }

  /**
   * PUSH: The "Action Sender"
   * This is only called when app.js triggers window.saveToCloud()
   */
  async function push() {
    if (!isReady || !window.sbSyncClient) { if (!init()) return false; }

    // Safety lock: Don't push empty data unless confirmed
    if (!window.globalData) return false;
    const hasStudents = window.globalData.students && window.globalData.students.length > 0;
    const hasFinance = window.globalData.finance && window.globalData.finance.length > 0;

    if (!hasStudents && !hasFinance && !hasPerformedInitialPull) {
      console.warn('🛡️ Shield: Blocking accidental push of empty data.');
      return false;
    }

    isPushingNow = true;
    console.log('📤 Action detected! Pushing local changes to Cloud...');
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
      console.log('✅ Cloud Successfully Updated.');
      isPushingNow = false;
      return true;
    } catch (e) {
      console.error('Cloud Push Error:', e);
      isPushingNow = false;
      return false;
    }
  }

  // Expose for app.js
  window.saveToCloud = function () { return push(); };
  window.loadFromCloud = function (force = false) { return pull(force); };

  window.manualSync = async function () {
    if (typeof showSuccessToast === 'function') showSuccessToast('🔄 Full Sync started...');
    await pull(true); // Force pull first
    await push(); // Then push local changes
    if (typeof showSuccessToast === 'function') showSuccessToast('✅ Sync Complete');
  };

  // Auto-Checker (Pull only every 3 seconds)
  document.addEventListener('DOMContentLoaded', () => {
    if (init()) {
      console.log('🟢 Wings Fly Shielded Sync Engine V20 Online');
      setTimeout(() => {
        pull(false); // Initial Check
        setInterval(() => pull(false), 3000); // Continuous Check
      }, 1000);
    }
  });

})();

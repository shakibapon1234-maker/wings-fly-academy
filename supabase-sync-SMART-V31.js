/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * SMART SYNC SYSTEM V31 — PARTIAL UPDATE EDITION
 * ============================================================
 *
 * ✅ V30 এর সব features রেখে নতুন যা যোগ হলো:
 * - Partial push: শুধু বদলানো data পাঠায় (students/finance/employees)
 * - Dirty tracking: কোন array বদলেছে তা track করে
 * - আলাদা Supabase tables: wf_students, wf_finance, wf_employees
 * - Backward compatible: পুরোনো academy_data table ও কাজ করে
 * - Incremental pull: শুধু নতুন/বদলানো records pull করে
 *
 * Author: Wings Fly IT Team
 * Date: March 2026
 * ============================================================
 */

(function () {
  'use strict';

  // ── CONFIGURATION ─────────────────────────────────────────
  const SUPABASE_URL = window.SUPABASE_CONFIG?.URL || 'https://gtoldrltxjrwshubplfp.supabase.co';
  const SUPABASE_KEY = window.SUPABASE_CONFIG?.KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';
  const TABLE_NAME = window.SUPABASE_CONFIG?.TABLE || 'academy_data';
  const RECORD_ID = window.SUPABASE_CONFIG?.MAIN_RECORD || 'wingsfly_main';
  const PULL_INTERVAL = 15000; // 15s
  const PUSH_DEBOUNCE = 1500;  // 1.5s debounce
  const DEVICE_ID = _getDeviceId();

  // ── Partial sync table names ───────────────────────────────
  const TBL_STUDENTS = 'wf_students';
  const TBL_FINANCE = 'wf_finance';
  const TBL_EMPLOYEES = 'wf_employees';
  const ACADEMY_ID = 'wingsfly_main';

  // ── STATE ─────────────────────────────────────────────────
  let supabaseClient = null;
  let isInitialized = false;
  let isPushing = false;
  let isPulling = false;
  let isOnline = navigator.onLine;
  let localVersion = 0;
  let lastPushTime = 0;
  let lastPullTime = 0;
  let pushDebounceTimer = null;
  let pullIntervalId = null;
  let pendingPushReason = null;
  let realtimeChannel = null;
  let realtimeReconnectCount = 0;

  window.initialSyncComplete = false;

  // ── Dirty tracking: কোন arrays বদলেছে ───────────────────
  const _dirty = new Set(); // 'students' | 'finance' | 'employees' | 'meta'

  // ── Last pull timestamps (incremental pull এর জন্য) ──────
  const _lastPull = {
    students: localStorage.getItem('wf_lastpull_students') || null,
    finance: localStorage.getItem('wf_lastpull_finance') || null,
    employees: localStorage.getItem('wf_lastpull_employees') || null,
  };

  // ── Sync Cooldown (Delete Protection) ─────────────────────
  let _lastDeleteCount = parseInt(localStorage.getItem('wings_total_deleted') || '0');
  let _lastDeleteTime = 0;
  const DELETE_COOLDOWN_MS = 180000; // 3 minutes

  // ── পুরোনো tables support আছে কিনা flag ──────────────────
  let _partialTablesReady = false; // Supabase এ wf_students আছে কিনা

  // ── HELPERS ───────────────────────────────────────────────
  function _getDeviceId() {
    let id = localStorage.getItem('wings_device_id');
    if (!id) {
      id = 'PC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('wings_device_id', id);
    }
    return id;
  }

  function log(emoji, msg, data) {
    const t = new Date().toLocaleTimeString('bn-BD');
    console.log(`[${t}] 🖥️ ${DEVICE_ID.substr(0, 12)} | ${emoji} ${msg}`);
    if (data) console.log(data);
  }

  function _save() {
    try {
      if (window.globalData) {
        localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      }
      if (typeof window.saveToStorage === 'function') window.saveToStorage();
    } catch (e) { log('⚠️', 'LocalStorage save error:', e); }
  }

  function showNotification(msg, type) {
    const el = document.getElementById('syncStatusText');
    if (el) el.textContent = msg;
    if (type === 'error') {
      if (typeof window.showErrorToast === 'function') window.showErrorToast(msg);
    }
  }

  // ── INITIALIZATION ────────────────────────────────────────
  function initialize() {
    if (isInitialized) return true;
    try {
      if (typeof window.supabase === 'undefined') { log('❌', 'Supabase not loaded'); return false; }
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      localVersion = parseInt(localStorage.getItem('wings_local_version')) || 0;
      isInitialized = true;
      log('✅', `V31.2 Initialized (v${localVersion})`);
      return true;
    } catch (e) { log('❌', 'Init failed:', e); return false; }
  }

  // ── CHECK: partial tables exist করে? ─────────────────────
  async function _checkPartialTables() {
    try {
      const { error } = await supabaseClient
        .from(TBL_STUDENTS)
        .select('id')
        .limit(1);
      _partialTablesReady = !error;
      log(_partialTablesReady ? '✅' : '⚠️',
        _partialTablesReady
          ? 'Partial sync tables ready (wf_students, wf_finance, wf_employees)'
          : 'Partial tables not found — using legacy single-record sync'
      );
    } catch (e) {
      _partialTablesReady = false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PARTIAL PUSH — শুধু dirty arrays পাঠাও
  // ═══════════════════════════════════════════════════════════
  async function _pushPartial() {
    const gd = window.globalData;
    if (!gd) return;

    const tasks = [];

    // Students dirty?
    if (_dirty.has('students')) {
      tasks.push(_upsertRecords(TBL_STUDENTS, gd.students || []));
      _dirty.delete('students');
    }

    // Finance dirty?
    if (_dirty.has('finance')) {
      tasks.push(_upsertRecords(TBL_FINANCE, gd.finance || []));
      _dirty.delete('finance');
    }

    // Employees dirty?
    if (_dirty.has('employees')) {
      tasks.push(_upsertRecords(TBL_EMPLOYEES, gd.employees || []));
      _dirty.delete('employees');
    }

    await Promise.all(tasks);

    // Meta সবসময় push (settings, cashBalance, version etc)
    await _pushMeta();
    _dirty.delete('meta');
  }

  // Records upsert করো (batch এ, max 100 per request)
  async function _upsertRecords(tableName, records) {
    if (!records || records.length === 0) return;
    const now = new Date().toISOString();
    const rows = records.map(r => ({
      id: r.id || r.rowIndex || ('tmp_' + Date.now() + Math.random()),
      academy_id: ACADEMY_ID,
      data: r,
      updated_at: now,
      deleted: false,
    }));

    // Batch এ পাঠাও (max 100)
    for (let i = 0; i < rows.length; i += 100) {
      const batch = rows.slice(i, i + 100);
      const { error } = await supabaseClient
        .from(tableName)
        .upsert(batch);
      if (error) {
        log('❌', `Partial push error (${tableName}):`, error);
        throw error;
      }
    }
    log('✅', `Partial push: ${records.length} records → ${tableName}`);
  }

  // Meta data push (academy_data table এ)
  async function _pushMeta() {
    const gd = window.globalData;
    if (!gd) return;

    const metaPayload = {
      id: RECORD_ID,
      settings: gd.settings || {},
      income_categories: gd.incomeCategories || [],
      expense_categories: gd.expenseCategories || [],
      payment_methods: gd.paymentMethods || [],
      cash_balance: gd.cashBalance || 0,
      bank_accounts: gd.bankAccounts || [],
      mobile_banking: gd.mobileBanking || [],
      course_names: gd.courseNames || [],
      attendance: gd.attendance || {},
      next_id: gd.nextId || 1001,
      users: gd.users || [],
      exam_registrations: gd.examRegistrations || [],
      visitors: gd.visitors || [],
      employee_roles: gd.employeeRoles || [],
      deleted_items: gd.deletedItems || [],
      activity_history: gd.activityHistory || [],
      keep_records: gd.keepRecords || [],
      loans: gd.loans || [],
      id_cards: gd.idCards || [],
      notices: gd.notices || [],
      // ✅ CRITICAL: Partial push হলেও academy_data তে main arrays আপডেট করো
      // নাহলে অন্য PC পুল করলে পুরোনো ডাটা পাবে।
      students: gd.students || [],
      finance: gd.finance || [],
      employees: gd.employees || [],
      version: localVersion,
      last_updated: new Date().toISOString(),
      last_device: DEVICE_ID,
      last_action: 'partial-sync-meta',
      updated_by: sessionStorage.getItem('username') || 'Admin',
      device_id: DEVICE_ID,
    };

    const { error } = await supabaseClient
      .from(TABLE_NAME)
      .upsert(metaPayload);

    if (error) { log('❌', 'Meta push error:', error); throw error; }
    log('✅', `Meta pushed v${localVersion} (including arrays)`);
  }

  // ═══════════════════════════════════════════════════════════
  // INCREMENTAL PULL — শুধু নতুন records নাও
  // ═══════════════════════════════════════════════════════════
  async function _pullPartial(silent = false) {
    const gd = window.globalData;
    if (!gd) return;

    let anyUpdate = false;

    // Students pull
    const newStudents = await _fetchSince(TBL_STUDENTS, _lastPull.students);
    if (newStudents && newStudents.length > 0) {
      anyUpdate = true;
      const existing = new Map((gd.students || []).map(s => [String(s.id || s.rowIndex), s]));
      newStudents.forEach(row => {
        const key = String(row.id);
        if (row.deleted) {
          existing.delete(key);
        } else {
          existing.set(key, row.data);
        }
      });
      gd.students = Array.from(existing.values());
      _lastPull.students = new Date().toISOString();
      localStorage.setItem('wf_lastpull_students', _lastPull.students);
      if (!silent) log('📥', `Pulled ${newStudents.length} student updates`);
    }

    // Finance pull
    const newFinance = await _fetchSince(TBL_FINANCE, _lastPull.finance);
    if (newFinance && newFinance.length > 0) {
      anyUpdate = true;
      const existing = new Map((gd.finance || []).map(f => [String(f.id), f]));
      newFinance.forEach(row => {
        if (row.deleted) existing.delete(String(row.id));
        else existing.set(String(row.id), row.data);
      });
      gd.finance = Array.from(existing.values());
      _lastPull.finance = new Date().toISOString();
      localStorage.setItem('wf_lastpull_finance', _lastPull.finance);
      if (!silent) log('📥', `Pulled ${newFinance.length} finance updates`);
    }

    // Employees pull
    const newEmployees = await _fetchSince(TBL_EMPLOYEES, _lastPull.employees);
    if (newEmployees && newEmployees.length > 0) {
      anyUpdate = true;
      const existing = new Map((gd.employees || []).map(e => [String(e.id), e]));
      newEmployees.forEach(row => {
        if (row.deleted) existing.delete(String(row.id));
        else existing.set(String(row.id), row.data);
      });
      gd.employees = Array.from(existing.values());
      _lastPull.employees = new Date().toISOString();
      localStorage.setItem('wf_lastpull_employees', _lastPull.employees);
      if (!silent) log('📥', `Pulled ${newEmployees.length} employee updates`);
    }

    if (anyUpdate) {
      // ✅ TRASH FILTER: Pull করার পর Trash এ থাকা ডাটাগুলো ফিল্টার করো
      _applyTrashFilter(gd);
      _save();
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
    }

    return anyUpdate;
  }

  // ✅ Helper: Trash এ থাকা আইটেমগুলো মেইন লিস্ট থেকে সরাও
  function _applyTrashFilter(gd) {
    if (!gd || !Array.isArray(gd.deletedItems) || gd.deletedItems.length === 0) return;

    const trashedIds = new Set();
    gd.deletedItems.forEach(d => {
      if (d.item) {
        if (d.item.id) trashedIds.add(String(d.item.id));
        if (d.item._id) trashedIds.add(String(d.item._id));
        if (d.item.rowIndex) trashedIds.add(String(d.item.rowIndex));
      }
    });

    if (trashedIds.size === 0) return;

    const beforeLen = (gd.students?.length || 0) + (gd.finance?.length || 0);

    if (Array.isArray(gd.students)) {
      gd.students = gd.students.filter(s => !trashedIds.has(String(s.id)) && !trashedIds.has(String(s.rowIndex)) && !trashedIds.has(String(s._id)));
    }
    if (Array.isArray(gd.finance)) {
      gd.finance = gd.finance.filter(f => !trashedIds.has(String(f.id)) && !trashedIds.has(String(f._id)));
    }
    if (Array.isArray(gd.employees)) {
      gd.employees = gd.employees.filter(e => !trashedIds.has(String(e.id)) && !trashedIds.has(String(e._id)));
    }

    const afterLen = (gd.students?.length || 0) + (gd.finance?.length || 0);
    if (beforeLen !== afterLen) {
      log('🛡️', `Trash Filter: Removed ${beforeLen - afterLen} trashed items from pulled data`);
    }
  }

  async function _fetchSince(tableName, sinceTimestamp) {
    try {
      let query = supabaseClient
        .from(tableName)
        .select('id, data, updated_at, deleted')
        .eq('academy_id', ACADEMY_ID)
        .order('updated_at', { ascending: true });

      if (sinceTimestamp) {
        query = query.gt('updated_at', sinceTimestamp);
      }

      const { data, error } = await query;
      if (error) { log('⚠️', `Fetch error (${tableName}):`, error); return null; }
      return data || [];
    } catch (e) { return null; }
  }

  // ═══════════════════════════════════════════════════════════
  // LEGACY FULL PUSH (পুরোনো tables না থাকলে fallback)
  // V30 এর মতোই কাজ করে
  // ═══════════════════════════════════════════════════════════
  async function _pushFull(reason) {
    const gd = window.globalData;
    if (!gd) return false;

    // Mass data loss protection
    const localCount = (gd.students || []).length;
    const lastKnown = parseInt(localStorage.getItem('wings_last_known_count')) || 0;
    if (lastKnown > 5 && localCount === 0 && !reason.toLowerCase().includes('factory-reset')) {
      log('🚫', 'Mass data loss detected — push aborted');
      showNotification('🚫 Data loss রুখতে save বন্ধ', 'error');
      return false;
    }
    localStorage.setItem('wings_last_known_count', String(localCount));

    // Race condition check
    const { data: cloudMeta } = await supabaseClient
      .from(TABLE_NAME).select('version').eq('id', RECORD_ID).single();
    if (cloudMeta && parseInt(cloudMeta.version) >= localVersion) {
      localVersion = parseInt(cloudMeta.version) + 1;
      localStorage.setItem('wings_local_version', String(localVersion));
    }

    const payload = {
      id: RECORD_ID,
      students: gd.students || [],
      employees: gd.employees || [],
      finance: gd.finance || [],
      settings: gd.settings || {},
      income_categories: gd.incomeCategories || [],
      expense_categories: gd.expenseCategories || [],
      payment_methods: gd.paymentMethods || [],
      cash_balance: gd.cashBalance || 0,
      bank_accounts: gd.bankAccounts || [],
      mobile_banking: gd.mobileBanking || [],
      course_names: gd.courseNames || [],
      attendance: gd.attendance || {},
      next_id: gd.nextId || 1001,
      users: gd.users || [],
      exam_registrations: gd.examRegistrations || [],
      visitors: gd.visitors || [],
      employee_roles: gd.employeeRoles || [],
      deleted_items: gd.deletedItems || [],
      activity_history: gd.activityHistory || [],
      keep_records: gd.keepRecords || [],
      loans: gd.loans || [],
      id_cards: gd.idCards || [],
      notices: gd.notices || [],
      version: localVersion,
      last_updated: new Date().toISOString(),
      last_device: DEVICE_ID,
      last_action: reason,
      updated_by: sessionStorage.getItem('username') || 'Admin',
      device_id: DEVICE_ID,
    };

    const { error } = await supabaseClient.from(TABLE_NAME).upsert(payload);
    if (error) throw error;
    log('✅', `Full push v${localVersion} (${reason})`);
    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN PUSH — partial বা full decide করে
  // ═══════════════════════════════════════════════════════════
  async function pushToCloud(reason = 'Auto-save') {
    if (!isInitialized && !initialize()) return false;
    if (isPushing) { pendingPushReason = reason; return false; }
    if (!isOnline) { log('📵', 'Offline — push queued'); return false; }
    if (!window.initialSyncComplete) { log('🛡️', 'Push blocked: initial pull pending'); return false; }

    isPushing = true;
    try {
      // ✅ Race condition check BEFORE pushing
      const { data: cloudMeta } = await supabaseClient
        .from(TABLE_NAME).select('version').eq('id', RECORD_ID).single();

      if (cloudMeta && parseInt(cloudMeta.version) > localVersion) {
        log('🔄', `Cloud version (${cloudMeta.version}) > Local (${localVersion}) — pulling first`);
        isPushing = false; // Release lock
        await pullFromCloud(true);
        // Pull updates localVersion, so we need to restart push
        return pushToCloud(reason + ' [re-try after pull]');
      }

      localVersion++;
      localStorage.setItem('wings_local_version', String(localVersion));

      if (_partialTablesReady && _dirty.size > 0) {
        // ✅ PARTIAL PUSH — শুধু dirty data
        log('📤', `Partial push v${localVersion} (dirty: ${[..._dirty].join(',')})`);
        await _pushPartial();
        log('📊', `Bandwidth saved! Only changed data sent.`);
      } else {
        // Fallback: full push
        await _pushFull(reason);
      }

      localStorage.setItem('lastSyncTime', String(Date.now()));
      lastPushTime = Date.now();
      showNotification(`📤 Saved (v${localVersion})`, 'success');
      isPushing = false;

      // Pending push থাকলে চালাও
      if (pendingPushReason !== null) {
        const q = pendingPushReason;
        pendingPushReason = null;
        setTimeout(() => pushToCloud(q), 500);
      }
      return true;

    } catch (err) {
      log('❌', 'Push error:', err);
      isPushing = false;
      showNotification('❌ Save failed — will retry', 'error');
      // Auto-retry 5s পরে
      setTimeout(() => pushToCloud(reason + ' [retry]'), 5000);
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PULL FROM CLOUD (meta + partial)
  // ═══════════════════════════════════════════════════════════
  async function pullFromCloud(silent = false) {
    if (!isInitialized && !initialize()) return false;
    if (isPulling) return false;

    // ✅ CRITICAL: Recent delete হলে sync pull skip করো
    // ডিলিটের পরে push হচ্ছে, এই সময় pull করলে পুরনো ডাটা ফিরে আসবে
    const currentDelCount = parseInt(localStorage.getItem('wings_total_deleted') || '0');
    if (currentDelCount > _lastDeleteCount) {
      _lastDeleteCount = currentDelCount;
      _lastDeleteTime = Date.now();
      log('🛡️', 'Local delete detected — activating sync cooldown');
    }
    if (_lastDeleteTime > 0 && (Date.now() - _lastDeleteTime) < DELETE_COOLDOWN_MS) {
      if (!silent) log('🛡️', 'Sync pull skipped due to recent delete cooldown');
      return false;
    }

    isPulling = true;

    try {
      if (!silent) log('📥', 'Pulling from cloud...');

      // Meta pull (academy_data)
      const { data, error } = await supabaseClient
        .from(TABLE_NAME).select('*').eq('id', RECORD_ID).single();

      if (error) {
        if (error.code === 'PGRST116') {
          // First device — no cloud data yet
          window.initialSyncComplete = true;
          isPulling = false;
          return true;
        }
        throw error;
      }

      if (!data) { isPulling = false; return false; }

      const cloudVersion = parseInt(data.version) || 0;
      const localTimestamp = parseInt(localStorage.getItem('lastSyncTime')) || 0;
      const cloudTimestamp = data.last_updated ? new Date(data.last_updated).getTime() : 0;

      // Version compare
      if (cloudVersion > localVersion) {
        if (!silent) log('📥', `Cloud newer v${cloudVersion} > local v${localVersion}`);

        // Meta data apply করো
        const gd = window.globalData || {};

        // Settings merge
        const localSettings = (() => {
          try { return JSON.parse(localStorage.getItem('wingsfly_settings_backup') || 'null'); } catch (e) { return null; }
        })();
        const mergedSettings = Object.assign({}, data.settings || {});
        if (localSettings) {
          ['recoveryQuestion', 'recoveryAnswer', 'adminUsername', 'autoLockoutMinutes'].forEach(k => {
            if (localSettings[k] !== undefined) mergedSettings[k] = localSettings[k];
          });
        }

        const usersBackup = (() => {
          try { return JSON.parse(localStorage.getItem('wingsfly_users_backup') || 'null'); } catch (e) { return null; }
        })();

        // ✅ FIX: academy_data কে BASE হিসেবে ব্যবহার করো
        // wf_* tables শুধু newer/updated records যোগ করবে অথবা override করবে
        // এটা prevent করে wf_* tables-এ থাকা পুরোনো/ভুল data দিয়ে সঠিক data মুছে যাওয়া
        window.globalData = Object.assign(gd, {
          students: data.students || gd.students || [],  // academy_data is base
          employees: data.employees || gd.employees || [],
          finance: data.finance || gd.finance || [],
          settings: mergedSettings,
          incomeCategories: data.income_categories || [],
          expenseCategories: data.expense_categories || [],
          paymentMethods: data.payment_methods || [],
          cashBalance: data.cash_balance || 0,
          bankAccounts: data.bank_accounts || [],
          mobileBanking: data.mobile_banking || [],
          courseNames: data.course_names || [],
          attendance: data.attendance || {},
          nextId: data.next_id || 1001,
          users: (usersBackup && usersBackup.length > 0) ? usersBackup : (data.users || []),
          examRegistrations: data.exam_registrations || [],
          visitors: data.visitors || [],
          employeeRoles: data.employee_roles || [],
          deletedItems: data.deleted_items || gd.deletedItems || [],
          activityHistory: data.activity_history || gd.activityHistory || [],
          keepRecords: data.keep_records || [],
          loans: data.loans || [],
          idCards: data.id_cards || [],
          notices: data.notices || [],
        });

        localVersion = cloudVersion;
        localStorage.setItem('wings_local_version', String(cloudVersion));
        localStorage.setItem('lastSyncTime', String(cloudTimestamp));

        // ✅ TRASH FILTER: ক্লাউড থেকে ডাটা আসার পর Trash এ থাকা আইটেমগুলো সরাও
        if (typeof _applyTrashFilter === 'function') _applyTrashFilter(window.globalData);

        _save();

        // ✅ FIX: Full sync এর সময় wf_* merge করব না!
        // academy_data থেকে full sync হলে wf_* tables-এর data ignore করো।
        log('✅', `Full sync from academy_data complete. Skipping wf_* merge to prevent duplicates.`);

        if (typeof window.renderFullUI === 'function') window.renderFullUI();
        if (!silent) showNotification('📥 Synced from cloud', 'success');

      } else {
        if (!silent) log('ℹ️', 'Local data is current ✓');

        // ⛔ DISABLED: wf_* incremental pull বন্ধ — data snowball এবং page freeze সমস্যার কারণে
        // V31 pulls ALWAYS use academy_data (authoritative source)
        // V31 PUSH is still partial (bandwidth saving)
        // if (_partialTablesReady) { await _pullPartial(true); }
      }

      window.initialSyncComplete = true; // ✅ Always set after pull
      lastPullTime = Date.now();
      isPulling = false;
      return true;

    } catch (err) {
      log('❌', 'Pull error:', err);
      isPulling = false;
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DIRTY TRACKING — saveToStorage patch
  // ═══════════════════════════════════════════════════════════
  function _patchSaveToStorage() {
    const orig = window.saveToStorage;
    window.saveToStorage = function () {
      // Dirty flag set করো
      const gd = window.globalData;
      if (gd) {
        // কোন array বদলেছে তা detect করা কঠিন, তাই সব dirty mark করো
        // App এ explicit markDirty() call করলে আরো precise হবে
        _dirty.add('students');
        _dirty.add('finance');
        _dirty.add('employees');
        _dirty.add('meta');
      }
      if (typeof orig === 'function') orig.apply(this, arguments);
      schedulePush('saveToStorage');
    };
    log('✅', 'saveToStorage patched for dirty tracking');
  }

  // Explicit dirty marking (app.js থেকে call করা যায়)
  window.markDirty = function (field) {
    if (field) _dirty.add(field);
    else { _dirty.add('students'); _dirty.add('finance'); _dirty.add('employees'); _dirty.add('meta'); }
  };

  // ── DEBOUNCED PUSH ────────────────────────────────────────
  function schedulePush(reason) {
    clearTimeout(pushDebounceTimer);
    pushDebounceTimer = setTimeout(() => pushToCloud(reason || 'Auto-save'), PUSH_DEBOUNCE);
  }

  // ── PULL INTERVAL ─────────────────────────────────────────
  function startPullInterval() {
    if (pullIntervalId) clearInterval(pullIntervalId);
    pullIntervalId = setInterval(() => pullFromCloud(true), PULL_INTERVAL);
  }

  // ── REALTIME SUBSCRIPTION ─────────────────────────────────
  function setupRealtime() {
    if (!supabaseClient) return;
    try {
      realtimeChannel = supabaseClient
        .channel('academy_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: TABLE_NAME,
          filter: `id=eq.${RECORD_ID}`
        }, (payload) => {
          const cloudDevice = payload.new?.device_id || '';
          if (cloudDevice === DEVICE_ID) return; // আমাদের নিজের push bounce back
          log('🔴', 'Realtime update from another device');
          setTimeout(() => pullFromCloud(false), 200);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            log('🔴', 'Realtime connected');
            realtimeReconnectCount = 0;
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            realtimeReconnectCount++;
            if (realtimeReconnectCount <= 3) {
              setTimeout(setupRealtime, 5000);
            } else {
              log('⚠️', 'Realtime failed — using polling only');
            }
          }
        });
    } catch (e) {
      log('⚠️', 'Realtime setup error:', e);
    }
  }

  // ── NETWORK MONITORING ────────────────────────────────────
  function setupNetworkMonitor() {
    window.addEventListener('online', () => {
      isOnline = true;
      log('🌐', 'Online — syncing');
      pullFromCloud(false).then(() => schedulePush('came-online'));
    });
    window.addEventListener('offline', () => {
      isOnline = false;
      log('📵', 'Offline');
    });
  }

  // ── PAGE UNLOAD ───────────────────────────────────────────
  function setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (!pushDebounceTimer && !isPushing && !pendingPushReason) return;
      clearTimeout(pushDebounceTimer);
      if (!window.globalData || !navigator.sendBeacon) return;
      try {
        const beaconUrl = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?on_conflict=id`;
        const payload = JSON.stringify(Object.assign(
          {
            id: RECORD_ID, version: localVersion + 1, last_updated: new Date().toISOString(),
            last_device: DEVICE_ID, last_action: 'page-close'
          },
          {
            students: window.globalData.students || [], finance: window.globalData.finance || [],
            employees: window.globalData.employees || []
          }
        ));
        fetch(beaconUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json', 'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'resolution=merge-duplicates'
          },
          body: payload, keepalive: true,
        }).catch(() => navigator.sendBeacon(beaconUrl, new Blob([payload], { type: 'application/json' })));
      } catch (e) { }
    });
  }

  // ── FULL SYNC (public API) ────────────────────────────────
  async function fullSync() {
    if (!isInitialized && !initialize()) return false;
    log('🔄', 'Full sync started');
    await pullFromCloud(false);
    await pushToCloud('Manual full sync');
    return true;
  }

  // ── STARTUP ───────────────────────────────────────────────
  async function start() {
    if (!initialize()) {
      setTimeout(start, 2000);
      return;
    }

    // Partial tables আছে কিনা check করো
    await _checkPartialTables();

    setupNetworkMonitor();
    setupBeforeUnload();

    // Initial pull
    await pullFromCloud(false);

    // Realtime + polling
    setupRealtime();
    startPullInterval();

    // saveToStorage patch (dirty tracking এর জন্য)
    _patchSaveToStorage();

    log('🚀', `V31.2 Sync ready | partial=${_partialTablesReady}`);
    showNotification('🔄 Sync ready', 'success');
  }

  // ── PUBLIC API ────────────────────────────────────────────
  window.wingsSync = {
    fullSync,
    pushNow: (reason) => pushToCloud(reason || 'Manual'),
    pullNow: () => pullFromCloud(false),
    markDirty: (field) => window.markDirty(field),
    getStatus: () => ({
      version: localVersion,
      online: isOnline,
      partialReady: _partialTablesReady,
      dirty: [..._dirty],
      initialSyncComplete: window.initialSyncComplete,
    }),
  };

  // Legacy aliases
  window.saveToCloud = () => pushToCloud('Legacy saveToCloud');
  window.loadFromCloud = () => pullFromCloud(false);
  window.manualCloudSync = fullSync;

  // ✅ scheduleSyncPush — V30 compatible alias (many modules use this)
  window.scheduleSyncPush = function (reason) {
    if (window.markDirty) window.markDirty(); // mark all dirty
    schedulePush(reason || 'scheduleSyncPush');
  };

  // Startup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  log('📦', 'V31 loaded');

})();

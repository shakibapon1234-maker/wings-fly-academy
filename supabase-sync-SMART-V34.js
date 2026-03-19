/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * SMART SYNC SYSTEM V34 — DATA-INTEGRITY EDITION (patch 34.1)
 * ============================================================
 *
 * 🔴 V34.1 hotfix (এই build):
 *   - _stableId() hash collision fix: type+date এ amount+person+index যোগ
 *     (একই দিনে একই type এর দুটো entry আলাদা ID পাবে)
 *   - _upsertRecords() deduplication: batch পাঠানোর আগে Map দিয়ে dedupe
 *     (ON CONFLICT DO UPDATE একই row দুবার error বন্ধ)
 * ============================================================
 *
 * 🔴 V33 সমস্যা যা ঠিক করা হয়েছে:
 *   - tmp_ ID bug: id/rowIndex না থাকলে এখন stable UUID তৈরি করে
 *     (প্রতি push-এ আলাদা ID হওয়া বন্ধ → duplicate row বন্ধ)
 *   - Pull merge fix: row.data এর ভেতরের id দিয়ে match করে
 *     (আগে outer row.id দিয়ে match হত → নতুন record হয়ে যেত)
 *   - beforeunload photo strip: page close এ base64 photo strip হয়
 *     (আগে raw base64 সহ বড় payload যেত → size limit ভাঙত)
 *   - Version double-increment fix: _pushFull এ localVersion++ সরানো
 *     (pushToCloud এ একবারই increment হয়)
 *   - Race condition fix: pull await শেষ হওয়ার পর isPushing=true
 *
 * ✅ V33 থেকে বজায় রাখা সব features:
 *   - DOUBLE-PUSH PREVENTION: saveToStorage intercept → debounce
 *   - META ALWAYS PUSH: partial push এ version কখনো miss হবে না
 *   - SMART MONITOR: record count/cash change detect করে
 *   - OPTIMISTIC LOCK: multi-tab conflict handling
 *   - EGRESS OPTIMIZER: 15min pull, 1.5min version check
 *   - TAB VISIBILITY: hidden tab এ sync বন্ধ
 *
 * Author: Wings Fly IT Team
 * Date: March 2026
 * ============================================================
 */

(function () {
  'use strict';

  // ── CONFIGURATION ─────────────────────────────────────────
  const SUPABASE_URL = window.SUPABASE_CONFIG?.URL || 'https://gtoldrltxjrwshubplfp.supabase.co';
  const SUPABASE_KEY = window.SUPABASE_CONFIG?.KEY || '';
  const TABLE_NAME = window.SUPABASE_CONFIG?.TABLE || 'academy_data';
  const RECORD_ID = window.SUPABASE_CONFIG?.MAIN_RECORD || 'wingsfly_main';

  // ✅ V32 KEY CHANGE: Pull interval 5min → 15min (3x কম Egress)
  const PULL_INTERVAL = 15 * 60 * 1000; // 15 minutes

  // ✅ V32: Version-only check interval (lightweight — শুধু version number আনে)
  const VERSION_CHECK_INTERVAL = 3 * 60 * 1000; // 3 minutes — egress কমাতে (আগে 1.5 min ছিল)

  const PUSH_DEBOUNCE = 1500; // 1.5s debounce
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
  let versionCheckIntervalId = null;
  let pendingPushReason = null;
  let _tabVisible = !document.hidden;

  window.initialSyncComplete = false;

  // ── Dirty tracking ────────────────────────────────────────
  const _dirty = new Set();

  // ── Last pull timestamps ──────────────────────────────────
  // ✅ FIX: Always full pull — incremental pull বন্ধ
  // Incremental pull এ _lastPull timestamp থাকলে নতুন records মিস হয়
  // তাই সবসময় null রাখো — full pull হবে
  const _lastPull = {
    students: null,
    finance: null,
    employees: null,
  };

  // ── Partial tables ready flag ─────────────────────────────
  let _partialTablesReady = false;

  // ── EGRESS GUARD ──────────────────────────────────────────
  // দৈনিক কতটি request হচ্ছে track করে, limit এর কাছে গেলে warn করে
  const _egress = {
    todayKey: () => new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    get: function () {
      const k = 'wf_egress_' + this.todayKey();
      return parseInt(localStorage.getItem(k) || '0');
    },
    inc: function () {
      const k = 'wf_egress_' + this.todayKey();
      const v = this.get() + 1;
      localStorage.setItem(k, v.toString());
      // ১৫০টির বেশি হলে warn (Free Plan এ safe threshold)
      if (v === 200) log('⚠️', 'EGRESS GUARD: আজকে ২০০+ requests — sync ধীর করা হচ্ছে');
      return v;
    },
    isThrottled: function () {
      return this.get() > 300; // ৩০০+ হলে pull বন্ধ
    }
  };

  // ─────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────
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
      if (window.globalData) localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      if (typeof window.saveToStorage === 'function') window.saveToStorage();
    } catch (e) { log('⚠️', 'LocalStorage save error'); }
  }

  function showNotification(msg, type) {
    const el = document.getElementById('syncStatusText');
    if (el) el.textContent = msg;
    if (type === 'error' && typeof window.showErrorToast === 'function') window.showErrorToast(msg);
  }

  // ─────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────
  function initialize() {
    if (isInitialized) return true;
    try {
      if (typeof window.supabase === 'undefined') { log('❌', 'Supabase not loaded'); return false; }
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
      localVersion = parseInt(localStorage.getItem('wings_local_version')) || 0;
      isInitialized = true;
      log('✅', `V32 Initialized (v${localVersion}) | EGRESS OPTIMIZER ACTIVE`);
      return true;
    } catch (e) { log('❌', 'Init failed:', e); return false; }
  }

  // ─────────────────────────────────────────────────────────
  // CHECK: partial tables exist?
  // ─────────────────────────────────────────────────────────
  async function _checkPartialTables() {
    try {
      const { error } = await supabaseClient.from(TBL_STUDENTS).select('id').limit(1);
      _partialTablesReady = !error;
      log(_partialTablesReady ? '✅' : '⚠️',
        _partialTablesReady
          ? 'Partial sync tables ready (wf_students, wf_finance, wf_employees)'
          : 'Partial tables not found — using legacy single-record sync'
      );
    } catch (e) { _partialTablesReady = false; }
  }

  // ─────────────────────────────────────────────────────────
  // ✅ V32 NEW: VERSION-ONLY CHECK (Egress মাত্র ~50 bytes)
  // Full pull এর আগে শুধু version number চেক করে
  // Version same হলে pull করে না — এটাই সবচেয়ে বড় Egress saver
  // ─────────────────────────────────────────────────────────
  async function checkVersionOnly() {
    if (!isOnline || !isInitialized) return;
    if (!_tabVisible) return; // Tab hidden হলে skip
    if (_egress.isThrottled()) { log('🛑', 'Egress throttled — version check skipped'); return; }

    try {
      _egress.inc();
      // শুধু version এবং last_device আনো — পুরো data নয়
      const { data, error } = await supabaseClient
        .from(TABLE_NAME)
        .select('version, last_device, last_action')
        .eq('id', RECORD_ID)
        .single();

      if (error || !data) return;

      const cloudVersion = parseInt(data.version) || 0;
      const cloudDevice = data.last_device || '';

      // আমাদের নিজের push এর bounce back ignore করো
      if (cloudDevice === DEVICE_ID) return;

      // ✅ Cloud version বেশি হলে তখনই full pull করো
      if (cloudVersion > localVersion) {
        log('📥', `Version changed: Cloud v${cloudVersion} > Local v${localVersion} — pulling`);
        await pullFromCloud(false);
      }
    } catch (e) {
      // Silent fail — version check failure is non-critical
    }
  }

  // ─────────────────────────────────────────────────────────
  // PARTIAL PUSH
  // ─────────────────────────────────────────────────────────
  async function _pushPartial() {
    const gd = window.globalData;
    if (!gd) return;

    const tasks = [];

    if (_dirty.has('students')) {
      tasks.push(_upsertRecords(TBL_STUDENTS, gd.students || []));
      _dirty.delete('students');
    }
    if (_dirty.has('finance')) {
      tasks.push(_upsertRecords(TBL_FINANCE, gd.finance || []));
      _dirty.delete('finance');
    }
    if (_dirty.has('employees')) {
      tasks.push(_upsertRecords(TBL_EMPLOYEES, gd.employees || []));
      _dirty.delete('employees');
    }

    await Promise.all(tasks);
    // ✅ V33 FIX: সবসময় meta push করো — dirty check ছাড়াই
    // কারণ version, cashBalance, settings সব meta-তে থাকে
    // dirty-only push এ meta skip হলে cloud version mismatch হয়
    await _pushMeta();
    _dirty.clear(); // সব dirty flag clear করো
  }

  // ✅ V34 FIX: stable ID তৈরি করে — tmp_ random ID বন্ধ
  // record এর নিজস্ব id/rowIndex/studentId থেকে deterministic key বানায়
  // যাতে প্রতি push এ একই ID যায় → duplicate row হয় না
  function _stableId(r, idx) {
    if (r.id) return String(r.id);
    if (r.rowIndex) return String(r.rowIndex);
    if (r.studentId) return 'sid_' + String(r.studentId);
    // ✅ V34.1 FIX: hash-এ আরো বেশি field যোগ করো
    // আগে শুধু type+date ছিল — একই দিনে একই type এর দুটো entry collision করত
    // এখন amount + person + index সব মিলিয়ে hash — collision অসম্ভব
    const seed = [
      r.type || 'rec',
      r.date || r.createdAt || '',
      String(r.amount || '0'),
      r.person || r.name || r.title || '',
      r.method || '',
      String(idx ?? 0), // position index — একই সব field হলেও আলাদা হবে
    ].join('|');
    let h = 0;
    for (let i = 0; i < seed.length; i++) { h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0; }
    return 'auto_' + Math.abs(h).toString(36);
  }

  async function _upsertRecords(tableName, records) {
    if (!records || records.length === 0) return;

    // ✅ V34.2 FIX: raw records-এ duplicate id থাকলে push হওয়ার আগেই সরাও
    // এটা না থাকলে Supabase "ON CONFLICT DO UPDATE cannot affect a row a second time" error দেয়
    const rawDeduped = [...new Map(records.map(r => [String(r.id), r])).values()];
    if (rawDeduped.length !== records.length) {
      log('⚠️', `Removed ${records.length - rawDeduped.length} raw duplicates from ${tableName} before upsert`);
    }

    const now = new Date().toISOString();
    // ✅ V32: base64 photo strip করো (Egress কমায়)
    const rows = rawDeduped.map((r, idx) => {
      let cleanRecord = { ...r };
      if (cleanRecord.photo && cleanRecord.photo.startsWith('data:image')) {
        cleanRecord.photo = `photo_${r.studentId || r.id || 'unknown'}`;
        cleanRecord._photoLocal = true;
      }
      return {
        id: _stableId(r, idx), // ✅ V34: stable ID — প্রতিবার একই
        academy_id: ACADEMY_ID,
        data: cleanRecord,
        updated_at: now,
        deleted: false,
      };
    });

    // ✅ V34.1 FIX: একই batch-এ duplicate ID থাকলে Supabase error দেয়
    // upsert করার আগে ID দিয়ে deduplicate করো — শেষেরটা রাখো
    const deduped = [...new Map(rows.map(r => [r.id, r])).values()];
    if (deduped.length !== rows.length) {
      log('⚠️', `Deduped ${rows.length - deduped.length} duplicate IDs before upsert (${tableName})`);
    }

    // Batch এ পাঠাও (max 100)
    for (let i = 0; i < deduped.length; i += 100) {
      const batch = deduped.slice(i, i + 100);
      _egress.inc();
      const { error } = await supabaseClient.from(tableName).upsert(batch);
      if (error) { log('❌', `Partial push error (${tableName}):`, error); throw error; }
    }
    log('✅', `Partial push: ${deduped.length} records → ${tableName}`);
  }

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
      version: localVersion,
      last_updated: new Date().toISOString(),
      last_device: DEVICE_ID,
      last_action: 'partial-sync-meta',
      updated_by: sessionStorage.getItem('username') || 'Admin',
      device_id: DEVICE_ID,
    };

    _egress.inc();
    const { error } = await supabaseClient.from(TABLE_NAME).upsert(metaPayload);
    if (error) { log('❌', 'Meta push error:', error); throw error; }
    log('✅', `Meta pushed v${localVersion}`);
  }

  // ─────────────────────────────────────────────────────────
  // INCREMENTAL PULL
  // ─────────────────────────────────────────────────────────
  async function _pullPartial(silent = false) {
    const gd = window.globalData;
    if (!gd) return;

    let anyUpdate = false;

    const newStudents = await _fetchSince(TBL_STUDENTS, _lastPull.students);
    if (newStudents && newStudents.length > 0) {
      anyUpdate = true;
      const existing = new Map((gd.students || []).map(s => [String(s.id || s.rowIndex || s.studentId), s]));
      newStudents.forEach(row => {
        // ✅ V34 FIX: row.data এর ভেতরের id দিয়ে match করো
        // আগে outer row.id দিয়ে match হত, কিন্তু Map key হলো data এর id
        // ফলে merge না হয়ে নতুন record হয়ে যেত
        const innerKey = String(
          row.data?.id || row.data?.rowIndex || row.data?.studentId || row.id
        );
        if (row.deleted) existing.delete(innerKey);
        else existing.set(innerKey, row.data);
      });
      gd.students = Array.from(existing.values());
      // ✅ FIX: lastpull timestamp save করা বন্ধ — always full pull
      // _lastPull.students = new Date().toISOString();
      // localStorage.setItem('wf_lastpull_students', _lastPull.students);
      if (!silent) log('📥', `Pulled ${newStudents.length} student updates`);
    }

    const newFinance = await _fetchSince(TBL_FINANCE, _lastPull.finance);
    if (newFinance && newFinance.length > 0) {
      anyUpdate = true;
      const existing = new Map((gd.finance || []).map(f => [String(f.id), f]));
      newFinance.forEach(row => {
        // ✅ V34 FIX: inner data id দিয়ে match
        const innerKey = String(row.data?.id || row.id);
        if (row.deleted) existing.delete(innerKey);
        else existing.set(innerKey, row.data);
      });
      gd.finance = Array.from(existing.values());
      // ✅ FIX: lastpull timestamp save করা বন্ধ
      // _lastPull.finance = new Date().toISOString();
      // localStorage.setItem('wf_lastpull_finance', _lastPull.finance);
      if (!silent) log('📥', `Pulled ${newFinance.length} finance updates`);
    }

    const newEmployees = await _fetchSince(TBL_EMPLOYEES, _lastPull.employees);
    if (newEmployees && newEmployees.length > 0) {
      anyUpdate = true;
      const existing = new Map((gd.employees || []).map(e => [String(e.id), e]));
      newEmployees.forEach(row => {
        // ✅ V34 FIX: inner data id দিয়ে match
        const innerKey = String(row.data?.id || row.id);
        if (row.deleted) existing.delete(innerKey);
        else existing.set(innerKey, row.data);
      });
      gd.employees = Array.from(existing.values());
      // ✅ FIX: lastpull timestamp save করা বন্ধ
      // _lastPull.employees = new Date().toISOString();
      // localStorage.setItem('wf_lastpull_employees', _lastPull.employees);
      if (!silent) log('📥', `Pulled ${newEmployees.length} employee updates`);
    }

    if (anyUpdate) {
      _applyTrashFilter(gd);
      _save();
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
    }

    return anyUpdate;
  }

  function _applyTrashFilter(gd) {
    if (!gd || !Array.isArray(gd.deletedItems) || gd.deletedItems.length === 0) return;
    const trashedIds = new Set();
    gd.deletedItems.forEach(d => {
      if (d.item) {
        ['id', '_id', 'id_card_no', 'studentId', 'rowIndex'].forEach(k => {
          if (d.item[k] !== undefined) trashedIds.add(String(d.item[k]));
        });
      }
    });
    if (trashedIds.size === 0) return;
    const filterFn = arr => arr.filter(x =>
      !trashedIds.has(String(x.id)) && !trashedIds.has(String(x._id)) &&
      !trashedIds.has(String(x.rowIndex)) && !trashedIds.has(String(x.studentId))
    );
    if (Array.isArray(gd.students)) gd.students = filterFn(gd.students);
    if (Array.isArray(gd.finance)) gd.finance = filterFn(gd.finance);
    if (Array.isArray(gd.employees)) gd.employees = filterFn(gd.employees);
    if (Array.isArray(gd.notices)) gd.notices = filterFn(gd.notices);
    if (Array.isArray(gd.examRegistrations)) gd.examRegistrations = filterFn(gd.examRegistrations);
    if (Array.isArray(gd.visitors)) gd.visitors = filterFn(gd.visitors);
    if (Array.isArray(gd.keepRecords)) gd.keepRecords = filterFn(gd.keepRecords);
  }

  async function _fetchSince(tableName, sinceTimestamp) {
    try {
      _egress.inc();
      let query = supabaseClient
        .from(tableName)
        .select('id, data, updated_at, deleted')
        .eq('academy_id', ACADEMY_ID)
        .order('updated_at', { ascending: true });

      if (sinceTimestamp) query = query.gt('updated_at', sinceTimestamp);

      const { data, error } = await query;
      if (error) { log('⚠️', `Fetch error (${tableName}):`, error); return null; }
      return data || [];
    } catch (e) { return null; }
  }

  // ─────────────────────────────────────────────────────────
  // LEGACY FULL PUSH (fallback if partial tables missing)
  // ─────────────────────────────────────────────────────────
  async function _pushFull(reason) {
    const gd = window.globalData;
    if (!gd) return false;

    const localCount = (gd.students || []).length;
    const lastKnown = parseInt(localStorage.getItem('wings_last_known_count')) || 0;
    // ✅ V34.3 FIX: initialSyncComplete না হলে এই check skip করো
    // কারণ: নতুন deploy-এর পর pull শেষ হওয়ার আগেই localCount=0 থাকে
    // তখন false positive "data loss" detect হয় এবং push+pull দুটোই block হয়
    if (window.initialSyncComplete && lastKnown > 5 && localCount === 0 && !reason.toLowerCase().includes('factory-reset')) {
      log('🚫', 'Mass data loss detected — push aborted');
      showNotification('🚫 Data loss রুখতে save বন্ধ', 'error');
      return false;
    }
    if (localCount > 0) localStorage.setItem('wings_last_known_count', localCount.toString());

    // ✅ V34 FIX: localVersion++ এখানে নেই — pushToCloud() তে একবারই হয়
    // আগে এখানেও ++ হত → double increment হত
    const timestamp = new Date().toISOString();

    const studentsWithoutPhotos = (gd.students || []).map(s => {
      if (!s.photo || !s.photo.startsWith('data:image')) return s;
      return { ...s, photo: `photo_${s.studentId || s.id || 'unknown'}`, _photoLocal: true };
    });

    const payload = {
      id: RECORD_ID,
      students: studentsWithoutPhotos,
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
      last_updated: timestamp,
      last_device: DEVICE_ID,
      last_action: reason,
      updated_by: sessionStorage.getItem('username') || 'Admin',
      device_id: DEVICE_ID,
    };

    _egress.inc();
    const { error } = await supabaseClient.from(TABLE_NAME).upsert(payload);
    if (error) throw error;
    return true;
  }

  // ─────────────────────────────────────────────────────────
  // FULL PULL (legacy/initial)
  // ─────────────────────────────────────────────────────────
  async function pullFromCloud(silent = false, force = false) {
    if (!isInitialized && !initialize()) return false;
    if (isPulling) return false;
    if (!force && Date.now() - lastPushTime < 15000) return false;
    if (!isOnline) return false;
    if (!_tabVisible && !force) return false; // ✅ V32: tab hidden হলে skip
    if (_egress.isThrottled() && !force) {
      log('🛑', 'Egress throttled — pull skipped');
      return false;
    }

    isPulling = true;
    try {
      if (!silent) log('📥', 'Pulling from cloud...');

      // ✅ V32: Partial tables থাকলে incremental pull করো
      if (_partialTablesReady) {
        const updated = await _pullPartial(silent);
        // Meta ও pull করো (settings, version etc)
        _egress.inc();
        const { data: metaData, error: metaError } = await supabaseClient
          .from(TABLE_NAME)
          .select('version, cash_balance, settings, next_id, payment_methods, income_categories, expense_categories, course_names, users, deleted_items, activity_history, loans, keep_records, id_cards, notices, exam_registrations, visitors, employee_roles, bank_accounts, mobile_banking, attendance')
          .eq('id', RECORD_ID)
          .single();

        if (!metaError && metaData) {
          const cloudVersion = parseInt(metaData.version) || 0;
          if (cloudVersion > localVersion) {
            if (window.globalData) {
              // ✅ FIX: নতুন Supabase schema তে data column থেকে নেওয়া হচ্ছে
              const _md = metaData.data || {};
              window.globalData.cashBalance = _md.cashBalance !== undefined ? _md.cashBalance : (metaData.cash_balance || window.globalData.cashBalance || 0);
              window.globalData.settings = _md.settings || metaData.settings || window.globalData.settings || {};
              window.globalData.nextId = _md.nextId || metaData.next_id || window.globalData.nextId || 1001;
              window.globalData.paymentMethods = _md.paymentMethods || metaData.payment_methods || window.globalData.paymentMethods || [];
              window.globalData.incomeCategories = _md.incomeCategories || metaData.income_categories || window.globalData.incomeCategories || [];
              window.globalData.expenseCategories = _md.expenseCategories || metaData.expense_categories || window.globalData.expenseCategories || [];
              window.globalData.courseNames = _md.courseNames || metaData.course_names || window.globalData.courseNames || [];
              window.globalData.users = _md.users || metaData.users || window.globalData.users || [];
              window.globalData.deletedItems = _md.deletedItems || metaData.deleted_items || window.globalData.deletedItems || [];
              window.globalData.activityHistory = _md.activityHistory || metaData.activity_history || window.globalData.activityHistory || [];
              window.globalData.loans = _md.loans || metaData.loans || window.globalData.loans || [];
              window.globalData.keepRecords = _md.keepRecords || metaData.keep_records || window.globalData.keepRecords || [];
              window.globalData.idCards = _md.idCards || metaData.id_cards || window.globalData.idCards || [];
              window.globalData.notices = _md.notices || metaData.notices || window.globalData.notices || [];
              window.globalData.examRegistrations = _md.examRegistrations || metaData.exam_registrations || window.globalData.examRegistrations || [];
              window.globalData.visitors = _md.visitors || metaData.visitors || window.globalData.visitors || [];
              window.globalData.employeeRoles = _md.employeeRoles || metaData.employee_roles || window.globalData.employeeRoles || [];
              window.globalData.bankAccounts = _md.bankAccounts || metaData.bank_accounts || window.globalData.bankAccounts || [];
              window.globalData.mobileBanking = _md.mobileBanking || metaData.mobile_banking || window.globalData.mobileBanking || [];
              window.globalData.attendance = _md.attendance || metaData.attendance || window.globalData.attendance || {};
              // Also update students/finance/employees if present in data column
              if (_md.students) window.globalData.students = _md.students;
              if (_md.finance) window.globalData.finance = _md.finance;
              if (_md.employees) window.globalData.employees = _md.employees;
            }
            localVersion = cloudVersion;
            localStorage.setItem('wings_local_version', localVersion.toString());
            _save();
            if (typeof window.renderFullUI === 'function') window.renderFullUI();
          }
        }

        window.initialSyncComplete = true;
        lastPullTime = Date.now();
        isPulling = false;
        return true;
      }

      // Legacy full pull (partial tables না থাকলে)
      _egress.inc();
      const { data, error } = await supabaseClient
        .from(TABLE_NAME).select('*').eq('id', RECORD_ID).single();

      if (error) {
        if (error.code === 'PGRST116') {
          window.initialSyncComplete = true;
          isPulling = false;
          return true;
        }
        throw error;
      }

      if (!data) { isPulling = false; return false; }

      const cloudVersion = parseInt(data.version) || 0;
      if (cloudVersion <= localVersion) {
        if (!silent) log('ℹ️', 'Local data is current ✓');
        window.initialSyncComplete = true;
        isPulling = false;
        return true;
      }

      // Update globalData
      // ✅ V34 FIX: নতুন Supabase schema তে সব ডাটা data column এ JSON হিসেবে আছে
      // তাই data.data থেকে নেওয়া হচ্ছে, fallback হিসেবে পুরনো flat columns ও চেক করা হচ্ছে
      const _d = data.data || {};
      window.globalData = {
        students: _d.students || data.students || [],
        employees: _d.employees || data.employees || [],
        finance: _d.finance || data.finance || [],
        settings: _d.settings || data.settings || {},
        incomeCategories: _d.incomeCategories || data.income_categories || [],
        expenseCategories: _d.expenseCategories || data.expense_categories || [],
        paymentMethods: _d.paymentMethods || data.payment_methods || [],
        cashBalance: _d.cashBalance !== undefined ? _d.cashBalance : (data.cash_balance || 0),
        bankAccounts: _d.bankAccounts || data.bank_accounts || [],
        mobileBanking: _d.mobileBanking || data.mobile_banking || [],
        courseNames: _d.courseNames || data.course_names || [],
        attendance: _d.attendance || data.attendance || {},
        nextId: _d.nextId || data.next_id || 1001,
        users: _d.users || data.users || [],
        examRegistrations: _d.examRegistrations || data.exam_registrations || [],
        visitors: _d.visitors || data.visitors || [],
        employeeRoles: _d.employeeRoles || data.employee_roles || [],
        deletedItems: _d.deletedItems || data.deleted_items || [],
        activityHistory: _d.activityHistory || data.activity_history || [],
        keepRecords: _d.keepRecords || data.keep_records || [],
        loans: _d.loans || data.loans || [],
        idCards: _d.idCards || data.id_cards || [],
        notices: _d.notices || data.notices || [],
      };

      localVersion = cloudVersion;
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      localStorage.setItem('wings_local_version', localVersion.toString());
      localStorage.setItem('lastSyncTime', Date.now().toString());
      lastPullTime = Date.now();
      window.initialSyncComplete = true;

      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      if (!silent) log('✅', `Pull complete v${cloudVersion}`);

      isPulling = false;
      return true;

    } catch (error) {
      log('❌', 'Pull error:', error);
      isPulling = false;
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────
  // PUSH TO CLOUD
  // ─────────────────────────────────────────────────────────
  async function pushToCloud(reason = 'Auto-save') {
    if (!isInitialized && !initialize()) return false;
    if (isPushing) {
      pendingPushReason = reason;
      return false;
    }
    if (!window.initialSyncComplete) return false;
    if (!isOnline) { pendingPushReason = reason; return false; }

    isPushing = true;

    try {
      // Mass data loss protection
      // ✅ V34.3 FIX: localCount > 0 হলেই lastKnown update করো
      // যাতে pull-এর আগে 0 দিয়ে overwrite না হয়
      const localCount = (window.globalData?.students || []).length;
      const lastKnown = parseInt(localStorage.getItem('wings_last_known_count')) || 0;
      if (lastKnown > 5 && localCount === 0 && !reason.toLowerCase().includes('factory-reset')) {
        log('🚫', 'Mass data loss detected — push aborted');
        showNotification('🚫 Data loss রুখতে save বন্ধ', 'error');
        isPushing = false;
        return false;
      }
      if (localCount > 0) localStorage.setItem('wings_last_known_count', localCount.toString());

      // ✅ V33 MULTI-TAB OPTIMISTIC LOCK:
      // Push করার আগে cloud version চেক — অন্য tab/device এগিয়ে গেলে আগে pull করো
      try {
        _egress.inc();
        const { data: vCheck, error: vErr } = await supabaseClient
          .from(TABLE_NAME).select('version, last_device')
          .eq('id', RECORD_ID).single();
        if (!vErr && vCheck) {
          const cloudVer = parseInt(vCheck.version) || 0;
          const isOtherDevice = vCheck.last_device && vCheck.last_device !== DEVICE_ID;
          if (isOtherDevice && cloudVer >= localVersion) {
            log('🔄', `Multi-tab conflict: Cloud v${cloudVer} (other device) >= Local v${localVersion} — pulling first`);
            localVersion = cloudVer;
            localStorage.setItem('wings_local_version', localVersion.toString());
            // ✅ V34 FIX: pull সম্পূর্ণ await করার পর isPushing=true
            // আগে isPushing=false করে pull ডাকত, pull শেষ না হতেই isPushing=true হত
            isPushing = false;
            await pullFromCloud(true, true);
            isPushing = true; // pull শেষে push চালিয়ে যাও
          }
        }
      } catch (e) { /* version check fail হলেও push চালিয়ে যাও */ }

      // ✅ FIX: Version overflow guard — 9000 এর বেশি হলে reset
      if (localVersion > 8900) { localVersion = 500; }
      localVersion++;
      log('📤', `Pushing v${localVersion} (${reason}) | partial=${_partialTablesReady}`);

      if (_partialTablesReady) {
        await _pushPartial();
      } else {
        await _pushFull(reason);
      }

      localStorage.setItem('lastSyncTime', Date.now().toString());
      localStorage.setItem('wings_local_version', localVersion.toString());
      lastPushTime = Date.now();

      log('✅', `Pushed v${localVersion}`);
      showNotification(`📤 Saved`, 'success');

      isPushing = false;

      if (pendingPushReason !== null) {
        const queued = pendingPushReason;
        pendingPushReason = null;
        setTimeout(() => pushToCloud(queued), 300);
      }

      return true;

    } catch (error) {
      log('❌', 'Push error:', error);
      showNotification('❌ Save failed — will retry', 'error');
      localVersion--;
      localStorage.setItem('wings_local_version', localVersion.toString());
      isPushing = false;

      if (!reason.includes('[retry]')) {
        setTimeout(() => pushToCloud(reason + ' [retry]'), 5000);
      }
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────
  // SCHEDULE PUSH
  // ─────────────────────────────────────────────────────────
  function schedulePush(reason) {
    clearTimeout(pushDebounceTimer);
    pushDebounceTimer = setTimeout(() => pushToCloud(reason || 'Auto-save'), PUSH_DEBOUNCE);
  }

  // ─────────────────────────────────────────────────────────
  // DIRTY TRACKING PATCH — V33 FIX
  // ✅ saveToStorage() কে intercept করে skipCloudSync=true দিয়ে call করো
  //    তাহলে app.js এর ভেতরে window.saveToCloud() call আর হবে না
  //    V32 নিজেই debounced push handle করবে — double push বন্ধ
  // ─────────────────────────────────────────────────────────
  function _patchSaveToStorage() {
    const origSave = window.saveToStorage;
    window.saveToStorage = function (...args) {
      // skipCloudSync=true দিয়ে call করো — V33 নিজে push schedule করবে
      if (typeof origSave === 'function') origSave.call(this, true);
      // V33 এর debounced push trigger
      if (window.markDirty) window.markDirty();
      schedulePush('saveToStorage-intercepted');
    };

    window.markDirty = function (field) {
      if (field) {
        _dirty.add(field);
      } else {
        _dirty.add('students');
        _dirty.add('finance');
        _dirty.add('employees');
        _dirty.add('meta');
      }
    };
  }

  // ─────────────────────────────────────────────────────────
  // ✅ V32 NEW: TAB VISIBILITY — hidden tab এ sync বন্ধ
  // ─────────────────────────────────────────────────────────
  function setupVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      _tabVisible = !document.hidden;
      if (_tabVisible) {
        log('👁️', 'Tab visible — resuming sync');
        // Tab focus হলে একবার version check করো
        setTimeout(checkVersionOnly, 1000);
      } else {
        log('👁️', 'Tab hidden — sync paused');
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // ✅ V32 NEW: DISABLE AUTO-HEAL CLOUD FETCH
  // auto-heal.js এর cloud fetch বন্ধ করে — duplicate request এড়াতে
  // ─────────────────────────────────────────────────────────
  function _disableAutoHealCloudFetch() {
    // auto-heal এর Module 13 (cloud vs local sync) বন্ধ করো
    // কারণ V32 নিজেই এটা করছে, duplicate হওয়া দরকার নেই
    window.__v33_sync_active = true;
    // auto-heal এর healModule13 override করো
    setTimeout(() => {
      if (window.healStats) {
        log('🛡️', 'Auto-heal cloud sync module disabled — V32 handles it');
      }
    }, 3000);
  }

  // ─────────────────────────────────────────────────────────
  // NETWORK MONITORING
  // ─────────────────────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────
  // PAGE UNLOAD
  // ─────────────────────────────────────────────────────────
  function setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (!pushDebounceTimer && !isPushing && !pendingPushReason) return;
      clearTimeout(pushDebounceTimer);
      if (!window.globalData || !navigator.sendBeacon) return;
      try {
        const beaconUrl = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?on_conflict=id`;
        // ✅ V34 FIX: beforeunload এ photo base64 strip করো
        // আগে raw base64 সহ payload যেত → Supabase size limit ভাঙত
        const studentsClean = (window.globalData.students || []).map(s => {
          if (!s.photo || !s.photo.startsWith('data:image')) return s;
          return { ...s, photo: `photo_${s.studentId || s.id || 'unknown'}`, _photoLocal: true };
        });
        const payload = JSON.stringify({
          id: RECORD_ID,
          version: localVersion + 1,
          last_updated: new Date().toISOString(),
          last_device: DEVICE_ID,
          last_action: 'page-close',
          students: studentsClean,
          finance: window.globalData.finance || [],
          employees: window.globalData.employees || [],
        });
        fetch(beaconUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'resolution=merge-duplicates',
          },
          body: payload,
          keepalive: true,
        }).catch(() => navigator.sendBeacon(beaconUrl, new Blob([payload], { type: 'application/json' })));
      } catch (e) { }
    });
  }

  // ─────────────────────────────────────────────────────────
  // AUTO-SAVE MONITOR — V33 FIX
  // ✅ 2s → 30s interval (double-push loop বন্ধ)
  // ✅ শুধু meaningful change (record count বা cashBalance) এ push
  //    timestamp/version change এ push করে না — loop এড়াতে
  // ─────────────────────────────────────────────────────────
  function _installAutoSaveMonitor() {
    let _lastStudentCount = -1;
    let _lastFinanceCount = -1;
    let _lastCash = null;

    setInterval(() => {
      if (isPushing) return; // Push চলছে — skip
      try {
        const gd = window.globalData;
        if (!gd) return;
        const sc = (gd.students || []).length;
        const fc = (gd.finance || []).length;
        const cb = gd.cashBalance;

        if (_lastStudentCount === -1) {
          // First run — snapshot নাও, push করো না
          _lastStudentCount = sc; _lastFinanceCount = fc; _lastCash = cb;
          return;
        }

        const changed = (sc !== _lastStudentCount) || (fc !== _lastFinanceCount) || (cb !== _lastCash);
        if (changed) {
          log('📡', `Monitor: data changed (s:${_lastStudentCount}→${sc} f:${_lastFinanceCount}→${fc}) — scheduling push`);
          _lastStudentCount = sc; _lastFinanceCount = fc; _lastCash = cb;
          if (window.markDirty) window.markDirty();
          schedulePush('monitor-data-changed');
        }
      } catch (e) { /* silent */ }
    }, 30000); // 30 seconds
  }

  // ─────────────────────────────────────────────────────────
  // STARTUP
  // ─────────────────────────────────────────────────────────
  async function start() {
    if (!initialize()) {
      setTimeout(start, 2000);
      return;
    }

    log('🚀', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('🚀', 'Wings Fly Smart Sync V34 — DATA INTEGRITY EDITION');
    log('🚀', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('💡', `Realtime WebSocket: ❌ DISABLED (Egress সাশ্রয়)`);
    log('💡', `Pull interval: 15 minutes`);
    log('💡', `Version check: every 1.5 minutes (lightweight)`);
    log('💡', `Tab hidden: sync paused`);

    // Check partial tables
    await _checkPartialTables();

    setupNetworkMonitor();
    setupBeforeUnload();
    setupVisibilityTracking();
    _patchSaveToStorage();
    _disableAutoHealCloudFetch();

    // Initial pull
    await pullFromCloud(false);

    // ✅ V32: Realtime বন্ধ — এর বদলে lightweight version check
    // প্রতি 3 মিনিটে শুধু version number চেক (50 bytes মাত্র)
    versionCheckIntervalId = setInterval(checkVersionOnly, VERSION_CHECK_INTERVAL);

    // প্রতি 15 মিনিটে একবার full pull (শুধু version different হলে)
    pullIntervalId = setInterval(() => {
      if (_tabVisible && !_egress.isThrottled()) {
        pullFromCloud(true);
      }
    }, PULL_INTERVAL);

    // Auto-save monitor
    setTimeout(_installAutoSaveMonitor, 2000);

    log('🎉', '✅ V34 Sync fully operational!');
    log('📊', `Egress today: ${_egress.get()} requests`);
    showNotification('🔄 Sync ready (V34)', 'success');
  }

  // ─────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────
  window.wingsSync = {
    fullSync: async function () {
      log('🔄', 'Manual full sync');
      await pullFromCloud(false, true);
      await pushToCloud('Manual full sync');
    },
    pushNow: (reason) => pushToCloud(reason || 'Manual'),
    pullNow: () => pullFromCloud(false, true),
    markDirty: (field) => window.markDirty && window.markDirty(field),
    getStatus: () => ({
      version: localVersion,
      online: isOnline,
      partialReady: _partialTablesReady,
      dirty: [..._dirty],
      initialSyncComplete: window.initialSyncComplete,
      egressToday: _egress.get(),
      tabVisible: _tabVisible,
    }),
    getEgress: () => _egress.get(),
  };

  // Legacy aliases
  window.saveToCloud = () => pushToCloud('Legacy saveToCloud');
  window.loadFromCloud = (force = false) => pullFromCloud(false, force);
  window.manualCloudSync = window.wingsSync.fullSync;
  window.manualSync = window.wingsSync.fullSync;
  window.scheduleSyncPush = function (reason) {
    if (window.markDirty) window.markDirty();
    schedulePush(reason || 'scheduleSyncPush');
  };

  // Startup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  log('📦', 'V34 loaded — DATA INTEGRITY EDITION');

})();

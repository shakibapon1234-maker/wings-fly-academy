/**
 * ════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * SMART SYNC SYSTEM — V35 "MAX COUNT WINS"
 * ════════════════════════════════════════════════════════════
 *
 * ✅ V35 Design Philosophy — "Cloud First, Max Count Wins"
 *
 *   পুরানো সমস্যা (Last Write Wins):
 *     → যে device সবশেষে push করে, সেটাই জেতে
 *     → 34 finance দিয়ে push হলে cloud এ 53 overwrite হয়
 *     → Data loss!
 *
 *   নতুন V35 নিয়ম (Max Count Wins):
 *     1. Cloud সবসময় Source of Truth
 *        → Startup এ সবসময় cloud থেকে load করো
 *        → Local cache শুধু offline fallback
 *
 *     2. Push Guard — "কম দিয়ে overwrite নিষেধ"
 *        → Local finance < Cloud finance হলে push বন্ধ
 *        → আগে cloud থেকে merge করো, তারপর push
 *
 *     3. Merge Strategy — Union, not Replace
 *        → Pull এ cloud records + local records merge হয়
 *        → কোনো record হারায় না
 *        → ID দিয়ে deduplicate — duplicate হয় না
 *
 *     4. Egress সাশ্রয়ী
 *        → Startup: একবার full pull
 *        → তারপর: 15 মিনিটে একবার version check (50 bytes)
 *        → Version পরিবর্তন হলেই full pull (not always)
 *        → দিনে max ~150 requests (আগে ছিল 500+)
 *
 * Author: Wings Fly IT Team
 * Version: 35.0
 * Date: March 2026
 * ════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ══════════════════════════════════════════════════════════
  const CFG = {
    URL:    window.SUPABASE_CONFIG?.URL  || '',
    KEY:    window.SUPABASE_CONFIG?.KEY  || '',
    TABLE:  window.SUPABASE_CONFIG?.TABLE || 'academy_data',
    RECORD: window.SUPABASE_CONFIG?.MAIN_RECORD || 'wingsfly_main',
    // Partial tables
    TBL_STUDENTS:  'wf_students',
    TBL_FINANCE:   'wf_finance',
    TBL_EMPLOYEES: 'wf_employees',
    ACADEMY_ID:    'wingsfly_main',
    // Intervals
    VERSION_CHECK_MS: 15 * 60 * 1000, // 15 min — lightweight version poll
    FULL_PULL_MS:     60 * 60 * 1000, // 60 min — periodic full pull
    PUSH_DEBOUNCE_MS: 2000,            // 2s debounce before push
    // Egress daily limit
    EGRESS_WARN:  200,
    EGRESS_LIMIT: 600,
  };

  // ══════════════════════════════════════════════════════════
  // STATE
  // ══════════════════════════════════════════════════════════
  let _sb          = null;   // supabase client
  let _ready       = false;  // initialized?
  let _pushing     = false;
  let _pulling     = false;
  let _online      = navigator.onLine;
  let _tabVisible  = !document.hidden;
  let _localVer    = 0;
  let _debounce    = null;
  let _pendingPush = null;
  let _partialOK   = false;  // wf_students / wf_finance tables exist?
  const _dirty     = new Set();
  const DEVICE_ID  = _getOrCreateDeviceId();

  window.initialSyncComplete = false;

  // ══════════════════════════════════════════════════════════
  // EGRESS COUNTER — দিনে কতটি request হয়েছে
  // ══════════════════════════════════════════════════════════
  const Egress = {
    _key: () => 'wf_egress_' + new Date().toISOString().slice(0, 10),
    count: function () { return parseInt(localStorage.getItem(this._key()) || '0'); },
    inc:   function () {
      const k = this._key();
      const v = (parseInt(localStorage.getItem(k) || '0')) + 1;
      localStorage.setItem(k, v);
      if (v === CFG.EGRESS_WARN) _log('⚠️', `Egress ${v} requests today — approaching limit`);
      return v;
    },
    throttled: function () { return this.count() > CFG.EGRESS_LIMIT; },
  };

  // ══════════════════════════════════════════════════════════
  // MAX COUNT STORE — কতটি record সর্বোচ্চ দেখা গেছে
  // ══════════════════════════════════════════════════════════
  const MaxCount = {
    get: (key) => parseInt(localStorage.getItem('wf_max_' + key) || '0'),
    update: function (key, count) {
      const prev = this.get(key);
      if (count > prev) {
        localStorage.setItem('wf_max_' + key, count);
        return count;
      }
      return prev;
    },
    // ✅ Core Rule: local count < max এর মানে data কমেছে — push বন্ধ
    isSafe: function (key, localCount, tolerance = 3) {
      const max = this.get(key);
      if (max === 0) return true; // প্রথমবার — safe
      return localCount >= (max - tolerance);
    },
  };

  // ══════════════════════════════════════════════════════════
  // LOGGING
  // ══════════════════════════════════════════════════════════
  function _log(emoji, msg, data) {
    const t = new Date().toLocaleTimeString();
    console.log(`[V35|${t}] ${emoji} ${msg}`);
    if (data) console.log(data);
  }

  function _getOrCreateDeviceId() {
    let id = localStorage.getItem('wings_device_id');
    if (!id) {
      id = 'DEV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      localStorage.setItem('wings_device_id', id);
    }
    return id;
  }

  // ══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ══════════════════════════════════════════════════════════
  function _init() {
    if (_ready) return true;
    if (typeof window.supabase === 'undefined') return false;
    try {
      _sb = window.supabase.createClient(CFG.URL, CFG.KEY);
      _localVer = parseInt(localStorage.getItem('wings_local_version') || '0');
      _ready = true;
      _log('✅', `V35 initialized — localVer=${_localVer} device=${DEVICE_ID.substr(0, 12)}`);
      return true;
    } catch (e) {
      _log('❌', 'Init failed', e);
      return false;
    }
  }

  // ══════════════════════════════════════════════════════════
  // CHECK PARTIAL TABLES
  // ══════════════════════════════════════════════════════════
  async function _checkPartialTables() {
    try {
      const { error } = await _sb.from(CFG.TBL_STUDENTS).select('id').limit(1);
      _partialOK = !error;
      _log(_partialOK ? '✅' : '⚠️',
        _partialOK ? 'Partial tables ready (wf_students, wf_finance)' : 'Partial tables not found — legacy mode');
    } catch (e) { _partialOK = false; }
  }

  // ══════════════════════════════════════════════════════════
  // SAVE TO LOCALSTORAGE — safe, guarded
  // ══════════════════════════════════════════════════════════
  function _saveLocal() {
    try {
      if (!window.globalData) return;
      const finCount = (window.globalData.finance || []).length;
      const stuCount = (window.globalData.students || []).length;
      // Guard: কম data দিয়ে overwrite করা নিষেধ
      if (!MaxCount.isSafe('finance', finCount, 3)) {
        _log('🚫', `_saveLocal BLOCKED — finance=${finCount} < max=${MaxCount.get('finance')} (data loss prevention)`);
        return false;
      }
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      // MaxCount আপডেট করো — সংখ্যা বাড়লে আপডেট হবে, কমলে হবে না
      MaxCount.update('finance', finCount);
      MaxCount.update('students', stuCount);
      // Legacy keys (auth.js / auto-test.js compatibility)
      if (finCount > 0) localStorage.setItem('wings_last_known_finance', finCount.toString());
      if (stuCount > 0) localStorage.setItem('wings_last_known_count', stuCount.toString());
      return true;
    } catch (e) {
      _log('⚠️', 'LocalStorage save error', e);
      return false;
    }
  }

  // ══════════════════════════════════════════════════════════
  // MERGE RECORDS — Union Strategy (কোনো record হারায় না)
  // ══════════════════════════════════════════════════════════
  function _mergeRecords(localArr, cloudRows, keyFn) {
    // Map তৈরি করো: ID → record
    const merged = new Map();
    // প্রথমে local records রাখো
    (localArr || []).forEach(item => {
      const k = keyFn(item);
      if (k) merged.set(k, item);
    });
    // তারপর cloud records merge করো
    // deleted=true হলে সরাও, নইলে cloud version দিয়ে update করো
    (cloudRows || []).forEach(row => {
      if (!row.data) return;
      const k = keyFn(row.data);
      if (!k) return;
      if (row.deleted) {
        merged.delete(k);
      } else {
        // Cloud record রাখো — cloud is source of truth
        merged.set(k, row.data);
      }
    });
    return Array.from(merged.values());
  }

  function _recordKey(r) {
    return String(r?.id || r?.rowIndex || r?.studentId || '');
  }

  // ══════════════════════════════════════════════════════════
  // STABLE ID — push এ consistent ID তৈরি করে
  // ══════════════════════════════════════════════════════════
  function _stableId(r, idx) {
    if (r.id)        return String(r.id);
    if (r.rowIndex)  return String(r.rowIndex);
    if (r.studentId) return 'sid_' + String(r.studentId);
    // deterministic hash — amount, type, date, position সব মিলিয়ে
    const seed = [
      r.type || 'rec',
      r.date || r.createdAt || '',
      String(r.amount || '0'),
      r.person || r.name || r.title || '',
      r.method || '',
      String(idx ?? 0),
    ].join('|');
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
    }
    return 'auto_' + Math.abs(h).toString(36);
  }

  // ══════════════════════════════════════════════════════════
  // PULL — Cloud থেকে data আনো এবং local এর সাথে merge করো
  // ══════════════════════════════════════════════════════════
  async function _pullPartial(silent = false) {
    const gd = window.globalData;
    if (!gd) return false;
    let changed = false;

    // ── Students ──
    try {
      Egress.inc();
      const { data: rows, error } = await _sb
        .from(CFG.TBL_STUDENTS)
        .select('id, data, deleted, updated_at')
        .eq('academy_id', CFG.ACADEMY_ID)
        .order('updated_at', { ascending: true });
      if (!error && rows) {
        const merged = _mergeRecords(gd.students, rows, _recordKey);
        // ✅ Max Count Wins: merge এর পরে count কমলে cloud version নাও
        if (merged.length >= (gd.students || []).length || rows.length > 0) {
          gd.students = merged;
          MaxCount.update('students', merged.length);
          changed = true;
          if (!silent) _log('📥', `Students pulled & merged: ${merged.length}`);
        }
      }
    } catch (e) { _log('⚠️', 'Student pull error', e); }

    // ── Finance ──
    try {
      Egress.inc();
      const { data: rows, error } = await _sb
        .from(CFG.TBL_FINANCE)
        .select('id, data, deleted, updated_at')
        .eq('academy_id', CFG.ACADEMY_ID)
        .order('updated_at', { ascending: true });
      if (!error && rows) {
        const merged = _mergeRecords(gd.finance, rows, r => String(r?.id || ''));
        if (merged.length >= (gd.finance || []).length || rows.length > 0) {
          gd.finance = merged;
          MaxCount.update('finance', merged.length);
          changed = true;
          if (!silent) _log('📥', `Finance pulled & merged: ${merged.length}`);
        }
      }
    } catch (e) { _log('⚠️', 'Finance pull error', e); }

    // ── Employees ──
    try {
      Egress.inc();
      const { data: rows, error } = await _sb
        .from(CFG.TBL_EMPLOYEES)
        .select('id, data, deleted, updated_at')
        .eq('academy_id', CFG.ACADEMY_ID)
        .order('updated_at', { ascending: true });
      if (!error && rows) {
        const merged = _mergeRecords(gd.employees, rows, _recordKey);
        if (merged.length >= (gd.employees || []).length || rows.length > 0) {
          gd.employees = merged;
          changed = true;
        }
      }
    } catch (e) { _log('⚠️', 'Employee pull error', e); }

    return changed;
  }

  async function _pullMeta(silent = false) {
    try {
      Egress.inc();
      const { data, error } = await _sb
        .from(CFG.TABLE)
        .select('version, cash_balance, settings, next_id, payment_methods, income_categories, expense_categories, course_names, users, deleted_items, activity_history, loans, keep_records, id_cards, notices, exam_registrations, visitors, employee_roles, bank_accounts, mobile_banking, attendance')
        .eq('id', CFG.RECORD)
        .single();

      if (error || !data) return;

      const cloudVer = parseInt(data.version) || 0;
      if (cloudVer <= _localVer && !silent) {
        _log('ℹ️', `Meta up to date (cloud v${cloudVer} = local v${_localVer})`);
      }

      const gd = window.globalData;
      if (!gd) return;

      // Meta fields আপডেট করো (students/finance/employees ছাড়া)
      if (data.cash_balance !== undefined) gd.cashBalance = data.cash_balance;
      if (data.settings)            gd.settings           = data.settings;
      if (data.next_id)             gd.nextId             = data.next_id;
      if (data.payment_methods)     gd.paymentMethods     = data.payment_methods;
      if (data.income_categories)   gd.incomeCategories   = data.income_categories;
      if (data.expense_categories)  gd.expenseCategories  = data.expense_categories;
      if (data.course_names)        gd.courseNames        = data.course_names;
      if (data.users)               gd.users              = data.users;
      if (data.deleted_items)       gd.deletedItems       = data.deleted_items;
      if (data.activity_history)    gd.activityHistory    = data.activity_history;
      if (data.loans)               gd.loans              = data.loans;
      if (data.keep_records)        gd.keepRecords        = data.keep_records;
      if (data.id_cards)            gd.idCards            = data.id_cards;
      if (data.notices)             gd.notices            = data.notices;
      if (data.exam_registrations)  gd.examRegistrations  = data.exam_registrations;
      if (data.visitors)            gd.visitors           = data.visitors;
      if (data.employee_roles)      gd.employeeRoles      = data.employee_roles;
      if (data.bank_accounts)       gd.bankAccounts       = data.bank_accounts;
      if (data.mobile_banking)      gd.mobileBanking      = data.mobile_banking;
      if (data.attendance)          gd.attendance         = data.attendance;

      if (cloudVer > _localVer) {
        _localVer = cloudVer;
        localStorage.setItem('wings_local_version', _localVer.toString());
      }
    } catch (e) { _log('⚠️', 'Meta pull error', e); }
  }

  // ── Full pull (pull partial + meta) ──
  async function pullFromCloud(silent = false, force = false) {
    if (!_ready && !_init()) return false;
    if (_pulling) return false;
    if (!_online) return false;
    if (!_tabVisible && !force) return false;
    if (Egress.throttled() && !force) {
      _log('🛑', `Egress throttled (${Egress.count()}) — pull skipped`);
      return false;
    }

    _pulling = true;
    if (!silent) _log('📥', 'Pulling from cloud...');

    try {
      if (_partialOK) {
        const changed = await _pullPartial(silent);
        await _pullMeta(silent);
        _saveLocal();
        if (changed || !silent) {
          if (typeof window.renderFullUI === 'function') window.renderFullUI();
        }
        _log('✅', `Pull complete — finance:${(window.globalData?.finance||[]).length} students:${(window.globalData?.students||[]).length}`);
      } else {
        // Legacy: single record pull
        Egress.inc();
        const { data, error } = await _sb.from(CFG.TABLE).select('*').eq('id', CFG.RECORD).single();
        if (!error && data) {
          const cloudVer = parseInt(data.version) || 0;
          if (cloudVer > _localVer) {
            const _d = data.data || {};
            if (window.globalData) {
              // Merge strategy for legacy mode
              ['students','finance','employees'].forEach(k => {
                const cloudArr = _d[k] || data[k.replace(/([A-Z])/g,'_$1').toLowerCase()] || [];
                const localArr = window.globalData[k] || [];
                // Max count wins
                window.globalData[k] = cloudArr.length >= localArr.length ? cloudArr : localArr;
              });
              window.globalData.cashBalance       = _d.cashBalance ?? data.cash_balance ?? window.globalData.cashBalance;
              window.globalData.settings          = _d.settings || data.settings || window.globalData.settings;
              window.globalData.nextId            = _d.nextId || data.next_id || window.globalData.nextId;
              window.globalData.paymentMethods    = _d.paymentMethods || data.payment_methods || window.globalData.paymentMethods;
              window.globalData.incomeCategories  = _d.incomeCategories || data.income_categories || window.globalData.incomeCategories;
              window.globalData.expenseCategories = _d.expenseCategories || data.expense_categories || window.globalData.expenseCategories;
              window.globalData.deletedItems      = _d.deletedItems || data.deleted_items || window.globalData.deletedItems;
              window.globalData.users             = _d.users || data.users || window.globalData.users;
            }
            _localVer = cloudVer;
            localStorage.setItem('wings_local_version', _localVer.toString());
            _saveLocal();
            if (typeof window.renderFullUI === 'function') window.renderFullUI();
          }
        }
      }
      window.initialSyncComplete = true;
      _pulling = false;
      return true;
    } catch (e) {
      _log('❌', 'Pull error', e);
      _pulling = false;
      return false;
    }
  }

  // ══════════════════════════════════════════════════════════
  // VERSION CHECK — lightweight poll (50 bytes)
  // Full pull শুধু version পরিবর্তন হলে
  // ══════════════════════════════════════════════════════════
  async function _versionCheck() {
    if (!_online || !_ready || !_tabVisible) return;
    if (Egress.throttled()) return;

    try {
      Egress.inc();
      const { data, error } = await _sb
        .from(CFG.TABLE)
        .select('version, last_device')
        .eq('id', CFG.RECORD)
        .single();

      if (error || !data) return;

      const cloudVer = parseInt(data.version) || 0;
      const otherDevice = data.last_device && data.last_device !== DEVICE_ID;

      // অন্য device থেকে পরিবর্তন এসেছে — pull করো
      if (otherDevice && cloudVer > _localVer) {
        _log('📥', `Version changed by other device: cloud v${cloudVer} > local v${_localVer} — pulling`);
        await pullFromCloud(false);
      }
    } catch (e) { /* silent — version check failure is non-critical */ }
  }

  // ══════════════════════════════════════════════════════════
  // PUSH — ✅ Max Count Wins Guard
  // ══════════════════════════════════════════════════════════
  async function _upsertRecords(tableName, records) {
    if (!records || records.length === 0) return;
    const now = new Date().toISOString();

    // Deleted IDs set
    const deletedIds = new Set(
      (window.globalData?.deletedItems || []).flatMap(d => {
        const ids = [];
        const src = d.item || d;
        ['id','studentId','rowIndex'].forEach(k => {
          if (src[k] != null) ids.push(String(src[k]));
        });
        return ids;
      })
    );

    // Deduplicate records এর নিজস্ব IDs
    const deduped = [...new Map(records.map(r => [String(r.id || r.rowIndex || r.studentId || ''), r])).values()];

    const rows = deduped.map((r, idx) => {
      // Photo strip (egress সাশ্রয়)
      let clean = { ...r };
      if (clean.photo && clean.photo.startsWith('data:image')) {
        clean.photo = `photo_${r.studentId || r.id || idx}`;
        clean._photoLocal = true;
      }
      const isDeleted = deletedIds.has(String(r.id || r.rowIndex || r.studentId || ''));
      return {
        id:         _stableId(r, idx),
        academy_id: CFG.ACADEMY_ID,
        data:       clean,
        updated_at: now,
        deleted:    isDeleted,
      };
    });

    // Batch এ পাঠাও (100 করে)
    for (let i = 0; i < rows.length; i += 100) {
      Egress.inc();
      const { error } = await _sb.from(tableName).upsert(rows.slice(i, i + 100));
      if (error) throw error;
    }
    _log('✅', `Partial push: ${rows.length} records → ${tableName}`);
  }

  async function _pushPartial() {
    const gd = window.globalData;
    if (!gd) return;

    // ✅ MAX COUNT WINS — push guard
    const finCount  = (gd.finance  || []).length;
    const stuCount  = (gd.students || []).length;
    const maxFin    = MaxCount.get('finance');
    const maxStu    = MaxCount.get('students');

    // Finance push guard — intentional delete সহ
    if (_dirty.has('finance')) {
      // deletedItems এ কতটি finance entry আছে গণনা করো
      const deletedFin = (gd.deletedItems || []).filter(d =>
        d.type === 'finance' ||
        (d.item && (d.item.amount !== undefined || d.item.type === 'Income' || d.item.type === 'Expense'))
      ).length;
      const effectiveFin     = finCount + deletedFin;
      const intentionalFinDel = effectiveFin >= maxFin - 1;

      if (!MaxCount.isSafe('finance', finCount, 3) && !intentionalFinDel) {
        // Accidental loss — cloud থেকে recover করো
        _log('🚫', `Finance push BLOCKED — local:${finCount}+deleted:${deletedFin} < max:${maxFin} (accidental loss?)`);
        try {
          Egress.inc();
          const { data } = await _sb.from(CFG.TBL_FINANCE).select('data')
            .eq('academy_id', CFG.ACADEMY_ID).eq('deleted', false);
          if (data && data.length > finCount) {
            gd.finance = _mergeRecords(gd.finance, data.map(r => ({ data: r.data, deleted: false })), d => String(d?.id || ''));
            MaxCount.update('finance', gd.finance.length);
            _log('✅', `Finance recovered from cloud: ${gd.finance.length}`);
          }
        } catch (e) {}
      } else {
        // Safe push — হয় count ঠিক আছে, অথবা intentional delete
        if (intentionalFinDel && !MaxCount.isSafe('finance', finCount, 3)) {
          _log('✅', `Finance intentional delete detected — local:${finCount} deleted:${deletedFin} max:${maxFin} — pushing`);
          // MaxCount কে নতুন count এ update করো (delete confirmed)
          localStorage.setItem('wf_max_finance', finCount.toString());
        }
        await _upsertRecords(CFG.TBL_FINANCE, gd.finance || []);
        MaxCount.update('finance', finCount);
      }
      _dirty.delete('finance');
    }

    // Student push guard
    if (_dirty.has('students')) {
      const deletedStu = (gd.deletedItems || []).filter(d =>
        d.type === 'student' || (d.item && !d.item.amount)
      ).length;
      const effectiveStu = stuCount + deletedStu;
      const intentionalDelete = effectiveStu >= maxStu - 1;

      if (!MaxCount.isSafe('students', stuCount, 3) && !intentionalDelete) {
        _log('🚫', `Student push BLOCKED — local:${stuCount}+deleted:${deletedStu} < max:${maxStu}`);
      } else {
        await _upsertRecords(CFG.TBL_STUDENTS, gd.students || []);
        MaxCount.update('students', stuCount);
      }
      _dirty.delete('students');
    }

    // Employees
    if (_dirty.has('employees')) {
      await _upsertRecords(CFG.TBL_EMPLOYEES, gd.employees || []);
      _dirty.delete('employees');
    }

    // Meta always push
    await _pushMeta();
    _dirty.clear();
  }

  async function _pushMeta() {
    const gd = window.globalData;
    if (!gd) return;
    Egress.inc();
    const { error } = await _sb.from(CFG.TABLE).upsert({
      id:                  CFG.RECORD,
      settings:            gd.settings || {},
      income_categories:   gd.incomeCategories || [],
      expense_categories:  gd.expenseCategories || [],
      payment_methods:     gd.paymentMethods || [],
      cash_balance:        gd.cashBalance || 0,
      bank_accounts:       gd.bankAccounts || [],
      mobile_banking:      gd.mobileBanking || [],
      course_names:        gd.courseNames || [],
      attendance:          gd.attendance || {},
      next_id:             gd.nextId || 1001,
      users:               gd.users || [],
      exam_registrations:  gd.examRegistrations || [],
      visitors:            gd.visitors || [],
      employee_roles:      gd.employeeRoles || [],
      deleted_items:       gd.deletedItems || [],
      activity_history:    gd.activityHistory || [],
      keep_records:        gd.keepRecords || [],
      loans:               gd.loans || [],
      id_cards:            gd.idCards || [],
      notices:             gd.notices || [],
      version:             _localVer,
      last_updated:        new Date().toISOString(),
      last_device:         DEVICE_ID,
      last_action:         'v35-sync',
      updated_by:          sessionStorage.getItem('username') || 'Admin',
      device_id:           DEVICE_ID,
    });
    if (error) throw error;
    _log('✅', `Meta pushed v${_localVer}`);
  }

  async function _pushFull(reason) {
    const gd = window.globalData;
    if (!gd) return;

    const studentsClean = (gd.students || []).map(s => {
      if (!s.photo?.startsWith('data:image')) return s;
      return { ...s, photo: `photo_${s.studentId || s.id}`, _photoLocal: true };
    });

    Egress.inc();
    const { error } = await _sb.from(CFG.TABLE).upsert({
      id:                  CFG.RECORD,
      students:            studentsClean,
      finance:             gd.finance || [],
      employees:           gd.employees || [],
      settings:            gd.settings || {},
      income_categories:   gd.incomeCategories || [],
      expense_categories:  gd.expenseCategories || [],
      payment_methods:     gd.paymentMethods || [],
      cash_balance:        gd.cashBalance || 0,
      bank_accounts:       gd.bankAccounts || [],
      mobile_banking:      gd.mobileBanking || [],
      course_names:        gd.courseNames || [],
      attendance:          gd.attendance || {},
      next_id:             gd.nextId || 1001,
      users:               gd.users || [],
      exam_registrations:  gd.examRegistrations || [],
      visitors:            gd.visitors || [],
      employee_roles:      gd.employeeRoles || [],
      deleted_items:       gd.deletedItems || [],
      activity_history:    gd.activityHistory || [],
      keep_records:        gd.keepRecords || [],
      loans:               gd.loans || [],
      id_cards:            gd.idCards || [],
      notices:             gd.notices || [],
      version:             _localVer,
      last_updated:        new Date().toISOString(),
      last_device:         DEVICE_ID,
      last_action:         reason,
      updated_by:          sessionStorage.getItem('username') || 'Admin',
    });
    if (error) throw error;
  }

  // ── Main push entry point ──
  async function pushToCloud(reason = 'Auto-save') {
    if (!_ready && !_init()) return false;
    if (_pushing) { _pendingPush = reason; return false; }
    if (!window.initialSyncComplete) return false;
    if (!_online) { _pendingPush = reason; return false; }

    _pushing = true;
    try {
      // ── Multi-device conflict check ──
      // অন্য device এগিয়ে গেলে আগে pull করো
      try {
        Egress.inc();
        const { data: vc } = await _sb.from(CFG.TABLE)
          .select('version, last_device').eq('id', CFG.RECORD).single();
        if (vc) {
          const cloudVer    = parseInt(vc.version) || 0;
          const otherDevice = vc.last_device && vc.last_device !== DEVICE_ID;
          if (otherDevice && cloudVer >= _localVer) {
            _log('🔄', `Multi-device: cloud v${cloudVer} from other device — pulling first`);
            _pushing = false;
            await pullFromCloud(true, true);
            _pushing = true;
          }
        }
      } catch (e) {}

      // Version increment (with overflow guard)
      if (_localVer > 8900) _localVer = 500;
      _localVer++;
      localStorage.setItem('wings_local_version', _localVer.toString());

      _log('📤', `Pushing v${_localVer} (${reason}) | partial=${_partialOK}`);

      if (_partialOK) {
        await _pushPartial();
      } else {
        await _pushFull(reason);
      }

      localStorage.setItem('lastSyncTime', Date.now().toString());
      _log('✅', `Push complete v${_localVer}`);
      _showStatus('📤 Saved');
      _pushing = false;

      if (_pendingPush) {
        const queued = _pendingPush;
        _pendingPush = null;
        setTimeout(() => pushToCloud(queued), 300);
      }
      return true;
    } catch (e) {
      _log('❌', 'Push error', e);
      _localVer--;
      localStorage.setItem('wings_local_version', _localVer.toString());
      _showStatus('❌ Save failed — retrying');
      _pushing = false;
      if (!reason.includes('[retry]')) {
        setTimeout(() => pushToCloud(reason + ' [retry]'), 5000);
      }
      return false;
    }
  }

  // ══════════════════════════════════════════════════════════
  // SCHEDULE PUSH — debounced
  // ══════════════════════════════════════════════════════════
  function _schedulePush(reason) {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => pushToCloud(reason || 'Auto-save'), CFG.PUSH_DEBOUNCE_MS);
  }

  // ══════════════════════════════════════════════════════════
  // PATCH saveToStorage — intercept করে double push বন্ধ
  // ══════════════════════════════════════════════════════════
  function _patchSaveToStorage() {
    const orig = window.saveToStorage;
    window.saveToStorage = function (...args) {
      if (typeof orig === 'function') orig.call(this, true); // skipCloudSync=true
      window.markDirty && window.markDirty();
      _schedulePush('saveToStorage');
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

  // ══════════════════════════════════════════════════════════
  // AUTO-SAVE MONITOR — 30s interval, শুধু count পরিবর্তনে push
  // ══════════════════════════════════════════════════════════
  function _installMonitor() {
    let _lastFin = -1, _lastStu = -1, _lastCash = null;

    setInterval(() => {
      if (_pushing) return;
      const gd = window.globalData;
      if (!gd) return;

      const fc = (gd.finance  || []).length;
      const sc = (gd.students || []).length;
      const cb = gd.cashBalance;

      if (_lastFin === -1) { _lastFin = fc; _lastStu = sc; _lastCash = cb; return; }

      if (fc !== _lastFin || sc !== _lastStu || cb !== _lastCash) {
        _log('📡', `Monitor: change detected (fin:${_lastFin}→${fc} stu:${_lastStu}→${sc})`);
        _lastFin = fc; _lastStu = sc; _lastCash = cb;
        window.markDirty && window.markDirty();
        _schedulePush('monitor-change');
      }
    }, 30000);
  }

  // ══════════════════════════════════════════════════════════
  // STARTUP INTEGRITY CHECK
  // Startup এ local < max হলে cloud থেকে force load
  // ══════════════════════════════════════════════════════════
  async function _startupIntegrityCheck() {
    const gd = window.globalData;
    if (!gd) return;

    const finCount  = (gd.finance  || []).length;
    const stuCount  = (gd.students || []).length;
    const finOK     = MaxCount.isSafe('finance',  finCount,  3);
    const stuOK     = MaxCount.isSafe('students', stuCount, 3);

    if (finOK && stuOK) {
      _log('✅', `Startup integrity OK — finance:${finCount} students:${stuCount}`);
      return;
    }

    _log('🚨', `Startup integrity FAIL — finance:${finCount}/${MaxCount.get('finance')} students:${stuCount}/${MaxCount.get('students')} — Force loading from cloud`);

    // Dashboard hide করো যতক্ষণ load শেষ না হয়
    const ov = document.getElementById('dashboardOverview');
    if (ov) ov.style.visibility = 'hidden';

    try {
      const tasks = [];
      if (!finOK && _partialOK) {
        tasks.push(
          _sb.from(CFG.TBL_FINANCE).select('data').eq('academy_id', CFG.ACADEMY_ID).eq('deleted', false)
            .then(({ data }) => {
              if (data && data.length > finCount) {
                gd.finance = data.map(r => r.data);
                MaxCount.update('finance', gd.finance.length);
                _log('✅', `Force loaded finance: ${gd.finance.length}`);
              }
            })
        );
      }
      if (!stuOK && _partialOK) {
        tasks.push(
          _sb.from(CFG.TBL_STUDENTS).select('data').eq('academy_id', CFG.ACADEMY_ID).eq('deleted', false)
            .then(({ data }) => {
              if (data && data.length > stuCount) {
                gd.students = data.map(r => r.data);
                MaxCount.update('students', gd.students.length);
                _log('✅', `Force loaded students: ${gd.students.length}`);
              }
            })
        );
      }
      await Promise.all(tasks);
      _saveLocal();
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      _log('✅', 'Startup integrity restored!');
    } catch (e) {
      _log('⚠️', 'Startup integrity check failed', e);
    } finally {
      if (ov) ov.style.visibility = '';
    }
  }

  // ══════════════════════════════════════════════════════════
  // NETWORK & VISIBILITY
  // ══════════════════════════════════════════════════════════
  function _setupNetwork() {
    window.addEventListener('online',  () => { _online = true;  _log('🌐', 'Online'); pullFromCloud(false).then(() => _schedulePush('came-online')); });
    window.addEventListener('offline', () => { _online = false; _log('📵', 'Offline'); });
  }

  function _setupVisibility() {
    document.addEventListener('visibilitychange', () => {
      _tabVisible = !document.hidden;
      if (_tabVisible) {
        _log('👁️', 'Tab visible — checking version');
        setTimeout(_versionCheck, 1000);
      }
    });
  }

  function _setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (!_debounce && !_pushing && !_pendingPush) return;
      clearTimeout(_debounce);
      if (!window.globalData || !navigator.sendBeacon) return;
      try {
        const url = `${CFG.URL}/rest/v1/${CFG.TABLE}?on_conflict=id`;
        const payload = JSON.stringify({
          id:           CFG.RECORD,
          version:      _localVer + 1,
          last_updated: new Date().toISOString(),
          last_device:  DEVICE_ID,
          last_action:  'page-close',
          cash_balance: window.globalData.cashBalance || 0,
        });
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': CFG.KEY, 'Authorization': `Bearer ${CFG.KEY}`, 'Prefer': 'resolution=merge-duplicates' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      } catch (e) {}
    });
  }

  function _showStatus(msg) {
    const el = document.getElementById('syncStatusText');
    if (el) el.textContent = msg;
  }

  // ══════════════════════════════════════════════════════════
  // STARTUP
  // ══════════════════════════════════════════════════════════
  async function _start() {
    if (!_init()) { setTimeout(_start, 2000); return; }

    _log('🚀', '══════════════════════════════════════');
    _log('🚀', 'Wings Fly Smart Sync V35 — MAX COUNT WINS');
    _log('🚀', '══════════════════════════════════════');
    _log('💡', `Strategy: Cloud First + Max Count Wins`);
    _log('💡', `Version check: every 15 min (lightweight)`);
    _log('💡', `Egress today: ${Egress.count()} requests`);

    await _checkPartialTables();

    _setupNetwork();
    _setupVisibility();
    _setupBeforeUnload();
    _patchSaveToStorage();

    // auto-heal cloud sync disable করো — V35 নিজে করবে
    window.__v35_sync_active = true;

    // Startup integrity check
    await _startupIntegrityCheck();

    // Initial pull
    await pullFromCloud(false);

    // Version check — 15 মিনিটে একবার
    setInterval(_versionCheck, CFG.VERSION_CHECK_MS);

    // Full pull — 60 মিনিটে একবার (insurance)
    setInterval(() => {
      if (_tabVisible && !Egress.throttled()) pullFromCloud(true);
    }, CFG.FULL_PULL_MS);

    // Auto-save monitor
    setTimeout(_installMonitor, 3000);

    _log('🎉', 'V35 Sync fully operational!');
    _showStatus('🔄 Sync V35 ready');
  }

  // ══════════════════════════════════════════════════════════
  // PUBLIC API
  // ══════════════════════════════════════════════════════════
  window.wingsSync = {
    fullSync:  async () => { await pullFromCloud(false, true); await pushToCloud('Manual full sync'); },
    pushNow:   (reason) => pushToCloud(reason || 'Manual push'),
    pullNow:   () => pullFromCloud(false, true),
    markDirty: (field) => window.markDirty && window.markDirty(field),
    getStatus: () => ({
      // V35 names
      version:             _localVer,
      online:              _online,
      partialOK:           _partialOK,
      dirty:               [..._dirty],
      initialSync:         window.initialSyncComplete,
      egress:              Egress.count(),
      tabVisible:          _tabVisible,
      maxFinance:          MaxCount.get('finance'),
      maxStudents:         MaxCount.get('students'),
      // V34 backward-compatible aliases (auto-test.js)
      egressToday:         Egress.count(),
      initialSyncComplete: window.initialSyncComplete,
      partialReady:        _partialOK,
    }),
  };

  // Legacy aliases (auth.js, app.js compatibility)
  window.saveToCloud        = () => pushToCloud('saveToCloud');
  window.loadFromCloud      = (force = false) => pullFromCloud(false, force);
  window.manualCloudSync    = window.wingsSync.fullSync;
  window.manualSync         = window.wingsSync.fullSync;
  window.scheduleSyncPush   = (reason) => { window.markDirty && window.markDirty(); _schedulePush(reason); };

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _start);
  } else {
    _start();
  }

  _log('📦', 'V35 loaded — MAX COUNT WINS strategy active');

})();

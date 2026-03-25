/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * SMART SYNC SYSTEM — V39.0 "FRESH BROWSER FIX"
 * ════════════════════════════════════════════════════════════════
 *
 * ✅ V39.0 — 4টি Critical Bug Permanently Fixed:
 *
 *   BUG 1 FIX — FRESH BROWSER AUTO-RESTORE:
 *     → নতুন browser-এ localStorage খালি থাকলে
 *       wingsSync লোড হওয়ার সাথে সাথে cloud থেকে full pull হবে
 *     → UI hide করে pull করবে, তারপর দেখাবে (flicker নেই)
 *     → wingsSync NOT FOUND আর হবে না
 *
 *   BUG 2 FIX — deletedItems ARRAY BUG:
 *     → startup-এ deletedItems সবসময় object হবে (array নয়)
 *     → pull-এর পরেও ensure করা হবে
 *     → recycle-bin-fix.js এর সাথে conflict নেই
 *
 *   BUG 3 FIX — SNAPSHOT CORRUPTION:
 *     → নতুন browser-এ login-এর আগে snapshot নেওয়া হবে না
 *     → pull সম্পন্ন হওয়ার পরেই প্রথম snapshot নেওয়া হবে
 *     → snapshot-system.js এর takeSnapshot() কে guard করা হয়েছে
 *
 *   BUG 4 FIX — MAXCOUNT N/A BLOCKS PUSH:
 *     → pull সফল হলে MaxCount সাথে সাথে set হবে
 *     → নতুন browser-এ MaxCount কখনো N/A থাকবে না
 *     → push আর blocked হবে না
 *
 * ════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ── CONFIGURATION ────────────────────────────────────────────
  const CFG = {
    URL:    window.SUPABASE_CONFIG?.URL  || '',
    KEY:    window.SUPABASE_CONFIG?.KEY  || '',
    TABLE:  window.SUPABASE_CONFIG?.TABLE || 'academy_data',
    RECORD: window.SUPABASE_CONFIG?.MAIN_RECORD || 'wingsfly_main',
    TBL_STUDENTS:  'wf_students',
    TBL_FINANCE:   'wf_finance',
    TBL_EMPLOYEES: 'wf_employees',
    ACADEMY_ID:    'wingsfly_main',
    VERSION_CHECK_MS: 30 * 60 * 1000,
    FULL_PULL_MS:     60 * 60 * 1000,
    PUSH_DEBOUNCE_MS: 3000,
    EGRESS_WARN:  200,
    EGRESS_LIMIT: 500,
    EGRESS_HARD_LIMIT: 600,
    VERSION_GAP_WARN: 10,
    VERSION_GAP_FULL: 20,
    SYNC_FRESHNESS_MS: 24 * 60 * 60 * 1000,
  };

  // ── STATE ────────────────────────────────────────────────────
  let _sb = null, _ready = false, _pushing = false, _pulling = false;
  let _online = navigator.onLine, _tabVisible = !document.hidden;
  let _localVer = 0, _debounce = null, _partialOK = false;
  let _networkQuality = 'good';
  let _syncBusy = false;
  let _cooldownUntil = 0;
  let _suppressRender = false;
  const _dirty = new Set();
  const DEVICE_ID = _getOrCreateDeviceId();
  window.initialSyncComplete = false;

  // ── V39: Fresh browser flag ──────────────────────────────────
  // নতুন browser detect করা হয় localStorage-এ wingsfly_data না থাকলে
  const _isFreshBrowser = !localStorage.getItem('wingsfly_data');
  if (_isFreshBrowser) {
    _log('🆕', 'Fresh browser detected — will force pull on startup');
  }

  // ── CONFLICT TRACKER ─────────────────────────────────────────
  const ConflictTracker = {
    record: function(type, detail, localCount, cloudCount) {
      const entry = {
        time: Date.now(), type, detail,
        localCount: localCount || 0, cloudCount: cloudCount || 0,
        device: DEVICE_ID, seen: false,
      };
      localStorage.setItem('wf_last_conflict', JSON.stringify(entry));
      _log('🚨', `Conflict: ${type} — ${detail}`);
      window._wfLastConflict = entry;
    },
    get: function() {
      try { return JSON.parse(localStorage.getItem('wf_last_conflict') || 'null'); } catch { return null; }
    },
    markSeen: function() {
      const c = this.get();
      if (c) { c.seen = true; localStorage.setItem('wf_last_conflict', JSON.stringify(c)); }
    },
    clear: function() {
      localStorage.removeItem('wf_last_conflict');
      window._wfLastConflict = null;
    },
  };
  window.wfConflictTracker = ConflictTracker;

  // ── EGRESS COUNTER ────────────────────────────────────────────
  const Egress = {
    _dayKey: () => 'wf_egress_' + new Date().toISOString().slice(0, 10),
    count: function () { this._cleanup(); return parseInt(localStorage.getItem(this._dayKey()) || '0'); },
    inc: function () {
      const k = this._dayKey();
      const v = (parseInt(localStorage.getItem(k) || '0')) + 1;
      localStorage.setItem(k, v);
      if (v === CFG.EGRESS_WARN) _log('⚠️', `Egress warning: ${v}`);
      if (v === CFG.EGRESS_LIMIT) {
        _log('🔶', `Egress soft limit: ${v}`);
        _showUserMessage(`আজকে ${v}টি sync request হয়েছে। Auto version-check বন্ধ।`, 'warn');
      }
      return v;
    },
    throttled: function () { return this.count() > CFG.EGRESS_LIMIT; },
    hardThrottled: function () { return this.count() > CFG.EGRESS_HARD_LIMIT; },
    reset: function () {
      localStorage.setItem(this._dayKey(), '0');
      _log('🔄', 'Egress reset');
      _showUserMessage('Egress counter reset। Sync কাজ করবে।', 'success');
    },
    _cleanup: function () {
      try {
        const today = new Date().toISOString().slice(0, 10);
        Object.keys(localStorage)
          .filter(k => k.startsWith('wf_egress_') && !k.endsWith(today))
          .forEach(k => localStorage.removeItem(k));
      } catch (e) {}
    },
    getInfo: function () {
      const count = this.count();
      return {
        count, limit: CFG.EGRESS_LIMIT, hardLimit: CFG.EGRESS_HARD_LIMIT,
        percent: Math.round((count / CFG.EGRESS_LIMIT) * 100),
        throttled: this.throttled(), hardThrottled: this.hardThrottled(),
        remaining: Math.max(0, CFG.EGRESS_LIMIT - count),
        status: count <= CFG.EGRESS_WARN ? 'ok'
              : count <= CFG.EGRESS_LIMIT ? 'warn'
              : count <= CFG.EGRESS_HARD_LIMIT ? 'soft-throttled'
              : 'hard-throttled',
      };
    },
  };

  // ── MAX COUNT ─────────────────────────────────────────────────
  const MaxCount = {
    get: (key) => parseInt(localStorage.getItem('wf_max_' + key) || '0'),
    update: function (key, count) {
      const prev = this.get(key);
      if (count > prev) {
        localStorage.setItem('wf_max_' + key, count);
        _log('📈', `MaxCount: ${key} ${prev}→${count}`);
        return count;
      }
      return prev;
    },
    // ✅ V39 FIX: Fresh browser-এ MaxCount কখনো block করবে না
    isSafe: function (key, localCount, options = {}) {
      const max = this.get(key);
      // Fresh browser বা first time — always safe
      if (max === 0) return { safe: true, reason: 'first-time' };
      const hasLocalData = localStorage.getItem('wingsfly_data');
      if (!hasLocalData && localCount === 0) {
        _log('⚠️', `MaxCount ${key}: Empty localStorage → safe`);
        return { safe: true, reason: 'empty-localStorage', localCount, max };
      }
      const deletedCount = options.deletedCount || 0;
      const netCount = localCount + deletedCount;
      const baseTolerance = options.tolerance || 5;
      const percentTolerance = Math.max(baseTolerance, Math.floor(max * 0.10));
      const threshold = max - percentTolerance;
      const isSafe = netCount >= threshold;
      const result = { safe: isSafe, localCount, deletedCount, netCount, max, threshold, tolerance: percentTolerance };
      if (!isSafe) {
        _log('🚫', `MaxCount UNSAFE: ${key} net=${netCount} < ${threshold}`);
        result.message = `${key} count কম! Local: ${localCount}, Min: ${threshold}.`;
      } else {
        _log('✅', `MaxCount OK: ${key} net=${netCount} >= ${threshold}`);
      }
      return result;
    },
    getDeletedCount: function (key) {
      const data = window.globalData;
      if (!data?.deletedItems) return 0;
      const mapping = { 'students': 'students', 'finance': 'finance', 'employees': 'employees' };
      const deletedKey = mapping[key];
      if (!deletedKey) return 0;
      // ✅ V39: deletedItems ARRAY হলে 0 দাও (bug protect)
      if (Array.isArray(data.deletedItems)) return 0;
      return (data.deletedItems[deletedKey] || []).length;
    },
    // ✅ V39: Force set (pull-এর পরে সাথে সাথে set করার জন্য)
    forceSet: function(stuCount, finCount) {
      localStorage.setItem('wf_max_students', String(stuCount));
      localStorage.setItem('wf_max_finance', String(finCount));
      localStorage.setItem('wings_last_known_count', String(stuCount));
      localStorage.setItem('wings_last_known_finance', String(finCount));
      _log('✅', `MaxCount force-set: students=${stuCount} finance=${finCount}`);
    },
  };

  // ── SYNC FRESHNESS ─────────────────────────────────────────────
  const SyncFreshness = {
    update: () => localStorage.setItem('wings_last_sync_time', Date.now().toString()),
    isFresh: function () {
      const lastSync = parseInt(localStorage.getItem('wings_last_sync_time') || '0');
      return lastSync && (Date.now() - lastSync) < CFG.SYNC_FRESHNESS_MS;
    },
    getAge: function () {
      const lastSync = parseInt(localStorage.getItem('wings_last_sync_time') || '0');
      if (!lastSync) return 'never';
      const hours = Math.floor((Date.now() - lastSync) / 3600000);
      return hours < 1 ? 'recent' : `${hours}h ago`;
    },
  };

  // ── NETWORK QUALITY ────────────────────────────────────────────
  const NetworkQuality = {
    _failCount: 0, _successCount: 0,
    recordSuccess: function () {
      this._successCount++; this._failCount = 0;
      if (this._successCount >= 2) _networkQuality = 'good';
    },
    recordFailure: function () {
      this._failCount++; this._successCount = 0;
      if (this._failCount >= 2) _networkQuality = 'poor';
    },
    getQuality: () => !_online ? 'offline' : _networkQuality,
  };

  // ── LOGGING ───────────────────────────────────────────────────
  function _log(emoji, msg, data) {
    console.log(`[V39|${new Date().toLocaleTimeString()}] ${emoji} ${msg}`);
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

  function _showUserMessage(msg, type = 'info') {
    const toast = document.createElement('div');
    const colors = {
      error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#fee2e2' },
      warn:  { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fef3c7' },
      info:  { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#dbeafe' },
      success: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#d1fae5' }
    };
    const c = colors[type] || colors.info;
    toast.style.cssText = `position:fixed;top:70px;right:20px;z-index:10000;background:${c.bg};border:2px solid ${c.border};color:${c.text};padding:12px 18px;border-radius:8px;font-size:0.85rem;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:400px;`;
    toast.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 5000);
  }

  // ── V39: ENSURE deletedItems IS ALWAYS OBJECT (never array) ──
  function _ensureDeletedItemsObject(gd) {
    if (!gd) return;
    if (Array.isArray(gd.deletedItems)) {
      _log('🔧', 'V39: deletedItems was array — converting to object');
      const fixed = { students: [], finance: [], employees: [] };
      gd.deletedItems.forEach(function(item) {
        const t = (item.type || '').toLowerCase();
        if (t === 'student') fixed.students.push(item);
        else if (t === 'finance') fixed.finance.push(item);
        else if (t === 'employee') fixed.employees.push(item);
      });
      gd.deletedItems = fixed;
    } else if (!gd.deletedItems || typeof gd.deletedItems !== 'object') {
      gd.deletedItems = { students: [], finance: [], employees: [] };
    }
    if (!Array.isArray(gd.deletedItems.students)) gd.deletedItems.students = [];
    if (!Array.isArray(gd.deletedItems.finance)) gd.deletedItems.finance = [];
    if (!Array.isArray(gd.deletedItems.employees)) gd.deletedItems.employees = [];
  }

  // ── INIT ──────────────────────────────────────────────────────
  function _init() {
    if (_ready) return true;
    if (typeof window.supabase === 'undefined') return false;
    try {
      _sb = typeof window.getWingsSupabaseClient === 'function'
        ? window.getWingsSupabaseClient()
        : window.supabase.createClient(CFG.URL, CFG.KEY);
      if (!_sb) return false;
      _localVer = parseInt(localStorage.getItem('wings_local_version') || '0');
      _ready = true;
      _log('✅', `V39.0 initialized v${_localVer}`);
      return true;
    } catch (e) { _log('❌', 'Init failed', e); return false; }
  }

  async function _checkPartialTables() {
    try {
      const { error } = await _sb.from(CFG.TBL_STUDENTS).select('id').limit(1);
      _partialOK = !error;
      _log(_partialOK ? '✅' : '⚠️', _partialOK ? 'Partial tables ready' : 'Legacy mode');
    } catch (e) { _partialOK = false; }
  }

  // ── SAVE LOCAL ─────────────────────────────────────────────────
  function _saveLocal() {
    try {
      if (!window.globalData) return false;
      // ✅ V39: Ensure deletedItems before every save
      _ensureDeletedItemsObject(window.globalData);
      const finCount = (window.globalData.finance || []).length;
      const stuCount = (window.globalData.students || []).length;
      const finDeleted = MaxCount.getDeletedCount('finance');
      const stuDeleted = MaxCount.getDeletedCount('students');
      const finCheck = MaxCount.isSafe('finance', finCount, { deletedCount: finDeleted });
      const stuCheck = MaxCount.isSafe('students', stuCount, { deletedCount: stuDeleted });
      if (!finCheck.safe) {
        _log('🚫', 'saveLocal BLOCKED - Finance');
        _showUserMessage(finCheck.message, 'error');
        return false;
      }
      if (!stuCheck.safe) {
        _log('🚫', 'saveLocal BLOCKED - Students');
        _showUserMessage(stuCheck.message, 'error');
        return false;
      }
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      MaxCount.update('finance', finCount);
      MaxCount.update('students', stuCount);
      if (finCount > 0) localStorage.setItem('wings_last_known_finance', finCount.toString());
      if (stuCount > 0) localStorage.setItem('wings_last_known_count', stuCount.toString());
      return true;
    } catch (e) { _log('⚠️', 'saveLocal error', e); return false; }
  }

  // ── MERGE RECORDS ──────────────────────────────────────────────
  function _mergeRecords(localArr, cloudRows, keyFn) {
    const merged = new Map();
    (localArr || []).forEach(item => { const k = keyFn(item); if (k) merged.set(k, item); });
    (cloudRows || []).forEach(row => {
      if (!row.data) return;
      const k = keyFn(row.data);
      if (!k) return;
      if (row.deleted) merged.delete(k);
      else merged.set(k, row.data);
    });
    return Array.from(merged.values());
  }

  // ── PULL FROM CLOUD V39 ────────────────────────────────────────
  async function pullFromCloud(showUI = false, forceFullPull = false) {
    if (_pulling) { _log('⏸️', 'Pull in progress'); return false; }
    if (!_ready || !_sb) return false;
    if (Egress.hardThrottled()) {
      _log('🛑', 'Hard egress limit — pull blocked');
      _showUserMessage('অনেক বেশি request। Diagnostic থেকে "Egress Reset" করুন।', 'error');
      return false;
    }

    _pulling = true;
    _syncBusy = true;
    if (showUI) _showStatus('🔄 Syncing...');
    let _rollback = null;

    try {
      Egress.inc();
      if (window.globalData) _rollback = {
        students: JSON.parse(JSON.stringify(window.globalData.students || [])),
        finance: JSON.parse(JSON.stringify(window.globalData.finance || [])),
        employees: JSON.parse(JSON.stringify(window.globalData.employees || [])),
        cashBalance: window.globalData.cashBalance,
      };

      if (_partialOK) {
        const [stuRes, finRes, empRes, mainRes] = await Promise.all([
          _sb.from(CFG.TBL_STUDENTS).select('data,deleted').eq('academy_id', CFG.ACADEMY_ID),
          _sb.from(CFG.TBL_FINANCE).select('data,deleted').eq('academy_id', CFG.ACADEMY_ID),
          _sb.from(CFG.TBL_EMPLOYEES).select('data,deleted').eq('academy_id', CFG.ACADEMY_ID),
          _sb.from(CFG.TABLE).select('*').eq('id', CFG.RECORD).limit(1),
        ]);

        if (stuRes.error || finRes.error || empRes.error || mainRes.error) {
          throw new Error('Partial pull failed');
        }

        const gd = window.globalData || {};

        // ✅ V39: Ensure deletedItems before merge
        _ensureDeletedItemsObject(gd);

        const local = {
          students: gd.students || [],
          finance: gd.finance || [],
          employees: gd.employees || []
        };
        gd.students = _mergeRecords(local.students, stuRes.data, s => s.studentId || s.id || s.name);
        gd.finance = _mergeRecords(local.finance, finRes.data, f => f.id || f.timestamp);
        gd.employees = _mergeRecords(local.employees, empRes.data, e => e.id);

        const mainRec = mainRes.data?.[0];
        if (mainRec) {
          gd.cashBalance = mainRec.cash_balance ?? gd.cashBalance ?? 0;
          const _cBank = mainRec.bank_accounts;
          const _cMobile = mainRec.mobile_banking;
          gd.bankAccounts = (_cBank && _cBank.length > 0) ? _cBank : (gd.bankAccounts && gd.bankAccounts.length > 0 ? gd.bankAccounts : []);
          gd.mobileBanking = (_cMobile && _cMobile.length > 0) ? _cMobile : (gd.mobileBanking && gd.mobileBanking.length > 0 ? gd.mobileBanking : []);
          if (mainRec.settings) { gd.settings = Object.assign({}, gd.settings || {}, mainRec.settings); }
          if (mainRec.users && Array.isArray(mainRec.users) && mainRec.users.length > 0) { gd.users = mainRec.users; }
          _localVer = mainRec.version || _localVer;
          localStorage.setItem('wings_local_version', _localVer.toString());
        }

        // ✅ V39: Ensure deletedItems after merge too
        _ensureDeletedItemsObject(gd);

        window.globalData = gd;

        // ✅ V39 FIX: MaxCount force-set করো pull-এর পরেই
        MaxCount.forceSet(gd.students.length, gd.finance.length);

        // Save push snapshots
        try {
          const sSnap = {};
          gd.students.forEach(s => { const k = s.studentId || s.id || s.name; if(k) sSnap[k] = _hashRecord(s); });
          const fSnap = {};
          gd.finance.forEach(f => { const k = f.id || f.timestamp; if(k) fSnap[k] = _hashRecord(f); });
          _saveSnapshot('students', sSnap);
          _saveSnapshot('finance', fSnap);
          _log('📸', 'Snapshots saved after pull');
        } catch (err) { _log('⚠️', 'Snapshot save error', err); }

        _saveLocal();
        _rebuildSnapshots();
        SyncFreshness.update();
        NetworkQuality.recordSuccess();
        _log('✅', `Pull OK — stu:${gd.students.length} fin:${gd.finance.length} v${_localVer}`);
        if (showUI) _showStatus('✅ Synced');
        window.initialSyncComplete = true;

        // ✅ V39: Pull সম্পন্ন হলে snapshot নেওয়া নিরাপদ — flag set করো
        window._wf_pull_complete = true;

        return true;

      } else {
        // Legacy mode
        const { data, error } = await _sb.from(CFG.TABLE).select('*').eq('id', CFG.RECORD).limit(1);
        if (error) throw error;
        const rec = data?.[0];
        if (!rec) { _log('⚠️', 'No cloud data'); return false; }
        window.globalData = {
          students: rec.students || [],
          finance: rec.finance || [],
          employees: rec.employees || [],
          cashBalance: rec.cash_balance || 0,
          bankAccounts: rec.bank_accounts || [],
          mobileBanking: rec.mobile_banking || [],
          deletedItems: { students: [], finance: [], employees: [] }, // ✅ V39: always object
          settings: rec.settings || window.globalData?.settings || {},
          users: (rec.users && rec.users.length > 0) ? rec.users : (window.globalData?.users || []),
        };
        _localVer = rec.version || 0;
        localStorage.setItem('wings_local_version', _localVer.toString());
        MaxCount.forceSet(window.globalData.students.length, window.globalData.finance.length);
        _saveLocal();
        SyncFreshness.update();
        NetworkQuality.recordSuccess();
        _log('✅', `Legacy pull OK v${_localVer}`);
        window.initialSyncComplete = true;
        window._wf_pull_complete = true;
        return true;
      }
    } catch (e) {
      _log('❌', 'Pull failed', e);
      NetworkQuality.recordFailure();
      if (_rollback && window.globalData) {
        window.globalData.students = _rollback.students;
        window.globalData.finance = _rollback.finance;
        window.globalData.employees = _rollback.employees;
        window.globalData.cashBalance = _rollback.cashBalance;
        _log('↩️', 'Rolled back');
      }
      if (showUI) _showStatus('❌ Sync failed');
      return false;
    } finally {
      _pulling = false;
      _syncBusy = false;
      _cooldownUntil = Date.now() + 10000;
    }
  }

  // ── HASH & SNAPSHOT HELPERS ────────────────────────────────────
  function _hashRecord(record) {
    const str = JSON.stringify(record);
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h.toString(36);
  }

  function _loadSnapshot(table) {
    try { const raw = localStorage.getItem('wf_push_snapshot_' + table); return raw ? JSON.parse(raw) : {}; }
    catch { return {}; }
  }

  function _saveSnapshot(table, snapshot) {
    try {
      const str = JSON.stringify(snapshot);
      if (str.length > 500000) {
        const keys = Object.keys(snapshot);
        if (keys.length > 1000) {
          const trimmed = {};
          keys.slice(-1000).forEach(k => trimmed[k] = snapshot[k]);
          localStorage.setItem('wf_push_snapshot_' + table, JSON.stringify(trimmed));
          return;
        }
      }
      localStorage.setItem('wf_push_snapshot_' + table, str);
    } catch (e) {
      _log('⚠️', 'Snapshot save error', e);
      if (e.name === 'QuotaExceededError') localStorage.removeItem('wf_push_snapshot_' + table);
    }
  }

  function _getDelta(table, records, keyFn) {
    const prevSnapshot = _loadSnapshot(table);
    const newSnapshot = {}, changed = [], currentKeys = new Set();
    const snapshotWasEmpty = Object.keys(prevSnapshot).length === 0;
    records.forEach(function(record) {
      const key = keyFn(record);
      if (!key) return;
      const hash = _hashRecord(record);
      newSnapshot[key] = hash;
      currentKeys.add(key);
      if (!prevSnapshot[key] || prevSnapshot[key] !== hash) changed.push(record);
    });
    const deleted = Object.keys(prevSnapshot).filter(function(k) { return !currentKeys.has(k); });
    return { changed, deleted, snapshot: newSnapshot, snapshotWasEmpty };
  }

  function _rebuildSnapshots() {
    const gd = window.globalData;
    if (!gd) return;
    try {
      const sSnap = {};
      (gd.students || []).forEach(s => { const k = s.studentId || s.id || s.name; if (k) sSnap[k] = _hashRecord(s); });
      _saveSnapshot('students', sSnap);
      const fSnap = {};
      (gd.finance || []).forEach(f => { const k = f.id || f.timestamp; if (k) fSnap[k] = _hashRecord(f); });
      _saveSnapshot('finance', fSnap);
      _log('📸', `Snapshots rebuilt: ${Object.keys(sSnap).length}S ${Object.keys(fSnap).length}F`);
    } catch(e) { _log('⚠️', 'rebuildSnapshots error', e); }
  }
  window._rebuildSnapshots = _rebuildSnapshots;

  // ── PUSH TO CLOUD V39 ──────────────────────────────────────────
  async function pushToCloud(reason = 'auto') {
    if (_pushing) { _log('⏸️', 'Push in progress'); return false; }
    if (!_ready || !_sb || !window.globalData) return false;
    if (!_online) { _log('📵', 'Offline'); return false; }
    if (Egress.hardThrottled()) { _log('🛑', 'Hard egress limit — push blocked'); return false; }

    _pushing = true;
    _syncBusy = true;
    clearTimeout(_debounce);
    _debounce = null;

    try {
      Egress.inc();

      // ✅ V39: Ensure deletedItems before push
      _ensureDeletedItemsObject(window.globalData);

      const gd = window.globalData;
      const finCount = (gd.finance || []).length, stuCount = (gd.students || []).length;
      const finDeleted = MaxCount.getDeletedCount('finance');
      const stuDeleted = MaxCount.getDeletedCount('students');
      const finCheck = MaxCount.isSafe('finance', finCount, { deletedCount: finDeleted });
      const stuCheck = MaxCount.isSafe('students', stuCount, { deletedCount: stuDeleted });

      if (!finCheck.safe) {
        _log('🚫', 'Push BLOCKED - Finance');
        _showUserMessage(finCheck.message + ' Push blocked.', 'error');
        ConflictTracker.record('push_blocked', `Finance count কম: local=${finCount}`, finCount, finCheck.max);
        _log('🔄', 'Auto-recovery: pulling');
        await pullFromCloud(false, true);
        return false;
      }
      if (!stuCheck.safe) {
        _log('🚫', 'Push BLOCKED - Students');
        _showUserMessage(stuCheck.message + ' Push blocked.', 'error');
        ConflictTracker.record('push_blocked', `Student count কম: local=${stuCount}`, stuCount, stuCheck.max);
        _log('🔄', 'Auto-recovery: pulling');
        await pullFromCloud(false, true);
        return false;
      }

      // Version increment via RPC
      let _rpcOK = false;
      try {
        const { data: rpcVer, error: rpcErr } = await _sb.rpc('increment_version', { record_id: CFG.RECORD });
        if (!rpcErr && rpcVer) {
          _localVer = rpcVer;
          localStorage.setItem('wings_local_version', _localVer.toString());
          _log('✅', `Server version: ${_localVer}`);
          _rpcOK = true;
        } else { _log('⚠️', 'RPC failed — fallback', rpcErr); }
      } catch (rpcEx) { _log('⚠️', 'RPC error — fallback', rpcEx); }

      if (!_rpcOK) {
        const { data: vdata } = await _sb.from(CFG.TABLE).select('version,last_device').eq('id', CFG.RECORD).limit(1);
        const cloudRec = vdata?.[0], cloudVer = cloudRec?.version || 0;
        const isOtherDevice = cloudRec?.last_device && cloudRec.last_device !== DEVICE_ID;
        if (isOtherDevice && cloudVer >= _localVer) {
          _localVer = cloudVer;
          localStorage.setItem('wings_local_version', _localVer.toString());
          _suppressRender = true;
          await pullFromCloud(false, true);
          _suppressRender = false;
        }
        _localVer++;
        localStorage.setItem('wings_local_version', _localVer.toString());
      }

      if (_partialOK) {
        const tasks = [];
        let stuPushed = 0, finPushed = 0, stuTotal = 0, finTotal = 0;

        if (_dirty.has('students') || _dirty.size === 0) {
          const { changed, deleted, snapshot, snapshotWasEmpty: stuSnapEmpty } = _getDelta(
            'students', gd.students || [], s => s.studentId || s.id || s.name
          );
          stuTotal = (gd.students || []).length;
          stuPushed = changed.length + deleted.length;

          const doStuPush = async () => {
            if (stuSnapEmpty && changed.length > 0) {
              try {
                const _aid2 = encodeURIComponent(CFG.ACADEMY_ID);
                const _chkRes = await fetch(
                  `${CFG.URL}/rest/v1/wf_students?academy_id=eq.${_aid2}&deleted=eq.false&select=id`,
                  { headers: { apikey: CFG.KEY, Authorization: 'Bearer ' + CFG.KEY, Prefer: 'count=exact', Range: '0-99999' } }
                );
                const _cloudCount = parseInt(_chkRes.headers.get('content-range')?.split('/')[1] || '0', 10);
                if (_cloudCount >= stuTotal) {
                  _log('⏭️', `Students SKIPPED — cloud has ${_cloudCount} >= local ${stuTotal}`);
                  _saveSnapshot('students', snapshot);
                  return;
                }
                _log('📤', `Students: cloud ${_cloudCount} < local ${stuTotal} — pushing`);
              } catch(_chkErr) { _log('⚠️', 'Students count check failed', _chkErr); }
            }
            if (changed.length > 0) {
              const stuRows = changed.map(s => {
                const sid = s.studentId || s.id || s.name;
                return { id: `${CFG.ACADEMY_ID}_stu_${sid}`, academy_id: CFG.ACADEMY_ID, data: s, deleted: false };
              });
              const res = await _sb.from(CFG.TBL_STUDENTS).upsert(stuRows, { onConflict: 'id' });
              if (res && res.error) throw res.error;
              _log('📤', `Students: ${changed.length}/${stuTotal} pushed`);
            }
            // ✅ V39: deletedItems.students (object, not array)
            const stuDelItems = Array.isArray(gd.deletedItems?.students) ? gd.deletedItems.students : [];
            const stuDelRows = stuDelItems.map(item => {
              const recId = item.studentId || item.id || item.item?.studentId || item.item?.id;
              return recId ? { id: `${CFG.ACADEMY_ID}_stu_${recId}`, academy_id: CFG.ACADEMY_ID, data: null, deleted: true } : null;
            }).filter(x => x);
            if (stuDelRows.length > 0) {
              const resDel = await _sb.from(CFG.TBL_STUDENTS).upsert(stuDelRows, { onConflict: 'id' });
              if (resDel && resDel.error) throw resDel.error;
            }
            _saveSnapshot('students', snapshot);
          };
          tasks.push(doStuPush());
        }

        if (_dirty.has('finance') || _dirty.size === 0) {
          const { changed, deleted, snapshot: finSnapshot, snapshotWasEmpty: finSnapEmpty } = _getDelta(
            'finance', gd.finance || [], f => f.id || f.timestamp
          );
          finTotal = (gd.finance || []).length;
          finPushed = changed.length + deleted.length;

          const doFinPush = async () => {
            if (finSnapEmpty && changed.length > 0) {
              try {
                const _aid3 = encodeURIComponent(CFG.ACADEMY_ID);
                const _chkRes3 = await fetch(
                  `${CFG.URL}/rest/v1/wf_finance?academy_id=eq.${_aid3}&deleted=eq.false&select=id`,
                  { headers: { apikey: CFG.KEY, Authorization: 'Bearer ' + CFG.KEY, Prefer: 'count=exact', Range: '0-99999' } }
                );
                const _cloudCount3 = parseInt(_chkRes3.headers.get('content-range')?.split('/')[1] || '0', 10);
                if (_cloudCount3 >= finTotal) {
                  _log('⏭️', `Finance SKIPPED — cloud has ${_cloudCount3} >= local ${finTotal}`);
                  _saveSnapshot('finance', finSnapshot);
                  return;
                }
                _log('📤', `Finance: cloud ${_cloudCount3} < local ${finTotal} — pushing`);
              } catch(_chkErr3) { _log('⚠️', 'Finance count check failed', _chkErr3); }
            }
            if (changed.length > 0) {
              const finRows = changed.map(f => ({
                id: `${CFG.ACADEMY_ID}_fin_${f.id || f.timestamp}`,
                academy_id: CFG.ACADEMY_ID, data: f, deleted: false
              }));
              const res = await _sb.from(CFG.TBL_FINANCE).upsert(finRows, { onConflict: 'id' });
              if (res && res.error) throw res.error;
              _log('📤', `Finance: ${changed.length}/${finTotal} pushed`);
            }
            // ✅ V39: deletedItems.finance (object, not array)
            const finDelItems = Array.isArray(gd.deletedItems?.finance) ? gd.deletedItems.finance : [];
            const finDelRows = finDelItems.map(item => {
              const recId = item.id || item.item?.id;
              return recId ? { id: `${CFG.ACADEMY_ID}_fin_${recId}`, academy_id: CFG.ACADEMY_ID, data: null, deleted: true } : null;
            }).filter(x => x);
            if (finDelRows.length > 0) {
              const resDel = await _sb.from(CFG.TBL_FINANCE).upsert(finDelRows, { onConflict: 'id' });
              if (resDel && resDel.error) throw resDel.error;
            }
            _saveSnapshot('finance', finSnapshot);
          };
          tasks.push(doFinPush());
        }

        // Main record push
        const mainPayload = {
          id: CFG.RECORD, version: _localVer,
          last_updated: new Date().toISOString(), last_device: DEVICE_ID,
          last_action: reason, cash_balance: gd.cashBalance || 0,
          bank_accounts: gd.bankAccounts || [], mobile_banking: gd.mobileBanking || [],
          settings: gd.settings || null, users: gd.users || null
        };
        tasks.push(_sb.from(CFG.TABLE).upsert(mainPayload, { onConflict: 'id' }).then(res => {
          if (res.error?.message?.includes('column')) {
            const fallback = { id: CFG.RECORD, version: _localVer, last_updated: mainPayload.last_updated, last_device: DEVICE_ID, last_action: reason, cash_balance: gd.cashBalance || 0, bank_accounts: gd.bankAccounts || [], mobile_banking: gd.mobileBanking || [] };
            return _sb.from(CFG.TABLE).upsert(fallback, { onConflict: 'id' });
          }
        }));

        await Promise.all(tasks);
        _dirty.clear();
        NetworkQuality.recordSuccess();
        SyncFreshness.update();
        const totalPushed = stuPushed + finPushed;
        if (totalPushed === 0) { _log('✅', `Push OK (${reason}) v${_localVer} — no changes`); }
        else { _log('✅', `Push OK (${reason}) v${_localVer} — ${totalPushed} records`); }
        return true;

      } else {
        // Legacy
        await _sb.from(CFG.TABLE).upsert({
          id: CFG.RECORD, version: _localVer, students: gd.students || [],
          finance: gd.finance || [], employees: gd.employees || [],
          cash_balance: gd.cashBalance || 0, bank_accounts: gd.bankAccounts || [],
          mobile_banking: gd.mobileBanking || [], last_updated: new Date().toISOString(),
          last_device: DEVICE_ID, last_action: reason
        }, { onConflict: 'id' });
        NetworkQuality.recordSuccess();
        SyncFreshness.update();
        _log('✅', `Legacy push OK v${_localVer}`);
        return true;
      }
    } catch (e) {
      _log('❌', 'Push failed', e);
      NetworkQuality.recordFailure();
      _showUserMessage('Push failed: ' + e.message, 'error');
      return false;
    } finally {
      _pushing = false;
      _syncBusy = false;
      _cooldownUntil = Date.now() + 10000;
    }
  }

  // ── MARK DIRTY ─────────────────────────────────────────────────
  window.markDirty = function (field) {
    if (field) _dirty.add(field); else _dirty.add('all');
    _log('📝', `Dirty: ${field || 'all'}`);
  };

  function _schedulePush(reason) {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => pushToCloud(reason), CFG.PUSH_DEBOUNCE_MS);
  }

  function _patchSaveToStorage() {
    const original = window.saveToStorage;
    if (!original) return;
    window.saveToStorage = function (...args) {
      const result = original.apply(this, args);
      if (result !== false) _schedulePush('saveToStorage');
      return result;
    };
    _log('🔧', 'Patched saveToStorage');
  }

  // ── VERSION CHECK ──────────────────────────────────────────────
  async function _versionCheck() {
    if (!_ready || !_sb || !_tabVisible) return;
    if (Egress.throttled()) { _log('🔶', 'Soft egress — version check skipped'); return; }
    try {
      Egress.inc();
      const { data } = await _sb.from(CFG.TABLE).select('version').eq('id', CFG.RECORD).limit(1);
      const cloudVer = data?.[0]?.version || 0;
      const gap = cloudVer - _localVer;
      if (gap <= 0) return;
      _log('🔔', `Version gap: cloud=${cloudVer} local=${_localVer} gap=${gap}`);
      if (gap >= CFG.VERSION_GAP_WARN) {
        ConflictTracker.record('version_gap', `Gap: ${gap}`, _localVer, cloudVer);
        const pulled = await pullFromCloud(false, true);
        if (pulled && gap >= CFG.VERSION_GAP_FULL) {
          if (!_suppressRender && typeof window.renderFullUI === 'function') window.renderFullUI();
          _showUserMessage(`Version sync হয়েছে (gap: ${gap})।`, 'success');
        }
      } else {
        await pullFromCloud(false, true);
      }
    } catch (e) { _log('⚠️', 'Version check failed', e); }
  }

  // ── MONITOR ────────────────────────────────────────────────────
  function _installMonitor() {
    let _lastFin = -1, _lastStu = -1, _lastCash = null;
    setInterval(() => {
      if (_pushing || _pulling || _syncBusy || Date.now() < _cooldownUntil) return;
      const gd = window.globalData;
      if (!gd) return;
      const fc = (gd.finance || []).length, sc = (gd.students || []).length, cb = gd.cashBalance;
      if (_lastFin === -1) { _lastFin = fc; _lastStu = sc; _lastCash = cb; return; }
      if (fc !== _lastFin || sc !== _lastStu || cb !== _lastCash) {
        _log('📡', `Change: fin ${_lastFin}→${fc} stu ${_lastStu}→${sc}`);
        _lastFin = fc; _lastStu = sc; _lastCash = cb;
        window.markDirty && window.markDirty();
        _schedulePush('monitor');
      }
    }, 60000);
  }

  // ── V39: STARTUP INTEGRITY CHECK (Fresh Browser Aware) ────────
  let _integrityCheckDidPull = false;

  async function _startupIntegrityCheck() {
    _integrityCheckDidPull = false;
    const gd = window.globalData;

    // ✅ V39 BUG 2 FIX: Startup-এ deletedItems fix
    if (gd) _ensureDeletedItemsObject(gd);

    const hasLocalData = localStorage.getItem('wingsfly_data');
    const finCount = (gd?.finance || []).length;
    const stuCount = (gd?.students || []).length;

    // ✅ V39 BUG 1 FIX: Fresh browser — localStorage নেই বা data 0
    if (!hasLocalData || (finCount === 0 && stuCount === 0)) {
      _log('🆕', 'Fresh browser / empty localStorage — forcing cloud pull');
      if (_online && _sb) {
        // UI hide করো যতক্ষণ pull চলে
        const ov = document.getElementById('dashboardOverview');
        const mainContent = document.querySelector('.main-content, #mainContent, [data-content]');
        if (ov) ov.style.visibility = 'hidden';
        if (mainContent) mainContent.style.opacity = '0.3';

        _showUserMessage('নতুন browser detect হয়েছে। Cloud থেকে data লোড হচ্ছে...', 'info');

        try {
          const pulled = await pullFromCloud(false, true);
          if (pulled) {
            // ✅ V39: MaxCount ইতিমধ্যে pullFromCloud-এ set হয়েছে
            _log('✅', `Fresh browser restore: stu=${window.globalData?.students?.length} fin=${window.globalData?.finance?.length}`);
            _showUserMessage(`✅ Data লোড সম্পন্ন! Students: ${window.globalData?.students?.length}, Finance: ${window.globalData?.finance?.length}`, 'success');
            if (typeof window.renderFullUI === 'function') window.renderFullUI();
            _integrityCheckDidPull = true;
          } else {
            _log('❌', 'Fresh browser pull failed');
            _showUserMessage('Cloud থেকে data লোড করতে সমস্যা হচ্ছে। Internet connection চেক করুন।', 'error');
          }
        } catch (e) {
          _log('❌', 'Fresh browser pull error', e);
        } finally {
          if (ov) ov.style.visibility = '';
          if (mainContent) mainContent.style.opacity = '';
        }
      }
      return;
    }

    // Normal startup — MaxCount check
    const finDeleted = MaxCount.getDeletedCount('finance');
    const stuDeleted = MaxCount.getDeletedCount('students');
    const finCheck = MaxCount.isSafe('finance', finCount, { deletedCount: finDeleted });
    const stuCheck = MaxCount.isSafe('students', stuCount, { deletedCount: stuDeleted });
    if (finCheck.safe && stuCheck.safe) {
      _log('✅', `Startup OK - fin:${finCount} stu:${stuCount}`);
      return;
    }

    _log('🚨', 'Startup integrity FAIL — checking cloud');
    if (!_online || !_sb) {
      if (SyncFreshness.isFresh()) {
        _log('⚠️', 'Cloud unavailable, local fresh');
        _showUserMessage('Cloud unavailable, using recent cache', 'warn');
        return;
      } else {
        _log('❌', 'Cloud unavailable, local stale');
        _showUserMessage('Cloud unavailable and local data old!', 'error');
        return;
      }
    }

    // Cloud count check — local > cloud → push, cloud > local → pull
    try {
      const aid = encodeURIComponent(CFG.ACADEMY_ID);
      const hdrs = { apikey: CFG.KEY, Authorization: 'Bearer ' + CFG.KEY, Prefer: 'count=exact', Range: '0-999999' };
      const [stuRes, finRes] = await Promise.all([
        fetch(`${CFG.URL}/rest/v1/wf_students?academy_id=eq.${aid}&deleted=eq.false&select=id`, { headers: hdrs }),
        fetch(`${CFG.URL}/rest/v1/wf_finance?academy_id=eq.${aid}&deleted=eq.false&select=id`, { headers: hdrs }),
      ]);
      const cloudStu = parseInt(stuRes.headers.get('content-range')?.split('/')[1] || '0', 10);
      const cloudFin = parseInt(finRes.headers.get('content-range')?.split('/')[1] || '0', 10);
      _log('📊', `Startup: local stu=${stuCount} fin=${finCount} | cloud stu=${cloudStu} fin=${cloudFin}`);

      if (stuCount > cloudStu || finCount > cloudFin) {
        _log('📤', `Local > Cloud — pushing`);
        _showUserMessage(`Local data বেশি — Cloud-এ sync হচ্ছে...`, 'info');
        MaxCount.forceSet(stuCount, finCount);
        const ok = await pushToCloud('startup-push');
        if (ok) {
          _showUserMessage(`✅ ${stuCount} students cloud-এ push হয়েছে!`, 'success');
          _integrityCheckDidPull = true;
        }
        return;
      }
    } catch(countErr) {
      _log('⚠️', 'Cloud count check failed — falling back', countErr);
    }

    const ov2 = document.getElementById('dashboardOverview');
    if (ov2) ov2.style.visibility = 'hidden';
    try {
      const tasks = [];
      if (!finCheck.safe && _partialOK) {
        tasks.push(_sb.from(CFG.TBL_FINANCE).select('data').eq('academy_id', CFG.ACADEMY_ID).eq('deleted', false).then(({ data }) => {
          if (data && data.length > finCount) {
            gd.finance = data.map(r => r.data);
            MaxCount.update('finance', gd.finance.length);
            _log('✅', `Force loaded finance: ${gd.finance.length}`);
          }
        }));
      }
      if (!stuCheck.safe && _partialOK) {
        tasks.push(_sb.from(CFG.TBL_STUDENTS).select('data').eq('academy_id', CFG.ACADEMY_ID).eq('deleted', false).then(({ data }) => {
          if (data && data.length > 0 && data.length > stuCount) {
            gd.students = data.map(r => r.data).filter(s => s);
            MaxCount.update('students', gd.students.length);
            _log('✅', `Force loaded students: ${gd.students.length}`);
          }
        }));
      }
      await Promise.all(tasks);
      _saveLocal();
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      _integrityCheckDidPull = true;
      _showUserMessage('Data recovered from cloud', 'success');
    } catch (e) {
      _log('⚠️', 'Startup check failed', e);
    } finally {
      if (ov2) ov2.style.visibility = '';
    }
  }

  // ── NETWORK & VISIBILITY ───────────────────────────────────────
  function _setupNetwork() {
    window.addEventListener('online', () => {
      _online = true; _log('🌐', 'Online');
      NetworkQuality.recordSuccess();
      _suppressRender = true;
      pullFromCloud(false).then(() => { _suppressRender = false; });
    });
    window.addEventListener('offline', () => { _online = false; _log('📵', 'Offline'); });
  }

  function _setupVisibility() {
    document.addEventListener('visibilitychange', () => {
      _tabVisible = !document.hidden;
      if (_tabVisible) { _log('👁️', 'Tab visible'); setTimeout(_versionCheck, 1000); }
    });
  }

  function _setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (!window.globalData) return;
      const gd = window.globalData;
      const mainPayload = {
        id: CFG.RECORD, version: _localVer + 1,
        last_updated: new Date().toISOString(), last_device: DEVICE_ID,
        last_action: 'page-close', cash_balance: gd.cashBalance || 0,
        bank_accounts: gd.bankAccounts || [], mobile_banking: gd.mobileBanking || [],
      };
      const mainUrl = `${CFG.URL}/rest/v1/${CFG.TABLE}?on_conflict=id`;
      const hdrs = { 'Content-Type': 'application/json', 'apikey': CFG.KEY, 'Authorization': `Bearer ${CFG.KEY}`, 'Prefer': 'resolution=merge-duplicates' };
      try {
        navigator.sendBeacon(mainUrl, new Blob([JSON.stringify(mainPayload)], { type: 'application/json' }));
      } catch (e) {
        fetch(mainUrl, { method: 'POST', headers: hdrs, body: JSON.stringify(mainPayload), keepalive: true }).catch(() => {});
      }

      if (_dirty.size > 0 && _partialOK) {
        if (_dirty.has('students') && (gd.students || []).length > 0) {
          const stuRows = (gd.students || []).slice(0, 50).map(s => {
            const sid = s.studentId || s.id || s.name;
            return { id: `${CFG.ACADEMY_ID}_stu_${sid}`, academy_id: CFG.ACADEMY_ID, data: s, deleted: false };
          });
          const stuUrl = `${CFG.URL}/rest/v1/${CFG.TBL_STUDENTS}?on_conflict=id`;
          try { navigator.sendBeacon(stuUrl, new Blob([JSON.stringify(stuRows)], { type: 'application/json' })); }
          catch (e) { fetch(stuUrl, { method: 'POST', headers: hdrs, body: JSON.stringify(stuRows), keepalive: true }).catch(() => {}); }
        }
        if (_dirty.has('finance') && (gd.finance || []).length > 0) {
          const finRows = (gd.finance || []).slice(0, 50).map(f => ({
            id: `${CFG.ACADEMY_ID}_fin_${f.id}`, academy_id: CFG.ACADEMY_ID, data: f, deleted: false
          }));
          const finUrl = `${CFG.URL}/rest/v1/${CFG.TBL_FINANCE}?on_conflict=id`;
          try { navigator.sendBeacon(finUrl, new Blob([JSON.stringify(finRows)], { type: 'application/json' })); }
          catch (e) { fetch(finUrl, { method: 'POST', headers: hdrs, body: JSON.stringify(finRows), keepalive: true }).catch(() => {}); }
        }
      }
    });
  }

  function _showStatus(msg) { const el = document.getElementById('syncStatusText'); if (el) el.textContent = msg; }

  // ── REALTIME SUBSCRIPTION ──────────────────────────────────────
  function _setupRealtime() {
    if (!_sb) return;
    _sb.channel('version-watch')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: CFG.TABLE, filter: `id=eq.${CFG.RECORD}` },
        payload => {
          const cloudVer = payload.new?.version;
          if (cloudVer && cloudVer > _localVer) {
            _log('🔔', `Realtime: cloud v${cloudVer}`);
            pullFromCloud(false, true);
          }
        })
      .subscribe();
    _log('📡', 'Realtime subscription active');
  }

  // ── V39: SNAPSHOT GUARD ────────────────────────────────────────
  // snapshot-system.js এর takeSnapshot() কে guard করা হচ্ছে
  // Fresh browser-এ pull complete হওয়ার আগে snapshot নেওয়া বন্ধ
  function _installSnapshotGuard() {
    const origTakeSnapshot = window.takeSnapshot;
    if (typeof origTakeSnapshot !== 'function') return;
    if (origTakeSnapshot._v39Guarded) return;

    window.takeSnapshot = function() {
      // Fresh browser-এ pull complete না হলে snapshot নেওয়া বন্ধ
      if (_isFreshBrowser && !window._wf_pull_complete) {
        _log('⏸️', 'Snapshot BLOCKED — fresh browser pull not complete yet');
        return;
      }
      // data শূন্য থাকলে snapshot নেওয়া বন্ধ
      const stuLen = (window.globalData?.students || []).length;
      const finLen = (window.globalData?.finance || []).length;
      if (stuLen === 0 && finLen === 0) {
        _log('⏸️', 'Snapshot BLOCKED — data is empty (0 students, 0 finance)');
        return;
      }
      return origTakeSnapshot.apply(this, arguments);
    };
    window.takeSnapshot._v39Guarded = true;
    _log('🛡️', 'V39: Snapshot guard installed');
  }

  // ── FORCE PUSH ONLY ────────────────────────────────────────────
  async function forcePushOnly(reason) {
    _log('🚀', 'forcePushOnly: resetting MaxCount then pushing...');
    const data = JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
    const stuLen = (data.students || []).length;
    const finLen = (data.finance || []).length;
    MaxCount.forceSet(stuLen, finLen);
    if (window.globalData) {
      if (stuLen > (window.globalData.students || []).length) window.globalData.students = data.students || [];
      if (finLen > (window.globalData.finance || []).length) window.globalData.finance = data.finance || [];
    }
    localStorage.removeItem('wf_push_snapshot_students');
    localStorage.removeItem('wf_push_snapshot_finance');
    _log('🗑️', 'Snapshots cleared before force push');
    const ok = await pushToCloud(reason || 'forcePushOnly');
    if (ok) {
      _rebuildSnapshots();
      _showUserMessage(`✅ ${stuLen} students, ${finLen} finance cloud-এ push হয়েছে!`, 'success');
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
    }
    return ok;
  }

  // ── SMART SYNC ─────────────────────────────────────────────────
  async function _smartSync() {
    _log('🔄', 'smartSync: checking counts...');
    try {
      const aid = encodeURIComponent(CFG.ACADEMY_ID);
      const hdrs = { apikey: CFG.KEY, Authorization: 'Bearer ' + CFG.KEY, Prefer: 'count=exact', Range: '0-999999' };
      const [stuRes, finRes] = await Promise.all([
        fetch(`${CFG.URL}/rest/v1/wf_students?academy_id=eq.${aid}&deleted=eq.false&select=id`, { headers: hdrs }),
        fetch(`${CFG.URL}/rest/v1/wf_finance?academy_id=eq.${aid}&deleted=eq.false&select=id`, { headers: hdrs }),
      ]);
      const cloudStu = parseInt(stuRes.headers.get('content-range')?.split('/')[1] || '0', 10);
      const cloudFin = parseInt(finRes.headers.get('content-range')?.split('/')[1] || '0', 10);
      const localData = JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
      const localStu = (localData.students || []).length;
      const localFin = (localData.finance || []).length;
      _log('📊', `smartSync: local stu=${localStu} fin=${localFin} | cloud stu=${cloudStu} fin=${cloudFin}`);

      if (localStu > cloudStu || localFin > cloudFin) {
        _log('📤', 'Local > Cloud — force pushing');
        _showUserMessage('Local data বেশি — Cloud-এ push হচ্ছে...', 'info');
        return await forcePushOnly('smartSync-push');
      } else {
        _log('📥', 'Cloud >= Local — pulling');
        await pullFromCloud(false, true);
        await pushToCloud('smartSync-push');
        if (typeof window.renderFullUI === 'function') window.renderFullUI();
        return true;
      }
    } catch(e) {
      _log('⚠️', 'smartSync failed — fallback', e);
      await pullFromCloud(false, true);
      await pushToCloud('smartSync-fallback');
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      return true;
    }
  }

  // ── STARTUP ────────────────────────────────────────────────────
  async function _start() {
    if (!_init()) { setTimeout(_start, 2000); return; }
    _log('🚀', '══════════════════════════════════════');
    _log('🚀', 'Wings Fly V39.0 — FRESH BROWSER FIX');
    _log('🚀', '══════════════════════════════════════');
    _log('💡', `Egress: ${Egress.count()}/${CFG.EGRESS_LIMIT} | Age: ${SyncFreshness.getAge()} | v${_localVer}`);
    _log('💡', `Fresh browser: ${_isFreshBrowser}`);

    const eInfo = Egress.getInfo();
    if (eInfo.throttled) _log('⚠️', `Egress soft-throttled (${eInfo.count}/${eInfo.limit})`);
    if (eInfo.hardThrottled) _log('🛑', `Egress hard-throttled — all sync paused`);

    await _checkPartialTables();
    _setupNetwork();
    _setupVisibility();
    _setupBeforeUnload();
    _patchSaveToStorage();

    // ✅ V39: Snapshot guard install করো
    // DOMContentLoaded-এর পরে install করো যাতে takeSnapshot ইতিমধ্যে defined থাকে
    if (typeof window.takeSnapshot === 'function') {
      _installSnapshotGuard();
    } else {
      // takeSnapshot পরে লোড হলেও catch করো
      const _snapInterval = setInterval(() => {
        if (typeof window.takeSnapshot === 'function') {
          _installSnapshotGuard();
          clearInterval(_snapInterval);
        }
      }, 500);
      setTimeout(() => clearInterval(_snapInterval), 10000);
    }

    window.__v39_sync_active = true;
    await _startupIntegrityCheck();

    if (!_integrityCheckDidPull) {
      await pullFromCloud(false);
    } else {
      _log('✅', 'Pull skipped — integrity check already fetched');
    }

    _setupRealtime();
    setInterval(() => { if (_tabVisible && !Egress.hardThrottled()) pullFromCloud(true); }, CFG.FULL_PULL_MS);
    setTimeout(_installMonitor, 3000);
    _log('🎉', 'V39.0 ready!');
    _showStatus('✅ V39.0 ready');
  }

  // ── PUBLIC API ─────────────────────────────────────────────────
  window.wingsSync = {
    fullSync: async () => { await pullFromCloud(false, true); await pushToCloud('Manual'); if (typeof window.renderFullUI === 'function') window.renderFullUI(); },
    smartSync: _smartSync,
    forcePush: forcePushOnly,
    pushNow: (reason) => pushToCloud(reason || 'Manual'),
    pullNow: async () => { await pullFromCloud(false, true); if (typeof window.renderFullUI === 'function') window.renderFullUI(); },
    markDirty: (field) => window.markDirty && window.markDirty(field),
    forceRecovery: async () => {
      _log('🔄', 'Manual recovery');
      await pullFromCloud(true, true);
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      _showUserMessage('Recovery complete', 'success');
    },
    resetEgress: (pin) => {
      const storedHash = localStorage.getItem('wings_admin_pin_hash');
      if (storedHash) {
        if (_hashRecord({ pin }) !== storedHash) { console.warn('❌ Invalid PIN.'); return false; }
      } else {
        if (sessionStorage.getItem('userRole') !== 'admin') { console.warn('❌ Admin access required to reset Egress.'); return false; }
      }
      Egress.reset(); return true;
    },
    forceVersionSync: async () => {
      _log('🔄', 'Force version sync');
      Egress.reset();
      const pulled = await pullFromCloud(false, true);
      if (pulled && typeof window.renderFullUI === 'function') window.renderFullUI();
      _showUserMessage('Version sync সম্পন্ন।', 'success');
      return pulled;
    },
    getEgressInfo: () => Egress.getInfo(),
    getStatus: () => ({
      version: _localVer, online: _online, partialOK: _partialOK,
      dirty: [..._dirty], initialSync: window.initialSyncComplete,
      egress: Egress.count(), egressInfo: Egress.getInfo(),
      tabVisible: _tabVisible, isFreshBrowser: _isFreshBrowser,
      pullComplete: !!window._wf_pull_complete,
      maxFinance: MaxCount.get('finance'), maxStudents: MaxCount.get('students'),
      networkQuality: NetworkQuality.getQuality(), dataAge: SyncFreshness.getAge(),
    }),
  };

  // Legacy aliases
  window.saveToCloud = () => pushToCloud('saveToCloud');
  window.loadFromCloud = (force = false) => pullFromCloud(false, force);
  window.manualCloudSync = window.wingsSync.smartSync;
  window.manualSync = window.wingsSync.smartSync;
  window.scheduleSyncPush = (reason) => { window.markDirty && window.markDirty(); _schedulePush(reason); };

  // Start
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _start);
  else _start();

})();

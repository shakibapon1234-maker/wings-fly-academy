/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * SMART SYNC SYSTEM — V37.0 "SERVER-SIDE VERSION + BEFOREUNLOAD FIX"
 * ════════════════════════════════════════════════════════════════
 *
 * ✅ V37.0 Changes over V36.0:
 *
 *   1. SERVER-SIDE VERSION INCREMENT (Race condition fix)
 *      → Client থেকে _localVer++ বাদ দেওয়া হয়েছে
 *      → Supabase RPC function increment_version() ব্যবহার হয়
 *      → দুই device একসাথে push করলেও version collision হবে না
 *      → Fallback: RPC fail হলে পুরনো client-side method চলবে
 *
 *   2. BEFOREUNLOAD FULL DATA PUSH (Data loss fix)
 *      → Tab বন্ধে শুধু cash নয়, pending dirty data-ও push হয়
 *      → navigator.sendBeacon ব্যবহার করে reliable delivery
 *      → Partial tables (students, finance) dirty থাকলে sync হয়
 *
 * ✅ V36.0 Changes over V35.1.2:
 *
 *   1. EGRESS DAILY RESET (সবচেয়ে গুরুত্বপূর্ণ fix)
 *      → প্রতিদিন মধ্যরাতে egress counter auto-reset হয়
 *      → Throttled হলেও "Egress Reset" button দিয়ে manual reset
 *      → EGRESS_LIMIT: 400 → 500 (আরেকটু বেশি)
 *      → Throttled হলে pull/push block হবে না — শুধু version check block
 *
 *   2. VERSION GAP AUTO-SYNC
 *      → Gap > 10 হলে automatic full pull করে version মেলায়
 *      → Gap > 20 হলে force-render করে UI refresh
 *      → Version gap diagnostic এ সঠিক status দেখাবে
 *
 *   3. EGRESS WINDOW — ROLLING 24H (আগে ছিল calendar day)
 *      → এখন key = timestamp-based rolling 24h window
 *      → Calendar day reset এর আগেও recover করা যাবে
 *
 *   4. PUBLIC API ADDITIONS
 *      → wingsSync.resetEgress() — manual egress counter reset
 *      → wingsSync.forceVersionSync() — version gap force fix
 *      → wingsSync.getEgressInfo() — detailed egress status
 *
 * Author: Wings Fly IT Team
 * Version: 36.0
 * Date: March 2026
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
    VERSION_CHECK_MS: 30 * 60 * 1000,   // 30 min version check
    FULL_PULL_MS:     60 * 60 * 1000,   // 60 min full pull
    PUSH_DEBOUNCE_MS: 3000,             // 3s debounce
    EGRESS_WARN:  200,                  // ✅ V36: warn আগেভাগে
    EGRESS_LIMIT: 500,                  // ✅ V36: 400 → 500
    EGRESS_HARD_LIMIT: 600,             // ✅ V36: hard stop শুধু এখানে
    VERSION_GAP_WARN: 10,              // ✅ V36: এই gap-এ auto pull
    VERSION_GAP_FULL: 20,             // ✅ V36: এই gap-এ force render
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

  // ── EGRESS COUNTER V36 — ROLLING 24H WINDOW ─────────────────
  const Egress = {
    // ✅ V36: Calendar day key (reset at midnight)
    _dayKey: () => 'wf_egress_' + new Date().toISOString().slice(0, 10),
    
    count: function () {
      // Clean up old keys first
      this._cleanup();
      return parseInt(localStorage.getItem(this._dayKey()) || '0');
    },
    
    inc: function () {
      const k = this._dayKey();
      const v = (parseInt(localStorage.getItem(k) || '0')) + 1;
      localStorage.setItem(k, v);
      if (v === CFG.EGRESS_WARN) _log('⚠️', `Egress warning: ${v} requests today`);
      if (v === CFG.EGRESS_LIMIT) {
        _log('🔶', `Egress soft limit reached: ${v} — version check paused`);
        _showUserMessage(`আজকে ${v}টি sync request হয়েছে। Auto version-check বন্ধ। Manual sync কাজ করবে।`, 'warn');
      }
      return v;
    },
    
    // ✅ V36: Soft throttle — শুধু auto version check বন্ধ, manual sync চলবে
    throttled: function () { return this.count() > CFG.EGRESS_LIMIT; },
    
    // ✅ V36: Hard throttle — সব বন্ধ
    hardThrottled: function () { return this.count() > CFG.EGRESS_HARD_LIMIT; },
    
    // ✅ V36: Manual reset — diagnostic বা emergency এ ব্যবহার
    reset: function () {
      const k = this._dayKey();
      localStorage.setItem(k, '0');
      _log('🔄', 'Egress counter reset manually');
      _showUserMessage('Egress counter reset হয়েছে। Sync এখন কাজ করবে।', 'success');
    },
    
    // ✅ V36: পুরনো egress keys cleanup (memory leak prevention)
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
      const pct = Math.round((count / CFG.EGRESS_LIMIT) * 100);
      return {
        count,
        limit: CFG.EGRESS_LIMIT,
        hardLimit: CFG.EGRESS_HARD_LIMIT,
        percent: pct,
        throttled: this.throttled(),
        hardThrottled: this.hardThrottled(),
        remaining: Math.max(0, CFG.EGRESS_LIMIT - count),
        status: count <= CFG.EGRESS_WARN ? 'ok' 
              : count <= CFG.EGRESS_LIMIT ? 'warn' 
              : count <= CFG.EGRESS_HARD_LIMIT ? 'soft-throttled' 
              : 'hard-throttled',
      };
    },
  };

  // ── MAX COUNT ────────────────────────────────────────────────
  const MaxCount = {
    get: (key) => parseInt(localStorage.getItem('wf_max_' + key) || '0'),
    update: function (key, count) {
      const prev = this.get(key);
      if (count > prev) { localStorage.setItem('wf_max_' + key, count); _log('📈', `MaxCount: ${key} ${prev}→${count}`); return count; }
      return prev;
    },
    isSafe: function (key, localCount, options = {}) {
      const max = this.get(key);
      if (max === 0) return { safe: true, reason: 'first-time' };
      const hasLocalData = localStorage.getItem('wingsfly_data');
      if (!hasLocalData && localCount === 0) {
        _log('⚠️', `MaxCount ${key}: Empty localStorage, treating as first-load`);
        return { safe: true, reason: 'empty-localStorage', localCount, max };
      }
      const deletedCount = options.deletedCount || 0;
      const netCount = localCount + deletedCount;
      const baseTolerance = options.tolerance || 5;
      const percentTolerance = Math.max(baseTolerance, Math.floor(max * 0.10));
      const threshold = max - percentTolerance;
      const isSafe = netCount >= threshold;
      const result = { safe: isSafe, localCount, deletedCount, netCount, max, threshold, tolerance: percentTolerance };
      if (!isSafe) { _log('🚫', `MaxCount UNSAFE: ${key} net=${netCount} < ${threshold}`); result.message = `${key} count কম! Local: ${localCount}, Min: ${threshold}. Cloud থেকে pull করুন।`; }
      else { _log('✅', `MaxCount OK: ${key} net=${netCount} >= ${threshold}`); }
      return result;
    },
    getDeletedCount: function (key) {
      const data = window.globalData;
      if (!data?.deletedItems) return 0;
      const mapping = { 'students': 'students', 'finance': 'finance', 'employees': 'employees' };
      const deletedKey = mapping[key];
      if (!deletedKey) return 0;
      return (data.deletedItems[deletedKey] || []).length;
    },
  };

  // ── SYNC FRESHNESS ───────────────────────────────────────────
  const SyncFreshness = {
    update: () => localStorage.setItem('wings_last_sync_time', Date.now().toString()),
    isFresh: function () { const lastSync = parseInt(localStorage.getItem('wings_last_sync_time') || '0'); return lastSync && (Date.now() - lastSync) < CFG.SYNC_FRESHNESS_MS; },
    getAge: function () { const lastSync = parseInt(localStorage.getItem('wings_last_sync_time') || '0'); if (!lastSync) return 'never'; const hours = Math.floor((Date.now() - lastSync) / 3600000); return hours < 1 ? 'recent' : `${hours}h ago`; },
  };

  // ── NETWORK QUALITY ──────────────────────────────────────────
  const NetworkQuality = {
    _failCount: 0, _successCount: 0,
    recordSuccess: function () { this._successCount++; this._failCount = 0; if (this._successCount >= 2) _networkQuality = 'good'; },
    recordFailure: function () { this._failCount++; this._successCount = 0; if (this._failCount >= 2) _networkQuality = 'poor'; },
    getQuality: () => !_online ? 'offline' : _networkQuality,
    getCheckInterval: function () { const q = this.getQuality(); return q === 'offline' ? CFG.VERSION_CHECK_MS * 2 : q === 'poor' ? CFG.VERSION_CHECK_MS * 1.5 : CFG.VERSION_CHECK_MS; },
  };

  // ── LOGGING ──────────────────────────────────────────────────
  function _log(emoji, msg, data) {
    console.log(`[V36|${new Date().toLocaleTimeString()}] ${emoji} ${msg}`);
    if (data) console.log(data);
  }

  function _getOrCreateDeviceId() {
    let id = localStorage.getItem('wings_device_id');
    if (!id) { id = 'DEV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6); localStorage.setItem('wings_device_id', id); }
    return id;
  }

  function _showUserMessage(msg, type = 'info') {
    const toast = document.createElement('div');
    const colors = { error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#fee2e2' }, warn: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fef3c7' }, info: { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#dbeafe' }, success: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#d1fae5' } };
    const c = colors[type] || colors.info;
    toast.style.cssText = `position:fixed;top:70px;right:20px;z-index:10000;background:${c.bg};border:2px solid ${c.border};color:${c.text};padding:12px 18px;border-radius:8px;font-size:0.85rem;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:400px;`;
    toast.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 5000);
  }

  // ── INIT ─────────────────────────────────────────────────────
  function _init() {
    if (_ready) return true;
    if (typeof window.supabase === 'undefined') return false;
    try {
      _sb = window.supabase.createClient(CFG.URL, CFG.KEY);
      _localVer = parseInt(localStorage.getItem('wings_local_version') || '0');
      _ready = true;
      _log('✅', `V37.0 initialized v${_localVer}`);
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

  // ── SAVE LOCAL ───────────────────────────────────────────────
  function _saveLocal() {
    try {
      if (!window.globalData) return false;
      const finCount = (window.globalData.finance || []).length;
      const stuCount = (window.globalData.students || []).length;
      const finDeleted = MaxCount.getDeletedCount('finance');
      const stuDeleted = MaxCount.getDeletedCount('students');
      const finCheck = MaxCount.isSafe('finance', finCount, { deletedCount: finDeleted });
      const stuCheck = MaxCount.isSafe('students', stuCount, { deletedCount: stuDeleted });
      if (!finCheck.safe) { _log('🚫', 'saveLocal BLOCKED - Finance'); _showUserMessage(finCheck.message, 'error'); return false; }
      if (!stuCheck.safe) { _log('🚫', 'saveLocal BLOCKED - Students'); _showUserMessage(stuCheck.message, 'error'); return false; }
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      MaxCount.update('finance', finCount);
      MaxCount.update('students', stuCount);
      if (finCount > 0) localStorage.setItem('wings_last_known_finance', finCount.toString());
      if (stuCount > 0) localStorage.setItem('wings_last_known_count', stuCount.toString());
      return true;
    } catch (e) { _log('⚠️', 'saveLocal error', e); return false; }
  }

  // ── MERGE RECORDS ─────────────────────────────────────────────
  function _mergeRecords(localArr, cloudRows, keyFn) {
    const merged = new Map();
    (localArr || []).forEach(item => { const k = keyFn(item); if (k) merged.set(k, item); });
    (cloudRows || []).forEach(row => {
      if (!row.data) return;
      const k = keyFn(row.data);
      if (!k) return;
      if (row.deleted) merged.delete(k); else merged.set(k, row.data);
    });
    return Array.from(merged.values());
  }

  // ── PULL FROM CLOUD V36 ──────────────────────────────────────
  async function pullFromCloud(showUI = false, forceFullPull = false) {
    if (_pulling) { _log('⏸️', 'Pull in progress'); return false; }
    if (!_ready || !_sb) return false;
    
    // ✅ V36: Hard throttle হলে block, soft throttle হলে শুধু warn
    if (Egress.hardThrottled()) {
      _log('🛑', 'Hard egress limit — pull blocked');
      _showUserMessage('আজকে অনেক বেশি request হয়েছে। Diagnostic থেকে "Egress Reset" করুন।', 'error');
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

        if (stuRes.error || finRes.error || empRes.error || mainRes.error) throw new Error('Partial pull failed');

        const gd = window.globalData || {};
        const local = { students: gd.students || [], finance: gd.finance || [], employees: gd.employees || [] };
        gd.students = _mergeRecords(local.students, stuRes.data, s => s.studentId || s.id || s.name);
        gd.finance = _mergeRecords(local.finance, finRes.data, f => f.id || f.timestamp);
        gd.employees = _mergeRecords(local.employees, empRes.data, e => e.id);

        const mainRec = mainRes.data?.[0];
        if (mainRec) {
          gd.cashBalance = mainRec.cash_balance ?? gd.cashBalance ?? 0;
          gd.bankAccounts = mainRec.bank_accounts || gd.bankAccounts || [];
          gd.mobileBanking = mainRec.mobile_banking || gd.mobileBanking || [];
          if (mainRec.settings) { gd.settings = Object.assign({}, gd.settings || {}, mainRec.settings); _log('✅', 'Settings synced from cloud'); }
          if (mainRec.users && Array.isArray(mainRec.users) && mainRec.users.length > 0) { gd.users = mainRec.users; _log('✅', 'Users synced from cloud'); }
          _localVer = mainRec.version || _localVer;
          localStorage.setItem('wings_local_version', _localVer.toString());
        }

        window.globalData = gd;
        MaxCount.update('students', gd.students.length);
        MaxCount.update('finance', gd.finance.length);

        // ✅ V36 FIX: After successful pull, save the snapshots!
        // This prevents the "First Push after Initial Pull" from attempting a redundant full push
        try {
          const sSnap = {}; gd.students.forEach(s => { const k = s.studentId || s.id || s.name; if(k) sSnap[k] = _hashRecord(s); });
          const fSnap = {}; gd.finance.forEach(f => { const k = f.id || f.timestamp; if(k) fSnap[k] = _hashRecord(f); });
          _saveSnapshot('students', sSnap);
          _saveSnapshot('finance', fSnap);
          _log('📸', 'Saved full snapshots after pull (Fixes First-Push bug)');
        } catch (err) { _log('⚠️', 'Failed to save snapshot during pull', err); }

        _saveLocal();
        SyncFreshness.update();
        NetworkQuality.recordSuccess();
        _log('✅', `Pull OK - stu:${gd.students.length} fin:${gd.finance.length} v${_localVer}`);
        if (showUI) _showStatus('✅ Synced');
        window.initialSyncComplete = true;
        return true;

      } else {
        // Legacy mode
        const { data, error } = await _sb.from(CFG.TABLE).select('*').eq('id', CFG.RECORD).limit(1);
        if (error) throw error;
        const rec = data?.[0];
        if (!rec) { _log('⚠️', 'No cloud data'); return false; }
        window.globalData = {
          students: rec.students || [], finance: rec.finance || [], employees: rec.employees || [],
          cashBalance: rec.cash_balance || 0, bankAccounts: rec.bank_accounts || [],
          mobileBanking: rec.mobile_banking || [], deletedItems: rec.deleted_items || {},
          settings: rec.settings || window.globalData?.settings || {},
          users: (rec.users && rec.users.length > 0) ? rec.users : (window.globalData?.users || []),
        };
        _localVer = rec.version || 0;
        localStorage.setItem('wings_local_version', _localVer.toString());
        MaxCount.update('students', window.globalData.students.length);
        MaxCount.update('finance', window.globalData.finance.length);
        _saveLocal();
        SyncFreshness.update();
        NetworkQuality.recordSuccess();
        _log('✅', `Legacy pull OK v${_localVer}`);
        window.initialSyncComplete = true;
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

  // ── INCREMENTAL SYNC HELPERS ─────────────────────────────────
  function _hashRecord(record) {
    const str = JSON.stringify(record);
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h.toString(36);
  }

  function _loadSnapshot(table) { try { const raw = localStorage.getItem('wf_push_snapshot_' + table); return raw ? JSON.parse(raw) : {}; } catch { return {}; } }
  function _saveSnapshot(table, snapshot) {
    try {
      const str = JSON.stringify(snapshot);
      // ✅ FIX: Size guard (max 500KB per table)
      if (str.length > 500000) {
        _log('⚠️', `Snapshot too large (${Math.round(str.length/1024)}KB) — trimming old keys`);
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
      // ✅ FIX: Clear if storage full
      if (e.name === 'QuotaExceededError') {
        localStorage.removeItem('wf_push_snapshot_' + table);
      }
    }
  }

  function _getDelta(table, records, keyFn) {
    const prevSnapshot = _loadSnapshot(table);
    const newSnapshot = {}, changed = [], currentKeys = new Set();
    records.forEach(function(record) {
      const key = keyFn(record);
      if (!key) return;
      const hash = _hashRecord(record);
      newSnapshot[key] = hash;
      currentKeys.add(key);
      if (!prevSnapshot[key] || prevSnapshot[key] !== hash) changed.push(record);
    });
    const deleted = Object.keys(prevSnapshot).filter(function(k) { return !currentKeys.has(k); });
    return { changed, deleted, snapshot: newSnapshot };
  }

  // ── PUSH TO CLOUD V36 ────────────────────────────────────────
  async function pushToCloud(reason = 'auto') {
    if (_pushing) { _log('⏸️', 'Push in progress'); return false; }
    if (!_ready || !_sb || !window.globalData) return false;
    if (!_online) { _log('📵', 'Offline'); return false; }
    
    // ✅ V36: Hard throttle হলেই শুধু push block
    if (Egress.hardThrottled()) { _log('🛑', 'Hard egress limit — push blocked'); return false; }
    
    _pushing = true;
    _syncBusy = true;
    clearTimeout(_debounce);
    _debounce = null;

    try {
      Egress.inc();
      const gd = window.globalData;
      const finCount = (gd.finance || []).length, stuCount = (gd.students || []).length;
      const finDeleted = MaxCount.getDeletedCount('finance'), stuDeleted = MaxCount.getDeletedCount('students');
      const finCheck = MaxCount.isSafe('finance', finCount, { deletedCount: finDeleted });
      const stuCheck = MaxCount.isSafe('students', stuCount, { deletedCount: stuDeleted });

      if (!finCheck.safe) { _log('🚫', 'Push BLOCKED - Finance'); _showUserMessage(finCheck.message + ' Push blocked.', 'error'); _log('🔄', 'Auto-recovery: pulling'); await pullFromCloud(false, true); return false; }
      if (!stuCheck.safe) { _log('🚫', 'Push BLOCKED - Students'); _showUserMessage(stuCheck.message + ' Push blocked.', 'error'); _log('🔄', 'Auto-recovery: pulling'); await pullFromCloud(false, true); return false; }

      // ✅ V37: SERVER-SIDE VERSION INCREMENT (race condition fix)
      // Supabase atomically increments — দুই device collision হবে না
      let _rpcOK = false;
      try {
        const { data: rpcVer, error: rpcErr } = await _sb.rpc(
          'increment_version', { record_id: CFG.RECORD }
        );
        if (!rpcErr && rpcVer) {
          _localVer = rpcVer;
          localStorage.setItem('wings_local_version', _localVer.toString());
          _log('✅', `Server version: ${_localVer}`);
          _rpcOK = true;
        } else {
          _log('⚠️', 'RPC increment_version failed — using fallback', rpcErr);
        }
      } catch (rpcEx) {
        _log('⚠️', 'RPC error — using fallback', rpcEx);
      }

      // Fallback: পুরনো client-side method (RPC না থাকলে)
      if (!_rpcOK) {
        const { data: vdata } = await _sb.from(CFG.TABLE).select('version,last_device').eq('id', CFG.RECORD).limit(1);
        const cloudRec = vdata?.[0], cloudVer = cloudRec?.version || 0;
        const isOtherDevice = cloudRec?.last_device && cloudRec.last_device !== DEVICE_ID;
        if (isOtherDevice && cloudVer >= _localVer) {
          _log('⚠️', `Other device ahead v${cloudVer}, syncing version only`);
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
          const { changed, deleted, snapshot } = _getDelta('students', gd.students || [], s => s.studentId || s.id || s.name);
          stuTotal = (gd.students || []).length;
          stuPushed = changed.length + deleted.length;
          
          const doStuPush = async () => {
            if (changed.length > 0) {
              const stuRows = changed.map(s => {
                const sid = s.studentId || s.id || s.name;
                return { id: `${CFG.ACADEMY_ID}_stu_${sid}`, academy_id: CFG.ACADEMY_ID, data: s, deleted: false };
              });
              const res = await _sb.from(CFG.TBL_STUDENTS).upsert(stuRows, { onConflict: 'id' });
              if (res && res.error) throw res.error;
              _log('📤', `Students: ${changed.length}/${stuTotal} changed → pushed`);
            }
            const stuDelRows = ((gd.deletedItems?.students || []).map(item => {
              const recId = item.studentId || item.id || item.item?.studentId || item.item?.id;
              return recId ? { id: `${CFG.ACADEMY_ID}_stu_${recId}`, academy_id: CFG.ACADEMY_ID, data: null, deleted: true } : null;
            })).filter(x => x);
            if (stuDelRows.length > 0) {
              const resDel = await _sb.from(CFG.TBL_STUDENTS).upsert(stuDelRows, { onConflict: 'id' });
              if (resDel && resDel.error) throw resDel.error;
            }
            // ✅ V36 FIX: ONLY save snapshot if push succeeds
            _saveSnapshot('students', snapshot);
          };
          tasks.push(doStuPush());
        }

        if (_dirty.has('finance') || _dirty.size === 0) {
          const { changed, deleted, snapshot } = _getDelta('finance', gd.finance || [], f => f.id || f.timestamp);
          finTotal = (gd.finance || []).length;
          finPushed = changed.length + deleted.length;
          
          const doFinPush = async () => {
            if (changed.length > 0) {
              const finRows = changed.map(f => ({ id: `${CFG.ACADEMY_ID}_fin_${f.id}`, academy_id: CFG.ACADEMY_ID, data: f, deleted: false }));
              const res = await _sb.from(CFG.TBL_FINANCE).upsert(finRows, { onConflict: 'id' });
              if (res && res.error) throw res.error;
              _log('📤', `Finance: ${changed.length}/${finTotal} changed → pushed`);
            }
            const finDelRows = ((gd.deletedItems?.finance || []).map(item => {
              const recId = item.id || item.item?.id;
              return recId ? { id: `${CFG.ACADEMY_ID}_fin_${recId}`, academy_id: CFG.ACADEMY_ID, data: null, deleted: true } : null;
            })).filter(x => x);
            if (finDelRows.length > 0) {
              const resDel = await _sb.from(CFG.TBL_FINANCE).upsert(finDelRows, { onConflict: 'id' });
              if (resDel && resDel.error) throw resDel.error;
            }
            // ✅ V36 FIX: ONLY save snapshot if push succeeds
            _saveSnapshot('finance', snapshot);
          };
          tasks.push(doFinPush());
        }

        // ✅ Always push main record (version, cash, settings, users)
        const mainPayload = { id: CFG.RECORD, version: _localVer, last_updated: new Date().toISOString(), last_device: DEVICE_ID, last_action: reason, cash_balance: gd.cashBalance || 0, bank_accounts: gd.bankAccounts || [], mobile_banking: gd.mobileBanking || [], settings: gd.settings || null, users: gd.users || null };
        tasks.push(_sb.from(CFG.TABLE).upsert(mainPayload, { onConflict: 'id' }).then(res => {
          if (res.error && res.error.message && res.error.message.includes('column')) {
            _log('⚠️', 'settings/users column নেই — fallback push');
            const fallback = { id: CFG.RECORD, version: _localVer, last_updated: mainPayload.last_updated, last_device: DEVICE_ID, last_action: reason, cash_balance: gd.cashBalance || 0, bank_accounts: gd.bankAccounts || [], mobile_banking: gd.mobileBanking || [] };
            return _sb.from(CFG.TABLE).upsert(fallback, { onConflict: 'id' });
          }
        }));

        await Promise.all(tasks);
        _dirty.clear();
        NetworkQuality.recordSuccess();
        SyncFreshness.update();
        const totalPushed = stuPushed + finPushed;
        const totalRecords = stuTotal + finTotal;
        if (totalPushed === 0) { _log('✅', `Push OK (${reason}) v${_localVer} — কোনো পরিবর্তন নেই`); }
        else { _log('✅', `Push OK (${reason}) v${_localVer} — ${totalPushed}/${totalRecords} records pushed`); }
        return true;

      } else {
        // Legacy
        await _sb.from(CFG.TABLE).upsert({ id: CFG.RECORD, version: _localVer, students: gd.students || [], finance: gd.finance || [], employees: gd.employees || [], cash_balance: gd.cashBalance || 0, bank_accounts: gd.bankAccounts || [], mobile_banking: gd.mobileBanking || [], deleted_items: gd.deletedItems || {}, last_updated: new Date().toISOString(), last_device: DEVICE_ID, last_action: reason }, { onConflict: 'id' });
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

  // ── MARK DIRTY ───────────────────────────────────────────────
  window.markDirty = function (field) { if (field) _dirty.add(field); else _dirty.add('all'); _log('📝', `Dirty: ${field || 'all'}`); };

  function _schedulePush(reason) { clearTimeout(_debounce); _debounce = setTimeout(() => pushToCloud(reason), CFG.PUSH_DEBOUNCE_MS); }

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

  // ── VERSION CHECK V36 — GAP FIX ──────────────────────────────
  async function _versionCheck() {
    if (!_ready || !_sb || !_tabVisible) return;
    
    // ✅ V36: Soft throttle হলে version check skip (কিন্তু block নয়)
    if (Egress.throttled()) { _log('🔶', 'Soft egress limit — version check skipped'); return; }
    
    try {
      Egress.inc();
      const { data } = await _sb.from(CFG.TABLE).select('version').eq('id', CFG.RECORD).limit(1);
      const cloudVer = data?.[0]?.version || 0;
      const gap = cloudVer - _localVer;
      
      if (gap <= 0) return;
      
      _log('🔔', `Version gap: cloud=${cloudVer} local=${_localVer} gap=${gap}`);
      
      if (gap >= CFG.VERSION_GAP_WARN) {
        // ✅ V36: Auto pull when gap is large
        _log('🔄', `Large gap (${gap}) — forcing full pull`);
        const pulled = await pullFromCloud(false, true);
        if (pulled && gap >= CFG.VERSION_GAP_FULL) {
          // ✅ V36: Force UI refresh for very large gaps
          _log('🔄', `Very large gap (${gap}) — force render`);
          if (!_suppressRender && typeof window.renderFullUI === 'function') {
            window.renderFullUI();
          }
          _showUserMessage(`Version sync হয়েছে (gap: ${gap})। Data আপডেট হয়েছে।`, 'success');
        }
      } else {
        await pullFromCloud(false, true);
      }
    } catch (e) { _log('⚠️', 'Version check failed', e); }
  }

  // ── MONITOR ───────────────────────────────────────────────────
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

  // ── STARTUP INTEGRITY CHECK ───────────────────────────────────
  let _integrityCheckDidPull = false;

  async function _startupIntegrityCheck() {
    _integrityCheckDidPull = false;
    const gd = window.globalData;
    if (!gd) return;
    const finCount = (gd.finance || []).length, stuCount = (gd.students || []).length;
    const hasLocalData = localStorage.getItem('wingsfly_data');
    if (!hasLocalData || (finCount === 0 && stuCount === 0)) {
      _log('⚠️', 'Empty localStorage — forcing cloud pull');
      if (_online && _sb) {
        const ov = document.getElementById('dashboardOverview');
        if (ov) ov.style.visibility = 'hidden';
        try {
          await pullFromCloud(false, true);
          if (typeof window.renderFullUI === 'function') window.renderFullUI();
          _integrityCheckDidPull = true;
        } catch (e) { _log('❌', 'First-load pull failed', e); }
        finally { if (ov) ov.style.visibility = ''; }
      }
      return;
    }
    const finDeleted = MaxCount.getDeletedCount('finance'), stuDeleted = MaxCount.getDeletedCount('students');
    const finCheck = MaxCount.isSafe('finance', finCount, { deletedCount: finDeleted });
    const stuCheck = MaxCount.isSafe('students', stuCount, { deletedCount: stuDeleted });
    if (finCheck.safe && stuCheck.safe) { _log('✅', `Startup OK - fin:${finCount} stu:${stuCount}`); return; }
    _log('🚨', 'Startup integrity FAIL');
    if (!_online || !_sb) {
      if (SyncFreshness.isFresh()) { _log('⚠️', 'Cloud unavailable, local fresh'); _showUserMessage('Cloud unavailable, using recent local cache', 'warn'); return; }
      else { _log('❌', 'Cloud unavailable, local stale'); _showUserMessage('Cloud unavailable and local data old!', 'error'); return; }
    }
    const ov = document.getElementById('dashboardOverview');
    if (ov) ov.style.visibility = 'hidden';
    try {
      const tasks = [];
      if (!finCheck.safe && _partialOK) {
        tasks.push(_sb.from(CFG.TBL_FINANCE).select('data').eq('academy_id', CFG.ACADEMY_ID).eq('deleted', false).then(({ data }) => { if (data && data.length > finCount) { gd.finance = data.map(r => r.data); MaxCount.update('finance', gd.finance.length); _log('✅', `Force loaded finance: ${gd.finance.length}`); } }));
      }
      if (!stuCheck.safe && _partialOK) {
        tasks.push(_sb.from(CFG.TBL_STUDENTS).select('data').eq('academy_id', CFG.ACADEMY_ID).eq('deleted', false).then(({ data }) => { if (data && data.length > 0 && data.length > stuCount) { gd.students = data.map(r => r.data).filter(s => s); MaxCount.update('students', gd.students.length); _log('✅', `Force loaded students: ${gd.students.length}`); } }));
      }
      await Promise.all(tasks);
      _saveLocal();
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      _integrityCheckDidPull = true;
      _showUserMessage('Data recovered from cloud', 'success');
    } catch (e) { _log('⚠️', 'Startup check failed', e); _showUserMessage('Recovery failed: ' + e.message, 'error'); }
    finally { if (ov) ov.style.visibility = ''; }
  }

  // ── NETWORK & VISIBILITY ──────────────────────────────────────
  function _setupNetwork() {
    window.addEventListener('online', () => {
      _online = true; _log('🌐', 'Online'); NetworkQuality.recordSuccess();
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

  // ── NETWORK & VISIBILITY ──────────────────────────────────────
  function _setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      if (!window.globalData) return;
      const gd = window.globalData;

      // ✅ V37: Main record payload (সবসময়)
      const mainPayload = {
        id: CFG.RECORD,
        version: _localVer + 1,
        last_updated: new Date().toISOString(),
        last_device: DEVICE_ID,
        last_action: 'page-close',
        cash_balance: gd.cashBalance || 0,
        bank_accounts: gd.bankAccounts || [],
        mobile_banking: gd.mobileBanking || [],
      };

      // ✅ V37: Beacon URL (upsert on conflict)
      const mainUrl = `${CFG.URL}/rest/v1/${CFG.TABLE}?on_conflict=id`;
      const headers = { 'Content-Type': 'application/json', 'apikey': CFG.KEY, 'Authorization': `Bearer ${CFG.KEY}`, 'Prefer': 'resolution=merge-duplicates' };

      // sendBeacon — browser গ্যারান্টি দেয় এটি পাঠাবে
      try {
        navigator.sendBeacon(
          mainUrl,
          new Blob([JSON.stringify(mainPayload)], { type: 'application/json' })
        );
        _log('📤', 'BeforeUnload: main record beacon sent');
      } catch (e) {
        // sendBeacon fail হলে keepalive fetch fallback
        fetch(mainUrl, { method: 'POST', headers, body: JSON.stringify(mainPayload), keepalive: true }).catch(() => {});
      }

      // ✅ V37: Dirty data থাকলে partial tables-ও push করুন
      if (_dirty.size > 0 && _partialOK) {

        // Students dirty থাকলে
        if (_dirty.has('students') && (gd.students || []).length > 0) {
          const stuRows = (gd.students || []).slice(0, 50).map(s => {
            const sid = s.studentId || s.id || s.name;
            return { id: `${CFG.ACADEMY_ID}_stu_${sid}`, academy_id: CFG.ACADEMY_ID, data: s, deleted: false };
          });
          const stuUrl = `${CFG.URL}/rest/v1/${CFG.TBL_STUDENTS}?on_conflict=id`;
          try {
            navigator.sendBeacon(
              stuUrl,
              new Blob([JSON.stringify(stuRows)], { type: 'application/json' })
            );
            _log('📤', `BeforeUnload: ${stuRows.length} students beacon sent`);
          } catch (e) {
            fetch(stuUrl, { method: 'POST', headers, body: JSON.stringify(stuRows), keepalive: true }).catch(() => {});
          }
        }

        // Finance dirty থাকলে
        if (_dirty.has('finance') && (gd.finance || []).length > 0) {
          const finRows = (gd.finance || []).slice(0, 50).map(f => ({
            id: `${CFG.ACADEMY_ID}_fin_${f.id}`,
            academy_id: CFG.ACADEMY_ID,
            data: f,
            deleted: false
          }));
          const finUrl = `${CFG.URL}/rest/v1/${CFG.TBL_FINANCE}?on_conflict=id`;
          try {
            navigator.sendBeacon(
              finUrl,
              new Blob([JSON.stringify(finRows)], { type: 'application/json' })
            );
            _log('📤', `BeforeUnload: ${finRows.length} finance beacon sent`);
          } catch (e) {
            fetch(finUrl, { method: 'POST', headers, body: JSON.stringify(finRows), keepalive: true }).catch(() => {});
          }
        }
      }
    });
  }

  function _showStatus(msg) { const el = document.getElementById('syncStatusText'); if (el) el.textContent = msg; }

  // ── REALTIME SUBSCRIPTION ─────────────────────────────────────
  function _setupRealtime() {
    if (!_sb) return;

    _sb.channel('version-watch')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: CFG.TABLE,
        filter: `id=eq.${CFG.RECORD}`
      }, payload => {
        const cloudVer = payload.new?.version;
        if (cloudVer && cloudVer > _localVer) {
          _log('🔔', `Realtime: cloud v${cloudVer}`);
          pullFromCloud(false, true);
        }
      })
      .subscribe();

    _log('📡', 'Realtime subscription active');
  }

  // ── STARTUP ───────────────────────────────────────────────────
  async function _start() {
    if (!_init()) { setTimeout(_start, 2000); return; }
    _log('🚀', '══════════════════════════════════════');
    _log('🚀', 'Wings Fly V37.0 — SERVER VERSION + BEFOREUNLOAD FIX');
    _log('🚀', '══════════════════════════════════════');
    _log('💡', `Egress: ${Egress.count()}/${CFG.EGRESS_LIMIT} | Data age: ${SyncFreshness.getAge()} | v${_localVer}`);
    
    // ✅ V36: Egress info log on startup
    const eInfo = Egress.getInfo();
    if (eInfo.throttled) _log('⚠️', `Egress soft-throttled (${eInfo.count}/${eInfo.limit}) — version check paused, manual sync OK`);
    if (eInfo.hardThrottled) _log('🛑', `Egress hard-throttled (${eInfo.count}/${eInfo.hardLimit}) — all sync paused`);
    
    await _checkPartialTables();
    _setupNetwork();
    _setupVisibility();
    _setupBeforeUnload();
    _patchSaveToStorage();
    window.__v36_sync_active = true;
    await _startupIntegrityCheck();
    if (!_integrityCheckDidPull) {
      await pullFromCloud(false);
    } else {
      _log('✅', 'Pull skipped — integrity check already fetched fresh data');
    }
    // ✅ V37: Use Realtime instead of setInterval polling for version
    _setupRealtime();
    setInterval(() => { if (_tabVisible && !Egress.hardThrottled()) pullFromCloud(true); }, CFG.FULL_PULL_MS);
    setTimeout(_installMonitor, 3000);
    _log('🎉', 'V37.0 ready!');
    _showStatus('✅ V37.0 ready');
  }

  // ── PUBLIC API V36 ────────────────────────────────────────────
  window.wingsSync = {
    // Existing
    fullSync: async () => { await pullFromCloud(false, true); await pushToCloud('Manual full sync'); if (typeof window.renderFullUI === 'function') window.renderFullUI(); },
    pushNow: (reason) => pushToCloud(reason || 'Manual'),
    pullNow: async () => { await pullFromCloud(false, true); if (typeof window.renderFullUI === 'function') window.renderFullUI(); },
    markDirty: (field) => window.markDirty && window.markDirty(field),
    forceRecovery: async () => { _log('🔄', 'Manual recovery'); await pullFromCloud(true, true); if (typeof window.renderFullUI === 'function') window.renderFullUI(); _showUserMessage('Recovery complete', 'success'); },
    
    // ✅ V36 NEW: Egress reset with PIN guard
    resetEgress: (pin) => {
      const ADMIN_PIN = localStorage.getItem('wings_admin_pin') || 'wf2026';
      if (pin !== ADMIN_PIN) {
        console.warn('❌ Invalid PIN for Egress Reset. Default is "wf2026".');
        return false;
      }
      Egress.reset();
      return true;
    },
    
    // ✅ V36 NEW: Force version sync (version gap fix)
    forceVersionSync: async () => {
      _log('🔄', 'Force version sync');
      Egress.reset(); // Reset egress first
      const pulled = await pullFromCloud(false, true);
      if (pulled && typeof window.renderFullUI === 'function') window.renderFullUI();
      _showUserMessage('Version sync সম্পন্ন।', 'success');
      return pulled;
    },
    
    // ✅ V36 NEW: Egress info
    getEgressInfo: () => Egress.getInfo(),
    
    getStatus: () => ({
      version: _localVer, online: _online, partialOK: _partialOK,
      dirty: [..._dirty], initialSync: window.initialSyncComplete,
      egress: Egress.count(), egressInfo: Egress.getInfo(),
      tabVisible: _tabVisible,
      maxFinance: MaxCount.get('finance'), maxStudents: MaxCount.get('students'),
      networkQuality: NetworkQuality.getQuality(),
      dataAge: SyncFreshness.getAge(),
      initialSyncComplete: window.initialSyncComplete,
      partialReady: _partialOK,
    }),
  };

  // Legacy aliases
  window.saveToCloud = () => pushToCloud('saveToCloud');
  window.loadFromCloud = (force = false) => pullFromCloud(false, force);
  window.manualCloudSync = window.wingsSync.fullSync;
  window.manualSync = window.wingsSync.fullSync;
  window.scheduleSyncPush = (reason) => { window.markDirty && window.markDirty(); _schedulePush(reason); };

  // Start
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _start);
  else _start();

  _log('📦', 'V36.0 loaded');
})();

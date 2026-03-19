/**
 * ════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * SMART SYNC SYSTEM — V35.1 "MAX COUNT WINS — IMPROVED"
 * ════════════════════════════════════════════════════════════
 *
 * ✅ V35.1 Improvements over V35:
 *
 *   1. PERCENTAGE-BASED TOLERANCE
 *      → Fixed 3 না, এখন 10% বা minimum 5 (যেটা বড়)
 *      → 50 records = tolerance 5, 100 records = tolerance 10
 *
 *   2. DELETED ITEMS TRACKING
 *      → Push guard এ deletedItems count যোগ
 *      → Net count = local + deleted
 *      → Bulk delete safe
 *
 *   3. BETTER ERROR REPORTING
 *      → Clear messages কেন block হলো
 *      → Auto-recovery suggestion
 *
 *   4. OFFLINE FALLBACK IMPROVED
 *      → Last sync < 24h = local OK
 *      → Warning + continue
 *
 *   5. NETWORK QUALITY DETECTION
 *      → Poor network = slower sync
 *      → Good network = normal speed
 *
 * Author: Wings Fly IT Team
 * Version: 35.1
 * Date: March 2026
 * ════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // CONFIGURATION
  const CFG = {
    URL:    window.SUPABASE_CONFIG?.URL  || '',
    KEY:    window.SUPABASE_CONFIG?.KEY  || '',
    TABLE:  window.SUPABASE_CONFIG?.TABLE || 'academy_data',
    RECORD: window.SUPABASE_CONFIG?.MAIN_RECORD || 'wingsfly_main',
    TBL_STUDENTS:  'wf_students',
    TBL_FINANCE:   'wf_finance',
    TBL_EMPLOYEES: 'wf_employees',
    ACADEMY_ID:    'wingsfly_main',
    VERSION_CHECK_MS: 15 * 60 * 1000,
    FULL_PULL_MS:     60 * 60 * 1000,
    PUSH_DEBOUNCE_MS: 2000,
    EGRESS_WARN:  200,
    EGRESS_LIMIT: 600,
    SYNC_FRESHNESS_MS: 24 * 60 * 60 * 1000,
  };

  // STATE
  let _sb = null, _ready = false, _pushing = false, _pulling = false;
  let _online = navigator.onLine, _tabVisible = !document.hidden;
  let _localVer = 0, _debounce = null, _partialOK = false;
  let _networkQuality = 'good';
  const _dirty = new Set();
  const DEVICE_ID = _getOrCreateDeviceId();
  window.initialSyncComplete = false;

  // EGRESS COUNTER
  const Egress = {
    _key: () => 'wf_egress_' + new Date().toISOString().slice(0, 10),
    count: function () { return parseInt(localStorage.getItem(this._key()) || '0'); },
    inc: function () {
      const k = this._key(), v = (parseInt(localStorage.getItem(k) || '0')) + 1;
      localStorage.setItem(k, v);
      if (v === CFG.EGRESS_WARN) _log('⚠️', `Egress ${v} requests today`);
      return v;
    },
    throttled: function () { return this.count() > CFG.EGRESS_LIMIT; },
  };

  // MAX COUNT STORE - V35.1 IMPROVED
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
    isSafe: function (key, localCount, options = {}) {
      const max = this.get(key);
      if (max === 0) return { safe: true, reason: 'first-time' };
      
      const deletedCount = options.deletedCount || 0;
      const netCount = localCount + deletedCount;
      const baseTolerance = options.tolerance || 5;
      const percentTolerance = Math.max(baseTolerance, Math.floor(max * 0.10));
      const threshold = max - percentTolerance;
      const isSafe = netCount >= threshold;
      
      const result = { safe: isSafe, localCount, deletedCount, netCount, max, threshold, tolerance: percentTolerance };
      
      if (!isSafe) {
        _log('🚫', `MaxCount UNSAFE: ${key} net=${netCount} < ${threshold}`);
        result.message = `${key} count কম! Local: ${localCount}, Min: ${threshold}. Cloud থেকে pull করুন।`;
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
      return (data.deletedItems[deletedKey] || []).length;
    },
  };

  // SYNC FRESHNESS TRACKER
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

  // NETWORK QUALITY
  const NetworkQuality = {
    _failCount: 0, _successCount: 0,
    recordSuccess: function () { this._successCount++; this._failCount = 0; if (this._successCount >= 2) _networkQuality = 'good'; },
    recordFailure: function () { this._failCount++; this._successCount = 0; if (this._failCount >= 2) _networkQuality = 'poor'; },
    getQuality: () => !_online ? 'offline' : _networkQuality,
    getCheckInterval: function () {
      const q = this.getQuality();
      return q === 'offline' ? CFG.VERSION_CHECK_MS * 2 : q === 'poor' ? CFG.VERSION_CHECK_MS * 1.5 : CFG.VERSION_CHECK_MS;
    },
  };

  // LOGGING
  function _log(emoji, msg, data) {
    console.log(`[V35.1|${new Date().toLocaleTimeString()}] ${emoji} ${msg}`);
    if (data) console.log(data);
  }

  function _getOrCreateDeviceId() {
    let id = localStorage.getItem('wings_device_id');
    if (!id) { id = 'DEV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6); localStorage.setItem('wings_device_id', id); }
    return id;
  }

  // USER NOTIFICATION
  function _showUserMessage(msg, type = 'info') {
    const toast = document.createElement('div');
    const colors = { error: { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#fee2e2' },
      warn: { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fef3c7' },
      info: { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#dbeafe' },
      success: { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#d1fae5' } };
    const c = colors[type] || colors.info;
    toast.style.cssText = `position:fixed;top:70px;right:20px;z-index:10000;background:${c.bg};border:2px solid ${c.border};color:${c.text};padding:12px 18px;border-radius:8px;font-size:0.85rem;box-shadow:0 4px 12px rgba(0,0,0,0.3);max-width:400px;`;
    toast.innerHTML = `<strong>${type.toUpperCase()}:</strong> ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 5000);
  }

  // INIT
  function _init() {
    if (_ready) return true;
    if (typeof window.supabase === 'undefined') return false;
    try {
      _sb = window.supabase.createClient(CFG.URL, CFG.KEY);
      _localVer = parseInt(localStorage.getItem('wings_local_version') || '0');
      _ready = true;
      _log('✅', `V35.1 initialized v${_localVer}`);
      return true;
    } catch (e) { _log('❌', 'Init failed', e); return false; }
  }

  // CHECK PARTIAL TABLES
  async function _checkPartialTables() {
    try {
      const { error } = await _sb.from(CFG.TBL_STUDENTS).select('id').limit(1);
      _partialOK = !error;
      _log(_partialOK ? '✅' : '⚠️', _partialOK ? 'Partial tables ready' : 'Legacy mode');
    } catch (e) { _partialOK = false; }
  }

  // SAVE LOCAL - V35.1 IMPROVED
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

  // MERGE RECORDS
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

  // PULL FROM CLOUD - V35.1
  async function pullFromCloud(showUI = false, forceFullPull = false) {
    if (_pulling) { _log('⏸️', 'Pull in progress'); return false; }
    if (!_ready || !_sb) return false;
    if (Egress.throttled()) { _log('🛑', 'Egress limit'); return false; }
    _pulling = true;
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
        gd.students = _mergeRecords(local.students, stuRes.data, s => s.id);
        gd.finance = _mergeRecords(local.finance, finRes.data, f => f.id);
        gd.employees = _mergeRecords(local.employees, empRes.data, e => e.id);

        const mainRec = mainRes.data?.[0];
        if (mainRec) {
          gd.cashBalance = mainRec.cash_balance ?? gd.cashBalance ?? 0;
          gd.bankAccounts = mainRec.bank_accounts || gd.bankAccounts || [];
          gd.mobileBanking = mainRec.mobile_banking || gd.mobileBanking || [];
          _localVer = mainRec.version || _localVer;
          localStorage.setItem('wings_local_version', _localVer.toString());
        }

        window.globalData = gd;
        MaxCount.update('students', gd.students.length);
        MaxCount.update('finance', gd.finance.length);
        _saveLocal();
        if (typeof window.renderFullUI === 'function') window.renderFullUI();
        SyncFreshness.update();
        NetworkQuality.recordSuccess();
        _log('✅', `Pull OK - stu:${gd.students.length} fin:${gd.finance.length} v${_localVer}`);
        if (showUI) _showStatus('✅ Synced');
        window.initialSyncComplete = true;
        return true;
      } else {
        // Legacy
        const { data, error } = await _sb.from(CFG.TABLE).select('*').eq('id', CFG.RECORD).limit(1);
        if (error) throw error;
        const rec = data?.[0];
        if (!rec) { _log('⚠️', 'No cloud data'); return false; }

        window.globalData = {
          students: rec.students || [], finance: rec.finance || [], employees: rec.employees || [],
          cashBalance: rec.cash_balance || 0, bankAccounts: rec.bank_accounts || [],
          mobileBanking: rec.mobile_banking || [], deletedItems: rec.deleted_items || {},
        };
        _localVer = rec.version || 0;
        localStorage.setItem('wings_local_version', _localVer.toString());
        MaxCount.update('students', window.globalData.students.length);
        MaxCount.update('finance', window.globalData.finance.length);
        _saveLocal();
        if (typeof window.renderFullUI === 'function') window.renderFullUI();
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
    } finally { _pulling = false; }
  }

  // PUSH TO CLOUD - V35.1
  async function pushToCloud(reason = 'auto') {
    if (_pushing) { _log('⏸️', 'Push in progress'); return false; }
    if (!_ready || !_sb || !window.globalData) return false;
    if (!_online) { _log('📵', 'Offline'); return false; }
    if (Egress.throttled()) { _log('🛑', 'Egress limit'); return false; }
    _pushing = true;
    clearTimeout(_debounce);
    _debounce = null;

    try {
      Egress.inc();
      const gd = window.globalData;
      const finCount = (gd.finance || []).length, stuCount = (gd.students || []).length;
      const finDeleted = MaxCount.getDeletedCount('finance'), stuDeleted = MaxCount.getDeletedCount('students');
      const finCheck = MaxCount.isSafe('finance', finCount, { deletedCount: finDeleted });
      const stuCheck = MaxCount.isSafe('students', stuCount, { deletedCount: stuDeleted });

      if (!finCheck.safe) {
        _log('🚫', 'Push BLOCKED - Finance');
        _showUserMessage(finCheck.message + ' Push blocked.', 'error');
        _log('🔄', 'Auto-recovery: pulling');
        await pullFromCloud(false, true);
        return false;
      }

      if (!stuCheck.safe) {
        _log('🚫', 'Push BLOCKED - Students');
        _showUserMessage(stuCheck.message + ' Push blocked.', 'error');
        _log('🔄', 'Auto-recovery: pulling');
        await pullFromCloud(false, true);
        return false;
      }

      // Multi-tab check
      const { data: vdata } = await _sb.from(CFG.TABLE).select('version,last_device').eq('id', CFG.RECORD).limit(1);
      const cloudRec = vdata?.[0], cloudVer = cloudRec?.version || 0;
      const isOtherDevice = cloudRec?.last_device && cloudRec.last_device !== DEVICE_ID;
      if (isOtherDevice && cloudVer >= _localVer) {
        _log('⚠️', `Other device ahead v${cloudVer}, pulling first`);
        await pullFromCloud(false, true);
        _pushing = false;
        return pushToCloud('retry-after-pull');
      }

      _localVer++;
      localStorage.setItem('wings_local_version', _localVer.toString());

      if (_partialOK) {
        const tasks = [];
        if (_dirty.has('students') || _dirty.size === 0) {
          const stuRows = (gd.students || []).map(s => ({ id: `${CFG.ACADEMY_ID}_stu_${s.id}`, academy_id: CFG.ACADEMY_ID, record_id: s.id, data: s, deleted: false }));
          const stuDelRows = ((gd.deletedItems?.students || []).map(item => {
            const recId = item.id || item.item?.id;
            return recId ? { id: `${CFG.ACADEMY_ID}_stu_${recId}`, academy_id: CFG.ACADEMY_ID, record_id: recId, data: null, deleted: true } : null;
          })).filter(x => x);
          const allStu = [...stuRows, ...stuDelRows];
          if (allStu.length > 0) tasks.push(_sb.from(CFG.TBL_STUDENTS).upsert(allStu, { onConflict: 'id' }));
        }

        if (_dirty.has('finance') || _dirty.size === 0) {
          const finRows = (gd.finance || []).map(f => ({ id: `${CFG.ACADEMY_ID}_fin_${f.id}`, academy_id: CFG.ACADEMY_ID, record_id: f.id, data: f, deleted: false }));
          const finDelRows = ((gd.deletedItems?.finance || []).map(item => {
            const recId = item.id || item.item?.id;
            return recId ? { id: `${CFG.ACADEMY_ID}_fin_${recId}`, academy_id: CFG.ACADEMY_ID, record_id: recId, data: null, deleted: true } : null;
          })).filter(x => x);
          const allFin = [...finRows, ...finDelRows];
          if (allFin.length > 0) tasks.push(_sb.from(CFG.TBL_FINANCE).upsert(allFin, { onConflict: 'id' }));
        }

        tasks.push(_sb.from(CFG.TABLE).upsert({ id: CFG.RECORD, version: _localVer, last_updated: new Date().toISOString(), last_device: DEVICE_ID, last_action: reason, cash_balance: gd.cashBalance || 0, bank_accounts: gd.bankAccounts || [], mobile_banking: gd.mobileBanking || [] }, { onConflict: 'id' }));
        await Promise.all(tasks);
        _dirty.clear();
        NetworkQuality.recordSuccess();
        SyncFreshness.update();
        _log('✅', `Push OK (${reason}) v${_localVer}`);
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
    } finally { _pushing = false; }
  }

  // MARK DIRTY
  window.markDirty = function (field) {
    if (field) _dirty.add(field); else _dirty.add('all');
    _log('📝', `Dirty: ${field || 'all'}`);
  };

  // SCHEDULE PUSH
  function _schedulePush(reason) {
    clearTimeout(_debounce);
    _debounce = setTimeout(() => pushToCloud(reason), CFG.PUSH_DEBOUNCE_MS);
  }

  // PATCH saveToStorage
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

  // VERSION CHECK
  async function _versionCheck() {
    if (!_ready || !_sb || !_tabVisible || Egress.throttled()) return;
    try {
      Egress.inc();
      const { data } = await _sb.from(CFG.TABLE).select('version').eq('id', CFG.RECORD).limit(1);
      const cloudVer = data?.[0]?.version || 0;
      if (cloudVer > _localVer) {
        _log('🔔', `Version mismatch: cloud=${cloudVer} local=${_localVer}`);
        await pullFromCloud(false, true);
      }
    } catch (e) { _log('⚠️', 'Version check failed', e); }
  }

  // MONITOR
  function _installMonitor() {
    let _lastFin = -1, _lastStu = -1, _lastCash = null;
    setInterval(() => {
      if (_pushing) return;
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
    }, 30000);
  }

  // STARTUP INTEGRITY CHECK - V35.1
  async function _startupIntegrityCheck() {
    const gd = window.globalData;
    if (!gd) return;
    const finCount = (gd.finance || []).length, stuCount = (gd.students || []).length;
    const finDeleted = MaxCount.getDeletedCount('finance'), stuDeleted = MaxCount.getDeletedCount('students');
    const finCheck = MaxCount.isSafe('finance', finCount, { deletedCount: finDeleted });
    const stuCheck = MaxCount.isSafe('students', stuCount, { deletedCount: stuDeleted });

    if (finCheck.safe && stuCheck.safe) { _log('✅', `Startup OK - fin:${finCount} stu:${stuCount}`); return; }
    _log('🚨', 'Startup integrity FAIL');

    if (!_online || !_sb) {
      if (SyncFreshness.isFresh()) {
        _log('⚠️', `Cloud unavailable, local fresh (${SyncFreshness.getAge()})`);
        _showUserMessage('Cloud unavailable, using recent local cache', 'warn');
        return;
      } else {
        _log('❌', 'Cloud unavailable, local stale');
        _showUserMessage('Cloud unavailable and local data old!', 'error');
        return;
      }
    }

    const ov = document.getElementById('dashboardOverview');
    if (ov) ov.style.visibility = 'hidden';

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
          if (data && data.length > stuCount) {
            gd.students = data.map(r => r.data);
            MaxCount.update('students', gd.students.length);
            _log('✅', `Force loaded students: ${gd.students.length}`);
          }
        }));
      }
      await Promise.all(tasks);
      _saveLocal();
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      _log('✅', 'Startup integrity restored');
      _showUserMessage('Data recovered from cloud', 'success');
    } catch (e) {
      _log('⚠️', 'Startup check failed', e);
      _showUserMessage('Recovery failed: ' + e.message, 'error');
    } finally {
      if (ov) ov.style.visibility = '';
    }
  }

  // NETWORK & VISIBILITY
  function _setupNetwork() {
    window.addEventListener('online', () => { _online = true; _log('🌐', 'Online'); NetworkQuality.recordSuccess(); pullFromCloud(false).then(() => _schedulePush('online')); });
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
      if (!_debounce && !_pushing) return;
      clearTimeout(_debounce);
      if (!window.globalData) return;
      try {
        const url = `${CFG.URL}/rest/v1/${CFG.TABLE}?on_conflict=id`;
        fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': CFG.KEY, 'Authorization': `Bearer ${CFG.KEY}`, 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify({ id: CFG.RECORD, version: _localVer + 1, last_updated: new Date().toISOString(), last_device: DEVICE_ID, last_action: 'page-close', cash_balance: window.globalData.cashBalance || 0 }),
          keepalive: true }).catch(() => {});
      } catch (e) {}
    });
  }

  function _showStatus(msg) {
    const el = document.getElementById('syncStatusText');
    if (el) el.textContent = msg;
  }

  // STARTUP
  async function _start() {
    if (!_init()) { setTimeout(_start, 2000); return; }
    _log('🚀', '══════════════════════════════════════');
    _log('🚀', 'Wings Fly V35.1 — MAX COUNT WINS (IMPROVED)');
    _log('🚀', '══════════════════════════════════════');
    _log('💡', `Tolerance: 10% adaptive | Egress: ${Egress.count()} | Data age: ${SyncFreshness.getAge()}`);
    await _checkPartialTables();
    _setupNetwork();
    _setupVisibility();
    _setupBeforeUnload();
    _patchSaveToStorage();
    window.__v35_sync_active = true;
    await _startupIntegrityCheck();
    await pullFromCloud(false);
    setInterval(_versionCheck, NetworkQuality.getCheckInterval());
    setInterval(() => { if (_tabVisible && !Egress.throttled()) pullFromCloud(true); }, CFG.FULL_PULL_MS);
    setTimeout(_installMonitor, 3000);
    _log('🎉', 'V35.1 ready!');
    _showStatus('🔄 V35.1 ready');
  }

  // PUBLIC API
  window.wingsSync = {
    fullSync: async () => { await pullFromCloud(false, true); await pushToCloud('Manual full sync'); },
    pushNow: (reason) => pushToCloud(reason || 'Manual'),
    pullNow: () => pullFromCloud(false, true),
    markDirty: (field) => window.markDirty && window.markDirty(field),
    getStatus: () => ({ version: _localVer, online: _online, partialOK: _partialOK, dirty: [..._dirty], initialSync: window.initialSyncComplete,
      egress: Egress.count(), tabVisible: _tabVisible, maxFinance: MaxCount.get('finance'), maxStudents: MaxCount.get('students'),
      networkQuality: NetworkQuality.getQuality(), dataAge: SyncFreshness.getAge(), egressToday: Egress.count(),
      initialSyncComplete: window.initialSyncComplete, partialReady: _partialOK }),
    forceRecovery: async () => { _log('🔄', 'Manual recovery'); await pullFromCloud(true, true); _showUserMessage('Recovery complete', 'success'); },
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

  _log('📦', 'V35.1 loaded — MAX COUNT WINS (IMPROVED)');
})();

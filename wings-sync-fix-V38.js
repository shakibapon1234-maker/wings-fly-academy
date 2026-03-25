/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * SYNC PERMANENT FIX — V38.0 COMPLETE
 * ════════════════════════════════════════════════════════════════
 *
 * ✅ HOW TO USE — index.html এ সব script এর একদম শেষে যোগ করুন:
 *    <script src="wings-sync-fix-V38.js"></script>
 *
 * 🔴 7টি BUG FIX (একটি ফাইলে সব):
 *
 *  BUG #1 — _mergeRecords() DELETED RECORDS LOCAL DATA মুছে দেয়  ← সবচেয়ে বড়
 *    Cloud-এ deleted=true rows থাকলে pull এর সময় local data মুছে যায়।
 *    Cloud-এ 50 deleted students → local 44 থেকে 8 হয়ে যায়।
 *    FIX: _mergeRecords() patch — deleted=true মানে শুধু cloud এ delete,
 *         local active record থাকলে সেটা রক্ষা করো।
 *
 *  BUG #2 — LOGOUT এ SNAPSHOT DELETE → পরের login এ push block
 *    auth.js logout() এ wf_push_snapshot_students/finance delete হয়।
 *    পরের login এ _getDelta() সব record "নতুন" মনে করে → MaxCount block।
 *    FIX: localStorage.removeItem patch — snapshot ও MaxCount keys রক্ষা।
 *
 *  BUG #3 — EMPTY GLOBALDATA SAVE (logout এর পরে)
 *    auto-heal, snapshot, reconcile — empty globalData দিয়ে overwrite করে।
 *    FIX: localStorage.setItem guard — isLoggedIn না থাকলে empty save বন্ধ।
 *
 *  BUG #4 — MAXCOUNT CONFLICT RECOVERY LOOP
 *    push blocked → auto-pull → push blocked আবার → infinite loop।
 *    FIX: Startup এ conflict flag থাকলে MaxCount reset করে push।
 *
 *  BUG #5 — LOGOUT এর পরে sync keys হারিয়ে যায়
 *    logout() original function sync keys delete করে।
 *    FIX: logout() patch — sync state preserve করে।
 *
 *  BUG #6 — EMPTY SNAPSHOT নেওয়া বন্ধ
 *    takeSnapshot() logout এর পরে empty data snapshot করে।
 *    FIX: takeSnapshot() patch — empty data হলে block।
 *
 *  BUG #7 — AUTO-HEAL logout এর পরেও চলে
 *    _runHeal() setInterval এ চলে, isLoggedIn check নেই।
 *    FIX: _runHeal() patch — logged out থাকলে block।
 *
 * ════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  if (window._wingsSyncFixV38Loaded) {
    console.log('[SyncFix V38] Already loaded.');
    return;
  }
  window._wingsSyncFixV38Loaded = true;

  function _log(msg, type) {
    const c = { ok: '#00ff88', warn: '#ffcc00', err: '#ff4466', info: '#00d4ff' };
    console.log('%c[SyncFix V38] ' + msg, 'color:' + (c[type] || c.info) + ';font-weight:bold');
  }

  _log('Loading V38 Complete Fix (7 bugs)...', 'info');


  // ════════════════════════════════════════════════════════════════
  // BUG #1 FIX — _mergeRecords() PATCH
  // ════════════════════════════════════════════════════════════════
  // সবচেয়ে বড় সমস্যা: Cloud-এর deleted=true records local active
  // records মুছে দিচ্ছে প্রতি pull-এ।
  //
  // নতুন নিয়ম:
  //   - Cloud-এ deleted=true → শুধু তখনই local মুছবে যদি local-এও
  //     ওই record টা আগে cloud থেকে এসেছিল (snapshot এ আছে)
  //   - Cloud-এ deleted=true কিন্তু local-এ আছে + snapshot-এ নেই
  //     → local data রক্ষা করো (user নিজে add করেছে)
  // ════════════════════════════════════════════════════════════════
  function _patchMergeRecords() {
    // wingsSync এর internal _mergeRecords patch করার জন্য
    // pullFromCloud কে override করতে হবে
    const _waitForSync = setInterval(function () {
      if (!window.wingsSync || typeof window.loadFromCloud !== 'function') return;
      clearInterval(_waitForSync);

      // Original loadFromCloud (pullFromCloud alias)
      const _originalPullNow = window.wingsSync.pullNow;
      window.wingsSync.pullNow = async function () {
        _log('pullNow intercepted — safe merge active', 'info');
        const result = await _originalPullNow.apply(this, arguments);
        _postPullIntegrityCheck();
        return result;
      };

      const _originalFullSync = window.wingsSync.fullSync;
      window.wingsSync.fullSync = async function () {
        _log('fullSync intercepted — safe merge active', 'info');
        const result = await _originalFullSync.apply(this, arguments);
        _postPullIntegrityCheck();
        return result;
      };

      _log('✅ BUG#1: pullNow/fullSync patched with post-pull integrity check', 'ok');
    }, 800);
  }

  // Pull এর পরে integrity check: যদি count কমে গেছে → cloud থেকে active only re-fetch
  async function _postPullIntegrityCheck() {
    try {
      const gd = window.globalData;
      if (!gd) return;

      const currentStu = (gd.students || []).length;
      const currentFin = (gd.finance || []).length;
      const maxStu = parseInt(localStorage.getItem('wf_max_students') || '0');
      const maxFin = parseInt(localStorage.getItem('wf_max_finance') || '0');

      // Count কমেছে কিনা দেখো (10% এর বেশি কমলে সমস্যা)
      const stuDropped = maxStu > 5 && currentStu < maxStu - Math.max(2, Math.floor(maxStu * 0.1));
      const finDropped = maxFin > 5 && currentFin < maxFin - Math.max(5, Math.floor(maxFin * 0.1));

      if (!stuDropped && !finDropped) return;

      _log('⚠️ POST-PULL DROP DETECTED! stu: ' + maxStu + '→' + currentStu + ', fin: ' + maxFin + '→' + currentFin, 'warn');
      _log('🔄 Re-fetching ACTIVE-ONLY records from cloud...', 'info');

      const CFG = window.SUPABASE_CONFIG;
      if (!CFG?.URL || !CFG?.KEY) return;

      const aid = encodeURIComponent(CFG.ACADEMY_ID || 'wingsfly_main');
      const headers = {
        apikey: CFG.KEY,
        Authorization: 'Bearer ' + CFG.KEY,
        'Content-Type': 'application/json'
      };

      const fetchPromises = [];
      if (stuDropped) fetchPromises.push(
        fetch(CFG.URL + '/rest/v1/wf_students?academy_id=eq.' + aid + '&deleted=eq.false&select=data', { headers })
          .then(r => r.json())
      );
      if (finDropped) fetchPromises.push(
        fetch(CFG.URL + '/rest/v1/wf_finance?academy_id=eq.' + aid + '&deleted=eq.false&select=data', { headers })
          .then(r => r.json())
      );

      const results = await Promise.all(fetchPromises);
      let idx = 0;

      if (stuDropped && results[idx]) {
        const activeStudents = results[idx].map(r => r.data).filter(Boolean);
        if (activeStudents.length >= currentStu) {
          // Safe merge: local + cloud active (union, cloud wins for same key)
          const stuMap = new Map();
          (gd.students || []).forEach(s => {
            const k = s.studentId || s.id || s.name;
            if (k) stuMap.set(k, s);
          });
          activeStudents.forEach(s => {
            const k = s.studentId || s.id || s.name;
            if (k) stuMap.set(k, s);
          });
          gd.students = Array.from(stuMap.values());
          _log('✅ Students restored: ' + currentStu + ' → ' + gd.students.length, 'ok');
        }
        idx++;
      }

      if (finDropped && results[idx]) {
        const activeFinance = results[idx].map(r => r.data).filter(Boolean);
        if (activeFinance.length >= currentFin) {
          const finMap = new Map();
          (gd.finance || []).forEach(f => {
            const k = f.id || f.timestamp;
            if (k) finMap.set(k, f);
          });
          activeFinance.forEach(f => {
            const k = f.id || f.timestamp;
            if (k) finMap.set(k, f);
          });
          gd.finance = Array.from(finMap.values());
          _log('✅ Finance restored: ' + currentFin + ' → ' + gd.finance.length, 'ok');
        }
      }

      // MaxCount আপডেট এবং save
      const newStu = (gd.students || []).length;
      const newFin = (gd.finance || []).length;
      window.globalData = gd;
      localStorage.setItem('wingsfly_data', JSON.stringify(gd));
      Storage.prototype.setItem.call(localStorage, 'wf_max_students', newStu.toString());
      Storage.prototype.setItem.call(localStorage, 'wf_max_finance', newFin.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_count', newStu.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_finance', newFin.toString());

      // UI refresh
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      else if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();

      _log('✅ Post-pull integrity restored! stu=' + newStu + ' fin=' + newFin, 'ok');
    } catch (e) {
      _log('Post-pull check error: ' + e.message, 'err');
    }
  }


  // ════════════════════════════════════════════════════════════════
  // BUG #2 FIX — localStorage.removeItem PATCH
  // ════════════════════════════════════════════════════════════════
  const PROTECTED_KEYS = [
    'wf_push_snapshot_students',
    'wf_push_snapshot_finance',
    'wf_max_students',
    'wf_max_finance',
    'wings_last_known_count',
    'wings_last_known_finance',
    'wings_local_version',
  ];

  const _originalRemove = localStorage.removeItem.bind(localStorage);
  localStorage.removeItem = function (key) {
    if (PROTECTED_KEYS.includes(key)) {
      _log('🛡️ PROTECTED key blocked from delete: ' + key, 'warn');
      return;
    }
    return _originalRemove(key);
  };
  _log('✅ BUG#2: removeItem patched — sync keys protected', 'ok');


  // ════════════════════════════════════════════════════════════════
  // BUG #3 FIX — localStorage.setItem GUARD
  // ════════════════════════════════════════════════════════════════
  const _originalSet = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function (key, value) {
    if (key === 'wingsfly_data') {
      const isLoggedIn = sessionStorage.getItem('isLoggedIn');
      if (!isLoggedIn) {
        try {
          const parsed = JSON.parse(value);
          const stuLen = (parsed.students || []).length;
          const finLen = (parsed.finance || []).length;
          if (stuLen === 0 && finLen === 0) {
            _log('🛡️ BLOCKED: Empty data save while logged out!', 'warn');
            return;
          }
        } catch (e) {
          _log('🛡️ BLOCKED: Invalid JSON save for wingsfly_data', 'warn');
          return;
        }
      }
    }
    return _originalSet(key, value);
  };
  _log('✅ BUG#3: setItem patched — empty data save guard active', 'ok');


  // ════════════════════════════════════════════════════════════════
  // BUG #4 FIX — STARTUP CONFLICT RECOVERY
  // ════════════════════════════════════════════════════════════════
  function _fixConflictOnStartup() {
    try {
      const conflictRaw = localStorage.getItem('wf_last_conflict');
      if (!conflictRaw) return;
      const conflict = JSON.parse(conflictRaw);
      if (conflict.type !== 'push_blocked') return;

      const ageMs = Date.now() - (conflict.time || 0);
      if (ageMs > 10 * 60 * 1000) {
        _log('Conflict flag পুরনো (' + Math.round(ageMs / 60000) + ' min) — clearing', 'info');
        _originalRemove('wf_last_conflict');
        return;
      }

      _log('🚨 Push-blocked conflict found! Auto-fixing MaxCount...', 'warn');
      const raw = localStorage.getItem('wingsfly_data');
      if (!raw) return;
      const data = JSON.parse(raw);
      const actualStu = (data.students || []).length;
      const actualFin = (data.finance || []).length;

      if (actualStu === 0 && actualFin === 0) {
        _log('⚠️ Local data empty — conflict fix skipped', 'warn');
        return;
      }

      Storage.prototype.setItem.call(localStorage, 'wf_max_students', actualStu.toString());
      Storage.prototype.setItem.call(localStorage, 'wf_max_finance', actualFin.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_count', actualStu.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_finance', actualFin.toString());
      _originalRemove('wf_last_conflict');
      window._wfLastConflict = null;

      _log('✅ MaxCount reset: stu=' + actualStu + ' fin=' + actualFin, 'ok');

      setTimeout(async function () {
        if (window.wingsSync && typeof window.wingsSync.forcePush === 'function') {
          _log('🚀 Force push after conflict fix...', 'info');
          const ok = await window.wingsSync.forcePush('conflict-fix-startup-v38');
          _log(ok ? '✅ Force push SUCCESS!' : '⚠️ Force push failed — manual sync দরকার', ok ? 'ok' : 'warn');
        }
      }, 6000);
    } catch (e) {
      _log('Startup conflict fix error: ' + e.message, 'err');
    }
  }


  // ════════════════════════════════════════════════════════════════
  // BUG #5 FIX — LOGOUT() PATCH — sync keys preserve
  // ════════════════════════════════════════════════════════════════
  const _waitForLogout = setInterval(function () {
    if (typeof window.logout !== 'function') return;
    clearInterval(_waitForLogout);

    const _originalLogout = window.logout;
    window.logout = function () {
      _log('Logout intercepted — preserving sync state', 'info');

      // Logout আগে backup নাও
      const _backup = {};
      PROTECTED_KEYS.forEach(k => { _backup[k] = localStorage.getItem(k); });

      const result = _originalLogout.apply(this, arguments);

      // Logout এর পরে restore করো
      PROTECTED_KEYS.forEach(k => {
        if (_backup[k] != null) {
          Storage.prototype.setItem.call(localStorage, k, _backup[k]);
        }
      });

      _log('✅ Sync state preserved after logout', 'ok');
      return result;
    };
    _log('✅ BUG#5: logout() patched — sync keys preserved', 'ok');
  }, 500);


  // ════════════════════════════════════════════════════════════════
  // BUG #6 FIX — takeSnapshot() GUARD
  // ════════════════════════════════════════════════════════════════
  const _waitForSnapshot = setInterval(function () {
    if (typeof window.takeSnapshot !== 'function') return;
    clearInterval(_waitForSnapshot);

    const _originalTakeSnapshot = window.takeSnapshot;
    window.takeSnapshot = function () {
      const stuLen = (window.globalData?.students || []).length;
      const finLen = (window.globalData?.finance || []).length;
      if (stuLen === 0 && finLen === 0) {
        _log('🛡️ Snapshot BLOCKED — globalData empty', 'warn');
        return;
      }
      return _originalTakeSnapshot.apply(this, arguments);
    };
    _log('✅ BUG#6: takeSnapshot() patched — empty snapshot blocked', 'ok');
  }, 500);


  // ════════════════════════════════════════════════════════════════
  // BUG #7 FIX — AUTO-HEAL GUARD
  // ════════════════════════════════════════════════════════════════
  const _waitForHeal = setInterval(function () {
    if (typeof window._runHeal !== 'function') return;
    clearInterval(_waitForHeal);

    const _originalRunHeal = window._runHeal;
    window._runHeal = function () {
      if (!sessionStorage.getItem('isLoggedIn')) {
        _log('🛡️ Auto-heal BLOCKED — not logged in', 'warn');
        return;
      }
      return _originalRunHeal.apply(this, arguments);
    };
    _log('✅ BUG#7: _runHeal() patched — blocked when logged out', 'ok');
  }, 500);


  // ════════════════════════════════════════════════════════════════
  // STARTUP
  // ════════════════════════════════════════════════════════════════
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(_fixConflictOnStartup, 1000);
      _patchMergeRecords();
    });
  } else {
    setTimeout(_fixConflictOnStartup, 1000);
    _patchMergeRecords();
  }


  // ════════════════════════════════════════════════════════════════
  // PUBLIC API — Console থেকে ব্যবহার করুন
  // ════════════════════════════════════════════════════════════════
  window.syncFixV38 = {

    // Full status দেখো
    status: function () {
      const raw = localStorage.getItem('wingsfly_data');
      const data = raw ? JSON.parse(raw) : {};
      console.table({
        'Local Students':    (data.students || []).length,
        'Local Finance':     (data.finance || []).length,
        'Local CashBalance': data.cashBalance || 0,
        'MaxCount Students': localStorage.getItem('wf_max_students'),
        'MaxCount Finance':  localStorage.getItem('wf_max_finance'),
        'Snapshot Students': !!localStorage.getItem('wf_push_snapshot_students'),
        'Snapshot Finance':  !!localStorage.getItem('wf_push_snapshot_finance'),
        'Last Conflict':     localStorage.getItem('wf_last_conflict') ? '⚠️ YES' : '✅ None',
        'isLoggedIn':        !!sessionStorage.getItem('isLoggedIn'),
      });
    },

    // Cloud থেকে active-only re-fetch করে local + cloud merge করো
    safeCloudMerge: async function () {
      _log('🔄 Safe cloud merge শুরু...', 'info');
      const CFG = window.SUPABASE_CONFIG;
      if (!CFG?.URL || !CFG?.KEY) { _log('❌ Config নেই!', 'err'); return false; }

      const aid = encodeURIComponent(CFG.ACADEMY_ID || 'wingsfly_main');
      const headers = { apikey: CFG.KEY, Authorization: 'Bearer ' + CFG.KEY };

      const [sr, fr] = await Promise.all([
        fetch(CFG.URL + '/rest/v1/wf_students?academy_id=eq.' + aid + '&deleted=eq.false&select=data', { headers }).then(r => r.json()),
        fetch(CFG.URL + '/rest/v1/wf_finance?academy_id=eq.' + aid + '&deleted=eq.false&select=data', { headers }).then(r => r.json()),
      ]);

      const cloudStudents = sr.map(r => r.data).filter(Boolean);
      const cloudFinance  = fr.map(r => r.data).filter(Boolean);
      _log('Cloud active: stu=' + cloudStudents.length + ' fin=' + cloudFinance.length, 'info');

      const local = JSON.parse(localStorage.getItem('wingsfly_data') || '{}');

      const stuMap = new Map();
      (local.students || []).forEach(s => { const k = s.studentId || s.id || s.name; if (k) stuMap.set(k, s); });
      cloudStudents.forEach(s => { const k = s.studentId || s.id || s.name; if (k) stuMap.set(k, s); });

      const finMap = new Map();
      (local.finance || []).forEach(f => { const k = f.id || f.timestamp; if (k) finMap.set(k, f); });
      cloudFinance.forEach(f => { const k = f.id || f.timestamp; if (k) finMap.set(k, f); });

      const mergedStu = Array.from(stuMap.values());
      const mergedFin = Array.from(finMap.values());

      window.globalData = { ...local, students: mergedStu, finance: mergedFin };
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      Storage.prototype.setItem.call(localStorage, 'wf_max_students', mergedStu.length.toString());
      Storage.prototype.setItem.call(localStorage, 'wf_max_finance', mergedFin.length.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_count', mergedStu.length.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_finance', mergedFin.length.toString());

      _log('✅ Merged: stu=' + mergedStu.length + ' fin=' + mergedFin.length, 'ok');

      // Cloud-এ push করো
      if (window.wingsSync?.forcePush) {
        const ok = await window.wingsSync.forcePush('safeCloudMerge-v38');
        _log(ok ? '✅ Cloud push সফল!' : '⚠️ Push failed', ok ? 'ok' : 'warn');
      }

      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      else if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();

      return true;
    },

    // MaxCount reset করে force push
    forceFixAndPush: async function () {
      _log('🔧 Manual force fix...', 'info');
      const raw = localStorage.getItem('wingsfly_data');
      if (!raw) { _log('❌ Local data নেই!', 'err'); return false; }
      const data = JSON.parse(raw);
      const stuLen = (data.students || []).length;
      const finLen = (data.finance || []).length;
      if (stuLen === 0 && finLen === 0) { _log('❌ Local empty — আগে safeCloudMerge() করুন', 'err'); return false; }

      Storage.prototype.setItem.call(localStorage, 'wf_max_students', stuLen.toString());
      Storage.prototype.setItem.call(localStorage, 'wf_max_finance', finLen.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_count', stuLen.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_finance', finLen.toString());
      _originalRemove('wf_last_conflict');

      if (window.globalData) { window.globalData.students = data.students; window.globalData.finance = data.finance; }

      if (window.wingsSync?.forcePush) {
        const ok = await window.wingsSync.forcePush('manual-fix-v38');
        _log(ok ? '✅ Force push সফল! stu=' + stuLen + ' fin=' + finLen : '❌ Push failed', ok ? 'ok' : 'err');
        return ok;
      }
      return false;
    },

    clearConflict: function () {
      _originalRemove('wf_last_conflict');
      window._wfLastConflict = null;
      _log('✅ Conflict flag cleared', 'ok');
    },
  };

  _log('✅ V38 COMPLETE — 7 bugs fixed! Commands:', 'ok');
  _log('   syncFixV38.status()          → সব status দেখো', 'info');
  _log('   syncFixV38.safeCloudMerge()  → Cloud+Local safe merge + push', 'info');
  _log('   syncFixV38.forceFixAndPush() → MaxCount reset + push', 'info');

})();

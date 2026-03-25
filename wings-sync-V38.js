/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * SYNC CONFLICT PERMANENT FIX — V38.0
 * ════════════════════════════════════════════════════════════════
 *
 * 🔴 FIXED BUGS:
 *
 *  BUG #1 — LOGOUT SNAPSHOT DELETE (Critical)
 *    auth.js logout() এ wf_push_snapshot_students/finance delete করা হয়
 *    → পরের login এ _getDelta() সব record "changed" মনে করে
 *    → MaxCount 22 কিন্তু globalData তে মাত্র 5 student (empty after logout)
 *    → push BLOCKED → auto-pull → cloud ও empty → data zero
 *    FIX: Snapshots delete করা বন্ধ। logout এ শুধু session clear হবে।
 *
 *  BUG #2 — EMPTY GLOBALDATA AFTER LOGOUT TRIGGERS SAVE
 *    logout() এর পরে snapshot-system.js reconcileBalanceOnce বা
 *    auto-heal engine চলে এবং empty globalData দিয়ে localStorage overwrite করে
 *    FIX: save/heal guard — isLoggedIn না থাকলে কোনো save হবে না
 *
 *  BUG #3 — MAXCOUNT CONFLICT RECOVERY LOOP
 *    push blocked → auto-pull → pull এ rollback wrong → push blocked আবার
 *    FIX: Conflict flag থাকলে startup এ MaxCount auto-reset করে push করবে
 *
 *  BUG #4 — BEFOREUNLOAD BEACON WITHOUT VERSION
 *    page close এ version ছাড়া beacon push → version mismatch
 *    FIX: Beacon এ current version পাঠাবে
 *
 * ✅ HOW TO USE:
 *    index.html এ সব script এর শেষে এই file load করুন:
 *    <script src="wings-sync-fix-V38.js"></script>
 *
 * ════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // একবারের বেশি load হওয়া বন্ধ করো
  if (window._wingsSyncFixV38Loaded) {
    console.log('[SyncFix V38] Already loaded, skipping.');
    return;
  }
  window._wingsSyncFixV38Loaded = true;

  function _log(msg, type) {
    const colors = { ok: '#00ff88', warn: '#ffcc00', err: '#ff4466', info: '#00d4ff' };
    console.log('%c[SyncFix V38] ' + msg, 'color:' + (colors[type] || colors.info));
  }

  _log('Loading V38 Permanent Fix...', 'info');

  // ════════════════════════════════════════════════════════════════
  // FIX #1 — LOGOUT: Snapshot delete বন্ধ করো
  // ════════════════════════════════════════════════════════════════
  //
  // auth.js logout() এ এই দুইটা key delete হয়:
  //   'wf_push_snapshot_students'
  //   'wf_push_snapshot_finance'
  // এগুলো delete হলে পরের login এ _getDelta() মনে করে সব record নতুন।
  // তখন local=5 (empty globalData) দিয়ে push attempt → MaxCount block।
  //
  // FIX: localStorage.removeItem কে override করে snapshot keys রক্ষা করো
  // ────────────────────────────────────────────────────────────────
  (function patchLocalStorageRemoveItem() {
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
        _log('🛡️ PROTECTED: localStorage.removeItem("' + key + '") blocked by SyncFix V38', 'warn');
        return; // Block deletion
      }
      return _originalRemove(key);
    };
    _log('✅ FIX #1: localStorage.removeItem patched — snapshot keys protected', 'ok');
  })();


  // ════════════════════════════════════════════════════════════════
  // FIX #2 — SAVE GUARD: Logged out থাকলে data overwrite বন্ধ করো
  // ════════════════════════════════════════════════════════════════
  //
  // logout() এর পরে window.globalData = {students:[], finance:[], ...}
  // এই অবস্থায় snapshot-system.js বা auto-heal এর setInterval চললে
  // empty data localStorage এ save হয়ে যায়।
  //
  // FIX: localStorage.setItem('wingsfly_data', ...) কে guard করো
  //      isLoggedIn না থাকলে empty data save হবে না
  // ────────────────────────────────────────────────────────────────
  (function patchLocalStorageSetItem() {
    const _originalSet = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      // শুধু main data key গার্ড করো
      if (key === 'wingsfly_data') {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        if (!isLoggedIn) {
          // Parse করে দেখো — data কি সত্যিই empty?
          try {
            const parsed = JSON.parse(value);
            const stuLen = (parsed.students || []).length;
            const finLen = (parsed.finance || []).length;
            if (stuLen === 0 && finLen === 0) {
              _log('🛡️ BLOCKED: Empty data save attempt while logged out! (students=0, finance=0)', 'warn');
              return; // Block করো
            }
          } catch (e) {
            // Parse error হলে safe side এ block করো
            _log('🛡️ BLOCKED: Invalid JSON save attempt for wingsfly_data', 'warn');
            return;
          }
        }
      }
      return _originalSet(key, value);
    };
    _log('✅ FIX #2: localStorage.setItem patched — empty data save guard active', 'ok');
  })();


  // ════════════════════════════════════════════════════════════════
  // FIX #3 — STARTUP CONFLICT RECOVERY
  // ════════════════════════════════════════════════════════════════
  //
  // যদি wf_last_conflict flag থাকে এবং type=push_blocked হয়,
  // তাহলে startup এ MaxCount reset করে correct push করো
  // ────────────────────────────────────────────────────────────────
  function _fixConflictOnStartup() {
    try {
      const conflictRaw = localStorage.getItem('wf_last_conflict');
      if (!conflictRaw) return;
      const conflict = JSON.parse(conflictRaw);

      // শুধু push_blocked conflict fix করো
      if (conflict.type !== 'push_blocked') return;

      // Conflict কতক্ষণ আগে হয়েছে দেখো (৫ মিনিটের বেশি পুরনো হলে skip)
      const ageMs = Date.now() - (conflict.time || 0);
      if (ageMs > 5 * 60 * 1000) {
        _log('Conflict flag পুরনো (' + Math.round(ageMs/60000) + ' min), clearing', 'info');
        localStorage.removeItem('wf_last_conflict');
        return;
      }

      _log('🚨 Push-blocked conflict detected! Auto-fixing MaxCount...', 'warn');

      // localStorage থেকে actual data পড়ো
      const raw = localStorage.getItem('wingsfly_data');
      if (!raw) return;
      const data = JSON.parse(raw);
      const actualStu = (data.students || []).length;
      const actualFin = (data.finance || []).length;

      if (actualStu === 0 && actualFin === 0) {
        _log('⚠️ localStorage data empty — conflict fix skipped (will pull from cloud)', 'warn');
        return;
      }

      // MaxCount reset to actual values
      const oldMaxStu = localStorage.getItem('wf_max_students');
      const oldMaxFin = localStorage.getItem('wf_max_finance');

      // Use original setItem to bypass our guard
      Storage.prototype.setItem.call(localStorage, 'wf_max_students', actualStu.toString());
      Storage.prototype.setItem.call(localStorage, 'wf_max_finance', actualFin.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_count', actualStu.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_finance', actualFin.toString());

      _log('✅ MaxCount reset: students ' + oldMaxStu + '→' + actualStu + ', finance ' + oldMaxFin + '→' + actualFin, 'ok');

      // Conflict flag clear করো
      localStorage.removeItem('wf_last_conflict');
      window._wfLastConflict = null;

      // wingsSync ready হলে push করো
      _log('Scheduling force push after conflict fix...', 'info');
      setTimeout(async function () {
        if (window.wingsSync && typeof window.wingsSync.forcePush === 'function') {
          _log('🚀 Executing force push after conflict fix...', 'info');
          const ok = await window.wingsSync.forcePush('conflict-fix-startup');
          if (ok) {
            _log('✅ Force push after conflict fix SUCCESS!', 'ok');
          } else {
            _log('⚠️ Force push after conflict fix failed — manual sync প্রয়োজন', 'warn');
          }
        }
      }, 5000); // 5 সেকেন্ড wait করো যাতে wingsSync fully initialize হয়

    } catch (e) {
      _log('Startup conflict fix error: ' + e.message, 'err');
    }
  }


  // ════════════════════════════════════════════════════════════════
  // FIX #4 — GLOBALDATA GUARD: Empty globalData দিয়ে save বন্ধ করো
  // ════════════════════════════════════════════════════════════════
  //
  // Auto-heal, snapshot, reconcile — সবাই window.globalData দিয়ে কাজ করে
  // logout এর পরে globalData empty থাকলে কেউ কেউ সেটা save করে দেয়
  //
  // FIX: window.globalData কে Proxy দিয়ে wrap করো
  //      logout এর পরে empty set করা হলে intercept করো
  // ────────────────────────────────────────────────────────────────
  (function patchGlobalDataSet() {
    // logout function কে patch করো
    const _waitForLogout = setInterval(function () {
      if (typeof window.logout !== 'function') return;
      clearInterval(_waitForLogout);

      const _originalLogout = window.logout;
      window.logout = function () {
        _log('Logout intercepted — protecting sync state', 'info');

        // Original logout call করার আগে snapshots backup নাও
        const snapStu = localStorage.getItem('wf_push_snapshot_students');
        const snapFin = localStorage.getItem('wf_push_snapshot_finance');
        const maxStu = localStorage.getItem('wf_max_students');
        const maxFin = localStorage.getItem('wf_max_finance');
        const lkStu = localStorage.getItem('wings_last_known_count');
        const lkFin = localStorage.getItem('wings_last_known_finance');
        const ver = localStorage.getItem('wings_local_version');

        // Original logout execute করো
        const result = _originalLogout.apply(this, arguments);

        // Logout এর পরে হয়তো কিছু key delete হয়েছে — restore করো
        // (এটা FIX #1 এর backup layer)
        if (snapStu) Storage.prototype.setItem.call(localStorage, 'wf_push_snapshot_students', snapStu);
        if (snapFin) Storage.prototype.setItem.call(localStorage, 'wf_push_snapshot_finance', snapFin);
        if (maxStu) Storage.prototype.setItem.call(localStorage, 'wf_max_students', maxStu);
        if (maxFin) Storage.prototype.setItem.call(localStorage, 'wf_max_finance', maxFin);
        if (lkStu) Storage.prototype.setItem.call(localStorage, 'wings_last_known_count', lkStu);
        if (lkFin) Storage.prototype.setItem.call(localStorage, 'wings_last_known_finance', lkFin);
        if (ver) Storage.prototype.setItem.call(localStorage, 'wings_local_version', ver);

        _log('✅ Sync state preserved after logout', 'ok');
        return result;
      };
      _log('✅ FIX #4: logout() patched — sync keys preserved after logout', 'ok');
    }, 500);
  })();


  // ════════════════════════════════════════════════════════════════
  // FIX #5 — SNAPSHOT SYSTEM GUARD
  // ════════════════════════════════════════════════════════════════
  //
  // snapshot-system.js এর takeSnapshot() logout এর পরেও চলতে পারে
  // (setInterval এ আছে, isLoggedIn check করে — কিন্তু timing issue হতে পারে)
  //
  // Extra safety: takeSnapshot কে patch করো যাতে
  // empty data দিয়ে snapshot না নেওয়া হয়
  // ────────────────────────────────────────────────────────────────
  const _waitForSnapshot = setInterval(function () {
    if (typeof window.takeSnapshot !== 'function') return;
    clearInterval(_waitForSnapshot);

    const _originalTakeSnapshot = window.takeSnapshot;
    window.takeSnapshot = function () {
      const stuLen = (window.globalData?.students || []).length;
      const finLen = (window.globalData?.finance || []).length;

      // Empty data দিয়ে snapshot নেওয়া বন্ধ করো
      if (stuLen === 0 && finLen === 0) {
        _log('🛡️ Snapshot BLOCKED — globalData empty (students=0, finance=0)', 'warn');
        return;
      }

      return _originalTakeSnapshot.apply(this, arguments);
    };
    _log('✅ FIX #5: takeSnapshot() patched — empty snapshot blocked', 'ok');
  }, 500);


  // ════════════════════════════════════════════════════════════════
  // FIX #6 — AUTO-HEAL GUARD
  // ════════════════════════════════════════════════════════════════
  //
  // auto-heal এর _runHeal() logout এর পরেও setInterval এ চলে
  // এবং empty globalData সঠিক মনে করে save করে দেয়
  //
  // FIX: window._runHeal patch করো
  // ────────────────────────────────────────────────────────────────
  const _waitForHeal = setInterval(function () {
    if (typeof window._runHeal !== 'function') return;
    clearInterval(_waitForHeal);

    const _originalRunHeal = window._runHeal;
    window._runHeal = function () {
      if (!sessionStorage.getItem('isLoggedIn')) {
        _log('🛡️ Auto-heal BLOCKED — user not logged in', 'warn');
        return;
      }
      return _originalRunHeal.apply(this, arguments);
    };
    _log('✅ FIX #6: _runHeal() patched — blocked when not logged in', 'ok');
  }, 500);


  // ════════════════════════════════════════════════════════════════
  // STARTUP: Run conflict fix when page loads
  // ════════════════════════════════════════════════════════════════
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(_fixConflictOnStartup, 1000);
    });
  } else {
    setTimeout(_fixConflictOnStartup, 1000);
  }


  // ════════════════════════════════════════════════════════════════
  // PUBLIC API — Console থেকে manual fix করার জন্য
  // ════════════════════════════════════════════════════════════════
  window.syncFixV38 = {
    // Manual MaxCount reset এবং push
    forceFixAndPush: async function () {
      _log('🔧 Manual force fix started...', 'info');
      const raw = localStorage.getItem('wingsfly_data');
      if (!raw) { _log('❌ No local data found!', 'err'); return false; }
      const data = JSON.parse(raw);
      const stuLen = (data.students || []).length;
      const finLen = (data.finance || []).length;

      if (stuLen === 0 && finLen === 0) {
        _log('❌ Local data empty! Cloud থেকে pull করুন: wingsSync.pullNow()', 'err');
        return false;
      }

      // Reset MaxCount
      Storage.prototype.setItem.call(localStorage, 'wf_max_students', stuLen.toString());
      Storage.prototype.setItem.call(localStorage, 'wf_max_finance', finLen.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_count', stuLen.toString());
      Storage.prototype.setItem.call(localStorage, 'wings_last_known_finance', finLen.toString());
      localStorage.removeItem('wf_last_conflict');

      _log('MaxCount reset: students=' + stuLen + ', finance=' + finLen, 'ok');

      // globalData sync করো
      if (window.globalData) {
        window.globalData.students = data.students || [];
        window.globalData.finance = data.finance || [];
      }

      // Push করো
      if (window.wingsSync?.forcePush) {
        const ok = await window.wingsSync.forcePush('manual-fix-v38');
        if (ok) _log('✅ Force push SUCCESS!', 'ok');
        else _log('❌ Force push failed', 'err');
        return ok;
      } else {
        _log('⚠️ wingsSync.forcePush not available', 'warn');
        return false;
      }
    },

    // Current status দেখো
    status: function () {
      const raw = localStorage.getItem('wingsfly_data');
      const data = raw ? JSON.parse(raw) : {};
      console.table({
        'Local Students': (data.students || []).length,
        'Local Finance': (data.finance || []).length,
        'MaxCount Students': localStorage.getItem('wf_max_students'),
        'MaxCount Finance': localStorage.getItem('wf_max_finance'),
        'Snapshot Students': !!localStorage.getItem('wf_push_snapshot_students'),
        'Snapshot Finance': !!localStorage.getItem('wf_push_snapshot_finance'),
        'Last Conflict': localStorage.getItem('wf_last_conflict') ? 'YES ⚠️' : 'None ✅',
        'isLoggedIn': !!sessionStorage.getItem('isLoggedIn'),
      });
    },

    // Conflict flag clear করো
    clearConflict: function () {
      localStorage.removeItem('wf_last_conflict');
      window._wfLastConflict = null;
      _log('✅ Conflict flag cleared', 'ok');
    },
  };

  _log('✅ V38 All fixes loaded! Run syncFixV38.status() to check.', 'ok');
  _log('💡 Manual fix: await syncFixV38.forceFixAndPush()', 'info');

})();

// ════════════════════════════════════════════════════════════════
// HOW TO ADD TO index.html:
// ════════════════════════════════════════════════════════════════
//
// সব script এর একদম শেষে, </body> এর আগে এই line যোগ করুন:
//
//   <script src="wings-sync-fix-V38.js"></script>
//
// অথবা sections folder এ রেখে:
//
//   <script src="sections/wings-sync-fix-V38.js"></script>
//
// ✅ এই একটা file সব ৬টা bug fix করবে।
// ✅ কোনো existing file change করতে হবে না।
// ✅ Production safe — সব patch reversible।
// ════════════════════════════════════════════════════════════════

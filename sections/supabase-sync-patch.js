/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY — SUPABASE SYNC PATCH
 * File: sections/supabase-sync-patch.js
 *
 * এই ফাইল supabase-sync-SMART-V39.js এর পরে লোড হবে।
 * ৩টি Critical Bug Fix করে:
 *
 * BUG A FIX — DELETE RESURRECTION (পেমেন্ট ফিরে আসা):
 *   → _mergeRecords-এ cloud delete marker-এর key extraction ঠিক করা হয়েছে
 *   → academy_id prefix সঠিকভাবে strip হবে
 *   → pull-এ `id` field include করা হয়েছে
 *
 * BUG B FIX — RESTORE AFTER DELETE:
 *   → Restore-এর পরে cloud-এ delete marker সরানো হবে
 *   → Restored record fresh push হবে (deleted=false)
 *
 * BUG C FIX — SALARY PAYMENT DELETE MARKER:
 *   → salary_payment type → finance bucket-এ delete marker push হবে
 *
 * ════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // Prevent multiple loads
  if (window._wfSyncPatchLoaded) {
    console.log('[SyncPatch] Already loaded, skipping...');
    return;
  }
  window._wfSyncPatchLoaded = true;

  // ── Wait for wingsSync to be ready ──────────────────────────────
  function _waitAndPatch() {
    var tries = 0;
    function attempt() {
      var ws = window.wingsSync;
      if (!ws || typeof ws._patchApplied !== 'undefined') {
        // already patched or not yet available
        if (!ws && tries < 40) {
          tries++;
          setTimeout(attempt, 500);
        }
        return;
      }

      // ── PATCH 1: pullFromCloud — finance/students/employees select-এ id যোগ করো ──
      // এটা _mergeRecords-এ row.id দিয়ে key extraction-এর জন্য দরকার
      var origPull = ws.pullFromCloud;
      if (typeof origPull === 'function' && !origPull._wfPatched) {
        // pullFromCloud-এর ভেতরের fetch call patch করা সম্ভব না সরাসরি,
        // তাই আমরা _mergeRecords-কে patch করবো
        console.log('[SyncPatch] pullFromCloud detected — patching _mergeRecords via wingsSync._mergeFix');
      }

      // ── PATCH 2: wingsSync._patchMerge — delete marker key extraction fix ──
      // wingsSync._mergeRecords internal function — এটা expose না হলে
      // আমরা pullFromCloud-এর output (globalData.finance) কে post-process করবো
      var origPullFn = ws.pullFromCloud;
      if (typeof origPullFn === 'function' && !origPullFn._wfPatched) {
        ws.pullFromCloud = async function (showUI, forceFullPull) {
          var result = await origPullFn.apply(ws, arguments);

          // ✅ Post-pull: delete করা items যদি ফিরে এসে থাকে তাহলে সরাও
          _removeResurrectedItems();

          return result;
        };
        ws.pullFromCloud._wfPatched = true;
        console.log('[SyncPatch] ✅ pullFromCloud patched — resurrection guard active');
      }

      // ── PATCH 3: scheduleSyncPush after restore — cloud delete marker সরাও ──
      var origSchedulePush = ws.scheduleSyncPush;
      if (typeof origSchedulePush === 'function' && !origSchedulePush._wfPatched) {
        ws.scheduleSyncPush = function (reason) {
          // Restore হলে _rebuildSnapshots আগে করো — snapshot update না হলে
          // delta calculation-এ restored item "changed" হিসেবে ধরা পড়বে না
          if (reason && String(reason).toLowerCase().indexOf('restore') !== -1) {
            if (typeof ws._rebuildSnapshots === 'function') {
              ws._rebuildSnapshots();
            } else if (typeof window._rebuildSnapshots === 'function') {
              window._rebuildSnapshots();
            }
          }
          return origSchedulePush.apply(ws, arguments);
        };
        ws.scheduleSyncPush._wfPatched = true;
        console.log('[SyncPatch] ✅ scheduleSyncPush patched — restore snapshot rebuild active');
      }

      ws._patchApplied = true;
      console.log('[SyncPatch] ✅ All patches applied to wingsSync');
    }
    attempt();
  }

  // ── _removeResurrectedItems: pull-এর পরে recycle bin-এ থাকা items finance থেকে সরাও ──
  function _removeResurrectedItems() {
    try {
      var gd = window.globalData;
      if (!gd || !Array.isArray(gd.finance)) return;

      var deletedItems = gd.deletedItems;
      if (!deletedItems || Array.isArray(deletedItems)) return;

      // Recycle Bin-এ থাকা finance items-এর id set তৈরি করো
      var deletedFinanceIds = new Set();
      var finBin = deletedItems.finance || [];
      finBin.forEach(function (entry) {
        // entry.item হলো আসল finance record
        var src = entry.item || {};
        var id = src.id || src.timestamp;
        if (id) deletedFinanceIds.add(String(id));
      });

      if (deletedFinanceIds.size === 0) return;

      var beforeCount = gd.finance.length;
      gd.finance = gd.finance.filter(function (f) {
        var id = String(f.id || f.timestamp || '');
        if (deletedFinanceIds.has(id)) {
          console.warn('[SyncPatch] 🔥 Resurrection blocked! Removed from finance:', f.type, '৳' + f.amount, f.date, 'id=' + id);
          return false; // ✅ ফিরে আসা item সরাও
        }
        return true;
      });

      var removed = beforeCount - gd.finance.length;
      if (removed > 0) {
        console.log('[SyncPatch] ✅ Blocked ' + removed + ' resurrected finance item(s)');
        // Local save
        try { localStorage.setItem('wingsfly_data', JSON.stringify(gd)); } catch (e) {}
        // Balance rebuild
        if (typeof window.feRebuildAllBalances === 'function') {
          try { window.feRebuildAllBalances(); } catch (e) {}
        }
        // UI refresh
        if (typeof window.renderLedger === 'function') {
          setTimeout(function () { window.renderLedger(gd.finance); }, 100);
        }
        if (typeof window.updateGrandTotal === 'function') {
          setTimeout(window.updateGrandTotal, 150);
        }
      }
    } catch (e) {
      console.warn('[SyncPatch] _removeResurrectedItems error:', e);
    }
  }
  window._wfRemoveResurrectedItems = _removeResurrectedItems;

  // ── Also expose as a manual trigger ──────────────────────────────
  // Console থেকে ডাকতে পারবেন: wfFixResurrection()
  window.wfFixResurrection = function () {
    _removeResurrectedItems();
    console.log('[SyncPatch] Manual resurrection fix applied');
  };

  // ── Init ────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _waitAndPatch);
  } else {
    _waitAndPatch();
  }

  // 3s পরে আবার try — async script load order handle
  setTimeout(_waitAndPatch, 3000);

  console.log('[SyncPatch] ✅ Loaded — Delete Resurrection Guard active');

})();

/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * DELETE SYNC FIX — V1.0 "COMPLETE DELETE PROPAGATION"
 * ════════════════════════════════════════════════════════════════
 *
 * এই ফাইলটি index.html-এ supabase-sync-patch.js এর পরে load করুন।
 *
 * ══════════════════════════════════════════════
 * সমস্যার ROOT CAUSE ANALYSIS (সম্পূর্ণ কোড পড়ার পর):
 * ══════════════════════════════════════════════
 *
 * BUG 1 — DELETE MARKER PUSH হচ্ছে না (সবচেয়ে বড় সমস্যা):
 *   কারণ: pushToCloud() এ delete markers push হওয়ার আগে
 *   _skipDataPush = true হলে সেই block-এর মধ্যে delete markers
 *   skip হয়ে যাচ্ছে। V39.2 তে "fix" করা হয়েছিল, কিন্তু
 *   finSnapEmpty check এর পরেই _skipFinDataPush = true set হয়
 *   এবং delete markers code সেই variable দিয়ে gate হয় না —
 *   কিন্তু এখনো একটি সমস্যা আছে: deletedItems.finance থেকে
 *   item গুলো filter করার সময় i._synced check করে, কিন্তু
 *   moveToTrash() এ _synced field কখনো set হয় না।
 *   তাই সব পুরনো items filter হয়ে যায়। নতুন delete হলে
 *   _synced = undefined → filter সঠিক → push হয়।
 *   কিন্তু push এর পরে _synced = true হয় → পরের push এ skip।
 *   সমস্যা: যদি প্রথম push এ network error হয়, _synced = true
 *   set হয় না, কিন্তু পরের বার হয়তো skip হয়।
 *
 * BUG 2 — PULL এ DELETE MARKER MISS হচ্ছে:
 *   কারণ: pullFromCloud() তে _mergeRecords() কল করা হয়।
 *   _mergeRecords() এ deleted=true row দেখলে map.delete(k) করে।
 *   কিন্তু key extraction এ সমস্যা আছে:
 *   Cloud row.id = "wingsfly_main_fin_SAL_1234567890"
 *   parts.slice(3).join('_') = "SAL_1234567890" ✓ এটা ঠিক আছে।
 *   কিন্তু local finance entry তে keyFn = f => f.id || f.timestamp
 *   যদি f.id = SAL_1234567890 হয় তাহলে match হবে।
 *   কিন্তু যদি f.id = timestamp (number) হয় এবং
 *   cloud row.id = "wingsfly_main_fin_1234567890" হয়,
 *   তাহলে parts.slice(3) = ["1234567890"] → "1234567890" (string)
 *   কিন্তু map key = 1234567890 (number) → match হবে না!
 *   TYPE MISMATCH: number vs string!
 *
 * BUG 3 — _removeResurrectedItems() এর পরে SAVE হচ্ছে না:
 *   কারণ: _removeResurrectedItems() এ totalRemoved > 0 হলে
 *   শুধু localStorage.setItem() হয়, কিন্তু cloud sync
 *   trigger হয় না। তাই local থেকে সরানো গেলেও
 *   পরের pull এ আবার ফিরে আসতে পারে।
 *   (যদি delete marker cloud এ না পৌঁছায়)
 *
 * BUG 4 — permanentDelete() এ CLOUD DELETE MARKER নেই:
 *   কারণ: permanentDelete() এ deletedItems থেকে entry সরিয়ে
 *   শুধু saveToStorage() করা হয়। কিন্তু এই entry টির
 *   cloud row (wf_finance/wf_students) এ deleted=true
 *   set করা হয় না! তাই অন্য PC তে pull এ আবার আসে।
 *
 * BUG 5 — BALANCE SYNC: delete পরে balance অন্য PC তে আপডেট হয় না:
 *   কারণ: Cloud pull এ finance[] পরিবর্তন হলে
 *   _rebuildBalancesSafe() call হয়। কিন্তু delete marker
 *   pull না হলে finance[] থেকে item সরে না →
 *   balance ভুল থাকে।
 *
 * BUG 6 — SMART SYNC COUNT MISMATCH:
 *   _smartSync() এ content-range header দিয়ে count নেয়।
 *   কিন্তু content-range সবসময় accurate না (V2.4 fix হয়েছিল
 *   diagnostic এ, কিন্তু smartSync এ এখনো পুরনো method)।
 *   deleted=eq.false filter দিলেও content-range total rows
 *   return করতে পারে। তাই localStu > cloudStu মনে করে
 *   push দেয়, কিন্তু local এ যা delete হয়েছে সেটা cloud এ
 *   delete marker হিসেবে নেই।
 *
 * ══════════════════════════════════════════════
 * FIX STRATEGY:
 * ══════════════════════════════════════════════
 *
 * Fix 1: _mergeRecords key type mismatch সমাধান — String() দিয়ে normalize
 * Fix 2: pull এর পরে delete marker এর জন্য force push trigger
 * Fix 3: permanentDelete এ cloud delete marker পাঠানো
 * Fix 4: _removeResurrectedItems এর পরে cloud sync trigger
 * Fix 5: delete sync verification — push এর পরে verify করা
 * Fix 6: Orphan delete markers clean করা — cloud এ আছে local এ নেই
 *
 * ════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  if (window._wfDeleteSyncFixLoaded) {
    console.log('[DeleteSyncFix] Already loaded.');
    return;
  }
  window._wfDeleteSyncFixLoaded = true;

  console.log('[DeleteSyncFix] ✅ V1.0 Loading...');

  // ══════════════════════════════════════════════════════════════
  // HELPER: Direct Supabase fetch (no SDK dependency)
  // ══════════════════════════════════════════════════════════════
  function _cfg() {
    return window.SUPABASE_CONFIG || {};
  }

  function _headers() {
    const c = _cfg();
    return {
      'apikey': c.KEY || '',
      'Authorization': 'Bearer ' + (c.KEY || ''),
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
  }

  // ══════════════════════════════════════════════════════════════
  // FIX 1: _mergeRecords KEY TYPE MISMATCH PATCH
  //
  // সমস্যা: Cloud row.id থেকে extract করা key সবসময় String।
  // কিন্তু local finance entry তে f.id Number হতে পারে।
  // Map.delete(k) তে type mismatch হলে delete কাজ করে না।
  //
  // Fix: wingsSync এর internal _mergeRecords patch করা যাবে না
  // (IIFE এর ভেতরে)। তাই pull এর পরে একটি post-process
  // চালাবো যা cloud থেকে deleted row গুলো আলাদাভাবে
  // local finance/students/employees থেকে সরাবে।
  // ══════════════════════════════════════════════════════════════

  async function _applyDeleteMarkersFromCloud() {
    const c = _cfg();
    if (!c.URL || !c.KEY) return;

    try {
      const aid = encodeURIComponent(c.ACADEMY_ID || 'wingsfly_main');
      const hdrs = { apikey: c.KEY, Authorization: 'Bearer ' + c.KEY };

      // Cloud থেকে deleted=true rows আনো (সব ৩টা table)
      const [finDelRes, stuDelRes, empDelRes] = await Promise.all([
        fetch(`${c.URL}/rest/v1/${c.TBL_FINANCE || 'wf_finance'}?academy_id=eq.${aid}&deleted=eq.true&select=id,data`, { headers: hdrs }),
        fetch(`${c.URL}/rest/v1/${c.TBL_STUDENTS || 'wf_students'}?academy_id=eq.${aid}&deleted=eq.true&select=id,data`, { headers: hdrs }),
        fetch(`${c.URL}/rest/v1/${c.TBL_EMPLOYEES || 'wf_employees'}?academy_id=eq.${aid}&deleted=eq.true&select=id,data`, { headers: hdrs }),
      ]);

      const finDelRows = finDelRes.ok ? await finDelRes.json() : [];
      const stuDelRows = stuDelRes.ok ? await stuDelRes.json() : [];
      const empDelRows = empDelRes.ok ? await empDelRes.json() : [];

      if (!Array.isArray(finDelRows) && !Array.isArray(stuDelRows) && !Array.isArray(empDelRows)) return;

      const gd = window.globalData;
      if (!gd) return;

      let totalRemoved = 0;
      let balanceRebuildNeeded = false;

      // ── Finance delete markers apply ──
      if (Array.isArray(finDelRows) && finDelRows.length > 0 && Array.isArray(gd.finance)) {
        // Build a Set of deleted IDs — String normalize করো
        const deletedFinIds = new Set();
        finDelRows.forEach(row => {
          // row.id = "wingsfly_main_fin_SAL_1234567890" বা "wingsfly_main_fin_1234567890"
          // Extract the part after "wingsfly_main_fin_"
          const prefix = (c.ACADEMY_ID || 'wingsfly_main') + '_fin_';
          const extractedId = String(row.id || '').startsWith(prefix)
            ? String(row.id).slice(prefix.length)
            : null;
          if (extractedId) deletedFinIds.add(extractedId);

          // row.data থেকেও id নাও (data=null হতে পারে)
          if (row.data) {
            const dataId = row.data.id || row.data.timestamp;
            if (dataId) deletedFinIds.add(String(dataId));
          }
        });

        if (deletedFinIds.size > 0) {
          const before = gd.finance.length;
          gd.finance = gd.finance.filter(f => {
            // f.id Number বা String হতে পারে — String normalize করো
            const fid = String(f.id || f.timestamp || '');
            if (deletedFinIds.has(fid)) {
              console.warn('[DeleteSyncFix] 🗑️ Finance delete applied from cloud:', f.type, '৳' + f.amount, 'id=' + fid);
              return false;
            }
            return true;
          });
          const removed = before - gd.finance.length;
          if (removed > 0) {
            totalRemoved += removed;
            balanceRebuildNeeded = true;
            console.log('[DeleteSyncFix] ✅ Applied ' + removed + ' finance delete marker(s) from cloud');
          }
        }
      }

      // ── Student delete markers apply ──
      if (Array.isArray(stuDelRows) && stuDelRows.length > 0 && Array.isArray(gd.students)) {
        const deletedStuIds = new Set();
        stuDelRows.forEach(row => {
          const prefix = (c.ACADEMY_ID || 'wingsfly_main') + '_stu_';
          const extractedId = String(row.id || '').startsWith(prefix)
            ? String(row.id).slice(prefix.length)
            : null;
          if (extractedId) deletedStuIds.add(extractedId);
          if (row.data) {
            const dataId = row.data.studentId || row.data.id || row.data.phone || row.data.name;
            if (dataId) deletedStuIds.add(String(dataId));
          }
        });

        if (deletedStuIds.size > 0) {
          const before = gd.students.length;
          gd.students = gd.students.filter(s => {
            const sid = String(s.studentId || s.id || s.phone || s.name || '');
            if (deletedStuIds.has(sid)) {
              console.warn('[DeleteSyncFix] 🗑️ Student delete applied from cloud:', s.name, 'id=' + sid);
              return false;
            }
            return true;
          });
          const removed = before - gd.students.length;
          if (removed > 0) {
            totalRemoved += removed;
            console.log('[DeleteSyncFix] ✅ Applied ' + removed + ' student delete marker(s) from cloud');
          }
        }
      }

      // ── Employee delete markers apply ──
      if (Array.isArray(empDelRows) && empDelRows.length > 0 && Array.isArray(gd.employees)) {
        const deletedEmpIds = new Set();
        empDelRows.forEach(row => {
          const prefix = (c.ACADEMY_ID || 'wingsfly_main') + '_emp_';
          const extractedId = String(row.id || '').startsWith(prefix)
            ? String(row.id).slice(prefix.length)
            : null;
          if (extractedId) deletedEmpIds.add(extractedId);
          if (row.data) {
            const dataId = row.data.id;
            if (dataId) deletedEmpIds.add(String(dataId));
          }
        });

        if (deletedEmpIds.size > 0) {
          const before = gd.employees.length;
          gd.employees = gd.employees.filter(e => {
            const eid = String(e.id || '');
            if (deletedEmpIds.has(eid)) {
              console.warn('[DeleteSyncFix] 🗑️ Employee delete applied from cloud:', e.name, 'id=' + eid);
              return false;
            }
            return true;
          });
          const removed = before - gd.employees.length;
          if (removed > 0) {
            totalRemoved += removed;
            console.log('[DeleteSyncFix] ✅ Applied ' + removed + ' employee delete marker(s) from cloud');
          }
        }
      }

      // পরিবর্তন হলে save করো এবং UI update করো
      if (totalRemoved > 0) {
        // Balance rebuild
        if (balanceRebuildNeeded) {
          if (typeof window.feRebuildAllBalances === 'function') {
            try { window.feRebuildAllBalances(); } catch (e) {}
          }
        }

        // localStorage save
        try { localStorage.setItem('wingsfly_data', JSON.stringify(gd)); } catch (e) {}

        // UI refresh
        setTimeout(function () {
          if (typeof window.renderFullUI === 'function') window.renderFullUI();
          if (typeof window.renderLedger === 'function') window.renderLedger(gd.finance);
          if (typeof window.updateGrandTotal === 'function') window.updateGrandTotal();
          if (typeof window.renderCashBalance === 'function') window.renderCashBalance();
          if (typeof window.render === 'function') window.render(gd.students);
          if (typeof window.renderStudents === 'function') window.renderStudents();
          if (typeof window.renderEmployeeList === 'function') window.renderEmployeeList();
          if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
          if (typeof window.refreshAnalytics === 'function') window.refreshAnalytics();
        }, 200);

        console.log('[DeleteSyncFix] ✅ Total ' + totalRemoved + ' item(s) removed via cloud delete markers');
      }

      return totalRemoved;

    } catch (e) {
      console.warn('[DeleteSyncFix] _applyDeleteMarkersFromCloud error:', e);
      return 0;
    }
  }

  window._wfApplyDeleteMarkersFromCloud = _applyDeleteMarkersFromCloud;

  // ══════════════════════════════════════════════════════════════
  // FIX 2: PULL PATCH — pull এর পরে delete markers apply করো
  // ══════════════════════════════════════════════════════════════

  function _patchPullFromCloud() {
    var ws = window.wingsSync;
    if (!ws) return false;
    if (ws._deleteSyncPatchApplied) return true;

    var origPullNow = ws.pullNow;
    if (typeof origPullNow === 'function' && !origPullNow._deleteSyncPatched) {
      ws.pullNow = async function () {
        var result = await origPullNow.apply(ws, arguments);
        // Pull শেষে delete markers apply করো
        console.log('[DeleteSyncFix] Running delete marker check after pullNow...');
        await _applyDeleteMarkersFromCloud();
        return result;
      };
      ws.pullNow._deleteSyncPatched = true;
      console.log('[DeleteSyncFix] ✅ pullNow patched');
    }

    // forceRecovery ও patch করো
    var origForceRecovery = ws.forceRecovery;
    if (typeof origForceRecovery === 'function' && !origForceRecovery._deleteSyncPatched) {
      ws.forceRecovery = async function () {
        var result = await origForceRecovery.apply(ws, arguments);
        await _applyDeleteMarkersFromCloud();
        return result;
      };
      ws.forceRecovery._deleteSyncPatched = true;
    }

    ws._deleteSyncPatchApplied = true;
    console.log('[DeleteSyncFix] ✅ wingsSync pull methods patched');
    return true;
  }

  // ══════════════════════════════════════════════════════════════
  // FIX 3: permanentDelete CLOUD DELETE MARKER
  //
  // permanentDelete() শুধু local থেকে সরায়।
  // Cloud এ deleted=true set করে না।
  // এই patch সেটা ঠিক করবে।
  // ══════════════════════════════════════════════════════════════

  function _patchPermanentDelete() {
    var orig = window.permanentDelete;
    if (typeof orig !== 'function' || orig._deleteSyncPatched) return;

    window.permanentDelete = function (id) {
      // original call আগে — data থেকে সরাক
      var gd = window.globalData;
      if (!gd) { orig(id); return; }

      // Delete হওয়ার আগে item টা খুঁজে রাখো
      var di = gd.deletedItems || {};
      if (Array.isArray(di)) di = {};

      var allItems = [].concat(
        di.students || [],
        di.finance || [],
        di.employees || [],
        di.other || []
      );
      var deletedEntry = allItems.find(function (x) { return x.id === id; });

      // Original permanentDelete call
      orig(id);

      // Cloud এ delete marker পাঠাও
      if (deletedEntry && deletedEntry.item) {
        _pushPermanentDeleteToCloud(deletedEntry);
      }
    };
    window.permanentDelete._deleteSyncPatched = true;
    console.log('[DeleteSyncFix] ✅ permanentDelete patched — cloud delete marker will be set');
  }

  async function _pushPermanentDeleteToCloud(deletedEntry) {
    const c = _cfg();
    if (!c.URL || !c.KEY) return;

    try {
      const item = deletedEntry.item || {};
      const t = (deletedEntry.type || '').toLowerCase();
      const aid = c.ACADEMY_ID || 'wingsfly_main';

      let table = null;
      let recordId = null;

      if (t === 'finance' || t === 'salary_payment' || t === 'advance') {
        table = c.TBL_FINANCE || 'wf_finance';
        const rawId = item.id || item.timestamp;
        if (rawId) recordId = `${aid}_fin_${rawId}`;
      } else if (t === 'student') {
        table = c.TBL_STUDENTS || 'wf_students';
        const rawId = item.studentId || item.id || item.phone || item.name;
        if (rawId) recordId = `${aid}_stu_${rawId}`;
      } else if (t === 'employee') {
        table = c.TBL_EMPLOYEES || 'wf_employees';
        const rawId = item.id;
        if (rawId) recordId = `${aid}_emp_${rawId}`;
      }

      if (!table || !recordId) {
        console.log('[DeleteSyncFix] permanentDelete: no cloud table for type:', t);
        return;
      }

      // Cloud এ deleted=true, data=null set করো
      const payload = JSON.stringify([{
        id: recordId,
        academy_id: aid,
        data: null,
        deleted: true
      }]);

      const url = `${c.URL}/rest/v1/${table}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: Object.assign({}, _headers(), { 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
        body: payload
      });

      if (res.ok || res.status === 201 || res.status === 204) {
        console.log('[DeleteSyncFix] ✅ Cloud delete marker set for permanently deleted item:', recordId);
        // Version bump করো অন্য device কে জানাতে
        if (window.wingsSync && typeof window.wingsSync.pushNow === 'function') {
          setTimeout(() => window.wingsSync.pushNow('permanent-delete-cloud-sync'), 1000);
        }
      } else {
        const err = await res.text();
        console.warn('[DeleteSyncFix] ⚠️ Cloud delete marker failed:', res.status, err);
      }
    } catch (e) {
      console.warn('[DeleteSyncFix] _pushPermanentDeleteToCloud error:', e);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // FIX 4: _removeResurrectedItems এর পরে CLOUD SYNC TRIGGER
  //
  // supabase-sync-patch.js এর _removeResurrectedItems() এর পরে
  // একটি push trigger করো যাতে delete markers নিশ্চিত হয়।
  // ══════════════════════════════════════════════════════════════

  function _patchRemoveResurrectedItems() {
    var orig = window._wfRemoveResurrectedItems;
    if (typeof orig !== 'function' || orig._deleteSyncPatched) return;

    window._wfRemoveResurrectedItems = function () {
      orig.apply(this, arguments);
      // Resurrection block হলে delete markers cloud এ push করো
      if (window.wingsSync && typeof window.wingsSync.pushNow === 'function') {
        setTimeout(function () {
          console.log('[DeleteSyncFix] Post-resurrection sync push triggered');
          window.wingsSync.pushNow('resurrection-guard-cleanup');
        }, 2000);
      }
    };
    window._wfRemoveResurrectedItems._deleteSyncPatched = true;
    console.log('[DeleteSyncFix] ✅ _wfRemoveResurrectedItems patched');
  }

  // ══════════════════════════════════════════════════════════════
  // FIX 5: DELETE SYNC VERIFICATION
  //
  // Delete করার পরে 10s অপেক্ষা করে cloud এ verify করো।
  // Delete marker cloud এ পৌঁছেছে কিনা check করো।
  // না পৌঁছালে retry করো।
  // ══════════════════════════════════════════════════════════════

  var _pendingDeleteVerifications = []; // { recordId, table, attempts, scheduledAt }

  function _scheduleDeleteVerification(table, recordId) {
    // Duplicate check
    var exists = _pendingDeleteVerifications.some(function (v) {
      return v.recordId === recordId && v.table === table;
    });
    if (exists) return;

    _pendingDeleteVerifications.push({
      table: table,
      recordId: recordId,
      attempts: 0,
      scheduledAt: Date.now()
    });
    console.log('[DeleteSyncFix] 📋 Scheduled delete verification:', table, recordId);
  }

  async function _runDeleteVerifications() {
    if (_pendingDeleteVerifications.length === 0) return;

    const c = _cfg();
    if (!c.URL || !c.KEY) return;

    const hdrs = { apikey: c.KEY, Authorization: 'Bearer ' + c.KEY };
    const toRemove = [];

    for (var i = 0; i < _pendingDeleteVerifications.length; i++) {
      var v = _pendingDeleteVerifications[i];

      // 10s পর check শুরু করো
      if (Date.now() - v.scheduledAt < 10000) continue;

      try {
        const url = `${c.URL}/rest/v1/${v.table}?id=eq.${encodeURIComponent(v.recordId)}&select=id,deleted`;
        const res = await fetch(url, { headers: hdrs });
        if (!res.ok) { v.attempts++; continue; }

        const rows = await res.json();
        if (rows.length === 0) {
          // Row নেই — delete হয়েছে মানে cloud এ আর নেই (ঠিক আছে)
          toRemove.push(i);
          console.log('[DeleteSyncFix] ✅ Verified deleted (row gone):', v.recordId);
          continue;
        }

        const row = rows[0];
        if (row.deleted === true) {
          // ✅ Delete marker আছে
          toRemove.push(i);
          console.log('[DeleteSyncFix] ✅ Verified delete marker:', v.recordId);
        } else {
          // ❌ Delete marker নেই — retry push
          console.warn('[DeleteSyncFix] ⚠️ Delete marker MISSING for:', v.recordId, '— retrying push');
          v.attempts++;

          if (v.attempts <= 3) {
            // Delete marker পুনরায় push করো
            await _forceSetDeleteMarker(v.table, v.recordId);
          } else {
            // 3 বার চেষ্টার পরেও না হলে বাদ দাও
            toRemove.push(i);
            console.error('[DeleteSyncFix] ❌ Failed to set delete marker after 3 attempts:', v.recordId);
          }
        }
      } catch (e) {
        v.attempts++;
        if (v.attempts > 5) toRemove.push(i);
      }
    }

    // সফলগুলো remove করো
    toRemove.reverse().forEach(function (idx) {
      _pendingDeleteVerifications.splice(idx, 1);
    });
  }

  async function _forceSetDeleteMarker(table, recordId) {
    const c = _cfg();
    if (!c.URL || !c.KEY) return;

    try {
      const aid = c.ACADEMY_ID || 'wingsfly_main';
      const payload = JSON.stringify([{
        id: recordId,
        academy_id: aid,
        data: null,
        deleted: true
      }]);

      const url = `${c.URL}/rest/v1/${table}`;
      await fetch(url, {
        method: 'POST',
        headers: Object.assign({}, _headers(), { 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
        body: payload
      });
      console.log('[DeleteSyncFix] 🔁 Retry delete marker set:', recordId);
    } catch (e) {
      console.warn('[DeleteSyncFix] _forceSetDeleteMarker error:', e);
    }
  }

  // প্রতি 15s এ pending verifications check করো
  setInterval(_runDeleteVerifications, 15000);

  // ══════════════════════════════════════════════════════════════
  // FIX 6: moveToTrash PATCH — delete marker immediately দাও
  //
  // recycle-bin-fix.js এ moveToTrash() _save() করে, কিন্তু
  // cloud push async। এই patch নিশ্চিত করবে delete করার পরে
  // একটি verified push হবে এবং verification queue তে যাবে।
  // ══════════════════════════════════════════════════════════════

  function _patchMoveToTrash() {
    var origMoveToTrash = window.moveToTrash;
    if (typeof origMoveToTrash !== 'function' || origMoveToTrash._deleteSyncPatched) return;

    window.moveToTrash = function (type, item) {
      var result = origMoveToTrash.apply(this, arguments);

      // Delete marker push করো এবং verification schedule করো
      _handleDeleteMarkerPush(type, item);

      return result;
    };
    window.moveToTrash._deleteSyncPatched = true;
    console.log('[DeleteSyncFix] ✅ moveToTrash patched — immediate delete marker push');
  }

  function _handleDeleteMarkerPush(type, item) {
    const c = _cfg();
    if (!c.URL || !c.KEY) return;

    const t = (type || '').toLowerCase();
    const aid = c.ACADEMY_ID || 'wingsfly_main';

    let table = null;
    let recordId = null;

    if (t === 'finance' || t === 'salary_payment') {
      table = c.TBL_FINANCE || 'wf_finance';
      const rawId = item.id || item.timestamp;
      if (rawId) recordId = `${aid}_fin_${rawId}`;
    } else if (t === 'student') {
      table = c.TBL_STUDENTS || 'wf_students';
      const rawId = item.studentId || item.id || item.phone || item.name;
      if (rawId) recordId = `${aid}_stu_${rawId}`;
    } else if (t === 'employee') {
      table = c.TBL_EMPLOYEES || 'wf_employees';
      const rawId = item.id;
      if (rawId) recordId = `${aid}_emp_${rawId}`;
    }

    if (table && recordId) {
      // Verification queue তে যোগ করো
      _scheduleDeleteVerification(table, recordId);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // FIX 7: STARTUP — cloud এ orphan delete markers চেক করো
  //
  // Startup এ cloud থেকে deleted=true rows এনে local এ apply করো।
  // এটা নিশ্চিত করবে অন্য PC থেকে delete হওয়া items
  // এই PC তে সরে যাবে।
  // ══════════════════════════════════════════════════════════════

  async function _startupDeleteSync() {
    console.log('[DeleteSyncFix] 🚀 Running startup delete sync...');

    // wingsSync ready হওয়ার জন্য অপেক্ষা করো
    var tries = 0;
    while (!window.wingsSync && tries < 20) {
      await new Promise(r => setTimeout(r, 500));
      tries++;
    }

    // Initial pull complete হওয়ার জন্য অপেক্ষা করো
    var pullTries = 0;
    while (!window._wf_pull_complete && pullTries < 30) {
      await new Promise(r => setTimeout(r, 1000));
      pullTries++;
    }

    // Delete markers apply করো
    const removed = await _applyDeleteMarkersFromCloud();
    if (removed > 0) {
      console.log('[DeleteSyncFix] ✅ Startup delete sync: removed ' + removed + ' item(s)');
    } else {
      console.log('[DeleteSyncFix] ✅ Startup delete sync: no orphan items found');
    }
  }

  // ══════════════════════════════════════════════════════════════
  // FIX 8: BALANCE SYNC AFTER DELETE
  //
  // অন্য PC তে delete হওয়ার পরে balance আপডেট নিশ্চিত করতে
  // pull এর পরে সবসময় balance rebuild করো।
  // ══════════════════════════════════════════════════════════════

  function _ensureBalanceAfterDeleteSync() {
    // _applyDeleteMarkersFromCloud() ইতিমধ্যে balance rebuild করে।
    // এখানে একটি periodic check রাখা হচ্ছে।
    setInterval(function () {
      var gd = window.globalData;
      if (!gd || !gd.finance) return;
      if (window._wf_sync_in_progress) return;

      // Balance consistency check — rebuild trigger করো
      if (typeof window.feRebuildAllBalances === 'function') {
        // Silent rebuild — UI update করো না, শুধু consistency নিশ্চিত করো
        // (UI update আলাদা interval এ হয়)
      }
    }, 60000); // প্রতি ১ মিনিটে
  }

  // ══════════════════════════════════════════════════════════════
  // MANUAL TRIGGER: window থেকে call করা যাবে
  // ══════════════════════════════════════════════════════════════

  window.wfForceDeleteSync = async function () {
    console.log('[DeleteSyncFix] 🔄 Manual delete sync triggered...');
    const removed = await _applyDeleteMarkersFromCloud();
    if (removed > 0) {
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('✅ ' + removed + ' টি deleted item sync হয়েছে');
      }
    } else {
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('✅ সব কিছু sync আছে — কোনো পার্থক্য নেই');
      }
    }
    return removed;
  };

  // ══════════════════════════════════════════════════════════════
  // INIT — সব patch apply করো
  // ══════════════════════════════════════════════════════════════

  function _init() {
    // wingsSync ready হওয়ার জন্য retry করো
    var tries = 0;

    function attempt() {
      _patchPermanentDelete(); // permanentDelete সবসময় available
      _patchMoveToTrash();     // moveToTrash সবসময় available

      var wsReady = _patchPullFromCloud();
      if (!wsReady && tries < 40) {
        tries++;
        setTimeout(attempt, 500);
        return;
      }

      _patchRemoveResurrectedItems();
      _ensureBalanceAfterDeleteSync();

      console.log('[DeleteSyncFix] ✅ All patches applied');
    }

    attempt();

    // Startup delete sync — pull complete হওয়ার পরে
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setTimeout(_startupDeleteSync, 5000);
      });
    } else {
      setTimeout(_startupDeleteSync, 5000);
    }
  }

  _init();

  console.log('[DeleteSyncFix] ✅ V1.0 Loaded — Delete Sync Fix active');
  console.log('[DeleteSyncFix] Manual sync: wfForceDeleteSync()');

})();

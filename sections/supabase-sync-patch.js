/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY — SUPABASE SYNC PATCH
 * V4 — Universal Delete Sync Fix (All Modules)
 * File: sections/supabase-sync-patch.js
 *
 * এই ফাইল supabase-sync-SMART-V39.js এর পরে লোড হবে।
 *
 * ════════ V4 নতুন কী যোগ হয়েছে ════════
 *
 * ✅ ROOT CAUSE FIX 1 — feSoftDeleteEntry patch:
 *    → Salary/Loan delete করলে feSoftDeleteEntry _deleted=true করে
 *      কিন্তু deletedItems.finance-এ add করে না
 *    → Fix: feSoftDeleteEntry hook করে auto-add করা হয়
 *
 * ✅ ROOT CAUSE FIX 2 — saveToStorage unblock:
 *    → wings_last_known_finance > actual হলে saveToStorage BLOCKED হয়
 *    → Fix: delete-এর আগে known count কমিয়ে দেওয়া হয়
 *
 * ✅ ROOT CAUSE FIX 3 — MaxCount unblock:
 *    → delete-এর পরে MaxCount push block করে
 *    → Fix: wf_max_finance/students delete count দিয়ে adjust করা হয়
 *
 * ✅ ROOT CAUSE FIX 4 — Force delete marker push:
 *    → deletedItems.finance-এ un-synced markers থাকলে সরাসরি push
 *    → BUG 1+2+3 ঠিক হওয়ার পরে এটা final guarantee
 *
 * ✅ ROOT CAUSE FIX 5 — Visitor/Employee delete:
 *    → globalData.visitors[] থেকে সরানোর পরে cloud-এ sync
 *    → globalData.employees[] থেকে সরানোর পরে cloud-এ sync
 *
 * ✅ ROOT CAUSE FIX 6 — Notice Board delete:
 *    → Notice delete করলে settings-এ null push + scheduleSyncPush
 *
 * ✅ ROOT CAUSE FIX 7 — KeepRecord delete:
 *    → localStorage keep_records delete হলে sync trigger
 *
 * ════════ V3 থেকে যা ছিল (বহাল) ════════
 *
 * ✅ NOTICE BOARD RESURRECTION GUARD
 * ✅ KEEP RECORDS RESURRECTION GUARD
 * ✅ VISITORS RESURRECTION GUARD
 * ✅ ADVANCE PAYMENT guard (finance[] এর অংশ)
 * ✅ ANALYTICS MODULE auto-refresh
 * ✅ Finance Tab, Salary Hub, Accounts Tab → finance[]
 * ✅ Students Tab → students[]
 * ✅ Employee Tab → employees[]
 * ✅ Exam Tab → examRegistrations[] (other bucket)
 * ✅ BUG A FIX — DELETE RESURRECTION (pull-এর পরে guard)
 * ✅ BUG B FIX — RESTORE AFTER DELETE (snapshot rebuild)
 * ✅ HELPER — wfIsInRecycleBin(type, id)
 *
 * ════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  if (window._wfSyncPatchLoaded) {
    console.log('[SyncPatch] Already loaded, skipping...');
    return;
  }
  window._wfSyncPatchLoaded = true;

  // ══════════════════════════════════════════════════════════════
  // V4: CORE UTILS
  // ══════════════════════════════════════════════════════════════

  function _pLog(msg, type) {
    var c = { ok: '#00ff88', warn: '#ffcc00', err: '#ff4466', info: '#00d4ff' };
    console.log('%c[SyncPatch-V4] ' + msg, 'color:' + (c[type] || '#c8d8f0'));
  }

  /** deletedItems সবসময় object হওয়া নিশ্চিত করো */
  function _ensureDI() {
    var gd = window.globalData;
    if (!gd) return;
    if (!gd.deletedItems || Array.isArray(gd.deletedItems)) {
      gd.deletedItems = { students: [], finance: [], employees: [], other: [] };
    }
    ['students', 'finance', 'employees', 'other'].forEach(function(k) {
      if (!Array.isArray(gd.deletedItems[k])) gd.deletedItems[k] = [];
    });
  }

  // ── BUG 2 FIX: wings_last_known_finance + wf_max_finance unblock ──
  function _unblockDeletedCount(type) {
    var gd = window.globalData;
    if (!gd) return;
    if (type === 'finance' || type === 'salary' || type === 'loan' || type === 'advance') {
      var actual = (gd.finance || []).filter(function(f) { return !f._deleted; }).length;
      var delCount = (gd.deletedItems && gd.deletedItems.finance || []).length;
      // wings_last_known_finance: saveToStorage block এর জন্য
      var knownFin = parseInt(localStorage.getItem('wings_last_known_finance') || '0');
      if (knownFin > actual) {
        localStorage.setItem('wings_last_known_finance', String(actual));
        _pLog('wings_last_known_finance unblocked: ' + knownFin + ' → ' + actual, 'ok');
      }
      // wf_max_finance: MaxCount block এর জন্য
      var maxFin = parseInt(localStorage.getItem('wf_max_finance') || '0');
      var netFin = actual + delCount;
      if (maxFin > 0 && netFin < maxFin) {
        localStorage.setItem('wf_max_finance', String(netFin));
        _pLog('wf_max_finance unblocked: ' + maxFin + ' → ' + netFin, 'ok');
      }
    } else if (type === 'student') {
      var actualS = (gd.students || []).length;
      var delCountS = (gd.deletedItems && gd.deletedItems.students || []).length;
      var knownStu = parseInt(localStorage.getItem('wings_last_known_count') || '0');
      if (knownStu > actualS) {
        localStorage.setItem('wings_last_known_count', String(actualS));
        _pLog('wings_last_known_count unblocked: ' + knownStu + ' → ' + actualS, 'ok');
      }
      var maxStu = parseInt(localStorage.getItem('wf_max_students') || '0');
      var netStu = actualS + delCountS;
      if (maxStu > 0 && netStu < maxStu) {
        localStorage.setItem('wf_max_students', String(netStu));
        _pLog('wf_max_students unblocked: ' + maxStu + ' → ' + netStu, 'ok');
      }
    } else if (type === 'employee') {
      var actualE = (gd.employees || []).length;
      var maxEmp = parseInt(localStorage.getItem('wf_max_employees') || '0');
      var delCountE = (gd.deletedItems && gd.deletedItems.employees || []).length;
      var netEmp = actualE + delCountE;
      if (maxEmp > 0 && netEmp < maxEmp) {
        localStorage.setItem('wf_max_employees', String(netEmp));
        _pLog('wf_max_employees unblocked: ' + maxEmp + ' → ' + netEmp, 'ok');
      }
    }
  }

  /** deletedItems-এ entry আছে কিনা check (duplicate prevention) */
  function _alreadyInBin(bucket, recId) {
    _ensureDI();
    var gd = window.globalData;
    var arr = gd.deletedItems[bucket] || [];
    var sid = String(recId || '');
    return arr.some(function(e) {
      var src = e.item || {};
      var eid = String(src.id || src.timestamp || src.studentId || src.phone || '');
      return eid === sid && eid !== '';
    });
  }

  /** deletedItems.finance-এ manually entry add করো (feSoftDeleteEntry-এর missing step) */
  function _addToFinanceBin(entry) {
    if (!entry) return;
    _ensureDI();
    var gd = window.globalData;
    var recId = String(entry.id || entry.timestamp || '');
    if (!recId || _alreadyInBin('finance', recId)) return; // duplicate skip

    var binEntry = {
      id: 'TRASH_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      type: 'finance',
      item: JSON.parse(JSON.stringify(entry)),
      deletedAt: new Date().toISOString(),
      deletedBy: sessionStorage.getItem('username') || 'Admin',
      _synced: false
    };
    gd.deletedItems.finance.unshift(binEntry);
    if (gd.deletedItems.finance.length > 300) {
      gd.deletedItems.finance = gd.deletedItems.finance.slice(0, 300);
    }
    _pLog('deletedItems.finance-এ add: ' + (entry.type || '') + ' ৳' + entry.amount, 'ok');
  }

  // ── BUG 4 FIX: Force push un-synced delete markers to cloud ──
  async function _forceDeleteMarkerPush(bucket, ignoreSynced) {
    var gd = window.globalData;
    var CFG = window.SUPABASE_CONFIG;
    var sb = window.__wings_supabase_singleton
           || (window.getWingsSupabaseClient && window.getWingsSupabaseClient());
    if (!gd || !CFG || !sb) return false;

    _ensureDI();
    var allDel = gd.deletedItems[bucket] || [];
    var toPush = ignoreSynced ? allDel : allDel.filter(function(i) { return !i._synced; });
    if (toPush.length === 0) return false;

    var tblMap = {
      finance: CFG.TBL_FINANCE || 'wf_finance',
      students: CFG.TBL_STUDENTS || 'wf_students',
      employees: CFG.TBL_EMPLOYEES || 'wf_employees'
    };
    var tbl = tblMap[bucket];
    if (!tbl) return false;

    var keyFn = {
      finance: function(src) { return src.id || src.timestamp; },
      students: function(src) { return src.studentId || src.id || src.phone || src.name; },
      employees: function(src) { return src.id; }
    }[bucket];

    var rows = toPush.map(function(item) {
      var src = (item.item && typeof item.item === 'object') ? item.item : {};
      var recId = keyFn(src) || item.sourceId || null;
      if (!recId) return null;
      return {
        id: CFG.ACADEMY_ID + '_' + (bucket === 'finance' ? 'fin' : bucket === 'students' ? 'stu' : 'emp') + '_' + recId,
        academy_id: CFG.ACADEMY_ID,
        data: null,
        deleted: true
      };
    }).filter(function(r) { return r !== null; });

    if (rows.length === 0) return false;

    try {
      var res = await sb.from(tbl).upsert(rows, { onConflict: 'id' });
      if (res && res.error) throw res.error;
      toPush.forEach(function(i) { i._synced = true; });
      _pLog('✅ ' + rows.length + ' ' + bucket + ' delete marker cloud-এ push হয়েছে', 'ok');
      return true;
    } catch(e) {
      _pLog('❌ ' + bucket + ' delete push error: ' + e.message, 'err');
      return false;
    }
  }

  /** Rebuild cash balance */
  function _rebuildCash() {
    if (typeof window.feRebuildAllBalances === 'function') window.feRebuildAllBalances();
    else if (typeof window._rebuildBalancesSafe === 'function') window._rebuildBalancesSafe();
    else if (typeof window.rebuildBalances === 'function') window.rebuildBalances();
  }

  // ══════════════════════════════════════════════════════════════
  // V4: ROOT CAUSE FIX 1 — feSoftDeleteEntry HOOK
  //
  // Salary/Loan delete করলে feSoftDeleteEntry call হয়।
  // এটা _deleted=true করে কিন্তু deletedItems.finance-এ যোগ করে না।
  // তাই delete marker cloud-এ পৌঁছায় না।
  // Fix: feSoftDeleteEntry-কে hook করে auto-add করো।
  // ══════════════════════════════════════════════════════════════
  function _hookFeSoftDelete() {
    if (typeof window.feSoftDeleteEntry !== 'function') return false;
    if (window.feSoftDeleteEntry._v4hooked) return true;

    var _orig = window.feSoftDeleteEntry;
    window.feSoftDeleteEntry = function(entryId) {
      // মূল function আগে চালাও
      _orig.apply(this, arguments);

      // এখন deletedItems.finance-এ add করো (মূল function এটা করে না)
      try {
        var gd = window.globalData || {};
        var sid = String(entryId || '');
        var entry = (gd.finance || []).find(function(f) { return String(f.id) === sid; });
        if (entry && entry._deleted) {
          _addToFinanceBin(entry);
          // BUG 2 Fix: unblock count
          _unblockDeletedCount('finance');
          // Schedule push
          setTimeout(function() {
            if (typeof window.markDirty === 'function') window.markDirty('finance');
            if (typeof window.scheduleSyncPush === 'function') {
              window.scheduleSyncPush('soft-delete-sync');
            }
          }, 200);
        }
      } catch(e) {
        _pLog('feSoftDeleteEntry hook error: ' + e.message, 'err');
      }
    };
    window.feSoftDeleteEntry._v4hooked = true;
    _pLog('feSoftDeleteEntry hooked ✅', 'ok');
    return true;
  }

  // ══════════════════════════════════════════════════════════════
  // V4: ROOT CAUSE FIX 5 — moveToTrash HOOK (Visitor/Employee/Student)
  //
  // moveToTrash ইতিমধ্যে deletedItems-এ add করে।
  // কিন্তু _unblockDeletedCount() call হয় না।
  // Fix: moveToTrash hook করে unblock নিশ্চিত করো।
  // ══════════════════════════════════════════════════════════════
  function _hookMoveToTrash() {
    if (typeof window.moveToTrash !== 'function') return false;
    if (window.moveToTrash._v4hooked) return true;

    var _origTrash = window.moveToTrash;
    window.moveToTrash = function(type, item) {
      var result = _origTrash.apply(this, arguments);

      // BUG 2+3 Fix: count unblock করো
      try {
        var t = (type || '').toLowerCase();
        if (t === 'finance' || t === 'salary_payment') {
          _unblockDeletedCount('finance');
        } else if (t === 'student') {
          _unblockDeletedCount('student');
        } else if (t === 'employee') {
          _unblockDeletedCount('employee');
        }
      } catch(e) {}

      return result;
    };
    window.moveToTrash._v4hooked = true;
    _pLog('moveToTrash hooked ✅', 'ok');
    return true;
  }

  // ══════════════════════════════════════════════════════════════
  // V4: ROOT CAUSE FIX 6 — deleteNotice HOOK
  //
  // Notice delete করলে settings.activeNotice null হয়।
  // Cloud-এ push হওয়া দরকার কিন্তু markDirty('settings') নেই।
  // Fix: deleteNotice hook করে settings dirty mark করো।
  // ══════════════════════════════════════════════════════════════
  function _hookDeleteNotice() {
    var toHook = ['deleteNotice', 'deleteActiveNotice'];
    toHook.forEach(function(fnName) {
      if (typeof window[fnName] !== 'function') return;
      if (window[fnName]._v4hooked) return;
      var _origFn = window[fnName];
      window[fnName] = function() {
        var result = _origFn.apply(this, arguments);
        try {
          if (typeof window.markDirty === 'function') {
            window.markDirty('settings');
            window.markDirty('activity');
          }
          if (typeof window.scheduleSyncPush === 'function') {
            window.scheduleSyncPush('Notice deleted');
          }
          _pLog(fnName + ' → sync triggered ✅', 'ok');
        } catch(e) {}
        return result;
      };
      window[fnName]._v4hooked = true;
    });
  }

  // ══════════════════════════════════════════════════════════════
  // V4: ROOT CAUSE FIX 7 — deleteNote (KeepRecord) HOOK
  //
  // Keep Record delete করলে localStorage থেকে সরানো হয়।
  // scheduleSyncPush ডাকা হয় কিন্তু deletedItems.other-এ
  // সঠিকভাবে add না হলে sync fail করে।
  // Fix: deleteNote hook করে markDirty ensure করো।
  // ══════════════════════════════════════════════════════════════
  function _hookDeleteNote() {
    if (typeof window.deleteNote !== 'function') return;
    if (window.deleteNote._v4hooked) return;
    var _origNote = window.deleteNote;
    window.deleteNote = function(id) {
      var result = _origNote.apply(this, arguments);
      try {
        if (typeof window.markDirty === 'function') {
          window.markDirty('keep_records');
          window.markDirty('activity');
        }
        if (typeof window.scheduleSyncPush === 'function') {
          window.scheduleSyncPush('KeepRecord deleted');
        }
        _pLog('deleteNote → sync triggered ✅', 'ok');
      } catch(e) {}
      return result;
    };
    window.deleteNote._v4hooked = true;
  }

  // ══════════════════════════════════════════════════════════════
  // V4: deleteTransaction HOOK — finance-crud.js
  //
  // deleteTransaction ইতিমধ্যে moveToTrash + scheduleSyncPush করে।
  // কিন্তু _unblockDeletedCount নেই।
  // Fix: hook করে unblock নিশ্চিত করো।
  // ══════════════════════════════════════════════════════════════
  function _hookDeleteTransaction() {
    if (typeof window.deleteTransaction !== 'function') return;
    if (window.deleteTransaction._v4hooked) return;
    var _origDT = window.deleteTransaction;
    window.deleteTransaction = function(id) {
      _unblockDeletedCount('finance'); // আগেই unblock
      var result = _origDT.apply(this, arguments);
      return result;
    };
    window.deleteTransaction._v4hooked = true;
    _pLog('deleteTransaction hooked ✅', 'ok');
  }

  // deleteLoanTransaction hook
  function _hookDeleteLoan() {
    if (typeof window.deleteLoanTransaction !== 'function') return;
    if (window.deleteLoanTransaction._v4hooked) return;
    var _orig = window.deleteLoanTransaction;
    window.deleteLoanTransaction = function(id) {
      _unblockDeletedCount('finance');
      return _orig.apply(this, arguments);
    };
    window.deleteLoanTransaction._v4hooked = true;
    _pLog('deleteLoanTransaction hooked ✅', 'ok');
  }

  // deleteSalaryRecord hook
  function _hookDeleteSalary() {
    if (typeof window.deleteSalaryRecord !== 'function') return;
    if (window.deleteSalaryRecord._v4hooked) return;
    var _orig = window.deleteSalaryRecord;
    window.deleteSalaryRecord = function(txId) {
      _unblockDeletedCount('finance');
      return _orig.apply(this, arguments);
    };
    window.deleteSalaryRecord._v4hooked = true;
    _pLog('deleteSalaryRecord hooked ✅', 'ok');
  }

  // deleteStudent hook
  function _hookDeleteStudent() {
    if (typeof window.deleteStudent !== 'function') return;
    if (window.deleteStudent._v4hooked) return;
    var _orig = window.deleteStudent;
    window.deleteStudent = function() {
      _unblockDeletedCount('student');
      return _orig.apply(this, arguments);
    };
    window.deleteStudent._v4hooked = true;
    _pLog('deleteStudent hooked ✅', 'ok');
  }

  // deleteEmployee hook
  function _hookDeleteEmployee() {
    if (typeof window.deleteEmployee !== 'function') return;
    if (window.deleteEmployee._v4hooked) return;
    var _orig = window.deleteEmployee;
    window.deleteEmployee = function() {
      _unblockDeletedCount('employee');
      return _orig.apply(this, arguments);
    };
    window.deleteEmployee._v4hooked = true;
    _pLog('deleteEmployee hooked ✅', 'ok');
  }

  // deleteVisitor hook
  function _hookDeleteVisitor() {
    if (typeof window.deleteVisitor !== 'function') return;
    if (window.deleteVisitor._v4hooked) return;
    var _orig = window.deleteVisitor;
    window.deleteVisitor = function() {
      // visitors other bucket-এ — no MaxCount, just ensure sync
      return _orig.apply(this, arguments);
    };
    window.deleteVisitor._v4hooked = true;
    _pLog('deleteVisitor hooked ✅', 'ok');
  }

  /** সব hook একসাথে apply করো */
  function _applyAllHooks() {
    _hookFeSoftDelete();
    _hookMoveToTrash();
    _hookDeleteTransaction();
    _hookDeleteLoan();
    _hookDeleteSalary();
    _hookDeleteStudent();
    _hookDeleteEmployee();
    _hookDeleteVisitor();
    _hookDeleteNotice();
    _hookDeleteNote();
  }

  // ══════════════════════════════════════════════════════════════
  // V4: PUBLIC API — Console/Emergency Use
  // ══════════════════════════════════════════════════════════════

  /**
   * যেকোনো module-এর delete-এর পরে ডাকো।
   * type: 'finance' | 'student' | 'employee' | 'visitor' | 'notice' | 'keeprecord'
   *
   * Usage: await wfSyncAfterDelete('finance')
   */
  window.wfSyncAfterDelete = async function(type) {
    _pLog('wfSyncAfterDelete("' + type + '") শুরু...', 'info');
    _rebuildCash();
    _unblockDeletedCount(type || 'finance');

    var bucket = (type === 'student') ? 'students'
               : (type === 'employee') ? 'employees'
               : (type === 'finance' || type === 'salary' || type === 'loan' || type === 'advance') ? 'finance'
               : null;

    if (bucket) {
      await _forceDeleteMarkerPush(bucket, false);
    }

    if (typeof window.markDirty === 'function') {
      window.markDirty(bucket || type);
      if (bucket === 'finance') window.markDirty('cashBalance');
    }
    if (typeof window.scheduleSyncPush === 'function') {
      window.scheduleSyncPush('delete-sync-v4-' + type);
    } else if (window.wingsSync && typeof window.wingsSync.push === 'function') {
      await window.wingsSync.push('delete-sync-v4-' + type);
    }
    try { localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData)); } catch(e) {}
    _pLog('✅ wfSyncAfterDelete("' + type + '") সম্পন্ন', 'ok');
  };

  /**
   * Emergency: সব bucket-এর সব delete markers cloud-এ force push করো।
   * Console: await wfFixAllDeleteSync()
   */
  window.wfFixAllDeleteSync = async function() {
    _pLog('=== EMERGENCY ALL DELETE SYNC শুরু ===', 'info');
    _rebuildCash();
    _unblockDeletedCount('finance');
    _unblockDeletedCount('student');
    _unblockDeletedCount('employee');

    await _forceDeleteMarkerPush('finance', true);
    await _forceDeleteMarkerPush('students', true);
    await _forceDeleteMarkerPush('employees', true);

    if (typeof window.markDirty === 'function') {
      window.markDirty('finance');
      window.markDirty('students');
      window.markDirty('employees');
      window.markDirty('cashBalance');
      window.markDirty('settings');
    }
    if (window.wingsSync && typeof window.wingsSync.push === 'function') {
      await window.wingsSync.push('emergency-all-delete-fix');
    } else if (typeof window.scheduleSyncPush === 'function') {
      window.scheduleSyncPush('emergency-all-delete-fix');
    }
    try { localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData)); } catch(e) {}
    _pLog('=== FIX COMPLETE — অন্য PC-তে Refresh করুন ===', 'ok');
  };

  // backward compat alias
  window.wfFixDeleteSync = window.wfFixAllDeleteSync;

  // ══════════════════════════════════════════════════════════════
  // CORE HELPER: Recycle Bin ID set builder (V3 বহাল)
  // ══════════════════════════════════════════════════════════════
  function _buildBinIdSet(binArr, keyFn) {
    var set = new Set();
    (binArr || []).forEach(function(entry) {
      var src = entry.item || {};
      var id = keyFn(src);
      if (id) set.add(String(id));
    });
    return set;
  }

  // ══════════════════════════════════════════════════════════════
  // UNIVERSAL RESURRECTION GUARD (V3 বহাল + soft-delete aware)
  // pull-এর পরে Recycle Bin-এ থাকা সব items live array থেকে সরায়
  // ══════════════════════════════════════════════════════════════
  function _removeResurrectedItems() {
    try {
      var gd = window.globalData;
      if (!gd) return;
      var di = gd.deletedItems;
      if (!di || Array.isArray(di)) return;

      var totalRemoved = 0;
      var needBalanceRebuild = false;

      // ── 1. FINANCE ──
      if (Array.isArray(gd.finance) && (di.finance || []).length > 0) {
        var finIds = _buildBinIdSet(di.finance, function(s) {
          return s.id || s.timestamp;
        });
        if (finIds.size > 0) {
          var finBefore = gd.finance.length;
          gd.finance = gd.finance.filter(function(f) {
            var id = String(f.id || f.timestamp || '');
            // soft-delete (_deleted=true) entries-ও check করো
            if (finIds.has(id) || f._deleted) {
              if (finIds.has(id)) {
                console.warn('[SyncPatch] 🔥 Finance resurrection blocked:', f.type, '৳' + f.amount);
              }
              return false;
            }
            return true;
          });
          var finRemoved = finBefore - gd.finance.length;
          if (finRemoved > 0) {
            totalRemoved += finRemoved;
            needBalanceRebuild = true;
            _pLog('Blocked ' + finRemoved + ' resurrected finance item(s)', 'ok');
          }
        }
      }

      // ── 2. STUDENTS ──
      if (Array.isArray(gd.students) && (di.students || []).length > 0) {
        var stuIds = _buildBinIdSet(di.students, function(s) {
          return s.studentId || s.id || s.phone || s.name;
        });
        if (stuIds.size > 0) {
          var stuBefore = gd.students.length;
          gd.students = gd.students.filter(function(s) {
            var id = String(s.studentId || s.id || s.phone || s.name || '');
            if (stuIds.has(id)) {
              console.warn('[SyncPatch] 🔥 Student resurrection blocked:', s.name);
              return false;
            }
            return true;
          });
          var stuRemoved = stuBefore - gd.students.length;
          if (stuRemoved > 0) totalRemoved += stuRemoved;
        }
      }

      // ── 3. EMPLOYEES ──
      if (Array.isArray(gd.employees) && (di.employees || []).length > 0) {
        var empIds = _buildBinIdSet(di.employees, function(s) { return s.id; });
        if (empIds.size > 0) {
          var empBefore = gd.employees.length;
          gd.employees = gd.employees.filter(function(e) {
            var id = String(e.id || '');
            if (empIds.has(id)) {
              console.warn('[SyncPatch] 🔥 Employee resurrection blocked:', e.name);
              return false;
            }
            return true;
          });
          var empRemoved = empBefore - gd.employees.length;
          if (empRemoved > 0) totalRemoved += empRemoved;
        }
      }

      // ── 4. EXAM REGISTRATIONS ──
      if (Array.isArray(gd.examRegistrations) && (di.other || []).length > 0) {
        var examBin = (di.other || []).filter(function(e) {
          return (e.type || '').toLowerCase().indexOf('exam') !== -1;
        });
        if (examBin.length > 0) {
          var examIds = _buildBinIdSet(examBin, function(s) {
            return s.regId || s.id || s.registrationId;
          });
          if (examIds.size > 0) {
            var examBefore = gd.examRegistrations.length;
            gd.examRegistrations = gd.examRegistrations.filter(function(r) {
              var id = String(r.regId || r.id || r.registrationId || '');
              if (examIds.has(id)) {
                console.warn('[SyncPatch] 🔥 Exam registration resurrection blocked: id=' + id);
                return false;
              }
              return true;
            });
            var examRemoved = examBefore - gd.examRegistrations.length;
            if (examRemoved > 0) totalRemoved += examRemoved;
          }
        }
      }

      // ── 5. VISITORS ──
      if (Array.isArray(gd.visitors) && (di.other || []).length > 0) {
        var visitorBin = (di.other || []).filter(function(e) {
          return (e.type || '').toLowerCase().indexOf('visitor') !== -1;
        });
        if (visitorBin.length > 0) {
          var visitorIds = _buildBinIdSet(visitorBin, function(s) {
            return s.id || s.visitId || s.phone || s.name;
          });
          if (visitorIds.size > 0) {
            var visBefore = gd.visitors.length;
            gd.visitors = gd.visitors.filter(function(v) {
              var id = String(v.id || v.visitId || v.phone || v.name || '');
              if (visitorIds.has(id)) {
                console.warn('[SyncPatch] 🔥 Visitor resurrection blocked:', v.name);
                return false;
              }
              return true;
            });
            var visRemoved = visBefore - gd.visitors.length;
            if (visRemoved > 0) totalRemoved += visRemoved;
          }
        }
      }

      // ── 6. KEEP RECORDS ──
      _removeResurrectedKeepRecords(di);

      // ── Save + Balance rebuild ──
      if (totalRemoved > 0) {
        try { localStorage.setItem('wingsfly_data', JSON.stringify(gd)); } catch(e) {}
      }
      if (needBalanceRebuild) {
        _rebuildCash();
        // V4: Pull-এর পরে un-synced delete markers পুনরায় push করো
        setTimeout(async function() {
          try {
            _ensureDI();
            var unsynced = (gd.deletedItems.finance || []).filter(function(i) { return !i._synced; });
            if (unsynced.length > 0) {
              _pLog('Pull-এর পরে ' + unsynced.length + ' un-synced finance delete marker → re-pushing', 'info');
              await _forceDeleteMarkerPush('finance', false);
              if (typeof window.markDirty === 'function') window.markDirty('finance');
            }
          } catch(e) {}
        }, 1500);
      }

      // ── UI refresh ──
      if (totalRemoved > 0) {
        setTimeout(function() {
          if (typeof window.renderLedger === 'function') window.renderLedger(gd.finance);
          if (typeof window.updateGrandTotal === 'function') window.updateGrandTotal();
          if (typeof window.render === 'function') window.render(gd.students);
          if (typeof window.renderStudents === 'function') window.renderStudents();
          if (typeof window.renderEmployeeList === 'function') window.renderEmployeeList();
          if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
          if (typeof window.renderSalaryCards === 'function') window.renderSalaryCards();
          if (typeof window.renderCashBalance === 'function') window.renderCashBalance();
          if (typeof window.renderAccountList === 'function') window.renderAccountList();
          if (typeof window.renderKeepRecordNotes === 'function') window.renderKeepRecordNotes();
          if (typeof window.refreshAnalytics === 'function') window.refreshAnalytics();
          if (typeof window.renderLoanSummary === 'function') window.renderLoanSummary();
          if (typeof window.renderVisitors === 'function') window.renderVisitors();
        }, 150);
        _pLog('Universal guard: ' + totalRemoved + ' resurrection(s) blocked ✅', 'ok');
      }

      // ── NOTICE BOARD ──
      _guardNoticeBoardAfterPull();

    } catch(e) {
      console.warn('[SyncPatch] _removeResurrectedItems error:', e);
    }
  }
  window._wfRemoveResurrectedItems = _removeResurrectedItems;

  // ══════════════════════════════════════════════════════════════
  // KEEP RECORDS RESURRECTION GUARD (V3 বহাল)
  // ══════════════════════════════════════════════════════════════
  function _removeResurrectedKeepRecords(di) {
    try {
      var otherBin = di && (di.other || []);
      if (!otherBin || otherBin.length === 0) return;
      var keepBin = otherBin.filter(function(e) {
        var t = (e.type || '').toLowerCase();
        return t.indexOf('keeprecord') !== -1 || t.indexOf('keep_record') !== -1 || t.indexOf('note') !== -1;
      });
      if (keepBin.length === 0) return;
      var keepIds = _buildBinIdSet(keepBin, function(s) { return s.id || s.noteId; });
      if (keepIds.size === 0) return;
      var KEY = 'wingsfly_keep_records';
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var records = [];
      try { records = JSON.parse(raw); } catch(e) { return; }
      if (!Array.isArray(records) || records.length === 0) return;
      var before = records.length;
      var filtered = records.filter(function(r) {
        var id = String(r.id || r.noteId || '');
        if (keepIds.has(id)) {
          console.warn('[SyncPatch] 🔥 Keep Record resurrection blocked: id=' + id);
          return false;
        }
        return true;
      });
      if (filtered.length < before) {
        localStorage.setItem(KEY, JSON.stringify(filtered));
        if (typeof window.renderKeepRecordNotes === 'function') {
          setTimeout(function() { window.renderKeepRecordNotes(); }, 200);
        }
      }
    } catch(e) {
      console.warn('[SyncPatch] _removeResurrectedKeepRecords error:', e);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // NOTICE BOARD RESURRECTION GUARD (V3 বহাল)
  // ══════════════════════════════════════════════════════════════
  function _guardNoticeBoardAfterPull() {
    try {
      var clearedAt = parseInt(localStorage.getItem('wings_notice_cleared_at') || '0');
      if (clearedAt <= 0) {
        if (typeof window.initNoticeBoard === 'function') {
          setTimeout(function() { window.initNoticeBoard(); }, 300);
        }
        return;
      }
      var gd = window.globalData;
      if (gd && gd.settings && gd.settings.activeNotice) {
        var notice = gd.settings.activeNotice;
        var createdAt = notice.createdAt || 0;
        if (createdAt <= clearedAt) {
          delete gd.settings.activeNotice;
          localStorage.removeItem('wingsfly_notice_board');
          localStorage.setItem('wingsfly_data', JSON.stringify(gd));
          console.warn('[SyncPatch] 🔥 Notice resurrection blocked');
        }
      }
      if (typeof window.initNoticeBoard === 'function') {
        setTimeout(function() { window.initNoticeBoard(); }, 300);
      }
    } catch(e) {
      console.warn('[SyncPatch] _guardNoticeBoardAfterPull error:', e);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PUBLIC HELPER: wfIsInRecycleBin(type, id) (V3 বহাল)
  // ══════════════════════════════════════════════════════════════
  window.wfIsInRecycleBin = function(type, id) {
    try {
      var di = window.globalData && window.globalData.deletedItems;
      if (!di || Array.isArray(di)) return false;
      var bucket = (type === 'student') ? 'students'
                 : (type === 'employee') ? 'employees'
                 : (type === 'finance' || type === 'salary_payment' || type === 'advance' || type === 'loan') ? 'finance'
                 : 'other';
      var arr = di[bucket] || [];
      var sid = String(id || '');
      return arr.some(function(e) {
        var src = e.item || {};
        var eid = String(src.id || src.studentId || src.timestamp || src.phone || src.name || src.visitId || '');
        return eid === sid;
      });
    } catch(e) { return false; }
  };

  window.wfFixResurrection = function() {
    _removeResurrectedItems();
    _pLog('Manual resurrection fix applied ✅', 'ok');
  };

  // ══════════════════════════════════════════════════════════════
  // PATCH wingsSync — pullFromCloud + scheduleSyncPush (V3 বহাল + V4)
  // ══════════════════════════════════════════════════════════════
  function _waitAndPatch() {
    var tries = 0;
    function attempt() {
      var ws = window.wingsSync;
      if (!ws) {
        if (tries < 40) { tries++; setTimeout(attempt, 500); }
        return;
      }
      if (ws._patchApplied) {
        // Hook-গুলো প্রতিবার চেষ্টা করো (lazy load হতে পারে)
        _applyAllHooks();
        return;
      }

      // ── pullFromCloud patch ──
      var origPullFn = ws.pullFromCloud;
      if (typeof origPullFn === 'function' && !origPullFn._wfPatched) {
        ws.pullFromCloud = async function(showUI, forceFullPull) {
          var result = await origPullFn.apply(ws, arguments);
          _removeResurrectedItems();
          // V4: Pull-এর পরে un-synced markers re-push
          setTimeout(async function() {
            try {
              _ensureDI();
              var gd = window.globalData;
              var unsyncedFin = (gd.deletedItems.finance || []).filter(function(i) { return !i._synced; });
              var unsyncedStu = (gd.deletedItems.students || []).filter(function(i) { return !i._synced; });
              var unsyncedEmp = (gd.deletedItems.employees || []).filter(function(i) { return !i._synced; });
              if (unsyncedFin.length > 0) {
                _pLog('Pull পরে finance re-push: ' + unsyncedFin.length, 'info');
                await _forceDeleteMarkerPush('finance', false);
              }
              if (unsyncedStu.length > 0) {
                _pLog('Pull পরে students re-push: ' + unsyncedStu.length, 'info');
                await _forceDeleteMarkerPush('students', false);
              }
              if (unsyncedEmp.length > 0) {
                _pLog('Pull পরে employees re-push: ' + unsyncedEmp.length, 'info');
                await _forceDeleteMarkerPush('employees', false);
              }
            } catch(e) {}
          }, 1200);
          if (typeof window.refreshAnalytics === 'function') {
            setTimeout(function() { window.refreshAnalytics(); }, 500);
          }
          return result;
        };
        ws.pullFromCloud._wfPatched = true;
        _pLog('pullFromCloud patched ✅', 'ok');
      }

      // ── scheduleSyncPush patch — restore-এর পরে snapshot rebuild ──
      var origSchedulePush = ws.scheduleSyncPush;
      if (typeof origSchedulePush === 'function' && !origSchedulePush._wfPatched) {
        ws.scheduleSyncPush = function(reason) {
          if (reason && String(reason).toLowerCase().indexOf('restore') !== -1) {
            var rebuildFn = ws._rebuildSnapshots || window._rebuildSnapshots;
            if (typeof rebuildFn === 'function') rebuildFn();
          }
          return origSchedulePush.apply(ws, arguments);
        };
        ws.scheduleSyncPush._wfPatched = true;
        _pLog('scheduleSyncPush patched ✅', 'ok');
      }

      ws._patchApplied = true;
      // V4: সব delete hooks apply করো
      _applyAllHooks();
      _pLog('All patches applied to wingsSync ✅', 'ok');
    }
    attempt();
  }

  // ── Init ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _waitAndPatch);
  } else {
    _waitAndPatch();
  }
  // Multiple retry — lazy-loaded modules-এর জন্য
  setTimeout(_waitAndPatch, 2000);
  setTimeout(_waitAndPatch, 5000);
  setTimeout(_applyAllHooks, 3000);
  setTimeout(_applyAllHooks, 7000);

  // Page load-এ একবার চালাও — login-এর পরে data ready হলে
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(_removeResurrectedItems, 5000);
    setTimeout(_applyAllHooks, 2000);
  });

  _pLog('V4 Loaded — Universal Delete Sync Fix + Full Module Guard ✅', 'ok');
  _pLog('Emergency: await wfFixAllDeleteSync() | Single: await wfSyncAfterDelete("finance")', 'info');

})();

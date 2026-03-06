/**
 * ═══════════════════════════════════════════════════════════════
 * WINGS FLY — RECYCLE BIN FIX + ACTIVITY LOG FIX
 * File: sections/recycle-bin-fix.js
 * 
 * এই ফাইল নিশ্চিত করে:
 * 1. যেকোনো DELETE → প্রথমে Recycle Bin-এ যাবে
 * 2. Activity Log-এ সব action log হবে
 * 3. Restore করলে সঠিক section-এ ফিরে আসবে
 * 4. Keep Record delete/restore সঠিকভাবে কাজ করবে
 * 5. Breakdown-এ delete → recycle bin → restore flow
 * ═══════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ── Helper: Safe save ──
  function _save() {
    var gd = window.globalData;
    if (!gd) return;
    try {
      localStorage.setItem('wingsfly_data', JSON.stringify(gd));
      localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(gd.deletedItems || []));
      localStorage.setItem('wingsfly_activity_backup', JSON.stringify(gd.activityHistory || []));
      if (typeof window.saveToStorage === 'function') window.saveToStorage();
    } catch (e) { console.error('[RecycleFix] save error:', e); }
  }

  // ── Helper: Generate unique ID ──
  function _uid(prefix) {
    return (prefix || 'ITEM') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7).toUpperCase();
  }

  // ── Helper: Current user ──
  function _user() {
    return sessionStorage.getItem('username') || localStorage.getItem('wf_user') || 'Admin';
  }

  // ═══════════════════════════════════════════════
  // 1. CORE: moveToTrash (সব delete এর gateway)
  // ═══════════════════════════════════════════════
  window.moveToTrash = function (type, item) {
    var gd = window.globalData;
    if (!gd) return;
    if (!Array.isArray(gd.deletedItems)) gd.deletedItems = [];

    // Ensure item has an ID
    if (!item.id && !item._id) {
      item._trash_tmp_id = _uid('TMP');
    }

    var entry = {
      id: _uid('TRASH'),
      type: type,                              // 'Student','Finance','Employee','Visitor','KeepRecord','Breakdown'
      item: JSON.parse(JSON.stringify(item)),  // deep copy
      deletedAt: new Date().toISOString(),
      deletedBy: _user()
    };

    gd.deletedItems.unshift(entry);

    // Max 300 items in bin
    if (gd.deletedItems.length > 300) gd.deletedItems = gd.deletedItems.slice(0, 300);

    _save();

    // Log to activity
    var name = item.name || item.studentName || item.title || item.description || item.id || 'Item';
    window.logActivity('DELETE', type, type + ' deleted: ' + name, item);

    console.log('[RecycleFix] ✓ Moved to Recycle Bin:', type, name);
    return entry.id;
  };

  // ═══════════════════════════════════════════════
  // 2. CORE: logActivity (সব action log করবে)
  // ═══════════════════════════════════════════════
  window.logActivity = function (action, type, description, data) {
    var gd = window.globalData;
    if (!gd) return;
    if (!Array.isArray(gd.activityHistory)) gd.activityHistory = [];

    var entry = {
      id: _uid('ACT'),
      action: (action || 'OTHER').toUpperCase(),
      type: (type || 'general').toLowerCase(),
      description: description || '',
      user: _user(),
      timestamp: new Date().toISOString(),
      data: data ? (function () {
        try { return JSON.parse(JSON.stringify(data)); } catch (e) { return {}; }
      })() : {}
    };

    gd.activityHistory.unshift(entry);

    // Max 1000 logs
    if (gd.activityHistory.length > 1000) gd.activityHistory = gd.activityHistory.slice(0, 1000);

    _save();
    console.log('[Activity]', entry.action, entry.type, entry.description);
  };

  // ═══════════════════════════════════════════════
  // 3. CORE: restoreDeletedItem
  // ═══════════════════════════════════════════════
  window.restoreDeletedItem = function (id) {
    var gd = window.globalData;
    if (!gd) return;

    var d = (gd.deletedItems || []).find(function (x) { return x.id === id; });
    if (!d) { console.warn('[RecycleFix] restoreDeletedItem: id not found', id); return; }

    var t = (d.type || '').toLowerCase();

    // ═══════════════════════════════════════════════════
    // SPECIAL CASE: installment restore
    // deleteInstallment() যেই যেই জায়গা থেকে সরিয়েছিল:
    //  1. student.installments[] থেকে
    //  2. student.paid / student.due থেকে
    //  3. globalData.finance[] থেকে
    //  4. account balance থেকে (updateAccountBalance)
    // ───── এখন সব জায়গায় ফিরিয়ে দাও ─────────────────
    if (t === 'installment') {
      var item = d.item;
      var studentName = item.studentName;
      var amount = parseFloat(item.amount) || 0;
      var method = item.method || 'Cash';
      var instDate = item.date || '';
      var batch = item.batch || '';

      // 1. Student খোঁজো (name দিয়ে — index shift হতে পারে)
      var student = (gd.students || []).find(function (s) {
        return (s.name || '').trim().toLowerCase() === studentName.trim().toLowerCase();
      });

      if (!student) {
        if (typeof window.showErrorToast === 'function') {
          window.showErrorToast('⚠️ Student "' + studentName + '" পাওয়া যায়নি! Restore সম্ভব নয়।');
        }
        console.warn('[RecycleFix] installment restore: student not found:', studentName);
        // Still remove from bin
        gd.deletedItems = (gd.deletedItems || []).filter(function (x) { return x.id !== id; });
        _save();
        return;
      }

      // 2. student.installments[] এ ফিরিয়ে দাও
      if (!Array.isArray(student.installments)) student.installments = [];
      student.installments.push({
        amount: amount,
        date: instDate,
        method: method
      });

      // 3. student.paid এবং student.due আপডেট করো
      student.paid = Math.round(((parseFloat(student.paid) || 0) + amount) * 100) / 100;
      student.due = Math.max(0, Math.round(((parseFloat(student.totalPayment) || 0) - student.paid) * 100) / 100);

      // 4. finance[] এ ফিরিয়ে দাও (duplicate check সহ)
      if (!Array.isArray(gd.finance)) gd.finance = [];
      var today = new Date().toISOString().split('T')[0];
      var financeEntry = {
        id: Date.now(),
        type: 'Income',
        method: method,
        date: instDate || today,
        category: 'Student Installment',
        person: studentName,
        amount: amount,
        description: 'Installment payment for student: ' + studentName + ' | Batch: ' + batch,
        timestamp: new Date().toISOString()
      };

      // Duplicate guard: একই date+amount+person এ ইতিমধ্যে আছে কিনা দেখো
      var dupExists = gd.finance.some(function (f) {
        return f.person === studentName
          && parseFloat(f.amount) === amount
          && f.date === instDate
          && (f.category === 'Student Installment' || f.category === 'Student Fee');
      });
      if (!dupExists) {
        gd.finance.push(financeEntry);
        // 5. Account balance ফিরিয়ে দাও
        if (typeof window.updateAccountBalance === 'function') {
          window.updateAccountBalance(method, amount, 'Income', true);
        }
      } else {
        console.warn('[RecycleFix] installment restore: finance entry already exists — skipped to prevent duplicate');
      }

      // 6. Recycle Bin থেকে সরাও
      gd.deletedItems = (gd.deletedItems || []).filter(function (x) { return x.id !== id; });
      _save();

      // 7. Activity log
      window.logActivity('RESTORE', 'installment',
        'Installment restored: ৳' + amount + ' | ' + studentName + ' | ' + instDate, item);

      // 8. UI Refresh
      setTimeout(function () {
        if (typeof window.render === 'function') window.render(gd.students || []);
        if (typeof window.renderStudents === 'function') window.renderStudents();
        if (typeof window.renderLedger === 'function') window.renderLedger(gd.finance || []);
        if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
        if (typeof window.renderAccountList === 'function') window.renderAccountList();
        if (typeof window.renderCashBalance === 'function') window.renderCashBalance();
        if (typeof window.renderMobileBankingList === 'function') window.renderMobileBankingList();
        if (typeof window.updateGrandTotal === 'function') window.updateGrandTotal();
        if (typeof window.renderFullUI === 'function') window.renderFullUI();
      }, 80);

      if (typeof window.renderRecycleBin === 'function') setTimeout(window.renderRecycleBin, 150);
      if (typeof window.showSuccessToast === 'function') {
        window.showSuccessToast('✅ ৳' + amount + ' installment restored for ' + studentName + '! Student paid/due updated.');
      }

      // Cloud sync
      if (typeof window.scheduleSyncPush === 'function') {
        window.scheduleSyncPush('Restore Installment: ' + studentName + ' ৳' + amount);
      }

      console.log('[RecycleFix] ✓ Installment restored:', studentName, '৳' + amount,
        '| New paid:', student.paid, '| due:', student.due);
      return; // ← early return — typeMap এ যাবে না
    }
    // ═══ END installment special case ══════════════════

    // Type → array key mapping (সব type cover করা হয়েছে)
    var typeMap = {
      'student': 'students',
      'finance': 'finance',
      'employee': 'employees',
      'bankaccount': 'bankAccounts',
      'mobileaccount': 'mobileBanking',
      'visitor': 'visitors',
      'keeprecord': 'keepRecords',
      'keep_record': 'keepRecords',
      'keep record': 'keepRecords',
      'notice': 'notices',
      'examregistration': 'examRegistrations',
      'breakdown': 'breakdownRecords',
    };

    var arrKey = typeMap[t];
    if (arrKey) {
      if (!Array.isArray(gd[arrKey])) gd[arrKey] = [];
      // Duplicate check: same id এ already আছে কিনা
      var existingId = d.item.id || d.item._id || d.item._trash_tmp_id;
      var alreadyExists = existingId && gd[arrKey].some(function (x) {
        return (x.id === existingId) || (x._id === existingId);
      });
      if (!alreadyExists) {
        // _trash_tmp_id ছিলে remove করো
        var restored = JSON.parse(JSON.stringify(d.item));
        delete restored._trash_tmp_id;
        gd[arrKey].push(restored);
      }
    }

    // Remove from bin
    gd.deletedItems = (gd.deletedItems || []).filter(function (x) { return x.id !== id; });

    _save();

    // Log restore
    var name = d.item.name || d.item.studentName || d.item.title || d.item.description || 'Item';
    window.logActivity('RESTORE', d.type, d.type + ' restored: ' + name, d.item);

    // UI Refresh based on type
    setTimeout(function () {
      if (t === 'student' || t === 'students') {
        if (typeof window.render === 'function') window.render(gd.students || []);
        if (typeof window.renderStudents === 'function') window.renderStudents();
        if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
      } else if (t === 'finance') {
        // Finance restore হলে account balance ও ফিরিয়ে দাও
        if (d.item && typeof window.updateAccountBalance === 'function') {
          window.updateAccountBalance(d.item.method, parseFloat(d.item.amount) || 0, d.item.type, true);
        }
        if (typeof window.renderLedger === 'function') window.renderLedger(gd.finance || []);
        if (typeof window.renderAccountList === 'function') window.renderAccountList();
        if (typeof window.renderCashBalance === 'function') window.renderCashBalance();
        if (typeof window.updateGrandTotal === 'function') window.updateGrandTotal();
      } else if (t === 'employee') {
        if (typeof window.renderEmployees === 'function') window.renderEmployees();
      } else if (t === 'visitor') {
        if (typeof window.renderVisitors === 'function') window.renderVisitors();
      } else if (t === 'keeprecord' || t === 'keep_record' || t === 'keep record') {
        if (typeof window.renderKeepRecordNotes === 'function') window.renderKeepRecordNotes();
      } else if (t === 'breakdown') {
        if (typeof window.renderBreakdownRecords === 'function') window.renderBreakdownRecords();
      } else if (t === 'examregistration' || t === 'exam') {
        // Exam restore হলে linked finance entry ও ফিরিয়ে দাও
        if (d.item && d.item.fee && typeof window.updateAccountBalance === 'function') {
          window.updateAccountBalance(d.item.paymentMethod || 'Cash', parseFloat(d.item.fee) || 0, 'Income', true);
        }
        // Exam linked finance entry restore
        if (d.item && d.item.fee && Array.isArray(gd.finance)) {
          var examDate = d.item.date || d.item.registrationDate || new Date().toISOString().split('T')[0];
          var examFee = parseFloat(d.item.fee) || 0;
          var examStudent = d.item.studentName || d.item.name || '';
          var examRegId = d.item.regId || '';
          var examMethod = d.item.paymentMethod || 'Cash';
          // Duplicate guard
          var examFinDup = gd.finance.some(function (f) {
            return f.category === 'Exam Fee'
              && parseFloat(f.amount) === examFee
              && (f.person === examStudent || (f.description || '').includes(examRegId));
          });
          if (!examFinDup && examFee > 0) {
            gd.finance.push({
              id: Date.now(),
              type: 'Income',
              method: examMethod,
              date: examDate,
              category: 'Exam Fee',
              person: examStudent,
              amount: examFee,
              description: 'Exam Fee restored | Student: ' + examStudent + (examRegId ? ' | Reg: ' + examRegId : ''),
              timestamp: new Date().toISOString()
            });
          }
        }
        if (typeof window.renderExamRegistrations === 'function') window.renderExamRegistrations();
        if (typeof window.renderLedger === 'function') window.renderLedger(gd.finance || []);
        if (typeof window.renderAccountList === 'function') window.renderAccountList();
        if (typeof window.updateGrandTotal === 'function') window.updateGrandTotal();
      } else if (t === 'notice') {
        if (typeof window.renderNoticeBoard === 'function') window.renderNoticeBoard();
      }
      // General full UI refresh
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
    }, 80);

    if (typeof window.showSuccessToast === 'function') {
      window.showSuccessToast('✅ ' + name + ' Recycle Bin থেকে Restore হয়েছে!');
    }

    // Refresh recycle bin view
    if (typeof window.renderRecycleBin === 'function') setTimeout(window.renderRecycleBin, 150);

    console.log('[RecycleFix] ✓ Restored:', t, name);
  };

  // ═══════════════════════════════════════════════
  // 4. CORE: permanentDelete
  // ═══════════════════════════════════════════════
  window.permanentDelete = function (id) {
    var gd = window.globalData;
    if (!gd) return;

    var d = (gd.deletedItems || []).find(function (x) { return x.id === id; });
    var name = d ? (d.item.name || d.item.studentName || d.item.title || d.item.description || 'Item') : 'Item';

    gd.deletedItems = (gd.deletedItems || []).filter(function (x) { return x.id !== id; });
    _save();

    if (d) window.logActivity('DELETE', d.type, d.type + ' permanently deleted: ' + name, {});

    if (typeof window.renderRecycleBin === 'function') setTimeout(window.renderRecycleBin, 100);
    if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ ' + name + ' চিরতরে মুছে ফেলা হয়েছে!');
    console.log('[RecycleFix] ✓ Permanently deleted:', name);
  };

  // ═══════════════════════════════════════════════
  // 5. PATCH: Keep Record Delete
  // keep-records.js এর deleteNote ঠিক করা
  // ═══════════════════════════════════════════════
  var _patchKeepRecord = function () {
    // Wrap existing deleteNote if it doesn't use moveToTrash
    var orig = window.deleteNote;
    if (typeof orig === 'function') {
      window.deleteNote = function (noteId) {
        var gd = window.globalData;
        if (!gd || !Array.isArray(gd.keepRecords)) { if (typeof orig === 'function') return orig(noteId); return; }

        var note = gd.keepRecords.find(function (n) { return n.id === noteId || n._id === noteId; });
        if (note) {
          // Move to trash FIRST
          window.moveToTrash('KeepRecord', note);
          // Remove from keepRecords
          gd.keepRecords = gd.keepRecords.filter(function (n) { return n.id !== noteId && n._id !== noteId; });
          _save();
          if (typeof window.renderKeepRecordNotes === 'function') window.renderKeepRecordNotes();
          if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ Note Recycle Bin-এ গেছে');
        } else {
          if (typeof orig === 'function') orig(noteId);
        }
      };
      console.log('[RecycleFix] ✓ deleteNote patched');
    } else {
      // Define from scratch if missing
      window.deleteNote = function (noteId) {
        var gd = window.globalData;
        if (!gd || !Array.isArray(gd.keepRecords)) return;
        var note = gd.keepRecords.find(function (n) { return n.id === noteId || n._id === noteId; });
        if (!note) return;
        if (!confirm('এই Note টি Recycle Bin-এ পাঠাবেন?')) return;
        window.moveToTrash('KeepRecord', note);
        gd.keepRecords = gd.keepRecords.filter(function (n) { return n.id !== noteId && n._id !== noteId; });
        _save();
        if (typeof window.renderKeepRecordNotes === 'function') window.renderKeepRecordNotes();
        if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ Note Recycle Bin-এ গেছে');
      };
      console.log('[RecycleFix] ✓ deleteNote created');
    }
  };

  // ═══════════════════════════════════════════════
  // 6. PATCH: Student Delete
  // ═══════════════════════════════════════════════
  var _patchStudentDelete = function () {
    var orig = window.deleteStudent;
    window.deleteStudent = function (id) {
      var gd = window.globalData;
      if (!gd || !Array.isArray(gd.students)) { if (typeof orig === 'function') return orig(id); return; }
      var student = gd.students.find(function (s) { return String(s.id) === String(id) || String(s._id) === String(id); });
      if (!student) { if (typeof orig === 'function') return orig(id); return; }
      if (!confirm('Student টি Recycle Bin-এ পাঠাবেন?')) return;
      window.moveToTrash('Student', student);
      gd.students = gd.students.filter(function (s) { return String(s.id) !== String(id) && String(s._id) !== String(id); });
      _save();
      if (typeof window.render === 'function') window.render(gd.students);
      if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
      if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ ' + student.name + ' Recycle Bin-এ গেছে');
    };
    console.log('[RecycleFix] ✓ deleteStudent patched');
  };

  // ═══════════════════════════════════════════════
  // 7. PATCH: Finance Delete
  // ═══════════════════════════════════════════════
  var _patchFinanceDelete = function () {
    var orig = window.deleteTransaction || window.deleteFinance;
    var patchFn = function (id) {
      if (typeof orig === 'function') {
        if (!confirm('Transaction টি Recycle Bin-এ পাঠাবেন?')) return;
        return orig(id);
      }
    };
    window.deleteTransaction = patchFn;
    window.deleteFinance = patchFn;
    console.log('[RecycleFix] ✓ deleteTransaction/deleteFinance patched');
  };

  // ═══════════════════════════════════════════════
  // 8. PATCH: Employee Delete
  // ═══════════════════════════════════════════════
  var _patchEmployeeDelete = function () {
    var orig = window.deleteEmployee;
    window.deleteEmployee = function (id) {
      var gd = window.globalData;
      if (!gd || !Array.isArray(gd.employees)) { if (typeof orig === 'function') return orig(id); return; }
      var emp = gd.employees.find(function (e) { return String(e.id) === String(id) || String(e._id) === String(id); });
      if (!emp) { if (typeof orig === 'function') return orig(id); return; }
      if (!confirm('Employee টি Recycle Bin-এ পাঠাবেন?')) return;
      window.moveToTrash('Employee', emp);
      gd.employees = gd.employees.filter(function (e) { return String(e.id) !== String(id) && String(e._id) !== String(id); });
      _save();
      if (typeof window.renderEmployees === 'function') window.renderEmployees();
      if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ ' + emp.name + ' Recycle Bin-এ গেছে');
    };
    console.log('[RecycleFix] ✓ deleteEmployee patched');
  };

  // ═══════════════════════════════════════════════
  // 9. PATCH: Visitor Delete
  // ═══════════════════════════════════════════════
  var _patchVisitorDelete = function () {
    var orig = window.deleteVisitor;
    window.deleteVisitor = function (id) {
      var gd = window.globalData;
      if (!gd || !Array.isArray(gd.visitors)) { if (typeof orig === 'function') return orig(id); return; }
      var v = gd.visitors.find(function (x) { return String(x.id) === String(id) || String(x._id) === String(id); });
      if (!v) { if (typeof orig === 'function') return orig(id); return; }
      if (!confirm('Visitor টি Recycle Bin-এ পাঠাবেন?')) return;
      window.moveToTrash('Visitor', v);
      gd.visitors = gd.visitors.filter(function (x) { return String(x.id) !== String(id) && String(x._id) !== String(id); });
      _save();
      if (typeof window.renderVisitors === 'function') window.renderVisitors();
      if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ Visitor Recycle Bin-এ গেছে');
    };
    console.log('[RecycleFix] ✓ deleteVisitor patched');
  };

  // ═══════════════════════════════════════════════
  // 9b. PATCH: Exam Registration Delete
  // ═══════════════════════════════════════════════
  var _patchExamDelete = function () {
    var orig = window.deleteExamRegistration;
    window.deleteExamRegistration = function (id) {
      var gd = window.globalData;
      if (!gd || !Array.isArray(gd.examRegistrations)) {
        if (typeof orig === 'function') return orig(id);
        return;
      }
      var exam = gd.examRegistrations.find(function (e) {
        return String(e.id) === String(id) || String(e._id) === String(id) || String(e.regId) === String(id);
      });
      if (!exam) { if (typeof orig === 'function') return orig(id); return; }
      if (!confirm('Exam Registration টি Recycle Bin-এ পাঠাবেন?')) return;

      // Linked Finance entry ও Recycle Bin-এ পাঠাও
      if (exam.fee && Array.isArray(gd.finance)) {
        var examStudent = exam.studentName || exam.name || '';
        var examRegId = exam.regId || '';
        var examFee = parseFloat(exam.fee) || 0;
        var linkedFin = gd.finance.find(function (f) {
          return f.category === 'Exam Fee'
            && parseFloat(f.amount) === examFee
            && (f.person === examStudent || (f.description || '').includes(examRegId));
        });
        if (linkedFin) {
          if (typeof window.updateAccountBalance === 'function') {
            window.updateAccountBalance(linkedFin.method || 'Cash', examFee, 'Income', false);
          }
          window.moveToTrash('finance', linkedFin);
          gd.finance = gd.finance.filter(function (f) { return f.id !== linkedFin.id; });
        }
      }

      window.moveToTrash('ExamRegistration', exam);
      gd.examRegistrations = gd.examRegistrations.filter(function (e) {
        return String(e.id) !== String(id) && String(e._id) !== String(id) && String(e.regId) !== String(id);
      });
      _save();
      if (typeof window.renderExamRegistrations === 'function') window.renderExamRegistrations();
      if (typeof window.renderLedger === 'function') window.renderLedger(gd.finance || []);
      if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
      if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ Exam Registration Recycle Bin-এ গেছে');
    };
    console.log('[RecycleFix] ✓ deleteExamRegistration patched');
  };

  // ═══════════════════════════════════════════════
  // 9c. PATCH: Notice Delete
  // ═══════════════════════════════════════════════
  var _patchNoticeDelete = function () {
    var orig = window.deleteNotice;
    window.deleteNotice = function (id) {
      var gd = window.globalData;
      var noticeArr = gd && (gd.notices || gd.noticeBoard);
      if (!gd || !Array.isArray(noticeArr)) {
        if (typeof orig === 'function') return orig(id);
        return;
      }
      var notice = noticeArr.find(function (n) { return String(n.id) === String(id) || String(n._id) === String(id); });
      if (!notice) { if (typeof orig === 'function') return orig(id); return; }
      if (!confirm('Notice টি Recycle Bin-এ পাঠাবেন?')) return;
      window.moveToTrash('Notice', notice);
      if (gd.notices) {
        gd.notices = gd.notices.filter(function (n) { return String(n.id) !== String(id) && String(n._id) !== String(id); });
      }
      if (gd.noticeBoard) {
        gd.noticeBoard = gd.noticeBoard.filter(function (n) { return String(n.id) !== String(id) && String(n._id) !== String(id); });
      }
      _save();
      if (typeof window.renderNoticeBoard === 'function') window.renderNoticeBoard();
      if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ Notice Recycle Bin-এ গেছে');
    };
    console.log('[RecycleFix] ✓ deleteNotice patched');
  };

  // ═══════════════════════════════════════════════
  // 10. Breakdown Records Support
  // (Keep Record-এর ভেতর breakdown হলে)
  // ═══════════════════════════════════════════════
  window.deleteBreakdownRecord = function (id) {
    var gd = window.globalData;
    if (!gd) return;
    if (!Array.isArray(gd.breakdownRecords)) gd.breakdownRecords = [];
    var rec = gd.breakdownRecords.find(function (r) { return String(r.id) === String(id); });
    if (!rec) return;
    if (!confirm('এই Record টি Recycle Bin-এ পাঠাবেন?')) return;
    window.moveToTrash('Breakdown', rec);
    gd.breakdownRecords = gd.breakdownRecords.filter(function (r) { return String(r.id) !== String(id); });
    _save();
    if (typeof window.renderBreakdownRecords === 'function') window.renderBreakdownRecords();
    if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ Record Recycle Bin-এ গেছে');
  };

  // ═══════════════════════════════════════════════
  // 11. Recycle Bin Renderer (enhanced)
  // ═══════════════════════════════════════════════
  function renderRecycleBin() {
    var wrap = document.getElementById('recycleBinContainer');
    if (!wrap) return;

    var gd = window.globalData;
    if (!gd) { wrap.innerHTML = '<p style="color:#888;text-align:center;">Data লোড হয়নি।</p>'; return; }
    if (!Array.isArray(gd.deletedItems)) {
      try {
        var bk = localStorage.getItem('wingsfly_deleted_backup');
        gd.deletedItems = bk ? JSON.parse(bk) : [];
      } catch (e) { gd.deletedItems = []; }
    }

    var deleted = gd.deletedItems.slice();
    var fType = (document.getElementById('binFilterType') ? document.getElementById('binFilterType').value : 'all');
    var fSearch = (document.getElementById('binSearchInput') ? document.getElementById('binSearchInput').value.trim().toLowerCase() : '');

    var filtered = deleted.filter(function (d) {
      if (fType !== 'all' && (d.type || '').toLowerCase() !== fType.toLowerCase()) return false;
      if (fSearch) {
        var name = _binName(d).toLowerCase();
        var typeStr = (d.type || '').toLowerCase();
        if (!name.includes(fSearch) && !typeStr.includes(fSearch)) return false;
      }
      return true;
    });

    var icons = { student: '🎓', finance: '💰', employee: '👤', visitor: '👋', keeprecord: '📝', breakdown: '📊', notice: '📌', examregistration: '📋', exam: '📋' };

    var rows = '';
    if (filtered.length === 0) {
      rows = '<tr><td colspan="5"><div style="text-align:center;padding:40px;color:#604040;"><div style="font-size:2.5rem;margin-bottom:8px;">🗑️</div><p>Recycle Bin খালি।</p></div></td></tr>';
    } else {
      rows = filtered.map(function (d) {
        var dt = new Date(d.deletedAt);
        var dateStr = isNaN(dt) ? '—' : dt.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
        var timeStr = isNaN(dt) ? '' : dt.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
        var tl = (d.type || '').toLowerCase();
        var icon = icons[tl] || '📄';
        var name = _binName(d);
        var safeId = d.id.replace(/'/g, "\\'");
        return '<tr>'
          + '<td style="font-size:1.1rem;text-align:center;">' + icon + '</td>'
          + '<td><span style="display:inline-block;padding:2px 8px;border-radius:5px;font-size:0.68rem;font-weight:700;background:rgba(255,100,100,0.12);color:#ff9090;border:1px solid rgba(255,100,100,0.25);text-transform:uppercase;">' + (d.type || '?') + '</span></td>'
          + '<td style="max-width:220px;"><div style="color:#fff;font-weight:500;">' + name + '</div>'
          + '<div style="font-size:0.71rem;color:#806060;">By: ' + (d.deletedBy || 'Admin') + '</div></td>'
          + '<td style="white-space:nowrap;font-size:0.75rem;color:#906060;">' + dateStr + '<br>' + timeStr + '</td>'
          + '<td><div style="display:flex;gap:5px;">'
          + '<button type="button" style="background:rgba(0,200,100,0.15);color:#00cc77;border:1px solid rgba(0,200,100,0.3);border-radius:6px;padding:3px 10px;font-size:0.72rem;cursor:pointer;white-space:nowrap;" onclick="event.stopPropagation();window.restoreDeletedItem(\'' + safeId + '\');setTimeout(window.renderRecycleBin||function(){},200);">↩️ Restore</button>'
          + '<button type="button" style="background:rgba(255,50,50,0.12);color:#ff5555;border:1px solid rgba(255,50,50,0.25);border-radius:6px;padding:3px 8px;font-size:0.72rem;cursor:pointer;" onclick="event.stopPropagation();window.permanentDelete(\'' + safeId + '\')">❌</button>'
          + '</div></td>'
          + '</tr>';
      }).join('');
    }

    // Stats
    var statTypes = ['student', 'finance', 'employee', 'visitor', 'keeprecord', 'breakdown'];
    var statHTML = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">'
      + '<div style="background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.18);border-radius:20px;padding:3px 12px;font-size:0.75rem;color:#c08080;">মোট: <strong style="color:#ff8080;">' + filtered.length + '</strong></div>';

    statTypes.forEach(function (st) {
      var cnt = filtered.filter(function (d) { return (d.type || '').toLowerCase() === st; }).length;
      if (cnt > 0) {
        var ic = icons[st] || '📄';
        statHTML += '<div style="background:rgba(255,80,80,0.08);border:1px solid rgba(255,80,80,0.18);border-radius:20px;padding:3px 12px;font-size:0.75rem;color:#c08080;">' + ic + ' <strong style="color:#ff8080;">' + cnt + '</strong></div>';
      }
    });
    statHTML += '</div>';

    // Search box
    var searchId = 'binSearchInput';
    var searchHTML = '';
    if (!document.getElementById(searchId)) {
      searchHTML = '<div style="margin-bottom:10px;"><input id="' + searchId + '" type="text" placeholder="🔍 Search deleted items..." style="background:rgba(10,5,5,0.9);border:1.5px solid rgba(255,80,80,0.3);color:#e8d0d0;border-radius:8px;padding:5px 10px;font-size:0.8rem;min-width:200px;outline:none;" oninput="window.renderRecycleBin&&window.renderRecycleBin()"></div>';
    }

    wrap.innerHTML = statHTML + searchHTML
      + '<div style="overflow-x:auto;border-radius:12px;border:1.5px solid rgba(255,68,68,0.2);background:rgba(10,5,5,0.5);">'
      + '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;min-width:500px;">'
      + '<thead><tr>'
      + '<th style="background:rgba(255,68,68,0.1);color:#ff8080;font-weight:600;padding:10px 12px;border-bottom:2px solid rgba(255,68,68,0.2);width:36px;">Icon</th>'
      + '<th style="background:rgba(255,68,68,0.1);color:#ff8080;font-weight:600;padding:10px 12px;border-bottom:2px solid rgba(255,68,68,0.2);">Type</th>'
      + '<th style="background:rgba(255,68,68,0.1);color:#ff8080;font-weight:600;padding:10px 12px;border-bottom:2px solid rgba(255,68,68,0.2);">Item</th>'
      + '<th style="background:rgba(255,68,68,0.1);color:#ff8080;font-weight:600;padding:10px 12px;border-bottom:2px solid rgba(255,68,68,0.2);">Deleted At</th>'
      + '<th style="background:rgba(255,68,68,0.1);color:#ff8080;font-weight:600;padding:10px 12px;border-bottom:2px solid rgba(255,68,68,0.2);">Actions</th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table></div>';
  }

  function _binName(d) {
    var t = (d.type || '').toLowerCase();
    if (!d.item) return '?';
    if (t === 'student') return d.item.name || d.item.studentName || 'Unknown Student';
    if (t === 'finance') return (d.item.description || d.item.category || 'Transaction') + ' — ৳' + (d.item.amount || 0);
    if (t === 'employee') return d.item.name || 'Unknown Employee';
    if (t === 'visitor') return d.item.name || d.item.visitorName || 'Unknown Visitor';
    if (t === 'keeprecord' || t === 'keep_record') return d.item.title || d.item.content || 'Note';
    if (t === 'breakdown') return d.item.title || d.item.name || 'Record';
    return d.item.title || d.item.name || d.item.description || JSON.stringify(d.item).substring(0, 50);
  }

  window.renderRecycleBin = renderRecycleBin;

  // ═══════════════════════════════════════════════
  // 12. Activity Log Renderer (enhanced)
  // ═══════════════════════════════════════════════
  function renderActivityLog() {
    var wrap = document.getElementById('activityLogContainer');
    if (!wrap) return;

    var gd = window.globalData;
    if (!gd) { wrap.innerHTML = '<p style="color:#888;text-align:center;">Data লোড হয়নি।</p>'; return; }
    if (!Array.isArray(gd.activityHistory)) {
      try {
        var bk = localStorage.getItem('wingsfly_activity_backup');
        gd.activityHistory = bk ? JSON.parse(bk) : [];
      } catch (e) { gd.activityHistory = []; }
    }

    var history = gd.activityHistory.slice();

    // Filters
    var fAction = (document.getElementById('logFilterType') ? document.getElementById('logFilterType').value : 'all');
    var fSearch = (document.getElementById('logSearch') ? document.getElementById('logSearch').value.trim().toLowerCase() : '');
    var fDateFrom = document.getElementById('logDateFrom') ? document.getElementById('logDateFrom').value : '';
    var fDateTo = document.getElementById('logDateTo') ? document.getElementById('logDateTo').value : '';

    var filtered = history.filter(function (h) {
      if (fAction !== 'all' && h.action !== fAction) return false;
      if (fSearch && !((h.description || '') + (h.action || '') + (h.type || '')).toLowerCase().includes(fSearch)) return false;
      if (fDateFrom && new Date(h.timestamp) < new Date(fDateFrom)) return false;
      if (fDateTo && new Date(h.timestamp) > new Date(fDateTo + 'T23:59:59')) return false;
      return true;
    });

    var total = filtered.length;
    var addCnt = filtered.filter(function (h) { return h.action === 'ADD'; }).length;
    var editCnt = filtered.filter(function (h) { return h.action === 'EDIT'; }).length;
    var delCnt = filtered.filter(function (h) { return h.action === 'DELETE'; }).length;
    var resCnt = filtered.filter(function (h) { return h.action === 'RESTORE'; }).length;

    var badgeColors = {
      ADD: { bg: 'rgba(0,255,136,0.12)', color: '#00ff88', border: 'rgba(0,255,136,0.3)' },
      EDIT: { bg: 'rgba(0,217,255,0.12)', color: '#00d9ff', border: 'rgba(0,217,255,0.3)' },
      DELETE: { bg: 'rgba(255,60,80,0.12)', color: '#ff4455', border: 'rgba(255,60,80,0.3)' },
      LOGIN: { bg: 'rgba(181,55,242,0.15)', color: '#c060f0', border: 'rgba(181,55,242,0.3)' },
      LOGOUT: { bg: 'rgba(255,170,0,0.12)', color: '#ffaa00', border: 'rgba(255,170,0,0.3)' },
      PAYMENT: { bg: 'rgba(0,200,100,0.12)', color: '#00cc66', border: 'rgba(0,200,100,0.3)' },
      SETTINGS: { bg: 'rgba(100,120,255,0.12)', color: '#8090ff', border: 'rgba(100,120,255,0.3)' },
      RESTORE: { bg: 'rgba(0,255,200,0.12)', color: '#00ffc8', border: 'rgba(0,255,200,0.3)' },
      OTHER: { bg: 'rgba(120,120,120,0.12)', color: '#909090', border: 'rgba(120,120,120,0.3)' },
    };

    function badgeStyle(action) {
      var c = badgeColors[action] || badgeColors.OTHER;
      return 'display:inline-block;padding:2px 8px;border-radius:20px;font-size:0.68rem;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;background:' + c.bg + ';color:' + c.color + ';border:1px solid ' + c.border + ';';
    }

    var typeIcons = { student: '🎓', finance: '💰', employee: '👤', settings: '⚙️', login: '🔐', logout: '🔓', keeprecord: '📝', breakdown: '📊', visitor: '👋' };

    var rows = '';
    if (filtered.length === 0) {
      rows = '<tr><td colspan="5"><div style="text-align:center;padding:40px;color:#5080a0;"><div style="font-size:2.5rem;margin-bottom:8px;">📋</div><p>কোনো Activity পাওয়া যায়নি।</p></div></td></tr>';
    } else {
      rows = filtered.slice(0, 200).map(function (h) {
        var d = new Date(h.timestamp);
        var dateStr = isNaN(d) ? '—' : d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
        var timeStr = isNaN(d) ? '' : d.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
        var tl = (h.type || '').toLowerCase();
        var icon = typeIcons[tl] || '📝';
        var validActions = ['ADD', 'EDIT', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'SETTINGS', 'RESTORE'];
        var action = validActions.includes(h.action) ? h.action : 'OTHER';
        return '<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">'
          + '<td style="font-size:1.1rem;text-align:center;padding:9px 12px;">' + icon + '</td>'
          + '<td style="padding:9px 12px;"><span style="' + badgeStyle(action) + '">' + action + '</span></td>'
          + '<td style="padding:9px 12px;"><span style="display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:5px;font-size:0.7rem;font-weight:600;background:rgba(255,255,255,0.05);color:#90aec8;border:1px solid rgba(255,255,255,0.1);">' + (h.type || '?') + '</span></td>'
          + '<td style="padding:9px 12px;color:#d0e8ff;"><div style="color:#ffffff;font-weight:500;">' + (h.description || '—') + '</div>'
          + '<div style="color:#6090b8;font-size:0.72rem;margin-top:2px;">👤 ' + (h.user || 'Admin') + '</div></td>'
          + '<td style="padding:9px 12px;white-space:nowrap;font-size:0.78rem;color:#5080a0;">' + dateStr + '<br>' + timeStr + '</td>'
          + '</tr>';
      }).join('');
    }

    wrap.innerHTML =
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:10px;">'
      + '<div style="background:rgba(0,217,255,0.08);border:1px solid rgba(0,217,255,0.2);border-radius:20px;padding:3px 12px;font-size:0.75rem;color:#90cce8;">মোট: <strong style="color:#00d9ff;">' + total + '</strong></div>'
      + '<div style="background:rgba(0,217,255,0.08);border:1px solid rgba(0,217,255,0.2);border-radius:20px;padding:3px 12px;font-size:0.75rem;color:#90cce8;">➕ <strong style="color:#00ff88;">' + addCnt + '</strong></div>'
      + '<div style="background:rgba(0,217,255,0.08);border:1px solid rgba(0,217,255,0.2);border-radius:20px;padding:3px 12px;font-size:0.75rem;color:#90cce8;">✏️ <strong style="color:#00d9ff;">' + editCnt + '</strong></div>'
      + '<div style="background:rgba(0,217,255,0.08);border:1px solid rgba(0,217,255,0.2);border-radius:20px;padding:3px 12px;font-size:0.75rem;color:#90cce8;">🗑️ <strong style="color:#ff4455;">' + delCnt + '</strong></div>'
      + '<div style="background:rgba(0,217,255,0.08);border:1px solid rgba(0,217,255,0.2);border-radius:20px;padding:3px 12px;font-size:0.75rem;color:#90cce8;">♻️ <strong style="color:#00ffc8;">' + resCnt + '</strong></div>'
      + '</div>'
      + '<div style="overflow-x:auto;border-radius:12px;border:1.5px solid rgba(0,217,255,0.18);background:rgba(5,10,30,0.6);">'
      + '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;min-width:560px;">'
      + '<thead><tr>'
      + '<th style="background:rgba(0,217,255,0.1);color:#00d9ff;font-weight:600;padding:10px 12px;border-bottom:2px solid rgba(0,217,255,0.25);width:36px;">Icon</th>'
      + '<th style="background:rgba(0,217,255,0.1);color:#00d9ff;font-weight:600;padding:10px 12px;border-bottom:2px solid rgba(0,217,255,0.25);">Action</th>'
      + '<th style="background:rgba(0,217,255,0.1);color:#00d9ff;font-weight:600;padding:10px 12px;border-bottom:2px solid rgba(0,217,255,0.25);">Type</th>'
      + '<th style="background:rgba(0,217,255,0.1);color:#00d9ff;font-weight:600;padding:10px 12px;border-bottom:2px solid rgba(0,217,255,0.25);">Description</th>'
      + '<th style="background:rgba(0,217,255,0.1);color:#00d9ff;font-weight:600;padding:10px 12px;border-bottom:2px solid rgba(0,217,255,0.25);">Time</th>'
      + '</tr></thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table></div>';
  }

  window.renderActivityLog = renderActivityLog;

  // ═══════════════════════════════════════════════
  // 13. Tab Switch Intercept (auto-render)
  // ═══════════════════════════════════════════════
  function _initTabIntercept() {
    var orig = window.switchSettingsTab;
    window.switchSettingsTab = function (tabId, btn) {
      if (typeof orig === 'function') orig(tabId, btn);
      if (tabId === 'tab-activitylog') setTimeout(renderActivityLog, 60);
      if (tabId === 'tab-recyclebin') setTimeout(renderRecycleBin, 60);
    };

    // Modal show এ render
    var modal = document.getElementById('settingsModal');
    if (modal) {
      modal.addEventListener('shown.bs.modal', function () {
        var active = modal.querySelector('.settings-tab-pane[style*="block"]');
        if (!active) return;
        if (active.id === 'tab-activitylog') renderActivityLog();
        if (active.id === 'tab-recyclebin') renderRecycleBin();
      });
    }

    // binFilterType dropdown bind
    var binFilter = document.getElementById('binFilterType');
    if (binFilter && !binFilter._wfRbBound) {
      binFilter._wfRbBound = true;
      binFilter.addEventListener('change', renderRecycleBin);
    }
  }

  // ═══════════════════════════════════════════════
  // 14. INIT — সব patch চালু করো
  // ═══════════════════════════════════════════════
  function init() {
    // Core function ensure
    var gd = window.globalData;
    if (gd) {
      if (!Array.isArray(gd.deletedItems)) gd.deletedItems = [];
      if (!Array.isArray(gd.activityHistory)) gd.activityHistory = [];
      if (!Array.isArray(gd.keepRecords)) gd.keepRecords = [];
      if (!Array.isArray(gd.breakdownRecords)) gd.breakdownRecords = [];
    }

    _patchKeepRecord();
    _patchStudentDelete();
    _patchFinanceDelete();
    _patchEmployeeDelete();
    _patchVisitorDelete();
    _patchExamDelete();
    _patchNoticeDelete();
    _initTabIntercept();

    // examRegistrations array ensure
    if (gd) {
      if (!Array.isArray(gd.examRegistrations)) gd.examRegistrations = [];
      if (!Array.isArray(gd.notices)) gd.notices = [];
    }

    console.log('[RecycleFix] ✅ All patches applied — Student/Finance/Employee/Visitor/Exam/Notice/KeepRecord/Breakdown → Recycle Bin ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 2.5s পরে আবার apply (other scripts override করলে)
  setTimeout(function () {
    _patchKeepRecord();
    _patchStudentDelete();
    _patchFinanceDelete();
    _patchEmployeeDelete();
    _patchVisitorDelete();
    _patchExamDelete();
    _patchNoticeDelete();
    window.renderActivityLog = renderActivityLog;
    window.renderRecycleBin = renderRecycleBin;

    // Re-bind binFilterType
    var bf = document.getElementById('binFilterType');
    if (bf && !bf._wfRbBound) {
      bf._wfRbBound = true;
      bf.addEventListener('change', renderRecycleBin);
    }
    console.log('[RecycleFix] ✅ 2.5s re-patch done');
  }, 2500);

})();

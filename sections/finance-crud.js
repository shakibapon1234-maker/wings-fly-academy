// ====================================
// WINGS FLY AVIATION ACADEMY
// FINANCE CRUD — STUDENT PAYMENTS, TRANSACTIONS, DELETE
// Extracted from app.js (Phase 2)
// ====================================

// ===================================
// DELETE STUDENT
// ===================================
// STUDENT PAYMENT & INSTALLMENT LOGIC
// ===================================

let currentPaymentStudentIndex = null;

/**
 * Gets consistent installment list, recovering any missing initial payments
 */
function getStudentInstallments(student) {
  if (!student) return [];
  const installments = [...(student.installments || [])];
  const totalPaid = parseFloat(student.paid) || 0;
  const installmentsSum = installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0);

  // If there's a difference, the missing amount is the "Initial Payment"
  if (totalPaid > installmentsSum) {
    const missing = totalPaid - installmentsSum;
    // Add to the START of the list
    installments.unshift({
      amount: missing,
      date: student.enrollDate || 'Opening',
      method: student.method || 'Cash',
      isMigrated: true
    });
  }
  return installments;
}

function openStudentPaymentModal(rowIndex) {
  // Use direct index access
  const student = (window.globalData && window.globalData.students)
    ? window.globalData.students[rowIndex]
    : (typeof globalData !== 'undefined' ? globalData.students[rowIndex] : null);

  if (!student) {
    alert("Student not found!");
    return;
  }

  currentPaymentStudentIndex = rowIndex;

  // Ensure modal HTML is loaded (supports lazy-loaded modals via section-loader)
  const totalFeeEl = document.getElementById('pmtTotalFee');
  const totalPaidEl = document.getElementById('pmtTotalPaid');
  const totalDueEl = document.getElementById('pmtTotalDue');

  if (!totalFeeEl || !totalPaidEl || !totalDueEl) {
    // Try lazy-load via Section Loader if available
    if (window.sectionLoader && typeof window.sectionLoader.loadAndOpen === 'function') {
      window.sectionLoader.loadAndOpen(
        '__modalPlaceholderOther',
        'sections/modals-student.html',
        'studentPaymentModal',
        function () { openStudentPaymentModal(rowIndex); }
      );
      return;
    }

    console.warn('[FinanceCRUD] studentPaymentModal elements missing in DOM, and SectionLoader not available.');
    return;
  }

  // Update header/summary
  totalFeeEl.innerText = '৳' + formatNumber(student.totalPayment || 0);
  totalPaidEl.innerText = '৳' + formatNumber(student.paid || 0);
  totalDueEl.innerText = '৳' + formatNumber(student.due || 0);

  // Suggest remaining due in amount field
  const amountField = document.getElementById('pmtNewAmount');
  if (amountField) amountField.value = student.due > 0 ? student.due : '';

  // Populate history table
  const tbody = document.getElementById('pmtHistoryBody');
  if (!tbody) {
    console.warn('[FinanceCRUD] pmtHistoryBody element missing in DOM.');
    return;
  }
  tbody.innerHTML = '';

  const installments = getStudentInstallments(student);
  if (installments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No payments recorded yet.</td></tr>';
  } else {
    installments.forEach((inst, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${inst.date} ${inst.isMigrated ? '(Initial)' : ''}</td>
        <td><span class="badge bg-light text-dark border">${inst.method || 'N/A'}</span></td>
        <td class="text-end fw-bold">৳${formatNumber(inst.amount)}</td>
        <td class="text-end d-flex gap-1 justify-content-end">
          <button class="btn btn-sm btn-outline-primary" onclick="printReceipt(${rowIndex}, ${inst.amount})">
            <i class="bi bi-printer"></i> RECEIPT
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteInstallment(${rowIndex}, ${idx})" title="Delete this payment">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  const el = document.getElementById('studentPaymentModal');
  if (!el) return;
  const modal = bootstrap.Modal.getOrCreateInstance(el);
  modal.show();
}

function handleAddInstallment() {
  if (currentPaymentStudentIndex === null) return;

  // Use direct array index access instead of find with rowIndex
  const student = globalData.students[currentPaymentStudentIndex];
  if (!student) {
    alert('Student not found!');
    return;
  }

  const amount = parseFloat(document.getElementById('pmtNewAmount').value);
  const method = document.getElementById('pmtNewMethod').value;
  const today = new Date().toISOString().split('T')[0];

  // ✅ CRITICAL VALIDATION: Payment Method is REQUIRED
  if (!method || method.trim() === '') {
    showErrorToast('❌ Payment Method is required! Please select a payment method.');
    document.getElementById('pmtNewMethod').focus();
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  // Confirm if amount exceeds due
  if (amount > (student.due + 1)) { // Allow 1tk buffer for rounding
    if (!confirm(`Warning: Payment amount (৳${formatNumber(amount)}) exceeds current due (৳${formatNumber(student.due)}). Continue?`)) return;
  }

  // 1. Update Student Data
  if (!student.installments) student.installments = [];

  // Ensure we don't duplicate migrated payments if we add new ones
  // (We'll keep the underlying installments array clean, the helper handles display)
  student.installments.push({ amount, date: today, method });

  student.paid = (parseFloat(student.paid) || 0) + amount;
  student.due = Math.max(0, (parseFloat(student.totalPayment) || 0) - student.paid);

  // 2. Add to Finance Ledger (with duplicate prevention)
  const financeEntry = {
    id: Date.now(),
    type: 'Income',
    method: method,
    date: today,
    category: 'Student Installment',
    person: student.name,
    amount: amount,
    description: `Installment payment for student: ${student.name} | Batch: ${student.batch}`,
    timestamp: new Date().toISOString()
  };

  // DUPLICATE GUARD: Finance total for this student should equal student.paid BEFORE this entry
  // If finance already shows more than student.paid, skip adding to finance (already counted)
  const financeTotal = (globalData.finance || [])
    .filter(f => f.person === student.name && (f.category === 'Student Installment' || f.category === 'Student Fee'))
    .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
  const expectedBeforeThis = (parseFloat(student.paid) || 0); // student.paid already updated above

  if (financeTotal < expectedBeforeThis) {
    globalData.finance.push(financeEntry);
    // 3. Update Account Balance
    if (typeof updateAccountBalance === "function") {
      updateAccountBalance(financeEntry.method, financeEntry.amount, financeEntry.type);
    }
  } else {
    console.warn(`⚠️ Duplicate finance entry prevented for ${student.name}. Finance:${financeTotal} >= Expected:${expectedBeforeThis}`);
  }

  // 4. Save & Refresh
  saveToStorage();

  // Success feedback
  showSuccessToast('Installment added successfully!');

  // Reset form
  document.getElementById('pmtNewAmount').value = '';

  // Refresh modal UI
  openStudentPaymentModal(currentPaymentStudentIndex);

  // Refresh main table
  render(globalData.students);
  updateGlobalStats();

  // Trigger receipt
  printReceipt(currentPaymentStudentIndex, amount);
}

window.openStudentPaymentModal = openStudentPaymentModal;
window.handleAddInstallment = handleAddInstallment;

// ✅ DELETE INSTALLMENT — Payment History থেকে একটা payment সরানো
function deleteInstallment(rowIndex, instIndex) {
  const student = globalData.students[rowIndex];
  if (!student) { alert('Student not found!'); return; }

  const installments = getStudentInstallments(student);
  const inst = installments[instIndex];
  if (!inst) { alert('Installment not found!'); return; }

  // ⛔ PROTECT: Migrated/Initial payment ডিলিট করা যাবে না
  // এগুলো student.installments array-তে নেই, শুধু paid-installmentsSum gap থেকে তৈরি
  // ডিলিট করলে পুরো payment history মুছে যাবে
  if (inst.isMigrated) {
    alert('⚠️ Initial/Opening payment ডিলিট করা যায় না।\n\nএটি আপনার পূর্বের সব payment-এর সমষ্টি।\nশুধুমাত্র নতুন যোগ করা installment ডিলিট করা যাবে।');
    return;
  }

  if (!confirm(`এই payment টি delete করতে চান?\n৳${formatNumber(inst.amount)} (${inst.date} - ${inst.method || 'Cash'})`)) return;

  const amount = parseFloat(inst.amount) || 0;
  const method = inst.method || 'Cash';

  // 0. ✅ Recycle Bin এ সেভ করো (restore করার জন্য)
  if (typeof moveToTrash === 'function') {
    moveToTrash('installment', {
      studentName: student.name,
      studentIndex: rowIndex,
      amount: amount,
      date: inst.date,
      method: method,
      batch: student.batch || '',
      description: `Installment: ৳${formatNumber(amount)} | ${student.name} | ${inst.date}`
    });
  }

  // Move to trash (Activity Log)
  if (typeof moveToTrash === 'function') moveToTrash('installment', { ...inst, studentName: student.name });
  if (typeof logActivity === 'function') {
    logActivity('installment', 'DELETE',
      `Installment moved to trash: ৳${amount} for ${student.name}`, inst);
  }

  // 1. Student installments array থেকে সরাও
  const displayList = getStudentInstallments(student);
  const migratedCount = displayList.filter(i => i.isMigrated).length;
  const realIndex = instIndex - migratedCount;
  if (realIndex >= 0 && student.installments && realIndex < student.installments.length) {
    student.installments.splice(realIndex, 1);
  }

  // 2. Student paid/due update করো (শুধু এই installment এর amount কমাও)
  student.paid = Math.max(0, (parseFloat(student.paid) || 0) - amount);
  student.due = Math.max(0, (parseFloat(student.totalPayment) || 0) - student.paid);

  // 3. Finance ledger থেকেও সরাও (শুধু FIRST matching entry)
  let deletedFinanceEntry = null;
  let deletedOne = false;
  globalData.finance = (globalData.finance || []).filter(f => {
    if (deletedOne) return true;
    const sameAmount = parseFloat(f.amount) === amount;
    const samePerson = f.person === student.name || (f.description && f.description.includes(student.name));
    const sameDate = !inst.date || f.date === inst.date;
    if (sameAmount && samePerson && sameDate) {
      deletedOne = true;
      deletedFinanceEntry = f;
      return false;
    }
    return true;
  });

  // 4. Account balance reverse করো
  if (deletedOne) {
    // শুধু finance entry পাওয়া গেলেই balance reverse করো
    if (typeof updateAccountBalance === 'function') {
      updateAccountBalance(method, amount, 'Income', false);
    }
  }

  // 5. Delete tracking (sync এর জন্য)
  const _delCount = parseInt(localStorage.getItem('wings_total_deleted') || '0') + 1;
  localStorage.setItem('wings_total_deleted', _delCount.toString());

  // 6. Save immediately to localStorage + cloud (IMMEDIATE push)
  localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
  if (typeof window.pushToCloud === 'function') {
    window.pushToCloud('Delete Installment: ' + student.name + ' ৳' + amount);
  } else if (typeof window.scheduleSyncPush === 'function') {
    window.scheduleSyncPush('Delete Installment: ' + student.name + ' ৳' + amount);
  } else {
    saveToStorage();
  }

  showSuccessToast('Payment deleted successfully! (Recycle Bin এ আছে)');

  // 7. Modal refresh করো
  openStudentPaymentModal(rowIndex);
  render(globalData.students);
  updateGlobalStats();
  if (typeof renderLedger === 'function') renderLedger(globalData.finance);
  if (typeof renderAccountList === 'function') renderAccountList();
  if (typeof renderCashBalance === 'function') renderCashBalance();
  if (typeof renderMobileBankingList === 'function') renderMobileBankingList();
  if (typeof updateGrandTotal === 'function') updateGrandTotal();
}

window.deleteInstallment = deleteInstallment;



function deleteStudent(rowIndex) {


  // Get student info before deleting
  const student = globalData.students[rowIndex];
  if (!student) {
    alert("Error: Student not found.");
    return;
  }

  // 0. ✅ Move to trash before deleting (Keep a safe copy)
  if (typeof moveToTrash === 'function') moveToTrash('student', student);

  if (typeof logActivity === 'function') {
    logActivity('student', 'DELETE',
      'Student moved to trash: ' + (student.name || 'Unknown') + ' | Batch: ' + (student.batch || '-') + ' | Course: ' + (student.course || '-'), student);
  }

  // Delete count track করো (sync এর জন্য)
  const _delCount = parseInt(localStorage.getItem('wings_total_deleted') || '0') + 1;
  localStorage.setItem('wings_total_deleted', _delCount.toString());

  // CRITICAL: Reverse all account balances from this student's payments
  // (Including the initial payment gap)
  const allPayments = getStudentInstallments(student);
  if (allPayments.length > 0) {
    allPayments.forEach(inst => {
      const amount = parseFloat(inst.amount) || 0;
      const method = inst.method || 'Cash';

      // Reverse the payment: deduct from account
      if (method === 'Cash') {
        globalData.cashBalance = (parseFloat(globalData.cashBalance) || 0) - amount;
      } else {
        // Check bank accounts
        let account = (globalData.bankAccounts || []).find(acc => acc.name === method);
        if (!account) {
          // Check mobile banking
          account = (globalData.mobileBanking || []).find(acc => acc.name === method);
        }
        if (account) {
          account.balance = (parseFloat(account.balance) || 0) - amount;
        }
      }
    });
  }

  // Delete related finance transactions (student payments)
  if (globalData.finance && Array.isArray(globalData.finance)) {
    const sNameLower = (student.name || '').trim().toLowerCase();
    const sId = student.studentId ? String(student.studentId).toLowerCase() : null;

    // Remove all finance entries where student name or ID matches
    globalData.finance = globalData.finance.filter(f => {
      const fPersonLower = (f.person || '').trim().toLowerCase();
      const fStudentNameLower = (f.studentName || '').trim().toLowerCase();
      const fDescLower = (f.description || '').toLowerCase();

      // Match 1: Direct name match
      const isDirectMatch = fPersonLower === sNameLower || fStudentNameLower === sNameLower;

      // Match 2: Name in description (very likely for auto-generated fees)
      const isDescMatch = fDescLower && fDescLower.includes(sNameLower);

      // Match 3: Student ID in description (most reliable if present)
      const isIdMatch = sId && fDescLower && fDescLower.includes(sId);

      // Match 4: Name variant (Description contains just the name parts)
      const nameParts = sNameLower.split(' ').filter(p => p.length > 3);
      const isNamePartMatch = nameParts.length > 0 && nameParts.some(p => fDescLower.includes(p) && f.category === 'Student Fee');

      const isMatch = isDirectMatch || isDescMatch || isIdMatch || isNamePartMatch;

      // Keep transaction if it's NOT a match
      return !isMatch;
    });
  }

  // Remove student from array
  if (rowIndex >= 0 && rowIndex < globalData.students.length) {
    globalData.students.splice(rowIndex, 1);
  } else {
    alert("Error deleting student.");
    return;
  }

  // ✅ Save locally first
  saveToStorage(true);

  // ✅ Schedule cloud sync
  if (typeof window.scheduleSyncPush === 'function') {
    window.scheduleSyncPush('Delete Student: ' + (student.name || 'Unknown'));
  }

  showSuccessToast('Student deleted successfully! (Payments reversed)');
  render(globalData.students);

  // ✅ FORCE REBUILD: Ensure accounts match finance ledger exactly
  if (typeof rebuildBankBalancesFromFinance === 'function') rebuildBankBalancesFromFinance();
  if (typeof recalculateCashBalanceFromTransactions === 'function') recalculateCashBalanceFromTransactions();

  updateGlobalStats();

  // Update account displays
  if (typeof renderAccountList === 'function') renderAccountList();
  if (typeof renderCashBalance === 'function') renderCashBalance();
  if (typeof renderMobileBankingList === 'function') renderMobileBankingList();
  if (typeof updateGrandTotal === 'function') updateGrandTotal();
}

window.deleteStudent = deleteStudent;

// ✅ V28 FIX: auto-test critical function checks — aliases যোগ করা হয়েছে
window.openStudentModal = function (index) {
  // student modal খোলে — add/edit উভয় ক্ষেত্রে
  const el = document.getElementById('studentModal');
  if (!el) return;
  if (index !== undefined && window.globalData && window.globalData.students[index]) {
    // edit mode — form populate করতে পারলে করো
  }
  const modal = bootstrap.Modal.getOrCreateInstance(el);
  modal.show();
};
// These functions are in app.js (loads after), so use deferred assignment
document.addEventListener('DOMContentLoaded', function () {
  if (typeof handleStudentSubmit !== 'undefined') window.saveStudent = handleStudentSubmit;
  if (typeof render !== 'undefined') window.renderStudents = render;
  if (typeof handleEmployeeSubmit !== 'undefined') window.saveEmployee = handleEmployeeSubmit;
});

async function handleFinanceSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('financeForm');
  const formData = {};
  new FormData(form).forEach((value, key) => formData[key] = value);

  // ✅ CRITICAL VALIDATION: Payment Method is REQUIRED
  if (!formData.method || formData.method.trim() === '') {
    showErrorToast('❌ Payment Method is required! Please select a payment method.');
    document.getElementById('financeMethodSelect').focus();
    return;
  }

  // ✅ VALIDATION: Person field is mandatory ONLY for Loan TYPES
  const type = formData.type || '';
  const person = (formData.person || '').trim();

  // Only Loan Given and Loan Received TYPE require Person field
  if ((type === 'Loan Given' || type === 'Loan Received') && !person) {
    showErrorToast('⚠️ Person/Counterparty name is required for Loan transactions!');
    return;
  }

  // Add transaction to data
  const newTransaction = {
    id: Date.now(), // Unique ID
    type: formData.type,
    method: formData.method,
    date: formData.date,
    amount: parseFloat(formData.amount) || 0,
    category: formData.category || 'General',
    description: formData.description || '',
    person: person
  };

  window.globalData.finance.push(newTransaction);
  if (typeof updateAccountBalance === "function") updateAccountBalance(newTransaction.method, newTransaction.amount, newTransaction.type);
  await saveToStorage();

  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('financeModal'));
  if (modal) modal.hide();

  // Reset form and reload
  form.reset();

  // Reset date to today
  const today = new Date().toISOString().split('T')[0];
  form.querySelector('input[name="date"]').value = today;

  showSuccessToast('Transaction added successfully!');
  if (typeof logActivity === 'function') logActivity('finance', 'ADD',
    (formData.type || 'Transaction') + ': ' + (formData.category || '') + ' - ৳' + (formData.amount || 0) + ' | ' + (formData.description || ''));
  updateGlobalStats(); if (typeof renderFinanceTable === "function") renderFinanceTable();
}

// ===================================
// ADD TRANSFER TRANSACTION
// ===================================

async function handleTransferSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('transferForm');
  const formData = {};
  new FormData(form).forEach((value, key) => formData[key] = value);

  const amount = parseFloat(formData.amount) || 0;
  const fromMethod = formData.fromMethod;
  const toMethod = formData.toMethod;
  const date = new Date().toISOString().split('T')[0];

  if (fromMethod === toMethod) {
    alert('Source and destination accounts must be different.');
    return;
  }

  // Create "Transfer Out" from source
  const outTransaction = {
    id: Date.now(),
    type: 'Transfer Out',
    method: fromMethod,
    date: date,
    amount: amount,
    category: 'Transfer',
    description: formData.description || `Transfer to ${toMethod}`
  };

  // Create "Transfer In" to destination
  const inTransaction = {
    id: Date.now() + 1,
    type: 'Transfer In',
    method: toMethod,
    date: date,
    amount: amount,
    category: 'Transfer',
    description: formData.description || `Transfer from ${fromMethod}`
  };

  globalData.finance.push(outTransaction);
  globalData.finance.push(inTransaction);

  await saveToStorage();

  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('transferModal'));
  modal.hide();

  form.reset();
  showSuccessToast('Transfer completed successfully!');
  updateGlobalStats(); if (typeof renderFinanceTable === "function") renderFinanceTable();
}

// ===================================
// DELETE TRANSACTION
// ===================================

function deleteTransaction(id) {

  // Handle both string and number IDs (localStorage/Supabase can change types)
  const sid = String(id);
  const txToDelete = globalData.finance.find(f => String(f.id) === sid);

  if (!txToDelete) {
    showErrorToast('Transaction not found.');
    renderLedger(globalData.finance);
    renderAccountDetails && renderAccountDetails();
    return;
  }

  // Hard Delete: Remove installment permanently as per user request
  // 0. ✅ Recycle Bin disabled, force hard delete
  // if (typeof moveToTrash === 'function') {
  //   moveToTrash('finance', txToDelete);
  // }
  if (typeof logActivity === 'function') {
    logActivity('finance', 'DELETE',
      `Transaction deleted (Permanent): ${txToDelete.type} | ${txToDelete.category || ''} | ৳${txToDelete.amount}`,
      txToDelete);
  }

  // 1. Account balance reverse করো
  if (typeof updateAccountBalance === "function") {
    updateAccountBalance(txToDelete.method, txToDelete.amount, txToDelete.type, false);
  }

  // 2. ✅ SAFE FIX: যদি Student Fee/Installment হয়, শুধু matching installment
  //    পাওয়া গেলেই student.paid কমাও। Auto-heal entry বা legacy entry ডিলিট
  //    করলে student.paid ছোঁয়া হবে না।
  const isStudentPayment = (
    txToDelete.type === 'Income' &&
    (txToDelete.category === 'Student Fee' || txToDelete.category === 'Student Installment')
  );

  if (isStudentPayment && txToDelete.person && globalData.students) {
    const studentName = txToDelete.person.trim();
    const student = globalData.students.find(s => (s.name || '').trim() === studentName);
    if (student) {
      const txAmount = parseFloat(txToDelete.amount) || 0;
      const txDate = txToDelete.date;

      // ✅ matching entry থাকলেই paid কমাও (Installments array-তে)
      let foundMatchingInstallment = false;
      if (student.installments && student.installments.length > 0) {
        for (let i = 0; i < student.installments.length; i++) {
          const inst = student.installments[i];
          const instAmt = parseFloat(inst.amount) || 0;
          if (instAmt === txAmount && (!txDate || inst.date === txDate)) {
            student.installments.splice(i, 1);
            foundMatchingInstallment = true;
            break;
          }
        }
      }

      // ✅ Gap Check: যদি installments এ না থাকে, তবে কি এটি "Initial Payment" (gap)?
      let isInitialGap = false;
      if (!foundMatchingInstallment) {
        const currentSum = (student.installments || []).reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
        const gap = (parseFloat(student.paid) || 0) - currentSum;
        // ৳1 এর কম পার্থক্য থাকলে match ধরো (rounding error এর জন্য)
        if (gap > 0 && Math.abs(gap - txAmount) < 1) {
          isInitialGap = true;
        }
      }

      if (foundMatchingInstallment || isInitialGap) {
        // ✅ Matching entry বা Gap পাওয়া গেছে — paid/due reverse করো
        student.paid = Math.max(0, (parseFloat(student.paid) || 0) - txAmount);
        student.due = Math.max(0, (parseFloat(student.totalPayment) || 0) - student.paid);
        console.log(`✅ Student "${studentName}" update: paid=৳${student.paid}, due=৳${student.due} (Gap: ${isInitialGap})`);

        // ⛔ USER REQUEST: যদি প্রথম/ইনিশিয়াল পেমেন্ট ডিলিট হয় এবং আর কোনো পেমেন্ট না থাকে, তবে স্টুডেন্ট ডিলিট করো
        if (student.paid <= 0 && (!student.installments || student.installments.length === 0)) {
          const sIdx = globalData.students.indexOf(student);
          if (sIdx !== -1) {
            if (typeof moveToTrash === 'function') moveToTrash('student', student);
            globalData.students.splice(sIdx, 1);
            console.log(`🗑️ Student "${studentName}" auto-deleted because all payments were removed.`);
          }
        }
      } else {
        // ⚠️ Matching installment নেই — Auto-heal entry বা legacy entry
        console.log(`ℹ️ Finance entry for "${studentName}" deleted (no matching installment/gap — student.paid unchanged)`);
      }
    }
  }

  // 3. Finance ledger থেকে সরাও
  globalData.finance = globalData.finance.filter(f => String(f.id) !== sid);

  // 4. Render FIRST so user sees the change immediately
  renderLedger(globalData.finance);
  updateGlobalStats();
  if (typeof render === 'function') render(globalData.students);
  showSuccessToast('Transaction deleted successfully!');

  // 5. Delete tracking (sync এর জন্য)
  const _dc = parseInt(localStorage.getItem('wings_total_deleted') || '0') + 1;
  localStorage.setItem('wings_total_deleted', _dc.toString());
  localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
  if (typeof window.pushToCloud === 'function') {
    window.pushToCloud('Delete Transaction: ' + (txToDelete.description || txToDelete.category || String(id)));
  } else if (typeof window.scheduleSyncPush === 'function') {
    window.scheduleSyncPush('Delete Transaction: ' + (txToDelete.description || txToDelete.category || String(id)));
  } else {
    saveToStorage();
  }

  // 6. Refresh Account Details modal if open
  const accModal = document.getElementById('accountDetailsModal');
  if (accModal && bootstrap.Modal.getInstance(accModal)) {
    renderAccountDetails();
  }

  // 7. সব Account UI refresh করো
  if (typeof renderAccountList === 'function') renderAccountList();
  if (typeof renderCashBalance === 'function') renderCashBalance();
  if (typeof renderMobileBankingList === 'function') renderMobileBankingList();
  if (typeof updateGrandTotal === 'function') updateGrandTotal();
}

// ===================================
// EDIT TRANSACTION
// ===================================

window.deleteTransaction = deleteTransaction;

// Alias for delete button in finance table
function _handleDeleteTx(id) {
  if (!id) return;
  if (!confirm('এই transaction টি delete করতে চান?')) return;
  deleteTransaction(id);
}
window._handleDeleteTx = _handleDeleteTx;

function editTransaction(id) {
  const sid = String(id);
  const transaction = globalData.finance.find(f => String(f.id) === sid);
  if (!transaction) return;

  const form = document.getElementById('editTransactionForm');
  form.transactionId.value = transaction.id;
  form.type.value = transaction.type;
  form.method.value = transaction.method || 'Cash';
  form.date.value = transaction.date;
  form.amount.value = transaction.amount;
  form.category.value = transaction.category || '';
  form.description.value = transaction.description || '';

  const el = document.getElementById('editTransactionModal');
  if (!el) return;
  const modal = bootstrap.Modal.getOrCreateInstance(el);
  modal.show();
}

window.editTransaction = editTransaction;

async function handleEditTransactionSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('editTransactionForm');
  const formData = {};
  new FormData(form).forEach((value, key) => formData[key] = value);

  // ✅ CRITICAL VALIDATION: Payment Method is REQUIRED
  if (!formData.method || formData.method.trim() === '') {
    showErrorToast('❌ Payment Method is required! Please select a payment method.');
    document.getElementById('editTransMethodSelect').focus();
    return;
  }

  const id = formData.transactionId; // keep as string/original
  const index = globalData.finance.findIndex(f => String(f.id) === String(id));

  if (index !== -1) {
    globalData.finance[index] = {
      ...globalData.finance[index],
      type: formData.type,
      method: formData.method,
      date: formData.date,
      amount: parseFloat(formData.amount) || 0,
      category: formData.category,
      description: formData.description
    };
    await saveToStorage();

    const modal = bootstrap.Modal.getInstance(document.getElementById('editTransactionModal'));
    if (modal) modal.hide();

    showSuccessToast('Transaction updated successfully!');

    // Refresh
    renderLedger(globalData.finance);
    updateGlobalStats();

    // Also refresh Account Details if open
    if (bootstrap.Modal.getInstance(document.getElementById('accountDetailsModal'))) {
      renderAccountDetails();
    }
  }
}


// Global exposures
window.getStudentInstallments = getStudentInstallments;
window.handleFinanceSubmit = handleFinanceSubmit;
window.handleTransferSubmit = handleTransferSubmit;
window.handleEditTransactionSubmit = handleEditTransactionSubmit;

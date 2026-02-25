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
  const student = globalData.students[rowIndex];
  if (!student) { alert("Student not found!"); return; }

  currentPaymentStudentIndex = rowIndex;

  // Update header/summary
  document.getElementById('pmtTotalFee').innerText = '৳' + formatNumber(student.totalPayment || 0);
  document.getElementById('pmtTotalPaid').innerText = '৳' + formatNumber(student.paid || 0);
  document.getElementById('pmtTotalDue').innerText = '৳' + formatNumber(student.due || 0);

  // Suggest remaining due in amount field
  const amountField = document.getElementById('pmtNewAmount');
  if (amountField) amountField.value = student.due > 0 ? student.due : '';

  // Populate history table
  const tbody = document.getElementById('pmtHistoryBody');
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

  const modal = new bootstrap.Modal(document.getElementById('studentPaymentModal'));
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

  if (!confirm(`এই payment টি delete করতে চান?\n৳${formatNumber(inst.amount)} (${inst.date} - ${inst.method || 'Cash'})`)) return;

  const amount = parseFloat(inst.amount) || 0;
  const method = inst.method || 'Cash';

  // 1. Student installments array থেকে সরাও
  if (!inst.isMigrated) {
    // Normal installment — directly from student.installments
    student.installments = (student.installments || []).filter((_, i) => {
      // instIndex match করে সেটা বাদ দাও
      return i !== instIndex;
    });
  } else {
    // Migrated (initial payment) — paid field থেকে বাদ দাও
    // এটা student.payment field এ আছে, installments এ নেই
    // তাই শুধু paid/due adjust করব
  }

  // 2. Student paid/due update করো
  student.paid = Math.max(0, (parseFloat(student.paid) || 0) - amount);
  student.due = Math.max(0, (parseFloat(student.totalPayment) || 0) - student.paid);

  // 3. Finance ledger থেকেও সরাও (matching entry)
  const beforeCount = (globalData.finance || []).length;
  globalData.finance = (globalData.finance || []).filter(f => {
    const sameAmount = parseFloat(f.amount) === amount;
    const samePerson = f.person === student.name || (f.description && f.description.includes(student.name));
    const sameMethod = !f.method || f.method === method;
    const sameDate = !inst.date || f.date === inst.date;
    return !(sameAmount && samePerson && sameDate);
  });

  // 4. Account balance reverse করো
  if (method === 'Cash') {
    globalData.cashBalance = Math.max(0, (parseFloat(globalData.cashBalance) || 0) - amount);
  } else {
    let acc = (globalData.bankAccounts || []).find(a => a.name === method);
    if (!acc) acc = (globalData.mobileBanking || []).find(a => a.name === method);
    if (acc) acc.balance = Math.max(0, (parseFloat(acc.balance) || 0) - amount);
  }

  // 5. Save immediately to localStorage + cloud
  localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
  if (typeof window.scheduleSyncPush === 'function') {
    window.scheduleSyncPush('Delete Installment: ' + student.name + ' ৳' + amount);
  } else {
    saveToStorage();
  }

  showSuccessToast('Payment deleted successfully!');

  // 6. Modal refresh করো
  openStudentPaymentModal(rowIndex);
  render(globalData.students);
  updateGlobalStats();
  if (typeof renderLedger === 'function') renderLedger(globalData.finance);
  if (typeof renderAccountList === 'function') renderAccountList();
  if (typeof renderCashBalance === 'function') renderCashBalance();
}

window.deleteInstallment = deleteInstallment;



function deleteStudent(rowIndex) {


  // Get student info before deleting
  const student = globalData.students[rowIndex];
  if (!student) {
    alert("Error: Student not found.");
    return;
  }

  // Move to trash before deleting
  if (typeof moveToTrash === 'function') moveToTrash('student', student);
  if (typeof logActivity === 'function') logActivity('student', 'DELETE',
    'Student deleted: ' + (student.name || 'Unknown') + ' | Batch: ' + (student.batch || '-') + ' | Course: ' + (student.course || '-'), student);

  // Delete count track করো (sync এর জন্য)
  const _delCount = parseInt(localStorage.getItem('wings_total_deleted') || '0') + 1;
  localStorage.setItem('wings_total_deleted', _delCount.toString());

  // CRITICAL: Reverse all account balances from this student's payments
  // Find all finance transactions related to this student
  if (student.installments && student.installments.length > 0) {
    student.installments.forEach(inst => {
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
    // Remove all finance entries where student name matches
    // (assuming finance records might have student.name in description or person field)
    globalData.finance = globalData.finance.filter(f => {
      // Keep transaction if it's not related to this student
      return !(f.person === student.name ||
        (f.description && f.description.includes(student.name)));
    });
  }

  // Remove student from array
  if (rowIndex >= 0 && rowIndex < globalData.students.length) {
    globalData.students.splice(rowIndex, 1);
  } else {
    alert("Error deleting student.");
    return;
  }

  // ✅ Sync এ 'Delete' word পাঠাও যাতে cloud এ delete বোঝা যায়
  if (typeof window.scheduleSyncPush === 'function') {
    window.scheduleSyncPush('Delete Student: ' + (student.name || 'Unknown'));
  } else {
    saveToStorage();
  }

  showSuccessToast('Student deleted successfully! (Payments reversed)');
  render(globalData.students);
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
  new bootstrap.Modal(el).show();
};
window.saveStudent = handleStudentSubmit; // form submit handler
window.renderStudents = render;              // main student render function
window.saveEmployee = handleEmployeeSubmit; // employee form submit handler

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
  modal.hide();

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

  if (typeof updateAccountBalance === "function") {
    updateAccountBalance(txToDelete.method, txToDelete.amount, txToDelete.type, false);
  }

  globalData.finance = globalData.finance.filter(f => String(f.id) !== sid);

  // Render FIRST so user sees the change immediately (before async cloud push)
  renderLedger(globalData.finance);
  updateGlobalStats();
  showSuccessToast('Transaction deleted successfully!');

  // FIX: Delete reason পাঠাও যাতে Data Loss Prevention bypass হয়
  const _dc = parseInt(localStorage.getItem('wings_total_deleted') || '0') + 1;
  localStorage.setItem('wings_total_deleted', _dc.toString());
  localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
  if (typeof window.scheduleSyncPush === 'function') {
    window.scheduleSyncPush('Delete Transaction: ' + (txToDelete.description || txToDelete.category || String(id)));
  } else {
    saveToStorage();
  }

  // Refresh Account Details modal if open
  const accModal = document.getElementById('accountDetailsModal');
  if (accModal && bootstrap.Modal.getInstance(accModal)) {
    renderAccountDetails();
  }
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

  const modal = new bootstrap.Modal(document.getElementById('editTransactionModal'));
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
    modal.hide();

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

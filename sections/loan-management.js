// sections/loan-management.js
// Wings Fly Aviation Academy - Loan Management Module

// ===================================
// LOAN MANAGEMENT
// ===================================

let currentLoanPerson = null;

function renderLoanSummary() {
  const container = document.getElementById('loanSummaryContainer');
  if (!container) return;
  container.innerHTML = '';

  const q = (document.getElementById('loanSearchInput')?.value || '').toLowerCase().trim();

  // Aggregate data by Person
  const personStats = {};

  globalData.finance.forEach(tx => {
    // ✅ FIX: Skip deleted transactions
    if (tx._deleted) return;
    
    let person = tx.person;
    if (!person) return; // Skip if no person assigned

    // Normalize person name
    person = person.trim();

    if (!personStats[person]) {
      personStats[person] = { given: 0, received: 0, balance: 0 };
    }

    if (tx.type === 'Loan Given') {
      personStats[person].given += tx.amount;
      personStats[person].balance -= tx.amount;
    } else if (tx.type === 'Loan Received') {
      personStats[person].received += tx.amount;
      personStats[person].balance += tx.amount;
    }
  });

  const people = Object.keys(personStats).sort();

  if (people.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-muted p-5">No loan records found. Add a transaction with a Person name and Loan type.</div>';
    return;
  }

  people.forEach(p => {
    if (q && !p.toLowerCase().includes(q)) return;

    const stats = personStats[p];

    // FILTER: Only show people with actual Loan activity
    if (stats.given === 0 && stats.received === 0) return;

    let balanceText = '';
    let balanceClass = '';

    if (stats.balance < 0) {
      balanceText = `They Owe: ৳${formatNumber(Math.abs(stats.balance))}`;
      balanceClass = 'text-danger';
    } else if (stats.balance > 0) {
      balanceText = `We Owe: ৳${formatNumber(stats.balance)}`;
      balanceClass = 'text-success';
    } else {
      balanceText = 'Settled';
      balanceClass = 'text-muted';
    }

    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3';
    col.innerHTML = `
      <div class="card h-100 shadow-sm border-0 person-loan-card" style="cursor: pointer; transition: transform 0.2s; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px);" onclick="openLoanDetail('${p.replace(/'/g, "\\'")}')">
        <div class="card-body text-center">
            <div class="mb-3">
                <span class="avatar-circle bg-primary-light text-primary fw-bold fs-4 d-inline-block rounded-circle" style="width: 50px; height: 50px; line-height: 50px;">
                    ${p.charAt(0).toUpperCase()}
                </span>
            </div>
            <h5 class="card-title fw-bold text-white mb-1" style="color: #ffffff !important;">${p}</h5>
            <div class="mb-3 ${balanceClass} fw-bold fs-5">${balanceText}</div>
            
            <div class="d-flex justify-content-between small border-top pt-2" style="color: rgba(255, 255, 255, 0.7);">
                <span>Given: ৳${formatNumber(stats.given)}</span>
                <span>Recv: ৳${formatNumber(stats.received)}</span>
            </div>
        </div>
      </div>
    `;

    // Hover effect helper
    col.querySelector('.card').onmouseover = function () { this.style.transform = 'translateY(-5px)'; }
    col.querySelector('.card').onmouseout = function () { this.style.transform = 'translateY(0)'; }

    container.appendChild(col);
  });
}

function filterLoanSummary() {
  renderLoanSummary();
}

function openLoanDetail(person) {
  currentLoanPerson = person;
  const detailView = document.getElementById('loanDetailView');
  const title = document.getElementById('loanDetailTitle');
  const tbody = document.getElementById('loanDetailBody');
  const footVal = document.getElementById('loanDetailBalance');

  if (detailView) detailView.classList.remove('d-none');
  if (title) title.innerText = `Ledger: ${person}`;
  if (tbody) tbody.innerHTML = '';

  // ✅ FIX: Exclude deleted transactions
  let txs = globalData.finance.filter(tx => !tx._deleted && tx.person === person).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Date Range Filtering
  const start = document.getElementById('loanDetailStartDate').value;
  const end = document.getElementById('loanDetailEndDate').value;

  if (start) {
    txs = txs.filter(tx => tx.date >= start);
  }
  if (end) {
    txs = txs.filter(tx => tx.date <= end);
  }

  let runningBalance = 0;
  let rowNum = 1;

  txs.forEach(tx => {
    let credit = 0;
    let debit = 0;
    let typeLabel = tx.type;

    if (tx.type === 'Loan Given' || tx.type === 'Expense') {
      debit = tx.amount;
      runningBalance -= tx.amount;
    } else if (tx.type === 'Loan Received' || tx.type === 'Income') {
      credit = tx.amount;
      runningBalance += tx.amount;
    } else {
      debit = tx.amount;
      runningBalance -= tx.amount;
    }

    let balanceClass = '';
    let balancePrefix = '';
    if (runningBalance < 0) {
      balanceClass = 'text-danger fw-bold';
      balancePrefix = 'Adv ';
    } else if (runningBalance > 0) {
      balanceClass = 'text-success fw-bold';
      balancePrefix = 'Adv ';
    } else {
      balanceClass = 'text-muted';
      balancePrefix = '';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td class="text-muted small">${rowNum}</td>
            <td>${tx.date}</td>
            <td><span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:700;letter-spacing:0.5px;${debit > 0 ? 'background:rgba(255,71,87,0.15);color:#ff4757;border:1.5px solid #ff4757;' : 'background:rgba(0,230,118,0.12);color:#00e676;border:1.5px solid #00e676;'}">${typeLabel}</span></td>
            <td class="small">${tx.description || '-'}</td>
            <td class="text-end text-danger fw-bold">${debit > 0 ? formatNumber(debit) : '-'}</td>
            <td class="text-end text-success fw-bold">${credit > 0 ? formatNumber(credit) : '-'}</td>
            <td class="text-end ${balanceClass}">${balancePrefix}${formatNumber(Math.abs(runningBalance))}</td>
            <td class="text-center">
              <button class="btn btn-sm btn-outline-primary me-1 loan-edit-btn" onclick="editTransaction('${tx.id}')" title="Edit" style="padding:2px 7px;font-size:0.75rem;">✏️</button>
              <button class="btn btn-sm btn-outline-danger loan-delete-btn" onclick="deleteLoanTransaction('${tx.id}')" title="Delete" style="padding:2px 7px;font-size:0.75rem;">🗑️</button>
            </td>
        `;
    tbody.appendChild(tr);
    rowNum++;
  });

  if (footVal) {
    if (runningBalance < 0) {
      footVal.innerHTML = `<span class="text-danger">They Owe: ৳${formatNumber(Math.abs(runningBalance))}</span>`;
    } else if (runningBalance > 0) {
      footVal.innerHTML = `<span class="text-success">We Owe: ৳${formatNumber(runningBalance)}</span>`;
    } else {
      footVal.innerHTML = `<span class="text-muted">Settled</span>`;
    }
  }

  detailView.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeLoanDetail() {
  const detailView = document.getElementById('loanDetailView');
  if (detailView) detailView.classList.add('d-none');
  currentLoanPerson = null;
}

function printLoanDetail() {
  if (!currentLoanPerson) return;

  const detailView = document.getElementById('loanDetailView');
  if (!detailView) return;

  const clone = detailView.cloneNode(true);
  clone.classList.remove('d-none');

  clone.querySelectorAll('.loan-edit-btn, .loan-delete-btn').forEach(btn => btn.remove());

  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Loan Ledger - ${currentLoanPerson}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body { padding: 20px; background: white; color: black; }
        .card { border: 1px solid #ddd !important; }
        .card-header { background: #f8f9fa !important; color: #000 !important; border-bottom: 2px solid #000 !important; }
        table { border: 1px solid #000 !important; }
        thead { background: #f0f0f0 !important; }
        th, td { border: 1px solid #ddd !important; color: #000 !important; }
        .text-danger { color: #dc3545 !important; }
        .text-success { color: #28a745 !important; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h2 class="text-center mb-4">Wings Fly Aviation Academy</h2>
      <h4 class="text-center mb-4">Loan Ledger: ${currentLoanPerson}</h4>
      ${clone.innerHTML}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function checkPersonBalance(person) {
  const txs = globalData.finance.filter(tx => !tx._deleted && tx.person === person);
  let balance = 0;
  txs.forEach(tx => {
    if (tx.type === 'Loan Given') balance -= tx.amount;
    else if (tx.type === 'Loan Received') balance += tx.amount;
  });
  return balance;
}

window.renderLoanSummary = renderLoanSummary;
window.filterLoanSummary = filterLoanSummary;
window.openLoanDetail = openLoanDetail;
window.closeLoanDetail = closeLoanDetail;
window.printLoanDetail = printLoanDetail;
window.checkPersonBalance = checkPersonBalance;

// ===================================
// DELETE LOAN TRANSACTION
// ===================================
function deleteLoanTransaction(id) {
  if (!id) return;
  if (!confirm('এই Loan transaction টি delete করতে চান?\n(অ্যাকাউন্ট ব্যালেন্স অটো-অ্যাডজাস্ট হবে এবং Recycle Bin-এ পাঠানো হবে)')) return;

  const sid = String(id);
  const tx = (window.globalData.finance || []).find(f => String(f.id) === sid);

  if (!tx) {
    console.error('[LoanDelete] ID not found:', sid);
    const numericId = Number(id);
    if (!isNaN(numericId)) {
      const tx2 = (window.globalData.finance || []).find(f => Number(f.id) === numericId);
      if (tx2) {
        _executeLoanDeletion(tx2);
        return;
      }
    }
    if (typeof showErrorToast === 'function') showErrorToast('Transaction not found or already deleted.');
    return;
  }

  _executeLoanDeletion(tx);
}

function _executeLoanDeletion(tx) {
  const sid = String(tx.id);

  // ✅ FIX: Use finance-engine's soft delete function
  if (typeof window.feSoftDeleteEntry === 'function') {
    window.feSoftDeleteEntry(sid);
  } else {
    // Fallback to old method
    if (typeof updateAccountBalance === 'function') {
      updateAccountBalance(tx.method, tx.amount, tx.type, false);
    }
    tx._deleted = true;
    tx._deletedAt = new Date().toISOString();
  }

  if (typeof moveToTrash === 'function') moveToTrash('finance', tx);

  if (typeof logActivity === 'function') {
    logActivity('finance', 'DELETE',
      `Loan Transaction Deleted: ${tx.description || tx.type} — ৳${tx.amount} | Person: ${tx.person || '-'}`,
      tx
    );
  }

  if (typeof saveToStorage === 'function') {
    saveToStorage(true);
  } else {
    localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
  }

  if (typeof window.scheduleSyncPush === 'function') {
    window.scheduleSyncPush('Loan deleted: ' + (tx.person || 'Unknown'));
  }

  // ✅ Refresh UI - now properly excludes deleted transactions
  if (typeof updateGlobalStats === 'function') updateGlobalStats();
  if (typeof renderLoanSummary === 'function') renderLoanSummary();
  if (window.currentLoanPerson) openLoanDetail(window.currentLoanPerson);

  if (typeof showSuccessToast === 'function') showSuccessToast('✅ Loan deleted and balance adjusted!');
}

window.deleteLoanTransaction = deleteLoanTransaction;

// ===================================
// EDIT TRANSACTION
// ===================================
function editTransaction(txId) {
  const sid = String(txId);
  const tx = (window.globalData.finance || []).find(f => String(f.id) === sid);
  if (!tx) {
    if (typeof showErrorToast === 'function') showErrorToast('Transaction not found.');
    return;
  }

  const modal = document.getElementById('editTransactionModal');
  const form = document.getElementById('editTransactionForm');
  if (!modal || !form) {
    if (typeof showErrorToast === 'function') showErrorToast('Edit modal not found in HTML.');
    return;
  }

  form.elements['transactionId'].value = sid;
  form.elements['type'].value = tx.type || 'Income';
  form.elements['date'].value = tx.date || '';
  form.elements['amount'].value = tx.amount || '';
  form.elements['category'].value = tx.category || '';
  form.elements['description'].value = tx.description || tx.notes || '';

  const methodSelect = document.getElementById('editTransMethodSelect');
  if (methodSelect) {
    methodSelect.innerHTML = '';

    const cashOpt = document.createElement('option');
    cashOpt.value = 'Cash';
    cashOpt.textContent = 'Cash';
    methodSelect.appendChild(cashOpt);

    (window.globalData.accounts || []).forEach(acc => {
      const opt = document.createElement('option');
      opt.value = acc.name;
      opt.textContent = acc.name;
      methodSelect.appendChild(opt);
    });

    (window.globalData.mobileBanking || []).forEach(mb => {
      const opt = document.createElement('option');
      opt.value = mb.name;
      opt.textContent = mb.name;
      methodSelect.appendChild(opt);
    });

    methodSelect.value = tx.method || 'Cash';
  }

  try {
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  } catch (err) {
    console.error('editTransaction modal error:', err);
  }
}

async function handleEditTransactionSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);

  const txId = String(fd.get('transactionId'));
  const idx = (window.globalData.finance || []).findIndex(f => String(f.id) === txId);
  if (idx === -1) {
    if (typeof showErrorToast === 'function') showErrorToast('Transaction not found to update.');
    return;
  }

  const oldTx = window.globalData.finance[idx];

  if (typeof updateAccountBalance === 'function') {
    updateAccountBalance(oldTx.method, oldTx.amount, oldTx.type, false);
  }

  const updatedTx = {
    ...oldTx,
    type: fd.get('type'),
    method: fd.get('method'),
    date: fd.get('date'),
    amount: parseFloat(fd.get('amount')) || 0,
    category: fd.get('category') || oldTx.category,
    description: fd.get('description') || '',
    notes: fd.get('description') || oldTx.notes || '',
    lastEdited: new Date().toISOString()
  };

  window.globalData.finance[idx] = updatedTx;

  if (typeof updateAccountBalance === 'function') {
    updateAccountBalance(updatedTx.method, updatedTx.amount, updatedTx.type, true);
  }

  if (typeof saveToStorage === 'function') await saveToStorage();

  const modalEl = document.getElementById('editTransactionModal');
  if (modalEl) {
    const bsModal = bootstrap.Modal.getInstance(modalEl);
    if (bsModal) bsModal.hide();
  }

  if (typeof renderLedger === 'function') renderLedger(window.globalData.finance);
  if (typeof updateGlobalStats === 'function') updateGlobalStats();
  if (typeof renderLoanSummary === 'function') renderLoanSummary();
  if (window.currentLoanPerson && typeof openLoanDetail === 'function') {
    openLoanDetail(window.currentLoanPerson);
  }

  if (typeof showSuccessToast === 'function') showSuccessToast('✅ Transaction updated successfully!');
  if (typeof logActivity === 'function') {
    logActivity('finance', 'EDIT', 'Updated transaction: ' + updatedTx.type + ' | ' + updatedTx.category + ' | ৳' + updatedTx.amount + ' (Person: ' + (updatedTx.person || '-') + ')');
  }
}

window.editTransaction = editTransaction;
window.handleEditTransactionSubmit = handleEditTransactionSubmit;

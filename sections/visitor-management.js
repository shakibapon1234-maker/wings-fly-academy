// sections/visitor-management.js
// Wings Fly Aviation Academy

// VISITOR MANAGEMENT — FULL MODULE
// ===================================

// ── Submit (Add / Edit) ──
async function handleVisitorSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const data = {};
  fd.forEach((v, k) => data[k] = v);

  const name = (data.visitorName || '').trim();
  const phone = (data.visitorPhone || '').trim();
  const visitDate = (data.visitDate || '').trim();

  if (!name) { showErrorToast('❌ Visitor name is required.'); return; }
  if (!phone) { showErrorToast('❌ Phone number is required.'); return; }
  if (!visitDate) { showErrorToast('❌ Visit date is required.'); return; }

  const editIndex = data.visitorRowIndex !== '' && data.visitorRowIndex !== undefined
    ? parseInt(data.visitorRowIndex) : -1;

  const visitor = {
    name: name,
    phone: phone,
    course: data.interestedCourse || '',
    date: visitDate,
    remarks: (data.visitorRemarks || '').trim(),
    addedAt: new Date().toISOString()
  };

  if (!window.globalData.visitors) window.globalData.visitors = [];

  if (editIndex >= 0 && window.globalData.visitors[editIndex]) {
    visitor.addedAt = window.globalData.visitors[editIndex].addedAt;
    window.globalData.visitors[editIndex] = visitor;
    showSuccessToast('✅ Visitor updated successfully!');
  } else {
    window.globalData.visitors.push(visitor);
    showSuccessToast('✅ Visitor added successfully!');
  }

  await saveToStorage();

  // Close modal
  const modalEl = document.getElementById('visitorModal');
  const modal = bootstrap.Modal.getInstance(modalEl);
  if (modal) modal.hide();

  // Reset form
  form.reset();
  document.getElementById('visitorRowIndex').value = '';
  const title = document.getElementById('visitorModalTitle');
  if (title) title.innerHTML = `<span class="me-2 header-icon-circle bg-primary-light">👤</span>Visitor Information`;

  renderVisitors();
}

// ── Render table ──
function renderVisitors() {
  const tbody = document.getElementById('visitorTableBody');
  const noMsg = document.getElementById('noVisitorsMessage');
  if (!tbody) return;

  const q = (document.getElementById('visitorSearchInput')?.value || '').toLowerCase().trim();
  const start = document.getElementById('visitorStartDate')?.value || '';
  const end = document.getElementById('visitorEndDate')?.value || '';

  let list = (window.globalData.visitors || []).slice();

  // Filter
  if (q) {
    list = list.filter(v =>
      (v.name || '').toLowerCase().includes(q) ||
      (v.phone || '').toLowerCase().includes(q) ||
      (v.course || '').toLowerCase().includes(q)
    );
  }
  if (start) list = list.filter(v => v.date >= start);
  if (end) list = list.filter(v => v.date <= end);

  // Sort newest first
  list = list.slice().reverse();

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5">
          <i class="bi bi-person-x fs-2 d-block mb-2 opacity-50"></i>
          <span class="text-muted">${q || start || end ? 'No visitors match your filter.' : 'No visitors yet. Click "Add New Visitor" to start.'}</span>
        </td>
      </tr>`;
    if (noMsg) noMsg.classList.add('d-none');
    return;
  }

  // Find real index (before reverse) for edit/delete
  const allVisitors = window.globalData.visitors || [];

  tbody.innerHTML = list.map(v => {
    const realIndex = allVisitors.indexOf(v) >= 0
      ? allVisitors.indexOf(v)
      : allVisitors.findIndex(x => x.addedAt === v.addedAt && x.name === v.name);

    return `
      <tr>
        <td style="padding:0.75rem 1rem; font-weight:600;">${v.date || '—'}</td>
        <td style="padding:0.75rem 1rem; font-weight:700;">${v.name}</td>
        <td style="padding:0.75rem 1rem;">
          <a href="tel:${v.phone}" style="color:inherit; text-decoration:none;">
            <i class="bi bi-telephone-fill me-1 text-success"></i>${v.phone}
          </a>
        </td>
        <td style="padding:0.75rem 1rem;">
          ${v.course
        ? `<span class="badge rounded-pill px-3" style="background:rgba(0,217,255,0.15); color:#00d9ff; border:1px solid rgba(0,217,255,0.3);">${v.course}</span>`
        : `<span class="text-muted small">—</span>`}
        </td>
        <td style="padding:0.75rem 1rem; font-size:0.88rem; color:rgba(255,255,255,0.6);">${v.remarks || '—'}</td>
        <td style="padding:0.75rem 1rem; text-align:right;">
          <button class="btn btn-sm btn-outline-primary rounded-pill me-1 px-3" onclick="editVisitor(${realIndex})">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="deleteVisitor(${realIndex})">
            <i class="bi bi-trash-fill"></i>
          </button>
        </td>
      </tr>`;
  }).join('');

  if (noMsg) noMsg.classList.add('d-none');
}

// ── Search (called from filter inputs) ──
function searchVisitors() {
  renderVisitors();
}

// ── Clear filters ──
function clearVisitorFilters() {
  const s = document.getElementById('visitorSearchInput');
  const d1 = document.getElementById('visitorStartDate');
  const d2 = document.getElementById('visitorEndDate');
  if (s) s.value = '';
  if (d1) d1.value = '';
  if (d2) d2.value = '';
  renderVisitors();
}

// ── Edit ──
function editVisitor(index) {
  const visitors = window.globalData.visitors || [];
  const v = visitors[index];
  if (!v) return;

  const form = document.getElementById('visitorForm');
  if (!form) return;

  form.elements['visitorName'].value = v.name || '';
  form.elements['visitorPhone'].value = v.phone || '';
  form.elements['visitDate'].value = v.date || '';
  form.elements['visitorRemarks'].value = v.remarks || '';

  // Course select
  const courseSelect = document.getElementById('visitorCourseSelect');
  if (courseSelect && v.course) courseSelect.value = v.course;

  document.getElementById('visitorRowIndex').value = index;

  const title = document.getElementById('visitorModalTitle');
  if (title) title.innerHTML = `<span class="me-2 header-icon-circle bg-warning-subtle">✏️</span>Edit Visitor`;

  const modal = new bootstrap.Modal(document.getElementById('visitorModal'));
  modal.show();
}

// ── Delete ──
async function deleteVisitor(index) {
  if (!confirm('Delete this visitor record?')) return;
  const visitors = window.globalData.visitors || [];
  if (!visitors[index]) return;
  visitors.splice(index, 1);
  await saveToStorage();
  showSuccessToast('🗑️ Visitor deleted.');
  renderVisitors();
}

// ── Auto-set today's date when modal opens ──
document.addEventListener('DOMContentLoaded', () => {
  const visitorModal = document.getElementById('visitorModal');
  if (visitorModal) {
    visitorModal.addEventListener('show.bs.modal', () => {
      const dateInput = document.getElementById('visitorDateInput');
      const indexInput = document.getElementById('visitorRowIndex');
      // Only set today if adding new (not editing)
      if (dateInput && (!indexInput || indexInput.value === '')) {
        dateInput.value = new Date().toISOString().split('T')[0];
      }
    });
  }
});

// Global expose
window.handleVisitorSubmit = handleVisitorSubmit;
window.renderVisitors = renderVisitors;
window.searchVisitors = searchVisitors;
window.clearVisitorFilters = clearVisitorFilters;
window.editVisitor = editVisitor;
window.deleteVisitor = deleteVisitor;

// ── Delete & Edit Transaction Event Delegation ───────────────────────────────
// Uses ledgerTableBody directly to avoid document-level conflicts (GitHub Pages blocks confirm())
function attachLedgerListeners() {
  const tbody = document.getElementById('ledgerTableBody');
  if (!tbody || tbody._listenersAttached) return;
  tbody._listenersAttached = true;

  tbody.addEventListener('click', function (e) {
    // Edit button
    const editBtn = e.target.closest('.edit-tx-btn');
    if (editBtn) {
      e.stopImmediatePropagation();
      const txId = editBtn.getAttribute('data-txid');
      if (txId && typeof editTransaction === 'function') editTransaction(txId);
      return;
    }

    // Delete button
    const delBtn = e.target.closest('.del-tx-btn');
    if (!delBtn) return;
    e.stopImmediatePropagation();

    const sid = String(delBtn.getAttribute('data-txid'));
    const tx = (window.globalData.finance || []).find(f => String(f.id) === sid);

    if (tx) {
      if (typeof moveToTrash === 'function') moveToTrash('finance', tx);
      if (typeof logActivity === 'function') logActivity('finance', 'DELETE',
        'Transaction deleted: ' + (tx.type || '') + ' | ' + (tx.category || '') + ' - ৳' + (tx.amount || 0), tx);
      if (typeof updateAccountBalance === 'function') updateAccountBalance(tx.method, tx.amount, tx.type, false);
    }

    window.globalData.finance = (window.globalData.finance || []).filter(f => String(f.id) !== sid);
    if (typeof renderLedger === 'function') renderLedger(window.globalData.finance);
    if (typeof updateGlobalStats === 'function') updateGlobalStats();
    if (typeof showSuccessToast === 'function') showSuccessToast('Transaction deleted!');
    if (typeof saveToStorage === 'function') saveToStorage();

    const accModal = document.getElementById('accountDetailsModal');
    if (accModal && bootstrap.Modal.getInstance(accModal)) {
      if (typeof renderAccountDetails === 'function') renderAccountDetails();
    }
  });
}

// Attach on DOM ready and also after every renderLedger call
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(attachLedgerListeners, 500);
});
setTimeout(attachLedgerListeners, 2500);

// Use event delegation on document level as fallback (always works)
document.addEventListener('click', function (e) {
  // Delete button fallback
  const delBtn = e.target.closest('.del-tx-btn');
  if (delBtn) {
    e.stopImmediatePropagation();
    const sid = String(delBtn.getAttribute('data-txid'));
    const tx = (window.globalData.finance || []).find(f => String(f.id) === sid);
    if (tx) {
      if (typeof moveToTrash === 'function') moveToTrash('finance', tx);
      if (typeof logActivity === 'function') logActivity('finance', 'DELETE',
        'Transaction deleted: ' + (tx.type || '') + ' | ' + (tx.category || '') + ' - ৳' + (tx.amount || 0), tx);
      if (typeof updateAccountBalance === 'function') updateAccountBalance(tx.method, tx.amount, tx.type, false);
    }
    window.globalData.finance = (window.globalData.finance || []).filter(f => String(f.id) !== sid);
    if (typeof renderLedger === 'function') renderLedger(window.globalData.finance);
    if (typeof updateGlobalStats === 'function') updateGlobalStats();
    if (typeof showSuccessToast === 'function') showSuccessToast('Transaction deleted!');
    if (typeof saveToStorage === 'function') saveToStorage();
    const accModal = document.getElementById('accountDetailsModal');
    if (accModal && typeof bootstrap !== 'undefined' && bootstrap.Modal.getInstance(accModal)) {
      if (typeof renderAccountDetails === 'function') renderAccountDetails();
    }
    return;
  }

  // Edit button fallback
  const editBtn = e.target.closest('.edit-tx-btn');
  if (editBtn) {
    const txId = editBtn.getAttribute('data-txid');
    if (txId && typeof editTransaction === 'function') editTransaction(txId);
    return;
  }
});


// =====================================================

// === GLOBAL EXPOSURE ===
window.attachLedgerListeners = attachLedgerListeners;

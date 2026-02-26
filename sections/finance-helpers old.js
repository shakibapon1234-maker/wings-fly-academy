// sections/finance-helpers.js
// Wings Fly Aviation Academy
// ─────────────────────────────────────────────────────────────
// এই ফাইলে আছে:
//  1. updateFinanceCategoryOptions()  — Add Transaction modal category dropdown
//  2. addIncomeCategory / addExpenseCategory / renderSettingsLists — Settings sync
//  3. Auto-test alias fixes: renderEmployees, openVisitorModal, renderNoticeBoard
// ─────────────────────────────────────────────────────────────

// =============================================
// 1. FINANCE MODAL — CATEGORY DROPDOWN
// =============================================

function updateFinanceCategoryOptions() {
  const typeSelect = document.querySelector('#financeForm select[name="type"]');
  const catSelect  = document.getElementById('financeCategorySelect');
  if (!typeSelect || !catSelect) return;

  const type = typeSelect.value;
  const gd   = window.globalData || {};

  let categories = [];

  if (type === 'Income') {
    categories = gd.incomeCategories || [];
  } else if (type === 'Expense') {
    categories = gd.expenseCategories || [];
  } else if (type === 'Loan Given') {
    categories = ['Loan Given'];
  } else if (type === 'Loan Received') {
    categories = ['Loan Received'];
  } else {
    categories = (gd.incomeCategories || []).concat(gd.expenseCategories || []);
  }

  catSelect.innerHTML = categories.length
    ? categories.map(c => `<option value="${c}">${c}</option>`).join('')
    : '<option value="">— No categories —</option>';
}

window.updateFinanceCategoryOptions = updateFinanceCategoryOptions;

// Modal খোলার সময় category আপডেট করো
document.addEventListener('DOMContentLoaded', function () {
  const financeModal = document.getElementById('financeModal');
  if (financeModal) {
    financeModal.addEventListener('show.bs.modal', function () {
      // Default type = Income হলে category আপডেট করো
      setTimeout(updateFinanceCategoryOptions, 50);
    });
  }
});


// =============================================
// 2. SETTINGS — INCOME / EXPENSE CATEGORIES
// =============================================

function renderSettingsLists() {
  const gd = window.globalData || {};

  // Income category list
  const incomeList = document.getElementById('settingsIncomeCatList');
  if (incomeList) {
    const cats = gd.incomeCategories || [];
    incomeList.innerHTML = cats.length
      ? cats.map((c, i) => `
          <li class="d-flex justify-content-between align-items-center mb-1 px-2 py-1 rounded" style="background:rgba(255,255,255,0.05);">
            <span>${c}</span>
            <button class="btn btn-sm btn-outline-danger border-0 py-0 px-1" onclick="removeIncomeCategory(${i})" title="Remove">✕</button>
          </li>`).join('')
      : '<li class="text-muted small px-2">কোনো category নেই</li>';
  }

  // Expense category list
  const expenseList = document.getElementById('settingsExpenseCatList');
  if (expenseList) {
    const cats = gd.expenseCategories || [];
    expenseList.innerHTML = cats.length
      ? cats.map((c, i) => `
          <li class="d-flex justify-content-between align-items-center mb-1 px-2 py-1 rounded" style="background:rgba(255,255,255,0.05);">
            <span>${c}</span>
            <button class="btn btn-sm btn-outline-danger border-0 py-0 px-1" onclick="removeExpenseCategory(${i})" title="Remove">✕</button>
          </li>`).join('')
      : '<li class="text-muted small px-2">কোনো category নেই</li>';
  }
}

function addIncomeCategory() {
  const input = document.getElementById('newIncomeCatInput');
  if (!input) return;
  const val = input.value.trim();
  if (!val) { if (typeof showErrorToast === 'function') showErrorToast('Category name লিখুন!'); return; }

  if (!window.globalData.incomeCategories) window.globalData.incomeCategories = [];
  if (window.globalData.incomeCategories.includes(val)) {
    if (typeof showErrorToast === 'function') showErrorToast('এই category আগেই আছে!');
    return;
  }

  window.globalData.incomeCategories.push(val);
  input.value = '';

  if (typeof saveToStorage === 'function') saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions(); // modal dropdown সাথে সাথে sync
  if (typeof showSuccessToast === 'function') showSuccessToast('✅ Income category যোগ হয়েছে!');
}

function removeIncomeCategory(index) {
  if (!window.globalData.incomeCategories) return;
  window.globalData.incomeCategories.splice(index, 1);
  if (typeof saveToStorage === 'function') saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
}

function addExpenseCategory() {
  const input = document.getElementById('newExpenseCatInput');
  if (!input) return;
  const val = input.value.trim();
  if (!val) { if (typeof showErrorToast === 'function') showErrorToast('Category name লিখুন!'); return; }

  if (!window.globalData.expenseCategories) window.globalData.expenseCategories = [];
  if (window.globalData.expenseCategories.includes(val)) {
    if (typeof showErrorToast === 'function') showErrorToast('এই category আগেই আছে!');
    return;
  }

  window.globalData.expenseCategories.push(val);
  input.value = '';

  if (typeof saveToStorage === 'function') saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
  if (typeof showSuccessToast === 'function') showSuccessToast('✅ Expense category যোগ হয়েছে!');
}

function removeExpenseCategory(index) {
  if (!window.globalData.expenseCategories) return;
  window.globalData.expenseCategories.splice(index, 1);
  if (typeof saveToStorage === 'function') saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
}

window.renderSettingsLists = renderSettingsLists;
window.addIncomeCategory    = addIncomeCategory;
window.removeIncomeCategory = removeIncomeCategory;
window.addExpenseCategory   = addExpenseCategory;
window.removeExpenseCategory= removeExpenseCategory;


// =============================================
// 3. AUTO-TEST ALIAS FIXES
// =============================================

// renderEmployees → renderEmployeeList (employee-management.js এ আছে)
if (!window.renderEmployees) {
  window.renderEmployees = function () {
    if (typeof window.renderEmployeeList === 'function') return window.renderEmployeeList();
    console.warn('renderEmployeeList not ready yet');
  };
}

// openVisitorModal → visitorModal Bootstrap modal open
window.openVisitorModal = function () {
  const el = document.getElementById('visitorModal');
  if (!el) { console.warn('visitorModal element not found'); return; }
  // Reset form for new entry
  const form = document.getElementById('visitorForm');
  if (form) {
    form.reset();
    const idxInput = document.getElementById('visitorRowIndex');
    if (idxInput) idxInput.value = '';
    const title = document.getElementById('visitorModalTitle');
    if (title) title.innerHTML = `<span class="me-2 header-icon-circle bg-primary-light">👤</span>Visitor Information`;
  }
  new bootstrap.Modal(el).show();
};

// renderNoticeBoard → notice-board.js এর functions call করে
window.renderNoticeBoard = function () {
  if (typeof window.getActiveNotice === 'function') window.getActiveNotice();
  if (typeof window.updateSidebarNoticeDot === 'function') window.updateSidebarNoticeDot();
};

// =============================================
// 4. SETTINGS TAB OPEN — renderSettingsLists auto-call
// =============================================
document.addEventListener('DOMContentLoaded', function () {
  // Settings-এ category tab খুললে list render করো
  const configTab = document.querySelector('[data-settings-tab="config"], [onclick*="tab-config"]');
  if (configTab) {
    configTab.addEventListener('click', function () {
      setTimeout(renderSettingsLists, 100);
    });
  }
});

console.log('✅ finance-helpers.js loaded — category dropdown, settings sync & auto-test aliases ready');

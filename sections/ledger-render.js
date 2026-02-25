// ====================================
// WINGS FLY AVIATION ACADEMY
// LEDGER RENDER — DROPDOWNS, SETTINGS LISTS, CATEGORY MANAGEMENT
// Extracted from app.js (Phase 2)
// ====================================

// ===================================
// DYNAMIC DROPDOWNS & SETTINGS MANAGEMENT
// ===================================

function populateDropdowns() {
  const courses = globalData.courseNames || [];

  const courseSelects = [
    'studentCourseSelect',
    'visitorCourseSelect',
    'examSubjectSelect'
  ];

  courseSelects.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const currentVal = el.value;
      el.innerHTML = '';

      if (id === 'visitorCourseSelect') {
        el.innerHTML = '<option value="">Select Interested Course...</option>';
      } else if (id === 'examSubjectSelect') {
        el.innerHTML = '<option value="">Select Course...</option>';
      }

      courses.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.innerText = c;
        el.appendChild(opt);
      });

      if (currentVal && courses.includes(currentVal)) {
        el.value = currentVal;
      }
    }
  });

  const methodSelects = [
    'studentMethodSelect',
    'financeMethodSelect',
    'transferFromSelect',
    'transferToSelect',
    'editTransMethodSelect',
    'ledgerMethodFilter',
    'examPaymentMethodSelect',
    'pmtNewMethod',
    'accTransferFrom',
    'accTransferTo'
  ];

  methodSelects.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const currentVal = el.value;
      el.innerHTML = '';

      // Add default option
      if (id === 'ledgerMethodFilter') {
        const opt = document.createElement('option');
        opt.value = '';
        opt.innerText = 'All Methods';
        el.appendChild(opt);
      } else {
        const opt = document.createElement('option');
        opt.value = '';
        opt.innerText = 'Select Payment Method';
        el.appendChild(opt);
      }

      // Add Cash option FIRST
      const cashBal = parseFloat(window.globalData.cashBalance) || 0;
      const cashOpt = document.createElement('option');
      cashOpt.value = 'Cash';
      cashOpt.innerText = `💵 Cash  —  ৳${formatNumber(cashBal)}`;
      cashOpt.style.backgroundColor = '#1a1f3a';
      cashOpt.style.color = '#00ff88';
      el.appendChild(cashOpt);

      // Add ONLY bank accounts
      const bankAccounts = window.globalData.bankAccounts || [];
      bankAccounts.forEach(account => {
        const bal = parseFloat(account.balance) || 0;
        const opt = document.createElement('option');
        opt.value = account.name;
        opt.innerText = `🏦 ${account.name} (${account.bankName})  —  ৳${formatNumber(bal)}`;
        opt.style.backgroundColor = '#1a1f3a';
        opt.style.color = '#00d9ff';
        el.appendChild(opt);
      });

      // Add ONLY mobile banking accounts
      const mobileAccounts = window.globalData.mobileBanking || [];
      mobileAccounts.forEach(account => {
        const bal = parseFloat(account.balance) || 0;
        const opt = document.createElement('option');
        opt.value = account.name;
        opt.innerText = `📱 ${account.name}  —  ৳${formatNumber(bal)}`;
        opt.style.backgroundColor = '#1a1f3a';
        opt.style.color = '#ff2d95';
        el.appendChild(opt);
      });

      if (currentVal && (currentVal === 'Cash' || bankAccounts.some(a => a.name === currentVal) || mobileAccounts.some(a => a.name === currentVal) || currentVal === '')) {
        el.value = currentVal;
      }
    }
  });

  if (typeof renderSettingsLists === 'function') renderSettingsLists();
}
window.populateDropdowns = populateDropdowns;

function renderSettingsLists() {
  const incCats = window.globalData.incomeCategories || [];
  const expCats = window.globalData.expenseCategories || [];

  // Income List
  const incList = document.getElementById('settingsIncomeCatList');
  if (incList) {
    incList.innerHTML = '';
    incCats.forEach(c => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `${c} <button class="btn btn-sm btn-outline-danger" onclick="deleteIncomeCategory('${c}')">&times;</button>`;
      incList.appendChild(li);
    });
  }

  // Expense List
  const expList = document.getElementById('settingsExpenseCatList');
  if (expList) {
    expList.innerHTML = '';
    expCats.forEach(c => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `${c} <button class="btn btn-sm btn-outline-danger" onclick="deleteExpenseCategory('${c}')">&times;</button>`;
      expList.appendChild(li);
    });
  }

  // Course List
  const courseList = document.getElementById('settingsCourseList');
  if (courseList) {
    courseList.innerHTML = '';
    const courses = window.globalData.courseNames || [];
    courses.forEach(c => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `${c} <button class="btn btn-sm btn-outline-danger" onclick="deleteCourseName('${c}')">&times;</button>`;
      courseList.appendChild(li);
    });
  }

  // Employee Roles List
  const rolesList = document.getElementById('settingsEmployeeRoleList');
  if (rolesList) {
    rolesList.innerHTML = '';
    const roles = window.globalData.employeeRoles || ['Instructor', 'Admin', 'Staff', 'Manager'];
    roles.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-center';
      li.innerHTML = `${r} <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployeeRole(${i})">&times;</button>`;
      rolesList.appendChild(li);
    });
  }

  // Academy Name & Monthly Target in Settings
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    if (settingsForm.academyName) {
      settingsForm.academyName.value = window.globalData.settings.academyName || '';
    }
    if (settingsForm.monthlyTarget) {
      settingsForm.monthlyTarget.value = window.globalData.settings.monthlyTarget || 200000;
    }
    // Dynamic Starting Balances List
    const balanceContainer = document.getElementById('startingBalancesList');
    if (balanceContainer) {
      balanceContainer.innerHTML = '';

      const allMethods = ['Cash'];
      const bankAccounts = window.globalData.bankAccounts || [];
      const mobileAccounts = window.globalData.mobileBanking || [];

      bankAccounts.forEach(acc => allMethods.push(acc.name));
      mobileAccounts.forEach(acc => allMethods.push(acc.name));

      allMethods.forEach(m => {
        const div = document.createElement('div');
        div.className = 'col-6 mb-2';
        div.innerHTML = `
          <label class="form-label small fw-bold text-muted mb-1">${m} Starting ৳</label>
          <input type="number" name="startBalance_${m}" class="form-control form-control-sm"
                 value="${window.globalData.settings.startBalances?.[m] || 0}" placeholder="0">
        `;
        balanceContainer.appendChild(div);
      });
      // Populate Security Fields
      if (document.getElementById('settingsUsername')) {
        document.getElementById('settingsUsername').value = (window.globalData.credentials && window.globalData.credentials.username) || 'admin';
      }
      if (document.getElementById('settingsPassword')) {
        document.getElementById('settingsPassword').value = '';
        document.getElementById('settingsPassword').placeholder = 'Type new password to change...';
      }
    }
  }
}
window.renderSettingsLists = renderSettingsLists;

// --- Category Management ---

function addIncomeCategory() {
  const input = document.getElementById('newIncomeCatInput');
  const val = input.value.trim();
  if (!val) return;
  if (!window.globalData.incomeCategories) window.globalData.incomeCategories = [];
  if (window.globalData.incomeCategories.includes(val)) { alert('Exists!'); return; }
  window.globalData.incomeCategories.push(val);
  saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
  input.value = '';
}
window.addIncomeCategory = addIncomeCategory;

function deleteIncomeCategory(name) {
  if (!confirm(`Delete Income Category "${name}"?`)) return;
  window.globalData.incomeCategories = window.globalData.incomeCategories.filter(c => c !== name);
  saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
}
window.deleteIncomeCategory = deleteIncomeCategory;

function addExpenseCategory() {
  const input = document.getElementById('newExpenseCatInput');
  const val = input.value.trim();
  if (!val) return;
  if (!window.globalData.expenseCategories) window.globalData.expenseCategories = [];
  if (window.globalData.expenseCategories.includes(val)) { alert('Exists!'); return; }
  window.globalData.expenseCategories.push(val);
  saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
  input.value = '';
}
window.addExpenseCategory = addExpenseCategory;

function deleteExpenseCategory(name) {
  if (!confirm(`Delete Expense Category "${name}"?`)) return;
  window.globalData.expenseCategories = window.globalData.expenseCategories.filter(c => c !== name);
  saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
}
window.deleteExpenseCategory = deleteExpenseCategory;

function updateFinanceCategoryOptions() {
  const typeSelect = document.querySelector('#financeForm select[name="type"]');
  const catSelect = document.getElementById('financeCategorySelect');
  if (!typeSelect || !catSelect) return;

  const type = typeSelect.value;
  let options = [];

  if (type === 'Income' || type === 'Loan Received') {
    options = window.globalData.incomeCategories || [];
  } else {
    options = window.globalData.expenseCategories || [];
  }

  catSelect.innerHTML = '';
  options.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.innerText = c;
    catSelect.appendChild(opt);
  });

  // Toggle Person/Counterparty visibility based on TYPE
  const personContainer = document.getElementById('financePersonContainer');
  const personInput = document.getElementById('financePersonInput');

  if (personContainer && personInput) {
    if (type === 'Loan Given' || type === 'Loan Received') {
      personContainer.classList.remove('d-none');
      personInput.required = true;
    } else {
      personContainer.classList.add('d-none');
      personInput.required = false;
      personInput.value = '';
    }
  }
}
window.updateFinanceCategoryOptions = updateFinanceCategoryOptions;

// --- Payment Method Management ---
function addPaymentMethod() {
  const input = document.getElementById('newMethodInput');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  if (!window.globalData.paymentMethods) {
    window.globalData.paymentMethods = ['Cash', 'Bkash', 'Nogod'];
  }

  if (window.globalData.paymentMethods.includes(val)) { alert('Exists!'); return; }

  window.globalData.paymentMethods.push(val);
  saveToStorage();
  populateDropdowns();
  input.value = '';
}
window.addPaymentMethod = addPaymentMethod;

function deletePaymentMethod(name) {
  if (!confirm(`Delete payment method "${name}"?`)) return;
  if (!window.globalData.paymentMethods) return;
  window.globalData.paymentMethods = window.globalData.paymentMethods.filter(m => m !== name);
  saveToStorage();
  populateDropdowns();
}
window.deletePaymentMethod = deletePaymentMethod;

// --- Course Management ---
function addCourseName() {
  const input = document.getElementById('newCourseInput');
  const val = input.value.trim();
  if (!val) return;

  if (!window.globalData.courseNames) {
    window.globalData.courseNames = ['Caregiver', 'Student Visa', 'Visa (Tourist, Medical Business)', 'Air Ticketing (Basic)', 'Air Ticketing (Advance)', 'Travel Agency Business Managment', 'Language (Japanese, Korean)', 'Other'];
  }

  if (window.globalData.courseNames.includes(val)) { alert('Exists!'); return; }

  window.globalData.courseNames.push(val);
  saveToStorage();
  populateDropdowns();
  if (typeof populateBatchFilter === 'function') populateBatchFilter();
  input.value = '';
}
window.addCourseName = addCourseName;

function deleteCourseName(name) {
  if (!confirm(`Delete course "${name}"?`)) return;
  window.globalData.courseNames = window.globalData.courseNames.filter(c => c !== name);
  saveToStorage();
  populateDropdowns();
  if (typeof populateBatchFilter === 'function') populateBatchFilter();
}
window.deleteCourseName = deleteCourseName;

function updateCategoryDropdown() {
  const select = document.getElementById('ledgerCategoryFilter');
  if (!select) return;

  const currentVal = select.value;
  const legacyCats = new Set(window.globalData.finance.map(f => f.category));
  const incCats = window.globalData.incomeCategories || [];
  const expCats = window.globalData.expenseCategories || [];
  const allCats = [...new Set([...incCats, ...expCats, ...legacyCats])].sort();

  select.innerHTML = '<option value="">All Categories</option>';
  allCats.forEach(cat => {
    if (!cat) return;
    const opt = document.createElement('option');
    opt.value = cat;
    opt.innerText = cat;
    select.appendChild(opt);
  });
  select.value = currentVal;
}
window.updateCategoryDropdown = updateCategoryDropdown;

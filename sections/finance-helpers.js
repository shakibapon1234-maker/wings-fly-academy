// sections/finance-helpers.js
// Wings Fly Aviation Academy
// ─────────────────────────────────────────────────────────────
// এই ফাইলে আছে:
//  1. updateFinanceCategoryOptions()  — Add Transaction modal category dropdown
//  2. addIncomeCategory / addExpenseCategory / renderSettingsLists — Settings sync
//  3. Auto-test alias fixes: renderEmployees, openVisitorModal, renderNoticeBoard
//  4. Warning Details Panel — data integrity warnings বিস্তারিত দেখায়
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

document.addEventListener('DOMContentLoaded', function () {
  const financeModal = document.getElementById('financeModal');
  if (financeModal) {
    financeModal.addEventListener('show.bs.modal', function () {
      setTimeout(updateFinanceCategoryOptions, 50);
    });
  }
});


// =============================================
// 2. SETTINGS — INCOME / EXPENSE CATEGORIES
// =============================================

function renderSettingsLists() {
  const gd = window.globalData || {};

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
    if (typeof showErrorToast === 'function') showErrorToast('এই category আগেই আছে!'); return;
  }
  window.globalData.incomeCategories.push(val);
  input.value = '';
  if (typeof saveToStorage === 'function') saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
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
    if (typeof showErrorToast === 'function') showErrorToast('এই category আগেই আছে!'); return;
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

window.renderSettingsLists   = renderSettingsLists;
window.addIncomeCategory     = addIncomeCategory;
window.removeIncomeCategory  = removeIncomeCategory;
window.addExpenseCategory    = addExpenseCategory;
window.removeExpenseCategory = removeExpenseCategory;


// =============================================
// 3. AUTO-TEST ALIAS FIXES
// =============================================

if (!window.renderEmployees) {
  window.renderEmployees = function () {
    if (typeof window.renderEmployeeList === 'function') return window.renderEmployeeList();
    console.warn('renderEmployeeList not ready yet');
  };
}

window.openVisitorModal = function () {
  const el = document.getElementById('visitorModal');
  if (!el) { console.warn('visitorModal element not found'); return; }
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

window.renderNoticeBoard = function () {
  if (typeof window.getActiveNotice === 'function') window.getActiveNotice();
  if (typeof window.updateSidebarNoticeDot === 'function') window.updateSidebarNoticeDot();
};

document.addEventListener('DOMContentLoaded', function () {
  const configTab = document.querySelector('[data-settings-tab="config"], [onclick*="tab-config"]');
  if (configTab) {
    configTab.addEventListener('click', function () {
      setTimeout(renderSettingsLists, 100);
    });
  }
});


// =============================================
// 4. WARNING DETAILS PANEL
// =============================================

function getDataWarnings() {
  const gd = window.globalData || {};
  const finance      = gd.finance      || [];
  const students     = gd.students     || [];
  const courseNames  = gd.courseNames  || [];
  const bankAccounts = gd.bankAccounts || [];
  const mobileBanking= gd.mobileBanking|| [];

  const studentNames = students.map(s => (s.name || '').trim().toLowerCase());
  const validMethods = ['Cash',
    ...bankAccounts.map(a => a.name),
    ...mobileBanking.map(a => a.name)
  ];

  const warnings = { orphanedPayments: [], invalidCourses: [], unknownMethods: [] };

  // 1. Orphaned payments
  finance.forEach((f, i) => {
    const person   = (f.person || '').trim();
    if (!person) return;
    const category = (f.category || '').toLowerCase();
    const isStudentPayment = ['student installment','student fee','tuition','course fee']
      .some(k => category.includes(k));
    if (isStudentPayment && !studentNames.includes(person.toLowerCase())) {
      warnings.orphanedPayments.push({ index: i, entry: f, person });
    }
  });

  // 2. Invalid course names
  students.forEach((s, i) => {
    const course = (s.course || s.courseName || '').trim();
    if (!course) return;
    if (courseNames.length > 0 && !courseNames.includes(course)) {
      warnings.invalidCourses.push({ index: i, student: s, course });
    }
  });

  // 3. Unknown payment methods
  finance.forEach((f, i) => {
    const method = (f.method || '').trim();
    if (!method) return;
    if (!validMethods.includes(method)) {
      warnings.unknownMethods.push({ index: i, entry: f, method });
    }
  });

  return warnings;
}

function showWarningDetailsModal() {
  const old = document.getElementById('warnDetailsModal');
  if (old) old.remove();

  const w = getDataWarnings();
  const totalWarnings = w.orphanedPayments.length + w.invalidCourses.length + w.unknownMethods.length;

  if (totalWarnings === 0) {
    if (typeof showSuccessToast === 'function') showSuccessToast('✅ কোনো warning নেই!');
    return;
  }

  // Section builder
  function makeSection(title, color, icon, items, rowFn) {
    if (!items.length) return '';
    return `
      <div class="mb-3">
        <div style="color:${color}; font-weight:700; font-size:0.92rem; margin-bottom:7px;">${icon} ${title} (${items.length}টি)</div>
        <div style="border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.08);">
          <table class="table table-sm mb-0" style="font-size:0.84rem;">
            <tbody>${items.map(rowFn).join('')}</tbody>
          </table>
        </div>
      </div>`;
  }

  const orphanRows = makeSection('Orphaned Payments', '#f59e0b', '💸', w.orphanedPayments,
    ({ entry, index }) => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
        <td style="padding:8px 10px; color:rgba(255,255,255,0.88);">
          <div><strong>${entry.person || '—'}</strong> <span style="color:rgba(255,255,255,0.35); font-size:0.78rem;">— এই নামে কোনো student নেই</span></div>
          <div style="color:rgba(255,255,255,0.45); font-size:0.78rem;">${entry.date||'—'} | ${entry.category||'—'} | ৳${entry.amount||0}</div>
        </td>
        <td style="padding:8px 10px; text-align:right; white-space:nowrap; vertical-align:middle;">
          <button class="btn btn-sm btn-outline-warning border-0 rounded-pill px-2 py-0 me-1" style="font-size:0.78rem;" onclick="warnEditFinance(${index})">✏️ Edit</button>
          <button class="btn btn-sm btn-outline-danger border-0 rounded-pill px-2 py-0" style="font-size:0.78rem;" onclick="warnAskOrphan(${index},'${(entry.person||'').replace(/'/g,"\\'")}')">🗑️ Delete?</button>
        </td>
      </tr>`
  );

  const courseRows = makeSection('Invalid Course Names', '#a78bfa', '🎓', w.invalidCourses,
    ({ student, index, course }) => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
        <td style="padding:8px 10px; color:rgba(255,255,255,0.88);">
          <div><strong>${student.name||'—'}</strong></div>
          <div style="color:#f87171; font-size:0.78rem;">Course: "${course}" — course list-এ নেই</div>
        </td>
        <td style="padding:8px 10px; text-align:right; white-space:nowrap; vertical-align:middle;">
          <button class="btn btn-sm btn-outline-primary border-0 rounded-pill px-2 py-0 me-1" style="font-size:0.78rem;" onclick="warnAddCourse('${course.replace(/'/g,"\\'")}')">➕ Course যোগ</button>
          <button class="btn btn-sm btn-outline-warning border-0 rounded-pill px-2 py-0" style="font-size:0.78rem;" onclick="warnEditStudent(${index})">✏️ Edit</button>
        </td>
      </tr>`
  );

  // Unknown methods — group করো
  const methodGroups = {};
  w.unknownMethods.forEach(({ entry, method }) => {
    if (!methodGroups[method]) methodGroups[method] = [];
    methodGroups[method].push(entry);
  });

  let methodHtml = '';
  if (w.unknownMethods.length) {
    methodHtml = `
      <div class="mb-3">
        <div style="color:#60a5fa; font-weight:700; font-size:0.92rem; margin-bottom:7px;">💳 Unknown Payment Methods (${w.unknownMethods.length}টি entry)</div>
        <div style="border-radius:8px; overflow:hidden; border:1px solid rgba(255,255,255,0.08);">
          <table class="table table-sm mb-0" style="font-size:0.84rem;">
            <tbody>
              ${Object.entries(methodGroups).map(([method, entries]) => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
                  <td style="padding:8px 10px; color:rgba(255,255,255,0.88);">
                    <div><strong>"${method}"</strong> — ${entries.length}টি transaction</div>
                    <div style="color:rgba(255,255,255,0.4); font-size:0.78rem;">
                      ${entries.slice(0,3).map(e => `${e.date||'—'} ৳${e.amount||0}`).join(' · ')}${entries.length>3?` · আরো ${entries.length-3}টি`:''}
                    </div>
                  </td>
                  <td style="padding:8px 10px; text-align:right; white-space:nowrap; vertical-align:middle;">
                    <button class="btn btn-sm btn-outline-primary border-0 rounded-pill px-2 py-0" style="font-size:0.78rem;" onclick="warnAddMethod('${method.replace(/'/g,"\\'")}')">ℹ️ কী করব?</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  const html = `
    <div class="modal fade" id="warnDetailsModal" tabindex="-1" style="z-index:9999;">
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content" style="background:#1a1f2e; border:1px solid rgba(255,255,255,0.1); border-radius:16px; color:#fff;">
          <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.08); padding:16px 22px;">
            <h5 class="modal-title fw-bold" style="font-size:1rem;">
              ⚠️ Warning Details
              <span class="badge ms-2 rounded-pill" style="background:rgba(245,158,11,0.2); color:#f59e0b; font-size:0.75rem;">${totalWarnings}টি সমস্যা</span>
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" style="padding:18px 22px;">
            <p style="color:rgba(255,255,255,0.45); font-size:0.82rem; margin-bottom:14px;">প্রতিটি warning-এর পাশে action button দিয়ে fix করুন।</p>
            ${orphanRows}
            ${courseRows}
            ${methodHtml}
          </div>
          <div class="modal-footer" style="border-top:1px solid rgba(255,255,255,0.08); padding:12px 22px;">
            <button class="btn btn-sm btn-secondary" data-bs-dismiss="modal">বন্ধ করুন</button>
          </div>
        </div>
      </div>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
  const modalEl = document.getElementById('warnDetailsModal');
  new bootstrap.Modal(modalEl).show();
  modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove());
}

// Action handlers

function warnEditFinance(financeIndex) {
  const m = bootstrap.Modal.getInstance(document.getElementById('warnDetailsModal'));
  if (m) m.hide();
  setTimeout(() => {
    const tx = (window.globalData.finance || [])[financeIndex];
    if (tx && typeof editTransaction === 'function') {
      editTransaction(tx.id !== undefined ? tx.id : financeIndex);
    } else {
      alert('Finance ledger-এ গিয়ে entry টি edit করুন।');
    }
  }, 400);
}

function warnAskOrphan(financeIndex, personName) {
  const tx = (window.globalData.finance || [])[financeIndex];
  if (!tx) return;
  const msg = `"${personName}" নামের student আর নেই।\n\nEntry:\nDate: ${tx.date||'—'}\nCategory: ${tx.category||'—'}\nAmount: ৳${tx.amount||0}\n\nএই entry টি delete করবেন?`;
  if (confirm(msg)) {
    window.globalData.finance.splice(financeIndex, 1);
    if (typeof saveToStorage === 'function') saveToStorage();
    if (typeof showSuccessToast === 'function') showSuccessToast('🗑️ Entry deleted!');
    const m = bootstrap.Modal.getInstance(document.getElementById('warnDetailsModal'));
    if (m) m.hide();
    setTimeout(showWarningDetailsModal, 350);
  }
}

function warnAddCourse(courseName) {
  if (!window.globalData.courseNames) window.globalData.courseNames = [];
  if (window.globalData.courseNames.includes(courseName)) {
    if (typeof showSuccessToast === 'function') showSuccessToast('এই course আগেই আছে!'); return;
  }
  window.globalData.courseNames.push(courseName);
  if (typeof saveToStorage === 'function') saveToStorage();
  if (typeof showSuccessToast === 'function') showSuccessToast(`✅ "${courseName}" course list-এ যোগ হয়েছে!`);
  const m = bootstrap.Modal.getInstance(document.getElementById('warnDetailsModal'));
  if (m) m.hide();
  setTimeout(showWarningDetailsModal, 350);
}

function warnEditStudent(studentIndex) {
  const m = bootstrap.Modal.getInstance(document.getElementById('warnDetailsModal'));
  if (m) m.hide();
  setTimeout(() => {
    if (typeof openEditStudentModal === 'function') openEditStudentModal(studentIndex);
    else if (typeof editStudent === 'function') editStudent(studentIndex);
    else alert('Students section-এ গিয়ে student টি edit করুন।');
  }, 400);
}

function warnAddMethod(methodName) {
  alert(`"${methodName}" method টি কোনো account-এ নেই।\n\nদুটো option আছে:\n\n1️⃣ Settings → Accounts-এ "${methodName}" নামে account যোগ করুন\n\n2️⃣ Finance ledger-এ গিয়ে এই entries edit করে বিদ্যমান কোনো method দিন`);
}

window.showWarningDetailsModal = showWarningDetailsModal;
window.getDataWarnings         = getDataWarnings;
window.warnEditFinance         = warnEditFinance;
window.warnAskOrphan           = warnAskOrphan;
window.warnAddCourse           = warnAddCourse;
window.warnEditStudent         = warnEditStudent;
window.warnAddMethod           = warnAddMethod;

console.log('✅ finance-helpers.js loaded — category dropdown, settings sync, auto-test aliases & warning details ready');


// =============================================
// 5. WARNING BUTTON — AUTO-TEST PANEL-এ INJECT
// =============================================
// auto-test.js এর warning section render হওয়ার পর
// "বিস্তারিত দেখুন" button inject করো

function injectWarnDetailsButton() {
  // আগে থাকলে skip
  if (document.getElementById('warnDetailsBtn')) return;

  const w = getDataWarnings();
  const total = w.orphanedPayments.length + w.invalidCourses.length + w.unknownMethods.length;
  if (total === 0) return;

  // Warning section খোঁজো — auto-test render করা warn block
  // auto-test.js সাধারণত warning গুলো একটা div-এ রাখে
  const warnBlocks = document.querySelectorAll('[class*="warn"], [id*="warn"], [class*="test-warn"]');
  let targetEl = null;
  warnBlocks.forEach(el => {
    if (el.textContent.includes('orphaned') || el.textContent.includes('course name invalid') || el.textContent.includes('method অপরিচিত')) {
      targetEl = el;
    }
  });

  // targetEl না পেলে body-তে fixed button দাও
  if (!targetEl) {
    const btn = document.createElement('button');
    btn.id = 'warnDetailsBtn';
    btn.className = 'btn btn-sm btn-warning rounded-pill shadow';
    btn.style.cssText = 'position:fixed; bottom:80px; right:20px; z-index:9000; font-size:0.8rem; padding:6px 14px;';
    btn.innerHTML = `⚠️ ${total}টি Warning — বিস্তারিত`;
    btn.onclick = showWarningDetailsModal;
    document.body.appendChild(btn);
    return;
  }

  // Warning block-এর শেষে button যোগ করো
  const btn = document.createElement('button');
  btn.id = 'warnDetailsBtn';
  btn.className = 'btn btn-sm btn-warning rounded-pill mt-2 ms-2';
  btn.style.cssText = 'font-size:0.8rem;';
  btn.innerHTML = '🔍 বিস্তারিত দেখুন';
  btn.onclick = showWarningDetailsModal;
  targetEl.appendChild(btn);
}

// Page load-এর পরে এবং কিছুক্ষণ পরে চেষ্টা করো
document.addEventListener('DOMContentLoaded', () => setTimeout(injectWarnDetailsButton, 3000));
setTimeout(injectWarnDetailsButton, 5000);

window.injectWarnDetailsButton = injectWarnDetailsButton;

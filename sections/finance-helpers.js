// sections/finance-helpers.js
// Wings Fly Aviation Academy
// ─────────────────────────────────────────────────────────────
// এই ফাইলে শুধু সেই functions আছে যেগুলো অন্য কোনো ফাইলে নেই:
//  1. Auto-test alias fixes: renderEmployees, openVisitorModal, renderNoticeBoard
//  2. openEditStudentModal — Edit Profile button
//  3. Warning Details Panel — data integrity warnings বিস্তারিত দেখায়
//  4. Warning floating button inject
//
// NOTE: renderSettingsLists, addCourseName, addIncomeCategory ইত্যাদি
//       ledger-render.js এ আছে — এখানে নেই (conflict এড়াতে)
// ─────────────────────────────────────────────────────────────


// =============================================
// 1. AUTO-TEST ALIAS FIXES
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
// 2. openEditStudentModal — Edit Profile button fix
// =============================================

function openEditStudentModal(index) {
  const students = window.globalData.students || [];
  const s = students[index];
  if (!s) { console.warn('Student not found at index', index); return; }

  const form = document.getElementById('studentForm');
  const modalEl = document.getElementById('studentModal');
  if (!form || !modalEl) { console.warn('studentForm or studentModal not found'); return; }

  // Form reset
  form.reset();

  // Hidden index
  const rowIdx = document.getElementById('studentRowIndex');
  if (rowIdx) rowIdx.value = index;

  // Photo
  const photoURLField = document.getElementById('studentPhotoURL');
  if (photoURLField) photoURLField.value = s.photo || '';
  if (s.photo) {
    const photoPreview = document.getElementById('photoPreview');
    const photoContainer = document.getElementById('photoPreviewContainer');
    const uploadInput = document.getElementById('photoUploadInput');
    if (photoPreview && photoContainer && uploadInput) {
      photoPreview.src = s.photo;
      photoContainer.style.display = 'block';
      uploadInput.style.display = 'none';
    }
  }

  // Basic fields helper
  const setField = (name, val) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el) el.value = val || '';
  };

  setField('name',         s.name);
  setField('phone',        s.phone);
  setField('fatherName',   s.fatherName);
  setField('motherName',   s.motherName);
  setField('bloodGroup',   s.bloodGroup);
  setField('batch',        s.batch);
  setField('enrollDate',   s.enrollDate);
  setField('reminderDate', s.reminderDate);
  setField('totalPayment', s.totalPayment);
  setField('payment',      s.paid);
  setField('due',          s.due);
  setField('notes',        s.notes || s.remarks);
  setField('nid',          s.nid);
  setField('address',      s.address);

  // Course select — populateDropdowns আগে call হয়ে থাকলে options আছে
  // তবুও নিশ্চিত করো current value set হচ্ছে
  const courseSelect = document.getElementById('studentCourseSelect');
  if (courseSelect) {
    // যদি current course option না থাকে, add করো
    if (s.course && ![...courseSelect.options].some(o => o.value === s.course)) {
      const opt = document.createElement('option');
      opt.value = s.course;
      opt.text = s.course;
      courseSelect.appendChild(opt);
    }
    courseSelect.value = s.course || '';
  }

  // Method select
  const methodSelect = document.getElementById('studentMethodSelect');
  if (methodSelect) {
    // populateDropdowns already filled this, just set value
    if (s.method && ![...methodSelect.options].some(o => o.value === s.method)) {
      const opt = document.createElement('option');
      opt.value = s.method;
      opt.text = s.method;
      methodSelect.appendChild(opt);
    }
    methodSelect.value = s.method || '';
  }

  // Modal title "Edit" mode
  const modalTitle = modalEl.querySelector('.modal-title');
  if (modalTitle) modalTitle.innerHTML = `<span class="me-2">✏️</span>Edit Student Profile`;

  // Modal খোলো
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
}

window.openEditStudentModal = openEditStudentModal;

// warnEditStudent এর জন্যও alias
window.editStudent = openEditStudentModal;


// =============================================
// 3. WARNING DETAILS PANEL
// =============================================

function getDataWarnings() {
  const gd = window.globalData || {};
  const finance       = gd.finance       || [];
  const students      = gd.students      || [];
  const courseNames   = gd.courseNames   || [];
  const bankAccounts  = gd.bankAccounts  || [];
  const mobileBanking = gd.mobileBanking || [];

  const studentNames = students.map(s => (s.name || '').trim().toLowerCase());
  const validMethods = ['Cash',
    ...bankAccounts.map(a => a.name),
    ...mobileBanking.map(a => a.name)
  ];

  const warnings = { orphanedPayments: [], invalidCourses: [], unknownMethods: [] };

  // 1. Orphaned payments — শুধু Student Fee/Installment/Admission check করো
  // Loan বা non-student entries skip করো
  const NON_STUDENT_CATEGORIES = new Set([
    'Loan', 'loan', 'Loan Given', 'Loan Taken', 'Loan Repay', 'Loan Received',
    'লোন', 'ঋণ', 'ঋণ প্রদান', 'ঋণ গ্রহণ',
    'Salary', 'Expense', 'ব্যয়', 'Rent', 'Utility',
    'Other Expense', 'Other Income', 'অন্যান্য আয়', 'অন্যান্য ব্যয়',
    'Bank Transfer', 'Mobile Banking', 'Investment'
  ]);

  finance.forEach((f, i) => {
    if (!f.person && !f.studentName) return;

    // Loan বা non-student category হলে orphaned check skip
    const category = (f.category || '').trim();
    const subType  = (f.subType || f.sub_type || '').trim().toLowerCase();
    if (NON_STUDENT_CATEGORIES.has(category)) return;
    if (subType === 'loan' || subType === 'লোন' || subType === 'ঋণ') return;
    if (category.toLowerCase().includes('loan') || category.toLowerCase().includes('লোন')) return;

    // শুধু Student-linked Income entries check করো
    const isStudentPayment = (
      f.type === 'Income' &&
      (
        category === 'Student Fee' ||
        category === 'Student Installment' ||
        category === 'Admission Fee' ||
        category === 'ভর্তি ফি' ||
        category === 'টিউশন ফি'
      )
    );
    if (!isStudentPayment) return;

    const person = ((f.person || f.studentName || '')).trim().toLowerCase();
    if (person && !studentNames.includes(person)) {
      warnings.orphanedPayments.push({ index: i, entry: f, person: f.person || f.studentName });
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
    if (!validMethods.some(m => m.toLowerCase() === method.toLowerCase())) {
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
          <div><strong>${entry.person || '—'}</strong> <span style="color:rgba(255,255,255,0.35); font-size:0.78rem;">— এই নামে student নেই</span></div>
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
          <div style="color:#f87171; font-size:0.78rem;">Course: "${course}" — list-এ নেই</div>
        </td>
        <td style="padding:8px 10px; text-align:right; white-space:nowrap; vertical-align:middle;">
          <button class="btn btn-sm btn-outline-primary border-0 rounded-pill px-2 py-0 me-1" style="font-size:0.78rem;" onclick="warnAddCourse('${course.replace(/'/g,"\\'")}')">➕ Course যোগ</button>
          <button class="btn btn-sm btn-outline-warning border-0 rounded-pill px-2 py-0" style="font-size:0.78rem;" onclick="openEditStudentModal(${index})">✏️ Edit</button>
        </td>
      </tr>`
  );

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
                      ${entries.slice(0,3).map(e=>`${e.date||'—'} ৳${e.amount||0}`).join(' · ')}${entries.length>3?` · আরো ${entries.length-3}টি`:''}
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

// ── Action Handlers ──
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
  if (confirm(`"${personName}" নামের student আর নেই।\n\nDate: ${tx.date||'—'} | Category: ${tx.category||'—'} | ৳${tx.amount||0}\n\nDelete করবেন?`)) {
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

function warnAddMethod(methodName) {
  alert(`"${methodName}" method টি কোনো account-এ নেই।\n\nদুটো option:\n\n1️⃣ Settings → Accounts-এ "${methodName}" নামে account যোগ করুন\n\n2️⃣ Finance ledger-এ গিয়ে এই entries edit করে বিদ্যমান কোনো method দিন`);
}

window.showWarningDetailsModal = showWarningDetailsModal;
window.getDataWarnings         = getDataWarnings;
window.warnEditFinance         = warnEditFinance;
window.warnAskOrphan           = warnAskOrphan;
window.warnAddCourse           = warnAddCourse;
window.warnAddMethod           = warnAddMethod;


// =============================================
// 4. WARNING FLOATING BUTTON
// =============================================

function injectWarnDetailsButton() {
  if (document.getElementById('warnDetailsBtn')) return;
  const w = getDataWarnings();
  const total = w.orphanedPayments.length + w.invalidCourses.length + w.unknownMethods.length;
  if (total === 0) return;

  // Auto-test warning block-এ "বিস্তারিত" button inject করার চেষ্টা
  const allElements = document.querySelectorAll('*');
  let targetEl = null;
  allElements.forEach(el => {
    if (el.children.length === 0 && el.textContent.includes('orphaned payment')) {
      // parent container খোঁজো
      let parent = el.parentElement;
      for (let i = 0; i < 4; i++) {
        if (parent && parent.parentElement) parent = parent.parentElement;
      }
      targetEl = parent;
    }
  });

  // "Fix করুন" button তৈরি করো
  const btn = document.createElement('button');
  btn.id = 'warnDetailsBtn';
  btn.className = 'btn btn-warning rounded-pill shadow';
  btn.innerHTML = `🔍 বিস্তারিত দেখুন ও Fix করুন`;
  btn.style.cssText = 'font-size:0.82rem; padding:5px 14px; margin-top:8px; display:block;';
  btn.onclick = showWarningDetailsModal;

  if (targetEl) {
    targetEl.appendChild(btn);
  } else {
    // fallback: fixed floating button
    btn.style.cssText = 'position:fixed; bottom:80px; right:20px; z-index:9000; font-size:0.8rem; padding:6px 14px;';
    document.body.appendChild(btn);
  }
}

// Auto-test শেষ হওয়ার পরে inject করো
document.addEventListener('DOMContentLoaded', () => setTimeout(injectWarnDetailsButton, 4000));
setTimeout(injectWarnDetailsButton, 6000);

// Auto-test button click করলে পরেও inject করো
document.addEventListener('click', function(e) {
  if (e.target && (e.target.textContent || '').includes('Tests')) {
    setTimeout(injectWarnDetailsButton, 3000);
  }
});

window.injectWarnDetailsButton = injectWarnDetailsButton;

console.log('✅ finance-helpers.js loaded — aliases, openEditStudentModal & warning details ready');

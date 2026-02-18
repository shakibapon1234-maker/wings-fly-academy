// ===================================
// WINGS FLY AVIATION ACADEMY
// EXAM REGISTRATION — COMPLETE FIX
// সমস্যা সমাধান: v1.0
// ===================================
// এই ফাইলটি app.js এর পরে লোড করুন:
// <script src="exam-fix.js"></script>
// ===================================


// ─────────────────────────────────────────────────────────────
// ১. স্টুডেন্ট নাম টাইপ করলে ID + Batch অটো ফিল হবে
// ─────────────────────────────────────────────────────────────
function autoPopulateStudentDetails() {
  const nameInput = document.getElementById('examStudentNameInput');
  const idInput   = document.getElementById('examStudentIdInput');
  const batchInput = document.getElementById('examStudentBatchInput');

  if (!nameInput || !idInput || !batchInput) return;

  const typed = nameInput.value.trim().toLowerCase();
  if (!typed) {
    idInput.value = '';
    batchInput.value = '';
    return;
  }

  const students = (window.globalData && window.globalData.students) || [];

  // exact match আগে, তারপর partial
  const match =
    students.find(s => (s.name || '').toLowerCase() === typed) ||
    students.find(s => (s.name || '').toLowerCase().startsWith(typed)) ||
    students.find(s => (s.name || '').toLowerCase().includes(typed));

  if (match) {
    idInput.value    = match.studentId || match.rowIndex || '';
    batchInput.value = match.batch     || match.course  || '';
  } else {
    idInput.value    = '';
    batchInput.value = '';
  }
}
window.autoPopulateStudentDetails = autoPopulateStudentDetails;


// ─────────────────────────────────────────────────────────────
// ২. Modal খোলার সময় datalist ও payment method populate করা
// ─────────────────────────────────────────────────────────────
function populateExamModal() {
  // ── Student datalist ──
  const studentList = document.getElementById('studentList');
  if (studentList) {
    const students = (window.globalData && window.globalData.students) || [];
    studentList.innerHTML = students
      .map(s => `<option value="${s.name || ''}"></option>`)
      .join('');
  }

  // ── Subject datalist (past subjects) ──
  const subjectList = document.getElementById('subjectList');
  if (subjectList) {
    const exams = (window.globalData && window.globalData.examRegistrations) || [];
    const subjects = [...new Set(exams.map(e => e.subjectName).filter(Boolean))];
    subjectList.innerHTML = subjects
      .map(s => `<option value="${s}"></option>`)
      .join('');
  }

  // ── Payment method select ──
  const methodSel = document.getElementById('examPaymentMethodSelect');
  if (methodSel) {
    const methods = (window.globalData && window.globalData.paymentMethods) || ['Cash', 'Bkash', 'Nagad', 'Bank'];
    const bankAccounts = (window.globalData && window.globalData.bankAccounts) || [];
    const mobileBanking = (window.globalData && window.globalData.mobileBanking) || [];

    const allMethods = [
      ...methods,
      ...bankAccounts.map(a => a.name),
      ...mobileBanking.map(a => a.name)
    ];
    const unique = [...new Set(allMethods.filter(Boolean))];

    methodSel.innerHTML =
      `<option value="">Select Payment Method</option>` +
      unique.map(m => `<option value="${m}">${m}</option>`).join('');
  }

  // ── আজকের তারিখ default set ──
  const dateInput = document.getElementById('examRegistrationDate');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // ── Form reset (edit mode না হলে) ──
  const nameInput = document.getElementById('examStudentNameInput');
  if (nameInput && !nameInput.dataset.editing) {
    const form = document.getElementById('examRegistrationForm');
    if (form) {
      // শুধু student fields clear করি date ছাড়া
      const idInput    = document.getElementById('examStudentIdInput');
      const batchInput = document.getElementById('examStudentBatchInput');
      if (idInput)    idInput.value    = '';
      if (batchInput) batchInput.value = '';
    }
  }
}
window.populateExamModal = populateExamModal;


// ─────────────────────────────────────────────────────────────
// ৩. Exam Registration Form Submit
// ─────────────────────────────────────────────────────────────
async function handleExamRegistration(e) {
  e.preventDefault();
  const form = e.target;
  const fd   = new FormData(form);
  const data = {};
  fd.forEach((v, k) => data[k] = v);

  // Validation
  const studentName = (data.studentName || '').trim();
  const subjectName = (data.subjectName || '').trim();
  const examFee     = parseFloat(data.examFee) || 0;
  const payMethod   = (data.paymentMethod || '').trim();
  const regDate     = (data.registrationDate || '').trim();

  if (!studentName)   { showErrorToast('❌ Student name is required'); return; }
  if (!subjectName)   { showErrorToast('❌ Subject name is required'); return; }
  if (examFee <= 0)   { showErrorToast('❌ Exam fee must be greater than 0'); return; }
  if (!payMethod)     { showErrorToast('❌ Please select a payment method'); return; }
  if (!regDate)       { showErrorToast('❌ Registration date is required'); return; }

  if (!window.globalData.examRegistrations) window.globalData.examRegistrations = [];

  // Registration ID generate
  const regId = 'EXAM-' + Date.now().toString().slice(-6);
  const editId = form.dataset.editId || null;

  const studentId  = document.getElementById('examStudentIdInput')?.value  || '';
  const studentBatch = document.getElementById('examStudentBatchInput')?.value || '';

  const registration = {
    regId,
    studentName,
    studentId,
    batch:           studentBatch,
    examSession:     (data.examSession   || '').trim(),
    subjectName,
    examFee,
    paymentMethod:   payMethod,
    registrationDate: regDate,
    examComment:     (data.examComment   || '').trim(),
    grade:           '',
    addedAt:         new Date().toISOString()
  };

  if (editId) {
    // Edit mode
    const idx = window.globalData.examRegistrations.findIndex(r => r.regId === editId);
    if (idx >= 0) {
      registration.regId   = editId;
      registration.addedAt = window.globalData.examRegistrations[idx].addedAt;
      registration.grade   = window.globalData.examRegistrations[idx].grade || '';
      window.globalData.examRegistrations[idx] = registration;
    }
    delete form.dataset.editId;
    showSuccessToast('✅ Exam registration updated!');
  } else {
    window.globalData.examRegistrations.push(registration);

    // Finance Ledger এ Payment এন্ট্রি যোগ করা
    if (!window.globalData.finance) window.globalData.finance = [];
    const financeEntry = {
      id:       'FIN-' + Date.now(),
      date:     regDate,
      type:     'Income',
      category: 'Exam Fee',
      amount:   examFee,
      method:   payMethod,
      note:     `Exam Fee — ${studentName} | ${subjectName} | ${registration.examSession || ''} | Reg: ${regId}`,
      addedAt:  new Date().toISOString()
    };
    window.globalData.finance.push(financeEntry);

    // Account balance update
    if (typeof updateAccountBalance === 'function') {
      updateAccountBalance(payMethod, examFee, 'Income', true);
    }

    showSuccessToast(`✅ Exam registered! ID: ${regId}`);
  }

  await saveToStorage();

  // Modal বন্ধ করা
  const modalEl = document.getElementById('examRegistrationModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }

  // Form reset
  form.reset();
  const idInput    = document.getElementById('examStudentIdInput');
  const batchInput = document.getElementById('examStudentBatchInput');
  if (idInput)    idInput.value    = '';
  if (batchInput) batchInput.value = '';

  // Exam page refresh
  if (typeof searchExamResults === 'function') searchExamResults();
  if (typeof updateGlobalStats  === 'function') updateGlobalStats();
  if (typeof renderDashboard    === 'function') renderDashboard();
}
window.handleExamRegistration = handleExamRegistration;


// ─────────────────────────────────────────────────────────────
// ৪. Exam Results Page — Search & Render
// ─────────────────────────────────────────────────────────────
function searchExamResults() {
  const q       = (document.getElementById('examResultSearchInput')?.value   || '').toLowerCase().trim();
  const batch   = (document.getElementById('examBatchFilter')?.value         || '').toLowerCase().trim();
  const session = (document.getElementById('examSessionFilter')?.value       || '').toLowerCase().trim();
  const subject = (document.getElementById('examSubjectFilter')?.value       || '').toLowerCase().trim();
  const start   =  document.getElementById('examStartDateFilter')?.value     || '';
  const end     =  document.getElementById('examEndDateFilter')?.value       || '';

  let list = (window.globalData && window.globalData.examRegistrations) || [];

  if (q)       list = list.filter(r =>
    (r.studentName || '').toLowerCase().includes(q) ||
    (r.regId       || '').toLowerCase().includes(q) ||
    (r.studentId   || '').toString().toLowerCase().includes(q));
  if (batch)   list = list.filter(r => (r.batch   || '').toLowerCase().includes(batch));
  if (session) list = list.filter(r => (r.examSession || '').toLowerCase().includes(session));
  if (subject) list = list.filter(r => (r.subjectName || '').toLowerCase().includes(subject));
  if (start)   list = list.filter(r => r.registrationDate >= start);
  if (end)     list = list.filter(r => r.registrationDate <= end);

  // Newest first
  list = list.slice().sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));

  renderExamResults(list);
}
window.searchExamResults = searchExamResults;


function renderExamResults(list) {
  const tbody     = document.getElementById('examResultsTableBody');
  const display   = document.getElementById('examResultsDisplay');
  const noMsg     = document.getElementById('noResultsMessage');
  const countEl   = document.getElementById('filteredExamCount');
  const totalEl   = document.getElementById('examTotalFeeDisplay');
  const creditEl  = document.getElementById('examTotalCredit');
  const netEl     = document.getElementById('examNetTotal');

  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="text-center py-5">
          <i class="bi bi-journal-x fs-2 d-block mb-2 opacity-50"></i>
          <span class="text-muted">কোনো Exam Registration পাওয়া যায়নি।</span>
        </td>
      </tr>`;
    if (display) display.classList.remove('d-none');
    if (noMsg)   noMsg.classList.add('d-none');
    if (countEl) countEl.textContent = '0';
    if (totalEl) totalEl.textContent = '৳0';
    if (creditEl) creditEl.textContent = '৳0';
    if (netEl)   netEl.textContent = '৳0';
    return;
  }

  const totalFee = list.reduce((sum, r) => sum + (parseFloat(r.examFee) || 0), 0);

  tbody.innerHTML = list.map(r => {
    const fee = parseFloat(r.examFee) || 0;
    const gradeColor = r.grade === 'A+' || r.grade === 'A' ? 'text-success fw-bold' :
                       r.grade === 'Fail' ? 'text-danger fw-bold' : 'text-primary';
    return `
    <tr>
      <td><span class="badge rounded-pill px-3 py-2" style="background:rgba(0,217,255,0.2);color:#00d9ff;font-size:0.75rem;">${r.regId || '—'}</span></td>
      <td class="text-muted small">${r.studentId || '—'}</td>
      <td class="fw-bold">${r.studentName || '—'}</td>
      <td><span class="badge bg-secondary rounded-pill px-2">${r.batch || '—'}</span></td>
      <td class="small">${r.examSession || '—'}</td>
      <td class="fw-semibold">${r.subjectName || '—'}</td>
      <td class="fw-bold text-success">৳${formatNumber ? formatNumber(fee) : fee}</td>
      <td><span class="badge rounded-pill px-2" style="background:rgba(0,255,157,0.15);color:#00ff9d;border:1px solid rgba(0,255,157,0.3);">${r.paymentMethod || '—'}</span></td>
      <td class="${gradeColor}">${r.grade || '—'}</td>
      <td class="small text-muted">${r.registrationDate || '—'}</td>
      <td class="small" style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.examComment || ''}">${r.examComment || '—'}</td>
      <td class="no-print text-end">
        <div class="d-flex gap-1 justify-content-end">
          <button class="btn btn-sm btn-outline-warning rounded-pill px-2" title="Add Result" onclick="openAddResultModal('${r.regId}')">
            <i class="bi bi-trophy-fill"></i>
          </button>
          <button class="btn btn-sm btn-outline-primary rounded-pill px-2" title="Edit" onclick="editExamRegistration('${r.regId}')">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger rounded-pill px-2" title="Delete" onclick="deleteExamRegistration('${r.regId}')">
            <i class="bi bi-trash-fill"></i>
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');

  if (display)  display.classList.remove('d-none');
  if (noMsg)    noMsg.classList.add('d-none');
  if (countEl)  countEl.textContent = list.length;
  if (totalEl)  totalEl.textContent = `৳${formatNumber ? formatNumber(totalFee) : totalFee}`;
  if (creditEl) creditEl.textContent = `৳${formatNumber ? formatNumber(totalFee) : totalFee}`;
  if (netEl)    netEl.textContent   = `৳${formatNumber ? formatNumber(totalFee) : totalFee}`;
}
window.renderExamResults = renderExamResults;


// ─────────────────────────────────────────────────────────────
// ৫. Exam Filter Clear
// ─────────────────────────────────────────────────────────────
function clearExamFilters() {
  ['examResultSearchInput', 'examBatchFilter', 'examSessionFilter',
   'examSubjectFilter', 'examStartDateFilter', 'examEndDateFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  searchExamResults();
}
window.clearExamFilters = clearExamFilters;


// ─────────────────────────────────────────────────────────────
// ৬. Exam Registration Edit
// ─────────────────────────────────────────────────────────────
function editExamRegistration(regId) {
  const regs = (window.globalData && window.globalData.examRegistrations) || [];
  const reg  = regs.find(r => r.regId === regId);
  if (!reg) return;

  const form = document.getElementById('examRegistrationForm');
  if (!form) return;

  // Fields populate করা
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  };

  setVal('examStudentNameInput',  reg.studentName);
  setVal('examStudentIdInput',    reg.studentId);
  setVal('examStudentBatchInput', reg.batch);
  setVal('examRegistrationDate',  reg.registrationDate);

  // Name fields
  if (form.elements['examSession'])    form.elements['examSession'].value    = reg.examSession    || '';
  if (form.elements['subjectName'])    form.elements['subjectName'].value    = reg.subjectName    || '';
  if (form.elements['examFee'])        form.elements['examFee'].value        = reg.examFee        || '';
  if (form.elements['examComment'])    form.elements['examComment'].value    = reg.examComment    || '';

  // Payment method
  const methodSel = document.getElementById('examPaymentMethodSelect');
  if (methodSel) methodSel.value = reg.paymentMethod || '';

  // edit mode mark
  form.dataset.editId = regId;

  // Modal open
  const modalEl = document.getElementById('examRegistrationModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }

  showSuccessToast('✏️ Edit mode — changes করে Submit করুন');
}
window.editExamRegistration = editExamRegistration;


// ─────────────────────────────────────────────────────────────
// ৭. Exam Registration Delete
// ─────────────────────────────────────────────────────────────
async function deleteExamRegistration(regId) {
  if (!confirm(`🗑️ এই exam registration (${regId}) delete করবেন?`)) return;

  if (!window.globalData.examRegistrations) return;
  const idx = window.globalData.examRegistrations.findIndex(r => r.regId === regId);
  if (idx < 0) return;

  window.globalData.examRegistrations.splice(idx, 1);
  await saveToStorage();
  showSuccessToast('🗑️ Exam registration deleted');
  searchExamResults();
}
window.deleteExamRegistration = deleteExamRegistration;


// ─────────────────────────────────────────────────────────────
// ৮. Add Grade/Result Modal
// ─────────────────────────────────────────────────────────────
function openAddResultModal(regId) {
  const regs = (window.globalData && window.globalData.examRegistrations) || [];
  const reg  = regs.find(r => r.regId === regId);
  if (!reg) return;

  const ridInput = document.getElementById('resultRegistrationId');
  const nameEl   = document.getElementById('resultStudentName');
  const subjEl   = document.getElementById('resultSubjectName');
  if (ridInput) ridInput.value  = regId;
  if (nameEl)   nameEl.value   = reg.studentName || '';
  if (subjEl)   subjEl.value   = reg.subjectName || '';

  const modalEl = document.getElementById('addResultModal');
  if (modalEl) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
}
window.openAddResultModal = openAddResultModal;

async function handleAddResult(e) {
  e.preventDefault();
  const form = e.target;
  const fd   = new FormData(form);
  const regId = fd.get('registrationId');
  const grade = fd.get('grade');

  if (!regId || !grade) { showErrorToast('❌ Grade is required'); return; }

  const regs = (window.globalData && window.globalData.examRegistrations) || [];
  const idx  = regs.findIndex(r => r.regId === regId);
  if (idx < 0) { showErrorToast('❌ Registration not found'); return; }

  regs[idx].grade = grade;
  await saveToStorage();

  showSuccessToast(`✅ Grade "${grade}" saved for ${regs[idx].studentName}`);

  const modalEl = document.getElementById('addResultModal');
  if (modalEl) {
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
  form.reset();
  searchExamResults();
}
window.handleAddResult = handleAddResult;


// ─────────────────────────────────────────────────────────────
// ৯. Print & Export (stub — existing functions সাথে compatible)
// ─────────────────────────────────────────────────────────────
function printExamResults() {
  const list = window.globalData?.examRegistrations || [];
  const fmt = window.formatNumber || (n => Number(n).toLocaleString('en-IN'));

  // Apply current filters
  const q       = (document.getElementById('examResultSearchInput')?.value || '').toLowerCase().trim();
  const batch   = document.getElementById('examBatchFilter')?.value || '';
  const session = document.getElementById('examSessionFilter')?.value || '';
  const subject = document.getElementById('examSubjectFilter')?.value || '';
  const dateFrom = document.getElementById('examDateFrom')?.value || '';
  const dateTo   = document.getElementById('examDateTo')?.value || '';

  const filtered = list.filter(r => {
    const matchQ  = !q || (r.studentName||'').toLowerCase().includes(q) || (r.regId||'').toLowerCase().includes(q);
    const matchB  = !batch   || r.batch   === batch;
    const matchSe = !session || r.session === session;
    const matchSu = !subject || r.subject === subject;
    const matchD  = (!dateFrom || (r.date||'') >= dateFrom) && (!dateTo || (r.date||'') <= dateTo);
    return matchQ && matchB && matchSe && matchSu && matchD;
  });

  if (filtered.length === 0) {
    alert('No exam results to print!');
    return;
  }

  let rows = '';
  filtered.forEach((r, i) => {
    const total = parseFloat(r.totalMarks) || 0;
    const obtained = parseFloat(r.obtainedMarks) || 0;
    const pct = total > 0 ? ((obtained/total)*100).toFixed(1) : '-';
    rows += `<tr style="background:${i%2===0?'#fff':'#f7f9fc'}">
      <td>${r.regId||'-'}</td>
      <td style="font-weight:600">${r.studentName||'-'}</td>
      <td>${r.batch||'-'}</td>
      <td>${r.session||'-'}</td>
      <td>${r.subject||'-'}</td>
      <td>${r.date||'-'}</td>
      <td style="text-align:right">${obtained}</td>
      <td style="text-align:right">${total}</td>
      <td style="text-align:right;font-weight:700">${pct}%</td>
      <td style="font-weight:700;color:${r.grade==='A+'||r.grade==='A'?'green':'#c0001a'}">${r.grade||'-'}</td>
      <td style="font-weight:700;color:${r.status==='Pass'?'green':'#c0001a'}">${r.status||'-'}</td>
    </tr>`;
  });

  const pw = window.open('','_blank');
  pw.document.write(`<!DOCTYPE html><html><head>
    <title>Exam Results Report</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;padding:20px;color:#333}
      h2{border-bottom:2px solid #1a3a5c;padding-bottom:8px;color:#1a3a5c}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-top:12px}
      th{background:#1a3a5c;color:#fff;padding:8px 6px;text-align:left}
      td{border:1px solid #dde;padding:6px;font-size:11px}
      .info{background:#f0f4f8;padding:10px;border-radius:6px;margin:10px 0;font-size:12px}
      @media print{button{display:none}}
    </style>
  </head><body>
    <h2>📋 Exam Results Report</h2>
    <div class="info">
      Total Records: <strong>${filtered.length}</strong>
      ${batch?' | Batch: <strong>'+batch+'</strong>':''}
      ${session?' | Session: <strong>'+session+'</strong>':''}
      ${subject?' | Subject: <strong>'+subject+'</strong>':''}
      ${dateFrom||dateTo?' | Date: <strong>'+(dateFrom||'Start')+' → '+(dateTo||'Today')+'</strong>':''}
      &nbsp;|&nbsp; Printed: <strong>${new Date().toLocaleDateString()}</strong>
    </div>
    <table>
      <thead><tr>
        <th>Reg ID</th><th>Student Name</th><th>Batch</th><th>Session</th>
        <th>Subject</th><th>Date</th><th style="text-align:right">Obtained</th>
        <th style="text-align:right">Total</th><th style="text-align:right">%</th>
        <th>Grade</th><th>Status</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <br>
    <button onclick="window.print()" style="padding:10px 24px;background:#1a3a5c;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:1rem;">🖨️ Print</button>
  </body></html>`);
  pw.document.close();
}
window.printExamResults = printExamResults;

function exportExamResultsExcel() {
  const list = window.globalData?.examRegistrations || [];
  if (list.length === 0) { showErrorToast('❌ No data to export'); return; }

  const rows = [
    ['Reg ID', 'Student Name', 'Student ID', 'Batch', 'Session', 'Subject', 'Fee', 'Payment', 'Grade', 'Date', 'Comment'],
    ...list.map(r => [r.regId, r.studentName, r.studentId, r.batch, r.examSession, r.subjectName, r.examFee, r.paymentMethod, r.grade, r.registrationDate, r.examComment])
  ];

  const csvContent = rows.map(r => r.map(c => `"${(c || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `exam_results_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showSuccessToast('📊 Excel (CSV) exported successfully!');
}
window.exportExamResultsExcel = exportExamResultsExcel;


// ─────────────────────────────────────────────────────────────
// ১০. DOMContentLoaded — Event Listeners attach করা
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Exam Registration Modal খোলার সময় auto-populate
  const examModal = document.getElementById('examRegistrationModal');
  if (examModal) {
    examModal.addEventListener('show.bs.modal', () => {
      populateExamModal();
    });
    examModal.addEventListener('hidden.bs.modal', () => {
      // edit mode clear
      const form = document.getElementById('examRegistrationForm');
      if (form) {
        delete form.dataset.editId;
        form.reset();
        const idInput    = document.getElementById('examStudentIdInput');
        const batchInput = document.getElementById('examStudentBatchInput');
        if (idInput)    idInput.value    = '';
        if (batchInput) batchInput.value = '';
      }
    });
  }

  console.log('✅ Exam Fix Module Loaded — Wings Fly Aviation');
});


// ─────────────────────────────────────────────────────────────
// ১১. updateRecentExams — Dashboard recent exams widget
// ─────────────────────────────────────────────────────────────
function updateRecentExams() {
  const container = document.getElementById('recentExamsList');
  if (!container) return;

  const exams = ((window.globalData && window.globalData.examRegistrations) || [])
    .slice()
    .sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0))
    .slice(0, 5);

  if (exams.length === 0) {
    container.innerHTML = `<div class="text-center text-muted py-3 small">No exam registrations yet.</div>`;
    return;
  }

  container.innerHTML = exams.map(r => `
    <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-opacity-25">
      <div>
        <div class="fw-semibold small">${r.studentName}</div>
        <div class="text-muted" style="font-size:0.75rem;">${r.subjectName} • ${r.registrationDate || ''}</div>
      </div>
      <span class="fw-bold text-success small">৳${window.formatNumber ? window.formatNumber(r.examFee) : r.examFee}</span>
    </div>
  `).join('');
}
window.updateRecentExams = updateRecentExams;

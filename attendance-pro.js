// ============================================
// WINGS FLY — ATTENDANCE PRO MODULE
// Monthly | Yearly | Course-wise | Mark + Blank Sheet
// ============================================

(function () {
  'use strict';

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
  const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // ── Helper ──────────────────────────────────────────
  function gd() { return window.globalData || {}; }
  function fmt(n) { return window.formatNumber ? window.formatNumber(n) : n; }

  function getBatches() {
    return [...new Set((gd().students || []).map(s => s.batch))].filter(Boolean).sort();
  }
  function getCourses() {
    return [...new Set((gd().students || []).map(s => s.course))].filter(Boolean).sort();
  }
  function getYears() {
    const now = new Date().getFullYear();
    return [now - 2, now - 1, now, now + 1];
  }

  function buildBatchOptions(selId, label = 'All Batches') {
    const el = document.getElementById(selId);
    if (!el) return;
    el.innerHTML = `<option value="">${label}</option>` +
      getBatches().map(b => `<option value="${b}">${b}</option>`).join('');
  }
  function buildCourseOptions(selId) {
    const el = document.getElementById(selId);
    if (!el) return;
    el.innerHTML = `<option value="">All Courses</option>` +
      getCourses().map(c => `<option value="${c}">${c}</option>`).join('');
  }
  function buildYearOptions(selId, selected) {
    const el = document.getElementById(selId);
    if (!el) return;
    const cur = selected || new Date().getFullYear();
    el.innerHTML = getYears().map(y =>
      `<option value="${y}"${y === cur ? ' selected' : ''}>${y}</option>`).join('');
  }
  function buildMonthOptions(selId, selected) {
    const el = document.getElementById(selId);
    if (!el) return;
    const cur = selected !== undefined ? selected : new Date().getMonth();
    el.innerHTML = MONTH_NAMES.map((m, i) =>
      `<option value="${i}"${i === cur ? ' selected' : ''}>${m}</option>`).join('');
  }

  function rateColor(r) {
    if (r >= 75) return 'var(--att-green)';
    if (r >= 50) return 'var(--att-gold)';
    return 'var(--att-red)';
  }

  // ── Open Hub ────────────────────────────────────────
  function openAttendanceModal() {
    buildHubModal();
    // পুরনো hide state reset করো
    const modalEl = document.getElementById('attendanceHubModal');
    if (modalEl) modalEl.style.display = '';
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
    switchAttTab('mark');
  }
  window.openAttendanceModal = openAttendanceModal;

  // ── Hub Modal HTML ──────────────────────────────────
  function buildHubModal() {
    if (document.getElementById('attendanceHubModal')) {
      // refresh dropdowns
      buildBatchOptions('attMarkBatch', 'Select Batch...');
      buildBatchOptions('attMonBatch', 'Select Batch...');
      buildBatchOptions('attYrBatch', 'Select Batch...');
      buildBatchOptions('attCwBatch', 'All Batches');
      buildCourseOptions('attCwCourse');
      buildYearOptions('attMonYear');
      buildYearOptions('attYrYear');
      buildMonthOptions('attMonMonth');
      // set today
      const di = document.getElementById('attMarkDate');
      if (di && !di.value) di.value = new Date().toISOString().split('T')[0];
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'attendanceHubModal';
    modal.tabIndex = -1;
    modal.innerHTML = `
<div class="modal-dialog modal-xl modal-dialog-centered" style="max-width:1000px;">
  <div class="modal-content" style="background:linear-gradient(135deg,#07091c,#0e0a28,#07091c);border:1px solid rgba(0,217,255,0.25);border-radius:20px;overflow:hidden;font-family:'DM Sans',sans-serif;">

    <!-- Header -->
    <div class="modal-header border-0 pb-0 px-4 pt-4" style="background:rgba(0,0,0,0.3);">
      <div class="d-flex align-items-center gap-3">
        <div style="width:46px;height:46px;border-radius:12px;background:linear-gradient(135deg,#00d9ff,#b537f2);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(0,217,255,0.4);">
          <i class="bi bi-calendar-check-fill text-white fs-5"></i>
        </div>
        <div>
          <h5 class="modal-title fw-bold mb-0" style="font-family:'Rajdhani',sans-serif;font-size:1.3rem;color:#00d9ff;letter-spacing:1px;">ATTENDANCE CENTRE</h5>
          <div class="small" style="color:rgba(255,255,255,0.4);font-size:0.75rem;">Wings Fly Aviation Academy</div>
        </div>
      </div>
      <button type="button" class="btn-close btn-close-white" onclick="closeAttHub()"></button>
    </div>

    <!-- Tab Strip -->
    <div class="att-tab-strip no-print">
      <button class="att-tab-btn active" id="attTab-mark"    onclick="switchAttTab('mark')">
        <i class="bi bi-check2-square"></i>Mark Attendance
      </button>
      <button class="att-tab-btn" id="attTab-monthly"  onclick="switchAttTab('monthly')">
        <i class="bi bi-calendar3"></i>Monthly Report
      </button>
      <button class="att-tab-btn" id="attTab-yearly"   onclick="switchAttTab('yearly')">
        <i class="bi bi-calendar-range"></i>Yearly Report
      </button>
      <button class="att-tab-btn" id="attTab-course"   onclick="switchAttTab('course')">
        <i class="bi bi-mortarboard"></i>Course-wise
      </button>
      <button class="att-tab-btn" id="attTab-blank"    onclick="switchAttTab('blank')">
        <i class="bi bi-file-earmark-ruled"></i>Blank Sheet
      </button>
    </div>

    <!-- Body -->
    <div class="modal-body p-0" style="overflow-y:auto;max-height:65vh;">

      <!-- ══ MARK ATTENDANCE ══════════════════════ -->
      <div class="att-pane active" id="attPane-mark">
        <div class="att-filter-row">
          <div class="att-filter-group">
            <label><i class="bi bi-people-fill"></i>Batch</label>
            <select id="attMarkBatch" onchange="loadAttendanceList()">
              <option value="">Select Batch...</option>
            </select>
          </div>
          <div class="att-filter-group">
            <label><i class="bi bi-calendar-date"></i>Date</label>
            <input type="date" id="attMarkDate" onchange="loadAttendanceList()">
          </div>
          <div class="att-filter-group" style="justify-content:flex-end;">
            <label style="opacity:0;">&nbsp;</label>
            <div style="display:flex;gap:8px;align-items:center;padding-top:4px;">
              <span id="attMarkCountBadge" style="background:rgba(0,217,255,0.12);border:1px solid rgba(0,217,255,0.3);border-radius:8px;padding:6px 14px;font-family:'Rajdhani',sans-serif;font-size:0.8rem;color:rgba(0,217,255,0.8);letter-spacing:1px;text-transform:uppercase;">
                0 Students
              </span>
            </div>
          </div>
        </div>

        <!-- Select-all bar (hidden until loaded) -->
        <div class="att-select-all-bar d-none" id="attMarkSelectAll">
          <span><i class="bi bi-lightning-fill me-1"></i>Quick Mark All</span>
          <button class="att-btn-all-p" onclick="markAllStudents('Present')">✔ All Present</button>
          <button class="att-btn-all-a" onclick="markAllStudents('Absent')">✗ All Absent</button>
        </div>

        <!-- Student list -->
        <div id="attMarkContainer">
          <div class="att-empty">
            <i class="bi bi-people"></i>
            <p>Batch ও Date বেছে নিলেই Student List দেখাবে</p>
          </div>
        </div>
      </div>

      <!-- ══ MONTHLY REPORT ════════════════════════ -->
      <div class="att-pane" id="attPane-monthly">
        <div class="att-filter-row">
          <div class="att-filter-group">
            <label><i class="bi bi-people-fill"></i>Batch</label>
            <select id="attMonBatch" onchange="renderMonthlyReport()"><option value="">Select Batch...</option></select>
          </div>
          <div class="att-filter-group">
            <label><i class="bi bi-calendar-event"></i>Year</label>
            <select id="attMonYear" onchange="renderMonthlyReport()"></select>
          </div>
          <div class="att-filter-group">
            <label><i class="bi bi-calendar2-month"></i>Month</label>
            <select id="attMonMonth" onchange="renderMonthlyReport()"></select>
          </div>
        </div>

        <!-- Stats row -->
        <div class="att-stats-row d-none" id="attMonStats">
          <div class="att-stat-card cyan"><div class="val" id="attMonWd">—</div><div class="lbl">Working Days</div></div>
          <div class="att-stat-card cyan"><div class="val" id="attMonStu">—</div><div class="lbl">Students</div></div>
          <div class="att-stat-card green"><div class="val" id="attMonTotP">—</div><div class="lbl">Total Present</div></div>
          <div class="att-stat-card red"><div class="val" id="attMonTotA">—</div><div class="lbl">Total Absent</div></div>
          <div class="att-stat-card gold"><div class="val" id="attMonAvg">—</div><div class="lbl">Avg Rate</div></div>
          <div class="att-stat-card purple"><div class="val" id="attMonBest">—</div><div class="lbl">Top Attender</div></div>
        </div>

        <!-- Table -->
        <div id="attMonTableWrap">
          <div class="att-empty"><i class="bi bi-calendar3"></i><p>Batch, Year ও Month বেছে নিন</p></div>
        </div>
      </div>

      <!-- ══ YEARLY REPORT ════════════════════════ -->
      <div class="att-pane" id="attPane-yearly">
        <div class="att-filter-row">
          <div class="att-filter-group">
            <label><i class="bi bi-people-fill"></i>Batch</label>
            <select id="attYrBatch" onchange="renderYearlyReport()"><option value="">Select Batch...</option></select>
          </div>
          <div class="att-filter-group">
            <label><i class="bi bi-calendar-event"></i>Year</label>
            <select id="attYrYear" onchange="renderYearlyReport()"></select>
          </div>
        </div>
        <div id="attYrContent">
          <div class="att-empty"><i class="bi bi-calendar-range"></i><p>Batch ও Year বেছে নিন</p></div>
        </div>
      </div>

      <!-- ══ COURSE-WISE ════════════════════════ -->
      <div class="att-pane" id="attPane-course">
        <div class="att-filter-row">
          <div class="att-filter-group">
            <label><i class="bi bi-mortarboard-fill"></i>Course</label>
            <select id="attCwCourse" onchange="renderCourseReport()"><option value="">All Courses</option></select>
          </div>
          <div class="att-filter-group">
            <label><i class="bi bi-people-fill"></i>Batch (optional)</label>
            <select id="attCwBatch" onchange="renderCourseReport()"><option value="">All Batches</option></select>
          </div>
          <div class="att-filter-group">
            <label><i class="bi bi-calendar-event"></i>Year</label>
            <select id="attCwYear" onchange="renderCourseReport()"></select>
          </div>
          <div class="att-filter-group">
            <label><i class="bi bi-calendar2-month"></i>Month</label>
            <select id="attCwMonth" onchange="renderCourseReport()"></select>
          </div>
        </div>
        <div id="attCwContent">
          <div class="att-empty"><i class="bi bi-mortarboard"></i><p>Course বেছে নিন</p></div>
        </div>
      </div>

      <!-- ══ BLANK SHEET ════════════════════════ -->
      <div class="att-pane" id="attPane-blank">
        <div class="att-filter-row">
          <div class="att-filter-group">
            <label><i class="bi bi-people-fill"></i>Batch</label>
            <select id="attBlankBatch">
              <option value="">Select Batch...</option>
            </select>
          </div>
          <div class="att-filter-group">
            <label><i class="bi bi-grid-3x3-gap"></i>Columns (Days)</label>
            <select id="attBlankCols">
              <option value="15">15 Days</option>
              <option value="20">20 Days</option>
              <option value="26" selected>26 Days</option>
              <option value="31">31 Days (Full Month)</option>
            </select>
          </div>
          <div class="att-filter-group">
            <label><i class="bi bi-file-text"></i>Month / Session Label</label>
            <input type="text" id="attBlankLabel" placeholder="e.g. January 2026">
          </div>
        </div>

        <!-- Options -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-width:680px;">
          <div class="att-blank-option" onclick="printBlankSheet('portrait')">
            <div class="opt-icon">📄</div>
            <div class="opt-text">
              <div class="title">Portrait Sheet</div>
              <div class="desc">A4 Portrait — ছোট batch (≤15 students)</div>
            </div>
            <i class="bi bi-chevron-right ms-auto" style="color:rgba(0,217,255,0.4);"></i>
          </div>
          <div class="att-blank-option" onclick="printBlankSheet('landscape')">
            <div class="opt-icon">📋</div>
            <div class="opt-text">
              <div class="title">Landscape Sheet</div>
              <div class="desc">A4 Landscape — বেশি columns/students</div>
            </div>
            <i class="bi bi-chevron-right ms-auto" style="color:rgba(0,217,255,0.4);"></i>
          </div>
          <div class="att-blank-option" onclick="printBlankSheet('monthly-grid')">
            <div class="opt-icon">📅</div>
            <div class="opt-text">
              <div class="title">Monthly Grid</div>
              <div class="desc">Calendar-style grid with all 31 days</div>
            </div>
            <i class="bi bi-chevron-right ms-auto" style="color:rgba(0,217,255,0.4);"></i>
          </div>
          <div class="att-blank-option" onclick="printBlankSheet('signature')">
            <div class="opt-icon">✍️</div>
            <div class="opt-text">
              <div class="title">Signature Sheet</div>
              <div class="desc">Name + wide signature column — formal</div>
            </div>
            <i class="bi bi-chevron-right ms-auto" style="color:rgba(0,217,255,0.4);"></i>
          </div>
        </div>
      </div>

    </div><!-- /modal-body -->

    <!-- Footer Actions -->
    <div class="att-action-row no-print">
      <button class="att-btn att-btn-ghost" onclick="closeAttHub()">
        <i class="bi bi-x"></i>Close
      </button>
      <button class="att-btn att-btn-outline" onclick="exportAttCsv()">
        <i class="bi bi-download"></i>CSV Export
      </button>
      <button class="att-btn att-btn-outline" onclick="printCurrentAttView()">
        <i class="bi bi-printer"></i>Print
      </button>
      <button class="att-btn att-btn-primary" onclick="saveAttendance()">
        <i class="bi bi-check-lg"></i>Save Attendance
      </button>
    </div>

  </div>
</div>`;

    document.body.appendChild(modal);

    // Build dropdowns
    buildBatchOptions('attMarkBatch', 'Select Batch...');
    buildBatchOptions('attMonBatch', 'Select Batch...');
    buildBatchOptions('attYrBatch', 'Select Batch...');
    buildBatchOptions('attCwBatch', 'All Batches');
    buildBatchOptions('attBlankBatch', 'Select Batch...');
    buildCourseOptions('attCwCourse');
    buildYearOptions('attMonYear');
    buildYearOptions('attYrYear');
    buildYearOptions('attCwYear');
    buildMonthOptions('attMonMonth');
    buildMonthOptions('attCwMonth');

    const di = document.getElementById('attMarkDate');
    if (di) di.value = new Date().toISOString().split('T')[0];
  }

  // ── Safe close function ──────────────────────────────
  function closeAttHub() {
    const modalEl = document.getElementById('attendanceHubModal');
    if (!modalEl) return;
    // শুধু hide করো — remove করো না, window বন্ধ করো না
    modalEl.style.display = 'none';
    modalEl.classList.remove('show');
    // backdrop সরাও
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
    // body scroll ঠিক করো
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }
  window.closeAttHub = closeAttHub;
  function switchAttTab(tab) {
    document.querySelectorAll('.att-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.att-pane').forEach(p => p.classList.remove('active'));
    const btn = document.getElementById('attTab-' + tab);
    const pane = document.getElementById('attPane-' + tab);
    if (btn) btn.classList.add('active');
    if (pane) pane.classList.add('active');
  }
  window.switchAttTab = switchAttTab;

  // ── MARK ATTENDANCE ─────────────────────────────────
  function loadAttendanceList() {
    const batch = (document.getElementById('attMarkBatch') || document.getElementById('attendanceBatchSelect'))?.value;
    const date  = (document.getElementById('attMarkDate')  || document.getElementById('attendanceDate'))?.value;

    const container = document.getElementById('attMarkContainer') || document.getElementById('attendanceListContainer');
    const selectAll = document.getElementById('attMarkSelectAll');
    const countBadge = document.getElementById('attMarkCountBadge');

    if (!batch || !date) {
      if (container) container.innerHTML = `<div class="att-empty"><i class="bi bi-people"></i><p>Batch ও Date বেছে নিন</p></div>`;
      if (selectAll) selectAll.classList.add('d-none');
      return;
    }

    const batchStudents = (gd().students || []).filter(s => s.batch === batch);
    const attKey = `${batch}_${date}`;
    const saved  = gd().attendance?.[attKey] || {};

    if (countBadge) countBadge.textContent = `${batchStudents.length} Student${batchStudents.length !== 1 ? 's' : ''}`;
    if (selectAll && batchStudents.length > 0) selectAll.classList.remove('d-none');

    if (batchStudents.length === 0) {
      if (container) container.innerHTML = `<div class="att-empty"><i class="bi bi-person-x"></i><p>এই Batch-এ কোনো Student নেই</p></div>`;
      return;
    }

    // New mark UI
    if (container) {
      container.innerHTML = `<div class="att-mark-scroll" id="attMarkScroll">${
        batchStudents.map(s => {
          const status = saved[s.studentId] || 'Present';
          return `
          <div class="att-mark-student-row">
            <div class="stu-info">
              <div class="name">${s.name}</div>
              <div class="sid">${s.studentId || '—'}</div>
            </div>
            <div class="att-toggle-group">
              <button class="att-toggle-btn p-btn ${status !== 'Absent' ? 'active-p' : ''}"
                onclick="toggleAtt(this,'Present','${s.studentId}')">P</button>
              <button class="att-toggle-btn a-btn ${status === 'Absent' ? 'active-a' : ''}"
                onclick="toggleAtt(this,'Absent','${s.studentId}')">A</button>
            </div>
          </div>`;
        }).join('')
      }</div>`;
    }
  }
  window.loadAttendanceList = loadAttendanceList;

  function toggleAtt(btn, status, studentId) {
    const group = btn.closest('.att-toggle-group');
    group.querySelectorAll('.att-toggle-btn').forEach(b => {
      b.classList.remove('active-p', 'active-a');
    });
    if (status === 'Present') btn.classList.add('active-p');
    else btn.classList.add('active-a');
    btn.dataset.sid = studentId;
  }
  window.toggleAtt = toggleAtt;

  function markAllStudents(status) {
    document.querySelectorAll('.att-toggle-group').forEach(group => {
      group.querySelectorAll('.att-toggle-btn').forEach(b => {
        b.classList.remove('active-p', 'active-a');
      });
      if (status === 'Present') group.querySelector('.p-btn')?.classList.add('active-p');
      else group.querySelector('.a-btn')?.classList.add('active-a');
    });
  }
  window.markAllStudents = markAllStudents;

  function saveAttendance() {
    const batch = (document.getElementById('attMarkBatch') || document.getElementById('attendanceBatchSelect'))?.value;
    const date  = (document.getElementById('attMarkDate')  || document.getElementById('attendanceDate'))?.value;
    if (!batch || !date) {
      window.showErrorToast?.('❌ Batch ও Date বেছে নিন');
      return;
    }

    if (!gd().attendance) gd().attendance = {};
    const attKey = `${batch}_${date}`;
    const result = {};

    // Collect from new UI
    document.querySelectorAll('.att-mark-student-row').forEach(row => {
      const pBtn = row.querySelector('.p-btn');
      const aBtn = row.querySelector('.a-btn');
      // find student id from sid span
      const sid = row.querySelector('.sid')?.textContent?.trim();
      if (!sid || sid === '—') return;
      // Find real student
      const stu = (gd().students || []).find(s => (s.studentId || '').toString() === sid || s.name === row.querySelector('.name')?.textContent?.trim());
      if (stu) {
        result[stu.studentId] = aBtn?.classList.contains('active-a') ? 'Absent' : 'Present';
      }
    });

    gd().attendance[attKey] = result;
    window.saveToStorage?.();
    window.showSuccessToast?.(`✅ Attendance saved — ${batch} on ${date}`);

    // Modal বন্ধ করো — পুরো page নয়
    closeAttHub();
  }
  window.saveAttendance = saveAttendance;

  // ── MONTHLY REPORT ──────────────────────────────────
  function renderMonthlyReport() {
    const batch = document.getElementById('attMonBatch')?.value;
    const year  = parseInt(document.getElementById('attMonYear')?.value);
    const month = parseInt(document.getElementById('attMonMonth')?.value);
    const wrap  = document.getElementById('attMonTableWrap');
    const stats = document.getElementById('attMonStats');

    if (!batch || !wrap) { return; }

    const daysInMonth   = new Date(year, month + 1, 0).getDate();
    const batchStudents = (gd().students || []).filter(s => s.batch === batch);

    if (batchStudents.length === 0) {
      wrap.innerHTML = `<div class="att-empty"><i class="bi bi-person-x"></i><p>এই Batch-এ কোনো Student নেই</p></div>`;
      if (stats) stats.classList.add('d-none');
      return;
    }

    // Working days
    const workingDays = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (gd().attendance?.[`${batch}_${ds}`]) workingDays.push(d);
    }

    let totalP = 0, totalA = 0, bestName = '—', bestRate = -1;

    const rows = batchStudents.map((s, idx) => {
      let p = 0, a = 0;
      const cells = Array.from({ length: daysInMonth }, (_, i) => {
        const d  = i + 1;
        const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayData = gd().attendance?.[`${batch}_${ds}`];
        const st = dayData ? dayData[s.studentId] : undefined;
        const isWD = !!dayData;
        const isFri = new Date(year, month, d).getDay() === 5;
        let bg = '', txt = '', cell = '';
        if (st === 'Present') { bg = 'rgba(0,255,136,0.18)'; txt = '#00ff88'; cell = 'P'; p++; }
        else if (st === 'Absent') { bg = 'rgba(255,59,92,0.18)'; txt = '#ff3b5c'; cell = 'A'; a++; }
        else if (isWD) { bg = ''; txt = 'rgba(255,255,255,0.15)'; cell = '—'; }
        else if (isFri) { bg = 'rgba(255,215,0,0.05)'; txt = 'rgba(255,215,0,0.25)'; cell = ''; }
        else { bg = ''; txt = 'rgba(255,255,255,0.06)'; cell = ''; }
        return `<td style="text-align:center;min-width:26px;border:1px solid rgba(255,255,255,0.05);background:${bg};color:${txt};font-weight:700;font-size:0.72rem;padding:3px 1px;">${cell}</td>`;
      }).join('');

      totalP += p; totalA += a;
      const rate = workingDays.length > 0 ? Math.round(p / workingDays.length * 100) : 0;
      if (rate > bestRate) { bestRate = rate; bestName = s.name.split(' ')[0]; }
      const rc = rateColor(rate);
      const rowBg = idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent';

      return `<tr style="background:${rowBg};">
        <td style="padding:8px 10px;border:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);text-align:center;font-size:0.78rem;">${idx+1}</td>
        <td style="padding:8px 12px;border:1px solid rgba(255,255,255,0.05);color:#00d9ff;font-size:0.75rem;font-family:monospace;white-space:nowrap;">${s.studentId||'—'}</td>
        <td style="padding:8px 14px;border:1px solid rgba(255,255,255,0.05);font-weight:600;white-space:nowrap;">${s.name}</td>
        ${cells}
        <td style="text-align:center;border:1px solid rgba(255,255,255,0.05);background:rgba(0,255,136,0.08);font-weight:800;color:#00ff88;padding:4px 8px;">${p}</td>
        <td style="text-align:center;border:1px solid rgba(255,255,255,0.05);background:rgba(255,59,92,0.08);font-weight:800;color:#ff3b5c;padding:4px 8px;">${a}</td>
        <td style="text-align:center;border:1px solid rgba(255,255,255,0.05);font-weight:800;color:${rc};padding:4px 10px;font-size:0.85rem;">${rate}%</td>
      </tr>`;
    }).join('');

    // Day headers
    const dayThs = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isWD  = !!(gd().attendance?.[`${batch}_${ds}`]);
      const isFri = new Date(year, month, d).getDay() === 5;
      const bg  = isWD ? 'rgba(0,217,255,0.18)' : (isFri ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.04)');
      const txt = isWD ? '#00d9ff' : (isFri ? '#ffd700' : 'rgba(255,255,255,0.3)');
      return `<th style="text-align:center;min-width:26px;font-size:0.68rem;background:${bg};color:${txt};border:1px solid rgba(255,255,255,0.07);padding:5px 2px;">${d}</th>`;
    }).join('');

    wrap.innerHTML = `
    <div class="att-table-wrap" style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="font-family:'Rajdhani',sans-serif;">
            <th style="padding:9px 10px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,217,255,0.1);color:rgba(0,217,255,0.7);font-size:0.7rem;letter-spacing:1px;text-align:center;">#</th>
            <th style="padding:9px 12px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,217,255,0.1);color:rgba(0,217,255,0.7);font-size:0.7rem;letter-spacing:1px;white-space:nowrap;">ID</th>
            <th style="padding:9px 14px;border:1px solid rgba(255,255,255,0.08);background:rgba(0,217,255,0.1);color:rgba(0,217,255,0.7);font-size:0.7rem;letter-spacing:1px;white-space:nowrap;">Student Name</th>
            ${dayThs}
            <th style="text-align:center;border:1px solid rgba(255,255,255,0.08);background:rgba(0,255,136,0.12);color:#00ff88;font-size:0.7rem;padding:5px 8px;">P</th>
            <th style="text-align:center;border:1px solid rgba(255,255,255,0.08);background:rgba(255,59,92,0.12);color:#ff3b5c;font-size:0.7rem;padding:5px 8px;">A</th>
            <th style="text-align:center;border:1px solid rgba(255,255,255,0.08);background:rgba(255,215,0,0.08);color:#ffd700;font-size:0.7rem;padding:5px 8px;">Rate</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

    // Update stats
    const avgRate = workingDays.length && batchStudents.length
      ? Math.round(totalP / (workingDays.length * batchStudents.length) * 100) : 0;
    if (stats) {
      stats.classList.remove('d-none');
      document.getElementById('attMonWd').textContent   = workingDays.length;
      document.getElementById('attMonStu').textContent  = batchStudents.length;
      document.getElementById('attMonTotP').textContent = totalP;
      document.getElementById('attMonTotA').textContent = totalA;
      document.getElementById('attMonAvg').textContent  = avgRate + '%';
      document.getElementById('attMonBest').textContent = bestName;
    }
  }
  window.renderMonthlyReport = renderMonthlyReport;

  // ── YEARLY REPORT ───────────────────────────────────
  function renderYearlyReport() {
    const batch = document.getElementById('attYrBatch')?.value;
    const year  = parseInt(document.getElementById('attYrYear')?.value);
    const wrap  = document.getElementById('attYrContent');
    if (!batch || !wrap) return;

    const batchStudents = (gd().students || []).filter(s => s.batch === batch);
    if (batchStudents.length === 0) {
      wrap.innerHTML = `<div class="att-empty"><i class="bi bi-person-x"></i><p>এই Batch-এ কোনো Student নেই</p></div>`;
      return;
    }

    // Build per-student yearly summary
    const stuData = batchStudents.map(s => {
      let totalP = 0, totalA = 0, totalWD = 0;
      const monthData = MONTH_NAMES.map((mn, mi) => {
        const daysInMonth = new Date(year, mi + 1, 0).getDate();
        let mp = 0, ma = 0, mwd = 0;
        for (let d = 1; d <= daysInMonth; d++) {
          const ds  = `${year}-${String(mi+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const key = `${batch}_${ds}`;
          const dayData = gd().attendance?.[key];
          if (dayData) {
            mwd++;
            const st = dayData[s.studentId];
            if (st === 'Present') mp++;
            else if (st === 'Absent') ma++;
          }
        }
        totalP += mp; totalA += ma; totalWD += mwd;
        const rate = mwd > 0 ? Math.round(mp / mwd * 100) : null;
        return { mn, mi, mp, ma, mwd, rate };
      });
      const rate = totalWD > 0 ? Math.round(totalP / totalWD * 100) : 0;
      return { s, monthData, totalP, totalA, totalWD, rate };
    });

    // Stats row
    const overallP = stuData.reduce((a, x) => a + x.totalP, 0);
    const overallA = stuData.reduce((a, x) => a + x.totalA, 0);
    const best     = stuData.reduce((b, x) => x.rate > (b?.rate || -1) ? x : b, null);

    const statsHtml = `
    <div class="att-stats-row" style="margin-bottom:20px;">
      <div class="att-stat-card cyan"><div class="val">${batchStudents.length}</div><div class="lbl">Students</div></div>
      <div class="att-stat-card green"><div class="val">${overallP}</div><div class="lbl">Total Present</div></div>
      <div class="att-stat-card red"><div class="val">${overallA}</div><div class="lbl">Total Absent</div></div>
      <div class="att-stat-card gold"><div class="val">${best ? best.rate + '%' : '—'}</div><div class="lbl">Best Rate</div></div>
      <div class="att-stat-card purple"><div class="val" style="font-size:0.9rem;">${best ? best.s.name.split(' ')[0] : '—'}</div><div class="lbl">Top Attender</div></div>
    </div>`;

    // Table header months
    const monthThs = MONTH_NAMES.map(m =>
      `<th style="text-align:center;min-width:52px;background:rgba(0,217,255,0.08);color:rgba(0,217,255,0.7);font-size:0.68rem;letter-spacing:1px;border:1px solid rgba(255,255,255,0.06);padding:7px 3px;">${m.slice(0,3).toUpperCase()}</th>`
    ).join('');

    const tableRows = stuData.map((sd, idx) => {
      const monthCells = sd.monthData.map(md => {
        if (md.mwd === 0) return `<td style="text-align:center;border:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.1);font-size:0.75rem;">—</td>`;
        const rc = rateColor(md.rate);
        return `<td style="text-align:center;border:1px solid rgba(255,255,255,0.05);font-weight:700;font-size:0.75rem;color:${rc};">${md.rate}%</td>`;
      }).join('');
      const overallRc = rateColor(sd.rate);
      return `<tr style="background:${idx%2===0?'rgba(255,255,255,0.015)':'transparent'};">
        <td style="padding:8px 12px;border:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);text-align:center;">${idx+1}</td>
        <td style="padding:8px 14px;border:1px solid rgba(255,255,255,0.05);font-weight:600;white-space:nowrap;">${sd.s.name}</td>
        <td style="padding:8px 10px;border:1px solid rgba(255,255,255,0.05);color:#00d9ff;font-family:monospace;font-size:0.75rem;">${sd.s.studentId||'—'}</td>
        ${monthCells}
        <td style="text-align:center;border:1px solid rgba(255,255,255,0.05);color:#00ff88;font-weight:800;background:rgba(0,255,136,0.08);">${sd.totalP}</td>
        <td style="text-align:center;border:1px solid rgba(255,255,255,0.05);color:#ff3b5c;font-weight:800;background:rgba(255,59,92,0.08);">${sd.totalA}</td>
        <td style="text-align:center;border:1px solid rgba(255,255,255,0.05);color:${overallRc};font-weight:800;font-size:0.88rem;">${sd.rate}%</td>
      </tr>`;
    }).join('');

    wrap.innerHTML = statsHtml + `
    <div class="att-table-wrap" style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
        <thead>
          <tr style="font-family:'Rajdhani',sans-serif;">
            <th style="padding:9px 10px;border:1px solid rgba(255,255,255,0.07);background:rgba(0,217,255,0.1);color:rgba(0,217,255,0.7);font-size:0.7rem;text-align:center;">#</th>
            <th style="padding:9px 14px;border:1px solid rgba(255,255,255,0.07);background:rgba(0,217,255,0.1);color:rgba(0,217,255,0.7);font-size:0.7rem;">Name</th>
            <th style="padding:9px 10px;border:1px solid rgba(255,255,255,0.07);background:rgba(0,217,255,0.1);color:rgba(0,217,255,0.7);font-size:0.7rem;">ID</th>
            ${monthThs}
            <th style="text-align:center;border:1px solid rgba(255,255,255,0.07);background:rgba(0,255,136,0.1);color:#00ff88;font-size:0.7rem;padding:5px 8px;">P</th>
            <th style="text-align:center;border:1px solid rgba(255,255,255,0.07);background:rgba(255,59,92,0.1);color:#ff3b5c;font-size:0.7rem;padding:5px 8px;">A</th>
            <th style="text-align:center;border:1px solid rgba(255,255,255,0.07);background:rgba(255,215,0,0.08);color:#ffd700;font-size:0.7rem;padding:5px 8px;">Rate</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;
  }
  window.renderYearlyReport = renderYearlyReport;

  // ── COURSE-WISE REPORT ──────────────────────────────
  function renderCourseReport() {
    const course = document.getElementById('attCwCourse')?.value;
    const batch  = document.getElementById('attCwBatch')?.value;
    const year   = parseInt(document.getElementById('attCwYear')?.value);
    const month  = parseInt(document.getElementById('attCwMonth')?.value);
    const wrap   = document.getElementById('attCwContent');
    if (!wrap) return;

    let students = gd().students || [];
    if (course) students = students.filter(s => s.course === course);
    if (batch)  students = students.filter(s => s.batch  === batch);

    if (students.length === 0) {
      wrap.innerHTML = `<div class="att-empty"><i class="bi bi-mortarboard"></i><p>কোনো Student পাওয়া যায়নি</p></div>`;
      return;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Group by batch
    const byBatch = {};
    students.forEach(s => {
      if (!byBatch[s.batch]) byBatch[s.batch] = [];
      byBatch[s.batch].push(s);
    });

    let html = '';
    Object.entries(byBatch).forEach(([b, stuList]) => {
      let totalP = 0, totalA = 0, wd = 0;
      const stuRows = stuList.map(s => {
        let p = 0, a = 0;
        for (let d = 1; d <= daysInMonth; d++) {
          const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const dayData = gd().attendance?.[`${b}_${ds}`];
          if (dayData) {
            if (d === 1) wd++;
            const st = dayData[s.studentId];
            if (st === 'Present') p++;
            else if (st === 'Absent') a++;
          }
        }
        totalP += p; totalA += a;
        const rate = (p + a) > 0 ? Math.round(p / (p + a) * 100) : 0;
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.05);">
          <div>
            <div style="font-weight:600;font-size:0.88rem;">${s.name}</div>
            <div style="font-size:0.72rem;color:#00d9ff;opacity:0.7;font-family:monospace;">${s.studentId||'—'}</div>
          </div>
          <div style="display:flex;align-items:center;gap:14px;font-family:'Rajdhani',sans-serif;">
            <span style="color:#00ff88;font-weight:700;">${p}P</span>
            <span style="color:#ff3b5c;font-weight:700;">${a}A</span>
            <div class="att-rate-bar" style="width:80px;">
              <div class="att-rate-track"><div class="att-rate-fill" style="width:${rate}%;background:${rateColor(rate)};"></div></div>
              <span style="color:${rateColor(rate)};font-weight:700;font-size:0.8rem;min-width:36px;">${rate}%</span>
            </div>
          </div>
        </div>`;
      }).join('');

      html += `
      <div class="att-month-block" style="margin-bottom:16px;">
        <div class="m-header">
          <span>📚 Batch: ${b}</span>
          <div style="display:flex;gap:14px;font-size:0.78rem;">
            <span style="color:#00ff88;">${totalP} Present</span>
            <span style="color:#ff3b5c;">${totalA} Absent</span>
            <span style="color:#ffd700;">${stuList.length} Students</span>
          </div>
        </div>
        <div class="att-table-wrap">${stuRows}</div>
      </div>`;
    });

    wrap.innerHTML = html;
  }
  window.renderCourseReport = renderCourseReport;

  // ── BLANK SHEET PRINT ────────────────────────────────
  function printBlankSheet(style = 'landscape') {
    const batch = document.getElementById('attBlankBatch')?.value;
    if (!batch) { window.showErrorToast?.('❌ Batch বেছে নিন'); return; }

    const cols  = parseInt(document.getElementById('attBlankCols')?.value) || 26;
    const label = document.getElementById('attBlankLabel')?.value || '';
    const students = (gd().students || []).filter(s => s.batch === batch);
    if (students.length === 0) { window.showErrorToast?.('❌ এই Batch-এ কোনো Student নেই'); return; }

    students.sort((a, b) => (a.studentId || '').toString().localeCompare((b.studentId || '').toString()));

    const logo1 = window.APP_LOGOS?.premium || 'wings_logo_premium.png';
    const logo2 = window.APP_LOGOS?.linear  || 'wings_logo_linear.png';
    const isPortrait = style === 'portrait';
    const isSignature = style === 'signature';
    const isMonthly = style === 'monthly-grid';
    const pw = window.open('', '', 'width=1200,height=900');

    let tableContent = '';

    if (isSignature) {
      // Signature sheet
      const rows = students.map((s, i) => `
        <tr style="height:38px;">
          <td style="border:1px solid #ccc;text-align:center;font-size:12px;color:#555;">${i+1}</td>
          <td style="border:1px solid #ccc;padding:4px 10px;font-weight:600;">${s.name}</td>
          <td style="border:1px solid #ccc;text-align:center;font-size:11px;color:#2c7da0;">${s.studentId||''}</td>
          <td style="border:1px solid #ccc;"></td>
        </tr>`).join('');
      tableContent = `
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1a4d6e;">
              <th style="border:1px solid #ccc;color:#fff;padding:8px;width:40px;text-align:center;">#</th>
              <th style="border:1px solid #ccc;color:#fff;padding:8px;text-align:left;">Student Name</th>
              <th style="border:1px solid #ccc;color:#fff;padding:8px;text-align:center;width:90px;">ID</th>
              <th style="border:1px solid #ccc;color:#fff;padding:8px;text-align:center;min-width:200px;">Signature</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    } else if (isMonthly) {
      // Monthly grid
      const colH = Array.from({ length: 31 }, (_, i) =>
        `<th style="border:1px solid #bcd;background:#e8f4ff;text-align:center;width:22px;font-size:10px;color:#1a4d6e;">${i+1}</th>`).join('');
      const rows = students.map((s, i) => {
        const cells = Array.from({ length: 31 }, () =>
          `<td style="border:1px solid #dde;height:28px;"></td>`).join('');
        return `<tr><td style="border:1px solid #bcd;text-align:center;font-size:11px;color:#555;">${i+1}</td>
          <td style="border:1px solid #bcd;padding:3px 8px;font-weight:600;font-size:12px;">${s.name}</td>
          ${cells}</tr>`;
      }).join('');
      tableContent = `
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead>
            <tr><th style="border:1px solid #bcd;background:#1a4d6e;color:#fff;width:35px;text-align:center;">#</th>
            <th style="border:1px solid #bcd;background:#1a4d6e;color:#fff;text-align:left;padding:6px;min-width:160px;">Name</th>
            ${colH}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    } else {
      // Standard landscape/portrait
      const colH = Array.from({ length: cols }, (_, i) =>
        `<th style="border:1px solid #000;width:${isPortrait ? 28 : 36}px;text-align:center;font-size:${isPortrait ? 9 : 11}px;">${i+1}</th>`).join('');
      const rows = students.map((s, i) => {
        const cells = Array.from({ length: cols }, () =>
          `<td style="border:1px solid #000;height:${isPortrait ? 28 : 32}px;"></td>`).join('');
        return `<tr>
          <td style="border:1px solid #000;text-align:center;font-size:${isPortrait ? 10 : 12}px;">${i+1}</td>
          <td style="border:1px solid #000;padding:3px 8px;font-weight:600;font-size:${isPortrait ? 11 : 13}px;font-style:italic;color:#1a4d6e;">${s.name}</td>
          ${cells}
        </tr>`;
      }).join('');
      tableContent = `
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="border:1px solid #000;background:#f0f8ff;width:40px;text-align:center;font-size:${isPortrait ? 9 : 11}px;color:#1a4d6e;">SL</th>
              <th style="border:1px solid #000;background:#f0f8ff;text-align:left;padding:5px 8px;font-size:${isPortrait ? 9 : 11}px;color:#1a4d6e;">Student Name</th>
              ${colH}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    }

    const orient = (isPortrait || isSignature) ? 'portrait' : 'landscape';
    const course = students[0]?.course || 'COURSE';

    pw.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8">
      <title>Attendance Sheet — ${batch}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', sans-serif; background: #fff; color: #111; padding: 18px 24px; }
        .header { margin-bottom: 18px; }
        .logo-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .academy-name { font-size: 22px; font-weight: 900; color: #1a4d6e; text-transform: uppercase; letter-spacing: 1px; }
        .sub { font-size: 13px; color: #2c7da0; font-weight: 600; }
        .sheet-title { font-size: 16px; font-weight: 800; color: #003366; text-transform: uppercase; border-bottom: 3px solid #00b4ff; display: inline-block; padding-bottom: 3px; margin: 6px 0; }
        .meta-row { display: flex; gap: 30px; margin: 8px 0 12px; font-size: 12px; }
        .meta-row .item .lbl { color: #aaa; text-transform: uppercase; font-size: 10px; font-weight: 600; }
        .meta-row .item .val { font-weight: 800; color: #1a4d6e; font-size: 13px; }
        .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: 700px; opacity: 0.04; z-index: -1; pointer-events: none; }
        .footer { margin-top: 14px; display: flex; justify-content: space-between; font-size: 10px; color: #bbb; border-top: 1px solid #eee; padding-top: 8px; }
        .legend { display: flex; gap: 16px; font-size: 11px; color: #555; margin: 8px 0; }
        .legend span { padding: 2px 8px; border-radius: 3px; font-weight: 600; }
        @media print { @page { size: A4 ${orient}; margin: 0.4in 0.4in; } body { padding: 0; } .no-print { display: none; } }
      </style>
    </head><body onload="window.print()">
      <img src="${logo2}" class="watermark">
      <div class="header">
        <div class="logo-row">
          <img src="${logo1}" style="height:65px;">
          <div style="text-align:center;">
            <div class="academy-name">Wings Fly Aviation Academy</div>
            <div class="sub">Attendance Register — ${isSignature ? 'Signature Sheet' : isMonthly ? 'Monthly Calendar' : (isPortrait ? 'Portrait' : 'Landscape') + ' Sheet'}</div>
          </div>
          <img src="${logo2}" style="height:48px;">
        </div>
        <div class="sheet-title">Student Attendance Sheet</div>
        <div class="meta-row">
          <div class="item"><div class="lbl">Batch</div><div class="val">${batch}</div></div>
          <div class="item"><div class="lbl">Course</div><div class="val">${course}</div></div>
          ${label ? `<div class="item"><div class="lbl">Session</div><div class="val">${label}</div></div>` : ''}
          <div class="item"><div class="lbl">Students</div><div class="val">${students.length}</div></div>
          <div class="item"><div class="lbl">Generated</div><div class="val">${new Date().toLocaleDateString()}</div></div>
        </div>
        <div class="legend">
          <span style="background:#e6f9f0;color:#006d35;">P = Present</span>
          <span style="background:#ffeef0;color:#c0001a;">A = Absent</span>
          <span style="background:#fff8e1;color:#7a5c00;">L = Late</span>
          <span style="background:#f0f0ff;color:#4000a0;">E = Excused</span>
        </div>
      </div>
      ${tableContent}
      <div class="footer">
        <span>Signature of Instructor: ___________________________</span>
        <span>Wings Fly Aviation Academy — Official Record</span>
        <span>Date: ______________________</span>
      </div>
    </body></html>`);
    pw.document.close();
  }
  window.printBlankSheet = printBlankSheet;
  // backwards compat
  window.printBlankAttendanceSheet = () => {
    const batch = document.getElementById('attendanceBatchSelect')?.value ||
                  document.getElementById('attMarkBatch')?.value;
    if (!batch) { window.showErrorToast?.('❌ Batch বেছে নিন'); return; }
    // open hub at blank tab
    openAttendanceModal();
    setTimeout(() => {
      switchAttTab('blank');
      const el = document.getElementById('attBlankBatch');
      if (el) el.value = batch;
    }, 300);
  };

  // ── EXPORT CSV ──────────────────────────────────────
  function exportAttCsv() {
    const activeTab = document.querySelector('.att-tab-btn.active')?.id?.replace('attTab-', '') || 'monthly';
    if (activeTab === 'monthly') window.downloadMonthlyAttendanceCsv?.();
    else window.showSuccessToast?.('📊 Monthly tab-এ গিয়ে CSV export করুন');
  }
  window.exportAttCsv = exportAttCsv;

  // ── PRINT current view ──────────────────────────────
  function printCurrentAttView() {
    // Active pane-এর content নিন
    const activePane = document.querySelector('#attendanceHubModal .att-pane.active');
    if (!activePane) { window.showErrorToast?.('কোনো content নেই'); return; }

    const activeTabName = document.querySelector('.att-tab-btn.active')?.textContent?.trim() || 'Attendance';
    const contentHtml = activePane.innerHTML;

    const pw = window.open('', '_blank', 'width=900,height=700');
    pw.document.write(`<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8">
  <title>Wings Fly — ${activeTabName}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
  <style>
    body { font-family: 'Arial', sans-serif; background: #fff; color: #000; padding: 20px; }
    h1, h2, h3, h4, h5, h6 { color: #1a1a2e; }
    .att-badge-p { background: #d4edda; color: #155724; padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 0.8rem; }
    .att-badge-a { background: #f8d7da; color: #721c24; padding: 2px 8px; border-radius: 10px; font-weight: bold; font-size: 0.8rem; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1a1a2e; color: #fff; padding: 8px 12px; text-align: left; font-size: 0.8rem; letter-spacing: 0.5px; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 0.85rem; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .att-stat-card { display: inline-block; padding: 10px 20px; margin: 5px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
    .att-stat-card .val { font-size: 1.3rem; font-weight: bold; }
    .att-empty { text-align: center; padding: 40px; color: #666; }
    .att-rate-bar, .att-rate-track, .att-rate-fill { display: none; }
    .no-print, button, .att-filter-row { display: none !important; }
    .att-mark-student-row { display: flex; justify-content: space-between; padding: 6px 10px; border-bottom: 1px solid #eee; }
    @media print { @page { size: A4; margin: 0.5in; } body { padding: 0; } }
    /* Header */
    .print-header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #1a1a2e; }
    .print-header h2 { margin: 0; color: #1a1a2e; }
    .print-header p { margin: 4px 0 0; color: #555; font-size: 0.85rem; }
  </style>
</head>
<body>
  <div class="print-header">
    <h2>✈ Wings Fly Aviation Academy</h2>
    <p>${activeTabName} — Printed on ${new Date().toLocaleDateString('en-BD')}</p>
  </div>
  ${contentHtml}
  <script>window.onload = function(){ window.print(); setTimeout(()=>window.close(), 1000); }<\/script>
</body></html>`);
    pw.document.close();
  }
  window.printCurrentAttView = printCurrentAttView;

  // ── Keep old openAttendanceReportModal alive ─────────
  window.openAttendanceReportModal = function () {
    openAttendanceModal();
    setTimeout(() => switchAttTab('monthly'), 300);
  };

  console.log('✅ Attendance Pro Module loaded — Wings Fly');
})();

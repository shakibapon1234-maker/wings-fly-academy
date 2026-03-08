// ====================================
// WINGS FLY AVIATION ACADEMY
// DASHBOARD STATS — renderDashboard, updateGlobalStats, Reminders, Notifications
// Extracted from app.js (Phase 4)
// ====================================

// ===================================
function renderDashboard() {
  updateGlobalStats();
}
window.renderDashboard = renderDashboard;

// ✅ Counter animation — number 0 থেকে target এ count up করে
function animateCount(el, target, prefix = '', isFloat = false, duration = 900) {
  if (!el) return;
  const start = 0;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * ease);
    el.innerText = prefix + formatNumber(current);
    if (progress < 1) requestAnimationFrame(step);
    else el.innerText = prefix + formatNumber(target);
  }
  requestAnimationFrame(step);
}
window.animateCount = animateCount; // ✅ FIX: export করতে হবে নইলে কাজ করে না

function updateGlobalStats() {
  let income = 0;
  let expense = 0;

  // Update Academy Name display
  if (globalData.settings?.academyName) {
    const titleEl = document.querySelector('.page-title') || document.querySelector('.dashboard-header h2');
    if (titleEl) titleEl.innerText = globalData.settings.academyName;
  }

  // ── CANONICAL RULES (finance-engine.js এর সাথে sync) ──
  // Loan Received / Loan Given  → Account-এ যায়, Income/Expense count হয় না
  // Transfer In / Transfer Out  → Account move, Income/Expense count হয় না
  // Income / Registration / Refund → Income stats
  // Expense / Salary / Rent / Utilities → Expense stats
  const STAT_INCOME_TYPES  = typeof window.FE_STAT_INCOME  !== 'undefined' ? window.FE_STAT_INCOME  : ['Income', 'Registration', 'Refund'];
  const STAT_EXPENSE_TYPES = typeof window.FE_STAT_EXPENSE !== 'undefined' ? window.FE_STAT_EXPENSE : ['Expense', 'Salary', 'Rent', 'Utilities'];

  // ✅ FIX: সব income/expense finance entries থেকে calculate করো
  // students.paid থেকে নয় — কারণ account balance finance entries থেকে rebuild হয়
  // দুটো আলাদা source থেকে calculate করলে mismatch হয়
  let totalStudentIncome = 0;
  let totalExamIncome = 0;
  let nonStudentIncome = 0;

  (globalData.finance || []).forEach(f => {
    if (f._deleted) return;
    const amt = parseFloat(f.amount) || 0;
    const cat = (f.category || '').toLowerCase();
    const desc = (f.description || '').toLowerCase();

    if (STAT_INCOME_TYPES.includes(f.type)) {
      const isExamRelated = cat.includes('exam') || desc.includes('exam fee') || desc.includes('exam reg');
      const isStudentRelated = cat.includes('student') || cat.includes('installment') ||
        cat.includes('admission') || cat.includes('fee') ||
        desc.includes('installment') || desc.includes('enrollment fee');

      if (isExamRelated)             totalExamIncome += amt;
      else if (isStudentRelated)     totalStudentIncome += amt;  // ✅ student entries count হবে
      else                           nonStudentIncome += amt;

    } else if (STAT_EXPENSE_TYPES.includes(f.type)) {
      expense += amt;
    }
    // Loan, Transfer → account balance-এ যায়, income/expense না
  });

  // Display Total for the 'Student Collection' card
  income = totalStudentIncome;

  // Overall Income for Profit calculation (Student + Exam + Other)
  const overallIncome = totalStudentIncome + totalExamIncome + nonStudentIncome;
  const profit = overallIncome - expense;

  // Update Exam Card UI
  const examEl = document.getElementById('dashTotalExam');
  if (examEl) examEl.textContent = '৳' + (totalExamIncome > 0 ? (typeof formatNumber === 'function' ? formatNumber(totalExamIncome) : totalExamIncome) : '0');

  // --- AVIATION PREMIUM DASHBOARD METRICS ---

  // 1. Total Students
  const dashStudentEl = document.getElementById('dashTotalStudents');
  const dashStudentCenter = document.getElementById('dashTotalStudentsCenter');
  if (dashStudentEl) animateCount(dashStudentEl, globalData.students.length, '', false, 800);
  if (dashStudentCenter) animateCount(dashStudentCenter, globalData.students.length, '', false, 800);

  // 2. Total Income
  const dashIncomeEl = document.getElementById('dashTotalIncome');
  if (dashIncomeEl) animateCount(dashIncomeEl, income, '৳', false, 1000);

  // 3. Total Expense
  const dashExpenseEl = document.getElementById('dashTotalExpense');
  if (dashExpenseEl) animateCount(dashExpenseEl, expense, '৳', false, 1000);

  // 4. Net Profit / Loss
  const dashProfitEl = document.getElementById('dashTotalProfit');
  const dashProfitStatus = document.getElementById('dashProfitStatus');

  if (dashProfitEl) {
    animateCount(dashProfitEl, Math.abs(profit), '৳', false, 1000);
    if (profit >= 0) {
      dashProfitEl.className = "av-card-value value-purple";
      if (dashProfitStatus) dashProfitStatus.innerText = "Net Profit";
    } else {
      dashProfitEl.className = "av-card-value value-red";
      if (dashProfitStatus) dashProfitStatus.innerText = "Net Loss";
    }
  }

  // --- NEW: Account Balance (Asset) Display ---
  const totalAssets = (parseFloat(globalData.cashBalance) || 0) +
    (globalData.bankAccounts || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0) +
    (globalData.mobileBanking || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);

  const dashAssetEl = document.getElementById('dashTotalAssets');
  if (dashAssetEl) {
    animateCount(dashAssetEl, totalAssets, '৳', false, 1100);
  }

  // Debug: reconciliation log in console
  const startBal = (globalData.settings?.startBalances?.Cash || 0);
  if (Math.abs(totalAssets - (profit + startBal)) > 10) {
    console.info(`[Stats] Assets(৳${totalAssets}) vs Profit+Start(৳${profit + startBal}) Gap: ৳${totalAssets - (profit + startBal)}`);
  }

  // Update New Dashboard Widgets
  renderDashLoanSummary();
  updateRecentActions();
  renderDashReminders();

  // Call Recent Admissions
  renderRecentAdmissions();

  // Call Charts Update
  if (typeof updateCharts === 'function') {
    updateCharts();
  }

  // --- ACCOUNT SUMMARY DISPLAY (Using ACTUAL account balances) ---
  const accountSummaryRow = document.getElementById('accountSummaryRow');
  if (accountSummaryRow) {
    accountSummaryRow.innerHTML = '';

    // Add Cash card first
    const cashBalance = parseFloat(globalData.cashBalance) || 0;
    const cashCard = `
      <div class="col-md-3 mb-4">
        <div class="card account-card cash-card">
          <div class="account-icon">💵</div>
          <div class="account-info">
            <span class="account-name">Cash Balance</span>
            <h4 class="account-val">৳${formatNumber(cashBalance)}</h4>
          </div>
        </div>
      </div>
    `;
    accountSummaryRow.innerHTML += cashCard;

    // Add Bank Account cards
    (globalData.bankAccounts || []).forEach(acc => {
      const balance = parseFloat(acc.balance) || 0;
      const card = `
        <div class="col-md-3 mb-4">
          <div class="card account-card bank-card">
            <div class="account-icon">🏦</div>
            <div class="account-info">
              <span class="account-name">${acc.name}</span>
              <h4 class="account-val">৳${formatNumber(balance)}</h4>
            </div>
          </div>
        </div>
      `;
      accountSummaryRow.innerHTML += card;
    });

    // Add Mobile Banking cards
    (globalData.mobileBanking || []).forEach(acc => {
      const balance = parseFloat(acc.balance) || 0;
      const card = `
        <div class="col-md-3 mb-4">
          <div class="card account-card mobile-card">
            <div class="account-icon">📱</div>
            <div class="account-info">
              <span class="account-name">${acc.name}</span>
              <h4 class="account-val">৳${formatNumber(balance)}</h4>
            </div>
          </div>
        </div>
      `;
      accountSummaryRow.innerHTML += card;
    });
  }

  // Check payment reminders
  if (typeof checkPaymentReminders === 'function') checkPaymentReminders();
  // Update Recent Actions
  if (typeof updateRecentActions === 'function') updateRecentActions();
  // Update Monthly Target
  if (typeof updateTargetProgress === 'function') updateTargetProgress();
  // Update Recent Exams
  if (typeof updateRecentExams === 'function') updateRecentExams();
  // Update Unified Search Dropdown
  if (typeof populateAccountDropdown === 'function') populateAccountDropdown();
}
function updateTargetProgress() {
  const targetStart = document.getElementById('targetStartDate')?.value;
  const targetEnd = document.getElementById('targetEndDate')?.value;

  // ── Canonical Income types only (Loan / Transfer বাদ) ──
  const STAT_INCOME_TYPES = typeof window.FE_STAT_INCOME !== 'undefined'
    ? window.FE_STAT_INCOME
    : ['Income', 'Registration', 'Refund'];

  const filteredIncome = (globalData.finance || [])
    .filter(f => {
      if (f._deleted) return false;
      if (!STAT_INCOME_TYPES.includes(f.type)) return false;
      if (targetStart && f.date < targetStart) return false;
      if (targetEnd && f.date > targetEnd) return false;
      return true;
    })
    .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);

  const target = globalData.settings.monthlyTarget || 200000;
  const percentage = Math.min(Math.round((filteredIncome / target) * 100), 100);

  // Update UI
  const pb = document.getElementById('targetProgressBar');
  const percText = document.getElementById('targetPercentage');
  const collText = document.getElementById('targetCollected');
  const totalText = document.getElementById('targetTotal');

  if (pb) pb.style.width = `${percentage}%`;
  if (percText) percText.innerText = `${percentage}%`;
  if (collText) collText.innerText = `৳${formatNumber(filteredIncome)}`;
  if (totalText) totalText.innerText = `৳${formatNumber(target)}`;
}

function checkDailyBackup() {
  const today = new Date().toISOString().split('T')[0];
  const lastBackup = localStorage.getItem('last_auto_backup_date');

  if (lastBackup !== today) {
    // ✅ Cloud pull শেষ হওয়ার পরে backup নাও — ৮ সেকেন্ড delay
    setTimeout(function () {
      console.log("Wings Fly: Daily auto-backup triggered (after cloud sync)");
      exportData();
      localStorage.setItem('last_auto_backup_date', today);
      showSuccessToast('📥 Daily Auto-Backup completed!');
    }, 8000);
  }
}

// ===================================
// PAYMENT REMINDERS
// ===================================

function checkPaymentReminders() {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const widget = document.getElementById('paymentRemindersWidget');
  const list = document.getElementById('remindersList');

  if (!widget || !list) return;

  // Filter students with any reminder date
  const reminders = globalData.students.filter(s => {
    return s.reminderDate && s.due > 0;
  }).sort((a, b) => a.reminderDate.localeCompare(b.reminderDate));

  // Update Sidebar Badge (Only Today or Overdue)
  const dueTodayOrOverdue = reminders.filter(s => s.reminderDate <= today).length;

  // Update Sidebar Badge
  const badge = document.getElementById('sidebarReminderBadge');
  if (badge) {
    if (dueTodayOrOverdue > 0) {
      badge.innerText = dueTodayOrOverdue;
      badge.classList.remove('d-none');
    } else {
      badge.classList.add('d-none');
    }
  }

  if (reminders.length === 0) {
    list.innerHTML = `
      <div class="text-muted text-center py-3">
        <p class="mb-0">No active reminders.</p>
      </div>
    `;
    return;
  }

  // Show widget
  widget.classList.remove('d-none');
  list.innerHTML = '';

  reminders.forEach(student => {
    const isOverdue = student.reminderDate < today;
    const isToday = student.reminderDate === today;

    let statusClass = 'info';
    let statusText = 'UPCOMING';

    if (isOverdue) {
      statusClass = 'danger';
      statusText = 'OVERDUE';
    } else if (isToday) {
      statusClass = 'warning';
      statusText = 'TODAY';
    }

    const item = document.createElement('div');
    item.className = 'list-group-item border-0 px-0';
    item.innerHTML = `
      <div class="d-flex justify-content-between align-items-start">
        <div class="flex-grow-1">
          <div class="d-flex align-items-center gap-2 mb-2">
            <h6 class="mb-0 fw-bold">${student.name}</h6>
            <span class="badge bg-${statusClass}-subtle text-${statusClass} fw-bold">${statusText}</span>
          </div>
          <div class="small text-muted">
            <span class="me-3">⏰ Reminder: ${student.reminderDate}</span>
            <span class="me-3">🎓 Batch: ${student.batch || 'N/A'}</span>
            <span class="me-3">🎓 ${student.course || 'N/A'}</span>
            <span class="text-danger fw-bold">Due: ৳${formatNumber(student.due)}</span>
          </div>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-success" onclick="markReminderDone('${student.rowIndex}')" title="Mark as contacted">
            ✔ Done
          </button>
          <button class="btn btn-sm btn-outline-secondary" onclick="snoozeReminder('${student.rowIndex}')" title="Set next reminder date">
            ⏰ Reschedule
          </button>
        </div>
      </div>
    `;
    list.appendChild(item);
  });
}

// ===================================
// DASHBOARD WIDGETS RENDERING
// ===================================

function updateRecentActions() {
  const list = document.getElementById('recentActionsList');
  if (!list) return;

  // Get last 5 transactions
  const transactions = [...(globalData.finance || [])].reverse().slice(0, 5);

  if (transactions.length === 0) {
    list.innerHTML = '<div class="text-muted text-center py-3">No recent actions</div>';
    const dashWorks = document.getElementById('dashRecentWorks');
    if (dashWorks) dashWorks.innerHTML = list.innerHTML;
    return;
  }

  list.innerHTML = '';
  transactions.forEach(f => {
    const isIncome = (f.type === 'Income' || f.type === 'Loan Received' || f.type === 'Loan Receiving' || f.type === 'Transfer In');
    const amountClass = isIncome ? 'text-success' : 'text-danger';
    const symbol = isIncome ? '+' : '-';

    // Determine descriptive Title & Icon
    let actionTitle = 'Transaction';
    let actionIcon = '';

    if (f.category === 'Student Fee') {
      actionTitle = 'Fee Payment';
      actionIcon = '👨‍🎓';
    } else if (f.type === 'Loan Given') {
      actionTitle = 'Give Loan';
      actionIcon = '🤝';
    } else if (f.type === 'Loan Received') {
      actionTitle = 'Recv Loan';
      actionIcon = '💥';
    } else if (f.type === 'Expense') {
      actionTitle = 'Add Expense';
      actionIcon = '💸';
    } else if (f.type === 'Income') {
      actionTitle = 'Add Income';
      actionIcon = '💰';
    } else if (f.type.includes('Transfer')) {
      actionTitle = 'Fund Transfer';
      actionIcon = '🔄';
    }

    const item = document.createElement('div');
    item.className = 'list-group-item border-0 px-0 small d-flex justify-content-between align-items-center';
    item.innerHTML = `
      <div class="d-flex align-items-center gap-2 overflow-hidden">
        <span class="flex-shrink-0 fs-5">${actionIcon}</span>
        <div class="text-truncate">
          <div class="fw-bold text-truncate" style="color:#deeeff;">${actionTitle}</div>
          <div style="font-size: 0.7rem; color:#94a3c4;">
            ${f.description || f.category} • ${f.date}
          </div>
        </div>
      </div>
      <div class="ms-2 fw-bold ${amountClass} flex-shrink-0">
        ${symbol}৳${formatNumber(f.amount)}
      </div>
    `;
    list.appendChild(item);
  });

  // Also populate dashRecentWorks if it exists
  const dashWorks = document.getElementById('dashRecentWorks');
  if (dashWorks) {
    dashWorks.innerHTML = list.innerHTML;
  }
}

function renderDashLoanSummary() {
  const container = document.getElementById('dashLoanSummary');
  if (!container) return;

  const personStats = {};
  globalData.finance.forEach(tx => {
    let person = tx.person;
    if (!person) return;
    person = person.trim();
    if (!personStats[person]) personStats[person] = { given: 0, received: 0, balance: 0 };
    if (tx.type === 'Loan Given') {
      personStats[person].given += tx.amount;
      personStats[person].balance -= tx.amount;
    } else if (tx.type === 'Loan Received') {
      personStats[person].received += tx.amount;
      personStats[person].balance += tx.amount;
    }
  });

  const debtors = Object.entries(personStats)
    .filter(([name, stats]) => stats.balance !== 0)
    .sort((a, b) => a[1].balance - b[1].balance) // Biggest debt first (more negative)
    .slice(0, 4);

  if (debtors.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-3">No active loans.</div>';
    return;
  }

  container.innerHTML = '<div class="list-group list-group-flush">';
  debtors.forEach(([name, stats]) => {
    const isReceivable = stats.balance < 0; // We gave them money, they owe us
    const color = isReceivable ? 'text-danger' : 'text-success';
    const label = isReceivable ? 'They Owe' : 'We Owe';

    container.innerHTML += `
      <div class="list-group-item border-0 px-0 d-flex justify-content-between align-items-center">
        <div>
          <div class="fw-bold">${name}</div>
          <small class="text-muted">${label}</small>
        </div>
        <div class="fw-bold ${color}">৳${formatNumber(Math.abs(stats.balance))}</div>
      </div>
    `;
  });
  container.innerHTML += '</div>';
}

function renderDashReminders() {
  const container = document.getElementById('dashReminders');
  if (!container) return;

  const today = new Date().toISOString().split('T')[0];
  const reminders = globalData.students
    .filter(s => s.reminderDate && (parseFloat(s.due) > 0))
    .sort((a, b) => a.reminderDate.localeCompare(b.reminderDate))
    .slice(0, 5);

  if (reminders.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-3">No upcoming reminders.</div>';
    return;
  }

  container.innerHTML = '<div class="list-group list-group-flush">';
  reminders.forEach(s => {
    const isOverdue = s.reminderDate < today;
    const dateColor = isOverdue ? 'text-danger' : 'text-primary';

    container.innerHTML += `
      <div class="list-group-item border-0 px-0 d-flex justify-content-between align-items-center">
        <div class="overflow-hidden">
          <div class="fw-bold text-truncate">${s.name}</div>
          <small class="${dateColor} fw-bold">${isOverdue ? 'OVERDUE' : 'Due'}: ${s.reminderDate}</small>
        </div>
        <div class="text-end">
          <div class="fw-bold text-danger">৳${formatNumber(s.due)}</div>
          <button class="btn btn-sm btn-link p-0 text-success text-decoration-none" onclick="openStudentPaymentModal(${s.rowIndex})">Paid?</button>
        </div>
      </div>
    `;
  });
  container.innerHTML += '</div>';
}

// BACKUP & RESTORE (Export/Import)

window.renderDashboard = renderDashboard;
window.updateGlobalStats = updateGlobalStats;
window.updateTargetProgress = updateTargetProgress;
window.checkDailyBackup = checkDailyBackup;
window.checkPaymentReminders = checkPaymentReminders;
window.updateRecentActions = updateRecentActions;
window.renderDashLoanSummary = renderDashLoanSummary;
window.renderDashReminders = renderDashReminders;

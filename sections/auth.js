// ====================================
// WINGS FLY AVIATION ACADEMY
// AUTH — Login, Logout, Dashboard Load, Tab Switch
// Extracted from app.js (Phase 5)
// ====================================

async function hashPassword(password) {
  try {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    // Fallback: return plain text if crypto not supported (very old browser)
    console.warn('⚠️ crypto.subtle not available — using plain text comparison');
    return password;
  }
}

// Upgrade user's stored plain text password to hash (one-time auto-migration)
async function migratePasswordIfNeeded(user, plainPassword) {
  // যদি stored password 64 chars (SHA-256 hex) না হয়, তাহলে এটা plain text — upgrade করো
  if (user.password && user.password.length !== 64) {
    const hashed = await hashPassword(user.password);
    user.password = hashed;
    await saveToStorage();
    console.log('🔐 Password upgraded to SHA-256 hash for user:', user.username);
  }
}

async function handleLogin(e) {
  e.preventDefault();

  const btn = document.getElementById('loginBtn');
  const err = document.getElementById('loginError');
  const form = document.getElementById('loginForm');

  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Checking...';
  btn.disabled = true;
  err.innerText = '';

  const username = form.username.value;
  const password = form.password.value;

  try {
    // CRITICAL: Ensure globalData exists and has users array
    if (!window.globalData) {
      window.globalData = {
        students: [],
        finance: [],
        employees: [],
        users: [
          { username: 'admin', password: 'e7d3bfb67567c3d94bcecb2ce65ef146eac83e50dc3f3b89e81bb647a8bada4c', role: 'admin', name: 'Admin' }
        ]
      };
    }

    // 1. Check against User List
    let validUser = null;

    // Safety check for users array
    if (!globalData.users || !Array.isArray(globalData.users)) {
      globalData.users = [
        {
          username: 'admin',
          password: 'e7d3bfb67567c3d94bcecb2ce65ef146eac83e50dc3f3b89e81bb647a8bada4c',
          role: 'admin',
          name: 'Admin'
        }
      ];
    }

    // A. Hash the input password for secure comparison
    const hashedInput = await hashPassword(password);

    // B. Check Local Users — hash compare (new) OR plain text compare (backward compat)
    validUser = globalData.users.find(u =>
      u.username === username &&
      (u.password === hashedInput || u.password === password)
    );

    // If found with plain text, auto-migrate to hash
    if (validUser) {
      await migratePasswordIfNeeded(validUser, password);
    }

    // Emergency fallback removed — use Settings to reset password if locked out

    // 3. Final validation
    if (validUser) {
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('username', validUser.name || username);
      sessionStorage.setItem('role', validUser.role || 'staff');

      // Update sidebar avatar
      const avatarEl = document.getElementById('sidebarAvatar');
      if (avatarEl) avatarEl.innerText = (validUser.name || username).charAt(0).toUpperCase();

      showDashboard(validUser.name || username);
    } else {
      err.innerText = 'Invalid username or password';
      btn.innerHTML = '<span>Login</span>';
      btn.disabled = false;
    }
  } catch (error) {
    console.error("Login Error:", error);
    err.innerText = "Connection error. Try again.";
    btn.innerHTML = '<span>Login</span>';
    btn.disabled = false;
  }
}

function showDashboard(username) {
  if (typeof logActivity === 'function') logActivity('login', 'LOGIN', 'User logged in: ' + username);
  document.getElementById('loginSection').classList.add('d-none');
  document.getElementById('dashboardSection').classList.remove('d-none');

  // URL থেকে username, password ও অন্য sensitive params সরিয়ে দাও
  try {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  } catch (e) { }

  const userEl = document.getElementById('sidebarUser') || document.getElementById('currentUser');
  if (userEl) userEl.innerText = username;

  // ✅ LOGIN: সবসময় dashboard-এ যাবে
  localStorage.setItem('wingsfly_active_tab', 'dashboard');
  sessionStorage.setItem('wf_just_logged_in', 'true');

  // ✅ FIX: নতুন PC/login-এ cloud থেকে latest data pull করে তারপর dashboard render করো
  // এতে করে পুরানো local data দিয়ে dashboard দেখানো বন্ধ হবে
  if (typeof window.loadFromCloud === 'function') {
    console.log('🔄 Login: pulling fresh data from cloud before rendering dashboard...');
    window.loadFromCloud(true).then(() => {  // force=true: 15s block bypass করবে
      console.log('✅ Login sync complete — loading dashboard');
      loadDashboard();
      // ✅ Cloud pull শেষ হওয়ার ৫ সেকেন্ড পর snapshot — সঠিক data নিশ্চিত
      setTimeout(function () {
        if (window.globalData) {
          if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
          if (!window.globalData.activityHistory) window.globalData.activityHistory = [];
        }
        takeSnapshot();
        console.log('📸 Login snapshot taken (5s after cloud sync)');
      }, 5000);
    }).catch(() => {
      // Cloud pull fail হলেও local data দিয়ে dashboard দেখাও
      console.warn('⚠️ Cloud pull failed — loading from local data');
      loadDashboard();
      // Cloud fail হলে ১০ সেকেন্ড পর retry করে snapshot নাও
      setTimeout(function () {
        if (window.globalData && (window.globalData.students || []).length > 0) {
          takeSnapshot();
          console.log('📸 Login snapshot taken (fallback, 10s)');
        }
      }, 10000);
    });
  } else {
    loadDashboard();
  }

  checkDailyBackup();
}

function logout() {
  if (typeof logActivity === 'function') logActivity('login', 'LOGOUT', 'User logged out: ' + (sessionStorage.getItem('username') || 'Admin'));
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('username');
  sessionStorage.removeItem('wf_just_logged_in');
  localStorage.setItem('wingsfly_active_tab', 'dashboard');

  document.getElementById('dashboardSection').classList.add('d-none');
  document.getElementById('loginSection').classList.remove('d-none');
  document.getElementById('loginForm').reset();
  document.getElementById('loginBtn').innerHTML = '<span>Login</span>';
  document.getElementById('loginBtn').disabled = false;
  document.getElementById('loginError').innerText = '';
}
window.handleLogin = handleLogin;
window.logout = logout;

// ===================================
// DASHBOARD LOADING
// ===================================


function loadDashboard() {
  const loader = document.getElementById('loader');
  const content = document.getElementById('content');

  if (loader) loader.style.display = 'block';
  if (content) content.style.display = 'none';

  setTimeout(() => {
    try {
      if (window.performance) {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        const mainStart = document.getElementById('mainStartDate');
        const mainEnd = document.getElementById('mainEndDate');
        if (mainStart) mainStart.value = '';
        if (mainEnd) mainEnd.value = '';
      }

      // ✅ LOGIN → Dashboard, REFRESH → Same Tab
      var justLoggedIn = sessionStorage.getItem('wf_just_logged_in') === 'true';
      var activeTab = 'dashboard';
      if (justLoggedIn) {
        // Fresh login: always dashboard
        sessionStorage.removeItem('wf_just_logged_in');
        activeTab = 'dashboard';
        localStorage.setItem('wingsfly_active_tab', 'dashboard');
      } else {
        // Page refresh: restore last tab
        activeTab = localStorage.getItem('wingsfly_active_tab') || 'dashboard';
      }

      switchTab(activeTab, false);

      updateGlobalStats();
      updateStudentCount();

      // Populate dropdowns with account data
      if (typeof populateDropdowns === 'function') {
        populateDropdowns(); // ✅ FIX: was populateAccountDropdown() — function doesn't exist
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      if (loader) loader.style.display = 'none';
      if (content) content.style.display = 'block';
    }
  }, 500);
}

// ===================================
// TAB MANAGEMENT
// ===================================

function switchTab(tab, refreshStats = true) {
  const dashboardBtn = document.getElementById('tabDashboard');
  const studentBtn = document.getElementById('tabStudents');
  const ledgerBtn = document.getElementById('tabLedger');
  const loansBtn = document.getElementById('tabLoans');
  const visitorBtn = document.getElementById('tabVisitors');
  const employeeBtn = document.getElementById('tabEmployees');
  const examBtn = document.getElementById('tabExamResults');

  const studentSection = document.getElementById('studentSection');
  const ledgerSection = document.getElementById('ledgerSection');
  const loanSection = document.getElementById('loanSection');
  const examResultsSection = document.getElementById('examResultsSection');
  const visitorSection = document.getElementById('visitorSection');
  const employeeSection = document.getElementById('employeeSection');
  const accountsSection = document.getElementById('accountsSection');
  const certificateSection = document.getElementById('certificateSection');
  const idcardsSection = document.getElementById('idcardsSection');
  const idCardsBtn = document.getElementById('tabIdCards');
  const globalFilterCard = document.getElementById('globalFilterCard');

  localStorage.setItem('wingsfly_active_tab', tab);

  // Reset all
  const accountsBtn = document.getElementById('tabAccounts');
  const certBtn = document.getElementById('tabCertificates');
  const allBtns = [dashboardBtn, studentBtn, ledgerBtn, loansBtn, visitorBtn, employeeBtn, examBtn, accountsBtn, certBtn, idCardsBtn];
  allBtns.forEach(btn => {
    if (btn) {
      btn.classList.remove('active');
      btn.classList.remove('av-sidebar-active');
    }
  });

  if (tab === 'dashboard') if (dashboardBtn) dashboardBtn.classList.add('av-sidebar-active');
  if (tab === 'students') if (studentBtn) studentBtn.classList.add('av-sidebar-active');
  if (tab === 'ledger') if (ledgerBtn) ledgerBtn.classList.add('av-sidebar-active');
  if (tab === 'loans') if (loansBtn) loansBtn.classList.add('av-sidebar-active');
  if (tab === 'visitors') if (visitorBtn) visitorBtn.classList.add('av-sidebar-active');
  if (tab === 'employees') if (employeeBtn) employeeBtn.classList.add('av-sidebar-active');
  if (tab === 'examResults') if (examBtn) examBtn.classList.add('av-sidebar-active');

  const dashboardOverview = document.getElementById('dashboardOverview');
  if (dashboardOverview) dashboardOverview.classList.add('d-none');
  if (studentSection) studentSection.classList.add('d-none');
  if (ledgerSection) ledgerSection.classList.add('d-none');
  if (loanSection) loanSection.classList.add('d-none');
  if (examResultsSection) examResultsSection.classList.add('d-none');
  if (visitorSection) visitorSection.classList.add('d-none');
  if (employeeSection) employeeSection.classList.add('d-none');
  if (accountsSection) accountsSection.classList.add('d-none');
  if (certificateSection) certificateSection.classList.add('d-none');
  if (idcardsSection) idcardsSection.classList.add('d-none');
  if (batchSummaryCard) batchSummaryCard.classList.add('d-none');
  if (globalFilterCard) globalFilterCard.classList.add('d-none');

  if (tab === 'dashboard') {
    if (dashboardBtn) dashboardBtn.classList.add('active');
    if (dashboardOverview) dashboardOverview.classList.remove('d-none');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'Welcome back, Admin!';
  } else if (tab === 'students') {
    if (studentBtn) studentBtn.classList.add('active');
    if (studentSection) studentSection.classList.remove('d-none');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'Student Management';
    filterData();
  } else if (tab === 'ledger') {
    if (ledgerBtn) ledgerBtn.classList.add('active');
    if (ledgerSection) ledgerSection.classList.remove('d-none');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'Financial Ledger';
    filterData();
  } else if (tab === 'loans') {
    if (loansBtn) loansBtn.classList.add('active');
    if (loanSection) loanSection.classList.remove('d-none');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'Loan & Personal Ledger';
    if (typeof renderLoanSummary === 'function') renderLoanSummary();
  } else if (tab === 'visitors') {
    if (visitorBtn) visitorBtn.classList.add('active');
    if (visitorSection) {
      visitorSection.classList.remove('d-none');
      const pageTitle = document.querySelector('.page-title');
      if (pageTitle) pageTitle.textContent = 'Visitor Management';
      if (typeof renderVisitors === 'function') renderVisitors();
    }
  } else if (tab === 'employees') {
    if (employeeBtn) employeeBtn.classList.add('active');
    if (employeeSection) {
      employeeSection.classList.remove('d-none');
      const pageTitle = document.querySelector('.page-title');
      if (pageTitle) pageTitle.textContent = 'Employee Management';
      if (typeof renderEmployeeList === 'function') renderEmployeeList();
    }
  } else if (tab === 'examResults') {
    if (examBtn) examBtn.classList.add('active');
    if (examResultsSection) examResultsSection.classList.remove('d-none');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'Exam Results & Grades';
    if (typeof searchExamResults === 'function') searchExamResults();
  } else if (tab === 'accounts') {
    if (accountsBtn) accountsBtn.classList.add('active');
    if (accountsSection) accountsSection.classList.remove('d-none');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'Account Management';

    // Render all account sections
    renderAccountList();
    if (typeof renderCashBalance === 'function') renderCashBalance();
    if (typeof renderMobileBankingList === 'function') renderMobileBankingList();
    if (typeof updateGrandTotal === 'function') updateGrandTotal();
  } else if (tab === 'idcards') {
    if (idCardsBtn) idCardsBtn.classList.add('av-sidebar-active');
    if (idCardsBtn) idCardsBtn.classList.add('active');
    if (idcardsSection) idcardsSection.classList.remove('d-none');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'ID Card Generator';
    if (typeof initIdCardSection === 'function') initIdCardSection();
  } else if (tab === 'certificates') {
    if (certBtn) certBtn.classList.add('av-sidebar-active');
    if (certBtn) certBtn.classList.add('active');
    if (certificateSection) certificateSection.classList.remove('d-none');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'Certificate Generator';
    if (typeof initCertificateSection === 'function') initCertificateSection();
  }

  if (refreshStats) {
    updateGlobalStats();
  }
}


window.hashPassword = hashPassword;
window.migratePasswordIfNeeded = migratePasswordIfNeeded;
window.handleLogin = handleLogin;
window.showDashboard = showDashboard;
window.logout = logout;
window.loadDashboard = loadDashboard;
window.switchTab = switchTab;

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

  const username = document.getElementById('loginUsernameField')?.value || form.username?.value || '';
  const password = document.getElementById('loginPasswordField')?.value || form.password?.value || '';

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

  // ✅ LOGIN: সবসময় dashboard-এ যাবে (refresh এ same tab থাকবে)
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

      // ✅ LOGIN → Dashboard সবসময়, REFRESH → Same Tab
      var justLoggedIn = sessionStorage.getItem('wf_just_logged_in') === 'true';
      var activeTab = 'dashboard';
      if (justLoggedIn) {
        sessionStorage.removeItem('wf_just_logged_in');
        activeTab = 'dashboard';
        localStorage.setItem('wingsfly_active_tab', 'dashboard');
      } else {
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

// ═══════════════════════════════════════════════════
// PAGE REFRESH → Same Tab Restore (NO FLASH)
// ═══════════════════════════════════════════════════
(function() {
  // ✅ STEP 1: Immediately hide login & show dash BEFORE DOMContentLoaded
  // <head> এ inline style দিয়ে এটা করা যায় না, তাই script চলতেই করো
  if (sessionStorage.getItem('isLoggedIn') !== 'true') return;

  var lastTab = localStorage.getItem('wingsfly_active_tab') || 'dashboard';

  // ✅ STEP 2: DOMContentLoaded এ সাথেসাথে (0ms) correct tab দেখাও
  document.addEventListener('DOMContentLoaded', function() {
    var login = document.getElementById('loginSection');
    var dash  = document.getElementById('dashboardSection');
    if (!login || !dash) return;

    // Instantly switch sections
    login.style.display = 'none';
    dash.style.display = 'block';
    dash.classList.remove('d-none');
    login.classList.add('d-none');

    // loader/content flicker বন্ধ করো — সরাসরি content দেখাও
    var loader = document.getElementById('loader');
    var contentEl = document.getElementById('content');
    if (loader) loader.style.display = 'none';
    if (contentEl) { contentEl.style.display = 'block'; contentEl.style.opacity = '0'; }

    // ✅ সাথেসাথে correct tab এ যাও — 0ms delay
    if (typeof switchTab === 'function') {
      switchTab(lastTab, false);
    } else {
      // switchTab এখনো load না হলে 50ms retry
      var retries = 0;
      var iv = setInterval(function() {
        retries++;
        if (typeof switchTab === 'function') {
          clearInterval(iv);
          switchTab(lastTab, false);
        } else if (retries > 20) clearInterval(iv);
      }, 50);
    }

    // Stats ও dropdowns update করো
    requestAnimationFrame(function() {
      if (typeof updateGlobalStats === 'function') updateGlobalStats();
      if (typeof populateDropdowns === 'function') populateDropdowns();
      if (contentEl) {
        contentEl.style.transition = 'opacity 0.15s';
        contentEl.style.opacity = '1';
      }
    });

    console.log('[Auth] Refresh restore → tab:', lastTab);
  });
})();

// ═══════════════════════════════════════════════════
// AUTO LOCKOUT
// ═══════════════════════════════════════════════════
(function() {
  var _t = null, _m = 0;
  function reset() {
    if (_m <= 0) return;
    clearTimeout(_t);
    _t = setTimeout(function() {
      if (sessionStorage.getItem('isLoggedIn') === 'true') {
        if (typeof logout === 'function') logout();
        if (typeof showErrorToast === 'function')
          showErrorToast('⏰ ' + _m + ' মিনিট নিষ্ক্রিয় — Auto logout হয়েছে');
      }
    }, _m * 60000);
  }
  window.wfInitAutoLockout = function(mins) {
    _m = parseInt(mins) || 0;
    clearTimeout(_t);
    if (_m <= 0) return;
    reset();
    ['mousemove','keydown','mousedown','touchstart','scroll'].forEach(function(e) {
      document.removeEventListener(e, reset);
      document.addEventListener(e, reset, {passive: true});
    });
  };
  document.addEventListener('DOMContentLoaded', function() {
    var mins = window.globalData?.settings?.autoLockoutMinutes || 0;
    if (mins > 0 && sessionStorage.getItem('isLoggedIn') === 'true')
      window.wfInitAutoLockout(mins);
  });
})();

// ═══════════════════════════════════════════════════
// FORGOT PASSWORD — Beautiful Custom Modal
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {

  // Inject modal HTML
  var modalHtml = `
<div id="wfForgotOverlay" style="display:none;position:fixed;inset:0;z-index:99999;align-items:center;justify-content:center;background:rgba(2,5,20,0.85);backdrop-filter:blur(10px);">
<!-- Dummy fields: Chrome password manager কে block করে -->
<input type="text" style="display:none" tabindex="-1" autocomplete="username">
<input type="password" style="display:none" tabindex="-1" autocomplete="current-password">
  <div style="background:linear-gradient(145deg,#080d28,#120830);border:1.5px solid rgba(0,217,255,0.25);border-radius:22px;width:92%;max-width:400px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.7),0 0 40px rgba(0,217,255,0.08);animation:wfFI .3s ease;">
    <style>@keyframes wfFI{from{opacity:0;transform:scale(0.9) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}</style>
    <div style="background:linear-gradient(135deg,rgba(0,217,255,0.1),rgba(181,55,242,0.1));padding:20px 24px 16px;border-bottom:1px solid rgba(0,217,255,0.1);text-align:center;">
      <div style="width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,rgba(0,217,255,0.15),rgba(181,55,242,0.15));border:1.5px solid rgba(0,217,255,0.3);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 10px;">🔑</div>
      <h3 style="color:#deeeff;font-size:1.02rem;font-weight:700;margin:0 0 3px;">Password Recovery</h3>
      <p style="color:rgba(0,200,255,0.48);font-size:0.73rem;margin:0;">Secret Recovery Question দিয়ে password reset করুন</p>
    </div>
    <div style="padding:20px 24px 24px;">
      <!-- Step 1 -->
      <div id="wfFS1">
        <div style="background:rgba(0,217,255,0.05);border:1px solid rgba(0,217,255,0.16);border-radius:10px;padding:12px 14px;margin-bottom:14px;">
          <div style="font-size:0.65rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:rgba(0,200,255,0.52);margin-bottom:5px;">🛡️ Recovery Question</div>
          <div id="wfFQ" style="color:#c8e4ff;font-weight:600;font-size:0.86rem;">লোড হচ্ছে...</div>
        </div>
        <label style="display:block;font-size:0.67rem;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:rgba(0,200,255,0.6);margin-bottom:5px;">✅ আপনার উত্তর</label>
        <input type="password" id="wfFA" style="width:100%;background:rgba(3,8,30,0.8);border:1.5px solid rgba(0,217,255,0.2);border-radius:9px;color:#deeeff;padding:11px 14px;font-size:0.87rem;outline:none;box-sizing:border-box;font-family:inherit;letter-spacing:normal;"
          autocomplete="new-password" data-lpignore="true" data-form-type="other" name="wf_recovery_ans" placeholder="গোপন উত্তর লিখুন"
          onfocus="this.type='text';this.style.borderColor='#00d9ff'" onblur="this.type='password';this.style.borderColor='rgba(0,217,255,0.2)'"
          onkeydown="if(event.key==='Enter')wfFV()">
        <div id="wfFE" style="font-size:0.7rem;color:#ff4455;min-height:16px;margin-top:4px;font-weight:600;"></div>
        <div style="display:flex;gap:10px;margin-top:14px;">
          <button onclick="wfFV()" style="flex:1;background:linear-gradient(135deg,#00d9ff,#b537f2);color:#050a1e;border:none;border-radius:9px;padding:11px;font-weight:700;font-size:0.85rem;cursor:pointer;">✅ Verify</button>
          <button onclick="wfFC()" style="background:rgba(255,255,255,0.06);color:rgba(200,220,255,0.7);border:1.5px solid rgba(255,255,255,0.1);border-radius:9px;padding:11px 16px;font-size:0.85rem;cursor:pointer;">Cancel</button>
        </div>
      </div>
      <!-- Step 2 -->
      <div id="wfFS2" style="display:none;">
        <div style="text-align:center;margin-bottom:16px;">
          <div style="font-size:2rem;margin-bottom:6px;">✅</div>
          <div style="color:#00ff88;font-weight:700;font-size:0.9rem;">উত্তর সঠিক!</div>
          <div style="color:rgba(180,210,255,0.55);font-size:0.74rem;margin-top:3px;">এখন নতুন password সেট করুন</div>
        </div>
        <label style="display:block;font-size:0.67rem;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:rgba(0,200,255,0.6);margin-bottom:5px;">🔑 নতুন Password</label>
        <input type="password" id="wfFP1" style="width:100%;background:rgba(3,8,30,0.8);border:1.5px solid rgba(0,217,255,0.2);border-radius:9px;color:#deeeff;padding:11px 14px;font-size:0.87rem;outline:none;box-sizing:border-box;margin-bottom:10px;"
          autocomplete="new-password" data-lpignore="true" data-form-type="other" placeholder="New password (min 4 chars)"
          onfocus="this.style.borderColor='#00d9ff'" onblur="this.style.borderColor='rgba(0,217,255,0.2)'"
          onkeydown="if(event.key==='Enter')wfFSP()">
        <label style="display:block;font-size:0.67rem;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:rgba(0,200,255,0.6);margin-bottom:5px;">🔁 Confirm Password</label>
        <input type="password" id="wfFP2" style="width:100%;background:rgba(3,8,30,0.8);border:1.5px solid rgba(0,217,255,0.2);border-radius:9px;color:#deeeff;padding:11px 14px;font-size:0.87rem;outline:none;box-sizing:border-box;"
          autocomplete="new-password" placeholder="Re-enter new password"
          onfocus="this.style.borderColor='#00d9ff'" onblur="this.style.borderColor='rgba(0,217,255,0.2)'"
          onkeydown="if(event.key==='Enter')wfFSP()">
        <div id="wfFE2" style="font-size:0.7rem;color:#ff4455;min-height:16px;margin-top:4px;font-weight:600;"></div>
        <div style="display:flex;gap:10px;margin-top:14px;">
          <button onclick="wfFSP()" style="flex:1;background:linear-gradient(135deg,#00d9ff,#b537f2);color:#050a1e;border:none;border-radius:9px;padding:11px;font-weight:700;font-size:0.85rem;cursor:pointer;">💾 Password পরিবর্তন করুন</button>
          <button onclick="wfFC()" style="background:rgba(255,255,255,0.06);color:rgba(200,220,255,0.7);border:1.5px solid rgba(255,255,255,0.1);border-radius:9px;padding:11px 16px;font-size:0.85rem;cursor:pointer;">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // Click outside to close
  document.getElementById('wfForgotOverlay').addEventListener('click', function(e) {
    if (e.target === this) wfFC();
  });
});

window.wfShowForgotModal = function() {
  var gd = window.globalData;
  var overlay = document.getElementById('wfForgotOverlay');
  if (!overlay) { setTimeout(window.wfShowForgotModal, 200); return; }
  if (!gd || !gd.settings || !gd.settings.recoveryQuestion) {
    alert('⚠️ কোনো Recovery Question সেট করা নেই।\nSettings → 🔒 Security তে গিয়ে প্রথমে Question সেট করুন।');
    return;
  }
  document.getElementById('wfFQ').textContent = gd.settings.recoveryQuestion;
  document.getElementById('wfFA').value = '';
  document.getElementById('wfFE').textContent = '';
  document.getElementById('wfFE2') && (document.getElementById('wfFE2').textContent = '');
  document.getElementById('wfFS1').style.display = 'block';
  document.getElementById('wfFS2').style.display = 'none';
  overlay.style.display = 'flex';
  setTimeout(function() { document.getElementById('wfFA').focus(); }, 100);
};
window.wfShowForgotPassword = window.wfShowForgotModal;

window.wfFC = function() {
  var o = document.getElementById('wfForgotOverlay');
  if (o) o.style.display = 'none';
  // ✅ FIX: Modal বন্ধ হলে login fields clear - browser autofill username এ না যায়
  setTimeout(function() {
    var uf = document.getElementById('loginUsernameField');
    var pf = document.getElementById('loginPasswordField');
    if (uf && !uf.value.includes('@') && uf.value.length > 20) uf.value = '';
  }, 200);
};

window.wfFV = async function() {
  var ans = document.getElementById('wfFA').value.trim();
  var err = document.getElementById('wfFE');
  if (!ans) { err.textContent = '❌ উত্তর লিখুন'; return; }
  var gd = window.globalData;
  var stored = gd?.settings?.recoveryAnswer;
  if (!stored) { err.textContent = '❌ Recovery Answer সেট করা নেই'; return; }
  var inputHash = typeof hashPassword === 'function' ? await hashPassword(ans.toLowerCase()) : ans.toLowerCase();
  if (inputHash === stored) {
    // ✅ FIX: login fields clear করো যাতে autofill username এ না যায়
    var uf = document.getElementById('loginUsernameField');
    var pf = document.getElementById('loginPasswordField');
    if (uf) { uf.value = ''; uf.blur(); }
    if (pf) { pf.value = ''; pf.blur(); }
    document.getElementById('wfFA').value = '';
    document.getElementById('wfFS1').style.display = 'none';
    document.getElementById('wfFS2').style.display = 'block';
    setTimeout(function() { document.getElementById('wfFP1').focus(); }, 100);
  } else {
    err.textContent = '❌ উত্তর সঠিক নয়। আবার চেষ্টা করুন।';
    document.getElementById('wfFA').value = '';
    document.getElementById('wfFA').focus();
  }
};

window.wfFSP = async function() {
  var pw = document.getElementById('wfFP1').value;
  var pw2 = document.getElementById('wfFP2').value;
  var err = document.getElementById('wfFE2');
  if (!pw || pw.length < 4) { err.textContent = '❌ Password কমপক্ষে 4 অক্ষর হতে হবে'; return; }
  if (pw !== pw2) { err.textContent = '❌ Password দুটি মিলছে না'; return; }
  var gd = window.globalData;
  var hashed = typeof hashPassword === 'function' ? await hashPassword(pw) : pw;
  if (gd.users && gd.users[0]) gd.users[0].password = hashed;
  if (gd.credentials) gd.credentials.password = hashed;
  localStorage.setItem('wingsfly_data', JSON.stringify(gd));
  if (typeof saveToStorage === 'function') saveToStorage();
  wfFC();
  // ✅ FIX: username/password fields clear করো যাতে browser autofill না হয়
  var uf = document.getElementById('loginUsernameField');
  var pf = document.getElementById('loginPasswordField');
  if (uf) uf.value = '';
  if (pf) pf.value = '';
  if (typeof showSuccessToast === 'function')
    showSuccessToast('✅ Password সফলভাবে পরিবর্তন হয়েছে! নতুন password দিয়ে Login করুন।');
  else alert('✅ Password পরিবর্তন সফল! নতুন password দিয়ে Login করুন।');
};

// ✅ AUTO-TEST ALIASES — direct function wrappers
window.checkSecretAnswer = async function() { return window.wfFV && window.wfFV(); };
window.resetPasswordFromModal = async function() { return window.wfFSP && window.wfFSP(); };

// ═══════════════════════════════════════════════════
// PASSWORD EYE TOGGLE — Auto-hide after 3s
// ═══════════════════════════════════════════════════
(function () {
  function addPasswordEyeToggle() {
    var pwField = document.getElementById('loginPasswordField');
    if (!pwField || document.getElementById('loginPasswordToggle')) return;

    var parent = pwField.parentNode;
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;';
    parent.insertBefore(wrapper, pwField);
    wrapper.appendChild(pwField);

    var autoHideTimer = null;

    var btn = document.createElement('button');
    btn.type = 'button'; btn.id = 'loginPasswordToggle';
    btn.setAttribute('tabindex', '-1'); btn.title = 'পাসওয়ার্ড দেখুন';
    btn.style.cssText = 'position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;padding:4px 6px;color:#1a1a2e;font-size:1.15rem;line-height:1;z-index:5;opacity:0.85;transition:opacity 0.2s,color 0.2s;';
    btn.innerHTML = '<i class="bi bi-eye" id="loginPasswordEyeIcon" style="filter:drop-shadow(0 0 2px rgba(0,217,255,0.4));"></i>';

    function hidePassword() {
      pwField.type = 'password';
      var icon = document.getElementById('loginPasswordEyeIcon');
      if (icon) icon.className = 'bi bi-eye';
      btn.title = 'পাসওয়ার্ড দেখুন';
      btn.style.opacity = '0.85';
      btn.style.color = '#1a1a2e';
    }

    btn.addEventListener('mouseenter', function () { btn.style.opacity='1'; btn.style.color='#0d6efd'; });
    btn.addEventListener('mouseleave', function () {
      if (pwField.type === 'password') btn.style.opacity='0.85';
      btn.style.color = pwField.type === 'text' ? '#0d6efd' : '#1a1a2e';
    });

    btn.addEventListener('click', function () {
      var icon = document.getElementById('loginPasswordEyeIcon');
      if (pwField.type === 'password') {
        // দেখাও
        pwField.type = 'text';
        icon.className = 'bi bi-eye-slash';
        btn.title = 'পাসওয়ার্ড লুকান';
        btn.style.color = '#0d6efd';
        // ✅ 3 সেকেন্ড পরে auto-hide
        clearTimeout(autoHideTimer);
        autoHideTimer = setTimeout(function () {
          hidePassword();
        }, 3000);
      } else {
        // লুকাও (manual)
        clearTimeout(autoHideTimer);
        hidePassword();
      }
      pwField.focus();
    });

    pwField.style.paddingRight = '40px';
    wrapper.appendChild(btn);
    console.log('[Auth] Eye toggle ✓');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addPasswordEyeToggle);
  else {
    addPasswordEyeToggle();
    var r = setInterval(function(){ addPasswordEyeToggle(); if(document.getElementById('loginPasswordToggle')) clearInterval(r); }, 300);
    setTimeout(function(){ clearInterval(r); }, 5000);
  }
})();

// ═══════════════════════════════════════════════════
// LOGOUT BUTTON — Sidebar + TopBar Dropdown (FIXED)
// ═══════════════════════════════════════════════════
(function () {
  function addLogoutUI() {

    // ── 1. Sidebar footer ──
    var sidebarProfile = document.querySelector('.sidebar-footer .user-profile');
    if (sidebarProfile && !document.getElementById('sidebarLogoutBtn')) {
      var lb = document.createElement('button');
      lb.id = 'sidebarLogoutBtn'; lb.title = 'Logout';
      lb.style.cssText = 'background:rgba(255,60,60,0.12);border:1.5px solid rgba(255,80,80,0.3);border-radius:8px;color:#ff6b6b;cursor:pointer;padding:6px 10px;font-size:1rem;transition:all 0.2s;margin-left:auto;flex-shrink:0;';
      lb.innerHTML = '<i class="bi bi-box-arrow-right"></i>';
      lb.addEventListener('mouseenter', function(){ lb.style.background='rgba(255,60,60,0.25)'; lb.style.borderColor='rgba(255,80,80,0.6)'; });
      lb.addEventListener('mouseleave', function(){ lb.style.background='rgba(255,60,60,0.12)'; lb.style.borderColor='rgba(255,80,80,0.3)'; });
      lb.addEventListener('click', function(){ if(typeof window.logout==='function') window.logout(); });
      sidebarProfile.style.cssText += ';display:flex;align-items:center;gap:8px;width:100%;';
      sidebarProfile.appendChild(lb);
      console.log('[Auth] Sidebar logout ✓');
    }

    // ── 2. TopBar dropdown ──
    var topUserArea = null;
    document.querySelectorAll('.top-bar .d-flex.align-items-center').forEach(function(el){
      if (el.querySelector('.user-avatar') && !el.id) topUserArea = el;
    });
    if (!topUserArea) return;
    if (document.getElementById('topbarUserDropdown')) return;

    topUserArea.style.position = 'relative';
    topUserArea.style.cursor = 'pointer';
    topUserArea.id = 'topbarUserArea';

    var dd = document.createElement('div');
    dd.id = 'topbarUserDropdown';
    dd.style.cssText = [
      'display:none',
      'position:absolute',
      'top:calc(100% + 10px)',
      'right:0',
      'min-width:170px',
      'background:linear-gradient(145deg,#080d28,#120830)',
      'border:1.5px solid rgba(0,217,255,0.2)',
      'border-radius:12px',
      'overflow:hidden',
      'box-shadow:0 8px 30px rgba(0,0,0,0.6)',
      'z-index:99999'
    ].join(';');

    dd.innerHTML =
      '<div style="padding:10px 14px 6px;border-bottom:1px solid rgba(0,217,255,0.1);">' +
        '<div style="font-size:0.68rem;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:rgba(0,200,255,0.5);">Logged in as</div>' +
        '<div id="topbarDropdownUser" style="color:#deeeff;font-weight:700;font-size:0.85rem;margin-top:2px;">Admin</div>' +
      '</div>' +
      '<div id="topbarLogoutBtn" style="padding:10px 14px;display:flex;align-items:center;gap:8px;color:#ff6b6b;font-size:0.85rem;font-weight:600;cursor:pointer;user-select:none;">' +
        '<i class="bi bi-box-arrow-right"></i> Logout' +
      '</div>';

    topUserArea.appendChild(dd);

    // Hover on logout item
    var logoutItem = dd.querySelector('#topbarLogoutBtn');
    logoutItem.addEventListener('mouseenter', function(){ logoutItem.style.background='rgba(255,60,60,0.15)'; });
    logoutItem.addEventListener('mouseleave', function(){ logoutItem.style.background='none'; });

    // ✅ Logout click — directly on the div
    logoutItem.addEventListener('click', function(e) {
      e.stopPropagation();
      dd.style.display = 'none';
      if (typeof window.logout === 'function') {
        window.logout();
      } else {
        // fallback
        sessionStorage.removeItem('isLoggedIn');
        location.reload();
      }
    });

    // Toggle dropdown
    topUserArea.addEventListener('click', function(e) {
      e.stopPropagation();
      var isOpen = dd.style.display === 'block';
      dd.style.display = isOpen ? 'none' : 'block';
      if (!isOpen) {
        var uEl = document.getElementById('topbarDropdownUser');
        if (uEl) uEl.textContent = sessionStorage.getItem('username') || 'Admin';
      }
    });

    // Close on outside click
    document.addEventListener('click', function() {
      dd.style.display = 'none';
    });

    console.log('[Auth] TopBar dropdown logout ✓');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', addLogoutUI);
  else addLogoutUI();
  setTimeout(addLogoutUI, 800);
  setTimeout(addLogoutUI, 2000);
})();

// ═══════════════════════════════════════════════════
// EXAM DELETE → RECYCLE BIN + ACTIVITY LOG
// ═══════════════════════════════════════════════════
(function () {

  function wfLog(action, category, message, data) {
    try {
      if (typeof window.logActivity === 'function') {
        window.logActivity(action, category, message, data || {});
      } else {
        if (!window.globalData) return;
        if (!window.globalData.activityHistory) window.globalData.activityHistory = [];
        window.globalData.activityHistory.unshift({
          action: action, category: category, message: message,
          timestamp: new Date().toISOString(),
          user: sessionStorage.getItem('username') || 'Admin'
        });
        try { localStorage.setItem('wingsfly_activity_backup', JSON.stringify(window.globalData.activityHistory)); } catch(e){}
      }
    } catch(e) {}
  }

  function sendExamToRecycleBin(entry) {
    if (!window.globalData) return;
    if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
    var trashId = 'TRASH_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    var trashed = {
      id: trashId,
      type: 'examregistration',
      item: JSON.parse(JSON.stringify(entry)),
      deletedAt: new Date().toISOString(),
      deletedBy: sessionStorage.getItem('username') || 'Admin'
    };
    window.globalData.deletedItems.unshift(trashed);
    if (window.globalData.deletedItems.length > 200) window.globalData.deletedItems = window.globalData.deletedItems.slice(0, 200);
    try {
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(window.globalData.deletedItems));
    } catch(e) {}
    wfLog('delete', 'EXAM', '🗑️ Exam deleted → Recycle Bin: ' + (entry.studentName || entry.regId || 'Unknown'), entry);
    console.log('[Auth] Exam → RecycleBin ✓ id:', trashId);
  }
  window.sendExamToRecycleBin = sendExamToRecycleBin;

  function patchRestoreDeletedItem() {
    var orig = window.restoreDeletedItem;
    if (typeof orig !== 'function' || orig._activityPatched) return false;
    window.restoreDeletedItem = function (id) {
      var gd = window.globalData;
      var d = gd ? (gd.deletedItems || []).find(function(x){ return x.id===id; }) : null;
      orig.call(this, id);
      if (d) {
        var label = d.item ? (d.item.studentName||d.item.name||d.item.title||d.item.regId||d.item.id||'Item') : 'Item';
        wfLog('restore', (d.type||'item').toUpperCase(), '♻️ Restored: ' + label + ' [' + (d.type||'') + ']', d.item||{});
      }
    };
    window.restoreDeletedItem._activityPatched = true;
    return true;
  }

  function patchPermanentDelete() {
    ['permanentDelete','_wfPermDel'].forEach(function(fnName) {
      var orig = window[fnName];
      if (typeof orig !== 'function' || orig._activityPatched) return;
      window[fnName] = function (id) {
        var gd = window.globalData;
        var d = gd ? (gd.deletedItems||[]).find(function(x){ return x.id===id; }) : null;
        orig.call(this, id);
        if (d) {
          var label = d.item ? (d.item.studentName||d.item.name||d.item.title||d.item.regId||d.item.id||'Item') : 'Item';
          wfLog('permanent_delete', (d.type||'item').toUpperCase(), '❌ Permanently deleted: ' + label, d.item||{});
        }
      };
      window[fnName]._activityPatched = true;
    });
    return true;
  }

  function patchExamDelete() {
    ['deleteExamRegistration','deleteExamEntry'].forEach(function(fnName) {
      var orig = window[fnName];
      if (typeof orig !== 'function' || orig._recyclePatched) return;
      window[fnName] = function (id) {
        var gd = window.globalData;
        if (gd && gd.examRegistrations) {
          var entry = gd.examRegistrations.find(function(e){ return String(e.id)===String(id)||String(e.regId)===String(id); });
          if (entry) sendExamToRecycleBin(entry);
        }
        return orig.call(this, id);
      };
      window[fnName]._recyclePatched = true;
      console.log('[Auth] ' + fnName + ' patched ✓');
    });
  }

  function runAllPatches() {
    patchExamDelete();
    patchRestoreDeletedItem();
    patchPermanentDelete();
  }

  window.addEventListener('load', function () {
    runAllPatches();
    var i = 0;
    var iv = setInterval(function(){ runAllPatches(); if(++i>20) clearInterval(iv); }, 500);
  });
})();

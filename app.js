// ===================================
// WINGS FLY AVIATION ACADEMY
// CORE APPLICATION LOGIC
// ===================================

const APP_VERSION = "5.0-SYNC-PRO"; // Redefined safely here
console.log(`🚀 Wings Fly Aviation - System Version: ${APP_VERSION}`);

// Initialize Global Data immediately to prevent ReferenceErrors
if (typeof window.globalData === 'undefined') {
  window.globalData = JSON.parse(localStorage.getItem('wingsfly_data')) || {
    students: [],
    employees: [],
    finance: [],
    settings: {},
    incomeCategories: ['Direct Income', 'Other Income'],
    expenseCategories: ['Rent', 'Salaries', 'Utilities'],
    paymentMethods: ['Cash', 'Bkash', 'Nogad', 'Bank'],
    cashBalance: 0,
    bankAccounts: [],
    mobileBanking: [],
    courseNames: [],
    attendance: {},
    nextId: 1001,
    users: [],
    examRegistrations: [],
    visitors: [],
    employeeRoles: []
  };
}

// Global Chart instances to prevent initialization errors
window.financeChartInstance = null;
window.studentStatusChart = null;
window.paymentMethodChart = null;

console.log('📦 Global Data Initialized.');

// Version check handled globally to avoid redeclaration errors
console.log('🚀 Wings Fly Aviation - Core Logic Loading...');

// Legacy internal sync system removed.
// All data synchronization is now handled externally.


// ===================================
// DATA RESET (Fresh Start)
// ===================================

// Utility to format numbers with commas (Bangladeshi/Indian system)
function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return Number(n).toLocaleString('en-IN');
}
window.formatNumber = formatNumber;

// ===================================
// STUDENT PHOTO STORAGE (IndexedDB - LOCAL ONLY)
// ===================================

const PHOTO_DB_NAME = 'WingsFlyPhotosDB';
const PHOTO_STORE_NAME = 'student_photos';

// Initialize IndexedDB
function initPhotoDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE_NAME)) {
        db.createObjectStore(PHOTO_STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

let selectedStudentPhotoFile = null;

function handleStudentPhotoSelect(event) {
  const file = event.target.files[0];
  if (!file) {
    selectedStudentPhotoFile = null;
    return;
  }
  if (!file.type.startsWith('image/')) {
    showErrorToast('❌ Invalid image format');
    return;
  }
  selectedStudentPhotoFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('photoPreview').src = e.target.result;
    document.getElementById('photoPreviewContainer').style.display = 'block';
    document.getElementById('photoUploadInput').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function removeStudentPhoto() {
  selectedStudentPhotoFile = null;
  document.getElementById('studentPhotoInput').value = '';
  document.getElementById('photoPreviewContainer').style.display = 'none';
  document.getElementById('photoUploadInput').style.display = 'block';
  document.getElementById('studentPhotoURL').value = '';
}

async function uploadStudentPhoto(studentId, file) {
  const db = await initPhotoDB();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      const transaction = db.transaction([PHOTO_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PHOTO_STORE_NAME);
      const photoKey = `photo_${studentId}`;
      store.put(base64, photoKey);
      transaction.oncomplete = () => {
        console.log('✅ Photo saved to local database');
        resolve(photoKey);
      };
      transaction.onerror = () => reject('Database error');
    };
    reader.readAsDataURL(file);
  });
}

async function deleteStudentPhoto(photoKey) {
  if (!photoKey) return;
  const db = await initPhotoDB();
  const transaction = db.transaction([PHOTO_STORE_NAME], 'readwrite');
  transaction.objectStore(PHOTO_STORE_NAME).delete(photoKey);
}

function getStudentPhotoSrc(photoKey, imgElementId = null) {
  const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%2300d9ff" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="80" fill="%23ffffff"%3E👤%3C/text%3E%3C/svg%3E';

  if (!photoKey) return placeholder;

  initPhotoDB().then(db => {
    const transaction = db.transaction([PHOTO_STORE_NAME], 'readonly');
    const request = transaction.objectStore(PHOTO_STORE_NAME).get(photoKey);
    request.onsuccess = () => {
      if (request.result && imgElementId) {
        const img = document.getElementById(imgElementId);
        if (img) {
          img.src = request.result;
          img.style.objectFit = 'cover';
        }
      }
    };
  }).catch(err => console.warn('Photo load error:', err));

  return placeholder;
}

// Make functions globally available
window.uploadStudentPhoto = uploadStudentPhoto;
window.deleteStudentPhoto = deleteStudentPhoto;
window.getStudentPhotoSrc = getStudentPhotoSrc;
window.handleStudentPhotoSelect = handleStudentPhotoSelect;
window.removeStudentPhoto = removeStudentPhoto;
window.uploadStudentPhoto = uploadStudentPhoto;
window.deleteStudentPhoto = deleteStudentPhoto;


// SYNC: Update bank account, mobile banking, or cash balance based on transaction
function updateAccountBalance(method, amount, type, isAddition = true) {
  if (!window.globalData) return;

  // Handle Cash
  if (method === 'Cash') {
    if (typeof globalData.cashBalance === 'undefined') {
      globalData.cashBalance = 0;
    }
    const amt = parseFloat(amount) || 0;
    const multiplier = isAddition ? 1 : -1;

    if (type === 'Income') {
      globalData.cashBalance += amt * multiplier;
    } else if (type === 'Expense') {
      globalData.cashBalance -= amt * multiplier;
    }

    // Update UI if cash balance element exists
    if (typeof renderCashBalance === 'function') {
      renderCashBalance();
    }
    return;
  }

  // Check in bank accounts first
  let account = (window.globalData.bankAccounts || []).find(acc => acc.name === method);

  // If not found, check in mobile banking
  if (!account) {
    account = (window.globalData.mobileBanking || []).find(acc => acc.name === method);
  }

  if (!account) return;

  const amt = parseFloat(amount) || 0;
  const multiplier = isAddition ? 1 : -1;

  if (type === 'Income' || type === 'Transfer In' || type === 'Loan Received') {
    account.balance = (parseFloat(account.balance) || 0) + (amt * multiplier);
  } else if (type === 'Expense' || type === 'Transfer Out' || type === 'Loan Given' || type === 'Rent' || type === 'Utilities' || type === 'Salary') {
    account.balance = (parseFloat(account.balance) || 0) - (amt * multiplier);
  }

  if (typeof renderAccountList === 'function') renderAccountList();
  if (typeof renderMobileBankingList === 'function') renderMobileBankingList();
}
window.updateAccountBalance = updateAccountBalance;


// Toast Notification System
function showSuccessToast(message) {
  const toast = document.createElement('div');
  toast.className = 'custom-toast success-toast shadow';
  toast.innerHTML = `<span>✅</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add('show'); }, 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.className = 'custom-toast error-toast shadow';
  toast.innerHTML = `<span>âŒ</span> ${message}`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.classList.add('show'); }, 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}
window.showSuccessToast = showSuccessToast;
window.showErrorToast = showErrorToast;

// FACTORY RESET: সম্পূর্ণ রিসেট - একদম শূন্য থেকে শুরু
// কোনো ডাটা, সেটিংস, একাউন্ট কিছুই থাকবে না
function handleResetAllData() {
  console.log("Wings Fly: Factory Reset triggered");

  if (!confirm('⚠️⚠️ চূড়ান্ত সতর্কতা: এটি সম্পূর্ণ সিস্টেম রিসেট করবে!\n\n- সকল ছাত্র-ছাত্রী\n- সকল লেনদেন\n- সকল ব্যাংক একাউন্ট\n- সকল সেটিংস\n- সকল ক্যাটাগরি\n- সকল কোর্স\n\nসবকিছু মুছে যাবে। নিশ্চিত?')) return;
  if (!confirm('⚠️⚠️ চূড়ান্ত নিশ্চিতকরণ: সবকিছু একদম শূন্য হয়ে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না। এগিয়ে যাবেন?')) return;

  try {
    // সম্পূর্ণ রিসেট - কোনো default ডাটা নেই
    globalData = {
      students: [],
      employees: [],
      finance: [],
      settings: {
        startBalances: {},
        academyName: 'Wings Fly Aviation Academy'
      },
      incomeCategories: [],      // খালি - কোনো default নেই
      expenseCategories: [],     // খালি - কোনো default নেই
      paymentMethods: [],        // খালি - কোনো default নেই
      cashBalance: 0,
      bankAccounts: [],          // খালি - কোনো default একাউন্ট নেই
      mobileBanking: [],         // খালি - কোনো default একাউন্ট নেই
      courseNames: [],           // খালি - কোনো default কোর্স নেই
      attendance: {},
      nextId: 1001,
      users: [],
      examRegistrations: [],
      visitors: [],
      employeeRoles: [],         // খালি - কোনো default role নেই
      credentials: { username: 'admin', password: 'admin123' }  // শুধু admin login রাখা
    };

    // Update window reference
    window.globalData = globalData;

    // localStorage এ সংরক্ষণ
    saveToStorage();
    console.log("✅ Factory reset complete - all data cleared");

    alert('✅ সফল: সম্পূর্ণ সিস্টেম রিসেট হয়েছে।\n\nসবকিছু একদম নতুন অবস্থায় ফিরে গেছে।');
    window.location.reload();
  } catch (err) {
    alert('ত্রুটি: ' + err.message);
    console.error(err);
  }
}


// Global exposure
window.handleResetAllData = handleResetAllData;

// Global exposure
window.handleResetAllData = handleResetAllData;
window.checkPersonBalance = checkPersonBalance;
window.handleResetAllData = handleResetAllData;
window.handleSettingsSubmit = handleSettingsSubmit;
// ===================================
// CHART JS ANALYTICS
// ===================================

let financeChartInstance = null;
let courseChartInstance = null;

function updateCharts() {
  const financeCtx = document.getElementById('financeChart')?.getContext('2d');
  const courseCtx = document.getElementById('courseChart')?.getContext('2d');

  if (!financeCtx || !courseCtx) return;

  // 1. Prepare Financial Data (Last 6 Months)
  // Group by Month: { "Jan": 50000, "Feb": 60000 }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const incomeData = new Array(12).fill(0);
  const expenseData = new Array(12).fill(0);
  const currentYear = new Date().getFullYear();

  globalData.finance.forEach(f => {
    const d = new Date(f.date);
    if (d.getFullYear() === currentYear) {
      const mIndex = d.getMonth();
      const amt = parseFloat(f.amount) || 0;

      if (f.type === 'Income') {
        incomeData[mIndex] += amt;
      } else if (f.type === 'Expense') {
        expenseData[mIndex] += amt;
      }
    }
  });

  // Filter based on selection (Year vs Month) - kept simple for now (Year View)
  // Destroy old charts
  if (financeChartInstance) financeChartInstance.destroy();
  if (courseChartInstance) courseChartInstance.destroy();

  // RENDER FINANCE CHART (Bar)
  financeChartInstance = new Chart(financeCtx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#3b82f6', // Av Blue
          borderRadius: 8,
          barThickness: 20,
          borderWidth: 0,
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: '#111827', // Av Dark Navy
          borderRadius: 8,
          barThickness: 20,
          borderWidth: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { weight: 'bold', size: 11 }
          }
        },
        tooltip: {
          backgroundColor: '#111827',
          padding: 12,
          boxPadding: 8,
          titleFont: { size: 14, weight: 'bold' },
          callbacks: {
            label: function (context) {
              return ' ' + context.dataset.label + ': ৳' + formatNumber(context.raw);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { borderDash: [5, 5], color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
          ticks: { color: '#94a3b8', font: { weight: 'bold' } }
        },
        x: {
          grid: { display: false, drawBorder: false },
          ticks: { color: '#94a3b8', font: { weight: 'bold' } }
        }
      }
    }
  });

  // 2. Prepare Course Data
  const courseCounts = {};
  globalData.students.forEach(s => {
    const c = s.course || 'Unknown';
    courseCounts[c] = (courseCounts[c] || 0) + 1;
  });

  const courseLabels = Object.keys(courseCounts);
  const courseValues = Object.values(courseCounts);

  // Find top course
  let topCourse = 'N/A';
  let maxVal = 0;
  Object.entries(courseCounts).forEach(([k, v]) => {
    if (v > maxVal) { maxVal = v; topCourse = k; }
  });

  const topCourseLabelEl = document.getElementById('topCourseLabel');
  const topCourseCountEl = document.getElementById('topCourseCount');

  if (topCourseLabelEl) topCourseLabelEl.innerText = topCourse;
  if (topCourseCountEl) topCourseCountEl.innerText = maxVal;

  // Premium Cyber Pie Colors
  const pieColors = ['#00f2ff', '#ffd700', '#0088ff', '#ff0055', '#7000ff', '#00ff9d'];

  // RENDER COURSE CHART (Doughnut)
  courseChartInstance = new Chart(courseCtx, {
    type: 'doughnut',
    data: {
      labels: courseLabels,
      datasets: [{
        data: courseValues,
        backgroundColor: pieColors,
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '80%',
      plugins: {
        legend: { display: false },
      }
    }
  });
}
window.deleteIncomeCategory = deleteIncomeCategory;
window.addExpenseCategory = addExpenseCategory;
window.deleteExpenseCategory = deleteExpenseCategory;
window.addPaymentMethod = addPaymentMethod;
window.deletePaymentMethod = deletePaymentMethod;
window.addCourseName = addCourseName;
window.deleteCourseName = deleteCourseName;
window.downloadLedgerExcel = downloadLedgerExcel;
window.mailLedgerReport = mailLedgerReport;
window.downloadAccountDetailsExcel = downloadAccountDetailsExcel;
window.mailAccountDetailsReport = mailAccountDetailsReport;
window.exportData = exportData;
window.importData = importData;
window.handleImportFile = handleImportFile;

// Global Data Store (Local Storage)
window.globalData = {
  students: [],
  finance: [],
  employees: [],
  settings: {
    startBalances: {},
    academyName: 'Wings Fly Aviation Academy',
    monthlyTarget: 200000
  },
  incomeCategories: ['Tuition Fees', 'Loan Received', 'Other'],
  expenseCategories: ['Salary', 'Rent', 'Utilities', 'Loan Given', 'Other'],
  paymentMethods: ['Cash', 'Bkash', 'Nogod'],
  cashBalance: 0,
  bankAccounts: [],
  mobileBanking: [],
  courseNames: ['Caregiver', 'Student Visa', 'Other'],
  attendance: {},
  nextId: 1001,
  users: [{ username: 'admin', password: 'admin123', role: 'admin', name: 'Super Admin' }],
  examRegistrations: [],
  visitors: [],
  employeeRoles: ['Instructor', 'Admin', 'Staff', 'Manager']
};

let currentStudentForProfile = null;

// Demo Login Credentials
const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', function () {
  // Load data from localStorage
  loadFromStorage();

  // Set today's date as default for both forms
  const today = new Date().toISOString().split('T')[0];

  const financeDate = document.querySelector('#financeModal input[name="date"]');
  if (financeDate) financeDate.value = today;

  const studentDate = document.getElementById('studentEnrollDate');
  if (studentDate) studentDate.value = today;

  // Check if user is already logged in
  const isLoggedIn = sessionStorage.getItem('isLoggedIn');
  if (isLoggedIn === 'true') {
    const username = sessionStorage.getItem('username') || 'Admin';
    showDashboard(username);

    // CRITICAL: Attempt Initial Cloud Sync IMMEDIATELY
    console.log('🔄 Initializing cloud sync on login...');
    setTimeout(async () => {
      if (typeof window.loadFromCloud === 'function') {
        try {
          console.log('💥 Pulling latest data from cloud on startup...');
          const success = await window.loadFromCloud(true);
          if (success) {
            console.log('✅ Initial cloud sync successful');
            // Start auto-sync and real-time listener
            if (typeof window.startAutoSync === 'function') {
              window.startAutoSync(10);
              console.log('🔄 Auto-sync started (30s interval)');
            }
            if (typeof window.startRealtimeSync === 'function') {
              window.startRealtimeSync();
              console.log('🎧 Real-time listener started');
            }
          } else {
            console.warn(' ï¸ Initial sync failed, will retry via auto-sync');
          }
        } catch (error) {
          console.error('âŒ Initial sync error:', error);
        }
      }
    }, 1500); // Small delay to let Supabase initialize
  }


  // Populate dropdowns initially
  populateDropdowns();

  // ✅ AUTO-POPULATE BATCH FILTER ON PAGE LOAD
  setTimeout(() => {
    if (typeof populateBatchFilter === 'function') {
      populateBatchFilter();
    }
  }, 500);

  // Render cash balance and grand total on page load
  if (typeof renderCashBalance === 'function') {
    renderCashBalance();
  }
  if (typeof updateGrandTotal === 'function') {
    updateGrandTotal();
  }

  // Settings Modal Listener to populate data
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.addEventListener('show.bs.modal', function () {
      const form = document.getElementById('settingsForm');
      if (!form) return;

      renderSettingsLists();
      // Restore certificate design selection highlight
      setTimeout(() => restoreCertDesignUI(), 150);
    });
  }

  // Finance Modal Type Change Listener
  const financeTypeSelect = document.querySelector('#financeForm select[name="type"]');
  if (financeTypeSelect) {
    financeTypeSelect.addEventListener('change', updateFinanceCategoryOptions);
  }

  // Finance Modal Show Listener
  const financeModal = document.getElementById('financeModal');
  if (financeModal) {
    financeModal.addEventListener('show.bs.modal', updateFinanceCategoryOptions);
  }

  // Set Monthly Target default range (Start of month to end of month)
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const targetStart = document.getElementById('targetStartDate');
  const targetEnd = document.getElementById('targetEndDate');
  if (targetStart) targetStart.value = firstDay;
  if (targetEnd) targetEnd.value = lastDay;

});

// ===================================
// LOCAL STORAGE MANAGEMENT
// ===================================

// ===================================
// LOCAL STORAGE MANAGEMENT
// ===================================

async function saveToStorage(skipCloudSync = false) {
  try {
    const currentTime = Date.now().toString();
    localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
    localStorage.setItem('lastLocalUpdate', currentTime);

    console.log('💾 Data saved locally.');

    // Trigger cloud push if available and not skipped
    if (!skipCloudSync && typeof window.saveToCloud === 'function') {
      console.log('☁️ Syncing to Cloud...');
      await window.saveToCloud();
    }
    return true;
  } catch (error) {
    console.error('❌ Storage Error:', error);
    return false;
  }
}

// Master Refresh Function
window.renderFullUI = function () {
  console.log('🔄 Performing Global UI Refresh...');
  try {
    if (typeof updateGlobalStats === 'function') updateGlobalStats();
    if (typeof render === 'function') render(window.globalData.students || []);
    if (typeof renderLedger === 'function') renderLedger(window.globalData.finance || []);
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderCashBalance === 'function') renderCashBalance();
    if (typeof renderRecentAdmissions === 'function') renderRecentAdmissions();
    if (typeof updateGrandTotal === 'function') updateGrandTotal();
    if (typeof populateDropdowns === 'function') populateDropdowns();
    if (typeof populateBatchFilter === 'function') populateBatchFilter();
  } catch (e) {
    console.warn('UI Refresh partially skipped:', e);
  }
};

// Toggle Auto-Sync
function toggleAutoSync(enabled) {
  if (enabled) {
    if (typeof window.startAutoSync === 'function') {
      window.startAutoSync(30); // 30 seconds interval
      showSuccessToast('✅ Auto-sync enabled (every 30s)');
    }
  } else {
    if (typeof window.stopAutoSync === 'function') {
      window.stopAutoSync();
      showSuccessToast('â¸ï¸ Auto-sync disabled');
    }
  }
}

window.toggleAutoSync = toggleAutoSync;


function loadFromStorage() {
  try {
    const savedData = localStorage.getItem('wingsfly_data');
    if (savedData) {
      window.globalData = JSON.parse(savedData);
      // Ensure local reference is valid
      if (typeof globalData !== 'undefined') globalData = window.globalData;

      if (!window.globalData.employees) window.globalData.employees = [];
      ensureStudentIds();

      if (!window.globalData.employees) window.globalData.employees = [];
      ensureStudentIds();

      // Ensure users array always exists with default admin
      if (!window.globalData.users || !Array.isArray(window.globalData.users) || window.globalData.users.length === 0) {
        window.globalData.users = [
          { username: 'admin', password: 'admin123', role: 'admin', name: 'Super Admin' },
          { username: 'admin', password: '11108022ashu', role: 'admin', name: 'Master Admin' }
        ];
        saveToStorage();
      }

      // ⚡ FORCE CLEANUP: Clean payment methods immediately
      const bankAccountNames = (window.globalData.bankAccounts || []).map(acc => acc.name);
      const coreMethods = ['Cash', 'Bkash', 'Nagad', 'Bank Transfer'];
      window.globalData.paymentMethods = [...new Set([...coreMethods, ...bankAccountNames])];
      console.log('🧹 Force cleaned payment methods:', window.globalData.paymentMethods);

      console.log("💾 Local data loaded:", window.globalData.students.length, "students found.");
    } else {
      console.log("💾 No local data found. Initializing defaults.");
      window.globalData = {
        students: [],
        employees: [],
        finance: [],
        incomeCategories: ['Tuition Fees', 'Loan Received', 'Other'],
        expenseCategories: ['Salary', 'Rent', 'Utilities', 'Loan Given', 'Other'],
        paymentMethods: ['Cash', 'Bkash', 'Nogod'],
        cashBalance: 0,
        bankAccounts: [
          { sl: 1, name: 'CITY BANK', branch: 'BONOSREE', bankName: 'CITY BANK', accountNo: '1493888742001', balance: 0 },
          { sl: 2, name: 'Ferdous Ahmed Islami Bank', branch: 'NIKUNJA', bankName: 'ISLAMI BANK BANGLADESH LTD', accountNo: '20504100200546109', balance: 0 },
          { sl: 3, name: 'BRAC BANK LTD BANASREE', branch: 'BANASREE', bankName: 'BRAC BANK LTD BANASREE', accountNo: '2052189750001', balance: 0 },
          { sl: 4, name: 'ISLAMI BANK BANGLADESH LTD', branch: 'NIKUNJA', bankName: 'ISLAMI BANK BANGLADESH LTD', accountNo: '20504100100094207', balance: 0 },
          { sl: 5, name: 'DUTCH-BANGLA BANK LIMITED', branch: 'RAMPURA', bankName: 'DUTCH-BANGLA BANK LIMITED', accountNo: '1781100023959', balance: 0 },
          { sl: 6, name: 'EASTERN BANK LIMITED', branch: 'BANASREE', bankName: 'EASTERN BANK LIMITED', accountNo: '1091070200510', balance: 0 }
        ],
        courseNames: ['Caregiver', 'Student Visa', 'Other'],
        settings: { academyName: 'Wings Fly Aviation Academy' },
        users: [{ username: 'admin', password: 'admin123', role: 'admin', name: 'Super Admin' }]
      };
      if (typeof globalData !== 'undefined') globalData = window.globalData;
    }

    // BACKWARD COMPATIBILITY: Ensure users array exists
    if (!globalData.users) {
      globalData.users = [
        {
          username: (globalData.credentials && globalData.credentials.username) || 'admin',
          password: (globalData.credentials && globalData.credentials.password) || 'admin123',
          role: 'admin',
          name: 'Admin'
        }
      ];
    }

    // Data Migration for new version (Run always after load)
    let migrationNeeded = false;
    if (!globalData.incomeCategories) {
      globalData.incomeCategories = [...(globalData.categories || ['Tuition Fees', 'Other'])];
      migrationNeeded = true;
    }
    if (!globalData.expenseCategories) {
      globalData.expenseCategories = [...(globalData.categories || ['Salary', 'Rent', 'Other'])];
      migrationNeeded = true;
    }

    // Payment Method Migration: Ensure defaults exist if missing
    // This fixes the issue where only custom methods (Brac, Islami) were showing
    const defaultMethods = ['Cash', 'Bkash', 'Nogad', 'Bank'];
    if (!globalData.paymentMethods) {
      globalData.paymentMethods = [...defaultMethods];
      migrationNeeded = true;
    } else {
      // Merge defaults if they are completely missing (heuristic for lost defaults)
      const missingDefaults = defaultMethods.filter(m => !globalData.paymentMethods.includes(m));
      if (missingDefaults.length > 0) {
        // Prepend defaults to keep them at the top
        globalData.paymentMethods = [...defaultMethods, ...globalData.paymentMethods.filter(m => !defaultMethods.includes(m))];
        migrationNeeded = true;
      }
    }

    // Course Name Migration
    if (!globalData.courseNames) {
      globalData.courseNames = ['Caregiver', 'Student Visa', 'Visa (Tourist, Medical Business)', 'Air Ticketing (Basic)', 'Air Ticketing (Advance)', 'Travel Agency Business Managment', 'Language (Japanese, Korean)', 'Other'];
      migrationNeeded = true;
    }

    // Role Migration
    if (!globalData.employeeRoles) {
      globalData.employeeRoles = ['Instructor', 'Admin', 'Staff', 'Manager'];
      migrationNeeded = true;
    }

    if (!globalData.bankAccounts) {
      globalData.bankAccounts = [
        { sl: 1, name: 'CITY BANK', branch: 'BONOSREE', bankName: 'CITY BANK', accountNo: '1493888742001', balance: 0 },
        { sl: 2, name: 'Ferdous Ahmed Islami Bank', branch: 'NIKUNJA', bankName: 'ISLAMI BANK BANGLADESH LTD', accountNo: '20504100200546109', balance: 0 },
        { sl: 3, name: 'BRAC BANK LTD BANASREE', branch: 'BANASREE', bankName: 'BRAC BANK LTD BANASREE', accountNo: '2052189750001', balance: 0 },
        { sl: 4, name: 'ISLAMI BANK BANGLADESH LTD', branch: 'NIKUNJA', bankName: 'ISLAMI BANK BANGLADESH LTD', accountNo: '20504100100094207', balance: 0 },
        { sl: 5, name: 'DUTCH-BANGLA BANK LIMITED', branch: 'RAMPURA', bankName: 'DUTCH-BANGLA BANK LIMITED', accountNo: '1781100023959', balance: 0 },
        { sl: 6, name: 'EASTERN BANK LIMITED', branch: 'BANASREE', bankName: 'EASTERN BANK LIMITED', accountNo: '1091070200510', balance: 0 }
      ];
      migrationNeeded = true;
    }

    if (migrationNeeded) saveToStorage(true);

    // Ensure Monthly Target exists
    if (!globalData.settings.monthlyTarget) {
      globalData.settings.monthlyTarget = 200000;
      migrationNeeded = true;
    }

    // AUTO-RECALCULATE CASH BALANCE from transactions on load
    if (typeof recalculateCashBalanceFromTransactions === 'function') {
      recalculateCashBalanceFromTransactions();
    }

    // Ensure credentials exist
    if (!globalData.credentials) {
      globalData.credentials = { username: 'admin', password: 'admin123' };
      migrationNeeded = true;
    }

    // Migrate Exam Registrations if found in legacy storage
    if (!globalData.examRegistrations || globalData.examRegistrations.length === 0) {
      const legacyExams = localStorage.getItem('examRegistrations');
      if (legacyExams) {
        try {
          const parsed = JSON.parse(legacyExams);
          if (Array.isArray(parsed) && parsed.length > 0) {
            globalData.examRegistrations = parsed;
            migrationNeeded = true;
          }
        } catch (e) { }
      }
    }

    // Migrate Visitors if found in legacy storage
    if (!globalData.visitors || globalData.visitors.length === 0) {
      const legacyVisitors = localStorage.getItem('visitors');
      if (legacyVisitors) {
        try {
          const parsed = JSON.parse(legacyVisitors);
          if (Array.isArray(parsed) && parsed.length > 0) {
            globalData.visitors = parsed;
            migrationNeeded = true;
          }
        } catch (e) { }
      }
    }

    if (migrationNeeded) {
      saveToStorage(true);
      if (typeof populateDropdowns === 'function') populateDropdowns();
    }

    // CLEANUP: Remove duplicate payment methods after loading
    cleanupPaymentMethods();

    // ✅ CRITICAL FIX: Populate batch filter after loading data
    if (typeof populateBatchFilter === 'function') {
      setTimeout(() => {
        populateBatchFilter();
        console.log('✅ Batch filter populated after data load');
      }, 200);
    }
  } catch (error) {
    console.error('Error loading from storage:', error);
  }
}

// Cleanup duplicate payment methods
function cleanupPaymentMethods() {
  if (!globalData.bankAccounts) {
    globalData.bankAccounts = [];
  }

  const bankAccountNames = globalData.bankAccounts.map(acc => acc.name);
  const coreMethods = ['Cash', 'Bkash', 'Nagad', 'Bank Transfer'];

  // FORCE CLEAN: Only keep core methods and current bank account names
  const cleanMethods = [...new Set([...coreMethods, ...bankAccountNames])];

  // Always update to clean list
  const oldCount = (globalData.paymentMethods || []).length;
  globalData.paymentMethods = cleanMethods;

  if (oldCount !== cleanMethods.length) {
    console.log('🧹 Payment Methods Cleaned:');
    console.log('  📊 Bank Accounts:', bankAccountNames.length);
    console.log('  💳 Before:', oldCount, 'methods');
    console.log('  💳 After:', cleanMethods.length, 'methods');
    console.log('  🗑️ Removed:', (oldCount - cleanMethods.length), 'duplicate(s)');
    saveToStorage(true);
  }

  // Force populate dropdowns with clean data
  if (typeof populateDropdowns === 'function') {
    populateDropdowns();
  }
}

// Manual reset function - can be called from browser console
window.resetPaymentMethods = function () {
  console.log('🔄 Manually resetting payment methods...');
  const bankAccountNames = (globalData.bankAccounts || []).map(acc => acc.name);
  const coreMethods = ['Cash', 'Bkash', 'Nagad', 'Bank Transfer'];
  const oldCount = (globalData.paymentMethods || []).length;
  globalData.paymentMethods = [...new Set([...coreMethods, ...bankAccountNames])];
  saveToStorage(true);
  populateDropdowns();
  console.log('✅ Payment methods reset!');
  console.log('  📊 Bank Accounts:', bankAccountNames.length);
  console.log('  💳 Old:', oldCount, 'methods');
  console.log('  💳 New:', globalData.paymentMethods.length, 'methods');
  console.log('  🗑️ Removed:', (oldCount - globalData.paymentMethods.length), 'duplicates');
  alert(`✅ Payment Methods Reset!\n\n` +
    `Bank Accounts: ${bankAccountNames.length}\n` +
    `Payment Methods: ${globalData.paymentMethods.length}\n` +
    `Duplicates Removed: ${oldCount - globalData.paymentMethods.length}`);
};

// ===================================
// LOGIN & AUTHENTICATION
// ===================================

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
          { username: 'admin', password: 'admin123', role: 'admin', name: 'Super Admin' },
          { username: 'admin', password: '11108022ashu', role: 'admin', name: 'Master Admin' }
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
          password: 'admin123',
          role: 'admin',
          name: 'Super Admin'
        },
        {
          username: 'admin',
          password: '11108022ashu',
          role: 'admin',
          name: 'Master Admin'
        }
      ];
    }

    // A. Check Local Users
    validUser = globalData.users.find(u => u.username === username && u.password === password);

    // B. If not found locally, try Cloud (fetch latest Global Data)
    if (!validUser && typeof pullDataFromCloud === 'function') {
      console.log("ï¸ User not found locally, checking cloud...");
      await pullDataFromCloud(false); // Silently pull
      validUser = globalData.users.find(u => u.username === username && u.password === password);
    }

    // C. EMERGENCY FALLBACK: Always allow default admin if users list is broken or out of sync
    if (!validUser && username === 'admin' && (password === 'admin123' || password === '11108022ashu')) {
      console.warn(" ï¸ Using emergency admin fallback");
      validUser = {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Super Admin'
      };
      // Auto-add to users list for next time
      if (globalData.users && Array.isArray(globalData.users)) {
        if (!globalData.users.find(u => u.username === 'admin')) {
          globalData.users.push(validUser);
          saveToStorage(true);
        }
      }
    }

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
  document.getElementById('loginSection').classList.add('d-none');
  document.getElementById('dashboardSection').classList.remove('d-none');

  const userEl = document.getElementById('sidebarUser') || document.getElementById('currentUser');
  if (userEl) userEl.innerText = username;

  loadDashboard();
  checkDailyBackup();
}

function logout() {
  sessionStorage.removeItem('isLoggedIn');
  sessionStorage.removeItem('username');

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

      // Restore last active tab (or default to dashboard)
      const activeTab = localStorage.getItem('wingsfly_active_tab') || 'dashboard';

      switchTab(activeTab, false);

      updateGlobalStats();
      updateStudentCount();

      // Populate unified search dropdown
      if (typeof populateAccountDropdown === 'function') {
        populateAccountDropdown();
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
  const batchSummaryCard = document.getElementById('batchSummaryCard');
  const globalFilterCard = document.getElementById('globalFilterCard');

  localStorage.setItem('wingsfly_active_tab', tab);

  // Reset all
  const accountsBtn = document.getElementById('tabAccounts');
  const allBtns = [dashboardBtn, studentBtn, ledgerBtn, loansBtn, visitorBtn, employeeBtn, examBtn, accountsBtn];
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
    if (globalFilterCard) globalFilterCard.classList.remove('d-none');
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'Student Management';
    filterData();
  } else if (tab === 'ledger') {
    if (ledgerBtn) ledgerBtn.classList.add('active');
    if (ledgerSection) ledgerSection.classList.remove('d-none');
    if (globalFilterCard) globalFilterCard.classList.remove('d-none');
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
  }

  if (refreshStats) {
    updateGlobalStats();
  }
}

// ===================================
// LOAN MANAGEMENT
// ===================================

let currentLoanPerson = null;

function renderLoanSummary() {
  const container = document.getElementById('loanSummaryContainer');
  if (!container) return;
  container.innerHTML = '';

  const q = (document.getElementById('loanSearchInput')?.value || '').toLowerCase().trim();

  // Aggregate data by Person
  const personStats = {};

  globalData.finance.forEach(tx => {
    let person = tx.person;
    if (!person) return; // Skip if no person assigned

    // Normalize person name
    person = person.trim();

    if (!personStats[person]) {
      personStats[person] = { given: 0, received: 0, balance: 0 };
    }

    if (tx.type === 'Loan Given') {
      personStats[person].given += tx.amount;
      personStats[person].balance -= tx.amount; // Money out, they owe us (positive receivable?) or balance decreases?
      // Let's convention: Positive Balance = We owe them? Negative Balance = They owe us?
      // Or: Balance = Received - Given. 
      // If Received 100, Given 50. Balance +50 (We have their money). 
      // If Given 100, Received 0. Balance -100 (They owe us).
      // Let's stick to: "Net Balance"
    } else if (tx.type === 'Loan Received') {
      personStats[person].received += tx.amount;
      personStats[person].balance += tx.amount;
    }
    // We could also consider other transaction types if 'person' is attached, allowing general ledger per person.
    // For now, strict Loan types or just all types for that person? 
    // User said: "I need loan management... person wise I can keep account."
    // It's safer to include ALL transactions for that person to give a full picture (e.g. if they paid us via "Income" type but tagged person).
    // BUT for "Loan Management" specifically, maybe just loans? 
    // Let's stick to Loan interactions for the summary cards, but show ALL in details.
    else if (person) {
      // If it is Income/Expense/Transfer but has a person tag, it might be relevant.
      // For simplicity of "Loan", let's assume Type is key. 
      // But if I lend 500 (Loan Given) and they return 500 (Income? or Loan Received?).
      // Usually Loan Repayment should be Loan Received. 
    }
  });

  const people = Object.keys(personStats).sort();

  if (people.length === 0) {
    container.innerHTML = '<div class="col-12 text-center text-muted p-5">No loan records found. Add a transaction with a Person name and Loan type.</div>';
    return;
  }

  people.forEach(p => {
    if (q && !p.toLowerCase().includes(q)) return;

    const stats = personStats[p];

    // FILTER: Only show people with actual Loan activity
    if (stats.given === 0 && stats.received === 0) return;

    // Color logic: Balance < 0 (They Owe Us) -> Red/Danger? Balance > 0 (We Owe Them) -> Green/Success?
    // "Loan Given" = Debit (Asset). "Loan Received" = Credit (Liability).
    // Let's display "Net Due": Given - Received.
    // If Result > 0: They have taken more than given back -> They Owe (Red).
    // If Result < 0: They gave more -> We Owe (Green).

    // Using simple stats.balance (Received - Given).
    // If Balance < 0: They owe us (Red).
    // If Balance > 0: We owe them (Green).

    let balanceText = '';
    let balanceClass = '';

    if (stats.balance < 0) {
      balanceText = `They Owe: ৳${formatNumber(Math.abs(stats.balance))}`;
      balanceClass = 'text-danger';
    } else if (stats.balance > 0) {
      balanceText = `We Owe: ৳${formatNumber(stats.balance)}`;
      balanceClass = 'text-success';
    } else {
      balanceText = 'Settled';
      balanceClass = 'text-muted';
    }

    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3';
    col.innerHTML = `
      <div class="card h-100 shadow-sm border-0 person-loan-card" style="cursor: pointer; transition: transform 0.2s;" onclick="openLoanDetail('${p.replace(/'/g, "\\'")}')">
        <div class="card-body text-center">
            <div class="mb-3">
                <span class="avatar-circle bg-primary-light text-primary fw-bold fs-4 d-inline-block rounded-circle" style="width: 50px; height: 50px; line-height: 50px;">
                    ${p.charAt(0).toUpperCase()}
                </span>
            </div>
            <h5 class="card-title fw-bold text-dark mb-1">${p}</h5>
            <div class="mb-3 ${balanceClass} fw-bold fs-5">${balanceText}</div>
            
            <div class="d-flex justify-content-between text-muted small border-top pt-2">
                <span>Given: ৳${formatNumber(stats.given)}</span>
                <span>Recv: ৳${formatNumber(stats.received)}</span>
            </div>
        </div>
      </div>
    `;

    // Hover effect helper
    col.querySelector('.card').onmouseover = function () { this.style.transform = 'translateY(-5px)'; }
    col.querySelector('.card').onmouseout = function () { this.style.transform = 'translateY(0)'; }

    container.appendChild(col);
  });
}

function filterLoanSummary() {
  renderLoanSummary();
}

function openLoanDetail(person) {
  currentLoanPerson = person;
  const detailView = document.getElementById('loanDetailView');
  const title = document.getElementById('loanDetailTitle');
  const tbody = document.getElementById('loanDetailBody');
  const footVal = document.getElementById('loanDetailBalance');

  if (detailView) detailView.classList.remove('d-none');
  if (title) title.innerText = `Ledger: ${person}`;
  if (tbody) tbody.innerHTML = '';

  // Filter transactions
  // We include ALL transactions with this person name to be thorough
  // Sort by date ASCENDING (oldest first) for proper running balance calculation
  let txs = globalData.finance.filter(tx => tx.person === person).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Date Range Filtering
  const start = document.getElementById('loanDetailStartDate').value;
  const end = document.getElementById('loanDetailEndDate').value;

  if (start) {
    txs = txs.filter(tx => tx.date >= start);
  }
  if (end) {
    txs = txs.filter(tx => tx.date <= end);
  }

  let runningBalance = 0;
  let rowNum = 1;

  txs.forEach(tx => {
    let credit = 0;
    let debit = 0;
    let typeLabel = tx.type;

    if (tx.type === 'Loan Given' || tx.type === 'Expense') {
      debit = tx.amount;
      runningBalance -= tx.amount; // Money out: reduces balance (They owe us more)
    } else if (tx.type === 'Loan Received' || tx.type === 'Income') {
      credit = tx.amount;
      runningBalance += tx.amount; // Money in: increases balance
    } else {
      // Transfers? Assume Out is debit?
      debit = tx.amount;
      runningBalance -= tx.amount;
    }

    // Determine balance color
    let balanceClass = '';
    let balancePrefix = '';
    if (runningBalance < 0) {
      balanceClass = 'text-danger fw-bold';
      balancePrefix = 'Adv ';
    } else if (runningBalance > 0) {
      balanceClass = 'text-success fw-bold';
      balancePrefix = 'Adv ';
    } else {
      balanceClass = 'text-muted';
      balancePrefix = '';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
            <td class="text-muted small">${rowNum}</td>
            <td>${tx.date}</td>
            <td><span class="badge ${debit > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}">${typeLabel}</span></td>
            <td class="small">${tx.description || '-'}</td>
            <td class="text-end text-danger fw-bold">${debit > 0 ? formatNumber(debit) : '-'}</td>
            <td class="text-end text-success fw-bold">${credit > 0 ? formatNumber(credit) : '-'}</td>
            <td class="text-end ${balanceClass}">${balancePrefix}${formatNumber(Math.abs(runningBalance))}</td>
        `;
    tbody.appendChild(tr);
    rowNum++;
  });

  if (footVal) {
    if (runningBalance < 0) {
      footVal.innerHTML = `<span class="text-danger">They Owe: ৳${formatNumber(Math.abs(runningBalance))}</span>`;
    } else if (runningBalance > 0) {
      footVal.innerHTML = `<span class="text-success">We Owe: ৳${formatNumber(runningBalance)}</span>`;
    } else {
      footVal.innerHTML = `৳0`;
    }
  }
}

function closeLoanDetail() {
  const detailView = document.getElementById('loanDetailView');
  if (detailView) detailView.classList.add('d-none');

  // Clear date filters for next time
  document.getElementById('loanDetailStartDate').value = '';
  document.getElementById('loanDetailEndDate').value = '';

  currentLoanPerson = null;
}

function printLoanDetail() {
  if (!currentLoanPerson) return;

  // ── Collect data directly from globalData (not innerHTML) ──
  let txs = (globalData.finance || [])
    .filter(tx => tx.person === currentLoanPerson)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const start = document.getElementById('loanDetailStartDate')?.value || '';
  const end   = document.getElementById('loanDetailEndDate')?.value   || '';
  if (start) txs = txs.filter(tx => tx.date >= start);
  if (end)   txs = txs.filter(tx => tx.date <= end);

  const academy = (globalData.settings?.academyName) || 'Wings Fly Aviation Academy';
  const dateRange = (start || end) ? `${start || 'Beginning'} → ${end || 'Today'}` : 'All Time';

  // ── Build rows ──
  let runningBalance = 0;
  let rowsHTML = '';

  txs.forEach((tx, i) => {
    let debit = 0, credit = 0;
    if (tx.type === 'Loan Given' || tx.type === 'Expense') {
      debit = parseFloat(tx.amount) || 0;
      runningBalance -= debit;
    } else {
      credit = parseFloat(tx.amount) || 0;
      runningBalance += credit;
    }
    const balColor = runningBalance < 0 ? '#dc2626' : runningBalance > 0 ? '#16a34a' : '#64748b';
    const typeColor = debit > 0 ? '#dc2626' : '#16a34a';
    const typeBg    = debit > 0 ? '#fee2e2' : '#dcfce7';

    rowsHTML += `
      <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#ffffff'};">
        <td style="padding:8px 10px; color:#94a3b8; font-size:12px; text-align:center;">${i + 1}</td>
        <td style="padding:8px 10px; font-weight:600; font-size:13px;">${tx.date || '—'}</td>
        <td style="padding:8px 10px;">
          <span style="background:${typeBg}; color:${typeColor}; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700;">
            ${tx.type}
          </span>
        </td>
        <td style="padding:8px 10px; font-size:12px; color:#475569;">${tx.description || '—'}</td>
        <td style="padding:8px 10px; text-align:right; color:#dc2626; font-weight:700; font-size:13px;">
          ${debit > 0 ? '৳' + formatNumber(debit) : '—'}
        </td>
        <td style="padding:8px 10px; text-align:right; color:#16a34a; font-weight:700; font-size:13px;">
          ${credit > 0 ? '৳' + formatNumber(credit) : '—'}
        </td>
        <td style="padding:8px 10px; text-align:right; color:${balColor}; font-weight:800; font-size:13px;">
          ৳${formatNumber(Math.abs(runningBalance))}
        </td>
      </tr>`;
  });

  // ── Net balance label ──
  let netLabel, netColor;
  if (runningBalance < 0) {
    netLabel = `They Owe Us: ৳${formatNumber(Math.abs(runningBalance))}`;
    netColor = '#dc2626';
  } else if (runningBalance > 0) {
    netLabel = `We Owe Them: ৳${formatNumber(runningBalance)}`;
    netColor = '#16a34a';
  } else {
    netLabel = 'Settled — ৳0';
    netColor = '#64748b';
  }

  // ── Open dedicated print window ──
  const pw = window.open('', '_blank', 'width=900,height=700');
  pw.document.write(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Personal Ledger – ${currentLoanPerson}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; color: #1e293b; background:#fff; padding:30px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start;
            padding-bottom:16px; border-bottom:3px solid #111827; margin-bottom:20px; }
  .academy-name { font-size:20px; font-weight:900; color:#111827; }
  .sub { font-size:10px; color:#64748b; letter-spacing:1px; text-transform:uppercase; margin-top:4px; }
  .title-block { text-align:right; }
  .report-title { font-size:18px; font-weight:800; color:#3b82f6; border-bottom:2px solid #3b82f6;
                  display:inline-block; padding-bottom:3px; }
  .meta { font-size:11px; color:#94a3b8; margin-top:5px; }
  table { width:100%; border-collapse:collapse; margin-top:10px; }
  thead tr { background:#1e293b; }
  thead th { padding:10px; color:#fff; font-size:12px; font-weight:700; text-align:left; }
  thead th:nth-child(5), thead th:nth-child(6), thead th:nth-child(7) { text-align:right; }
  tfoot tr { background:#f1f5f9; }
  tfoot td { padding:12px 10px; font-weight:800; font-size:14px; }
  .footer { text-align:center; margin-top:30px; padding-top:15px; border-top:2px solid #e2e8f0; }
  .footer p { font-size:10px; color:#64748b; }
  @media print {
    body { padding:15px; }
    @page { margin:10mm; }
  }
</style>
</head><body>

<div class="header">
  <div>
    <div class="academy-name">${academy}</div>
    <div class="sub">Aviation Career Experts</div>
  </div>
  <div class="title-block">
    <div class="report-title">Personal Ledger – ${currentLoanPerson}</div>
    <div class="meta">Date: ${new Date().toLocaleDateString('en-GB')} &nbsp;|&nbsp; Range: ${dateRange}</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th style="width:40px; text-align:center;">#</th>
      <th>Date</th>
      <th>Type</th>
      <th>Description</th>
      <th>Debit (−)</th>
      <th>Credit (+)</th>
      <th>Balance</th>
    </tr>
  </thead>
  <tbody>
    ${rowsHTML || `<tr><td colspan="7" style="text-align:center;padding:20px;color:#94a3b8;">No transactions found.</td></tr>`}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="6" style="text-align:right; padding-right:16px;">NET BALANCE:</td>
      <td style="text-align:right; color:${netColor}; font-size:16px;">${netLabel}</td>
    </tr>
  </tfoot>
</table>

<div class="footer">
  <p>System Generated Official Document | ${academy}</p>
  <p style="margin-top:4px; font-size:9px; color:#94a3b8;">www.wingsfly-aviation.com</p>
</div>

<script>
  window.onload = function() { window.print(); }
<\/script>
</body></html>`);
  pw.document.close();
}

function checkPersonBalance() {
  const input = document.getElementById('financePersonInput');
  const display = document.getElementById('personBalanceDisplay');

  if (!input || !display) return;

  // Only show for Loan types or generally useful? Let's show always if match found
  const name = input.value.trim().toLowerCase();

  if (name.length < 2) {
    display.innerHTML = '';
    return;
  }

  // Calculate balance for this person
  // Exact match or partial? Use exact-ish for balance calculation to avoid summing up "Ali" and "Alim" together
  // Ideally we filter by exact name match from existing records to be accurate

  // Let's find all transactions where person name loosely matches to suggest, 
  // BUT for balance we should probably be stricter or just aggregate what we find.
  // For now, let's aggregate EXACT case-insensitive matches to give specific feedback

  const txs = globalData.finance.filter(f => f.person && f.person.toLowerCase() === name);

  if (txs.length === 0) {
    // Maybe partial match suggestion?
    const similar = [...new Set(globalData.finance
      .filter(f => f.person && f.person.toLowerCase().includes(name))
      .map(f => f.person))];

    if (similar.length > 0) {
      display.innerHTML = `<span class="text-muted fw-normal">Did you mean: ${similar.join(', ')}?</span>`;
    } else {
      display.innerHTML = '<span class="text-muted fw-normal">New person (No previous history)</span>';
    }
    return;
  }

  let given = 0;
  let received = 0;

  txs.forEach(tx => {
    if (tx.type === 'Loan Given' || tx.type === 'Expense') given += tx.amount;
    else if (tx.type === 'Loan Received' || tx.type === 'Income') received += tx.amount;
  });

  const balance = received - given;
  // Balance < 0 : They Owe Us (Given > Received) -> Red
  // Balance > 0 : We Owe Them (Received > Given) -> Green

  let html = '';
  if (balance < 0) {
    html = `<span class="text-danger"> ï¸ They Owe: ৳${formatNumber(Math.abs(balance))}</span>`;
  } else if (balance > 0) {
    html = `<span class="text-success">✅ We Owe: ৳${formatNumber(balance)}</span>`;
  } else {
    html = `<span class="text-muted">✔️ Account Settled (Balance 0)</span>`;
  }

  display.innerHTML = `${html} <span class="text-muted ms-2 small fw-normal">(Total Loan: ৳${formatNumber(given)} | Paid: ৳${formatNumber(received)})</span>`;
}


// ===================================
// RENDER STUDENT TABLE
// ===================================

function render(students) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = '';

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="text-muted">
            <h5>No students found</h5>
            <p>Add your first student to get started</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Calculate true index for each student (BEFORE reverse)
  const displayStudents = students.map((s, displayIndex) => {
    const realIndex = globalData.students.indexOf(s);
    const finalIndex = realIndex >= 0 ? realIndex : globalData.students.findIndex(gs => gs.studentId && gs.studentId === s.studentId);
    // trueIndex is the globalData.students array position
    // rowIndex will be recalculated after reverse
    return { ...s, trueIndex: finalIndex, originalIndex: displayIndex };
  });

  // Reverse to show newest first, then add rowIndex
  displayStudents.reverse();

  // Now add correct rowIndex based on actual globalData position
  displayStudents.forEach((s, i) => {
    s.rowIndex = s.trueIndex; // Use trueIndex as rowIndex (points to globalData.students position)
  });

  // Render each student
  displayStudents.forEach(s => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const isOverdue = s.reminderDate && s.reminderDate < today && (parseFloat(s.due) > 0);
    const isToday = s.reminderDate && s.reminderDate === today && (parseFloat(s.due) > 0);
    const isFuture = s.reminderDate && s.reminderDate > today && (parseFloat(s.due) > 0);

    let reminderBadge = '';
    if (isOverdue) {
      reminderBadge = `<span class="badge bg-danger text-white ms-2 pulse-red" title="OVERDUE: ${s.reminderDate}">🔔 Overdue</span>`;
    } else if (isToday) {
      reminderBadge = `<span class="badge bg-warning text-dark ms-2" title="DUE TODAY: ${s.reminderDate}">🔔 Today</span>`;
    } else if (isFuture) {
      reminderBadge = `<span class="badge bg-info-subtle text-info ms-2" title="Reminder: ${s.reminderDate}">🔔 Upcoming</span>`;
    }

    // === STUDENT PHOTO OR INITIAL ===
    let studentAvatar = '';
    if (s.photo) {
      // If photo exists, show it
      studentAvatar = `
        <img src="${s.photo}" 
             alt="${s.name}" 
             class="rounded-circle" 
             style="width: 38px; height: 38px; object-fit: cover; border: 2px solid #00d9ff;"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
        <div class="bg-primary-subtle text-primary rounded-circle align-items-center justify-content-center fw-bold" 
             style="width: 38px; height: 38px; font-size: 0.9rem; display: none;">
          ${(s.name || 'S').charAt(0).toUpperCase()}
        </div>
      `;
    } else {
      // If no photo, show initial letter
      studentAvatar = `
        <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" 
             style="width: 38px; height: 38px; font-size: 0.9rem;">
          ${(s.name || 'S').charAt(0).toUpperCase()}
        </div>
      `;
    }

    const row = `
      <tr>
        <td class="small text-muted">${s.enrollDate || '-'}</td>
        <td class="small fw-semibold text-secondary">${s.studentId || '-'}</td>
        <td>
          <div class="d-flex align-items-center gap-3">
            ${studentAvatar}
            <div>
              <a href="javascript:void(0)" onclick="openStudentProfile(${s.rowIndex})" class="text-decoration-none text-dark fw-bold hover-primary">
                ${s.name}
              </a>
              <div class="d-flex align-items-center mt-1">
                ${reminderBadge}
              </div>
            </div>
          </div>
        </td>
        <td><span class="badge bg-light text-dark border fw-semibold">${s.course}</span></td>
        <td class="small">${s.batch || 'N/A'}</td>
        <td class="fw-bold">৳${formatNumber(s.totalPayment || 0)}</td>
        <td class="text-success fw-bold">৳${formatNumber(s.paid || 0)}</td>
        <td class="text-danger fw-bold">৳${formatNumber(s.due || 0)}</td>
        <td class="small text-muted">
            ${s.remarks ? `<span class="badge bg-secondary-subtle text-secondary border" title="${s.remarks}">${s.remarks.substring(0, 15)}${s.remarks.length > 15 ? '...' : ''}</span>` : '-'}
        </td>
        <td>
            <button class="btn btn-light btn-sm rounded-pill px-3 border shadow-sm" type="button" onclick="openStudentActionsModal(${s.trueIndex})">
               <i class="bi bi-three-dots-vertical"></i> Manage
            </button>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });

  // ✅ UPDATE TABLE FOOTER TOTALS
  updateTableFooter(students);

  // ✅ AUTO-POPULATE BATCH FILTER DROPDOWN
  populateBatchFilter();
}

function updateTableFooter(students) {
  // Calculate totals from displayed students
  const totalPayable = students.reduce((sum, s) => sum + (parseFloat(s.totalPayment) || 0), 0);
  const totalPaid = students.reduce((sum, s) => sum + (parseFloat(s.paid) || 0), 0);
  const totalDue = students.reduce((sum, s) => sum + (parseFloat(s.due) || 0), 0);

  // Update footer display
  document.getElementById('footerTotalPayable').innerText = '৳' + formatNumber(totalPayable);
  document.getElementById('footerTotalPaid').innerText = '৳' + formatNumber(totalPaid);
  document.getElementById('footerTotalDue').innerText = '৳' + formatNumber(totalDue);
}

// ===================================
// RENDER FINANCIAL LEDGER
// ===================================

function renderLedger(transactions) {
  const tbody = document.getElementById('ledgerTableBody');
  tbody.innerHTML = '';

  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No transactions found</td></tr>';
    return;
  }

  // Reverse to show newest first
  const displayItems = [...transactions].reverse();
  let totalDisplayed = 0;

  displayItems.forEach(f => {
    const amt = parseFloat(f.amount) || 0;
    const isPositive = (f.type === 'Income' || f.type === 'Loan Received' || f.type === 'Transfer In');
    const amtClass = isPositive ? 'text-success' : 'text-danger';

    // Accumulate total for footer
    if (isPositive) totalDisplayed += amt;
    else totalDisplayed -= amt;

    const row = `
      <tr>
        <td>${f.date || 'N/A'}</td>
        <td><span class="badge ${f.type.includes('Transfer') ? 'bg-warning' : 'bg-light text-dark border'}">${f.type}</span></td>
        <td class="fw-bold">${f.method || 'Cash'}</td>
        <td>${f.category || 'N/A'}</td>
        <td class="small">
            ${f.person ? `<span class="fw-bold text-primary d-block mb-1">👤 ${f.person}</span>` : ''}
            ${f.description || ''}
        </td>
        <td class="${amtClass} fw-bold">৳${formatNumber(amt)}</td>
        <td class="text-end">
          <div class="btn-group">
            <button class="btn btn-sm btn-outline-primary" onclick="editTransaction(${f.id})" title="Edit record">
              ✏️ Edit
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteTransaction(${f.id})" title="Delete record">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
    tbody.innerHTML += row;
  });

  // Update total in header
  const summaryTotalEl = document.getElementById('ledgerSummaryTotal');
  if (summaryTotalEl) {
    summaryTotalEl.innerText = '৳' + formatNumber(totalDisplayed);
    summaryTotalEl.classList.remove('text-success', 'text-danger');
    summaryTotalEl.classList.add(totalDisplayed >= 0 ? 'text-success' : 'text-danger');
  }

  // Update total in Footer
  const footerTotal = document.getElementById('ledgerFooterTotal');
  if (footerTotal) {
    footerTotal.innerText = '৳' + formatNumber(totalDisplayed);
    footerTotal.classList.remove('text-success', 'text-danger');
    footerTotal.classList.add(totalDisplayed >= 0 ? 'text-success' : 'text-danger');
  }

  // Dynamically update category filter dropdown
  updateCategoryDropdown();
}

// ===================================
// DYNAMIC DROPDOWNS & SETTINGS MANAGEMENT
// ===================================

function populateDropdowns() {
  const courses = globalData.courseNames || [];

  // BUILD CLEAN PAYMENT METHODS LIST:
  // 1. Core methods (always present)
  // 2. Payment Methods (ONLY from bank accounts - NO hardcoded methods)
  const methods = [];

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
      const cashBal = parseFloat(globalData.cashBalance) || 0;
      const cashOpt = document.createElement('option');
      cashOpt.value = 'Cash';
      cashOpt.innerText = `💵 Cash  —  ৳${formatNumber(cashBal)}`;
      cashOpt.style.backgroundColor = '#1a1f3a';
      cashOpt.style.color = '#00ff88';
      el.appendChild(cashOpt);

      // Add ONLY bank accounts (no traditional methods)
      const bankAccounts = globalData.bankAccounts || [];
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
      const mobileAccounts = globalData.mobileBanking || [];
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

function renderSettingsLists() {
  const incCats = globalData.incomeCategories || [];
  const expCats = globalData.expenseCategories || [];
  const methods = globalData.paymentMethods || [];

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
    const courses = globalData.courseNames || [];
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
    const roles = globalData.employeeRoles || ['Instructor', 'Admin', 'Staff', 'Manager'];
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
      settingsForm.academyName.value = globalData.settings.academyName || '';
    }
    if (settingsForm.monthlyTarget) {
      settingsForm.monthlyTarget.value = globalData.settings.monthlyTarget || 200000;
    }
    // Dynamic Starting Balances List
    const balanceContainer = document.getElementById('startingBalancesList');
    if (balanceContainer) {
      balanceContainer.innerHTML = '';

      // Define allMethods before using it
      const allMethods = ['Cash'];
      const bankAccounts = globalData.bankAccounts || [];
      const mobileAccounts = globalData.mobileBanking || [];

      bankAccounts.forEach(acc => allMethods.push(acc.name));
      mobileAccounts.forEach(acc => allMethods.push(acc.name));

      allMethods.forEach(m => {
        const div = document.createElement('div');
        div.className = 'col-6 mb-2';
        div.innerHTML = `
          <label class="form-label small fw-bold text-muted mb-1">${m} Starting ৳</label>
          <input type="number" name="startBalance_${m}" class="form-control form-control-sm" 
                 value="${globalData.settings.startBalances?.[m] || 0}" placeholder="0">
        `;
        balanceContainer.appendChild(div);
      });
      // Populate Security Fields
      if (document.getElementById('settingsUsername')) {
        document.getElementById('settingsUsername').value = (globalData.credentials && globalData.credentials.username) || 'admin';
      }
      if (document.getElementById('settingsPassword')) {
        document.getElementById('settingsPassword').value = (globalData.credentials && globalData.credentials.password) || 'admin123';
      }
    }
  }
}

// --- Category Management ---

function addIncomeCategory() {
  const input = document.getElementById('newIncomeCatInput');
  const val = input.value.trim();
  if (!val) return;
  if (!globalData.incomeCategories) globalData.incomeCategories = [];
  if (globalData.incomeCategories.includes(val)) { alert('Exists!'); return; }
  globalData.incomeCategories.push(val);
  saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
  input.value = '';
}

function deleteIncomeCategory(name) {
  if (!confirm(`Delete Income Category "${name}"?`)) return;
  globalData.incomeCategories = globalData.incomeCategories.filter(c => c !== name);
  saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
}

function addExpenseCategory() {
  const input = document.getElementById('newExpenseCatInput');
  const val = input.value.trim();
  if (!val) return;
  if (!globalData.expenseCategories) globalData.expenseCategories = [];
  if (globalData.expenseCategories.includes(val)) { alert('Exists!'); return; }
  globalData.expenseCategories.push(val);
  saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
  input.value = '';
}

function deleteExpenseCategory(name) {
  if (!confirm(`Delete Expense Category "${name}"?`)) return;
  globalData.expenseCategories = globalData.expenseCategories.filter(c => c !== name);
  saveToStorage();
  renderSettingsLists();
  updateFinanceCategoryOptions();
}

function updateFinanceCategoryOptions() {
  const typeSelect = document.querySelector('#financeForm select[name="type"]');
  const catSelect = document.getElementById('financeCategorySelect');
  if (!typeSelect || !catSelect) return;

  const type = typeSelect.value;
  let options = [];

  if (type === 'Income' || type === 'Loan Received') {
    options = globalData.incomeCategories || [];
  } else {
    options = globalData.expenseCategories || [];
  }

  catSelect.innerHTML = '';
  options.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.innerText = c;
    catSelect.appendChild(opt);
  });

  // ✅ FIXED: Toggle Person/Counterparty visibility based on TYPE
  const personContainer = document.getElementById('financePersonContainer');
  const personInput = document.getElementById('financePersonInput');

  if (personContainer && personInput) {
    // Show ONLY for Loan Given and Loan Received
    if (type === 'Loan Given' || type === 'Loan Received') {
      personContainer.classList.remove('d-none');
      personInput.required = true;
      console.log('✅ Person field: VISIBLE + REQUIRED (Type:', type + ')');
    } else {
      personContainer.classList.add('d-none');
      personInput.required = false;
      personInput.value = ''; // Clear value when hidden
      console.log('ℹ️ Person field: HIDDEN (Type:', type + ')');
    }
  }
}

// ✅ Remove old togglePersonField function - not needed anymore

// --- Payment Method Management ---
// NOTE: Payment methods are now automatically synced from Bank Accounts
// These functions kept for backward compatibility
function addPaymentMethod() {
  const input = document.getElementById('newMethodInput');
  if (!input) return; // Element doesn't exist in UI anymore
  const val = input.value.trim();
  if (!val) return;

  if (!globalData.paymentMethods) {
    globalData.paymentMethods = ['Cash', 'Bkash', 'Nogod'];
  }

  if (globalData.paymentMethods.includes(val)) { alert('Exists!'); return; }

  globalData.paymentMethods.push(val);
  saveToStorage();
  populateDropdowns();
  input.value = '';
}

function deletePaymentMethod(name) {
  if (!confirm(`Delete payment method "${name}"?`)) return;
  if (!globalData.paymentMethods) return;
  globalData.paymentMethods = globalData.paymentMethods.filter(m => m !== name);
  saveToStorage();
  populateDropdowns();
}

// --- Course Management ---
function addCourseName() {
  const input = document.getElementById('newCourseInput');
  const val = input.value.trim();
  if (!val) return;

  if (!globalData.courseNames) {
    globalData.courseNames = ['Caregiver', 'Student Visa', 'Visa (Tourist, Medical Business)', 'Air Ticketing (Basic)', 'Air Ticketing (Advance)', 'Travel Agency Business Managment', 'Language (Japanese, Korean)', 'Other'];
  }

  if (globalData.courseNames.includes(val)) { alert('Exists!'); return; }

  globalData.courseNames.push(val);
  saveToStorage();
  populateDropdowns();
  input.value = '';
}

function deleteCourseName(name) {
  if (!confirm(`Delete course "${name}"?`)) return;
  globalData.courseNames = globalData.courseNames.filter(c => c !== name);
  saveToStorage();
  populateDropdowns();
}



// Override updateCategoryDropdown to use globalData
function updateCategoryDropdown() {
  const select = document.getElementById('ledgerCategoryFilter');
  if (!select) return;

  const currentVal = select.value;
  // Use global categories + any legacy categories found in transactions
  const legacyCats = new Set(globalData.finance.map(f => f.category));
  const incCats = globalData.incomeCategories || [];
  const expCats = globalData.expenseCategories || [];
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

// ===================================
// PDF EXPORT
// ===================================



function downloadLedgerExcel() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const startDate = document.getElementById('mainStartDate').value;
  const endDate = document.getElementById('mainEndDate').value;
  const type = document.getElementById('ledgerTypeFilter').value;
  const category = document.getElementById('ledgerCategoryFilter').value;
  const method = document.getElementById('ledgerMethodFilter').value;

  const filtered = globalData.finance.filter(f => {
    const matchSearch = !q || (f.category && f.category.toLowerCase().includes(q)) || (f.description && f.description.toLowerCase().includes(q)) || (f.method && f.method.toLowerCase().includes(q)) || (f.type && f.type.toLowerCase().includes(q));
    const matchDate = (!startDate || f.date >= startDate) && (!endDate || f.date <= endDate);
    const matchType = !type || f.type === type;
    const matchCategory = !category || f.category === category;
    const matchMethod = !method || f.method === method;
    return matchSearch && matchDate && matchType && matchCategory && matchMethod;
  });

  if (filtered.length === 0) { alert('No data to export!'); return; }

  let csv = 'Date,Type,Method,Category,Description,Amount\n';
  filtered.forEach(f => {
    csv += `${f.date},${f.type},${f.method},${f.category},"${(f.description || '').replace(/"/g, '""')}",${f.amount}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `Ledger_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function mailLedgerReport() {
  const academy = globalData.settings.academyName || 'Wings Fly Aviation Academy';
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const startDate = document.getElementById('mainStartDate').value || 'All Time';
  const endDate = document.getElementById('mainEndDate').value || 'Present';
  const type = document.getElementById('ledgerTypeFilter').value;
  const category = document.getElementById('ledgerCategoryFilter').value;
  const method = document.getElementById('ledgerMethodFilter').value;

  const filtered = globalData.finance.filter(f => {
    const matchSearch = !q || (f.category && f.category.toLowerCase().includes(q)) || (f.description && f.description.toLowerCase().includes(q)) || (f.method && f.method.toLowerCase().includes(q)) || (f.type && f.type.toLowerCase().includes(q));
    const matchDate = (!startDate || startDate === 'All Time' || f.date >= startDate) && (!endDate || endDate === 'Present' || f.date <= endDate);
    const matchType = !type || f.type === type;
    const matchCategory = !category || f.category === category;
    const matchMethod = !method || f.method === method;
    return matchSearch && matchDate && matchType && matchCategory && matchMethod;
  });

  let inc = 0, exp = 0;
  filtered.forEach(f => {
    const amt = parseFloat(f.amount) || 0;
    if (f.type === 'Income' || f.type === 'Loan Received') inc += amt;
    else if (f.type === 'Expense' || f.type === 'Loan Given') exp += amt;
  });
  const balance = inc - exp;

  const subject = encodeURIComponent(`${academy} - Financial Ledger Report (${startDate} to ${endDate})`);
  const body = encodeURIComponent(`Hello,\n\nPlease find the financial summary for ${academy}.\n\nPeriod: ${startDate} to ${endDate}\nSearch Filter: ${q || 'None'}\nCategory Filter: ${category || 'All'}\n\n--- SUMMARY ---\nTotal Income: ৳${formatNumber(inc)}\nTotal Expense: ৳${formatNumber(exp)}\nNet Balance: ৳${formatNumber(balance)}\n\nThis is an automated summary of the current ledger view.\n\nRegards,\nAdmin`);

  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

// ACCOUNT DETAILS REPORTS


function downloadAccountDetailsExcel() {
  const startDate = document.getElementById('detStartDate').value;
  const endDate = document.getElementById('detEndDate').value;
  const typeFilter = document.getElementById('detTypeFilter').value;
  const categoryFilter = document.getElementById('detCategoryFilter').value;

  const filtered = globalData.finance.filter(f => {
    const matchDate = (!startDate || f.date >= startDate) && (!endDate || f.date <= endDate);
    const matchCategory = !categoryFilter || f.category === categoryFilter;
    let matchType = true;
    if (typeFilter) {
      if (typeFilter === 'Income') matchType = f.type === 'Income';
      else if (typeFilter === 'Expense') matchType = f.type === 'Expense';
      else if (typeFilter === 'Transfer') matchType = f.type.includes('Transfer');
    }
    return matchDate && matchCategory && matchType;
  });

  if (filtered.length === 0) { alert('No data to export!'); return; }

  let csv = 'Date,Type,Method,Category,Description,Amount\n';
  filtered.forEach(f => {
    csv += `${f.date},${f.type},${f.method},${f.category},"${(f.description || '').replace(/"/g, '""')}",${f.amount}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `Account_Details_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function mailAccountDetailsReport() {
  const academy = globalData.settings.academyName || 'Wings Fly Aviation Academy';
  const startDate = document.getElementById('detStartDate').value || 'All Time';
  const endDate = document.getElementById('detEndDate').value || 'Present';
  const type = document.getElementById('detTypeFilter').value || 'All';
  const category = document.getElementById('detCategoryFilter').value || 'All';

  // Recalculate totals for mail body
  const filtered = globalData.finance.filter(f => {
    const matchDate = (!startDate || f.date >= startDate) && (!endDate || f.date <= endDate);
    const matchCategory = !category || category === 'All' || f.category === category;
    let matchType = true;
    if (type && type !== 'All') {
      if (type === 'Income') matchType = f.type === 'Income';
      else if (type === 'Expense') matchType = f.type === 'Expense';
      else if (type === 'Transfer') matchType = f.type.includes('Transfer');
    }
    return matchDate && matchCategory && matchType;
  });

  let total = 0;
  filtered.forEach(f => {
    const amt = parseFloat(f.amount) || 0;
    const isPositive = (f.type === 'Income' || f.type === 'Loan Received' || f.type === 'Transfer In');
    if (isPositive) total += amt;
    else total -= amt;
  });

  const subject = encodeURIComponent(`${academy} - Account Statement (${startDate} to ${endDate})`);
  const body = encodeURIComponent(`Hello,\n\nPlease find the detailed account statement for ${academy}.\n\nPeriod: ${startDate} to ${endDate}\nType: ${type}\nCategory: ${category}\n\nSUMMARY BALANCE: ৳${formatNumber(total)}\n\nRegards,\nAdmin`);

  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}


function updateStudentCount() {
  const count = globalData.students.length;
  document.getElementById('studentCount').innerText = `${count} Student${count !== 1 ? 's' : ''}`;
}

// ===================================
// CALCULATE GLOBAL STATISTICS
// ===================================

function updateGlobalStats() {
  let income = 0;
  let expense = 0;

  // Update Academy Name display
  if (globalData.settings?.academyName) {
    const titleEl = document.querySelector('.page-title') || document.querySelector('.dashboard-header h2');
    if (titleEl) titleEl.innerText = globalData.settings.academyName;
  }

  // Monthly Income Calculation
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  let monthIncome = 0;

  // Calculate Income and Expense from finance transactions ONLY
  // DO NOT calculate account balances from transactions!
  (globalData.finance || []).forEach(f => {
    const amt = parseFloat(f.amount) || 0;
    const d = new Date(f.date);

    if (f.type === 'Income') {
      income += amt;
      // Check for current month income
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthIncome += amt;
      }
    } else if (f.type === 'Expense') {
      expense += amt;
    }
    // Note: Loans and Transfers do NOT affect Income/Expense
  });

  const profit = income - expense;

  // --- AVIATION PREMIUM DASHBOARD METRICS ---

  // 1. Total Students
  const dashStudentEl = document.getElementById('dashTotalStudents');
  const dashStudentCenter = document.getElementById('dashTotalStudentsCenter');
  if (dashStudentEl) dashStudentEl.innerText = globalData.students.length;
  if (dashStudentCenter) dashStudentCenter.innerText = globalData.students.length;

  // 2. Total Income
  const dashIncomeEl = document.getElementById('dashTotalIncome');
  if (dashIncomeEl) dashIncomeEl.innerText = '৳' + formatNumber(income);

  // 3. Total Expense
  const dashExpenseEl = document.getElementById('dashTotalExpense');
  if (dashExpenseEl) dashExpenseEl.innerText = '৳' + formatNumber(expense);

  // 4. Net Profit / Loss
  const dashProfitEl = document.getElementById('dashTotalProfit');
  const dashProfitStatus = document.getElementById('dashProfitStatus');

  if (dashProfitEl) {
    dashProfitEl.innerText = '৳' + formatNumber(Math.abs(profit));
    if (profit >= 0) {
      dashProfitEl.className = "av-card-value text-success";
      if (dashProfitStatus) dashProfitStatus.innerText = "Profit Growth";
    } else {
      dashProfitEl.className = "av-card-value text-danger";
      if (dashProfitStatus) dashProfitStatus.innerText = "Current Loss";
    }
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

  // Calculate income within range
  const filteredIncome = globalData.finance
    .filter(f => {
      // Logic for income: explicitly marked Income, Student Fee, or Transfer In
      const isIncome = (f.type === 'Income' || f.category === 'Student Fee' || f.type === 'Transfer In');
      if (!isIncome) return false;

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
    console.log("Wings Fly: Daily auto-backup triggered");
    exportData();
    localStorage.setItem('last_auto_backup_date', today);
    showSuccessToast('Daily Auto-Backup completed successfully!');
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
    const isIncome = (f.type === 'Income' || f.type === 'Loan Received' || f.type === 'Transfer In');
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
          <div class="fw-bold text-dark text-truncate">${actionTitle}</div>
          <div class="text-muted" style="font-size: 0.7rem;">
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

function markReminderDone(studentId) {
  const student = globalData.students.find(s => s.rowIndex == studentId);
  if (student) {
    student.reminderDate = null; // Clear reminder
    saveToStorage();
    checkPaymentReminders(); // Refresh
    showSuccessToast(`Reminder cleared for ${student.name}`);
  }
}

function snoozeReminder(studentId) {
  const student = globalData.students.find(s => s.rowIndex == studentId);
  if (student) {
    const now = new Date();
    // Default to tomorrow
    const nextDay = new Date(now);
    nextDay.setDate(now.getDate() + 1);
    const tomorrowStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

    const newDate = prompt(
      `Set next payment reminder for: ${student.name}\n\nEnter the date the client promised to pay (YYYY-MM-DD):`,
      tomorrowStr
    );

    if (newDate === null) return; // Cancelled

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
      alert('Invalid date format. Please use YYYY-MM-DD');
      return;
    }

    student.reminderDate = newDate;
    saveToStorage();
    checkPaymentReminders(); // Refresh
    showSuccessToast(`Reminder rescheduled for ${student.name} to ${newDate}`);
  }
}

function dismissReminders() {
  if (!confirm('This will clear ALL active payment reminders. Continue?')) return;

  globalData.students.forEach(s => {
    if (s.reminderDate) s.reminderDate = null;
  });
  saveToStorage();
  checkPaymentReminders();
  showSuccessToast('All reminders dismissed');
}

function quickSetReminder(rowIndex) {
  const student = globalData.students[rowIndex];
  if (!student) return;

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentReminder = student.reminderDate || today;

  const newDate = prompt(
    `Set payment reminder for: ${student.name}\n\nCurrent reminder: ${student.reminderDate || 'None'}\n\nEnter new date (YYYY-MM-DD):`,
    currentReminder
  );

  if (newDate === null) return; // Cancelled

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    alert('Invalid date format. Please use YYYY-MM-DD');
    return;
  }

  student.reminderDate = newDate;
  saveToStorage();
  updateGlobalStats(); // Refresh to show bell icon
  showSuccessToast(`Reminder set for ${student.name} on ${newDate}`);
}

function openAllRemindersModal() {
  const modalEl = document.getElementById('allRemindersModal');
  if (!modalEl) return;

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const list = document.getElementById('allRemindersList');

  if (!list) return;

  const today = new Date().toISOString().split('T')[0];
  const reminders = globalData.students
    .filter(s => s.reminderDate && (parseFloat(s.due) > 0))
    .sort((a, b) => a.reminderDate.localeCompare(b.reminderDate));

  if (reminders.length === 0) {
    list.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-bell-slash fs-1 d-block mb-3 opacity-25"></i>
        <p class="mb-0 fw-bold">No active payment reminders found.</p>
        <small>Set a reminder from the student list to see it here.</small>
      </div>
    `;
  } else {
    list.innerHTML = `
      <table class="table table-hover align-middle modern-table mb-0">
        <thead class="bg-light">
          <tr>
            <th>Date</th>
            <th>Student Name</th>
            <th>Batch</th>
            <th>Course</th>
            <th class="text-end">Due Amount</th>
            <th class="text-end">Action</th>
          </tr>
        </thead>
        <tbody>
          ${reminders.map(s => {
      const isOverdue = s.reminderDate < today;
      const dateClass = isOverdue ? 'text-danger fw-bold' : 'text-primary fw-bold';
      const badge = isOverdue ? '<span class="badge bg-danger-subtle text-danger ms-2">Overdue</span>' : '';

      return `
              <tr>
                <td>
                   <div class="${dateClass}">${s.reminderDate}</div>
                   ${badge}
                </td>
                <td class="fw-bold">${s.name}</td>
                <td><span class="badge bg-light text-dark border">${s.batch || '-'}</span></td>
                <td class="small text-muted">${s.course || '-'}</td>
                <td class="text-end text-danger fw-bold">৳${formatNumber(s.due)}</td>
                <td class="text-end">
                  <div class="d-flex justify-content-end gap-2">
                    <button class="btn btn-sm btn-outline-primary fw-bold" 
                      onclick="bootstrap.Modal.getInstance(document.getElementById('allRemindersModal')).hide(); openStudentProfile('${s.rowIndex}')">
                      Profile
                    </button>
                    <button class="btn btn-sm btn-success fw-bold" 
                      onclick="markReminderDone('${s.rowIndex}'); openAllRemindersModal();">
                      ✔ Done
                    </button>
                  </div>
                </td>
              </tr>
            `;
    }).join('')}
        </tbody>
      </table>
    `;
  }

  modal.show();
}

window.openAllRemindersModal = openAllRemindersModal;

// ===================================
// SEARCH & FILTER
// ===================================

function filterData() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const batchSummary = document.getElementById('batchSummaryCard');
  const activeTab = localStorage.getItem('wingsfly_active_tab') || 'students';

  // Unified Global Dates (Read from main or ledger depending on what was changed)
  const mainStart = document.getElementById('mainStartDate');
  const mainEnd = document.getElementById('mainEndDate');
  const ledgerStart = document.getElementById('ledgerStartDate');
  const ledgerEnd = document.getElementById('ledgerEndDate');

  let startDate = mainStart.value;
  let endDate = mainEnd.value;

  // If we are on ledger, prioritize ledger inputs
  if (activeTab === 'ledger' && ledgerStart && ledgerEnd) {
    if (ledgerStart.value) {
      startDate = ledgerStart.value;
      mainStart.value = startDate;
    }
    if (ledgerEnd.value) {
      endDate = ledgerEnd.value;
      mainEnd.value = endDate;
    }
  } else if (ledgerStart && ledgerEnd) {
    ledgerStart.value = startDate;
    ledgerEnd.value = endDate;
  }

  if (activeTab === 'students') {
    const filtered = globalData.students.filter(s => {
      const matchSearch = !q || (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.batch && s.batch.toString() === q) || /* EXACT MATCH for batch number */
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.phone && q.length > 3 && s.phone.includes(q)) /* Increased threshold for phone */
      );

      // Explicitly ignore financial fields unless user searches specifically (advanced)
      // This prevents "6" from matching "600" in Paid/Due etc.

      const matchDate = (!startDate || s.enrollDate >= startDate) && (!endDate || s.enrollDate <= endDate);

      return matchSearch && matchDate;
    });

    render(filtered);

    // Batch summary logic
    if (q) {
      const uniqueBatches = [...new Set(globalData.students.map(s => s.batch))];
      const matchedBatch = uniqueBatches.find(b => b && b.toString().toLowerCase() === q);
      if (matchedBatch) {
        showBatchSummary(matchedBatch, filtered);
      } else {
        batchSummary.classList.add('d-none');
      }
    } else {
      batchSummary.classList.add('d-none');
    }
  } else {
    // Ledger tab filtering
    const type = document.getElementById('ledgerTypeFilter').value;
    const category = document.getElementById('ledgerCategoryFilter').value;
    const method = document.getElementById('ledgerMethodFilter').value;

    const filteredFinance = globalData.finance.filter(f => {
      const matchSearch = !q || (
        (f.category && f.category.toLowerCase().includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        (f.method && f.method.toLowerCase().includes(q)) ||
        (f.type && f.type.toLowerCase().includes(q)) ||
        (f.person && f.person.toLowerCase().includes(q))
      );

      const loanOnly = document.getElementById('ledgerLoanOnly')?.checked;

      const matchDate = (!startDate || f.date >= startDate) && (!endDate || f.date <= endDate);
      const matchType = !type || f.type === type;
      const matchCategory = !category || f.category === category;
      const matchMethod = !method || f.method === method;
      const matchLoan = !loanOnly || (f.type === 'Loan Given' || f.type === 'Loan Received');

      return matchSearch && matchDate && matchType && matchCategory && matchMethod && matchLoan;
    });
    renderLedger(filteredFinance);
  }
}

function handleGlobalSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const activeTab = localStorage.getItem('wingsfly_active_tab') || 'dashboard';

  if (activeTab === 'dashboard') {
    // Filter the dashboard recent admissions table
    if (typeof renderRecentAdmissions === 'function') {
      renderRecentAdmissions(q);
    }
  } else if (activeTab === 'students' || activeTab === 'ledger') {
    // Use existing filterData which uses 'searchInput'
    filterData();
  } else if (activeTab === 'visitors') {
    // Synchronize with visitor search if possible
    const visitorInp = document.getElementById('visitorSearchInput');
    if (visitorInp) {
      visitorInp.value = q;
      if (typeof searchVisitors === 'function') searchVisitors();
    }
  } else if (activeTab === 'examResults') {
    const examInp = document.getElementById('examResultSearchInput');
    if (examInp) {
      examInp.value = q;
      if (typeof searchExamResults === 'function') searchExamResults();
    }
  } else if (activeTab === 'loans') {
    const loanInp = document.getElementById('loanSearchInput');
    if (loanInp) {
      loanInp.value = q;
      if (typeof filterLoanSummary === 'function') filterLoanSummary();
    }
  }
}

window.calcBatchProfit = function () {
  const batchName = document.getElementById('dashBatchSearch').value.toLowerCase().trim();
  const start = document.getElementById('dashBatchStart').value;
  const end = document.getElementById('dashBatchEnd').value;

  const resultDiv = document.getElementById('batchProfitResult');
  const emptyDiv = document.getElementById('batchAnalysisEmpty');

  if (!batchName) {
    if (resultDiv) resultDiv.style.display = 'none';
    if (emptyDiv) emptyDiv.style.display = 'block';
    return;
  }

  if (resultDiv) resultDiv.style.display = 'flex';
  if (emptyDiv) emptyDiv.style.display = 'none';

  let bIncome = 0;
  let bExpense = 0;

  globalData.finance.forEach(f => {
    const descMatch = f.description && f.description.toLowerCase().includes(batchName);
    const catMatch = f.category && f.category.toLowerCase().includes(batchName);
    const personMatch = f.person && f.person.toLowerCase().includes(batchName);

    if (!(descMatch || catMatch || personMatch)) return;

    const dateMatch = (!start || f.date >= start) && (!end || f.date <= end);
    if (!dateMatch) return;

    const amt = parseFloat(f.amount) || 0;
    if (f.type === 'Income' || f.type === 'Loan Received') {
      bIncome += amt;
    } else if (f.type === 'Expense' || f.type === 'Loan Given') {
      bExpense += amt;
    }
  });

  const bProfit = bIncome - bExpense;

  document.getElementById('batchIncomeVal').innerText = '৳' + formatNumber(bIncome);
  document.getElementById('batchExpenseVal').innerText = '৳' + formatNumber(bExpense);

  const profitValEl = document.getElementById('batchProfitVal');
  const profitBoxEl = document.getElementById('batchProfitBox');
  const profitLabelEl = document.getElementById('batchProfitLabel');

  if (profitValEl) {
    profitValEl.innerText = '৳' + formatNumber(Math.abs(bProfit));
    if (bProfit >= 0) {
      profitValEl.className = "mb-0 text-success fw-bold";
      if (profitLabelEl) {
        profitLabelEl.innerText = "Net Profit";
        profitLabelEl.className = "mb-1 small text-success fw-bold";
      }
      if (profitBoxEl) profitBoxEl.className = "p-3 rounded-3 bg-success-subtle border border-success-subtle";
    } else {
      profitValEl.className = "mb-0 text-danger fw-bold";
      if (profitLabelEl) {
        profitLabelEl.innerText = "Net Loss";
        profitLabelEl.className = "mb-1 small text-danger fw-bold";
      }
      if (profitBoxEl) profitBoxEl.className = "p-3 rounded-3 bg-danger-subtle border border-danger-subtle";
    }
  }
};

function showBatchSummary(batchName, studentList = null) {
  const source = studentList || globalData.students;
  const batchStudents = source.filter(s => s.batch === batchName);

  // ✅ CALCULATE ALL BATCH TOTALS
  const batchTotalPayment = batchStudents.reduce((sum, s) => sum + (parseFloat(s.totalPayment) || 0), 0);
  const batchPaid = batchStudents.reduce((sum, s) => sum + (parseFloat(s.paid) || 0), 0);
  const batchDue = batchStudents.reduce((sum, s) => sum + (parseFloat(s.due) || 0), 0);

  document.getElementById('summaryBatchName').innerText = batchName;
  document.getElementById('summaryBatchTotalPayment').innerText = '৳' + formatNumber(batchTotalPayment);
  document.getElementById('summaryBatchPaid').innerText = '৳' + formatNumber(batchPaid);
  document.getElementById('summaryBatchDue').innerText = '৳' + formatNumber(batchDue);
  document.getElementById('summaryBatchCount').innerText = batchStudents.length;

  document.getElementById('batchSummaryCard').classList.remove('d-none');
}

// ===================================
// ADD STUDENT
// ===================================

function calcDue() {
  const total = parseFloat(document.getElementById('inpTotal').value) || 0;
  const paid = parseFloat(document.getElementById('inpPaid').value) || 0;
  document.getElementById('inpDue').value = Math.max(0, total - paid);
}

// Student form handler
async function handleStudentSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('studentForm');
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => data[key] = value);

  // ✅ CRITICAL VALIDATION: Payment Method is REQUIRED
  if (!data.method || data.method.trim() === '') {
    showErrorToast('❌ Payment Method is required! Please select a payment method.');
    document.getElementById('studentMethodSelect').focus();
    return;
  }

  try {
    const editIndex = data.studentRowIndex;
    let student;
    let photoURL = data.photoURL || null; // Get existing photo URL from hidden field

    // === PHOTO UPLOAD HANDLING ===
    // If a new photo was selected, upload it first
    if (selectedStudentPhotoFile) {
      try {
        // Generate student ID for photo path
        const tempStudentId = data.studentRowIndex !== undefined && data.studentRowIndex !== ''
          ? window.globalData.students[parseInt(data.studentRowIndex)]?.studentId
          : generateStudentId(data.batch);

        // Upload photo to Firebase Storage
        showSuccessToast('⏳ Uploading photo...');
        photoURL = await uploadStudentPhoto(tempStudentId, selectedStudentPhotoFile);

        // If updating student and had old photo, delete it
        if (editIndex !== undefined && editIndex !== '') {
          const oldStudent = window.globalData.students[parseInt(editIndex)];
          if (oldStudent && oldStudent.photo && oldStudent.photo !== photoURL) {
            await deleteStudentPhoto(oldStudent.photo);
          }
        }

        // Clear the selected file
        selectedStudentPhotoFile = null;
      } catch (uploadError) {
        console.error('Photo upload error:', uploadError);
        showErrorToast('⚠️ Photo upload failed, but student will be saved without photo.');
        photoURL = null;
      }
    }

    // Use window.globalData for all student operations
    if (editIndex !== undefined && editIndex !== '') {
      // ====== UPDATE EXISTING STUDENT ======
      const index = parseInt(editIndex);
      student = window.globalData.students[index];
      if (student) {
        student.name = data.name;
        student.phone = data.phone;
        student.fatherName = data.fatherName || '';
        student.motherName = data.motherName || '';
        student.course = data.course;
        student.batch = data.batch;
        student.enrollDate = data.enrollDate;
        student.method = data.method;
        student.totalPayment = parseFloat(data.totalPayment) || 0;
        student.paid = parseFloat(data.payment) || 0;
        student.due = parseFloat(data.due) || 0;
        student.reminderDate = data.reminderDate || null;
        student.remarks = data.remarks || student.remarks || '';
        student.bloodGroup = data.bloodGroup || '';

        // Update photo if new one was uploaded
        if (photoURL) {
          student.photo = photoURL;
        }

        if (!student.installments) student.installments = [];
      }
    } else {
      // ====== ADD NEW STUDENT ======
      student = {
        name: data.name,
        phone: data.phone,
        fatherName: data.fatherName || '',
        motherName: data.motherName || '',
        bloodGroup: data.bloodGroup || '',
        course: data.course,
        batch: data.batch,
        enrollDate: data.enrollDate || new Date().toISOString().split('T')[0],
        method: data.method || 'Cash',
        totalPayment: parseFloat(data.totalPayment) || 0,
        paid: parseFloat(data.payment) || 0,
        due: parseFloat(data.due) || 0,
        reminderDate: data.reminderDate || null,
        studentId: generateStudentId(data.batch),
        remarks: data.remarks || '',
        photo: photoURL, // Store Firebase Storage URL
        installments: parseFloat(data.payment) > 0 ? [{
          amount: parseFloat(data.payment),
          date: data.enrollDate || new Date().toISOString().split('T')[0],
          method: data.method || 'Cash'
        }] : []
      };

      window.globalData.students.push(student);

      // Get the actual index of the newly added student
      const newStudentIndex = window.globalData.students.length - 1;

      // AUTOMATICALLY ADD PAYMENT TO INCOME (Only for NEW students)
      if (student.paid > 0) {
        const financeEntry = {
          type: 'Income',
          method: student.method,
          date: student.enrollDate,
          category: 'Student Fee',
          person: student.name,
          amount: student.paid,
          description: `Enrollment fee for student: ${student.name} | Batch: ${student.batch}`,
          timestamp: new Date().toISOString()
        };
        window.globalData.finance.push(financeEntry);
        if (typeof updateAccountBalance === "function") {
          updateAccountBalance(financeEntry.method, financeEntry.amount, financeEntry.type);
        }
      }

      // Print receipt after a short delay
      setTimeout(() => printReceipt(newStudentIndex, student.paid), 1000);
    }

    // Save to storage
    if (typeof globalData !== 'undefined') globalData = window.globalData;
    const saveSuccess = await saveToStorage();

    if (saveSuccess === false) {
      showErrorToast("CRITICAL: Failed to save data. Both Local and Cloud storage are full.");
    }

    // Update UI
    render(window.globalData.students);
    updateGlobalStats();
    updateStudentCount();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('studentModal'));
    if (modal) modal.hide();

    // Reset form
    form.reset();

    // Reset photo upload UI
    removeStudentPhoto();

    showSuccessToast(editIndex ? '✅ Student updated successfully!' : '✅ Student enrolled successfully!');

  } catch (error) {
    console.error("Error saving student:", error);
    showErrorToast("❌ An error occurred: " + error.message);
  }
}

// ===================================
// DELETE STUDENT
// ===================================
// STUDENT PAYMENT & INSTALLMENT LOGIC
// ===================================

let currentPaymentStudentIndex = null;

/**
 * Gets consistent installment list, recovering any missing initial payments
 */
function getStudentInstallments(student) {
  if (!student) return [];
  const installments = [...(student.installments || [])];
  const totalPaid = parseFloat(student.paid) || 0;
  const installmentsSum = installments.reduce((sum, inst) => sum + (parseFloat(inst.amount) || 0), 0);

  // If there's a difference, the missing amount is the "Initial Payment"
  if (totalPaid > installmentsSum) {
    const missing = totalPaid - installmentsSum;
    // Add to the START of the list
    installments.unshift({
      amount: missing,
      date: student.enrollDate || 'Opening',
      method: student.method || 'Cash',
      isMigrated: true
    });
  }
  return installments;
}

function openStudentPaymentModal(rowIndex) {
  // Use direct index access
  const student = globalData.students[rowIndex];
  if (!student) { alert("Student not found!"); return; }

  currentPaymentStudentIndex = rowIndex;

  // Update header/summary
  document.getElementById('pmtTotalFee').innerText = '৳' + formatNumber(student.totalPayment || 0);
  document.getElementById('pmtTotalPaid').innerText = '৳' + formatNumber(student.paid || 0);
  document.getElementById('pmtTotalDue').innerText = '৳' + formatNumber(student.due || 0);

  // Suggest remaining due in amount field
  const amountField = document.getElementById('pmtNewAmount');
  if (amountField) amountField.value = student.due > 0 ? student.due : '';

  // Populate history table
  const tbody = document.getElementById('pmtHistoryBody');
  tbody.innerHTML = '';

  const installments = getStudentInstallments(student);
  if (installments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No payments recorded yet.</td></tr>';
  } else {
    installments.forEach((inst, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${inst.date} ${inst.isMigrated ? '(Initial)' : ''}</td>
        <td><span class="badge bg-light text-dark border">${inst.method || 'N/A'}</span></td>
        <td class="text-end fw-bold">৳${formatNumber(inst.amount)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary" onclick="printReceipt(${rowIndex}, ${inst.amount})">
            <i class="bi bi-printer"></i> RECEIPT
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  const modal = new bootstrap.Modal(document.getElementById('studentPaymentModal'));
  modal.show();
}

function handleAddInstallment() {
  if (currentPaymentStudentIndex === null) return;

  // Use direct array index access instead of find with rowIndex
  const student = globalData.students[currentPaymentStudentIndex];
  if (!student) {
    alert('Student not found!');
    return;
  }

  const amount = parseFloat(document.getElementById('pmtNewAmount').value);
  const method = document.getElementById('pmtNewMethod').value;
  const today = new Date().toISOString().split('T')[0];

  // ✅ CRITICAL VALIDATION: Payment Method is REQUIRED
  if (!method || method.trim() === '') {
    showErrorToast('❌ Payment Method is required! Please select a payment method.');
    document.getElementById('pmtNewMethod').focus();
    return;
  }

  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  // Confirm if amount exceeds due
  if (amount > (student.due + 1)) { // Allow 1tk buffer for rounding
    if (!confirm(`Warning: Payment amount (৳${formatNumber(amount)}) exceeds current due (৳${formatNumber(student.due)}). Continue?`)) return;
  }

  // 1. Update Student Data
  if (!student.installments) student.installments = [];

  // Ensure we don't duplicate migrated payments if we add new ones
  // (We'll keep the underlying installments array clean, the helper handles display)
  student.installments.push({ amount, date: today, method });

  student.paid = (parseFloat(student.paid) || 0) + amount;
  student.due = Math.max(0, (parseFloat(student.totalPayment) || 0) - student.paid);

  // 2. Add to Finance Ledger
  const financeEntry = {
    id: Date.now(),
    type: 'Income',
    method: method,
    date: today,
    category: 'Student Installment',
    person: student.name,
    amount: amount,
    description: `Installment payment for student: ${student.name} | Batch: ${student.batch}`,
    timestamp: new Date().toISOString()
  };
  globalData.finance.push(financeEntry);

  // 3. Save & Refresh
  saveToStorage();

  // Success feedback
  showSuccessToast('Installment added successfully!');

  // Reset form
  document.getElementById('pmtNewAmount').value = '';

  // Refresh modal UI
  openStudentPaymentModal(currentPaymentStudentIndex);

  // Refresh main table
  render(globalData.students);
  updateGlobalStats();

  // Trigger receipt
  printReceipt(currentPaymentStudentIndex, amount);
}

window.openStudentPaymentModal = openStudentPaymentModal;
window.handleAddInstallment = handleAddInstallment;



function deleteStudent(rowIndex) {
  if (!confirm('Are you sure you want to delete this student?')) return;

  // Get student info before deleting
  const student = globalData.students[rowIndex];
  if (!student) {
    alert("Error: Student not found.");
    return;
  }

  // CRITICAL: Reverse all account balances from this student's payments
  // Find all finance transactions related to this student
  if (student.installments && student.installments.length > 0) {
    student.installments.forEach(inst => {
      const amount = parseFloat(inst.amount) || 0;
      const method = inst.method || 'Cash';

      // Reverse the payment: deduct from account
      if (method === 'Cash') {
        globalData.cashBalance = (parseFloat(globalData.cashBalance) || 0) - amount;
      } else {
        // Check bank accounts
        let account = (globalData.bankAccounts || []).find(acc => acc.name === method);
        if (!account) {
          // Check mobile banking
          account = (globalData.mobileBanking || []).find(acc => acc.name === method);
        }
        if (account) {
          account.balance = (parseFloat(account.balance) || 0) - amount;
        }
      }
    });
  }

  // Delete related finance transactions (student payments)
  if (globalData.finance && Array.isArray(globalData.finance)) {
    // Remove all finance entries where student name matches
    // (assuming finance records might have student.name in description or person field)
    globalData.finance = globalData.finance.filter(f => {
      // Keep transaction if it's not related to this student
      return !(f.person === student.name ||
        (f.description && f.description.includes(student.name)));
    });
  }

  // Remove student from array
  if (rowIndex >= 0 && rowIndex < globalData.students.length) {
    globalData.students.splice(rowIndex, 1);
  } else {
    alert("Error deleting student.");
    return;
  }

  saveToStorage();

  showSuccessToast('Student deleted successfully! (Payments reversed)');
  render(globalData.students);
  updateGlobalStats();

  // Update account displays
  if (typeof renderAccountList === 'function') renderAccountList();
  if (typeof renderCashBalance === 'function') renderCashBalance();
  if (typeof renderMobileBankingList === 'function') renderMobileBankingList();
  if (typeof updateGrandTotal === 'function') updateGrandTotal();
}

// ===================================
// ADD FINANCE TRANSACTION
// ===================================

async function handleFinanceSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('financeForm');
  const formData = {};
  new FormData(form).forEach((value, key) => formData[key] = value);

  // ✅ CRITICAL VALIDATION: Payment Method is REQUIRED
  if (!formData.method || formData.method.trim() === '') {
    showErrorToast('❌ Payment Method is required! Please select a payment method.');
    document.getElementById('financeMethodSelect').focus();
    return;
  }

  // ✅ VALIDATION: Person field is mandatory ONLY for Loan TYPES
  const type = formData.type || '';
  const person = (formData.person || '').trim();

  // Only Loan Given and Loan Received TYPE require Person field
  if ((type === 'Loan Given' || type === 'Loan Received') && !person) {
    showErrorToast('⚠️ Person/Counterparty name is required for Loan transactions!');
    return;
  }

  // Add transaction to data
  const newTransaction = {
    id: Date.now(), // Unique ID
    type: formData.type,
    method: formData.method,
    date: formData.date,
    amount: parseFloat(formData.amount) || 0,
    category: formData.category || 'General',
    description: formData.description || '',
    person: person
  };

  window.globalData.finance.push(newTransaction);
  if (typeof updateAccountBalance === "function") updateAccountBalance(newTransaction.method, newTransaction.amount, newTransaction.type);
  await saveToStorage();

  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('financeModal'));
  modal.hide();

  // Reset form and reload
  form.reset();

  // Reset date to today
  const today = new Date().toISOString().split('T')[0];
  form.querySelector('input[name="date"]').value = today;

  showSuccessToast('Transaction added successfully!');
  updateGlobalStats(); if (typeof renderFinanceTable === "function") renderFinanceTable();
}

// ===================================
// ADD TRANSFER TRANSACTION
// ===================================

async function handleTransferSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('transferForm');
  const formData = {};
  new FormData(form).forEach((value, key) => formData[key] = value);

  const amount = parseFloat(formData.amount) || 0;
  const fromMethod = formData.fromMethod;
  const toMethod = formData.toMethod;
  const date = new Date().toISOString().split('T')[0];

  if (fromMethod === toMethod) {
    alert('Source and destination accounts must be different.');
    return;
  }

  // Create "Transfer Out" from source
  const outTransaction = {
    id: Date.now(),
    type: 'Transfer Out',
    method: fromMethod,
    date: date,
    amount: amount,
    category: 'Transfer',
    description: formData.description || `Transfer to ${toMethod}`
  };

  // Create "Transfer In" to destination
  const inTransaction = {
    id: Date.now() + 1,
    type: 'Transfer In',
    method: toMethod,
    date: date,
    amount: amount,
    category: 'Transfer',
    description: formData.description || `Transfer from ${fromMethod}`
  };

  globalData.finance.push(outTransaction);
  globalData.finance.push(inTransaction);

  await saveToStorage();

  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('transferModal'));
  modal.hide();

  form.reset();
  showSuccessToast('Transfer completed successfully!');
  updateGlobalStats(); if (typeof renderFinanceTable === "function") renderFinanceTable();
}

// ===================================
// DELETE TRANSACTION
// ===================================

function deleteTransaction(id) {
  if (!confirm('Are you sure you want to delete this financial record?')) return;

  const txToDelete = globalData.finance.find(f => f.id === id);
  if (txToDelete && typeof updateAccountBalance === "function") updateAccountBalance(txToDelete.method, txToDelete.amount, txToDelete.type, false);
  globalData.finance = globalData.finance.filter(f => f.id !== id);
  saveToStorage();

  showSuccessToast('Transaction deleted successfully!');

  // Refresh based on active tab
  const activeTab = localStorage.getItem('wingsfly_active_tab');
  if (activeTab === 'ledger') {
    renderLedger(globalData.finance);
  }
  // Always update stats regardless of tab
  updateGlobalStats();

  // Also refresh Account Details if open
  if (bootstrap.Modal.getInstance(document.getElementById('accountDetailsModal'))) {
    renderAccountDetails();
  }
}

// ===================================
// EDIT TRANSACTION
// ===================================

function editTransaction(id) {
  const transaction = globalData.finance.find(f => f.id === id);
  if (!transaction) return;

  const form = document.getElementById('editTransactionForm');
  form.transactionId.value = transaction.id;
  form.type.value = transaction.type;
  form.method.value = transaction.method || 'Cash';
  form.date.value = transaction.date;
  form.amount.value = transaction.amount;
  form.category.value = transaction.category || '';
  form.description.value = transaction.description || '';

  const modal = new bootstrap.Modal(document.getElementById('editTransactionModal'));
  modal.show();
}

async function handleEditTransactionSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('editTransactionForm');
  const formData = {};
  new FormData(form).forEach((value, key) => formData[key] = value);

  // ✅ CRITICAL VALIDATION: Payment Method is REQUIRED
  if (!formData.method || formData.method.trim() === '') {
    showErrorToast('❌ Payment Method is required! Please select a payment method.');
    document.getElementById('editTransMethodSelect').focus();
    return;
  }

  const id = parseInt(formData.transactionId);
  const index = globalData.finance.findIndex(f => f.id === id);

  if (index !== -1) {
    globalData.finance[index] = {
      ...globalData.finance[index],
      type: formData.type,
      method: formData.method,
      date: formData.date,
      amount: parseFloat(formData.amount) || 0,
      category: formData.category,
      description: formData.description
    };
    await saveToStorage();

    const modal = bootstrap.Modal.getInstance(document.getElementById('editTransactionModal'));
    modal.hide();

    showSuccessToast('Transaction updated successfully!');

    // Refresh
    renderLedger(globalData.finance);
    updateGlobalStats();

    // Also refresh Account Details if open
    if (bootstrap.Modal.getInstance(document.getElementById('accountDetailsModal'))) {
      renderAccountDetails();
    }
  }
}

// ===================================
// ACCOUNT DETAILS VIEW (MODAL)
// ===================================

function showAccountDetails() {
  // Hide settings modal first
  const settingsModal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
  if (settingsModal) settingsModal.hide();

  // Open account details modal
  const detailsModal = new bootstrap.Modal(document.getElementById('accountDetailsModal'));
  detailsModal.show();

  // Initialize with today's date range (optional, can be empty)
  // document.getElementById('detStartDate').value = new Date().toISOString().split('T')[0];

  renderAccountDetails();
}

function resetDetailFilters() {
  document.getElementById('detStartDate').value = '';
  document.getElementById('detEndDate').value = '';
  document.getElementById('detTypeFilter').value = '';
  document.getElementById('detCategoryFilter').value = '';
  renderAccountDetails();
}

function renderAccountDetails() {
  const tbody = document.getElementById('accountDetailsTableBody');
  tbody.innerHTML = '';

  const startDate = document.getElementById('detStartDate').value;
  const endDate = document.getElementById('detEndDate').value;
  const typeFilter = document.getElementById('detTypeFilter').value;
  const categoryFilter = document.getElementById('detCategoryFilter').value;

  const filtered = globalData.finance.filter(f => {
    const matchDate = (!startDate || f.date >= startDate) && (!endDate || f.date <= endDate);
    const matchCategory = !categoryFilter || f.category === categoryFilter;
    let matchType = true;

    if (typeFilter) {
      if (typeFilter === 'Income') matchType = f.type === 'Income';
      else if (typeFilter === 'Expense') matchType = f.type === 'Expense';
      else if (typeFilter === 'Transfer') matchType = f.type.includes('Transfer');
    }

    return matchDate && matchCategory && matchType;
  });

  const displayItems = [...filtered].reverse();
  let total = 0;

  if (displayItems.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No transactions found for these filters</td></tr>';
    document.getElementById('detTotalAmount').innerText = '৳0';
    return;
  }

  displayItems.forEach(f => {
    const amt = parseFloat(f.amount) || 0;
    const isPositive = (f.type === 'Income' || f.type === 'Loan Received' || f.type === 'Transfer In');
    const amtClass = isPositive ? 'text-success' : 'text-danger';

    if (isPositive) total += amt;
    else total -= amt;

    const row = `
            <tr>
                <td>${f.date || 'N/A'}</td>
                <td><span class="badge ${f.type.includes('Transfer') ? 'bg-warning' : (isPositive ? 'bg-success-light text-success' : 'bg-danger-light text-danger')} border-0">${f.type}</span></td>
                <td class="small fw-semibold">${f.method || 'Cash'}</td>
                <td>${f.category || 'N/A'}</td>
                <td class="small text-muted">${f.description || ''}</td>
                <td class="${amtClass} fw-bold">৳${formatNumber(amt)}</td>
                <td class="no-print">
                    <button class="btn btn-sm btn-outline-danger border-0" onclick="deleteTransaction(${f.id})" title="Delete entry">
                        🗑️ DELETE
                    </button>
                </td>
            </tr>
        `;
    tbody.innerHTML += row;
  });

  // Update total
  const totalEl = document.getElementById('detTotalAmount');
  totalEl.innerText = '৳' + formatNumber(total);
  totalEl.className = total >= 0 ? 'fs-5 text-success' : 'fs-5 text-danger';

  updateDetailCategoryDropdown();
}

function printAccountDetails() {
  const printArea = document.getElementById('printArea');
  const startDate = document.getElementById('detStartDate').value;
  const endDate = document.getElementById('detEndDate').value;
  const typeFilter = document.getElementById('detTypeFilter').value;
  const categoryFilter = document.getElementById('detCategoryFilter').value;

  const filtered = globalData.finance.filter(f => {
    const matchDate = (!startDate || f.date >= startDate) && (!endDate || f.date <= endDate);
    const matchCategory = !categoryFilter || f.category === categoryFilter;
    let matchType = true;
    if (typeFilter) {
      if (typeFilter === 'Income') matchType = f.type === 'Income';
      else if (typeFilter === 'Expense') matchType = f.type === 'Expense';
      else if (typeFilter === 'Transfer') matchType = f.type.includes('Transfer');
    }
    return matchDate && matchCategory && matchType;
  });

  const displayItems = [...filtered].reverse();
  let totalBalance = 0;

  const tableRows = displayItems.map(f => {
    const amt = parseFloat(f.amount) || 0;
    const isPositive = (f.type === 'Income' || f.type === 'Loan Received' || f.type === 'Transfer In' || (f.type === 'Transfer' && f.transactionType === 'Credit'));
    if (isPositive) totalBalance += amt;
    else totalBalance -= amt;

    return `
      <tr>
        <td style="font-weight: 700;">${f.date || 'N/A'}</td>
        <td style="text-transform: uppercase; font-size: 11px; font-weight: bold;">${f.type}</td>
        <td>${f.method || 'Cash'}</td>
        <td style="font-weight: 600;">${f.category || 'N/A'}</td>
        <td style="color: #64748b; font-size: 11px;">${f.description || ''}</td>
        <td style="text-align: right; color: ${isPositive ? '#10b981' : '#ef4444'}; font-weight: 800;">
          ${isPositive ? '' : '-'}৳${formatNumber(amt)}
        </td>
      </tr>
    `;
  }).join('');

  printArea.innerHTML = `
    <div style="width: 100%; background: white; padding: 30px 40px 20px 40px; font-family: 'Outfit', sans-serif; page-break-after: avoid;">
        ${getPrintHeader('ACCOUNT STATEMENT')}
        
        <div style="display: flex; justify-content: space-between; margin-top: 20px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div>
                <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Filtered Statistics</p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #1e293b; font-weight: 700;"> Period: ${startDate || 'All Time'} - ${endDate || 'Now'} </p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;"> Type: ${typeFilter || 'All'} | Category: ${categoryFilter || 'All'} </p>
            </div>
            <div style="text-align: right;">
                <p style="margin: 0; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">Final Balance</p>
                <p style="margin: 5px 0 0 0; font-size: 24px; color: ${totalBalance >= 0 ? '#10b981' : '#ef4444'}; font-weight: 900;"> ৳${formatNumber(totalBalance)} </p>
            </div>
        </div>

        <table class="report-table" style="margin-top: 20px; page-break-inside: auto;">
            <thead>
                <tr>
                    <th style="width: 15%;">Date</th>
                    <th style="width: 15%;">Type</th>
                    <th style="width: 15%;">Method</th>
                    <th style="width: 20%;">Category</th>
                    <th style="width: 20%;">Description</th>
                    <th style="text-align: right; width: 15%;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="5" style="text-align: right; padding: 15px; font-weight: 900; color: #1e293b; text-transform: uppercase; font-size: 14px;">Total Settlement:</td>
                    <td style="text-align: right; padding: 15px; font-weight: 900; color: ${totalBalance >= 0 ? '#10b981' : '#ef4444'}; font-size: 18px;">৳${formatNumber(totalBalance)}</td>
                </tr>
            </tfoot>
        </table>

        <div style="margin-top: 25px; background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; page-break-inside: avoid;">
            <p style="margin: 0; font-size: 11px; font-weight: bold; color: #92400e; text-transform: uppercase;">Disclaimer</p>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #b45309; line-height: 1.4;">This is a system-generated financial statement. Any discrepancies should be reported to the finance department immediately.</p>
        </div>
    </div>
  `;

  document.body.classList.add('printing-receipt');
  setTimeout(() => {
    window.print();
    setTimeout(() => document.body.classList.remove('printing-receipt'), 1000);
  }, 800);
}

function updateDetailCategoryDropdown() {
  const select = document.getElementById('detCategoryFilter');
  const currentVal = select.value;
  const categories = [...new Set(globalData.finance.map(f => f.category).filter(Boolean))].sort();

  select.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.innerText = cat;
    select.appendChild(opt);
  });
  select.value = currentVal;
}

// ===================================
// SETTINGS
// ===================================

function handleSettingsSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('settingsForm');
  const formData = {};
  new FormData(form).forEach((value, key) => formData[key] = value);

  // Dynamic start balances collection
  const startBalances = {};

  // Define allMethods before using it
  const allMethods = ['Cash'];
  const bankAccounts = globalData.bankAccounts || [];
  const mobileAccounts = globalData.mobileBanking || [];

  bankAccounts.forEach(acc => allMethods.push(acc.name));
  mobileAccounts.forEach(acc => allMethods.push(acc.name));

  allMethods.forEach(m => {
    const inputVal = form[`startBalance_${m}`]?.value;
    startBalances[m] = parseFloat(inputVal) || 0;
  });

  globalData.settings = {
    startBalances: startBalances,
    academyName: formData.academyName || 'Wings Fly Aviation Academy',
    monthlyTarget: parseFloat(formData.monthlyTarget) || 200000
  };

  // Update Credentials
  if (formData.adminPassword) {
    globalData.credentials = {
      username: formData.adminUsername || 'admin',
      password: formData.adminPassword
    };

    // Also update in users list for login compatibility
    if (globalData.users && Array.isArray(globalData.users)) {
      const adminUser = globalData.users.find(u => u.username === (formData.adminUsername || 'admin'));
      if (adminUser) {
        adminUser.password = formData.adminPassword;
      } else {
        globalData.users.push({
          username: formData.adminUsername || 'admin',
          password: formData.adminPassword,
          role: 'admin',
          name: 'Super Admin'
        });
      }
    }
  }

  saveToStorage();

  const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
  modal.hide();

  showSuccessToast('Settings updated successfully!');
  updateGlobalStats();
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Redundant local formatNumber removed, uses global one now.


// ===================================
// DEMO DATA RESET (for testing)
// ===================================

function resetDemoData() {
  if (confirm('Reset all data to demo state? This cannot be undone.')) {
    localStorage.removeItem('wingsfly_data');
    loadFromStorage();
    loadDashboard();
    showSuccessToast('Data reset to demo state!');
  }
}

// Refresh handler
function handleRefresh() {
  saveToStorage(); // Ensure data is saved
  location.reload();
}

function getPrintHeader(title) {
  const academy = (globalData && globalData.settings && globalData.settings.academyName) || 'Wings Fly Aviation Academy';
  const linearLogo = (window.APP_LOGOS && window.APP_LOGOS.linear) ? window.APP_LOGOS.linear : '';

  return `
    <div class="report-header" style="text-align: left; padding: 20px 0; border-bottom: 3px solid #111827;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                ${linearLogo ? `<img src="${linearLogo}" style="height: 50px;">` : `<h2 style="margin:0; color:#111827; font-weight:900;">${academy}</h2>`}
                <p style="margin: 5px 0 0 0; font-size: 11px; color: #64748b; letter-spacing: 1px; font-weight: bold; text-transform: uppercase;">Aviation Career Experts</p>
            </div>
            <div style="text-align: right;">
                <h1 style="margin: 0; font-size: 20px; color: #111827; font-weight: 800; border-bottom: 2px solid #3b82f6; display: inline-block;">${title}</h1>
                <p style="margin: 5px 0 0 0; font-size: 10px; color: #94a3b8; font-weight: bold;">DATE: ${new Date().toLocaleDateString('en-GB')}</p>
            </div>
        </div>
    </div>
  `;
}

function getPrintFooter() {
  return `
    <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 2px solid #e2e8f0;">
        <p style="margin: 0; font-size: 10px; color: #64748b; font-weight: 600;">System Generated Official Document | Wings Fly Aviation Academy</p>
        <p style="margin: 5px 0 0 0; font-size: 9px; color: #94a3b8;">www.wingsfly aviation.com</p>
    </div>
  `;
}

window.getPrintHeader = getPrintHeader;
window.getPrintFooter = getPrintFooter;

// Global cleanup for print area
window.addEventListener('afterprint', () => {
  const printArea = document.getElementById('printArea');
  if (printArea) printArea.innerHTML = '';
});

function printReceipt(rowIndex, currentPaymentAmount = null) {
  const student = globalData.students[rowIndex];
  if (!student) { alert('Student not found!'); return; }

  const receiptId = 'REC-' + Math.floor(100000 + Math.random() * 900000);
  const premiumLogo = (window.APP_LOGOS && window.APP_LOGOS.premium) ? window.APP_LOGOS.premium : '';
  const printArea = document.getElementById('printArea');

  // Get fixed installments list
  const installments = getStudentInstallments(student);

  // Generate Installment History Rows (Clear Table Format)
  const historyRows = (installments || []).map((inst, idx) => `
    <tr>
      <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; color: #64748b;">${idx + 1}</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; color: #1e293b;">${inst.date} ${inst.isMigrated ? '<span style="font-size: 10px; color: #94a3b8;">(Initial)</span>' : ''}</td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;"><span style="font-size: 11px; padding: 2px 8px; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc;">${inst.method || 'Cash'}</span></td>
      <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #15803d;">৳${formatNumber(inst.amount)}</td>
    </tr>
  `).join('');

  // Determine current receipt text
  const currentPmtMethod = currentPaymentAmount !== null
    ? (installments.find(i => i.amount === currentPaymentAmount)?.method || 'Cash')
    : (student.method || 'Cash');

  printArea.innerHTML = `
    <div class="receipt-layout" style="width: 210mm; height: 148mm; background: white; padding: 10mm 15mm; font-family: 'Inter', system-ui, sans-serif; position: relative; box-sizing: border-box; margin: 0 auto; color: #1e293b; line-height: 1.1; display: flex; flex-direction: column;">
        <!-- Premium Watermark Layer -->
        ${premiumLogo ? `<img src="${premiumLogo}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); opacity: 0.04; width: 350px; z-index: 0; pointer-events: none;">` : ''}

        <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column;">
            <!-- Official Header with Logo -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 3px solid #1e1b4b; padding-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    ${(window.APP_LOGOS && window.APP_LOGOS.premium) ? `<img src="${window.APP_LOGOS.premium}" style="height: 55px; width: auto;">` : ''}
                    <div>
                        <h1 style="margin: 0; color: #1e1b4b; font-size: 24px; font-weight: 800; text-transform: uppercase; line-height: 1;">Wings Fly</h1>
                        <p style="margin: 2px 0 0 0; color: #4338ca; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Aviation & Career Development Academy</p>
                        <p style="margin: 3px 0 0 0; color: #64748b; font-size: 9px;">Uttara, Dhaka | +880 1757 208244 | info@wingsflybd.com</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="background: #1e1b4b; color: white; padding: 5px 12px; font-weight: 800; border-radius: 4px; font-size: 14px; margin-bottom: 5px; display: inline-block;">MONEY RECEIPT</div>
                    <p style="margin: 0; font-size: 11px;"><strong>No:</strong> ${receiptId} | <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
                </div>
            </div>
            
            <!-- Student & Course Details -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="font-size: 11px;">
                   <span style="font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px;">Student Candidate details</span>
                   <strong style="font-size: 14px; color: #1e1b4b;">${student.name}</strong><br>
                   ID: <span style="font-weight: 700;">${student.studentId || 'N/A'}</span> | Phone: ${student.phone || 'N/A'}
                </div>
                <div style="text-align: right; border-left: 1px solid #e2e8f0; padding-left: 15px; font-size: 11px;">
                   <span style="font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px;">Academy Enrollment</span>
                   <strong style="font-size: 13px;">${student.course || 'N/A'}</strong><br>
                   Batch: ${student.batch || 'N/A'} | Adm. Date: ${student.enrollDate || 'N/A'}
                </div>
            </div>

            <!-- Main Ledger Table -->
            <div style="flex-grow: 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                    <thead style="background: #f1f5f9;">
                        <tr>
                            <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left;">Sl. No & Description of Fees</th>
                            <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: center; width: 80px;">Method</th>
                            <th style="padding: 6px 10px; border: 1px solid #e2e8f0; text-align: right; width: 110px;">Amount (৳)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">
                                <strong style="color: #1e1b4b; display: block;">Admission & Course Tuition Fees</strong>
                                <span style="font-size: 10px; color: #64748b;">(Full training program for ${student.course || 'selected course'})</span>
                            </td>
                            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; color: #94a3b8;">-</td>
                            <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 700; font-size: 12px;">${formatNumber(student.totalPayment || 0)}</td>
                        </tr>
                        ${(installments || []).slice(-2).map((inst, idx) => `
                        <tr style="color: #475569; font-size: 10px;">
                            <td style="padding: 5px 10px; border: 1px solid #e2e8f0;">â””â”€ Payment received on ${inst.date} ${inst.isMigrated ? '(Adm. Installment)' : ''}</td>
                            <td style="padding: 5px 10px; border: 1px solid #e2e8f0; text-align: center;"><span style="background: #f8fafc; padding: 1px 6px; border-radius: 3px; border: 1px solid #e2e8f0; font-size: 10px;">${inst.method || 'Cash'}</span></td>
                            <td style="padding: 5px 10px; border: 1px solid #e2e8f0; text-align: right; color: #15803d; font-weight: 700;">+ ${formatNumber(inst.amount)}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Financial Summary -->
            <div style="display: flex; justify-content: space-between; align-items: stretch; margin: 15px 0; margin-top: auto;">
                <div style="width: 55%; background: #f0f7ff; border-radius: 6px; padding: 10px 15px; border: 1.5px solid #bae6fd;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 10px; font-weight: 800; color: #0369a1; text-transform: uppercase;">${currentPaymentAmount !== null ? 'Received this Payment' : 'Total Collection'}</span>
                        <span style="background: #bae6fd; color: #0369a1; padding: 1px 8px; border-radius: 4px; font-weight: 800; font-size: 10px;">${currentPmtMethod}</span>
                    </div>
                    <div style="font-size: 18px; font-weight: 900; color: #1e293b; margin-top: 4px;">৳${formatNumber(currentPaymentAmount || student.paid || 0)}</div>
                </div>

                <div style="width: 42%; background: #ffffff; padding: 8px 12px; border: 2px solid #e2e8f0; border-radius: 8px; text-align: right;">
                    <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 700;">Remaining Balance</span>
                    <div style="font-size: 20px; font-weight: 900; color: #c00;">৳${formatNumber(student.due || 0)}</div>
                </div>
            </div>

            <!-- Official Signatures at the Absolute Bottom -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 15px; padding-top: 10px;">
                <div style="width: 32%; text-align: center;">
                    <div style="border-top: 1.5px solid #1e1b4b; padding-top: 5px; font-size: 10px; font-weight: 800; color: #1e1b4b; text-transform: uppercase;">
                        Candidate Signature
                    </div>
                </div>
                
                <div style="text-align: center; flex-grow: 1; padding: 0 10px;">
                     <p style="margin: 0; font-size: 8px; color: #94a3b8; font-style: italic;">
                        Computer generated record. This receipt is valid only with the official academy seal.<br>
                        Admission ID: WF-${student.rowIndex} | Powered by Wings Fly Aviation
                    </p>
                </div>

                <div style="width: 32%; text-align: center;">
                    <div style="height: 35px; display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 2px;">
                        ${(window.APP_LOGOS && window.APP_LOGOS.signature) ? `<img src="${window.APP_LOGOS.signature}" style="height: 38px; width: auto; position: absolute; bottom: 0;">` : ''}
                    </div>
                    <div style="border-top: 1.5px solid #1e1b4b; padding-top: 5px; font-size: 10px; font-weight: 800; color: #1e1b4b; text-transform: uppercase;">
                        Authorized Signature
                    </div>
                </div>
            </div>
        </div>
    </div>
  `;

  // Add print-specific class to body before printing
  document.body.classList.add('printing-receipt');

  setTimeout(() => {
    window.print();
    // Remove class after print dialog closes
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 1000);
  }, 500);
}

function printReport(type) {
  const printArea = document.getElementById('printArea');
  const q = document.getElementById('searchInput').value.toLowerCase().trim();

  let startDate = '';
  let endDate = '';
  let title = '';
  let tableContent = '';

  if (type === 'students') {
    title = 'STUDENT ENROLLMENT LIST';
    startDate = document.getElementById('mainStartDate').value;
    endDate = document.getElementById('mainEndDate').value;

    const students = globalData.students.filter(s => {
      const matchSearch = !q || (
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.batch && s.batch.toString().toLowerCase() === q) ||
        (s.batch && s.batch.toString().toLowerCase().includes(q) && q.length > 1) ||
        (s.course && s.course.toLowerCase().includes(q)) ||
        (s.phone && q.length > 3 && s.phone.includes(q))
      );
      const matchDate = (!startDate || s.enrollDate >= startDate) && (!endDate || s.enrollDate <= endDate);
      return matchSearch && matchDate;
    }).sort((a, b) => b.rowIndex - a.rowIndex);

    tableContent = `
      <table class="report-table">
        <thead>
          <tr>
            <th style="text-align: left;">Date</th>
            <th style="text-align: left;">Name</th>
            <th style="text-align: left;">Course</th>
            <th style="text-align: left;">Batch</th>
            <th style="text-align: right;">Total</th>
            <th style="text-align: right;">Paid</th>
            <th style="text-align: right;">Due</th>
          </tr>
        </thead>
        <tbody>
          ${students.map(s => `
            <tr>
              <td>${s.enrollDate || 'N/A'}</td>
              <td>${s.name || 'N/A'}</td>
              <td>${s.course || 'N/A'}</td>
              <td>${s.batch || 'N/A'}</td>
              <td style="text-align: right;">৳${formatNumber(s.totalPayment || 0)}</td>
              <td style="text-align: right;">৳${formatNumber(s.paid || 0)}</td>
              <td style="text-align: right;">৳${formatNumber(s.due || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'ledger') {
    title = 'FINANCIAL LEDGER REPORT';
    startDate = document.getElementById('ledgerStartDate').value;
    endDate = document.getElementById('ledgerEndDate').value;
    const lType = document.getElementById('ledgerTypeFilter').value;
    const lCategory = document.getElementById('ledgerCategoryFilter').value;
    const lMethod = document.getElementById('ledgerMethodFilter').value;

    const ledger = globalData.finance.filter(f => {
      const matchSearch = !q || (
        (f.category && f.category.toLowerCase().includes(q)) ||
        (f.description && f.description.toLowerCase().includes(q)) ||
        (f.method && f.method.toLowerCase().includes(q)) ||
        (f.type && f.type.toLowerCase().includes(q))
      );
      const matchDate = (!startDate || f.date >= startDate) && (!endDate || f.date <= endDate);
      const matchType = !lType || f.type === lType;
      const matchCategory = !lCategory || f.category === lCategory;
      const matchMethod = !lMethod || f.method === lMethod;
      return matchSearch && matchDate && matchType && matchCategory && matchMethod;
    }).reverse();

    tableContent = `
      <table class="report-table">
        <thead>
          <tr>
            <th style="text-align: left;">Date</th>
            <th style="text-align: left;">Type</th>
            <th style="text-align: left;">Category</th>
            <th style="text-align: left;">Description</th>
            <th style="text-align: left;">Method</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${ledger.map(f => `
            <tr>
              <td>${f.date || 'N/A'}</td>
              <td>${f.type}</td>
              <td>${f.category}</td>
              <td>${f.description || ''}</td>
              <td>${f.method}</td>
              <td style="text-align: right;">৳${formatNumber(f.amount || 0)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  printArea.innerHTML = `
    <div style="width: 100%; background: white; padding: 20px;">
        ${getPrintHeader(title)}
        ${tableContent}
        ${getPrintFooter()}
    </div>
  `;

  document.body.classList.add('printing-receipt');
  setTimeout(() => {
    window.print();
    setTimeout(() => document.body.classList.remove('printing-receipt'), 1000);
  }, 500);
}

window.printReceipt = printReceipt;
window.printReport = printReport;
window.printAccountDetails = printAccountDetails;
window.resetDemoData = resetDemoData;

// ===================================
// BACKUP & RESTORE (Export/Import)
// ===================================

function exportData() {
  try {
    const dataStr = JSON.stringify(globalData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `WingsFly_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccessToast('Backup exported successfully!');
  } catch (err) {
    alert('Error exporting data: ' + err.message);
  }
}

function importData() {
  const el = document.getElementById('importFileInput') || document.getElementById('importFile');
  if (el) el.click();
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!confirm('� ï¸ WARNING: Importing a backup will OVERWRITE all current data on this computer and the Cloud. Proceed?')) {
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      let importedData = JSON.parse(e.target.result);

      // Smart Unwrap: handle data exported with different key names
      if (importedData.wingsfly_data) importedData = importedData.wingsfly_data;
      if (importedData.globalData) importedData = importedData.globalData;

      // Validate structure
      if (!importedData.students || !Array.isArray(importedData.students)) {
        throw new Error('Invalid backup file. Could not find students list.');
      }

      // Sanitize: Fill in missing arrays
      importedData.students = importedData.students || [];
      importedData.finance = importedData.finance || [];
      importedData.employees = importedData.employees || [];
      importedData.incomeCategories = importedData.incomeCategories || ['Tuition Fees', 'Loan Received', 'Other'];
      importedData.expenseCategories = importedData.expenseCategories || ['Salary', 'Rent', 'Utilities', 'Loan Given', 'Other'];
      importedData.paymentMethods = importedData.paymentMethods || ['Cash', 'Bkash', 'Nogod'];
      importedData.settings = importedData.settings || { academyName: 'Wings Fly Aviation Academy' };

      // Update globalData
      window.globalData = importedData;
      if (typeof globalData !== 'undefined') globalData = window.globalData;

      console.log('✅ File parsed successfully:', {
        students: window.globalData.students.length,
        finance: window.globalData.finance.length
      });

      // Update local timestamp
      localStorage.setItem('lastLocalUpdate', new Date().toISOString());

      // Save and Force Sync to Cloud
      const syncSuccess = await saveToStorage();

      if (syncSuccess) {
        alert(`SUCCESS: ${window.globalData.students.length} students imported and synced to Cloud.`);
      } else {
        alert(`PARTIAL SUCCESS: ${window.globalData.students.length} students imported locally, but Cloud sync failed.`);
      }

      window.location.reload();
    } catch (err) {
      alert('Error importing data: ' + err.message);
      console.error(err);
    }
  };
  reader.readAsText(file);
}

window.exportData = exportData;
window.importData = importData;
window.handleImportFile = handleImportFile;

function openStudentProfile(rowIndex) {
  console.log('👤 openStudentProfile called, rowIndex:', rowIndex);

  // Use direct array index instead of find
  const student = globalData.students[rowIndex];

  if (!student) {
    console.error('❌ Student not found at index:', rowIndex);
    console.log('Total students:', globalData.students.length);
    console.log('All students:', globalData.students.map((s, i) => ({ index: i, name: s.name })));
    alert('Student not found!');
    return;
  }

  console.log('✅ Student found:', student.name);

  const modalEl = document.getElementById('studentProfileModal');
  if (!modalEl) {
    console.error('❌ Modal element not found: studentProfileModal');
    alert('Modal not found in HTML!');
    return;
  }

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  const content = document.getElementById('studentProfileContent');

  if (!content) {
    console.error('❌ Content element not found: studentProfileContent');
    return;
  }

  console.log('📋 Rendering student profile...');

  // Filter student payments (Search by name in finance descriptions)
  const payments = globalData.finance
    .filter(f => f.description && f.description.toLowerCase().includes(student.name.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  console.log('💰 Payments found:', payments.length);

  content.innerHTML = `
    <div class="row g-4">
      <div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm glass-card">
          <div class="card-body text-center">
            <div class="mb-3 d-flex justify-content-center">
              <div class="position-relative" style="width: 100px; height: 100px;">
                <img id="profilePhotoImg" src="${getStudentPhotoSrc(student.photo, 'profilePhotoImg')}" 
                    class="rounded-circle shadow-sm border border-primary border-4" 
                    style="width: 100px; height: 100px; object-fit: cover;">
                <div class="bg-primary text-white rounded-circle position-absolute bottom-0 end-0 d-flex align-items-center justify-content-center" 
                     style="width: 30px; height: 30px; border: 3px solid white;">
                  <i class="bi bi-person-fill small"></i>
                </div>
              </div>
            </div>
            <h4 class="fw-bold mb-1">${student.name}</h4>
            <p class="text-muted mb-3">${student.course} • ${student.batch}</p>
            <div class="d-grid gap-2 text-start">
              <div class="p-2 rounded border bg-light">
                <small class="text-muted d-block opacity-75">Phone</small>
                <span class="fw-bold">${student.phone || 'N/A'}</span>
              </div>
              <div class="p-2 rounded border bg-light">
                <small class="text-muted d-block opacity-75">Enrollment Date</small>
                <span class="fw-bold">${student.enrollDate || 'N/A'}</span>
              </div>
              <div class="p-2 rounded border bg-light">
                <small class="text-muted d-block opacity-75">Blood Group</small>
                <span class="fw-bold text-danger">${student.bloodGroup || 'N/A'}</span>
              </div>
              <div class="p-2 rounded border bg-warning-subtle mt-2">
                <small class="text-warning-emphasis fw-bold d-block opacity-75">Teacher's Remarks</small>
                <span class="small italic text-dark">${student.remarks || 'No notes added yet.'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-8">
        <div class="row g-3 mb-4">
          <div class="col-sm-4">
            <div class="p-3 bg-primary-subtle rounded text-center border border-primary-subtle">
              <small class="text-primary fw-bold">Total Fee</small>
              <h4 class="m-0 fw-bold text-primary">৳${formatNumber(student.totalPayment)}</h4>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="p-3 bg-success-subtle rounded text-center border border-success-subtle">
              <small class="text-success fw-bold">Paid</small>
              <h4 class="m-0 fw-bold text-success">৳${formatNumber(student.paid)}</h4>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="p-3 bg-danger-subtle rounded text-center border border-danger-subtle">
              <small class="text-danger fw-bold">Due</small>
              <h4 class="m-0 fw-bold text-danger">৳${formatNumber(student.due)}</h4>
            </div>
          </div>
        </div>
        
        <h6 class="fw-bold mb-3 d-flex align-items-center">
          <span class="me-2">💰</span> Payment History
        </h6>
        <div class="table-responsive rounded border mb-4">
          <table class="table table-sm table-hover mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-3">Date</th>
                <th>Category</th>
                <th>Method</th>
                <th class="text-end pe-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${payments.length > 0 ? payments.map(p => `
                <tr>
                  <td class="ps-3">${p.date}</td>
                  <td>${p.category}</td>
                  <td>${p.method || 'Cash'}</td>
                  <td class="text-end pe-3 fw-bold text-success">৳${formatNumber(p.amount)}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" class="text-center text-muted p-4">No specific payment records found for this student.</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- Exam History -->
        <h6 class="fw-bold mb-3 d-flex align-items-center">
          <span class="me-2">↑</span> Exam History
        </h6>
        <div class="table-responsive rounded border">
          <table class="table table-sm table-hover mb-0">
            <thead class="bg-light">
              <tr>
                <th class="ps-3">Date</th>
                <th>Subject</th>
                <th>Fee</th>
                <th class="text-end pe-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
      const exams = (JSON.parse(localStorage.getItem('examRegistrations')) || [])
        .filter(ex => ex.studentName === student.name)
        .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate));
      return exams.length > 0 ? exams.map(ex => `
                  <tr>
                    <td class="ps-3">${ex.registrationDate}</td>
                    <td>${ex.subjectName}</td>
                    <td>৳${formatNumber(ex.examFee)}</td>
                    <td class="text-end pe-3">
                      ${ex.grade ? `<span class="badge bg-success">${ex.grade}</span>` : ''}
                    </td>
                  </tr>
                `).join('') : '<tr><td colspan="4" class="text-center text-muted p-4">No exam records found for this student.</td></tr>';
    })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  console.log('🎉 Opening modal...');
  modal.show();
  currentStudentForProfile = student;
  console.log('✅ Student profile opened successfully');
}

// ===================================
// NEW FEATURES: ATTENDANCE, CERTIFICATE, BREAKDOWN
// ===================================

function ensureStudentIds() {
  globalData.students.forEach((s, index) => {
    // If ID is missing OR doesn't contain the batch number correctly, regenerate it
    // (This ensures existing students are synced with their batch numbers)
    const batchNum = s.batch ? s.batch.toString().replace(/[^0-9]/g, '') : '';
    const needsUpdate = !s.studentId || (batchNum && !s.studentId.includes(batchNum));

    if (needsUpdate) {
      // For migration, we use a simple serial based on position in the filtered list
      const batchStudentsSoFar = globalData.students.slice(0, index).filter(prev => {
        const pBatch = prev.batch ? prev.batch.toString().replace(/[^0-9]/g, '') : '';
        return pBatch === batchNum;
      });
      const serial = batchStudentsSoFar.length + 1;
      s.studentId = `WF-${batchNum}${serial.toString().padStart(3, '0')}`;
    }
  });
  saveToStorage();
}

function generateStudentId(batchName) {
  const batchNum = batchName ? batchName.toString().replace(/[^0-9]/g, '') : '00';
  const batchStudents = globalData.students.filter(s => {
    const sBatch = s.batch ? s.batch.toString().replace(/[^0-9]/g, '') : '00';
    return sBatch === batchNum;
  });
  const serial = batchStudents.length + 1;
  return `WF-${batchNum}${serial.toString().padStart(3, '0')}`;
}

function openAttendanceModal() {
  const modal = new bootstrap.Modal(document.getElementById('attendanceModal'));
  const batchSelect = document.getElementById('attendanceBatchSelect');
  const dateInput = document.getElementById('attendanceDate');

  const batches = [...new Set(globalData.students.map(s => s.batch))].filter(b => b);
  batchSelect.innerHTML = '<option value="">Select a batch...</option>' +
    batches.map(b => `<option value="${b}">${b}</option>`).join('');

  dateInput.value = new Date().toISOString().split('T')[0];
  document.getElementById('attendanceListContainer').classList.add('d-none');
  modal.show();
}

function loadAttendanceList() {
  const batch = document.getElementById('attendanceBatchSelect').value;
  const date = document.getElementById('attendanceDate').value;
  if (!batch || !date) return;

  const container = document.getElementById('attendanceListContainer');
  const tbody = document.getElementById('attendanceTableBody');
  container.classList.remove('d-none');

  const batchStudents = globalData.students.filter(s => s.batch === batch);
  const attendanceKey = `${batch}_${date}`;
  const savedAttendance = globalData.attendance?.[attendanceKey] || {};

  tbody.innerHTML = batchStudents.map(s => `
    <tr>
      <td>${s.studentId || '-'}</td>
      <td class="fw-bold">${s.name}</td>
      <td class="text-center">
        <label class="btn btn-sm btn-outline-success mx-1">
          <input type="radio" name="att_${s.studentId}" value="Present" ${savedAttendance[s.studentId] !== 'Absent' ? 'checked' : ''}> P
        </label>
        <label class="btn btn-sm btn-outline-danger mx-1">
          <input type="radio" name="att_${s.studentId}" value="Absent" ${savedAttendance[s.studentId] === 'Absent' ? 'checked' : ''}> A
        </label>
      </td>
    </tr>
  `).join('');
}

function saveAttendance() {
  const batch = document.getElementById('attendanceBatchSelect').value;
  const date = document.getElementById('attendanceDate').value;
  if (!batch || !date) return;

  if (!globalData.attendance) globalData.attendance = {};
  const attendanceKey = `${batch}_${date}`;
  const currentAttendance = {};

  const batchStudents = globalData.students.filter(s => s.batch === batch);
  batchStudents.forEach(s => {
    const status = document.querySelector(`input[name="att_${s.studentId}"]:checked`)?.value;
    currentAttendance[s.studentId] = status;
  });

  globalData.attendance[attendanceKey] = currentAttendance;
  saveToStorage();
  bootstrap.Modal.getInstance(document.getElementById('attendanceModal')).hide();
  showSuccessToast(`Attendance saved for ${batch} on ${date}`);
}

// ===================================
// CERTIFICATE DESIGN SELECTOR
// ===================================

function selectCertDesign(designId) {
  // Save to globalData
  if (!globalData.settings) globalData.settings = {};
  globalData.settings.certDesign = designId;
  saveToStorage();

  // Update UI — highlight selected card
  ['navy', 'cosmos'].forEach(id => {
    const card = document.getElementById('designCard_' + id);
    const check = document.getElementById('designCheck_' + id);
    if (card && check) {
      if (id === designId) {
        card.style.border = id === 'navy'
          ? '3px solid #00e5ff'
          : '3px solid #8a2be2';
        card.style.boxShadow = id === 'navy'
          ? '0 0 20px rgba(0,229,255,0.3)'
          : '0 0 20px rgba(138,43,226,0.3)';
        check.style.display = 'block';
      } else {
        card.style.border = '3px solid transparent';
        card.style.boxShadow = 'none';
        check.style.display = 'none';
      }
    }
  });

  showSuccessToast('✅ Certificate design updated!');
}

// Restore selected design highlight when settings modal opens
function restoreCertDesignUI() {
  const savedDesign = globalData.settings?.certDesign || 'navy';
  selectCertDesign(savedDesign);
}

// ===================================
// CERTIFICATE HTML BUILDERS
// ===================================

function buildCertHtml_Navy(s, _a, _b, _c, _d, academyName) {
  const _logoText  = "data:image/png;base64,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";
  const _logoSeal  = "data:image/png;base64,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";
  const _signF     = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABgAAAAQACAYAAAAncZJCAAEAAElEQVR4nOz9a6xtW1rXCz999DEva+112at27dp1kwJJpXyhJDEEgzEhhJCYcIKJfvETrx8gRg3i7bwULxA9CIgEj8ABxRzMMef9oOa8Hwo1UWNiDLfgBUF4hQiFcHZRu3bV3rX2XrXuc47RR38/zPX0+YxntFvvrbfeWu/j/8tamXOO0a+tPe323Fr1xhtvEhFRVVV7//mzpmlI0rbt3t+r1Ypc6OM1u93O+b3rWr5rhxxT1zUR0d47y9/18/F3Y+G7nul7+U6+MgkpI9f9fM8nr2971qqqaLVadd+3bUu73e7gPfhvWQcsX/rafGysfK3Xa+f3PuRzmZ7Fd//VahVcZ33rku/vqlNf++1T/0POj72+7/vtdht1/1hCylf3u0TX7YH7X/5bthH5c+j99bOEfNYHb/1FXZ2IPNcfY3wKLeshVD3qx4TsX4b0D33kw0SK/sHUX+kxZLfbUdM0VL/oP7kcTG3I9UyxdRp7fqx8xpa/D93f6Pum7j9jiS2/EtDyqscKPkbLewnvFit/udtn6fKT+/4+xno+XQ+u/ke2hdj+NVZ+Y4kdn0uX39zkrl8fofVjWj/InzZyv39q+Svl/W39F7gmpi7keMDrhKqqvOv/sebHcyFWH9j3emPqd0x6sth25NP/ecsrUv/SevSDvvk8r3tlWaxWq64NSP2Rvh4R0fry8vLgBn0MAD7GXAD4FvNDMCmd+xgAUk/Q2EBhO95XP30bSF8DgE+Bo8tHKzylopONArITv7y8tD5DSN37nt83QPS5/ljyOaYBQNK3bkOPiSHWQJB7Ajm2Ak5eT/a/us2EXlv3D7b7yevKz30GrOgFZmz9JTYAcf/kMm7GXh+4kfKu24eW27kx52cHAAAAQDlgTgGOEZsRDAyn5DIcQ/cTq/9rPPoRr4NmDwOCqy607lrriGzn7pk/TAebvOj6CEWsAIUWwFBMygWTAUAXbKiCLPT+Nmye7/pv2+d9GolJCdjXQKFhpT6X02q1orquab1ed97v/N1ut+s8brk+bAq4UFlI7YEW0zaGXKfv9V0GKpuHrCS1An4M+XKR24MqpL60p5qcyDRNs+f5LPud0Gu7sHnS6f4u9vqOA9zfe/Cd7ZOPGPkdwwCZ8vmmIPUE0eYBYvKC1ueVPHll4KEJ5swc2hgAACyVGAc5AOYM64Z0ZORc5v+lU9L6xKSPjL2/z0EyNX3W/6a6MMk+Hyt1q7Zrrl0KdlZMuZSTqVMAyfsPse55LTBK8aZ/t30/Fn0UrCZFuM0z1fR732cJeV+Th7/pWWzX4vNZ0cuKTT7PpPzs4wE9tYK7ZAOAqX5jFZCx7d+H7/qpDXBTnM/1oNNdVVW1ZwDhdtFnchMqv7qdDjEgDiH1JC23AjW1ASm1Ac7HlPKhjcHy59wjAWws8Z0AAAAAEIfNgQfzBnAs2LJKjGEEQDvKyxCn5D6kTsHqXR9HvIt0HNWZHEzyL3U7/Pta5hAy/dQFpAsktQIuNgXR0Aoy3cekgE9NXw/z2GgNn8FBI1OUaGSnrD25OeUPf17XNa1Wqy63M3+vowH0e/nkz+dBPqaHs+nYIQr2sZT/pvuPLb+pU8T4LLTZO/ARMPW9fN/T09MuMqZpml5e0EMYYgR0kdyDYCIFu8nCnqL8wT6y3zdN6G3jgi1ybGxS9y+lL0ByG7imjEAxgfYPAAAgF7Y1aA59BQBTYvN8RgTAOJTQf9icEseo3+gIgkgH2jpwD06X87dW/vPxIVh3QJCKV8b0EKk9CH0Lfh+xClwfqVOM8PVtwu9T+A8RcFMkhA+fbMjvZPoS9nxmT3+dFsh0fdt1TcR6uId+b2orQ65vm7TZru/D14ZTd/CpFexzT6HCsMyz/HcW2vV6T/Ev5Srk3UL6P5fSf0wDmeUA9/cekj+f47wpJiClT2KnUJDajMAAgLzAQAIAAHno40AGwNKQGSIkaAPjUNL61BQNkFp/lNvBiGj/PUN0NSZHUts5a9OF5UOZUvBMWem+FEVjXb/vQsZWIX0JVZD6rGC2z/s83xDvX5+ASS9++Vzye0aGs8iIAH1Neb3YFDG+80PLb6iV0qWct4Xv9Hku271cn/X5fsg9xzw/NgLJx9QevjbvBTaO6euO0QeO0XfkIvUExXV+6ODtIrcBK7UBPxYeA7jPl7LZti1VlgXAXEgpn0TzaMMAAAAAGAcoQMExIPV3pnUz5sdxlNaPjO0EFnut1A7gEpPHv1wXa/mXhgPbfdY+BYQvBU9qC4xNQd/HA9qFz3oYqngfSqgCy/b+voiMvgrSvkYA0/EmA5JJMLVhgBXgHBFARPT06VPjffg8X4qf1Ark2AiSPoNWjKyZrKch14xVsI4VYTH0ex+xHuQ+Qp5fW2ylTEgDGHs76Dbjos8AZerjUpdvLL6ni5XfFG1x7zqe7zFBNU/6TGOK6ZjSy690AwwAAAAA5sUc5j8AxGByLp1SQbz09pX7/VNHfUfrr2MNCAH6Cd2Pm36X62F5vE8/XP3e770+/OkNF9QMUcCkaMCpPPhN2CrLRGoFWawHvI8xPKCl0l96OldVRdvtltq27fKgy+OrqvLmiPcZSlIrmH345N+mqPdFGvSNXBj6fSxTRdDYyK2AM8mh/P3k5KT7jNuB3CODDWD6OvxTtv/QCJA+7xTd/wffyXL9yPN9+MYPH6nfP5YpJ7CxssbHy/+1SBnHP4nCDeSpDZi5mXv/3Zex51Ol1K92qtDePa7IsbHuayJ3+eS+f26WMv8JOU57vvE6wCX/iLByM/fnz80UHrI68lGuleU83+YF6rt2yZT+/LEOZKH6EXmsSdE39P4+ppo/huo39Pxfrot1Owkht/xMzbGtf/rol0Nk4aD8ehxvKivfHgDcxk3/iYg2m43zfF/9WPcAAMug9AZKRHuKG5nygegw3IWRxwCwVGwLXzn5MR1/bBMbcHzYFJ6QfbBk4NkJAADHg2teg/kOODa0PgiAOeIzENgcQ0OyP4QAAwAogrZtu81OZQoguQcFEXWRAHwOBgHgovTJcagHh8/jzTY4lO4BDEAfQqKjAFgSfTz+AJAsvW9MHUEOQG5Y+W9SekLWywbjdRx6vq/bwFiKUDCMpUfIpUbO6W3GAJvMwwAAFoFc4Grl5Xp9JaKs+OTGwCFfvj0AAJgbUv53u91eSiyifaPYdrs1nj+VAQCAXPjC3bEwAEvBFyIPwLHiSgEEwFIwKUCJIP9g+Zii4IkOU1xLZSrmRmAOuObypowPMuVVrIzDAACS0ifHJ/9kAddhj3K/Akx0wBIICe01Gca0UUCfA8DSgLcnODZsKd4AAAAcB7aUJy7FP8YJsARshi8i9/wfcyUwN3Tqc63z1PtdwAAAnMyxA5QGgO122yk8peKTyL/BMQBzCFFzpTKRbUEeKzcD86UEmuLZbUBBC8ZAypHpd9tGaQDMHZ0CCAtbEMoc5j8x+IzCc38/AIjse+HZ5kWgDLA+isO08SmR2SkOTM/S5xdToWVc/tT6nTFlHgYAUAQ2627TNJ3Sv67rgwGhaZqpHxWA5OiBVe6PIeWfDQD8PWPbJBiAOWGTYZMyFPIOlgpSAAFgBylQwBLR8xutIOJjIPdgiYSkveLjNHCUAKVjSm2lP0vp4AkDAMiKrZNmQWcvf5nyRDYQGADA0jG1BRkBICMEtJEACwNwTEDmAQDgeEB/D44JWwQAAEvDZPSSKVC0IxDm/2Bu2HL/a2TGk7FkfW3aSE/+12lW9A1T5KAe02onU8akRIfimSz1Q8gdQhYb4uM731Y/epKz3W67DVFZwUlEdHZ2Rrvdjpqm6bygZcogW5qgUizDIY1fG0lMRhPb+3jrx3dv59nx5dhHek3pPVaOTjDk2WLl1/RtnxB0+fyV4XduH7aNvur1mqrdjqiqiIS879qWSJw/9Plj+09vHfToH4xesJ769/Zf7qezPn9XT77y8cmXJ42Zr/xie7E+7z8kB//e8w/JU9u2VIUcJ46RkTGuEHlTv3p4+3mHuKZ+/tIXW6XXX8jz6XHB9FNfk4+XG8b3uW8oqes/d/2UTmz5p57fx96fn8Hm/cwOELZ1bOo0obn7F9f4NYUHbG75SU3q8vWuL0Q/LtsAy7tLvkOeL3f5e9cngesDW4Scj9z6Ex+6fPqmN5vD+MlyLOc4Wt6JzBv+1nV9cC3TetrGHMpnTPrqa33jp6/9ldC/mHTW8vlszxrUvgKfw1bufEeZ3UQ+l3w22RfE6JflOWvbww1dHPctxNInELkXyLkbkI/U76dlUSuBtcFKTozGsJDllr/Ye4UosE3tvJSB0TaYuzrwMT1kQvsn2wDoK0fbABvy3jtW/NN1O+ABb6z6y93/2AZn399TeYKELuBSXd/H2OPXkElSn+vHwG3JNHmy3Tf1++Vm7s8P7M4lEpNDgFaKmq4H4sitYMh9/ynQ83+9UD520MbTkrt8l9CGU2FaP/VVks+FIQao3OND6P3lc/iMbq7r9m2XufvJ3PqlMfWvucvSRKiOmtuS1tuY9I2265rwKeqlQ7OWe72O1e/QR8dhcyBeuzws9QsMspD4PBgjv4+9f+z5UniG3Du3AaT08vU1YJ0T3bQQTvl8S2HschsLXwfqkv+QCdJY72nrYL3Xt/Sppp+y0ze9t7Z2T+EBN4UC2KWktd1/LgqCWA+ooREModjkeqzrpxj/5MTJNLEyXdc2wcvdD07Vfy2VJZSPa6Jv6gtDjdIl9I3JI8wyk/v5ct/fR+jz6Tm+SYaHrlHnTskOPEsgZfnmXp8uSU6GjGdzen/dv5n0HUOumRN+B5nGlsjuWa4/M5VJHzko4f1zMpaBSK8NS5hbErn77rZt9xwm9TuYfu/b/5t0QfJ+2vNf3sN0rT73dp3Lf3cGAJcixdUITef1scD6FgC5LWQhz6+tki6jiaZ0A0BqC3Kf8q2qai/9j5Yz+R1/lsNAkZK+9/M+/4BzcmBV2Km/9fGpFWim8tMGKuf5auJj+9038XMZDmLwydtqQlkxGqgtE8VQJVfs0/taY2r5m9oA0Pf6seOfr/3wwsHWbvRCImQi16ePTZ1iMLWCNHb8yu2A4CN2/pL7+eRzmDyhTccxnB5Ff1eSkrD0+b+P3GWY+v655V/Lh21cH3veMxZT1c9QA3aJBvySiC1fH0PKT9479/gVy9jy0dcAOBf5IwpzaHOdn4NQ+dR6Htt5JiVtTBnlLh8fuZ8vdP3hctLLiU+Jrz/zRQBIhkYByHvp5+PPdArbofoN0zmStfSgdlW2rYJN58hjp1AApKTPAsU0KSilIdjIbWDwoRuCFnyufym/Yyj+mdwdsCSFLPEVbQrl3Hg9dtXfTOhCMNYDmxxtnS3MngcQlzp8ZlNfKr/fWSZNoe8f3T9nMLDtGUM8BgDv/YOOsrPzlE/pBoAh9+/TD6U2IJuuJT3/bSmxxpq/pDYAxNYfDADzNwCYFiWmBYDpWX3ynRudw1czZf8xhNzPl9tBJxbf89d1fbAIlj9ZfnjxzAxZIKdgCgOAa3yDASCO2PL1ETr/tslzrAE1N7HyYauXUOYgf4xpfTl2+Y1NXyWp6/eQv0uvT03u/tE3/+o7fujnTa2f9eEyoBId6hdd58fUha2cTPta2O5rWgf0KV+jAYAXybyokAON9jgyTbBML5ZiUT/0+6nub7LmhJB7ApW7/Hz4vNi0TJrkOIbSJ1BjYHrHseQ3Fp8imzfRlf1TqPI79BjPBZzeQX2un0LZV3r79mEKBTXVte25UstndgVw5Pl976/HudwLjBCZNz2va6JlG9NLpHQFX26W8H567m3DJK8++Z47pddv7ufLfX8ffZ9PL9Z9BrDS338MXG0cxJOyfHOP33OXk9IV4GMSu750XTMXvv5b4urfh85tcr9/6ffv0376rg2nIHT+a5pjm+bSQ95JrzWlvkrrrvi40HVtrH5prQuoba935N7tdrRer/e+19giA8Yi1oI0hRC6LDSh59pIbQAooZG6YJmUXp0hjdpkIEjBVB340HbmlR/Psbkt1C4lXNu2RIZd3secpHs9dDzHej2IAwcVl8JSfy6/9/Wf0f1r1Nn9Jn2mcto1zcH3vQbF4CNtF4gz2kQbKH3fj2BUcvU9sW0s1APORp/FuelajUF+bNfPQekG7NLnD6UzVP5t46Lr+D73nQrf+OMdPxMbYH3kLsfc90+N7J8ZKfcyAlgzBwPumOSQhaWvPyU5ntWl0ByqkJoTvvfT48exl0fs8WMTOr8xORpJbE5fvk2g584U+pUxvy9tnmnTA2oPfO1YwPLmW//6sF2HfzelkJe6Ttvz83fREQD6odq2paZpaLfbHWzMYXoQ+QCmglr6BN1VQfKn73wbqRVI0SlQPMQ+Pxuj+Fq2PQBsv5e+CWofUsgyX9HlOeg8f0IDgNHIY6j3PnUSPQB6jvfKv0GBKa9hS2vVHeNRdpoW0JLY9hEr/b7y0RsbE6kyNgySUl68/WvfB9bnJx7fYp8/tQEgNgQ91kC1Xq+9kyTX89t+Z3zvl3p+k3r8jR2/ovuPzAaK3ArC0PFHL05YtqX8hRigcy/INLEGgNzklq/U98/9/BLtAFRVFW02m73v9HVzy88U/UtKA33fe099/hTkdIDg+Y1tLuvrP3OPb7EMGR/l36n1G6lxOUCFGDjnPj7FKqB95K7/3A6WsfgMcLn7H9/zyf7D1K/bDLCh9SLn6ib9FW8CzPfXRgD9mX62IesvWSfV7//+G7RarfYepGka2m631DSN8aaxD7AkUi+wffgEMbcBxscYBgKWydVq1f3na282m06m5aSA//sUpLGkrn9f+/PWf2oP5dQL0MgJRrT8RbY/Uw79XmUuZN9kNd5sNk5jZGz/PeUmwCZ8JeVVUCe+f+oFYmoDTOnjG9G1kZjnMZzXkidRPJ/hv215H4cYQVO/f+kKPB+5F6ChDHXgGPu+NuRiQM53iKjr+9kjyLSQKdUQUEr920jdf8fSp32Z3iWHfPdRoEp510p+ongD0tzXT3PpX+fC1P1i0zTdWlTOSfQ8RiuIwBVzN4DEOsjEXn8KBxOfg46ez9iUskNYentJXT59209vB8jE9TO2gUkj9Y9yri315lo/I6+bWv/oNTDzw+52uz3FKT+wXlDwRUO8KwGYGrlIJrqaSPEgKmWZZX7ulD7BWTq5y9/l6SYnVQAsFd0GbW3B11ZcfwMAAAAAjEUOoxwAudEOxVqfCGPXNKCviUMr9bXjkCsysQT5XktFqLTGce5/9pzmlEB8HAAlIBWcMmUVG7A4skVb5yDDYAm4wsOIrgxg0sgrMXnUATB3TOGWNg9SLMABAHMFfRUA88c0T7GtUftE0ABQGiYlqUTqaCDfoGRMsivlWjtg6miu3PK9lg/DoWg6ZEEqjrSxAOTl2OtAhsYzUqa1AYANWaU0wLmD8suLNgBomWYDQNM0e315KRFckB8QgzZ8uVK56P0koPwHAKSklBRSwAz6e5AT7ZRgclJACqDjJXcKnzHlzZSOTqb90d7R0M+A0rGtO6UeXfff0hkzdwrZNdGhV7QOX9BWDBgBQInoAcS0gTBjSm0F5gf6nytYlk2p3HSeOsg9WCJatmWOUUmfFEBoKyAluXOkAgDmC+a/88bmhIB6BUvANte2yTeyjIA5I/UsJhnXhq7crOUfOk2EK5yhhIcHwOTRyXJcVVXn+czfaxmeuxxjopiX3OVvUlSavKD7pEDpxczbD5g3Mm0h/83RjNIAYGonNtnP3aYBACAEGJAAmC8ygt00Rze1X6QAAnNFyrctLTPGrOnA/GEcTHItMTnZl9B3r4n2ByGd7kemUJG/8+7FEJC8lCBEJcLyvN1u91JbSSMAp0YBw8EAkhfp9WyaQOnFBUcElFIv6L/AGJhSwREdGghCrgMAAGOAFEBlg/4e5MQUtehLawuOhyWlANL31WtXUxYSAEpGG271WlOmG89huPWmANIDkEydIpWlUoHE32EwArkxDRgmRahunCzHMACAuWPqw/Xn2kKNHItgKdg8LkzHYN4CAAAAgFIxOfYAsDRg1AJzRutXQvZvsUWk56D6v//vTzsPYO/puq73wurZSPD8+XP3DXwKpnbl/j411c5/yNhpM0akojryAv73nzPSkKUjAYiImqYxbgzMx8mImCQMkKU+nUZuWY29v80jYCxPAd/ZXg+JyPN9948dIM7Ozg5CLffk3fCMcuGh93/RpH5+H7n7v2j5jjrbX/7e86NTQEWO3yOPP/p91uv13ucs/9zv13Wk/IzE0DmGr31F94+ZI7xi7597/EsNy6/Nm67P++dYjOSWz9TysXT58xErU3o+rr2jcy+gl07u9jN3fOXHe3bJTSMl2+025eNlH99zk3v+4qP08mdHSiJ76llGpxQnouQOmKWXXyxzf7/czx/SPkPSK8vsOFK/4rrWFPjut3Z+S3SwJ4CciFVVRScnJ50ntYwcKCXH0RjohRQ8Z+eDSfmpo1pcljsA5ozeAJjIHH4p5Z+/Qx8H5o5LjiHfAABQLktaR84RlH1a9LxbgvUnmAshsmrK0gBAydiU/1qXwt/PTW8YZADQYQzSCHB6erpnxWuaJkuuo9SYjABEy3m/pcNGKlb+SyMA/y53oJeyDsBcYQOANtxqI4AG/RpYCqaxGvINAADzwuWNB8DcgXyDOeFbP9rSnkC2wZzQOm3Wp5i+n5N8ew0ARPv7AkjFqPzPofb6+FJC7McAXrHzhRukjGgxbQxs27QDgDnCRi/p1b+3n4slxVUpOeoAiME0ZvuMXwAAAAAAKXFFoAMwB1xGAHZAM50DfRqYG1L5zzpDU57/ueA1AOiXZA9/VvLLHKQnJye0Wq26Y2x5kCSlN3/tPQjP/3mhU53wTy2/RLTn7R8iuwCUjpR1kwe09sowpQICYK7YohGRWmIZoA4BWC4mBenQPS4AmJoQ+UT6WTBXTHLqm1uj/wZzQ6f8sfXZOuKl9H48yABgUpxy4+Wc6rwJAitUk2+eOjFIATR/pLJTKkS1VzQfg/Q/YAno/S/2UgDRYfgavP/BUpDjtJbtOUzQAAAAgBwc+yaxqXHtl4iyBXPBFWkrj5E/ASgdnTXB5ozAv88NrwFAv5RWDum86qxEXa/X1LZt8l3spwQWy3nimmCZlKL8HTwxwNyRlmiTvLOBV+7jAuMmWAq2MRtGLgAAKBtEJIIlY5tjw0MazAFvhg+LslR/B0DJ6Lz/OsPNXPvqXgYAlxKVFUhcSEs0AIB5Y9qEhn/KTYG5sSMNEJg7Ng+MzuAljsMGZGCJYDENAADLAX06WArI/w+WgC0KYM450gHQ3v8h8jyXeUnQJsCM6WVZcdo0zV46IP5/fn5OTdN0/+UGwlVVUbvbz0XN95mqo+hjwRxyvo/cghL7/qXjU2rKTX+lXPLvu92u+y8XHXyc9JxmbGVm/HyAfI1ZJ6XXf6+ynCGp+w/28DftA0BEtFMyHRvOZosYS8aRzydLbwfe5wvs/2xy1ef9Tc4MOhJALmLG8DgdWj+h942t/9TzG58DSenyG0vq99Pyyp8NocS6SC3fqc8Hbnzla4ve9eWZXgpzf0ekEDrElE6itPnHWOf7SF3/JgcoiUzza/o+9/q49PYTkiKF8dXFEkldfzJltem6sfI5ZftMge/5fQr8k5OTvb+l57/r2mMZBlKXfy8DQAhS2UR0HTrBv/PnXQG2q6yhnXOfYIE4TGl/dNixabEBazaYA9pSLf/e7XZEwqptOhf9IzgmIO8AAAAAGJtjMVyB4yBElm1OjNCfgBKRffTSjVajGAC0l560kNR1vedVLT2qd7sdXSehAGB6tAcGG6h0nnT5nVSiYjIHSkYbAGQIG/8tf/I5AJQAy6tcMPTx/ncdI0M6TQsStAMwF8b2HAUAABCHrS92zbfRd4M5YYtm0b+bzgOgBOTa0pfyZ0n9c5IIAE41wT+lEnW1Wu2nTWn3B8ixwpkBCEF7/8vfpSxKIwAMAGAu2BYX3DfXIgQWfS4oEamkl5/1Pd90LmQezBlbqDfmJQAAkB9XGtNQZSkAJWKLaIEsgzmg15YmnR8RHRgAljK/Ht0AQLSvTN1ut3vK/5VSOO2aw/OWUrigfOQkTBsAeE8LRv6ODYLBXLCl92nbliphpOV+lyO1AJg7vggAPd9Anw4AAOOAtRwA19jag2kNCvKD/suNK4LcF/liOwaAKZHrQFM0i8n7fyl66mgDgK0B8+e88S/DqVU4NdC23R0ULDNFKHPpm6yAtNiUo+whrTsGuemKNAgAUCquPs6WVgWe0aAEfCmA+sinnofIa0HOwRzxRQBArgEAIA+mOYpro1TT3wCUisugtRQlKVg+MuU3kTmdvWYJ8j1qBIAsPL1rMqMVqnVdd8fA6xRMjSk1hGzwHLViswxCZsEcsC04OMpF9stE1H22l64NgAzEpAByGQlM8xX+G4A5gT0AAACgPEzzF/5c60YAmBN63tzHUxrzFFAC7NirZXm323X6j6U6Ro7mwmxbnMsCa5qGmqbZS5+iLS8A5MLkmaENUzISADILSkfKtC1cUxvBtLELAAAAAAAA0I8hc+mlKJnAcdInFRAAOTE5+LLuT+pITDqUOdMrAsC12YdtsFqv1weFSSRSAa1X1LYV7XYVrRrqjtvtGmpbolW9Mt5nqgpIfZ/Y61eVe5LgCy/MLci5UzCZ7q896dh4xdbs1WpF6/VV07ncbITM7rrUQCYDgfFNMk/yfOWfXP7bSBtkFRaBYc09WNXO83y1U5Hn/onr19c+bJ7NnYy/+N/udtQS0U70r1VV0Ynov/VAaCrTvvISWzqx0pl7ibWK7v/jzo/tX6uVb/xxt4/KU4O+FIO+92fjrT6OU7zpjZ40udO89WnfQ873ET8/CRtfbPOS2PfPTer2qRcuY5dHbvlJTenPVzpj9E8svzrylvtn7VUqr5u6f4R8uEk9PsSSWz52Yo8tPdew7SNXkpJpivFrKlz6qzGvOSa5jUC6n5Wyqftt3/pQXifle5nGibnSJ9J5yHm51xepkfMHxuTkKOVS6jpYz8ffTS1bfcu/r343OgVQyAOaHpIX5jIXr8yvLsODpug0ADChU/7w7/ydVhDlMlQBEItpkic/M6VKgXwDFyXLh2mypOceAAAAzJTcvwMAwJJJbcAyOo0hOhzMBJuB1ebAOPd1X9+166h7AJiweW1wKiBZGdprWlrITUYEdEL9gXKjH1oeZb50IjLmDkP5gjkh+1jTfhdQjIJUlOBFoY+FjAMAQHp8Ebg57g/A2NgicQGYE1pxCn0HmAsuA5Zp34o5zA1MkZB91rDZDADai7qu6wPlE2/CgA5mOLECcuzo0GSdUoINAvyZDB+CkQqUjpZvU6icSY7Rf4A5IOVWjoW20GZJCTKO8aNsUD8AxFFSyhMAxsSVCqWE+QUALqQyVMsy6zv4OMhzfzDmTYNNfqXeY87yq3W6oXKV3ADA2Cwum82G6rru8i11ewO8MAhwlIApDyQUrOGEKDyAH5bBLoe0WLxwOiC5aTAAc0Lnc9RRADJ9GwBzwWbA0jK+NJb4TgCAZTF0AQsAAMBMbD/ax2vadO6clapgGdhk2CS7Jp3HXLA5e7uYZA8A17mcDojRkQBsHJCKpzlVSmnMTahLRBoASHUuMAKAuSG9/LWi3zTxk8dgoQ5c+OQjVn5ic5zyNbQRAGMkAAC4SZGDuqQUQBgHQAy+CADMn0EMKfpf0zFSjk2OuPInZBqUgi2dMZF9X09mDmN/8SmAbBM83Zlw6pTdbtcZATg1kFT+wwjQD6QAisM2qHVe0nTt/W8yAqCcwRzQCxXuZ09OTvaOgzyDJeCKAChJxrGYKhsoEAGIY8kRWAAQzU+xBADRvgLVlTIFMj0MzB/Twro4m/x2jrxk7qPnMicpPgUQkXmxzQ++2+26/5wOiIj2IgBMlTiXCsqNSUDQufixyVgng2ojax1uhDIGcyA07M3m0QTAXAjpk9F3AwBAHjDHAACAvNj0dUTXuhHMk0GpuJwLpBHL9v2c5iFD2mK0AcDlQacL0GUFZ0sNf7fZbIiI6Pz8vEsFJKMB2FAg0we5sOUAnpIcwhSSgslF6hQNqe/vY+j1+bzdi+fnzaplFADvYaGNW/xdVVVe+Z1TB1QitvLr+qpE12dS9zN97u861tZnN01jNW7J82whoqXLb6n9y1SU/nw+hjy/jnSRUVtjXH9O5B5/ffdJnUIqltz9u3wOU6izLxVhKfVvIzYvfO7nnzux5cf9qpYzl/eoKRJRe5wupV5Tr69iyf18sfNr27geen6f99dzXtZb8Hd6XrxarQ7kWj9TbPnnbie510c+QucXufqf1PVvkln5U8qolmHpXZ2Kqcf8EHnsIwep6y91qunY94tt3773k/MLOQfWjoqse9Npf7TeWTKmXKe6dmz5ThoBMITtdtspTFlpSuTegMSkoAIgNSalp6lDMk36ACgRm5z6+tfcCw8AYjkGGT6GdwQAAACmos+4iuh8kBMtq5gTglIIkUWb3g34Kd4AsNlsqK5rWq/XndXcpVTVQoCBFKREW8jZ61/vCSBlU1siASgVk4xKmeYIFlMkmO18AErDFO6JSSQAAJQL+mhQEiYllG0O7FL6Q67BFPiUpjpnOtZzoCRczt9wAvdTvAFAh4DI8CNZwZxiRR6Digep0Up9Vv7rMDm5MTAfL88HoER0ihSdBkimsHKlgwOgdOCFBwAAABwHY6awMKXIlNcJSTeEOQfIgcl5C/JYPtAfuTNuaH2b7bxjpXgDAFcS51hfrVZU13X3kytZVrjMferLAQjAmNgMAVKJ6uqUACgNW/5LGQkgj8PACuaGySDL0VwAgDLBWAMAKAVTZgKJnkfr4+A4A6bGNIbqKO6h3v+l7wEB5o3J6BqSJh5cUbwBoK7rvQ1/5UDJyiadFkhuuApASkwyxp9J5ZFMB6S/A6B0bAsXNgBIeUZ0C5g7xyK7WKABAOYK+i9QKqyjcKUAkkork5MN5BekxJQCyKT8ByAHIZsQmyKuiMyyC1nep3gDAJE5zQpvDlzXNRGRcW8AKFnBFJi8N0w7jcu0VfwdZBTMBV6w6KgWjsDCYAvmiEmuj8UAAAAAABwjKQxIUgeho2N952HODHJiSwFkS6ECec1L6nVK6fWrUxMTmSNWSn+PXMzKACAVrE3TUNM0e4OtNAIwULCClPg2eGIlPxuqEAUA5oxpo3VbyDOUqGAuYBNgAAAAAABwTITOfZHiFZSEbc9BbFodxjrEKh36vWlH5jHQVkhZ6RwJQHRlDZJGgLZt6fLycu86pjAn2/3GfIcprz8mtnQepk2OQs6zXT8Xu0T35/dm72ii62iAqqqorutuLwtOWcVpq6QcpzYSVK17j4yKPPVXxT2f73x/+3B/76/fxvmt7/47cXnjsZbQtNDre+lxvqkkvKX7oh9lOdQ59+r1+uoZqopWL9K1yfv5St8nf14i5Se29a8m8sCw9bcmg4z8PXf/OhdsZVjXdSf/Mq2gK/R0TsTKR+nje+nEyo+pjZv2sZD7s/TpF3LLd+77L50x5M+FTc7knFj3pabUKUP72lzvN9b9fSz9+WKvPxUmRxgd4W1LUwGGM6UHtOlepc9/XM/P/axM58rn2BSoLn3fEEppv0zI85T2zClJPX6G6LekLJp0Z0S0lx6+j37FJ8Njtd9SZWYWEQAuTALEXtZt29LJycne4l0v4HN30GDZmCaEMmxJ/5fHApAbnyHPZJTFxjvTEWrIBuHolECaUidzAAAAAJgOmwELgFKwOXBK2dUpUyDDoBRsejL5E/RnEQYAU851+Z/TBfHxAEyFTkclre0ydZW0xGuLJwAlIQdclmkp19LgCvlNiy8SC+Xvpk+osy1KAAAAAAAAgFLwRS2YIquQPgWUhM7z73KU1d7/kGE3szcASGGQYSBE1ymBZP51PmYpHdwS3uEYMFnXTeF3bKAKTaEEQA46g+sLA4Dc4FqH94N0uCY5KP9wbF7/Wqb5WAAAAAAMp/T5SWhKENM8Yar7AxCKlied9kf+jnkuSE2f/tWVBhfyOozZGwB0ByYVqLvdjtbrq1fknFEcEbDdbvfSsZRK7hyOIB49uMrPXZsDo0MDuTEpkffyz4v+15bSCoA5oGXdFwUAAAAAgOPEp/wvPUc8OA5C57HQPYCScKXIRgqgeBZhANACoNP8cBSA9FJFKiAwBabOiY1TevJoMgIAkBup3Oe/dQSAluWpNrE+dlyTHyir+xO6aSUmnQAAAMDxksrzH4AxCDFKQaEK5oJtg2qkvh3G7A0AjFyUy99ZASWVq1VV0Xq9pt1uR9vtNs8Dg6PAZgDQqar4p/ZAxWAMSsW2F4Dc1wIGgLRg4pMG6f3P8wnT5lMobwAAAKA/pXvIh6aoyHl/F7nLD5SFa88rqW/Qc10AUuDr3/QemkTujBoh1wTXzN4AoDd9MP0uFVFSQbVarWZvAIjtoNFYpkMapuTP3W5nTQWEARiUiG8ARgqgaXApoeGpPgyTlz/KEgAAAACM1jlgjgDmBJwMQcmYnK5cugfQj+INACZP6T7nyUgAqfhnb+uzszPa7XbUNM2ewpUVWDaLaKjA+UKw5qLANz2na8KTQ/k3qCwTP6ct956WJ96c2mSg0htcV1VFdV13m1r3uf/cyL0Hhs2qHHNfk1U75NjYe4ViM6qa+mL+hPtOnbPv5ORkr3/la7J877ZpB26f/PjuHuuhlqr+XJ48fe6Zu39IPXELnTO4ypO/l3OCnJEtY84fYimlf57iXinoW3+2/Vj4d57n8rHaEGuLagFpKKmtDiF2/mM6LnTNMIfySt1+cs8/UlP6+lcrSG3OLXpOENM++j5fSvo+X8jz9Bmzc/cBqddfqd5Pz1v1s0i9g6T0/gLMC1PaYBNyLir1s1Ina1L+2+RV6hrkPcA+xRsAxkILkUxZIZUELHCwjB6CBWNaTJ2azWAA2QRzQhtUiSDDoHww5gEAAADHic1YinkBKBXIJpgTPj0XdAVpOBoDANG1lb5t207pv15fFYHcH0BGA5TekU7lAWLKe4xGGY+2kEorKBundrtd95ORnn4AlIApZYqOCJDHtm1LFYVHdQHQl1TjI/peAAAYB3jqgZLBeA/miMn7H4ApCfH8t+kHTOdjfjAeR2EA0F6nOrWPVLrq80xCqMOol84xvGMuWIZMciaNAIw0YklDFgAlYUqdIo1Y3ffZnhCAMHzhpgAAAPpjSqdCdOgQA0AJ2FIAAVACIXIJr2owFTZZc6XGlhlY4GyclqMwADAmL/btdruXc4p/siBy7nWfAJdKioYDhUgaTGmqZGQKK1DRKYJSMRlKdWTLnhEAXQgoGJcS6lgcAAAAAIBjwzSHLYnSc+iD6XClDtZALkApmByq4f0/DYs3ALgEidP9sMKVN1aVXtfSGlXivgBTpwCS1yx1UjQnTDIlN5TSAznLZc5NKAHwwTKtN6Xkn6X1o2CZpBgfYYAFAIB4EAEA5oBJDjGPBaVhMgLYgOyC1JhkTOoBTKn/EKEyHYs3ANjQudelx7UUzLquabfbGRWuxzIBOIZ3zIWpbKVRQCtQZYcJIwDIjakP1GnW+DhpxEKfAuYAot0AACAt2AMAzAGk/wEl4tug+lh0VWAeaF2AycEaMpueo08gbtp4Qv6X6YHANWiY4yA7PS2LbHgy5VPHRBSUhs+YJWUWsgvmDmQYAAAAOC4w9oNS0Q6DWlZLzGQBjhMpnybPf8hqWpJHAMSGIY0VxmTbYZotUE3TdMetViuq6/pgE1bOX+3apEIrc2OF1/f+tvBZ0+9Drq+PMQ0mKfFdP/ruieunb/lrBel2u+1kUBqj6rqmuq5pu91297EpYN0P4I4i2BlSP0nqan+DYv273sD44PncT+fHV76Rl7fWL7f3oecHfu/F1z489UeR96/kdS19UVVVtHrxn1783PF/lepKPvMUKQC8V/fJV4GbcPvKr0+Y8NjPpP9OXr+x8v3ifI4OlHuymPZjkWWeyoNlThPi1CkKS1fETPH+poWTdFrRXlZj3bsETP1ISd7kU6XoTIUvh3RMCjWi/fmh757HyFTrY2CGx3ib45UtCru0ctfPk6qN9dUnLLV/ZHxr8tj302O+7Zom/ZRtfVCa7IKysfUtpvWP7kP1vFQfb5ofuO6tn8F3Xt/2N1U/OpS+z1ee9qIAXN7XcmGFnFUgNabOUqJTVpkW+jlAhAKQmGQS8gHmREi/CpkGAAAAlkkpaywAiMxrbcxVwVTYnIJNKYARjVIWR7sHAGPzlrelXrFZq2x5sAGIQRub2ONERqewwUpbXKeQQVPnDbkHEpv3KXtR62PlMQDkxpaiTfbNJm8XTGwBSAvGCABAKpBuFcwNm14K81EwNrYoZ14TyShUebw3s0di3RX68yuSGwDm1unI1D4srDolkA6jmts7gvlg8v6XMsppqbSRio+bygCADtUM+oZreeU0KkSHqa5QTqB0XFEskF8AygBzEgDAGJSaWgwAorAxDkYAkBqbA5QtdZpeS7mMCLFA5u0cfQQAkXvzSjYAtG1L6/W6U7oSXQl90zR7hoCpPbDBsjHl+JUKValIlQYByB4oBSnD2gjAfSsRBmpQHqaoP92vQjEAQB5c+2ygLQIAYtCOKkRIWwHKIjSP/zHKLNIgpcW2dtd6KX2OrQ8de98017VS7dE2J47eAGBLOSEFW6apkJuxymPlcccuVGA8bAO5Vv4TXW/2x6lVbBtUjQkGUODCpOCXSlTX/hYYoEFJyIkrIlgAKAO0QQBACmz5rfl3rH9ATkwGKgnGRJASmxLfZACQ6ye9ltKRVnqdNSbos6/JngKolMqwPQcr+tu2pe12u5cOiH+Xyn8YAcCYmAxUUlnKHtUsk/zZVJNTm9HM9P0xMpf+LxU2mbVNXLGoAiXi8nTRMouxH4C8IA0QACAFJkcAAEpBZwogwjgI0uDy/Jc/TYp/fY0UMgr5d3P0EQAaU3g/K/h1h9q2bWcAkJasKXOwg+NBe7qZvFH5d9OmwFOCjhcQmQ0AJqUp5AQAAAAAAJQADPtgCUAXBVJg0vNofZTWVyGKqhyq3/u9150HyFQ3xgtYNn8w/W47PyWx1/c9/8nJSZfLWhoLmqbpogHkM0jvbFN+rKHPb6uD2Ov73t8nH8knTZHPHysfseXnQ0agyJ82S6v+2TSNMQUL/6zr2nl/r/z0eBfLDaJOX0WWf7R8JpY/b/vypHkaq39JdX2Wv6Ep1PqWr81jIfR80/1jcsKPUf6u8dfXvmOfb4rx3RQqyp/52oePvvWv/9YprvpGA6Qu/9Tj85DnG7N9pB5/c9/fh08+fWWdW6mVen6emtIXrznat0T2PybZlGkq+6wbQ8ldP6X3P1P3T33vn3v84mP03IN/+tKspu7fSpfvPvVnmsfmHn9j38+HT350/2nTAwy9fm5yy3fq++e+/lj311kddF9ou5bv/k3TjPJ8uRjSv/TJkJF6fI6OAMg9Ac+NTGchlQFsFGDDABHtKSykwcBF6ABkW9zlVuCkVkDmlr4pFBB60JfYJiB8rGkBNmYHVMdOgGINJInly4fv+WPvn9oAkHqC68MULZUiMmAqA6lPITc2pslYn/LLvcAKKR8dPcJ94hgGgL7Pp//WCyyTDLtIvYD0MaUDhuleqecHPlLPb1Ljk8/cC+zUxCoIc79/7vl37Pkx/b/2BpT3M81Vhzxf6fXro+T6m+L+Uzuw6L9tCirT+ioFueXXx5j1o/Uhcm47lNIVuCEOtvL3EJ1Rn+unZu4Gitzy52Oq9YOUuz5rHN8x63WcCjq3/rlP/zDkWVPLz+gpgHJXyNRIAwDRdSfNDdPktSiNAz4LWIiCzuZ1GDKAlr4AyX392PuPZQDgOtZ1bdqMWp8v5aBvh5RcQZzZABAdoZF4geJVcHjOz20ACDVw2hZiY03gtdyHXr9P/zhEwTmmgsC0OFhS/20az6bs/033Mu1nMeYE2UfuBV4IrjrLHYFS+vwh9bVyv38spfdvseR+vjEVaCaHJNNYLPv5WA/r3OUXy7E//xTvHzqnMDmRzGH8zUnf+jMZAVyUbuD1MWSOOMQQkIrk69vMBsrU1y89QswnZ6XrF1KzeANAzAuOoWAsvQPXBgD27Jee+fyOnP5Hfh4bAiNTvDB9BtBYC232+il8gjmWgkLKkVw0maIDTL9LA4LJUDD0+Xzy6yO2+648A4hPfqMH4Mj7R08QEk8gYus3RgkaUjd9y7fvGBVSP7otTt0n2qK/iNL332NFsNmwGW5Cr+9jrAWmaR4UEoEX2z/l9oAOXUDY6jG2/nIvEGPlf8r2l32uZqD0BVzq81NfP3edu9o+0WH/NVa/IO8H8pG6fcXKd9M0RicO/XOIbgP0I4X+KDVTzj9jlYm+66cgd/3kJvX7p46g0PpKjUt+Q/RMyfUjielz/yHPmrp+R4kAOObB0aRoYSOAtJ5JhT9PgkOsuH0nOH3LPrUFL7mBJ7MBYAoLrknJz9gWUPpcqfzf7Xbd/z4KOOP3zm8DiK3/SAVMdP1lVgDFln9qDy3f95yj3mTQYll1ETqBsI1Rsc/v87pPXv+RC9TYPQJ8jDEBZFmoqmpvc/M+hkzX9V24FKg8huv6ZrltW/8eK6n7p1IcLHR7c41ppvOGfp/agzB1/fnwyafrWbg95SS2fHJ74C59rTPG+9navslRSvfrpSsAUpPbQal0YstHR/BpA5Vv/ZW7/yydPu3X5cgScv6Q+8cyhYHW5kgyhoNJLLHXz11/qSnJASTm/rbryLTnpuNSpyjNPX71Kd8hz5r6/UbfAyB3hUyNnNSaNv3VngSsGOBjfQuYIRayPl5fsRY4TIDcxLYHvTGqazHFP+V30hjFn/VRnnk3KcpsQPEZAFIPIL4c/LmJbb+xBqIQBbCWXSmbsf2LjmBwKetN9P1eGwSmMgDY7hd7/9QK0BAFnu6rZP+V04Dbtq0xh6U0AowtX6Z7pfzeR58IGdPfpXsA5TaAxd5bGqD0HGIMA1pucs8/pzRAprj+lOf7+gL+TM55Y/vHpZPagLl09NxTr9f5d5MRIMSBr/T+IZax5yd95+e533/q+/vm+5rcDiYp9Ftjklw/MPH6ry9D5k9anxTy03WtmOcrvf3bHPT4s9zzm6QpgI4BtoDp/+xdzT/Z24UXZDIdUAwhk5Cc5J6gp25gU3kA2M4xTQjk8XoTYJbDMZRnpvv3pWTZHYPU8pd7+Rs7wdxut3t9o5bRsRm7v/QpNabo/1yeU6VPcIfML8acc4TWj827mpX8puvkqvspCalfUxvhc3MrOEtfoA29j1Zk9V2YzYXcCtDS5SN1Pfd9fpsB0GTkHYPccp57/ZOb1A4IY2DqO03j1bE7O6ZmSPnm7t+nkk9toOLPo1PwFu5AkZrSn68E5JitZdHkmMW/8/EuSjfwjYXJEFDC3GD0TYAlIUrG1Auw1JgWWPKdtKe/9jIYcwHjUgSNcX0T2VMAeSh9gAstH5YV20JfXkvLHytU+fg+StbcE6zU58dS+gDme77cm/Bst9vuGWS0ik3e+95fphhgZL87tvz5/taMZQTW1+J3TJ0iY8oJnk3RnhKTR6D8TvavtoWai9ybXObov6c0kOUev6ZSwNrk0zTHlHPU0sfPpV8/d/mnxjeG6/5Py+XSywe4KcWBoa9iC/RHj1Uo40OFqy6T0tffsRHmuQ3YsfdP/X5TRFCYlP+83mEDlFb+j+WAVoIBzkXI89t0D/x3zPVjqX7v915PegOd4iGEKSt1jAU0K1L5XU9OTqiu6+47zrcuO/CmaahpGtoZKtj1TAcKpqinz4/p/SWpFZhV5c7R3Je+Dbaqxg3h0+W12+2ormuq65pWq9VBxMpms/E8X9kSFpuCKLr9R509RvnGyf8qtgepxpuA6AkG0fVkgvtQfVzsHgE+hkzgbB4Soefra8Vgm4iNpWBJrYDue31ffzg2ekLMz8Aym9vDPLeBN7WBMbeCPzWxCyCOONWLs9ByWWL5jalkSr2AHbv8+89Px+lfbIp9HiO1AmFsA4BtXCjdQSN1/5s7BccQUjyTzWifOse5j+wKIks7KaX9+MitQA493/ac0nGPkXPL1O1Tp7XWP2PXN6kNeD76lJ/JkSL3HkQ+QhXUtnUsb5LOuiOTHKYkd/+Sev1hmovqMk75fEkjAADtbbgqFQWdgktY0DQhCqS5U+IEc67YvADlAksvxGQUwNTKMwBs8OSW5dekUC+9bwx5vqk9VEtr06U9z5gcw/hdOkuWLwBy08epq8T5ZekGxKnnBwAsidwGlBRM/cw2I/qx9x3H8P6pIk/63N/FHNuvxOegkhoYABLDVjK2pBFRl+u6rmtqad9jkM85hs4FjIdP0SflS3ta9/UKBGAKpOKfqJ9lnJliAV1yuyndALAUTGO2zasQgLkA+QVjMbZXP0hP6roqYe4EeRxO6giqYyG0HEtQ/jMl1N2Ubbf0td4QbO+jdZXyM7AcYABIjE4LoBWv6/V6L72F3hQLjQ64sHn9a6SCX+arrut6L0JlaQMcmA82D0EdrSL/l9A/mtpNKc/G2AwBaO/j4cr1mIvSPVABiCG3fOa+f+nY+kGUGygBm3KrhLEbLB9bik7bcWOmryuB3AakkPuXOK8fG/le0nGJU0gS2fc5XTJTRuDlaOPRBoBjEYShyMbEXtgyLcvpen0gBKZULQD4cBkDWJ5kzjadjoqPQ5sGU2FTnsvv+ScfG5JbfSpkiiKdw7g0IwBIh2m85v1/wHDQfsAxs4QUMHIOKu83B2UK+h8AlkuJ7duVFiR3BECJadxSo3UoS3We0mtt+Vmpyv9jiFBLCSIAEiPTrZhS/UhPVlbEsoJr6cJHtPwcX1PhSvVhUlCyjLGFV0allKRgBceFVBLoqClG9qc+plJwDI0AmKr/K3XyutT+PzRsdq7vNxdye5jNHZQfcNFHPkpMJZC6f469fm4D0NIVLCUpW+dI6ePD3OZfrnSncAw9JGcKoKXXgc0xeco2M7f225fc0ZEwACTG1Ghkh77ZbPaMBHVdd56D0lgAgImQFEDaG9mWDkgOcDACgFzISa4OS7R5E5ZICc+YW8FwDGgDqzZY5aR0BRQAMeReIOa+f+kgBRCYI8febkE+bH1jDpl0OVqNsb7JbUDqO37PIWotBr3OJsqn/C+Bpc/vYABIDOdXt+UR2263tFqtOsW/tADDAAD64lL+mzxbpCFAHg9AbrS3S4lKg9Lbi83zv8SynDOmxRDKGABw7JQ+RgIAQGnY1uw5n4M5lv78mMcumbUEqcnTYEt3bPo+BUYDQJ8H8OUIk/nFlwor6XUaFS4bVvDLzzqFDNGeop+vIRWyu92Omqahpmn20gWtVitaWSx1TO6G6rWgec6PlZ+p39/XHmKv58NlrZfX5OtuNps9AxR/LzcHzkluxdrYHgp9r+c/PrIsMsxttJHT9Y4yJZUsS+7/ttttd5ztHvKnvK7pPNuzup6PjwuJxhmb1CH8Q86fcgLjuneK4zW29+OxXm9c3ZcS6/eYKKl8YvsXvYArYXGbo3/sW2ZLYuzy9pWPXNfoCD75vW1+OhapvGpzp8jJ3f/nLr8hHrwS2/is5TTV88Uy1fgUcx+X8pjXnEMVzLnLN/Q5bc5MrvNN43Xf+8biW1f5KL1/GeP6LtnNPX+U7cvWv/E6xTU+8zl9+8XY8h9rfZ6K1ONXavlZvnZ+JkhFl1R4yYkzK71kIzzm8BwQj0mW5HdS3nKQewAF5eBKJQA5AQCAcDBfBFOAsRmUQKgcol8cF0RG2g3RUqmq1+JgHsxNvuXzmYzt0CceD0gBlBkZZsO/S09s/l/XtTEkZ4dGCiKRRicpc1LetBd2rkGu9MEVpMXmkSL7zyXJyJLe5dhI4VEIQF9s6ScBmIoUXv0AhGJT0tm8d5c2j8yNHneOsWxNzkqmcoAMzo85yLdJ7mzGJ8wRjwMYAApBGgGIzFY67mQ4JZDLIxaAPpgUq9oIkHtQME7iMVAdBbbJlQ6LRf8HpsTkPaO/syldoYwFqTEp/7XTSUrQHx83Ns9X9HtgCkJSgNnWNpDRcTnGdu+a+8mfRPtymNvRDvSnVPl2pXEypZUqwdETTAMMAIUhPa45BQvRdToW2Uh3ux0UoIXj70DzK9Wlgl/LGf/OcphjT4C5hdiBNJi8/F0eNCFyAlkCKZmDZxA4HkpdpC4VtPd9kLIP5CJ3vuhjREdaHGMkpI5Slp8fY3ksibnKt8vBs/RnB+MBA0ABuJRYTdPspQCS+wFUVUW7ppn6ccECkYoBaYCSCza9oUwOD0IsHI8Lk8LKFUK7tCgALFrLxqVQNRmqUF9gSmRaP/6bfy6trwRlItctAOSgbwog0zlgOHCEsBs/MSecPzb5Lq1ufWNxac8L0gIDQCHYwhLZ+5q/5987L23RYGHBA0PQXtVSOWAyAvB+ADmeExw30tPCNpFB/wemxGQE0Mp/pAACJTC1zMGACTTo98BUhKYAMgED6bgcY7v3pQCy6WyOsazmTol15jK6ae9/VxpysExgACgAlxKLU67IcJ290B2VkqW0DgjMAx0BwD/Z658NT3KQyC1rJTwDmA4syAAAYBgYL8HU2DyvIYsgBy7PV8gjSIGvrzPt08O/A5ACn+McZO84WI9d0aGhdlMJmO8+Yz2HDq3WodcyhYpW5Dufi9Ou7HbUtC21qxXVdU2r1erq/8nJ3qbAtkas79U97yhvbyf3lMo3qYuvfndOfL8HXNzdQ+W3T8iXPLZpmk75L1NPcZqgJjIFlb9+7O83hkJ46hRGB9/7LuAtH7f82SaT/PcusoWuIvrXkPqzhVWy3J2cnOz1bRydYsprKPviseo99jqxi84SJ2pjLqRzv19M/ypTqRFd76ei9/kZ4/6lgufPj2yPejwo3UO/b/mPvc5Ina5hCfLlwuZRGOptOOb4OORaueeHqc+PJff9fXUq+zu5/ma0g93SyN1/h97ftj4Z6/qh9+2L3pdRXlMr80338u2pZ3u/sfVWpZJ7fWXC9UxD5diGyTBpmuOYxta2bamuayKivSwivPbQ1+H+0XUvec8xmHJ8PeasFbZ5MSIAZoietFTV9R4BUgEm87iX3tGDsjENRJwOiL+XP0vp+MCysSm0chmcAQAAAABAfkzKV6yHAQBzQOvvTFEipqwMvjUxADAAFI62YGmvwfV6veedzV7Z0sKnOwcowwATIgssd3y8nFDXdW20KId650MWgQuffMj+UEdcDbkeAGOD1FUAgGMmlSce+lXQFyjCwJSgjwKxuJT7pn0kpJ7GZPzUEXhgmchsMyZnSRgAZgZXYtM0VFVV95MjAGyeDrLy0fBBX6TxSacE4s8xsQZTY5JJovlMuufynGAYeqzVHjsAALBUbKkvkHMdjAHGUFAytvUI+j7QF5uOhT/X6aZMqYH4J+TveDDpfJECaCZIhYGp0W632y53FxsBZN4vzpUNqx+IxTaAaGOAKe96LnLfH6RFypiUSc7NGbtHxdJB+0iPqR+EwRQA9D8AgLTYDFAAAFAyem3rS+fjUv6bIgXAvImdP8MAMCNCNpFhY4Dc0EOmcClJOQvyE5oCSP6u95eQ19EbXY5xf3C8+OTDNCEypQRiMPkBU+JKvwcjAABgyfgiAGLnf77z0b8eN3OLCAXLwmV8Qt8EQrGlAApJ+2PTx6BPXD5IATRzXBXIyBzsq9VqLx0G52gn8u84D4AJPfjICYyUNT7OtMM8ACnQhk75eVVVB4bP0pSuUGAcJ6XJIQAApCLVHgDguBmixIICFuQGsgf6YlozsG7Qlv7WpfzHGuQ4QAqgmeOqQO1xzf85HZDM0Y4GD4aiU1FpY5RUxCLPNZgKnf+QP7MdBwAAAAAAAAAAzBGd99/0Xcix4DhZu7zKWZHMf+vv+zBU4FIL6hClkE/ZpNntdt1mvdIrVSpN+z4ff77dbg+UsNITm++5Xq87z+zdbtf93tJ+6BBf2yYXfSlN6Ta2PKWWz9AUKKnw1d9ut+uMUOx1zbDxSWLKhR3DHIexPUOe51hf+fu+t5VvaLtMLX+2fib0ulK+TEYqaSCV9+Pj+/blmtztH8SROgWFNFBpbx2eC9g29pqD0Sq3fMZG0JT+/GPdY2gqjNzl05dj64+lk4VOCzCFA4bv+rwmsY2/U85vU5RFafKgKX39Nsbz2VJbsAOcdlrq0y5y169P75J7fRiLT2lZ+vPz+sOUfsXUH+t+cKr11dDrlz7/9NG3/KZ+35D6MTldSp0fZ/rgz1i/x7oZfU7IfeX9YyhJfkzvknp90Of6sWXlOl/LDsvNmlPEmBapIQpqkBc20Eik4t80INkm3iU1VjAfuN9guSM6jAywRQ4AkALbIk8qVdHfAQAAAAAsh6WuL+bgFACuQD2BMbE5yek+ATqW48Q0NvBnNsPk+vT0lJqmoaZpaLvdHlgK0ImVjTTgENk9bWSudv69bVtqDJsD8zkgPUspZ9OmwNJ6TXS4mfBS3h3kQyv0tUXd5fkAGQQlYJtnYe4FxsCUPhJ9HwBgCSxZT6G9yPmzpb7v3NDjap/zUIfAh0mhqyMAdISJKSoKHAc2p0ebHmQtQ0eIiJqm6Q5omgZRADPAFfrLdagjArqOQpwn02lggTgPSkhxoOVOh53J6AAoYEFKbCl9fKHGAOTANClDnwjGgsdYmxEAAADmjk3xsRR0f72kd5s7IUYAObfDPA+EomXFlWbKlk4UHC+mrC9SX7fmL9frNa1WK1qtVl1EgMwhBcpEW/t0x8C5wHTOMG1BNCloAQjBlKfSlXYKMgZSY5pkj5lvD4AxwCIQ5ALzPQDAnLGlPVjiuIr1U3n4lP+2/Z1QhyAUm9JfghTLx4nJsUdikxmWlfV2u+0U//wfHdR8MBkATBMgvVlmSK52eGinx1e+c2uHej8AGQ0gjU1zey9QLrbIEimHJoMUALnBXAukxORBJvtHAACYM0vuy5ACqGyGriNgzAEh6MwdGqT7ARqX06M2FHUGABkBsF6vqaoq2u12XUogUC6u9BZyoGmahtq23TP0yDQtXOc7tS8AKJfcKYBcuat1JICcuEo5A2AMTGG2jJ5AYQIOSgGRKWBKoEACACwJW5qzpWBLAYR+PC++eoBHNojBZABw7fkJOTteTN7/Mt27dLzlnytO9cPK4aqqqK5rOjk5odPT08lfAvSDFfmM3hBEdxqseNVe2Cws8nqYXIC+mORNfrfU8FxQDjoawOQlATkEJQAZBFNgS0UAAABLYOn92dLfb84sLZIflEGI9z+U/4DxpfzRupA1p+XYbrfdhrF1XXf/b9y4Qbvdrvu+sxy8UBQ3TWPckMKkcNEPFEJuD+e+99SK9LZtqa5rIqJO6a69oUOvbaLRXtRVRfKqXecg9nLYtS21ux01ux2dvIj2WK1W3TH1atUZCWwRIN1zeuo1NC9eKnzlWVGcF3pFnuv7JgZRd4+Xf9/Z3ut7vmeZ583GZeQJR6Xoe83JI3aVuP+Jrl+v/Ke9vw/b9YfUu+laeh8blj02TMnUZ6HPBuKYslxTtx8fPL8yTb5M1x46TyqV3G0oV//F5K4/7TkGpsU7/ibon8ZMcxciMymN67Eym7v/8RHbf/R9v5D1WT/c6yf/9eP7T1OKx+7plANS2DOVQ279x9RjxhR145uDSVzrA9/5ISmUS5fF2Oeb25xj6vak1wf8DPwcrDs0rSHGSNGdun7nMD+e6vqubBm+87Vjt/6+rusD5+22bWmz2Vifh4horb0l+SBW0HEHyGmBOGJADqymnKIIM54HMiWLVpRx58THoT7BUExha1rG5LGlT4zAfJCRKKYwOfRrIBUu2TIpYyCLAAAAQJwCCWMpiGWooypkD4TgkhPoQACRO82Tdrboq69dyxOkZyT/fXp6epAvXkYDSIuDSbkCykamCpLRCdpzDPsCgBhYhrRsmTxkpSwCEIM0cBId5lTUYxgAUwIFBgAAANAfrQxhMHaCMbAp3fT3pnMA8GHy5jbp38Bxo+VER71J5zHWtQUZAExKEOndv91u99LayIfw3QQebeWjDUBcz9Low/KgN22tqio6hQ1YNtwHaOOSTgWkNyiB8h+MgRyzOMpJGp+k3GG8mh9z6CdMi0jdx8l5GKLtAAAAAD9LS5sHysHkHElk3/wXsgdisCn/kaIWMFJ/pmF9Bv+U+g8Ta76gvgEL3OXlZbcvAN90vV6T3DsgNL8tKA+dAkpbk7ThB8oJMBSbrBHtpwNyDXoA9ME2DpnywSIVFRgb05xIh2lKWTT1kQAAAI4P9P9ufDnYAZgCGALAEEx6EFtKF3B8aOcxbSCSx5n08D7WvgkG5/xv27YzArBBQN6Yj8E+APNEWrplugyuZzb+yHpG3YIQTF6tLGdsXIIXD0iBNioxLmM1ZA+MhZ7gEx32h9oIwJ8BAAAAx0qoAQRzOJAC07xMp9vQQPZAKLZ87jYZgmwdJ6bIEN0Pab1syNi55rzcphPk4lWGFEhDwHq97nJ7N02zdx4oH1O+9bZtqWmaPe9/KYC8CTQ6I9AHW5ox3blBvsBYmBT/csxbr9eQsxnjm2eUXreuCAAAAAAA2LFFcUIPAWIxyQ/2bQJjYfP8J9rvvyBXx4spBb/UoWljZJ8xb+0TrLquD7z8+WZt29J6ve7+xgJ2nthSExBdKchMHowA9MGU3oINitoAqa2cAAzF5qGDSDUwNX0n8+j/AAAAADMYH0FKoIAFqZEOkENTuYBlIp3wtTO+KasGUVgkCbPWmwTYQulMHrr8PUcF1HVNu92Omqah7XZLTdNQXddGD9++Am7ap2Aorry8+hjffWSj1Q045BnHmsCMUT4mJf9ms+msT6ys5d/btqXLzYaI7HsDaAGWx0LBkX5iYYrwkYae2rNJyJiYZFSmAtL7ARBRF4mivWT5f+zz+8o/pP3nvL8P3/mmjb2PCSlfLHMyAiUkQi4lsf1DSfU5ZIzqK7+xz6QZq/xN46OpP2ZMmzyZ5iip+4fY82P7t9T9Y2pyP5+vz5LjqQntdVQaqfvHJUQYpUSmC5U/Tc/gSrtnI3f78TE3+ehbnv7jp5n/6PW4Sd6GyBdwM3Y59m0PKcZ/m8yYPuP5v9ZfxM47Q0m9Pk3dP+Vuh7nXB6YUtFqhy9eROtWh9TJ1eafWf8wd05hkmyPxsbz247m5lhGpn5Dzc1+/ZmLd/5UOH1wq8Kqq6pT+dV3TdrvtjtOevWzNAOVj68RYAGG5BDFIuZGTfW2gHFu+ck9QSuIYy8Jm6B3T4BzDUuqklPLsS8nPWfKzgXkx1ygotIH8zLVvB/PB1D9BzpZPjjqWsiaVtESH61TIYNmkrp8hBgKT8t90zBznY2Afl0MEf+8yXLucxMaQ7WgDAHtQsjWCDQG8eaz09pfeIrpjBeXCQsfWcG3skYp/nZfKZZVC/QOiffkiMvcPJuMS5Gc8hi7i514HUvZsG1LbGOPd5+7h7MP0/HN/pzGxeWTr301/82cAxGBbbEK2/Bx7Gem+C4BUuDwoARgTKWsmRS2Us6AvPpmyHQ+WiysyREbnpjI8jhIBoP/LtD+np6ddWiC9uSc60fnAdatDmuTfWpGL+gUhsOzIgVGHQel+A4PjOJSuoE39LHpSrydp6MvGZez6LElWY9Cy18cIUDKx9bOU+p0DWu7A/Jlq/DQpZyFDIBYYJ8HUuPqwqSMAIOfLwOTUOLe5fAqGRFDMCZMDtM2JtW9ZjCE/oxgAmKZp9hTFVVXR2dkZ7XY72m633b4AMioAHVz56Jx4TFVVtHph7OG/Tcfpa8hjYwUY8jNvZKfI/QEblYgOreboM9JxrOVqSj3FmKJQjrWcYvCFNuYid136UlDp1In6O+Amd/2WjhxT0beBIZTuRJATlEM8prFQfg7AWGj5kko2RKCDIZg8/4ns6YxdWTPAMpGyIce7lN7/RCMYABjp/S1TwZyennapYvglm6ahpmnGujVIjF4ctm3bpX4ig1WTlbjSaxuAUGSHpwdP06Y6MSzdAh3KUAVt7GBUUvmaJvcmeZPRKqkNmHMv37krh0oqf1M0QEnPB+bJnL1sc8v/sc8fTArZOcgNmB+Qr+Njyv7VJV9IvThPUs8PQq6vlbvIgHI8+ObVLuMQ/7QZHceQn9EiALTVgj+7vLzsFHer1YpOTk663zkyAJSLTs3Cn3XCJxSzWvmvjQAmpS46QUB0KAu834T8nOWJgezEU7qCdspnMU3yU/dRJZX1FIz9vksoP5NXh80AN7cxM3YBf+wK1lwsoV2BaVPo6fvNra8C5TFn4ySYHyFeuPr7KZ7HBvrXspH7yrmiSY6VY5dvU4YLU58jdbBjRgOMFgHA6I7z4uKC6rqmk5MTqut6T1EMA8B80PXKiv3qhTEH4ZkgFlMHxwMog8iStKDdXmNLzzImxz4BOnZ8kzgo0cBUQNbAUGwGTABiQb8EUjFEiWZSxgFgIiSqxCZ/6Pfmj8loGBI1KQ0AprmVTrE+lOr113/ffUDkRI49eeu6PjAAEF2nk7m8vKTtdtt5jvPxm81m7zn43LEmmLEFaXoW+fy8ATLvj8DnML7mHZsiYgoPIOn5z//5s+1229UxC7Q8hq8hf/qefcx3iq3/uq5HepI8uDogIn/5rEZWYOrncU20qqrqUlHZolS87UMZGPoSIomuCBjv9R2ewKbPbef3PWbM68ec7+sbYhXorpye3Ke5cjUO8U7rE8Y3lYdRqAd6X7z9R2z7ixz/Uj/f0P5vrONixzff+8/dgJU7QqGv/Orr2fpHGTXnup7v+mOTqj2UytyfP5SQ+ZoJX//ku05s/1Ra/69J3b/4SP38Puq6tnpDhijISuvPpr5+rPyOpWiyEd8/Xj2fbfwz9Uf7+ie302Js/zG1fsZWDkPvn7r+fcyh/zStoUKf23dO3/cfuz/KPT+OHZ/H1O+6PPBdXvmm6CGtA7d5/sf23z5GjwDQ8AuwEni32+0ZAljBcnJy0in05PGyAEyN5Vgm2HNARgdIo4BpkWqaxJkUpC4Fne2zPsSen7qBTonskPh3n4EjtvX1UYqbJjfr9dp7nvP+g866xmcA6e4TaNwKZSwFuE8BHPocqWD5s5XfmBME07u4ys82Bsm/+fp67OpjBJoCPXEZayJZuoE09vnGnnCHeqSVMv/JrSCKvX9uBX8fhhgbY6+fmtzyG8vcnz8W24KXSe3AlPv73KR+vtzvHzL/iqGk/r1ESpevqtqf34cowPedxdLqD3LLR+r+byoHpVzX77sOtumyfPQ13PR9vlSk1r/Frs9iz+8ynShdpKxf+b3JWNDXuW7KOp3EAMBKYaL9l2NPcDYI1HVNTdN0kQBsLNDnaW8AkB/pMS4HWK4/aQjg43Xj0L/7PDxQ9+Ohy34qZYCt/kORBkbTdXN7oOoBgj+TP13ogUafl2IBM2W7Sj2BGGrICJWfUMOJzSMp9wLCNqkxfW+i9D649Oe3lfnQhcPYlF5+c2dI/ZkUrKH9ik22hi5AfQZWU//Sh1gP8NTym1tBUgqmRXIIuR14ciuYfKQ2UPrIbaC1XWOovGlKeD8XsfPD0jzUx8bmJOhyuNofM+fd//jG19zPF0tuB4+Q/tVkAB/63LGOgrb2kIrc49NUmLz95e8h5RByvjYkpCa5AUA2Bqkkbtv2YONYmRpms9kcNKQUhZK7g5s7JmWRbyDiepX/TcdWVeX10M3NXDowGy5DS8hAFlsjfQZgbWHl5zbJEX/vnQBHRnA0ARNsm1dAiDzbBg3+PDbEjQ12Nnz1nzqE3rTpcx8DSGyKgRCFWuj1TZOzPudPQd9Fdezz51bAxC6Qx6ofPemzyV3sAmFsco9/pd9/rPqxjc+hx9rG0T7XDb1XyHFjOfCkVhDEkls+pyDUqGQ710Xq/rf0+pn7+6V8/jHeLXeKEx+px5fc8uHD934yY4SE/9aOh/K6V5+71z5zUWAONeD3vW7f7+dOSP+g5aRvmxy77sbUmaYef1KvH0fLlV+ZIwBMn9mcKm06UNOxocTWT3IDgKwA6a3btm2Xv1tGAfDvbCDgPQD4vD7KMzA9JkWl/K+/Y/kwdVomBW5p9V7a8/TF1p6CLZsj3b/PsdJwyH2J3hg42AAw7LGvCRigYpQfNqVgH8uzD5dSMfUA3Of5TAaUsSYY+jmkgszVRnwKWZOyTf5dygTapBAMKd8p6j/l+bHvN+YCsY+xaajidWxiy3+MHJ0piZXfsQ1Mrr9diwlT36PvP0RW+p6jjy/FAAeGocc3PWbEtu/c9Zv7/rnH19z9s2ldmLtOJHM3IJau4PX3/4cOQq6/pYftle7JrNiz/a3J3T58DiKpDVy55dNH6v5TZrzQ/1kvEYpJ9kLWJ6mMP2Nfa8j1cxsAZF3q8Se0fiRS8a/Pz6FLnMQAwEp+omuB5f/b7baz0krF3nq9PlDs8TkwApSNq1G4jAG+jsympEv1rMeA7f2DldQjK9BcExjuR3ijcP25VhRry7z58SMnGCHHOJQuoc9nMqyFnO8jdgCeahMeXZehi8HYCYLP6BAiPy6leu4FmCmFVh8DxZQK8iHXj2UMA1vI9U3joe95phi7UtdP7vrP3f6G4HqmPgZJ13ljvbfPwJDbQJX7/kshdA4P+hErv6n7Rx9j3N81FqY2cOTuP3KPT6W3X9nnmNZZLiOAPNb2M3f9+8g9vi79+qmdIkKMVn3vNaYBPjWx41fq8Y/v4Vq3hyjxtcI/ZG09BZNuAix/SsUObw4s0wDx/9PT0+6YpmmM58eQe4K0RPSgJOtMGnmIrkP0dONwXdP09xjPCqYnxBAkv2eDIh8jNwE2TexyY5qgyu9CzzddJ+T8vgNk32ecQoHiev8U/X+IMja0j9J73wypw5TYFP9DzjeRWn5yj/9joeXMtqjV35dO7gVcbsaUL1efY5MXn4EpVmkQ+n42+Y0tn9zng35j5Njknp/4SL2+nLuBNeT+JvkKnefHOiiU3j/MQYGW9v7uCFvfvFsr8vquH0vpf4aOr7n7h9yMNX+wzbtC5Xvo/N50/hjr4lByy9cU6wtbefJ3eoziz7Q+yqT0z+1AN+kmwPywrARerVadUp+PWa1WtF6vu+9PT0/38ryVbtEC+3CaJ9mQuP6JzB2mNhqYsC06QD+kMUZPnIKslCMq8EyDppYTnbPetEk4H8+y5iJ6gRPoQW7q+EM6b9Pzy/oaOwTVttCyEbsHQMgA18cwaDrfR0gZ6AHe1D+5nsWn4A19trHR7W/s++VeYPrIrWDR1+pj1CthDEytgElN6vqP3aTWdpycS4eeP9Sw6aJP/226R2oFVe7+J7cCOhdjGXhy118sud8/t4JvDAN/yjVg6eNTbnK/v+/+u53ZE9d1vlzzynO1DiKE2D3OxijfmPF16aQeP3T9S11niP7B54AR0j+lXAfk7h9zj398DZteROvOpPKf9TNSpxlSt1O23+r113/ffUDqB6iqg8KRmwGfnZ0R0XWnzJEA2+2WdrsdnZyc7D1nqAI5lBABlAOHjmAgImP0grhA1PPlbqA+fOXD3+92u66x6H0jtAJQN7qSmcMzxpD67UIULFVVdXuI8DlSllyKjthNgHPXbmoFVez9UzOlglYP7lVVdcZpuZeJyQMg5p4pyV1/seRWAKRW8GkDrZ5Mpnj+vgsQYKeUBZKuU/7cFIE5J9A/lkFfx4G5cOwGCB9jzW9s1+FUwEP7p9wGxqWTen5rk4/rvw/3EDRdV87J5TXgTxrH3OU/1uEhdtzLXX6px7ep38/XD/iO1+j+x6SLrKrDzCY8XpXusJ48AqAvusJ4jwBZyAynDtLWl5TPA4ahrevcOKSCXy9K9Xng+Ahtf1rZ7zMSoV2DMUntiQEAAACA6cB4DsC8GSPSDRwntjUdxoXjQTvPSJkwGRX1OSVTlAHAVJCbzYbquqb1et0ZAGSKoM1mE3QdUAbSKhYSnicjJ+Q1oHADjFT+6//8fWj4FQA2bBMBacCUfRLGnvlTQh1inAMAALBUML6BlEAnBIYio7qJ6EC3II8Dy8JUpzprgs0AMAd5KMYAYEqXoEMoOIUMGwFkYXMKGb4WlDBlwvUh69UVwSH3EADAhkyJIcOxTCFceyk1sj3xOBx7u8j1/jAmgSnQyn/Zn0HuAAAAzJWxUvWC48TmiCN/Sg4VtpC7YyYkRYxp/m06zvQ3+rV5o/VFpp98nFT6z0UvU4QBwOTNrZX7bXuV/7+u673/nId5u93ubSjM34G82HJySUMAK231MUT76YBM1wPAnh9yv7OG7IBYbIp/02RAfw7AEEzKfvRnAAAAlgbmTKAPJv2RT2mLuRMIwaTsdUWTQK6WhW0vEf5d6yZNewSUTBEGACLzZi/s8S8jAXTB1nW99/nYmy5gE6Bx8G3mY1JycP0TUWcEAsfFkPanUwLxdYwb9hTeQYMyYbmThkvtiQQv7fmTepOskPubvNv4d4yJAACQBqz/psW3dxcAfXDNlxABAHzodC9E9j4fY8EyMemQTLqkuSn/iQoyADDcSbsKcbfbdZsDM3Vd02q16lIB6fRBIA++ECpTyIz8rK7r7hqybk3XBoCRkUBE1EWZ6FAtyA9wYUtNZ/rcFI4MQAogYwAAAJYG5uQglNAUQNgDAJjw9TWh3v5IAbRMTI6jGpMczKXeizMASGRh6oYoc/6z8p8NAE3T0GazQUdfGDarmSmvMX8nI0BYDlCvwIRvYx6TB8g8umk7uT2UczPl+7sMjuiXAAAAAADiWfrcFUwDUgCBoWjdlHQeZJAGaLmERqSZ5GIOOoF17kF215ruX139q4h2tvJ78fnu8pJWqxWt1+s9Q8Dp6Sm1bUsXFxfWe5usxn03cZBKad58VG5CKo+R54zHYYiSekLP9+4oidgQWJ/lXW/YKjtZNuTw5/JYV3SHKU93Kgtt1a6M1+nu57t+FRelEvv8sd2T73yvhT3y/rbry5Rg3CfIKICmaa6iSYRhSRufZAoqG1Mr4PX9+Plse22kJvcAN9Z7mnL9EZk3AZLI72W6Mv5OHievbeuXwLSkLv/Y/sE2fspx0Nb2fePk0GeS5Op3lsKY8pGDKVJgpTzfN74DN6axcU5jWvT8/8j7u+j1x4v5k56DM03TeO7vkzVf/+p7Pt/4Gdd/+J4/fVtK+/x+fO9vu+/Vz91u30nUlKZD6nQOy3M6/ccQyq9/8zqmlH4xtPz03Jr1Bdvt1nusbe0YwlTyNVT/ZVr/9snAEft+Pnznh5Sf7he4/okO9Ss61Y/W8bqiQoaQuv8oOgIgBC503gBYK/tOT0/3UsdIr/MDb2ClpJ/TRHapNE1Dq9WqM+7ohmiqIyjYgERGkDDSGFD6JAaUi2kiZep/MJ6AGPT8xDX5DpmYAwAAACWBsQuMBebboA9SmQvZmQdjK8h9BsSlMXsDABHtefTqaICTk5MuLRAf47oOETqCkmAPEJtFzrQnAOoPMNLgJ/+bvLVhAAB9sU0OTBFBkCcQi8lgaRvnMPYBAACYGxi7QChD5tU8Z8Kc/LiRc2gtC9hD9HjQnvwmj36i5Y1LizAAEO0r8Fhp3LZtZwggulIesxHAFDqvgQI5P1wHcg8AouvUQUSHyts+dTZ1ChcwLSbjkIwSClXgAmBCy4+eSPA444s4A8CEVvjrhatL+Q/5AscO2gAA5WJLqwhACDrylsg89zE5S2BsAESHXt+u7BJguZjSiC1dBhZhANANWCr31+t1p/Dj/xwN0DSNMQcUXwfkR3pq88DO9VjXNRHtbwqtO2/keAUuK65UqC29swfp0DKlf4dsgaHYFrS2UFV5DAAAAFAqJu9bIoxfIBybwt92LGTrOOiTgx5ycZyY0v4wvn5k7szeAKDTe/BnUhlc13VnCJDpP+Q1dCoZomVU8NyRBhqZx10qbuV/rkf+CQMA0J7+Jlkiom5PAGlAQh8AQnAZkHXudgD6YvL+5/HNpPhHvwUAAKBkXPvYAOBj6Dwn9DzI4bIxeXvD+38+xK5zdMQ+cyz1P3sDgMSkhGFl33a7pbqu99KAVFXVpQuSimZYAstDds4ybzvRdePl+g1J7wSOA5tnEUf/cBSJyfILRRrw4fIYMOURdKWdAkBjSgEUeh4RDJjguIH8A1A28zYCxOYJz90/LTPPOTI6gBCkA41OFyw/A8vElP6JKHxvv7mzCAOAVNbpHPEmj3DeF4Abv/QG5ustraLnCiv7df1wyh9W4Jo2CQ7ZxAV7ABwHpv0iuD8wpdKAFwAIQU8aTP0FDMogBi1XrvkJ5AwAAMBcwRgGYsCeSCAUlgk4jR4n2vOfdcZEx9GPRBsAYgsjtM3p+3R/WzzdtOKY/5aKY/YA5n0BTN7jdV3vKQS1YtAUNmIK1w99r96MFAIz9PtUcDn7UvhwvRHR3uauXP6bzYaIzPITUj9eA4HnOJushBL9fJk7K1eu6jHaR99BW19vu93uGQX5GO4L5ObTJgPB1OUbmqNuLA9g23VCr1+6/PoUqSH3t0WPENGegVIbn0pIUZa7/H2ULj+xiwbf+TrFj6/P0SGtIUZwF7nrPzWx8jNWCHIq5DzHJkcuD6jc7zc3+Vuax5ipfUh5MaUgk8fkVqrkLn9bOUwVoTX2/HkopshIon2HLdNPf/873nOZr593/lFK/ZVC3/I8tvEnF2OVU9/xM+R42zVkBpA+5/Z519j2OVa5WvWnBuQz2xxqteJ8rOcaSmg585xFro+0Xlf+PnV/MzWLiABwYfO+5M9YqLVQsGBst9vuOlKxfGwDb+noBkx03djlMfInAKbIAP7cZrjQ5wIwBMgPAHlBGwRgOJhLAwCmAGM16EuoohssG+3ESeTWBx5L1P5RGAAYWeF6E1D2HudoAKIr73LTZqGma4J8yBRPuqGzB64O65nKAwfMA1ufYLIKM8cySIDhuIxGkB0wJjqqDfIFAJgS9DnAhCniehlrL1+Ene8d80aAxu8BMM3z2zyY0d8AZhn9CRiCK5Jfev3r71z9xzHI0+INABJTChL+XCv+iOggPQMUgOUiU7LIaA5O4USEPG/AjE5JxP9Xq5U1H9wxDA4gHpuhEfIDxkDK19LyUwIA5oMtzQ04XuQa2eRAB4CL2BQs4DjA+uo48TnySn2OPAa6wCsWbwDQC2T9OXv9auXxer3uztvtdl00gFQSgjLQDdmU1smk1AWAse3VIPsGDBigL1J25AIYMgXGxjbHAQCAVEDxD1yY5jlYP4O+QGaAxqf4D035ApaDSQa0HLi8/48pSv9oDAC271jBz/CGoKwsXq/Xe9/L35cuHHND1gcbazgFkC2lC+oQaGyLFbmRK+QGhOCLAIAcgRhMaRXQP4XjUyqgHAGwA+U/CGG5KYDAFGD+DHygPwGmKDOTY5TMGHLMHI0BIHShJ1N+8J4ARNQZBeQGwRh8ykOncyHa3+OB/5b1CIAtP5yUGdP3xz6AAD+2zaUBGAMZlagnupA1AMAUYC4NXCAFEOgLUgCBEGwGIleUNebHy8RkZIbjr5ncO9Akp+8mD23bUtM0tN1uabPZUNM0nSJwvV7Ter3uvMohRGUhGztv6iqV/DodEDp/QLQ/WdAyZFPeYhABIUBGAAAAHBsY+wDWWKWzivg5vfoI8gQ0fdIAMRiblo8p7792+sUmwJH4mpGvoVXeK/Bxlflvx+YP8qfz2g5lsLQc6fRAbdvSxcXFwXX0vaV33oESMeDZnN+TO599tBD76q+qPae7z2/bxmrlD312X1gpR3Xwfg9VdbU5sDTk6KgO0/1NMtW2u4Pv7c942PHEdjGx9TvkbNeGK73OD2ybfek1uFfXPZDpvOaFzMj9JFZVdXVe21L74nv5rFJ2Uu83YQuFDe3/vP3zCP1ryQx9/1BM+QTlOCENTb7+J/b+JeId3xI/f+z1YxcSIe8feoyUKblfket5S5eP3IzZ/nNg29tGf8eRbrov4s9BGLnre2ykXDCmPsnUr7i8L+VxOUndvm3zv+v5U2pFlK/83e3bP39snN/vdluDw1U34ybb9Dh8fhlbf7Hzc/f613//2PnHGPOniq6U+X1/xq9tfPMROf6Y0o2Z9A/yEv75Wdw7xOo//HM783XGU2DH1uG48wPTuNJHwa/7je12G3SfkOcZUua51xex13TNH22fDb2XCV3+eh+HTicj9DPye13/fepjCUYi3/suPgVQLDuh4CPaF7i2bWm9XndRA9K6tF6vgybAYBp8G36YNgdGiBgwDTjyJ1kUdGj3wAb3K5ARkBKMXQAAAHIx9zHoOOZoMVEA4zk4uWQFe40cJ0P7D+huloVrLz2T0Qj9QxgwAHhgA4D0iNJWp+122xkBtMUMglgGrNw/8OYWG7vK41yeCRhcjge9p8SBJ5zykMTgAyS2fiLEswX9DAjBZlCC7AAftj4GsgMASMnVeFV2P1N6BMtSsM2FTeWP9dXx0mfNBDmZP77MBvqnKUoA2IEBwIMULPbwlxvKcloguQhnBTPIjzTeEF13CnJzZ65bHe7sUsChczkuWIZcocmm3HKl9wOlP99ScHn9yzEGRmMwBD1WQY4AUXj/DmMjAOPjb1PL76MRIZuOuffZfY3Pc5ObuddPSfiU/8zcZASEIXUv8netd4EBIBwYADxoA4BUKEtvck4FJIEAloXsGHYit7tPsZsSTBDmgykfnlbe6uOAm2OSf61kC83PDUAIehyrqir5HiRg3pgM1TzHPaa+GYAl4s/RPM39TfOeOUQAgOkYkgIIQ9TyCVX8M1g7LQ+9rnF5/oNwYADwoC1M0gjAC2xWJMsNa3jHaSyiysCmeGuaZu977lx0h2KfgKB+l4xJqS/7BJslGnIBTLjStGjFGyY0IBQZPZLLmA3mj5Qh9D8AgFgQAQB8IAUQMNFH+Q+5WB56fWzK+S9BCvZ+wADgQW7sa/rJKX+Q+qdcTEparjte7Jo6F+lBqc8Fx4HLM9vnzT0HOYE3RR60wtYmSwCEAuU/0IT07ybjEQAgntwe+LmZe39S+vPPff5+7CmA5vY+OemTzhAsA62Ps6Edduekg8kJDAAeTCH0UhDZQKCVyaAsbCGoOpWTPhYcNzbDT/e5wUNBRgdgAAIaKNzAFEC2gA/0RQCAHFz1Obmfwg0UuNOCMQiEgvX1cdBH8R96HrhinXuA811fptXpcx4TKwS+8+XGsU3TdKmAtEJZRwfIzWjn7Fke+8w6hxcbXNiwElt/tk03+bpN03T3NUUD8N4OpmP4fJMHL/+v69r6HPL9TcdMIQ++8k3dP6S4fh+ZkWm6TN7+thDUTslP++1by4o+j+8TEhbNUUUubOVjk/vQ80NJXf+pB/HU9/elCnOFuMoUc67vx3g+G2OVf59Q3jHvn7oPzS2/fTBFCMTWf+7+P3f/MHdsc5c+57sofXyJPT/3803Vfm1zJNv4M1WKzNLXr7GkH//GLb8+6Rmu5svu6+Xu/33Eyl98/+H+Prb8/OU7zvvL+Yjrnn3rOzYCJ3UET6j82ObPsfIV37+4vx+zfYbOX8e8p68/M+kMXH/3uX4IQ/qfMaPNTUaYPte0ZVRgpP7DpIPj76/Hk3bvf6zOo/T1Z+z9s0cA5B7Ap0AKKtH1/gC73a4bweVCbE/BeATlkxOX1z8r8LnjWa1WexEfRHTQAZmu7bu/qa5DjR/pJ3hubMrJqRhLgWRShIS+jxxwbM+lr2f6u89z2+7je87xJ9BlL9B8lDpAc79gm2CaJl5DmKp+fPIec10XuRVEqdHjh34f28Jaen77rn/M5JaPqRTEehwfw/liDEp4BnAF6uKQ0g1gPkofH9Mb4Nzf535/H+kVvL73z2sA9ZG+/ZXd/v3lW7Z8m55/ynHI5gDY95g+1x9ynVTn9+1/besP3/m2eShIS3YDwNJhAa/ruhPopmk6zxmTVZM/L33ysQRMHY6p3HWkBhsCpAHAdc3QZxjb8JN6Aqg91H0WcU0JC5Chxhui6/Yr94rQ15RyYzrXNYiOUX4uw8OUBiLb88V8H0tuD0VXBIpLQcvy5osQiX2+Mcu/FKXiktB9xdhGxtwetOkVQJBHF3Ofg5buwZVbfkPPt82PUrfP1OMbGI85lvXc+zcfJayvXJjmJ33WP6UrsFOTf/4U1z/7r+/24J5qfTjUEFA6YxgQXeXQR78gdSYmxyXoRMcHBoCJkIrd1WpF6/X6SsEjjpHhtCalJBgfWxlzfXGKHz7WlrJJd1R9STWYTO3hObaSL7kC2RKBEXQuXfl/2KzevsmLPn5s488Y5PZAWDo+jwnfAmns+5dG6c+XG20k0uWlFWgoz33mpCAZQtAYZvGyy/3u/BxgOCki+FAn05HbQDT0PlNGFsaQOgIgt4d77giAofefbv2b9/zU5L7/mPKfYv3T5762v12flT6/9NH3+YbosUxOk/wzNsUtcAMDQGLYO1h6bLIBYL1e0/ZFDnrORc/nsLIZDWB6ZKfFBgDt6c+pgZqmMZ435F5DrpF6AtjXw7wvfSMM+p4fcn9tbR56zSGL5Sk90Pt4mNvO0eSWv1hS109s+Zhks49HRAnKmlzKAaLpDaBTX1/ew9QX+9p4bvnI3T/GMnf5MY0Pch5a+gJ17pQu35IcxoA5lY8J//OXXX59n7/v/fLPD+c9f/XJT/r5T9njt39+kfb6seT28M+Nybll6neyOeiZPN31Z3MfH0P1M7ayCT3fpafIVe9LwCcf2Q0AuQeIKZAKft4Utq7rK0NAtb+RY4lewMeMTtEhN3N2beAcWn/aw3fsek89gU29KPRdK9ZAsGsPU3D1ef6KzIOX7Rr6cylDQyJIQieIQ5WwOeRnSkp4Pp4ouiJGdD2G9hWx7SPF++euc8ncJ+gmJa2UlaHjUp/7pyS3rJTQP8QwpJ+XchP7/qWXTyxzf7+h84C5v/dYpFbA5e5f+zz/POcK85bj/PKXpvzC6/3YDUBu5u6gpe+VQkfiuyeRfb0Vq7+ZU/nb7q/fu085uNa88vcczgfHQHYDwLHA3pqsUO4azguFMhsEOFpAHgumxVTmJkMA0XUkgEnREuJBt7JYO0PJPcC7LLchxEYAxF6fRHsceIMDBa7NM9u0iNb37juJ6Fv/fRfysQuMJUxwUp4v61vLget87Xkx9P5Tl+/S7zf1/ffmEpYFUkhfFHP/lOdnHx885FbQxZK6/4h9/txeX6nfL/Z8X4RwivG7zzPHtk8fS/eQnUv7sc0rU98/vn/M27/Gkn/8iWtf8XOT2Pbhubq3/4g7P5b466fNMDH2++vxJHWGDJczjfzedkzp6+NU84O+DiTSkVYbAEL0aGAYMABMBAsxK/ZZsNcnJ3sKZU4ps91uqWkaWq9RRSkxhXFJtFJ3t9t1hho23PB3OoVTXwPAEAty6gGmjwImhQEguYKB9gf53ucLA4JW4LoGr1DlfwoFWB+jTWoDQO6BPbeCR/c/IelaYo1uQ59vDKbu33LL35QLQJMxyRShFmXwdNx/iZRmQOvLEAOky5jU9/q5yye1gSf3+03Nsb0v8NPXqaQkcs8PUlP6+/kUhakNEKUT25bSp9CNOt2Lb80zxfzdFqEv59EmOR7j2XI7WIRc3+W4NmS9Z3smqVMB4+DVLvs6kF3hFi4fvuf3ohdNRN3/7tmriqrVqlP2ti+Ob3e77jiOAOAUM6xk3mw2e8pC08LeNXj6LfDmnbd9176+R/wAIt9LLjynaOihClSTcvfFH913K1WO8ultqRhSW7C99a/+PihzTx3w82tZm6qTlvfX962q6qB8dXnsRWAYyip0gNQDl6nNmujjAaPbZ5/nG/r9EA+eMa/f9/y+i9HUz9/n+qb2szNEqPSp/9gFwNjl46uvvsQ+v4/Y+k/toWur34N+rtDNgFMbsH2UsIBKef2QetYK/1Dlf+j1XaQun9TEzt9iPeRTK/hM15cOL5zSNJSx+/9Yg3Ls/Ci+f/eNz86vA94/7fjYttXBGu56adRSVUkHocPzc8/PiHzl767fuj6ck8t7++XL3X78z+9+Pn/5xd0/pPm59At1feK/QAT+8o9zsIydnqQYv/oooX3176Ntt57v9f20g1uYM5NtzTPF/MG1pnT1/2PosHLPbzS2dYVNcW9yQGIdZ1VVncOz7T21PmdsvWDu+sltzIB7eWJkA9ATAlZQys1+O2WyyDUvG5dORRNyb5AO0yYmRPuLJP5bE2KgSY28+5DnqQznTf1eJis94xqUTMf3pc97miYSchNp/sw02bF93vf5+tZNbD36FsjxC1CzdwZ/FrtAz22gsz2fq1/pc/1YUstH6hQSPkovvykUxDGknuCW/vyx/Ufq+jMpqYaMMzH3j/l+7vKVe/7nwzavMo23JmzzjdDxK1ZBb7uH7b00qcf/Yyf1+Df1+X2vV3r7HwOT3kManYGdIevLKcfvWHzr9SnmPym/T82U97fdS+u6GJfhJHe5gStgAEiMr2HInP9t2x5EAch9AaS1LLflCFxj8tA1GQDGVDyPhTYAaIYssKZ8N9Mk0jXQ2CzYQwlZwOrJr/zpez6fYSPWQ95HbgVjH0OHzVsx5f1TG5BMHpahypPQY1KSOoJi7qRuX7kNALGU/nw+5vL8NoVM6Qrw3AaA0g1EsUi5kHOXPgo8l0zFlm/I/C3m/qXL/9zJbcAdc35oc/KKuX/6+VN6Bapc6+j1z2533PIfa4CU/Z/P2W0IfvmMurz1Xvx7bges3P1z7vm7T0/B9aPXpCanUH09k250aZSi57MRbQDILaClY3t/Palu23avs+OOXXqYs0frsTSeOWBT6puiN/Tx+pzcmJTKMR4IQ72zJH1TmIR4ysvPYj2QQxfAJtkIuYZpAd5XAWyqz1APvrn0MbYolKkMEFOh6770BXTuEMvc5FZQ+vqPuctP6fJR+vNp2ZCUMMfMPT6Vfv2p+hebN1+ogmaoYWms+rfdP/b6ufun1ONvLLnbr4+x67fv+8S+fm4Hlz7tL4WDzrGTQunf51qx3YvN6WAquZj7+jDH/U36FdtzmIx+vvoN1U2AeBABkBndKHQ0ADcgGRXQNA01TdMdw5gaY+4J4NJpmmavfuT/KRUtMbhCtbznDjwv5pw+57uU32MQMkF2ecppWZHPKb8PuZfr+YbWcW4FcOj9bYaN3M/vI7cCITWlK1B8pH6+KcZnUx+Uu1znQu76ncLApj00S5KN3CnAUrP0+XmsgnTs/rfv85TefpfOXMrPpogt5flsTFW+UP4PIyZiewz5858/rgJ96v4ZhDN2e/Wt0VG36YEBIDG2BZUUftPCnA0BrFzm/1LhhfyU+eH6aJpmz0jDP/kY+Z8/K6mDMz1LyPPpI2ImLEO+77O55RDLcgoFpstAp5UwJgV+nxB8V+TB0Ofvw5QewCYjR0ltbAi295vqvXIv0kqvv9KfLzdz97BKv4Aug1zK/z4GfBO55SOW0hXMtjE0tNxtkXmhzzdG+0l5/9wKqrn0L0OZy/uZ+s4pnj23fPZpP6YIxMMVJJCE1k+soXX4/ceb35U4lmP+cYVNvmyOhbY5g8lJOYVjZimULj9IAZQY0wQ61OppW5RVVUV1XXf7A4SE34A0yEkNRwNwZIbcyFlSYr2YOuE+izx5Tp93G6t/cHnQ2+41RT342v6UnjGm9401wITc08XYC5C+7xdLavmRm77L+w0xZpVIbgWKj9Tzm9j3D3k+aTCU95zGQ8xN6fUfS+n9Dy/KUs1TUtdf7vLNHSGSGtOC3rSID7kGnzP1O6ecn5augC19flB6+YWcP9baaej9Y4gVj77zE+0IV1XLjvBKjWvcLr3tE9nbyVRjRO72F0vq5zc5GZsM6nqNyv/lHgF95HEp69vSQQRAYkItYrZjdUQAK5V5c8jLy0tjZ4+GMw0clXE4sbnq/MbIIZ8SvrvucIcuksaeePRZIIQsTMcu777RBKZyls8durgOraeUddP3/inOd10r5H2HTID6nO+jjwHGND7kVrClfv/SU4DEyu/SFeCpKd3Ddq4K4qnmJbnnP7kp/f1t8ucyHOnzXXOQ2Pfvuwlw3wiAubbfUkht4E59/xBM6/VQBZbv9rHn+5hy/DQ7YCW9ffGM0T60wl9+lr79RF0+2iA85forB6WtD0zPY1p3y7WqabznY3KX77FTfeYzn426gK/6vALsOT+1hauJTKNjmlBK729WBHPOftk4WKEfgjxXe5e37VU6ILl/AH/HHqR6IL5+Zvf9/QPQeKFmMs0Rv89YHVyI5/UQfFc5OTnZux+XvStyY0p8T+Arp1VmBUwpHoCmQTD0+vK/bsu+6/WV49IWpKV7YJRYXlpe9H/9fQylGzBLq5/S0ZPzpmm67+S8IVyBsez2l/v+U2Ebv1KnmTyW8k3FFO3P5sW7BCB/bmzjgM2h7fiI7R9jHRxi9Rd19/uw+tu9uI55/PAb+8p28Cid1PMzvwPU4f3lM7Gjqv78+voRD0f5HTSW3ue5opvatt2rX41eX9iOCbm/7XiZFp2Pn9LAH8tY97ddRzooy894XocIgBkhGx4rx7kBsgJdhtzo8ySwvk2DzYjhWlRhUXI82NomZAD48HljoH8HPrTnGAAAAAAAAH0JmUder00w5ywdW2R96cp1cG3Ak45d8v/iDQBLEEKtzJde/Wzh4QoONQJce4hO8AJHjKwrk/cukd2jCkaa5WOzcId64ILjwuXdEDoxG3o/sEwwzgAAAAAAgFBCU5TavbRhAJgLsi71WnPMtH6gP7Y1v3RAlp7/zDp3iDdwY6ofU5iLrFgZ9mHahGM/P1fqNzhutAFANkKT9yVypO2z9Pe3vZ+t3116eYBwdMqWsZX/YPlIuUHfAgAAAAAAfOuJ3e5wA1jXeVIPhT0gysdl1DGxpPSAc8AXva31jVrPuPgIgCUiG1jTNJ1iWVt4ZEcL8mHbBMX003YeWC6+KAB5DBR1x0sfYz1kBIRg8uoBAAAAAADlktvhx6UgdkWxY545P2z7fDC6TuGQlgdZ5ryHn2yL8v/iDQBL6mhMCh6dY56NAUT7kQDy//410ECngiMyOE2Tbqi6jpYkuyAMc5SOOdQOHA+2EEvbJo0p7msCE7x5o+cUMAIAAAAAAAAXLs9w1+asYD646tiUbtx2LEiPy7FYZoXpDABY4JcNL8ptih6ZKoaVym3bdgplNgboyuefVWXfxRvEY9qlnI0ARIebc/D31/WD9rdkfAo4UyooKOmOB1tdm/oGRAAAAAAAAAAAYvDrH8IyF9ii3ME8kPpH1zoT6878mPTEJgfwqjqCTYCXiG2TFf6/t8nDet0dx5XfNE13DvrhtOj6Yfhv08YcOi3DMbN0A6VW8Oo6R45uEMLc2wHIh8kICQAAAAAAgAmf0xHWrMsiJNocjmhlwDojvR8sf3dlALDk6+pSzKSuQM9iM/buvvNjl7oV7SvxKvF/xWUrjtP3DFVw2kKobJ+xkl9vAMEpgq6jB9zXraqV8/liSzA2TKxqfc/34riDG7/4Ue30N/3wbZLD76OU/Pz5brvt6qOua2MKp73HDrCku/Yc0Od57fuF5BgsFa6roZgieyQyyofhCBEZ8aOvyT+HyM+U+OTz2LGVD6M3GWdMhiX5HR8rJwUmctdD7vuXjq98TPIjDYp6kiiPn6LsU98D8hOHLfVcaEq6uZd/iufvM8edqn3Y6tcUwarHEhexCoDU1z922rbxHGHeo4z/9EwfAoi9QNz8O555399X/75IU9YP6Hbom1eKIwOPs5G7/KMbQCTu9/crY8Pm/7Z+1qUfsp8jnyl2/ZFWQzgkAmJa3OVnSyd9/V4rw2dmHYLNi9xF7Pxl7uuD2Pmx7Xz+nB28bdfdbrfWe7VtS2ttFQDpyOFdJzcJlo1a/s3PJoEsTI/cF8AWxgOOC9tgq0PyIBvABWQEAAAAAAzWecAF5OO4CV0zIBXMcoAHf/mM5RixZz5wKSDBMEyK2ykbFRt4OO88Kw7ruu4+1xtDEE3nAXjssGJOe/Lyf1knMNIcH64QO7m/BxS8QMuBy3sHqV6ACUz+AQAAAKDBnPG4MEWQIu3PcjClHJY/YdjJi69+bJH+wQaAk5OTAwWwVDqyohiMg6zQKZQwUhCapqHVarVnCFiv153yWe4NIHPUg/RwecvoDGkEsKV7AcvGZfTRaTwwOT8+9FhiMxjpSQL6EkB0GGEEmQAAAACABGk6jw+9vhxbQQwZSovWEfBn19+Zz5HnMjAG5MXU/iQuZ2Eb69PTU+Kc8bvdrvsZnsMNhCAVvFPCOTxZIHTKp5OTk71nZEMQmBZbnlXZ4DFYHieuKADXcWjHx4XNW0D2JXKCgP4EMKY9AfhzAAAAABwfUPwDH1h7lovJQdCkV7K1a9RtPkx1Y9ufgemzxl/zhXgDUvYEr6oKRoARyJ0CSIdrSSU/1zs/D3v7ayUASIfJyio9/mUEhjbmoH6OC63IlREirnQvYLnYvPtNizZM5IBG9h2IAAAAgONhrFzCYJlA+X/cmDz+bYpHBn3GfHBl+MituwTmlD8S3Q771s/68vKySzkif3IUAIwA88bWiLkjv7y83Kv79Xq9lwKI0wKBtOhBVStm9J4AaJfHga3DZ1mQ+wCA40T2C64UUQCYsBkBECUCAAAAAMwFjo+QSPPQ70KvH3M9sI8vBZBJv2Arc9TF9PgMNC49YEh/vb68vKS6rmm9Xu95HLO38cXFRf+nBla0t27qIdUlIG3b0na73TP8SIUiDADTYPPithkBsB8AgHIOhIB+AvQFMgMAAAAAG5gnLB9Eli8bnSHE9LsN6CDS42t/sala1+v1moiuNojlTWLruu7+c0qg7XZLTdN0Xqd8HCuYh4Yg+I5PbSGMFWCtYDeFzPnCOGKILT++hqxbaQw4PT3d2xtCppiwWRJlBAFw48vvzum4tIev3ChY1p/sEGS9hNQHOvP+9C3TvmXsOl7KhJQFuaG76RlT9EM2fPfo078fo3wOKR9Z9zKtW5++QF8foeDzxOVBwpjqkh1ASvfQSt0/HMuYaYsgsi0Q5TFzJsfzj3nPsa6l650xKQX63DN1+ZYuf6X3H77x3eYBfH2ef3xx3z/q9OjxqZTyT4W/fMzH+TyDQ5+79PmDD9/4Vzq+ZzbN8WxjAR/fJ0LUFsEe+nxD6DMnzN3+fYS2X9Ox2rHU5PFvcxA2KZ5D+oi+jFH+ew7VhdcnkbsN6Gw88nupV41V/DNr3ZjZu1jeeLVa0cnJSafwZwXTZrMxKrfHfECQHpNiiOWA/7MxSHYYcxwQlwqn7QLHhU4JxL/L7+GpAwAIBf3FNZi/AgCGgv4DAFAqMf0T+ray0ApwzOHLw+SMaXO6cTnVj7VGW2vrgrz5brfrFL91XRPRlWJ4u93SdrvdUxLzQ8kXbdu2O+8YGMMiNjW6znSd1nXdeQPqvSHm8H5zx2S1JTJbZnlDZ/kfg/SysbVBGAGAC8gDYGzjBMYOAAAAAIDl49M1gLLQeiD9N+bweQmNQPNFXMlr6ciOGNbyYtIYIL2JdVoYThvECmFTypdjEb6lKVK04pjrUaac0UYi/p2PZ0Lqf0llN4TQEEmTZVd+J/dugHHmeNARXFJOVqvVXgqpY+iPwT62fhlGIUDkVv5DNgAAAAAAlo0thQxjijYH5WCKAPA7JUMnkAOtX9VZWHxpek0pmoaw9uV+5E1iORpA5oYnIrq8vDzwCpcK42PoKFzWm9KVbr4cj/IYaQji4+Q5/LP0d54TvggAKWeuXG9guWhlrisqy3QeAOB4sc1VjmX+BgAAAABwbPhyuxPZ95HD/LAMQuoQ5MWkazfp6lwGgLHrda0vqm/KSn1W8MsNgjkagDeJlefziy29g1jiO8p30ntCsPKf0wLpFFIgLSaji/7dlEcMLBvbYKG9/yEPx4U0DpkmIJCH48ZkBFzinGYooRF6AACgQf8BACgVn+IY/VPZuDJuuPRA13raxA945NiU/vozrUe1tbuxnTbXrgZueiidX1x6++tNgo9lU9I5L5htxh8tZFyvHAHC9c5553UqINM1TMy13MYidoEgDTSmKAA2zIFlYhpA5OdQ9AJEeoC+oN8AAAAAAFg+fdYImB+WgS2HvO0zMC1a2W/LzBCa+oePH4u1ViDqG5gUwVLhe3Z2tpfuR24S3DTNUW0CLJlLCiCJ7VlNAsqKf04PJfeDAOMRaiA4xv03gN34OMf+BwCQF/QXAAAAAADHi20uiDliOYSm/pF6AujopsXmoEtEe3voaod5l2P5WPqd6tOf/ozzAFuIuESmBdIv1jTNgdFAepBvt1tnzjFvPrLEIZa+Aq4Mx3E0BKfLaZqGmqYxvpPv6absbIfc6/Tk5CDUiI0/nDLKxU5Fksgyk8Yp6zP3fuKRiW2Ae5dyW3G53RDtdxzyWBmRU1XVQQdj8xA/VkINLENz7JVSvjIdEKdsa9uWTk9PndEDpjY4xFMk5rlj8PX/Yz3f0MiL1PJhei75uy2NW+gEI7d883hhI7b8Q84fq/3E7tExJJUPp/IzXcd0/tIWD7nltxRs/VfulACl9/+5Wa3se3ER+d/PFUEqr2Njaf1BX+YuPxLbOFXyGBA7fsfim3+UngUhtp/P3b+WJIulM3Qeavs8pOxTzx+qyq1f8t8vtn26278f9/31/FyP7+v1+uA7+bf//fs/f0ltTva/+n1D1k991nfyeP7p6//l96Zn8WXoSF3Wa98BIQoAVvSzR7hURBJdFQJ/LytJpo1Z0kTqmOAFhFZUy59OBYNlggQv9mFoJR4PIDpKI7RjQR1cofuosTrm1AsYbkd6cS8nFtyHayNmyPP5yD1ZSG0A1vfoO5alLh9+Hvlc8rPc9eNjDv1PqvYTq/wPwaQwXNJ8bCnvkRqTscfmkFB6n7Ek/PMD+/w55PzYfgrtaxm4xg/d5tEHADAvYpy4Qq+Z4hrHboC2vZ/PsLL0csmNaww0rQOZ0urFawDQ2LzM2KtUbxLMXnB8rC1NTGkFA8JomuZAyVhVVef5LxXOSFOTFmlY47LVmzbzcVwvY1hI50yffieFYiyHR6VM2Tbk/GOiryeUzWPAxhTlKRX+PrQCuPT6nsLDf0xc1wtVwsbcw4TJgOWa3C5prla6fKdGz8nkT/n7XBWAS6/fMebUPuVv6P2PkSXKV4jhby7vnfs5c98/lhLmryXff47EGHvHcKg69jGjD77xHbrUtJjWYyGOk/p3ea2S6qeXAcCm/GdYsciCKiMC1ut1pwSWaYFC7wXKhetVRn7ISBCWC5f3OQwCw5BtUP7ksmQDDR+rDQFg+fiUPPy3HNhMDPEiiZWxucloid7Tpucx1bUpUgCEEdN+xlSu9m2jtgWE7ifmqgAGbmx16Zvrl9bHgWtk3YQq8FCfgKi/gRoAF6n7FchjP/rWR2z0T+r5Y+kGqhS43gntIT22+ZVrLiV1biXVUZABIGRRKb2/WdlLdJWjarVadVEBRNcpgdhYYPIQB/PApICWER+8WTAj0z7ZlFD6M+DHFgLGBgCOBOBy5Xrx5ahcepsMUZANUXz3uX7M+T5McmFT7tmUPjHv7yN3Ox/Lw9HmDZC7/fTx5uRjpDzkrp/ScSn+Q9uPrR0OWWjZrhny/PKz0GcE80fWrau/yGEYhJyFYZo3h4w/Kcd2MB98chAzNgEA8hIzlo85P+07f/Qf5/4+9nw/ac/X5WUb3236H//6tt/TArv+24R2kNf1lXu+1XsPAJd3m1bm80vy5sD835R/WnqIg/mgO3ZpBNCKZ50SKuTakIcwbIocvcmb3EjYtAFkX3yboMydPp196Pmx9++DK72HlAuT7JjuP8SDJOb71IxVPzICSn6e+/2HXD93nUhyt5++RhN9Xp/2o68z1AAT2z+5ZHduY3Lu9lc6Pg8m02J/bjIwZ/ooMExK29z959JZYvmE9PulvHfpHsC57+8jtvxyv1/u+8+RoWU2Rh/Q9xqlt+/UuBwybE7TmJulwSRrWv/lcmQvMfNGVAogjalhy5Q/OjWM9kIusYCAG18ntN1uO8WzzEfPxp5GGAOW3plPgU0BaTIEyO9j7zdX+k5AxlaApz7fZKBxKf77Pkvu94tl7OeXZRti7MxhAOjj9eMj91g9J/kbakyIuceQBbzJ8AAF8DKx1aVJjkpUAPqIVTCUzlzqAcyDPgZqsHxKn19BHvsxRn2WlAKoqtzXmbt89K2vub/vHLAZZWxRGL7PctJ7E2CJbMimxQF7GLMRgD+r67pLDaQ9KMfwWgHTIdP9aNi4I40+LBNc143jfNAPk/Jfti9ZH3KvjjHuuVT6KtR858fef+j5Lk/PPpEBfZ8t1oModsBM7cHkU6Dm9qAyTVBck5YpnmlMUnsQhabQiWk/uSeFtjLQ7wQjwDIJrUvUeXmY+vI+hppS+iAAQHks3YAK3Iw15mP+OAzf+A7yYps/ueqqpPV19cYbb2Z9gNPT0z2P5LZtabvd0na77bzEWYEsDQqcMqh+sbkwn0s03MN1CCvDPXSUw263o6ZpjEJSJU6hkloB6Q1QVspo/X8n0kVJxVnTNNQ0zZ5cGMncGbZ0qPDrI3OrwAkWyz+3AZb/MTzE+dr87Hx9U70wLsNPSfC+IzZi+wdfhEBuBbcPrl9pjOW6l8Y7GzY5CH2u3PKTun9MHcI69v1N7Tw0vU0OchtYYsnd/n3nywgimd6Pf597Crgx+k8XvvJJnYLBd32fslh/NvXis/T2m5+wdJouTA4B/DP3+JZD2bEkmbM5ZsV834djT+GR+/3l/Fyv48Zo37nJ/Xy569d2L5eTz5Rllrt+0hM3/23bK8doW91pfZLOuBEvX3Hz01hCHaz0Z7ZxS5dV6P1t62BdF/pzdmzP1cZi7xMVATAGOjUJ0dWiaf1Csc+KczYMSNiTWTNlFIHL+ADvmn1MjaS1fG47B6Shj6JgToTuN2Fj6QsUjWly4TNyzJmSJvBDGLtdmsbOOXvrzPW5S8E0Qca8JhyUEQCgJOY8noP++Iw8YLmgngGwE+L0YjKaLqVdZTcANE3TFaj0RpaeU+ztrK3Zq9WKti8sMJIpF6g26xT/X4qgxGJT6rsiIHzlV7pybg7ozZoZm+efzWJaKrE52Ev3YBtLgd3nOcd8p7l7EOZuB7HlZ2rP0gjAfTDGsuMGdV8mqBcAQF9yz1vAtNg8wjF+LBNbvaZwGMpLbARc3ghW9MPlEGIMICpB5scjuwGAFZAy5YTcLHi9XncpdIj2wzxc6QlyRAG47qfTqUz5fCWgFchMRXZlc1Xtb6J5TOU1FbItyY2BTRNGKcOh8jt3D+tY5qDgtl3jGJS+Y6bQmDO6PetIkLmOV6XXzxzLlJnzszO5++cllCFYLrH9J+Q/L3Nz2AHj4krhNtc5HdhnqJPXGPWP/n180GdPhy8Frl4Tz9UR1kZ2AwDRoWKRjQFVdZVDn40BMp8+K/9N3v4lDWw6LxVzDMo1IvMAsVdXKs+4Vjz5jCpl1PJ8keWt03GZJo+ltKtQSlCwl4zJu9uXS9J27ByZew7UMXGle5Hf2/42MXf5OHZcOTKPqW2APEDBAEA8eu6ONG7Hw9K9WI8Zr37EME9D3ZeDax49R33LHAnx/DdFTS2hfrIbAGQD0Mp/+Z+9k1lZzJsEu5iqgobeo6oqOvauWNY1I+vNtAmh/h3E4/ICZ3gD4jmRW8Gbuv8Z4/o6qsPUb5qOGYPSFTy575+aPimA5PFzYen1l4M5R4RMTeoyKr3/BADkQ4/dPqcqsCy00afvGhqyMj9cdTz2/B3yEc9c11ZLwObsZmKJ+sfsBgAis5ehVO6vVqu9SIC9TYJfRALI/3ydKZX/2oixFAFJwV59qzRO2ruYDQA6QgSMg8vDV0cD6Ha2BCVQbgV9rCyPdf2QCAB57FzqPbZ8Up8fy1jXt6UAwuT0uHEZBQEAAJQN+m7gWueB+dJnfp6i3nM72C0VlNs0+Lz/ddYDuS5eQh1lNwC4FExt21LTNJ2ykY0A/L9tW9ptNsbz5XVSP7/NY9b0uz7vGAmdjEjFc1VV3ogPMC7aY4jrwrT3husaLnIvTJY+gYl5fldkztzLhSldPn2MKb9LVBSU/j5LaUdzJXX7X/r4ApbN3A3kwM4xr0GPCaQAAiaWMd9f0dVGwEN+ArCPS4/rO3aOVJ/5zGcjrzCdh6NOCVRVFdUvDAFN03T/bd6sps92I0xwTflx2UhBdBXNoPcsCL1+LN7rx04ERnr+qrra44Gfl8vs9PSUiGhP8bwTUR+1Jy1N9vId8XpSpvoq4ofStu1eBA5/putBtzn+7zPazK1+xr5+bgWR7/5yY2hG1rtMC6W9xvUCc0hZ5Rhk+9wztwIkdfnIFGxEh5FuuSdBc29/Y5KifZn6dfm3bvv6unMqPxOljx+p6bMgykHp5Zea+PffHVynX5RtnCKlqmI3GS57/PQz7fw4pD3HztnAdAyZvyypflPPr8e6/tBUPHr+bbp/6jQ/LnLPB67Lf0Vt21B/Q8BY93c7/dqi6kPlyz4+z9uQMdSRlMujruvue1MmGFvWEG5XfL6NpmmCns/0jCHkjszKHgHgQzcq7RW+qq5zxbPinZXHJgWpblDzHv6Wz2azOTCosGLZpQCf+8SmFKQixzWo8TGuv8H80ClAkBLkuEA9AwAAAAAAUA5YY68Mv/f5iawSx4DJAIMIuBkZAKRFR1bgSiiHZdogabmRysuD6xy5AJTOdrvdM+5I73KuP2n1098jbVA80ttfl2/TNEYr5lI61mNXftpy3knPf5NB4NjLbUnIupVygDoGAAAAAACgH2PPoZey7p47WBtNhyvFuk1vvDQ91VCKNwBor1Op6GVlf5cO5kU4h44G0OlKiFDxc4PrUEYBrFarPQMAK/tRt+Nj8v7X0Tim4zEQzh9bGhAY2I4Hk4EH/SwAAAAAAAD5MEXgY/2dnr7rIOhGxsOkzzVlKuj0hYpj11/MwgBgUzawB/Jut+t+l5sE13VN2+22EwKds7xt2+R7GIA41usrEWVjD9e1bNRS+a9/+nLoATcmw9tK7bugjQCy8wXLwDSZ1AYg3x4AYH64FhGoXwAAAAAAAKYHqXfz4Spr3z5YqKdxcEUA7GULAQfMwgBgs5hJ5STnhGfFP9H1pqlScan3B/ApiNFI86IV0PxZtyeATAclNl0mQt2NiQ6bYkOMNgQw8D5YHra6RgqgZQPvfwAAAAAAAMYhdp0E5X95mPSURKibFIQYYEzlj7q4ongDgDN/P+3notZpYOTGsdIQgPzw88GkzJcpnUjJBKd/YiMPiMfk4W9T+Jr2A5gzvndYuqIbk5fjxhTZQwQjAAAAAAAAALnBfHx6hqbzQRqgaWD9r3YiBlfMygCgP5fpSOR/Vg43TUMnJycHOaBko9tBIIqGN3NmxT7TycULOajrei8lSUh0BwjHtHGKNKjpYxl0uPNGK3oxcQEMjAAAAAAAAACUA6LwwbGjM4jY9jO0sfT1bfEGACK7sqltW9put3vH6ErdbDadgljvD0BEdHF5aRUOvkefZ5PpaUxe0fr5Yzvo1OebNn/d+95zTfbCt20SazLK8Pdte72xs+0e/LNpmr3P2CDA8qFTCGk5sdW/j9DjfOVYMtLjXxtZ+HuJNLZpo1xfL+LU5VR6PcQOUL7zQ6+vj5PtWrYlrmPenN1nhCux/Mcc9PvUn+nY3OWjx0FdNrKdS0qZOOUeX1P3b1P3j7aIEE1o/ZcuP0skZp6DiLB+2Mpr6PpiyP1NEdTX35Hz+XzkFoMp+j9X+Y1whxGusY+sSz3/Cmm3ueccfRjqeTvW9W3OiUPOH6Pcp65f27pe/207bmr9Rd/zfYRePyQtjCmivk8WA5cjXipSK1BTX993vuw/TWsg0/PpObKJvvOuY51vycwtRId1YJJ5+Rnr/+T3fehzvE0WXOSu11kYAGLQCkveJ4ALvq5ro5Iyd8WA/miFBBsQTBZArYxGfcchO2RTWeaYnIBpMCkCUd8AAAAAANOByDwAAPAzZF0acg7633EYYkBB5Es4szcAhHq4soKff+8ssy889fkzPk4aA0LvBabH5HEgvZJXon5Nhh6TByLqORyf4l/uyaCPQznPH5exB/ULAAAAADAdmHsBMF+gQB4HfwSB+/w+kXHyWOg4xqFvyh7TecDO7A0AJnSqF5P3N39XixQ0WonJqSzQiOMwhY+P6aXiuo4pdQ3RfmidLYwT9e7HVpf898rQvsase9RRXmR9mkJY9bEAHBPonwAAAKQAiiYA5g3a7jxwrW/lOljrGcG46CwfGugZwpm9AcClTNQe/CYDQLvd7imIiejAa1xfE4Rj8gY2KQzHRir6Zf3qqAD+Xp4DwnHlgDS1TV/OSDA/tFFHW+p9USIAAAAAAKA/IQ4YYH6gHpdNqEc5yAv61ry49IgSk74X2Jm9AYDIv1GGy0q0e+HhLxXD8m+dM16eCwtfGdjqX+b5N/3Xx4Jx0QYWHQUQeg1QLlrRb6rXVJE/AAAAAADHiN7HrE+aBABAeWB9NB7+vjBuU1hb2h/oBsfBF3Vh+hvtJ5xFGABMaA9wokNlVdu21NJhGovVatWlLtGbyMp9BEAYKVMA6Wvq77ThRqekMW0SDANPOL7y4RRabFyT54xZ/zbQTtNiSpsmv4PyHxwz6J8AAACkAusUAOYJsg+UjS+Vra3e0B+PQ99y1EYA1IObxRoAGFNaCltEgJ5IsSFAKv+hxCoLWz4wm7J5t9sdGAEkUFT2IzQfm6l9oZznT8wEFgtXAAAAAIBxwfwaAACG49Nv+M5D/xuHqfx9aaZBONWnf/8N9wEeBU2sh1usAqiq6qjz27Zxfn96erqXGogNAU3T0G63o1ZFBLDRoK5rWq1WtNvtuuO1VaptW6peKKPt7+cp/6C3HI6tI+s+j72+uJ70Eufy9cqX5/q6zKXSv6quNoHWnQzXmYwYkNfae/6RFJim6AV9TxmZws8nNzMuGWv5v4jAkGUuj5fvZ4vkMd3H9ndppH6++P417nyWV1MqNYk21E41gcpdPrHkvj9ja3d6s/Wxo4BKr7+hHiyprj82cnyUk/Gx2m3s/NE3PqaWH5snUu56Y0KfY7kpE+cxfxqKqZ8NSYE5Rw+6lPNzG6WVT0g71WuKGEqfn5WOHp/0+/rWn7nnT7HEPn/u9w+9v573mubHJTL3cb6PftKUbsY2nx27XHzzQ/v94/rvePzza1PExPX8ot47Vv6Ux9mQadr5+JJktpRnsenJFh8BEAsr7rViipXVO7IPzKbOPfeAC66xdRZsjLB1/rKjKqWBzxFZ/rJ9DS1TtK3yMA3+NqUEWB6yPaOOl4c06pQ4FkLmAAAAlA7GqmViSyOD+gbHCq8LXYYP6NfSAwOAB+mJzkp/6YldkdhPwKHsQmefD1fZy9Q0Ji91254PscrqpRBiYfeVPyO9xfsqDUv1sDx2XF553H6OvQ0tHfSTywaLWQAAAGAYWL8sk9C1LygL1M04mPRmprTs8nswHTAAeJAKYpkSho0BehNZiUnA+XMsmqfBFtYlFfz6GG0M0Ol2MDiE4yt/bXyR+NL79PkM5MGWesAmC2BZyLEO9Xs8oE0DAAAAdrB+mTeoq/mDOpwWk04I5AEGAA86FYzOSb6ua68nq0ngoRCZFltOtYrsSgoZ9SGV//I/OrAwQnKTmqJl+pQv6qI8fJEcJkOA6W8wT3T9YsxbFrJepYEP9QwAAMAF5njXoCyWR8i6F+TDF6GBNjk+KNNygAHAg2kzEPYIr6qKVh5lJfIf5yW03HUqoC7Fk1BK86bORNepgY69Xsd4f5cBRiuFQ58DiqhycMlIaP2CeWIy6qCel4Utl2cJ9RySog4AAADIBVJhAFAGmBOmIaRPQ9lPCwwAAdgEt21b2m63RHSdEihkIN9LizD+44IAbBuSao9GqdwwRQOAYZh2tdflTHSYM07vs8GGGgkmz+Vgiuog2k/9ZKtfAEDZuLyk0J4BAAAAM0gBNG98deWaA8HDPD/zdxTc+Q9xcqg/SY0rKma+9TBPYADw4MtDvt1u9/YHMOW5BmWh85JL5b8+jutVRgTw7zIdFAjH1MnrvTZ0OwodGNDmysOW2kf+DmXhckFqJwAAAAAAO5gbLQ/T2gZrHQDMyn+tnwPpqD79+2+4D4isgCHn9zsn1oIVp8TlJ9XpY6SimMQxMoVQ27bWCACTZdLoLWA5T97T9b0P7/GxIfacSkkYT2QZBTyg52vP997L76cA0sadpmn26pW/M9WfVnjq713PrMtot9uFl1FCUvcPdV0Tkd1K7EuxZft+rHILTTGRKsQ39QAZm0Ijtnymuv/Q80snt3yEHO9aHIV4WKXE1k/3va/t/NT9d+ry885PxHsOKUNf+ZgiwPrgM+LH1v+Y5Zvi+qEMHb9inST6vN+QtuQTn1LK30afdx7ibZx6fF06ueXj2JmTfJrmvHAyc5O6f/aN+zoVcGntferyGZu+zz9Gey+pT5DzWz2HHuc53RMgn/xXlX9+7lrftW2cflivL6Y2HvjqILaOUo9fiABIjDQMyEGCFbjyOMakQC5tYDk2WMEv64bI3BlJdIoT0I8xFUAmz/NYhiqCliILc3+PuT9/alKXT0mTbQAAAAAAAHz4dAGY38aB9VnZIAXovIEBIDFS+csNRUYINMKL22RtQweYH70/gPbGZ0zWTiJ0hDGYLLo+o4s+36Z8H8MQMHpETeL7j01qC3Xq86euf03p/cLY9etrc0OuF0MfL3S9V0Vo3ceeD+yU3n5igYyAlOQenwEA+6BNjceU8/8UY/XcPfhjmVMETx5iIoT6Rc+6siyEtgPUV1nAAJAYbgxN03R/SyUyVdcpb2wRASaOxavcOwBM9BwyR71U9GsPdK3st9UjOsI4QlKJ6M+0V8YUdaDvH5tKxHX9EiktRHTq++cmtYIn9PqyHmzKb1eoaMh1U2DqK/j5+5Rt7PlDWbp8grzMvf6gAAdgucypfR7Lmn5JoK7SMqf2Oz92FGoEsDtRmo8zRcCY13doPzmBASAxq9WKmqahpmm6FDJ1XdN6vb5SJNNhI9Ee52Q4BkyDVgBx/ex2uz1DgO4gTd6esm4xcRgHW7vQ9RVqmIm5f+ixWhkaQ2o5WroHRmgO8LkS+/xjlY+Wff/EcBpKNyDNXf5AXiBfAOQD7Q/0pc86JbUD0dLn/7mfHwZoN771R+weUMCNL3VxiOd/zvUdcAMDwESw0piRG8oS0Z5nufwvv9eftW1LhAnkJJjSNsg6NXWM2gggQQqIOEIiK3R7CTk/NXNLBxW7AMgd4RDrwZ56AVR6HzB2/Zr60D73M10vBqQAmjdz6ksBKI3U4x/6OAD6gTFtPHL0T2PWX+nrq9wOMmA6THXtU/pD+V82MABMhFbwc0QA6ZRAdK1YLlGBOTWleCDofP/Ss1yHPfmU//IaWCC58aUKsXkA6LJNVc6h8umzpKe6/9KJnSDn3gOgdMbqf4ekAAq5fu4UQKHlYzs/N7kXgLnrt3RKL58SZDiG3AbgWHLXPwBgOK7IZKwP54OtDlF/caD8ysCmv1itzGmVh6zlwPTAAJAYHsSlcp/oOrSppSslZl3XXVSAVBA0TYOGkxE5CTN5rnJaJ67fKZTOx4QpZYjEtvGy7TpjE3rduRoAlu4hmNsAkLpvj72+L8Q29Pomz/8Q2cktHz5KH5tLb38AAABACuY6/pU+rwBX2DycbY5foB8ov5SsKGQfgNC0PyYjgKv+rr7v+chgVKrf/8xn4y6QSJEV2oHmHuBXyoLPymCZ4me32+3tAaCVmvwZnyv/ruu620Ngu93uXcNUZroR1nXtfH7fNCN1+VVEe+9NdP0eQUqiEe4/BrJO9H+O6NAbPYdeU/5uihLJSXL5ULIuy5Dbh8aUBki3Uf7fpz6GPv+cz8/Nen1lo5b1KPu41DkgU0cQlE7y8VPVn65nk/FV/p17/M9d/7ZyCC2f0OsPxdQ+XZGNfcld/rHM8flNi74xrhVzfqpQc//zlT1/0GuOUiKPQindwB5L3/WtaRx0eV3G3h8AF7nnX7nHHx+l9z+l4+v/TOsH199Tk6J9hGYFGepkZXPU0notIqKmaQ7u3ycCpm3j1teVMF7wbW3ROMbzV2U74NmuY9Ihu86Vay5Zh4gAyIzN8MG/X4farGi9Xu+lBnIpLzGxmwZbOgcZ+SEbnvZYt3UQqL8wTB2jrexKmxwAP6Y6QtsAAAAAAAAAgGUT6wx8bISsk0Md3MZ0+gDjE2IgMEVuwABQCK7cf521Zr3u0gJxaiDTsWA6XCFQpmPZWIBOdBy0BTTEoi1/grJxeYDMzZsRHOLyUsFYtlzQdgEAAAAAgAvXmp4Izn1E48ypQ8vZVd6Y2+dHZsngn6b1NAwABWHzDNepgeq67hrZdrvN8ajgBaZGJevOlLLJZgRAp9kfV7iZyyiAHI3zwFa/Y6U4AfmxGe1Qt/PH1M9y3aKOAQAAAACAxrQ+93mjH9OcUs+hY+bUpjWYaZ0dcn3oVfJgy5igdZCsf4QBoDB0BbICWXr7czogebwtR7ZvDwAQh0mxLD8buknwMQ1iY6HLXiqf5HdQPs0HU71hcrE8TJNYtFEAAAAAgPLAXBxMBVIAmbHlgw8tD5/Xv0RHAJTe/v3PtyyZcUXTIwJgRpiUyLvdrlMk80bDrODXewOEbAACpkN2nC4jgFZag364ysy2uQ0oF5vXP+puGcxlIgmGIQ05iOABAAAAAAChuKL75U/mGNcVQ6IB+qRWckVb+OoHpMfnXGyqSxgACsJUgZzLSS6km6bZ8yzXi2s2EqDxpce0EbOpE5V1JK1xsq7QafbH19Hp47CZzTJA3S0bGECXAwx2AAAAAAAgFKQA6seYKYAYmz7Ftm/ppHP9Sj5bq34eD1q3qNuIzVAGA0AhmBqPTWkpK/T09PTgWFnJTdOkffAjJ8TCKuvMZqUzddxQmsThs07LY0CZoA0cF7IfhBEAAAAAAACA4wZpgPZJuUbirCM57g36o3P9VxURV4/WGzPFGADGtlpNhS21i/TYlwoNrfT1hdy4cjoREW232+46Os+83h/AdN+SlKHymVwdT0mEyJ+tnk11oi14l5eX1jparVZd/evn0REkMc+fE1keWqHve3ZbuZmuaQt187UJbnM2TJZxW58xhNgJUe76H+P5XQZSH77681F6+aZmrAm5Kee/jHDTx/JnsfXno/T6s5VvaSHQtuf0RXCV8vxLJaR9pqyDlIvXKShdPm17T+We609F7PgUO76PMb/zrR1i7nXs85cUlLSmLo2xndzGXP+MUVeh85yp5KI0hbl+HtZP6DWyLRuCTZcmr19Sm+tT/r5oB9O50sHX5OhoczoN8fYfqp/oU/65x5c++p0ccmW7J7cbvcer1mf5HMCLMQCA4XBlc1ogSV3Xe0oxLSA2j3QwPaY0QHIB5+q05XmlDYKlYRrYbGWGNlE+feoTzAdbJADqFoBxwPgGAAAAgBzYnEBMRhPMV8zYshxAv+dmrmXiMwyFAgPAQrBFGsgc8/xfbhhsEyObBRakweYBGxqtgbQZfkwGFpfhBBOO+aAjLUrzgAZ+fBFv8AwHIC9odwAAAACIJVSRaYqah54jPGogZN42z/KUGS4O9wDwR2CUPZ/1RXCYdIK9DAAIAZw/pnQyq9Vqr+44lQILlDQCSNC55sNlBOhzDT4PHKLlWm6iDZmfH64JIdpA+egJTh8jAABgOhBlBY4NzCEAACAfmGOEY4sE8OFyKAVlYHIGNjmtyp8+EAGwIKQiU/6XnuTyf9u2tNluu/NNCzp0AGkxKcDk774c175cbqi/fqC85gdSAM0bUzQO/+2K2AEApGfoohIAAADIBcaqshmyNwJ0G4f0naPZyhnrqmnx1ZMrlZPUcfiiZWzAADBzbGkRtBDY/ts2uUAnOx2uTrfvJjGoNzc2S7fEZl0F5WEKkUMbmCeuaACkAAJgfPq2I7Q7AAAAAEyFae6PtblfJ9SnrJZYnv75atnzWVfKHyKzzlaf6wIpgBaC9OonMu/mbfrPu0ibNggG+ZB14bLkyT0eXNcBdiupZIhHAsiPS1kM5gNSAAFQJlgLgGNjqCclAAAAN645PVLz9mfo2gkpgMrElQHElMKdyL1XqAYRAAvBlC6BU8iY0gGxYNV1fZAyCORDl/9utzNadOXfJqUZ6tGOL9IFg968QAqg+RISpggAKA+0WwAAAAAMxbRW863dsG4IQ0fEm8q1b9mD6fBFcMRGxXsNALvdznjxsRpfbIBGblG1KWClN2rKHKrdvtdtSySFhCMCXvwuj2/blnZNQ0REJ3RlZarrunuX3W7X/Zd7Csjn5/8sHwfP1cOCKI/puylriUOAyQIXKgMmRT4bbGSUhykyQEcN6Ovqc9u27SJAcjHlIO7Kp8bospMRMqafoTncfM8xlNwRXLGTBVffGYKW/7H3MIn1AIwtn9yTXNcEo2/fbsK3x0nqCJ3S20fu+vfRp334vFVsx4Re30Tu8itfvvqcr+uKyNN8rfPD8cjdPtJ6iKcav1wLyz7PnLt9xRI7vse+v298s3nzzb3c54Kv/n3zF7DP2HIbWz9jKztD3y9X+51auet7T9v8wLZG961B+hoGckd49dnjUescQt6zeaHnC71H6HWvj43VH8XOD2X5teonUduOM3+y69rc5Wtb31zX5XrvuGvd6tXxu92+8caki+1zfw0iAI4cVvhztAAR7SmcXWlTfIt7kB6bUsW0wMMCYhi2Mg6JmMldzqnbZe73S03u+o29/1jPn9KIvWRQTv1A5E4/4uULZV0yuccfsGwgP25QPmWD+gEA5GJo/+PLOMHTvtQ6VhgAjhz28ueFNyv+2RjQNM2ep/9QT2iQBp373HWc/GmKTAGHuDrdOSir5qZAKO15ls6Q8kYdTcfSy9pkqJ5DvwrCWLr8pmZu4zcYDuoSAAAAWCaHin+T8v96zpc6ghYGALCXToaNAGwI4D0C2Ahg2ysAhoB8mELDpGLFpfyHomXZxIaITUmJXua5nyF1CqOlXQ+URZ8IkyERapCf46b0+i/9+UAZlDj3AWDuYH0LACiFQ2ddcwpjU5aV/fPGAQaAI0dvEqwX4TL3PC/S2RBANEWOV+BCb/DSR+ELT0s/sTnIS1/IjZ3DdoxnGLPMUivQc6dYmkr+bHWUu/8ovX2BcGzRAC7m3v8C4AI5xvOSuv+A4h8AkIvcKUxBHCjfedBn3wab8j8FMACADu3pb0oTw0YBWwSA/h2kxZY6wZQaSH6PhcY4lF6Oc4oAIMLz9L1/DgVo7jKZE7kjOEofi5ECKI7S9wBAXwFAGDnaSm4Hh9JB/1U2kF8AQC5Cxoc+fVRqj38NDABHjs7tL2nblrbb7V4EgFYms4eSjCDAAn56bPUnN3bmn1NaGOeOK6piDouDOdWxqTxzl3Hu8ou9/9gGgqlTAOUufxAHUgCBlOSuf0SggDEoNcIOAAAAMIMMIC50BGcfx2ntgJ1CbwcDwJHDBoDDzSmu4E2AeV8AjS8aAKRFpwAyfW+K5EAdhWMyAoSGdJVezrHPl1LBUYLyJLeCpzQDAACpgOMAAPug/14+SAMEQBrQfwIAcuEz5Pftn8ZeH63lTfp2hiEPgw72GlNlTp1jUuPLMcrny7z/pmgAeZzeLFgfL7+r6/rgXnrPgZSkUICGeDKGpuKR+y7I/Ri4/Hz1t9vtunNkNIC8hv6v60o/p8kq6Xr+MdEyMvX9bRsqm2Rby4HpGF/9+WQpd/86Zvs0XSu0fxqKlnP9s0/9lIjv+UL3cLH1B7HtL/Z8W/8b2r5Sc+wGnCHv32d8OXbi5y9h1+8TodHnmXL3H6mJ7X9Dxh+f51if5+HzxyJ3+ZeOnJ+bxtTS1z/HDsovL665whT6lbkxto5Pjk+mY6dOYVlahLIvpYtPvyLnXVJnE8rU5T82faKCU7T1pmmM177+2/18Jr2C/L2q6oNzJKb5Ycx76vpcn5+fdwpGqbh1MdRgAOaHb6GnOzCpbNayZFOIlswcnjEUU12BeGz9pc96i/IvA9vENffkZwyOWcaO+d0BAACUDcYoAOJBFoI0oH8aD5Tl/PA5XYbUaYrUPWOxPjs7o91uR03T0Ha73TMEAGBShMm/2YNFItMC2fYYQGc4DdrrXHde/F+mggqNTgBmC3WIJRhlWwaucQ51VD7w8gIAzBX0XcAG1uAAuDG1EbQbUBrLTfMWuwdA3gjtPgzJwFC6YXLNC+jVakXr9bozAIRGA4Dl4ws90ml+pHc/GwO0PEFxMw267mR7l9+bIjZsQIl9DZenzcClUy0BAMbFNJYsJYIDAADAcvGlEQUAhIF2A0oiRmkM/Up+/IYbe38zB53P+uLiotvglf9LA0DTNMVbMUBabFZ2VrK4FKB1XXfe5TqypAQjQO77p8aWgsmUI9uUT9GlSEM/cIVuA7Jd6KgAlFlZIDJp3uhxiIgO/gYAAABKwxQ1CicpAPph01Gh/YBSsBkDfI61IC8uI05VuffsKT3DwHqz2dBqtaK6rqmu684IIAXTtoEBWD42K5ZWtvCxOgpADsSsbJ6T7MRuAlMCpskQp26SKZxsymoor+3YykYP7CGb/wAwNkvov3wgAgAAMEcw/gNEAAAwDKQASgvGp3FweZJDv1Iuvnz/Jh25/Fk6a14os6c/K2pZgVvX9V4KC7kr8VxeEgxH70JtahA6zYltg18pTwzvsg3SYNqjgYgO6mqIdZqPOWZsnlv6M3h4lYmrDqBEnjeoPwAAAKWC+R8A44H5HiiJISmAiCDHpWCuv+vfd7vDrBr8e+j1crLmFC38n4gOogGk8h+LaqBTm+gc51KxvN1u9wxKOhIABoD0yPrQ0Ty2FEAgDN0furz+YekvE5sHOSgfGNEAAAAsDYxtAACwHNCfzxtb9Wn9p81BtrQxvfrMG286D1iv1wdewnsRAS8iB7TiSyqATV7G3fGRhbGKPH/nUcb5Kkt+y+8kUyqx4aRpms7AIpWxqYUh9vre833lY1Cs7cmDoQykPOkIBHnMFKQuP5fCWCPTc6XcpFs+R13X3XPaDD2ua9g6wlBluN6sWD+LNGD43iUn1v6Prt9H9w9D71MSofVrw9v/JnhfW9jfkPC+UlLwpDJGxfZvpclraZQ4P+gzZvWV/9jj+15v7lRVbP/h7n+H3H9KA3ds/faR5TnQ9x18dbWEMikZ25wQjEPs/BN10h9bn9EnHzb/bVv/g2mYW/+0tPlfbPmXXmex62Pf/N/0nUtGpGMz0f74YPLwb9sy1vdDWfsO0Eop/b9WEQI6XZAW4Lk3SNAPbwOwLMB8kSbH5k2ds93YFsmIBhoXbeRYQl+5hHcAAAAAAADzAfNPAAA4Tkz6KZ8jms2oYPLw33cBnx9eAwCnaJHpW6QnsjYAyP9t2x7kfNfKRKgPl48rj3xF+8pOX3REH4vfUhniiRx7LyLzxs8gDtcCZSlGgCVwMG5B/gGYHLQ9AAAAAAAAQB9CI9E50wZjMgTMXT3jNQAwpnQjVVV1KXiq6mqDV53rnRds8n9MigswL7TMmP7WYTfydx2CY7rGkpEKjxzheDbvf64X2x4Ox1RHYwIFV1nY6uLYIpAAyIGpnaGPBAAAAAAAAJjQTpQmXaPE5/2vf587XgOAXoDJND9VVVH7Is0PK/u7yACR/96WEggLueOikxm5mDd8LmVkvV4fpJXiax2Lh7Qrp2Lq95d1Yrrf3HIEloZtjwSUJQAAXOHbUwYA0B+0IwAAAGB8sMdOXnzKf5/eZel6mGADANG+NYQVsbsXx8jUQGwEkLDy3xRJAJaLXLiHdna2qACTAWHpuNIhTYGvzHX9HlPdjIFUaC1xMjD3d7IpHBEBAMD0YIwBAAAQwtznnwAAAIYR0v+b1hN9NiyfM14DgCyI1Yt8//JzXpDpDYBlGiB5nD4WLBupwPYpkSUy4kT+zTKlv18yJivllBEQrg5St2/QDxkVZTICoEzLwGaUBACkAymAAAAAAAAAAKHYdGcmQtP87DslRz5gZrwGAFZQuTyy+Xep4OcogPV6vbexq4wEAMvHFQFQVdVBC9JyYVLwS3k8BgNASZj2AUFbHo7JwxxplQAA4JqD1IEYdwAAAAAAAAAKV6S+1l/r447B6c9rADBtwsq4lFZyc1C9R4D04N5st8ZNgm3X18eu6rrXC2t8Fev9/sVPU9SDac+DsVN9hF7L5lmcWrC1gv6ggdF+udg2jSbaV/zzT95rQlr29LX0ffuQOgWIbF8mpAFORz+kQitafM8n0e9jM9DoCCL9mb73UpU9XF66zF1loKOycjLVHhS2+6WQC5v8m8o/9v1zpvaSP234ni91jssx6nfIviWhz+0zQPvap+/9Yss3hXz26Zdjn19HSPmuOXb/ECv/6evf+bWX2PfzXTN1+ccy94Xd3J9/6aRoX32un5ul58Ce+/NPSZ+ymko/Mfd1ZejzD3UwK7F8XM/fV15C15dDy2+M9Y9p/hvaPubeP/Wp3yGpfEJ12kMpvf/yGgBiaZqGqqraiwogui4YqQDT6V7078zSrTJgH51CSP7OCnFtBECKqTIYSxmwVI9PPZDbDAFTpXsqGZ8yEiyP0uu39OfLTe7ymbsC2X/95Y2JAAAAAHCT2sB47OSev4JrbOt/lw4FuEluAGClvjYCyJ8MK3NNewRoxVh3Hip70fhCd1iOdAoqHT1gAp37+OgylxELtogM/txmfZUGvzG9r0vCJudcfro8pvKQKQWXF/eU910aS38/TS45spH7/gAAAAAAYFlgfhlOaLQrFMzT41q3hco46u2Q5AYAHbbCSi3+rpK/K0Wf6T84TnTd66gAov2oElM0CQbD8TEpom1pvIbgGpSX1h+YZJpo3mWQos2V1I5LepYhLD1EX2KaRNre/9gMbACYiI1AgIciAAAAUAaY2x7S1zEIZTgNPqOMyUATYrRB/V2R3AAgU/zIyuhyu7aHufN1nnP26OaffA0iotjqO3YBmBtSudy2bZdiSv4nupY7uReF61ogjr5hWCaDgb6GL+QLHBdoq+OTP4VJekK9R9Cv9KeE+gVgqaB9AQAAGEKIk8sxU1pEMLAzpG5sin9wxSQRACZFa+fVT9fe/60wBjCc4oUNBiYjAFguvkavN8nVhgBbGinIThp0WzdtkmlT/vtSAPHxps/nSoynQQnvP1U7QgqgNJTuoTt2+dvkyBZ90/d6sc/Tl9z14yO3fKUu3/wGtLLrHwAAAADjEzL/mEu0eG76zOWWvi4sDde6TQODVziTbAJMdFiBXWWodD9EtLdZsI4KOEgPZFAwguUQopSR+f5N0SR8jJQdMA6+FEBdpA8NGzRt5ywlEqCvgmxuHstIATRvlvR+rndZSn8CwJj4x6fY89HmAAAAgKlACpR9bArmEAdGkI4Qx8cQL3+kADIziQFAK2WJzBuCsrJQKnO1h7feE6CBAWDxuBq8SY74d5Y5/t3UmYNx0B782uBiMgLEeNwuZeD1DWbyc1s01TFxzO8OxkXOKQAAAAAAAADHgSu6HIrisnDpS0I9/7Heu6Z644034y7gaRixDWelNgmWhgRppdtut9Q0zYEnePIQbqWQlM8on4+fTR5D5N/DIH+IeXpMBqKx0jyt1+uD6+lra6PSXv0klu8QDzktT/LZfUaN3PXrS91S1zUR7dcB/y2/l5/NsQOXMkU0Xv2Z5FveQ0bASMYqw9wpUGJJ/fyle8DmLv9YSn/+1M8XO7/JPb/o8/ymsWS32wZfy3z92vl96vlj29r3KBrj+rHkvn8s6H9BSkL7V3ggAjA/SkpROGx+szxvdflOoU6dtnlk6WUyp2c1oevHldHB9Hvo/Nuk03Pdb2rs4797/eHDN78wlYP8PXkEQCymqACt5Ce6UhSyt7dJocvEeiCDeWFKQcW/r1Yr5wDi87gupXNZCsdYnmO8s6sPg/UbALBE0JcBAAAAABwfpRv4wTXHqN8pneINAFKJb1L8s2d0XdfdMU3T0G6321Puhnp0g2XBMiDlRsuPNhhpXEYk0A9TqiAJ2mk/XCFwJgOna08BAAAolWNPfwYAAAAAAPxgvlgGvkwQIA3eDBITPUc00gjAf/NPveGrTBEUkiMKLBdXnbuUzbbz9DmQKTemECSpyPGFKKF83YSWD0LQAQBTE9t/2/aWAQAAAAAAIBSsfafDVMahURuonzTI8i3eAOCzHO12O2rbtksVxBEBOve1KTUQFpPLx6aw5596PwlXWijIynB0py7L2JdqCdjR5QgAAEvCNnagvwMAAAAAABqXPgfOhdNiMwa46if5Hq4Lx1e+xRsAOEWLxrSpKx+/Wq26lECm87GAPB50HWt5GZraB4PHMEyK/mMuyzFzGLr6NSjPAABzxpc+DgAAAAAALJ+QdSyyNeTH5ciN+kmLq3yLNwAQ7VsxTLsb6zQ/HBVQVRWt1+sDha+MDgjdRRzME1+nwvXPMsGwXJkiSeRPKFLd9EkBpMuW6LBewD6+CADIJwBgKSBSDAAAAAAADAH6m2kYqpOAMSAtXL7FGwC0ct+UwkUrF1mpKxW4EvkZDADLxuftz6mj5ICgN5zW15I/MYCE4cvljA4/DTbPf5Q3ACA1sSG8GGMBAAAAAACYL5jLl0VxBgCXgGiFbMgxTdPsfS6/r6qKzs7OOsPCbrfb21OAaJgHcug7TLG4zd3gbApHm2KSle9j7dHgqz9tCNDyoz+XsqKfV16T/0tjlOm+ts/183NZ8N8yyiUlsdcPfU/b59o4o5mTIntIfQ0pf5PRK3QjzdB6mgsh40VKfPLpizDy9V/HniPR1jeEGrpM3w9NCzeE2P4rt3z7GGv8kOyXWVr5L318HXqfscZNW/ubysMud/0ee/87d1LXDxzMAJgvsSlax0zxOuT6vmNT33/K9+tzr7mMy7n1G6H3D1kzheT0911jrtjXp6mv73aALs4AMDY6gkB6dxNRt1cA0b4yhvcOsE3gOoUwHTYSeK3Niz6LV6lQtUUI2P4G/ek7wSq5zHP0CSaFvktmpcEFTINNCY16AAAAAAAAAAAwFakNPCAvR2MAkMp/IjpQ+vNndV3vnbfdbvc80uW5fJypESDH2Dxw1Y8t37/0xHdZO1H346Pbmm+T8FKZSsFrSv1jsgRrS3Hp5bcUXOWM/gMAAAAAAAAAQClgjTpvFm8AkOhoACLaS+XCP6WXbF3XXSSAVvab9iTga8AAMA98HuS21Cm2TYOlPECJOi62CAut3Jb1VEIduNIdpX4+WwiYvr9+FvRbAAAAAAAAAAAAcAHd53xYvAHAp+C17RHQ5Uhar/f2B2BDADgOfDmi+W+tdIYX9XiEpFYqtax1Dv6chgnt/R+6LwVIx9L2XAAAAAAAAAAAsExcei5kwSifxRsANFoB5osA0GlfqqraMwJUtC/o+jqgbHwKOFOEhzyW617Wuy0yBPTHp/w37dHhUnLnRKfeyWUEkOhNaImQAggAAAAAAAAAADg2QnSYcBycL4s3ANiEkpW2WoFoslqZogPYCKCbhymKAJSLy0opFaF6LwnOPW8yAujrg3EwlaXJgFea5TlnCqBQmbSlAIL8piW0/wEAAAAAAAAAAEoEaYDmwVEZAEyewT4F2WazodVqRXVdU13Xezng27alXdMgf/bMMW3yq783eaLblM2o/2nQ9VKi8p8p8ZlM0S9QOE8P+hAAAAAAAAAAAACkZB2t7vEojGyKdpuytfftaeX8vlq5vyc6TCGyd35VUUtE26ahZrfbSwVUrVZ0VtcHewNURLR64RHetu3V7y+Ok9clcczBewUq4ko3PLjyg/XBt5eD7bi+19XXdkVy6KgAfTwbjmybSJvew6bA1mmGxlJ2xyp8Q+8/9Dld9eOKuuBj6rre+0xHdMjNnEPrwvd8Jlz1mgtb36NTFRHty7r8XW+G3ZdY+Yu9v4+p68cmn6ZIJPl9Lnz15y8/9/jr5zCFlfw79P77x8n9XNSYrX6vquv+xfRzvV53f5v6IFP92dJx+QzVc8T3Dn75qqPOJ0o7/vnfL+r2XlzRRVf3D5u/D71+bP2WTu42WGq6QyZ3+eTm2N8/fn5QNkvv34Cb3PIb275yP3/s/eU8xjQWTqXfKJXU/a9PDzdFhgNT3afWS9nor9eMm3/TQQ4afX332YuPAIhFVoD0+uaFO6sHtDKSF/ocKSCVwNKIgFzxyyXEOGPywgZpGMM4BMaNtEAZ+wlJ2ZSLpdefSZEpf99ut9ZziIguLy+t11mtVkYDZOlKPQAAAAAAAEpl6esTH8f+/sANDAAeXKlfXnzQeXpLpb5U9puUNfyd3oMADXZ+uOrMFU1QarqaJWEzsJgs1KUoVUvElOYMZZUeVxmj70jP7kXUn82Y64vA4AgAosPomZBosNwRHgAAAAAAAAAAlgEMAB6kotAUDUAvlP1asagVjLx/gLzOXtogdfxUITQgDlu6FP6dZYOjPhhXigrU+XiYytmVTgqKbTe2kMtclPAMoFxStGV5zfX6MMWYVPJzCjJGR8+Yng/9DwAAAFA2GKsBAEsF/duygQHAgy/HaZcKyJDeZ7VadQpgnQ++aRqnEi08hzEoAZdSWX6mFdGm82D8GQ8ZsROaDxnlb0YaR5bSL+V+j745ZHM/77GhFfi6PqQR3/T95eVl189LQ7CtjynFsAYAAAAAAAAAYFnAAODBpjyUnv6s1Jefr9frzgDAn0uFL5+jPY6hdJwXocoa32YpfMwSlay5CW1TSHPjJ8TQFXM9MC+Wvgle0zQHn8l3qusrBwDtEMB/SwOCjAzgeYEvAkAbIAAAAAAAAAB2Um1yOxeWvj4DccAA4GHIJr1ygc/ov3kDQJ0yoO89oUArE5MS35cqCgrn8ZH1YGpXOsc26mBeLL3/80WuQFZ3/kNGRPch2pNfpwq0fc9/m9LCAQAAAKBsfGP20uenAAAA5gkMAB5Mm/Vpr235md4zQOb9l4t+TgOgowCGGBxAWZi8yOV/KSsywsSkrAbj4IrAQFn3B2mSpsMVgQbcxC7Qz87OjBF6/HO7bTqDP6f249/btqXtdktVVVFd11TXNa3X6+73qqro5OTE+bymCAQAAAAAAAAASAEMnMtmHVuBfc6eo7CY8rTbjuOfUsHPSl+ZCqht225hz8dxqD9/t91uqWmavf0EtOGhbdsDD2b+bm6YlOCuck8pS32u7StrGflhqj+dOkq+NxuI9OfSkGS7vun+c0Ur4EwetjZ833M71O2Xf99ut4OeWd/ftt9D6PlTElK+fIzst/inKarJFfky1rPmIHUKJFP/PsZ9+2Izgtd1vaf4JqJuvxtp5NYb3l8bP/f7Qh4HWFHOn/E1GL42t19pJOHv+Ht+HtP+K/x8TdPQxcUFPXnyhB48eED/4B/8g/bi4oLatqVnz57Ro0eP6OHDh/TkyRO6uLig7Xb74pmuxms5Zst35WKrqqvnWq/XdHp6SicnJ1TXNd2+fZteeukW3bv3Mr388sv00ksv0Xd8x1+u7t27R7du3aKTkzVVFdHl5dW1z8/P6eLigi4uLujmzZuznFNJUi8wSg+Bzl1/Y99/7BRxSDFXNr7yvbi4oPPzcyK6qsvNZtONDbvdjuq63jNytm1L6/WVX9rl5SWdnp52n3P/KseH7XZL6/WadrsdbTYbOjk56a4tI6x3u113XSI6mHcPZe4Kktz9XyylP3/pz5db/lOf78N3vm3+Pdb1S6f08dfl2LcEcqcwKr0cTc5ZOZ+57719KWBT93/VG5/9XNwF+hxreJloAae4Djo2hYB+epMBQCovTIpAreBnI0BINECsArQEuExKSYeQo8x8qYH0Z/zTJxuxBoDc8sWLOKavASAUm6Jel58rGqjPdflapS8g+9S/qb+Saa/08WNEX8RO0GNJPcHKXf+MTe5ZIcNKHSLqFOpN09B6vXYqBdu2ORgz+Zi2bbtNdKXXPCuSmqah27dvd+MrX4PoSvF0eXlJTdPQ5eUlPX78mH7iJ36iffz4MT148IAePnxIz549o8ePH9Pl5SU9e/aMnj9/3inXLy8vOyW/i9WqdkYJmuRDGh+kI8B6vab1ek1nZ2d08+ZNOjs7ow9+8IN0+/Yd+rIv+1L6W3/r+6sbN27QjRvnVFVEFxeb7PKfmlwLyFDi2+/8DfSSqQ0Ac+k/U2Eaf3Pd3/b95eUlbTYbOjs721PCExE9f/6czs7Ouus8efKE2rbtjAaXl5d7kVM2pEPUbrejZ8+eUVVVdPPmzb1jnj17Rqenp7Rer0cpr9Lnbz5yKyhzK7iOnWM3APiYu3zmfv7S+z8fx15/pZN7/hMLDABHbACQlSe9FrUCUl6DFcLXHpRuheQcOmAYAK7va1OWakKMQyHfhzxTzPex5DAAmK5rKm9pnAm57hINAD60AnXs98mtAM09QZ5KPmzjjE3RrQ2Y+jju75tm0xkLpCGcx7zT09Pu+7qu6fT0dE8R9NZbn6OHDx/ST/7k32+fPHlMjx49pnfffZe+8IUvvPDYf0wXF5f0/Pkzuri4pKY5lEfdn8hnld6rOpLhStlE1LZX1zQZC0xjWqjMyDJmz9gPfOAD9NVf/dX0oz/6Y9WHP/zhRUR4uchtAEjfPpdVfzAATEvuBbCvfNnLn3/fbDZERLRer/f6eqJrxyedFo3Pvby8pOfPn9OzZ8/o6dOndHl5Sefn53R2dkZnZ2f00ksv0fn5OW23W2rblk5OTjoj8I0bN4iIaLPZUNu2dHp6StvtNnqT9dLnbz5yK01KV0AvndLLP3f9zV0Bm/v5S+//fBx7/ZVO7vlPLKkNAL7zsQdAYkzKelPYCnvK6v9SAcrXcCkeQ5SSoFx0XfPvpmN0459jB1ga3H6kks913NLpK1PHUCbgGva4ZAU50b5Bl+VBH8PjGnuE8vGsGNrtdrTdbun09JQePnxIn/vc5+jHfuzH2vv379PnP/95evvtt4WC/zk9e/acfKJaVUR1vdoztm82W2P0AT/ns2fPDNe5jnio61VnmDg/P6fz8xt0dnZKp6entFrVtNtdGS5OTk7o9PS08z6t6/WLZ6mpba/3D2Al1/Pnz2mz2dCTJ09os9nQw4cPabPZ0Gc/+1n69Kc/Tf/9v//39j//51+uOEUGAEsE48m84TQ9rJA/OzvrvuOUPZxqjY27bdvS06dP6Z133qHv//7vbx88eECf+9zn6K233qJHjx7t7atCRJ3R4MMf/jB97GMfo+/+7u+uPvjBD3Z9LkeMrdfrzriAvVUAwJoRAADmSuz8GAaAiZGKQ50qg4iMBgCi/VzbrEyxKYjBPDHJhssQYPoeE7p4XGXIZWzzfD42tLVaG0Z8HqHou+LI7YH49OnTLkXD2dnZC0X69fePHz/plDV8HBF13vS73XX027Nnz+itt96iH/mRH2nfeuutTvHPaXseP37cve/1HgMyzdRhWeiIgqbZ7UUBsMKJPVOJrjb+vXv3Lt28eZNu375NN2/epLt379Ldu3fp9u3bdOPGDTo/P6dv+7Zvq1599bW99D1y7wMiopOTQw/Ttr3eG0Cm+ru6zurg2KbZ0Ztvvkk/9EN/u/3N3/xN+uVf/uXumWEAAMcMxo/y4egu/v3hw4dU1zXduXOHnj9/3vWdbdvSd37nd7a/8zu/Q7/9279Nb7zxBj179mwvgtoVNfmZz3yG/sN/+A/0yU9+sv3oRz9KH/vYx+gf/sN/WN2+fZvW6zXdv3+fXn755W7PgJOTk6OfvwEAAABgeXgjZJECKG0KoKq63mTQpai1pTbhHMo2b0p9rTkq2JACyI1MS2EyEMi/+6aZCLl3zPexpE4B1CeFjwlfCo65pwDyYasLm4Fk7P5p6SmASkmBYau3k5OTvZz/PM7x8S+/fOfF+US73dVGjs+ePaOHDx/S06dP6X/5X/5G+/DhQ3rrrbfo7bffpgcPHtCzZ886r1Ft4JT7DMhnWq0qqusV7XZsINflcPUMVXX1zDdunNPp6RnduHGT7t27Rx/4wAfotddeo3v37tFf+kt/qbp16xadn593Hvsyd7V8v8vL7Z7BXh9zcXHRPTs/PxtD9J4JfI78X9f1C8PK1XXfeusL9OTJk84ggRRAcfjal69/ie+/l1V/Y6cA6nu/YyN3CLyv/C8vLzuv/+fPn1NVVd3fFxcXdHZ2Rn/lr/yV9jd+4zfoU5/6FL355pt0eXnZnc/ji05/KjeB52fgzzjNT13X9Mf+2B+jr/3ar6Uf+ZEf6R6U0wmdn59nT1GVm9wGkNQpLnz999LHz9yUngIo9/wiNblTyJTe//k49vorndzzn1hiUwD5QAqggpHesiblARHtKfm1MlFGBdh+zr0DPnZYFqQBiMics97XmQA7vnIytVW0rX18ESyu48E8efjwYef9f35+6I3+5pufp//1f/277Re+8AXi/2+//Tbdv3+fHj16RLudPRWDSTa04fPkZP0iXVDTXauqiG7evPLSv3XrFt26dYteeeUVeuWVV+jevXt0584d+o7vuFLyv/e979u7tuxvpZLp+fPnnZJeKvF1vmodmXfnzq3O418r95umoYuLiy4yYr2uO0PFbnd1zHq9ovv336Xz83N66aUbdPfuXbpz5w6dn5++OK5nhQEwIzA+zBv2smej7p07Vwbh3/qt36Lv+Z7vaX/5l3+Z3n33XXr8+HG31uE+dbPZdJFZvN7hvnO73Xb34JRxOq3ParWiX/iFX2Bjc/sTP/ETFR9b17WIHAMAAAAAmA+xDoAwABQEezuz0kz/116E0jDg87QF80IbcbTiyxQRoH+HDMSjF4nHpvzvK0MmT3H0T8vlzp07VNcVtS3RO+88oL/1t76v/cxn3qA33vgMvfPOu/Tgwbv07NmzvfQ9PM7JMY3IHBGj5Ud77LUt0Usv3aSXX34PvfLKe+h973uNXn31vfTe975Kf+WvfEf1wQ9+mKqqpdVqTVXVEtGKrryurzwDt9ttF7nA4yo/n/REraqKTk9PD6L6VqvDSBf5O0cI8DXkMW3bdptTXqX02XZKLB7nnz69pFdeuUdN09KzZxd0fn5Gu93V76bNMgEAoCQuLy/p5s2bRET027/92/QX/sJfaH/913+d3nnnHSK6nmPVdU1N0+ylY5Ob9B5Gfa0OxgPuv5umoe12S+v1mn7913+dnjx5Qt/+7d/e/r2/9/cq3tj98vISfSg4ao7dwxsAAI4Vbwogk+erVE7WnhC7pQ8QOkWJDlEl2g/x10qA2BQWnAPYlvrFZESQz6m9ZnR9TVV/XGYyLUIJHjq578/PoNNMuOqUfyeig9QS+noyhFqeV8J7Ex2G8Mr3mMKD3GtBfZEaRLcz/oyf35YCqDRsqV5Mx4QcG5pCQ/eh3H/K3L/y+6nl02bAWK2u2tjZ2Rk9fvyYbt261SkWeJPDJ0+e0Pn5OV1cXNBqtaKbN2/S06dP6fz8vPPgXq/XtN1uu3Pquqbnz5/TycnJnuc50VXfuF6v6fT0lJ4/f2pMD8d9qVaySyWKVGbr/kG+I9fHyclJ9wwPHjyg+/fv0/d//w+0X/jCF+j3f//36Y033qAHDx50Y4pW0OhoJV2nJnniz3ij3du3b9P73/9++tCHPkyvvPIe+sQnvqu6e/c23bv3Cr300g0iql5EAqxotSLabnd0rfDXP9NjC1HVZT1Xrowqw2nbvCnmfPjvnzcEI3WKhL7krq+lkbs8XUZa2T+3bdtt+MtjDxtXeWz8s3/2z7Y/93M/R1/4whcO0n2a+kM5/hNdjZF37tyh97znPfTSSy9197l//z5tt1t65513uj1pmqbpvPz5Wu9973vpV37lV6oPfehDRHS1fw0bYAEA88M3viHFD4ghtXzZ1gF6DeY7/1hZYgogiSkFtvwpHSSG3A8RADNHKvBDlLc25Z3+3ncdUCbS+9+WJsgUNSCPA+HYFNhIbxOGLYppLoM5KymePHlC9+7do0ePHtHFxQXduHGDLi4u6Pnz57TdbunGjRt048YN2mw21DQNPX36lE5PT6ltqy4dDHtBEl17ukuFPhubNptNd22ZdkemSZBe7Tp9GNG10oWNCbwxIntfnp2ddc+y3W7pc5/7HP3AD/xA+8Ybb9Cbb75JvEnvw4eP9u5fVatOAWNT/l8fe/1M8tjT01O6detq892v+Ir/B929e5fe97730Sc+8V3VK6+8Qufn511O/KdPr4wk63X9omy2e+99he0nAAAAG+yEY3MSqarqxTh05VXPkclsyF6v1/Qt3/It7S/90i/R7/7u71LbtnRyckJVVXURVtxXy33SiK7GqHv37tFrr71GX/qlX0of+chH6G/8jb9RffCDHySi6z0EiIi+8IUv0Cc+8Yn2v/23/0b/6T/9p84Az0botm3pwYMH9Kf+1J9qf+EXfqFarVbdMwMAAAAAlIRNDzJEt2S6FiIAIskdASA9dEz31h7JcgNhfn7f+00BIgDczxASASCPZWyeyyYPXH3PEig9AiD0/ogAMKO9wU3jjb5XaREAVVXRs2fP6OzsjJ49e0avvPIKPXv2jJ4/f0737t0joisFxfd+7/e2dV3TD//wD1e3bt2ix48fU12f7Cn/tUc+RwZw3mJW8F8/x/Xmu0TUKfO53PWmvLKPbduWTk9Pu3PruqaLiwv67Gc/Sz/0Qz/UvvPOO/Tmm2/S/fv36c0336RHj66U/XLj35OTU2v+Ze7TebzR6Rr4OV5++WV6//vfT6+99hq9973vpVdffZW+53u+t/rgB9/fpbpZrzllz9UGjrxJ8N27t6kVGwzLcS33BtFE8/dQ8YEIAGzCIMldX0sjd3naopb4uZ48eUK3bt3qNt7lSAAior/+1/96+2/+zb+hN954g548eXJg5D87O6O2vU61xobjqqroox/9KH384x+nH/3RH63u3btHt2/fPnguNoKfnJzQSy+9RE+fPqWmaegbvuEb2l/+5V+m09PTvTRu6/Wamqahv/gX/yL95E/+ZLXZbPY2dwcAzAtEAGC8TQkiAMpm7uurPs9skrVQ+bPpLzD7mTlSCSyV5zxJ1wo1W1oNsBxsilmpbF1KCorc2IwooQP40gmdQJkiAcYwkKamqq7SaL300kv04MGDzqvw/v379OEPf5gePnxI3/7t397+y3/5L+n58+e0Xq/pZ37mZ9pv/uZvpp/6qZ+qLi+vNjOUaX7Yg58V7ba+fbVa0Waz7TaRlUr/y8tLapqGbt682SlVTk9PO+XM5eUlPX/+nJ49e0ZvvfUW/Z2/83fa119/nV5//XV666236NmzZ53RQRqMia4iAq7vf71Jo5R5Pl5HqL300kv03ve+l1577TW6e/cufexjH6O/9Je+o/rABz5At27dfPFsV4r8i4tNlwLp4uKie/fT01O6efOqnJ88edZdW+fwL4WSngUAAEKRxmIJ9++3bt2iJ0+e0EsvvURf/OIX6datW/T8+XP6k3/yT7Y/+7M/S1VVdRv2ch/NY8LFxcXenOnmzZv0lV/5lfRH/sgfoR/8wR+srjaWP++e4eLigjabTZcO7vz8fM+Lf7PZ0N27d+nnf/7nq6/6qq9qP/WpT3X3lcb0X/qlX+rGWBgAAAAAADAHYo0e8hzMfmaOVqAxWsFrihIgOtxYC8qKeeHzKrcp+H3pomAgCEOWE9L+9MeWOmku/VBd1/Tw4UN6z3veQ6+88gptNht6++236fbt23R5eUnf/M3f3P7cz/1cl5KA6Cr38D/9p/+Udrtd+7/9bz9ZnZycdAoJVrizJ+WTJ0/o5OSk26yQNzdkBczp6Zradt/7fb1e040bN7q0PlKJ8+DBA/qBH/iB9rOf/Szdv3+ffuVXfoWePn1KT58+JSLqlOistJE5lLUB8erYNbXtbm8cWa1WdHZ2RicnJ/TKK6/Qyy/fow996IP0wQ9+kP7n//n/Vb3vfe+j27dvU11XtN1eP992u+s8+68iGWq6vNxQVVV0dnbW3X+73dKjR086w4spuoGjIvrmSBwblxzPSc4BAMeNycj78OFDunPnDhER3b17l/7Mn/kz7b/6V/+KHj9+3J0no8CI6MXeN1eRXG3b0vvf/3766q/+avrxH//x6su//Mu7saSua3r27FmXSujs7KxL+SPZbrf0/PlzunPnDr377rt07949+uZv/mb68R//8W4+wUbkqqroN37jN+i3fuu36A/9oT+E/hcAAAAAk+PTF5n0uPLcPvMXpABKQO4UQPK+rs/1M/FPVvTw8+ifSAGUX35dKYBCz5c/TefZQoRyv3/pKYBM5WQL1TrGFEB9UiSZrm/yQCwpBdDZ2Qk9evSI6rqm27dv0xe/+EWqqoru3r1Lf/pP/+n2Z37mZ6ht2720OVfnndGrr75Kv/Zr/7/q7t27tN1uu5zGrOS/efMmbTabPcU3K8dPT09ptVrRw4cPur/ZSMDX2mw29PnPf55+5Ed+pP30pz9Nb7zxBr3zzjv06NGjPYU/l6VO48O5mjmfv6yL64iAq3779u3bdO/ePXrf+95H73//B+j973+N7ty5Q3/7b/9QdeWVf3X0ZtPQZrPplDwcocCfyWeShmrZzthIUVVEVUXUNO3eeCH7udz9l4m5h61KkAIobwqg3CkQct9v6ZRQntLgK5+HDaxPnjyhT3ziE+2//bf/lj71qU/tGV3ruu7SA8l+ebVa0Xvf+176uq/7Ovqbf/NvVl/xFV/R7W1z+/ZtqqpqL8c/9+86hV1VXe1BUNd1N/69+eab9P73v58+/vGPt7/5m795EPlc1zV90zd9E/2Lf/Evqrn3vwAcM7nHv9z9Rwnjw5JBCqCyWdJayodLF+MDKYCOEJ1OQ6cKMilYwLwxKWW1wlYaE6SHL2RgGDbFPiZnfkwplOYUTbHZbOjmzZt0eXlJ7777LrVtS6+88gr95m/+Jv38z/989w7s/S/P+9znPkfvvnufbt9+ieq6oitl4u6FsnxHu92WTk/XLxTkW9rtti8UHTW17ZVH48svv0xt29IXv/hF+vznP09/9+/+3faNN96gT3/603T//n1655139vYIIDrcB0Cm9+EUOrvdtTc+w9c4Pz/v8vX/wT/45fTyyy/Td33X/7v6ki/5koNc/TIHM9H1RsVsXHj8+DGtVis6PT2l09MT4ipvmiuDh97EmI0R/CzyPeQYJ98jJ+gLAABLY7PZdIbmb/mWb2l/9md/lh49etSl+OG+l/tpGUF2584d+pqv+Rr6J//kn1SvvPJKtw5hD3+5Eb3sv2W6HjYI7Ha7Lg3QW2+9Rffu3aMPfOADRET0VV/1VfSbv/mbndGcx4f1ek2f+tSn6NGjR3Tr1q2pigwAAAAAIIixDEy2z2AAWAis+DB5e2uPaenN40oBA6XFvHA1dpPyXy7K+DsYAfrhaiNoQ2EeDKawtrnI4uXlJa3Xa7p9+za98847dOPGDbq8vKRv/dZvbd955x1rpA4rIn7qp36q/f7v//7q9PSUiPajG1gJv1qt6OTkhG7cuEGr1YouLi7o85//PP3oj/5o+/rrr9Pbb79Nn/nMZ+gLX/gCPX/+/GDDXVNklUT2A9pYcH5+Tjdv3qT3ve999OEPf5g+9KEP0Xvf+176xCc+Ub388stU1yedd//l5ZYePbraO4BzNLMRQfcxnLLo7t3b1DRXG0E+eXIdlbBer7tUROzZL738OUXQxcVltwcCl6vcRBkAAMAwtKMI990XFxd0eXlJX/d1X9f+j//xP+j58+fd8UTU7R/TNA2dnZ3RxcUFrVYr+qN/9I/SP/pH/6j6yq/8Srq8vNwzNrMhgFPibbfbTnHP92bkmHZxcUFt29L73ve+bux6/vw5feADH6Dz8/MuGo65uLigd999t9vAGAAAAACgJGyZEfRnoRw4CPtSAPkUWKuZK7hiFXRaUWVLAcRKib73G+P5XOi0QNqAwBNnrcTRymMboQLKE3qXoioHJShwpTyZojpikOHapg5GenDJnzZC0sL0QaYAsqWecVFK/cmfktgQw9j6913/6dOnL/K11/TgwQO6ffs2nZyc0MOHD2m9XtPFxQW95z3vobZt6d133+027Xvy5AndvXv3wAO87/P4UiuNge7XWBEuN+C9SjlT7fXlVylszun58+ed12NVVfS93/u97U//9E93G/HK1DS73a5TiHzoQx+i//Jf/kv18ssv08nJCT1+/JjatqXbt293iv6TkxN6+vQpvfXWW/TDP/zDnXf/G2+8QQ8ePBilj5R9ysnJCb33ve+lL/mSL6FXX32VvvzLv5y+4zu+o3rttde6fPucu/nqvP51MmadltC+Y0jdvlMTmwKIKG2KwfT9Z2wKpLT1m7p9+cZ7UwTimM/nI4UH1ZzwvT9/v91uuzGOaN8wz5v8El0p1s/Pz+lbv/Vb209+8pP07rvv7qWtI6JOqc8buO92O/rIRz5CX//1X08//dM/XZ2cnNDl5SWdnp5Gly8bGjg9kBxv3377bfr4xz/ecmQeEXVGiZs3b9Kf//N/nn74h3+4kuuZpTL2vBwAkH79lZrcKZRA2ZQ+/8mdAihU/2nTAeVe/yECADiFTG5KqRXPJoNG6R0G2AcTgLy4InBK4NVXX6HHj5/So0eP6M6dO/T48WPabrf02muv0ttv36c7d+7Qm2++SavVil599VVarVZ0eXlJt27domfPnu2F7ZvIrQBjpTx7jnP6mPV63Sn0OZUB7+PCBoG6rumLX3yXOIc/0VXagl/5lV+hJ0+eENG1gU2+J29G+GVf9mV09+7d7hnv3LlDm82GXn/9dfqBH/iB9v79+/T666/TO++8Q5///Ofp4uKCiGjPSGrqn01Gaf0M/A7n5+edwv/DH/4wvfrqq/Sd3/md1SuvvEKnp6d0eXnZXe/p06edQZA3Jr68vN5DBgAAwHzgTXPX6zU9ffqUbty4sWes5vRsfNyTJ0/o67/+69v/+B//Y5fGjcel9XrdRWzx2HF+fk5//I//cfrH//gfV3/gD/yBbpwaQ/lPZN93iJ2J5Obxku12Sw8fPoy+PwAAAACOjz76sSmcGfsCA8CRoyfGOv2G9hCXyjJtALBdC5SLyTNI1pne5BqMi96Do7R0TA8ePKTz83N66aWXaLPZ0L1792i1IvriFx/RzZs36enTp/T+97+fnj59SpvNptvIj3PT534Hn4e8zBUvU+CwEoEV+zrqiY976aWXqGkaevfdd+n27dv03d/93e2v/uqv7uVAlnXJSpKXXnqJXn31VXry5BF94hPf1f7O7/wOvf322/TFL36RHj58SE+fPn3xTPycKzo5qWm3a/c+1xv3Epn3VSAiOj09pTt37tCHPvQh+rIv+zJ63/veR9/3fd9XnZ6e0s2bNztlCW/K+/jxY7p16xY1TdN5/csoravojmk2iQcAADAu9+7do81mQ+v1mm7evEnPnj2j7XbbRaG988479J73vIfu3btHf+7P/bn2X//rf01vvPEGnZyc0GazoZOTk26M5CgCHi/+8B/+w/R1X/d19IM/+IPV3bt3iehqzOCNfXl8GQM95rGB++zsrPuO57JVVdF2u6V33nlnlHsDAAAAAEhKVPpLYAA4cmz5qU2hKqZ8oH2uC8pDhyiZcrL7wvjBcHTOe1nWJQwY7On+9OlTunXrFj19+pT+8l/+jvY//+f/TA8ePKDXXnuN/q//6/9bvfrqq/T06dNO8f/8+fMuz72L3PJ0cXHRefxzKgEZ3XTjxo0DQwYbQK888K88J+/du0dnZ2f0a7/2a/To0aPOA5LoWvHAuY6JrpQfv/Zrv0Zf9mV/sH3y5Antdi1VFb3Ie88b3Fa0Xq9os2moaXbEuv66vo4AMBUfv896vaZXX32VXn31VfrIRz5CH/rQh+i7vuu7qrt379KNGze643e7HW02G3r27NmBIoW9JDk3M9fndrt9ofCBAQAAUCa5x5c5UFUVXV5edvvMEF2V24MHD7r0fn/qT/2p9t/9u39Hjx8/prquO6PBZrPpjN0cjXb37l36xm/8Rvqpn/qp6tVXXyWi66i39XrdRdrdvn07aQoNNgLI+ZRMx8dRegAAAAAAY5I7xY8PGAAyU4KSjzEJIyv7pWc4p8bQqSdc1wFlIxX/NgOQPh7EY8uLXEr5stL63r2XqWl29D/9T9/U/vzP/zy1bUsnJyf0tV/7tfRlX/YRapqWnj171vUXdV0T5/rNidxDwsT5+fme3Mv8/0S0l/6Hr8fpgViZ0bYtnZ2d0W/8xm/Qr/7qrxIR7SlGmqbZi6Rifvd3f5dOTuQmh9Qp/5nttqHVaj9H8bWR4uqYqqro7OyMbt26Ra+88gp96EMfoo985CP01/7aX6s+9rGP0cnJyd41N5sNPXr0qHsnaTBgdKoGfkYZEXF6ekpNk1dOkcIMAACGcXFxQWdnZ51S//T0lDabDbVtS/fu3aP79+/TN37jN7b/9b/+127ez1FtvEkvb1TfNA195Vd+JX3yk5+sPvrRjxIR0cOHD7voMqKr/nqz2XSOBVMhIy15TJAbAwMAAAAAHAswAAAjrFjhyb7tP3vUlKKwBMPRRgAi+6Yl0gAEhiMNbBJT3vYc3L17m9588/N0+/Zt+rN/9v/Z/uIv/iLVdU2np6f0FV/xFfR//p//n+r580t69OgR3b17l9bruusbHj582C38c+FLAXRxcdHJMSv1WcFPRN3GiNKOsNtdbYZ4cXFBm80F3b9/n77v+76v/cVf/EV68ODBQRQHe/9LYwQrWq4V6vtG1qtzrqNu1uvViz0Iro69e/cu3blzmz760Y/Re97zHnrttdfou7/7uyuORODrXF5e0uPHj+ni4qLbqPj8/Jxu3LixZ8BgQw8/J3v7X15e7u05IPdB8BlXAAAAlMvZ2Rk9ffqUbt68Saenp13KHyKiv/pX/2r7yU9+kl5//XUiutr3hfP9cwogOV78iT/xJ+if//N/XjVNQ++88w69/PLLdOfOHSK6Mhxzah4edzhlUAyuNKMyBZ9eo8hoPAAAAACAPgxxMMut05HAAHDkhHh2y5QY/J+VPzKvJqIB5ofew8G0J4Dtb/YGA8ORBjTbTvE5uX//XTo/P6dbt27SZrOhpmm6DQPv33+nUwTcuXOHqqqiBw++2HmOn5+fexXwud/17t3bRESdYp3ZbK7yGD958oQeP35MP/qjf6998OAB3b//Dr399lt0//479PjxI3ry5HH3jo8ePeo84znyQUdK8d9seJBc/S036q3o/PyMzs9v0Hve8x56//vfTx/+8IfpAx/4AH3P93x3dffuXWqaq7KWXo1PnjzplBs3btygs7MzunnzZtdnN01DFxcX9OTJk24PBPmf6DrFz+Xl5d6myDJN0pXnJ6YQAAAwR7gvZ1566SUiIvq2b/u29p/9s39GT5486cYF3hCeUwYRXY1ZH/3oR+mbvumb6Md+7Meqy8tLOj097VIHyTGEnQE4XdCYjkN6HsvKf45mkO/Je/v45iYAAAAAADHoFMJMbv0HVu9gD9ukXCqwOLWFNATYgAFgfoTUWe6OaynIdkV0aGDJ3X5u3LhBdV3T5eWW/vf//aerr/mar2k/85nfp5deeol+7/d+l770Sz/Sfv3Xfz39H//HP66apnkR7n9CT58+7/qJ9OzoajPaw5+np2fO77/4xUf09OljevfdL9I/+Ac/2T58+Ii+8IW36QtfuE8PH36RHj58RBcXz+n58wu6uHhOTbMjopaqakVtex29wfsdbLdburi42NtYWCrNz8/Pu++5bne7hqpqRScna7px4ybdu/cy/YE/8CX0gQ+8nz7wgQ/St3/7X6xee+0DdOvWTWrbijabC2qalrbbXZeHmT3zq6qik5OTLrURb96rDXWs1Cc67NuvnulKgXLz5s0uBZL04mTPTehQAAClkjLH/BLgjewfPnxId+7cobOzM/qGb/iG9t//+39PJycn3djFBmXp8MMpAP/+3//71cc//nGjM8NqtaKbN28S0ZVRuWkaOjk5oaqqun0EYrCtVXiPHk7zIyPyrvbZgQEAAAAAAGmwOUSHzktTzz+rz775+bgLZJ4g++6evACVkk56yMs0OVIB48q1brq+i6GCFFouoc8nf8rft9utca8APobTUvB/mTIjpHxinz/1+bHoyAvT96nvT2TfzZwVgbqOXR1dnzJlmfj/s3feYZIV5f7/Vp/UuSdsjrCwSwYXkZwWlLSSUZIBRAFJElzFa7i/ey+Kl0UEBS+CIAgSFJS0xJUcBJa4iLDLsoHNYULnE+v3x9m35vTZ7umZnTxTn+eZZ2a6T58+oapO1Ru+b/B4uiM9NND3L3gM1Y4luAit9n4wRb7aNe0LDfTgZzRNQ1tbG+LxOBKJGC6//Ar+6KOP4pNPPhFG7kgkgoaGBkyZMgXbbrstxo8fjyuv/BEbNWqUiPojIzK1Y4oMrOU/DNcbCY4PwfP25QQcABFEIgBjCgAPjuPBdW04jodSqYBcroDf/e4mXiyWkMtl0dbWjkIhh3XrNoj/S6XiFhr8hP/dQCSiwPNceB7fbNyPwHU9RCJss46yg0iEwfN4hQNE03RhjCCjSDweRyaTQXNzEyZPnoIJE8bjBz+4kqXTSeh6FIrCYNsuajswBr59j/Tv7yldfb4OVGbd4L++PTPiDf7zG9zI6zew1Lv+FG1fLpcRjUYr5hDk7CXjf1tbGw455BD+/vvvQ1EU8bymz9BcxHVdNDQ04KCDDsLDDz88oA0gOD+muQhlIXzyySf43Oc+xwuFgphDUAaj4zjYb7/98PLLLzNg8EowSiQSyWClr8dHOb8Y2vR1+wjW9tma7+1p+xro+UFP7T/SAdDT7x/hDoDgNmHjPx1f+Cd43HQNSIqCXpMOAJ/B7gAIZoCEDfO1orOC1Lu+0gEwsA4AivQjLfhoVMfSpcvxzW9+g7/66qsVxXEpKl5RFCSTSaTTaUyaNAlNTU0YPXoM0ukUvvOdcxlp0Ou6jkik0sgfHjcAVKTzm6Ypfu644w5eLBaEpE2pVEIul0N7ezuy2SxKpdJmR4OJUqmMcrkM13Xgup7Q12fMl/8hIhEmjP0AOTDD16djrHNdTzgBCFVVhCOhwwnAEI/HccABB2DMmDEYO3YsLrvscjZq1ChxHQDAdbmQLejO2DtQjPTv7ynSAdBTpANgIJHXb2DpyviRz+eRTCaRy+WQSqVQLpcrIvkVRcGVV17Jb7/9drS0tMAwDJimKbT6Cfp72rRp+PKXv4xrr72W9TSCv6cEZX0oA8GyLGiahssvv5zffPPNME2zYi1GsoUHH3wwnnvuOekAkEgkkq1AOgAknSEdAH1LT+0/UgJI0mPCBsmgU6SaUY8WEkHjdpiwY0UyMPTEARX+bLhtSOoz0Ncql8uBCsu2t7fDNE1su+1UPProY+w//uNH/PHHH8emTS3I5bIgYxxjEbS1taG1tRUrV64UC2/P83D99ddz0qT3pQBQEd0ffKAHHR70edKmd10XnufBNMtVHE8dxx828AdfD7fFSMRvr8EsAP/4OsYo3zHZodfPGBCPx5HL5cV2wc97nrc54tDF9ttvj3vvvY+lUinouirqDJRKpQrHFkns9J+EkkQikUiGG8ViEclkEhs3bkRjYyMAIBqNCkkf0zRx+eWX8//7v/+D53nC+A+gapHcffbZB/fccw+bMGECNE0b8PlJWD6RnACu6yKbzcK2bfGcDwdQkDSRRCKRSCQSyUhCOgAkPSIYIV4r4jso50H/B4tydeYEkAw+gveNDJS1MgSqfVY6AbaOgbhmjY2NKBQKiEajaGxsQHt7Fi0tbWhsbMBNN93ITNPGZZddyhcuXIglS5Zg06ZNokBg2IDdkSXAkc3m4LoOgkVvOyOcBdLx+pYGfkWJiCKDfuZC5fgSNOKraoc+P2UF+MfKoKoqLMsWxn5C1zXEYlHouoHGxkasWbNm834rt6NIQ/ruKVOmoLm5EaWSCcsC8vk8UqnUFucYzHgIZoBIJBKJRNJVYrEY2tvbMWrUKOE8B4ByuYxkMomvfvWr/O9//7twOJNMHUGOedd1cfjhh2P+/PkM8J9dg2EOR3PJYP0Bylxob28XskDBgCT6mwoeSyQSiUQikQQZDHOcvkQ6AEY4fWFkD3Ya0hGlyF76PkVRKibuMgtgcNLZPaCoKtqmMydO8P3ekHYaKfSFxE93oAWz34+BZDIJx3GQy+XR2tqKUaNG4Te/+S1jjGHDhg346U9/wpcsWYIVK1agra0NbW1tou/7hfccBOvRUo0AivDvbg0Jvy1VtjPX9YQkj+8gqDTud+xny2h/GqtUVYWmaRg/fjwaGhowfvx4jBs3Do2NjbjkkotZLBaDpmnQNA377bc/X7JkCVzXEfvjHMKYYts24vEEpk6dCtO04XkeYjEDDQ0NKJVK4tzpe1VVha7r4rMSiUQikXQXzjnS6TQACKm8dDqNeDyOQw45hL/44ouIx+MoFotiHkf6/7quw7IsJJNJnHLKKfjjH//ISE4omUyK/Q8kQac5OctpztLa2lqxDUFZdkHnu0QikUgkEslIQToAJD2iK0XIaGERrItAnw1qyIf3OdCLC4lPV+9HOLo/nBVQzfAv73HnhOuL9Df5fB6GYUBVVRQKJViWhWg0ikQiAV3XwTlHsViE53nIZDK45ZZbGGOAadoolUr4n//5b97e3o61a9di9erVaGlpQbFYRLlswrYtlMulmt9N40MtZ0BHu6z2HsR7kQiDrmvQdR2GYSAajcIwdKhqx2sNDQ1obm5GQ0MDUqkULrvsUpZKpSqiBF3X3ezE8IRs0Q9+8AO+ZMkSlMum2C4S6RjvKANi4sSJuOqqnzPqA/l8EaZpoqmpEZz7+yaHGkX/k3yQRCKRSCTdhZ6ftm3DMAwYhgHOOQ488ED+2muvQVVVFItFAP4zlIz+VEx3woQJeOqpp9iuu+6KUqmEZDIpHNbkJBhIwvNNet6apokNGzYAqF4zKRqNSgeARCKRSCSSEYm0Lkh6RFcK09L/lA0Q/qn1WZkBMHipZuSn12tF+ldzAsj72zlduZ59CS34SY4mlUrBsizk83noui5e1zQNAFAslkQkfyQSwa9+dS1zXQ7HcUTBwVKphDVr1uCGG67n7e1tsG3fWVAoFFAoFDY7CMpwXVcUGQ5mm9BPJBKBYRhCM58i56PRKKLRKHRdRyqVgqZpoMLDF110EUsmkzAMA4qiIBqNAqgstuw4DkzThOd5KJVM8V1+hL5ecQ/efHOBMP5T8V/P65A5UxRfYmjatGkwDAOO4wjHia7r2LSpRRy3pmlQVbWiVoqsASCRSCSSrcG2bTiOg1gsBgBYs2YNDjjgAL506dLN9WqcimcqyfcpioJdd90Vb731FqOaANFoFKVSCbFYTGSrDfT8LVxHjJ6Z2WwW69atE9sAlfNPwzBw8cUXyzRUiUQikUgkIw7pAJD0iGrR4dX04INRvMEFB0W4DvRCQtJ7VIu4AmrXepB0zkBKJpXLZaiqKoruapomFtl+EV8mogGDMjZ03O3tObEdRbkrioKpU6fi17++nikK28LgHZYDov3TdSBjP0XYkwOCoh1pu2BB4aAhnf6nSHuKticjP+C31WCRw/DxUCHitWvXiv0G5YRUVYVt23BdF4ZhYOLESeK4OeewLAuapiGTyYh92raNcrkMoLIwskQikUgk3SX4DJszZw6///77sXLlSlGfBqh0rpM05957740nn3ySOY6DeDwO0zShaRpisViFM38wEH7W27aNfD6P9vb2LTIE6DwpOEAikUgkEokkzEBLMPc1ajAqOyjHQpPCIANxsvW+c6Avf2cNpCuGu56+3x364v7Vi1ANyv2E4ZzDNCsjbMPbBY2JwR96Ldxmg7+7ciw9dTz09wARdKj0h9Ok3rWsR7BIcDhaq5ZDoDfPa7AP4NUksIJ0paByZ3S1f4b3Gzw+kqKhCEEqGEh9l7YLLsKJYEQ73W9apPvbulscQ7WaIbUgoz9FLgY/E5QEqC0fxGvK7NBxxuNx5HI5pNNpOI4jdJUvueQSvmHDBmiaH/nPuS89FC6mOHbsWFx11VWMMSYM/NFoVDghgucSbg89fT4MdcfqQPfPvqZWJlU92bWuXpehfv97Snfbj5SokwTp6fjT0/ZT7/styxJ1dMrlMiKRSIUsTy6XQyqVwqJFi3D33Xdj/fr14rkYlKjTNE0UCD7mmGPw6KOPMtu2xbOR9kkO/N44t96AAguCc0ld13H11Vdzy7Kgqiocx6mQEvQ8D+PGjUMymawZuNTV+XVfP5+G+/NdIpEMXvr6+dVTBvv6fqTT1/Oneuujrf18eD+DlZ4eX4SMOWSYCUZiDrT+tEQCVI8iD+qDhyfrteSFJIOLcDYIIe9f71FNcmswXdf+WkBXy0rqyncriiKM9hSlXyqVwBjD8uXLUSwWYdu+8Z+gAsRkzN92222RTqdFFKWiKBUOC4lEIpFIuothGFi/fj0ACGk5AMhmsyiVSkilUrjwwgv5gQceyNeuXSvWesGMPsCXCtI0DaeeeioeffRRBtQPThgMUBBQ+Fg3bdoEoCMAgtazNP9pbm4W8n8SiUQikUgkI4lI0CAUNKQOVoORZHgTNuZXM+yHiwmH369lVK62T0n/05nXVo47vQstjqsV4B6M17f7xxTp9IcxpdOfep/X9Sg8DzCMmHhNUTRYloNFixbB8zrasqJEhCOAHOqGYWCXXXZBLBZDqVQSUkUUtSiRSCQSydbAOcfo0aNF4V7DMFAqlZBOp2EYBs4++2z+5z//WRjEg1mzFPwFAKNGjcIFF1yA2267jdH8jLT/BzvhbD7P87By5UrxWhCaC02cOLFm5p9EIpFIJJKBpVYA42C1Xww1qs6Aghe4ljFWIukNOuvInUlQ1YpO6qpslWzLAwNFYVW7/n0tBzQcqXd9OoviG2zXtpYMSm/st1oB5a4SiUSERAJjDJlMGt///vf5qlWrNu+Hg/MtpY9s20ZzczOuuuoqFixmDFRqM/eEwXYPJRKJRNJ/kASerusoFApCruf000/njzzyCFzXFXI/0WgUhUIBjPka/qZpYvvtt8e8efPY1KlTYRgG8vk8AGwhkTMYCRr/XdeFpmnIZrNYs2ZN1W0459A0DWPGjBmQ4+0ug/36SyQSiUQiGXqopNFMKZJhHfWgsa6W4U4i6Sm1tHerFfAKQkXLwp+hn6GQxjzS6Iq0WFc13CTdJ9iXBsP17SvDf29gmqaQGiuXy5sLGgMffvihMJQQlA0QiXQc/3bbbYdMJoNCoYR4PC6KB0ejUZTL5UFTSFEikUgkQwvbtqHrOjRNQ3t7OzKZDBzHwVFHHcVfeukllMtl8ZxPJpPI5/PQdR2u68K2bey+++54/vnnGRXELZfLSCaTA3xW3YOc6yT3s2LFCrS1tW0RMESyR8lkEnPmzGH16iNJJBKJRCKRDEcimqaBfoIpoRRRAVRGaQ8m44xk6FMvA6CaUT/409nnO0sV6q8iuiOdeqla1e4pvS7pOdVqZACDRwKoP4z/4TEk+FpXCBY91DQNra3t+PjjRaGMgsrfZJjZYYcdhIM9FouJ+jpUiFEikUgkkp6gKAoymQyKxSKOPPJI/vTTT6NYLArnta7rKBaLADpkgL70pS/hvffeYySd4zgOotEoHMeBbdsVhewHM1TQmJ7pV111FTdNs6KuHdAxtxg/fjwymcygmP9IJBKJRCLZEikB1LeoQUOqoigV0j/BiOvBFDEqGd6E21i1Nhee1BPhgaFa9opsw/1PV6/5YItOH+qQkTnswB2MD8++Mv73pN9TkUQqmKhpGn7ykx/ztWvXiHokrutCURQ4jrvZsO9/z+TJk/Hzn/+ckTEiWIjQNM1e0SCud06D8T5LJBKJpOfouo6WlhakUim0t7fjiCOO4G+88YaI8ids2xbPAl3XccIJJ+C2225jtm2jqakJ2WwW6XQarutWPJeGwhwsOF90XRdLliypCF4jBzz9PWnSJCGTNNiRz3eJRCKRSCS9TcS2bZEaCfiRJGToqDdJGgqTQ8nQpFbbCkeLU0Rt0NAZLHwqGdxUy/KgvyX1qZUZ09nPUKE3FrfV2lN32lgkEoFlWbAsSxgQ1qxZg1KpBM/jFRlzHcftP0e33357jB49WhhfyuVyxT7JuSCRSCQSSXcpFApoampCPp/HYYcdxt944w1omgbLsirmxfTsj8fjOOmkk3DDDTcwwzDEftLptCgkTAyVDLXgs7dUKmHt2rXif3JmBIPZmpubAQyd85NIJBKJRCLpTSoyAKr9ULHCsNFVfAaVBpXw52tNsrpq3BkKEQ615DXCP9Uka6oZobpzzn19faqdW3eot31n519N87/a58N68cHXwjUCqtUWCB9Hrb+rRU/39Pp35fPDIeWpntZ/kPB9DN6rWv2n1j3r7vF0l+6MY7XqXPTl99eTvwrK21Q7rmoZNsH+1fPrGLyX4eMEGKvvxKs1hlQ7zu6OZ5xzKIoCy7IQi8Vgmibeffc98T7JJPjH6YGxCDj3f++6624olUxomgHwSMV36ZoC23IB1vnx9LXDZmvaT3cIP/+H8hjWl9TKeuvq/dnaz3f3uLb8/oFtn8HxozcYSg7SgUD2396l3vW0LAuGYaBcLkPX9QoDfaFQEP8feuih/P3334dhGKJuDY29JO+TTCZx9NFH409/+hOjoC+qAQd0ZLv11tjRH3DOQY6MaDSKSy65hK9atQqKosDzPNi2La4Fne+YMWNgmibi8Xin/X0wnP9gOAaJRDIy6ev5Y0+/v9779Zy8/WG/kWw9Xc2A64pqSE/2P1yJkDE/GEnteR5c14XrulWNb5FIBIqiVEgGVTPMddb5hlo0qmRoUSvKN9iGwxqhQzlaeiRQb7E2mOVtJEMTkg5IJBIAIOR/FMWPLCQDTFBugXOOqVOn4kc/+g/ZEAPIfimRSCRdxzAMrFmzBtFoVDxrPM+D4zhIJBJQVRUzZ87k77//PhRFgWmaACAK+eq6LrY97rjjcP/99zPTNDdL1jkDdl69BT13KeNh+fLlQgqI5otBR0gymcT3vvc9ZhiGzACQSCSSYUytYNyhHlAp6R1GevuIAB2Gz7Dx33GcLYyhjDFh/CcHAMmtUBHhWl4ZiaS36Sxitlb7CzsBqn0+7ACol7Uh6R/CDprwYB2+tyN1YO8q0tHVOcHxQFUVfPTRxyiVSohEthw3ghlvO+ywAxoaGvr7cAct1TJJZD+USCSS2pimifHjxwtjPUX9c86xfv167L333vzdd98V6zHAd0pns1khBZRIJPDVr34Vd999N6OMAtpuqEPnoCgKyuUyPv74Y/FcCc7v6ZqNGTMG48aNGzYOEIlEIpFIJJLuskUVwrAxKBglEV60kzMg/Plg9L90Bkj6m66m9ZLBLigz09n21b5DGrEGD2EnTWf3Vd6/2sgxuwNVVWFZ1mapnyg+/vgjAB2Rh8HnIxUE1jQN06ZtJw0MqN6/ZJ+TSCSS+hiGAcdxoKoqCoWCqMvmOA6OPvpo/u6774p5Dj2TSBbHNE00NjbitNNOw+9+9ztmmiY8z0OpVIKu6xXyP0MVeuYqioI1a9bgs88+q5j3Bed5juNgm222GVYOEIlEIpFIJJLuotaLbKZJZbUoWs45IlWkf6rJr4SNcUN94ikZvHSnrkIwcrxW25UMHF0dN6pFGIeR93RLOquzMRIMtfXaBOn/p9NpXHnlD/m6deugKCpc19mizgA5AyZMmICf//znzHGcEXENu4p0Bkgkg4uu1ECRDCyqqqJUKiEajUJRFJRKJRx00EEi8h+AyN6mmlemaWLy5Mk48cQTcc011zDAlwNijAldfNd1h7wR3HVdP7H19gABAABJREFUUZ/nf/7nf3ixWBTvBZ3z1I632WYbAH5mhWEYsn1LJBKJRCIZcVRkAFSL/AwX5AzrbLPNE87wQoImlp3tS06+JL1JtfbUnTYWbN9hR0BfFVmUdJ9qdR1qyTUF76ccc6oj23JtSEtYURg+/PBDmKYJ1/Uj+/325G9H1zASiWD69OlIp5MoFEoDddiDjloOOtkfJRKJpDqmaULTNMRiMfH/rFmz+FtvvSW2YYwJuR+q6TZ27FiccsopuO6668TA297ejoaGBmiahvXr12PMmDFDfvwNyvwsXboUwJbPFpr3JRIJ/PjHP2YkcyuRSCSS4YsMcJB0xkhvH2p3qyCHDaLhaVQtve1qBrigZrJE0ltUMwaHnU/hv8Pb11pEhPcv6T9qOWGC97GWM0Aa/7uHdAb4UKRgPl/Ev/71ry2K/QZ/A0AikcD06dNhWTL6H5BR/xKJRLK16LqOcrkspH8OPPBAvmDBAui6DsuyhAHcsiwoigLXdbHNNtvgpZdeYpMmTUJbWxsaGhrAOUdDQwNyuRwAYMyYMSKrYCjDGIOu69i0aROWLVsmXgsSjP5vbm4G5xyapvX3oUokEolEIpEMCiLhoprVomurTajohwoG0w9FoIQ/LwtxSgYLwfZLqdO12r9kcFEvI6Oz4s0SSXdxHAexWAw//elP+Jo1azZnAyhbOJTotXQ6jauuuoqVSiXZ9qogr4lEIpF0Ddu2EYvFUCgUcPDBB/P33nsPAITxn6LZ4/E4XNfFdttth8cff5yNHTsWANDQ0CCy2DzPQyqVQiqVQnt7u8gqGMq4rgvGGNatW4f169cDgDhXznmFxNGkSZOgaRoURYGmaZvr+kgkEolEIpGMLNR6C/J6eurhTwedAoCvXxmMwqUJWVg3OWyUpb9J0zJs1KPIl2oZBMFt62lc9tTgG6yHEPy/O5/vS3q6/8FusKnbPrvYvmsZlsOF0uptX23/1Y6nu9c1LNNC7WywZ9B0px5DLWpFEXemX0/fG74+4fEgnAoevj/hYua1vqfWNvU09vva4dSdDK9q7bza+NlZG67mQO5sm4EeX8L3gByCgG/UVxQFkQjw3nvvgTT9STs5/DkA2GmnnRCLxWDbfmFC0f54jefQMB+fw3RlvAxSSyposJz3YH9+dzfDs/vfLx3mA8lgb3+1ni/DhZ72L9d1RaH5YIFfKvpLBWtPPPFE/uqrr1ZErtPnGGMoFouYNm0annzySbb99tsjl8tB07QtjOB0vOl0ekjdj3A7Cq+3fvzjH3PTNKGqKoK1d4Lb7bTTTtB1XQSqDfX6BxKJRNKX9P38cWjT0+vT08/Xozfsm335/X21/95qdwN9/fsatf4mPcPzvC2MlvR3kKAhnX6HjZ5hA1VYziW4L4mkN6hmFAVqSwV1hmyXg496EiXyng1vXNetKKQYiUSE4cS2bXDOsWrVGnz22WfiWRZ2vNHzStM0TJ48GYZhgDEHjuNII4NEIpFIqqKqaoUefzabRSaTgeu6SCQSAICjjz6aP/vss4hGo/A8TwRVWZYlItlnzJiBZ599ljU1NcFxHKRSKTiOI55twxWan61YsaLqmpCe1w0NDbj88svFZI4cKYN9gS6RSCQSiUTS2/S7AyD4G4CYoFZ7j7IBaD9BqskMSSS9TVc9mPVqBMj2OTgIR+SHDbRyQTiyCDv4KLvMdV04joN4PI5LLrmYr1ixAkD1rA1FUeA4DkaPHo1f/vKXrLOsD4lEIpFIAF/iZ8yYMSITMZPJwHEcWJaFWCyG2bNn8yeffBKGYcC2bbiuK4z+uq7Dtm1Mnz4dzzzzDJs4cSIAP4MAqHRuD1dc10U2mxX6/57niecx0BEoNmnSJIwePRqe54lrOxIcJBKJRCKRSCRh+twBAGxZrDMY2R+U2AjLA9XKCqil/x38rETSG9SSnthaKR9J/xLOIqLX6t2/ap8Lvi4ZHgSlfOhv0zSF/Jyuq/joo4+E5nJnz58dd9wRo0ePRj6fh+cBsVhs0Et0SQY3fZ1CK5FIBg5N04TxX1EUIQXkOA6OPvpo/swzzwDwMwVM0xTOaTJyT58+HU888QSbMmUKbNuGZVmisK+q9svybkBhjOHKK6/k7e3toggyXc/gWnOHHXYQGRT0TLZtWzoAJBKJRDIkkfYISU/oN32CalH6VC+AJmXBv+mHHAORSERoMvu6zJGq8gpBJ4HsHJKeUqsdVXu9ltRVtR/ZPvuX8PUOpovXkgEK/gRfH0mEx9PhNr6STj8Z/BljQvonFoth1ao1WLRokdi2mmPIdV0YhoEdd9wRpmkCQIUOsUQikUgk1chmsxVR65Zl4eSTT+bz58+H53mIx+MoFApi7UPzll122QUvvviiKPjLGINhGFAUBZs2bRoRxm1FUfDhhx+KyH9gy/pF0WgUv/jFLxi9RnUVgvUUJBKJRCKRSEYKfR4iUs8IEtRV7swYR79rGU9rabVLJD2hXgR4Z21tuBfAG4qE5Vm6EmFbq9aIZOgTNuhHIhGoqiqKzF9++WW8tbUVmqZVRPNTJGYkEoHneRg7diz++7//m5mmiUQiAc7L0gkgkUgkkpqYponGxkZR+NfzPBxzzDH8qaeeAuAbuIvFIjRNE7r/gJ9t9vjjjwvjPz2LIpEIWltb0dzcLF4bzpTLZSxevBicc3FtKFOPntfjx4/HtGnTRHaFqqrgnIvfEolEIpFIJCOJfpkddiWClP6nTADSYKa/KUoTqIzODWcFUMaArAsg6SuC7ZcyVcLteaRHjg8W6jkLa92/INUKlkuGB57nQdM0RCIRWJYlovkBoKWlBe+8847YjqQFgEpHkqZp2HnnnZFKpURGQdhhIJFsDcM9A0ciGcnQs8ZxHBQKBRx33HH86aefBgDoui4i20neJ5lMYvr06Xj88cfZpEmTsH79egAd2WnZbBaNjY3I5XIjIgPg+9//Pt+4cWPNbHDAd5YErwXnXGRbSCQSiUQikYw0+twBUM3IH/wJR+MGDaskERSUBgovfMnwH5QF6iybQCLpDuF21Fl7rvX5an9L+pdaToDO7mFYykky/PCN9X7Ev2mamyMxfTmGdevWYenSpRU6zWRoCBanj8fjmDFjBgDfaFMsFmtK1EkkEolEAgDFYhGA/9z46le/yp988klwzqHruoho9zxPPEvi8TiOPvpoTJ48GcViEWPGjBHOgUgkgnQ6jXK5jFQqNSIc0MuWLYPneRX1DoLBYoZhYNq0aQD8axysDyCRSCQSyVBFBghJegJbu3b9QB9DXcJG1OD/lBobJNj4ww6FWsU9a32+VtHXsCRIcPuwEyLovOjse7dmUjrYJ7L1jo+uCV0zei34u97ne/L9fX39aGFS65yCUcXV3gdq69EDGPKLvFrSOvR6WNe1Wn/rS4K679W+vx7BOgPVjnUgHtLduWadRdbVG8+C31VLoq3efezJmNiVAs6e54Bzjng8jlKpJGQTEokEjjnmGP7000/DdV2oqrqFpI+/P4bddtsNr7/+BgP85xHnfiFhwzDqRhoOtJOgp/2ntz5fq/8P9knswD9/Ox//HcdBNBqF4zgol8swDENks8TjcRSLRcTjcbiuC9u2YRgGLMuC4zhIJBIV+7JtG47jIBaLoVAoIB6P133+9PT5PNDUGp+6+vwZ7OfX19D41h3pxMFET++fbdvCmE8GaJKfASBeP/XUU/nf//532LZdsW4IMmrUKHzlK1/B7373O2ZZ1ojQsGeMwXEcIbVHjnXP82BZFnbeeWe+dOnSiucFvQ8AkyZNwvvvv88SiQR0XRdzFiqk3Nft0HEccZ9I5gnomPeTBG6wPXDORWYIADGXoH1EIhE4jiPORyKRSCS9z1AfX3s6f+np+Y/0+W93GIi21uc1APoamujVklwhDW+g0ltG/4e3D+6rs0VeV4xfEkl3DCDUpmq1S0n/U8tw3ZmBcqhPGvqTgW7fqqrCNE3Ytg3btoVDef369fj444/F8yXcDoI1A2bMmCEcmK7riucH/S2RDBSRSASFQgHRaBTJZLIiWrZQKCCRSKClpQXRaBSxWAymaSIajUJVVXz00Ue46aabOOd+Qey5c+cy27bR1taGhoYGtLe3I5lMDvAZSiSDF13XRX/J5XJIpVIAfENuqVRCKpXCd77zHT5v3jxh4A5GsGuaBsdxkMlkcPLJJ2Pu3LmM9juSnABkJKdgqkgkgp/+9Kd83bp1ACqfySSb5HkettlmGySTyYpAkvAcuy/RNE3IMcXjcSFrSwZ9Oi7HcUTmB9He3i5kBQkKRtB1HY7jjAiZJ4lEIpFIJL3LkHcABA0u1SQ7gpHEYc12olrEaFcM/NLQJ6kHRfjUIhghF16YBB1QUtJqYOiuA0dSyWC/JkGHMBkOdF3H97//fb5ixQqxXbgfk6EmlUrh+utvYMF9ABAGiIGO8JeMbBhjiMfj4JyjUCjAtm3EYjEYhiGMTU1NTQD86NMrr7ySv/POO/joo4/Q3t4uMgh0XccDDzzATzjhBPzqV79iAKTxXyKpQ7FYRENDAzZs2IDRo0eL16LRKFKpFC644AJ+3333oVAoiPkf/Sbt/3Q6jRNPPBE333yzeACNpAjw4NyX1nCRSASLFy8WcnvVMpE459hxxx1FVl7ws/2VOWtZlnD62LZdEd3f3t4uJJsAIBaLAQBaW1uhaRoymQyADiduIpEYEfdbIpFIJBJJ3zLkHQD1UovJAEOTyKDBtV5Er4zyl/QUame1ZElqOZ2C0jGSgaOWNEk1w394AS+pTriNB+nv60ZSAIqiiPvmeR4WL14sJH+qGQzotW23nYZJkyagUCiBMSaMNiS7MtDI8WNkQ22aolAbGhrgeR7a2toQi8WQz+eRSCRw/vnn8xdffBGffvqp0B6PRqMAfINloVBAa2sr7rjjDrS0tPBrrrmGjR07dgsJO4lE0gEV8h09erR4hlDR+Tlz5vAHHnhA1AHgnCMajQqDsOu6SCaTOOaYY3D77bczivjO5XJIp9N1g0uGAyTJF5xXaZqGcrmMRYsWVWwbnDO7rotoNIr/9//+HwvKr4Yd9X0NOVn9WkN+tkY+nwdjDJlMBpRd1draih/+8IfccRzE43FccsklrFQqIZ1OV8gB0T4oE0DOMyUSiUQikXSXIe8AqGaIC0v+hCOoaUIZNrgSwXoB4QjOWgZBiaQzutJuqslOBX8PFV3s4UR3NaCDToDgdiOVzpyo1dp0fztPKDMs6AhYt24dPvjgA3FcFM0fhJwDe+yxuzhuwF+gm6Y5IOcikYRhjMGyLKTTaTDGUC6XUS6XkUgkoGkaPvvsM3z961/n7777LkzThKIoiEaj8DwP5XJZOLVId7qtrQ1/+ctfcOWVV6KxsVFKUEgknUCyNRTBbVkWFEXBmjVr8Oc//xkbNmwQ2+q6jnK5LOrNGIaB2bNn495772UARB+kqPFoNDrsny/0XAb8CHr6e8mSJVi5cuUWtRKCz+tp06Zh9OjRQtqP1n20XX9Auv9UVyWZTCKZTKJUKsE0TVx44YX8/fffx7///W+USiXhvLj55pv5mDFjcMABB+D3v/89o3osdP6maSIej/fLOUgkEolEIhleDHkHQJiw8b+aRFC1KN56mv8SSW9Qq4BqZ/Uoqr023Bd+g4WtiVCXskCVdDauDrTDhDEG27bheR50XYemafiv//ovoS0cPqbgcY4ePRrXX38Dy+UKMAxjc7QiKjIG5LNEMpAE+xdF/o8bNw4A8M1vfpPPmzcPbW1tIpLfdV3h3FIUBbFYDDvttBPa29vxySefQNM0WJaFc889lz///POycUskdcjlckLORVVVlMtlHHrooXzNmjUAIOrHUOYNFY497rjjcN999zEyIpMhG/ClZYKR4cOVYABWMIr+Zz/7Gc/n8+I9MvpzzkXm3a677iq08mk/ZEDvrzm0qqpob28X958cN0uWLMFpp53GFy1aBNu2xbnSvKFYLGLp0qXI5/M455xzODmBqC1omjYiMkAkEolEIpH0PkNeoDhc2DdoMA3K/ZD2v+u6cF23Iso//PlIJIJIJCJkITr7bomkOwTbG7XJYFusRq02KNvfwBAeN8LjR1huTLIltRyx1f7vS4JO4kgkAtu2sXDhwgr9/nAxXzKo7rrrrmhoSFc4MBzHE4vzwUA157esKTKycBwH2WwWjuNg3Lhx8DwPJ598Mr/33nuxadMm0X41TRMGtkwmg0MPPRQrVqxgb7zxBvv444/ZjBkzxNzp448/xvr16wf4zCSSwY3rusL4a9s28vk8DjnkEP7JJ5+I5wvNAVVVFePyKaecgttuu42R1Itt2+IZtXHjRqTTaZRKpYE8tX6BMiiAjnnBpk2bsHDhQjHnikQiWzyjU6kUrrrqKhYsek5Q/YT+wLIsZDIZFAoFUfvh9NNP5wcccABftGiRcEjQ2EtzSRqHN2zYgFdffRUfffQRLMuqKA49WOYYEolEIpFIhhZD3kIVNuQDEAZ8iqwBsIXBNegQCBYFDhrvgvUDwkjjq6QnBJ0AwbYbboeSgSV8H8I1Qqo5bqSBtevUcgL0F+TopQj+NWvW4F//+heAysK/4f4ZjUax0047wXU5VFUVzxHbtrcwOEgkAwUVqqbi1sViEYcffjj/29/+JiL9Ad+gZNs2LMvCjjvuiFNPPRXz589nVMuiXC5jp512EhIbLS0tuO666+QkSCLpBOpfpPN/0kkn8QULFmzxPjmiAeCII47ALbfcwlKplMjciUQi0HUdruti1KhRyGazI0YCxrKsimfxhg0bsHz5cgAdkj8Erduampowffp0EV1PYxsAcT37Y86h6zra29uF5NpRRx3FH3roIWSzWSGzRtJEpmmioaEBs2bNwoEHHig+s2LFCsydO5dHIhFomjYoagtJJBKJRCIZugy4paI7k7BqMhFhDdpqxX07+w6aWNaLkqwlBRI05Aa3C2YP0H5ou+4YCAfaiDjQ31+Pesc32I6/KwbPzozKwW1q7aerdSrC+qkDQWda+uH3w4XcOtOX7+3jCx9X+G/aNrx9MAug2rnWcyT29fkN1P5rFeML94/wuBq+/uEipOH2US8Lg7a1bRuxWAw/+MEPeD6fFwbRavJEjDFss802mDt3LrNtewt5ATI61JL1qvZ/veMbKPq7f9V7vbcZbM+H7qKqKnK5HFKpFLLZLMhoaJomGGPQdV28XyqV8MUvfpG/9tprFdHHuq6LuhUHHXQQ/v73v7OmpqYt5lkNDQ3gvKNQaTabrXt8Q/36dvbs7Ox9iU/YYT7csG1bGOZJtx/wNdp1XQdjTEjQnHXWWfzZZ58FABHVTzDGYBgGPve5z2HevHmMisnTM4WMxPQ7nU73/8kOAJ7nIRqNIp/PI5lMAgB+8IMf8OBzn6SRKEuCc459990XpVJJ1EkgpzxF1/dWWyTpJmoDiqKI/wlyon7lK1/hTz31FFRVFcdDx60oCmbOnInDDjsM1157Lctms/j85z/Ply5dCgD45JNPRG0IiUQikfScwT4nqTe/rHf8PT2/wf79kp4x4A6AgaYzY1w97Wqgw0AVzBbojnFHNnBJT6jnFKgmjxXeXjJwyP7fOd2RYNuaa0l6y47jwDRNvP/++yI7jKIESYaBtrVtG7vvvjsMw4BlyQW5ZOAol8tIpVKwLAuxWAyccxSLRTDGEI/HhfF/w4YNOP744/nbb78NwzBE3QvDMETx3yOOOAL33HMPMwxDRKSqqiqMZlTAtFAoQFEUIVMhkYxUdF1HqVRCLBaDoiiizwQjzMvlMn7yk5/wv/71rwBQIfVCxuByuYwZM2bgtddeYy0tLWhqapJzA3TI9SSTSRSLRXieh3//+99bBIYEDeOpVApjxowR42Ff43meaAP5fB5UsLe9vR2KoiCZTOL444/njzzyCFKpFAqFgqhn4LouEokEZs2ahUcffZQBvsRROp1GIpEQ0kb5fB6O44haBwDE2CyRSCQSiUTSHUa8AyBMWOqBIm6A2lGo1aKCgxHLtb4jvC+JpCfUa2tysSAZanRVfm1rI+xp/E4kErj88sv5okWLxNgdLMpHvx3HQVNTE2666SYWzj6QDD5GwvOVMguj0SiKxSISiQQ8z0M+n0cqlYLrujj++ONF5D+1ZYrkVxQFxxxzDB555BFRaJK2o7oYqqqiWCwKvW1FUXD++ecP/4srkdQhmE2jaZpYM1C/+X//7//xu+66C47jCGM1yYySdNzOO++MBQsWsHK5jKamJgDYXFR+yKu09oignJ6qqvj+97/PP/300y22C67bpkyZgv/+7//ul7GJnKiUTatpGhhjaG1tRWNjIzzPw7HHHssfe+wxxONxFAoFIedULpfR0NCAb3zjG7jhhhsYFQtubm6GaZrI5XIAIMZgCkTobG0pkUgkEolEUo+RPbtEdWmVarUCOiv6STrSiqJU1A7o7Ls6K/oqkWwN9aSs5IJBMtSo13arvdddWTmKHly4cKEwbtLrQQcARW5+7nOfQ3NzM8rl8laeVdfpSp+W/X3kEo1GhaEI6DCYlUolJJNJmKaJgw46iP/zn/+EruuiPScSCZTLZUSjURx33HF45JFHmOM4yOfzQuM/kUgIbXLLstDW1iYkTxKJBMaOHTsg5yyRDBZs2xYZNUHHGWXNzJkzhz/wwAOiP5GDgPoh5xzbb7893nzzTUbSMY7j9Guh2sFMJBIR2Xm6ruODDz6okA2sFkw1Y8YMNDQ09JtcDn1vNpsVtYSoPsPxxx/PH3vssQrtfkVRUC6Xse222+Lss8/GDTfcwBzHQTQaBdBRr4Bk2TzPQyaT2ULudqDlOyUSiUQikQxNRrwDoB40ma/mEKimX11LUkgaaCT9Sa22JtudZDBRzbEa/KmVXVWNrWnbZNhfu3YtPvjgA3FMwf2QnAPnHPF4HHvuuSc8z9tiQS6R9Dee5yGdTsNxHORyOaH5T9HFRx99dNXI/0KhgFgshuOOOw5/+9vfGADkcjkkk0nYto14PC4cXIwx0UcAPzJ5zJgxyGQyPT5+6cCSDGXI4RbUfS+VStA0DcuXL8e8efOwfPlyxONx5PN5kVlGzrjp06dj3rx5LB6PC6ezqqqwLEu2/82USiVEIhFs2rQJCxcurBpgRVkX8XhcRP/3hwOAjqVUKqGhoQGA3xYMw8AxxxzD582bJ8ZeCiiwbRvTp0/HI488wq677jpGkf2GYWDTpk3QNA2maWL16tVQFAWcc0yePLnCuUTzEYlEIpFIJJLuMuIlgMITqWo66dUmWmGJoFpR/9Xkg+TETdJb1JJDoUVCWMKqVp0LycDQ0yI7w51qOv+1CvOGt+sKZNy87LLL+KZNmwBgi0U2SaE4joNddtkFV199NSuVSpsL/43s+zPYGe79q1QqichiqleRSCQQiURwxBFH8Oeee048A1zXhWEYKJfLYIzh2GOPxf3338/K5TI452hsbBTGNiq8SRrlmzZtqnAATJs2TWpQS0Y8QeMt4EdvJxIJtLa24vjjj+cfffQRkskk8vm82J76zA477IAHH3yQTZs2DZZliahxcsCZpinrbGxG0zRcccUVfOPGjQB8x4vneVvMaadOnYrp06cDgCgA3NfYto1YLAbAnzvEYjGcfPLJ/IUXXhCOTBqDGWMYN24cXnrpJTZ27FjkcrmKbKzm5mZ4nodzzz2Xk6yQqqqYMGECgEpZKOkgkkgkEolEsjXIDAB0XWaBCDoFqmUIVDNK0SSQ5II6kwqSSLpKNVmq4O9gu5MRlpLhQL123J12rSgK8vk8FixYANL0Dzp3CTI27L777iL6vz9qAEgJIElnMMZExKmu67AsC+VyGWeffTafP3++2I4MU7ZtQ1EUfPnLX8bdd9/NLMsS77W1tUFRFBiGgbVr1yKZTAoD1IUXXsiz2axwCMyYMUMa/yUjHs45LMsSReIVRUFrayvOOOMM/t5770FVVeTzeZEdoGkadF3H6NGjceSRR2KXXXYB51z0XdonyclIIIr5vvvuu1s4/sNz3T322KOibkB/QN9XLpfR2tqKc889lz/xxBOiZgoAMV9Ip9N49dVXGUkUpVIp4XAFIOpELF++XJzXhAkT8MMf/pDRfhRFEXJTEolEIpFIJN1FziBChA0o9Yyn1Yz/tRbG4f1KA42kp4QN/+GFkZQCkgxlws4toPO6AFsjAbRs2TJ88sknoqAfQQZ+Wmg3NTXhf//3f5lpmkL3WSIZSKLRqIj8z+VyiMVi+OEPf8jvuusuAB1tNxKJoFQqwfM87LXXXrj77ruZpmlwXVcUD85kMsIQOW7cOORyOZH98s477wgnWFNTE66++momNaglIx2SayEnAGMMZ511Fn/yyScrniUkEUSR/rNnz8YNN9wgsm8AQNd1FItF6LqOdDotny+AuK6ffvoplixZImT3ws53cqJcc801jMa5/nDQU0HnXC6HaDSKX/ziF/wvf/kLSqUSVFUVEfvlchnJZBInnXQSxo4dC8MwRBYD7ce2bUQiEbS0tGDRokXivXHjxiEWi4l1I10XiUQikUgkkq2hz0MlumOQGQwGye5GtQUdAcGIa3qP0jhpMhc2XgXT6KtpYHcnyqOz61dNSqPeZ7pCT6MAaxnyqmmAbw31jm8wtLl6hA33wetST7KqmgRVsH1SanI151U46yX8PQDqts+uSLRUa5vVzm9r7lVfS4B0df/V2nm4jVc772r3stprtRjsUWLduafVzj8ocVVte9JC9/WBoyiX/eJ6qVQKxWIRhqHh29/+NqdjMU2zQlYgqJ1OxQU55ygUCohGo30uAVRr3K71fph617en/aOnfbKvx+d6++/59/fMCM5599p/cDzx2zYH5wy5XAENDWl8/PFi/PWvD8B1PZFtaNs2NE2D59mYMmUK5s9/liUScRQKJSiKglLJBP3PGEM8HkWhUIJh+Eanf/3r31i2bDkABsYi2HPPz8PzfONnXxvZBqJ9DmbqjQeDgcF4TLWod6yUXUPa7b7sm1sRZa6qKnRdh2maOP/88/ljjz2GWCwGkokDAMMwYJomFEXBPvvsgz/+8Y+sVCqJyG+6rxTtTvutxXDKvqHnbXA+RD9UDPnKK6/kpZI/PlE0PT2baY4zY8YMjBkzBqqqCmm0nl6nUqmEeDwu9PvpfrquKxyvqqoiFoth3bp1+NOf/oT29vaKjA5in332wR/+8AdGjh0KJKAskng8Ds/zcMkll/B8Pi/G75122klIvJFUkEQyFAjWyqK+TUXOo9GoqHkSbNfUL6hvu64r+jzti7KtJJLOqLaOrvZ/T/ffV9Q7/sE+1+pr+8twopYdtCfUtQ/1aO+SLlNNpqWacTaYddDZA65apkE1OZihzGAf3IYCtdpd+PV68iHV/pf3p/epZuTujJEuAdPZdSLDgq7riEQiyOUKcBwHmYxv/Nc0DStXrsSyZcvE9uFrRouQSCSC7bbbDrFYDKqqbjb+932EoWRkE6xHQXMCkhCk9q2qKpLJJFatWoMvf3k2X7dunQg8oKhS27bR0NCA5557ntm2jVKpDMMwEI3q4JyjpaUNiURssxPM17T2NcgVfP/7V3AyxHHOscMOOyCRiMGy+r7IpkQykFDNjHLZ7y9kgPY8D6ZpolgsCmP/smXLcM899wDoKFxLDgTTNAEAu+yyC5588knW0tIidONHOmGjPwWkUM0Szjk++eSTivoJAIRjnu7H9OnTYRgGFEUR9RR6Sjwer8jQ8DwPxWJRzAuocK+qqjjyyCP5xo0bkUwmhfFf0zTYto3dd98dd955J+OcQ9M0rF+/HoZhiAwCMv57nod//vOf4rpkMhn8x3/8BwvLQUWjUcgMLMlQwHVdeJ4Hkhuk+fPGjRuFkzMsney6rujvlmWhVPKDFSzLEk6D4WDjkEgkkr6inn1IOgD6mGoG12DdgLCxPmj8V1V1C/mh7n73YKeWs2IkGC/7g84M/8EFRNDx1Jm8irwvfUdnUQq1MjMknUPXiowEhG/Q0TBnzhy+bt26im2r7aO5uRlz585lnueJRbvj9L8BtFa2zEh1AA11unP/gq9xzoUDKpfLgTGGr3/9a/yTTz4BY0wUDyWDmqKoOOGEEzBt2jZobMzAtm0wxmBZDuLx+GZDlQvbtsXiWlVVLFu2Aq+//rr4zp122gnXXDOXAZ1HKEskwwXP8yoK9FJmmWEYQuanvb0dhx9+OCcjV0e/U2CaJnRdx6RJk/Dcc88xAGhsbJQyLiGqOQEikQiWLFmCxYsXA4BwDASDo+j+XHPNNYz+Z4z1moQSyfkAEE4JP6PKd7A2Nzfj8MMP5++//z4YY6Lgs67rsG0b48aNwxFHHIEJEyaI4xo1ahQAfwwtFAoA/LXf+eefz1esWAHAH2+32247UW+F2hFdq6GwvpOMbBRFEX2ZovpJomvUqFEoFAoi+4W2Y4yJ+hmMMcRisYosAuqLUiJNIpFIth65gutHqhn0KJW0mvxH+HWKlAnKhtSTAxkqRqCwFIqc3PYe1QzLwXYRbnu1CllX+6yk9+lK26+VGiiphNLm4/EYEokEXNdFPu9HbVqWg7feegtAh5RQNekfz/Ow4447Yty4cSgUChWR1X1NtX4o++DIgYzx4YwtGqNJfuIb3/g6f/nllwF0FCYFIKRJZs2ahT/+8XbW2urLU2QyKeRyBbiui1QqhVQqgY0bW5BKpYTEVSaTwne+823e2toqsggOPvhgqKoKy3KkA0Ay7PGl4+Lib9d1oWmaKMJKhtl99tmHr1q1qsLhTAVdAd/g//zzz7NEIgEAsojrZoLyP8HX6Nq6ros5c+bwQqEgZECAjhoAVHx52rRpmDZtGkzTFONSbzwjKWKZ/qYMEM45isUiEokEzjnnHP7yyy+Dc16R7UEOoKOPPlrUTCFpIgBCmo2cRIZh4KWXXoKiKOLY99hjD7GtrusiOtq2bUSjUTn/kwxqisWiMO6TXJaqqqLWCfWFcrmMSy65hK9YsQK5XA62baOxsRETJ07E9ddfz9LpNCzLEmNmsF9KJBKJpPvIEXQACWpeAtgi2p8ijWjbaka/sLF2KE8Iqxmmh/L5DGaqtZmwAyr4dy1D5HCnrw2t1Rws/fn9Q51qmRHh9uunEncY+R3HQUNDGueffwFftmxZhaZwcL/UNwzDwMyZM0XUNOlA+4WA+0cGKNz/ajnoJMOLSITB8yqlgIJGKNd1sXTpUjz++OMVEXFB4+TOO++Mv/zlL8yyHDQ2ZpDPF2GavvFJ13Xk83nE43HEYjEYhob29hxSqRSWL/8Mr732mpA4mTBhAq6//gYWiQC6rqJY9LNoJANHvWewHB96huM4ItrbNE0h21Mul4Ux66CDDuIrVqwQfZMcx+REbmxsxEknnYTtttsOlmUJY6+UkPOhZzSALTJQs9ks3n33XfEeBUzR2oja/8yZMytk0sg52tM5alD3P2yAjMfjWLJkCR577DEEdf1J/9+2bRxxxBG4/fbbmeM4cF0XiUQCVPuB5IGi0SgKhQKuvPJK/umnnwp982233Ra/+c1vmGVZFW2L6rpIJIOdWCwmsgqD7ZacqqtWrcJ3vvMd/t5772H16tUAUKH3n0qlsGTJEv7AAw+w0aNHw7ZtWJYlpBBHwhpUIpFI+gIZgjJAVJNmIQ3I4E81iRySaqHJcthxMJQWfVICqG+p1yaC7TDY5rqyH3mP+p7O+kdXfkY6tIB3HAemacJ1XWQyaQDAggVvAoCQSwGqZ1ZMmjQJc+fOZblcDpqmCcPOQGjwygXP8KJe/+W8MlDAlwZUxAK4WCzi1FO/ytva2sRnNE0Txq+Ghgbcf/9fWGNjZrPx0UYyGUd7ezsMQ4eiKEKL2jAMlErm5poZwFlnfZOTPAUAHHrooVAUv3+4LkcsJotRSoY39DygCGzAdwokk0lEo1Gceuqp/M0330Q8Hhcyc9SfPM9DOp3G7NmzcdNNNzGKWiXZIFnE0qfWM41zjp/+9Kd8+fLlFZI+FPlLDtDGxkZce+21zLIs8SzvLedKsOioYRgiE4peP/XUU/mGDRtA2v6A7yhgjGHHHXfE/fffz0iznOYLpVJJnDPtJ5FI4KWXXhKygq7r4qCDDoJhGKDzogwCAJuDD6QTQDK48WUGLTGOtre3Q9M0cM5x3nnn8S984Qv8iSeewOrVqxGNRivqokQiEbS1teHll1/Gd7/7XTFIkHNASqhJJBJJbeqtL6UDoI+pZZCrJvcDoK4zgLYJ77+aE2CoGwCH+vEPBrrSFsK1KYLRxbXa7nBoX4ORanIf9Dohr3sHnRnEKWJO0zQRNeRH8QOXXXY5//jjjwFApOyT5nBw37qu4/Of/7wwqEYiEZim2W9ReNUcQOF20dmPZGgTNP5Tv/e8jsJ4F1zwXb5w4UIoSodUEEXJRSIRzJ49G7vuujM47yjGl8sVMGbMKJRKZWHYJINSoVBALGbge9+7lL/55pvQdR2lUglTp07FH/94B7MsB47jiX4kkQxn6HlAzjcqTul5Hs4//3z+6KOPCkccZQuYpikivA8//HDcddddzDRNMU8nDWxZxNUnPN+kMaxcLuOdd97Z4jlGNXjo9R122AFNTU0V2/RW9nDweGj8JWP86aefzt9++20xPgedDqNHj8YDDzzAGhoahFyQYRhob29HU1NTRZZIoVDARRddJGoIRCIR7LDDDvjDH/7AAL/gL1ApeyLn35KhgGmaFTI/1E/PPPNMfvfdd2PTpk1iW9u2USqV4LouotEobNsWdQMWLFiADRs2QFEU4WiT81uJRCLZeqQDoI+pFzUdjOQnqmUFhP+uZhgI/z1UGcrHPpjpzHBfywkQ/ryk75AT2q2js7ZKbdl1Xei6H4VnWQ6WLVuGfD4vZAQoujMoRQAA6XQaN998M/MNozEwxoSEQ3/2h86cAJLhSzXjGBn/c7kcHn/8caiqCtf1jY/UJuPxOPbee2/cffddLJcrIJfLI5NJCQksAELPPJvNiu9Ip/3smOeeew6FQkHsb7/99oeuU3HgCKJRHaWS2d+XQyLpV6j/UeQ14EdfL168GH/5y1+2kN0i47RpmjjssMPwt7/9jXmeJwxaJPlCcjYjnaC0WVDulBwAH3zwQYVTnp7XNC4pioIZM2ZsIdUT1NHvKcHvK5fLAICVK1di3rx5APxxkyL8VVWFpmn40pe+hF122UU4YmOxGDzPQyaTQbFYFLULqI7AM888I9oS5xyHHXaYcBbRtpStRUZSqYEuGexQn8zn88KRddhhh/F7770XpVIJlmWJAATA79/bbrstPve5z2H06NHCgbBy5Ur87//+L6fs23K5LD4jkUgkku4z4DOInk7StkYzu7cNN0G96OD/9HdXj7Ha6+HXwvsLFxKrZuCtdnz0E05DrpWRUO37essIVe87e2PfQ5VqTp3gOW1tIbnwdanVbupB7ada5HE4Ujl4/GHDVphqGufVMl96Sk/3UU0yptp+w8cb7pNdOZZq17Xe/Q9GGQ6Ec7CvvytoNKh2TWMxA9lsfrMBxje42LYtiv/StrTA9h0Fukgv3muvvcTCxbZtocFLmQDRaHyLY6rVZrtKd+5vX9MX929r2vxwp5aDR1UVlMu+LI+iMLS0tMEwDDQ2ZrDjjvvyXC4nDEEUpUoyI//4x7OsXLbEItw0femKeDwO07SFpIVfENtCNKqjXLZw7rnn8YULF4p+sP322+POO+9knHeMJ7bt18DgvGdGzHr3t177GOrP9+7S3fPt6fXdGrrTZ3t7/t/bn6dnQiaTQaFQQCKRwMaNG3HKKafw1tZWYZwFKjXqP//5z+PJJ59kwULyQekamnsPxP0ZTAQN/0Q2m0VDQwPOOecc3tbWVjF3JCizL5VK4Ze//CWjqGDHcSqc+T19flJWIN27ZDKJYrGIo48+WsijBddQjuNgn332wd13380os5DkSjj36wnF43HRlgDg/PPP54sWLRJj9+67745rr71WRP8H12mcczEfGSnPRsnghTGGcrmMaDQqAmOouHWw/1Hh3y9/+cv8+eefr+iXJJcWjUZxyCGHYN68eWxzP+KbNm1CoVBAJpMR4yzV4JLtX1KvDQz087Wn31/r87XsDt1lsK+/Bvr+DTR9ff4yA2CI0xUJiLBMEGUd0AKkmqREOEU5bHyUEhMSopphvposlaT/qXb9h7NETPicCoWSiLgEgFQqhYsuupBv3LixYnvP80REJmmWptNpbLfddohGo2I8pIUHRU9LJH0JY+ScYli5cjWamhqgqipOPfU0vnz5CgAd+tQAEIn4BstTTjkFqqp2Ou5SpK2ua5szCgqIRnU8/fTTm7/bL3h96KGHQtdVlErlzVJYgKYpIhpWIhmu+BljvjM4kUggl8vh5JNP5h988MFmB5j//KDIdM45dthhB7z66qssWD9DUhvLskTRXMA3epdKJZBEX7X5I0nw7brrrmhsbBTPbvpNjvqeQgEFqqoin88DAL7xjW/wf//732J+67quOPapU6fib3/7GysUCjAMQ0iYUJSz67rI5XJIJBIoFouwLAsPP/xwRa2B++67j8XjcZkhIhn0kNwZGf8BiCxDysLxgwuiOOOMM/gLL7wAAKJfUE2tRCKB0047DU8++SSjfRUKBeGAK5fL+Pa3vy0GAc/z5JpSIpEMa4L2m2o/PUU6AIY43XEABI3/QemhWsbBalGJnb0vGX7Ua1/VjP+16lEE25psP/3DSHDAdNaOglkBpVIJkQjw5ptvolQqVc2uCX5uxowZuO666xjQEV1NUXoU5SSR9CXlsoVUKoFSyURDQwMA4Ec/+hGfP38+yuWSGG+pLoXrOjj44ENwyy2/Z12pURGJRJDN5tDYmEEqlcCJJ57EV61aBcBf3M+cORO33noLK5VMxONRaJqCUqkM+l8iGc5EIhFomiZkV84++2z+4osvAvAN12SkpWfM2LFj8c9//pOpqioivCW1oWcqRe1ThPtPf/pTvmjRoi0yQTsyo3ypnZkzZyIajYooYtqut+rzBOcIsVgMc+bM4U888YQIkqJjIvm1o446ChMmTKgoCByMdrYsC6lUCpZlIR6P44QTTuBr164VhU0PP/xwbLfddmJbiWQwQ/2W2nupVIKu6yLin/rhV77yFU6OLgo8iMfjQgLovPPOwx//+EfW0tKCeDyOJUuWCIcbY379FaofINeNEolE0nMGXAJI0jO6kgIVll+pJiFTbT+19h00/g5nw6KkPrXkPMLSLNW2l/ScetczeB/C8jjDof92NkYxxkS6PaXwf/TRIixevFhsE4kwsS1jHUWDGWOYOXMmdF1HNpsF536dAMaY0HMeaHkeyfDHj6DzI/wty0J7ew7z5z+DlpYWsY2qqsIYOXHiRDz22GOM5K7qYVkWYrEYAGDVqjV4+umnRR9Ip9O46667medhc/q9Acvyaw340f9Sg1fSM4bCfIAMvBdccAF/8MEHoes6HMepME67rotkMol33nmHUcaYdBJ3DbpGkUhEFCVfvHgxghkU4Qxky7KwzTbb4Oc//zmjKGH6oe16I0qY9p3NZpFMJjFv3jxR0Dco8WPbNg4//HBcf/31jKKfgY45MRk6Sb6HMYYPP/wQL730kpiXTZw4EQ8//DBzXRfFYhHpdHpI9A/JyIXGPkVRUCqVhExPNpsV9YTOPPNM/sgjj4h+kkwmkc/n4TgOJk6ciKeffppNnz4dpmmKNn/99dfzDRs2CBnCMWPGoKmpSWQWKIoiswAkkh4iny/Dm7r2oX46DskAQdIVweKuwb/DskDBzIBwhoB82ErCBA38nenVhdvQcI9KH2xU68PD6fpXa4e+Yb/jPNPpJC6++GJOi/EgNCYCfvTgtGnT8Ktf/YqZpikKjimKIoo8ApAp+pI+xzC0ioX1WWd9U8hPAH4btyxLpN8fc8wxSCbjyOfziMdjdSXAKHq2WCzj+OOP4+VyWUS2HnPMbGy//TRRiM+yHJRKJWiagmQyga46GSSSoUqhUICmaVi5ciUefPBBRCKRLaK6yTF85plnYvz48cL4Kx3E9Qk+Q8kRv3HjRnz44YcVr4eNfZxz7LbbbsIZT89zGruoKG9PiUQiKBQKSKfTOProo/lHH30ExhgcxxG1ATzPw6hRo3DfffexaDQKVVWF7r+maRWR/IwxtLS0QNM0nHbaabxcLosMiMMOOwzxeBycc6TTaTm/kAx6goEwVJOjWCyK97/5zW/yhx56SMybKZtKURRMnDgRp512GnbeeWe4rl9TiOYqy5Ytqyh0vf3224u5CtkmZIaMRCKRbD0yA2CYU03GhyJOOjPsh1+Ti5mRSVcyTMKR5bUYTgbnocxwuw+dZTUUCkXEYrHN2rsFvP3222IBD3RoBZO2fzQaRblcxuc//3kkk0mUSiXEYjER9RmUFugtnWGJpBblsoVkMgkAWLJkCebPny/aaiQSEUYu0zRxwAEH4KabfscKhVKX5UcUxZe0+va3z+FvvfWWiLjbY489cMcddzDH8RCN+s4Fx3GQyaRQLvsFgyk6ViIZriQSCRQKBRx++OF806ZNwuAbLBpvmiZOO+003HzzzaxYLG4usm0KnWtJbYKSPYqiIBKJ4Mc//jFfuXJlp59Lp9O4+uqrGcmDEEEHQG9ENzqOg0QigX//+9945plnRHFTqgFEmSAnnHCCkGijoqjBos+GYcBxHLiui6amJpx55pmcnByUbXj77bczACgWi8hkMjBNU2RnSSSDEU3TxJyYMnlUVUU8HsdZZ53FH3jgAZimKfoljZnjx4/H008/zXbccUc4joNoNIp8Po9kMgnTNPHWW28Jgz8ATJs2TSoPSCSSEUVfF2mWq7chTleKRIT1M8OFfLdWz10iAaq3o3AR6SDBjBNJz+hKjYZa9UCGQx/uTAII6IjsVxQF55zzLd7SsqnT6EDP8zBp0iRcd911zDTNCskfikiSqceS/oKM/Y7j4GtfO5Pn8/nN7dk3LvkGMBWNjY3405/uYo7jiMj/ctnstJ1yztHWlsWSJUswb97jwqEwatQoPPHEk6xQKMBxHDiOC9f1EIv58hV+0U5HyptIhj2FQgGzZs3iy5YtAwBhrAL8oBjDMHDggQfi3nvvZQAQj8eFRIw0/nedoFTOu+++C4qMD9eNornjjBkzsP322wt9cIKM8r2FZVnwPA8nnHAC9+XYrArDPucc++67L2699VamqqrIFiwWi0LSiLKzLMsC5xzZbBZPPfWUOK9JkybhscceYyQplMlk0Nraing83mvnIZH0FZQNA/jSPyTh9cQTT6BYLEJRFGiaJubhsVgMRx11FHbeeWdEIhG0trYCgCj2u2TJEhSLRZTLZSET9F//9V+MnG40rsr5h0QikWw90gI3zKknuRKWByKqGQ2r/S2RBOnMqQTI9tPfdEWWabgRPOdoNIpSqQQAeOONNxCJRLa4Jq7rIhKJiLT9XXbZBWPGjIHnecIAWywWRSQfbTtcr59k8KAoClQ1gosvvohT9orf7vjmCHy/8O+xxx6LiRMnIho1kM8XKrKyqrVTek9RFHz1q1/hLS2bwJg/HTziiCOQyWQQi8UQjeqba2hEwDnQ2tqOdDoJXVeFBrZEsrV0x4Fdb27RF5xxxhl8wYIFoi4G4GfbMMZg2zamTJmCv//97wzwDbymaYriljLAoT4UPayq/niyfv16fPDBBwCqZx1TQNK2224LXddFOyA5EIowBtArDph4PI6TTz6Zf/rpp8IBYZqmiE5OJpO45557mGVZwjlEUifBDEHHcaCqKqLRKGbPns1bWlrgui50XccRRxyBUaNGibmJbdsim0AiGcxQDSGqAZBOp7Fu3TrMnj2br1+/XjjBaI5t2zaOP/543H777axYLKK9vR2jR48WGUDRaBTf/e53eXt7O5LJpKiNMXbsWACV0l4y+1Yi6RkDPb+S9C317q9a7xbXM3JEupiiEN5PbzWurTHCBL87aBAKH2tX9h2W1BmMEbbh4whradLvalIu4WgX+psm58FJdrV7Wi9atpbUEEWR12OwXOPhSr3r29U+Uuv1YPui32HnU/gzwZ96i+z+ah+1vqe7r4fp6TgZTpkNX1dFUbZw/FXbrtprg6HvMVY57lJ6vp9h4htHU6kELrjgAv7ZZysAAI5jB/cgfruuh1Qqjd/+9iZm2y4YUzYbFDhiMV9SxbIcABG4LgdjSuA4ao+xnb1W/Zz677r29SSvr1MYe0pPr3VPz880S4jH48hmc9A0DbFYTBgYfRkLP6ruiSceBxAc8/z6Fp7nYvfdd8dvfvNbZhgaymVLSJBQMWuqEUDSFKVSCZFIBLqu44QTjucffPDB5owCjt133wO33/5HpmkKTNMGYwypVAqu65+Hr03t/+1rn9eXiJMMHINhjO6MgT4+6k9krKU+ksvl8B//8R/88ccfF/NiKupLuteNjY145plnGOnP67oO13XhOB3ZMQN9foMdwzCQz+cRi8UQi8XwzW9+k5NGOBnyVVUVUf2cc6RSKZGhR9eeIowBCMdAVxwwjDG0tbWhoaFBGOlJ9s+2baxevRr/+Mc/KrIKdF0Xzs8jjjgCkydPBkX/k4FS0zQxBgMdxYQvu+wy/vLLL4tMhr322gu/+tWvGNDh3KB2ViqVRLaJRDIYIclAiuz3PA8nn3wyX7x4MQC/3UejUbiuC9u28YUvfAH33nsv27RpE5qbm0V2I61DWltbsXDhQjDGUCqVYBgGDjroIDG/p7GVCg9LRjaD/fna18cn9z+0Gej1t6wBMMzpaQerVYiq2uQ6bLwNGh7rUe2z0ngw/KlmfAYGp7F0ONLT6z/Q0MKaDP8AhOGTFu2lUklEFQadiv45Vp7n9OnTMWXKFLEYl0j6ElpA67qOaDSKbDaLeDwOxhgKhQJSqRROPvlkvmbNmgpDGDm54vEEZs2ahUwmhVLJ3CzZ4yCRiINzX486Ho9i7dr1SKfTUBTfSZZMxnHhhRfxV199dXP/cZDJZPDYY/MYReXKCGbJcEdRFBQKBSQSCbS3tyOVSgEA1qxZAypeSUZdwzBExHoikcDJJ5+MpqamCp32YJ+hPirpnGg0CsuykMvl8Mknn4BzLp7liqJsIemz7bbbYty4cb12bTOZjHDq2LYt7qeiKDj11FN5LpeDYRgwTVOMwZxz7LzzzrjxxhsZOY5I6ofmJPTjF07XoKoq5s2bJ/Y1evRo7LPPPkilUhUZIzRHicVicg0kGdTkcjmkUimUy2V4nodvfetb/NVXX4WqqsJob5omFEXB+PHjcffdd7NcLofm5mbR58h5Fo1GceKJJ3KSDXIcB3vuuSfmzJlT4SADZGCBRCKR9BQ5Ox1hdNeoRQYF13WFVFBwX4qiiOJdwXoB9H5wIlwrK6Law1w+4EcG1dLNamXQhF+XBtqeMxzS/YKSPL5kiiocAIZh4Gc/+xl/5513ao49vqPSfxR+7nMzYRhapzUsJJLegopVkvGIjEuMMSSTSSxdulQU/g0aiMgoecABB+D663/NLMsBYwyJRAKKosA0LRHVbNsuxo0bg3K5DMvyZStWrVqDefPmIZ/Pi75z7LHHYty4sUgm4yIlXyIZzliWhUQiAc/zhOMtl8vhlFNO4StXrqzQlA/2zWOOOQa///3vWSqVElmMlO1KP/L5UR8ay3Rdx5w5c0Tx31qGPs45dtttN6iq2isOANu2KyR7NE1DuVwGAJxzzjl8wYIFAHzZJ13X4TgOPM9DMpnErFmzMH78eFEXgO55sChqLpdDLBZDoVDAqaeeyhcvXgzTNJFMJnHooYfiuuuuY0CHRBDgZ0XUCrySSAYT5DCNRCL40Y9+xB966CER1R+UF2aM4eijj8b06dORSqXE68ExslAo4M033xQOA8YY9t57b4wdOxau64oxQdbgkkgkkp4jHQAjiK7IVITpTD8qvMAJGvyDToFqhYRrHUc4C0AyvNlazbnBJLE1lKl1/YfK9aVFN2MMhmGI9GDHcYRD4OOPPwYVTw1Smf3gYfLkybj++utZS0tbRWEziaSvcF1XGHwcx0E6nRaRca7r4swzz+TlcllEp9KzlHOOSZMm4S9/+SvL5Qqb96PD8zzEYgYsyxJGfJKriMViaG9vh6IwnHzySXz58uVQVRW2bWO//fbHXXf9iRWLJRQKJeEEkEiGMzTGkwGWMYbjjz+eL1y4UEgD0XZUD+ZLX/qS0H0HfIMUGbzC8qKSzgnWEXn//fe30PcOXn9FUdDQ0IBf//rXrLcK/dIYxzkXcj22bWP9+vXC8UrO2eD93GeffXDjjTcyCpAi473jONB1XRw3SfisW7cODz30kPj8fvvth3vvvZc5jiPqRhCUwSjXP5KhgGVZKJVKeOyxx5DP5xGNRsXYSfPwgw46CL/97W8rFhQ0l7EsC9FoFF/72td4S0uLyBrYaaedMHfuXOEgoz7FOZfBCRKJRNJD5Ax1BBA25nXHuBfelgz/4Z+gATHoBKhWF6GaM6Ca1rtk+FNN+qkzajmRJFtHLcfLUMkKIM1cy7JE0V76OxaLYe3atXjvvfcAdBgTgm0nGFW91157IZVKCKcC6QtLJH1FsL2WSiWoqiqMSd/+9rf5a6+9JiKUqWYKObaOOOIIpNPJzRraBizLRnt7OwBfoiQYRVssluE4DkaPbsYpp3yFv/nmmyK6edq0abj99tuZ63IkEn60KiAzrCTDHyo+a1kWGGM4/fTT+fPPPy8MWFSolfrk7rvvjr/97W+MssvIKUB9EuiYI0sHQH1ojvHDH/5Q6IYDW0qPqqoK13Wx8847C+3w3pifkOE9m80CAIrFIhKJBM466yy+cuVK0T4AiMyACRMm4LbbbmOUERKPxzePsUXoug5FUYRRVNM05PN5HHnkkZzG0+nTp+Oxxx5jtm1DVdWKdkOBClKCUDIUaG9vh67rOOWUU/jHH38sancEHWo77rgj/vKXvzC/ZhATNYhoLmPbNtauXYvnn39eSK0xxjBr1iwhg0WZksFxYSisTyQSiWSwImeow5ytifoPb1/N4EqGf5IGCjoBqk3Ow0b/YGZAtQwBOfkduXRlYtcVx5JsQ/Wp5uAbSrJAmqZBUZSKKEwqcKqqKr73ve/xFStW1DXmJxIJXH/9DaxctoQmcFjSQbYvSW9DxR51XRcFRnVdx5o1a/Diiy8C8I1SQWOi53nYY489cNtttzHbdtHQ0ADAj1zNZDIoFstQFCaMV8mkX8A6lUrgwgsv4o899piQqkgkEjjqqKOw7bbbbu4/wJgxo5DLFaDrskSUZPijqiqSySQuueQS/uijj26R3eo4DizLwtixY/HAAw+wRCIhnic0fw0GuwRlLySdQ3r7H3zwgXA8krEv6FQhw98ee+wBAGKs7A1o3KRI/B/+8If85ZdfrvheMmYCwMEHH4ypU6cKySCK1qdjpaKmdG5HHnkkX7ZsmZD++cc//sEom4u+g843kUhUfK9EMpjJZDK44IIL+LPPPlth/CcZoEwmg8MOOwzNzc1C6z8Wi6FYLALw5zKJRAKnnXYab2trA+A72mbOnFmRYUOKAsExVUqsSSQSydYjHQAjiN5ckAQNYEFJoGCGQHgSGzb+1zL8SwPbyCRckLaWEbpW1oikdxhKDgBahFOEIGMM0WgUjuNg7dq1ePPNNwGgwlgQNM74OukqZs6cifHjxwu9Z5JckUj6GjIukQGpXC7jnHPO4UuXLhXRpWRosm0bjY2NOOSQQwD4bTkaNdDWlt3s9PKndLbtikU4Y77URnt7Dg8++CBM0xROsi996Uv4zW9+y3TdL27pO76AZDIBub6WDHds24bjONiwYQMeeeQRYYQGIIxOgF+s+4QTTsB2220n5rUkzVVtHiLnJl2DMYZVq1Zh4cKFFa8RNAfxPA9TpkzB3LlzWalU6jUHi+u6IsKfjI3PP/88crkcIpGI+H5yzO6888648847GeC3CWoLJEFo27aI/LdtG1/96lf5a6+9JjJITj75ZIwfP17UaqH5Bh1DcO3TWzJHEklf0dLSgkcffbRCustxHDFf2X///fHrX/+aARDyQLZtV9S5uPTSS/k///lPAH77T6VSOPTQQ0UmDO2bgnuGwrpEIpFIBjvSATCC2ZoJdGcG+rA8UL0oFmn0l4Spl0Ui6V2qZQBU+3uwQinztPCgRUI2m8VVV13Fly5dCk3TOtUN1TQV++yzDxzHQTIZRy6Xq9DklUj6imKxiHjc19svl8tQVRUrV67Eq6++Kt4nTVyKND3ggAMwd+5cZprm5og7IJNJQ9dVtLa2IxqNgnMOy7KQyaSwbt0GNDZmcNxxx/KNGzeKyNo99vgc7rvvfqYoDNlsHolEbPOiG8hmc5AKJpLhjqZpMAwDRx99NF++fDmAjmcizV89z8Oxxx6Lm266iZFBinSrAd+ITBljwc9L6lMul/Hzn/+cr169WlwzKswblFKKRCLYZZddxHPZtu2KqPythXOOZDKJQqGARCKBCy64gC9YsKAiyIScQJxzHHPMMdB1HaVSSRRZp7GWtk8mkwCA73//+3zevHniPA488EDcfPPNLDzfMgxDOA9o3UQSKRLJYOarX/0qX7lypRgvgw67MWPG4N5772U0/w5mt5BzVdM0PPbYYzBNU8zT99prL/zqV78SWTI0rgbtCbIQsEQikfQMtmbt+s43qDPI1huC636+jwfx7ux/a46lVoRy8Ccoj0Ov0ed6ev59fX3rfb6rRsJqUdvV5InCWvD1nAhB/cxqv4eiDmst2aZq96JeGuRAT5K21slU7e9qdQKCRt1q7/c0TbQ32k9P7l9vfffWvh8m3N+D12drnAc9/X7AE3r9lmXBMAxks1k0NTVh++2350uWLBGpyfQ7uKhQFBV77LEHXnvtn0zXVViWL/eQSMRRLJYqFuHV+mUwC6raNQgXVu7JuW8NPR2/B2L8qOWQ6q/vDP5f//t71n+p7ZKhPxaLYe+99xYa/RR5SgamKVOm4IMPPmCAr19tWX7RSSq2p+sqPA+iiDVF0X3nO9/m99xzD0zThKqqmDhxIj744F+MjJi1qDVP6fh/YNMEBvr5JumcgejLQYLGW4pM9TwP5XJZ6LV/7Wtf4/fdd58wNquqKvobAOy111548cUXWSwWQy6XQyqVgmVZFcVeazHS2ydjfpFPVVXFvaBrWCwWEY1Gse+++/K33nprixo9NHYBgGEY+Oyzz1hDQwNs2xZZfj0tBkrfsWnTJjQ2NmLKlCl81apV4jiCmQaHHnoonn32WUZZA/F4HKVSCbFYDLZti/ZNxs1x48bx9evXgzGGCRMm4O2332aJREIYQovFopAJkkgGI4wxtLS0oKmpSTjdaC598cUX81tuuUXIAFNfonnvRRddhBtuuIEF595UE4OcZCeddBL/+9//Lubk48ePx2effSZqrAyFICSJRDIy6c76eTCOZTLEQNKvBCfUYeNYtf/rGfhrLcBkFNbIYGsNmL3lgJN0Tl9fX8uykE6nkc1moaqqKP570UUX8Q0bNggHLEUoBY3/uq6Dc19XWNdVtLfnYBjG5gi/cl0DD41lXa1Z0dn/kpEJGSZVVYWu67jkkkv4v/71LyiKIiJhyYDmui72228/sS0VxyuXy5uj94H29hxs28aoUU3I530D06pVq/Dwww+LqOVoNIoXXniRySLXkuEOGZtorLZtG67rikjyOXPm8L/+9a8AgGB0Pxmex40bh7/+9a8sFouhra0NDQ0NMvq0GziOI+olkJOSHCg0Nq1atUpE01PAT3h+v8suuyCVSoExJpzyPTX+Ax1F2Jubm/Gtb32Lr169WhwHPds55xgzZgzuvvtucdPj8Tgcx0EsFhOOpWBWws4778w3bdok2tFxxx2HaDSKRCIhMr1I3k0iGcw0NTWhra0NqVQKgN9nSqUSnnzySeEopSwdwO+zRx99NP73f/+XAR1ZNJFIBLlcThj/P/zwQ7zwwgsAOup+HH300VAUBaZpgopkSyQSiaT3GXrh0ZIhT3e03oP1AqrVDQgWIA5+TjoARgbVJIOC979auwluI+kb+uv60gIhEonAsiwwxqBpGl5//XVks9mqjkXCsixss802uPnm3zPH6ahfoqqqGFuCVBujOst6qDUOyXYnIUhCgtrOCy+8gGKxuIWD0nEcbLfddrj99tsZGctM0xT1ATwPcF3fMDlqVBM2bmwRclbHHvtl3tLSAsBvo6eeehrGjh0ri+hJhj3JZFJou6uqKnSoAeDTTz/FPffcUyHfQ0YsVVWhqiqOOeYYbLPNNuCcI5PJAIDQeA9mCUjqE5RVKhQKYIzh8ssv56tXrwbQuUF/zz33FMZ1Km7eG89Rqh9UKBQwf/58MQeg57+qqlAUBV/84hcxYcIEAKhoK+SkLRQK0DQNpmnilFNO4R999JGIjD7qqKPwu9/9jgUdF7LIr2QoQG09Go2KOYeu6zj11FP5J598Ivps0IE3depU3H333Swej8N1XWHct20bqVQKjuOAc44zzjiDt7S0iAzH/fffH7fddhsjB610jkkkEknfIR0AkgEhbLitV3Q0rMlZzagb3Hfwt2T4Em43nRlhwz+S3mEgCwaT5E80GoVlWdA0DYsWLRJFBYNjQSQSEQtvikLaZ599oOsqcrkcGhrSALA5ss8QBtYg1f7vzvnLdicJQhH8hmHgvPPO4x9++KGQKSFjJD3nDjzwQMTjceHsojanqn4B36AueTqdRrFYxkknncjff/99Yej64he/iJtv9o1Rsi1KRgLUPzjnaGxsRD6fBwB85Stf4atXr4au6yL6n/qEZVk48cQTceutt7INGzaI94JR3jKDpj4kp2RZ1hZFlUulEt58800AqMjMo/9p26lTp+Kqq65iQYeLoii94sAkSbQzzjiDf/bZZ8IhS/fYdV3ssssuuOuuu1hbW5v4bsoS0TQNjuMgkUjANE1ccMEF/O9//7sITNhjjz0wb948IWkSLMAu1yeSwQ7NNaLRKDzPg2EYuOSSSzhF7gez9CkA50tf+hLS6bSok0FQoWuSXXvvvfdE7YspU6bgwQcfZFTHC4CM/pdIJJI+RDoAJH1KsOZBd43+AGpG+NMCgRYVZCQhBtIoKel/uqM/35kmv6R7dMVp15fYtg3AN9rH43F4noeLL76Y02KjVvR/qVTCpEmT8Jvf/JYVCqWKyE8/IrRSP7qWtn9Xx7Gw00k6oSRAhyyG53l49tln4TgOgEqDmOd52HXXXfH73/+eFYtF6LoO27YRj8ehKApKpZKIVHVdF+vWbYCuq/j617/GX3zxJWHM2nPPPfH3vz/ETNOGokRgGD0voimRDGbIaByPx1EulwH4zt+jjjqKv/3228KYSw4x13Wh6zoOP/xw3HfffQwAUqmUiH6lmh3ZbHbgTmqIEZT99DwPpmkikUjgiiuu4MuWLRO64TT20fY0/s2cOROZTKbiedybxsENGzbgpZdegq7rIkCAxmVN03DooYfCcRw0NDQAgKgT4bou8vk8DMNAoVDA+vXr8eijjwpH0Y477oh//OMfLDg+d7W2mUQyWKBxkRx5Tz/9tMjgCcppAr7D69Zbb2WFQgGxWKwiWyeZTCKXy2HlypV4+umnRX9TVRWzZ89Gc3OzqBNA83eJRCKR9A3SASAZEMhoVi16P/hDDoCgEyBobKslDSQZedSSlqpmoO0sM0C2o55RTWqpr66vbdvIZDIwTROpVAqLFi3CO++8I4wF9B1BXV9a0BxyyCFIpVLQdR3pdArZbF4s0qsV6OtqNkCtaxF8TSIB/Ki4ZDKJ888/ny9fvhxARwFfoCNz5eCDDxZRo5FIpKLIr/8aoOsaIpEIxo4dja997ev8ueeeg+e5cF0XO+20Ex599DFmmiYMQ0N7examaQ/kqUskfQ71Gdu2RbHW8847jz/11FPiOUBR6uQo+9znPocnn3ySmaaJQqEgsmpc14VhGGK/kvrQNaNrS3r5APDee+8B6ND/BiCuLxnI0+k05s6dyxRFEZ8rFosAOhz0PcEwDJx++um8tbW14tlN64399tsP1157LaNndi6XA9AR+UxGzUQigf32249v2rQJnHNMmDABDz/8MGtubhZBCpxzIaVCDgaJZDDjeR40TYOiKIhGo/jKV77CFy9eDKAjM9F1XVEP44tf/CIAiDGTnGXkfI1Go/ja177GN27cCM/z4DgOjjzySPzud78TWTKAL80lA/gkEomk75AOAEm/U81IVm2bzpwBXckM6I0iYZLBTdiYXKvNhI2z0sDfOwx0pg31cZJNufjii3lra6swFtTK9hg/fjxuvPFG5kd/+vughUywvkgYKQEk6U1U1Zefeumll8RrJFVF7XDmzJm44YYbGOlMB4ta08K7XLbgeX4U7YcffoSHH34Y1A/GjRuHAw44AKNHN8MwDJRKJhoa0lLDXDIiYIyJopKfffYZ/vSnPwlDk2EYIvLcsixMnToVt99+OyuVSjAMA4lEAo7jIJfLicLBnuchGo2iUCgM2DkNVWh+PmfOHP7RRx8JZyYR/BsAdt11V2y//fbidcZYRaR+T/nggw/w+uuvA/CDCcixwxjDhAkTcPfddzMygpZKJZF9FZwbpFIp7LfffnzVqlVi3vHUU0+xGTNmoL29Hel0Gvl8vmK8pe0kksFMsJ1/+OGHeO6554TjTVGUCkfo3nvvjblz57JisSiyYlzXhaIoKBaLKJVKuOiii/hrr70GTdPgui722WcfPProoyw4hy6Xy1tk9EskEomkd5EOAEm/Eo7Srmagq2ZUCxt0XdfdYhFQrfCrZOTRmdyUjCoZXqiqinXr1sEwDKxatQpvv/22MPgEoSKQ1AY+97nPIR6PQ1VVFIsl5PMFJJNJsUhPJGIoFAqyvUj6FMMwcMUVV/DFixeLgpKu64p2p2kaDjnkEGH4AjqMYLZtb45EZSiXy7AsCxs3bsRhh83ifrFTPwX/2GOPw4033sTy+SJU1dfOLpc76gVIJMMVz/OQz+eRTCZh2zZmz57NbdsWNTRIkx3w++KRRx6JXXbZBYlEArZti9oBqVQKACp0rcMZYpItocw7cpbQmLNs2TK0tLSIOT058mlOT0E8O++8MwAIBw7Qu8bzc889l+fzeRGpTJkgnHPsu+++mDBhAgzDABk1DcMQ25TLZXDOceihh/J//vOfYt5x1llnYaeddgIAZDIZuK6LZDIpnE7FYlFISkkkgxmK3rcsCxdffDHP5XIiC5EkgQDfCXbXXXcxivQH/CwpctxlMhm0tLTg0UcfFdmLEydOxKOPPspoPKW5j2EYct4tkUgkfYxa18daRUN5KHlm6UFSS4ahq3rh4f11tp9wVDJp4FeLVu4pPd1HrWPZ2utTb7vOCvYGZXxoYVDPiB+cPFT7PtIKrSYf1F2DcLVte9oX6n2+Wvul69Mb31+Pwd7X692TzrJLgI4I8q1tHyPh+ldre521v1q6+/X23dU6DpXb+QsNVVXxne98h7e0tACAkEcJRjCRcSGVSuG2225jfvShJ7KFSH8UQKcG0nrnV+vYg/2W/mesc1mhejA2/LKcenPxt7X9p+vH0PnziSQvFIXB8zqeV7T/QqGAV155RbQ9MnJRe9xxxx0xd+5cZts2SqUSMpmMMPz7z0cVpmkjkUigUCjgkEMO5uvWrUM8HkexWMSpp56Ka665hkUiHd+dSMRQKpnimduT6zMIhqdOGejxe6TT14acSCSCQqGARCIBoMPRG4Se8d/5znf4okWLRLun5wEVCd5///3x+9//nlGQSXA/dB70TKD5vDRU1cfzPCQSCXDORYbdW2+9JZ7RwXsRjUaFYb2pqQk33HADK5fLiMViFRm99Nl6WJYlsjzoPlNw0KWXXsoXLFhQMaehjISxY8fiT3/6EwtKCUYiEZRKJdHWFEXBV7/6VU4ZBIqiYP/998ett97KgjJu4WONxWLgnEsZKcmggDFWMW6Wy2XhrKKaJ3PmzOFvvPFGRV8luUwKqJk8eTJ8iUH/s1T4m/Z5xhln8DVr1oh+MXv2bIwaNUocRzhjXz6bJZK+pZadb6hktNc7/p4eX0/XD4N9fihDpCXDgqBRslq0dzX98XDdgO4YKyXDg86M/LJGwNBA0zR8+OGH+OCDDwD4CwmSfQovwhVFwR577IHm5uYt5Ab6m2rSZuH/JUObaNSP1Ldtv4heJBKBbdubDf4KfvCDH/ClS5cC8CUoaBEeiUSQSCRwwAEHoFQqgXOORCKBfD6PYrEITdMqiuhZloVZs2bx5cuXQ9d1lMtlzJo1Czfd9DuWTidh2yQpBDiOr72r671XSFMiGQg458LgBPgOAIraJ0OV67pYuXIl5s2bB8/zYBiGMPBHo1FYloXtt98eDz74IKPMUiryKukZ5AAtFotizv3DH/5QaICHF+oUQcw5x2677SaK5wbn6kRXFtfUNlRVRT6fFxHN5XIZL7zwQsU9JrkSzjkOOeQQaJoG0vSn+hGxWAyWZcE0TVx66aX8iSeeEJIlO+ywA1544QUGdNSekEiGAhR9D/hOOOprpVIJkUgEzz//PPL5vJhT0xybMYbGxkbMnDlT7MvzPOEoi0Qi8DwPl19+OX/55ZcRjUYRi8Vw4IEH4sYbb5QLKIlEIhkguuwA6O7ESyLpD2oZ/mvJvlRzAlRzBAQzFsIR0NLwO3yo1k6kgX/g6er1tywL8XgcV1xxBV+1atUW79MihYzpyWQS++67r4gG7E/64rlZT+6q3o+k7wnqV1PAfTSqw7IcvPLKKyiVSgB8RxZFyHLO8YUvfAE33XQTsyxL6P1HIhFh+G9tbYVhGFAUhkMPPYS/+25H8evJkyfj8cefYM3NjXBdjnK5LCJOqS9I/5JkqEPGeqAjWlVRFNGHyBB1yimn8Pb29ooIc879fjFmzBjMnz+fpdNpULHZbDa7RSaBZOsJOuA//PBDUUwXwBbOesA33M+cOROqqgonQDDarzvPLxp/aft4PI7LL7+cv/fee1tkGdu2jalTp+KOO+5gqqqiubkZpVKpQnKUMYbVq1fjr3/9qxi7p06dirfffpvlcjmRxSVrrEgGOzQXoMLU1Efo70QigfPOO4//61//AtCR+eS6rpiHHHDAAZg7dy4LFkkP1sxYvnw57rnnHvF9U6dOxfz585kcXyUSiWTgqDsC1zLC9JcEiUTSGbVSsel/mtyH22s9OSvaLxF2gMl2PzyoJ+cy1FO8BpqupND15Bp6nofVq1fj7bffFq9RAVX6/uAYMWPGDPziF7/otc7blWPvbOyoFtUox5beY6AlYCzLj4D1C00rsCxHfOdFF13IFy5cWJGlQsc8YcIE/PGPfxRSEpxzWJaFTCaDtrY2KIqCeDwOx3Fw+OGHiQV6NBpFY2Mjnn/+BRaN6shm88Jp4Ov2+t9PkaxyES4ZygRlK8hYHAwIicViOP300/nbb7+NSCQiNP9Jd55zjtNOOw2TJ0+G4zgol8tQFAXpdHogT2vYQPcnGo3Ctm20tbWBxiq6D0Hote222w5XXXUVqyYZ2h3jf7CeSiqVQqFQQDQaxcsvv7zFGoGys2bNmiUMmeVyWcipxeNxtLe3i2yrjRs3gnOOsWPH4vXXX2eqqkLXdXieJ7aX80PJYIcyX2g8JEkgkld76qmnYJqmkBkkLMvCpEmTcMcdd7BgO+ecQ9M0MMaQz+dx9NFHc8oAisfjmD9/PqPPy2LYEolEMjBICSDJkKbeAqEzeY1qEhvhyP9q0eAyQnz4EJ64hl+T9C2dXeuu9K9UKoULLriAr1+/vkJTN6jpC/iGiEgkgv333x+2bYusn/4gbLCQ0fcjB8dxYBgaXNd/1ti2vTnCOI8XX3xRZKhw7hckjcfjAIB9990X22yzDYrFojBqUo2AYrGIZDIJRVFwwgnH85dfflk4vaLRKE4//XRss80U5PMdhSt1XYPruigWi+CcQ1UjW2juSiRDGTLgkoyMoii4/PLL+fz588WYTwYu6ksnnHACbrjhBkb9jAzVAJDNZgfydIYFlGUB+FHBV1xxBV+7di2ALZ/vNBYCwMyZM4UxPTyHp8925flN95qIRqM455xzKhyv9L22bWPatGn44x//yOjek+Y5FXxmjAmpNcDPKHzxxRdZPB6vyCSIx+MIFkSVSAYjZPQH/DkyrYmj0Sg45zjjjDP4ypUrAUDIAVEmj2EYOOKII9Dc3Ly5zpGCfD4v5hWe5+Gwww7jy5YtA2MMiqLguOOOw/jx4wHIDBmJRCIZSLqcAdBXRRYkkr6iMyNb+L1a0f7B7aUM1vCjmgMpGJUu73P/051nSi6XwxtvvAEAwnAThO6fbdvYfffd8fOf/5xFo1EUCoV+f3ZVH0O2dAYE/69XpLWn7VM+v/sWun/lchnRaBTRaBSKwnDFFZfzRYsWQdd1sRAmzd2pU6fiN7/5DaOaAZSeb9s2LMvC+PHjUSqVcPrpp/MXXngBnHPYto14PI4zzzwT11xzDctm89B1HYahoVy2hBZ3PB7fnMIvxzXJ0IccapqmCQcARZ1v2LABDzzwAFpbWwFAyD16ngfXdfGFL3wBDz74IMtms0in06DfhmGgVCohnU7L538P8Z2NHRJNCxcurKjNAKDCEO+6LhobG/GrX/2KVZuH1cvcDUPbua4rMp5eeeWVLd5TFAWqquKAAw4AAJEBQpHMbW1tSCaTOPzww0W2VTqdxplnnontt99eFA/O5XJIpVJbXVxdIulvKOI/6AAAgB/+8If8pZde2lyvSBNjLed+Me8jjjgCt912m5inkLONHADHHXccX7BgAQC//+6///648847GeDPh5LJpBxfJRKJZICQNQAkQ5p6RVqrFQ8LQtG4FF1USxJG1gIYOUiN9P6jp9f5vPPO4+vWrauI7qQFCBkQSALlgAMOEJq/HZFKXr/+cO6GXuspPT0mSV/i15rwArIjDOvWbcDrr78uFtJkLDIMA5xz7L333mhqaqp4z/P8wr2KosCyLJx11ln82WefhW3b0HUdyWQKp59+On7zmxtYNptDOp2E53mwLL8oqv/dEei6CsYYLMuqeObJGhGSoUi4UK+qqtA0DRs3bsRZZ53FP/vsM1EbgNp8PB7HxIkT8eyzz7JyuYx0Oo2NGzcinU4L7etgNplk6wnOk+fMmcM//fTTLbYJRv4DwB577IGxY8cC6HDahOtyBX93Bhk06b6effbZfOnSpRXzBQBCHvCGG25gwXG3WCwCABoaGnDggQfyBQsWQFEURKNRzJ49G7/5zW9YJBIRNSMaGxuhKIpw+Eokgx0KMAA6bDsbN27EK6+8gra2NrEN0NGPxowZg/vuu4/RZ6j4umEYaGtrwze+8Q0+f/58AL4TbcaMGXjooYcYjdfUryQSiUQyMMgwBcmQpp4cT7VCv0HCRpDg52rtTzJ8qNZ+6hnFpIGs6/T19Xv99dcBoELTmRYZQRmwbbfdFtdeey1LJpPYuHGjkFDpKT1tI8Hxicao4P+SnjHQ/VdVfUNTPO6n1JdKJv7zP/+TL1y4EJqmieePrusol8sYO3YsbrjhBkavU8QdAGQyGaRSKVx66aX82WefRT6fh2EYcBwHxx9/HG699RZWKplIJpMwTRuGYcDzPCSTccTjMViWjXLZgm3bYIxB16X+rmRoQ0bWoEPL8zz86Ec/4k899ZQYQ0lvmhxoL7zwAtM0DdFoFNlsFqNGjaqIMlcURRR4lfSMcrkMz/Pw6aefIpvNVhTeDcvwMMaw6667iqK7tQJ5ujsPJ8fPc889B9d1haRQsO7KbrvthoaGhs1O244iqKVSCSeeeCJ/4403wBiDYRj48pe/jD//+c+MDKeULdLa2grG2BbR1BLJYISyD4OZNrZt46qrruKvv/56RY0VXdfF/PqII46AoihwXRe5XA7RaFRkEqxcuRIPPfQQHMevN5RMJvHYY4+xpqYmeJ6HcrmMpqamLZy3EolEIuk/1HpFfoNsjfGzK0bVntCZlEv4/60p8llv+66eXzUppa5qWPYl9Y6nPwzetYz4XfnuekacepPwsJGtXhZAtd/h49haw1K1/QaLmNF7/SlP0xUDZl9+Z3+2/776zsHsKOjr+1vv89SeyQAQNIRz7hc+TaUSyOeLcBwHuq7DdV2kUglccMGFfMWKFWLbWgsKRVFw8MEHiwWMYRiIx+PIZrOiUF8tw3A15xDJsgSPM7gtSRkEpQ4oQoqisWlf9Js+E/7+oAGYDAskeUGF21RVhaIo4lhoe9IvBjpqoYSP1Y+ATaK1tR2pVAqqGsHGjS1obGwUx9UTBtph2tftN9x/wv/bti8vUSj4xkRVVfHEE4+L92kRbVkWFEXBDjvsgPHjxyOXy0HXdaiqKt5jjOGTTz7BY489htbWVkSjUTiOg9NOOw133vknZll+hoDneUIKRVEU2Hal1AbhOH2/AO/u9esufT229nR8HIjn50DTnTVFTyH5FhqnVFXF4sWL8eCDD4oIb859GRqSiDvjjDOw3XbbibE4mUyKzwcN0pSR0xnD8f71BsHroqoqstksXn311S2eUcHrG4lEMHbsWFx99dUs+DyrRvA5Ft5Ptfc1TcNZZ53FV69eXSG7RmQyGdx6662MnonRaBSlUgmxWAwXXnghf/jhhwH4WVpf/OIXRfQzzSmIhoYGcM5lfRXJkIDaL42P0WgUpmniqaeeAuCPg6rqZw3S+Dlx4kTcfPPNLJFIwPM8pFIpIX21fPlyzJ49mxeLRei6DsdxcPLJJ2P77beH53ki6AGorD8gkUj6n1r9r7/mNT3t/329vhjuqPICSSS1CacJA5WLjqDRPvw+UN0BUctpFVywSiQjBTL8UypxsOhfMpmE6/pG+2QyDs6BUqmMtrYs/vGPf3Rp/zNmzMCPf/xjRsZU13VRLpcRi8VQKpVExKeqqqJYMBFMjXZdF7ZtwzRNsZ9f//rX3LIslMtlmKaJcrmMcrmMYrEI0zTR3t5e4RBwHKfC0B9OvQ5fl6BjRFEUYfyn44zFYtA0DbFYDPF4HIlEAvF4XLx+0UUXsXg8jnQ6jWg0Kq4zjTWJhI62tuxmh0IEuVxB6NRblozQ6g7V7iHnHLlcDplMCq7L8e1vnyOKYPpRpp5YdCuKgj322AOlUkm0z7a2NjQ2NsLzPGzatAknnXQSX7dunVg8n3DCCbjmmrksEvGj9MhBRAY0iWS4Y9s2EokEHMcR0dqFQqGi0DuNswceeCD+8Ic/MMoIkHOtviFo4Nd1Hd/+9rd5NpsVz52wIwDwnTkzZ84U2uAkb9YTbNvPhDJNEy+99BIAP+qZnqe2bWP06NGYPn26KDqsKApM00QsFsNZZ53FH3zwQTEnOPzww/Hwww8zwC+KKmV+JEMZy7Kg67oILjFNE9/73veEVFdYGlfTNBx++OFIJBIVMlepVAqFQgHf/OY3+dq1a0XwzlFHHYWrr76aBde1VJSbxmCJRCKR9D+iCPBwWCwOh3OQDC5qGXWqRetXk+zoSmZA0HFQLfq9MzkiuYCVDGUoTRjoiHD3I5f919rbcyKazvM0FAoFNDU14LLLLuUrV64E0LmXX1EU7LjjjhgzZoyIYEomkwD8yERdV4Vx37IstLRsxK9+dR3P5XIol0soFHxDfqFQQDabRTabRaFQQLFYFFIqlmXBNK0a398hMeD/VL4flCCol41S7f1IpHrWViTCwFgEd931J07FX1OpFJqbmzFu3DhMnDgBP/7xT1k8nkRDg1/w0Lb9zArOgdbWdjQ0ZGDbTs1rK+mgs0wATdNgWQ50XcWLL764Rdq9bdvgnGPXXXfFr3/9a2bbNhoaGlAul4Xhslwu44QTTuAffvihcAp96Utfwt13/5n5bdiP5qMFNbXLgY5Elc8nSV/CmF94sr29HZlMBl//+tf5v/71r4qsAKq/MWrUKLz44ovMNE1huJLts28hh/7ChQtRLpcBQDihCZrHJhIJ3HLLLQxAr41d9D3f/e53+aeffloR/W/bNiKRCNra2nDfffcxcqqTs/7888/njz76qJCCOvDAA/HYY48xAMJBINuPZChDfSyYIfXKK6/AsiwxtlLtIdd1MXHiRNx4442MXqOsVlVVcfbZZ/MXXnhB9O99990Xf/rTn1hzc7OQ1AqukaXEpUQikQwcangQ7kziZjCzNfIxEkk9ahnlqhnqg44Bej3Yv8Jpz/X6VmdSJJLhwUi/p8EoTc/zYJqmWHAzxhCNRmEYGlyXo1QqwTAMAMDzzz+/uZBY531ov/32w0033cRisRja29uxadMm/OY3v+EbN25EsVhEW1srisUC2tvb0d7evjly3xI6wa5bXQKHDO+eR847iKhCOpdg9k+4//r/A67Lt3g/+Du8D6C6U3HLduT/XygUwLmHjRs3imNVlAii0Sj++Mc7eDrdgHQ6jUwmgzFjxuJ//ud/2E477YDGxgxyuYK43iOV7ozRtV4j2arzz/eNUNTmXdcVetMAsP/++8N1XWiaBtu2YVkWRo8ejWKxiOOPP56/9dZbAHyHwn777YcHH3yQRSIRFIvlzYUpdXAO2LYjncOSEQG18Vgshssvv5w/++yzwlhFUBH4b3zjGyiVSkL+LZ1OD9RhD1uqjX2XXnopX7FihZgL070hQyEZ3XfaaSdMmDBBGOZVVe3xGKZpGsrlMl544YWK5yk5hTzPw6xZszBu3DgoioJcLgfDMDBnzhx+//33o62tDYqi4MADD8SDDz4oI/8lwwqar1Im7BVXXME//PBDMYZSBgD10S984QtIpVJirVsqlZBIJHDWWWfxhx9+WPTxXXfdFc888wxLJBIAIJwElNljGEav9G+JRCIZKIb6+KWGX+hP/e3eQBr+JX1NLb3RcBoz/R/cLhjtFH4fqF+joLP2PdQHH4mEtMo1TasoMhZcfBQKJXDuOwCam5tx6aWX8aVLl25exHcuU2PbNr71rW/xFStWYNOmTWhrawOACrkhoMOA31FPwH9d09TN73f06aBjgBwB9JktHQbVHIgdfxtGVNQ9IE1/qi8QLAQcdCYGxwDLMsV1CssMkRY8HR99zHU9FApFFApFtLVlxTWIxWJ44onH+f77749nnnmaRaNROcZ0g2rXiha+iqJg/vz5wgilaZqQgmKMYZtttsHVV1/NHMdBuVwG5xyZTAYAcMIJJ/BXX31VRNHtu++++Nvf/sai0SgsyxH7cF0uomxjsRgAVBhCJZLhSLFYRCwWw1NPPYX169cjHo+jWCxC0zREIhGYponTTjsN11xzDYtEIiiVSkin02hv9+ueSHqHWtmu//rXvzotjkvFePfee28AfvQ/GQ57iqIoOPfcc/mKFSsQjUYrshBUVUUymcTMmTPhO1KLiMfjuPzyy/lf//pXZLNZIcv2zDPPME3ThFQbGT+lI0AylKEaKq7rIhKJ4LnnnhP9kYIUAH8evc022+Cmm25igD+vMU0TyWQSl112GX/kkUdENu92222HN954g0WjUdi2DSq2Tt8nkUgkkoFHDUeKhf8eSgb1oXSskqFDtXZVq/hY+LV6DqpwOnS1fUoJIMlwJZlMwnEcoalPhm76TYbsVCqBZDKOtrYsXn31NWEM7QzGGBYsWCC0TYORodR3FCWy2ajPK4z3voQOqymBE4n4x+c4LiIRJgq20mInkUggGo0iFotBVVVEo9HNGv1xxONxGEYUqqoKB8DZZ5/Ngvr+5ASIx+PiO8nZGNRljURQ8RrVG7BtW0SY33jjTTyXyyGfz6NYLKJcLsOyLNi2jfb2HGzbRj6fRzabRVtbG1auXIm1a9dj9OjRcsHWRWqN4a7rIh6P4pJLvseXLl0q3qcoV1qA77///kgkEqKOxJgxY5DL5XDGGWfwZ599VhjN9tprLzz00EOssbERhUIB0ajfPhhjIpNA13VEIhDFfweSrvRRiWRrYYwhHo/j2GOP5R9++CEYYygWi6I/cM6x//774/bbb2dU5JJ05YNjq6R3CK8fN27ciI8++miL94L/c84xZcoU3HjjjaxcLov7Ui6Xe5yBVi6X8c9//hOKogjjP9Ahu7bnnnviF7/4BfPH6TjOP/98/tBDD2HDhg2IRCLYfffd8dprrzGSVjMMA9lsFrquSwkgyZBHURQUCgUkk0mcd955/KOPPqqoPUUZApxzzJo1C6NHjxbBOOl0Gp9++in+8Ic/wLIseJ6HyZMn47333mPBukYEORaoT5OMkEQikUj6HzU4wAcnZENtYlPL0DrUzkMyuAjLdnT2PrBle6sm4VHtd1fqA0hjyfBjpFexLxaLwtHsG2c6ktJc149qX7ZsGa64Yi5ft249Vq78DG+//baIJnQcu+p+g7JCFAWvqmrF+xQ1z1iHVr9vSCdpHz9qXlUV6LoBwzCEln46nUIsFkdTUxMSiQQymQwuvvgilkwmRRHWSCQi6g0Ev5Pwz1sRfTtYHJHep2Mnhwg5R+j8LKsstqcsgmChX8dx8Itf/JzRYi54XXznSgSGoaFUMis+q2kK8vlij4swDnV6KgGk6zrKZQuvvPKKWFiTDjVjEQAutt12W1x//fWMMjgSiQQ2btyIs88+mz/11FOIRCLQNA077LADnnjiCUaZAaTBG8ws8ws9MziOJ5wLEslwxbIsXH755fypp54C4BtoyXBcLpcxadIkPPXUUyysP001A+plYEq6Ri3j/oUXXsjXrFkjJHco0jhcI+ULX/hChfPf87yK5/XWcuGFF/LFixcL5z8Z8m3bxpgxY3DzzTczKgZ97rnn8rvvvhuO4yASiWDbbbfF888/z3RdF+2lWCwinU6LTLuR/nyUDH08z0O5XMYrr7yyRbY6BYDsvvvu+MMf/sDo/0QigXXr1uHII4/kpmnCtm00NjZiwYIFmzMTLRiGIbIcqb9QJoA0/kskEsnAotLkB6is+B6MYBvsSBkgSV/SlfYVnjgRFNVM74WN/tUcCNJ5JRkpxONxIU1TLptYsuQz/PznV/HPPvsMGzduxJo1a1EsFpHLZYURgRbzXXk2BQ3fpmmK18JZOpGIAl3XEI8n0NTUiFGjRiOVSmL06DGIxaJIpdK4+OILWTyeRDSqIxZLQFUj4JyBMQ4gAs5d+PYkD5GICsb45ihsb/P7ntiOc5IPs7cYE4LPYdJJDf8Er5/jWGKBRUYU2k7TNLF/27aF7rE/FimIRjW0tvpSGKrq68n7CzYFyWQcliWLAHeH8JhtGBo+/ngxPvjgA3Hd6T65rm9oOuCAA9Dc3IxNmzbBMAykUikcd9xx/Pnnnxf3csqUKfjHP/7BmpubUSr5kli+RBPbbPDvkMwiWSDD0OE4g3/+JpFsLYVCAQ8//LAoyF4ul0W0t67rOPnkk0FSZmT8VRQFqVRKGHolvUvQgf3uu++CouuLxaIYA4NO63g8jv/7v/9juVxOOMzz+TzS6XSP58DvvfeecKJTbRUKHth7770xffp0FAoFnH/++fzvf/+7yJ4bM2YMFixYwNLpNMrlMjKZDHK5nJCMcl0XhmHIObpkSGPbNlKpFL71rW/xjz/+WLxO2YkUVHLwwQeLgtkNDQ0olUqYPXs2/+STT2AYfnDM17/+dYwaNQrlclkY+oNFhoN9xTRNJBIJ2X8kEsmQZahnOKuUNh40QoQrtVczPoQjGcORyvQT/HyQDgmDyBb76w71LnB/TfDDkeLh4pbVIo26IrHU0wfkYFzgDCUd+86M/cH362UKhD8fXACFv68rkj+dXbdqNQa2diAaLANYsC91R5psMAzQ1doIUS1DJEhnRaQ376Fi+87ko6qNwaRFTpE6wShzfxs/Ij5c74K20TRVyPcENfRpG3KA0Q/J29i2jXK5jKVLl+AXv/gFX7JkCVasWIHW1lZh4AQ6Fu3kqKbI/A5tff84ySnQIe2jCgkIz3OgKCoMQ0MsFkNDQwOam5s3F74dg2jUQCqVxve+dwlrbGxGPB6Fphmb5XVYwGDf8dtxvM0GJBVk4O/4TZFT9D8L/UTAWATB293x/PTPpdr4sOX9c0XxNkVRKwoQd+w7As/jgX4TqcgEcF2+OUq9DJIgsixrc30EvQv9p16EvH8+lmUhFovBtm2RPk4GlVyugHg8DkVhsG1XGGzi8Wify9iYpq/jTNH0QaOg67rQdV3IRei6LrajdHbA7zOWZcGyLGHAyuVyQof/O985h/uZKjSHgij+O3nyVNxyyx+Y4/htJZFI4cgjj+LPPvsc0uk0CoUCpkyZiqeeeoY1NzejvT2HTCYFz4Mwcrour5hr0fE7jhvox9XHhWIxL75H13VRNJMW7J7HRRFj6ofU1+hcekIw0pDqX5AziyIIg9JgtC1lRfR1gEpP52eko0yOy2BUc7V5BJ07nV/4+RAeFwZjBHtvzukikYiIvs7n80gmkzBNE4z5smuzZ8/mq1evrrg2dE0OPvhgXHfddeIGhq/VYJwbDzUcxxFO5kKhgEQiIbT0L7vsMr5kyRIoioJSqQSg43keXBfutNNOSCaT4rlERUK7gmVZYnwCOsZVRVFw+eWX83fffVdkXAEd84QxY8bghhtuYI7j4OKLL+YPPfSQkCJsamrCO++8w3yJP0f0w2C9CJIVpDoTvuPV6rSPD0aCBZcJupb0rANQUbshEomIez3Yz68edH+BLYO4TNOsyPCotsYLr0XK5bIoOm5Zltj3QEHHRkXPg3WHFEUR9/TVV1+teM7S/MbzPOy9996YO3cus20bDQ0NaG1txXnnncffeustULT/CSecgGuvvZZRFiL1jeC1CToB4vH4kG87EomkZ/TU/lJrDOktu85gsB91h87sP9VQwxEZ4ejIoIG+mgMg+LuWUyC8iBlKBmCJpC+pZgSo1Ym72leqbVfteySDn2pjc+X4WXv7INWM/wCEMSVYcJbeJ6MVjeVkoOPcl6axbVsUWzQMQxhCaZ+GYUBVVeEIaGtrw9VXX81Xr16NFStWYP369VizZo3QD6XjD/4m3WbS7w0u5v1j0uC6jli0BhcYyWQS48aNQ2NjI8aPH4/Ro8dgzpw5LJFIiIV72OER1NAHaNEC+MZbcoJQf6T7ENnK312n+v3zF5p0z6n4r++Y8YsqFwqFzVkWTBgpglJDxWIRqVQCjuOJfQBAMhlHqWT22EhGx63rOlpaWmAYBpLJJIrFojCWkyEhny+K7wYA07T73EiXSCTguq5wOpEThAguhGnxDFSOoblcDg0NDYjFYsjn84hGoyIq7uOPP8Z7770n2nfQUQUAhx12mLjumUwGZ599Fn/mmWfQ0NCAtrY2TJo0Cc8++xzbZpspWLNmHdLpNGzbhaoqvWJcSKfTAPz7REYgMgiRcymXy0FRlAptbs/zeiUC1jRNGIYBXdcrHDAUxU3fEQxMofFoKGSnBsdV0zRRLBZFrRB6nzJzqP5H0PhJ43DQuUoOqbCxcTjiui5SqZQoOEntxfM8nHvuuXzBggUAOsYZcoKOGzcOjz32mJzo9DHUjh3HEQ5Pau/vvvvuFk6XYJ+lMWeHHXZANBqF67qwLKuif9SDDLSqqoq+VSgUkEql8Prrr4s5SdARBwCf//znMXHiRFx66aX8wQcfRD6fBwA0Njbi61//OhobGxGLxSpk1ILjk67rFf2U5jsAKp4VA20Aroeu60IChs6BzpdqCOXzecTj8QoHADl66J4PVSiwxDRNcM5hGIaYHwXlaijjA4CY+wYdJ/R+NBoVspOD4d5T+6XjpHsbzIS59NJLRfQ/OdDot2EY2G233RCNRpHP58E5x3/913/xRx55BLFYDKVSCccccwz+8Ic/sOD6hJxyUuZHIpFIBidq2HAfNg7SZK5aFGutqP6ghAH9Hdx/0JnQ1UhmiWQ4Enaahdt8Lamg4PvhfdUzykhnwNCiVrRR8P9qY2z49eDniLDxO2hso8i3YOQtGZ8ogiiZTKJUKqFUKomit7FYDIVCAblcDj/+8Y/5hg0bsGTJEixbtgy5XK7iWGjfwQjfoDMgEomIqCrP84TxH+hYrIT3d+SRR+G2225jo0ePFlrCZEfmHLBtR2RldUQ6Vxp4SQ8//Pyqdl/6knr3ryPLobJom2VZKBZ9gzpFX9K2ZHAF/AwAz/ON2JFIBJlMCpwD69dvxOjRo2BZ1WssdBVqX2TMVVVVRNY7joNy2RLR/x3ZKByRSP8UOC+VSlAURTiwOOcol8uincfj8QrDc0fkPyqMAvl8HoZhiP3Zto1YLIYf//jHPJvNwjAMWJYlzsm2bUyaNAnXXvsr5nke4vEovvWtc/iDDz4Izjna2towduw4nHDCCdhmmynI54sYNWoUNE3BmjXrkMlkEI9H4WcOdE54LAg+U7LZLDzPQywWA2NMZDJQNgAVsAYgikcnk0lEIhGUSqUeGznIYELHQ1G0lG1Rbf5I/TJ4LwYr1AepjQWNhmEjUtA4Q2OgX9C5wwFFGVQAKsbC4YqiKNi0aROam5sB+Br/juNg7dq1mDdvnjAok2PYdV1Eo1GcfPLJ0PX6GUySnkN9lNqpqqpYtWoV3n333S0cpmGHwMSJE/Hb3/6WARDjZnf7NBka6Zmm6zrWrVuH999/X8wPKAhB13VMnDgR11xzDVuzZg3uueceYfweO3YsTjnlFFx33XWMHAe0z2AABBl4g/VcaL5Ex0NO+MHe/ujakQOmWCxWBHrQfSNHZnAONlyiuIPa9ADQ2toKzjkaGxvFnInaD7XfcAFxcuRSYAk9Gwf6+pCNhRw95NwgRxbnHC+++KLYnvoLPVunTZuGW265hQF+W7nyyiv5HXfcAcCfOx1wwAG4//77WTKZFJ+hzImw7I9EIpFIBg9bhA+FB+xaUVbBiUH482HDSWeGfmmMlIxkahlug3TmBAhHbdeK9O7sOyVDE79dBP+un03S2YScjPzU1mgfZAwkeQrAN9xRlLCu69B1HRs2bMBPfvITvnjxYixduhQtLS3CAEZQNBJ9Fz1fwsb/4Dklk0lh3AlmlfnHwoSx3rZtKIqCnXbaEePHj0U2mxeSAyTbQlFPZNwsFAoVWQC0/+B3VbvuA0X4mCiFnYxddI4URR2LxcQ9o0Ur5xylUmnzNfXvQ2NjBm1tWbS2tqOxMbP5evT8eB3HQVtbG0aPHg3AN5STAZMiDhljME0buq6BMQ3lslXhzOhLyBFBbQeAMCZRmyKjazACkgyyjuOgoaEB+XwexaJvpKd9bdiwAa+//joACIdCMGJ7v/322+w0M3DhhRfxv/zlLygW/cLL8XgcJ5xwAn7729+wlpa2zf1NgWnaGD9+LAAglyvUjcCs5gik/s05FxkAtm2LKEhy/HHO0dLSIvqgX2A4IqJ0e+P+uK6LXC4HXdeRSCRgGEaFkzEon0hGuKCzcLDj1+hwxPW0bRuFQgGapolxjcYfep+KlZJBsVwuCyOO4zgwTVNkCgxGCaDepqmpSRjXSHrk9NNP56tXrwYAoS8P+H1z9uzZuOGGGxjJUEj6DpLboetsWRai0SiuuOIK3tbWVnNeQu12zz33RCqVEvJOZIim6ON6BCWAVFUVUiff+MY3eKFQAACRQUjyQnvvvTdGjx6NPffck+fzedi2jaamJpx00km4/vrrWSQSQS6XE1HvZNikuXbYQB4+zqFk+Aw6b4JZXkGSyaTIzojFYtB1Hfl8flgUQA7q1ZMTv7GxEQCEM4TuL62vyBlA40swy5XGqa5KWPU11E4pWCaYlaIoCubMmcM/+OADxONxkQVJc2TbtrHXXnuJrKuf/OQn/M9//jOKxSJs28YhhxyCxx9/nMXj8Yr6GMVicdCcv0QiGbkMlefwQME2bWrtdIPOjIW0ECNjUdDoRD/hRVzw/a5EcNUztvT0/Z5SrYHVkpUIH1Nnkd29RU8j5Pri+IL7DEYlhKOb+6Pz9vT8+kLDrFo/C2fgBCOV6f9qDrdaBiCip/2vrwlmIAUzinrruPrj/KplTxHdqQFQDc63dNBWu9e1HAHBKFQyrgXHdcCP9HEcB/F4XCz62tvbsWHDBvz85z/ny5cvx+LFi7FhwwYhnRM0lgbvHZ0nfT9py9I4oGka0uk0Ro8ejYaGBuy222646qqr2G677cbXrVsnPkuG/XANgFmzZuGZZ+YzqjFAEVm0aCcpAErrJgmdoKZ20Hld7fp3lgW3tdS6P/UcOZqmiKg80/Qle2iRThHV69evF4tbuh4NDQ1IJBIAgI0bW5DJZKBpCsjYHI9HkcsV6i7y69UAACAWyMcddxx/6623EIvFMGXKFNx///1s1KjRYMw3ZquqiljMgG274j71dYS3pikwTVMY+ul8yWlEjggy+hP0TC+VSsLoT9kVtBg+88wz+b333gugUgrJsixMnjwZr7zyCps8eTIuvPAifscdd4jvYyyC7373u/jlL3/JPM9DsVhEU1MD2tqyYIwhk0mhWCxvobFbz7kXpKNvF4QRg3OOtWvX4j//8z95oVBAU1MTfv3rXzNyMhQKBbiuK5wGJHfUE6j/B+8zaXE7joNkMrnFuB921vWEvnh+B6H6F2TUD453QcMMOWCy2Sx++9vfctM04bouLrroIjZhwgQ0NDQA6IjY5Zx3SYKj3vEN9PO9HqZpIhaLIZvNAvAlq84++2x+1113VTiDAX+s3nXXXfHWW28xGuv72kEy2K9fX2PbthgzKcurVCph991350uWLKnqAKD/M5kMPvjgAzZx4kThACAjfTC7qjOCzkzfkezLbO2222589erVMAwDpmkC8Pvi5MmT8fLLL7PDDjuML1myBK7rYtSoUTjxxBNx3XXXMZKni8fjwvAZXK/SsVHQA0V6B3XTgxligz1DiZ6zdE6Ab8Alp+Mvf/lL/rOf/YyRcTc49w5r5A9FyKAPdGRIUoBEPp/H9ddfzzdt2oT29nbouo4xY8bgZz/7GaOMJMCfH9M4HJS9IfnFgYT6U9BBRwZ+AJg1axZ/6aWXKubf5MTLZDJYuHAhMwwDP/vZz/hdd92F1lbfXrTvvvti/vz5LB6Pi30G63vQfHywt3+JRDJ8GWkOgFrrvFqo1TaoFyHcmQE3aOwKG3WD+69mYKllpJRIRgrh/lJt8VTP6FOrz3YnGlwyOKDxNUjw/2oG4uC9rpcBkslkhPGJFn1BB2YkEhFa7cuWLcNPfvIT/umnn2Lt2rUoFArYsGFDxfeS0YX+DmcTEKqqiui5pqYmTJ48GVOmTMGYMb5O/+jRo6HrOrLZLH7wgx/wlpYW8TnSYAUARVFFDYBIJIIbb7yJMcbQ0tKCCRPGwbZdEa0VLG5HUVpUryB4fEGHAUXPD5Shp979KxaLwpDY2NgIz/Pwox/9iL///vv4+OOPRcQxGUEYY2IhO27cONx++x1s++2nYd26DWhoaEBTUwOy2XyvHb+u62hra8OXv/xl/s9//lPcgyVLlmCHHXbgX//6N3Dddb9myWQCtu3Att3NetJGv2i8k2OEagHQYpbaSLjwLM1dSDKIJLAoE6NQKIiil6+//rrIHKD+RPIJ++67LyZPnozvfe9S/oc//EEUDNQ0Dd/5zncwd+5cRk4G3xhlby6UGUGhUNr8es8lgCiq//zzz+dPPvkkVq1aVeEMu/322/n++++PW2+9lU2fPh2Ab9gA/MjQsATX1lx/kgwjw1s8Hkc0GhV9LmhQ6EySazASjIwkaalYLCYKaV566aV8zZo1WLp0KVavXo1cLldRE+XOO+/k0WgU06ZNw5577olf/epXjLTJh4sER2eQzjQVsPzss8+E9E+48Pvo0aPxj3/8g7mui5aWFowZM2agD3/YQzInwTFlzpw5VY3/QSKRCGbMmIFJkybBsiykUimhPQ5AOBbrtW+SCCSN8mQyiQsuuICvXr1aZCsRnHMccsghmDVrFv/000+FXNRZZ52FuXPnMsA3kMbj8YpCxEFnHR2fL19Xrhin6POUPUaOuqFAMLDjsssu4wsXLsTy5cvR0NCAl156ic+cORP/93//xxhjaGtrQ0NDQ6/UgBloIpGIaHeqqmLjxo249NJL+cKFC7Fq1Spks1kx1tDz+5ZbbuF77LEHPv/5z+Omm25isVhM3HfahhxEg41g9uWcOXP4W2+9BU3TxPyQ5lyWZeGggw7C6NGj8f3vf5/feeedaG9vB+ccu+yyC55//nlGGcDk2A4a/ymYQSKRSCSDk5oSQOEIxGrbVPu/miOg2vthw1BwEjnUJxUSSXfozMBbry/Ui3CrJZXQH9knkp4TzKSqBr1cbZyttb8gLS0twtjZ0NBQoS9dLpfxox/9iC9duhQffvghVq1aJQzvhK7rIvoZ6NDOD+ql0gIqHo+jsbERkyZNwtSpU9Hc3Iyf/OQnLB6PI5PJiGMmLVqKoHriiSdE0bLg9/vR1LZYaO+1117YeecdYdvuZsORKZwZtFgNGhB97fW4+JuOOSg5Uuu6DRTh4/A8Dw0NDeCc49vf/jZ/7bXXsGjRImGwDtdToKj1bDaLFStW4PDDD+Mvv/wKmzx5IjZs2BSQe+JCn70nZLNZfOtb3+KvvvoqOOcislJRFLS2tqK9vX2ztIABXVfhunxzBJrRLwaUoK4zOcD8mgS+cTGfz6OtrQ25XA6u6+LOO+/k3/zmN1lDQwNGjRolHCrBeUs8HseFF17IP/vsswoHEhnWt9lmG9x6663ssssu43fffbcwNiWTSZxyyin49a+vY5bloFQqbS4sqMM0/T5m276jIZGI9YoEkK7rOPjgg/mbb74pCm0HI6pt28aLL76Iww47jM+aNQt/+tOfWCKRwNq1a0UGSU+gopOJREIYxh3HQaFQQCaTQaFQQDQaFQaY7ka4DDQk80NFUhljWLp0Kf4/e9cdXlWVfdd5vZf0QgsBpAhKE0UpFgQBQex1dCxY0FEU1BnLzxHHERQVK/YCFkQsVEU6qChSlN5bID15vb93fn/c7JPzHgmJg47gvP19fpLklXvPPXWttdceM2YM/+WXX1BeXp5EosiZV6Ty55zjl19+wU8//YQvv/ySDxgwAK+88grLyMj4o27rvxpEmqjValx00UW8srJSKJcBpZ3MZjMuuugiZGVlIRKJICcnJ8nWKx2/T9BzoKLgXq8X3333HYAjCUc5HA4HevfuLTJj6PWcc/HMGhI/pIa8N9JqtQgEAli7dm3S32nezcnJwZw5c4THu16vx6233oqHH36YAQr4bbfbBRgKQCj+ZVX3gQMH8Nxzz3EipsaOHctat24NrVYLg8Eg3nMiFOgm8NvlcuG2227ja9aswb59+wRpTQKPgwcPIh6P89dff505HA4B9p7oCm+qWbF161bcdttt/Oeff4bb7RZ/J0s6KtLOmFLPaM2aNdi5cydCoRB/9dVXGe21KAuF9lF/9L4xkUgkiRBkIcLPP/8Mn88HlUolLICo32ZnZ2Py5MmMimS7XC5YrVbYbDYsWrSI6XQ6Yccm7/PlTIP/BYI6HelIRzpO1BA7lKasIhr7XUOgfaqFBL1HtpeQgS36//+Cn2k60iHH0cB/isbU3UDjBICsnkz9rOMdNElHfTQEeDVGzv4nthhUEJbUPP/85z/5nj17sH37dhw+fBhut/sImyJ5/ibFNB2ACKAnK5qCggLk5eWhTZs2eOCBB1h+fn6dkrnebz0SicDn8yWB1Xq9HlarFddffz0vKSkR30+WGaTuY6y+dkC/fv0QCkXg9XqRlZUJvz8gDu+yVZZsJ0JAOREX8np2NACioQy2PyIcDgfuvvtu/sMPP2DTpk3w+/0ixZsOrQAESCPbkESjURw8eBDnnXceX7hwIWvduiX8/iBMJgPcbi+0Wu0xA2h///vf+eeffy6uifxhw+EwsrKy8H//9xgzGvVwuxUfeIUIqC+8+HsHFZ4kywmtVguv14t77rmH79y5EyUlJfB6vfD5fKIuxAsvvMBtNhucTid69OiBV155hVksFtH3Y7EYfvnlF6E+JQ9qOiB369YN8Xgcn376qUipNxgMuOqqq/Hii1NYeXkl7HY7rFZrXeHg+n6r1ys1EmpqXMjIcDQrA+BocfPNN/P169cjFApBp9OJcUdWRdXV1UgkEigpKcG8efNw3XXX8XfffZfl5uYK//pjCSLeQqEQNBoNqqurceutt/J9+/bB4XDgk08+YUTKyHvUE2UNC4VCwpJr27ZtuOOOO/iaNWvg8/nEXCMDM9QelIUC1BfxpuKmn3zyCUpKSviXX375pycBotEobDYbYrEY/vrXv/L169eLdiOCkOb+yZMnM7KkIfu3dPz+QaS5VqvF4cOHsWHDBsmir74AL1C/R7HZbHj55ZcZqfZDoVCSBSF9ZlPrTyQSESCtXq/HPffcwzdt2iS+n/YmVDiaQFmDwYDrr78ezzzzDNNoNAiFQiIbkuoUeTwekY3EOcf48eP5xo0bsXHjRlRWVoqxunDhQn7aaafhxRdfZBkZGUdkphzPodFoMH78eP7jjz9izZo1SXMNEZNWqxWHDx/GqlWrUFZWhry8PIRCIVit1uP+/poTw4cP5ytXroTH40nqb1TQloLIEupPNTU1+PLLL/HAAw+gQ4cOSTWmAAhbwT8yiOCQhTOMMbjdbmzdulWMExI/0JzZvXt3TJkyhX/88ceorq4W+8YrrrhCZEuazWZxBjAYDDAYDCKT0WQypS2A0pGOdPyhcazr04lyzvhPQ9OUoqo5FiMNWTw0pOSn39HmKPU9DamVU+0s5P8aupbUkEGlxq5fvr7UaE57/J7xe3fAP6KD/zfbsDkKomN5/7FGU58vb6BS60oc7dpllXND39eQdYz88699Ro2Nr9/qWTelhD+Wzz2WaG7/kolO+Tub2iBHo1FRcJd862V/42g0IgpCUlo6AXkEztN8S17TBoNBbN7D4TAeeughvm3bNlDac0PWK3J/Sf07PRuNRoOMjAy0bt0axcXFyM3Nxb///W8mA+tUKI1AfPJft9vtqK2tFan/BFAvX75cHGDk559aGLR3797417+eZIwxWK1WeDxeyKCsrGpuqM0bs5tpqn/8XnOZnA1BKdUEeBGgYjAYcN111/FFixahvLxctI9erxf9gNrN4XDgrLPOQl5eHux2O1atWoWff/4ZkUgUBw7sxzPPPM1ffPEFRsCZ0Wg8ItujoSC7G1I6h0IhmM1mhEIhBAIBzJo1S7QTtTHZLp199tlo0aIFOFesPggwNxr18Hh8sNksiMUSQpVWT+YoRYPpcHu0oOeu12vhcnlgtVqhVjNUV9ciM9OJeFxRddpsNiQSCVx00UV806ZNOHz4MILB4BEZjXQfVVVVqKqqwt69e7F69Wr+1VdfsY4dO6KmpgaRSAT79u0T7UMFKDnnsNvtaNGiBU4++WReWloKtVoZM0rB3ynM7w/CbrfDYNAhGAzXERQx0WcjkZiwHopEYtDpNIhG49Bq1QgGlbFkNpuhUjHE4wkxNskqw2pVVPtU7Hnfvn2IxWLo2bMnunXrhn/9618sLy9PvGfLli0YOnQo379/P2pqajBv3jw88MAD/JlnnmHyODraPonGLxX2pMwCIkTC4TDMZjPGjx/PP/roIxw6dEiAaN27d+c7duxgVGycxoCsMEwFF8l+gBSbVDCciKdoNCrmhmMluGRClOwxCEgkYtHn8+Gqq67iS5cuFQWA5etNXctl2ynGmOibVEBbpVLhu+++w2WXXcaXLl3KyJKD+qvBYBB2Sv8NG62jRVN7AZVKJTy0ab6hgvNyu7hcLsybN+8IMUQikUBRURGmT5/OzGZzEmD33ygU3dTnN7W+y1YZqXMNUL/Pk/cRqRnW8mvlIvCpoqqGzlyp9TfkDLjUPV3q2YvWXiJN9Xo9HnjgAS7fl7z/oL6u0WhwwQUXiDEsK4fls6FstyPXKqLrkTPcaD+xadOmpPuj69VqtWL/ZDAYcO2112Lq1KksEAgI+xfaL9F9UybYrl27MHr0aL5x40ahDqc202g02LVrF3bt2gWTycTfeOMNRoDob9H3Up8XESZUnyA1KIuBxhSptGn+lL3+o9EoduzYgWnTpqG8vFzcE+0N5T0aAOzfvx/PPPMMf+aZZ4QNWarQT/abp3/TXAQoa38ikYBsm0PFdOvXOOX3zckASZ1fZKEhBbUBoFgmkuBl7Nix/KuvvsK2bdvEvEn7JoV4r89GKSoqQrdu3fD444+zp59+mn/xxRcik/Khhx7iM2fOZFSvxGg0JtlZNRVkHxgIBIQNILUBoBDAlMVKUV1djUcffZRXV1ejoqJC1ChwOBzIzMzE3//+d9alSxdoNBrRV+Sx/uCDD/KysjKxRsmRm5uL3NxcvPPOO/B6vYjFYigoKED//v0xYcIERhZZ9D7ZCkrO5jkRwH95fkqt3XEiEHjpSMeJHL8l/tIc/PbPHr8Wr/7d6enUSbSpDIOGNraNqaRTAcHmdoDGgMT/tc6SjnSkEgEyUJ2OPz7IGzcYDCYpuClIuR+Px2GxWMRBlhTHdLglRT4Ba3fddRffvHkztmzZApfLlQS+APXAgHxoSAUT1Go1HA4HcnJy0LZtW7Rp0wYPP/wwczqdAqiTvedTwS55vqaiozU1SkHaRCKBW2+9lVdWVib5+Mpgn/J/FQwGA3r27JlkRWAwGERR3BM5TCYD/P6gAPUVNbQB1dW1OPfcc/gvv/wsVHsWiwV+v18AzpFIBIWFhejVqxemTp3KMjMzxYFv9OjR/IcffoBeb6jzJlf896neQywWg8FgaNLj3efzwWaziUMqEVVmsxlXXXUVLy8vFwdFAn4BoFu3bnj99deZAhKoRRp6IBCqU4ha4PH46sgIPYLBMIxGPUKhCCIRXlewV4tY7OgAJx3iI5EYHA4bqqtrkZHhRGamE7W1btjtitr9yiuv5MuWLRPKTgBJFkSNEa6xWAwlJSW48MIL+bfffstycnJw880385KSEkHUkEKVXv/GG2+IsWm3O3DllVfihRemMJfLI7IQfL5AsyyYEgnUWcyoRAYF50AwGEIikRBgRzQahdVqRlVVDTQaDSwWC6699jq+c+dOtGnTBr169cKzzz4rivrRAb9t27ZYsWIF69WrF6+pqUFtbS3Wrl0rah00BXJQfyDQB4AoOqnX6xEIBGA2m7F582a8++67Qm1I6l+v14urr76az5kzhxEISApeAo6ojeRC5vJ6RnUGfD4fTCYT9Hq9ANKONes0FArBZDIhFAohFArB6XQKEC4QCOCee+7hc+fORWlpqfCIJmCM1OpE0qlUylyWlZWF4uJitG7dGk6nE7FYDGS58OOPP2LHjh0AgB9//BHjx4/n5F+uVquFcvdEAS8U+y9jEkhItRJo7QuHwxg2bBivra0VRDcRJBaLBRdddBEyMzNRW1sLp9Mpirz/ViDs7xny+KHrlq85FeRNFT7ROCViWwaxUjPA6LNp7aaxJH+nTB6knq0aOmvR5wYCAVitVuzduzcpQ7Ch9ler1Th06BBuvvlmTmuVRqMR4CfNgWq1GnfddRfLyclp0OqMAFfqQ+FwGBs2bBAkhgzi0dxhNBpxzTXX4LXXXmNer1esd2QzBdTX7QiFQrjsssv46tWr4fP5BAlNcwYBtUQsLl68GB6PR3zObzEG4/E46Dpp3iYQn7KmotEoAoEAMjMzxbxDY4nAfLomtVotPPzvuOMOPmPGDAQCATGfdu3aFWeccQa+/fZbbN68OcnGhqwZU0kmmXgkwJmeJ9ksEvEpF0ymIsqpz/Y/IS0bEwTS+sI5R21tLWw2GzQaDS6++GK+cOHCJIKELPAikQjMZjMikQi6dOmCDz/8kLVo0ULUcnnttdfY119/zYkMIqBe3i83l1im9iPVvHwvVL+JCsCXl5fjn//8J9+6dSu2bt0Kl8sl9tcy6QIACxYs4EVFRfj4449Zu3btUFlZiezsbLEn3rhxoyB4AIi+HYvF0KJFC8ybN09k5TocDvTq1QvTp09narUabre7SevBEy1SSc9UUiAd6UhHOv5s8V/NT0slAlIPajL43xAI2Vimgfz3VHCpMYKgob83RhakIx1/9vg1WTHNeV86mhdNtS8BbXq9Xli3kIqVcw6n0w5AARbJpoQyAgBlY885h8/nw7333st/+eUX7Ny5E7W1tQKAkkEwGQygg5h8IDOZTGjRogU6dOiAwsJCPPHEE4wOewSYUlFheY6XFYR03wQ+WCwW1NTUwGw2w2AwwOv1wmazYeXKlQgEAkntIYOziipehU6dOuPll19iXq//iO850cPj8SEYDNYd/k2IRGIYO/ZePn36dLhcLsTjCkBPSmMieOx2O4YPH45p06YxQGnvYDAowA2y0qCDuNVqqQNldYjHEwJ0bCpoTSaFNeeKt/L+/fvxww8/AKj3hiUQxmQyoV+/fuJgGw5H4fP5kJnphMlkQCgUQTQah82mgDN+fxD79++H0+lEfn4uIpEYtFo1wuFokwc0g0EHr9cPi8WMWCyBzEwnEgnA6/XB6bRj7NixfN68edi1a1eS4o9AHerTBNDabDbY7XZwzuH3+1FdXQ0A2LNnD+644w7+6aefsp9//jlJGUlqQkBRMpMnb3Z2Nq644kpMmfI883r9guyIRpPrNxwtSN1Xr4SvzxYxmZRsmpoal1BAxmIxjBlzB1+z5ifs378PnCvERkVFBaqqqvinn37KSAlLoFCrVq0wdOhQvPfee9Dr9Vi/fj1isVizFOZUx4AyIejaCAw3GAyoqKjARRddxKuqqgSgRW0UCARQWlp6hOKX/t6Y6IPag6w9gHpQ9LdUxdM8yxgT/dloNKKmpgZDhw7la9euFddIlklEAhBJp1KpUFBQgE6dOqFTp06YMGECo2sGklWz8Xgc5557Ll++fDkApd8BEOpmej1lUh3vkUogEaAqq2BvuOEG/uOPPwKoX59o3jr33HPx7LPPslAoBJvNBgAiC+ZECFl1rlKpjphzGyumSf2I1nd53SYigOz1yAJPtsEjsI8AXlmxS+OOipsHg0G8+OKL3O/3w+PxwO12w+v1IhgMIhAIoLa2VhDvBw8eBAChoqaxKGfJhMNhLFq06Ii1ndqAiEXGGGbMmMFtNhsyMzORlZWFnJwc/OMf/2AFBQWCDPJ6vcjMzMT48eN5dXW1UDvT/ob6kdFoxKpVq1jHjh0BKOIKAqApi8FiscBqtWL06NF86dKl2LNnTxKpdtZZZ6GwsBBr164VRBw9n71792LChAn8qaeeYnLdgGMJtVoNm80myGRak0jkQBZjRqNRzIdy5h6B8ZT5GYlE4HA4cPnll/M5c+aIvpBIJHDOOedg5syZzOl04pRTTuEyGCr3G/nsnEgkkgohE7ELKHtXAooNBgPKy8tx3333cbVajZycHDz66KNMzgwgApf2dtS3m4qjvYY+gzGGjIwMhMNhnH766XzdunXgnAtiVSaSzWYzCgoK8Nlnn7GTTz5ZZB6SyOHGG2/kPp9PrLs0V9P+/Neox+UC5/Rs5XnA4XCgqqoKo0eP5j/++CMqKirE82WMif6dmj1F9ZUGDhzIly9fzoqLixGJRBCPx3HgwAFs3bo1aU6QM2x+/lkRlRgMBlitVgwePBjTp09njLGk9ZRec6KHbCVH5CiAJsUv6UhHOtJxIsd/jQBoSPVJP6cC97Qhbg5IL6v0UgGnpq6lsd+nQc10/FniPwHwj7X/p8fRbxeUtk2FyGiDqhACSpE2s9mcVMTLZDJBpVKhpqYGEyZM4Js2bcK2bdtQW1srwCQKUhDR4SXVKketVgvbkvbt2+Pxxx9nxcXFAmimjbP83tRIJWnl39PPiurZh1gsBpvNhptvvpkTuNUQ2EfvU6xtzkQ0GhfgMxXdJK/SEzn0ej3MZjO8XsWT/7bbbuXTpk0T4IdWqxGgJgGkPXv2xDfffMMIbAkGg8JPPjc3FzfccANfu3atUOR37doVjz8+gSkZGxGhGm8MfJKDgAe5CB6geMtXVFSIA6oMIpx66ql48cUXmUJuaaHX62C32xGP1wNRCmAcwRVXXMFXrVqJmpoadO3aFV999TXLyclBJBJrlseszxeA1WqG10uKdQP8fj8ikQgGDx7Cv/lmoQD+ZXBDzjrR6/Vo27YtevXqhaeeekp4Rmu1Wtxyyy187dq1OHz4MCorK1FTU4Nt27YBqFeRyZ9Ph3un04lLL70UU6Y8z4JBZQwaDEpmh1IQ2ASv19+gzYMcSnFZRfXv9wfEuFWUmFEBIIXDYVxyycX822+/hdvtFu1MysGamhr4fD6hjAcUsoIIuXfffZetWbOGb9myBfF4HI888gifNGkSayoDgLJIGGMCtAIUkJGU8oMHD+a7du0SgBa1HQFvXbp0EUQHzYMABHgpA5ep8xDZBHk8niTggvrtsQaBrHRfgUAA+/fvx9lnn82rqqpEvycShEBPGi9t2rRBly5dMHnyZFZUVCTuhQB9AnYtFotQ7ubk5Ij7TQXpgPrsrBNl7iMrGKoPIhOK48aN40uWLAFQT8pR9OzZE59//jnz+/3C2oXeR2BVc0jM3zOaTMGuA7rlTEzKkCFQXT4P0TpIY4reDzSsnJZV/nLfItCwrKwMU6dO5VTnxOv1wu12w+Vywe/3i9cGg8GkeZxCHosy8EzgP4HP9D66BhoHqbV56N5p/vX7/eIzqQ0+/vhj3qlTJ5x00kkisw0AVq9endSGdB1kjfLjjz+y1q1bi/obBJwTwW61WlFVVYXrrruOr1y5EqGQkkUVCoXQpUsXzJw5k+Xl5cHpdOLqq6/mO3bsENZqNN6qqqqgVqt/s+zDUCgEg8GAsrIyZGVlgexX7r33Xr5hwwb4/X4UFhbinXfeYeTJTxmUlGkkW4rpdDqMGDGCL168WKxhZrMZQ4cOxSeffMKCwSCI6JHbkTKrFAu9emKJLIIoK0teD8xmM3w+H8aNG8e/++477NmzJyl74PPPP+fnnHMOXn31VUafSfVS6Dk2FU29htYQslDr378/37x5s7gn6rNEOuv1egwePBjvv/++ICfIJoqyTVasWAG/3w/OOTp27IgHH3yQAUdajjWHBEgtmkvfR+1++eWX8/Xr14MyCul7iHyRrYbIKosiHo/j0KFDGDhwIF+2bBkrLi6GTqfDfffdx6lWFAmJLBaLKAhMfddms+G8887DK6+8wlQqlcgs4ZwL4ulEF9rIlqoNYUvpSEc60vFnjT+2Qg2SPTIbIglSLYEa+7/874ZIBvq7DDo1RQSkIx3/69EcED89jn6/MBh0CARC4vBNBwZS52VkZCAQCMDv98NkMsFisaC8vBy33347X7t2LcrKysQBiIIOYJQtEIvFjlC75Ofno3Xr1jj55JPxwAMPsLZt2wJQDhm1tbVQqVQwm81gjAmCQgZv6VAiA/cN9SWDwYDa2loBOgYCAXDO8dVXXx2RLUCfQd+pVqvRrVs3PPvsZFZaWg6r1Sruizb1J3rQmmW323DZZZfxzz77LEm1RjUgAAVMGjJkCD7//HNxIA0EAnA4HIhGo3A4HNi0aRMWLVoEznmdR3ocp556KoxGPXy+wBE2U80hEGV7BLPZjDFjxvA1a9YAqD9YE/htMpkwdepUBhBoFAdjqPOBN8LrDQj1b//+/euUeso1bdy4EVdccTlfsmQp0+nqQfijBR3iAoEAsrOzEQiEcPDgQVx00Ui+d+/epGwXGTQlQKNjx44444wz8MorrzAg2U84HA5j9uzZ7Nprr+WbN29GUVERrr76au7z+Y54fmRXomQ6ZOKHH35gBQUF8HiU19psiqe/Wq2uAxpizQKQ6DkFAkFhsUCgsWKr5cCBAyUYPnwY37hxo3gfAdCRiHK/Op0OxcXFAOrtv2h8EwnZs2dPbNmyRahuZXuIxkIeq4Bir0Ekpd1ux9ChQ/mGDRsEkEb3RCRL37598eabbzKan6g9Cegl5SJ9j1xAl7Ji6LvGjRvHvV4vJk2axAwGg5gzjzVkG4f77ruPf/DBB/B6vVCr1QKUloFrACgoKEDPnj3x5ptvsqysLPF72UM7HA7DZDKJeYwIksOHDwOAyMACFHBcJhtSP+t4DbJQAuqJC6oFE4vFsGDBApSWlopaEdS/i4qK8Mknn4h5zmw2Cw9t6iOyN/XxGrL1hKzqp3GdmiFAcwKtiaFQSBB+sn1fKFS/ZygrK8MzzzzDiaD0eDzw+XwIhUIIh8NJloGp0RD5njovkeKe/kY2hDSPA8kZAbRWkEWTLDZI9ZQHIMgHmrPcbjdWr16NH374AXPnzuU9e/ZEfn6+qB1C4DQRRk6nEz/++CNr1aoVPB4PbDabuBYCUBOJBA4dOoQRI0bwdevWifFUR1DijTfeYDabTZDH+/fvF9dL86VKpfrNVcMGgwE1NTXIy8uDz+eDwWDA2LFj+YwZM1BVVSXadsSIEfzrr79mRETW1taCiBHZZufiiy/mX3/9tbhmg8GAdevWsdatWyMcDkOn0+Gee+7htMejmg2cKzZCDz30EAPq+61sNwRAkCEejwf/+te/+DfffIO9e/eKfkBrk06nw759+zB79mxoNBr+2muvMcpSpGttrM6BHI2J/VKxhOrqapx22mm8pKREZJ9RLSJA6edOpxPXXHMNJk+ezGjtINKDrJ0uvPBCXlJSImqudO/eHa1atUracxKZ1RwAmb5fJipNJhPGjRvHZ86cidLSUgHqU0Ye7aVoDiCbpdatW6N9+/bIyMhAWVkZtm/fjsrKSpSUlODuu+/mn3/+OQsGg1i/fr3Y/xExSDZ5tP9r2bIlBg8ejJdeeol5PB4Eg8GkOg6y8PJEDvk50R5Cnov/DPeYjnSk48SM/0TA+2viv0YANKTMT7341Ak39d+pdhLAkUVOG/psGfBP/c7U96cn/HT8L0Vj6uxfE00RauloPJpqM/IFJzU7bVD1en2dd7JfAHRjx47lP/74I7Zs2QK/3y/UdwDEYZWAejoA0N91Oh1atmyJjh07ol27dvjnP/8pbChisRj8fr/YLJPSjDxhqRCg7O9KKnw65KcC+PQ7AgDI+iE3NxcjR47kZPsBHDlH08+FhYWYOvU1Fg5HhTKNAGez2YRgMHTCe3hSgd2rr76Gf/bZZ1Cp1ML3XrY4sFgsGD58OD766CNG6k5qe1Iyut1uXHHFFby6ulocJs86qx+ef34KC4ejQk1K9iSpiraGgixdZOXfDz/8ALfbLQB1+n8ikcBpp52GLl26iGvX6RSLH7PZKNT648ffz999910BcAD1z9zj8UCrVcPl8sDhsCEaPbrKWamREUZubjY8Hh8effQR/uabbwplKdkOkOqNvodsbwj4pzaUM3IIRJo+fTrz+XwYP368UCsTWCtb1vh8PvTo0QOrVq1iRBLYbBZUVFTVtYUODodiY1Jd7UJmZmaTKm5F6RypUwtrEYkoVmAZGQ5kZDhw+HAZBg06j+/YsSNpvDOmAmOK8o+sL5566ilmNBrFdRMgEAgEYDQawRgTSm0a900BXgQIERhoMBig1Wrh9/tx991386+++ipJfUfXSF7EH374IdPpdGLukm0WGrIAksFExhgsFgv27duHUaNG8X379sHlcuHLL7/k1157LSZOnPibMIThcBgWiwWjR4/mb7zxRlIWBvl00xiwWq045ZRTcNppp2Hy5MksFArB6/WKeycFJilz6XlVVlaioKAAd955J1+7di1ycnJw0UUXoWPHjuL1jLGk4pEnAgFKdS6UTBajIN4IbNuyZQuAejsGKhh//vnno0WLFmIeASDWNLkA8vHeBjJRnurFT+QbAEHSy4QiEXFerxcvvPACd7lcqK6uRnV1NVwul7DxSQX4U89D8nem+pfTHEf7B7pWGnskIJCJUwJ76f9ECABA586dUVRUBLvdLupx0Fi5+eabGZHPdI3kOf/SSy/x8vJylJeXo6qqCuXl5aitrYXL5cLChQuT2pTsXAhAvvrqq9GqVSthLUghkxH3338/f//991FTUyMK03bt2hWfffYZa9WqFXQ6nfBR379/P3755ReRMUZEgmwHk1qL5D+NSCSCjIwModLevXs3pk+fLjIoKPPzu+++w6FDh1BUVCRsfqjfEDF07bXX8rlz5wrQt6CgACtWrGBFRUXiuUWjURw+fBhut1sQvHR/eXl5oi4H9RGTySSyREwmEwwGAyorK3H99dfzVatWCaEKAFGDgfqPwWBAVVUVNm3aJDId6HnQPPCfACDyfpMIxdNPP52XlpaKvSZQn0GWSCSQmZmJnTt3MpvNJsYKiVKIRB49ejRftWoVNBoNXC6XyNyi76W9zq8hAOg91DcZYxg5ciRfsmSJ2KNQ5kEgUJ/hR0B9YWEhunbtiilTprCWLVsm7cPC4TBat27NKyoqsGnTJkSjUVx//fW8rKwsydpQFnuEw2EMHDgQS5cuZVTXhsYMZQ0QEfBnsACSCXJ5PmiMWEpHOtKRjj9L/FczAFJBeWJcU38n/9wYCUCR+n75fbShbej76WcZ5JBBKfo5Hen4M0djfbyhDJtf8/6jqb7T0fyQLS7I/oIUd6FQCDU11bjjjjv4unXrUFFRkfQ85GKTpBqin+kA37p1a3Tp0gWTJk1iLVu2hFarhU6nE7YZdAhL9RCm+TUrK0scAKlILQF+RqNRHP5S+wMdkuiA4Xa7wRjDwYMHsXTp0iMsBWTSAFA27t27d0f79sWoqKhCVlaWOMAqAAKa7WN/PIfdbsVf/nI9nzXrUwAA5wkBRBPRotFocOGFF+LDDz9kBABS21LtiGg0ipEjRwpAzWAwIDc3F2+++RbLyHAgEAiJwxwdeJtjAQTUgx1arRajR4/m27dvr7vWevAAQN33vcmo7xFAQ2pRi8WEUaMu5t988w1CoXrFNNmnBIPBupT+RF0KfNPtRwSITqfDAw/cz6dOnZp0zbFYNKlGgVqtxnnnnYePPvqIOZ1OkNcvAZX1hZhNgkSh4qO7d+8WfTYVuFepVDj11FOxZMkSFo/HkZ2dDZfLBZPJAofDAZ1Og3ico7ZWIfyys7PqPqfpeyQADYAoAA0Ahw+XYcCA/nzXrl0ASO2mAecJxOMxATwwxtCmTRtBJslWBEajUbQLjXGdTge3290sixnqi/IcEo1Gccstt/CFCxeKjB0KmrPUajUuvvhitG7dWtQRoH4iZzDJRU9lNXE0GkUoFEJZWRkGDhzIS0tLASjzSFVVFd5//3089NBDkL32/5Mg8P9vf/sbf++990Q7W61WeL3epOtr1aoVhg0bhpdeeokRCGUwGMR8LvsxkxqXwNCCggJEIhF8++230Ol0GDlyJKZMmcLos2lOkBXJzcnQ+KODspRonq6pqUFmZibuuecevnjxYnEmICVyIpFAr1698OqrrzLKxvH7/SILAKgH1WVy4I+Kptqf1OoajSbprEIkmMvlwsSJE3lVVRWqqqrgcrngdrtBqlyyzaMsv9QzlPw7OSsulYCXiYWGzlT0e6rfYTAYoNPpoNfrodPpcPjwYdFnabzSPoPm/4KCAgwePBhUtPrXxMsvv8xkgHXr1q3417/+xbdt24Zt27aJYq9kB0UEZv/+/TFp0iQWCoVEEddUv/Xrr7+ef/XVV6CirtFoFOeffz5mzJjByHJHp9OBMnXIA15eM+LxOIxGI/7+97+Lgty/RZCFTSAQgM1mw0MPPcSpCKts80N1ZqiNyG6M5vIbb7yRf/rpp6KPFRQUYOXKlaxVq1bgnKOqqgrZ2dmoqKjA2rVrRTvR2AOAjh07ij5D44rsmuh7brrpJr5ixQrs3r1b9K3c3Fy0atUKer0eq1evThKfaLValJSUoKysDG3atBH7BRrvzQm5v8v9mnOOyspK9OrVS9ixMaZYP1GhcQDo1q0bvvvuO0Y/03igecViseCee+7hM2fORCAQgMViAWMMc+bMYXl5eQDqreDouf8a4Uk4HIbD4cCePXswYsQIsUcjck0m4ehZtG/fHn369MHLL7/MTCaT2ONRRhDtDQcNGoTp06eLLIH169cjkUjAYrHA4/FItbSUPnzVVVfhww8/ZJQpEwwGxXMGFMKH+t2fwQIIgNjTyYWyfwt7wHSkIx3pOJ7jdycAUhcIGVhMVZ/Ir2lM/Zkasqqloc+mhbixzAM5lS71P3nzk450nIjR1AZNHn+y6iEN4B8fQUW9CMxWq9UoKSnBvfeO5Vu2bMGePfWgY0Pzn+wRSnYZ7du3xymnnILCwkJMnDiRyUWv6D2AcvgkNXgqsEDzKh0iyLaAgH3Oufg+eT5NJVvlVPREIoHbbruNy4cz+ftkP1qn04nXXnuNRSIxoYKT7QPC4eifou/ec89Y/tlnnwkQQlbCcq7YXJxzzjn48MMPhUUNAYH0PNxuN/r27cu3bNki1MgqlQrXXHMNOnRoB58vIA6N5MOs0agQiTRPxUZAj1arxU8//SRS51MBqTPOOANt2rQRfVnx5Q3A6bQjkQBOP/0M/tNPawXJ0a1bNxw4cAAul0t8V1FRETQaFex2K4LBcJMgQSKRgNNpx4033sQ/+OADAMl+1TS+otEoMjIycNFFF+H1119nBFSbTCaEw2FhOUOAUDAYFGCCx+NBOBxGZWWlaEd53HDOkZ2djblz5zJS8wH14I7RaEBlZTVsNhucTnud5VfTBY7p+lUqVpdxk6gD53TweHy48ca/8l27dgnVvgzskT0GgQxms1ko0Cm7wWw2J9UMoSwgAMjKympWBoBcG6KsrAx33HEH37x5M8rKyoSiEDgyO3PgwIGYMmUKo5oEZNdAc4ucxSSDlgQQBgIBuFwudO/enZOHM4HkoVAItbW1ePDBB/mrr756TJOEXq/H3r178c477wgyjpTZ8pjq27cvZs2axfLy8oTnOF0XAAHY0Lgl4tXv94v7B5QxNHDgQDz33HOMgHOTyZQEPslZB8c7QENzASkvMzMz4fF48PnnnyMYDCbZcsXjcWRlZWHGjBkMUJSxinWYAvwnEgkEg0FhB0Rg1fEcNIbcbjfKysowefJkXlpaivLycng8Hng8HmHxRyGPGXl9lUO25JFJlFRwX97nkWWVyWSCzWaDyWRCRkYGzGYzHA6H+N3o0aMZEQDZ2dnwer1o3bo1j8fjwgqL+qv8/DIzMzFp0iRGoKbcRxvKEiQwmF5DynWtVouOHTvinXfeYQDQr18/vnbtWtFGNO50Oh1efvllRusgzRPk959IJHDRRRfxefPmCTLRarVi2LBhmDZtmqhvQvcQiURQXl6O77//PonYpvtr3bo1srOzk57RbxHxeBw2mw0VFRVYtmwZGGNibNC+ICcnBzk5OaI/EUgfj8dx55138pkzZ4pMjTZt2mD16tWMrtXn8yE7OxuxWAz33nsvJysl6mO0RysuLk6yoSSlvNlsRjAYxGWXXcZXrFgh7M/UajU6d+6M/v37Y8qUKayiogKdOnXiLpdLiBOoRpHdbhfrEdn+yDVOGovG/k796YwzzuBU+4r6kTyvdOvWDUuWLGFGo1FkXJGYgcjk0aNH8w8//FDsGYLBIEaOHIkWLVqItZ72rxTNJYCISPnb3/7G586di7179yaJXeS+yzlHbm4uzj77bLz11luM5k2y8aLi6RQGgwGTJ09m+/fv58XFxRg7diyvqqqCRqMR4h66p1gshn79+mH69OksGlUyaonUcrvdsFqtMJvNYo3S6/V/igyASCQCl8uFeDwOp9Mp1owTIXssHelIRzqOJTRNbZB/60kwVV3f0CG3oQ1tY9fSVAqg7B2bCpA19P5UYiK1yHDqZjX1Ouj9slennGkgg2EyYPWfHtT+0w3S8RJye6WCAc1pk2M94B5r+/w32lfuf81V5jc3mvqc1Pkh9fWN1fBobFzK//8t4o/u303dC6WTE0AK1CurSC0n939ZaUfgFh0uxo27j//4449Yv34DQqGgRG4mH/JTAXeTyYyWLVuiuLgY7du3x8SJk5hazRCNxuvUVgQKMACyspqBMbX4N+dye5N3qaGuHZT/kt8DxOMJAAwqlabuuurezer9fulaH3/8cf7tt98m+SKnggJ0GOrfvz+oGKw819LBixRkqQBJY33zP42mnn9T36XTaQRYSAc6j8cDh8OBXbt2Ydq09xEI+MEYEI/HAHAAigLd7/ejd+/TMH/+fAYAlZXVyM7OhN+v9CmTSYeqqhp0734qLykpgd3ugNvthslkxsiRI/HUU5NYOBxN6pcA6kDvaF0h3hDsdkU5GQiE6v5uQCKhkD8mk0Eclrds2YJNmzYdsX7GYjHk5+fj5ZdfZrKSTVGimVBT40LfvmeIzAGLxYKRI0di2rRprEePnvznnzeItiSwz+Xy1P273mJHtrsi4EitZrj33nv59OnT6voJRywWhUrFkt7XoUMHjBgxAk8//bQAqIB6Sxnqd0D9nEiKMavVitLSUhw6dChpX0PgiV6vx2WXXQaz2SwsGciiizE1otGYUKJHIvWEXXP6qkoFBAJ+GI0GxGJRxGJRcK7F3/52J//6668AANFoBCpVvZhBAQ1C4jnodDpUVFTA4/EIazEiAuh5+Hw+7N+/XzxbAgMIHKJ7letHhMNhuN1u3HfffXzLli3Ytm2bsLuh19DnyVZJ+fn5mDlzpvCaJmCIiFD5vbICljIH6FDfs2dPHggExLxIGRzUP+j5HS3kNiMlJj0/AozOP/98TgUUCaSUxSMXXXQRPvroI0bAKPnby4psmciS24MACRqjL730kmgXuaAyERxAPaj0W891zY1URe7RgsYXFTgGgEsvvZQfOHAgKcuD1rX+/fsjMzNTWIaQ3QsFKaNpzSQQMdVbnv6Wev5I3ePT/r+hz5C9uOXf0fOQ1yIiESORCKqrq/Hss89yr9eL3bt3w+12o7KyEh6Pp0Hiu7E2bExAJbdH6v6NQH6z2Qyj0Yj8/HzYbDZkZWXB6XTi9ttvZzabDXa7HRaLRfRpuX96vV5RVD6RSGDo0KFcrnFBY4CANAJbTz31VAFY07htqo/q9XrRN+QsBrIGslgsqK6uPmK90Wg06NOnD4qLi5O85N1uNzIyMpBIJDBixAi+YMECcX3Z2dkYOnQo3nrrLSa3m9frFUTbX/7yF04kh6wY55yjTZs24v6ofzYVVEyV2k2e5+ia6Xdjx47l5eXlYm9INXAikQg6d+4Mi8UiCDXy0t+8ebOwDFKpVMjPz8eqVatYbm6uuEb6nlgshnXr1onrkK17WrZsiX/84x/Cjo3CbDajoqICgwcP5hs2bBBzj1qtxpAhQ/DBBx8wi8UCzjnGjh3La2pqkrJDZKEK7SPo+5tjQUhBJL7BYBDkw6mnnsr37dsn+pe8ptHzWrp0KcvIyBA1M+haAWVMXXONYr1INmsAcOaZZ+LDDz9kNM6p1gj9P3VcyvMMKeup7pVKpcLWrVvx/vvvw+12iywWObuE5v+ePXti5syZrLCwEF6vV1jMUSYizTfU36PRKLKysrBgwQJmMBhw6623cvpseh1dZ1ZWFubOncsog5aunXMuLICIcKd/nwjgvzz/yMWSqX8nEgmce+65/PDhw9ixY4cgVShzqblZKOloOI71fHSif39TcaJf3+8djeGjf3S7HC9xrM/nTz+7yZsMGUSSNwUUR9toN/RzYyRFY0RFQyrYdKTjRIrUA1tzFjB5M/xHgRJ/VCggqUmonWhTScAjKahUKhWCwSA45+JgQErO0aNv4d999x22bt0KAMKShMAsGTCiMJvNMJvNOOOMM9CiRQs8/fQzzGjUIxqNCxAu1bu9sWiMzPktyDOVSg2XywWr1Yrvv/9epLLLBejkIsUqlQp5eXl4/PHHWSp4cyL2KwIMZJBIq9WitrYWI0aM4G63WxyEiSBiTElP79SpExYu/IbF4xw1NTXioEYKwX/84+/83XffrfPj19SB/yYMHToM77//HgsEQk0q1ex2K6qra6HT6WC1muHzBeDx+GA2m2GxWBAKBYRX7ogRIzhdH2NMgKY6nQ5nnXUWCgoKxGGYQKTS0nKceuopvLKyEgaDEVqtFpdddineeutNlkgo4DUBcUSORaNxOBw2xGIJJBKKSo4AWc45fD6fsHvYtm0b3nrrLaHUA+oPr8FgEKFQCP369cOnn37KFEIpItSJZDskK+Pj8bjIxPF6vSJz4K9//SuvrKwU7SYf+tu1a4cHH3yQkS85gRu/hTqZLIoIJLdYLLjzzjv5Bx98IIr8pQL5sVgMWVlZQvkWiUSwY8cOjB49mn/yySdMycxQigLG43HxHbt27QLnSmbP3XffzUhhKgse4vE4Nm/ejEceeYQfOHAABw4cQGVlpXh+qUIJIiBku6lRo0bBYrEINTcBRPR+GguJhFKfICMjA0ajEWVlZcjLy8OBAwdw+umn85qaGnFtRN7Qvzt16oRHHnmkyQmDACkAAhiIRqPiuq655hq+a9eupOwcmRS54IIL8NRTTzGDwSBUnAR+Ufv9L4ff74derxfg/5133smXL18uADB6zowxtGrVCm+99Rarrq5GZmamIH2OFjKZ1lChern9iYxoLAiYJfKewGYCpukzAoGAGGePPPIId7lcKCsrQ3l5OVwuF/x+P4LBYNLZJPUaiKCQ54iGzhYyWU73CUCAoDabDRaLBVlZWcjOzkZ2djYyMjJw3333MbvdDp1OJ+Y3Cnm/RkQVrU9arRZWq1XUTNm5cyf27t2bZIUjXxfdk81mw8SJExnNowR6N7V/9Pv9cDgccLlcwiO9oqICOTk5AICbb76Z7969W5AJtFYYjUZ069YNgEKI1dbWQq/XIyMjA36/H5dddhlfuHAhDAYDAoEAioqKMGfOHEb1aeSi03a7HdFoFHv27MHmzZuF3Yo8h6lUKnTo0EH0N+pbTWVxkcUarQtkBUb7QwJ2dTodVq1alfQsKLPLbDZj6tSpjOY6r9cLo9GI7du3o1+/fpz6UX5+Pnbt2sXUajWqqhTbRAKXA4EAHnroIV5SUiL6OrUdEQwZGRliPSebp02bNmHw4MH88OHDgnzNz8/HRRddhOeff57RGso5BxWhp3FIRJFKpUoqJCwLOpoKeW4mv3+n04kLLriAb9y4UexDotGo6KNUX+XSSy+FxWIRxAHtqQ0GA0pLS/GXv/yFL126VGQ9cM7Ru3dvfPHFF4xIk6aukTLY/H4/jEYjbDYbDh06hMLCQgDA3Xffzd966y34/X6o1eok8J+uJyMjA8OGDcP777/PAoEAwuEwrFareIaAMt7cbjfsdjv0en0SAUXzyfLly0V/pc8mUrNv375iTfut7KuOh5Dnf8qMofEQiURw1lln8a1bt6KgoAAGgwEqlQo1NTVwOp3NFiGmIx3pSMeJGH96AkBWf6ZuoH+tev5oG/DmfEZDAOjRFpgTEdBKx58rGlKYyX24IWa2McLsaJ//Zw273Q6v1wvOORwOB1QqIBZLCG9Nm80mNu/RaBR5ecrBdvz4+/nWrVuxZs0aVFdXi0OISqUS6fUyqETAhs1mQ3FxMbp164ZnnpnMnE4HGAMSCSAYDAv1LlB/eDpa/JbPrqENNdmsjB07lq9bt+4IpX4qQJZIJHDmmWeiXbt2DXoVN+e6j6eQCSHybzcYDBgxYgQnwgeoBxQI1C0qKsKXX37JSA3pdDoBAKGQUnx59Ohb+GeffQYAsFpt8Ho9yMjIxFVXXYmXXnqRVVZWw+l0NglABoNhYQ8TDkeTDusulwuZmU7U1NTgiiuu4Lt37xaAAVCvGLPb7Zg6dSqjQnakQN2xYwcGDjybV1RUAAAyMpy4+OJLMGnSJOb1+mG1mpNUzkpWgxlarVrcp8lkgNfrFeMskUjAbrejuroaTz31FH///ffh8XhEfyCFOtUTuOCCC/Dqq6+ynJwc4flL6e+UXq/RaASoIlu3cM6RkZGB0aNH89WrVwOoV4PKquXOnTsjNzdXqMoAWal6bB7lpBCn9tm6dSs++OCDpO+hZ+zz+aDT6VBcXIzFixezu+++m8+aNUuAQHPmzMGoUaP4J598wiwWiwCeAGDkyJGcLGfsdjtatGghrG6efPJJXlpaigMHDuDgwYOoqqpCIBBI2nupVCrY7XYUFxfjl19+EUQfY0zY1yQSCfTr1w/PP/88A+prNNHBPdUnXa1WiwKZZWVlyM/Px7Zt29C7d29ORTJlcpTAD61Wiz59+iAzM7PJ/ZusQqXvDgQC0Gq1OHDgAFatWgWgXvkN1FtM9erVCx999BGrz+6IJCn1ZWKisTjeFWLHGvKYUqvVWLBggZg/gPo20mg0GD58uCA5mwP+AxCZNgR0U9RbndWrQmVFd6p1Dj0HOVuK+pLf70dJSQmeeeYZXlpaioMHD+Lw4cPweDwic6ihfkbZJPJrZNA/dS8lXwddJ90XWZg4HA7k5eWhsLAQY8eOZTk5OSKrp7F6CERqpe7raP6mdVv2xqY158EHHxTzt0zyydcZjUbRpUsX5OfnCxKFshubzpBTrtlqtQqRRE5ODjweD1wuF+bPn5/UNnSdffv2xeOPP85ovXE6neBcqQdz7bXX8sWLFwsCsXfv3vjyyy9Zfn5+UmYPkRVU5+CWW24RpCIFEQWtWrXClClTROYAiReaCjmTBYAgHagPKiR7CJdcconIiqH2JZC4bdu2aNOmjejPer0ePp8P559/Pq+trYVGo0FBQQG+/fZbRuCvrHSna92yZUuSdRkR+Ha7HW3atBHPg9pozJgx/P333xf7UcoUGDFihKhPQp+/d+9e7NixQ9w3zee0XsvZWKnZ800FtTOB/7fccgtfsmTJEfMxALHPuu666/D0008zsgorLS2FyWSC3W7Hbbfdxr/++mvs27dPvF+lUqFv37746quvmE6nQ01NjShWfrSwWCxC7AAogqD8/HwASlHmmTNnirmMSCW5b3Ts2BGzZ89m7du3F/cHKDZEWVlZSVaEZEdIRFkikYDf74fVasWYMWP4oUOHxP6RskdoT/nmm28yue3lDJ0TOSgThiwNAWXuPnDgAAYOHMgPHDgAxhiWLFnCrFarIBfpfelIRzrS8WeNPz0BkBqpauRUhY38f9pQHo00aE6aYkOfm3o9DX12OtJxvERTxJXct4/Wj1P/dqJvMJsKOkDF43HU1tYiFovBYrEIG4jq6mpotVpkZiob+zvvvIt///332L59+xG+v6SApjaMRmOIxxX/7jZt2qBjx0544oknWHFxMbRaNTgHgsGQOODTAZGABUqP/T0jFQxoTFWzbNkyhEKKxYxcIC61jkCLFi3w6quvMs55HTh7JKhxIs2jCohtEoXILBYLbrjhBr5kyRIB8FC70KE/IyMDZ599Ntq3bw+APL9V8PkCuPXW0Xz58uWgw148HofX60HPnj3x+edfsJYtC+H1+ptdwI28XhOJBEwmAzjXwudTQLXMTCcOHDiAG2+8kS9evPgIiwwCbgcNGoSMjAxxuKqqqoLH40H//v15ebkCHrVp0wZfffU169ChPRIJfkRdC7LSqqysQDQaF/ZBpEgkVRzVC3jyySf5Sy+9JEBXUmOS+lqtVuPyyy/HtGnTGIAk8oBU7w6HA2azWVhQkI++yWQS93LXXXfxWbNmiQO1fN00F7Zu3VoA3aQ8MxgMv0k/JdWgyWSCz+fDgAEDuMfjEX8jgJkUf23btsW6deuYXq/HJ598wq655hr+4YcfCnDsiy++QOfOnXmHDh2Qk5MjsjtWrlwprDu8Xi/69u0rvJyDwaBQeVJQ383NzUX79u2RlZWFRx99lE2aNIlv3LjxiDmB/N3nzZvHamtrYTKZhKqeFLYERtLvKPuppqYG+fn5uOuuu/hbb70lLNcoeyh1z1dcXIyJEyc2q/Hl9SxVsT1+/HheWloqLBjovuPxOHJycvDll18y6k9Uo0SuOZEOCPDfZDJh0KBBXPbABur3B3379sVLL73EaP0j65+mFNYmkylJ9ZmaAUC2TlTDhoIsQchSSM6Wq6mpwWOPPcZra2uxYcMGeDwe1NTUwOfzifdTVkBjNcro3ojsINV3Ksgvn0+UQukWZGZmIjs7GzabDQUFBbBarfj73//OsrOzxZggYUBqBoRMPsnrKrVpQ0FzJ2WqARDr0vr168X1p5L3Msjbs2dP8V7yHpevr7GgNiHglrKSVCoVLrvsMl5aWppEEtGzfO655xgBeKSMjsfjGDlyJF+0aJEgb8444wzMnz+fmc1mAdTS3gOAeD4HDhzAunXrxDMlopvu6YwzzhDPlohenU7X5BpLSnJa46n2BynHE4kEbrjhBr548eIkKxO1Wi3muYEDByISiQhbJpfLhb59+/IDBw6Iegdr1qxhWVlZSRY98hk4HA5j06ZNop9RzRVAqd0wefJkRpmYZrMZ1113Hf/444+T6kWdfPLJ+OmnnxhjDDU1NcjIyBD7m7///e9c7uv0TGOxGNq2bXvEOJazqI4WtLbTPraiogILFy4UgK/f7xfCCrJLGjVqFF5++WVGWQwAkJ+fj7Fjx/IFCxZg+/bt4t6p3tSll16Kl19+WbSBIuZpnkWR1WoVRA/V1bnnnnv4J598ItYBeW0hYqdz585YsGABI/LA4XAI330aB0ajEX6/X1wHEaSAsv+yWq3YvHkzPvjgA9GXqe3lugLZ2dkC9KZzRnMI1uM9qIaBTMLfdttt/IsvvkBtbS1ycnKwdOlS1qFDB7FuE8EVCATSJEA60pGOP22c8ATArzlEN/Ta1MPh0f5+tP83J1LrADQFljZXAZGOdPw3oqFsAPlvzSUB/pciEomING6z2SwOxJFIpG7DmYVIJIbRo2/lq1evxo4dO8TrCUSQQSz6v16vR2ZmJgYMGIC8vHxMnvyMaHKXy4NEQvEeJ7CRgBACAZprP9IUYdOc55xKfMo/2+12XHvttUlqd7noI1APgqjVagwaNAgWi0WAhjJ+cCL2OVlxZTabUVpaigULFgCoB1kIWKfXnnPOOXjrrbeYYhmUQHV1NW666Ua+cuVKUJE3AEgkOKxWKy64YCg+/PADFolEUV5eCafTCZ1Og+ZYACkWVUaEQhHU1ioetVarGYFACBUVVRg5ciTfsGEDAOV5Ut8lO4AWLVrg8ccfZwCQk5MDn8+HyspKnHvuuby8vBw6nR7Z2dlYt249s1gsiESi0Ovrfb1zc3OT1uYDBw5Aq1VDq1WjvLwSDodNgBqk0r/qqqv4nDlzkEgkBAggW+7E43GMGTMGzz//PCNg1mg0JrUFFRhVqVRwOBziORBg4nQ6MW7cOD5z5kzU1NQkZT4AENYgBQUFePTRRxn9jcBixlidBcyxEaCk2NRoNDj77LO5x6OMfaPRKLKMAAVgat26NZYtW8YMBgMOHz6M/Px8vP7668xoNPJFixZh//790Gg02L17Nw4ePChAGBk4pNi8ebMgFQBlbOr1epjNZuTl5aFDhw4oKirCI488wmjuCQaDmDt3blKfJhAjGAzijDPOEIpJAEmALT0/AmBS55C7776bv/vuu8KaQimKHEtSL9N80rt3b1H0sqk5g9qASFStVissRajfh0Ih8fxpnA4bNgwFBQVJwH8q2JkmAZTQaDS4++67+fLly5PWCAJ2W7ZsiY8//pgRcCXbfTUVMvAuj29S3NPcIVvMEVioVqtRXV2NCRMm8IMHD6K0tBS1tbVwu90iYy/1u+Q5Qu5/QOOWoXQ9FDqdDhaLBWazUrvHbrcjJycH2dnZuP/++5nFYhGF3lMzBGQLPRloldcPOQh4lMcTZUeQWlzOUqPvMJvNuOmmm0TBWNpb0GfQeIvFYujQoYOYawlUJKC+qWdIQHo4HE7KfLzlllv4Tz/9lATIEzk0YMAAtGrVStwfte0FF1zAV6xYIe554MCBWLhwIXO73QAgFMJarVaQvtQ/rrvuOk6vA+qJgWg0ijZt2iSRU3K/aiqIGKb7kueZcDgsrIpkz3zZZq+4uBhPPvkkIysbn8+HM888k+/evRuMMVgsFqxevZo5nc4kwJqU4PF4HHq9Hrfccgs/fPiwsMuhewOAPn36CDJWrVZjxIgRfM6cOUmkWJ8+fbBixQpG156RkQFAGdu1tbVYt26dGAs01oic79ixowDx6VzcHPskClK52+12nH766fzAgQMAlCwVOesrEong1FNPxWeffcZka57bb7+dr1mzBvv370/KCrJYLOjXrx9mzpzJaH6n55pIJFBRUSGKPjcW1B7U1mq1GnfffTd/8803wTkXpLo8/rVaLXr37o3FixczEhUQgUAAvbwumc1meDwekQlERY51Op2wA3S73aL95eK/nHOccsopwh4JqCcj/wwRj8eFiCESiWDkyJH8q6+U2khFRUW4+OKL0blzZ/F8aC4BcELUOEhHOtJx4sYfLYA94QmApqKpA15zwEz5d/L/G3t/c5TSDb23scyAdKTjj4qG+nljAH9D4yY1Ut93IoK2vyaMRuMRSitqG7VajSuvvIqvX79epEfL6nxSu6rVGnCugPaZmZno1q0bTjnlFDz11ERRENLr9YkDhl6vF59ht9sRCoVQW1sLoL5+AL3vv+lB3VA2QDgcxtKlSwHUe5XSgS0VYOnYsSPefPNN5nK5YDKZkhRKJ2q/oiJ6pCgbPnw4r6ysFEX+CMCmA9+ZZ56J9957j23btg0PPPAAP3y4FFu3bhUgt6ymPumkkzBr1mcsKysLsZii9srOzkZtbS3C4TAKCvIQDh8dhGSMobq6FpmZThgMOrhcHuh0Nuzfvx8XXjic7969CwCEDz2QbLt3xhlnCCBUq9XiH//4hwBqAUVdWFJykIVCEfHca2vddYBDAs88M5ktWbKE06H2wIEDGD/+fv7005NYVlYWVCoFgE0kErBarfjLX/7CZ8+eLQ7/lEUjq95uu+02UeyXagEQeRGLKQV5ZaDR7XZDo9GAVKJarRYlJSV4++23UVtbK1TdFAQWcM7RqVMnWK1W4fFLquPfKvvGYDAgEonglltuEURMKvgPKGDGN998w3JzcxGNRlFQUABA6X9vvvkm27lzJ/75z3/yjRs3Yvfu3UlWHUr2h0mA6hRarRbFxcXQ6/XIyspCixYt8H//93+ssLAw6d6ouOEll1zCq6urhdqarH+CwSDy8/Px9ttvM6rfQIAXgZkEHBFoQmpfzjnGjBnD33jjDXG9ZKMhXysRGC1btsRzzz3HaD5uzjMgEImAKZ1Oh127dmH//v2iT0UiEQFYn3zyyXj77bcZFWqU/eZpjMjK7KNFc7NLT9Sg+/viiy+OyJ6htj733HORl5cHQLFIMZvNSQrpowU9OzkrhPz76dmHQiGUl5fj6aef5uXl5Th06BBKS0vhcrmElRWpZVM/mwj91D2RTFqlvo/6v1qthsVigc1mQ05ODnJycuB0OuFwOIRHv/z61M+TCX36fuprMrGc+v3U9znnYq8g/57ISQq9Xp/0vQRUr127Vlwf9Wtat+X5sHfv3gCUeYnqGjW3/8s2JUTsjR07ln/99ddJFi+AAvY5nU589NFHQtFvMpmQkZGBAQMG8O+//15Y+px//vmYPXs2C4fDwuOfvPBJ4U3z/3333cd//vnnI4hEij59+gjPcLomyj5qan6heY1s9cjOzuVy4S9/+QtfvHhxUoFXArKJGCFBBKBY4Jxzzjl8165dQnBy9dVXo7i4WMyzVN8mtQAzWdjJ82I8HkdGRgYmT57M1Go13G43hg8fzr///nsA9VkfV1xxBaZNm8bIooYIXuqH9957Lz98+DCA+rWR+kmbNm3w1FNPCXKvOcK41PYjMvDqq6/ma9asSfoeuo9oNIqWLVti8eLFbPz48fzgwYPYvXs39u3bh9ra2qRMHYvFglNOOQXvv/8+KyoqEntxsowiQjsnJ6dZGQoAxFx1++2387fffltkvxAJQnOMwWDAWWedhYULFzLGmJjnyGqMingTGUf9mZT/VB8FAK655hr+5Zdfij0Qqdopk4Zq7EyZMoUR6Zma/XKiZwHQuHG73ejbty/fsmULDAYDsrOzsXDhQtauXTsASKpLQq+32+1pHCYd6UjHnzb+9ARAU9EYCN9YNkBjmQJNfZ6ssqGfG1JNy+BJOtJxvETqppz6aGrxuF/Td0908KI5QWnlsVgMkUgETqcdkUgM11//F75y5UocOnQIgNIWer1eAJH0O+VApqgge/c+DS+88ALLzc0VNhjKAR5JwCKBxYwx4VdNHrjhcBjkj61Wq5tUWR1tvvtPMj1SP+/666/nhw8fFoAd/T3V61uv16N///5JmQ1Kex2dgD3eQ1ao3XXXXXzdunVJymoCculwtnfvXnTq1IlXVFQgGo1Co9GK/pJIJOBwONCzZ090794d//73U4xUTQRyk91UNBpvVgaAz+dDZqYTtbVuaLVaOBw2XHfdX/j8+QtQW1sDAIKkINCDSJycnBw88cQTjICf8ePH8+nTp8Pr9UKn06FNmzbYuXM3q6pSiq4RsKHX6+vshhRroFNPPRVr165FJBJBRUUF5s6dC6/XxydNmsRqa6sxceJEXlFRgU2bNmHPnj0A6skkoJ6cUKlUuPzyy/HYY48xKv5IY4WAsFAoBPK6J0CIgLg9e/agbdu2GD9+PH/11VfFPQMQIFU0GhWKTpVKhZNOOglAPbBC11RvbXNsWzDGGKqqqvDpp5+KsUNkCako62wk0L59e1FwOxaLwefzgQoTt2/fHu+88w6j+eGJJ57g4XAYbrcby5YtQ3l5OQDFUuWcc85By5YtMXbsWGa1WoX/sKxwj0ajwledSK41a9YIYIbGOgHjffr0QVZWliieSu2n9HGNWFuoiKNCenpx11138Q8++EB8r16vFwUfqT9S+6vVapx++unIzMw8wm+5sZCzNqlNtVotpk6dyknxT8+diJIzzzwTQP38SsQFgTy/ZRHoEz0YY7jsssuEalfut5xz9OvXDy+99BIDIABZoH6v0dR+g0BAuehsSUkJnnzySe5yubB582Z4vV7U1tYKz34AQkFPFnS0f5efGfXPxkLO1jObzbDb7cjMzEReXh5ycnJgs9nw2GOPMRngl4H8htZmug7qu0dTmtN8DyCJJGhszaf5iT5bfl3q+WXcuHFCZS63QWqfzs/Px7PPPiu81onYlomHpoIsURIJJdvt448/TtrDyNkKZ511liAaCFQfMGAAX7lypSA8zjrrLMyYMYMRmUhjkq4RgMhycLvdWLVqFchWTbacicfjKCoqwrPPPsvkcS23RVPrK82BtM5bLBYB/s+fP18omH0+nwDt6Tu6dOmC559/npFl3fnnn883b94sSKDBgwfj5ZdfZvReGgM0L9PnjRkzhu/duzeJ3KD5rmPHjsjPz8f+/fsxYsQI/ssvv8BqtcLr9YIxhltvvRWPPfYY45zD6XSKZ0WEaE1NDX788Udxv/J4VavV6N69u7A9krMAmjpnUxDpW1JSAlJ2U9YskJxZEwwGccopp/DDhw8n2VER0Zibm4suXbrgtddeY5RBQvt3ee7xer1QshWbBshJxEN7t6lTp4o+QeNTFuIMGjQIs2fPZkRekVhHycSsr93l9XrhdDqFRSORmiaTCeFwGLfeeqsA/wns9/l8wsqLMtM6duyINm3aiPmBMjebm8FyvIfP58MjjzzCp0+fjtraWqhUKhQWFmLnzp2MzkfxeFzUaPD7/aLOEc1T6UhHOtLxZ4z/OQKgMUW+DNSnqlSPFrSRaEyBmgqSpf5e3vSnD4TpOJ6juYDv0dT/zckS+DMFgblWqxWMMVxzzbXCoz31ME+gL1APQJx88sno2rUrpk59jVksJvj9ykZe9iPW6/XiZ7lIHB2oZBsiubBnc9u/ocPYsbxXjpUrVx4BIlBmAEUikUCfPn3wyiuvMAIwyX+XseQD9okE/gPKYTIvLw/BYBA///yz8DqWrSRke5GSkhIBHtKB3eFwoGXLlujWrRuef34Ky8zMQDQaEwpR8o4mAogAtuYUKXQ4bCgrqxDFqYcPv5AvX75cHCazsrJRWVkJAELxSJ9/6qmnokOHDqiurkZNTQ1mzJghMlEKCwuxcuVKRjUNZBJDAedDol7G++9PY4MGncf37dsHo9GIbdu24eDBg/jgg+kc4MJ7WwYwCCQhr2SdToeePXviww8/ZAAEQEEEALU5+VyTWlij0cDv9yMajaJt27YYM2YMnzlzplDjEYjSkE1OXl4eHnvsMUafJQPADSmD/5OIxWK4/fbbOdU+ILJDVi2ef/75+Ne//sXIDoz6DoFdnPOkrASdTocXXniBBQIBPProo5zqlBCA/uWXXzICP2WrEcpuIjBC3uPcdNNN3O12i8+n9o9EIsjJycErr7zCgHqATbYHSR3T8Xgc1dUK8TNz5kzxzLt27Yrc3FwsWrRIAO/0mdSXqNihDMIcLWQAn9S31O7U1tFoVNxTdnY2Jk6cyKg4I41nIi7JjiWRSKQBBgAHDx7EggULkvotjd3s7GzMmjWLEcGo1+sFSCtb7BwtXC6XsPA5dOiQqD/i8/nEnCr3AfpumgNkVXLq31OV4DR/WK1WZGVlweFwoEWLFrDb7bj//vtZQUGBGHPAkfshIJnYkK3/6POp38pzVCq5SP1OziSUgX+ah1IBavnzU9uAxiSpqfft2wefz5dEYJPyX26jk046CTk5OUk2JvI82FRQNkIikYDb7cbgwYM5kZEyIUd2ec888wyT69ace+65fOXKlaKdTjnlFCxYsIBRu8sWLTJZQvf16KOP8nXr1glwVN6XAEDnzp1FNhV5qNO81pzsIpo7qG3C4TAuvvhiTlmRlKEm75HoOs8++2yRaXLuuefyLVu2iOfbr18/fPTRR4zmHTlzgLK5qA02bNiQlClCe1aDwYC+ffsiHA7jggsu4Dt27ABjDF6vF1lZWbj22msxefJkRplPgUBAAKkEwj/22GN8y5YtgtAiq5loNAqLxYKnn36a0XfR32g8kPXU0YLaesKECdztdidZ8cnjS6VSoaqqCkB9Rg3nSs2lk08+Gd27d8c///lPRgV6SXkv20IpNac0MJlMgvhtKghMDwQCGDBgAKdrJmGGPF7OPfdcfPLJJ4zA/lQRjDxmqRhwOBwGiRl0Oh2MRiMuvfRSPmvWLHHdwWAQFosFwWBQjF/67E6dOiXNHWQBRZlSJ/oZ7dZbb+Wff/65yADr0aMHvv/+e0Zrh8FgEM/D5/MJsQeN5RP9/tORjnSko7HQNLWBPlZApakJ9Pf+/qY+71hB98YU/7SJJIY/VV3T0PenqmxSPzNV9USb0mOJY30+J3r80f27OZ8vA8WpfeH3jqYU4g1dQ1P33BgJ19DP8j0393N/DYHXVNAYo0MrgCTVLxXhIoAsVbFNB35S/JeWlooDCqnPZDWsYktixKmnnoLTTjsNEydOEnYVPl+96o3ujVRd8uE/FaxIPdTL8Z88X/qeo/2dwmjUCwsZvz8oUvp1Oh0uueRiXlZWJtKhUz2TCaAtLCzEu+++ywhgJmscxY6l/t5Sn3tq3/lPMhaONZpqH7JXKCsrw5YtW5K8XYH6lH/GFD95xhhMJhOcTieys7NRWNgCd999D2vZsiXMZhMSCY5IpN4WgvoqgaGyby9Qr1wnNRQBtLJFTV5eDny+AC677FK+ePFiRKNR8tvFzp07UFlZKWWrJISnfpcuXcT3jBgxgpeWlkKr1aKgoADff/89U4Ch+BFWCXTw12g0CIVCaNeuLS666CIsWbIEGzduBAABZnBeX+yVDs5kmSQrwFu3bo358+czACIbgIDqsrIyYTFSVVWFrKwsABDFdTlXaincc889/N133xXq044dO2L58uWsffv2nLyx6ZlFo1G0b98eTqcz6ZnS9TS21qeGz+eD02lHKBRJUglTBszu3TuxYMECca9y9kEikUB+fj7ee+89RgQQqU1lAJxAJgKiqE/W1tZixowZ4prJLigUqs8cUavVSTYFBB7Ir4nH49i0aVMSIEmh0WjQrVs3WCyWJAspIgFNJhM8Hg+sVqsgF6LRKCoqKvDGG28IUKaoqAgbNmxgQ4YM4fQM6DlT/+rfv79QQ1LWB9UUIPCNgCm5DgmBV7Lis6qqKqnwL1k5WK1W8bkEMhFBK/t7Nyf7itqCXkdtR/ZHsVgsiSikfiXvE5vro91YNDdLgq6VQGvqq2Q34fF4YLPZkvouAFx44YWcgE0CuQiwu/zyy4W9B6mKAWXsU3+WIxwO48CBA5gwYQLft28fqqqqUFZWhkgkIgDPhq6brh040hOfricViDcYDNDpdHA6nbBarcjOzkZ+fr7w6bfb7dDr9Y1mSDa0B6LvlNeuxs4XBPLLa2Xqs059/qnq64bODqlrKNn76PV64Rfv8XiSLGNkxTUB5+RVPnXqVCbPDzKoS7UzGgr5voPBIDQaDc4//3y+ceNGoYqmMUevPfnkk1FcXIxAIACVSoV+/frxH374QYyRoqIizJgxgyk2c7XCSkwOGfzXarWYM2dO0viTs/MyMzMxffp0FggEhD87vU7eoxE4Kxejp/FL6y+NmyFDhvBly5ZBrVYL4oSAa5q7otEoevfujQkTJjCVSoUhQ4bw9evXC/C8W7du+OabbxhdC81Z1FY0RzPGsGvXLuzatStJjU7317VrV4wbN4716NGDb926VezdWrRoga+++op17txZtBkRyvTZdP9kF5TatwBl/WzZsqX4G2XAUrvRdctFXA8dOoTCwkLxGX6/HzabDdu3b08iaFPHbKtWrQS4bbfb0a5dO1gsFvz73/9mFotFEBdE7JGtEn1OKtgvX6ff7xe2PLTWUJ8k8L9fv368qqoKJpNJZOUS4RGPx9GzZ0/MmzePyX2H1PvyGZCug2rdUMYb9eNLLrmEz5kzB4CyBnbq1AmbNm1KsgQkwDs3NxcvvviiKIZMn0F7nl9Th+H3ChonJIQBcIRXP4H1AITFWCQSwdChQ/nq1avFPqB3796YPXu2qOdAz4nmSVqfgPpi3Ok4tjje8aM/Gv/6o9vneO/j/wm+9L8UvxZrS43/uQyA/3bI6hx5Iae/NSdFNPXn5gza5oKm6cGUjj86GlLBNRdg/r1B3oaUf3RIJPDQ4XAIf1DFvsQkXjNmzB18yZIl2LdvHwCGeDwm/GxJuUzfY7fb0b17D0ydOpUVFxfB7w8mpWSnXtcfAWj/2ggGFY/dmhrFt58OYYcOHcLy5cvF9VN7yc+SDpannXYasrKyhEpb9kM90YOUkPfddx/3+XxHEHvk8Tps2DBh/0TvU1K5w6IgZDAYEqAkAYxyhhmF/HMkEoHRqIffH6wjFwwIBsPCAqG21o1QKISLLx7F161bh2g0iqysLAwePBg5OblYunRJkvKentspp5yCZ599lvn9fgwfPpzv3LkTWq0WeXl5WLlyJXM4HHXAztFTzekZP/fcs+zAgRLce++9fMuWzQIUUatVMJvNSCQSOHTokPC7JeCXgMZhw4bB4XCgtrZWeLuGQiHE43Hk5eUJO6CsrCxQIV2Hw4FwOAyLxYKbb76Zf/jhhwIo79ChA1avXs0efvhhHgwGkwoAU1u0bdv2CNI+ldxsKpxOO7xev2RVoYLL5YXdbgNjwKhRozhlIcjPlpSfQ4cORV5enkhtlw/PpGiVa0eEQiHY7XYEg0HceuutvKysTIBe3bt3R35+/hFqYhl0JoCCDtVarRbXX389r6ysFIAlgYDk2d2lSxdYrVb4fD5RM4WeIakXZRWnx+PB2WefLcbLSSedhO+//55VV1dj5cqV4nqpHRhTfJ2ffPJJkWUgg5GhUEiAKNRfqI2ongA9L51Oh0svvZR//fXXSe0pZwrQmCUCgzKwaDzSHrA5CksCy+UMEgKZqE4Ffa782bIC/LcOud8SqQEogJMMlJGvMoH/FJQxcvPNN/Off/5ZfKZso9W7d28888wzjKykZBsfAPB4PKiursbDDz/MS0tLceDAAVRXV4tsCwKNUtcUOftGJknk9V1+PfVhs9kMh8OBnJwcFBYWoqCgAA888ACz2+2iP6WuR0d7ts3d3/zRQc+E1uJYLIa//e1vnDK56DXAkaD9ySefjPz8fCGCIMCbgMajqbvlZ2A2m3HmmWfyLVu2JFmmkDWgz+eDwWBAv379BEnXo0cPYYcTj8eRn5+P2bNns6ysLITDYTidThBwTyp8ClKk33DDDbykpESM50gkkpSlOWDAADE2U/sP9SmyxFGpVHC5XDCbzWLe1Wq1MBgM2Lt3L4qKijB69Gj+7bffAgBatGiBXr16YcGCBaJfUR0dnU6Hk08+GUajEZdffjlftWqVUNW3bdsWixcvZpQxIxM4MshP5OG9997Lyd5IJuISCaXIbZ8+fTgVh49Go2jVqhV+/PHHpH0IPXd6H8XWrVvr9r3JQW3TrVu3Rp8/hd/vF+B/VVWVAP+j0aiw5xs/fjxfv369aOtQKJQ0rvr3748333yTFRYWiow9IjPk+Z2C1o3mgN+xWEzsP4B6K05aG6LRKC699FK+adMmodQH6oU48Xgcbdq0waeffsoCgUCSYMBsNid58gMKGWIymWA0GsVnUDuMGjWKf/nll4JMGTRoEAoLC3Hw4EGReUn7QUDZnxBxIf9efk7HQ9CcTcSJVqsV663P54PD4YDX64XRaITBYMD+/fsxZMgQvm3bNgBKvxw0aBDmzZvHyJaKanYc7/NvOtKRjnQ0Fsc6f6UJgN85Ug8bqeBmUyCArCagaEwVlPrvdKTjRImGQErg6H2d4lhA8KbGi8FgEB6eqbYdip9kPjweBYgij1vGgDvvvJOvXLkClJatbLAT4lAoq3/y8/PRo0cPvPXW2yw3NxuxWAI1NS6hupOVganXfrxs0hsLAm+sViuokJzFYsG1115TZ1vCG/TDpnY+6aST8MYbbzAC1Kj4HSm8T/RQqVQIBALYsGFDg6nrRAw99dRTLDMzEyqVSiiVFRsVjbBDIpWUDEbRob6x8WUymVBeXonc3GxEo3HU1rrhdNrFIeuBB+7nH330kbB7yM3Nw4gRF+LVV6eyM844Q/igA/WF90wmE7p27YpEIoGRI0fydevWIR6Pw2az4YcffmD5+fnw+XzN8pnlnMPl8kClUqFVqxb49NNPWCAQQnV1NYLBIGw2C5xOJy688EJO9TRoTND1DBkyBM8995w4YJONFAF7BBbT6wmsJGBo6NChfOnSpaItu3btiuXLlzODwYBdu3Yl2UJQX7bb7fj3v//NGsowbGw8NxSRSAxWqxlVVTXIysqA368QEIwBQ4ZcwLdt2ybU/3SIp2d7+umnC8sbsn4gYoD6kdFoBBVv9Pv9Qvl4//338yVLlgggNSMjAy+99BIjpbz8XQQMkmqWACYC03/55Rdhw0QgNvXt7t2748knn2TUp2XASr6vmpoaUSi7Z8+ewvKoZ8+e+PLLL5ndbsfll1/OCaCT5xTGGDp06ICTTz5ZECH0fDUajSAdIpGIsDEhEIfmGgLzR4wYwefMmSOun4AeavOtW7fi0Ucf5c888wwjywYae3I2jpzxdbQgBXyqsp6yPciOgsYKERKpSvb/NFIV4akhK8ljsZgYCzQP0XgiUJXu+/Dhw5g/f74A/Ol7otEocnNzMW3aNEbPiTHFdmT8+PF8z5492LdvH8rKyuD1eiE/byA5w03ub/QM6N+pxD6B2Gq1Gg6HA9nZ2XA4HGjbti2sVivGjx/PWrRoIfo0ET3yHEZtL+/zG7IJaWgePl5DthwCFBB6/fr1Ys4ksBRIVktHo1H06tVLzKWynRAFEVYUDZ1j9u/fj4svvphv3rwZbdu2RU5ODtatWyeyLomg7dKli7Cj6dGjB5czjpxOJ0aNGoXi4mLodDr4/f46sltROqd6ntOY/e6778ScLwP7iUQCubm5ePXVVxn1abrm1H0rzYkAhFDE5XLBbrcL9XhRURHuuece/uabb4JzpbjshRdeiB07doisPM65yADIzs7G22+/zf72t7/xxYsXC9I7MzMTI0eOREZGBgCIGjWpaxARnxUVFfjll1/EGJIBUc45Dh48mJRJ17VrV6xcuZLJGRip51MSvKnVajzwwAO8qqrqiHUpGo2iXbt2mDJlSpOTE4HgsVgMWVlZonZLPB6H3W7H9u3bMW3aNCGmIQU4rRukgm/Xrl3SnoosMYmckp+vTLY2J0OWMlxisRiCwSCsVivi8Ti8Xi+GDRvGV69eDTlDkDKI/H4/MjIyMGjQILRp00Zch1y/gtYMsj6z2+3iczweDxwOB2w2G4YNG8bnz58v5tdzzjkHc+bMYVdccQV3u93iekn9bzQa0bNnT5FNIz87GtfHA0DOOYfX64XNZhPZEzTmNRoNHA6HyDLTaDS4+uqr+Zw5c+Dz+aBWq2G32zF8+HC89tprjJ5nRkZGUtZAOtKRjnT8L8aJj6CcINHYQtrUAitvrikaIwTkDc7xrgxORzpSo6l+25AK/teQY/9J0OGDwB46zNFh/9ChUjidTlG09N577+UrV67Exo0bBUAg+wXT9SibUwcGDToPkyY9zVq1agG324s9e/bB4XAIixsCMRo6LDdnjP/R8wAVUnU4bPB4fLBarbjrrjv5qlWr6g5qRxbjJGLEYrGgf//+yMjIgNvths1mQ21trbBWCofDONGnOa1WiwcffJAfPnz4iOwwilatWqF169aIRqPCvoUsKDwe5eBLh10CWAjMlIGNhvqMVqtGRkYGfD7lgKmAi8oh9LLLLuVLly4V4KfVasO1116Dp56ayLZt24Z169YCqPeNJUCgTZs2eOmll9iwYcP48uXLxeH9u+++EwpMAoSac8C2222IxeKorlZUbBaLRaj2dToN9u7dK4oEy+tfJBJBixYt8MUXX7CamhrRbwj0ITCblL40VgOBgDgMDxkyhK9du1Z47Q4bNgyvv/46I+KAVGby9QJAcXEx7Hb7ERZ/Df27qfD7g8jKyoDX668DrPUYNepi/s0334gU+dTIyMjAO++8w8j+hCw5OOdC9UpqWYvFgpqaGqFO9Xq9WLJkCYLBoFBU9urVC507dxbgsnyvpOYnkEf2l960aZModC4DsdFoFPn5+XjnnXeYTqdDdXU1MjMzBcEnZyfQ2N+5cydOO+007vF4oNFo0KVLF8yfP5/l5ORg7969WLFihbBEkL3LDQYD+vTpI65B9qImmyfqAwSwEzhAY44UlnPnzgVjTBQlr6iowLZt2xAKhQTwOXPmTDz++OOwWCzCjiTV27q5BCbVVZD3dkB9YXRZkQzUq2vpv2O1uGxIsCL/Tu4ParU6qUgvAa06nQ4GgwGVlZUwGo2wWCwYNWoUr6ysFIATZVsAwGmnnYZEIoELLriAU1aPy+WCz+cTgCx9Pyl56XNkJatMLNA10XtprjQYDHA6nSgsLBQWPvfddx8rKCiATHZRWxL4Rh7Z9HzpP7JTo2hIHX+iBamQE4kEHn/8cb5r164kuyYK2qeQUvz5558X5CP1d5lwIUKL3itnEtHv7rzzTh6Px3HrrbdiypQpbOTIkZz6lWxr16NHD6jVapx33nl848aNIgMnIyMDl156KSZPniwKSdM8D9RnedDfDAYDTCYTbrvtNr5nzx4BqFK/I5s0ykps6LnKv6P1mOpbmEwmOBwOAIq9m9lsxpYtW/Daa68JEcnw4cMxceJE1qZNG2FnFgqFRAbAkCFDUFNTg1mzZqGmpgYWiwWhUAiXXHIJnn32WUYKZ7KPIdKKLLkou+nhhx/mVL+H5ii5joMMBnfp0gUrV65kdrsd8Xj8iKweWsvpGdbU1GDz5s0AkKR8p/XktNNOazYAS7V2yAqIbN/27NmDQYMGiZoQ1FZyPal27dqJzK9UclLee6QSpnK/OFqQIt3j8cBoNAqrunvvvZcvWLAAO3fuBFBv30TzFZEzZ511Fl5//XVhk0XriGwVRQQ9ETc6nQ4VFRXIyclBKBTC+eefz3/44QdxbyNHjsSMGTNYLBbDDz/8IIQhMiGdkZGBf/zjH41OSsfLfEXCESJc5QxBt9uNWCwGq9UKjUaD8847j69fv16QQUVFRRg6dCgmTZrE9Ho93G439Hp9kl1XOtKRjnScqNEUvtXUPJ4mAH7noE2FfDD5NQqghtKY5ZC9fBsCj471AJiOdPyekdqvmzNG/puqFNp0kwqLimUSgFlYmI9AIIQdO3bhzjvH8FWrVgl/Tnp9anptQUEBTj/9dEyf/gEzGvUIBEKorXXDYDCgdevWwjKCfChlRU6qOvx4DwJ3yssr61Q6KixcuPAIYEa+LwJNevbsiVdffZV5vV5hfUGEyImQ/dCcUKlU2LlzpwCv5fmaVH9du3YVHsJERvn9fgQCAVgstqSDnQyQyRYjjY2vSCRWp6S3IhBQ/n/4cCkuvngUX7t2HeJxRa2cn5+PJUuWsoKCAmg0Klx++WWcnhMBRPTdgwcPxjXXXMNXrlyJWCxG4Cnat2+PUCiEyspKtGzZsg48O3r7KOCLouZzOp0irT6RSNQp2mO48cYbeU1NTVK9HUBZG4cMGSKsFkwmE9xuN5xOpygCGg6HYbPZhPc/FY8EgLPPPpuvXbtWqNGHDRuGDz/8kOl0OrjdblG7QVaGUvt27ty5wbnsPzlYK57yyv3GYjHceONN/KuvvqoDXZhQ4dPzUKlU6NOnD1q0aCHUfmq1Gi6XSxQBJh91IkII+M/KysI111zDd+zYIbKf2rRpI4r0UgaPnHEgW8/QNZCycPz48dzlciUBSkQY9OzZE/n5+YjFYuJAHolEYLVa4ff7RWFOu92Oe+65h3/00UfweJRskPbt22PRokUsKysLtbW1ePrpp3lFRYVQIMvjqLi4GC+++CIjOxPZ+5eumb6L7ikcVmyw7HY7dDodLr/8cr5w4UIB9F588cV44403mM/nQ+fOnTkpotVqNQ4dOoTTTz+dr127llHfiUQiAgCi+29OpAJVwWBQZFPItQUIDCUgjwis3zoaIiJklbhcGJrIAFJbUm2NW2+9la9duzaJpCFFLgB8++236NixI29ofSOAnUBlGexLDbpOsg+yWJRsofz8fBQUFCAjIwMTJ05kVG8k9R7p+6j9yeKECH3yuk9tH5kMO9Ft6gjYpSyUjRs3IhAIiPZqqPYEAPTo0QN2u108J9lmidqnOW3zyiuvsKysLGg0GlRXV2Pt2rXCqosA3aKiIrz00kvsyiuv5MuXLxdga2FhIYYPH44XX3yR0dpJYDIAASTLtl/03FevXn3EGGWMIRQKIS8vD6+99hqT5zQKea8ntweBuhS03owfP56/8cYboq7RkCFD8MYbb7Drr7+eezweqNVqUesgFoshOzsbNpsN/fr142VlZYKcGDJkCF577TUWCoWEYIIIaMoYImU7EcAbNmwQbSivm0SE0rM76aSTsH79esY5F8C/zWZL+ky6N7rP//u//+MlJSUAkERSRiIR5Ofn45VXXmFy4eXGgjKHaB2jtSsUCuHMM8/kZWVlSfMdtTc9m27duol2kNXu9LzpucrkhUwCNOd8LmcN+v1+/PWvf+Xz5s0TpAcVpZa/E1Ay9D7++GOWSCRgsVjg9XpFLQLKgpNtgYhYj8fjyMjIQDgcxjnnnCPAf7VajVGjRmHatGksEongoYceEuSI7ESgVqvRvn17EJkjEx9ytsbxQAJQ+1PGGxHFtbW1om7T9u3bcdFFF/EdO3aIfWG3bt0we/Zslp2dDRpHNB9R26aO3XSkIx3p+DVxrAD8sUZTn58mAP7gkIE7+XcUTXWghhZjGVho6P2/BhhrzvenIx2/dzTWxxt63dF+biojoKnPSw1S9XHOEQgExEGElCh+fxDXXXctX7lyJSjdGYCw1yC1M2MMLVu2RO/ep+G5555jOTk54JwLVbN8KKVNeaqnanPu93gLRT1rE3YtV155Fd+zZw+AeisM+eBJ/y4sLMTUqVMZ/d5qtcLr9cLpdCISiYjDUix2YhOc8Xgc+/btO0KtS881MzMTEyZMYARIkmrVbDbX1UIIirEjgyxU7De1sCqFfFDWarVwuRTrn9tvv4PPmjULpAy0WCzo3r07li5dxghwu+OOv/GtW7eKPioXM8zLy0MsFsMXX3whyK/hw4fj1VdfZbW1tbBYLAL8V/zRj26BotWq4fcHhVcv2dcQOPHgg/fzX375BUB9AT+6z/79++ONN95glZWVyM7OBqD0R1JA0lgOBAIgINnpdGLXrl0477zz+P79+wX4cMMNN2DKlClMIbPKkZWVhbvuuovLAAqtx3q9HhMmTBDF5uh5NpSd1NTwValUdVYvBsTjHA88cD+fNm0aaBqg7yVP7Hg8DofDgVdffZWRUh2AsIkiVTPVeNDr9aiqqhLtc8MNN/AlS5YIb3y9Xo+zzz4bxcXFSWpt2ZpC9j8mWx1SRe7cuVOo7el+4vE4srOzhS0TtQ19pt/vRygUEoDxzTffzD///HO4XC6o1WqcdNJJWL58OaN6DVarFWvWrBHtL3vw11mCJBGpRFoQuETAChVxD4VCcDgcwr/+5ptv5l988YXIqLn88ssxdepUZjKZYDKZcMkll+D1118XinOtVouNGzfi3HPP5XPnzmU2my2pngAVMm4OCRCPx8W6Q+1KBAKpz+X9IPUFei7HapPW0Poir0FU94ayOmRShUByvV6PsrIyhEIhPPzww3z27Nni3ilDg5TJAFBTUyNIGnkvS+QfhVw4ntYRUpVnZGTA4XCgY8eOyMjIEBY+Vqs16Z6I0Kd5g75P3nenzssN2XLKr5fb/EQX4BBBCABlZWVYv349gPq1u6H9mN1ux8SJE0W9DflvshVQ6vtTzzWMMeTl5QlQecyYMby6uhqMMZEdabFYcOaZZ+KGG27gCxYsAGMMwWAQLVq0wKhRo/DCCy+wmpoaAYrTnEKklGz/Q3Y+9913H9+6davoC2Q7Q2tdnz59RIFeGThNnePlDAfKokskEqiurkZ2djbGjRvHP/zwQwFQnn/++Zg+fTrzeDzYvHmzWLvpu6nd586di127doli47169cKcOXMYZVHRM5DblsgOIqzGjBnDN2/eLJTmcv8l4QqgiDCWLFnC5PsA6tdaIiBpnNA+Zu/evWL9pzFAIoGePXvCbrcflbyjIBJaLiz8z3/+k7/99tuora0Vax7Zw8j1ZTIzM/H6668zsrsj0Jf2KkQIydm1crZuatZtQyGTPDU1NUKFTn2JMZZkEUhtccopp+CDDz5gch+U12q6VjlDhgQABoMBhw8fxqBBgzhZjDocDowcORJTpkxhRMrs2rVLWHXJhL1Op0P79u1FfRo5Q60xIeEfFWTzpdfrxTyg0WjEPvOWW27hn332mciMVavVGDFiBD766CPGOYfL5RIZN7Tn1Gg08Pv9wl4vHelIRzpOxDhW/CdNAPzB8WsfYOomOfVw0pCKoTmfl450/NHRlOqkob56tP77W4DjMkjNGIPdbodWq8ahQ6X417+e4F988QXKy8vrDrUaoZhWqZQClowx2Gw2DBgwAO+++x4jdZVer4XHoxSvU4rEMYRCYaEEJ/BfPiQ3ZidytPijCQIF2AsiM9OJAwdKsGjRInFoUw6H9SAY3afFYkGfPn3QsWNHeDwesfmn1zQ0952oUVNTg+rq6iT1GlA/v3fo0AGFhYXCroWAtnA4XGfRYhLgFR38wuGwKIQnK1QbGl9lZWVo2bIQOp0Offueyb///nsASm0Ak8mECy4YipdeeklYOej1evzwww9iTMiHf845WrVqhenTp4sDZ9++ffHqq68yIi7owGkymerqACSr8o5sH8Uv2WxW7iMYDIuDMWNM+FFTkUY62FssFpxyyikCHKDioHa7HT6fT3js0lillPq//vWvfObMmaK4qlqtxo033oiXX36ZAcohkqxyfD5fkv0OtW9hYSHy8vKanMuaQwAAChDh8fgwYcLj/K233oJGo0UoFGzw89VqNU4++WS0bt0aQL2FDNkAAMkFbgHFZ7m6uhputxtz5swRilMqwD116lRGwIjJZBIgPwFclJEhH9ABYMKECcJiQr5vQAFAWrVqJRSuBB6R3YXFYkFtbS1uuukm/vXXXyMYVIiujh07YuXKlSwjI0PYBm3fvh2k/iNih6ydWrVqJYpRU0aVTBTR62SrLKfTCQBwuVy4+OKL+fLlywWwf8UVV+D9999n1I7RaBSvvfYaO3ToEJ83b554XgCwcuVKXHnllXzy5MmsU6dOAkilZ98clSUp0CnLhmw6iKiYOHEiv/nmm5ndbofFYhGZQkQWHGsR4FRAMxWwJVCT+hSBTQ8++CAvKyvDnj17sHfvXgQCAbjdbjGHyRYypBCWiyqnKp9Tr4cU6VSnweFwoLCwEK1atUJBQQEeeughJltK0fOSMzVSn3tDdpsEVstBz53GQ6r6WBb9NES6nkh7bhnAHzduHK+oqEhavxvqX926dUPbtm3Fc6SgNiLQFWi8LeQMDOo3P/30k5gb6BlYrVYcOHAAc+fOFZ+VlZWFiy++GFOmTGG1tbXIyMhAaWmpyDaisUz3R9dJdoVr1qxJAkbpuuPxOAoLC/H6668LSxlaRxq7FxlYjsViCIVCyM7OxoEDB/DBBx+AspYGDx6Mzz77jPn9fjzyyCN806ZN4jPI1iwej6OqqgpVVVWCNOvWrRu+/vprBiCpuD2t+3IGAgHNHo8HP/74Y5Iyn4B6ms91Oh06d+6MlStXMrnAvcViEeQJZblSOxKg7/P5hPWNPMeROnvSpElMJk+aCiI7bTYbbr/9dv7BBx/U2f/pksB/AEn/7tChgwCQ6XnLIonGirD/mj0zZQHdcsstfPbs2aioqBBrmJyVJ4sBMjIy0LdvXxQWFgogmtqUhA1033JtEioWvW3bNvTt25e7XC5otVo4nU4MGjQIb7/9NlOpVPB6vTCbzdi+fXvSPESZaHq9Hvfffz+jbC15Tk2dw46HuYrm12AwiGg0CofDgZKSElx88cX8p59+EuMjKysL1113Hf79738zAILIJ1FA6v4nHelIRzpO5DhWfDdNAPzOIR/2jpVdb+hhp6bgHi3bIB3p+DNFQ2r41DF2rP2fDjkEBHDOsWXLNtxyyy38u+++Fd+bCmbThrt///54+eVXWMeOHeDzBQQA4nJ5hBetbDtCIA8dOFM356kb9OM9LBYLKioqYDYbMXr0Lby6uvqIgo10OCJwoGXLlnj77bcZAbqkLKXDp0qlkmxITuwlrLy8XICbAI5QVbdo0QIABMhKgAyBiSpVvW8v/Z1AMVLKHy1atizEHXeM4XPnzsXBgwdFe2dlZeGyyy7DxImTGJFg0WgUhw8fxvbt28X10f9Jcb1582b4/X4kEkqhxHnz5jGz2ZwEKpP3sWJHc/T2ychwIBAIiYMrHfojkQhisRj27duXZIFEqr5u3brhueeeYwSAUzo9ee2SYowAwpycHAwaNIgvWrQIAIS69IYbbsDkyZMZZZxEIhGhKCsvLxdgkqxmLCgoEMBDc4n4xoJzDoNBh/379ycVO6z/zvo5MB6PQ6/Xo1evXojFYkke2TqdThygY7EYbDYbPB4PEokEHA4HgsEg+vXrx10ulwBd27Zti88//5zpdDrU1tbCaDRCp9OJonw0PmUAlGwd4vE4amtrRfFo6isEunbt2lUA20QaUGaPzWYDYwyjRo3i3377rfjsrl27Ys6cOYxsEgjQ/7//+z9OhTAJZKH26dChAzIyMpBIJARoRH2QLBAIqJFV6CUlJbj88sv5Tz/9hEQiAavViiuvvBKvv/46IzsfUvYnEgl8+OGHrF+/fnzjxo1CbRuPx7FgwQKoVCr+8ccfM7PZLAqZ05hpCqAPBoNCZbtr1y5MmDCBl5aWCpDr7bffZk6nE5mZmQLkIpDzt4iG9qsykF1aWgqtVouKigr885//5Dt27EBJSQncbvcRfv0EEsrWKUQikcUD1UslyPQAAQAASURBVDag7A2ae4xGI0wmE8xms7DxycrKQnZ2NsaMGcOysrKEfQaBi/I6Q99Fz59+L2cQNDRGUzMAgCNtj2RQkUJWujcUxwOw1pzQaDTC9otAaWqn1L5Lfb5jx45inaJ5n94jZ0/ImUGpIb/GZrPhuuuu46WlpQAg1ku1Wo3S0lKUlpaKvmU2mzFs2DBMmTKFxeNKAeBgMCjAf5nQIECcgHDOOdxuNzZu3Cj6KPUd6getW7dGTk4OAIU4lec2+gx5zqd5xWw2gzLRDhw4gO7du/OamhoAQN++ffHRRx+xWCwGs9mMNWvWJGVVEZhMxAkRCR06dMCKFSsYPQd6LdV7kbODaN6mNtuyZYuYL+RxSq9v3bo1VqxYwXQ6nfg8qiVDWXNE/qXu5zwej6j7QiQhZTEVFhaibdu2R9i0NRb0nG02G2666Sb+ySefwOfzQaVSoWPHjggGg9i5c6cgaiiLLB6PixoNVHuCatoQuUN78VT7I3ksNzVO1Wo1Bg0axL///nsxJ6daItJ8RnuXTp06YcqUKUylUsFsNou2pGs3GAzCwkmr1Ypsl6KiIlxxxRV87ty5gsg0Go24/PLL8eKLLzKPxwOLxQKTyYTdu3fj4MGDSWcGmutycnJEUWR67nSvqb/7o0POWiRLuRtvvJF/8803KCkpEWRLx44dMXfuXFZcXCz2yiQKof2wbD1GBHNTFlTpSEc60vFnjd8dPWlOkb8TORoCGxs7UKT+/FsAlA19ptymqSngqa8nJZ/8/oauL5XIoN/JG/iGwI7mPl96XWoK9m8ZjR3wfk38t/tral9KJXpOdBV0U+3fGJjfENnVUKSqqlO/UwYgSOEs25pQyi0dDK6++ir+zTffgAAnUv0TuEBAdseOHTFw4Nl49tlnmaLKihyhCJKvRR5Hsjdp6rhobrs1dP8NxbHOPwTOyQceGegJh8PIy8vF9u07sWrVqqRrUr6bIRKJQqVS16mpTDj//MGwWGx1QI4aGg2BLYBara1rF+XfMgF6tPm1of7z32if1MNx6u81Go0gNeggKqv2srOzhYqbFLb077KyMthsDlGIjkgj+bqVLAADAoGgAEyVw5QRoVAEo0aN4gsXLkQgEKh7hhH07t0b33zzDVOuzQ+LxVKnoNLg3nvv4eFwSBxqGVPVAcAcFosVLpcbjDHY7Q5cfvkVMBrNiMc5GFOeYTzOYTSa64B/1qQCPpFQ7sVms4l2iEajsFhMuOMOxRKC7pfGMYHgpIa02+0IhUIIBALIzs4G51wcuvV6I/bs2YOhQy/gu3fvhk6nRzyeQGZmFn78cQ3Ly8tDOByFwWBCKBSB2WytuyagpqZWKJ7pGjjnaNeuXdIzaExJRwCNXq9FNBoXryNAXFGqaVBSchjnnXcuLy8vF37m9LpEor5gIwDYbDY89thjjAAOtVqNmpoaWK1WmM1myEp4tVoNk8mCQCCEc845lx8+XAqLxSLA8S++mM1sNgei0TgsFpt4fiaTBbFYQpBvZCcUjUaFv7TRaMThw4eFSlgeRwUFBRg/fjxTgEE14nEOvz9YV0zdgsOHD2PYsKF869atdXNxHCef3BULFnzNCgvz4fH4EI9zqNXKnFNSUiK+g8Y5tWG3bt0EIK9SqZKUmACSCl+Sonjv3r244IIL+I4dO8A5R1FREc4//3yRCUGZJKTaJLDms88+Y5dccgn/+eefRT8EgHnz5uHMM8/k69atYwaDQdgSkFKTVKAESBDQ5nK5cO+99/J9+/Zh7969giwEgPz8fFxyySU46aSTpLFSD2LRz7SukN0RAXZUDJWAOALg3W43nnvuOR4IBBCNRuH1eoVvcjAYRDAYRCAQQCAQEHUNvF6vsNKRiUygntyVPdtlVTVdrzz/ESmXlZWF4uJi5OTkoGXLlvjHP/7BqCaD0hePLEIL1O95KStFftby6ygT4GjR0PyfuqdoTEVMZO6v/dym5o2mPufXxtEUwORPvnPnTuzdu1fsjVLfT8B027Zt8cILLwiFvKy0TVX9EzEQCASSinvS3EaqfI/Hgx9++EEQqjS+OedifqF557TTTsO7777LUj3vab6T25P6Bu1dDAYDbrvtNu71epPmVPk9p556qrg2Igdk0Jhs8ghkpH5ApHokEsFZZ53FXS4XAKB79+4gm7BYLIbt27dj+/btAsAnQpX2VkajUaigFy5cyMh7nq6RBCtyvQUaD7S3ffjhh7lsSyMX0o7FYsjJycHixYsZFbSlz6N2pOtoqL8CwGOPPcYp+5XWWqrL0LFjxyTiQW47AulVKpUg7EnQcNVVV/E5c+bA7/dDr9ejS5cuWLt2LTvttNM43SddAz23goICQfBotVpBZNC8TP2T1uFUQovmSlpTIpGIIJni8TjGjRvHv/76a2zdulVkXJjNZpx99tlYs2YNyH+fnh31RbK2pM80mUxClU59ltYXsoyLx+MYPnw4X7RokbDEcTqdWLlyJWvTpg38fj9sNpuY8x999FFOWYz0DEmU0LVrV0ESp57/fw358VuEvEbJohK63lgsJiz9qA2WLVuWZN937rnn4t1332UklpGJL9oXy/cm/+1/PY71GR8vRFFjcbxf3+8dJzq+erTr/y2e7e+9vzrW9v81du7/yff/4fLJ//UB+ntHqm1IaodoSOHV0OsbOpSkvif19+lnm47jMWQwmEAhlUpVVyyTobbWLXzBFSWJFvfeex+fM2cOdu/eDZVKneR/SsB+JBJBdnY2Bg4ciPfee58ZjXpEIslqzNQx9WdYoGXVOgFtsoJPq9Xixhv/ygm8kt8L1IMliUQCPXr0wIQJT7BU+6PGoimStan4b8xR1N9Snzt9NymVUsk9tVqNMWPGMDoYEgDidruhUqmQl5cHzoFQKCyU73SYovcrHvIKwOnxeGA0GmE2GzF27L18xYoVWLdubRIZdckllwg1Iin9iDQghT8AcS0KgK2kYJPaKhKJoF+/fnjmmcnH3Liydy31LWrH6upqoRSWVXwtW7bEww8/zBTyw4jq6mpYLBZkZ2fD7/cnqQNvvvkWPn369Drw1wav14PWrVvjl182stQCn/LzDIcjwmZJXkOpaK1arUYoFDqqB7vSdjqUlio1BTQaFYLBsFDDc64orM8/f5Ao5mez2XDDDTfg3XffFSQkATScc+Tl5Ym6BZxzBINBZGRkiOdoNpvhdrsRDAaFBcJ5553LN23aBKPRKACWESNGoFWrVk0+H0qtl8cRKSsJPKaDvE6nQywWQ15eHnJzcxEKheD1KgRTZqYTXq8fNTU16N+/H6fsikgkgtNPPx1z585jVqsVVVWKn3cwGITZrFgmkM2QvP/gnCMrKwsPPfQQI8An1fqBSF4iLAwGA0aPHs0//vhjAbR37twZn3/+OevQoQOo0LRsgxEOh4WfdXFxMWbNmsUuv/xyvm7dOgF4m0wmbNq0CW3atOHffvsta9WqlQAcKSuB1qFEIoFx48bx9evXY+fOnfB6vaJALueKmnbAgAF47733BPjXVFDhTpqLSVGs1WpRUlKCRx55hO/YsQNlZWXw+/3CQowINwqalxoSZ8h2KfJcR2SLbG0nk+CJREIQBCeddBJatmyJjIwM/OMf/2Dt27dPAugJpEsF/tPxn4cMYjdEotOYGTt2LKc5iV5LXupy9lPnzp3FeiJbxBwtUovwpnqSjx8/npeWlop+Q2sd9QW9Xo9QKIRTTz0Vs2bNYrQPoXtrKmjs+f1+7Ny5s0EBBuccbdq0wWOPPcbkbFAax7LSn/o1EQUEVDLGcNJJJ/GDBw/CaDSiRYsWWLBgAbNarWLvNHr0aFE0ndqA2ler1Qpy9rrrrhPZgU21LY1BygIj8oFqCMhWMGq1GsuWLWPZ2dnC6u1o0VD71tbWJpGRlOWq1WrRsmVL8QzpuQP1RW+NRqPIGiMS+8ILL+TffPONAIJ79uyJb7/9llEmBD1reV5SqVS48847GWWPUj8mFTxZcdKzJAEBZRYS8UCZf9Q3zWYzKioqcO211/LvvvsOoVBIqPfbtGmDkSNH4uGHH2YtW7bkAJKszqLRKHr06IGioiLx3QCEpSNltVKtK7putVqNs846i3/33Xcii7KgoAArV65kDodDXBf101AohAMHDhwxT9O95+fni/3UHx2kxKc1kMhwILkAdFlZGQYNGsR37Nghsoo457j66qvx+OOPC/CfziMUJ/r5Kh3pSEc6fq/441eAdPyukao8PRpg1pRCviGyoCEFurxpbq7COx3p+L0jFawDlA2o1+sFUJ/CrlKpkJWVBb1ei1gsgYsvvoQvWrRI2G/E47Ej7FUMBgP69OmDDz/8iBUU5MHt9gqQCEhWqP8ZgH8K2nDTYZfahX622624/fY7uJzW3lCQLcm7777HjEajUNL92gPoiTafyKB9KkFAam8Ca8nbPi8vDzU1NYhEIgiFlMM9HVgTiYQApmX1k81mAQB4vX5cffVVomg1fW5BQQGGDx+O1157jdXW1ibZCRBA9/e//10UcKZrj8cTggygw3bnzp3xxRdfMpWKIRY7Ng9yagcCfep/X2/BQ2AMHeI7deoEp9MJl8sllHKhUAh+vx+xWAx2ux21tbUYOXIkX7XqW6GC9no9OPvss7FkyWIGAC6XklIvBykMfT6fmA/k8Wyz2fDQQw8xoHkFQCORGPLycsEYEA4rQIDBoIdWq8aOHbtw9tkDOdmsWCwWrFixkhUUFOCLL77ktbW1oo2IAGjdunUSyGuxWIRXfiQSgcfjEYC1VqvF2Wefw7///vskVe3AgQPx/vvvsWi06WdHGVJyLQgCN7xer+i/cv9o3769KGCbnZ0pCkHfc8/dfMaMGcImR6fToVevXvjyy9ksM1Px5bdarfD5fLDZLAgGwwiHg3C73eI5UHsQ0OFwOBAKhYS6Xi6+S8APAVEjRozg8+bNE5kkPXr0wKJFixhlwBCxQ2Qn/Z++2+v1ori4GCtWrGCXXnopX7x4MTQajbB2KCkpwWmnncavvvpqPPzwwywjI6OukLcfXq8Xf/3rX/l3330Hsgah0Gq16NSpEwYOHIjnnnuOyWOiqSALFVLTkhp3y5YtuOGGG/j27dsRDAYb9dmnYpSkGE0lBID6dTP1M+jvcr0JOUuA+kNubi6uu+46PP3006JgK/1dtmGhAshEBKSCPen47UJWfpeWlmLdunVJinhSjcvrrcFgwL///W9GWVHNARjlOgHye+Tv/+WXXwQhR5kk1Ieob+Xn5+Pjjz9mNpsNVDi9MY93OeS6BESEySFnAvTo0QPZ2dmCtCJinuYWs9mMUCiEUCgEq9UqwE26n5NOOonv27cPgGKxs2jRIpabmyvutba2FvT91O9J/U0kOwAMGDAAL7zwgvBwbypoX8a5kjmYm5sLq9UKr9crwGv6+4gRI9CuXTtBNjQXJKZ2TiQSKCsrA3CkaCw7OxtPP/00S907y/UAyNNfpVKhuroaZ5xxBv/ll1/EHNC3b18sWbKEARDrjJwNknrflB0pX6e89wcgQH+yipGzVqxWq+iXiUQCf/3rX/mqVauwd+/epL41cOBALFiwgDHGcNFFF3F5Pyz38Z49e8JsNot+R99FazZ5+hMQPm7cOD5t2jRUVFSIvtinTx9MmzaNFRYWAqgvbktrusvlAvUzCrqO7OxsTJo0iaWKUv6oIOEUoIxlyq5gTLEKdLlceOKJJ/jrr78Or9crrC9zcnJw9dVX44knnhAEfygUSiLS5eyXdKQjHek43qIpvOL3np/Ts+OfPBpTHx8tGuuUqame8uv+6I1EOtLRnGhIuQgoB0sCsGw2CyKRGMaNG89nz54tCpoBSp+nQxMpptq1a4eBAwfi1VdfYYkE4PMFYLNZkUhw4dXZkLruzzRmCBQgAJqKUHo8PqxYsaIuLb7eLolCBpsGDhyIoqLW8Hh8DfoqHy0aIwL+6DZu6F7lvzkcDqF6I4UWHVIpRTwcDgsPbPIEJ7UYFUQkCw+NRgOz2SxAMr1eC6/XD6/Xj9GjR/MVK5ajqqoK8XhCACWnnXYaFi5cyCjt3Ol0Jnk3k43O5s2bBVhCoKDyTOvtV8xmM2bPnsPUaga325tUJPE/CWWMqY7w02cMcLs94lAsH+qLi4uhUqlgtVoRjUZRVVUFh8OBRCIBs9mMO+64g8+cORNVVVVQLKgiMBgMuOKKK/Duu++waDQOn88Hp9OOVBCcgHK/3y8IAPkwnZmZiezsbADNS99UwLK4IB4VKwxgzJg7+ccffwyv1wvOFUuAq666CkVFRQgEAqiqqqz7fJ4EzOXn5wOAAI9isRgyMzOFBzMdiEOhEIYMGcKXLVsGtVoDlUpph169emHevPksEokJ9X5T10/gPoFh9N1kOQAgCbgdP348IzWqVquH2+3GqFEX8Z9++km83m63o3fv3pg/fwHTaNQIhSIIBALIyHBAr9eiqqoGDocDVVUVAtAnIJqA66ysLHGdBoNBgGl0T0SUVVVV4ZJLLuFr1qwRqv5zzjkHs2bNYg6HA+Xl5XA4HKIgKY0xypIhCyCr1QoCsD///HN2/fXX808++UT0DSo2/dZbb2Hfvn389ddfZxMmTOA//vgjNm/eDK/XK4r+Ug2N0047De+//z5zOBwCqKOC1s3x0aa/k81EIpHAtddey+fNmwePx5M0bmQSiPqvbBUir2HymKPPpWcAIGkuIwBMJqroe5xOpwD/Q6EQMjIyRNFO6n+yQl327W+uj3g6Go9U8pn+TQC0RqPB+PHjeWVlZdKaSmNOttNq3749ioqKxPrVHAW+XAdALnhNz/zAgQPYuHGjeD0BxzTH0HWPHDkSHTp0EOsjjfXmWNDS+rVr1y4xroicIksui8WC559/nlFfpswnKkBP92kwGAQhWlVVhaysLPh8PvTp04fv3r0bANClSxd8+eWXrLCwED6fT4DU48aN4+Xl5WKcEdEA1BPPPXr0wIwZMxjNOU3tb2QRCgHFr7zyCquqquJr165FVVWVUNoPHDgQs2bNYjJ53NTn07OWAXhlXa23gqSswBYtWoj9AK0VBNJzzkUWAADccMMNfM6cOSLrCgCGDh2KOXPmsHg8LrKi8vPzRVaiLDwjspD6DO0nDQaDyHqg/TuB/lQfh8BysrYDgDFjxvBvv/0WGzduTCIk27Vrh6FDh+Lpp59mwWAQkUgEe/bsSapLRM+vTZs2ePrpp4U9ll6vh9/vF3OdyWQSbWI2m3H55ZfzL774QhAJiUQCZ511FubOncvsdntS/QWgPtu2oqICNTU1DWZktWrVSog6mpsh83sG9TMKOcsnFArhsssu44sWLRLPKRQK4YwzzsCSJUsYFcKmoCwCAOL5/NH7/3SkIx3p+L3iWOe3NAHwJ4+mVP2pqlN5syD/jl6bCmSm+uqlqv7TC3A6jucgQEitVguQMRyO4qabbuRz5swRIJ/BYEQopBSfo2JfhYWFOP/88/H6628wtZqhtLQcGo0GWVmZCIXCwuMZaNgW64/efP8WQcooufgnYwxWqwWJBMeVV17Bt2/fXvfqI+cCmi9atWqFL7/8gvl8AXEYo8/7M0dGRgZat26N0tLSI0gLyqRwOp0iLd5oNAplNRWIM5lMIr2fyAICZRljuPXW0fzHH38EARAEphUUFGDUqIswadIkRgVYNRqNKJTr8XhEynkgEMCWLVuOIJHp+ZB9zKWXXoqioiL4fIFjBv/ltgCSAchoNI5oNNKgT/LDDz/MvF4vQqEQHA6HKNq4a9cuXHnllfznn38Wn6lWa1BYWID58xew4uJiVFfXwmKxwOm0w+v1C3An9b6V7ItQ0hqpVqsF+E+WBw3dSyrYRmCGQuiYcPXV1/CPPvpIfG9hYSGGDx+OKVOeZ5QlQB7yKlXyHEK2MHJfcrvdQlmn1+tRXl6OCy64gK9fvx4ajRacC4Uqvv9+NVOrGUKhqACyjhYETMi1UgjMaNGiBX766SfQQZ3aasKECXzGjBksGo3iL3+5ji9atAg1NTXi+oxGI4YNG4a33nqbabVqBAIKoagAJLG62gUmaDQqMVcAyUB0JBKBUr8hLAr2AvXAgmL3psbNN9/M58yZg9raWqHgHTlyJN59911ms9ngcrmQk5OTRHIQ0UDAJalztVotbDabIEBnzJjBMjIy+IwZM1BbWyuAHo/Hg/nz56Nt27Y8Ho8LMpm+o6ioCGeeeSZef/11RkVrScFPAJVWq0VNTY0oSN1Y6PV6VFVVwWKxwGAw4Oqrr+azZs0SQDxdU2PzrOxtLqtnZRsYuY/I4DA9J4/HI569/Fq1Wo0zzzwTDzzwAKNnIwOWBoMhiRCl722Osjsdvy5k0lkmXEKhEDZs2CBeQ/Os/Bypj/Tu3RtGozHJN72paEj9T57+ADBu3DjhZU5/A4g4jSGRSODCCy/Eiy++yDhXLLJcLpco9tycfkKZMVu3bj3ib3SfZE9FayMB1dReVEOKfPLJZu7QoUMYPHgwp7Wzbdu2mDVrFisuLhbEgtvtFnZcqep0IjqIHKOi7NQ+TQWNJRnstdls+OCDD9iTTz7JKyoqRFYcedNTPYXmEtjy3pay4xpqw7Zt2wrLNWonxcrNLEjbffv24aqrruKrV69OIgcuueQSfPLJJ4xU3qR479SpE5YvXw6g3muf2u+ll17iU6ZMYZxzofAH6okJylyVVeLyOsYYw5gxY/iGDRvw3XffAYCo2WK32zFkyBC88847Aogmu8EDBw4cAbwnEgmccsopMJlMSaQq7ZF0Oh08Hg+sVisOHTqE4cOH8w0bNgiyCQAuu+wyfPLJJywYDCbNx6n7rEmTJnHKkpHJJHoGRHIdD3MorT3k8R8MBmGxWDB+/Hj+6aef4uDBgwDq557BgwdjxowZjOzzZJvG+r1hvWVWOtKRjnT8XvF7YzjNIeCPFk1d3x9OAPzRKRD/S9GczpoKTjT2msYUt79WeZt+vun4b0Zqf6ODp9vthsViQVVVlVCjUigH4aDo2yaTCWeffTbee+99ZrVa4XK5YDQakZ2dDa/Xi0BA8aduSGHzZ+vvBErJBRxJxfzggw/wZcuWAahP7wbqi3RRWxgMBgwaNAgABAhmtZoRCISanQWQSrA0t51/7/VHnitTr41UcyeffDJWr16ddFAjpe9tt93GFyxYwDQaDSoqKlBYWCjUcwCEypoOuCaTAW63F+PG3cf37NmDDRt+Rk1NtcgaIABjwIAB+OSTmYzzeJ2yWrHdqK2thdPpFB694XAYNpsNY8YoBXdTwbhEQvm33+9Hjx498O6777DaWrdI4z9Wha6Syp0QSmC1WmlDsiUiRSgB6AaDAXa7HYAyTv1+PzweD0aMGME3btwo7E60Wi30ej06d+6CuXPnsYKCPIRCEWRmOhGLJZBIJNtQ0POSSXLZ3ojahOqG0PNoisCivh4KKQUGzz33PL5kyRKo1crWzG63Y8mSpaxt27YIBsMwGvXIz89HVlYWDh48mPQsAODGG29k1B4ESlN7aDQa3HrrrXzJkiU4fPgwAIjr7NixI1auXMUUkFspwKjMYUd/PgR+0XXIRQWLi4uFFRMAoaadP38+ioqKuNvtRm1t/d84V2wili1bzoqLixCPc3g8PhiNxjpbDaWdPB4PsrIyEA5Hxb3JY4dAytzcXKjVapHR4na74XA4oNfrceedd/LFixdj27ZtQv0OADfddBNee+01FgwGhe0PY0rdDVmtSIQB51wQHErWiFPYZwWDQUycOJHdf//9OOecc3hpaaloN6qpQdeuVqvRoUMHnH766XjrrbcYoGQoxGKxumdhTireC+AIe6rGgvrk7t27sWTJEjHHktpafpakGpVrajQU8jxlMplgt9uRmZmJrKwsOBwOZGZmYuzYsWzMmDF81apVYp1N9W+n4sGHDh1CdnY2dDqdUE4T2EfXQgpeArUoSykdxxbyvCYraDnneOihh7hS9yi5mDf9nZ6lw+HAlClTWGoB6qbWTwLpZJsV+gy/3481a9YIBbkMZtJ836tXL8yePZtRoW/KqiPv9uaESqXCwYMHBdhIY0K2qunevTsAJFmtkCe91+uFxWKBRqOBy+WC3W6HVqvF9u3bceGFF3LKIG3Xrh3mz5/P2rRpA6C+FgkVuN+7d+8Rdlo0ZzLGMGzYMLRq1Uqox4PBYJNEgLwvImsUlUqFzMxMTJ6s1OihNZ/GYigUgtPpbHbbERlKY5rmBsrUoXspLCxM+lmn0wngNxKJ4Prrr+dfffUVvF6vyF6rU8LjtddeE1kPAISt3ZNPPslmzZrFaT2j+SIUCmHNmjUimygajcLv94s+QgA/ZTnR3kGr1eLw4cO45ZZb+Nq1a0EZGSaTSdgInnXWWZg5cybLy8sT7eDz+WAwGHDffffx1KxfIrSeeuopRtdI6x3nXBTwtdlsuOSSS/j8+fMRCoUEuV1QUIArrrgCzz77LCOBBxWSJysqmZAmMYmcnUF9qUWLFoJ0SRU1/BFB2Q3UBy0WCy644AL+9ddfJ5FhWVlZuOKKK/D0008z2TaJ7oHEW/Q3GsPp9SEd6UjHnzWOlYBIz45/8khV8AONq5CbA/g3pshM/bzU/zcWf3aFbzqOn2iI3PL5fNDpdMjKysDo0bfymTNnwuVyCbCUDp9qtQacJ9CuXTtceOGFeOaZp5nfHxQAUzgcRiKRgNNph88XQHl5JaxWa6PZNvL/T+QgkkMGjvR6HQ4fLsPKlSvhcrnqlPzK62nDrhRSVoDYnj174s0332Dl5ZXIzc1GdXUtAHOzU/iPFsd7G4fDYUycOJEtXryY79+/X/yernvt2rW44447+NSpU1nLli3r2lcveSUDdIvjx9/PN2/egi1bNqOk5JBoX/L7DQQC6NmzJwYMGIDJk59hSgFWE4xGI0pLS2G1WuF0OkE1AOT+u3nz5iM8x5Xnrjwfo9GIZcuWs+rqWmRmOhEKRYRa+VhCBoUUkEgnDo2kzCayBFAOfnfeeSd/6KGHWDgcxp133slXrVolippSUT2VSoVhw4Zh1qxZzO8Pwu9XSLuqqhpkZWXA6/ULn3kCC2RCQPmM5Kw5AsIoq6ipQtakiPb7g6iqqsKwYUP55s2bhe96VlYWVq/+gRUUFAiVeDSqgVarFAFUMhnq7TZUKhVeffVV/vzzzzPyFFapVHC5XAgGgxg9ejRfunSpAEIUmx4d2rVrhx9++JHp9VokEkBVVQ2yszPh8wWSCjU2FHR/ctFNAlkmTJjAdu7cyRcvXgy/3y/sDSKRCPbt2wetVguj0ShUgAMGDMDnn3/BnE47IhHldzabBeXllXWAcKSuXTKEvZRKpULLli2xefNmaW5R+hxlsLhcLpjNZmRkZODee+/lq1atwtatW+Hz+QTJ1aFDB8yePVuAc2STQCCb3W5HJBKBz+eD2WyG0+kUqnwCAA0GA/x+P6LRKEwmkwDt4/E42rVrh3379glbLQIPIxEli6VTp05YsmQJy8rKQlVVFQwGgwD4lay0sLCGACDsgpoKAiupPgGNI7pv+vx6Uqt+jKfaAqlUKthsNuTm5or6Ci1atMCYMWNYXl4eLBZLknWbz+fDoUOHBBhD40De8y1duhR5eXncZrPBarUiIyMD3bp1w6RJk1hBQUHSvVCGAKm7j3VuSUeyJ7q8VpIdytq1a0X2DoCk/iHPbV27dk2yjJE/99eErMh+8MEH+b59+5Keswwut2zZErNmzWKAkuni8/lgMpnAOReFW5vbR/71r39xWZlN9wAABQUFmDRpEqPslNQMaQIiAYjsuzFjxvBPPvkEVVVVMJlMcDqdWL58OTMajUkFYD0ejwByyQawfs+pFllHp59+Ot5//31G3vCc86RraSyUmjIKSSBnFUSjUVGAnPavNNcbDAYx3zSnxkbqmZBAWJkgUqlUuOGGGxhl8ACAy+WC1WrFfffdx5ctW4ZffvlF2CFFIhHk5uZi2bJlrGPHjgDqi0XHYjHhzW8ymdCtWzfIBADNWWvXrsXf/vY3/tRTTzGn03nEWkbzHRWRvv322/mmTZuwc+dO1NbWCmU6kbBFRUUYOnQoXnjhBWH3Q9dAZFNNTY3IUqJMMADIy8tD69atASST5Iwx2Gw23Hffffyzzz7D/v37RfvE43F07twZy5YtY3a7XYxDn88Hh8Mhzif0OdSvKisrRVvINkRmsxkPPfQQo8K6x0P9FFp7nE4nbr31Vr548WLs3bs3qW5Fly5dsHjxYibXhqE1Vt5z0HpF9k/HA8GRjnSkIx2Nxe+t8G8q0gTA/0CkbtBSf27q9am/k1/XEAnQ2OemIx3HQ8h9OS8vBzU1LgwYMJCvWLECgHJQojRmAmgMBj3OO+88fPjhR0zxTo+JlFUCBOPxOLxeRXGUnZ2dVDgx9UD8ZxkfpECS1TgA8K9/PcF/+OEHATTJykAl6g8ln346iwWD4br06mCdatgjPNyPFo0p/4+n9pVBSSBZrZxIJJCRkYG+ffviwIEDSRYLjDFUV1dj+vTp2L17N+/SpQs0Gg1uuOEG9tZbb3GXy4Xq6hocPnwYBw8ehMfjEQUSFQDfBp/PC6/Xi9atW2Pw4MF46aWXmQLuJJL8xLOyshCLxeD3+2GxWOqAaQVsqKmpEUXl6PoI2FSpFOLnsssug9VqRjCogdvthd1uFcVdjyW0WjUiEWUcUZE8xbKLITc3V5BPBLr7fD58/vnnmDNnDq+urobf70/6eyKRQHFxMWbNmsVOPvlkeL1+YUdQU+MSynKLxYxgMDmNXu5bBDTQz/Q3Ahmo39OhNHX9pJ+tVjPuuutuPmvWpygtLRX1RYqLi7Fq1bcsJycHXq/SnvE42Y8Z8NZbb7N27Yp5MBgQ/YlzDp/Ph3A4DJPJBLVajQMHDuCee+7hq1evFmpGuiaVSoWzzjoLX321gIXDUXg8SnZIZmYGIpGm/f8p6PNovmOMCdX6l19+yS6++GL+/fffo7y8XIDJ9ZZNDBkZGRg2bDjeeOMNplj0KIpXxSM5iNzcbIRC9Wpvr9cPKhTOGEPHjh2xadMmoTCndt++fTsCgQD8fj/Gjh3LN2zYgB07diTVb+Gc4/TTT8fMmTNZixYtRBFPAAJopvlLo9EIux+1Wi2AtdQCuKQGjsVieOCBB/j8+fOxbds28TvqN6Ts5ZyjpKQEDz30EH/ttdeY3W4XQD0pm0n1GQwGYbfbhXq2qQwbJXtNqeHh9XpxzjnnYM6cOfD7/Ul9MXVt0mq1dcR4FpxOJwoLC1FYWIgHH3yQZWVlQa/XC7Cf7icUCtVltCiE48MPP8x37NghgCYC/rVaLTp27IjWrVtjzZo1KC8vh8/ng8fjwaFDh7Bp0yZ8+umnvLi4GF26dEGLFi0wadIkptFo0qD/7xSp4H8gEEA4HMaGDRsEkCjbrNF7EokEDAYDTj31VDEuOOdJIPDRgggqufgvZbocPHhQfCcJDAAIJfuFF14oFPEqlUrUxYlGo4LAa45VTigUQllZWRKgL2c1tWnTBk6nUxQiJksumqupNg/nih3LlVdeyefNmwefzye8yxcvXswMBgMcDocoRE4/A4otT6dOnVBaWirmEgLOu3Tpgq+++ooB9VltVIOkKRCX7p8KFRP5SPMH/Y2AbtkC59dmX9LryZ6QiF3qWy+99BJ/+eWXGWU5PPHEE3z16tXYsGGDqG9Ce4tevXphyZIlTG5jIkZkgFylUmHq1KmsZ8+e3O12H1Fc+J133sGePXt4165dMXr0aMY5x9tvv809Hg88Hg/cbjdKSkqwf/9+UW8HqM+GCofDyMzMRP/+/TFt2jRG7U6WenQtVK+B1iWqo0BrVH5+vpj/8f/sfXecXFXZ//dM7zPbsklIISRk00gCCT2EJiKioAgiKvqC+tIEQlH0FRXLjxcMJiGESICgvBIRpIpILyJVagoppPdstsxOL3dmzu+Pu8/ZMzd3ymZ2dnaT+/189rO7c+/ce+65p36f5/k+6Im827RpE7797W/zDz/8UKxRUqkUvF4vTj/9dDzyyCOMoiFIfs5ms4l1GoA8400qlUIoFNon+pjyC7ndbpjNZsRisT6RaKwUFH1x4YUX8tdee020A2qHZ599Nh566CHmcDjyDC4UQUFtjmSd5KhTQwLIgAEDBzIqVTBg7e2dZV+sLwpU6fla1NoDVCaeZEJAJg30CMByy1drIqvS+5daoGqJO7kegR7CUM97u9C1CkU4DEYUiqigOqh2ErxCBiD6vNL7a3NIaK9f6P7lEr1OpwNtbe1wu92wWCwIh8PCg8pqtWLjxo0499xz+IYNG/I2MuRRm8vlMGHCBJx22mm4++5FLJ3O5Omuy0nw9Mqjbc9y2QsZBfqyzfZ1+9e+Bwqhpo0uYww7duzAzJkzeDAYFOH62WwWTqdTbKKp7v7rv/4Lv//9PFZfH0A4HBXXSKVUg0ApA4C2bNoxuFC5+8pQUI6HUaG2rHqgqTrAXV1duOiii/iLL74oSBU5wZmWSO4pv0kQa/KGntr38OHDcfTRR+Pee+9jdXV+hMNRca66SSxefofDgeuuu47fd999eaRhz0aLYfr06Xj99X8xIqnNZoZoNC6I9Wpi8uSJfMOGDYLQpg02lY+SuqrROXU44YQT8Je//IX5fD50dHTA6/UXvT551zscdmSzOSQSCbFxbmxs4F1dQXGu1WrFxRdfjKVLlzJZ25YSU5IHn8fjER6eF1zwdf7CCy8Ib8x0Oo2pU6fi5ZdfYU1NDUileryniZDweFyIRGL47ne/w59++qk8cm748OE466yzYLFYsHr1aqxbtw5tbW2CnEqlUshmszjssMNwwgknYOnSP+Z1gN73h9IEdCqVwi9/+Uu+bt06bNiwAaFQCHa7HW63GxMmTMLtt9/Oxo4dg0wmh66uLvh8PthsFiST6ZLrB6vVjD179uD4448X3sKydMAhhxyCrq4uxGIxEaUBqO26oaEBZ599Nn75y18Kb/NEIiHyPtA7kT1n5TFGlish0odyDbS2tuLrX/86/89//iMMVw6HA0OHDoXZbMbGjRsFEUeGuOHDh2Pt2rWMZG6oPWvfSW/WN0TSEsHa0dGBG264ga9atQpbt27tltjKirba1NSEUaNGYfTo0fjRj37ERo4cKchA+Vnph7SrnU6nkEPxer3YtWsXZs6cyffu3ZsnEWKz2dDS0oIVK1awdDqNWCyGn/70p3zNmjXYuHEjOjo6RIJKgt1ux/Dhw3HEEUfgd7/7HTv88MMFWUiEGXmOy9rWVF4iNuUkkbIcXTHU2oO02BzW2+8XOk71CPQYpaxWKy688EL+6KOP5pFq8hxE73TatGl4/fXXmdfrhdlsFp7PsqdzIdB7I1Kb+lQymcSXv/xl/vLLLwvddbq/1WrF7Nmz8dJLL7G+eD+pVArHHnssX7lyZZ5xHlDHie985ztYsmQJI4KRDOxkmCDjp8lkwgUXXMD/8Y9/iGOBQAAXXXQR7rrrLvF9qjsidSlxeFtbG77whS/wjz76SNx/6tSpeP3111kgEBDe/MlkUuRnqfX+hrztyShit9vx9a9/nT/xxBMiwonqdPTo0Zg5cyZyuRw+/vhjbN26VYyn5PUfCARwxhln4C9/+Qujei51fwC4+OKL+TPPPINQKLTP3huAcBygd0VJnuX3LbdzivqaNWsWfvOb37CJEycCyE+qDEC8CzJMnH/++fzpp58W7YHuMWvWLLz66quMnIuuvfZavmLFCqxdu1bMTfQ8hx56KE455RQ88MADZbVvelaKDmhpaeF79uzZp8+edNJJeO211xjVS1/kAaBr0zwlJxWn90AGilwuh3g8niddd9111/GXX34Zq1atgtlshsViQSqVwuGHH45//vOfbOzYsRWVz0BxVHt+q/X4NNBRqv4L8SO1XpfsLwrxPNU6vxS0c6h2ry6vDws5QfdlefobhgGgQhgGgOIotcHSbnC0nVErEaQlwEpde6DXbzmQn0PrTVprA0BfLCCLXb9SA4CcpJbaoppE049LL72U/+Mf/0B7ezsACC8o8lrinOPUU0/F0qUPsDFjRmP37lbY7XbU1wegKFl0dHQITVJtueVy6pWx0HigRaXts9oGAOqj5KUUj8fx9a9fwF977bW8zZecmIv+njlzJv7xj2dZc3MTslkuNldEpvXWg2cwGgBsNovQc927dy+++c1v8rfffjtP05RIaFqsEDmoXq/nmmSMcrlcmDBhAsaPb8HChQuZqklsQSKRFCHvgNoPbLbiG2yz2YwrrriCL126FADyjF6qjr4D3//+9zF//jwWicREuex2O8xmBkWprsTbj398I3/00Uexa9cuscknb0wijrxeL6ZPn4777ruPtbS0CJkWVXqheJSCTHDQRpf+njChhW/fvi1vDP7e976HRYsWsWQyKaIAAoGAILZIk3jr1q0499xz+aefrhZjgc1mw3HHHYfHH3+CkcyN3+9FPK5GaXg8LsRiiW5vPjt27dqDL3/5bP7pp5/myawQIUGENen9UjLNlpYWzJo1C0uWLGHa5+9rAwBFRwEQCXmpLhhjcDhUYwqVlUL/s9msiGQoBrOZIRKJ4KabbuKPP/44Ojo6RD30nGMWhF0ul0NTUxNmzpyJ+fPns0MOOUToylP0jNp2zWLtQbrWMvFptVrF+yQCk7S8v/rVr/J///vfIorM4/FgypQpmDVrFubOnctSqRS+/vWv85deekl43xK5d+GFF2Lx4sXC61OLYsYA/foxC4JclteIRqMi2oHGFIvFAofDAafTKZK5kne17Okvj0ekZ016/F1dXaivr8eJJ57I3333XSFZRkbiuro6bNy4kSmKgoaGhjwjiqIo2LRpE37+85/z1atXY8eOHYhGo+J+gErMHXrooZg5cybuueceRpJIBIrGIEkI2WOY+i/JQ2jbiR5qvYHrDwMAGShVqT7VqzoSieDkk0/mcgQAnU/zLPWVCy64AH/+858ZgDxpEXV+sRW9PxnB6L3Q3GKz2XDNNdfwJUuWCLKW5p4jjjgCK1asYPtbJ9rnj8fjmDhxIt+2bVveMwLqXNrW1sZcLpeIXsrlct15SBqFnI7dbsdpp53GX3vtNTF2NDU14Vvf+hbmz5+fVzdUf8lkEul0Oi9BOeccV155Jd+yZQvq6uqwcOFCNnTo0Ly5n9p0OfVbbZBRg4hbu92O1atX44tf/CLfunWrGB9IXkn2gqdkw4D6HidPnozHHnuMjR8/Xly/1Pslr3C3240f/OAH/JFHHhEOOmSQ0I7fnPfI+FFZiLx2OBwYMWIEjjzySCxevJgBEGt8ylVAhgTy+KcoSgBob2/HuHHjONWNvAY4++yzYbPZsHr1aqxcuVIYmDnnwgg3Y8YMPPbYY+yQQw4pO8cDGTUoMXxLS4vI1wT0GDbOPvtsPPPMMwwoP0dHKciRCDS+ysZEGiNoniRnhd27d+PCCy/kb731FoCeXFYulwtnnnkm/va3vzHKVWCgejAMALWFYQCorgGg1PnyukbvO5XW/0B/T30qAWR0dgNa7G8H0JJmdC0tEV7MKkeEwoEAedNloHy0t7ejrq4OTqdTEDJ1dX6cfvrn+Pvvv49IJCIW/7JUjcfjwTe+8Q0sWnR390YTGDq0GbFYHMFgCFarFYFAQHdiKNcIoHfeYEM2m4Xb7RRE7//8z0/5q6++mkf0k5YteRsypuqezp49G83NTUinM3kh0+SxKpNwAxV94ZFA3lFDhw7Fyy+/zK677jr+9ttv44MPPhAbZ7oXeaz1kIPq/d1uNw4//HBMmDABY8aMwS9/eQvzeFzIZlXDAG1c6V7ayJVCMJlMaG1tBdCTkJA+705ai/nz57FEQvWyd7vdIsGp01lafqFSzJ8/nyUSCb5ixQqh3Wu32wVBO3v2bEydOhV33nkno0SwtKFva2uD319X9PpU50T8E1nFGMPo0aOxdesWABAJ+4jgp2TYTqcTra2tQhYmmUzikksu4c8//3x3qD4XHoWzZs3Ciy++wAAgHk/C7/cik1EXqOQJSeH/Tqcdw4cPxfPPP8++9rWv8RUrViAUCgmvQyKbKNwfAIYMGYITTzwRy5YtYxQZwVh150dVsqgn8SFJXnDOuwkaK6LROBRFgcfjgdVqRjbLu40DtpIGpFgsBr/fj3vuuYcpisKffPJJRKNRKIoiZDKIAG9sbMSMGTMwf/584dEJQLw38lomUk9e/MuRANFoVJA3RHA7nU7813/9F3/uuedA5IvdbsfIkSPx+c9/Hnffrc4j1P4effRRdswxx/AVK1aI8S4Wi2HVqlWizdE77C3pL4MMiSTrAahtSNZT1tPTVxSlaJJdmjOJuCLivb6+HldeeSX/4IMPxOaKiMp0Oo2zzjoLPp9P1DHQQxSZTCaMGzcOy5YtY5Sz42c/+xlfs2YN1q5di1AohHQ6jbVr12LdunV44okn+OTJkzFp0iTceeedzO/3i3qnZyCiNJvNCukI0ren932wQ1sPjDH89Kc/5evXr99nzUlrapqXhwwZIghuMkLLHtKlQH2KftNYCwALFy5kwWCQP/nkk2LcnT59Ot577z1BYvbFnpP6nrynoL9HjBgBRVHyvO4tFgsaGxuRSCRgtVoRj8cxadIkvmnTJpE7avTo0XjppZdETpGuri4hy0ZGP4fDIQh82Vh4zz33sM7OTjQ1NQHoSRju8/lE2yUJn1qvGeV8BvR70qRJOPXUU/Hiiy9i165dYg1D8xG9X1rzkTzh4sWLWSqVEg4R4XC4ZCJnWtOk02nMnTuX3XDDDbj44ov5Bx98kGd4IFB7IYMAGciHDx+OCRMmoKWlBb/97W8ZOQPJSZkpZw2B2gNFjNHYPmnSJCxfvlyUiyKjHn30UXFfip6i9dTIkSNx6qmn4sEHH2QAxDq5XMjyQWTU1e6DaczvS56GZLfIgC0nN6a2TXVA5P/3vvc9/ve//12sV8j4PnbsWJxzzjmYN28eo0iBWrdvAwYMDB70liPT4xmLXetAMcQQ+iwCoNAmpdoe+kYEQHXRH/fXerjL9yzk4V6sI8p/lyr/YNGU1YtmKNeLvNL70r3K+byvr98XEQA2m6pLTp5Cs2efxD/44APRZ9U2wJDLqR5eU6ZMwfPPv8Camppgs1mwe3crbDabSLwFQMjTFCqHvNHQe3f0DHpe4fLxSttntSMAFEWBz+dBNBpHV1cXZs+ezTdv3rTPc8meb9lsFl/5ylfwxBNPsGQyJZKZOZ1O4aVLXrl6XrDFytbbCIBS6Iv5qVgEQCaTFhtB8vhyOByIx9X6vP7663lXVxdaW1vR1dUltIPdbjccDgcOOWQE6urq0NTUhJtu+gkjz126RyaTEaSFTNRZLBa4XPkyQ3pwOBy46qqr+AMPPIBkMgmPxyMkdcaMGYMPP/yYkeFG1eY3w2o1IxgMwel0Vt0Aqygpkfhx/fr1WLhwIbdYLLjiiiuY3+/H0KFDxSabyBcibrze8vMU9EiMmJFKKbDbrfjv/76M33ffveIcxhiOOuoovPvuu8xsNqOrqwtms1l4eF511VX8tddew5o1a0RbMJksaGpqxLnnnot77vkDIw9/6gNEnsrefPQOs9ksvF43gsEgbr75Zr5ixQps3bpV6OpSsugRI0agpaUFt99+OxsyZAhyuRyi0Wi392kg7zn7OgKAvAHJe5Kiq8irPJlUCUObzYJcDiJygQjm0uO7Ce3tqsSby+XCnj17cP311/PW1lbs3r0bjDEMHz4chx56KG6++WY2dOhQ4RVKyZA550LznqKPiEgmoiabzQrCirwyyeN1zpw5/IUXXsDatWvFMzscju6kxk+ybDaLaDSKhoYGxGIxpFIp1NfX49JLL+UPPfSQ+E48HsewYcOwfv16RoY0bf/Zn/FIlr2hd0Beu/TMJAVE52vrvtD8LBP5lGNj2rRpnOpCxjHHHIN///vfjLynKb+OXE66rixLBAB79+7Fz372M7569Wps2LABnZ2doi0xxnDYYYfhxBNPxB/+8AdG/UbNIRETXqSyt3ah59Ki1hu8/ogAkK9PBswzzzyTv/LKK2Iu0UbUUN1//vOfx/PPP8+IICcveVnTv9T9ieyk79D4Ru+pra0Nv/71r/k111zDDj/8cNFHe2NoKAQidocMGcLD4bAwRtHe7Qtf+AKee+45xrmaX8Xr9aKjo0NEr5DRr729XUgcTpw4Ea+88gobNmwY5KS9ZLynNkjzMMlmAaohgCJx6FwyjgL5Ek29SXJcLdAajYjyZDIp+ttVV13FX331VXR2diIUCgljpNfrxbBhw9DU1IQjjzwSCxcuZAAQDAZRV6ca5Kk9ldPmydAnY9u2bfj5z3/Ot27dimg0ikgkkpcroq6uDj6fDyNHjsT111/PRo8eLeYqOSqJxiE5ITJ9RsYPmj+I2N+5cydmz57Nt27dCiA/6oHymNDYN3ToUJx44olYunQp83q94JwjFosJw0a5/AbV165duzBu3DguRwACap+96qqrMH/+fEbtsC8iAMLhcF4UNCWtJrkfr9crDCPbtm3DWWedxVevXi2krGjdP2vWLDz66KPM5XKBoifl6C0D1YERAVBbGBEAlXn0V8oPaVGIpyn2/2BGSQNApRVoGAAMA0AxUL31ELH50AvR0SufHoFaDmpdv6Ug1w+wr1XSMAAUf38ulwM7d+5GY2MjstkspkyZwjdv3iQ8drUb29NOOw1PP/13RhEBiUQCTU2NSCSSiMfjwoM1EokIL3W9cuuVs9zJTi5TpRrF1TYAkKZpfX0AJ5xwIn/nnXf2Sdyn9RqcPHmK0LUl73Q1R4MZkUhUkGzxeLxXMkCD0QDgcKgbHCLVKcmorBueTqeFPAkRlUTQZbMcFgtpcwOMqT/pdKY7mZwbuVyPIWDfaJTiBC4lpDvnnHP4O++8g87OTpjNZkybNg3PPPMMGz58OPbs2YuhQ4cgFksgnU6jrs6PVEoRXmnVRCqVEB73lIxaNnJQG5I3u/ma7qX7pGxQsVotSKXScDhs6OzswowZRwrteZqrvv3tb+OPf/wjo7H60ksv5e+++y727NkjJHAoLP6II6biiSeeZIcddijS6QxsNoswMMTjye4EmWakUmmRWNdut0JRst0yOapslsViEfk10uk0urq6wJgqIeX3++FyuYTxw2QyiWSA1ZYAkj3rVYNXRhCEKrGu5owgCTC1TzgEMVjKQ5vzrIiKoCS9ra2taG5uFmQekTeccyEHIa83qC+R1zv1M4p4oX4ja+DTWPalL32Jv/XWW3nz9NSpU/F///d/bMqUKftoRsukxubNmzFz5kweCoUESWSz2bB8+XI2atSoPO/aQhufUpD7O12rkAROofWpdl7SjrFyVM03vvEN/sgjj4g+QwYrv9+PdevWsbq6ujxSmYxb2vdCfVSuPzn56RVXXME//vhjLF++XEjHcM4xbtw4zJo1C3fffTej75GxjIwevSHVa73Zq7YBgAhwahvZbBZdXV2YPn063717d969qS3Q7yFDhuDf//43GzdunOhnAETkiDxuFisfyTPKuSrC4bCQ/yLDs0zM9oYgLgYaY0aPHs13794t+jU94ze+8Q08+OCDjHIbkIF9x44d+MpXvsIppwm1qyOOOALPPvssGzp0aJ7xSa5vekaSqCHjuRba78vPL8vw1RLUr2gsUJO4J/N03levXo0777yTM6ZGIl177bWssbFRJH+Wx3gyelA7K0UAM8YEsU/rThpjqV3TO6VIJz3HG2r/soY9zbcyaJyhXFVATyQD3U9RFLS2tuKcc87hGzdu3Efj3+12Y+zYsTjssMNw7733iqTv8v2pnZS7vqdn3rt3L8aNG8fpnvKaZ/Xq1Wzs2LH71EElIIceOQeAPLeSzNz555/P33rrrbyoslwuh3HjxmH27NlYsmQJo/PlXC21Hn8PdBgGgNrCMAD0jQGg0Pml0Jvv672Dwd6++9QAUI71pJLr68EwAFQX/WUAkL2/6HP6KdbpC5VvsA6QWugRiNrj1UQpgr6vUC0DQCQSQXNzEzZs2ISTT57Nd+/enReGTMS0x+PBOeecgwcf/D9GiSCj0ajwLpY3uOQh6nK5Suo0yxEAhYw4heqgnOertQGASJVrrrma33PPPXmJWAmyHJDX68Pbb7/NWlpaQBqf5OnKeY+EgMViRjDYVVIDXFu2/jYAlDouyxToGQC6ujrR2NgIxlQtcyJntcSIlsgjUks1APQYouRknZyrXouyJA6Ns7RRt9uLEwhyQuytW7fi17/+NXe73fjNb37DXC4XTCaV+HA4bAiFIvD5vEgkksLLutrzh9WqPncwGBTEg1ouE0KhkCAP5bqTN/vlSODIdUbXsNvtMJmAiy66iD/xxBPCq5M2sCNGjADnHMlkEh0dHXnEN8nTfOlLX8Jf//pXFo8n4XI5EIslwBiDy+UQ0jdyO5ANKmqSbPXZyCORykmbf5JESafTQtKGpGDo/dts+TJNfW0AkElDIh6o7QKA1WoXY4NMGqpkDUpKAMXjUfj9fhE9Q6RNJBIRhpFkMim8yWm8lz0gqW7JK5NIaZLNIvKPcy4I6G9+85v89ddfR0dHh7jWkCFDcPbZZ+O+++5jgCo/19jYKKKaetqNCeFwGIlEAjNnzhREK0WoXHLJJVi4cCGj+WV/1j8E8lTVJjMjoyKRLUSOaa9HfaXQ/GwymQRJv337dsyYMYO3tbXlnWs2m/Hd734X9913H5NJXu2z6Y3RiqLkEcEUGUMSZFu3bsV3v/tdvnz5cpHcM5fLYeLEiZg9ezbmz5/PZPkmqhPZc7cYar2OrLYBgM6RDVNXXnklv/deNbKJxhWaA6g9WK1WHHfccXjjjTfyvP/lei7HgEd9B4CQWSNjnPbdUNQOjW1A37wfSgK8YsUKUR907QsuuACPPvooi0ajwghx8cUX8xdffBGhUEg4OgDA7Nmz8cwzz4i8FPQ8ZHTVi5AgkIwKyczJHuhylA31BepztW6fZECSDRtkNCUPdnktFo/HxXqbyGNqA7JhsFwCWNag18qZ0dqH2q7czvQMDLIRUk7uLBuP5etQ+ejZYrEYbDYbOjs70dzcjHg8jiuvvJLv2rVLOCI0NTVh2LBhuO2225jT6dyn3mielI21xUD3p3LGYjG0tLRwin4jMMawYcMGIUlVaA+yP9C+Y5Kp4pzjBz/4AX/zzTexfft2Ma9ns1nU19fjrLPOwkMPPcQAdRyIxWJCJgtQ20pfRPkYKAzDAFBbGAaAvjUAaL9TTvsrl4sp9nkhDPT232cCmIVezGBtqAb6D3pWOO1PKfJUe63eeMgNdBSyNA6Gstcazc1N+PTTNTjjjM+JRbFMhGazWQwfPhyf+9zn8OCDf2KZTA9BSBu2dDoNj8cDRVEQDAZRX18Pp9OOYDAkNhDajXq5xLFW4mqgTxhaJJNqYtmnn35aeGJq+6isZf35z5+Bww8/HIz1aNkTKSh7F2azuYMi/Hfo0KF5m2JKvEkbQ9r4U5slTzM5OVw2ywVJLGvA53K5PKJETnBts9ng83mRShWXAEqlUmKzPmTIENx3332MkvepmrOqt3pHRxBOpxPUfIvph/clSD7K5XIJ+QDKA0AbbCKSaJNMCR1VD8zSG0wiLWkuIs9wu92Ghx9+mJ1wwgn8P//5j/BKTSaT2LJlizifSAhAHVOOOeYYPProo2zYsGEIhSJwOFTy3+12IpPJIRhUPaqJNFalejwALOJdE3mby2UEYUb9h+QDstmskJCQ20wikRDe5tWGrKFMBAAZrFRDRK7b257kFbiQWSNv22Lw+/1CM5qkOYgkzGQySKfT4p0T0UnGGopeormA+hZp2xPhE41GRdu6+uqr+csvvyzkfkwmE7xeL44//nj89a9/ZXV1dejs7ITf7xda94wxQYb1GD6s4t0A+URoR0eHiGQptDkpd51D75jaAt3bZrOJ98A5zxuLZeN6IQkvOoeMJJTboq2tTfQBGsuPP/54LF26lJEWP9WvnOhYJt2oPGRkpzwSRH6mUikoigKHw4Fx48bhrbfeYjt27MAll1zCP/zwQwSDQaxbtw4bNmzA6tWr+fTp07Fw4ULGOUcoFEIgEMjz9D2YIRtyAHU8Xb58eZ68jF4bc7vdOOKII8T/1LYrkXwjQxx5cwMQ8jgkD+Pz+fZpe5WAxvPDDjsMK1asyOsPjDGsXLkS4XAYPp8Pl156KX/llVfQ0dGBWCwmIou8Xi9OP/10PPbYY8KLWc4XoM6Lah2SkY8kquhZyBNeluiiuZqikQjlGFb6C7LjARklqF/TmJbL5UR0muzQQWsEks+Jx+NinKbjpd6vLI1EyXmj0SgYY+IYjaM0bsoGUVmSjt6n7LRB9UznAD1SWWRwoPUEvafm5mbs2rULw4cPx5/+9CdGsk5k2CFHD3rPiURCGH7k+YHuVQzynJ9IJOD1euHz+YT8HR2Xpe1oHu4LD1Yy1lDenbq6OlgsFlxyySX8zTffxNatW8W9KLL3iCOOwBNPPMGGDBkichb4fD54vV6xLnM6ncL5yoABAwb0oMcz98a4KZ+n93elDqgDHX0SAVDMKlNIw7031y+G/vaALXR9Pe9TaojyT2/LV+sGVun9y7HwaT2k5Q1goWvp1bv8+YFiAJAHmkq9wfYHhQbAvm6Xha5f6QC8efNmnHLKyby9vV0QE0CP539DQwO+853vYt68O1goFIHNZkMymczz2CKCAwA8HreQ43A6nXnjm944qI0A0J6j9ZIu9dxa9Pf4p72fzWbDl750Nn/++ecB5OudylrBnHO0tLTgvff+w6geSIZJ3vCT95AcUt2bsmnH4ELlpv/L9cAohFL1WyoCwGzu8d4CIMLZKcSciH3ZYJRvFO3xziTPMSII1OR0QDyeEIQZbTLJU5bkgwqBpLBcLleet2M8Hu8mOSCStZJns9/vF8n3qk1UmExqvUYiEdFecrkcfD6f8MiT2yMRw2azuVtuqXSSafIeJ+OW3W5FIpHq9kJWDSTnn38+f+ONNxAMBsX8BUAQDoFAAC0tLbj33nvZhAkT0ONRmi9noUbAqNrX6XQGVqsFsVgcHo8LyWRaJN1OpZTudsHF/ej5ycOUiAfS0iaZKZJeUOsq/1l7P14U759EdMj1LxNb2WyPBIPsqSkTwcXAGBee5KT5LnuIy5sBmdCmxL+kzw30kJhEXFmtVkSjUfh8PgSDQVx44YX83XffFW3NbDZjypQpWLZsGRszZowgc1wulyDUZRKVkjTS+1i/fj2OOuooTgQ3HT/jjDPw4osvMiLR8583//9ShCsZEmkuAnoSdxLhLxsXCTTGFJIgojqjd7Zz505MmDBBaE8TGhoasHLlSpF7ggwbZJih/+X7yGNuNpsVRgwisMgrlMYwkpAzmUzYsGEDLr/8cv7xxx+js1Pd23g8Hhx11FH405/+xMaMGQNFURCPx0WETDHUen1Y6ZqvnPmJ+qWiKNi4cSOOPfZYHolExDk0p8ueycOGDcPmzZsZRZbJEQQ0T5S7dyRClUhzWnOR4ZLmOjLeaT3sKwElKL3++uv54sWLxWdEWOZyOTQ3N8NisaCtrU08m5wE+bzzzsPdd9/NaE6UyXAqezabFZ/Rden56dkouoWeTZaAoTldNtySVnotQe+A2gA9A5Wf5jagJ7GtTD4zxvJkvmjtTfN2qferle6hepLXTnQvWcJN9vSncUSW9aGxkaIbaE4F8h1atAiFQvB6vSICkZI9A8jLHSFH1WijAOTE0FoJIi1o/KbzPR4PZsyYwT/66KM8Y0Yul8N1112H22+/nXHOy67fckB9F1Cjh15++WVQAnF5XTps2DB8/vOfx9KlS5k2wkdeIwDlSyAZqAzVrt9a81cDHeXuPwvtXwcbessjlTpfG9mq/W6519fjA8pxvB3o/G0psI6OYPET9uMBBtJDV7sshUh9LaEt/+gRgYXQXwaMWl1fawCQjSbloNR5tKDQIwZpYa69jl4Hl8sk/60lCHs7MBfaWOudo9du9AiS3mwaa91XK50A7XaVnCfvk3A4LLxytm/fjqOOOoqTRyWRzfT+Dj30ULz33vvMZrMJ7xzZ+0ve8BZCue270LnFDAjy8xdCbwhyKo+MUhOcy+XA7t2taGpqgsViQigUERs0APjJT27iCxcuFN+j78qyP4wxuFwufP/738eCBfNZKBQRHrilkvz2pn3ujwGgUpR6P6VQaTl6u4Dq7fcrRS3m396g0vKpEiXq5nfjxs345S9/wVtb90JR0iIBcFNTE371q1+zYcOaAQCplCIRCsX7b+nnGxxJ7KsFxsp//4XmViKAGGMiEXk8HofP5wNjDFdffTV/4YUXsGHDBiF5dthhh+GMM87AwoULGXm70tqFCCKSEpJlKignQiKRwI4dO3DkkUdyijagMfW0007Dc889x9QcDynxOeUBcTgceTI6kUgEra2tsNvtGDFiRJ4hqFJQO6VoCvLgJa9oIqyOOeYY/v777wPokQ0zm8349re/jbvvvpu53W6Ew2ER5USkH62/CqGc8U32MibCbM6cOfzjjz8GReYAQCAQwAknnIBHH32Uud3uvOSzsm49EWMDydO6EPrCQYeIZMYYZs+ezd988828uVleB1EbP++88/Dwww+zamvQV3v+IgI1HA7j/PPP5y+99BIACGcRWseQAY+09wOBAEaNGoV//etfzGazCeIfQF6brnR9YMBAMVAklRxx+a1vfYv/7W9/y2uHjDF885vfFJI7wL4EF81dAPKIe3kPJu+HKWG42WzGjTfeyF977TURPSTn/6qrq8NRRx2FP/7xj2zkyJHgnAtD+WAlMgm1Xl9XisFe/kpR6fP3pwFlIPaV3jjQFeLYyv2+Hird41e7Tqu9f6u0fQ7s1a0BAxVC62lTiJAt1JEOFMvrgYpIJIK6ujp0dXUhHA7D7XYjm81iy5YtOPHEE3lXV1ee5z+FZR966KF47rnnGG369Qw9vSXXa4H9saD3pg3H40kMHdqMUCgMAHlhujabDc8884yoMyKKiDwhr1JFUXD66afjt7/9fyyVUj38/X4v2to68pLFGTAw2EBRBGRQfOihPzMA4BzIZLLdG2kGxtTPstn8BLQGagsi/SkypK2tDXV1dQgEAti0aRO+//3v8//85z8iIafL5cJxxx2HZcuWMfI+1+pGkzd1JpOBy+WC0+kUhmnydPV4PLj55ps55YwgL2AAaGpqAuccHR0dCAQCglBxu91IJpNYu3YtbrnlFr5z505Eo1Hs2rULnZ2dOOSQQ7Bu3TrGOUckEkFDQ0NJgr2c+iGS32QyiXrw+XyIRCJwu9245ppr+IYNG/IivgBg/PjxuP3224UmutzuKQqp0n4gE00kg+FwOLBgwQLGOcf111/PX3jhBWzatAmxWAz//Oc/MXnyZP6FL3wB99xzDwMgJKQogSh5sx7o5AeAvIiU9vZ2bNq0SfQFoCeKUSbC6+vrceihhwoD12AGGXx8Ph8WLFjAvvOd7/BPPvlEeK7LkobUNkaPHo3jjjsOf/rTn1gikciTlJEThpNDiQED1QbNPel0Grfccgt75JFHOElMkYF6z549Yi6hSFMycpJ8ktbgSf0DQF4EBI0JP/rRj/g777yDDz/8MG/ND6hro0mTJuHoo48WYy1FSLhcLkQiEWP9b8DAIMb+rpH6em1l8HT7B8MAYOCAhuyZp0f8621A9SIE5GN0rUIehcbg03+gRansebl9+3accsopIrkiJUKkkOCWlha8//77TCUMUsIAQN7/RGjrJUUcaCi3fNqolnLbqJz0T/XqZOjsDKGpqQFf+MJZfOPGjfv0K+oz5Fk5ceJE3H//UqZGDli7pToSvUrwa8DAQAT1JUpAShtxSszr9bqhKFnhvU06wWYzSQ0MfCPjgQyS+wBU+Yn6+noAwLe//W3+1ltvYceOHcKoOXbsWMyaNQt33303A1QZLCKg5RwHlOeAMYbOzk74fL598nu43W68//77wkBKHsZWqxW/+MUvGGNqzg1ANXLfcsstfMOGDVi7di22b9+OZDIp8itQ+WX5sL4kVmQZIyKEieA0mUx4++230dXVlWc493g8OO2009DcrEa9UCJUeZ7ui7mVPFHtdntexAVJfM2fP59ls1lccMEF/Pnnn4fFYsHOnTuxZMkSrF27lv/zn/9kVI9EgrW3tyMQCPRagm6wgt7Dj370I75r1668Y9p1Qi6XQ0tLC+64446BvTDqBSjaZ9KkSXjiiSfYZZddxpcvX47du3eLPBl1dXUYP348pk6digULFjCz2YxwOAyv16vrPDLQ140GDgyQnBvJKnGuSm0edthhwphHEk1r1qzJS3wv55YgGT0i7ylnQDqdRiAQAABh8DWbzZgzZw7/6KOP8MknnyAej4MxludoNXbsWBx99NFYtmwZk/uC1+sVe3Kv12vslQ0YOIBRTNGiWtffn0iDgxWGAcDAAY9ig4CeBIu8oNcbrGQjgHyu9riB6sNsNqOzsxMejwecc2zevBmnn34637Ztm9C5JILOZrNh6tSpeOuttxglgLRYbLqyUwNlA9dXIZraNlnu96xWK7q6QggE/EinFUHcX3/9jfzll18RYcIkpQFAED1q8lIfvvCFLyAQCCAYDIoEpfF4HF6vV2jFD1YM9BDaWt//QEcikYDNZoPT6UAux0UyXqfTAcaArq4wZIkI0rjOZolQrfUTHNwgCQM194ITwWAQF110EX/11VeFZ29dXR1OOukkPP7448xisaC1tRUul0uQGdqcBeTpbjKZhEGBPN7ViBEF3/ve93hbW5swljKmalZTsuE5c+bw7du3Y8uWLWhra0Nra6uIEKByW61WjBs3DlOnTsVtt93GXC6X0N8GIHT2KwF5ehKp7nK5hOSe1+vF5ZdfztesWSOe3263I5VK4dhjj8WiRYsYJayWc+pQYm4i3isBea3S/M05F2uBWCzWbYTz4oknnmBtbW34/Oc/zz/55BPY7Xb861//QktLC//oo4+Y1WpFZ2cnmpqaUFdXt080w4EKWW/8o48+0pXwA3qM+jabDdOmTQNjLE+eajDD5/OJdeKoUaPw7LPPsvb2dnR2duLuu+/mV155JWtsbITT6RTjBaAmQi60PzBgoD9AXvy05iaHqFNPPRUbN24EAJG/aNeuXbj44ov5kiVLmMvlQiKRQCaTgcPhELk2KE+QzWaDy+WCy+VCJpMRTlQ//OEP+TvvvIM1a9aItTtJECWTSTQ2NuKkk07CkiVLWFNTEwBVpiibzYo1EOUF6ov8AwYMGBi4qNQg3tv9tcG79Q5GDoAKUcjCpSWH5R+tPnUxDHaN5nIkSuT60iNjS32/kvLokaKlIgTk7/V16FExi6leuznYcwBwnhULz/b2dsyYMYNv27ZNbGCdTicSiQQAYMaMGfjggw9YLpdDe3t7twdKfl1p22NfaATqtStCqRwApa6/PxpwpZ5JPk4JkEkT2Gq1IhQK4fjjj+NbtmzJO48IA9oQMMZw7rnn4sknn2DxuHoNCgF2Ou2gpMuVPJ+23IX6SrVCBKvxfvry/rVGLebf3qDS8lmtZmSzPC+XBRkcM5kMPB6PSLTMOZBOK2Lzq3oYF8+BUW0NycGOSnMAkPe+xWJBZ2cnzjzzTL5y5Ur4/X6Ew2GMGjUK5513HubNm8fa2trgcDjg9XpFskryHJcTTBOZCPQkjCSihozSY8eO5W1tbXC73YhGowB6tNZlT0p5DrJaraivr8dhhx2GKVOm4Pe//z0jSTYi6knOBkCfSOxkMhnY7XaRUFpO1JpKpTB9+nS+ZcsWZLNZETFXX1+Pjz/+mA0fPlzkVyBZHTJiUHLNSpOs05xEkQmpVErILBHIAEE62ZTTYffu3WLOuuCCC/Doo48yACJJsdPpHPARAJWOX+QNPGfOHL5kyRLR7uTrkxdxNpvF2LFjsWbNGkbvr9okXrXXr9R+AIhoGmqjlPieonmoPNocUXp7ioE+Lxs4MCA7o8nyPjabDUcddRRfuXKlMGSSAfcb3/gGlixZwuSEw7R+kSOzOOfYu3cvfvWrX/FVq1Zh5cqV6OrqEm1fjqxuamrCrFmzBPFPfUge++k+ct8Z7FKIA31/XQqDvfyVoi/299VEb7icgQg9A0Bv9/TFoOeAW873+gvV3r9V2j6NCAADBzR6Q9DqkfqFFiiFBh7D+79/4XA44PF40NraipNOOolv27Yt750lEgmYzWZMnz4db7/9NstkMggGg0LLnrH8DayeMWowoy8iVJxOJ0KhkCCWvva1r/EtW7bk6QIT2US62ABw/PEn4P/+788slVKEpyx5FGUy1U0eaMBAfyAeT+bJZNnt1K5tyOXUDW8ioYhNOJGoNEQNcH7xgIeiKHC73bjhhhv4I488gt27d8PpdCIajeL444/HY489xvx+v9CWJy92MhzIBAoR/7KmMqBKjDidTjgcDoRCIYwYMYKTsVlL/tvtdiSTSTFGu91uNDU1Ydy4cRg7dix++ctfssbGRuHpmcvl8mQOA4EAEomE8MavFIwxkfzXZDIJA4PJZMIll1zCN27cmJcwEgDOOussHHLIIeK5SR4LQF65KCKiEhABZbVahfxRPB4XawCKOEsmkyJB8L333su2b9+OCy64gC9fvhzpdBp/+9vfMGPGDP7Xv/6VHX744QeN/A8Zbj777DPh0SsT20T0ESZPniyMNxR5MZhB5L82wTZJuNEzyusoenagx4GDjF9awuZAJ9AM1BZE+svGODJY/e1vf2NHH300j0QiQmouGo3ioYcewpo1a/gDDzzAhg8fnicF1NraiptvvpmvX78eu3btQkdHByKRyD7RvTRujBgxAtOnT8fixYvZsGHDxDxIZaL5knJqWCwWcS0ymhswYGBwotbzW6USQLUuf61hRABUCCMCoLLrVzsCoJQFtdRxrQGg0PP0lQXSiADIR6kIgEwmDb/fj0mTJvE1a9bk6SKT19qMGTPw7rvvsnQ6jVQqhUAgAPK+ZKxnEar11C/nHdY6AqA35Ss3GkD+jDYV5BH5ne9czB9++GFRt0TAAPlRABMmTMDf//4MO/zwsQiFIiKZWF2dH5GIKs1QjoflQI8AKIVSHk7V9mAfSB4s1UCtIwAoqbjZzJDL9YS7m0wmWCwWWCwmZLNceLvJ2v+KosBqLe5Ba0QAFEelEQBWqxVbtmzBKaecwrdu3SpkCmbNmoWHH36Y1dfXo6OjQyTzDYVCAAC/3y882MkYQMQHySmQBA8Rht/85jf5Cy+8IPSV1fL3rHuy2awwKEyZMgXTpk3Db3/7W+Z0OuF2u/OipRRFEQQ7kSqRSASNjY3inErldajOKAqAMYaOjg40NDRgy5YtOPXUU/n27duRzWaF9M/48eOxbt06RoQPJaAkz0/SVJfXwsVQ6jh59lMZ6Jo07lL0GuWjIZKXcOmll/JHHnkEgGqo8fv9+O53v4sFCxawwSBx0xfjVzAYxDHHHMO3bdsmCEVZ/oj6zZAhQ/D666+zww8/fJ89TrVQ7fVrLBbLy5dBYzeA7vHZKsZ0MuwR9CJYDAOAgf4EtUvKg0JtLhqNwuPxYNu2bTj66KP53r17AfRE53q9XkQiEYwYMQIulwt2ux2JRAIdHR0in4ts1KXcNhTZO2nSJMyYMQN33nknI8egRCKBXC4nDK00ttTX14t+IHv9y31tsGKg769LYbCXv1IYEQCVoS+9+fsCvd3n13r9UusIAMMAUCEMA0Bl16+2AaDUd+QQ5kKWw0LPUA2S0TAA5KOUAcBiMeHMM8/kb775ppBjoGSc2WwWhx9+OP7zn/8w8jRkjCEcDmPIkCHo7OyE0+nWfdeUDLhSiYJKDQCVQlv+ctqo/Bl5AlqtVmzbtg1HHDGFk7ecHElgNluQzaqGAJ/P1x1mfA+LRuOw2WyCWCDiy+PxIBaLCU+6QjAMAMVhGABqawDQm+PluYxIIuor8riifl6+HJc+BvcGulJUagBIpVI45phj+MaNG4VH+qmnnoply5Yxv9+PSCQCu92eJ7NDEjgk7UPkCPX1eDyOXbt2YcGCBXzbtm3o6urCmjVr0N7eLggYAHnXAoD6+np8+ctfxpIlSxjlCqDrAyrBQkYCmYiUk+qm0+k8neVKCRYi08nYkMvlkEgkcPnll/Nly5blGYBdLhcuvfRS/O///i+jcykiQh6PKULB5XKVNFKU6p9yZA2AvDqjclksFsRiMTidTphMJsRiMVitViHHtGPHDsyePZtv375dOBCceeaZeO6559hAjwLoi/H1+uuv53fddVdePgqtp242m8XRRx+N//znP4xkcWRP+Gqh2utX6jO0xgEgpKK0WuXUV2VJIEK113EGDOiB1hKywVUbwbJlyxacd955fM2aNUin02KPJM9FQD5vITtF0bjQ1NSEqVOnYtq0abj11lsZGXNpnKD+o50fgR55Ldk4K99nsGKg769LYbCXv1IYBoDKsL8GgL56Fu39DQNA7+7POju7KipAKfSlB+tAhh75JJMDehuJvvCA2h/I16x1/VZqAKg1tN7jxf7WQ6kNsF799Ob7MgGgNzjWov3pQVs2ue84nU7E4/HuTbualJYxhkDAh/PPP58/9dRToo/J3mv19fXYtGkT0yOFe56rMoK/nOcqZgDoaxSqx0Kw220IBrtQXx9AV1cYdrtdbO5l8jKTyeCEE07gn366ah/tW857kj8CwIUXXoi//vVhFoslKjag7A/0+l+tDAB6ZdL7v1D55DBpvUiVwTJOFsJAWmCXc/++b6+VRcDIOUwORJSu79L1R4Se1WpFPK4aJKPRKAKBAM477zz+5JNPwuFwIJVK4YwzzsALL7zA4vE4GGNCUoaId8aY8Ax2Op3gXE02u2PHDvzmN7/hW7Zswd69exEKhRAOh/NkUsj4SeMrjY2ZTAZutxsffvgha2lpyUuyK+eW2J/6qXQDRJFblAg4nU4jHo/jqKOO4nv37s2LBJs2bRree+89RqRQX3h3Vrt/xmIxeL1edHV14fTTT+cfffQRAPW5p0+fjg8//JDFYjFhdKHIDpIVqjRCoND8VOjz3oIiIQEIbXBqw/R+TjvtNP7GG2/kRfDJ3r+0Bvjv//5vLF68mAEQRGOtDSS13r8YMDCQQf1j7969uPrqq/nHH3+MrVu3CuKf1pC0N5L7s9VqhdvtxqhRozBlyhTceuutbOTIkQWdsmqBajuA1Hr9WQq1JjhrjVq/n2rcvzf71/4wkFeCvozwL/Z9bX2U+17KddArVP+V9y8jB4ABA4MW1d6AF/JoLvf7ldx7IMBmsyEUCnXLaVjQ1RXqTjrVgMsuu5y/+OKLeUYQmnBGjhyJ888/v1/J98GIdFpBIBBAOByFy+UCAJBmqM/nxd69bWhubsLZZ3+Jr127FkA+OcA5h81mE+T/rFmz8MADf2Q7duzCsGHD8jyMDPQeegsQbfSFAQMG9GE2m2G32/O8DlXjcQDXX389f+qppwCo5PxZZ52FJ554QhCcdrsdHR0dCAQCwtPR4XDA6XRix44d+MUvfsG3bt2KjRs3orW1VXhOe71eTJw4EePGjUMwGMSLL74oiOZkMik8jjnngjy/4IILcMghhyCRSAhP+2QyWXUP63JAuQ0YY6irq8P555/P29vbBWFMkjqzZ88GYwyxWAxut1tIIA1kkBRGIBDAa6+9xr7yla/wt956C4qiYPny5Rg+fDj/9NNPmdvtFl62drsd6XRaJEQeyJDrX9azp5/Ozk5s3boVQP68ovVoHzJkCG699VYmRwUYMGBgYIOidYYMGYK//OUvLBqN4te//jXfsmULdu7cib179yKdTiOXy8Fms8HtdqO+vh5Dhw5FQ0MDbrzxRubz+VBXVyc8/EnWDUBeJJoBAwb6F7Um+A0MbhgRAH0EIwJg/zDYIwAqDdEqp/71SGy6V28trL0tY60jAEh+wO/3g3OOcDgMn8+H1tZWnHLKyXzDhvVgrCdZHZEw3/rWt/DHP/6RRSKRfdp7/jMd2BEA5X5HURT4/V50dqpJHnO5HLq6utDYWI///u/L+KOPPir0r4F873PyaB02bBjWrl3HKFGYzWarugdAqWsO9giAQt5WtR63+woD3QPLiACoLSqNACCNeEqwSzI+sVisO6LpU1gsFhx55JF45plnmM/nQyikRph5PB5YrVaYzWbEYjHcfPPNfNOmTdiyZQtaW1sRiURgs9kwfPhwjBo1CsOHD8dvf/tbNmzYMMTjcVx77bX80UcfhaKoSdBTqRQYY3C5XEIex+Fw4IQTTsCzzz7L5JwBRDL3hQRdJd+nyAfydl+7di2OO+44HolERDJYADj99NPx0ksvMUCVQKKIi/4myPenf5KXPM3VF198MX/88cdF4me/348333yTHXbYYUilUnA6nQCArq4u+Hy+PilvtSIAyFgvR5sAPZFl3/ve9/iDDz4opEToXPm9mUwmnHbaaXjppZcY5VQgeY9aG0AOlHnQgIFqgKKiAbXvy9I8lEA+lUqJiDSK9rHb7fuQ+8Rj0H6LPqsljAgAIwKgmhjoEQB9ea/9Qaly9FeEwv5GAJR7fyMCwIABA2WjrwagQp7/vfm+XJbB5jmcTqfh8XhgNjN0dHTB7/cDAC688Ot8w4YNAFQvFCJLcrkcvvzlL+O+++5jXV1dwoPyQF8I7S8YY4LUSCbT3brRQCqlwOl0Ytu2HXjxxRcRCoXgcDiRTCby2hARVnV1dfja186H2+1GKBSC3+9HMpkc9Em+BgL0+mu5UQBGuzdwMIMxBofDgWQymTeX/vjHP+affvqp0ItftmwZa2xsRDgcRmNjIxhjiEQi+PGPf8zXr1+P9evXIxgMgnMOr9eLSZMmYdy4cbj11luZ3+8XZEksFsOPfvQj/u677+LNN98UXvJWqxWUhyaZTIp8NaeffjoeffRRFolE8iSF7HZ7nvxXIfSFREw5IN3ziy++mFOEGOk6NzU14eGHH2YkteR0OpFIJAZ8Al2gx8FANYD7kcvl8MADD7ChQ4fyp556Chs2bEAymcSJJ57I3377bTZixAghf0OG8oEOek9ms1kQ/NS+P/roo30k/GSJPzJYTZ8+XbRjuo4BAwYGNpLJpJD1JMOd7GRHhj+73Z4355COfyKhrvcpkfpAiEgzYKC/MJi4kmqg2utPA5Wh0vo3RnMDBg5waK2kfeVd1h8gYiWZVL04LRYTvvOd7/JPPvlEnEOSCrlcDjNnzsTjjz/OwuEwHA7HPjkSDEI0H4wxIU2hKEp3dEUbPB4PLBYLvvKVc/n27du7E/iqmwGS/DGbe4wrp59+Ou66604WCkVQXx8Q78swAFQGrfQPMLj6rwEDtUQqlYLD4RCENRHTa9euFYkSjz76aBx22GGIRqNwu924+uqr+caNG7F8+XLs2bMHdXV1GDVqFKZPn44xY8bgV7/6FSO5NM45urpUwzRjDFdeeSV/9dVXsWPHDlAkFHnzUz4bzjlGjRqFc845B3fccQcj+QWLxYJQKIT6+nrEYjGYTKaaSyxYLBYRdXf11Vfz1atXC0KI5GBOPfVUuN1u2Gw2xGIxOBwOuFyuPssDUE3E43G4XC6kUqk8J4K5c+eyK664Al/60pf4unXr0NnZienTp/NLLrkECxcuZLt27cLw4cNrXfyyQIQekX9E4t1yyy38s88+y4vkoPMBiDXVxIkTMXfuXBaN9sgEmkwmKIpiSAEZMDCA4Xa7ASAvKbAcbU/Ev5wwnjz8OefweDx515OjAOhcAwYMHJwwHNAGNwwDgAEDVUBfkXRa7/1C9ym3TIMtGsBisSAej8Nut6OpqQEbN27GK6+8glgs1r2R5chkMmCMYfjw4XjssccYJV+Mx+NCn/hgRan3m8vloCgKMpkM/H4f0mmlO/mXE1/84tn8448/BqDmYiCJJfIUBFQN61mzZuFvf3uUdXQE0dBQh64ulTAigshA5dDLAWDAgIHiyOVyyGQyQr/d5/MhkUhg8+bN4hy/3485c+bw5cuXY+vWrdi2bRvMZjOam5tx0UUXYfjw4bj99tsZkcPZbBbJZBKpVAo+nw8ejwc//OEP+WuvvQbKkyIT4KlUCh6PB6lUColEAsceeywefPBB1tLSAgCIRqPweDyIRqNCUkZR1NwspZIA9wccDgcymQxee+01IWNEeQHGjBmDhQsXMionaeWTl3mlqPYG0+VyCcmlbDYrvPuTySQOO+wwvPPOO+yss87i77zzDqLRKJYuXYrOzk7+0EMP5RHiAxlysl6qr1gsJqIb7HY7FEXJk+AkmM1mHH300QAAj8eDTCYj8h9kMhnDAGDAwABGLBaD0+kU3v+5XE7kZiHpTr31JI2FVqtVjOWylPFAkQAyYOBgRqUSMNWW0BroONgNGIYBwICBCqA3gPRm0ChnAO5Lwm8wkP4yyMtMJR1yuOyy/+a7du0CQHq2PVrpZ599Ng455BBEIhGDgC4TJDlBusZU35dccil/+eWXxXkU/i8nAeScY+zYsXj88SeYomThdrsRjcbBORf6yQOBwDqQcbAvYAwYKAaXyyXykVBf2LJlCzo6OgCo88ZLL72EV199VUihTZs2DRMmTMDSpUtF50mlUt0RaBbhla+Ok5fwd955B5999hkA1VCaTqcRj8dhNpvFufF4HGPGjMHMmTPxl7/8hZlMJnR0dMBiscDv9yOTyQhDQDgcLptYrrT/l7NBtNls+P73v89Xr14tpGSINJ89ezbcbjc8Ho9I/ssYQzqdhtVqHfBrDfKKbWtrQ1NTE8xmsyC4W1tb0dTUhDfeeIMdf/zx/IMPPkAul8Njjz2GUCjEn3nmGTbQpXBI85veAz3vtm3bsGLFCgDIm6NNJpNwqMjlcmhpacHcuXMZXUeOIKh1dIoBAwaKw+12g3OOVCoFzjmsVmueNBv1ZXIE0sr9yAYCOgZAyAcZ60sDBgYvjP3j4Eal788wABgwUAEqTQZSzgZcLylMof/35x4DGel0GoGAD11dYfz2t7/hb731lliMksQM5xzTp0/HggULWDweh9PpRDAYhNvtFhJAg7kOqgmSpTCZTNi9ew+am5tx000/5o899hgURcnbBBDZQZIWFosFX/ziFzFkSCOCwRAcDgdsNhvsdjtisdig0IAeDNAmNiIjnrE4M2CgOGicslgs2LVrFxYsWMBXr16NcDgspE9yuRyamppwwgknYMGCBay+vl7IxxEZTCRqIpHA//zP//BVq1ZhzZo12L59O4AegyjJyJBETjweh9frxdFHH40//OEPbPz48UgkEkilUmhoaADQ46XZ1NQEAIKkiUajNY9gM5vN2Lt3L95++23xGc2/Y8aMwR/+8AfmcDhAMkYUHUZzxED3ECeDd1NTk4gSobpvbm4W57z55pvs2GOP5cuXL4fVasWzzz6Lc889lz/55JMDehCWDQCZTAaKosBut2PhwoV869ateeeQ1y/Qk1dp0qRJQvefcvsAQCKRgNPpNHIBGDAwgEFRu5R/hj4jGR8y6JpMprz1uiwbRlEDAMS5BgwcDDjQCfLBnkTbQGVgnZ1d1b1BGUlKq3l9LbQNsq8asEzIyBp7ZCkvdK3+GkD2hzjen+v2FrJ3gSybM1g8DCptP+V8X66bYh78eu9Ye34hKRG9NlpKfkivrHplL4ZSxx0OB4JBVVrmyCOP4p988gmsVityOY5sVt2s1tc34I033mATJkxAJBIBYwx+vxfhcHRAJK3Stm8Z/ZHEMZ1Ow+/3IhKJIZ1Ow+fziSSUwWAQdXV16OrqgslkQjqdxlFHHSmiLORnIA+iTCYDk8mMz33udDz11NMVddBSBEI57a7Y2FZIiqu/FyaFyljrBVK159/9TYZeqWH1QEGhdqKnwbs/428plH5/lRGANA4RUZzJZIS0CHkYk4wPnUNGXXVsVw3ARGqo12Ld18qhra0N11xzNd+wYQM2bdqEaDSKhoYGtLW1dUujqNeaMmUK3nnnHWa1WmG1WgXBCQB79uzBLbfcwjdt2oQNGzZg165dgui22ezCiKAFYwwtLS047rjj8Mc/PsAAIBZLdBP8FiSTaVgs1SVTSr0/MlZQoliaA3K5HJxOJxhj+MEPfsDvv/9+IQOXzarRXu+99x6bMGFCn5dJ79z9Xb/2RfundhWPxzFlyhS+Y8cOIRX0ta99DQ899BCjqAebzQZFUZDNZmtuvAF6tPotFgs458IAcPLJJ/M33nhDvHuS+ZBzJnm9XqxatYoFAoE8aSqgJyn0QDcAHOzzhwEDBgwMVOzv/kBvXVyNvVS192eljGkDZf9aCLUoR7G9TzGuVR/F67/0+rn41UvzG33nILM/76L27JgBAwb2G3JCJr0kocW0GvUmFy15WmqCLbbB6ovoBNLZvfrqa/iaNWtgsVjEJpTkFo4//jgMHz5cyA6YTCZEo/FBIUFQbdAGP5lUyQkidUKhECwWCxob6xEMhpDL5RAIBDBlymS+a9euvCgLAKLeqe7HjRuLJ598quLddbUNxAYMHAwYqBuEUiDv8Wg0KjwVSToskUgIyRKbzSaivWQ982QyBafTLhKSh8NR/PKXv+Dr1q3Dhg0b0N7ejmQyiUQiAQAYN24cPv/5z2Pv3r147LHHYDKpY9yaNWtwzDHH8KFDh8LlcglDcnt7Ozo6OtDW1pYnKUfzTCrV4xlps9nEfYYNG4ajjjoKy5b9hdntdmQyOeFRCQDZrCqtk8vVXiItFArB7XbDbDajq6sLdXV1ov4ZY3jnnXcAIK/uTz/99EGTBLcSUCQHYwyKomDVqlVs3LhxfPfu3QCAf/zjH/je977HFy9eLBJDU24I1VBeW29ZMkpQsuNsNou9e/di48aNAHo2qPJGldYMhx56KCgaBuhZT9KcPNDJfwMGDBgwYGB/Yew/DRzIMAwABgxUEdWeQOQIE7pfuREC9P1ix+Xz9AwCxQwG5Za/1HGn04633noLqVQqb0OdTqcxevRo3Hff/Yw23CQLlEwmYbVa8zzaDkZkMhk4HA7hCUj1bTab4XQ6kUikEIlEMGrUCJx00my+bt06ALTZN4MxLjxsCUOHDsVZZ50Fp9OOZDJdUfn6un8YC7b+RbWJ5oM9SVUp6NXPYCH/ASAYDMLpdMLj8QCAkBsgw7bH40E2m83T4CepgkwmA6fTjlAogptv/hlfvXo11q5di9bWvcjlskLGBACam4di9uyTcPfdi1lTUwPC4Sii0Sh/5ZWXBZG5Zs0afPrppwD2nctMJpOISCApFRVMREUlEgk0Nw/F8ccfhzvvXMiGDx8Oi8WEeFw1QLjdbphMgKJkhVd2rSHrOtP/QI803MUXX8zXr18PoMf7e8SIEVi8eDGrq6s7KObXbDYLu90Ov9+PdDqNDRs2sEMPPZR3dnYilUrhL3/5C+rq6vj8+fNZR0eH8JZPJpMDJkkwtWeXy4WrrrqK79y5M09KTjtmmM1mTJ06Na9f0tqKDHEkHWTAgAEDBgwYyMeBvv8wMLhR+x2IAQMGqob9kZ0qJKEibxZlaaJyDRCl7qUHl8uFG2/8Ef/000/FtU0mEywWC9LpNE466SQMG9aMaFT1cEsmk2CMwel0HhTkRCkoigKv19sdBaAaRUjnWFEUhEIhjBo1Al/84pf4u+++C6DHA5AklijSwmQyweVy4Ytf/CLmz5/Hdu9uRV1dXUXl60sNwWrJnBkwMFgw2CIBAoEAgB7pHwB5iXYTiYTwrpcTEAaDQXR2duKKK67kmzdvBsmyqDIm6nVyuRzGj2/B7NknYcGCO5nbrUr6hEIR+P1ePPnkU+yqq67gzz33HMij2263I5VKiWS2iqIIgwR58JtMJjG3UNkmTpyIGTNm4Pe/n8fcbnf3c5iQTKZht9uFvEoqpZaRpIoymdp6USuKAo/Hg3Q6jVQqBb/fj2QyKQwxb775pqhXwoknnojGxsYalrr/QImNM5kMIpEI6urqYDKZsH79ejZ58mS+c+dOeL1e/OEPf8APfvADTJo0SRidKAFnLUHGMqfTiUgkAq/XK5L/UlSf1hCQzWYxcuRI/O53v2NAj2a4Fsb8asCAAQMGDOwfDvQcAwc6ar2+qxRGDgAjB0CfXre3ONBzAFSKUjkAtBuzUlraWnJflhDSO0+rs6aNONC7V6H/9VBO/Z100iz+0UcfAeghoy0WC8aMGYMPP/yIWa1WJJNJsdmVQ9QHQvupZQ4AWdeZcy6iAVKpFGKxGJqbm3D55Vfy++67FwCEl5+cJEwN+zchm83g7LPPxtNP/53F43HhDVgMlY7/+9OGyqlnIwdAfjlqjULjVl9fd7ChVA4AQqH2Xf3nr4zApsSrlGxcURShSw+oz0Hjent7O26++Wa+fv16fPbZZ9i9ezfMZosgXAGVkK+rq8OkSZMwefJk/O53cxlp1yuKAp/Pg1Sq5x65nOq5f8011/B3330Xu3btQjgc3qecRPybTCZ4vV4MGzYMQ4YMQUvLBPz8579gQ4cOAaBK+zDGkMlkEI1GUV8fENdIJNS8AQ6HmpAxnVZEvoJqoVQ/SqfTcLvdSKfT3eWtRywWg8ViwaWXXsofffRRIcOUzWZxyCGHYPXq1czj8SAej+cll+yrMumdW60cAOXMnxQBkEwmYbfbxZy4du1afO5zn+O7d+9GLpfDiBEjsHz5chYIBJDL5UR+i2qiHAIhk8kIGaC9e/di6tSpPBKJCE9+OSqQDFuf+9zn8NJLLzGK+tDuaeTrD2QM9PIZMGDAwMGKgZ4DoFJUuv4oJOFcrtZ9f/BT/Y2BlAOAsdLrx+LfN3IAGDBwwKIvPZzLuX65xJD8t7zJ1n4mEzF69yjm/b8/kkBa/OIXP+dr164V1yKyJ5fL4bTTTofT6YSiKHC73ejs7ERTUxOy2SzC4TDcbvdBr1NL5D8AeDweJBIJJJNJ1NfXw+NxYd269fjb3/5W0KhERiKzmeHoo4/BI488ysgrl6QvqoneLmCMDX//otoLUEMCqDgGuwSQx+NBLpdDKpVCNpuFzWYTpClp91911VV81apV2LhxIzo6OvJyAGSzamRSIFCHQw8djYkTJ+K2225nI0b06NMnEmqeAKvVilAoAo/HA7OZIZ3OgDEOr9eLpUuXslQqhb1792Lu3Lk8FAoJ4ztJnfh8Ptx4442sqakJTqdT6KFnMjnE40koigKz2Qy73Q6bzYL6+gBCoQgAdOdfUcnybJZXfdwsF1arFalUSuReoLl0165ded7/mUwGnHPMnj0blZD/gw0WiwWRSAR2u108by6XQyKRwIQJE/DSSy+xGTNm8Fwuh127dmHatGl87dq1DFCjF2vdF3O5HGw2GzKZTHc05Y08Go0KI78enE4nxo8fD6CH+JfXgWQkqHV+AwMGDBgwYKBaOND3DwYObhgGAAMGDmAUIusLHe8Lwm1/PPwKYeXKlUgmkwAgvERNJhMmT56MRYsWCTLaYjELzX/SijYm7x6PfrPZDMYY4vF496Ye2LFjF77ylXN5MNgpPG3JWGC1WoXms9lswciRI/Dqq68yiiLI5XIIh8MDRuMYMBZrBgzUmnDsLZLJpPCoJumcnTt34sYbb+QbN27EmjVrRDJgAGIcA9T5YMSIkWhpacGUKVNw2223M/Koz2a5GJ8SiQScTjssFlXCzGxmIneJw2FDOByF1WoFY2Y0Ng7BokWLGABEoz1RThaLBWazCbkc75bLUcl+IkStVitcLjVZqqJkEYupCXT9fi9yOZpbgUxGzWdgtVpht1ffgFoKahSESgTbbDZB9v/whz/k27ZtE+RvJpPB6NGj8cADDzCKpqCksgc6AoGAMAJ1dHSgoaEBJpMJwWAQEydOxEUXXYQ//vGP4JyjtbUVxx57LP/www9ZXzhA9BXIaEE5LvQiR+ldjhkzBr/5zW8Y9UvOuVhH6EWLGjBgwIABAwbyMVDmfwPVwWB/v4YBwICBQQytTFI50g+lvPn1vMELXY82iPuLcgwAVIZMJiPC1E855RRkMhlYrVZEo1EwxlBXF0AoFIbFYoHP50Uikdzvch0oYIzBZDKJBMk2mw2BgA/t7Z34wQ++z9etWwfOudC+BlTCXw7993jcePnlV5jNZkMsFoPD4RBeo5Wimh7kA4mAMWCgFhjoERSk9x8Oh3HllVfylStXYtOmTQiFQiIiAMj3Nm5qasLkyZMxadIk3H77XKZ64wOplIJ4PC10+evq/Egm06ivDyAcjorE54BqeAgEfIjHk/B6PWAMiMUScLudiERiyOVy8Pu9UJSskA/KZk1iPJW9oskQoChZYUSnnAXZrGogIMO13W6D1epCNssRjcbhcNiqWr+lkMlkYLfbhWHY6XRi165deP/99wH06MRbLBbMmjULNpsN4XAYfr8fqVRqQCQyriZU45FTRHfU19cjkUh0t686JBIJLF26lO3cuZO//PLLUBQFa9aswZlnnslffvllVmsveXlNt2nTJmzbtk034pNgNpsxYsQI1NfXi2PZrNquLRZLnuyfMb8aMGDAgAED+jDmRwMDGSwYDJV1YqGGXG0N/4HuZVLMq1qrU1aNHADVrp9qvx/SGi+UN2Ggo79yAMjeV3J7qnY9latR15trydfMZDLw+bxIp9Vki9lsFg6H6kl51VVX8Qcf/JPQIFYNABaMGjUKn3zyCfN6PUgmU0VljkqVrxwN4GIoR+JJmwOgko1zOd/TGngoZwK1IZvNhvPO+yr/+9//rqv/K5fP7/fjm9/8JhYtupspigLOVfkKp9OJaDQqCLpC6Iv+UUzmSq5fPRQae/UMZXrn9FX/3l+proE+//UVSuUuKYRSetQHYv1pvXDleaAv2yxdX75eLpfLux8Nr/SZrN+vJhLPdnvXM+HtTscVRcGNN97IV61ahU8//RTBYDDv2jTmA6qcysiRIzF16lTMnz+fDR8+vPsag9sDvZSGaLWRyWTgcDhEkni3243zzz+fP/7440LijXOOCRMm4L333mMkfWQ2m5FMJvMMAHpjXKXzayn0R46ZUt9Pp9NwuVyYOHEiX79+PQC1n1xwwQV45JFHWC6XQzweF9JJLpdLSChVe3wi/f9cLocvfelL/Lnnnsub62VYLBbY7XZ89NFHbPz48cLoMdhQKup1f69lwICBvkWtNcxLYaCPH32xPx3I6E397c+zDPT6qXQuG4jto9SerTfnFlOwKK/sleUw5LzS/Uf/OIho60JEUZfbQGo9EBswYGDgodJJ12KxIJFICkMQkUXpdBqrVq3M80LrviOOOupIuFwuRCJRcX5f5x44UBCLxdDYWI9YLIFwOIzm5iZ84xsX8ZdeeinvvGw2u09SQLvdji9/+cv43/+9jSWT6juyWq1Ip9Ow2WxwuVz9ImGhF+WiRxj39RxlzHkGDnaQNAhJq5EcjtVq6faaj8FqteYlDgfU8SSVSsHtdiOVSkFRFFitVnDO8ZOf/IQvX74cn376Kfbu3Sv6rtVqRS6XE2OKyWTCyJEjMWHCBMyfP59NmjRJlCudTndHgB34OvTVhNlsRiKRyDPSLF++HACE17eiKJg5cybcbndeTplS3v8Hwxycy+XgcrkQi8XwwgsvsKOPPprv3bsXNpsNL730Em644Qb++9//nlG/cLlcQkYoFouJiJRqwWw2I51OIx6P47PPPgMAIWcky2pRlMrEiRMxduxY0V8P9hxKBgwYMGDAgAEDBxrKNgAU+v9gWOQbMGBAH73p/3qEqtVqRSKREHIyRERHIhGsWbN2Hw9uvz+AJUvuZURMUcJIPSOAAcDr9SKRSCGTyaC5uQmXXvo9/uSTTwrPTtL6l6NLLBYLstkszj77bDzwwB+Z1WpGZ2cXHA4HrFYrLBZLXjLA/kAhqSu9Y3rnlAPDcGTAQD5SqZSkgW8GY0A2m0Mymeom4M0iCiiTySAeV3XzbTabkApzOByIRqO48sor+UcffYTNmzcL73HK1UKe1IAq8TNlyhS0tLRg3rx5zOFwgDGGZDKJdLpH4sdut6NifpJX6IHDBjdBStFcJAV0xRVX8A0bNuTlgBk3bhyWLFnCKILMZDKJaAHZAFwNI+xABxlIrFYrRo0ahQsuuABLly6FoigIBoN4/PHHcdNNN2HIkCEAVINZQ0OD+E6lKCfCwmq14uabb+ZbtmwRhjqTyZSXzJf+njZtGsxmM+LxeJ+Uz4ABAwYMGDBgwMDAQkkBT20o/sEmTWDAgIHCKJcwJZJHT74C6JF7SCaTcDqd+PWvf8VjsWje90wmEyZMaEFDQx2iUTWUXvZQMwjcfcEYQzAYxPDhQ/Hpp2vw0EMPiaR+jDEoipKX6I+In3POOQfLlv2FxeNxoWdNuQSsViusVitCoZCQa+oPlCKY5OO9bZeF/jdg4GCG3W4XYwMR9KqWvh2AXXgXU/4Qr9crSNH29nb87Gc/42vXrsXKlSsRiUTE92XSMZfLwel0YuLEiZg5cybuuusu5nK58oy/REY7nU4xV6ge1O5+rpEDE6lUCi6XC2+//TYACDmnXC6H2bNni2TKZASm911OdNaBjHQ6LfLnhEIhLFq0iO3atYs/9dRTcDqd2Lp1K84991z+zjvvsEgkAq/XC6DH8FJtD3uSJ1q1apXob3K+H6DH6cLn8+F3v/sdI4cAYx40YMCAAQMHKow5zsDBDEu5i/VChgADBgwYKAUiBrQkLXkQptNpoS9tMgGfffaZkJ8AeojZadOmQVGywiCgjRAwxqd8xONxNDc3Y/v2nTj55Nmc6pzIHUAlBBKJhKi7U045BX/96yNMrluK0IjH491eu+gXD8FSBmhtu6pEkspoQwZ6i4GuYVspZIKSon4URUEqxbqJfNV463Q6wRhDKpXC9ddfz5cvX45169YJiR8AwliYTKrJ2Z1OJ4YOHYpJkybhzjvvZGPHjgUARCIRhMNhWK1WIVdCyUfJC52MkIM9B0Ct4XQ6EQqF4Ha7cf311/MNGzYIA4vJZMLkyZOxaNEilkwmhSHIbDbDbDaLtnGwOwlxzkFRKl1dXXjiiSfYcccdx9977z0EAgH85z//wYUXXsgfeughBqhRAC6Xq+xrVwKTyYRwOIw1a9aIOV/P6JDL5XDEEUegubkZiqL0q2HfgAEDBgwYMGDAQPmodP9p2Z8knvL/B8si34ABA30DeRxRZSVUT3SLxQKv1wvOgU2bNkmJJtWNq9frw7x581k2m4XL5UQsFhc6xIYEkD4CAR92727FSSfN4sFgcJ/NP0lrEKZNm4aXX36FdXV1weVydUsIJcA5z5P6SCZT/ZogcH8lgHrTDoxoAAMG8iEbYNVIIDkhMJDLZZDJZLB+/Xr8z//8D1++fDk2bdokxhnKAUDRXTabDaNGjcIRRxyBiRMnYu7cuQxQEwKTLBB5SSuKIrykFUURUUtkxFSJyvKIVAOFQRJPb775JlKplMgHwBjD6aefLghuyg+TTqdFpJi8fzgYowEcDgfIs59yXADAP/7xDzZlyhTe2toKh8OB5557Djt27MCYMWNgt9tFHp1KUWp+cjgcuPrqq3lHR4f4jKJptAabqVOnIpVKwel0ij42GJMAGzBgwIABAwYMGCgMS6kFnkyC0AbAIEUMGDAA9J5o144duVwONptNeBzabFbs3LkLnZ3Bfc4dO3YsHA4b0ukMMpkstMZLg7DdFzt27MLnPnc637p1a15SP9IBJpLGYrFgzJjD8Prr/2LBYBB1dXXIZrNIp9NCIgAA7Hab8PQlz9z+Qm8Ipf1tB0YbMmCgBw6HDamUIiK0HA47OO/x0v/pT2/in332GdauXYtIJCI88ymZLyUJHjlyJFpaWjBlyhTMmzePUcLZaDQKm80m8oqQMdJms8FmsyEWi8HhcIgIpFQqhVwuB7vdDofDYUQAVIhMJgOv14s5c+bwFStWAOiR/5kyZQruvPNORtJNZBQgklgvB8zBQPpr4Xa7QXMmec43NjbinHPOwf333w+z2YxYLIavfvWr/PXXX2dOpxNms7lfCPZoNIqPP/4Y2awaNUkJf7WGmkMPPRS33norK2RkN2DAgAEDBgwYMHBgoKQEEBE8MvkvGwGMRaIBAwYKoRChSp+RxjxpQicSSdx66//jipIG51xsWAHVAMC5Sl7H43HU1weQTKb79XkGG8466wv8s88+A6CSPfQ+ZAkgIgBeeOEFRgQGeQmm02k4HA6RGJASfJpMJpjN5gE1/u8P+WQQ/gYMFAaNry6XC2YzQyQSw49+9CP+6aersHnzZrS17RVJxG02m5AIMplM8Hq9mDp1KiZMmIAFCxYwt9uNdDotxqF0Og2PxwNFUURyX4/HA0Adf+JxNc+LKjmkGhxJdkxRFGQyGdhshlRJJchms8hms3jzzTeFVzp9dsYZZ0BRFHi9XoRCIWF0oag92YB8sIIiJurq6hCNRkHk/vbt23HvvfeyDRs28Ndeew1msxnLly/Hd7/7Xf7000+zVCrVncS6ujkAdu/eDZr/GWN5UTSAKt+VzWYxceJE+Hw+AEA4HIbP54PNZqt6+QwYMGDAgIFa4ECX8DRgoBgserIZhbxAyANIhryYJA3vYlEChQwH2uSgen+XI0FU7LrVgJ5shF496Wmgl3v9AxlkYJLrrNAzV4Ooq7R+e9N/9gdUL3rX6Q/ysi/rR74e/fb7vQiFgnA6nUin0wgEAujs7EAymej+fg6ASlgfeugoJJMJmM1mWCym7kR2+45HvYEcBq8duwrJCvW2/+qNCeXqzJc6rigp+Hw+tLW1wev1Cs3sXC6HE088ka9atRJutxuxWAycc6HvnMtlu40AHIcccgjOO+88HHroKHR1hREI+BCPJ5FMJkWiZVkCKJfL5UkvVVL+Uuitx3+h8bWQvE8pgqNUhEOl76/akOtD2+bKKVu15x/t++rtHFnt9lfp/auB/HbMAXBw3rP2InKWvOwtFoswsJLxD4CQ0SHJHTLGAqrhz2QyCemXjRs34oYbbuCffPIJtm/fLoyzdrsDgHqfdFo1BAwffgiOOeYY3HPPElZfXy/KquZuMXc/A2C12rs9+E0wm03iHBUmWK12ZDI5MGaG1ap+L5slWTgLbDZL5ZXJaktwcl68/ZReSxQvP7WFZDIppGdMJhPsdnu37J4NmzdvxvLlKwAwZLMcuRzH5MlT8LvfzWWKkkE6nYHLRYaZLMxmq3gvgL7ev165tbkB1N/VjeCodv8ng1QulxO6/rlcDocccghyuRz++te/spkzZ/Lt27cDAJ599lmsW7cOQ4YMgd1uF/3SZDIJwxgl0Zbn2ULPZLFYkEgkhFRWMpmEw+EQ17vpppu4LPGnnQNzuRzcbjfmzZvHAHVMoOfQRgrooVIChYxIhebvUt8vtY7S24vJKLSuJtD6oNB1ym1f2j6gty7W6zOl9kLlRJBo5RL1rl/o+chgJJ9bTGpTu/fXrp+096fjtMbU7neKjSt6ZSn0fPuLUu+k1uu7wY6+3l/29fVrzb/sT/vqzzJX+/0NtvV7X/OPhfZvfTW+1WL86lv+U55fOGg92vN/KZRa/5daf/TMvwOxLkvx8BZ5gaPXqMpZgOlt2stZmBVqxKUKrb2OfNyYnA30JyrZFBiAIKzJqzCbzaKrq0scp7r0er245pprGHmdk/wMEUL7Cz0jSm/Gv1qBymy1WtHZ2Qmv1ys8bxOJBM4880y+Zs0aIaNht9uFFjfpN+dyOTQ3D8O//vUGGzt2DNrbO2Gz2RAKReB0Og+oCAs947EBA4MdhYgk+tzhcAg5HgKt+cxmMxwOB9LpNOLxOJxOpyAfyVh42WWX8VWrVmH58uWIxWIAVMkTQCULKT+I1+vDpEkTMXPmTNx550JG0QIGagsieUnXn+SZKKrObGa49NJLeDabhcPhRDKpJoM/5ZRTMECnvkGFIUOG4KSTTsIjjzwijHInn3wy37NnD6OIATWSxQar1YpMJpMn11MOqK9ns1kxt5Oxb82aNeJda8lcMoCPHz8eQ4cOFcZBOTqwFCpdH+nJSMnX1SYh1xLMsoFEb06Xr69HJmu/T0mS5fUVHaM6lY/rJUuWSWitAYHaQCmUQ/CUs4aR66+Yk5X8XFpjjLbs8nfJaFXI0YXasvaY3ruQjQWFDIjaNqA1kOmt5/sCWiPKQN0XGDBgwIABA+XAIk+uBHly660HZCELvt7/5RL/escKGQOKeScYMGBgYCGbzQoPVZPJhHQ6jba2NgD5/bm+vh6NjY3Cq5UMAX3hYd6bcUJ7z/4eY7TPazKZBHHAORfk/0cffZR3jhotoUJRFLhcLtTX1+NrXzsfY8eOQWurGkHgcjnQ3t7Zr9r+1YRe+zDIfwMHCuR1lXb9wzkXRj/OudDVB9Rxl6TU7HY7AoGAOH/btm247rrr+EcffYSOjg5BHDocDmSzWWEIsFqtmDBhAiZNmoy77rqLDRvWDM6BVCqNbNYkoocM1BaZTEa8O/K4VhQFNpsNbW0dWLlyZTfBqRqJpkyZgkWL7mKplHLAzAO1xLJly9gnn3zC165di1wuh9bWVnz1q1/lTz75JKN+SOsgIprJYFOq/2gJdDk589atW7Fly5Y8L3u6puyBPW3aNAQCARFJAPTkgajFXCnfs5QRRI5S0CPXS32f5Mto/UnOKASqfzquRTqd1iXJgX1J7ULlJxTywC+GciMkSh0vdx1L7ZXakGwA0RpQaM7RHpdJfDmSVGt80DNAFIOx9zdgwMBAQrUjVAwYqAS6MdRyo+2rDVypUD75vr2ZyCsleIwOaKASFPJU0TtuYF/Im1L6HQwG9znP7/fD5XIJQoskDEymPpCBkFAq5Lq3Rsa+3EBryT0ASCRUmR5K0nnyySfz1atX5+kz0xhOEhCcczQ1NeG8887DvHnzWFtbBzweDxwOByKRGDweDxhjiMfjuh5ugxlGJICBAxlaGQSLxSIS6GYyGYTDYQDqWGCxWOByuZBIJBCJRPCzn/2M/+c//8G6deuQSqXyCEAijU0mE0aMGIFp06Zh/Pjx+N//vZ3Z7aqXbDgcRTabhcvlgtVqgaJkjPlvAICiP1TJH4uIBDCZTLjssv/moVAIjDGR9+XUU0+FomSFZ7oWfRV+fjCAtP6feOIJNnHiRE5RN8899xw+/fRTTJ48GTabDZlMJi/fWrnku7wWkiOxLRYLbrrpJp5KpfI+176zIUOG4NZbb93nRRKRXSmBUer72jxCRPzSmqVQhACBPPQL3VO7f9WWRxsBoP2Rry+Xja6j1z8Knat3jnz9avQnOc+TXK5y76k1oGgNJFoDiDaqgsYe2cAiQ+sIWMhhkD7TGhj0IgDkdt4X67tCHIMx/hk42GHsnwwcyCi9/umnglQJBZMAl9uxaYFWiOAvNUnKVv1iBGoh4kbPC9gwABgwMDhAG105Qa2sWUufkU611pOtLxwUC0UTyce0UU21Wvhox0jGGCKRCOx2O4455hi+fv16kThZln/I5XJIpVJwOp3w+Xx47rnn2MSJExGLJWCxWOB2OxEKRZDJZOD1uhGJxOB2u0tuwAcLCs0Rxvhv4EBGMBhEIBAQ3sVut1uQMNFoFDt27MCVV17JV6xYga6uLtHftWRkIBDAYYcdhqlTp2L+/PnM7/d3RxAkkcvlYDabu6+t9idVSz5XtoyJgepAJsMoAoBIy87OTrz77rvCUzedTuPQQw/FggULWDabE4ajYgSmgeKw2+3o6upCS0sLTjvtNLz22mvIZDJIpVK4+OKL+b/+9S/m9XrFGkgmxGWjQCGQVBAZGuLxOKxWK+LxOCgKUPZi1/49adIkNDU1QVEUYewnWcZy3m+lbYAcP7TSRHKEgvZ+8hpIJtj19oQ0/hSKEiCCupCnuZ6HvnycDCx6Mjl6kjh6z699pkLf0dtTy9JuetAzkJSCXB6SPdKWj8qhd33Z6KJXl3KbobZG9VYqF4DWiFDIQbGvCHo9p5u+NC4YMGDAwP7CGIMGN2odIbKPAaC3xAhNtKUIlnIiAGRPlWLn6d2/UNmNDmKgmihGHhsoDZPJJDwPrVarkKrRjhskJyFvAPoiRF3PgEif641Z/U0cFxtbOVdDsLu6ujB58mTe2tqal1SQNkey5nNdXR1WrlzJzGYz0uk0bDYbTCYTQqEILBYL/H5vd4LH3kkjDVRUGiFmwMBggtZ5orGxEalUCtFoFHa7HU6nE9FoFJdffjlfuXIlVqxYIc4nOTHG1Fws2WwWhx56KKZMmYKFCxeyMWPGAFBJG4ok8nhcyOVUIiqTySCZzIg8Iy6XQ0rqa6AWMJlMeTIbMiF344038t27d8NqtSKdVnO9nHXWWWBMfcc2mxXZbM4gvCqE2+1GOp3GU089xVpaWviuXbsAAJ9++iluuOEGfs899zCLxYJ0Op0nbUjrnWKQPbwpj5LNZsPPfvYzvmvXrn284ek8QPV+nzx5MsxmMxRFgdVqzfN+l3MGFEKlG1hyVNAjzjnnol3qkeqMMUHAF/Iw1yPI5bWdXg4BLcld7HlkIxl9XzZK0N/kuU5rMTqf1mnazwly+bRlKscRhepPrh/6W/bWp8/oc2p35ba/QtCu0bXGGqo/gtlszjMK0d5Afm4ZhZJkl9t/yoX2GQ6EtbEBAwaqi1oTvAYMFEPe7FnM2l0IpY7TZN4b63kpAl/+TC+CQP7f6GAGDAxcyBshIqW10hMmkwl2uz3PI448hypVKCtkANB6otFn5RgytdevBui6O3bswKxZs3hra2ve5/IGK5VKwWw2Y8yYMXj11VcZeW0lk0koShYNDXVCRiAYVOUgAgEf4vHkAacB3dv3YSzgDAxkUPuTSSeZIIpEIvB6vbDb7bjuuuv4xx9/jNWrV4s8KzIppCiKIFymTp2K4447DkuWLGGAOt7G43HhLU5RRslkWhgcHQ477HYrOAcymaxB/g8AyCSunOA1HA7jww8/BACYzWri59GjR2Px4rtZNssRj8dhsfgKXteIoCofuZwaTcEYw+c//3ksW7YMuVwO6XQa7777LjZv3oyxY8fmna+VUikGWiMBPUlpP/vsMynRs1kQonR9ADj00EPx//7f/2PUp+kYJQKnqKFS9y6G3jiS0W+ZwNVK7MjHyAFC/lwm0bXPlc1mhaGSSPdMJgNFUZBIJHDPPffwdDotEjFzzkVCdDKIKoqSdzyRSIhrK4oC+r58D60BQP48lUrlPVOx+tuf9ScZdOlcbSLfYgYAaoP0v9lshsViEb9NJhPcbnde7gSr1SrOYYzBbreL49///veZ0+mE0+mEzWaDxWJBJKI6ntD1qCy0Ri0m8UQGIoqC0YsWMWDAgAEDBgzsCwugT/yXu8AvRsADPRvTQteRFz3FogJkyP+Tx4f2HoUiE7QwFgkGKoGWIJZ/a48b2Be0+aEFPEkByaCNCHn00Jiibu4qjwCQf9P9io1ZA4n0OPnkk/mePXvEOEySP4qiCGkAxhhGjx6Nc889FyNHjkQ8HkcqlYLf70cymUYmkxPkXl2dH+l0BsFgCIGAH6lUusZPWF0YBL+BwQztGof+JgLHbDbj29/+Nv/ggw+wbds2JBIJ8T2r1ZpHbDU2NuLYY4/FwoUL2ciRI2EymZBIJIQXOUVhEQlGpA+RRJlMPvkGlE7CaaC6oKSdpBFPXtNtbW1Yu3YtGGNIJtXkryeeeCKi0TicTiccDgfMZoZMxli/VAJFUWC328W8vGDBAvbvf/+bU3LelStXYu7cufzuu+9mste43D+LgfIHWCwW0ScjkQgo4TCAPHKZxguz2YyWlhZ4PB4h1aUafSzCuEcRAdWE1gOfSHlqtx0dHchms0ilUkgkErj//vs5jT+UxJyI/XQ6jVQqBZnEVxRFXJPIfkVRxPVTqVTecfpcLpPWOEF/9wUK7VGpr2qNAlqDQLX3t8XKp72+HJkh/08GgPvvv5/LZD/JkVksFthsNlitVpGo3m63w2q1wuFwiONkPHA6nbjsssuY3W6H1+sVhger1Zon+dTX3v8yJ2I4Fxow0DfjiwEDAxWl+YF+KkiVYNE+YKHQx0IoVUG92QDuz+Kq0LnlPkdvNK71yqe3yJAXPqVCUHszABZbiPUX+vp+xRZS/UGeV0oA6h3vy3JrCR35s/6on2qHgKfTKTgcDrGhI48iIvpJjiKTycDhcCAWi8FmsyGRSHQTTz1a1XrlKre9lvMeCxkLil2Hxget9xZdw+GwIRqNgzEm6kEOe5Y9r8LhMNLpNJqbm3Ddddfzxx57HDt37hTnUvg0kT00to0bNw5PPfUUmzRpErq6urq9dR0i2kJO9phMqoS/0+kcFOR/qUgyeQNbjfGzrzbYesbrvkAho7r2WDltvdzr9ydqFYHTV9dXifOMINnJK5Qx1k2OmJBIpMQYQNI7TqcqnUAe/tlsFtFoFH6/H4Aq77Jq1Sp88MEHiEajIqkvkYrk1WqxWDBhwgQceeSRuO2221hzczMACHKMCDryWgV6vEXlOpDH2960iVq/v4GOvnh+mdQlrferrrqKq0Ziixj//+///szIG9rjcSGVUvLW71rysbfl1n5nILzbUhImpdbpFP0izzXy+G21WgVBn0gk4HA4cNZZZ2HRokUiOu/5559HMpkU3uwmkwmpVErk7iHI/Y68zmXPbfJY//Wvf8137twpnCRkGRhaU/l8PsybN4/JyXZtNpu4htls3mfvIq9F5fWo3OflsQBQJXgSiQSi0Sji8TjuvfdeTkQ9tbV0Oo14PI5kMolkMolEIoFEIoFUKpVH3MsEvSybI5dtf9fGpTzti32ud79yx0A514reM8j9T+94IYkd+XgxFFony+9Trw+U05flyAZa02rbR6Hraa9L86PFYoHVasUDDzzA5c/IgEBJ7x0OB2w2G/x+P1wuF3w+H7xeL66++mrmdrvhcrlgs9lEJLFsiNLmpdBGZ2idC0slNpZlruh/znsSGJPTE/U5uZ9XauCp9fqsUlQ6R1SboK72HNaX768aZa1F+xrIDpa9rY9y+m+h8X0goD/av54BVntMPt6XZap1/68Glyhfs7wY0wGMchfwhVDuAkl7zWIvRuvJo3etckke+V56XhcGDAxmkPcokJ/0TtuvVbkadRORzWbhdDrFBngwIxZLgHMuvO3IU5CIOkVRhGee3+8HY8DFF3+H//Ofz6Gzs0NchzbEJJVEG62JEyfi+eefZ6NGjcKePXuEdydjDPF4HHa7s4ZPb8AYyw9uWK0qeZBOp6EoCmw2G9zunj4ZjycFgZtKpcTYl05n0NHRgWHDmhGNRmGxWOB0OnHVVVfxd955B+vWrRNGUjnRIo2hw4YNw5gxY7BkyRLW3NyMxsZG4R1utMkDB0RkkZSJ1WrFnj17sGXLFmEEAoCTTz652zhgQzIJpFLlScAMdpRag8ue81rvZgB55L98HoHIf0A1qgPAbbfdxt58803+ySefwGq1YseOHbjooov4008/zeg7Ho9HGOj1nD/IMYCS/8rGnbVr1wrSn/IKyHmBOOc49thjMWrUKHFNPUcT+TnpnEwmg1gshmg0ikQigcWLF3Mi8uPxOOLxOGKxmIgyDIVCed75Wi98+Znk+9P9iOCWDSty+fQiyLXnaD8vRCDIhoX+gtYBTVtWveeTnUro+3rHtN/Xg3Z/qiXo5Qh7OaKknOtpz9WWUe9a2v/lvBQUrUZGcAB5z68lzeVnoaiCBx98kJOBwGq1IhAICAOB3++H1+vFD3/4Q1ZfXw+32y0iYShXFhmd6L4knUnGMoqKo/qSvycbFmTHD6oXinCWDQWDfX9jwIABAwZqA60hX8s7H/AGgFITaKnjhQh4vb+1KOTZ2RuLntYTQVsOAwYGM2iDRySF0+kUicFo4woA4XAYsreay+VCLBarWbkLoZg3t17/J3kAACJ8nTY9qkyPN8/b7ZvfvIg/++yzSCQSYmyQk/hREmWz2Yyjjz4ajzzyCBsxYgTi8Tjq6+thNpsRCoXgcrngdDorzqFgoG9hjOkHF6LROBwOB9xup0imS7r6mUwGfr8X8XgSAOB02qEoWeEtPGxYM+LxOBRFwdVXX83feustbNiwAQAE8UAkLhkFx40bh5kzZ2LBggXC25+QSCSEJzBFBMnRSAYGJ4goJJLsl7/8Jd+yZYuYixoaGnD//UsZzSE0n9jt1oNeAkibj0g7v+vpjusRqWSkY4zB7Xbj6KOPxooVKwSx+eGHH2LPnj0YNmyYIBPpfcn3IO9hMgDQ2kEmRdeuXZtHLNPn5Gns8/mwaNEi5na7hfxNPB5HJBLBwoULeTQaRSwWQzKZFEQ/fUae+WSwjMfjeTKvMnlZCHQe6cQDhcl37f9yveqRvvLf1L7LJfTl9RQZIkiDXo60kN+JTOhSeeTfsgY+eZrLEjhOpzPvfO3fNputqLFJdqDRO14qAp/mBaprbdslw2Gh42QwlolxitKgNSy1cYrgoB/Oe3Is0DnaZMjJZFJcn64pty2bzZaXp0EL6r/pdBrpdBqRSCTvvWkNFBaLBQ8++CB3uVxwOBwYOnQoHA6HMBD4fD5ce+21rLm5WUTbkcOOPE7Qe0wmk3n5CWRDGu13Cr0jYy1owIABAwYqgZ4Rnj4b9AaAUuiLSVRL8JcbgqRdZOhZYEqhlIeEAQODHeT5Qt42tLAmAwBjDJ2dnbDb7XmbiYHgHaM1ytFnep5QesY/2oBT6DJ5+wLq5isUioikm1/4wpn81VdfBdBTN3QNp9Mp9L0dDgfOOOMM3HvvvWzo0KHYtGkTmpubYTab0d7ejsbGRpjNZoTDYdhsjqrWj4HyoTfW1yLE1kD/gWQ3MpkegoO0kU0mVZLL4XBAURS0tXXAbrfD5/MgmUzjxht/wletWonVq1dj165dANS+T/I9gErqe71etLS0YPr06bjtttsY6X6nUikRXUREEhESRJpUe4w11jPVBbUnmYDauHGjMBhnMlkcfvjhaGhoEISuw+GA0+koK4nzYB+fyokQ1pL6cpslA5mWGCYkk0lYrVZ4PB4APcT4okWL2JtvvsnXrFkDk8mEXbt24aqrruJPPPEE83q9eQRqIckdzrlwliCD3fr167F7925wni8xQjkCrFYrTCYTfvjDH/JUKoVt27YJfX2KspQJ3FIgglx7LtUblYHWbTLZWwxyxBKRqVryXybMydhJZCyR7B6PB2azWXiAOxwO2O12saaSDaUySU/3dzqd+O53v8vkBLfyeElGFVmqUf6+7OWtNQ7IHvraqIVyUSgCYn+gbd/y+5PPkX8XM8DIx7X3oPZF0p+FcjSQVGUymdxHPiqTyaC9vT1PYko+piap7zEgyOtlba4HqjOKViFDwdatW/POsdvtePjhh7nb7YbdbkdjYyMCgQCam5tRV1eHyy+/nLlcLng8Hrhcrry8BBTBRxEFdrtdJDGW64na/MEQgWWgOCp9/4N9fjZgwMD+o5Tzw6A3AJQa4EoNoJVGEOiFmmrvXckgXMoAYAzwBgYz5I0EteWmpiYAPZtlk8mEYDAoktxRckqHw4FsdmAskItF5xQyCACq514ul+veNKobXtoUcM5Fkr9TTjmZf/TRR4L4l0OfOeeiPkwmE8477zz8+c9/ZslkEqFQCM3NzXC73QgGg2LjqpL/tv6oGgMlYBh5C+NAn99sNgsSCVUagxIfkm42oBJhwWAQXq8XTU0NiERiuPji7/CPP/4EmzdvQjweE+dZLBZBnpD+8YwZM9DS0oIFCxYwAIL4BYBQKAS/378PiSMTMsYYMbhBhBsRwHv37sX69euF4YlzjiFDmrvbjDVP912WrzlYoZ3XteMR9Q9tlACRjCTlZzabhQwO5xw+nw/HHnssNmzYAKvVikQiIaR7LBaLkA/RK4fs0UxGG9LPnzNnDqfISCL85XIrioJgMIgXX3xRrDtksl/2ggd69MtlKRj5enJ70dubyAYS8viXCXPKQyIngbXb7WIsbGhoEMlgibwnIt9iseAHP/gBIwLfZrOJ8+h4KegRsLJxgQh++ZiMYnI22vNlcl2OZtV+X75OIQKeIHuPa3XqC5Wp0Pe1ZabnLwaqH60xhhCPx/c5Ru8L6DEgFQK1H8YY7rjjDlYo9wyB8g3QPEh/JxIJ3HPPPTyVSok8E+l0GsFgUES/xGIxYUCgNTYZEyiZNPWzrq4uMMawcePGvHq75557uGwQGD58OHw+H2688UbW1NQkIj7IGEF9nAz2FPFhrAENGDBgYHCj1uN4ofvTHH9wr+7ROwOBXiSAltzTyn1o76HdSJTbQIoRjAYMDFbo9Zfm5mZYrVbhCQOoyS43btyIsWPHwmQyCY3bgQbteKAdB7SLe9LvVUn8JFKpFGw2G5xOJzjnWL9+Pc444wy+Y8f2PEkk8hBSlLSoK6/Xi+985zu45ZZb2O7duxEIBLplRPzo6Ojolhpxo6OjQ9qAG+NILWGQ/wc3EomU8LynKCg5MaGasNuG7dt34oorLufvv/8+9u7dK75PEmK5XE7ofY8cORIzZszAggUL2OjRo5FMJoWnfy6XE7kB/H5/nrGRfoisoYgrA4MXREYD6pzxv//7v3z37t2wWq2Ix+MAGEwm1q0nn4bL5UQ2m0MqlRZz04GMUu2bCHAtSUyQJUwKkdyJRAJ2ux1msxnk3Q+oUQD/+te/+ObNmwEAO3bswE033cR//vOfs2Qyiblz5wrCkvT14/E4otEootEoksmk0NunqKG2tjYhDUQe9PJvk8mUF3EoS6JQfWj3PJzzfaTAyCOefpNXPZHzLpcLdrsdgUBA1/vearXi0ksvZT6fT5D35MFPxwuhkNe8LFED5OeUkr3OZYMH5UOi78ue4YyxfSIctI4deh7u2vYB9Di4aHMs7K/8i1xm+bNi0erF7lPIg1/PiFLouLaOAcDlcuV9l+Yqkh7SRrXIP0C+gYCuK/9QtIX2OkSky+/njjvuyKsM2cApR6bE43EEg0FEo1E88MADPJ1OI5FIiNwXoVAI4XAY8Xg8L8cFGQtaW1vR2toqymM2m7Fs2TLu9XrR2NiIESNGYMyYMbjllluYxWJBXV1dXjSAxWLJk/QyYMCAAQMGKoHeWoCFQpEaFKX/UO5CqtT3C3mBUGIfrf6i3n31FjylylfIk6O/Fge9XVD2FnKIbCFvmVqi1h6oMiGjbVv9UUeVRtiUvn5PMi/aMG/duhXHHXccDwaDIoEWYwwXXHABHnroIUZhwwBgMvUs4PXKVe33V+g+eoYNvbLICcI4591EINDW1oGbb/4ZX7ZsmdhcAMgzjHDOYTarpOHEiRNx1lln4be//S2z2+1CeiCZTMLpdCIUCuVt2G02G/bu3QufL1DWcxaKYCi3fvYX+9P+ChlZS3noVRPF2geh2uUrdq39nV8qLZ88/tP19AzmlVx/IEP1AlSlWOLxOMxmMzwelTSJx5P45S9/wT/44AN88skn6OrqAgCNTFhakH1jxozB0UcfjSVLljCfz4dYLAbGGFwuFzjniEQiQhYDUPOqEAEmr0d6V2e1l2E7uFE8gpVISooCuOyyy/h9990nIk28Xh++8Y1vYNGiu1kqlYLb7YKiqNEfLldpGaDKx6fKktBUe3zQru+1JCQl9u1Zj/Ro4NOaJhKJIJPJoKurC3/4wx94W1sb2tvbEY/HsWrVKgSDQdCcTdcjQp9kQ2SdfboflYXOTSbVXCG0RiDI8oDa9QONDVQPFosFLpcLbrcbDocDHo8HTqcTXq8XHo9HfE6E/XXXXce0uvYyoV8KVBa9+VGeI7X7BDnSQu879DcZcORz5N+yhI9eW5K/r1dO2UO+mKGIIJPkegYE3U16kTZeqv33JsJdby1SSuJHlmjSk8DaH4ki+fpyjgJt3gj5fNl4YzKZYLVawRjbxyChfc/k2U/vmdbGcvn13nsymRRe+6FQCPPnz+dkmAuFQgiFQojFYiLCIBaLIZ1OC4Oqw+GA1+vFkUceialTp2Lu3Ll5N5CTtpdbV3qo9f61UtR6/Vbt/W+1oeVUDgQMpmfq6/3vQHve/uCftPv3/Hlk3/mrd2WqNAli8f3PQHtf2jl40EcAVHsClBuV3rVogQCUDgeVy1SuAUBv0aTdCBgwMNhB3jzZbBajRo2C2+1GKBTK2wTu3Lkzz7MoFArBbh8YQ1gxz/9i36Hnkb3SWlvbcPHF3+YvvfSSMBDYbDZkszmxsSe5j1wuh5NPPhkPP/wwGzZsmEjcR9qpDocDXV1dqKurE4YEq9WKcDiMpqYmpFJGks+BinLakIHBj1xO9bAl8j+TyeGKKy7ny5evwKefrkIikRBkABFH1PcDAT8mTJiAI488Erfddhtzu93IZDJIpVKw2+1QFEXoiLtcLuRyOSHLQOR/ITKqP3CgExi1BhFeRHCRPBQlmx83bhyWLLmHxeNJuFwuJJMpMRcnk6VzQAz291Oq/cke/TRfkyRINpvFnj17sHjxYh6NRhGJRMQPeeiHQiGk02nEYjHEYrG8/YJ8byLvScqPEu7K95VB77W+vh5jxoxBQ0MDPvnkE0QikX3IfvrfYrHgiCOOwPjx4+HxeESkkd1uh9PpxJVXXsmI3CcJHooCkjffWgeoQp9rcwloCXoqY6H3Io9JemOU6gBhzruefK48fxbydJfLJBPz9LlW+kgbZaD1IKdztAYG+aeQbE8x8l++vvxb64GvPbdU/5UjSuV70v/a49r3TDko5DLoGfDld6L3fIWeXY7A0HNSoLqm/A3a4/T88jH5OrIxHeiREKL7UzSNHBliNpuFzFQul4PH48Hvf/97pm1LVHdtbW2YN28ej0Qi2LVrFzZu3Ijdu3cjHA7jxRdfFGt1MvhRroly+AEDBzaq7UBlwICBWiMH1ZDQ29+loZ1f95nng8HQPifrXeBgRW8twHqLXDpP79xiGoz0Pe31tAu9Qt4ZegSSdhGpTa5Fn5VroOhLyN4Z5SYhqzYGQvsvtkguZQCqdfnL8bAD0E1QObBnz140NTXhK185lz/77LPCiwcA6uvrsWLFSjZ8+DBEIlGR0I7CZWmzLi/U+7IN6V2LIhgKQVEUOJ1OKIoiwu5pc9/Y2Ih4PCnOMZlM+Oyzz3DuuefwDRs2CKKGjABUT7lcrtuT34azzvoCli59gNXV+REOR8VGSPXmdO8Tul/OM8koFeJeCrXwoJH7i96mUe/caqEQcaJXlmpAz/tR/r/c/tkX99+f45VevxTKfQeF2hHnWbFZJ69g+RwqH5EFHR0d8Pv9sNlsiEQisFhsQu4nk8lgzpxr+csvv4z169cLgyjQQ5SR9Nlhhx2GSZMm4d5772N+vx8ulwOcA8lkSoyFNLcXQ3/V3/7ev9rlr/T7Fc+/vAKjC8uhlAcTjd+JRAIejwe7d+/G5z73Ob569Wq0tLTg448/FsSVnr42zaFaEph+03xEbV0bqSh/n6TuqFwkRyNfSyvZoud5L5+rJWS1CXOJiKN70/xYaF4jKa1UKoV0Oo077riDJxIJhMNhhEIhRCIR8TuRSAjv/nQ6neetLF6RZoyV1yiU5DSZTIrfdI5MvNrtdrjdbni9XgQCATQ2NqKxsRE+nw8/+clP2JgxYxAKhTBhwgTe1tYmvitfBwB8Ph9WrFjBRowYUfb6fqD3P/012eDxEC2FWo/PlaK/1lcD9f5yHh3q5wCwYcMG3HLLLfy9997DzJkzcf/99wvjPY1hepxBX6PW9WOgujiQxkJCsWfq6/2pFv1dh3rlkzm8wTQ/lJqr9SCvUfTWn4UM5Npzq4Xezj96jghaYl/llNT/s1me9z9jZuk8BrO5eISYyVT8+QeG++xBDO0GsjeL8lKNvFjjp/voXUO/kRa+jgED+wvZyyaZTMPpdMJsZhg5cqRoo2azmiC3s7MTN954I3/44WWMkuvR97VkxECBvKhPp9NIJpMilD4ajUJRsqir8yOVUnDxxRfzZ575O2KxGMxmyz7kv1xXLpcbX/ziWVi06G7m8/kQDkeRTqfR0FCPbFZNVmb0XwPFMJD6yWCFw+FAJBKBoigiQSV5HpLmfjabRWdnJ6xWK5qamhAOhxEOh9HY2AgAiEbjmDPnWv7WW29hxYoVANQIp3g8LjT+aSwYP74Fxx57DObNm88aGuoRiUS779MjowagLPK/L1BrArAWBsbe3L/6oI2DPhRFEZEeqVQKw4YNwyOPPMLuvPNO/otf/EIk1aS5Vru5KuThTWtHbRJY7aaU5j7tZi2bzSKTyQjDGP2vvYecpFXPw5bWAbKRgiQCc7mckAIh+TvOOVKpFKLRKBKJBO68804ej8fR1dWFYDAofkKhkPCcp4gavXwIWqcc+kybVFauH3mNQrI/dC9A7cfnnHMORo4ciWuuuYa5XC54PB44HA7hMERyKPF4HLlcDldffTXv7OzMK6NsROCcY9iwYRgxYoRwIKAoEAMGDFQHsoMfY0x4+o8ZMwZ33XUXy2QyCAQCIlqHoq8AY31mwIABA4MZhcbwnvU2B8AAqL/VpWLP/+r0QWtymktobVmOykTx8hkGgBpDzwBQ6H89a2ex8/W+K29GihkbyrWg1doDw8DgBrVB2sSr3vJZzJ17B3vhhRf4pk2bkM1mwLs9Jd97711wDkSjUTQ2NiAWi++z4abrDgQoiiJ0UsnLP5lMioiAujo/Nm7cjK9//QK+fPkKZLMZ2O12kQxYTnbMGIOiKBgzZgy+/OUv4847FzAASKcz3UYBFxiDiIjQ8zqvFP0dFWSg79AXHiODDdVuq9GoGnXjdDoFGZlIJJDJZIS3sdlsRn19PQAglUrB5/MBUDX4b7zxR/ytt97C2rVr89YCqVQaZrOle+ww4fDDD8dJJ83Gvffey8xmBkXJgjHA6/WAcwiJAjISEtFYbYK82hEeAx21NkCUAt2fIk7sdjumTJmCxYsXM1krvlBklNyG9MhurV42edvT+TJxr6ezLnvNk2e+fI58LZlMIwkeoEcvXy5HJBJBLBbD/PnzeSwWQ1dXFzo7O9HV1SU8+Ekuj7S85WcnpwJZDoSMCXQP+iEyXv5cLjc9O8nteDweBAIBuN1uNDY2wm6349VXXxU5OjjnaGxsxKJFixitE7Rr+Ww2C0VRhKFw5cqVYq2gNd5QcvHJkyfvEyVpwICB6kGORibnAJLeqqurA9AT7SQb42g/VAtZPgMGDOyLWq/lDPQ/qvXOaY1WSkGi0PhfbrlKrfMMA0CNoSVl9Ih6PeKmWBSAluTXHpf/127wtKE0BgxUE4wxQV7ZbDYwxhAMBjFkSCNOOOEEbNq0CWazBdmsGkq7detW/Nd//RdfuvQBlkql87zqiDzQk9WqFkr1EQr51cogULKxb33r2/z5519AZ2eHKDfpgJK3UM/G3oSTTjoRTz/9d+b3+xGJxJBMJgWpwDlHNBoHoCb+0/NY1KJcgk7r4WiMDYMDevPLgRgWXCuQTjYA4Y3rcDjytJljsZgYo8hLf86cOfzNN9/EihUrBTFA1yNPQcYYWlpacMwxx+BPf/oTYwxIpRRwrhKloVAEfr8XnJdvsO9rVPt+tQ7hLYWBbuAggt1qtcLn8wmCnmRuaH4C9l1rar32ZdDnlF+C5i5ZYkcbCUCJLeXv029Zuoe8+LPZLBwORx7hTddKJpNIp9O4/fbbeSgUwt69e9Ha2opgMCi8+8lIQJ61euWXn1NOMEpRBNQ3qfwy5CgfioQwmUzw+Xzw+Xxwu91oampCXV0dhg4diptuuok1NTXBbrfn3TMcDuN73/sef+aZZ8Q9Vq1ahWw2mxdFRO+G6omMBXv27MHWrVvF/bWJS7PZLDweD+bOncsymYyQG6PoolrCmH+Kw3CwGtyQZbjkfCLpdDpPopTWCzQ2Ux6AavfPA33+M2CgL1BIasho/wc3ynEAKuSULRsAikUKyNfSotT8UHL9YOQAKI7eenjJC2+9kGntuYUGknI8sAptyuS/y/Eg0DMA6JVXD325QDVyABQvg15ZDoQcAKR1TQviRCIBr9eLVCqF6dOn8S1btiKbVTfYZrMF9fV12Lx5C6NNrOx1SEm9iHCr/rOUHoDT6TT8fr/Q/m9ubsbWrVtxzjnn8BUrVornymYzYgNP5AKR/83NQ3H22V/E0qX3s3A4Kp6PEnuSxFAmk4Hb7YbNZkEslihpDOlt+yi0ENrf61ejj2vHs2L36y+CUS8ao7/HN705plQZDA9xFYXakc2meumn02nhxUcbd0VRhGcy9cMbbriB/+tf/8KKFSvAOYfd7hDEKCXtzWazGDNmDM444wwsWXIPy2Rygmil+Vwd5xgymdw+awiZyK21BE6l73cgji99ev+KcwAAxeYg8mK32WyCjJIJJq18Dn1Hb+2qPU6e5PS3nsSN1WrNyxFAJJjs9UoEv+w9TwR8W1sbFi9ezMmDPxgMorOzU0j0BIPBvGclUly7fiQjBR2n62uTzMqQ5fcoMa7D4YDT6YTT6RSGd/Lor6urg9frxZw5c5jP54PD4dhHYkfOE0L1kUgk0NXVhcMOO4wnk0mYTCZ4vV5s3ryZ+f1+3bkjk8kIyaQrr7ySP/DAA7rGGqrro446Ch9++CGLxWJwuVzCu7gcJ4FiGIjj98Fk4K71+FcKtTbg1vr+NN7I0Up6e3LZgNhf+v99gYHe/g52HIhjYbFnqvYz9vf+Ue/6Mv9X7fV1X0LvXuXsHwo5O2sdVOTzyn2uSsev3kRo6fN4+TnjtH+X4nw5r8zZ1YgAqDEKWYfKhTwI6DWgQtcuZKTQHjtQJg0DAxPZbBYulwvZbBbJZBKMMdTXBxAMhlBX58cpp5yCpUuXSgSDSgqce+45/PnnX2AyAaEl/PtigqwU5H0XjUbh9/vh8/nw1a9+lb/88suIRqMAWPdGPCMIGpJmSKfVnAhHHnkUnn32WRYI+LB9+04MHz4cZjNDIpGCzWZFPJ4QERRms1l4fVoslj7vv8aYMHhxMHr/V5sgUBQFqVQKZrMZbrcbuVwO8XgcZrMZXq8XiUQC2WwW1157LX/zzTfx6aefAoDQJE8mVfkRWkiOHTsWs2adhPvuu4/lcrnuPm6Dy+WEomSEfjfnHKlUJo9YJcKScqOUkwdgoBPkB0MbrQwlQny7SX4yLJGhHVAjUyh6Bdg3AhQonASefmvJbC3BD/R4vspkezqdRjqdxvr167F48WIeDAbR1taGjo4OdHZ2IhqNiigF8rDXawsySU/3lL3kyRCgTdAtaq/7fIvFAovFIkh9NbG2C83NzXC5XPD7/fD7/ZgzZw7zeDxirpWlh+h6nPO8aD5t8mKLxZJXPiL8hwwZgm3btsFkMiEcDuP666/nd999NyPjhTZ5MWMMNpsNW7Zs2ef9yP+bTCYcddRRANScRLFYDG63W3ghGzBgoDqgiBs5kgfoGVej0ahwWtL270QiAafTWZNyGzBgIB/GWvTgQ6X7w0IGnGKcrfxZISdW9RwT1FwB+w/DADCAoEdYFmuA5XiV0sajkEVJjyQo5nHeWxiDpoFiMJlMQi8b6BnwTCYTEokUFi/+A3v//ff5mjVr8hL/vfrqq/j+97/Hf//7eYwkNxhj+2jv1ho2mw3ZbBZutxuXX345f+WVV7Bt2zbRLxwOB5LJpPg7FotBURSYTCY0Nzfj7LPPxl13LWJq7oA0Ro48BK2tbcjlchg2rBmhUETcx2q1wmQyIR6PQ1EUOJ3OiiNEinkVGhh8OBiNANUEY0wkMiXvXep3kUgE1113HX/jjTewYcMG8R0iDxOJBOx29bvjx4/HCSecgN/9bi4LBNQcAYlESiT9zmRygkywWntIO5ncrMV4VymBX+sIlEpRcf9h1ZV4oHww5FlK5DPQozOtB3ne0JL3sv69y+UCgLzEu9lsFqlUCul0GnPnzuXJZBLhcFgk2iUP/ng8jlAopBvtWWhdK0cfMMbyPGfpPNnjlkAa3ETm19XVwe12Y8iQIXA6nfD5fLj22msZEf92uz1Pxku+tlwO0u2XZY8450J2iCSWtGMu1X06nYbH44HJZMKMGTOwbds28UwbNmwQ9Uvvi6KFyOCSTCaxceNGcQ/OuXAgoP9Hjx6NefPmsWQyCYfDIepqIKyPDBg4kEGSf/IPRe8AgMfjEefmcjkh/WexWIRDgQEDBmqLQpEGxhx6YKPSCOdS6+t8foUccOTvF7pX37Q7QwKoBHr7gmXiUS+MWnuullgrtxyFCHzt33pe/XrX1ZZDL2GbHkptgHuzgDEkgIqXQa8sg10CiJLiUlh6IpEQRDZ5x6VSKYwYcQiPxWJ5mpoejwcff/wJCwQC8Hq9YkMN9EgBVRriXupZOC9+fbvdjptuuon/+9//xieffCIW/gC69f2VPN1vk8kEt9uD448/DsuW/YU1NtYjlVJEYlGv1wuLxYJYLCaekTGGVCqFbDYLu90uNhlA6RC1Uu1D/r7eIqhSD+tq9PFiEUz9HcKpJYyKlaVa9y9mVK61B3itCdpy71+oHaXTSXg8HhHB5PF4kEwmcdlll/H3338fa9euzfP8lccot9uNlpYJOOaYY3D33YuZyaQu+NJpNXG4w+EQ0ihms1l4ERJJoMq4mKAoPecAPYlTyXhQSf1UilpLBJQa/2r9/JWj+Pul9aFMmJMhyWazIZVK7TM20dpLNhxo5XMURUEmk8Hu3buxePFiHgqF0NXVJUj+YDCIWCyGdDoNRVHydPjlNafWo12Wv9AatUrNNyaTCQ6HQ0jyuFwuDBkyBB6PB/X19fD5fLj66qsZyfaQ4U4uA/U32RtLu/6isnHORa4dPY1+Oldbfjlih/6PRqPYsWMHpk2bxul6zc3N2Lx5M5MjK+QyMcawbds2jB07lssRGaTxT2uo0047Da+88gqLRCJwuVwwm81IpVJCPrESVNq+q2HgO5AM3OWsnyv5frUxWOb3at1flua02+15jk707pLJpDAWypJB/ZEAuNL2MdDb38GOA2ksJBR7pmo8Y7F7VLuPFvIgp9+1nn8rvVc5+0OtZ7y8HpPXRPJ55T5Xb/iP/YG8/9LjaWXHFfpd6Hnlv3s+q6x8lloThHoYSATF/n6fGmelC7hS9y22wZc9t8q9HkG7WSv3e1povai0KHSfcuuvL6FP8NZ2gSnfpxYGukqfvxwCSN6IypIERGQHAj58/etfxxNPPIFQSDVYms1mRKNRzJ59Ev/617+OBQvms0gkJgjwWCwGm80mNsGyDjFt0Kl9yRt6KjOd43DYEY8n9tFNlo0TgUAAnHOEw2FYLBb4fD7E43Hs3LkTl1xyCV+1ahVCoRBMJpPwzgMgpDrIa9JstmDy5EmYNWsWFiy4k5nNZsRiCQCqZIjVahXJEeWkYVQf9Jm8ueirBUKhybZSgq/QdfbXw2KgLXhrXZ5KDUClUOs67qv2VwgWi0VoqHPOEYlEuiV5HMhkclAUNWm53++Hx+PB5Zdfzt944w189tlngpSnPirnBTjqqKNw3HHH4Xe/u4ORUUBu83Q/IguBHp1guZ9nMsg7RyZVCz1bX76zSsf/Wre/Su8vR5zJ+s00pjscdmQyWfHutGSu1guf5iSas+T5UCbm5flL1pWW5zpAfxwlQ5RM/stznjwfxmIxRCIRzJs3j5P3fnt7O7q6uhCPx9HV1SU0+ykKQJ4ftHrW2vmXPNXpvnKiXZobqd7IaOF0OoWX/tChQ+H1etHY2Ii6ujpce+21zOPxCI1+vfGXftO99RIEl3LGofouZGjX3kv+Lr13Ivk45/B4PBg1ahTGjx+PVatWAQA6Ozuxc+dOjBw5EmazGYqiOguQJ386ncb//M//cFoPFCrLUUcdJeQEFUURxgfZGaHYsxqoHWptQK0UtS5frfkDMsjJc7Z8DECejJgcAd0fqMb8q0dYFTrXQHUx0Ou8XH5BOycXml/7GqXad7nlr5bj2UDhp8q5v15ZeuOgpMcR6H1WyECyL3leef3sr4OVtl3o7QG05dXyL1oHmmL3l7ku+p8xZkgAGagMlRIs1b5/uR28kJW31gPowQ51o5vBAw8sZXv37uXPPfccAAgt4927d+OZZ56B2Wzmv//9Hay1tQ0WiwWBQAAA8iICyJORiDgKpydigRbp5OFIOvzkWUibZpLoMZlMguwnmR+TyYTrrruOv/POO/jwww/FJpvIeyIdehLwqbJFo0ePxuzZs3Hfffczu92KaDQOwGh/BgzUEslkEmazGfF4HIwxkDxPNBpHKpVCQ0MdAODGG2/kr7zyClasWCHycQDIMwJYLBZMnz4dxx9/PBYuXMhU40J1I5QMVBeU5JZIcJmcZ4whlUoLg47ZTAt4QFF6PPFpPqDjAJDLQUSVkOHZajUjl8t3miDCX7637LGvJeRl8poxNSIgkUggFAph/vz5PBQKobOzEx0dHYhGo9i7dy8SiQRisRhSqZQoHz1foQ0QzY80T8uerzLJr9aHWm5Zg59I/Pr6ejidTqHBT0l2/X4/HA4HMpmMMPT31F1P/eh5uA+kOVWW6HS5XDj88MOxZs0aAOo65Be/+AVftmwZI3kxAN3tSvXgX79+PYCeOiRjIn02atQozJkzh9H6R3YYoPsbMGDAgAEDBgz0Jaod4Vfqcy1B3tu132BfH8lGAj1jFOvqChe9QC0Wy4MpAqDQNbUe7HphKaU8jcpBtS2AlXqg7G8EQrnvva87qPa+/eWJUQxye9Ki2gNUrS3MJpMJoVAIDocDPp8HZ531Rf7qq68inU4LL1lFUTB8+HB8+cvn4J57FjNFUT3r9uzZg8bGxjzNTdlbknMOm80mCBxtlADJdhCRQDI7+VrKqodPMBjEj3/8Y/7hhx/is88+QzqdFhIeZDDQRg9wzjFmzGGYPv1I3Hvvvay+PoBEIiVIx0IJ+nozAfZl/9cbz/rCgq5n4abflUQA6KFanhgDFdV+vmpHCFWKStcPVqsVqVRK9N1EIgG32w2bzQLOgc8+Wyfkfij5L/UNq9WKdDoNu90uNP7vueceBqiGSZUctQLYdxwvd94p5O1f7LkHUgRApaj1/CRDHhNlApzmF9krXp4/tBIyWj15+k3zmOz1b7Va87yBKLpATgatKApisRg6OzuxYMEC3t7ejvb2dkSjUQSDQSQSCUSjUZE7Rlt/WsOCfH06R4580FuT0HuwWq1Cksfj8cDr9cLtdqO+vh719fW49tprWV1dHZxOp5AC1M6D2og9zrmoQ5pPKGKg1uN7OetjMoq4XC5s2LABRx55JE8mk8hkMpg+fTo+/vhjFo1G4XQ6YTabkclkkE6nYbFYMGTIEE5RkfL8TNc9++yz8fjjjzOqy1RKTSouG4+Kodr9u9oEgWEUNVBNDPYIjWqgUJ0cjHVxsKMv3rnMfchzHFB7/qMUKo0A0DuvN9EP1R6f+mP9rb1GsTrR/q23jyp0rh6qbwAovX8rxo+U2icS16SNHqDrGREABoqiUg//ahNEfT3AaScYA7VFPB7HkCGNiMUSiERieOqpp9nFF3+bP/bYY8LTjTGG1ta9eOihP2P79m38kUceZSaTCcOHD0M8nhAe/EB+bgnypAOQR24APQNlOp0WHpZmsxl1df7u40BnZxC33PILvmrVKnzyySfo6uoS12WMIZlMCgkHmkiINBkxYgSmTZuGxYvvYXV1dbBYLGhr60A2m4XP54PFYkEikSgpoVVtyCR8NcIuC4Xl9YVxwYCBSkGkvtWqEvt2ux02mwXr12/EjTfewN999x20tbUJwp8kOqiPTJgwASeeeCLuv/9+BqiyHhaLRWiHm83WPJIX6F371+uLxvzVf6AFtuxRLf+QZ7vNphp6OO+Zg9S5QJ0XKA8MEbMkp2O32/PIfEpOS22DEsjncjmkUim0t7fjjjvu4O3t7SLxbjQaFbI9suyLLBskf0bGCW0EgRxpoG1jNK9ZrVZ4vV54vV44nU40NzfnSfRcffXVzOfzCQ1+ktaTSX4y6mcyGWHAkOdtitijCAagRyJInsMB7CMpJP+me9USZDihco4dOxaNjY3YunUrAGDbtm1C8oeiichx4cc//jEnaUGqH5IYJE3x8ePHw263C4cJAEJKiNqUAQMGDBgwMFChXSPTZwaKY7DXkZYX0ELv+coxQJZbLwPJwUgP5TxHsb2kYQAwMKhRjgWsNzCIx4EFv9+PcDgKn8+DSCQGxhj+/OeHmN1u588//zw6OjoAANlsBskk8M9//hOjR4/mZ531Bdx11yLmdDq7NThN3ZrdiiDzibAjgkX2aCSvRtpIW60qQdHZ2YWf/vQnfNWqT7Fhw3rs3dsKQCUlaJMue2nKyfay2SzGjh2LY489FgsXLmQNDQ3IZHJIJpNIJpNwu90A1A06SQrJsgu1gl6fKNcYUOsIpEox0BcABqoL2nQEgyH4/X6YzWZcdNE3+euvv47W1lZwrpJyNpsNiqIIqaBp06Zh+vTp+NOf/sQSiQQ6OzvhcDjg9/sFWedyufIkgPT6WG/a12Bf7A9G0PshD36tTj8RrYrSE10me9Nns7k8b3qK/CLDcSqVyiPgI5EI5s6dyzs6OhAOhxEMBhGNRtHZ2Sl0+Wn+Afb1JNIaKgDkGTDIu1wPdJ7NZoPD4YDNZkNjYyO8Xi+GDBmCxsZGBAIBzJkzh3m93m5jmU3UkZyfgNZtNDcmEglRhzQ3OxwOXS8nuT60UWn07DSHOp3OCt9wdUFlJ+LearVizJgx2LJlCxhjCIVC+MlPfsIXLFjAkslkniHos88+y7sG/U11MmrUKPzqV79iAPKkkipN/GvAgAEDBgY/BsP+ptj+04CBYtDyf9p1ca0jmPsL8nPLa0TDAGBgQKOcEOpiGOwE5MGOaDQKr9eDvXvbu0kHC4LBEP785/9jc+Zcx59++mls2bJFeBFmsxl0dQXx+OOP4/nnn+cnnXQS6urq8OMf38RGjRoFj8cFzoF0WskjXdQQefWe2WyPB6KiKPjpT3/CP/vsM2zcuBF797YhkYgLz0O73S6kGbRJ+IigsNlsGDNmDGbMmIE//OEPzG63IxKJoKurCyaTRXguyuRHOp1GR0cHPB5P/1e6Dgp5YPRliJ8caWBE4hgoB9VuI263E52dXaivD+DGG3/EH3vsMWzdulWSZVP7eiKhJuseN24cZs2ahUWLFjG3241oNArGWLdskE14ftPYYrHYit2+bBQKIT1QFrADGSQ9A8hzCQNjQDrdQ8bLCYCpDTCGvGT1oVAIO3fuxMKFCznJ9oRCIbS1taGzs1MQ/NrkwQQ5XF5e7JPRgT7XniNfT01y7YLT6URTUxM8Hg8aGhpQV1cHn8+Hq6++mjU0NMDj8eRFIxApLxsUKEIBQJ6HPt2T5ki73Z43b2az2bwIP1kSSTa00LxJ55F8Enm76yW6HUjzCjkjkFwgoEYBvPXWW8KTf+PGjQB68ghRVCB9TvVAbQpQ62LKlCnwer3ifwB59UXRBwYMGDBgwEBfo1IDg3atYuwLBxb6QyJQq0DQGwmgSiOkS5W/UgnF/gCtmeXIXVpPGzkAqvB8PeTA4M8BUCnKHSD218O4LwwAhciTctAfk5HcnrSotQZetdsXEew2mwXhcBTRaBR+vx9WqxU2mwU7duzCd7/7Hf7qq68CABwOJ5JJlYwjUoWu43K54Pf7UV9fj7q6OrjdbkFi0AY6Eomgra0NbW1tCIfDaG9vzyN45OdWr9+j3Sy3ZZvNBpvNhgkTJuDoo4/GXXfdxQAgHA6L43a7HYlECul0T6LITCYjQv49HhdiscQ+dVKozvU+r8b7kftmXxnY9tfDQ29Mreb5WtR6fC2Fapev0vqp9vxXKTKZDNrb2/HNb36Tv/32WwAAj8cDRVGQSqXAmFqGESNG4Pjjj8fdd9/NGhsbBXlJnreMMaH7T5FHqrxJcW/c/akfrdd3seOVotYeNLXun0TmkzwLEd+URN7pdOaVMZVKobOzE/Pm/Z7H43F0dLQLiZ729naEQiEkEomCUjvaZyqkcVpsXUCyRBaLBYFAAG63G3V1dWhoaBBz4w033MAaGhoEMS/fh8Z98ibXMzrQj5wMW97AU0QcSRzJkklyDgSqX9lYQOWR19jauqLjtfZ2L6evkVFEURTYbDZs27YNM2fO5O3t7QCASZMm4ZNPPmEWi0UYDHbu3ImJEyfyaDQKIH+tAwB1dXV477332Lhx48TYQ/WqKEpeLodiGOjjd6k1j0EWGagmDAexfVGoTg7GuhjoqPb6qdL5Rd5jVnstW+j+lUBLXms/L/f7emUqp2zVfr+Vrg9Kla/U+lc+R14D9te+oPL7VJYDoFzQ+lteY5vNZiMCwEBx1Jrg6Q8UK6OxaKktIpEI/H4vdu9uxbBhzfB6PQiHI8jlcojH42hsbMQrr7zMrr76Wv7KKy+LsHgi1IlYUBQFXV1d6OrqwpYtW8q+v9lszpNK0Ooi0+dERJjNZjQ3N2P69OmYO3cua2lpQS6XQ2dnJzjnqKurA+cc0Wi0m+RhIj9BJpOByWSCz+dDJpNBZ2eXkIKoFfrKy9+AgcGIK664gr/22mvYsWM7zGYLTCYGIt0AwOVy4fjjj8fSpUvZqFGjoCiKSOINQMiYEEHcQ/wr3brcjqILvN72PWO+6l9YLCaYzSZwDjAGZLM5RKNRdHR04O677+YdHar2/p49e9DW1o5IJIxkMolUKtXtrV34XctEu+wdL2+qCxHctMB3Op2w2+3w+Xzw+/0IBAJoaGhAQ0MDrrzyStbQ0ACHwyEiVAjynKdNrkvHiVSWyX3y/qf5UWvIkJ+RjO50H1m/n56TvNTJaCH3Efm7cv3IGx2t4UL+rS1PLUAShGQctNlsaGhogNfrRUdHB3K5nIj+GDJkiDCG3HrrrTwaje6Tx4GMIj6fD2PGjBFGBUoeTPeT36UBAwYMGDAwmGCsdWuP/jQA6BlTChlIChlc5PMPlmgSbdSsDBYKRWpUrL5BrRfwepA9tsnLRt60yV5L2gapd62BjL4on9bDXc+ja39RaYRAIW+icq1w2vO019BuwrTlkTfieoNYKQ+3vng/2rLL5ai2N6kcsk5l0Hr6pVIpuN1u5HI5XHnlFfyNN97Ahg0bBIEgyzPIBD5jJnCe26eO9fomsG+yRLPZDEVR4Ha70dTUhDFjxmDChAn43e/mMo/HhWQyXdLyX8pDolDYWyUeBL2FHjHVXxNnOeUvVjdy/e5Pmasx/tbCQ7FQHe2PB0Zfotrzm6Io8HhcSCRSIp9HNpsVxGYqlYDP50M0GhX65vF4HJFIBP+fvX+LkR1Z7zvRL8jMuqy1ulf33q3urQtsQdo6lubBEDA6gOEnG/CLXywBejSOq2r1lmWMJcvavhxYHlujkQWPdTSyx7IteKReVaUHwQYsQ0cQfIEHBzD84sEBJPjYgF+ko8uxbnt3997dvXqtqkyScR6yPubHLyMYJINMkpn/XyGRlbxEBINBMvhdv+u7vsv+yq/8Srk972OtpbOzM/r6r/96+j/+j/+X+cxnPkOvvfaEsmwTtkSGQOkL330kMYvKet+92mlhYvja8N+DZJgQ1/0/1F5trc6/WZDJYZFczzlrbSUMjLSw5zAxi8Wicr+WAmTfvVPjmntIzzHdNhbYrtdr+r3f+wP6h//wf7Pvv/8+felLX6IPPviAPvzwK/TxxxtL/qKwpZeYrm9TZ9ViXlu1y+31s4LH6+npKT1+/Jhee+01evr0KX32s5+lt956i15//XX6G3/jbxjOT7PJZbOs9EeWxXkQGtPcU8v94lY/PxvekmtcD0r2EuF7zGq1osViQd/5nd9p/9W/+lfleP/BH/xB+lt/62+Z119/nYiIvuM7vsP+yq/8yk4dPL/5s3/2z9Lz589NaP4bYmgLwb6fL1N/XwKHBTwAdoEHwP5pamE+93NQd1yuPhh6/jB0f+r3CDlXbGIgFHt/Cpdf/54Tlm8099DU3iCb81udu7eZ9zetc1/4vB1cc2f+5Pm6soz7gD+LxaKSe4toaxyUJAk8AMBhM9QFzBdbG0Esb193g/LdBICfR48e0f39Pa3Xa/qpn/pHJssy+h//x79pf/u3f5v+43/8j/Tq1St69epVGdd/2/9bBYx+sPIyDVtVPnnyhM7Ozui//++/g77u676W/pf/5e+ZR4/OqCg2cY9fvHi5Y4EIhkFfh3qiEBKGgsOFw2xtrttTWq9zur+/L62Jz8/P6e7ujqy1dH5+Tl/+8pfpb//tv21/6Zd+iX73d3+XiDYx0VerVWk5+/bbb9Of/JN/kv7ZP/tn5qtf/bj04LHWViyZOVzHMcMW4uyFRbSdrLLylvtMhm3hz6NHj8qyZLJ2/WLBChp5v2WvC95PCtj1/UGuk5bod3d39MEHH9CP//iP2w8//JA+/PBD+uCDD+grX/kKffrpp/Tq1caa/+7urtKmrbI536mTSD5vqpbq2liEyzo5OaHz83N6/fXX6Z133qGv/dqvpTfffJN+6Id+yJyfn9Pjx4/LcD1cXpqmZXg5qUSQL0ppuuzjNIOOSAMH/k6ShJ4+fVp5ofut3/qtMp7/+++/T7/zO79T3m/kvtZaevz4MX3uc58rQwoCAAAAYF7UvasOYdzXFrxL7weXobiWc/B3VUGQ78i1+D3WWiQBBgfOkBZGTa2T6wSQWkvts7Z01Ymb70ZA89prr9GjR2f06tVGwPHkySP6+3//75sXLz6lxWJBP/RDf8P+2q/9Gv3Wb/0WfelLX6JPPvmkTLAnX5DlTZS1pK+//jqdn5/TG2+8QV/zNV9D77zzDn3uc5+j/+l/+hHz2muPab3OSyHT3d3GWnW5XD5YF99XwiqA4XApAZgmlsrgMFkuU/r0008frGwt3d/f03K5LC3H7+9fUVEU9Prrr9MHH3xA3/3d323/w3/4D+X+Z2dndH9/T0SbJKZ//I//cfrFX/xF8+abb9KLFy/oyZMnD54B25AlbHVxCGPL57kWUoBLS3/+zcJKvr9KbyxOYMpecZwYlz0zpOU/J3nl+y4nYJfeAlrAnySJw/o9K+/Tn3zyCf3kT/6k/fDDD+nLX/5y+Zz45JNP6OXLl/TixYtSgUEkE71vn9OsVJIKDJeiQXsrSMEvJ9x955136I033qCv//qvpydPntBf/+t/3Xz2s58tnydc//39fUV5wsoOTjLNIaikVwPvv2lT46EABmCxWFS8OHlcvP322xUB/q/92q+VY+hHf/RH7Ze+9CUi2r7M8b7WWvrGb/xG+jt/5+/AagQAAACYKS45UBuh/dAC/kN4x5kyde9YPKfXxsXS4p/n/PI8yZCdUACAg6bPG1TIet+3jxby65t5ncW5LMNV57F7B5ydndEnn3xC1toy5v8HH3yFkiShR48e0cnJkv7X//UnDQuKXrx4Qb//+79P//Af/m92Y8H5ilarFd3d3dF6vaYkSej8/BG9+eYb9Nprr9GP/Mj/bDjMwnK5sZZk4c4nn2wUDJzwkS1+2RITwv/94npYupQCUKIdD0Wx8QJI05Revtx45ZydndD9/eaaXS6XdHp6Sl/84hftL/zCL9B/+2//jYg2++R5Xsbz/4Zv+Ab603/6T9NP//RPm08++YQ+/fTTinulDElDVBV4HzJ1zyyizb1SC/D5XmyMKUOeLJfLUiGQ55tQSnxPl/uzcJu9Nk5PT0ulASdzl14XrBSwdpN35cMPP6Qf//Eft5zk/fd+7/fok08+oQ8//JA++uijyjHoxKpEVDkOay0tFkuylsjaqjKZ28HHwX1ydnZGr7/+lN588w168uQJvfXWJt77m2++SX/pL/0lw8npz8/Py/BI3Jfr9ZpevnxZuvZyovksy+j+/r4MI8N9wSFl9HmRSXRjQwCBOJIkKXP/8G9rLf3Nv/k3zc/93M/Zr371q5SmKf3u7/4uvf/++/TGG2/Qb/7mbzpD23Gc/2/7tm+js7MzevnyJeYgAAAAwAAMLX/xCYDbRqCoKz9ufVT1oCFu72G7834il/vOXcUQCTkA+ke7YSAHQLgMbRHniunWhb5iwPWhga07v1IJ4PMC0Pv31Uch6trTt4JF0yQHAAuUrN3E5j45WVCWFfTpp5+W28iwEzLEw6effkrL5ZLOzs4oTTl+NJExm8+rV/feuo0xZQzfk5MFFQWVoUJkzPC6Y0QOgH7w9U9I2D/GcYyhgPD1z9gWHkM/31692sT4J9p4C52dnVFRbBK1np+fkzGWfuAHfsD+83/+z+nly5elZxDz+PFj+mN/7I/Rv/gX/8I8fvyYXr16VSodP/vZz9KLFy9LC2x+nstwLn0dnz4PXO7QOQBcCmrf/d/3rJNt0OF7XDFO2UOArerv7u7KEDsnJyd0dnZWKlrYo4OfAx9++CH92I/9mP3ggw/oxYsX9Omnn9LHH39M77//Pn344YflOXbNMfSzwVpbKoV9c5M0XVSWJUlCp6endH7+iE5PT+hrv/Zr6enTp/S5z32O3n77bfrrf/3/bp4+fVo+b169elWJyakn7y9fviyTR/NxMjoZPY89LoMVAnWEYriGQA6AekLtlwoA+b6QJAl9y7d8i/2N3/iNUqHzF//iX6Qf+7EfM3/0j/5R++u//uuVHEcyjNZ//s//2XzLt3wL3d3dlddJV2L7N7R/38+Xqb8vgcNi3+N7DtRZrB4awz+furXjUM9B3XG5+mAq56cr2lvUtS6G2ByS1u5v/iWPd2tYe9g5ABhpSCw/nAOA93e91/jkN9YiBBAAjZA3FS2QrqPuBdwnnHFpd10XMdhYRT569IjOzzexvl+9ekX391sLR5mQc71elzGRef2jR48oz/OHhI1bRcJisaDT01Mi2hX6SAvKJEno7u6OPv54Y2nJVplEVFq5guHR10vd9YFr53jYWEITffrpq/I+cHd3R0+ePKHFIqFnz57ZX/iFX6CPP/643IfzAnzd130dfdd3fRf9vb/39wzve3Z2RqvVit544w36gz/4A3ry5PUy7A9PQENKvWnRTAGpn3lyMkrkt0gyxlSE/izMlgnX5aRdx/FnAb/Ms/ClL32J/u7f/bv2k08+oS9/+cv04sUL+uCDD+j999+njz/+mF69elW+2Lis+OVzVwv3ZY4Y3lbvf3Jy8vDMOadHjx4/WPK/RW+//TZ95jOfoR/8wS+az3zmM3R+fv5wrIa4W/JcjpGk9GDgZdwn7Onw9OnTMn8CP7s25WxDDMnnnDw38lt++jSwAHGw8J5oOx6zLKPz83P63Oc+R7/xG79RXj883n/7t397R8HN19A3fuM30jd90zfR/f09nZ2dIQcAAAAAMENCipzYOdzcFSTHgku4z/NF/p/xKb50GVAAgIOnDwumNgJ/jbQCbSOklPXr/+u0e5pDf8k/Pz+nFy9eUJZldHp6So8ePSoFKOwSz4IPaUXJwh6O68yhe4g2igIZk5otUrXQioVMm7AOTx72zSteAHiA7g+fRYTT+vkBnJ/DhpVx9/f39Pjx49IqNk0T+h/+h79of/EXf5E+/vjjMpTKyckJvXr1ir7927+d/u2//bfmrbfeotVqVeYCMMbQyckJffzxx/TOO+/Q/f26FBJLAeveKK34rfu7HN+6Tf22MWSNxPdQjpMvQ6bxOqKNcub999+nn/zJn7QvX76kjz/+mF6+fElf+cpX6Ctf+Qp99NFH9OLFi9KSn+/lrvqkUsHVXiK3BxaHb+PwUI8fP6bPfOYz9DVf8zX01ltv0Wc+8xn64he/aN544w168uT1h2fDdv883zxbtvH4d5UcLKzPsrwU/nOegsVi820tlXlljElosUgpTROylihJckqSnM7OTsrjkYoW7tP1el1REvA6/j/PD3t+MHWKoqDlclmZh/B4+Pqv/3pK07ScZ3z1q1+lH/qhH7KcOJuVa4y1lr7t276N0jSl+/v7g5/7AQAAAGMxxvtjn8YbsfIjY+I8OIF8/wiH7OHfTBN5hy5DlgUFADhqmtzA65QAIRd7mXDDVa7POlH/hqDSzatXrx5CLpyXsfw5pAJb8hNtEz6yhSkLTM7Pz0thlLTAlFb+Ms63dMfjbe7v7+nly5elJTBbA+PhNz4xyjswf+7v78tr8vR0SS9fboSmv/u7v0//+l//a/rKV75SKgrZ0vo7v/M76ed//ufNo0eP6MWLF5U8I2dnZ2SMocePHz+EZ9kk/Nb3jGMhJPiXIXX4nvzpp5/Shx9+SD/1Uz9l2YL/ww8/pA8//JA+/vhjevHiBb148YLu7u4q9Uh8btFa2e4S8EsPsLOzMzo7O6MnT57Q06dP6TOf+Qy99dZb9NZbb9H3fd/3mXfeeadUBJycnFQsrjdC+43AdrXaPj+2Xg5Eq1XmVCCzBT97AEikUoDzAEilM7f/5OSkDBHE/aznI7y/Kwzl5jsuBBCIR3qp8FjI85zefPPNyhj/4IMPynmGTujMc53Pf/7zRLTxfIIHIgAAADBP6iI/hObeevsm5bfdP0S4/qjijwYtuHeFJHXJnLTHr55nTl4BMPQE9tgtqLtwSC8V0mJOUve7zfHXKQikC0/dNrrePvvfp9yos5rW4QXGRFrMyfAROkmetDJlq7mTk5PS8s7lSuUSmMjyuCwpgPHt53uQh/ovdn2IJhME31iYwvkPoQWCenz34SHU1/4+zX0f9fvOYVuPpKbt6Kt/XWW24cmTx/SVr3yVnj59Snd3K8rznNbrnL74xR+0v/mbv1mxsD0/P6c/82f+DN3c3JizszN69eoVJUlC6/W69CSQz4uNNfvu/YZ/c7JW2XZ9P1iv1977hx6zvjAu+t7GCglZDyOtwY0xlGWrHWG6tFbn+ORSsSHbwWFGsiyj5XJZ3o/ff/99+spXvkI/9VM/ZTkG/5e//GX66KOPiJOvr9frMk+Lz4VVnh9Zt57wuu77rKhZLpf06NEjev311+nNN9+kt956iz772c/SkydP6K/9tb9mzs7OysS78jmgheaucCrcNp18eHMedq8v2V5XeCLGtV6eJ1YicGJ61+Tf9TLQN03nT12Z+vMlRJP2s5IyTdPSoMEYQ0+fPqWTk5NS6fOf/tN/cuYUYkXX13zN19AP//APG7b+50TmddTdJ/pg7Pen2PrHfj+c+/g/dHzXz9jjviljj+9Dp6/5e4i53idi2+2aP8l3PJ1jKpa210MoHGiT6881h/TJafZN/Piu3981p62+E23n6653rKb90+T9uAs8N9PvcNs2h8eHy+BYGor4joG3l7nCZHlFUUxfAQAA8NPHA0ALmZoIduVNLLZuAIAbXB9xrFbrUhDGVtiffvop/df/+l+JaGuVvlwu6du//dvp53/+581qtaKXL1+WClo5ieMJPS9fLrdTKL5vLhZpadmyXlcnaHrizgJcot2krnofol0FAgv75f2bPZHYMli2m/OcsEfU+flpRYirlQyvvfYaEVElpM3d3R29fPmS7u7u6Cd+4ifs/f09vXjxgj766CP64IMPylA9vJ1sO09IeeIqvaW4/6SCQuZs0f1ERHR6elqGb3vy5Am9+eab9Pbbb9Pbb79Nr7/+On3/93+/OT8/p9dee40ePXpEJycnlcSoOq4+JwiW7QVgKHz3d2MMPXv2zPzMz/yM5XvRixcvKkopvkaTJKE8z+nzn/88vfbaa+V9jsM/AQAAAIeGy4AJzzwwFVxKCS1va7K/S+HjMvrxbeN6h0ySBAoAAOZMXxYG2lK66faxGm4AABiSs7Mz+vTTTylJkjLPx+///u/TcrksBduvvfYa/dIv/ZJhBcGjR48qwnmibcJOFgxvBG/bsC88sbu/X5VCdq5PCra5DGM24V60AFyHH/MpBay1ZQz49XotPAdyWq22v1lJsFgs6OTkhM7Oznf6iC3KWZj/8ccf0z/9p//U/sEf/AG9fPmSvvrVr1bC83zyySf06tUrWq02Meqlh4C2Wpe/ZXJeTniqvQ/kdpLlcllJuMshex4/fkxf/OIXzec+9zl6/PgxEVHZ/6wIYWUIex1w+a+//nqpIOEY+nwO2JthUGyEgsEM3DYwOFVrsK1HaJIkdH5+Tqenp6XSbLVa7Sin2OMnTVP61m/91jLvw+npKd3d3dH5+e61DgAAAMydOvmCT0DatfwuHtoASKNaOd/bvFvwx480eGK2Y7t+fMrw1dwW+Q0FAAAzpm8XQ23ZX2eh1qV8AA6Jfbn4gnhYyHt+fk6vv/46vf/+++X5YStymTPg1atXlRA4UvjPZFm+I9znGPBSmSot8Tm5OHse+Nx6d91dTSVUEBHRRx99VLb/5OSkDFXECc5ZAMjH/vLlS/qt3/ot+gf/4B9YjsW/Wq3o1atXxEl3P/roI/r444/p1atXpZLEZRVfFAWdnp6Wx6RzpPAxsEWyDKsjJ6Us+Fwul/T48eNSsM8W/fz9xS9+0bz++utlPH5OKMywd4Kc7HIyd+l1kKYpPXr0qDzH3D4OwzIvEgq9QNSB+9f4sCBfKgCINiHJWAmpXx55H04g/Pbbb9OP/uiPmvV6XSoA4L0CAKgDAkxwKDSVXXRhqBAxY4Prfz+4hP9FkQklgBtfmFAuI5TDS75but5HoQAA4IDpeoNv+mBrkgS5j3oAGAKEsDps2DL+0aNHpQX46ekpfcu3/F/o137t1+j0dBNj+8MPP6Q/8Sf+hP2X//Jfmj/8h/8wERG9ePGCXn/99UqcbRass8DujTfepDzfJA/m2NuLxYKWyyUtFim9fPmqEtJG5ikhqlrEb+LIS2t4It60KKqKAbYKefr0Ka3Xa/r444/pS1/6Ev2jf/SP7IsXL+jTTz+lu7s7+tKXvkQvXrwoLfjv7+9LS3ctiJdwOzmMiC8Ez/39fblcT3IZ/v/k5IQ4HM/Tp0/p/Py8Iuj/y3/5L5vPfvazpfcFKzuk2yxbPLNFtEz6Lj+yf1m4r9vG3gfy/PA+fIzzUwiAucGeMPw/j72zszNaLpel5xEr2Ih2cy988zd/M7399tu0Wq3Kfc7OzvCCf+QcuoIP87fDZujzi/sjqMMn+AegKa4xVH338svIdHhXRua9rKtP1iXL4t9QAABwxOibU99adEywAegOXmDikAJcVgAsl0v6iZ/4CfOf//P/x/63//b/K63Pf+VXfoW+/du/3X7zN38z/ZE/8kfoR37kR8wnn3xCy+WSTk9P6fT0tLRS54nXer0Jv3F+fkpEpw/1EOV5QVmW06NHGwt8YzbLrd1a43MInzzftGu1WpWKBA6v89M//U/ser0uLfQ//fRTevnyZZlE90tf+gPKsoxWqxXd398TWwD7kn9KYTp7ILgmkXLc8fZSUcBC9SzLSgt69kJ444036K233qKnT5/SO++8Q48ePaLXXnuN/spf+SulBT+fFyl4ZwG/DLXE1vvaA4H3efr0KRFRaenPCVN14mJpBSP7nz0mXLkUOD8EAEMivXxY6VYURZm8WiLHp7WWVqsVJUlCn//858vlJycndH9/X3oXAQAAAIfMEMJ6hAACfeASvm8NOvzv+PKdS3qE+5QHejzydvL9Rr4HQQEAwBGjLcnq0C+fTYACAAAwFmxFfn9/X7Fq/+/+u2+lP/Wn/hT90i/9P+nDDz+ku7s7evToEX31q1+l//Jf/gv96q/+Kv38z/+8ffr0KS0WCzo9PaXz8/Pyc3Z2RovFgt588zOlZfvJySml6TY8DluQ8wSMhfMs6M/znD744ANarzO6v7+jV69elcJ/FvBLC3s3u/dhGSpI5xGQFvVEGw8J3ofI/0LD4YXOzs7o8ePH9OTJEzo/P6dv+IZvoNdee40++9nP0l/9q3/VPHnyhJbL5YMHxKISFkgK3zl3AFvosxKBt2WB/tnZWbkPT2JlmS9evCiPlxU5si62huY+MMbQcrmks7MzIiK6u7vbScwlQzlx/wAwBC4DDFaEcagqXi7Xs5KrKAp655136Id/+IdNURSlgpNDl2H+BQAA4BBxeZoOXY/8jecrCCE9tvXvJgZ+8r1NCu85jJBrH0Z6e8v6EQIIgAMg9gGk40z7ytUP2pDAiAmFCIIGHcyZQ3exnzt3d3f0+PFjyvONNb4xp/SVr3xEjx6d0c/8zM+aJDH23//7f0+//uu/Ti9fvqSnT5/Sy5cvyyScL1++rEzY5MR/I1zfCo2Jqi8GHKebfzNyIpamCyqKvDKOdNx//bIh7706RI4UsrtwjVe25meL46dPn5ax9995550yZ8L3f//3m9dee61MTiqF7WypL/uBrZN1mCFpxX9yclLpV7m+KAp68eLFTmgfedzn5+c7+8v+YkWDrJPbxu2VYZm4rRzq6dBDAOH+NS6ueZdMRO26r8jxniQJfe5zn6M/9If+EBFRGUpI5t0AAAAXuP+DOROyyu9j/B5yGCBc//tBW9/Ld7VQCCD5Ld8HN2W4EwQz/F6mDX17UwAc+gCJDcEgO16fzDlY6Ey9fbEMnSitDwF9l3VNCQk4fHXosewjlANAv+AyWtgll8ttm+QY8Anf2EK3S/t9FgB157uNl0VT9jEBimEKEwzXWO2r3qFD9LisBHR4lr7qd5XVNIeHrx6fh5GrLtey0DkLte/k5ITW6/VDWIyNMPj8/Jzu7jb/v/fee+bXfu3/Sz/wA3/J/uqv/ir93u/9HhFt7ot3d/dl/6fpoiJA3kyqLKWp7/5QUJ4Xon+2/WAMC6TTMsZ+mm7LlgK+qrKVk+ZS2ca6UD8sNGeLd/Zi4Bj8jx8/prfe+ho6PT2lJ0+e0A/8wF82bNm/SSK6yT0gz4Ns23qdq/Oe0PZ0bFxbrTVkTOq9z26237rBbovbCEBPT3enqDwMrOXtXftvlrNHBsPrZZusJcpzW+5jTEp7u22a7gl8t8TMYfb3Mut6Dptejn++sEcSh5vKsqwMS0VE5fXLniinp6e0Xq9F6K2UvuM7/q+0SQaX0MnJGVlLtFyePpQQMtA47BjbofnRoSv4xp7/xVJniORav2989Tc1kBqaId8/ufy6uV3s8bdt/yELa4dgH+NjyPJc11mbCAWhudN2finrlP+75SB9jbuh72+hJLJ9s9sv/fSTfm/iZV3nJ0373dpdAy9Z7taC39LmWDcfY4iSZBH0MN68P23vsXlePHw4T1n1/W+33QUZYx/e5Qrx/rN5D4UHAABgsvQ1wXBZiDYpH4Cx0ROZJhObvgjV07Ydfbc7tryXL+/o85//JvrlX/5l8wd/8CX60R/9n+1v//Zv06//+q/T7/zO75SW4L6JmjG7Lx8sfGdrXl4uJ4Vspc9xul1W+1LALy2C2WI/TVN68uQJnZyc0KNHj+jJkyf02muv0WuvvUZPnjyhs7Mzevr0KX3v936v4aS7nAyXQ9ysVtmD9f/mRYDzEdzd3RHRRuDIbdaKNNw758/YAjRQz+uvv07r9brMt/Hq1Ssi2hoPnZ+f01/5K3/VLBYb5dvp6QmtVusy9NjQBi5Tvwe4lU4Y83Nk6mPtWBlzfgoAAFNCG6hKa/8uzzD93qgVHb66tbeBywgdCgAAwKj43JxCFsG8bZOyXaE06m6kAEwJ10sW0T4sRPpNAh6y6IstXxMq31pLL1/ekbWWHj9+TD/+4/8PY4wpE+v+nb/zo/bjjz+m999/nz744AP66KOP6dNPX9CrV3e0Xq8oz7NKAlqOU8/JaK21pcB+sVhUwnoQbWI08rqTkxM6PT2l1157jd544w169OgRffazny1zEPDn+77v+8pQPLpMGT6EiErrYl0nt3kbwqeamGq5XO54GHTxpIEgYNrg/EwbvjewsnC5XNLLly9puVzS/f09vfnmm/R1X/d1lGWb+P/n56flPWWf3nU+xh5fdfVj7jcffBa2Y4+vQ6eNgVWflv9gPwx9nto8HzBmwFxxCdj5PVAL4tuMc95WJg6uM2D1GWnJiBqyHVAAAABGwyVUkjfTuglCE0sTHS6lu6sgAOPiGu9jj982CjjXfmO3/+TkpLTSZ6t9DsuzXC7pH/yDv2+INp4CHDeeiEqL/fff/xJdX19b9hJgRQAf19nZWZmc9nu+53vM2dlZKVw3xtDjx4+Fe+dmvzRN6ezsrBIKhNHlsysox/uWE0RjDC0Wi7JdLNzn0ECbHAW7E1WXW7/EpUwFAPTPN33TN5UJfYuioJcvXxLRNnn2t37rt9KjR49Egmwqc3Pg2qyinznon+kTCuE0NlNqi4t9tg+W/6ArUPCBIWhiAFZHm/HnEvLL39p6v2mIIt7X5UEQimbBhl+yHtkO89FHnzQ+QBdzv0CHiIHGk2+XRsi13ZTZR/tkfxG543kNWfeUy5cPQpfwb+wJaOwN1CcI5OWuRHZ9WqCGYoi37d+6mKAuZUbdsXWlTf+EqPPCaPoAa1t+DC5Bs6+vh6ivb0IC9LGJVQDo5LC+/bsS2j9JkkpCWGm1z9a2HIebhfayzMVim8PEZW1xf39fCd+j73fr9dp5j+cJ33q9LsP18P78zSGGpMW/Pl4WDMqwP7w8z3M6OeEQP+ScZNaFEMEL//yJn5+4Y6CGFJV4wd8Quj8tl0v67u/+bvvLv/zLtFqt6PHjx/Tq1Suy1tKbb75J/+f/+f82n//8NxHRJp/GarWis7MTWq83isFQjHuOYXwoNBlPfc6Php5/72t+0ZXY+V+b8sd+13ExtfnvvmkzP93H+ZviGKlj3+d/6v3jkwP4fofeo8P9GxciLzYHQBP5hb4H9iv3iTv+tve33e3b54CS71ecwyAUGsdH7P1Zx+DXgn5tuS/fr5q0VSsAZLuMMZTn68oy/b/rOpDtgwcAAGBU9A1RWv/HCshdQirXjTLUNgDGRI/jqQjQml4fur1Tua7Y0p//J6q6Wy6XyzLeflEUdH9/X7Gm3yRZqsbn1/cX9hZwWYew9S5P7rgMDr1zfn5emfDyftw+9laQLwryvsnt1P3OE8oXLz7dab9LUeHru0MXcAAwJnd3d/QLv/AL5uLiwv67f/fv6IMPPqDHjx/T06dP6d/8m39jPv/5b6LVKnsIM5ZUQnYNHf+faF7zJ9dcEveneQAF4rSZ6vwU1DO2AnDqCj4A6nAZefuUNK73v9CYd+0j3820gYe+HmWYV1e9UAAAAEbDpQ2Vwv/QBKGpFpWoKkBrKoic0wsuOGxcAouhBbBTvz5iy8+yrLSu11YWbJ1vrS1DbiyXSzo9PaU0TcgYKgVucqKmLeldCgKtbND78e+zs7NaK6fHjx9XfmvLkzRNy988GUzTVCg1du/Bcv99WniC/QMFzrQxZhOS7Pb21tzf39MXv/hFu1wu6Sd/8icNh/BKkoRevnxJjx8/rrwQLhYp5Xl7C7s2TH3+o+eVYF50nfODfmjT11Coga5AwQeGYB/PipASwPchoorBRh2+60HXze+vunyfUgIKAADALGkr/Hf9DwDwE3ud+Cz/+5rYxwowWbDPAnIiqiTA5XXSSj/Pc7q/3wjrOQSQrMuYTex913JWJkhBP4cYcikltXBeuwTf3d2V5WhPACIqQxstFosd5cBGIZDuTAx9YbPwMnZ4QAEwbU5PT+njjz8ur9l//I//sWFPpMViQS9f3tHTp689KPYMpekJ3d2tHq7h+vA/fTD18QMB8mExtXM3tfZopn59AuAT/gMwNEPdH9sqAkL1+9ohc9K5jMj4XU6Hdi3LDeUAGPsBMXb9IVwnUL+I+yz4eNsps6/2cX9xzHcetFOPsbjv/mH4uEMx7OeOy41d3jxj3dz3MX5cITz427VM/j+0G3/b42s7Odv39dnEQn5MoebU7/f7ZmgPhdj6w+XH3X9jjz8+1m79/eVYxqvvvjH2/GPs+U2Y7fiXzzPffEX/Hvv6DxEbomD4EAex1+/hzB+73Av7ur67ju/xr99hGfr4hj6/IcZ+PsTSd//13d9je5gOzRjHNyWjjjbHFz/XdRH7fh33/Ay1X7//a/lA/PnbLV8y/Pws3H+uNnG7kmRRbqOt35vVH8tW2C4F7XW/pZBenl+XckDKkl3noiiyHQM1WZbODafnJfAAAACAkZChjrSHwtiTMwAAAAAAAAAAAIApUWdkva/6tVV/neGnVAhotMe4rz4iKgX/OuRsU2UZFAAAADAgWsDPy5g6gf+hW8AAAMChMnUL0LFB/wAAwDTB+8WwoH/BVJhruLwptNEXZodlO76QP6wAkPNcV/QYvczlUeAqp669xhgoAAAAYEzmGBoMAAAAiGEKL28AAAAAAG04FAOGoUI0jsG+264F8j4LfLkto0NEakNRVyhNqWyQ4YFc5zDkRQAFAAAAdKSJAENb+Lvi/Tcty1U2AAAAAAAA4DA4FAEjAGB6+AT/c8EVVkevG6MtrnUuD4A0TXfyOkiSJNmx/Jd5BdI0deYh8vUFcgAAAMAeqQsBFErijAk+AADMEwhw6jn24wcAgKmC59ewoH/BVBgiBNA+xu+YSos6Yb8O/yNlPWy1nySJN3wQEVWS+LqSChuTeD0A6tqKEEAAADAyofA/mCACAAA4RJDjBgAAAABgHA4pBNAYuOL983Ip3K/rV5n8lz9pmlaE/lpRIBMA6zySLs8ACUIAAQDAiLi0vr4YcQAAAMCxAAU4AAAAAKbGIcxP5h4GSDOW/MQVq19b8OvtXTkB2DOAw/9s5UL5w/Y5ESVkjKU83wj/8zzfKaNJOKTF0B00hwsgBim0c2lweJ3U0DRx15gLsedXa62kmwy7xwxZ/9yZuwVdk/MnryOZ/IRvrn3W3/ZhGNv/Ux+/un36d2wIo/j+zdUSd3t9D2C9/dTY1/gJXQdDMfb9yWeR0bxf06j6h7n+++vTud+/QtRZx/TB0M/nsV20jUnLdhhTtWKqoi2g+NkdGwKvfg4Q2//V1e37KrR//PVT33/he0H8HGpchp1/hPDt3/S8Wlu/Xbic0Pl31RnX5j7q6oupP3/i76/x79cx+/Tdv/1fj7H3r/bXjyR0/YYJ9UdgbzP2/KF+/hsuP/b+UH/+w/Xr98d2hI8/VEK/x993HsH4+VPo/SF8/Rqjy6l/b4+5ZzXpP7lNkmxlvSyb4kTAHN+fZSQynj9b7nN5rCzYCv4tEVnKsvVW7sVj1RREdjO2NuUllKaJ8BLg9nHbNn3oOj54AAAAAJgkbSY0U38ZBACAQ0YbdOh1AAAAAAAAhJjyvDHP81L4Lz9E9UbhvF4as/KHiKgo8kpoHxb6m8QSWUOWuI5FpTxJE6M+KAAAAAB0YioeKN0tuAEAAHSlq5Up7tEAgBimLBwC7eiWhBTPEAAOlToP3anMH11hfHQuALb+11FNWIGQJAmlaUrGGMrzjfA/yzJK03SnXF23/ObtXG10/YYCAAAAgJOxXbi7hCCZysQAAAAOmSYvaPVhloZ9vkBACAAA06ZrEtJDD1EIwJgMPX9qUz7PKack/OcwPzqMOR9XlmUqtM+uEN8XLt6XH4BxCf/lttwWjdweCgAAADhShp5A79NDYCqTgkMCL1gAHC595RCQAhv5oqbraSrYAQAAcNi0zbkGADgu9DzSlXd1LGT9LODnMEAy56uM/y/3XSwWZYx/GTqIy5PbNjGqqQMhgAAAAMyG8AO+PokrXigAAGA4fC9oXbcDAIAmjJ0EHfQHQgABACRTDwFUidNPVAr7eR2H9pHLpIeADBeklydJUioFNol8t8dbyjeoPjRQ6DcUAAAAADoRayEe/xBHCCAAABiD2BBAuFUDAMBxgxBAAEyPoa+vuYcAkgoAaenPv1n4rxMFy/21UkCiEwnzMqYuJJBLMaD3hwIAAACAk7Et6MMvAO22BwAAMByuF7T6PAB+hn7BxPMCAADGA2GAAAB1dPMO2g9S4M4fVgqw8F8K71kBkCQJ5Xm+40Gw2c5fn/YE8An8m/RZUAEQO4EeO8Z037QddC5N9lQGLtHw/df0/OsEF032lft3rT+2/LmzzxjtTcqvy2AuY6pNhTb947txx5Q59ftr7PiR2nJXW5Kkel/1jSe/Nep+j6/JeG+zvi+aHsc+2uN6VnZ5NrSty1X+2PfHqXPoxz/08R2agFtfu/L+O8ZYmdJcwUVdAre67foLcTft8R3C9/LbtH982+0rV0WdhV+z959w+U3o+nwd+/0xxBjt81lozoWYNjc5X30+s+LnZ7H3hzRQ/nHTV//71h349HPHk1LHlte0vY8PPS/r+/6tn5X8P1vYS2v8LsfWpP+q22ys/HlbKa/g5byOfxtjKM9zyvO8VBAkSbITCoj32SzLK3VzeCBung4hFGo/lxNUAExFQAEAAAC46OPFAwAAAAAAAADANNm8z0H+GMPc3omnFP6nKb4Y/zqckRTu83bsISDLkt8hfIYR/H+0AiAWWNgBAADoQtPng9+Cp/cmAQAAAAAAAACIZI7C36HpWz46RXnrlD0UmpTPwn9XvgDpMUBUVQxIYb8lHSLI7gj2QzkCXNuOngNgigMOAADA9Ak97KYcOxBMH4wVAAAAAAAwJcYOAbgPAaovrOA+6j8mmoSPCe3TN3VhkvehDIo9PhbUyw9RVdDv2p7I7gj521zrWi7iqscYQ4upW+AnSTJq/QAAAKaJjpFY9zwb4lkGixQAAAAAAAAA6A+dj2Vf+Vn2wdgKHFcbxpb5utC5fprG95/isbjynkoFwcZbIGt1fG2UYrL/FiEBe5PCAAAAgDFwTQ582+zuM3z7AAAAAAAAAAC0w239f9wvcLEKhDkJ//n/PpUiQx+vjOvP9fmiFri8BWQ+AF+YH1mWNoiUuPox6AEwtIfAFAccAACA6RMS/iMEEIhhChY6AAAAAAAAMGPPT/f9LoU8AMMxxffiqYcAatIEndxX5gLQ2/FHC/61oqsU8ovfLs+ISh4Bh0Jg8goAnSQBAAAACOGLfQcAAAAAAAAAYHrEhnWFsqA7TYTsY/T/nJRAMtwPC/+lXEJ7A2hPge121fKIiGxhiKggoqRSh0sJ4FIAEBEt8jyvPYA0TXcORv4eeoDEnuiQAqGpQMgnSNKD0ZWwxHdC9PZDEFv+0Pu7+q/P/pnLjcKHvqDlDYXX17GP8zdk+U0Tu/ZFEwvyuu01Xdra5pyNLdAOWdgPPf6SpJrHvnr/JeKH43b9rivckDQ9fpc1wBTYhwWR755W584o969jihPYNoTal6Zp7QRvbEJtCoWgDM3fxp4/Df38i+2/oQ10ut7f+iNufh9/f0hr1/eFz7JLP99c+8UQe/3t8/rpcqy++pvPr+POvzEFsR2frsqY+BCFXc9/8/3icvRZWy9/CIUziB9fsdfP7vWx3zlDbP/H3t+bGWh2PX9hhjUQjb8/NL8/uvqor7E0nCFU7PO1QQ2OECjb36Hz3+442/dLs/tXV/Sx78oXQ/s3vz50WZt35fr9kyR0fPX92UT+7LaU35TtkxeysD1EvHyiviwW+PN6bucmzn9Baaqvf0vGbENbLRaLh2PZ9oO1lgpbUJLI4y+UZ4EcG5aKIqebm9uyI6+uLo0xhqrSEweuEyQPNDZJ79gvcE0nEHoC7go5oQUZcv+mv9sytovX2AISAAAA88T1zPSFc6rbH8yTKSot9snQAvqh0dep77p1eWNNgSm2aUr0JcAAAADgBp7Kh0mf51Fbje9jTjV0jtiu5UvD2DolXez8JdS+jbDejzSg1+3cCOzrFSAs1OdvLod/S88C/mzbZsrtpPCfiOj6+sZeXl6YoAJAa1HaDrqxPQT6qN+lXWpSdl15fV28EIAAAAAAu0CBPS5z6F+XB8q+BNaH4MHiMoyRv319uVnevGwXcxhfYwJBUhzh8benhgAADo6QBzWYN33P79p6rw89lvbhQV9Xh1aKyP2ImgjwYyPQNPOQZCG99ORIkiToASEVAIwU+LOHRFEUlOf5jmy6KIod4T9zc3NrgwqAkItlrAZobA+AJvv7rP/rqFMStLFwjAUWPAAAAKbKnCyGQb+MfY5jPVCGZir946NN2AKXMc3YjP1+MjRjexgfev+o13cFAACrmElEQVQCAICPtve/Q/MEmHv7p8q+5qdDzx+aXB8+oxJX+XrbkAIgNgRpUyUMC+jzPC+F90339d0TrLUVBUKSJJUwQNLy//LyouwoqRBopQBw/R7bhXnoCWZTDZFPA+VToODGCAAAoI5DF6C4no/7dHEFYMrM6foPGbu4XlpjXxC7tGmf+wMAAAB1+IR8eP4cNk3mPz4heB/lh4idf8aGEKqTo26+d+Prt3lvDAn4Qxb6TXLY6BA9UgHQ5PT45swc4kd6FRhjSiWDFPRLpcnV1aVh5UBQATC0i3Is+yh/CK3svm7sY79AAQAAAHW4LLDb7gemxxw8EMcMATR3mgj0Y0IADc2h3z+GVoDMSUHVhbm3HwAwXRACCNSh34v2/TzqS4Dfdb2vjqZz9pCAP3Z9KARQkiQVJQ7357adzULQSyWQHgfSsIbLlcJ/af3PZfLyoAJAo614xnYRCRE7QHXsJV22Hoj6gnXlUGhTfyxDl4+HFQAAgCkytoECmDahEED7iHEas35o2tQ/xLZjz4/nfn8Ye/zMHfRfiJCAZOqE2j/18x/b/6H729SP/7CY+/MGVOlDAZ8kSeewlGMbAPQpv9WepJtP1Uhbhr9pUndYwB+HPGdpmlb6Uyft9e3vWy77g63+Zdgf5ubm1l5eXhjX+GkdAkgvCx3A2BP42P35+Jp4AbguUnbRcO3XR9+M3b94YAEAAOjKkBbYeH5Nm2M/P7EKgKFfwEKE3g/08kM/n6DK3K/vcPv31BAAwOwYOoLG1PWTh+4hFqJP+aS0/J5LDoAQoRA7es6ord2NsTtC/zYKgKE9HGVYIukF0PT81dVvrS3j/ud5TtfXN5WQP5eXF4aVAT6PAPPixctgIw6Zpi9gTRQA2iNA7suKBOnK0cdFHJvkYmiaXoSy3+Q+TW4QXdvi6n9fLoemtN0+1D+7LkPV/hpagxli6Ac83yxlfX0r0cYk5AI69vF1eUDus/2hukLX99D0fT8Yuv594/OgkxYdTfb3MbSBwj4U8LovXFbrzNQFapqh29t0/tP1PjF2f091fudyV3fPv+btQUw0bP/73j/6uu/ElhN7f40/jnoPa6L6d7fYJICh8x8+vnHn72NfP2PPT6bevqnTZa7f5zOzr7JCkRn895Bxn798/+je/nqayie67h8i9H5QV1cT+drYHp4htABZr9vH/atu7OzDgl4jx0KSbG3YWRAuPQSaltmV0PyV28LXiU4GnOdr5zsvf7Isq5S13S8v5coyobAsiy3/pdLBWltRFLQOAQTmxdRvcLHlt9Gi6QtNK2l0eX08QPrUIAIAwCHRRAkb2j+2/jrGvu+6FCHSQ2Ls9k2dqZ/fWMZWQEjqxmNXAUSIsT2Q586Uxs8QjO0hAwAAc2Vs+U7T94Oh5hdTwHf8TRQAfSlgXGUdUh93JWRwIA14pcCeP9rAy+fB4DrXISN0oo3l/9XVpdGRbEq5IjwADtsDYGj6cGGv8wDo4wZW98AI3eDaKAC6WGS26R89dpqUPzRDC1jgAQAPgKb1wwMgvv4xiLFoH1oBEHq+7qt/fRbAdc+vOTB2m/Xcg6i59wlwz4/rrK/0trEW0OMreIb3ANh5aau5X7ZlbAOhvj0AdJnDCy3m7QEQT7cYxowxaZ+NaY21sR7m07AAHwtrqyFKmu0DD4D+GNYDoC8L9q7la5lak/LbvH9OfY7nmpu2kf/EHp8rAkVfZTdh6h4Aaep+Z+Bvll9pwT9b7esQRrzcFXqel7MXAG/D/0uLf95e5wPQfQAPgANn7An+2PX7HhquG2tb6/+6eupc1bogFQBc7tQfXgAAEMJ3r+3DwmVoAdQ+nm9NLD1gndMd7ssuhgfH3s++8emj73E69vxyaFwv+q7xGlt+V8ae/xM199wd5h4ZW8b4CtA6wn007esXADAc+xICdxH++7bZJ30J4HWZ+5L/1M2J+zBgnjtyfuZSzkjBvjtcz3Zb1za6rq6KO9+5ggIARDH0C0Qf+ML8uDTFddvUld30dxdcGvC+FQwAALBv5MSkT8FWU6Y+gXVNwOvu/XgegH1SNwabKKjmLoAO3T7mMD8+BOrujVMTCgEAwDHQpwdA3fuB7x4/9vygb2+XvuZNbeut+33MSEt9bcXP6+Uy7Z1gLVX2k9tptGJB/8/W/3Uezfp6gAIADErsA6CP8psKSrpoOF1KBF1/X+j27FtYBgAAQzCG8H9OuCyA67YBzZDjDiGAulNnTNFk264cg4Bcj0c9XsEWeEa1A/0BABiLNp6WrveDqRvB9PWM7npMfRmgtpnfHRta8K+F/T6B/mbdtgxZlixb1+X7vQmJVM05cHl5Ya6vb6xWiHG7oAAAUUxBwN90/zaa47Z0tfwP1SddwPp8cQYAgCkQI9Ce0vNlCLo+R+YyOR/6Odbk/LleLtu8mI7JFOYBbfqg7/4au/+HxqWMcimtujL2+Ik/f91DAOn9hmhfeP9p3z9i2z/28zPEBG6fAEyWKVjIt7mfj30/6Rvf8ezbCMClVB977jBFfMZD8v0iJOyX/coeBj5kbtkkSXZChLNHgKzn8vLCcG4AKAAOnKEv0rEVACFCWuOQtVCT9tcJ/2MnwC7BhCskEAAAHApNrbDHVgDsg5AF8FyF//tg6gKoWKYwPl10nTt1qWfM8semj/nxkOzr/uqy/G8TXqJum0DNtWunen32R0KbRKRdvonGVoDEt39sYtof+000/vkDQzK2AsB3/zwWA43hFdD1uAxQ4QGwRcv65LuZa37BfbYV3NeXHZqjcOJf3p6TDrvaJ5exEgAKgAB1Gji9nRTM6oEhT4zUzAzVvqaMbUGkB6vWjsWWH9Kg1fVf05AUdQIYVxIXXUeobJ/A31obLD9E6Phix1eo/9M0dQq45LdEL5MaUL2+yfkLCc9i+1e2pU7ZJJdP8aXR9yDru1zNHAS0Q3JMAkx5/Y9h2eJi7P6tm8z5LDz6DKU09+sr9PyJZewXvNDxhZ5ffdxffQYQfYzD8P6h44utM3T8+3k+zfU6jB1/DWogIv8YtFZeH3qb8PgwJo1qXfj5Eje/7Ov+06z/fPUb2pyH3W9reb3rQxS6voZ/PnP5ifO7vv3bvvHNj8Pnpy9FQpf2hz/GuMvdlr99/5Knov59oc/5yTDPN95tu7/ejn8PO79oiu89Nvz+GpJPxLQqjDHN+8/1fjC2giJ8/YY6sN38bdcwatjzVxR1c6H+B8duf1fnkpv15mEMVIXdvv/7bY9qndlul+c55Xm+817msvgvy324fybGECXJ5qnCyYCtpUSVYYyh9GE7ay29++4zw+u57iRJKE1TSpKkIh8zxtDV1aVJkqTcFgoAACbOmELhfdTr0nTWCfLl77r2dXkI9Ck8AwAAAAAA4DCpExLbmvVToV7IXf89BQFw1/6P/QYAAEDUXFZWVQgUlWUsqGeDcZlk2FWO/PAy1z4+o1ooAACYIcdmge1SAvho0zcuSwIoAba43Nl2rRDAUKCPAQCHCu5vAAAAuoDnBwBgKkirf1dEE4b/z/Pc6X0ny3HJW3S5HNP/8vLCSDlNkiR0dXVpfFFnoAAAYED6mKDUubsNHQJqXwqCJlb9LsF8k7A6beuva8Mxoh9mvAwAAMB0wX0ajMmxj7+xj3/s+sG8mfr4iX3/nPrxAQCGo68QlS7huhb662VNInv4Qke7lAy+/WU5ensoAACYOD7B+CFMXuoE/65Yf67f+v+uFvz7iisIAAAAAAAAAAAAAOaLT1jP31op4FMa1G0n17OMjBMBJ0lSkWO5cmZKjwEoAACYIftKcrIPQpb9rm18wnpXPoFQ3bochADaEgoBBE+JYZlKCC4AAOgb3N8AAAB0Ac8HAMBYSBmI/PYJ/+V+RERpklTW6+2TJCkTQfO6Sox/YSQr8we42qmF/8YYKAAAGJK+QwDtOxTLlHIENBXMd6kTIYD8IAQQAADMDwjYAQAAdGHq83yE+AEAjElIbqTlJlUhf7h8KdSX+xdFQeYhWbD0BqgLGXR9fWNluVAAADAj+p7Q9BUDrSuc7dwVCqiJcMJ1820j1IDlPwAAAABAvxy7Amrs4x+7fgCmDK4PAI6XIa9/XwLfuvp9ESxk/H72AKirw1XOzc2t1TK2HQVAKBTHXHF1KNG4FtT76NuxLcSb7O/SXDFDP6Cn3j++G0Rf9HH+YpA3M8YXYqbpzXSfQvyuygbX/kOE1Inti7qEzE32ib1+2+7fR//16QnSpf/b7HOIXitTUsL1lWQ8tn7fvGxor5whyuzz/jA2c29/LHVh+XTYuC7vFuH+bdXcDuU3fz51OdeH+r7F7Ot4XK74+v8x799j0ab+sfvKxVTaEaKpgMexRf+NaUFf97+2hlRt5S++/Hd9j4+xr9c+8F3HY1xLrjrlMke0kgpFUezc113HNNXnaF/Xvz7OueQr7KN9rrkj0WZsuMLdtCE0TlyW964y+J4nP6F7lrWWTLKVfXKIHvnhY+Ty8zwnay0tl0s6OTmhl69elR4CaZqWBrVFUZTXTlEU9Pz5tbXW7vQXPAAAAAA4GdrFduoTGAAAAAAAAAAAABw+eZ47l7PcIk038hEWuPPHZbyqlQguRalLSeBSJrgUY752ao8BuT0UAAAAcKBMPUbm2PUDAAAAAAAAANgPeP8DU0Z7XLjWs5A9yzLK87yiNAh5Q4WiPvg8D7hOl5JBUhSFM/QPAwUAAAB05NhDQISYUhJpAAAAAIBDAAI0AAAAYJe+QiD7wmrleU5FUZSCf/7N27tCXPuE9i4vAbmdDJPuUgC42ueq8/LywrBiAgoAAMDRMlSM/LkwdA4IvKACAAAAhwcU+AAAME+O/f0XxDH39/um7fcl3s2ydRn2h+Pzu/bz5noUcf7r8shIC36d46guJ4Yxhq6uLg3/lvkEiOABAAAAwAME/AAAAAAAAAAA+gDvj2DKyMS88v/t+rwS95+oKpQPJYc3tGv9r/MEVLZ/SPhbJicW5bnC/CRJ4swXAA8AAAA4cMa20IOHAQAAAAAAAAAAAKYOC8rZwl9b9GuhPW/vSr7rxtYmA5bl8W9jDKVpSkREuSPEkC7LVT4rLKAAAACAjowtYJ876B8AAAAAgHZg/gkAAADs0sxAsCCixPmdpgsiKqgozMNy3j4lYywRGeczlhUGLKj3tcWYbUigpsmCWQmQJAkVDTwNfCGCbm5urXnx4qW30kNgjAkQnyDtCuLSzIzPrgapDcak4Y0alVO9kEIuNHK/pkzRWriJhbPsG32jcCUZmROh4+8yJqZI1/E9FfR5mnK7ZVv19dG23exq5yN0/YX2DxEqv+0zZBrPHNAXvuRUoDnaPbbPe/PYHkxzn//Gzv/G7t+++3+nDyly/m3i5o9TFED3eU+c+vgKMfT5iT/+uPmNtWPPZ3bDK8h7Xrh/4+aHY4+/vusfSkbie3+ZpkymP9q+t7U/n/XXb7i85uOfhZ7SKjt0vpq8n/msr2W98rtuTtM3MtwLEZXhZsZmH8cucVnCJ0lSCth5PPBHzj/rzqe1ObHA39qcrDWV7zRdElFB1hrK8zVlWUFFkRFRQsZYsiIskKsuHZZHj51QD0qPA3lMZc4BFXqoDA30UH6WZbXlwwMAAABAJ6YoAHDV74qP12QCA6EqAAAAAAAAYI7gXWaXpu+AvmSr+0DWP4VzOIU2xLDtz7z8TcQJfFlpa8kY9gag8tsY3rcgom7Gx/I8NlXmuJQY2gNAKsX4d0jeAQUAAACATsxBAeCyxGpmnTX/yQ4AAAAAAADHhBSeDuHhF8u+PDhClsn7aEtfSAHq0B4oU6Xp++tQ9cyln4jcMfAZbbnv8l7Vy/m3j1AonzqPAQ17qOj2EdHG+8FWkxO7lFXyGHT7oAAAAADQibEF/E1wTXKbtntsBccc+hcA4GZOL0pzBP0LhmTs8YX6Q/VjfjQkY5//PhjbgntMXMfZZFnz/hm+H+U725CCb1cfSKGpT5myb9qFGOunvqkce1e0DICt/WXoIE6u20QpthPKJxACSNfd1JtDWvPz9jIslH34LkQooFCbb25uyw2gAAAAANCJucfIHbt8AAAAAPRP7PwDz38ApsvQ7xeHdP/oV/C/H7TSRgtn++jfuj6oE37vo690+J+xzpdLebYvBURf6JxURCKWvrWVXAusGAh5QLgUAG08AEzDHIFauM/tYg8Bl9eCVnyy4N9uN4jMQAMAAOBoka5xrs8UcD2YfQ/unQf0DI4PAAAAAAAAsMFlFRuylN0nTd9Dun5kPa569bI5INve9Pjryqr73WbZUIxZf8iafOpwO12he6y1lOc55XlesaAnoopiwDfeZNJh10dvo8dk0xDEum4uL8/zshz+cJJsWQd/Li8vdiqEBwAAAIBOTH0iUDfZ76PtY3sgTL3/AQBgKEL3v4NX0ppmSeQAAOAY0ZawvOwY6CrQbt4/wz9/tRB3KOYyJvZtgT83S38f2gOAFQCciFfG2y+KgrIsK0MCaS8M3kfH33cZGXLdLpoqqXwKr2SxKNsu28jt4mPifa+uLo21duMNYAwUAAAAALox9UlTrJXL0QuYAACdwf0DgPky9vUbO7+Kbd/Ujx+3z2EZ+/yDfulX+L9/9imMlsJbWe++BfBTYspjows+Txi2sNdhgfR3yOuEcwsw2hOBFQmhNrraXKdgkB4BrvZeXV0aogl4AMRaOB76BTi0BWjf/afbM/YEcWiaJAypo42b2m4Ms+mzTwvpKfZJXZv6aO++7o++enT5ba//2D5w1dfWzS6GJg9wxtWW2PZN/fk39PNgite8ZF8CGP1c6CtpV+z1mzSMcdkE10R46uM/9vhj7+9Nzr9+Ken6gutOtLa7vk35of5jN+iu7Pv5FCL0PO27/rEFxH3fv/Xzf+oM3dbY8zP0/SvEVO7vdfOYId/Jxh7LY8/XYo/fN36bHlfT+5dPiB7av6/7o37n8ZVb5wkxzvhtPj/R5Rljgu9fXecv/Luuf/Z5b3IJmPdRv6tPfHW7roHQ8yN0/qRVvuvdxjW+msyhNgL+7KF8U4YCStOU0jSlJElo8WBdzyF3uCx5fbnC7fB2RVHsHL+25k/StLadPL913WeMMZRlGZ2cnNByuSRjtsch1+v+47YVRTG+AgAAAAAAoC1DGxCMbYDQ5AWy7sVk7PYN2X9jvADtm6EVhGMLmKZe/6EIMMdi7PN77Ayt4AEAdAfXFzgEpu5F4lPIyVA5/C6V5zllWVYKz3k/HQooz3NKxG9Zj8SnWGoSlqzOwNVaS1YcA1v8y21Z2K/r4d+TVwAc+wQaAAAAmDtDPMunLiDdlwBWuynvi30KmEPKjtiydT1zmHtOXcAfy9Qt2IcmXH/IAjJYQ5vmOMqfzjUypbYcClCA1XPoxwcAAD5cz4c+55wuwbpLeC7X1c3dtUA/z3MyZvubheWcG4BD+OjkulxWkqaNhP8+QX5IceI6Tvm7sJayLCs9FpIkoSRJyvbLRMauvpi8AgAAAAAA88XnSjp1AeUcXvB9k+EphMPoQ0Gj3V73eUxjW9DGhhAIMfXxMfX2xe4/9vHFMpXxN9fny9SZw/NvSFzWmlWhDsYX6M7UFdBzB/f/evrun317Ash7cxNvTp93tC7DGEOLxcIZWovDErHAXVvZx3o11ykB9DeHJsqyrDLnkR4MrrbNxgMAxBEejLhBAgAA6B+fYGYuxMawHBotmJia5Xof/acnrX0L97SVTp2FEeiXsQXIofEZWj90iLGpM6V7DdH8njeH3r65j28i93N16ucNADB9DkUB5BP899F+LfTW9+OQF4Lej/83xlCapkRUlIJyXsbCfaJtDgB+V+FtkiQhEqF3XMfsDNsjFQ1iv9Cxh0IN8XrZXrnfzc2tvby8MLIfJq8AOPQJNAAAAHDozGUy24ZYC+2+XgB8wv+xBThDhgDiSXxfZet6pqAEmFL/j8HY4xfUE+rfWAVKGw7x+RIL+mRYIJ8AMeD6BHNmTiGAXErcxWJBeb6u5AJIkqQU8NcJ3WXIIFl2qG3y47r6XcoLacUv16cP7eWPbFuapg8hjgxdX99YS1QqAejhf/PixUtHE/bH0C/QY8Avptp1wzWAmpRVR7wAIdaCcTfLdbv6t9u5NGdTPL+SOm1f3/XMvX9i93cd8776vyta4+xa10f5PvY9wWx7/fd9zvZdX5vyXG07lhcAn2B6aAv62Otj6BAgoeMP7S+TPtW5jnYldv8h+s93/++znrk8X2PRLy68TK9rQtNthzh/Terqwr7vz23nCMaE3d7r90+bNawj+3oej/V8mTrTV6D1+/7ZN9KyU1t4br7r2x/uv/0pyKbAvo9nX8+XIS2g27SD66yr13cOup2b/V2/ep5CNP/7exMFupyX9RVqhum7/7rK/7qWu1gsyvXS6l3KX6WAXvaltZs4+Vm2ovV6TUREy+WSFotFua+OpV/d31LxsFzWK9frY9AfCsivtOX/zc2tJSJiIf7tza39nu/5gjk5OaH0IR+BPKer1aps//XDvvKMTN4DAAAAAADzZMiwDEMLuGMtXMdijBfPLutD/Te2Ff7YAuRYBdbUBUixCrCxBZxjKxjHZgrja25hf+bE2Pc/AA6ZuT+/pw7uX4dNGyMVa3MyZkEbpRUrk9yKs41iIKP7+/tKGXJ9URRESkAv21WnaNOCfV7u2pZoK/hn2JK/EEoK6ZHAHgF1ykBLRObTT185Vx4K+3wRlhpKrYHibfpv37QtKJoyloX72BbkTSYAsm+0QGTuFp5NX6D1eZrbxMg3viVzO6Yu+CxlfDQZXy7rAO9Db6Q+7ur9MfYEdGgPk7m/ALmscfb5TJEC9LbX1pQYwjuqTb1DPV9ir4/EESO0z+d/X4SEsENZSGqvBV99seV3XX/s7KN/6saeVjANZaF4SIz9TjQn9LsZUfXddeo5hEJ0Of/txk/99dmmrjGwdtzng7V5q/r2fT3HGogQuedoen+fl06I0PUXe/128YqU+0kP37pvH3p/X33dGVZ+WCcz5XsvW76v1+tSEG6MdYyFgoqCqCgyyvONB8BqtdrxEJByW/YM4HJ2PK7ZE0CMA7m/novokEGWiJ4/v7bc1qurSyNzDzBaAcDbf+HdZyZN0zJvAdfNdcn2ZllG6/W69AS4urwwUAD0BBQAcUAB4AYKACgADgkoAPptx75cnIeqf2ovLG2ZigJgzsJ/IigA2uwPBcBuPVAATJN99Y9v/EEB0J6x34nmhE842fT+NvX+hQKgHigA6unzOewbVz5ZUZO+j1XA9SU/CSkAeJuuc9Ou86NwH46rAGBLdxbW53n+YPle7Sf+zZb9WZZRURS0Xq/Vdruhg/Q6uT7Pssp2cpxq2S/XL7ctrN0R7stjN8bQ1dWlWSwWO3kJrN2EIEqSpJK0OM9zyrKM8jyn5XK500fr9brMCYAQQAAAAMAEGVoAD+IYu/+PVZF4rODcArCLtrbDdQKmAMZhHGPPr2IZQ+A+JeOnWIWEVrD1PR76al/X/eU2UjCsDT998/ym/aHLmft11ZRt3xZlLHy2hHdZ5Gvhvc4Bo3/L/Yl2FTZyvXUI+/VZ1ef52bMrs1gsytwEXD+3vXgI85Om6Uah8FAfr5fHI5UPZAwZa6EAAAAAAKbIoU/UDvEFecxJ9iH2J9gwdy8PAIakjUAEgD6RY2+KHlrgMHHNNV33wbHmDn140LmE//Ja01ERmpbbB332o6vNUhnQpU4dQtLVV3XM4f7lO6aKpXyRlVbxHDO/6XxBKghYqC6X8Tb6m4XubG3vKJjoYf/Lywtzc3NrpSLi3XefmbOzs3JzVl5IhcPyIQmy7AP2COCwQHmeVyz/efurZ1cIAdQXcjAgBFB7EALIjdZMIgQQQgDNmbYT0WMPATS2QAMeCPW0nVAPUT/RcCFW9gVCAPn3n4PgHyGAgIvhQ2C4x1HTcbGv9vmY4vgZ+51obkxtrjk2fYYAGjqkTfz769jz82mHAOrj/lZn/a8Frm3rHVp+0uT+7/IA4G+Ob8/r5acJQyuChg6BVScz5f5hJcdqtaI8zx/e/7d9tBGA35chgqRMTVvwa4t5aXHP6+U2aZJUPAl4OX9K4f+DsP/q8sIQEV0LYb8+VmMM/fk//z1muVzSyckJZVlGq9WqkuOAw/qcnZ7uWPfzemNMqTTIsmyTa0D0oSGEAAIAAAAmydQm9GCXOjfdoTlWReKxMAfhPwBjE2MlCUAMTSyuwXGy73FQZ9U8lflpG6QFfBsvm30ZAMQqeH1W//xdpxwgCucwCM0fY5MgTxk5bsqQOUqQ7xKeE1G5TMfc18aFLsPO0vL/5rZUjxizieXPCp2rywtzfX1jpeU/b/eFL7xrlsslLZfLSsii9957XioN3n33mSEiur+/rxwDK0VYMfLq1asy7NDV1aUh2iQULoqCCosQQAAAAMAkwYvkPBnLAh/j5XDBuQXAT53wC4AxgAFHHOifelzzzCYKqan0a5vrwyUQl/8P4d01tAeXFET7QhzV1dlWQD+V874lFMHE1d5SrE7GLGq9ZLl/0zQtrf+lMsA3nqRXQJ3XhS6LPzLWvyGqJPKV9Wnh/7vvPjOLxaL0Tnj16pVTccG/r59fW91LhjYhhYioDPnDoYaSJKGrq0vz/Pn1RpmAEED9IC9ghABqD0IAudFaR4QAQgigOdN2InrsIYDalts3Q0+Ahy5/aHzX9FQUAFPvPwYhgMK47p1TOb8IAQRc7Pv51FbgOvfn5xCM/U40J/R7Py/j75CALmSBOzZdxmefIYCGZugQQEMfjwwB5HsGjyn87+P+1zQEkPze1301dn7gEl7LdXme75TT5th0UlpN6P6TZVnt+vgQQO08GGSZxhhaLE4oeQjDI0MAEW0t+IuioCxblZb0nAvAWkuLxaKaHFfUWxRFaYWvQwfxeUsehPG6DBbss9V9kiTEVv3c1p/52fes3Ofq6tKcnJwQKwCstfRP/slPlxuwUL+iNNh0RKkSscTvLwWRJfrCF941z69vyu0TYyrlLHwXTFO39ilOYNowtACDB6BPUwuG5dAtMPahoY6hTwXDvpRCfVLX1ikJcIZiH4qOtkoxbVXSdFtf3V3Wz+X5OnT9Yx9fLHWT932gJ/hznV/02dY2fcB95rLA6qNNIQFRDFLR6RNs7msMsNKk7kXVdd8dqn37NPwZEtlPbZ5bfdc/FrGKwTZzgS5MaX7cF3N6boyNSzjpep6E9j9Uhp6PDPEuIZGWt+56wwaUMc//pu8HrudDEwXUPg0suyLnaL5y21xzfRKrwAu1N03TyjnW1uCx7QuVcXJyUru+rQJM/y6K+vkxh8zxzX+MMeUY1/dg/nBSXPlbJgKWyDl1kiSUZVmlz3l5uZ1qE5f/hS+8a+QxnJyclMfCdZOjbiIq12dZRs+eXZXlOI9f9XepEDAbT4Pn1zfWPGzPgv/K9i9evNzpPPl76gKKWPqawOkXPfmR7iH6gRjff/AACJVbx9iT3Sbtk32jH4SxN/ihr+/Y/nVpsMc+Z22Qij/XJHKuArumxCoAmo6/NpZ9U1AA9FU+OG74/jimldfUaHtPHUpAv4/yp6IA4Lr0HFiuG0IBcOj3x7krAPrcv8lcIlZh0Jax3y8OffzPBd+4G3t8jIHvmN3HGucB0PfzYwgFQP3+9YTfD9xzCZdiylXmXMZfE/nkGMcy9PyFQ8awHNFnTDwU4ffbNGr/osi827mMZ3j5dn1aCtbZuv+h5FIBtlGcZKUlvxT+r9frUrHiqoe3LYqCbm5u7dXVpZEyKekBQERlcl6e/3Isfv5wmeyFkOV5GaZHhv/hbZbLZdkWef45xJAh2g2SJMekR1HAygAoAKAAiNy/H6AAcAMFABQAcwYKACgAwHCEXvCOESgAoAA4FKAAcI8T37iBAgCMARQAW7oqALr0xRDPD7ns0BQAczUUOVQFQIiQAmDs50tIAeDyQKnOC3Oqk2HytrqczXWZUFFs+2i9Xpchk4gKyvNcWN2vK8J87rf7+/vKMj3fcvW5bL8R27LAn4X+xhg6OTkpy3HN4SzRjvKAiEpFBbdF5hq4FiF99NnRoyF5qEMrBQxtlABIAgwAAAAAMHPm8kIHAAAhYg0IABgTjNVm+ATTQyu4XPX0Y5i5W8/YQuu5Cv+PGT1WtBA51oAstH/sGNEGqtX2FOrbtx2J2P6V0smYZSkgZwE/C9G31v9Fxfq/7phkH7uE/vy/a7skSShNU1oul2XoJlbcZFlWeidwSKIkSShdLJzn1JhNKKH7+/uyH9nyf7u9JTJKwaKPzRgia7dKAGPIPHwTEc1eAXCMGnYAAAAAzJu+PEDGeoEGAIB9gHe5XQ7dg+bQj+/YmYpQWs+X+mqHT/DfZx1N2jBGvSAeHj9NPd6GqL9+fTgCib+NxcOxbYXyLi9SKWjnZWxhn6ZUCtjX63VZMjsMsFJAht2RSgktyJft0MfOdep+4fakaUqLxYIWi0XplXB/f1+27b33nltLRO+KuP658DBweR08f35tdX2VdrkMJKi6LQv/LdkHJcCmc25ubu3sFQAAAAAAAMcGLGQBAIcOFJwAHDZTmLcMbf0vl+0DCP+nTeh8yAS3rm2HDjHbtH1N968KslkBUDhD7RARLR4s5Hnf3VDK24S5HDKH10uvAP1hYTt7CbiE/9oDQCoAuHxexgoAFvxzHavVqmwHl/f8+bV9991npigKsqI+Du8T6vdtG8yOAsCS/k1b4f+248tfUAAAAAAAAMwcvOABAA4FKDgBOHwOPQTQFMB9c5748ir1MUaHVhC4chjJEDYbAX1WEZJrrxkWsLOw3VpbbpvnphSeS2+JPC/KkDsyRA//z14ALut/CYfykWF7iLaeBYao0j5ep0MOJUlCzx4s/7nePM+JhGJHf8v/veeBl/N2D1kBWMSvPTR4PSsBoAAAAAAAAAAAADBJIMQCc6KvEH+HzBSs1LXQvy8lgBRK6vAhTY5zyPFxqIqOQ0IK/7sow2PX96EA2ArYc7LWlN9EBWXZqhKjXyfj5cS6UsDOAv+NxX/xsG3y8P+COAHwer0uPQhYeSJj81trKcuynRBDksViUe4nQ/uUwv2iKMuTyonVakVZllU8BKRnAte3TVpMKr7/rlKy9vyYqjdAqQjgZUYI/2mrIDCffvoqeAJj1o/NPh7AOh6U1NQlSVKbZTrkQnMM6D4jcsfgchOOQVZH/GQj7vw1GX/yZqjRSVbaE7v/li592fT66zY2mrD/6696LHnNlk2Y9v1j6AlIF/p8wRj7+Td0Dpyxjw/UI18MurgIHyJNJs6gf/SLm35pdZ+LuPnH/Mf3tJ/fbV38941+92rLseeQGzuGdPz1n0btf+zEj++6JJ+7v5sI+9u1Ke7+6bOw7TsXQKj+oRh7LtRX/aFx5Sq/j+MdK1STlB/KsegKk9Om3L621e3cLWN7X+BjyLIVrVYZrdf3RJRQkhCtHpLc+mQ6RVGUiXVPTk5ouVxWZKrZQ3JgY1KyNqc8t5Tn67K8hUiyK5Vx/MnW61JZwML4xWJBJycnlKYpnZyclO3jOvmYkiSphBiS5fLv5XJZ9pHMQ8Bl5HlONze3m0g9m4pk5zpj/Ff6O3B+Nh4A/mtn2rNPAAAAAAAAAAAAADArDl2ZBsZjCl4kx45PmbcRsN8/CL/XDwLyjLIsqxiMsKJAx9lnwTkLz2U8ffYOMIaNoLYGlcaYioCe26Mt9nkdC/xPT09puVzSYrFw1imPjeP+LxYLWi6XdHp6SmdnZ3R+fk7n5+dOBc719Y29vr6xrAi4vLwwUvhv+dNgDOsQRu6QRlZ8qvsgBNDA+DRb87dcAgAAMCaY6AIAABiCQ3++HPrxATAFIKAFQxDyIME42w911/dGgL8JiSMt5YuioFQl1tVl8HYcz18m3rXWljH0ZVgg6SHhii7C64g2Qn/ePkkSOjk5KWP9W7tJ4qvL0PkJdF4G6WXA7dFtY7ieq8sLc/3gCWBajdlID/+XL+/iCpi4IHvsEEDGmIoG6hiSzbQFIYCabYMQQNt6EAKImbYTF0IAzZtDP765gxBAu4zt9n6sIARQF6b9/J56/4ZCAI0xv5gTCAF03AwdAqhLnQgB1B9jz4WGDgEUUizNZf431xBA/nK28s7VakX396/K0DcsE83znNKHEIN18h15zBXhPxElDwJ8KWzn7ZIkqSTx1WPGGEOFCP/DoYbSNK14HfD+W2+DahghqdTg8nVIIH3udDm8H4cDury8MEREz69vak9Km3PmGi8H7wEw9gTP91IO4T8AAIApAwEKAAAAAEC/xArd5pTDYkptAYfFXAX/h0SdARILuvX9Kn+I4S+3lSyXy0qC4KIoKmWenJ5WhP8yqa5UorDAXQrhidwGtOxxsF6vd46Fy+H2rFarHQUAl2GtLS38XUobGX6IBf9tiXn/NsYcvgJgCtQpAQAAAIAuQEAPAABgCA79+XLoxwfAFPAJaHF9gRiGDgGE8dmMkALGFYaHt5PbsoBdfvN2LkUBJwSW8fz5d5ZldHZ2VtlX18ceAhz2Z7FYVNq/Wq0qx8ACffZgWK+3CYdle3k7Xx8URUE3N7f28vLC3NzcWp0D4Dpg+d8H1lpazEmDPEfQfwAAAAAAAACwHyDgB2A8QgJaAPoEY2u/hK5vtnBnQb0MhWOM2Ul2y1bzMtwO0W6oU/7/1atXZZkcsoet6a+uLk2apuX+UknAvzmJr6yflQg6PI/8aOG/3F8nMWa0QsPSxsPhC1941+R5TtfXN9ZaS2QtFQ+x/Q0F5PO1a+UW7hBa5tWr+/rdMYEKouNQSk2PHDRyvWvfYwU5AJptgxwA23r6u26QA2BIYuN9IgdAPWM/n8c+/mMHOQB2wfxqHLSVFnIANGHaz+8QY/e/fvfShObHofaPfXxDgxwA4zL/EED1OQCaWAZr2rUZOQDqGHsuNHQOAH1/7zsU0L7u/77rYuo5APz9XZS/N8Ly+zKUT0UmquSjSZLQcrmkxWJBaZqWlvZZlpVhd2Q/FEpAz5bzV1eXhgX8y+WSTk5OyhBAnEg4SRJKVN+yYJ8TFi8Wi1JRcHJyUrbp7u6u9A6Q9WqL/lL8bgy9++zKcHncF48ePSrrzfOc3nvvuS2sJWsLItvg/h5QAehTqosbXQGwzxtgl/UhdAwrl7C27qYUqj92Ahsi9vz2cYMMKU3qCAlQh29//QQkdAysEQzhm1i5xod2caonbgIer4CoZ+jxbe24AtJDVwAwoRcDH22fD13rGYq5Px8PnbEVKH3T5AUbgCGRY84nSNm+xA6rIJ6+AGAez++u7PP5Fy9M3D9Tf3/btwC5LbEKgL6f/3N7/saeX/n+0vRYdciPGKFt6P1tn/0fMsCYswB+SvgsrJk28rUu7LMfOSSNFF5LBUD89RuWT7mMOLRBM7eFBdlJsmn7er2m9XpNq9Vdad3Px5LnORUP8lO2xNeGI2xlX26vrPMLzzXHHxmDvxT6S5mbkDPqxL18nIvFgk5OTspzsTmeFf3sz75nr64ujayT9+EQP9r+/vLywshtl8tlWTcf4/XNrbVFQZZsrQfARvjfbnzr6yE6B8AUBMgx7OMFQV+oIau9tuXHMPXzEyIkQD+Uh54P1wN+n+ds/BcIAAAAAAAAAABzAO+HAPhhr8qxrpMmHhba83NjdFrsKCzk9rycLfNlfVIIn2VZub1LQM918rf0BLDW0rvvPjNEVBH+83ZFUVDx4JEg28a/WYD/hXefGRbOs5LDWkuXlxdGnh9Zjkzq65KQ8bactLiiNLB2I9y3RJT45Wuh8ECyHp+c7uCTAMda2PdVj0sJ0AdDKzDG1KA3U67E1Tm2AHtIBVozL4q5u6CCKSMfkNoaFGMDAAAAAACA4wbvBABMD991Kd/lpeW9DKcjQ//o9Y8fPapY+POHhf06ZJBPRijXGWPo2bMrQ7SxsGdPACn85xA/LIDXx8gC/GcPeQQ4kgbnGeA8AnI/KfQv2xfoSz4+VjZYa6txe+T/rOiQZTnKr9QfkM8FFQDzd7HdX/1tlQB919+FqSgAuvfLYYVwiEHfkPZx7GNP2MauH4RxWTHgvAEAAAAAAHDcuKyLj+n9HYAmjOEV0EQOzLH1iTaC7dVqRXd3dw/C+bxSjhToS+G/jPVPVPUIcAnYr55dGWk5f3V1aRaLBZ2enpbx+7WFv8wj4DtGziFwenpa5iRgb4Q8z+nm5tbyNly25PLyYqfDbm5uLR/DzoHYajR/Q4bIVGP8G0s7Fs+h8yLb4eq/aAXA3Gkag91HUwtuLZTl36H6Qx4KQ7d/6owdQunYGTpHBZg2c79/AAAAAAAAAPaLS/APmgH5x+HjCzOzj3MbijChLfrZMp7j5GdZ9rBNNU4+0UZ2yQoCDvHjChtUEeJvK6+04dmzK8Phh5bLJaVpSkmSVGLrS8F/2dbA8UqvAdn/OpY/L5PlcL/s9Js8BmN2hP9kZHAfZfUv1l1eXgQyaFXlw5yvYFP1Zs9FbAz1qViQd2Vf7RsqBNDY9PWw1v3RtNy5Txb6fIB3m0gNm0TmUMY56EZsCCCMHwAAAAAAAA4HCP8B8DOGtb/E984u28MyZBasG2NKa/5t+J3tdlKYvlqtvDH4vXICFUlgsViUHxa639/fVwT+/D/3JVvD+6QLLMy/u7ujxWJRJhNmgb4W/rvkFK7QQE3O4kNWYTJEdKWUCjt1dYjQI5ctxk4yO/YNf6j6XWFYXBdyyIJ67Bj0Q+9PtDuw+4wRPvcQVSHGDqsydv9AATF9EAIIAAAAAAAAoME7AQDTwiWc17H4Zdif9XpdWt7zuiRJKE23FvEytr9P/snbXbPw3HVvMKYUzuuy1+s1XV/f2MvLC8MCeBbqV+SMHvnQ9c2tpQe5xdXVpZHKC96/TnbrClm0myBA1c19Laz86xQLvvWubZ3tsZbMep07d2RiQ3yMrQAIlT+UgNgX4qdvjffQAu59nD+ZPITL1DcZ/75x5ze0PhxiKc6DJgTX7/OQcLoYtfI06ScJ9lDEJvEOj9+xFaD1998wcSHAYml6fXX18GmrwOlaz1DEKqCGbv+xK8gOTYGoj2du7Qfzx2UZ5Zv3xs7f5p+jbNzn99Ds8/kXelmeIkP3zxTe7+qJe/8wJo3av+/n/9yev/Hyh+37S9Nj9dXpekaEI1RMJwKF67hk/UNcS23kF1O/FzZF9mm8/KM9++xHFm5zvWzN7rQG70CT+99WHpdTUWyueWvNw7Wf0MnJgqw19PLlC1qtMkrTTZvW63V5DLyMPQM4nn4q5FtcT57n9Pz5tXXKAFk4/vD9vX/hew3vw30jBf6cvJc9EYg2YybLMrq+vrGJMW6r/Id6OWyOvo6ur28sKwM4HJBcz0l9g9iH8D/WlvH+DT3IQiuhgNzeA65cAxKX0F/+b1arrEkzvcTGqB9aAN7XDcD/ArP7gqPdQ3i9+8bUnwDT1UbZFpeF/VRCOPUpuBv6AdAnTdvn65+hFVwh9u1B1PZ42mzfra/CLzD1Hi6HLQAYmtALV6zCdegX6LFfwKd+f4xl+gLAetqOn77Hy9jHPzZDX59DC4xiDRxC83ui3TaHjGLk75ACoG3dbZn7/SEkAB36/So2B1ksobl++P7Zvn+qdcYJoOOJFaAPa2ATW3+YaYw/33N46PmhDEnRpf4xqF4/7vfY5u2vP/9DG2ANbUAWpnhoR7N5xO54i7t+4sdX+/tXVQEQV/vUDXClAFtazscq28JsLfhZ8ZBlK1qtMsrzNRElZIyl5fKUiiIrFQOb8bQNucNKAGnUy+Wxgo8/bMWfZRn97M++Z+U94Orq0kgr9mfPrkyappWyXEbE19c39t13n5nT01Pi7VerFf3v//vP2KLIKU22z29XT105vAbYO8ASUeKac2w2pIfGV70XWBZEG+G99HCQ9XOpVvzvRNav76GOZZpFbAia2AkEGI4pPvwBAGAsXGHYAJgqeIaDGMYX0IXKxr0YAAAAAGBKbL0NWNHI8uqciAyt1/el5f1m/TY8jlwuMcaUig1ZDwvz83xXKXd9fVNOFC8vLwwrDe7v7ysW/9r4mr0A2FCBvQ+IiJIkrLy/ubm12spezlq1gN7q/63dSeCrPQZcyHJrZ8haltFSthGtANAnsm8OzUV/SCDcAgCALT4PLdwnwSGCsd2OKc0fXW0Z20OoLXXtdY3Nsft/7PqnDvoHAAAAOE6kJT5/pOW9tMBnj4E8z52CfFe4bxb653leEfS73t3Z8j9NUzLGVELcSGE9l/OFL7xbKgA4N8B77z237FVwI+oL9YFzLmQtWb1cWvM/rDfG0JVQUFTmwZ45/M5Sjhwh1hgyZPWWFYeD+vlb0P9Humi4PiHkCXd9tGuI/hw6of5psn/dbwAAOHZc98kmHwCmjGucYtzOD9/9aU40OYZ9HxPu78cNzn8c6D8wZ45dvgRAH7DV/mKxIGlRr7eR4Xx4me854ZL/ElUF/ldXl6XQ/NmzK7NYLGixWJThgi4vLwwL/dmyXpazXC5L4X+WZRWPhKbXPysZKtsbEZ/fUY4pN9sK/3U+B6nskAoDXY70INDsCP9bsgg9xMd+yA+dQ+AQ0Joyl+YMAACOmS73xbFDaIz9/J07c7Og7opvDgCmzdgC8j4IHQPmpwAcJ3O8nwEAAJD5CzeW/YvForI+z/OKRbtWDrvu/1LYz94DRBtZ7+XlhZFW/dbaMtEtKx6stZRlGeV5Xlr9X11dGmmU/u67zwy3ly3/df4ETgJcRzAGvwtjytA/xpgyZBFTFEWZR0B1TPXbmErOgNKbgEx1Gx37v0Veo6AJf6wGVcaCcn1gYdAfh/AyCQAAfTEFK1QAutJ2foSx3Y4pzT995zPWQ3TI/dvcW30eAjGfWMauf+oc+/EDAAAAx4g01jBmY+HPngCLxaIUuPtkwrxMzhU45A8L8aVVPgvM+TcrA7geThL83nvP7fX1jZWJgZMkocViQScnJ3R6ekqnp6dlOKIsy+j58+syVwC3rQl6q7J9ej4rPw/Ce/Zg4PpY+F/xePBW7PcsYOWAEf9vl23/QiyCW0QSG8P/0K2E+j5+qY0DAACwe1+E8AIcAi5raswB5schKCmbKhT2OTaP/f3i2Amf/z01ZKbg+gFzJix/2lNDAJghW0G1rSgB2BI/TdNSoO+61thDgMPfyPA8OkmwtPxn2LKfn0O8z9XVZRnrXyYF1mF2VquVt45Gc2xriYzZSQZcJgI2Wwt9nSxYUhQF3dzcWpkYuJI7QMT3l4L7oZ+vi1AFTeL8x+wfOgmhJMVzfFHqE7zsAwBAGNwrwaHiUnBhrM+DQxD+u3AppwAAAAAAwLTZWvZvo7UQbT0D0zSlPM9LOS8vZ0E8r/N5Djrj69PWE0B6GXC4IPZCSNOUvvCFd42sk7eTXga8nsML9R0mlYX/rvLYQ8EV49/3jlZRAtTNnY2peg90mGebV6/u6zc4kJcRH12Oz3nS1ImVFwqvdw1yonoFR5g4Bc0YuPvBHy8shqEtWIa+PnRsNb3u0F+uXcfcBZdrWh+YQLw16f6mBSKbdWnvbTomfPeSptsPzaE/P7sg+wRjvp424wd92Z6p3S80c2mfb/7L+J6/oecnCBE3/x97fMU+H2O9+qzNo+qX87dxiH1/rNLXfHt/xBkYhmibL0rO7VlYBerev8aVfzR5f+uz/rbvK2F2+89XputY9P1rqPdkH037X88ptu1KauVJIQPiPo+vS1mh8y+F5mw1L/tkuPNTlHVs6qw+J2XIn9VqRavVqvQIMMZQlmW0Xq9pvV6TtM5nwXye56X1PlHVMp+XsYLBNQa47qIoKE3TMtmvFPxL+ZjLu4BoG1JHC+j597OrS8MCfG3lf3Nza9kTgdvkOhZWOmhhvSVLxjS7f/hGSej8V9Y7Chk8BBAAAAAAAAAAAAAAAGAaDCFMHioEEwu/ZflsbCe/p6/AnDY656u24s/zjWKAQwIRVRP7pmlalsPx/rmcq6tL4zs/Lm8DlwLIpRwJKX3aIMP2WNEerv/6+mbwAea6RBpXKjUctrrMkIECAAAAAAAAAAAAOEZ0wkYAwOHj99DbnweND18bNoLYaj1t64vNUXro+PpVWuCzpb4MvcOKAblcKgaINkqDPM9JhuVhZEgfrQCQbZK5BWRegTbjQG8pf5d10UZu7rT6F2OE/6vLB9CGStLfTYXEColm+xti34PymiZTFgz/NAAAAACAiaEtcPQHHDY4/wCAoXDdR3BfAeA4GPr6l+FfXJ+m1IWJdoF7WH+wgD9N09LSP89zWq/XZfJfFsSzAoCF8NpDo27eKkPoaA8AndyXt+UxxG2SdTchFEO/NJy3dhseSB4T/1ahg3rDGK+bjG1SmzGVpMIaKAAAAAAAAAAAAIAjwiesAQAcB0Nc8zr5qy8ZbN3++v9QeBgG9694ZIJdju9vraX1ek2r1apUAEgLfCmEZ4t8oq0yiMtgLwEXOsQPn1+fhb+syxfvvxYtwBdCfbmO15d1yP2sreQJmJT3iFF5NOxGgYAQQAAAAAAAAAAAwBGCEEAAHB9DhQDqg7oQQMbsJgEG/bG1ut+G8cmyrEzyu1gsKM/zMvGvVAhs9tuOI+k9YK3dEdTrGP9FUVQs/GWIIRZms3KB6+QydaieWvT4cXoC2I0l/UMd5RasiBL/62OJgmtylFdn2a/3N2TIcsJty14LSAIMAAAAAAAAAAAcBS5BH5QAABwHLuG59gSaAtLiX7apzvK/j3vYVI5/TDahddaVEDsc+99n+U/kzxvQBC6TvQ6IqKyDhfzPnl0Z3Y7WqHA+wW2NKa39OS+AVAJcXl6YPp+dZR1yzBOVCYlDuQBKxQURGZM8tFvkUOitpQAAAAAAoBcQA/64wfkHAAwN8gAAAPq+7mPnLy5hqg4LpMPE+EIEdfmAjeB9vV7T/f09rVYryrKMiGhHMK+F/6xIZgG9Dt8jE+Xqvr65ubXX1zciIs/Wwl8rqNom/W2KjLHPQnQp/GeFgCGqhP7pvx27cJ1Ndra0becmp8A2nNFi7oM81P7YgRHanwe366bUBGPSqPrD5U/v/GprE72sbvmQbRkDa/1x0Kq4LnnrWLZvikFLdw3/Pm7207ksZP91Oa7j1uEe+v3hEIFwoTlDz2/AtBn7/hOqX85/9YvZ2G3fB9aG+6ee+vlT+P0jUHyQ+vrD5Y87/9D963uPaLp/3wx/f44bfzoPZ9v+wPNngytJ6Vj3v5CF9D7xjY9taJF9tmaX8P27+f2tq0C7DboOV/vkJtX6XO3T5bVrX/z4Cs1v+ZhZmMxzDhYK5w/buY8j9v6UpqnXI8JXZ7X9u9tX5V957fokSYnIikgwlqzl+Pq2VSLlJvhi6+e5pTzf1LlVkCRkbTXhrwzNI5fJ/AF5nlOWZZUQQJeXF4Z/y7njYlENUvPuu8+MzC+QqPvtlRTCW0sJz0+JdoT2l5cXhm3gtdfC7e2tNeXv7RzXkKGLy0tjrS238fWhMYZKJQYL4K3dvQq5brbWF8J6bjuXwftbW9BGrq/mO65r3D6EcCrr2fbXcUuPAAAAAAAAAAAAAAAAk0dbnctlsXDsepkMlz8s1K77pGla2UfvL8vWH59wP7S+7fH5PCYkss38SZKkDAskPQCkIoDLdNUr0cL/q6tL8+67z8qNelM01yhppPBft5OP5+JiE+KH/3cdQ6Xcjcaq2oSHdpQx/LkOqQwTngWiQJFs2HS2/ZW7QQEAAAAAAAAAAAAAAACYLFLorD9165qGIOKwNT58wv2mH6lgcC1jtGJAr++K7gv9W9a3WCxosVhUFBe6HB2ORypJeDsuV4fM0Z5LLq/SLnBdLFCX4Xp0mVL4r9vC/1faR9twOkQbJQB/SNRXseInqQQQeQT4HFcr3xw7t1X2kdIAOK3/1XFs9918kAQYAAAAAAAAAAAAAAAwaXxW/00E5CGhsi+cVp11u8YXJrxuf18II11GnXKiCXp/XZ+0/OftpaCfl/My2UZjDC0Wi4pyQH5ubm4tC+K5j1hwLtullTX6nPjO4c3Nrb26uiw7zBWjX+7rEv670B4O5XKqWtfL46t4BzyE8ikF/0RkqnG7yvKq5bcQ/nuORLcZCgAAAAAAAAAAAAAAAMBkcQn/ZU6i2Bxa0mJdlsf/hwTwSZLstLFp25rQZw4A3Sb+LRUARER5npex/ImoEupIC8YXiwUVRUFZlu0I/4mIlstlWYe1lr7whXcNb/P8+bX9C3/he4Od5FICyJBCLnj9/+3PbQT0WvjvU7zc3NxYDv2jLeolWrEhCuYC9UFUf+vtdG6Gh3wBTQX/PqAAAAAAAAAAAAAAAAAATB4paNVC7BhYwO4T1ofKlyFxdPs2wvJ2OQt0qJ5YBYBrf5fwW24nrf15Wxb+y5A/rpBMUvhPRHRyclJuL8vksD1aseNqm1T4EAnhv/hfWv/f3NxajqXvsvoPnYvb21tb5gIQy7WHQWUcPtRXeglwfgCXQkAkCjaupMFlmR2E/2oYQwEAAAAAAAAAAAAAAACYLNoi37W8jtD6kIC8ieC+PjHxbuJiKdTWx+GK2R+Dr59cgnYt3Ccikg4QMi/Adn1BeZ5TlmWU53lFIM/hhXi7LMsq27ECIBQmyeUBwL84Ea9UOkhhvMbVnzL5r86NIC39XfuVCg+uz1qyQnHgUghs2yeCChlDD7qizfJSQ6AOWB1HpV2Vfzc/oAAAAAAAAAAAAAAAAABMFpcFeJ1guC2+EEOy/ib7+9ZZW3i3lTH2d/drlsS4Lb7QNzIJMdEmtM/mO9npGxbmc4igPM9LQbgOK8Tbr9drWq/XdH19U25zc3Nr//yf/x5nst6WB1UK3SvCfxa6e46dj/viYqOskJTKDnX+vZ4iZb2WjKVNe3hskVAClNtvhPzW2G28f+kxQELp5RH++5B+C+b+fl27cbCwyBhbfcTBmhL6eORNyDfAwG4/DHFzC9W7rzqrNEvi4u+fxLPcvZ8m/pjjktB0YZzz1A05KXGNtfhj6S8G4BSIHb99j3fcnzeMdX8G7eiSCO2QaXI/0AnZ2tybh3++jkvs+AlZmLEL/FjEv5/UP39d8/+qgCKvbUts/WHq52/D198v7Z9TsfPXuOMf+v4QPn/V42/Sf20EYKH1oRjafVx/MYSO31eP0wJzBFz33zbnL8T474/Tvv6Gpm4str2Wu9DX+G4zb5XrYpPg+urv6/qNff5oLwAZUsgnW5T7yP6RQvwm8ghWQHC9LMiXbSiKrLJcH3uWZbRer+m9956Xgv13331mlstlWfZqtaKf/dn3rNzPGENXV5fGWkvL5bJUOLCXANefPgjmWSEiw/s8HDQZ2ngc8PGykuGhF5397rpHlmF/RL8tF0nZH1IRxcqOZ8+ujLWWrqUXgKNWcfDb0D566Diaaozj/ifK0MmCH3Yq/4UHAAAAAAAAAAAAAMDMmbuAGwDgx6fs4d/sQSC9BnxGia6ypXA/z3OHEmC7Toct4jLSNKVnz65MURSkw/5wmRprLT1/fm2NMfTs2ZWRCg1Zj1MBRhsLe/5fCv/7vh9K4T+TJEmpvLi+vqlUWCf43/y2u4J/145qvx1PBFeCYL0PQQEAAAAAADB7+nB7BgAAAGLBs2hcXJasY3slAAD6pYkHksvDtc77lS3/paCeP1tlwlYpwOVIJQAL/BeLRUVwz9tnWVYJ+yPbz14AibLy122X6GS/Uvhflk3kDAHkQ7ZbKziKoprXQG5TUQzIcEHymSgF/9w4cR5MEvAwZkt/S9vyH0IFOa3/FVAAAAAAAADMDJdlC5QAAAAAAHAxlEUsAGB/1IV1cgn4XRb6GmnVvlqtKkoAaf2/KX+rKOB6WWAvBf28XArGi6Kg58+vrQyfI9t4eXlhTk9Py31cIYbSJNnpAw7B4zo+mQy4KT6F6aZd9fvaByWDkcoGI5L97hRKRLaBklbH/Te2qgSo3RUeAAAAAAAAs0e/0MPKDwAAAAAAgMPDN8/35fnQoYC0ZbsWpnO8fR3qhrdP0+17B3sG5HleeR/hbdkbQHoWbNu6Kfvq6tLwthy+iOuWSgaGy3PmMKDqe1G5roXSU8b/962/vLwwrFjQHhROpPDfZa3vqKmiLqhrvkshVLMDFAAAAAAAADMH1v8AAACmAJ5F0wTnBYD5IwXgWkDP64m2AmkZxqcoCpLCdhmfn+HQPT4hOycx3k0OvFkuw+NIK/6iKFR8fFYopGW7kyShu7u7nWNu4sWghfKVBMHCIr/JXVAm/90JUyS245BDMulvxSK/DPezc0D+yvl8ckz/SvQgdxikTR2ORMLsgCBabe7v1/7KKfygCFmaxe4/N1zJONwXjnv7Y6VJxvqh6x1nUtQsi72/fxLPcvd+mvhjbtb+PpnT5NWXcKfuntAORxb4GRM7fvse77g/bxjr/gzqkRN8Cc7Phib3g7o4qH2UP2di73++UBPb5+K4/RP/flL//HXN/+V4s3abAK/b+0Hs879+/jZ8/f3S/jkVO3+NO/6h7w/h81c9/ib957MudRF7fH1cfzGEjt9Xz5Q98dqcvzZldeOwr7+hqRuLba/lLvQ1vtu8x1VjsPcjf/DPT4a+PsLPXzmHkkJ2uVzG4SfahtvR+2ZZVn6KoqDFYlEK3tM0LbfnetI0rYTs2T2eTZmr1YrW67UzTI8Mu8Mx+m9ubi3Pvfn7C1941yRJUvEOeO+958JYfmNtz8dG5M+NW7ZOeBmUCoBK+9z78XFeXl4a2Y/awMpQsRX2bzYoCy49EKTFvx5nHMO/Qbx+qQAox4AvR4Dergw/9FDXw294AAAAAAAAzJSdiSk8AQAAAICjBbH+AThcWPAvk/OyQF8rL+R2UshOVA3hw9uxAoD3lWGA+H7y6NFZub+LJEkq1vjaKp+5vLww3OY8z8vcAPIYpPC/DGH0sE7nD9CKDJfw/yHcfi0+4T9/39xuhP9cjhbHGyKyD0qAzXZK4F8a6lunNsOYpFHIIi6PlQRlO3kDh7eAoQYKgL4sgLqub/rgGksD79IcerVFM3wp900g+p5YjNUv0gLLxfgeAqG6tQXPzp615cZeHrFd0vb6rHN78m0fQ1/3j7pEMnWELRTjjs/a6VkotaHt+en7eTAXDzeXZxpR9+tjKMsf0A7Zf1Psy9A4CVlwxc4fY9Eu0X3T5v5xmB6kY1uQ18//QrR5frvfURKxPqopTsLjIx24/DiGf76OPf7iiL8/tu+/Nn0+9PjYhwV7nQdP13n9vgg9M8bw4KjeE+PuP31ZgE+VLv0vx+vQnrtDRQhpMtfp4xrzeUswseMr1MY0XaikutUkucvlkoi2AnMtgGdBvT4WDu/j6jMZZmex4OefJWt3k/3e3b2sbf+nn3J7NtfyYrERKcu4/UQJXV5eGX0fvb29tUSbYz49PaXT01Oy1lKWZZXjYeUAKwi4jdfXN/byshqeh+ssiqLieeD0ftG/y222Bv23t5s6NoqHjbxrU/YmfFGpgHho77NnV0aew+vrGyuF/xzKpzzfSf39z+pazEM79fu7lAMZ8X5fbD0TLAmlx0MZwRBAQ3NoCgBZp0vg38bVaQrsSwEwHs0FEPM/1v7Zt4C9bX1jKwB896Gm7Rr6BXhqCoC53R+PVQHQF2PXP3em/nwaQ8DQBm2wIdtkrY1WAISO79AVAL77zL7m5yHaGIC414de4Ma9JqcugA0xlIBpKgx9/wufn/r3n6n3X6wAeSgFwFQY+vrpUn6dUrQth64A6Ju21/PY93eJvt7YWjyGWAOVeArn9cBC7OVyWVEIVAXrW0E7kfu60gZCOqGuTOLLy1ipwP/XkSTbHAES2Wa5TLfp9vbGGrMJ/3N2tvEm4HBCvF2abhQLnO9AezDoccH5BaRCpSnVbS0lDwJ6Tk7M5csQRoxR25VKgIdtSZ4LDudj2r9fVM9z/bEVhX5mcUs3IAQQAABMlKm/YAAAAOgG7u8AHC64vucPC5HaWM6D/XDo56FvBdwco1AQDWP9PwV03H6iqrW/9A5gobcUfrOlPyOtz3m9y3OAt82yzKlgaDpG9PYuJY1c5zPwy7KM1ut1aeWfJAnleV7+L/uG63R5b+i2+/5v5rm1ve+7js8YsxNGSCo5OCmwqmDzZYlsg+gNrja72y6Ps+6Yqszb/xEAAAAAAAAAAJgJMnxBlw8AY4LxOW18YWDmhBZ87rP9sffnpteHFmJzmBuZtFdavruE9FL4z/vy9jr2v9xO1iO3a6IEcLXH5zHlOtbLywvDoXLW63UZ/odomyhYflzHob9l6B8fbb0CZFu43UQPFv+8nWizK+eApkni3xDbvmSvg22bd5XW5RFtlw0dAqgPF+0u9ezLxbjOLdul8ZpbiAufC7dv+fxACKAY9h3CoW19+26fr37f/WlsEAIojlgX633hm4SNPQ7Hrn/uTP35FBtiILb8EC5LIvkCM3QIoNiypnJ/8eG7z+xrfh4CIYCmXX7s8/XQ+z9+/nHcIYCa4BNojX3v2gdDnP8mlrhdyjpE+p4fzbm/XIqA2BBAIYbuL9f8gwXyvmPztcnlJcB9pQX6rIDIstWO9T+vb9Z+kZBXKDZ8YYF0+42xlXA67777zCRJQkVR0HvvPbfPnl2V8f+lAoDLkML+HWt7ok0Mfke/tb3v8Pa6juThWK9vbjkRQinWt7QRy1f6QtZrN1kB6gi12Ri5zTZ3we6zyl0+QgABAMBEmfoLLgAAdOXY72/HfvwAHDO4vqcPC7R8FrtgPHAe2uEySg1tH0Nf97cxvQCGpM7A1hhTCREkj91lrKIVAC6BO+MKC+TyFolVMMvx5hp7LMCXioo0TSlJEnr27MosFovKcctEwFphwWWxkF73Ux9jxhXW54aF//rYH+q19BDznzahfx6k9g/L+rq+uB/oQQ9RL/hnoAAAAAAAAAAAAAB6ICRAGdsDCoAYoMCeNi4Bc1slwNiMGcJoeA8u2hHCs9epMYbW690ILS4hvSsUjz7P0jKfl+tEunVKAxd150Z6BfjGH29zdXVp2OOWFQDcNg75w33D3gA+ob4rBJCrDa7jrP62ZBxJemX5z64uzWbLh3IfvAC2JRBZW5QbWGM38f+pW//qNrqSADcZslwEcgAAAAAAAAAAAAAAAHAAjClE74s5tjmEFsgTUSnkXiwWZQLcJEl2wuvoj7aI1x5LepkrTE/bkKKyXV3ODwv55XEmSUKLxYJOTk7K49Ihkax1J9nVxyTXh9pZDaXjNOp37iNiDFXqvby8MLysbJcU/vegg9sokNrvw5jVKvNvScPHYBz7oh6iffrCk4OyL1eUQ6IuBm/TfZtuv0t9DMy21N1QuxLTP2MzdAzDsfugiQvckMRbmNXrgGPLbxND2+eq2Iausf261NUHc7dmGfv6G5qx5z9Nrq8h74mh63fs/gkx9vhs0v668zf28yP2+Tb0+Ihl7BwAxx6jf2imPv5C9csQEK7t468/d8znpu8YY5//feQAGJOx+3doxn4+hxjaQyf2+g3JG9qGdGlbf2z5bakT3naZN439fCiKrNbKO8uyioW/tvJnS3ktY9QKAblclm9tXm7L5bk8AfT3VhblD2Gk99MfIqKf+7mNEJ+F/jLkj7WW1ut1GfM/TVNaLpdERLRarehnf/Y92/T8NBmnUgGw+V19/3Gep6LYxP031ZS+9qGAnbn9jtS/vQ1+1ctju7zaPN95qZY1eAiguT+gAADDgfvDvBlbgDH1FwgAhqbOxRZMH5w/AEAIzJWPD5xz0JQpjJUh5y5TOL6+8Rl38v9SuK+F5y6BvkaXp5elaVqG12HjZO1p4CqrKb59+Hil8H+5XFKabhS6HPbHdcy6jTHjwt0+Q5vwPw3GnBL8Ewnhf+dWhQlfZ81CAyEEEABgNhzaJMD1cG/zGRr5sHV9psTU2gPmT+z439f+LsuvPj5gP/jO3z7qPebzf+zHHwv6bz+MdX8AAEyfpveHtveMLvPEIe5LdfNbvU2b+oeen3fpP9f7vbRk54/2znVb+O+WJctI07SMuc/fTY67qyeJPm6ZBFh6H+R5TlmW7SQzlsfC4X1iZCKb7flDoo0JueL/y/2stRvh/0N/laWw8N/RFqP+2rZV9uOmv6j8bLfbDQ20e0oNERkkAQYATBd+GPksJPESBIj8rq+wpAXHgrwvzgXcv7fM8fyFGPr8xpYf6u7Y8jG+QQx9CPGGZEptAaBvpj6+Q/eH0Ptzn+3oEoKna12++l3HXsfY8y3Zxjpred9x6RBxmlAITxYk1wnP65e399DX56UoCsrznNbrNRljqCgKWq/X9Pz5tb28vDCsJHj27MrsCsB3+68+vI9uS/nfjgKJFQxcv1MhI/tXCP599v9thf6yPre3A/8OHZ9rHwrnAADt0Rery4UFbNEXXsitybVv0+13QQ6AKePSjtf9nhqh8z90+8PlxzmBhcpvM/776IvQeKnbfoyxtM9nwRB1Tf36O3R4gj/UfTH2/jX2XGfs8Rk6fp+icux2N2Xo8zv0+IrNATB1J+qxrz8Qx/BCtcJZdtP7z/j3/2lff2DexD6H9/l8bKIs3Me8YowQQC4r9yaMPc/iHCzayp0F+5wDgJe55ok6BwARlfkCwt4Z7twCuj79vS3H/f7B66WCwi2Yzyv78H7Pn19bLSu9uro07KXA7ePyrd0kBd4eA7ez+fNBCv65LUVRlOVu6qnKC9Mk3bH6t5tMvw+FqjrUAttQIaAVANt+seq7zvJ/t67RcwCMfQECAMaj7QTp0Kwkpz7BHFuA0Ob5MXZbweExtAC8LwHKPi2wQP/4zt/Qz7pjn5/jOgFzAB6Ox8mx359BM8KC3u3yPsfMPj0MfL+lULqtge3YBi5aoCzL9R2XDgXjU/w0CedTFPW5BaptrVrANzl22WbXWOEcBNfXN+VCtrx3Ka+kcoSISmXAbn1E2ireFTVC18F163a6fhOZqvhdC/9lE3YM9011fQB/Xze9ztzXz+AeAMf4AIMHQDvgAVDPIXsAzN1CMnaCEHLhCxF/fw27CMaV35wm7oK+fXwTxFD/wgMgjqlch0MxdQXAGBZebepr2/625YcYe3zGnr+pKwCGPr+h9SEX9xCxHgDWjju+Q8zdQwPs0u+cJc4DYHwO2wNg7PsHmB8uAWfXecW+Pbib4LtXxbw/dl0/hAeiSxivrfR9HgO8jLfVAvJdi/68UrZug8sLoHr8qXOdT3iv/08SqljZ1/UnW+bLOZ8u1xWuRx97nQJAc3V1aaR3gfMY+Zxo4b+hHQVA6QFQUVS0oypLlu1xbV3vFYQcAACAyeOykMTkFxA1t34BAAAAAJgjmNsAAHw0tfwfykp/SgrtOdwr6wzYrLW0XC4rCgAdqifLssr2uyFiqnWFjEd9fdb1vLq8FyQ6xI6uz3cccn+JtOAnotKzoIn3gktRkiRJWYc+lsvLC3NzfbPdSwv/K4WLZT2My/D58N8HKr/HzwEQa4E9rgWAazC105rWWyCFibPgDRHWgMZb6PXlAeArP2b/EG0sjLvQdP+uGv54C7r9PfDHEPj3ZeHrs1qYuoVxiFgPhnjGvf+H7n9De2DEMrYSTb406GtiCkq+sIXz2ErIsS0gp339h5/PsffXdtdn35a2be8PbT0UYz0ax35+hxi6/6d4zJKxhSTx8xO3BbtP4LDLtO+fw7e/iHr/iq1/+PfTfsrv+o4f7sNYD+A0sv44iiJr3Deud9RQ+4f3oI6VX8R5gMWze/ztPACGff8In5/w+asbX/Hje2z5YdgDUZ5Dba1/f3+/Y6lPtM0BIHOE6c+m/O1vLkMqGWTdWoHEy6vHsztf1Jb/siy22Hf3TVXYLq3/uZ03N7fWiPVy31KxwM83XT5VLfDdHg6bvS4uqmGJ+Pvm5tqStQ9lFRWLf0NmK+z3jNNQDoCgssKq+Y/2NNis9BU++uxn9ow9gQbjwjdo32ff7Wjarn23DwAAAAAA9MPc53dzbz8Ax0zMNdrH9d30PXeo+8ux379cgmX5iT0/h96HoWN1hf6RgmqO8+9SijQxTnAl/3VtV1eGViC42qrb3QTZfpngt6LA8LSpTrFARI0j5zO3t9XyvMdjPI0iIqv+mlKnmKic+xrhv1EfXocQQD1z6Dcs0I6hxwPGGwBgzrCViMtyCQDQH9IiC4SZ+n1o6u0DYEgw/qdF3fmY4rMndvxM7HD2ztAeOEOXN0V8wmXXsjTdeNCwp0XISl+X7dpP7l8nuNfXs8sbgNtXdwwh+N3w5ubWXl1dGl52c3Nrr1TIn9Lyv6687cbkldar9moFCysE5HA0ZErBPgvhK32kGmVNs/p9Y36zXJxvlV9gZy/hjcDr4AHQI/pEHcPNCoyLz/K/KSENPgB19GHhMefP0P1z6Odv7u0D0+bYz6/rOI/huAEAAOwP13MGz555E2vh3yeHPpa0NX2eV8MD8fFy30rrf19f+CzwfWF5tMC7TsAfwhgTlCXpmP117SfaxPSXFv7y+CvCf2t3tHOWtPA/TF0IK6vrMIb4T2LUPj6FQG09sjxxvo34I2Me2lAj/Ff/wwOgBw79xgQAAGCX0L0+VokW+yyZuhKPJ278zcvkOuBn3xZYh0Zs/8Re//s6P/qFDuNiw9D9gH4GABwyIfmH79mDud38Gfr9x1XHIT1Ti6KoHA8L//nDFvSu9yRJV6PNuu11u/jb9a7mK9undJCwEsAVtkfW5bKGl0qGivCfNvJ1Z/tsmwA81Xql9T/XQbQVuFtZn+5bzgvQEnkMO/9zHaVCgCq/Q4oOeABEcsg3JxBmbAtU100WEysAwFzQli1yGQCgP3BdgSlx7B46IA6Mn3FpI/8YQlYy9Pv30O/vh07ffXhofdo03I/PYl8nBXaV65MPaQ8OIn9ECa0M4LrrkML5JjKpkDdAaFsp/CfyBNeRwv8GbZLHrvMAOLcnJYQXihJjNh4bdXkC6uqvRSg95G+9Xv9vVqusWUsGIy6L+9g6DJ92hgkN/FAW8DDDZnEPW7DFCZuldo2/fZpCd/3TtsAbuv9jtw8R27991j+GYiN2/Pg05U0tMfuqv+v+02dsHfa0n19zOf8uN8cpMPTzLxZr6/tp+H6MHf+xxF4/w16/Y4/rJEmc7Wj6LI1t/9jP71jmcv/0MfX2x88vC2c5+l3Cz7TnD8O3v4h6/4qtP3b8Df1+4punN2130/HbFWPS2vXD33O37e/SJ2PPX+LlF+O+H7vGj0sm5X/+D3v/C5+/5uPfVVZICB1m3Pt/UWQVIa8M/1MUBS0Wi3K9tZbyPC8F6sYYyrKs3F4L96W1vi/Uj5Q/6vt+3X4u2igy6nB5Asj78OXlheHjSowI/eMqW48ZVgDYTSJeef9s6g1xcXFhSmWALcqwO2VdWhiv9ifuS7LUZvy559IP8x9P/H/toUBq+dizn4Nm7Mk1OB58ngCxHwAAAADMl0O3pDtWMH8DAEwRWMHPnynLDw5hbEkL+yRJdj7S2p4/rBzgb+kBIBUJTc5ByGOlzgNAfrgNur16H1f5ddR5BVTapL4fNqgtuymuNl5cXJiLC0/blLCfubq8MFeXF4aMad22kCFN6deglQ/it/zwuk4eAP1a9QyrwRvbQjasgQ270dQxtgY91oOBLdR8NHEzil3f1TpuDgw9vmP7qun5G+sc9dV/Pg+Aoen7/I9t0brL2Drs/VigjDV+jp3w9TP2eaiOn76vz7kdf3vmbUEWy1DPt9D9ymdZ2zexx7fP+6y2xNb1d3mBHpuh5++x709jX79De4CHaRbGgWj3mt2sm/b4CzH+9TPv548cv928IsZ+ftZ7MITv/9Npv4uhPQBin6+h+aNvntB0fhF7/oa+PxRFVlvPer32CtmJiLIsc/aFtuJ3CeM3+Qd2y2aMMTvL2yoYYte7vAGkUsC1vqayqoLAWiKTiJ/t51eGhMBd7q+8AaRlvnpDi5zXBa4/xxYyRBGSAIOjBoI0UMf4LwgAAABA/+D5Ni7dhE7zAeMLAAAOk6nf38PtG7/9dW1kLwAW4EthvYuQwYBv+y7ncch5Sp1g/+bm1rbJFxCDVojE4Nq77jz2dW3JcEBS+E9EUACAOKYeQ78th/TyBQAAAABwjAwdYxzUMyUPCwAAAGCKuCz5kyTxWu/7hMRdwi/JPAPSe8AVIYPXDUFTi/5Wlv8DwOF/fu7nbm3Fyt/aangfFZOf/2/a+JACIqjeMmabB8DhjTC2/xIAg9ImRt0hhwICAAAAAADTIBRjFwAAADhExswhMAVcYf+IdgX9WjCv99fLXb9dSA8AzkNQF25pyPMytlDfRZ1HRSXZ9nbhzjKvkF6FaYoNl+Ti8vLCVNqmzi0UAODo0RffsTx8wOGjk/yEkv4AALYc+/Vz7McPAAAAAADAUPB8Wib75Y9UBEhhvaaLAsUV+1/P7+vyDAzBrBRBNZb5dcJ3Ir9Q35eQWXJxIRIK+z6klACybkIIIBDJ2CGAYm8OsPoHdcCFHQAAwCFy6M+32OMbI0kxFGsAAACmztTnD7E5APbRfp1Yl4X/dR4RvuTOspymHgA69I9u25B94Crfd0xjzItCShAZzof/r2yl28xhgjxlymUXFxfm9nbXK4LDDzXl5uZ2W6PqWygAwEHT5gVv7IcVAAAAAAAAcwdzagAAACCMtP4viqK08h/SUFXH/Ceq5gSoywOwT6H8WEoAFyyYT0pT/41gX7dO/m5yxowxdHFxYaQSoHb7QHmVsErW7rQBCgAAPEzphgMAAAAAAA4Dl1XfIRmljO1hAQAAYJrg+bBFCuJZEZCmqTM8tYzd7yujzdxBluvLS6DrOAaixp/OpUD1SoA6bwNJ2/63m53K70qdq1XWqBBfYghr8/rKIy9wn6uL7wLomyaJGeqSZsSW37R/hmLoi31sF+2xyw8R2z+xxzf2zX7qL8Ox46MoikHLH3uCNfb1MzTx/XvYaXjGHn9TZ/79U3//mjpTv3/X85CwzUbcQ0zc+ZPWYXpO3iRBXXT/xBw7UfTxxxNb/2E/P8Js+6/bWBq3/0Lvz0PPz8ee/8e//6VR+4euv+k/f+s59Pn32LQVsurfQ4+vkAV5ktTbAPcdYlljTDP5hV/+GCcfCNUfOj+h+V8IGdOff2dZVnoA8PyKcwBwnfzR8lHXXIz35+XW2m35D/c/n/DZGFPJQyDb7TJekOv1Otd8sLDb8EPWWnKFvGHYGl6WI8d3XYgk/q4rv1s4RutMAPxQ4LYdD7+lEN6SJWvlbsbZV3XorZwHV9a3u9+xzx6jib2BI8keAMfL0Nc/7i/Dgv6tB/1TD/pn3ox7/op4ATgAAAAA9soU5neuOPOzSb46AULzvyYfoqrVv+x7be3PnyRJnEmA27bbVW7fRpd9hS+SwvvQ/HoSY7fB9e0S/nelrfCfjEEIoBBtLRR8msqm+wMAAAAAAAAAAACA+SK95eQyAFjwr5UAdcJz13gK4ZJPasG/rlv/3xUdymjz7d+eLf611b5ss/SMqKtvcFiZQg1i/RvOF2BoNyp/N3ZKcQj+dRsMIQdAr/gurhhiQ7wAAAAAAAAAAJgHeL8bFghgQQxNxk+s0HZI5h+Cclj20T8sxOYwO1rgrr0Eunhn6HFXWv3TVvifJIlT2O9SRuh8ASF4211Fgvt6qEt+W+epsI+wWpW2OP6XSoDwWWoX8kdTZ/W/85vreBD+E0EB0Attrf4BAAAAAAAAAAAAwGGh45Hr3wD4wi8tFotyvEgvgW75Dqqx/VkBUGeoHBsSSisw+PvmZmPV/+cuLo1c5xL8y2U67JHbq2D4/LDcpp+7vbGuUD87ngDcJl4uPAZ29u3a7g7nBwqAAG1Pht4eFvwAAB9DhwhDCLJhQf/Wg/6pB/0zb0Y/fwZ5AAAAAIAp47PCHpOx6587fc3vfGMhTdNyHXsIcDJeY0xUEmJjDCVmO3cM5YPoal2vrf9vbm6tTIbraxvvy79deRPkt6/eGFxluJQUvODy8sKwcsPUtK13dKgo+UP3gbVkH7wA8ObQI67BNnSSlSYXbcwHAAAAAABMEFN0/8ydmGM/hOMHBw3ez0IUUZ9xk7iDudN2/GBMzYt93H91Ml5Zt84HoAXiTduv63PV6Qox5Ar904U64X+oTA75k6ZpGfqH26rL0PkC+qC2feIcXF5uFAP87d2lbl3b+4O1tcJ/46vPbrIPQAEwIG0uUEzwAAAAAAAAAAAAAObJ1AX+UIDF0ZeBra/P1+s1ZVlGeZ6XHgAyV0BbXGGAXMfhOk62bOffsVhVjk9477P+97V1CCWAr12d9yWVP6Cn623nwB2hhsRJJLNaZbUF6phLmqKo3z8W3ISGRWoUJfvqd1/9vuVD1d+VfbWvbWipfcGJYyRd21bXl746xg7BEKp/7PYNTRPt/VSInTANgTEpEXUf30Mz9ftjiLm3f+pYmwfW1/d/eH5Zb6Ude/+d//15OjY8Qzy/D5/t+O7mXj/s+B47RGF4//r6Q/ePJImLght/f4AXypwZ+/009F647/a1vV/03b621+PY5y+Wtu3fbc+w84fw8dff/7SQXLKxBI89f83rd9FXiBlrN0mA1+s15XleKbuJcF5a78tnnuv+UPEkeDh+XQZ/ZNihm5tbe3V1aWQCXu0pELq+WZHAXgAXl1emzkNB1sGeALq9ep9NHTe1J66v+4Qh643nHwpz9FBwbduGnn8FZz/TfwECAIwF7g8AAABcxAv4jl1ADAAAAABwnIxloDo0OqQPf2Jj+zdZxsoHSZIklOd5bQSSpjKfphFQ9D4x/TCVyCldW1DX9iGOKzoJ8KFciACAeKZw8wX7A/d/AAAYi1gL4ul4EHTj2I8fgGMG1z8Ah8ox5VFgC3cWehdFseMFoLeXHgR1/SJj/leF6rZiPZ/necUjgeuW4X9cbXC1qS2xIaimInuSIXaC2wa2CSkEYq+FaA+AA70WAQAtcbn5H+rDGgAAAABgLMb2sJn6/G7q7QMAANCMQ72fs6wkSZJSCVAne63ziPCFz5H1MIlJyvVSmcBhfzjkjiuxrU++08ecoq0CoEkugaGpVMqhkQaszxjTKcSQJNoDAABw3PSVAwAAAAAAAAAAAADHjU/gfWiihiRJKE3TVmF2XPmU+H9p7e+KLc+76BwArnr4u0750Fb2w8L6i4utgqGr4egogn9XO63tRfC/j7yfQf83l1vGPj8AgOkC4f9xg/s3AMBH7P0B9xcAAAAAgOMiJHCeO1pozwqAxWJBi8WC0jQtvQJk8l1fOVyG9CbQVv0so9Hrsywrk/7yei5Tlsf71J2btvPz29tbKxMJc1vb7N944yGRwv+GIYDGzFuAAHgAgF6A8B8AAAAAYHjGVrBN3cBr7PoBAAD0w6Hds1nIzhhjSgXAcrlsJHSX+0phvdyWBeqc4Je3T5KkjPefZRllWVZRAOiymrajC6wE4LY2UQDouiYjg7KWLNmNEqDuE/AVGFpBEAwBFD6ZE+lwAMCkQA4AAAAAAAAAAAAAgK3QnhP+6g9b7PN6X3geXxgg/s1l8P/b9VRZz4l/pbcBy3H2oTTXIYHa1DcZ4X9rLBHVJ0/ePbaGIaKovv8Mn/CutHHTOERCAzScRBkC0jGJPT+x569NrLcu+x0i+zz2sa/vocsP3b+HHv8upjS293X+fKG08HyIY+z+i71+x54/jF3/2Ix9Lxq6f0P3f22hBvrl2K+fQz/+uTP0/Q/nv56xnz8hXOdPLpt6+8dm7Pvj2OenTf2Hea/wza8287I8zylNUyLaWMSvVitar9elYsB3/cnlWZbRarWiLMsqHgZJkpAtisp6XYbv/LBVet5Q/svl6G/5/ntzsxvG5913nxldht7fWkvX1ze2LneB3n/7u/2YqipZHBuIBMBytStJcGHr76F9X5+6LiQBBgAAAAAAAAAAAAAAgJHYhtxJdizxfcJt+T9b9cvY/zKsjF5HFBY+NxFKawG9XOYSxLuE/3K9a18tzK5TWOwbq753MIaolcV/P2ilUSIHQ5cPAACAeYIYuQAAcJzg/g8AAAAAMC1c87C6uZqWz7KAn4X8Mskux/2XeQEY3qaLEsCnjNC/b25unVb7vjKvr2/szc2tZWWB3PfychsyaDLzV2fMf8FI7ZP9Bg8AcNSMfpMAk+bYlZy4PsCUmfr4nHr7AAAAAAAA2CexITCPgY3V9q5w3xemx2WcrZUEHPpdewBwebIOaTXuKte1XLZF/y+t/ess/y8vLwyXv29L+c5YS7b8Vn1FZqsEqBn3+wiLVZ5vGfcppqBjZeoxfMGwIAfA/pnTsU89B8AU709TOr/IATBtDr1/xr4+x65/bMa+F+H8HjboXzBlkAMAtAU5AObD1M9PXciXw6A+B8BW+L6J1b9erynLsrJfkiSpWPXrUDlJkpT7saW/VAbkD2X5PAA2+QdoZx1/W7W8LswPUb3AX8LC/8Vi4Tw+InfIn1Aood3fPecAeOgTax9yI3CVYjuZmNeSX66nw/WE2tKFxdRvAAAAAIbhMCdVAAAAQuD+DwAAAAAwTVzh113x9ev2Lxom7NX7ueaI2kCtiQeAFs77ymbhv7b+l8oODglU1265714Q1v+b33Ldw7ch5RngV5Y2aXtXA2IGIYDAUQMXNFDHsVtI4voAU2bq43Pq7QMAAAAAAGCfYH5cT5Kwh8CuQLxO+F5a+Od55UNElKYpGWM2ZQvLei2Ql+W3kXNopYRL8O/631U3Ky2kQqAoip38AZPzOrIP/ZYYtyKg/BlW3NTR9Lz4ziEUAAAAAAAAAAAAAAAAADASW6HtbnLbJEnKsD4+QbFM9JvneSn49yXLDQn72wrXm4b8cWGMoaIoKgqPSvghWxD3i6vdbRUXndpIOzL9XaG+2qiiAJGbOfId9KnMcPXHYu4auKnHwD50C+G+8MW4H7v/Br+BBMr3uW3JGG9DMnYM0LEt8A99/IUY+vwfeo6DpuX7JmFTvz7GponrK9F4z5e5Xz+HPn5CHPvxh5ja9TO18xV7/R/7/R0My9Sfjxjf82PqMqMYuoTpmBJza39IvjH3sVYXXodoI/8pioKybFWJ4U+0TeAr99HKgNVqVSoAjDGUpmnpAWCtLf/nuuR9P0mSnbA7ui4pn3KNrcvLi/IAWRngO2Y+Nq5XL3ftp8dHKEeAr61N4PovLjbHZIyhn7u9sdwqazbR/Q0lZKkqbLfGll4BRLtKA9mmvoX+3FaXYmFY6SEAAAAAAAAAAAAAAAAAItoV3uvkt/pDRBVrfrk9W/679tNlEO0K5UOx/YfGV2/Va2Ec5dXt7e1DqH+l8Kj8cLdtago3KAAAmDjSGripZTAAAAAAAAAAAAAAmAYh4TwL/11KAA6PI4X1HOony7LS8p+9CPS+erlul26fa/3QfaNhD4HLywujvROkp4DPY6Dv9uy0b9PI8nt35bRYzN2FBoBDxiXw98U8AwAAcDjMPUQjqAchMAAAAAAAjgvX/G+zbKsA0MJ6Xq4F+lq471IoSMUB0UN4erW/bIcOGzPE+0Zb5YJUAlxf34zyAsReAIlvem4MGWvJGkNkLRkyldwArtwBXYg9H0gCDAAAAAAAAACgEbEvoFBwHTc4/wAA4MZl/S+RSYClgkDu77LmL5c7FASyDBljf4gY9T58ygiplBjj2bGjFHn4rm3JgxKANzT0cBzUjxIgBoQAAmDiIAQQAAAAAAAAAAAAwHxxhauRy3yCf8a33hUKR4YKcnkV+LwRfHkD+ka2z1pbJg2+ubm1Nze31pe7wNdfQ7VVK1DIbmz7t34btBX4y+ObYAygpGmSCADA/vGFANLLAAAAHBZ6gjtkjEuwfzD/BgAAAAA4LmLn9r5tXTHx9TqZQ4DD6vAnpIAYan56eXlhiKgU/rvqlB/e3sXePBW4LodCoGycJ8ny2MADAAAAAAAAAAAAAAAAAAajePgQGcPhZfi3X0hcpzSoS4qrt/GVw0oATd+C/7qy9DrtBXBzc2uNMU4lgMyjMCSWbGntv+MFEGAKSgCTZVntBkhSBmJoOn70OOL9ML6GZW5JJqfWnhCx/RtaL2P0DcHU7/9DxyCe23jTTP38xTL08c09xvXY4zv2/nXo4/fQmfv1Ezv+xn5+DN1/h358AAAADpXY9+ciugXW5kSUPCgAUiLahua5v7+nLMsoy7KKwH6z3zaGf1EUlOd55VsK6zncT57nRLRVICyWy52QOtbasgxXDoBq243TO0CW59qXf3My3YuLjRBfhywqimr/6nDYLqVHURR0e7tRFrjmB1yXrH/3uLrPa2SdXJesR+c26KPOpu3Rv5EEGAAAAAAAANAbUxeQh4CAGQAAAAD9U4jvqvW/FODzb6JqCJ9EbcdowTsL8nk/qRiQ+9TlGnD97mP6JoX/Gt0m33H6cCkBfEL/odh3fRrdB/I3PADAoMADYNrM7QV9au0JAQ+AYYEHQD1TP3+xwAMgrn54AIAxOfTzO/bzAx4AAAAAgIuxPQCKipCeBd4spH/16lUlYS8RVZL3Jg/PP7mNtP7P87wSz196CBARJWlKRLsW9byNTy63/V2/PuQBoLfVuS6lcsNV9mKxcCpGWOjeVmFQ1742+OoJ9cOQ8ylXm+ABAAYFE/RpM/YLHKgH1w8Afoa+PnD9xYH+AwAAAAAAYBeXoJ2F9DIuPy/j9SZJKuFvNNbaMrEvlyW314a2Li+A+t+mdrvQ/L+tQF5a019cXJi28quuCgEfdV4TXfaPLa8O1/lAEmAADhh9s3fd/AEAAAAA9okvCZ22BpsroeMb+oPjAwAAAKaHS2iu4/UTVS3pfWGB5Hot30mShNI0pTRNS4WAfn66nq06/I78fXOztbKv266Ouud5G/mUK+/AvnDVFzofen/t+TDUMeh2IAQQmAS+ix/jK45Du37nprQI9e/UQ4xMffwgBFA9Uz9/YFimPr5j24fxO22mPv5CzL39AAAAAHAxbgigTQLgDSzQL4qC1ut1JQwPh/PJsqwSw59nJ3UhgBaLBS0Wi9KDoFLOQ71SKcDb5Hm+M79hoT9zcXFZmSDp7WXuAdd2TUIY14UA0vtLYbsr9n5TD4C28se+5oH7DAlEhBBAYGDwAgVAdyDgAsDP1BVsx/58w/0LAAAAAABMi9gY/v0hhfYspJfreHkZv1/kDHCV4xKcs3V5mqZkjKH8QcEgheku638t+Pe1vy1trP77sJKX+/T5buY6D82ojj9jdGLlUJlx71dQAABwxMDCEgAAAAAAAAAAAGC/yES2LOjn5VIBkDzE/iePAN0XckaG20mSpPQA8AnUmwj+fdze3tqrq6tWAiQtSPdZ7HN76+RXFxcXlbq1R8A0ZFuGwkL+AWsPhQAC02Yag7g7PlcbhABqxtwtTI/l/PrGNxQwh83Ur0+Mr3HB9Q8AAAAAzdgejlII6aJJCI86Yuc/c59fD93+oSyeD4WQEJlD8WRZViZR5T4tioKWyyWdnJzQYrGxpWYhPcfb5zj+UsjOwvzNtVWUcfnzPKfVakWr1aqS7JfR3gFFUdDZ6WnF4l+GEbLW7lyfO+NRWPtnWUZZllW8DK6vb2oHzeXlVsDv8zio+w6NSZkIWfajr06p+GAFhEuh4AoP1Be+pL5aprlZl+8WsFOeWxFiDFFR7PaprItDSGm4H+EBAAAAAACwZyDgBwAAAMDUwPwEHDIuAbQUoLNAXMbj19sVRUEnJyeUpmlF6M7/60SwLMDflJmV8fmttbRer8vQPxyP3yUsZwGuzAfgOgYOE8QW/yyQLtvyIGDXuQP6Do/jal+Te0tdgl3X/1rA71JKDCn8J3IL/Xk5H8/l5SZ3wu3tjaOd/L9f8G/MZoy59K+yH6rKBivKePjAA2DezP0BDQ+AOOau1T+W8wsPgONk6tcnxhcAAAAAwLQY2wNg6PcTeADAA2BMrM0rlvk61I7+3uwjrc0NLRYLOjk5KT0BpKBdW/wXRVFa2m+UAOvSA4CIysS7LLDXSgcuo1RIPCyXQl25Dcf6Z48ELpMVEFm+tUCXx31zc2svLy8aXNztkvzG3C98ig79vxTwcxigoYX+LrQS5uLiwshkyxsKspTT9fWtrShfrCVLbgUCfy4vLs31dfW4pOU/76PXcf2Xl5cGCoCZM3cBDhQAccz9oX4s5xcKgONk6tcnxhcAAAAAwLSAAgAKgL7qn3pfjUFRZNt4+A8CW7bCz7KM0jQtBeraSn6z/0agulwu6fT0lE5PT0tPALmtVABID4A8XxMLhYmqQtoyzj9tz6MU/hdFQVYIeqXiQSoukiShxWJBy+VyJ9SQHBG8n4z7f3V1WTuAAxHCdsZ/2/uFy5reJzsZQ8gfgpU5FxcXhhUwUvhPRGQpp+fPbyxZVioV9OAWUJ4fQ0TEwn+SYaj89erfcmxdXl6aNE0RAgiAOo5dQHvoxzc26F8AAAAAAAAAAGD/sOCeBfSupLRSmGot7cT5Zyt7aVFf3aea5Jd/8/9yWVVgTGU95bfwXJDeAtwO9iiQ66USgoXKXGdM0l8XPsNH3/oQOsyPTvTbltD+IaXCxcWFcW0jy5XKGSJ5jjfj4ub2QfjP4n5jyFhL1hhKtoWQIaHMq6oGvMdyc7MJMeTrZygAAAAAAAD2zNgWYgAAAAAAGhgogUNGh/+Rwnr2BpDW91Jwv1m2+eZ9sizbUQBo62tms2zXhFsqBE5OTkoBsm73wz8VzwT2HNBeBfI6dnmFuK7zy8sLE3r/sKXMOs7S319+s0gJRG4BuE+AH6s4aIIW/BNpBdIm1BKZhybays5krC1j/W+WUbndtj82Cy8uLoxOkMxtkP/zWCgVRQgBNG/m/oCeegigqXsA7NOFEHQnpAkHh8nUzzOu73GBAgAAAAAAmrFDAA0NQgAhBNC4SGH+xvJ/vV6XYYDYal6H1iHiJL2bfbW8Slvc+xQAxuyeExnmh8P2cPgYrQjIRXvZY2C5XNJisSjj/2vlQFEUdHd3R/f39zseAOwFcHm5EShfX9/UDpo/9+eqlu7ym4/XFaef/9fHo3Ht6xvHrmuNLeCJdq3y68pqg0w4LJP8cu4FKfSX9d3e3tjLy40HQWnRLz0BrN1a/stD422spYuLZ4aPRysAdP4AqVhixUR97wMAAAAAAAAAAAAAAMDM8SlpZPgfLVyV4X60goDDB2mLfB3PXoYCkp4HvDzPc7q/v6fVakXr9XpH+aATFz9/fm3fe++55bqJqFQCSO8GqZDQx0O0sfwfun/bCt7rhP6+cyOXsfC/Yv0+sPLTZ/kvjyVJErp69mC9rwX9mx0fhP2uGpKd8aXrYuWR/nA/LKauAQ4xdvvbEhsDK7Y+zdj9V3fznQJTaYePqbcPbOh6nxvaQmbs8XPoHixj1w+mDayyAAAgDp/ruwzXAHYZ2kIZ87vDrj+WfQrhpsg+29dFEDu2B0OIUPvqLL1dFuhaQL5cLncEqrzdJuTPWpdKsklZtnLUy20jKopt2VI4rQW6rARgge5isdjE+C8KyouCrm9uraWN8N4kCSVpSulisQkRZC3lD94BCRGZJCGTJGX+AJ1wWHo9EJepFA6cK+Dnfm7zvdmGj68o1+skwiJy0QPuEEhMXU6CjaIilLdg06/Vdkqvh/YeMtWwQtLKfvPhvjDGUlFk5XaucETWWjKU0NXl1bZHCg4NpI+1ys3NrQ15RejcEpt2bs8lcgAAAAAAAAAAAAAgmqkLYAEAh4u2uNZwol/eVsb4lwJvbbHvC2tTtywGHcJFhpuRXgraIpxDvOucALJfOFQNhwuSeQuurjahbHg75vLywnCoINcxs6C9DbrPQgmJ69a7QojrtrZtXyghcKgtvnV1x83t1H1NxDka4uqHAgAAAAAAAAAAAAAAgAPm0BV0dcLPjYA8pzRNiagae58FrzopsA7X46qjjfC/TnngElJzuJ88z8tjkF5urnAw7DUgFRpEVB639Ciw1pb5D6THg8vDjq372SNAtpcVB6G+aGrt3wZZpvZA8G3no43Q33WuGN+x9XXMPnzHyOcKCgAAAAAAAAAAAAAAAMBkaSNsdwmxdZx2KVx3JXD1xXL3KQGaKFjqwrjo0C28rAwTI7i6ujRa+L9YLCohXzi8DycJliGAtMBeh0iSxyQVJNwOV8z70PF3FYBLa3hdhs4HIOnDM6N6TsLbuNb52qXDLrnGkQzBJJMwu9D7yXNHBA8AAACYLLEWGlO38Jh6+wAAAAAAAAAAzINQwlcWfLss+2WoH5dAV1vfu7ZrKnDWQmHtBSCF+Nzuq6tLc319Y4mInj27MovFgk5OTmi5XFaSE3M5RVGUlv3aI0B6N8gkwr7jl/367NlVmWDXpRzpAx3+RvaVtvL3KU3c28TJH3TuBm4nC+h1u3V/+sIruc4fUbecRlqpU1EQtS4NAAAAAAAAAAAAQDG0gUffgiYAjompJ/mNxSVU1//neU5ZltF6va7E2Jf5AHyCbW0177KiryMUAqjueIi2Vv8s/D85OSlD+/Ax8Dd7N8hcAURUKgZk7H+XAkAKq/nDigRXHoUmwuo6S34+vrrjD+E6F7Fj2jemfPBxdQkN5TreNuUhBBAAAAAAAAAAAAAAAOBg0QLgXQH3Rvi/Wq0oy7KK0JqF5rIcl3DcFWbFVX+oja5tXSF4ZBtYmM9x/HUyX1YAsHBfCut5Gxb+c3ggfUzyt1Qe8P++vm2SA8CXpJdoI+jWYZr0Pk09MLoK/S8utm0K5QPwWfvX4RpDUhGikynHKC9ub2/txcWFqShzeICPRZ/amDngc6XZV32aufUfAAAAAAAAAPiEBF1c5o+JoS2Ax36/HRq8P48L5BtxxF7/Y19/ofo5sa3/k9NqtaL7+/uKdTxbsK/X60o9IQ8AvU3o+aO9CuRzi0P1yO1cQvY0TUvr/+VySURUyWXAVvk6lJC1llarVSn85/7yhfKRwn9WNHD5XJ8Mm9QVub+sR8LLsizz7utDCtgvLrYeBk3bLRUB1m77VXszNFEGac8K37a+6zTUZFZgcJv592QUAIeOvEE0cenpGzwgAQAAAAAAAHMB7ycAAODm0OU7Mj4/UVVAXRQFLRaLHUt22Sfn5+elgJot/KWQOstWRFQNlyM/Wj7qE+L6QgSF9l0sFuV+OgeBFtb7QhBx3ywWCzo9PS3DAEkheVEUpeCeiGi1WtFqtdo5Zg0nCpbI+PScU0C2X7bt+vrGSit2a20lPr4vybA8fvnb7cVR/ZYC/qurS6Pr5HU3N7f28vLK6P4m2ipgfDkEWKB+deVOwsv7cY6Gvtg9R/XXt/RgcIEQQAAAAAAAAAAAAAAAgNHQwlkpME6SpLQ6528phDbG0Hq9rlioS2v3jRB5V+ivheE+ob/8v05AL//3hfmRgmdXQuI6ZLm8rw7zwwoA3k72lzwGDXtFaGG8y7NBC+uNMfQ93/MFIxUZRVGUSYNDx8Ttkui+luOB0aF4JBuh/0XF6t/Xx7e3t/by8rKS4Jhhwborb8Hl5YVpct6mABQAAAAAAAAAAAAAAACA0dHCf6KN8JYT9/qE5myhLoX/Uklg7TZMThPrcl2/3LcJ+hh0TH3prSBD+ITqkAJ2tvhnC32pAGDPgCzLKMuyYIQStoKXSgpp7c8eBbotOkmw7i/dh3JffUzchq5CdZeQvgs+pcRQ9WmGUCrsqk8AAAAAAAAAAAAAAABgj+hksywg54+MPe+yGPfF4XeF3mniDeAK06M/LNQPfXSZPgVEkz4iolIBwJ/1el35LfssJIjXAn/tQaG3c/WR3EcqYKT3gT4GlyeB3o6VGXX94wr7I8MR8f8ypJH8XF5eGr1MtskVXqvOGySGoTwK4AFw4Mw9BhwAAAAAAAAAAAAAOGyk/ErH+pfha1zb8z4+xUCdoL2ptbeO068TujZJsqyVEK64/Frp4GqDPF72AGBBv1SEuKzpXWXKbeX+OhFwyBNC522oO18uYXtT9LnUoYZY4C/LTJKqEoGVMrqdrr53jSlfm3w0GR8xyITFLqAAAAAAAAAAAAAAAAAAjI4Mb7Ner0vBNgtsfYJUVxidkIW2FGprRYAWAPO2OnSNa1/9v2yXDk2k26HLkGVLAbtURPgs1F3t0Mev22/tNpHu1dXWMl63y5X0Vm7v6qe6drj6UHta6GPSbSqKgq6utrH8Zdt1e/h3kiQ7+SRkma72x4QpGgujs1yDfgnF2IKFPgAAAAAAAABswPsRAAC4ibUwnjo6tM1qtSpj3Mv12mKdybKs/F8K2rchcKpeBE2tuH0KAldbtIW8/M0C7DoFgE9uyOvZIl9a2GsBfRvBtBbUuxQLOrY/t18rAC4vL4zOH6CPT9ctQ/LIfWT9/JFhhHzHqr0nqvUmO+vkMelyNNbmOzH/2/Z1Hb6ytm2Oi+IPBcDAQAEAAAAAAAAAAM3A+xEAALg5dAUAY+0m4S8rAIioIgD2KQC0gFjHoC+KrDaUi+4/37YuC3VZv88DYblcBr0T2ioAOPyPto53HZe07Cdyh8nR9epvqXhwWcdrwbrPgp6XSQWAVphoBYD08HB9LxaLWgVAUdDOOt6f+1Gye/439cs+HFoBUD2PUAAAcLAMHSNsaGInKGMf/9zbDwAAAABwaByKgAsAAIAfGQKIwwDJUDBaeKsF6vJZwevzfF2x9taC55Ag3oVrH1d5m3p2rdx1e+qQiYR9bajDZZnvq9cVvsfafKftchuphHC1LUkWOwoBn4V/HU0UM3XHVrfcFQpIewi4Yu1ba+ny8rL2BIYUDKEY/pKLi4udupADAAAwGnN/QZt7+wEAAAAAAAAAgLnBAuU0TUvrbBbC8m9X/HpdBhFRmqYP1vPb5MLaWt9VPxOyzJa//eFndveXyoo5GwdqZUFd6B+XjKVL6KIu28dSJ2BvKjtytbmN4F/u41IC1AEFAAAAAAAAAAAAAAAAYHRkctY0TYlo6xHAFtouJYBWBEjr8s3vlLIs27G8d1l8y2/9v+u3q15epgX9Lg8Btu6fIj5Be511vUvo71LU+DwKYto1Vbi9XQT+LtqWAwUAAAAAAAAAAAAAAABgEshQPxxaJkkSyrKsFOK79nF5AWyF68WOYJ7/Z/T/ISGz3l4rHfQ2rmUhb4F90iUKgi+EUF2oIVffNg2h7FPG7DuCQ1sL/L4E/12ZrooJAAAAAAAAAAAAAABwdMiY/2ma0unpKS2Xy0oOAKLdGO28TFuXs/KAQwBpIbT0LnDlFWja3q7HOTZ1bfApXFwfvd5VluvjK28q/eNjX+1rq3DQwAMAADAYc0+CO/f2AwAAAAAAAAAAc0S/b2vBv97WlWRVhvnJsk0yYZkDQCcLZnTYGv2/z+pch7mpKhpsZT/ZZlf7p4DPO0L3TygPgKsMTdPjd4V62gc+AXxTuRDv36cnQCi/ggQKAAAAAAAAAAAAAAAAwOj44sKzZT5/OLSPz1LfWkt5npeKAGsLp9C4qWA71GYOVcS/tZeBtVUFw9QE/r5kyk3308tcoXrqvClC9Y5toNlUkVG3v7V2R5HQl0Ig1CYoAAAAAAAAAAAAAAAAAKMhhcZaWCzD+LAFf12sfS2I3ygMtvW4tnMlFZa/8zyvtFXuL7d1hRDabOsWYo8Vw75PmuQwqEuq3GR/n+X/viIzyDbK/1mA3yREj2vsdfUMaK2okQMYADA9fBnTDyH8zNga3KGJfYDP/fgBAAAcJof+/I4Fz/9hGXv8zVlAAwAAQ1IXnkd++wT3bLEvY/Tr8lkBoMPnyO198futzZ3ylJBgWh+bLkMLhXV7tuvTnf1k+xaLxU4drn70LYu1oE/T3fbJ7+fP37OXlxcmSZIyHJOO4V+HtWEL+iHlX7KNrvKbKjBC49yH9Fjh767W/21C/zDwAAAAAAAAAAAAAAAAAHSmqQDaFTdfWupLC3qX1bUvNJAs3yVkL4qtAbRLGNxEsOsKayPboesM9c+UQgGFlAlXV5dmDkl5fdTlK5ji8fQdKggeAABMHHgAzBdYAAIAADhEDv35HQue/8My9vibopAAAACmgM963oUrfMtqtSo9ALQwWioDtHU9L9NW+rvKhF1ZijGmYs2u2y3r84UYYlxhf2Q90gI+1E9dPABikTkMXOUbsw2TpJUxc/AA0HWE2qKRSaJj6tXH5BLsS+G/3E9u21ZxAQ8AAAAAAAAAAAAAAABANC4LfyKqCOldAn6fAL0axsc6y9Cx+4k2Am2pACAqdhQIrnLqwv3ULfO1h799AvBQaJl94fNQYNI0ca6bqgW9i7qExRyix0cTj462bbHW1uYAaKJEa1wfPAAAmDbwAJgvsAAEAABwiBz68zsWPP+HZezxNxchBwAAjI3L0tq1jO/bd3d3pcBe4soHUCdwZ4t+uZ21lu7vXzk9AxiOwS9jtfvCEfF617c+1q3VfLpjNS/bIAXQY3gA6NA4mjStKjB83g4+xvYAcB2fawz5kCGemDbtCiUtDnnQ1HkMNAEeAAAAAAAAAAAAAAAAgM64BORawKoF6U0EyTLcjC6bBf5pmpaCf58Vf5JshfocakgmHPYJeF1tcwmmXRbx2iNBC/51n8UQqyCvUwBsfrsT5vZ5DPvAlQOg6X4+DxRdbtP62xDbz/AAAGDiwANgvsACEAAAwCFy6M/vWPD8H5axxx88AAAAwI9LsC+X623lNiyM10iLfb1vkiS0XC4pTVNK09TZDsaYquV9nueUZRllWUZFUVCWZcHj0vXL3yHBcJouK/u6cgv46muyLPb5yP3nUwRYm1fa37b8qXgA+Czrm/af77vp/k3mET4FU4wXQH2AIwAAAAAAAAAAAAAAAKhBCrblhwX7q9XK+7m/v9/JAeALlyPLlOFztGB/vV7Ter0u68iybMfiX7ZRHoMWcteF5/GFBXIJ+mW57B0gQxaNifRWkJ4UcrlW6szNaMHlmdHWcn+oc+Vr0+3trQ0J/GXSYG/58ADoH99gmNuFsS9iNHxDWwCNbWEUYgoPCdCdocfn2LisNyShJDtjlz/1+tu4cKL+4yM0Po+9f0Kgf6YNrv9xOfT5CwAAADfSyl0ukwJtFqbztlKoeX9/X+4j92d4/sr7aKH5er0ul7MgP01TOj09pZOTE1osFhUFgBT2b9rjVixwO0LzZ91u33HovtIhiXzoEES6fZxDwNcun2U7o8Mi+YThvva6QiS5fvuI9WAoiq2HhktQHiu/C/djOEeDb1/Xurr26fJvb2/t5eWlkevaegFAATAAUAC0AwqA7uAFat4c+gv00AKasQVAqP+46586Yz+f5s6xj5+pg+t/XA59/gIAAMCNT4ipLf+1AoC3kfJHVxgVLYDVgvo8z3cUAEmS0MnJCZ2cnFCapt74/lIB4CpbtqXu+PUxu9bpvmqqAPAJ/rfl7SoA2rTZ1YY6JYAGCoB6BUBdmbEKAG5XV+E/EZIAAwAAAAAAAAAAAAAAGqITkros9lno6RIYuwTwdevrBPWsfOBvKfyXVv1FkVf237WwH1dBrZPM6nVEu8mN9W+JXq+NbtuEtJmCcdHY56cN8lx26TvfdUO0K/z3KS40UAAAAAAAAAAAAAAAAAC8hASMHALVJ9SX63zKAr2NjPOv25KmKSVJUtYrhf6uBLuh/4eOANHEg1G3QQqCjdn2L69r0y6XgkHX6fPwmBpTVgZIxUrTsaW3d/2OBQoAAAAAAAAAAAAAAABAI7T1vCuED69zbVPnLSAF/3IfmWONE+eyAoDzD9Rb9ZvKcv6esjCZqN/ks74yfEqApuGR9sHUzxORP8xS0xBAPi+Nuv5vqihADoABQA6AdiAHQHfmcAMEfoYen+CwaWJBgvqBj7GfX1MH42fa4PofF8xfAAAAuKz05W+9nWuZS3HgE/4TbRUAMlGt/KzX6539mY2CYBtDnttR91vjOoa6snRM/fjnZ1rb3qbHo/ulzgOgzpsjVE9dvb621GFMOEZ+2/pd67vmAND9qJVdbdsXOn9IAjwBoABoBxQA3cEL1LzBCzSIYWwB2LHXP3fGfn5NHYyfaYPrf1wwfwEAgONEx/l3hdtxCfR5Wy0U9X1rhQGXJUMMSVwKBbk/C7nzfB11/DqJcVsFgD6mOtyW5FsFQFNhdmhZyLtgSgqAJKkP4yQ9RJrW71ofqwDQHhR994++ZlgRcHFxUduBUAAMABQA7YACoDt4gZo3eIEGMYwtADv2+ufO2M+vqYPxM21w/Y8L5i8AAHCcaAWAjrkv12shqI7l7/rfJciXFuqLxcLpIcDtSJLE6TmwFcDXewCEnk/7VAC42lWnAHBZmDdRAoRCIOlz4au7CX0oAOQ+h6YAcJUrf2sFWBvZKVEPCoCpC0hD9NV+XY7rwph6X3ShrxewJjcq0B68YAEAAHABASoAAAAAAGgDzw/zPC8/Pot/l+DTJwDnctfregv9LNsI8LXCgP8PCahlCJk6fALWrgJ8XW5XdAggX5k+xQbLf6XQX/4fkl928Tqo206fvzTdPT6JVgC4yqujiYLHFQ5pu8wtgOf/27w/dVHg6CTbsv+ahANCEmAQBQQEAAAAAAAAAAAAAIdPFyG2tOR37c+C9RgBOWRTYbRAO2T9vw94TPTRjtgy6nIh+Lb3eQ3E1N2VwUMAwQPAXc6xeAD0BTwAhmHsmzkAAIBpAg8AAAAAAADQBhZ4svW/K9kuEXmXMz4LcJciQP9f99u1j/zdxAOgrvy5ewBoYbX+1kmOm9TVZr3etm0In5AHQCx8/D75rvYAiK2/yX6+EED62mnC0XsAQNAMAAAAAAAAAAAAAEA9bYXAvhjvOoxJnXC/Thjt8yrowtAGvGMb2GgBe1uL976Riomx+4aoex90Df2jx67LkNyVOLsrR68AAAAAAAAAAAAAAAAA+KmL789Jbuu2cZXhSw7s8hLwxfj3LY85Ttf33COgEPmPYd9t7zN8Tl+E+6a+vU360OeNUacI8EVM0eGTQvVDAQCiOIQbIAAAAAAAAAAAAADwExKMa6F9EwVAE+vmvgX8dQwVXmYKTEXQzvQdCjxWPtl1nHXZz2f9X7dNbAhXKAAAAAAAAAAAAAAAAABe6uL6y218yBj/LuG/a18dNshFXwqCqYcAim3SISkzhqRNWKk2YZRcnittQgDFtvXoFQCxGhQAAAAAAAAAAAAAAECVuvA+IZrI4/Yls5tKnPq+mYJSYJ8eHqF2tMktoYX/TbZvGiaorRKAqIF8O8/zYOVDEuuiESvAj9fADeuiAgAAAAAAAAAAAADAmKzXa2fsfv4O5QDQy7VHgEs+1sYqn8vz4Qo5E1JK9OkVEAovpJP0ym366B9jTFlGKPyOTj7rC+dUR9v+Cm3v6p+Y+jR1x+yz1g+dE7lNaHy69vWFCeoSqmr2HgAQoAMAAAAAAAAAAAAAMBzS0rguIa9POKmF1VNMBLtP2oRv6bvefdUztlV/H+j+6tp/TQzg21r/t2nT7BUAIY7xJgIAAAAAAAAAAAAAQN/4hJT6m2j8sC59MkSS2T6F5F0joHStv48Y9k3aNxYhwf9Q7e2SILgJB68AAAAAAAAAAAAAAAAAdKcu5nlTgaQv0W8fQvCpCZB9NBHwDlm3iyY5DpoK+JsoBoZgSIH8vmnar236FAoAAAAAAAAAAAAAAACAlyRJyvj/Mp68DuPTJASQ5lDCxTRljMS3vnj1bdvgO+9128wRHed/XwqMuuup6TXnYvYKgNgkv3MejAAAAAAAAAAAAAAADI0UiPKni0xtqBA4QzP3EEB1dTbxAAiVM/cQQHVJfpsk+w3RdPx0CQGEHAAAAAAAAAAAAAAAAIAofGFJiNzCU7m8ztK8LwvruRgAjxUCKLaeQw8BFBqfLuv7oY6pSdlt609iGwUAAAAAAAAAAAAAADhsZOgf1zrX/2CXsfsnpv4myXDHPr6+mcLYjlbgFEXRU1MAAAAAAAAAAAAAAACHhrWWkmRrR5znOWVZRkVRlCFkOEdAURSU53m5zmWprJdp+WQTbwP5u0sS4rp9QuW1tf4e2gLe119d92+yjfzNY6NpH/u20+2uyzXQJ7oeXzt8v5uU7/MmkNeWy2umS4gmDUIAAQAAAAAAAAAAAAAAGuES6rsE0K5wQHJ9n4mBm4QAcoWn6SqYn1P+gibsu/+atoHr2IcCoM67pe347ZM6z5umQAEAAAAAAAAAAAAAAACoJSSIlVbUPqGlT4A8dJJcX5k+z4J9J7kdWpDeZ9l95DDwleOyvN9H2B1f/T6rfV7W9vzrcEJtFQ9dgQIAAAAAAAAAAAAAAADQCPYACCVEdXkAhATr+0iS2yahcVPFQIh9Wou7fvetYGhbXpP+dQnb92Vp71MAuLbbx/nv2/MBCgAAAAAAAAAAAAAAAIAXKZTVCgBerv/3xf8PCaWHElrLMuss/13bDd2+WJok5+2j/FD/dS1Hr+f/9+UB4Mth4CL22JsqOOpCaLUFCgAAAAAAAAAAAAAAAEAQLfyXAlq9XH5CFuD7CrGDEEDd9unbQ6OuHC0g3we+evoenyEFx1DHCwUAAAAAAAAAAAAAAACgMXWCTyn4L4qCrLWUpikRdQ8BNHQIG4QAalfHECGA5HZd6+mKFsbXjcchzn+dx0kfJIOUCgAAAAAAAAAAAAAAODiklb9rnesjaRJnfSyahNIZs311DB0GqA9CIX/4u2lM/iHb5ls+xX4NYYqiGLsNAAAAAAAAAAAAAACAiVIUBSVJQsYYKoqCsiyjPM9L4X6e50REFct/tv73hXLxhRHybeNa3oUmZYUs//U2ofbo4297PKH1HMM+hK/e2BBFbc9HVw+CfdFlfOmxqhUaMWMYOQAAAAAAAAAAAAAAAACDURcjXQs4dS6AodrTV9lNQv24lrlyGBwrbRUI+wzvw/XV0Uf7QjH9Q+GEQmXHAAUAAAAAAAAAAAAAAADAixTya+G+tZaSJKlY/LMXQJ/1yzp5WRch8hA5AIYWZo+tYIj1EOjz/A3Bvto31viBAgAAAAAAAAAAAAAAAOBFCv9dSgApyHTF/e+7HfJ3U5oId5uUPyXB9dyIOX/7IDbJbxOvkDHGDxQAAAAAAAAAAAAAAAAALzKuP3/kulDi3z7pajWt9/OV47MGb7IvCNOl78ZIBty2fT7Bv0xqPNb4gQIAAAAAAAAAAAAAAADghYX+eZ6Xwn8d7kcKN/u2ch4yBJAU2HYNARQiti/GtpTvq/6xQgB1OU9t21cXWsq3TVNFAHIAAAAAAAAAAAAAAAAABoOF/3me7wgrXZb/PqF6LH0J4BECaBwOPQRQlzr2QbLX2gAAAAAAAAAAAAAAALNCh//RAkyXB8BQwt0u5bbZZ2pC6UNj6v0bM77kvq5lY2H6zMgNAAAAAAAAAAAAAACYFr5QI/w7SZLytxTyyxA/vN714fVa2KmTBbvaIMt17esqV9OHfLOu/tC2bda3qacpTYTMrnPRdN8+aHLc2oOkqRC9yfkIKaWajr8u52/o8RsqHyGAAAAAAAAAAAAAAAA4cnSi37pkvkMk+3WFX2lafqwQmwXEfcWo32fbmzJ26KIm/dskjv4QbWnaPl9ZUwcKAAAAAAAAAAAAAAAAjpgsy3YS+tYJ//m7b4Hy2DHimyZpbbJd0zwDfbW7Dl99U+zfIULn+ELzdEnyPLYipQtQAAAAAAAAAAAAAAAAcMTokD+hMD1DeAAwXazAh/REkPW3tWD3hY7ZtxBZ1je2xXpTy39e3rTMOuoUIE29EIY8f0OfEygAAAAAAAAAAAAAAAA4YuqEmcaYWgUBh8+JQQvYfZb3Q9G0ft92ddu0rWMoQu3aB3XHLpe5LPablFuHLweAS0kTap9vm7FADgAAAAAAAAAAAAAAAICXOotmVxJgve9Q7ejLAjyEFOruOwRQH/2HEEDhel3/9xECqC8FxZBAAQAAAAAAAAAAAAAAACCiaox/hhUAevkQVtCHGAKoacibodAhgPrw2uijLXXLeHnTMuuIDQHUZL8Yhj4XyaClAwAAAAAAAAAAAAAAJo0O7aPD/bhC/4wdS34M9DGHQsrULRuTqbWHaPg2xZQ/xf5qg5EaPAAAAAAAAAAAAAAAwGFRFAUZYyhJtrbAHNrHWkt5nu8sk3H/5T51SgAZvkVuJ8uXNLWiDu3nssjuqqxo0sa29Yf23zdt699Xe3V8fd940m2qC+vD3g66TK3sqkOPn9D2Mf3bxBOibfkIAQQAAAAAAAAAAAAAwAHjSoDqs/rn/9vAQla9/1CC46bhd/qov2mYmJj6h7YwHzsEUVPqwi917d8mfdt3/8f0b5d9Q+2HBwAAAAAAAAAAAAAAAEcACxf5UxRFxdJfLpcKAbkf0Vbgz7h+87dc19UDwLe9thjvUmaTemLrDy3bV4iZ2P4fijqr9y7W703Ki1VSNcn1MMT4rqvfBxQAAAAAAAAAAAAAAAAcCSHhv+uTJIlXYOoT0Mr9+xKQNt2niwV107bF1N9GwDsUQ/V5LK5x5euXLiGYYhQAofEbq4BqqiDqOn6gAAAAAAAAAAAAAAAA4AioE/7L9Xq5FEC6BJN14YXq4pvHCJb7tMAOxZDvu/4pWN63acM+2ysVRloJ0EUAr7eJUQD46vAdRxcGUXBBAQAAAAAAAAAAAAAAwGGjw/vwN6/T321CADXxApDL9XYhYi2wQ/U0FfAiBNAwDB0CSCsV5DZ6LHdpc18KqDb7IwQQAAAAAAAAAAAAAACAiHaF/3XW+Vp471uvyydyC8L7VAA03adtPaEY623KarMvQgD562gTAii0TawCYOgQQJq+x08S3SIAAAAAAAAAAAAAAMBk8YX5kWgBKQtgmwhHOaSQTh48hOB4CGF5mzJj6tf77lPwP2adTeizX4eiyfnroy2+MrqOH3gAAAAAAAAAAAAAAAAwY1i+5wvLk2UZEdWH5vEpBmT5PqWBpC6skGu7fdC2Ltdxdg3P0kd7QrRtn2t/3359tDUUxsdnYd+XYF/Lv2PLbXPurd0k0a5bPzSLwWsAAAAAAAAAAAAAAAAMRhvL4H3HfWfhtBZSu4TWQ7ahjiYC/z7bP8SxD9W/U/UY6EpfFvpdwlcN1Z4QUAAAAAAAAAAAAAAAADBj2goRm8ZQl+GAtBDfF1O9TjjqElLvg6Y5AEICdF/7u2y3LyVAbBlDsE/lj67X9buv8VG3vOn6IUAIIAAAAAAAAAAAAAAAZoxLQCn/z/M8GP7HtU4TCtEyxfA/besbOsnvGAl1Q8SGEGpSvqtM3T9DhQDyCerr1rfdtq7/kiQZ9RqAAgAAAAAAAAAAAAAAgBkjBagu4buM4R8S/LeJb94kB4Bvmev3UHSpp4mlf1NhcF9t8tG2fb79Y8poWn5dmftQAAypVHAtn0IOACgAAAAAAAAAAAAAAACYMWzB7RLka0G8T0ngWqdDAMl9fCGAZHnyt+v/fdG0zq4W/KFlsQL6EH17GIzlpTC0AqDPEEB1+zX1lNkXUAAAAAAAAAAAAAAAAHAAsLW/FujLECRtQwAZYxqHaEEIoHmGABqqDKapAH0oBUBdm1z1tt22qQIotM9QJOFNAAAAAAAAAAAAAAAAU6YupE+MsHEMi/0xiRE6+yzM+yp/KPbVpib9M0Y7YvcNlTf2OYcHAAAAAAAAAAAAAACYNbEhVkIxuvV6n2V7qH36/77IsszbHhnKh9suvQSYoijK5USbPuGPtflO++Vx5Pl2vbtv6pOgDq1kaHuefOGOXGVx//rGhDGGQvLX0JiI7Z+mMf6HClXTxUK+TTuG3t9XTl8eHnrc1YXX6lLHonWLAAAAAAAAAAAAAACYEbECPvm/K3RO03K1YK9pDPIu631td23LAmoZ7oeF/5vffstt3kceo6sOvVzvMyRtBaa+Y/Bt23afKbGPdrvG+Rz7yzWGQ9v4tmtSvm+Za786oAAAAAAAAAAAAAAAAEdNSIDOAvJQbPu68lmQx94EbYTeTSN4NFVgaEUAt48/LPjnj66/LgyK9DjQbfAJUKcgCI4R0obKjFVw9KkgGVPw7rN0b7pfbL194FNmyGUx47rJmGl7DhECCAAAAAAAAAAAAADMmlCojLYCQF2Olp+5hOdNypMW9nXJdTUyxE5d+b7jr/NkkMcgP1Xq5YchBYm19aFlphICyLUPK21CoXPqPEKGDmETwiUw9o1hVxikPgXovhBKbfbR7CsEUNPy9DZNyndZ/vtCUul94AEAAAAAAAAAAAAAAEADmgjQXdu2ESC2CR3ExHoA+ELyMNLiX7dzIwBv1k4WNMvvhzWVdkzJ8l+ivRjqBONNrb7HTgDL1LXXZXUuj7+PYwj125Spa7PP46Xtcfk8aFyhstrWAQUAAAAAAAAAAAAAADhoYizAfXQRXHbJH9CkLb7tfPvptuuwRLvtrLfgdyWPbRL3fV/C3yb95xO6urZregxNQwANMdbqyhojFn8ToXmTfWPr7qscl1dPV2WAazy1CQEEDwAAAAAAAAAAAAAAcNS0FTC2FYiGtpcW/CFvgi7lN91WCxdDlvhb4eZuzgCJDpGjrZbl5mPEoO8qAPa1tU6Ivuv9EN++vvvLdVyuMdHlWOroask+dgigpkL9mBwHdV46TZRpdUABAAAAAAAAAAAAAAAOmiEsjOU+oRA9cr22NG9C25jjepnOPaC/ZQx/HRpo0/5sp0yXAFkLjacW4qcNLqF+m32nxFTOhc9yfQpta0qTvmxrod/0eunqvYEkwAAAAAAAAAAAAABg0rgE2XJ5rHyrrQV+W4F8rIW/FJS6BO8ySbCrrDRNy22l4L8uR0C1juZJSF3bhE5PXZJlXb6LPgXITc513wLrPj1AxiDkQRPbh6EkzLE08QCIqX/s8wcPAAAAAAAAAAAAAAAwO8YWqvXJkDHOdZJXlwdCFwF0k2Vdz9FULNaJ/OFy9tm+qXkUtCU2hI1r+zHOQdf6xz5/UAAAAAAAAAAAAAAAgNnQxrJ+KsQKANuEMPKFH/FZ//fRllgL7z4ExH1RFx9/qPbtOwfA0IRi2reNke8rd9+C9a71j33+oAAAAAAAAAAAAAAAAJPHF2bEFRanLWML6IZOYqrLaKtECVn2xyZRluV0EbD2IQhuItwfSgA9RI6KMahLjCy3qQsZFWIIxVDbhM1j3y/aAgUAAAAAAAAAAAAAAJglfQj/D4E6ASvRJsa+Kzkvf3Oy3zpCSYZd22x/txOw6rL2YSHvs05v4g0ANvj60KUMaOMFEDo3QytImo6NqQIFAAAAAAAAAAAAAACYFSz4n4sAbp8W3D4LZZfVf/M+rPcYOOQQQD5r9X2GAJo6TXIkhJRUTagLbxVDm1j+Y4Yg6goUAAAAAAAAAAAAAABg0tSFDJmLEqCOvo6hrm/q8gSE668X8M89BFDTJL9jhQCaOiEFTp8W9AgB1B4oAAAAAAAAAAAAAADALBlKcK6ZuqVvyAJfJgCW65oKYvXhDykAHUPA2qbOsdo3ZeR4qvOS8ClQ5iZQnxumKIqx2wAAAAAAAAAAAAAAQElbgWCsfKtvAWQTi/I2dbZtX11dMe3QXgR9lNlk+30LiKfWnlim1n8aef26lB19elqEElg3KUP/3keOihjgAQAAAAAAAAAAAAAAJsPYwrIhmPIxNRGATrn9YzDHMDBzQI/FvgT/rnBEfdEmifFQhMYiFAAAAAAAAAAAAAAAYBIcYnx/F2MeVxfh9dghaPYtQG0SqmZOSoCx+y/EUIJ/XV6TBNlNymrrRTD2OIECAAAAAAAAAAAAAABEMYSAa2yh2VCMoeQIxWLvQp8W1WMLUJsK+IdKAjw0U+m/JmW4fse2X7av6zmbsvIndExQAAAAAAAAAAAAAACAyTAlwVqfjO3doIW0bRKw1gk8D+l8+fqobhuwpUn/NS3D97srvvPWVJgfc/0MDRQAAAAAAAAAAAAAAGAWjC0kH4opHVdXK/YxBZ5jh7BBCKB6ph4CiMg/bruEw9LjYOqeIFAAAAAAAAAAAAAAAIBRiY3LPSemcFx9Ca/7CgOEEEDDMpX+a1pOXbld4P2ttc7z13b8TU35Aw8AAAAAAAAAAAAAADAofQvDpiRcG5o24Ue6MjWB5VRpkisBfemna66JulBLfaGF/7ysSV1zP+emKIqx2wAAAAAAAAAAAAAAZoLPWt8lKK2z4G1jSd2n8K1LWbp9TcKJyP9D8rc2wk7Xtr6+5P91/U36oE0/hbYNrY8V9g4tnI0tP/b8D91/Idoev+teMGT9Ta/Poeofu39CwAMAAAAAAAAAAAAAAICG9KFA6ErbWOlTsVoeWsA5dQXC0CGShmZuIXLGrj9E21BSsQogKAAAAAAAAAAAAAAAAGjAUMl82wp49fZJkuy0aZ8C0LEt2Kcs7G3C2P0Xomn9QyVJbhKiZ8z625yfvvJmtAEKAAAAAAAAAAAAAAAAauiSpLivBKa6PNdvVgC4hP991D8XT4OhGNsCfy6MnSR5qPpjFTCyXS5lwNBAAQAAAAAAAAAAAAAAjpouFrx6f58QsA9LZFdcf99v3S4Q5tgVHH3is8Yfs/591dl0m7ZeALH9BwUAAAAAAAAAAAAAAAANqAsBVCfUaxrCpOn6UCLgfTP3GPdTzwEwdvlNGSoET4i5hQBqe76QAwAAAAAAAAAAAAAAgAHpEgKIaH9hgIqiqNRjra38P7SA/tAt5I89R0FThgrB08ZSfoohgFzb7nNMQAEAAAAAAAAAAAAAAEAL9i3QDXkVaE+EYxE4z4VjUqDs0/J/ivW7GNpDIVg/awgBAAAAAAAAAAAAAGgilNLbdBFwdrHU9YXgGVrA6hKqy9+chLcrofa7yvcdk6+v69q/j/6rY+oW9rHlh+Svh6YgaNvetiGw2pbfpv9d18nQ4zP2+ELAA+D/394d5LgNw1AA7eT+Zza6ClCkydixRJOi3wO6KIqx6TjTBb9EAQAAAMCOd+NFZjXq3gUZs+e6R9Z/5N53tvoZCXveBYKrhRafzPjss9+fAAAAAAAADoiaMf70XG38/DPb2fqvXgH97c+vbvXn3xtxEx1mHa3v7LWv3qEyO0ARAAAAAADAQRGrmz+NGYk4MPRMg7N6Azpa9gruVUQfAhy1gyVzd8zzfn/+xD2fAAAAAAAAfvHaoPv09xn3ed0BMKMRuFf/6qIb9F0+pyt8amZHXPvs2SHfXDszCJj1uQkAAAAAAOCA6BXO70Su/r9qBNDo9VdvwN9lB8FVq+ivHAEUNY7rmxpGCQAAAAAA4KCIxua7w38/jQWacS8jgL5z9Qz4VX0KmEa/X9Ejct7dzwggAAAAAGCKTw3SuzSOu7tTwHJlY37Wva5u+B+tY9rzbds2fBEAAAAA+opujmVfP/r+ew3gx+Px67+/q++bmqP7f1c0uF+vETGK6ei9v/Vvfb89R5SjK+yz7l/9+tXvv8cOAAAAAABorMMM+qjV0dmOvJsOz9lZ9RFRAgAAAAAAbq1Dg/wOog5hPnLfmdfS0J8r+/e3+vsUAAAAAABAoOwGZSdnDjEeNWMEUObuhezvX/X3050AAAAAAAAIM6sB/Gz0Pq+3UuP3teZvniF6xIwGfa7oz18AAAAAAMCtZa+QjtalwdtxBJAzAMat/vvrDAAAAAAAWNjqDcpKVhwB9MoIoLkEJL97ZBcAAAAAANBVdgOee/vZti27BgAAAAAWttdfyp5hvvoK4dHnm3GI7Yjo+kZ1+H691jCzppkBxrs6swOSCu8vkhFAAAAAAAzJbuDBiNHvb3RAcrSG17MFVmhsV/i/o8L7iyQAAAAAAADSZDeBqzdwj8o6JPkbGWc47Ony/j8RAAAAAABAY9kN1hVG6HQRsfJ/xvdnxd0JXQgAAAAAACgte0QLRJr1/Xw21Z/Xq9Rkf62pYo1nVf//xSHAAAAAAITq0OSrzOc7ZvSQ4koz5Ff4LnQbAVT9M7cDAAAAAAAay25QGwF0nYojgN41/L3z6zyyCwAAAAAAoKfsFf53ZwQQAAAAAKVlj+iofgZB9OdTvYFbfTV5dH2jI4z2jO7giN6Bkr3DpPr3zwggAAAAAFqr3sCGSNHf/+rXzw4IsgkAAAAAACgte4Y9VBbd4L57A311AgAAAAAAgCDVR0AxpvoOIwEAAAAAANxY9QYmROq+w0gAAAAAAEBp2Q3q6g0+7q36DP7sEUR3H2EkAAAAAAAACGIEUG/ZAeWeR3YBAAAAAADAfD/btmXXAAAAAAAsam8F+uiIlmzZK+yrj7DJvv+o1evfYwQQAAAAABCmeoMfOhMAAAAAAACnVV+hDr/pHlAJAAAAAAAAOGX1Bnr3gEoAAAAAAADwQfUGd3Z93RvoqxMAAAAAAACnjTagNZDJlB2gRBMAAAAAAABwyuoN9O4B1CO7AAAAAAAAYL6fbduyawAAAAAAWNLeCvK9FfJ7Px99/dVX8K8u+v0aAQQAAAAAUNRog16D/94EAAAAAAAAJ0U36LvPqCeWMwAAAAAAAKAhOwAAAAAAACBB9A4SAQAAAAAAwEnZh/BGHyLL2owAAgAAAACAhgQAAAAAAADQ0M+2bdk1AAAAAADAf7JHHGWPSBp9PmcAAAAAAADAG6NnNETbq88OAAAAAAAAeCN7B8AoZwAAAAAAAEBDAgAAAAAAAGjIGQAAAAAAAJQ0eghu9Rn+e0afzw4AAAAAAABoSAAAAAAAAAAN/Wzbll0DAAAAAAAwmR0AAAAAAADQkAAAAAAAAAAaEgAAAAAAAEBDAgAAAAAAAGhIAAAAAAAAAA0JAAAAAAAAoCEBAAAAAAAANCQAAAAAAACAhgQAAAAAAADQkAAAAAAAAAAaEgAAAAAAAEBDAgAAAAAAAGhIAAAAAAAAAA0JAAAAAAAAoCEBAAAAAAAANCQAAAAAAACAhgQAAAAAAADQkAAAAAAAAAAaEgAAAAAAAEBDAgAAAAAAAGhIAAAAAAAAAA0JAAAAAAAAoCEBAAAAAAAANPQX0ku0YHFPfR8AAAAASUVORK5CYII=";
  const _signS     = "data:image/png;base64,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";

  return `<div style="
      width:1056px;height:816px;padding:0;position:relative;
      background:#040c1e;font-family:Arial,sans-serif;color:#fff;
      overflow:hidden;box-sizing:border-box;border:10px solid #FFD700;display:block;">

    <!-- Background SVG -->
    <svg style="position:absolute;top:0;left:0;width:1056px;height:816px;z-index:0;" viewBox="0 0 1056 816" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#003380" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#0066CC" stop-opacity="0.7"/>
        </linearGradient>
      </defs>
      <path d="M0,0 L580,0 C290,10 80,280 0,600 Z" fill="url(#g1)" opacity="0.22"/>
      <path d="M1056,816 L500,816 C740,800 1040,540 1056,300 Z" fill="url(#g1)" opacity="0.22"/>
      <circle cx="100" cy="100" r="180" fill="rgba(0,51,128,0.10)"/>
      <circle cx="950" cy="710" r="160" fill="rgba(0,102,204,0.08)"/>
    </svg>

    <!-- Double Gold Border -->
    <div style="position:absolute;top:24px;left:24px;right:24px;bottom:24px;border:2px solid rgba(255,215,0,0.6);z-index:1;"></div>
    <div style="position:absolute;top:30px;left:30px;right:30px;bottom:30px;border:1px solid rgba(0,229,255,0.2);z-index:1;"></div>

    <!-- Corner marks -->
    <div style="position:absolute;top:18px;left:18px;width:28px;height:28px;border-top:3px solid #FFD700;border-left:3px solid #FFD700;z-index:2;"></div>
    <div style="position:absolute;top:18px;right:18px;width:28px;height:28px;border-top:3px solid #FFD700;border-right:3px solid #FFD700;z-index:2;"></div>
    <div style="position:absolute;bottom:18px;left:18px;width:28px;height:28px;border-bottom:3px solid #FFD700;border-left:3px solid #FFD700;z-index:2;"></div>
    <div style="position:absolute;bottom:18px;right:18px;width:28px;height:28px;border-bottom:3px solid #FFD700;border-right:3px solid #FFD700;z-index:2;"></div>

    <!-- CONTENT -->
    <div style="position:relative;z-index:10;padding:40px 60px 40px 60px;height:100%;box-sizing:border-box;">

      <!-- HEADER: Logo left | Academy center | Seal right -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0;">

        <!-- Left: text logo -->
        <div style="flex:0 0 170px;">
          <img src="${_logoText}" style="height:42px;width:auto;display:block;">
        </div>

        <!-- Center: Academy text only -->
        <div style="flex:1;text-align:center;padding:0 15px;">
          <div style="font-size:11px;letter-spacing:4px;color:#FFD700;text-transform:uppercase;font-weight:700;">
            Wings Fly Aviation & Career Development Academy
          </div>
          <div style="font-size:9px;letter-spacing:2px;color:rgba(0,229,255,0.5);margin-top:3px;text-transform:uppercase;">
            Dhaka, Bangladesh
          </div>
        </div>

        <!-- Right: round seal -->
        <div style="flex:0 0 85px;height:85px;border-radius:50%;overflow:hidden;border:2px solid #FFD700;box-shadow:0 0 14px rgba(255,215,0,0.4);">
          <img src="${_logoSeal}" style="width:85px;height:85px;object-fit:cover;display:block;">
        </div>
      </div>

      <!-- Gold divider -->
      <div style="margin:10px 0;height:1.5px;background:linear-gradient(90deg,transparent,#FFD700 30%,rgba(0,229,255,0.6) 60%,#FFD700 80%,transparent);"></div>

      <!-- BODY -->
      <div style="text-align:center;margin-top:12px;">

        <div style="font-size:70px;font-weight:900;font-family:Arial,sans-serif;letter-spacing:7px;line-height:1;color:#00e5ff;text-shadow:0 0 18px rgba(0,229,255,0.4);">CERTIFICATE</div>
        <div style="font-size:21px;font-weight:700;letter-spacing:5px;margin-top:3px;color:#FFD700;">✦ OF APPRECIATION ✦</div>

        <p style="font-size:14px;margin-top:15px;color:rgba(255,255,255,0.55);font-style:italic;">
          This certificate is proudly presented for honorable achievement to
        </p>

        <!-- Student Name -->
        <div style="font-size:52px;margin:8px 0 4px;color:#fff;font-family:Georgia,serif;font-weight:700;text-transform:uppercase;letter-spacing:3px;text-shadow:0 0 18px rgba(0,229,255,0.3);">
          ${s.name || 'Student Name'}
        </div>

        <div style="width:420px;height:1.5px;background:linear-gradient(90deg,transparent,#FFD700,rgba(0,229,255,0.7),#FFD700,transparent);margin:0 auto 10px;"></div>

        <!-- Batch + ID -->
        <div style="display:inline-block;padding:6px 28px;border:1.5px solid rgba(255,215,0,0.4);background:rgba(0,51,128,0.25);font-family:monospace;font-size:16px;font-weight:900;color:#fff;letter-spacing:1px;">
          BATCH — ${s.batch || 'N/A'} &nbsp;✦&nbsp; STUDENT ID : ${s.studentId || '-'}
        </div>

        <!-- Course -->
        <div style="margin-top:12px;font-size:12px;color:rgba(255,255,255,0.45);font-weight:700;text-transform:uppercase;line-height:1.9;letter-spacing:0.5px;">
          Certification On Training About The &ldquo;${s.course || 'COURSE'}&rdquo;<br>
          At ${academyName.toUpperCase()}
        </div>
      </div>

      <!-- FOOTER: two signatures -->
      <div style="position:absolute;bottom:38px;left:58px;right:58px;display:flex;justify-content:space-between;align-items:flex-end;z-index:20;">

        <!-- LEFT: Shakib -->
        <div style="text-align:center;width:210px;">
          <img src="${_signS}" style="height:52px;width:auto;max-width:190px;display:block;margin:0 auto 3px;">
          <div style="width:190px;height:1.5px;background:rgba(255,215,0,0.6);margin:0 auto 4px;"></div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#FFD700;letter-spacing:1.5px;">Course Coordinator</div>
          <div style="font-size:11.5px;color:rgba(255,255,255,0.85);font-weight:600;margin-top:2px;">Shakib Ibna Mustafa</div>
        </div>

        <!-- CENTER: website -->
        <div style="text-align:center;padding-bottom:4px;">
          <div style="font-size:11px;color:rgba(0,229,255,0.55);font-weight:700;letter-spacing:0.8px;">wingsflyaviationacademy.com</div>
        </div>

        <!-- RIGHT: Ferdous -->
        <div style="text-align:center;width:210px;">
          <img src="${_signF}" style="height:52px;width:auto;max-width:190px;display:block;margin:0 auto 3px;">
          <div style="width:190px;height:1.5px;background:rgba(255,215,0,0.6);margin:0 auto 4px;"></div>
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#FFD700;letter-spacing:1.5px;">Chairman</div>
          <div style="font-size:11.5px;color:rgba(255,255,255,0.85);font-weight:600;margin-top:2px;">Ferdous Ahmed</div>
        </div>

      </div>
    </div>
  </div>`;
}
function buildCertHtml_Cosmos(s, linearLogo, premiumLogo, signatureImg, nsdaLogo, academyName) {
  return `
  <div id="certContainer" style="
    width:1056px; height:816px; padding:0; position:relative;
    background:#05081a; font-family:'Outfit',sans-serif; color:#fff;
    overflow:hidden; box-sizing:border-box; border:10px solid #a855f7;">

    <!-- SVG Background -->
    <svg style="position:absolute;inset:0;width:100%;height:100%;z-index:0;" viewBox="0 0 1056 816" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="cc1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:0.7"/>
          <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:0.7"/>
        </linearGradient>
        <linearGradient id="cc2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#00ffc8;stop-opacity:0.15"/>
          <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0.15"/>
        </linearGradient>
        <radialGradient id="cc_glow1" cx="15%" cy="15%" r="40%">
          <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:0.3"/>
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0"/>
        </radialGradient>
        <radialGradient id="cc_glow2" cx="85%" cy="85%" r="40%">
          <stop offset="0%" style="stop-color:#00ffc8;stop-opacity:0.2"/>
          <stop offset="100%" style="stop-color:transparent;stop-opacity:0"/>
        </radialGradient>
        <pattern id="cgrid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(168,85,247,0.07)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="1056" height="816" fill="url(#cgrid)"/>
      <rect width="1056" height="816" fill="url(#cc_glow1)"/>
      <rect width="1056" height="816" fill="url(#cc_glow2)"/>
      <!-- Large corner orbs -->
      <circle cx="0" cy="0" r="320" fill="rgba(124,58,237,0.15)"/>
      <circle cx="1056" cy="816" r="280" fill="rgba(0,255,200,0.1)"/>
      <circle cx="528" cy="408" r="280" fill="rgba(79,70,229,0.05)"/>
      <!-- Corner shapes -->
      <path d="M0,0 L580,0 C290,10 80,280 0,600 Z" fill="url(#cc1)" opacity="0.2"/>
      <path d="M0,0 L380,0 C190,8 45,170 0,380 Z" fill="url(#cc2)" opacity="1"/>
      <path d="M1056,816 L500,816 C740,800 1040,540 1056,300 Z" fill="url(#cc1)" opacity="0.2"/>
      <path d="M1056,816 L680,816 C850,800 1050,620 1056,460 Z" fill="url(#cc2)" opacity="1"/>
      <!-- Star particles -->
      <circle cx="200" cy="650" r="1.5" fill="rgba(168,85,247,0.6)"/>
      <circle cx="850" cy="160" r="1.5" fill="rgba(0,255,200,0.6)"/>
      <circle cx="950" cy="450" r="1" fill="rgba(168,85,247,0.4)"/>
      <circle cx="100" cy="300" r="1" fill="rgba(0,255,200,0.4)"/>
    </svg>

    <!-- Double Border -->
    <div style="position:absolute;top:28px;left:28px;right:28px;bottom:28px;border:2px solid rgba(168,85,247,0.55);z-index:5;pointer-events:none;"></div>
    <div style="position:absolute;top:34px;left:34px;right:34px;bottom:34px;border:1px solid rgba(0,255,200,0.18);z-index:5;pointer-events:none;"></div>

    <!-- Corner Accents - Purple + Teal alternating -->
    <svg style="position:absolute;top:22px;left:22px;z-index:6;width:45px;height:45px;" viewBox="0 0 45 45"><path d="M0,0 L30,0 M0,0 L0,30" stroke="#a855f7" stroke-width="2.5" fill="none"/><circle cx="0" cy="0" r="3.5" fill="#a855f7"/></svg>
    <svg style="position:absolute;top:22px;right:22px;z-index:6;width:45px;height:45px;" viewBox="0 0 45 45"><path d="M45,0 L15,0 M45,0 L45,30" stroke="#00ffc8" stroke-width="2.5" fill="none"/><circle cx="45" cy="0" r="3.5" fill="#00ffc8"/></svg>
    <svg style="position:absolute;bottom:22px;left:22px;z-index:6;width:45px;height:45px;" viewBox="0 0 45 45"><path d="M0,45 L30,45 M0,45 L0,15" stroke="#00ffc8" stroke-width="2.5" fill="none"/><circle cx="0" cy="45" r="3.5" fill="#00ffc8"/></svg>
    <svg style="position:absolute;bottom:22px;right:22px;z-index:6;width:45px;height:45px;" viewBox="0 0 45 45"><path d="M45,45 L15,45 M45,45 L45,15" stroke="#a855f7" stroke-width="2.5" fill="none"/><circle cx="45" cy="45" r="3.5" fill="#a855f7"/></svg>

    <!-- Content -->
    <div style="position:relative;z-index:10;padding:46px 68px;height:100%;box-sizing:border-box;">

      <!-- Header Row -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0;">

        <!-- NSDA Logo (Left) -->
        <div style="width:105px;height:105px;background:#100826;border-radius:50%;padding:5px;box-shadow:0 0 0 2.5px #a855f7,0 0 20px rgba(168,85,247,0.45);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <img src="${nsdaLogo}" style="max-height:88px;max-width:88px;border-radius:50%;" onerror="this.style.display='none'">
        </div>

        <!-- Center: Academy + Logo -->
        <div style="text-align:center;">
          <div style="font-size:9.5px;letter-spacing:5px;color:#00ffc8;font-family:sans-serif;margin-bottom:7px;text-transform:uppercase;">✦ Wings Fly Aviation Academy ✦</div>
          <img src="${linearLogo}" style="height:50px;width:auto;filter:brightness(0) invert(1);" onerror="this.style.display='none'">
          <div style="margin-top:5px;font-size:8.5px;letter-spacing:3px;color:rgba(168,85,247,0.6);text-transform:uppercase;">Excellence in Aviation Training</div>
        </div>

        <!-- Cosmos Seal (Right) -->
        <div style="flex-shrink:0;width:118px;height:118px;">
          <svg viewBox="0 0 118 118" style="width:118px;height:118px;">
            <circle cx="59" cy="59" r="55" fill="none" stroke="#a855f7" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.5"/>
            <circle cx="59" cy="59" r="49" fill="none" stroke="#00ffc8" stroke-width="1" opacity="0.3"/>
            <polygon points="59,7 72,42 109,42 80,64 91,99 59,77 27,99 38,64 9,42 46,42" fill="#5b21b6"/>
            <polygon points="59,18 69,44 96,44 75,59 83,85 59,69 35,85 43,59 22,44 49,44" fill="#7c3aed"/>
            <text x="59" y="54" text-anchor="middle" font-size="7.5" fill="#00ffc8" font-family="sans-serif" letter-spacing="0.5" font-weight="900">WINGS FLY</text>
            <text x="59" y="65" text-anchor="middle" font-size="6.5" fill="#00ffc8" font-family="sans-serif" letter-spacing="0.5" font-weight="700">AVIATION</text>
            <text x="59" y="75" text-anchor="middle" font-size="5.5" fill="rgba(0,255,200,0.7)" font-family="sans-serif" letter-spacing="0.5">ACADEMY</text>
          </svg>
        </div>
      </div>

      <!-- Divider -->
      <div style="margin:8px 0 0;height:1.5px;background:linear-gradient(90deg,transparent,#a855f7 30%,#00ffc8 55%,#a855f7 80%,transparent);opacity:0.6;"></div>

      <!-- Body -->
      <div style="text-align:center;margin-top:18px;">

        <!-- CERTIFICATE Title -->
        <div style="font-size:80px;font-weight:900;font-family:'Oswald',sans-serif;letter-spacing:6px;line-height:1;color:#b44fff;text-shadow:0 0 25px rgba(168,85,247,0.6),0 2px 0 rgba(50,0,80,0.5);">CERTIFICATE</div>
        <div style="font-size:25px;font-weight:700;letter-spacing:5px;margin-top:3px;color:#00ffc8;text-shadow:0 0 12px rgba(0,255,200,0.4);">✦ OF APPRECIATION ✦</div>

        <p style="font-size:15.5px;margin-top:18px;color:rgba(255,255,255,0.45);font-style:italic;letter-spacing:0.8px;">This certificate is proudly presented for honorable achievement to</p>

        <!-- Student Name -->
        <div style="font-size:56px;margin:10px 0 5px;color:#fff;font-family:'Rye',serif;font-weight:400;text-transform:uppercase;letter-spacing:2px;text-shadow:0 0 20px rgba(168,85,247,0.5),0 0 50px rgba(0,255,200,0.2);">
          ${s.name || 'Student Name'}
        </div>

        <!-- Name underline -->
        <div style="width:440px;height:1.5px;background:linear-gradient(90deg,transparent,#a855f7,#00ffc8,#a855f7,transparent);margin:0 auto 12px;opacity:0.7;"></div>

        <!-- Batch + ID Badge -->
        <div style="display:inline-flex;align-items:center;gap:18px;padding:7px 28px;border:1.5px solid rgba(168,85,247,0.4);border-radius:4px;background:rgba(124,58,237,0.15);font-family:'Courier New',monospace;font-size:18px;font-weight:900;color:#fff;letter-spacing:1px;">
          <span>BATCH — ${s.batch || 'N/A'}</span>
          <span style="color:#00ffc8;font-size:14px;">✦</span>
          <span>STUDENT ID : ${s.studentId || '-'}</span>
        </div>

        <!-- Course Info -->
        <div style="margin-top:16px;padding:0 90px;font-size:13px;color:rgba(255,255,255,0.4);font-weight:700;text-transform:uppercase;line-height:1.9;letter-spacing:0.5px;">
          Certification On Training About The &ldquo;${(s.course || 'COURSE')}&rdquo;<br>At ${academyName.toUpperCase()}
        </div>
      </div>

      <!-- Footer -->
      <div style="position:absolute;bottom:46px;left:66px;z-index:20;">
        <div style="width:2px;height:24px;background:#00ffc8;margin-bottom:5px;opacity:0.5;"></div>
        <p style="margin:0;font-size:12px;color:rgba(0,255,200,0.5);font-weight:700;letter-spacing:0.8px;">wingsflyaviationacademy.com</p>
        <p style="margin:2px 0 0;font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:0.5px;">Dhaka, Bangladesh</p>
      </div>
      <div style="position:absolute;bottom:44px;right:66px;z-index:20;text-align:center;">
        <div style="height:65px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:4px;">
          ${signatureImg ? `<img src="${signatureImg}" style="height:60px;width:auto;" onerror="this.style.display='none'">` : '<div style="height:60px;"></div>'}
        </div>
        <div style="width:175px;height:1.5px;background:linear-gradient(90deg,rgba(168,85,247,0.4),#00ffc8,rgba(168,85,247,0.4));margin:0 auto 5px;"></div>
        <p style="margin:0;font-weight:800;font-size:12.5px;text-transform:uppercase;color:#00ffc8;letter-spacing:2px;">CHAIRMAN</p>
        <p style="margin:2px 0 0;font-size:12px;color:rgba(255,255,255,0.8);font-weight:700;">FERDOUS AHMED</p>
      </div>
    </div>
  </div>`;
}
// ===================================
// ORIGINAL generateCertificate (updated with design switch)
// ===================================

function generateCertificate() {
  if (!currentStudentForProfile) {
    showErrorToast('No student selected.');
    return;
  }

  const s = currentStudentForProfile;
  const academyName = "Wings Fly Aviation & Career Development Academy";
  const selectedDesign = globalData.settings?.certDesign || 'navy';

  const certHtml = (selectedDesign === 'cosmos')
    ? buildCertHtml_Cosmos(s, '', '', '', '', academyName)
    : buildCertHtml_Navy(s, '', '', '', '', academyName);

  // ── Show preview modal ───────────────────────────────────────────
  const wrapper = document.getElementById('certPreviewWrapper');
  if (!wrapper) { alert('Please refresh the page.'); return; }

  wrapper.innerHTML = certHtml;
  const certEl = wrapper.firstElementChild;

  // Scale to fit screen
  const availW = Math.min(window.innerWidth - 80, 1056);
  const scale  = availW / 1056;
  certEl.style.transform       = 'scale(' + scale + ')';
  certEl.style.transformOrigin = 'top left';
  certEl.style.display         = 'block';
  wrapper.style.width    = Math.round(1056 * scale) + 'px';
  wrapper.style.height   = Math.round(816  * scale) + 'px';
  wrapper.style.overflow = 'hidden';

  // Show modal
  const previewModal = new bootstrap.Modal(document.getElementById('certPreviewModal'));
  previewModal.show();

  // ── Wire Download button ─────────────────────────────────────────
  const dlBtn = document.getElementById('certDownloadBtn');
  const newBtn = dlBtn.cloneNode(true);
  dlBtn.parentNode.replaceChild(newBtn, dlBtn);

  newBtn.addEventListener('click', function() {
    if (typeof html2pdf === 'undefined') {
      alert('PDF library not loaded. Check internet connection.');
      return;
    }
    newBtn.disabled = true;
    newBtn.innerHTML = '⏳ Generating...';

    // Create full-size hidden render container
    const old = document.getElementById('_certRenderWrap');
    if (old) old.remove();

    const wrap = document.createElement('div');
    wrap.id = '_certRenderWrap';
    wrap.style.cssText = [
      'position:fixed', 'left:0', 'top:0',
      'width:1056px', 'height:816px',
      'overflow:hidden', 'z-index:-9999',
      'visibility:hidden',   // hidden but still rendered/painted
      'pointer-events:none'
    ].join(';');
    wrap.innerHTML = certHtml;
    document.body.appendChild(wrap);

    // Force browser to layout/paint before capture
    wrap.getBoundingClientRect(); // trigger reflow

    setTimeout(function() {
      // Make briefly visible so html2canvas can capture
      wrap.style.visibility = 'visible';
      wrap.style.opacity = '0.01';

      const renderEl = wrap.firstElementChild;

      const opt = {
        margin: 0,
        filename: 'Certificate_' + (s.name || 'Student').replace(/[^a-z0-9]/gi, '_') + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          width: 1056,
          height: 816,
          backgroundColor: (selectedDesign === 'cosmos') ? '#05081a' : '#040c1e',
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { unit: 'px', format: [1056, 816], orientation: 'landscape' }
      };

      html2pdf().from(renderEl).set(opt).save()
        .then(function() {
          if (document.body.contains(wrap)) document.body.removeChild(wrap);
          newBtn.disabled = false;
          newBtn.innerHTML = '⬇️ Download PDF';
          showSuccessToast('✅ Certificate downloaded!');
        })
        .catch(function(err) {
          console.error('PDF error:', err);
          if (document.body.contains(wrap)) document.body.removeChild(wrap);
          newBtn.disabled = false;
          newBtn.innerHTML = '⬇️ Download PDF';
          showErrorToast('PDF failed. Try again.');
        });
    }, 800);
  });
}
function generateIdCard() {
  const btn = document.getElementById('btnIdCard');
  const originalText = btn.innerHTML;

  // Validate student selection
  if (!currentStudentForProfile) {
    showErrorToast('No student selected.');
    return;
  }

  const s = currentStudentForProfile;

  // Show loading status
  btn.innerHTML = 'â³ Generating...';
  btn.disabled = true;

  // Use pre-loaded Base64 logos if available
  const linearLogo = (window.APP_LOGOS && window.APP_LOGOS.linear) ? window.APP_LOGOS.linear : 'wings_logo_linear.png';
  const premiumLogo = (window.APP_LOGOS && window.APP_LOGOS.premium) ? window.APP_LOGOS.premium : 'wings_logo_premium.png';
  const signatureImg = (window.APP_LOGOS && window.APP_LOGOS.signature) ? window.APP_LOGOS.signature : '';
  const nsdaLogo = (window.APP_LOGOS && window.APP_LOGOS.nsda) ? window.APP_LOGOS.nsda : '';

  const cardHtml = `
    <div id="idCardContainer" style="
      width: 600px; 
      height: 380px; 
      position: relative; 
      background: #f0f8ff;
      font-family: 'Outfit', sans-serif;
      color: #333;
      overflow: hidden;
      box-sizing: border-box;
      border: 4px solid #0d2e5c; 
      border-radius: 15px;
    ">
      <!-- Graphics Layer -->
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;">
         <svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style="width: 100%; height: 100%;">
            <defs>
               <linearGradient id="vibrantBlueID" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#00C6FB;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#005Bea;stop-opacity:1" />
               </linearGradient>
               <linearGradient id="goldGradID" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#FFD700;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#FFAA00;stop-opacity:1" />
               </linearGradient>
            </defs>
            <!-- Gold Curve (Back Layer) -->
            <path d="M0,0 L480,0 Q320,190 120,380 L0,380 Z" fill="url(#goldGradID)" />
            <!-- Blue Curve (Front Layer) -->
            <path d="M0,0 L400,0 Q240,190 40,380 L0,380 Z" fill="url(#vibrantBlueID)" />
         </svg>
      </div>

      <div style="position: relative; z-index: 10; padding: 20px; height: 100%;">
        <!-- Header Logos -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
           <!-- NSDA Logo (Left - On Blue) -->
           <div style="background: white; border-radius: 50%; padding: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); width: 60px; height: 60px; display: flex; align-items: center; justify-content: center;">
              <img src="${nsdaLogo}" style="max-height: 50px; max-width: 50px;" onerror="this.style.display='none'">
           </div>

           <!-- Linear Logo (Center - Overlap) -->
           <div style="margin-right: 50px;">
              <img src="${linearLogo}" style="height: 50px; width: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));" onerror="this.style.display='none'">
           </div>
           
           <!-- Premium Logo (Right - On White) -->
           <div style=" width: 70px; height: 70px; display: flex; align-items: center; justify-content: center;">
             <img src="${premiumLogo}" style="height: 70px; width: auto;" onerror="this.style.display='none'">
           </div>
        </div>

        <div style="display: flex; gap: 25px; margin-top: 25px; align-items: flex-start;">
            <!-- Photo -->
            <div style="
                width: 130px; height: 160px; 
                background: white; 
                border: 4px solid white; 
                border-radius: 12px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                overflow: hidden;
                background-size: cover;
                background-position: center;
                ${s.photo ? `background-image: url('${s.photo}');` : ''}
            ">
                ${!s.photo ? `<span style="font-size: 50px;">👤</span><span style="font-size: 10px; font-weight: bold; color: #777;">PHOTO</span>` : ''}
            </div>

            <!-- Details -->
            <div style="flex: 1; padding-top: 10px;">
                 <h2 style="margin: 0; color: #0d2e5c; font-weight: 800; text-transform: uppercase; font-size: 32px; line-height: 1.1; font-family: 'Oswald', sans-serif;">
                    ${s.name}
                 </h2>
                 
                 <!-- Tag -->
                 <div style="display: inline-block; background: #0d2e5c; color: white; padding: 5px 15px; border-radius: 6px; font-size: 14px; margin: 10px 0 15px 0; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">
                    STUDENT
                 </div>
                 
                 <div style="display: grid; grid-template-columns: auto 1fr; gap: 6px 15px; font-size: 15px; font-weight: 700; color: #333;">
                    <div style="color: #dba11c; text-align: right;">ID NO:</div>
                    <div style="font-weight: 900; font-family: 'Courier New', monospace; font-size: 18px; color: #000;">${s.studentId}</div>
                    
                    <div style="color: #dba11c; text-align: right;">BATCH:</div>
                    <div style="text-transform: uppercase;">${s.batch || 'N/A'}</div>
                    
                    <div style="color: #dba11c; text-align: right;">COURSE:</div>
                    <div style="font-size: 14px; line-height: 1.2;">${s.course || 'N/A'}</div>
                 </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="position: absolute; bottom: 15px; width: 100%; left: 0; padding: 0 25px; display: flex; justify-content: space-between; align-items: flex-end; z-index: 20;">
             <div style="font-size: 11px; font-weight: 800; color: #0d2e5c; background: rgba(255,255,255,0.8); padding: 2px 5px; border-radius: 4px;">
                 wingsflyaviationacademy.com
             </div>
             <div style="text-align: center;">
                 ${signatureImg ? `<img src="${signatureImg}" style="height: 40px; width: auto;" onerror="this.style.display='none'">` : ``}
                 <div style="height: 2px; background: #0d2e5c; width: 120px; margin: 2px 0;"></div>
                 <div style="font-size: 10px; font-weight: 800; color: #0d2e5c;">CHAIRMAN</div>
             </div>
        </div>
      </div>
    </div>
  `;

  // PDF generation options
  const opt = {
    margin: 0,
    filename: `ID_Card_${s.studentId || 'Student'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'px', format: [600, 380], orientation: 'landscape' }
  };

  if (typeof html2pdf === 'undefined') {
    console.error('Wings Fly: html2pdf library not loaded!');
    alert('PDF Library is not loaded. Please check your internet connection and refresh.');
    return;
  }

  html2pdf().from(cardHtml).set(opt).save().then(() => {
    console.log('Wings Fly: ID Card Downloaded');
    showSuccessToast('ID Card generated successfully!');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }).catch(err => {
    console.error('Wings Fly: PDF Error:', err);
    alert('Error generating PDF: ' + err.message);
    btn.innerHTML = originalText;
    btn.disabled = false;
  });
}

function showExpenseBreakdown() {
  const modal = new bootstrap.Modal(document.getElementById('expenseBreakdownModal'));
  const list = document.getElementById('breakdownList');

  const expenses = globalData.finance.filter(f => f.type === 'Expense' || f.type === 'Loan Given' || f.type === 'Transfer Out');
  const totals = {};
  let grantTotal = 0;

  expenses.forEach(e => {
    const cat = e.category || 'Uncategorized';
    totals[cat] = (totals[cat] || 0) + (parseFloat(e.amount) || 0);
    grantTotal += (parseFloat(e.amount) || 0);
  });

  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

  list.innerHTML = sorted.map(([cat, amt]) => {
    const perc = grantTotal > 0 ? Math.round((amt / grantTotal) * 100) : 0;
    return `
      <div class="list-group-item border-0 px-0">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="fw-bold">${cat}</span>
          <span class="fw-bold">৳${formatNumber(amt)}</span>
        </div>
        <div class="progress" style="height: 6px;">
          <div class="progress-bar bg-info" style="width: ${perc}%"></div>
        </div>
        <small class="text-muted">${perc}% of total expenses</small>
      </div>
    `;
  }).join('') || '<p class="text-center text-muted p-4">No expense records found.</p>';

  modal.show();
}

function printStudentProfile() {
  if (!currentStudentForProfile) return;
  const s = currentStudentForProfile;
  const printArea = document.getElementById('printArea');
  if (!printArea) return;

  const payments = globalData.finance
    .filter(f => f.description && f.description.toLowerCase().includes(s.name.toLowerCase()))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  printArea.innerHTML = `
    <div style="padding: 40px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
       ${getPrintHeader('STUDENT PAYMENT STATEMENT')}
       
       <div style="display: flex; justify-content: space-between; margin: 30px 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px;">
          <div>
             <h2 style="margin: 0; color: #4a3e91;">${s.name}</h2>
             <p style="margin: 5px 0;">Student ID: <strong>${s.studentId}</strong></p>
             <p style="margin: 5px 0;">Course: ${s.course} | Batch: ${s.batch}</p>
          </div>
          <div style="text-align: right;">
             <p style="margin: 5px 0;">Phone: ${s.phone}</p>
             <p style="margin: 5px 0;">Enrollment: ${s.enrollDate}</p>
          </div>
       </div>

       <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center;">
             <small style="color: #64748b; text-transform: uppercase;">Total Fee</small>
             <h3 style="margin: 5px 0;">৳${formatNumber(s.totalPayment)}</h3>
          </div>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; text-align: center;">
             <small style="color: #166534; text-transform: uppercase;">Paid Amount</small>
             <h3 style="margin: 5px 0; color: #16a34a;">৳${formatNumber(s.paid)}</h3>
          </div>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; text-align: center;">
             <small style="color: #991b1b; text-transform: uppercase;">Due Balance</small>
             <h3 style="margin: 5px 0; color: #dc2626;">৳${formatNumber(s.due)}</h3>
          </div>
       </div>

       <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
             <tr style="background: #f1f5f9; text-align: left;">
                <th style="padding: 12px; border: 1px solid #e2e8f0;">Date</th>
                <th style="padding: 12px; border: 1px solid #e2e8f0;">Category</th>
                <th style="padding: 12px; border: 1px solid #e2e8f0;">Method</th>
                <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: right;">Amount</th>
             </tr>
          </thead>
          <tbody>
             ${payments.map(p => `
                <tr>
                   <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.date}</td>
                   <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.category}</td>
                   <td style="padding: 12px; border: 1px solid #e2e8f0;">${p.method}</td>
                   <td style="padding: 12px; border: 1px solid #e2e8f0; text-align: right; font-weight: bold;">৳${formatNumber(p.amount)}</td>
                </tr>
             `).join('')}
          </tbody>
       </table>
       
       ${getPrintFooter()}
    </div>
  `;

  document.body.classList.add('printing-receipt');
  setTimeout(() => {
    window.print();
    setTimeout(() => document.body.classList.remove('printing-receipt'), 1000);
  }, 500);
}

function openAttendanceReportModal() {
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('attendanceReportModal'));
  const batchSelect = document.getElementById('attRepBatchSelect');
  const yearSelect  = document.getElementById('attRepYear');
  const monthSelect = document.getElementById('attRepMonth');

  const batches = [...new Set(globalData.students.map(s => s.batch))].filter(b => b).sort();
  batchSelect.innerHTML = '<option value="">Select a batch...</option>' +
    batches.map(b => '<option value="' + b + '">' + b + '</option>').join('');

  const now = new Date();
  const currentYear = now.getFullYear();
  yearSelect.innerHTML = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]
    .map(y => '<option value="' + y + '"' + (y === currentYear ? ' selected' : '') + '>' + y + '</option>').join('');

  monthSelect.value = now.getMonth();

  const container = document.getElementById('attendanceReportContainer');
  if (container) container.innerHTML = '';
  const emptyState = document.getElementById('monthlyAttEmptyState');
  if (emptyState) emptyState.classList.remove('d-none');
  const summaryCards = document.getElementById('monthlySummaryCards');
  if (summaryCards) summaryCards.classList.add('d-none');
  const headerInfo = document.getElementById('monthlyAttHeaderInfo');
  if (headerInfo) headerInfo.textContent = 'Batch, Year \u0993 Month \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8';

  modal.show();
}

function renderAttendanceReport() {
  const batch = document.getElementById('attRepBatchSelect').value;
  const year  = parseInt(document.getElementById('attRepYear').value);
  const month = parseInt(document.getElementById('attRepMonth').value);

  const container    = document.getElementById('attendanceReportContainer');
  const emptyState   = document.getElementById('monthlyAttEmptyState');
  const summaryCards = document.getElementById('monthlySummaryCards');
  const headerInfo   = document.getElementById('monthlyAttHeaderInfo');

  if (!batch) return;
  if (emptyState) emptyState.classList.add('d-none');

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const batchStudents = globalData.students.filter(function(s){ return s.batch === batch; });

  if (batchStudents.length === 0) {
    if (container) container.innerHTML = '<p class="text-center text-muted py-5">\u098f\u0987 Batch-\u098f \u0995\u09cb\u09a8\u09cb \u099b\u09be\u09a4\u09cd\u09b0 \u09a8\u09c7\u0987\u0964</p>';
    return;
  }

  // Find working days
  var workingDays = [];
  for (var d = 1; d <= daysInMonth; d++) {
    var ds = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    if (globalData.attendance && globalData.attendance[batch + '_' + ds]) workingDays.push(d);
  }

  var totalPresentAll = 0, totalAbsentAll = 0;
  var bestName = '\u2014', bestRate = -1;

  // Build student rows
  var studentRows = batchStudents.map(function(s, idx) {
    var p = 0, a = 0, dayCells = '';
    for (var d = 1; d <= daysInMonth; d++) {
      var ds  = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      var key = batch + '_' + ds;
      var status    = globalData.attendance && globalData.attendance[key] ? globalData.attendance[key][s.studentId] : undefined;
      var isWorking = !!(globalData.attendance && globalData.attendance[key]);
      var cellStyle = 'padding:4px 2px;text-align:center;border:1px solid rgba(255,255,255,0.06);font-size:0.75rem;min-width:28px;';
      var cellText  = '';
      if (status === 'Present')     { cellStyle += 'background:rgba(0,204,102,0.15);color:#00cc66;font-weight:700;'; cellText = 'P'; p++; }
      else if (status === 'Absent') { cellStyle += 'background:rgba(255,51,80,0.15);color:#ff3350;font-weight:700;'; cellText = 'A'; a++; }
      else if (isWorking)           { cellStyle += 'color:rgba(255,255,255,0.2);'; cellText = '\u2014'; }
      else                          { cellStyle += 'color:rgba(255,255,255,0.08);'; cellText = ''; }
      dayCells += '<td style="' + cellStyle + '">' + cellText + '</td>';
    }
    totalPresentAll += p; totalAbsentAll += a;
    var rate = workingDays.length > 0 ? Math.round(p / workingDays.length * 100) : 0;
    if (rate > bestRate) { bestRate = rate; bestName = s.name.split(' ')[0]; }
    var rateColor = rate >= 75 ? '#00cc66' : rate >= 50 ? '#ffcc00' : '#ff3350';
    var rowBg = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
    return '<tr style="background:' + rowBg + ';">' +
      '<td style="padding:8px 10px;border:1px solid rgba(255,255,255,0.06);color:rgba(255,255,255,0.4);font-size:0.8rem;text-align:center;">' + (idx+1) + '</td>' +
      '<td style="padding:8px 12px;border:1px solid rgba(255,255,255,0.06);color:#00d9ff;font-size:0.8rem;font-family:monospace;">' + (s.studentId || '\u2014') + '</td>' +
      '<td style="padding:8px 14px;border:1px solid rgba(255,255,255,0.06);font-weight:700;color:#e0e8ff;white-space:nowrap;">' + s.name + '</td>' +
      dayCells +
      '<td style="padding:8px 8px;border:1px solid rgba(255,255,255,0.06);text-align:center;font-weight:800;color:#00cc66;background:rgba(0,204,102,0.08);">' + p + '</td>' +
      '<td style="padding:8px 8px;border:1px solid rgba(255,255,255,0.06);text-align:center;font-weight:800;color:#ff3350;background:rgba(255,51,80,0.08);">' + a + '</td>' +
      '<td style="padding:8px 10px;border:1px solid rgba(255,255,255,0.06);text-align:center;font-weight:800;color:' + rateColor + ';font-size:0.9rem;">' + rate + '%</td>' +
      '</tr>';
  }).join('');

  // Day headers
  var dayHeaders = '';
  for (var d = 1; d <= daysInMonth; d++) {
    var ds2 = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    var isWorking2 = !!(globalData.attendance && globalData.attendance[batch + '_' + ds2]);
    var isFri = new Date(year, month, d).getDay() === 5;
    var bgC = isWorking2 ? 'rgba(0,180,255,0.2)' : (isFri ? 'rgba(255,200,0,0.1)' : 'rgba(255,255,255,0.04)');
    var txtC = isWorking2 ? '#00d9ff' : (isFri ? '#ffcc00' : 'rgba(255,255,255,0.4)');
    dayHeaders += '<th style="padding:6px 2px;text-align:center;min-width:28px;font-size:0.72rem;background:' + bgC + ';color:' + txtC + ';border:1px solid rgba(255,255,255,0.08);">' + d + '</th>';
  }

  // Footer per-day totals
  var footerDays = '';
  for (var d = 1; d <= daysInMonth; d++) {
    var ds3 = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    var dayData = globalData.attendance && globalData.attendance[batch + '_' + ds3];
    if (!dayData) { footerDays += '<td style="border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.02);"></td>'; continue; }
    var dp = Object.values(dayData).filter(function(v){ return v === 'Present'; }).length;
    var da = Object.values(dayData).filter(function(v){ return v === 'Absent'; }).length;
    footerDays += '<td style="padding:4px 2px;border:1px solid rgba(255,255,255,0.06);text-align:center;font-size:0.7rem;background:rgba(0,180,255,0.06);"><span style="color:#00cc66;font-weight:700;">' + dp + '</span><br><span style="color:#ff3350;font-weight:700;">' + da + '</span></td>';
  }

  var avgRate = workingDays.length > 0 && batchStudents.length > 0
    ? Math.round(totalPresentAll / (workingDays.length * batchStudents.length) * 100) : 0;

  container.innerHTML =
    '<div style="margin-bottom:12px;padding:10px 14px;background:rgba(0,180,255,0.06);border-radius:10px;border:1px solid rgba(0,180,255,0.15);">' +
      '<div style="font-size:0.8rem;color:rgba(255,255,255,0.5);margin-bottom:4px;">\uD83D\uDCC5 ' + MONTH_NAMES[month] + ' ' + year + ' \u2014 Batch ' + batch + '</div>' +
      '<div style="font-size:0.75rem;color:rgba(255,255,255,0.4);">\uD83D\uDD35 Highlighted = attendance taken &nbsp;|&nbsp; P = Present &nbsp;|&nbsp; A = Absent</div>' +
    '</div>' +
    '<div style="overflow-x:auto;">' +
      '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">' +
        '<thead><tr>' +
          '<th style="padding:8px 6px;text-align:center;min-width:36px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);font-size:0.72rem;">#</th>' +
          '<th style="padding:8px 10px;min-width:90px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);font-size:0.72rem;">ID</th>' +
          '<th style="padding:8px 14px;min-width:160px;text-align:left;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);font-size:0.72rem;">STUDENT NAME</th>' +
          dayHeaders +
          '<th style="padding:8px 6px;text-align:center;min-width:36px;background:rgba(0,204,102,0.12);border:1px solid rgba(255,255,255,0.08);color:#00cc66;font-size:0.72rem;">P</th>' +
          '<th style="padding:8px 6px;text-align:center;min-width:36px;background:rgba(255,51,80,0.12);border:1px solid rgba(255,255,255,0.08);color:#ff3350;font-size:0.72rem;">A</th>' +
          '<th style="padding:8px 8px;text-align:center;min-width:50px;background:rgba(255,200,0,0.1);border:1px solid rgba(255,255,255,0.08);color:#ffcc00;font-size:0.72rem;">RATE</th>' +
        '</tr></thead>' +
        '<tbody>' + studentRows + '</tbody>' +
        '<tfoot><tr>' +
          '<td colspan="3" style="padding:10px 14px;border:1px solid rgba(255,255,255,0.08);font-weight:700;color:rgba(255,255,255,0.6);font-size:0.8rem;background:rgba(255,255,255,0.04);">' +
            'Total &nbsp;|\u00a0 ' + batchStudents.length + ' Students &nbsp;|\u00a0 ' + workingDays.length + ' Working Days' +
          '</td>' +
          footerDays +
          '<td style="padding:10px 8px;border:1px solid rgba(255,255,255,0.08);text-align:center;font-weight:800;color:#00cc66;background:rgba(0,204,102,0.08);">' + totalPresentAll + '</td>' +
          '<td style="padding:10px 8px;border:1px solid rgba(255,255,255,0.08);text-align:center;font-weight:800;color:#ff3350;background:rgba(255,51,80,0.08);">' + totalAbsentAll + '</td>' +
          '<td style="padding:10px 8px;border:1px solid rgba(255,255,255,0.08);text-align:center;font-weight:800;color:#ffcc00;background:rgba(255,200,0,0.08);">' + avgRate + '%</td>' +
        '</tr></tfoot>' +
      '</table>' +
    '</div>';

  if (summaryCards) summaryCards.classList.remove('d-none');
  var wdEl = document.getElementById('mthWorkingDays');
  var tsEl = document.getElementById('mthTotalStudents');
  var arEl = document.getElementById('mthAvgRate');
  var bsEl = document.getElementById('mthBestStudent');
  if (wdEl) wdEl.textContent = workingDays.length;
  if (tsEl) tsEl.textContent = batchStudents.length;
  if (arEl) arEl.textContent = avgRate + '%';
  if (bsEl) bsEl.textContent = bestName;
  if (headerInfo) headerInfo.textContent = 'Batch ' + batch + '  \u2022  ' + MONTH_NAMES[month] + ' ' + year + '  \u2022  ' + batchStudents.length + ' Students';
}

function printMonthlyAttendance() {
  var batch = document.getElementById('attRepBatchSelect').value;
  var year  = parseInt(document.getElementById('attRepYear').value);
  var month = parseInt(document.getElementById('attRepMonth').value);
  if (!batch) { showErrorToast('\u274C Batch \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8\u0964'); return; }

  var MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
  var daysInMonth   = new Date(year, month + 1, 0).getDate();
  var batchStudents = globalData.students.filter(function(s){ return s.batch === batch; });
  if (!batchStudents.length) { showErrorToast('\u098f\u0987 Batch-\u098f \u0995\u09cb\u09a8\u09cb \u099b\u09be\u09a4\u09cd\u09b0 \u09a8\u09c7\u0987\u0964'); return; }

  var workingDays = [];
  for (var d = 1; d <= daysInMonth; d++) {
    var ds = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    if (globalData.attendance && globalData.attendance[batch + '_' + ds]) workingDays.push(d);
  }

  var dayThs = '';
  for (var d = 1; d <= daysInMonth; d++) {
    var ds2 = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    var isW = !!(globalData.attendance && globalData.attendance[batch + '_' + ds2]);
    var isFr = new Date(year, month, d).getDay() === 5;
    var bg = isW ? '#e8f4ff' : (isFr ? '#fffbe6' : '#fff');
    var col = isW ? '#0066cc' : (isFr ? '#cc9900' : '#aaa');
    dayThs += '<th style="border:1px solid #dde;width:26px;text-align:center;font-size:10px;background:' + bg + ';color:' + col + ';padding:4px 1px;">' + d + '</th>';
  }

  var totalP = 0, totalA = 0;
  var rows = batchStudents.map(function(s, idx) {
    var p = 0, a = 0, cells = '';
    for (var d = 1; d <= daysInMonth; d++) {
      var ds3 = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      var status  = globalData.attendance && globalData.attendance[batch+'_'+ds3] ? globalData.attendance[batch+'_'+ds3][s.studentId] : undefined;
      var working = !!(globalData.attendance && globalData.attendance[batch+'_'+ds3]);
      var txt = '', bg2 = '#fff', col2 = '#ccc';
      if (status === 'Present')     { txt = 'P'; bg2 = '#f0fff8'; col2 = '#007744'; p++; }
      else if (status === 'Absent') { txt = 'A'; bg2 = '#fff0f2'; col2 = '#cc2233'; a++; }
      else if (working)             { txt = '\u00b7'; col2 = '#ddd'; }
      cells += '<td style="border:1px solid #eef;text-align:center;font-size:10px;font-weight:700;background:' + bg2 + ';color:' + col2 + ';padding:3px 1px;">' + txt + '</td>';
    }
    totalP += p; totalA += a;
    var rate = workingDays.length ? Math.round(p / workingDays.length * 100) : 0;
    var rc = rate >= 75 ? '#007744' : rate >= 50 ? '#cc9900' : '#cc2233';
    var rowBg2 = idx % 2 === 0 ? '#fafbff' : '#fff';
    return '<tr style="background:' + rowBg2 + ';">' +
      '<td style="border:1px solid #eef;padding:5px 6px;text-align:center;font-size:10px;color:#aaa;">' + (idx+1) + '</td>' +
      '<td style="border:1px solid #eef;padding:5px 8px;font-family:monospace;font-size:10px;color:#1a4d6e;font-weight:600;">' + (s.studentId||'\u2014') + '</td>' +
      '<td style="border:1px solid #eef;padding:5px 10px;font-weight:700;font-size:11px;color:#1a1a3a;white-space:nowrap;">' + s.name + '</td>' +
      cells +
      '<td style="border:1px solid #eef;padding:5px 6px;text-align:center;font-weight:800;font-size:11px;color:#007744;background:#f0fff8;">' + p + '</td>' +
      '<td style="border:1px solid #eef;padding:5px 6px;text-align:center;font-weight:800;font-size:11px;color:#cc2233;background:#fff0f2;">' + a + '</td>' +
      '<td style="border:1px solid #eef;padding:5px 6px;text-align:center;font-weight:800;font-size:11px;color:' + rc + ';">' + rate + '%</td>' +
      '</tr>';
  }).join('');

  var footerDays2 = '';
  for (var d = 1; d <= daysInMonth; d++) {
    var ds4 = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
    var dd = globalData.attendance && globalData.attendance[batch+'_'+ds4];
    if (!dd) { footerDays2 += '<td style="border:1px solid #dde;background:#f9f9f9;"></td>'; continue; }
    var dp = Object.values(dd).filter(function(v){ return v==='Present'; }).length;
    var da = Object.values(dd).filter(function(v){ return v==='Absent'; }).length;
    footerDays2 += '<td style="border:1px solid #dde;text-align:center;font-size:9px;padding:3px 1px;background:#e8f4ff;"><span style="color:#007744;font-weight:700;">' + dp + '</span><br><span style="color:#cc2233;font-weight:700;">' + da + '</span></td>';
  }

  var avgRate2 = workingDays.length && batchStudents.length
    ? Math.round(totalP / (workingDays.length * batchStudents.length) * 100) : 0;
  var linearLogo  = (window.APP_LOGOS && window.APP_LOGOS.linear)  ? window.APP_LOGOS.linear  : 'wings_logo_linear.png';
  var premiumLogo = (window.APP_LOGOS && window.APP_LOGOS.premium) ? window.APP_LOGOS.premium : 'wings_logo_premium.png';

  var pw = window.open('', '', 'width=1200,height=850');
  pw.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Monthly Attendance - Batch ' + batch + '</title>' +
    '<style>body{font-family:"Segoe UI",sans-serif;padding:24px 30px;background:#fff;color:#1a1a3a;}' +
    '.header{text-align:center;margin-bottom:20px;}.logo-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}' +
    '.academy{font-size:22px;font-weight:900;color:#1a4d6e;text-transform:uppercase;letter-spacing:1px;}' +
    '.subtitle{font-size:13px;color:#666;}.report-title{font-size:17px;font-weight:800;color:#003366;text-transform:uppercase;border-bottom:3px solid #00b4ff;display:inline-block;padding-bottom:3px;margin:10px 0 4px;}' +
    '.meta{display:flex;justify-content:center;gap:28px;margin-bottom:14px;}' +
    '.meta-item .lbl{font-size:10px;color:#aaa;text-transform:uppercase;font-weight:600;}' +
    '.meta-item .val{font-weight:800;font-size:14px;color:#1a4d6e;}' +
    'table{width:100%;border-collapse:collapse;}thead th{background:#1a4d6e;color:#fff;padding:7px 4px;font-size:10px;text-transform:uppercase;}' +
    'tfoot td{background:#f0f4ff;font-weight:700;border:1px solid #dde;padding:6px 4px;}' +
    '.footer{margin-top:20px;display:flex;justify-content:space-between;font-size:10px;color:#bbb;}' +
    '@media print{@page{size:A3 landscape;margin:.4in;}}</style>' +
    '</head><body onload="window.print()">' +
    '<div class="header">' +
      '<div class="logo-row"><img src="' + premiumLogo + '" style="height:65px;"><div><div class="academy">Wings Fly Aviation Academy</div><div class="subtitle">Monthly Attendance Report \u2014 Official Record</div></div><img src="' + linearLogo + '" style="height:48px;"></div>' +
      '<div class="report-title">Monthly Attendance Sheet</div>' +
      '<div class="meta">' +
        '<div class="meta-item"><div class="lbl">Batch</div><div class="val">' + batch + '</div></div>' +
        '<div class="meta-item"><div class="lbl">Month</div><div class="val">' + MONTH_NAMES[month] + ' ' + year + '</div></div>' +
        '<div class="meta-item"><div class="lbl">Students</div><div class="val">' + batchStudents.length + '</div></div>' +
        '<div class="meta-item"><div class="lbl">Working Days</div><div class="val">' + workingDays.length + '</div></div>' +
        '<div class="meta-item"><div class="lbl" style="color:#007744;">Total Present</div><div class="val" style="color:#007744;">' + totalP + '</div></div>' +
        '<div class="meta-item"><div class="lbl" style="color:#cc2233;">Total Absent</div><div class="val" style="color:#cc2233;">' + totalA + '</div></div>' +
        '<div class="meta-item"><div class="lbl">Avg Rate</div><div class="val">' + avgRate2 + '%</div></div>' +
      '</div>' +
    '</div>' +
    '<table><thead><tr>' +
      '<th style="width:30px;">#</th><th style="width:85px;text-align:left;">Student ID</th><th style="min-width:140px;text-align:left;">Student Name</th>' +
      dayThs +
      '<th style="width:28px;background:#004d22;">P</th><th style="width:28px;background:#7a0010;">A</th><th style="width:40px;background:#4d3800;">Rate</th>' +
    '</tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '<tfoot><tr>' +
      '<td colspan="3" style="text-align:right;font-size:11px;padding:6px 10px;">Total \u2192 Present: <strong style="color:#007744;">' + totalP + '</strong> &nbsp;|&nbsp; Absent: <strong style="color:#cc2233;">' + totalA + '</strong></td>' +
      footerDays2 +
      '<td style="text-align:center;color:#007744;font-weight:800;font-size:12px;">' + totalP + '</td>' +
      '<td style="text-align:center;color:#cc2233;font-weight:800;font-size:12px;">' + totalA + '</td>' +
      '<td style="text-align:center;color:#cc6600;font-weight:800;font-size:12px;">' + avgRate2 + '%</td>' +
    '</tr></tfoot></table>' +
    '<div class="footer"><span>Generated: ' + new Date().toLocaleString() + '</span><span>Wings Fly Aviation Academy \u2014 Confidential</span></div>' +
    '</body></html>');
  pw.document.close();
}

function downloadMonthlyAttendanceCsv() {
  var batch = document.getElementById('attRepBatchSelect').value;
  var year  = parseInt(document.getElementById('attRepYear').value);
  var month = parseInt(document.getElementById('attRepMonth').value);
  if (!batch) { showErrorToast('\u274C Batch \u09ac\u09c7\u099b\u09c7 \u09a8\u09bf\u09a8\u0964'); return; }

  var MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
  var daysInMonth   = new Date(year, month + 1, 0).getDate();
  var batchStudents = globalData.students.filter(function(s){ return s.batch === batch; });
  if (!batchStudents.length) { showErrorToast('\u098f\u0987 Batch-\u098f \u0995\u09cb\u09a8\u09cb \u099b\u09be\u09a4\u09cd\u09b0 \u09a8\u09c7\u0987\u0964'); return; }

  var dayHdrs = Array.from({length: daysInMonth}, function(_, i){ return '"' + (i+1) + '"'; }).join(',');
  var headerRow = '"#","Student ID","Student Name",' + dayHdrs + ',"Present","Absent","Rate"';

  var dataRows = batchStudents.map(function(s, idx) {
    var p = 0, a = 0;
    var cells = Array.from({length: daysInMonth}, function(_, i) {
      var d  = i + 1;
      var ds = year + '-' + String(month+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      var st = globalData.attendance && globalData.attendance[batch+'_'+ds] ? globalData.attendance[batch+'_'+ds][s.studentId] : undefined;
      if (st === 'Present') { p++; return '"P"'; }
      if (st === 'Absent')  { a++; return '"A"'; }
      return '""';
    }).join(',');
    var rate = (p + a) > 0 ? Math.round(p / (p + a) * 100) + '%' : '\u2014';
    return '"' + (idx+1) + '","' + (s.studentId||'') + '","' + s.name + '",' + cells + ',"' + p + '","' + a + '","' + rate + '"';
  });

  var csv = 'Wings Fly Aviation Academy \u2014 Monthly Attendance\n' +
            'Batch: ' + batch + ' | Month: ' + MONTH_NAMES[month] + ' ' + year + '\n\n' +
            headerRow + '\n' + dataRows.join('\n');
  var blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8;'});
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'monthly_attendance_batch' + batch + '_' + MONTH_NAMES[month] + '_' + year + '.csv';
  link.click();
  showSuccessToast('\u2705 Monthly CSV \u09a1\u09be\u0989\u09a8\u09b2\u09cb\u09a1 \u09b9\u09af\u09bc\u09c7\u099b\u09c7!');
}

window.openAttendanceReportModal    = openAttendanceReportModal;
window.renderAttendanceReport       = renderAttendanceReport;
window.printMonthlyAttendance       = printMonthlyAttendance;
window.downloadMonthlyAttendanceCsv = downloadMonthlyAttendanceCsv;
window.printStudentProfile = printStudentProfile;
window.showExpenseBreakdown = showExpenseBreakdown;
window.generateStudentId = generateStudentId;
window.openAttendanceModal = openAttendanceModal;
window.loadAttendanceList = loadAttendanceList;
window.saveAttendance = saveAttendance;
function printBlankAttendanceSheet() {
  const batch = document.getElementById('attendanceBatchSelect').value;
  if (!batch) {
    showErrorToast('Please select a batch first.');
    return;
  }

  const batchStudents = globalData.students.filter(s => s.batch === batch);
  if (batchStudents.length === 0) {
    showErrorToast('No students found in this batch.');
    return;
  }

  // Get Logos
  const linearLogo = (window.APP_LOGOS && window.APP_LOGOS.linear) ? window.APP_LOGOS.linear : 'wings_logo_linear.png';
  const premiumLogo = (window.APP_LOGOS && window.APP_LOGOS.premium) ? window.APP_LOGOS.premium : 'wings_logo_premium.png';

  // Sort students by ID or Name
  batchStudents.sort((a, b) => a.studentId.localeCompare(b.studentId));

  const printWindow = window.open('', '', 'width=1100,height=800');

  const daysColumns = 15; // Number of blank day columns
  let headerCols = '';
  for (let i = 1; i <= daysColumns; i++) {
    headerCols += `<th style="border: 1px solid #000; width: 40px; text-align: center;">${i}</th>`;
  }

  const rows = batchStudents.map((s, index) => {
    let cols = '';
    for (let i = 0; i < daysColumns; i++) {
      cols += `<td style="border: 1px solid #000;"></td>`; // Empty cells
    }
    return `
        <tr>
            <td style="border: 1px solid #000; text-align: center;">${index + 1}</td>
            <td style="border: 1px solid #000; padding: 5px 10px; font-weight: 600; font-style: italic; color: #1a4d6e;">${s.name}</td>
            ${cols}
        </tr>
    `;
  }).join('');

  const html = `
    <html>
    <head>
        <title>Manual Attendance Sheet - ${batch}</title>
        <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; position: relative;}
            .logo-top { display: flex; justify-content: space-between; align-items: center; padding: 0 50px; }
            .main-title { font-size: 32px; font-weight: 800; color: #1a4d6e; margin: 10px 0 5px 0; text-transform: uppercase; letter-spacing: 1px; }
            .sub-title { font-size: 20px; font-weight: 700; color: #2c7da0; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #f0f8ff; padding: 8px; font-weight: bold; color: #1a4d6e; font-style: italic; }
            tr { height: 35px; }
            @media print {
                @page { size: landscape; margin: 0.5in; }
                .no-print { display: none; }
                body { -webkit-print-color-adjust: exact; }
            }
            .watermark {
                position: fixed;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                width: 800px;
                opacity: 0.05;
                z-index: -1;
                pointer-events: none;
            }
        </style>
    </head>
    <body onload="window.print()">
        <img src="${linearLogo}" class="watermark">
        
        <div class="header">
            <div class="logo-top">
                <img src="${premiumLogo}" style="height: 80px;">
                <img src="${linearLogo}" style="height: 60px;">
                <div style="width: 80px;"></div> <!-- Spacer for balance -->
            </div>
            <div class="main-title">WINGS FLY AVIATION ACADEMY</div>
            <div class="sub-title">${batchStudents[0].course || 'COURSE'} PRESENT SHEET - ${batch}</div>
        </div>

        <table>
            <thead>
                <tr>
                    <th style="border: 1px solid #000; width: 50px;">SL</th>
                    <th style="border: 1px solid #000; text-align: left; padding-left: 10px;">Students Name</th>
                    ${headerCols}
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// ===================================
// STUDENT COMMENT MODAL
// ===================================

function openCommentModal(rowIndex) {
  const student = globalData.students.find(s => s.rowIndex == rowIndex);
  if (!student) return;

  const modalEl = document.getElementById('commentModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.getElementById('commentModalTitle').innerText = `Notes for ${student.name}`;
  document.getElementById('studentCommentArea').value = student.remarks || '';
  document.getElementById('saveCommentBtn').onclick = () => saveStudentComment(rowIndex);

  modal.show();
}

function saveStudentComment(rowIndex) {
  const student = globalData.students.find(s => s.rowIndex == rowIndex);
  if (!student) return;

  const newComment = document.getElementById('studentCommentArea').value;
  student.remarks = newComment;

  saveToStorage();

  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('commentModal'));
  modal.hide();

  showSuccessToast('Comment saved successfully!');
  render(globalData.students);
}

// ===================================
// EDIT STUDENT
// ===================================

function openEditStudentModal(rowIndex) {
  const student = globalData.students[rowIndex];
  if (!student) return;

  const modalEl = document.getElementById('studentModal');
  const form = document.getElementById('studentForm');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

  // Update modal title
  modalEl.querySelector('.modal-title').innerHTML = `
    <span class="me-2 header-icon-circle bg-primary-light">✍️</span>Edit Student: ${student.name}
  `;

  // Populate form fields
  document.getElementById('studentRowIndex').value = rowIndex;  // Use the actual index parameter
  form.elements['name'].value = student.name;
  form.elements['phone'].value = student.phone;
  form.elements['fatherName'].value = student.fatherName || '';
  form.elements['motherName'].value = student.motherName || '';
  form.elements['course'].value = student.course;
  form.elements['batch'].value = student.batch;
  form.elements['enrollDate'].value = student.enrollDate;
  form.elements['method'].value = student.method;
  form.elements['totalPayment'].value = student.totalPayment;
  form.elements['payment'].value = student.paid;
  form.elements['due'].value = student.due;
  form.elements['reminderDate'].value = student.reminderDate || '';
  if (form.elements['bloodGroup']) form.elements['bloodGroup'].value = student.bloodGroup || '';
  if (form.elements['remarks']) form.elements['remarks'].value = student.remarks || '';

  // Handle Photo Preview for Edit
  const previewContainer = document.getElementById('photoPreviewContainer');
  const photoPreview = document.getElementById('photoPreview');
  const uploadInput = document.getElementById('photoUploadInput');
  const photoURLInput = document.getElementById('studentPhotoURL');

  if (student.photo) {
    photoPreview.src = getStudentPhotoSrc(student.photo);
    previewContainer.style.display = 'block';
    uploadInput.style.display = 'none';
    photoURLInput.value = student.photo;
  } else {
    photoPreview.src = '';
    previewContainer.style.display = 'none';
    uploadInput.style.display = 'block';
    photoURLInput.value = '';
  }

  modal.show();
}

// Reset modal title when closed (if needed for next "New" click)
document.getElementById('studentModal').addEventListener('hidden.bs.modal', function () {
  const modalEl = document.getElementById('studentModal');
  modalEl.querySelector('.modal-title').innerHTML = `
    <span class="me-2 header-icon-circle bg-primary-light">👨‍🎓</span>New Student Enrollment
  `;
  document.getElementById('studentForm').reset();
  document.getElementById('studentRowIndex').value = '';

  // Reset photo upload UI
  if (typeof removeStudentPhoto === 'function') {
    removeStudentPhoto();
  }
});

// Reset visitor modal title
const visitorModalEl = document.getElementById('visitorModal');
if (visitorModalEl) {
  visitorModalEl.addEventListener('hidden.bs.modal', function () {
    const title = document.getElementById('visitorModalTitle');
    if (title) {
      title.innerHTML = `<span class="me-2 header-icon-circle bg-primary-light">👤</span>Visitor Information`;
    }
    const form = document.getElementById('visitorForm');
    if (form) form.reset();
    const indexInput = document.getElementById('visitorRowIndex');
    if (indexInput) indexInput.value = '';
  });
}

window.openEditStudentModal = openEditStudentModal;
window.openCommentModal = openCommentModal;
window.saveStudentComment = saveStudentComment;
window.generateCertificate = generateCertificate;
window.selectCertDesign = selectCertDesign;
window.restoreCertDesignUI = restoreCertDesignUI;
window.buildCertHtml_Navy = buildCertHtml_Navy;
window.buildCertHtml_Cosmos = buildCertHtml_Cosmos;
window.generateIdCard = generateIdCard;
window.printBlankAttendanceSheet = printBlankAttendanceSheet;
window.openStudentProfile = openStudentProfile;

// ===================================
// STUDENT ID CARD GENERATOR
// ===================================

// ===================================
// STUDENT ID CARD GENERATOR
// ===================================

function openIdCardModal(rowIndex) {
  try {
    console.log("Opening ID Card for rowIndex:", rowIndex);

    const student = globalData.students[rowIndex];
    if (!student) {
      console.error("Student not found for rowIndex:", rowIndex);
      alert("Error: Student data not found.");
      return;
    }

    // Populate ID Card Fields
    document.getElementById('idCardName').innerText = student.name || 'Unknown Student';
    document.getElementById('idCardStudentId').innerText = student.studentId || 'N/A';
    document.getElementById('idCardCourse').innerText = student.course || 'N/A';
    document.getElementById('idCardBatch').innerText = student.batch ? `Batch ${student.batch}` : '';
    document.getElementById('idCardBlood').innerText = student.bloodGroup || 'N/A';
    document.getElementById('idCardPhone').innerText = student.phone || 'N/A';

    // Expiry Date (1 Year from Enrollment)
    const enrollDate = new Date(student.enrollDate || Date.now());
    const expiryDate = new Date(enrollDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    document.getElementById('idCardExpiry').innerText = expiryDate.toLocaleDateString();

    // Handle Photo - Load from localStorage or show placeholder
    const photoImg = document.getElementById('idCardPhoto');
    if (photoImg) {
      photoImg.src = getStudentPhotoSrc(student.photo);
    }

    // Set Barcode Text (Simulated)
    const barcodeEl = document.getElementById('idCardBarcodeText');
    if (barcodeEl) {
      barcodeEl.innerText = (student.studentId || '0000').replace(/\D/g, '');
    }

    // Show Modal
    const modalEl = document.getElementById('idCardModal');
    if (!modalEl) {
      console.error("ID Card Modal HTML element not found");
      alert("Error: ID Card Modal not found. Please refresh text.");
      return;
    }
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  } catch (e) {
    console.error("Error in openIdCardModal:", e);
    alert("An error occurred while generating ID Card.");
  }
}


function printIdCard() {
  const element = document.getElementById('idCardPreview');
  if (!element) return;

  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write('<html><head><title>Print ID Card</title>');
  // Include styles for print
  printWindow.document.write(`<style>
        body { margin: 0; padding: 20px; text-align: center; }
        #idCardPrint { 
            width: 337px; height: 212px; /* Standard Card ID-1 Size Approx */
            border: 1px solid #ccc; 
            margin: auto;
            position: relative;
            overflow: hidden;
            display: inline-block;
            transform-origin: top left;
        }
        /* Copy CSS needed for card */
        .id-card-front { width: 100%; height: 100%; position: relative; background: #fff; display: flex; flex-direction: column; text-align: left; }
        .id-card-bg-shape { position: absolute; top: 0; right: 0; width: 75%; height: 100%; background: linear-gradient(135deg, #0d6efd 0%, #0043a8 100%); clip-path: polygon(30% 0, 100% 0, 100% 100%, 0% 100%); border-top-right-radius: 12px; border-bottom-right-radius: 12px; z-index: 1; }
        .id-logo-circle { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 50%; padding: 2px; }
        .id-photo-frame { width: 80px; height: 95px; background: white; border: 2px solid white; border-radius: 6px; overflow: hidden; position: relative; z-index: 5; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .id-photo-img { width: 100%; height: 100%; object-fit: cover; }
        .id-footer-bar { background: #003366; position: relative; z-index: 5; min-height: 25px; display: flex; align-items: center; justify-content: space-between; padding: 0 10px; color: white; font-size: 10px; }
        .fw-bold { font-weight: bold; }
        .text-uppercase { text-transform: uppercase; }
        .m-0 { margin: 0; }
        .text-white { color: white; }
        .text-primary { color: #0d6efd; }
        .text-danger { color: #dc3545; }
        .text-center { text-align: center; }
        .d-flex { display: flex; }
        .justify-content-between { justify-content: space-between; }
        .align-items-center { align-items: center; }
        .gap-4 { gap: 1rem; }
        .p-4 { padding: 1rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mt-auto { margin-top: auto; }
        .small { font-size: 0.75rem; }
        .badge { display: inline-block; padding: 2px 5px; font-size: 10px; border-radius: 4px; background: #0d6efd; color: white; }
    </style>`);
  printWindow.document.write('</head><body>');

  // Clone and scale for print
  // Logic: In the modal it uses bootstrap classes. In print window we need basic inline or style block.
  // Simpler approach: Just print the innerHTML of idCardPreview wrapped in a div
  printWindow.document.write('<div id="idCardPrint">' + element.innerHTML + '</div>');

  printWindow.document.write('</body></html>');

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

window.openIdCardModal = openIdCardModal;
window.printIdCard = printIdCard;

// Flag to indicate app initialization is finished
window.appLoaded = true;

// ===================================
// RECENT ADMISSIONS RENDER
// ===================================

function renderRecentAdmissions(filterStr = '') {
  const tbody = document.getElementById('recentAdmissionsBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  // Get last 8 students enrolled
  let students = [...globalData.students].sort((a, b) => (b.enrollDate || '').localeCompare(a.enrollDate || '')).slice(0, 8);

  if (filterStr) {
    const q = filterStr.toLowerCase();
    students = students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.course && s.course.toLowerCase().includes(q)) ||
      (s.batch && s.batch.toLowerCase().includes(q))
    );
  }

  if (students.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No recent admissions found</td></tr>';
    return;
  }

  students.forEach(s => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.onclick = () => openStudentProfile(s.rowIndex);
    tr.innerHTML = `
      <td>
        <div class="d-flex align-items-center gap-2">
          <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 0.75rem;">
            ${(s.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="fw-bold text-dark">${s.name}</div>
            <div class="small text-muted">${s.studentId || 'No ID'}</div>
          </div>
        </div>
      </td>
      <td class="small fw-semibold">${s.course || '-'}</td>
      <td class="small text-muted">${s.enrollDate || '-'}</td>
      <td class="small"><span class="badge bg-light text-dark border">${s.batch || '-'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function addEmployeeRole() {
  const inp = document.getElementById('newEmployeeRoleInput');
  const val = inp.value.trim();
  if (val) {
    if (!globalData.employeeRoles) globalData.employeeRoles = [];
    globalData.employeeRoles.push(val);
    inp.value = '';
    saveToStorage();
    renderSettings();
    showSuccessToast('Role added');
  }
}

function deleteEmployeeRole(index) {
  if (confirm('Delete this role?')) {
    globalData.employeeRoles.splice(index, 1);
    saveToStorage();
    renderSettings();
  }
}

function filterRecentAdmissions(query) {
  renderRecentAdmissions(query);
}

window.filterRecentAdmissions = filterRecentAdmissions;
window.renderRecentAdmissions = renderRecentAdmissions;

// ===================================
// EMPLOYEE MANAGEMENT
// ===================================

// Global declaration for safety
window.employeeModalInstance = null;

function openEmployeeModal() {
  console.log('Open Employee Modal Clicked');
  const form = document.getElementById('employeeForm');
  if (form) form.reset();

  const idField = document.getElementById('employeeId');
  if (idField) idField.value = '';

  const modalEl = document.getElementById('employeeModal');
  if (!modalEl) {
    console.error('Employee modal element not found!');
    return;
  }

  // Dynamic Role Population
  const roleSelect = form.querySelector('select[name="role"]');
  if (roleSelect) {
    const roles = globalData.employeeRoles || ['Instructor', 'Admin', 'Staff', 'Manager'];
    // Preserve current selection if editing (though form.reset() clears it, editing logic might set it later)
    roleSelect.innerHTML = roles.map(r => `<option value="${r}">${r}</option>`).join('');
  }

  try {
    if (!window.employeeModalInstance) {
      window.employeeModalInstance = new bootstrap.Modal(modalEl);
    }
    window.employeeModalInstance.show();
  } catch (err) {
    console.error(err);
    alert('Failed to show modal: ' + err.message);
  }
}

async function handleEmployeeSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const employeeData = Object.fromEntries(formData.entries());

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

  try {
    const newEmployee = {
      id: employeeData.employeeId || 'EMP-' + Date.now(),
      name: employeeData.name,
      role: employeeData.role,
      email: employeeData.email,
      phone: employeeData.phone,
      joiningDate: employeeData.joiningDate,
      resignDate: employeeData.resignDate || null,
      salary: parseFloat(employeeData.salary) || 0,
      status: employeeData.resignDate ? 'Resigned' : 'Active',
      lastUpdated: new Date().toISOString()
    };

    if (employeeData.employeeId) {
      const index = globalData.employees.findIndex(em => em.id === employeeData.employeeId);
      if (index !== -1) {
        globalData.employees[index] = { ...globalData.employees[index], ...newEmployee };
        showSuccessToast('Employee updated successfully!');
      }
    } else {
      if (!globalData.employees) globalData.employees = [];
      globalData.employees.push(newEmployee);
      showSuccessToast('Employee added successfully!');
    }

    // CRITICAL: Update timestamp BEFORE saving to prevent race conditions
    const currentTime = new Date().toISOString();
    localStorage.setItem('lastLocalUpdate', currentTime);

    // Save to local storage
    localStorage.setItem('wingsfly_data', JSON.stringify(globalData));

    // Close modal immediately
    const employeeModalEl = document.getElementById('employeeModal');
    if (employeeModalEl) {
      const modal = bootstrap.Modal.getInstance(employeeModalEl) || new bootstrap.Modal(employeeModalEl);
      modal.hide();
    }

    // Refresh UI immediately
    renderEmployeeList();

    // Attempt cloud sync in background
    if (typeof window.saveToCloud === 'function') {
      console.log('🚀 Initiating employee sync to cloud...');
      window.saveToCloud(true).catch(err => {
        console.error('Background cloud sync failed:', err);
      });
    }

  } catch (err) {
    console.error('Error during employee save process:', err);
    alert("Error saving employee: " + err.message);
  } finally {
    // Ensure button is reset
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

function renderEmployeeList() {
  const tbody = document.getElementById('employeeTableBody');
  const searchInput = document.getElementById('employeeSearchInput');
  const roleFilter = document.getElementById('employeeRoleFilter');
  const noDataMsg = document.getElementById('noEmployeesMessage');

  if (!tbody || !searchInput) return;

  // Dynamically populate role filter dropdown
  if (roleFilter) {
    const currentFilterVal = roleFilter.value;
    const roles = globalData.employeeRoles || ['Instructor', 'Admin', 'Staff', 'Manager'];
    roleFilter.innerHTML = '<option value="">All Roles</option>' + roles.map(r => `<option value="${r}">${r}</option>`).join('');
    if (currentFilterVal && roles.includes(currentFilterVal)) {
      roleFilter.value = currentFilterVal;
    }
  }

  const search = searchInput.value.toLowerCase();
  const role = roleFilter ? roleFilter.value : '';

  tbody.innerHTML = '';

  const filtered = (globalData.employees || []).filter(e => {
    const matchSearch = (e.name && e.name.toLowerCase().includes(search)) ||
      (e.phone && e.phone.includes(search)) ||
      (e.email && e.email.toLowerCase().includes(search));
    const matchRole = !role || e.role === role;
    return matchSearch && matchRole;
  }).reverse();

  if (filtered.length === 0) {
    noDataMsg.classList.remove('d-none');
    return;
  }
  noDataMsg.classList.add('d-none');

  filtered.forEach(e => {
    const tr = document.createElement('tr');

    let docLinks = '';
    // Helper to check if URL is valid (Firebase storage or full https URL)
    const isValidUrl = (url) => url && (url.startsWith('https://') || url.startsWith('http://'));

    if (e.docs) {
      if (isValidUrl(e.docs.cv)) docLinks += `<a href="${e.docs.cv}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-light border me-1 text-primary" title="View CV"><i class="bi bi-file-earmark-person"></i></a>`;
      if (isValidUrl(e.docs.nid)) docLinks += `<a href="${e.docs.nid}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-light border me-1 text-primary" title="View NID"><i class="bi bi-card-heading"></i></a>`;
      if (isValidUrl(e.docs.cert)) docLinks += `<a href="${e.docs.cert}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-light border me-1 text-primary" title="View Certificate"><i class="bi bi-award"></i></a>`;
      if (isValidUrl(e.docs.other)) docLinks += `<a href="${e.docs.other}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-light border me-1 text-primary" title="Other Doc"><i class="bi bi-file-earmark"></i></a>`;
    }

    const statusBadge = (e.status === 'Resigned')
      ? '<span class="badge bg-danger text-white border-0">Resigned</span>'
      : '<span class="badge bg-success-light text-success border-0">Active</span>';

    tr.innerHTML = `
        <td>
            <div class="d-flex align-items-center gap-2">
                <div class="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px;">
                    ${e.name.charAt(0).toUpperCase()}
                </div>
                <div class="fw-bold text-dark">${e.name}</div>
            </div>
        </td>
        <td><span class="badge bg-light text-dark border">${e.role}</span></td>
        <td>
            <div class="small">${e.phone}</div>
            <div class="small text-muted">${e.email || '-'}</div>
        </td>
        <td class="fw-bold text-dark">৳${formatNumber(e.salary)}</td>
        <td class="small text-muted">${e.joiningDate || '-'}</td>
        <td class="small ${e.resignDate ? 'text-danger fw-bold' : 'text-muted'}">${e.resignDate || '-'}</td>
        <td>${statusBadge}</td>
        <td class="text-end">
            <div class="d-flex justify-content-end align-items-center">
                ${docLinks}
                <button class="btn btn-sm btn-outline-primary border-0 ms-2" onclick="openEditEmployeeModal('${e.id}')" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger border-0 ms-1" onclick="deleteEmployee('${e.id}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;
    tbody.appendChild(tr);
  });
}

function openEditEmployeeModal(id) {
  const employee = globalData.employees.find(e => e.id === id);
  if (!employee) return;

  const modalEl = document.getElementById('employeeModal');
  const form = document.getElementById('employeeForm');
  if (!modalEl || !form) return;

  form.reset();

  // Populate fields
  if (form.employeeId) form.employeeId.value = employee.id;
  if (form.name) form.name.value = employee.name;
  if (form.role) {
    // Ensure role exists in options, if not add it temporarily or rely on existing options
    const roleExists = [...form.role.options].some(o => o.value === employee.role);
    if (!roleExists) {
      const opt = document.createElement('option');
      opt.value = employee.role;
      opt.text = employee.role;
      form.role.add(opt);
    }
    form.role.value = employee.role;
  }
  if (form.email) form.email.value = employee.email || '';
  if (form.phone) form.phone.value = employee.phone || '';
  if (form.joiningDate) form.joiningDate.value = employee.joiningDate || '';
  if (form.resignDate) form.resignDate.value = employee.resignDate || '';
  if (form.salary) form.salary.value = employee.salary || '';

  // Dynamic Role Population (ensure we populate list but keep selected value)
  const roleSelect = form.querySelector('select[name="role"]');
  if (roleSelect && globalData.employeeRoles) {
    // Re-populate but keep selected
    const currentVal = employee.role;
    roleSelect.innerHTML = globalData.employeeRoles.map(r => `<option value="${r}" ${r === currentVal ? 'selected' : ''}>${r}</option>`).join('');
  }

  // Show Modal
  try {
    if (!window.employeeModalInstance) {
      window.employeeModalInstance = new bootstrap.Modal(modalEl);
    }
    window.employeeModalInstance.show();
  } catch (e) { console.error(e); }
}

window.openEditEmployeeModal = openEditEmployeeModal;

async function deleteEmployee(id) {
  if (confirm('Are you sure you want to remove this employee?')) {
    globalData.employees = globalData.employees.filter(e => e.id !== id);

    // CRITICAL: Update timestamp and force immediate sync
    const currentTime = new Date().toISOString();
    localStorage.setItem('lastLocalUpdate', currentTime);
    localStorage.setItem('wingsfly_data', JSON.stringify(globalData));

    if (typeof window.saveToCloud === 'function') {
      console.log('🚀 Forcing immediate employee deletion sync to cloud...');
      await window.saveToCloud(true);
    }

    renderEmployeeList();
    showSuccessToast('Employee removed.');
  }
}

// Expose functions
window.openEmployeeModal = openEmployeeModal;
window.handleEmployeeSubmit = handleEmployeeSubmit;
window.renderEmployeeList = renderEmployeeList;
window.deleteEmployee = deleteEmployee;

// ===================================
// NOTIFICATION CENTER
// ===================================

function updateNotifications() {
  const today = new Date().toISOString().split('T')[0];
  const notifications = [];

  // 1. Check for overdue payment reminders
  globalData.students.forEach(s => {
    if (s.reminderDate && parseFloat(s.due) > 0) {
      const isOverdue = s.reminderDate < today;
      const isToday = s.reminderDate === today;

      if (isOverdue) {
        notifications.push({
          type: 'danger',
          icon: '� ï¸',
          title: 'Overdue Payment',
          message: `${s.name} owes ৳${formatNumber(s.due)} - was due on ${s.reminderDate}`,
          action: () => openStudentProfile(s.rowIndex),
          time: s.reminderDate
        });
      } else if (isToday) {
        notifications.push({
          type: 'warning',
          icon: '📋',
          title: 'Payment Due Today',
          message: `${s.name} - ৳${formatNumber(s.due)} due today!`,
          action: () => openStudentProfile(s.rowIndex),
          time: 'Today'
        });
      }
    }
  });

  // 2. Check for students with high dues (> 10000)
  globalData.students.filter(s => parseFloat(s.due) > 10000 && !s.reminderDate).slice(0, 3).forEach(s => {
    notifications.push({
      type: 'info',
      icon: '💰',
      title: 'High Outstanding Due',
      message: `${s.name} has ৳${formatNumber(s.due)} outstanding`,
      action: () => openStudentProfile(s.rowIndex),
      time: 'High Priority'
    });
  });

  // 3. Check for resigned employees this month
  const thisMonth = today.substring(0, 7);
  (globalData.employees || []).filter(e => e.resignDate && e.resignDate.startsWith(thisMonth)).forEach(e => {
    notifications.push({
      type: 'secondary',
      icon: '�”',
      title: 'Employee Resigned',
      message: `${e.name} resigned on ${e.resignDate}`,
      action: () => switchTab('employees'),
      time: e.resignDate
    });
  });

  renderNotificationList(notifications);
}

function renderNotificationList(notifications) {
  const container = document.getElementById('notificationList');
  const badge = document.getElementById('notificationBadge');

  if (!container) return;

  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-check-circle fs-3 d-block mb-2 text-success"></i>
        <span class="small">All caught up! No new notifications</span>
      </div>
    `;
    if (badge) badge.style.display = 'none';
    return;
  }

  // Update badge
  if (badge) {
    badge.textContent = notifications.length > 9 ? '9+' : notifications.length;
    badge.style.display = 'inline-block';
  }

  // Render list
  container.innerHTML = notifications.map((n, i) => `
    <div class="notification-item p-3 border-bottom d-flex align-items-start gap-3 hover-bg-light" 
         style="cursor: pointer; transition: background 0.2s;" 
         onmouseover="this.style.background='#f8f9fa'" 
         onmouseout="this.style.background='transparent'"
         onclick="handleNotificationClick(${i})">
      <div class="notification-icon fs-4">${n.icon}</div>
      <div class="flex-grow-1">
        <div class="fw-bold small text-${n.type === 'danger' ? 'danger' : n.type === 'warning' ? 'warning' : 'dark'}">${n.title}</div>
        <div class="small text-muted">${n.message}</div>
        <div class="small text-muted opacity-75 mt-1"><i class="bi bi-clock me-1"></i>${n.time}</div>
      </div>
    </div>
  `).join('');

  // Store for click handling
  window._notificationActions = notifications.map(n => n.action);
}

function handleNotificationClick(index) {
  if (window._notificationActions && window._notificationActions[index]) {
    window._notificationActions[index]();
  }
}

function clearAllNotifications() {
  const container = document.getElementById('notificationList');
  const badge = document.getElementById('notificationBadge');

  if (container) {
    container.innerHTML = `
      <div class="text-center text-muted py-4">
        <i class="bi bi-check-circle fs-3 d-block mb-2 text-success"></i>
        <span class="small">All caught up! No new notifications</span>
      </div>
    `;
  }
  if (badge) badge.style.display = 'none';
  showSuccessToast('Notifications cleared!');
}

window.updateNotifications = updateNotifications;
window.clearAllNotifications = clearAllNotifications;
window.handleNotificationClick = handleNotificationClick;

// Auto-update notifications when dashboard loads
const originalLoadDashboard = window.loadDashboard || loadDashboard;
window.loadDashboard = function () {
  if (typeof originalLoadDashboard === 'function') originalLoadDashboard();
  setTimeout(updateNotifications, 500);
};

// ===================================
// BANK ACCOUNT MANAGEMENT
// ===================================

function renderAccountList() {
  const container = document.getElementById('accountTableBody');
  const noAccountsMsg = document.getElementById('noAccountsMessage');
  const searchInput = document.getElementById('accountSearchInput');
  const totalBalanceEl = document.getElementById('totalAccountBalance');

  if (!container) return;

  // Update unified search dropdown whenever account list renders
  if (typeof populateAccountDropdown === 'function') {
    populateAccountDropdown();
  }

  const query = (searchInput?.value || '').toLowerCase();
  const accounts = (globalData.bankAccounts || []).filter(acc =>
    acc.name.toLowerCase().includes(query) ||
    acc.bankName.toLowerCase().includes(query) ||
    acc.accountNo.toLowerCase().includes(query) ||
    (acc.branch && acc.branch.toLowerCase().includes(query))
  );

  if (accounts.length === 0) {
    container.innerHTML = '';
    noAccountsMsg.classList.remove('d-none');
    totalBalanceEl.innerText = '৳0';
    return;
  }

  noAccountsMsg.classList.add('d-none');
  let html = '';
  let totalBalance = 0;

  accounts.forEach((acc, index) => {
    const bal = parseFloat(acc.balance) || 0;
    totalBalance += bal;
    html += `
      <tr>
        <td style="padding: 1rem;">${acc.sl || index + 1}</td>
        <td style="padding: 1rem;">
          <div class="fw-bold text-av-main">${acc.name}</div>
        </td>
        <td style="padding: 1rem;">${acc.branch || '-'}</td>
        <td style="padding: 1rem;">
          <span class="badge bg-light text-dark border">${acc.bankName}</span>
        </td>
        <td style="padding: 1rem;"><code>${acc.accountNo}</code></td>
        <td style="padding: 1rem; text-align: right;" class="fw-bold text-success font-monospace">৳${formatNumber(bal)}</td>
        <td style="padding: 1rem; text-align: end;">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary border-0 rounded-circle" onclick="openAccountModal(${globalData.bankAccounts.indexOf(acc)})">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-outline-danger border-0 rounded-circle" onclick="deleteAccount(${globalData.bankAccounts.indexOf(acc)})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
  totalBalanceEl.innerText = '৳' + formatNumber(totalBalance);
}

function openAccountModal(index = -1) {
  const form = document.getElementById('accountForm');
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('accountModal'));

  form.reset();
  form.accountIndex.value = index;

  if (index >= 0) {
    const acc = globalData.bankAccounts[index];
    form.name.value = acc.name;
    form.branch.value = acc.branch || '';
    form.bankName.value = acc.bankName;
    form.accountNo.value = acc.accountNo;
    form.balance.value = acc.balance;
    document.querySelector('#accountModal .modal-title').innerHTML = '<span class="me-2 header-icon-circle bg-primary-light">🏦</span>Edit Bank Account';
  } else {
    document.querySelector('#accountModal .modal-title').innerHTML = '<span class="me-2 header-icon-circle bg-primary-light">🏦</span>Add New Bank Account';
  }

  modal.show();
}

async function handleAccountSubmit(e) {
  console.log('handleAccountSubmit called'); // DEBUG
  e.preventDefault();
  const form = e.target;
  const index = parseInt(form.accountIndex.value);

  console.log('Form data:', { // DEBUG
    name: form.name.value,
    branch: form.branch.value,
    bankName: form.bankName.value,
    accountNo: form.accountNo.value,
    balance: form.balance.value,
    index: index
  });

  // CRITICAL: Ensure bankAccounts array exists
  if (!globalData.bankAccounts) {
    globalData.bankAccounts = [];
  }

  const accountData = {
    name: form.name.value.trim(),
    branch: form.branch.value,
    bankName: form.bankName.value,
    accountNo: form.accountNo.value,
    balance: parseFloat(form.balance.value) || 0,
    sl: index >= 0 ? globalData.bankAccounts[index].sl : globalData.bankAccounts.length + 1
  };

  try {
    if (index >= 0) {
      const oldName = globalData.bankAccounts[index].name;
      globalData.bankAccounts[index] = accountData;
      // No need to update paymentMethods - handled dynamically in populateDropdowns
      showSuccessToast('✅ Bank account updated successfully!');
    } else {
      console.log('Adding new account...'); // DEBUG
      globalData.bankAccounts.push(accountData);
      // No need to add to paymentMethods - handled dynamically in populateDropdowns
      console.log('Account added, showing toast...'); // DEBUG
      showSuccessToast('✅ New bank account added successfully!');
    }

    console.log('Closing modal...'); // DEBUG
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('accountModal'));
    if (modalInstance) modalInstance.hide();

    console.log('Saving to storage...'); // DEBUG
    await saveToStorage();
    console.log('Rendering account list...'); // DEBUG
    renderAccountList();
    if (typeof populateDropdowns === 'function') populateDropdowns();
    console.log('Done!'); // DEBUG
  } catch (error) {
    console.error('Error in handleAccountSubmit:', error);
    showErrorToast('Failed to save account: ' + error.message);
  }
}

async function deleteAccount(index) {
  if (!confirm('Are you sure you want to delete this bank account?')) return;

  const accName = globalData.bankAccounts[index].name;
  globalData.bankAccounts.splice(index, 1);

  // No need to remove from paymentMethods - handled dynamically in populateDropdowns

  // Re-index SL
  globalData.bankAccounts.forEach((acc, i) => acc.sl = i + 1);

  await saveToStorage();
  renderAccountList();
  if (typeof populateDropdowns === 'function') populateDropdowns();
  showSuccessToast('🗑️ Account deleted successfully');
}

function openTransferModal() {
  const modal = new bootstrap.Modal(document.getElementById('transferModal'));
  const form = document.getElementById('transferForm');
  form.reset();
  form.date.value = new Date().toISOString().split('T')[0];
  modal.show();
}

async function handleTransferSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const fromAcc = form.fromAccount.value;
  const toAcc = form.toAccount.value;
  const amount = parseFloat(form.amount.value);
  const date = form.date.value;
  const notes = form.notes.value || 'Internal Transfer';

  if (!fromAcc || !toAcc || fromAcc === toAcc) {
    alert('Please select two different accounts.');
    return;
  }
  if (amount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  // Helper function to find account (Cash, Bank, or Mobile)
  function findAccount(accountName) {
    if (accountName === 'Cash') {
      return { type: 'cash', account: null };
    }

    let account = globalData.bankAccounts.find(a => a.name === accountName);
    if (account) {
      return { type: 'bank', account: account };
    }

    account = globalData.mobileBanking.find(a => a.name === accountName);
    if (account) {
      return { type: 'mobile', account: account };
    }

    return null;
  }

  // Find source and destination accounts
  const sourceResult = findAccount(fromAcc);
  const destResult = findAccount(toAcc);

  if (!sourceResult) {
    alert('Source account not found: ' + fromAcc);
    return;
  }

  if (!destResult) {
    alert('Destination account not found: ' + toAcc);
    return;
  }

  // Check if source has enough balance
  let sourceBalance = 0;
  if (sourceResult.type === 'cash') {
    sourceBalance = parseFloat(globalData.cashBalance) || 0;
  } else {
    sourceBalance = parseFloat(sourceResult.account.balance) || 0;
  }

  if (sourceBalance < amount) {
    alert(`Insufficient balance in ${fromAcc}. Available: ৳${sourceBalance}`);
    return;
  }

  // Update source balance (deduct)
  if (sourceResult.type === 'cash') {
    globalData.cashBalance = (parseFloat(globalData.cashBalance) || 0) - amount;
  } else {
    sourceResult.account.balance = (parseFloat(sourceResult.account.balance) || 0) - amount;
  }

  // Update destination balance (add)
  if (destResult.type === 'cash') {
    globalData.cashBalance = (parseFloat(globalData.cashBalance) || 0) + amount;
  } else {
    destResult.account.balance = (parseFloat(destResult.account.balance) || 0) + amount;
  }

  // Record in Ledger (Two entries for clarity)
  const transferOut = {
    date: date,
    category: 'Transfer',
    type: 'Transfer Out',
    method: fromAcc,
    amount: amount,
    person: toAcc,
    notes: notes,
    rowIndex: globalData.finance.length + 1
  };
  globalData.finance.push(transferOut);

  const transferIn = {
    date: date,
    category: 'Transfer',
    type: 'Transfer In',
    method: toAcc,
    amount: amount,
    person: fromAcc,
    notes: notes,
    rowIndex: globalData.finance.length + 1
  };
  globalData.finance.push(transferIn);

  bootstrap.Modal.getInstance(document.getElementById('transferModal')).hide();
  await saveToStorage();

  // Update all displays
  renderAccountList();
  if (typeof renderCashBalance === 'function') renderCashBalance();
  if (typeof renderMobileBankingList === 'function') renderMobileBankingList();
  if (typeof updateGrandTotal === 'function') updateGrandTotal();
  updateGlobalStats();

  showSuccessToast('✅ Balance transferred successfully!');
}

// Global Exposure
window.renderAccountList = renderAccountList;
window.openAccountModal = openAccountModal;
window.handleAccountSubmit = handleAccountSubmit;
window.deleteAccount = deleteAccount;
window.openTransferModal = openTransferModal;
window.handleTransferSubmit = handleTransferSubmit;


// === NEW ACTIONS MODAL LOGIC ===
function openStudentActionsModal(index) {
  const items = globalData.students || [];
  if (!items[index]) return;
  const s = items[index];

  const body = document.getElementById('actionsModalBody');
  if (!body) return;

  body.innerHTML = `
  <div class='text-center mb-3'>
     <h6 class='fw-bold mb-0'>${s.name}</h6>
     <span class='small text-muted'>ID: ${s.studentId || 'N/A'}</span>
  </div>
  <button class='btn btn-warning w-100 fw-bold py-2 mb-2 text-dark' onclick='openStudentPaymentModal(${index}); bootstrap.Modal.getInstance(document.getElementById("actionsModal")).hide()'>💰 Add Payment</button>
  <button class='btn btn-info w-100 fw-bold py-2 mb-2 text-white' onclick='openIdCardModal(${index}); bootstrap.Modal.getInstance(document.getElementById("actionsModal")).hide()'><i class="bi bi-person-badge"></i> View ID Card</button>
  <button class='btn btn-success w-100 fw-bold py-2 mb-2' onclick='openEditStudentModal(${index}); bootstrap.Modal.getInstance(document.getElementById("actionsModal")).hide()'><i class="bi bi-pencil-square"></i> Edit Profile</button>
  <button class='btn btn-primary w-100 fw-bold py-2 mb-2' onclick='printReceipt(${index}); bootstrap.Modal.getInstance(document.getElementById("actionsModal")).hide()'><i class="bi bi-printer"></i> Print Receipt</button>
  <button class='btn btn-secondary w-100 fw-bold py-2 mb-2' onclick='quickSetReminder(${index}); bootstrap.Modal.getInstance(document.getElementById("actionsModal")).hide()'><i class="bi bi-bell"></i> Set Reminder</button>
  <hr class='my-2'>
  <button class='btn btn-danger w-100 fw-bold py-2' onclick='deleteStudent(${index}); bootstrap.Modal.getInstance(document.getElementById("actionsModal")).hide()'><i class="bi bi-trash"></i> Delete</button>
  `;

  const modal = new bootstrap.Modal(document.getElementById('actionsModal'));
  modal.show();
}

// Global Exposure
window.openStudentActionsModal = openStudentActionsModal;

// === ADVANCED SEARCH FUNCTIONS ===
function populateBatchFilter() {
  const select = document.getElementById('batchFilterSelect');
  if (!select) {
    console.warn('⚠️ batchFilterSelect element not found');
    return;
  }

  if (!window.globalData || !window.globalData.students) {
    console.warn('⚠️ globalData.students not available');
    return;
  }

  const batches = [...new Set(globalData.students.map(s => s.batch))].filter(b => b).sort((a, b) => a - b);

  console.log('📊 Populating batch filter with', batches.length, 'batches:', batches);

  select.innerHTML = '<option value="">All Batches</option>';
  batches.forEach(b => {
    select.innerHTML += `<option value="${b}">Batch ${b}</option>`;
  });

  console.log('✅ Batch filter populated successfully');
}

function applyAdvancedSearch() {
  const batch = document.getElementById('batchFilterSelect')?.value;
  const startDate = document.getElementById('advSearchStartDate')?.value;
  const endDate = document.getElementById('advSearchEndDate')?.value;

  const filtered = globalData.students.filter(s => {
    const matchBatch = !batch || s.batch?.toString() === batch;
    const matchStart = !startDate || s.enrollDate >= startDate;
    const matchEnd = !endDate || s.enrollDate <= endDate;
    return matchBatch && matchStart && matchEnd;
  });

  // Calculate totals
  const totalCollected = filtered.reduce((sum, s) => sum + (parseFloat(s.paid) || 0), 0);
  const totalDue = filtered.reduce((sum, s) => sum + (parseFloat(s.due) || 0), 0);

  // Update UI
  document.getElementById('advSearchIncome').innerText = '৳' + formatNumber(totalCollected);
  document.getElementById('advSearchCollected').innerText = '৳' + formatNumber(totalCollected);
  document.getElementById('advSearchDue').innerText = '৳' + formatNumber(totalDue);
  document.getElementById('advSearchCount').innerText = filtered.length;

  // Show/hide summary
  const summary = document.getElementById('advSearchSummary');
  if (batch || startDate || endDate) {
    summary.classList.remove('d-none');
  } else {
    summary.classList.add('d-none');
  }

  // Render filtered students
  render(filtered);
}

function clearAdvancedSearch() {
  document.getElementById('batchFilterSelect').value = '';
  document.getElementById('advSearchStartDate').value = '';
  document.getElementById('advSearchEndDate').value = '';
  document.getElementById('advSearchSummary').classList.add('d-none');
  render(globalData.students);
}

window.populateBatchFilter = populateBatchFilter;
window.applyAdvancedSearch = applyAdvancedSearch;
window.clearAdvancedSearch = clearAdvancedSearch;

// ========================================
// QUICK SEARCH FUNCTIONALITY
// ========================================

function quickFilterStudents() {
  const searchInput = document.getElementById('quickStudentSearch');
  if (!searchInput) return;

  const query = searchInput.value.toLowerCase().trim();

  // If empty, show all students
  if (query === '') {
    render(globalData.students);
    return;
  }

  // Filter students by name, batch, ID, phone, or course
  const filtered = globalData.students.filter(student => {
    const name = (student.name || '').toLowerCase();
    const batch = (student.batch || '').toString().toLowerCase();
    const studentId = (student.studentId || '').toString().toLowerCase();
    const phone = (student.phone || '').toLowerCase();
    const course = (student.course || '').toLowerCase();

    return name.includes(query) ||
      batch.includes(query) ||
      studentId.includes(query) ||
      phone.includes(query) ||
      course.includes(query);
  });

  // Render filtered results
  render(filtered);

  // Update count badge
  const countBadge = document.getElementById('studentCount');
  if (countBadge) {
    countBadge.textContent = `${filtered.length} student${filtered.length !== 1 ? 's' : ''}`;
  }
}

// Make globally available
window.quickFilterStudents = quickFilterStudents;

// ========================================
// MOBILE BANKING MANAGEMENT
// ========================================

function renderMobileBankingList() {
  const container = document.getElementById('mobileTableBody');
  const noAccountsMsg = document.getElementById('noMobileMessage');
  const searchInput = document.getElementById('mobileSearchInput');
  const totalBalanceEl = document.getElementById('totalMobileBalance');
  const combinedTotalEl = document.getElementById('combinedTotalBalance');

  if (!container) return;

  // Initialize mobile banking if not exists
  if (!globalData.mobileBanking) globalData.mobileBanking = [];

  // Update unified search dropdown whenever mobile accounts render
  if (typeof populateAccountDropdown === 'function') {
    populateAccountDropdown();
  }

  const query = (searchInput?.value || '').toLowerCase();
  const accounts = (globalData.mobileBanking || []).filter(acc =>
    acc.name.toLowerCase().includes(query) ||
    (acc.accountNo && acc.accountNo.toLowerCase().includes(query))
  );

  if (accounts.length === 0) {
    container.innerHTML = '';
    if (noAccountsMsg) noAccountsMsg.classList.remove('d-none');
    if (totalBalanceEl) totalBalanceEl.innerText = '৳0';
    updateCombinedTotal();
    return;
  }

  if (noAccountsMsg) noAccountsMsg.classList.add('d-none');
  let html = '';
  let totalBalance = 0;

  accounts.forEach((acc, index) => {
    const bal = parseFloat(acc.balance) || 0;
    totalBalance += bal;
    html += `
      <tr>
        <td style="padding: 1rem;">${acc.sl || index + 1}</td>
        <td style="padding: 1rem;">
          <div class="fw-bold text-av-main">${acc.name}</div>
        </td>
        <td style="padding: 1rem;"><code>${acc.accountNo || '-'}</code></td>
        <td style="padding: 1rem; text-align: right;" class="fw-bold text-success font-monospace">৳${formatNumber(bal)}</td>
        <td style="padding: 1rem; text-align: end;">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary border-0 rounded-circle" onclick="openMobileModal(${globalData.mobileBanking.indexOf(acc)})">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button class="btn btn-outline-danger border-0 rounded-circle" onclick="deleteMobileAccount(${globalData.mobileBanking.indexOf(acc)})">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  container.innerHTML = html;
  if (totalBalanceEl) totalBalanceEl.innerText = '৳' + formatNumber(totalBalance);
  updateCombinedTotal();
}

function updateCombinedTotal() {
  const bankTotal = (globalData.bankAccounts || []).reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
  const mobileTotal = (globalData.mobileBanking || []).reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
  const combined = bankTotal + mobileTotal;

  const combinedEl = document.getElementById('combinedTotalBalance');
  if (combinedEl) {
    combinedEl.innerText = '৳' + formatNumber(combined);
  }
}

function openMobileModal(index = -1) {
  const form = document.getElementById('mobileForm');
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('mobileModal'));

  if (!globalData.mobileBanking) globalData.mobileBanking = [];

  form.reset();
  form.mobileIndex.value = index;

  if (index >= 0) {
    const acc = globalData.mobileBanking[index];
    form.name.value = acc.name;
    form.accountNo.value = acc.accountNo || '';
    form.balance.value = acc.balance;
    document.querySelector('#mobileModal .modal-title').innerHTML = '<span class="me-2 header-icon-circle bg-success-light">📱</span>Edit Mobile Banking';
  } else {
    document.querySelector('#mobileModal .modal-title').innerHTML = '<span class="me-2 header-icon-circle bg-success-light">📱</span>Add Mobile Banking';
  }

  modal.show();
}

async function handleMobileSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const index = parseInt(form.mobileIndex.value);

  if (!globalData.mobileBanking) globalData.mobileBanking = [];

  const accountData = {
    sl: index >= 0 ? globalData.mobileBanking[index].sl : globalData.mobileBanking.length + 1,
    name: form.name.value.trim(),
    accountNo: form.accountNo.value.trim(),
    balance: parseFloat(form.balance.value) || 0
  };

  try {
    if (index >= 0) {
      globalData.mobileBanking[index] = accountData;
      showSuccessToast('✅ Mobile banking updated successfully!');
    } else {
      globalData.mobileBanking.push(accountData);
      showSuccessToast('✅ Mobile banking added successfully!');
    }

    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('mobileModal'));
    if (modalInstance) modalInstance.hide();

    await saveToStorage();
    renderMobileBankingList();
    if (typeof renderAccountList === 'function') renderAccountList();
    if (typeof populateDropdowns === 'function') populateDropdowns();
  } catch (error) {
    console.error('Error in handleMobileSubmit:', error);
    showErrorToast('Failed to save mobile account: ' + error.message);
  }
}

async function deleteMobileAccount(index) {
  if (!confirm('Are you sure you want to delete this mobile banking account?')) return;

  const accName = globalData.mobileBanking[index].name;
  globalData.mobileBanking.splice(index, 1);

  await saveToStorage();
  renderMobileBankingList();
  if (typeof renderAccountList === 'function') renderAccountList();
  if (typeof populateDropdowns === 'function') populateDropdowns();
  updateGlobalStats();
  showSuccessToast('🗑️ Mobile account deleted successfully!');
}

// Update renderAccountList to also update combined total
const originalRenderAccountList = renderAccountList;
renderAccountList = function () {
  originalRenderAccountList();
  updateCombinedTotal();
};

// Global Exposure
window.renderMobileBankingList = renderMobileBankingList;
window.openMobileModal = openMobileModal;
window.handleMobileSubmit = handleMobileSubmit;
window.deleteMobileAccount = deleteMobileAccount;
window.updateCombinedTotal = updateCombinedTotal;

/* =========================================================
   CASH MANAGEMENT FUNCTIONS
   ========================================================= */

function renderCashBalance() {
  const cashBalanceEl = document.getElementById('cashBalance');
  if (!cashBalanceEl) return;

  // Initialize cash balance if not exists
  if (typeof globalData.cashBalance === 'undefined') {
    globalData.cashBalance = 0;
  }

  const balance = parseFloat(globalData.cashBalance) || 0;
  cashBalanceEl.innerText = '৳' + formatNumber(balance);
  updateGrandTotal();
}

function openCashModal() {
  const form = document.getElementById('cashForm');
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('cashModal'));

  if (typeof globalData.cashBalance === 'undefined') {
    globalData.cashBalance = 0;
  }

  form.reset();
  form.cashBalance.value = globalData.cashBalance || 0;

  modal.show();
}

async function handleCashSubmit(e) {
  e.preventDefault();
  const form = e.target;

  const newBalance = parseFloat(form.cashBalance.value) || 0;
  globalData.cashBalance = newBalance;

  try {
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('cashModal'));
    if (modalInstance) modalInstance.hide();

    await saveToStorage();
    renderCashBalance();
    if (typeof populateDropdowns === 'function') populateDropdowns();

    showSuccessToast('✅ Cash balance updated successfully!');
  } catch (error) {
    console.error('Error in handleCashSubmit:', error);
    showErrorToast('Failed to update cash balance: ' + error.message);
  }
}

function updateGrandTotal() {
  const cashTotal = parseFloat(globalData.cashBalance) || 0;
  const bankTotal = (globalData.bankAccounts || []).reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
  const mobileTotal = (globalData.mobileBanking || []).reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
  const grandTotal = cashTotal + bankTotal + mobileTotal;

  // Update Total Balance Card in Bank Details section (this is now the only grand total display)
  const totalBalanceCash = document.getElementById('totalBalanceCash');
  const totalBalanceBank = document.getElementById('totalBalanceBank');
  const totalBalanceMobile = document.getElementById('totalBalanceMobile');
  const totalBalanceGrand = document.getElementById('totalBalanceGrand');

  if (totalBalanceCash) totalBalanceCash.innerText = '৳' + formatNumber(cashTotal);
  if (totalBalanceBank) totalBalanceBank.innerText = '৳' + formatNumber(bankTotal);
  if (totalBalanceMobile) totalBalanceMobile.innerText = '৳' + formatNumber(mobileTotal);
  if (totalBalanceGrand) totalBalanceGrand.innerText = '৳' + formatNumber(grandTotal);
}

// Update existing functions to also update grand total
const originalRenderAccountListForGrand = renderAccountList;
renderAccountList = function () {
  originalRenderAccountListForGrand();
  updateGrandTotal();
};

const originalRenderMobileBankingListForGrand = renderMobileBankingList;
renderMobileBankingList = function () {
  originalRenderMobileBankingListForGrand();
  updateGrandTotal();
};

// Global Exposure
window.renderCashBalance = renderCashBalance;
window.openCashModal = openCashModal;
window.handleCashSubmit = handleCashSubmit;
window.updateGrandTotal = updateGrandTotal;

/* =========================================================
   WINGS FLY – BANK ACCOUNT ↔ PAYMENT METHOD SYNC SYSTEM
   SAFE DROP-IN MODULE (NO REPLACE REQUIRED)
   ========================================================= */

/* 1️⃣ Payment Method = ONLY Bank Accounts */
function syncPaymentMethodsWithAccounts() {
  if (!window.globalData) return;

  if (!Array.isArray(globalData.bankAccounts)) {
    globalData.bankAccounts = [];
  }

  // Only bank account names
  globalData.paymentMethods = globalData.bankAccounts.map(acc => acc.name);

  saveToStorage(true);

  if (typeof populateDropdowns === 'function') {
    populateDropdowns();
  }

  console.log('✅ Payment methods synced:', globalData.paymentMethods);
}
window.syncPaymentMethodsWithAccounts = syncPaymentMethodsWithAccounts;


/* 2️⃣ Calculate Total Bank Balance (Dashboard Fix) */
function calculateTotalBankBalance() {
  if (!globalData.bankAccounts) return 0;

  return globalData.bankAccounts.reduce((total, acc) => {
    return total + (parseFloat(acc.balance) || 0);
  }, 0);
}
window.calculateTotalBankBalance = calculateTotalBankBalance;


/* 3️⃣ Dashboard Auto Balance Update */
function updateDashboardBankBalance() {
  const el =
    document.getElementById('totalBalance') ||
    document.getElementById('dashboardTotalBalance') ||
    document.getElementById('bankTotal');

  if (!el) return;

  el.innerText = '৳' + formatNumber(calculateTotalBankBalance());
}
window.updateDashboardBankBalance = updateDashboardBankBalance;


/* 4️⃣ SMART ACCOUNTING LOGIC
      Income → Balance +
      Expense → Balance -
*/
function applyFinanceToBankAccount(entry) {
  if (!entry || !entry.method) return;

  const account = globalData.bankAccounts.find(
    acc => acc.name === entry.method
  );
  if (!account) return;

  const amount = parseFloat(entry.amount) || 0;

  if (entry.type === 'Income' || entry.type === 'Loan Received') {
    account.balance = (parseFloat(account.balance) || 0) + amount;
  }

  if (
    entry.type === 'Expense' ||
    entry.type === 'Loan Given' ||
    entry.type === 'Salary' ||
    entry.type === 'Rent' ||
    entry.type === 'Utilities'
  ) {
    account.balance = (parseFloat(account.balance) || 0) - amount;
  }

  saveToStorage(true);
  updateDashboardBankBalance();
}


/* 5️⃣ Hook into Finance Save (AUTO APPLY) */
(function hookFinanceSave() {
  const originalPush = globalData.finance.push.bind(globalData.finance);

  globalData.finance.push = function () {
    for (let i = 0; i < arguments.length; i++) {
      applyFinanceToBankAccount(arguments[i]);
    }
    return originalPush(...arguments);
  };
})();


/* 6️⃣ Auto Sync on App Load */
document.addEventListener('DOMContentLoaded', () => {
  syncPaymentMethodsWithAccounts();
  updateDashboardBankBalance();
});
/* =========================================================
   FINAL BANK ACCOUNT RECONCILIATION SYSTEM
   ========================================================= */

/* 🔁 Rebuild ALL bank balances from finance data */
function rebuildBankBalancesFromFinance() {
  if (!globalData.bankAccounts || !globalData.finance) return;

  // Reset all balances to 0
  globalData.bankAccounts.forEach(acc => {
    acc.balance = 0;
  });

  // Apply all finance entries
  globalData.finance.forEach(entry => {
    if (!entry.method || !entry.amount) return;

    const account = globalData.bankAccounts.find(
      acc => acc.name === entry.method
    );
    if (!account) return;

    const amount = parseFloat(entry.amount) || 0;

    if (entry.type === 'Income' || entry.type === 'Loan Received') {
      account.balance += amount;
    }

    if (
      entry.type === 'Expense' ||
      entry.type === 'Loan Given' ||
      entry.type === 'Salary' ||
      entry.type === 'Rent' ||
      entry.type === 'Utilities'
    ) {
      account.balance -= amount;
    }
  });

  saveToStorage(true);
  updateDashboardBankBalance();

  console.log('🔄 Bank balances rebuilt from finance');
}

/* 🔃 Auto rebuild on app load */
document.addEventListener('DOMContentLoaded', () => {
  rebuildBankBalancesFromFinance();

  // ===================================
  // AUTO-POPULATE DROPDOWNS ON MODAL OPEN
  // ===================================

  console.log('🎯 Setting up dropdown auto-population...');

  // Helper function to populate transfer dropdowns
  function populateTransferDropdownsNow() {
    const fromSelect = document.getElementById('accTransferFrom');
    const toSelect = document.getElementById('accTransferTo');

    if (!fromSelect || !toSelect) return;

    fromSelect.innerHTML = '<option value="">Select Source Account</option>';
    toSelect.innerHTML = '<option value="">Select Destination Account</option>';

    const addToBoth = (value, label) => {
      [fromSelect, toSelect].forEach(select => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        select.appendChild(opt);
      });
    };

    const cashBal = parseFloat(globalData.cashBalance) || 0;
    addToBoth('Cash', `💵 Cash  —  ৳${formatNumber(cashBal)}`);
    (globalData.bankAccounts || []).forEach(b => {
      const bal = parseFloat(b.balance) || 0;
      addToBoth(b.name, `🏦 ${b.name} (${b.bankName})  —  ৳${formatNumber(bal)}`);
    });
    (globalData.mobileBanking || []).forEach(m => {
      const bal = parseFloat(m.balance) || 0;
      addToBoth(m.name, `📱 ${m.name}  —  ৳${formatNumber(bal)}`);
    });
  }

  // Helper function to populate payment method dropdowns
  function populatePaymentDropdownsNow() {
    ['studentMethodSelect', 'financeMethodSelect', 'examPaymentMethodSelect'].forEach(id => {
      const select = document.getElementById(id);
      if (!select) return;

      select.innerHTML = '<option value="">Select Payment Method</option>';

      const addOpt = (value, label) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = label;
        select.appendChild(opt);
      };

      const cashBal = parseFloat(globalData.cashBalance) || 0;
      addOpt('Cash', `💵 Cash  —  ৳${formatNumber(cashBal)}`);
      (globalData.bankAccounts || []).forEach(b => {
        const bal = parseFloat(b.balance) || 0;
        addOpt(b.name, `🏦 ${b.name}  —  ৳${formatNumber(bal)}`);
      });
      (globalData.mobileBanking || []).forEach(m => {
        const bal = parseFloat(m.balance) || 0;
        addOpt(m.name, `📱 ${m.name}  —  ৳${formatNumber(bal)}`);
      });
    });
  }

  // Expose globally
  window.populateTransferDropdownsNow = populateTransferDropdownsNow;
  window.populatePaymentDropdownsNow = populatePaymentDropdownsNow;

  // Transfer Modal
  const transferModal = document.getElementById('transferModal');
  if (transferModal) {
    transferModal.addEventListener('show.bs.modal', populateTransferDropdownsNow);
    transferModal.addEventListener('shown.bs.modal', () => {
      // Attach balance badge to From/To selects
      ['accTransferFrom', 'accTransferTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          // Remove old badge
          const old = document.getElementById(`${id}_balanceBadge`);
          if (old) old.remove();
          el.addEventListener('change', () => showMethodBalance(id));
        }
      });
    });
    console.log('✅ Transfer modal listener added');
  }

  // Student Modal
  const studentModal = document.getElementById('studentModal');
  if (studentModal) {
    studentModal.addEventListener('show.bs.modal', populatePaymentDropdownsNow);
    studentModal.addEventListener('shown.bs.modal', () => {
      attachMethodBalanceListeners();
      // Remove old badge if modal reopened
      const old = document.getElementById('studentMethodSelect_balanceBadge');
      if (old) old.remove();
    });
    console.log('✅ Student modal listener added');
  }

  // Finance Modal
  const financeModal = document.getElementById('financeModal');
  if (financeModal) {
    financeModal.addEventListener('show.bs.modal', populatePaymentDropdownsNow);
    financeModal.addEventListener('shown.bs.modal', () => {
      attachMethodBalanceListeners();
      const old = document.getElementById('financeMethodSelect_balanceBadge');
      if (old) old.remove();
    });
    console.log('✅ Finance modal listener added');
  }

  // Ledger Filter - populate when Finance tab is shown
  function populateLedgerFilter() {
    const filterSelect = document.getElementById('ledgerMethodFilter');
    if (!filterSelect) return;

    const currentVal = filterSelect.value;
    filterSelect.innerHTML = '<option value="">All Methods</option>';

    const addOpt = (value, label) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      filterSelect.appendChild(opt);
    };

    addOpt('Cash', '💵 Cash');
    (globalData.bankAccounts || []).forEach(b => addOpt(b.name, `🏦 ${b.name}`));
    (globalData.mobileBanking || []).forEach(m => addOpt(m.name, `📱 ${m.name}`));

    if (currentVal) filterSelect.value = currentVal;
  }

  // Populate ledger filter when page loads
  populateLedgerFilter();

  // Re-populate when switching to Finance tab
  const financeLink = document.querySelector('[onclick*="switchTab"][onclick*="ledger"]');
  if (financeLink) {
    financeLink.addEventListener('click', () => {
      setTimeout(populateLedgerFilter, 100);
    });
  }

  window.populateLedgerFilter = populateLedgerFilter;

  console.log('✅ Dropdown auto-population ready!');
});




// NEW: Data-only reset - keeps all settings
// DATA RESET: শুধুমাত্র Students, Employees, Finance ডাটা মুছবে
// Settings, Categories, Accounts সব থাকবে
function handleDataReset() {
  console.log("Wings Fly: Data Reset triggered");

  if (!confirm('⚠️ সতর্কতা: এটি সকল ছাত্র-ছাত্রী, কর্মচারী এবং লেনদেনের তথ্য মুছে দেবে।\n\nআপনার সেটিংস (ক্যাটাগরি, কোর্স, ব্যাংক একাউন্ট) সংরক্ষিত থাকবে।\n\nঅবশ্যই এগিয়ে যেতে চান?')) return;
  if (!confirm('⚠️ চূড়ান্ত সতর্কতা: সকল ডাটা মুছে যাবে। এগিয়ে যাবেন?')) return;

  try {
    // বর্তমান সেটিংস সংরক্ষণ
    const preservedSettings = {
      settings: window.globalData.settings || { startBalances: {}, academyName: 'Wings Fly Aviation Academy' },
      incomeCategories: window.globalData.incomeCategories || [],
      expenseCategories: window.globalData.expenseCategories || [],
      paymentMethods: window.globalData.paymentMethods || [],
      bankAccounts: window.globalData.bankAccounts || [],
      mobileBanking: window.globalData.mobileBanking || [],
      courseNames: window.globalData.courseNames || [],
      employeeRoles: window.globalData.employeeRoles || [],
      credentials: window.globalData.credentials || { username: 'admin', password: 'admin123' },
      users: window.globalData.users || []
    };

    // শুধুমাত্র ডাটা রিসেট, সেটিংস রাখা
    window.globalData = {
      ...preservedSettings,
      students: [],
      employees: [],
      finance: [],
      cashBalance: 0,
      attendance: {},
      nextId: 1001,
      examRegistrations: [],
      visitors: []
    };

    // সকল একাউন্টের ব্যালেন্স ০ করা কিন্তু একাউন্ট রাখা
    if (window.globalData.bankAccounts && Array.isArray(window.globalData.bankAccounts)) {
      window.globalData.bankAccounts.forEach(acc => acc.balance = 0);
    }
    if (window.globalData.mobileBanking && Array.isArray(window.globalData.mobileBanking)) {
      window.globalData.mobileBanking.forEach(acc => acc.balance = 0);
    }

    // Update globalData reference
    globalData = window.globalData;

    saveToStorage();
    console.log("✅ Data reset complete, settings preserved");
    alert('✅ সফল: সকল ছাত্র-ছাত্রী এবং আর্থিক তথ্য মুছে ফেলা হয়েছে।\n\nআপনার সেটিংস সংরক্ষিত আছে।');
    window.location.reload();
  } catch (err) {
    alert('ত্রুটি: ' + err.message);
    console.error(err);
  }
}


// Expose to global
window.handleDataReset = handleDataReset;

// RECALCULATE CASH BALANCE FROM TRANSACTIONS
function recalculateCashBalanceFromTransactions() {
  let calculatedCashBalance = 0;

  // Get starting balance if set in settings
  if (globalData.settings && globalData.settings.startBalances && globalData.settings.startBalances['Cash']) {
    calculatedCashBalance = parseFloat(globalData.settings.startBalances['Cash']) || 0;
  }

  // Add/subtract all Cash transactions
  const cashTransactions = (globalData.finance || []).filter(f => f.method === 'Cash');

  cashTransactions.forEach(trans => {
    const amount = parseFloat(trans.amount) || 0;

    // Income types: add to balance
    if (trans.type === 'Income' || trans.type === 'Loan Received' || trans.type === 'Transfer In') {
      calculatedCashBalance += amount;
    }
    // Expense types: subtract from balance
    else if (trans.type === 'Expense' || trans.type === 'Loan Given' || trans.type === 'Transfer Out') {
      calculatedCashBalance -= amount;
    }
  });

  // Update global cash balance
  globalData.cashBalance = calculatedCashBalance;

  // Save and refresh display
  saveToStorage();
  if (typeof renderCashBalance === 'function') renderCashBalance();

  console.log('💰 Cash balance recalculated:', calculatedCashBalance);
  return calculatedCashBalance;
}

// Expose to global
window.recalculateCashBalanceFromTransactions = recalculateCashBalanceFromTransactions;

// Expose togglePersonField globally
window.togglePersonField = togglePersonField;

// ===================================
// UNIFIED ACCOUNT SEARCH SYSTEM
// ===================================

// Global variable to store current search results (MUST be at top)
var currentSearchResults = {
  accountType: '',
  accountData: null,
  transactions: []
};

/**
 * Populate account dropdown options (flat list - no groups)
 */
function populateAccountDropdown() {
  const dropdown = document.getElementById('unifiedAccountSelect');
  if (!dropdown) return;

  let optionsHTML = '<option value="">-- Select an Account --</option>';

  // Add Cash
  optionsHTML += '<option value="cash|Cash">💵 Cash</option>';

  // Add all Bank Accounts
  (globalData.bankAccounts || []).forEach(acc => {
    optionsHTML += `<option value="bank|${acc.name}">🏦 ${acc.name}</option>`;
  });

  // Add all Mobile Banking accounts
  (globalData.mobileBanking || []).forEach(acc => {
    optionsHTML += `<option value="mobile|${acc.name}">📱 ${acc.name}</option>`;
  });

  dropdown.innerHTML = optionsHTML;
}

/**
 * Perform unified search with dropdown selection
 */
function performUnifiedSearch() {
  console.log('🔍 performUnifiedSearch called');

  const selectValue = document.getElementById('unifiedAccountSelect').value;
  const dateFrom = document.getElementById('unifiedDateFrom').value;
  const dateTo = document.getElementById('unifiedDateTo').value;

  console.log('Search values:', { selectValue, dateFrom, dateTo });

  // If no account selected, show alert
  if (!selectValue) {
    alert('⚠️ Please select an account first!');
    console.log('❌ No account selected');
    return;
  }

  // Parse selected value (format: "type|name")
  const [accountType, accountName] = selectValue.split('|');
  console.log('Account:', { accountType, accountName });

  let accountData = null;

  // Get account data based on type
  if (accountType === 'cash') {
    accountData = {
      name: 'CASH',
      balance: globalData.cashBalance || 0,
      type: 'Cash'
    };
  } else if (accountType === 'bank') {
    accountData = (globalData.bankAccounts || []).find(acc => acc.name === accountName);
  } else if (accountType === 'mobile') {
    accountData = (globalData.mobileBanking || []).find(acc => acc.name === accountName);
  }

  console.log('Account data:', accountData);

  // If no account found
  if (!accountData) {
    console.log('❌ Account not found');
    document.getElementById('unifiedSearchResults').classList.remove('d-none');
    document.getElementById('searchAccountDetails').innerHTML = `
      <div class="alert alert-warning">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Account not found
      </div>
    `;
    document.getElementById('searchTransactionHistory').classList.add('d-none');
    document.getElementById('noSearchResults').classList.remove('d-none');
    return;
  }

  // Store current search results globally
  currentSearchResults = {
    accountType: accountType,
    accountData: accountData,
    transactions: []
  };

  console.log('✅ Showing results');

  // Show results section
  document.getElementById('unifiedSearchResults').classList.remove('d-none');
  document.getElementById('noSearchResults').classList.add('d-none');
  document.getElementById('searchTransactionHistory').classList.remove('d-none');

  // Display account details
  displayAccountDetails(accountType, accountData);

  // Get and display transaction history
  const transactions = getAccountTransactions(accountType, accountData, dateFrom, dateTo);
  currentSearchResults.transactions = transactions;
  displayTransactionHistory(transactions, accountData);

  // Show success message
  if (typeof showSuccessToast === 'function') {
    showSuccessToast(`🔍 Showing results for ${accountData.name}`);
  }

  console.log('✅ Search complete:', transactions.length, 'transactions found');
}

/**
 * Display account details
 */
function displayAccountDetails(accountType, accountData) {
  let detailsHTML = '';

  if (accountType === 'cash') {
    document.getElementById('searchResultTitle').textContent = '💵 CASH';
    detailsHTML = `
      <div class="row">
        <div class="col-md-12">
          <div class="card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <div class="card-body text-white">
              <h4 class="fw-bold">💵 CASH</h4>
              <h2 class="fw-bold">৳${formatNumber(accountData.balance)}</h2>
              <p class="mb-0 opacity-75">Physical cash on hand</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (accountType === 'bank') {
    document.getElementById('searchResultTitle').textContent = `🏦 ${accountData.name}`;
    detailsHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="card bg-primary text-white">
            <div class="card-body">
              <h5 class="fw-bold">🏦 ${accountData.name}</h5>
              <p class="mb-1"><strong>Bank:</strong> ${accountData.bankName || 'N/A'}</p>
              <p class="mb-1"><strong>Branch:</strong> ${accountData.branch || 'N/A'}</p>
              <p class="mb-1"><strong>Account No:</strong> ${accountData.accountNo || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h6 class="opacity-75">Current Balance</h6>
              <h2 class="fw-bold">৳${formatNumber(accountData.balance || 0)}</h2>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (accountType === 'mobile') {
    document.getElementById('searchResultTitle').textContent = `📱 ${accountData.name}`;
    detailsHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="card bg-success text-white">
            <div class="card-body">
              <h5 class="fw-bold">📱 ${accountData.name}</h5>
              <p class="mb-1"><strong>Account No:</strong> ${accountData.accountNo || 'N/A'}</p>
              <p class="mb-0"><strong>Type:</strong> Mobile Banking</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card bg-info text-white">
            <div class="card-body">
              <h6 class="opacity-75">Current Balance</h6>
              <h2 class="fw-bold">৳${formatNumber(accountData.balance || 0)}</h2>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  document.getElementById('searchAccountDetails').innerHTML = detailsHTML;
}

/**
 * Get transactions for an account
 * FIXED: Now checks both 'method' and 'paymentMethod' fields
 */
function getAccountTransactions(accountType, accountData, dateFrom, dateTo) {
  let transactions = [];
  const accountName = accountType === 'cash' ? 'Cash' : accountData.name;

  // Filter finance records by payment method
  transactions = (globalData.finance || []).filter(record => {
    // Check if payment method matches
    // FIX: Check both 'method' and 'paymentMethod' fields for compatibility
    const paymentMethod = record.paymentMethod || record.method;
    const matchesAccount = paymentMethod === accountName;

    if (!matchesAccount) return false;

    // Apply date filter if provided
    if (dateFrom || dateTo) {
      const recordDate = record.date;
      if (dateFrom && recordDate < dateFrom) return false;
      if (dateTo && recordDate > dateTo) return false;
    }

    return true;
  });

  // Sort by date (newest first)
  transactions.sort((a, b) => {
    const dateA = new Date(a.date + ' ' + (a.time || '00:00'));
    const dateB = new Date(b.date + ' ' + (b.time || '00:00'));
    return dateB - dateA;
  });

  return transactions;
}

/**
 * Display transaction history
 */
function displayTransactionHistory(transactions, accountData) {
  const tbody = document.getElementById('searchTransactionBody');

  if (transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No transactions found</td></tr>';
    document.getElementById('searchTotalAmount').textContent = '৳0';
    return;
  }

  let html = '';
  let runningBalance = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  // Calculate running balance from oldest to newest
  const reversedTransactions = [...transactions].reverse();

  reversedTransactions.forEach(record => {
    const amount = parseFloat(record.amount) || 0;

    // Check if this is an incoming transaction (positive)
    const isPositive = record.type === 'Income' ||
      record.type === 'Loan Received' ||
      record.type === 'Transfer In';

    if (isPositive) {
      runningBalance += amount;
      totalIncome += amount;
    } else {
      runningBalance -= amount;
      totalExpense += amount;
    }
  });

  // Now display from newest to oldest
  transactions.forEach(record => {
    const amount = parseFloat(record.amount) || 0;

    // Check if this is an incoming transaction (positive)
    const isIncome = record.type === 'Income' ||
      record.type === 'Loan Received' ||
      record.type === 'Transfer In';

    const amountClass = isIncome ? 'text-success' : 'text-danger';
    const amountSign = isIncome ? '+' : '-';

    html += `
      <tr>
        <td>${record.date || ''}</td>
        <td>
          <span class="badge ${isIncome ? 'bg-success' : 'bg-danger'}">
            ${record.type || 'N/A'}
          </span>
        </td>
        <td>${record.category || 'N/A'}</td>
        <td>
          <small>${record.details || 'N/A'}</small>
          ${record.receivedFrom ? `<br><small class="text-muted">From: ${record.receivedFrom}</small>` : ''}
          ${record.paidTo ? `<br><small class="text-muted">To: ${record.paidTo}</small>` : ''}
        </td>
        <td class="text-end ${amountClass} fw-bold">
          ${amountSign}৳${formatNumber(amount)}
        </td>
        <td class="text-end">
          ৳${formatNumber(runningBalance)}
        </td>
      </tr>
    `;

    // Update running balance for next row
    const isPositiveForBalance = record.type === 'Income' ||
      record.type === 'Loan Received' ||
      record.type === 'Transfer In';

    if (isPositiveForBalance) {
      runningBalance -= amount;
    } else {
      runningBalance += amount;
    }
  });

  tbody.innerHTML = html;

  // Update summary
  const netAmount = totalIncome - totalExpense;
  const summaryClass = netAmount >= 0 ? 'text-success' : 'text-danger';
  document.getElementById('searchTotalAmount').innerHTML = `
    <span class="${summaryClass}">৳${formatNumber(Math.abs(netAmount))}</span>
    <br>
    <small class="text-success">+৳${formatNumber(totalIncome)}</small> /
    <small class="text-danger">-৳${formatNumber(totalExpense)}</small>
  `;
}

/**
 * Clear unified search
 */
function clearUnifiedSearch() {
  document.getElementById('unifiedAccountSelect').value = '';
  document.getElementById('unifiedDateFrom').value = '';
  document.getElementById('unifiedDateTo').value = '';
  document.getElementById('unifiedSearchResults').classList.add('d-none');
  currentSearchResults = {
    accountType: '',
    accountData: null,
    transactions: []
  };
}

// ===================================
// EXPORT FUNCTIONS (PDF, Excel, Print)
// ===================================

/**
 * Export account report to PDF
 */
function exportAccountToPDF() {
  if (!currentSearchResults.accountData) {
    alert('No account selected!');
    return;
  }

  const { accountType, accountData, transactions } = currentSearchResults;
  const dateFrom = document.getElementById('unifiedDateFrom').value;
  const dateTo = document.getElementById('unifiedDateTo').value;

  // Create PDF content
  let pdfContent = `
Account Report
===============

Account: ${accountData.name}
${accountType === 'bank' ? `Bank: ${accountData.bankName}\nBranch: ${accountData.branch}\nAccount No: ${accountData.accountNo}` : ''}
${accountType === 'mobile' ? `Account No: ${accountData.accountNo}` : ''}
Current Balance: ৳${formatNumber(accountData.balance || 0)}

${dateFrom || dateTo ? `Date Range: ${dateFrom || 'Beginning'} to ${dateTo || 'Today'}\n` : ''}

Transaction History
==================

`;

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(record => {
    const amount = parseFloat(record.amount) || 0;
    if (record.type === 'Income') totalIncome += amount;
    else totalExpense += amount;

    pdfContent += `
Date: ${record.date}
Type: ${record.type}
Category: ${record.category}
Amount: ${record.type === 'Income' ? '+' : '-'}৳${formatNumber(amount)}
Details: ${record.details || 'N/A'}
${record.receivedFrom ? `From: ${record.receivedFrom}` : ''}
${record.paidTo ? `To: ${record.paidTo}` : ''}
-------------------
`;
  });

  pdfContent += `
Summary
=======
Total Income: ৳${formatNumber(totalIncome)}
Total Expense: ৳${formatNumber(totalExpense)}
Net: ৳${formatNumber(totalIncome - totalExpense)}
`;

  // Download as text file (you can integrate jsPDF library for actual PDF)
  const blob = new Blob([pdfContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${accountData.name}_Report_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showSuccessToast('📄 Report downloaded!');
}

/**
 * Export account report to Excel
 */
function exportAccountToExcel() {
  if (!currentSearchResults.accountData) {
    alert('No account selected!');
    return;
  }

  const { accountData, transactions } = currentSearchResults;

  // Create CSV content
  let csvContent = 'Date,Type,Category,Details,Amount,From/To\n';

  transactions.forEach(record => {
    const amount = parseFloat(record.amount) || 0;
    const sign = record.type === 'Income' ? '+' : '-';
    const person = record.receivedFrom || record.paidTo || '';

    csvContent += `${record.date},"${record.type}","${record.category}","${record.details || ''}","${sign}${amount}","${person}"\n`;
  });

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${accountData.name}_Transactions_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showSuccessToast('📊 Excel file downloaded!');
}

/**
 * Print account report
 */
function printAccountReport() {
  if (!currentSearchResults.accountData) {
    alert('No account selected!');
    return;
  }

  const { accountType, accountData, transactions } = currentSearchResults;
  const dateFrom = document.getElementById('unifiedDateFrom').value;
  const dateTo = document.getElementById('unifiedDateTo').value;

  // Create print window
  const printWindow = window.open('', '_blank');

  let printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${accountData.name} - Account Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
        .info { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #667eea; color: white; }
        .income { color: green; font-weight: bold; }
        .expense { color: red; font-weight: bold; }
        .summary { background: #e3f2fd; padding: 15px; margin-top: 20px; border-radius: 8px; }
        @media print {
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${accountData.name} - Transaction Report</h1>
      
      <div class="info">
        <strong>Account:</strong> ${accountData.name}<br>
        ${accountType === 'bank' ? `<strong>Bank:</strong> ${accountData.bankName}<br><strong>Branch:</strong> ${accountData.branch}<br><strong>Account No:</strong> ${accountData.accountNo}<br>` : ''}
        ${accountType === 'mobile' ? `<strong>Account No:</strong> ${accountData.accountNo}<br>` : ''}
        <strong>Current Balance:</strong> ৳${formatNumber(accountData.balance || 0)}<br>
        ${dateFrom || dateTo ? `<strong>Date Range:</strong> ${dateFrom || 'Beginning'} to ${dateTo || 'Today'}<br>` : ''}
        <strong>Report Date:</strong> ${new Date().toLocaleDateString()}
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Category</th>
            <th>Details</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
  `;

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(record => {
    const amount = parseFloat(record.amount) || 0;
    const isIncome = record.type === 'Income';
    if (isIncome) totalIncome += amount;
    else totalExpense += amount;

    printContent += `
      <tr>
        <td>${record.date}</td>
        <td>${record.type}</td>
        <td>${record.category}</td>
        <td>${record.details || 'N/A'}${record.receivedFrom ? '<br>From: ' + record.receivedFrom : ''}${record.paidTo ? '<br>To: ' + record.paidTo : ''}</td>
        <td class="${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}৳${formatNumber(amount)}</td>
      </tr>
    `;
  });

  printContent += `
        </tbody>
      </table>

      <div class="summary">
        <strong>Summary:</strong><br>
        Total Income: <span class="income">৳${formatNumber(totalIncome)}</span><br>
        Total Expense: <span class="expense">৳${formatNumber(totalExpense)}</span><br>
        <strong>Net Amount: ৳${formatNumber(totalIncome - totalExpense)}</strong>
      </div>

      <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">Print</button>
    </body>
    </html>
  `;

  printWindow.document.write(printContent);
  printWindow.document.close();
}

// Expose functions globally for Sync System
window.performUnifiedSearch = performUnifiedSearch;
window.clearUnifiedSearch = clearUnifiedSearch;
window.populateAccountDropdown = populateAccountDropdown;
window.exportAccountToPDF = exportAccountToPDF;
window.exportAccountToExcel = exportAccountToExcel;
window.printAccountReport = printAccountReport;

// Core UI Refresh Functions for Auto-Sync
window.renderFullUI = function () {
  console.log('🔄 Global UI Refresh Triggered');
  if (typeof render === 'function') render(window.globalData.students || []);
  if (typeof renderLedger === 'function') renderLedger(window.globalData.finance || []);
  if (typeof updateGlobalStats === 'function') updateGlobalStats();
  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderCashBalance === 'function') renderCashBalance();
  if (typeof renderRecentAdmissions === 'function') renderRecentAdmissions();
  if (typeof updateGrandTotal === 'function') updateGrandTotal();
};

// Auto-populate dropdown when data loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(populateAccountDropdown, 1000);
    setTimeout(attachMethodBalanceListeners, 1200);
  });
} else {
  setTimeout(populateAccountDropdown, 1000);
  setTimeout(attachMethodBalanceListeners, 1200);
}

// ===================================
// PAYMENT METHOD BALANCE DISPLAY
// ===================================

function getMethodBalance(methodName) {
  if (!methodName) return null;
  if (methodName === 'Cash') {
    return { balance: parseFloat(globalData.cashBalance) || 0, type: 'cash' };
  }
  const bank = (globalData.bankAccounts || []).find(a => a.name === methodName);
  if (bank) return { balance: parseFloat(bank.balance) || 0, type: 'bank', extra: bank.bankName };
  const mobile = (globalData.mobileBanking || []).find(a => a.name === methodName);
  if (mobile) return { balance: parseFloat(mobile.balance) || 0, type: 'mobile' };
  return null;
}

function showMethodBalance(selectId) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  const badgeId = `${selectId}_balanceBadge`;
  let badge = document.getElementById(badgeId);

  const val = sel.value;
  const info = getMethodBalance(val);

  if (!info) {
    if (badge) badge.remove();
    return;
  }

  if (!badge) {
    badge = document.createElement('div');
    badge.id = badgeId;
    badge.style.cssText = `
      margin-top: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    `;
    sel.parentNode.appendChild(badge);
  }

  const colorMap = { cash: '#00ff88', bank: '#00d9ff', mobile: '#ff2d95' };
  const bgMap   = { cash: 'rgba(0,255,136,0.12)', bank: 'rgba(0,217,255,0.12)', mobile: 'rgba(255,45,149,0.12)' };
  const iconMap = { cash: '💵', bank: '🏦', mobile: '📱' };
  const borderMap = { cash: 'rgba(0,255,136,0.35)', bank: 'rgba(0,217,255,0.35)', mobile: 'rgba(255,45,149,0.35)' };

  const c = info.type;
  badge.style.background = bgMap[c];
  badge.style.border = `1px solid ${borderMap[c]}`;
  badge.style.color = colorMap[c];
  badge.innerHTML = `
    <span>${iconMap[c]}</span>
    <span>Available Balance:</span>
    <span style="font-size:0.95rem; letter-spacing:0.3px;">৳${formatNumber(info.balance)}</span>
  `;
}

function attachMethodBalanceListeners() {
  const targets = [
    'studentMethodSelect',
    'financeMethodSelect',
    'editTransMethodSelect',
    'examPaymentMethodSelect',
    'accTransferFrom',
    'accTransferTo'
  ];
  targets.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      // Remove duplicate listeners by replacing with clone
      const newEl = el.cloneNode(true);
      el.parentNode.replaceChild(newEl, el);
      newEl.addEventListener('change', () => showMethodBalance(id));
    }
  });
}

window.showMethodBalance = showMethodBalance;
window.attachMethodBalanceListeners = attachMethodBalanceListeners;


// ===================================
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

  if (!name)      { showErrorToast('❌ Visitor name is required.'); return; }
  if (!phone)     { showErrorToast('❌ Phone number is required.'); return; }
  if (!visitDate) { showErrorToast('❌ Visit date is required.'); return; }

  const editIndex = data.visitorRowIndex !== '' && data.visitorRowIndex !== undefined
    ? parseInt(data.visitorRowIndex) : -1;

  const visitor = {
    name:     name,
    phone:    phone,
    course:   data.interestedCourse || '',
    date:     visitDate,
    remarks:  (data.visitorRemarks || '').trim(),
    addedAt:  new Date().toISOString()
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

  const q      = (document.getElementById('visitorSearchInput')?.value || '').toLowerCase().trim();
  const start  = document.getElementById('visitorStartDate')?.value || '';
  const end    = document.getElementById('visitorEndDate')?.value   || '';

  let list = (window.globalData.visitors || []).slice();

  // Filter
  if (q) {
    list = list.filter(v =>
      (v.name  || '').toLowerCase().includes(q) ||
      (v.phone || '').toLowerCase().includes(q) ||
      (v.course|| '').toLowerCase().includes(q)
    );
  }
  if (start) list = list.filter(v => v.date >= start);
  if (end)   list = list.filter(v => v.date <= end);

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
  if (s)  s.value  = '';
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

  form.elements['visitorName'].value    = v.name    || '';
  form.elements['visitorPhone'].value   = v.phone   || '';
  form.elements['visitDate'].value      = v.date    || '';
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
window.handleVisitorSubmit  = handleVisitorSubmit;
window.renderVisitors       = renderVisitors;
window.searchVisitors       = searchVisitors;
window.clearVisitorFilters  = clearVisitorFilters;
window.editVisitor          = editVisitor;
window.deleteVisitor        = deleteVisitor;


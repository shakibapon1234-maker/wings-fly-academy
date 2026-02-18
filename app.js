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
  toast.innerHTML = `<span>❌</span> ${message}`;
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

  if (!confirm('⚠️ চূড়ান্ত সতর্কতা: এটি সম্পূর্ণ সিস্টেম রিসেট করবে!\n\n- সকল ছাত্র-ছাত্রী\n- সকল লেনদেন\n- সকল ব্যাংক একাউন্ট\n- সকল সেটিংস\n- সকল ক্যাটাগরি\n- সকল কোর্স\n\nসবকিছ মুছে যাবে। নিশ্চিত?')) return;
  if (!confirm('⚠️ চূড়ান্ত নিশ্চিতকরণ: সবকিছু একদম শূন্য হয়ে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না। এগিয়ে যাবেন?')) return;

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
            console.warn('⚠️ Initial sync failed, will retry via auto-sync');
          }
        } catch (error) {
          console.error('❌ Initial sync error:', error);
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
      showSuccessToast('⏸️ Auto-sync disabled');
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
      console.log("⚠️ User not found locally, checking cloud...");
      await pullDataFromCloud(false); // Silently pull
      validUser = globalData.users.find(u => u.username === username && u.password === password);
    }

    // C. EMERGENCY FALLBACK: Always allow default admin if users list is broken or out of sync
    if (!validUser && username === 'admin' && (password === 'admin123' || password === '11108022ashu')) {
      console.warn("⚠️ Using emergency admin fallback");
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

  // Convert id to both types for safe comparison (handles string/number mismatch)
  const idNum = Number(id);
  const idStr = String(id);

  const txToDelete = globalData.finance.find(f => f.id == id || Number(f.id) === idNum || String(f.id) === idStr);
  if (!txToDelete) {
    showErrorToast('Transaction not found. Please refresh and try again.');
    return;
  }

  if (typeof updateAccountBalance === "function") {
    updateAccountBalance(txToDelete.method, txToDelete.amount, txToDelete.type, false);
  }

  globalData.finance = globalData.finance.filter(f => f.id != id && Number(f.id) !== idNum);
  saveToStorage();

  showSuccessToast('Transaction deleted successfully!');

  // Refresh ledger if open
  const activeTab = localStorage.getItem('wingsfly_active_tab');
  if (activeTab === 'ledger') {
    renderLedger(globalData.finance);
  }

  updateGlobalStats();

  // Refresh Account Details modal if open
  const accModal = document.getElementById('accountDetailsModal');
  if (accModal && bootstrap.Modal.getInstance(accModal)) {
    renderAccountDetails();
  }

  // Refresh finance modal if open
  const finModal = document.getElementById('financeModal');
  if (finModal && bootstrap.Modal.getInstance(finModal)) {
    renderLedger(globalData.finance);
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
                            <td style="padding: 5px 10px; border: 1px solid #e2e8f0;">â””â”└─ Payment received on ${inst.date} ${inst.isMigrated ? '(Adm. Installment)' : ''}</td>
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

  if (!confirm('⚠️ WARNING: Importing a backup will OVERWRITE all current data on this computer and the Cloud. Proceed?')) {
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

function generateCertificate() {
  if (!currentStudentForProfile) { showErrorToast('No student selected.'); return; }
  const s           = currentStudentForProfile;
  const academyName = "Wings Fly Aviation & Career Development Academy";
  const selectedDesign = globalData.settings?.certDesign || 'navy';
  const certHtml = selectedDesign === 'cosmos'
    ? buildCertHtml_Cosmos(s,'','','','',academyName)
    : buildCertHtml_Navy(s,'','','','',academyName);
  const bgColor = selectedDesign === 'cosmos' ? '#05081a' : '#060d1f';

  // Preview in modal
  const wrapper = document.getElementById('certPreviewWrapper');
  if (!wrapper) { alert('Please refresh the page.'); return; }
  wrapper.innerHTML = certHtml;
  const certEl = wrapper.firstElementChild;
  const scale  = Math.min((window.innerWidth - 80) / 1056, 1);
  certEl.style.transform = 'scale(' + scale + ')';
  certEl.style.transformOrigin = 'top left';
  certEl.style.display = 'block';
  wrapper.style.width    = Math.round(1056 * scale) + 'px';
  wrapper.style.height   = Math.round(816  * scale) + 'px';
  wrapper.style.overflow = 'hidden';
  new bootstrap.Modal(document.getElementById('certPreviewModal')).show();

  // Wire Download button
  const dlBtn  = document.getElementById('certDownloadBtn');
  const newBtn = dlBtn.cloneNode(true);
  dlBtn.parentNode.replaceChild(newBtn, dlBtn);
  newBtn.addEventListener('click', function () {
    const fname = 'Certificate_' + (s.name||'Student').replace(/[^a-z0-9]/gi,'_');
    const pw = window.open('', '_blank', 'width=1120,height=900,scrollbars=no');
    if (!pw) { alert('Popup blocked!\nPlease allow popups for this site, then try again.'); return; }
    pw.document.write(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + fname + '</title>' +
      '<style>' +
      '* {margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
      'html,body{width:1056px;height:816px;overflow:hidden;background:' + bgColor + '!important;' +
        '-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
      '#_pb{position:fixed;top:12px;right:12px;z-index:9999;padding:12px 30px;' +
        'background:#FFD700;color:#000;border:none;border-radius:8px;' +
        'font-size:15px;font-weight:900;cursor:pointer;}' +
      '@media print{' +
        '@page{size:A4 landscape;margin:0;}' +
        'html,body{width:297mm;height:210mm;background:' + bgColor + '!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
        '#_pb{display:none!important;}' +
        'div,svg,path,rect,circle,text{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}' +
      '}' +
      '</style></head><body>' +
      '<button id="_pb" onclick="window.print()">🖨️ Save as PDF</button>' +
      certHtml + '</body></html>'
    );
    pw.document.close();
    pw.focus();
    showSuccessToast('✅ Opened! Click the yellow button to save PDF.');
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
  btn.innerHTML = '⏳ Generating...';
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
    globalData.employees = globalData.employees.filter(e => String(e.id) !== String(id));

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
          icon: '⚠️',
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
      icon: '👤',
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

function buildCertHtml_Navy(s, _a, _b, _c, _d, academyName) {
  const LB = "data:image/png;base64,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";
  const LG = "data:image/png;base64,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";
  const SF = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABgAAAAQACAYAAAAncZJCAAB+4ElEQVR4nOzdd7w0ZXk//g+WRKOJxsRo7DHFxOg3fjVqjH4TY2KK6QawoAio2EBUBAULNrBgQTQoKoggFuzEGgwGe8NGBDGgBqOiKIqCBcvz++M+5/fs2bM7O1tmy73v9+t1Xs+zM7Mz19mzu7N7XXNf9y47duwIAAAAAABQlyssOgAAAAAAAGD2FAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAA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ACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgDw/7VnBzIAAAAAg/yt7/GVRgAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGAoy1HvTqPqV9QAAAAASUVORK5CYII=";
  const SS = "data:image/png;base64,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";
  const nm = (s.name||'Student Name').toUpperCase();
  const bt = s.batch||'N/A';
  const id = s.studentId||'-';
  const cr = (s.course||'COURSE').toUpperCase();
  return '<div style="width:1056px;height:816px;position:relative;background:#060d1f;font-family:Arial,Helvetica,sans-serif;color:#fff;overflow:hidden;box-sizing:border-box;border:12px solid #FFD700;display:block;">' +
  '<svg style="position:absolute;top:0;left:0;width:1056px;height:816px;" viewBox="0 0 1056 816" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="nc1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#005Bea" stop-opacity="0.7"/><stop offset="100%" stop-color="#00C6FB" stop-opacity="0.7"/></linearGradient>' +
    '<linearGradient id="nc2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00e5ff" stop-opacity="0.5"/><stop offset="100%" stop-color="#005Bea" stop-opacity="0.5"/></linearGradient>' +
  '</defs>' +
    '<path d="M0,0 L620,0 C330,8 95,290 0,630 Z" fill="url(#nc1)" opacity="0.20"/>' +
    '<path d="M0,0 L430,0 C215,8 55,200 0,430 Z" fill="url(#nc2)" opacity="0.28"/>' +
    '<path d="M1056,816 L530,816 C760,800 1050,540 1056,310 Z" fill="url(#nc1)" opacity="0.20"/>' +
    '<path d="M1056,816 L640,816 C820,800 1050,600 1056,430 Z" fill="url(#nc2)" opacity="0.28"/>' +
  '</svg>' +
  '<div style="position:absolute;top:32px;left:32px;right:32px;bottom:32px;border:2px solid rgba(255,215,0,0.5);"></div>' +
  '<div style="position:absolute;top:20px;left:20px;width:30px;height:30px;border-top:3px solid #FFD700;border-left:3px solid #FFD700;"></div>' +
  '<div style="position:absolute;top:20px;right:20px;width:30px;height:30px;border-top:3px solid #FFD700;border-right:3px solid #FFD700;"></div>' +
  '<div style="position:absolute;bottom:20px;left:20px;width:30px;height:30px;border-bottom:3px solid #FFD700;border-left:3px solid #FFD700;"></div>' +
  '<div style="position:absolute;bottom:20px;right:20px;width:30px;height:30px;border-bottom:3px solid #FFD700;border-right:3px solid #FFD700;"></div>' +
  '<div style="position:absolute;top:0;left:0;right:0;bottom:0;padding:42px 65px;box-sizing:border-box;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,215,0,0.3);border-radius:8px;padding:8px 16px;"><img src="' + LB + '" style="height:44px;width:auto;display:block;"></div>' +
      '<div style="flex:1;text-align:center;padding:0 20px;">' +
        '<div style="font-size:9.5px;letter-spacing:4px;color:#FFD700;text-transform:uppercase;font-weight:700;">Wings Fly Aviation &amp; Career Development Academy</div>' +
        '<div style="font-size:8px;letter-spacing:2px;color:rgba(0,229,255,0.55);margin-top:3px;text-transform:uppercase;">Dhaka, Bangladesh</div>' +
      '</div>' +
      '<div style="width:88px;height:88px;border-radius:50%;overflow:hidden;border:2.5px solid #FFD700;box-shadow:0 0 16px rgba(255,215,0,0.45);"><img src="' + LG + '" style="width:88px;height:88px;object-fit:cover;display:block;"></div>' +
    '</div>' +
    '<div style="margin:10px 0;height:1.5px;background:linear-gradient(90deg,transparent,#FFD700 30%,rgba(0,229,255,0.7) 60%,#FFD700 80%,transparent);"></div>' +
    '<div style="text-align:center;margin-top:10px;">' +
      '<div style="font-size:72px;font-weight:900;letter-spacing:7px;line-height:1;color:#00e5ff;text-shadow:0 0 25px rgba(0,229,255,0.5);">CERTIFICATE</div>' +
      '<div style="font-size:22px;font-weight:700;letter-spacing:5px;margin-top:3px;color:#FFD700;">&#10022; OF APPRECIATION &#10022;</div>' +
      '<p style="font-size:14px;margin-top:16px;color:rgba(255,255,255,0.55);font-style:italic;">This certificate is proudly presented for honorable achievement to</p>' +
      '<div style="font-size:50px;margin:9px 0 5px;color:#fff;font-weight:700;letter-spacing:2px;text-shadow:0 0 20px rgba(0,229,255,0.35);">' + nm + '</div>' +
      '<div style="width:430px;height:1.5px;background:linear-gradient(90deg,transparent,#FFD700,rgba(0,229,255,0.7),#FFD700,transparent);margin:0 auto 11px;"></div>' +
      '<div style="display:inline-block;padding:7px 28px;border:1.5px solid rgba(255,215,0,0.45);background:rgba(0,51,128,0.28);font-family:monospace;font-size:16px;font-weight:900;color:#fff;">BATCH &mdash; ' + bt + ' &nbsp;&#10022;&nbsp; STUDENT ID : ' + id + '</div>' +
      '<div style="margin-top:12px;font-size:11.5px;color:rgba(255,255,255,0.45);font-weight:700;text-transform:uppercase;line-height:1.9;">Certification On Training About The &ldquo;' + cr + '&rdquo;<br>At ' + academyName.toUpperCase() + '</div>' +
    '</div>' +
    '<div style="position:absolute;bottom:38px;left:63px;right:63px;display:flex;justify-content:space-between;align-items:flex-end;">' +
      '<div style="text-align:center;width:205px;">' +
        '<img src="' + SS + '" style="height:56px;width:auto;max-width:185px;display:block;margin:0 auto 4px;">' +
        '<div style="width:185px;height:1.5px;background:rgba(255,215,0,0.65);margin:0 auto 4px;"></div>' +
        '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#FFD700;letter-spacing:1.5px;">Course Coordinator</div>' +
        '<div style="font-size:11.5px;color:rgba(255,255,255,0.9);font-weight:600;margin-top:2px;">Shakib Ibna Mustafa</div>' +
      '</div>' +
      '<div style="text-align:center;padding-bottom:4px;"><div style="font-size:10px;color:rgba(0,229,255,0.55);font-weight:700;">wingsflyaviationacademy.com</div></div>' +
      '<div style="text-align:center;width:205px;">' +
        '<img src="' + SF + '" style="height:70px;width:auto;max-width:185px;display:block;margin:0 auto 4px;">' +
        '<div style="width:185px;height:1.5px;background:rgba(255,215,0,0.65);margin:0 auto 4px;"></div>' +
        '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#FFD700;letter-spacing:1.5px;">Chairman</div>' +
        '<div style="font-size:11.5px;color:rgba(255,255,255,0.9);font-weight:600;margin-top:2px;">Ferdous Ahmed</div>' +
      '</div>' +
    '</div>' +
  '</div></div>';
}

function buildCertHtml_Cosmos(s, _a, _b, _c, _d, academyName) {
  // Cosmos design — purple/teal theme (same structure, different colors)
  const LB = "data:image/png;base64,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";
  const LG = "data:image/png;base64,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";
  const SF = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABgAAAAQACAYAAAAncZJCAAB+4ElEQVR4nOzdd7w0ZXk//g+WRKOJxsRo7DHFxOg3fjVqjH4TY2KK6QawoAio2EBUBAULNrBgQTQoKoggFuzEGgwGe8NGBDGgBqOiKIqCBcvz++M+5/fs2bM7O1tmy73v9+t1Xs+zM7Mz19mzu7N7XXNf9y47duwIAAAAAABQlyssOgAAAAAAAGD2FAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAA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ACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgAAAAAAAFAhBQAAAAAAAKiQAgAAAAAAAFRIAQAAAAAAACqkAAAAAAAAABVSAAAAAAAAgAopAAAAAAAAQIUUAAAAAAAAoEIKAAAAAAAAUCEFAAAAAAAAqJACAAAAAAAAVEgBAAAAAAAAKqQAAAAAAAAAFVIAAAAAAACACikAAAAAAABAhRQAAAAAAACgQgoAAAAAAABQIQUAAAAAAACokAIAAAAAAABUSAEAAAAAAAAqpAAAAAAAAAAVUgAAAAAAAIAKKQAAAAAAAECFFAAAAAAAAKBCCgDw/7VnBzIAAAAAg/yt7/GVRgAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAACAIQEAAAAAAABDAgAAAAAAAIYEAAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAYEgAAAAAAADAkAAAAAAAAIAhAQAAAAAAAEMCAAAAAAAAhgQAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAABgSAAAAAAAAMCQAAAAAAAAgCEBAAAAAAAAQwIAAAAAAACGBAAAAAAAAAwJAAAAAAAAGBIAAAAAAAAwJAAAAAAAAGAoy1HvTqPqV9QAAAAASUVORK5CYII=";
  const SS = "data:image/png;base64,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";
  const nm = (s.name||'Student Name').toUpperCase();
  const bt = s.batch||'N/A';
  const id = s.studentId||'-';
  const cr = (s.course||'COURSE').toUpperCase();
  return '<div style="width:1056px;height:816px;position:relative;background:#05081a;font-family:Arial,Helvetica,sans-serif;color:#fff;overflow:hidden;box-sizing:border-box;border:12px solid #a855f7;display:block;">' +
  '<svg style="position:absolute;top:0;left:0;width:1056px;height:816px;" viewBox="0 0 1056 816" xmlns="http://www.w3.org/2000/svg"><defs>' +
    '<linearGradient id="cc1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7c3aed" stop-opacity="0.7"/><stop offset="100%" stop-color="#06b6d4" stop-opacity="0.7"/></linearGradient>' +
  '</defs>' +
    '<path d="M0,0 L620,0 C330,8 95,290 0,630 Z" fill="url(#cc1)" opacity="0.22"/>' +
    '<path d="M1056,816 L530,816 C760,800 1050,540 1056,310 Z" fill="url(#cc1)" opacity="0.22"/>' +
    '<circle cx="100" cy="100" r="180" fill="rgba(124,58,237,0.10)"/>' +
    '<circle cx="950" cy="720" r="160" fill="rgba(6,182,212,0.08)"/>' +
  '</svg>' +
  '<div style="position:absolute;top:32px;left:32px;right:32px;bottom:32px;border:2px solid rgba(168,85,247,0.5);"></div>' +
  '<div style="position:absolute;top:20px;left:20px;width:30px;height:30px;border-top:3px solid #a855f7;border-left:3px solid #a855f7;"></div>' +
  '<div style="position:absolute;top:20px;right:20px;width:30px;height:30px;border-top:3px solid #a855f7;border-right:3px solid #a855f7;"></div>' +
  '<div style="position:absolute;bottom:20px;left:20px;width:30px;height:30px;border-bottom:3px solid #a855f7;border-left:3px solid #a855f7;"></div>' +
  '<div style="position:absolute;bottom:20px;right:20px;width:30px;height:30px;border-bottom:3px solid #a855f7;border-right:3px solid #a855f7;"></div>' +
  '<div style="position:absolute;top:0;left:0;right:0;bottom:0;padding:42px 65px;box-sizing:border-box;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<div style="background:rgba(255,255,255,0.07);border:1px solid rgba(168,85,247,0.3);border-radius:8px;padding:8px 16px;"><img src="' + LB + '" style="height:44px;width:auto;display:block;"></div>' +
      '<div style="flex:1;text-align:center;padding:0 20px;">' +
        '<div style="font-size:9.5px;letter-spacing:4px;color:#a855f7;text-transform:uppercase;font-weight:700;">Wings Fly Aviation &amp; Career Development Academy</div>' +
        '<div style="font-size:8px;letter-spacing:2px;color:rgba(6,182,212,0.6);margin-top:3px;text-transform:uppercase;">Dhaka, Bangladesh</div>' +
      '</div>' +
      '<div style="width:88px;height:88px;border-radius:50%;overflow:hidden;border:2.5px solid #a855f7;box-shadow:0 0 16px rgba(168,85,247,0.45);"><img src="' + LG + '" style="width:88px;height:88px;object-fit:cover;display:block;"></div>' +
    '</div>' +
    '<div style="margin:10px 0;height:1.5px;background:linear-gradient(90deg,transparent,#a855f7 30%,rgba(6,182,212,0.7) 60%,#a855f7 80%,transparent);"></div>' +
    '<div style="text-align:center;margin-top:10px;">' +
      '<div style="font-size:72px;font-weight:900;letter-spacing:7px;line-height:1;color:#06b6d4;text-shadow:0 0 25px rgba(6,182,212,0.5);">CERTIFICATE</div>' +
      '<div style="font-size:22px;font-weight:700;letter-spacing:5px;margin-top:3px;color:#a855f7;">&#10022; OF APPRECIATION &#10022;</div>' +
      '<p style="font-size:14px;margin-top:16px;color:rgba(255,255,255,0.55);font-style:italic;">This certificate is proudly presented for honorable achievement to</p>' +
      '<div style="font-size:50px;margin:9px 0 5px;color:#fff;font-weight:700;letter-spacing:2px;">' + nm + '</div>' +
      '<div style="width:430px;height:1.5px;background:linear-gradient(90deg,transparent,#a855f7,rgba(6,182,212,0.7),#a855f7,transparent);margin:0 auto 11px;"></div>' +
      '<div style="display:inline-block;padding:7px 28px;border:1.5px solid rgba(168,85,247,0.45);background:rgba(124,58,237,0.2);font-family:monospace;font-size:16px;font-weight:900;color:#fff;">BATCH &mdash; ' + bt + ' &nbsp;&#10022;&nbsp; STUDENT ID : ' + id + '</div>' +
      '<div style="margin-top:12px;font-size:11.5px;color:rgba(255,255,255,0.45);font-weight:700;text-transform:uppercase;line-height:1.9;">Certification On Training About The &ldquo;' + cr + '&rdquo;<br>At ' + academyName.toUpperCase() + '</div>' +
    '</div>' +
    '<div style="position:absolute;bottom:38px;left:63px;right:63px;display:flex;justify-content:space-between;align-items:flex-end;">' +
      '<div style="text-align:center;width:205px;">' +
        '<img src="' + SS + '" style="height:56px;width:auto;max-width:185px;display:block;margin:0 auto 4px;">' +
        '<div style="width:185px;height:1.5px;background:rgba(168,85,247,0.65);margin:0 auto 4px;"></div>' +
        '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#a855f7;letter-spacing:1.5px;">Course Coordinator</div>' +
        '<div style="font-size:11.5px;color:rgba(255,255,255,0.9);font-weight:600;margin-top:2px;">Shakib Ibna Mustafa</div>' +
      '</div>' +
      '<div style="text-align:center;padding-bottom:4px;"><div style="font-size:10px;color:rgba(6,182,212,0.55);font-weight:700;">wingsflyaviationacademy.com</div></div>' +
      '<div style="text-align:center;width:205px;">' +
        '<img src="' + SF + '" style="height:70px;width:auto;max-width:185px;display:block;margin:0 auto 4px;">' +
        '<div style="width:185px;height:1.5px;background:rgba(168,85,247,0.65);margin:0 auto 4px;"></div>' +
        '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:#a855f7;letter-spacing:1.5px;">Chairman</div>' +
        '<div style="font-size:11.5px;color:rgba(255,255,255,0.9);font-weight:600;margin-top:2px;">Ferdous Ahmed</div>' +
      '</div>' +
    '</div>' +
  '</div></div>';
}

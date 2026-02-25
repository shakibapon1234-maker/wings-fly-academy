// ===================================

// ===================================
// STUDENT MANAGEMENT
// Moved to: sections/student-management.js
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
    employeeRoles: [],
    deletedItems: [],
    activityHistory: []
  };
}

// সবসময় নিশ্চিত করো
if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
if (!window.globalData.activityHistory) window.globalData.activityHistory = [];

// Global Chart instances to prevent initialization errors
window.financeChartInstance = null;
window.studentStatusChart = null;
window.paymentMethodChart = null;

console.log('📦 Global Data Initialized.');

// ===================================
// ACTIVITY HISTORY & TRASH SYSTEM
// ===================================

// Log an activity to history

// activity-log — extracted to sections/activity-log.js

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
  // ✅ FIX: base64 return করো (key নয়) — যাতে img src সরাসরি কাজ করে
  // এতে: cloud sync এ photo যাবে, multi-device এ দেখা যাবে, ERR_FILE_NOT_FOUND বন্ধ
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const originalBase64 = e.target.result;

      // ✅ Photo resize: max 400px, quality 0.75 → ~30-50KB
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 400;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const resizedBase64 = canvas.toDataURL('image/jpeg', 0.75);

        // IndexedDB তেও backup রাখো (backward compatibility)
        const photoKey = `photo_${studentId}`;
        initPhotoDB().then(db => {
          const tx = db.transaction([PHOTO_STORE_NAME], 'readwrite');
          tx.objectStore(PHOTO_STORE_NAME).put(resizedBase64, photoKey);
        }).catch(() => { });

        console.log(`✅ Photo processed: ${Math.round(resizedBase64.length / 1024)}KB`);
        resolve(resizedBase64); // ✅ base64 return করো, key নয়
      };
      img.onerror = () => resolve(originalBase64); // resize fail হলে original
      img.src = originalBase64;
    };
    reader.onerror = () => reject('File read error');
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

  // ✅ NEW FORMAT: base64 সরাসরি থাকলে সেটাই return করো
  if (photoKey.startsWith('data:image')) {
    if (imgElementId) {
      const img = document.getElementById(imgElementId);
      if (img) { img.src = photoKey; img.style.objectFit = 'cover'; }
    }
    return photoKey;
  }

  // ✅ OLD KEY FORMAT (photo_WF-xxxxx): IndexedDB থেকে load + auto-migrate
  initPhotoDB().then(db => {
    const transaction = db.transaction([PHOTO_STORE_NAME], 'readonly');
    const request = transaction.objectStore(PHOTO_STORE_NAME).get(photoKey);
    request.onsuccess = () => {
      if (request.result) {
        if (imgElementId) {
          const img = document.getElementById(imgElementId);
          if (img) { img.src = request.result; img.style.objectFit = 'cover'; }
        }
        // ✅ MIGRATE: student.photo কে base64 এ update করো (একবারই হবে)
        const students = window.globalData && window.globalData.students;
        if (students) {
          const s = students.find(st => st.photo === photoKey);
          if (s) {
            s.photo = request.result;
            localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
            if (typeof window.scheduleSyncPush === 'function') {
              window.scheduleSyncPush('Photo key→base64 migration');
            }
            console.log('✅ Photo migrated to base64:', photoKey);
          }
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

  const amt = parseFloat(amount) || 0;
  const multiplier = isAddition ? 1 : -1;

  // Types that ADD to balance (money coming IN to the account)
  // Note: Loan Receiving = money received as loan (adds to balance, but NOT income)
  const moneyInTypes = ['Income', 'Transfer In', 'Loan Receiving', 'Loan Received'];
  // Types that SUBTRACT from balance (money going OUT of the account)
  // Note: Loan Giving = money given as loan (removes from balance, but NOT expense)
  const moneyOutTypes = ['Expense', 'Transfer Out', 'Loan Giving', 'Loan Given'];

  // Handle Cash
  if (method === 'Cash') {
    if (typeof globalData.cashBalance === 'undefined') {
      globalData.cashBalance = 0;
    }

    if (moneyInTypes.includes(type)) {
      globalData.cashBalance += amt * multiplier;
    } else if (moneyOutTypes.includes(type)) {
      globalData.cashBalance -= amt * multiplier;
    }

    // Update UI if cash balance element exists
    if (typeof renderCashBalance === 'function') {
      renderCashBalance();
    }
    return;
  }

  // Check in bank accounts first, then mobile banking
  let account = (window.globalData.bankAccounts || []).find(acc => acc.name === method);
  if (!account) {
    account = (window.globalData.mobileBanking || []).find(acc => acc.name === method);
  }

  if (!account) return;

  if (moneyInTypes.includes(type)) {
    account.balance = (parseFloat(account.balance) || 0) + (amt * multiplier);
  } else if (moneyOutTypes.includes(type)) {
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
      credentials: { username: 'admin', password: 'e7d3bfb67567c3d94bcecb2ce65ef146eac83e50dc3f3b89e81bb647a8bada4c' }  // default — change via Settings
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
if (typeof checkPersonBalance === 'function') window.checkPersonBalance = checkPersonBalance;
// handleSettingsSubmit exposed in sections/accounts-ui.js
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
  // Create gradient fills for bar chart
  const incomeGradient = financeCtx.createLinearGradient(0, 0, 0, 320);
  incomeGradient.addColorStop(0, 'rgba(0, 200, 255, 0.95)');
  incomeGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.85)');
  incomeGradient.addColorStop(1, 'rgba(123, 47, 247, 0.7)');

  const expenseGradient = financeCtx.createLinearGradient(0, 0, 0, 320);
  expenseGradient.addColorStop(0, 'rgba(255, 80, 80, 0.9)');
  expenseGradient.addColorStop(0.5, 'rgba(200, 40, 80, 0.7)');
  expenseGradient.addColorStop(1, 'rgba(100, 0, 50, 0.5)');

  financeChartInstance = new Chart(financeCtx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: incomeGradient,
          borderRadius: 10,
          barThickness: 22,
          borderWidth: 0,
          borderSkipped: false,
        },
        {
          label: 'Expense',
          data: expenseData,
          backgroundColor: expenseGradient,
          borderRadius: 10,
          barThickness: 22,
          borderWidth: 0,
          borderSkipped: false,
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
window.downloadLedgerExcel = downloadLedgerExcel;
window.mailLedgerReport = mailLedgerReport;
window.downloadAccountDetailsExcel = downloadAccountDetailsExcel;
window.mailAccountDetailsReport = mailAccountDetailsReport;
window.exportData = exportData;
window.importData = importData;
window.handleImportFile = handleImportFile;

// ⚠️ NOTE: globalData is initialized at the top of this file (line 10)
// using localStorage data. Do NOT re-initialize here — it would
// overwrite saved data with empty arrays every time the script loads.
// globalData is already set via: if (typeof window.globalData === 'undefined') { ... }
// at the very top of app.js. This block has been intentionally removed.

let currentStudentForProfile = null;

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

    // Cloud sync is handled automatically by supabase-sync-SMART-V28.js
    // No duplicate sync call needed here.
    console.log('🔄 Cloud sync handled by Smart Sync V28 system.');
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
      // Snapshot list refresh
      setTimeout(function () {
        if (typeof renderSnapshotList === 'function') renderSnapshotList();
      }, 200);
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
    // Arrays নিশ্চিত করো
    if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
    if (!window.globalData.activityHistory) window.globalData.activityHistory = [];

    // Backup রাখো যাতে cloud pull এ হারিয়ে না যায়
    localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(window.globalData.deletedItems));
    localStorage.setItem('wingsfly_activity_backup', JSON.stringify(window.globalData.activityHistory));

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
      if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
      if (!window.globalData.activityHistory) window.globalData.activityHistory = [];
      ensureStudentIds();

      if (!window.globalData.employees) window.globalData.employees = [];
      ensureStudentIds();

      // Ensure users array always exists with default admin
      if (!window.globalData.users || !Array.isArray(window.globalData.users) || window.globalData.users.length === 0) {
        window.globalData.users = [
          { username: 'admin', password: '0a041b9462caa4a31bac3567e0b6e6fd9100787db2ab433d96f6d178cabfce90', role: 'admin', name: 'Admin' }
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
        users: [{ username: 'admin', password: 'e7d3bfb67567c3d94bcecb2ce65ef146eac83e50dc3f3b89e81bb647a8bada4c', role: 'admin', name: 'Super Admin' }]
      };
      if (typeof globalData !== 'undefined') globalData = window.globalData;
    }

    // BACKWARD COMPATIBILITY: Ensure users array exists
    if (!globalData.users) {
      globalData.users = [
        {
          username: (globalData.credentials && globalData.credentials.username) || 'admin',
          password: (globalData.credentials && globalData.credentials.password) || 'e7d3bfb67567c3d94bcecb2ce65ef146eac83e50dc3f3b89e81bb647a8bada4c',
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
      globalData.credentials = { username: 'admin', password: 'e7d3bfb67567c3d94bcecb2ce65ef146eac83e50dc3f3b89e81bb647a8bada4c' };
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

// SHA-256 Password Hashing (Browser Native — no library needed)

// auth — extracted to sections/auth.js


// dashboard-stats.js — extracted to sections/dashboard-stats.js

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


// ===================================
// STUDENT ID CARD GENERATOR
// ===================================

// ===================================
// STUDENT ID CARD GENERATOR
// ===================================


// id-card — extracted to sections/id-card.js

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
            <div class="fw-bold" style="color:#ffd54f;">${s.name}</div>
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
// ===================================
// EMPLOYEE MANAGEMENT
// Moved to: sections/employee-management.js
// ===================================

// ===================================
// NOTIFICATION CENTER
// ===================================


// notifications — extracted to sections/notifications.js

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
      credentials: window.globalData.credentials || { username: 'admin', password: 'e7d3bfb67567c3d94bcecb2ce65ef146eac83e50dc3f3b89e81bb647a8bada4c' },
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
  // Note: Loan Received/Giving DO affect cash balance (physical cash moves)
  // But they are NOT counted as income/expense in stats
  const cashTransactions = (globalData.finance || []).filter(f => f.method === 'Cash');

  cashTransactions.forEach(trans => {
    const amount = parseFloat(trans.amount) || 0;
    // Money coming INTO cash account
    if (['Income', 'Loan Received', 'Loan Receiving', 'Transfer In'].includes(trans.type)) {
      calculatedCashBalance += amount;
    }
    // Money going OUT of cash account
    else if (['Expense', 'Loan Given', 'Loan Giving', 'Transfer Out'].includes(trans.type)) {
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

// Expose togglePersonField globally (safe guard)
if (typeof togglePersonField === 'function') {
  window.togglePersonField = togglePersonField;
}

// account-search — extracted to sections/account-search.js



// ===================================
// CRITICAL GLOBAL EXPOSURES
// Required by sections and sync system
// ===================================
window.renderLedger = renderLedger;
window.updateGlobalStats = updateGlobalStats;
window.checkDailyBackup = checkDailyBackup;
// window.updateStudentCount → sections/student-management.js
// window.filterData → sections/student-management.js
// handleEmployeeSubmit → exposed in sections/employee-management.js

// Core UI Refresh Functions for Auto-Sync
window.renderFullUI = function () {
  console.log('🔄 Global UI Refresh Triggered');
  try {
    if (typeof render === 'function') render(window.globalData.students || []);
    if (typeof renderLedger === 'function') renderLedger(window.globalData.finance || []);
    if (typeof updateGlobalStats === 'function') updateGlobalStats();
    if (typeof renderDashboard === 'function') renderDashboard();
    if (typeof renderCashBalance === 'function') renderCashBalance();
    if (typeof renderRecentAdmissions === 'function') renderRecentAdmissions();
    if (typeof updateGrandTotal === 'function') updateGrandTotal();
    if (typeof populateDropdowns === 'function') populateDropdowns();
    if (typeof populateBatchFilter === 'function') populateBatchFilter();
    if (typeof initNoticeBoard === 'function') initNoticeBoard();
  } catch (e) {
    console.warn('UI Refresh partially skipped:', e);
  }
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
  const bgMap = { cash: 'rgba(0,255,136,0.12)', bank: 'rgba(0,217,255,0.12)', mobile: 'rgba(255,45,149,0.12)' };
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

// ===================================
// KEEP RECORD — Personal Notes System
// ===================================


// keep-records — extracted to sections/keep-records.js

// ===================================
(function ensureCriticalExports() {
  if (typeof handleStudentSubmit === 'function') { window.saveStudent = handleStudentSubmit; window.handleStudentSubmit = handleStudentSubmit; }
  if (typeof render === 'function') { window.renderStudents = render; window.render = render; }
  if (typeof exportData === 'function') window.exportData = exportData;
  if (typeof importData === 'function') window.importData = importData;
  if (typeof handleImportFile === 'function') window.handleImportFile = handleImportFile;
  if (typeof renderLedger === 'function') window.renderLedger = renderLedger;
  if (typeof filterData === 'function') window.filterData = filterData;
  if (typeof openAccountModal === 'function') window.openAccountModal = openAccountModal;
  if (typeof renderAccountList === 'function') window.renderAccountList = renderAccountList;
  if (typeof renderDashboard === 'function') window.renderDashboard = renderDashboard;
  if (typeof updateGlobalStats === 'function') window.updateGlobalStats = updateGlobalStats;
  if (typeof recalculateCashBalanceFromTransactions === 'function') window.recalculateCashBalanceFromTransactions = recalculateCashBalanceFromTransactions;
  if (typeof renderKeepRecordNotes === 'function') window.renderKeepRecordNotes = renderKeepRecordNotes;

  window.renderFullUI = function () {
    console.log('🔄 Global UI Refresh');
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
      if (typeof initNoticeBoard === 'function') initNoticeBoard();
    } catch (e) { console.warn('renderFullUI partial error:', e); }
  };
  console.log('✅ Safety net applied — Wings Fly Academy');
})();

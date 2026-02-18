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

// ===================================
// ACTIVITY HISTORY & TRASH SYSTEM
// ===================================

// Log an activity to history
function logActivity(type, action, description, data = null) {
  try {
    if (!window.globalData.activityHistory) window.globalData.activityHistory = [];
    
    const entry = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      type: type,       // 'student', 'finance', 'employee', 'settings', 'login'
      action: action,   // 'ADD', 'EDIT', 'DELETE', 'LOGIN', 'LOGOUT', 'SETTING_CHANGE'
      description: description,
      timestamp: new Date().toISOString(),
      user: sessionStorage.getItem('username') || 'Admin',
      data: data        // snapshot of the item (for restore)
    };
    
    window.globalData.activityHistory.unshift(entry); // newest first
    
    // Keep max 500 entries
    if (window.globalData.activityHistory.length > 500) {
      window.globalData.activityHistory = window.globalData.activityHistory.slice(0, 500);
    }
    
    localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
  } catch(e) {
    console.warn('History log error:', e);
  }
}
window.logActivity = logActivity;

// Move item to trash (soft delete)
function moveToTrash(type, item) {
  try {
    if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
    
    const trashEntry = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      type: type,
      item: JSON.parse(JSON.stringify(item)), // deep copy
      deletedAt: new Date().toISOString(),
      deletedBy: sessionStorage.getItem('username') || 'Admin'
    };
    
    window.globalData.deletedItems.unshift(trashEntry);
    
    // Keep max 200 deleted items
    if (window.globalData.deletedItems.length > 200) {
      window.globalData.deletedItems = window.globalData.deletedItems.slice(0, 200);
    }
    
    localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
  } catch(e) {
    console.warn('Trash error:', e);
  }
}
window.moveToTrash = moveToTrash;

// Load and render Activity History tab
function loadActivityHistory() {
  const container = document.getElementById('activityHistoryList');
  if (!container) return;
  
  const history = window.globalData.activityHistory || [];
  const filterVal = document.getElementById('historyFilter')?.value || 'all';
  
  const filtered = filterVal === 'all' ? history : history.filter(h => h.type === filterVal);
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-5"><div style="font-size:3rem">📋</div><p>কোনো Activity নেই।</p></div>';
    return;
  }
  
  const icons = { student: '🎓', finance: '💰', employee: '👤', settings: '⚙️', login: '🔐', default: '📝' };
  const colors = { ADD: '#00ff88', EDIT: '#00d9ff', DELETE: '#ff4444', LOGIN: '#b537f2', LOGOUT: '#ffaa00', default: '#ffffff' };
  const actionBadge = { ADD: 'success', EDIT: 'info', DELETE: 'danger', LOGIN: 'primary', LOGOUT: 'warning', SETTING_CHANGE: 'secondary' };
  
  container.innerHTML = filtered.map(h => {
    const d = new Date(h.timestamp);
    const timeStr = d.toLocaleString('en-BD', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const icon = icons[h.type] || icons.default;
    const badge = actionBadge[h.action] || 'secondary';
    
    return `
    <div class="d-flex align-items-start gap-3 p-3 mb-2 rounded-3" style="background: rgba(0,217,255,0.05); border: 1px solid rgba(0,217,255,0.15);">
      <div style="font-size:1.5rem; min-width:36px; text-align:center;">${icon}</div>
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-${badge} text-uppercase" style="font-size:0.65rem;">${h.action}</span>
          <span class="text-muted small">${h.type}</span>
          <span class="ms-auto text-muted" style="font-size:0.75rem;">⏱ ${timeStr}</span>
        </div>
        <div style="color:#ffffff; font-size:0.9rem;">${h.description}</div>
        <div class="text-muted" style="font-size:0.75rem;">👤 ${h.user || 'Admin'}</div>
      </div>
    </div>`;
  }).join('');
}
window.loadActivityHistory = loadActivityHistory;

// Clear activity history
function clearActivityHistory() {
  if (!confirm('সব Activity History মুছে ফেলবেন?')) return;
  window.globalData.activityHistory = [];
  saveToStorage(true);
  loadActivityHistory();
  showSuccessToast('Activity History cleared!');
}
window.clearActivityHistory = clearActivityHistory;

// Load and render Deleted Items (Trash) tab
function loadDeletedItems() {
  const container = document.getElementById('deletedItemsList');
  if (!container) return;
  
  const deleted = window.globalData.deletedItems || [];
  const filterVal = document.getElementById('trashFilter')?.value || 'all';
  
  const filtered = filterVal === 'all' ? deleted : deleted.filter(d => d.type === filterVal);
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-5"><div style="font-size:3rem">🗑️</div><p>Trash খালি। কোনো deleted item নেই।</p></div>';
    return;
  }
  
  const icons = { student: '🎓', finance: '💰', employee: '👤' };
  
  container.innerHTML = filtered.map((d, idx) => {
    const date = new Date(d.deletedAt);
    const dateStr = date.toLocaleString('en-BD', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const icon = icons[d.type] || '📄';
    
    // Build display name
    let name = '';
    if (d.type === 'student') name = d.item.name || d.item.studentName || 'Unknown Student';
    else if (d.type === 'finance') name = (d.item.description || d.item.category || 'Transaction') + ' - ৳' + (d.item.amount || 0);
    else if (d.type === 'employee') name = d.item.name || 'Unknown Employee';
    else name = JSON.stringify(d.item).substring(0, 60) + '...';
    
    return `
    <div class="d-flex align-items-start gap-3 p-3 mb-2 rounded-3" style="background: rgba(255,68,68,0.05); border: 1px solid rgba(255,68,68,0.2);">
      <div style="font-size:1.5rem; min-width:36px; text-align:center;">${icon}</div>
      <div class="flex-grow-1">
        <div class="d-flex align-items-center gap-2 mb-1">
          <span class="badge bg-secondary text-uppercase" style="font-size:0.65rem;">${d.type}</span>
          <span class="ms-auto text-muted" style="font-size:0.75rem;">🗑️ ${dateStr}</span>
        </div>
        <div style="color:#ffffff; font-size:0.9rem; font-weight:500;">${name}</div>
        <div class="text-muted" style="font-size:0.75rem;">Deleted by: ${d.deletedBy || 'Admin'}</div>
      </div>
      <div class="d-flex flex-column gap-1">
        <button class="btn btn-sm btn-success" onclick="restoreDeletedItem('${d.id}')" title="Restore">
          ↩️ Restore
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="permanentDelete('${d.id}')" title="Delete Forever">
          ❌
        </button>
      </div>
    </div>`;
  }).join('');
}
window.loadDeletedItems = loadDeletedItems;

// Restore a deleted item
function restoreDeletedItem(trashId) {
  if (!confirm('এই item টি restore করবেন?')) return;
  
  const deleted = window.globalData.deletedItems || [];
  const idx = deleted.findIndex(d => d.id === trashId);
  if (idx === -1) { alert('Item পাওয়া যায়নি!'); return; }
  
  const trashEntry = deleted[idx];
  const item = trashEntry.item;
  const type = trashEntry.type;
  
  if (type === 'student') {
    if (!window.globalData.students) window.globalData.students = [];
    window.globalData.students.push(item);
    logActivity('student', 'ADD', `Restored student: ${item.name || 'Unknown'}`, item);
    if (typeof render === 'function') render(window.globalData.students);
    
  } else if (type === 'finance') {
    if (!window.globalData.finance) window.globalData.finance = [];
    window.globalData.finance.push(item);
    logActivity('finance', 'ADD', `Restored transaction: ${item.description || item.category || ''}`, item);
    if (typeof renderLedger === 'function') renderLedger(window.globalData.finance);
    
  } else if (type === 'employee') {
    if (!window.globalData.employees) window.globalData.employees = [];
    window.globalData.employees.push(item);
    logActivity('employee', 'ADD', `Restored employee: ${item.name || 'Unknown'}`, item);
  }
  
  // Remove from trash
  window.globalData.deletedItems.splice(idx, 1);
  saveToStorage();
  loadDeletedItems();
  
  showSuccessToast(`✅ ${type} successfully restored!`);
  if (typeof updateGlobalStats === 'function') updateGlobalStats();
}
window.restoreDeletedItem = restoreDeletedItem;

// Permanently delete from trash
function permanentDelete(trashId) {
  if (!confirm('এই item টি চিরতরে মুছে ফেলবেন? এটি আর ফিরিয়ে আনা যাবে না।')) return;
  
  const deleted = window.globalData.deletedItems || [];
  const idx = deleted.findIndex(d => d.id === trashId);
  if (idx === -1) return;
  
  window.globalData.deletedItems.splice(idx, 1);
  saveToStorage(true);
  loadDeletedItems();
  showSuccessToast('Item permanently deleted.');
}
window.permanentDelete = permanentDelete;

// Empty entire trash
function emptyTrash() {
  if (!confirm('সব Deleted Items চিরতরে মুছে ফেলবেন?')) return;
  window.globalData.deletedItems = [];
  saveToStorage(true);
  loadDeletedItems();
  showSuccessToast('Trash emptied!');
}
window.emptyTrash = emptyTrash;



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

    // B. Cloud sync skipped during login to prevent blocking

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
  if (typeof logActivity === 'function') logActivity('login', 'LOGIN', 'User logged in: ' + username);
  document.getElementById('loginSection').classList.add('d-none');
  document.getElementById('dashboardSection').classList.remove('d-none');

  // URL থেকে username, password ও অন্য sensitive params সরিয়ে দাও
  try {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  } catch(e) {}

  const userEl = document.getElementById('sidebarUser') || document.getElementById('currentUser');
  if (userEl) userEl.innerText = username;

  loadDashboard();
  checkDailyBackup();
}

function logout() {
  if (typeof logActivity === 'function') logActivity('login', 'LOGOUT', 'User logged out: ' + (sessionStorage.getItem('username') || 'Admin'));
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

  displayItems.forEach((f, idx) => {
    // Assign missing IDs on the fly
    if (!f.id) {
      f.id = 'FIN-' + Date.now() + '-' + idx;
    }
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
            <button class="btn btn-sm btn-outline-primary edit-tx-btn" data-txid="${f.id}" title="Edit record">
              ✏️ Edit
            </button>
            <button class="btn btn-sm btn-danger del-tx-btn" data-txid="${f.id}" title="Delete record">
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
  

  // Get student info before deleting
  const student = globalData.students[rowIndex];
  if (!student) {
    alert("Error: Student not found.");
    return;
  }
  
  // Move to trash before deleting
  if (typeof moveToTrash === 'function') moveToTrash('student', student);
  if (typeof logActivity === 'function') logActivity('student', 'DELETE', 
    'Student deleted: ' + (student.name || 'Unknown') + ' | Batch: ' + (student.batch || '-') + ' | Course: ' + (student.course || '-'), student);

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

window.deleteStudent = deleteStudent;

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
    if (typeof logActivity === 'function') logActivity('finance', 'ADD', 
      (formData.type || 'Transaction') + ': ' + (formData.category || '') + ' - ৳' + (formData.amount || 0) + ' | ' + (formData.description || ''));
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
  

  // Handle both string and number IDs (localStorage/Supabase can change types)
  const sid = String(id);
  const txToDelete = globalData.finance.find(f => String(f.id) === sid);
  
  if (!txToDelete) {
    showErrorToast('Transaction not found.');
    renderLedger(globalData.finance);
    renderAccountDetails && renderAccountDetails();
    return;
  }

  if (typeof updateAccountBalance === "function") {
    updateAccountBalance(txToDelete.method, txToDelete.amount, txToDelete.type, false);
  }

  globalData.finance = globalData.finance.filter(f => String(f.id) !== sid);
  
  // Render FIRST so user sees the change immediately (before async cloud push)
  renderLedger(globalData.finance);
  updateGlobalStats();
  showSuccessToast('Transaction deleted successfully!');

  // Then save & push to cloud (async, won't revert UI)
  saveToStorage();

  // Refresh Account Details modal if open
  const accModal = document.getElementById('accountDetailsModal');
  if (accModal && bootstrap.Modal.getInstance(accModal)) {
    renderAccountDetails();
  }
}

// ===================================
// EDIT TRANSACTION
// ===================================

window.deleteTransaction = deleteTransaction;

function editTransaction(id) {
  const sid = String(id);
  const transaction = globalData.finance.find(f => String(f.id) === sid);
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

window.editTransaction = editTransaction;

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

  const id = formData.transactionId; // keep as string/original
  const index = globalData.finance.findIndex(f => String(f.id) === String(id));

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

  displayItems.forEach((f, idx) => {
    // Assign missing IDs on the fly
    if (!f.id) {
      f.id = 'FIN-' + Date.now() + '-' + idx;
    }
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
                    <button class="btn btn-sm btn-outline-danger border-0 del-tx-btn" data-txid="${f.id}" title="Delete entry">
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
  if (typeof logActivity === 'function') logActivity('settings', 'SETTING_CHANGE', 'Settings updated by ' + (sessionStorage.getItem('username') || 'Admin'));
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
            <div class="p-3 rounded text-center" style="background:linear-gradient(135deg,#1e3a5f,#1d4ed8);border:2px solid #3b82f6;">
              <small class="fw-bold d-block mb-1" style="color:#93c5fd;letter-spacing:1px;font-size:0.75rem;">TOTAL FEE</small>
              <h4 class="m-0 fw-bold" style="color:#ffffff;">৳${formatNumber(student.totalPayment)}</h4>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="p-3 rounded text-center" style="background:linear-gradient(135deg,#14532d,#16a34a);border:2px solid #22c55e;">
              <small class="fw-bold d-block mb-1" style="color:#bbf7d0;letter-spacing:1px;font-size:0.75rem;">PAID</small>
              <h4 class="m-0 fw-bold" style="color:#ffffff;">৳${formatNumber(student.paid)}</h4>
            </div>
          </div>
          <div class="col-sm-4">
            <div class="p-3 rounded text-center" style="background:linear-gradient(135deg,#7f1d1d,#dc2626);border:2px solid #f87171;">
              <small class="fw-bold d-block mb-1" style="color:#fecaca;letter-spacing:1px;font-size:0.75rem;">DUE</small>
              <h4 class="m-0 fw-bold" style="color:#ffffff;">৳${formatNumber(student.due)}</h4>
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
  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('attendanceModal'));
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

function saveAttendanceLegacy() {
  const batch = document.getElementById('attendanceBatchSelect')?.value;
  const date = document.getElementById('attendanceDate')?.value;
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

  // Safe modal close
  try {
    const modalEl = document.getElementById('attendanceModal');
    if (modalEl) {
      let m = bootstrap.Modal.getInstance(modalEl);
      if (!m) m = bootstrap.Modal.getOrCreateInstance(modalEl);
      m.hide();
    }
  } catch(e) {}

  showSuccessToast(`✅ Attendance saved for ${batch} on ${date}`);
}

function generateCertificate() {
  const btn = document.getElementById('btnCertificate');
  const originalText = btn.innerHTML;
  if (!currentStudentForProfile) { showErrorToast('No student selected.'); return; }
  const s = currentStudentForProfile;
  btn.innerHTML = '⏳ Generating...';
  btn.disabled = true;

  const LOGO = "data:image/png;base64,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";
  const FERDOUS_SIGN = "data:image/jpeg;base64,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088skIJBBV99oBAQ9sM+8ABAAGM804AAYAc884wowwAAEc888sI8884ww48884U4Qw88McsAA8AAAAAw08MIwcIAAggIAA8Q40YwQJBBV9+4DAAAc09+xBA8M4AAsMM888wAAAAkAAAM88884wAgAAAAAAAQQUAAAAAAwAQwosEMIEMAAw0oc888oAAcIAw0sAoMBRNBW9tVpBJl8x+sJAA8wgAA48888YAAAA0Uc8888888AAoAAAEAAAAMsUMIEIAAAAAE0888888888YE8888oEIAAEAAQw89xVFlBwx8sNBA0cU40IAQMMMMgYwww8MMIEQEwww888MMMIsMMMIgMMIwgwwgQwMMMsI0c8wwwwwwwkMc8www88oAAMd884xF/vttR95AEN5zCEoMMYwgE808wkAMMc84wwgcAAAMIM888o888w8ggAwEgQgwwA0w44A88sIEAAAQo480sIAgQ4AAw88oJBBF/hxBRtNc890IBcAkAMMM88AAAcc88gAAAAM4sc8888AAAUQQgAAEIAMcEMMAAAMAAYAA088sI8kYAAAQ40848sIAAc8hItBd8ABBAtR88AAEcwAQ088884EAc8QwwAAEMs8o88884gAAAcAAAM88sc4U8888sM8McgAAAQw084ks8MAAAQocUsY8MAhV9NxxxFNNNMMcNMMMwMMMYwww8MMQww00wMMMMIAIggAw08888M8MsMMIAMQwwAAAAMAIMMMMcwgAUwgAIEMc04AA8w70MgAfhxpttCE09pAQ0U8oAEE8AkAA084IAAQoE8888ggAIEMM88888U84AAAAAAoMAAAAAAEAAgU88884sIAAAAw0Usco0VoAocVoADpRhZw4wMYEhYwkI4wwsckYwwMMMMcQ4wwwAMMM0wwwwwwwkQEMMsMcccc8sM8MMM8sMMIwwwkQw8sMAAcoQ088ABAABJhBLBlN9sIARssMIQ4UcsAQ08sAAQQ8888o0AAAU888UsAAAAAAUAAg8888888888888k88888sIcAAA88844csAAAEhJBBA8BNhJ9+9BwAU888oE8k84AAU84EgAU8888AIAAU8888YgAAAAAM8scM8888gw80ww84gY8888880kAAAAAUA8w08sYgscoBBIhBFIZ88BIswEAAE88sAA088AAQ888AAAAA8888IIAAUAU88888k8084AAAAAAAAAAAAAAAAIAAA8888888IAAE0EsAA99sxBBdM95EAMo8sYAAc8Q4QMc8sAE8s08AAAAM8008oAAAUMM8884AQ8AwAAAUAAAMEAEoAIAAAAAAA04448o888EoAw88Bl5DxYR84BoFI8cwwAI08wAMc8wwEMM84AwAMcs8wAQQwEMM4048wwwgAAAgAEMs8M88888M88MAMcIIAAAMAwA88wcsMAAQB9phB88whB098YIIM8oA0gAY88gAA088oAAAE884gQAAAA8848MQgAAEAAUsAE8s08888888888M8sAEAEcgAAEUAAgQ8oMYt1oBB885gAc88oAI04EEYcw888Ic8888IAU888sAAA8c8888AAIAAAA0AEc8888888884c888888888888cssE8kIAAAAkcMtUBANw8gA984gAI8oEUU8oowwwE8ogwgAE84w4gAEc48848AAAAAAAE88888848ww0wwUwwwwwQw88888888888sMMsogQw88AcM4BAE88oQsAsgAAI08owAIA84AQME888AIAAE88s4QAgAAAAcME888888wEAAAAAAAAAAAAAAQ4cw80488888888oAAAQxg8/90Mc88884QUIA8ssQUEM888Awww88440MQMc88YQ4AAAAYA888888kEEAIAAMcAIMMMMMIIMIE8oEYAQ0840888s8sAEBc88wsMIoI08oAQ8w8o4gU8w4UoEEcEIM8wc88088AgAAAAAE88888sIcEQAIAAEAAAAAAAAAAAgA8wAIAAAQAAw08888888F95gA8gg8MQgAAU88IgsAUc4oUg8A4YAAAE888A0oAAAIAAAA888404EIAAMMAAAAAAAAAAAAAAAAAAAE4gIAAAAAQwUc88cdoIMAggE8oAQEMo88sAAIU8sUIAUgE8gU8888wgEQAAAAAAM8888oYYIAAAUAAAAAAAAAAAAAAAAAAAAEQgQ8IIMIEAQw08888gM4ME84goE8sow880AQ088UAM8Q4AEE884wAAMUAIAAc888s88oIIAAAUYAMEAAAAAAAAAAAAAAAAAAAAAc84sYsIAAA888oA8wAk4IwoE88sggAUcc4sgUE8YkoA0s8kMoAQAwA0c88848888IcIAAAgoA4YAAAAAAAAAAQYAAAAAAAAMwEAMMosAAAU8pAM4AEcgU0k8888AAUow4EQg888I4AAUEc88AAsAAgQ888888884woAAAEcA0AAAAAAAAAAAE0oAAAAAAAAAAAAAgAAAAM88oA8oU84gE80sAwUAQ8ooAQAA08oY8gIEQ088AYoEIAAg4488888EsgAAAMwUkAAAAAAAAAAAA0AAAAAAAAAAAAAAQAMEcc88wgEQ084gc8U4IAokc8o8MQU4YcQUsAU4gcY48wQ8gAoM8csw880U8IIEEsMUkgEA0EAAsAEQAAAAIAAAAAAAAAAAAAMc8884gAE8wwEQ88oAA0o88MoAI80QcgI88sI8EkkEQ4UsQAIEgAEw08AsokoAAk4EkM40EskY4YsUIAAAAAAAAQAUIAgAc88888gMEcw4AoEsIAoE8co888oA00kE8oUI4gU4oU84ggEgcsMQkck0wUksEc8IgAUgwIoAggQ0wEAcAAIAAAAA8IAAAAIc8888cwwgcoAAAMU8AA8cM8owIAs0gUc4EIco8IAAAQ4A8cY8884UYUYgQwQ8Q88IMMcAwgAAAAAAAAAEQQAMEsAIgAAMs848848oAAAAwgE8s88gA8888AEAEcoAEU8AU08A0oAAAAgU888840ss88AQoAAUgQ8wE88sIAAAAAAAAAAAAAIAEIAIMMo888s44AQkYcM8scM8wwgAE8U8IAUAAQoAAUk88oU8sIAAkAEIAw0sUc88888s0AAAA4Eoc88gQYYossAsEAAIAAEsIMcs88888o0gAAAU88wgU888gA8084YwgAUAAAwgQkE08cM8888oQoAgAsQoA0808wwg08wIgUMkg8w8888c8sMsMkc88c888888840ggAUAAQAU8ww0884AAAU88AoAQw4EMAcgoUAc0AQ8848sc4EcIEMswIg8MsscIAQAAQ0AAQA40w0888888c8888888w88AAcAAAQMMc8oAAwA4AAAAE88oAoAAc4AAAk8kssMcAA4A08McMA808ggQQww8w48sIMMMM8IAAAgwAQww080w488w80gAAwwAAQAAYI8wwQksM0uMMMMM888gAoIE8ooIA88o0A004AsMcs88888AAAAAAAAAAAAw80888MMMIAAAAAAAAAAAwwgAwAAAAAAAEIc88sgEMMUg4KQ8MMMAMMAAM0w88o88Es8s8AAUAAkAU4088U8oAAAAAQAoAAAA88888888sAAUIAAAAAAAAAAAAAMA88g8848sM8AAMMoQ4Wu8884AAAAAcUw8oQMM8A88osMcIgcAQgU8888888csMIAAI8sAwAAAU88888U888cUUs8AAAAII88888s840gAAUMc4ws8Ame88wgAAEEM8Uc88I884A88s8088w8AQsc8888848084wwQwwgAAAAAU888c888888U8888AE888w08wAQMMIMM8swgIMwO+C6AAAIM88888U488AI4Eo88s8884AQAUU8s88888888888UoM88IMQgAAAAU84w4w888888M8888wwwAMIMMYM8w0Aww8ki++SE4wwwwwwwwIAwwUAAwAw84888sAIAEIAc888088888888888840EIAAAAAAAAAAA4gA80888AwAIAM8888sgAAUA8kuq6qO24AAAAAAAAAoEAM8AAAUA8g888888Q0888888c8888888E8s8cAAAAAAAAAAAAAAAgQw04wQAAAMME888M84IA8QcoemCmiC6AAAAAMsc888888cMAAAAAA888888U888888888888884U088oAAAIgYAAAAoAAAA4AAUogAAAAwws888A88AQEcIg6SqQSaOMcs88888880888488M8AAEAAw4888cwgAAwwwwwwwgwAAAQAAAAAgAAEM8ssMcMcsEM8s888sMMMIEc884kwgA80+MSKGWIG88844A4oQAQQAgAUg8w8s8ss8MMMMscsMMMMM888888s88888wwwww0ww04AAAQwQwAAAAAAAAgwAwwg88o088U4uWGaoSYuoQAAAAAAAAAAAAAQQww08AwwwgQ04www04w04wwww804AwwAAAAAAAAAAAAIMAAAAAAAAMIcsMMIMIAMAQAwEAcoCykYoqSqAAAAAAAAAAMMM8cMIAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMIMMI4888888888sM88888888888888MMMAAAECuKWq8aMYAAAAAAAMMM88888w088MMcM8s88MsIAAMMMMMMMcMMs888888888888888888888888888480w488488888804S2SEIMYwaw88M8888s888888888888888888888888888888888888888888888888884QwwwwQwwwwAAAAAAgAAAIAw08uWeiGSSWo+Kk88888888888888o888k88o0888888888888888888888888880888408888EMAAAAAAAAAAAAAAAAAAAAEAQ+eEQkKYcQwkA8088808888ccs88IAAAAAAwAAQAgAgAgAgAgAAAQ4wwwgAAAAAAgAAAAAwAAAAAAAAAAAAAAAAAAAAAAAkUYiaSkUQMWO4kkwwQgAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4MkEY0MswMMIYgcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE8okYckIMcg44EY0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEYIQgMk4wgMMMc4E8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI0YwQQOU4AYAAQ0oAAAM8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYwAc4Y4YwIEcgAIAc88gE88AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQ8IAwQkQMMswwAE808wwAE88AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQww88wkMMMIQwwgMEMMc4wwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwwwww88sMMMMMMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwwwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIAAwAAABBKroJL6KbLpo6o4rpo6I66ZoZoLMJJo/8AD3na2W2KCOCWKqSqGymiSCC++iKuqOOeCyCCy+uK++KeOSCGKCyCeu+K2qiGqfy2G+eOOWeKi2Gme6iqrPLSmb6vzCOLCrHeGCGi+yqmO6OeayCSKGCy2e+WiG6W6iKC6SCCGO+iKCiG++2m6qWaCCiO+iOa6W+eWK0Eey+AK26euO3f3rDHqXiOnSyMGCDO+4yKG6Sem+mOOayCyyGu6iCOCSmO++6yy6+++O+6SyOO6mS++a+qCGCy2uy2SC2qCiWOCGGSK2ayeb3/AKzzOgSgnrpn/Mx/gsmjnussgjnsjjvrsrnvshglrusmoigjghihlmiihnrggsgkoomustusvjutsngjjoghtttjuogqjgw196B716/+2/t/Li9vlsostlnjjvmgvvvipoghvvvvvgrlvvnurvvvslhstutivrrgnlvvvggupggvpstvuihmtuqkoovsv81168/v/ojx1innpuusttojnhlvvvthvupoivrvsssgghuuvvvukvvugjsgkohvvvnvpssjjjjjjgjvkgjnjvgqgviiwjmt+wUU37z0wus88QEvrlusguntjsqhssrhmssptjjjstsjjjrhjrkvorgsiikossjhsiqijiktiriglsuvhkpjomuhnjukqhy1+/Y8x2z17nv9ih9hrjssshvggntqhloginvskkpgjjvggginmojjutvssussrjvsjjhhitjjmtgnprigkmtjjtkivsnnp9m341lo0/g+/vjhmpshjpjjnvvivpvussnvuskjgvvrnmovvrornvsgikoGjrjqgkshstvvrgkspnrpkgsiggkovqjirvoo67zx/wA8sMOcb5IML774LL4oqY7IY6J656p4YoIJrJppLI4rLLLI7I6Y44oI4YYbKLKI5Iz4765I576q5LLrY5L77457LmqJ46GfO8+/TopOsZaaq6r7roYb574pbooKKZ7pa456KIKbqLIIIJIJb7oIIIYIYbCwSwAAADwyBSw44IrLa64oLLJZKJbZerZaqeoKHe8usop76rYNb7roob7a5apLZILIa4IpL745Lb6YIJIIL7aJ4oLJrCCryYJjADLLBxrDKbrDarLIpLo64K5Lb4patb7Ms8cn/PP/AKCCnimua2GqSuSuK2+a2uuCSCW62SW+qCC+WuCCCCy+++eeCGOy+6m++4+sekyy+2qS2gy+C+++qOi6+OCCPD3jO2DfL3rw/DaiqCCCqySSW6e+qW6ii+qCGG+GmC+qGCG+aiCCe+eyeSmyGeuuky82yy+6gY8O+M8+U488cCGYquCmGSuCiWWnfKjH7SrO+PiC6GCG6W+uC2KC+C+uCCeCCCC+WCCWKKGOK+qCCCW8k8084AAE8IMMMoMMsc8AAIAYg8sAMCcg2OGu6GS++DT6jf8A48nw7jslonngnovkujsphppugjtvhrjjsltpnqgvvrssgvjmgkPgMgjnKPPPMOPOFPNPGKJGAANOOuPCKggvkrurjl22wc5p0uixmwljssnljjsjkpnttisshqhsjsqkjsrkntissmtijsMMJDDDLDOMEBMCBACGMAAMDMKNNLDCEKMBLDuHusqhktw64w4qpow5r4irtshjojolpglsinijnqipnugkuohjvvvhjmvjkojHOPPKEPOBECFIBCHAAAAAMCEPOPOIHPLOGHAIgjlsory6gw/vu7stghquivukipojgstnolusvmtqiglrggvioggtvkKCNPPNCLOIAAPPPPPPPOHPPPPPOPPLABCIEEOHGNPPChrDsvxi/k8vpnk4solphuijqjikkstmnqrvrjujusuohupmjjmvgDrBPPPOADDHPPOPMMNMMFMMMMMEMPPPPPPPBDKFEMMEHHEsvllstto1unvlrltkohnglvrsphvlujrsuggkgjnsmglruEgoBFPPIMOAPPPPPMBAAAAAAAAAAAAAAEOHMPNOPOPPBBDIFPLAms5krQ2honvgguonslhhjlhustitvjgjhktvOEHpokvmkuljHDJPABDHPPJACACAADHACDDDDDCCDCBPKBGAENPONOPDOAELOB4hvsksmogonqgksghquosijgspurtAEILvovvtvvgIhkvMNOAANPPLCGAAACAABAAAAAAAAAAAIAPMACAAAEAAMNPPPHDGIMx+4glppgirqltvovivrggsivhtELDMggvughvgtqgghNPPPPAAHONOAIAAEDAAAAAAAAAAAAAAAAAAABOICAAAAAEMFHPDID3muvotugqqpougjlrlphvhropnqlunoqggnvsohkgFPPPPMBHPPKGAMAAAGAAAAAAAAAAAAAAAAAAAABEIEPCCDCBAEMNPPAvtookugmolmgrsvvvovrnilivtljGjmujvusggnELNPPIAMNLOHKAGAAAEAAFMAAAAAAAAAAAAAAAAAAAAAHPOLGLCAAAPLHqvlslqihslulvuvnjvormrpqukmgKvikkpjqgBkrvCIAFABNPHPHJCAAAKAABMAAAAAAAAAAABAAAAAAAADMBADDKLAAAFPK9smnuppuqtilvqtvqqsukkpkjgmOnvquovvgoOMsnLAAAABPPPOLKAAAAOAJHAAAAAAAAAAABOAAAAAAAAAAAAAIAAAADPCJvljqluougovovivrgqqohnvnkusLKPNJistgljDivPHFBANPPPPLIAAAGMAOAAAAAAAAAAAJIAAAAAAAAAAAAAAEADBHHPKCkipgvutonluivgvrnqvjhvnMNHGvslmApCkiCFrsCLPAPDBEPJPPCBCCIKNPIBDGBABOKBELAAACAAAAAAAAAAAAADHOMOBJimngrionvlgjiggigqgjripojgHnrhDjjPoKMKtHNGJDIFBCMPOEHGMMELJCLLDDJAGKFLNKABEAAAAAEAFCAIAHPPOMIHMGrsuglmjutjmjougjvqghqqugksiuotIrIglDrDlBvKoMENDBPEIBHPCMABADLIEIPOPJFCGACGIAAAAPCAAAACHPOALIDDHJqhnvsqljnqtjrjsigrlJqspupoqvmgtvrhvglmHtvulDFIMNDLNFMPCIDHAEIAAAAAAAAAFOIADBLACIAADLPOPHNMMOIAovougkgjotgqlvgkktnurhkkugititqggssnqgstutpHCopgEJNAKHLIHENPLCAAAAAAAAAAAAACABCACDDKPPMJBBPLDGnDopkjrgvqgkglliggghkkMovjlNlqsogghpgutvjihIJqgrgvuNggPMFNJCEELLGKPNICLADACAABLCDHLNPPJEFGHPMMNvMjnqgvvonkmtvlvoghnurjrmuPqtosggllqkqvmogFlsmoqsturCDBGMBBBFAPKAMPFPLDLDNPPPHPPPPFPMBHHGNKMAFBBGPINjvugivqhvgggpjkuojtqmrjomvrsgmrrnuhnsHuhvDKBMOgnCoEggEIKFLPBCDCAMMMMMHPPPPMMIDAAPPILPOLPDHsPohpJKghjvujnqghhvokvvnjsmhksoqvhvikhnjovpnMGJrjrsrhkriDDDDPKsMMGCMLDDCACDJEMDMCHPPDDPPJAAmGMLjrDouNFgksssgtlountuggltvlgljnimhvkMokgovvvggvqgsssusvtjsuMstjjDigsAAEuOPONPDDHPDMEsAgtAJmHqEpHpjhimuNrFivvojjvvsrgjjjrguhoklvnqvvmvqhipllvqgoqggkhlgsvvlgAAAsvvrgqFCkMOMAAFPPPHLADAPtoPOGDEMFMMPEDkoOnogtughjivonsvqhjjvkugimsptnovrmqgvvsttvnrjigqivrljsPpqggssslvtvnllrvgsMoiivvsuMLIhmHKEoDnpjhspAyvrkogvuusAlnvvmvvugjgpgilgjovpkoghvqjmrtvuosmssqgvrghqgggpgqksstlvvNtgBuuujiggsprjGrjspjkijion/AKsI45bIYIR75br75YroaqIKaoJY5a7qqoJILo4bLbqIKL5ao674o5KLLLLaoKY4Y7KoJJLI77LL4wAzL7gwwgjAxzzAIyArt7fYoIILbrLb6Yzzo44zASApqwpZJ7Y7rb6ILJJrLIIIJL777777rQQgAIJLbqrLL7YZ7wIoIIL4yAoI7LYLab77LKLoRMZPMPboIJK4bw575br7Ja476qr6D674IIK4oYIIa47rLaoK4rYb6754IBAAACIrL77D77xywwoY6777ow4SoIzIJDYL4Z7BKbqucfcoo667JKIoIo44LTL7zwAACz7b6IKoJZ7777q47K475bpbbpaoIAAiJgLT75by4JYTzSpZ7776LDK76Jb4Jb6Lawyz5ouC/ePK54oY477r7b7wBigDAyxzgwjLo44q7KY4LLLLLLrab4pKZoII4o6S45rIJJLKLKJjjA5o445rLIIYpLZLYo5LIBybTr4pPTr77zroLipIBhACABSDzAxwxBADzz75y5rbLLLIAwIIwRIAI747LKIKIaLKboQ45DJDIII64y44yLIjJKD76iQ44QwbYY/h+zOpAAABAAAQyzxCxxBDDjTwTDDCBDTjDLLbrLbrLLLLzTgjDAIIoIIIIw4447TL4wywyyzzDSBDDDTCQwA5oTIQBxRefADjP5vAAAwSzzzzzDDACDDTzQwxyzxzyQhywwQwwzzzyzSzzzywxTxzDTDDQQAQAAwwAABDAAAwwwwzwwwgQwjDDTzzzirfpLLSeSizzzzzzzDDAAAABAygADTCTARAwDBDTyzDDDDjDyjDhAAAAAADwADSwwwwwzzzzzzzzzzzzjzTDjzzjzzzzwAgxqM4CyhThLgAjAAAABAQwwwxzzzzzyxzwwxzwxwwwwwwyzwxQwywwQxzyxzzzzzzzzzzzhDDDDBDDDDAAAAAACAAAAgDDTyrYYbI6q7zpagwwwxzzzzzzzzzyjzzyTzyjTzzzzzzzzzzzzzzzzzzzzzzzzzzTzzzjTzzzwQwAAAAAAAAAAAAAAAAAAAARgyrKxjR6hyAhSzzTzzzTzzzxxyzzwgAAAAADAABACACACACACAAABDjDDCAAAAAACAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAwjbZ4xwjybrQRzDBCADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADxDRxQSRygzyhThwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAxwzgRgBBgSSTTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiRhAhzTxAwiBCCTwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjRTChh7DTgTgBDRRxygzwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAByyBiRiRSjgRhzDgBgABwTzQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAzQyCAjjwyCwzATDiAygATgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABCAAwwBTDCARzyxgzQwhiQwwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDDAAAwxzzygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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";
  const SHAKIB_SIGN = "data:image/png;base64,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eHW4gOkI7Fw7AdgTsk99m/hM4numM1lJjNnfj14e3dLXtramcRvB2OpkkhaWnyPbfyKrTDcV4ewe50+Pc18WwY1eQ/2cF6fVVVTaLif4mvdI4RuPmWuGh5np3pBeWWeI3hzHXGKTMqW6VOtsgtTHVhkPyD4wWb/NwXTU3JvLmdP9nx3xdJYaB+tXnL3mnaBrvqmZ8bvo4OI+asfAcf46oKNtxwWz4xBTyt7VVoggAkH/AKkY+L+q67kbmDjrAKOaXIsooGVMY7UNPKJqp59AImkuG/mdD5kIKu5gxa34Zxrds75Wyerzu9U0JbbqWtaIbbHVPBbGIqNnwEgnu5/UdNJ7aUZ/s8OPp7bj915EuVOY5bt/dLf1N0fYNdt7x9HPAH8n1Xw/ZfOvE/mVDfsst1bivGduf7SgoZSWVFcD+PXzcPN/k0HTOo7ctY2qgorVbaa226mipaOlibDBDE3pZGxo0GgfIAIOSiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgjt6wTCL5OZ71huO3OU+b6u2QzOP6uaV/Fm4+wKy1bauz4RjVuqGnbZaS1QRPH5FrQVJUQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFx7lQ0VyoZaG40dPWUkzemWCoiEkbx8nNcCCPzXIRBU968OPCd3rHVdXgNDHI7zFJUT0rP0ZE9rR/Rdzh3C/FeIzx1Fhwa0QVMTuuOomjNRNG75tklLnNP5FT9EBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREH/2Q==";

  const now = new Date();
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const certDate = months[now.getMonth()] + ' ' + now.getFullYear();

  const certHtml = `<div style="width:1056px;height:748px;position:relative;overflow:hidden;background:#ffffff;border:14px solid #0a2550;font-family:'Cormorant Garamond',serif;box-sizing:border-box;">
<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 15% 50%,rgba(10,37,80,0.04) 0%,transparent 55%),radial-gradient(ellipse at 85% 50%,rgba(212,175,55,0.06) 0%,transparent 55%);"></div>
<div style="position:absolute;top:14px;left:0;right:0;height:5px;background:linear-gradient(to right,#B8860B,#FFE066 30%,#D4AF37 50%,#FFE066 70%,#B8860B);"></div>
<div style="position:absolute;bottom:14px;left:0;right:0;height:5px;background:linear-gradient(to right,#B8860B,#FFE066 30%,#D4AF37 50%,#FFE066 70%,#B8860B);"></div>
<div style="position:absolute;top:22px;left:22px;right:22px;bottom:22px;border:1.5px solid rgba(212,175,55,0.55);pointer-events:none;z-index:2;"></div>
<div style="position:absolute;left:0;top:0;bottom:0;width:8px;background:linear-gradient(180deg,#0a2550,#1a4a9a 50%,#0a2550);z-index:1;"></div>
<div style="position:absolute;right:0;top:0;bottom:0;width:8px;background:linear-gradient(180deg,#0a2550,#1a4a9a 50%,#0a2550);z-index:1;"></div>
<div style="position:absolute;top:0;left:0;width:120px;height:120px;z-index:3;"><svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;"><path d="M0,0 L80,0 L80,4 L4,4 L4,80 L0,80 Z" fill="#D4AF37"/><path d="M0,0 L55,0 L55,8 L8,8 L8,55 L0,55 Z" fill="#0a2550" opacity="0.85"/><circle cx="24" cy="24" r="8" fill="none" stroke="#D4AF37" stroke-width="1.5"/><circle cx="24" cy="24" r="3" fill="#D4AF37"/></svg></div>
<div style="position:absolute;top:0;right:0;width:120px;height:120px;z-index:3;transform:scaleX(-1);"><svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;"><path d="M0,0 L80,0 L80,4 L4,4 L4,80 L0,80 Z" fill="#D4AF37"/><path d="M0,0 L55,0 L55,8 L8,8 L8,55 L0,55 Z" fill="#0a2550" opacity="0.85"/><circle cx="24" cy="24" r="8" fill="none" stroke="#D4AF37" stroke-width="1.5"/><circle cx="24" cy="24" r="3" fill="#D4AF37"/></svg></div>
<div style="position:absolute;bottom:0;left:0;width:120px;height:120px;z-index:3;transform:scaleY(-1);"><svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;"><path d="M0,0 L80,0 L80,4 L4,4 L4,80 L0,80 Z" fill="#D4AF37"/><path d="M0,0 L55,0 L55,8 L8,8 L8,55 L0,55 Z" fill="#0a2550" opacity="0.85"/><circle cx="24" cy="24" r="8" fill="none" stroke="#D4AF37" stroke-width="1.5"/><circle cx="24" cy="24" r="3" fill="#D4AF37"/></svg></div>
<div style="position:absolute;bottom:0;right:0;width:120px;height:120px;z-index:3;transform:scale(-1);"><svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;"><path d="M0,0 L80,0 L80,4 L4,4 L4,80 L0,80 Z" fill="#D4AF37"/><path d="M0,0 L55,0 L55,8 L8,8 L8,55 L0,55 Z" fill="#0a2550" opacity="0.85"/><circle cx="24" cy="24" r="8" fill="none" stroke="#D4AF37" stroke-width="1.5"/><circle cx="24" cy="24" r="3" fill="#D4AF37"/></svg></div>
<div style="position:relative;z-index:10;height:100%;display:flex;flex-direction:column;align-items:center;padding:34px 80px 26px;text-align:center;">
  <div style="width:82px;height:82px;border-radius:50%;overflow:hidden;margin-bottom:6px;box-shadow:0 4px 16px rgba(10,37,80,0.2);"><img src="\${LOGO}" style="width:100%;height:100%;object-fit:cover;"></div>
  <div style="font-family:'Cinzel',serif;font-size:10.5px;font-weight:700;letter-spacing:4px;color:#0a2550;text-transform:uppercase;margin-bottom:10px;">Wings Fly Aviation &amp; Career Development Academy</div>
  <div style="display:flex;align-items:center;gap:12px;width:70%;margin:0 auto 11px;"><div style="flex:1;height:1px;background:linear-gradient(to right,transparent,#D4AF37,transparent);"></div><div style="width:6px;height:6px;background:#D4AF37;transform:rotate(45deg);"></div><div style="width:4px;height:4px;background:#D4AF37;transform:rotate(45deg);"></div><div style="width:6px;height:6px;background:#D4AF37;transform:rotate(45deg);"></div><div style="flex:1;height:1px;background:linear-gradient(to right,transparent,#D4AF37,transparent);"></div></div>
  <div style="font-family:'Cinzel',serif;font-size:50px;font-weight:900;color:#0a2550;letter-spacing:10px;text-transform:uppercase;line-height:1;margin-bottom:2px;">Certificate</div>
  <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-style:italic;color:#C4940A;letter-spacing:3px;margin-bottom:11px;">of Appreciation &amp; Excellence</div>
  <div style="display:flex;align-items:center;gap:12px;width:52%;margin:0 auto 9px;"><div style="flex:1;height:1px;background:linear-gradient(to right,transparent,#D4AF37,transparent);"></div><div style="width:5px;height:5px;background:#D4AF37;transform:rotate(45deg);"></div><div style="flex:1;height:1px;background:linear-gradient(to right,transparent,#D4AF37,transparent);"></div></div>
  <div style="font-size:13px;color:#777;letter-spacing:1.5px;margin-bottom:3px;font-style:italic;">This certificate is proudly presented to</div>
  <div style="font-family:'Great Vibes',cursive;font-size:63px;color:#0a2550;margin-bottom:7px;line-height:1.1;">\${s.name || 'Student Name'}</div>
  <div style="display:flex;gap:42px;justify-content:center;margin-bottom:8px;font-size:11px;letter-spacing:2px;color:#555;text-transform:uppercase;font-family:'Cinzel',serif;">
    <div>Batch: <span style="font-weight:700;color:#0a2550;">\${s.batch || 'N/A'}</span></div>
    <div>ID: <span style="font-weight:700;color:#0a2550;">\${s.studentId || '-'}</span></div>
    <div>Date: <span style="font-weight:700;color:#0a2550;">\${certDate}</span></div>
  </div>
  <div style="background:linear-gradient(135deg,#0a2550,#1e4a8a);color:#fff;padding:7px 32px;font-family:'Cinzel',serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;">\${s.course || 'Course Name'}</div>
  <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;margin-top:auto;">
    <div style="text-align:center;width:195px;">
      <div style="height:50px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:3px;"><img src="\${SHAKIB_SIGN}" style="max-height:48px;max-width:175px;object-fit:contain;"></div>
      <div style="width:100%;height:1px;background:#0a2550;margin-bottom:4px;"></div>
      <div style="font-family:'Cinzel',serif;font-size:9.5px;font-weight:700;letter-spacing:1px;color:#0a2550;text-transform:uppercase;">Shakib Ibna Mustafa</div>
      <div style="font-size:8.5px;color:#888;letter-spacing:1px;text-transform:uppercase;margin-top:2px;">Course Co-ordinator</div>
    </div>
    <div style="text-align:center;">
      <div style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:2px;color:#bbb;text-transform:uppercase;margin-bottom:3px;">Verified &amp; Issued By</div>
      <div style="font-family:'Cinzel',serif;font-size:9.5px;letter-spacing:1px;color:#0a2550;font-weight:700;">wingsflyaviationacademy.com</div>
    </div>
    <div style="text-align:center;width:195px;">
      <div style="height:50px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:3px;"><img src="\${FERDOUS_SIGN}" style="max-height:48px;max-width:175px;object-fit:contain;filter:brightness(0) saturate(100%);"></div>
      <div style="width:100%;height:1px;background:#0a2550;margin-bottom:4px;"></div>
      <div style="font-family:'Cinzel',serif;font-size:9.5px;font-weight:700;letter-spacing:1px;color:#0a2550;text-transform:uppercase;">Ferdous Ahmed</div>
      <div style="font-size:8.5px;color:#888;letter-spacing:1px;text-transform:uppercase;margin-top:2px;">Chairman</div>
    </div>
  </div>
</div></div>`;

  const pw = window.open('', '_blank', 'width=1120,height=860');
  const printStyles = '<style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#2a2a2a;display:flex;flex-direction:column;align-items:center;padding:20px;}.save-btn{margin:12px 0;padding:11px 36px;background:linear-gradient(135deg,#D4AF37,#FFE066);color:#0a2550;border:none;border-radius:6px;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:2px;text-transform:uppercase;}@media print{body{background:white;padding:0;margin:0;display:block;}.save-btn{display:none;}#certWrap{width:297mm;height:210mm;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}@page{size:A4 landscape;margin:0;}</style>';
  const fontLink = '<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Great+Vibes&display=swap" rel="stylesheet">';
  const printBtn = '<button class="save-btn" onclick="window.print()">🖨️ Save as PDF</button>';
  pw.document.write('<!DOCTYPE html><html><head><title>Certificate - ' + s.name + '</title>' + fontLink + printStyles + '</head><body>' + printBtn + '<div id="certWrap">' + certHtml + '</div>' + printBtn + '</body></html>');
  pw.document.close();

  btn.innerHTML = originalText;
  btn.disabled = false;
  showSuccessToast('Certificate opened! Click "Save as PDF".');
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

  document.body.classList.add('printing-certificate');
  html2pdf().from(cardHtml).set(opt).save().then(() => {
    document.body.classList.remove('printing-certificate');
    console.log('Wings Fly: ID Card Downloaded');
    showSuccessToast('ID Card generated successfully!');
    btn.innerHTML = originalText;
    btn.disabled = false;
  }).catch(err => {
    document.body.classList.remove('printing-certificate');
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
window.saveAttendanceLegacy = saveAttendanceLegacy;
// saveAttendance is handled by attendance-pro.js — do not override here
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
  // Log before delete
  const empToDelete = (window.globalData.employees || []).find(e => e.id == id);
  if (empToDelete) {
    if (typeof moveToTrash === 'function') moveToTrash('employee', empToDelete);
    if (typeof logActivity === 'function') logActivity('employee', 'DELETE', 
      'Employee deleted: ' + (empToDelete.name || 'Unknown') + ' | Role: ' + (empToDelete.role || '-'), empToDelete);
  }
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
  optionsHTML += '<option value="all|all">🏛️ All Accounts</option>';

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

function showAllAccountsSearch(dateFrom, dateTo) {
  const fmt = window.formatNumber || (n => Number(n).toLocaleString('en-IN'));
  const allTx = (globalData.finance || []).filter(f => {
    const matchFrom = !dateFrom || (f.date && f.date >= dateFrom);
    const matchTo   = !dateTo   || (f.date && f.date <= dateTo);
    return matchFrom && matchTo;
  }).slice().reverse();

  const cashBal   = parseFloat(globalData.cashBalance) || 0;
  const bankBal   = (globalData.bankAccounts || []).reduce((a,b) => a+(parseFloat(b.balance)||0), 0);
  const mobileBal = (globalData.mobileBanking || []).reduce((a,b) => a+(parseFloat(b.balance)||0), 0);
  const totalBal  = cashBal + bankBal + mobileBal;

  document.getElementById('unifiedSearchResults').classList.remove('d-none');
  document.getElementById('noSearchResults').classList.add('d-none');
  document.getElementById('searchTransactionHistory').classList.remove('d-none');

  document.getElementById('searchAccountDetails').innerHTML = `
    <div style="background:rgba(0,217,255,0.08);border:1px solid rgba(0,217,255,0.25);border-radius:14px;padding:20px;">
      <div style="font-size:1.1rem;font-weight:700;color:#00d9ff;margin-bottom:12px;">🏛️ ALL ACCOUNTS SUMMARY</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="background:rgba(0,255,136,0.1);border:1px solid rgba(0,255,136,0.3);border-radius:10px;padding:12px 20px;text-align:center;">
          <div style="font-size:0.75rem;color:rgba(0,255,136,0.7);text-transform:uppercase;">Cash</div>
          <div style="font-size:1.2rem;font-weight:700;color:#00ff88;">৳${fmt(cashBal)}</div>
        </div>
        <div style="background:rgba(0,217,255,0.1);border:1px solid rgba(0,217,255,0.3);border-radius:10px;padding:12px 20px;text-align:center;">
          <div style="font-size:0.75rem;color:rgba(0,217,255,0.7);text-transform:uppercase;">Bank</div>
          <div style="font-size:1.2rem;font-weight:700;color:#00d9ff;">৳${fmt(bankBal)}</div>
        </div>
        <div style="background:rgba(181,55,242,0.1);border:1px solid rgba(181,55,242,0.3);border-radius:10px;padding:12px 20px;text-align:center;">
          <div style="font-size:0.75rem;color:rgba(181,55,242,0.7);text-transform:uppercase;">Mobile</div>
          <div style="font-size:1.2rem;font-weight:700;color:#b537f2;">৳${fmt(mobileBal)}</div>
        </div>
        <div style="background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:10px;padding:12px 20px;text-align:center;">
          <div style="font-size:0.75rem;color:rgba(255,215,0,0.7);text-transform:uppercase;">Total</div>
          <div style="font-size:1.3rem;font-weight:800;color:#FFD700;">৳${fmt(totalBal)}</div>
        </div>
      </div>
    </div>`;

  let rows = '';
  allTx.forEach(f => {
    const amt = parseFloat(f.amount) || 0;
    const isIncome = ['Income','Loan Received','Transfer In'].includes(f.type);
    rows += `<tr>
      <td style="padding:8px;font-size:0.82rem;">${f.date||'-'}</td>
      <td style="padding:8px;"><span style="background:${isIncome?'rgba(0,255,136,0.15)':'rgba(255,59,92,0.15)'};color:${isIncome?'#00ff88':'#ff3b5c'};padding:2px 8px;border-radius:20px;font-size:0.75rem;font-weight:700;">${f.type||'-'}</span></td>
      <td style="padding:8px;font-weight:600;color:#00d9ff;">${f.method||'Cash'}</td>
      <td style="padding:8px;">${f.category||'-'}</td>
      <td style="padding:8px;color:rgba(255,255,255,0.6);">${f.description||f.note||'-'}</td>
      <td style="padding:8px;text-align:right;font-weight:700;color:${isIncome?'#00ff88':'#ff3b5c'};">৳${fmt(amt)}</td>
    </tr>`;
  });

  document.getElementById('searchTransactionHistory').innerHTML = allTx.length === 0
    ? '<div class="text-center py-4 text-muted">No transactions found.</div>'
    : `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;">
        <thead><tr style="border-bottom:1px solid rgba(0,217,255,0.2);">
          <th style="padding:10px;color:rgba(0,217,255,0.7);font-size:0.72rem;text-transform:uppercase;">Date</th>
          <th style="padding:10px;color:rgba(0,217,255,0.7);font-size:0.72rem;text-transform:uppercase;">Type</th>
          <th style="padding:10px;color:rgba(0,217,255,0.7);font-size:0.72rem;text-transform:uppercase;">Account</th>
          <th style="padding:10px;color:rgba(0,217,255,0.7);font-size:0.72rem;text-transform:uppercase;">Category</th>
          <th style="padding:10px;color:rgba(0,217,255,0.7);font-size:0.72rem;text-transform:uppercase;">Details</th>
          <th style="padding:10px;color:rgba(0,217,255,0.7);font-size:0.72rem;text-transform:uppercase;text-align:right;">Amount</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
}
window.showAllAccountsSearch = showAllAccountsSearch;

function performUnifiedSearch() {
  console.log('🔍 performUnifiedSearch called');

  const selectValue = document.getElementById('unifiedAccountSelect').value;
  const dateFrom = document.getElementById('unifiedDateFrom').value;
  const dateTo = document.getElementById('unifiedDateTo').value;

  console.log('Search values:', { selectValue, dateFrom, dateTo });

  if (!selectValue) { alert('⚠️ Please select an account first!'); return; }
  const [accountType, accountName] = selectValue.split('|');
  if (accountType === 'all') {
    currentSearchResults = { accountType: 'all', accountData: null, transactions: [] };
    showAllAccountsSearch(dateFrom, dateTo);
    return;
  }

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

function printAllAccountsReport() {
  const dateFrom = document.getElementById('unifiedDateFrom').value;
  const dateTo   = document.getElementById('unifiedDateTo').value;
  const fmt = window.formatNumber || (n => Number(n).toLocaleString('en-IN'));
  const cashBal   = parseFloat(globalData.cashBalance) || 0;
  const bankBal   = (globalData.bankAccounts || []).reduce((a,b) => a+(parseFloat(b.balance)||0), 0);
  const mobileBal = (globalData.mobileBanking || []).reduce((a,b) => a+(parseFloat(b.balance)||0), 0);
  const allTx = (globalData.finance || []).filter(f => {
    return (!dateFrom || f.date >= dateFrom) && (!dateTo || f.date <= dateTo);
  }).slice().reverse();
  let rows = '', totalIn = 0, totalOut = 0;
  allTx.forEach(f => {
    const amt = parseFloat(f.amount)||0;
    const isIn = ['Income','Loan Received','Transfer In'].includes(f.type);
    if(isIn) totalIn+=amt; else totalOut+=amt;
    rows += `<tr><td>${f.date||'-'}</td><td>${f.type||'-'}</td><td>${f.method||'Cash'}</td><td>${f.category||'-'}</td><td>${f.description||'-'}</td><td style="text-align:right;color:${isIn?'green':'red'}">${isIn?'+':'-'}৳${fmt(amt)}</td></tr>`;
  });
  const pw = window.open('','_blank');
  pw.document.write(`<!DOCTYPE html><html><head><title>All Accounts</title>
  <style>body{font-family:Arial;padding:20px}h2{border-bottom:2px solid #333;padding-bottom:8px}.cards{display:flex;gap:12px;margin:12px 0;flex-wrap:wrap}.card{border:1px solid #ccc;border-radius:8px;padding:10px 16px;text-align:center}.label{font-size:0.7rem;color:#666;text-transform:uppercase}.val{font-size:1.1rem;font-weight:700}table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;font-size:0.82rem}th{background:#333;color:#fff}.totals{margin-top:12px;background:#f5f5f5;padding:10px;border-radius:6px}@media print{button{display:none}}</style>
  </head><body>
  <h2>🏛️ All Accounts Report</h2>
  <div>Date: ${new Date().toLocaleDateString()}${dateFrom||dateTo?' | '+( dateFrom||'Start')+' → '+(dateTo||'Today'):''}</div>
  <div class="cards">
    <div class="card"><div class="label">Cash</div><div class="val">৳${fmt(cashBal)}</div></div>
    <div class="card"><div class="label">Bank</div><div class="val">৳${fmt(bankBal)}</div></div>
    <div class="card"><div class="label">Mobile</div><div class="val">৳${fmt(mobileBal)}</div></div>
    <div class="card" style="background:#fffde7"><div class="label">Total</div><div class="val">৳${fmt(cashBal+bankBal+mobileBal)}</div></div>
  </div>
  <table><thead><tr><th>Date</th><th>Type</th><th>Account</th><th>Category</th><th>Details</th><th>Amount</th></tr></thead>
  <tbody>${rows||'<tr><td colspan="6" style="text-align:center">No transactions</td></tr>'}</tbody></table>
  <div class="totals">Income: <b style="color:green">৳${fmt(totalIn)}</b> | Expense: <b style="color:red">৳${fmt(totalOut)}</b> | Net: <b>৳${fmt(totalIn-totalOut)}</b></div>
  <br><button onclick="window.print()" style="padding:10px 24px;background:#333;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨️ Print</button>
  </body></html>`);
  pw.document.close();
}
window.printAllAccountsReport = printAllAccountsReport;

function printAccountReport() {
  if (currentSearchResults.accountType === 'all') { printAllAccountsReport(); return; }
  if (!currentSearchResults.accountData) { alert('No account selected!'); return; }

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

// ── Delete Transaction Event Delegation ──────────────────────────────────────
document.addEventListener('click', function(e) {
  // Handle Edit button
  const editBtn = e.target.closest('.edit-tx-btn');
  if (editBtn) {
    const txId = editBtn.getAttribute('data-txid');
    if (txId) editTransaction(txId);
    return;
  }

  const btn = e.target.closest('.del-tx-btn');
  if (!btn) return;
  const txId = btn.getAttribute('data-txid');
  if (!txId) return;
  
  const sid = String(txId);
  const tx = (window.globalData.finance || []).find(f => f.id !== undefined && String(f.id) === sid);
  
  // Move to trash + log before deleting
  if (tx) {
    if (typeof moveToTrash === 'function') moveToTrash('finance', tx);
    if (typeof logActivity === 'function') logActivity('finance', 'DELETE',
      'Transaction deleted: ' + (tx.type || '') + ' | ' + (tx.category || '') + ' - ৳' + (tx.amount || 0) + ' | ' + (tx.description || ''), tx);
  }
  
  if (tx && typeof updateAccountBalance === 'function') {
    updateAccountBalance(tx.method, tx.amount, tx.type, false);
  }
  window.globalData.finance = (window.globalData.finance || []).filter(f => f.id === undefined || String(f.id) !== sid);
  
  // Render immediately so user sees the change
  if (typeof renderLedger === 'function') renderLedger(window.globalData.finance);
  if (typeof updateGlobalStats === 'function') updateGlobalStats();
  if (typeof showSuccessToast === 'function') showSuccessToast('Transaction deleted!');
  
  // Save & push AFTER UI update (async - won't block)
  if (typeof saveToStorage === 'function') saveToStorage();
  
  const accModal = document.getElementById('accountDetailsModal');
  if (accModal && bootstrap.Modal.getInstance(accModal)) {
    if (typeof renderAccountDetails === 'function') renderAccountDetails();
  }
});


// =====================================================
// NOTICE BOARD SYSTEM - Wings Fly Aviation Academy
// =====================================================

const NOTICE_STORAGE_KEY = 'wingsfly_notice_board';
let noticeCountdownInterval = null;

function updateSidebarNoticeDot(hasActive) {
  const dot = document.getElementById('sidebarNoticeActiveDot');
  if (dot) dot.style.display = hasActive ? 'inline-block' : 'none';
}

// ----- Load & Display on page init -----
function initNoticeBoard() {
  const notice = getActiveNotice();
  if (notice) {
    showNoticeBanner(notice);
  } else {
    hideNoticeBanner();
  }
}

function getActiveNotice() {
  try {
    const raw = localStorage.getItem(NOTICE_STORAGE_KEY);
    if (!raw) return null;
    const notice = JSON.parse(raw);
    if (!notice || !notice.expiresAt) return null;
    if (Date.now() > notice.expiresAt) {
      localStorage.removeItem(NOTICE_STORAGE_KEY);
      return null;
    }
    return notice;
  } catch(e) { return null; }
}

function showNoticeBanner(notice) {
  const banner = document.getElementById('noticeBoardBanner');
  const addBtn = document.getElementById('noticeBoardAddBtn');
  const textEl = document.getElementById('noticeBannerText');
  if (!banner || !textEl) return;

  textEl.textContent = notice.text;
  banner.className = '';
  banner.className = 'notice-' + (notice.type || 'warning');
  banner.style.display = 'block';
  if (addBtn) addBtn.style.display = 'none';

  updateSidebarNoticeDot(true);
  startCountdown(notice.expiresAt);
}

function hideNoticeBanner() {
  const banner = document.getElementById('noticeBoardBanner');
  const addBtn = document.getElementById('noticeBoardAddBtn');
  if (banner) banner.style.display = 'none';
  if (addBtn) addBtn.style.display = 'block';
  updateSidebarNoticeDot(false);
  if (noticeCountdownInterval) {
    clearInterval(noticeCountdownInterval);
    noticeCountdownInterval = null;
  }
}

function startCountdown(expiresAt) {
  if (noticeCountdownInterval) clearInterval(noticeCountdownInterval);

  function updateCountdown() {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      clearInterval(noticeCountdownInterval);
      localStorage.removeItem(NOTICE_STORAGE_KEY);
      hideNoticeBanner();
      return;
    }
    const d = Math.floor(remaining / 86400000);
    const h = Math.floor((remaining % 86400000) / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    const s = Math.floor((remaining % 60000) / 1000);

    let label = '';
    if (d > 0) label = `${d}দ ${h}ঘ ${m}মি`;
    else if (h > 0) label = `${h}ঘ ${m}মি ${s}সে`;
    else label = `${m}মি ${s}সে`;

    const el = document.getElementById('noticeTimeLeft');
    if (el) el.textContent = label;
  }

  updateCountdown();
  noticeCountdownInterval = setInterval(updateCountdown, 1000);
}

// ----- Modal -----
function openNoticeModal() {
  // Show current notice status
  const notice = getActiveNotice();
  const statusCard = document.getElementById('currentNoticeStatus');
  const noActiveMsg = document.getElementById('noActiveNoticeMsg');

  if (notice) {
    if (statusCard) statusCard.style.display = 'block';
    if (noActiveMsg) noActiveMsg.style.display = 'none';
    const textEl = document.getElementById('currentNoticeText');
    const expEl = document.getElementById('currentNoticeExpire');
    if (textEl) textEl.textContent = notice.text;
    if (expEl) {
      const remaining = notice.expiresAt - Date.now();
      const d = Math.floor(remaining / 86400000);
      const h = Math.floor((remaining % 86400000) / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      let label = '';
      if (d > 0) label = `${d} দিন ${h} ঘণ্টা বাকি`;
      else if (h > 0) label = `${h} ঘণ্টা ${m} মিনিট বাকি`;
      else label = `${m} মিনিট বাকি`;
      expEl.textContent = `⏳ মেয়াদ: ${label}`;
    }
  } else {
    if (statusCard) statusCard.style.display = 'none';
    if (noActiveMsg) noActiveMsg.style.display = 'block';
  }

  // Reset form
  const textInput = document.getElementById('noticeTextInput');
  if (textInput) textInput.value = '';
  const charCount = document.getElementById('noticeCharCount');
  if (charCount) charCount.textContent = '0';
  const preview = document.getElementById('noticePreviewArea');
  if (preview) preview.style.display = 'none';

  // Char counter
  if (textInput) {
    textInput.oninput = function() {
      if (charCount) charCount.textContent = this.value.length;
    };
  }

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('noticeBoardModal'));
  modal.show();
}

function toggleCustomDuration() {
  const sel = document.getElementById('noticeDurationSelect');
  const row = document.getElementById('customDurationRow');
  if (!sel || !row) return;
  row.style.display = sel.value === 'custom' ? 'flex' : 'none';
}

function previewNotice() {
  const text = document.getElementById('noticeTextInput')?.value?.trim();
  if (!text) { showErrorToast('নোটিসের বিষয়বস্তু লিখুন!'); return; }
  const type = document.getElementById('noticeTypeSelect')?.value || 'warning';
  const previewBanner = document.getElementById('noticePreviewBanner');
  const previewText = document.getElementById('noticePreviewText');
  const previewArea = document.getElementById('noticePreviewArea');

  if (previewBanner) {
    previewBanner.className = 'notice-preview-banner';
    if (type === 'danger') previewBanner.classList.add('preview-danger');
    else if (type === 'info') previewBanner.classList.add('preview-info');
    else if (type === 'success') previewBanner.classList.add('preview-success');
  }
  if (previewText) previewText.textContent = text;
  if (previewArea) previewArea.style.display = 'block';
}

// Safe toast helper for notice system
function noticeToast(msg, type) {
  try {
    if (type === 'error' && typeof showErrorToast === 'function') { showErrorToast(msg); return; }
    if (typeof showSuccessToast === 'function') { showSuccessToast(msg); return; }
  } catch(e) {}
  // Fallback: simple alert-style
  const div = document.createElement('div');
  div.textContent = msg;
  div.style.cssText = `position:fixed;top:20px;right:20px;z-index:99999;background:${type==='error'?'#dc2626':'#16a34a'};color:#fff;padding:12px 24px;border-radius:12px;font-weight:700;font-size:0.95rem;box-shadow:0 4px 20px rgba(0,0,0,0.4);`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// Safe modal close helper
function closeNoticeModal() {
  const modalEl = document.getElementById('noticeBoardModal');
  if (!modalEl) return;
  try {
    let m = bootstrap.Modal.getInstance(modalEl);
    if (!m) m = bootstrap.Modal.getOrCreateInstance(modalEl);
    m.hide();
  } catch(e) {
    // fallback: hide manually
    modalEl.classList.remove('show');
    modalEl.style.display = 'none';
    document.body.classList.remove('modal-open');
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
  }
}

function publishNotice() {
  const text = document.getElementById('noticeTextInput')?.value?.trim();
  if (!text) { noticeToast('নোটিসের বিষয়বস্তু লিখুন!', 'error'); return; }

  const type = document.getElementById('noticeTypeSelect')?.value || 'warning';
  const durSel = document.getElementById('noticeDurationSelect');
  let durationMinutes = 720;

  if (durSel?.value === 'custom') {
    const d = parseInt(document.getElementById('customDays')?.value) || 0;
    const h = parseInt(document.getElementById('customHours')?.value) || 0;
    const m = parseInt(document.getElementById('customMinutes')?.value) || 0;
    durationMinutes = d * 1440 + h * 60 + m;
    if (durationMinutes < 1) { noticeToast('কমপক্ষে ১ মিনিট সময় দিন!', 'error'); return; }
  } else {
    durationMinutes = parseInt(durSel?.value) || 720;
  }

  const notice = {
    text: text,
    type: type,
    createdAt: Date.now(),
    expiresAt: Date.now() + durationMinutes * 60 * 1000
  };

  try { localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(notice)); } catch(e) {}

  closeNoticeModal();
  showNoticeBanner(notice);

  const dLabel = durationMinutes >= 1440
    ? `${Math.floor(durationMinutes/1440)} দিন`
    : durationMinutes >= 60
    ? `${Math.floor(durationMinutes/60)} ঘণ্টা`
    : `${durationMinutes} মিনিট`;

  noticeToast(`✅ নোটিস প্রকাশিত! মেয়াদ: ${dLabel}`, 'success');
}

function deleteNotice() {
  try { localStorage.removeItem(NOTICE_STORAGE_KEY); } catch(e) {}
  hideNoticeBanner();
  closeNoticeModal();
  noticeToast('🗑️ নোটিস মুছে ফেলা হয়েছে', 'success');
}

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initNoticeBoard, 800);
});

// Also run after login (switchTab calls this)
function refreshNoticeBoardOnLogin() {
  initNoticeBoard();
}

// Also expose globally
window.initNoticeBoard = initNoticeBoard;
window.openNoticeModal = openNoticeModal;
window.publishNotice = publishNotice;
window.deleteNotice = deleteNotice;
window.toggleCustomDuration = toggleCustomDuration;
window.previewNotice = previewNotice;



// ===================================
// SETTINGS TAB FUNCTION ALIASES
// (HTML uses renderActivityLog / renderRecycleBin)
// ===================================
function renderActivityLog() {
  if (typeof loadActivityHistory === 'function') loadActivityHistory();
}
function renderRecycleBin() {
  if (typeof loadDeletedItems === 'function') loadDeletedItems();
}
function clearRecycleBin() {
  if (typeof emptyTrash === 'function') emptyTrash();
}
window.renderActivityLog = renderActivityLog;
window.renderRecycleBin = renderRecycleBin;
window.clearRecycleBin = clearRecycleBin;

// Map HTML element IDs to our functions
// activityHistoryList -> recycleBinContainer (alias)
// logFilterType -> historyFilter (alias)
// binFilterType -> trashFilter (alias)
const _origLoadActivityHistory = window.loadActivityHistory;
window.loadActivityHistory = function() {
  // Support both container IDs
  const h1 = document.getElementById('activityHistoryList');
  const h2 = document.getElementById('activityLogContainer');
  
  const history = (window.globalData && window.globalData.activityHistory) || [];
  const filterEl = document.getElementById('historyFilter') || document.getElementById('logFilterType');
  const filterVal = filterEl ? filterEl.value : 'all';
  const searchEl = document.getElementById('logSearch');
  const searchVal = searchEl ? searchEl.value.toLowerCase() : '';
  
  const filtered = history.filter(h => {
    const typeOk = filterVal === 'all' || h.type === filterVal;
    const searchOk = !searchVal || h.description.toLowerCase().includes(searchVal) || (h.user||'').toLowerCase().includes(searchVal);
    return typeOk && searchOk;
  });
  
  const icons = { student: '🎓', finance: '💰', employee: '👤', settings: '⚙️', login: '🔐' };
  const actionBadge = { ADD: 'success', EDIT: 'info', DELETE: 'danger', LOGIN: 'primary', LOGOUT: 'warning', SETTING_CHANGE: 'secondary' };
  
  const html = filtered.length === 0 
    ? '<div class="text-center text-muted py-5"><div style="font-size:3rem">📋</div><p>কোনো Activity নেই।</p></div>'
    : filtered.map(h => {
        const d = new Date(h.timestamp);
        const timeStr = d.toLocaleString('en-BD', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
        const icon = icons[h.type] || '📝';
        const badge = actionBadge[h.action] || 'secondary';
        return `<div class="d-flex align-items-start gap-3 p-3 mb-2 rounded-3" style="background:rgba(0,217,255,0.05);border:1px solid rgba(0,217,255,0.15);">
          <div style="font-size:1.5rem;min-width:36px;text-align:center;">${icon}</div>
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-${badge} text-uppercase" style="font-size:0.65rem;">${h.action}</span>
              <span class="text-muted small">${h.type}</span>
              <span class="ms-auto text-muted" style="font-size:0.75rem;">⏱ ${timeStr}</span>
            </div>
            <div style="color:#fff;font-size:0.9rem;">${h.description}</div>
            <div class="text-muted" style="font-size:0.75rem;">👤 ${h.user || 'Admin'}</div>
          </div>
        </div>`;
      }).join('');
  
  if (h1) h1.innerHTML = html;
  if (h2) h2.innerHTML = html;
};

const _origLoadDeletedItems = window.loadDeletedItems;
window.loadDeletedItems = function() {
  const c1 = document.getElementById('deletedItemsList');
  const c2 = document.getElementById('recycleBinContainer');
  
  const deleted = (window.globalData && window.globalData.deletedItems) || [];
  const filterEl = document.getElementById('trashFilter') || document.getElementById('binFilterType');
  const filterVal = filterEl ? filterEl.value : 'all';
  
  const filtered = filterVal === 'all' ? deleted : deleted.filter(d => d.type === filterVal || d.type === filterVal.toLowerCase());
  
  const icons = { student: '🎓', finance: '💰', employee: '👤', visitor: '🙋', Student: '🎓', Finance: '💰', Employee: '👤', Visitor: '🙋' };
  
  const html = filtered.length === 0
    ? '<div class="text-center text-muted py-5"><div style="font-size:3rem">🗑️</div><p>Trash খালি।</p></div>'
    : filtered.map(d => {
        const date = new Date(d.deletedAt);
        const dateStr = date.toLocaleString('en-BD', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
        const icon = icons[d.type] || '📄';
        let name = '';
        const t = (d.type||'').toLowerCase();
        if (t === 'student') name = d.item.name || 'Unknown Student';
        else if (t === 'finance') name = (d.item.description || d.item.category || 'Transaction') + ' — ৳' + (d.item.amount || 0);
        else if (t === 'employee') name = d.item.name || 'Unknown Employee';
        else name = JSON.stringify(d.item).substring(0, 60);
        
        return `<div class="d-flex align-items-start gap-3 p-3 mb-2 rounded-3" style="background:rgba(255,68,68,0.05);border:1px solid rgba(255,68,68,0.2);">
          <div style="font-size:1.5rem;min-width:36px;text-align:center;">${icon}</div>
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2 mb-1">
              <span class="badge bg-secondary" style="font-size:0.65rem;">${d.type}</span>
              <span class="ms-auto text-muted" style="font-size:0.75rem;">🗑️ ${dateStr}</span>
            </div>
            <div style="color:#fff;font-size:0.9rem;font-weight:500;">${name}</div>
            <div class="text-muted" style="font-size:0.75rem;">Deleted by: ${d.deletedBy || 'Admin'}</div>
          </div>
          <div class="d-flex flex-column gap-1">
            <button class="btn btn-sm btn-success" onclick="restoreDeletedItem('${d.id}')">↩️ Restore</button>
            <button class="btn btn-sm btn-outline-danger" onclick="permanentDelete('${d.id}')">❌ Remove</button>
          </div>
        </div>`;
      }).join('');
  
  if (c1) c1.innerHTML = html;
  if (c2) c2.innerHTML = html;
};

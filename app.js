// ===================================
// WINGS FLY AVIATION ACADEMY
// CORE APPLICATION LOGIC
// ===================================

const APP_VERSION = "5.0-SYNC-PRO"; // Redefined safely here
console.log(`🚀 Wings Fly Aviation - System Version: ${APP_VERSION}`);
window.APP_VERSION = APP_VERSION; // ← Test suite এর জন্য expose করা হয়েছে

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
    // FIX: cloud pull এ deletedItems হারিয়ে না যায় তাই backup রাখো
    localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(window.globalData.deletedItems));
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

  const amt = parseFloat(amount) || 0;
  const multiplier = isAddition ? 1 : -1;

  // Types that ADD to balance (money coming IN to the account)
  // Note: Loan Receiving = money received as loan (adds to balance, but NOT income)
  const moneyInTypes  = ['Income', 'Transfer In',  'Loan Receiving', 'Loan Received'];
  // Types that SUBTRACT from balance (money going OUT of the account)
  // Note: Loan Giving = money given as loan (removes from balance, but NOT expense)
  const moneyOutTypes = ['Expense', 'Transfer Out', 'Loan Giving',   'Loan Given'];

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

    // Cloud sync is handled automatically by supabase-sync-SMART-V26.js
    // No duplicate sync call needed here.
    console.log('🔄 Cloud sync handled by Smart Sync V26 system.');
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
      setTimeout(function() {
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

  // ✅ FIX: নতুন login-এ সবসময় dashboard এ যাবে — আগের tab restore হবে না
  localStorage.setItem('wingsfly_active_tab', 'dashboard');

  // ✅ FIX: নতুন PC/login-এ cloud থেকে latest data pull করে তারপর dashboard render করো
  // এতে করে পুরানো local data দিয়ে dashboard দেখানো বন্ধ হবে
  if (typeof window.loadFromCloud === 'function') {
    console.log('🔄 Login: pulling fresh data from cloud before rendering dashboard...');
    window.loadFromCloud(true).then(() => {  // force=true: 15s block bypass করবে
      console.log('✅ Login sync complete — loading dashboard');
      loadDashboard();
    }).catch(() => {
      // Cloud pull fail হলেও local data দিয়ে dashboard দেখাও
      console.warn('⚠️ Cloud pull failed — loading from local data');
      loadDashboard();
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
  localStorage.setItem('wingsfly_active_tab', 'dashboard'); // লগইনের পরে সবসময় Dashboard-এ যাবে

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
            <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); _handleDeleteTx('${f.id}')" title="Delete record">
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

// ===================================
// RENDER DASHBOARD (wrapper)
// ===================================
function renderDashboard() {
  updateGlobalStats();
}
window.renderDashboard = renderDashboard;

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
        <td class="text-end d-flex gap-1 justify-content-end">
          <button class="btn btn-sm btn-outline-primary" onclick="printReceipt(${rowIndex}, ${inst.amount})">
            <i class="bi bi-printer"></i> RECEIPT
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteInstallment(${rowIndex}, ${idx})" title="Delete this payment">
            <i class="bi bi-trash"></i>
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

// ✅ DELETE INSTALLMENT — Payment History থেকে একটা payment সরানো
function deleteInstallment(rowIndex, instIndex) {
  const student = globalData.students[rowIndex];
  if (!student) { alert('Student not found!'); return; }

  const installments = getStudentInstallments(student);
  const inst = installments[instIndex];
  if (!inst) { alert('Installment not found!'); return; }

  if (!confirm(`এই payment টি delete করতে চান?\n৳${formatNumber(inst.amount)} (${inst.date} - ${inst.method || 'Cash'})`)) return;

  const amount = parseFloat(inst.amount) || 0;
  const method = inst.method || 'Cash';

  // 1. Student installments array থেকে সরাও
  if (!inst.isMigrated) {
    // Normal installment — directly from student.installments
    student.installments = (student.installments || []).filter((_, i) => {
      // instIndex match করে সেটা বাদ দাও
      return i !== instIndex;
    });
  } else {
    // Migrated (initial payment) — paid field থেকে বাদ দাও
    // এটা student.payment field এ আছে, installments এ নেই
    // তাই শুধু paid/due adjust করব
  }

  // 2. Student paid/due update করো
  student.paid = Math.max(0, (parseFloat(student.paid) || 0) - amount);
  student.due = Math.max(0, (parseFloat(student.totalPayment) || 0) - student.paid);

  // 3. Finance ledger থেকেও সরাও (matching entry)
  const beforeCount = (globalData.finance || []).length;
  globalData.finance = (globalData.finance || []).filter(f => {
    const sameAmount = parseFloat(f.amount) === amount;
    const samePerson = f.person === student.name || (f.description && f.description.includes(student.name));
    const sameMethod = !f.method || f.method === method;
    const sameDate = !inst.date || f.date === inst.date;
    return !(sameAmount && samePerson && sameDate);
  });

  // 4. Account balance reverse করো
  if (method === 'Cash') {
    globalData.cashBalance = Math.max(0, (parseFloat(globalData.cashBalance) || 0) - amount);
  } else {
    let acc = (globalData.bankAccounts || []).find(a => a.name === method);
    if (!acc) acc = (globalData.mobileBanking || []).find(a => a.name === method);
    if (acc) acc.balance = Math.max(0, (parseFloat(acc.balance) || 0) - amount);
  }

  // 5. Save immediately to localStorage + cloud
  localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
  if (typeof window.scheduleSyncPush === 'function') {
    window.scheduleSyncPush('Delete Installment: ' + student.name + ' ৳' + amount);
  } else {
    saveToStorage();
  }

  showSuccessToast('Payment deleted successfully!');

  // 6. Modal refresh করো
  openStudentPaymentModal(rowIndex);
  render(globalData.students);
  updateGlobalStats();
  if (typeof renderLedger === 'function') renderLedger(globalData.finance);
  if (typeof renderAccountList === 'function') renderAccountList();
  if (typeof renderCashBalance === 'function') renderCashBalance();
}

window.deleteInstallment = deleteInstallment;



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
  
  // Delete count track করো (sync এর জন্য)
  const _delCount = parseInt(localStorage.getItem('wings_total_deleted') || '0') + 1;
  localStorage.setItem('wings_total_deleted', _delCount.toString());

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

  // ✅ Sync এ 'Delete' word পাঠাও যাতে cloud এ delete বোঝা যায়
  if (typeof window.scheduleSyncPush === 'function') {
    window.scheduleSyncPush('Delete Student: ' + (student.name || 'Unknown'));
  } else {
    saveToStorage();
  }

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

  // FIX: Delete reason পাঠাও যাতে Data Loss Prevention bypass হয়
  const _dc = parseInt(localStorage.getItem('wings_total_deleted') || '0') + 1;
  localStorage.setItem('wings_total_deleted', _dc.toString());
  localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
  if (typeof window.scheduleSyncPush === 'function') {
    window.scheduleSyncPush('Delete Transaction: ' + (txToDelete.description || txToDelete.category || String(id)));
  } else {
    saveToStorage();
  }

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

// Alias for delete button in finance table
function _handleDeleteTx(id) {
  if (!id) return;
  if (!confirm('এই transaction টি delete করতে চান?')) return;
  deleteTransaction(id);
}
window._handleDeleteTx = _handleDeleteTx;

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
                    <button class="btn btn-sm btn-outline-danger border-0" onclick="event.stopPropagation(); _handleDeleteTx('${f.id}')" title="Delete entry">
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


// ============================================
// ATTENDANCE PRO — merged from attendance-pro.js
// ============================================
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
    // পুরনো modal remove করো
    const oldEl = document.getElementById('attendanceHubModal');
    if (oldEl) oldEl.remove();
    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());

    // নতুন modal তৈরি করো
    buildHubModal();

    // Bootstrap ছাড়াই manually show করো
    const modalEl = document.getElementById('attendanceHubModal');
    modalEl.style.cssText = 'display:block !important; opacity:1 !important; position:fixed; top:0; left:0; width:100%; height:100%; z-index:1055; overflow-y:auto;';
    modalEl.classList.add('show');

    // backdrop তৈরি করো
    const backdrop = document.createElement('div');
    backdrop.id = 'attHubBackdrop';
    backdrop.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:1054;';
    backdrop.onclick = closeAttHub;
    document.body.appendChild(backdrop);
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden';

    setTimeout(() => switchAttTab('mark'), 50);
  }
  window.openAttendanceModal = openAttendanceModal;

  // ── Hub Modal HTML ──────────────────────────────────
  function buildHubModal() {
    // সবসময় নতুন তৈরি হবে (openAttendanceModal এ পুরনো remove হয়ে যায়)

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

      <button class="att-btn att-btn-outline" onclick="exportAttCsv()">
        <i class="bi bi-download"></i>CSV Export
      </button>
      <button class="att-btn att-btn-outline" onclick="printCurrentAttView()">
        <i class="bi bi-printer"></i>Print
      </button>
      <button class=\"att-btn att-btn-primary\" onclick=\"attHubSave()\">
        <i class=\"bi bi-check-lg\"></i>Save Attendance
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
    if (modalEl) {
      modalEl.style.display = 'none';
      modalEl.classList.remove('show');
    }
    const backdrop = document.getElementById('attHubBackdrop');
    if (backdrop) backdrop.remove();
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }
  window.closeAttHub = closeAttHub;

  // After save: just clear student list, keep modal open, go back to mark tab
  function afterSaveAttendance(batch, date) {
    // Clear student rows so user can mark another batch/date
    const container = document.getElementById('attMarkContainer');
    if (container) {
      container.innerHTML = `
        <div style="text-align:center; padding:40px; opacity:0.5;">
          <i class="bi bi-check-circle" style="font-size:2rem; color:#00d4ff;"></i>
          <p style="margin-top:10px;">Attendance saved! Select another batch or date.</p>
        </div>`;
    }
    // Reset batch & date selectors optionally
    const batchEl = document.getElementById('attMarkBatch');
    const dateEl = document.getElementById('attMarkDate');
    // Keep date, clear batch selection indicator
    if (batchEl) batchEl.value = '';
    // Switch to mark tab to stay in place
    if (typeof switchAttTab === 'function') switchAttTab('mark');
  }
  window.afterSaveAttendance = afterSaveAttendance;
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

    document.querySelectorAll('.att-mark-student-row').forEach(row => {
      const aBtn = row.querySelector('.a-btn');
      const sid = row.querySelector('.sid')?.textContent?.trim();
      if (!sid || sid === '—') return;
      const stu = (gd().students || []).find(s => (s.studentId || '').toString() === sid || s.name === row.querySelector('.name')?.textContent?.trim());
      if (stu) {
        result[stu.studentId] = aBtn?.classList.contains('active-a') ? 'Absent' : 'Present';
      }
    });

    gd().attendance[attKey] = result;
    window.saveToStorage?.();
    window.showSuccessToast?.(`✅ Attendance saved — ${batch} on ${date}`);
    afterSaveAttendance(batch, date);
  }
  window.saveAttendance = saveAttendance;

  // আলাদা নামে — যাতে কোনো override কাজ না করে
  function attHubSave() {
    const batch = (document.getElementById('attMarkBatch'))?.value;
    const date  = (document.getElementById('attMarkDate'))?.value;
    if (!batch || !date) {
      window.showErrorToast?.('❌ Batch ও Date বেছে নিন');
      return;
    }
    if (!gd().attendance) gd().attendance = {};
    const attKey = `${batch}_${date}`;
    const result = {};
    document.querySelectorAll('.att-mark-student-row').forEach(row => {
      const aBtn = row.querySelector('.a-btn');
      const sid = row.querySelector('.sid')?.textContent?.trim();
      if (!sid || sid === '—') return;
      const stu = (gd().students || []).find(s =>
        (s.studentId || '').toString() === sid ||
        s.name === row.querySelector('.name')?.textContent?.trim()
      );
      if (stu) result[stu.studentId] = aBtn?.classList.contains('active-a') ? 'Absent' : 'Present';
    });
    gd().attendance[attKey] = result;
    window.saveToStorage?.();
    window.showSuccessToast?.(`✅ Attendance saved — ${batch} on ${date}`);
    afterSaveAttendance(batch, date);
  }
  window.attHubSave = attHubSave;

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
  // ✅ Notice board reload এ restore করো
  if (typeof initNoticeBoard === 'function') initNoticeBoard();
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

// ── Delete & Edit Transaction Event Delegation ───────────────────────────────
// Uses ledgerTableBody directly to avoid document-level conflicts (GitHub Pages blocks confirm())
function attachLedgerListeners() {
  const tbody = document.getElementById('ledgerTableBody');
  if (!tbody || tbody._listenersAttached) return;
  tbody._listenersAttached = true;

  tbody.addEventListener('click', function(e) {
    // Edit button
    const editBtn = e.target.closest('.edit-tx-btn');
    if (editBtn) {
      e.stopImmediatePropagation();
      const txId = editBtn.getAttribute('data-txid');
      if (txId && typeof editTransaction === 'function') editTransaction(txId);
      return;
    }

    // Delete button
    const delBtn = e.target.closest('.del-tx-btn');
    if (!delBtn) return;
    e.stopImmediatePropagation();

    const sid = String(delBtn.getAttribute('data-txid'));
    const tx = (window.globalData.finance || []).find(f => String(f.id) === sid);

    if (tx) {
      if (typeof moveToTrash === 'function') moveToTrash('finance', tx);
      if (typeof logActivity === 'function') logActivity('finance', 'DELETE',
        'Transaction deleted: ' + (tx.type || '') + ' | ' + (tx.category || '') + ' - ৳' + (tx.amount || 0), tx);
      if (typeof updateAccountBalance === 'function') updateAccountBalance(tx.method, tx.amount, tx.type, false);
    }

    window.globalData.finance = (window.globalData.finance || []).filter(f => String(f.id) !== sid);
    if (typeof renderLedger === 'function') renderLedger(window.globalData.finance);
    if (typeof updateGlobalStats === 'function') updateGlobalStats();
    if (typeof showSuccessToast === 'function') showSuccessToast('Transaction deleted!');
    if (typeof saveToStorage === 'function') saveToStorage();

    const accModal = document.getElementById('accountDetailsModal');
    if (accModal && bootstrap.Modal.getInstance(accModal)) {
      if (typeof renderAccountDetails === 'function') renderAccountDetails();
    }
  });
}

// Attach on DOM ready and also after every renderLedger call
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(attachLedgerListeners, 500);
});
setTimeout(attachLedgerListeners, 2500);

// Use event delegation on document level as fallback (always works)
document.addEventListener('click', function(e) {
  // Delete button fallback
  const delBtn = e.target.closest('.del-tx-btn');
  if (delBtn) {
    e.stopImmediatePropagation();
    const sid = String(delBtn.getAttribute('data-txid'));
    const tx = (window.globalData.finance || []).find(f => String(f.id) === sid);
    if (tx) {
      if (typeof moveToTrash === 'function') moveToTrash('finance', tx);
      if (typeof logActivity === 'function') logActivity('finance', 'DELETE',
        'Transaction deleted: ' + (tx.type || '') + ' | ' + (tx.category || '') + ' - ৳' + (tx.amount || 0), tx);
      if (typeof updateAccountBalance === 'function') updateAccountBalance(tx.method, tx.amount, tx.type, false);
    }
    window.globalData.finance = (window.globalData.finance || []).filter(f => String(f.id) !== sid);
    if (typeof renderLedger === 'function') renderLedger(window.globalData.finance);
    if (typeof updateGlobalStats === 'function') updateGlobalStats();
    if (typeof showSuccessToast === 'function') showSuccessToast('Transaction deleted!');
    if (typeof saveToStorage === 'function') saveToStorage();
    const accModal = document.getElementById('accountDetailsModal');
    if (accModal && typeof bootstrap !== 'undefined' && bootstrap.Modal.getInstance(accModal)) {
      if (typeof renderAccountDetails === 'function') renderAccountDetails();
    }
    return;
  }

  // Edit button fallback
  const editBtn = e.target.closest('.edit-tx-btn');
  if (editBtn) {
    const txId = editBtn.getAttribute('data-txid');
    if (txId && typeof editTransaction === 'function') editTransaction(txId);
    return;
  }
});


// =====================================================
// NOTICE BOARD SYSTEM - Wings Fly Aviation Academy
// =====================================================

var NOTICE_STORAGE_KEY = 'wingsfly_notice_board';
var noticeCountdownInterval = null;

// =====================================================
// NOTICE BOARD - CORE STORAGE (sync-safe)
// Notice সবসময় globalData.settings.activeNotice এ থাকবে
// localStorage শুধু cache হিসেবে ব্যবহার হবে
// =====================================================

function _noticeSave(notice) {
  // globalData এ রাখো (primary source of truth)
  try {
    if (!window.globalData) window.globalData = {};
    if (!window.globalData.settings) window.globalData.settings = {};
    if (notice) {
      window.globalData.settings.activeNotice = notice;
    } else {
      delete window.globalData.settings.activeNotice;
    }
    // localStorage cache update
    if (notice) {
      localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(notice));
    } else {
      localStorage.removeItem(NOTICE_STORAGE_KEY);
    }
    // wingsfly_data save → monitor trigger → cloud push
    localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
    // Immediate cloud push (bypass debounce)
    if (typeof window.wingsSync?.pushNow === 'function') {
      window.wingsSync.pushNow(notice ? 'Notice Published' : 'Notice Deleted');
    } else if (typeof window.scheduleSyncPush === 'function') {
      window.scheduleSyncPush(notice ? 'Notice Published' : 'Notice Deleted');
    }
  } catch(e) { console.warn('Notice save error:', e); }
}

function _noticeRead() {
  // Priority: globalData > localStorage
  try {
    const gd = window.globalData?.settings?.activeNotice;
    if (gd && gd.expiresAt) {
      if (Date.now() < gd.expiresAt) {
        // Sync to localStorage
        localStorage.setItem(NOTICE_STORAGE_KEY, JSON.stringify(gd));
        return gd;
      } else {
        // Expired — clean up both places
        _noticeSave(null);
        return null;
      }
    }
    // Fallback: localStorage
    const raw = localStorage.getItem(NOTICE_STORAGE_KEY);
    if (!raw) return null;
    const n = JSON.parse(raw);
    if (!n || !n.expiresAt) return null;
    if (Date.now() > n.expiresAt) {
      localStorage.removeItem(NOTICE_STORAGE_KEY);
      return null;
    }
    // Restore to globalData from localStorage
    if (window.globalData?.settings) {
      window.globalData.settings.activeNotice = n;
    }
    return n;
  } catch(e) { return null; }
}

function updateSidebarNoticeDot(hasActive) {
  const dot = document.getElementById('sidebarNoticeActiveDot');
  if (dot) dot.style.display = hasActive ? 'inline-block' : 'none';
}

// ----- Load & Display on page init -----
function initNoticeBoard() {
  const notice = _noticeRead();
  if (notice) {
    showNoticeBanner(notice);
  } else {
    hideNoticeBanner();
  }
}

function getActiveNotice() {
  return _noticeRead();
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

  // Save + immediate cloud push
  _noticeSave(notice);

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
  _noticeSave(null);
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
  try {
    if (!window.globalData) window.globalData = {};
    // backup থেকে নাও — cloud pull এ হারায় না
    var bk = localStorage.getItem('wingsfly_activity_backup');
    var bkData = bk ? JSON.parse(bk) : [];
    var cur = window.globalData.activityHistory || [];
    window.globalData.activityHistory = bkData.length >= cur.length ? bkData : cur;
  } catch(e) { console.warn('renderActivityLog:', e); }
  if (typeof loadActivityHistory === 'function') loadActivityHistory();
}
function renderRecycleBin() {
  try {
    if (!window.globalData) window.globalData = {};
    // backup থেকে নাও — cloud pull এ হারায় না
    var bk = localStorage.getItem('wingsfly_deleted_backup');
    var bkData = bk ? JSON.parse(bk) : [];
    var cur = window.globalData.deletedItems || [];
    window.globalData.deletedItems = bkData.length >= cur.length ? bkData : cur;
  } catch(e) { console.warn('renderRecycleBin:', e); }
  if (typeof loadDeletedItems === 'function') loadDeletedItems();
}
function clearRecycleBin() {
  if (typeof emptyTrash === 'function') emptyTrash();
}
window.renderActivityLog = renderActivityLog;
window.renderRecycleBin = renderRecycleBin;
window.clearRecycleBin = clearRecycleBin;
window.clearActivityLog = function() {
  if (!confirm('সব Activity History মুছে ফেলবেন?')) return;
  if (!window.globalData) return;
  window.globalData.activityHistory = [];
  localStorage.setItem('wingsfly_activity_backup', '[]');
  localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
  if (typeof saveToStorage === 'function') saveToStorage(true);
  if (typeof window.loadActivityHistory === 'function') window.loadActivityHistory();
  if (typeof showSuccessToast === 'function') showSuccessToast('Activity History cleared!');
};

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
  
  const isActionFilter = filterEl && filterEl.id === 'logFilterType';
  const filtered = history.filter(h => {
    const typeOk = filterVal === 'all' ||
      (isActionFilter ? (h.action||'').toUpperCase() === filterVal.toUpperCase() : h.type === filterVal);
    const searchOk = !searchVal ||
      (h.description||'').toLowerCase().includes(searchVal) ||
      (h.user||'').toLowerCase().includes(searchVal);
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

// =====================================================
// AUTO SNAPSHOT SYSTEM - Wings Fly Aviation Academy
// প্রতি ১ ঘন্টায় auto snapshot, last ৭টা রাখে
// =====================================================

// Snapshot constants (moved to bottom, defined as var to avoid hoisting issues)
var SNAPSHOT_KEY = 'wingsfly_snapshots';
var MAX_SNAPSHOTS = 7;
var SNAPSHOT_INTERVAL_MS = 60 * 60 * 1000;

function takeSnapshot() {
  try {
    var _KEY = 'wingsfly_snapshots';
    var _MAX = 7;
    // localStorage থেকে নাও, না থাকলে window.globalData থেকে নাও
    var data = localStorage.getItem('wingsfly_data');
    if (!data && window.globalData) {
      data = JSON.stringify(window.globalData);
      localStorage.setItem('wingsfly_data', data);
    }
    if (!data) { console.warn('Snapshot: no data found'); return; }

    var existingRaw = localStorage.getItem(_KEY);
    var snapshots = [];
    try { snapshots = JSON.parse(existingRaw) || []; } catch(e) { snapshots = []; }

    var newSnap = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      label: new Date().toLocaleString('en-BD', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }),
      data: data
    };

    snapshots.unshift(newSnap);
    if (snapshots.length > _MAX) { snapshots.splice(_MAX); }

    localStorage.setItem(_KEY, JSON.stringify(snapshots));
    console.log('📸 Snapshot taken:', newSnap.label);

    if (typeof renderSnapshotList === 'function') renderSnapshotList();
  } catch(e) {
    console.warn('Snapshot error:', e);
  }
}

function getSnapshots() {
  try {
    return JSON.parse(localStorage.getItem('wingsfly_snapshots')) || [];
  } catch(e) { return []; }
}

function restoreSnapshot(id) {
  const snapshots = getSnapshots();
  const snap = snapshots.find(s => s.id === id);
  if (!snap) return;

  try {
    localStorage.setItem('wingsfly_data', snap.data);
    window.globalData = JSON.parse(snap.data);
    if (typeof renderLedger === 'function') renderLedger(window.globalData.finance || []);
    if (typeof updateGlobalStats === 'function') updateGlobalStats();
    if (typeof showSuccessToast === 'function') showSuccessToast('✅ Snapshot restore সফল! ' + snap.label);
    if (typeof renderSnapshotList === 'function') renderSnapshotList();
  } catch(e) {
    if (typeof showErrorToast === 'function') showErrorToast('Restore failed: ' + e.message);
  }
}

function downloadSnapshot(id) {
  const snapshots = getSnapshots();
  const snap = snapshots.find(s => s.id === id);
  if (!snap) return;

  const blob = new Blob([snap.data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'WingsFly_Snapshot_' + new Date(snap.id).toISOString().slice(0,16).replace('T','_').replace(':','-') + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function deleteSnapshot(id) {
  var snapshots = getSnapshots();
  snapshots = snapshots.filter(function(s) { return s.id !== id; });
  localStorage.setItem('wingsfly_snapshots', JSON.stringify(snapshots));
  if (typeof renderSnapshotList === 'function') renderSnapshotList();
}

function renderSnapshotList() {
  const container = document.getElementById('snapshotListContainer');
  if (!container) return;

  const snapshots = getSnapshots();

  if (snapshots.length === 0) {
    container.innerHTML = '<div class="text-center py-3" style="color:#888;">এখনো কোনো snapshot নেই। "এখনই নিন" বাটনে ক্লিক করুন।</div>';
    return;
  }

  container.innerHTML = snapshots.map((snap, i) => `
    <div class="d-flex align-items-center gap-2 p-2 mb-2 rounded-3" style="background:rgba(0,217,255,0.06);border:1px solid rgba(0,217,255,0.15);">
      <div style="min-width:20px;text-align:center;color:#00d9ff;font-weight:bold;font-size:0.8rem;">#${i+1}</div>
      <div class="flex-grow-1" style="font-size:0.85rem;color:#c0e0ff;">📸 ${snap.label}</div>
      <button class="btn btn-sm py-0 px-2" style="background:rgba(0,200,100,0.2);color:#00cc66;border:1px solid #00cc66;font-size:0.75rem;" onclick="restoreSnapshot(${snap.id})">↩️ Restore</button>
      <button class="btn btn-sm py-0 px-2" style="background:rgba(0,150,255,0.2);color:#00aaff;border:1px solid #00aaff;font-size:0.75rem;" onclick="downloadSnapshot(${snap.id})">⬇️</button>
      <button class="btn btn-sm py-0 px-2" style="background:rgba(255,50,50,0.15);color:#ff6666;border:1px solid #ff4444;font-size:0.75rem;" onclick="deleteSnapshot(${snap.id})">🗑️</button>
    </div>
  `).join('');
}

// Global expose
window.takeSnapshot = takeSnapshot;
window.restoreSnapshot = restoreSnapshot;
window.downloadSnapshot = downloadSnapshot;
window.deleteSnapshot = deleteSnapshot;
window.renderSnapshotList = renderSnapshotList;

// Page load হলে প্রথম snapshot নাও (যদি আজকের কোনো snapshot না থাকে)
document.addEventListener('DOMContentLoaded', function() {
  var ONE_HOUR = 60 * 60 * 1000;

  // ৩ সেকেন্ড পর প্রথম snapshot
  setTimeout(function() {
    if (window.globalData) {
      if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
      if (!window.globalData.activityHistory) window.globalData.activityHistory = [];
    }
    takeSnapshot();
  }, 3000);

  // প্রতি ৫ মিনিটে check, ১ ঘন্টা পার হলে নতুন নাও
  setInterval(function() {
    var snaps = getSnapshots();
    var last = snaps[0];
    if (!last || (Date.now() - last.id) > ONE_HOUR) {
      takeSnapshot();
    }
  }, 5 * 60 * 1000);

  // Settings Modal খোলার সময় সব refresh
  var settingsEl = document.getElementById('settingsModal');
  if (settingsEl) {
    settingsEl.addEventListener('shown.bs.modal', function() {
      try {
        var raw = localStorage.getItem('wingsfly_data');
        if (raw) window.globalData = JSON.parse(raw);
        if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
        if (!window.globalData.activityHistory) window.globalData.activityHistory = [];
      } catch(e) {}
      if (typeof renderSnapshotList === 'function') renderSnapshotList();
      if (typeof renderActivityLog === 'function') renderActivityLog();
      if (typeof renderRecycleBin === 'function') renderRecycleBin();
    });
  }
});


// ================================================================
// AUTO-HEAL ENGINE
// ================================================================
(function() {
  var _stats = { totalRuns: 0, totalFixes: 0, lastRun: null, lastFix: null };

  function _healLog(msg, type) {
    var container = document.getElementById('heal-log-container');
    if (!container) return;
    var colors = { ok:'#00ff88', warn:'#ffcc00', err:'#ff4466', info:'#00d4ff' };
    var icon = {ok:'✅',warn:'⚠️',err:'❌',info:'ℹ️'}[type] || 'ℹ️';
    var placeholder = container.querySelector('span');
    if (placeholder) placeholder.remove();
    var div = document.createElement('div');
    div.style.cssText = 'color:' + (colors[type]||'#c8d8f0') + ';margin:2px 0;font-size:0.78rem;';
    div.textContent = '[' + new Date().toLocaleTimeString() + '] ' + icon + ' ' + msg;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function _updateUI() {
    var e;
    e = document.getElementById('heal-stats-total-runs'); if(e) e.textContent = _stats.totalRuns;
    e = document.getElementById('heal-stats-total-fixes'); if(e) e.textContent = _stats.totalFixes;
    e = document.getElementById('heal-stats-last-run'); if(e) e.textContent = _stats.lastRun ? new Date(_stats.lastRun).toLocaleTimeString() : '—';
    e = document.getElementById('heal-stats-last-fix'); if(e) e.textContent = _stats.lastFix ? new Date(_stats.lastFix).toLocaleTimeString() : '—';
  }

  function _runHeal() {
    _stats.totalRuns++;
    _stats.lastRun = Date.now();
    _updateUI();
    var fixed = 0;
    var data;
    try {
      var raw = localStorage.getItem('wingsfly_data');
      data = raw ? JSON.parse(raw) : (window.globalData || null);
      if (!data) { _healLog('Data পাওয়া যায়নি!', 'err'); return; }
    } catch(e) { _healLog('Parse error: ' + e.message, 'err'); return; }

    _healLog('Check শুরু হচ্ছে...', 'info');
    if (!Array.isArray(data.deletedItems)) { data.deletedItems = []; fixed++; _healLog('Recycle Bin array তৈরি হয়েছে', 'warn'); }
    else { _healLog('Recycle Bin: ' + data.deletedItems.length + ' আইটেম ✓', 'ok'); }
    if (!Array.isArray(data.activityHistory)) { data.activityHistory = []; fixed++; _healLog('Activity Log array তৈরি হয়েছে', 'warn'); }
    else { _healLog('Activity Log: ' + data.activityHistory.length + ' এন্ট্রি ✓', 'ok'); }
    if (!Array.isArray(data.students)) { data.students = []; fixed++; _healLog('Students array fix হয়েছে', 'warn'); }
    else { _healLog('Students: ' + data.students.length + ' টি ✓', 'ok'); }
    if (!Array.isArray(data.finance)) { data.finance = []; fixed++; _healLog('Finance array fix হয়েছে', 'warn'); }
    else { _healLog('Finance: ' + data.finance.length + ' টি ✓', 'ok'); }
    if (typeof data.cashBalance !== 'number' || isNaN(data.cashBalance)) { data.cashBalance = 0; fixed++; _healLog('Cash Balance fix হয়েছে', 'warn'); }
    else { _healLog('Cash Balance: ৳' + data.cashBalance + ' ✓', 'ok'); }

    if (fixed > 0) {
      _stats.totalFixes += fixed;
      _stats.lastFix = Date.now();
      window.globalData = data;
      localStorage.setItem('wingsfly_data', JSON.stringify(data));
      _healLog(fixed + ' টি সমস্যা fix হয়েছে! ✨', 'warn');
    } else {
      _healLog('সব ঠিক আছে 🎉', 'ok');
    }
    _updateUI();
  }

  window.autoHeal = {
    runNow: function() { _runHeal(); },
    getStats: function() { return _stats; }
  };

  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      _healLog('Auto-Heal Engine চালু (প্রতি 60s)', 'info');
      setInterval(_runHeal, 60000);
    }, 2500);
  });
})();

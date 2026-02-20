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

// =====================================================
// CERTIFICATE GENERATOR - Wings Fly Aviation Academy
// =====================================================
function generateCertificate() {
  var student = window.currentStudentForProfile;
  if (!student) {
    if (typeof showErrorToast === 'function') showErrorToast('Student profile খোলা নেই!');
    return;
  }

  var LOGO = 'data:image/png;base64,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';
  var SIGN_SHAKIB = 'data:image/png;base64,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eHW4gOkI7Fw7AdgTsk99m/hM4numM1lJjNnfj14e3dLXtramcRvB2OpkkhaWnyPbfyKrTDcV4ewe50+Pc18WwY1eQ/2cF6fVVVTaLif4mvdI4RuPmWuGh5np3pBeWWeI3hzHXGKTMqW6VOtsgtTHVhkPyD4wWb/NwXTU3JvLmdP9nx3xdJYaB+tXnL3mnaBrvqmZ8bvo4OI+asfAcf46oKNtxwWz4xBTyt7VVoggAkH/AKkY+L+q67kbmDjrAKOaXIsooGVMY7UNPKJqp59AImkuG/mdD5kIKu5gxa34Zxrds75Wyerzu9U0JbbqWtaIbbHVPBbGIqNnwEgnu5/UdNJ7aUZ/s8OPp7bj915EuVOY5bt/dLf1N0fYNdt7x9HPAH8n1Xw/ZfOvE/mVDfsst1bivGduf7SgoZSWVFcD+PXzcPN/k0HTOo7ctY2qgorVbaa226mipaOlibDBDE3pZGxo0GgfIAIOSiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgIiICIiAiIgjt6wTCL5OZ71huO3OU+b6u2QzOP6uaV/Fm4+wKy1bauz4RjVuqGnbZaS1QRPH5FrQVJUQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFx7lQ0VyoZaG40dPWUkzemWCoiEkbx8nNcCCPzXIRBU968OPCd3rHVdXgNDHI7zFJUT0rP0ZE9rR/Rdzh3C/FeIzx1Fhwa0QVMTuuOomjNRNG75tklLnNP5FT9EBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREH/2Q==';
  var SIGN_FERDOUS = 'data:image/jpeg;base64,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088skIJBBV99oBAQ9sM+8ABAAGM804AAYAc884wowwAAEc888sI8884ww48884U4Qw88McsAA8AAAAAw08MIwcIAAggIAA8Q40YwQJBBV9+4DAAAc09+xBA8M4AAsMM888wAAAAkAAAM88884wAgAAAAAAAQQUAAAAAAwAQwosEMIEMAAw0oc888oAAcIAw0sAoMBRNBW9tVpBJl8x+sJAA8wgAA48888YAAAA0Uc8888888AAoAAAEAAAAMsUMIEIAAAAAE0888888888YE8888oEIAAEAAQw89xVFlBwx8sNBA0cU40IAQMMMMgYwww8MMIEQEwww888MMMIsMMMIgMMIwgwwgQwMMMsI0c8wwwwwwwkMc8www88oAAMd884xF/vttR95AEN5zCEoMMYwgE808wkAMMc84wwgcAAAMIM888o888w8ggAwEgQgwwA0w44A88sIEAAAQo480sIAgQ4AAw88oJBBF/hxBRtNc890IBcAkAMMM88AAAcc88gAAAAM4sc8888AAAUQQgAAEIAMcEMMAAAMAAYAA088sI8kYAAAQ40848sIAAc8hItBd8ABBAtR88AAEcwAQ088884EAc8QwwAAEMs8o88884gAAAcAAAM88sc4U8888sM8McgAAAQw084ks8MAAAQocUsY8MAhV9NxxxFNNNMMcNMMMwMMMYwww8MMQww00wMMMMIAIggAw08888M8MsMMIAMQwwAAAAMAIMMMMcwgAUwgAIEMc04AA8w70MgAfhxpttCE09pAQ0U8oAEE8AkAA084IAAQoE8888ggAIEMM88888U84AAAAAAoMAAAAAAEAAgU88884sIAAAAw0Usco0VoAocVoADpRhZw4wMYEhYwkI4wwsckYwwMMMMcQ4wwwAMMM0wwwwwwwkQEMMsMcccc8sM8MMM8sMMIwwwkQw8sMAAcoQ088ABAABJhBLBlN9sIARssMIQ4UcsAQ08sAAQQ8888o0AAAU888UsAAAAAAUAAg8888888888888k88888sIcAAA88844csAAAEhJBBA8BNhJ9+9BwAU888oE8k84AAU84EgAU8888AIAAU8888YgAAAAAM8scM8888gw80ww84gY8888880kAAAAAUA8w08sYgscoBBIhBFIZ88BIswEAAE88sAA088AAQ888AAAAA8888IIAAUAU88888k8084AAAAAAAAAAAAAAAAIAAA8888888IAAE0EsAA99sxBBdM95EAMo8sYAAc8Q4QMc8sAE8s08AAAAM8008oAAAUMM8884AQ8AwAAAUAAAMEAEoAIAAAAAAA04448o888EoAw88Bl5DxYR84BoFI8cwwAI08wAMc8wwEMM84AwAMcs8wAQQwEMM4048wwwgAAAgAEMs8M88888M88MAMcIIAAAMAwA88wcsMAAQB9phB88whB098YIIM8oA0gAY88gAA088oAAAE884gQAAAA8848MQgAAEAAUsAE8s08888888888M8sAEAEcgAAEUAAgQ8oMYt1oBB885gAc88oAI04EEYcw888Ic8888IAU888sAAA8c8888AAIAAAA0AEc8888888884c888888888888cssE8kIAAAAkcMtUBANw8gA984gAI8oEUU8oowwwE8ogwgAE84w4gAEc48848AAAAAAAE88888848ww0wwUwwwwwQw88888888888sMMsogQw88AcM4BAE88oQsAsgAAI08owAIA84AQME888AIAAE88s4QAgAAAAcME888888wEAAAAAAAAAAAAAAQ4cw80488888888oAAAQxg8/90Mc88884QUIA8ssQUEM888Awww88440MQMc88YQ4AAAAYA888888kEEAIAAMcAIMMMMMIIMIE8oEYAQ0840888s8sAEBc88wsMIoI08oAQ8w8o4gU8w4UoEEcEIM8wc88088AgAAAAAE88888sIcEQAIAAEAAAAAAAAAAAgA8wAIAAAQAAw08888888F95gA8gg8MQgAAU88IgsAUc4oUg8A4YAAAE888A0oAAAIAAAA888404EIAAMMAAAAAAAAAAAAAAAAAAAE4gIAAAAAQwUc88cdoIMAggE8oAQEMo88sAAIU8sUIAUgE8gU8888wgEQAAAAAAM8888oYYIAAAUAAAAAAAAAAAAAAAAAAAAEQgQ8IIMIEAQw08888gM4ME84goE8sow880AQ088UAM8Q4AEE884wAAMUAIAAc888s88oIIAAAUYAMEAAAAAAAAAAAAAAAAAAAAAc84sYsIAAA888oA8wAk4IwoE88sggAUcc4sgUE8YkoA0s8kMoAQAwA0c88848888IcIAAAgoA4YAAAAAAAAAAQYAAAAAAAAMwEAMMosAAAU8pAM4AEcgU0k8888AAUow4EQg888I4AAUEc88AAsAAgQ888888884woAAAEcA0AAAAAAAAAAAE0oAAAAAAAAAAAAAgAAAAM88oA8oU84gE80sAwUAQ8ooAQAA08oY8gIEQ088AYoEIAAg4488888EsgAAAMwUkAAAAAAAAAAAA0AAAAAAAAAAAAAAQAMEcc88wgEQ084gc8U4IAokc8o8MQU4YcQUsAU4gcY48wQ8gAoM8csw880U8IIEEsMUkgEA0EAAsAEQAAAAIAAAAAAAAAAAAAMc8884gAE8wwEQ88oAA0o88MoAI80QcgI88sI8EkkEQ4UsQAIEgAEw08AsokoAAk4EkM40EskY4YsUIAAAAAAAAQAUIAgAc88888gMEcw4AoEsIAoE8co888oA00kE8oUI4gU4oU84ggEgcsMQkck0wUksEc8IgAUgwIoAggQ0wEAcAAIAAAAA8IAAAAIc8888cwwgcoAAAMU8AA8cM8owIAs0gUc4EIco8IAAAQ4A8cY8884UYUYgQwQ8Q88IMMcAwgAAAAAAAAAEQQAMEsAIgAAMs848848oAAAAwgE8s88gA8888AEAEcoAEU8AU08A0oAAAAgU888840ss88AQoAAUgQ8wE88sIAAAAAAAAAAAAAIAEIAIMMo888s44AQkYcM8scM8wwgAE8U8IAUAAQoAAUk88oU8sIAAkAEIAw0sUc88888s0AAAA4Eoc88gQYYossAsEAAIAAEsIMcs88888o0gAAAU88wgU888gA8084YwgAUAAAwgQkE08cM8888oQoAgAsQoA0808wwg08wIgUMkg8w8888c8sMsMkc88c888888840ggAUAAQAU8ww0884AAAU88AoAQw4EMAcgoUAc0AQ8848sc4EcIEMswIg8MsscIAQAAQ0AAQA40w0888888c8888888w88AAcAAAQMMc8oAAwA4AAAAE88oAoAAc4AAAk8kssMcAA4A08McMA808ggQQww8w48sIMMMM8IAAAgwAQww080w488w80gAAwwAAQAAYI8wwQksM0uMMMMM888gAoIE8ooIA88o0A004AsMcs88888AAAAAAAAAAAAw80888MMMIAAAAAAAAAAAwwgAwAAAAAAAEIc88sgEMMUg4KQ8MMMAMMAAM0w88o88Es8s8AAUAAkAU4088U8oAAAAAQAoAAAA88888888sAAUIAAAAAAAAAAAAAMA88g8848sM8AAMMoQ4Wu8884AAAAAcUw8oQMM8A88osMcIgcAQgU8888888csMIAAI8sAwAAAU88888U888cUUs8AAAAII88888s840gAAUMc4ws8Ame88wgAAEEM8Uc88I884A88s8088w8AQsc8888848084wwQwwgAAAAAU888c888888U8888AE888w08wAQMMIMM8swgIMwO+C6AAAIM88888U488AI4Eo88s8884AQAUU8s88888888888UoM88IMQgAAAAU84w4w888888M8888wwwAMIMMYM8w0Aww8ki++SE4wwwwwwwwIAwwUAAwAw84888sAIAEIAc888088888888888840EIAAAAAAAAAAA4gA80888AwAIAM8888sgAAUA8kuq6qO24AAAAAAAAAoEAM8AAAUA8g888888Q0888888c8888888E8s8cAAAAAAAAAAAAAAAgQw04wQAAAMME888M84IA8QcoemCmiC6AAAAAMsc888888cMAAAAAA888888U888888888888884U088oAAAIgYAAAAoAAAA4AAUogAAAAwws888A88AQEcIg6SqQSaOMcs88888880888488M8AAEAAw4888cwgAAwwwwwwwgwAAAQAAAAAgAAEM8ssMcMcsEM8s888sMMMIEc884kwgA80+MSKGWIG88844A4oQAQQAgAUg8w8s8ss8MMMMscsMMMMM888888s88888wwwww0ww04AAAQwQwAAAAAAAAgwAwwg88o088U4uWGaoSYuoQAAAAAAAAAAAAAQQww08AwwwgQ04www04w04wwww804AwwAAAAAAAAAAAAIMAAAAAAAAMIcsMMIMIAMAQAwEAcoCykYoqSqAAAAAAAAAAMMM8cMIAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMIMMI4888888888sM88888888888888MMMAAAECuKWq8aMYAAAAAAAMMM88888w088MMcM8s88MsIAAMMMMMMMcMMs888888888888888888888888888480w488488888804S2SEIMYwaw88M8888s888888888888888888888888888888888888888888888888884QwwwwQwwwwAAAAAAgAAAIAw08uWeiGSSWo+Kk88888888888888o888k88o0888888888888888888888888880888408888EMAAAAAAAAAAAAAAAAAAAAEAQ+eEQkKYcQwkA8088808888ccs88IAAAAAAwAAQAgAgAgAgAgAAAQ4wwwgAAAAAAgAAAAAwAAAAAAAAAAAAAAAAAAAAAAAkUYiaSkUQMWO4kkwwQgAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4MkEY0MswMMIYgcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE8okYckIMcg44EY0AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEYIQgMk4wgMMMc4E8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI0YwQQOU4AYAAQ0oAAAM8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYwAc4Y4YwIEcgAIAc88gE88AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQ8IAwQkQMMswwAE808wwAE88AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQww88wkMMMIQwwgMEMMc4wwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwwwww88sMMMMMMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwwwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIAAwAAABBKroJL6KbLpo6o4rpo6I66ZoZoLMJJo/8AD3na2W2KCOCWKqSqGymiSCC++iKuqOOeCyCCy+uK++KeOSCGKCyCeu+K2qiGqfy2G+eOOWeKi2Gme6iqrPLSmb6vzCOLCrHeGCGi+yqmO6OeayCSKGCy2e+WiG6W6iKC6SCCGO+iKCiG++2m6qWaCCiO+iOa6W+eWK0Eey+AK26euO3f3rDHqXiOnSyMGCDO+4yKG6Sem+mOOayCyyGu6iCOCSmO++6yy6+++O+6SyOO6mS++a+qCGCy2uy2SC2qCiWOCGGSK2ayeb3/AKzzOgSgnrpn/Mx/gsmjnussgjnsjjvrsrnvshglrusmoigjghihlmiihnrggsgkoomustusvjutsngjjoghtttjuogqjgw196B716/+2/t/Li9vlsostlnjjvmgvvvipoghvvvvvgrlvvnurvvvslhstutivrrgnlvvvggupggvpstvuihmtuqkoovsv81168/v/ojx1innpuusttojnhlvvvthvupoivrvsssgghuuvvvukvvugjsgkohvvvnvpssjjjjjjgjvkgjnjvgqgviiwjmt+wUU37z0wus88QEvrlusguntjsqhssrhmssptjjjstsjjjrhjrkvorgsiikossjhsiqijiktiriglsuvhkpjomuhnjukqhy1+/Y8x2z17nv9ih9hrjssshvggntqhloginvskkpgjjvggginmojjutvssussrjvsjjhhitjjmtgnprigkmtjjtkivsnnp9m341lo0/g+/vjhmpshjpjjnvvivpvussnvuskjgvvrnmovvrornvsgikoGjrjqgkshstvvrgkspnrpkgsiggkovqjirvoo67zx/wA8sMOcb5IML774LL4oqY7IY6J656p4YoIJrJppLI4rLLLI7I6Y44oI4YYbKLKI5Iz4765I576q5LLrY5L77457LmqJ46GfO8+/TopOsZaaq6r7roYb574pbooKKZ7pa456KIKbqLIIIJIJb7oIIIYIYbCwSwAAADwyBSw44IrLa64oLLJZKJbZerZaqeoKHe8usop76rYNb7roob7a5apLZILIa4IpL745Lb6YIJIIL7aJ4oLJrCCryYJjADLLBxrDKbrDarLIpLo64K5Lb4patb7Ms8cn/PP/AKCCnimua2GqSuSuK2+a2uuCSCW62SW+qCC+WuCCCCy+++eeCGOy+6m++4+sekyy+2qS2gy+C+++qOi6+OCCPD3jO2DfL3rw/DaiqCCCqySSW6e+qW6ii+qCGG+GmC+qGCG+aiCCe+eyeSmyGeuuky82yy+6gY8O+M8+U488cCGYquCmGSuCiWWnfKjH7SrO+PiC6GCG6W+uC2KC+C+uCCeCCCC+WCCWKKGOK+qCCCW8k8084AAE8IMMMoMMsc8AAIAYg8sAMCcg2OGu6GS++DT6jf8A48nw7jslonngnovkujsphppugjtvhrjjsltpnqgvvrssgvjmgkPgMgjnKPPPMOPOFPNPGKJGAANOOuPCKggvkrurjl22wc5p0uixmwljssnljjsjkpnttisshqhsjsqkjsrkntissmtijsMMJDDDLDOMEBMCBACGMAAMDMKNNLDCEKMBLDuHusqhktw64w4qpow5r4irtshjojolpglsinijnqipnugkuohjvvvhjmvjkojHOPPKEPOBECFIBCHAAAAAMCEPOPOIHPLOGHAIgjlsory6gw/vu7stghquivukipojgstnolusvmtqiglrggvioggtvkKCNPPNCLOIAAPPPPPPPOHPPPPPOPPLABCIEEOHGNPPChrDsvxi/k8vpnk4solphuijqjikkstmnqrvrjujusuohupmjjmvgDrBPPPOADDHPPOPMMNMMFMMMMMEMPPPPPPPBDKFEMMEHHEsvllstto1unvlrltkohnglvrsphvlujrsuggkgjnsmglruEgoBFPPIMOAPPPPPMBAAAAAAAAAAAAAAEOHMPNOPOPPBBDIFPLAms5krQ2honvgguonslhhjlhustitvjgjhktvOEHpokvmkuljHDJPABDHPPJACACAADHACDDDDDCCDCBPKBGAENPONOPDOAELOB4hvsksmogonqgksghquosijgspurtAEILvovvtvvgIhkvMNOAANPPLCGAAACAABAAAAAAAAAAAIAPMACAAAEAAMNPPPHDGIMx+4glppgirqltvovivrggsivhtELDMggvughvgtqgghNPPPPAAHONOAIAAEDAAAAAAAAAAAAAAAAAAABOICAAAAAEMFHPDID3muvotugqqpougjlrlphvhropnqlunoqggnvsohkgFPPPPMBHPPKGAMAAAGAAAAAAAAAAAAAAAAAAAABEIEPCCDCBAEMNPPAvtookugmolmgrsvvvovrnilivtljGjmujvusggnELNPPIAMNLOHKAGAAAEAAFMAAAAAAAAAAAAAAAAAAAAAHPOLGLCAAAPLHqvlslqihslulvuvnjvormrpqukmgKvikkpjqgBkrvCIAFABNPHPHJCAAAKAABMAAAAAAAAAAABAAAAAAAADMBADDKLAAAFPK9smnuppuqtilvqtvqqsukkpkjgmOnvquovvgoOMsnLAAAABPPPOLKAAAAOAJHAAAAAAAAAAABOAAAAAAAAAAAAAIAAAADPCJvljqluougovovivrgqqohnvnkusLKPNJistgljDivPHFBANPPPPLIAAAGMAOAAAAAAAAAAAJIAAAAAAAAAAAAAAEADBHHPKCkipgvutonluivgvrnqvjhvnMNHGvslmApCkiCFrsCLPAPDBEPJPPCBCCIKNPIBDGBABOKBELAAACAAAAAAAAAAAAADHOMOBJimngrionvlgjiggigqgjripojgHnrhDjjPoKMKtHNGJDIFBCMPOEHGMMELJCLLDDJAGKFLNKABEAAAAAEAFCAIAHPPOMIHMGrsuglmjutjmjougjvqghqqugksiuotIrIglDrDlBvKoMENDBPEIBHPCMABADLIEIPOPJFCGACGIAAAAPCAAAACHPOALIDDHJqhnvsqljnqtjrjsigrlJqspupoqvmgtvrhvglmHtvulDFIMNDLNFMPCIDHAEIAAAAAAAAAFOIADBLACIAADLPOPHNMMOIAovougkgjotgqlvgkktnurhkkugititqggssnqgstutpHCopgEJNAKHLIHENPLCAAAAAAAAAAAAACABCACDDKPPMJBBPLDGnDopkjrgvqgkglliggghkkMovjlNlqsogghpgutvjihIJqgrgvuNggPMFNJCEELLGKPNICLADACAABLCDHLNPPJEFGHPMMNvMjnqgvvonkmtvlvoghnurjrmuPqtosggllqkqvmogFlsmoqsturCDBGMBBBFAPKAMPFPLDLDNPPPHPPPPFPMBHHGNKMAFBBGPINjvugivqhvgggpjkuojtqmrjomvrsgmrrnuhnsHuhvDKBMOgnCoEggEIKFLPBCDCAMMMMMHPPPPMMIDAAPPILPOLPDHsPohpJKghjvujnqghhvokvvnjsmhksoqvhvikhnjovpnMGJrjrsrhkriDDDDPKsMMGCMLDDCACDJEMDMCHPPDDPPJAAmGMLjrDouNFgksssgtlountuggltvlgljnimhvkMokgovvvggvqgsssusvtjsuMstjjDigsAAEuOPONPDDHPDMEsAgtAJmHqEpHpjhimuNrFivvojjvvsrgjjjrguhoklvnqvvmvqhipllvqgoqggkhlgsvvlgAAAsvvrgqFCkMOMAAFPPPHLADAPtoPOGDEMFMMPEDkoOnogtughjivonsvqhjjvkugimsptnovrmqgvvsttvnrjigqivrljsPpqggssslvtvnllrvgsMoiivvsuMLIhmHKEoDnpjhspAyvrkogvuusAlnvvmvvugjgpgilgjovpkoghvqjmrtvuosmssqgvrghqgggpgqksstlvvNtgBuuujiggsprjGrjspjkijion/AKsI45bIYIR75br75YroaqIKaoJY5a7qqoJILo4bLbqIKL5ao674o5KLLLLaoKY4Y7KoJJLI77LL4wAzL7gwwgjAxzzAIyArt7fYoIILbrLb6Yzzo44zASApqwpZJ7Y7rb6ILJJrLIIIJL777777rQQgAIJLbqrLL7YZ7wIoIIL4yAoI7LYLab77LKLoRMZPMPboIJK4bw575br7Ja476qr6D674IIK4oYIIa47rLaoK4rYb6754IBAAACIrL77D77xywwoY6777ow4SoIzIJDYL4Z7BKbqucfcoo667JKIoIo44LTL7zwAACz7b6IKoJZ7777q47K475bpbbpaoIAAiJgLT75by4JYTzSpZ7776LDK76Jb4Jb6Lawyz5ouC/ePK54oY477r7b7wBigDAyxzgwjLo44q7KY4LLLLLLrab4pKZoII4o6S45rIJJLKLKJjjA5o445rLIIYpLZLYo5LIBybTr4pPTr77zroLipIBhACABSDzAxwxBADzz75y5rbLLLIAwIIwRIAI747LKIKIaLKboQ45DJDIII64y44yLIjJKD76iQ44QwbYY/h+zOpAAABAAAQyzxCxxBDDjTwTDDCBDTjDLLbrLbrLLLLzTgjDAIIoIIIIw4447TL4wywyyzzDSBDDDTCQwA5oTIQBxRefADjP5vAAAwSzzzzzDDACDDTzQwxyzxzyQhywwQwwzzzyzSzzzywxTxzDTDDQQAQAAwwAABDAAAwwwwzwwwgQwjDDTzzzirfpLLSeSizzzzzzzDDAAAABAygADTCTARAwDBDTyzDDDDjDyjDhAAAAAADwADSwwwwwzzzzzzzzzzzzjzTDjzzjzzzzwAgxqM4CyhThLgAjAAAABAQwwwxzzzzzyxzwwxzwxwwwwwwyzwxQwywwQxzyxzzzzzzzzzzzhDDDDBDDDDAAAAAACAAAAgDDTyrYYbI6q7zpagwwwxzzzzzzzzzyjzzyTzyjTzzzzzzzzzzzzzzzzzzzzzzzzzzTzzzjTzzzwQwAAAAAAAAAAAAAAAAAAAARgyrKxjR6hyAhSzzTzzzTzzzxxyzzwgAAAAADAABACACACACACAAABDjDDCAAAAAACAAAAADAAAAAAAAAAAAAAAAAAAAAAAAAwjbZ4xwjybrQRzDBCADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADxDRxQSRygzyhThwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASAxwzgRgBBgSSTTgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAiRhAhzTxAwiBCCTwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAjRTChh7DTgTgBDRRxygzwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAByyBiRiRSjgRhzDgBgABwTzQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAzQyCAjjwyCwzATDiAygATgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABCAAwwBTDCARzyxgzQwhiQwwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADDDAAAwxzzygAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA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';

  var studentName = (student.name || 'STUDENT NAME').toUpperCase();
  var batch = student.batch ? 'BATCH - ' + student.batch : 'BATCH - N/A';
  var sid = student.studentId || student.id || 'N/A';
  var batchId = batch + '     |     STUDENT ID : ' + sid;
  var course = (student.course || 'PROFESSIONAL VISA PROCESSING & AIR TICKETING RESERVATION COURSE (GDS)').toUpperCase();
  var today = new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'long', year:'numeric'});

  var css = '*{margin:0;padding:0;box-sizing:border-box;}html,body{width:100%;height:100%;background:#fff;}body{display:flex;justify-content:center;align-items:center;min-height:100vh;}.cert-wrap{width:1122px;height:794px;background:#f0f4f8;position:relative;overflow:hidden;}.bg-navy{position:absolute;top:0;left:0;width:480px;height:260px;background:linear-gradient(140deg,#0d1f45 0%,#1a3060 55%,#1e4080 100%);clip-path:polygon(0 0,100% 0,75% 100%,0 100%);}.bg-teal{position:absolute;top:0;left:0;width:480px;height:260px;background:linear-gradient(140deg,transparent 40%,#0aa8c0 40%,#0bbdd4 55%,transparent 56%);clip-path:polygon(0 0,100% 0,75% 100%,0 100%);opacity:0.6;}.bg-tr{position:absolute;top:0;right:0;width:300px;height:200px;background:linear-gradient(210deg,#0bbdd4 0%,#0aa8c0 40%,transparent 75%);border-radius:0 0 0 100%;}.bg-tr2{position:absolute;top:0;right:0;width:220px;height:140px;background:linear-gradient(225deg,#0d1f45 0%,#1a3060 60%,transparent 100%);border-radius:0 0 0 80%;}.bg-bl{position:absolute;bottom:0;left:0;width:340px;height:160px;background:linear-gradient(40deg,#0bbdd4 0%,#0aa8c0 45%,transparent 80%);border-radius:0 80% 0 0;}.bg-bl2{position:absolute;bottom:0;left:0;width:220px;height:110px;background:linear-gradient(45deg,#0d1f45 0%,#1a3060 60%,transparent 100%);border-radius:0 100% 0 0;}.bg-br{position:absolute;bottom:0;right:0;width:280px;height:140px;background:linear-gradient(315deg,#0d1f45 0%,#1a3060 55%,transparent 100%);border-radius:80% 0 0 0;}.gold-line-top{position:absolute;top:72px;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,#c9a84c 20%,#e8c96e 50%,#c9a84c 80%,transparent);z-index:6;}.gold-line-bot{position:absolute;bottom:72px;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,#c9a84c 20%,#e8c96e 50%,#c9a84c 80%,transparent);z-index:6;}.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:140px;font-weight:900;color:rgba(10,168,192,0.06);font-family:Georgia,serif;letter-spacing:10px;white-space:nowrap;z-index:1;}.logo-wrap{position:absolute;top:10px;left:12px;z-index:10;padding:3px;background:linear-gradient(135deg,#ff6b6b,#ffd700,#00d4ff,#c9a84c,#ff6b6b);border-radius:8px;}.logo{width:180px;display:block;border-radius:5px;background:white;padding:3px;}.medal{position:absolute;top:6px;right:14px;width:130px;z-index:10;}.content{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 90px 80px 90px;text-align:center;z-index:5;}.cert-title{font-family:Georgia,serif;font-size:62px;font-weight:900;color:#0d1f45;letter-spacing:8px;text-transform:uppercase;line-height:1;}.cert-sub{font-family:Georgia,serif;font-size:22px;font-style:italic;color:#8a7040;letter-spacing:3px;margin-bottom:6px;}.gold-ornament{color:#c9a84c;font-size:18px;letter-spacing:6px;margin:2px 0 6px 0;}.ptext{font-family:Arial,sans-serif;font-size:12.5px;color:#444;font-weight:600;margin:5px 0;letter-spacing:1px;text-transform:uppercase;}.sname{font-family:Georgia,serif;font-size:44px;font-weight:900;color:#0d1f45;letter-spacing:4px;text-transform:uppercase;margin:6px 0 8px 0;}.bid{font-family:Arial,sans-serif;font-size:17px;font-weight:700;color:#1a3060;letter-spacing:3px;text-transform:uppercase;margin:4px 0;white-space:nowrap;}.div2{width:65%;height:1px;background:linear-gradient(90deg,transparent,#aaa,transparent);margin:8px auto;}.ctext{font-family:Arial,sans-serif;font-size:11.5px;color:#444;letter-spacing:1.5px;text-transform:uppercase;line-height:1.8;font-weight:600;margin:2px 0;max-width:680px;}.idate{font-family:Georgia,serif;font-size:13px;color:#8a7040;font-style:italic;margin-top:6px;}.sig-row{position:absolute;bottom:10px;left:0;right:0;display:flex;justify-content:space-between;align-items:flex-end;padding:0 65px;z-index:10;}.sig-block{display:flex;flex-direction:column;align-items:center;width:220px;}.sig-role{font-family:Arial,sans-serif;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#0d1f45;margin-top:4px;}.sig-name{font-family:Georgia,serif;font-size:14px;font-style:italic;font-weight:700;color:#8a5a00;}@media print{html,body{margin:0;}@page{size:A4 landscape;margin:0;}}';

  var medalSVG = '<svg class="medal" viewBox="0 0 130 165" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="rR" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="25%" stop-color="#ffd700"/><stop offset="50%" stop-color="#00d4ff"/><stop offset="75%" stop-color="#c9a84c"/><stop offset="100%" stop-color="#ff6b6b"/></linearGradient><linearGradient id="rG" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e8c96e"/><stop offset="50%" stop-color="#fff0a0"/><stop offset="100%" stop-color="#c9a84c"/></linearGradient><radialGradient id="g1" cx="35%" cy="30%"><stop offset="0%" stop-color="#ffe87a"/><stop offset="55%" stop-color="#ffd700"/><stop offset="100%" stop-color="#996600"/></radialGradient><radialGradient id="g2" cx="35%" cy="30%"><stop offset="0%" stop-color="#fff5b0"/><stop offset="100%" stop-color="#cc8800"/></radialGradient><radialGradient id="g3" cx="35%" cy="30%"><stop offset="0%" stop-color="#ffe040"/><stop offset="100%" stop-color="#aa6600"/></radialGradient></defs><polygon points="42,82 54,82 46,158 32,158" fill="#1565c0"/><polygon points="42,82 54,82 54,108 42,132" fill="#1976d2"/><polygon points="76,82 88,82 98,158 84,158" fill="#1565c0"/><polygon points="76,82 88,82 76,108 88,132" fill="#1976d2"/><circle cx="65" cy="58" r="53" fill="none" stroke="url(#rR)" stroke-width="4.5"/><circle cx="65" cy="58" r="47" fill="none" stroke="url(#rG)" stroke-width="1.5" stroke-dasharray="5 3"/><circle cx="65" cy="58" r="44" fill="url(#g1)"/><circle cx="65" cy="58" r="38" fill="url(#g2)" stroke="#b8860b" stroke-width="1.2"/><circle cx="65" cy="58" r="32" fill="url(#g3)"/><polygon points="65,26 71.5,44 92,44 76,56 82.5,76 65,64 47.5,76 54,56 38,44 58.5,44" fill="#fff8dc" stroke="#cc9900" stroke-width="0.8"/></svg>';

  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificate - ' + student.name + '</title><style>' + css + '</style></head><body>' +
    '<div class="cert-wrap">' +
    '<div class="bg-navy"></div><div class="bg-teal"></div><div class="bg-tr"></div><div class="bg-tr2"></div><div class="bg-bl"></div><div class="bg-bl2"></div><div class="bg-br"></div>' +
    '<div class="gold-line-top"></div><div class="gold-line-bot"></div>' +
    '<div class="watermark">WF</div>' +
    '<div class="logo-wrap"><img class="logo" src="' + LOGO + '" alt="Logo"></div>' +
    medalSVG +
    '<div class="content">' +
    '<div class="cert-title">Certificate</div>' +
    '<div class="cert-sub">Of Appreciation</div>' +
    '<div class="gold-ornament">&#10022; &nbsp; &#10022; &nbsp; &#10022;</div>' +
    '<div class="ptext">This certificate is proudly presented for honorable achievement to</div>' +
    '<div class="sname">' + studentName + '</div>' +
    '<div class="bid">' + batchId + '</div>' +
    '<div class="div2"></div>' +
    '<div class="ctext">Certification on training about the &ldquo;' + course + '&rdquo;</div>' +
    '<div class="idate">Issue Date: ' + today + '</div>' +
    '</div>' +
    '<div class="sig-row">' +
    '<div class="sig-block"><canvas id="certCanvasShakib"></canvas><div class="sig-role">Course Co-ordinator</div><div class="sig-name">Shakib Ibna Mustafa</div></div>' +
    '<div class="sig-block"><canvas id="certCanvasFerdous"></canvas><div class="sig-role">Chairman</div><div class="sig-name">Ferdous Ahmed</div></div>' +
    '</div></div>' +
    '<script>' +
    'function removeBg(src,id,h){var i=new Image();i.onload=function(){var c=document.getElementById(id);var r=i.naturalWidth/i.naturalHeight;c.width=Math.round(h*r);c.height=h;var x=c.getContext("2d");x.drawImage(i,0,0,c.width,c.height);var d=x.getImageData(0,0,c.width,c.height);for(var j=0;j<d.data.length;j+=4){if(d.data[j]>210&&d.data[j+1]>210&&d.data[j+2]>210)d.data[j+3]=0;}x.putImageData(d,0,0);};i.src=src;}' +
    'removeBg("' + SIGN_SHAKIB + '","certCanvasShakib",54);' +
    'removeBg("' + SIGN_FERDOUS + '","certCanvasFerdous",72);' +
    'setTimeout(function(){window.print();setTimeout(function(){window.close();},1500);},800);' +
    '<\/script></body></html>';

  var pw = window.open('', '_blank', 'width=1280,height=860');
  if (!pw) {
    if (typeof showErrorToast === 'function') showErrorToast('Popup blocked! Browser এ popup allow করুন।');
    return;
  }
  pw.document.write(html);
  pw.document.close();
}
window.generateCertificate = generateCertificate;

if (typeof window.generateIdCard === 'undefined') {
  window.generateIdCard = function() {
    if (typeof showSuccessToast === 'function') showSuccessToast('ID Card feature coming soon!');
  };
}

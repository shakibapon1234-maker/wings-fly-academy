// ====================================
// WINGS FLY AVIATION ACADEMY
// ACTIVITY LOG — logActivity, Trash/Recycle Bin System
// Extracted from app.js (Phase 5)
// ====================================

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
  } catch (e) {
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
  } catch (e) {
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
    const timeStr = d.toLocaleString('en-BD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
    const dateStr = date.toLocaleString('en-BD', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const typeIconMap = { student: '🎓', finance: '💰', employee: '👤', keeprecord: '📝', keep_record: '📝', visitor: '🧑', notice: '📢', loan: '💳', idcard: '🪪' };
    const icon = typeIconMap[(d.type||'').toLowerCase()] || '📄';

    // Build display name
    let name = '';
    const t = (d.type || '').toLowerCase();
    if (t === 'student') name = d.item.name || d.item.studentName || 'Unknown Student';
    else if (t === 'finance') name = (d.item.description || d.item.category || 'Transaction') + ' — ৳' + (d.item.amount || 0);
    else if (t === 'employee') name = d.item.name || 'Unknown Employee';
    else if (t === 'keeprecord' || t === 'keep_record') name = '📝 ' + (d.item.title || d.item.content || 'Note').substring(0, 50);
    else if (t === 'visitor') name = d.item.name || d.item.visitorName || 'Visitor';
    else if (t === 'notice') name = d.item.title || 'Notice';
    else if (t === 'loan') name = (d.item.studentName || d.item.name || 'Loan') + ' — ৳' + (d.item.amount || 0);
    else name = (d.item.name || d.item.title || JSON.stringify(d.item)).substring(0, 60);

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
  const type = (trashEntry.type || '').toLowerCase();
  const itemName = item.name || item.studentName || item.title || item.content || 'Item';

  if (type === 'student') {
    if (!window.globalData.students) window.globalData.students = [];
    window.globalData.students.push(item);
    logActivity('student', 'ADD', `✅ Restored student: ${itemName}`, item);
    if (typeof render === 'function') setTimeout(() => render(window.globalData.students), 100);
    if (typeof renderStudents === 'function') setTimeout(renderStudents, 100);

  } else if (type === 'finance') {
    if (!window.globalData.finance) window.globalData.finance = [];
    window.globalData.finance.push(item);
    logActivity('finance', 'ADD', `✅ Restored transaction: ${item.description || item.category || itemName}`, item);
    if (typeof renderLedger === 'function') setTimeout(() => renderLedger(window.globalData.finance), 100);

  } else if (type === 'employee') {
    if (!window.globalData.employees) window.globalData.employees = [];
    window.globalData.employees.push(item);
    logActivity('employee', 'ADD', `✅ Restored employee: ${itemName}`, item);
    if (typeof renderEmployeeList === 'function') setTimeout(renderEmployeeList, 100);

  } else if (type === 'keeprecord' || type === 'keep_record') {
    // ✅ FIX: Keep Record → wingsfly_keep_records localStorage এ ফেরত দাও
    try {
      const KEEP_KEY = 'wingsfly_keep_records';
      const existing = JSON.parse(localStorage.getItem(KEEP_KEY) || '[]');
      if (!existing.find(r => r.id === item.id)) {
        existing.unshift(item);
        localStorage.setItem(KEEP_KEY, JSON.stringify(existing));
      }
      logActivity('keeprecord', 'ADD', `✅ Restored note: ${item.title || item.content || 'Note'}`, item);
      if (typeof renderKeepRecordNotes === 'function') setTimeout(renderKeepRecordNotes, 100);
    } catch(e) { console.warn('Keep record restore error:', e); }

  } else if (type === 'visitor') {
    if (!window.globalData.visitors) window.globalData.visitors = [];
    window.globalData.visitors.push(item);
    logActivity('visitor', 'ADD', `✅ Restored visitor: ${itemName}`, item);
    if (typeof renderVisitors === 'function') setTimeout(renderVisitors, 100);

  } else if (type === 'notice') {
    if (!window.globalData.notices) window.globalData.notices = [];
    window.globalData.notices.push(item);
    logActivity('notice', 'ADD', `✅ Restored notice: ${item.title || 'Notice'}`, item);

  } else if (type === 'loan') {
    if (!window.globalData.loans) window.globalData.loans = [];
    window.globalData.loans.push(item);
    logActivity('loan', 'ADD', `✅ Restored loan: ${itemName}`, item);
    if (typeof renderLoanSummary === 'function') setTimeout(renderLoanSummary, 100);

  } else {
    // fallback typeMap
    const typeMap = {
      'bankaccount': 'bankAccounts', 'mobileaccount': 'mobileBanking',
      'examregistration': 'examRegistrations', 'idcard': 'idCards'
    };
    const key = typeMap[type];
    if (key) {
      if (!Array.isArray(window.globalData[key])) window.globalData[key] = [];
      window.globalData[key].push(item);
      logActivity(type, 'ADD', `✅ Restored ${type}: ${itemName}`, item);
    }
  }

  // ✅ Remove from trash + sync backup
  window.globalData.deletedItems.splice(idx, 1);
  localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(window.globalData.deletedItems));
  saveToStorage();
  setTimeout(loadDeletedItems, 150);

  showSuccessToast(`✅ ${itemName} সফলভাবে restore হয়েছে!`);
  if (typeof updateGlobalStats === 'function') setTimeout(updateGlobalStats, 200);
  // Cloud sync
  if (typeof window.scheduleSyncPush === 'function') window.scheduleSyncPush('Restore: ' + type);
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


window.logActivity = logActivity;
window.moveToTrash = moveToTrash;
window.loadActivityHistory = loadActivityHistory;
window.clearActivityHistory = clearActivityHistory;
window.loadDeletedItems = loadDeletedItems;
window.restoreDeletedItem = restoreDeletedItem;
window.permanentDelete = permanentDelete;
window.emptyTrash = emptyTrash;

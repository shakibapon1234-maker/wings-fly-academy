// ════════════════════════════════════════════════════════════════
// SHARED UTILITIES
// Centralized functions to avoid code duplication across sync files.
// ════════════════════════════════════════════════════════════════

window.WingsUtils = window.WingsUtils || {};

/**
 * Ensures globalData.deletedItems is always a properly formatted object
 * and fixes legacy arrays recursively. Needs to be called before Push/Pull.
 * @param {Object} gd - The window.globalData object
 */
window.WingsUtils.ensureDeletedItemsObject = function(gd) {
  if (!gd) return;
  
  if (Array.isArray(gd.deletedItems)) {
    console.log('[WingsUtils] 🔧 Converted deletedItems array → object');
    var fixed = { students: [], finance: [], employees: [], other: [] };
    
    (gd.deletedItems || []).forEach(function(item) {
      if (!item) return;
      var t = (item.type || '').toLowerCase();
      // Heuristics to detect the type if missing type string
      if (t === 'student' || (item.item && typeof item.item.studentId !== 'undefined')) {
        fixed.students.push(item);
      } else if (t === 'finance' || (item.item && typeof item.item.amount !== 'undefined')) {
         fixed.finance.push(item);
      } else if (t === 'employee') {
         fixed.employees.push(item);
      }
    });
    
    gd.deletedItems = fixed;
  } else if (!gd.deletedItems || typeof gd.deletedItems !== 'object') {
    gd.deletedItems = { students: [], finance: [], employees: [], other: [] };
  }
  
  // Ensure properties exist as arrays
  if (!Array.isArray(gd.deletedItems.students)) gd.deletedItems.students = [];
  if (!Array.isArray(gd.deletedItems.finance)) gd.deletedItems.finance = [];
  if (!Array.isArray(gd.deletedItems.employees)) gd.deletedItems.employees = [];
  if (!Array.isArray(gd.deletedItems.other)) gd.deletedItems.other = [];
  
  return gd.deletedItems;
};

// ✅ AUTO-RUN: Convert deletedItems array → object immediately at startup
// This ensures the structure is correct before any test or sync code runs
(function _autoFixDeletedItems() {
  try {
    // Fix globalData if already loaded
    if (window.globalData) {
      window.WingsUtils.ensureDeletedItemsObject(window.globalData);
    }
    // Also fix localStorage data directly
    var raw = localStorage.getItem('wingsfly_data');
    if (raw) {
      var data = JSON.parse(raw);
      if (data && Array.isArray(data.deletedItems)) {
        window.WingsUtils.ensureDeletedItemsObject(data);
        localStorage.setItem('wingsfly_data', JSON.stringify(data));
        console.log('[WingsUtils] ✅ localStorage deletedItems array → object 변환 완료');
      }
    }
  } catch (e) {
    console.warn('[WingsUtils] Auto-fix error:', e);
  }
})();

// ============================================================
// WINGS FLY — QUICK FIX PATCH
// Fix 1: CSS handles dropdown bg (quick-fix.css)
// Fix 2: Batch Name datalist — existing batches auto-suggest
// ============================================================

(function () {

  // ── Batch Name datalist populate ──────────────────────────
  // Student modal খোলার সময় existing batch names দেখাবে
  function populateBatchDatalist() {
    const dl = document.getElementById('batchNameList');
    if (!dl) return;
    const batches = [...new Set(
      (window.globalData?.students || []).map(s => s.batch).filter(Boolean)
    )].sort();
    dl.innerHTML = batches.map(b => `<option value="${b}">`).join('');
  }

  // Student modal show হলে populate করো
  document.addEventListener('DOMContentLoaded', () => {
    const studentModal = document.getElementById('studentModal');
    if (studentModal) {
      studentModal.addEventListener('show.bs.modal', populateBatchDatalist);
    }
  });

  // populateDropdowns এর পরেও call করো (data load হলে)
  const _origPopulate = window.populateDropdowns;
  if (typeof _origPopulate === 'function') {
    window.populateDropdowns = function (...args) {
      _origPopulate.apply(this, args);
      populateBatchDatalist();
    };
  }

  window.populateBatchDatalist = populateBatchDatalist;

})();

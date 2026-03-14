// ============================================================
// WINGS FLY AVIATION ACADEMY
// sections/table-pagination-patch.js
// ============================================================
// এই ফাইলটা বাকি সব table (Visitor, Employee, Salary, Exam,
// Loan) এ pagination inject করে — কোনো render function
// ভাঙা ছাড়াই।
//
// কীভাবে কাজ করে:
//   • প্রতিটি target tbody কে MutationObserver দিয়ে watch করে
//   • Row inject হলে WFPaginator দিয়ে paginate করে
//   • Original render function কে wrap করে (monkey-patch)
//
// REQUIRES: table-pagination.js আগে load হতে হবে
// ============================================================

(function () {
  'use strict';

  // ── CONFIG: কোন tbody তে pagination লাগবে ──────────────────
  var PATCH_TABLES = [
    {
      tbodyId:       'visitorTableBody',
      barId:         'visitorPaginationBar',
      renderFnName:  'renderVisitorTable',   // window[renderFnName]
      pageSize:      20,
      scrollTarget:  'visitorTableBody'
    },
    {
      tbodyId:       'employeeTableBody',
      barId:         'employeePaginationBar',
      renderFnName:  'renderEmployeeTable',
      pageSize:      20,
      scrollTarget:  'employeeTableBody'
    },
    {
      tbodyId:       'salaryTableBody',
      barId:         'salaryPaginationBar',
      renderFnName:  'renderSalaryTable',
      pageSize:      20,
      scrollTarget:  'salaryTableBody'
    },
    {
      tbodyId:       'examResultsTableBody',
      barId:         'examPaginationBar',
      renderFnName:  'renderExamResults',
      pageSize:      20,
      scrollTarget:  'examResultsTableBody'
    },
    {
      tbodyId:       'loanDetailBody',
      barId:         'loanPaginationBar',
      renderFnName:  'renderLoanTable',
      pageSize:      20,
      scrollTarget:  'loanDetailBody'
    }
  ];

  // ── WAIT for WFPaginator ───────────────────────────────────
  function waitForPaginator(cb, tries) {
    tries = tries || 0;
    if (typeof window.WFPaginator === 'function' && typeof window.renderPaginationBar === 'function') {
      cb();
    } else if (tries < 40) {
      setTimeout(function () { waitForPaginator(cb, tries + 1); }, 150);
    } else {
      console.warn('[PaginationPatch] WFPaginator not found after 6s — patch skipped');
    }
  }

  // ── CORE: pagination bar inject করো tbody এর পরে ──────────
  function ensurePaginationBar(cfg) {
    var bar = document.getElementById(cfg.barId);
    if (bar) return bar;

    bar = document.createElement('div');
    bar.id = cfg.barId;
    bar.className = 'wf-pagination-patch-bar';

    var tbody = document.getElementById(cfg.tbodyId);
    if (!tbody) return null;

    // table → table-responsive → parent এর পরে inject করো
    var tableWrap = tbody.closest('.table-responsive')
                 || tbody.closest('table')
                 || tbody.parentElement;
    if (tableWrap && tableWrap.parentNode) {
      tableWrap.parentNode.insertBefore(bar, tableWrap.nextSibling);
    }
    return bar;
  }

  // ── PAGINATOR STATE ────────────────────────────────────────
  if (!window._wfPaginators) window._wfPaginators = {};

  // ── PATCH: tbody এর সব rows নিয়ে paginate করো ────────────
  function patchTbody(cfg) {
    var tbody = document.getElementById(cfg.tbodyId);
    if (!tbody) return;

    var allRows = Array.from(tbody.querySelectorAll('tr'));
    if (allRows.length === 0) {
      // empty state — bar লুকাও
      var existingBar = document.getElementById(cfg.barId);
      if (existingBar) existingBar.innerHTML = '';
      return;
    }

    // শুধু একটি "no data" row থাকলে pagination লাগবে না
    if (allRows.length === 1) {
      var onlyRow = allRows[0];
      var tdCount = onlyRow.querySelectorAll('td').length;
      if (tdCount <= 1) {
        var existingBar2 = document.getElementById(cfg.barId);
        if (existingBar2) existingBar2.innerHTML = '';
        return;
      }
    }

    // pageSize মনে রাখো
    var existingPg = window._wfPaginators[cfg.tbodyId];
    var pageSize = existingPg ? existingPg.pageSize : cfg.pageSize;

    // সব rows কে data array হিসেবে নাও (DOM elements)
    var pg = new window.WFPaginator(allRows, pageSize);
    window._wfPaginators[cfg.tbodyId] = pg;

    // সব rows hide করো
    allRows.forEach(function (r) { r.style.display = 'none'; });

    // current page এর rows দেখাও
    function showPage(page) {
      allRows.forEach(function (r) { r.style.display = 'none'; });
      pg.getPage(page).forEach(function (r) { r.style.display = ''; });

      var bar = ensurePaginationBar(cfg);
      if (!bar) return;

      window.renderPaginationBar(
        cfg.barId,
        pg,
        function (newPage) {
          showPage(newPage);
          if (typeof window.scrollToTableTop === 'function') {
            window.scrollToTableTop(cfg.scrollTarget);
          }
        },
        { pageSizes: [10, 20, 50, 100] }
      );
    }

    ensurePaginationBar(cfg);
    showPage(1);
  }

  // ── MUTATION OBSERVER: tbody content বদলালে re-patch ───────
  var _observers = {};

  function watchTbody(cfg) {
    // পুরনো observer বন্ধ করো
    if (_observers[cfg.tbodyId]) {
      _observers[cfg.tbodyId].disconnect();
    }

    function tryAttach(attempts) {
      var tbody = document.getElementById(cfg.tbodyId);
      if (!tbody) {
        if (attempts < 30) setTimeout(function () { tryAttach(attempts + 1); }, 300);
        return;
      }

      var debounceTimer = null;

      var observer = new MutationObserver(function () {
        // debounce — render শেষ হওয়ার পরে patch করো
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(function () {
          patchTbody(cfg);
        }, 80);
      });

      observer.observe(tbody, { childList: true, subtree: false });
      _observers[cfg.tbodyId] = observer;

      // Initial patch যদি এখনই data থাকে
      patchTbody(cfg);
    }

    tryAttach(0);
  }

  // ── MONKEY-PATCH render functions ─────────────────────────
  // render function call হলে page 1 এ reset করো
  function monkeyPatchRenderFn(cfg) {
    if (!cfg.renderFnName) return;

    function doWrap() {
      var orig = window[cfg.renderFnName];
      if (typeof orig !== 'function') return false;
      if (orig._wfPatched) return true; // ইতিমধ্যে patched

      window[cfg.renderFnName] = function () {
        var result = orig.apply(this, arguments);
        // render এর পরে paginator reset করো page 1 এ
        var pg = window._wfPaginators && window._wfPaginators[cfg.tbodyId];
        if (pg) pg.currentPage = 1;
        return result;
      };
      window[cfg.renderFnName]._wfPatched = true;
      return true;
    }

    // এখনই try করো, না পারলে retry
    if (!doWrap()) {
      var attempts = 0;
      var timer = setInterval(function () {
        if (doWrap() || attempts++ > 20) clearInterval(timer);
      }, 500);
    }
  }

  // ── INIT ───────────────────────────────────────────────────
  waitForPaginator(function () {
    PATCH_TABLES.forEach(function (cfg) {
      watchTbody(cfg);
      monkeyPatchRenderFn(cfg);
    });

    // switchTab hook — tab switch এ pagination bar re-init
    var origSwitchTab = window.switchTab;
    if (typeof origSwitchTab === 'function' && !origSwitchTab._wfPgPatched) {
      window.switchTab = function (tabName) {
        var result = origSwitchTab.apply(this, arguments);
        // tab switch এর পরে সেই tab এর table patch করো
        setTimeout(function () {
          PATCH_TABLES.forEach(function (cfg) {
            var tbody = document.getElementById(cfg.tbodyId);
            if (tbody && tbody.querySelectorAll('tr').length > 0) {
              patchTbody(cfg);
            }
          });
        }, 200);
        return result;
      };
      window.switchTab._wfPgPatched = true;
    }

    console.log('✅ table-pagination-patch.js — watching', PATCH_TABLES.length, 'tables');
  });

  // ── GLOBAL EXPOSE (manual re-patch করতে পারবেন) ──────────
  window.wfRepatchTable = function (tbodyId) {
    var cfg = PATCH_TABLES.find(function (c) { return c.tbodyId === tbodyId; });
    if (cfg) patchTbody(cfg);
  };

})();

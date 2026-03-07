/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * SECTION LOADER — Modal Lazy Load System (V2-Robust)
 * File: sections/section-loader.js
 * ============================================================
 */

(function () {
  'use strict';

  const _loaded = new Set();
  const _loading = new Map(); // Track ongoing fetches

  async function loadAndOpen(placeholderId, htmlFile, modalId, onLoaded) {
    console.log('[SectionLoader] 📥 Attempting to load/open:', modalId, 'from', htmlFile);

    // If already loaded, just show it
    if (_loaded.has(modalId)) {
      console.log('[SectionLoader] 🟢 Already loaded, showing modal:', modalId);
      _showModal(modalId);
      if (typeof onLoaded === 'function') onLoaded();
      return;
    }

    // If already loading this file, wait for it
    if (_loading.has(htmlFile)) {
      console.log('[SectionLoader] ⏳ Already loading, waiting:', htmlFile);
      await _loading.get(htmlFile);
      _showModal(modalId);
      if (typeof onLoaded === 'function') onLoaded();
      return;
    }

    const loadPromise = (async () => {
      try {
        console.log('[SectionLoader] 📡 Fetching HTML:', htmlFile);
        const res = await fetch(htmlFile + '?v=' + Date.now());
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const html = await res.text();

        const el = document.getElementById(placeholderId);
        if (!el) {
          console.error('[SectionLoader] ❌ Placeholder NOT FOUND in DOM:', placeholderId);
          alert('Error: Placeholder "' + placeholderId + '" missing! Check index.html');
          return;
        }

        // We append if it's the "__modalPlaceholderOther" to allow multiple modals to coexist
        if (placeholderId === '__modalPlaceholderOther') {
          const container = document.createElement('div');
          container.innerHTML = html;
          el.appendChild(container);
          _reExecScripts(container);
        } else {
          el.innerHTML = html;
          _reExecScripts(el);
        }

        console.log('[SectionLoader] ✅ Injection complete for:', modalId);
        _loaded.add(modalId);

        if (typeof onLoaded === 'function') {
          try { onLoaded(); } catch (e) { console.error('[SectionLoader] onLoaded error:', e); }
        }

        // Small delay to ensure DOM is ready
        setTimeout(() => {
          console.log('[SectionLoader] 🚀 Showing modal now:', modalId);
          _showModal(modalId);
        }, 100);

      } catch (err) {
        console.error('[SectionLoader] ❌ Failed to load:', htmlFile, err);
        if (typeof window.showErrorToast === 'function') {
          window.showErrorToast('❌ Modal লোড ব্যর্থ: ' + err.message);
        } else {
          alert('Modal লোড ব্যর্থ: ' + err.message);
        }
      } finally {
        _loading.delete(htmlFile);
      }
    })();

    _loading.set(htmlFile, loadPromise);
    await loadPromise;
  }

  function _reExecScripts(parentEl) {
    const scripts = parentEl.querySelectorAll('script');
    scripts.forEach(function (oldScript) {
      const newScript = document.createElement('script');
      if (oldScript.src) {
        newScript.src = oldScript.src;
      } else {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  }

  function _showModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) {
      console.warn('[SectionLoader] ⚠️ Modal element NOT FOUND in DOM after injection:', modalId);
      return;
    }
    try {
      if (typeof bootstrap === 'undefined') {
        console.error('[SectionLoader] ❌ Bootstrap is NOT LOADED!');
        alert('Fatal Error: Bootstrap is missing!');
        return;
      }
      const modal = bootstrap.Modal.getOrCreateInstance(el);
      modal.show();
    } catch (e) {
      console.error('[SectionLoader] ❌ Error showing modal:', e);
    }
  }

  // --- Patching Functions ---

  function _patchAll() {
    console.log('[SectionLoader] 🔄 Patching global functions...');

    // 1. Settings
    window.openSettings = window.openSettingsModal = function () {
      loadAndOpen(
        '__modalPlaceholderSettings',
        'sections/settings-modal.html',
        'settingsModal',
        function () {
          // Re-init tabs
          if (typeof window.switchSettingsTab === 'function') {
            const activeBtn = document.querySelector('#settingsModal .nav-link.active') || document.querySelector('#settingsModal .nav-link');
            if (activeBtn) {
              const match = (activeBtn.getAttribute('onclick') || '').match(/'([^']+)'/);
              if (match) window.switchSettingsTab(match[1], activeBtn);
            }
          }
        }
      );
    };

    // 2. Add Transaction / Finance
    window.openAddTransaction = window.openFinanceModal = function (type) {
      loadAndOpen('__modalPlaceholderOther', 'sections/modals.html', 'financeModal', function () {
        // ✅ FIX: Populate dropdowns (centralized in ledger-render.js)
        if (typeof window.populateDropdowns === 'function') {
          setTimeout(window.populateDropdowns, 100);
        }
        if (typeof window.updateFinanceCategoryOptions === 'function') {
          if (type) {
            const typeSelect = document.querySelector('#financeModal select[name="type"]');
            if (typeSelect) {
              typeSelect.value = type.charAt(0).toUpperCase() + type.slice(1);
              window.updateFinanceCategoryOptions();
            }
          } else {
            window.updateFinanceCategoryOptions();
          }
        }
        // ✅ Re-attach listener for subsequent opens
        const fm = document.getElementById('financeModal');
        if (fm && typeof window.populateDropdowns === 'function') {
          fm.addEventListener('show.bs.modal', window.populateDropdowns);
        }
      });
    };

    // 4. Employee (openStudentModal is defined in student-management.js)
window.openEmployeeModal = function (id) {
  loadAndOpen('__modalPlaceholderOther', 'sections/modals.html', 'employeeModal', function () {
    if (typeof window.initEmployeeModal === 'function') window.initEmployeeModal(id);
  });
};

// 5. Attendance
window.openAttendanceModal = function () {
  loadAndOpen('__modalPlaceholderOther', 'sections/modals-other.html', 'attendanceModal', function () {
    if (typeof window.populateDropdowns === 'function') {
      setTimeout(window.populateDropdowns, 100);
    }
    // ✅ Re-attach listener
    const am = document.getElementById('attendanceModal');
    if (am && typeof window.populateDropdowns === 'function') {
      am.addEventListener('show.bs.modal', window.populateDropdowns);
    }
  });
};

// 7. Visitor
window.openVisitorModal = function () {
  loadAndOpen('__modalPlaceholderOther', 'sections/modals-other.html', 'visitorModal', function () {
    if (typeof window.populateDropdowns === 'function') {
      setTimeout(window.populateDropdowns, 100);
    }
    // ✅ Re-attach listener
    const vm = document.getElementById('visitorModal');
    if (vm && typeof window.populateDropdowns === 'function') {
      vm.addEventListener('show.bs.modal', window.populateDropdowns);
    }
  });
};

// 6. Exam Registration
window.openExamRegistration = function () {
  loadAndOpen('__modalPlaceholderOther', 'sections/modals-other.html', 'examRegistrationModal', function () {
    // ✅ Populate everything related to exams
    if (typeof window.populateDropdowns === 'function') {
      setTimeout(window.populateDropdowns, 100);
    }
    if (typeof window.populateExamModal === 'function') {
      window.populateExamModal();
    }
    // ✅ Re-attach listener for subsequent opens
    const em = document.getElementById('examRegistrationModal');
    if (em && typeof window.populateDropdowns === 'function') {
      em.addEventListener('show.bs.modal', window.populateDropdowns);
    }
    if (em && typeof window.populateExamModal === 'function') {
      em.addEventListener('show.bs.modal', window.populateExamModal);
    }
  });
};
  }

function init() {
  console.log('[SectionLoader] 🏁 Initializing System...');
  _patchAll();

  // Preload
  setTimeout(() => {
    fetch('sections/settings-modal.html?v=' + Date.now()).catch(() => { });
  }, 5000);

  console.log('[SectionLoader] 🚀 System successfully initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Backup patch
setTimeout(_patchAll, 2000);

window.sectionLoader = {
  loadAndOpen: loadAndOpen,
  isLoaded: id => _loaded.has(id)
};

}) ();

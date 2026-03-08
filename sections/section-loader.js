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
        // FIX: file:// protocol avoids query params that can block local fetches in some browsers
        const isFileProtocol = window.location.protocol === 'file:';
        const url = isFileProtocol ? htmlFile : htmlFile + '?v=' + Date.now();
        const res = await fetch(url);
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
        if (typeof window.updateFinanceCategoryOptions === 'function') {
          if (type) {
            const typeSelect = document.querySelector('#financeModal select[name="type"]');
            if (typeSelect) {
              typeSelect.value = type.charAt(0).toUpperCase() + type.slice(1);
              window.updateFinanceCategoryOptions();
            }
          }
        }
      });
    };

    // 3. Student
    window.openStudentModal = function (id) {
      loadAndOpen('__modalPlaceholderOther', 'sections/modals-student.html', 'studentModal', function () {
        if (typeof window.initStudentModal === 'function') window.initStudentModal(id);
      });
    };

    // 4. Employee
    window.openEmployeeModal = function (id) {
      loadAndOpen('__modalPlaceholderOther', 'sections/modals.html', 'employeeModal', function () {
        if (typeof window.initEmployeeModal === 'function') window.initEmployeeModal(id);
      });
    };

    // 5. & 6. Attendance & Notice Board 
    // These are handled by their respective modules (student-management.js, index.html)
    // No redundant global patching needed here.
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

})();

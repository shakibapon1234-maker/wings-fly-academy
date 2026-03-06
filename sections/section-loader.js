/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * SECTION LOADER — Modal Lazy Load System
 * File: sections/section-loader.js
 * ============================================================
 */

(function () {
  'use strict';

  const _loaded = new Set();
  const _origValues = {};

  async function loadAndOpen(placeholderId, htmlFile, modalId, onLoaded) {
    if (_loaded.has(modalId)) {
      _openModal(modalId);
      if (typeof onLoaded === 'function') onLoaded();
      return;
    }

    try {
      console.log('[SectionLoader] Loading:', htmlFile);
      const res = await fetch(htmlFile + '?v=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();

      const el = document.getElementById(placeholderId);
      if (el) {
        el.innerHTML = html;
        // Re-execute scripts
        const scripts = el.querySelectorAll('script');
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

      _loaded.add(modalId);

      if (typeof onLoaded === 'function') {
        try { onLoaded(); } catch (e) { console.error('[SectionLoader] onLoaded error:', e); }
      }

      setTimeout(function () {
        _openModal(modalId);
      }, 100);

    } catch (err) {
      console.error('[SectionLoader] Failed to load:', htmlFile, err);
      if (typeof window.showErrorToast === 'function') {
        window.showErrorToast('❌ Modal লোড ব্যর্থ: ' + err.message);
      }
    }
  }

  function _openModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) {
      console.warn('[SectionLoader] Modal element not found:', modalId);
      return;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(el);
    modal.show();
  }

  // --- Patching Functions ---

  function _patchOpenSettings() {
    window.openSettings = window.openSettingsModal = function () {
      loadAndOpen(
        '__modalPlaceholderSettings',
        'sections/settings-modal.html',
        'settingsModal',
        function () {
          console.log('[SectionLoader] Settings modal initialized');
          // Important: Initialize first tab
          if (typeof window.switchSettingsTab === 'function') {
            const activeBtn = document.querySelector('#settingsModal .nav-link.active');
            if (activeBtn) {
              const onclickStr = activeBtn.getAttribute('onclick') || '';
              const match = onclickStr.match(/'([^']+)'/);
              if (match) window.switchSettingsTab(match[1], activeBtn);
            } else {
              // Fallback if no active button
              const firstBtn = document.querySelector('#settingsModal .nav-link');
              if (firstBtn) {
                const match = (firstBtn.getAttribute('onclick') || '').match(/'([^']+)'/);
                if (match) window.switchSettingsTab(match[1], firstBtn);
              }
            }
          }
        }
      );
    };
  }

  function _patchOpenTransaction() {
    // Finance/Transaction modals are usually in modals-other.html
    window.openTransactionModal = function (type, id) {
      loadAndOpen('__modalPlaceholderOther', 'sections/modals-other.html', 'transactionModal', function () {
        if (typeof window.initTransactionModal === 'function') {
          window.initTransactionModal(type, id);
        }
      });
    };
  }

  function _patchOpenStudent() {
    window.openStudentModal = function (id) {
      loadAndOpen('__modalPlaceholderOther', 'sections/modals-other.html', 'studentModal', function () {
        if (typeof window.initStudentModal === 'function') window.initStudentModal(id);
      });
    };
  }

  function _patchOpenEmployee() {
    window.openEmployeeModal = function (id) {
      loadAndOpen('__modalPlaceholderOther', 'sections/modals-other.html', 'employeeModal', function () {
        if (typeof window.initEmployeeModal === 'function') window.initEmployeeModal(id);
      });
    };
  }

  function _preloadOther() {
    if (_loaded.has('__other_modals_loaded')) return;
    fetch('sections/modals-other.html?v=' + Date.now())
      .then(r => r.text())
      .then(html => {
        const el = document.getElementById('__modalPlaceholderOther');
        if (el) {
          el.innerHTML = html;
          _loaded.add('__other_modals_loaded');
          // Re-exec scripts
          const scripts = el.querySelectorAll('script');
          scripts.forEach(s => {
            const ns = document.createElement('script');
            if (s.src) ns.src = s.src; else ns.textContent = s.textContent;
            s.parentNode.replaceChild(ns, s);
          });
        }
      }).catch(e => console.error('[SectionLoader] Preload failed:', e));
  }

  function init() {
    _patchOpenSettings();
    _patchOpenStudent();
    _patchOpenEmployee();
    _patchOpenTransaction();

    // Preload after 4s
    setTimeout(_preloadOther, 4000);

    // Re-patch after 2s if app.js overwrote them
    setTimeout(() => {
      _patchOpenSettings();
      _patchOpenStudent();
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.sectionLoader = {
    loadAndOpen: loadAndOpen,
    isLoaded: id => _loaded.has(id)
  };

})();

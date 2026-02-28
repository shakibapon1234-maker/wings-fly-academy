/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * SECTION LOADER — Modal Lazy Load System
 * File: sections/section-loader.js
 *
 * কীভাবে কাজ করে:
 * - index.html এ modal HTML নেই
 * - প্রথমবার বোতাম চাপলে fetch() দিয়ে HTML load হয়
 * - দ্বিতীয়বার চাপলে already loaded → সাথে সাথে open
 * ============================================================
 */

(function () {
  'use strict';

  // Track কোন modals loaded হয়েছে
  const _loaded = new Set();

  /**
   * HTML ফাইল fetch করে placeholder এ inject করো
   * তারপর Bootstrap modal open করো
   */
  async function loadAndOpen(placeholderId, htmlFile, modalId, onLoaded) {
    // Already loaded? সরাসরি open করো
    if (_loaded.has(modalId)) {
      _openModal(modalId);
      return;
    }

    try {
      const res = await fetch(htmlFile + '?v=20260226_2000');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();

      const el = document.getElementById(placeholderId);
      if (el) el.innerHTML = html;

      _loaded.add(modalId);

      // onLoaded callback — scripts re-init দরকার হলে
      if (typeof onLoaded === 'function') {
        try { onLoaded(); } catch (e) { }
      }

      // Bootstrap modal open
      setTimeout(function () { _openModal(modalId); }, 30);

    } catch (err) {
      console.error('[SectionLoader] Failed to load:', htmlFile, err);
      // Fallback: error জানাও
      if (typeof window.showErrorToast === 'function') {
        window.showErrorToast('❌ Modal লোড ব্যর্থ। পেজ রিফ্রেশ করুন।');
      }
    }
  }

  function _openModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) { console.warn('[SectionLoader] Modal not found:', modalId); return; }
    const modal = bootstrap.Modal.getOrCreateInstance(el);
    modal.show();
  }

  // ─── সব modal open করার function গুলো patch করো ────────────

  // 1. Settings Modal
  function _patchOpenSettings() {
    var orig = window.openSettings || window.openSettingsModal;
    window.openSettings = window.openSettingsModal = function () {
      loadAndOpen(
        '__modalPlaceholderSettings',
        'sections/settings-modal.html',
        'settingsModal',
        function () {
          // Settings modal লোড হলে tab intercept re-apply করো
          if (typeof window.renderRecycleBin === 'function') { }
          if (typeof window.switchSettingsTab === 'function') { }
          console.log('[SectionLoader] Settings modal ready');
        }
      );
    };

    // Settings button এ click bind
    var btn = document.getElementById('btnOpenSettings') ||
      document.querySelector('[onclick*="openSettings"]') ||
      document.querySelector('[data-target="#settingsModal"]') ||
      document.querySelector('[data-bs-target="#settingsModal"]');
    if (btn) {
      btn.removeAttribute('data-bs-toggle');
      btn.removeAttribute('data-bs-target');
      btn.addEventListener('click', window.openSettings);
      console.log('[SectionLoader] Settings button patched');
    }
  }

  // 2. Student Modal
  function _patchOpenStudent() {
    var orig = window.openStudentModal;
    window.openStudentModal = function (id) {
      loadAndOpen(
        '__modalPlaceholderStudents',
        'sections/modals-student.html',
        'studentModal',
        function () {
          console.log('[SectionLoader] Student modals ready');
        }
      ).then(function () {
        // Modal খোলার পরে original function call করো
        setTimeout(function () {
          if (typeof orig === 'function' && id !== undefined) {
            // Edit mode হলে form fill করো
            if (id) _fillStudentForm(id);
          }
        }, 80);
      });
    };
  }

  function _fillStudentForm(studentId) {
    var gd = window.globalData;
    if (!gd) return;
    var student = (gd.students || []).find(function (s) {
      return String(s.id) === String(studentId) || String(s.rowIndex) === String(studentId);
    });
    if (!student) return;
    // app.js এর existing fill logic call করো
    if (typeof window._fillStudentModalFields === 'function') {
      window._fillStudentModalFields(student);
    }
  }

  // 3. Other Modals (Account, Profile, Visitor, Exam etc)
  function _patchOtherModals() {
    // এই modals যেকোনো একটা খুলতে চাইলে প্রথমে HTML load হবে
    var otherModalFunctions = [
      'openAccountModal', 'openStudentProfile', 'openVisitorModal',
      'openExamModal', 'openExamRegistration', 'openStudentPaymentModal',
      'openMobileModal', 'addMobileAccount'
    ];

    otherModalFunctions.forEach(function (fnName) {
      var orig = window[fnName];
      window[fnName] = function () {
        var args = arguments;
        var self = this;
        loadAndOpen(
          '__modalPlaceholderOther',
          'sections/modals-other.html',
          '__other_modals_loaded', // dummy modal id — শুধু load track এর জন্য
          null
        ).then(function () {
          // HTML inject হওয়ার পরে original function চালাও
          setTimeout(function () {
            if (typeof orig === 'function') orig.apply(self, args);
          }, 60);
        });

        // যদি already loaded থাকে, সরাসরি original চালাও
        if (_loaded.has('__other_modals_loaded')) {
          if (typeof orig === 'function') orig.apply(self, args);
        }
      };
    });
    console.log('[SectionLoader] Other modal functions patched');
  }

  // ─── Load করার বিশেষ case: __other_modals_loaded ────────────
  // এটা কোনো real modal ID নয়, তাই _openModal skip করতে হবে
  var _origLoadAndOpen = loadAndOpen;
  loadAndOpen = async function (placeholderId, htmlFile, modalId, onLoaded) {
    if (modalId === '__other_modals_loaded') {
      if (_loaded.has(modalId)) return Promise.resolve();
      try {
        const res = await fetch(htmlFile + '?v=20260226_2000');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const html = await res.text();
        const el = document.getElementById(placeholderId);
        if (el) el.innerHTML = html;
        _loaded.add(modalId);
        if (typeof onLoaded === 'function') try { onLoaded(); } catch (e) { }
      } catch (err) {
        console.error('[SectionLoader]', err);
      }
      return Promise.resolve();
    }
    return _origLoadAndOpen(placeholderId, htmlFile, modalId, onLoaded);
  };

  // ─── Preload: app লোড হওয়ার 3s পরে other modals preload ────
  function _preloadOtherModals() {
    if (_loaded.has('__other_modals_loaded')) return;
    // Background এ quietly load করো — user কিছু দেখবে না
    fetch('sections/modals-other.html?v=20260226_2000')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var el = document.getElementById('__modalPlaceholderOther');
        if (el) { el.innerHTML = html; _loaded.add('__other_modals_loaded'); }
        console.log('[SectionLoader] Other modals preloaded silently');
      })
      .catch(function () { });
  }

  // ─── INIT ────────────────────────────────────────────────────
  function init() {
    _patchOpenSettings();
    _patchOpenStudent();
    _patchOtherModals();

    // 3 সেকেন্ড পরে background preload
    setTimeout(_preloadOtherModals, 3000);

    // 2s পরে আবার patch (app.js override করলে)
    setTimeout(function () {
      _patchOpenSettings();
      console.log('[SectionLoader] ✅ Re-patched at 2s');
    }, 2000);

    console.log('[SectionLoader] ✅ Modal Lazy Load System ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  window.sectionLoader = {
    loadAndOpen: loadAndOpen,
    isLoaded: function (id) { return _loaded.has(id); },
    preloadAll: function () {
      _preloadOtherModals();
      fetch('sections/settings-modal.html?v=20260226_2000')
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var el = document.getElementById('__modalPlaceholderSettings');
          if (el) { el.innerHTML = html; _loaded.add('settingsModal'); }
        }).catch(function () { });
    }
  };

})();

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

    // 1b. Salary Modal
    window.openSalaryModal = function (empId) {
      const modalId = 'salaryModal';
      if (document.getElementById(modalId)) {
          if (window._openSalaryModalImpl) {
              window._openSalaryModalImpl(empId);
              return;
          }
      }
      loadAndOpen('__modalPlaceholderOther', 'sections/salary-modal.html', modalId, function () {
          if (window._openSalaryModalImpl) {
              window._openSalaryModalImpl(empId);
          } else if (typeof window.openSalaryModal === 'function' && window.openSalaryModal !== arguments.callee) {
              window.openSalaryModal(empId);
          }
      });
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

    // 3. Add Student — modal is inline in index.html, no fetch needed
    window.openStudentModal = function () {
      var modal = document.getElementById('studentModal');
      if (!modal) { console.error('[SectionLoader] studentModal not found in DOM'); return; }
      // Reset form for new student
      var form = document.getElementById('studentForm');
      if (form) form.reset();
      var rowIdx = document.getElementById('studentRowIndex');
      if (rowIdx) rowIdx.value = '';
      var title = document.getElementById('studentModalLabel');
      if (title) title.textContent = '👨‍🎓 Add New Student';
      if (typeof window.populateDropdowns === 'function') setTimeout(window.populateDropdowns, 50);
      if (typeof window.removeStudentPhoto === 'function') window.removeStudentPhoto();
      // Set today's date
      var enrollDate = document.getElementById('studentEnrollDate');
      if (enrollDate && !enrollDate.value) enrollDate.value = new Date().toISOString().split('T')[0];
      bootstrap.Modal.getOrCreateInstance(modal).show();
    };

    // 3b. Edit Student
    window.openEditStudentModal = function (index) {
      var modal = document.getElementById('studentModal');
      if (!modal) { console.error('[SectionLoader] studentModal not found in DOM'); return; }
      var students = window.globalData && window.globalData.students;
      if (!students || !students[index]) return;
      var s = students[index];
      var form = document.getElementById('studentForm');
      if (!form) return;

      form.reset();

      // ── Step 1: Course dropdown populate করো ──
      var courseSelect = document.getElementById('studentCourseSelect');
      if (courseSelect) {
        var courses = (window.globalData && window.globalData.courseNames) || [];
        courses.forEach(function (c) {
          if (![].slice.call(courseSelect.options).some(function (o) { return o.value === c; })) {
            var opt = document.createElement('option');
            opt.value = c; opt.text = c;
            courseSelect.appendChild(opt);
          }
        });
      }

      // ── Step 2: Payment Method dropdown populate করো তারপর saved value set করো ──
      var methodSelect = document.getElementById('studentMethodSelect');
      var savedMethod = s.method || s.paymentMethod || '';
      // Fallback: if previous bug overwrote it with empty or "Select Method..."
      if (!savedMethod || savedMethod.trim() === '' || typeof savedMethod === 'string' && savedMethod.toLowerCase().includes('select method')) {
        savedMethod = '';
        if (s.installments && s.installments.length > 0) {
          savedMethod = s.installments[0].method;
        } else if (window.globalData && window.globalData.finance) {
          var pmts = window.globalData.finance.filter(function (f) {
            return (f.person === s.name || f.studentId === s.studentId) &&
              f.type === 'Income' &&
              (f.category === 'Student Fee' || f.category === 'Admission Fee');
          });
          if (pmts.length > 0) {
            savedMethod = pmts[0].method;
          }
        }
        if (!savedMethod || typeof savedMethod === 'string' && savedMethod.toLowerCase().includes('select method')) {
          savedMethod = 'Cash'; // ultimate fallback
        }
      }
      if (methodSelect) {
        var methods = (window.globalData && window.globalData.paymentMethods) || ['Cash', 'Bkash', 'Nagad', 'Bank'];
        methods.forEach(function (m) {
          if (![].slice.call(methodSelect.options).some(function (o) { return o.value === m; })) {
            var opt = document.createElement('option');
            opt.value = m; opt.text = m;
            methodSelect.appendChild(opt);
          }
        });
        // saved method যদি list-এ না থাকে, add করো
        if (savedMethod && ![].slice.call(methodSelect.options).some(function (o) { return o.value === savedMethod; })) {
          var opt = document.createElement('option');
          opt.value = savedMethod; opt.text = savedMethod;
          methodSelect.appendChild(opt);
        }
        methodSelect.value = savedMethod;
        // case-insensitive fallback
        if (methodSelect.value !== savedMethod && savedMethod) {
          for (var mi = 0; mi < methodSelect.options.length; mi++) {
            if (methodSelect.options[mi].value.toLowerCase() === savedMethod.toLowerCase()) {
              methodSelect.selectedIndex = mi; break;
            }
          }
        }
      }

      // ── Step 3: বাকি সব field set করো ──
      var set = function (id, val) { var el = document.getElementById(id); if (el && val !== undefined && val !== null) el.value = val; };
      var rowIdx = document.getElementById('studentRowIndex');
      if (rowIdx) rowIdx.value = index;
      var title = document.getElementById('studentModalLabel');
      if (title) title.textContent = '✏️ Edit — ' + (s.name || '');
      set('studentName', s.name); set('studentPhone', s.phone);
      set('studentFatherName', s.fatherName); set('studentMotherName', s.motherName);
      set('studentCourseSelect', s.course); set('studentBatchInput', s.batch);
      set('studentEnrollDate', s.enrollDate); set('studentBloodGroup', s.bloodGroup);
      set('inpTotal', s.totalPayment); set('inpPaid', s.paid); set('inpDue', s.due);
      set('studentReminderDate', s.reminderDate); set('studentRemarks', s.remarks);
      var photoInput = document.getElementById('photoURLInput');
      if (photoInput) photoInput.value = s.photo || '';
      if (s.photo) {
        var preview = document.getElementById('studentPhotoPreview');
        var removeBtn = document.getElementById('removePhotoBtn');
        if (preview) { preview.src = s.photo; preview.style.display = 'block'; }
        if (removeBtn) removeBtn.style.display = 'inline-block';
      }

      // ⚠️ NOTE: populateDropdowns setTimeout বাদ — এটা set করা method value reset করে দেয়!

      bootstrap.Modal.getOrCreateInstance(modal).show();
    };

    // 4. Employee
    window.openEmployeeModal = function (id) {
      loadAndOpen('__modalPlaceholderOther', 'sections/modals.html', 'employeeModal', function () {
        if (typeof window.initEmployeeModal === 'function') window.initEmployeeModal(id);
      });
    };

    // 5. Attendance — handled by attendance-pro.js (AttendanceHub)
    // openAttendanceModal is defined in attendance-pro.js, do not override here

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

    // 7. Notice Board
    window.openNoticeModal = function () {
        loadAndOpen('__noticeBoardPlaceholder', 'sections/notice-board-modal.html', 'noticeBoardModal', function() {
            if (typeof window.initNoticeModal === 'function') window.initNoticeModal();
        });
    };
  }

  function init() {
    console.log('[SectionLoader] 🏁 Initializing System...');
    _patchAll();

    // Load static sections into placeholders immediately
    _loadStaticSections();

    // Preload
    setTimeout(() => {
      fetch('sections/settings-modal.html?v=' + Date.now()).catch(() => { });
    }, 5000);

    console.log('[SectionLoader] 🚀 System successfully initialized');
  }

  async function _loadStaticSections() {
      const sections = [
          { pid: '__accountsPlaceholder', file: 'sections/accounts-section.html' },
          { pid: '__certificatesPlaceholder', file: 'sections/certificates.html' },
          { pid: '__idcardsPlaceholder', file: 'sections/idcards.html' },
          { pid: '__studentModalsPlaceholder', file: 'sections/student-modals.html' }
      ];

      for (const s of sections) {
          try {
              const el = document.getElementById(s.pid);
              if (!el) continue;
              const res = await fetch(s.file + '?v=' + Date.now());
              if (!res.ok) continue;
              const html = await res.text();
              el.innerHTML = html;
              _reExecScripts(el);
              console.log('[SectionLoader] 💠 Loaded static section:', s.file);
          } catch (e) {
              console.warn('[SectionLoader] Failed to load static section:', s.file, e);
          }
      }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Backup patch (attendance-pro.js handles openAttendanceModal, do not re-patch)
  setTimeout(function () {
    var savedAttModal = window.openAttendanceModal;
    _patchAll();
    if (savedAttModal) window.openAttendanceModal = savedAttModal;
  }, 2000);

  window.sectionLoader = {
    loadAndOpen: loadAndOpen,
    isLoaded: id => _loaded.has(id)
  };

})();

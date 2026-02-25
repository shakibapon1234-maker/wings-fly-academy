// ============================================================
// WINGS FLY — SECTION LOADER v2.0 (ALL EAGER)
// ✅ সব section পেজ লোডেই inject হবে
// ✅ switchTab wrap নেই — app.js এর original switchTab কাজ করবে
// ✅ Modals inject হবে body-তে
// ============================================================

(function () {
  'use strict';

  const SECTIONS = [
    { id: 'dashboardOverview',  file: 'sections/dashboard.html'    },
    { id: 'studentSection',     file: 'sections/students.html'     },
    { id: 'examResultsSection', file: 'sections/exam.html'         },
    { id: 'loanSection',        file: 'sections/loans.html'        },
    { id: 'ledgerSection',      file: 'sections/ledger.html'       },
    { id: 'visitorSection',     file: 'sections/visitors.html'     },
    { id: 'employeeSection',    file: 'sections/employees.html'    },
    { id: 'accountsSection',    file: 'sections/accounts.html'     },
    { id: 'certificateSection', file: 'sections/certificates.html' },
    { id: 'idcardsSection',     file: 'sections/idcards.html'      },
  ];

  async function injectSection(id, file) {
    const el = document.getElementById(id);
    if (!el) { console.warn('⚠️ Placeholder not found:', id); return; }
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      el.innerHTML = await res.text();
      el.classList.remove('section-slot');
      console.log('%c✅ ' + id, 'color:#00d9ff');
    } catch (e) {
      console.error('❌ Failed:', id, e.message);
    }
  }

  async function injectModals() {
    const container = document.getElementById('modals-container');
    if (!container) { console.warn('⚠️ #modals-container not found'); return; }
    try {
      const res = await fetch('sections/modals.html');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      container.innerHTML = await res.text();
      console.log('%c✅ Modals loaded', 'color:#00ff88');
    } catch (e) {
      console.error('❌ Modals failed:', e.message);
    }
  }

  async function loadAll() {
    // সব section একসাথে load করো
    await Promise.all(SECTIONS.map(s => injectSection(s.id, s.file)));
    await injectModals();
    console.log('%c✅ All sections ready!', 'color:#00ff88; font-weight:bold; font-size:14px');
    // app.js কে জানাও যে সব ready
    document.dispatchEvent(new CustomEvent('wf:sectionsReady'));
  }

  // DOM ready হলে শুরু করো
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAll);
  } else {
    loadAll();
  }

  window.sectionLoader = { reload: loadAll };
})();

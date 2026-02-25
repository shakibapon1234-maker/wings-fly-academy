// ============================================================
// WINGS FLY — SECTION LOADER v1.0
// ✅ HTML sections আলাদা ফাইলে, fetch() দিয়ে inject করে
// ✅ কোনো app.js function বা event listener নষ্ট হবে না
// ✅ switchTab() এর আগে lazy section load হয়
// ✅ Modals সবসময় eager load হয় (Bootstrap কাজ করতে)
// ============================================================

(function () {
  'use strict';

  const SECTIONS = [
    { id: 'dashboardOverview',  file: 'sections/dashboard.html',    mode: 'eager' },
    { id: 'studentSection',     file: 'sections/students.html',     mode: 'eager' },
    { id: 'examResultsSection', file: 'sections/exam.html',         mode: 'eager' },
    { id: 'loanSection',        file: 'sections/loans.html',        mode: 'lazy'  },
    { id: 'ledgerSection',      file: 'sections/ledger.html',       mode: 'lazy'  },
    { id: 'visitorSection',     file: 'sections/visitors.html',     mode: 'lazy'  },
    { id: 'employeeSection',    file: 'sections/employees.html',    mode: 'lazy'  },
    { id: 'accountsSection',    file: 'sections/accounts.html',     mode: 'lazy'  },
    { id: 'certificateSection', file: 'sections/certificates.html', mode: 'lazy'  },
    { id: 'idcardsSection',     file: 'sections/idcards.html',      mode: 'lazy'  },
  ];

  const TAB_SECTION_MAP = {
    loans:        'loanSection',
    ledger:       'ledgerSection',
    visitors:     'visitorSection',
    employees:    'employeeSection',
    accounts:     'accountsSection',
    certificates: 'certificateSection',
    idcards:      'idcardsSection',
  };

  const loaded = new Set();

  async function injectSection(sectionId, file) {
    if (loaded.has(sectionId)) return;
    const el = document.getElementById(sectionId);
    if (!el) return;
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error('HTTP ' + res.status + ' — ' + file);
      const html = await res.text();
      el.innerHTML = html;
      el.classList.remove('section-slot');
      loaded.add(sectionId);
      document.dispatchEvent(new CustomEvent('wf:sectionLoaded', { detail: { id: sectionId } }));
      console.log('%c✅ Loaded: ' + sectionId, 'color:#00d9ff');
    } catch (err) {
      console.error('❌ Section load failed:', sectionId, err);
    }
  }

  async function injectModals() {
    if (loaded.has('__modals__')) return;
    const container = document.getElementById('modals-container');
    if (!container) return;
    try {
      const res = await fetch('sections/modals.html');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      container.innerHTML = await res.text();
      loaded.add('__modals__');
      document.dispatchEvent(new CustomEvent('wf:modalsLoaded'));
      console.log('%c✅ Modals loaded', 'color:#00ff88');
    } catch (err) {
      console.error('❌ Modals load failed:', err);
    }
  }

  async function bootEager() {
    const eagerSections = SECTIONS.filter(s => s.mode === 'eager');
    await Promise.all(eagerSections.map(s => injectSection(s.id, s.file)));
    await injectModals();
    console.log('%c✅ Wings Fly: All eager sections ready', 'color:#00ff88;font-weight:bold');
  }

  function wrapSwitchTab() {
    if (typeof window.switchTab !== 'function') {
      setTimeout(wrapSwitchTab, 100);
      return;
    }
    if (window._wfSectionLoaderWrapped) return;
    window._wfSectionLoaderWrapped = true;

    const orig = window.switchTab;
    window.switchTab = async function (tab, refreshStats = true) {
      const sectionId = TAB_SECTION_MAP[tab];
      if (sectionId && !loaded.has(sectionId)) {
        const cfg = SECTIONS.find(s => s.id === sectionId);
        if (cfg) await injectSection(cfg.id, cfg.file);
      }
      return orig.call(this, tab, refreshStats);
    };
    console.log('%c✅ switchTab wrapped for lazy loading', 'color:#b537f2');
  }

  window.sectionLoader = {
    load: (id) => { const cfg = SECTIONS.find(s => s.id === id); if (cfg) return injectSection(cfg.id, cfg.file); },
    isLoaded: (id) => loaded.has(id),
    loadAll: () => Promise.all(SECTIONS.map(s => injectSection(s.id, s.file))),
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { bootEager(); wrapSwitchTab(); });
  } else {
    bootEager(); wrapSwitchTab();
  }

})();

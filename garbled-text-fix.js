// ============================================================
// WINGS FLY AVIATION ACADEMY
// garbled-text-fix.js — হিজিবিজি লেখা প্রতিরোধ
// ============================================================
// সমস্যা: কোনো section lazy-load হওয়ার সময় যদি JS function
// না পাওয়া যায়, তাহলে raw code বা placeholder text দেখায়।
// এই fix: সব section container গুলো প্রথমে hidden রাখে,
// content fully render হলে দেখায়।
// ============================================================

(function () {
  'use strict';

  // ── 1. Settings section এবং analytics container গুলো
  //       render complete হওয়ার আগে flash দেখাবে না ────────
  var PROTECTED_IDS = [
    'settingsSection',
    'accountAnalyticsContainer',
    'accountAnalyticsModal',
    'analyticsContainer',
    '__modalPlaceholderSettings',
    '__modalPlaceholderOther'
  ];

  // যদি কোনো element এর textContent এ raw JS code এর মতো
  // কিছু থাকে সেটা clear করো
  var GARBLED_PATTERNS = [
    /window\._show[A-Za-z]+Impl\s*=/,
    /Implementation Wrapper/,
    /var raw = localStorage\.getItem/,
    /\.forEach\(function\(f\)\s*\{/,
    /console\.log\('\[Analytics\]/,
    /window\.globalData\s*=\s*Object\.assign/
  ];

  function clearGarbledText(el) {
    if (!el) return;
    var text = el.textContent || '';
    var isGarbled = GARBLED_PATTERNS.some(function (p) { return p.test(text); });
    if (isGarbled) {
      // শুধু text node গুলো check করো, child elements রাখো
      el.childNodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          var t = node.textContent || '';
          if (GARBLED_PATTERNS.some(function (p) { return p.test(t); })) {
            node.textContent = '';
          }
        }
      });
    }
  }

  // ── 2. MutationObserver দিয়ে garbled text detect করো ───────
  var observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (m) {
      m.addedNodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          var text = node.textContent || '';
          var isGarbled = GARBLED_PATTERNS.some(function (p) { return p.test(text); });
          if (isGarbled && node.parentElement) {
            // parent hide করো এবং soon দেখাও
            var parent = node.parentElement;
            var orig = parent.style.visibility;
            parent.style.visibility = 'hidden';
            setTimeout(function () {
              node.textContent = '';
              parent.style.visibility = orig || '';
            }, 50);
          }
        }
      });
    });
  });

  // DOM ready হলে observe শুরু করো
  function startObserver() {
    var targets = PROTECTED_IDS.map(function (id) {
      return document.getElementById(id);
    }).filter(Boolean);

    // fallback: dashboardSection এর মধ্যে settings area
    var dashSection = document.getElementById('dashboardSection');
    if (dashSection) targets.push(dashSection);

    targets.forEach(function (el) {
      observer.observe(el, { childList: true, subtree: true, characterData: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    startObserver();
  }

  // ── 3. switchSettingsTab wrap করো — sub-tab switch এও
  //       scroll top এ যাবে ─────────────────────────────────
  var _origSwitchSettingsTab = null;

  function patchSwitchSettingsTab() {
    if (typeof window.switchSettingsTab !== 'function') return;
    // ✅ RECURSION GUARD: Only patch once, ever
    if (window.switchSettingsTab._garbledSettingsTabPatched) return;

    _origSwitchSettingsTab = window.switchSettingsTab;
    
    // Create wrapper
    var wrappedSwitchSettingsTab = function (tabName) {
      // ✅ SAFETY: Avoid calling ourselves - detect recursive pattern
      if (wrappedSwitchSettingsTab._isInProgress) {
        console.warn('[garbled-text-fix] switchSettingsTab call in progress, ignoring recursive call');
        return;
      }
      
      wrappedSwitchSettingsTab._isInProgress = true;
      try {
        // settings এর sub-tab switch এও scroll to top
        try {
          var mainContent = document.getElementById('mainContent')
            || document.querySelector('.main-content')
            || document.querySelector('.content-area')
            || document.querySelector('main');
          if (mainContent) mainContent.scrollTop = 0;
          window.scrollTo({ top: 0, behavior: 'instant' });
        } catch (e) { /* ignore */ }

        return _origSwitchSettingsTab.apply(this, arguments);
      } finally {
        wrappedSwitchSettingsTab._isInProgress = false;
      }
    };
    
    wrappedSwitchSettingsTab._garbledSettingsTabPatched = true;
    window.switchSettingsTab = wrappedSwitchSettingsTab;
    console.log('✅ garbled-text-fix: switchSettingsTab patched (scroll to top + recursion guard)');
  }

  // switchSettingsTab load হওয়ার পর patch করো
  setTimeout(patchSwitchSettingsTab, 800);

  // ── 4. Tab switch এ settings section এর garbled text clean ─
  var _origSwitchTab = null;

  function patchSwitchTab() {
    if (typeof window.switchTab !== 'function') return;
    // ✅ RECURSION GUARD: Only patch once, ever
    if (window.switchTab._garbledSwitchTabPatched) return;

    // Save original (or the already-wrapped original from another wrapper)
    _origSwitchTab = window.switchTab;
    
    // Create wrapper
    var wrappedSwitchTab = function (tabName) {
      // ✅ SAFETY: Avoid calling ourselves - detect recursive pattern
      if (wrappedSwitchTab._isInProgress) {
        console.warn('[garbled-text-fix] switchTab call in progress, ignoring recursive call');
        return;
      }
      
      wrappedSwitchTab._isInProgress = true;
      try {
        var result = _origSwitchTab.apply(this, arguments);

        // settings tab এ গেলে 200ms পর garbled check করো
        if (tabName === 'settings' || tabName === 'accounts') {
          setTimeout(function () {
            PROTECTED_IDS.forEach(function (id) {
              clearGarbledText(document.getElementById(id));
            });
          }, 200);
        }

        return result;
      } finally {
        wrappedSwitchTab._isInProgress = false;
      }
    };
    
    wrappedSwitchTab._garbledSwitchTabPatched = true;
    window.switchTab = wrappedSwitchTab;
    console.log('✅ garbled-text-fix: switchTab patched (garbled cleanup + recursion guard)');
  }

  setTimeout(patchSwitchTab, 1500);

  console.log('✅ garbled-text-fix.js loaded');

})();

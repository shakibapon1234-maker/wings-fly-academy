/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * SYNC & PAYMENT GUARD — v1.0
 * ============================================================
 *
 * এই module sync system এবং payment methods এর উপর নজর রাখে।
 * যদি কিছু ভুল হয় → admin কে সাথে সাথে alert দেয়।
 *
 * CHECKS:
 *  Sync Guard:
 *   1. moveToTrash / restoreDeletedItem / logActivity override ঠিক আছে কিনা
 *   2. globalData.deletedItems structure ঠিক আছে কিনা (object, array না)
 *   3. Supabase connection আছে কিনা
 *   4. Push/Pull lock stuck আছে কিনা
 *   5. Data integrity before push
 *
 *  Payment Methods Guard:
 *   6. Finance entries যে accounts রেফার করে সেগুলো আছে কিনা
 *   7. Account balance consistency
 *   8. Loan entries income/expense এ count হচ্ছে কিনা
 *
 * Public API:
 *   syncGuard.run()       → manual check চালাও
 *   syncGuard.status()    → last check result দেখো
 *   syncGuard.silence()   → alert বন্ধ করো
 * ============================================================
 */

(function () {
  'use strict';

  if (window._syncGuardLoaded) return;
  window._syncGuardLoaded = true;

  // ── SOUND ALERT — guard RED হলে "tuk tuk" শব্দ ─────────
  var _lastAlertTime = 0;
  function _playAlert() {
    var now = Date.now();
    if (now - _lastAlertTime < 10000) return; // ১০ সেকেন্ডে একবারই
    _lastAlertTime = now;
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 200].forEach(function(delay) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = 800;
        gain.gain.value = 0.15;
        osc.start(ctx.currentTime + delay / 1000);
        osc.stop(ctx.currentTime + delay / 1000 + 0.08);
      });
    } catch(e) { /* audio not supported */ }
  }

  var _silenced = false;
  var _lastStatus = null;

  // ── EXPECTED VALUES ───────────────────────────────────────

  var EXPECTED_SYNC_FUNCTIONS = [
    'moveToTrash',
    'restoreDeletedItem',
    'logActivity',
    'permanentDelete',
    'saveToStorage',
    'scheduleSyncPush',
    'markDirty',
    'feApplyEntryToAccount',
    'feCalcStats',
    'feSoftDeleteEntry',
    'feRestoreEntry'
  ];

  // moveToTrash এবং restoreDeletedItem কোন file থেকে আসা উচিত
  var TRASH_SOURCE_FILE = 'recycle-bin-fix.js';

  // ── MAIN CHECK ────────────────────────────────────────────

  function runGuard(silent) {
    var gd = window.globalData;
    var issues = [];
    var warnings = [];

    // ══════════════════════════════════════════════════════
    // SYNC GUARD CHECKS
    // ══════════════════════════════════════════════════════

    // ── CHECK 1: Critical sync functions exist ─────────────
    EXPECTED_SYNC_FUNCTIONS.forEach(function (fn) {
      if (typeof window[fn] !== 'function') {
        issues.push('Sync function missing: ' + fn);
      }
    });

    // ── CHECK 2: deletedItems structure ────────────────────
    if (gd) {
      if (Array.isArray(gd.deletedItems)) {
        issues.push('gd.deletedItems is an ARRAY — should be {students:[], finance:[], employees:[], other:[]}. Data loss risk!');
      } else if (gd.deletedItems && typeof gd.deletedItems === 'object') {
        var requiredCats = ['students', 'finance', 'employees', 'other'];
        requiredCats.forEach(function (cat) {
          if (!Array.isArray(gd.deletedItems[cat])) {
            warnings.push('gd.deletedItems.' + cat + ' is not an array — fixing...');
            gd.deletedItems[cat] = [];
          }
        });
      } else {
        warnings.push('gd.deletedItems is missing or null');
      }
    }

    // ── CHECK 3: Supabase connection ───────────────────────
    if (typeof window.getWingsSupabaseClient === 'function') {
      var client = window.getWingsSupabaseClient();
      if (!client) {
        warnings.push('Supabase client is null — cloud sync will not work');
      }
    } else {
      warnings.push('getWingsSupabaseClient function not found');
    }

    // Check config key
    if (window.SUPABASE_CONFIG) {
      var key = window.SUPABASE_CONFIG.KEY || '';
      if (!key || key.trim() === '') {
        issues.push('Supabase API key is EMPTY — all cloud operations will fail silently');
      }
      if (key.includes('service_role')) {
        issues.push('SECURITY RISK: Service role key detected in client-side code! Use anon key only.');
      }
    }

    // ── CHECK 4: Push/Pull lock status ─────────────────────
    if (typeof window.wingsSync === 'function' || (window.wingsSync && typeof window.wingsSync === 'object')) {
      // Check if sync status shows stuck
      try {
        var syncStatus = window.wingsSync.getStatus ? window.wingsSync.getStatus() : null;
        if (syncStatus && syncStatus.busy) {
          warnings.push('Sync appears busy/stuck — may need manual reset');
        }
        // V39: Check egress throttle
        if (syncStatus && (syncStatus.egressToday ?? syncStatus.egress) >= 500) {
          issues.push('Egress hard-throttled (' + (syncStatus.egressToday ?? syncStatus.egress) + ' requests) — Cloud sync বন্ধ');
        }
      } catch (e) { /* ignore */ }
    }

    // ── CHECK 5: Data integrity ────────────────────────────
    if (gd) {
      // globalData should have these arrays
      var requiredArrays = ['students', 'finance', 'employees'];
      requiredArrays.forEach(function (key) {
        if (gd[key] && !Array.isArray(gd[key])) {
          issues.push('gd.' + key + ' is not an array — data corruption risk!');
        }
      });

      // Finance entries should have required fields
      if (Array.isArray(gd.finance)) {
        var badEntries = 0;
        gd.finance.forEach(function (f) {
          if (!f._deleted && (!f.type || (!f.amount && f.amount !== 0))) {
            badEntries++;
          }
        });
        if (badEntries > 0) {
          warnings.push(badEntries + ' finance entries missing type or amount');
        }
      }
    }

    // ══════════════════════════════════════════════════════
    // PAYMENT METHODS GUARD CHECKS
    // ══════════════════════════════════════════════════════

    if (gd) {
      // ── CHECK 6: Finance entries reference valid accounts ──
      var accountNames = new Set();
      accountNames.add('Cash');
      (gd.bankAccounts || []).forEach(function (a) { accountNames.add(a.name); });
      (gd.mobileBanking || []).forEach(function (a) { accountNames.add(a.name); });

      var orphanMethods = {};
      (gd.finance || []).forEach(function (f) {
        if (f._deleted) return;
        if (f.method && !accountNames.has(f.method)) {
          orphanMethods[f.method] = (orphanMethods[f.method] || 0) + 1;
        }
      });
      var orphanKeys = Object.keys(orphanMethods);
      if (orphanKeys.length > 0) {
        warnings.push('Finance entries reference non-existent accounts: ' + orphanKeys.map(function (m) {
          return '"' + m + '" (' + orphanMethods[m] + ' entries)';
        }).join(', '));
      }

      // ── CHECK 7: Account balance sanity ─────────────────
      var totalBal = (parseFloat(gd.cashBalance) || 0);
      (gd.bankAccounts || []).forEach(function (a) { totalBal += (parseFloat(a.balance) || 0); });
      (gd.mobileBanking || []).forEach(function (a) { totalBal += (parseFloat(a.balance) || 0); });

      if (isNaN(totalBal)) {
        issues.push('Grand total balance is NaN — some account has invalid balance');
      }

      // Check for negative balances (warning, not error — could be intentional)
      if (parseFloat(gd.cashBalance) < 0) {
        warnings.push('Cash balance is negative: ৳' + gd.cashBalance);
      }
      (gd.bankAccounts || []).forEach(function (a) {
        if (parseFloat(a.balance) < 0) {
          warnings.push('Bank account "' + a.name + '" has negative balance: ৳' + a.balance);
        }
      });

      // ── CHECK 8: Loan entries not in income/expense ─────
      if (typeof window.feIsStatIncome === 'function' && typeof window.feIsStatExpense === 'function') {
        var loanInStats = false;
        (gd.finance || []).forEach(function (f) {
          if (f._deleted) return;
          var loanTypes = ['Loan Given', 'Loan Giving', 'Loan Received', 'Loan Receiving'];
          if (loanTypes.includes(f.type)) {
            if (window.feIsStatIncome(f.type) || window.feIsStatExpense(f.type)) {
              loanInStats = true;
            }
          }
        });
        if (loanInStats) {
          issues.push('Loan entries are being counted as Income/Expense — finance-engine.js may be corrupted');
        }
      }

      // ── CHECK 9: Advance/Investment not in income/expense stats ──
      if (typeof window.feIsStatIncome === 'function') {
        var advInStats = false;
        (gd.finance || []).forEach(function (f) {
          if (f._deleted) return;
          if (f.type === 'Advance' || f.type === 'Advance Return' ||
              f.type === 'Investment' || f.type === 'Investment Return') {
            if (window.feIsStatIncome(f.type) || (typeof window.feIsStatExpense === 'function' && window.feIsStatExpense(f.type))) {
              advInStats = true;
            }
          }
        });
        if (advInStats) {
          issues.push('Advance/Investment entries are being counted as Income/Expense — should be account movements only');
        }
      }
    }

    // ══════════════════════════════════════════════════════
    // RESULT
    // ══════════════════════════════════════════════════════
    var ok = issues.length === 0;
    _lastStatus = {
      ok: ok,
      issues: issues,
      warnings: warnings,
      checkedAt: new Date().toISOString()
    };

    _updateDot(ok, issues.length + warnings.length);

    // ✅ FIX: Sound alert when guard turns RED (data mismatch)
    if (!ok && !_silenced) {
      _playAlert();
    }

    if (!silent) {
      if (ok && warnings.length === 0) {
        console.log('%c✅ [SyncGuard] সব ঠিক আছে — Sync & Payment integrity OK', 'color:#00c853;font-weight:bold;');
      } else if (ok && warnings.length > 0) {
        console.group('%c⚠️ [SyncGuard] ' + warnings.length + ' টি সতর্কতা', 'color:#ff9800;font-weight:bold;');
        warnings.forEach(function (w) { console.warn('[SyncGuard]', w); });
        console.groupEnd();
        _showToast('warn', '⚠️ Sync Guard: ' + warnings.length + ' টি warning — console দেখুন');
      } else {
        console.group('%c🚨 [SyncGuard] ' + issues.length + ' টি সমস্যা পাওয়া গেছে!', 'color:#f44336;font-weight:bold;');
        issues.forEach(function (msg) { console.error('[SyncGuard]', msg); });
        if (warnings.length > 0) warnings.forEach(function (w) { console.warn('[SyncGuard]', w); });
        console.groupEnd();
        if (!_silenced) {
          _showToast('error', '🚨 Sync Guard: ' + issues.length + ' টি সমস্যা! Console দেখুন।');
        }
      }
    }

    return _lastStatus;
  }

  // ── UI DOT ────────────────────────────────────────────────

  function _injectDot() {
    if (document.getElementById('syncGuardDot')) return;

    var dot = document.createElement('div');
    dot.id = 'syncGuardDot';
    dot.title = '⏳ Sync checking...';
    dot.textContent = '⚡';
    dot.style.cssText = [
      'width:22px',
      'height:22px',
      'border-radius:50%',
      'background:rgba(80,80,80,0.9)',
      'cursor:pointer',
      'transition:background 0.4s',
      'font-size:12px',
      'display:inline-flex',
      'align-items:center',
      'justify-content:center',
      'box-shadow:0 0 6px rgba(0,0,0,0.4)',
      'flex-shrink:0',
      'margin-left:6px'
    ].join(';');

    dot.addEventListener('click', function () {
      var s = _lastStatus;
      if (!s) { runGuard(); return; }
      if (s.ok && s.warnings.length === 0) {
        alert('✅ Sync & Payment Healthy\nLast: ' + s.checkedAt);
      } else {
        var msg = '';
        if (s.issues.length) msg += '🚨 Issues:\n' + s.issues.join('\n');
        if (s.warnings.length) msg += (msg ? '\n\n' : '') + '⚠️ Warnings:\n' + s.warnings.join('\n');
        alert(msg);
      }
    });

    // Insert after "Welcome back, Admin!" h4 in the top bar (before finance guard)
    var welcomeH4 = null;
    document.querySelectorAll('.top-bar h4, header h4').forEach(function(el) {
      if (el.textContent.indexOf('Welcome') !== -1) welcomeH4 = el;
    });
    if (welcomeH4) {
      // If finance guard dot already exists, insert before it
      var financeDot = document.getElementById('financeGuardDot');
      if (financeDot) {
        financeDot.insertAdjacentElement('beforebegin', dot);
      } else {
        welcomeH4.insertAdjacentElement('afterend', dot);
      }
    } else {
      document.body.appendChild(dot);
    }
  }

  function _updateDot(ok, problemCount) {
    var dot = document.getElementById('syncGuardDot');
    if (!dot) return;

    if (ok && problemCount === 0) {
      dot.style.background = '#00c853';
      dot.title = '✅ Sync & Payment Healthy';
    } else if (ok && problemCount > 0) {
      dot.style.background = '#ff9800';
      dot.title = '⚠️ ' + problemCount + ' warning(s) — click for details';
    } else {
      dot.style.background = '#f44336';
      dot.title = '🚨 ' + problemCount + ' issue(s) — click for details';
    }
  }

  function _showToast(level, msg) {
    if (level === 'error' && typeof window.showErrorToast === 'function') {
      window.showErrorToast(msg);
    } else if (typeof window.showSuccessToast === 'function') {
      window.showSuccessToast(msg);
    }
  }

  // ── AUTO-FIX: deletedItems structure ──────────────────────
  function _autoFix() {
    var gd = window.globalData;
    if (!gd) return;

    // Fix deletedItems structure
    if (!gd.deletedItems || Array.isArray(gd.deletedItems)) {
      console.warn('[SyncGuard] Auto-fix: deletedItems structure corrected');
      gd.deletedItems = { students: [], finance: [], employees: [], other: [] };
    }
    ['students', 'finance', 'employees', 'other'].forEach(function (cat) {
      if (!Array.isArray(gd.deletedItems[cat])) {
        gd.deletedItems[cat] = [];
      }
    });
  }

  // ── HOOKS: Re-check after key operations ──────────────────

  function _hookAfter(fnName, delay) {
    delay = delay || 2000;
    var orig = window[fnName];
    if (typeof orig !== 'function') return;
    window[fnName] = function () {
      var result = orig.apply(this, arguments);
      setTimeout(function () { runGuard(true); }, delay);
      return result;
    };
  }

  function _installHooks() {
    _hookAfter('moveToTrash', 2000);
    _hookAfter('restoreDeletedItem', 2000);
    _hookAfter('permanentDelete', 2000);
    _hookAfter('deleteTransaction', 2000);
    _hookAfter('deleteStudent', 2000);
    _hookAfter('deleteLoanTransaction', 2000);
    _hookAfter('deleteSalaryPayment', 2000);
    _hookAfter('handleSalarySubmit', 2000);
    console.log('[SyncGuard] ✅ Hooks installed');
  }

  // ── PUBLIC API ────────────────────────────────────────────

  window.syncGuard = {
    run: function () { return runGuard(false); },
    check: function () { return runGuard(true); },
    status: function () { return _lastStatus; },
    silence: function () { _silenced = true; console.log('[SyncGuard] Alerts silenced'); },
    unmute: function () { _silenced = false; console.log('[SyncGuard] Alerts active'); },
    fix: function () { _autoFix(); runGuard(false); }
  };

  // ── STARTUP ───────────────────────────────────────────────

  function _startup() {
    _injectDot();
    _autoFix();

    if (window.globalData) {
      _installHooks();
      runGuard(false);
    } else {
      var attempts = 0;
      var interval = setInterval(function () {
        attempts++;
        if (window.globalData) {
          clearInterval(interval);
          _installHooks();
          runGuard(false);
        } else if (attempts >= 20) {
          clearInterval(interval);
          console.warn('[SyncGuard] globalData লোড হয়নি — guard চালু হয়নি');
        }
      }, 500);
    }
  }

  // Dot early inject — দেরি না করে সাথে সাথে inject করো
  if (document.body) {
    _injectDot();
  } else {
    document.addEventListener('DOMContentLoaded', function () { _injectDot(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(_startup, 2000); });
  } else {
    setTimeout(_startup, 2000);
  }

  console.log('✅ sync-guard.js v1.0 loaded');

})();

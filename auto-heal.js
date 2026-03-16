/**
 * ============================================
 * WINGS FLY — AUTO-HEAL ENGINE v4.0
 * ============================================
 * Background-এ চলে, সমস্যা detect করে নিজে fix করে।
 * কোনো command ছাড়াই কাজ করে।
 *
 * HEAL MODULES (13টি):
 *  1.  Student due recalculation
 *  2.  Cash balance integrity
 *  3.  Duplicate finance entry removal
 *  4.  UI dashboard refresh
 *  5.  Student duplicate detection (warn only)
 *  6.  Employee & bank data corruption fix
 *  7.  Orphaned payment detection (warn only)
 *  8.  Finance total recalculation
 *  9.  Missing array field init
 *  10. Student overpayment detection (warn only)
 *  11. Paid vs Finance mismatch fix
 *  12. Finance-engine balance rebuild (periodic)
 *  13. Cloud vs Local sync mismatch (version-based)
 *
 * ✅ v4.0 পরিবর্তন:
 *   - Unified UI: stats + log একই panel
 *   - Module status দেখায় (প্রতিটি heal কতটা fix করল)
 *   - Real-time log (auto-scroll)
 *   - "Manual Heal Now" — একটাই বাটন
 *   - Delete cooldown: delete-এর পর 3min sync pull skip
 *   - Finance-engine constants sync করা হয়েছে
 */

(function () {
  'use strict';

  const HEAL_INTERVAL = 600 * 1000;  // প্রতি ১০ মিনিটে (600 সেকেন্ড)
  const SUPABASE_URL = window.SUPABASE_CONFIG?.URL || 'https://gtoldrltxjrwshubplfp.supabase.co';
  const SUPABASE_KEY = window.SUPABASE_CONFIG?.KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';
  const API_URL = `${SUPABASE_URL}/rest/v1/academy_data?id=eq.wingsfly_main&select=*`;
  const HEADERS = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };

  // ── Finance-engine constants (sync with finance-engine.js) ──
  const ACCOUNT_IN = () => typeof window.FE_ACCOUNT_IN !== 'undefined'
    ? window.FE_ACCOUNT_IN
    : ['Income', 'Loan Received', 'Loan Receiving', 'Transfer In', 'Registration', 'Refund'];
  const ACCOUNT_OUT = () => typeof window.FE_ACCOUNT_OUT !== 'undefined'
    ? window.FE_ACCOUNT_OUT
    : ['Expense', 'Loan Given', 'Loan Giving', 'Transfer Out', 'Salary', 'Rent', 'Utilities'];

  // ── Stats ──
  const healStats = {
    totalRuns: 0, totalFixes: 0,
    lastRun: null, lastFix: null,
    log: [],           // max 50 entries
    moduleStats: {},   // per-module fix counts
  };
  window.healStats = healStats;

  // ── Delete cooldown tracking ──
  let _lastDeleteCount = parseInt(localStorage.getItem('wings_total_deleted') || '0');
  let _lastDeleteTime = 0;

  // ============================================
  // LOGGING
  // ============================================
  function hLog(type, msg, module = '') {
    const entry = { time: new Date().toLocaleTimeString('bn-BD'), type, msg, module };
    healStats.log.unshift(entry);
    if (healStats.log.length > 50) healStats.log.pop();

    const icon = { info: 'ℹ️', fix: '🔧', warn: '⚠️', ok: '✅', err: '❌' }[type] || '•';
    console.log(`[AutoHeal] ${icon} ${msg}`);
    _refreshHealLogUI();
  }

  function _refreshHealLogUI() {
    const container = document.getElementById('heal-log-container');
    if (!container) return;
    container.innerHTML = healStats.log.slice(0, 20).map(e => {
      const colors = { fix: '#d1fae5', warn: '#fef3c7', err: '#fee2e2', ok: '#d1fae5', info: '#eff6ff' };
      const textColors = { fix: '#065f46', warn: '#92400e', err: '#991b1b', ok: '#065f46', info: '#1e40af' };
      return `<div style="background:${colors[e.type]||'#f9fafb'};color:${textColors[e.type]||'#374151'};
        padding:5px 10px;border-radius:6px;margin-bottom:4px;font-size:0.78rem;font-family:monospace;">
        <span style="opacity:0.6">[${e.time}]</span>${e.module ? ` <b>${e.module}</b>` : ''} ${e.msg}
      </div>`;
    }).join('');
  }

  // ============================================
  // TOAST (non-blocking mini notification)
  // ============================================
  function healToast(msg, type = 'info') {
    const toast = document.createElement('div');
    const color = type === 'fix' ? '#00ff88' : (type === 'warn' ? '#ff2366' : '#00d9ff');
    const icon = type === 'fix' ? '🔧' : (type === 'warn' ? '⚠️' : 'ℹ️');
    toast.style.cssText = `position:fixed;bottom:10px;right:10px;background:rgba(10,14,37,0.85);color:${color};
      border:1px solid ${color}44;padding:4px 10px;border-radius:4px;font-size:0.65rem;font-weight:600;
      z-index:10000;display:flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(0,0,0,0.35);
      pointer-events:none;transform:translateY(20px);opacity:0;transition:all 0.2s;`;
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateY(0)'; toast.style.opacity = '1'; });
    setTimeout(() => {
      toast.style.transform = 'translateY(-10px)'; toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, 1800);
  }

  // ============================================
  // MODULE 1: Student Due Recalculation
  // ============================================
  function healStudentDues() {
    const data = window.globalData;
    if (!data?.students) return 0;
    let fixed = 0;
    data.students.forEach(s => {
      const correct = Math.max(0, (parseFloat(s.totalPayment)||0) - (parseFloat(s.paid)||0));
      if (Math.abs(correct - (parseFloat(s.due)||0)) > 0.5) {
        hLog('fix', `Due fix: "${s.name}" ৳${s.due}→৳${correct}`, 'DUE');
        s.due = correct; fixed++;
      }
    });
    if (fixed > 0) { localStorage.setItem('wingsfly_data', JSON.stringify(data)); healToast(`${fixed} student dues fixed`, 'fix'); }
    return fixed;
  }

  // ============================================
  // MODULE 2: Cash Balance Integrity
  // ============================================
  function healCashBalance() {
    const data = window.globalData;
    if (!data) return 0;
    let fixed = 0;
    if (isNaN(parseFloat(data.cashBalance)) || data.cashBalance === undefined || data.cashBalance === null) {
      hLog('fix', `Cash balance invalid (${data.cashBalance}) → 0`, 'CASH');
      data.cashBalance = 0; fixed++;
    }
    [data.bankAccounts || [], data.mobileBanking || []].flat().forEach(acc => {
      if (isNaN(parseFloat(acc.balance))) { acc.balance = 0; hLog('fix', `Account "${acc.name}" balance → 0`, 'CASH'); fixed++; }
    });
    if (fixed > 0) { localStorage.setItem('wingsfly_data', JSON.stringify(data)); }
    return fixed;
  }

  // ============================================
  // MODULE 3: Duplicate Finance Entry Removal
  // ============================================
  function healDuplicateFinance() {
    const data = window.globalData;
    if (!data?.finance) return 0;
    const seen = new Set(), cleaned = [];
    let removed = 0;
    data.finance.forEach(f => {
      const rt = f.timestamp ? Math.floor(new Date(f.timestamp).getTime() / 300000) : f.date;
      const key = `${f.type}|${f.amount}|${f.date}|${f.person||''}|${rt}`;
      if (seen.has(key)) { hLog('fix', `Dupe finance removed: ${f.type} ৳${f.amount} (${f.date})`, 'DUPE'); removed++; }
      else { seen.add(key); cleaned.push(f); }
    });
    if (removed > 0) { data.finance = cleaned; localStorage.setItem('wingsfly_data', JSON.stringify(data)); healToast(`${removed} dupe txns removed`, 'fix'); }
    return removed;
  }

  // ============================================
  // MODULE 4: UI Dashboard Refresh
  // ============================================
  function healUIRefresh() {
    const el = document.getElementById('dashTotalStudents');
    if (!el) return 0;
    const displayed = parseInt(el.innerText) || 0;
    const actual = (window.globalData?.students || []).length;
    if (actual > 0 && displayed === 0) {
      hLog('fix', `Dashboard 0 দেখাচ্ছিল, actual ${actual} — refresh`, 'UI');
      if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      return 1;
    }
    return 0;
  }

  // ============================================
  // MODULE 5: Student Duplicate Detection (warn only)
  // ============================================
  function healStudentDuplicates() {
    const data = window.globalData;
    if (!data?.students) return 0;
    const seen = new Map(), dups = [];
    data.students.forEach(s => {
      const key = `${(s.name||'').trim().toLowerCase()}|${(s.phone||'').trim()}`;
      if (seen.has(key) && key !== '|') dups.push(s);
      else seen.set(key, true);
    });
    if (dups.length > 0) {
      hLog('warn', `${dups.length}টি সম্ভাব্য duplicate student (name+phone) — auto-delete করা হয়নি`, 'DUP-STD');
      dups.slice(0, 3).forEach(s => hLog('info', `Dup: "${s.name}" (${s.phone||'no phone'})`, 'DUP-STD'));
      healToast(`${dups.length} duplicate students (no auto-delete)`, 'warn');
    }
    return 0; // warn only
  }

  // ============================================
  // MODULE 6: Employee & Bank Data Corruption Fix
  // ============================================
  function healEmployeeBankData() {
    const data = window.globalData;
    if (!data) return 0;
    let fixed = 0;
    (data.employees || []).forEach(e => {
      if (isNaN(parseFloat(e.salary))) { hLog('fix', `Employee "${e.name}" salary → 0`, 'EMP'); e.salary = 0; fixed++; }
      if (!e.id) { e.id = 'EMP_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); hLog('fix', `Employee "${e.name}" ID auto-generated`, 'EMP'); fixed++; }
    });
    (data.bankAccounts || []).forEach(a => {
      if (!a.name) { a.name = 'Unnamed Account'; fixed++; }
      if (isNaN(parseFloat(a.balance))) { a.balance = 0; fixed++; }
    });
    (data.mobileBanking || []).forEach(a => {
      if (!a.name) { a.name = 'Unnamed Mobile'; fixed++; }
      if (isNaN(parseFloat(a.balance))) { a.balance = 0; fixed++; }
    });
    if (fixed > 0) { localStorage.setItem('wingsfly_data', JSON.stringify(data)); healToast(`${fixed} data errors fixed`, 'fix'); }
    return fixed;
  }

  // ============================================
  // MODULE 7: Orphaned Payment Detection (warn only)
  // ============================================
  function healOrphanedPayments() {
    const data = window.globalData;
    if (!data?.finance || !data?.students) return 0;
    const SKIP_TYPES = new Set(['Loan Received', 'Loan Receiving', 'Loan Given', 'Loan Giving', 'Transfer In', 'Transfer Out']);
    const STUDENT_CATS = new Set(['Student Fee', 'Student Installment', 'Admission Fee', 'ভর্তি ফি', 'টিউশন ফি']);
    const names = new Set(data.students.map(s => (s.name||'').trim().toLowerCase()));
    const orphaned = data.finance.filter(f => {
      if (SKIP_TYPES.has(f.type)) return false;
      if (!STUDENT_CATS.has(f.category || '')) return false;
      const p = ((f.person||f.studentName||'')).trim().toLowerCase();
      return p && !names.has(p);
    });
    if (orphaned.length > 0) hLog('warn', `${orphaned.length}টি orphaned payment — student নেই`, 'ORPHAN');
    return 0;
  }

  // ============================================
  // MODULE 8: Finance Total Recalculation
  // ============================================
  function healFinanceRecalculation() {
    const data = window.globalData;
    if (!data?.finance) return 0;

    let calcCash = parseFloat(data.settings?.startBalances?.Cash) || 0;
    const ain = ACCOUNT_IN(), aout = ACCOUNT_OUT();

    data.finance.forEach(f => {
      if (f._deleted || f.method !== 'Cash') return;
      const amt = parseFloat(f.amount) || 0;
      if (ain.includes(f.type)) calcCash += amt;
      else if (aout.includes(f.type)) calcCash -= amt;
    });

    const stored = parseFloat(data.cashBalance) || 0;
    const gap = Math.abs(calcCash - stored);

    if (gap > 5000) {
      hLog('fix', `Cash mismatch: Calc ৳${calcCash.toFixed(0)} vs Stored ৳${stored.toFixed(0)} (gap ৳${gap.toFixed(0)})`, 'FIN-RECALC');
      if (typeof window.feRebuildAllBalances === 'function') { window.feRebuildAllBalances(); hLog('fix', 'finance-engine balance rebuild সম্পন্ন', 'FIN-RECALC'); }
      else if (typeof window.recalculateCashBalanceFromTransactions === 'function') { window.recalculateCashBalanceFromTransactions(); hLog('fix', 'Cash balance recalculated', 'FIN-RECALC'); }
      else { data.cashBalance = calcCash; localStorage.setItem('wingsfly_data', JSON.stringify(data)); }
      healToast(`Cash re-synced: ৳${calcCash.toFixed(0)}`, 'fix');
      return 1;
    } else if (gap > 1) {
      hLog('info', `Cash minor gap: ৳${gap.toFixed(0)} — monitoring`, 'FIN-RECALC');
    }
    return 0;
  }

  // ============================================
  // MODULE 9: Missing Array Fields Auto-Init
  // ============================================
  function healMissingArrayFields() {
    const data = window.globalData;
    if (!data) return 0;
    let fixed = 0;
    ['students', 'finance', 'employees', 'bankAccounts', 'mobileBanking',
      'incomeCategories', 'expenseCategories', 'courseNames', 'users',
      'examRegistrations', 'visitors', 'loans'].forEach(key => {
        if (!Array.isArray(data[key])) { hLog('fix', `data.${key} → [] init`, 'INIT'); data[key] = []; fixed++; }
      });
    if (!data.settings || typeof data.settings !== 'object') { data.settings = {}; fixed++; }
    if (!data.attendance || typeof data.attendance !== 'object') { data.attendance = {}; fixed++; }
    if (fixed > 0) localStorage.setItem('wingsfly_data', JSON.stringify(data));
    return fixed;
  }

  // ============================================
  // MODULE 10: Overpayment Detection (warn only)
  // ============================================
  function healOverpaymentCheck() {
    const data = window.globalData;
    if (!data?.students) return 0;
    let count = 0;
    data.students.forEach(s => {
      const paid = parseFloat(s.paid) || 0, total = parseFloat(s.totalPayment) || 0;
      if (total > 0 && paid > total + 1) { count++; hLog('warn', `Overpaid: "${s.name}" paid ৳${paid} / total ৳${total}`, 'OVERPAY'); }
    });
    if (count > 0) healToast(`${count} overpaid students`, 'warn');
    return 0;
  }

  // ============================================
  // MODULE 11: Paid vs Finance Mismatch Fix
  // ============================================
  function healPaidFinanceMismatch(manual = false) {
    const data = window.globalData;
    if (!data?.students || !data?.finance) return 0;

    // Delete cooldown (non-manual)
    if (!manual) {
      const cur = parseInt(localStorage.getItem('wings_total_deleted') || '0');
      if (cur > _lastDeleteCount) { _lastDeleteCount = cur; _lastDeleteTime = Date.now(); return 0; }
      if (_lastDeleteTime > 0 && (Date.now() - _lastDeleteTime) < 180000) return 0;
    }

    let fixed = 0, mismatch = 0;
    const finance = data.finance;

    data.students.forEach(student => {
      if (!student.name) return;
      const nameLower = student.name.trim().toLowerCase();
      const studentPaid = parseFloat(student.paid) || 0;
      if (studentPaid === 0) return;

      const finTotal = finance
        .filter(f => (f.person||'').trim().toLowerCase() === nameLower &&
          (f.category === 'Student Fee' || f.category === 'Student Installment') && f.type === 'Income')
        .reduce((s, f) => s + (parseFloat(f.amount)||0), 0);

      if (finTotal === 0) return;
      const diff = studentPaid - finTotal;
      if (Math.abs(diff) > 1) {
        mismatch++;
        if (manual || diff < -1) {
          student.paid = Math.round(finTotal * 100) / 100;
          student.due = Math.max(0, (parseFloat(student.totalPayment)||0) - student.paid);
          hLog('fix', `Paid fix (${student.name}): ৳${studentPaid}→৳${student.paid}`, 'PAID-FIN');
          fixed++;
        }
      }
    });

    if (fixed > 0) {
      localStorage.setItem('wingsfly_data', JSON.stringify(data));
      healToast(`${fixed} payments synced`, 'fix');
      if (typeof window.updatePaidFinanceStatusBadge === 'function') window.updatePaidFinanceStatusBadge();
      if (typeof window.scheduleSyncPush === 'function') window.scheduleSyncPush(`Auto-Heal: Paid fix (${fixed})`);
    } else if (manual) {
      if (mismatch === 0) healToast('সব data নিখুঁত আছে! ✅', 'ok');
      else healToast(`${mismatch}টি mismatch পাওয়া কিন্তু fix যায়নি`, 'warn');
    }
    return fixed;
  }

  // Status badge
  function _updatePaidFinanceStatusBadge() {
    const badge = document.getElementById('krPaidFinanceStatus');
    if (!badge || !window.globalData) return;
    const finance = window.globalData.finance || [];
    let mismatch = 0;
    (window.globalData.students || []).forEach(s => {
      const paid = parseFloat(s.paid) || 0;
      if (paid === 0) return;
      const ft = finance.filter(f => f.person === s.name && (f.category === 'Student Fee' || f.category === 'Student Installment') && f.type === 'Income')
        .reduce((sum, f) => sum + (parseFloat(f.amount)||0), 0);
      if (ft > 0 && Math.abs(ft - paid) > 1) mismatch++;
    });
    badge.innerHTML = mismatch === 0
      ? '<span style="color:#00ff88;font-weight:700;">✅ সব ঠিক আছে</span>'
      : `<span style="color:#ffcc00;font-weight:700;">⚠️ ${mismatch}টি mismatch — auto-heal চলছে...</span>`;
  }
  window.updatePaidFinanceStatusBadge = _updatePaidFinanceStatusBadge;

  // ============================================
  // MODULE 12: Finance-engine balance rebuild (periodic)
  // প্রতি ৫ cycle-এ একবার
  // ============================================
  function healPeriodicBalanceRebuild() {
    if (healStats.totalRuns % 5 !== 0) return 0;
    if (typeof window.feRebuildAllBalances === 'function') {
      window.feRebuildAllBalances();
      if (typeof window.updateGrandTotal === 'function') window.updateGrandTotal();
      hLog('info', `Periodic balance rebuild (cycle #${healStats.totalRuns}) সম্পন্ন`, 'REBUILD');
    }
    return 0;
  }

  // ============================================
  // MODULE 13: Cloud vs Local Sync Mismatch
  // ============================================
  async function healSyncMismatch() {
    if (!navigator.onLine) { hLog('info', 'Offline — sync check skip', 'SYNC'); return 0; }

    // Delete cooldown
    const cur = parseInt(localStorage.getItem('wings_total_deleted') || '0');
    if (cur > _lastDeleteCount) { _lastDeleteCount = cur; _lastDeleteTime = Date.now(); }
    if (_lastDeleteTime > 0 && (Date.now() - _lastDeleteTime) < 180000) {
      hLog('info', `Delete cooldown — sync pull skip (${Math.round((180000-(Date.now()-_lastDeleteTime))/1000)}s)`, 'SYNC');
      return 0;
    }

    let fixed = 0;
    try {
      const res = await fetch(API_URL, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
      if (!res.ok) { hLog('warn', `Cloud check failed: HTTP ${res.status}`, 'SYNC'); return 0; }
      const arr = await res.json();
      const cloud = arr[0];

      if (!cloud) {
        hLog('fix', 'Cloud-এ data নেই — push করা হচ্ছে', 'SYNC');
        if (typeof window.scheduleSyncPush === 'function') window.scheduleSyncPush('Heal: Cloud empty push');
        else if (typeof window.saveToCloud === 'function') await window.saveToCloud();
        healToast('Cloud empty — data push হয়েছে', 'fix'); fixed++;
        return fixed;
      }

      const localVer = parseInt(localStorage.getItem('wings_local_version')) || 0;
      const cloudVer = parseInt(cloud.version) || 0;
      const cloudAction = (cloud.last_action || '').toLowerCase();

      if (cloudAction.includes('delete') && cloudVer >= localVer) {
        hLog('info', `Cloud action is delete — skip pull (v${cloudVer})`, 'SYNC'); return 0;
      }

      if (cloudVer > localVer + 1) {
        hLog('fix', `Cloud v${cloudVer} > Local v${localVer} (gap: ${cloudVer-localVer}) — pull`, 'SYNC');
        if (cloudVer - localVer > 10 && typeof window.loadFromCloud === 'function') {
          await window.loadFromCloud(true);
          if (typeof window.renderFullUI === 'function') window.renderFullUI();
        }
        healToast(`Multi-PC sync: Cloud v${cloudVer} pull`, 'fix'); fixed++;
      } else if (localVer > cloudVer + 2) {
        hLog('fix', `Local v${localVer} >> Cloud v${cloudVer} — push`, 'SYNC');
        if (typeof window.scheduleSyncPush === 'function') window.scheduleSyncPush('Heal: Local ahead, push');
        fixed++;
      }
    } catch (e) { hLog('err', 'Sync heal error: ' + e.message, 'SYNC'); }
    return fixed;
  }

  // ============================================
  // Network reconnect handler
  // ============================================
  let _pendingReconnectSync = false;
  window.addEventListener('offline', () => { _pendingReconnectSync = true; hLog('warn', 'Network offline', 'NET'); });
  window.addEventListener('online', async () => {
    hLog('info', 'Network ফিরেছে — pending sync...', 'NET');
    await new Promise(r => setTimeout(r, 2000));
    if (_pendingReconnectSync) {
      _pendingReconnectSync = false;
      if (typeof window.saveToCloud === 'function') { await window.saveToCloud(); hLog('fix', 'Reconnect-এর পর data sync সম্পন্ন', 'NET'); healToast('Network ফিরেছে — sync সম্পন্ন ✓', 'fix'); }
    }
  });

  // ============================================
  // UPDATE HEAL STATS UI
  // ============================================
  function _updateHealStatsUI() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('heal-stats-total-runs', healStats.totalRuns);
    set('heal-stats-total-fixes', healStats.totalFixes);
    set('heal-stats-last-run', healStats.lastRun || '—');
    set('heal-stats-last-fix', healStats.lastFix || 'কোনো fix দরকার হয়নি');

    // Module stats table if present
    const moduleEl = document.getElementById('heal-module-stats');
    if (moduleEl && Object.keys(healStats.moduleStats).length > 0) {
      moduleEl.innerHTML = Object.entries(healStats.moduleStats)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => `<div style="display:flex;justify-content:space-between;font-size:0.75rem;padding:2px 0;">
          <span style="color:#00d4ff;">${k}</span><span style="color:#00ff88;">+${v}</span></div>`)
        .join('') || '<span style="color:#888;font-size:0.75rem;">এখনো কোনো fix হয়নি</span>';
    }
  }

  // ============================================
  // MAIN HEAL CYCLE
  // ============================================
  async function runHealCycle() {
    // V31 Guard
    if (window.initialSyncComplete === false) { hLog('info', 'Waiting for initial cloud sync...', 'GUARD'); return; }
    if (sessionStorage.getItem('isLoggedIn') !== 'true') return;
    if (!window.globalData) return;

    healStats.totalRuns++;
    healStats.lastRun = new Date().toLocaleTimeString('bn-BD');
    hLog('info', `Heal cycle #${healStats.totalRuns} শুরু...`);

    let totalFixed = 0;
    const moduleResults = {};

    const run = async (name, fn) => {
      const f = await fn();
      moduleResults[name] = f;
      if (f > 0) {
        healStats.moduleStats[name] = (healStats.moduleStats[name] || 0) + f;
        totalFixed += f;
      }
    };

    await run('DUE',        () => healStudentDues());
    await run('CASH',       () => healCashBalance());
    await run('DUPE-FIN',   () => healDuplicateFinance());
    await run('UI',         () => healUIRefresh());
    await run('DUP-STD',    () => healStudentDuplicates());
    await run('EMP',        () => healEmployeeBankData());
    await run('ORPHAN',     () => healOrphanedPayments());
    await run('FIN-RECALC', () => healFinanceRecalculation());
    await run('INIT',       () => healMissingArrayFields());
    await run('OVERPAY',    () => healOverpaymentCheck());
    await run('PAID-FIN',   () => healPaidFinanceMismatch());
    await run('REBUILD',    () => healPeriodicBalanceRebuild());
    await run('SYNC',       () => healSyncMismatch());

    if (totalFixed > 0) {
      healStats.totalFixes += totalFixed;
      healStats.lastFix = new Date().toLocaleTimeString('bn-BD');
      hLog('fix', `Heal cycle #${healStats.totalRuns} সম্পন্ন — ${totalFixed}টি fix ✓`);
      if (typeof window.logActivity === 'function') {
        window.logActivity('heal', 'FIX', `🔧 Auto-Heal #${healStats.totalRuns}: ${totalFixed}টি fix`, { fixes: totalFixed, run: healStats.totalRuns, modules: moduleResults });
      }
      if (typeof window.scheduleSyncPush === 'function') window.scheduleSyncPush(`Auto-Heal: ${totalFixed} fixes`);
      else if (typeof window.saveToCloud === 'function') await window.saveToCloud();
    } else {
      hLog('ok', `Heal cycle #${healStats.totalRuns} — কোনো সমস্যা নেই ✓`);
      if (healStats.totalRuns % 10 === 0 && typeof window.logActivity === 'function') {
        window.logActivity('heal', 'TEST', `✅ Auto-Heal #${healStats.totalRuns}: সব ঠিক আছে`, { run: healStats.totalRuns });
      }
    }

    _updateHealStatsUI();
  }

  // ============================================
  // PUBLIC API
  // ============================================
  window.runAutoHealRepair = async function () {
    hLog('info', 'Manual Data Repair শুরু হচ্ছে...');
    const fixed = healPaidFinanceMismatch(true);
    if (fixed > 0) {
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      if (typeof window.showSuccessToast === 'function') window.showSuccessToast(`✅ ${fixed}টি data mismatch fix হয়েছে!`);
    }
  };

  window.autoHeal = {
    runNow: runHealCycle,
    getStats: () => healStats,
    getLogs: () => healStats.log,
    fixPaidFinance: () => healPaidFinanceMismatch(true),
    repairNow: window.runAutoHealRepair,
  };

  // ============================================
  // START
  // ============================================
  function start() {
    hLog('info', `🛡️ Auto-Heal Engine v4.0 চালু — 13 modules active (প্রতি 60s)`);
    setTimeout(runHealCycle, 10 * 1000);
    setInterval(runHealCycle, HEAL_INTERVAL);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  console.log(`%c🛡️ Wings Fly Auto-Heal Engine v4.0 loaded`, 'color:#00ff88;font-weight:bold');

})();

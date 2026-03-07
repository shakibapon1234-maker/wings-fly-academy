/**
 * ============================================
 * WINGS FLY — AUTO-HEAL ENGINE v3.1
 * ============================================
 * Background-এ চলে, সমস্যা detect করে নিজে fix করে।
 * কোনো command ছাড়াই কাজ করে।
 *
 * HEAL MODULES (12টি):
 *  1.  Student due recalculation
 *  2.  Duplicate finance entry removal
 *  3.  Cash balance integrity
 *  4.  Cloud vs Local sync mismatch
 *  5.  UI dashboard refresh
 *  6.  Network reconnect sync
 *  7.  Student duplicate detection
 *  8.  Employee/Bank data corruption fix
 *  9.  Orphaned payment detection
 * 10.  Finance total recalculation
 * 11.  Missing array field init (exam, visitors, etc.)
 * 12.  Student overpayment detection & alert
 *
 * ✅ v3.1 Fix: Local fix হলে cloud এ auto-push (data sync নিশ্চিত)
 */

(function () {
  'use strict';

  const HEAL_INTERVAL = 60 * 1000;  // প্রতি ৬০ সেকেন্ডে check
  const SUPABASE_URL = window.SUPABASE_CONFIG?.URL || 'https://gtoldrltxjrwshubplfp.supabase.co';
  const SUPABASE_KEY = window.SUPABASE_CONFIG?.KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';
  const API_URL = `${SUPABASE_URL}/rest/v1/academy_data?id=eq.wingsfly_main&select=*`;
  const HEADERS = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };

  // Stats — Settings-এ দেখানোর জন্য
  const healStats = {
    totalRuns: 0,
    totalFixes: 0,
    lastRun: null,
    lastFix: null,
    log: [],   // max 50 entries
  };
  window.healStats = healStats;

  // ============================================
  // LOGGING
  // ============================================
  function hLog(type, msg) {
    const entry = { time: new Date().toLocaleTimeString('bn-BD'), type, msg };
    healStats.log.unshift(entry);
    if (healStats.log.length > 50) healStats.log.pop();

    const icon = { info: 'ℹ️', fix: '🔧', warn: '⚠️', ok: '✅', err: '❌' }[type] || '•';
    console.log(`[AutoHeal] ${icon} ${msg}`);

    // Settings-এ heal log থাকলে update করো
    refreshHealLogUI();
  }

  function refreshHealLogUI() {
    const container = document.getElementById('heal-log-container');
    if (!container) return;
    container.innerHTML = healStats.log.slice(0, 20).map(e => {
      const colors = { fix: '#d1fae5', warn: '#fef3c7', err: '#fee2e2', ok: '#d1fae5', info: '#eff6ff' };
      const textColors = { fix: '#065f46', warn: '#92400e', err: '#991b1b', ok: '#065f46', info: '#1e40af' };
      return `<div style="
        background:${colors[e.type] || '#f9fafb'};
        color:${textColors[e.type] || '#374151'};
        padding:5px 10px;
        border-radius:6px;
        margin-bottom:4px;
        font-size:0.78rem;
        font-family:monospace;
      "><span style="opacity:0.6">[${e.time}]</span> ${e.msg}</div>`;
    }).join('');
  }

  // ============================================
  // TOAST (অ্যাপের নিজের toast use করবে)
  // ============================================
  function healToast(msg, type = 'info') {
    // Mini-toast for auto-heal to avoid blocking UI
    // USER REQUEST: Make notifications very small and short
    const toast = document.createElement('div');
    const color = type === 'fix' ? '#00ff88' : (type === 'warn' ? '#ff2366' : '#00d9ff');
    const icon = type === 'fix' ? '🔧' : (type === 'warn' ? '⚠️' : 'ℹ️');

    toast.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(10, 14, 37, 0.8);
      color: ${color};
      border: 1px solid ${color}44;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 500;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      pointer-events: none;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;
    toast.innerHTML = `<span style="font-size: 0.7rem;">${icon}</span> <span>${msg}</span>`;
    document.body.appendChild(toast);

    // Animation
    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(-10px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, 1500); // reduced from 2500ms
  }

  // ============================================
  // HEAL 1: Student Due Recalculation
  // সমস্যা: due = totalPayment - paid হওয়া উচিত
  // কিন্তু কখনো mismatch হয়
  // ============================================
  function healStudentDues() {
    const data = window.globalData;
    if (!data || !data.students) return 0;

    let fixed = 0;
    data.students.forEach(s => {
      const total = parseFloat(s.totalPayment) || 0;
      const paid = parseFloat(s.paid) || 0;
      const correctDue = Math.max(0, total - paid);
      const currentDue = parseFloat(s.due) || 0;

      if (Math.abs(correctDue - currentDue) > 0.5) {
        hLog('fix', `Student "${s.name}" due fix: ৳${currentDue} → ৳${correctDue}`);
        s.due = correctDue;
        fixed++;
      }
    });

    if (fixed > 0) {
      localStorage.setItem('wingsfly_data', JSON.stringify(data));
      healToast(`${fixed} student dues fixed`, 'fix');
    }
    return fixed;
  }

  // ============================================
  // HEAL 2: Duplicate Finance Entry Detection
  // একই amount + date + type = সম্ভাব্য duplicate
  // ============================================
  function healDuplicateFinance() {
    const data = window.globalData;
    if (!data || !data.finance) return 0;

    const seen = new Set();
    const cleaned = [];
    let removed = 0;

    data.finance.forEach(f => {
      // Key = type + amount + date + person (5 মিনিটের মধ্যে একই entry = duplicate)
      const roundedTime = f.timestamp
        ? Math.floor(new Date(f.timestamp).getTime() / 300000) // 5min bucket
        : f.date;
      const key = `${f.type}|${f.amount}|${f.date}|${f.person || ''}|${roundedTime}`;

      if (seen.has(key)) {
        hLog('fix', `Duplicate finance entry removed: ${f.type} ৳${f.amount} (${f.date})`);
        removed++;
      } else {
        seen.add(key);
        cleaned.push(f);
      }
    });

    if (removed > 0) {
      data.finance = cleaned;
      localStorage.setItem('wingsfly_data', JSON.stringify(data));
      healToast(`${removed} dupe txns removed`, 'fix');
    }
    return removed;
  }

  // ============================================
  // HEAL 3: Cash Balance Integrity
  // cashBalance কখনো undefined/NaN হলে fix করো
  // ============================================
  function healCashBalance() {
    const data = window.globalData;
    if (!data) return 0;

    let fixed = 0;
    if (isNaN(parseFloat(data.cashBalance)) || data.cashBalance === undefined || data.cashBalance === null) {
      hLog('fix', `Cash balance was invalid (${data.cashBalance}) → 0 সেট করা হয়েছে`);
      data.cashBalance = 0;
      localStorage.setItem('wingsfly_data', JSON.stringify(data));
      healToast('Cash balance reset', 'warn');
      fixed++;
    }

    // Bank/Mobile account balance NaN হলে fix
    (data.bankAccounts || []).forEach(acc => {
      if (isNaN(parseFloat(acc.balance))) {
        hLog('fix', `Bank "${acc.name}" balance invalid → 0`);
        acc.balance = 0;
        fixed++;
      }
    });
    (data.mobileBanking || []).forEach(acc => {
      if (isNaN(parseFloat(acc.balance))) {
        hLog('fix', `Mobile "${acc.name}" balance invalid → 0`);
        acc.balance = 0;
        fixed++;
      }
    });

    if (fixed > 0) {
      localStorage.setItem('wingsfly_data', JSON.stringify(data));
    }
    return fixed;
  }

  // ============================================
  // HEAL 7: Student Duplicate Detection
  // একই name + phone = duplicate student
  // ============================================
  function healStudentDuplicates() {
    const data = window.globalData;
    if (!data || !data.students) return 0;

    const seen = new Map();
    const toKeep = [];
    let removed = 0;

    data.students.forEach(s => {
      const key = `${(s.name || '').trim().toLowerCase()}|${(s.phone || '').trim()}`;
      if (seen.has(key) && key !== '|') {
        hLog('fix', `Duplicate student removed: "${s.name}" (${s.phone})`);
        removed++;
      } else {
        seen.set(key, true);
        toKeep.push(s);
      }
    });

    if (removed > 0) {
      data.students = toKeep;
      localStorage.setItem('wingsfly_data', JSON.stringify(data));
      healToast(`${removed} dupe students removed`, 'fix');
    }
    return removed;
  }

  // ============================================
  // HEAL 8: Employee & Bank Data Corruption Fix
  // ============================================
  function healEmployeeBankData() {
    const data = window.globalData;
    if (!data) return 0;
    let fixed = 0;

    // Employee fix
    (data.employees || []).forEach(e => {
      if (isNaN(parseFloat(e.salary))) {
        hLog('fix', `Employee "${e.name}" salary invalid → 0`);
        e.salary = 0; fixed++;
      }
      if (!e.id) {
        e.id = 'EMP_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        hLog('fix', `Employee "${e.name}" missing ID → auto-generated`);
        fixed++;
      }
    });

    // Bank account fix
    (data.bankAccounts || []).forEach(acc => {
      if (!acc.name) { acc.name = 'Unnamed Account'; hLog('fix', 'Bank account missing name → fixed'); fixed++; }
      if (isNaN(parseFloat(acc.balance))) { acc.balance = 0; hLog('fix', `Bank "${acc.name}" balance invalid → 0`); fixed++; }
    });

    // Mobile banking fix
    (data.mobileBanking || []).forEach(acc => {
      if (!acc.name) { acc.name = 'Unnamed Mobile Account'; hLog('fix', 'Mobile account missing name → fixed'); fixed++; }
      if (isNaN(parseFloat(acc.balance))) { acc.balance = 0; hLog('fix', `Mobile "${acc.name}" balance invalid → 0`); fixed++; }
    });

    // Missing array fields fix
    ['examRegistrations', 'visitors', 'bankAccounts', 'mobileBanking', 'employees'].forEach(key => {
      if (!Array.isArray(data[key])) {
        hLog('fix', `data.${key} missing array → init করা হয়েছে`);
        data[key] = []; fixed++;
      }
    });

    if (fixed > 0) {
      localStorage.setItem('wingsfly_data', JSON.stringify(data));
      healToast(`${fixed} data errors fixed`, 'fix');
    }
    return fixed;
  }

  // ============================================
  // HEAL 9: Orphaned Payment Cleanup (warn only)
  // Finance-এ payment আছে কিন্তু student নেই
  // ============================================
  function healOrphanedPayments() {
    const data = window.globalData;
    if (!data || !data.finance || !data.students) return 0;

    // এই categories/types গুলো student-linked নয়, তাই orphaned check থেকে বাদ
    const NON_STUDENT_CATEGORIES = new Set([
      'Loan', 'loan', 'Loan Given', 'Loan Taken', 'Loan Repay', 'Loan Received',
      'লোন', 'ঋণ', 'ঋণ প্রদান', 'ঋণ গ্রহণ',
      'Salary', 'Expense', 'ব্যয়', 'Rent', 'Utility', 'Other Expense',
      'Other Income', 'অন্যান্য আয়', 'অন্যান্য ব্যয়',
      'Bank Transfer', 'Mobile Banking', 'Investment'
    ]);

    const studentNames = new Set(data.students.map(s => (s.name || '').trim().toLowerCase()));

    const orphaned = data.finance.filter(f => {
      // Loan বা non-student category হলে skip — এগুলো orphaned নয়
      const category = (f.category || '').trim();
      const subType = (f.subType || f.sub_type || '').trim().toLowerCase();

      if (NON_STUDENT_CATEGORIES.has(category)) return false;
      if (subType === 'loan' || subType === 'লোন' || subType === 'ঋণ') return false;
      if (category.toLowerCase().includes('loan') || category.toLowerCase().includes('লোন')) return false;

      // শুধু Student Fee / Student Installment / Admission Fee type check করো
      const isStudentPayment = (
        f.type === 'Income' &&
        (
          category === 'Student Fee' ||
          category === 'Student Installment' ||
          category === 'Admission Fee' ||
          category === 'ভর্তি ফি' ||
          category === 'টিউশন ফি'
        )
      );
      if (!isStudentPayment) return false;

      const person = ((f.person || f.studentName || '')).trim().toLowerCase();
      return person && !studentNames.has(person);
    });

    if (orphaned.length > 0) {
      hLog('warn', `${orphaned.length}টি orphaned payment পাওয়া গেছে — student নেই এমন entries`);
      // Remove করি না — শুধু warn করি কারণ intentional হতে পারে
    }
    return 0; // warn only, no destructive action
  }

  // ============================================
  // HEAL 10: Finance Total Recalculation
  // Income - Expense ≠ cashBalance হলে fix
  // ============================================
  function healFinanceRecalculation() {
    const data = window.globalData;
    if (!data || !data.finance) return 0;

    let calcCash = 0;
    data.finance.forEach(f => {
      const amt = parseFloat(f.amount) || 0;
      if (f.type === 'Income' || f.type === 'আয়') calcCash += amt;
      else if (f.type === 'Expense' || f.type === 'ব্যয়') calcCash -= amt;
    });

    const stored = parseFloat(data.cashBalance) || 0;
    const gap = Math.abs(calcCash - stored);

    // শুধু বড় gap হলে fix করো (৳10,000+)
    if (gap > 10000) {
      hLog('fix', `Cash balance মিলছে না: Calculated ৳${calcCash.toFixed(0)} vs Stored ৳${stored.toFixed(0)} (gap: ৳${gap.toFixed(0)}) → recalculate`);
      // app-এর নিজের recalculate function থাকলে সেটা call করো
      if (typeof window.recalculateCashBalanceFromTransactions === 'function') {
        window.recalculateCashBalanceFromTransactions();
        hLog('fix', 'Cash balance app function দিয়ে recalculate হয়েছে');
      } else {
        data.cashBalance = calcCash;
        localStorage.setItem('wingsfly_data', JSON.stringify(data));
        hLog('fix', `Cash balance manual recalculate: ৳${calcCash.toFixed(0)}`);
      }
      healToast(`Cash re-synced: ৳${calcCash.toFixed(0)}`, 'fix');
      return 1;
    } else if (gap > 1) {
      hLog('info', `Cash balance minor gap: ৳${gap.toFixed(0)} — monitor করা হচ্ছে`);
    }
    return 0;
  }

  // ============================================
  // HEAL 11: Missing Array Fields Auto-Init
  // ============================================
  function healMissingArrayFields() {
    const data = window.globalData;
    if (!data) return 0;
    let fixed = 0;

    const requiredArrays = [
      'students', 'finance', 'employees', 'bankAccounts', 'mobileBanking',
      'incomeCategories', 'expenseCategories', 'courseNames', 'users',
      'examRegistrations', 'visitors', 'notices'
    ];
    requiredArrays.forEach(key => {
      if (!Array.isArray(data[key])) {
        hLog('fix', `data.${key} missing → [] init করা হয়েছে`);
        data[key] = []; fixed++;
      }
    });
    if (!data.settings || typeof data.settings !== 'object') {
      data.settings = {}; hLog('fix', 'data.settings → {} init'); fixed++;
    }
    if (!data.attendance || typeof data.attendance !== 'object') {
      data.attendance = {}; hLog('fix', 'data.attendance → {} init'); fixed++;
    }
    if (fixed > 0) localStorage.setItem('wingsfly_data', JSON.stringify(data));
    return fixed;
  }

  // ============================================
  // HEAL 12: Student Overpayment Detection
  // paid > totalPayment হলে warn করো
  // ============================================
  function healOverpaymentCheck() {
    const data = window.globalData;
    if (!data || !data.students) return 0;
    let overpaid = 0;
    data.students.forEach(s => {
      const paid = parseFloat(s.paid) || 0;
      const total = parseFloat(s.totalPayment) || 0;
      if (total > 0 && paid > total + 1) {
        overpaid++;
        hLog('warn', `Overpaid: "${s.name}" ৳${paid} paid / ৳${total} total`);
      }
    });
    if (overpaid > 0) healToast(`${overpaid} overpaid students`, 'warn');
    return 0;
  }


  // ============================================
  // HEAL 13: Paid vs Finance Mismatch Auto-Fix
  // Student.paid != finance ledger total হলে fix
  // ✅ v3.2 FIX: Delete হলে re-add না করে paid কমাও
  // ============================================
  let _lastDeleteCount = parseInt(localStorage.getItem('wings_total_deleted') || '0');
  let _lastDeleteTime = 0;

  function healPaidFinanceMismatch(manual = false) {
    const data = window.globalData;
    if (!data || !data.students || !data.finance) return 0;

    // ✅ CRITICAL: Recent delete হলে cooldown দাও — ৩ মিনিট (manual ছাড়া)
    if (!manual) {
      const currentDeleteCount = parseInt(localStorage.getItem('wings_total_deleted') || '0');
      if (currentDeleteCount > _lastDeleteCount) {
        _lastDeleteCount = currentDeleteCount;
        _lastDeleteTime = Date.now();
        return 0;
      }
      if (_lastDeleteTime > 0 && (Date.now() - _lastDeleteTime) < 180000) {
        return 0;
      }
    }

    let fixed = 0;
    let mismatchCount = 0;
    const finance = data.finance;

    data.students.forEach(student => {
      const name = student.name;
      if (!name) return;
      const nameLower = name.trim().toLowerCase();
      const studentPaid = parseFloat(student.paid) || 0;
      if (studentPaid === 0) return;

      const finRecords = finance.filter(f =>
        (f.person || '').trim().toLowerCase() === nameLower &&
        (f.category === 'Student Fee' || f.category === 'Student Installment') &&
        f.type === 'Income'
      );
      const finTotal = finRecords.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

      if (finTotal === 0) return;

      const diff = studentPaid - finTotal;

      if (Math.abs(diff) > 1) {
        mismatchCount++;

        // Manual trigger হলে অথবা paid < finance হলে fix করো
        // paid > finance হলে manual trigger ছাড়া fix করবে না (intentional হতে পারে)
        if (manual || diff < -1) {
          student.paid = Math.round(finTotal * 100) / 100;
          student.due = Math.max(0, (parseFloat(student.totalPayment) || 0) - student.paid);
          hLog('fix', `Paid-Finance fix (${name}): ৳${studentPaid} → ৳${student.paid}`);
          fixed++;
        }
      }
    });

    if (fixed > 0) {
      localStorage.setItem('wingsfly_data', JSON.stringify(data));
      healToast(`${fixed} payments synced`, 'fix');
      if (typeof window.updatePaidFinanceStatusBadge === 'function') window.updatePaidFinanceStatusBadge();

      // Sync
      if (typeof window.scheduleSyncPush === 'function') window.scheduleSyncPush(`Auto-Heal: Paid fix (${fixed})`);
    } else if (manual && mismatchCount === 0) {
      healToast('হুররে! সব data একদম নিখুঁত আছে। ✅', 'ok');
    } else if (manual && fixed === 0 && mismatchCount > 0) {
      healToast(`${mismatchCount}টি mismatch পাওয়া গেছে কিন্তু fix করা যায়নি।`, 'warn');
    }

    return fixed;
  }

  // status badge updater
  function updatePaidFinanceStatusBadge() {
    const badge = document.getElementById('krPaidFinanceStatus');
    if (!badge || !window.globalData) return;
    const finance = window.globalData.finance || [];
    let mismatch = 0;
    (window.globalData.students || []).forEach(s => {
      const paid = parseFloat(s.paid) || 0;
      if (paid === 0) return;
      const ft = finance.filter(f =>
        f.person === s.name &&
        (f.category === 'Student Fee' || f.category === 'Student Installment') &&
        f.type === 'Income'
      ).reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
      if (ft > 0 && Math.abs(ft - paid) > 1) mismatch++;
    });
    badge.innerHTML = mismatch === 0
      ? '<span style="color:#00ff88;font-weight:700;">✅ সব ঠিক আছে</span>'
      : '<span style="color:#ffcc00;font-weight:700;">⚠️ ' + mismatch + 'টি mismatch — auto-heal চলছে...</span>';
  }
  window.updatePaidFinanceStatusBadge = updatePaidFinanceStatusBadge;

  // ============================================
  // HEAL 4: Cloud vs Local Sync Mismatch (VERSION-BASED)
  // Multi-PC sync: অন্য PC push করলে এই PC pull করবে
  // ✅ VERSION দিয়ে compare করো — COUNT নয় (count misleading হয়)
  // ============================================
  async function healSyncMismatch() {
    if (!navigator.onLine) {
      hLog('info', 'Offline — sync check skip');
      return 0;
    }

    // ✅ CRITICAL: Recent delete হলে sync pull skip করো
    // ডিলিটের পরে push হচ্ছে, এই সময় pull করলে পুরনো ডাটা ফিরে আসবে
    const currentDelCount = parseInt(localStorage.getItem('wings_total_deleted') || '0');
    if (currentDelCount > _lastDeleteCount) {
      _lastDeleteCount = currentDelCount;
      _lastDeleteTime = Date.now();
    }
    if (_lastDeleteTime > 0 && (Date.now() - _lastDeleteTime) < 180000) {
      hLog('info', 'Recent delete — sync pull skip (' + Math.round((180000 - (Date.now() - _lastDeleteTime)) / 1000) + 's cooldown)');
      return 0;
    }

    let fixed = 0;

    try {
      const res = await fetch(API_URL, { headers: HEADERS, signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        hLog('warn', `Cloud check failed: HTTP ${res.status}`);
        return 0;
      }

      const arr = await res.json();
      const cloud = arr[0];

      if (!cloud) {
        // Cloud-এ কোনো data নেই — push করো
        hLog('fix', 'Cloud-এ data নেই — local data push করা হচ্ছে');
        if (typeof window.scheduleSyncPush === 'function') window.scheduleSyncPush('Heal: Cloud empty push');
        else if (typeof window.saveToCloud === 'function') await window.saveToCloud();
        healToast('Cloud empty ছিল — data push করা হয়েছে', 'fix');
        fixed++;
        return fixed;
      }

      const localVer = parseInt(localStorage.getItem('wings_local_version')) || 0;
      const cloudVer = parseInt(cloud.version) || 0;

      // ✅ যদি cloud এর last_action 'Delete' দিয়ে শুরু হয়, সেটা আমাদেরই push
      // তাই pull করার দরকার নেই
      const cloudAction = (cloud.last_action || '').toLowerCase();
      if (cloudAction.includes('delete') && cloudVer >= localVer) {
        hLog('info', `Cloud action is delete — skip pull (v${cloudVer})`);
        return 0;
      }

      // ✅ VERSION-BASED: শুধু cloud VERSION বড় হলেই pull করো
      // এটা multi-PC sync নিশ্চিত করে: PC-A push করে v100, PC-B local v99 → pull
      if (cloudVer > localVer + 1) {
        // +1 tolerance: মাত্র ১ version পার্থক্য হলে V31 নিজেই handle করবে
        hLog('fix', `Cloud v${cloudVer} > Local v${localVer} (gap: ${cloudVer - localVer}) — অন্য PC থেকে নতুন data আছে, pull করা হচ্ছে`);
        if (typeof window.loadFromCloud === 'function') {
          await window.loadFromCloud(true);
          if (typeof window.renderFullUI === 'function') window.renderFullUI();
        }
        healToast(`Multi-PC sync: Cloud v${cloudVer} pull করা হয়েছে`, 'fix');
        fixed++;
      } else if (cloudVer > localVer) {
        // ছোট gap — V31 next sync-এই handle করবে
        hLog('info', `Minor version gap: Cloud v${cloudVer} vs Local v${localVer} — V31 will handle`);
      } else if (localVer > cloudVer + 2) {
        // Local-এ অনেক বেশি version → push করো
        hLog('fix', `Local v${localVer} >> Cloud v${cloudVer} — push করা হচ্ছে`);
        if (typeof window.scheduleSyncPush === 'function') window.scheduleSyncPush('Heal: Local version ahead, push');
        fixed++;
      }

    } catch (e) {
      hLog('err', 'Sync heal error: ' + e.message);
    }

    return fixed;
  }



  // ============================================
  // HEAL 5: UI Refresh যদি dashboard 0 দেখায়
  // ============================================
  function healUIRefresh() {
    const dashStudentEl = document.getElementById('dashTotalStudents');
    if (!dashStudentEl) return 0;

    const displayed = parseInt(dashStudentEl.innerText) || 0;
    const actual = (window.globalData?.students || []).length;

    if (actual > 0 && displayed === 0) {
      hLog('fix', `Dashboard 0 দেখাচ্ছিল কিন্তু actual student ${actual} — UI refresh করা হচ্ছে`);
      if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      return 1;
    }
    return 0;
  }

  // ============================================
  // HEAL 6: Network ফিরলে pending sync
  // ============================================
  let pendingSyncOnReconnect = false;

  window.addEventListener('offline', () => {
    pendingSyncOnReconnect = true;
    hLog('warn', 'Network offline — reconnect হলে auto-sync হবে');
  });

  window.addEventListener('online', async () => {
    hLog('info', 'Network ফিরেছে — pending sync শুরু হচ্ছে...');
    await new Promise(r => setTimeout(r, 2000)); // 2 সেকেন্ড wait
    if (pendingSyncOnReconnect) {
      pendingSyncOnReconnect = false;
      if (typeof window.saveToCloud === 'function') {
        await window.saveToCloud();
        hLog('fix', 'Reconnect-এর পর pending data push সম্পন্ন');
        healToast('Network ফিরেছে — data sync সম্পন্ন ✓', 'fix');
      }
    }
  });

  // ============================================
  // MAIN HEAL CYCLE
  // ============================================
  async function runHealCycle() {
    // ✅ V31 Guard: সিঙ্ক না হওয়া পর্যন্ত ওয়েট করো
    if (window.initialSyncComplete === false) {
      hLog('info', 'Waiting for initial cloud sync before healing...');
      return;
    }

    // Login না হলে skip
    if (sessionStorage.getItem('isLoggedIn') !== 'true') return;
    if (!window.globalData) return;

    healStats.totalRuns++;
    healStats.lastRun = new Date().toLocaleTimeString('bn-BD');
    hLog('info', `Heal cycle #${healStats.totalRuns} শুরু...`);

    let totalFixed = 0;

    // 1. Due fix (fast, local only)
    totalFixed += healStudentDues();

    // 2. Cash balance fix (fast, local only)
    totalFixed += healCashBalance();

    // 3. Duplicate finance remove (fast, local only)
    totalFixed += healDuplicateFinance();

    // 4. UI refresh fix (fast, local only)
    totalFixed += healUIRefresh();

    // 5. Student duplicate detection
    totalFixed += healStudentDuplicates();

    // 6. Employee & bank data corruption fix
    totalFixed += healEmployeeBankData();

    // 7. Orphaned payment warn
    healOrphanedPayments();

    // 8. Finance recalculation
    totalFixed += healFinanceRecalculation();

    // 9. Missing array fields init
    totalFixed += healMissingArrayFields();

    // 10. Overpayment detection (warn only)
    healOverpaymentCheck();

    // 11. Paid vs Finance mismatch fix (background auto-fix)
    totalFixed += healPaidFinanceMismatch();

    // 12. Cloud sync fix (async, network)
    totalFixed += await healSyncMismatch();

    // Update UI stats
    if (totalFixed > 0) {
      healStats.totalFixes += totalFixed;
      healStats.lastFix = new Date().toLocaleTimeString('bn-BD');
      hLog('fix', `Heal cycle সম্পন্ন — ${totalFixed}টি সমস্যা auto-fix হয়েছে ✓`);

      // ✅ V30 FIX: Local fix হলে cloud এ auto-push (data sync নিশ্চিত)
      // healSyncMismatch নিজেই cloud handle করে, তাই এখানে শুধু local fixes এর জন্য push
      // healSyncMismatch এর fixes (cloud pull/push) আলাদা count করা হয় না totalFixed এ
      // তাই এখানে push করলে loop হবে না
      if (typeof window.scheduleSyncPush === 'function') {
        window.scheduleSyncPush(`Auto-Heal: ${totalFixed} fixes`);
        hLog('info', `Heal fix cloud এ push scheduled (${totalFixed} changes)`);
      } else if (typeof window.saveToCloud === 'function') {
        await window.saveToCloud();
        hLog('info', 'Heal fix cloud এ push সম্পন্ন');
      }
    } else {
      hLog('ok', `Heal cycle সম্পন্ন — কোনো সমস্যা নেই ✓`);
    }

    // Settings-এ stats update
    updateHealStatsUI();
  }

  function updateHealStatsUI() {
    const el = document.getElementById('heal-stats-total-runs');
    if (el) el.textContent = healStats.totalRuns;
    const el2 = document.getElementById('heal-stats-total-fixes');
    if (el2) el2.textContent = healStats.totalFixes;
    const el3 = document.getElementById('heal-stats-last-run');
    if (el3) el3.textContent = healStats.lastRun || '—';
    const el4 = document.getElementById('heal-stats-last-fix');
    if (el4) el4.textContent = healStats.lastFix || 'কোনো fix দরকার হয়নি';
  }

  // ============================================
  // START
  // ============================================
  function start() {
    hLog('info', '🛡️ Auto-Heal Engine v3.0 চালু হয়েছে (প্রতি 60s) — 12 heal modules active');

    // প্রথমবার 10 সেকেন্ড পরে run করো (app load হতে দাও)
    setTimeout(() => {
      runHealCycle();
    }, 10000);

    // তারপর প্রতি 60 সেকেন্ডে
    setInterval(() => {
      runHealCycle();
    }, HEAL_INTERVAL);
  }

  // Manual trigger wrapper
  window.runAutoHealRepair = async function () {
    hLog('info', 'Manual Data Repair শুরু হচ্ছে...');
    const fixed = healPaidFinanceMismatch(true);
    if (fixed > 0) {
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
      if (typeof window.showSuccessToast === 'function') window.showSuccessToast(`✅ ${fixed}টি data mismatch সফলভাবে fix হয়েছে!`);
    } else {
      hLog('ok', 'Data already stable. No fixes needed.');
    }
  };

  // Public API
  window.autoHeal = {
    runNow: runHealCycle,
    getStats: () => healStats,
    getLogs: () => healStats.log,
    fixPaidFinance: healPaidFinanceMismatch,  // direct access
    repairNow: window.runAutoHealRepair
  };

  // DOM ready হলে start করো
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();

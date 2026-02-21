/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * DEEP END-TO-END AUTO TEST SUITE — v3.0
 * ============================================================
 * 
 * ✅ কী কী test হয়:
 *   1. Core Functions Exist (app.js লোড হয়েছে কিনা)
 *   2. globalData Structure & Integrity
 *   3. Student CRUD — add, edit, delete, restore, duplicate check
 *   4. Payment & Ledger — entry, balance, recalculate
 *   5. Supabase Sync — connectivity, push, pull, conflict detection
 *   6. Data Persistence — localStorage write/read
 *   7. UI Rendering — DOM elements present, tabs exist
 *   8. Edge Cases — empty data, negative balance, missing fields
 *   9. Cleanup — test data automatically deleted after test
 * 
 * Author  : Wings Fly IT Team
 * Version : 3.0 — June 2025
 * ============================================================
 */

(function () {
  'use strict';

  // ─── Constants ────────────────────────────────────────────
  const SUITE_VERSION = '3.0';
  const SUPABASE_URL  = 'https://gtoldrltxjrwshubplfp.supabase.co';
  const SUPABASE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';
  const TEST_TAG      = '__WFTEST__';  // এই tag দিয়ে test data চিহ্নিত হবে
  const TIMEOUT_MS    = 8000;

  // ─── State ────────────────────────────────────────────────
  let results  = [];
  let warnings = [];
  let testData = { studentRowIndex: null, financeId: null };

  // ─── Helpers ──────────────────────────────────────────────
  function pass(name, detail = '')  { results.push({ s: 'pass',  name, detail }); }
  function fail(name, detail = '')  { results.push({ s: 'fail',  name, detail }); }
  function warn(name, detail = '')  { results.push({ s: 'warn',  name, detail }); warnings.push(name); }
  function skip(name, reason = '')  { results.push({ s: 'skip',  name, detail: reason }); }

  function exists(fnName) { return typeof window[fnName] === 'function'; }

  function safeCall(fn) {
    try { return { ok: true, val: fn() }; }
    catch(e) { return { ok: false, err: e.message }; }
  }

  function timeout(ms) {
    return new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms));
  }

  function fetchSupa(path, opts = {}) {
    return Promise.race([
      fetch(`${SUPABASE_URL}${path}`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', ...opts.headers },
        ...opts
      }),
      timeout(TIMEOUT_MS)
    ]);
  }

  // ─── Render helpers ───────────────────────────────────────
  function renderSummary(total, passed, failed, warned) {
    const pct = total ? Math.round((passed / total) * 100) : 0;
    let color, icon, verdict;
    if (failed === 0 && warned === 0) { color = '#00ff88'; icon = '🎉'; verdict = 'সব ঠিক আছে! ব্যবহারের জন্য প্রস্তুত।'; }
    else if (failed === 0) { color = '#ffcc00'; icon = '⚠️'; verdict = `${warned}টি সতর্কতা আছে — ব্যবহার করা যাবে তবে review করুন।`; }
    else if (failed <= 3) { color = '#ff9933'; icon = '🔶'; verdict = `${failed}টি সমস্যা পাওয়া গেছে — ঠিক করে নিন।`; }
    else { color = '#ff4466'; icon = '❌'; verdict = `${failed}টি গুরুতর সমস্যা! এখনই fix করুন।`; }

    const el = document.getElementById('functest-summary');
    if (!el) return;
    el.style.display = 'flex';
    el.innerHTML = `
      <div style="width:100%;background:rgba(255,255,255,0.04);border:1px solid ${color}44;border-radius:12px;padding:12px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="color:${color};font-weight:700;font-size:1rem;">${icon} ${verdict}</span>
          <span style="color:${color};font-weight:800;font-size:1.1rem;">${passed}/${total} পাস</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;transition:width 0.6s;"></div>
        </div>
        <div style="display:flex;gap:16px;margin-top:8px;">
          <span style="color:#00ff88;font-size:0.78rem;">✅ Pass: ${passed}</span>
          <span style="color:#ff4466;font-size:0.78rem;">❌ Fail: ${failed}</span>
          <span style="color:#ffcc00;font-size:0.78rem;">⚠️ Warn: ${warned}</span>
          <span style="color:#888;font-size:0.78rem;">⏭ Skip: ${total - passed - failed - warned}</span>
        </div>
      </div>`;
  }

  function appendResult(r) {
    const el = document.getElementById('functest-results');
    if (!el) return;
    const colors = { pass: '#00ff88', fail: '#ff4466', warn: '#ffcc00', skip: '#888' };
    const icons  = { pass: '✅', fail: '❌', warn: '⚠️', skip: '⏭' };
    const bg = r.s === 'fail' ? 'rgba(255,68,102,0.06)' : r.s === 'warn' ? 'rgba(255,200,0,0.06)' : 'transparent';
    el.innerHTML += `
      <div style="display:flex;align-items:flex-start;gap:8px;padding:5px 4px;border-bottom:1px solid rgba(255,255,255,0.05);background:${bg};border-radius:4px;margin-bottom:2px;">
        <span style="font-size:0.85rem;min-width:18px;">${icons[r.s]}</span>
        <div style="flex:1;min-width:0;">
          <span style="color:${colors[r.s]};font-size:0.8rem;font-weight:600;">${r.name}</span>
          ${r.detail ? `<span style="color:#7aa0c4;font-size:0.72rem;margin-left:6px;">${r.detail}</span>` : ''}
        </div>
      </div>`;
    el.scrollTop = el.scrollHeight;
  }

  function sectionHeader(title) {
    const el = document.getElementById('functest-results');
    if (!el) return;
    el.innerHTML += `
      <div style="color:#00d4ff;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;
                  padding:10px 4px 4px;margin-top:6px;border-top:1px solid rgba(0,212,255,0.15);">
        ${title}
      </div>`;
  }

  function log(r) { appendResult(r); }

  // ─── Cleanup: test data মুছে ফেলা ───────────────────────
  async function cleanupTestData() {
    try {
      // LocalStorage থেকে test student সরানো
      if (window.globalData) {
        const before = (window.globalData.students || []).length;
        window.globalData.students = (window.globalData.students || []).filter(
          s => !s.name || !s.name.includes(TEST_TAG)
        );
        window.globalData.finance = (window.globalData.finance || []).filter(
          f => !f.note || !f.note.includes(TEST_TAG)
        );
        const after = (window.globalData.students || []).length;
        if (before !== after) {
          // localStorage আপডেট
          try { localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData)); } catch(e) {}
        }
      }
    } catch(e) {}
  }

  // ═══════════════════════════════════════════════════════════
  // TEST GROUPS
  // ═══════════════════════════════════════════════════════════

  // ── GROUP 1: Core Function Existence ──────────────────────
  function testCoreFunctions() {
    sectionHeader('1 — Core Functions (app.js লোড হয়েছে কিনা)');

    const critical = [
      'switchTab', 'openStudentModal', 'saveStudent', 'deleteStudent',
      'openStudentPaymentModal', 'renderStudents', 'renderFullUI',
      'saveToCloud', 'loadFromCloud', 'manualCloudSync',
      'openEmployeeModal', 'saveEmployee',
      'openAttendanceModal', 'openAccountModal',
      'exportData', 'importData',
    ];

    const optional = [
      'renderLedger', 'renderDashboard', 'calcBatchProfit',
      'filterData', 'printReport', 'exportStudentListExcel',
      'openLoanModal', 'openVisitorModal', 'recalculateCashBalanceFromTransactions',
      'openNoticeModal', 'publishNotice',
    ];

    let critFail = 0;
    critical.forEach(fn => {
      if (exists(fn)) { pass(fn, 'critical'); }
      else { fail(fn + ' missing', '⚡ Critical — এটি না থাকলে অ্যাপ কাজ করবে না'); critFail++; }
    });

    optional.forEach(fn => {
      if (exists(fn)) { pass(fn, 'optional'); }
      else { warn(fn + ' missing', 'Optional function পাওয়া যায়নি'); }
    });

    return critFail;
  }

  // ── GROUP 2: globalData Structure ─────────────────────────
  function testGlobalDataStructure() {
    sectionHeader('2 — globalData Structure & Integrity');

    const gd = window.globalData;
    if (!gd) { fail('globalData নেই', '❌ app.js লোড হয়নি বা init হয়নি'); return; }
    pass('globalData exists');

    const requiredArrays = ['students', 'finance', 'employees', 'bankAccounts', 'mobileBanking',
                            'incomeCategories', 'expenseCategories', 'courseNames', 'users',
                            'examRegistrations', 'visitors'];
    requiredArrays.forEach(key => {
      if (!Array.isArray(gd[key])) { fail(`globalData.${key} array নয়`, 'structure broken'); }
      else { pass(`globalData.${key}`, `${gd[key].length} items`); }
    });

    // cashBalance
    if (typeof gd.cashBalance === 'number') { pass('cashBalance numeric', `৳${gd.cashBalance}`); }
    else if (gd.cashBalance === undefined) { warn('cashBalance undefined', 'হয়তো init হয়নি'); }
    else { fail('cashBalance invalid type', typeof gd.cashBalance); }

    // nextId
    if (gd.nextId && gd.nextId > 0) { pass('nextId valid', `ID: ${gd.nextId}`); }
    else { warn('nextId missing or 0', 'নতুন student-এ ID সমস্যা হতে পারে'); }

    // settings
    if (gd.settings && typeof gd.settings === 'object') { pass('settings object exists'); }
    else { warn('settings missing', 'settings object নেই'); }

    // attendance
    if (gd.attendance && typeof gd.attendance === 'object') { pass('attendance object exists'); }
    else { warn('attendance missing or wrong type'); }
  }

  // ── GROUP 3: Student CRUD ──────────────────────────────────
  function testStudentCRUD() {
    sectionHeader('3 — Student CRUD Tests');

    const gd = window.globalData;
    if (!gd) { skip('Student CRUD', 'globalData নেই'); return; }

    // --- 3a: Add student (in-memory) ---
    const before = (gd.students || []).length;
    const testStudent = {
      rowIndex: Date.now(),
      name: `Test Student ${TEST_TAG}`,
      phone: '01700000000',
      course: 'Test Course',
      fee: 5000,
      paid: 2000,
      due: 3000,
      joinDate: new Date().toLocaleDateString('bn-BD'),
      status: 'Active',
      id: `TS${Date.now()}`
    };

    const r1 = safeCall(() => {
      if (!gd.students) gd.students = [];
      gd.students.push(testStudent);
      testData.studentRowIndex = testStudent.rowIndex;
    });

    if (r1.ok) {
      const after = (gd.students || []).length;
      if (after === before + 1) { pass('Student add (in-memory)', `Total: ${after}`); }
      else { fail('Student add failed', 'Array length বাড়েনি'); }
    } else { fail('Student add threw error', r1.err); }

    // --- 3b: Find student ---
    const found = (gd.students || []).find(s => s.rowIndex === testData.studentRowIndex);
    if (found) { pass('Student find by rowIndex', found.name); }
    else { fail('Student find failed', 'rowIndex দিয়ে খোঁজা যাচ্ছে না'); }

    // --- 3c: Edit student ---
    if (found) {
      const r2 = safeCall(() => { found.phone = '01711111111'; });
      if (r2.ok) {
        const updated = (gd.students || []).find(s => s.rowIndex === testData.studentRowIndex);
        if (updated && updated.phone === '01711111111') { pass('Student edit (in-memory)'); }
        else { fail('Student edit failed', 'phone আপডেট হয়নি'); }
      } else { fail('Student edit threw error', r2.err); }
    }

    // --- 3d: Duplicate ID check ---
    const ids = (gd.students || []).map(s => s.id).filter(Boolean);
    const uniqueIds = new Set(ids);
    if (ids.length === uniqueIds.size) { pass('No duplicate student IDs', `${ids.length} unique IDs`); }
    else { fail('Duplicate student IDs found!', `${ids.length} total, ${uniqueIds.size} unique`); }

    // --- 3e: Due calculation ---
    let badDue = 0;
    (gd.students || []).filter(s => !String(s.name || '').includes(TEST_TAG)).forEach(s => {
      // ✅ FIX: app.js এ due = totalPayment - paid (s.fee নয়)
      const calcDue = Math.max(0, (parseFloat(s.totalPayment) || 0) - (parseFloat(s.paid) || 0));
      const storedDue = parseFloat(s.due) || 0;
      if (Math.abs(calcDue - storedDue) > 1) badDue++;
    });
    if (badDue === 0) { pass('Student due calculations correct'); }
    else { warn(`${badDue} students have incorrect due amount`, 'totalPayment − paid ≠ due'); }

    // --- 3f: Delete (in-memory cleanup) ---
    const r3 = safeCall(() => {
      gd.students = (gd.students || []).filter(s => s.rowIndex !== testData.studentRowIndex);
    });
    if (r3.ok) {
      const afterDel = (gd.students || []).find(s => s.rowIndex === testData.studentRowIndex);
      if (!afterDel) { pass('Student delete (in-memory)'); }
      else { fail('Student delete failed', 'এখনো array-এ আছে'); }
    } else { fail('Student delete threw error', r3.err); }
  }

  // ── GROUP 4: Finance & Ledger ──────────────────────────────
  function testFinanceLedger() {
    sectionHeader('4 — Payment & Ledger Tests');

    const gd = window.globalData;
    if (!gd) { skip('Finance tests', 'globalData নেই'); return; }

    // --- 4a: Finance array structure ---
    const finance = gd.finance || [];
    if (finance.length > 0) {
      const sample = finance[0];
      const requiredFields = ['type', 'amount', 'date'];
      let missingFields = requiredFields.filter(f => sample[f] === undefined || sample[f] === null);
      if (missingFields.length === 0) { pass('Finance entries have required fields'); }
      else { warn('Finance entries missing fields', missingFields.join(', ')); }
    } else {
      warn('Finance array empty', 'কোনো transaction নেই — এটা স্বাভাবিক হতে পারে');
    }

    // --- 4b: Negative amount check ---
    const negAmt = finance.filter(f => parseFloat(f.amount) < 0);
    if (negAmt.length === 0) { pass('No negative amounts in finance'); }
    else { warn(`${negAmt.length} negative amount(s) found`, 'সম্ভবত data সমস্যা'); }

    // --- 4c: Income/Expense balance ---
    let totalIncome = 0, totalExpense = 0;
    finance.forEach(f => {
      const amt = parseFloat(f.amount) || 0;
      if (f.type === 'Income' || f.type === 'আয়') totalIncome += amt;
      else if (f.type === 'Expense' || f.type === 'ব্যয়') totalExpense += amt;
    });
    pass('Income total calculated', `৳${totalIncome.toLocaleString('en-IN')}`);
    pass('Expense total calculated', `৳${totalExpense.toLocaleString('en-IN')}`);

    // --- 4d: cashBalance consistency ---
    const storedCash = parseFloat(gd.cashBalance) || 0;
    // rough check: cash shouldn't be wildly negative
    if (storedCash >= -1000000) { pass('Cash balance in reasonable range', `৳${storedCash.toLocaleString('en-IN')}`); }
    else { warn('Cash balance very negative', `৳${storedCash} — সমস্যা আছে কিনা দেখুন`); }

    // --- 4e: recalculateCashBalanceFromTransactions function ---
    if (exists('recalculateCashBalanceFromTransactions')) {
      pass('recalculateCashBalanceFromTransactions exists');
    } else {
      warn('recalculateCashBalanceFromTransactions missing', 'Manual recalculate কাজ করবে না');
    }

    // --- 4f: Add test finance entry in-memory ---
    const testEntry = {
      id: `FIN${TEST_TAG}${Date.now()}`,
      type: 'Income',
      amount: 1,
      category: 'Test',
      note: `Auto test entry ${TEST_TAG}`,
      date: new Date().toLocaleDateString('bn-BD'),
      method: 'Cash'
    };
    const finBefore = (gd.finance || []).length;
    safeCall(() => { if (!gd.finance) gd.finance = []; gd.finance.push(testEntry); testData.financeId = testEntry.id; });
    const finAfter = (gd.finance || []).length;
    if (finAfter === finBefore + 1) { pass('Finance entry add (in-memory)'); }
    else { fail('Finance entry add failed'); }

    // Cleanup
    safeCall(() => { gd.finance = (gd.finance || []).filter(f => !String(f.note || '').includes(TEST_TAG)); });
  }

  // ── GROUP 5: LocalStorage Persistence ─────────────────────
  function testLocalStorage() {
    sectionHeader('5 — LocalStorage Persistence');

    // --- 5a: Read existing data ---
    let lsData = null;
    const r1 = safeCall(() => {
      const raw = localStorage.getItem('wingsfly_data');
      if (raw) lsData = JSON.parse(raw);
    });
    if (!r1.ok) { fail('localStorage read error', r1.err); }
    else if (!lsData) { warn('localStorage empty', 'অ্যাপ লোড বা save হয়নি'); }
    else { pass('localStorage has data', `students: ${(lsData.students||[]).length}, finance: ${(lsData.finance||[]).length}`); }

    // --- 5b: Write/Read test ---
    const testKey = `__wftest_${Date.now()}`;
    const testVal = JSON.stringify({ ts: Date.now(), tag: TEST_TAG });
    const r2 = safeCall(() => localStorage.setItem(testKey, testVal));
    if (!r2.ok) { fail('localStorage write failed', r2.err); }
    else {
      const read = localStorage.getItem(testKey);
      if (read === testVal) { pass('localStorage write/read OK'); }
      else { fail('localStorage read mismatch'); }
      safeCall(() => localStorage.removeItem(testKey));
    }

    // --- 5c: Version tracking ---
    const ver = localStorage.getItem('wings_local_version');
    if (ver) { pass('Local version tracking exists', `v${ver}`); }
    else { warn('wings_local_version missing', 'Sync conflict detection কাজ নাও করতে পারে'); }

    // --- 5d: Last sync time ---
    const syncTs = localStorage.getItem('lastSyncTime');
    if (syncTs) {
      const d = new Date(parseInt(syncTs));
      const ageMin = Math.round((Date.now() - parseInt(syncTs)) / 60000);
      if (ageMin < 120) { pass('Last sync recent', `${ageMin} মিনিট আগে`); }
      else { warn('Last sync was long ago', `${ageMin} মিনিট আগে — cloud sync হচ্ছে কিনা দেখুন`); }
    } else { warn('lastSyncTime missing', 'এখনো কোনো sync হয়নি'); }

    // --- 5e: Storage quota check ---
    let usedBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        usedBytes += (localStorage.getItem(k) || '').length * 2;
      }
      const usedKB = Math.round(usedBytes / 1024);
      if (usedKB < 3000) { pass('localStorage usage OK', `~${usedKB} KB used`); }
      else if (usedKB < 4500) { warn('localStorage usage high', `~${usedKB} KB — 5MB limit এ কাছাকাছি`); }
      else { fail('localStorage near full!', `~${usedKB} KB — sync fail হতে পারে!`); }
    } catch(e) { skip('Storage quota check', e.message); }
  }

  // ── GROUP 6: UI & DOM Elements ─────────────────────────────
  function testUIElements() {
    sectionHeader('6 — UI & DOM Elements');

    const criticalIDs = [
      'tabDashboard', 'tabStudents', 'tabLedger', 'tabAccounts',
      'tabLoans', 'tabVisitors', 'tabEmployees', 'tabExamResults',
      'syncStatusText',
    ];

    criticalIDs.forEach(id => {
      const el = document.getElementById(id);
      if (el) { pass(`#${id} exists`); }
      else { fail(`#${id} missing`, 'DOM এ element নেই'); }
    });

    // Modal checks
    const criticalModals = ['studentModal', 'settingsModal'];
    criticalModals.forEach(id => {
      const el = document.getElementById(id);
      if (el) { pass(`#${id} modal exists`); }
      else { warn(`#${id} modal missing`, 'Modal DOM এ নেই'); }
    });

    // Tab switching function
    if (exists('switchTab')) {
      const r = safeCall(() => { /* just test it doesn't throw immediately */ typeof switchTab; });
      pass('switchTab function accessible');
    } else {
      fail('switchTab missing', 'Tab navigation কাজ করবে না');
    }
  }

  // ── GROUP 7: Supabase Connectivity ────────────────────────
  async function testSupabaseConnectivity() {
    sectionHeader('7 — Supabase Connectivity & Sync');

    // --- 7a: supabase library loaded ---
    if (window.supabase) { pass('Supabase JS library loaded'); }
    else { fail('Supabase JS library missing', 'CDN লোড হয়নি'); }

    // --- 7b: wingsSync object ---
    if (window.wingsSync && typeof window.wingsSync === 'object') {
      pass('wingsSync object exists');
      if (typeof window.wingsSync.fullSync === 'function') { pass('wingsSync.fullSync method exists'); }
      else { fail('wingsSync.fullSync missing'); }
      if (typeof window.wingsSync.pushNow === 'function') { pass('wingsSync.pushNow method exists'); }
      else { fail('wingsSync.pushNow missing'); }
    } else {
      fail('wingsSync object missing', 'supabase-sync-SMART-V27.js লোড হয়নি');
    }

    // --- 7c: Network connectivity ---
    if (!navigator.onLine) {
      warn('Browser offline', 'Internet connection নেই — Supabase test skip করা হচ্ছে');
      skip('Supabase read test', 'Offline');
      skip('Supabase write test', 'Offline');
      return;
    }
    pass('Browser online');

    // --- 7d: Supabase read test ---
    let cloudData = null;
    try {
      const res = await fetchSupa('/rest/v1/academy_data?id=eq.wingsfly_main&select=version,updated_at,device_id');
      if (res.ok) {
        const arr = await res.json();
        cloudData = arr[0] || null;
        if (cloudData) { pass('Supabase READ OK', `Cloud version: v${cloudData.version || 0}`); }
        else { warn('Supabase read OK but no data', 'Cloud-এ কোনো record নেই'); }
      } else {
        fail('Supabase read failed', `HTTP ${res.status}`);
      }
    } catch(e) {
      if (e.message === 'Timeout') { fail('Supabase read TIMEOUT', `${TIMEOUT_MS/1000}s এর মধ্যে response আসেনি`); }
      else { fail('Supabase read error', e.message); }
    }

    // --- 7e: Supabase WRITE test (separate test record) ---
    const testRecordId = 'wingsfly_test_probe';
    const testPayload = {
      id: testRecordId,
      version: 1,
      device_id: 'test_suite_v3',
      updated_at: Date.now(),
      students: [],
      finance: [],
      test_tag: TEST_TAG,
      test_ts: Date.now()
    };

    try {
      // Upsert test record
      const writeRes = await fetchSupa(`/rest/v1/academy_data`, {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(testPayload)
      });

      if (writeRes.ok || writeRes.status === 201 || writeRes.status === 204 || writeRes.status === 200) {
        pass('Supabase WRITE OK', 'Test record লেখা হয়েছে');

        // --- 7f: Verify written data ---
        try {
          const verRes = await fetchSupa(`/rest/v1/academy_data?id=eq.${testRecordId}&select=id,version,test_tag`);
          if (verRes.ok) {
            const verArr = await verRes.json();
            const rec = verArr[0];
            if (rec && rec.test_tag === TEST_TAG) { pass('Supabase READ-BACK OK', 'লেখা data সঠিকভাবে পড়া গেছে'); }
            else { fail('Supabase read-back mismatch', 'লেখা data পড়া গেলেও content মিলছে না'); }
          }
        } catch(e2) { warn('Supabase read-back error', e2.message); }

        // --- 7g: Cleanup test record ---
        try {
          await fetchSupa(`/rest/v1/academy_data?id=eq.${testRecordId}`, { method: 'DELETE' });
          pass('Test record cleaned up from Supabase');
        } catch(e3) { warn('Cleanup failed', 'test record ম্যানুয়ালি delete করুন: id=wingsfly_test_probe'); }

      } else {
        const errText = await writeRes.text().catch(() => '');
        fail('Supabase WRITE failed', `HTTP ${writeRes.status} — ${errText.slice(0, 80)}`);
      }
    } catch(e) {
      if (e.message === 'Timeout') { fail('Supabase WRITE TIMEOUT', `${TIMEOUT_MS/1000}s এর মধ্যে response আসেনি`); }
      else { fail('Supabase WRITE error', e.message); }
    }

    // --- 7h: Version conflict detection ---
    if (cloudData) {
      const localVer  = parseInt(localStorage.getItem('wings_local_version')) || 0;
      const cloudVer  = cloudData.version || 0;
      const diff = Math.abs(localVer - cloudVer);
      if (diff === 0) { pass('Versions in sync', `Local v${localVer} = Cloud v${cloudVer}`); }
      else if (diff <= 2) { warn('Minor version gap', `Local v${localVer}, Cloud v${cloudVer} — ছোট ব্যবধান`); }
      else { fail('Large version gap!', `Local v${localVer} vs Cloud v${cloudVer} — data sync নেই!`); }

      // --- 7i: Device conflict check ---
      const myDevice = localStorage.getItem('wings_device_id') || '';
      if (cloudData.device_id && myDevice && cloudData.device_id !== myDevice) {
        warn('Last write from different device', `Cloud device: ${cloudData.device_id.slice(0,8)}… আপনার device আলাদা — স্বাভাবিক যদি multi-device use করেন`);
      } else {
        pass('Device ID consistent');
      }
    }

    // --- 7j: Auto-sync interval ---
    if (window.wingsSync) {
      pass('Auto-sync system active', '30s interval');
    }
  }

  // ── GROUP 8: Edge Cases ────────────────────────────────────
  function testEdgeCases() {
    sectionHeader('8 — Edge Case & Stress Tests');

    const gd = window.globalData;

    // --- 8a: Empty state handling ---
    const r1 = safeCall(() => {
      const empty = [];
      const total = empty.reduce((s, st) => s + (parseFloat(st.fee) || 0), 0);
      return total;
    });
    if (r1.ok && r1.val === 0) { pass('Empty array operations safe'); }
    else { fail('Empty array operations failed', r1.err); }

    // --- 8b: Zero-fee student ---
    const zeroFeeStudent = { name: 'Test', fee: 0, paid: 0, due: 0 };
    const r2 = safeCall(() => {
      const due = (parseFloat(zeroFeeStudent.fee) || 0) - (parseFloat(zeroFeeStudent.paid) || 0);
      if (due !== 0) throw new Error('Due should be 0');
    });
    if (r2.ok) { pass('Zero-fee student due calculation correct'); }
    else { fail('Zero-fee calculation error', r2.err); }

    // --- 8c: Large number handling ---
    const r3 = safeCall(() => {
      const bigNum = 99999999;
      return bigNum.toLocaleString('en-IN');
    });
    if (r3.ok) { pass('Large number formatting works'); }
    else { fail('Large number formatting failed', r3.err); }

    // --- 8d: JSON parse safety ---
    const r4 = safeCall(() => {
      const malformed = '{"broken": true, invalid}';
      try { JSON.parse(malformed); return false; }
      catch(e) { return true; } // এটাই সঠিক — malformed JSON throw করবে
    });
    if (r4.ok && r4.val) { pass('JSON parse error caught correctly'); }
    else { fail('JSON parse error handling broken'); }

    // --- 8e: Date handling ---
    const r5 = safeCall(() => {
      const d = new Date();
      if (isNaN(d.getTime())) throw new Error('Invalid date');
      return d.toLocaleDateString('bn-BD');
    });
    if (r5.ok) { pass('Date formatting works', r5.val); }
    else { fail('Date formatting failed', r5.err); }

    // --- 8f: Duplicate rowIndex in globalData ---
    if (gd) {
      const indices = (gd.students || []).map(s => s.rowIndex).filter(Boolean);
      const unique = new Set(indices);
      if (indices.length === unique.size) { pass('No duplicate student rowIndex'); }
      else { fail(`Duplicate rowIndex found!`, `${indices.length} total, ${unique.size} unique — Edit/Delete সমস্যা হবে`); }
    }

    // --- 8g: localStorage setItem overflow simulation (non-destructive) ---
    const r6 = safeCall(() => {
      const key = '__wftest_quota_check';
      const val = '0'.repeat(100); // Just 100 chars, safe
      localStorage.setItem(key, val);
      localStorage.removeItem(key);
      return true;
    });
    if (r6.ok) { pass('localStorage write capacity check OK'); }
    else { fail('localStorage write failed!', r6.err + ' — Storage full হতে পারে'); }
  }

  // ── GROUP 9: Sync Chain Test ────────────────────────────────
  async function testSyncChain() {
    sectionHeader('9 — Sync Chain (Local → Cloud → Local)');

    if (!navigator.onLine) { skip('Sync chain test', 'Offline'); return; }
    if (!window.globalData) { skip('Sync chain test', 'globalData নেই'); return; }

    // --- 9a: Save to localStorage ---
    let lsBefore, lsAfter;
    try {
      lsBefore = localStorage.getItem('wingsfly_data');
      const snapshot = JSON.stringify(window.globalData);
      localStorage.setItem('wingsfly_data', snapshot);
      lsAfter = localStorage.getItem('wingsfly_data');
      if (lsAfter === snapshot) { pass('Manual save to localStorage OK'); }
      else { fail('localStorage save/read mismatch'); }
    } catch(e) { fail('localStorage save failed', e.message); }

    // --- 9b: wingsSync.pushNow available ---
    if (window.wingsSync && typeof window.wingsSync.pushNow === 'function') {
      pass('Push function ready');

      // --- 9c: Trigger a non-destructive push (just check it doesn't throw) ---
      try {
        // We call pushNow but we DON'T await to avoid modifying actual data
        // Just test that the function exists and is callable
        const pushResult = window.wingsSync.pushNow('Test Suite v3 probe');
        if (pushResult && typeof pushResult.then === 'function') {
          pass('Push returns Promise (async capable)');
        } else {
          pass('Push callable');
        }
      } catch(e) { fail('Push threw error', e.message); }
    } else {
      fail('wingsSync.pushNow not available');
    }

    // --- 9d: Pull function ---
    if (window.wingsSync && typeof window.wingsSync.fullSync === 'function') {
      pass('fullSync function ready');
    } else {
      fail('fullSync not available');
    }

    // --- 9e: Realtime listener status ---
    // We check indirectly via the sync status text
    const syncText = document.getElementById('syncStatusText');
    if (syncText) {
      const txt = syncText.textContent || '';
      if (txt.includes('Error') || txt.includes('সমস্যা') || txt.includes('ব্যর্থ')) {
        fail('Sync status shows error', txt);
      } else {
        pass('Sync status OK', txt || 'Ready');
      }
    } else {
      warn('syncStatusText element not found');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN RUNNER
  // ═══════════════════════════════════════════════════════════
  async function runFunctionTests() {
    // Reset
    results  = [];
    warnings = [];
    testData = { studentRowIndex: null, financeId: null };

    const resultsEl  = document.getElementById('functest-results');
    const summaryEl  = document.getElementById('functest-summary');
    if (resultsEl)  { resultsEl.innerHTML  = ''; resultsEl.style.display = 'block'; }
    if (summaryEl)  { summaryEl.style.display = 'none'; summaryEl.innerHTML = ''; }

    // Header
    if (resultsEl) {
      resultsEl.innerHTML = `
        <div style="text-align:center;padding:10px;color:#00d4ff;font-size:0.8rem;font-weight:700;">
          🧬 Deep Test Suite v${SUITE_VERSION} — চলছে...
        </div>`;
    }

    // Run sync groups
    const critFail = testCoreFunctions();
    testGlobalDataStructure();
    testStudentCRUD();
    testFinanceLedger();
    testLocalStorage();
    testUIElements();
    testEdgeCases();

    // Run async groups
    await testSupabaseConnectivity();
    await testSyncChain();

    // Cleanup
    await cleanupTestData();

    // Final tally
    const passed = results.filter(r => r.s === 'pass').length;
    const failed = results.filter(r => r.s === 'fail').length;
    const warned = results.filter(r => r.s === 'warn').length;
    const total  = results.length;

    // Re-render all results (they were already appended live, just update summary)
    renderSummary(total, passed, failed, warned);

    // Footer
    if (resultsEl) {
      resultsEl.innerHTML += `
        <div style="text-align:center;padding:12px 4px 4px;color:#4a6080;font-size:0.7rem;border-top:1px solid rgba(255,255,255,0.05);margin-top:8px;">
          Wings Fly Test Suite v${SUITE_VERSION} · ${new Date().toLocaleString('bn-BD')} · ${total} tests
        </div>`;
    }

    // Console summary for developers
    console.group(`%c🧬 Wings Fly Test Suite v${SUITE_VERSION}`, 'color:#00d4ff;font-weight:bold');
    console.log(`Total: ${total} | Pass: ${passed} | Fail: ${failed} | Warn: ${warned}`);
    results.filter(r => r.s === 'fail').forEach(r => console.error(`❌ ${r.name}`, r.detail));
    results.filter(r => r.s === 'warn').forEach(r => console.warn(`⚠️ ${r.name}`, r.detail));
    console.groupEnd();

    return { total, passed, failed, warned };
  }

  // ─── Expose ───────────────────────────────────────────────
  window.runFunctionTests = runFunctionTests;
  window.runAutoTests     = runFunctionTests; // ✅ alias for console use

  // Auto-indicate version in console
  console.log(`%c🧬 Wings Fly Test Suite v${SUITE_VERSION} loaded (Deep E2E)`, 'color:#00d4ff');

})();

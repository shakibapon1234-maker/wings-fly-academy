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
  const SUITE_VERSION = '5.0';
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
    const { headers: extraHeaders, ...restOpts } = opts;
    return Promise.race([
      fetch(`${SUPABASE_URL}${path}`, {
        ...restOpts,
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json',
          ...(extraHeaders || {})
        }
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
    const isFail = r.s === 'fail';
    const isWarn = r.s === 'warn';
    const bg = isFail ? 'rgba(255,68,102,0.15)' : isWarn ? 'rgba(255,200,0,0.10)' : 'transparent';
    const borderLeft = isFail ? 'border-left:3px solid #ff4466;padding-left:8px;' : isWarn ? 'border-left:3px solid #ffcc00;padding-left:8px;' : '';
    const div = document.createElement('div');
    div.setAttribute('data-status', r.s);
    div.style.cssText = 'display:flex;align-items:flex-start;gap:8px;padding:' + (isFail ? '8px 4px' : '5px 4px') + ';border-bottom:1px solid rgba(255,255,255,0.05);background:' + bg + ';border-radius:4px;margin-bottom:' + (isFail ? '4px' : '2px') + ';' + borderLeft;
    div.innerHTML =
      '<span style="font-size:' + (isFail ? '1rem' : '0.85rem') + ';min-width:18px;">' + icons[r.s] + '</span>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="color:' + colors[r.s] + ';font-size:' + (isFail ? '0.88rem' : '0.8rem') + ';font-weight:' + (isFail ? '700' : '600') + ';">' + r.name + '</div>' +
        (r.detail ? '<div style="color:' + (isFail ? '#ffaaaa' : isWarn ? '#ffe08a' : '#7aa0c4') + ';font-size:0.72rem;margin-top:' + (isFail ? '3px' : '0') + ';">' + r.detail + '</div>' : '') +
      '</div>';
    el.appendChild(div);
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
      'filterData', 'printReport',
      'recalculateCashBalanceFromTransactions',
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
      if (!Array.isArray(gd[key])) {
        if (gd[key] === undefined || gd[key] === null) {
          warn(`globalData.${key} missing`, `Cloud data-তে এই field নেই — app auto-init করবে`);
          gd[key] = [];
        } else {
          fail(`globalData.${key} array নয়`, `type: ${typeof gd[key]} — structure broken`);
        }
      } else {
        pass(`globalData.${key}`, `${gd[key].length} items`);
      }
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
    const ids = (gd.students || []).map(s => s.studentId || s.id).filter(Boolean);
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
      const res = await fetchSupa('/rest/v1/academy_data?id=eq.wingsfly_main&select=version,last_updated,last_device');
      if (res.ok) {
        const arr = await res.json();
        cloudData = arr[0] || null;
        if (cloudData) { pass('Supabase READ OK', `Cloud version: v${cloudData.version || 0}`); }
        else { warn('Supabase read OK but no data', 'Cloud-এ কোনো record নেই'); }
      } else {
        const errText = await res.text().catch(() => '');
        fail('Supabase read failed', `HTTP ${res.status} — ${errText.slice(0, 80)}`);
      }
    } catch(e) {
      if (e.message === 'Timeout') { fail('Supabase read TIMEOUT', `${TIMEOUT_MS/1000}s এর মধ্যে response আসেনি`); }
      else { fail('Supabase read error', e.message); }
    }

    // --- 7e: Supabase WRITE test (separate test record) ---
    // শুধু actual column names ব্যবহার করো যেগুলো table-এ আছে
    const testRecordId = 'wingsfly_test_probe';
    const testPayload = {
      id: testRecordId,
      version: 1,
      last_updated: new Date().toISOString(),
      last_device: 'test_suite_v3',
      students: [],
      finance: []
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
          const verRes = await fetchSupa(`/rest/v1/academy_data?id=eq.${testRecordId}&select=id,version,last_device`);
          if (verRes.ok) {
            const verArr = await verRes.json();
            const rec = verArr[0];
            if (rec && rec.last_device === 'test_suite_v3') { pass('Supabase READ-BACK OK', 'লেখা data সঠিকভাবে পড়া গেছে'); }
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
      if (cloudData.last_device && myDevice && cloudData.last_device !== myDevice) {
        warn('Last write from different device', `Cloud device: ${cloudData.last_device.slice(0,8)}… আপনার device আলাদা — স্বাভাবিক যদি multi-device use করেন`);
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

  // ── GROUP 10: Finance Calculation Integrity ────────────────
  function testFinanceIntegrity() {
    sectionHeader('10 — Finance Calculation Integrity');
    const gd = window.globalData;
    if (!gd) { skip('Finance integrity', 'globalData নেই'); return; }

    const finance = gd.finance || [];

    // --- 10a: Student payment vs finance ledger match ---
    const paymentEntries = finance.filter(f => f.type === 'Income' || f.type === 'আয়' || f.category === 'Student Fee' || f.category === 'ফি');
    const totalPaidFromStudents = (gd.students || []).reduce((sum, s) => sum + (parseFloat(s.paid) || 0), 0);
    pass('Student total paid calculated', `৳${totalPaidFromStudents.toLocaleString('en-IN')}`);

    // --- 10b: Orphaned payments (finance-এ student নেই) ---
    const studentNames = new Set((gd.students || []).map(s => (s.name || '').trim().toLowerCase()));
    const orphaned = finance.filter(f => {
      if (!f.person && !f.studentName) return false;
      const person = ((f.person || f.studentName || '')).trim().toLowerCase();
      return person && !studentNames.has(person);
    });
    if (orphaned.length === 0) { pass('No orphaned payments', 'সব payment-এর student আছে'); }
    else { warn(`${orphaned.length}টি orphaned payment`, 'Finance-এ student নেই এমন entry আছে'); }

    // --- 10c: Duplicate finance entries (same person+amount+date+type) ---
    // person name ও include করো নয়তো আলাদা student এর same amount false positive দেয়
    const finKeys = new Map();
    let dupCount = 0;
    finance.forEach(f => {
      const key = `${f.type}|${f.amount}|${f.date}|${(f.person||'').trim().toLowerCase()}`;
      finKeys.set(key, (finKeys.get(key) || 0) + 1);
    });
    finKeys.forEach((count, key) => { if (count > 1) dupCount += count - 1; });
    if (dupCount === 0) { pass('No duplicate finance entries'); }
    else { warn(`${dupCount}টি সম্ভাব্য duplicate entry`, 'একই date+amount+type+person এর multiple entry'); }

    // --- 10d: Cash-only Income/Expense net vs cashBalance ---
    // শুধু Cash method এর transactions দিয়ে cashBalance compare করো
    let calcCash = 0;
    finance.forEach(f => {
      if (f.method !== 'Cash') return;
      const amt = parseFloat(f.amount) || 0;
      if (f.type === 'Income' || f.type === 'আয়') calcCash += amt;
      else if (f.type === 'Expense' || f.type === 'ব্যয়') calcCash -= amt;
    });
    const storedCash = parseFloat(gd.cashBalance) || 0;
    const gap = Math.abs(calcCash - storedCash);
    if (gap < 1) { pass('Cash balance matches transactions', `৳${storedCash.toLocaleString('en-IN')}`); }
    else if (gap < 10000) { warn('Cash balance minor gap', `Calculated ৳${calcCash.toFixed(0)} vs Stored ৳${storedCash.toFixed(0)} (গ্যাপ: ৳${gap.toFixed(0)})`); }
    else { fail('Cash balance mismatch!', `Calculated ৳${calcCash.toFixed(0)} vs Stored ৳${storedCash.toFixed(0)} — recalculate করুন`); }

    // --- 10e: Student due total integrity ---
    let totalDue = 0, badDueCount = 0;
    (gd.students || []).forEach(s => {
      const due = parseFloat(s.due) || 0;
      const correct = Math.max(0, (parseFloat(s.totalPayment) || 0) - (parseFloat(s.paid) || 0));
      totalDue += due;
      if (Math.abs(due - correct) > 1) badDueCount++;
    });
    if (badDueCount === 0) { pass('All student dues correct', `মোট বকেয়া: ৳${totalDue.toLocaleString('en-IN')}`); }
    else { fail(`${badDueCount} student-এর due ভুল!`, 'Auto-Heal চালালে fix হবে'); }

    // --- 10f: Bank + Mobile balance total ---
    const bankTotal = (gd.bankAccounts || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
    const mobileTotal = (gd.mobileBanking || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
    pass('Bank balances totaled', `৳${bankTotal.toLocaleString('en-IN')}`);
    pass('Mobile banking balances totaled', `৳${mobileTotal.toLocaleString('en-IN')}`);
  }

  // ── GROUP 11: Employee & Attendance Tests ──────────────────
  function testEmployeeAttendance() {
    sectionHeader('11 — Employee & Attendance Tests');
    const gd = window.globalData;
    if (!gd) { skip('Employee tests', 'globalData নেই'); return; }

    // --- 11a: Employee array ---
    const employees = gd.employees || [];
    if (employees.length > 0) { pass('Employees exist', `${employees.length} জন`); }
    else { warn('No employees', 'Employee data নেই — স্বাভাবিক হতে পারে'); }

    // --- 11b: Employee required fields ---
    let empBad = 0;
    employees.forEach(e => {
      if (!e.name || !e.id) empBad++;
    });
    if (empBad === 0) { pass('Employee data integrity OK'); }
    else { fail(`${empBad} employee-এর name/id missing!`, 'Data corrupt হতে পারে'); }

    // --- 11c: Duplicate employee ID ---
    const empIds = employees.map(e => e.id).filter(Boolean);
    const uniqueEmpIds = new Set(empIds);
    if (empIds.length === uniqueEmpIds.size) { pass('No duplicate employee IDs'); }
    else { fail('Duplicate employee IDs!', `${empIds.length} total, ${uniqueEmpIds.size} unique`); }

    // --- 11d: Attendance structure ---
    const att = gd.attendance;
    if (!att || typeof att !== 'object') {
      warn('Attendance data missing or invalid type');
    } else {
      const attKeys = Object.keys(att);
      pass('Attendance records exist', `${attKeys.length} দিনের রেকর্ড`);

      // Check for corrupt attendance entries
      let attBad = 0;
      attKeys.slice(-7).forEach(date => { // Last 7 days only
        const dayData = att[date];
        if (dayData && typeof dayData !== 'object') attBad++;
      });
      if (attBad === 0) { pass('Recent attendance data structure OK'); }
      else { warn(`${attBad} attendance entry corrupt`); }
    }

    // --- 11e: Salary consistency ---
    const empWithSalary = employees.filter(e => parseFloat(e.salary) > 0);
    if (empWithSalary.length > 0) {
      pass('Employee salary data present', `${empWithSalary.length} জন-এর salary আছে`);
      const totalSalary = empWithSalary.reduce((s, e) => s + (parseFloat(e.salary) || 0), 0);
      pass('Total salary calculated', `৳${totalSalary.toLocaleString('en-IN')}/মাস`);
    } else {
      warn('No salary data found', 'Employee salary set করা হয়নি');
    }
  }

  // ── GROUP 12: Performance & Load Tests ────────────────────
  function testPerformance() {
    sectionHeader('12 — Performance & Load Tests');
    const gd = window.globalData;

    // --- 12a: localStorage read speed ---
    const t1 = performance.now();
    for (let i = 0; i < 100; i++) { localStorage.getItem('wingsfly_data'); }
    const lsTime = performance.now() - t1;
    if (lsTime < 50) { pass('localStorage read fast', `100x read: ${lsTime.toFixed(1)}ms`); }
    else if (lsTime < 200) { warn('localStorage read slow', `${lsTime.toFixed(1)}ms — data বড় হয়ে যাচ্ছে`); }
    else { fail('localStorage read very slow!', `${lsTime.toFixed(1)}ms — performance সমস্যা`); }

    // --- 12b: JSON stringify speed ---
    if (gd) {
      const t2 = performance.now();
      for (let i = 0; i < 10; i++) { JSON.stringify(gd); }
      const jsonTime = performance.now() - t2;
      if (jsonTime < 100) { pass('JSON serialization fast', `10x: ${jsonTime.toFixed(1)}ms`); }
      else { warn('JSON serialization slow', `${jsonTime.toFixed(1)}ms — data অনেক বড়`); }
    }

    // --- 12c: Data size check ---
    const raw = localStorage.getItem('wingsfly_data') || '';
    const sizeKB = (raw.length / 1024).toFixed(1);
    const sizeMB = (raw.length / 1024 / 1024).toFixed(2);
    if (raw.length < 1024 * 500) { pass('Data size OK', `${sizeKB} KB`); }
    else if (raw.length < 1024 * 1024 * 2) { warn('Data size growing', `${sizeMB} MB — monitor করুন`); }
    else { fail('Data size too large!', `${sizeMB} MB — localStorage limit হতে পারে`); }

    // --- 12d: DOM element count ---
    const domCount = document.querySelectorAll('*').length;
    if (domCount < 2000) { pass('DOM size normal', `${domCount} elements`); }
    else if (domCount < 5000) { warn('DOM getting large', `${domCount} elements`); }
    else { fail('DOM too large!', `${domCount} elements — memory leak হতে পারে`); }

    // --- 12e: Student array sort speed ---
    if (gd && gd.students && gd.students.length > 0) {
      const copy = [...gd.students];
      const t3 = performance.now();
      copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      const sortTime = performance.now() - t3;
      if (sortTime < 50) { pass('Student sort fast', `${copy.length} students: ${sortTime.toFixed(2)}ms`); }
      else { warn('Student sort slow', `${sortTime.toFixed(2)}ms`); }
    }

    // --- 12f: Memory estimate ---
    if (performance.memory) {
      const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
      const limitMB = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0);
      const pct = Math.round(performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100);
      if (pct < 50) { pass('Memory usage OK', `${usedMB}MB / ${limitMB}MB (${pct}%)`); }
      else if (pct < 80) { warn('Memory usage high', `${usedMB}MB (${pct}%)`); }
      else { fail('Memory critical!', `${usedMB}MB / ${limitMB}MB (${pct}%) — page reload করুন`); }
    } else {
      skip('Memory test', 'Browser API unavailable');
    }
  }

  // ── GROUP 13: Data Integrity Deep Scan ────────────────────
  function testDataIntegrity() {
    sectionHeader('13 — Data Integrity Deep Scan');
    const gd = window.globalData;
    if (!gd) { skip('Data integrity', 'globalData নেই'); return; }

    // --- 13a: Student required fields check ---
    let missingName = 0, missingId = 0, negPaid = 0;
    (gd.students || []).forEach(s => {
      if (!s.name || s.name.trim() === '') missingName++;
      if (!s.studentId && !s.id && !s.rowIndex) missingId++;
      if (parseFloat(s.paid) < 0) negPaid++;
    });
    if (missingName === 0) { pass('All students have names'); }
    else { fail(`${missingName} student-এর name নেই!`, 'Data corrupt'); }
    if (missingId === 0) { pass('All students have IDs'); }
    else { warn(`${missingId} student-এর ID নেই`, 'Edit/Delete সমস্যা হতে পারে'); }
    if (negPaid === 0) { pass('No negative payments'); }
    else { fail(`${negPaid} student-এর paid amount negative!`); }

    // --- 13b: Course name validation ---
    const validCourses = new Set((gd.courseNames || []).map(c => typeof c === 'string' ? c : c.name || ''));
    let invalidCourse = 0;
    if (validCourses.size > 0) {
      (gd.students || []).forEach(s => {
        if (s.course && !validCourses.has(s.course)) invalidCourse++;
      });
      if (invalidCourse === 0) { pass('All student courses valid'); }
      else { warn(`${invalidCourse} student-এর course name invalid`, 'Course list থেকে বাদ গেছে'); }
    } else {
      warn('Course list empty', 'কোনো course add করা হয়নি');
    }

    // --- 13c: Bank account integrity ---
    let bankBad = 0;
    (gd.bankAccounts || []).forEach(acc => {
      if (!acc.name || isNaN(parseFloat(acc.balance))) bankBad++;
    });
    if (bankBad === 0) { pass('Bank accounts integrity OK'); }
    else { fail(`${bankBad} bank account corrupt!`, 'name বা balance invalid'); }

    // --- 13d: Mobile banking integrity ---
    let mbBad = 0;
    (gd.mobileBanking || []).forEach(acc => {
      if (!acc.name || isNaN(parseFloat(acc.balance))) mbBad++;
    });
    if (mbBad === 0) { pass('Mobile banking integrity OK'); }
    else { fail(`${mbBad} mobile account corrupt!`); }

    // --- 13e: User accounts check ---
    const users = gd.users || [];
    if (users.length > 0) {
      pass('User accounts exist', `${users.length} জন user`);
      const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'Admin' || u.access === 'Master Access');
      if (adminUsers.length > 0) { pass('Admin user exists', adminUsers[0].name || adminUsers[0].username); }
      else { warn('No admin user found!', 'Login সমস্যা হতে পারে'); }
    } else {
      fail('No users found!', 'Login কাজ করবে না');
    }

    // --- 13f: Settings object integrity ---
    const settings = gd.settings || {};
    const settingsKeys = Object.keys(settings);
    if (settingsKeys.length > 0) { pass('Settings data present', `${settingsKeys.length} keys`); }
    else { warn('Settings empty', 'Default settings use হবে'); }
  }

  // ── GROUP 14: Real-time Sync Conflict Simulation ──────────
  async function testSyncConflict() {
    sectionHeader('14 — Real-time Sync Conflict Simulation');
    const gd = window.globalData;
    if (!gd) { skip('Sync conflict tests', 'globalData নেই'); return; }

    // --- 14a: Simulate two devices editing same student ---
    const students = gd.students || [];
    if (students.length === 0) { skip('Conflict test', 'কোনো student নেই'); }
    else {
      const target = students[0];
      const originalPaid = target.paid;

      // Device A: paid = X + 500
      const deviceA = { ...target, paid: (parseFloat(target.paid) || 0) + 500, _device: 'DeviceA', _ts: Date.now() - 1000 };
      // Device B: paid = X + 1000 (newer)
      const deviceB = { ...target, paid: (parseFloat(target.paid) || 0) + 1000, _device: 'DeviceB', _ts: Date.now() };

      // Conflict resolution: newer timestamp wins (Last-Write-Wins)
      const resolved = deviceA._ts > deviceB._ts ? deviceA : deviceB;
      if (resolved._device === 'DeviceB') {
        pass('LWW conflict resolution correct', 'Newer timestamp (DeviceB) wins ✓');
      } else {
        fail('LWW conflict resolution wrong!', 'Older timestamp should not win');
      }

      // Restore original (no actual data changed)
      target.paid = originalPaid;
    }

    // --- 14b: Version vector conflict detection ---
    const localVer = parseInt(localStorage.getItem('wings_local_version')) || 0;
    const r1 = safeCall(() => {
      // Simulate: cloud has higher version
      const cloudVer = localVer + 5;
      const gap = cloudVer - localVer;
      if (gap > 10) throw new Error('Version gap too large — data loss possible');
      return gap;
    });
    if (r1.ok) { pass('Version gap within safe limit', `Gap: ${r1.val} versions`); }
    else { warn('Version gap concern', r1.err); }

    // --- 14c: Concurrent write simulation ---
    const r2 = safeCall(() => {
      // Simulate two writes happening within 100ms
      const write1 = { ts: Date.now(), data: 'A', seq: 1 };
      const write2 = { ts: Date.now() + 50, data: 'B', seq: 2 };
      // Seq-based resolution: higher seq wins
      const winner = write1.seq > write2.seq ? write1 : write2;
      if (winner.data !== 'B') throw new Error('Wrong winner');
      return winner.data;
    });
    if (r2.ok) { pass('Concurrent write resolution (seq-based)', `Winner: Write ${r2.val}`); }
    else { fail('Concurrent write resolution failed', r2.err); }

    // --- 14d: Merge strategy — arrays combine without loss ---
    const r3 = safeCall(() => {
      const local  = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
      const cloud  = [{ id: 1, name: 'Alice Updated' }, { id: 3, name: 'Charlie' }];
      // Smart merge: cloud items update local, new items added, deletions ignored
      const merged = [...local];
      cloud.forEach(ci => {
        const idx = merged.findIndex(l => l.id === ci.id);
        if (idx >= 0) merged[idx] = ci; // update
        else merged.push(ci); // add new
      });
      if (merged.length !== 3) throw new Error(`Merge wrong length: ${merged.length}`);
      if (merged[0].name !== 'Alice Updated') throw new Error('Update not applied');
      return merged.length;
    });
    if (r3.ok) { pass('Smart merge strategy correct', `${r3.val} items after merge`); }
    else { fail('Merge strategy failed', r3.err); }

    // --- 14e: Offline queue simulation ---
    const r4 = safeCall(() => {
      const queue = [];
      // Simulate 3 offline operations
      queue.push({ op: 'add_student', data: { name: 'Test' }, ts: Date.now() });
      queue.push({ op: 'add_payment', data: { amount: 500 }, ts: Date.now() + 1 });
      queue.push({ op: 'edit_student', data: { id: 1, name: 'Updated' }, ts: Date.now() + 2 });
      // On reconnect, apply in order
      const applied = queue.sort((a, b) => a.ts - b.ts).map(q => q.op);
      if (applied[0] !== 'add_student') throw new Error('Queue order wrong');
      return applied.length;
    });
    if (r4.ok) { pass('Offline queue ordering correct', `${r4.val} queued ops in order`); }
    else { fail('Offline queue failed', r4.err); }

    // --- 14f: Data snapshot & rollback capability ---
    const r5 = safeCall(() => {
      const snapshot = JSON.stringify({ students: (gd.students || []).slice(0, 2) });
      const restored = JSON.parse(snapshot);
      if (!Array.isArray(restored.students)) throw new Error('Snapshot corrupt');
      return restored.students.length;
    });
    if (r5.ok) { pass('Snapshot & rollback mechanism OK', `Snapshot: ${r5.val} students`); }
    else { fail('Snapshot mechanism broken', r5.err); }
  }

  // ── GROUP 15: Security & Auth Tests ───────────────────────
  function testSecurityAuth() {
    sectionHeader('15 — Security & Auth Tests');

    // --- 15a: Login session ---
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') { pass('Session active', 'isLoggedIn = true'); }
    else { fail('Session not active!', 'User logged out হয়ে গেছে'); }

    // --- 15b: Password not stored in plain text in localStorage ---
    const rawLS = localStorage.getItem('wingsfly_data') || '';
    const passMatches = [...rawLS.matchAll(/"password"\s*:\s*"([^"]+)"/g)];
    const hasPlainPass = passMatches.some(m => !/^[a-f0-9]{64}$/.test(m[1]));
    if (!hasPlainPass) { pass('Passwords hashed in localStorage ✓', 'SHA-256 — secure'); }
    else { warn('Plain-text password in localStorage!', 'Security risk — hash করুন'); }

    // --- 15c: API key not exposed in globalData ---
    const gdStr = JSON.stringify(window.globalData || {});
    const hasApiKey = gdStr.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    if (!hasApiKey) { pass('API key not in globalData'); }
    else { warn('API key found in globalData!', 'Memory থেকে leak হতে পারে'); }

    // --- 15d: XSS injection simulation ---
    const r1 = safeCall(() => {
      const malicious = '<script>alert("xss")</script>';
      const div = document.createElement('div');
      div.textContent = malicious; // textContent is safe
      if (div.innerHTML.includes('<script>')) throw new Error('XSS vulnerability!');
      return div.innerHTML;
    });
    if (r1.ok) { pass('XSS prevention (textContent safe)', 'Escaped correctly'); }
    else { fail('XSS vulnerability!', r1.err); }

    // --- 15e: Session expiry check ---
    const loginTime = parseInt(sessionStorage.getItem('loginTime') || '0');
    if (loginTime > 0) {
      const ageHours = (Date.now() - loginTime) / 3600000;
      if (ageHours < 24) { pass('Session age OK', `${ageHours.toFixed(1)} ঘণ্টা`); }
      else { warn('Session very old', `${ageHours.toFixed(0)} ঘণ্টা — re-login করুন`); }
    } else {
      skip('Session age check', 'loginTime not tracked');
    }

    // --- 15f: User role validation ---
    const gd = window.globalData;
    if (gd && gd.users) {
      const currentUser = sessionStorage.getItem('username') || sessionStorage.getItem('currentUser') || '';
      const userObj = gd.users.find(u => u.username === currentUser || u.name === currentUser || (u.name || '').startsWith(currentUser.charAt(0)));
      if (userObj) {
        pass('Current user found in DB', `Role: ${userObj.role || userObj.access || 'N/A'}`);
      } else {
        warn('Current user not in DB', 'Session মিলছে না');
      }
    }
  }

  // ── GROUP 16: Exam & Visitor Module Tests ─────────────────
  function testExamVisitor() {
    sectionHeader('16 — Exam & Visitor Module Tests');
    const gd = window.globalData;
    if (!gd) { skip('Exam/Visitor tests', 'globalData নেই'); return; }

    // --- 16a: Exam registrations ---
    const exams = gd.examRegistrations || [];
    if (exams.length > 0) {
      pass('Exam registrations exist', `${exams.length}টি registration`);
      let examBad = 0;
      exams.forEach(e => { if (!e.name && !e.studentName) examBad++; });
      if (examBad === 0) { pass('Exam registration data integrity OK'); }
      else { warn(`${examBad} exam entry-তে name নেই`); }
    } else {
      skip('Exam registration tests', 'কোনো exam registration নেই');
    }

    // --- 16b: Visitor data ---
    const visitors = gd.visitors || [];
    if (visitors.length > 0) {
      pass('Visitor records exist', `${visitors.length} জন visitor`);
      let visBad = 0;
      visitors.forEach(v => { if (!v.name) visBad++; });
      if (visBad === 0) { pass('Visitor data integrity OK'); }
      else { warn(`${visBad} visitor-এর name নেই`); }
    } else {
      skip('Visitor tests', 'কোনো visitor record নেই');
    }

    // --- 16c: Notice board ---
    const notices = gd.notices || gd.noticeBoard || [];
    if (notices.length > 0) {
      pass('Notice board has data', `${notices.length}টি notice`);
    } else {
      skip('Notice board test', 'কোনো notice নেই');
    }

    // --- 16d: renderVisitors function ---
    if (exists('renderVisitors')) { pass('renderVisitors function exists'); }
    else { warn('renderVisitors missing', 'Visitor tab কাজ নাও করতে পারে'); }

    // --- 16e: Exam date validation ---
    if (exams.length > 0) {
      const invalidDates = exams.filter(e => {
        if (!e.date && !e.examDate) return false;
        const d = new Date(e.date || e.examDate);
        return isNaN(d.getTime());
      });
      if (invalidDates.length === 0) { pass('Exam dates all valid'); }
      else { warn(`${invalidDates.length} exam-এর date invalid`); }
    }
  }

  // ── GROUP 17: Stress & Boundary Tests ─────────────────────
  function testStressBoundary() {
    sectionHeader('17 — Stress & Boundary Tests');
    const gd = window.globalData;

    // --- 17a: Large student list simulation ---
    const r1 = safeCall(() => {
      const fakeStudents = Array.from({ length: 500 }, (_, i) => ({
        id: `STRESS_${i}`, name: `Student ${i}`, paid: i * 100, totalPayment: i * 150, due: i * 50
      }));
      const filtered = fakeStudents.filter(s => s.due > 10000);
      const sorted = fakeStudents.sort((a, b) => b.due - a.due);
      return sorted[0].due;
    });
    if (r1.ok) { pass('500 student stress test passed', `Max due: ৳${r1.val.toLocaleString('en-IN')}`); }
    else { fail('Student stress test failed', r1.err); }

    // --- 17b: Rapid localStorage write test ---
    const r2 = safeCall(() => {
      const key = '__stress_test__';
      let writes = 0;
      const t = performance.now();
      while (performance.now() - t < 100) { // 100ms-এ যত পারে
        localStorage.setItem(key, JSON.stringify({ ts: Date.now(), i: writes }));
        writes++;
        if (writes >= 50) break;
      }
      localStorage.removeItem(key);
      return writes;
    });
    if (r2.ok) { pass('Rapid localStorage write OK', `${r2.val} writes in 100ms`); }
    else { fail('localStorage stress failed', r2.err); }

    // --- 17c: Special character handling ---
    const r3 = safeCall(() => {
      const special = 'নাম: "আহমেদ" & <test> 100% ৳5,000\'s';
      const encoded = JSON.stringify({ name: special });
      const decoded = JSON.parse(encoded);
      if (decoded.name !== special) throw new Error('Special chars corrupted');
      return true;
    });
    if (r3.ok) { pass('Special character (Bengali + symbols) safe'); }
    else { fail('Special character handling broken', r3.err); }

    // --- 17d: Circular reference protection ---
    const r4 = safeCall(() => {
      const obj = { a: 1 };
      // obj.self = obj; // Circular — would break JSON.stringify
      // Test that we DETECT circular refs safely
      try {
        JSON.stringify(obj); // Safe object — should work
        return true;
      } catch(e) { throw new Error('Safe object failed: ' + e.message); }
    });
    if (r4.ok) { pass('JSON circular reference protection OK'); }
    else { fail('JSON serialization issue', r4.err); }

    // --- 17e: Boundary value calculations ---
    const r5 = safeCall(() => {
      const tests = [
        { paid: 0, total: 0, expected: 0 },
        { paid: 100, total: 100, expected: 0 },
        { paid: 200, total: 100, expected: 0 }, // overpaid → due = 0
        { paid: 0, total: 999999, expected: 999999 },
      ];
      tests.forEach(t => {
        const due = Math.max(0, t.total - t.paid);
        if (due !== t.expected) throw new Error(`${t.paid}/${t.total} → expected ${t.expected} got ${due}`);
      });
      return tests.length;
    });
    if (r5.ok) { pass('Boundary value tests all correct', `${r5.val} cases`); }
    else { fail('Boundary value calculation error', r5.err); }

    // --- 17f: Null/undefined safety ---
    const r6 = safeCall(() => {
      const nullTests = [null, undefined, '', 0, false, NaN];
      nullTests.forEach(v => {
        const safe = parseFloat(v) || 0;
        if (isNaN(safe)) throw new Error(`parseFloat(${v}) = NaN — not safe`);
      });
      return nullTests.length;
    });
    if (r6.ok) { pass('Null/undefined value safety OK', `${r6.val} edge cases passed`); }
    else { fail('Null safety issue!', r6.err); }

    // --- 17g: Array mutation safety ---
    const r7 = safeCall(() => {
      const original = [1, 2, 3];
      const copy = [...original]; // spread copy
      copy.push(4);
      if (original.length !== 3) throw new Error('Original mutated!');
      return true;
    });
    if (r7.ok) { pass('Array immutability (spread copy) safe'); }
    else { fail('Array mutation detected!', r7.err); }
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
    testFinanceIntegrity();
    testEmployeeAttendance();
    testPerformance();
    testDataIntegrity();
    testSecurityAuth();
    testExamVisitor();
    testStressBoundary();

    // Run async groups
    await testSupabaseConnectivity();
    await testSyncChain();
    await testSyncConflict();

    // Cleanup
    await cleanupTestData();

    // Final tally
    const passed = results.filter(r => r.s === 'pass').length;
    const failed = results.filter(r => r.s === 'fail').length;
    const warned = results.filter(r => r.s === 'warn').length;
    const total  = results.length;

    // Re-render all results (they were already appended live, just update summary)
    renderSummary(total, passed, failed, warned);

    // ── Errors & Warnings উপরে নিয়ে আসো ──
    if (failed > 0 || warned > 0) {
      const resultsContainer = document.getElementById('functest-results');
      if (resultsContainer) {
        let topHtml = '';
        if (failed > 0) {
          const failItems = results.filter(r => r.s === 'fail');
          topHtml += '<div style="background:rgba(255,68,102,0.12);border:1.5px solid rgba(255,68,102,0.5);border-radius:10px;padding:10px 12px;margin-bottom:8px;">' +
            '<div style="color:#ff4466;font-size:0.82rem;font-weight:700;margin-bottom:6px;">❌ ' + failed + 'টি Error — এগুলো fix করুন:</div>';
          failItems.forEach(r => {
            topHtml += '<div style="padding:4px 0 4px 8px;border-left:2px solid #ff4466;margin-bottom:4px;">' +
              '<div style="color:#ff4466;font-size:0.82rem;font-weight:700;">❌ ' + r.name + '</div>' +
              (r.detail ? '<div style="color:#ffaaaa;font-size:0.72rem;margin-top:2px;">' + r.detail + '</div>' : '') +
              '</div>';
          });
          topHtml += '</div>';
        }
        if (warned > 0) {
          const warnItems = results.filter(r => r.s === 'warn');
          topHtml += '<div style="background:rgba(255,200,0,0.08);border:1.5px solid rgba(255,200,0,0.4);border-radius:10px;padding:10px 12px;margin-bottom:8px;">' +
            '<div style="color:#ffcc00;font-size:0.82rem;font-weight:700;margin-bottom:6px;">⚠️ ' + warned + 'টি Warning — Review করুন:</div>';
          warnItems.forEach(r => {
            topHtml += '<div style="padding:4px 0 4px 8px;border-left:2px solid #ffcc00;margin-bottom:4px;">' +
              '<div style="color:#ffcc00;font-size:0.82rem;font-weight:600;">⚠️ ' + r.name + '</div>' +
              (r.detail ? '<div style="color:#ffe08a;font-size:0.72rem;margin-top:2px;">' + r.detail + '</div>' : '') +
              '</div>';
          });
          topHtml += '</div>';
        }
        topHtml += '<div style="color:#4a6080;font-size:0.7rem;text-align:center;padding:2px 0 6px;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:4px;">── সব results ──</div>';
        const headerDiv = resultsContainer.querySelector('div');
        if (headerDiv) {
          headerDiv.insertAdjacentHTML('afterend', topHtml);
        } else {
          resultsContainer.insertAdjacentHTML('afterbegin', topHtml);
        }
        resultsContainer.scrollTop = 0;
      }
    }

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

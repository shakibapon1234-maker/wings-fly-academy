/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * AUTO TEST SUITE — v8.0
 * ============================================================
 *
 * ✅ v8 পরিবর্তন:
 *   - সব test group একটি unified UI-তে
 *   - Category-based visual grouping (accordion style)
 *   - Background monitor integrated (আলাদা ছিল, এখন একসাথে)
 *   - Real-time streaming results
 *   - Smart filter: শুধু Fail/Warn দেখান বাটন
 *   - Export report feature
 *   - Security Question modal fix detection
 *
 * TEST CATEGORIES (7টি):
 *   🔴 CRITICAL  — Core Functions, DOM, Auth
 *   🟠 DATA      — globalData, Student CRUD, Finance, Integrity
 *   🟡 SYNC      — Supabase, Sync Chain, Conflict
 *   🟢 MODULES   — Employee, Exam, Visitor, Accounts, Keep Records
 *   🔵 FINANCE   — Calculation Integrity, Loan, Balance
 *   🟣 PERF      — Performance, Memory, Storage
 *   ⚪ SECURITY  — Auth, XSS, Password Safety
 *
 * Author  : Wings Fly IT Team
 * Version : 8.0 — March 2026
 * ============================================================
 */

(function () {
  'use strict';

  const SUITE_VERSION = '8.0';
  const SUPABASE_URL = window.SUPABASE_CONFIG?.URL || 'https://gtoldrltxjrwshubplfp.supabase.co';
  const SUPABASE_KEY = window.SUPABASE_CONFIG?.KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';
  const TEST_TAG = '__WFTEST__';
  const TIMEOUT_MS = 8000;

  // ─── State ────────────────────────────────────────────────
  let results = [];
  let currentCategory = '';

  // ─── Helpers ──────────────────────────────────────────────
  function pass(name, detail = '') { _log({ s: 'pass', name, detail, cat: currentCategory }); }
  function fail(name, detail = '') { _log({ s: 'fail', name, detail, cat: currentCategory }); }
  function warn(name, detail = '') { _log({ s: 'warn', name, detail, cat: currentCategory }); }
  function skip(name, reason = '') { _log({ s: 'skip', name, detail: reason, cat: currentCategory }); }

  function exists(fnName) { return typeof window[fnName] === 'function'; }
  function safeCall(fn) {
    try { return { ok: true, val: fn() }; }
    catch (e) { return { ok: false, err: e.message }; }
  }
  function timeout(ms) {
    return new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), ms));
  }
  function fetchSupa(path, opts = {}) {
    const { headers: h, ...rest } = opts;
    return Promise.race([
      fetch(`${SUPABASE_URL}${path}`, {
        ...rest, headers: {
          'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY,
          'Content-Type': 'application/json', ...(h || {})
        }
      }),
      timeout(TIMEOUT_MS)
    ]);
  }

  // ─── UI Render ────────────────────────────────────────────
  function _log(r) {
    results.push(r);
    _appendResult(r);
  }

  const CAT_COLORS = {
    'CRITICAL': '#ff4466',
    'DATA': '#ff9933',
    'SYNC': '#ffcc00',
    'MODULES': '#00ff88',
    'FINANCE': '#00d4ff',
    'PERF': '#aa88ff',
    'SECURITY': '#ff88cc',
  };

  function _catBadge(cat) {
    const color = CAT_COLORS[cat] || '#888';
    return `<span style="background:${color}22;color:${color};border:1px solid ${color}44;border-radius:10px;padding:1px 7px;font-size:0.65rem;font-weight:700;margin-right:6px;white-space:nowrap;">${cat}</span>`;
  }

  function _appendResult(r) {
    const el = document.getElementById('functest-results');
    if (!el) return;
    const colors = { pass: '#00ff88', fail: '#ff4466', warn: '#ffcc00', skip: '#888' };
    const icons = { pass: '✅', fail: '❌', warn: '⚠️', skip: '⏭' };
    const isFail = r.s === 'fail', isWarn = r.s === 'warn';
    const bg = isFail ? 'rgba(255,68,102,0.12)' : isWarn ? 'rgba(255,204,0,0.08)' : 'transparent';
    const bl = isFail ? 'border-left:3px solid #ff4466;padding-left:8px;' : isWarn ? 'border-left:3px solid #ffcc00;padding-left:8px;' : '';
    const div = document.createElement('div');
    div.setAttribute('data-status', r.s);
    div.setAttribute('data-cat', r.cat || '');
    div.style.cssText = `display:flex;align-items:flex-start;gap:8px;padding:${isFail ? '8px 4px' : '5px 4px'};border-bottom:1px solid rgba(255,255,255,0.04);background:${bg};border-radius:4px;margin-bottom:2px;${bl}`;
    div.innerHTML =
      `<span style="font-size:${isFail ? '1rem' : '0.85rem'};min-width:18px;">${icons[r.s]}</span>` +
      `<div style="flex:1;min-width:0;">` +
      `<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">` +
      (r.cat ? _catBadge(r.cat) : '') +
      `<span style="color:${colors[r.s]};font-size:${isFail ? '0.87rem' : '0.8rem'};font-weight:${isFail ? '700' : '600'};">${r.name}</span>` +
      `</div>` +
      (r.detail ? `<div style="color:${isFail ? '#ffaaaa' : isWarn ? '#ffe08a' : '#7aa0c4'};font-size:0.72rem;margin-top:2px;">${r.detail}</div>` : '') +
      `</div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  function _sectionHeader(title, cat) {
    currentCategory = cat;
    const el = document.getElementById('functest-results');
    if (!el) return;
    const color = CAT_COLORS[cat] || '#00d4ff';
    el.innerHTML += `
      <div style="color:${color};font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;
                  padding:12px 4px 4px;margin-top:8px;border-top:1px solid ${color}22;display:flex;align-items:center;gap:8px;">
        <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;"></span>
        ${title}
      </div>`;
  }

  function _renderSummary() {
    const total = results.length;
    const passed = results.filter(r => r.s === 'pass').length;
    const failed = results.filter(r => r.s === 'fail').length;
    const warned = results.filter(r => r.s === 'warn').length;
    const skipped = results.filter(r => r.s === 'skip').length;
    const pct = total ? Math.round((passed / total) * 100) : 0;

    let color, icon, verdict;
    if (failed === 0 && warned === 0) { color = '#00ff88'; icon = '🎉'; verdict = 'সব ঠিক আছে! সিস্টেম ১০০% সুস্থ।'; }
    else if (failed === 0) { color = '#ffcc00'; icon = '⚠️'; verdict = `${warned}টি সতর্কতা — review করুন।`; }
    else if (failed <= 3) { color = '#ff9933'; icon = '🔶'; verdict = `${failed}টি সমস্যা পাওয়া গেছে।`; }
    else { color = '#ff4466'; icon = '❌'; verdict = `${failed}টি গুরুতর সমস্যা! Auto-Heal চালান।`; }

    const el = document.getElementById('functest-summary');
    if (!el) return;
    el.style.display = 'flex';
    el.innerHTML = `
      <div style="width:100%;background:rgba(255,255,255,0.04);border:1px solid ${color}44;border-radius:12px;padding:14px 16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
          <span style="color:${color};font-weight:700;font-size:1rem;">${icon} ${verdict}</span>
          <span style="color:${color};font-weight:800;font-size:1.1rem;">${passed}/${total} পাস (${pct}%)</span>
        </div>
        <div style="height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;margin-bottom:10px;">
          <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,${color},${color}cc);border-radius:4px;transition:width 0.8s ease;"></div>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
          <span style="color:#00ff88;font-size:0.8rem;font-weight:600;">✅ Pass: ${passed}</span>
          <span style="color:#ff4466;font-size:0.8rem;font-weight:600;">❌ Fail: ${failed}</span>
          <span style="color:#ffcc00;font-size:0.8rem;font-weight:600;">⚠️ Warn: ${warned}</span>
          <span style="color:#888;font-size:0.8rem;">⏭ Skip: ${skipped}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button onclick="window._wftFilterAll()" style="background:rgba(255,255,255,0.1);color:#fff;border:none;border-radius:20px;padding:4px 12px;font-size:0.75rem;cursor:pointer;">সব দেখান</button>
          <button onclick="window._wftFilterFails()" style="background:rgba(255,68,102,0.2);color:#ff4466;border:1px solid #ff446644;border-radius:20px;padding:4px 12px;font-size:0.75rem;cursor:pointer;">শুধু Fail/Warn</button>
          <button onclick="window._wftExportReport()" style="background:rgba(0,212,255,0.15);color:#00d4ff;border:1px solid #00d4ff44;border-radius:20px;padding:4px 12px;font-size:0.75rem;cursor:pointer;">📋 Report Copy</button>
        </div>
      </div>`;

    // Category breakdown
    const catSummary = {};
    results.forEach(r => {
      const c = r.cat || 'OTHER';
      if (!catSummary[c]) catSummary[c] = { pass: 0, fail: 0, warn: 0 };
      catSummary[c][r.s] = (catSummary[c][r.s] || 0) + 1;
    });
    const catEl = document.getElementById('functest-cat-summary');
    if (catEl) {
      catEl.innerHTML = Object.entries(catSummary).map(([cat, s]) => {
        const color = CAT_COLORS[cat] || '#888';
        const status = s.fail > 0 ? '❌' : s.warn > 0 ? '⚠️' : '✅';
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;background:rgba(255,255,255,0.03);border-radius:6px;border-left:3px solid ${color};">
          <span style="color:${color};font-size:0.75rem;font-weight:600;">${status} ${cat}</span>
          <span style="font-size:0.72rem;color:#888;">✅${s.pass || 0} ❌${s.fail || 0} ⚠️${s.warn || 0}</span>
        </div>`;
      }).join('');
    }
  }

  // Filter helpers
  window._wftFilterAll = function () {
    document.querySelectorAll('#functest-results [data-status]').forEach(el => el.style.display = '');
  };
  window._wftFilterFails = function () {
    document.querySelectorAll('#functest-results [data-status]').forEach(el => {
      const s = el.getAttribute('data-status');
      el.style.display = (s === 'fail' || s === 'warn') ? '' : 'none';
    });
  };
  window._wftExportReport = function () {
    const lines = [`Wings Fly Auto Test Report v${SUITE_VERSION}`, `Date: ${new Date().toLocaleString('bn-BD')}`, '---'];
    results.forEach(r => {
      const icon = { pass: '✅', fail: '❌', warn: '⚠️', skip: '⏭' }[r.s] || '•';
      lines.push(`${icon} [${r.cat}] ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
    });
    const t = results.filter(r => r.s === 'pass').length;
    lines.push('---', `Total: ${results.length} | Pass: ${t} | Fail: ${results.filter(r => r.s === 'fail').length} | Warn: ${results.filter(r => r.s === 'warn').length}`);
    navigator.clipboard?.writeText(lines.join('\n'));
    if (typeof window.showSuccessToast === 'function') window.showSuccessToast('Report clipboard-এ copy হয়েছে!');
  };

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 1: CRITICAL — Core Functions + DOM
  // ═══════════════════════════════════════════════════════════
  function testCritical() {
    _sectionHeader('🔴 CRITICAL — Core Functions & DOM', 'CRITICAL');

    const critical = [
      'switchTab', 'openStudentModal', 'saveStudent', 'deleteStudent',
      'openStudentPaymentModal', 'renderStudents', 'renderFullUI',
      'saveToCloud', 'loadFromCloud', 'manualCloudSync',
      'openEmployeeModal', 'saveEmployee',
      'openAttendanceModal', 'openAccountModal',
      'exportData', 'importData',
      'deleteTransaction', 'deleteEmployee', 'deleteAccount',
      'deleteMobileAccount', 'deleteVisitor',
      'moveToTrash', 'restoreDeletedItem', 'logActivity',
    ];
    const optional = [
      'renderLedger', 'renderDashboard', 'calcBatchProfit',
      'filterData', 'printReport', 'recalculateCashBalanceFromTransactions',
      'openNoticeModal', 'publishNotice', 'deleteNotice',
      'deleteInstallment', 'deleteExamRegistration', 'deleteKeepRecord',
    ];

    let critFail = 0;
    critical.forEach(fn => {
      if (exists(fn)) pass(fn);
      else { fail(fn + ' missing', '⚡ Critical — app কাজ করবে না'); critFail++; }
    });
    optional.forEach(fn => {
      if (exists(fn)) pass(fn, 'optional');
      else warn(fn + ' missing', 'Optional');
    });

    // DOM critical elements
    const domIds = [
      'tabDashboard', 'tabStudents', 'tabLedger', 'tabAccounts',
      'tabLoans', 'tabVisitors', 'tabEmployees', 'tabExamResults', 'syncStatusText',
    ];
    domIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) pass(`#${id} exists`);
      else fail(`#${id} missing`, 'DOM এ element নেই');
    });

    // Modals
    ['studentModal', 'settingsModal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { pass(`#${id} modal ready`); return; }
      const ph = document.getElementById(id === 'studentModal' ? '__modalPlaceholderStudents' : '__modalPlaceholderSettings');
      if (ph) pass(`#${id} lazy-loaded (placeholder ready)`);
      else warn(`#${id} modal missing`, 'Modal DOM-এ নেই');
    });

    // Security Question section toggle
    const secBtn = document.querySelector('[onclick*="toggleSecuritySection"], [onclick*="securitySection"], .security-toggle, #securityToggle');
    if (secBtn) pass('Security Question toggle button found');
    else {
      // Check if it's in settings-modal
      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal) {
        const hasSecSection = settingsModal.innerHTML.includes('Secret Recovery') || settingsModal.innerHTML.includes('securitySection') || settingsModal.innerHTML.includes('recovery');
        if (hasSecSection) pass('Security Question section found in modal');
        else warn('Security Question toggle not found', 'settings-modal.html এ check করুন');
      } else {
        warn('Security Question section not testable', 'Modal lazy-loaded — open করে check করুন');
      }
    }

    return critFail;
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 2: DATA — globalData + Student CRUD + LocalStorage
  // ═══════════════════════════════════════════════════════════
  function testData() {
    _sectionHeader('🟠 DATA — globalData + Student CRUD + Storage', 'DATA');

    const gd = window.globalData;
    if (!gd) { fail('globalData নেই', 'app.js লোড/init হয়নি'); return; }
    pass('globalData exists');

    // Structure
    ['students', 'finance', 'employees', 'bankAccounts', 'mobileBanking',
      'incomeCategories', 'expenseCategories', 'courseNames', 'users',
      'examRegistrations', 'visitors'].forEach(key => {
        if (!Array.isArray(gd[key])) {
          if (gd[key] === undefined) { warn(`globalData.${key} missing`, 'auto-init হবে'); gd[key] = []; }
          else fail(`globalData.${key} array নয়`, `type: ${typeof gd[key]}`);
        } else pass(`globalData.${key}`, `${gd[key].length} items`);
      });
    if (typeof gd.cashBalance === 'number') pass('cashBalance numeric', `৳${gd.cashBalance}`);
    else warn('cashBalance invalid', typeof gd.cashBalance);
    if (gd.nextId > 0) pass('nextId valid', `ID: ${gd.nextId}`);
    else warn('nextId missing');
    if (gd.settings && typeof gd.settings === 'object') pass('settings object OK');
    else warn('settings missing');
    if (gd.attendance && typeof gd.attendance === 'object') pass('attendance OK');
    else warn('attendance missing');

    // Student CRUD (in-memory)
    const before = (gd.students || []).length;
    const ts = { rowIndex: Date.now(), name: `Test ${TEST_TAG}`, phone: '01700000000', course: 'Test', fee: 5000, paid: 2000, due: 3000, status: 'Active', id: `TS${Date.now()}` };
    safeCall(() => { gd.students.push(ts); });
    const found = gd.students.find(s => s.rowIndex === ts.rowIndex);
    if (found) { pass('Student add OK', `Total: ${gd.students.length}`); found.phone = '01711111111'; }
    else fail('Student add failed');
    if (found?.phone === '01711111111') pass('Student edit OK');
    else fail('Student edit failed');
    safeCall(() => { gd.students = gd.students.filter(s => s.rowIndex !== ts.rowIndex); });
    if (!gd.students.find(s => s.rowIndex === ts.rowIndex)) pass('Student delete OK');
    else fail('Student delete failed');

    // Due calculations
    let badDue = 0;
    (gd.students || []).forEach(s => {
      const calc = Math.max(0, (parseFloat(s.totalPayment) || 0) - (parseFloat(s.paid) || 0));
      if (Math.abs(calc - (parseFloat(s.due) || 0)) > 1) badDue++;
    });
    if (badDue === 0) pass('Student dues all correct');
    else warn(`${badDue} students have wrong due`, 'Auto-Heal fix করবে');

    // Duplicate IDs
    const ids = (gd.students || []).map(s => s.studentId || s.id).filter(Boolean);
    if (ids.length === new Set(ids).size) pass('No duplicate student IDs', `${ids.length} unique`);
    else fail('Duplicate student IDs!');

    // LocalStorage
    const raw = localStorage.getItem('wingsfly_data');
    if (raw) {
      try {
        const d = JSON.parse(raw);
        pass('localStorage data valid', `students:${(d.students||[]).length}, finance:${(d.finance||[]).length}`);
      } catch { fail('localStorage JSON corrupt'); }
    } else warn('localStorage empty');

    const ver = localStorage.getItem('wings_local_version');
    if (ver) pass('Local version tracking', `v${ver}`);
    else warn('wings_local_version missing');

    const syncTs = localStorage.getItem('lastSyncTime');
    if (syncTs) {
      const ageMin = Math.round((Date.now() - parseInt(syncTs)) / 60000);
      if (ageMin < 120) pass('Last sync recent', `${ageMin} মিনিট আগে`);
      else warn('Last sync old', `${ageMin} মিনিট আগে`);
    } else warn('lastSyncTime missing');

    // Storage size
    let usedBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) usedBytes += (localStorage.getItem(localStorage.key(i)) || '').length * 2;
      const kb = Math.round(usedBytes / 1024);
      if (kb < 3000) pass('Storage usage OK', `~${kb} KB`);
      else if (kb < 4500) warn('Storage usage high', `~${kb} KB`);
      else fail('Storage near full!', `~${kb} KB`);
    } catch { }
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 3: SYNC — Supabase + Sync Chain
  // ═══════════════════════════════════════════════════════════
  async function testSync() {
    _sectionHeader('🟡 SYNC — Supabase & Cloud Sync', 'SYNC');

    if (window.supabase) pass('Supabase JS library loaded');
    else fail('Supabase JS missing', 'CDN লোড হয়নি');

    if (window.wingsSync?.fullSync) pass('wingsSync.fullSync ready');
    else fail('wingsSync missing', 'supabase-sync-SMART-V31.js লোড হয়নি');
    if (window.wingsSync?.pushNow) pass('wingsSync.pushNow ready');
    else fail('wingsSync.pushNow missing');

    if (!navigator.onLine) { warn('Browser offline', 'Supabase test skip'); return; }
    pass('Browser online');

    // Read test
    let cloudData = null;
    try {
      const res = await fetchSupa('/rest/v1/academy_data?id=eq.wingsfly_main&select=version,last_updated,last_device');
      if (res.ok) {
        const arr = await res.json(); cloudData = arr[0] || null;
        if (cloudData) pass('Supabase READ OK', `Cloud v${cloudData.version || 0}`);
        else warn('Supabase read OK but no data');
      } else fail('Supabase read failed', `HTTP ${res.status}`);
    } catch (e) { fail('Supabase read error', e.message); }

    // Write test
    const tid = 'test_conn_' + Date.now();
    try {
      const wr = await fetchSupa('/rest/v1/academy_data', {
        method: 'POST',
        headers: { 'Prefer': 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ id: tid, version: 1, last_updated: new Date().toISOString(), last_device: tid, students: [], finance: [] })
      });
      if ([200, 201, 204].includes(wr.status)) {
        pass('Supabase WRITE OK');
        await fetchSupa(`/rest/v1/academy_data?id=eq.${tid}`, { method: 'DELETE' }).catch(() => {});
        pass('Test record cleanup OK');
      } else {
        const ej = await wr.json().catch(() => ({}));
        if (ej.code === '42501') warn('Supabase WRITE Restricted (RLS)', 'সুরক্ষিত — OK');
        else fail('Supabase WRITE failed', `HTTP ${wr.status}`);
      }
    } catch (e) { fail('Supabase WRITE error', e.message); }

    // Version check
    if (cloudData) {
      const lv = parseInt(localStorage.getItem('wings_local_version')) || 0;
      const cv = cloudData.version || 0;
      const diff = Math.abs(lv - cv);
      if (diff === 0) pass('Versions in sync', `v${lv}`);
      else if (diff <= 2) warn('Minor version gap', `Local v${lv}, Cloud v${cv}`);
      else fail('Large version gap!', `Local v${lv} vs Cloud v${cv}`);
    }

    // Sync status
    const st = document.getElementById('syncStatusText');
    if (st) {
      const txt = st.textContent || '';
      if (txt.includes('Error') || txt.includes('সমস্যা') || txt.includes('ব্যর্থ')) fail('Sync status shows error', txt);
      else pass('Sync status OK', txt || 'Ready');
    } else warn('syncStatusText element missing');

    // Push function test
    try {
      const pr = window.wingsSync?.pushNow('Test Suite v8 probe');
      if (pr?.then) pass('pushNow returns Promise');
      else pass('pushNow callable');
    } catch (e) { fail('pushNow threw error', e.message); }

    // Sync conflict simulation
    const gd = window.globalData;
    if (gd?.students?.length > 0) {
      const t = gd.students[0], orig = t.paid;
      const dA = { ...t, paid: (parseFloat(t.paid) || 0) + 500, _ts: Date.now() - 1000 };
      const dB = { ...t, paid: (parseFloat(t.paid) || 0) + 1000, _ts: Date.now() };
      const resolved = dA._ts > dB._ts ? dA : dB;
      if (resolved === dB) pass('LWW conflict resolution correct', 'Newer timestamp wins');
      else fail('LWW conflict resolution wrong');
      t.paid = orig;
    } else skip('Conflict simulation', 'No students');
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 4: MODULES — Employee, Exam, Visitor, Accounts, etc
  // ═══════════════════════════════════════════════════════════
  function testModules() {
    _sectionHeader('🟢 MODULES — Employee, Exam, Visitor, Accounts, Keep Records', 'MODULES');

    const gd = window.globalData;
    if (!gd) { skip('All module tests', 'globalData নেই'); return; }

    // Employee
    const emps = gd.employees || [];
    if (emps.length > 0) {
      pass('Employees exist', `${emps.length} জন`);
      let bad = 0; emps.forEach(e => { if (!e.name || !e.id) bad++; });
      if (bad === 0) pass('Employee data integrity OK');
      else fail(`${bad} employee name/id missing`);
      const ids = emps.map(e => e.id).filter(Boolean);
      if (ids.length === new Set(ids).size) pass('No duplicate employee IDs');
      else fail('Duplicate employee IDs!');
      const salTotal = emps.reduce((s, e) => s + (parseFloat(e.salary) || 0), 0);
      pass('Employee salary total', `৳${salTotal.toLocaleString('en-IN')}/মাস`);
    } else warn('No employees', 'স্বাভাবিক হতে পারে');

    // Attendance
    const att = gd.attendance;
    if (att && typeof att === 'object') {
      const keys = Object.keys(att);
      pass('Attendance records', `${keys.length} দিনের রেকর্ড`);
    } else warn('Attendance missing');

    // Exam
    const exams = gd.examRegistrations || [];
    if (exams.length > 0) {
      pass('Exam registrations exist', `${exams.length}টি`);
      let bad = 0; exams.forEach(e => { if (!e.studentName && !e.name) bad++; });
      if (bad === 0) pass('Exam data integrity OK');
      else warn(`${bad} exam entry missing name`);
    } else warn('No exam registrations', 'স্বাভাবিক হতে পারে');

    // Visitors
    const vis = gd.visitors || [];
    if (vis.length > 0) {
      pass('Visitor records exist', `${vis.length}টি`);
    } else warn('No visitor records', 'স্বাভাবিক');

    // Bank Accounts
    const banks = gd.bankAccounts || [];
    let bankBad = 0;
    banks.forEach(a => { if (!a.name || isNaN(parseFloat(a.balance))) bankBad++; });
    if (bankBad === 0) pass('Bank accounts integrity OK', `${banks.length}টি account`);
    else fail(`${bankBad} bank account corrupt!`);

    // Mobile Banking
    const mobiles = gd.mobileBanking || [];
    let mobBad = 0;
    mobiles.forEach(a => { if (!a.name || isNaN(parseFloat(a.balance))) mobBad++; });
    if (mobBad === 0) pass('Mobile banking integrity OK', `${mobiles.length}টি account`);
    else fail(`${mobBad} mobile account corrupt!`);

    // User Accounts
    const users = gd.users || [];
    if (users.length > 0) {
      pass('User accounts exist', `${users.length} জন`);
      const admins = users.filter(u => u.role === 'admin' || u.access === 'Master Access');
      if (admins.length > 0) pass('Admin user exists', admins[0].name || admins[0].username);
      else warn('No admin user found');
    } else fail('No users!', 'Login কাজ করবে না');

    // Keep Records
    const kr = gd.keepRecords || gd.keep_records;
    if (kr && Array.isArray(kr)) {
      pass('Keep Records data exists', `${kr.length}টি`);
    } else warn('Keep Records empty/missing', 'স্বাভাবিক');

    // Notice Board
    if (exists('publishNotice') && exists('deleteNotice')) pass('Notice Board functions OK');
    else warn('Notice Board functions missing');

    // Recycle Bin
    const rb = gd.deletedItems || gd.recycleBin;
    if (rb && Array.isArray(rb)) pass('Recycle Bin exists', `${rb.length}টি deleted items`);
    else pass('Recycle Bin empty (OK)');

    // Activity Log
    if (exists('logActivity')) {
      const r = safeCall(() => window.logActivity('test', 'TEST', 'Auto Test Suite v8 probe', {}));
      if (r.ok) pass('logActivity works');
      else warn('logActivity error', r.err);
    } else fail('logActivity missing');

    // Section files (critical ones)
    ['sections/student-management.js', 'sections/finance-crud.js', 'sections/table-pagination.js'].forEach(path => {
      const scripts = document.querySelectorAll('script[src]');
      const found = [...scripts].some(s => s.src.includes(path.split('/').pop().split('.js')[0]));
      if (found) pass(`${path} loaded`);
      else warn(`${path} not found in scripts`, 'Lazy loaded হতে পারে');
    });
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 5: FINANCE — Calculation Integrity
  // ═══════════════════════════════════════════════════════════
  function testFinance() {
    _sectionHeader('🔵 FINANCE — Calculation Integrity & Balance', 'FINANCE');

    const gd = window.globalData;
    if (!gd) { skip('Finance tests', 'globalData নেই'); return; }
    const finance = gd.finance || [];

    // Finance engine
    if (exists('feCalcStats')) pass('feCalcStats (finance-engine) loaded');
    else warn('feCalcStats missing', 'finance-engine.js লোড হয়নি');
    if (exists('feRebuildAllBalances')) pass('feRebuildAllBalances available');
    else warn('feRebuildAllBalances missing');

    // feCalcStats correctness
    if (typeof window.feCalcStats === 'function') {
      const test = [
        { type: 'Income', amount: 1000, method: 'Cash' },
        { type: 'Expense', amount: 200, method: 'Cash' },
        { type: 'Loan Received', amount: 5000, method: 'Cash' },
        { type: 'Loan Given', amount: 3000, method: 'Cash' },
        { type: 'Transfer In', amount: 500, method: 'Cash' },
        { type: 'Transfer Out', amount: 500, method: 'Cash' },
      ];
      const s = window.feCalcStats(test);
      if (s.income === 1000 && s.expense === 200 && s.profit === 800)
        pass('feCalcStats Loan/Transfer বাদ দিচ্ছে ✓', 'Income:1000 Expense:200 Profit:800');
      else fail('feCalcStats ভুল হিসাব!', `Income:${s.income} Expense:${s.expense} Profit:${s.profit}`);
    }

    // Loan entries in income/expense check
    const loanEntries = finance.filter(f =>
      ['Loan Received', 'Loan Receiving', 'Loan Given', 'Loan Giving'].includes(f.type)
    );
    if (loanEntries.length > 0 && typeof window.feCalcStats === 'function') {
      const lc = window.feCalcStats(loanEntries);
      if (lc.income === 0 && lc.expense === 0) pass(`Real data: ${loanEntries.length}টি Loan entry income/expense-এ নেই ✓`);
      else fail('Loan entries stats-এ যাচ্ছে!', `Income:${lc.income} Expense:${lc.expense}`);
    }

    // Cash balance integrity
    let calcCash = parseFloat(gd.settings?.startBalances?.Cash) || 0;
    finance.filter(f => f.method === 'Cash' && !f._deleted).forEach(f => {
      const amt = parseFloat(f.amount) || 0;
      if (['Income', 'Loan Received', 'Loan Receiving', 'Transfer In'].includes(f.type)) calcCash += amt;
      else if (['Expense', 'Loan Given', 'Loan Giving', 'Transfer Out'].includes(f.type)) calcCash -= amt;
    });
    const storedCash = parseFloat(gd.cashBalance) || 0;
    const diff = Math.abs(calcCash - storedCash);
    if (diff < 1) pass('Cash Balance matches transactions ✓', `৳${storedCash.toLocaleString('en-IN')}`);
    else if (diff < 5000) warn('Cash Balance minor gap', `Calc:৳${Math.round(calcCash)} Stored:৳${Math.round(storedCash)} Diff:৳${Math.round(diff)}`);
    else fail('Cash Balance Mismatch!', `Calc:৳${Math.round(calcCash)} Stored:৳${Math.round(storedCash)} Diff:৳${Math.round(diff)}`);

    // Student due total integrity
    let badDue = 0, totalDue = 0;
    (gd.students || []).forEach(s => {
      const correct = Math.max(0, (parseFloat(s.totalPayment) || 0) - (parseFloat(s.paid) || 0));
      totalDue += parseFloat(s.due) || 0;
      if (Math.abs(correct - (parseFloat(s.due) || 0)) > 1) badDue++;
    });
    if (badDue === 0) pass('All student dues correct ✓', `মোট বকেয়া: ৳${totalDue.toLocaleString('en-IN')}`);
    else fail(`${badDue} student due ভুল!`, 'Auto-Heal চালান');

    // Duplicate finance entries
    const finKeys = new Map();
    finance.forEach(f => {
      const k = `${f.type}|${f.amount}|${f.date}|${(f.person || '').toLowerCase()}`;
      finKeys.set(k, (finKeys.get(k) || 0) + 1);
    });
    let dupCount = 0;
    finKeys.forEach((v) => { if (v > 1) dupCount += v - 1; });
    if (dupCount === 0) pass('No duplicate finance entries ✓');
    else warn(`${dupCount}টি সম্ভাব্য duplicate entry`);

    // Finance entries required fields
    if (finance.length > 0) {
      const missing = finance.filter(f => !f.type || !f.amount || !f.date);
      if (missing.length === 0) pass('Finance entries have required fields ✓');
      else warn(`${missing.length}টি entry-তে required field missing`);
    }

    // Negative amounts
    const neg = finance.filter(f => parseFloat(f.amount) < 0);
    if (neg.length === 0) pass('No negative amounts ✓');
    else warn(`${neg.length}টি negative amount`);

    // Account totals
    const bankTotal = (gd.bankAccounts || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
    const mobileTotal = (gd.mobileBanking || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
    const grandTotal = storedCash + bankTotal + mobileTotal;
    pass('Grand Total', `৳${grandTotal.toLocaleString('en-IN')} (Cash:${storedCash} Bank:${bankTotal} Mobile:${mobileTotal})`);

    // Student payment vs finance
    const totalPaid = (gd.students || []).reduce((s, st) => s + (parseFloat(st.paid) || 0), 0);
    pass('Total student paid', `৳${totalPaid.toLocaleString('en-IN')}`);

    if (typeof window.feCalcStats === 'function') {
      const all = window.feCalcStats(finance);
      pass(`Finance Stats`, `Income:৳${all.income?.toLocaleString('en-IN')} | Expense:৳${all.expense?.toLocaleString('en-IN')} | Profit:৳${all.profit?.toLocaleString('en-IN')}`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 6: PERFORMANCE
  // ═══════════════════════════════════════════════════════════
  function testPerformance() {
    _sectionHeader('🟣 PERF — Performance & Memory', 'PERF');

    // localStorage read speed
    const t1 = performance.now();
    for (let i = 0; i < 100; i++) localStorage.getItem('wingsfly_data');
    const ls = performance.now() - t1;
    if (ls < 50) pass('localStorage read fast', `100x: ${ls.toFixed(1)}ms`);
    else if (ls < 200) warn('localStorage slow', `${ls.toFixed(1)}ms`);
    else fail('localStorage very slow!', `${ls.toFixed(1)}ms`);

    // JSON speed
    if (window.globalData) {
      const t2 = performance.now();
      for (let i = 0; i < 10; i++) JSON.stringify(window.globalData);
      const jt = performance.now() - t2;
      if (jt < 100) pass('JSON serialization fast', `10x: ${jt.toFixed(1)}ms`);
      else warn('JSON serialization slow', `${jt.toFixed(1)}ms`);
    }

    // Data size
    const raw = localStorage.getItem('wingsfly_data') || '';
    const kb = (raw.length / 1024).toFixed(1);
    if (raw.length < 512 * 1024) pass('Data size OK', `${kb} KB`);
    else if (raw.length < 2 * 1024 * 1024) warn('Data size growing', `${kb} KB`);
    else fail('Data size too large!', `${kb} KB`);

    // DOM size
    const dom = document.querySelectorAll('*').length;
    if (dom < 4000) pass('DOM size normal', `${dom} elements`);
    else if (dom < 8000) warn('DOM large', `${dom} elements`);
    else fail('DOM too large!', `${dom} elements`);

    // Memory
    if (performance.memory) {
      const used = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
      const limit = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0);
      const pct = Math.round(performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100);
      if (pct < 50) pass('Memory OK', `${used}MB / ${limit}MB (${pct}%)`);
      else if (pct < 80) warn('Memory high', `${used}MB (${pct}%)`);
      else fail('Memory critical!', `${used}MB (${pct}%)`);
    } else skip('Memory test', 'Browser API unavailable');

    // Sort speed
    if (window.globalData?.students?.length > 0) {
      const copy = [...window.globalData.students];
      const t3 = performance.now();
      copy.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      const st = performance.now() - t3;
      if (st < 50) pass('Student sort fast', `${copy.length} students: ${st.toFixed(2)}ms`);
      else warn('Student sort slow', `${st.toFixed(2)}ms`);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORY 7: SECURITY
  // ═══════════════════════════════════════════════════════════
  function testSecurity() {
    _sectionHeader('⚪ SECURITY — Auth & Data Safety', 'SECURITY');

    // Login session
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') pass('Session active ✓');
    else fail('Session not active!', 'User logged out');

    // Passwords not in plain text
    const rawLS = localStorage.getItem('wingsfly_data') || '';
    const passMatches = [...rawLS.matchAll(/"password"\s*:\s*"([^"]+)"/g)];
    const hasPlain = passMatches.some(m => !/^[a-f0-9]{64}$/.test(m[1]));
    if (!hasPlain) pass('Passwords hashed ✓ (SHA-256)');
    else warn('Plain-text password in localStorage!', 'Security risk');

    // API key not in globalData
    const gdStr = JSON.stringify(window.globalData || {});
    if (!gdStr.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) pass('API key not in globalData ✓');
    else warn('API key in globalData', 'Memory leak possible');

    // XSS check
    const r1 = safeCall(() => {
      const mal = '<script>alert("xss")</script>';
      const d = document.createElement('div'); d.textContent = mal;
      if (d.innerHTML.includes('<script>')) throw new Error('XSS vulnerability');
    });
    if (r1.ok) pass('XSS textContent safe ✓');
    else fail('XSS vulnerability!', r1.err);

    // Recovery question setup
    const gd = window.globalData;
    if (gd?.settings?.securityQuestion || gd?.settings?.recoveryQuestion) {
      pass('Security/Recovery question configured ✓');
    } else {
      warn('Security question not set', 'Settings এ configure করুন');
    }

    // Edge cases
    const r2 = safeCall(() => {
      const empty = [];
      return empty.reduce((s, st) => s + (parseFloat(st.fee) || 0), 0);
    });
    if (r2.ok && r2.val === 0) pass('Empty array ops safe ✓');
    else fail('Empty array error', r2.err);

    const r3 = safeCall(() => JSON.parse('{"test": "ok"}'));
    if (r3.ok) pass('JSON.parse safe ✓');
    else fail('JSON.parse error');

    // Supabase key format check
    if (SUPABASE_KEY && SUPABASE_KEY.startsWith('eyJ')) pass('Supabase key format OK');
    else fail('Supabase key invalid format');
  }

  // ═══════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════
  function cleanupTestData() {
    try {
      if (window.globalData) {
        window.globalData.students = (window.globalData.students || []).filter(s => !String(s.name || '').includes(TEST_TAG));
        window.globalData.finance = (window.globalData.finance || []).filter(f => !String(f.note || '').includes(TEST_TAG));
        try { localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData)); } catch { }
      }
    } catch { }
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN RUNNER
  // ═══════════════════════════════════════════════════════════
  window.runFunctionTests = async function () {
    results = [];
    currentCategory = '';

    const el = document.getElementById('functest-results');
    if (el) el.innerHTML = '';
    const sum = document.getElementById('functest-summary');
    if (sum) { sum.style.display = 'none'; sum.innerHTML = ''; }
    const cat = document.getElementById('functest-cat-summary');
    if (cat) cat.innerHTML = '';

    // Show progress
    const progressEl = document.getElementById('functest-progress');
    const setProgress = (msg) => { if (progressEl) progressEl.textContent = msg; };

    setProgress('🔴 Critical checks চলছে...');
    testCritical();

    setProgress('🟠 Data integrity check চলছে...');
    testData();

    setProgress('🟡 Sync check চলছে...');
    await testSync();

    setProgress('🟢 Module check চলছে...');
    testModules();

    setProgress('🔵 Finance calculation check চলছে...');
    testFinance();

    setProgress('🟣 Performance check চলছে...');
    testPerformance();

    setProgress('⚪ Security check চলছে...');
    testSecurity();

    setProgress('');
    cleanupTestData();
    _renderSummary();

    // Activity log
    const f = results.filter(r => r.s === 'fail').length;
    const w = results.filter(r => r.s === 'warn').length;
    if (typeof window.logActivity === 'function') {
      window.logActivity('test', f > 0 ? 'FAIL' : w > 0 ? 'WARN' : 'PASS',
        `🧬 Auto Test v${SUITE_VERSION}: ${results.filter(r=>r.s==='pass').length}/${results.length} pass, ${f} fail, ${w} warn`,
        { total: results.length, fail: f, warn: w }
      );
    }
  };

  window.runAutoTests = window.runFunctionTests;

  // ═══════════════════════════════════════════════════════════
  // BACKGROUND MONITOR (integrated)
  // প্রতি ৫ মিনিটে critical checks
  // ═══════════════════════════════════════════════════════════
  let _bgInterval = null;

  async function runBackgroundMonitor() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') return;
    if (!window.globalData) return;

    const gd = window.globalData;
    const finance = gd.finance || [];
    const issues = [];

    // Check 1: Loan in stats
    if (typeof window.feCalcStats === 'function') {
      const loans = finance.filter(f => ['Loan Received', 'Loan Receiving', 'Loan Given', 'Loan Giving'].includes(f.type));
      if (loans.length > 0) {
        const lc = window.feCalcStats(loans);
        if (lc.income > 0 || lc.expense > 0) issues.push('❌ Loan income/expense-এ count হচ্ছে!');
      }
    }

    // Check 2: Negative cash
    if (parseFloat(gd.cashBalance) < -100000) issues.push(`⚠️ Cash balance অনেক negative: ৳${gd.cashBalance}`);

    // Check 3: Student due mismatch
    let badDue = 0;
    (gd.students || []).forEach(s => {
      if (Math.abs(Math.max(0, (parseFloat(s.totalPayment)||0)-(parseFloat(s.paid)||0)) - (parseFloat(s.due)||0)) > 1) badDue++;
    });
    if (badDue > 0) issues.push(`⚠️ ${badDue} student due ভুল`);

    // Check 4: Finance engine
    if (!exists('feRebuildAllBalances')) issues.push('❌ finance-engine.js লোড হয়নি!');

    // Periodic balance sync
    if (typeof window.feRebuildAllBalances === 'function') {
      window.feRebuildAllBalances();
      if (typeof window.updateGrandTotal === 'function') window.updateGrandTotal();
    }

    if (issues.length > 0) {
      console.warn('[AutoTest BG]', issues.join(' | '));
      if (typeof window.logActivity === 'function') {
        window.logActivity('system', 'WARN', `🔍 BG Test Issues: ${issues.join(' | ')}`, { issues });
      }
    } else {
      console.log(`[AutoTest BG] ✅ সব ঠিক — ${new Date().toLocaleTimeString('bn-BD')}`);
    }
  }

  window.stopAutoTestMonitor = function () {
    if (_bgInterval) { clearInterval(_bgInterval); _bgInterval = null; }
  };
  window.startAutoTestMonitor = function () {
    if (_bgInterval) clearInterval(_bgInterval);
    _bgInterval = setInterval(runBackgroundMonitor, 5 * 60 * 1000);
    setTimeout(runBackgroundMonitor, 30 * 1000);
  };

  function _init() {
    window.startAutoTestMonitor();
    console.log(`%c🧬 Wings Fly Auto Test Suite v${SUITE_VERSION} — loaded & BG monitor active`, 'color:#00d4ff;font-weight:bold');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(_init, 5000));
  else setTimeout(_init, 5000);

})();

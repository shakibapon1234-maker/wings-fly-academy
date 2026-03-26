/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY — SALARY HUB v4.0
 * ============================================================
 * ✅ Card-based layout — প্রতিটি employee একটি card
 * ✅ Inline payment history — expandable, latest first
 * ✅ Edit & Delete on every salary record
 * ✅ Pay (Due / Advance / Bonus) — clean modal
 * ✅ Finance Guard compatible
 * ✅ Activity log on all operations
 * ============================================================
 */

(function () {

  // ─────────────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────────────
  function initSalaryHub() {
    const monthInput = document.getElementById('salaryMonthFilter');
    if (monthInput && !monthInput.value) {
      const now = new Date();
      monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
    renderSalaryCards();
  }

  // ─────────────────────────────────────────────────────────
  // MAIN RENDER — employee cards
  // ─────────────────────────────────────────────────────────
  function renderSalaryCards() {
    const gd     = window.globalData || {};
    const month  = document.getElementById('salaryMonthFilter')?.value || '';
    const search = (document.getElementById('salarySearch')?.value || '').toLowerCase();
    const wrap   = document.getElementById('salaryCardsWrap');
    if (!wrap) return;

    const employees = (gd.employees || [])
      .filter(e => !e.resigned && e.status !== 'Resigned')
      .filter(e => !search || (e.name || '').toLowerCase().includes(search));

    if (employees.length === 0) {
      wrap.innerHTML = `<div class="text-center py-5" style="color:#6e8caa;">
        <div style="font-size:3rem;">👤</div>
        <p class="mt-2">কোনো Active Staff নেই।</p>
      </div>`;
      _updateSummary(0, 0, 0);
      return;
    }

    // Finance records for this month
    const finMonth = (gd.finance || []).filter(f =>
      !f._deleted &&
      (f.date || '').startsWith(month) &&
      (f.type === 'Expense' || f.type === 'Advance' || f.type === 'Advance Return') &&
      (f.category === 'Salaries' || f.category === 'Advance' || f.category === 'Advance Return' || f.category === 'Bonus')
    );

    let totalBudget = 0, totalPaid = 0, totalDue = 0;
    let html = '';

    employees.forEach(emp => {
      const base   = parseFloat(emp.salary) || 0;
      const empRec = finMonth.filter(f => f.person === emp.name || f.employeeId === (emp.id || emp.empId));

      const salPaid  = empRec.filter(f => f.type === 'Expense' && f.category === 'Salaries')
                              .reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
      const bonusPaid = empRec.filter(f => (f.description || '').includes('[Bonus]'))
                              .reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
      const advPaid  = empRec.filter(f => f.type === 'Advance')
                              .reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
      const paid     = salPaid;
      const due      = Math.max(0, base - paid);

      totalBudget += base;
      totalPaid   += paid;
      totalDue    += due;

      // All-time history for this employee (sorted latest first)
      const allHist = (gd.finance || [])
        .filter(f => !f._deleted &&
          (f.person === emp.name || f.employeeId === (emp.id || emp.empId)) &&
          (f.type === 'Expense' || f.type === 'Advance' || f.type === 'Advance Return') &&
          (f.category === 'Salaries' || f.category === 'Advance' || f.category === 'Advance Return' || f.category === 'Bonus'))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      const statusBadge = due === 0 && paid > 0
        ? `<span style="background:rgba(0,200,100,0.15);color:#00e676;border:1px solid rgba(0,200,100,0.3);padding:3px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;">✅ Paid</span>`
        : paid > 0
          ? `<span style="background:rgba(0,200,255,0.15);color:#00d9ff;border:1px solid rgba(0,200,255,0.3);padding:3px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;">⚡ Partial</span>`
          : `<span style="background:rgba(255,170,0,0.15);color:#ffaa00;border:1px solid rgba(255,170,0,0.3);padding:3px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;">⏳ Pending</span>`;

      const pct = base > 0 ? Math.min(100, Math.round((paid / base) * 100)) : 0;
      const progressColor = pct === 100 ? '#00e676' : pct > 0 ? '#00d9ff' : '#333';

      const empKey = (emp.id || emp.name).replace(/\W/g, '_');

      // History rows
      const histRows = allHist.map(f => {
        const isAdv    = f.type === 'Advance';
        const isReturn = f.type === 'Advance Return';
        const isBonus  = (f.description || '').includes('[Bonus]');
        const label    = isAdv ? 'Advance' : isReturn ? 'Return' : isBonus ? 'Bonus' : 'Salary';
        const colors   = {
          Advance: 'background:rgba(0,150,255,0.15);color:#7ab8ff;border:1px solid rgba(0,150,255,0.35);',
          Return:  'background:rgba(0,230,118,0.12);color:#69f0ae;border:1px solid rgba(0,230,118,0.3);',
          Bonus:   'background:rgba(255,200,0,0.15);color:#ffd200;border:1px solid rgba(255,200,0,0.35);',
          Salary:  'background:rgba(0,200,100,0.12);color:#00e676;border:1px solid rgba(0,200,100,0.3);'
        };
        const dateStr = f.date
          ? new Date(f.date + 'T00:00:00').toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})
          : '—';

        return `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:8px 12px;font-size:0.82rem;color:#94a3c4;white-space:nowrap;">${dateStr}</td>
          <td style="padding:8px 12px;">
            <span style="padding:2px 10px;border-radius:12px;font-size:0.72rem;font-weight:700;${colors[label]}">${label}</span>
          </td>
          <td style="padding:8px 12px;font-weight:700;color:#e0f0ff;">৳${(parseFloat(f.amount)||0).toLocaleString()}</td>
          <td style="padding:8px 12px;font-size:0.82rem;color:#94a3c4;">${f.method || '—'}</td>
          <td style="padding:8px 12px;font-size:0.78rem;color:rgba(255,255,255,0.45);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
              title="${(f.description||'').replace(/"/g,'&quot;')}">${f.description || '—'}</td>
          <td style="padding:8px 12px;text-align:right;white-space:nowrap;">
            <button onclick="editSalaryRecord('${f.id}')"
              style="background:rgba(0,217,255,0.12);color:#00d9ff;border:1px solid rgba(0,217,255,0.3);padding:3px 10px;border-radius:8px;font-size:0.75rem;cursor:pointer;margin-right:4px;">
              ✏️ Edit
            </button>
            <button onclick="deleteSalaryRecord('${f.id}')"
              style="background:rgba(255,59,92,0.12);color:#ff3b5c;border:1px solid rgba(255,59,92,0.3);padding:3px 10px;border-radius:8px;font-size:0.75rem;cursor:pointer;">
              🗑️ Del
            </button>
          </td>
        </tr>`;
      }).join('');

      html += `
      <div class="salary-card" style="background:rgba(13,27,42,0.8);border:1px solid rgba(0,217,255,0.12);border-radius:16px;padding:20px;margin-bottom:16px;transition:border-color 0.2s;">

        <!-- Card Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#1a3a5c,#0d2035);display:flex;align-items:center;justify-content:center;font-size:1.3rem;border:2px solid rgba(0,217,255,0.2);">
              👤
            </div>
            <div>
              <div style="font-size:1rem;font-weight:700;color:#e0f0ff;">${emp.name}</div>
              <div style="font-size:0.78rem;color:#6e8caa;">${emp.role || emp.designation || 'Staff'}
                ${emp.phone ? `<span style="margin-left:8px;color:#4a6080;">📞 ${emp.phone}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            ${statusBadge}
            <button onclick="openSalaryModal('${emp.id || emp.name}')"
              style="background:linear-gradient(135deg,#0066cc,#0044aa);color:#fff;border:none;padding:7px 18px;border-radius:10px;font-size:0.85rem;font-weight:600;cursor:pointer;">
              💰 Pay
            </button>
          </div>
        </div>

        <!-- Salary Info Row -->
        <div style="display:flex;gap:16px;margin-top:16px;flex-wrap:wrap;">
          <div style="background:rgba(0,217,255,0.06);border:1px solid rgba(0,217,255,0.12);border-radius:10px;padding:10px 16px;text-align:center;min-width:100px;">
            <div style="font-size:0.68rem;color:#6e8caa;text-transform:uppercase;letter-spacing:0.5px;">Base Salary</div>
            <div style="font-size:1rem;font-weight:700;color:#e0f0ff;margin-top:2px;">৳${base.toLocaleString()}</div>
          </div>
          <div style="background:rgba(0,200,100,0.06);border:1px solid rgba(0,200,100,0.15);border-radius:10px;padding:10px 16px;text-align:center;min-width:100px;">
            <div style="font-size:0.68rem;color:#6e8caa;text-transform:uppercase;letter-spacing:0.5px;">Paid (${month || 'this month'})</div>
            <div style="font-size:1rem;font-weight:700;color:#00e676;margin-top:2px;">৳${paid.toLocaleString()}</div>
          </div>
          <div style="background:rgba(255,170,0,0.06);border:1px solid rgba(255,170,0,0.15);border-radius:10px;padding:10px 16px;text-align:center;min-width:100px;">
            <div style="font-size:0.68rem;color:#6e8caa;text-transform:uppercase;letter-spacing:0.5px;">Due</div>
            <div style="font-size:1rem;font-weight:700;color:${due>0?'#ffaa00':'#00e676'};margin-top:2px;">৳${due.toLocaleString()}</div>
          </div>
          ${bonusPaid > 0 ? `<div style="background:rgba(255,200,0,0.06);border:1px solid rgba(255,200,0,0.15);border-radius:10px;padding:10px 16px;text-align:center;min-width:100px;">
            <div style="font-size:0.68rem;color:#6e8caa;text-transform:uppercase;letter-spacing:0.5px;">Bonus</div>
            <div style="font-size:1rem;font-weight:700;color:#ffd200;margin-top:2px;">৳${bonusPaid.toLocaleString()}</div>
          </div>` : ''}
          ${advPaid > 0 ? `<div style="background:rgba(0,150,255,0.06);border:1px solid rgba(0,150,255,0.15);border-radius:10px;padding:10px 16px;text-align:center;min-width:100px;">
            <div style="font-size:0.68rem;color:#6e8caa;text-transform:uppercase;letter-spacing:0.5px;">Advance (this month)</div>
            <div style="font-size:1rem;font-weight:700;color:#7ab8ff;margin-top:2px;">৳${advPaid.toLocaleString()}</div>
          </div>` : ''}
        </div>

        <!-- Progress Bar -->
        <div style="margin-top:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-size:0.72rem;color:#6e8caa;">Payment Progress</span>
            <span style="font-size:0.72rem;color:${progressColor};font-weight:600;">${pct}%</span>
          </div>
          <div style="background:rgba(255,255,255,0.06);border-radius:6px;height:6px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${progressColor};border-radius:6px;transition:width 0.5s;"></div>
          </div>
        </div>

        <!-- History Toggle -->
        ${allHist.length > 0 ? `
        <div style="margin-top:14px;">
          <button onclick="_toggleSalHist('${empKey}')"
            style="background:transparent;border:1px solid rgba(0,217,255,0.2);color:#6e8caa;padding:5px 14px;border-radius:8px;font-size:0.78rem;cursor:pointer;width:100%;text-align:left;">
            📋 Payment History (${allHist.length} records) <span id="arrow_${empKey}" style="float:right;">▼</span>
          </button>
          <div id="hist_${empKey}" style="display:none;margin-top:8px;border-radius:10px;overflow:hidden;border:1px solid rgba(0,217,255,0.12);">
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                <thead>
                  <tr style="background:rgba(0,0,0,0.35);">
                    <th style="padding:8px 12px;color:#4a6080;font-size:0.7rem;text-transform:uppercase;font-weight:600;text-align:left;">Date</th>
                    <th style="padding:8px 12px;color:#4a6080;font-size:0.7rem;text-transform:uppercase;font-weight:600;text-align:left;">Type</th>
                    <th style="padding:8px 12px;color:#4a6080;font-size:0.7rem;text-transform:uppercase;font-weight:600;text-align:left;">Amount</th>
                    <th style="padding:8px 12px;color:#4a6080;font-size:0.7rem;text-transform:uppercase;font-weight:600;text-align:left;">Method</th>
                    <th style="padding:8px 12px;color:#4a6080;font-size:0.7rem;text-transform:uppercase;font-weight:600;text-align:left;">Note</th>
                    <th style="padding:8px 12px;text-align:right;"></th>
                  </tr>
                </thead>
                <tbody>${histRows}</tbody>
              </table>
            </div>
          </div>
        </div>` : `<div style="margin-top:12px;font-size:0.78rem;color:rgba(255,255,255,0.2);text-align:center;border-top:1px solid rgba(255,255,255,0.05);padding-top:10px;">কোনো payment history নেই</div>`}
      </div>`;
    });

    wrap.innerHTML = html;
    _updateSummary(totalBudget, totalPaid, totalDue);
  }

  // ─────────────────────────────────────────────────────────
  // SUMMARY ROW UPDATE
  // ─────────────────────────────────────────────────────────
  function _updateSummary(budget, paid, due) {
    const fmt = n => '৳' + (parseFloat(n)||0).toLocaleString();
    const _s  = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    _s('salaryTotalBudget', fmt(budget));
    _s('salaryPaidTotal',   fmt(paid));
    _s('salaryDueTotal',    fmt(due));
  }

  // ─────────────────────────────────────────────────────────
  // TOGGLE HISTORY
  // ─────────────────────────────────────────────────────────
  window._toggleSalHist = function (key) {
    const el    = document.getElementById('hist_' + key);
    const arrow = document.getElementById('arrow_' + key);
    if (!el) return;
    const open = el.style.display !== 'none';
    el.style.display = open ? 'none' : '';
    if (arrow) arrow.textContent = open ? '▼' : '▲';
  };

  // ─────────────────────────────────────────────────────────
  // OPEN PAY MODAL
  // ─────────────────────────────────────────────────────────
  function openSalaryModal(empId) {
    const modalEl = document.getElementById('salaryModal');
    if (!modalEl) { alert('Salary Modal not found!'); return; }

    const gd  = window.globalData || {};
    const all = gd.employees || [];
    const emp = all.find(e =>
      e.id === empId || e.empId === empId || e.employeeId === empId || e.name === empId
    );
    if (!emp) { alert('Employee not found!'); return; }

    _resetSalaryForm();

    // Set hidden fields
    document.getElementById('salEmpId').value   = emp.id || emp.empId || emp.name;
    document.getElementById('salEmpName').value = emp.name;

    // Employee display
    const nameEl = document.getElementById('salModalEmpName');
    const roleEl = document.getElementById('salModalEmpRole');
    if (nameEl) nameEl.textContent = emp.name;
    if (roleEl) roleEl.textContent = emp.role || emp.designation || 'Staff';

    // Due calculation
    const month = document.getElementById('salaryMonthFilter')?.value || '';
    const paidSoFar = (gd.finance || [])
      .filter(f => !f._deleted && f.type === 'Expense' && f.category === 'Salaries'
        && (f.date || '').startsWith(month)
        && (f.person === emp.name || f.employeeId === (emp.id || emp.empId)))
      .reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
    const base = parseFloat(emp.salary) || 0;
    const due  = Math.max(0, base - paidSoFar);

    const dueEl = document.getElementById('salDueAmountBadge');
    if (dueEl) dueEl.textContent = `৳${due.toLocaleString()}`;

    // Net advance
    const advNet = (gd.finance || [])
      .filter(f => !f._deleted && (f.type === 'Advance' || f.type === 'Advance Return')
        && (f.person === emp.name || f.employeeId === (emp.id || emp.empId)))
      .reduce((s, f) => s + (parseFloat(f.amount) || 0) * (f.type === 'Advance' ? 1 : -1), 0);
    const advEl = document.getElementById('salExistingAdvance');
    if (advEl) {
      if (advNet > 0) {
        advEl.textContent = `⚠️ বিদ্যমান Advance বকেয়া: ৳${advNet.toLocaleString()}`;
        advEl.classList.remove('d-none');
      } else {
        advEl.classList.add('d-none');
      }
    }

    // Auto-fill amount and description
    const amtEl  = document.getElementById('salAmount');
    const descEl = document.getElementById('salDescription');
    if (amtEl)  amtEl.value  = due > 0 ? due : '';
    if (descEl) descEl.value = `Salary for ${month}`;
    document.getElementById('salDate').value = new Date().toISOString().split('T')[0];

    // Default type = Due
    if (typeof window.setSalType === 'function') window.setSalType('Due');

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  }

  // ─────────────────────────────────────────────────────────
  // RESET FORM
  // ─────────────────────────────────────────────────────────
  function _resetSalaryForm() {
    const form = document.getElementById('salaryForm');
    if (form) form.reset();

    const methodSel = document.getElementById('salMethod');
    if (methodSel) {
      methodSel.innerHTML = '<option value="Cash">💵 Cash</option>';
      const gd = window.globalData || {};
      (gd.bankAccounts || []).forEach(b => {
        const o = document.createElement('option');
        o.value = b.name; o.textContent = `🏦 ${b.name}`;
        methodSel.appendChild(o);
      });
      (gd.mobileBanking || []).forEach(m => {
        const o = document.createElement('option');
        o.value = m.name; o.textContent = `📱 ${m.name}`;
        methodSel.appendChild(o);
      });
      methodSel.value = 'Cash';
    }
  }

  // ─────────────────────────────────────────────────────────
  // SUBMIT PAY
  // ─────────────────────────────────────────────────────────
  async function handleSalarySubmit(e) {
    if (e) e.preventDefault();
    const gd     = window.globalData || {};
    const empId  = document.getElementById('salEmpId').value;
    const empName= document.getElementById('salEmpName').value;
    const amount = parseFloat(document.getElementById('salAmount').value) || 0;
    const type   = document.getElementById('salTypeHidden')?.value || 'Due';
    const method = document.getElementById('salMethod').value;
    const date   = document.getElementById('salDate').value || new Date().toISOString().split('T')[0];
    const month  = document.getElementById('salaryMonthFilter')?.value || '';
    const desc   = document.getElementById('salDescription').value || `${type} for ${month}`;

    if (!empName || amount <= 0 || !method) { alert('সব required ফিল্ড পূরণ করুন।'); return; }
    if (!confirm(`${empName} — ${type}: ৳${amount.toLocaleString()} পেমেন্ট করবেন?`)) return;

    if (!gd.finance) gd.finance = [];

    const isAdv   = type === 'Advance';
    const isBonus = type === 'Bonus';
    const txn = {
      id:          'SAL_' + Date.now(),
      date,
      type:        isAdv ? 'Advance' : 'Expense',
      category:    isAdv ? 'Advance' : 'Salaries',
      method,
      amount,
      person:      empName,
      employeeId:  empId,
      description: `${desc}${isBonus ? ' [Bonus]' : isAdv ? ' [Advance]' : ' [Salary]'} (${month})`,
      source:      'salary',
      createdBy:   window.currentUser || 'Admin',
      createdAt:   new Date().toISOString()
    };

    gd.finance.push(txn);

    if (typeof window.feApplyEntryToAccount === 'function') window.feApplyEntryToAccount(txn, +1);
    if (typeof window.logActivity === 'function') {
      window.logActivity('finance', 'ADD',
        `Salary ${type}: ৳${amount.toLocaleString()} → ${empName} | ${method} | ${date}`);
    }
    if (window.markDirty)        window.markDirty('finance');
    if (window.saveToStorage)    await window.saveToStorage();
    if (window.scheduleSyncPush) window.scheduleSyncPush('Salary Payment');

    bootstrap.Modal.getInstance(document.getElementById('salaryModal'))?.hide();
    renderSalaryCards();
    if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
    if (typeof window.showSuccessToast === 'function') {
      window.showSuccessToast(`✅ ${empName} — ${type} ৳${amount.toLocaleString()} রেকর্ড হয়েছে!`);
    }
  }

  // ─────────────────────────────────────────────────────────
  // EDIT SALARY RECORD
  // ─────────────────────────────────────────────────────────
  window.editSalaryRecord = function (txId) {
    const gd  = window.globalData || {};
    const txn = (gd.finance || []).find(f => String(f.id) === String(txId));
    if (!txn) { alert('Record not found!'); return; }

    const modalEl = document.getElementById('salaryEditModal');
    if (!modalEl) { alert('Edit modal not found!'); return; }

    document.getElementById('salEditTxId').value       = txn.id;
    document.getElementById('salEditAmount').value     = txn.amount;
    document.getElementById('salEditDate').value       = txn.date || '';
    document.getElementById('salEditDesc').value       = txn.description || '';

    // Method select
    const methodSel = document.getElementById('salEditMethod');
    if (methodSel) {
      methodSel.innerHTML = '<option value="Cash">💵 Cash</option>';
      (gd.bankAccounts || []).forEach(b => {
        const o = document.createElement('option');
        o.value = b.name; o.textContent = `🏦 ${b.name}`; methodSel.appendChild(o);
      });
      (gd.mobileBanking || []).forEach(m => {
        const o = document.createElement('option');
        o.value = m.name; o.textContent = `📱 ${m.name}`; methodSel.appendChild(o);
      });
      methodSel.value = txn.method || 'Cash';
    }

    // Info header
    const infoEl = document.getElementById('salEditInfo');
    if (infoEl) {
      const isAdv   = txn.type === 'Advance';
      const isBonus = (txn.description || '').includes('[Bonus]');
      const label   = isAdv ? 'Advance' : isBonus ? 'Bonus' : 'Salary';
      infoEl.textContent = `${txn.person} — ${label}`;
    }

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
  };

  // ─────────────────────────────────────────────────────────
  // SUBMIT EDIT
  // ─────────────────────────────────────────────────────────
  window.handleSalaryEditSubmit = async function (e) {
    if (e) e.preventDefault();
    const gd     = window.globalData || {};
    const txId   = document.getElementById('salEditTxId').value;
    const amount = parseFloat(document.getElementById('salEditAmount').value) || 0;
    const date   = document.getElementById('salEditDate').value;
    const method = document.getElementById('salEditMethod').value;
    const desc   = document.getElementById('salEditDesc').value;

    const idx = (gd.finance || []).findIndex(f => String(f.id) === String(txId));
    if (idx === -1) { alert('Record not found!'); return; }
    if (amount <= 0) { alert('Amount must be greater than 0!'); return; }

    const old = { ...gd.finance[idx] };

    // Reverse old balance, apply new
    if (typeof window.feApplyEntryToAccount === 'function') {
      window.feApplyEntryToAccount(old, -1);
    }
    gd.finance[idx] = { ...gd.finance[idx], amount, date, method, description: desc };
    if (typeof window.feApplyEntryToAccount === 'function') {
      window.feApplyEntryToAccount(gd.finance[idx], +1);
    }

    if (typeof window.logActivity === 'function') {
      window.logActivity('finance', 'EDIT',
        `Salary record edited: ${old.person} | ৳${old.amount} → ৳${amount} | ${old.date} → ${date}`);
    }
    if (window.markDirty)        window.markDirty('finance');
    if (window.saveToStorage)    await window.saveToStorage();
    if (window.scheduleSyncPush) window.scheduleSyncPush('Salary Edit');

    bootstrap.Modal.getInstance(document.getElementById('salaryEditModal'))?.hide();
    renderSalaryCards();
    if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
    if (typeof window.showSuccessToast === 'function') window.showSuccessToast('✅ Record updated!');
  };

  // ─────────────────────────────────────────────────────────
  // DELETE SALARY RECORD
  // ─────────────────────────────────────────────────────────
  window.deleteSalaryRecord = function (txId) {
    const gd  = window.globalData || {};
    const txn = (gd.finance || []).find(f => String(f.id) === String(txId));
    if (!txn) { alert('Record not found!'); return; }

    if (!confirm(`Delete করবেন?\n${txn.person} — ৳${txn.amount} (${txn.date})`)) return;

    // Recycle bin
    if (typeof window.moveToTrash === 'function') window.moveToTrash('finance', { ...txn });

    // Reverse balance
    if (typeof window.feApplyEntryToAccount === 'function') window.feApplyEntryToAccount(txn, -1);

    // Remove from finance
    gd.finance = gd.finance.filter(f => String(f.id) !== String(txId));

    if (typeof window.logActivity === 'function') {
      window.logActivity('finance', 'DELETE',
        `Salary record deleted: ${txn.person} — ৳${txn.amount} (${txn.date})`);
    }
    if (window.markDirty)        window.markDirty('finance');
    if (window.saveToStorage)    window.saveToStorage();
    if (window.scheduleSyncPush) window.scheduleSyncPush('Salary Delete');

    renderSalaryCards();
    if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
    if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ Salary record deleted (Recycle Bin এ আছে)');
  };

  // ─────────────────────────────────────────────────────────
  // setSalType — Pay modal type selector
  // ─────────────────────────────────────────────────────────
  window.setSalType = function (type) {
    document.getElementById('salTypeHidden').value = type;
    ['Due', 'Advance', 'Bonus'].forEach(t => {
      const btn = document.getElementById('btnType' + t);
      if (!btn) return;
      if (t === type) {
        const colors = { Due: '#00d4aa', Advance: '#3b82f6', Bonus: '#f59e0b' };
        btn.style.background = `linear-gradient(135deg,${colors[t]},${colors[t]}aa)`;
        btn.style.color = '#fff';
        btn.style.boxShadow = `0 3px 12px ${colors[t]}55`;
        btn.style.border = 'none';
      } else {
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = '#6e8caa';
        btn.style.boxShadow = 'none';
        btn.style.border = '1px solid rgba(255,255,255,0.08)';
      }
    });

    // Show/hide info panels
    ['salDuePanel', 'salAdvancePanel', 'salBonusPanel'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('d-none');
    });
    const map = { Due: 'salDuePanel', Advance: 'salAdvancePanel', Bonus: 'salBonusPanel' };
    const panel = document.getElementById(map[type]);
    if (panel) panel.classList.remove('d-none');

    // Auto-fill amount
    const amtEl = document.getElementById('salAmount');
    if (amtEl && type !== 'Due') amtEl.value = '';
  };

  // ─────────────────────────────────────────────────────────
  // ADVANCE RETURN (global — callable from Accounts tab too)
  // ─────────────────────────────────────────────────────────
  window.recordAdvanceReturn = async function (empId, empName, amount, date, method, note) {
    const gd = window.globalData || {};
    if (!gd.finance) gd.finance = [];
    const txn = {
      id:          'ADV_RET_' + Date.now(),
      date:        date || new Date().toISOString().split('T')[0],
      type:        'Advance Return',
      category:    'Advance Return',
      method:      method || 'Cash',
      amount:      parseFloat(amount) || 0,
      person:      empName,
      employeeId:  empId,
      description: note || `Advance Return — ${empName}`,
      createdBy:   window.currentUser || 'Admin',
      createdAt:   new Date().toISOString()
    };
    gd.finance.push(txn);
    if (typeof window.feApplyEntryToAccount === 'function') window.feApplyEntryToAccount(txn, +1);
    if (typeof window.logActivity === 'function') {
      window.logActivity('finance', 'ADD', `Advance Return: ৳${amount} — ${empName}`);
    }
    if (window.markDirty)        window.markDirty('finance');
    if (window.saveToStorage)    await window.saveToStorage();
    if (window.scheduleSyncPush) window.scheduleSyncPush('Advance Return');
    renderSalaryCards();
    if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
    if (typeof window.renderAccMgmtList === 'function') window.renderAccMgmtList('Advance');
    if (typeof window.showSuccessToast === 'function') window.showSuccessToast(`✅ Advance Return ৳${amount} রেকর্ড হয়েছে`);
  };

  // ─────────────────────────────────────────────────────────
  // EXPOSE GLOBALS
  // ─────────────────────────────────────────────────────────
  window.initSalaryHub    = initSalaryHub;
  window.loadSalaryHub    = renderSalaryCards;   // backward compat
  window.openSalaryModal  = openSalaryModal;
  window.handleSalarySubmit = handleSalarySubmit;
  window.toggleSalHistory = window._toggleSalHist; // backward compat

  console.log('✅ salary-management.js v4.0 loaded');

})();

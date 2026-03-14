/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * SALARY HUB — Advanced Payroll Management (V3.2-Fixed)
 * ============================================================
 * ✅ Latest payment সবসময় উপরে (date desc sort)
 * ✅ History — একটি payment = একটি row, clean table
 * ✅ Staff dropdown auto-populated from employees  ← BUG FIXED
 * ✅ Due / Advance / Bonus — 3 payment types
 * ✅ Advance → Accounts Management-এ চলে যায়
 * ✅ Resigned employees বাদ
 * ✅ Advance Return — Salary ও Advance দুই জায়গা থেকে adjust
 * ✅ strict mode IIFE removed — section-loader.js compatibility fix
 * ============================================================
 */

(function () {
    /* NOTE: 'use strict' removed — section-loader.js caller/arguments access conflict */

    // ─────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────
    function initSalaryHub() {
        console.log('[SalaryHub] 💰 Initializing...');
        const monthInput = document.getElementById('salaryMonthFilter');
        if (monthInput && !monthInput.value) {
            const now = new Date();
            monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        loadSalaryHub();
    }

    // ─────────────────────────────────────────────
    // MAIN RENDER
    // ─────────────────────────────────────────────
    function loadSalaryHub() {
        const gd       = window.globalData || {};
        const month    = document.getElementById('salaryMonthFilter')?.value || '';
        const tbody    = document.getElementById('salaryTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Active employees only
        const allActiveEmps = (gd.employees || [])
            .filter(e => !e.resigned && e.status !== 'Resigned');

        // ── Sort: এই মাসের সবচেয়ে সাম্প্রতিক payment উপরে ──
        // এই মাসে কোনো payment নেই → সব-সময়ের latest দেখো
        // তাও নেই → joining date desc (নতুন staff উপরে)
        const getLatestDate = (emp, thisMonthOnly) => {
            const name = emp.name;
            const id   = emp.id || emp.empId || emp.employeeId;
            let latest = 0;
            (gd.finance || []).forEach(function(f) {
                if (f._deleted) return;
                if (f.person !== name && f.employeeId !== id) return;
                if (thisMonthOnly && !(f.description || '').includes(month) && !(f.date || '').startsWith(month)) return;
                const t = new Date(f.createdAt || f.date || 0).getTime();
                if (t > latest) latest = t;
            });
            return latest;
        };

        const employees = allActiveEmps.sort((a, b) => {
            // এই মাসের latest transaction
            const mA = getLatestDate(a, true);
            const mB = getLatestDate(b, true);
            if (mA > 0 || mB > 0) return mB - mA;
            // এই মাসে কিছু নেই — all-time latest
            const aA = getLatestDate(a, false);
            const aB = getLatestDate(b, false);
            if (aA > 0 || aB > 0) return aB - aA;
            // কারো কোনো transaction নেই → joining date
            return new Date(b.joiningDate || 0) - new Date(a.joiningDate || 0);
        });


        let totalBudget = 0, totalPaid = 0, totalDue = 0;

        // All finance records for this month
        const salaryRecords = (gd.finance || []).filter(f =>
            !f._deleted &&
            f.type === 'Expense' &&
            f.category === 'Salaries' &&
            (f.description || '').includes(month)
        );

        const advanceRecords = (gd.finance || []).filter(f =>
            !f._deleted &&
            f.type === 'Advance' &&
            (f.description || '').includes(month)
        );

        employees.forEach(emp => {
            const baseSalary = parseFloat(emp.salary) || 0;

            const empPayments = salaryRecords.filter(r =>
                r.person === emp.name || r.employeeId === emp.id
            );
            const empAdvances = advanceRecords.filter(r =>
                r.person === emp.name || r.employeeId === emp.id
            );

            const bonusPaid   = _sumByLabel(empPayments, 'Bonus');
            const salPaid     = empPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) - bonusPaid;
            const advancePaid = empAdvances.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
            const paidAmount  = salPaid + bonusPaid;
            const dueAmount   = Math.max(0, baseSalary - paidAmount);

            totalBudget += baseSalary;
            totalPaid   += paidAmount;
            totalDue    += dueAmount;

            // All transactions sorted: latest first
            const allTxns = [...empPayments, ...empAdvances]
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            const rowId = `hist_${(emp.id || emp.name).replace(/\W/g, '_')}`;
            const hasHistory = allTxns.length > 0;

            // Status badge
            const statusBadge = dueAmount === 0
                ? '<span class="badge bg-success rounded-pill px-3">Paid</span>'
                : paidAmount > 0
                    ? '<span class="badge bg-info text-dark rounded-pill px-3">Partial</span>'
                    : '<span class="badge bg-warning text-dark rounded-pill px-3">Pending</span>';

            // Main employee row
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-bold">${emp.name}</div>
                    <div class="small text-muted">${emp.phone || '-'}</div>
                    ${hasHistory ? `
                    <a href="#" class="small" style="color:#00d9ff;"
                        onclick="toggleSalHistory('${rowId}'); return false;">
                        <i class="bi bi-clock-history me-1"></i>History (${allTxns.length})
                    </a>` : ''}
                </td>
                <td><span class="badge bg-light text-dark border">${emp.role || 'Staff'}</span></td>
                <td>${statusBadge}</td>
                <td class="fw-bold">৳${baseSalary.toLocaleString()}</td>
                <td>${bonusPaid > 0 ? '৳' + bonusPaid.toLocaleString() : '<span class="text-muted">৳0</span>'}</td>
                <td>${advancePaid > 0 ? '৳' + advancePaid.toLocaleString() : '<span class="text-muted">৳0</span>'}</td>
                <td class="fw-bold text-success">৳${paidAmount.toLocaleString()}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-primary rounded-pill px-3"
                        onclick="openSalaryModal('${emp.id}')">
                        <i class="bi bi-cash-stack me-1"></i>Pay
                    </button>
                </td>
            `;
            tbody.appendChild(tr);

            // ── History sub-table (hidden, expands inline) ──
            if (hasHistory) {
                const histTr = document.createElement('tr');
                histTr.id = rowId;
                histTr.style.display = 'none';

                // Build history rows — ONE row per transaction, NO double rows
                const histRows = allTxns.map(p => {
                    const isAdv    = p.type === 'Advance';
                    const isBonus  = (p.description || '').includes('[Bonus]');
                    const typeLabel = isAdv ? 'Advance' : isBonus ? 'Bonus' : 'Salary';
                    const typeColor = isAdv
                        ? 'background:rgba(0,150,255,0.2);color:#7ab8ff;border:1px solid rgba(0,150,255,0.4);'
                        : isBonus
                            ? 'background:rgba(255,200,0,0.2);color:#ffd200;border:1px solid rgba(255,200,0,0.4);'
                            : 'background:rgba(0,200,100,0.2);color:#00e676;border:1px solid rgba(0,200,100,0.4);';
                    const amtColor = isAdv ? '#7ab8ff' : '#00e676';
                    const dateStr  = p.date
                        ? new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—';
                    return `
                        <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
                            <td style="color:#aaa;font-size:0.85rem;white-space:nowrap;">${dateStr}</td>
                            <td>
                                <span class="badge rounded-pill px-2 py-1" style="font-size:0.75rem;${typeColor}">
                                    ${typeLabel}
                                </span>
                            </td>
                            <td style="font-weight:700;color:${amtColor};">৳${parseFloat(p.amount || 0).toLocaleString()}</td>
                            <td style="color:#aaa;font-size:0.82rem;">${p.method || '—'}</td>
                            <td style="color:rgba(255,255,255,0.4);font-size:0.78rem;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
                                title="${(p.description || '').replace(/"/g, '')}">${p.description || '—'}</td>
                        </tr>`;
                }).join('');

                histTr.innerHTML = `
                    <td colspan="8" style="padding:0;">
                        <div style="margin:0 8px 8px 8px;border-radius:8px;overflow:hidden;
                            border:1px solid rgba(0,217,255,0.2);background:rgba(0,30,50,0.6);">
                            <div style="padding:8px 14px 6px;background:rgba(0,217,255,0.06);
                                border-bottom:1px solid rgba(0,217,255,0.15);font-size:0.8rem;
                                color:#00d9ff;font-weight:600;">
                                📋 Payment History — ${emp.name}
                            </div>
                            <div style="overflow-x:auto;">
                                <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
                                    <thead>
                                        <tr style="background:rgba(0,0,0,0.3);">
                                            <th style="padding:7px 12px;color:#6e8caa;font-weight:600;font-size:0.78rem;text-transform:uppercase;">Date</th>
                                            <th style="padding:7px 12px;color:#6e8caa;font-weight:600;font-size:0.78rem;text-transform:uppercase;">Type</th>
                                            <th style="padding:7px 12px;color:#6e8caa;font-weight:600;font-size:0.78rem;text-transform:uppercase;">Amount</th>
                                            <th style="padding:7px 12px;color:#6e8caa;font-weight:600;font-size:0.78rem;text-transform:uppercase;">Method</th>
                                            <th style="padding:7px 12px;color:#6e8caa;font-weight:600;font-size:0.78rem;text-transform:uppercase;">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>${histRows}</tbody>
                                </table>
                            </div>
                        </div>
                    </td>`;
                tbody.appendChild(histTr);
            }
        });

        // Summary totals
        _setText('salaryTotalBudget', `৳${totalBudget.toLocaleString()}`);
        _setText('salaryPaidTotal',   `৳${totalPaid.toLocaleString()}`);
        _setText('salaryDueTotal',    `৳${totalDue.toLocaleString()}`);
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────
    function _sumByLabel(payments, label) {
        return payments
            .filter(p => (p.description || '').includes(`[${label}]`))
            .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    }

    function _setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    // Toggle history sub-row
    window.toggleSalHistory = function (rowId) {
        const row = document.getElementById(rowId);
        if (!row) return;
        row.style.display = row.style.display === 'none' ? '' : 'none';
    };

    // ─────────────────────────────────────────────
    // OPEN MODAL  ← BUG FIXED HERE
    // ─────────────────────────────────────────────
    function openSalaryModal(empId) {
        const modalEl = document.getElementById('salaryModal');
        if (!modalEl) {
            alert('Salary Modal not found!');
            return;
        }

        const gd = window.globalData || {};

        // ── FIX: গ্লোবাল ডেটা লোড হয়েছে কিনা চেক করো ──
        const allEmployees = gd.employees || gd.staff || gd.hrEmployees || [];
        if (allEmployees.length === 0) {
            console.warn('[SalaryHub] ⚠️ No employees found in globalData. Keys:', Object.keys(gd));
        }

        _resetSalaryForm();

        // ── Populate employee dropdown ──
        const empSelect = document.getElementById('salEmpSelect');
        if (empSelect) {
            empSelect.innerHTML = '<option value="">-- Select Staff --</option>';

            const activeEmps = allEmployees
                .filter(e => !e.resigned && e.status !== 'Resigned')
                .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

            console.log('[SalaryHub] Populating dropdown with', activeEmps.length, 'employees');

            activeEmps.forEach(e => {
                const opt = document.createElement('option');
                opt.value          = e.id || e.empId || e.employeeId || e.name; // ← multiple ID fallbacks
                opt.textContent    = `${e.name} (${e.role || e.designation || 'Staff'})`;
                opt.dataset.name   = e.name;
                opt.dataset.salary = e.salary || e.basicSalary || 0;
                empSelect.appendChild(opt);
            });

            // ── FIX: onchange আগে set করো, তারপর value set করো ──
            empSelect.onchange = _onEmpSelectChange;

            if (empId) {
                // Try to match by multiple possible ID fields
                const matchedEmp = activeEmps.find(e =>
                    e.id === empId || e.empId === empId ||
                    e.employeeId === empId || e.name === empId
                );
                if (matchedEmp) {
                    const matchVal = matchedEmp.id || matchedEmp.empId || matchedEmp.employeeId || matchedEmp.name;
                    empSelect.value = matchVal;
                    // ── FIX: value set করার পরে manually trigger করো ──
                    _onEmpSelectChange();
                } else {
                    console.warn('[SalaryHub] Employee not found for id:', empId);
                }
            }
        }

        // Today's date
        const dateField = document.getElementById('salDate');
        if (dateField) dateField.value = new Date().toISOString().split('T')[0];

        // Default type = Due
        if (typeof window.setSalType === 'function') window.setSalType('Due');

        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }

    // ─────────────────────────────────────────────
    // EMPLOYEE SELECT CHANGE
    // ─────────────────────────────────────────────
    function _onEmpSelectChange() {
        const empSelect = document.getElementById('salEmpSelect');
        if (!empSelect) return;
        const opt = empSelect.options[empSelect.selectedIndex];
        if (!opt || !opt.value) return;

        const empId      = opt.value;
        const empName    = opt.dataset.name || '';
        const baseSalary = parseFloat(opt.dataset.salary) || 0;

        document.getElementById('salEmpId').value   = empId;
        document.getElementById('salEmpName').value = empName;

        const gd    = window.globalData || {};
        const month = document.getElementById('salaryMonthFilter')?.value || '';

        // Calculate due
        const paid = (gd.finance || [])
            .filter(f => !f._deleted && f.type === 'Expense' && f.category === 'Salaries'
                && (f.description || '').includes(month)
                && (f.person === empName || f.employeeId === empId))
            .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const due = Math.max(0, baseSalary - paid);

        // Update due badge
        const badge = document.getElementById('salDueAmountBadge');
        if (badge) badge.textContent = `৳${due.toLocaleString()}`;

        // Check existing advance (all-time net, not just this month)
        const advTotal = (gd.finance || [])
            .filter(f => !f._deleted && f.type === 'Advance'
                && (f.person === empName || f.employeeId === empId))
            .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const advReturned = (gd.finance || [])
            .filter(f => !f._deleted && f.type === 'Advance Return'
                && (f.person === empName || f.employeeId === empId))
            .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const netAdv = advTotal - advReturned;

        const advEl = document.getElementById('salExistingAdvance');
        if (advEl) {
            if (netAdv > 0) {
                advEl.textContent = `⚠️ বিদ্যমান Advance বকেয়া: ৳${netAdv.toLocaleString()}`;
                advEl.classList.remove('d-none');
            } else {
                advEl.classList.add('d-none');
            }
        }

        // Auto-fill amount based on current type
        const currentType = document.getElementById('salTypeHidden')?.value || 'Due';
        const amountEl    = document.getElementById('salAmount');
        if (amountEl && currentType === 'Due') {
            amountEl.value = due > 0 ? due : '';
        }

        // Auto description
        const desc = document.getElementById('salDescription');
        if (desc && month) desc.value = `${currentType} for ${month}`;
    }

    // ─────────────────────────────────────────────
    // RESET FORM
    // ─────────────────────────────────────────────
    function _resetSalaryForm() {
        const form = document.getElementById('salaryForm');
        if (form) form.reset();

        // Payment methods
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

        const salEmpId   = document.getElementById('salEmpId');
        const salEmpName = document.getElementById('salEmpName');
        if (salEmpId)   salEmpId.value   = '';
        if (salEmpName) salEmpName.value = '';
    }

    // ─────────────────────────────────────────────
    // SUBMIT
    // ─────────────────────────────────────────────
    async function handleSalarySubmit(e) {
        if (e) e.preventDefault();

        const gd      = window.globalData || {};
        const empId   = document.getElementById('salEmpId').value;
        const empName = document.getElementById('salEmpName').value;
        const amount  = parseFloat(document.getElementById('salAmount').value) || 0;
        const type    = document.getElementById('salTypeHidden')?.value || 'Due';
        const method  = document.getElementById('salMethod').value;
        const date    = document.getElementById('salDate').value || new Date().toISOString().split('T')[0];
        const month   = document.getElementById('salaryMonthFilter')?.value || '';
        const desc    = document.getElementById('salDescription').value || `${type} for ${month}`;

        if (!empName || amount <= 0 || !method || !month) {
            alert('সব required ফিল্ড পূরণ করুন।');
            return;
        }
        if (!confirm(`${empName}-কে ${type} ৳${amount.toLocaleString()} পেমেন্ট করবেন?`)) return;

        if (!gd.finance) gd.finance = [];

        if (type === 'Advance') {
            // Advance → type:'Advance' — Accounts Management এ sync হবে
            gd.finance.push({
                id: 'SAL_ADV_' + Date.now(),
                date,
                type: 'Advance',
                category: 'Advance',
                method,
                amount,
                person: empName,
                employeeId: empId,
                description: `${desc} [Advance] (${month})`,
                source: 'salary',          // ← accounts-management filter করতে পারবে
                createdBy: window.currentUser || 'Admin',
                createdAt: new Date().toISOString()
            });
        } else {
            // Due / Bonus → Expense > Salaries
            const label = type === 'Bonus' ? 'Bonus' : 'Salary';
            gd.finance.push({
                id: 'SAL_' + Date.now(),
                date,
                type: 'Expense',
                category: 'Salaries',
                method,
                amount,
                person: empName,
                employeeId: empId,
                description: `${desc} [${label}] (${month})`,
                createdBy: window.currentUser || 'Admin',
                createdAt: new Date().toISOString()
            });
        }

        if (window.markDirty)        window.markDirty('finance');
        if (window.saveToStorage)    window.saveToStorage();
        if (window.scheduleSyncPush) window.scheduleSyncPush('Salary Payment');

        bootstrap.Modal.getInstance(document.getElementById('salaryModal')).hide();
        loadSalaryHub();

        // ── Advance Management refresh ──
        if (typeof window.renderAccMgmtList === 'function') {
            window.renderAccMgmtList('Advance');
        }
        // ── Fallback: যদি অন্য function নামে থাকে ──
        if (typeof window.refreshAdvanceList === 'function') {
            window.refreshAdvanceList();
        }
        if (typeof window.loadAdvanceManagement === 'function') {
            window.loadAdvanceManagement();
        }

        if (typeof window.showSuccessToast === 'function') {
            const msgs = {
                Advance: `🔵 Advance ৳${amount.toLocaleString()} — Accounts-এ রেকর্ড হয়েছে!`,
                Bonus:   `🌟 Bonus ৳${amount.toLocaleString()} — রেকর্ড হয়েছে!`,
                Due:     `✅ ৳${amount.toLocaleString()} — ${empName}-কে পেমেন্ট সম্পন্ন!`,
            };
            window.showSuccessToast(msgs[type] || '✅ Payment recorded!');
        }
    }

    // ─────────────────────────────────────────────
    // ADVANCE RETURN — দুই জায়গা থেকে call হবে
    // Salary Tab থেকেও, Accounts থেকেও
    // ─────────────────────────────────────────────
    window.recordAdvanceReturn = function(empId, empName, amount, date, method, note) {
        const gd = window.globalData || {};
        if (!gd.finance) gd.finance = [];

        gd.finance.push({
            id: 'ADV_RET_' + Date.now(),
            date: date || new Date().toISOString().split('T')[0],
            type: 'Advance Return',
            category: 'Advance Return',
            method: method || 'Cash',
            amount: parseFloat(amount) || 0,
            person: empName,
            employeeId: empId,
            description: note || `Advance Return — ${empName}`,
            createdBy: window.currentUser || 'Admin',
            createdAt: new Date().toISOString()
        });

        if (window.markDirty)        window.markDirty('finance');
        if (window.saveToStorage)    window.saveToStorage();
        if (window.scheduleSyncPush) window.scheduleSyncPush('Advance Return');

        // দুই জায়গাতেই refresh
        loadSalaryHub();
        if (typeof window.renderAccMgmtList === 'function')   window.renderAccMgmtList('Advance');
        if (typeof window.refreshAdvanceList === 'function')   window.refreshAdvanceList();
        if (typeof window.loadAdvanceManagement === 'function') window.loadAdvanceManagement();

        if (typeof window.showSuccessToast === 'function') {
            window.showSuccessToast(`✅ Advance Return ৳${parseFloat(amount).toLocaleString()} — রেকর্ড হয়েছে!`);
        }
    };

    // ─────────────────────────────────────────────
    // EXPORTS
    // ─────────────────────────────────────────────
    window.initSalaryHub      = initSalaryHub;
    window.loadSalaryHub      = loadSalaryHub;
    window.openSalaryModal    = openSalaryModal;
    window._openSalaryModalImpl = openSalaryModal; // ← section-loader এর জন্য
    window.handleSalarySubmit = handleSalarySubmit;

})();

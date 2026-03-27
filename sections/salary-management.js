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
        // v8 FIX: আগে প্রতিটি sort comparison এ পুরো finance array scan হতো।
        // এখন একবার scan করে প্রতিটি employee এর latest date cache করা হয়।
        // ফলে sort এ আর finance loop নেই — অনেক দ্রুত।

        // STEP 1: একবার finance scan করে emp → {monthLatest, allLatest} map তৈরি
        const empLatestCache = {};
        (gd.finance || []).forEach(function(f) {
            if (f._deleted) return;
            const key = f.person || f.employeeId;
            if (!key) return;
            if (!empLatestCache[key]) empLatestCache[key] = { month: 0, all: 0 };
            const t = new Date(f.createdAt || f.date || 0).getTime();
            // all-time latest
            if (t > empLatestCache[key].all) empLatestCache[key].all = t;
            // this-month latest
            const isThisMonth = (f.description || '').includes(month) || (f.date || '').startsWith(month);
            if (isThisMonth && t > empLatestCache[key].month) empLatestCache[key].month = t;
        });

        const getLatestDate = (emp, thisMonthOnly) => {
            const name = emp.name;
            const id   = emp.id || emp.empId || emp.employeeId;
            const byName = empLatestCache[name] || { month: 0, all: 0 };
            const byId   = empLatestCache[id]   || { month: 0, all: 0 };
            if (thisMonthOnly) return Math.max(byName.month, byId.month);
            return Math.max(byName.all, byId.all);
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
                        ? (typeof window.formatPrintDate === 'function' ? window.formatPrintDate(new Date(p.date)) : new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }))
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
                            <td style="white-space:nowrap;">
                                <button class="btn btn-sm btn-outline-warning rounded-pill px-2 py-0" style="font-size:0.72rem;"
                                    onclick="editSalaryPayment('${p.id}')" title="Edit">
                                    <i class="bi bi-pencil-square"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger rounded-pill px-2 py-0 ms-1" style="font-size:0.72rem;"
                                    onclick="deleteSalaryPayment('${p.id}')" title="Delete">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
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
                                            <th style="padding:7px 12px;color:#6e8caa;font-weight:600;font-size:0.78rem;text-transform:uppercase;">Actions</th>
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
    // ─────────────────────────────────────────────
    // SCRIPT RE-EXECUTOR
    // section-loader.js innerHTML দিয়ে inject করলে
    // <script> block execute হয় না।
    // এই function inject এর পরে scripts re-run করে।
    // ─────────────────────────────────────────────
    function _reExecModalScripts(containerEl) {
        if (!containerEl) return;
        const scripts = containerEl.querySelectorAll('script');
        scripts.forEach(function(oldScript) {
            const newScript = document.createElement('script');
            newScript.textContent = oldScript.textContent;
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }

    // ─────────────────────────────────────────────
    // RENDER ADVANCE QUICK VIEW
    // Auto-test requirement: Simple quick view of advance balances
    // ─────────────────────────────────────────────
    window.renderAdvanceQuick = function(containerId) {
        const container = document.getElementById(containerId) || document.createElement('div');
        const gd = window.globalData || {};
        
        if (!gd.employees) { container.innerHTML = '<p>No employees</p>'; return; }
        
        // Calculate advances by employee
        const empAdvances = {};
        (gd.employees || []).forEach(emp => {
            if (emp.resigned || emp.status === 'Resigned') return;
            const empId = emp.id || emp.empId || emp.employeeId;
            const empName = emp.name;
            if (!empId && !empName) return;
            
            const key = empName || empId;
            empAdvances[key] = { emp, total: 0, returned: 0 };
        });
        
        // Sum advances and returns
        (gd.finance || []).forEach(f => {
            if (f._deleted) return;
            const empName = f.person;
            const empId = f.employeeId;
            if (!empName && !empId) return;
            
            const key = empName || empId;
            if (!empAdvances[key]) {
                empAdvances[key] = { emp: { name: empName, id: empId }, total: 0, returned: 0 };
            }
            
            const amt = parseFloat(f.amount) || 0;
            if (f.type === 'Advance') {
                empAdvances[key].total += amt;
            } else if (f.type === 'Advance Return') {
                empAdvances[key].returned += amt;
            }
        });
        
        // Build HTML
        let html = '<div style="padding:12px;font-size:0.85rem;">';
        let hasAdvances = false;
        
        Object.keys(empAdvances).forEach(key => {
            const data = empAdvances[key];
            const net = data.total - data.returned;
            if (net > 0) {
                hasAdvances = true;
                html += `<div style="padding:6px 0;border-bottom:1px solid #333;">
                    <strong>${data.emp.name || key}</strong>: 
                    <span style="color:#00ff00;">৳${net.toLocaleString()}</span>
                </div>`;
            }
        });
        
        if (!hasAdvances) {
            html += '<p style="color:#888;">No active advances</p>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    };

    function openSalaryModal(empId) {
        var modalEl = document.getElementById('salaryModal');

        // Clear any edit mode state
        window._editingSalaryTxnId = null;

        // ── Script re-execution fix ──
        // modal এর parent container এ script re-run করো
        // যাতে setSalType() define হয় inject এর পরেও
        if (modalEl && !window._salaryModalScriptsReady) {
            _reExecModalScripts(modalEl.parentElement || modalEl);
            window._salaryModalScriptsReady = true;
        }

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

        // Reset modal title and confirm button to create mode
        var titleEl = document.getElementById('salModalTitle');
        if (titleEl) titleEl.textContent = '💰 Record Salary Payment';
        var confirmBtn = document.getElementById('salConfirmBtn');
        if (confirmBtn) {
            confirmBtn.textContent = '💾 Confirm Payment';
            confirmBtn.className = 'btn btn-success fw-bold px-4';
            confirmBtn.style.cssText = '';
        }
        window._editingSalaryTxnId = null;
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

        // ── EDIT MODE ──
        var editingId = window._editingSalaryTxnId;
        if (editingId) {
            if (!confirm(`${empName}-এর পেমেন্ট আপডেট করবেন? (৳${amount.toLocaleString()} ${type})`)) return;

            var txnIdx = (gd.finance || []).findIndex(function(f) { return String(f.id) === String(editingId); });
            if (txnIdx === -1) { alert('Transaction not found!'); return; }

            var oldTxn = Object.assign({}, gd.finance[txnIdx]);

            // Reverse old account balance
            if (typeof window.feApplyEntryToAccount === 'function') {
                window.feApplyEntryToAccount(oldTxn, -1);
            }

            // Determine new type fields
            var isAdvance = type === 'Advance';
            var label = type === 'Bonus' ? 'Bonus' : 'Salary';
            var newType = isAdvance ? 'Advance' : 'Expense';
            var newCategory = isAdvance ? 'Advance' : 'Salaries';
            var newDesc = desc + (isAdvance ? ' [Advance]' : ' [' + label + ']') + ' (' + month + ')';

            // Update the existing transaction
            gd.finance[txnIdx] = Object.assign({}, gd.finance[txnIdx], {
                date: date,
                type: newType,
                category: newCategory,
                method: method,
                amount: amount,
                person: empName,
                employeeId: empId,
                description: newDesc
            });

            // Apply new account balance
            if (typeof window.feApplyEntryToAccount === 'function') {
                window.feApplyEntryToAccount(gd.finance[txnIdx], +1);
            }

            // Activity log
            if (typeof window.logActivity === 'function') {
                window.logActivity('salary', 'EDIT',
                    'Salary payment edited: ৳' + (parseFloat(oldTxn.amount) || 0) + ' → ৳' + amount +
                    ' | ' + empName + ' | ' + (oldTxn.date || '-') + ' → ' + date +
                    ' | ' + type,
                    { before: oldTxn, after: gd.finance[txnIdx] }
                );
            }

            // Clear edit mode
            window._editingSalaryTxnId = null;

            if (window.markDirty)        window.markDirty('finance');
            if (window.saveToStorage)    window.saveToStorage();
            if (window.scheduleSyncPush) window.scheduleSyncPush('Edit Salary Payment');

            bootstrap.Modal.getInstance(document.getElementById('salaryModal')).hide();
            loadSalaryHub();

            if (typeof window.showSuccessToast === 'function') {
                window.showSuccessToast('✅ Payment updated successfully!');
            }

            // Refresh accounts
            if (typeof window.renderAccMgmtList === 'function') window.renderAccMgmtList('Advance');
            if (typeof window.renderAccountList === 'function') window.renderAccountList();
            if (typeof window.renderCashBalance === 'function') window.renderCashBalance();
            if (typeof window.updateGrandTotal === 'function') window.updateGrandTotal();
            return;
        }

        // ── CREATE MODE ──
        if (!confirm(`${empName}-কে ${type} ৳${amount.toLocaleString()} পেমেন্ট করবেন?`)) return;

        if (!gd.finance) gd.finance = [];

        if (type === 'Advance') {
            // Advance → type:'Advance' — Accounts Management এ sync হবে
            const newAdv = {
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
            };
            gd.finance.push(newAdv);

            // ✅ FIX: Update Account Balance
            if (typeof window.feApplyEntryToAccount === 'function') {
                window.feApplyEntryToAccount(newAdv, +1);
            }
        } else {
            // Due / Bonus → Expense > Salaries
            const label = type === 'Bonus' ? 'Bonus' : 'Salary';
            const newTxn = {
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
            };
            gd.finance.push(newTxn);
            
            // ✅ FIX: Update Account Balance (Missing from diagram sync)
            if (typeof window.feApplyEntryToAccount === 'function') {
                window.feApplyEntryToAccount(newTxn, +1);
            }
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
    // SET PAYMENT TYPE — Due / Advance / Bonus
    // salary-modal.html এ inline script থাকলেও,
    // এখানেও define করা হলো যাতে modal load timing
    // সমস্যায় বাটন কাজ না করলেও fallback থাকে।
    // ─────────────────────────────────────────────
    // ─────────────────────────────────────────────
    // SET PAYMENT TYPE — Due / Advance / Bonus
    // salary-modal.html থেকে script সরানো হয়েছে।
    // এখন এখানেই সম্পূর্ণ logic আছে।
    // window.setSalType হিসেবে global — বাটনের
    // onclick="setSalType('Advance')" সরাসরি call করবে।
    // ─────────────────────────────────────────────
    window.setSalType = function (type) {
        var hidden = document.getElementById('salTypeHidden');
        if (hidden) hidden.value = type;

        // Button visual styles
        var styles = {
            Due:     { bg:'linear-gradient(135deg,#00d4aa,#00a88a)', color:'#fff',    shadow:'0 3px 12px rgba(0,212,170,0.4)', border:'none' },
            Advance: { bg:'linear-gradient(135deg,#0096ff,#0055cc)', color:'#fff',    shadow:'0 3px 12px rgba(0,150,255,0.4)', border:'none' },
            Bonus:   { bg:'linear-gradient(135deg,#ffd200,#ff9f43)', color:'#1a1000', shadow:'0 3px 12px rgba(255,200,0,0.4)',  border:'none' }
        };
        var inactive = { bg:'rgba(255,255,255,0.07)', color:'#a0c4ff', shadow:'none', border:'1px solid rgba(255,255,255,0.12)' };

        ['Due','Advance','Bonus'].forEach(function(t) {
            var btn = document.getElementById('btnType' + t);
            if (!btn) return;
            var s = (t === type) ? styles[t] : inactive;
            btn.style.background = s.bg;
            btn.style.color      = s.color;
            btn.style.boxShadow  = s.shadow;
            btn.style.border     = s.border;
        });

        // Show/hide info panels
        var panels = { Due:'salDuePanel', Advance:'salAdvancePanel', Bonus:'salBonusPanel' };
        Object.keys(panels).forEach(function(t) {
            var el = document.getElementById(panels[t]);
            if (!el) return;
            if (t === type) el.classList.remove('d-none');
            else            el.classList.add('d-none');
        });

        // Confirm button style + label
        var confirmBtn = document.getElementById('salConfirmBtn');
        if (confirmBtn) {
            var btnLabels = { Due:'💾 Pay Due Salary', Advance:'🔵 Save Advance', Bonus:'🌟 Save Bonus' };
            confirmBtn.textContent = btnLabels[type];
            if (type === 'Advance') {
                confirmBtn.className = 'btn fw-bold px-4';
                confirmBtn.style.cssText = 'background:linear-gradient(135deg,#0096ff,#0055cc);color:#fff;border:none;';
            } else if (type === 'Bonus') {
                confirmBtn.className = 'btn fw-bold px-4';
                confirmBtn.style.cssText = 'background:linear-gradient(135deg,#ffd200,#ff9f43);color:#1a1000;border:none;';
            } else {
                confirmBtn.className = 'btn btn-success fw-bold px-4';
                confirmBtn.style.cssText = '';
            }
        }

        // Modal title
        var titles = { Due:'💰 Pay Due Salary', Advance:'🔵 Record Advance', Bonus:'🌟 Record Bonus' };
        var titleEl = document.getElementById('salModalTitle');
        if (titleEl) titleEl.textContent = titles[type];

        // Auto description
        var monthEl = document.getElementById('salaryMonthFilter');
        var month = monthEl ? monthEl.value : '';
        var desc = document.getElementById('salDescription');
        if (desc && month) desc.value = type + ' for ' + month;

        // Amount auto-fill
        var amountEl = document.getElementById('salAmount');
        if (!amountEl) return;
        if (type === 'Due') {
            var badge = document.getElementById('salDueAmountBadge');
            var badgeText = badge ? badge.textContent : '';
            var dueNum = parseFloat(badgeText.replace(/[^0-9.]/g, '')) || 0;
            amountEl.value = dueNum > 0 ? dueNum : '';
            amountEl.placeholder = 'বকেয়া পরিমাণ';
        } else {
            amountEl.value = '';
            amountEl.placeholder = type === 'Advance' ? 'Advance পরিমাণ' : 'Bonus পরিমাণ';
        }
    };

    // ─────────────────────────────────────────────
    // EDIT SALARY PAYMENT
    // ─────────────────────────────────────────────
    window.editSalaryPayment = function (txnId) {
        var gd = window.globalData || {};
        var txn = (gd.finance || []).find(function(f) { return String(f.id) === String(txnId); });
        if (!txn) { alert('Payment record not found!'); return; }

        var modalEl = document.getElementById('salaryModal');
        if (!modalEl) { alert('Salary modal not found!'); return; }

        // Re-execute modal scripts if needed
        if (!window._salaryModalScriptsReady) {
            _reExecModalScripts(modalEl.parentElement || modalEl);
            window._salaryModalScriptsReady = true;
        }

        _resetSalaryForm();

        var allEmployees = (gd.employees || gd.staff || gd.hrEmployees || []);
        var empSelect = document.getElementById('salEmpSelect');
        if (empSelect) {
            empSelect.innerHTML = '<option value="">-- Select Staff --</option>';
            allEmployees
                .filter(function(e) { return !e.resigned && e.status !== 'Resigned'; })
                .sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); })
                .forEach(function(e) {
                    var opt = document.createElement('option');
                    opt.value = e.id || e.empId || e.employeeId || e.name;
                    opt.textContent = (e.name || '') + ' (' + (e.role || e.designation || 'Staff') + ')';
                    opt.dataset.name = e.name;
                    opt.dataset.salary = e.salary || e.basicSalary || 0;
                    empSelect.appendChild(opt);
                });
            empSelect.onchange = _onEmpSelectChange;

            // Set employee
            var matchEmp = allEmployees.find(function(e) {
                return e.name === txn.person || e.id === txn.employeeId ||
                       e.empId === txn.employeeId || e.employeeId === txn.employeeId;
            });
            if (matchEmp) {
                empSelect.value = matchEmp.id || matchEmp.empId || matchEmp.employeeId || matchEmp.name;
            }
        }

        // Populate payment methods
        var methodSel = document.getElementById('salMethod');
        if (methodSel) {
            methodSel.innerHTML = '<option value="Cash">💵 Cash</option>';
            (gd.bankAccounts || []).forEach(function(b) {
                var o = document.createElement('option');
                o.value = b.name; o.textContent = '🏦 ' + b.name;
                methodSel.appendChild(o);
            });
            (gd.mobileBanking || []).forEach(function(m) {
                var o = document.createElement('option');
                o.value = m.name; o.textContent = '📱 ' + m.name;
                methodSel.appendChild(o);
            });
        }

        // Fill form fields
        document.getElementById('salEmpId').value = txn.employeeId || '';
        document.getElementById('salEmpName').value = txn.person || '';
        document.getElementById('salAmount').value = parseFloat(txn.amount) || 0;
        document.getElementById('salDate').value = txn.date || '';
        if (methodSel) methodSel.value = txn.method || 'Cash';
        document.getElementById('salDescription').value = txn.description || '';

        // Detect type from description
        var desc = txn.description || '';
        var editType = 'Due';
        if (desc.includes('[Advance]')) editType = 'Advance';
        else if (desc.includes('[Bonus]')) editType = 'Bonus';
        window.setSalType(editType);

        // Store editing ID
        window._editingSalaryTxnId = String(txnId);

        // Update modal title
        var titleEl = document.getElementById('salModalTitle');
        if (titleEl) titleEl.textContent = '✏️ Edit Salary Payment';

        // Update confirm button
        var confirmBtn = document.getElementById('salConfirmBtn');
        if (confirmBtn) {
            confirmBtn.textContent = '✏️ Update Payment';
            confirmBtn.className = 'btn btn-warning fw-bold px-4';
            confirmBtn.style.cssText = '';
        }

        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    };

    // ─────────────────────────────────────────────
    // DELETE SALARY PAYMENT
    // ─────────────────────────────────────────────
    window.deleteSalaryPayment = function (txnId) {
        var gd = window.globalData || {};
        var sid = String(txnId);
        var txn = (gd.finance || []).find(function(f) { return String(f.id) === sid; });
        if (!txn) { alert('Payment record not found!'); return; }

        var amt = parseFloat(txn.amount) || 0;
        var person = txn.person || 'Unknown';
        if (!confirm(person + '-এর ৳' + amt.toLocaleString() + ' পেমেন্ট ডিলিট করবেন?')) return;

        // Reverse account balance
        if (typeof window.feApplyEntryToAccount === 'function') {
            window.feApplyEntryToAccount(txn, -1);
        }

        // Move to trash
        if (typeof window.moveToTrash === 'function') {
            window.moveToTrash('salary_payment', txn);
        }

        // Activity log
        if (typeof window.logActivity === 'function') {
            window.logActivity('salary', 'DELETE',
                'Salary payment deleted: ৳' + amt + ' — ' + person +
                ' | ' + (txn.date || '-') + ' | ' + (txn.description || ''),
                txn
            );
        }

        // Remove from finance array
        gd.finance = gd.finance.filter(function(f) { return String(f.id) !== sid; });

        // Save
        if (window.markDirty)        window.markDirty('finance');
        if (window.saveToStorage)    window.saveToStorage();
        if (window.scheduleSyncPush) window.scheduleSyncPush('Delete Salary Payment');

        // Delete tracking
        var dc = parseInt(localStorage.getItem('wings_total_deleted') || '0') + 1;
        localStorage.setItem('wings_total_deleted', dc.toString());

        loadSalaryHub();

        if (typeof window.showSuccessToast === 'function') {
            window.showSuccessToast('✅ Payment deleted successfully!');
        }

        // Refresh accounts
        if (typeof window.renderAccMgmtList === 'function') window.renderAccMgmtList('Advance');
        if (typeof window.renderAccountList === 'function') window.renderAccountList();
        if (typeof window.renderCashBalance === 'function') window.renderCashBalance();
        if (typeof window.updateGrandTotal === 'function') window.updateGrandTotal();
    };

    // ─────────────────────────────────────────────
    // EXPORTS
    // ─────────────────────────────────────────────
    window.initSalaryHub      = initSalaryHub;
    window.loadSalaryHub      = loadSalaryHub;
    window.openSalaryModal    = openSalaryModal;
    window._openSalaryModalImpl = function(empId) {
        // section-loader callback এ এসে modal inject হওয়ার পরে
        // script re-execution reset করো, তারপর modal খোলো
        window._salaryModalScriptsReady = false;
        openSalaryModal(empId);
    };
    window.handleSalarySubmit = handleSalarySubmit;

})();

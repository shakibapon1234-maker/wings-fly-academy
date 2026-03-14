/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * SALARY HUB — Advanced Payroll Management (V2-Modern)
 * ============================================================
 * CHANGELOG:
 *  ✅ Staff Member auto-populated from employees list (dropdown)
 *  ✅ Payment history with date shown per employee (collapsible)
 *  ✅ Advance type goes to Accounts Management (Advance tracking)
 * ============================================================
 */

(function () {
    'use strict';

    function initSalaryHub() {
        console.log('[SalaryHub] 💰 Initializing Salary Management...');
        const monthInput = document.getElementById('salaryMonthFilter');
        if (monthInput && !monthInput.value) {
            const now = new Date();
            monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        loadSalaryHub();
    }

    function loadSalaryHub() {
        const gd = window.globalData || {};
        const employees = (gd.employees || []).filter(e => !e.resigned && e.status !== 'Resigned');
        const month = document.getElementById('salaryMonthFilter')?.value || '';

        const tbody = document.getElementById('salaryTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        let totalBudget = 0;
        let totalPaid = 0;
        let totalDue = 0;

        // Salary payment records for this month (Expense + Salaries category)
        const salaryRecords = (gd.finance || []).filter(f =>
            !f._deleted &&
            f.type === 'Expense' &&
            f.category === 'Salaries' &&
            (f.description || '').includes(month)
        );

        // Advance records linked to salary (type === 'Advance' with employeeId)
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

            // Only count Salary & Bonus toward "paid" — Advance is tracked separately
            const salaryPaid = empPayments
                .filter(p => !(p.description || '').includes('[Advance]'))
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            const bonusPaid = _calcType(empPayments, 'Bonus');
            const advancePaid = empAdvances.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

            const paidAmount = salaryPaid + bonusPaid;
            const dueAmount = Math.max(0, baseSalary - paidAmount);

            totalBudget += baseSalary;
            totalPaid += paidAmount;
            totalDue += dueAmount;

            // Build payment history rows
            const historyRows = _buildHistoryRows([...empPayments, ...empAdvances]);

            const rowId = `hist_${emp.id || emp.name.replace(/\s/g, '_')}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-bold">${emp.name}</div>
                    <div class="small text-muted">${emp.phone || '-'}</div>
                    ${historyRows ? `
                    <a href="#" class="small text-info" onclick="toggleHistory('${rowId}'); return false;">
                        <i class="bi bi-clock-history me-1"></i>History
                    </a>` : ''}
                </td>
                <td><span class="badge bg-light text-dark border">${emp.role || 'Staff'}</span></td>
                <td>
                    ${dueAmount === 0 ?
                        '<span class="badge bg-success rounded-pill">Paid</span>' :
                        (paidAmount > 0 ? '<span class="badge bg-info rounded-pill">Partial</span>' : '<span class="badge bg-warning rounded-pill">Pending</span>')
                    }
                </td>
                <td class="fw-bold">৳${baseSalary.toLocaleString()}</td>
                <td>৳${bonusPaid.toLocaleString()}</td>
                <td>৳${advancePaid.toLocaleString()}</td>
                <td class="fw-bold text-success">৳${paidAmount.toLocaleString()}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-primary rounded-pill px-3" onclick="openSalaryModal('${emp.id}')">
                        <i class="bi bi-cash-stack me-1"></i> Pay
                    </button>
                </td>
            `;
            tbody.appendChild(tr);

            // History expandable row
            if (historyRows) {
                const histTr = document.createElement('tr');
                histTr.id = rowId;
                histTr.style.display = 'none';
                histTr.innerHTML = `
                    <td colspan="8" class="p-0">
                        <div class="p-3" style="background:rgba(0,180,255,0.06); border-left:3px solid #00d9ff;">
                            <table class="table table-sm mb-0" style="font-size:0.85rem;">
                                <thead><tr>
                                    <th>Date</th><th>Type</th><th>Amount</th><th>Method</th><th>Description</th>
                                </tr></thead>
                                <tbody>${historyRows}</tbody>
                            </table>
                        </div>
                    </td>`;
                tbody.appendChild(histTr);
            }
        });

        document.getElementById('salaryTotalBudget').textContent = `৳${totalBudget.toLocaleString()}`;
        document.getElementById('salaryPaidTotal').textContent = `৳${totalPaid.toLocaleString()}`;
        document.getElementById('salaryDueTotal').textContent = `৳${totalDue.toLocaleString()}`;
    }

    function _buildHistoryRows(payments) {
        if (!payments || payments.length === 0) return '';
        const sorted = [...payments].sort((a, b) => new Date(b.date) - new Date(a.date));
        return sorted.map(p => {
            const typeLabel = (p.description || '').includes('[Bonus]') ? 'Bonus' :
                              (p.type === 'Advance') ? 'Advance' : 'Salary';
            const badgeClass = typeLabel === 'Bonus' ? 'bg-warning text-dark' :
                               typeLabel === 'Advance' ? 'bg-info text-dark' : 'bg-success';
            const dateStr = p.date ? new Date(p.date).toLocaleDateString('en-GB', {day:'2-digit', month:'short', year:'numeric'}) : '-';
            return `<tr>
                <td>${dateStr}</td>
                <td><span class="badge ${badgeClass} rounded-pill">${typeLabel}</span></td>
                <td class="fw-bold">৳${parseFloat(p.amount || 0).toLocaleString()}</td>
                <td>${p.method || '-'}</td>
                <td class="text-muted small">${p.description || '-'}</td>
            </tr>`;
        }).join('');
    }

    function _calcType(payments, type) {
        return payments
            .filter(p => (p.description || '').includes(`[${type}]`))
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    }

    // Toggle payment history row
    window.toggleHistory = function (rowId) {
        const row = document.getElementById(rowId);
        if (!row) return;
        row.style.display = row.style.display === 'none' ? '' : 'none';
    };

    function openSalaryModal(empId) {
        if (!document.getElementById('salaryModal')) {
            alert('Salary Modal not found! Please check if it is included in index.html.');
            return;
        }

        const gd = window.globalData || {};
        _resetSalaryForm();

        // Populate employee dropdown
        const empSelect = document.getElementById('salEmpSelect');
        if (empSelect) {
            empSelect.innerHTML = '<option value="">-- Select Staff --</option>';
            const activeEmps = (gd.employees || []).filter(e => !e.resigned && e.status !== 'Resigned');
            activeEmps.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id;
                opt.textContent = `${e.name} (${e.role || 'Staff'})`;
                opt.dataset.name = e.name;
                opt.dataset.salary = e.salary || 0;
                empSelect.appendChild(opt);
            });

            // Auto-select if empId provided
            if (empId) {
                empSelect.value = empId;
                _onEmpSelectChange();
            }

            empSelect.onchange = _onEmpSelectChange;
        }

        // Set today's date
        const dateField = document.getElementById('salDate');
        if (dateField) dateField.value = new Date().toISOString().split('T')[0];

        // Init type selector — always start on Due
        if (typeof setSalType === 'function') setSalType('Due');

        bootstrap.Modal.getOrCreateInstance(document.getElementById('salaryModal')).show();
    }

    function _onEmpSelectChange() {
        const empSelect = document.getElementById('salEmpSelect');
        if (!empSelect) return;
        const selectedOpt = empSelect.options[empSelect.selectedIndex];
        if (!selectedOpt || !selectedOpt.value) return;

        const empId   = selectedOpt.value;
        const empName = selectedOpt.dataset.name || '';
        const baseSalary = parseFloat(selectedOpt.dataset.salary) || 0;

        document.getElementById('salEmpId').value   = empId;
        document.getElementById('salEmpName').value = empName;

        // Calculate this employee's due for the selected month
        const gd    = window.globalData || {};
        const month = document.getElementById('salaryMonthFilter')?.value || '';

        const empPayments = (gd.finance || []).filter(f =>
            !f._deleted &&
            f.type === 'Expense' && f.category === 'Salaries' &&
            (f.description || '').includes(month) &&
            (f.person === empName || f.employeeId === empId)
        );
        const paidAmount = empPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const dueAmount  = Math.max(0, baseSalary - paidAmount);

        // Show due amount in badge
        const badge = document.getElementById('salDueAmountBadge');
        if (badge) badge.textContent = `৳${dueAmount.toLocaleString()}`;

        // Show existing advance for this employee
        const advances = (gd.finance || []).filter(f =>
            !f._deleted && f.type === 'Advance' &&
            (f.person === empName || f.employeeId === empId)
        );
        const totalAdv = advances.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const advReturns = (gd.finance || []).filter(f =>
            !f._deleted && f.type === 'Advance Return' &&
            (f.person === empName || f.employeeId === empId)
        ).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        const netAdv = totalAdv - advReturns;

        const advEl = document.getElementById('salExistingAdvance');
        if (advEl) {
            if (netAdv > 0) {
                advEl.textContent = `⚠️ এই কর্মীর বিদ্যমান Advance বকেয়া: ৳${netAdv.toLocaleString()}`;
                advEl.classList.remove('d-none');
            } else {
                advEl.classList.add('d-none');
            }
        }

        // Update amount if currently on Due tab
        const currentType = document.getElementById('salTypeHidden')?.value || 'Due';
        if (currentType === 'Due') {
            const amountEl = document.getElementById('salAmount');
            if (amountEl) amountEl.value = dueAmount > 0 ? dueAmount : '';
        }

        // Update description
        const month2 = document.getElementById('salaryMonthFilter')?.value;
        const desc   = document.getElementById('salDescription');
        if (desc && month2) desc.value = `${currentType} for ${month2}`;
    }

    function _resetSalaryForm() {
        const form = document.getElementById('salaryForm');
        if (form) form.reset();

        // Populate payment methods
        const methodSelect = document.getElementById('salMethod');
        if (methodSelect) {
            methodSelect.innerHTML = '<option value="Cash">💵 Cash</option>';
            const gd = window.globalData || {};
            (gd.bankAccounts || []).forEach(b => {
                const opt = document.createElement('option');
                opt.value = b.name; opt.textContent = `🏦 ${b.name}`;
                methodSelect.appendChild(opt);
            });
            (gd.mobileBanking || []).forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.name; opt.textContent = `📱 ${m.name}`;
                methodSelect.appendChild(opt);
            });
            methodSelect.value = 'Cash';
        }

        // Reset hidden fields
        const empId = document.getElementById('salEmpId');
        const empName = document.getElementById('salEmpName');
        if (empId) empId.value = '';
        if (empName) empName.value = '';
    }

    async function handleSalarySubmit(e) {
        if (e) e.preventDefault();

        const gd      = window.globalData || {};
        const empId   = document.getElementById('salEmpId').value;
        const empName = document.getElementById('salEmpName').value;
        const amount  = parseFloat(document.getElementById('salAmount').value) || 0;
        // Type comes from the 3-button selector (salTypeHidden)
        const type    = document.getElementById('salTypeHidden')?.value || 'Due';
        const method  = document.getElementById('salMethod').value;
        const date    = document.getElementById('salDate').value || new Date().toISOString().split('T')[0];
        const month   = document.getElementById('salaryMonthFilter')?.value || '';
        const desc    = document.getElementById('salDescription').value || `${type} for ${month}`;

        if (!empName || amount <= 0 || !method || !month) {
            alert('Please fill all required fields correctly.');
            return;
        }

        if (!confirm(`Record ${type} of ৳${amount.toLocaleString()} for ${empName}?`)) return;

        if (!gd.finance) gd.finance = [];

        if (type === 'Advance') {
            // ── ADVANCE → Accounts Management tracks this ──
            const advanceEntry = {
                id: 'SAL_ADV_' + Date.now(),
                date, type: 'Advance', category: 'Advance',
                method, amount, person: empName, employeeId: empId,
                description: `${desc} [Advance] (${month})`,
                createdBy: window.currentUser || 'Admin',
                createdAt: new Date().toISOString()
            };
            gd.finance.push(advanceEntry);
            if (typeof window.feApplyEntryToAccount === 'function') {
                window.feApplyEntryToAccount(advanceEntry, 1);
            }
        } else {
            // ── DUE (Salary) / BONUS → Expense > Salaries ──
            const label = type === 'Bonus' ? 'Bonus' : 'Salary';
            const transaction = {
                id: 'SAL_' + Date.now(),
                date, type: 'Expense', category: 'Salaries',
                method, amount, person: empName, employeeId: empId,
                description: `${desc} [${label}] (${month})`,
                createdBy: window.currentUser || 'Admin',
                createdAt: new Date().toISOString()
            };
            gd.finance.push(transaction);
        }

        if (window.markDirty) window.markDirty('finance');
        if (window.saveToStorage) window.saveToStorage();
        if (window.scheduleSyncPush) window.scheduleSyncPush('Salary Payment');

        bootstrap.Modal.getInstance(document.getElementById('salaryModal')).hide();
        loadSalaryHub();

        // Refresh Accounts Management Advance list if visible
        if (typeof window.renderAccMgmtList === 'function') {
            window.renderAccMgmtList('Advance');
        }

        if (typeof window.showSuccessToast === 'function') {
            const msgs = {
                Advance: `🔵 Advance ৳${amount.toLocaleString()} recorded in Accounts!`,
                Bonus:   `🌟 Bonus ৳${amount.toLocaleString()} recorded!`,
                Due:     `✅ Salary ৳${amount.toLocaleString()} paid to ${empName}!`,
            };
            window.showSuccessToast(msgs[type] || '✅ Payment recorded!');
        }
    }

    // Export to Window
    window.initSalaryHub = initSalaryHub;
    window.loadSalaryHub = loadSalaryHub;
    window.openSalaryModal = openSalaryModal;
    window._openSalaryModalImpl = openSalaryModal;
    window.handleSalarySubmit = handleSalarySubmit;

})();

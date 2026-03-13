/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * SALARY HUB — Advanced Payroll Management (V2-Modern)
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
        const employees = gd.employees || [];
        const month = document.getElementById('salaryMonthFilter')?.value || '';

        const tbody = document.getElementById('salaryTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        let totalBudget = 0;
        let totalPaid = 0;
        let totalDue = 0;

        // Fetch salary history for the selected month from finance records
        // We'll calculate it from finance records that have "Salaries" category and description containing the month
        const salaryRecords = (gd.finance || []).filter(f => 
            f.type === 'Expense' && 
            f.category === 'Salaries' && 
            (f.description || '').includes(month)
        );

        employees.forEach(emp => {
            const baseSalary = parseFloat(emp.salary) || 0;
            
            // Calculate what has been paid to this employee this month
            const empPayments = salaryRecords.filter(r => r.person === emp.name || r.employeeId === emp.id);
            const paidAmount = empPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
            
            const dueAmount = Math.max(0, baseSalary - paidAmount);
            
            totalBudget += baseSalary;
            totalPaid += paidAmount;
            totalDue += dueAmount;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-bold">${emp.name}</div>
                    <div class="small text-muted">${emp.phone || '-'}</div>
                </td>
                <td><span class="badge bg-light text-dark border">${emp.role || 'Staff'}</span></td>
                <td>
                    ${dueAmount === 0 ? 
                        '<span class="badge bg-success rounded-pill">Paid</span>' : 
                        (paidAmount > 0 ? '<span class="badge bg-info rounded-pill">Partial</span>' : '<span class="badge bg-warning rounded-pill">Pending</span>')
                    }
                </td>
                <td class="fw-bold">৳${baseSalary.toLocaleString()}</td>
                <td>৳${_calcType(empPayments, 'Bonus').toLocaleString()}</td>
                <td>৳${_calcType(empPayments, 'Advance').toLocaleString()}</td>
                <td class="fw-bold text-success">৳${paidAmount.toLocaleString()}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-primary rounded-pill px-3" onclick="openSalaryModal('${emp.id}')">
                        <i class="bi bi-cash-stack me-1"></i> Pay
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('salaryTotalBudget').textContent = `৳${totalBudget.toLocaleString()}`;
        document.getElementById('salaryPaidTotal').textContent = `৳${totalPaid.toLocaleString()}`;
        document.getElementById('salaryDueTotal').textContent = `৳${totalDue.toLocaleString()}`;
    }

    function _calcType(payments, type) {
        return payments
            .filter(p => (p.description || '').includes(type))
            .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    }

    function openSalaryModal(empId) {
        // Load modal if not exists
        if (!document.getElementById('salaryModal')) {
            alert('Salary Modal not found! Please check if it is included in index.html.');
            return;
        }

        const gd = window.globalData || {};
        const emp = gd.employees.find(e => e.id === empId);
        if (!emp) {
            // If no ID, opening for general (new entry)
            _resetSalaryForm();
            bootstrap.Modal.getOrCreateInstance(document.getElementById('salaryModal')).show();
            return;
        }

        _resetSalaryForm();
        document.getElementById('salEmpId').value = emp.id;
        document.getElementById('salEmpName').value = emp.name;
        document.getElementById('salAmount').value = emp.salary || 0;
        
        const month = document.getElementById('salaryMonthFilter')?.value;
        if (month) {
            document.getElementById('salDescription').value = `Salary for ${month}`;
        }

        bootstrap.Modal.getOrCreateInstance(document.getElementById('salaryModal')).show();
    }

    function _resetSalaryForm() {
        const form = document.getElementById('salaryForm');
        if (form) form.reset();
        
        // Populate methods
        const methodSelect = document.getElementById('salMethod');
        if (methodSelect) {
            methodSelect.innerHTML = '<option value="">-- Method --</option>';
            const methods = (window.globalData && window.globalData.paymentMethods) || ['Cash', 'Bkash', 'Nagad', 'Bank'];
            methods.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m; opt.text = m;
                methodSelect.appendChild(opt);
            });
            methodSelect.value = 'Cash';
        }
    }

    async function handleSalarySubmit(e) {
        if (e) e.preventDefault();
        
        const gd = window.globalData || {};
        const empId = document.getElementById('salEmpId').value;
        const empName = document.getElementById('salEmpName').value;
        const amount = parseFloat(document.getElementById('salAmount').value) || 0;
        const type = document.getElementById('salType').value; // Salary, Bonus, Advance
        const method = document.getElementById('salMethod').value;
        const date = document.getElementById('salDate').value || new Date().toISOString().split('T')[0];
        const month = document.getElementById('salaryMonthFilter')?.value || '';
        const desc = document.getElementById('salDescription').value || `${type} for ${month}`;

        if (!empName || amount <= 0 || !method || !month) {
            alert('Please fill all required fields correctly.');
            return;
        }

        if (confirm(`Record ${type} payment of ৳${amount.toLocaleString()} for ${empName}?`)) {
            const transaction = {
                id: 'SAL_' + Date.now(),
                date: date,
                type: 'Expense',
                category: 'Salaries',
                method: method,
                amount: amount,
                person: empName,
                description: `${desc} [${type}] (${month})`,
                employeeId: empId
            };

            if (!gd.finance) gd.finance = [];
            gd.finance.push(transaction);

            if (window.markDirty) window.markDirty('finance');
            if (window.saveToStorage) window.saveToStorage();
            if (window.scheduleSyncPush) window.scheduleSyncPush('Salary Payment');

            bootstrap.Modal.getInstance(document.getElementById('salaryModal')).hide();
            loadSalaryHub();
            
            if (typeof window.showSuccessToast === 'function') {
                window.showSuccessToast(`✅ ${type} payment recorded successfully!`);
            }
        }
    }

    // Export to Window
    window.initSalaryHub = initSalaryHub;
    window.loadSalaryHub = loadSalaryHub;
    window.openSalaryModal = openSalaryModal;
    window._openSalaryModalImpl = openSalaryModal;
    window.handleSalarySubmit = handleSalarySubmit;

})();

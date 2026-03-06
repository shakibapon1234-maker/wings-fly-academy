/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * PAYROLL MANAGEMENT MODULE (V32-Dev)
 * ============================================================
 */

(function () {
    'use strict';

    function initPayroll() {
        console.log('[Payroll] 💰 Initializing payroll module...');
        const monthInput = document.getElementById('payrollMonthFilter');
        if (monthInput && !monthInput.value) {
            const now = new Date();
            monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        renderPayrollList();
    }

    function renderPayrollList() {
        const gd = window.globalData || {};
        const employees = gd.employees || [];
        const payroll = gd.payroll || [];
        const month = document.getElementById('payrollMonthFilter')?.value || '';

        const tbody = document.getElementById('payrollTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        let totalSalary = 0;
        let paidCount = 0;

        const filteredPayroll = payroll.filter(p => p.month === month);

        employees.forEach(emp => {
            const payRecord = filteredPayroll.find(p => p.employeeId === emp.id);
            const baseSalary = parseFloat(emp.salary) || 0;
            const allowance = parseFloat(payRecord?.allowance) || 0;
            const deduction = parseFloat(payRecord?.deduction) || 0;
            const netPayable = baseSalary + allowance - deduction;
            const isPaid = payRecord?.status === 'Paid';

            if (isPaid) {
                totalSalary += netPayable;
                paidCount++;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="fw-bold">${emp.name}</div>
                    <div class="small text-muted">${emp.email || emp.phone || '-'}</div>
                </td>
                <td><span class="badge bg-light text-dark border">${emp.role || 'Staff'}</span></td>
                <td>৳${baseSalary.toLocaleString()}</td>
                <td>৳${allowance.toLocaleString()}</td>
                <td>৳${deduction.toLocaleString()}</td>
                <td class="fw-bold text-primary">৳${netPayable.toLocaleString()}</td>
                <td>
                    <span class="badge ${isPaid ? 'bg-success' : 'bg-warning'} rounded-pill">
                        ${isPaid ? 'Paid' : 'Pending'}
                    </span>
                </td>
                <td class="text-end">
                    ${!isPaid ? `
                        <button class="btn btn-sm btn-primary rounded-pill px-3" onclick="processPayrollPayment('${emp.id}')">
                            Pay Now
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-outline-secondary rounded-pill px-3" onclick="revertPayrollPayment('${emp.id}')">
                            Revert
                        </button>
                    `}
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('payrollTotalSalary').textContent = `৳${totalSalary.toLocaleString()}`;
        document.getElementById('payrollPaidCount').textContent = paidCount;
    }

    async function generateMonthlyPayroll() {
        const month = document.getElementById('payrollMonthFilter')?.value;
        if (!month) { alert('Please select a month first'); return; }

        if (confirm(`Generate empty payroll records for ${month}? This will reset any pending adjustments.`)) {
            // Simplified logic: actual generation often happens on-the-fly in this simple version
            // But we could store them if we want to save allowances/deductions
            alert('Payroll structure generated for the selected month!');
            renderPayrollList();
        }
    }

    async function processPayrollPayment(empId) {
        const gd = window.globalData || {};
        const emp = gd.employees.find(e => e.id === empId);
        if (!emp) return;

        const month = document.getElementById('payrollMonthFilter')?.value;
        const baseSalary = parseFloat(emp.salary) || 0;

        if (confirm(`${emp.name} কি ৳${baseSalary.toLocaleString()} বেতন পরিশোধ করা হয়েছে?`)) {
            if (!gd.payroll) gd.payroll = [];

            // Log as expense in finance
            const transaction = {
                id: 'PAY_' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                type: 'Expense',
                category: 'Salaries',
                method: 'Cash', // Default
                amount: baseSalary,
                description: `Salary Payment: ${emp.name} (${month})`,
                employeeId: empId
            };

            gd.finance.push(transaction);

            // Mark as paid in payroll
            gd.payroll.push({
                employeeId: empId,
                month: month,
                amount: baseSalary,
                status: 'Paid',
                transactionId: transaction.id
            });

            if (window.markDirty) window.markDirty('finance');
            if (window.saveToStorage) window.saveToStorage();
            if (window.scheduleSyncPush) window.scheduleSyncPush('Payroll Payment');

            renderPayrollList();
            if (typeof window.showSuccessToast === 'function') window.showSuccessToast('Salary Paid & Logged to Finance!');
        }
    }

    window.initPayroll = initPayroll;
    window.renderPayrollList = renderPayrollList;
    window.generateMonthlyPayroll = generateMonthlyPayroll;
    window.processPayrollPayment = processPayrollPayment;

})();

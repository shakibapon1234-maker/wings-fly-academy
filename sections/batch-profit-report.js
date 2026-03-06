/**
 * Batch-wise Profit & Loss Report System
 * Logic for calculating income from students in a specific batch
 * and expenses within a custom date range.
 */

function populateBatchReportDropdowns() {
    const batchSelect = document.getElementById('repBatchSelect');
    if (!batchSelect) return;

    const students = window.globalData.students || [];
    const batches = [...new Set(students.map(s => s.batch).filter(b => b))];

    // Also check courses for batch names if students don't have them yet
    const courses = window.globalData.courses || [];
    courses.forEach(c => {
        if (!batches.includes(c)) batches.push(c);
    });

    // Clear and refill
    batchSelect.innerHTML = '<option value="">Choose Batch...</option>';
    batches.sort().forEach(batch => {
        const opt = document.createElement('option');
        opt.value = batch;
        opt.textContent = batch;
        batchSelect.appendChild(opt);
    });

    // Set default dates to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    document.getElementById('repStartDate').value = firstDay;
    document.getElementById('repEndDate').value = lastDay;
}

function generateBatchProfitReport() {
    const batch = document.getElementById('repBatchSelect').value;
    const startDate = document.getElementById('repStartDate').value;
    const endDate = document.getElementById('repEndDate').value;
    const manualAdj = parseFloat(document.getElementById('repPrevManual').value) || 0;

    if (!batch) {
        if (typeof showErrorToast === 'function') showErrorToast('Please select a batch');
        else alert('Please select a batch');
        return;
    }

    if (!startDate || !endDate) {
        if (typeof showErrorToast === 'function') showErrorToast('Please select date range');
        else alert('Please select date range');
        return;
    }

    // 1. Calculate Batch Income (All time collection for students in this batch)
    const students = window.globalData.students || [];
    const batchStudents = students.filter(s => s.batch === batch);
    const totalBatchIncome = batchStudents.reduce((sum, s) => sum + (parseFloat(s.paid) || 0), 0);

    // 2. Calculate Expenses in Date Range
    const finance = window.globalData.finance || [];
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);

    let periodExpense = 0;
    let expenseCount = 0;

    finance.forEach(f => {
        if (f.type === 'Expense') {
            const fDate = new Date(f.date);
            if (fDate >= startObj && fDate <= endObj) {
                periodExpense += (parseFloat(f.amount) || 0);
                expenseCount++;
            }
        }
    });

    // 3. Final Calculation
    const netResult = (totalBatchIncome + manualAdj) - periodExpense;

    // Update UI
    document.getElementById('batchReportEmpty').classList.add('d-none');
    document.getElementById('batchReportResult').classList.remove('d-none');

    // Cards
    document.getElementById('repResBatchIncome').textContent = '৳' + totalBatchIncome.toLocaleString();
    document.getElementById('repResStudentCount').textContent = batchStudents.length + ' Students Found';

    document.getElementById('repResExpense').textContent = '৳' + periodExpense.toLocaleString();
    document.getElementById('repResExpenseItems').textContent = expenseCount + ' Expense Entries';

    const profitEl = document.getElementById('repResProfit');
    const profitCard = document.getElementById('repResProfitCard');
    const profitStatus = document.getElementById('repResProfitStatus');

    profitEl.textContent = '৳' + Math.abs(netResult).toLocaleString();

    if (netResult >= 0) {
        profitCard.style.background = 'rgba(0, 255, 136, 0.04)';
        profitCard.style.borderColor = 'rgba(0, 255, 136, 0.2)';
        profitEl.className = 'fw-bold text-success mb-0';
        profitStatus.textContent = 'Net Profit';
    } else {
        profitCard.style.background = 'rgba(255, 68, 102, 0.1)';
        profitCard.style.borderColor = 'rgba(255, 68, 102, 0.3)';
        profitEl.className = 'fw-bold text-danger mb-0';
        profitStatus.textContent = 'Net Loss';
    }

    // Summary Table
    document.getElementById('repSumBatch').textContent = batch;
    document.getElementById('repSumPeriod').textContent = startDate + ' to ' + endDate;
    document.getElementById('repSumIncome').textContent = '৳' + totalBatchIncome.toLocaleString();
    document.getElementById('repSumExpense').textContent = '৳' + periodExpense.toLocaleString();
    document.getElementById('repSumManual').textContent = '৳' + manualAdj.toLocaleString();

    const sumNet = document.getElementById('repSumNet');
    sumNet.textContent = '৳' + netResult.toLocaleString();
    sumNet.className = 'text-end h6 fw-bold fs-5 ' + (netResult >= 0 ? 'text-success' : 'text-danger');

    if (typeof showSuccessToast === 'function') showSuccessToast('Report Generated Successfully!');

    if (typeof logActivity === 'function') {
        logActivity('report', 'GENERATE', `Generated Profit Report for Batch: ${batch}`);
    }
}

function printBatchProfitReport() {
    const content = document.getElementById('batchReportResult').innerHTML;
    const printWindow = window.open('', '_blank');

    const academyName = (window.globalData.settings && window.globalData.settings.academyName) || 'Wings Fly Academy';

    printWindow.document.write(`
        <html>
            <head>
                <title>Batch Profit Report - ${academyName}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { background: white !important; color: black !important; padding: 40px; }
                    .text-success { color: #198754 !important; }
                    .text-danger { color: #dc3545 !important; }
                    .border { border: 1px solid #dee2e6 !important; }
                    .table-dark { background: white !important; color: black !important; border: 1px solid #dee2e6; }
                    .table-dark td { border-bottom: 1px solid #eee; }
                    .btn, .opacity-25, #batchReportEmpty, .btn-outline-info { display: none !important; }
                    .premium-input-modern { border: none; }
                </style>
            </head>
            <body>
                <div class="text-center mb-5">
                    <h2 class="fw-bold">${academyName}</h2>
                    <h4 class="text-muted">Batch Wise Profit & Loss Statement</h4>
                    <hr>
                </div>
                <div>${content}</div>
                <div class="mt-5 text-center small text-muted">
                    Report Generated on: ${new Date().toLocaleString()}
                </div>
            </body>
        </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// Global exposure
window.populateBatchReportDropdowns = populateBatchReportDropdowns;
window.generateBatchProfitReport = generateBatchProfitReport;
window.printBatchProfitReport = printBatchProfitReport;

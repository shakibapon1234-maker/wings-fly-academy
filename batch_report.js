
// ===================================
// STUDENT PDF EXPORT & BATCH REPORT
// ===================================



function openBatchReport() {
    const modal = new bootstrap.Modal(document.getElementById('batchReportModal'));
    modal.show();

    const startEl = document.getElementById('batchStartDate');
    const endEl = document.getElementById('batchEndDate');

    if (startEl) startEl.value = '';
    if (endEl) endEl.value = '';

    setTimeout(renderBatchReport, 200);
}

function renderBatchReport() {
    const tbody = document.getElementById('batchReportBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const startEl = document.getElementById('batchStartDate');
    const endEl = document.getElementById('batchEndDate');
    const startDate = startEl ? startEl.value : '';
    const endDate = endEl ? endEl.value : '';
    const searchQuery = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase().trim() : '';
    const batchQuery = document.getElementById('batchSearchInput') ? document.getElementById('batchSearchInput').value.toLowerCase().trim() : '';

    let totalExpense = 0;
    let totalIncome = 0;

    (globalData.finance || []).forEach(f => {
        const fDate = f.date;
        const matchDate = (!startDate || fDate >= startDate) && (!endDate || fDate <= endDate);
        if (matchDate) {
            const amt = parseFloat(f.amount) || 0;
            if (f.type === 'Expense' || f.type === 'Loan Given') {
                totalExpense += amt;
            } else if (f.type === 'Income' || f.type === 'Loan Received') {
                totalIncome += amt;
            }
        }
    });

    const batches = {};
    globalData.students.forEach(s => {
        let matchSearch = true;
        if (searchQuery) {
            matchSearch = (
                (s.name && s.name.toLowerCase().includes(searchQuery)) ||
                (s.batch && s.batch.toString().toLowerCase() === searchQuery) ||
                (s.batch && s.batch.toString().toLowerCase().includes(searchQuery) && searchQuery.length > 1) ||
                (s.course && s.course.toLowerCase().includes(searchQuery)) ||
                (s.phone && searchQuery.length > 3 && s.phone.includes(searchQuery))
            );
        }
        const bName = s.batch || 'Unknown Batch';
        const matchBatchFilter = !batchQuery || bName.toString().toLowerCase().includes(batchQuery);
        if (!matchSearch || !matchBatchFilter) return;
        if (!batches[bName]) {
            batches[bName] = { name: bName, count: 0, total: 0, paid: 0, due: 0 };
        }
        batches[bName].count++;
        batches[bName].total += (parseFloat(s.totalPayment) || 0);
        batches[bName].paid += (parseFloat(s.paid) || 0);
        batches[bName].due += (parseFloat(s.due) || 0);
    });

    const reportData = Object.values(batches).sort((a, b) => a.name.localeCompare(b.name));
    reportData.forEach(b => {
        const rate = b.total > 0 ? Math.round((b.paid / b.total) * 100) : 0;
        let rateColor = 'text-danger';
        if (rate > 50) rateColor = 'text-warning';
        if (rate > 80) rateColor = 'text-success';
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold">${b.name}</td>
                <td>${b.count}</td>
                <td class="text-end">\u09F3${formatNumber(b.total)}</td>
                <td class="text-end text-success fw-bold">\u09F3${formatNumber(b.paid)}</td>
                <td class="text-end text-danger fw-bold">\u09F3${formatNumber(b.due)}</td>
                <td class="text-end ${rateColor} fw-bold">${rate}%</td>
            </tr>`;
    });

    tbody.innerHTML += `<tr><td colspan="6" class="bg-light p-1"></td></tr>`;

    const netProfit = totalIncome - totalExpense;
    const profitClass = netProfit >= 0 ? 'text-success' : 'text-danger';

    tbody.innerHTML += `
        <tr class="table-group-divider border-3">
            <td colspan="6" class="fw-bold bg-light text-center text-uppercase p-2">
                Financial Summary (Selected Period: ${startDate || 'All'} to ${endDate || 'Now'})
            </td>
        </tr>
        <tr>
            <td colspan="3" class="text-end fw-semibold text-muted">Total Income (From All Sources)</td>
            <td class="text-end fw-bold fs-6 text-success">\u09F3${formatNumber(totalIncome)}</td>
            <td colspan="2"></td>
        </tr>
        <tr>
            <td colspan="3" class="text-end fw-semibold text-muted text-danger">Less: Total Expenses</td>
            <td class="text-end fw-bold fs-6 text-danger">- \u09F3${formatNumber(totalExpense)}</td>
            <td colspan="2"></td>
        </tr>
        <tr class="table-active border-top border-bottom border-2">
            <td colspan="3" class="text-end fw-extra-bold text-uppercase fs-5">NET PROFIT / LOSS</td>
            <td class="text-end fw-black fs-4 ${profitClass}">\u09F3${formatNumber(netProfit)}</td>
            <td colspan="2"></td>
        </tr>
    `;

    const footer = document.querySelector('#batchReportModal tfoot');
    if (footer) footer.style.display = 'none';
}

function printBatchReport() {
    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    const startEl = document.getElementById('batchStartDate');
    const endEl = document.getElementById('batchEndDate');
    const startDate = startEl ? startEl.value : '';
    const endDate = endEl ? endEl.value : '';
    const searchQuery = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase().trim() : '';
    const batchQuery = document.getElementById('batchSearchInput') ? document.getElementById('batchSearchInput').value.toLowerCase().trim() : '';

    let totalExpense = 0;
    let totalIncome = 0;

    (globalData.finance || []).forEach(f => {
        const fDate = f.date;
        const matchDate = (!startDate || fDate >= startDate) && (!endDate || fDate <= endDate);
        if (matchDate) {
            const amt = parseFloat(f.amount) || 0;
            if (f.type === 'Expense' || f.type === 'Loan Given') totalExpense += amt;
            else if (f.type === 'Income' || f.type === 'Loan Received') totalIncome += amt;
        }
    });

    const batches = {};
    globalData.students.forEach(s => {
        let matchSearch = true;
        if (searchQuery) {
            matchSearch = (
                (s.name && s.name.toLowerCase().includes(searchQuery)) ||
                (s.batch && s.batch.toString().toLowerCase() === searchQuery) ||
                (s.batch && s.batch.toString().toLowerCase().includes(searchQuery) && searchQuery.length > 1) ||
                (s.course && s.course.toLowerCase().includes(searchQuery)) ||
                (s.phone && searchQuery.length > 3 && s.phone.includes(searchQuery))
            );
        }
        const bName = s.batch || 'Unknown Batch';
        const matchBatchFilter = !batchQuery || bName.toString().toLowerCase().includes(batchQuery);
        if (!matchSearch || !matchBatchFilter) return;
        if (!batches[bName]) batches[bName] = { name: bName, count: 0, total: 0, paid: 0, due: 0 };
        batches[bName].count++;
        batches[bName].total += (parseFloat(s.totalPayment) || 0);
        batches[bName].paid += (parseFloat(s.paid) || 0);
        batches[bName].due += (parseFloat(s.due) || 0);
    });

    const reportData = Object.values(batches).sort((a, b) => a.name.localeCompare(b.name));
    const netProfit = totalIncome - totalExpense;

    let html = `
        <div style="width: 100%; background: white; padding: 20px;">
            ${getPrintHeader('BATCH-WISE PROFIT & LOSS REPORT')}
            
            <div class="report-info">
                <div style="width: 100%;">
                    <p><strong>Period:</strong> ${startDate || 'All Time'} to ${endDate || 'Present'}</p>
                    <p><strong>Search Filter:</strong> ${searchQuery || 'None'}</p>
                </div>
            </div>

            <table class="report-table">
                <thead>
                    <tr>
                        <th>Batch Name</th>
                        <th>Students</th>
                        <th style="text-align: right;">Total Receivable</th>
                        <th style="text-align: right;">Collected</th>
                        <th style="text-align: right;">Due</th>
                        <th style="text-align: right;">Rate</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.map(b => {
        const rate = b.total > 0 ? Math.round((b.paid / b.total) * 100) : 0;
        return `
                            <tr>
                                <td>${b.name}</td>
                                <td>${b.count}</td>
                                <td style="text-align: right;">৳${formatNumber(b.total)}</td>
                                <td style="text-align: right; color: green;">৳${formatNumber(b.paid)}</td>
                                <td style="text-align: right; color: red;">৳${formatNumber(b.due)}</td>
                                <td style="text-align: right;">${rate}%</td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>

            <div style="margin-top: 30px; border: 2px solid #000; padding: 15px; border-radius: 8px; width: 100%;">
                <h4 style="margin: 0 0 10px 0; text-decoration: underline;">FINANCIAL SUMMARY</h4>
                <div style="display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 5px; width: 100%;">
                    <span>Total Income:</span>
                    <span style="color: green; font-weight: bold;">৳${formatNumber(totalIncome)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 10px; width: 100%;">
                    <span>Total Expenses:</span>
                    <span style="color: red; font-weight: bold;">- ৳${formatNumber(totalExpense)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 800; border-top: 2px solid #000; padding-top: 5px; width: 100%;">
                    <span>NET PROFIT / LOSS:</span>
                    <span style="${netProfit >= 0 ? 'color: green;' : 'color: red;'}">৳${formatNumber(netProfit)}</span>
                </div>
            </div>

            ${getPrintFooter()}
        </div>
    `;

    printArea.innerHTML = html;
    setTimeout(() => { window.print(); }, 500);
}

// ===================================
// EXCEL / CSV EXPORT HELPERS
// ===================================

function exportStudentListExcel() {
    const searchQuery = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase().trim() : '';
    let students = [...globalData.students].sort((a, b) => b.id - a.id);

    if (searchQuery) {
        students = students.filter(s => {
            const dateStr = (s.enrollDate || s.date || '').toLowerCase();
            const name = (s.name || '').toLowerCase();
            const phone = (s.phone || '').toLowerCase();
            const course = (s.course || '').toLowerCase();
            const batch = (s.batch || '').toString().toLowerCase();
            return dateStr.includes(searchQuery) || name.includes(searchQuery) || phone.includes(searchQuery) || course.includes(searchQuery) || batch.includes(searchQuery);
        });
    }

    if (students.length === 0) { alert('No students to export!'); return; }

    let csv = '\uFEFFDate,Name,Phone,Course,Batch,Total Payable,Paid,Due,Status\n';
    students.forEach(s => {
        const total = parseFloat(s.totalPayment) || 0;
        const paid = parseFloat(s.paid) || 0;
        const due = parseFloat(s.due) || 0;
        const status = due <= 0 ? 'Paid' : (paid > 0 ? 'Partial' : 'Unpaid');
        const name = (s.name || '').replace(/"/g, '""');
        const course = (s.course || '').replace(/"/g, '""');
        const rowDate = s.enrollDate || s.date || '';
        csv += `"${rowDate}","${name}","${s.phone || ''}","${course}","${s.batch || ''}",${total},${paid},${due},${status}\n`;
    });

    downloadCSV(csv, `Student_List_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportBatchReportExcel() {
    const startEl = document.getElementById('batchStartDate');
    const endEl = document.getElementById('batchEndDate');
    const startDate = startEl ? startEl.value : '';
    const endDate = endEl ? endEl.value : '';
    const searchQuery = document.getElementById('searchInput') ? document.getElementById('searchInput').value.toLowerCase().trim() : '';

    let totalExpense = 0;
    let totalIncome = 0;
    (globalData.finance || []).forEach(f => {
        const fDate = f.date;
        const matchDate = (!startDate || fDate >= startDate) && (!endDate || fDate <= endDate);
        if (matchDate) {
            const amt = parseFloat(f.amount) || 0;
            if (f.type === 'Expense' || f.type === 'Loan Given') totalExpense += amt;
            else if (f.type === 'Income' || f.type === 'Loan Received') totalIncome += amt;
        }
    });

    const batches = {};
    globalData.students.forEach(s => {
        let matchSearch = true;
        if (searchQuery) {
            matchSearch = (
                (s.name && s.name.toLowerCase().includes(searchQuery)) ||
                (s.batch && s.batch.toString().toLowerCase() === searchQuery) ||
                (s.batch && s.batch.toString().toLowerCase().includes(searchQuery) && searchQuery.length > 1) ||
                (s.course && s.course.toLowerCase().includes(searchQuery)) ||
                (s.phone && searchQuery.length > 3 && s.phone.includes(searchQuery))
            );
        }
        if (!matchSearch) return;

        const bName = s.batch || 'Unknown Batch';
        if (!batches[bName]) batches[bName] = { name: bName, count: 0, total: 0, paid: 0, due: 0 };
        batches[bName].count++;
        batches[bName].total += (parseFloat(s.totalPayment) || 0);
        batches[bName].paid += (parseFloat(s.paid) || 0);
        batches[bName].due += (parseFloat(s.due) || 0);
    });

    const reportData = Object.values(batches).sort((a, b) => a.name.localeCompare(b.name));
    if (reportData.length === 0) { alert('No batch data to export!'); return; }

    let csv = `Batch Wise Profit/Loss Report (Generated: ${new Date().toLocaleString()})\n`;
    csv += `Period: ${startDate || 'All Time'} to ${endDate || 'Now'}\n\n`;
    csv += 'Batch Name,Student Count,Total Receivable,Collected (Income),Due (Pending),Collection Rate %\n';
    reportData.forEach(b => {
        const rate = b.total > 0 ? Math.round((b.paid / b.total) * 100) : 0;
        csv += `"${b.name}",${b.count},${b.total},${b.paid},${b.due},${rate}%\n`;
    });
    csv += `\nFINANCIAL SUMMARY (GLOBAL)\n`;
    csv += `Total Income,${totalIncome}\n`;
    csv += `Total Expenses,${totalExpense}\n`;
    csv += `NET PROFIT / LOSS,${totalIncome - totalExpense}\n`;

    downloadCSV(csv, `Batch_Report_${new Date().toISOString().split('T')[0]}.csv`);
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.openBatchReport = openBatchReport;
window.printBatchReport = printBatchReport;
window.exportStudentListExcel = exportStudentListExcel;
window.exportBatchReportExcel = exportBatchReportExcel;

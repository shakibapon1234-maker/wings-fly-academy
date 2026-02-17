// ============================================================
// WINGS FLY — STUDENT PRINT LAYOUT FIX
// Column widths balanced: Date, Name, Course, Batch, Total, Paid, Due
// ============================================================

(function () {

  // Original printReport কে override করছি
  window.printReport = function (type) {
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

    let startDate = '';
    let endDate   = '';
    let title     = '';
    let tableContent = '';

    if (type === 'students') {
      title     = 'STUDENT ENROLLMENT LIST';
      startDate = document.getElementById('mainStartDate')?.value || '';
      endDate   = document.getElementById('mainEndDate')?.value   || '';

      const students = (window.globalData?.students || []).filter(s => {
        const matchSearch = !q || (
          (s.name   && s.name.toLowerCase().includes(q)) ||
          (s.batch  && s.batch.toString().toLowerCase().includes(q)) ||
          (s.course && s.course.toLowerCase().includes(q)) ||
          (s.phone  && q.length > 3 && s.phone.includes(q))
        );
        const matchDate = (!startDate || s.enrollDate >= startDate) &&
                          (!endDate   || s.enrollDate <= endDate);
        return matchSearch && matchDate;
      }).sort((a, b) => b.rowIndex - a.rowIndex);

      const fmt = window.formatNumber || (n => Number(n).toLocaleString('en-IN'));

      tableContent = `
        <table class="report-table" style="
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 12px;
        ">
          <colgroup>
            <col style="width: 9%;">   <!-- Date -->
            <col style="width: 18%;">  <!-- Name -->
            <col style="width: 28%;">  <!-- Course — বেশি জায়গা -->
            <col style="width: 11%;">  <!-- Batch -->
            <col style="width: 11%;">  <!-- Total -->
            <col style="width: 11%;">  <!-- Paid -->
            <col style="width: 12%;">  <!-- Due -->
          </colgroup>
          <thead>
            <tr style="background:#1a3a5c;">
              <th style="text-align:left; padding:8px 6px; color:#fff; font-size:11px; font-weight:700; word-wrap:break-word;">Date</th>
              <th style="text-align:left; padding:8px 6px; color:#fff; font-size:11px; font-weight:700; word-wrap:break-word;">Name</th>
              <th style="text-align:left; padding:8px 6px; color:#fff; font-size:11px; font-weight:700; word-wrap:break-word;">Course</th>
              <th style="text-align:left; padding:8px 6px; color:#fff; font-size:11px; font-weight:700; word-wrap:break-word;">Batch</th>
              <th style="text-align:right; padding:8px 6px; color:#fff; font-size:11px; font-weight:700;">Total</th>
              <th style="text-align:right; padding:8px 6px; color:#fff; font-size:11px; font-weight:700;">Paid</th>
              <th style="text-align:right; padding:8px 6px; color:#fff; font-size:11px; font-weight:700;">Due</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((s, i) => `
              <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f7f9fc'};">
                <td style="padding:7px 6px; border:1px solid #dde; font-size:11px; word-wrap:break-word; color:#444;">${s.enrollDate || '—'}</td>
                <td style="padding:7px 6px; border:1px solid #dde; font-size:12px; font-weight:600; word-wrap:break-word; color:#111;">${s.name || '—'}</td>
                <td style="padding:7px 6px; border:1px solid #dde; font-size:11px; word-wrap:break-word; color:#333;">${s.course || '—'}</td>
                <td style="padding:7px 6px; border:1px solid #dde; font-size:11px; word-wrap:break-word; color:#2c7da0; font-weight:600;">${s.batch || '—'}</td>
                <td style="padding:7px 6px; border:1px solid #dde; text-align:right; font-size:12px; font-weight:600; color:#1a3a5c;">৳${fmt(s.totalPayment || 0)}</td>
                <td style="padding:7px 6px; border:1px solid #dde; text-align:right; font-size:12px; font-weight:600; color:#007744;">৳${fmt(s.paid || 0)}</td>
                <td style="padding:7px 6px; border:1px solid #dde; text-align:right; font-size:12px; font-weight:700; color:${(s.due || 0) > 0 ? '#c0001a' : '#007744'};">৳${fmt(s.due || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background:#e8f0f8;">
              <td colspan="4" style="padding:9px 6px; border:1px solid #bcd; text-align:right; font-weight:800; font-size:12px; color:#1a3a5c;">TOTAL →</td>
              <td style="padding:9px 6px; border:1px solid #bcd; text-align:right; font-weight:800; font-size:13px; color:#1a3a5c;">৳${fmt(students.reduce((a, s) => a + (parseFloat(s.totalPayment) || 0), 0))}</td>
              <td style="padding:9px 6px; border:1px solid #bcd; text-align:right; font-weight:800; font-size:13px; color:#007744;">৳${fmt(students.reduce((a, s) => a + (parseFloat(s.paid) || 0), 0))}</td>
              <td style="padding:9px 6px; border:1px solid #bcd; text-align:right; font-weight:800; font-size:13px; color:#c0001a;">৳${fmt(students.reduce((a, s) => a + (parseFloat(s.due) || 0), 0))}</td>
            </tr>
          </tfoot>
        </table>
        <div style="margin-top:10px; font-size:11px; color:#888; text-align:right;">
          Total Students: <strong>${students.length}</strong>
        </div>
      `;

    } else if (type === 'ledger') {
      // Ledger print — original logic রেখেছি, শুধু student এর জন্য fix
      const q2 = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
      const lType     = document.getElementById('ledgerTypeFilter')?.value     || '';
      const lCategory = document.getElementById('ledgerCategoryFilter')?.value || '';
      const lMethod   = document.getElementById('ledgerMethodFilter')?.value   || '';
      const ls        = document.getElementById('ledgerStartDate')?.value      || '';
      const le        = document.getElementById('ledgerEndDate')?.value        || '';
      const fmt       = window.formatNumber || (n => Number(n).toLocaleString('en-IN'));

      const ledger = (window.globalData?.finance || []).filter(f => {
        const ms = !q2 || (f.category||'').toLowerCase().includes(q2) || (f.description||'').toLowerCase().includes(q2);
        const md = (!ls || f.date >= ls) && (!le || f.date <= le);
        const mt = !lType     || f.type     === lType;
        const mc = !lCategory || f.category === lCategory;
        const mm = !lMethod   || f.method   === lMethod;
        return ms && md && mt && mc && mm;
      }).reverse();

      title = 'FINANCIAL LEDGER REPORT';
      const totalIncome  = ledger.filter(f => f.type === 'Income').reduce((a, f) => a + (parseFloat(f.amount)||0), 0);
      const totalExpense = ledger.filter(f => f.type !== 'Income').reduce((a, f) => a + (parseFloat(f.amount)||0), 0);

      tableContent = `
        <table class="report-table" style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;">
          <colgroup>
            <col style="width:9%;">
            <col style="width:10%;">
            <col style="width:16%;">
            <col style="width:32%;">
            <col style="width:15%;">
            <col style="width:18%;">
          </colgroup>
          <thead>
            <tr style="background:#1a3a5c;">
              <th style="padding:8px 6px;color:#fff;font-size:11px;text-align:left;">Date</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;text-align:left;">Type</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;text-align:left;">Category</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;text-align:left;">Description</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;text-align:left;">Method</th>
              <th style="padding:8px 6px;color:#fff;font-size:11px;text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${ledger.map((f, i) => `
              <tr style="background:${i%2===0?'#fff':'#f7f9fc'};">
                <td style="padding:6px;border:1px solid #dde;font-size:11px;word-wrap:break-word;">${f.date||'—'}</td>
                <td style="padding:6px;border:1px solid #dde;font-size:11px;color:${f.type==='Income'?'#007744':'#c0001a'};font-weight:600;">${f.type}</td>
                <td style="padding:6px;border:1px solid #dde;font-size:11px;word-wrap:break-word;">${f.category||'—'}</td>
                <td style="padding:6px;border:1px solid #dde;font-size:11px;word-wrap:break-word;">${f.description||f.note||'—'}</td>
                <td style="padding:6px;border:1px solid #dde;font-size:11px;">${f.method||'—'}</td>
                <td style="padding:6px;border:1px solid #dde;text-align:right;font-weight:600;color:${f.type==='Income'?'#007744':'#c0001a'};">৳${fmt(f.amount||0)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background:#e8f0f8;">
              <td colspan="5" style="padding:8px 6px;border:1px solid #bcd;text-align:right;font-weight:800;font-size:12px;">Income: <span style="color:#007744;">৳${fmt(totalIncome)}</span> &nbsp;|&nbsp; Expense: <span style="color:#c0001a;">৳${fmt(totalExpense)}</span> &nbsp;|&nbsp; Net:</td>
              <td style="padding:8px 6px;border:1px solid #bcd;text-align:right;font-weight:800;font-size:13px;color:${totalIncome-totalExpense>=0?'#007744':'#c0001a'};">৳${fmt(totalIncome - totalExpense)}</td>
            </tr>
          </tfoot>
        </table>`;
    }

    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    printArea.innerHTML = `
      <div style="width:100%; background:white; padding:20px; font-family:'Segoe UI',sans-serif;">
        ${(window.getPrintHeader || (() => ''))(title)}
        ${tableContent}
        ${(window.getPrintFooter || (() => ''))()}
      </div>
    `;

    document.body.classList.add('printing-receipt');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('printing-receipt'), 1000);
    }, 500);
  };

  console.log('✅ Print Fix loaded — balanced column widths');
})();

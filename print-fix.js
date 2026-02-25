// ============================================================
// WINGS FLY — PRINT FIX v2
// ✅ Fix 1: Total Balance card print এ আসবে না
// ✅ Fix 2: TOTAL row এর নিচে নীল line যাবে না
// ✅ Fix 3: কলামগুলো সঠিকভাবে আলাদা দেখাবে
// ============================================================

(function () {

  window.printReport = function (type) {
    const q = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    let title = '';
    let tableContent = '';

    // ─────────────────────────────────────────────
    // STUDENT PRINT
    // ─────────────────────────────────────────────
    if (type === 'students') {
      title = 'STUDENT ENROLLMENT LIST';
      const startDate = document.getElementById('mainStartDate')?.value || '';
      const endDate   = document.getElementById('mainEndDate')?.value   || '';

      const students = (window.globalData?.students || []).filter(s => {
        const ms = !q || (s.name||'').toLowerCase().includes(q) ||
                   (s.batch||'').toString().toLowerCase().includes(q) ||
                   (s.course||'').toLowerCase().includes(q) ||
                   (q.length > 3 && (s.phone||'').includes(q));
        const md = (!startDate || (s.enrollDate||'') >= startDate) &&
                   (!endDate   || (s.enrollDate||'') <= endDate);
        return ms && md;
      }).sort((a, b) => (b.rowIndex||0) - (a.rowIndex||0));

      const fmt = window.formatNumber || (n => Number(n).toLocaleString('en-IN'));
      const grandTotal = students.reduce((a, s) => a + (parseFloat(s.totalPayment)||0), 0);
      const grandPaid  = students.reduce((a, s) => a + (parseFloat(s.paid)||0), 0);
      const grandDue   = students.reduce((a, s) => a + (parseFloat(s.due)||0), 0);

      tableContent = `
        <table style="
          width:100%;
          border-collapse:collapse;
          table-layout:fixed;
          font-size:12px;
          font-family:'Segoe UI',Arial,sans-serif;
          margin-bottom:0;
        ">
          <colgroup>
            <col style="width:10%;">
            <col style="width:17%;">
            <col style="width:26%;">
            <col style="width:9%;">
            <col style="width:13%;">
            <col style="width:12%;">
            <col style="width:13%;">
          </colgroup>
          <thead>
            <tr style="background:#1a3a5c; color:#fff;">
              <th style="padding:8px 6px; text-align:left; font-size:11px; border:1px solid #0e2540;">Date</th>
              <th style="padding:8px 6px; text-align:left; font-size:11px; border:1px solid #0e2540;">Name</th>
              <th style="padding:8px 6px; text-align:left; font-size:11px; border:1px solid #0e2540;">Course</th>
              <th style="padding:8px 6px; text-align:left; font-size:11px; border:1px solid #0e2540;">Batch</th>
              <th style="padding:8px 6px; text-align:right; font-size:11px; border:1px solid #0e2540;">Total</th>
              <th style="padding:8px 6px; text-align:right; font-size:11px; border:1px solid #0e2540;">Paid</th>
              <th style="padding:8px 6px; text-align:right; font-size:11px; border:1px solid #0e2540;">Due</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((s, i) => `
              <tr style="background:${i%2===0?'#fff':'#f5f8fc'};">
                <td style="padding:6px; border:1px solid #cdd; font-size:11px; color:#444; word-wrap:break-word;">${s.enrollDate||'—'}</td>
                <td style="padding:6px; border:1px solid #cdd; font-size:11px; font-weight:600; color:#111; word-wrap:break-word;">${s.name||'—'}</td>
                <td style="padding:6px; border:1px solid #cdd; font-size:11px; color:#333; word-wrap:break-word;">${s.course||'—'}</td>
                <td style="padding:6px; border:1px solid #cdd; font-size:11px; color:#2c7da0; font-weight:600;">${s.batch||'—'}</td>
                <td style="padding:6px; border:1px solid #cdd; text-align:right; font-size:11px; font-weight:600; color:#1a3a5c;">৳${fmt(s.totalPayment||0)}</td>
                <td style="padding:6px; border:1px solid #cdd; text-align:right; font-size:11px; font-weight:600; color:#007744;">৳${fmt(s.paid||0)}</td>
                <td style="padding:6px; border:1px solid #cdd; text-align:right; font-size:11px; font-weight:700; color:${(s.due||0)>0?'#c0001a':'#007744'};">৳${fmt(s.due||0)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background:#dce8f5; border-top:2px solid #1a3a5c;">
              <td colspan="4" style="padding:6px 4px; border:1px solid #aac; text-align:right; font-weight:800; font-size:11px; color:#1a3a5c;">TOTAL →</td>
              <td style="padding:6px 4px; border:1px solid #aac; text-align:right; font-weight:800; font-size:11px; color:#1a3a5c; word-break:break-all;">৳${fmt(grandTotal)}</td>
              <td style="padding:6px 4px; border:1px solid #aac; text-align:right; font-weight:800; font-size:11px; color:#007744; word-break:break-all;">৳${fmt(grandPaid)}</td>
              <td style="padding:6px 4px; border:1px solid #aac; text-align:right; font-weight:800; font-size:11px; color:#c0001a; word-break:break-all;">৳${fmt(grandDue)}</td>
            </tr>
          </tfoot>
        </table>
        <div style="margin-top:8px; font-size:10px; color:#666; text-align:right; padding-right:4px;">
          Total Students: <strong style="color:#1a3a5c;">${students.length}</strong>
        </div>
      `;

    // ─────────────────────────────────────────────
    // LEDGER PRINT
    // ─────────────────────────────────────────────
    } else if (type === 'ledger') {
      title = 'FINANCIAL LEDGER REPORT';
      const lType     = document.getElementById('ledgerTypeFilter')?.value     || '';
      const lCategory = document.getElementById('ledgerCategoryFilter')?.value || '';
      const lMethod   = document.getElementById('ledgerMethodFilter')?.value   || '';
      const ls        = document.getElementById('ledgerStartDate')?.value      || '';
      const le        = document.getElementById('ledgerEndDate')?.value        || '';
      const fmt       = window.formatNumber || (n => Number(n).toLocaleString('en-IN'));

      const ledger = (window.globalData?.finance || []).filter(f => {
        const ms = !q || (f.category||'').toLowerCase().includes(q) || (f.description||'').toLowerCase().includes(q);
        const md = (!ls || f.date >= ls) && (!le || f.date <= le);
        return ms && md &&
               (!lType     || f.type     === lType) &&
               (!lCategory || f.category === lCategory) &&
               (!lMethod   || f.method   === lMethod);
      }).reverse();

      const totalIncome  = ledger.filter(f => f.type === 'Income').reduce((a, f) => a + (parseFloat(f.amount)||0), 0);
      const totalExpense = ledger.filter(f => f.type !== 'Income').reduce((a, f) => a + (parseFloat(f.amount)||0), 0);

      tableContent = `
        <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;">
          <colgroup>
            <col style="width:9%;"><col style="width:10%;"><col style="width:16%;">
            <col style="width:32%;"><col style="width:15%;"><col style="width:18%;">
          </colgroup>
          <thead>
            <tr style="background:#1a3a5c;color:#fff;">
              <th style="padding:8px 6px;font-size:11px;text-align:left;border:1px solid #0e2540;">Date</th>
              <th style="padding:8px 6px;font-size:11px;text-align:left;border:1px solid #0e2540;">Type</th>
              <th style="padding:8px 6px;font-size:11px;text-align:left;border:1px solid #0e2540;">Category</th>
              <th style="padding:8px 6px;font-size:11px;text-align:left;border:1px solid #0e2540;">Description</th>
              <th style="padding:8px 6px;font-size:11px;text-align:left;border:1px solid #0e2540;">Method</th>
              <th style="padding:8px 6px;font-size:11px;text-align:right;border:1px solid #0e2540;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${ledger.map((f, i) => `
              <tr style="background:${i%2===0?'#fff':'#f5f8fc'};">
                <td style="padding:6px;border:1px solid #cdd;font-size:11px;word-wrap:break-word;">${f.date||'—'}</td>
                <td style="padding:6px;border:1px solid #cdd;font-size:11px;font-weight:600;color:${f.type==='Income'?'#007744':'#c0001a'};">${f.type}</td>
                <td style="padding:6px;border:1px solid #cdd;font-size:11px;word-wrap:break-word;">${f.category||'—'}</td>
                <td style="padding:6px;border:1px solid #cdd;font-size:11px;word-wrap:break-word;">${f.description||f.note||'—'}</td>
                <td style="padding:6px;border:1px solid #cdd;font-size:11px;">${f.method||'—'}</td>
                <td style="padding:6px;border:1px solid #cdd;text-align:right;font-weight:600;color:${f.type==='Income'?'#007744':'#c0001a'};">৳${fmt(f.amount||0)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background:#dce8f5;border-top:2px solid #1a3a5c;">
              <td colspan="5" style="padding:8px 6px;border:1px solid #aac;text-align:right;font-weight:800;font-size:11px;">
                Income: <span style="color:#007744;">৳${fmt(totalIncome)}</span> &nbsp;|&nbsp;
                Expense: <span style="color:#c0001a;">৳${fmt(totalExpense)}</span> &nbsp;|&nbsp; Net:
              </td>
              <td style="padding:8px 6px;border:1px solid #aac;text-align:right;font-weight:800;font-size:12px;color:${totalIncome-totalExpense>=0?'#007744':'#c0001a'};">৳${fmt(totalIncome-totalExpense)}</td>
            </tr>
          </tfoot>
        </table>`;
    }

    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    printArea.innerHTML = `
      <div style="width:100%; background:white; padding:20px; font-family:'Segoe UI',Arial,sans-serif; color:#000;">
        ${(window.getPrintHeader || (() => ''))(title)}
        ${tableContent}
        ${(window.getPrintFooter || (() => ''))()}
      </div>
    `;

    // ✅ Balance card এবং no-print elements forcefully hide করো
    const toHide = document.querySelectorAll(
      '.no-print, #accountsSection .card, #accountsSection .shadow-lg, [id*="totalBalance"]'
    );
    const restored = [];
    toHide.forEach(el => {
      if (el && !printArea.contains(el)) {
        restored.push({ el, d: el.style.cssText });
        el.style.setProperty('display', 'none', 'important');
      }
    });

    // ✅ Dynamic print CSS inject — নীল line এবং background সম্পূর্ণ সরাও
    const old = document.getElementById('wf-print-override');
    if (old) old.remove();
    const styleTag = document.createElement('style');
    styleTag.id = 'wf-print-override';
    styleTag.textContent = `
      @media print {
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body.printing-receipt > *:not(#printArea) { display:none !important; }
        body.printing-receipt #printArea {
          display:block !important; position:static !important;
          background:white !important; padding:0 !important; margin:0 !important; width:100% !important;
        }
        body.printing-receipt #printArea * {
          box-shadow:none !important; text-shadow:none !important;
        }
        body.printing-receipt #printArea table {
          border-collapse:collapse !important; width:100% !important;
          background:transparent !important;
        }
        body.printing-receipt #printArea thead tr { background:#1a3a5c !important; }
        body.printing-receipt #printArea thead th { color:#fff !important; }
        body.printing-receipt #printArea tfoot tr { background:#dce8f5 !important; }
        body.printing-receipt #printArea tfoot td { border:1px solid #aac !important; }
        /* ✅ table এর পরে কোনো extra box বা line নেই */
        body.printing-receipt #printArea table ~ div { border:none !important; background:none !important; box-shadow:none !important; }
        @page { margin:1cm; size:A4; }
      }
    `;
    document.head.appendChild(styleTag);

    document.body.classList.add('printing-receipt');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-receipt');
        restored.forEach(({ el, d }) => { el.style.cssText = d; });
        const ov = document.getElementById('wf-print-override');
        if (ov) ov.remove();
        printArea.innerHTML = '';
      }, 1500);
    }, 500);
  };

  // ── Batch Name datalist populate ──
  function populateBatchDatalist() {
    const dl = document.getElementById('batchNameList');
    if (!dl) return;
    const batches = [...new Set(
      (window.globalData?.students || []).map(s => s.batch).filter(Boolean)
    )].sort();
    dl.innerHTML = batches.map(b => `<option value="${b}">`).join('');
  }
  document.addEventListener('DOMContentLoaded', () => {
    const sm = document.getElementById('studentModal');
    if (sm) sm.addEventListener('show.bs.modal', populateBatchDatalist);
  });
  const _op = window.populateDropdowns;
  if (typeof _op === 'function') {
    window.populateDropdowns = function (...args) { _op.apply(this, args); populateBatchDatalist(); };
  }
  window.populateBatchDatalist = populateBatchDatalist;

  console.log('✅ Wings Fly Print Fix v2 loaded');
})();

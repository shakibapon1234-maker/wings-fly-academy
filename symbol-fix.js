// ============================================================
// WINGS FLY — CHARACTER & SYMBOL FIX PATCH
// ১. ৳ symbol যেখানে ? দেখাচ্ছে সেগুলো fix
// ২. Student profile এ Exam History ঠিক করা
// ৩. Garbled icons fix (runtime)
// ============================================================

(function () {

  // ── ১. advSearch এ ? → ৳ fix ──────────────────────────────
  // Original applyAdvancedSearch কে wrap করি
  const _origApply = window.applyAdvancedSearch;
  window.applyAdvancedSearch = function () {
    if (typeof _origApply === 'function') _origApply.apply(this, arguments);

    // After original runs, fix ? symbols
    ['advSearchIncome', 'advSearchCollected', 'advSearchDue'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.innerText) {
        el.innerText = el.innerText.replace(/^\?/, '৳').replace(/^৳৳/, '৳');
      }
    });
  };

  // Also fix on DOM mutation (catches async updates)
  const currencyObserver = new MutationObserver(mutations => {
    mutations.forEach(m => {
      if (m.type === 'childList' || m.type === 'characterData') {
        const target = m.target.nodeType === 3 ? m.target.parentElement : m.target;
        if (!target) return;
        const ids = ['advSearchIncome', 'advSearchCollected', 'advSearchDue',
                     'dashTotalIncome', 'dashTotalExpense', 'dashTotalProfit'];
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el && el.innerText && el.innerText.startsWith('?')) {
            el.innerText = '৳' + el.innerText.slice(1);
          }
        });
      }
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    // Observe the student advanced search summary
    const summary = document.getElementById('advSearchSummary');
    if (summary) {
      currencyObserver.observe(summary, { childList: true, subtree: true, characterData: true });
    }

    // ── Fix garbled static icons in HTML ──────────────────
    fixGarbledIcons();

    // ── Fix student profile Exam History ──────────────────
    patchStudentProfile();
  });


  // ── ২. Garbled icon fix ────────────────────────────────────
  function fixGarbledIcons() {
    // Fix all text nodes with garbled chars
    const garbledMap = [
      ['👨ï¸',  '🖨️'],
      ['âš™ï¸', '⚙️'],
      ['â˜ï¸',  '☁️'],
      ['âš ï¸',  '⚠️'],
      ['âœï¸',  '✏️'],
      ['ï¸',    ''],
      ['â€',    ''],
      ['Â·',    '·'],
    ];

    function walkText(node) {
      if (node.nodeType === 3) { // text node
        let changed = false;
        let text = node.textContent;
        garbledMap.forEach(([bad, good]) => {
          if (text.includes(bad)) { text = text.split(bad).join(good); changed = true; }
        });
        if (changed) node.textContent = text;
      } else if (node.nodeType === 1 && node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE') {
        node.childNodes.forEach(walkText);
      }
    }

    // Walk document body
    walkText(document.body);
  }


  // ── ৩. Student Profile — Exam History fix ─────────────────
  function patchStudentProfile() {
    // Override openStudentProfile to inject exam history
    const _origProfile = window.openStudentProfile;
    if (typeof _origProfile !== 'function') return;

    window.openStudentProfile = function (rowIndex) {
      _origProfile.apply(this, arguments);

      // Wait for modal to render
      setTimeout(() => {
        injectExamHistory(rowIndex);
      }, 350);
    };
  }

  function injectExamHistory(rowIndex) {
    // Find the exam history container in student profile modal
    const examSection = document.getElementById('profileExamHistory') ||
                        findExamHistorySection();
    if (!examSection) return;

    const student = (window.globalData?.students || []).find(
      s => s.rowIndex == rowIndex || (window.globalData.students.indexOf(s) == rowIndex)
    );
    if (!student) return;

    const exams = (window.globalData?.examRegistrations || []).filter(
      e => e.studentName === student.name ||
           e.studentId   === student.studentId
    );

    const fmt = window.formatNumber || (n => Number(n).toLocaleString('en-IN'));

    if (exams.length === 0) {
      examSection.innerHTML = `
        <div style="text-align:center;padding:20px;color:rgba(255,255,255,0.35);font-size:0.85rem;">
          No exam records found for this student.
        </div>`;
      return;
    }

    examSection.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
        <thead>
          <tr>
            <th style="padding:8px 10px;border-bottom:1px solid rgba(0,217,255,0.2);color:rgba(0,217,255,0.7);font-size:0.72rem;letter-spacing:1px;text-transform:uppercase;text-align:left;">DATE</th>
            <th style="padding:8px 10px;border-bottom:1px solid rgba(0,217,255,0.2);color:rgba(0,217,255,0.7);font-size:0.72rem;letter-spacing:1px;text-transform:uppercase;text-align:left;">SUBJECT</th>
            <th style="padding:8px 10px;border-bottom:1px solid rgba(0,217,255,0.2);color:rgba(0,217,255,0.7);font-size:0.72rem;letter-spacing:1px;text-transform:uppercase;text-align:right;">FEE</th>
            <th style="padding:8px 10px;border-bottom:1px solid rgba(0,217,255,0.2);color:rgba(0,217,255,0.7);font-size:0.72rem;letter-spacing:1px;text-transform:uppercase;text-align:center;">GRADE</th>
          </tr>
        </thead>
        <tbody>
          ${exams.map(e => `
            <tr>
              <td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);color:rgba(255,255,255,0.5);font-size:0.78rem;">${e.registrationDate || '—'}</td>
              <td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);font-weight:600;">${e.subjectName || '—'}</td>
              <td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right;color:#00d9ff;font-weight:700;">৳${fmt(e.examFee || 0)}</td>
              <td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);text-align:center;">
                ${e.grade
                  ? `<span style="background:rgba(0,255,136,0.15);border:1px solid rgba(0,255,136,0.4);color:#00ff88;padding:2px 10px;border-radius:20px;font-weight:700;font-size:0.75rem;">${e.grade}</span>`
                  : `<span style="color:rgba(255,255,255,0.25);font-size:0.75rem;">Pending</span>`}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  }

  function findExamHistorySection() {
    // Try to find by searching text content
    const allDivs = document.querySelectorAll('[id*="exam"], [id*="Exam"]');
    for (const d of allDivs) {
      if (d.id && d.id.toLowerCase().includes('exam')) return d;
    }
    return null;
  }

  // ── ৪. Periodic ? → ৳ scanner (every 2s for dynamic content) ──
  setInterval(() => {
    ['advSearchIncome', 'advSearchCollected', 'advSearchDue'].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.innerText && /^\?[0-9,]+$/.test(el.innerText.trim())) {
        el.innerText = '৳' + el.innerText.slice(1);
      }
    });
  }, 2000);

  console.log('✅ Symbol Fix Patch loaded — Wings Fly');
})();

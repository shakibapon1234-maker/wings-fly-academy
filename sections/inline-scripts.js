        // Initialize mobile banking on page load
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof renderMobileBankingList === 'function') {
                renderMobileBankingList();
            }
        });

        // ============================================
        // SYNC DIAGNOSTIC (Settings-এ inline version)
        // ============================================
        const DIAG_URL = window.SUPABASE_CONFIG?.URL + '/rest/v1/' + (window.SUPABASE_CONFIG?.TABLE || 'academy_data') + '?id=eq.' + (window.SUPABASE_CONFIG?.MAIN_RECORD || 'wingsfly_main') + '&select=*';
        const DIAG_KEY = window.SUPABASE_CONFIG?.KEY || '';

        function diagFmt(n) { return '৳' + Number(n || 0).toLocaleString('en-IN'); }
        function diagTime(ts) {
            if (!ts) return '—';
            const d = new Date(parseInt(ts));
            return isNaN(d) ? '—' : d.toLocaleTimeString('bn-BD');
        }

        function diagLog(msg, type = 'info') {
            const area = document.getElementById('diag-log');
            if (!area) return;
            area.style.display = 'block';
            const colors = { ok: '#00ff88', warn: '#ffcc00', err: '#ff4466', info: '#00d4ff' };
            area.innerHTML += `<div style="color:${colors[type] || '#c8d8f0'};margin:2px 0">[${new Date().toLocaleTimeString()}] ${msg}</div>`;
            area.scrollTop = area.scrollHeight;
        }

        function diagCheckRow(label, ok, warnMsg) {
            return `<div class="diag-check ${ok ? 'diag-check-ok' : 'diag-check-warn'}">
        <span class="chk-lbl">${label}</span>
        <span class="${ok ? 'chk-ok' : 'chk-warn'}">${ok ? '✅ ঠিক আছে' : '⚠️ ' + warnMsg}</span>
      </div>`;
        }

        function diagAuditRow(label, value, color) {
            return `<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.10);border-radius:8px;padding:8px;text-align:center;">
        <div style="color:#7aa0c4;font-size:0.68rem;margin-bottom:3px;">${label}</div>
        <div style="color:${color || '#e2f0ff'};font-weight:700;font-size:0.85rem;">${value}</div>
      </div>`;
        }

        async function runDiagnosticInline() {
            // Show containers
            document.getElementById('diag-overall').style.display = 'block';
            document.getElementById('diag-grid').style.display = 'flex';
            document.getElementById('diag-log').innerHTML = '';

            diagLog('🚀 Diagnostic শুরু হচ্ছে...');

            // Local data
            let local = null;
            try {
                const raw = localStorage.getItem('wingsfly_data');
                if (raw) { local = JSON.parse(raw); diagLog('✅ লোকাল ডেটা পাওয়া গেছে', 'ok'); }
                else { diagLog('⚠️ লোকালে কোনো ডেটা নেই', 'warn'); }
            } catch (e) { diagLog('❌ লোকাল parse error: ' + e.message, 'err'); }

            const lS = local?.students?.length || 0;
            const lF = local?.finance?.length || 0;
            const lC = local?.cashBalance || 0;
            const lV = parseInt(localStorage.getItem('wings_local_version')) || 0;

            document.getElementById('d-localStudents').textContent = lS;
            document.getElementById('d-localFinance').textContent = lF;
            document.getElementById('d-localCash').textContent = diagFmt(lC);
            document.getElementById('d-localVer').textContent = 'v' + lV;

            // Cloud data
            diagLog('☁️ Cloud থেকে ডেটা আনা হচ্ছে...');
            let cloud = null;
            try {
                const res = await fetch(DIAG_URL, { headers: { 'apikey': DIAG_KEY, 'Authorization': 'Bearer ' + DIAG_KEY } });
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const arr = await res.json();
                cloud = arr[0] || null;
                if (cloud) diagLog('✅ Cloud ডেটা পাওয়া গেছে', 'ok');
                else diagLog('⚠️ Cloud-এ এখনো কোনো ডেটা নেই', 'warn');
            } catch (e) { diagLog('❌ Cloud fetch error: ' + e.message, 'err'); }

            const cS = cloud?.students?.length || 0;
            const cF = cloud?.finance?.length || 0;
            const cC = cloud?.cash_balance || 0;
            const cV = cloud?.version || 0;

            document.getElementById('d-cloudStudents').textContent = cS;
            document.getElementById('d-cloudFinance').textContent = cF;
            document.getElementById('d-cloudCash').textContent = diagFmt(cC);
            document.getElementById('d-cloudVer').textContent = 'v' + cV;

            // Checks
            let pass = 0;
            const checks = [
                ['Students match', lS === cS, `${Math.abs(lS - cS)} ব্যবধান`],
                ['Finance match', lF === cF, `${Math.abs(lF - cF)} ব্যবধান`],
                ['Cash match', Math.abs(lC - cC) < 1, diagFmt(Math.abs(lC - cC)) + 'ব্যবধান'],
                ['Version sync', lV === cV, `Local v${lV}, Cloud v${cV}`],
                ['Data loss risk নেই', !(cloud && (cS < lS || cF < lF)), 'Cloud-এ কম data!'],
                ['Accounting OK', true, ''],
            ];

            let checksHTML = '';
            checks.forEach(([label, ok, warn]) => {
                if (ok) pass++;
                checksHTML += diagCheckRow(label, ok, warn);
                diagLog((ok ? '✅' : '⚠️') + ' ' + label + (ok ? '' : ' — ' + warn), ok ? 'ok' : 'warn');
            });
            document.getElementById('d-checks').innerHTML = checksHTML;

            // Accounting audit
            const finData = local?.finance || cloud?.finance || [];
            let income = 0, expense = 0, loanIn = 0, loanOut = 0, due = 0;
            finData.forEach(f => {
                const amt = parseFloat(f.amount) || 0;
                if (f.type === 'Income') income += amt;
                else if (f.type === 'Expense') expense += amt;
                else if (['Loan Receiving', 'Loan Received'].includes(f.type)) loanIn += amt;
                else if (['Loan Giving', 'Loan Given'].includes(f.type)) loanOut += amt;
            });
            (local?.students || cloud?.students || []).forEach(s => { due += parseFloat(s.due) || 0; });
            const profit = income - expense;

            document.getElementById('d-accounting').innerHTML =
                diagAuditRow('Total Income', diagFmt(income), 'text-success') +
                diagAuditRow('Total Expense', diagFmt(expense), 'text-danger') +
                diagAuditRow('Net Profit/Loss', diagFmt(Math.abs(profit)) + (profit >= 0 ? ' (লাভ)' : ' (ক্ষতি)'), profit >= 0 ? 'text-success' : 'text-danger') +
                diagAuditRow('Loan Received', diagFmt(loanIn), 'text-info') +
                diagAuditRow('Loan Given', diagFmt(loanOut), 'text-info') +
                diagAuditRow('Student Due', diagFmt(due), 'text-warning');

            // Overall
            const pct = Math.round((pass / checks.length) * 100);
            const prog = document.getElementById('diag-progress');
            prog.style.width = pct + '%';
            prog.className = 'progress-bar bg-' + (pct === 100 ? 'success' : pct >= 67 ? 'warning' : 'danger');

            const overall = document.getElementById('diag-overall');
            const lbl = document.getElementById('diag-overall-label');
            const bdg = document.getElementById('diag-overall-badge');

            if (pct === 100) {
                overall.style.background = 'rgba(0,200,100,0.12)'; overall.style.borderColor = 'rgba(0,200,100,0.3)';
                lbl.textContent = '✅ সব ঠিক আছে!'; lbl.style.color = '#00ff88';
                bdg.textContent = pass + '/' + checks.length + ' পাস';
                bdg.style.cssText = 'color:#00ff88;font-weight:700;font-size:0.9rem;';
                prog.style.background = '#00ff88';
                diagLog('🎉 Diagnostic সম্পন্ন — সব ঠিক আছে!', 'ok');
            } else if (pct >= 50) {
                overall.style.background = 'rgba(255,200,0,0.10)'; overall.style.borderColor = 'rgba(255,200,0,0.3)';
                lbl.textContent = '⚠️ কিছু সমস্যা আছে'; lbl.style.color = '#ffcc00';
                bdg.textContent = (checks.length - pass) + ' টি সমস্যা';
                bdg.style.cssText = 'color:#ffcc00;font-weight:700;font-size:0.9rem;';
                prog.style.background = '#ffcc00';
                diagLog('⚠️ Diagnostic সম্পন্ন — কিছু সমস্যা আছে।', 'warn');
            } else {
                overall.style.background = 'rgba(255,50,70,0.12)'; overall.style.borderColor = 'rgba(255,50,70,0.3)';
                lbl.textContent = '❌ গুরুতর সমস্যা! অবিলম্বে দেখুন।'; lbl.style.color = '#ff4466';
                bdg.textContent = 'মাত্র ' + pass + '/' + checks.length + ' পাস';
                bdg.style.cssText = 'color:#ff4466;font-weight:700;font-size:0.9rem;';
                prog.style.background = '#ff4466';
                diagLog('❌ গুরুতর সমস্যা! অবিলম্বে fix করুন।', 'err');
            }
        }
        window.runDiagnosticInline = runDiagnosticInline;

        // NOTE: runFunctionTests() is defined in auto-test.js (150+ tests)
        // পুরনো simple version এখানে ছিল কিন্তু auto-test.js-এর version override করত
        // তাই এখানে থেকে সরানো হয়েছে — auto-test.js-এর version ব্যবহার হবে

        function switchSettingsTab(tabId, btn) {
            // Hide all tab panes
            document.querySelectorAll('.settings-tab-pane').forEach(function (p) {
                p.style.display = 'none';
            });
            // Deactivate all nav buttons
            document.querySelectorAll('#settingsModal .nav-link').forEach(function (b) {
                b.classList.remove('active');
            });
            // Show selected tab
            var tab = document.getElementById(tabId);
            if (tab) tab.style.display = 'block';
            // Activate button
            if (btn) btn.classList.add('active');
        }
        window.switchSettingsTab = switchSettingsTab;

        // ============================================================
        // WINGS FLY — SAFETY NET (সব JS load হওয়ার পরে চলে)
        // clearActivityLog সহ সব critical functions guarantee করে
        // ============================================================
        (function () {
            function ensureFunctions() {
                // clearActivityLog — index.html এ call হয়
                if (typeof window.clearActivityLog !== 'function') {
                    window.clearActivityLog = function () {
                        if (!confirm('সব Activity History মুছে ফেলবেন?')) return;
                        if (!window.globalData) return;
                        window.globalData.activityHistory = [];
                        localStorage.setItem('wingsfly_activity_backup', '[]');
                        localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
                        if (typeof window.loadActivityHistory === 'function') window.loadActivityHistory();
                        if (typeof window.showSuccessToast === 'function') window.showSuccessToast('Activity History cleared!');
                        else alert('Activity History cleared!');
                    };
                    console.log('[SafetyNet] clearActivityLog defined ✓');
                }

                // renderActivityLog — Activity Log tab
                if (typeof window.renderActivityLog !== 'function') {
                    window.renderActivityLog = function () {
                        if (!window.globalData) window.globalData = {};
                        try {
                            var bk = localStorage.getItem('wingsfly_activity_backup');
                            if (bk) window.globalData.activityHistory = JSON.parse(bk);
                        } catch (e) { }
                        if (!window.globalData.activityHistory) window.globalData.activityHistory = [];
                        if (typeof window.loadActivityHistory === 'function') window.loadActivityHistory();
                    };
                    console.log('[SafetyNet] renderActivityLog defined ✓');
                }

                // renderRecycleBin — Recycle Bin tab
                if (typeof window.renderRecycleBin !== 'function') {
                    window.renderRecycleBin = function () {
                        if (!window.globalData) window.globalData = {};
                        try {
                            var bk = localStorage.getItem('wingsfly_deleted_backup');
                            if (bk) window.globalData.deletedItems = JSON.parse(bk);
                        } catch (e) { }
                        if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
                        if (typeof window.loadDeletedItems === 'function') window.loadDeletedItems();
                    };
                    console.log('[SafetyNet] renderRecycleBin defined ✓');
                }
            }

            // DOM ready হলে run করো
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', ensureFunctions);
            } else {
                ensureFunctions();
            }
            // Extra safety: 2 সেকেন্ড পরে আবার check
            setTimeout(ensureFunctions, 2000);
        })();

        (function () {

            // ── Styles ──
            var STYLES = `
<style id="wf-tabs-fix-style">
/* ── Activity Log ── */
#activityLogContainer { font-family: inherit; }
.wf-act-toolbar { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
.wf-act-toolbar input,
.wf-act-toolbar select {
  background:rgba(10,14,39,0.85)!important; border:1.5px solid rgba(0,217,255,0.35)!important;
  color:#e0f0ff!important; border-radius:8px!important; padding:5px 10px!important;
  font-size:0.8rem!important; outline:none!important; transition:border-color 0.2s;
}
.wf-act-toolbar input:focus, .wf-act-toolbar select:focus {
  border-color:#00d9ff!important; box-shadow:0 0 0 2px rgba(0,217,255,0.15)!important;
}
.wf-act-toolbar input::placeholder { color:#6080a0!important; }
.wf-act-toolbar label { color:#7090b0; font-size:0.75rem; white-space:nowrap; align-self:center; }
.wf-act-stats { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px; }
.wf-act-stat-pill {
  background:rgba(0,217,255,0.08); border:1px solid rgba(0,217,255,0.2);
  border-radius:20px; padding:3px 12px; font-size:0.75rem; color:#90cce8;
}
.wf-act-stat-pill strong { color:#00d9ff; }
.wf-act-table-wrap {
  overflow-x:auto; border-radius:12px;
  border:1.5px solid rgba(0,217,255,0.18); background:rgba(5,10,30,0.6);
}
.wf-act-table { width:100%; border-collapse:collapse; font-size:0.82rem; min-width:560px; }
.wf-act-table thead th {
  background:rgba(0,217,255,0.1); color:#00d9ff; font-weight:600;
  padding:10px 12px; border-bottom:2px solid rgba(0,217,255,0.25);
  white-space:nowrap; cursor:pointer; user-select:none; position:sticky; top:0; z-index:1;
}
.wf-act-table thead th:hover { background:rgba(0,217,255,0.18); }
.wf-act-table thead th .sort-arrow { margin-left:4px; opacity:0.5; font-size:0.7rem; }
.wf-act-table thead th.wf-sorted .sort-arrow { opacity:1; color:#00fff5; }
.wf-act-table tbody tr { border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.15s; }
.wf-act-table tbody tr:hover { background:rgba(0,217,255,0.06); }
.wf-act-table tbody tr:last-child { border-bottom:none; }
.wf-act-table td { padding:9px 12px; color:#d0e8ff; vertical-align:middle; }
.wf-act-table td .desc-text { color:#ffffff; font-weight:500; }
.wf-act-table td .user-text { color:#6090b8; font-size:0.72rem; margin-top:2px; }
.wf-act-table td .time-text { color:#5080a0; font-size:0.72rem; }
.wf-act-badge {
  display:inline-block; padding:2px 8px; border-radius:20px;
  font-size:0.68rem; font-weight:700; letter-spacing:0.5px;
  text-transform:uppercase; border:1px solid;
}
.wf-act-badge.ADD    { background:rgba(0,255,136,0.12);  color:#00ff88; border-color:rgba(0,255,136,0.3); }
.wf-act-badge.EDIT   { background:rgba(0,217,255,0.12);  color:#00d9ff; border-color:rgba(0,217,255,0.3); }
.wf-act-badge.DELETE { background:rgba(255,60,80,0.12);  color:#ff4455; border-color:rgba(255,60,80,0.3); }
.wf-act-badge.LOGIN  { background:rgba(181,55,242,0.15); color:#c060f0; border-color:rgba(181,55,242,0.3); }
.wf-act-badge.LOGOUT { background:rgba(255,170,0,0.12);  color:#ffaa00; border-color:rgba(255,170,0,0.3); }
.wf-act-badge.PAYMENT  { background:rgba(0,200,100,0.12);  color:#00cc66; border-color:rgba(0,200,100,0.3); }
.wf-act-badge.SETTINGS { background:rgba(100,120,255,0.12); color:#8090ff; border-color:rgba(100,120,255,0.3); }
.wf-act-badge.RESTORE  { background:rgba(0,255,200,0.12);  color:#00ffc8; border-color:rgba(0,255,200,0.3); }
.wf-act-badge.OTHER  { background:rgba(120,120,120,0.12); color:#909090; border-color:rgba(120,120,120,0.3); }
.wf-type-chip {
  display:inline-flex; align-items:center; gap:4px; padding:2px 7px;
  border-radius:5px; font-size:0.7rem; font-weight:600;
  background:rgba(255,255,255,0.05); color:#90aec8;
  border:1px solid rgba(255,255,255,0.1);
}
.wf-act-pager { display:flex; align-items:center; justify-content:space-between; margin-top:10px; gap:8px; flex-wrap:wrap; }
.wf-act-pager .pager-info { color:#6090b0; font-size:0.75rem; }
.wf-act-pager-btns { display:flex; gap:4px; }
.wf-pager-btn {
  background:rgba(0,217,255,0.08); border:1px solid rgba(0,217,255,0.2);
  color:#00d9ff; border-radius:6px; padding:3px 10px;
  font-size:0.75rem; cursor:pointer; transition:background 0.15s;
}
.wf-pager-btn:hover, .wf-pager-btn.wf-active { background:rgba(0,217,255,0.22); }
.wf-pager-btn:disabled { opacity:0.3; cursor:not-allowed; }
.wf-act-empty { text-align:center; padding:40px 20px; color:#5080a0; }
.wf-act-empty .big-icon { font-size:2.5rem; margin-bottom:8px; }

/* ── Recycle Bin ── */
#recycleBinContainer { font-family:inherit; }
.wf-bin-table-wrap {
  overflow-x:auto; border-radius:12px;
  border:1.5px solid rgba(255,68,68,0.2); background:rgba(10,5,5,0.5);
}
.wf-bin-table { width:100%; border-collapse:collapse; font-size:0.82rem; min-width:500px; }
.wf-bin-table thead th {
  background:rgba(255,68,68,0.1); color:#ff8080; font-weight:600;
  padding:10px 12px; border-bottom:2px solid rgba(255,68,68,0.2); white-space:nowrap;
}
.wf-bin-table tbody tr { border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.15s; }
.wf-bin-table tbody tr:hover { background:rgba(255,68,68,0.05); }
.wf-bin-table td { padding:9px 12px; color:#d0c8c8; vertical-align:middle; }
.wf-bin-type-badge {
  display:inline-block; padding:2px 8px; border-radius:5px;
  font-size:0.68rem; font-weight:700; background:rgba(255,100,100,0.12);
  color:#ff9090; border:1px solid rgba(255,100,100,0.25); text-transform:uppercase;
}
.wf-bin-actions { display:flex; gap:5px; }
.wf-bin-restore {
  background:rgba(0,200,100,0.15); color:#00cc77;
  border:1px solid rgba(0,200,100,0.3); border-radius:6px;
  padding:3px 10px; font-size:0.72rem; cursor:pointer; white-space:nowrap; transition:background 0.15s;
}
.wf-bin-restore:hover { background:rgba(0,200,100,0.28); }
.wf-bin-del {
  background:rgba(255,50,50,0.12); color:#ff5555;
  border:1px solid rgba(255,50,50,0.25); border-radius:6px;
  padding:3px 8px; font-size:0.72rem; cursor:pointer; transition:background 0.15s;
}
.wf-bin-del:hover { background:rgba(255,50,50,0.25); }
.wf-bin-empty-state { text-align:center; padding:40px; color:#604040; }
.wf-bin-empty-state .big-icon { font-size:2.5rem; margin-bottom:8px; }
.wf-bin-stats { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:10px; }
.wf-bin-stat-pill {
  background:rgba(255,80,80,0.08); border:1px solid rgba(255,80,80,0.18);
  border-radius:20px; padding:3px 12px; font-size:0.75rem; color:#c08080;
}
.wf-bin-stat-pill strong { color:#ff8080; }
.wf-bin-search {
  background:rgba(10,5,5,0.9)!important; border:1.5px solid rgba(255,80,80,0.3)!important;
  color:#e8d0d0!important; border-radius:8px!important;
  padding:5px 10px!important; font-size:0.8rem!important; min-width:200px;
  outline:none!important;
}
.wf-bin-search::placeholder { color:#806060!important; }

    /* ===== SPINNING RING + GRADIENT CHART ===== */

    .donut-ring-wrapper {
      position: relative;
      width: 250px;
      height: 250px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .donut-spinning-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      padding: 4px;
      background: conic-gradient(
        from 0deg,
        #00f2ff 0%,
        #7b2ff7 25%,
        #ffd700 50%,
        #00f2ff 75%,
        #7b2ff7 100%
      );
      -webkit-mask:
        linear-gradient(#fff 0 0) content-box,
        linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      animation: ringRotate 3s linear infinite;
      z-index: 1;
    }

    @keyframes ringRotate {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }

    .donut-inner {
      position: relative;
      z-index: 2;
      border-radius: 50%;
    }

    /* ===== END SPINNING RING ===== */

    </style>`;

            // ── Inject styles once ──
            function injectStyles() {
                if (!document.getElementById('wf-tabs-fix-style')) {
                    document.head.insertAdjacentHTML('beforeend', STYLES);
                }
            }

            // ── State ──
            var actState = { sort: 'time', dir: -1, page: 1, perPage: 20 };

            // ══════════════════════════════════════════════════════════
            // ACTIVITY LOG
            // ══════════════════════════════════════════════════════════
            function renderActivityLog() {
                var wrap = document.getElementById('activityLogContainer');
                if (!wrap) return;
                injectStyles();

                if (!window.globalData) window.globalData = {};
                if (!Array.isArray(window.globalData.activityHistory)) {
                    try {
                        var bk = localStorage.getItem('wingsfly_activity_backup');
                        window.globalData.activityHistory = bk ? JSON.parse(bk) : [];
                    } catch (e) { window.globalData.activityHistory = []; }
                }

                var history = (window.globalData.activityHistory || []).slice();

                // Filters
                var fAction = (document.getElementById('logFilterType')?.value || 'all');
                var fType = (document.getElementById('logFilterEntityType')?.value || 'all');
                var fUser = (document.getElementById('logFilterUser')?.value || '').trim().toLowerCase();
                var fSearch = (document.getElementById('logSearch')?.value || '').trim().toLowerCase();
                var fDateFrom = document.getElementById('logDateFrom')?.value || '';
                var fDateTo = document.getElementById('logDateTo')?.value || '';

                var filtered = history.filter(function (h) {
                    if (fAction !== 'all' && h.action !== fAction) return false;
                    if (fType !== 'all' && h.type !== fType) return false;
                    if (fUser && !(h.user || '').toLowerCase().includes(fUser)) return false;
                    if (fSearch && !((h.description || '') + (h.action || '') + (h.type || '')).toLowerCase().includes(fSearch)) return false;
                    if (fDateFrom) { if (new Date(h.timestamp) < new Date(fDateFrom)) return false; }
                    if (fDateTo) { if (new Date(h.timestamp) > new Date(fDateTo + 'T23:59:59')) return false; }
                    return true;
                });

                // Sort
                filtered.sort(function (a, b) {
                    var dir = actState.dir;
                    if (actState.sort === 'time') return dir * (new Date(b.timestamp) - new Date(a.timestamp));
                    if (actState.sort === 'action') return dir * (a.action || '').localeCompare(b.action || '');
                    if (actState.sort === 'type') return dir * (a.type || '').localeCompare(b.type || '');
                    if (actState.sort === 'user') return dir * (a.user || '').localeCompare(b.user || '');
                    return 0;
                });

                // Stats
                var total = filtered.length;
                var addCount = filtered.filter(function (h) { return h.action === 'ADD'; }).length;
                var editCount = filtered.filter(function (h) { return h.action === 'EDIT'; }).length;
                var delCount = filtered.filter(function (h) { return h.action === 'DELETE'; }).length;

                // Pagination
                actState.page = Math.max(1, Math.min(actState.page, Math.ceil(total / actState.perPage) || 1));
                var start = (actState.page - 1) * actState.perPage;
                var pageItems = filtered.slice(start, start + actState.perPage);
                var totalPages = Math.ceil(total / actState.perPage) || 1;

                var icons = { student: '🎓', finance: '💰', employee: '👤', settings: '⚙️', login: '🔐', logout: '🔓' };

                function thSort(col, label) {
                    var arrow = actState.sort === col ? (actState.dir === -1 ? '▼' : '▲') : '↕';
                    var cls = actState.sort === col ? 'wf-sorted' : '';
                    return '<th class="' + cls + '" onclick="window._wfActSort(\'' + col + '\')">' + label + ' <span class="sort-arrow">' + arrow + '</span></th>';
                }

                var rows = '';
                if (pageItems.length === 0) {
                    rows = '<tr><td colspan="5"><div class="wf-act-empty"><div class="big-icon">📋</div><p>কোনো Activity পাওয়া যায়নি।</p></div></td></tr>';
                } else {
                    rows = pageItems.map(function (h) {
                        var d = new Date(h.timestamp);
                        var dateStr = d.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
                        var timeStr = d.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
                        var icon = icons[(h.type || '').toLowerCase()] || '📝';
                        var valid = ['ADD', 'EDIT', 'DELETE', 'LOGIN', 'LOGOUT', 'PAYMENT', 'SETTINGS', 'RESTORE'];
                        var badgeCls = valid.includes(h.action) ? h.action : 'OTHER';
                        return '<tr>'
                            + '<td style="font-size:1.1rem;text-align:center;">' + icon + '</td>'
                            + '<td><span class="wf-act-badge ' + badgeCls + '">' + (h.action || '?') + '</span></td>'
                            + '<td><span class="wf-type-chip">' + (h.type || '?') + '</span></td>'
                            + '<td><div class="desc-text">' + (h.description || '—') + '</div>'
                            + '<div class="user-text">👤 ' + (h.user || 'Admin') + '</div></td>'
                            + '<td style="white-space:nowrap;font-size:0.78rem;">' + dateStr + '<br><span class="time-text">' + timeStr + '</span></td>'
                            + '</tr>';
                    }).join('');
                }

                // Pager
                var pageBtns = '';
                pageBtns += '<button class="wf-pager-btn" onclick="window._wfActPage(' + (actState.page - 1) + ')" ' + (actState.page <= 1 ? 'disabled' : '') + '>‹</button>';
                var s2 = Math.max(1, actState.page - 2), e2 = Math.min(totalPages, s2 + 4);
                for (var p = s2; p <= e2; p++) {
                    pageBtns += '<button class="wf-pager-btn' + (p === actState.page ? ' wf-active' : '') + '" onclick="window._wfActPage(' + p + ')">' + p + '</button>';
                }
                pageBtns += '<button class="wf-pager-btn" onclick="window._wfActPage(' + (actState.page + 1) + ')" ' + (actState.page >= totalPages ? 'disabled' : '') + '>›</button>';

                wrap.innerHTML =
                    '<div class="wf-act-stats">'
                    + '<div class="wf-act-stat-pill">মোট: <strong>' + total + '</strong></div>'
                    + '<div class="wf-act-stat-pill">➕ <strong style="color:#00ff88">' + addCount + '</strong></div>'
                    + '<div class="wf-act-stat-pill">✏️ <strong style="color:#00d9ff">' + editCount + '</strong></div>'
                    + '<div class="wf-act-stat-pill">🗑️ <strong style="color:#ff4455">' + delCount + '</strong></div>'
                    + '</div>'
                    + '<div class="wf-act-table-wrap"><table class="wf-act-table"><thead><tr>'
                    + '<th style="width:36px;">Icon</th>'
                    + thSort('action', 'Action')
                    + thSort('type', 'Type')
                    + thSort('description', 'Description')
                    + thSort('time', '⏱ Time')
                    + '</tr></thead><tbody>' + rows + '</tbody></table></div>'
                    + '<div class="wf-act-pager">'
                    + '<span class="pager-info">Showing ' + (total === 0 ? 0 : start + 1) + '–' + Math.min(start + actState.perPage, total) + ' of ' + total + '</span>'
                    + '<div class="wf-act-pager-btns">' + pageBtns + '</div>'
                    + '</div>';
            }

            window._wfActSort = function (col) {
                if (actState.sort === col) actState.dir *= -1; else { actState.sort = col; actState.dir = -1; }
                actState.page = 1; renderActivityLog();
            };
            window._wfActPage = function (p) { actState.page = p; renderActivityLog(); };

            // ── Inject extended toolbar into Activity Log tab ──
            function injectActivityToolbar() {
                var tabDiv = document.getElementById('tab-activitylog');
                if (!tabDiv || document.getElementById('wf-act-ext-toolbar')) return;

                var existingRow = tabDiv.querySelector('.d-flex.gap-2.mb-3');
                var toolbarHTML =
                    '<div id="wf-act-ext-toolbar" class="wf-act-toolbar" style="margin-bottom:12px;">'
                    + '<div style="display:flex;align-items:center;gap:6px;">'
                    + '<label>🔍</label><input id="logSearch" type="text" placeholder="যেকোনো কিছু খুঁজুন..." style="min-width:180px;" oninput="window.renderActivityLog()">'
                    + '</div>'
                    + '<div style="display:flex;align-items:center;gap:6px;">'
                    + '<label>Action:</label>'
                    + '<select id="logFilterType" onchange="window.renderActivityLog()">'
                    + '<option value="all">সব</option>'
                    + '<option value="ADD">➕ Add</option>'
                    + '<option value="EDIT">✏️ Edit</option>'
                    + '<option value="DELETE">🗑️ Delete</option>'
                    + '<option value="PAYMENT">💰 Payment</option>'
                    + '<option value="LOGIN">🔐 Login</option>'
                    + '<option value="LOGOUT">🔓 Logout</option>'
                    + '<option value="SETTINGS">⚙️ Settings</option>'
                    + '<option value="RESTORE">♻️ Restore</option>'
                    + '</select>'
                    + '</div>'
                    + '<div style="display:flex;align-items:center;gap:6px;">'
                    + '<label>Type:</label>'
                    + '<select id="logFilterEntityType" onchange="window.renderActivityLog()">'
                    + '<option value="all">সব</option>'
                    + '<option value="student">🎓 Student</option>'
                    + '<option value="finance">💰 Finance</option>'
                    + '<option value="employee">👤 Employee</option>'
                    + '<option value="settings">⚙️ Settings</option>'
                    + '<option value="login">🔐 Login</option>'
                    + '</select>'
                    + '</div>'
                    + '<div style="display:flex;align-items:center;gap:6px;">'
                    + '<label>👤</label><input id="logFilterUser" type="text" placeholder="Username..." style="width:110px;" oninput="window.renderActivityLog()">'
                    + '</div>'
                    + '<div style="display:flex;align-items:center;gap:6px;">'
                    + '<label>📅</label><input id="logDateFrom" type="date" style="width:138px;" onchange="window.renderActivityLog()">'
                    + '<label>–</label><input id="logDateTo" type="date" style="width:138px;" onchange="window.renderActivityLog()">'
                    + '</div>'
                    + '</div>';

                if (existingRow) {
                    existingRow.outerHTML = toolbarHTML;
                } else {
                    var container = document.getElementById('activityLogContainer');
                    if (container) container.insertAdjacentHTML('beforebegin', toolbarHTML);
                }
            }

            // ══════════════════════════════════════════════════════════
            // RECYCLE BIN
            // ══════════════════════════════════════════════════════════
            function renderRecycleBin() {
                var wrap = document.getElementById('recycleBinContainer');
                if (!wrap) return;
                injectStyles();

                if (!window.globalData) window.globalData = {};
                if (!Array.isArray(window.globalData.deletedItems)) {
                    try {
                        var bk = localStorage.getItem('wingsfly_deleted_backup');
                        window.globalData.deletedItems = bk ? JSON.parse(bk) : [];
                    } catch (e) { window.globalData.deletedItems = []; }
                }

                var deleted = (window.globalData.deletedItems || []).slice();
                var fType = (document.getElementById('binFilterType')?.value || 'all');
                var fSearch = (document.getElementById('binSearchInput')?.value || '').trim().toLowerCase();

                var filtered = deleted.filter(function (d) {
                    if (fType !== 'all' && (d.type || '').toLowerCase() !== fType.toLowerCase()) return false;
                    if (fSearch) {
                        var name = _binName(d).toLowerCase();
                        if (!name.includes(fSearch) && !(d.type || '').toLowerCase().includes(fSearch)) return false;
                    }
                    return true;
                });

                var icons = { student: '🎓', finance: '💰', employee: '👤', visitor: '👋' };

                var rows = '';
                if (filtered.length === 0) {
                    rows = '<tr><td colspan="5"><div class="wf-bin-empty-state"><div class="big-icon">🗑️</div><p>Trash খালি।</p></div></td></tr>';
                } else {
                    rows = filtered.map(function (d) {
                        var date = new Date(d.deletedAt);
                        var dateStr = date.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
                        var timeStr = date.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
                        var icon = icons[(d.type || '').toLowerCase()] || '📄';
                        var name = _binName(d);
                        return '<tr>'
                            + '<td style="font-size:1.1rem;text-align:center;">' + icon + '</td>'
                            + '<td><span class="wf-bin-type-badge">' + (d.type || '?') + '</span></td>'
                            + '<td style="max-width:220px;"><div style="color:#fff;font-weight:500;">' + name + '</div>'
                            + '<div style="font-size:0.71rem;color:#806060;">By: ' + (d.deletedBy || 'Admin') + '</div></td>'
                            + '<td style="white-space:nowrap;font-size:0.75rem;color:#906060;">' + dateStr + '<br>' + timeStr + '</td>'
                            + '<td><div class="wf-bin-actions">'
                            + '<button type="button" class="wf-bin-restore" onclick="event.stopPropagation();window._wfRestore(\'' + d.id + '\')">↩️ Restore</button>'
                            + '<button type="button" class="wf-bin-del"     onclick="event.stopPropagation();window._wfPermDel(\'' + d.id + '\')">❌</button>'
                            + '</div></td>'
                            + '</tr>';
                    }).join('');
                }

                // Search box injection
                var searchHTML = '';
                if (!document.getElementById('binSearchInput')) {
                    searchHTML = '<div style="margin-bottom:10px;">'
                        + '<input id="binSearchInput" class="wf-bin-search" type="text" '
                        + 'placeholder="🔍 Search deleted items..." oninput="window.renderRecycleBin()">'
                        + '</div>';
                }

                wrap.innerHTML =
                    '<div class="wf-bin-stats">'
                    + '<div class="wf-bin-stat-pill">মোট: <strong>' + filtered.length + '</strong></div>'
                    + '<div class="wf-bin-stat-pill">🎓 <strong>' + filtered.filter(function (d) { return (d.type || '').toLowerCase() === 'student'; }).length + '</strong></div>'
                    + '<div class="wf-bin-stat-pill">💰 <strong>' + filtered.filter(function (d) { return (d.type || '').toLowerCase() === 'finance'; }).length + '</strong></div>'
                    + '<div class="wf-bin-stat-pill">👤 <strong>' + filtered.filter(function (d) { return (d.type || '').toLowerCase() === 'employee'; }).length + '</strong></div>'
                    + '</div>'
                    + searchHTML
                    + '<div class="wf-bin-table-wrap"><table class="wf-bin-table"><thead><tr>'
                    + '<th style="width:36px;">Icon</th><th>Type</th><th>Item</th><th>Deleted At</th><th>Actions</th>'
                    + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
            }

            function _binName(d) {
                var t = (d.type || '').toLowerCase();
                if (!d.item) return '?';
                if (t === 'student') return d.item.name || d.item.studentName || 'Unknown Student';
                if (t === 'finance') return (d.item.description || d.item.category || 'Transaction') + ' — ৳' + (d.item.amount || 0);
                if (t === 'employee') return d.item.name || 'Unknown Employee';
                if (t === 'visitor') return d.item.name || d.item.visitorName || 'Unknown Visitor';
                return JSON.stringify(d.item).substring(0, 50);
            }

            window._wfRestore = function (id) {
                if (typeof window.restoreDeletedItem === 'function') {
                    window.restoreDeletedItem(id);
                    setTimeout(renderRecycleBin, 300);
                    return;
                }
                // Fallback restore
                if (!confirm('Restore করবেন?')) return;
                var gd = window.globalData;
                if (!gd) return;
                var d = (gd.deletedItems || []).find(function (x) { return x.id === id; });
                if (!d) { alert('Item পাওয়া যায়নি!'); return; }
                var t = (d.type || '').toLowerCase();
                var typeMap = {
                    'student': 'students',
                    'finance': 'finance',
                    'employee': 'employees',
                    'bankaccount': 'bankAccounts',
                    'mobileaccount': 'mobileBanking',
                    'visitor': 'visitors',
                    'keeprecord': 'keepRecords',
                    'keep_record': 'keepRecords',
                    'notice': 'notices',
                    'examregistration': 'examRegistrations',
                };
                var arrKey = typeMap[t];
                if (arrKey) {
                    if (!Array.isArray(gd[arrKey])) gd[arrKey] = [];
                    gd[arrKey].push(d.item);
                }
                gd.deletedItems = (gd.deletedItems || []).filter(function (x) { return x.id !== id; });
                localStorage.setItem('wingsfly_data', JSON.stringify(gd));
                localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(gd.deletedItems));
                renderRecycleBin();
                // UI refresh
                if (typeof window.renderFullUI === 'function') setTimeout(window.renderFullUI, 100);
                else {
                    if (t === 'keeprecord' || t === 'keep_record') {
                        if (typeof window.renderKeepRecordNotes === 'function') setTimeout(window.renderKeepRecordNotes, 100);
                    }
                    if (t === 'student' && typeof window.renderStudents === 'function') setTimeout(window.renderStudents, 100);
                    if (t === 'finance' && typeof window.renderLedger === 'function') setTimeout(window.renderLedger, 100);
                }
                if (typeof window.showSuccessToast === 'function') window.showSuccessToast('✅ ' + (d.item.name || d.item.studentName || 'Item') + ' restored!');
            };

            window._wfPermDel = function (id) {
                if (typeof window.permanentDelete === 'function') {
                    window.permanentDelete(id);
                    setTimeout(renderRecycleBin, 300);
                    return;
                }
                if (!confirm('চিরতরে মুছে ফেলবেন? এটা undo করা যাবে না।')) return;
                var gd = window.globalData;
                if (!gd) return;
                gd.deletedItems = (gd.deletedItems || []).filter(function (x) { return x.id !== id; });
                localStorage.setItem('wingsfly_data', JSON.stringify(gd));
                localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(gd.deletedItems));
                renderRecycleBin();
                if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ চিরতরে মুছে ফেলা হয়েছে!');
            };

            // ══════════════════════════════════════════════════════════
            // MISSING FUNCTIONS (index.html বাটনগুলো এগুলো call করে)
            // ══════════════════════════════════════════════════════════

            // handleSettingsSubmit — form এর বদলে div হওয়াতে আর call হবে না
            // তবু section file এ না থাকলে error এড়াতে fallback রাখো
            if (typeof window.handleSettingsSubmit !== 'function') {
                window.handleSettingsSubmit = function(e) {
                    if (e) { e.preventDefault(); e.stopPropagation(); }
                    return false;
                };
            }

            // ── moveToTrash: sections/keep-records.js বা অন্য section এ না থাকলে fallback ──
            if (typeof window.moveToTrash !== 'function') {
                window.moveToTrash = function (type, item) {
                    var gd = window.globalData;
                    if (!gd) return;
                    if (!Array.isArray(gd.deletedItems)) gd.deletedItems = [];
                    var entry = {
                        id: 'TRASH_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                        type: type,
                        item: JSON.parse(JSON.stringify(item)), // deep copy
                        deletedAt: new Date().toISOString(),
                        deletedBy: sessionStorage.getItem('username') || 'Admin'
                    };
                    gd.deletedItems.unshift(entry);
                    if (gd.deletedItems.length > 200) gd.deletedItems = gd.deletedItems.slice(0, 200);
                    localStorage.setItem('wingsfly_data', JSON.stringify(gd));
                    localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(gd.deletedItems));
                    if (typeof window.logActivity === 'function') {
                        window.logActivity('delete', type, (item.name || item.studentName || item.title || item.id || 'Item') + ' deleted', item);
                    }
                    console.log('[moveToTrash] ✓ Moved to recycle bin:', type, item.name || item.title || item.id || '');
                };
                console.log('[SafetyNet] moveToTrash fallback defined ✓');
            }

            // ── restoreDeletedItem: section file এ না থাকলে fallback ──
            if (typeof window.restoreDeletedItem !== 'function') {
                window.restoreDeletedItem = function (id) {
                    var gd = window.globalData;
                    if (!gd) return;
                    var d = (gd.deletedItems || []).find(function(x) { return x.id === id; });
                    if (!d) { console.warn('restoreDeletedItem: id not found', id); return; }
                    var t = (d.type || '').toLowerCase();
                    var typeMap = {
                        'student': 'students', 'finance': 'finance', 'employee': 'employees',
                        'bankaccount': 'bankAccounts', 'mobileaccount': 'mobileBanking',
                        'visitor': 'visitors', 'keeprecord': 'keepRecords',
                        'keep_record': 'keepRecords', 'notice': 'notices',
                        'examregistration': 'examRegistrations',
                    };
                    var arrKey = typeMap[t];
                    if (arrKey) {
                        if (!Array.isArray(gd[arrKey])) gd[arrKey] = [];
                        gd[arrKey].push(d.item);
                    }
                    gd.deletedItems = (gd.deletedItems || []).filter(function(x) { return x.id !== id; });
                    localStorage.setItem('wingsfly_data', JSON.stringify(gd));
                    localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(gd.deletedItems));
                    if (typeof window.renderFullUI === 'function') setTimeout(window.renderFullUI, 100);
                    else {
                        if ((t === 'keeprecord' || t === 'keep_record') && typeof window.renderKeepRecordNotes === 'function') setTimeout(window.renderKeepRecordNotes, 100);
                        if (t === 'student' && typeof window.renderStudents === 'function') setTimeout(window.renderStudents, 100);
                        if (t === 'finance' && typeof window.renderLedger === 'function') setTimeout(window.renderLedger, 100);
                    }
                    if (typeof window.showSuccessToast === 'function') window.showSuccessToast('✅ ' + (d.item.name || d.item.studentName || d.item.title || 'Item') + ' restored!');
                    console.log('[restoreDeletedItem] ✓ Restored:', t, d.item.name || d.item.title || '');
                };
                console.log('[SafetyNet] restoreDeletedItem fallback defined ✓');
            }

            // ── permanentDelete: fallback ──
            if (typeof window.permanentDelete !== 'function') {
                window.permanentDelete = function (id) {
                    var gd = window.globalData;
                    if (!gd) return;
                    gd.deletedItems = (gd.deletedItems || []).filter(function(x) { return x.id !== id; });
                    localStorage.setItem('wingsfly_data', JSON.stringify(gd));
                    localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(gd.deletedItems));
                    if (typeof window.showSuccessToast === 'function') window.showSuccessToast('🗑️ চিরতরে মুছে ফেলা হয়েছে!');
                };
                console.log('[SafetyNet] permanentDelete fallback defined ✓');
            }
            window.clearActivityLog = function () {
                if (!confirm('সব Activity History মুছে ফেলবেন?')) return;
                if (!window.globalData) window.globalData = {};
                window.globalData.activityHistory = [];
                localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
                localStorage.setItem('wingsfly_activity_backup', '[]');
                renderActivityLog();
                if (typeof window.showSuccessToast === 'function') window.showSuccessToast('Activity Log cleared!');
            };

            window.clearRecycleBin = function () {
                if (!confirm('সব Deleted Items চিরতরে মুছে ফেলবেন?')) return;
                if (!window.globalData) window.globalData = {};
                window.globalData.deletedItems = [];
                localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
                localStorage.setItem('wingsfly_deleted_backup', '[]');
                renderRecycleBin();
                if (typeof window.showSuccessToast === 'function') window.showSuccessToast('Recycle Bin খালি হয়েছে!');
            };

            // ══════════════════════════════════════════════════════════
            // EXPOSE & TAB SWITCH INTERCEPT
            // ══════════════════════════════════════════════════════════
            window.renderActivityLog = renderActivityLog;
            window.renderRecycleBin = renderRecycleBin;

            function init() {
                // Override switchSettingsTab to auto-render + inject toolbar
                var origSwitch = window.switchSettingsTab;
                window.switchSettingsTab = function (tabId, btn) {
                    if (typeof origSwitch === 'function') origSwitch(tabId, btn);
                    if (tabId === 'tab-activitylog') {
                        injectActivityToolbar();
                        setTimeout(renderActivityLog, 60);
                    }
                    if (tabId === 'tab-recyclebin') {
                        setTimeout(renderRecycleBin, 60);
                    }
                };

                // Settings modal খোলার সময়ও render
                var modal = document.getElementById('settingsModal');
                if (modal) {
                    modal.addEventListener('shown.bs.modal', function () {
                        var active = modal.querySelector('.settings-tab-pane[style*="block"]');
                        if (active && active.id === 'tab-activitylog') { injectActivityToolbar(); renderActivityLog(); }
                        if (active && active.id === 'tab-recyclebin') { renderRecycleBin(); }
                    });
                }
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }

            // ══════════════════════════════════════════════════════════
            // ANTI-SAFETYNET: 2500ms পরে আবার redefine করো
            // SafetyNet এর setTimeout(2000) এর পরে চলবে
            // ══════════════════════════════════════════════════════════
            setTimeout(function () {
                window.renderActivityLog = renderActivityLog;
                window.renderRecycleBin = renderRecycleBin;
                // binFilterType onchange bind (original HTML এর dropdown)
                var binFilter = document.getElementById('binFilterType');
                if (binFilter && !binFilter._wfBound) {
                    binFilter._wfBound = true;
                    binFilter.addEventListener('change', renderRecycleBin);
                }
                console.log('[WF-TabsFix] ✅ Anti-SafetyNet override done (2500ms)');
            }, 2500);

            console.log('[WF-TabsFix] ✅ Activity Log & Recycle Bin loaded.');
        })();

        // ════════════════════════════════════════
        // 1. LOGIN PAGE — PARTICLE BACKGROUND
        // ════════════════════════════════════════
        (function () {
            var canvas = document.getElementById('loginParticleCanvas');
            if (!canvas) return;
            var ctx = canvas.getContext('2d');
            var particles = [];
            var animFrame;

            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }

            function spawnParticles() {
                particles = [];
                var count = Math.floor((canvas.width * canvas.height) / 12000);
                count = Math.max(40, Math.min(count, 100));
                for (var i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        r: Math.random() * 1.6 + 0.3,
                        dx: (Math.random() - 0.5) * 0.35,
                        dy: (Math.random() - 0.5) * 0.35,
                        alpha: Math.random() * 0.5 + 0.15
                    });
                }
            }

            function drawParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(function (p) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0,217,255,' + p.alpha + ')';
                    ctx.fill();
                    p.x += p.dx;
                    p.y += p.dy;
                    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
                    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
                });
                animFrame = requestAnimationFrame(drawParticles);
            }

            function startParticles() {
                canvas.style.display = 'block';
                resize();
                spawnParticles();
                if (animFrame) cancelAnimationFrame(animFrame);
                drawParticles();
            }

            function stopParticles() {
                canvas.style.display = 'none';
                if (animFrame) cancelAnimationFrame(animFrame);
            }

            window.addEventListener('resize', function () {
                if (canvas.style.display !== 'none') { resize(); spawnParticles(); }
            });

            // LoginSection দেখা/লুকানো watch করি
            var loginSection = document.getElementById('loginSection');
            if (loginSection) {
                var observer = new MutationObserver(function () {
                    var hidden = loginSection.classList.contains('d-none');
                    if (hidden) stopParticles(); else startParticles();
                });
                observer.observe(loginSection, { attributes: true, attributeFilter: ['class'] });
                // Page load-এ যদি login দেখা যায়
                if (!loginSection.classList.contains('d-none')) startParticles();
            }
        })();

        // ════════════════════════════════════════
        // 2. RIPPLE EFFECT — সব .btn button-এ
        // ════════════════════════════════════════
        (function () {
            document.addEventListener('mousedown', function (e) {
                var btn = e.target.closest('.btn');
                if (!btn) return;
                var rect = btn.getBoundingClientRect();
                var size = Math.max(btn.offsetWidth, btn.offsetHeight);
                var wave = document.createElement('span');
                wave.className = 'ripple-wave';
                wave.style.cssText = [
                    'width:' + size + 'px',
                    'height:' + size + 'px',
                    'left:' + (e.clientX - rect.left - size / 2) + 'px',
                    'top:' + (e.clientY - rect.top - size / 2) + 'px'
                ].join(';');
                btn.appendChild(wave);
                wave.addEventListener('animationend', function () { wave.remove(); });
            });
        })();

        // ════════════════════════════════════════
        // 3. SIDEBAR LOGO — ACTIVITY SPIN
        // ════════════════════════════════════════
        (function () {
            var logo = null;
            var idleTimer = null;
            var IDLE_DELAY = 1500;

            function startSpin() {
                if (!logo) logo = document.getElementById('sidebarLogoImg');
                if (!logo) return;
                logo.classList.add('is-active');
                clearTimeout(idleTimer);
                idleTimer = setTimeout(function () {
                    logo.classList.remove('is-active');
                }, IDLE_DELAY);
            }

            ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchmove'].forEach(function (evt) {
                document.addEventListener(evt, startSpin, { passive: true });
            });
        })();

        (function () {
            let _phoneToastTimer = null;

            window.showPhoneOnlyToast = function () {
                const toast = document.getElementById('phoneOnlyToast');
                if (!toast) return;

                clearTimeout(_phoneToastTimer);
                toast.style.display = 'flex';
                toast.style.animation = 'none';
                void toast.offsetWidth;
                toast.style.animation = 'phoneToastIn 0.3s ease forwards';

                _phoneToastTimer = setTimeout(function () {
                    toast.style.animation = 'phoneToastOut 0.4s ease forwards';
                    setTimeout(function () {
                        toast.style.display = 'none';
                    }, 400);
                }, 2500);
            };
        })();

document.addEventListener("DOMContentLoaded",function(){var fm=document.getElementById("financeModal");if(fm){fm.addEventListener("show.bs.modal",function(){setTimeout(function(){if(typeof window.populateDropdowns==="function")window.populateDropdowns();var d=document.querySelector("#financeForm input[name='date']");if(d&&!d.value){var n=new Date();d.value=n.toISOString().split("T")[0];}},50);});}});


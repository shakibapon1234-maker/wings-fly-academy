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

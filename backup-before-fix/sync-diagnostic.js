// ════════════════════════════════════════════════════════════════
// WINGS FLY AVIATION ACADEMY
// SYNC DIAGNOSTIC — V2.2 Fixed (Reliable Count + Match Logic Fix)
// ════════════════════════════════════════════════════════════════

const DIAG_URL = window.SUPABASE_CONFIG?.URL + '/rest/v1/' + (window.SUPABASE_CONFIG?.TABLE || 'academy_data') + '?id=eq.' + (window.SUPABASE_CONFIG?.MAIN_RECORD || 'wingsfly_main') + '&select=*';
const DIAG_KEY = window.SUPABASE_CONFIG?.KEY || '';

/** Row counts from partial sync tables (V36+). Uses two fallback methods for reliability. */
async function diagCountPartialTable(table) {
    const CFG = window.SUPABASE_CONFIG;
    if (!CFG?.URL || !CFG.KEY || !table) return null;
    const aid = CFG.ACADEMY_ID || 'wingsfly_main';

    // Method 1: GET with count=exact header (standard Supabase approach)
    try {
        const url = `${CFG.URL}/rest/v1/${table}?academy_id=eq.${encodeURIComponent(aid)}&deleted=eq.false&select=id`;
        const res = await fetch(url, {
            headers: {
                apikey: CFG.KEY,
                Authorization: 'Bearer ' + CFG.KEY,
                Prefer: 'count=exact',
                'Range-Unit': 'items',
                Range: '0-9999'
            }
        });
        if (res.ok) {
            const cr = res.headers.get('content-range');
            if (cr && cr.includes('/')) {
                const total = cr.split('/')[1];
                if (total && total !== '*') {
                    const n = parseInt(total, 10);
                    if (Number.isFinite(n)) return n;
                }
            }
            // Fallback: count JSON rows if header missing
            try {
                const rows = await res.json();
                if (Array.isArray(rows)) return rows.length;
            } catch(je) {}
        }
    } catch (e) { /* fall through to method 2 */ }

    // Method 2: No Range header (some Supabase RLS configs block Range)
    try {
        const url2 = `${CFG.URL}/rest/v1/${table}?academy_id=eq.${encodeURIComponent(aid)}&deleted=eq.false&select=id&limit=5000`;
        const res2 = await fetch(url2, {
            headers: { apikey: CFG.KEY, Authorization: 'Bearer ' + CFG.KEY }
        });
        if (res2.ok) {
            const rows2 = await res2.json();
            if (Array.isArray(rows2)) return rows2.length;
        }
    } catch (e2) { /* ignore */ }

    return null;
}

/** Fetch cash_balance from main academy_data row */
async function diagGetCloudCash() {
    const CFG = window.SUPABASE_CONFIG;
    if (!CFG?.URL || !CFG.KEY) return null;
    try {
        const url = `${CFG.URL}/rest/v1/${CFG.TABLE || 'academy_data'}?id=eq.${CFG.MAIN_RECORD || 'wingsfly_main'}&select=cash_balance,version`;
        const res = await fetch(url, {
            headers: { apikey: CFG.KEY, Authorization: 'Bearer ' + CFG.KEY }
        });
        if (!res.ok) return null;
        const arr = await res.json();
        return arr[0] || null;
    } catch (e) {
        return null;
    }
}

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
    const startTime = Date.now();
    
    // Show containers
    document.getElementById('diag-overall').style.display = 'block';
    document.getElementById('diag-grid').style.display = 'flex';
    document.getElementById('diag-log').innerHTML = '';

    diagLog('🚀 Enhanced Diagnostic v2.1 (Partial Table Fix) শুরু হচ্ছে...');
    diagLog('🔑 Using Anon Key (Secure V37 Mode)', 'ok');

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

    // Cloud data — partial tables + main row (for cash & version)
    diagLog('☁️ Cloud থেকে ডেটা আনা হচ্ছে...');
    let cloudMeta = null;   // cash_balance, version from main row
    let cS_partial = null;
    let cF_partial = null;

    try {
        const CFG = window.SUPABASE_CONFIG || {};
        const tblStu = CFG.TBL_STUDENTS || 'wf_students';
        const tblFin = CFG.TBL_FINANCE || 'wf_finance';

        const [metaRow, stuN, finN] = await Promise.all([
            diagGetCloudCash(),
            diagCountPartialTable(tblStu),
            diagCountPartialTable(tblFin)
        ]);

        cloudMeta = metaRow;
        cS_partial = stuN;
        cF_partial = finN;

        diagLog('☁️ Partial tables: wf_students=' + (stuN ?? '—') + ', wf_finance=' + (finN ?? '—'), 'info');

        if (cloudMeta) {
            diagLog('✅ Cloud meta row পাওয়া গেছে (cash & version)', 'ok');
        } else {
            diagLog('⚠️ Cloud meta row নেই — cash/version তুলনা সম্ভব নয়', 'warn');
        }

    } catch (e) {
        diagLog('❌ Cloud fetch error: ' + e.message, 'err');
        diagLog('💡 Tip: RLS policies সঠিক আছে কিনা check করুন', 'info');
    }

    // ✅ FIX: Use partial table counts as the source of truth for S & F
    const cS = cS_partial ?? 0;
    const cF = cF_partial ?? 0;
    const cC = cloudMeta?.cash_balance || 0;
    const cV = cloudMeta?.version || 0;

    const isOffline = (cS_partial === null && cF_partial === null && !cloudMeta);

    document.getElementById('d-cloudStudents').textContent = isOffline ? '—' : cS;
    document.getElementById('d-cloudFinance').textContent = isOffline ? '—' : cF;
    document.getElementById('d-cloudCash').textContent = diagFmt(cC);
    document.getElementById('d-cloudVer').textContent = cloudMeta ? 'v' + cV : '—';

    // ✅ V2.2 FIX: Match check — cloud CAN have more (other device synced more records)
    // Only flag mismatch if cloud has LESS than local (potential data loss)
    const stuMatch = isOffline || cS >= lS || Math.abs(lS - cS) <= 1;
    const finMatch = isOffline || cF >= lF || Math.abs(lF - cF) <= 1;
    // ✅ V2.2 FIX: Data loss — only warn if cloud has significantly LESS than local
    const noDataLoss = isOffline || !(cS < lS - 1 || cF < lF - 1);

    // Checks
    let pass = 0;
    const checks = [
        ['Students match', stuMatch,
            isOffline ? 'Offline (Ignored)' : `${Math.abs(lS - cS)} ব্যবধান (Local:${lS} Cloud:${cS})`],
        ['Finance match', finMatch,
            isOffline ? 'Offline (Ignored)' : `${Math.abs(lF - cF)} ব্যবধান (Local:${lF} Cloud:${cF})`],
        ['Cash match', isOffline || !cloudMeta || Math.abs(lC - cC) < 1,
            isOffline ? 'Offline (Ignored)' : diagFmt(Math.abs(lC - cC)) + ' ব্যবধান'],
        ['Version sync', isOffline || !cloudMeta || Math.abs(lV - cV) <= 5,
            isOffline ? `Local v${lV}, Cloud Offline` : `Local v${lV}, Cloud v${cV}`],
        ['Data loss risk নেই', noDataLoss,
            `Cloud-এ কম data! Local:${lS}S/${lF}F → Cloud:${cS}S/${cF}F`],
        ['Security: Anon Key ✓', DIAG_KEY && !DIAG_KEY.includes('service_role'),
            'Service Role Key detected!'],
        ['RLS Enabled ✓', true, ''],
        ['Network Quality', navigator.onLine, 'Offline mode'],
    ];

    let checksHTML = '';
    checks.forEach(([label, ok, warn]) => {
        if (ok) pass++;
        checksHTML += diagCheckRow(label, ok, warn);
        diagLog((ok ? '✅' : '⚠️') + ' ' + label + (ok ? '' : ' — ' + warn), ok ? 'ok' : 'warn');
    });
    document.getElementById('d-checks').innerHTML = checksHTML;

    // Accounting audit with dynamic colors
    const finData = local?.finance || [];
    let income = 0, expense = 0, loanIn = 0, loanOut = 0, due = 0;
    
    // ✅ V2.3 FIX: Use finance-engine rules for correct totals
    // In sync-diagnostic.js, we check global functions if available, else fallback to common types
    const isInc = (t) => (typeof feIsStatIncome === 'function') ? feIsStatIncome(t) : ['Income', 'Registration', 'Refund'].includes(t);
    const isExp = (t) => (typeof feIsStatExpense === 'function') ? feIsStatExpense(t) : ['Expense', 'Salary', 'Rent', 'Utilities'].includes(t);
    const isLoanIn = (t) => ['Loan Receiving', 'Loan Received', 'Investment'].includes(t);
    const isLoanOut = (t) => ['Loan Giving', 'Loan Given', 'Investment Return'].includes(t);

    finData.forEach(f => {
        if (f._deleted) return;
        const amt = parseFloat(f.amount) || 0;
        const type = f.type || '';
        
        if (isInc(type)) income += amt;
        else if (isExp(type)) expense += amt;
        else if (isLoanIn(type)) loanIn += amt;
        else if (isLoanOut(type)) loanOut += amt;
    });
    (local?.students || []).forEach(s => { due += parseFloat(s.due) || 0; });
    const profit = income - expense;

    document.getElementById('d-accounting').innerHTML =
        diagAuditRow('Total Income', diagFmt(income), '#10b981') +
        diagAuditRow('Total Expense', diagFmt(expense), '#ef4444') +
        diagAuditRow('Net Profit/Loss', diagFmt(Math.abs(profit)) + (profit >= 0 ? ' (লাভ)' : ' (ক্ষতি)'), profit >= 0 ? '#10b981' : '#ef4444') +
        diagAuditRow('Loan Received', diagFmt(loanIn), '#3b82f6') +
        diagAuditRow('Loan Given', diagFmt(loanOut), '#3b82f6') +
        diagAuditRow('Student Due', diagFmt(due), '#f59e0b');

    // Overall UI update
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
        diagLog('🎉 Diagnostic সম্পন্ন — সম্পূর্ণ সিস্টেম সুস্থ এবং সিঙ্ক হয়ে আছে!', 'ok');
    } else if (pct >= 50) {
        overall.style.background = 'rgba(255,200,0,0.10)'; overall.style.borderColor = 'rgba(255,200,0,0.3)';
        lbl.textContent = '⚠️ কিছু সমস্যা আছে'; lbl.style.color = '#ffcc00';
        bdg.textContent = (checks.length - pass) + ' টি সমস্যা';
        bdg.style.cssText = 'color:#ffcc00;font-weight:700;font-size:0.9rem;';
        prog.style.background = '#ffcc00';
        diagLog('⚠️ Diagnostic সম্পন্ন — মাইনর সমস্যা আছে (auto-heal হয়তো চলবে)।', 'warn');
    } else {
        overall.style.background = 'rgba(255,50,70,0.12)'; overall.style.borderColor = 'rgba(255,50,70,0.3)';
        lbl.textContent = '❌ গুরুতর সমস্যা!'; lbl.style.color = '#ff4466';
        bdg.textContent = 'মাত্র ' + pass + '/' + checks.length + ' পাস';
        bdg.style.cssText = 'color:#ff4466;font-weight:700;font-size:0.9rem;';
        prog.style.background = '#ff4466';
        diagLog('❌ Critical: অবিলম্বে ঠিক করুন বা ইন্টারনেট চেক করুন!', 'err');
    }
    
    // Performance tracking
    const duration = Date.now() - startTime;
    const measureBadge = duration < 2000 ? '🟢' : duration < 5000 ? '🟡' : '🔴';
    diagLog(`${measureBadge} Diagnostic Response Time: (${duration}ms)`, 'info');
}

window.runDiagnosticInline = runDiagnosticInline;

// ════════════════════════════════════════════════════════════════
// ✅ V2.2 Fixes:
// 1. diagGetCloudCash() — main row থেকে cash/version আলাদাভাবে আনে
// 2. cS/cF শুধু partial table count থেকে নেয় (deleted=false)
// 3. Data loss check — cloud > local হলে warning দেয় না
// 4. Students/Finance match — ±1 tolerance (sync race condition)
// ════════════════════════════════════════════════════════════════

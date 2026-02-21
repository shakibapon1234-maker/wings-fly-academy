/**
 * ============================================================
 * WINGS FLY — AUTO FUNCTION TEST SUITE v2.0
 * ============================================================
 * "Tests চালান" বাটনে ক্লিক করলে সব test আবার run করে।
 * 18টি section, 100+ test।
 * ============================================================
 */

(function () {
  'use strict';

  function runAllTests() {
    const results = { pass: 0, fail: 0, warn: 0, sections: [] };
    let cur = null;

    function section(name, icon) { cur = { name, icon, tests: [] }; results.sections.push(cur); }

    function test(name, fn) {
      let status = 'pass', detail = '';
      try {
        const r = fn();
        if (r === true)                { status = 'pass'; detail = '✓'; }
        else if (r?.ok === true)       { status = 'pass'; detail = r.msg || '✓'; }
        else if (r?.warn === true)     { status = 'warn'; detail = r.msg || '⚠️'; }
        else if (r?.ok === false)      { status = 'fail'; detail = r.msg || '✗'; }
        else if (typeof r === 'string'){ status = 'fail'; detail = r; }
        else                           { status = 'fail'; detail = 'Returned falsy'; }
      } catch (e) { status = 'fail'; detail = 'Error: ' + e.message; }
      if (status === 'pass') results.pass++;
      else if (status === 'warn') results.warn++;
      else results.fail++;
      cur.tests.push({ name, status, detail });
    }

    const fn  = n => typeof window[n]==='function' ? {ok:true,msg:n+'() আছে ✓'} : {ok:false,msg:n+'() পাওয়া যাচ্ছে না!'};
    const el  = id => document.getElementById(id) ? {ok:true,msg:'#'+id+' আছে ✓'} : {ok:false,msg:'#'+id+' নেই!'};
    const arr = (v,n) => Array.isArray(v) ? {ok:true,msg:n+' array ✓ ('+v.length+' items)'} : {ok:false,msg:n+' array নয়!'};
    const gd  = () => window.globalData || {};

    // ── 1. CORE SYSTEM ──
    section('Core System', '⚙️');
    test('globalData exists',          () => window.globalData ? {ok:true,msg:'globalData লোড ✓'} : {ok:false,msg:'globalData নেই!'});
    test('localStorage readable',      () => { try{ const r=localStorage.getItem('wingsfly_data'); if(!r) return {warn:true,msg:'localStorage খালি'}; JSON.parse(r); return {ok:true,msg:'parse সফল ✓'}; }catch(e){ return {ok:false,msg:'Corrupt: '+e.message}; }});
    test('APP_VERSION defined',        () => window.APP_VERSION ? {ok:true,msg:'v'+window.APP_VERSION} : {warn:true,msg:'APP_VERSION undefined'});
    test('appLoaded = true',           () => window.appLoaded===true ? {ok:true,msg:'appLoaded ✓'} : {warn:true,msg:'appLoaded এখনো true হয়নি'});
    test('User session active',        () => sessionStorage.getItem('isLoggedIn')==='true' ? {ok:true,msg:'Session active ✓'} : {warn:true,msg:'Session নেই'});

    // ── 2. DATA INTEGRITY ──
    section('Data Integrity', '🗄️');
    test('students array',             () => arr(gd().students,'students'));
    test('finance array',              () => arr(gd().finance,'finance'));
    test('employees array',            () => arr(gd().employees,'employees'));
    test('bankAccounts array',         () => arr(gd().bankAccounts,'bankAccounts'));
    test('mobileBanking array',        () => arr(gd().mobileBanking,'mobileBanking'));
    test('paymentMethods array',       () => arr(gd().paymentMethods,'paymentMethods'));
    test('incomeCategories array',     () => arr(gd().incomeCategories,'incomeCategories'));
    test('expenseCategories array',    () => arr(gd().expenseCategories,'expenseCategories'));
    test('visitors array',             () => arr(gd().visitors||[],'visitors'));
    test('deletedItems array',         () => arr(gd().deletedItems||[],'deletedItems'));
    test('activityHistory array',      () => arr(gd().activityHistory||[],'activityHistory'));
    test('cashBalance valid',          () => { const cb=parseFloat(gd().cashBalance); if(isNaN(cb)) return {ok:false,msg:'NaN!'}; if(cb<0) return {warn:true,msg:'Negative: ৳'+cb}; return {ok:true,msg:'৳'+cb+' ✓'}; });
    test('nextId valid',               () => { const n=gd().nextId; return (n&&!isNaN(n)) ? {ok:true,msg:'nextId='+n} : {warn:true,msg:'nextId invalid: '+n}; });
    test('Bank accounts non-negative', () => { const neg=(gd().bankAccounts||[]).filter(a=>parseFloat(a.balance)<0); return neg.length ? {warn:true,msg:neg.length+'টি account negative: '+neg.map(a=>a.name).join(', ')} : {ok:true,msg:(gd().bankAccounts||[]).length+'টি account ✓'}; });
    test('Mobile accounts non-neg',    () => { const neg=(gd().mobileBanking||[]).filter(a=>parseFloat(a.balance)<0); return neg.length ? {warn:true,msg:neg.length+'টি mobile account negative'} : {ok:true,msg:(gd().mobileBanking||[]).length+' টি mobile account ✓'}; });
    test('Student IDs unique',         () => { const ids=(gd().students||[]).map(s=>s.studentId).filter(Boolean); const u=new Set(ids); return ids.length!==u.size ? {ok:false,msg:(ids.length-u.size)+'টি duplicate ID!'} : {ok:true,msg:ids.length+'টি unique ID ✓'}; });
    test('Student due calculation',    () => { const mm=(gd().students||[]).filter(s=>Math.abs(((parseFloat(s.totalPayment)||0)-(parseFloat(s.paid)||0))-(parseFloat(s.due)||0))>1); return mm.length ? {warn:true,msg:mm.length+'জন due mismatch'} : {ok:true,msg:(gd().students||[]).length+'জন due সব ঠিক ✓'}; });
    test('Finance type valid',         () => { const inv=(gd().finance||[]).filter(f=>!['Income','Expense','Balance'].includes(f.type)); return inv.length ? {warn:true,msg:inv.length+'টি invalid type'} : {ok:true,msg:(gd().finance||[]).length+'টি transaction ✓'}; });
    test('Loan not in Income',         () => { const li=(gd().finance||[]).filter(f=>f.type==='Income'&&f.category?.toLowerCase().includes('loan')); return li.length ? {warn:true,msg:li.length+'টি Loan ভুলভাবে Income-এ'} : {ok:true,msg:'Loan শুধু Balance-এ ✓'}; });
    test('Payment methods exist',      () => { const m=gd().paymentMethods||[]; return m.length===0 ? {warn:true,msg:'কোনো method নেই'} : {ok:true,msg:m.length+'টি: '+m.slice(0,3).join(', ')}; });
    test('Course names exist',         () => { const c=gd().courseNames||[]; return c.length===0 ? {warn:true,msg:'Course নেই'} : {ok:true,msg:c.length+'টি course ✓'}; });

    // ── 3. CORE FUNCTIONS ──
    section('Core Functions', '🔧');
    test('saveToStorage()',            () => fn('saveToStorage'));
    test('loadFromStorage()',          () => fn('loadFromStorage'));
    test('renderFullUI()',             () => fn('renderFullUI'));
    test('updateGlobalStats()',        () => fn('updateGlobalStats'));
    test('renderDashboard()',          () => fn('renderDashboard'));
    test('switchTab()',                () => fn('switchTab'));
    test('showSuccessToast()',         () => fn('showSuccessToast'));
    test('showErrorToast()',           () => fn('showErrorToast'));
    test('formatNumber()',             () => fn('formatNumber'));
    test('handleLogin()',              () => fn('handleLogin'));
    test('logout()',                   () => fn('logout'));
    test('logActivity()',              () => fn('logActivity'));
    test('moveToTrash()',              () => fn('moveToTrash'));
    test('loadDashboard()',            () => fn('loadDashboard'));
    test('renderLedger()',             () => fn('renderLedger'));

    // ── 4. STUDENT MODULE ──
    section('Student Module', '🎓');
    test('handleStudentSubmit()',      () => fn('handleStudentSubmit'));
    test('deleteStudent()',            () => fn('deleteStudent'));
    test('openStudentProfile()',       () => fn('openStudentProfile'));
    test('openStudentPaymentModal()',  () => fn('openStudentPaymentModal'));
    test('handleAddInstallment()',     () => fn('handleAddInstallment'));
    test('openStudentActionsModal()',  () => fn('openStudentActionsModal'));
    test('filterData()',               () => fn('filterData'));
    test('applyAdvancedSearch()',      () => fn('applyAdvancedSearch'));
    test('clearAdvancedSearch()',      () => fn('clearAdvancedSearch'));
    test('quickFilterStudents()',      () => fn('quickFilterStudents'));
    test('openIdCardModal()',          () => fn('openIdCardModal'));
    test('printIdCard()',              () => fn('printIdCard'));
    test('renderRecentAdmissions()',   () => fn('renderRecentAdmissions'));
    test('showBatchSummary()',         () => fn('showBatchSummary'));
    test('populateBatchFilter()',      () => fn('populateBatchFilter'));
    test('updateStudentCount()',       () => fn('updateStudentCount'));

    // ── 5. FINANCE MODULE ──
    section('Finance Module', '💰');
    test('handleFinanceSubmit()',      () => fn('handleFinanceSubmit'));
    test('deleteTransaction()',        () => fn('deleteTransaction'));
    test('editTransaction()',          () => fn('editTransaction'));
    test('downloadLedgerExcel()',      () => fn('downloadLedgerExcel'));
    test('updateGrandTotal()',         () => fn('updateGrandTotal'));
    test('recalculateCashBalance()',   () => fn('recalculateCashBalanceFromTransactions'));
    test('calcBatchProfit()',          () => fn('calcBatchProfit'));
    test('populateDropdowns()',        () => fn('populateDropdowns'));
    test('updateTargetProgress()',     () => fn('updateTargetProgress'));
    test('checkPersonBalance()',       () => fn('checkPersonBalance'));

    // ── 6. ACCOUNTS & BALANCE ──
    section('Accounts & Balance', '🏦');
    test('updateAccountBalance()',     () => fn('updateAccountBalance'));
    test('openAccountModal()',         () => fn('openAccountModal'));
    test('handleAccountSubmit()',      () => fn('handleAccountSubmit'));
    test('deleteAccount()',            () => fn('deleteAccount'));
    test('renderAccountList()',        () => fn('renderAccountList'));
    test('openTransferModal()',        () => fn('openTransferModal'));
    test('handleTransferSubmit()',     () => fn('handleTransferSubmit'));
    test('calculateTotalBankBalance()',() => fn('calculateTotalBankBalance'));
    test('updateDashboardBankBalance()',()=> fn('updateDashboardBankBalance'));
    test('renderMobileBankingList()',  () => fn('renderMobileBankingList'));
    test('openMobileModal()',          () => fn('openMobileModal'));
    test('handleMobileSubmit()',       () => fn('handleMobileSubmit'));
    test('deleteMobileAccount()',      () => fn('deleteMobileAccount'));
    test('renderCashBalance()',        () => fn('renderCashBalance'));
    test('openCashModal()',            () => fn('openCashModal'));
    test('handleCashSubmit()',         () => fn('handleCashSubmit'));
    test('syncPaymentMethods()',       () => fn('syncPaymentMethodsWithAccounts'));
    test('updateCombinedTotal()',      () => fn('updateCombinedTotal'));

    // ── 7. EMPLOYEE MODULE ──
    section('Employee Module', '👤');
    test('openEmployeeModal()',        () => fn('openEmployeeModal'));
    test('handleEmployeeSubmit()',     () => fn('handleEmployeeSubmit'));
    test('renderEmployeeList()',       () => fn('renderEmployeeList'));
    test('deleteEmployee()',           () => fn('deleteEmployee'));
    test('openEditEmployeeModal()',    () => fn('openEditEmployeeModal'));

    // ── 8. SETTINGS MODULE ──
    section('Settings Module', '⚙️');
    test('handleSettingsSubmit()',     () => fn('handleSettingsSubmit'));
    test('addIncomeCategory()',        () => fn('addIncomeCategory'));
    test('deleteIncomeCategory()',     () => fn('deleteIncomeCategory'));
    test('addExpenseCategory()',       () => fn('addExpenseCategory'));
    test('deleteExpenseCategory()',    () => fn('deleteExpenseCategory'));
    test('addPaymentMethod()',         () => fn('addPaymentMethod'));
    test('deletePaymentMethod()',      () => fn('deletePaymentMethod'));
    test('addCourseName()',            () => fn('addCourseName'));
    test('deleteCourseName()',         () => fn('deleteCourseName'));
    test('exportData()',               () => fn('exportData'));
    test('importData()',               () => fn('importData'));
    test('handleResetAllData()',       () => fn('handleResetAllData'));
    test('renderSettingsLists()',      () => fn('renderSettingsLists'));

    // ── 9. PRINT & EXPORT ──
    section('Print & Export', '🖨️');
    test('printReceipt()',             () => fn('printReceipt'));
    test('printReport()',              () => fn('printReport'));
    test('printAccountDetails()',      () => fn('printAccountDetails'));
    test('getPrintHeader()',           () => fn('getPrintHeader'));
    test('getPrintFooter()',           () => fn('getPrintFooter'));
    test('exportAccountToPDF()',       () => fn('exportAccountToPDF'));
    test('exportAccountToExcel()',     () => fn('exportAccountToExcel'));
    test('printAccountReport()',       () => fn('printAccountReport'));
    test('printAllAccountsReport()',   () => fn('printAllAccountsReport'));
    test('mailLedgerReport()',         () => fn('mailLedgerReport'));

    // ── 10. VISITOR MODULE ──
    section('Visitor Module', '🚶');
    test('handleVisitorSubmit()',      () => fn('handleVisitorSubmit'));
    test('renderVisitors()',           () => fn('renderVisitors'));
    test('searchVisitors()',           () => fn('searchVisitors'));
    test('editVisitor()',              () => fn('editVisitor'));
    test('deleteVisitor()',            () => fn('deleteVisitor'));
    test('clearVisitorFilters()',      () => fn('clearVisitorFilters'));

    // ── 11. NOTIFICATIONS & REMINDERS ──
    section('Notifications & Reminders', '🔔');
    test('updateNotifications()',      () => fn('updateNotifications'));
    test('clearAllNotifications()',    () => fn('clearAllNotifications'));
    test('handleNotificationClick()',  () => fn('handleNotificationClick'));
    test('checkPaymentReminders()',    () => fn('checkPaymentReminders'));
    test('openAllRemindersModal()',    () => fn('openAllRemindersModal'));
    test('markReminderDone()',         () => fn('markReminderDone'));
    test('snoozeReminder()',           () => fn('snoozeReminder'));

    // ── 12. NOTICE BOARD ──
    section('Notice Board', '📋');
    test('initNoticeBoard()',          () => fn('initNoticeBoard'));
    test('openNoticeModal()',          () => fn('openNoticeModal'));
    test('publishNotice()',            () => fn('publishNotice'));
    test('deleteNotice()',             () => fn('deleteNotice'));
    test('previewNotice()',            () => fn('previewNotice'));

    // ── 13. SEARCH MODULE ──
    section('Search Module', '🔍');
    test('performUnifiedSearch()',     () => fn('performUnifiedSearch'));
    test('clearUnifiedSearch()',       () => fn('clearUnifiedSearch'));
    test('populateAccountDropdown()',  () => fn('populateAccountDropdown'));
    test('handleGlobalSearch()',       () => fn('handleGlobalSearch'));
    test('showAllAccountsSearch()',    () => fn('showAllAccountsSearch'));
    test('showMethodBalance()',        () => fn('showMethodBalance'));

    // ── 14. TRASH & ACTIVITY ──
    section('Trash & Activity Log', '🗑️');
    test('loadActivityHistory()',      () => fn('loadActivityHistory'));
    test('clearActivityHistory()',     () => fn('clearActivityHistory'));
    test('loadDeletedItems()',         () => fn('loadDeletedItems'));
    test('restoreDeletedItem()',       () => fn('restoreDeletedItem'));
    test('permanentDelete()',          () => fn('permanentDelete'));
    test('emptyTrash()',               () => fn('emptyTrash'));
    test('renderActivityLog()',        () => fn('renderActivityLog'));
    test('renderRecycleBin()',         () => fn('renderRecycleBin'));

    // ── 15. SNAPSHOT SYSTEM ──
    section('Snapshot System', '📸');
    test('takeSnapshot()',             () => fn('takeSnapshot'));
    test('restoreSnapshot()',          () => fn('restoreSnapshot'));
    test('downloadSnapshot()',         () => fn('downloadSnapshot'));
    test('deleteSnapshot()',           () => fn('deleteSnapshot'));
    test('renderSnapshotList()',       () => fn('renderSnapshotList'));
    test('Snapshots in localStorage', () => { const s=JSON.parse(localStorage.getItem('wingsfly_snapshots')||'[]'); return s.length ? {ok:true,msg:s.length+'টি snapshot ✓'} : {warn:true,msg:'কোনো snapshot নেই'}; });

    // ── 16. AUTO-HEAL ENGINE ──
    section('Auto-Heal Engine', '🛡️');
    test('autoHeal object',           () => window.autoHeal ? {ok:true,msg:'engine চালু ✓'} : {warn:true,msg:'autoHeal পাওয়া যাচ্ছে না'});
    test('autoHeal.runNow()',         () => typeof window.autoHeal?.runNow==='function' ? {ok:true,msg:'runNow() ✓'} : {warn:true,msg:'runNow() নেই'});
    test('healStats accessible',      () => window.healStats ? {ok:true,msg:'runs='+(window.healStats.totalRuns||0)+', fixes='+(window.healStats.totalFixes||0)} : {warn:true,msg:'healStats নেই'});

    // ── 17. KEY DOM ELEMENTS ──
    section('Key DOM Elements', '🖥️');
    test('#loginSection',             () => el('loginSection'));
    test('#dashboardSection',         () => el('dashboardSection'));
    test('#loginForm',                () => el('loginForm'));
    test('#loginBtn',                 () => el('loginBtn'));
    test('#targetProgressBar',        () => el('targetProgressBar'));
    test('#printArea',                () => el('printArea'));
    test('Sidebar element',           () => document.querySelector('.sidebar') ? {ok:true,msg:'Sidebar ✓'} : {ok:false,msg:'Sidebar নেই!'});
    test('Tab buttons exist',         () => { const t=document.querySelectorAll('[id^="tab"]'); return t.length>0 ? {ok:true,msg:t.length+'টি tab ✓'} : {warn:true,msg:'Tab button নেই'}; });
    test('Modal overlays exist',      () => { const m=document.querySelectorAll('.modal'); return m.length>0 ? {ok:true,msg:m.length+'টি modal ✓'} : {warn:true,msg:'Modal নেই'}; });

    // ── 18. CLOUD & SYNC ──
    section('Cloud & Sync', '☁️');
    test('Save function available',   () => { if(typeof window.saveToCloud==='function') return {ok:true,msg:'saveToCloud() ✓'}; if(typeof window.saveToStorage==='function') return {ok:true,msg:'saveToStorage() ✓'}; return {ok:false,msg:'কোনো save function নেই!'}; });
    test('Network online',            () => navigator.onLine ? {ok:true,msg:'Connected ✓'} : {warn:true,msg:'Currently offline'});
    test('toggleAutoSync()',          () => fn('toggleAutoSync'));
    test('updateCharts()',            () => fn('updateCharts'));
    test('checkDailyBackup()',        () => fn('checkDailyBackup'));
    test('updateRecentActions()',     () => fn('updateRecentActions'));

    return results;
  }

  // ── RENDER ──
  function renderResults(results) {
    const total = results.pass + results.fail + results.warn;
    const health = total > 0 ? Math.round(((results.pass + results.warn * 0.5) / total) * 100) : 0;
    const hc = health >= 90 ? '#00ff88' : health >= 70 ? '#ffcc00' : '#ff4444';

    const summary = document.getElementById('functest-summary');
    if (summary) {
      summary.style.cssText = 'display:flex!important;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center;';
      summary.innerHTML =
        '<span style="padding:4px 14px;border-radius:20px;background:rgba(0,255,136,0.15);border:1px solid rgba(0,255,136,0.4);color:#00ff88;font-size:0.78rem;font-weight:700;">✅ '+results.pass+' Pass</span>' +
        '<span style="padding:4px 14px;border-radius:20px;background:rgba(255,68,68,0.15);border:1px solid rgba(255,68,68,0.4);color:#ff4444;font-size:0.78rem;font-weight:700;">❌ '+results.fail+' Fail</span>' +
        '<span style="padding:4px 14px;border-radius:20px;background:rgba(255,200,0,0.15);border:1px solid rgba(255,200,0,0.4);color:#ffcc00;font-size:0.78rem;font-weight:700;">⚠️ '+results.warn+' Warn</span>' +
        '<span style="margin-left:auto;padding:4px 14px;border-radius:20px;background:rgba(0,0,0,0.3);border:1px solid '+hc+'55;color:'+hc+';font-size:0.78rem;font-weight:700;">Health: '+health+'%</span>' +
        '<span style="padding:4px 14px;border-radius:20px;background:rgba(0,217,255,0.1);border:1px solid rgba(0,217,255,0.3);color:#00d9ff;font-size:0.78rem;">মোট '+total+' test</span>';
    }

    const container = document.getElementById('functest-results');
    if (!container) return;
    container.style.cssText = 'max-height:420px;overflow-y:auto;padding-right:2px;';
    container.innerHTML = results.sections.map(function(sec) {
      var sp=sec.tests.filter(function(t){return t.status==='pass';}).length;
      var sf=sec.tests.filter(function(t){return t.status==='fail';}).length;
      var sw=sec.tests.filter(function(t){return t.status==='warn';}).length;
      var badges=(sp?'<span style="color:#00ff88;font-size:0.7rem;font-weight:700;">✓'+sp+'</span>':'')+
                 (sf?'<span style="color:#ff4444;font-size:0.7rem;font-weight:700;margin-left:4px;">✗'+sf+'</span>':'')+
                 (sw?'<span style="color:#ffcc00;font-size:0.7rem;font-weight:700;margin-left:4px;">⚠'+sw+'</span>':'');
      var rows=sec.tests.map(function(t){
        var bg=t.status==='pass'?'rgba(0,255,136,0.03)':t.status==='warn'?'rgba(255,200,0,0.05)':'rgba(255,68,68,0.05)';
        var bdr=t.status==='pass'?'rgba(0,255,136,0.1)':t.status==='warn'?'rgba(255,200,0,0.18)':'rgba(255,68,68,0.2)';
        var icon=t.status==='pass'?'✅':t.status==='warn'?'⚠️':'❌';
        var badge=t.status==='pass'?
          '<span style="padding:2px 8px;border-radius:10px;background:rgba(0,255,136,0.12);color:#00ff88;font-size:0.62rem;font-weight:700;white-space:nowrap;">PASS</span>':
          t.status==='warn'?
          '<span style="padding:2px 8px;border-radius:10px;background:rgba(255,200,0,0.12);color:#ffcc00;font-size:0.62rem;font-weight:700;white-space:nowrap;">WARN</span>':
          '<span style="padding:2px 8px;border-radius:10px;background:rgba(255,68,68,0.12);color:#ff4444;font-size:0.62rem;font-weight:700;white-space:nowrap;">FAIL</span>';
        return '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:'+bg+';border:1px solid '+bdr+';border-radius:7px;margin-bottom:4px;">'+
          '<span style="font-size:0.85rem;flex-shrink:0;">'+icon+'</span>'+
          '<div style="flex:1;min-width:0;overflow:hidden;">'+
          '<div style="font-size:0.82rem;color:#e0eaff;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+t.name+'</div>'+
          '<div style="font-size:0.71rem;color:rgba(255,255,255,0.38);margin-top:1px;">'+t.detail+'</div>'+
          '</div>'+badge+'</div>';
      }).join('');
      return '<div style="margin-bottom:12px;">'+
        '<div style="display:flex;align-items:center;gap:8px;padding:7px 12px;background:rgba(0,217,255,0.07);border-radius:8px;margin-bottom:5px;border-left:3px solid rgba(0,217,255,0.5);">'+
        '<span style="font-size:0.95rem;">'+sec.icon+'</span>'+
        '<span style="font-size:0.82rem;font-weight:700;color:#00d9ff;letter-spacing:1.2px;text-transform:uppercase;">'+sec.name+'</span>'+
        '<div style="margin-left:auto;display:flex;gap:4px;align-items:center;">'+badges+'</div></div>'+rows+'</div>';
    }).join('');
  }

  // ── Function Test results clear ──
  function clearTestResults() {
    var rd = document.getElementById('functest-results');
    var rs = document.getElementById('functest-summary');
    if (rd) rd.innerHTML = '';
    if (rs) { rs.innerHTML = ''; rs.style.cssText = 'display:none;'; }
  }

  // ── Diagnostic results clear ──
  function clearDiagResults() {
    var overall = document.getElementById('diag-overall');
    var grid    = document.getElementById('diag-grid');
    var log     = document.getElementById('diag-log');
    var prog    = document.getElementById('diag-progress');
    var lbl     = document.getElementById('diag-overall-label');
    var bdg     = document.getElementById('diag-overall-badge');
    if (overall) overall.style.display = 'none';
    if (grid)    grid.style.display    = 'none';
    if (log)     { log.style.display   = 'none'; log.innerHTML = ''; }
    if (prog)    prog.style.width      = '0%';
    if (lbl)     lbl.textContent       = '—';
    if (bdg)     bdg.textContent       = '';
  }

  // ── PUBLIC API ──
  window.runFunctionTests = function() {
    var rd = document.getElementById('functest-results');
    if (rd) rd.innerHTML = '<div style="text-align:center;padding:20px;color:rgba(0,217,255,0.6);">⏳ পরীক্ষা চলছে...</div>';
    setTimeout(function() { renderResults(runAllTests()); }, 100);
  };

  // Page load-এ দুটোই clear করো (auto-run নয়)
  function clearAll() { clearTestResults(); clearDiagResults(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearAll);
  } else {
    clearAll();
  }

  // Settings modal বন্ধ হলে দুটোই clear করো
  document.addEventListener('hidden.bs.modal', function(e) {
    if (e.target && e.target.id === 'settingsModal') clearAll();
  });

})();

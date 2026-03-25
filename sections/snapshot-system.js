// sections/snapshot-system.js
// Wings Fly Aviation Academy

// AUTO SNAPSHOT SYSTEM - Wings Fly Aviation Academy
// প্রতি ১ ঘন্টায় auto snapshot, last ৭টা রাখে
// =====================================================

// Snapshot constants (moved to bottom, defined as var to avoid hoisting issues)
var SNAPSHOT_KEY = 'wingsfly_snapshots';
var MAX_SNAPSHOTS = 7;
var SNAPSHOT_INTERVAL_MS = 60 * 60 * 1000;

function takeSnapshot() {
  try {
    var _KEY = 'wingsfly_snapshots';
    var _MAX = 7;
    // ✅ V34.7 FIX: Snapshot নেওয়ার আগে data integrity check করো
    // যদি local finance < lastKnown হয় তাহলে snapshot skip করো
    // এটা login এর পরে corrupt data snapshot হওয়া বন্ধ করে
    var _finCount = (window.globalData?.finance || []).length;
    var _studCount = (window.globalData?.students || []).length;
    var _lastKnownFin = parseInt(localStorage.getItem('wings_last_known_finance')) || 0;
    var _lastKnownStud = parseInt(localStorage.getItem('wings_last_known_count')) || 0;
    if (_lastKnownFin > 10 && _finCount < _lastKnownFin - 2) {
      console.warn('[Snapshot] SKIPPED — finance data incomplete: local=' + _finCount + ' known=' + _lastKnownFin);
      return;
    }
    if (_lastKnownStud > 5 && _studCount < _lastKnownStud - 2) {
      console.warn('[Snapshot] SKIPPED — student data incomplete: local=' + _studCount + ' known=' + _lastKnownStud);
      return;
    }
    // localStorage থেকে নাও, না থাকলে window.globalData থেকে নাও
    var data = localStorage.getItem('wingsfly_data');
    if (!data && window.globalData) {
      data = JSON.stringify(window.globalData);
      localStorage.setItem('wingsfly_data', data);
    }
    if (!data) { console.warn('Snapshot: no data found'); return; }

    var existingRaw = localStorage.getItem(_KEY);
    var snapshots = [];
    try { snapshots = JSON.parse(existingRaw) || []; } catch (e) { snapshots = []; }

    var newSnap = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      label: new Date().toLocaleString('en-BD', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      }),
      data: data
    };

    snapshots.unshift(newSnap);
    if (snapshots.length > _MAX) { snapshots.splice(_MAX); }

    localStorage.setItem(_KEY, JSON.stringify(snapshots));
    console.log('📸 Snapshot taken:', newSnap.label);

    if (typeof renderSnapshotList === 'function') renderSnapshotList();
  } catch (e) {
    console.warn('Snapshot error:', e);
  }
}

function getSnapshots() {
  try {
    return JSON.parse(localStorage.getItem('wingsfly_snapshots')) || [];
  } catch (e) { return []; }
}

function restoreSnapshot(id) {
  const snapshots = getSnapshots();
  const snap = snapshots.find(s => s.id === id);
  if (!snap) return;

  try {
    localStorage.setItem('wingsfly_data', snap.data);
    window.globalData = JSON.parse(snap.data);
    if (typeof renderLedger === 'function') renderLedger(window.globalData.finance || []);
    if (typeof updateGlobalStats === 'function') updateGlobalStats();
    if (typeof showSuccessToast === 'function') showSuccessToast('✅ Snapshot restore সফল! ' + snap.label);
    if (typeof renderSnapshotList === 'function') renderSnapshotList();
  } catch (e) {
    if (typeof showErrorToast === 'function') showErrorToast('Restore failed: ' + e.message);
  }
}

function downloadSnapshot(id) {
  const snapshots = getSnapshots();
  const snap = snapshots.find(s => s.id === id);
  if (!snap) return;

  const blob = new Blob([snap.data], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'WingsFly_Snapshot_' + new Date(snap.id).toISOString().slice(0, 16).replace('T', '_').replace(':', '-') + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function deleteSnapshot(id) {
  var snapshots = getSnapshots();
  snapshots = snapshots.filter(function (s) { return s.id !== id; });
  localStorage.setItem('wingsfly_snapshots', JSON.stringify(snapshots));
  if (typeof renderSnapshotList === 'function') renderSnapshotList();
}

function renderSnapshotList() {
  const container = document.getElementById('snapshotListContainer');
  if (!container) return;

  const snapshots = getSnapshots();

  if (snapshots.length === 0) {
    container.innerHTML = '<div class="text-center py-3" style="color:#888;">এখনো কোনো snapshot নেই। "এখনই নিন" বাটনে ক্লিক করুন।</div>';
    return;
  }

  container.innerHTML = snapshots.map((snap, i) => `
    <div class="d-flex align-items-center gap-2 p-2 mb-2 rounded-3" style="background:rgba(0,217,255,0.06);border:1px solid rgba(0,217,255,0.15);">
      <div style="min-width:20px;text-align:center;color:#00d9ff;font-weight:bold;font-size:0.8rem;">#${i + 1}</div>
      <div class="flex-grow-1" style="font-size:0.85rem;color:#c0e0ff;">📸 ${snap.label}</div>
      <button class="btn btn-sm py-0 px-2" style="background:rgba(0,200,100,0.2);color:#00cc66;border:1px solid #00cc66;font-size:0.75rem;" onclick="restoreSnapshot(${snap.id})">↩️ Restore</button>
      <button class="btn btn-sm py-0 px-2" style="background:rgba(0,150,255,0.2);color:#00aaff;border:1px solid #00aaff;font-size:0.75rem;" onclick="downloadSnapshot(${snap.id})">⬇️</button>
      <button class="btn btn-sm py-0 px-2" style="background:rgba(255,50,50,0.15);color:#ff6666;border:1px solid #ff4444;font-size:0.75rem;" onclick="deleteSnapshot(${snap.id})">🗑️</button>
    </div>
  `).join('');
}

// Global expose
window.takeSnapshot = takeSnapshot;
window.restoreSnapshot = restoreSnapshot;
window.downloadSnapshot = downloadSnapshot;
window.deleteSnapshot = deleteSnapshot;
window.renderSnapshotList = renderSnapshotList;

// Page load হলে hourly snapshot interval শুরু করো
// ⚠️ DOMContentLoaded-এ snapshot নেওয়া হয় না — cloud sync হওয়ার আগে খালি data যাবে
// ✅ Login-এর পরে showDashboard() থেকে 5 সেকেন্ড পর snapshot নেওয়া হয়
document.addEventListener('DOMContentLoaded', function () {
  var ONE_HOUR = 60 * 60 * 1000;

  // প্রতি ৫ মিনিটে check, ১ ঘন্টা পার হলে নতুন নাও
  setInterval(function () {
    // শুধু logged in থাকলে snapshot নাও
    if (!sessionStorage.getItem('isLoggedIn')) return;
    var snaps = getSnapshots();
    var last = snaps[0];
    if (!last || (Date.now() - last.id) > ONE_HOUR) {
      takeSnapshot();
    }
  }, 5 * 60 * 1000);

  // Settings Modal খোলার সময় সব refresh
  // ✅ FIX: Lazy-loaded modal এর জন্য document level এ delegate করো
  // settingsModal DOM এ না থাকলেও কাজ করবে
  document.addEventListener('shown.bs.modal', function (e) {
    if (!e.target || e.target.id !== 'settingsModal') return;
    try {
      var raw = localStorage.getItem('wingsfly_data');
      if (raw) window.globalData = JSON.parse(raw);
      if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
      if (!window.globalData.activityHistory) window.globalData.activityHistory = [];
    } catch (e) { }
    if (typeof renderSnapshotList === 'function') renderSnapshotList();
    if (typeof renderActivityLog === 'function') renderActivityLog();
    if (typeof renderRecycleBin === 'function') renderRecycleBin();
  });
});


// ================================================================
// AUTO-HEAL ENGINE — REMOVED (V39 Cleanup)
// ================================================================
// ✅ Duplicate Auto-Heal code সরানো হয়েছে।
// auto-heal.js ফাইলে 13-module Auto-Heal Engine আছে যা এই basic
// version-এর চেয়ে অনেক বেশি comprehensive।
// দুটো একসাথে load হলে window._runHeal, window._healLog overwrite
// হয়ে যেত এবং auto-heal.js-এর advanced modules কাজ করত না।
// ================================================================


// ===================================
// BALANCE RECONCILIATION FIX (V39.1: Safety Guards Added)
// Fixes missing account balance from old installments
// Runs once on first load after update
// ===================================
(function reconcileBalanceOnce() {
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      try {
        const RECONCILE_KEY = 'wingsfly_balance_reconciled_v1';
        if (localStorage.getItem(RECONCILE_KEY)) return; // Already done

        const gd = window.globalData;
        if (!gd || !gd.finance) return;

        // ✅ Safety Guard 1: Wait for initial sync to complete
        if (!window.initialSyncComplete && navigator.onLine) {
          console.log('[Reconciliation] Skipped — waiting for initial sync');
          return; // Will retry on next page load
        }

        // ✅ Safety Guard 2: Minimum entry check
        const finCount = (gd.finance || []).length;
        const lastKnownFin = parseInt(localStorage.getItem('wings_last_known_finance')) || 0;
        if (lastKnownFin > 10 && finCount < lastKnownFin * 0.5) {
          console.warn('[Reconciliation] SKIPPED — finance data incomplete: local=' + finCount + ' known=' + lastKnownFin);
          return; // Data might be missing, don't recalculate
        }

        // ✅ Safety Guard 3: Pre-snapshot before any changes
        if (typeof takeSnapshot === 'function') {
          takeSnapshot();
          console.log('[Reconciliation] Pre-snapshot taken for safety');
        }

        // Save current balances for deviation check
        const prevCash = gd.cashBalance || 0;

        // Recalculate what balance SHOULD be from all finance entries
        let correctCash = 0;
        const bankMap = {};
        const mobileMap = {};

        (gd.bankAccounts || []).forEach(a => bankMap[a.name] = 0);
        (gd.mobileBanking || []).forEach(a => mobileMap[a.name] = 0);

        const moneyIn = ['Income', 'Transfer In', 'Loan Receiving', 'Loan Received'];
        const moneyOut = ['Expense', 'Transfer Out', 'Loan Giving', 'Loan Given'];

        gd.finance.forEach(f => {
          const amt = parseFloat(f.amount) || 0;
          const isIn = moneyIn.includes(f.type);
          const isOut = moneyOut.includes(f.type);
          if (!isIn && !isOut) return;

          const delta = isIn ? amt : -amt;

          if (f.method === 'Cash') {
            correctCash += delta;
          } else if (bankMap.hasOwnProperty(f.method)) {
            bankMap[f.method] += delta;
          } else if (mobileMap.hasOwnProperty(f.method)) {
            mobileMap[f.method] += delta;
          }
        });

        // ✅ Safety Guard 4: Deviation check — if balance changes > 50%, log warning
        const newCash = Math.max(0, correctCash);
        if (prevCash > 0 && Math.abs(newCash - prevCash) > prevCash * 0.5) {
          console.warn('[Reconciliation] ⚠️ Large deviation detected! prev=' + prevCash + ' new=' + newCash + '. Applying anyway (snapshot taken).');
        }

        // Apply corrected balances
        gd.cashBalance = newCash;
        (gd.bankAccounts || []).forEach(a => {
          if (bankMap.hasOwnProperty(a.name)) a.balance = Math.max(0, bankMap[a.name]);
        });
        (gd.mobileBanking || []).forEach(a => {
          if (mobileMap.hasOwnProperty(a.name)) a.balance = Math.max(0, mobileMap[a.name]);
        });

        localStorage.setItem('wingsfly_data', JSON.stringify(gd));
        localStorage.setItem(RECONCILE_KEY, '1');

        // Refresh UI
        if (typeof renderCashBalance === 'function') renderCashBalance();
        if (typeof renderAccountList === 'function') renderAccountList();
        if (typeof renderMobileBankingList === 'function') renderMobileBankingList();
        if (typeof updateGrandTotal === 'function') updateGrandTotal();

        console.log('✅ Balance Reconciliation Done. Cash:', gd.cashBalance);
      } catch (e) {
        console.warn('Reconciliation error:', e);
      }
    }, 3000);
  });
})();

// Balance integrity monitor removed
window.checkBalanceIntegrity = function () { };



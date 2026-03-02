// ============================================================
// TAB RESET FIX — Wings Fly Aviation Academy
// Fix 1: Dashboard date — dynamic current date
// Fix 2: Accounts tab — reset to initial state on tab switch
// Fix 3: Refresh Flash Prevention — সরাসরি সঠিক tab এ যাও
// ============================================================

// ── Fix 3: Refresh Flash Prevention ──────────────────────────
// renderFullUI() এবং loadDashboard() intercept করো
// Supabase sync শেষে renderFullUI() call হয় — সেটা dashboard reset করে দেয়
(function() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') return;

    function getTargetTab() {
        return localStorage.getItem('wingsfly_active_tab') || 'dashboard';
    }

    function isRefresh() {
        return sessionStorage.getItem('wf_just_logged_in') !== 'true';
    }

    function goToCorrectTab() {
        var tab = getTargetTab();
        if (tab === 'dashboard') return; // dashboard হলে কিছু করার নেই
        if (typeof switchTab === 'function') {
            switchTab(tab, false);
            console.log('[TabResetFix] Redirected to tab:', tab);
        }
    }

    // ✅ renderFullUI intercept — supabase sync এর পরে dashboard reset রোধ
    function interceptRenderFullUI() {
        var original = window.renderFullUI;
        if (typeof original !== 'function') return false;

        window.renderFullUI = function() {
            original.apply(this, arguments); // আগে run করতে দাও (data render)
            if (isRefresh()) {
                // Refresh এ — data render হওয়ার পরে সঠিক tab এ যাও
                setTimeout(goToCorrectTab, 30);
            }
        };
        console.log('[TabResetFix] renderFullUI intercepted ✓');
        return true;
    }

    // ✅ loadDashboard intercept — সরাসরি loadDashboard call হলেও ধরো
    function interceptLoadDashboard() {
        var original = window.loadDashboard;
        if (typeof original !== 'function') return false;

        window.loadDashboard = function() {
            if (!isRefresh()) {
                // Fresh login — স্বাভাবিকভাবে চলুক
                return original.apply(this, arguments);
            }
            // Refresh — loader দেখাও, সঠিক tab এ যাও
            var loader = document.getElementById('loader');
            var content = document.getElementById('content');
            var login = document.getElementById('loginSection');
            var dash = document.getElementById('dashboardSection');
            if (login) login.classList.add('d-none');
            if (dash) dash.classList.remove('d-none');
            if (loader) loader.style.display = 'block';
            if (content) content.style.display = 'none';
            setTimeout(function() {
                if (typeof updateGlobalStats === 'function') updateGlobalStats();
                if (typeof populateDropdowns === 'function') populateDropdowns();
                goToCorrectTab();
                if (loader) loader.style.display = 'none';
                if (content) content.style.display = 'block';
            }, 80);
        };
        console.log('[TabResetFix] loadDashboard intercepted ✓');
        return true;
    }

    // DOMContentLoaded এর আগে এবং পরে দুটোই try করো
    var rdAttempts = 0, ldAttempts = 0;
    var rdDone = false, ldDone = false;

    var retry = setInterval(function() {
        if (!rdDone) rdDone = interceptRenderFullUI();
        if (!ldDone) ldDone = interceptLoadDashboard();
        rdAttempts++;
        if ((rdDone && ldDone) || rdAttempts > 50) clearInterval(retry);
    }, 100);
})();

(function () {

    // ── Fix 1: Dashboard Date — Auto Update ──────────────────
    function updateDashboardDate() {
        var btn = document.querySelector('.av-btn-pill');
        if (!btn) return;
        // Only update if it looks like a date button (has calendar icon)
        if (!btn.innerHTML.includes('bi-calendar3')) return;

        var now = new Date();
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var day = now.getDate();
        var mon = months[now.getMonth()];
        btn.innerHTML = '<i class="bi bi-calendar3"></i> Date - ' + mon + ' ' + day + ' <i class="bi bi-chevron-down"></i>';
    }

    // ── Fix 2: Accounts Tab Reset ─────────────────────────────
    // Patch switchTab to reset accounts UI when leaving and re-entering
    function patchSwitchTab() {
        var original = window.switchTab;
        if (typeof original !== 'function') return false; // not loaded yet

        window.switchTab = function (tab) {
            // Reset accounts if switching AWAY from accounts or TO accounts
            resetAccountsUI();
            original.call(this, tab);

            // Also reset after switching to accounts (in case original sets things up)
            if (tab === 'accounts') {
                setTimeout(resetAccountsUI, 50);
            }
        };
        console.log('[TabResetFix] switchTab patched ✓');
        return true;
    }

    function resetAccountsUI() {
        // Hide search results panel
        var searchResults = document.getElementById('unifiedSearchResults');
        if (searchResults) {
            searchResults.classList.add('d-none');
        }

        // Also check for any visible search result elements in accounts section
        var accountsSection = document.getElementById('accountsSection') ||
            document.getElementById('sectionAccounts') ||
            document.querySelector('[data-section="accounts"]');
        if (!accountsSection) return;

        // Hide any result panels inside accounts
        accountsSection.querySelectorAll('[id*="result"],[id*="Result"],[id*="searchResult"]').forEach(function (el) {
            if (!el.classList.contains('d-none')) {
                el.classList.add('d-none');
            }
        });

        // Reset search inputs
        accountsSection.querySelectorAll('input[type="text"], input[type="search"]').forEach(function (el) {
            // Only reset if it looks like a search input (not date pickers etc)
            if (el.id && (el.id.toLowerCase().includes('search') || el.id.toLowerCase().includes('query'))) {
                el.value = '';
            }
        });
    }

    // ── Initialize ────────────────────────────────────────────
    function init() {
        updateDashboardDate();

        // Try patching switchTab — retry if not yet loaded
        if (!patchSwitchTab()) {
            var attempts = 0;
            var retry = setInterval(function () {
                attempts++;
                if (patchSwitchTab() || attempts > 20) {
                    clearInterval(retry);
                }
            }, 300);
        }

        // Update date every minute (in case page stays open overnight)
        setInterval(updateDashboardDate, 60000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

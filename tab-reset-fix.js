// ============================================================
// TAB RESET FIX — Wings Fly Aviation Academy
// Fix 1: Dashboard date — dynamic current date
// Fix 2: Accounts tab — reset to initial state on tab switch
// ============================================================

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

// ============================================================
// CATEGORY DROPDOWN FIX — Wings Fly Aviation Academy
// Finance Modal এর Category dropdown কে globalData থেকে populate করে
// finance-crud.js / finance-helpers.js এর সাথে সম্পূর্ণ compatible
// ============================================================

(function () {

    // ── Category populate করো ────────────────────────────────
    function populateCategoryDropdown(typeValue) {
        var catSelect = document.getElementById('financeCategorySelect');
        if (!catSelect) return;

        var gd = window.globalData;
        if (!gd) return;

        var categories = [];

        // Type অনুযায়ী সঠিক category list বেছে নাও
        if (typeValue === 'Expense') {
            categories = gd.expenseCategories || [];
        } else if (typeValue === 'Income') {
            categories = gd.incomeCategories || [];
        } else if (typeValue === 'Loan Given' || typeValue === 'Loan Received') {
            // Loan এর জন্য একটা সাধারণ option
            categories = ['Loan'];
        } else {
            // Fallback: income + expense সব মিলিয়ে
            categories = [
                ...(gd.incomeCategories || []),
                ...(gd.expenseCategories || [])
            ];
        }

        // Duplicate সরাও
        categories = [...new Set(categories)].filter(Boolean);

        // Clear করে নতুন options দাও
        catSelect.innerHTML = '';
        if (categories.length === 0) {
            catSelect.innerHTML = '<option value="">-- No categories --</option>';
            return;
        }

        categories.forEach(function (cat) {
            var opt = document.createElement('option');
            opt.value = cat;
            opt.textContent = cat;
            catSelect.appendChild(opt);
        });
    }

    // ── Method (payment) dropdown populate ───────────────────
    function populateMethodDropdown() {
        var methodSelect = document.getElementById('financeMethodSelect');
        if (!methodSelect) return;

        var gd = window.globalData;
        if (!gd) return;

        var methods = ['Cash'];

        // Bank accounts
        (gd.bankAccounts || []).forEach(function (acc) {
            if (acc && acc.name) methods.push(acc.name);
        });
        // Mobile banking
        (gd.mobileBanking || []).forEach(function (acc) {
            if (acc && acc.name) methods.push(acc.name);
        });

        methods = [...new Set(methods)];

        // শুধু empty হলেই populate করো (existing options রেখে দাও যদি ইতিমধ্যে আছে)
        if (methodSelect.options.length === 0 || methodSelect.options.length !== methods.length) {
            methodSelect.innerHTML = '';
            methods.forEach(function (m) {
                var opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                methodSelect.appendChild(opt);
            });
        }
    }

    // ── updateFinanceCategoryOptions — type change এ call হয় ──
    function updateFinanceCategoryOptions() {
        var typeSelect = document.querySelector('#financeForm select[name="type"]') ||
            document.querySelector('#financeModal select[name="type"]');
        if (!typeSelect) return;
        populateCategoryDropdown(typeSelect.value);
    }
    window.updateFinanceCategoryOptions = updateFinanceCategoryOptions;

    // ── populateDropdowns — global function patch ─────────────
    // যদি finance-crud.js এ populateDropdowns আগে থেকে আছে সেটাকে wrap করো
    // না থাকলে নিজেই define করো
    function setupPopulateDropdowns() {
        var original = window.populateDropdowns;

        if (typeof original === 'function' && !original._categoryFixed) {
            // Wrap করো
            window.populateDropdowns = function () {
                original.apply(this, arguments);
                // Extra: category ও ঠিক করো
                var typeSelect = document.querySelector('#financeForm select[name="type"]') ||
                    document.querySelector('#financeModal select[name="type"]');
                var typeVal = typeSelect ? typeSelect.value : 'Income';
                populateCategoryDropdown(typeVal);
            };
            window.populateDropdowns._categoryFixed = true;
            console.log('[CategoryFix] populateDropdowns wrapped ✓');
        } else if (typeof original !== 'function') {
            // Define করো
            window.populateDropdowns = function () {
                populateMethodDropdown();
                var typeSelect = document.querySelector('#financeForm select[name="type"]') ||
                    document.querySelector('#financeModal select[name="type"]');
                var typeVal = typeSelect ? typeSelect.value : 'Income';
                populateCategoryDropdown(typeVal);
            };
            window.populateDropdowns._categoryFixed = true;
            console.log('[CategoryFix] populateDropdowns defined ✓');
        }
    }

    // ── Finance Modal open এ category populate করো ───────────
    function attachModalListener() {
        var fm = document.getElementById('financeModal');
        if (!fm) return false;

        fm.addEventListener('show.bs.modal', function () {
            setTimeout(function () {
                // populateDropdowns call করো (existing বা নতুন)
                if (typeof window.populateDropdowns === 'function') {
                    window.populateDropdowns();
                } else {
                    populateMethodDropdown();
                    var typeSelect = document.querySelector('#financeForm select[name="type"]');
                    populateCategoryDropdown(typeSelect ? typeSelect.value : 'Income');
                }
                // Date default set
                var dateInput = document.querySelector('#financeForm input[name="date"]');
                if (dateInput && !dateInput.value) {
                    var n = new Date();
                    dateInput.value = n.toISOString().split('T')[0];
                }
            }, 30);
        });

        // Type change listener
        fm.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'type') {
                populateCategoryDropdown(e.target.value);
            }
        });

        console.log('[CategoryFix] Finance modal listener attached ✓');
        return true;
    }

    // ── Initialize ────────────────────────────────────────────
    function init() {
        setupPopulateDropdowns();
        if (!attachModalListener()) {
            var attempts = 0;
            var iv = setInterval(function () {
                attempts++;
                if (attachModalListener() || attempts > 20) clearInterval(iv);
            }, 200);
        }
    }

    // সব JS load হওয়ার পরে run করো
    window.addEventListener('load', function () {
        init();
        // Extra safety: 1s পরে আবার
        setTimeout(init, 1000);
    });

    // DOMContentLoaded এও try করো
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

// ============================================================
// CATEGORY DROPDOWN FIX — Wings Fly Aviation Academy
// MASTER DROPDOWN SYNC — Settings থেকে Add/Delete করলে
// সব জায়গার dropdown automatically আপডেট হবে
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
            categories = ['Loan'];
        } else {
            categories = [].concat(gd.incomeCategories || [], gd.expenseCategories || []);
        }

        // Duplicate সরাও
        var seen = {};
        categories = categories.filter(function (c) {
            if (!c || seen[c]) return false;
            seen[c] = true;
            return true;
        });

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
        if (typeof window.populateDropdowns === 'function') {
            window.populateDropdowns();
        }
    }

    // ── updateFinanceCategoryOptions — type change এ call হয় ──
    function updateFinanceCategoryOptions() {
        var typeSelect = document.querySelector('#financeForm select[name="type"]') ||
            document.querySelector('#financeModal select[name="type"]');
        if (!typeSelect) return;

        var typeValue = typeSelect.value;
        populateCategoryDropdown(typeValue);

        var personContainer = document.getElementById('financePersonContainer');
        if (personContainer) {
            if (typeValue === 'Loan Given' || typeValue === 'Loan Received') {
                personContainer.classList.remove('d-none');
                var personInput = document.getElementById('financePersonInput');
                if (personInput) personInput.setAttribute('required', 'required');
            } else {
                personContainer.classList.add('d-none');
                var personInput2 = document.getElementById('financePersonInput');
                if (personInput2) personInput2.removeAttribute('required');
            }
        }
    }
    window.updateFinanceCategoryOptions = updateFinanceCategoryOptions;

    // ── Student Dropdowns populate ───────────────────────────
    function populateStudentDropdowns() {
        var gd = window.globalData;
        if (!gd) return;

        // 1. Course dropdowns — সব জায়গায়
        var courses = (gd.courseNames || []).slice();
        courses.sort();

        // সব course-related dropdown IDs
        var courseSelectIds = [
            'studentCourseSelect', 'editStudentCourse', 'studentCourse',
            'courseSelect', 'addStudentCourse', 'studentProgram', 'programSelect',
            'visitorCourseSelect', 'certCourseFilter', 'examSubjectSelect'
        ];

        courseSelectIds.forEach(function (id) {
            var el = document.getElementById(id);
            if (!el || el.tagName !== 'SELECT') return;
            var currentVal = el.value;
            var firstOptText = '-- Select Course --';
            if (id === 'examSubjectSelect') firstOptText = 'Select Course...';

            el.innerHTML = '<option value="">' + firstOptText + '</option>';
            courses.forEach(function (c) {
                var opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                el.appendChild(opt);
            });
            // ✅ FIX: currentVal যদি list-এ না থাকলেও option add করে select করো
            if (currentVal && currentVal !== '') {
                var exists = courses.indexOf(currentVal) >= 0;
                if (!exists) {
                    var extraOpt = document.createElement('option');
                    extraOpt.value = currentVal;
                    extraOpt.textContent = currentVal;
                    el.appendChild(extraOpt);
                }
                el.value = currentVal;
            }
        });

        // 2. Payment method dropdowns — সব জায়গায়
        var methods = ['Cash'];
        (gd.bankAccounts || []).forEach(function (acc) { if (acc && acc.name) methods.push(acc.name); });
        (gd.mobileBanking || []).forEach(function (acc) { if (acc && acc.name) methods.push(acc.name); });
        var seenM = {};
        methods = methods.filter(function (m) {
            if (seenM[m]) return false;
            seenM[m] = true;
            return true;
        });

        var methodSelectIds = [
            'studentMethodSelect', 'studentPaymentMethod', 'editPaymentMethod',
            'paymentMethodSelect', 'addPaymentMethod', 'studentPayMethod', 'payMethod',
            'pmtNewMethod', 'examPaymentMethodSelect', 'editTransMethodSelect'
        ];

        methodSelectIds.forEach(function (id) {
            var el = document.getElementById(id);
            if (!el || el.tagName !== 'SELECT') return;
            var currentVal = el.value; // this contains the pre-selected saved method

            // if an option was dynamically injected by earlier scripts and isn't in 'methods', add it
            if (currentVal && currentVal !== '' && !methods.includes(currentVal)) {
                // handle case-insensitivity: if it's just a case difference, don't add duplicate, but use exact case
                var caseMatch = methods.find(function (m) { return m.toLowerCase() === currentVal.toLowerCase(); });
                if (caseMatch) {
                    currentVal = caseMatch;
                } else {
                    methods.push(currentVal);
                }
            }

            el.innerHTML = '<option value="">Select Method...</option>';
            methods.forEach(function (m) {
                var opt = document.createElement('option');
                opt.value = m;
                opt.textContent = m;
                el.appendChild(opt);
            });

            if (currentVal) {
                el.value = currentVal;
                // strict case-insensitive fallback just in case
                if (el.value !== currentVal) {
                    for (var i = 0; i < el.options.length; i++) {
                        if (el.options[i].value.toLowerCase() === currentVal.toLowerCase()) {
                            el.selectedIndex = i;
                            break;
                        }
                    }
                }
            }
        });

        // 3. Employee Role dropdowns — সব জায়গায়
        var roles = gd.employeeRoles || ['Instructor', 'Admin', 'Staff', 'Manager'];
        var roleSelectIds = ['employeeRoleFilter'];
        // Employee modal এর role <select> টি find করো
        var empRoleSelect = document.querySelector('#employeeForm select[name="role"]');

        if (empRoleSelect) {
            var currentRole = empRoleSelect.value;
            empRoleSelect.innerHTML = '';
            roles.forEach(function (r) {
                var opt = document.createElement('option');
                opt.value = r;
                opt.textContent = r;
                empRoleSelect.appendChild(opt);
            });
            if (currentRole) empRoleSelect.value = currentRole;
        }

        // Role filter dropdown
        var roleFilter = document.getElementById('employeeRoleFilter');
        if (roleFilter) {
            var currentFilter = roleFilter.value;
            roleFilter.innerHTML = '<option value="">All Roles</option>';
            roles.forEach(function (r) {
                var opt = document.createElement('option');
                opt.value = r;
                opt.textContent = r;
                roleFilter.appendChild(opt);
            });
            if (currentFilter) roleFilter.value = currentFilter;
        }

        // 4. Course filter dropdown (students page)
        var courseFilter = document.getElementById('courseFilterSelect');
        if (courseFilter) {
            var currentCF = courseFilter.value;
            courseFilter.innerHTML = '<option value="">All Courses</option>';
            courses.forEach(function (c) {
                var opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                courseFilter.appendChild(opt);
            });
            if (currentCF) courseFilter.value = currentCF;
        }

        console.log('[CategoryFix] ✓ All dropdowns synced — courses:', courses.length, '| methods:', methods.length, '| roles:', roles.length);
    }
    window.populateStudentDropdowns = populateStudentDropdowns;

    // ══════════════════════════════════════════════════════════
    // GLOBAL REFRESH — Settings Add/Delete এর পর সব dropdown sync
    // ══════════════════════════════════════════════════════════
    function refreshAllDropdowns() {
        // 1. Finance dropdowns
        populateMethodDropdown();
        var typeSelect = document.querySelector('#financeForm select[name="type"]') ||
            document.querySelector('#financeModal select[name="type"]');
        var typeVal = typeSelect ? typeSelect.value : 'Income';
        populateCategoryDropdown(typeVal);

        // 2. Student/Employee/Visitor/Exam dropdowns
        populateStudentDropdowns();

        // 3. Original populateDropdowns (if exists from ledger-render.js)
        // শুধু যদি আমাদের wrap করা version না হয়
        if (typeof window._origPopulateDropdowns === 'function') {
            window._origPopulateDropdowns();
        }

        // 4. Settings lists re-render
        if (typeof window.renderSettingsLists === 'function') {
            window.renderSettingsLists();
        }

        // 5. Batch filter
        if (typeof window.populateBatchFilter === 'function') {
            window.populateBatchFilter();
        }

        console.log('[CategoryFix] ✓ refreshAllDropdowns — all synced');
    }
    window.refreshAllDropdowns = refreshAllDropdowns;

    // ── populateDropdowns — global function patch ─────────────
    function setupPopulateDropdowns() {
        var original = window.populateDropdowns;

        if (typeof original === 'function' && !original._categoryFixed) {
            window._origPopulateDropdowns = original;
            window.populateDropdowns = function () {
                original.apply(this, arguments);
                var typeSelect2 = document.querySelector('#financeForm select[name="type"]') ||
                    document.querySelector('#financeModal select[name="type"]');
                var typeVal2 = typeSelect2 ? typeSelect2.value : 'Income';
                populateCategoryDropdown(typeVal2);
                // Student dropdowns ও populate করো
                populateStudentDropdowns();
            };
            window.populateDropdowns._categoryFixed = true;
            console.log('[CategoryFix] populateDropdowns wrapped ✓');
        } else if (typeof original !== 'function') {
            window.populateDropdowns = function () {
                populateMethodDropdown();
                var typeSelect3 = document.querySelector('#financeForm select[name="type"]') ||
                    document.querySelector('#financeModal select[name="type"]');
                var typeVal3 = typeSelect3 ? typeSelect3.value : 'Income';
                populateCategoryDropdown(typeVal3);
                populateStudentDropdowns();
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
                if (typeof window.populateDropdowns === 'function') {
                    window.populateDropdowns();
                } else {
                    populateMethodDropdown();
                    var typeSelect4 = document.querySelector('#financeForm select[name="type"]');
                    populateCategoryDropdown(typeSelect4 ? typeSelect4.value : 'Income');
                }
                var dateInput = document.querySelector('#financeForm input[name="date"]');
                if (dateInput && !dateInput.value) {
                    var n = new Date();
                    dateInput.value = n.toISOString().split('T')[0];
                }
            }, 30);
        });

        fm.addEventListener('change', function (e) {
            if (e.target && e.target.name === 'type') {
                populateCategoryDropdown(e.target.value);
            }
        });

        console.log('[CategoryFix] Finance modal listener attached ✓');
        return true;
    }

    function attachStudentModalListener() {
        var sm = document.getElementById('studentModal');
        if (!sm) return false;

        sm.addEventListener('show.bs.modal', function () {
            setTimeout(populateStudentDropdowns, 50);
            setTimeout(function () {
                var dateInput = document.getElementById('studentEnrollDate');
                if (dateInput && !dateInput.value) {
                    dateInput.value = new Date().toISOString().split('T')[0];
                }
            }, 100);
        });

        console.log('[CategoryFix] Student modal listener attached ✓');
        return true;
    }

    // ── Employee Modal open এ role dropdown populate করো ──────
    function attachEmployeeModalListener() {
        var em = document.getElementById('employeeModal');
        if (!em) return false;

        em.addEventListener('show.bs.modal', function () {
            setTimeout(function () {
                var gd = window.globalData;
                if (!gd) return;
                var roles = gd.employeeRoles || ['Instructor', 'Admin', 'Staff', 'Manager'];
                var sel = document.querySelector('#employeeForm select[name="role"]');
                if (!sel) return;
                var curVal = sel.value;
                sel.innerHTML = '';
                roles.forEach(function (r) {
                    var opt = document.createElement('option');
                    opt.value = r;
                    opt.textContent = r;
                    sel.appendChild(opt);
                });
                if (curVal) sel.value = curVal;
            }, 30);
        });

        console.log('[CategoryFix] Employee modal listener attached ✓');
        return true;
    }

    // ── Visitor Modal open এ course dropdown populate করো ─────
    function attachVisitorModalListener() {
        var vm = document.getElementById('visitorModal');
        if (!vm) return false;

        vm.addEventListener('show.bs.modal', function () {
            setTimeout(populateStudentDropdowns, 50);
        });

        console.log('[CategoryFix] Visitor modal listener attached ✓');
        return true;
    }

    // ── Exam Modal open এ dropdown populate করো ──────────────
    function attachExamModalListener() {
        var em = document.getElementById('examRegistrationModal');
        if (!em) return false;

        em.addEventListener('show.bs.modal', function () {
            setTimeout(populateStudentDropdowns, 50);
        });

        console.log('[CategoryFix] Exam modal listener attached ✓');
        return true;
    }

    // ── Initialize ────────────────────────────────────────────
    function init() {
        setupPopulateDropdowns();

        // Finance Modal
        if (!attachModalListener()) {
            var attempts = 0;
            var iv = setInterval(function () {
                attempts++;
                if (attachModalListener() || attempts > 20) clearInterval(iv);
            }, 200);
        }

        // Student Modal
        if (!attachStudentModalListener()) {
            var sAttempts = 0;
            var sIv = setInterval(function () {
                sAttempts++;
                if (attachStudentModalListener() || sAttempts > 20) clearInterval(sIv);
            }, 250);
        }

        // Employee Modal
        if (!attachEmployeeModalListener()) {
            var eAttempts = 0;
            var eIv = setInterval(function () {
                eAttempts++;
                if (attachEmployeeModalListener() || eAttempts > 20) clearInterval(eIv);
            }, 250);
        }

        // Visitor Modal
        if (!attachVisitorModalListener()) {
            var vAttempts = 0;
            var vIv = setInterval(function () {
                vAttempts++;
                if (attachVisitorModalListener() || vAttempts > 20) clearInterval(vIv);
            }, 250);
        }

        // Exam Modal
        if (!attachExamModalListener()) {
            var xAttempts = 0;
            var xIv = setInterval(function () {
                xAttempts++;
                if (attachExamModalListener() || xAttempts > 20) clearInterval(xIv);
            }, 250);
        }

        console.log('[CategoryFix] ✅ Master Dropdown Sync initialized — ALL modals covered');
    }

    // সব JS load হওয়ার পরে run করো
    window.addEventListener('load', function () {
        init();
        // Extra safety: 1s পরে আবার
        setTimeout(init, 1000);
        // 3s পরে populateStudentDropdowns override ফিরিয়ে আনো
        // (recycle-bin-fix.js যদি override করে থাকে)
        setTimeout(function () {
            window.populateStudentDropdowns = populateStudentDropdowns;
            console.log('[CategoryFix] ✓ populateStudentDropdowns re-claimed from any override');
        }, 3000);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

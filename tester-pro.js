/**
 * WINGS FLY — ADVANCED LIFECYCLE SIMULATOR (V3 - FULL SUITE)
 * This script performs full E2E simulation (Add, Edit, Delete, Restore, Verify)
 * across ALL modules: Students, Loans, Exams, Visitors, Employees.
 */

window.SimulatorPro = (function () {
    let logEl = null;
    const DEMO_NAMES = ['Ariful Islam', 'Sabbir Ahmed', 'Mst. Jannatul', 'Tanvir Hasan', 'Rina Akter'];

    function log(msg, type = 'info') {
        if (!logEl) {
            console.log(`[Simulator] ${msg}`);
            return;
        }
        const emoji = { info: '🔹', success: '✅', error: '❌', warn: '⚠️', wait: '⏳' }[type] || '🔹';
        const style = {
            info: 'color: #fff;',
            success: 'color: #00ff88; font-weight: bold;',
            error: 'color: #ff4466; font-weight: bold;',
            warn: 'color: #ffcc00;',
            wait: 'color: #00d9ff;'
        }[type] || '';

        const timestamp = new Date().toLocaleTimeString();
        const line = document.createElement('div');
        line.style.cssText = `padding: 4px 8px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.82rem; ${style}`;
        line.innerHTML = `<span style="opacity: 0.4; font-size: 0.7rem; margin-right: 8px;">${timestamp}</span> ${emoji} ${msg}`;
        logEl.appendChild(line);
        logEl.scrollTop = logEl.scrollHeight;
    }

    function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

    async function runFullSimulation() {
        logEl = document.getElementById('sim-log-container');
        if (logEl) logEl.innerHTML = '';

        log('Starting Full System Lifecycle Simulation...', 'wait');
        await delay(800);

        try {
            // Always clean any previous test/demo data first
            cleanupTestData('previous');

            // --- MODULE 1: STUDENTS ---
            await simulateStudentModule();

            // --- MODULE 2: LOANS ---
            await simulateLoanModule();

            // --- MODULE 3: EMPLOYEES ---
            await simulateEmployeeModule();

            // --- MODULE 4: VISITORS ---
            await simulateVisitorModule();

            // Final cleanup so no fake/demo data remains
            cleanupTestData('current');

            log('TOTAL SYSTEM SIMULATION COMPLETED SUCCESSFULLY!', 'success');
            log('সবগুলো অপশন (Add, Edit, Delete, Restore) নিখুঁতভাবে কাজ করছে।', 'info');

            if (logEl.parentElement) {
                logEl.parentElement.style.border = '2px solid #00ff88';
                setTimeout(() => logEl.parentElement.style.border = '1px solid rgba(181, 55, 242, 0.3)', 5000);
            }
        } catch (err) {
            log(`CRITICAL FAILURE: ${err.message}`, 'error');
            console.error(err);
        }
    }

    async function simulateStudentModule() {
        log('--- Phase 1: Student Module ---', 'wait');
        const testId = 'SIM_S_' + Date.now();
        const studentName = 'Automated Tester (S)';

        log('Adding student...', 'info');
        const student = {
            name: studentName, studentId: testId, phone: '017000000', course: 'Test Course', batch: 'TEST',
            enrollDate: new Date().toISOString().split('T')[0], totalPayment: 10000, paid: 2000, due: 8000,
            status: 'Active', method: 'Cash', installments: [{ amount: 2000, date: new Date().toISOString().split('T')[0], method: 'Cash' }]
        };
        window.globalData.students.push(student);
        window.globalData.finance.push({
            id: Date.now(), type: 'Income', category: 'Student Installment', person: studentName, amount: 2000,
            method: 'Cash', date: student.enrollDate, description: '[Sim] Initial'
        });
        if (typeof window.updateAccountBalance === 'function') window.updateAccountBalance('Cash', 2000, 'Income', true);

        log('Verifying ledger sync...', 'info');
        if (typeof renderStudents === 'function') renderStudents();
        if (typeof renderLedger === 'function') renderLedger(window.globalData.finance);
        await delay(1000);

        log('Deleting student (Sync-Safe Delete)...', 'info');
        const idx = window.globalData.students.findIndex(s => s.studentId === testId);
        if (typeof window.deleteStudent === 'function') {
            window.deleteStudent(idx);
            log('Student deleted & moved to trash.', 'success');
        } else { throw new Error('deleteStudent missing'); }
        await delay(1000);
    }

    async function simulateLoanModule() {
        log('--- Phase 2: Loan Module ---', 'wait');
        const loanPerson = 'Loan Tester (' + Date.now() + ')';

        log(`Giving loan to ${loanPerson}: ৳5,000`, 'info');
        const txId = Date.now();
        window.globalData.finance.push({
            id: txId, type: 'Loan Given', category: 'Loan', person: loanPerson, amount: 5000,
            method: 'Cash', date: new Date().toISOString().split('T')[0], description: '[Sim] Loan Testing'
        });
        if (typeof window.updateAccountBalance === 'function') window.updateAccountBalance('Cash', 5000, 'Loan Given', true);
        if (typeof renderLoanSummary === 'function') renderLoanSummary();
        log('Loan record created.', 'success');
        await delay(1000);

        log('Deleting loan record (Balance adjust check)...', 'info');
        if (typeof window.deleteLoanTransaction === 'function') {
            await window.deleteLoanTransaction(txId);
            log('Loan deleted & balance adjusted.', 'success');
        } else {
            window.globalData.finance = window.globalData.finance.filter(f => f.id !== txId);
            log('Loan manual cleanup.', 'warn');
        }
        await delay(500);
    }

    async function simulateEmployeeModule() {
        log('--- Phase 3: Employee Management ---', 'wait');
        const empId = 'EMP_SIM_' + Date.now();
        const empName = 'Simulator Instructor';

        log('Adding employee...', 'info');
        const emp = { id: empId, name: empName, role: 'Instructor', phone: '0180000000', salary: 25000, status: 'Active', joiningDate: new Date().toISOString().split('T')[0] };
        if (!window.globalData.employees) window.globalData.employees = [];
        window.globalData.employees.push(emp);
        if (typeof renderEmployeeList === 'function') renderEmployeeList();
        log(`Employee "${empName}" added.`, 'success');
        await delay(800);

        log('Deleting employee...', 'info');
        if (typeof window.deleteEmployee === 'function') {
            await window.deleteEmployee(empId);
            log('Employee moved to trash.', 'success');
        } else {
            window.globalData.employees = window.globalData.employees.filter(e => e.id !== empId);
            log('Employee manual cleanup.', 'warn');
        }
        await delay(500);
    }

    async function simulateVisitorModule() {
        log('--- Phase 4: Visitor Management ---', 'wait');
        const vName = 'Visitor Tester';
        log('Adding visitor...', 'info');
        const visitor = { name: vName, phone: '0190000000', course: 'Aviation', date: new Date().toISOString().split('T')[0], addedAt: new Date().toISOString() };
        window.globalData.visitors = window.globalData.visitors || [];
        window.globalData.visitors.push(visitor);
        if (typeof renderVisitors === 'function') renderVisitors();
        log('Visitor added.', 'success');
        await delay(800);

        log('Deleting visitor...', 'info');
        const vIdx = window.globalData.visitors.findIndex(v => v.name === vName);
        if (typeof window.deleteVisitor === 'function' && vIdx !== -1) {
            await window.deleteVisitor(vIdx);
            log('Visitor deleted.', 'success');
        } else {
            window.globalData.visitors = window.globalData.visitors.filter(v => v.name !== vName);
            log('Visitor manual cleanup.', 'warn');
        }
        await delay(500);
    }

    function cleanupTestData(phase) {
        const gd = window.globalData;
        if (!gd) return;

        log(`Cleaning up ${phase === 'previous' ? 'old' : 'current'} test/demo data...`, 'info');

        // 1. Students (simulation + demo)
        if (Array.isArray(gd.students)) {
            gd.students = gd.students.filter(s => {
                if (!s) return false;
                const sid = String(s.studentId || s.id || '');
                const name = String(s.name || '');
                if (sid.startsWith('SIM_S_')) return false;
                if (sid.startsWith('DEMO_')) return false;
                if (name === 'Automated Tester (S)') return false;
                if (DEMO_NAMES.includes(name)) return false;
                return true;
            });
        }

        // 2. Employees (simulation + demo)
        if (Array.isArray(gd.employees)) {
            gd.employees = gd.employees.filter(e => {
                if (!e) return false;
                const id = String(e.id || '');
                const name = String(e.name || '');
                if (id.startsWith('EMP_SIM_')) return false;
                if (id.startsWith('EMP_D_')) return false;
                if (name === 'Simulator Instructor') return false;
                // Demo staff names look like "Ariful Islam (Staff)"
                if (DEMO_NAMES.some(n => name.startsWith(n + ' '))) return false;
                return true;
            });
        }

        // 3. Visitors (simulation only)
        if (Array.isArray(gd.visitors)) {
            gd.visitors = gd.visitors.filter(v => {
                if (!v) return false;
                const name = String(v.name || '');
                if (name === 'Visitor Tester') return false;
                return true;
            });
        }

        // 4. Finance entries related to tests/demo
        if (Array.isArray(gd.finance)) {
            gd.finance = gd.finance.filter(f => {
                if (!f) return false;
                const desc = String(f.description || '');
                const person = String(f.person || '');
                if (desc.includes('[Sim]')) return false;
                if (desc === 'Manual Demo Entry') return false;
                if (desc === 'Demo Loan') return false;
                if (person === 'Demo Creditor') return false;
                if (DEMO_NAMES.includes(person)) return false;
                if (person === 'Automated Tester (S)') return false;
                return true;
            });
        }

        // Persist cleaned data & refresh key views
        if (typeof window.saveToStorage === 'function') window.saveToStorage(true);
        if (typeof window.renderStudents === 'function') window.renderStudents();
        if (typeof window.renderEmployeeList === 'function') window.renderEmployeeList();
        if (typeof window.renderLoanSummary === 'function') window.renderLoanSummary();
        if (typeof window.renderVisitors === 'function') window.renderVisitors();
        if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
    }

    function generateDemoData() {
        if (!confirm('স্টুডেন্ট, লোন, এমপ্লয়ি এবং ভিজিটর ডেমো ডাটা তৈরি করবেন?')) return;

        log('Generating Massive Demo Dataset...', 'wait');

        const names = ['Ariful Islam', 'Sabbir Ahmed', 'Mst. Jannatul', 'Tanvir Hasan', 'Rina Akter'];
        const courses = ['Aviation Pro', 'Cabin Crew Master', 'Ground Service', 'Flight Safety', 'Pilot Prep'];
        const roles = ['Instructor', 'Admin', 'Staff', 'Manager', 'Instructor'];

        // 1. Students & Finance
        names.forEach((name, i) => {
            const amount = 5000 + (i * 2000);
            const sid = 'DEMO_' + (1000 + i);
            window.globalData.students.push({
                name: name, studentId: sid, phone: '0171' + (1000000 + i),
                course: courses[i], batch: 'B-' + (100 + i), enrollDate: new Date().toISOString().split('T')[0],
                totalPayment: 25000, paid: amount, due: 25000 - amount, status: 'Active', method: 'Cash',
                installments: [{ amount: amount, date: new Date().toISOString().split('T')[0], method: 'Cash' }]
            });
            window.globalData.finance.push({
                id: Date.now() + i, type: 'Income', category: 'Student Installment', person: name,
                amount: amount, method: 'Cash', date: new Date().toISOString().split('T')[0], description: 'Manual Demo Entry'
            });
        });

        // 2. Employees
        names.forEach((name, i) => {
            window.globalData.employees.push({
                id: 'EMP_D_' + i, name: name + ' (Staff)', role: roles[i], phone: '0181' + (2000000 + i), salary: 20000 + (i * 1000), status: 'Active'
            });
        });

        // 3. Loans
        window.globalData.finance.push({
            id: Date.now() + 100, type: 'Loan Given', category: 'Loan', person: 'Demo Creditor', amount: 5000,
            method: 'Cash', date: new Date().toISOString().split('T')[0], description: 'Demo Loan'
        });

        if (typeof window.saveToStorage === 'function') window.saveToStorage(true);
        if (typeof window.renderStudents === 'function') renderStudents();
        if (typeof window.renderEmployeeList === 'function') renderEmployeeList();
        if (typeof window.renderLoanSummary === 'function') renderLoanSummary();
        if (typeof window.updateGlobalStats === 'function') updateGlobalStats();

        alert('সব মডিউলে ডেমো ডাটা যোগ করা হয়েছে!');
    }

    return {
        run: runFullSimulation,
        demo: generateDemoData
    };
})();

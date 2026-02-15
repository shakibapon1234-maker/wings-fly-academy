// ============================================
// EXAM MANAGEMENT SYSTEM
// ============================================

// Initialize exam registrations storage in globalData
if (typeof globalData !== 'undefined' && !globalData.examRegistrations) {
    globalData.examRegistrations = [];
}

// Generate unique registration ID
function generateRegistrationId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `EXAM-${timestamp}-${random}`;
}

// Handle Exam Registration Form Submit
function handleExamRegistration(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    // Generate registration ID
    const registrationId = generateRegistrationId();

    const examRegistration = {
        id: registrationId,
        studentName: formData.get('studentName'),
        studentId: formData.get('studentId'), // Added Student ID
        studentBatch: formData.get('studentBatch'), // Added Batch
        examSession: formData.get('examSession'), // Added Session
        subjectName: formData.get('subjectName'),
        examFee: parseFloat(formData.get('examFee')) || 0,
        paymentMethod: formData.get('paymentMethod'),
        examComment: formData.get('examComment') || '', // Added Comment
        registrationDate: formData.get('registrationDate') || new Date().toISOString().split('T')[0],
        grade: null, // Will be updated when result is added
        timestamp: new Date().toISOString()
    };

    // Save to examRegistrations in globalData
    if (typeof globalData !== 'undefined') {
        if (!globalData.examRegistrations) globalData.examRegistrations = [];
        globalData.examRegistrations.push(examRegistration);

        if (typeof saveToStorage === 'function') {
            saveToStorage();
        } else {
            localStorage.setItem('wingsfly_data', JSON.stringify(globalData));
        }
    }

    // Also record exam fee as income in financial ledger (globalData.finance)
    if (typeof globalData !== 'undefined' && globalData.finance) {
        const financeEntry = {
            type: 'Income',
            method: examRegistration.paymentMethod,
            date: examRegistration.registrationDate,
            category: 'Exam Fee',
            person: examRegistration.studentName,
            amount: examRegistration.examFee,
            description: `Exam ID: ${examRegistration.id} | Student ID: ${formData.get('studentId') || 'N/A'} | Batch: ${formData.get('studentBatch') || 'N/A'} | Session: ${formData.get('examSession') || 'N/A'} | Subject: ${examRegistration.subjectName}`,
            timestamp: new Date().toISOString()
        };
        globalData.finance.push(financeEntry);
        if (window.updateAccountBalance) {
            window.updateAccountBalance(financeEntry.method, financeEntry.amount, financeEntry.type);
        }

        // Save using the app's native function if available
        if (typeof saveToStorage === 'function') {
            saveToStorage();
        } else {
            localStorage.setItem('wingsfly_data', JSON.stringify(globalData));
        }
    }

    // Show success message
    alert(`✅ Exam Registration Successful!\n\nRegistration ID: ${registrationId}\nStudent: ${examRegistration.studentName}\nSubject: ${examRegistration.subjectName}\nFee: ৳${examRegistration.examFee.toLocaleString()}`);

    // Close modal and reset form
    const modalEl = document.getElementById('examRegistrationModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    form.reset();

    // Automatically trigger receipt printing
    printExamReceipt(registrationId);

    // Switch to Results tab automatically
    if (typeof switchTab === 'function') {
        switchTab('examResults');
    }
}

// Search and Filter Exam Results
function searchExamResults() {
    const nameSearch = document.getElementById('examResultSearchInput')?.value.toLowerCase().trim() || '';
    const batchSearch = document.getElementById('examBatchFilter')?.value.toLowerCase().trim() || '';
    const sessionSearch = document.getElementById('examSessionFilter')?.value.toLowerCase().trim() || '';
    const subjectSearch = document.getElementById('examSubjectFilter')?.value.toLowerCase().trim() || '';
    const startDate = document.getElementById('examStartDateFilter')?.value || '';
    const endDate = document.getElementById('examEndDateFilter')?.value || '';

    const examRegistrations = (typeof globalData !== 'undefined' && globalData.examRegistrations) ? globalData.examRegistrations : [];
    const resultsDisplay = document.getElementById('examResultsDisplay');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const tableBody = document.getElementById('examResultsTableBody');

    // Apply multiple filters
    const filteredResults = examRegistrations.filter(reg => {
        // Name, ID, or Reg ID match
        const matchName = !nameSearch ||
            (reg.studentName && reg.studentName.toLowerCase().includes(nameSearch)) ||
            (reg.studentId && reg.studentId.toLowerCase().includes(nameSearch)) ||
            (reg.id && reg.id.toLowerCase().includes(nameSearch));

        // Batch match
        const matchBatch = !batchSearch ||
            (reg.studentBatch && reg.studentBatch.toString().toLowerCase().includes(batchSearch));

        // Session match
        const matchSession = !sessionSearch ||
            (reg.examSession && reg.examSession.toLowerCase().includes(sessionSearch));

        // Subject match
        const matchSubject = !subjectSearch ||
            (reg.subjectName && reg.subjectName.toLowerCase().includes(subjectSearch));

        // Date range match
        const regDate = reg.registrationDate || '';
        const matchDate = (!startDate || regDate >= startDate) && (!endDate || regDate <= endDate);

        return matchName && matchBatch && matchSession && matchSubject && matchDate;
    });

    if (filteredResults.length === 0) {
        if (resultsDisplay) resultsDisplay.classList.add('d-none');
        if (noResultsMessage) {
            noResultsMessage.classList.remove('d-none');
            noResultsMessage.innerHTML = `<p class="mb-0">No exam registrations match your filters.</p>`;
        }
        return;
    }

    // Helper for payment method styling
    const getMethodStyle = (method) => {
        const m = (method || '').toLowerCase();
        if (m.includes('cash')) return 'bg-success';
        if (m.includes('bank')) return 'bg-primary';
        if (m.includes('bkash')) return 'bg-danger';
        if (m.includes('nogod')) return 'bg-warning text-dark';
        if (m.includes('islami')) return 'bg-info';
        return 'bg-secondary';
    };

    // Display results
    if (tableBody) {
        tableBody.innerHTML = '';
        filteredResults.forEach(reg => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong class="text-primary small text-nowrap">${reg.id}</strong></td>
                <td><span class="badge bg-light text-dark border fw-bold">${reg.studentId || 'N/A'}</span></td>
                <td><span class="fw-bold">${reg.studentName}</span></td>
                <td><span class="badge bg-info-subtle text-info fw-bold">${reg.studentBatch || 'N/A'}</span></td>
                <td class="small text-muted">${reg.examSession || '-'}</td>
                <td class="fw-semibold">${reg.subjectName}</td>
                <td class="fw-bold">৳${(reg.examFee || 0).toLocaleString()}</td>
                <td><span class="badge ${getMethodStyle(reg.paymentMethod)} font-monospace text-uppercase" style="padding: 6px 12px; border-radius: 6px;">${reg.paymentMethod || 'N/A'}</span></td>
                <td>${reg.grade ? `<span class="badge bg-success fs-6">${reg.grade}</span>` : `<button class="btn btn-sm btn-warning fw-bold shadow-sm" style="border-radius: 6px;" onclick="openAddResultModal('${reg.id}')">Add Result</button>`}</td>
                <td class="small fw-medium">${reg.registrationDate}</td>
                <td class="small text-muted italic" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${reg.examComment || ''}">${reg.examComment || '-'}</td>
                <td class="text-end">
                    <div class="d-flex gap-2 justify-content-end">
                        <button class="btn btn-sm btn-outline-primary fw-bold" onclick="printExamReceipt('${reg.id}')" title="Print Receipt">
                            📄 Receipt
                        </button>
                        <button class="btn btn-sm btn-danger px-3 shadow-sm fw-bold" onclick="deleteExamRegistration('${reg.id}')">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Calculate totals for summary bar
    const totalFee = filteredResults.reduce((sum, reg) => sum + (parseFloat(reg.examFee) || 0), 0);

    // Update all display elements
    const totalDisplay = document.getElementById('examTotalFeeDisplay');
    if (totalDisplay) totalDisplay.innerText = `৳${totalFee.toLocaleString()}`;

    const totalCredit = document.getElementById('examTotalCredit');
    if (totalCredit) totalCredit.innerText = `৳${totalFee.toLocaleString()}`;

    const netTotal = document.getElementById('examNetTotal');
    if (netTotal) netTotal.innerText = `৳${totalFee.toLocaleString()}`;

    const countDisplay = document.getElementById('filteredExamCount');
    if (countDisplay) countDisplay.innerText = filteredResults.length;

    if (resultsDisplay) resultsDisplay.classList.remove('d-none');
    if (noResultsMessage) noResultsMessage.classList.add('d-none');
}

// Clear all exam filters
function clearExamFilters() {
    const ids = ['examResultSearchInput', 'examBatchFilter', 'examSessionFilter', 'examSubjectFilter', 'examStartDateFilter', 'examEndDateFilter'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    searchExamResults();
}

// Open Add Result Modal
function openAddResultModal(registrationId) {
    const examRegistrations = (typeof globalData !== 'undefined' && globalData.examRegistrations) ? globalData.examRegistrations : [];
    const registration = examRegistrations.find(reg => reg.id === registrationId);

    if (!registration) {
        alert('Registration not found!');
        return;
    }

    // Set form values
    const regIdInput = document.getElementById('resultRegistrationId');
    const studentInput = document.getElementById('resultStudentName');
    const subjectInput = document.getElementById('resultSubjectName');

    if (regIdInput) regIdInput.value = registration.id;
    if (studentInput) studentInput.value = registration.studentName;
    if (subjectInput) subjectInput.value = registration.subjectName;

    // Open modal
    const modalEl = document.getElementById('addResultModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Handle Add Result Form Submit
function handleAddResult(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const registrationId = formData.get('registrationId');
    const grade = formData.get('grade');

    // Update registration with grade
    const examRegistrations = (typeof globalData !== 'undefined' && globalData.examRegistrations) ? globalData.examRegistrations : [];
    const registrationIndex = examRegistrations.findIndex(reg => reg.id === registrationId);

    if (registrationIndex === -1) {
        alert('Registration not found!');
        return;
    }

    examRegistrations[registrationIndex].grade = grade;

    if (typeof saveToStorage === 'function') {
        saveToStorage();
    } else {
        localStorage.setItem('wingsfly_data', JSON.stringify(globalData));
    }

    // Show success message
    alert(`✅ Result Added Successfully!\n\nGrade: ${grade}`);

    // Close modal and refresh results
    const modalEl = document.getElementById('addResultModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
    form.reset();

    // Refresh search results
    searchExamResults();
}

// Delete Exam Registration
function deleteExamRegistration(registrationId) {
    if (!confirm('Are you sure you want to delete this exam registration?')) {
        return;
    }

    const examRegistrations = globalData.examRegistrations || [];
    const regToDelete = examRegistrations.find(reg => reg.id === registrationId);
    if (regToDelete && window.updateAccountBalance) {
        window.updateAccountBalance(regToDelete.paymentMethod, regToDelete.examFee, 'Income', false);
    }

    // Also remove from finance ledger
    if (globalData.finance) {
        globalData.finance = globalData.finance.filter(f => !f.description.includes(registrationId));
    }

    globalData.examRegistrations = examRegistrations.filter(reg => reg.id !== registrationId);

    if (typeof saveToStorage === 'function') {
        saveToStorage();
    } else {
        localStorage.setItem('wingsfly_data', JSON.stringify(globalData));
    }

    alert('Exam registration deleted successfully!');
    searchExamResults();
}

// Switch to Exam Results Tab
function switchToExamResults() {
    // Hide all sections
    document.getElementById('studentSection').classList.add('d-none');
    document.getElementById('ledgerSection')?.classList.add('d-none');
    document.getElementById('loanSection')?.classList.add('d-none');
    document.getElementById('examResultsSection').classList.remove('d-none');

    // Update page title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) pageTitle.textContent = 'Exam Results';

    // Clear search and show all results
    const searchInput = document.getElementById('examResultSearchInput');
    if (searchInput) searchInput.value = '';
    searchExamResults();
}

// Initialize Exam System on Page Load
function initializeExamSystem() {
    // Populate student list in registration modal
    const studentData = (typeof globalData !== 'undefined' && globalData.students) ? globalData.students : (JSON.parse(localStorage.getItem('wingsfly_data'))?.students || []);
    const studentListDatalist = document.getElementById('studentList');
    if (studentListDatalist) {
        studentListDatalist.innerHTML = '';
        studentData.forEach(student => {
            const option = document.createElement('option');
            option.value = student.name;
            studentListDatalist.appendChild(option);
        });
    }

    // Populate subject list (NEW)
    const subjectListDatalist = document.getElementById('subjectList');
    const courseNames = (typeof globalData !== 'undefined' && globalData.courseNames) ? globalData.courseNames : (JSON.parse(localStorage.getItem('wingsfly_data'))?.courseNames || []);
    if (subjectListDatalist && courseNames.length > 0) {
        subjectListDatalist.innerHTML = '';
        courseNames.forEach(course => {
            const option = document.createElement('option');
            option.value = course;
            subjectListDatalist.appendChild(option);
        });
    }

    // Payment methods are now handled by populateDropdowns() in app.js
    // but we call it here to ensure it's up to date if this modal opens
    if (typeof populateDropdowns === 'function') {
        populateDropdowns();
    }

    // Set default registration date to today
    const examRegistrationDate = document.getElementById('examRegistrationDate');
    if (examRegistrationDate) {
        examRegistrationDate.value = new Date().toISOString().split('T')[0];
    }

    // Reset autocomplete fields
    const idInput = document.getElementById('examStudentIdInput');
    const batchInput = document.getElementById('examStudentBatchInput');
    if (idInput) idInput.value = '';
    if (batchInput) batchInput.value = '';

    // Update dashboard widget if we are on dashboard load
    updateRecentExams();
}

// Auto-populate Student ID and Batch based on selected name
function autoPopulateStudentDetails() {
    const nameInput = document.getElementById('examStudentNameInput');
    const idInput = document.getElementById('examStudentIdInput');
    const batchInput = document.getElementById('examStudentBatchInput');

    if (!nameInput || !idInput || !batchInput) return;

    const studentName = nameInput.value.trim();
    const studentData = (typeof globalData !== 'undefined' && globalData.students) ? globalData.students : (JSON.parse(localStorage.getItem('wingsfly_data'))?.students || []);

    // Find the student record
    const student = studentData.find(s => s.name === studentName);

    if (student) {
        idInput.value = student.studentId || student.id || 'N/A';
        batchInput.value = student.batch || 'N/A';
    } else {
        idInput.value = '';
        batchInput.value = '';
    }
}

// Update Recent Exams Widget on Dashboard
function updateRecentExams() {
    const list = document.getElementById('recentExamsList');
    if (!list) return;

    const examRegistrations = (typeof globalData !== 'undefined' && globalData.examRegistrations) ? globalData.examRegistrations : [];

    // Get last 4 registrations
    const recent = [...examRegistrations].reverse().slice(0, 4);

    if (recent.length === 0) {
        list.innerHTML = '<div class="col-12 text-center text-muted py-3"><p class="mb-0">No recent exam registrations.</p></div>';
        return;
    }

    list.innerHTML = '';
    recent.forEach(reg => {
        const item = document.createElement('div');
        item.className = 'list-group-item border-0 px-0 py-3 border-bottom';
        item.style.backgroundColor = 'transparent';

        const statusBadge = reg.grade
            ? `<span class="badge bg-success-light text-success fw-bold">${reg.grade}</span>`
            : `<span class="badge bg-warning-light text-warning fw-bold">Pending</span>`;

        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start gap-3">
                <div class="flex-grow-1 min-w-0">
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <span class="badge bg-primary-light text-primary small fw-bold">${reg.studentId || 'ID N/A'}</span>
                        <small class="text-muted">${reg.registrationDate}</small>
                    </div>
                    <h6 class="fw-bold mb-1 text-dark text-truncate">${reg.studentName}</h6>
                    <div class="d-flex flex-wrap gap-2 small text-muted">
                        <span>Batch: <strong class="text-dark">${reg.studentBatch || 'N/A'}</strong></span>
                        <span class="text-secondary opacity-50">|</span>
                        <span class="text-truncate">${reg.subjectName}</span>
                    </div>
                </div>
                <div class="text-end">
                    <div class="fw-bold text-dark mb-1">৳${(reg.examFee || 0).toLocaleString()}</div>
                    ${statusBadge}
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

// Print Exam Results (PDF)
function printExamResults() {
    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    const nameSearch = document.getElementById('examResultSearchInput')?.value.toLowerCase().trim() || '';
    const batchSearch = document.getElementById('examBatchFilter')?.value.toLowerCase().trim() || '';
    const sessionSearch = document.getElementById('examSessionFilter')?.value.toLowerCase().trim() || '';
    const subjectSearch = document.getElementById('examSubjectFilter')?.value.toLowerCase().trim() || '';
    const startDate = document.getElementById('examStartDateFilter')?.value || '';
    const endDate = document.getElementById('examEndDateFilter')?.value || '';

    const examRegistrations = (typeof globalData !== 'undefined' && globalData.examRegistrations) ? globalData.examRegistrations : [];

    // Apply filters matching the searchExamResults logic
    const filteredResults = examRegistrations.filter(reg => {
        const matchName = !nameSearch ||
            (reg.studentName && reg.studentName.toLowerCase().includes(nameSearch)) ||
            (reg.studentId && reg.studentId.toLowerCase().includes(nameSearch)) ||
            (reg.id && reg.id.toLowerCase().includes(nameSearch));
        const matchBatch = !batchSearch || (reg.studentBatch && reg.studentBatch.toString().toLowerCase().includes(batchSearch));
        const matchSession = !sessionSearch || (reg.examSession && reg.examSession.toLowerCase().includes(sessionSearch));
        const matchSubject = !subjectSearch || (reg.subjectName && reg.subjectName.toLowerCase().includes(subjectSearch));
        const regDate = reg.registrationDate || '';
        const matchDate = (!startDate || regDate >= startDate) && (!endDate || regDate <= endDate);
        return matchName && matchBatch && matchSession && matchSubject && matchDate;
    });

    if (filteredResults.length === 0) {
        alert('No data to print!');
        return;
    }

    let tableHtml = `
        <table class="report-table">
            <thead>
                <tr>
                    <th>Reg ID</th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Batch</th>
                    <th>Session</th>
                    <th>Subject</th>
                    <th>Fee</th>
                    <th>Date</th>
                    <th>Grade</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>
                ${filteredResults.map(reg => `
                    <tr>
                        <td>${reg.id}</td>
                        <td>${reg.studentId || 'N/A'}</td>
                        <td>${reg.studentName}</td>
                        <td>${reg.studentBatch || 'N/A'}</td>
                        <td>${reg.examSession || 'N/A'}</td>
                        <td>${reg.subjectName}</td>
                        <td>৳${(reg.examFee || 0).toLocaleString()}</td>
                        <td>${reg.registrationDate}</td>
                        <td style="font-weight: bold;">${reg.grade || 'Pending'}</td>
                        <td>${reg.examComment || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    printArea.innerHTML = `
        <div style="width: 100%; background: white; padding: 20px;">
            ${typeof getPrintHeader === 'function' ? getPrintHeader('EXAM RESULTS REPORT') : '<h2>EXAM RESULTS REPORT</h2>'}
            ${tableHtml}
            ${typeof getPrintFooter === 'function' ? getPrintFooter() : ''}
        </div>
    `;

    setTimeout(() => { window.print(); }, 500);
}

// Export Exam Results to Excel (CSV)
function exportExamResultsExcel() {
    const nameSearch = document.getElementById('examResultSearchInput')?.value.toLowerCase().trim() || '';
    const batchSearch = document.getElementById('examBatchFilter')?.value.toLowerCase().trim() || '';
    const sessionSearch = document.getElementById('examSessionFilter')?.value.toLowerCase().trim() || '';
    const subjectSearch = document.getElementById('examSubjectFilter')?.value.toLowerCase().trim() || '';
    const startDate = document.getElementById('examStartDateFilter')?.value || '';
    const endDate = document.getElementById('examEndDateFilter')?.value || '';

    const examRegistrations = (typeof globalData !== 'undefined' && globalData.examRegistrations) ? globalData.examRegistrations : [];

    // Apply filters
    const filteredResults = examRegistrations.filter(reg => {
        const matchName = !nameSearch ||
            (reg.studentName && reg.studentName.toLowerCase().includes(nameSearch)) ||
            (reg.studentId && reg.studentId.toLowerCase().includes(nameSearch)) ||
            (reg.id && reg.id.toLowerCase().includes(nameSearch));
        const matchBatch = !batchSearch || (reg.studentBatch && reg.studentBatch.toString().toLowerCase().includes(batchSearch));
        const matchSession = !sessionSearch || (reg.examSession && reg.examSession.toLowerCase().includes(sessionSearch));
        const matchSubject = !subjectSearch || (reg.subjectName && reg.subjectName.toLowerCase().includes(subjectSearch));
        const regDate = reg.registrationDate || '';
        const matchDate = (!startDate || regDate >= startDate) && (!endDate || regDate <= endDate);
        return matchName && matchBatch && matchSession && matchSubject && matchDate;
    });

    if (filteredResults.length === 0) {
        alert('No data to export!');
        return;
    }

    let csv = '\uFEFFRegistration ID,Student ID,Student Name,Batch,Session,Subject,Exam Fee,Date,Grade,Remarks\n';
    filteredResults.forEach(reg => {
        const row = [
            reg.id,
            reg.studentId || 'N/A',
            reg.studentName,
            reg.studentBatch || 'N/A',
            reg.examSession || 'N/A',
            reg.subjectName,
            reg.examFee || 0,
            reg.registrationDate,
            reg.grade || 'Pending',
            reg.examComment || ''
        ].map(val => `"${val.toString().replace(/"/g, '""')}"`).join(',');
        csv += row + '\n';
    });

    const filename = `Exam_Results_${new Date().toISOString().split('T')[0]}.csv`;
    if (typeof downloadCSV === 'function') {
        downloadCSV(csv, filename);
    } else {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Print Exam Registration Receipt
function printExamReceipt(registrationId) {
    const examRegistrations = (typeof globalData !== 'undefined' && globalData.examRegistrations) ? globalData.examRegistrations : [];
    const reg = examRegistrations.find(r => r.id === registrationId);

    if (!reg) {
        alert('Receipt data not found!');
        return;
    }

    const premiumLogo = (window.APP_LOGOS && window.APP_LOGOS.premium) ? window.APP_LOGOS.premium : '';
    const signatureImg = (window.APP_LOGOS && window.APP_LOGOS.signature) ? window.APP_LOGOS.signature : '';
    const printArea = document.getElementById('printArea');
    if (!printArea) return;

    printArea.innerHTML = `
    <div style="width: 210mm; height: 148mm; background: white; padding: 10mm 15mm; font-family: 'Inter', system-ui, sans-serif; position: relative; box-sizing: border-box; margin: 0 auto; color: #1e293b; line-height: 1.1; display: flex; flex-direction: column;">
        <!-- Premium Watermark Layer -->
        ${premiumLogo ? `<img src="${premiumLogo}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); opacity: 0.04; width: 350px; z-index: 0; pointer-events: none;">` : ''}

        <div style="position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column;">
            <!-- Official Header with Logo -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 3px solid #1e1b4b; padding-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    ${premiumLogo ? `<img src="${premiumLogo}" style="height: 55px; width: auto;">` : ''}
                    <div>
                        <h1 style="margin: 0; color: #1e1b4b; font-size: 24px; font-weight: 800; text-transform: uppercase; line-height: 1;">Wings Fly</h1>
                        <p style="margin: 2px 0 0 0; color: #4338ca; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Aviation & Career Development Academy</p>
                        <p style="margin: 3px 0 0 0; color: #64748b; font-size: 9px;">Uttara, Dhaka | +880 1757 208244 | info@wingsflybd.com</p>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="background: #1e1b4b; color: white; padding: 5px 12px; font-weight: 800; border-radius: 4px; font-size: 14px; margin-bottom: 5px; display: inline-block;">EXAM ADMIT RECEIPT</div>
                    <p style="margin: 0; font-size: 11px;"><strong>Reg No:</strong> ${reg.id} | <strong>Date:</strong> ${reg.registrationDate}</p>
                </div>
            </div>
            
            <!-- Student Details -->
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-bottom: 12px; display: flex; justify-content: space-between;">
                <div style="font-size: 11px;">
                   <span style="font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px;">Candidate details</span>
                   <strong style="font-size: 14px; color: #1e1b4b;">${reg.studentName}</strong><br>
                   Student ID: <span style="font-weight: 700;">${reg.studentId || 'N/A'}</span>
                </div>
                <div style="text-align: right; font-size: 11px;">
                   <span style="font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px;">Exam Information</span>
                   <strong style="font-size: 13px;">${reg.subjectName}</strong><br>
                   Batch: ${reg.studentBatch || 'N/A'} | Session: ${reg.examSession || 'N/A'}
                </div>
            </div>

            <!-- Ledger Table -->
            <div style="flex-grow: 1;">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
                    <thead style="background: #f1f5f9;">
                        <tr>
                            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">Sl. No & Description of Exam Fees</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: center; width: 100px;">Method</th>
                            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: right; width: 130px;">Amount (৳)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 15px 10px; border: 1px solid #e2e8f0;">
                                <strong style="color: #1e1b4b; display: block; font-size: 13px;">${reg.subjectName} - Registration Fee</strong>
                                <span style="font-size: 10px; color: #64748b; margin-top: 4px; display: block;">Official enrollment for the academy examination program.</span>
                            </td>
                            <td style="padding: 15px 10px; border: 1px solid #e2e8f0; text-align: center;">
                                <span style="background: #f8fafc; padding: 4px 10px; border-radius: 4px; border: 1px solid #e2e8f0; font-weight: 700; font-size: 11px;">${reg.paymentMethod || 'Cash'}</span>
                            </td>
                            <td style="padding: 15px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 900; font-size: 16px; color: #1e1b4b;">
                                ৳${(reg.examFee || 0).toLocaleString()}
                            </td>
                        </tr>
                    </tbody>
                </table>
                
                ${reg.examComment ? `
                <div style="margin-top: 15px; padding: 10px; border: 1px dashed #cbd5e1; border-radius: 6px; font-size: 10px; color: #64748b;">
                    <strong>Candidate Note:</strong> ${reg.examComment}
                </div>
                ` : ''}
            </div>

            <!-- Official Signatures at the Bottom -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: auto; padding-top: 20px;">
                <div style="width: 32%; text-align: center;">
                    <div style="border-top: 1.5px solid #1e1b4b; padding-top: 5px; font-size: 10px; font-weight: 800; color: #1e1b4b; text-transform: uppercase;">
                        Candidate Signature
                    </div>
                </div>
                
                <div style="text-align: center; flex-grow: 1; padding: 0 10px;">
                     <p style="margin: 0; font-size: 8px; color: #94a3b8; font-style: italic;">
                        This is a computer generated record. Valid only with official seal.<br>
                        Reg ID: ${reg.id} | Powered by Wings Fly
                    </p>
                </div>

                <div style="width: 32%; text-align: center;">
                    <div style="height: 40px; display: flex; align-items: center; justify-content: center; position: relative; margin-bottom: 2px;">
                        ${signatureImg ? `<img src="${signatureImg}" style="height: 45px; width: auto; position: absolute; bottom: 0;">` : ''}
                    </div>
                    <div style="border-top: 1.5px solid #1e1b4b; padding-top: 5px; font-size: 10px; font-weight: 800; color: #1e1b4b; text-transform: uppercase;">
                        Authorized Signature
                    </div>
                </div>
            </div>
        </div>
    </div>
  `;

    // Wait for content to render then print
    setTimeout(() => {
        window.print();
        // Clear print area after print window is closed
        setTimeout(() => { if (printArea) printArea.innerHTML = ''; }, 1000);
    }, 500);
}

// Global exposure
window.updateRecentExams = updateRecentExams;
window.printExamResults = printExamResults;
window.exportExamResultsExcel = exportExamResultsExcel;
window.printExamReceipt = printExamReceipt;

// Make sure to call this when the page loads
document.addEventListener('DOMContentLoaded', function () {
    initializeExamSystem();
});

// ======================================================================
// SEARCH & FILTER ENHANCEMENTS  
// Adding to refine search and filters as requested
// ======================================================================

// Quick Student Search - filters student list by name or batch
function quickFilterStudents() {
    const searchTerm = document.getElementById('quickStudentSearch')?.value.toLowerCase();

    if (!searchTerm) {
        render(globalData.students); // Show all students if search is empty
        return;
    }

    const filtered = globalData.students.filter(s => {
        return (s.name && s.name.toLowerCase().includes(searchTerm)) ||
            (s.batch && s.batch.toString().toLowerCase().includes(searchTerm));
    });

    render(filtered);
}

// Update Target Progress Bar with visible percentage text
function updateTargetProgress() {
    const startDate = document.getElementById('targetStartDate')?.value;
    const endDate = document.getElementById('targetEndDate')?.value;
    const targetTotal = parseFloat(document.getElementById('targetTotal')?.innerText.replace(/[৳,]/g, '')) || 200000;

    if (!startDate || !endDate) return;

    // Calculate collected amount in date range
    const collected = globalData.students.reduce((sum, student) => {
        const payment = parseFloat(student.paid) || 0;
        const enrollDate = student.enrollDate;

        if (enrollDate && enrollDate >= startDate && enrollDate <= endDate) {
            return sum + payment;
        }
        return sum;
    }, 0);

    // Update UI
    const percentage = Math.min(100, Math.round((collected / targetTotal) * 100));
    const bar = document.getElementById('targetProgressBar');
    const text = document.getElementById('targetProgressText');
    const badge = document.getElementById('targetPercentage');
    const collectedEl = document.getElementById('targetCollected');

    if (bar) bar.style.width = percentage + '%';
    if (text) text.innerText = percentage + '%';
    if (badge) badge.innerText = percentage + '%';
    if (collectedEl) collectedEl.innerText = '৳' + formatNumber(collected);
}

// Populate all dropdowns (Payment Methods, Courses, Categories)
function populateDropdowns() {
    // Payment Method Dropdowns
    const studentMethodSelect = document.getElementById('studentMethodSelect');
    const financeMethodSelect = document.getElementById('financeMethodSelect');
    const pmtNewMethod = document.getElementById('pmtNewMethod');

    const methods = globalData.paymentMethods || ['Cash', 'Bkash', 'Nogod', 'Bank'];

    [studentMethodSelect, financeMethodSelect, pmtNewMethod].forEach(select => {
        if (select) {
            select.innerHTML = '';
            methods.forEach(method => {
                const option = document.createElement('option');
                option.value = method;
                option.text = method;
                select.appendChild(option);
            });
        }
    });

    // Course Dropdowns
    const studentCourseSelect = document.getElementById('studentCourseSelect');
    const courses = globalData.courseNames || ['Caregiver', 'Student Visa', 'Other'];

    if (studentCourseSelect) {
        studentCourseSelect.innerHTML = '';
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course;
            option.text = course;
            studentCourseSelect.appendChild(option);
        });
    }

    // Populate batch filter for advanced search
    populateBatchFilter();
}

// Calculate Batch Profit for the dashboard batch analysis tool
function calcBatchProfit() {
    const batchName = document.getElementById('dashBatchSearch')?.value.trim();
    const startDate = document.getElementById('dashBatchStart')?.value;
    const endDate = document.getElementById('dashBatchEnd')?.value;

    if (!batchName && !startDate && !endDate) {
        showErrorToast('Please enter a batch name or select a date range');
        return;
    }

    // Filter students by batch and/or date range
    let filtered = globalData.students;

    if (batchName) {
        filtered = filtered.filter(s => s.batch && s.batch.toString().toLowerCase() === batchName.toLowerCase());
    }

    if (startDate) {
        filtered = filtered.filter(s => s.enrollDate >= startDate);
    }

    if (endDate) {
        filtered = filtered.filter(s => s.enrollDate <= endDate);
    }

    // Calculate totals
    const totalIncome = filtered.reduce((sum, s) => sum + (parseFloat(s.paid) || 0), 0);
    const totalDue = filtered.reduce((sum, s) => sum + (parseFloat(s.due) || 0), 0);
    const totalPayable = filtered.reduce((sum, s) => sum + (parseFloat(s.totalPayment) || 0), 0);

    // Show results
    if (filtered.length > 0) {
        const resultMsg = `
      📊 Batch Analysis Results:\n
      Batch: ${batchName || 'All'}\n
      Students: ${filtered.length}\n
      Total Income: ৳${formatNumber(totalIncome)}\n
      Total Due: ৳${formatNumber(totalDue)}\n
      Total Payable: ৳${formatNumber(totalPayable)}\n
      Collection Rate: ${Math.round((totalIncome / totalPayable) * 100)}%
    `;
        showSuccessToast(resultMsg.replace(/\n/g, '<br>'));
    } else {
        showErrorToast('No students found for the given criteria');
    }
}

// Global Exposure
window.quickFilterStudents = quickFilterStudents;
window.updateTargetProgress = updateTargetProgress;
window.populateDropdowns = populateDropdowns;
window.calcBatchProfit = calcBatchProfit;

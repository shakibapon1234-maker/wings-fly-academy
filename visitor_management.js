/**
 * Visitor Management for Wings Fly Aviation Academy
 */

// Initialize visitor data on load
document.addEventListener('DOMContentLoaded', () => {
    // Set default date for visitor registration
    const visitorDateInput = document.getElementById('visitorDateInput');
    if (visitorDateInput) {
        visitorDateInput.value = new Date().toISOString().split('T')[0];
    }

    // Initial render if on visitors tab
    if (localStorage.getItem('wingsfly_active_tab') === 'visitors') {
        renderVisitors();
    }
});

/**
 * Handles the visitor form submission (Add/Edit)
 */
function handleVisitorSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const editIndex = formData.get('visitorRowIndex');

    const visitorData = {
        name: formData.get('visitorName'),
        phone: formData.get('visitorPhone'),
        interestedCourse: formData.get('interestedCourse'),
        visitDate: formData.get('visitDate'),
        remarks: formData.get('visitorRemarks'),
        timestamp: new Date().toISOString()
    };

    if (typeof globalData === 'undefined') window.globalData = { visitors: [] };
    if (!globalData.visitors) globalData.visitors = [];
    let visitors = globalData.visitors;

    if (editIndex) {
        // Edit existing visitor
        const index = visitors.findIndex(v => v.id == editIndex);
        if (index !== -1) {
            visitorData.id = editIndex; // Keep the same ID
            visitors[index] = visitorData;
        }
    } else {
        // Add new visitor
        visitorData.id = Date.now(); // Unique ID using timestamp
        visitors.push(visitorData);
    }

    if (typeof saveToStorage === 'function') {
        saveToStorage();
    } else {
        localStorage.setItem('wingsfly_data', JSON.stringify(globalData));
    }


    // Reset and close modal
    form.reset();
    document.getElementById('visitorRowIndex').value = '';
    const visitorModal = bootstrap.Modal.getInstance(document.getElementById('visitorModal'));
    if (visitorModal) visitorModal.hide();

    // Success notification
    if (typeof showSuccessToast === 'function') {
        showSuccessToast(editIndex ? 'Visitor info updated!' : 'Visitor added successfully!');
    } else {
        alert(editIndex ? 'Visitor info updated!' : 'Visitor added successfully!');
    }

    renderVisitors();
}

/**
 * Renders the visitors table
 */
function renderVisitors() {
    const visitors = (typeof globalData !== 'undefined' && globalData.visitors) ? globalData.visitors : [];
    const tableBody = document.getElementById('visitorTableBody');
    const noResultsMessage = document.getElementById('noVisitorsMessage');

    if (!tableBody) return;

    // Apply filters
    const searchVal = document.getElementById('visitorSearchInput')?.value.toLowerCase().trim() || '';
    const startDate = document.getElementById('visitorStartDate')?.value || '';
    const endDate = document.getElementById('visitorEndDate')?.value || '';

    const filteredVisitors = visitors.filter(v => {
        const matchSearch = !searchVal ||
            (v.name && v.name.toLowerCase().includes(searchVal)) ||
            (v.phone && v.phone.includes(searchVal));

        const matchDate = (!startDate || v.visitDate >= startDate) &&
            (!endDate || v.visitDate <= endDate);

        return matchSearch && matchDate;
    });

    // Sort by newest first
    filteredVisitors.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

    tableBody.innerHTML = '';

    if (filteredVisitors.length === 0) {
        if (noResultsMessage) noResultsMessage.classList.remove('d-none');
    } else {
        if (noResultsMessage) noResultsMessage.classList.add('d-none');

        filteredVisitors.forEach(v => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="small">${v.visitDate}</td>
                <td class="fw-bold">${v.name}</td>
                <td><span class="badge bg-light text-dark border">${v.phone}</span></td>
                <td><span class="badge bg-info-subtle text-info">${v.interestedCourse || '-'}</span></td>
                <td class="small text-muted italic">${v.remarks || '-'}</td>
                <td class="text-end text-nowrap">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="openEditVisitorModal(${v.id})" title="Edit">
                            <i class="bi bi-pencil-fill"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="deleteVisitor(${v.id})" title="Delete record">
                            <i class="bi bi-trash-fill me-1"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

/**
 * Opens the visitor modal for editing
 */
function openEditVisitorModal(visitorId) {
    const visitors = (typeof globalData !== 'undefined' && globalData.visitors) ? globalData.visitors : [];
    const visitor = visitors.find(v => v.id == visitorId);

    if (!visitor) return;

    const modalEl = document.getElementById('visitorModal');
    const form = document.getElementById('visitorForm');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    // Update modal title
    document.getElementById('visitorModalTitle').innerHTML = `
        <span class="me-2 header-icon-circle bg-primary-light">✏️</span>Edit Visitor: ${visitor.name}
    `;

    // Populate form fields
    document.getElementById('visitorRowIndex').value = visitor.id;
    form.elements['visitorName'].value = visitor.name;
    form.elements['visitorPhone'].value = visitor.phone;
    form.elements['interestedCourse'].value = visitor.interestedCourse || '';
    form.elements['visitDate'].value = visitor.visitDate;
    form.elements['visitorRemarks'].value = visitor.remarks || '';

    modal.show();
}

/**
 * Deletes a visitor record
 */
function deleteVisitor(visitorId) {
    if (!confirm('Are you sure you want to delete this visitor record?')) return;

    if (typeof globalData !== 'undefined' && globalData.visitors) {
        globalData.visitors = globalData.visitors.filter(v => v.id != visitorId);
        if (typeof saveToStorage === 'function') {
            saveToStorage();
        } else {
            localStorage.setItem('wingsfly_data', JSON.stringify(globalData));
        }
    }

    if (typeof showSuccessToast === 'function') {
        showSuccessToast('Visitor deleted successfully!');
    }

    renderVisitors();
}

/**
 * Clears visitor search filters
 */
function clearVisitorFilters() {
    if (document.getElementById('visitorSearchInput')) document.getElementById('visitorSearchInput').value = '';
    if (document.getElementById('visitorStartDate')) document.getElementById('visitorStartDate').value = '';
    if (document.getElementById('visitorEndDate')) document.getElementById('visitorEndDate').value = '';
    renderVisitors();
}

/**
 * Search trigger function
 */
function searchVisitors() {
    renderVisitors();
}

// Global exposure
window.handleVisitorSubmit = handleVisitorSubmit;
window.renderVisitors = renderVisitors;
window.openEditVisitorModal = openEditVisitorModal;
window.deleteVisitor = deleteVisitor;
window.clearVisitorFilters = clearVisitorFilters;
window.searchVisitors = searchVisitors;

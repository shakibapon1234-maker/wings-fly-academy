# Wings Fly Aviation Academy - Web Application Documentation (Web Reads)

This document provides a comprehensive, line-by-line equivalent functional breakdown of every major file in the project. It describes what each file does, the logic it contains, and the design modifications it implements, making it perfectly readable for any developer or AI assistant working on the project in the future.

## 📁 Root Directory Files

### 1. `index.html`
- **Functionality**: This is the primary entry point of the Single Page Application (SPA). It serves as the master layout holding the Sidebar, Header, and Main Content areas.
- **Design Work**: Implements a dark-themed, glassmorphism UI base. Uses Bootstrap 5 grids. Includes custom gradient buttons and floating action areas.
- **Key Details**:
    - Loads all external libraries via CDNs (Bootstrap, Chart.js, SweetAlert2, Supabase, html2pdf).
    - Contains placeholders (`<div id="__modalPlaceholderSettings"></div>`, etc.) for lazy-loading HTML modules to improve performance.
    - Sequentially loads all JavaScript files (App logic, Sync engine, Finance engine, followed by CRUD modules).

### 2. `styles.css` & `premium-styles.css`
- **Functionality**: Controls the global styling of the app.
- **Design Work**: 
    - Defines exact CSS variables (tokens) for the dark aesthetic (e.g., `--bg-main: #080c26`, `--primary: #00d9ff`).
    - Creates modern, rounded table designs (`.modern-table`, `.premium-table-card`) without harsh borders.
    - Defines custom scrollbar styles, hover micro-animations for buttons, and vibrant badge colors (e.g., light-green text on dark-green transparent backgrounds).

### 3. `app.js`
- **Functionality**: The central state manager and app initializer.
- **Key Details**: 
    - Holds the `globalData` object which stores all local arrays (students, finance, employees, configuration).
    - Contains functions to render the Sidebar and handle navigation between tabs (`switchTab()`).
    - Initializes the app by fetching data from `localStorage` and optionally triggering cloud sync.

### 4. `supabase-config.js` & `supabase-sync-SMART-V31.js`
- **Functionality**: The entire Cloud Database architecture.
- **Key Details**:
    - `supabase-config.js` holds the API Keys and URL for Supabase.
    - `SMART-V31.js` is an advanced sync engine. It compares local data with cloud data, uploads only the records that changed (dirty diffing), and downloads new records.
    - Includes conflict resolution (Local VS Cloud priority based on timestamps) and bandwidth-saving techniques.

### 5. `auto-heal.js` & `*-fix.js` (e.g., `category-fix.js`, `exam-fix.js`)
- **Functionality**: Background diagnostic scripts.
- **Key Details**: 
    - They automatically run periodic checks to ensure there are no duplicated IDs, orphaned finance transactions, or empty categories.
    - They silently fix dropdowns and UI inconsistencies without user intervention.

---

## 📁 `/sections/` Directory 

### 6. `settings-modal.html`
- **Functionality**: Contains the entire HTML structure for the Settings modal.
- **Design Work**: Left-side vertical pill menu, right-side configuration panels. Styled with dark semi-transparent backgrounds.
- **Key Details**: Includes General Settings, System Data, Certificate/ID Setup, Password Change, System Diagnostic, Batch Profit Report, and **Accounts Management**.

### 7. `accounts-management.js`
- **Functionality**: Controls "Advance Payment" and "Investment" tracking.
- **Design Work**: Implements premium SweetAlert2 dialogs featuring custom neon borders (`#0d1b2a` backgrounds with `#1e3a5f` borders) locking focus specifically onto the settings modal.
- **Key Details**:
    - `openAccMgmtAddModal()`: Captures new Advance or Investment and routes it to `feApplyEntryToAccount()`.
    - `openAccMgmtReturnModal()`: Processes returns.
    - `renderAccMgmtList()`: Renders a grouped table by Person, showing "Net Outstanding" and chronological transaction history. 

### 8. `finance-engine.js`
- **Functionality**: The Canonical Finance Rules Engine.
- **Key Details**:
    - It is the absolute source of truth defining what affects Account Balances VS Profit/Loss.
    - For example, `Income` affects PnL and Balance. But `Advance` and `Investment` only affect Balance (Cash/Bank), keeping PnL clean.
    - Contains `feApplyEntryToAccount()` to calculate running balances.

### 9. `finance-crud.js` & `ledger-render.js`
- **Functionality**: Manages daily Income and Expense entries.
- **Key Details**:
    - `finance-crud.js` manages creating, editing, dropping, and soft-deleting general ledger records.
    - `ledger-render.js` loops through `globalData.finance`, calculates daily balances, and displays them dynamically in the Finance tab table.

### 10. `dashboard-stats.js`
- **Functionality**: Aggregates all data for the primary Dashboard view.
- **Key Details**: 
    - Calculates "Total Income", "Due Amount", "Monthly Target", "Total Assets" (Cash + Bank balances).
    - Triggers the rendering of Chart.js elements.
    - Integrates closely with `finance-engine.js` to ensure the numbers match exactly what the rules define.

### 11. `student-management.js` & `modals-student.html`
- **Functionality**: Core student CRM operations.
- **Key Details**: Add/Edit/Delete students, handle their payments (Course Fees), generate Auto IDs (`WF-1001`), and track attendance or assigned batches.

### 12. `loan-management.js`, `visitor-management.js`, `employee-management.js`
- **Functionality**: Independent modules tailored to track Loans (Given/Received), Office Visitors, and HR/Staff records.
- **Key Details**: Each module operates autonomously, reading and writing to its specific array in `globalData` and rendering its own table.

### 13. `section-loader.js`
- **Functionality**: A performance optimization tool.
- **Key Details**: Instead of keeping hundreds of thousands of lines of HTML in `index.html`, this script uses `fetch()` to inject modal HTMLs into `index.html` placeholders only when needed.

---

## 📝 Conclusion
This application applies a modular architecture where the **Data Layer** (Supabase Sync & `globalData`), **Rules Engine** (`finance-engine.js`), and **Presentation Layer** (`html` & SweetAlert UI) are kept separated. Design is unified through CSS variables prioritizing premium dark aesthetics with vibrant highlights.

*(Note: For the next developer or AI, always ensure `finance-engine.js` is respected whenever introducing new transaction types to avoid PnL mismatch.)*

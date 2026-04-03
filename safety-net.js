        // ============================================================
        // WINGS FLY — SAFETY NET (সব JS load হওয়ার পরে চলে)
        // clearActivityLog সহ সব critical functions guarantee করে
        // ============================================================
        (function () {
            function ensureFunctions() {
                // clearActivityLog — index.html এ call হয়
                if (typeof window.clearActivityLog !== 'function') {
                    window.clearActivityLog = function () {
                        if (!confirm('সব Activity History মুছে ফেলবেন?')) return;
                        if (!window.globalData) return;
                        window.globalData.activityHistory = [];
                        localStorage.setItem('wingsfly_activity_backup', '[]');
                        localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
                        if (typeof window.loadActivityHistory === 'function') window.loadActivityHistory();
                        if (typeof window.showSuccessToast === 'function') window.showSuccessToast('Activity History cleared!');
                        else alert('Activity History cleared!');
                    };
                    console.log('[SafetyNet] clearActivityLog defined ✓');
                }

                // renderActivityLog — Activity Log tab
                if (typeof window.renderActivityLog !== 'function') {
                    window.renderActivityLog = function () {
                        if (!window.globalData) window.globalData = {};
                        try {
                            var bk = localStorage.getItem('wingsfly_activity_backup');
                            if (bk) window.globalData.activityHistory = JSON.parse(bk);
                        } catch (e) { }
                        if (!window.globalData.activityHistory) window.globalData.activityHistory = [];
                        if (typeof window.loadActivityHistory === 'function') window.loadActivityHistory();
                    };
                    console.log('[SafetyNet] renderActivityLog defined ✓');
                }

                // renderRecycleBin — Recycle Bin tab
                if (typeof window.renderRecycleBin !== 'function') {
                    window.renderRecycleBin = function () {
                        if (!window.globalData) window.globalData = {};
                        try {
                            var bk = localStorage.getItem('wingsfly_deleted_backup');
                            if (bk) window.globalData.deletedItems = JSON.parse(bk);
                        } catch (e) { }
                        // ✅ FIX: deletedItems array + object properties দুটোই support করো
                        (function() {
                          const di = window.globalData.deletedItems;
                          if (!di) {
                            const arr = [];
                            arr.students = []; arr.finance = []; arr.employees = []; arr.other = [];
                            window.globalData.deletedItems = arr;
                          } else if (!Array.isArray(di)) {
                            const flat = [
                              ...(Array.isArray(di.students) ? di.students : []),
                              ...(Array.isArray(di.finance) ? di.finance : []),
                              ...(Array.isArray(di.employees) ? di.employees : []),
                              ...(Array.isArray(di.other) ? di.other : [])
                            ];
                            flat.students = Array.isArray(di.students) ? di.students : [];
                            flat.finance = Array.isArray(di.finance) ? di.finance : [];
                            flat.employees = Array.isArray(di.employees) ? di.employees : [];
                            flat.other = Array.isArray(di.other) ? di.other : [];
                            window.globalData.deletedItems = flat;
                          } else {
                            if (!Array.isArray(di.students)) di.students = [];
                            if (!Array.isArray(di.finance)) di.finance = [];
                            if (!Array.isArray(di.employees)) di.employees = [];
                            if (!Array.isArray(di.other)) di.other = [];
                          }
                        })();
                        if (typeof window.loadDeletedItems === 'function') window.loadDeletedItems();
                    };
                    console.log('[SafetyNet] renderRecycleBin defined ✓');
                }
            }

            // DOM ready হলে run করো
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', ensureFunctions);
            } else {
                ensureFunctions();
            }
            // Extra safety: 2 সেকেন্ড পরে আবার check
            setTimeout(ensureFunctions, 2000);
        })();

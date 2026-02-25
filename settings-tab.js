        function switchSettingsTab(tabId, btn) {
            // Hide all tab panes
            document.querySelectorAll('.settings-tab-pane').forEach(function (p) {
                p.style.display = 'none';
            });
            // Deactivate all nav buttons
            document.querySelectorAll('#settingsModal .nav-link').forEach(function (b) {
                b.classList.remove('active');
            });
            // Show selected tab
            var tab = document.getElementById(tabId);
            if (tab) tab.style.display = 'block';
            // Activate button
            if (btn) btn.classList.add('active');
        }
        window.switchSettingsTab = switchSettingsTab;

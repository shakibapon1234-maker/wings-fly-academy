// WINGS FLY — Login Init
        // Initialize mobile banking on page load
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof renderMobileBankingList === 'function') {
                renderMobileBankingList();
            }
        });

        // ✅ EARLY DEFINE: checkPasswordMatch - settings modal এ oninput এ call হয়
        // app.js load হওয়ার আগেও কাজ করবে
        window.checkPasswordMatch = function() {
            var p1 = document.getElementById('settingsPassword');
            var p2 = document.getElementById('settingsPasswordConfirm');
            var msg = document.getElementById('passwordMatchMsg');
            if (!p1 || !p2 || !msg) return;
            if (!p1.value && !p2.value) { msg.style.display = 'none'; return; }
            if (p1.value === p2.value) {
                msg.style.display = 'block';
                msg.innerHTML = '<span style="color:#22c55e;">✅ পাসওয়ার্ড মিলেছে!</span>';
            } else {
                msg.style.display = 'block';
                msg.innerHTML = '<span style="color:#ef4444;">❌ পাসওয়ার্ড মিলছে না</span>';
            }
        };

        // ✅ EARLY DEFINE: handleLogin wrapper
        // app.js load না হলে queue করে রাখে, load হলে চালায়
        window._loginQueue = null;
        window.handleLogin = function(e) {
            e.preventDefault();
            // app.js এর real handleLogin load হয়েছে কিনা check করি
            if (window._appHandleLogin && typeof window._appHandleLogin === 'function') {
                window._appHandleLogin(e);
                return;
            }
            // এখনো load হয়নি — wait করো
            var err = document.getElementById('loginError');
            var btn = document.getElementById('loginBtn');
            if (err) err.innerText = 'লোড হচ্ছে... একটু অপেক্ষা করুন।';
            if (btn) btn.disabled = true;
            // 2 সেকেন্ড পরে আবার try করো
            setTimeout(function() {
                var form = document.getElementById('loginForm');
                if (window._appHandleLogin && form) {
                    // fake submit event তৈরি করো
                    var fakeEvent = { preventDefault: function(){}, target: form };
                    fakeEvent.target = form;
                    window._appHandleLogin(fakeEvent);
                } else {
                    if (err) err.innerText = 'পেজ রিফ্রেশ করুন এবং আবার চেষ্টা করুন।';
                    if (btn) { btn.disabled = false; btn.innerHTML = '<span>Login</span>'; }
                }
            }, 2000);
        };

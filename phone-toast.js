        (function () {
            let _phoneToastTimer = null;

            window.showPhoneOnlyToast = function () {
                const toast = document.getElementById('phoneOnlyToast');
                if (!toast) return;

                clearTimeout(_phoneToastTimer);
                toast.style.display = 'flex';
                toast.style.animation = 'none';
                void toast.offsetWidth;
                toast.style.animation = 'phoneToastIn 0.3s ease forwards';

                _phoneToastTimer = setTimeout(function () {
                    toast.style.animation = 'phoneToastOut 0.4s ease forwards';
                    setTimeout(function () {
                        toast.style.display = 'none';
                    }, 400);
                }, 2500);
            };
        })();

        // ════════════════════════════════════════
        // 1. LOGIN PAGE — PARTICLE BACKGROUND
        // ════════════════════════════════════════
        (function () {
            var canvas = document.getElementById('loginParticleCanvas');
            if (!canvas) return;
            var ctx = canvas.getContext('2d');
            var particles = [];
            var animFrame;

            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }

            function spawnParticles() {
                particles = [];
                var count = Math.floor((canvas.width * canvas.height) / 12000);
                count = Math.max(40, Math.min(count, 100));
                for (var i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        r: Math.random() * 1.6 + 0.3,
                        dx: (Math.random() - 0.5) * 0.35,
                        dy: (Math.random() - 0.5) * 0.35,
                        alpha: Math.random() * 0.5 + 0.15
                    });
                }
            }

            function drawParticles() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                particles.forEach(function (p) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(0,217,255,' + p.alpha + ')';
                    ctx.fill();
                    p.x += p.dx;
                    p.y += p.dy;
                    if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
                    if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
                });
                animFrame = requestAnimationFrame(drawParticles);
            }

            function startParticles() {
                canvas.style.display = 'block';
                resize();
                spawnParticles();
                if (animFrame) cancelAnimationFrame(animFrame);
                drawParticles();
            }

            function stopParticles() {
                canvas.style.display = 'none';
                if (animFrame) cancelAnimationFrame(animFrame);
            }

            window.addEventListener('resize', function () {
                if (canvas.style.display !== 'none') { resize(); spawnParticles(); }
            });

            // LoginSection দেখা/লুকানো watch করি
            var loginSection = document.getElementById('loginSection');
            if (loginSection) {
                var observer = new MutationObserver(function () {
                    var hidden = loginSection.classList.contains('d-none');
                    if (hidden) stopParticles(); else startParticles();
                });
                observer.observe(loginSection, { attributes: true, attributeFilter: ['class'] });
                // Page load-এ যদি login দেখা যায়
                if (!loginSection.classList.contains('d-none')) startParticles();
            }
        })();

        // ════════════════════════════════════════
        // 2. RIPPLE EFFECT — সব .btn button-এ
        // ════════════════════════════════════════
        (function () {
            document.addEventListener('mousedown', function (e) {
                var btn = e.target.closest('.btn');
                if (!btn) return;
                var rect = btn.getBoundingClientRect();
                var size = Math.max(btn.offsetWidth, btn.offsetHeight);
                var wave = document.createElement('span');
                wave.className = 'ripple-wave';
                wave.style.cssText = [
                    'width:' + size + 'px',
                    'height:' + size + 'px',
                    'left:' + (e.clientX - rect.left - size / 2) + 'px',
                    'top:' + (e.clientY - rect.top - size / 2) + 'px'
                ].join(';');
                btn.appendChild(wave);
                wave.addEventListener('animationend', function () { wave.remove(); });
            });
        })();

        // ════════════════════════════════════════
        // 3. SIDEBAR LOGO — ACTIVITY SPIN
        // ════════════════════════════════════════
        (function () {
            var logo = null;
            var idleTimer = null;
            var IDLE_DELAY = 1500;

            function startSpin() {
                if (!logo) logo = document.getElementById('sidebarLogoImg');
                if (!logo) return;
                logo.classList.add('is-active');
                clearTimeout(idleTimer);
                idleTimer = setTimeout(function () {
                    logo.classList.remove('is-active');
                }, IDLE_DELAY);
            }

            ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchmove'].forEach(function (evt) {
                document.addEventListener(evt, startSpin, { passive: true });
            });
        })();

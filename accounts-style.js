/**
 * WINGS FLY — ACCOUNTS STYLE v2.0
 * Total Balance Overview — Animated Glow Design
 * HTML touch করা হয়নি — শুধু class inject
 */
(function () {
  'use strict';

  const STYLE_ID = 'wf-accounts-style-v2';
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `

  #totalBalanceCash {
    background: linear-gradient(90deg, #f093fb, #f5576c) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    font-size: 1.6rem !important; font-weight: 900 !important;
  }
  #totalBalanceBank {
    background: linear-gradient(90deg, #4facfe, #00f2fe) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    font-size: 1.6rem !important; font-weight: 900 !important;
  }
  #totalBalanceMobile {
    background: linear-gradient(90deg, #38ef7d, #11998e) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    font-size: 1.6rem !important; font-weight: 900 !important;
  }
  #totalBalanceGrand {
    background: linear-gradient(90deg, #ffd700, #ff8c00, #ffd700) !important;
    background-size: 200% auto !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    animation: wfGoldShimmer 3s linear infinite !important;
    font-size: 3rem !important; text-shadow: none !important; letter-spacing: -1px;
  }
  @keyframes wfGoldShimmer {
    0%   { background-position: 0% center; }
    100% { background-position: 200% center; }
  }

  .wf-total-card {
    background: linear-gradient(135deg,#050d25 0%,#090e30 40%,#060b22 100%) !important;
    border-radius: 24px !important;
    border: none !important;
    animation: wfBoxGlow 4s ease-in-out infinite !important;
    position: relative; overflow: hidden;
  }
  .wf-total-card::before {
    content:''; position:absolute; inset:0; border-radius:24px;
    background: radial-gradient(ellipse at 50% -10%, rgba(79,172,254,0.12) 0%, transparent 65%);
    pointer-events:none;
  }
  .wf-total-card .card-body { position:relative; z-index:1; }

  @keyframes wfBoxGlow {
    0%,100% { box-shadow: 0 0 0 2px #4facfe, 0 0 0 4.5px rgba(123,47,255,0.7), 0 0 45px rgba(79,172,254,0.22), 0 20px 60px rgba(0,0,0,0.6); }
    33%      { box-shadow: 0 0 0 2px #f093fb, 0 0 0 4.5px rgba(245,87,108,0.7), 0 0 45px rgba(240,147,251,0.22), 0 20px 60px rgba(0,0,0,0.6); }
    66%      { box-shadow: 0 0 0 2px #38ef7d, 0 0 0 4.5px rgba(17,153,142,0.7),  0 0 45px rgba(56,239,125,0.22),  0 20px 60px rgba(0,0,0,0.6); }
  }

  .wf-total-card h4 {
    background: linear-gradient(90deg,#4facfe,#00f2fe,#c084fc) !important;
    -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important;
    background-clip: text !important; font-size:1.4rem !important; letter-spacing:1.5px;
  }
  .wf-total-card h4 span { -webkit-text-fill-color: initial !important; }
  .wf-sub { color: rgba(160,190,255,0.5) !important; }

  .wf-mini {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    transition: all 0.3s ease; cursor: default;
  }
  .wf-mini:hover { transform: translateY(-5px); }
  .wf-mini-c:hover { background:rgba(245,87,108,0.1)!important; border-color:rgba(240,147,251,0.5)!important; box-shadow:0 12px 28px rgba(245,87,108,0.2); }
  .wf-mini-b:hover { background:rgba(79,172,254,0.1)!important;  border-color:rgba(79,172,254,0.5)!important;  box-shadow:0 12px 28px rgba(79,172,254,0.2);  }
  .wf-mini-m:hover { background:rgba(56,239,125,0.1)!important;  border-color:rgba(56,239,125,0.5)!important;  box-shadow:0 12px 28px rgba(56,239,125,0.2);  }
  .wf-lbl { color: rgba(180,200,255,0.55) !important; }

  .wf-grand-wrap { border-top: 1px solid rgba(255,215,0,0.2) !important; }
  .wf-grand-lbl  { color: rgba(255,215,0,0.6) !important; letter-spacing:2px; }
  `;
  document.head.appendChild(style);

  function applyStyle() {
    const grand = document.getElementById('totalBalanceGrand');
    if (!grand) return;

    // Walk up to .card
    let card = grand.parentElement;
    while (card && !card.classList.contains('card')) {
      card = card.parentElement;
    }
    if (!card) return;

    card.classList.add('wf-total-card');

    const h4 = card.querySelector('h4');
    if (h4) h4.classList.add('wf-bal-title');

    const sub = card.querySelector('.text-center p');
    if (sub) sub.classList.add('wf-sub');

    const minis = card.querySelectorAll('.rounded-4');
    minis.forEach((m, i) => {
      m.classList.add('wf-mini');
      if (i === 0) m.classList.add('wf-mini-c');
      if (i === 1) m.classList.add('wf-mini-b');
      if (i === 2) m.classList.add('wf-mini-m');
      const lbl = m.querySelector('.text-uppercase');
      if (lbl) lbl.classList.add('wf-lbl');
    });

    const grandWrap = grand.closest('.pt-3');
    if (grandWrap) {
      grandWrap.classList.add('wf-grand-wrap');
      const lbl = grandWrap.querySelector('.text-uppercase');
      if (lbl) lbl.classList.add('wf-grand-lbl');
    }

    console.log('%c✅ WF Accounts Style v2 applied', 'color:#00d4ff;font-weight:bold');
  }

  // Run at multiple times to catch dynamic renders
  function run() {
    applyStyle();
    setTimeout(applyStyle, 500);
    setTimeout(applyStyle, 1500);
    setTimeout(applyStyle, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // Hook switchTab
  setTimeout(() => {
    if (typeof window.switchTab === 'function' && !window._wfAccStyleHooked) {
      window._wfAccStyleHooked = true;
      const orig = window.switchTab;
      window.switchTab = function (tab, ...args) {
        const r = orig.call(this, tab, ...args);
        if (tab === 'accounts') setTimeout(applyStyle, 200);
        return r;
      };
    }
    if (typeof window.renderFullUI === 'function' && !window._wfAccRenderHooked) {
      window._wfAccRenderHooked = true;
      const orig = window.renderFullUI;
      window.renderFullUI = function (...args) {
        const r = orig.apply(this, args);
        setTimeout(applyStyle, 250);
        return r;
      };
    }
  }, 1500);

})();

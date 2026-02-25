/**
 * ============================================================
 * WINGS FLY — ACCOUNTS TAB STYLE OVERRIDE
 * Pure class injection — DOM structure অপরিবর্তিত থাকবে
 * ============================================================
 */
(function () {
  'use strict';

  // ── Inject style block once ────────────────────────────────
  const STYLE_ID = 'wf-accounts-style-v1';
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `

  /* ── Total Balance Card — animated glow border ── */
  .wf-balance-card {
    background: linear-gradient(135deg, #050d25 0%, #090e30 40%, #060b22 100%) !important;
    border-radius: 24px !important;
    animation: wfBoxGlow 4s ease-in-out infinite !important;
    position: relative;
    overflow: hidden;
  }
  .wf-balance-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    background: radial-gradient(ellipse at 50% -20%, rgba(79,172,254,0.1) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }
  .wf-balance-card .card-body { position: relative; z-index: 1; }

  @keyframes wfBoxGlow {
    0%,100% { box-shadow: 0 0 0 2px #4facfe, 0 0 0 4px rgba(123,47,255,0.6), 0 0 40px rgba(79,172,254,0.2), 0 20px 60px rgba(0,0,0,0.5); }
    33%      { box-shadow: 0 0 0 2px #f093fb, 0 0 0 4px rgba(245,87,108,0.6), 0 0 40px rgba(240,147,251,0.2), 0 20px 60px rgba(0,0,0,0.5); }
    66%      { box-shadow: 0 0 0 2px #38ef7d, 0 0 0 4px rgba(17,153,142,0.6), 0 0 40px rgba(56,239,125,0.2), 0 20px 60px rgba(0,0,0,0.5); }
  }

  /* ── Title gradient ── */
  .wf-balance-card h4 {
    background: linear-gradient(90deg, #4facfe, #00f2fe, #c084fc) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    font-size: 1.4rem !important;
    letter-spacing: 1.5px;
  }
  .wf-balance-card h4 span { -webkit-text-fill-color: initial !important; }

  /* ── Subtitle ── */
  .wf-balance-card .wf-subtitle {
    color: rgba(160,190,255,0.5) !important;
  }

  /* ── 3 mini cards ── */
  .wf-mini-card {
    background: rgba(255,255,255,0.04) !important;
    border: 1px solid rgba(255,255,255,0.1) !important;
    transition: all 0.3s ease;
    cursor: default;
  }
  .wf-mini-card:hover { transform: translateY(-5px); }

  .wf-mini-cash  { } .wf-mini-cash:hover  { background: rgba(245,87,108,0.1) !important; border-color: rgba(240,147,251,0.5) !important; box-shadow: 0 12px 30px rgba(245,87,108,0.2); }
  .wf-mini-bank  { } .wf-mini-bank:hover  { background: rgba(79,172,254,0.1)  !important; border-color: rgba(79,172,254,0.5)  !important; box-shadow: 0 12px 30px rgba(79,172,254,0.2);  }
  .wf-mini-mobile{ } .wf-mini-mobile:hover{ background: rgba(56,239,125,0.1)  !important; border-color: rgba(56,239,125,0.5)  !important; box-shadow: 0 12px 30px rgba(56,239,125,0.2);  }

  /* ── Balance numbers ── */
  #totalBalanceCash {
    background: linear-gradient(90deg, #f093fb, #f5576c) !important;
    -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important;
    background-clip: text !important; font-size: 1.6rem !important; font-weight: 900 !important;
  }
  #totalBalanceBank {
    background: linear-gradient(90deg, #4facfe, #00f2fe) !important;
    -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important;
    background-clip: text !important; font-size: 1.6rem !important; font-weight: 900 !important;
  }
  #totalBalanceMobile {
    background: linear-gradient(90deg, #38ef7d, #11998e) !important;
    -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important;
    background-clip: text !important; font-size: 1.6rem !important; font-weight: 900 !important;
  }

  /* ── Grand Total ── */
  #totalBalanceGrand {
    background: linear-gradient(90deg, #ffd700, #ff8c00, #ffd700) !important;
    background-size: 200% auto !important;
    -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
    animation: wfGoldShimmer 3s linear infinite !important;
    font-size: 3rem !important; text-shadow: none !important; letter-spacing: -1px;
  }
  @keyframes wfGoldShimmer {
    0%   { background-position: 0% center; }
    100% { background-position: 200% center; }
  }
  .wf-grand-label { color: rgba(255,215,0,0.6) !important; letter-spacing: 2px; }
  .wf-grand-divider { border-top: 1px solid rgba(255,215,0,0.2) !important; }

  /* ── Mini card labels ── */
  .wf-mini-card .wf-label { color: rgba(180,200,255,0.6) !important; }
  `;
  document.head.appendChild(style);

  // ── Apply classes after DOM ready ─────────────────────────
  function applyAccountsStyle() {
    // 1. Total Balance Card
    const grandEl = document.getElementById('totalBalanceGrand');
    if (!grandEl) return;

    // Find the card ancestor (3 levels up from grand total div)
    const card = grandEl.closest('.card.no-print, .card.border-0.shadow-lg.mb-4');
    if (card && !card.classList.contains('wf-balance-card')) {
      card.classList.add('wf-balance-card');

      // Title h4
      const h4 = card.querySelector('h4');
      if (h4) h4.classList.add('wf-balance-title');

      // Subtitle p
      const subtitle = card.querySelector('.text-center > p');
      if (subtitle) subtitle.classList.add('wf-subtitle');

      // 3 mini cards
      const miniCards = card.querySelectorAll('.rounded-4');
      miniCards.forEach((mc, i) => {
        mc.classList.add('wf-mini-card');
        if (i === 0) mc.classList.add('wf-mini-cash');
        if (i === 1) mc.classList.add('wf-mini-bank');
        if (i === 2) mc.classList.add('wf-mini-mobile');

        // Labels inside mini cards
        const label = mc.querySelector('.text-uppercase');
        if (label) label.classList.add('wf-label');
      });

      // Grand Total divider & label
      const grandSection = grandEl.closest('.pt-3');
      if (grandSection) {
        grandSection.classList.add('wf-grand-divider');
        const grandLabel = grandSection.querySelector('.text-uppercase');
        if (grandLabel) grandLabel.classList.add('wf-grand-label');
      }
    }
  }

  // Run after page load & after any UI refresh
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAccountsStyle);
  } else {
    applyAccountsStyle();
  }

  // Re-apply when Accounts tab opens (in case of dynamic render)
  const origSwitch = window.switchTab;
  if (typeof origSwitch === 'function') {
    window.switchTab = function(tab, ...args) {
      const result = origSwitch.call(this, tab, ...args);
      if (tab === 'accounts') {
        setTimeout(applyAccountsStyle, 150);
      }
      return result;
    };
  }

  // Also re-apply after any UI refresh
  const origRenderFull = window.renderFullUI;
  if (typeof origRenderFull === 'function') {
    window.renderFullUI = function(...args) {
      const result = origRenderFull.apply(this, args);
      setTimeout(applyAccountsStyle, 200);
      return result;
    };
  }

  console.log('%c✅ Accounts Style v1 loaded', 'color:#00d4ff;font-weight:bold');
})();

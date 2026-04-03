/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY
 * TAB LAZY LOADING SYSTEM - Performance Optimization
 * File: sections/tab-lazy-loader.js
 * ============================================================
 * 
 * এই সিস্টেম tab content লোড করবে শুধু যখন ব্যবহারকারী সেই tab এ ক্লিক করবে।
 * এটি initial page load speed বাড়াবে।
 */

(function() {
  'use strict';

  const TabLazyLoader = {
    // কোন tab এর render function লোড হয়েছে
    _loadedTabs: new Set(['dashboard']),
    
    // কোন tab এর render function call হয়েছে
    _renderedTabs: new Set(),
    
    // Tab configuration - কোন tab এ কোন render function দরকার
    // NOTE: এই সিস্টেম শুধু monitoring করে, actual rendering সবসময় switchTab এ হয়
    TAB_RENDER_CONFIG: {
      'students': {
        renderFn: 'renderStudents',
        fallbackFn: 'render',
        sectionId: 'studentSection'
      },
      'ledger': {
        renderFn: 'renderLedger',
        fallbackFn: 'filterData',
        sectionId: 'ledgerSection'
      },
      'employees': {
        renderFn: 'renderEmployeeList',
        fallbackFn: 'renderEmployees',
        sectionId: 'employeeSection'
      },
      'loans': {
        renderFn: 'renderLoanSummary',
        sectionId: 'loanSection'
      },
      'visitors': {
        renderFn: 'renderVisitors',
        sectionId: 'visitorSection'
      },
      'examResults': {
        renderFn: 'renderExamResults',
        fallbackFn: 'renderExamRegistrations',
        sectionId: 'examResultsSection'
      },
      'salary': {
        renderFn: 'renderSalaryCards',
        fallbackFn: 'renderSalaryData',
        sectionId: 'salarySection'
      },
      'accounts': {
        renderFn: 'renderAccountList',
        fallbackFn: 'renderFullUI',
        sectionId: 'accountsSection'
      },
      'certificates': {
        renderFn: 'renderFullUI',
        sectionId: 'certificateSection'
      },
      'idcards': {
        renderFn: 'renderFullUI',
        sectionId: 'idcardsSection'
      }
    },

    /**
     * Tab switch এ call হবে - lazy load করবে
     */
    onTabSwitch: function(tabName) {
      if (this._renderedTabs.has(tabName)) {
        console.log('[LazyLoad] Tab already rendered:', tabName);
        return;
      }

      const config = this.TAB_RENDER_CONFIG[tabName];
      if (!config) {
        console.log('[LazyLoad] No config for tab:', tabName);
        return;
      }

      console.log('[LazyLoad] Loading tab:', tabName);
      
      // ধাপ 1: Check if render function ready
      const renderFn = config.renderFn;
      if (typeof window[renderFn] === 'function') {
        this._callRender(tabName, renderFn);
      } else {
        // ধাপ 2: Wait for function to be available (max 5 seconds)
        let attempts = 0;
        const checkAndRender = () => {
          attempts++;
          if (typeof window[renderFn] === 'function') {
            this._callRender(tabName, renderFn);
          } else if (attempts < 50) {
            setTimeout(checkAndRender, 100);
          } else {
            console.warn('[LazyLoad] Render function not found:', renderFn);
            // Fallback 1: Try config.fallbackFn
            if (config.fallbackFn && typeof window[config.fallbackFn] === 'function') {
              console.log('[LazyLoad] Using fallback:', config.fallbackFn);
              this._callRender(tabName, config.fallbackFn);
            } 
            // Fallback 2: Try renderFullUI for generic sections
            else if (typeof window.renderFullUI === 'function') {
              console.log('[LazyLoad] Using global fallback: renderFullUI');
              window.renderFullUI();
              this._renderedTabs.add(tabName);
            }
            // Fallback 3: Try filterData if available
            else if (typeof window.filterData === 'function') {
              console.log('[LazyLoad] Using emergency fallback: filterData');
              window.filterData();
              this._renderedTabs.add(tabName);
            }
          }
        };
        setTimeout(checkAndRender, 100);
      }
    },

    /**
     * Render function call করা
     */
    _callRender: function(tabName, renderFn) {
      try {
        window[renderFn]();
        this._renderedTabs.add(tabName);
        console.log('[LazyLoad] ✅ Rendered:', tabName, '->', renderFn);
      } catch (e) {
        console.error('[LazyLoad] Error rendering:', tabName, e);
      }
    },

    /**
     * Force reload a tab (for refresh)
     */
    reloadTab: function(tabName) {
      this._renderedTabs.delete(tabName);
      this.onTabSwitch(tabName);
    },

    /**
     * Get loaded tabs count
     */
    getStats: function() {
      return {
        loaded: this._loadedTabs.size,
        rendered: this._renderedTabs.size,
        tabs: Array.from(this._renderedTabs)
      };
    }
  };

  // Global exposure
  window.TabLazyLoader = TabLazyLoader;
  
  // Auto-initialize when switchTab is called
  const originalSwitchTab = window.switchTab;
  window.switchTab = function(tab, refreshStats) {
    // Call original first
    if (typeof originalSwitchTab === 'function') {
      originalSwitchTab(tab, refreshStats);
    }
    
    // Then lazy load if needed - BUT also trigger immediate render for ledger/accounts
    if (tab && tab !== 'dashboard') {
      // For ledger/accounts, render immediately when tab becomes visible
      if (tab === 'ledger' || tab === 'accounts') {
        // Mark as rendered so it doesn't re-render unnecessarily, but render NOW
        this._renderedTabs.add(tab);
        if (tab === 'ledger' && typeof window.filterData === 'function') {
          window.filterData();
        } else if (tab === 'accounts' && typeof window.renderAccountList === 'function') {
          window.renderAccountList();
          if (typeof window.renderCashBalance === 'function') window.renderCashBalance();
          if (typeof window.renderMobileBankingList === 'function') window.renderMobileBankingList();
          if (typeof window.updateGrandTotal === 'function') window.updateGrandTotal();
        }
      } else {
        // For other tabs, use delayed lazy loading
        setTimeout(() => {
          TabLazyLoader.onTabSwitch(tab);
        }, 100);
      }
    }
  };

  console.log('✅ Tab Lazy Loader initialized (v2 - instant render for ledger/accounts)');
})();
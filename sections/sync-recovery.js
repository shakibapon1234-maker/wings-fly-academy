/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * SYNC RECOVERY FIX - Fix deleted items mismatch
 * 
 * Problem:
 * - Cloud: 78 active finance, 30 deleted
 * - Local: 71 active finance, 4 deleted
 * - 7 active records missing locally
 * - 26 deleted records missing locally
 * 
 * Solution: Pull deleted records from cloud and sync local
 */

(function() {
  'use strict';

  if (window._syncRecoveryLoaded) {
    console.log('[SyncRecovery] Already loaded');
    return;
  }
  window._syncRecoveryLoaded = true;

  async function pullDeletedItemsFromCloud() {
    const config = window.SUPABASE_CONFIG;
    if (!config || !config.URL || !config.KEY) {
      console.error('[SyncRecovery] Config not found');
      return false;
    }

    const headers = {
      'apikey': config.KEY,
      'Authorization': 'Bearer ' + config.KEY
    };

    try {
      console.log('[SyncRecovery] 🔄 Pulling deleted items from cloud...');

      // Get deleted finance from cloud
      const finRes = await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.true&select=*`, { headers });
      const deletedFinance = finRes.ok ? await finRes.json() : [];
      
      // Get deleted students from cloud
      const stuRes = await fetch(`${config.URL}/rest/v1/wf_students?deleted=eq.true&select=*`, { headers });
      const deletedStudents = stuRes.ok ? await stuRes.json() : [];

      console.log(`[SyncRecovery] 📥 Cloud deleted: Finance=${deletedFinance.length}, Students=${deletedStudents.length}`);

      // Get local data
      let localData = window.globalData;
      if (!localData) {
        const saved = localStorage.getItem('wingsfly_data');
        localData = saved ? JSON.parse(saved) : {};
      }

      // Initialize deletedItems if not present
      if (!localData.deletedItems || Array.isArray(localData.deletedItems)) {
        localData.deletedItems = { students: [], finance: [], employees: [] };
      }

      // Add missing deleted finance to local
      const localDeletedFinIds = new Set(
        (localData.deletedItems.finance || []).map(d => d.id || d.item?.id)
      );
      
      let addedFinance = 0;
      deletedFinance.forEach(item => {
        if (!localDeletedFinIds.has(item.id)) {
          localData.deletedItems.finance.push({
            id: 'fin_del_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: 'finance',
            item: item,
            deletedAt: new Date().toISOString()
          });
          addedFinance++;
        }
      });

      // Add missing deleted students to local
      const localDeletedStuIds = new Set(
        (localData.deletedItems.students || []).map(d => d.id || d.item?.id)
      );
      
      let addedStudents = 0;
      deletedStudents.forEach(item => {
        if (!localDeletedStuIds.has(item.id)) {
          localData.deletedItems.students.push({
            id: 'stu_del_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: 'student',
            item: item,
            deletedAt: new Date().toISOString()
          });
          addedStudents++;
        }
      });

      console.log(`[SyncRecovery] ✅ Added: Finance=${addedFinance}, Students=${addedStudents}`);

      // Save updated local data
      window.globalData = localData;
      localStorage.setItem('wingsfly_data', JSON.stringify(localData));
      localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(localData.deletedItems));

      return { addedFinance, addedStudents };
    } catch(e) {
      console.error('[SyncRecovery] Error:', e);
      return false;
    }
  }

  // Function to manually trigger sync recovery
  window.SyncRecovery = {
    pullDeleted: pullDeletedItemsFromCloud,
    
    // Full sync: push local to cloud then pull
    fullSync: async function() {
      console.log('[SyncRecovery] 🔄 Starting full sync recovery...');
      
      // First try to push
      if (typeof window.wingsSync?.pushToCloud === 'function') {
        console.log('[SyncRecovery] 📤 Pushing to cloud...');
        await window.wingsSync.pushToCloud('RecoveryPush');
      }
      
      // Then pull deleted items
      const result = await pullDeletedItemsFromCloud();
      
      // Finally pull all from cloud
      if (typeof window.wingsSync?.pullFromCloud === 'function') {
        console.log('[SyncRecovery] 📥 Pulling from cloud...');
        await window.wingsSync.pullFromCloud(false, true);
      }
      
      console.log('[SyncRecovery] ✅ Full sync complete');
      return result;
    },

    // Diagnose the issue
    diagnose: async function() {
      const config = window.SUPABASE_CONFIG;
      if (!config) return { error: 'No config' };

      const headers = {
        'apikey': config.KEY,
        'Authorization': 'Bearer ' + config.KEY
      };

      // Get active counts
      const activeFin = await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.false&select=id`, { headers });
      const activeFinData = activeFin.ok ? await activeFin.json() : [];

      // Get deleted counts
      const delFin = await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.true&select=id`, { headers });
      const delFinData = delFin.ok ? await delFin.json() : [];

      // Get local
      const local = window.globalData || JSON.parse(localStorage.getItem('wingsfly_data') || '{}');

      console.log('═'.repeat(40));
      console.log('🔍 SYNC RECOVERY DIAGNOSIS');
      console.log('═'.repeat(40));
      console.log('Cloud Active Finance:', activeFinData.length);
      console.log('Cloud Deleted Finance:', delFinData.length);
      console.log('Local Active Finance:', (local.finance || []).length);
      console.log('Local Deleted Finance:', (local.deletedItems?.finance || []).length);
      console.log('═'.repeat(40));

      return {
        cloudActive: activeFinData.length,
        cloudDeleted: delFinData.length,
        localActive: (local.finance || []).length,
        localDeleted: (local.deletedItems?.finance || []).length
      };
    }
  };

  console.log('✅ Sync Recovery loaded. Use: SyncRecovery.fullSync() or SyncRecovery.diagnose()');
})();
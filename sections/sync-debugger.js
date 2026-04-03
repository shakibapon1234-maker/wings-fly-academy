/**
 * ════════════════════════════════════════════════════════════════
 * WINGS FLY AVIATION ACADEMY
 * SYNC DEBUG TOOL - Data Comparison
 * ════════════════════════════════════════════════════════════════
 */

(function() {
  'use strict';

  window.SyncDebugger = {
    // Get local data summary
    getLocalData: function() {
      try {
        const gd = window.globalData || JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
        return {
          students: gd.students?.length || 0,
          finance: gd.finance?.length || 0,
          employees: gd.employees?.length || 0,
          users: gd.users?.length || 0,
          settings: Object.keys(gd.settings || {}).length,
          lastUpdate: localStorage.getItem('lastLocalUpdate') || 'N/A',
          cashBalance: gd.cashBalance || 0,
          deletedItems: {
            students: gd.deletedItems?.students?.length || 0,
            finance: gd.deletedItems?.finance?.length || 0,
            employees: gd.deletedItems?.employees?.length || 0
          }
        };
      } catch(e) {
        return { error: e.message };
      }
    },

    // Get cloud data using REST API directly
    getCloudDataREST: async function() {
      const config = window.SUPABASE_CONFIG;
      if (!config || !config.URL || !config.KEY) {
        return { error: 'Supabase config not found' };
      }
      
      try {
        const headers = {
          'apikey': config.KEY,
          'Authorization': 'Bearer ' + config.KEY
        };
        
        // Get student count
        const stuRes = await fetch(`${config.URL}/rest/v1/wf_students?deleted=eq.false&select=id`, { headers });
        const stuData = stuRes.ok ? await stuRes.json() : [];
        
        // Get finance count
        const finRes = await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.false&select=id`, { headers });
        const finData = finRes.ok ? await finRes.json() : [];
        
        // Get employee count
        const empRes = await fetch(`${config.URL}/rest/v1/wf_employees?deleted=eq.false&select=id`, { headers });
        const empData = empRes.ok ? await empRes.json() : [];
        
        // Get main record
        const mainRes = await fetch(`${config.URL}/rest/v1/academy_data?id=eq.wingsfly_main`, { headers });
        const mainData = mainRes.ok ? await mainRes.json() : [];
        
        // Get DELETED counts
        const delStuRes = await fetch(`${config.URL}/rest/v1/wf_students?deleted=eq.true&select=id`, { headers });
        const delStuData = delStuRes.ok ? await delStuRes.json() : [];
        
        const delFinRes = await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.true&select=id`, { headers });
        const delFinData = delFinRes.ok ? await delFinRes.json() : [];
        
        return {
          students: stuData.length,
          finance: finData.length,
          employees: empData.length,
          deletedStudents: delStuData.length,
          deletedFinance: delFinData.length,
          lastCloudUpdate: mainData[0]?.last_update || 'N/A',
          version: mainData[0]?.version || 'N/A',
          method: 'REST API'
        };
      } catch(e) {
        return { error: e.message };
      }
    },

    // Get cloud data - tries both methods
    getCloudData: async function() {
      // First try REST API (more reliable)
      const restResult = await this.getCloudDataREST();
      if (!restResult.error) {
        return restResult;
      }
      
      // Fallback to Supabase JS client
      if (!window.SUPABASE_CONFIG) {
        return { error: 'Supabase config not found' };
      }
      
      // Get the correct supabase client
      let supabase = null;
      if (typeof window.getWingsSupabaseClient === 'function') {
        supabase = window.getWingsSupabaseClient();
      } else if (window.supabaseClient) {
        supabase = window.supabaseClient;
      } else if (window.supabase?.createClient) {
        supabase = window.supabase.createClient(
          window.SUPABASE_CONFIG.URL,
          window.SUPABASE_CONFIG.KEY
        );
      }
      
      if (!supabase) {
        return { error: 'Supabase client not initialized' };
      }
      
      try {
        
        // Get main record
        const { data: mainData } = await supabase
          .from('academy_data')
          .select('*')
          .eq('id', 'wingsfly_main')
          .single();
        
        if (!mainData) {
          return { error: 'No cloud data found' };
        }

        // Get student count
        const { count: studentCount } = await supabase
          .from('wf_students')
          .select('*', { count: 'exact', head: true })
          .eq('deleted', false);

        // Get finance count
        const { count: financeCount } = await supabase
          .from('wf_finance')
          .select('*', { count: 'exact', head: true })
          .eq('deleted', false);

        // Get employee count
        const { count: employeeCount } = await supabase
          .from('wf_employees')
          .select('*', { count: 'exact', head: true })
          .eq('deleted', false);

        // Get deleted counts
        const { count: deletedStudents } = await supabase
          .from('wf_students')
          .select('*', { count: 'exact', head: true })
          .eq('deleted', true);

        const { count: deletedFinance } = await supabase
          .from('wf_finance')
          .select('*', { count: 'exact', head: true })
          .eq('deleted', true);

        return {
          lastCloudUpdate: mainData.last_update || 'N/A',
          version: mainData.version || 'N/A',
          students: studentCount || 0,
          finance: financeCount || 0,
          employees: employeeCount || 0,
          deletedStudents: deletedStudents || 0,
          deletedFinance: deletedFinance || 0
        };
      } catch(e) {
        return { error: e.message };
      }
    },

    // Compare local vs cloud
    compare: async function() {
      const local = this.getLocalData();
      const cloud = await this.getCloudData();
      
      console.log('═'.repeat(50));
      console.log('📊 SYNC COMPARISON REPORT');
      console.log('═'.repeat(50));
      
      console.log('\n🏠 LOCAL DATA:');
      console.table(local);
      
      console.log('\n☁️ CLOUD DATA:');
      console.table(cloud);
      
      // Check for mismatches
      const mismatches = [];
      
      if (local.students !== cloud.students) {
        mismatches.push(`Students: Local(${local.students}) ≠ Cloud(${cloud.students})`);
      }
      if (local.finance !== cloud.finance) {
        mismatches.push(`Finance: Local(${local.finance}) ≠ Cloud(${cloud.finance})`);
      }
      if (local.employees !== cloud.employees) {
        mismatches.push(`Employees: Local(${local.employees}) ≠ Cloud(${cloud.employees})`);
      }
      
      // Check deleted items
      console.log('\n🗑️ DELETED ITEMS COMPARISON:');
      console.log(`  Local deleted - Students: ${local.deletedItems?.students || 0}, Finance: ${local.deletedItems?.finance || 0}`);
      console.log(`  Cloud deleted - Students: ${cloud.deletedStudents || 0}, Finance: ${cloud.deletedFinance || 0}`);
      
      if (local.deletedItems?.finance !== cloud.deletedFinance) {
        mismatches.push(`Deleted Finance: Local(${local.deletedItems?.finance || 0}) ≠ Cloud(${cloud.deletedFinance || 0})`);
      }
      
      console.log('\n⚠️ MISMATCHES:');
      if (mismatches.length === 0) {
        console.log('✅ No mismatches found!');
      } else {
        mismatches.forEach(m => console.log('  ❌', m));
      }
      
      console.log('═'.repeat(50));
      
      return { local, cloud, mismatches };
    },

    // Show missing finance records (in cloud but not in local)
    showMissingFinance: async function() {
      const config = window.SUPABASE_CONFIG;
      if (!config || !config.URL || !config.KEY) {
        console.error('Config not found');
        return;
      }
      
      const headers = {
        'apikey': config.KEY,
        'Authorization': 'Bearer ' + config.KEY
      };
      
      try {
        // Get all active finance from cloud
        const res = await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.false&select=id,timestamp,amount,type,method,description`, { headers });
        const cloudData = res.ok ? await res.json() : [];
        
        // Get local finance IDs
        const localData = window.globalData || JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
        const localIds = new Set((localData.finance || []).map(f => f.id));
        
        // Find missing
        const missing = cloudData.filter(c => !localIds.has(c.id));
        
        console.log('═'.repeat(50));
        console.log('🔍 MISSING FINANCE RECORDS (Cloud → Local)');
        console.log('═'.repeat(50));
        console.log(`Total missing: ${missing.length}`);
        console.log('');
        
        missing.forEach((m, i) => {
          console.log(`${i+1}. ID: ${m.id}`);
          console.log(`   Date: ${m.timestamp || 'N/A'}`);
          console.log(`   Type: ${m.type || 'N/A'}`);
          console.log(`   Method: ${m.method || 'N/A'}`);
          console.log(`   Amount: ${m.amount || 0}`);
          console.log(`   Description: ${m.description || 'N/A'}`);
          console.log('');
        });
        
        console.log('═'.repeat(50));
        
        return missing;
      } catch(e) {
        console.error('Error:', e);
        return [];
      }
    },

    // Show extra records in local (in local but not in cloud)
    showExtraFinance: async function() {
      const config = window.SUPABASE_CONFIG;
      if (!config || !config.URL || !config.KEY) {
        console.error('Config not found');
        return;
      }
      
      const headers = {
        'apikey': config.KEY,
        'Authorization': 'Bearer ' + config.KEY
      };
      
      try {
        // Get all active finance from cloud
        const res = await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.false&select=id`, { headers });
        const cloudData = res.ok ? await res.json() : [];
        const cloudIds = new Set(cloudData.map(c => c.id));
        
        // Get local finance
        const localData = window.globalData || JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
        const local = localData.finance || [];
        
        // Find extra in local
        const extra = local.filter(l => !cloudIds.has(l.id));
        
        console.log('═'.repeat(50));
        console.log('🔍 EXTRA FINANCE RECORDS (Local → Cloud)');
        console.log('═'.repeat(50));
        console.log(`Total extra: ${extra.length}`);
        console.log('');
        
        extra.forEach((m, i) => {
          console.log(`${i+1}. ID: ${m.id}`);
          console.log(`   Date: ${m.timestamp || m.date || 'N/A'}`);
          console.log(`   Type: ${m.type || 'N/A'}`);
          console.log(`   Method: ${m.method || 'N/A'}`);
          console.log(`   Amount: ${m.amount || 0}`);
          console.log(`   Description: ${m.description || m.note || 'N/A'}`);
          console.log('');
        });
        
        console.log('═'.repeat(50));
        
        return extra;
      } catch(e) {
        console.error('Error:', e);
        return [];
      }
    },
    forceSync: async function() {
      console.log('🔄 Starting manual sync...');
      
      if (typeof window.wingsSync?.pushToCloud === 'function') {
        await window.wingsSync.pushToCloud('Manual');
        console.log('✅ Push complete');
      }
      
      if (typeof window.wingsSync?.pullFromCloud === 'function') {
        await window.wingsSync.pullFromCloud(false, true);
        console.log('✅ Pull complete');
      }
      
      // Show updated status
      setTimeout(() => this.compare(), 2000);
    },

    // Check if cloud is available
    checkCloudStatus: function() {
      let supabase = null;
      if (typeof window.getWingsSupabaseClient === 'function') {
        supabase = window.getWingsSupabaseClient();
      } else if (window.supabaseClient) {
        supabase = window.supabaseClient;
      }
      
      if (!supabase) {
        return { available: false, reason: 'Client not initialized' };
      }
      
      return { available: true };
    },

    // Check sync status from wingsSync
    getSyncStatus: function() {
      if (!window.wingsSync) {
        return { error: 'wingsSync not found' };
      }
      
      return {
        ready: window.wingsSync._ready || false,
        pushing: window.wingsSync._pushing || false,
        pulling: window.wingsSync._pulling || false,
        online: window.wingsSync._online || navigator.onLine,
        suppressRender: window.wingsSync._suppressRender || false,
        lastPull: localStorage.getItem('lastCloudPull') || 'N/A',
        lastPush: localStorage.getItem('lastCloudPush') || 'N/A',
        partialOK: window.wingsSync._partialOK || false
      };
    },

    // Full diagnostic
    diagnose: async function() {
      console.log('🔍 Running full diagnostic...');
      
      const syncStatus = this.getSyncStatus();
      const local = this.getLocalData();
      const cloud = await this.getCloudData();
      const comparison = await this.compare();
      
      // Check deleted items in cloud
      console.log('\n🗑️ CLOUD DELETED ITEMS:');
      console.log('  Deleted Students:', cloud.deletedStudents || 0);
      console.log('  Deleted Finance:', cloud.deletedFinance || 0);
      
      // Check local deleted items
      console.log('\n🗑️ LOCAL DELETED ITEMS:');
      console.log('  Students:', local.deletedItems?.students || 0);
      console.log('  Finance:', local.deletedItems?.finance || 0);
      console.log('  Employees:', local.deletedItems?.employees || 0);
      
      return {
        syncStatus,
        local,
        cloud,
        mismatches: comparison.mismatches
      };
    }
  };

  console.log('✅ Sync Debugger loaded. Use: SyncDebugger.diagnose()');
})();
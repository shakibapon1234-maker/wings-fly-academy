/**
 * Debug which specific finance records are failing
 */
(async function() {
  const config = window.SUPABASE_CONFIG;
  if (!config || !config.URL || !config.KEY) {
    console.error('Config not found');
    return;
  }
  
  const ACADEMY_ID = 'wingsfly_main';
  const headers = {
    'apikey': config.KEY,
    'Authorization': 'Bearer ' + config.KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=representation'
  };
  
  // Get local data
  const localData = window.globalData || JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
  const localFinance = localData.finance || [];
  
  console.log(`🔍 Debugging ${localFinance.length} finance records...\n`);
  
  // Test push first 5 one by one to see which fail
  for (let i = 0; i < Math.min(10, localFinance.length); i++) {
    const f = localFinance[i];
    const fid = f.id || 'fin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const row = {
      id: `${ACADEMY_ID}_fin_${fid}`,
      academy_id: ACADEMY_ID,
      data: f,
      deleted: false
    };
    
    try {
      const res = await fetch(`${config.URL}/rest/v1/wf_finance?on_conflict=id`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify([row])
      });
      
      if (res.ok || res.status === 201) {
        console.log(`✅ ${i+1}. "${fid}" → OK`);
      } else {
        const err = await res.text();
        console.log(`❌ ${i+1}. "${fid}" → ${res.status}:`, err.substring(0, 100));
      }
    } catch(e) {
      console.log(`❌ ${i+1}. "${fid}" → Error:`, e.message);
    }
  }
})();
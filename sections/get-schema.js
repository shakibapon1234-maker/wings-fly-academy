/**
 * Get actual Supabase table column names
 */
(async () => {
  const config = window.SUPABASE_CONFIG;
  if (!config) {
    console.error('Config not found');
    return;
  }
  
  const headers = {
    'apikey': config.KEY,
    'Authorization': 'Bearer ' + config.KEY,
    'Content-Type': 'application/json'
  };
  
  console.log('🔍 Fetching table schemas...\n');
  
  // Get student columns
  try {
    const stuRes = await fetch(config.URL + '/rest/v1/wf_students?select=*&limit=1', { headers });
    if (stuRes.ok) {
      const stuData = await stuRes.json();
      console.log('📋 wf_students columns:', Object.keys(stuData[0] || {}));
    } else {
      console.log('📋 wf_students: Error -', stuRes.status, await stuRes.text());
    }
  } catch(e) {
    console.log('📋 wf_students: Error -', e.message);
  }
  
  // Get finance columns
  try {
    const finRes = await fetch(config.URL + '/rest/v1/wf_finance?select=*&limit=1', { headers });
    if (finRes.ok) {
      const finData = await finRes.json();
      console.log('📋 wf_finance columns:', Object.keys(finData[0] || {}));
    } else {
      console.log('📋 wf_finance: Error -', finRes.status, await finRes.text());
    }
  } catch(e) {
    console.log('📋 wf_finance: Error -', e.message);
  }
  
  // Also try querying information schema
  console.log('\n--- Trying with limit 0 ---');
  try {
    const stuRes = await fetch(config.URL + '/rest/v1/wf_students?select=*&limit=0', { headers });
    console.log('Students HEADERS:', stuRes.headers.get('content-range'));
    const stuCols = stuRes.headers.get('Accept-Profile');
    console.log('Student profile:', stuCols);
  } catch(e) { console.log('Error:', e.message); }
})();
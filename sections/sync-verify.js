/**
 * ════════════════════════════════════════════════════════════════
 * SYNC VERIFICATION - Check if local and cloud match
 */

window.syncVerify = async function() {
  const config = window.SUPABASE_CONFIG;
  if (!config || !config.URL || !config.KEY) {
    console.error('❌ Config not found');
    return;
  }
  
  const headers = {
    'apikey': config.KEY,
    'Authorization': 'Bearer ' + config.KEY
  };
  
  // Get local data
  const localData = window.globalData || JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
  const localStudents = localData.students || [];
  const localFinance = localData.finance || [];
  
  console.log('🔍 SYNC VERIFICATION');
  console.log('═'.repeat(50));
  console.log(`📱 Local: ${localStudents.length} students, ${localFinance.length} finance\n`);
  
  // Get cloud data
  const stuRes = await fetch(`${config.URL}/rest/v1/wf_students?deleted=eq.false&select=id`, { headers });
  const cloudStudents = stuRes.ok ? await stuRes.json() : [];
  
  const finRes = await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.false&select=id`, { headers });
  const cloudFinance = finRes.ok ? await finRes.json() : [];
  
  console.log(`☁️ Cloud: ${cloudStudents.length} students, ${cloudFinance.length} finance\n`);
  
  // Compare counts
  const stuMatch = localStudents.length === cloudStudents.length;
  const finMatch = localFinance.length === cloudFinance.length;
  
  console.log('📊 RESULTS:');
  console.log(`   Students: Local=${localStudents.length} | Cloud=${cloudStudents.length} ${stuMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
  console.log(`   Finance:  Local=${localFinance.length} | Cloud=${cloudFinance.length} ${finMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
  console.log('═'.repeat(50));
  
  if (stuMatch && finMatch) {
    console.log('🎉 SYNC VERIFIED - Local and Cloud are in sync!');
  } else {
    console.log('⚠️ SYNC MISMATCH DETECTED');
    if (!stuMatch) console.log(`   Need to sync ${Math.abs(localStudents.length - cloudStudents.length)} students`);
    if (!finMatch) console.log(`   Need to sync ${Math.abs(localFinance.length - cloudFinance.length)} finance`);
  }
  
  return { students: { local: localStudents.length, cloud: cloudStudents.length, match: stuMatch },
           finance: { local: localFinance.length, cloud: cloudFinance.length, match: finMatch } };
};

console.log('✅ sync-verify.js loaded. Run: syncVerify()');
/**
 * ════════════════════════════════════════════════════════════════
 * LOCAL TO CLOUD FORCE PUSH V5 - Handle Individual Failures
 * Push one by one to isolate and skip failing records
 */

window.localToCloudForcePushV5 = async function() {
  const config = window.SUPABASE_CONFIG;
  if (!config || !config.URL || !config.KEY) {
    console.error('❌ Config not found');
    alert('Config not found!');
    return;
  }
  
  const ACADEMY_ID = 'wingsfly_main';
  
  const headers = {
    'apikey': config.KEY,
    'Authorization': 'Bearer ' + config.KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=representation'
  };
  
  console.log('🔄 Starting Local to Cloud Force Push V5 (Individual Retry)...');
  console.log('═'.repeat(60));
  
  // Get local data
  const localData = window.globalData || JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
  const localFinance = localData.finance || [];
  const localStudents = localData.students || [];
  
  console.log(`📤 Local: ${localFinance.length} finance, ${localStudents.length} students\n`);
  
  // ===== STEP 1: CLEAR & PUSH STUDENTS =====
  console.log('📤 Step 1: Pushing students...');
  
  try {
    await fetch(`${config.URL}/rest/v1/wf_students?academy_id=eq.${ACADEMY_ID}`, {
      method: 'DELETE',
      headers: headers
    });
  } catch(e) { console.warn('   ⚠️ Clear error:', e.message); }
  
  let stuPushed = 0;
  for (let i = 0; i < localStudents.length; i++) {
    const s = localStudents[i];
    const sid = s.studentId || s.id || s.phone || 'stu_' + i;
    const row = {
      id: `${ACADEMY_ID}_stu_${sid}`,
      academy_id: ACADEMY_ID,
      data: s,
      deleted: false
    };
    
    try {
      const res = await fetch(`${config.URL}/rest/v1/wf_students?on_conflict=id`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(row)
      });
      if (res.ok || res.status === 201) stuPushed++;
    } catch(e) { /* skip */ }
  }
  console.log(`   ✅ Students pushed: ${stuPushed}/${localStudents.length}`);
  
  // ===== STEP 2: CLEAR FINANCE =====
  console.log('\n📤 Step 2: Pushing finance...');
  
  try {
    await fetch(`${config.URL}/rest/v1/wf_finance?academy_id=eq.${ACADEMY_ID}`, {
      method: 'DELETE',
      headers: headers
    });
    console.log('   🗑️ Cleared existing finance');
  } catch(e) { console.warn('   ⚠️ Clear error:', e.message); }
  
  // Push one by one to handle errors
  let finPushed = 0;
  let finFailed = 0;
  const failedRecords = [];
  
  for (let i = 0; i < localFinance.length; i++) {
    const f = localFinance[i];
    
    // Generate unique ID
    const fid = f.id || 'fin_' + (f.timestamp || Date.now()) + '_' + (i % 1000);
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
        body: JSON.stringify(row)
      });
      
      if (res.ok || res.status === 201) {
        finPushed++;
      } else {
        finFailed++;
        const err = await res.text();
        if (failedRecords.length < 5) {
          failedRecords.push({ index: i, id: fid, error: err.substring(0, 50) });
        }
      }
    } catch(e) {
      finFailed++;
    }
    
    if ((i + 1) % 50 === 0) {
      console.log(`   📊 Progress: ${i+1}/${localFinance.length} (pushed: ${finPushed}, failed: ${finFailed})`);
    }
  }
  
  if (failedRecords.length > 0) {
    console.log(`   ⚠️ First few failures:`, failedRecords);
  }
  
  console.log(`   ✅ Finance pushed: ${finPushed}, Failed: ${finFailed}`);
  
  // ===== FINAL =====
  console.log('\n' + '═'.repeat(60));
  console.log('✅ FORCE PUSH V5 COMPLETE');
  console.log(`   Students: ${stuPushed}`);
  console.log(`   Finance: ${finPushed} pushed, ${finFailed} failed`);
  console.log('═'.repeat(60));
  
  alert(`✅ Push Complete!\n\nStudents: ${stuPushed}\nFinance: ${finPushed} pushed, ${finFailed} failed`);
};

console.log('✅ local-to-cloud-force-push-v5.js loaded. Run: localToCloudForcePushV5()');
/**
 * ════════════════════════════════════════════════════════════════
 * LOCAL TO CLOUD FORCE PUSH V4 - V39 Schema Compatible
 * Uses the correct format: { id, academy_id, data, deleted }
 */

window.localToCloudForcePushV4 = async function() {
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
  
  console.log('🔄 Starting Local to Cloud Force Push V4 (V39 Schema)...');
  console.log('═'.repeat(60));
  
  // Get local data
  const localData = window.globalData || JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
  const localFinance = localData.finance || [];
  const localStudents = localData.students || [];
  
  console.log(`📤 Local: ${localFinance.length} finance, ${localStudents.length} students\n`);
  
  // ===== STEP 1: CLEAR EXISTING & PUSH STUDENTS =====
  console.log('📤 Step 1: Pushing students...');
  
  // Clear existing students
  try {
    await fetch(`${config.URL}/rest/v1/wf_students?academy_id=eq.${ACADEMY_ID}`, {
      method: 'DELETE',
      headers: headers
    });
    console.log('   🗑️ Cleared existing students');
  } catch(e) { console.warn('   ⚠️ Clear error:', e.message); }
  
  // Build V39 format: { id, academy_id, data, deleted }
  const buildStudentRow = (s, index) => {
    const sid = s.studentId || s.id || s.phone || 'stu_' + index;
    return {
      id: `${ACADEMY_ID}_stu_${sid}`,
      academy_id: ACADEMY_ID,
      data: s,
      deleted: false
    };
  };
  
  let stuPushed = 0;
  const stuChunkSize = 50;
  
  for (let i = 0; i < localStudents.length; i += stuChunkSize) {
    const chunk = localStudents.slice(i, i + stuChunkSize).map((s, idx) => buildStudentRow(s, i + idx));
    
    try {
      const res = await fetch(`${config.URL}/rest/v1/wf_students?on_conflict=id`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(chunk)
      });
      
      if (res.ok || res.status === 201) {
        stuPushed += chunk.length;
        console.log(`   ✅ Students: ${stuPushed}/${localStudents.length}`);
      } else {
        const err = await res.text();
        console.log(`   ⚠️ Student chunk error ${res.status}:`, err.substring(0, 100));
      }
    } catch(e) {
      console.log(`   ⚠️ Student chunk error:`, e.message);
    }
  }
  console.log(`   ✅ Total students pushed: ${stuPushed}`);
  
  // ===== STEP 2: PUSH FINANCE =====
  console.log('\n📤 Step 2: Pushing finance...');
  
  // Clear existing finance
  try {
    await fetch(`${config.URL}/rest/v1/wf_finance?academy_id=eq.${ACADEMY_ID}`, {
      method: 'DELETE',
      headers: headers
    });
    console.log('   🗑️ Cleared existing finance');
  } catch(e) { console.warn('   ⚠️ Clear error:', e.message); }
  
  // Build V39 format for finance
  const buildFinanceRow = (f) => {
    const fid = f.id || 'fin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    return {
      id: `${ACADEMY_ID}_fin_${fid}`,
      academy_id: ACADEMY_ID,
      data: f,
      deleted: false
    };
  };
  
  let finPushed = 0;
  let finFailed = 0;
  const finChunkSize = 20;
  
  for (let i = 0; i < localFinance.length; i += finChunkSize) {
    const chunk = localFinance.slice(i, i + finChunkSize).map(buildFinanceRow);
    
    try {
      const res = await fetch(`${config.URL}/rest/v1/wf_finance?on_conflict=id`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(chunk)
      });
      
      if (res.ok || res.status === 201) {
        finPushed += chunk.length;
        if ((i + finChunkSize) % 100 === 0 || i + finChunkSize >= localFinance.length) {
          console.log(`   ✅ Finance: ${finPushed}/${localFinance.length}`);
        }
      } else {
        finFailed += chunk.length;
        const errText = await res.text();
        if (i < 50) console.log(`   ⚠️ Finance error ${res.status}:`, errText.substring(0, 80));
      }
    } catch(e) {
      finFailed += chunk.length;
      console.log(`   ⚠️ Finance chunk error:`, e.message);
    }
  }
  
  console.log(`   ✅ Total finance pushed: ${finPushed}, Failed: ${finFailed}`);
  
  // ===== FINAL RESULT =====
  console.log('\n' + '═'.repeat(60));
  console.log('✅ FORCE PUSH V4 COMPLETE');
  console.log(`   Students: ${stuPushed} pushed`);
  console.log(`   Finance: ${finPushed} pushed, ${finFailed} failed`);
  console.log('═'.repeat(60));
  
  alert(`✅ Push Complete!\n\nStudents: ${stuPushed}\nFinance: ${finPushed} pushed, ${finFailed} failed\n\nCheck cloud data now.`);
};

console.log('✅ local-to-cloud-force-push-v4.js loaded. Run: localToCloudForcePushV4()');
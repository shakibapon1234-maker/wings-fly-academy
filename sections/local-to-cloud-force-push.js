/**
 * ════════════════════════════════════════════════════════════════
 * LOCAL TO CLOUD FORCE PUSH - Improved Version
 * Handle errors better and push one by one if needed
 */

window.localToCloudForcePushV2 = async function() {
  const config = window.SUPABASE_CONFIG;
  if (!config || !config.URL || !config.KEY) {
    console.error('Config not found');
    alert('Config not found!');
    return;
  }
  
  const headers = {
    'apikey': config.KEY,
    'Authorization': 'Bearer ' + config.KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=representation'
  };
  
  console.log('🔄 Starting Local to Cloud Force Push V2...');
  console.log('═'.repeat(50));
  
  // Get local data
  const localData = window.globalData || JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
  const localFinance = localData.finance || [];
  const localStudents = localData.students || [];
  
  console.log(`📤 Local: ${localFinance.length} finance, ${localStudents.length} students`);
  
  // ===== STEP 1: PUSH STUDENTS FIRST =====
  console.log('\n📤 Step 1: Pushing students...');
  
  // Delete existing students
  try {
    await fetch(`${config.URL}/rest/v1/wf_students?deleted=eq.false`, {
      method: 'DELETE',
      headers: headers
    });
  } catch(e) { console.warn('Student delete:', e.message); }
  
  // Push students in chunks
  const stuChunkSize = 50;
  let stuPushed = 0;
  
  for (let i = 0; i < localStudents.length; i += stuChunkSize) {
    const chunk = localStudents.slice(i, i + stuChunkSize).map(s => ({
      ...s,
      deleted: false,
      academy_id: 'wingsfly_main'
    }));
    
    try {
      const res = await fetch(`${config.URL}/rest/v1/wf_students`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(chunk)
      });
      
      if (res.ok || res.status === 201) {
        stuPushed += chunk.length;
        console.log(`   ✅ Students: ${stuPushed}/${localStudents.length}`);
      } else {
        const err = await res.text();
        console.log(`   ⚠️ Student chunk error: ${res.status}`, err.substring(0,100));
      }
    } catch(e) {
      console.log(`   ⚠️ Student chunk error:`, e.message);
    }
  }
  console.log(`   ✅ Total students pushed: ${stuPushed}`);
  
  // ===== STEP 2: PUSH FINANCE =====
  console.log('\n📤 Step 2: Pushing finance...');
  
  // Delete existing finance
  try {
    await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.false`, {
      method: 'DELETE',
      headers: headers
    });
  } catch(e) { console.warn('Finance delete:', e.message); }
  
  // Push finance one by one or in small chunks
  let finPushed = 0;
  let finFailed = 0;
  const finChunkSize = 20; // Smaller chunks
  
  for (let i = 0; i < localFinance.length; i += finChunkSize) {
    const chunk = localFinance.slice(i, i + finChunkSize).map(f => {
      // Clean and ensure required fields
      return {
        id: f.id || 'fin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        academy_id: 'wingsfly_main',
        timestamp: f.timestamp || f.date || new Date().toISOString(),
        type: f.type || 'Income',
        amount: parseFloat(f.amount) || 0,
        method: f.method || 'Cash',
        description: f.description || f.note || '',
        studentId: f.studentId || f.student_id || null,
        studentName: f.studentName || f.student_name || null,
        deleted: false,
        deleted_at: null
      };
    });
    
    try {
      const res = await fetch(`${config.URL}/rest/v1/wf_finance`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(chunk)
      });
      
      if (res.ok || res.status === 201) {
        finPushed += chunk.length;
        console.log(`   ✅ Finance: ${finPushed}/${localFinance.length}`);
      } else {
        const errText = await res.text();
        finFailed += chunk.length;
        console.log(`   ⚠️ Finance error ${res.status}:`, errText.substring(0, 80));
      }
    } catch(e) {
      finFailed += chunk.length;
      console.log(`   ⚠️ Finance chunk error:`, e.message);
    }
  }
  
  console.log(`   ✅ Total finance pushed: ${finPushed}, Failed: ${finFailed}`);
  
  // ===== FINAL RESULT =====
  console.log('\n' + '═'.repeat(50));
  console.log('✅ FORCE PUSH COMPLETE');
  console.log(`   Students: ${stuPushed} pushed`);
  console.log(`   Finance: ${finPushed} pushed, ${finFailed} failed`);
  console.log('═'.repeat(50));
  
  alert(`✅ Push Complete!\n\nStudents: ${stuPushed}\nFinance: ${finPushed} pushed, ${finFailed} failed\n\nCheck cloud data now.`);
};
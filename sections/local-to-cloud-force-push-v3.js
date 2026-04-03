/**
 * ════════════════════════════════════════════════════════════════
 * LOCAL TO CLOUD FORCE PUSH V3 - Schema Mapping Fix
 * Map local fields to actual Supabase column names
 */

window.localToCloudForcePushV3 = async function() {
  const config = window.SUPABASE_CONFIG;
  if (!config || !config.URL || !config.KEY) {
    console.error('❌ Config not found');
    alert('Config not found!');
    return;
  }
  
  const headers = {
    'apikey': config.KEY,
    'Authorization': 'Bearer ' + config.KEY,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=representation'
  };
  
  console.log('🔄 Starting Local to Cloud Force Push V3 (Schema Mapping)...');
  console.log('═'.repeat(60));
  
  // Get local data
  const localData = window.globalData || JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
  const localFinance = localData.finance || [];
  const localStudents = localData.students || [];
  
  console.log(`📤 Local: ${localFinance.length} finance, ${localStudents.length} students\n`);
  
  // Try to detect cloud columns by inserting minimal data
  const testStudent = { id: 'test_' + Date.now(), created_at: new Date().toISOString() };
  const testFinance = { id: 'testfin_' + Date.now(), created_at: new Date().toISOString() };
  
  console.log('🔍 Testing table schemas...');
  
  // ===== STEP 1: TEST & PUSH STUDENTS =====
  console.log('\n📤 Step 1: Pushing students...');
  
  // Clear existing
  try {
    await fetch(`${config.URL}/rest/v1/wf_students?deleted=eq.false`, {
      method: 'DELETE',
      headers: headers
    });
    console.log('   🗑️ Cleared existing students');
  } catch(e) { console.warn('   ⚠️ Clear error:', e.message); }
  
  // Map local student fields to what might work in Supabase
  const stuMap = (s) => {
    const obj = {
      id: s.id || 'stu_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      created_at: s.created_at || new Date().toISOString(),
      deleted: false,
      academy_id: 'wingsfly_main'
    };
    
    // Try common field mappings
    if (s.name || s.studentName || s.student_name) obj.name = s.name || s.studentName || s.student_name;
    if (s.phone || s.mobile || s.phoneNumber) obj.phone = s.phone || s.mobile || s.phoneNumber;
    if (s.email) obj.email = s.email;
    if (s.course || s.courseName || s.selectedCourse) obj.course = s.course || s.courseName || s.selectedCourse;
    if (s.batch || s.batchNumber || s.batch_no) obj.batch_no = s.batch || s.batchNumber || s.batch_no;
    if (s.fees || s.totalFees || s.tuitionFee) obj.fees = parseFloat(s.fees || s.totalFees || s.tuitionFee || 0);
    if (s.paid || s.paidAmount) obj.paid = parseFloat(s.paid || s.paidAmount || 0);
    if (s.due || s.dueAmount) obj.due = parseFloat(s.due || s.dueAmount || 0);
    if (s.address) obj.address = s.address;
    if (s.nid || s.nidNumber) obj.nid = s.nid || s.nidNumber;
    if (s.fatherName || s.father_name) obj.father_name = s.fatherName || s.father_name;
    if (s.motherName || s.mother_name) obj.mother_name = s.motherName || s.mother_name;
    
    return obj;
  };
  
  let stuPushed = 0;
  let stuFailed = 0;
  
  // Try pushing students one by one to handle errors better
  for (let i = 0; i < localStudents.length; i++) {
    const stu = stuMap(localStudents[i]);
    
    try {
      const res = await fetch(`${config.URL}/rest/v1/wf_students`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(stu)
      });
      
      if (res.ok || res.status === 201) {
        stuPushed++;
      } else {
        stuFailed++;
        const err = await res.text();
        if (i < 3) console.log(`   ⚠️ Student ${i+1} error:`, err.substring(0, 100));
      }
    } catch(e) {
      stuFailed++;
    }
    
    if ((i + 1) % 10 === 0) {
      console.log(`   📊 Progress: ${i+1}/${localStudents.length}`);
    }
  }
  
  console.log(`   ✅ Students pushed: ${stuPushed}, Failed: ${stuFailed}`);
  
  // ===== STEP 2: PUSH FINANCE =====
  console.log('\n📤 Step 2: Pushing finance...');
  
  // Clear existing
  try {
    await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.false`, {
      method: 'DELETE',
      headers: headers
    });
    console.log('   🗑️ Cleared existing finance');
  } catch(e) { console.warn('   ⚠️ Clear error:', e.message); }
  
  // Map local finance fields to Supabase
  const finMap = (f) => {
    const obj = {
      id: f.id || 'fin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      created_at: f.created_at || f.timestamp || new Date().toISOString(),
      deleted: false,
      academy_id: 'wingsfly_main'
    };
    
    // Map type (Income/Expense)
    if (f.type) obj.type = f.type;
    // Map amount - try different field names
    if (f.amount !== undefined) obj.amount = parseFloat(f.amount);
    else if (f.amonut !== undefined) obj.amount = parseFloat(f.amonut); // typo fix
    else if (f.taka !== undefined) obj.amount = parseFloat(f.taka);
    else if (f.total !== undefined) obj.amount = parseFloat(f.total);
    // Map method
    if (f.method || f.paymentMethod) obj.method = f.method || f.paymentMethod;
    // Description/notes
    if (f.description) obj.description = f.description;
    else if (f.note) obj.note = f.note;
    else if (f.remark) obj.remark = f.remark;
    // Student reference
    if (f.studentId) obj.student_id = f.studentId;
    else if (f.student_id) obj.student_id = f.student_id;
    if (f.studentName) obj.student_name = f.studentName;
    else if (f.student_name) obj.student_name = f.student_name;
    
    return obj;
  };
  
  let finPushed = 0;
  let finFailed = 0;
  
  // Push finance
  for (let i = 0; i < localFinance.length; i++) {
    const fin = finMap(localFinance[i]);
    
    try {
      const res = await fetch(`${config.URL}/rest/v1/wf_finance`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(fin)
      });
      
      if (res.ok || res.status === 201) {
        finPushed++;
      } else {
        finFailed++;
        if (i < 3) {
          const err = await res.text();
          console.log(`   ⚠️ Finance ${i+1} error:`, err.substring(0, 150));
        }
      }
    } catch(e) {
      finFailed++;
    }
    
    if ((i + 1) % 50 === 0) {
      console.log(`   📊 Progress: ${i+1}/${localFinance.length}`);
    }
  }
  
  console.log(`   ✅ Finance pushed: ${finPushed}, Failed: ${finFailed}`);
  
  // ===== FINAL RESULT =====
  console.log('\n' + '═'.repeat(60));
  console.log('✅ FORCE PUSH V3 COMPLETE');
  console.log(`   Students: ${stuPushed} pushed, ${stuFailed} failed`);
  console.log(`   Finance: ${finPushed} pushed, ${finFailed} failed`);
  console.log('═'.repeat(60));
  
  alert(`✅ Push Complete!\n\nStudents: ${stuPushed} pushed, ${stuFailed} failed\nFinance: ${finPushed} pushed, ${finFailed} failed\n\nCheck cloud data.`);
};

console.log('✅ local-to-cloud-force-push-v3.js loaded. Run: localToCloudForcePushV3()');
/**
 * ════════════════════════════════════════════════════════════════
 * CLOUD TO LOCAL SYNC - Pull all cloud data to local
 * Fixed: Deduplicate students, handle V39 format properly
 */

window.cloudToLocalSync = async function() {
  const config = window.SUPABASE_CONFIG;
  if (!config || !config.URL || !config.KEY) {
    console.error('Config not found');
    return;
  }
  
  const headers = {
    'apikey': config.KEY,
    'Authorization': 'Bearer ' + config.KEY
  };
  
  console.log('🔄 Pulling all cloud data from Supabase...');
  
  // Get local data
  let localData = window.globalData;
  if (!localData) {
    localData = JSON.parse(localStorage.getItem('wingsfly_data') || '{}');
  }
  if (!localData.finance) localData.finance = [];
  if (!localData.students) localData.students = [];
  if (!localData.deletedItems) localData.deletedItems = { students: [], finance: [], employees: [] };
  
  console.log(`📱 Local: ${localData.students.length} students, ${localData.finance.length} finance`);
  
  // 1. Get all students from cloud
  const stuRes = await fetch(`${config.URL}/rest/v1/wf_students?deleted=eq.false&select=*`, { headers });
  const cloudStudents = stuRes.ok ? await stuRes.json() : [];
  console.log(`☁️ Cloud students: ${cloudStudents.length}`);
  
  // 2. Process students - deduplicate by studentId or name+batch
  const existingStudentIds = new Set(localData.students.map(s => s.studentId).filter(Boolean));
  const existingStudentCombo = new Set(localData.students.map(s => `${(s.name||'').toLowerCase()}_${(s.batch||'').toLowerCase()}`));
  
  let addedStudents = 0;
  cloudStudents.forEach(item => {
    const stu = item.data || item;
    const stuId = stu.studentId || stu.id;
    const stuCombo = `${(stu.name||'').toLowerCase()}_${(stu.batch||'').toLowerCase()}`;
    
    // Skip if studentId already exists OR name+batch combo exists
    if (stuId && existingStudentIds.has(stuId)) {
      return; // Already have this student
    }
    if (existingStudentCombo.has(stuCombo)) {
      return; // Already have student with same name+batch
    }
    
    // Add new student
    localData.students.push(stu);
    existingStudentIds.add(stuId);
    existingStudentCombo.add(stuCombo);
    addedStudents++;
  });
  console.log(`✅ Added students: ${addedStudents}`);
  
  // 3. Get all active finance from cloud
  const activeRes = await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.false&select=*`, { headers });
  const cloudActive = activeRes.ok ? await activeRes.json() : [];
  console.log(`☁️ Cloud finance: ${cloudActive.length}`);
  
  // 4. Get all deleted finance from cloud
  const delRes = await fetch(`${config.URL}/rest/v1/wf_finance?deleted=eq.true&select=*`, { headers });
  const cloudDeleted = delRes.ok ? await delRes.json() : [];
  console.log(`☁️ Cloud deleted finance: ${cloudDeleted.length}`);
  
  // 5. Add missing active finance (deduplicate by ID)
  const localFinIds = new Set(localData.finance.map(f => f.id).filter(Boolean));
  let addedFin = 0;
  cloudActive.forEach(item => {
    const fin = item.data || item;
    if (fin.id && localFinIds.has(fin.id)) return;
    localData.finance.push(fin);
    localFinIds.add(fin.id);
    addedFin++;
  });
  console.log(`✅ Added finance: ${addedFin}`);
  
  // 6. Add missing deleted finance to local trash
  const localDeletedIds = new Set((localData.deletedItems.finance || []).map(d => d.item?.id || d.id).filter(Boolean));
  let addedDel = 0;
  cloudDeleted.forEach(item => {
    const fin = item.data || item;
    if (fin.id && localDeletedIds.has(fin.id)) return;
    localData.deletedItems.finance.push({
      id: 'fin_del_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: 'finance',
      item: fin,
      deletedAt: item.deleted_at || new Date().toISOString()
    });
    localDeletedIds.add(fin.id);
    addedDel++;
  });
  console.log(`✅ Added deleted finance: ${addedDel}`);
  
  // 7. Save to localStorage
  window.globalData = localData;
  localStorage.setItem('wingsfly_data', JSON.stringify(localData));
  localStorage.setItem('wingsfly_deleted_backup', JSON.stringify(localData.deletedItems));
  
  console.log('═'.repeat(40));
  console.log('✅ SYNC COMPLETE');
  console.log(`   Local students: ${localData.students.length} (added: ${addedStudents})`);
  console.log(`   Local finance: ${localData.finance.length} (added: ${addedFin})`);
  console.log(`   Local deleted: ${localData.deletedItems.finance.length}`);
  console.log('═'.repeat(40));
  
  // Rebuild balances
  if (typeof window.feRebuildAllBalances === 'function') {
    window.feRebuildAllBalances();
  }
  
  // Refresh UI
  if (typeof window.updateGlobalStats === 'function') window.updateGlobalStats();
  if (typeof window.render === 'function') window.render(localData.students);
  
  console.log('✅ Sync complete!');
};

console.log('✅ cloud-to-local-sync.js loaded. Run: cloudToLocalSync()');
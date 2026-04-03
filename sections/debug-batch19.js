/**
 * Debug: Check why batch 19 collection shows zero
 */
window.debugBatch19 = function() {
  const students = window.globalData?.students || [];
  const finance = window.globalData?.finance || [];
  
  console.log('=== DEBUG BATCH 19 COLLECTION ===');
  
  // Get batch 19 students
  const batch19Students = students.filter(s => String(s.batch) === '19');
  console.log('\n📚 Batch 19 students:', batch19Students.length);
  batch19Students.forEach((s, i) => {
    console.log(`  ${i+1}. ${s.name} | ID: ${s.studentId} | batch: ${s.batch}`);
  });
  
  // Get student IDs for batch 19
  const batch19Ids = new Set(batch19Students.map(s => s.studentId).filter(Boolean));
  console.log('\n📛 Batch 19 student IDs:', Array.from(batch19Ids));
  
  // Find finance for batch 19
  console.log('\n💰 Finance for batch 19:');
  const batch19Finance = finance.filter(f => {
    if (f._deleted) return false;
    if (f.type !== 'Income') return false;
    
    const amt = parseFloat(f.amount) || 0;
    const desc = (f.description || '').toLowerCase();
    const person = (f.person || '').toLowerCase();
    const stuId = f.studentId;
    
    // Match by studentId
    const byId = stuId && batch19Ids.has(stuId);
    // Match by batch in description
    const byBatch = desc.includes('batch: 19') || desc.includes('batch:19') || desc.includes('| batch:19');
    // Match by person name in batch 19
    const byPerson = batch19Students.some(s => person.includes((s.name || '').toLowerCase()));
    // Match by ID prefix
    const byPrefix = stuId && stuId.startsWith('WF-19-');
    
    return byId || byBatch || byPerson || byPrefix;
  });
  
  console.log('Found:', batch19Finance.length);
  let total = 0;
  batch19Finance.forEach(f => {
    console.log(`  - ${f.type}: ৳${f.amount} | ${f.date} | person: ${f.person} | studentId: ${f.studentId}`);
    console.log(`    desc: ${f.description}`);
    total += parseFloat(f.amount) || 0;
  });
  console.log('\n💵 Total batch 19 collection:', total);
  
  // Show all income type transactions
  console.log('\n📊 All Income transactions:', finance.filter(f => f.type === 'Income').length);
  
  return { students: batch19Students.length, finance: batch19Finance.length, total };
};

console.log('✅ debug-batch19.js loaded. Run: debugBatch19()');
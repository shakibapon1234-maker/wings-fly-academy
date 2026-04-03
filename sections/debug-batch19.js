/**
 * Debug: Check batch 19 students in detail
 * Run in browser console: debugBatch19()
 */
window.debugBatch19 = function() {
  const students = window.globalData?.students || [];
  const finance = window.globalData?.finance || [];
  
  console.clear();
  console.log('═'.repeat(50));
  console.log('🔍 BATCH 19 DETAILED DEBUG');
  console.log('═'.repeat(50));
  
  // All students
  console.log('\n📚 TOTAL STUDENTS:', students.length);
  
  // Batch 19 students
  const batch19 = students.filter(s => String(s.batch) === '19');
  console.log('\n📚 Batch 19 students:', batch19.length);
  batch19.forEach((s, i) => {
    console.log(`  ${i+1}. ID: ${s.studentId}, Name: ${s.name}, Phone: ${s.phone}, Batch: ${s.batch}`);
  });
  
  // Finance for batch 19
  console.log('\n💰 TOTAL FINANCE RECORDS:', finance.length);
  
  const batch19Ids = new Set(batch19.map(s => s.studentId).filter(Boolean));
  const batch19Names = new Set(batch19.map(s => (s.name || '').toLowerCase().trim()).filter(Boolean));
  
  const batch19Fin = finance.filter(f => {
    if (f._deleted) return false;
    const stuId = f.studentId || '';
    const desc = (f.description || '').toLowerCase();
    const person = (f.person || '').toLowerCase().trim();
    
    return batch19Ids.has(stuId) || 
           desc.includes('batch: 19') || desc.includes('batch:19') ||
           batch19Names.has(person) ||
           [...batch19Names].some(n => n.length > 3 && desc.includes(n));
  });
  
  console.log('\n💰 Batch 19 finance:', batch19Fin.length);
  batch19Fin.forEach((f, i) => {
    console.log(`  ${i+1}. ID: ${f.id}, Amount: ${f.amount}, Person: ${f.person}, Desc: ${f.description?.substring(0, 50)}`);
  });
  
  const total = batch19Fin.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
  console.log('\n💵 TOTAL COLLECTION:', total);
  
  console.log('\n═'.repeat(50));
  console.log('✅ Run complete!');
  console.log('═'.repeat(50));
  
  return { students: batch19.length, finance: batch19Fin.length, total };
};
console.log('✅ debug-batch19.js loaded. Run: debugBatch19()');

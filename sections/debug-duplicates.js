/**
 * Debug: Find duplicate students and check finance relationships
 */
window.debugDuplicates = function() {
  const students = window.globalData?.students || [];
  const finance = window.globalData?.finance || [];
  
  console.log('=== DEBUG DUPLICATES ===');
  console.log('Total students:', students.length);
  console.log('Total finance:', finance.length);
  
  // Find duplicates by name
  const nameCounts = {};
  students.forEach((s, i) => {
    const name = (s.name || '').trim();
    if (!nameCounts[name]) nameCounts[name] = [];
    nameCounts[name].push({ index: i, id: s.studentId, batch: s.batch });
  });
  
  const duplicates = Object.entries(nameCounts).filter(([name, arr]) => arr.length > 1);
  console.log('\nDuplicate names:', duplicates.length);
  duplicates.forEach(([name, arr]) => {
    console.log(`  "${name}":`, arr);
  });
  
  // Check finance for each duplicate
  duplicates.forEach(([name, arr]) => {
    console.log(`\n--- Finance for "${name}" ---`);
    arr.forEach(stu => {
      const stuFin = finance.filter(f => 
        (f.person || '').toLowerCase().includes(name.toLowerCase()) ||
        (f.studentName || '').toLowerCase().includes(name.toLowerCase()) ||
        (f.description || '').toLowerCase().includes(name.toLowerCase())
      );
      console.log(`  Student index ${stu.index} (ID: ${stu.id}): ${stuFin.length} finance entries`);
      stuFin.forEach(f => console.log(`    - ${f.type}: ৳${f.amount} | ${f.date} | ID: ${f.id}`));
    });
  });
  
  return duplicates;
};

console.log('✅ debug-duplicates.js loaded. Run: debugDuplicates()');
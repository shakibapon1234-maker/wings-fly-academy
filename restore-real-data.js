/**
 * ============================================================
 * WINGS FLY — REAL DATA RESTORE SCRIPT
 * ============================================================
 * এই স্ক্রিপ্টটি ব্রাউজার কনসোলে paste করুন।
 * এটি:
 *   1. ব্যাকআপ JSON ফাইল থেকে রিয়াল ডাটা লোড করবে
 *   2. লোকাল (localStorage) এ সেভ করবে
 *   3. Supabase ক্লাউডে ফোর্স পুশ করবে (academy_data + wf_students + wf_finance + wf_employees)
 *
 * ব্যবহার:
 *   1. ব্রাউজারে https://shakibapon1234-maker.github.io/wings-fly-academy/ খুলুন
 *   2. F12 → Console tab খুলুন
 *   3. এই পুরো স্ক্রিপ্ট কপি-পেস্ট করে Enter চাপুন
 *   4. ফাইল সিলেক্ট ডায়ালগ আসবে → WingsFly_Backup_2026-03-10.json সিলেক্ট করুন
 *   5. অপেক্ষা করুন — সব হয়ে গেলে পেজ রিলোড হবে
 * ============================================================
 */

(async function restoreRealData() {
  console.log('🔵 ═══════════════════════════════════════════════════');
  console.log('🔵 WINGS FLY — REAL DATA RESTORE');
  console.log('🔵 ═══════════════════════════════════════════════════');

  // Step 1: ফাইল সিলেক্ট করুন
  const file = await new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => resolve(e.target.files[0]);
    input.click();
  });

  if (!file) {
    console.error('❌ কোনো ফাইল সিলেক্ট হয়নি!');
    return;
  }

  console.log(`📂 ফাইল সিলেক্ট হয়েছে: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

  // Step 2: JSON পার্স করুন
  const text = await file.text();
  let importedData;
  try {
    importedData = JSON.parse(text);
    if (importedData.wingsfly_data) importedData = importedData.wingsfly_data;
    if (importedData.globalData) importedData = importedData.globalData;
  } catch (e) {
    console.error('❌ JSON পার্স এরর:', e.message);
    return;
  }

  // Step 3: ডাটা validate
  if (!importedData.students || !Array.isArray(importedData.students)) {
    console.error('❌ Invalid backup — students array পাওয়া যায়নি');
    return;
  }

  console.log('✅ ডাটা পার্স সফল:');
  console.log(`   👨‍🎓 Students: ${importedData.students.length}`);
  console.log(`   💰 Finance: ${(importedData.finance || []).length}`);
  console.log(`   👔 Employees: ${(importedData.employees || []).length}`);
  console.log(`   🏦 Bank Accounts: ${(importedData.bankAccounts || []).length}`);
  console.log(`   📱 Mobile Banking: ${(importedData.mobileBanking || []).length}`);
  console.log(`   💵 Cash Balance: ৳${importedData.cashBalance || 0}`);

  // Step 4: globalData সেট করুন
  window.globalData = importedData;
  if (typeof globalData !== 'undefined') globalData = window.globalData;

  // Ensure required arrays exist
  if (!window.globalData.deletedItems) window.globalData.deletedItems = [];
  if (!window.globalData.activityHistory) window.globalData.activityHistory = [];
  if (!window.globalData.keepRecords) window.globalData.keepRecords = [];
  if (!window.globalData.loans) window.globalData.loans = [];
  if (!window.globalData.idCards) window.globalData.idCards = [];
  if (!window.globalData.notices) window.globalData.notices = [];
  if (!window.globalData.examRegistrations) window.globalData.examRegistrations = [];
  if (!window.globalData.visitors) window.globalData.visitors = [];
  if (!window.globalData.employeeRoles) window.globalData.employeeRoles = [];

  // Step 5: localStorage এ সেভ
  try {
    localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
    localStorage.setItem('lastLocalUpdate', new Date().toISOString());
    console.log('✅ লোকাল সেভ সফল!');
  } catch (e) {
    console.error('❌ localStorage সেভ ব্যর্থ:', e.message);
    return;
  }

  // Step 6: ক্লাউডে ফোর্স পুশ
  console.log('☁️ ক্লাউডে পুশ শুরু হচ্ছে...');

  // Mark all dirty
  if (window.markDirty) window.markDirty();

  let cloudSuccess = false;
  try {
    if (window.wingsSync && typeof window.wingsSync.pushNow === 'function') {
      // V34 sync — directly push
      cloudSuccess = await window.wingsSync.pushNow('restore-real-data-backup');
      console.log(cloudSuccess ? '✅ V34 Sync পুশ সফল!' : '⚠️ V34 Sync পুশ ব্যর্থ');
    } else if (typeof window.saveToCloud === 'function') {
      await window.saveToCloud();
      cloudSuccess = true;
      console.log('✅ Legacy sync পুশ সফল!');
    } else {
      console.warn('⚠️ কোনো cloud sync function পাওয়া যায়নি — শুধু লোকালে সেভ হয়েছে');
    }
  } catch (e) {
    console.error('❌ Cloud push এরর:', e);
  }

  // Step 7: ফলাফল দেখান
  console.log('');
  console.log('🔵 ═══════════════════════════════════════════════════');
  console.log('🔵 RESTORE RESULT');
  console.log('🔵 ═══════════════════════════════════════════════════');
  console.log(`   📍 Local:  ✅ সফল — ${window.globalData.students.length} students`);
  console.log(`   ☁️  Cloud:  ${cloudSuccess ? '✅ সফল' : '❌ ব্যর্থ — SYNC WITH CLOUD NOW বাটন চাপুন'}`);
  console.log(`   💵 Cash:    ৳${window.globalData.cashBalance}`);
  console.log('');

  if (cloudSuccess) {
    alert(`✅ SUCCESS!\n\n${window.globalData.students.length} students restored successfully!\n\n📍 Local: ✅\n☁️ Cloud: ✅\n\nPage will reload now.`);
  } else {
    alert(`⚠️ PARTIAL SUCCESS!\n\n${window.globalData.students.length} students restored locally.\n\n📍 Local: ✅\n☁️ Cloud: ❌ — "SYNC WITH CLOUD NOW" button click করুন\n\nPage will reload now.`);
  }

  // Step 8: Reload
  window.location.reload();
})();

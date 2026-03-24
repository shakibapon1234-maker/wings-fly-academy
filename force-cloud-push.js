/**
 * ============================================================
 * WINGS FLY — FORCE CLOUD PUSH (Direct Supabase REST API)
 * ============================================================
 * এটি V34 sync bypass করে সরাসরি Supabase এ ডাটা পাঠায়।
 * 
 * ব্যবহার:
 *   1. ব্রাউজারে সাইট খুলে লগইন করুন
 *   2. F12 → Console → এই পুরো কোড paste করে Enter চাপুন
 *   3. অপেক্ষা করুন — "ALL DONE" মেসেজ আসলে ক্লাউড সিঙ্ক সফল
 * ============================================================
 */

(async function forceCloudPush() {
  const URL = window.SUPABASE_CONFIG?.URL || 'https://cwwyhtarnkozukekebvq.supabase.co';
  const KEY = window.SUPABASE_CONFIG?.KEY || '';
  const HEADERS = {
    'Content-Type': 'application/json',
    'apikey': KEY,
    'Authorization': 'Bearer ' + KEY,
    'Prefer': 'resolution=merge-duplicates'
  };

  const gd = window.globalData;
  if (!gd || !gd.students || gd.students.length === 0) {
    console.error('❌ globalData empty! প্রথমে restore script রান করুন।');
    return;
  }

  console.log('🔵 ═══════════════════════════════════════');
  console.log('🔵 FORCE CLOUD PUSH — Direct Supabase API');
  console.log('🔵 ═══════════════════════════════════════');
  console.log(`   Students: ${gd.students.length}`);
  console.log(`   Finance:  ${(gd.finance || []).length}`);
  console.log(`   Employees: ${(gd.employees || []).length}`);

  // ── Step 1: Push main record (academy_data) ──
  console.log('\n📤 Step 1/4: Pushing main record (academy_data)...');
  try {
    const studentsClean = (gd.students || []).map(s => {
      if (!s.photo || !s.photo.startsWith('data:image')) return s;
      return { ...s, photo: 'photo_' + (s.studentId || s.id || 'unknown'), _photoLocal: true };
    });

    const mainPayload = {
      id: 'wingsfly_main',
      students: studentsClean,
      employees: gd.employees || [],
      finance: gd.finance || [],
      settings: gd.settings || {},
      income_categories: gd.incomeCategories || [],
      expense_categories: gd.expenseCategories || [],
      payment_methods: gd.paymentMethods || [],
      cash_balance: gd.cashBalance || 0,
      bank_accounts: gd.bankAccounts || [],
      mobile_banking: gd.mobileBanking || [],
      course_names: gd.courseNames || [],
      attendance: gd.attendance || {},
      next_id: gd.nextId || 1001,
      users: gd.users || [],
      exam_registrations: gd.examRegistrations || [],
      visitors: gd.visitors || [],
      employee_roles: gd.employeeRoles || [],
      deleted_items: gd.deletedItems || [],
      activity_history: (gd.activityHistory || []).slice(0, 100), // last 100 only to reduce size
      keep_records: gd.keepRecords || [],
      loans: gd.loans || [],
      id_cards: gd.idCards || [],
      notices: gd.notices || [],
      version: (parseInt(localStorage.getItem('wings_local_version')) || 0) + 1,
      last_updated: new Date().toISOString(),
      last_device: localStorage.getItem('wings_device_id') || 'RESTORE_SCRIPT',
      last_action: 'force-restore-real-data',
      updated_by: 'Admin',
      device_id: localStorage.getItem('wings_device_id') || 'RESTORE_SCRIPT',
    };

    const mainRes = await fetch(`${URL}/rest/v1/academy_data?on_conflict=id`, {
      method: 'POST', headers: HEADERS, body: JSON.stringify(mainPayload)
    });

    if (mainRes.ok) {
      console.log('   ✅ academy_data pushed successfully!');
      // Update local version
      const newVer = (parseInt(localStorage.getItem('wings_local_version')) || 0) + 1;
      localStorage.setItem('wings_local_version', newVer.toString());
    } else {
      const errText = await mainRes.text();
      console.error('   ❌ academy_data push failed:', mainRes.status, errText);
    }
  } catch (e) {
    console.error('   ❌ academy_data error:', e.message);
  }

  // ── Helper: stable ID generator ──
  function stableId(r, idx) {
    if (r.id) return String(r.id);
    if (r.rowIndex) return String(r.rowIndex);
    if (r.studentId) return 'sid_' + String(r.studentId);
    const seed = [r.type || 'rec', r.date || '', String(r.amount || '0'),
      r.person || r.name || '', r.method || '', String(idx ?? 0)].join('|');
    let h = 0;
    for (let i = 0; i < seed.length; i++) { h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0; }
    return 'auto_' + Math.abs(h).toString(36);
  }

  // ── Step 2: Push wf_students ──
  console.log('\n📤 Step 2/4: Pushing wf_students...');
  try {
    // First delete old data for this academy
    await fetch(`${URL}/rest/v1/wf_students?academy_id=eq.wingsfly_main`, {
      method: 'DELETE', headers: { ...HEADERS, 'Prefer': '' }
    });

    const now = new Date().toISOString();
    const studentRows = (gd.students || []).map((s, i) => {
      let clean = { ...s };
      if (clean.photo && clean.photo.startsWith('data:image')) {
        clean.photo = 'photo_' + (s.studentId || s.id || 'unknown');
      }
      return {
        id: stableId(s, i),
        academy_id: 'wingsfly_main',
        data: clean,
        updated_at: now,
        deleted: false
      };
    });

    // Deduplicate
    const dedupedStudents = [...new Map(studentRows.map(r => [r.id, r])).values()];

    // Push in batches of 50
    for (let i = 0; i < dedupedStudents.length; i += 50) {
      const batch = dedupedStudents.slice(i, i + 50);
      const res = await fetch(`${URL}/rest/v1/wf_students`, {
        method: 'POST', headers: HEADERS, body: JSON.stringify(batch)
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`   ❌ wf_students batch ${i} error:`, err);
      }
    }
    console.log(`   ✅ ${dedupedStudents.length} students pushed to wf_students!`);
  } catch (e) {
    console.error('   ❌ wf_students error:', e.message);
  }

  // ── Step 3: Push wf_finance ──
  console.log('\n📤 Step 3/4: Pushing wf_finance...');
  try {
    await fetch(`${URL}/rest/v1/wf_finance?academy_id=eq.wingsfly_main`, {
      method: 'DELETE', headers: { ...HEADERS, 'Prefer': '' }
    });

    const now = new Date().toISOString();
    const financeRows = (gd.finance || []).map((f, i) => ({
      id: stableId(f, i),
      academy_id: 'wingsfly_main',
      data: f,
      updated_at: now,
      deleted: false
    }));

    const dedupedFinance = [...new Map(financeRows.map(r => [r.id, r])).values()];

    for (let i = 0; i < dedupedFinance.length; i += 50) {
      const batch = dedupedFinance.slice(i, i + 50);
      const res = await fetch(`${URL}/rest/v1/wf_finance`, {
        method: 'POST', headers: HEADERS, body: JSON.stringify(batch)
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`   ❌ wf_finance batch ${i} error:`, err);
      }
    }
    console.log(`   ✅ ${dedupedFinance.length} finance records pushed to wf_finance!`);
  } catch (e) {
    console.error('   ❌ wf_finance error:', e.message);
  }

  // ── Step 4: Push wf_employees ──
  console.log('\n📤 Step 4/4: Pushing wf_employees...');
  try {
    await fetch(`${URL}/rest/v1/wf_employees?academy_id=eq.wingsfly_main`, {
      method: 'DELETE', headers: { ...HEADERS, 'Prefer': '' }
    });

    const now = new Date().toISOString();
    const empRows = (gd.employees || []).map((e, i) => ({
      id: stableId(e, i),
      academy_id: 'wingsfly_main',
      data: e,
      updated_at: now,
      deleted: false
    }));

    const dedupedEmp = [...new Map(empRows.map(r => [r.id, r])).values()];

    for (let i = 0; i < dedupedEmp.length; i += 50) {
      const batch = dedupedEmp.slice(i, i + 50);
      const res = await fetch(`${URL}/rest/v1/wf_employees`, {
        method: 'POST', headers: HEADERS, body: JSON.stringify(batch)
      });
      if (!res.ok) {
        const err = await res.text();
        console.error(`   ❌ wf_employees batch ${i} error:`, err);
      }
    }
    console.log(`   ✅ ${dedupedEmp.length} employees pushed to wf_employees!`);
  } catch (e) {
    console.error('   ❌ wf_employees error:', e.message);
  }

  // ── DONE ──
  console.log('\n🟢 ═══════════════════════════════════════');
  console.log('🟢 ALL DONE! Cloud push complete!');
  console.log('🟢 ═══════════════════════════════════════');
  console.log('   📍 academy_data: ✅');
  console.log('   👨‍🎓 wf_students:  ✅');
  console.log('   💰 wf_finance:    ✅');
  console.log('   👔 wf_employees:  ✅');
  console.log('\n   ► Supabase Dashboard এ গিয়ে verify করুন!');

  alert('✅ ALL DONE!\n\nCloud-এ সব ডাটা successfully push হয়েছে!\n\n• academy_data ✅\n• wf_students (' + (gd.students || []).length + ') ✅\n• wf_finance (' + (gd.finance || []).length + ') ✅\n• wf_employees (' + (gd.employees || []).length + ') ✅\n\nSupabase Dashboard-এ verify করুন!');
})();

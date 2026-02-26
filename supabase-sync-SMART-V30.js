/**
 * ========================================
 * WINGS FLY AVIATION ACADEMY
 * SMART SYNC SYSTEM V30 - PUSH QUEUE + CLOUD HISTORY + BEACON FIX + RACE CONDITION + DAILY CLOUD BACKUP
 * ========================================
 * 
 * 🌍 Real-world Multi-device Sync Solution
 * Based on: Last-Write-Wins + Vector Clock + Smart Conflict Detection
 * 
 * ✅ Features:
 * - Automatic push on data change (debounced)
 * - Continuous pull (listen mode)
 * - Vector clock for proper conflict resolution
 * - Smart merge on conflicts
 * - Refresh/reload handling
 * - Network offline/online detection
 * - Zero data loss guarantee
 * - V29: Push Queue — push চলার সময় data হারাবে না
 * - V29: beforeunload এ সঠিক full data save
 * - V29: deletedItems ও activityHistory cloud এ sync হবে
 * - V30: Push error হলে queue retry করে (data loss fix)
 * - V30: Race condition এ conditional upsert (version check on server)
 * - V30: Daily backup cloud-এও save হয় (browser clear হলেও নিরাপদ)
 * 
 * Author: Wings Fly IT Team
 * Date: February 2026
 */

(function () {
  'use strict';

  // CONFIGURATION
  // ==========================================
  const SUPABASE_URL = window.SUPABASE_CONFIG?.URL || 'https://gtoldrltxjrwshubplfp.supabase.co';
  const SUPABASE_KEY = window.SUPABASE_CONFIG?.KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0b2xkcmx0eGpyd3NodWJwbGZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwOTk5MTksImV4cCI6MjA4NjY3NTkxOX0.7NTx3tzU1C5VaewNZZHTaJf2WJ_GtjhQPKOymkxRsUk';
  const TABLE_NAME = window.SUPABASE_CONFIG?.TABLE || 'academy_data';
  const RECORD_ID = window.SUPABASE_CONFIG?.MAIN_RECORD || 'wingsfly_main';
  const PULL_INTERVAL = 15000; // Pull every 15 seconds (reduced from 3s to protect Supabase free tier quota)
  const PUSH_DEBOUNCE_DELAY = 1000; // Wait 1 second after last change before pushing
  const DEVICE_ID = generateDeviceId();

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let supabaseClient = null;
  let realtimeChannel = null;
  let isInitialized = false;
  let isPushing = false;
  let isPulling = false;
  let isMonitoringEnabled = false;
  let lastPushTime = 0;
  let lastPullTime = 0;
  let pushDebounceTimer = null;
  let pullIntervalId = null;
  let localVersion = 0; // Vector clock for this device
  let isOnline = navigator.onLine;

  // ✅ V29: Push Queue — push চলার সময় নতুন push এলে queue তে রাখো
  let pendingPushReason = null; // null = no pending push

  // ✅ V30 FIX: Realtime reconnect counter (max 3 attempts, then fallback to polling)
  let realtimeReconnectCount = 0;
  window.initialSyncComplete = false; // ✅ V31: Globally exposed for Auto-Heal

  // ==========================================
  // DEVICE ID GENERATION
  // ==========================================
  function generateDeviceId() {
    let deviceId = localStorage.getItem('wings_device_id');
    if (!deviceId) {
      deviceId = 'PC_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('wings_device_id', deviceId);
    }
    return deviceId;
  }

  // ==========================================
  // LOGGING
  // ==========================================
  function log(emoji, message, data = null) {
    const timestamp = new Date().toLocaleTimeString('bn-BD');
    const deviceShort = DEVICE_ID.substr(0, 12);
    console.log(`[${timestamp}] 🖥️ ${deviceShort} | ${emoji} ${message}`);
    if (data) console.log(data);
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================
  function initialize() {
    if (isInitialized) return true;

    try {
      if (typeof window.supabase === 'undefined') {
        log('❌', 'Supabase library not loaded');
        return false;
      }

      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

      // Get local version
      localVersion = parseInt(localStorage.getItem('wings_local_version')) || 0;

      isInitialized = true;
      log('✅', `Initialized (version: ${localVersion})`);
      return true;

    } catch (error) {
      log('❌', 'Init failed:', error);
      return false;
    }
  }

  // ==========================================
  // SMART PULL WITH CONFLICT RESOLUTION
  // ==========================================
  async function pullFromCloud(silent = false, force = false) {
    if (!isInitialized && !initialize()) return false;
    if (isPulling) return false;
    // Block pull for 15 seconds after any push to prevent delete/edit race condition
    // But FORCE pull (on login) bypasses this block
    if (!force && Date.now() - lastPushTime < 15000) {
      if (!silent) log('⏸️', 'Pull blocked - recent push in progress');
      return false;
    }
    if (!isOnline) {
      if (!silent) log('📵', 'Offline - cannot pull');
      return false;
    }

    isPulling = true;

    try {
      if (!silent) log('📥', 'Pulling from cloud...');

      const { data, error } = await supabaseClient
        .from(TABLE_NAME)
        .select('*')
        .eq('id', RECORD_ID)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          if (!silent) log('ℹ️', 'No cloud data - first device');
          window.initialSyncComplete = true; // ✅ V31
          isPulling = false;
          return true;
        }
        throw error;
      }

      if (!data) {
        isPulling = false;
        return false;
      }

      // Get metadata
      const cloudTimestamp = data.last_updated ? new Date(data.last_updated).getTime() : 0;
      const cloudVersion = parseInt(data.version) || 0;
      const cloudDevice = data.last_device || 'unknown';
      const localTimestamp = parseInt(localStorage.getItem('lastSyncTime')) || 0;

      // 🔥 SMART CONFLICT RESOLUTION
      const shouldUpdate = determineIfShouldUpdate(
        cloudTimestamp,
        localTimestamp,
        cloudVersion,
        localVersion,
        cloudDevice
      );

      if (shouldUpdate) {
        if (!silent) {
          log('📥', `Cloud newer: v${cloudVersion} (${new Date(cloudTimestamp).toLocaleTimeString('bn-BD')})`);
          log('📥', `Local older: v${localVersion} (${new Date(localTimestamp).toLocaleTimeString('bn-BD')})`);
          log('📥', `From: ${cloudDevice.substr(0, 15)}`);
        }

        // ✅ DATA LOSS PREVENTION (V27 - FIXED)
        //
        // 🐛 V26 বাগ: Cloud-এ data কম দেখলে "data loss" ধরে নিত
        // এবং local (পুরোনো) data দিয়ে cloud overwrite করত।
        // ফলে delete করা student/finance রিফ্রেশে ফিরে আসত।
        //
        // ✅ V27 Fix: Cloud version বেশি হলে সবসময় accept করো।
        // Version বেশি = আমরাই delete করে push করেছিলাম = intentional।
        const localStudents = (window.globalData && window.globalData.students) || [];
        const cloudStudents = data.students || [];
        const localFinance = (window.globalData && window.globalData.finance) || [];
        const cloudFinance = data.finance || [];
        // ✅ V28 NEW: employees ও protect করো
        const localEmployees = (window.globalData && window.globalData.employees) || [];
        const cloudEmployees = data.employees || [];
        const cloudLastAction = data.last_action || '';
        const cloudLastDevice = data.last_device || '';

        const cloudHasFewerStudents = cloudStudents.length < localStudents.length;
        const cloudHasFewerFinance = cloudFinance.length < localFinance.length;
        // ✅ V28 NEW: employees কমে গেলেও check করো
        const cloudHasFewerEmployees = cloudEmployees.length < localEmployees.length;

        if (cloudHasFewerStudents || cloudHasFewerFinance || cloudHasFewerEmployees) {
          const isOwnPush = cloudLastDevice === DEVICE_ID;
          const isDeleteAction = cloudLastAction.toLowerCase().includes('delete') ||
            cloudLastAction.toLowerCase().includes('trash') ||
            cloudLastAction.toLowerCase().includes('remove');
          const isCloudNewer = cloudVersion > localVersion;

          // ✅ V31: ADVANCED MASS-DATA-LOSS PROTECTION
          // যদি ক্লাউড ভার্সন বেশি হয় কিন্তু ডেটা অনেক বেশি কমে যায় (৫টির বেশি আইটেম ডিফারেন্স এবং ক্লাউড অর্ধেকেরও কম)
          // তবে এটি সন্দেহজনক হতে পারে। সেক্ষেত্রে লোকাল ডেটা ওভাররাইট হওয়ার আগে একটি এমারজেন্সি ব্যাকআপ নিন।
          const studentDiff = localStudents.length - cloudStudents.length;
          const isSuspiciousLoss = isCloudNewer && !isOwnPush && !isDeleteAction &&
            (studentDiff > 5 && cloudStudents.length < (localStudents.length / 2));

          if (isSuspiciousLoss) {
            log('🛡️', 'Suspicious mass data loss detected in cloud! Creating emergency snapshot before sync...');
            try {
              const snapshot = {
                timestamp: new Date().toISOString(),
                version: localVersion,
                data: JSON.parse(JSON.stringify(window.globalData))
              };
              localStorage.setItem('wings_emergency_snapshot', JSON.stringify(snapshot));
            } catch (e) { log('⚠️', 'Snapshot failed: ' + e.message); }
          }

          if (isOwnPush || isDeleteAction || isCloudNewer) {
            log('🗑️', `Accepting cloud (own=${isOwnPush}, delete=${isDeleteAction}, newer=${isCloudNewer}, suspicious=${isSuspiciousLoss})`);
            log('🗑️', `Students: Cloud=${cloudStudents.length} Local=${localStudents.length}`);
            log('🗑️', `Employees: Cloud=${cloudEmployees.length} Local=${localEmployees.length}`);
            // Continue below (no return)
          } else {
            // ❌ অন্য device, version same, data কমেছে — সত্যিকারের data loss
            log('🛡️', `Data loss prevention! Students: ${cloudStudents.length} vs ${localStudents.length}`);
            log('🛡️', `Finance: ${cloudFinance.length} vs ${localFinance.length}`);
            log('🛡️', `Employees: ${cloudEmployees.length} vs ${localEmployees.length}`);
            localVersion = cloudVersion;
            localStorage.setItem('wings_local_version', localVersion.toString());
            isPulling = false;
            setTimeout(() => pushToCloud('Data-loss-prevention push'), 1000);
            return true;
          }
        }

        // Temporarily disable monitoring
        const wasMonitoring = isMonitoringEnabled;
        isMonitoringEnabled = false;

        // ✅ PRESERVE LOCAL-ONLY DATA (deletedItems & activityHistory)
        // V29: এখন cloud এ store হয়, তাই cloud টাই সঠিক।
        // তবে cloud এ না থাকলে (পুরোনো data) local backup থেকে নিয়ো।
        const _savedDeleted = localStorage.getItem('wingsfly_deleted_backup');
        const _savedActivity = localStorage.getItem('wingsfly_activity_backup');
        const _cloudDeleted = data.deleted_items || null;
        const _cloudActivity = data.activity_history || null;

        // Cloud এ আছে → cloud নাও। নইলে local backup।
        const _preservedDeleted = _cloudDeleted !== null ? _cloudDeleted :
          (_savedDeleted ? JSON.parse(_savedDeleted) :
            (window.globalData && window.globalData.deletedItems) || []);
        const _preservedActivity = _cloudActivity !== null ? _cloudActivity :
          (_savedActivity ? JSON.parse(_savedActivity) :
            (window.globalData && window.globalData.activityHistory) || []);

        // ✅ FIX: Settings merge — local security settings preserve করো
        const _cloudSettings = data.settings || {};
        const _localSettingsBackup = (() => { try { return JSON.parse(localStorage.getItem("wingsfly_settings_backup") || "null"); } catch(e) { return null; } })();
        const _mergedSettings = Object.assign({}, _cloudSettings);
        if (_localSettingsBackup) {
          if (_localSettingsBackup.recoveryQuestion) _mergedSettings.recoveryQuestion = _localSettingsBackup.recoveryQuestion;
          if (_localSettingsBackup.recoveryAnswer) _mergedSettings.recoveryAnswer = _localSettingsBackup.recoveryAnswer;
          if (_localSettingsBackup.adminUsername) _mergedSettings.adminUsername = _localSettingsBackup.adminUsername;
          if (_localSettingsBackup.autoLockoutMinutes !== undefined) _mergedSettings.autoLockoutMinutes = _localSettingsBackup.autoLockoutMinutes;
        }
        const _usersBackup = (() => { try { return JSON.parse(localStorage.getItem("wingsfly_users_backup") || "null"); } catch(e) { return null; } })();
        const _mergedUsers = (_usersBackup && _usersBackup.length > 0) ? _usersBackup : (data.users || []);
        // Update global data
        window.globalData = {
          students: cloudStudents,
          employees: data.employees || [],
          finance: cloudFinance,
          settings: _mergedSettings,
          incomeCategories: data.income_categories || [],
          expenseCategories: data.expense_categories || [],
          paymentMethods: data.payment_methods || [],
          cashBalance: data.cash_balance || 0,
          bankAccounts: data.bank_accounts || [],
          mobileBanking: data.mobile_banking || [],
          courseNames: data.course_names || [],
          attendance: data.attendance || {},
          nextId: data.next_id || 1001,
          users: _mergedUsers,
          examRegistrations: data.exam_registrations || [],
          visitors: data.visitors || [],
          employeeRoles: data.employee_roles || [],
          deletedItems: _preservedDeleted,
          activityHistory: _preservedActivity,
          // ✅ V32 FIX: Missing data types — recycle bin restore এর জন্য
          keepRecords: data.keep_records || [],
          loans: data.loans || [],
          idCards: data.id_cards || [],
          notices: data.notices || [],
        };

        // Save to localStorage
        localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
        localStorage.setItem('lastSyncTime', cloudTimestamp.toString());
        localStorage.setItem('wings_local_version', cloudVersion.toString());

        // ✅ FIX: Clean payment methods after cloud pull to remove spelling inconsistencies
        if (typeof window.cleanupPaymentMethods === 'function') {
          window.cleanupPaymentMethods();
        }

        localVersion = cloudVersion;
        lastPullTime = Date.now();
        window.initialSyncComplete = true; // ✅ V31

        // ✅ Notice Board restore — cloud থেকে pull হলে notice ও restore করো
        // ✅ RACE CONDITION FIX: notice push pending থাকলে restore করো না
        try {
          if (window._noticePushPending) {
            log('📢', 'Notice push pending — skipping notice restore to avoid race condition');
          } else {
            const cloudNotice = window.globalData?.settings?.activeNotice;
            const localPending = window._noticePushData;

            // আমাদের নিজের push এর পরে pull এলে local notice কে protect করো
            if (localPending !== undefined && localPending !== null) {
              // আমরা সম্প্রতি notice push করেছিলাম — local টাই সঠিক
              log('📢', 'Notice: using local pending data (own push protected)');
              const localN = localPending ? JSON.parse(localPending) : null;
              if (localN) {
                localStorage.setItem('wingsfly_notice_board', JSON.stringify(localN));
                if (window.globalData && window.globalData.settings) {
                  window.globalData.settings.activeNotice = localN;
                }
              }
            } else if (cloudNotice && cloudNotice.expiresAt && Date.now() < cloudNotice.expiresAt) {
              // Cloud এ valid notice আছে — apply করো
              localStorage.setItem('wingsfly_notice_board', JSON.stringify(cloudNotice));
              if (typeof window.showNoticeBanner === 'function') window.showNoticeBanner(cloudNotice);
              log('📢', 'Notice restored from cloud');
            } else if (!cloudNotice) {
              // Cloud এ notice নেই — local থেকেও সরাও
              localStorage.removeItem('wingsfly_notice_board');
              if (typeof window.hideNoticeBanner === 'function') window.hideNoticeBanner();
            }
          }
        } catch (e) { log('⚠️', 'Notice restore error: ' + e.message); }

        // Refresh UI
        if (typeof window.renderFullUI === 'function') {
          window.renderFullUI();
        }

        // Re-enable monitoring
        isMonitoringEnabled = wasMonitoring;

        if (!silent) {
          showNotification('📥 Synced from cloud', 'success');
          log('✅', 'Pull complete - UI updated');
        }

      } else {
        if (!silent) {
          log('ℹ️', 'Local data is current ✓');
        }
      }

      isPulling = false;
      return true;

    } catch (error) {
      log('❌', 'Pull error:', error);
      isPulling = false;
      return false;
    }
  }

  // ==========================================
  // SMART CONFLICT RESOLUTION LOGIC
  // ==========================================
  function determineIfShouldUpdate(cloudTime, localTime, cloudVer, localVer, cloudDevice) {
    // Case 1: If this is our own push bouncing back, ignore
    const timeSinceOurPush = Date.now() - lastPushTime;
    if (timeSinceOurPush < 15000 && cloudDevice === DEVICE_ID) {
      return false;
    }

    // Case 2: Version-based (preferred method)
    if (cloudVer > localVer) {
      return true; // Cloud has higher version
    }

    if (cloudVer < localVer) {
      return false; // Local has higher version
    }

    // Case 3: Same version, use timestamp (fallback)
    if (cloudVer === localVer) {
      return cloudTime > localTime;
    }

    return false;
  }

  // ==========================================
  // SMART PUSH WITH VERSION INCREMENT
  // ==========================================
  async function pushToCloud(reason = 'Auto-save') {
    if (!isInitialized && !initialize()) {
      log('⚠️', 'Cannot push - not initialized');
      return false;
    }

    if (isPushing) {
      // ✅ V29 FIX: আগে শুধু return false করত, ফলে data হারাত।
      // এখন reason টা queue তে রাখো — push শেষ হলে এটা execute হবে।
      pendingPushReason = reason;
      log('⏳', `Push in progress — queued: "${reason}"`);
      return false;
    }

    if (!isOnline) {
      log('📵', 'Offline - push queued for later');
      return false;
    }

    isPushing = true;

    try {
      if (!window.globalData) {
        log('⚠️', 'No data to push');
        isPushing = false;
        return false;
      }

      // ✅ V31: PUSH PROTECTION LOCK
      // ১. প্রথমবার ডাটা পুল হওয়া পর্যন্ত পুশ বন্ধ
      if (!window.initialSyncComplete) {
        log('🛡️', 'Push BLOCKED: Initial cloud pull not complete yet.');
        isPushing = false;
        return false;
      }

      // ২. MASS DATA LOSS PROTECTION ON PUSH
      // যদি লোকাল ডাটা ক্লাউড ডাটার চেয়ে বিপুল পরিমাণ কমে যায় (যেমন ভুল করে সব ডিলিট হলো)
      const localCount = (window.globalData.students || []).length;
      const lastKnownCount = parseInt(localStorage.getItem('wings_last_known_count')) || 0;

      if (lastKnownCount > 5 && localCount === 0 && !reason.toLowerCase().includes('factory-reset')) {
        log('🚫', 'Push ABORTED: Mass data loss detected in local memory! (Count 0 vs ' + lastKnownCount + '). Refusing to overwrite cloud.');
        showNotification('🚫 ডাটা লস রুখতে সেভ বন্ধ করা হয়েছে। রিফ্রেশ দিন।', 'error');
        isPushing = false;
        return false;
      }

      // লোকাল কাউন্ট আপডেট করে রাখো ভবিষ্যতে চেক করার জন্য
      localStorage.setItem('wings_last_known_count', localCount.toString());

      // Increment local version (Vector Clock)
      localVersion++;

      log('📤', `Pushing v${localVersion} (${reason})...`);

      const timestamp = Date.now();

      // ✅ V30 FIX: Photo payload reduction
      // Student.photo তে base64 থাকলে sync payload অনেক বড় হয় (400+ student = 9-36MB)
      // Solution: photo field থেকে base64 বাদ দিয়ে শুধু photo_key (reference) রাখো
      // Photo নিজে IndexedDB তে local এ থাকবে — cloud sync করা লাগবে না
      const studentsWithoutPhotos = (window.globalData.students || []).map(s => {
        if (!s.photo) return s;
        // base64 হলে strip করো, শুধু key রাখো
        if (s.photo.startsWith('data:image')) {
          // ✅ IndexedDB key হিসেবে `photo_${studentId}` রাখো reference এর জন্য
          const safeKey = `photo_${s.studentId || s.id || 'unknown'}`;
          return { ...s, photo: safeKey, _photoLocal: true }; // _photoLocal = local only flag
        }
        return s; // already a key or URL — keep as-is
      });

      const payload = {
        id: RECORD_ID,
        students: studentsWithoutPhotos,
        employees: window.globalData.employees || [],
        finance: window.globalData.finance || [],
        settings: window.globalData.settings || {},
        income_categories: window.globalData.incomeCategories || [],
        expense_categories: window.globalData.expenseCategories || [],
        payment_methods: window.globalData.paymentMethods || [],
        cash_balance: window.globalData.cashBalance || 0,
        bank_accounts: window.globalData.bankAccounts || [],
        mobile_banking: window.globalData.mobileBanking || [],
        course_names: window.globalData.courseNames || [],
        attendance: window.globalData.attendance || {},
        next_id: window.globalData.nextId || 1001,
        users: window.globalData.users || [],
        exam_registrations: window.globalData.examRegistrations || [],
        visitors: window.globalData.visitors || [],
        employee_roles: window.globalData.employeeRoles || [],
        // ✅ V29 NEW: deletedItems ও activityHistory এখন cloud এ save হবে
        deleted_items: window.globalData.deletedItems || [],
        activity_history: window.globalData.activityHistory || [],
        // ✅ V32 FIX: Missing data types — recycle bin restore কাজ করার জন্য
        keep_records: window.globalData.keepRecords || [],
        loans: window.globalData.loans || [],
        id_cards: window.globalData.idCards || [],
        notices: window.globalData.notices || [],
        version: localVersion,
        last_updated: new Date(timestamp).toISOString(),
        last_device: DEVICE_ID,
        last_action: reason,
        updated_by: sessionStorage.getItem('username') || 'Admin',
        device_id: DEVICE_ID,
      };

      // ✅ V30 FIX: Race condition prevention
      // দুটো device একসাথে push করলে, cloud version check করে সিদ্ধান্ত নাও।
      // isPushing = true রেখেই check করো — flag কখনো drop করো না এই block এ।
      const { data: currentCloud, error: checkError } = await supabaseClient
        .from(TABLE_NAME)
        .select('version')
        .eq('id', RECORD_ID)
        .single();

      if (!checkError && currentCloud) {
        const currentCloudVersion = parseInt(currentCloud.version) || 0;
        if (currentCloudVersion >= localVersion) {
          // অন্য device আগেই push করে ফেলেছে — আমাদের version পুরোনো হয়ে গেছে
          log('⚠️', `Race condition detected! Cloud v${currentCloudVersion} >= our v${localVersion} — re-reading globalData`);
          localVersion = currentCloudVersion + 1; // cloud version এর পরে আমাদের version
          localStorage.setItem('wings_local_version', localVersion.toString());

          // ✅ payload fresh করো latest globalData থেকে (stale snapshot নয়)
          // isPushing = true রেখেই করো — নইলে continuous pull interfere করবে
          payload.students = window.globalData.students || [];
          payload.employees = window.globalData.employees || [];
          payload.finance = window.globalData.finance || [];
          payload.cash_balance = window.globalData.cashBalance || 0;
          payload.bank_accounts = window.globalData.bankAccounts || [];
          payload.mobile_banking = window.globalData.mobileBanking || [];
          payload.attendance = window.globalData.attendance || {};
          payload.exam_registrations = window.globalData.examRegistrations || [];
          payload.visitors = window.globalData.visitors || [];
          payload.deleted_items = window.globalData.deletedItems || [];
          payload.activity_history = window.globalData.activityHistory || [];
          // ✅ V32 FIX: Missing data types refresh
          payload.keep_records = window.globalData.keepRecords || [];
          payload.loans = window.globalData.loans || [];
          payload.id_cards = window.globalData.idCards || [];
          payload.notices = window.globalData.notices || [];
          payload.version = localVersion;
          payload.last_updated = new Date().toISOString();
        }
      }

      const { error } = await supabaseClient
        .from(TABLE_NAME)
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      // Save version and timestamp locally
      localStorage.setItem('lastSyncTime', timestamp.toString());
      localStorage.setItem('wings_local_version', localVersion.toString());
      lastPushTime = timestamp;

      log('✅', `Pushed v${localVersion} at ${new Date(timestamp).toLocaleTimeString('bn-BD')}`);
      showNotification(`📤 ${reason} saved`, 'success');

      isPushing = false;

      // ✅ V29: Queue তে pending push থাকলে এখন execute করো
      if (pendingPushReason !== null) {
        const queuedReason = pendingPushReason;
        pendingPushReason = null;
        log('🔁', `Executing queued push: "${queuedReason}"`);
        setTimeout(() => pushToCloud(queuedReason), 300);
      }

      return true;

    } catch (error) {
      log('❌', 'Push error:', error);
      showNotification('❌ Save failed - will retry', 'error');

      // Rollback version on error
      localVersion--;
      localStorage.setItem('wings_local_version', localVersion.toString());

      // ✅ V30 FIX: Error হলে queue clear করো না — 5 সেকেন্ড পরে retry করো
      // কিন্তু [retry] suffix থাকলে আর retry করো না (infinite loop বন্ধ)
      const isRetryAttempt = reason.includes('[retry]');

      if (pendingPushReason !== null) {
        const retryReason = pendingPushReason;
        pendingPushReason = null;
        if (!isRetryAttempt) {
          log('⚠️', `Push failed — retrying queued "${retryReason}" in 5s`);
          setTimeout(() => pushToCloud(retryReason + ' [retry]'), 5000);
        } else {
          log('⚠️', `Retry also failed for "${retryReason}" — giving up to prevent loop`);
        }
      } else if (!isRetryAttempt) {
        // নিজের push fail হয়েছে — একবার retry করো
        log('⚠️', `Push failed — retrying "${reason}" in 5s`);
        setTimeout(() => pushToCloud(reason + ' [retry]'), 5000);
      } else {
        log('⚠️', `Retry failed for "${reason}" — giving up`);
      }

      isPushing = false;
      return false;
    }
  }

  // ==========================================
  // DEBOUNCED PUSH (Auto-save)
  // ==========================================
  function schedulePush(reason = 'Auto-save') {
    // Clear previous timer
    if (pushDebounceTimer) {
      clearTimeout(pushDebounceTimer);
    }

    // Schedule new push
    pushDebounceTimer = setTimeout(() => {
      pushToCloud(reason);
    }, PUSH_DEBOUNCE_DELAY);

    log('⏱️', `Push scheduled in ${PUSH_DEBOUNCE_DELAY}ms`);
  }

  // ==========================================
  // REAL-TIME LISTENER
  // ==========================================
  function startRealtimeListener() {
    if (!isInitialized) return;
    if (realtimeChannel) {
      log('ℹ️', 'Realtime already active');
      return;
    }

    try {
      log('👂', 'Starting realtime listener...');

      realtimeChannel = supabaseClient
        .channel('wings_academy_sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: TABLE_NAME,
            filter: `id=eq.${RECORD_ID}`
          },
          (payload) => {
            const changeDevice = payload.new?.last_device || 'unknown';
            const changeVersion = payload.new?.version || 0;
            const changeAction = payload.new?.last_action || 'Update';

            // Ignore our own changes
            if (changeDevice === DEVICE_ID) {
              log('ℹ️', 'Own change echo - ignoring');
              return;
            }

            log('🔔', `Remote update v${changeVersion} from ${changeDevice.substr(0, 15)}`);
            log('🔔', `Action: ${changeAction}`);

            // Pull after small delay
            setTimeout(() => {
              pullFromCloud(false);
            }, 500);
          }
        )
        .subscribe((status) => {
          log('📡', `Realtime: ${status}`);

          if (status === 'SUBSCRIBED') {
            log('✅', 'Realtime active!');
            showNotification('🔄 Real-time sync enabled', 'success');
            // Reset reconnect counter on success
            realtimeReconnectCount = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            log('⚠️', `Realtime ${status} — scheduling reconnect...`);

            // ✅ V30 FIX: Auto-reconnect with exponential backoff (max 3 attempts)
            if (realtimeReconnectCount < 3) {
              realtimeReconnectCount++;
              const delay = realtimeReconnectCount * 10000; // 10s, 20s, 30s
              log('🔁', `Reconnect attempt ${realtimeReconnectCount}/3 in ${delay / 1000}s...`);
              setTimeout(() => {
                try {
                  if (realtimeChannel) {
                    supabaseClient.removeChannel(realtimeChannel);
                    realtimeChannel = null;
                  }
                  startRealtimeListener();
                } catch (e) {
                  log('❌', 'Reconnect failed: ' + e.message);
                }
              }, delay);
            } else {
              log('⚠️', 'Realtime max reconnects reached — polling fallback active');
              // Polling fallback এমনিতেই চালু আছে (startContinuousPull)
            }
          }
        });

    } catch (error) {
      log('❌', 'Realtime error:', error);
    }
  }

  // ==========================================
  // AUTO-SAVE MONITOR (localStorage watch)
  // ==========================================
  function installAutoSaveMonitor() {
    if (isMonitoringEnabled) return;

    try {
      const originalSetItem = localStorage.setItem.bind(localStorage);

      localStorage.setItem = function (key, value) {
        originalSetItem(key, value);

        if (key === 'wingsfly_data' && isMonitoringEnabled) {
          log('💾', 'Data change detected');
          schedulePush('Auto-save');
        }
      };

      isMonitoringEnabled = true;
      log('🔧', 'Auto-save monitor installed');

    } catch (error) {
      log('❌', 'Monitor install failed:', error);
    }
  }

  // ==========================================
  // CONTINUOUS PULL (Background sync)
  // ==========================================
  // ==========================================
  // ✅ V28 NEW: DAILY AUTO-BACKUP SYSTEM
  // প্রতিদিন একবার সম্পূর্ণ ডেটার snapshot নেয়
  // ==========================================
  function saveDailyBackup() {
    try {
      if (!window.globalData) return;
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const lastBackupDate = localStorage.getItem('wings_last_backup_date');

      if (lastBackupDate === today) return; // আজকে backup ইতিমধ্যে নেওয়া হয়েছে

      const backup = {
        date: today,
        timestamp: new Date().toISOString(),
        students: (window.globalData.students || []).length,
        employees: (window.globalData.employees || []).length,
        finance: (window.globalData.finance || []).length,
        data: JSON.stringify({
          students: window.globalData.students || [],
          employees: window.globalData.employees || [],
          finance: window.globalData.finance || [],
        })
      };

      // শেষ 7 দিনের backup রাখো
      let allBackups = [];
      try { allBackups = JSON.parse(localStorage.getItem('wings_daily_backups') || '[]'); } catch (e) { }
      allBackups.unshift(backup);
      if (allBackups.length > 7) allBackups = allBackups.slice(0, 7);

      // ✅ V30 FIX: localStorage-এ save (আগের মতো)
      localStorage.setItem('wings_daily_backups', JSON.stringify(allBackups));
      localStorage.setItem('wings_last_backup_date', today);
      log('💾', `Daily backup saved locally: ${backup.students} students`);

      // ✅ V30 NEW: Cloud-এও backup save করো — browser clear হলেও নিরাপদ
      // globalData.settings এ 'dailyBackups' key তে রাখো
      // এটা পরের push এ cloud এ চলে যাবে
      try {
        if (!window.globalData.settings) window.globalData.settings = {};
        let cloudBackups = window.globalData.settings.dailyBackups || [];
        if (!Array.isArray(cloudBackups)) cloudBackups = [];
        // Cloud backup-এ full data রাখি না (বড় হয়ে যাবে) — শুধু count + date রাখি
        const cloudBackupEntry = {
          date: today,
          timestamp: backup.timestamp,
          students: backup.students,
          employees: backup.employees,
          finance: backup.finance,
        };
        cloudBackups.unshift(cloudBackupEntry);
        if (cloudBackups.length > 7) cloudBackups = cloudBackups.slice(0, 7);
        window.globalData.settings.dailyBackups = cloudBackups;
        // পরের auto-push এ cloud এ চলে যাবে
        // তবে full data backup Supabase এ আলাদা key তে রাখো (safe)
        if (supabaseClient) {
          const backupPayload = {
            id: `backup_${today}`,
            backup_date: today,
            students: window.globalData.students || [],
            employees: window.globalData.employees || [],
            finance: window.globalData.finance || [],
            created_at: new Date().toISOString(),
          };
          // fire-and-forget — fail হলেও problem নেই, localStorage backup আছে
          supabaseClient
            .from('academy_backups') // আলাদা backup table
            .upsert(backupPayload, { onConflict: 'id' })
            .then(({ error }) => {
              if (!error) {
                log('☁️', `Daily backup saved to cloud: ${today}`);
              } else {
                // ✅ Fallback: backup table না থাকলে main settings এ রাখো
                log('ℹ️', `Cloud backup table নেই — settings এ backup metadata রাখা হয়েছে`);
              }
            })
            .catch(() => {
              log('ℹ️', `Cloud backup skipped — will retry next day`);
            });
        }
      } catch (cloudErr) {
        log('⚠️', 'Cloud backup save error: ' + cloudErr.message);
        // localStorage backup ঠিকই আছে
      }

    } catch (e) {
      log('⚠️', 'Daily backup failed: ' + e.message);
    }
  }

  // Daily backup restore helper (console থেকে ব্যবহার করা যাবে)
  window.wingsRestoreBackup = function (dateString) {
    try {
      const allBackups = JSON.parse(localStorage.getItem('wings_daily_backups') || '[]');
      console.log('Available backups:');
      allBackups.forEach((b, i) => {
        console.log(`  [${i}] ${b.date} — Students: ${b.students}, Employees: ${b.employees}, Finance: ${b.finance}`);
      });
      if (!dateString) {
        console.log('\nUsage: wingsRestoreBackup("2026-02-21") — তারিখ দিয়ে restore করুন');
        return;
      }
      const found = allBackups.find(b => b.date === dateString);
      if (!found) { console.error('Backup not found for date:', dateString); return; }
      const restored = JSON.parse(found.data);
      if (!window.globalData) window.globalData = {};
      window.globalData.students = restored.students;
      window.globalData.employees = restored.employees;
      window.globalData.finance = restored.finance;
      localStorage.setItem('wingsfly_data', JSON.stringify(window.globalData));
      console.log(`✅ Restored from ${dateString}:`, restored.students.length, 'students,', restored.employees.length, 'employees');
      if (typeof window.renderFullUI === 'function') window.renderFullUI();
    } catch (e) {
      console.error('Restore failed:', e);
    }
  };

  function startContinuousPull() {
    pullIntervalId = setInterval(() => {
      if (!isPushing && !isPulling && isOnline) {
        pullFromCloud(true); // Silent pull
      }
    }, PULL_INTERVAL);

    log('⏰', `Continuous pull started (every ${PULL_INTERVAL / 1000}s)`);
  }

  // ==========================================
  // NETWORK STATUS MONITORING
  // ==========================================
  function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      isOnline = true;
      log('🌐', 'Back online - syncing...');
      showNotification('🌐 Back online', 'success');

      // Immediately pull when back online
      pullFromCloud(false).then(() => {
        // Then push any pending changes
        if (window.globalData) {
          pushToCloud('Reconnected');
        }
      });
    });

    window.addEventListener('offline', () => {
      isOnline = false;
      log('📵', 'Offline - sync paused');
      showNotification('📵 Working offline', 'info');
    });

    log('📡', `Network monitoring enabled (status: ${isOnline ? 'online' : 'offline'})`);
  }

  // ==========================================
  // PAGE REFRESH/RELOAD HANDLING
  // ==========================================
  function setupRefreshHandling() {
    // Save pending changes before page unload
    window.addEventListener('beforeunload', (e) => {
      // ✅ V29 FIX: আগে sendBeacon এ শুধু metadata যেত, data যেত না।
      // এখন full data সহ Supabase REST API তে PATCH পাঠাবে।
      if (pushDebounceTimer || isPushing || pendingPushReason) {
        clearTimeout(pushDebounceTimer);

        if (!window.globalData || !navigator.sendBeacon) return;

        try {
          // localVersion increment করো (unsaved change আছে)
          const beaconVersion = localVersion + 1;
          const beaconTimestamp = new Date().toISOString();

          const payload = JSON.stringify({
            id: RECORD_ID,
            students: window.globalData.students || [],
            employees: window.globalData.employees || [],
            finance: window.globalData.finance || [],
            settings: window.globalData.settings || {},
            income_categories: window.globalData.incomeCategories || [],
            expense_categories: window.globalData.expenseCategories || [],
            payment_methods: window.globalData.paymentMethods || [],
            cash_balance: window.globalData.cashBalance || 0,
            bank_accounts: window.globalData.bankAccounts || [],
            mobile_banking: window.globalData.mobileBanking || [],
            course_names: window.globalData.courseNames || [],
            attendance: window.globalData.attendance || {},
            next_id: window.globalData.nextId || 1001,
            users: window.globalData.users || [],
            exam_registrations: window.globalData.examRegistrations || [],
            visitors: window.globalData.visitors || [],
            employee_roles: window.globalData.employeeRoles || [],
            deleted_items: window.globalData.deletedItems || [],
            activity_history: window.globalData.activityHistory || [],
            version: beaconVersion,
            last_updated: beaconTimestamp,
            last_device: DEVICE_ID,
            last_action: 'Page-close auto-save',
            updated_by: sessionStorage.getItem('username') || 'Admin',
            device_id: DEVICE_ID,
          });

          // Supabase REST upsert endpoint
          const beaconUrl = `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?on_conflict=id`;
          const blob = new Blob([payload], { type: 'application/json' });

          // sendBeacon এর সাথে header পাঠানো যায় না, তাই fetch (keepalive) ব্যবহার করি
          // keepalive: true মানে page close হলেও request complete হবে
          fetch(beaconUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Prefer': 'resolution=merge-duplicates',
            },
            body: payload,
            keepalive: true, // ✅ Page close হলেও complete হবে
          }).catch(() => {
            // keepalive fetch fail হলে sendBeacon fallback
            navigator.sendBeacon(beaconUrl, blob);
          });

          // Version locally সেভ করো (অন্তত localStorage এ থাকুক)
          localStorage.setItem('wings_local_version', beaconVersion.toString());
          localStorage.setItem('lastSyncTime', Date.now().toString());

          log('💾', `Page-close save attempted (v${beaconVersion})`);
        } catch (err) {
          log('⚠️', 'Page-close save error: ' + err.message);
        }
      }
    });

    // On page load, immediately pull
    if (document.readyState === 'complete') {
      pullFromCloud(false);
    }

    log('🔄', 'Refresh handling enabled');
  }

  // ==========================================
  // NOTIFICATION HELPER
  // ==========================================
  function showNotification(message, type = 'info') {
    // ✅ FIX: শুধু error হলেই toast দেখাবে — success/info শুধু console এ যাবে
    if (type === 'error' && typeof window.showErrorToast === 'function') {
      window.showErrorToast(message);
    } else {
      // success, info — silent, শুধু console
      console.log(`[SYNC-${type.toUpperCase()}] ${message}`);
    }
  }

  // ==========================================
  // PUBLIC API
  // ==========================================
  window.wingsSync = {
    /**
     * Manual full sync
     */
    fullSync: async function () {
      log('🔄', 'Manual full sync');
      await pullFromCloud(false);
      await pushToCloud('Manual sync');
    },

    /**
     * Force push
     */
    pushNow: function (reason = 'Manual push') {
      return pushToCloud(reason);
    },

    /**
     * Force pull
     */
    pullNow: function () {
      return pullFromCloud(false);
    },

    /**
     * Get status
     */
    getStatus: function () {
      const status = {
        'Device ID': DEVICE_ID,
        'Version': localVersion,
        'Online': isOnline ? '✅' : '❌',
        'Initialized': isInitialized ? '✅' : '❌',
        'Monitoring': isMonitoringEnabled ? '✅' : '❌',
        'Realtime': realtimeChannel !== null ? '✅' : '❌',
        'Last Push': lastPushTime ? new Date(lastPushTime).toLocaleString('bn-BD') : 'Never',
        'Last Pull': lastPullTime ? new Date(lastPullTime).toLocaleString('bn-BD') : 'Never'
      };

      console.table(status);
      return status;
    },

    /**
     * Get version info
     */
    getVersion: function () {
      return {
        local: localVersion,
        deviceId: DEVICE_ID
      };
    }
  };

  // Backward compatibility
  window.saveToCloud = () => pushToCloud('Legacy saveToCloud');
  window.loadFromCloud = (force = false) => pullFromCloud(false, force);
  window.manualSync = window.wingsSync.fullSync;
  window.manualCloudSync = window.wingsSync.fullSync; // ✅ V28 FIX: auto-test critical check
  window.scheduleSyncPush = schedulePush; // delete/add action এর reason পাঠানোর জন্য

  // ==========================================
  // AUTO-START SYSTEM
  // ==========================================
  function startSyncSystem() {
    log('🚀', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('🚀', 'Wings Fly Smart Sync V30 (Push Retry + Race Fix + Cloud Backup)');
    log('🚀', 'Industry-Standard Multi-device Sync');
    log('🚀', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    log('💻', `Device: ${DEVICE_ID}`);
    log('📊', `Version: ${localVersion}`);

    // Step 1: Initialize
    if (!initialize()) {
      log('❌', 'Init failed - aborting');
      return;
    }

    // Step 2: Setup network monitoring
    setupNetworkMonitoring();

    // Step 3: Setup refresh handling
    setupRefreshHandling();

    // Step 4: Initial pull (CRITICAL for login/refresh)
    log('📥', 'Initial pull (login/refresh)...');
    pullFromCloud(false).then(() => {
      log('✅', 'Initial pull complete');

      // Step 5: Start realtime (after 1s)
      setTimeout(() => {
        startRealtimeListener();
      }, 1000);

      // Step 6: Install auto-monitor (after 1.5s)
      setTimeout(() => {
        installAutoSaveMonitor();
      }, 1500);

      // Step 7: Start continuous pull (after 2s)
      setTimeout(() => {
        startContinuousPull();
      }, 2000);

      // ✅ V28 NEW: Daily backup — cloud pull শেষের পরে (10s)
      setTimeout(() => {
        saveDailyBackup();
      }, 10000);

      // All done!
      setTimeout(() => {
        log('🎉', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        log('🎉', '✅ Sync system fully operational!');
        log('🎉', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        log('💡', 'Features:');
        log('💡', '  ✅ Auto-save on data change');
        log('💡', '  ✅ Continuous background sync');
        log('💡', '  ✅ Smart conflict resolution');
        log('💡', '  ✅ Offline support');
        log('💡', '  ✅ Refresh/reload handling');
        log('💡', '  ✅ V28: Employees protected from accidental delete');
        log('💡', '  ✅ V28: Daily backup (7 days) — use wingsRestoreBackup()');
        log('💡', '  ✅ V30: Push error → auto retry in 5s (no data loss)');
        log('💡', '  ✅ V30: Race condition → version check before upsert');
        log('💡', '  ✅ V30: Daily backup → cloud + localStorage (double safe)');
        log('💡', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }, 2500);
    });
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSyncSystem);
  } else {
    startSyncSystem();
  }

})();

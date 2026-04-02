# Wings Fly Aviation Academy — Sync Architecture Document
### সম্পূর্ণ Sync System — কীভাবে কাজ করে, কোন ফাইলে কী আছে

---

## ১. Script Load Order (index.html)

```
config-secret.js          ← Supabase secret key (optional, gitignored)
supabase-config.js        ← Supabase URL + Anon Key + client singleton
snapshot-system.js        ← [defer] Auto-snapshot engine
supabase-sync-SMART-V39.js ← মূল Sync Engine (IIFE)
  ... অন্যান্য section files ...
auth.js                   ← Login / Logout logic
app.js                    ← globalData init, saveToStorage, renderFullUI
recycle-bin-fix.js        ← Delete → Recycle Bin patch
supabase-sync-patch.js    ← Pull-পরবর্তী resurrection guard + analytics
sync-guard.js             ← [defer] অতিরিক্ত guard (আলাদা ফাইল)
```

**গুরুত্বপূর্ণ:** `supabase-sync-SMART-V39.js` লোড হয় `auth.js` এবং `app.js`-এর **আগে**। তাই sync engine চালু হওয়ার সময় `saveToStorage` এবং `takeSnapshot` এখনো define হয়নি — retry logic দিয়ে এটা handle করা হয়।

---

## ২. ফাইল-ভিত্তিক দায়িত্ব

### `supabase-config.js`
- `window.SUPABASE_CONFIG` define করে (URL, KEY, table names)
- `window.getWingsSupabaseClient()` — singleton Supabase client তৈরি করে
- একাধিকবার `createClient()` call হলে GoTrue warning আসে — এটা একটাই client রাখে

### `supabase-sync-SMART-V39.js` — মূল Sync Engine
সব কিছু একটি IIFE-এর ভেতরে। বাইরে expose হয় শুধু `window.wingsSync` object।

**ভেতরের modules:**

| Module | কী করে |
|--------|--------|
| `CFG` | Supabase config copy, timing constants |
| `Egress` | প্রতিদিনের API request count — localStorage `wf_egress_YYYY-MM-DD` |
| `MaxCount` | সর্বোচ্চ data count মনে রাখে — push block করার জন্য |
| `SyncFreshness` | শেষ sync কতক্ষণ আগে হয়েছে |
| `NetworkQuality` | ভালো/খারাপ network track করে |
| `ConflictTracker` | conflict log — `wf_last_conflict` localStorage-এ |
| `_init()` | Supabase client ready করে, `_ready = true` |
| `_checkPartialTables()` | `wf_students` table আছে কিনা চেক — `_partialOK` set করে |
| `pullFromCloud()` | Cloud থেকে data আনে, merge করে |
| `pushToCloud()` | Local data cloud-এ পাঠায় |
| `_mergeRecords()` | Local + Cloud merge — timestamp-based conflict resolution |
| `_getDelta()` | আগের push snapshot vs এখনকার data — changed/deleted বের করে |
| `_rebuildBalancesSafe()` | finance[] থেকে cashBalance পুনর্গণনা |
| `_versionCheck()` | Cloud version > local version হলে pull করে |
| `_startupIntegrityCheck()` | Startup-এ data integrity নিশ্চিত করে |
| `_start()` | সব setup করে — entry point |
| `_installSnapshotGuard()` | `takeSnapshot()` কে wrap করে — sync চলাকালীন block |
| `_installMonitor()` | 15s interval-এ data change detect করে push trigger করে |
| `_setupRealtime()` | Supabase Realtime subscription — version change হলে pull |
| `_setupBeforeUnload()` | Page close-এ `sendBeacon` দিয়ে data push |
| `forcePushOnly()` | MaxCount reset করে force push |
| `_smartSync()` | Cloud vs local count compare করে push বা pull |

### `auth.js`
- `handleLogin()` → `trySupabaseLogin()` বা `handleLegacyLogin()`
- Login সফল হলে `showDashboard()` call করে
- `showDashboard()` এ:
  - `sessionStorage.setItem('wf_just_logged_in', 'true')` ← cross-device guard
  - `_loginSyncWithRetry()` চালায় — wingsSync ready না হলে 10 বার retry
  - Sync শেষে `renderFullUI()` + `wf_just_logged_in` clear + `takeSnapshot()`
- Logout: `wf_session_token`, `wf_just_logged_in` remove করে

### `app.js`
- `window.globalData` initialize করে localStorage থেকে
- `saveToStorage(skipCloudSync)`:
  - finance integrity check — কম data থাকলে block
  - `localStorage.setItem('wingsfly_data', ...)` 
  - `lastLocalUpdate` timestamp save
  - `window.saveToCloud()` call (wingsSync.pushNow alias)
- `window.renderFullUI()` — সব tab/UI একসাথে refresh
- `_syncAliasPoller()` — wingsSync ready হলে `saveToCloud`, `loadFromCloud`, `manualCloudSync` alias তৈরি করে

### `snapshot-system.js`
- `takeSnapshot()`:
  - Cross-device guard: `wf_just_logged_in === true` হলে skip
  - Sync guard: `_wf_sync_in_progress === true` হলে skip
  - Data integrity: `wings_last_known_finance` থেকে কম হলে skip
  - `window.globalData` থেকে data নেয় (localStorage নয়)
  - `wingsfly_snapshots` localStorage key-এ সর্বোচ্চ ৭টা snapshot রাখে
- `restoreSnapshot(id)` — snapshot থেকে restore
- Hourly auto-snapshot: 5 মিনিটে একবার check, 1 ঘন্টা পার হলে নেয়
- `_installMonitorSaveHook()` — `saveToStorage` patch করে — save হলে 800ms পরে monitor record করে

### `recycle-bin-fix.js`
- `moveToTrash(type, item)` — item কে `deletedItems.finance/students/employees` array-তে রাখে
- `deleteTransaction` / `deleteFinance` patch করে:
  1. `moveToTrash()` call করে (Recycle Bin-এ রাখে)
  2. Original delete function call করে (array থেকে সরায়, balance update)
- `deletedItems.finance[]` এ প্রতিটা entry: `{ item: originalFinanceObj, type, deletedAt, ... }`

### `supabase-sync-patch.js`
- `wingsSync.pullFromCloud()` patch করে — pull শেষে `_removeResurrectedItems()` চালায়
- `_removeResurrectedItems()` — pull-এর পরে Recycle Bin-এ থাকা items live array-এ ফিরে আসলে সরায়:
  - Finance, Students, Employees, Exam, Visitors, Keep Records, Notice Board
- `wfIsInRecycleBin(type, id)` — helper function
- Analytics refresh: pull-এর পরে `refreshAnalytics()` call

---

## ৩. Push Flow — Data Save থেকে Cloud পর্যন্ত

```
User action (add/edit/delete)
        ↓
saveToStorage() — app.js
        ↓ (integrity check pass হলে)
localStorage.setItem('wingsfly_data', ...)
        ↓
window.saveToCloud() → wingsSync.pushNow()
        ↓
pushToCloud() — supabase-sync-SMART-V39.js
        ↓
[DATA VALIDATION]
  - finance/students array check
  - wings_last_known_finance দিয়ে 50% drop check
        ↓
[MAXCOUNT CHECK]
  - wf_max_finance vs current count
  - deletedItems count যোগ করে net count বের করে
  - ✅ V39.3: un-synced delete থাকলে MaxCount adjust
        ↓
[VERSION INCREMENT]
  - Supabase RPC: increment_version()
  - Fallback: manual version++
        ↓
[DELTA CALCULATION — _getDelta()]
  - আগের push snapshot vs এখনকার data
  - changed[] + deleted[] বের করে
        ↓
[PARTIAL TABLE PUSH — Promise.all]
  wf_students → changed records upsert
  wf_finance  → changed records upsert
  wf_employees → changed records upsert
  +
  deletedItems থেকে un-synced markers → deleted:true upsert
        ↓
academy_data (main row) → cash_balance, settings, users, etc.
        ↓
_dirty.clear()
_saveLocal()
SyncFreshness.update()
```

---

## ৪. Pull Flow — Cloud থেকে Local পর্যন্ত

```
Trigger: _versionCheck(), _start(), wingsSync.pullNow(), login sync
        ↓
pullFromCloud() — supabase-sync-SMART-V39.js
        ↓
window._wf_sync_in_progress = true  ← snapshot block
        ↓
[4টি Supabase query — Promise.all]
  wf_students (data, deleted)
  wf_finance (data, deleted)
  wf_employees (data, deleted)
  academy_data (main row — settings, cash, version, etc.)
        ↓
_mergeRecords() — প্রতিটা table-এর জন্য
  local + cloud merge
  deleted:true → map থেকে সরায়
  timestamp conflict → নতুনটা জেতে
        ↓
[DEDUPLICATION]
  type|amount|date|person|category দিয়ে exact duplicate সরায়
        ↓
[MAIN ROW DATA]
  bankAccounts, mobileBanking, settings, users
  incomeCategories, expenseCategories, courseNames
  attendance, examRegistrations, visitors, notices
  activityHistory (timestamp compare করে)
  deletedItems.other (timestamp compare করে)
  keep_records (localStorage-এ)
        ↓
MaxCount.forceSet(students.length, finance.length)
        ↓
_rebuildBalancesSafe() — finance[] থেকে balance পুনর্গণনা
        ↓
_saveLocal() → localStorage
_rebuildSnapshots() → push snapshot update
SyncFreshness.update()
        ↓
window._wf_sync_in_progress = false  ← snapshot unblock
window._wf_pull_complete = true
        ↓
renderFullUI()  ← UI update
        ↓
supabase-sync-patch.js:
  _removeResurrectedItems()  ← deleted items live array-এ ফিরলে সরায়
  refreshAnalytics()
```

---

## ৫. Login Flow — Cross-Device Sync

```
User clicks Login button
        ↓
auth.js: handleLogin() → trySupabaseLogin() বা handleLegacyLogin()
        ↓
sessionStorage.setItem('wf_just_logged_in', 'true')  ← sync guard on
sessionStorage.setItem('wf_force_full_sync', 'true') ← FAST STARTUP skip
        ↓
loadDashboard() → renderFullUI()
        ↓
_loginSyncWithRetry(1):
  wingsSync ready? NO → 500ms পরে retry (max 10 বার)
  wingsSync ready? YES →
        ↓
wingsSync.pullNow() ← force full pull
  (FAST STARTUP skip হয় কারণ wf_just_logged_in=true)
        ↓
Pull complete → renderFullUI()
        ↓
sessionStorage.removeItem('wf_just_logged_in')  ← sync guard off
        ↓
1s পরে: localStorage save + takeSnapshot()
WingsLoader.hide()
```

**FAST STARTUP কী:** `_start()` এ যদি session token থাকে এবং data 5 মিনিটের কম পুরনো হয়, তাহলে full pull skip করে শুধু `_versionCheck()` চালায়। Login-এর পরে এটা bypass হয়।

---

## ৬. Startup Integrity Check

```
_start() চালু হয়
        ↓
_startupIntegrityCheck():

  CASE 1: localStorage-এ data নেই (Fresh Browser)
    → Cloud থেকে full pull
    → UI hide করে pull, তারপর দেখায়

  CASE 2: data আছে, MaxCount OK
    → কিছু করে না

  CASE 3: data আছে, MaxCount UNSAFE (local < max - tolerance)
    → Cloud count check করে
    → local > cloud → push (startup-push)
    → cloud > local → force load from cloud tables
```

---

## ৭. Delete → Cloud Sync Flow

```
User deletes a transaction
        ↓
recycle-bin-fix.js: deleteTransaction() (patched)
  1. moveToTrash('Finance', entry)
     → deletedItems.finance[].push({ item: entry, _synced: false, ... })
  2. origDeleteTransaction(id) — original function
     → gd.finance[] থেকে সরায়
     → balance reverse করে
     → saveToStorage() call
        ↓
saveToStorage() → saveToCloud() → pushToCloud()
        ↓
[MAXCOUNT CHECK — V39.3 FIX]
  finUnsynced = deletedItems.finance.filter(!_synced).length
  যদি > 0 হয়:
    MaxCount adjust করে নামায় (block হবে না)
        ↓
[PUSH]
  finance changed records → upsert (normal data)
  +
  deletedItems.finance.filter(!_synced) → deleted:true upsert
  → _synced = true mark করে
        ↓
Other device pulls:
  wf_finance row-এ deleted:true দেখলে
  _mergeRecords() → map.delete(key)
  → finance[] থেকে বাদ যায়
  → balance rebuild → correct balance
```

---

## ৮. Snapshot System

```
snapshot নেওয়ার conditions:
  ✅ wf_just_logged_in !== true (login sync শেষ)
  ✅ _wf_sync_in_progress !== true (pull/push চলছে না)
  ✅ wings_last_known_finance দিয়ে integrity OK
  ✅ globalData.finance.length > 0 (data খালি না)

snapshot কখন নেওয়া হয়:
  - Login sync শেষ হলে (1s পরে)
  - প্রতি ঘন্টায় (5 মিনিটে একবার check)
  - saveToStorage-এর পরে 800ms (monitor hook)

snapshot data source:
  - window.globalData (live) — localStorage নয়
  - নেওয়ার পরে localStorage-ও update করে

storage:
  - localStorage key: wingsfly_snapshots
  - Max 7টা রাখে, পুরনো বাদ দেয়
```

---

## ৯. localStorage Keys — সব key এবং কী রাখে

| Key | কোথায় set হয় | কী রাখে |
|-----|--------------|--------|
| `wingsfly_data` | app.js saveToStorage | সম্পূর্ণ globalData JSON |
| `wf_max_finance` | MaxCount.update/forceSet | সর্বোচ্চ finance count |
| `wf_max_students` | MaxCount.update/forceSet | সর্বোচ্চ student count |
| `wf_max_employees` | pull-এর পরে | সর্বোচ্চ employee count |
| `wings_last_known_finance` | MaxCount.forceSet | integrity check-এর জন্য |
| `wings_last_known_count` | MaxCount.forceSet | integrity check-এর জন্য |
| `wings_local_version` | push/pull | Supabase version number |
| `wf_egress_YYYY-MM-DD` | Egress.inc() | আজকের API request count |
| `wf_push_snapshot_students` | _saveSnapshot() | push delta-র জন্য hash map |
| `wf_push_snapshot_finance` | _saveSnapshot() | push delta-র জন্য hash map |
| `wf_push_snapshot_employees` | _saveSnapshot() | push delta-র জন্য hash map |
| `wings_last_sync_time` | SyncFreshness.update() | শেষ sync-এর timestamp |
| `lastLocalUpdate` | saveToStorage | শেষ local save-এর timestamp |
| `wf_session_token` | auth.js login | session valid কিনা |
| `wings_device_id` | _getOrCreateDeviceId() | device identifier |
| `wingsfly_snapshots` | takeSnapshot() | ৭টা hourly snapshot |
| `wingsfly_deleted_backup` | saveToStorage | deletedItems backup |
| `wingsfly_activity_backup` | saveToStorage | activityHistory backup |
| `wf_last_conflict` | ConflictTracker.record() | শেষ conflict log |
| `wingsfly_pre_push_backup` | pushToCloud() | push-এর আগে backup |
| `wings_notice_cleared_at` | notice board | notice delete timestamp |
| `wingsfly_keep_records` | keep records module | keep record notes |
| `wf_activity_cleared_at` | activity module | activity clear timestamp |

---

## ১০. sessionStorage Keys

| Key | কোথায় set হয় | কী করে |
|-----|--------------|--------|
| `wf_just_logged_in` | auth.js showDashboard() | snapshot + FAST STARTUP block |
| `wf_force_full_sync` | auth.js legacy login | force full pull on startup |
| `isLoggedIn` | auth.js | logged in status |
| `username` | auth.js | current user |
| `userRole` | auth.js | admin/user role |

---

## ১১. window.wingsSync Public API

```javascript
wingsSync.pullNow()         // Force full pull + renderFullUI
wingsSync.pushNow(reason)   // Push করো
wingsSync.fullSync()        // Pull + Push + renderFullUI
wingsSync.smartSync()       // Count compare করে push বা pull
wingsSync.forcePush()       // MaxCount reset করে push
wingsSync.forceRecovery()   // Full pull + renderFullUI (manual)
wingsSync.forceVersionSync()// Egress reset + full pull
wingsSync.resetEgress(pin)  // Egress counter reset
wingsSync.getStatus()       // সব status object
wingsSync.getEgressInfo()   // Egress details
wingsSync.markDirty(field)  // Push trigger-এর জন্য dirty mark
```

---

## ১২. Supabase Tables

| Table | কী রাখে | Row ID format |
|-------|--------|---------------|
| `academy_data` | Main row — cash, settings, users, version | `wingsfly_main` |
| `wf_students` | প্রতিটা student আলাদা row | `wingsfly_main_stu_{studentId}` |
| `wf_finance` | প্রতিটা transaction আলাদা row | `wingsfly_main_fin_{id}` |
| `wf_employees` | প্রতিটা employee আলাদা row | `wingsfly_main_emp_{id}` |
| `wf_user_profiles` | User profile (Supabase auth) | — |

প্রতিটা partial table-এ: `id`, `academy_id`, `data` (JSON), `deleted` (boolean)

---

## ১৩. Known Bugs এবং Fixes History

| Bug | কারণ | Fix ফাইল |
|-----|------|----------|
| Delete cloud-এ যায় না | MaxCount push block করে | `supabase-sync-SMART-V39.js` V39.3 |
| Cross-device login sync হয় না | FAST STARTUP skip করে | `auth.js` + `supabase-sync-SMART-V39.js` V39.3 |
| Snapshot পুরনো data নেয় | localStorage delay + sync চলছে | `snapshot-system.js` V39.3 |
| Deleted item pull-এর পরে ফিরে আসে | merge-এ delete marker miss | `supabase-sync-patch.js` |
| Cash balance oscillation | cloud stale cash_balance use | V39.6 — rebuild always |
| Finance duplicate entries | multi-device concurrent add | V39.7 — content-based dedup |
| Fresh browser data নেই | FAST STARTUP skip | V39.0 fresh browser detect |

---

*Last updated: April 2026 | Version: V39.3*

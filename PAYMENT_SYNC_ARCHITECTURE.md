PAYMENT & SYNC ARCHITECTURE DIAGRAM
====================================
Wings Fly Aviation Academy — Financial Flow Design

---

## DIAGRAM 1: PAYMENT FLOW ARCHITECTURE

```mermaid
graph TD
    A["👨‍💼 User\n(Accounts/Finance Tab)"] 
    B["💳 Payment Modal"]
    C["✅ Type Select\nDue/Advance/Bonus/Other"]
    
    D["💰 INCOME\n(Student Fee)"]
    E["💵 EXPENSE\n(Salary/Rent)"]
    F["🔵 ADVANCE\n(Employee)"]
    
    D --> D1["Cash/Bank/MFS"]
    D --> D2["feApplyEntryToAccount()+1"]
    D2 --> D3["cashBalance +=\nOR bankBalance +="]
    
    E --> E1["Cash/Bank/MFS"]
    E --> E2["feApplyEntryToAccount()+1"]
    E2 --> E3["cashBalance -=\nOR bankBalance -="]
    
    F --> F1["Advance Record\nCreated"]
    F1 --> F2["feApplyEntryToAccount()+1"]
    F2 --> F3["Account Liability\nIncreases"]
    F3 --> F4["Later: Advance Return\nto reduce liability"]
    
    D3 --> G["📊 gd.finance Array\n(Transaction Record)"]
    E3 --> G
    F3 --> G
    
    G --> H["💾 saveToStorage()"]
    H --> H1["localStorage"]
    H --> H2["IndexedDB\n(Photos)"]
    
    I["🔄 markDirty('finance')\n✅ Sync Scheduler"]
    G --> I
    
    I --> J["📡 Supabase Sync\n(V39 Smart)"]
    J --> J1["Cloud Database\n(Backup)"]
    J --> J2["Conflict\nResolution"]
    
    A --> B --> C --> D
    A --> B --> C --> E
    A --> B --> C --> F
    
    style A fill:#1e88e5
    style B fill:#43a047
    style C fill:#fb8c00
    style D fill:#00acc1
    style E fill:#e53935
    style F fill:#0096ff
    style G fill:#7b1fa2
    style H fill:#fbc02d
    style I fill:#00897b
    style J fill:#c62828
```

---

## DIAGRAM 2: TRANSFER MECHANISM (Inter-Account)

```mermaid
graph TD
    A["💳 Transfer Dialog\nFrom Account A → Account B"]
    B["Amount Input"]
    C["Fee? Extra charge?"]
    
    C --> D["✅ Create TWO Journal Entries:"]
    D --> E["TRANSFER_OUT\n(Account A decreases)"]
    D --> F["TRANSFER_IN\n(Account B increases)"]
    
    E --> E1["feApplyEntryToAccount()"]
    E1 --> E2["Balance A -= Amount\n+ fees"]
    E2 --> E3["gd.finance.push\n{type:Transfer, ..}"]
    
    F --> F1["feApplyEntryToAccount()"]
    F1 --> F2["Balance B += Amount\n(net after fees)"]
    F2 --> F3["gd.finance.push\n{type:Transfer, ..}"]
    
    E3 --> G["saveToStorage()"]
    F3 --> G
    
    G --> H["✅ Both entries\nexist = Balanced"]
    H --> I["If one missing =\n❌ Imbalance"]
    
    I --> I1["⚠️ Audit will catch"]
    I1 --> I2["Fix: Manual add\nor restore"]
    
    style A fill:#1e88e5
    style D fill:#43a047
    style E fill:#e53935
    style F fill:#00acc1
    style H fill:#00897b
    style I fill:#d32f2f
```

---

## DIAGRAM 3: BALANCE UPDATE FLOW (Critical Path)

```mermaid
graph TD
    A["New Transaction\nAdded to gd.finance"]
    B["feApplyEntryToAccount(txn, +1)"]
    
    B --> C{"Transaction\nType?"}
    
    C -->|Income| D["✅ Increase Balance"]
    C -->|Expense| E["✅ Decrease Balance"]
    C -->|Advance| F["✅ Create Liability\nEntry"]
    C -->|Transfer Out| G["✅ Decrease\nSource Account"]
    C -->|Transfer In| H["✅ Increase\nDest Account"]
    
    D --> D1["if method=Cash:\n  cashBalance += amt\nif method=Bank:\n  bankAccounts[idx].balance += amt\nif method=Bkash:\n  mobileBanking[idx].balance += amt"]
    
    E --> E1["if method=Cash:\n  cashBalance -= amt\nelse similar\nfor Bank/Bkash"]
    
    F --> F1["Advance: Create\ncompanion entry\nin Accounts\nManagement"]
    
    D1 --> I["✅ Entry Recorded"]
    E1 --> I
    F1 --> I
    G --> I
    H --> I
    
    I --> J["saveToStorage()"]
    J --> J1["Persist to\nlocalStorage"]
    
    J1 --> K["callFn:\nmarkDirty('finance')\nto flag for sync"]
    
    style A fill:#1e88e5
    style B fill:#43a047,stroke:#000,stroke-width:3px
    style C fill:#fb8c00
    style D fill:#00acc1
    style E fill:#e53935
    style F fill:#0096ff
    style I fill:#7b1fa2
    style J fill:#fbc02d
    style K fill:#00897b
```

---

## DIAGRAM 4: SYNC SYSTEM (Supabase V39)

```mermaid
graph TD
    A["📱 Local App\n(localStorage)"]
    B["🔄 Sync Scheduler\nmarkDirty() called"]
    
    B --> C["scheduleSyncPush()\n30-second delay"]
    C --> D["Check for\nConflicts"]
    
    D --> D1{"Conflict\nDetected?"}
    D1 -->|No| E["✅ Push to\nSupabase"]
    D1 -->|Yes| F["⚠️ Conflict\nResolution\n(Version check)"]
    
    E --> E1["Pull latest\nfrom cloud"]
    E1 --> E2["Merge with local"]
    E2 --> E3["Update\nlocalStorage"]
    
    F --> F1["Compare versions:\nlocal vs cloud"]
    F1 --> F2{"Local\nNewer?"}
    F2 -->|Yes| F3["Keep local,\nsend to cloud"]
    F2 -->|No| F4["Cloud wins,\nupdate local"]
    
    F3 --> E
    F4 --> E
    
    E3 --> G["📡 Cloud\nDatabase\n(Supabase)"]
    G --> H["💾 Backup\nPreserved"]
    
    A --> I["⚠️ No Sync?\n(Offline)"]
    I --> J["Data stays\nin localStorage\nawaiting sync"]
    J --> K["Auto-retry\nwhen online"]
    
    style A fill:#1e88e5
    style B fill:#43a047
    style C fill:#fb8c00
    style D fill:#00acc1
    style E fill:#00897b
    style E3 fill:#7b1fa2
    style F fill:#ff9800
    style G fill:#c62828
    style H fill:#fbc02d
    style J fill:#d32f2f
```

---

## DIAGRAM 5: PAYMENT METHODS & ACCOUNT SEGREGATION

```mermaid
graph TD
    A["💰 CASH\n(Physical)"]
    B["🏦 BANK\n(Multiple Accounts)"]
    C["📱 MOBILE\n(Bkash, Nagad)"]
    
    A --> A1["gd.cashBalance\n(Single Value)"]
    A1 --> A2["Simple Integer\nTracking"]
    
    B --> B1["gd.bankAccounts[]\nArray\n{name, balance,\naccountNo,\nbranch}"]
    B1 --> B2["Each account\ntracked separately"]
    
    C --> C1["gd.mobileBanking[]\nArray\n{name, balance}"]
    C1 --> C2["Bkash & Nagad\nseparate"]
    
    A2 --> D["All Transactions\nStore: method\n'Cash'"]
    B2 --> E["All Transactions\nStore: method\nBank Name"]
    C2 --> F["All Transactions\nStore: method\n'Bkash'/'Nagad'"]
    
    D --> G["On Receipt/Payment\nFilter & Update"]
    E --> G
    F --> G
    
    G --> H["feApplyEntryToAccount()\nLooks at txn.method\n+ txn.amount"]
    
    style A fill:#ffc107
    style B fill:#1976d2
    style C fill:#d32f2f
    style A1 fill:#fff176
    style B1 fill:#42a5f5
    style C1 fill:#ef5350
    style H fill:#43a047,stroke:#000,stroke-width:2px
```

---

## DIAGRAM 6: DATA FLOW ON STARTUP

```mermaid
graph TD
    A["🚀 Page Load\n(index.html)"]
    
    A --> B["1. Load Scripts\n(init order critical)"]
    B --> B1["app.js\n(globalData init)"]
    B --> B2["finance-engine.js\n⭐ MUST BE FIRST"]
    B --> B3["finance-crud.js\n(depends on engine)"]
    B --> B4["salary-management.js\n(depends on engine)"]
    
    B2 --> C["feApplyEntryToAccount\nfeCalcStats\nfeRebuildAllBalances\n(all exported)"]
    
    C --> D["2. Load Data\nfrom localStorage"]
    D --> D1["window.globalData\npopulated"]
    
    D1 --> E["3. Verify Structure\napp.js lines 51-52"]
    E --> E1["if deletedItems\nnot object,\nfix it"]
    
    E1 --> F["4. Rebuild Balances\nfeRebuildAllBalances()"]
    F --> F1["Recalculate ALL\nbalances from\ntransactions"]
    
    F1 --> G["5. Pull Sync\nsupabase-sync\n(if enabled)"]
    G --> G1["Check cloud\nfor changes"]
    G1 --> G2["Merge if\nnecessary"]
    
    G2 --> H["6. Render UI\nrenderFullUI()"]
    H --> H1["All balances\ncorrect &\ndisplayed"]
    
    style A fill:#1e88e5
    style B fill:#43a047
    style B2 fill:#d32f2f,stroke:#000,stroke-width:3px
    style C fill:#ff6f00
    style F fill:#00897b
    style H fill:#7b1fa2
```

---

## DIAGRAM 7: ERROR RECOVERY (Safeguards)

```mermaid
graph TD
    A["⚠️ Error Detected"]
    
    A --> B{"Type?"}
    
    B -->|Balance\nMismatch| C["feRebuildAllBalances()"]
    C --> C1["Recalculate from\nscratch using\nall transactions"]
    C1 --> C2["✅ Restored"]
    
    B -->|Missing\nTransaction| D["Check\nrecycle-bin"]
    D --> D1["Restore from\ndeletedItems"]
    D1 --> D2["✅ Recovered"]
    
    B -->|Sync\nConflict| E["Compare\nVersions"]
    E --> E1["Cloud newer?\nKeep cloud"]
    E -->|Local newer| E2["Send local\nto cloud"]
    
    B -->|Data\nCorruption| F["Auto-heal.js\nruns"]
    F --> F1["Backup detected"]
    F1 --> F2["Manual restore?\nEMERGENCY_RESTORE.js"]
    F2 --> F3["✅ Restored from\nbackup"]
    
    C2 --> G["✅ System\nOperational"]
    D2 --> G
    E1 --> G
    E2 --> G
    F3 --> G
    
    style A fill:#d32f2f
    style C fill:#ff6f00
    style D fill:#00acc1
    style E fill:#9c27b0
    style F fill:#e91e63
    style G fill:#43a047,stroke:#000,stroke-width:3px
```

---

## KEY IMPLEMENTATION RULES

### ✅ MUST DO
1. **Load finance-engine.js FIRST** — all other modules depend on it
2. **Always use feApplyEntryToAccount()** — never manually update balances
3. **Call saveToStorage()** after every change
4. **Mark dirty** before sync: markDirty('finance')
5. **Verify deletedItems** is object, not array

### ❌ NEVER DO
1. ❌ Adjust balance manually: `gd.cashBalance -= 100` ← WRONG
2. ❌ Skip feApplyEntryToAccount() ← Balance will be wrong
3. ❌ Create single-sided transactions ← Must have entry & update
4. ❌ Modify transaction after creation ← Create new entry, delete old
5. ❌ Override conflict in sync ← Use version control

---

## TESTING THE ARCHITECTURE

### Test 1: Complete Payment Cycle
```
1. Income → Check cashBalance updated
2. Expense → Check cashBalance decreased
3. Transfer → Check both accounts updated
4. Advance & Return → Check liability tracked
```

### Test 2: Sync Integrity
```
1. Make transaction offline
2. Go online
3. Verify sync happens automatically
4. Check cloud has new transaction
```

### Test 3: Balance Audit
```
console.log('Running audit...');
window.runFullAudit();
// All should show ✅
```

============================================================
Last Updated: 27-03-2026
Status: ✅ Architecture is PRODUCTION-GRADE
============================================================

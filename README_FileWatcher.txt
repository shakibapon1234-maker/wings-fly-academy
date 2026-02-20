
════════════════════════════════════════════════════
  📁 FILE VERSION WATCHER — Setup Guide
  Wings Fly Aviation Academy
════════════════════════════════════════════════════

STEP 1 — Python Install করুন
─────────────────────────────
https://www.python.org/downloads/
Download করে install করুন।
⚠️ Install করার সময় "Add Python to PATH" tick করুন!

STEP 2 — watchdog install করুন
────────────────────────────────
Windows এ Command Prompt খুলুন (Win+R → cmd → Enter)
এই command টা লিখুন:

    pip install watchdog

STEP 3 — Program চালান
───────────────────────
FileWatcher.py ফাইলে double-click করুন।
অথবা Command Prompt এ:

    python FileWatcher.py

STEP 4 — ব্যবহার করুন
───────────────────────
1. "📂 Browse" বাটনে click করে আপনার
   wings-fly-academy project folder select করুন

2. "▶ Start" বাটনে click করুন

3. এখন থেকে যখনই কোনো .js, .html, .css ফাইল
   save করবেন — automatically backup হবে!

4. পুরনো version ফিরে পেতে:
   বাম দিকে file নাম select করুন →
   ডান দিকে version list দেখুন →
   "⏪ Restore" বাটনে click করুন →
   ফাইল automatically আগের মতো হয়ে যাবে!

════════════════════════════════════════════════════
FEATURES
════════════════════════════════════════════════════

✅ নিজে থেকে ফাইল watch করে (manual drop নেই)
✅ ফাইল save হলেই 3 সেকেন্ড পরে backup নেয়
✅ Same content হলে duplicate backup নেয় না
✅ প্রতিটি ফাইলের 20টা version রাখে
✅ Backup folder: _file_versions (project এর ভেতরে)
✅ যেকোনো version এ ফিরে যাওয়া যায় এক click এ
✅ File size ও date/time দেখায়

════════════════════════════════════════════════════
Watch করে এই extensions:
.js .html .css .json .py .txt .md .ts .jsx .tsx
════════════════════════════════════════════════════

⚠️ NOTE:
- Program বন্ধ থাকলে watch হবে না
- Computer start করলে manually চালু করতে হবে
- Backup folder (_file_versions) delete করবেন না

════════════════════════════════════════════════════

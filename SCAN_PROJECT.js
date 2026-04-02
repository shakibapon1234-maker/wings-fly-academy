/**
 * ============================================================
 * WINGS FLY AVIATION ACADEMY — PROJECT SCANNER
 * ============================================================
 * 
 * ব্যবহার পদ্ধতি (HOW TO USE):
 * ---------------------------------------------------------------
 * 1. এই ফাইলটা আপনার wings-fly-academy ফোল্ডারে রাখুন
 * 2. Node.js থাকলে: terminal এ গিয়ে রান করুন →  node SCAN_PROJECT.js
 * 3. স্বয়ংক্রিয়ভাবে PROJECT_MAP.html ফাইল তৈরি হবে
 * 4. PROJECT_MAP.html ব্রাউজারে খুলুন — সব ফাংশন দেখতে পাবেন
 * 
 * Node.js নেই? https://nodejs.org থেকে ডাউনলোড করুন (LTS version)
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

// ── কনফিগ ──────────────────────────────────────────────────
const ROOT_DIR = __dirname; // যে ফোল্ডারে এই script আছে
const OUTPUT_FILE = path.join(ROOT_DIR, 'PROJECT_MAP.html');

const SCAN_EXTENSIONS = ['.js', '.html', '.css', '.json', '.md'];
const SKIP_DIRS = ['node_modules', '.git', '_PROJECT_BACKUPS', 'archive', '.vscode', '.agent', '.settings'];
const SKIP_FILES = ['SCAN_PROJECT.js']; // নিজেকে skip করো

// ── রঙ কোড (terminal এ সুন্দর দেখাবে) ──────────────────────
const C = {
  reset: '\x1b[0m', green: '\x1b[32m', cyan: '\x1b[36m',
  yellow: '\x1b[33m', red: '\x1b[31m', bold: '\x1b[1m'
};

console.log(C.bold + C.cyan + '\n🚀 Wings Fly Academy — Project Scanner শুরু হচ্ছে...\n' + C.reset);

// ── সব ফাইল খোঁজো ──────────────────────────────────────────
function getAllFiles(dir, fileList = []) {
  let items;
  try { items = fs.readdirSync(dir); } catch (e) { return fileList; }

  for (const item of items) {
    if (SKIP_DIRS.includes(item)) continue;
    const fullPath = path.join(dir, item);
    let stat;
    try { stat = fs.statSync(fullPath); } catch (e) { continue; }

    if (stat.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      const ext = path.extname(item).toLowerCase();
      if (SCAN_EXTENSIONS.includes(ext) && !SKIP_FILES.includes(item)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

// ── JS ফাইল বিশ্লেষণ ────────────────────────────────────────
function analyzeJS(content, filePath) {
  const results = {
    functions: [],
    windowExports: [],
    eventListeners: [],
    comments: [],
    issues: []
  };

  const lines = content.split('\n');

  // ফাইলের শীর্ষ মন্তব্য (প্রথম ১৫ লাইন)
  const topComment = lines.slice(0, 15)
    .filter(l => l.trim().startsWith('//') || l.trim().startsWith('*') || l.trim().startsWith('/*'))
    .map(l => l.replace(/^[\s/*]+/, '').trim())
    .filter(l => l.length > 2)
    .slice(0, 5)
    .join(' | ');
  if (topComment) results.comments.push(topComment);

  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const trimmed = line.trim();

    // ── ফাংশন খোঁজো ──
    // 1. function name() {}
    const fnDecl = trimmed.match(/^(?:async\s+)?function\s+(\w+)\s*\(/);
    if (fnDecl) {
      results.functions.push({ name: fnDecl[1], line: lineNum, type: 'declaration', async: trimmed.startsWith('async') });
    }

    // 2. const/let/var name = function() {} or = () => {}
    const fnExpr = trimmed.match(/^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\(|[\w]+\s*=>)/);
    if (fnExpr) {
      results.functions.push({ name: fnExpr[1], line: lineNum, type: 'expression', async: trimmed.includes('async') });
    }

    // 3. window.name = function()
    const winFn = trimmed.match(/^window\.(\w+)\s*=\s*(?:async\s+)?function/);
    if (winFn) {
      results.windowExports.push({ name: winFn[1], line: lineNum });
    }

    // 4. window.name = () =>
    const winArrow = trimmed.match(/^window\.(\w+)\s*=\s*(?:async\s+)?\(/);
    if (winArrow && trimmed.includes('=>')) {
      results.windowExports.push({ name: winArrow[1], line: lineNum });
    }

    // 5. addEventListener
    const evtMatch = trimmed.match(/addEventListener\s*\(\s*['"](\w+)['"]/);
    if (evtMatch) {
      results.eventListeners.push({ event: evtMatch[1], line: lineNum });
    }

    // ── সমস্যা খোঁজো ──
    if (trimmed.includes('console.error') || trimmed.includes('throw new Error')) {
      results.issues.push({ line: lineNum, text: trimmed.substring(0, 80) });
    }
  });

  // Duplicate function check
  const fnNames = results.functions.map(f => f.name);
  const duplicates = fnNames.filter((name, i) => fnNames.indexOf(name) !== i);
  if (duplicates.length > 0) {
    results.issues.push({ line: 0, text: '⚠️ Duplicate functions: ' + [...new Set(duplicates)].join(', ') });
  }

  return results;
}

// ── HTML ফাইল বিশ্লেষণ ──────────────────────────────────────
function analyzeHTML(content, filePath) {
  const results = {
    inlineScripts: 0,
    onclickFunctions: [],
    modals: [],
    sections: [],
    externalScripts: []
  };

  // Inline script tags গণনা
  const scriptMatches = content.match(/<script(?!\s+src)[^>]*>/gi) || [];
  results.inlineScripts = scriptMatches.length;

  // onclick functions
  const onclickMatches = content.matchAll(/onclick\s*=\s*["']([^"']+)["']/gi);
  for (const m of onclickMatches) {
    const fn = m[1].split('(')[0].trim();
    if (!results.onclickFunctions.includes(fn)) results.onclickFunctions.push(fn);
  }

  // Modal IDs
  const modalMatches = content.matchAll(/id\s*=\s*["'](\w+Modal\w*)["']/gi);
  for (const m of modalMatches) results.modals.push(m[1]);

  // Section IDs
  const sectionMatches = content.matchAll(/id\s*=\s*["'](\w+Section\w*)["']/gi);
  for (const m of sectionMatches) results.sections.push(m[1]);

  // External scripts
  const extScriptMatches = content.matchAll(/<script[^>]+src\s*=\s*["']([^"']+)["']/gi);
  for (const m of extScriptMatches) results.externalScripts.push(m[1]);

  return results;
}

// ── সব ফাইল স্ক্যান করো ─────────────────────────────────────
const allFiles = getAllFiles(ROOT_DIR);
console.log(C.green + `✅ মোট ${allFiles.length}টি ফাইল পাওয়া গেছে স্ক্যানের জন্য` + C.reset);

const fileData = [];
let totalFunctions = 0;
let totalWindowExports = 0;

for (const filePath of allFiles) {
  const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
  const ext = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.warn(C.yellow + `⚠️ পড়া যায়নি: ${relativePath}` + C.reset);
    continue;
  }

  const lineCount = content.split('\n').length;
  let analysis = {};

  if (ext === '.js') {
    analysis = analyzeJS(content, filePath);
    totalFunctions += analysis.functions.length;
    totalWindowExports += analysis.windowExports.length;
  } else if (ext === '.html') {
    analysis = analyzeHTML(content, filePath);
  }

  fileData.push({ relativePath, fileName, ext, fileSize, lineCount, analysis });
  console.log(C.cyan + `  📄 স্ক্যান: ${relativePath}` + C.reset +
    (ext === '.js' ? ` (${analysis.functions?.length || 0} functions)` : ''));
}

// ── HTML রিপোর্ট তৈরি করো ───────────────────────────────────
function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

const jsFiles = fileData.filter(f => f.ext === '.js');
const htmlFiles = fileData.filter(f => f.ext === '.html');

// সব ফাংশনের মাস্টার লিস্ট (সার্চের জন্য)
const masterFunctionList = [];
for (const f of jsFiles) {
  for (const fn of (f.analysis.functions || [])) {
    masterFunctionList.push({ file: f.relativePath, ...fn });
  }
  for (const fn of (f.analysis.windowExports || [])) {
    masterFunctionList.push({ file: f.relativePath, name: fn.name, line: fn.line, type: 'window.export', async: false });
  }
}

const reportDate = new Date().toLocaleString('bn-BD', { dateStyle: 'full', timeStyle: 'short' });
const totalLines = fileData.reduce((s, f) => s + f.lineCount, 0);

let html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>🗺️ Wings Fly Academy — Project Map</title>
<style>
  :root {
    --bg: #0a0e27; --bg2: #111630; --bg3: #161c3a;
    --cyan: #00d9ff; --purple: #b537f2; --pink: #ff2d95;
    --green: #00ff88; --yellow: #ffd600; --red: #ff4d4d;
    --text: #c8d0f0; --text2: #8890b0;
    --border: rgba(0,217,255,0.15);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', monospace; font-size: 14px; }
  
  /* HEADER */
  .header { background: linear-gradient(135deg, #0d1b4b, #1a0a3d);
    border-bottom: 2px solid var(--cyan); padding: 20px 30px;
    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  .header h1 { font-size: 22px; background: linear-gradient(90deg, var(--cyan), var(--purple));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .header .meta { font-size: 12px; color: var(--text2); text-align: right; }

  /* STATS BAR */
  .stats-bar { display: flex; gap: 12px; padding: 16px 30px; flex-wrap: wrap;
    background: var(--bg2); border-bottom: 1px solid var(--border); }
  .stat-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 18px; min-width: 140px; text-align: center; }
  .stat-card .num { font-size: 26px; font-weight: 700; color: var(--cyan); }
  .stat-card .lbl { font-size: 11px; color: var(--text2); margin-top: 2px; }

  /* SEARCH */
  .search-bar { padding: 14px 30px; background: var(--bg2); border-bottom: 1px solid var(--border);
    display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .search-bar input { flex: 1; min-width: 250px; background: var(--bg3); border: 1px solid var(--cyan);
    color: var(--text); border-radius: 8px; padding: 8px 14px; font-size: 14px; outline: none; }
  .search-bar input:focus { box-shadow: 0 0 0 2px rgba(0,217,255,0.3); }
  .search-bar select { background: var(--bg3); border: 1px solid var(--border); color: var(--text);
    border-radius: 8px; padding: 8px 12px; font-size: 13px; cursor: pointer; outline: none; }
  #searchCount { color: var(--cyan); font-size: 13px; min-width: 100px; }

  /* MAIN LAYOUT */
  .main { display: flex; height: calc(100vh - 180px); overflow: hidden; }
  .sidebar { width: 280px; min-width: 220px; background: var(--bg2);
    border-right: 1px solid var(--border); overflow-y: auto; padding: 10px 0; flex-shrink: 0; }
  .content { flex: 1; overflow-y: auto; padding: 20px 30px; }

  /* SIDEBAR NAV */
  .sidebar-section { padding: 6px 14px 2px; font-size: 11px; text-transform: uppercase;
    color: var(--text2); letter-spacing: 1px; margin-top: 10px; }
  .sidebar-item { display: block; padding: 7px 16px; cursor: pointer; border-radius: 6px;
    margin: 1px 6px; font-size: 13px; color: var(--text2); transition: all 0.15s;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: none;
    background: none; width: calc(100% - 12px); text-align: left; }
  .sidebar-item:hover { background: rgba(0,217,255,0.1); color: var(--cyan); }
  .sidebar-item.active { background: rgba(0,217,255,0.15); color: var(--cyan);
    border-left: 3px solid var(--cyan); }
  .sidebar-item .badge { float: right; background: rgba(0,217,255,0.2);
    color: var(--cyan); border-radius: 10px; padding: 1px 7px; font-size: 11px; }

  /* FILE CARD */
  .file-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px;
    margin-bottom: 18px; overflow: hidden; }
  .file-card-header { padding: 14px 18px; background: linear-gradient(135deg, var(--bg3), var(--bg2));
    border-bottom: 1px solid var(--border); display: flex; justify-content: space-between;
    align-items: flex-start; gap: 10px; cursor: pointer; }
  .file-card-header:hover { background: linear-gradient(135deg, rgba(0,217,255,0.08), var(--bg3)); }
  .file-path { font-family: monospace; font-size: 13px; color: var(--cyan); word-break: break-all; }
  .file-meta { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; justify-content: flex-end; }
  .tag { padding: 2px 9px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .tag-js { background: rgba(255,214,0,0.15); color: var(--yellow); border: 1px solid rgba(255,214,0,0.3); }
  .tag-html { background: rgba(181,55,242,0.15); color: var(--purple); border: 1px solid rgba(181,55,242,0.3); }
  .tag-lines { background: rgba(0,255,136,0.1); color: var(--green); border: 1px solid rgba(0,255,136,0.2); }
  .tag-size { background: rgba(0,217,255,0.1); color: var(--cyan); border: 1px solid rgba(0,217,255,0.2); }
  .file-card-body { padding: 14px 18px; display: none; }
  .file-card-body.open { display: block; }

  /* FILE DESCRIPTION */
  .file-desc { background: rgba(0,217,255,0.05); border-left: 3px solid var(--cyan);
    padding: 8px 12px; border-radius: 0 6px 6px 0; color: var(--text2);
    font-style: italic; margin-bottom: 12px; font-size: 13px; }

  /* FUNCTION TABLE */
  .fn-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .fn-table th { background: var(--bg3); color: var(--text2); padding: 7px 10px;
    text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 1px solid var(--border); }
  .fn-table td { padding: 6px 10px; border-bottom: 1px solid rgba(255,255,255,0.04);
    vertical-align: top; }
  .fn-table tr:hover td { background: rgba(0,217,255,0.04); }
  .fn-name { font-family: monospace; color: #64d9ff; font-weight: 600; }
  .fn-type { font-size: 11px; padding: 2px 7px; border-radius: 10px; }
  .fn-decl { background: rgba(0,255,136,0.1); color: var(--green); }
  .fn-expr { background: rgba(181,55,242,0.1); color: var(--purple); }
  .fn-window { background: rgba(255,45,149,0.1); color: var(--pink); }
  .fn-async { background: rgba(255,214,0,0.1); color: var(--yellow); font-size: 10px;
    padding: 1px 5px; border-radius: 6px; margin-left: 4px; }
  .line-num { color: var(--text2); font-size: 12px; font-family: monospace; }

  /* SECTION LABELS */
  .section-title { font-size: 12px; text-transform: uppercase; color: var(--text2);
    letter-spacing: 1px; margin: 12px 0 6px; padding-bottom: 4px;
    border-bottom: 1px solid var(--border); }

  /* WINDOW EXPORTS */
  .export-grid { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0; }
  .export-chip { background: rgba(255,45,149,0.1); color: var(--pink);
    border: 1px solid rgba(255,45,149,0.25); border-radius: 16px;
    padding: 3px 10px; font-family: monospace; font-size: 12px; }

  /* ONCLICK */
  .onclick-grid { display: flex; flex-wrap: wrap; gap: 5px; margin: 6px 0; }
  .onclick-chip { background: rgba(181,55,242,0.1); color: var(--purple);
    border: 1px solid rgba(181,55,242,0.25); border-radius: 14px;
    padding: 2px 8px; font-family: monospace; font-size: 11px; }

  /* ISSUES */
  .issue-list { list-style: none; }
  .issue-list li { color: var(--red); font-size: 12px; font-family: monospace;
    padding: 3px 0; opacity: 0.8; }

  /* MASTER SEARCH RESULTS */
  .search-results { padding: 0; }
  .search-result-item { display: flex; align-items: center; gap: 12px;
    padding: 9px 12px; border-bottom: 1px solid var(--border);
    border-radius: 6px; margin-bottom: 3px; background: var(--bg2); cursor: pointer; }
  .search-result-item:hover { background: rgba(0,217,255,0.07); }
  .sr-name { font-family: monospace; color: var(--cyan); font-weight: 600; min-width: 200px; }
  .sr-file { color: var(--text2); font-size: 12px; font-family: monospace; flex: 1; }
  .sr-line { color: var(--green); font-size: 12px; min-width: 60px; text-align: right; }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--purple); border-radius: 3px; }

  /* HIDDEN */
  .hidden { display: none !important; }
  .expand-icon { transition: transform 0.2s; font-size: 16px; color: var(--text2); }
  .expand-icon.open { transform: rotate(90deg); }

  /* TOGGLE BUTTONS */
  .toggle-btn { background: var(--bg3); border: 1px solid var(--border); color: var(--text2);
    border-radius: 6px; padding: 4px 10px; font-size: 12px; cursor: pointer; }
  .toggle-btn:hover { border-color: var(--cyan); color: var(--cyan); }

  @media (max-width: 768px) {
    .main { flex-direction: column; height: auto; }
    .sidebar { width: 100%; height: 200px; }
    .stats-bar { padding: 12px 16px; }
    .content { padding: 14px 16px; }
    .search-bar { padding: 10px 16px; }
    .header { padding: 14px 16px; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <h1>🗺️ Wings Fly Aviation Academy</h1>
    <div style="color:var(--text2);font-size:13px;margin-top:4px;">Project Function Map — সম্পূর্ণ ফাংশন তালিকা</div>
  </div>
  <div class="meta">
    <div>📅 তৈরি: ${reportDate}</div>
    <div style="margin-top:4px;">📁 Root: ${escapeHTML(ROOT_DIR)}</div>
  </div>
</div>

<div class="stats-bar">
  <div class="stat-card"><div class="num">${fileData.length}</div><div class="lbl">📄 মোট ফাইল</div></div>
  <div class="stat-card"><div class="num">${jsFiles.length}</div><div class="lbl">⚡ JS ফাইল</div></div>
  <div class="stat-card"><div class="num">${htmlFiles.length}</div><div class="lbl">🌐 HTML ফাইল</div></div>
  <div class="stat-card"><div class="num">${totalFunctions}</div><div class="lbl">🔧 মোট ফাংশন</div></div>
  <div class="stat-card"><div class="num">${totalWindowExports}</div><div class="lbl">🌍 window.exports</div></div>
  <div class="stat-card"><div class="num">${totalLines.toLocaleString()}</div><div class="lbl">📝 মোট লাইন</div></div>
</div>

<div class="search-bar">
  <input type="text" id="searchInput" placeholder="🔍 ফাংশন নাম খুঁজুন... (যেমন: switchTab, logActivity)" oninput="doSearch(this.value)">
  <select id="searchType" onchange="doSearch(document.getElementById('searchInput').value)">
    <option value="all">সব ধরন</option>
    <option value="declaration">Function Declaration</option>
    <option value="expression">Function Expression</option>
    <option value="window.export">window.export</option>
  </select>
  <span id="searchCount"></span>
  <button class="toggle-btn" onclick="expandAll()">সব খোলো</button>
  <button class="toggle-btn" onclick="collapseAll()">সব বন্ধ করো</button>
</div>

<div class="main">
  <!-- SIDEBAR -->
  <div class="sidebar" id="sidebar">
    <div class="sidebar-section">দ্রুত যাও</div>
    <button class="sidebar-item active" onclick="showView('all')">📋 সব ফাইল</button>
    <button class="sidebar-item" onclick="showView('search')">🔍 ফাংশন খুঁজুন</button>
    <div class="sidebar-section">JS ফাইল</div>
${jsFiles.map((f, i) => {
  const fnCount = (f.analysis.functions?.length || 0) + (f.analysis.windowExports?.length || 0);
  const shortName = f.fileName.replace('.js', '');
  return `    <button class="sidebar-item" onclick="scrollToFile('file-${i}')" title="${escapeHTML(f.relativePath)}">
      ⚡ ${escapeHTML(shortName)}
      <span class="badge">${fnCount}</span>
    </button>`;
}).join('\n')}
    <div class="sidebar-section">HTML ফাইল</div>
${htmlFiles.map((f, i) => {
  return `    <button class="sidebar-item" onclick="scrollToFile('htmlfile-${i}')" title="${escapeHTML(f.relativePath)}">
      🌐 ${escapeHTML(f.fileName.replace('.html', ''))}
    </button>`;
}).join('\n')}
  </div>

  <!-- CONTENT -->
  <div class="content" id="mainContent">

    <!-- ALL FILES VIEW -->
    <div id="view-all">
      <h2 style="margin-bottom:16px;font-size:16px;color:var(--cyan)">⚡ JavaScript ফাইল সমূহ</h2>
${jsFiles.map((f, i) => {
  const fns = f.analysis.functions || [];
  const exps = f.analysis.windowExports || [];
  const evts = f.analysis.eventListeners || [];
  const issues = f.analysis.issues || [];
  const desc = (f.analysis.comments || []).join(' ');
  return `
      <div class="file-card" id="file-${i}">
        <div class="file-card-header" onclick="toggleCard('body-js-${i}', 'icon-js-${i}')">
          <div>
            <div class="file-path">📄 ${escapeHTML(f.relativePath)}</div>
            ${desc ? `<div style="font-size:11px;color:var(--text2);margin-top:4px;font-style:italic;">${escapeHTML(desc.substring(0, 120))}</div>` : ''}
          </div>
          <div class="file-meta">
            <span class="tag tag-js">JS</span>
            <span class="tag tag-lines">${f.lineCount} লাইন</span>
            <span class="tag tag-size">${formatBytes(f.fileSize)}</span>
            <span class="tag tag-lines">${fns.length + exps.length} fn</span>
            <span class="expand-icon" id="icon-js-${i}">▶</span>
          </div>
        </div>
        <div class="file-card-body" id="body-js-${i}">
          ${fns.length > 0 ? `
          <div class="section-title">🔧 ফাংশন তালিকা (${fns.length}টি)</div>
          <table class="fn-table">
            <thead><tr><th>#</th><th>ফাংশন নাম</th><th>ধরন</th><th>লাইন</th></tr></thead>
            <tbody>
              ${fns.map((fn, idx) => `
              <tr>
                <td style="color:var(--text2);font-size:11px">${idx+1}</td>
                <td><span class="fn-name">${escapeHTML(fn.name)}</span>${fn.async ? '<span class="fn-async">async</span>' : ''}</td>
                <td><span class="fn-type ${fn.type === 'declaration' ? 'fn-decl' : 'fn-expr'}">${fn.type}</span></td>
                <td><span class="line-num">:${fn.line}</span></td>
              </tr>`).join('')}
            </tbody>
          </table>` : '<div style="color:var(--text2);font-size:13px;padding:8px 0;">কোনো সরাসরি ফাংশন নেই</div>'}

          ${exps.length > 0 ? `
          <div class="section-title" style="margin-top:14px;">🌍 window.* এক্সপোর্ট (${exps.length}টি)</div>
          <div class="export-grid">
            ${exps.map(e => `<span class="export-chip">window.${escapeHTML(e.name)} <span style="color:var(--text2);font-size:10px">:${e.line}</span></span>`).join('')}
          </div>` : ''}

          ${evts.length > 0 ? `
          <div class="section-title" style="margin-top:14px;">👂 Event Listeners (${evts.length}টি)</div>
          <div class="export-grid">
            ${evts.map(e => `<span class="onclick-chip">${escapeHTML(e.event)} :${e.line}</span>`).join('')}
          </div>` : ''}

          ${issues.length > 0 ? `
          <div class="section-title" style="margin-top:14px;color:var(--red);">⚠️ লক্ষণীয় বিষয় (${issues.length}টি)</div>
          <ul class="issue-list">
            ${issues.map(iss => `<li>↳ ${iss.line > 0 ? `লাইন ${iss.line}: ` : ''}${escapeHTML(iss.text)}</li>`).join('')}
          </ul>` : ''}
        </div>
      </div>`;
}).join('')}

      <h2 style="margin:24px 0 16px;font-size:16px;color:var(--purple)">🌐 HTML ফাইল সমূহ</h2>
${htmlFiles.map((f, i) => {
  const a = f.analysis;
  return `
      <div class="file-card" id="htmlfile-${i}">
        <div class="file-card-header" onclick="toggleCard('body-html-${i}', 'icon-html-${i}')">
          <div class="file-path">🌐 ${escapeHTML(f.relativePath)}</div>
          <div class="file-meta">
            <span class="tag tag-html">HTML</span>
            <span class="tag tag-lines">${f.lineCount} লাইন</span>
            <span class="tag tag-size">${formatBytes(f.fileSize)}</span>
            <span class="expand-icon" id="icon-html-${i}">▶</span>
          </div>
        </div>
        <div class="file-card-body" id="body-html-${i}">
          <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
            ${a.inlineScripts > 0 ? `<span class="tag tag-js">📝 ${a.inlineScripts}টি inline script</span>` : ''}
            ${(a.modals||[]).length > 0 ? `<span class="tag tag-html">🪟 ${a.modals.length}টি modal</span>` : ''}
            ${(a.sections||[]).length > 0 ? `<span class="tag tag-lines">📦 ${a.sections.length}টি section</span>` : ''}
          </div>
          ${(a.onclickFunctions||[]).length > 0 ? `
          <div class="section-title">👆 onclick ফাংশন (${a.onclickFunctions.length}টি)</div>
          <div class="onclick-grid">
            ${a.onclickFunctions.map(fn => `<span class="onclick-chip">${escapeHTML(fn)}()</span>`).join('')}
          </div>` : ''}
          ${(a.modals||[]).length > 0 ? `
          <div class="section-title" style="margin-top:12px;">🪟 Modal IDs</div>
          <div class="export-grid">
            ${a.modals.map(m => `<span class="export-chip">#${escapeHTML(m)}</span>`).join('')}
          </div>` : ''}
          ${(a.sections||[]).length > 0 ? `
          <div class="section-title" style="margin-top:12px;">📦 Section IDs</div>
          <div class="export-grid">
            ${a.sections.map(s => `<span class="onclick-chip">#${escapeHTML(s)}</span>`).join('')}
          </div>` : ''}
          ${(a.externalScripts||[]).length > 0 ? `
          <div class="section-title" style="margin-top:12px;">🔗 বাইরের Script</div>
          <div style="font-family:monospace;font-size:12px;color:var(--text2);">
            ${a.externalScripts.map(s => `<div>→ ${escapeHTML(s)}</div>`).join('')}
          </div>` : ''}
        </div>
      </div>`;
}).join('')}
    </div>

    <!-- SEARCH VIEW -->
    <div id="view-search" class="hidden">
      <h2 style="margin-bottom:12px;font-size:16px;color:var(--cyan)">🔍 ফাংশন খুঁজুন</h2>
      <div id="searchResultsContainer" class="search-results"></div>
    </div>

  </div>
</div>

<script>
// ── Data ──────────────────────────────────────────────────
const MASTER = ${JSON.stringify(masterFunctionList)};

// ── View switching ────────────────────────────────────────
function showView(v) {
  document.getElementById('view-all').classList.toggle('hidden', v !== 'all');
  document.getElementById('view-search').classList.toggle('hidden', v !== 'search');
  document.querySelectorAll('.sidebar-item').forEach(b => b.classList.remove('active'));
}

function scrollToFile(id) {
  showView('all');
  setTimeout(function() {
    var el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Auto-open
    var bodyId = id.includes('html') ? id.replace('htmlfile-', 'body-html-') : id.replace('file-', 'body-js-');
    var iconId = id.includes('html') ? id.replace('htmlfile-', 'icon-html-') : id.replace('file-', 'icon-js-');
    var body = document.getElementById(bodyId);
    var icon = document.getElementById(iconId);
    if (body && !body.classList.contains('open')) {
      body.classList.add('open');
      if (icon) { icon.textContent = '▼'; icon.classList.add('open'); }
    }
  }, 50);
}

// ── Card toggle ───────────────────────────────────────────
function toggleCard(bodyId, iconId) {
  var body = document.getElementById(bodyId);
  var icon = document.getElementById(iconId);
  if (!body) return;
  var isOpen = body.classList.toggle('open');
  if (icon) { icon.textContent = isOpen ? '▼' : '▶'; icon.classList.toggle('open', isOpen); }
}

function expandAll() {
  document.querySelectorAll('.file-card-body').forEach(function(el) {
    el.classList.add('open');
  });
  document.querySelectorAll('.expand-icon').forEach(function(el) {
    el.textContent = '▼'; el.classList.add('open');
  });
}

function collapseAll() {
  document.querySelectorAll('.file-card-body').forEach(function(el) {
    el.classList.remove('open');
  });
  document.querySelectorAll('.expand-icon').forEach(function(el) {
    el.textContent = '▶'; el.classList.remove('open');
  });
}

// ── Search ────────────────────────────────────────────────
function doSearch(query) {
  var typeFilter = document.getElementById('searchType').value;
  query = (query || '').toLowerCase().trim();

  if (!query) {
    document.getElementById('searchCount').textContent = '';
    showView('all');
    return;
  }
  showView('search');

  var results = MASTER.filter(function(fn) {
    var nameMatch = fn.name.toLowerCase().includes(query);
    var typeMatch = typeFilter === 'all' || fn.type === typeFilter;
    return nameMatch && typeMatch;
  });

  document.getElementById('searchCount').textContent = results.length + 'টি পাওয়া গেছে';

  var container = document.getElementById('searchResultsContainer');
  if (results.length === 0) {
    container.innerHTML = '<div style="color:var(--text2);padding:20px;text-align:center;">কোনো ফলাফল পাওয়া যায়নি</div>';
    return;
  }

  container.innerHTML = results.map(function(fn) {
    var typeClass = fn.type === 'declaration' ? 'fn-decl' : fn.type === 'expression' ? 'fn-expr' : 'fn-window';
    return '<div class="search-result-item">' +
      '<span class="sr-name">' + fn.name + (fn.async ? ' <span class="fn-async">async</span>' : '') + '</span>' +
      '<span class="sr-file">📄 ' + fn.file + '</span>' +
      '<span class="fn-type ' + typeClass + '" style="font-size:11px;padding:2px 7px;border-radius:10px;">' + fn.type + '</span>' +
      '<span class="sr-line">:' + fn.line + '</span>' +
      '</div>';
  }).join('');
}

// ── Keyboard shortcut ─────────────────────────────────────
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault();
    var inp = document.getElementById('searchInput');
    inp.focus(); inp.select();
  }
  if (e.key === 'Escape') {
    document.getElementById('searchInput').value = '';
    doSearch('');
  }
});

console.log('🗺️ Wings Fly Academy Project Map লোড হয়েছে। মোট ফাংশন:', ${masterFunctionList.length});
</script>
</body>
</html>`;

// ── ফাইল লেখো ──────────────────────────────────────────────
fs.writeFileSync(OUTPUT_FILE, html, 'utf8');

console.log('\n' + C.bold + C.green + '✅ সফলভাবে তৈরি হয়েছে!' + C.reset);
console.log(C.cyan + `📄 ফাইল: ${OUTPUT_FILE}` + C.reset);
console.log(C.yellow + `📊 মোট ফাংশন: ${masterFunctionList.length}` + C.reset);
console.log(C.green + '\n👉 এখন PROJECT_MAP.html ব্রাউজারে খুলুন!\n' + C.reset);

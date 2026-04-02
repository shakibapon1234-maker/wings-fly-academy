const fs = require('fs');
const path = require('path');

// ── কনফিগ ──────────────────────────────────────────────────
const ROOT_DIR = __dirname; 
const EXTENSIONS = ['.js', '.html'];
const SKIP_DIRS = ['node_modules', '.git', '_PROJECT_BACKUPS', 'archive', '.vscode', '.agent', '.settings'];
const SKIP_FILES = ['SCAN_PROJECT.js', 'AUTO_MAP_WATCHER.js'];

// Keywords for auto-categorization
const SYNC_KEYWORDS = ['sync', 'supabase', 'cloud', 'backup', 'restore', 'offline', 'online', 'snapshot', 'diagnostic', 'upload', 'download', 'push', 'pull', 'network'];
const PAYMENT_KEYWORDS = ['finance', 'salary', 'pay', 'ledger', 'loan', 'fee', 'profit', 'cash', 'amount', 'transaction', 'trx', 'collection', 'expense', 'balance', 'revenue', 'due', 'voucher'];

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', cyan: '\x1b[36m',
  yellow: '\x1b[33m', red: '\x1b[31m', bold: '\x1b[1m', purple: '\x1b[35m'
};

function hasKeyword(text, keywords) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

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
      if (EXTENSIONS.includes(ext) && !SKIP_FILES.includes(item)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function analyzeJS(content, fileName) {
  const results = { functions: [], windowExports: [], eventListeners: [], issues: [] };
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const trimmed = line.trim();

    const pushFn = (name, type, async) => {
      results.functions.push({ 
        name, line: lineNum, type, async,
        isSync: hasKeyword(name, SYNC_KEYWORDS),
        isPayment: hasKeyword(name, PAYMENT_KEYWORDS)
      });
    };

    const pushWin = (name) => {
      results.windowExports.push({ 
        name, line: lineNum, type: 'window.export',
        isSync: hasKeyword(name, SYNC_KEYWORDS),
        isPayment: hasKeyword(name, PAYMENT_KEYWORDS)
      });
    };

    const fnDecl = trimmed.match(/^(?:async\s+)?function\s+(\w+)\s*\(/);
    if (fnDecl) pushFn(fnDecl[1], 'declaration', trimmed.startsWith('async'));

    const fnExpr = trimmed.match(/^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\(|[\w]+\s*=>)/);
    if (fnExpr) pushFn(fnExpr[1], 'expression', trimmed.includes('async'));

    const winFn = trimmed.match(/^window\.(\w+)\s*=\s*(?:async\s+)?function/);
    if (winFn) pushWin(winFn[1]);

    const winArrow = trimmed.match(/^window\.(\w+)\s*=\s*(?:async\s+)?\(/);
    if (winArrow && trimmed.includes('=>')) pushWin(winArrow[1]);

    const evtMatch = trimmed.match(/addEventListener\s*\(\s*['"](\w+)['"]/);
    if (evtMatch) {
      results.eventListeners.push({ 
        event: evtMatch[1], line: lineNum,
        isSync: hasKeyword(evtMatch[1], SYNC_KEYWORDS),
        isPayment: hasKeyword(evtMatch[1], PAYMENT_KEYWORDS)
      });
    }

    if (trimmed.includes('console.error') || trimmed.includes('throw new Error')) {
      results.issues.push({ line: lineNum, text: trimmed.substring(0, 80) });
    }
  });

  return results;
}

function analyzeHTML(content) {
  const results = { inlineScripts: 0, onclickFunctions: [] };
  results.inlineScripts = (content.match(/<script(?!\s+src)[^>]*>/gi) || []).length;
  
  const onclickMatches = content.matchAll(/onclick\s*=\s*["']([^"']+)["']/gi);
  for (const m of onclickMatches) {
    const fn = m[1].split('(')[0].trim();
    if (!results.onclickFunctions.some(o => o.name === fn)) {
      results.onclickFunctions.push({
        name: fn,
        isSync: hasKeyword(fn, SYNC_KEYWORDS),
        isPayment: hasKeyword(fn, PAYMENT_KEYWORDS)
      });
    }
  }
  return results;
}

function generateHTMLReport(fileData, mapType, title, accentColor) {
  const reportDate = new Date().toLocaleString('bn-BD', { dateStyle: 'full', timeStyle: 'short' });
  
  // Filter Data Source based on Map Type
  let displayFiles = [];
  let masterList = [];

  for (const f of fileData) {
    let includeFile = false;
    let filteredFns = [];
    let filteredWin = [];
    let filteredEvts = [];
    let filteredOnclicks = [];

    if (mapType === 'ALL') {
      includeFile = true;
      if(f.ext === '.js') {
        filteredFns = f.analysis.functions || [];
        filteredWin = f.analysis.windowExports || [];
        filteredEvts = f.analysis.eventListeners || [];
      } else {
        filteredOnclicks = f.analysis.onclickFunctions || [];
      }
    } else {
      // Check specific conditions
      const keywordCheck = mapType === 'SYNC' ? f.isSyncFile : f.isPaymentFile;
      
      if (f.ext === '.js') {
        filteredFns = f.analysis.functions.filter(fn => mapType === 'SYNC' ? fn.isSync : fn.isPayment);
        filteredWin = f.analysis.windowExports.filter(fn => mapType === 'SYNC' ? fn.isSync : fn.isPayment);
        filteredEvts = f.analysis.eventListeners.filter(e => mapType === 'SYNC' ? e.isSync : e.isPayment);
        
        if (keywordCheck || filteredFns.length > 0 || filteredWin.length > 0 || filteredEvts.length > 0) {
          includeFile = true;
          // If the file itself is marked via name, show EVERYTHING
          if(keywordCheck) {
            filteredFns = f.analysis.functions;
            filteredWin = f.analysis.windowExports;
            filteredEvts = f.analysis.eventListeners;
          }
        }
      } else if (f.ext === '.html') {
        filteredOnclicks = f.analysis.onclickFunctions.filter(fn => mapType === 'SYNC' ? fn.isSync : fn.isPayment);
        if (keywordCheck || filteredOnclicks.length > 0) {
          includeFile = true;
          if(keywordCheck) {
            filteredOnclicks = f.analysis.onclickFunctions;
          }
        }
      }
    }

    if (includeFile) {
      // Clone for safety to not mutate original dataset during render
      const cloneFile = { ...f, renderFns: filteredFns, renderWin: filteredWin, renderEvts: filteredEvts, renderOnclicks: filteredOnclicks };
      displayFiles.push(cloneFile);
      
      filteredFns.forEach(fn => masterList.push({ file: f.relativePath, ...fn }));
      filteredWin.forEach(fn => masterList.push({ file: f.relativePath, ...fn }));
    }
  }

  const jsFiles = displayFiles.filter(f => f.ext === '.js');
  const htmlFiles = displayFiles.filter(f => f.ext === '.html');
  const totalFns = jsFiles.reduce((s, f) => s + f.renderFns.length, 0);
  const totalWin = jsFiles.reduce((s, f) => s + f.renderWin.length, 0);

  function escapeHTML(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B'; return (bytes / 1024).toFixed(1) + ' KB';
  }

  let html = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>🗺️ ${title} — Wings Fly</title>
<style>
  :root {
    --bg: #0a0e27; --bg2: #111630; --bg3: #161c3a;
    --accent: ${accentColor}; --cyan: #00d9ff; --purple: #b537f2; --pink: #ff2d95;
    --green: #00ff88; --yellow: #ffd600; --red: #ff4d4d;
    --text: #c8d0f0; --text2: #8890b0;
    --border: rgba(255,255,255,0.1);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg); color: var(--text); font-family: 'Segoe UI', monospace; font-size: 14px; }
  .header { border-bottom: 2px solid var(--accent); padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #0d1b4b, #1a0a3d); }
  .header h1 { font-size: 22px; color: var(--accent); }
  .stats-bar { display: flex; gap: 12px; padding: 16px 30px; background: var(--bg2); border-bottom: 1px solid var(--border); }
  .stat-card { background: var(--bg3); border: 1px solid var(--border); border-radius: 10px; padding: 10px 18px; text-align: center; }
  .stat-card .num { font-size: 24px; font-weight: 700; color: var(--accent); }
  .stat-card .lbl { font-size: 11px; color: var(--text2); margin-top: 2px; }
  .search-bar { padding: 14px 30px; background: var(--bg2); border-bottom: 1px solid var(--border); display: flex; gap: 10px; }
  .search-bar input { flex: 1; background: var(--bg3); border: 1px solid var(--accent); color: var(--text); border-radius: 8px; padding: 8px 14px; outline: none; }
  .main { display: flex; height: calc(100vh - 180px); }
  .content { flex: 1; overflow-y: auto; padding: 20px 30px; }
  .file-card { background: var(--bg2); border: 1px solid var(--border); border-radius: 12px; margin-bottom: 18px; }
  .file-card-header { padding: 14px 18px; background: var(--bg3); border-bottom: 1px solid var(--border); cursor: pointer; display: flex; justify-content: space-between;}
  .file-path { font-family: monospace; font-size: 13px; color: var(--accent); font-weight:bold; }
  .tag { padding: 2px 9px; border-radius: 12px; font-size: 11px; margin-left: 6px; border: 1px solid rgba(255,255,255,0.2) }
  .file-card-body { padding: 14px 18px; display: none; } .file-card-body.open { display: block; }
  .fn-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom:12px; }
  .fn-table th { text-align: left; padding: 6px; color:var(--text2); font-size:11px; border-bottom:1px solid var(--border); }
  .fn-table td { padding: 6px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .fn-name { color: #fff; font-family: monospace; }
  .line-num { color: var(--text2); font-size: 12px; font-family: monospace; }
  .sr-item { background: var(--bg3); padding:8px; margin-bottom:4px; border-radius:4px; display:flex; justify-content:space-between}
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 3px; }
</style>
</head>
<body>
<div class="header">
  <div><h1>${title}</h1><div style="color:var(--text2);font-size:13px;">Auto-Updating Project Monitor</div></div>
  <div style="font-size:12px;color:var(--text2);text-align:right;">📅 ${reportDate}</div>
</div>
<div class="stats-bar">
  <div class="stat-card"><div class="num">${displayFiles.length}</div><div class="lbl">Total Files Matched</div></div>
  <div class="stat-card"><div class="num">${jsFiles.length}</div><div class="lbl">JS Files</div></div>
  <div class="stat-card"><div class="num">${totalFns + totalWin}</div><div class="lbl">Functions Included</div></div>
  <div class="stat-card" style="margin-left:auto;border-color:var(--accent)"><div class="num" style="font-size:14px;padding-top:10px;">🟢 Live Watcher Active</div></div>
</div>
<div class="search-bar">
  <input type="text" id="s" placeholder="🔍 Search functions in this map..." oninput="search(this.value)">
  <button onclick="document.querySelectorAll('.file-card-body').forEach(e=>e.classList.add('open'))" style="padding:6px 12px;border-radius:6px;background:var(--bg3);color:white;border:1px solid var(--border)">Expand All</button>
</div>
<div class="main">
  <div class="content" id="view-files">
${jsFiles.map((f, i) => `
    <div class="file-card">
      <div class="file-card-header" onclick="document.getElementById('b-js-${i}').classList.toggle('open')">
        <div class="file-path">📄 ${escapeHTML(f.relativePath)}</div>
        <div>
          <span class="tag">JS</span>
          <span class="tag">${f.renderFns.length + f.renderWin.length} fn</span>
          <span class="tag">${formatBytes(f.fileSize)}</span>
        </div>
      </div>
      <div class="file-card-body" id="b-js-${i}">
        ${f.renderFns.length > 0 ? `
        <table class="fn-table">
          <thead><tr><th>Function Name</th><th>Type</th><th>Line</th></tr></thead>
          <tbody>${f.renderFns.map(fn => `<tr>
            <td><span class="fn-name">${escapeHTML(fn.name)}</span></td>
            <td style="color:var(--text2);font-size:11px">${fn.type}</td>
            <td class="line-num">:${fn.line}</td>
          </tr>`).join('')}</tbody>
        </table>` : ''}
        
        ${f.renderWin.length > 0 ? `
        <div style="font-size:12px;color:var(--text2);margin-bottom:4px;">window.* Exports</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
          ${f.renderWin.map(w => `<span class="tag" style="border-color:var(--pink);color:var(--pink)">window.${w.name} :${w.line}</span>`).join('')}
        </div>` : ''}
      </div>
    </div>`).join('')}

${htmlFiles.length > 0 ? `<h2 style="margin:20px 0;color:var(--accent);font-size:16px;">HTML Files matches</h2>` : ''}
${htmlFiles.map((f, i) => `
    <div class="file-card">
      <div class="file-card-header" onclick="document.getElementById('b-h-${i}').classList.toggle('open')">
        <div class="file-path">🌐 ${escapeHTML(f.relativePath)}</div>
        <span class="tag">HTML</span>
      </div>
      <div class="file-card-body" id="b-h-${i}">
        ${f.renderOnclicks.length > 0 ? `
        <div style="font-size:12px;color:var(--text2);margin-bottom:4px;">onclick events</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          ${f.renderOnclicks.map(w => `<span class="tag" style="border-color:var(--purple);color:var(--purple)">${w.name}()</span>`).join('')}
        </div>` : '<div style="color:gray;font-size:12px;">Matched via filename</div>'}
      </div>
    </div>`).join('')}
  </div>
  
  <div class="content" id="view-search" style="display:none;"></div>
</div>

<script>
const MASTER = ${JSON.stringify(masterList)};
function search(q) {
  q = q.toLowerCase();
  const vF = document.getElementById('view-files');
  const vS = document.getElementById('view-search');
  if(!q) { vF.style.display='block'; vS.style.display='none'; return; }
  
  vF.style.display='none'; vS.style.display='block';
  const matches = MASTER.filter(m => m.name.toLowerCase().includes(q));
  vS.innerHTML = matches.map(m => '<div class="sr-item"><span><strong style="color:var(--accent)">'+m.name+'</strong> <span style="font-size:11px;color:gray">'+m.type+'</span></span> <span>'+m.file+' :'+m.line+'</span></div>').join('');
}
</script>
</body></html>`;

  return html;
}

// ── প্রধান স্ক্যানার ইঞ্জিন ──────────────────────────────────────────────
let isScanning = false;

function runScan() {
  if (isScanning) return;
  isScanning = true;
  
  const startTime = Date.now();
  console.log(`\n${C.yellow}🔄 Scanning Wings Fly Project Maps...${C.reset}`);

  const allFiles = getAllFiles(ROOT_DIR);
  const fileData = [];

  for (const filePath of allFiles) {
    const relativePath = path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
    const ext = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    // Check keyword flags at File level
    const isSyncFile = hasKeyword(fileName, SYNC_KEYWORDS);
    const isPaymentFile = hasKeyword(fileName, PAYMENT_KEYWORDS);

    let content = '';
    try { content = fs.readFileSync(filePath, 'utf8'); } catch (e) { continue; }
    const fileSize = Buffer.byteLength(content, 'utf8');

    let analysis = {};
    if (ext === '.js') analysis = analyzeJS(content, fileName);
    else if (ext === '.html') analysis = analyzeHTML(content);

    fileData.push({ relativePath, fileName, ext, fileSize, isSyncFile, isPaymentFile, analysis });
  }

  // Generate the 3 Maps
  fs.writeFileSync(path.join(ROOT_DIR, 'PROJECT_MAP.html'), generateHTMLReport(fileData, 'ALL', '🗺️ Project Full Map', '#00d9ff'), 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, 'SYNC_MAP.html'), generateHTMLReport(fileData, 'SYNC', '☁️ Synchronization Hub', '#b537f2'), 'utf8');
  fs.writeFileSync(path.join(ROOT_DIR, 'PAYMENT_MAP.html'), generateHTMLReport(fileData, 'PAYMENT', '💰 Payment & Finance Hub', '#00ff88'), 'utf8');

  const duration = Date.now() - startTime;
  console.log(`${C.green}✅ All Maps updated successfully in ${duration}ms!${C.reset}`);
  console.log(`  📄 PROJECT_MAP.html (Full Project)`);
  console.log(`  📄 SYNC_MAP.html (Sync Engine isolated)`);
  console.log(`  📄 PAYMENT_MAP.html (Finance & Payment isolated)`);
  
  setTimeout(() => { isScanning = false; }, 500); // 500ms debounce buffer
}

// === RUN INITIAL SCAN ===
runScan();

// === START FS WATCHER ===
console.log(`\n${C.bold}${C.cyan}👀 Watcher Started! Monitoring project for changes...${C.reset}`);
console.log(`${C.purple}Press Ctrl+C to stop the watcher.${C.reset}\n`);

let timeout = null;
fs.watch(ROOT_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  const ext = path.extname(filename).toLowerCase();
  
  // Ignore skipped directories/extensions
  if (SKIP_DIRS.some(d => filename.includes(d))) return;
  if (!EXTENSIONS.includes(ext)) return;
  if (SKIP_FILES.includes(path.basename(filename))) return;

  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    console.log(`${C.cyan}🔔 File Change Detected: ${filename}${C.reset}`);
    runScan();
  }, 200); // 200ms debounce
});

# ============================================================
# Wings Fly Academy - Auto Deploy Script
# এটা রান করলে version আপডেট হবে + GitHub push হবে
# ============================================================

Write-Host "🚀 Wings Fly Academy - Auto Deploy শুরু হচ্ছে..." -ForegroundColor Cyan

# ── Step 1: Timestamp version তৈরি ──────────────────────────
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
Write-Host "📅 Version: $timestamp" -ForegroundColor Yellow

# ── Step 2: index.html-এ সব version আপডেট ──────────────────
$indexPath = "index.html"

if (Test-Path $indexPath) {
    $content = Get-Content $indexPath -Raw -Encoding UTF8

    # সব JS/CSS ফাইলের version replace করো
    $content = $content -replace 'styles\.css\?v=[^"'']+',          "styles.css?v=$timestamp"
    $content = $content -replace 'supabase-sync-SMART-V30\.js\?v=[^"'']+', "supabase-sync-SMART-V30.js?v=$timestamp"
    $content = $content -replace 'app\.js\?v=[^"'']+',              "app.js?v=$timestamp"
    $content = $content -replace 'auto-test\.js\?v=[^"'']+',        "auto-test.js?v=$timestamp"

    # sections ফোল্ডারের ফাইলগুলোও আপডেট করো
    $content = $content -replace '(sections/[^"'']+\.js)\?v=[^"'']+', "`$1?v=$timestamp"
    $content = $content -replace '(sections/[^"'']+\.css)\?v=[^"'']+', "`$1?v=$timestamp"

    $content | Set-Content $indexPath -Encoding UTF8
    Write-Host "✅ index.html version আপডেট হয়েছে" -ForegroundColor Green
} else {
    Write-Host "❌ index.html পাওয়া যায়নি!" -ForegroundColor Red
    exit 1
}

# ── Step 3: Git add, commit, push ───────────────────────────
Write-Host "📤 GitHub-এ push হচ্ছে..." -ForegroundColor Cyan

git add -A
git commit -m "deploy: cache bust v$timestamp"
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅✅ Deploy সফল! Version: $timestamp" -ForegroundColor Green
    Write-Host "⏳ ৩০-৬০ সেকেন্ড পর সাইট reload করুন।" -ForegroundColor Yellow
    Write-Host "🌐 https://shakibapon1234-maker.github.io/wings-fly-academy/" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed! Git error হয়েছে।" -ForegroundColor Red
}

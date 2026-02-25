@echo off
chcp 65001 >nul
title Wings Fly Academy - Auto Deploy
color 0B

echo.
echo  ==========================================
echo   Wings Fly Aviation Academy
echo   Auto Deploy - GitHub Pages
echo  ==========================================
echo.

REM ── Project folder-এ যাও ──────────────────
cd /d "D:\wings-fly-academy"

if errorlevel 1 (
    echo  [ERROR] D:\wings-fly-academy folder পাওয়া যায়নি!
    echo  এই .bat ফাইলটা D:\wings-fly-academy ফোল্ডারে রাখুন।
    pause
    exit /b 1
)

echo  [OK] Folder: %CD%
echo.

REM ── Timestamp version তৈরি করো ───────────
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set dt=%%a
set TIMESTAMP=%dt:~0,8%_%dt:~8,4%

echo  [INFO] Version: %TIMESTAMP%
echo.

REM ── index.html-এ version আপডেট করো ───────
echo  [INFO] Cache version আপডেট হচ্ছে...

powershell -NoProfile -Command ^
  "(Get-Content 'index.html' -Raw -Encoding UTF8) ^
   -replace 'app\.js\?v=[^\"'']+', 'app.js?v=%TIMESTAMP%' ^
   -replace 'styles\.css\?v=[^\"'']+', 'styles.css?v=%TIMESTAMP%' ^
   -replace 'supabase-sync-SMART-V30\.js\?v=[^\"'']+', 'supabase-sync-SMART-V30.js?v=%TIMESTAMP%' ^
   -replace 'auto-test\.js\?v=[^\"'']+', 'auto-test.js?v=%TIMESTAMP%' ^
   | Set-Content 'index.html' -Encoding UTF8"

echo  [OK] index.html version আপডেট হয়েছে
echo.

REM ── Git: add, commit, push ────────────────
echo  [INFO] GitHub-এ push হচ্ছে...
echo.

git add -A
git commit -m "deploy: cache bust v%TIMESTAMP%"
git push origin main

if errorlevel 1 (
    echo.
    echo  [ERROR] Push failed! Git সমস্যা হয়েছে।
    echo  GitHub Desktop দিয়ে manually push করুন।
    pause
    exit /b 1
)

echo.
echo  ==========================================
echo   Deploy সফল হয়েছে!
echo   Version: %TIMESTAMP%
echo  ==========================================
echo.
echo  30-60 সেকেন্ড পর সাইট Reload করুন:
echo  https://shakibapon1234-maker.github.io/wings-fly-academy/
echo.
echo  Browser-এ Hard Refresh দিন: Ctrl + Shift + R
echo.
pause

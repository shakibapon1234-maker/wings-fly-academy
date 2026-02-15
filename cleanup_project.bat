@echo off
title Wings Fly Project Cleanup
echo Cleaning up unnecessary files...
setlocal enabledelayedexpansion

:: Create Backup Directory
if not exist "Project_Backup" mkdir "Project_Backup"

:: List of essential files to KEEP (Do NOT move these)
:: index.html, app.js, firebase_manager.js, logos.js, styles.css, 
:: exam_management.js, batch_report.js, visitor_management.js, 
:: search_enhancements.js, firebase_setup.js, README_BANGLA.md,
:: logo.jpg.jpeg, wings_logo_linear.png, wings_logo_premium.png,
:: firebase.json, .firebaserc, firestore.rules, storage.rules, package.json

echo Moving documentation and old fix scripts...
:: Move all .md files except README_BANGLA.md
for %%f in (*.md) do (
    if /I NOT "%%f"=="README_BANGLA.md" move "%%f" "Project_Backup\"
)

:: Move all .txt files
for %%f in (*.txt) do (
    move "%%f" "Project_Backup\"
)

:: Move all Python scripts
move "*.py" "Project_Backup\" 2>nul

:: Move old HTML snippets and temporary scripts
move "bank-accounts-table.html" "Project_Backup\" 2>nul
move "cleanup.html" "Project_Backup\" 2>nul
move "cleanup_script.js" "Project_Backup\" 2>nul
move "encoding-fix.js" "Project_Backup\" 2>nul
move "exam_sections.html" "Project_Backup\" 2>nul
move "fixed-student-registration-form.html" "Project_Backup\" 2>nul
move "fixed-student-registration-form.html.txt" "Project_Backup\" 2>nul
move "mobile_banking_section.html" "Project_Backup\" 2>nul
move "scan_mangled.js" "Project_Backup\" 2>nul
move "set_reminder_test.js" "Project_Backup\" 2>nul
move "student-form-with-photo.html" "Project_Backup\" 2>nul
move "test_reminder.html" "Project_Backup\" 2>nul
move "index.html.backup" "Project_Backup\" 2>nul
move "index_RESTORE_POINT.html" "Project_Backup\" 2>nul

:: Move specific junk JS files
move "DIAGNOSTIC_TEST.js" "Project_Backup\" 2>nul
move "IMMEDIATE_FIX.js" "Project_Backup\" 2>nul
move "encoding-fix.js" "Project_Backup\" 2>nul
move "fix_cloud_encoding.js" "Project_Backup\" 2>nul
move "fix_emojis.js" "Project_Backup\" 2>nul
move "fix_encoding_v2.js" "Project_Backup\" 2>nul
move "fix_final.js" "Project_Backup\" 2>nul
move "fix_lines.js" "Project_Backup\" 2>nul

echo.
echo Cleanup Complete! Your main files are safe.
echo Look into "Project_Backup" folder if you need any old files.
pause

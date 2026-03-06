@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion
title Wings Fly Academy - Branch Manager (v32-Dev)
mode con: cols=95 lines=35
color 0E

:: Set project path
set "PROJECT_DIR=D:\wings-fly-academy"
set "DEV_BRANCH=dev-smart-payroll-v32"

:MENU
cls
echo ===========================================================================================
echo             WINGS FLY ACADEMY - BRANCH ^& DEVELOPMENT MANAGER
echo ===========================================================================================
echo  LOCATION: %PROJECT_DIR%
cd /d "%PROJECT_DIR%"
for /f "tokens=*" %%i in ('git branch --show-current') do set CUR_BRANCH=%%i
echo  CURRENT ACTIVE BRANCH: [!CUR_BRANCH!]
echo ===========================================================================================
echo.
echo  [1] Switch to MAIN (নিরাপদ / আগের অবস্থায় ফিরে যাওয়া)
echo  [2] Switch to DEV (নতুন ফিচার / Payroll, Analytics টেস্ট করা)
echo  [3] Merge DEV to MAIN (নতুন ফিচারগুলো পার্মানেন্টলি মেইন ফোল্ডারে আনা)
echo  [4] Reset Local Changes (ভুল হলে সব মুছে আগের অবস্থায় ফিরে যাওয়া)
echo  [5] Check Status ^& Branches (অবস্থা পরীক্ষা করা)
echo  [6] Open in Browser (ব্রাঞ্চের কাজ দেখা)
echo  [7] Exit
echo.
echo ===========================================================================================
set /p choice="Enter your choice (1-7): "

if "%choice%"=="1" goto SWITCH_MAIN
if "%choice%"=="2" goto SWITCH_DEV
if "%choice%"=="3" goto MERGE_DEV
if "%choice%"=="4" goto RESET_LOCAL
if "%choice%"=="5" goto CHECK_STATUS
if "%choice%"=="6" goto OPEN_BROWSER
if "%choice%"=="7" exit
goto MENU

:SWITCH_MAIN
cls
echo Switching to Main...
git checkout main
echo.
pause
goto MENU

:SWITCH_DEV
cls
echo Switching to Development Branch...
git checkout %DEV_BRANCH%
echo.
pause
goto MENU

:MERGE_DEV
cls
echo ===========================================================================================
echo             MERGING DEVELOPMENT INTO MAIN (Danger!)
echo ===========================================================================================
echo.
echo এটি করলে DEV ব্রাঞ্চের সব নতুন কোড MAIN এ পাকাপাকিভাবে যোগ হবে।
set /p confirm="Are you sure? (Y/N): "
if /i "%confirm%" neq "Y" goto MENU

echo.
echo [1/3] Switching to Main...
git checkout main
echo [2/3] Merging changes...
git merge %DEV_BRANCH%
echo [3/3] Finalizing...
git add .
git commit -m "Merged %DEV_BRANCH% into main"
echo.
echo ===========================================================================================
echo        SUCCESS: New features are now in the MAIN branch!
echo ===========================================================================================
pause
goto MENU

:RESET_LOCAL
cls
echo ===========================================================================================
echo             RESETTING ALL LOCAL CHANGES
echo ===========================================================================================
echo.
echo এটি করলে আপনার সকল অসংরক্ষিত পরিবর্তন মুছে যাবে।
set /p confirm="Confirm Reset? (Y/N): "
if /i "%confirm%" neq "Y" goto MENU
git reset --hard
git clean -fd
echo Project Reset Complete.
pause
goto MENU

:CHECK_STATUS
cls
echo Status:
git status
echo.
echo Branch List:
git branch
echo.
pause
goto MENU

:OPEN_BROWSER
start "" "%PROJECT_DIR%\index.html"
goto MENU

@echo off
echo ====================================
echo Wings Fly Aviation Academy
echo Quick Firebase Deploy
echo ====================================
echo.

REM Change to your project directory
REM Update this path to match your actual project location
cd /d "%~dp0"

echo Current Directory: %CD%
echo.
echo Deploying to Firebase Hosting...
echo.

REM Deploy to Firebase
firebase deploy --only hosting

echo.
echo ====================================
echo Deploy Complete!
echo ====================================
echo.
echo Website: https://wings-fly-aviation-academy.web.app
echo.
pause

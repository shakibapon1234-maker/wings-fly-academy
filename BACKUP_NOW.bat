@echo off
title Wings Fly - Project Backup
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0BACKUP_PROJECT.ps1"
pause

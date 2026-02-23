# ====================================================================
# WINGS FLY AVIATION ACADEMY - FULL PROJECT BACKUP SCRIPT
# This script creates a ZIP of the entire project (Code + Data)
# ====================================================================

$projectName = "WingsFly_Aviation"
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupFolderName = "_PROJECT_BACKUPS"
$backupPath = Join-Path -Path $PSScriptRoot -ChildPath $backupFolderName
$zipFileName = "${projectName}_Full_Backup_${timestamp}.zip"
$destinationFile = Join-Path -Path $backupPath -ChildPath $zipFileName

# 1. Create backup folder if not exists
if (-not (Test-Path -Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath
    Write-Host "📁 Created backup directory: $backupPath" -ForegroundColor Cyan
}

# 2. Define things to exclude (Hidden folders, logs, etc)
$excludeList = @(".git", ".gemini", "_PROJECT_BACKUPS", "node_modules", ".vscode")

Write-Host "🚀 Starting Full Project Backup..." -ForegroundColor Green
Write-Host "📦 Destination: $destinationFile" -ForegroundColor Yellow

# 3. Zip the project
try {
    # Get all files except excluded ones
    $filesToZip = Get-ChildItem -Path $PSScriptRoot -Exclude $excludeList -Recurse
    
    Compress-Archive -Path $PSScriptRoot\* -DestinationPath $destinationFile -CompressionLevel Optimal -Exclude $excludeList -Force
    
    $fileSize = (Get-Item $destinationFile).Length / 1MB
    Write-Host "✅ Backup Complete! Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
    Write-Host "📂 Folder: $backupPath" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Backup Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPress any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

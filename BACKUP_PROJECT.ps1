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
    New-Item -ItemType Directory -Path $backupPath | Out-Null
    Write-Host "[WAIT] Created backup directory: $backupPath" -ForegroundColor Cyan
}

# 2. Define things to exclude (Hidden folders, logs, etc)
$excludeList = @(".git", ".gemini", "_PROJECT_BACKUPS", "node_modules", ".vscode")

Write-Host "==============================================="
Write-Host "[START] Zipping Project... Please wait." -ForegroundColor Green
Write-Host "[INFO] Destination: $destinationFile" -ForegroundColor Yellow
Write-Host "==============================================="

# 3. Zip the project
try {
    # It's better to pass explicitly resolved items or use a simpler Compression command
    Get-ChildItem -Path $PSScriptRoot -Exclude $excludeList | 
        Compress-Archive -DestinationPath $destinationFile -CompressionLevel Optimal -Force -ErrorAction Stop
    
    $fileSize = (Get-Item $destinationFile).Length / 1MB
    Write-Host "`n[SUCCESS] Backup Complete! Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
    Write-Host "[INFO] Folder: $backupPath" -ForegroundColor Cyan
    
    # 4. Cleanup old backups (Keep only the 10 most recent ones)
    $MaxBackupsToKeep = 10
    $zipFiles = Get-ChildItem -Path $backupPath -Filter "*.zip" | Sort-Object CreationTime -Descending
    if ($zipFiles.Count -gt $MaxBackupsToKeep) {
        $filesToDelete = $zipFiles | Select-Object -Skip $MaxBackupsToKeep
        foreach ($file in $filesToDelete) {
            Remove-Item $file.FullName -Force
            Write-Host "[CLEANUP] Deleted old backup: $($file.Name)" -ForegroundColor DarkGray
        }
    }
}
catch {
    Write-Host "`n[ERROR] Backup Failed!" -ForegroundColor Red
    Write-Host "Reason: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPress any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

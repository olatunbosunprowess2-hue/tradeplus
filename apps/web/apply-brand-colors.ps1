# Safe Brand Color Migration

$ErrorActionPreference = "Stop"

Write-Host "Starting safe brand color migration..." -ForegroundColor Cyan

# Define color mappings (reverse of what we did before)
$colorMappings = @{
    # Gradient combinations (must be first)
    'from-blue-600 to-indigo-600' = 'from-primary to-primary-dark'
    'from-blue-400 to-blue-600'   = 'from-primary-light to-primary'
    'from-blue-50 to-indigo-100'  = 'from-primary-pale to-primary-light'
    
    # Compound classes (order matters - specific before general)
    'hover:bg-blue-700'           = 'hover:bg-primary-dark'
    'hover:text-blue-700'         = 'hover:text-primary-dark'
    'hover:bg-blue-50'            = 'hover:bg-primary-pale'
    'hover:text-blue-600'         = 'hover:text-primary'
    'focus:ring-blue-500'         = 'focus:ring-primary'
    'focus:border-blue-500'       = 'focus:border-primary'
    
    # Specific variants
    'bg-blue-700'                 = 'bg-primary-dark'
    'bg-blue-800'                 = 'bg-primary-dark'
    'text-blue-800'               = 'text-primary-dark'
    'text-blue-700'               = 'text-primary-dark'
    'bg-blue-50'                  = 'bg-primary-pale'
    'text-blue-50'                = 'text-primary-pale'
    'border-blue-200'             = 'border-primary-light'
    'border-blue-500'             = 'border-primary'
    
    # Base classes (last)
    'bg-blue-600'                 = 'bg-primary'
    'text-blue-600'               = 'text-primary'
    'border-blue-600'             = 'border-primary'
}

# Get all TSX files
$files = Get-ChildItem -Path "components", "app" -Recurse -Filter *.tsx -File
$totalFiles = $files.Count
$processedFiles = 0
$modifiedFiles = 0

Write-Host "Found $totalFiles files to process" -ForegroundColor Yellow

foreach ($file in $files) {
    $processedFiles++
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    
    Write-Progress -Activity "Processing files" -Status "$processedFiles of $totalFiles" -PercentComplete (($processedFiles / $totalFiles) * 100)
    
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction Stop
        $originalContent = $content
        $fileModified = $false
        
        # Apply each color mapping
        foreach ($oldColor in $colorMappings.Keys) {
            $newColor = $colorMappings[$oldColor]
            if ($content -match [regex]::Escape($oldColor)) {
                $content = $content -replace [regex]::Escape($oldColor), $newColor
                $fileModified = $true
            }
        }
        
        # Only write if content changed
        if ($fileModified) {
            Set-Content -Path $file.FullName -Value $content -NoNewline -ErrorAction Stop
            $modifiedFiles++
            Write-Host "  Modified: $relativePath" -ForegroundColor Green
        }
        
    }
    catch {
        Write-Host "  Error processing $relativePath : $_" -ForegroundColor Red
        # Continue with other files even if one fails
    }
}

Write-Progress -Activity "Processing files" -Completed

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "  Total files scanned: $totalFiles" -ForegroundColor White
Write-Host "  Files modified: $modifiedFiles" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. The dev server will auto-reload" -ForegroundColor White
Write-Host "2. Check the browser to verify all UI elements are visible" -ForegroundColor White
Write-Host "3. If any issues we can quickly revert" -ForegroundColor White

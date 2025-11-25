$files = Get-ChildItem -Path "components", "app" -Recurse -Include *.tsx, *.ts -File

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Replace gradient combinations first
    $content = $content -replace 'from-primary to-primary-dark', 'from-blue-600 to-indigo-600'
    $content = $content -replace 'from-primary-light to-primary', 'from-blue-400 to-blue-600'
    $content = $content -replace 'from-primary-pale to-primary-light', 'from-blue-50 to-indigo-100'
    
    # Replace compound classes (order matters - specific before general)
    $content = $content -replace 'hover:bg-primary-dark', 'hover:bg-blue-700'
    $content = $content -replace 'hover:text-primary-dark', 'hover:text-blue-700'
    $content = $content -replace 'hover:bg-primary-pale', 'hover:bg-blue-50'
    $content = $content -replace 'hover:text-primary', 'hover:text-blue-600'
    $content = $content -replace 'focus:ring-primary', 'focus:ring-blue-500'
    
    # Replace specific variants
    $content = $content -replace 'bg-primary-dark', 'bg-blue-600'
    $content = $content -replace 'text-primary-dark', 'text-blue-800'
    $content = $content -replace 'bg-primary-pale', 'bg-blue-50'
    $content = $content -replace 'text-primary-pale', 'text-blue-50'
    $content = $content -replace 'border-primary-light', 'border-blue-200'
    $content = $content -replace 'border-primary', 'border-blue-600'
    
    # Replace base classes last
    $content = $content -replace 'bg-primary', 'bg-blue-600'
    $content = $content -replace 'text-primary', 'text-blue-600'
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host "Color reversion complete!"

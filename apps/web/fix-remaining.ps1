Get-ChildItem -Path "app" -Recurse -Filter *.tsx | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file
    $modified = $false
    
    $newContent = $content | ForEach-Object {
        $line = $_
        if ($line -match 'text-primary|bg-primary|border-primary|from-primary|to-primary') {
            $modified = $true
            $line = $line -replace 'from-primary to-primary-dark', 'from-blue-600 to-indigo-600'
            $line = $line -replace 'from-primary-pale to-primary-light', 'from-blue-50 to-indigo-100'
            $line = $line -replace 'hover:text-primary', 'hover:text-blue-600'
            $line = $line -replace 'hover:bg-primary', 'hover:bg-blue-600'
            $line = $line -replace 'focus:ring-primary', 'focus:ring-blue-500'
            $line = $line -replace 'text-primary', 'text-blue-600'
            $line = $line -replace 'bg-primary', 'bg-blue-600'
            $line = $line -replace 'border-primary', 'border-blue-600'
        }
        $line
    }
    
    if ($modified) {
        Set-Content -Path $file -Value $newContent
        Write-Host "Fixed: $file"
    }
}

Write-Host "All remaining files fixed!"

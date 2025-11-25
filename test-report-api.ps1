# Test Report Submission API

Write-Host "Testing Report Submission API..." -ForegroundColor Cyan
Write-Host ""

# Get auth token (you'll need to replace this with actual token)
$token = Read-Host "Enter your JWT token (from browser localStorage)"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "No token provided. Please log in to the app and get your token from browser console:" -ForegroundColor Yellow
    Write-Host "  1. Open browser DevTools (F12)" -ForegroundColor White
    Write-Host "  2. Go to Console tab" -ForegroundColor White
    Write-Host "  3. Type: localStorage.getItem('token')" -ForegroundColor White
    Write-Host "  4. Copy the token value" -ForegroundColor White
    exit
}

# Test data
$reportData = @{
    reason         = "Spam"
    description    = "This is a test report from PowerShell"
    listingId      = $null
    reportedUserId = $null
    evidenceImages = @()
} | ConvertTo-Json

Write-Host "Sending POST request to http://localhost:3001/reports..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest `
        -Uri "http://localhost:3001/reports" `
        -Method POST `
        -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    } `
        -Body $reportData `
        -UseBasicParsing

    Write-Host ""
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host $response.Content
    
}
catch {
    Write-Host ""
    Write-Host "ERROR!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error Message:" -ForegroundColor Red
    
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    $reader.DiscardBufferedData()
    $responseBody = $reader.ReadToEnd()
    Write-Host $responseBody
}

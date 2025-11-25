# Quick Backend Health Check

Write-Host "Checking Backend API Health..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is responding
Write-Host "1. Testing backend connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✓ Backend is responding!" -ForegroundColor Green
}
catch {
    Write-Host "   ✗ Backend is NOT responding!" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION: Make sure the backend API is running:" -ForegroundColor Yellow
    Write-Host "  cd apps/api" -ForegroundColor White
    Write-Host "  npm run start:dev" -ForegroundColor White
    exit
}

Write-Host ""
Write-Host "2. Checking if database migrations are needed..." -ForegroundColor Yellow
Write-Host "   Run this command to check:" -ForegroundColor White
Write-Host "   cd C:\Users\PC\Desktop\TradePlus\TradePlus" -ForegroundColor Cyan
Write-Host "   npx prisma migrate status" -ForegroundColor Cyan

Write-Host ""
Write-Host "3. If migrations are pending, run:" -ForegroundColor Yellow
Write-Host "   npx prisma migrate deploy" -ForegroundColor Cyan

Write-Host ""
Write-Host "4. To see backend logs, check the terminal where 'npm run dev' is running" -ForegroundColor Yellow

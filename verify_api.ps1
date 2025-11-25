$baseUrl = "http://localhost:3000"
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$email = "testuser_$timestamp@example.com"
$password = "Password123!"

Write-Host "--- 1. Registering User ---"
$registerBody = @{
    email = $email
    password = $password
    displayName = "Test User $timestamp"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "Registration Successful. User ID: $($registerResponse.user.id)"
} catch {
    Write-Error "Registration Failed: $_"
    exit 1
}

Write-Host "`n--- 2. Logging In ---"
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $token = $loginResponse.accessToken
    Write-Host "Login Successful. Token received."
} catch {
    Write-Error "Login Failed: $_"
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "`n--- 3. Getting Profile ---"
try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers -ErrorAction Stop
    Write-Host "Profile Retrieved: $($profile.email)"
} catch {
    Write-Error "Get Profile Failed: $_"
    exit 1
}

Write-Host "`n--- 4. Creating Listing ---"
$listingBody = @{
    title = "Test Item $timestamp"
    description = "A great item for testing"
    condition = "new"
    categoryId = 1 # Assuming category 1 exists from seed or is valid
    allowCash = $true
    priceCents = 1000
    allowBarter = $false
    allowCashPlusBarter = $false
} | ConvertTo-Json

try {
    # Note: This might fail if Category 1 doesn't exist. We might need to create a category first if the DB is empty.
    # But let's try. If it fails, we know we need to seed categories.
    $listing = Invoke-RestMethod -Uri "$baseUrl/listings" -Method Post -Body $listingBody -ContentType "application/json" -Headers $headers -ErrorAction Stop
    Write-Host "Listing Created: $($listing.title) (ID: $($listing.id))"
} catch {
    Write-Warning "Listing Creation Failed (likely due to missing Category): $_"
    # Proceeding anyway to test GET
}

Write-Host "`n--- 5. Fetching Listings ---"
try {
    $listings = Invoke-RestMethod -Uri "$baseUrl/listings" -Method Get -ErrorAction Stop
    Write-Host "Listings Fetched: $($listings.data.Count) items found."
} catch {
    Write-Error "Fetch Listings Failed: $_"
    exit 1
}

Write-Host "`n--- Verification Complete ---"

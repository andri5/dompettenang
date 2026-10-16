# Test DuitDiary API
# Run this script in PowerShell while server is running in separate terminal

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " DuitDiary API Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001/api/v1"
$headers = @{"Content-Type"="application/json"}

# Test Health Endpoint
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "   [PASS] Health check passed" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test Register
Write-Host "2. Testing Register Endpoint..." -ForegroundColor Yellow
$testEmail = "test$(Get-Random)@example.com"
$registerBody = @{
    name = "Test User"
    email = $testEmail
    password = "Test123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -Headers $headers
    Write-Host "   [PASS] Register passed" -ForegroundColor Green
    $accessToken = $response.data.accessToken
    Write-Host "   Token received: $($accessToken.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] Register failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test Login
Write-Host "3. Testing Login Endpoint..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = "Test123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -Headers $headers
    Write-Host "   [PASS] Login passed" -ForegroundColor Green
    $accessToken = $response.data.accessToken
    Write-Host "   Token: $($accessToken.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] Login failed: $_" -ForegroundColor Red
}
Write-Host ""

if ($accessToken) {
    $authHeaders = @{
        "Content-Type"="application/json"
        "Authorization"="Bearer $accessToken"
    }

    # Test Get Categories
    Write-Host "4. Testing Get Categories..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/categories" -Method GET -Headers $authHeaders
        Write-Host "   [PASS] Get categories passed" -ForegroundColor Green
        Write-Host "   Categories count: $($response.data.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "   [FAIL] Get categories failed: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Test Create Category
    Write-Host "5. Testing Create Category..." -ForegroundColor Yellow
    $categoryBody = @{
        name = "Test Category $(Get-Random)"
        icon = "test"
        color = "#FF5733"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/categories" -Method POST -Body $categoryBody -Headers $authHeaders
        Write-Host "   [PASS] Create category passed" -ForegroundColor Green
        $categoryId = $response.data.id
        Write-Host "   Category ID: $categoryId" -ForegroundColor Gray
    } catch {
        Write-Host "   [FAIL] Create category failed: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Test Get Expenses
    Write-Host "6. Testing Get Expenses..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/expenses" -Method GET -Headers $authHeaders
        Write-Host "   [PASS] Get expenses passed" -ForegroundColor Green
        Write-Host "   Expenses count: $($response.data.Count)" -ForegroundColor Gray
    } catch {
        Write-Host "   [FAIL] Get expenses failed: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Test Create Expense
    if ($categoryId) {
        Write-Host "7. Testing Create Expense..." -ForegroundColor Yellow
        $expenseBody = @{
            amount = 50000
            description = "Test expense"
            categoryId = $categoryId
            date = (Get-Date).ToString("yyyy-MM-dd")
        } | ConvertTo-Json

        try {
            $response = Invoke-RestMethod -Uri "$baseUrl/expenses" -Method POST -Body $expenseBody -Headers $authHeaders
            Write-Host "   [PASS] Create expense passed" -ForegroundColor Green
            $expenseId = $response.data.id
            Write-Host "   Expense ID: $expenseId" -ForegroundColor Gray
        } catch {
            Write-Host "   [FAIL] Create expense failed: $_" -ForegroundColor Red
        }
        Write-Host ""
    }

    # Test Dashboard
    Write-Host "8. Testing Dashboard Summary..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/dashboard/summary" -Method GET -Headers $authHeaders
        Write-Host "   [PASS] Dashboard summary passed" -ForegroundColor Green
        Write-Host "   Summary: Total=$($response.data.totalExpenses), Count=$($response.data.expenseCount)" -ForegroundColor Gray
    } catch {
        Write-Host "   [FAIL] Dashboard summary failed: $_" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

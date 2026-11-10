# Complete API Test Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Dompet Tenang Complete API Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$base = "http://localhost:3000/api/v1"
$h = @{"Content-Type"="application/json"}

# Login first
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body '{"email":"testuser577833776@test.com","password":"Test123!"}' -Headers $h
$token = $login.data.accessToken
$auth = @{"Content-Type"="application/json";"Authorization"="Bearer $token"}

# Get a category ID
$cats = Invoke-RestMethod -Uri "$base/categories" -Method GET -Headers $auth
$catId = $cats.data[0].id
Write-Host "Using category: $catId"

# TC-CAT-006: Empty name
Write-Host "`nTC-CAT-006: Empty Name Category" -ForegroundColor Yellow
try { 
    Invoke-RestMethod -Uri "$base/categories" -Method POST -Body '{"name":""}' -Headers $auth -ErrorAction Stop 
} catch { 
    Write-Host "   [PASS] Got error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# TC-CAT-008: Update Category
Write-Host "`nTC-CAT-008: Update Category" -ForegroundColor Yellow
try {
    $upd = Invoke-RestMethod -Uri "$base/categories/$catId" -Method PUT -Body '{"name":"Updated Name","color":"#00FF00"}' -Headers $auth
    Write-Host "   [PASS] Updated: $($upd.data.name)" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# TC-CAT-009: Update non-existent
Write-Host "`nTC-CAT-009: Update Non-existent" -ForegroundColor Yellow
try { 
    Invoke-RestMethod -Uri "$base/categories/00000000-0000-0000-0000-000000000000" -Method PUT -Body '{"name":"X"}' -Headers $auth -ErrorAction Stop 
} catch { 
    Write-Host "   [PASS] Got error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# TC-EXP-002: Filter by category
Write-Host "`nTC-EXP-002: Filter by Category" -ForegroundColor Yellow
try {
    $exp = Invoke-RestMethod -Uri "$base/expenses?categoryId=$catId" -Method GET -Headers $auth
    Write-Host "   [PASS] Filtered expenses: $($exp.data.Count)" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

# TC-EXP-008: Negative amount
Write-Host "`nTC-EXP-008: Negative Amount" -ForegroundColor Yellow
try { 
    Invoke-RestMethod -Uri "$base/expenses" -Method POST -Body "{`"amount`":-1000,`"description`":`"test`",`"categoryId`":`"$catId`"}" -Headers $auth -ErrorAction Stop 
} catch { 
    Write-Host "   [PASS] Got error: $($_.Exception.Response.StatusCode)" -ForegroundColor Green
}

# TC-DASH-002: Weekly period
Write-Host "`nTC-DASH-002: Weekly Dashboard" -ForegroundColor Yellow
try {
    $dash = Invoke-RestMethod -Uri "$base/dashboard/summary?period=week" -Method GET -Headers $auth
    Write-Host "   [PASS] Weekly summary retrieved" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

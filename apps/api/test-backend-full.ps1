# Complete Backend API Test
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Dompet Tenang Backend API Test" -ForegroundColor Cyan
Write-Host " $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

$base = "http://localhost:3000/api/v1"
$h = @{"Content-Type"="application/json"}
$passed = 0
$failed = 0

function Test-Pass($name) {
    $script:passed++
    Write-Host "   [PASS] $name" -ForegroundColor Green
}

function Test-Fail($name, $error) {
    $script:failed++
    Write-Host "   [FAIL] $name - $error" -ForegroundColor Red
}

# Login first
Write-Host "`nLogging in..." -ForegroundColor Gray
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body '{"email":"testuser577833776@test.com","password":"Test123!"}' -Headers $h
$token = $login.data.accessToken
$auth = @{"Content-Type"="application/json";"Authorization"="Bearer $token"}
Write-Host "Logged in successfully`n" -ForegroundColor Gray

# ===================== CATEGORY TESTS =====================
Write-Host "=== CATEGORY TESTS ===" -ForegroundColor Yellow

# Create a new category for testing
Write-Host "`nTC-CAT-004: Create Category" -ForegroundColor Yellow
$newCat = Invoke-RestMethod -Uri "$base/categories" -Method POST -Body '{"name":"TestCat123","icon":"star","color":"#FF0000"}' -Headers $auth
$testCatId = $newCat.data.id
Test-Pass "Created category: $testCatId"

# TC-CAT-006: Empty name
Write-Host "`nTC-CAT-006: Empty Name Category" -ForegroundColor Yellow
try { 
    Invoke-RestMethod -Uri "$base/categories" -Method POST -Body '{"name":""}' -Headers $auth -ErrorAction Stop 
    Test-Fail "Should have returned 422" ""
} catch { 
    if ($_.Exception.Response.StatusCode.value__ -eq 422) {
        Test-Pass "Got expected 422 validation error"
    } else {
        Test-Fail "Unexpected status" $_.Exception.Response.StatusCode
    }
}

# TC-CAT-008: Update Category (user's own category)
Write-Host "`nTC-CAT-008: Update Category (User's Own)" -ForegroundColor Yellow
try {
    $upd = Invoke-RestMethod -Uri "$base/categories/$testCatId" -Method PUT -Body '{"name":"UpdatedTestCat","color":"#00FF00"}' -Headers $auth
    Test-Pass "Updated name: $($upd.data.name), color: $($upd.data.color)"
} catch {
    Test-Fail "Update failed" $_.Exception.Message
}

# TC-CAT-009: Update non-existent
Write-Host "`nTC-CAT-009: Update Non-existent Category" -ForegroundColor Yellow
try { 
    Invoke-RestMethod -Uri "$base/categories/00000000-0000-0000-0000-000000000000" -Method PUT -Body '{"name":"X"}' -Headers $auth -ErrorAction Stop 
    Test-Fail "Should have returned 404" ""
} catch { 
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Test-Pass "Got expected 404 Not Found"
    } else {
        Test-Fail "Unexpected status" $_.Exception.Response.StatusCode
    }
}

# TC-CAT-011: Delete Category
Write-Host "`nTC-CAT-011: Delete Category" -ForegroundColor Yellow
try {
    $del = Invoke-RestMethod -Uri "$base/categories/$testCatId" -Method DELETE -Headers $auth
    Test-Pass "Category deleted successfully"
} catch {
    Test-Fail "Delete failed" $_.Exception.Message
}

# ===================== EXPENSE TESTS =====================
Write-Host "`n=== EXPENSE TESTS ===" -ForegroundColor Yellow

# Get a category for expense
$cats = Invoke-RestMethod -Uri "$base/categories" -Method GET -Headers $auth
$catId = $cats.data[0].id

# TC-EXP-001: Get Expenses
Write-Host "`nTC-EXP-001: Get Expenses" -ForegroundColor Yellow
try {
    $exp = Invoke-RestMethod -Uri "$base/expenses" -Method GET -Headers $auth
    Test-Pass "Got expenses: $($exp.data.Count)"
} catch {
    Test-Fail "Get expenses failed" $_.Exception.Message
}

# TC-EXP-007: Create Expense
Write-Host "`nTC-EXP-007: Create Expense" -ForegroundColor Yellow
$expBody = @{
    amount = 50000
    description = "Test expense"
    categoryId = $catId
    date = (Get-Date).ToString("yyyy-MM-dd")
} | ConvertTo-Json
try {
    $newExp = Invoke-RestMethod -Uri "$base/expenses" -Method POST -Body $expBody -Headers $auth
    $expId = $newExp.data.id
    Test-Pass "Created expense: $expId, amount: $($newExp.data.amount)"
} catch {
    Test-Fail "Create expense failed" $_.Exception.Message
}

# TC-EXP-002: Filter by Category
Write-Host "`nTC-EXP-002: Filter by Category" -ForegroundColor Yellow
try {
    $filtered = Invoke-RestMethod -Uri "$base/expenses?categoryId=$catId" -Method GET -Headers $auth
    Test-Pass "Filtered expenses: $($filtered.data.Count)"
} catch {
    Test-Fail "Filter failed" $_.Exception.Message
}

# TC-EXP-008: Negative Amount
Write-Host "`nTC-EXP-008: Negative Amount" -ForegroundColor Yellow
$negBody = @{amount=-1000;description="neg";categoryId=$catId} | ConvertTo-Json
try { 
    Invoke-RestMethod -Uri "$base/expenses" -Method POST -Body $negBody -Headers $auth -ErrorAction Stop 
    Test-Fail "Should have returned 422" ""
} catch { 
    if ($_.Exception.Response.StatusCode.value__ -eq 422) {
        Test-Pass "Got expected 422 validation error"
    } else {
        Test-Fail "Unexpected status" $_.Exception.Response.StatusCode
    }
}

# TC-EXP-013: Update Expense
if ($expId) {
    Write-Host "`nTC-EXP-013: Update Expense" -ForegroundColor Yellow
    $updExpBody = @{amount=75000;description="Updated expense"} | ConvertTo-Json
    try {
        $updExp = Invoke-RestMethod -Uri "$base/expenses/$expId" -Method PUT -Body $updExpBody -Headers $auth
        Test-Pass "Updated amount: $($updExp.data.amount)"
    } catch {
        Test-Fail "Update expense failed" $_.Exception.Message
    }

    # TC-EXP-017: Delete Expense
    Write-Host "`nTC-EXP-017: Delete Expense" -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$base/expenses/$expId" -Method DELETE -Headers $auth
        Test-Pass "Expense deleted successfully"
    } catch {
        Test-Fail "Delete expense failed" $_.Exception.Message
    }
}

# ===================== DASHBOARD TESTS =====================
Write-Host "`n=== DASHBOARD TESTS ===" -ForegroundColor Yellow

# TC-DASH-001: Default Summary
Write-Host "`nTC-DASH-001: Dashboard Summary (Default)" -ForegroundColor Yellow
try {
    $dash = Invoke-RestMethod -Uri "$base/dashboard/summary" -Method GET -Headers $auth
    Test-Pass "Total: $($dash.data.totalExpenses), Count: $($dash.data.expenseCount)"
} catch {
    Test-Fail "Dashboard failed" $_.Exception.Message
}

# TC-DASH-002: Weekly Summary
Write-Host "`nTC-DASH-002: Dashboard Summary (Weekly)" -ForegroundColor Yellow
try {
    $dashW = Invoke-RestMethod -Uri "$base/dashboard/summary?period=week" -Method GET -Headers $auth
    Test-Pass "Weekly summary retrieved"
} catch {
    Test-Fail "Weekly dashboard failed" $_.Exception.Message
}

# ===================== SUMMARY =====================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Passed: $passed" -ForegroundColor Green
Write-Host " Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host " Total:  $($passed + $failed)" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

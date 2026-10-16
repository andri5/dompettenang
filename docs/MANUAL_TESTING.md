# 🧪 Manual Testing Guide - Dompet Tenang

**Date**: December 31, 2025  
**Status**: ✅ Backend & Frontend Running

---

## 🌐 Service URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:5173 | ✅ Running |
| **Backend API** | http://localhost:3000 | ✅ Running |
| **API Health** | http://localhost:3000/api/v1/health | ✅ Available |

---

## 🧑‍💻 Test Account (Use for Testing)

```
Email:    test@example.com
Password: Test@12345
```

**Note:** If account doesn't exist, use Register page to create new test account first.

---

## 📋 Manual Testing Checklist

### 1️⃣ Authentication Testing

#### Register New Account
- [ ] Go to http://localhost:5173
- [ ] Click "Don't have account? Register here"
- [ ] Fill form with:
  - Name: Test User
  - Email: testuser@example.com
  - Password: Test@12345
  - Confirm: Test@12345
- [ ] Click Register button
- [ ] ✅ Should redirect to Dashboard
- [ ] ✅ Should see welcome message

#### Login
- [ ] Logout (click Profile → Logout)
- [ ] Click Login
- [ ] Enter test account email & password
- [ ] Click Sign In
- [ ] ✅ Should redirect to Dashboard
- [ ] ✅ Should see user data

#### Password Validation
- [ ] Try login with wrong password
- [ ] ✅ Should show error message
- [ ] Try register with weak password (e.g., "123")
- [ ] ✅ Should show validation error

---

### 2️⃣ Expense Management Testing

#### Add New Expense
- [ ] On Dashboard, click "Add Expense" or "➕" button
- [ ] Fill form:
  - Amount: 50000
  - Category: Makanan (or any)
  - Note: Test expense
  - Date: Today
- [ ] Click Save
- [ ] ✅ Should show success toast
- [ ] ✅ Expense should appear in list

#### View Expenses
- [ ] Click "Expenses" page
- [ ] ✅ Should see list of expenses
- [ ] ✅ Should show category, amount, date
- [ ] Scroll to load more (pagination)
- [ ] ✅ Should load more expenses

#### Edit Expense
- [ ] Click on expense item
- [ ] Click edit icon or "Edit" button
- [ ] Change amount to 75000
- [ ] Click Save
- [ ] ✅ Should update amount in list
- [ ] ✅ Should show success message

#### Delete Expense
- [ ] Click on expense
- [ ] Click delete icon or "Delete" button
- [ ] Confirm deletion
- [ ] ✅ Should disappear from list
- [ ] ✅ Should show success message

#### Filter Expenses
- [ ] On Expenses page, click Filter
- [ ] Select date range (Last 7 days)
- [ ] Click Apply
- [ ] ✅ Should filter expenses
- [ ] Select category "Makanan"
- [ ] ✅ Should show only Makanan expenses
- [ ] Clear filters
- [ ] ✅ Should show all expenses again

#### Search Expenses
- [ ] On Expenses page, use search box
- [ ] Type "test" (if you added expense with note "test")
- [ ] ✅ Should filter matching expenses
- [ ] Clear search
- [ ] ✅ Should show all again

---

### 3️⃣ Category Management Testing

#### View Categories
- [ ] Click "Categories" page
- [ ] ✅ Should see grid of categories
- [ ] ✅ Each category should show:
  - Icon (emoji)
  - Name
  - Color badge
  - Expense count

#### Add Custom Category
- [ ] Click "➕ Add Category" button
- [ ] Fill form:
  - Name: Hobi
  - Icon: Select from picker
  - Color: Select color
- [ ] Click Save
- [ ] ✅ New category should appear in grid
- [ ] ✅ Should show success message

#### Edit Category
- [ ] Click on category card
- [ ] Click edit button
- [ ] Change name to "Entertainment"
- [ ] Change color
- [ ] Click Save
- [ ] ✅ Should update in grid
- [ ] ✅ Name and color should change

#### Delete Category
- [ ] Click on category
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] ✅ Should disappear from grid
- [ ] ✅ Should show success message

---

### 4️⃣ Dashboard Testing

#### Summary Cards
- [ ] On Dashboard, verify summary cards show:
  - [ ] Total Today: Correct amount
  - [ ] This Week: Sum of week expenses
  - [ ] This Month: Sum of month expenses
- [ ] Numbers should be in currency format (Rp)

#### Charts & Visualization
- [ ] Verify pie chart shows:
  - [ ] All categories
  - [ ] Correct percentages
  - [ ] Colors match categories
- [ ] Hover over chart segments
- [ ] ✅ Should show tooltip with amount

#### Recent Transactions
- [ ] On Dashboard bottom, see Recent list
- [ ] ✅ Should show last 5 transactions
- [ ] ✅ Should show newest first
- [ ] Click on transaction
- [ ] ✅ Should show details

---

### 5️⃣ Responsive Design Testing

#### Mobile View (375px)
- [ ] Open browser DevTools (F12)
- [ ] Set device to "iPhone SE" (375px)
- [ ] Test all pages load correctly
- [ ] Test all buttons are clickable (44px minimum)
- [ ] ✅ Layout should be single column
- [ ] ✅ Navigation should be bottom tabs

#### Tablet View (768px)
- [ ] Set device to "iPad" (768px)
- [ ] ✅ Layout should be optimized for tablet
- [ ] ✅ Navigation can be sidebar
- [ ] Test landscape orientation

#### Desktop View (1920px)
- [ ] Set to full desktop resolution
- [ ] ✅ Layout should be multi-column
- [ ] ✅ Navigation should be sidebar
- [ ] ✅ All content should be readable

---

### 6️⃣ Navigation & Links Testing

#### Page Navigation
- [ ] Click Dashboard → ✅ Should load
- [ ] Click Expenses → ✅ Should load
- [ ] Click Categories → ✅ Should load
- [ ] Click Profile → ✅ Should load
- [ ] Try back button → ✅ Should work

#### Protected Routes
- [ ] Logout
- [ ] Try to access Dashboard directly (localhost:5173/dashboard)
- [ ] ✅ Should redirect to login
- [ ] Login again
- [ ] ✅ Should access Dashboard

#### Links & Buttons
- [ ] Click "Forgot Password?" → ✅ Should show form
- [ ] Click "Create Account" → ✅ Should go to register
- [ ] Click logo → ✅ Should go to home/dashboard

---

### 7️⃣ Error Handling Testing

#### Invalid Inputs
- [ ] Try register with:
  - [ ] Empty email → ✅ Should show error
  - [ ] Invalid email format (missing @) → ✅ Should show error
  - [ ] Short password (< 8 chars) → ✅ Should show error
  - [ ] Passwords don't match → ✅ Should show error

#### Server Errors
- [ ] Stop backend (close terminal)
- [ ] Try to load expenses → ✅ Should show error message
- [ ] Start backend again
- [ ] ✅ Should work normally

#### Network Errors (Simulated)
- [ ] Open DevTools Network tab
- [ ] Set to "Offline"
- [ ] Try to perform action → ✅ Should show network error
- [ ] Set back to "Online"
- [ ] ✅ Should work again

---

### 8️⃣ Performance Testing

#### Page Load Time
- [ ] Open DevTools Performance tab
- [ ] Load each page, verify:
  - [ ] Dashboard loads in < 2 seconds
  - [ ] Expenses loads in < 1.5 seconds
  - [ ] Categories loads in < 1.5 seconds
  - [ ] Profile loads in < 1 second

#### API Response Time
- [ ] Open DevTools Network tab
- [ ] Perform actions, check response times:
  - [ ] Login: < 500ms
  - [ ] Get expenses: < 300ms
  - [ ] Add expense: < 500ms
  - [ ] Delete: < 300ms

#### No Console Errors
- [ ] Open DevTools Console
- [ ] Reload page
- [ ] ✅ Should have NO red error messages
- [ ] Perform all actions
- [ ] ✅ Console should stay clean

---

### 9️⃣ Accessibility Testing

#### Keyboard Navigation
- [ ] Tab through form fields
- [ ] ✅ Focus should be visible (blue outline)
- [ ] ✅ Can submit form with Enter key
- [ ] Can navigate with Tab/Shift+Tab

#### Screen Reader (if available)
- [ ] Enable screen reader
- [ ] ✅ Should read page title
- [ ] ✅ Should read button labels
- [ ] ✅ Should read form labels

#### Color Contrast
- [ ] Use WebAIM contrast checker
- [ ] ✅ Text should have sufficient contrast
- [ ] ✅ Buttons should be clearly visible

---

### 🔟 Data Persistence Testing

#### Logout & Login
- [ ] Add expense with amount 12345
- [ ] Logout
- [ ] Login with same account
- [ ] ✅ Expense should still be there

#### Browser Refresh
- [ ] Add new expense
- [ ] Refresh page (F5)
- [ ] ✅ Expense should still be visible
- [ ] ✅ User should still be logged in

#### LocalStorage
- [ ] Open DevTools → Application → LocalStorage
- [ ] ✅ Should have auth token stored
- [ ] ✅ Token should persist after refresh

---

## 📊 Test Results Template

```
Test Date: ___________
Tester: ________________
Environment: Development

PASSED TESTS:
□ Authentication (Register, Login, Logout)
□ Expense CRUD (Create, Read, Update, Delete)
□ Category Management (Add, Edit, Delete)
□ Dashboard & Charts
□ Responsive Design (Mobile, Tablet, Desktop)
□ Navigation & Routing
□ Error Handling
□ Performance
□ Accessibility
□ Data Persistence

FAILED TESTS:
(List any issues found)
1. _______________
2. _______________

ISSUES TO FIX:
(Any bugs or improvements)
1. _______________
2. _______________

OVERALL ASSESSMENT:
[ ] Ready for Production
[ ] Needs Fixes (list below)
[ ] Major Issues (needs rework)

Notes:
___________________________________________________________
```

---

## 🐛 If You Find Issues

**1. Frontend Error:**
- Check browser console (F12 → Console)
- Note the error message
- Take screenshot

**2. Backend Error:**
- Check terminal output where backend is running
- Look for red error messages
- Note timestamp and details

**3. API Connection Issue:**
- Open DevTools Network tab
- Try action and watch for failed requests
- Check response status (200, 400, 500, etc.)

---

## 🔄 Restart Services

**If services need restart:**

```bash
# Terminal 1 (Backend) - Press Ctrl+C to stop
# Then: npm run dev

# Terminal 2 (Frontend) - Press Ctrl+C to stop  
# Then: npm run dev
```

Or keep this document open and note:
- **Backend Terminal ID**: 34253011-59a8-4f03-b3ba-e23c1134a125
- **Frontend Terminal ID**: 15f84bda-3799-4a51-b351-5f43a3302a79

---

## ✅ Sign-Off

When testing complete, fill out:

```
Testing Completed: [ ] Yes [ ] No
All Critical Tests Passed: [ ] Yes [ ] No
Ready for Deployment: [ ] Yes [ ] No
Issues Found: ____________________
Tester Signature: _________________
Date: ____________________________
```

---

**Happy Testing! 🚀**

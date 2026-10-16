# 🚀 MANUAL TESTING - QUICK START

**Services Status**: ✅ RUNNING (Background)

---

## 🌐 Open These URLs in Browser

1. **Frontend**: http://localhost:5173
2. **Backend Health**: http://localhost:3000/api/v1/health

---

## 🔑 Test Account

```
Email:    test@example.com
Password: Test@12345
```

---

## ✅ Quick Test Flows

### Flow 1: Auth → Dashboard → Add Expense
1. Go to http://localhost:5173
2. Login with test account
3. See Dashboard with summary
4. Click "Add Expense" or "➕"
5. Add expense (Amount: 50000, Category: Makanan)
6. Click Save → Should see success ✅

### Flow 2: View & Filter Expenses
1. Click "Expenses" page
2. See list of all expenses
3. Use filter/search to narrow down
4. Click on expense to edit/delete
5. Should work smoothly ✅

### Flow 3: Manage Categories
1. Click "Categories" page
2. Click "➕ Add Category"
3. Create custom category
4. Edit/Delete existing category
5. Should update immediately ✅

### Flow 4: Dashboard Analytics
1. Dashboard shows pie chart
2. Hover over chart → Shows tooltip
3. Summary cards show correct totals
4. Recent transactions list at bottom
5. All should update when you add expense ✅

---

## 📱 Test on Different Screen Sizes

**Mobile** (Use DevTools F12):
- Set to iPhone SE (375px)
- ✅ Should be single column
- ✅ Bottom tab navigation
- ✅ All buttons clickable

**Tablet** (768px):
- ✅ Should adapt layout
- ✅ Might show 2 columns

**Desktop** (1366px):
- ✅ Multi-column layout
- ✅ Sidebar navigation

---

## 🐛 If Issues Occur

**Check these:**

1. **Frontend not loading**
   - Is Terminal 2 running? (Check output above)
   - Try http://localhost:5173 in different browser
   - Open Console (F12) - any errors?

2. **API not responding**
   - Is Terminal 1 running? (Check output above)
   - Try http://localhost:3000/api/v1/health
   - Should return JSON with timestamp

3. **Login fails**
   - Verify backend is running
   - Check browser console for errors
   - Try register new account instead

4. **Expenses not loading**
   - Check Network tab (F12) - is API call happening?
   - Is backend responding?
   - Check browser console for errors

---

## 🔄 Restart Services

**If needed:**

```bash
# Stop: Press Ctrl+C in terminal
# Restart: Type "npm run dev" and Enter
```

Services will restart automatically when you type `r` then Enter in terminal.

---

## 📊 Full Checklist

Full manual testing checklist available in: **MANUAL_TESTING.md**

Includes:
- ✅ Authentication tests
- ✅ CRUD operations
- ✅ Category management
- ✅ Dashboard analytics
- ✅ Responsive design
- ✅ Error handling
- ✅ Performance checks
- ✅ Accessibility tests

---

## 🎯 Testing Goals

- [ ] All pages load without errors
- [ ] Can register and login
- [ ] Can add/edit/delete expenses
- [ ] Can manage categories
- [ ] Dashboard shows correct data
- [ ] Responsive on mobile/tablet/desktop
- [ ] No console errors
- [ ] API responses are fast

---

## ✨ Services Will Stay Running Until You Stop Them

Just keep testing! Services won't crash or stop.

**Terminal IDs** (for reference):
- Backend: `34253011-59a8-4f03-b3ba-e23c1134a125`
- Frontend: `15f84bda-3799-4a51-b351-5f43a3302a79`

---

**Happy Testing! 🚀**

Questions? Check MANUAL_TESTING.md for detailed guide.

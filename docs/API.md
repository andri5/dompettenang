# 🔧 API Documentation

**Last Updated:** January 1, 2026  
**Base URL:** `http://localhost:3001/api/v1` (production: `https://dompet-tenang.web.id/api/v1`)

---

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 201 Created
{
  "user": { "id", "name", "email", "createdAt" },
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### Login
```
POST /auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token"
}
```

### Get Current User
```
GET /auth/me
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Refresh Token
```
POST /auth/refresh
{
  "refreshToken": "refresh_token"
}

Response: 200 OK
{
  "accessToken": "new_jwt_token"
}
```

---

## Expense Endpoints

### Create Expense
```
POST /expenses
Authorization: Bearer {accessToken}

{
  "amount": 50000,
  "description": "Lunch meeting",
  "categoryId": "category_id",
  "date": "2025-12-31"
}

Response: 201 Created
{
  "id": "expense_id",
  "amount": 50000,
  "description": "Lunch meeting",
  "categoryId": "category_id",
  "date": "2025-12-31",
  "createdAt": "2025-12-31T14:30:00Z"
}
```

### Get Expenses
```
GET /expenses?startDate=2025-12-01&endDate=2025-12-31
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "data": [
    { "id", "amount", "description", "categoryId", "date" }
  ],
  "total": 150000,
  "count": 3
}
```

### Update Expense
```
PUT /expenses/{id}
Authorization: Bearer {accessToken}

{
  "amount": 75000,
  "description": "Updated description"
}

Response: 200 OK
{ "id", "amount", "description", "categoryId", "date" }
```

### Delete Expense
```
DELETE /expenses/{id}
Authorization: Bearer {accessToken}

Response: 204 No Content
```

---

## Category Endpoints

### Create Category
```
POST /categories
Authorization: Bearer {accessToken}

{
  "name": "Food",
  "description": "Food expenses",
  "color": "#FF6B6B"
}

Response: 201 Created
{ "id", "name", "description", "color", "createdAt" }
```

### Get Categories
```
GET /categories
Authorization: Bearer {accessToken}

Response: 200 OK
{
  "data": [
    { "id", "name", "description", "color" }
  ]
}
```

### Update Category
```
PUT /categories/{id}
Authorization: Bearer {accessToken}

{
  "name": "Food & Drinks",
  "color": "#FF8787"
}

Response: 200 OK
{ "id", "name", "description", "color" }
```

### Delete Category
```
DELETE /categories/{id}
Authorization: Bearer {accessToken}

Response: 204 No Content
```

---

## Dashboard Endpoints

### Get Summary
```
GET /dashboard/summary?period=month
Authorization: Bearer {accessToken}
```

`period` adalah `week`, `month`, atau `year`. Boleh diganti `startDate` + `endDate` (`YYYY-MM-DD`).

Response `data` mencakup `totalIncome`, `totalExpenses`, `balance`, `expenseCategoryBreakdown`, `incomeCategoryBreakdown`, dan `overview`.

### Monthly insight (Pro)
```
GET /dashboard/monthly-insight
Authorization: Bearer {accessToken}
```

Membandingkan bulan berjalan sampai hari ini dengan rentang tanggal yang sama di bulan lalu. Butuh plan PRO (atau role ADMIN). Bukan Pro → `403` dengan kode `PRO_REQUIRED`.

Response `data`: `monthLabel`, `previousMonthLabel`, `comparedThroughDay`, `current`, `previous`, `expenseChangePct`, `topCategory`, `highlights`.

---

## Pro Lifetime (transfer manual)

```
GET  /billing/plans
POST /billing/purchase-request          (auth)
GET  /billing/my-requests               (auth)
POST /billing/purchase-request/:id/proof  (auth, multipart field `proof`)
```

Admin:

```
GET  /admin/pro-requests
GET  /admin/pro-requests/summary
POST /admin/pro-requests/:id/approve    body opsional { "adminNote" }
POST /admin/pro-requests/:id/reject     body wajib { "adminNote" }
```

`adminNote` saat tolak wajib terisi (maks. 500 karakter). Web mengirim salah satu alasan tetap, plus catatan tambahan bila ada:

- `Bukti transfer kurang jelas`
- `Kode / berita transfer salah`
- `Nominal atau rekening transfer salah`

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "message": "Email is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "User not found"
}
```

### 422 Unprocessable Entity
```json
{
  "error": "Validation Error",
  "message": "Amount must be greater than 0",
  "details": [
    { "field": "amount", "message": "Must be > 0" }
  ]
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate Limited",
  "message": "Too many requests. Try again in 60 seconds"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

---

## Rate Limiting

- **Auth endpoints:** 5 requests per 15 minutes per IP
- **API endpoints:** 100 requests per minute per user
- **Reset:** Automatic after time window

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer {accessToken}
```

Tokens expire in:
- Access Token: 1 hour
- Refresh Token: 7 days

---

**For more details, see the source code in `apps/api/src/`**

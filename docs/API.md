# 🔧 API Documentation

**Last Updated:** October 26, 2026  
**Base URL:** `http://localhost:3001/api/v1` (production: `https://dompet-tenang.web.id/api/v1`)

Web memakai cookie HttpOnly (`access` + `refresh`). Mobile dan klien lain memakai `Authorization: Bearer`. Login/register tetap mengembalikan token di body JSON.

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
  "note": "Makan siang",
  "categoryId": "category_id",
  "type": "EXPENSE",
  "date": "2025-12-31"
}
```

`type` adalah `EXPENSE` atau `INCOME`. Field `description` masih diterima dan disimpan sebagai `note`.

### Get Expenses
```
GET /expenses?type=EXPENSE&search=makan&startDate=2025-12-01&endDate=2025-12-31
Authorization: Bearer {accessToken}
```

Query: `page`, `limit` (maks. 100), `startDate`, `endDate`, `categoryId`, `type`, `search`, `sortBy` (`date` | `amount` | `createdAt`), `sortOrder` (`asc` | `desc`).

`search` mencocokkan catatan **atau** nama kategori (case-insensitive). Tiap item di daftar punya `balanceAfter`: saldo buku setelah transaksi itu (semua transaksi user yang belum dihapus, bukan hanya halaman yang sedang difilter). Di luar daftar, `balanceAfter` bisa `null`.

### Update Expense
```
PUT /expenses/{id}
Authorization: Bearer {accessToken}

{
  "amount": 75000,
  "note": "Catatan diperbarui"
}

Response: 200 OK
{ "id", "amount", "note", "categoryId", "date", "balanceAfter" }
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

Angka di bawah untuk production. Development lebih longgar.

- **Login / register:** 20 permintaan per 15 menit per IP
- **Lupa / reset password:** 5 permintaan per jam per IP
- **API umum:** 120 permintaan per menit per IP

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer {accessToken}
```

Masa berlaku default di `.env.example`:

- Access token: 15 menit (`JWT_EXPIRES_IN`)
- Refresh token: 7 hari (`JWT_REFRESH_EXPIRES_IN`)

---

**For more details, see the source code in `apps/api/src/`**

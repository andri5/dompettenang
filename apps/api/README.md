# 📒 Dompet Tenang API

> Backend API for Dompet Tenang - Aplikasi Catat Harian Pengeluaran

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Environment Variables](#-environment-variables)
- [Scripts](#-scripts)
- [Development Guidelines](#-development-guidelines)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x+ | JavaScript runtime |
| **TypeScript** | 5.x | Type-safe JavaScript |
| **Express.js** | 4.x | Web framework |
| **Prisma** | 5.x | ORM & database toolkit |
| **PostgreSQL** | 15+ | Relational database |
| **Zod** | 3.x | Schema validation |
| **JWT** | - | Authentication tokens |
| **bcryptjs** | - | Password hashing |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** 20.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 15.x or higher ([Download](https://www.postgresql.org/download/))
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd apps/api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Setup environment variables**:
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your configuration
   # See "Environment Variables" section for details
   ```

4. **Setup database**:
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Seed default categories
   npm run db:seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Verify installation**:
   ```bash
   # Should return: {"success":true,"message":"Dompet Tenang API is running",...}
   curl http://localhost:3000/api/v1/health
   ```

---

## 📁 Project Structure

```
apps/api/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Database seeding script
│
├── src/
│   ├── config/            # Configuration files
│   │   └── index.ts       # Environment config loader
│   │
│   ├── constants/         # Application constants
│   │   └── index.ts       # Error codes, messages, defaults
│   │
│   ├── controllers/       # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── category.controller.ts
│   │   ├── dashboard.controller.ts
│   │   ├── expense.controller.ts
│   │   └── index.ts
│   │
│   ├── errors/            # Custom error classes
│   │   └── index.ts       # AppError, NotFoundError, etc.
│   │
│   ├── middlewares/       # Express middlewares
│   │   ├── auth.middleware.ts      # JWT authentication
│   │   ├── error.middleware.ts     # Global error handler
│   │   ├── validate.middleware.ts  # Request validation
│   │   └── index.ts
│   │
│   ├── routes/            # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── category.routes.ts
│   │   ├── dashboard.routes.ts
│   │   ├── expense.routes.ts
│   │   └── index.ts
│   │
│   ├── services/          # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── category.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── expense.service.ts
│   │   └── index.ts
│   │
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts       # Shared interfaces
│   │
│   ├── utils/             # Utility functions
│   │   ├── jwt.ts         # JWT token utilities
│   │   ├── prisma.ts      # Prisma client singleton
│   │   ├── response.ts    # API response helpers
│   │   ├── validation.ts  # Zod validation schemas
│   │   └── index.ts
│   │
│   └── index.ts           # Application entry point
│
├── .env                   # Environment variables (git-ignored)
├── .env.example           # Example environment file
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT REQUEST                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      MIDDLEWARE LAYER                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │    CORS     │→ │ Body Parser  │→ │  Auth Middleware  │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       ROUTES LAYER                           │
│  ┌─────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐   │
│  │  Auth   │  │  Category  │  │  Expense │  │ Dashboard │   │
│  └─────────┘  └────────────┘  └──────────┘  └───────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CONTROLLER LAYER                         │
│           (Request/Response handling & validation)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                           │
│              (Business logic & data operations)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (Prisma ORM)                     │
│                        PostgreSQL                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

All protected endpoints require a Bearer token:

```http
Authorization: Bearer <access_token>
```

### Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

### Endpoints

#### 🏥 Health Check

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/health` | Check API status | ❌ |

#### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| POST | `/auth/logout` | Logout user | ✅ |
| POST | `/auth/refresh` | Refresh access token | ❌ |
| GET | `/auth/me` | Get current user | ✅ |

**Register Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### 📂 Categories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/categories` | Get all categories | ✅ |
| GET | `/categories/:id` | Get category by ID | ✅ |
| POST | `/categories` | Create custom category | ✅ |
| PUT | `/categories/:id` | Update category | ✅ |
| DELETE | `/categories/:id` | Delete category | ✅ |

**Create Category Request:**
```json
{
  "name": "Hobi",
  "icon": "🎮",
  "color": "#9C27B0"
}
```

#### 💰 Expenses

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/expenses` | Get all expenses (paginated) | ✅ |
| GET | `/expenses/:id` | Get expense by ID | ✅ |
| POST | `/expenses` | Create expense | ✅ |
| PUT | `/expenses/:id` | Update expense | ✅ |
| DELETE | `/expenses/:id` | Delete expense (soft) | ✅ |

**Create Expense Request:**
```json
{
  "amount": 50000,
  "categoryId": "uuid-here",
  "note": "Makan siang",
  "date": "2024-12-29"
}
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page (max: 100) |
| startDate | string | - | Filter by start date (YYYY-MM-DD) |
| endDate | string | - | Filter by end date (YYYY-MM-DD) |
| categoryId | string | - | Filter by category |
| search | string | - | Search in notes |
| sortBy | string | createdAt | Sort field (date/amount/createdAt) |
| sortOrder | string | desc | Sort order (asc/desc) |

#### 📊 Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard/summary` | Get dashboard summary | ✅ |

**Response includes:**
- Today's expenses (total & count)
- This week's expenses (total & count)
- This month's expenses (total & count)
- Recent 5 expenses
- Top 5 spending categories

---

## 🗄 Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Users     │       │  Categories  │       │   Expenses   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ userId (FK)  │       │ id (PK)      │
│ email        │       │ id (PK)      │◄──────│ categoryId   │
│ password     │       │ name         │       │ userId (FK)  │
│ name         │       │ icon         │       │ amount       │
│ avatar       │       │ color        │       │ note         │
│ currency     │       │ isDefault    │       │ date         │
│ createdAt    │       │ createdAt    │       │ receiptUrl   │
│ updatedAt    │       │ updatedAt    │       │ deletedAt    │
└──────────────┘       └──────────────┘       │ createdAt    │
       │                                       │ updatedAt    │
       │                                       └──────────────┘
       │
       ▼
┌──────────────┐       ┌──────────────────────┐
│RefreshTokens │       │      Budgets         │
├──────────────┤       ├──────────────────────┤
│ id (PK)      │       │ id (PK)              │
│ userId (FK)  │       │ userId (FK)          │
│ token        │       │ month                │
│ expiresAt    │       │ totalBudget          │
│ createdAt    │       │ createdAt            │
└──────────────┘       │ updatedAt            │
                       └──────────────────────┘
                                │
                                ▼
                       ┌──────────────────────┐
                       │   CategoryBudgets    │
                       ├──────────────────────┤
                       │ id (PK)              │
                       │ budgetId (FK)        │
                       │ categoryId (FK)      │
                       │ amount               │
                       └──────────────────────┘
```

### Default Categories

The database is seeded with 10 default categories:

| Icon | Name | Color |
|------|------|-------|
| 🍔 | Makanan | #FF5733 |
| 🚗 | Transportasi | #3498DB |
| 🛒 | Belanja | #2ECC71 |
| 💡 | Tagihan | #F39C12 |
| 🎬 | Hiburan | #9B59B6 |
| 🏥 | Kesehatan | #E74C3C |
| 📚 | Pendidikan | #1ABC9C |
| 👕 | Pakaian | #E91E63 |
| 🏠 | Rumah Tangga | #795548 |
| 💼 | Lainnya | #607D8B |

---

## ⚙️ Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/Dompet Tenang?schema=public"

# JWT Secrets (generate secure random strings for production)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Security Notes

⚠️ **Important for Production:**
- Use strong, random JWT secrets (at least 32 characters)
- Never commit `.env` file to version control
- Use environment variables from your hosting platform
- Set `NODE_ENV=production` in production

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed default categories |
| `npm run db:migrate` | Create database migration |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## 👨‍💻 Development Guidelines

### Code Style

1. **TypeScript First**: All code should be written in TypeScript
2. **File Naming**: Use kebab-case for files (e.g., `auth.controller.ts`)
3. **Class Naming**: Use PascalCase (e.g., `AuthController`)
4. **Function Naming**: Use camelCase (e.g., `getUserById`)
5. **Constants**: Use SCREAMING_SNAKE_CASE (e.g., `ERROR_CODES`)

### Architecture Patterns

1. **Controller-Service Pattern**:
   - Controllers handle HTTP request/response
   - Services contain business logic
   - Keep controllers thin

2. **Single Responsibility**:
   - Each file/class should do one thing
   - Split large files when needed

3. **Error Handling**:
   - Use custom error classes from `src/errors`
   - Let error middleware handle responses

### Adding a New Feature

1. Create service in `src/services/`
2. Create controller in `src/controllers/`
3. Define routes in `src/routes/`
4. Add validation schema in `src/utils/validation.ts`
5. Update types in `src/types/index.ts`
6. Export from index files

### Git Commit Convention

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
test: Add/update tests
chore: Build/config changes
```

---

## 🧪 Testing

### Manual API Testing

Use any HTTP client (Postman, Insomnia, curl):

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Get categories (with token)
curl http://localhost:3000/api/v1/categories \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Results (29 Dec 2024)

| Endpoint | Status |
|----------|--------|
| GET /health | ✅ PASSED |
| POST /auth/register | ✅ PASSED |
| POST /auth/login | ✅ PASSED |
| GET /categories | ✅ PASSED |
| POST /expenses | ✅ PASSED |
| GET /expenses | ✅ PASSED |
| GET /dashboard/summary | ✅ PASSED |

---

## 🔧 Troubleshooting

### Common Issues

**1. Database connection failed**
```
Error: P1001: Can't reach database server
```
Solution: Make sure PostgreSQL is running and credentials are correct in `.env`

**2. Port already in use**
```
Error: listen EADDRINUSE: address already in use :::3000
```
Solution: Change PORT in `.env` or kill the process using the port

**3. Prisma client not generated**
```
Error: @prisma/client did not initialize
```
Solution: Run `npm run db:generate`

**4. Token expired**
```
{"success":false,"message":"Invalid or expired access token"}
```
Solution: Refresh token using `/auth/refresh` endpoint

### Getting Help

- Check [docs/DEV_WORKFLOW.md](../../docs/DEV_WORKFLOW.md) for project documentation
- Review error logs in terminal
- Check PostgreSQL logs if database issues

---

## 📄 License

This project is proprietary software. All rights reserved.

---

**Made with ❤️ by Dompet Tenang Team**

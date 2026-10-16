# 🛡️ Secure Coding Standards

**Last Updated:** January 1, 2026  
**Version:** 1.0  
**Applies To:** Backend (TypeScript/Express) & Frontend (React/TypeScript)

---

## 📋 Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [Input Validation](#input-validation)
4. [Error Handling](#error-handling)
5. [Logging](#logging)
6. [Frontend Security](#frontend-security)
7. [Backend Security](#backend-security)
8. [Code Review Checklist](#code-review-checklist)

---

## Authentication & Authorization

### ✅ DO: Proper JWT Implementation

```typescript
// Backend: auth.service.ts - SECURE PATTERN
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthService {
  private readonly SECRET = process.env.JWT_SECRET; // ✅ From env, min 32 chars
  private readonly ACCESS_EXPIRY = '1h';
  private readonly REFRESH_EXPIRY = '7d';

  // ✅ DO: Hash passwords with bcrypt
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10); // Cost factor 10
  }

  // ✅ DO: Compare hashes securely
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // ✅ DO: Generate tokens with expiry
  generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      this.SECRET,
      { algorithm: 'HS256', expiresIn: this.ACCESS_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      this.SECRET,
      { algorithm: 'HS256', expiresIn: this.REFRESH_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  // ✅ DO: Verify tokens with error handling
  verifyToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, this.SECRET) as { userId: string };
    } catch (error) {
      // ✅ DO: Return null instead of throwing (prevents timing attacks)
      return null;
    }
  }
}
```

### ❌ DON'T: Common Auth Mistakes

```typescript
// ❌ DON'T: Store plaintext passwords
const user = {
  email: 'user@example.com',
  password: 'SecurePass123!', // WRONG!
};

// ❌ DON'T: Use weak algorithms
jwt.sign(payload, secret, { algorithm: 'none' }); // WRONG!

// ❌ DON'T: Hardcode secrets
const SECRET = 'my-secret-key'; // WRONG!

// ❌ DON'T: Return sensitive data in responses
res.json({
  user,
  password: user.password, // WRONG!
  token: token // Consider HttpOnly cookies instead
});

// ❌ DON'T: Trust client-side auth
const isAuthenticated = localStorage.getItem('token'); // Always verify on backend!
```

### Middleware Pattern

```typescript
// Backend: auth.middleware.ts - SECURE PATTERN
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: { userId: string };
}

export const verifyAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  // ✅ DO: Require Bearer scheme
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  // ✅ DO: Verify token
  const decoded = AuthService.verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // ✅ DO: Attach to request
  req.user = decoded;
  next();
};

// ✅ DO: Use middleware on protected routes
app.get('/expenses', verifyAuth, ExpenseController.list);
```

---

## Data Protection

### ✅ DO: Encrypt Sensitive Data

```typescript
// Backend: encryption.utils.ts - SECURE PATTERN
import crypto from 'crypto';

export class EncryptionUtils {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

  // ✅ DO: Use authenticated encryption
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Return: iv:authTag:encrypted
    return [iv, authTag, encrypted].map(b => b.toString('hex')).join(':');
  }

  // ✅ DO: Verify authenticity during decryption
  decrypt(ciphertext: string): string {
    const [iv, authTag, encrypted] = ciphertext.split(':').map(Buffer.from);
    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv as any);
    
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8');
  }
}
```

### ✅ DO: Protect PII (Personally Identifiable Information)

```typescript
// Backend: user.schema.ts - SECURE PATTERN
model User {
  id        String @id @default(cuid())
  email     String @unique  // ✅ Unique constraint at DB
  name      String
  password  String          // ✅ Always hashed
  createdAt DateTime @default(now())
}

// ✅ DO: Never expose password in API response
export const getUserDTO = (user: User) => {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Frontend
export const useUser = () => {
  const { user } = useAuthStore();
  
  // ✅ DO: Only store necessary data
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    // ❌ Never: password
  };
};
```

---

## Input Validation

### ✅ DO: Validate All Inputs with Zod

```typescript
// Backend: validation.ts - SECURE PATTERN
import { z } from 'zod';

// ✅ DO: Use specific schema for each endpoint
export const CreateExpenseSchema = z.object({
  amount: z.number()
    .positive('Amount must be greater than 0')
    .max(999999999, 'Amount too large'),
  
  description: z.string()
    .min(1, 'Description required')
    .max(500, 'Description too long')
    .trim(),  // ✅ DO: Trim whitespace
  
  categoryId: z.string()
    .uuid('Invalid category ID'),
  
  date: z.string()
    .datetime('Invalid date format')
    .refine(d => new Date(d) <= new Date(), 'Date cannot be in future'),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;

// ✅ DO: Use middleware to validate
const validateBody = (schema: z.ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten(),
      });
    }
    
    req.validatedBody = validation.data;
    next();
  };

// ✅ DO: Apply to routes
router.post(
  '/expenses',
  verifyAuth,
  validateBody(CreateExpenseSchema),
  ExpenseController.create
);
```

### ❌ DON'T: Trust User Input

```typescript
// ❌ DON'T: No validation
app.post('/expenses', (req, res) => {
  const { amount, description } = req.body; // WRONG!
  // What if amount is negative? String? Null?
});

// ❌ DON'T: Only validate on frontend
// Frontend validation can be bypassed! Always validate on backend.

// ❌ DON'T: Use regex for validation
if (email.match(/\w+@\w+\.\w+/)) { // WRONG! Not RFC 5322 compliant
  // Many valid emails won't match
}
```

### Frontend Validation Pattern

```typescript
// Frontend: components/forms/ExpenseForm.tsx - SECURE PATTERN
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const expenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Required').max(500),
  categoryId: z.string().uuid('Invalid category'),
});

export function ExpenseForm() {
  const form = useForm({
    resolver: zodResolver(expenseSchema), // ✅ Validate before submit
  });

  const onSubmit = async (data: z.infer<typeof expenseSchema>) => {
    // ✅ Data is validated - safe to send
    const response = await api.post('/expenses', data);
    return response;
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields with validation errors */}
    </form>
  );
}
```

---

## Error Handling

### ✅ DO: Generic Error Messages to Users

```typescript
// Backend: error.middleware.ts - SECURE PATTERN
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // ✅ DO: Log detailed errors on backend
  logger.error('Request error', {
    method: req.method,
    path: req.path,
    status: error.status,
    message: error.message,
    stack: error.stack,
    userId: req.user?.id,
  });

  // ✅ DO: Send generic message to client
  const statusCode = error.status || 500;
  const message = statusCode === 500 
    ? 'Internal server error' // Generic
    : error.message; // Specific for validation errors

  res.status(statusCode).json({
    error: message,
    // ❌ DON'T include: stack, database details, file paths
  });
};

// ✅ DO: Handle specific error types
export class ValidationError extends Error {
  constructor(public message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedException extends Error {
  constructor(public message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedException';
  }
}

export class NotFoundError extends Error {
  constructor(public message: string = 'Not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}
```

### ❌ DON'T: Leak Information in Errors

```typescript
// ❌ DON'T: Return sensitive details
catch (error) {
  res.status(500).json({
    error: error.message,
    stack: error.stack, // WRONG! Reveals file structure
    query: query, // WRONG! Reveals database details
    host: 'postgres:5432', // WRONG! Reveals infrastructure
  });
}

// ❌ DON'T: Different errors for existing user
// Both should return same error (prevents user enumeration)
if (!user) {
  return res.status(404).json({ error: 'User not found' }); // WRONG!
}

// ✅ DO: Same error for both cases
if (!user || !passwordMatch) {
  return res.status(401).json({ error: 'Invalid credentials' }); // Correct
}
```

---

## Logging

### ✅ DO: Structured Logging

```typescript
// Backend: logger.ts - SECURE PATTERN
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'Dompet Tenang-api' },
  transports: [
    // ✅ DO: Log errors to file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // ✅ DO: Log all activity
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// ✅ DO: Log security events
logger.info('User login', {
  userId: user.id,
  email: maskEmail(user.email),      // Mask sensitive data
  ip: req.ip,
  timestamp: new Date().toISOString(),
});

logger.warn('Failed login attempt', {
  email: maskEmail(email),
  ip: req.ip,
  attempts: failedAttempts,
});

logger.error('Authorization failed', {
  userId: req.user?.id,
  resource: req.path,
  reason: 'User does not own this resource',
});

// ✅ DO: Mask sensitive data
const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  return `${name[0]}***@${domain}`;
};
```

### ❌ DON'T: Log Sensitive Information

```typescript
// ❌ DON'T: Log passwords, tokens, keys
logger.info('User login', { password: user.password }); // WRONG!
logger.info('Auth', { token: accessToken }); // WRONG!
logger.info('Config', { dbPassword: process.env.DATABASE_PASSWORD }); // WRONG!

// ❌ DON'T: Log entire objects with PII
logger.info('User data', user); // WRONG! Includes password hash
```

---

## Frontend Security

### ✅ DO: XSS Prevention

```typescript
// React - SECURE PATTERN
export function UserProfile({ user }: { user: User }) {
  // ✅ DO: React escapes by default
  return <h1>{user.name}</h1>; // Safe - auto-escaped

  // ✅ DO: Sanitize if necessary
  const sanitized = DOMPurify.sanitize(user.bio);
  return <div>{sanitized}</div>;

  // ❌ DON'T: Use dangerouslySetInnerHTML
  // return <div dangerouslySetInnerHTML={{ __html: user.bio }} />; // WRONG!
}

// ✅ DO: Validate URLs before navigation
export function SafeLink({ href, children }: PropsWithChildren<{ href: string }>) {
  const isValidHref = href.startsWith('/') || href.startsWith('https://');
  
  if (!isValidHref) {
    console.warn('Invalid href:', href);
    return <>{children}</>;
  }
  
  return <a href={href}>{children}</a>;
}
```

### ✅ DO: CSRF Protection

```typescript
// Frontend - SECURE PATTERN
import axios from 'axios';

// ✅ DO: Include CSRF token for state-changing requests
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// ✅ DO: Read CSRF token from meta tag or cookie
api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  
  return config;
});
```

### ✅ DO: Secure Token Storage

```typescript
// Frontend: auth.store.ts - SECURE PATTERN
export const useAuthStore = create<AuthStore>(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      
      setTokens: (access: string, refresh: string) => {
        // Option 1: localStorage (consider XSS risks)
        set({ accessToken: access, refreshToken: refresh });
        
        // Option 2: HttpOnly cookies (recommended)
        // Automatically sent by browser, not accessible to JavaScript
        // Set via Set-Cookie header from backend
      },
    }),
    {
      name: 'auth-storage',
      storage: localStorage,
    }
  )
);
```

---

## Backend Security

### ✅ DO: Rate Limiting

```typescript
// Backend: rate-limit.middleware.ts - SECURE PATTERN
import rateLimit from 'express-rate-limit';

// ✅ DO: Different limits for different endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests
  message: 'Rate limit exceeded',
});

// ✅ DO: Apply to routes
router.post('/auth/login', authLimiter, AuthController.login);
app.use('/api/v1', apiLimiter);
```

### ✅ DO: CORS Configuration

```typescript
// Backend: index.ts - SECURE PATTERN
import cors from 'cors';

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // ✅ DO: Only allow specific origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
```

### ✅ DO: Security Headers

```typescript
// Backend: index.ts - SECURE PATTERN
import helmet from 'helmet';

// ✅ DO: Use helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
  },
}));

// ✅ DO: Hide Express version
app.disable('x-powered-by');
```

---

## Code Review Checklist

Before committing code, verify:

### Authentication & Authorization
- [ ] No plaintext passwords
- [ ] Password hashing with bcrypt (cost ≥ 10)
- [ ] JWT properly signed and verified
- [ ] Access tokens short-lived (≤ 1h)
- [ ] Refresh tokens long-lived (7 days)
- [ ] User isolation (userId in all queries)
- [ ] No privilege escalation paths

### Data Protection
- [ ] Sensitive data not logged
- [ ] HTTPS/TLS required
- [ ] Encryption for sensitive fields
- [ ] No PII in error messages
- [ ] Tokens in HttpOnly cookies (preferred) or localStorage

### Input Validation
- [ ] All inputs validated with Zod
- [ ] File uploads restricted
- [ ] Size limits enforced
- [ ] Type checking in TypeScript
- [ ] SQL injection prevented (using ORM)

### Output Encoding
- [ ] XSS prevention (React auto-escapes)
- [ ] HTML sanitization if needed
- [ ] JSON responses properly formatted
- [ ] No code injection paths

### Error Handling
- [ ] Generic error messages to clients
- [ ] Detailed logging on backend
- [ ] No sensitive data in error responses
- [ ] Proper HTTP status codes

### Infrastructure
- [ ] Environment variables for secrets
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Logging enabled and monitored

### Dependencies
- [ ] `npm audit` shows no critical/high issues
- [ ] Packages up to date
- [ ] Lockfile committed
- [ ] No vulnerable versions

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] No `any` types
- [ ] No console.log in production code
- [ ] Comments explain security decisions
- [ ] Code follows naming conventions

---

**Version:** 1.0  
**Last Updated:** January 1, 2026  
**Review Frequency:** Quarterly  
**Escalation:** Security issues must be reported immediately

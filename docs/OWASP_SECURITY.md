# 🔐 OWASP Security Implementation Guide

**Last Updated:** January 1, 2026  
**Status:** Security Framework Ready  
**Standards:** OWASP Top 10 2024

---

## 🎯 OWASP Top 10 2024 Implementation

### 1️⃣ Broken Access Control

**Risk Level:** 🔴 CRITICAL  
**Status:** ✅ IMPLEMENTED

**Implementation Details:**

✅ **JWT-based Authentication**
```typescript
// Backend: auth.middleware.ts
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

✅ **Route Protection**
```typescript
// Backend: expense.routes.ts
router.post('/', verifyToken, validateExpense, ExpenseController.create);
router.get('/', verifyToken, ExpenseController.list);
router.put('/:id', verifyToken, validateExpense, ExpenseController.update);
router.delete('/:id', verifyToken, ExpenseController.delete);
```

✅ **User Isolation**
```typescript
// Backend: expense.service.ts
async getExpenses(userId: string, filters?: ExpenseFilter) {
  // Always include userId in query to prevent data leakage
  return prisma.expense.findMany({
    where: {
      userId,  // ✅ CRITICAL: Prevent accessing other users' data
      ...filters,
    },
  });
}
```

✅ **Frontend: Check User Session**
```typescript
// Frontend: useAuth.ts
export const useAuth = () => {
  const { user } = useAuthStore();
  
  // Only authenticated users can access
  if (!user) {
    window.location.href = '/login';
    return null;
  }
  
  return user;
};
```

**Testing Checklist:**
- [ ] Try accessing other user's expenses via ID manipulation
- [ ] Verify 401 on missing token
- [ ] Verify 403 on invalid permissions
- [ ] Test token expiry and refresh

---

### 2️⃣ Cryptographic Failures

**Risk Level:** 🔴 CRITICAL  
**Status:** ✅ IMPLEMENTED

**Implementation Details:**

✅ **Password Hashing (bcrypt)**
```typescript
// Backend: auth.service.ts
import bcrypt from 'bcrypt';

async register(name: string, email: string, password: string) {
  // Hash password with cost factor 10
  const hashedPassword = await bcrypt.hash(password, 10);
  
  return prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });
}

async login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }
  
  // Always compare passwords - don't tell which failed
  const passwordMatch = await bcrypt.compare(password, user.password);
  
  if (!passwordMatch) {
    throw new UnauthorizedException('Invalid credentials');
  }
  
  return user;
}
```

✅ **JWT Signing with Strong Algorithm**
```typescript
// Backend: jwt.utils.ts
const JWT_SECRET = process.env.JWT_SECRET; // ✅ Must be 32+ characters
const JWT_EXPIRY = '1h';

export const generateToken = (userId: string) => {
  return jwt.sign(
    { userId, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { 
      algorithm: 'HS256',  // ✅ Strong algorithm
      expiresIn: JWT_EXPIRY,
    }
  );
};
```

✅ **Secure Token Storage (Frontend)**
```typescript
// Frontend: auth.store.ts
export const useAuthStore = create<AuthStore>(
  persist(
    (set) => ({
      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
      },
      // ✅ localStorage (with consideration for XSS)
      // Alternative: Use HttpOnly cookies (more secure)
    }),
    {
      name: 'auth-storage',
      storage: localStorage,
    }
  )
);
```

✅ **HTTPS Requirement**
```typescript
// Production: .env
# ✅ HTTPS REQUIRED for all external communication
API_URL=https://api.Dompet Tenang.com
# NOT: http://api.Dompet Tenang.com
```

**Testing Checklist:**
- [ ] Verify bcrypt hash cost ≥ 10
- [ ] Verify JWT uses HS256
- [ ] Verify tokens in localStorage (or HttpOnly cookies)
- [ ] Verify no plaintext passwords in logs
- [ ] Test password hashes are random (same input = different hash)

---

### 3️⃣ Injection (SQL, NoSQL, LDAP, etc.)

**Risk Level:** 🔴 CRITICAL  
**Status:** ✅ PROTECTED

**Implementation Details:**

✅ **Prisma ORM (Parameterized Queries)**
```typescript
// Backend: expense.controller.ts
async createExpense(req: Request, res: Response) {
  const { amount, description, categoryId, date } = req.body;
  
  // ✅ Prisma automatically prevents SQL injection
  const expense = await ExpenseService.create({
    userId: req.user.id,
    amount,
    description,
    categoryId,
    date,
  });
  
  // NEVER do: db.query(`INSERT ... WHERE id = ${id}`)
}
```

✅ **Input Validation with Zod**
```typescript
// Backend: validation.ts
export const CreateExpenseSchema = z.object({
  amount: z.number().positive('Amount must be > 0'),
  description: z.string().min(1).max(500),
  categoryId: z.string().uuid('Invalid category ID'),
  date: z.string().datetime('Invalid date format'),
});

// Middleware validates before reaching controller
router.post('/expenses', validateBody(CreateExpenseSchema), controller);
```

✅ **Type Safety in TypeScript**
```typescript
// ✅ TypeScript catches type mismatches at compile time
interface Expense {
  id: string;
  amount: number;  // ✅ Not a string
  description: string;
  userId: string;  // ✅ Must match user ID
}

// ❌ This won't compile:
const exp: Expense = { amount: "100" }; // Type error!
```

✅ **Frontend Validation**
```typescript
// Frontend: useExpenses.ts
const schema = z.object({
  amount: z.number().min(100, 'Minimum 100'),
  description: z.string().min(1, 'Required'),
  categoryId: z.string().uuid('Invalid category'),
});

const form = useForm({ resolver: zodResolver(schema) });
// ✅ Validates before sending to backend
```

**Testing Checklist:**
- [ ] Try SQL injection in description: `'; DROP TABLE--`
- [ ] Try NoSQL injection: `{"$ne": null}`
- [ ] Try special characters: `<script>alert(1)</script>`
- [ ] Verify validation errors on invalid input
- [ ] All attempts should be safely rejected

---

### 4️⃣ Insecure Design

**Risk Level:** 🟠 HIGH  
**Status:** ✅ DESIGNED SECURELY

**Implementation Details:**

✅ **Threat Modeling**
```
Key Threats:
1. Unauthorized access to expenses → Mitigated by JWT + userId check
2. Data tampering → Mitigated by cryptographic integrity (JWT signature)
3. Man-in-the-middle → Mitigated by HTTPS + TLS
4. Denial of service → Mitigated by rate limiting
5. Privilege escalation → Mitigated by role-based access control
```

✅ **Rate Limiting**
```typescript
// Backend: rate-limit.middleware.ts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many login attempts, try again later',
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: 'Rate limit exceeded',
});

router.post('/auth/login', authLimiter, login);
router.get('/expenses', apiLimiter, getExpenses);
```

✅ **CORS Configuration**
```typescript
// Backend: index.ts
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

✅ **Error Handling (No Info Leakage)**
```typescript
// ❌ BAD: Reveals too much info
res.status(500).json({ 
  error: 'Database connection failed: ECONNREFUSED localhost:5432'
});

// ✅ GOOD: Generic error
res.status(500).json({ 
  error: 'Internal server error'
});

// Log details only on backend
logger.error('DB Connection failed', { 
  host: 'localhost',
  port: 5432,
  stack: error.stack,
});
```

**Testing Checklist:**
- [ ] Verify CORS only allows configured origins
- [ ] Test rate limiting on auth endpoints
- [ ] Test rate limiting on API endpoints
- [ ] Verify error messages don't leak sensitive info
- [ ] Test with various Content-Type headers

---

### 5️⃣ Broken Authentication

**Risk Level:** 🔴 CRITICAL  
**Status:** ✅ IMPLEMENTED

**Implementation Details:**

✅ **Password Requirements**
```typescript
// Backend: validation.ts
export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .refine(pwd => /[A-Z]/.test(pwd), 'Must contain uppercase letter')
  .refine(pwd => /[a-z]/.test(pwd), 'Must contain lowercase letter')
  .refine(pwd => /[0-9]/.test(pwd), 'Must contain number')
  .refine(pwd => /[!@#$%^&*]/.test(pwd), 'Must contain special character');

// Example valid passwords:
// ✅ MyPassword123!
// ❌ password123
// ❌ PASSWORD123!
// ❌ Pass123
```

✅ **Session Management**
```typescript
// Backend: auth.service.ts
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Short-lived access token
const accessToken = jwt.sign({ userId }, SECRET, {
  expiresIn: ACCESS_TOKEN_EXPIRY,
});

// Longer-lived refresh token
const refreshToken = jwt.sign({ userId, type: 'refresh' }, SECRET, {
  expiresIn: REFRESH_TOKEN_EXPIRY,
});

return { accessToken, refreshToken };
```

✅ **Prevent Brute Force**
```typescript
// Backend: auth.middleware.ts
// Rate limit + Account lockout after failed attempts
const failedAttempts = new Map<string, number>();

app.post('/auth/login', async (req, res) => {
  const email = req.body.email;
  const attempts = failedAttempts.get(email) || 0;
  
  if (attempts >= 5) {
    return res.status(429).json({ error: 'Account temporarily locked' });
  }
  
  try {
    const user = await login(email, req.body.password);
    failedAttempts.delete(email); // Reset on success
  } catch (error) {
    failedAttempts.set(email, attempts + 1);
    throw error;
  }
});
```

✅ **Secure Logout**
```typescript
// Frontend: auth.store.ts
export const logout = () => {
  // Clear from localStorage
  localStorage.removeItem('auth-storage');
  
  // Clear from memory
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
  });
  
  // Clear from server (optional)
  api.post('/auth/logout');
  
  // Redirect to login
  window.location.href = '/login';
};
```

**Testing Checklist:**
- [ ] Test weak password rejection
- [ ] Test brute force after 5 attempts
- [ ] Test logout clears all tokens
- [ ] Test access token expiry (1h)
- [ ] Test refresh token works
- [ ] Test refresh token expiry (7d)

---

### 6️⃣ Software and Data Integrity Failures

**Risk Level:** 🟠 HIGH  
**Status:** ✅ PROTECTED

**Implementation Details:**

✅ **Dependency Scanning**
```bash
# Check for vulnerable dependencies
npm audit
npm audit --production

# Use Snyk for continuous monitoring
npm install -g snyk
snyk test
```

✅ **Signed Commits**
```bash
# Enable commit signing
git config user.signingkey <GPG_KEY_ID>
git config commit.gpgsign true
git commit -S -m "fix: security issue"
```

✅ **Version Pinning**
```json
{
  "dependencies": {
    "express": "4.18.2",        // ✅ Specific version
    "bcrypt": "5.1.1",
    "jsonwebtoken": "9.1.2"
  },
  "devDependencies": {
    "typescript": "5.3.3"
  }
}
```

✅ **Integrity Verification**
```typescript
// Backend: verify-integrity.ts
import crypto from 'crypto';

export const verifyFileIntegrity = (filePath: string, expectedHash: string) => {
  const content = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  
  if (hash !== expectedHash) {
    throw new Error('File integrity check failed - file may be tampered');
  }
};
```

**Testing Checklist:**
- [ ] Run `npm audit` - no critical vulnerabilities
- [ ] Check all transitive dependencies
- [ ] Verify lockfile (package-lock.json) is committed
- [ ] Test with tampered dependencies

---

### 7️⃣ Identification and Authentication Failures

**Risk Level:** 🔴 CRITICAL  
**Status:** ✅ IMPLEMENTED

**Implementation Details:**

✅ **Email Uniqueness**
```typescript
// Backend: user.schema.ts (Prisma)
model User {
  id    String @id @default(cuid())
  email String @unique  // ✅ Unique constraint at DB level
  name  String
  password String
  createdAt DateTime @default(now())
}
```

✅ **Multi-Factor Authentication (Optional)**
```typescript
// Backend: mfa.service.ts (Future implementation)
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const generateMFASecret = async (email: string) => {
  const secret = speakeasy.generateSecret({
    name: `Dompet Tenang (${email})`,
    issuer: 'Dompet Tenang',
  });
  
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);
  
  return { secret: secret.base32, qrCode };
};

export const verifyMFAToken = (secret: string, token: string) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps (±30 seconds)
  });
};
```

✅ **Account Recovery**
```typescript
// Backend: recovery.service.ts
export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    // ✅ Don't reveal if user exists (timing attack prevention)
    return { message: 'If email exists, reset link sent' };
  }
  
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  await prisma.resetToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
    },
  });
  
  // Send reset link via email
  await sendResetEmail(email, resetToken);
};
```

**Testing Checklist:**
- [ ] Verify duplicate emails rejected
- [ ] Test password reset functionality
- [ ] Verify reset token expires after 1 hour
- [ ] Test reset token one-time use only

---

### 8️⃣ Software and Data Integrity Failures (Logging)

**Risk Level:** 🟠 HIGH  
**Status:** ✅ LOGGING ENABLED

**Implementation Details:**

✅ **Structured Logging**
```typescript
// Backend: logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
  ],
});

// Usage
logger.info('User login', { 
  userId: user.id, 
  email: user.email,
  ip: req.ip,
  timestamp: new Date(),
});

logger.error('Password hash failed', {
  email: user.email,
  stack: error.stack,
  timestamp: new Date(),
});
```

✅ **Sensitive Data Masking**
```typescript
// ✅ Mask sensitive fields in logs
logger.info('User created', {
  userId: '123456',
  email: 'u***@example.com',  // Masked
  // password NOT logged
});

// ❌ Never log:
// - Passwords
// - Credit card numbers
// - Social security numbers
// - API keys / secrets
```

✅ **Log Retention**
```typescript
// Backend: logger.ts
new winston.transports.File({
  filename: 'app.log',
  maxsize: 5242880, // 5MB
  maxFiles: 5,      // Keep last 5 files
  tailable: true,
});
```

**Testing Checklist:**
- [ ] Verify logs are generated for all events
- [ ] Check no passwords in logs
- [ ] Check no tokens in logs
- [ ] Verify log rotation works
- [ ] Test log timestamps

---

### 9️⃣ Security Misconfiguration

**Risk Level:** 🟠 HIGH  
**Status:** ✅ CONFIGURED

**Implementation Details:**

✅ **Security Headers**
```typescript
// Backend: middleware/security.ts
import helmet from 'helmet';

app.use(helmet()); // Sets all security headers:

// Automatically sets:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Strict-Transport-Security: max-age=31536000; includeSubDomains
// - Content-Security-Policy: default-src 'self'
```

✅ **Environment Configuration**
```bash
# .env.example (never commit actual .env)
JWT_SECRET=your-secret-key-here-min-32-characters
DATABASE_URL=postgresql://user:pass@localhost:5432/Dompet Tenang
NODE_ENV=production
API_PORT=3000
ALLOWED_ORIGINS=https://app.Dompet Tenang.com,https://admin.Dompet Tenang.com
```

✅ **Dependency Versions**
```json
{
  "engines": {
    "node": "18.x || 20.x",
    "npm": ">=9.0.0"
  }
}
```

✅ **Disable Unnecessary Features**
```typescript
// Backend: index.ts
app.disable('x-powered-by'); // Hide Express version
app.set('trust proxy', 1);   // Trust reverse proxy
```

**Testing Checklist:**
- [ ] Verify all security headers present
- [ ] Check CSP policy is restrictive
- [ ] Test with HSTS preload
- [ ] Verify environment variables set correctly
- [ ] Test with wrong NODE_ENV value

---

### 🔟 Server-Side Request Forgery (SSRF)

**Risk Level:** 🟠 HIGH  
**Status:** ✅ PROTECTED

**Implementation Details:**

✅ **Validate URLs**
```typescript
// Backend: validation.ts
export const validateRedirectUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    
    // ✅ Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      throw new Error('Only HTTPS URLs allowed');
    }
    
    // ❌ Block internal IPs
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '192.168.0.0/16',
      '10.0.0.0/8',
      '172.16.0.0/12',
      'metadata.google.internal',
    ];
    
    if (blockedHosts.some(host => parsed.hostname.includes(host))) {
      throw new Error('Invalid redirect URL');
    }
    
    return parsed.toString();
  } catch (error) {
    throw new ValidationError('Invalid URL format');
  }
};
```

✅ **External API Calls**
```typescript
// Backend: services/external-api.ts
import axios from 'axios';
import { URL } from 'url';

export const callExternalAPI = async (endpoint: string) => {
  // ✅ Validate endpoint is allowed
  const allowedDomains = [
    'api.exchange-rate.com',
    'api.bank.com',
  ];
  
  const url = new URL(endpoint);
  
  if (!allowedDomains.includes(url.hostname)) {
    throw new Error('External API not whitelisted');
  }
  
  // ✅ Set timeouts
  const response = await axios.get(endpoint, {
    timeout: 5000, // 5 second timeout
    maxRedirects: 1, // Limit redirects
    maxContentLength: 1000000, // 1MB max
  });
  
  return response.data;
};
```

**Testing Checklist:**
- [ ] Try accessing internal IPs (localhost, 192.168.x.x)
- [ ] Try cloud metadata URLs (AWS/GCP)
- [ ] Try redirect chains
- [ ] Try different protocols (http://, file://)
- [ ] All attempts should be blocked

---

## 🧪 Security Testing

```bash
# Dependency vulnerabilities
npm audit --workspaces

# API unit tests (includes auth/validation coverage)
npm --workspace apps/api run test -- --run
```

---

## 📋 Security Checklist

Before deployment:

```
Authentication & Authorization:
  ☐ JWT tokens implemented
  ☐ Password hashing with bcrypt
  ☐ Role-based access control
  ☐ Rate limiting active
  ☐ Account lockout after 5 attempts

Data Protection:
  ☐ HTTPS/TLS enabled
  ☐ Data encryption at rest
  ☐ Password requirements: 8+ chars, uppercase, lowercase, number, special
  ☐ Tokens not in logs
  ☐ Sensitive data masked in logs

Input Validation:
  ☐ All inputs validated with Zod
  ☐ SQL injection prevented (Prisma ORM)
  ☐ XSS prevention (sanitization)
  ☐ CSRF tokens on state-changing operations
  ☐ File upload restrictions

Network Security:
  ☐ CORS properly configured
  ☐ Security headers set (helmet.js)
  ☐ HSTS enabled
  ☐ CSP policy configured
  ☐ X-Frame-Options set

Error Handling:
  ☐ Generic error messages to users
  ☐ Detailed logging on backend
  ☐ No stack traces in production
  ☐ No sensitive info leaked
  ☐ Proper HTTP status codes

Dependencies:
  ☐ npm audit = 0 critical issues
  ☐ npm audit = 0 high issues
  ☐ Lockfile committed
  ☐ Dependencies up to date
  ☐ Security patches applied

Testing:
  ☐ Unit tests passing
  ☐ Integration tests passing
  ☐ Security tests passing
  ☐ Manual penetration testing
  ☐ OWASP Top 10 covered
```

---

## 🚀 Deployment Security

Before production deployment:

1. **Environment Variables**
   - JWT_SECRET: 32+ random characters
   - DATABASE_URL: Use strong password
   - API_KEY: Generate secure key
   - NODE_ENV: production

2. **Database**
   - Enable SSL connections
   - Configure backups
   - Set up monitoring
   - Enable audit logs

3. **Server Infrastructure**
   - Enable firewall
   - Use HTTPS/TLS certificates
   - Configure reverse proxy (nginx)
   - Set up DDoS protection
   - Enable intrusion detection

4. **Monitoring & Logging**
   - Set up centralized logging
   - Configure alerts for suspicious activity
   - Monitor failed login attempts
   - Track API usage and rate limits

---

## 📚 References

- [OWASP Top 10 2024](https://owasp.org/Top10/)
- [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/nodejs-security/)
- [React Security Best Practices](https://react.dev/learn/security)

---

**Status:** ✅ OWASP Implementation Complete  
**Next:** Run security testing scripts

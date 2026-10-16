# Dompet Tenang Security Audit Checklist

**Last updated:** August 2026  
**Scope:** API, Web, Mobile  
**Target score:** OWASP Top 10 alignment (≥ 95/100)

---

## Authentication & Session

- [x] Passwords hashed with bcrypt (cost ≥ 12)
- [x] JWT access + refresh token flow
- [x] HttpOnly cookies on web; SecureStore on mobile
- [x] Rate limiting on `/auth/*`
- [ ] Rotate JWT secrets in production deployment
- [ ] Short-lived access tokens enforced in production config review

## Authorization

- [x] Protected routes require auth middleware
- [x] User-scoped queries (`userId` filter) on expenses/categories/budgets
- [x] Private upload content served via authenticated endpoint
- [ ] Periodic review of new endpoints (budget, recurring)

## Input Validation

- [x] Zod schemas on auth, expenses, categories, budgets
- [x] File upload type/size limits (Multer)
- [ ] Fuzz testing on budget/recurring endpoints

## Data Protection

- [x] `.env` excluded from git
- [ ] Production `DATABASE_URL` uses TLS
- [ ] Secrets stored in platform vault (Railway/Vercel/EAS), not repo

## Transport & CORS

- [x] Helmet security headers
- [x] CORS restricted to configured origin
- [ ] Force HTTPS in production reverse proxy

## Logging & Monitoring

- [ ] Sentry / error tracking in production
- [ ] Audit log for auth failures and rate-limit hits
- [ ] Alerting on 5xx spike

## Dependency & CI

- [x] GitHub Actions CI pipeline present
- [x] Security workflow present
- [ ] Enable strict CI (fail on build/test errors)
- [ ] Scheduled `npm audit` review

## Mobile-Specific

- [x] Tokens in SecureStore (not AsyncStorage plaintext)
- [x] API URL configurable per environment (EAS env)
- [ ] Certificate pinning (future, if required)

## Recommended Next Audit Actions

1. Deploy staging and run OWASP ZAP baseline scan
2. Run `npm audit` on API/web workspaces
3. Document production secret rotation procedure
4. Add integration tests for budget authorization boundaries

---

**Status:** Core controls implemented; production hardening and monitoring pending deployment phase.

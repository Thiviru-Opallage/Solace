# Solace Backend Testing Guide

Solace features an automated testing framework powered by **Vitest** and **Supertest**. Tests run against the high-fidelity in-memory repository layer (`REPO_MODE=memory`), requiring zero external databases or mocking setup.

---

## 1. Running Tests

```powershell
# In the server directory:
cd "c:\Users\User\Desktop\3rd year\Decision Analytics\Semester 2\solace\server"

# Run all test suites once
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 2. Test Architecture

The tests interact with the full Express application through the HTTP interface using Supertest.

```
                  ┌──────────────────────┐
                  │    Supertest HTTP    │
                  └──────────┬───────────┘
                             │
                  ▼──────────┴───────────▼
                 [   Express App Stack   ]
                 - Security Headers & CORS
                 - Rate Limiting & Anti-NoSQL
                 - Authentication & CSRF
                 - RBAC / DAC / MAC Guards
                             │
                  ▼──────────┴───────────▼
                 [   Memory Repositories ]
                 (Zero DB Setup Required)
```

---

## 3. Test Suites Overview

| Suite | File | Coverage Areas |
|---|---|---|
| **Authentication** | `tests/auth.test.ts` | CSRF token issuance, customer registration, Argon2id login, incorrect password handling, lockout mechanism, token revocation, logout. |
| **Policies & DAC** | `tests/policies.test.ts` | Agent policy creation, customer policy creation prohibition (RBAC 403), policy sharing with other customers, share revocation (DAC). |
| **Claims & MAC** | `tests/claims.test.ts` | Customer claim filing, automatic MAC classification, adjuster review & notes, claim status approval, payment disbursement recording. |
| **Analytics** | `tests/analytics.test.ts` | Adjuster/Agent analytics access, customer denial (RBAC 403), KPI and chart payload verification. |

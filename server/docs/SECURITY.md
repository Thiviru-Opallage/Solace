# Solace Security Architecture & OWASP Implementation

This document details the focused, multi-tiered security controls implemented across the Solace Insurance Platform in accordance with the core principles of the **OWASP Top 10** tailored to a modern document-oriented (NoSQL) architecture.

---

## 1. 6-Pillar OWASP Security Matrix

```
┌──────────────────────────────────────┬─────────────────────────────────────────────────┐
│ OWASP Pillar                         │ Solace Concrete Implementation                  │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ 1. A01: Broken Access Control        │ • Multi-role RBAC (Customer, Agent, Adjuster)   │
│                                      │ • Scoped ownership queries (no cross-tenant leak│
│                                      │ • Strict endpoint protection (/api/users guarded│
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ 2. A02: Security Misconfiguration    │ • Secure .env configuration (zero hardcoding)   │
│                                      │ • Helmet security headers & CSP controls        │
│                                      │ • Masked debug info & disabled verbose stacks   │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ 3. A04: Cryptographic Failures       │ • Strong salted password hashing (Argon2id/     │
│                                      │   bcrypt) with standard iteration depth         │
│                                      │ • Pinned signature algorithm (HS256) for JWT    │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ 4. A05: Injection & XSS Defense      │ • Recursive NoSQL operator injection scanner    │
│                                      │   (rejects $, ., __proto__, constructor keys)   │
│                                      │ • Framework-level contextual JSX escaping       │
│                                      │ • Text sanitization on claims and notes fields  │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ 5. A07: Authentication Failures      │ • Stateless `Authorization: Bearer <JWT>` auth  │
│                                      │ • Token expiration enforcement & versioning     │
│                                      │ • Rate limiting on auth routes (brute-force)    │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ 6. A10: Exceptional Conditions       │ • Global centralized error handler              │
│                                      │ • Sanitized JSON responses (no leaked DB schemas│
└──────────────────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 2. Authentication & Stateless Token Management (OWASP A07 & A04)

- **Password Hashing**: Stored passwords hashed with industry-standard cryptographic salt rounds (`Argon2id` / `bcrypt`).
- **Stateless Bearer Tokens**: Authenticated API requests transmit tokens using the standard `Authorization: Bearer <JWT>` header.
- **CSRF Elimination by Design**: Because cross-origin requests in browsers do not automatically send custom `Authorization` headers, cross-site request forgery attacks are fundamentally prevented at the protocol layer.
- **Session Expiration**: Access tokens are short-lived, with cryptographically secure refresh token rotation to manage session longevity.

---

## 3. Role-Based Access Control & Document Scoping (OWASP A01)

Solace enforces a strict Role $\times$ Resource permission matrix across the three defined business personas:

```
                  ┌─────────────────────────────────┐
                  │          Request Entry          │
                  └────────────────┬────────────────┘
                                   │
                  ▼────────────────┴────────────────▼
                 [       JWT Bearer Verification     ]
                 (Validates Signature & Expiration)
                                   │
                  ▼────────────────┴────────────────▼
                 [        RBAC Route Guards          ]
                 (Role × Resource Permission Check)
                                   │
                  ▼────────────────┴────────────────▼
                 [       NoSQL Document Scoping      ]
                 - Customer: own policies & claims
                 - Agent: customer portfolio management
                 - Adjuster: claim review queue
```

### Role Permissions:
- **`customer`**: Can read their own policies, create/track their own claims, upload claim evidence, and update their own personal profile. Cannot list or query other customer accounts.
- **`agent`**: Can create and update policies for clients, view customer portfolios, and access business analytics.
- **`adjuster`**: Can access claims requiring review, add official assessment notes, approve/reject claims, trigger claim disbursements, and view analytics.

---

## 4. NoSQL Injection & Input Sanitization (OWASP A05)

- **NoSQL Operator Injection Prevention**: An Express middleware recursively inspects all incoming JSON request bodies and query parameters. Any payload attempting MongoDB operator injection (such as `{"$ne": null}`, `{"$gt": ""}`, or `$where`) is immediately rejected with HTTP 400.
- **Cross-Site Scripting (XSS) Mitigation**: All user-provided free-text inputs (incident descriptions, adjuster notes) are sanitized and stripped of executable scripts, while client-side rendering relies on React/Next.js contextual JSX escaping.

---

## 5. Security Misconfiguration & Error Handling (OWASP A02 & A10)

- **Zero Hardcoded Credentials**: Database connection strings, encryption secrets, and JWT signing keys are strictly loaded via `.env` variables validated at application startup.
- **Centralized Exception Shield**: A global Express error handler intercepts all unhandled database and runtime errors, returning sanitized, user-safe error messages while logging incident IDs internally. Internal database schemas, collection names, and stack traces are never exposed to the client.

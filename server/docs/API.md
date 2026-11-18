# Solace Backend API Reference

Base URL: `/api`  
All protected routes require an active session via httpOnly cookies (`solace_access_token`).  
All state-changing endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) require a CSRF token passed in the `X-CSRF-Token` header.

---

## 1. Authentication (`/api/auth`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/auth/csrf` | Public | All | Generates and returns a double-submit CSRF token. |
| `POST` | `/api/auth/register` | Public | Customer | Registers a new customer account. |
| `POST` | `/api/auth/login` | Public | All | Authenticates user; sets httpOnly access + refresh token cookies. |
| `POST` | `/api/auth/refresh` | Public | All | Rotates refresh token and issues a new access token. |
| `POST` | `/api/auth/logout` | Optional | All | Invalidates the active refresh token family and clears cookies. |
| `GET` | `/api/auth/me` | Authenticated | All | Returns currently authenticated user profile. |
| `POST` | `/api/auth/change-password` | Authenticated | All | Updates user password, increments `tokenVersion`, invalidates sessions. |

---

## 2. Users (`/api/users`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/users/me` | Authenticated | All | Returns own user profile. |
| `PATCH` | `/api/users/me` | Authenticated | All | Updates own profile (`name`, `phone`, `nic`). |
| `POST` | `/api/users/me/reveal` | Authenticated | All | Reveals decrypted sensitive PII (`phone` or `nic`). Rate-limited. |
| `GET` | `/api/users` | Authenticated | Agent | Lists registered customers (supports `?search=` and pagination). |

---

## 3. Policies (`/api/policies`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/policies` | Authenticated | All | Lists policies scoped to caller (customer: owned/shared; agent: managed). |
| `POST` | `/api/policies` | Authenticated | Agent | Creates a new policy with auto-generated policy number. |
| `GET` | `/api/policies/:id` | Authenticated | All | Fetches a single policy by ID (enforces DAC ownership for customers). |
| `PATCH` | `/api/policies/:id` | Authenticated | Agent | Updates policy coverage, premium, or renewal date. |
| `POST` | `/api/policies/:id/share` | Authenticated | Customer | Shares policy read access with another registered customer email (DAC). |
| `DELETE` | `/api/policies/:id/share/:userId` | Authenticated | Customer | Revokes shared access from a customer. |

---

## 4. Claims (`/api/claims`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/claims` | Authenticated | All | Lists claims scoped by role and adjuster MAC clearance. |
| `POST` | `/api/claims` | Authenticated | Customer | Files a new claim. Auto-classified (`standard`/`confidential`/`restricted`). |
| `GET` | `/api/claims/:id` | Authenticated | All | Fetches claim by ID. Adjusters must have clearance $\ge$ claim classification level. |
| `PATCH` | `/api/claims/:id/status` | Authenticated | Adjuster | Advances claim status via strict lifecycle validation. |
| `POST` | `/api/claims/:id/notes` | Authenticated | Adjuster | Adds an internal adjuster note with timestamp and author. |
| `POST` | `/api/claims/:id/respond-info` | Authenticated | Customer | Submits additional information for `Info Requested` claims. |
| `POST` | `/api/claims/:id/documents` | Authenticated | Customer | Uploads files (PDF/PNG/JPEG, $\le$ 5MB each) with MIME magic byte checks. |
| `GET` | `/api/claims/events` | Authenticated | Adjuster | Server-Sent Events (SSE) stream of all claim queue changes. |
| `GET` | `/api/claims/events/:claimId` | Authenticated | All | Server-Sent Events (SSE) live stream for a specific claim. |

---

## 5. Payments (`/api/payments`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/payments` | Authenticated | All | Lists payment disbursements scoped to caller's claims. |
| `POST` | `/api/payments` | Authenticated | Adjuster | Records disbursement for an `Approved` claim and transitions status to `Paid`. |

---

## 6. Analytics (`/api/analytics`)

| Method | Path | Auth | Roles | Description |
|---|---|---|---|---|
| `GET` | `/api/analytics/kpis` | Authenticated | Agent, Adjuster | KPI metrics (total claims, payouts, avg turnaround, approval rate). |
| `GET` | `/api/analytics/claims-by-status` | Authenticated | Agent, Adjuster | Claim counts grouped by status with chart color mappings. |
| `GET` | `/api/analytics/avg-days-by-policy` | Authenticated | Agent, Adjuster | Average resolution turnaround days grouped by policy type. |
| `GET` | `/api/analytics/payouts-by-policy` | Authenticated | Agent, Adjuster | Total payout amounts grouped by policy type. |
| `GET` | `/api/analytics/claims-per-month` | Authenticated | Agent, Adjuster | 6-month historical monthly breakdown (submitted, approved, rejected). |

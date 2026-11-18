# Solace Data Models & Schema Design

This document details the entity schemas, database constraints, and recommended MongoDB collections.

---

## 1. Collections & Entities

### `users`
Represents customer, agent, and adjuster accounts.

```typescript
interface UserEntity {
  _id: string;                      // Unique ID (ObjectId string)
  name: string;                     // Full name (max 100 chars)
  email: string;                    // Normalized lowercase email (Unique Index)
  role: "customer" | "agent" | "adjuster";
  passwordHash: string;             // Argon2id hash
  phoneEncrypted?: string;          // AES-256-GCM encrypted
  nicEncrypted?: string;            // AES-256-GCM encrypted
  clearance?: 1 | 2 | 3;            // For adjusters (1=Standard, 2=Confidential, 3=Restricted)
  failedLoginCount: number;         // For brute-force lockout
  lockUntil: string | null;         // ISO timestamp of lockout expiration
  tokenVersion: number;             // For immediate token revocation on password change
  createdAt: string;                // ISO-8601
  updatedAt: string;                // ISO-8601
}
```

**Recommended MongoDB Indexes:**
- `{ email: 1 }` (Unique)
- `{ role: 1 }`

---

### `policies`
Represents insurance policies across Motor, Health, Home, and Travel lines.

```typescript
interface PolicyEntity {
  _id: string;
  policyNumber: string;             // Unique code, e.g. "MO-1042" (Unique Index)
  type: "motor" | "health" | "home" | "travel";
  customerId: string;               // Reference to users._id
  agentId: string;                  // Reference to users._id
  coverage: {
    amount: number;
    deductible: number;
  };
  premium: {
    amount: number;
    frequency: "monthly" | "quarterly" | "annual";
  };
  renewalDate: string;              // YYYY-MM-DD
  status: "active" | "expired" | "cancelled";
  details: PolicyDetails;           // Discriminated union by type
  sharedWith: Array<{               // DAC shared access list
    userId: string;
    userEmail: string;
    userName: string;
    grantedAt: string;
    permission: "read";
  }>;
  createdAt: string;
  updatedAt: string;
}
```

**Recommended MongoDB Indexes:**
- `{ policyNumber: 1 }` (Unique)
- `{ customerId: 1 }`
- `{ agentId: 1 }`
- `{ "sharedWith.userId": 1 }`

---

### `claims`
Represents submitted claims and their status lifecycle.

```typescript
interface ClaimEntity {
  _id: string;
  claimNumber: string;             // Unique code, e.g. "CLM-2025-0104" (Unique Index)
  policyId: string;                // Reference to policies._id
  customerId: string;              // Reference to users._id
  incident: {
    date: string;                  // YYYY-MM-DD
    location: string;
    description: string;
  };
  claimedAmount: number;
  classification: "standard" | "confidential" | "restricted";
  classificationLevel: 1 | 2 | 3;  // MAC required clearance level
  documents: Array<{
    id: string;
    fileName: string;
    url: string;
    type: string;                  // MIME type verified by magic bytes
    uploadedAt: string;
    fileSize?: string;
    storedFileName?: string;
  }>;
  adjusterNotes: Array<{
    id: string;
    adjusterId: string;
    adjusterName: string;
    note: string;
    createdAt: string;
  }>;
  statusHistory: Array<{
    status: "Pending" | "Under Review" | "Info Requested" | "Approved" | "Rejected" | "Paid";
    by: string;
    byRole?: "customer" | "agent" | "adjuster";
    at: string;
    comment?: string;
  }>;
  currentStatus: "Pending" | "Under Review" | "Info Requested" | "Approved" | "Rejected" | "Paid";
  createdAt: string;
  updatedAt: string;
}
```

**Recommended MongoDB Indexes:**
- `{ claimNumber: 1 }` (Unique)
- `{ customerId: 1 }`
- `{ policyId: 1 }`
- `{ currentStatus: 1 }`
- `{ classificationLevel: 1 }`

---

### `payments`
Disbursements recorded for approved claims.

```typescript
interface PaymentEntity {
  _id: string;
  claimId: string;                 // Reference to claims._id (Unique Index)
  claimNumber?: string;
  policyNumber?: string;
  amount: number;
  method: "Bank Transfer" | "Direct Deposit" | "Cheque";
  paidAt: string;
  reference: string;               // Unique transaction reference
  recordedBy: string;              // Reference to users._id (adjuster)
  recordedByName?: string;
  createdAt: string;
}
```

**Recommended MongoDB Indexes:**
- `{ claimId: 1 }` (Unique — 1:1 claim-to-payment constraint)
- `{ reference: 1 }` (Unique)

---

### `refreshTokens`
Active session refresh tokens with family reuse detection.

```typescript
interface RefreshTokenEntity {
  _id: string;
  tokenHash: string;               // SHA-256 hash of token (Unique Index)
  familyId: string;                // UUID grouping rotated tokens
  userId: string;                  // Reference to users._id
  expiresAt: string;
  isRevoked: boolean;
  replacedByTokenHash?: string;
  createdAt: string;
}
```

**Recommended MongoDB Indexes:**
- `{ tokenHash: 1 }` (Unique)
- `{ familyId: 1 }`
- `{ userId: 1 }`
- `{ expiresAt: 1 }` (TTL index for automatic cleanup)

---

### `auditLogs`
Append-only immutable audit trail.

```typescript
interface AuditLogEntity {
  _id: string;
  action: string;                  // e.g. "LOGIN_SUCCESS", "CLAIM_CREATE", "PAYMENT_RECORD"
  actorId?: string;
  actorRole?: "customer" | "agent" | "adjuster";
  targetId?: string;
  targetType?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}
```

**Recommended MongoDB Indexes:**
- `{ timestamp: -1 }`
- `{ actorId: 1 }`
- `{ action: 1 }`

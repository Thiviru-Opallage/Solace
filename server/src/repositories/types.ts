export type Role = "customer" | "agent" | "adjuster";
export type PolicyType = "motor" | "health" | "home" | "travel";
export type PolicyStatus = "active" | "expired" | "cancelled" | "pending";
export type ClaimStatus =
  | "Pending"
  | "Under Review"
  | "Info Requested"
  | "Approved"
  | "Rejected"
  | "Paid";
export type Classification = "standard" | "confidential" | "restricted";
export type ClearanceLevel = 1 | 2 | 3;

export interface MotorDetails {
  make: string;
  model: string;
  registrationNumber: string;
  manufactureYear: number;
}

export interface HealthDetails {
  dependents: string[];
  network: "Standard" | "Comprehensive" | "Global";
  roomType: "Private" | "Semi-Private" | "Deluxe";
}

export interface HomeDetails {
  propertyAddress: string;
  propertyValue: number;
  constructionYear: number;
}

export interface TravelDetails {
  destination: string;
  departureDate: string;
  returnDate: string;
  travellersCount: number;
}

export type PolicyDetails =
  | { type: "motor"; motor: MotorDetails }
  | { type: "health"; health: HealthDetails }
  | { type: "home"; home: HomeDetails }
  | { type: "travel"; travel: TravelDetails };

export interface SharedAccess {
  userId: string;
  userEmail: string;
  userName: string;
  grantedAt: string;
  permission: "read";
}

export interface ClaimDocument {
  id: string;
  fileName: string;
  url: string;
  type: string;
  uploadedAt: string;
  fileSize?: string;
  storedFileName?: string;
}

export interface AdjusterNote {
  id: string;
  adjusterId: string;
  adjusterName: string;
  note: string;
  createdAt: string;
}

export interface StatusHistoryItem {
  status: ClaimStatus;
  by: string;
  byRole?: Role;
  at: string;
  comment?: string;
}

// Domain Entities
export interface UserEntity {
  _id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
  phoneEncrypted?: string;
  nicEncrypted?: string;
  clearance?: ClearanceLevel;
  failedLoginCount: number;
  lockUntil: string | null;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyEntity {
  _id: string;
  policyNumber: string;
  type: PolicyType;
  customerId: string;
  agentId: string;
  coverage: {
    amount: number;
    deductible: number;
  };
  premium: {
    amount: number;
    frequency: "monthly" | "quarterly" | "annual";
  };
  renewalDate: string;
  status: PolicyStatus;
  details: PolicyDetails;
  sharedWith: SharedAccess[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaimEntity {
  _id: string;
  claimNumber: string;
  policyId: string;
  customerId: string;
  incident: {
    date: string;
    location: string;
    description: string;
  };
  claimedAmount: number;
  classification: Classification;
  classificationLevel: ClearanceLevel; // 1 (standard), 2 (confidential), 3 (restricted)
  documents: ClaimDocument[];
  adjusterNotes: AdjusterNote[];
  statusHistory: StatusHistoryItem[];
  currentStatus: ClaimStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentEntity {
  _id: string;
  claimId: string;
  claimNumber?: string;
  policyNumber?: string;
  amount: number;
  method: "Bank Transfer" | "Direct Deposit" | "Cheque";
  paidAt: string;
  reference: string;
  recordedBy: string;
  recordedByName?: string;
  createdAt: string;
}

export interface RefreshTokenEntity {
  _id: string;
  tokenHash: string;
  familyId: string;
  userId: string;
  expiresAt: string;
  isRevoked: boolean;
  replacedByTokenHash?: string;
  createdAt: string;
}

export interface AuditLogEntity {
  _id: string;
  action: string;
  actorId?: string;
  actorRole?: Role;
  targetId?: string;
  targetType?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface CounterEntity {
  _id: string;
  seq: number;
}

// Scopes
export type PolicyScope =
  | { type: "all" }
  | { type: "customer"; userId: string; includeShared?: boolean }
  | { type: "agent"; agentId: string }
  | { type: "adjuster" };

export type ClaimScope =
  | { type: "all" }
  | { type: "customer"; userId: string; sharedPolicyIds: string[] }
  | { type: "agent"; agentId: string; managedPolicyIds: string[] }
  | { type: "adjuster"; maxClassificationLevel: number };

export type PaymentScope =
  | { type: "all" }
  | { type: "customer"; customerClaimIds: string[] }
  | { type: "adjuster"; allowedClaimIds?: string[] };

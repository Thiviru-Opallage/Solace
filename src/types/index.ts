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

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  nic?: string;
  clearance?: ClearanceLevel;
  createdAt: string;
}

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

export interface Policy {
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
}

export interface ClaimDocument {
  id: string;
  fileName: string;
  url: string;
  type: string;
  uploadedAt: string;
  fileSize?: string;
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

export interface Claim {
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
  documents: ClaimDocument[];
  adjusterNotes: AdjusterNote[];
  statusHistory: StatusHistoryItem[];
  currentStatus: ClaimStatus;
  createdAt: string;
}

export interface Payment {
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
}

export interface AnalyticsKpi {
  totalClaims: number;
  totalPayouts: number;
  avgDaysToDecision: number;
  approvalRate: number;
}

export interface ClaimsByStatusItem {
  status: ClaimStatus;
  count: number;
  color?: string;
}

export interface AvgDaysByPolicyItem {
  policyType: PolicyType;
  label: string;
  avgDays: number;
}

export interface PayoutsByPolicyItem {
  policyType: PolicyType;
  label: string;
  amount: number;
}

export interface ClaimsPerMonthItem {
  month: string;
  submitted: number;
  approved: number;
  rejected: number;
}

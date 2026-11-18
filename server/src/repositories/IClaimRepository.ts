import {
  ClaimEntity,
  ClaimScope,
  ClaimStatus,
  Classification,
  ClaimDocument,
  AdjusterNote,
  StatusHistoryItem,
} from "./types.js";

export interface ClaimFilterCriteria {
  scope: ClaimScope;
  customerId?: string;
  policyId?: string;
  status?: ClaimStatus;
  classification?: Classification;
  search?: string;
  limit?: number;
  skip?: number;
}

export interface CreateClaimData {
  _id?: string;
  claimNumber: string;
  policyId: string;
  customerId: string;
  incident: ClaimEntity["incident"];
  claimedAmount: number;
  classification: Classification;
  classificationLevel: ClaimEntity["classificationLevel"];
  documents: ClaimDocument[];
  adjusterNotes?: AdjusterNote[];
  statusHistory: StatusHistoryItem[];
  currentStatus: ClaimStatus;
}

export interface IClaimRepository {
  findById(id: string, scope?: ClaimScope): Promise<ClaimEntity | null>;
  findByClaimNumber(claimNumber: string): Promise<ClaimEntity | null>;
  find(criteria: ClaimFilterCriteria): Promise<ClaimEntity[]>;
  create(data: CreateClaimData): Promise<ClaimEntity>;
  updateStatus(
    id: string,
    newStatus: ClaimStatus,
    historyItem: StatusHistoryItem,
    expectedCurrentStatus?: ClaimStatus
  ): Promise<ClaimEntity | null>;
  addNote(id: string, note: AdjusterNote, scope?: ClaimScope): Promise<ClaimEntity | null>;
  addDocuments(
    id: string,
    documents: ClaimDocument[],
    historyItem?: StatusHistoryItem,
    newStatus?: ClaimStatus
  ): Promise<ClaimEntity | null>;
  count(criteria: Omit<ClaimFilterCriteria, "limit" | "skip">): Promise<number>;
}

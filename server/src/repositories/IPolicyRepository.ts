import { PolicyEntity, PolicyScope, PolicyType, PolicyStatus, SharedAccess } from "./types.js";

export interface PolicyFilterCriteria {
  scope: PolicyScope;
  customerId?: string;
  agentId?: string;
  type?: PolicyType;
  status?: PolicyStatus;
  search?: string;
  limit?: number;
  skip?: number;
}

export interface CreatePolicyData {
  _id?: string;
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
  details: PolicyEntity["details"];
  sharedWith?: SharedAccess[];
}

export interface IPolicyRepository {
  findById(id: string, scope?: PolicyScope): Promise<PolicyEntity | null>;
  findByPolicyNumber(policyNumber: string): Promise<PolicyEntity | null>;
  find(criteria: PolicyFilterCriteria): Promise<PolicyEntity[]>;
  create(data: CreatePolicyData): Promise<PolicyEntity>;
  update(id: string, updates: Partial<PolicyEntity>, scope?: PolicyScope): Promise<PolicyEntity | null>;
  addSharedAccess(policyId: string, share: SharedAccess, ownerCustomerId: string): Promise<PolicyEntity | null>;
  removeSharedAccess(policyId: string, targetUserId: string, ownerCustomerId: string): Promise<PolicyEntity | null>;
  count(criteria: Omit<PolicyFilterCriteria, "limit" | "skip">): Promise<number>;
}

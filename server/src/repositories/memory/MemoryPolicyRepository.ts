import { IPolicyRepository, PolicyFilterCriteria, CreatePolicyData } from "../IPolicyRepository.js";
import { PolicyEntity, PolicyScope, SharedAccess } from "../types.js";
import crypto from "node:crypto";

export class MemoryPolicyRepository implements IPolicyRepository {
  private policies = new Map<string, PolicyEntity>();

  private matchesScope(policy: PolicyEntity, scope?: PolicyScope): boolean {
    if (!scope || scope.type === "all" || scope.type === "adjuster") {
      return true;
    }
    if (scope.type === "agent") {
      return policy.agentId === scope.agentId || policy.status === "pending";
    }
    if (scope.type === "customer") {
      const isOwner = policy.customerId === scope.userId;
      const isShared =
        scope.includeShared !== false &&
        policy.sharedWith.some((s) => s.userId === scope.userId);
      return isOwner || isShared;
    }
    return false;
  }

  async findById(id: string, scope?: PolicyScope): Promise<PolicyEntity | null> {
    const policy = this.policies.get(id);
    if (!policy) return null;
    if (!this.matchesScope(policy, scope)) {
      return null;
    }
    return { ...policy };
  }

  async findByPolicyNumber(policyNumber: string): Promise<PolicyEntity | null> {
    for (const policy of this.policies.values()) {
      if (policy.policyNumber === policyNumber) {
        return { ...policy };
      }
    }
    return null;
  }

  async find(criteria: PolicyFilterCriteria): Promise<PolicyEntity[]> {
    const results: PolicyEntity[] = [];
    const searchLower = criteria.search?.toLowerCase().trim();

    for (const policy of this.policies.values()) {
      if (!this.matchesScope(policy, criteria.scope)) {
        continue;
      }
      if (criteria.customerId) {
        const isOwner = policy.customerId === criteria.customerId;
        const isShared = policy.sharedWith.some((s) => s.userId === criteria.customerId);
        if (!isOwner && !isShared) continue;
      }
      if (criteria.agentId && policy.agentId !== criteria.agentId) {
        continue;
      }
      if (criteria.type && policy.type !== criteria.type) {
        continue;
      }
      if (criteria.status && policy.status !== criteria.status) {
        continue;
      }
      if (searchLower) {
        const matchesNum = policy.policyNumber.toLowerCase().includes(searchLower);
        const matchesType = policy.type.toLowerCase().includes(searchLower);
        if (!matchesNum && !matchesType) continue;
      }
      results.push({ ...policy });
    }

    // Default sort by renewalDate ascending
    results.sort((a, b) => new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime());

    const skip = criteria.skip || 0;
    const limit = criteria.limit || 50;
    return results.slice(skip, skip + limit);
  }

  async create(data: CreatePolicyData): Promise<PolicyEntity> {
    const existing = await this.findByPolicyNumber(data.policyNumber);
    if (existing) {
      const err = new Error(`E11000 duplicate key error: policyNumber ${data.policyNumber} already exists`);
      (err as unknown as { code: number }).code = 11000;
      throw err;
    }

    const now = new Date().toISOString();
    const id = data._id || `pol-${crypto.randomUUID()}`;
    const policy: PolicyEntity = {
      _id: id,
      policyNumber: data.policyNumber,
      type: data.type,
      customerId: data.customerId,
      agentId: data.agentId,
      coverage: data.coverage,
      premium: data.premium,
      renewalDate: data.renewalDate,
      status: data.status,
      details: data.details,
      sharedWith: data.sharedWith || [],
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(id, policy);
    return { ...policy };
  }

  async update(id: string, updates: Partial<PolicyEntity>, scope?: PolicyScope): Promise<PolicyEntity | null> {
    const policy = this.policies.get(id);
    if (!policy) return null;
    if (!this.matchesScope(policy, scope)) {
      return null;
    }

    const updated: PolicyEntity = {
      ...policy,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.policies.set(id, updated);
    return { ...updated };
  }

  async addSharedAccess(policyId: string, share: SharedAccess, ownerCustomerId: string): Promise<PolicyEntity | null> {
    const policy = this.policies.get(policyId);
    if (!policy) return null;
    if (policy.customerId !== ownerCustomerId) {
      return null; // Not owner
    }

    // Check if already shared
    const existingIndex = policy.sharedWith.findIndex((s) => s.userId === share.userId);
    if (existingIndex >= 0) {
      policy.sharedWith[existingIndex] = share;
    } else {
      policy.sharedWith.push(share);
    }

    policy.updatedAt = new Date().toISOString();
    this.policies.set(policyId, policy);
    return { ...policy };
  }

  async removeSharedAccess(policyId: string, targetUserId: string, ownerCustomerId: string): Promise<PolicyEntity | null> {
    const policy = this.policies.get(policyId);
    if (!policy) return null;
    if (policy.customerId !== ownerCustomerId) {
      return null;
    }

    policy.sharedWith = policy.sharedWith.filter((s) => s.userId !== targetUserId);
    policy.updatedAt = new Date().toISOString();
    this.policies.set(policyId, policy);
    return { ...policy };
  }

  async count(criteria: Omit<PolicyFilterCriteria, "limit" | "skip">): Promise<number> {
    const list = await this.find({ ...criteria, limit: 100000, skip: 0 });
    return list.length;
  }

  clear(): void {
    this.policies.clear();
  }
}

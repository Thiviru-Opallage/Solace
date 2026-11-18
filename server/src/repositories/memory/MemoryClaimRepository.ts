import { IClaimRepository, ClaimFilterCriteria, CreateClaimData } from "../IClaimRepository.js";
import {
  ClaimEntity,
  ClaimScope,
  ClaimStatus,
  ClaimDocument,
  AdjusterNote,
  StatusHistoryItem,
} from "../types.js";
import crypto from "node:crypto";

export class MemoryClaimRepository implements IClaimRepository {
  private claims = new Map<string, ClaimEntity>();

  private matchesScope(claim: ClaimEntity, scope?: ClaimScope): boolean {
    if (!scope || scope.type === "all") {
      return true;
    }
    if (scope.type === "customer") {
      const isOwner = claim.customerId === scope.userId;
      const isSharedPolicy = scope.sharedPolicyIds.includes(claim.policyId);
      return isOwner || isSharedPolicy;
    }
    if (scope.type === "agent") {
      return scope.managedPolicyIds.includes(claim.policyId);
    }
    if (scope.type === "adjuster") {
      // In list views, adjusters see placeholders if above clearance, but in direct scoped queries we check clearance
      return claim.classificationLevel <= scope.maxClassificationLevel;
    }
    return false;
  }

  async findById(id: string, scope?: ClaimScope): Promise<ClaimEntity | null> {
    const claim = this.claims.get(id);
    if (!claim) return null;
    if (scope && !this.matchesScope(claim, scope)) {
      return null;
    }
    return { ...claim };
  }

  async findByClaimNumber(claimNumber: string): Promise<ClaimEntity | null> {
    for (const claim of this.claims.values()) {
      if (claim.claimNumber === claimNumber) {
        return { ...claim };
      }
    }
    return null;
  }

  async find(criteria: ClaimFilterCriteria): Promise<ClaimEntity[]> {
    const results: ClaimEntity[] = [];
    const searchLower = criteria.search?.toLowerCase().trim();

    for (const claim of this.claims.values()) {
      // Scope filter: Note that for adjusters listing all claims, they can see locked placeholders,
      // so if scope is adjuster, we don't exclude above-clearance claims here; the service will mask them!
      if (criteria.scope.type === "customer") {
        if (!this.matchesScope(claim, criteria.scope)) continue;
      } else if (criteria.scope.type === "agent") {
        if (!this.matchesScope(claim, criteria.scope)) continue;
      }

      if (criteria.customerId && claim.customerId !== criteria.customerId) {
        continue;
      }
      if (criteria.policyId && claim.policyId !== criteria.policyId) {
        continue;
      }
      if (criteria.status && claim.currentStatus !== criteria.status) {
        continue;
      }
      if (criteria.classification && claim.classification !== criteria.classification) {
        continue;
      }
      if (searchLower) {
        const matchesNum = claim.claimNumber.toLowerCase().includes(searchLower);
        const matchesDesc = claim.incident.description.toLowerCase().includes(searchLower);
        const matchesLoc = claim.incident.location.toLowerCase().includes(searchLower);
        if (!matchesNum && !matchesDesc && !matchesLoc) continue;
      }
      results.push({ ...claim });
    }

    // Sort by createdAt descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const skip = criteria.skip || 0;
    const limit = criteria.limit || 50;
    return results.slice(skip, skip + limit);
  }

  async create(data: CreateClaimData): Promise<ClaimEntity> {
    const existing = await this.findByClaimNumber(data.claimNumber);
    if (existing) {
      const err = new Error(`E11000 duplicate key error: claimNumber ${data.claimNumber} already exists`);
      (err as unknown as { code: number }).code = 11000;
      throw err;
    }

    const now = new Date().toISOString();
    const id = data._id || `clm-${crypto.randomUUID()}`;
    const claim: ClaimEntity = {
      _id: id,
      claimNumber: data.claimNumber,
      policyId: data.policyId,
      customerId: data.customerId,
      incident: data.incident,
      claimedAmount: data.claimedAmount,
      classification: data.classification,
      classificationLevel: data.classificationLevel,
      documents: data.documents || [],
      adjusterNotes: data.adjusterNotes || [],
      statusHistory: data.statusHistory || [],
      currentStatus: data.currentStatus,
      createdAt: now,
      updatedAt: now,
    };

    this.claims.set(id, claim);
    return { ...claim };
  }

  async updateStatus(
    id: string,
    newStatus: ClaimStatus,
    historyItem: StatusHistoryItem,
    expectedCurrentStatus?: ClaimStatus
  ): Promise<ClaimEntity | null> {
    const claim = this.claims.get(id);
    if (!claim) return null;

    if (expectedCurrentStatus && claim.currentStatus !== expectedCurrentStatus) {
      return null; // Concurrency conflict
    }

    const updated: ClaimEntity = {
      ...claim,
      currentStatus: newStatus,
      statusHistory: [...claim.statusHistory, historyItem],
      updatedAt: new Date().toISOString(),
    };

    this.claims.set(id, updated);
    return { ...updated };
  }

  async addNote(id: string, note: AdjusterNote, scope?: ClaimScope): Promise<ClaimEntity | null> {
    const claim = this.claims.get(id);
    if (!claim) return null;
    if (scope && !this.matchesScope(claim, scope)) {
      return null;
    }

    const updated: ClaimEntity = {
      ...claim,
      adjusterNotes: [...claim.adjusterNotes, note],
      updatedAt: new Date().toISOString(),
    };
    this.claims.set(id, updated);
    return { ...updated };
  }

  async addDocuments(
    id: string,
    documents: ClaimDocument[],
    historyItem?: StatusHistoryItem,
    newStatus?: ClaimStatus
  ): Promise<ClaimEntity | null> {
    const claim = this.claims.get(id);
    if (!claim) return null;

    const updated: ClaimEntity = {
      ...claim,
      documents: [...claim.documents, ...documents],
      ...(historyItem ? { statusHistory: [...claim.statusHistory, historyItem] } : {}),
      ...(newStatus ? { currentStatus: newStatus } : {}),
      updatedAt: new Date().toISOString(),
    };
    this.claims.set(id, updated);
    return { ...updated };
  }

  async count(criteria: Omit<ClaimFilterCriteria, "limit" | "skip">): Promise<number> {
    const list = await this.find({ ...criteria, limit: 100000, skip: 0 });
    return list.length;
  }

  clear(): void {
    this.claims.clear();
  }
}

import { Filter } from "mongodb";
import { IClaimRepository, ClaimFilterCriteria, CreateClaimData } from "../IClaimRepository.js";
import {
  ClaimEntity,
  ClaimScope,
  ClaimStatus,
  ClaimDocument,
  AdjusterNote,
  StatusHistoryItem,
  ClearanceLevel,
} from "../types.js";
import { getCollection, toObjectId, idFilter, normalizeDoc, normalizeDocs } from "./client.js";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class MongoClaimRepository implements IClaimRepository {
  private async getCol() {
    const col = await getCollection("claims");
    await col.createIndex({ claimNumber: 1 }, { unique: true });
    await col.createIndex({ customerId: 1 });
    await col.createIndex({ policyId: 1 });
    await col.createIndex({ classificationLevel: 1 });
    return col;
  }

  private buildScopeFilter(scope?: ClaimScope): Filter<any> {
    if (!scope || scope.type === "all") {
      return {};
    }
    if (scope.type === "customer") {
      return {
        $or: [
          { customerId: scope.userId },
          { policyId: { $in: scope.sharedPolicyIds } },
        ],
      };
    }
    if (scope.type === "agent") {
      return { policyId: { $in: scope.managedPolicyIds } };
    }
    if (scope.type === "adjuster") {
      return { classificationLevel: { $lte: scope.maxClassificationLevel as ClearanceLevel } };
    }
    return {};
  }

  async findById(id: string, scope?: ClaimScope): Promise<ClaimEntity | null> {
    const col = await this.getCol();
    const query: Filter<any> = idFilter(id);
    const scopeFilter = this.buildScopeFilter(scope);

    const doc = await (Object.keys(scopeFilter).length > 0
      ? col.findOne({ $and: [query, scopeFilter] })
      : col.findOne(query));
    return normalizeDoc<ClaimEntity>(doc);
  }

  async findByClaimNumber(claimNumber: string): Promise<ClaimEntity | null> {
    const col = await this.getCol();
    const doc = await col.findOne({ claimNumber });
    return normalizeDoc<ClaimEntity>(doc);
  }

  async find(criteria: ClaimFilterCriteria): Promise<ClaimEntity[]> {
    const col = await this.getCol();
    const andClauses: Filter<any>[] = [];

    // Apply customer/agent scope in listing; adjusters see all claims (masked by service)
    if (criteria.scope.type === "customer" || criteria.scope.type === "agent") {
      const scopeFilter = this.buildScopeFilter(criteria.scope);
      if (Object.keys(scopeFilter).length > 0) {
        andClauses.push(scopeFilter);
      }
    }

    if (criteria.customerId) {
      andClauses.push({ customerId: criteria.customerId });
    }
    if (criteria.policyId) {
      andClauses.push({ policyId: criteria.policyId });
    }
    if (criteria.status) {
      andClauses.push({ currentStatus: criteria.status });
    }
    if (criteria.classification) {
      andClauses.push({ classification: criteria.classification });
    }

    if (criteria.search) {
      const escaped = escapeRegex(criteria.search.trim());
      andClauses.push({
        $or: [
          { claimNumber: { $regex: escaped, $options: "i" } },
          { "incident.description": { $regex: escaped, $options: "i" } },
          { "incident.location": { $regex: escaped, $options: "i" } },
        ],
      });
    }

    const query: Filter<any> = andClauses.length > 0 ? { $and: andClauses } : {};
    const skip = criteria.skip || 0;
    const limit = criteria.limit || 50;

    const docs = await col
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return normalizeDocs<ClaimEntity>(docs);
  }

  async create(data: CreateClaimData): Promise<ClaimEntity> {
    const col = await this.getCol();

    const existing = await col.findOne({ claimNumber: data.claimNumber });
    if (existing) {
      const err = new Error(`E11000 duplicate key error: claimNumber ${data.claimNumber} already exists`);
      (err as unknown as { code: number }).code = 11000;
      throw err;
    }

    const now = new Date().toISOString();
    const objectId = toObjectId(data._id);
    const claimDoc: Record<string, any> = {
      _id: objectId,
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

    await col.insertOne(claimDoc);
    return normalizeDoc<ClaimEntity>(claimDoc)!;
  }

  async updateStatus(
    id: string,
    newStatus: ClaimStatus,
    historyItem: StatusHistoryItem,
    expectedCurrentStatus?: ClaimStatus
  ): Promise<ClaimEntity | null> {
    const col = await this.getCol();
    const query: Filter<any> = {
      ...idFilter(id),
      ...(expectedCurrentStatus ? { currentStatus: expectedCurrentStatus } : {}),
    };

    const now = new Date().toISOString();
    const result = await col.findOneAndUpdate(
      query,
      {
        $set: { currentStatus: newStatus, updatedAt: now },
        $push: { statusHistory: historyItem },
      } as any,
      { returnDocument: "after" }
    );
    return normalizeDoc<ClaimEntity>(result);
  }

  async addNote(id: string, note: AdjusterNote, scope?: ClaimScope): Promise<ClaimEntity | null> {
    const col = await this.getCol();
    const query: Filter<any> = {
      ...idFilter(id),
      ...(scope?.type === "adjuster" ? { classificationLevel: { $lte: scope.maxClassificationLevel as ClearanceLevel } } : {}),
    };

    const now = new Date().toISOString();
    const result = await col.findOneAndUpdate(
      query,
      {
        $push: { adjusterNotes: note },
        $set: { updatedAt: now },
      } as any,
      { returnDocument: "after" }
    );
    return normalizeDoc<ClaimEntity>(result);
  }

  async addDocuments(
    id: string,
    documents: ClaimDocument[],
    historyItem?: StatusHistoryItem,
    newStatus?: ClaimStatus
  ): Promise<ClaimEntity | null> {
    const col = await this.getCol();
    const now = new Date().toISOString();
    const updateOps: Record<string, unknown> = {
      $push: {
        documents: { $each: documents },
        ...(historyItem ? { statusHistory: historyItem } : {}),
      },
      $set: {
        updatedAt: now,
        ...(newStatus ? { currentStatus: newStatus } : {}),
      },
    };

    const result = await col.findOneAndUpdate(
      idFilter(id),
      updateOps as any,
      { returnDocument: "after" }
    );
    return normalizeDoc<ClaimEntity>(result);
  }

  async count(criteria: Omit<ClaimFilterCriteria, "limit" | "skip">): Promise<number> {
    const col = await this.getCol();
    const andClauses: Filter<any>[] = [];

    if (criteria.scope.type === "customer" || criteria.scope.type === "agent") {
      const scopeFilter = this.buildScopeFilter(criteria.scope);
      if (Object.keys(scopeFilter).length > 0) {
        andClauses.push(scopeFilter);
      }
    }

    if (criteria.customerId) {
      andClauses.push({ customerId: criteria.customerId });
    }
    if (criteria.policyId) {
      andClauses.push({ policyId: criteria.policyId });
    }
    if (criteria.status) {
      andClauses.push({ currentStatus: criteria.status });
    }
    if (criteria.classification) {
      andClauses.push({ classification: criteria.classification });
    }

    if (criteria.search) {
      const escaped = escapeRegex(criteria.search.trim());
      andClauses.push({
        $or: [
          { claimNumber: { $regex: escaped, $options: "i" } },
          { "incident.description": { $regex: escaped, $options: "i" } },
          { "incident.location": { $regex: escaped, $options: "i" } },
        ],
      });
    }

    const query: Filter<any> = andClauses.length > 0 ? { $and: andClauses } : {};
    return col.countDocuments(query);
  }
}

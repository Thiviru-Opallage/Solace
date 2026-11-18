import { Filter } from "mongodb";
import { IPolicyRepository, PolicyFilterCriteria, CreatePolicyData } from "../IPolicyRepository.js";
import { PolicyEntity, PolicyScope, SharedAccess } from "../types.js";
import { getCollection, toObjectId, idFilter, normalizeDoc, normalizeDocs } from "./client.js";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class MongoPolicyRepository implements IPolicyRepository {
  private async getCol() {
    const col = await getCollection("policies");
    await col.createIndex({ policyNumber: 1 }, { unique: true });
    await col.createIndex({ customerId: 1 });
    await col.createIndex({ agentId: 1 });
    await col.createIndex({ "sharedWith.userId": 1 });
    return col;
  }

  private buildScopeFilter(scope?: PolicyScope): Filter<any> {
    if (!scope || scope.type === "all" || scope.type === "adjuster") {
      return {};
    }
    if (scope.type === "agent") {
      return {
        $or: [{ agentId: scope.agentId }, { status: "pending" }],
      };
    }
    if (scope.type === "customer") {
      const orClauses: Filter<any>[] = [{ customerId: scope.userId }];
      if (scope.includeShared !== false) {
        orClauses.push({ "sharedWith.userId": scope.userId });
      }
      return { $or: orClauses };
    }
    return {};
  }

  async findById(id: string, scope?: PolicyScope): Promise<PolicyEntity | null> {
    const col = await this.getCol();
    const query: Filter<any> = idFilter(id);
    const scopeFilter = this.buildScopeFilter(scope);

    const doc = await (Object.keys(scopeFilter).length > 0
      ? col.findOne({ $and: [query, scopeFilter] })
      : col.findOne(query));
    return normalizeDoc<PolicyEntity>(doc);
  }

  async findByPolicyNumber(policyNumber: string): Promise<PolicyEntity | null> {
    const col = await this.getCol();
    const doc = await col.findOne({ policyNumber });
    return normalizeDoc<PolicyEntity>(doc);
  }

  async find(criteria: PolicyFilterCriteria): Promise<PolicyEntity[]> {
    const col = await this.getCol();
    const andClauses: Filter<any>[] = [];

    const scopeFilter = this.buildScopeFilter(criteria.scope);
    if (Object.keys(scopeFilter).length > 0) {
      andClauses.push(scopeFilter);
    }

    if (criteria.customerId) {
      andClauses.push({
        $or: [{ customerId: criteria.customerId }, { "sharedWith.userId": criteria.customerId }],
      });
    }

    if (criteria.agentId) {
      andClauses.push({ agentId: criteria.agentId });
    }

    if (criteria.type) {
      andClauses.push({ type: criteria.type });
    }

    if (criteria.status) {
      andClauses.push({ status: criteria.status });
    }

    if (criteria.search) {
      const escaped = escapeRegex(criteria.search.trim());
      andClauses.push({
        $or: [
          { policyNumber: { $regex: escaped, $options: "i" } },
          { type: { $regex: escaped, $options: "i" } },
        ],
      });
    }

    const query: Filter<any> = andClauses.length > 0 ? { $and: andClauses } : {};
    const skip = criteria.skip || 0;
    const limit = criteria.limit || 50;

    const docs = await col
      .find(query)
      .sort({ renewalDate: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return normalizeDocs<PolicyEntity>(docs);
  }

  async create(data: CreatePolicyData): Promise<PolicyEntity> {
    const col = await this.getCol();

    const existing = await col.findOne({ policyNumber: data.policyNumber });
    if (existing) {
      const err = new Error(`E11000 duplicate key error: policyNumber ${data.policyNumber} already exists`);
      (err as unknown as { code: number }).code = 11000;
      throw err;
    }

    const now = new Date().toISOString();
    const objectId = toObjectId(data._id);
    const policyDoc: Record<string, any> = {
      _id: objectId,
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

    await col.insertOne(policyDoc);
    return normalizeDoc<PolicyEntity>(policyDoc)!;
  }

  async update(id: string, updates: Partial<PolicyEntity>, scope?: PolicyScope): Promise<PolicyEntity | null> {
    const col = await this.getCol();
    const query: Filter<any> = idFilter(id);
    const scopeFilter = this.buildScopeFilter(scope);
    const finalQuery = Object.keys(scopeFilter).length > 0 ? { $and: [query, scopeFilter] } : query;

    const now = new Date().toISOString();
    const { _id, ...safeUpdates } = updates;
    const result = await col.findOneAndUpdate(
      finalQuery,
      { $set: { ...safeUpdates, updatedAt: now } },
      { returnDocument: "after" }
    );
    return normalizeDoc<PolicyEntity>(result);
  }

  async addSharedAccess(policyId: string, share: SharedAccess, ownerCustomerId: string): Promise<PolicyEntity | null> {
    const col = await this.getCol();
    const policy = await col.findOne({ ...idFilter(policyId), customerId: ownerCustomerId });
    if (!policy) return null;

    const now = new Date().toISOString();
    const existingIndex = (policy.sharedWith || []).findIndex((s: SharedAccess) => s.userId === share.userId);

    if (existingIndex >= 0) {
      policy.sharedWith[existingIndex] = share;
      const result = await col.findOneAndUpdate(
        { ...idFilter(policyId), customerId: ownerCustomerId },
        { $set: { sharedWith: policy.sharedWith, updatedAt: now } } as any,
        { returnDocument: "after" }
      );
      return normalizeDoc<PolicyEntity>(result);
    } else {
      const result = await col.findOneAndUpdate(
        { ...idFilter(policyId), customerId: ownerCustomerId },
        { $push: { sharedWith: share }, $set: { updatedAt: now } } as any,
        { returnDocument: "after" }
      );
      return normalizeDoc<PolicyEntity>(result);
    }
  }

  async removeSharedAccess(policyId: string, targetUserId: string, ownerCustomerId: string): Promise<PolicyEntity | null> {
    const col = await this.getCol();
    const now = new Date().toISOString();
    const result = await col.findOneAndUpdate(
      { ...idFilter(policyId), customerId: ownerCustomerId },
      { $pull: { sharedWith: { userId: targetUserId } }, $set: { updatedAt: now } } as any,
      { returnDocument: "after" }
    );
    return normalizeDoc<PolicyEntity>(result);
  }

  async count(criteria: Omit<PolicyFilterCriteria, "limit" | "skip">): Promise<number> {
    const col = await this.getCol();
    const andClauses: Filter<any>[] = [];

    const scopeFilter = this.buildScopeFilter(criteria.scope);
    if (Object.keys(scopeFilter).length > 0) {
      andClauses.push(scopeFilter);
    }

    if (criteria.customerId) {
      andClauses.push({
        $or: [{ customerId: criteria.customerId }, { "sharedWith.userId": criteria.customerId }],
      });
    }

    if (criteria.agentId) {
      andClauses.push({ agentId: criteria.agentId });
    }

    if (criteria.type) {
      andClauses.push({ type: criteria.type });
    }

    if (criteria.status) {
      andClauses.push({ status: criteria.status });
    }

    if (criteria.search) {
      const escaped = escapeRegex(criteria.search.trim());
      andClauses.push({
        $or: [
          { policyNumber: { $regex: escaped, $options: "i" } },
          { type: { $regex: escaped, $options: "i" } },
        ],
      });
    }

    const query: Filter<any> = andClauses.length > 0 ? { $and: andClauses } : {};
    return col.countDocuments(query);
  }
}

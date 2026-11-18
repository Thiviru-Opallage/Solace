import { Filter } from "mongodb";
import { IAuditLogRepository, CreateAuditLogData, AuditLogFilterCriteria } from "../IAuditLogRepository.js";
import { AuditLogEntity } from "../types.js";
import { getCollection, toObjectId, normalizeDoc, normalizeDocs } from "./client.js";

export class MongoAuditLogRepository implements IAuditLogRepository {
  private async getCol() {
    const col = await getCollection("auditLogs");
    await col.createIndex({ timestamp: -1 });
    await col.createIndex({ actorId: 1, timestamp: -1 });
    await col.createIndex({ action: 1, timestamp: -1 });
    await col.createIndex({ targetId: 1 });
    return col;
  }

  async create(data: CreateAuditLogData): Promise<AuditLogEntity> {
    const col = await this.getCol();
    const now = data.timestamp || new Date().toISOString();
    const objectId = toObjectId(data._id);
    const logDoc: Record<string, any> = {
      _id: objectId,
      action: data.action,
      actorId: data.actorId,
      actorRole: data.actorRole,
      targetId: data.targetId,
      targetType: data.targetType,
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: now,
    };

    await col.insertOne(logDoc);
    return normalizeDoc<AuditLogEntity>(logDoc)!;
  }

  async find(criteria: AuditLogFilterCriteria): Promise<AuditLogEntity[]> {
    const col = await this.getCol();
    const query: Filter<any> = {};

    if (criteria.actorId) {
      query.actorId = criteria.actorId;
    }
    if (criteria.targetId) {
      query.targetId = criteria.targetId;
    }
    if (criteria.action) {
      query.action = criteria.action;
    }

    const skip = criteria.skip || 0;
    const limit = criteria.limit || 50;

    const docs = await col
      .find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return normalizeDocs<AuditLogEntity>(docs);
  }
}

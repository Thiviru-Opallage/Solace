import { IAuditLogRepository, CreateAuditLogData, AuditLogFilterCriteria } from "../IAuditLogRepository.js";
import { AuditLogEntity } from "../types.js";
import crypto from "node:crypto";

export class MemoryAuditLogRepository implements IAuditLogRepository {
  private logs: AuditLogEntity[] = [];

  async create(data: CreateAuditLogData): Promise<AuditLogEntity> {
    const now = data.timestamp || new Date().toISOString();
    const id = data._id || `aud-${crypto.randomUUID()}`;
    const log: AuditLogEntity = {
      _id: id,
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

    this.logs.push(log);
    return { ...log };
  }

  async find(criteria: AuditLogFilterCriteria): Promise<AuditLogEntity[]> {
    let filtered = [...this.logs];

    if (criteria.actorId) {
      filtered = filtered.filter((l) => l.actorId === criteria.actorId);
    }
    if (criteria.targetId) {
      filtered = filtered.filter((l) => l.targetId === criteria.targetId);
    }
    if (criteria.action) {
      filtered = filtered.filter((l) => l.action === criteria.action);
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const skip = criteria.skip || 0;
    const limit = criteria.limit || 50;
    return filtered.slice(skip, skip + limit);
  }

  clear(): void {
    this.logs = [];
  }
}

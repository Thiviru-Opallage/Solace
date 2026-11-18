import { AuditLogEntity } from "./types.js";

export interface CreateAuditLogData {
  _id?: string;
  action: string;
  actorId?: string;
  actorRole?: AuditLogEntity["actorRole"];
  targetId?: string;
  targetType?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
}

export interface AuditLogFilterCriteria {
  actorId?: string;
  targetId?: string;
  action?: string;
  limit?: number;
  skip?: number;
}

export interface IAuditLogRepository {
  create(data: CreateAuditLogData): Promise<AuditLogEntity>;
  find(criteria: AuditLogFilterCriteria): Promise<AuditLogEntity[]>;
}

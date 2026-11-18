import { env } from "../config/env.js";
import { IUserRepository } from "./IUserRepository.js";
import { IPolicyRepository } from "./IPolicyRepository.js";
import { IClaimRepository } from "./IClaimRepository.js";
import { IPaymentRepository } from "./IPaymentRepository.js";
import { IRefreshTokenRepository } from "./IRefreshTokenRepository.js";
import { IAuditLogRepository } from "./IAuditLogRepository.js";
import { ICounterRepository } from "./ICounterRepository.js";

// Memory implementations
import { MemoryUserRepository } from "./memory/MemoryUserRepository.js";
import { MemoryPolicyRepository } from "./memory/MemoryPolicyRepository.js";
import { MemoryClaimRepository } from "./memory/MemoryClaimRepository.js";
import { MemoryPaymentRepository } from "./memory/MemoryPaymentRepository.js";
import { MemoryRefreshTokenRepository } from "./memory/MemoryRefreshTokenRepository.js";
import { MemoryAuditLogRepository } from "./memory/MemoryAuditLogRepository.js";
import { MemoryCounterRepository } from "./memory/MemoryCounterRepository.js";

// Mongo stubs
import { MongoUserRepository } from "./mongo/MongoUserRepository.js";
import { MongoPolicyRepository } from "./mongo/MongoPolicyRepository.js";
import { MongoClaimRepository } from "./mongo/MongoClaimRepository.js";
import { MongoPaymentRepository } from "./mongo/MongoPaymentRepository.js";
import { MongoRefreshTokenRepository } from "./mongo/MongoRefreshTokenRepository.js";
import { MongoAuditLogRepository } from "./mongo/MongoAuditLogRepository.js";
import { MongoCounterRepository } from "./mongo/MongoCounterRepository.js";

export interface Repositories {
  users: IUserRepository;
  policies: IPolicyRepository;
  claims: IClaimRepository;
  payments: IPaymentRepository;
  refreshTokens: IRefreshTokenRepository;
  auditLogs: IAuditLogRepository;
  counters: ICounterRepository;
}

export function createRepositories(mode: "memory" | "mongo"): Repositories {
  if (mode === "mongo") {
    return {
      users: new MongoUserRepository(),
      policies: new MongoPolicyRepository(),
      claims: new MongoClaimRepository(),
      payments: new MongoPaymentRepository(),
      refreshTokens: new MongoRefreshTokenRepository(),
      auditLogs: new MongoAuditLogRepository(),
      counters: new MongoCounterRepository(),
    };
  }

  return {
    users: new MemoryUserRepository(),
    policies: new MemoryPolicyRepository(),
    claims: new MemoryClaimRepository(),
    payments: new MemoryPaymentRepository(),
    refreshTokens: new MemoryRefreshTokenRepository(),
    auditLogs: new MemoryAuditLogRepository(),
    counters: new MemoryCounterRepository(),
  };
}

export const repositories = createRepositories(env.REPO_MODE);

export * from "./types.js";
export * from "./IUserRepository.js";
export * from "./IPolicyRepository.js";
export * from "./IClaimRepository.js";
export * from "./IPaymentRepository.js";
export * from "./IRefreshTokenRepository.js";
export * from "./IAuditLogRepository.js";
export * from "./ICounterRepository.js";

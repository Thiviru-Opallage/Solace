import { RefreshTokenEntity } from "./types.js";

export interface CreateRefreshTokenData {
  _id?: string;
  tokenHash: string;
  familyId: string;
  userId: string;
  expiresAt: string;
}

export interface IRefreshTokenRepository {
  findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null>;
  create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity>;
  markAsRevoked(id: string, replacedByTokenHash?: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}

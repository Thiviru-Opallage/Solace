import { IRefreshTokenRepository, CreateRefreshTokenData } from "../IRefreshTokenRepository.js";
import { RefreshTokenEntity } from "../types.js";
import crypto from "node:crypto";

export class MemoryRefreshTokenRepository implements IRefreshTokenRepository {
  private tokens = new Map<string, RefreshTokenEntity>();

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    for (const token of this.tokens.values()) {
      if (token.tokenHash === tokenHash) {
        return { ...token };
      }
    }
    return null;
  }

  async create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity> {
    const now = new Date().toISOString();
    const id = data._id || `rt-${crypto.randomUUID()}`;
    const token: RefreshTokenEntity = {
      _id: id,
      tokenHash: data.tokenHash,
      familyId: data.familyId,
      userId: data.userId,
      expiresAt: data.expiresAt,
      isRevoked: false,
      createdAt: now,
    };

    this.tokens.set(id, token);
    return { ...token };
  }

  async markAsRevoked(id: string, replacedByTokenHash?: string): Promise<void> {
    const token = this.tokens.get(id);
    if (token) {
      token.isRevoked = true;
      if (replacedByTokenHash) {
        token.replacedByTokenHash = replacedByTokenHash;
      }
      this.tokens.set(id, token);
    }
  }

  async revokeFamily(familyId: string): Promise<void> {
    for (const token of this.tokens.values()) {
      if (token.familyId === familyId) {
        token.isRevoked = true;
        this.tokens.set(token._id, token);
      }
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    for (const token of this.tokens.values()) {
      if (token.userId === userId) {
        token.isRevoked = true;
        this.tokens.set(token._id, token);
      }
    }
  }

  async deleteExpired(): Promise<number> {
    const now = new Date().toISOString();
    let count = 0;
    for (const [id, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(id);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.tokens.clear();
  }
}

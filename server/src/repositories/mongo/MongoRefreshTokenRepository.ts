import { IRefreshTokenRepository, CreateRefreshTokenData } from "../IRefreshTokenRepository.js";
import { RefreshTokenEntity } from "../types.js";
import { getCollection, toObjectId, idFilter, normalizeDoc } from "./client.js";

export class MongoRefreshTokenRepository implements IRefreshTokenRepository {
  private async getCol() {
    const col = await getCollection("refreshTokens");
    await col.createIndex({ tokenHash: 1 }, { unique: true });
    await col.createIndex({ familyId: 1 });
    await col.createIndex({ userId: 1 });
    return col;
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const col = await this.getCol();
    const doc = await col.findOne({ tokenHash });
    return normalizeDoc<RefreshTokenEntity>(doc);
  }

  async create(data: CreateRefreshTokenData): Promise<RefreshTokenEntity> {
    const col = await this.getCol();
    const now = new Date().toISOString();
    const objectId = toObjectId(data._id);
    const tokenDoc: Record<string, any> = {
      _id: objectId,
      tokenHash: data.tokenHash,
      familyId: data.familyId,
      userId: data.userId,
      expiresAt: data.expiresAt,
      isRevoked: false,
      createdAt: now,
    };

    await col.insertOne(tokenDoc);
    return normalizeDoc<RefreshTokenEntity>(tokenDoc)!;
  }

  async markAsRevoked(id: string, replacedByTokenHash?: string): Promise<void> {
    const col = await this.getCol();
    await col.updateOne(
      idFilter(id),
      {
        $set: {
          isRevoked: true,
          ...(replacedByTokenHash ? { replacedByTokenHash } : {}),
        },
      }
    );
  }

  async revokeFamily(familyId: string): Promise<void> {
    const col = await this.getCol();
    await col.updateMany({ familyId }, { $set: { isRevoked: true } });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const col = await this.getCol();
    await col.updateMany({ userId }, { $set: { isRevoked: true } });
  }

  async deleteExpired(): Promise<number> {
    const col = await this.getCol();
    const now = new Date().toISOString();
    const result = await col.deleteMany({ expiresAt: { $lt: now } });
    return result.deletedCount;
  }
}

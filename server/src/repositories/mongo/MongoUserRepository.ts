import { Filter } from "mongodb";
import { IUserRepository, CreateUserData, UserSearchFilters } from "../IUserRepository.js";
import { UserEntity } from "../types.js";
import { getCollection, toObjectId, idFilter, normalizeDoc, normalizeDocs } from "./client.js";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class MongoUserRepository implements IUserRepository {
  private async getCol() {
    const col = await getCollection("users");
    // Ensure email index
    await col.createIndex({ email: 1 }, { unique: true });
    return col;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const col = await this.getCol();
    const doc = await col.findOne(idFilter(id));
    return normalizeDoc<UserEntity>(doc);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const col = await this.getCol();
    const normalized = email.toLowerCase().trim();
    const doc = await col.findOne({ email: normalized });
    return normalizeDoc<UserEntity>(doc);
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const col = await this.getCol();
    const normalizedEmail = data.email.toLowerCase().trim();

    const existing = await col.findOne({ email: normalizedEmail });
    if (existing) {
      const err = new Error(`E11000 duplicate key error: email ${data.email} already exists`);
      (err as unknown as { code: number }).code = 11000;
      throw err;
    }

    const now = new Date().toISOString();
    const objectId = toObjectId(data._id);
    const userDoc: Record<string, any> = {
      _id: objectId,
      name: data.name,
      email: normalizedEmail,
      role: data.role,
      passwordHash: data.passwordHash,
      phoneEncrypted: data.phoneEncrypted,
      nicEncrypted: data.nicEncrypted,
      clearance: data.clearance,
      failedLoginCount: 0,
      lockUntil: null,
      tokenVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    await col.insertOne(userDoc);
    return normalizeDoc<UserEntity>(userDoc)!;
  }

  async update(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    const col = await this.getCol();
    const now = new Date().toISOString();
    const { _id, ...safeUpdates } = updates;
    const result = await col.findOneAndUpdate(
      idFilter(id),
      { $set: { ...safeUpdates, updatedAt: now } },
      { returnDocument: "after" }
    );
    return normalizeDoc<UserEntity>(result);
  }

  async recordFailedLogin(id: string, lockUntil: string | null): Promise<UserEntity | null> {
    const col = await this.getCol();
    const now = new Date().toISOString();
    const result = await col.findOneAndUpdate(
      idFilter(id),
      {
        $inc: { failedLoginCount: 1 },
        $set: { lockUntil, updatedAt: now },
      },
      { returnDocument: "after" }
    );
    return normalizeDoc<UserEntity>(result);
  }

  async resetFailedLogins(id: string): Promise<UserEntity | null> {
    const col = await this.getCol();
    const now = new Date().toISOString();
    const result = await col.findOneAndUpdate(
      idFilter(id),
      {
        $set: { failedLoginCount: 0, lockUntil: null, updatedAt: now },
      },
      { returnDocument: "after" }
    );
    return normalizeDoc<UserEntity>(result);
  }

  async incrementTokenVersion(id: string): Promise<number | null> {
    const col = await this.getCol();
    const now = new Date().toISOString();
    const result = await col.findOneAndUpdate(
      idFilter(id),
      {
        $inc: { tokenVersion: 1 },
        $set: { updatedAt: now },
      },
      { returnDocument: "after" }
    );
    return result ? result.tokenVersion : null;
  }

  async search(filters: UserSearchFilters): Promise<UserEntity[]> {
    const col = await this.getCol();
    const query: Filter<any> = {};

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.search) {
      const escaped = escapeRegex(filters.search.trim());
      query.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const limit = filters.limit || 50;
    const docs = await col.find(query).limit(limit).toArray();
    return normalizeDocs<UserEntity>(docs);
  }

  async delete(id: string): Promise<boolean> {
    const col = await this.getCol();
    const result = await col.deleteOne(idFilter(id));
    return result.deletedCount > 0;
  }
}

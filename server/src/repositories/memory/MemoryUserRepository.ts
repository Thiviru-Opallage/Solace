import { IUserRepository, CreateUserData, UserSearchFilters } from "../IUserRepository.js";
import { UserEntity } from "../types.js";
import crypto from "node:crypto";

export class MemoryUserRepository implements IUserRepository {
  private users = new Map<string, UserEntity>();

  async findById(id: string): Promise<UserEntity | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const normalized = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalized) {
        return { ...user };
      }
    }
    return null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      const err = new Error(`E11000 duplicate key error: email ${data.email} already exists`);
      (err as unknown as { code: number }).code = 11000;
      throw err;
    }

    const now = new Date().toISOString();
    const id = data._id || crypto.randomBytes(12).toString("hex");
    const user: UserEntity = {
      _id: id,
      name: data.name,
      email: data.email.toLowerCase().trim(),
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

    this.users.set(id, user);
    return { ...user };
  }

  async update(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated: UserEntity = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return { ...updated };
  }

  async recordFailedLogin(id: string, lockUntil: string | null): Promise<UserEntity | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated: UserEntity = {
      ...user,
      failedLoginCount: user.failedLoginCount + 1,
      lockUntil,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return { ...updated };
  }

  async resetFailedLogins(id: string): Promise<UserEntity | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updated: UserEntity = {
      ...user,
      failedLoginCount: 0,
      lockUntil: null,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return { ...updated };
  }

  async incrementTokenVersion(id: string): Promise<number | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const newVersion = user.tokenVersion + 1;
    user.tokenVersion = newVersion;
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    return newVersion;
  }

  async search(filters: UserSearchFilters): Promise<UserEntity[]> {
    const results: UserEntity[] = [];
    const searchLower = filters.search?.toLowerCase().trim();

    for (const user of this.users.values()) {
      if (filters.role && user.role !== filters.role) {
        continue;
      }
      if (searchLower) {
        const matchesName = user.name.toLowerCase().includes(searchLower);
        const matchesEmail = user.email.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesEmail) {
          continue;
        }
      }
      results.push({ ...user });
    }

    const limit = filters.limit || 50;
    return results.slice(0, limit);
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Testing helper
  clear(): void {
    this.users.clear();
  }
}

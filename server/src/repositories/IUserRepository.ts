import { UserEntity } from "./types.js";

export interface CreateUserData {
  _id?: string;
  name: string;
  email: string;
  role: UserEntity["role"];
  passwordHash: string;
  phoneEncrypted?: string;
  nicEncrypted?: string;
  clearance?: UserEntity["clearance"];
}

export interface UserSearchFilters {
  role?: UserEntity["role"];
  search?: string;
  limit?: number;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  update(id: string, updates: Partial<UserEntity>): Promise<UserEntity | null>;
  recordFailedLogin(id: string, lockUntil: string | null): Promise<UserEntity | null>;
  resetFailedLogins(id: string): Promise<UserEntity | null>;
  incrementTokenVersion(id: string): Promise<number | null>;
  search(filters: UserSearchFilters): Promise<UserEntity[]>;
  delete(id: string): Promise<boolean>;
}

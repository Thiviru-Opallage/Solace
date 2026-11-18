import { UserEntity } from "../../repositories/types.js";
import { repositories } from "../../repositories/index.js";
import { encryptField, decryptField } from "../../crypto/fieldEncryption.js";
import { sanitizeText } from "../../utils/sanitize.js";
import { NotFoundError, ForbiddenError } from "../../utils/errors.js";
import { UpdateProfileInput } from "./schemas.js";

export class UserService {
  /**
   * Fetches the authenticated user's own record.
   * Throws NotFoundError if the user no longer exists.
   */
  async getMe(userId: string): Promise<UserEntity> {
    const user = await repositories.users.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  /**
   * Updates the authenticated user's own profile.
   * Sanitizes text fields, encrypts sensitive fields (phone, nic), and writes an audit log.
   */
  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
    ip?: string,
    userAgent?: string
  ): Promise<UserEntity> {
    const user = await this.getMe(userId);

    const changes: Partial<UserEntity> = {};

    if (input.name !== undefined) {
      changes.name = sanitizeText(input.name, 100);
    }

    if (input.phone !== undefined) {
      changes.phoneEncrypted = encryptField(input.phone);
    }

    if (input.nic !== undefined) {
      changes.nicEncrypted = encryptField(input.nic);
    }

    const updated = await repositories.users.update(userId, changes);
    if (!updated) {
      throw new NotFoundError("User not found");
    }

    await repositories.auditLogs.create({
      action: "USER_PROFILE_UPDATE",
      actorId: userId,
      actorRole: user.role,
      targetId: userId,
      targetType: "user",
      details: { fields: Object.keys(changes) },
      ipAddress: ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  /**
   * Lists customers with optional search, used by agents to find users for policy sharing.
   * Only returns users with role='customer'.
   */
  async listCustomers(
    search?: string,
    limit?: number,
    _offset?: number
  ): Promise<UserEntity[]> {
    return repositories.users.search({
      role: "customer",
      search: search ? sanitizeText(search) : undefined,
      limit,
    });
  }

  /**
   * Lists all users (for Adjuster 3 user management).
   */
  async listAllUsers(search?: string, limit?: number): Promise<UserEntity[]> {
    return repositories.users.search({
      search: search ? sanitizeText(search) : undefined,
      limit,
    });
  }

  /**
   * Deletes a user record. Only Adjuster 3 (Clearance Level 3) is permitted.
   */
  async deleteUser(
    targetUserId: string,
    requestingUser: UserEntity,
    ip?: string,
    userAgent?: string
  ): Promise<boolean> {
    if (requestingUser.role !== "adjuster" || (requestingUser.clearance ?? 1) < 3) {
      throw new ForbiddenError("Only Clearance Level 3 Adjusters are authorized to remove users");
    }

    if (targetUserId === requestingUser._id) {
      throw new ForbiddenError("Cannot remove your own active administrator account");
    }

    const target = await repositories.users.findById(targetUserId);
    if (!target) {
      throw new NotFoundError("User not found");
    }

    const success = await repositories.users.delete(targetUserId);

    await repositories.auditLogs.create({
      action: "USER_DELETE",
      actorId: requestingUser._id,
      actorRole: requestingUser.role,
      targetId: targetUserId,
      targetType: "user",
      details: { deletedEmail: target.email, deletedRole: target.role, deletedName: target.name },
      ipAddress: ip,
      userAgent,
      timestamp: new Date().toISOString(),
    });

    return success;
  }

  /**
   * Decrypts and returns a sensitive field (phone or nic) for the authenticated user.
   * Only the user themselves can reveal their own sensitive fields.
   * Writes an audit log on every reveal.
   */
  async revealSensitiveField(
    userId: string,
    requestingUserId: string,
    field: "phone" | "nic"
  ): Promise<string> {
    if (userId !== requestingUserId) {
      throw new ForbiddenError("You can only reveal your own sensitive fields");
    }

    const user = await this.getMe(userId);

    const encrypted = field === "phone" ? user.phoneEncrypted : user.nicEncrypted;
    const decrypted = decryptField(encrypted);

    if (!decrypted) {
      throw new NotFoundError(`${field} is not set for this user`);
    }

    await repositories.auditLogs.create({
      action: "SENSITIVE_REVEAL",
      actorId: requestingUserId,
      actorRole: user.role,
      targetId: userId,
      targetType: "user",
      details: { field },
      timestamp: new Date().toISOString(),
    });

    return decrypted;
  }
}

export const userService = new UserService();

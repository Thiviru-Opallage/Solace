import { repositories } from "../../repositories/index.js";
import { RegisterInput, LoginInput, ChangePasswordInput } from "./schemas.js";
import { UserEntity } from "../../repositories/types.js";
import {
  hashPassword,
  verifyPassword,
  dummyVerify,
  validatePasswordPolicy,
} from "../../auth/password.js";
import { signAccessToken } from "../../auth/jwt.js";
import {
  issueRefreshToken,
  rotateRefreshToken,
  revokeTokenFamily,
} from "../../auth/refreshToken.js";
import { checkAccountLockout, handleFailedLogin, handleSuccessfulLogin } from "../../auth/lockout.js";
import { encryptField } from "../../crypto/fieldEncryption.js";
import { sanitizeText } from "../../utils/sanitize.js";
import { BadRequestError, UnauthorizedError, ConflictError } from "../../utils/errors.js";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  async registerCustomer(
    input: RegisterInput,
    ip?: string,
    userAgent?: string
  ): Promise<{ user: UserEntity; tokens: AuthTokens }> {
    const sanitizedName = sanitizeText(input.name, 100);
    const normalizedEmail = input.email.toLowerCase().trim();

    // 1. Password policy verification
    validatePasswordPolicy(input.password, {
      name: sanitizedName,
      email: normalizedEmail,
    });

    // 2. Uniqueness check
    const existing = await repositories.users.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError("An account with this email address already exists", "EMAIL_EXISTS");
    }

    // 3. Argon2id password hash
    const passwordHash = await hashPassword(input.password);

    // 4. AES-256-GCM encryption for sensitive fields
    const phoneEncrypted = encryptField(input.phone?.trim());
    const nicEncrypted = encryptField(input.nic?.trim());

    // 5. Create user in repository (strictly role: "customer", no clearance)
    const user = await repositories.users.create({
      name: sanitizedName,
      email: normalizedEmail,
      role: "customer",
      passwordHash,
      phoneEncrypted,
      nicEncrypted,
      clearance: undefined,
    });

    // 6. Issue tokens
    const accessToken = await signAccessToken({
      sub: user._id,
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    const { rawToken: refreshToken } = await issueRefreshToken(user._id);

    // 7. Audit log
    await repositories.auditLogs.create({
      action: "REGISTER",
      actorId: user._id,
      actorRole: user.role,
      targetId: user._id,
      targetType: "user",
      ipAddress: ip,
      userAgent,
      details: { email: user.email },
    });

    return { user, tokens: { accessToken, refreshToken } };
  }

  async login(
    input: LoginInput,
    ip?: string,
    userAgent?: string
  ): Promise<{ user: UserEntity; tokens: AuthTokens }> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await repositories.users.findByEmail(normalizedEmail);

    // If user does not exist, run dummy verification for constant timing
    if (!user) {
      await dummyVerify(input.password);
      await repositories.auditLogs.create({
        action: "LOGIN_FAILED_UNKNOWN_EMAIL",
        ipAddress: ip,
        userAgent,
        details: { email: normalizedEmail },
      });
      throw new UnauthorizedError("Invalid email or password");
    }

    // Check account lockout
    checkAccountLockout(user);

    // Verify password
    const isPasswordValid = await verifyPassword(user.passwordHash, input.password);
    if (!isPasswordValid) {
      const lockResult = await handleFailedLogin(user);
      await repositories.auditLogs.create({
        action: lockResult.isLocked ? "ACCOUNT_LOCKED" : "LOGIN_FAILED",
        actorId: user._id,
        actorRole: user.role,
        ipAddress: ip,
        userAgent,
        details: {
          email: user.email,
          failedAttempts: user.failedLoginCount + 1,
          isLocked: lockResult.isLocked,
        },
      });

      if (lockResult.isLocked && lockResult.remainingSeconds) {
        throw new BadRequestError(
          `Account temporarily locked due to consecutive failed attempts. Please retry in ${lockResult.remainingSeconds}s.`,
          "LOCKED"
        );
      }

      throw new UnauthorizedError("Invalid email or password");
    }

    // Password is valid - reset failed logins
    await handleSuccessfulLogin(user);

    // Issue tokens
    const accessToken = await signAccessToken({
      sub: user._id,
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    const { rawToken: refreshToken } = await issueRefreshToken(user._id);

    // Audit log
    await repositories.auditLogs.create({
      action: "LOGIN_SUCCESS",
      actorId: user._id,
      actorRole: user.role,
      ipAddress: ip,
      userAgent,
    });

    return { user, tokens: { accessToken, refreshToken } };
  }

  async refresh(
    rawRefreshToken: string,
    ip?: string,
    userAgent?: string
  ): Promise<{ user: UserEntity; tokens: AuthTokens }> {
    const rotated = await rotateRefreshToken(rawRefreshToken);
    const user = await repositories.users.findById(rotated.userId);

    if (!user) {
      throw new UnauthorizedError("User session no longer valid");
    }

    const accessToken = await signAccessToken({
      sub: user._id,
      role: user.role,
      email: user.email,
      tokenVersion: user.tokenVersion,
    });

    await repositories.auditLogs.create({
      action: "TOKEN_REFRESH",
      actorId: user._id,
      actorRole: user.role,
      ipAddress: ip,
      userAgent,
      details: { familyId: rotated.familyId },
    });

    return {
      user,
      tokens: {
        accessToken,
        refreshToken: rotated.newRawRefreshToken,
      },
    };
  }

  async logout(rawRefreshToken?: string, user?: UserEntity, ip?: string, userAgent?: string): Promise<void> {
    if (rawRefreshToken) {
      await revokeTokenFamily(rawRefreshToken);
    }

    if (user) {
      await repositories.auditLogs.create({
        action: "LOGOUT",
        actorId: user._id,
        actorRole: user.role,
        ipAddress: ip,
        userAgent,
      });
    }
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
    ip?: string,
    userAgent?: string
  ): Promise<void> {
    const user = await repositories.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Verify current password
    const isCurrentValid = await verifyPassword(user.passwordHash, input.currentPassword);
    if (!isCurrentValid) {
      throw new BadRequestError("Current password is incorrect", "INVALID_CURRENT_PASSWORD");
    }

    // Validate new password policy
    validatePasswordPolicy(input.newPassword, {
      name: user.name,
      email: user.email,
    });

    // Hash new password
    const newHash = await hashPassword(input.newPassword);

    // Update password hash, bump tokenVersion (invalidating existing access tokens), and revoke all refresh tokens
    await repositories.users.update(userId, { passwordHash: newHash });
    await repositories.users.incrementTokenVersion(userId);
    await repositories.refreshTokens.revokeAllForUser(userId);

    await repositories.auditLogs.create({
      action: "PASSWORD_CHANGE",
      actorId: user._id,
      actorRole: user.role,
      ipAddress: ip,
      userAgent,
    });
  }

  async getMe(userId: string): Promise<UserEntity> {
    const user = await repositories.users.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }
    return user;
  }
}

export const authService = new AuthService();

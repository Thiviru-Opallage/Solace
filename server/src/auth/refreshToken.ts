import crypto from "node:crypto";
import { repositories } from "../repositories/index.js";
import { SECURITY_CONFIG } from "../config/security.js";
import { UnauthorizedError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

/**
 * Computes a SHA-256 hash of a raw refresh token string.
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Issues a new refresh token (and new familyId if not rotating).
 * Returns the raw token string to set in the cookie and the familyId.
 */
export async function issueRefreshToken(userId: string, existingFamilyId?: string): Promise<{ rawToken: string; familyId: string }> {
  // Generate random 256-bit token (32 bytes = 64 hex chars)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const familyId = existingFamilyId || `fam-${crypto.randomUUID()}`;

  const expiresAt = new Date(
    Date.now() + SECURITY_CONFIG.tokens.refreshTokenExpirySeconds * 1000
  ).toISOString();

  await repositories.refreshTokens.create({
    tokenHash,
    familyId,
    userId,
    expiresAt,
  });

  return { rawToken, familyId };
}

export interface RotatedTokens {
  userId: string;
  newRawRefreshToken: string;
  familyId: string;
}

/**
 * Rotates a refresh token:
 * 1. Hashes incoming token.
 * 2. Finds record in database.
 * 3. REUSE DETECTION: If token record exists but is already revoked, an attacker/victim is reusing an old token!
 *    Revoke the ENTIRE family immediately and throw UnauthorizedError.
 * 4. Check if token expired.
 * 5. Mark incoming token as revoked, issue a new token in the same family.
 */
export async function rotateRefreshToken(rawToken: string): Promise<RotatedTokens> {
  const tokenHash = hashToken(rawToken);
  const existing = await repositories.refreshTokens.findByTokenHash(tokenHash);

  if (!existing) {
    throw new UnauthorizedError("Invalid refresh session");
  }

  // 3. Token Reuse Detection: If an already-revoked token is used, revoke the entire family
  if (existing.isRevoked) {
    logger.warn(
      { familyId: existing.familyId, userId: existing.userId },
      "SECURITY ALERT: Refresh token reuse detected! Revoking entire token family."
    );
    await repositories.refreshTokens.revokeFamily(existing.familyId);
    await repositories.auditLogs.create({
      action: "REFRESH_TOKEN_REUSE_DETECTED",
      actorId: existing.userId,
      details: { familyId: existing.familyId },
    });
    throw new UnauthorizedError("Invalid refresh session: token reuse detected");
  }

  // Check expiration
  if (new Date(existing.expiresAt).getTime() < Date.now()) {
    throw new UnauthorizedError("Refresh token expired");
  }

  // Issue new token in the same family
  const { rawToken: newRawToken } = await issueRefreshToken(existing.userId, existing.familyId);
  const newHash = hashToken(newRawToken);

  // Mark current token as revoked and replaced
  await repositories.refreshTokens.markAsRevoked(existing._id, newHash);

  return {
    userId: existing.userId,
    newRawRefreshToken: newRawToken,
    familyId: existing.familyId,
  };
}

/**
 * Revokes an entire token family (called on logout).
 */
export async function revokeTokenFamily(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  const existing = await repositories.refreshTokens.findByTokenHash(tokenHash);
  if (existing) {
    await repositories.refreshTokens.revokeFamily(existing.familyId);
  }
}

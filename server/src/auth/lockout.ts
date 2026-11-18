import { repositories } from "../repositories/index.js";
import { UserEntity } from "../repositories/types.js";
import { SECURITY_CONFIG } from "../config/security.js";
import { AccountLockedError } from "../utils/errors.js";

/**
 * Checks if the user is currently locked out.
 * Throws AccountLockedError if locked.
 */
export function checkAccountLockout(user: UserEntity): void {
  if (user.lockUntil) {
    const lockTime = new Date(user.lockUntil).getTime();
    const now = Date.now();
    if (lockTime > now) {
      const remainingSeconds = Math.ceil((lockTime - now) / 1000);
      throw new AccountLockedError(remainingSeconds);
    }
  }
}

/**
 * Handles recording a failed login.
 * If failedLoginCount + 1 reaches maxFailedAttempts (5), locks account for 15 minutes.
 */
export async function handleFailedLogin(user: UserEntity): Promise<{ isLocked: boolean; remainingSeconds?: number }> {
  const newCount = user.failedLoginCount + 1;
  let lockUntil: string | null = null;
  let isLocked = false;
  let remainingSeconds: number | undefined;

  if (newCount >= SECURITY_CONFIG.lockout.maxFailedAttempts) {
    const lockDate = new Date(Date.now() + SECURITY_CONFIG.lockout.lockoutDurationMs);
    lockUntil = lockDate.toISOString();
    isLocked = true;
    remainingSeconds = Math.ceil(SECURITY_CONFIG.lockout.lockoutDurationMs / 1000);
  }

  await repositories.users.recordFailedLogin(user._id, lockUntil);

  return { isLocked, remainingSeconds };
}

/**
 * Resets failed login counters on successful authentication.
 */
export async function handleSuccessfulLogin(user: UserEntity): Promise<void> {
  if (user.failedLoginCount > 0 || user.lockUntil !== null) {
    await repositories.users.resetFailedLogins(user._id);
  }
}

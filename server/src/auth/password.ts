import argon2 from "argon2";
import { SECURITY_CONFIG } from "../config/security.js";
import { COMMON_PASSWORDS } from "./commonPasswords.js";
import { BadRequestError } from "../utils/errors.js";

// Pre-computed dummy argon2id hash to run verification against when an email is unknown,
// ensuring execution timing does not reveal whether an account exists.
const DUMMY_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$dHVteW15c2FsdDEyMzQ1Ng$QySjKpzX18a6X0ZzH05iS698nS2/J8s5h9Zk138sKNo";

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: SECURITY_CONFIG.argon2.memoryCost,
    timeCost: SECURITY_CONFIG.argon2.timeCost,
    parallelism: SECURITY_CONFIG.argon2.parallelism,
    hashLength: SECURITY_CONFIG.argon2.hashLength,
  });
}

export async function verifyPassword(hash: string, plainText: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

/**
 * Executes a dummy password verification to maintain uniform timing
 * when a user is not found during login.
 */
export async function dummyVerify(plainText: string): Promise<void> {
  try {
    await argon2.verify(DUMMY_HASH, plainText);
  } catch {
    // Ignore error, dummy check only
  }
}

export interface PasswordValidationContext {
  email?: string;
  name?: string;
}

export function validatePasswordPolicy(password: string, context?: PasswordValidationContext): void {
  const cfg = SECURITY_CONFIG.password;

  if (!password || password.length < cfg.minLength) {
    throw new BadRequestError(`Password must be at least ${cfg.minLength} characters long`, "PASSWORD_TOO_SHORT");
  }

  if (password.length > cfg.maxLength) {
    throw new BadRequestError(`Password must not exceed ${cfg.maxLength} characters`, "PASSWORD_TOO_LONG");
  }

  if (cfg.requireUppercase && !/[A-Z]/.test(password)) {
    throw new BadRequestError("Password must contain at least one uppercase letter", "PASSWORD_MISSING_UPPERCASE");
  }

  if (cfg.requireLowercase && !/[a-z]/.test(password)) {
    throw new BadRequestError("Password must contain at least one lowercase letter", "PASSWORD_MISSING_LOWERCASE");
  }

  if (cfg.requireNumber && !/[0-9]/.test(password)) {
    throw new BadRequestError("Password must contain at least one number", "PASSWORD_MISSING_NUMBER");
  }

  if (cfg.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    throw new BadRequestError("Password must contain at least one special character", "PASSWORD_MISSING_SPECIAL");
  }

  // Check if password contains the user's name
  if (context?.name && context.name.trim().length >= 3) {
    const nameParts = context.name.toLowerCase().split(/\s+/);
    const passLower = password.toLowerCase();
    for (const part of nameParts) {
      if (part.length >= 3 && passLower.includes(part)) {
        throw new BadRequestError("Password must not contain your name", "PASSWORD_CONTAINS_NAME");
      }
    }
  }

  // Check if password contains the user's email or username portion
  if (context?.email) {
    const emailPrefix = context.email.split("@")[0]?.toLowerCase();
    const passLower = password.toLowerCase();
    if (emailPrefix && emailPrefix.length >= 3 && passLower.includes(emailPrefix)) {
      throw new BadRequestError("Password must not contain parts of your email address", "PASSWORD_CONTAINS_EMAIL");
    }
  }

  // Check common password blacklist
  if (COMMON_PASSWORDS.has(password.toLowerCase()) || COMMON_PASSWORDS.has(password)) {
    throw new BadRequestError("Password is too common or easily guessable", "PASSWORD_TOO_COMMON");
  }
}

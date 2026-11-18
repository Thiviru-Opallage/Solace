import { UserEntity, Classification, ClearanceLevel } from "../repositories/types.js";
import { SECURITY_CONFIG } from "../config/security.js";
import { MacDeniedError } from "../utils/errors.js";

/**
 * Classifies a claim based on the claimed amount and optional fraud flag.
 *
 * Classification rules:
 *   - isFraudFlag=true → restricted (level 3)
 *   - amount <= standardMaxAmount (60 000) → standard (level 1)
 *   - amount <= confidentialMaxAmount (120 000) → confidential (level 2)
 *   - amount > confidentialMaxAmount → restricted (level 3)
 */
export function classifyClaim(
  claimedAmount: number,
  isFraudFlag = false
): { classification: Classification; classificationLevel: ClearanceLevel } {
  if (isFraudFlag) {
    return { classification: "restricted", classificationLevel: 3 };
  }

  const { standardMaxAmount, confidentialMaxAmount } = SECURITY_CONFIG.mac.thresholds;

  if (claimedAmount <= standardMaxAmount) {
    return { classification: "standard", classificationLevel: 1 };
  }

  if (claimedAmount <= confidentialMaxAmount) {
    return { classification: "confidential", classificationLevel: 2 };
  }

  return { classification: "restricted", classificationLevel: 3 };
}

/**
 * Enforces MAC access control for adjusters.
 * Customers and agents bypass MAC checks entirely.
 * Throws MacDeniedError if the adjuster's clearance is below the required classification level.
 */
export function checkMacAccess(user: UserEntity, classificationLevel: ClearanceLevel): void {
  if (user.role !== "adjuster") {
    // Only adjusters are MAC-gated
    return;
  }

  const userClearance: ClearanceLevel = user.clearance ?? 1;

  if (userClearance < classificationLevel) {
    throw new MacDeniedError(classificationLevel);
  }
}

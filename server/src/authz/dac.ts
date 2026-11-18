import { PolicyEntity, UserEntity } from "../repositories/types.js";
import { SECURITY_CONFIG } from "../config/security.js";
import { ForbiddenError, ConflictError } from "../utils/errors.js";

/**
 * DAC read check: the requesting user must be the policy owner (customerId)
 * or have been explicitly granted shared access (sharedWith).
 * Agents and adjusters have broader scopes handled at the repository level.
 */
export function checkPolicyOwnership(policy: PolicyEntity, user: UserEntity): void {
  if (user.role === "agent" || user.role === "adjuster") {
    // Broader access handled via scope at repository layer
    return;
  }

  const isOwner = policy.customerId === user._id;
  const isShared = policy.sharedWith.some((s) => s.userId === user._id);

  if (!isOwner && !isShared) {
    throw new ForbiddenError("You do not have access to this policy");
  }
}

/**
 * DAC mutability check: only the owning agent or the policy's customer-owner
 * may mutate a policy. Adjusters are read-only for policies.
 */
export function checkPolicyMutability(policy: PolicyEntity, user: UserEntity): void {
  if (user.role === "adjuster") {
    throw new ForbiddenError("Adjusters cannot modify policies");
  }

  if (user.role === "agent") {
    // Agents can modify any policy they manage (scope enforced at repo layer)
    return;
  }

  // For customers, only the owner may mutate
  if (policy.customerId !== user._id) {
    throw new ForbiddenError("Only the policy owner can modify this policy");
  }
}

/**
 * DAC grant limit check: prevents exceeding the maximum number of shared-access
 * grantees per policy as configured in SECURITY_CONFIG.dac.
 */
export function checkDacGrantLimit(policy: PolicyEntity): void {
  if (policy.sharedWith.length >= SECURITY_CONFIG.dac.maxGranteesPerPolicy) {
    throw new ConflictError(
      `Policy cannot be shared with more than ${SECURITY_CONFIG.dac.maxGranteesPerPolicy} users`
    );
  }
}

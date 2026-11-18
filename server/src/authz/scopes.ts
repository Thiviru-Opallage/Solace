import { UserEntity, PolicyScope, ClaimScope, PaymentScope } from "../repositories/types.js";

/**
 * Builds the appropriate PolicyScope for the given user:
 * - customer → can see own policies + shared ones
 * - agent    → can see policies they manage
 * - adjuster → can see all policies (read-only access controlled by RBAC)
 */
export function buildPolicyScope(user: UserEntity): PolicyScope {
  switch (user.role) {
    case "customer":
      return { type: "customer", userId: user._id, includeShared: true };
    case "agent":
      return { type: "agent", agentId: user._id };
    case "adjuster":
      return { type: "adjuster" };
  }
}

/**
 * Builds the appropriate ClaimScope for the given user.
 *
 * @param user - The authenticated user.
 * @param managedOrOwnedPolicyIds - For customers: IDs of policies they own or share.
 *                                  For agents: IDs of policies they manage.
 */
export function buildClaimScope(
  user: UserEntity,
  managedOrOwnedPolicyIds: string[] = []
): ClaimScope {
  switch (user.role) {
    case "customer":
      return {
        type: "customer",
        userId: user._id,
        sharedPolicyIds: managedOrOwnedPolicyIds,
      };
    case "agent":
      return {
        type: "agent",
        agentId: user._id,
        managedPolicyIds: managedOrOwnedPolicyIds,
      };
    case "adjuster": {
      // Adjusters see claims up to their clearance level
      const maxLevel: number = user.clearance ?? 1;
      return { type: "adjuster", maxClassificationLevel: maxLevel };
    }
  }
}

/**
 * Builds the appropriate PaymentScope for the given user.
 *
 * @param user - The authenticated user.
 * @param customerClaimIds - For customers: IDs of claims they own.
 */
export function buildPaymentScope(
  user: UserEntity,
  customerClaimIds: string[] = []
): PaymentScope {
  switch (user.role) {
    case "customer":
      return { type: "customer", customerClaimIds };
    case "agent":
      // Agents can read all payments (read-only access)
      return { type: "all" };
    case "adjuster":
      return { type: "adjuster" };
  }
}

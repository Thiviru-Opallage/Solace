import { Role, ClaimStatus } from "../repositories/types.js";
import { BadRequestError } from "../utils/errors.js";

/**
 * Allowed claim status transitions per role.
 *
 * customer:  can only respond to Info Requested → moves to Under Review
 * agent:     read-only (no transitions allowed)
 * adjuster:  full workflow control
 */
export const STATUS_TRANSITIONS: Record<Role, Partial<Record<ClaimStatus, ClaimStatus[]>>> = {
  customer: {
    "Info Requested": ["Under Review"],
  },
  agent: {},
  adjuster: {
    Pending: ["Under Review", "Approved", "Rejected", "Info Requested"],
    "Under Review": ["Approved", "Rejected", "Info Requested"],
    "Info Requested": ["Under Review", "Approved", "Rejected"],
    Approved: ["Paid"],
  },
};

/**
 * Validates whether a status transition is permitted for the given role.
 * Throws BadRequestError if the transition is not in the allowed list.
 */
export function validateStatusTransition(
  from: ClaimStatus,
  to: ClaimStatus,
  role: Role
): void {
  const roleTransitions = STATUS_TRANSITIONS[role];
  const allowed = roleTransitions[from];

  if (!allowed || !allowed.includes(to)) {
    throw new BadRequestError(
      `Transition from '${from}' to '${to}' is not permitted for role '${role}'`
    );
  }
}

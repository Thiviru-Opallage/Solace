import { Role } from "../repositories/types.js";

export type Action = "create" | "read" | "update" | "delete";
export type Resource =
  | "policy"
  | "claim"
  | "payment"
  | "user"
  | "analytics"
  | "note"
  | "document";

/**
 * RBAC permission matrix.
 * Defines which actions each role may perform on each resource.
 */
export const PERMISSION_MATRIX: Record<Role, Partial<Record<Resource, Action[]>>> = {
  customer: {
    policy: ["read"],
    claim: ["create", "read"],
    payment: ["read"],
    user: ["update"], // own profile update only via /me; listing users disallowed
    document: ["create", "read"],
  },
  agent: {
    policy: ["create", "read", "update"],
    claim: ["read"],
    payment: ["read"],
    user: ["read", "update"], // own profile only — enforced at service layer
    analytics: ["read"],
  },
  adjuster: {
    policy: ["read"],
    claim: ["read", "update"],
    payment: ["create", "read"],
    user: ["read", "update"], // own profile only — enforced at service layer
    analytics: ["read"],
    note: ["create", "read"],
    document: ["read"],
  },
};

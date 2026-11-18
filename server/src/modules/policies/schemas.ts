import { z } from "zod";
import { SECURITY_CONFIG } from "../../config/security.js";

const coverageSchema = z.object({
  amount: z.number().positive(),
  deductible: z.number().min(0),
});

const premiumSchema = z.object({
  amount: z.number().positive(),
  frequency: z.enum(["monthly", "quarterly", "annual"]),
});

const motorDetailsSchema = z.object({
  type: z.literal("motor"),
  motor: z.object({
    make: z.string().min(1).max(100),
    model: z.string().min(1).max(100),
    registrationNumber: z.string().min(1).max(50),
    manufactureYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  }),
});

const healthDetailsSchema = z.object({
  type: z.literal("health"),
  health: z.object({
    dependents: z.array(z.string().max(100)).max(20),
    network: z.enum(["Standard", "Comprehensive", "Global"]),
    roomType: z.enum(["Private", "Semi-Private", "Deluxe"]),
  }),
});

const homeDetailsSchema = z.object({
  type: z.literal("home"),
  home: z.object({
    propertyAddress: z.string().min(1).max(300),
    propertyValue: z.number().positive(),
    constructionYear: z.number().int().min(1800).max(new Date().getFullYear()),
  }),
});

const travelDetailsSchema = z.object({
  type: z.literal("travel"),
  travel: z.object({
    destination: z.string().min(1).max(200),
    departureDate: z.string().transform((s) => s.slice(0, 10)).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    returnDate: z.string().transform((s) => s.slice(0, 10)).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    travellersCount: z.number().int().min(1).max(50),
  }),
});

const policyDetailsSchema = z.discriminatedUnion("type", [
  motorDetailsSchema,
  healthDetailsSchema,
  homeDetailsSchema,
  travelDetailsSchema,
]);

/** POST /api/policies */
export const createPolicySchema = z.object({
  type: z.enum(["motor", "health", "home", "travel"]),
  customerId: z.string().min(1),
  coverage: coverageSchema,
  premium: premiumSchema,
  renewalDate: z.string().transform((s) => s.slice(0, 10)).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")),
  details: policyDetailsSchema,
});

export type CreatePolicyInput = z.infer<typeof createPolicySchema>;

/** PATCH /api/policies/:id */
export const updatePolicySchema = z.object({
  coverage: coverageSchema.optional(),
  premium: premiumSchema.optional(),
  renewalDate: z.string().transform((s) => s.slice(0, 10)).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  status: z.enum(["active", "expired", "cancelled", "pending"]).optional(),
  details: policyDetailsSchema.optional(),
});

export type UpdatePolicyInput = z.infer<typeof updatePolicySchema>;

/** POST /api/policies/request — customer requests a policy */
export const requestPolicySchema = z.object({
  type: z.enum(["motor", "health", "home", "travel"]),
  coverageAmount: z.number().positive(),
  note: z.string().max(1000).optional(),
});

export type RequestPolicyInput = z.infer<typeof requestPolicySchema>;

/** POST /api/policies/:id/share */
export const sharePolicySchema = z.object({
  email: z.string().email("Must be a valid email address"),
});

export type SharePolicyInput = z.infer<typeof sharePolicySchema>;

/** DELETE /api/policies/:id/share/:userId — no body */

/** GET /api/policies query params */
export const policyQuerySchema = z.object({
  customerId: z.string().optional(),
  agentId: z.string().optional(),
  type: z.enum(["motor", "health", "home", "travel"]).optional(),
  status: z.enum(["active", "expired", "cancelled", "pending"]).optional(),
  search: z.string().max(SECURITY_CONFIG.limits.maxSearchQueryLength).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(SECURITY_CONFIG.limits.maxPaginationLimit)
    .default(SECURITY_CONFIG.limits.defaultPaginationLimit),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PolicyQuery = z.infer<typeof policyQuerySchema>;

import { z } from "zod";
import { SECURITY_CONFIG } from "../../config/security.js";

/** POST /api/claims — create a new claim */
export const createClaimSchema = z.object({
  policyId: z.string().min(1),
  customerId: z.string().min(1),
  incident: z.object({
    date: z.string().transform((s) => s.slice(0, 10)).pipe(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")),
    location: z.string().min(1).max(300),
    description: z.string().min(1).max(2000),
  }),
  claimedAmount: z.number().positive(),
  documents: z
    .array(
      z.object({
        fileName: z.string(),
        url: z.string(),
        type: z.string(),
        fileSize: z.string().optional(),
      })
    )
    .optional(),
});

export type CreateClaimInput = z.infer<typeof createClaimSchema>;

/** PATCH /api/claims/:id/status */
export const updateClaimStatusSchema = z.object({
  status: z.enum(["Pending", "Under Review", "Info Requested", "Approved", "Rejected", "Paid"]),
  comment: z.string().max(2000).optional(),
});

export type UpdateClaimStatusInput = z.infer<typeof updateClaimStatusSchema>;

/** POST /api/claims/:id/notes */
export const addNoteSchema = z.object({
  note: z.string().min(1).max(2000),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;

/** POST /api/claims/:id/respond-info */
export const respondInfoSchema = z.object({
  responseText: z.string().min(1).max(2000),
});

export type RespondInfoInput = z.infer<typeof respondInfoSchema>;

/** GET /api/claims query params */
export const claimQuerySchema = z.object({
  customerId: z.string().optional(),
  policyId: z.string().optional(),
  status: z
    .enum(["Pending", "Under Review", "Info Requested", "Approved", "Rejected", "Paid"])
    .optional(),
  search: z.string().max(SECURITY_CONFIG.limits.maxSearchQueryLength).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(SECURITY_CONFIG.limits.maxPaginationLimit)
    .default(SECURITY_CONFIG.limits.defaultPaginationLimit),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ClaimQuery = z.infer<typeof claimQuerySchema>;

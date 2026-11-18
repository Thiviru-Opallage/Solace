import { z } from "zod";
import { SECURITY_CONFIG } from "../../config/security.js";

/** PATCH /api/users/me — update own profile */
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  nic: z.string().max(30).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** POST /api/users/me/reveal — reveal a sensitive encrypted field */
export const revealSensitiveFieldSchema = z.object({
  field: z.enum(["phone", "nic"]),
});

export type RevealSensitiveFieldInput = z.infer<typeof revealSensitiveFieldSchema>;

/** Query params for GET /api/users */
export const listUsersQuerySchema = z.object({
  search: z.string().max(SECURITY_CONFIG.limits.maxSearchQueryLength).optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(SECURITY_CONFIG.limits.maxPaginationLimit)
    .default(SECURITY_CONFIG.limits.defaultPaginationLimit),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

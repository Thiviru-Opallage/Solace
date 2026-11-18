import { z } from "zod";
import { SECURITY_CONFIG } from "../../config/security.js";

/** POST /api/payments — record a payment for an approved claim */
export const recordPaymentSchema = z.object({
  claimId: z.string().min(1),
  amount: z.number().positive(),
  method: z.enum(["Bank Transfer", "Direct Deposit", "Cheque"]),
  reference: z.string().max(100).optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

/** GET /api/payments query params */
export const paymentQuerySchema = z.object({
  claimId: z.string().optional(),
  customerId: z.string().optional(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(SECURITY_CONFIG.limits.maxPaginationLimit)
    .default(SECURITY_CONFIG.limits.defaultPaginationLimit),
  offset: z.coerce.number().int().min(0).default(0),
});

export type PaymentQuery = z.infer<typeof paymentQuerySchema>;

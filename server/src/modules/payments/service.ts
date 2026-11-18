import {
  PaymentEntity,
  PaymentScope,
  UserEntity,
} from "../../repositories/types.js";
import { repositories } from "../../repositories/index.js";
import { PaymentFilterCriteria } from "../../repositories/IPaymentRepository.js";
import { NotFoundError, BadRequestError, ConflictError } from "../../utils/errors.js";
import { RecordPaymentInput } from "./schemas.js";

export class PaymentsService {
  /**
   * Lists payments scoped to the user's role/access.
   */
  async list(
    scope: PaymentScope,
    filters: {
      claimId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<PaymentEntity[]> {
    const criteria: PaymentFilterCriteria = {
      scope,
      claimId: filters.claimId,
      limit: filters.limit,
      skip: filters.offset,
    };
    return repositories.payments.find(criteria);
  }

  /**
   * Records a disbursement payment for an Approved claim.
   * Atomically updates the claim status to Paid.
   */
  async recordPayment(
    input: RecordPaymentInput,
    adjuster: UserEntity,
    ip?: string,
    userAgent?: string
  ): Promise<PaymentEntity> {
    const claim = await repositories.claims.findById(input.claimId);
    if (!claim) {
      throw new NotFoundError("Claim not found");
    }

    if (claim.currentStatus !== "Approved") {
      throw new BadRequestError(
        `Cannot record payment: claim is currently '${claim.currentStatus}'. Only 'Approved' claims can be paid.`,
        "CLAIM_NOT_APPROVED"
      );
    }

    // Check if payment already exists for this claim (1:1 constraint)
    const existing = await repositories.payments.findByClaimId(input.claimId);
    if (existing) {
      throw new ConflictError("A payment has already been recorded for this claim", "PAYMENT_EXISTS");
    }

    // Fetch policy for policyNumber
    const policy = await repositories.policies.findById(claim.policyId);
    const policyNumber = policy?.policyNumber;

    const now = new Date().toISOString();
    const reference = input.reference?.trim() || `PAY-${Date.now()}`;

    // Create payment entity
    const payment = await repositories.payments.create({
      claimId: claim._id,
      claimNumber: claim.claimNumber,
      policyNumber,
      amount: input.amount,
      method: input.method,
      paidAt: now,
      reference,
      recordedBy: adjuster._id,
      recordedByName: adjuster.name,
    });

    // Update claim status to Paid with statusHistory entry
    await repositories.claims.updateStatus(
      claim._id,
      "Paid",
      {
        status: "Paid",
        by: adjuster.name,
        byRole: "adjuster",
        at: now,
        comment: `Disbursement of ${input.amount} recorded via ${input.method}. Ref: ${reference}`,
      },
      "Approved"
    );

    // Audit log
    await repositories.auditLogs.create({
      action: "PAYMENT_RECORD",
      actorId: adjuster._id,
      actorRole: adjuster.role,
      targetId: payment._id,
      targetType: "payment",
      ipAddress: ip,
      userAgent,
      details: {
        claimId: claim._id,
        claimNumber: claim.claimNumber,
        amount: input.amount,
        method: input.method,
        reference,
      },
    });

    return payment;
  }
}

export const paymentsService = new PaymentsService();

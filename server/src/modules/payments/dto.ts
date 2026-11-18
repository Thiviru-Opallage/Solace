import { PaymentEntity } from "../../repositories/types.js";

/** Frontend-facing Payment DTO */
export interface PaymentDto {
  _id: string;
  claimId: string;
  claimNumber?: string;
  policyNumber?: string;
  amount: number;
  method: PaymentEntity["method"];
  paidAt: string;
  reference: string;
  recordedBy: string;
  recordedByName?: string;
  createdAt: string;
}

export function toPaymentDto(entity: PaymentEntity): PaymentDto {
  return {
    _id: entity._id,
    claimId: entity.claimId,
    claimNumber: entity.claimNumber,
    policyNumber: entity.policyNumber,
    amount: entity.amount,
    method: entity.method,
    paidAt: entity.paidAt,
    reference: entity.reference,
    recordedBy: entity.recordedBy,
    recordedByName: entity.recordedByName,
    createdAt: entity.createdAt,
  };
}

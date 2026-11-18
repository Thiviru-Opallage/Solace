import { PaymentEntity, PaymentScope } from "./types.js";

export interface PaymentFilterCriteria {
  scope: PaymentScope;
  claimId?: string;
  limit?: number;
  skip?: number;
}

export interface CreatePaymentData {
  _id?: string;
  claimId: string;
  claimNumber?: string;
  policyNumber?: string;
  amount: number;
  method: PaymentEntity["method"];
  paidAt: string;
  reference: string;
  recordedBy: string;
  recordedByName?: string;
}

export interface IPaymentRepository {
  findById(id: string): Promise<PaymentEntity | null>;
  findByClaimId(claimId: string): Promise<PaymentEntity | null>;
  findByReference(reference: string): Promise<PaymentEntity | null>;
  find(criteria: PaymentFilterCriteria): Promise<PaymentEntity[]>;
  create(data: CreatePaymentData): Promise<PaymentEntity>;
}

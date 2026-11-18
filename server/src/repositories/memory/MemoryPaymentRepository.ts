import { IPaymentRepository, PaymentFilterCriteria, CreatePaymentData } from "../IPaymentRepository.js";
import { PaymentEntity } from "../types.js";
import crypto from "node:crypto";

export class MemoryPaymentRepository implements IPaymentRepository {
  private payments = new Map<string, PaymentEntity>();

  async findById(id: string): Promise<PaymentEntity | null> {
    const payment = this.payments.get(id);
    return payment ? { ...payment } : null;
  }

  async findByClaimId(claimId: string): Promise<PaymentEntity | null> {
    for (const payment of this.payments.values()) {
      if (payment.claimId === claimId) {
        return { ...payment };
      }
    }
    return null;
  }

  async findByReference(reference: string): Promise<PaymentEntity | null> {
    for (const payment of this.payments.values()) {
      if (payment.reference === reference) {
        return { ...payment };
      }
    }
    return null;
  }

  async find(criteria: PaymentFilterCriteria): Promise<PaymentEntity[]> {
    const results: PaymentEntity[] = [];

    for (const payment of this.payments.values()) {
      if (criteria.scope.type === "customer") {
        if (!criteria.scope.customerClaimIds.includes(payment.claimId)) {
          continue;
        }
      } else if (criteria.scope.type === "adjuster") {
        if (criteria.scope.allowedClaimIds && !criteria.scope.allowedClaimIds.includes(payment.claimId)) {
          continue;
        }
      }

      if (criteria.claimId && payment.claimId !== criteria.claimId) {
        continue;
      }

      results.push({ ...payment });
    }

    results.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
    const skip = criteria.skip || 0;
    const limit = criteria.limit || 50;
    return results.slice(skip, skip + limit);
  }

  async create(data: CreatePaymentData): Promise<PaymentEntity> {
    const existingForClaim = await this.findByClaimId(data.claimId);
    if (existingForClaim) {
      const err = new Error(`E11000 duplicate key error: payment for claimId ${data.claimId} already exists`);
      (err as unknown as { code: number }).code = 11000;
      throw err;
    }

    const existingRef = await this.findByReference(data.reference);
    if (existingRef) {
      const err = new Error(`E11000 duplicate key error: reference ${data.reference} already exists`);
      (err as unknown as { code: number }).code = 11000;
      throw err;
    }

    const now = new Date().toISOString();
    const id = data._id || `pay-${crypto.randomUUID()}`;
    const payment: PaymentEntity = {
      _id: id,
      claimId: data.claimId,
      claimNumber: data.claimNumber,
      policyNumber: data.policyNumber,
      amount: data.amount,
      method: data.method,
      paidAt: data.paidAt || now,
      reference: data.reference,
      recordedBy: data.recordedBy,
      recordedByName: data.recordedByName,
      createdAt: now,
    };

    this.payments.set(id, payment);
    return { ...payment };
  }

  clear(): void {
    this.payments.clear();
  }
}

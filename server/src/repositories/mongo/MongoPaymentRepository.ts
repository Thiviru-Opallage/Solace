import { Filter } from "mongodb";
import { IPaymentRepository, PaymentFilterCriteria, CreatePaymentData } from "../IPaymentRepository.js";
import { PaymentEntity } from "../types.js";
import { getCollection, toObjectId, idFilter, normalizeDoc, normalizeDocs } from "./client.js";

export class MongoPaymentRepository implements IPaymentRepository {
  private async getCol() {
    const col = await getCollection("payments");
    await col.createIndex({ claimId: 1 }, { unique: true });
    await col.createIndex({ reference: 1 }, { unique: true });
    return col;
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const col = await this.getCol();
    const doc = await col.findOne(idFilter(id));
    return normalizeDoc<PaymentEntity>(doc);
  }

  async findByClaimId(claimId: string): Promise<PaymentEntity | null> {
    const col = await this.getCol();
    const doc = await col.findOne({ claimId });
    return normalizeDoc<PaymentEntity>(doc);
  }

  async findByReference(reference: string): Promise<PaymentEntity | null> {
    const col = await this.getCol();
    const doc = await col.findOne({ reference });
    return normalizeDoc<PaymentEntity>(doc);
  }

  async find(criteria: PaymentFilterCriteria): Promise<PaymentEntity[]> {
    const col = await this.getCol();
    const andClauses: Filter<any>[] = [];

    if (criteria.scope.type === "customer") {
      andClauses.push({ claimId: { $in: criteria.scope.customerClaimIds } });
    } else if (criteria.scope.type === "adjuster") {
      if (criteria.scope.allowedClaimIds) {
        andClauses.push({ claimId: { $in: criteria.scope.allowedClaimIds } });
      }
    }

    if (criteria.claimId) {
      andClauses.push({ claimId: criteria.claimId });
    }

    const query: Filter<any> = andClauses.length > 0 ? { $and: andClauses } : {};
    const skip = criteria.skip || 0;
    const limit = criteria.limit || 50;

    const docs = await col
      .find(query)
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return normalizeDocs<PaymentEntity>(docs);
  }

  async create(data: CreatePaymentData): Promise<PaymentEntity> {
    const col = await this.getCol();

    const existingClaim = await col.findOne({ claimId: data.claimId });
    if (existingClaim) {
      const err = new Error(`E11000 duplicate key error: payment for claimId ${data.claimId} already exists`);
      (err as unknown as { code: number }).code = 11000;
      throw err;
    }

    const existingRef = await col.findOne({ reference: data.reference });
    if (existingRef) {
      const err = new Error(`E11000 duplicate key error: reference ${data.reference} already exists`);
      (err as unknown as { code: number }).code = 11000;
      throw err;
    }

    const now = new Date().toISOString();
    const objectId = toObjectId(data._id);
    const paymentDoc: Record<string, any> = {
      _id: objectId,
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

    await col.insertOne(paymentDoc);
    return normalizeDoc<PaymentEntity>(paymentDoc)!;
  }
}

import { Payment, ClaimStatus } from "@/types";
import { mockStore, delay } from "@/lib/mock/store";
import { APP_CONFIG } from "@/lib/config";
import { apiFetch } from "./http";

export interface GetPaymentsParams {
  claimId?: string;
  customerId?: string;
}

export interface RecordPaymentInput {
  claimId: string;
  amount: number;
  method: "Bank Transfer" | "Direct Deposit" | "Cheque";
  reference: string;
  adjuster: { id: string; name: string };
  simulateFailure?: boolean;
}

export async function getPayments(params?: GetPaymentsParams): Promise<Payment[]> {
  if (!APP_CONFIG.useMock) {
    const query = new URLSearchParams();
    if (params?.claimId) query.set("claimId", params.claimId);
    if (params?.customerId) query.set("customerId", params.customerId);
    const res = await apiFetch(`/api/payments?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch payments");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.payments || []);
  }

  await delay(300);
  let list = mockStore.getPayments();

  if (params?.claimId) {
    list = list.filter((p) => p.claimId === params.claimId);
  }

  if (params?.customerId) {
    // Find claims belonging to this customer
    const userClaimIds = new Set(
      mockStore
        .getClaims()
        .filter((c) => c.customerId === params.customerId)
        .map((c) => c._id)
    );
    list = list.filter((p) => userClaimIds.has(p.claimId));
  }

  return list;
}

export async function recordPayment(input: RecordPaymentInput): Promise<Payment> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/payments", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to record payment");
    const data = await res.json();
    return data.payment || data;
  }

  await delay(600); // visible pending state

  // Simulated transaction failure toggle
  if (input.simulateFailure) {
    throw new Error(
      "Simulated transaction failure: Payment gateway timed out. Nothing was saved - the claim status is unchanged."
    );
  }

  const claim = mockStore.getClaimById(input.claimId);
  if (!claim) throw new Error("Claim not found");

  const policy = mockStore.getPolicyById(claim.policyId);

  const now = new Date().toISOString();
  const payment: Payment = {
    _id: `pay-${Date.now()}`,
    claimId: input.claimId,
    claimNumber: claim.claimNumber,
    policyNumber: policy?.policyNumber,
    amount: input.amount,
    method: input.method,
    paidAt: now,
    reference: input.reference,
    recordedBy: input.adjuster.id,
    recordedByName: input.adjuster.name,
  };

  // Atomic update: record payment AND update claim status to Paid
  mockStore.addPayment(payment);

  const updatedHistory = [
    ...claim.statusHistory,
    {
      status: "Paid" as ClaimStatus,
      by: input.adjuster.name,
      byRole: "adjuster" as const,
      at: now,
      comment: `Disbursement of ${input.amount} recorded via ${input.method}. Ref: ${input.reference}`,
    },
  ];

  mockStore.updateClaim(input.claimId, {
    currentStatus: "Paid",
    statusHistory: updatedHistory,
  });

  return payment;
}

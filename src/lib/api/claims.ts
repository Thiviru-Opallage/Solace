import {
  Claim,
  ClaimStatus,
  Classification,
  ClearanceLevel,
  Role,
  ClaimDocument,
} from "@/types";
import { mockStore, delay } from "@/lib/mock/store";
import { APP_CONFIG } from "@/lib/config";
import { apiFetch } from "./http";

export interface GetClaimsParams {
  customerId?: string;
  policyId?: string;
  status?: ClaimStatus;
  search?: string;
  classification?: Classification;
  userClearance?: ClearanceLevel;
}

export interface CreateClaimInput {
  policyId: string;
  customerId: string;
  incident: {
    date: string;
    location: string;
    description: string;
  };
  claimedAmount: number;
  documents: Array<{
    fileName: string;
    url: string;
    type: string;
    fileSize?: string;
  }>;
}

export async function getClaims(params?: GetClaimsParams): Promise<Claim[]> {
  if (!APP_CONFIG.useMock) {
    const query = new URLSearchParams();
    if (params?.customerId) query.set("customerId", params.customerId);
    if (params?.policyId) query.set("policyId", params.policyId);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const res = await apiFetch(`/api/claims?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch claims");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.claims || []);
  }

  await delay(350);
  let list = mockStore.getClaims();

  if (params?.customerId) {
    // If customerId is provided, also check if customer has access to shared policies
    const cid = params.customerId;
    // Get policies customer owns or has shared access to
    const accessiblePolicyIds = new Set(
      mockStore
        .getPolicies()
        .filter(
          (p) =>
            p.customerId === cid || p.sharedWith.some((s) => s.userId === cid)
        )
        .map((p) => p._id)
    );

    list = list.filter(
      (c) => c.customerId === cid || accessiblePolicyIds.has(c.policyId)
    );
  }

  if (params?.policyId) {
    list = list.filter((c) => c.policyId === params.policyId);
  }

  if (params?.status) {
    list = list.filter((c) => c.currentStatus === params.status);
  }

  if (params?.classification) {
    list = list.filter((c) => c.classification === params.classification);
  }

  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.claimNumber.toLowerCase().includes(q) ||
        c.incident.description.toLowerCase().includes(q) ||
        c.incident.location.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function getClaimById(id: string): Promise<Claim | null> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/claims/${id}`);
    if (!res.ok) {
      if (res.status === 403) {
        try {
          const errData = await res.json();
          if (errData.code === "MAC_DENIED") {
            const reqLevel = (errData.details?.requiredLevel || 3) as ClearanceLevel;
            const classification: Classification = reqLevel === 3 ? "restricted" : "confidential";
            return {
              _id: id,
              claimNumber: "CLM-PROTECTED",
              policyId: "",
              customerId: "",
              incident: {
                date: new Date().toISOString(),
                location: "[RESTRICTED ACCESS]",
                description: "Record details redacted under Mandatory Access Control policy.",
              },
              claimedAmount: 0,
              classification,
              documents: [],
              adjusterNotes: [],
              statusHistory: [],
              currentStatus: "Under Review",
              createdAt: new Date().toISOString(),
            };
          }
        } catch {
          // ignore parsing error
        }
      }
      return null;
    }
    const data = await res.json();
    return data.claim || data;
  }

  await delay(250);
  const found = mockStore.getClaimById(id);
  return found || null;
}

export async function createClaim(input: CreateClaimInput): Promise<Claim> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/claims", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create claim");
    const data = await res.json();
    return data.claim || data;
  }

  await delay(500);

  // MAC classification rule:
  // High claimed amounts (> 60,000) are classified as confidential
  // Regular claims are standard
  const classification: Classification =
    input.claimedAmount > 60000 ? "confidential" : "standard";

  const claimNum = `CLM-2025-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const customer = mockStore.getUserById(input.customerId);
  const customerName = customer ? customer.name : "Customer";

  const newClaim: Claim = {
    _id: `clm-${Date.now()}`,
    claimNumber: claimNum,
    policyId: input.policyId,
    customerId: input.customerId,
    incident: input.incident,
    claimedAmount: input.claimedAmount,
    classification,
    documents: input.documents.map((d, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      fileName: d.fileName,
      url: d.url,
      type: d.type,
      uploadedAt: now,
      fileSize: d.fileSize || "1.2 MB",
    })),
    adjusterNotes: [],
    statusHistory: [
      {
        status: "Pending",
        by: customerName,
        byRole: "customer",
        at: now,
        comment: "Claim submitted by policyholder.",
      },
    ],
    currentStatus: "Pending",
    createdAt: now,
  };

  return mockStore.addClaim(newClaim);
}

export async function updateClaimStatus(
  claimId: string,
  status: ClaimStatus,
  actor: { id: string; name: string; role: Role },
  comment?: string
): Promise<Claim> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/claims/${claimId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, actor, comment }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to update claim status");
    }
    const data = await res.json();
    return data.claim || data;
  }

  await delay(400);

  const claim = mockStore.getClaimById(claimId);
  if (!claim) throw new Error("Claim not found");

  const now = new Date().toISOString();
  const updatedHistory = [
    ...claim.statusHistory,
    {
      status,
      by: actor.name,
      byRole: actor.role,
      at: now,
      comment: comment || `Status updated to ${status}`,
    },
  ];

  return mockStore.updateClaim(claimId, {
    currentStatus: status,
    statusHistory: updatedHistory,
  });
}

export async function addClaimNote(
  claimId: string,
  noteText: string,
  adjuster: { id: string; name: string }
): Promise<Claim> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/claims/${claimId}/notes`, {
      method: "POST",
      body: JSON.stringify({ note: noteText, adjuster }),
    });
    if (!res.ok) throw new Error("Failed to add note");
    const data = await res.json();
    return data.claim || data;
  }

  await delay(300);

  const claim = mockStore.getClaimById(claimId);
  if (!claim) throw new Error("Claim not found");

  const newNote = {
    id: `not-${Date.now()}`,
    adjusterId: adjuster.id,
    adjusterName: adjuster.name,
    note: noteText,
    createdAt: new Date().toISOString(),
  };

  return mockStore.updateClaim(claimId, {
    adjusterNotes: [...claim.adjusterNotes, newNote],
  });
}

export async function respondToInfoRequest(
  claimId: string,
  responseText: string,
  actor: { name: string; role: Role },
  documents?: ClaimDocument[]
): Promise<Claim> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/claims/${claimId}/respond-info`, {
      method: "POST",
      body: JSON.stringify({ responseText, actor, documents }),
    });
    if (!res.ok) throw new Error("Failed to respond to information request");
    const data = await res.json();
    return data.claim || data;
  }

  await delay(450);

  const claim = mockStore.getClaimById(claimId);
  if (!claim) throw new Error("Claim not found");

  const now = new Date().toISOString();
  const updatedDocs = documents ? [...claim.documents, ...documents] : claim.documents;

  const updatedHistory = [
    ...claim.statusHistory,
    {
      status: "Under Review" as ClaimStatus,
      by: actor.name,
      byRole: actor.role,
      at: now,
      comment: `Customer provided requested details: ${responseText}`,
    },
  ];

  return mockStore.updateClaim(claimId, {
    currentStatus: "Under Review",
    documents: updatedDocs,
    statusHistory: updatedHistory,
  });
}

// Live claim tracking subscription
export function subscribeToClaim(
  claimId: string,
  callback: (claim: Claim) => void
): () => void {
  if (!APP_CONFIG.useMock) {
    const intervalId = setInterval(async () => {
      try {
        const fresh = await getClaimById(claimId);
        if (fresh) {
          callback(fresh);
        }
      } catch {
        // ignore background poll errors
      }
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }

  // Mock uses memory pubsub + 5s polling safeguard
  const unsubscribe = mockStore.subscribeToClaim(claimId, callback);

  const intervalId = setInterval(() => {
    const fresh = mockStore.getClaimById(claimId);
    if (fresh) {
      callback(fresh);
    }
  }, 5000);

  return () => {
    unsubscribe();
    clearInterval(intervalId);
  };
}

// Live claims queue subscription (for adjuster queue refresh badge)
export function subscribeToClaimsQueue(
  callback: (claims: Claim[]) => void
): () => void {
  if (!APP_CONFIG.useMock) {
    const intervalId = setInterval(async () => {
      try {
        const fresh = await getClaims();
        callback(fresh);
      } catch {
        // ignore background poll errors
      }
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }

  const unsubscribe = mockStore.subscribeToClaimsQueue(callback);

  const intervalId = setInterval(() => {
    callback(mockStore.getClaims());
  }, 6000);

  return () => {
    unsubscribe();
    clearInterval(intervalId);
  };
}

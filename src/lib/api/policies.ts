import { Policy, PolicyType, PolicyStatus, PolicyDetails } from "@/types";
import { mockStore, delay } from "@/lib/mock/store";
import { APP_CONFIG } from "@/lib/config";
import { apiFetch } from "./http";

export interface GetPoliciesParams {
  customerId?: string;
  agentId?: string;
  type?: PolicyType;
  status?: PolicyStatus;
  search?: string;
  includeShared?: boolean;
}

export interface CreatePolicyInput {
  type: PolicyType;
  customerId: string;
  agentId: string;
  coverage: {
    amount: number;
    deductible: number;
  };
  premium: {
    amount: number;
    frequency: "monthly" | "quarterly" | "annual";
  };
  renewalDate: string;
  details: PolicyDetails;
}

export async function getPolicies(params?: GetPoliciesParams): Promise<Policy[]> {
  if (!APP_CONFIG.useMock) {
    const query = new URLSearchParams();
    if (params?.customerId) query.set("customerId", params.customerId);
    if (params?.agentId) query.set("agentId", params.agentId);
    if (params?.type) query.set("type", params.type);
    if (params?.status) query.set("status", params.status);
    if (params?.search) query.set("search", params.search);
    const res = await apiFetch(`/api/policies?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch policies");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.policies || []);
  }

  await delay(350);
  let list = mockStore.getPolicies();

  if (params?.customerId) {
    // If customerId is provided, also include policies where customer is in sharedWith if includeShared != false
    const cid = params.customerId;
    list = list.filter((p) => {
      const isOwner = p.customerId === cid;
      const isShared =
        params.includeShared !== false &&
        p.sharedWith?.some((s) => s.userId === cid);
      return isOwner || isShared;
    });
  }

  if (params?.agentId) {
    list = list.filter((p) => p.agentId === params.agentId || p.status === "pending");
  }

  if (params?.type) {
    list = list.filter((p) => p.type === params.type);
  }

  if (params?.status) {
    list = list.filter((p) => p.status === params.status);
  }

  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (p) =>
        p.policyNumber.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function getPolicyById(id: string): Promise<Policy | null> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/policies/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.policy || data;
  }

  await delay(250);
  const found = mockStore.getPolicyById(id);
  return found || null;
}

export async function createPolicy(input: CreatePolicyInput): Promise<Policy> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/policies", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create policy");
    const data = await res.json();
    return data.policy || data;
  }

  await delay(450);

  const prefix =
    input.type === "motor"
      ? "MO"
      : input.type === "health"
      ? "HE"
      : input.type === "home"
      ? "HO"
      : "TR";
  const num = Math.floor(1000 + Math.random() * 9000);
  const policyNumber = `${prefix}-${num}`;

  const newPolicy: Policy = {
    _id: `pol-${Date.now()}`,
    policyNumber,
    type: input.type,
    customerId: input.customerId,
    agentId: input.agentId,
    coverage: input.coverage,
    premium: input.premium,
    renewalDate: input.renewalDate,
    status: "active",
    details: input.details,
    sharedWith: [],
  };

  return mockStore.addPolicy(newPolicy);
}

export async function updatePolicy(id: string, updates: Partial<Policy>): Promise<Policy> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/policies/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update policy");
    const data = await res.json();
    return data.policy || data;
  }

  await delay(350);
  return mockStore.updatePolicy(id, updates);
}

// Share access with another registered customer
export async function sharePolicy(policyId: string, email: string): Promise<Policy> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/policies/${policyId}/share`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || err.error || "Failed to share policy");
    }
    const data = await res.json();
    return data.policy || data;
  }

  await delay(400);
  return mockStore.sharePolicy(policyId, email);
}

// Revoke shared access
export async function revokePolicyShare(policyId: string, targetUserId: string): Promise<Policy> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/policies/${policyId}/share/${targetUserId}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to revoke share");
    const data = await res.json();
    return data.policy || data;
  }

  await delay(350);
  return mockStore.revokePolicyShare(policyId, targetUserId);
}

export interface RequestPolicyInput {
  type: PolicyType;
  coverageAmount: number;
  note?: string;
}

export async function requestPolicy(input: RequestPolicyInput): Promise<Policy> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/policies/request", {
      method: "POST",
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to request policy");
    }
    const data = await res.json();
    return data.policy || data;
  }

  await delay(400);
  const num = Math.floor(1000 + Math.random() * 9000);
  const newPolicy: Policy = {
    _id: `pol-${Date.now()}`,
    policyNumber: `REQ-${num}`,
    type: input.type,
    customerId: "cust-1",
    agentId: "agent-1",
    coverage: { amount: input.coverageAmount, deductible: Math.round(input.coverageAmount * 0.05) },
    premium: { amount: Math.round((input.coverageAmount * 0.08) / 12), frequency: "monthly" },
    renewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
    status: "pending",
    details:
      input.type === "motor"
        ? { type: "motor", motor: { make: "Pending", model: "Pending", registrationNumber: "REQ", manufactureYear: new Date().getFullYear() } }
        : input.type === "health"
        ? { type: "health", health: { dependents: [], network: "Standard", roomType: "Private" } }
        : input.type === "home"
        ? { type: "home", home: { propertyAddress: "Pending", propertyValue: input.coverageAmount, constructionYear: 2020 } }
        : { type: "travel", travel: { destination: "Pending", departureDate: "2026-11-01", returnDate: "2026-11-15", travellersCount: 1 } },
    sharedWith: [],
  };
  return mockStore.addPolicy(newPolicy);
}

export async function approvePolicy(id: string): Promise<Policy> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/policies/${id}/approve`, {
      method: "PATCH",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to approve policy");
    }
    const data = await res.json();
    return data.policy || data;
  }

  await delay(350);
  return mockStore.updatePolicy(id, { status: "active" });
}


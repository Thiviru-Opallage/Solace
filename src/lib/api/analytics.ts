import {
  AnalyticsKpi,
  ClaimsByStatusItem,
  AvgDaysByPolicyItem,
  PayoutsByPolicyItem,
  ClaimsPerMonthItem,
  ClaimStatus,
  PolicyType,
} from "@/types";
import { mockStore, delay } from "@/lib/mock/store";
import { APP_CONFIG } from "@/lib/config";
import { apiFetch } from "./http";

// Mirrors MongoDB Aggregation Pipeline: Total count, sum of payments, average turnaround, approval ratio
export async function getAdjusterKpis(): Promise<AnalyticsKpi> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/analytics/kpis");
    if (!res.ok) throw new Error("Failed to fetch KPIs");
    return res.json();
  }

  await delay(350);

  const claims = mockStore.getClaims();
  const payments = mockStore.getPayments();

  const totalClaims = claims.length;
  const totalPayouts = payments.reduce((acc, p) => acc + p.amount, 0);

  // Calculate average days to decision for resolved claims (Approved, Rejected, Paid)
  const resolved = claims.filter(
    (c) =>
      c.currentStatus === "Approved" ||
      c.currentStatus === "Rejected" ||
      c.currentStatus === "Paid"
  );

  let totalDays = 0;
  resolved.forEach((c) => {
    const start = new Date(c.createdAt).getTime();
    const resolution = c.statusHistory.find(
      (h) => h.status === "Approved" || h.status === "Rejected" || h.status === "Paid"
    );
    const end = resolution ? new Date(resolution.at).getTime() : start + 3 * 86400000;
    const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    totalDays += days;
  });

  const avgDaysToDecision = resolved.length > 0 ? Number((totalDays / resolved.length).toFixed(1)) : 3.4;

  const approvedOrPaid = claims.filter(
    (c) => c.currentStatus === "Approved" || c.currentStatus === "Paid"
  ).length;
  const decided = claims.filter(
    (c) =>
      c.currentStatus === "Approved" ||
      c.currentStatus === "Rejected" ||
      c.currentStatus === "Paid"
  ).length;

  const approvalRate = decided > 0 ? Math.round((approvedOrPaid / decided) * 100) : 82;

  return {
    totalClaims,
    totalPayouts,
    avgDaysToDecision,
    approvalRate,
  };
}

// Chart 1 MongoDB Aggregation: Group by currentStatus
export async function getClaimsByStatusAnalytics(): Promise<ClaimsByStatusItem[]> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/analytics/claims-by-status");
    if (!res.ok) throw new Error("Failed to fetch status analytics");
    return res.json();
  }

  await delay(300);

  const claims = mockStore.getClaims();
  const statusCounts: Record<ClaimStatus, number> = {
    Pending: 0,
    "Under Review": 0,
    "Info Requested": 0,
    Approved: 0,
    Rejected: 0,
    Paid: 0,
  };

  claims.forEach((c) => {
    if (statusCounts[c.currentStatus] !== undefined) {
      statusCounts[c.currentStatus]++;
    }
  });

  return [
    { status: "Pending", count: statusCounts["Pending"], color: "#94A3B8" },
    { status: "Under Review", count: statusCounts["Under Review"], color: "#60A5FA" },
    { status: "Info Requested", count: statusCounts["Info Requested"], color: "#F59E0B" },
    { status: "Approved", count: statusCounts["Approved"], color: "#34D399" },
    { status: "Rejected", count: statusCounts["Rejected"], color: "#F87171" },
    { status: "Paid", count: statusCounts["Paid"], color: "#10B981" },
  ];
}

// Chart 2 MongoDB Aggregation: $lookup policies -> group by policy.type -> avg turnaround days
export async function getAvgDaysToDecisionAnalytics(): Promise<AvgDaysByPolicyItem[]> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/analytics/avg-days-by-policy");
    if (!res.ok) throw new Error("Failed to fetch avg days analytics");
    return res.json();
  }

  await delay(350);

  const policies = mockStore.getPolicies();
  const policyTypeMap = new Map<string, PolicyType>(
    policies.map((p) => [p._id, p.type])
  );

  const claims = mockStore.getClaims();
  const resolved = claims.filter(
    (c) =>
      c.currentStatus === "Approved" ||
      c.currentStatus === "Rejected" ||
      c.currentStatus === "Paid"
  );

  const daysByType: Record<PolicyType, { sum: number; count: number }> = {
    motor: { sum: 0, count: 0 },
    health: { sum: 0, count: 0 },
    home: { sum: 0, count: 0 },
    travel: { sum: 0, count: 0 },
  };

  resolved.forEach((c) => {
    const pType = policyTypeMap.get(c.policyId) || "motor";
    const start = new Date(c.createdAt).getTime();
    const resolution = c.statusHistory.find(
      (h) => h.status === "Approved" || h.status === "Rejected" || h.status === "Paid"
    );
    const end = resolution ? new Date(resolution.at).getTime() : start + 3 * 86400000;
    const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));

    daysByType[pType].sum += days;
    daysByType[pType].count += 1;
  });

  return [
    {
      policyType: "motor",
      label: "Motor Insurance",
      avgDays: daysByType.motor.count ? Number((daysByType.motor.sum / daysByType.motor.count).toFixed(1)) : 2.8,
    },
    {
      policyType: "health",
      label: "Health Insurance",
      avgDays: daysByType.health.count ? Number((daysByType.health.sum / daysByType.health.count).toFixed(1)) : 2.1,
    },
    {
      policyType: "home",
      label: "Home Insurance",
      avgDays: daysByType.home.count ? Number((daysByType.home.sum / daysByType.home.count).toFixed(1)) : 4.6,
    },
    {
      policyType: "travel",
      label: "Travel Insurance",
      avgDays: daysByType.travel.count ? Number((daysByType.travel.sum / daysByType.travel.count).toFixed(1)) : 1.9,
    },
  ];
}

// Chart 3 MongoDB Aggregation: $lookup claims -> $lookup policies -> sum payouts by policy type
export async function getTotalPayoutsByPolicyAnalytics(): Promise<PayoutsByPolicyItem[]> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/analytics/payouts-by-policy");
    if (!res.ok) throw new Error("Failed to fetch payouts analytics");
    return res.json();
  }

  await delay(350);

  const claims = mockStore.getClaims();
  const claimMap = new Map<string, string>(claims.map((c) => [c._id, c.policyId]));

  const policies = mockStore.getPolicies();
  const policyTypeMap = new Map<string, PolicyType>(
    policies.map((p) => [p._id, p.type])
  );

  const payments = mockStore.getPayments();
  const payoutsByType: Record<PolicyType, number> = {
    motor: 0,
    health: 0,
    home: 0,
    travel: 0,
  };

  payments.forEach((p) => {
    const pId = claimMap.get(p.claimId);
    const pType = pId ? policyTypeMap.get(pId) || "motor" : "motor";
    payoutsByType[pType] += p.amount;
  });

  return [
    { policyType: "home", label: "Home", amount: payoutsByType.home + 45000 },
    { policyType: "health", label: "Health", amount: payoutsByType.health + 27500 },
    { policyType: "motor", label: "Motor", amount: payoutsByType.motor + 15500 },
    { policyType: "travel", label: "Travel", amount: payoutsByType.travel + 8000 },
  ];
}

// Chart 4 MongoDB Aggregation: Group by month of creation -> count total, approved, rejected
export async function getClaimsPerMonthAnalytics(): Promise<ClaimsPerMonthItem[]> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/analytics/claims-per-month");
    if (!res.ok) throw new Error("Failed to fetch claims per month");
    return res.json();
  }

  await delay(350);

  return [
    { month: "Nov 2024", submitted: 18, approved: 14, rejected: 2 },
    { month: "Dec 2024", submitted: 24, approved: 19, rejected: 3 },
    { month: "Jan 2025", submitted: 31, approved: 25, rejected: 4 },
    { month: "Feb 2025", submitted: 28, approved: 22, rejected: 3 },
    { month: "Mar 2025", submitted: 36, approved: 29, rejected: 5 },
    { month: "Apr 2025", submitted: 42, approved: 34, rejected: 6 },
  ];
}

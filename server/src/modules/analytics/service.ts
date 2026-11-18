import { repositories } from "../../repositories/index.js";
import type {
  ClaimScope,
  ClaimEntity,
  PolicyType,
} from "../../repositories/types.js";
import type {
  AnalyticsKpi,
  ClaimsByStatusItem,
  AvgDaysByPolicyItem,
  PayoutsByPolicyItem,
  ClaimsPerMonthItem,
} from "./types.js";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Days between two ISO-8601 date strings, minimum 1. */
function daysBetween(startIso: string, endIso: string): number {
  const diffMs = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

/** Find the first resolution history entry (Approved | Rejected | Paid). */
function resolutionEntry(
  claim: ClaimEntity
): { at: string } | undefined {
  return claim.statusHistory.find(
    (h) => h.status === "Approved" || h.status === "Rejected" || h.status === "Paid"
  );
}

/** Format a Date as 'MMM YYYY' (e.g. 'Jan 2025') without date-fns dependency. */
function formatMonthYear(date: Date): string {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

/** Returns the key 'YYYY-MM' for a Date, used for grouping. */
function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// ─── service ─────────────────────────────────────────────────────────────────

export class AnalyticsService {
  /**
   * Overall KPI metrics: total claims, total payouts, avg days to decision,
   * approval rate (%).
   */
  async getKpis(scope: ClaimScope): Promise<AnalyticsKpi> {
    const claims = await repositories.claims.find({ scope, limit: 100_000 });

    // Total payouts across ALL payments (all scope — finance-wide).
    const payments = await repositories.payments.find({
      scope: { type: "all" },
      limit: 100_000,
    });

    const totalClaims = claims.length;
    const totalPayouts = payments.reduce((sum, p) => sum + p.amount, 0);

    // Average days to decision for resolved claims.
    const resolved = claims.filter(
      (c) =>
        c.currentStatus === "Approved" ||
        c.currentStatus === "Rejected" ||
        c.currentStatus === "Paid"
    );

    let totalDays = 0;
    for (const c of resolved) {
      const entry = resolutionEntry(c);
      const endDate = entry ? entry.at : c.updatedAt;
      totalDays += daysBetween(c.createdAt, endDate);
    }

    const avgDaysToDecision =
      resolved.length > 0
        ? Number((totalDays / resolved.length).toFixed(1))
        : 0;

    // Approval rate — decided = Approved + Rejected + Paid.
    const approvedOrPaid = claims.filter(
      (c) => c.currentStatus === "Approved" || c.currentStatus === "Paid"
    ).length;
    const decided = resolved.length;

    const approvalRate =
      decided > 0 ? Math.round((approvedOrPaid / decided) * 100) : 0;

    return { totalClaims, totalPayouts, avgDaysToDecision, approvalRate };
  }

  /**
   * Claim counts grouped by currentStatus, with chart colours.
   */
  async getClaimsByStatus(scope: ClaimScope): Promise<ClaimsByStatusItem[]> {
    const claims = await repositories.claims.find({ scope, limit: 100_000 });

    const counts: Record<string, number> = {
      Pending: 0,
      "Under Review": 0,
      "Info Requested": 0,
      Approved: 0,
      Rejected: 0,
      Paid: 0,
    };

    for (const c of claims) {
      if (c.currentStatus in counts) {
        counts[c.currentStatus] = (counts[c.currentStatus] ?? 0) + 1;
      }
    }

    const COLOR_MAP: Record<string, string> = {
      Pending: "#94A3B8",
      "Under Review": "#60A5FA",
      "Info Requested": "#F59E0B",
      Approved: "#34D399",
      Rejected: "#F87171",
      Paid: "#10B981",
    };

    return Object.entries(counts).map(([status, count]) => ({
      status,
      count,
      color: COLOR_MAP[status],
    }));
  }

  /**
   * Average turnaround days grouped by policy type.
   * Only resolved claims (Approved / Rejected / Paid) are included.
   */
  async getAvgDaysByPolicy(scope: ClaimScope): Promise<AvgDaysByPolicyItem[]> {
    const claims = await repositories.claims.find({ scope, limit: 100_000 });
    const policies = await repositories.policies.find({
      scope: { type: "all" },
      limit: 100_000,
    });

    // Build policyId → type map.
    const policyTypeMap = new Map<string, PolicyType>(
      policies.map((p) => [p._id, p.type])
    );

    const buckets: Record<PolicyType, { sum: number; count: number }> = {
      motor: { sum: 0, count: 0 },
      health: { sum: 0, count: 0 },
      home: { sum: 0, count: 0 },
      travel: { sum: 0, count: 0 },
    };

    const resolved = claims.filter(
      (c) =>
        c.currentStatus === "Approved" ||
        c.currentStatus === "Rejected" ||
        c.currentStatus === "Paid"
    );

    for (const c of resolved) {
      const pType = policyTypeMap.get(c.policyId);
      if (!pType) continue;
      const entry = resolutionEntry(c);
      const endDate = entry ? entry.at : c.updatedAt;
      const days = daysBetween(c.createdAt, endDate);
      buckets[pType].sum += days;
      buckets[pType].count += 1;
    }

    const LABELS: Record<PolicyType, string> = {
      motor: "Motor Insurance",
      health: "Health Insurance",
      home: "Home Insurance",
      travel: "Travel Insurance",
    };

    return (["motor", "health", "home", "travel"] as PolicyType[]).map((pt) => {
      const b = buckets[pt];
      return {
        policyType: pt,
        label: LABELS[pt],
        avgDays: b.count > 0 ? Number((b.sum / b.count).toFixed(1)) : 0,
      };
    });
  }

  /**
   * Total payment amounts grouped by policy type.
   * Joins: payments → claims → policies.
   */
  async getPayoutsByPolicy(scope: ClaimScope): Promise<PayoutsByPolicyItem[]> {
    // Fetch all payments (finance-wide) since analytics is admin/adjuster only.
    const payments = await repositories.payments.find({
      scope: { type: "all" },
      limit: 100_000,
    });

    // We need claims to resolve policyId, but restrict to the caller's scope.
    const claims = await repositories.claims.find({ scope, limit: 100_000 });
    const policies = await repositories.policies.find({
      scope: { type: "all" },
      limit: 100_000,
    });

    const claimPolicyMap = new Map<string, string>(
      claims.map((c) => [c._id, c.policyId])
    );
    const policyTypeMap = new Map<string, PolicyType>(
      policies.map((p) => [p._id, p.type])
    );

    const totals: Record<PolicyType, number> = {
      motor: 0,
      health: 0,
      home: 0,
      travel: 0,
    };

    for (const p of payments) {
      const policyId = claimPolicyMap.get(p.claimId);
      if (!policyId) continue;
      const pType = policyTypeMap.get(policyId);
      if (!pType) continue;
      totals[pType] += p.amount;
    }

    const LABELS: Record<PolicyType, string> = {
      motor: "Motor",
      health: "Health",
      home: "Home",
      travel: "Travel",
    };

    return (["motor", "health", "home", "travel"] as PolicyType[]).map((pt) => ({
      policyType: pt,
      label: LABELS[pt],
      amount: totals[pt],
    }));
  }

  /**
   * Monthly claim submission / approval / rejection counts for the last 6
   * calendar months (newest month last).
   */
  async getClaimsPerMonth(scope: ClaimScope): Promise<ClaimsPerMonthItem[]> {
    const now = new Date();

    // Build the last 6 month buckets.
    const buckets = new Map<
      string,
      { label: string; submitted: number; approved: number; rejected: number }
    >();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      buckets.set(key, {
        label: formatMonthYear(d),
        submitted: 0,
        approved: 0,
        rejected: 0,
      });
    }

    const claims = await repositories.claims.find({ scope, limit: 100_000 });

    for (const c of claims) {
      const createdKey = monthKey(new Date(c.createdAt));
      const bucket = buckets.get(createdKey);
      if (bucket) {
        bucket.submitted += 1;
      }

      // Count approved / rejected events by their history entry date.
      for (const h of c.statusHistory) {
        if (h.status === "Approved" || h.status === "Paid") {
          const hKey = monthKey(new Date(h.at));
          const hBucket = buckets.get(hKey);
          if (hBucket) hBucket.approved += 1;
        } else if (h.status === "Rejected") {
          const hKey = monthKey(new Date(h.at));
          const hBucket = buckets.get(hKey);
          if (hBucket) hBucket.rejected += 1;
        }
      }
    }

    return Array.from(buckets.values()).map((b) => ({
      month: b.label,
      submitted: b.submitted,
      approved: b.approved,
      rejected: b.rejected,
    }));
  }
}

export const analyticsService = new AnalyticsService();

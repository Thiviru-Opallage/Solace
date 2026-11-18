import type { PolicyType } from "../../repositories/types.js";

export interface AnalyticsKpi {
  totalClaims: number;
  totalPayouts: number;
  avgDaysToDecision: number;
  approvalRate: number;
}

export interface ClaimsByStatusItem {
  status: string;
  count: number;
  color?: string;
}

export interface AvgDaysByPolicyItem {
  policyType: PolicyType;
  label: string;
  avgDays: number;
}

export interface PayoutsByPolicyItem {
  policyType: PolicyType;
  label: string;
  amount: number;
}

export interface ClaimsPerMonthItem {
  month: string;
  submitted: number;
  approved: number;
  rejected: number;
}

"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  getAdjusterKpis,
  getClaimsByStatusAnalytics,
  getAvgDaysToDecisionAnalytics,
  getTotalPayoutsByPolicyAnalytics,
  getClaimsPerMonthAnalytics,
} from "@/lib/api/analytics";
import {
  AnalyticsKpi,
  ClaimsByStatusItem,
  AvgDaysByPolicyItem,
  PayoutsByPolicyItem,
  ClaimsPerMonthItem,
} from "@/types";
import { formatCurrency } from "@/lib/config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Database } from "lucide-react";

export default function AdjusterAnalyticsPage() {
  const [kpis, setKpis] = useState<AnalyticsKpi | null>(null);
  const [statusData, setStatusData] = useState<ClaimsByStatusItem[]>([]);
  const [turnaroundData, setTurnaroundData] = useState<AvgDaysByPolicyItem[]>([]);
  const [payoutsData, setPayoutsData] = useState<PayoutsByPolicyItem[]>([]);
  const [trendData, setTrendData] = useState<ClaimsPerMonthItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const [kpiRes, statRes, turnRes, payRes, trendRes] = await Promise.all([
          getAdjusterKpis(),
          getClaimsByStatusAnalytics(),
          getAvgDaysToDecisionAnalytics(),
          getTotalPayoutsByPolicyAnalytics(),
          getClaimsPerMonthAnalytics(),
        ]);
        setKpis(kpiRes);
        setStatusData(statRes);
        setTurnaroundData(turnRes);
        setPayoutsData(payRes);
        setTrendData(trendRes);
      } catch (err) {
        console.error("Failed to load analytics aggregation:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  const donutColors = ["#94A3B8", "#60A5FA", "#F59E0B", "#34D399", "#F87171", "#10B981"];

  return (
    <AppShell allowedRoles={["adjuster"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Claims Decision Analytics & Aggregations
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Operational metrics powered by dedicated aggregation service pipelines.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>MongoDB Pipeline Ready</span>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Total Claims Handled
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              {isLoading ? "..." : kpis?.totalClaims}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Aggregated across all policies
            </span>
          </div>

          <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Total Settlements Paid
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              {isLoading ? "..." : kpis ? formatCurrency(kpis.totalPayouts) : "..."}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              Direct disbursements settled
            </span>
          </div>

          <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Avg. Days to Decision
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              {isLoading ? "..." : `${kpis?.avgDaysToDecision} d`}
            </span>
            <span className="text-[11px] text-blue-600 font-medium block mt-1">
              Fast turnaround target: &lt; 5d
            </span>
          </div>

          <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Claim Approval Rate
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              {isLoading ? "..." : `${kpis?.approvalRate}%`}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Valid loss claims approved
            </span>
          </div>
        </div>

        {/* Charts Grid: 2x2 Clean Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Claims by Status (Pie / Donut) */}
          <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6]">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                1. Claims Distribution by Status
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Aggregated by current claim lifecycle state ($group: &ldquo;$currentStatus&rdquo;)
              </p>
            </div>

            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="status"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`status-${index}`}
                        fill={entry.color || donutColors[index % donutColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [`${String(value)} Claims`, String(name)]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.75rem",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-600">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Average Days to Decision by Policy Type (Bar Chart) */}
          <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6]">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                2. Average Turnaround Days by Policy Type
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates time from submission to adjudication ($lookup + $avg)
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnaroundData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip
                    formatter={(value: unknown) => [`${String(value)} Days`, "Avg Turnaround"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.75rem",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="avgDays" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Total Payouts by Policy Type (Bar Chart) */}
          <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6]">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                3. Total Payout Disbursements by Policy Type
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Financial liabilities settled per insurance category ($group sum)
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payoutsData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickFormatter={(val) => `LKR ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: unknown) => [formatCurrency(Number(value) || 0), "Total Disbursed"]}
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.75rem",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="amount" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Claims per Month Volume (Line Chart) */}
          <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6]">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                4. Claims Volume & Adjudication Monthly Trend
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monthly intake vs approvals vs denials ($dateTrunc grouping)
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: "0.75rem",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-600 capitalize">{val}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="submitted"
                    name="Submitted"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="approved"
                    name="Approved"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rejected"
                    name="Rejected"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

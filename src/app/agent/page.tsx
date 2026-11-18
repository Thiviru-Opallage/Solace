"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Policy, PolicyType } from "@/types";
import { getPolicies } from "@/lib/api/policies";
import { getCustomers } from "@/lib/api/users";
import { mockStore } from "@/lib/mock/store";
import { formatCurrency, formatDate } from "@/lib/config";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  PlusCircle,
  Home,
  Car,
  Heart,
  Plane,
} from "lucide-react";

export default function AgentDashboardPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const [list, custList] = await Promise.all([
          getPolicies(),
          getCustomers().catch(() => []),
        ]);
        setPolicies(list);
        const cMap: Record<string, string> = {};
        custList.forEach((c) => {
          cMap[c._id] = c.name;
        });
        setCustomerMap(cMap);
      } catch (err) {
        console.error("Failed to load agent portfolio:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPortfolio();
  }, []);

  const totalActiveCoverage = policies
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + p.coverage.amount, 0);

  const uniqueCustomers = new Set(policies.map((p) => p.customerId)).size;

  // Policies by type counts
  const typeCounts: Record<PolicyType, number> = {
    motor: 0,
    health: 0,
    home: 0,
    travel: 0,
  };
  policies.forEach((p) => {
    if (typeCounts[p.type] !== undefined) {
      typeCounts[p.type]++;
    }
  });

  // Upcoming renewals
  const upcomingRenewals = [...policies]
    .filter((p) => p.status === "active")
    .sort(
      (a, b) =>
        new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
    )
    .slice(0, 5);

  // Recent policies
  const recentPolicies = [...policies].slice(0, 5);

  const getCustomerName = (customerId: string) => {
    if (customerMap[customerId]) {
      return customerMap[customerId];
    }
    const cust = mockStore.getUserById(customerId);
    return cust ? cust.name : "Customer";
  };

  return (
    <AppShell allowedRoles={["agent"]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Agent Portfolio Overview
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage client policies, monitor upcoming renewals, and issue coverage across policy lines.
            </p>
          </div>

          <Link
            href="/agent/policies/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Issue New Policy
          </Link>
        </div>

        {/* Portfolio KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Total Policies in Portfolio
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              {isLoading ? "..." : policies.length}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Across motor, health, home & travel
            </span>
          </div>

          <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Active Insured Capital
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              {isLoading ? "..." : formatCurrency(totalActiveCoverage)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              Active underwriting balance
            </span>
          </div>

          <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Client Accounts
            </span>
            <span className="text-3xl font-extrabold text-slate-900 block mt-1">
              {isLoading ? "..." : uniqueCustomers}
            </span>
            <span className="text-[11px] text-blue-600 font-medium block mt-1">
              Verified policyholders
            </span>
          </div>
        </div>

        {/* Policies by Type Cards */}
        <div>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Portfolio Distribution by Insurance Line
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="solace-card p-4 bg-white border border-[#EEF2F6] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Motor</span>
                  <span className="text-[11px] text-slate-400 block">
                    {typeCounts.motor} Policies
                  </span>
                </div>
              </div>
            </div>

            <div className="solace-card p-4 bg-white border border-[#EEF2F6] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Home</span>
                  <span className="text-[11px] text-slate-400 block">
                    {typeCounts.home} Policies
                  </span>
                </div>
              </div>
            </div>

            <div className="solace-card p-4 bg-white border border-[#EEF2F6] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Health</span>
                  <span className="text-[11px] text-slate-400 block">
                    {typeCounts.health} Policies
                  </span>
                </div>
              </div>
            </div>

            <div className="solace-card p-4 bg-white border border-[#EEF2F6] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Travel</span>
                  <span className="text-[11px] text-slate-400 block">
                    {typeCounts.travel} Policies
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column: Recent Policies + Upcoming Renewals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Policies (8 cols) */}
          <div className="lg:col-span-8 solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Issued Policies
              </h2>
              <Link
                href="/agent/policies"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                View Full Portfolio
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentPolicies.map((pol) => (
                <div
                  key={pol._id}
                  className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        {pol.policyNumber}
                      </span>
                      <StatusBadge status={pol.status} size="sm" />
                      <span className="text-xs text-slate-500 capitalize">
                        • {pol.type}
                      </span>
                    </div>
                    <span className="text-xs text-slate-700 block mt-0.5">
                      Client: {getCustomerName(pol.customerId)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {formatCurrency(pol.coverage.amount)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatCurrency(pol.premium.amount)} / {pol.premium.frequency}
                      </span>
                    </div>
                    <Link
                      href={`/agent/policies/${pol._id}/edit`}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-600 p-1"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Renewals (4 cols) */}
          <div className="lg:col-span-4 solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Upcoming Renewals
            </h2>

            <div className="space-y-3">
              {upcomingRenewals.map((pol) => (
                <div
                  key={pol._id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 font-mono">
                      {pol.policyNumber}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {formatDate(pol.renewalDate, "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="capitalize">{pol.type}</span>
                    <span>{getCustomerName(pol.customerId)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

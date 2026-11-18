"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Policy, Claim } from "@/types";
import { getPolicies } from "@/lib/api/policies";
import { getClaims } from "@/lib/api/claims";
import { formatCurrency, formatDate } from "@/lib/config";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Shield,
  ShieldCheck,
  Home as HomeIcon,
  Car,
  Heart,
  Plane,
  ChevronRight,
  CreditCard,
  FileText,
} from "lucide-react";

export default function CustomerDashboardPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [polList, clmList] = await Promise.all([
          getPolicies({ customerId: user._id }),
          getClaims({ customerId: user._id }),
        ]);
        setPolicies(polList);
        setClaims(clmList);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Active policies and total coverage
  const activePolicies = policies.filter((p) => p.status === "active");
  const totalCoverage = activePolicies.reduce(
    (sum, p) => sum + p.coverage.amount,
    0
  );

  // Latest active claim for the banner
  const latestClaim =
    claims.find(
      (c) =>
        c.currentStatus === "Under Review" ||
        c.currentStatus === "Pending" ||
        c.currentStatus === "Info Requested"
    ) || claims[0];

  // Up to 3 upcoming renewals sorted by renewal date
  const upcomingRenewals = [...activePolicies]
    .sort(
      (a, b) =>
        new Date(a.renewalDate).getTime() - new Date(b.renewalDate).getTime()
    )
    .slice(0, 3);

  // Donut chart data for coverage distribution
  const chartColors = ["#93C5FD", "#86EFAC", "#D8B4FE", "#FDE047"];
  const donutData = activePolicies.map((p) => ({
    name: p.type,
    value: p.coverage.amount,
  }));

  const getPolicyIcon = (type: string) => {
    switch (type) {
      case "home":
        return <HomeIcon className="w-4 h-4 text-sky-600" />;
      case "motor":
        return <Car className="w-4 h-4 text-emerald-600" />;
      case "health":
        return <Heart className="w-4 h-4 text-purple-600" />;
      case "travel":
        return <Plane className="w-4 h-4 text-amber-600" />;
      default:
        return <Shield className="w-4 h-4 text-blue-600" />;
    }
  };

  const getPolicyIconBg = (type: string) => {
    switch (type) {
      case "home":
        return "bg-sky-50 border-sky-100";
      case "motor":
        return "bg-emerald-50 border-emerald-100";
      case "health":
        return "bg-purple-50 border-purple-100";
      case "travel":
        return "bg-amber-50 border-amber-100";
      default:
        return "bg-blue-50 border-blue-100";
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "Friend";

  return (
    <AppShell allowedRoles={["customer"]}>
      <div className="space-y-8">
        {/* Top Greeting Header with Editorial Vignette */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              You&apos;re well covered. Here&apos;s what&apos;s happening with your insurance.
            </p>
          </div>

          {/* Calm Serene Brand Vignette Card */}
          <div className="hidden lg:flex items-center gap-3.5 bg-white/90 backdrop-blur-xs px-5 py-3 rounded-2xl border border-slate-200/70 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3FC1C9] to-[#FC5185] flex items-center justify-center shrink-0 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-serif italic text-sm text-slate-800 block leading-tight">
                Protection for what matters
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                Solace verified portfolio
              </span>
            </div>
          </div>
        </div>

        {/* Main 2-Column Dashboard Grid matching visual reference */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column (8 cols): Coverage Summary & Donut */}
          <div className="lg:col-span-8 space-y-8">
            {/* Coverage Card */}
            <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Your Coverage
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Total insured value across all policies
                  </p>
                </div>
                <Link
                  href="/policies"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors py-1 px-3 rounded-full hover:bg-slate-50"
                >
                  View all policies
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Total amount & list */}
                <div className="md:col-span-7 space-y-5">
                  <div>
                    <div className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                      {isLoading ? "..." : formatCurrency(totalCoverage)}
                    </div>

                  </div>

                  {/* List of active policies inside coverage card */}
                  <div className="space-y-3 pt-2">
                    {activePolicies.map((pol) => (
                      <Link
                        key={pol._id}
                        href={`/policies/${pol._id}`}
                        className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 ${getPolicyIconBg(
                              pol.type
                            )}`}
                          >
                            {getPolicyIcon(pol.type)}
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-800 block capitalize">
                              {pol.type} Insurance
                            </span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              Policy #{pol.policyNumber}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {formatCurrency(pol.coverage.amount)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Coverage Amount
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Donut Chart with Active Policies Counter */}
                <div className="md:col-span-5 flex flex-col items-center justify-center py-4">
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData.length > 0 ? donutData : [{ name: "None", value: 1 }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                          stroke="none"
                        >
                          {donutData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={chartColors[index % chartColors.length]}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Donut Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                      <Shield className="w-4 h-4 text-blue-500 mb-1" />
                      <span className="text-xl font-bold text-slate-900 leading-none">
                        {activePolicies.length}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Active Policies
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Claims Update Banner (Exact match with visual reference) */}
            {latestClaim ? (
              <div className="solace-card overflow-hidden bg-white border border-[#EEF2F6] grid grid-cols-1 md:grid-cols-12">
                {/* Left Styled Accent Banner */}
                <div className="md:col-span-4 bg-gradient-to-br from-[#364F6B] to-[#2A3F57] relative min-h-[160px] flex flex-col justify-between p-6 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-[#3FC1C9]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="relative z-10">
                    <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider block">
                      Active File
                    </span>
                    <span className="text-white text-xs font-bold tracking-wide block mt-0.5">
                      Claim #{latestClaim.claimNumber}
                    </span>
                  </div>
                </div>

                {/* Middle: Claim Status Info */}
                <div className="md:col-span-4 p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                      Claims Update
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {latestClaim.currentStatus === "Paid"
                        ? "Settlement Completed"
                        : latestClaim.currentStatus === "Approved"
                        ? "Claim Approved"
                        : "Your claim is in progress"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {latestClaim.incident.description.slice(0, 75)}...
                    </p>
                  </div>

                  <div className="pt-4">
                    <Link
                      href={`/claims/${latestClaim._id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                    >
                      View Claim
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Right: Live Status Progression Timeline */}
                <div className="md:col-span-4 p-6 border-t md:border-t-0 md:border-l border-slate-100 flex flex-col justify-center">
                  <StatusTimeline
                    currentStatus={latestClaim.currentStatus}
                    statusHistory={latestClaim.statusHistory}
                    compact
                  />
                </div>
              </div>
            ) : (
              <div className="solace-card p-6 bg-white border border-[#EEF2F6] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    No open claims
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Your records are quiet and all incidents are clear.
                  </p>
                </div>
                <Link
                  href="/claims/new"
                  className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
                >
                  File a Claim
                </Link>
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Quick Actions & Upcoming Reminders */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions Card */}
            <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-3">
              <Link
                href="/claims/new"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      File a Claim
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Get support, fast
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>

              <Link
                href="/payments"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Payout History
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Secure & clear settlements
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>

              <Link
                href="/policies"
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Manage Policies
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      DAC sharing & coverage
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
              </Link>
            </div>

            {/* Upcoming Reminders Card */}
            <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-slate-900">
                  Upcoming Reminders
                </h2>
                <Link
                  href="/policies"
                  className="text-[11px] font-medium text-slate-400 hover:text-blue-600 transition-colors"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-3">
                {upcomingRenewals.map((pol) => (
                  <Link
                    key={pol._id}
                    href={`/policies/${pol._id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${getPolicyIconBg(
                          pol.type
                        )}`}
                      >
                        {getPolicyIcon(pol.type)}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block capitalize">
                          {pol.type} Insurance Renewal
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {formatDate(pol.renewalDate, "MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Serene Help / Guidance Card */}
            <div className="solace-card p-6 bg-white border border-[#EEF2F6] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-blue-600 shrink-0">
                <Shield className="w-6 h-6 fill-blue-50/50" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Need reassurance?
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-snug">
                  Our claims adjusters handle evaluations with quiet discretion.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

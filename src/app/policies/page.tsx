"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Policy, PolicyType } from "@/types";
import { getPolicies } from "@/lib/api/policies";
import { formatCurrency, formatDate } from "@/lib/config";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Shield,
  Home,
  Car,
  Heart,
  Plane,
  Search,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PoliciesListPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchPolicies() {
      if (!user) return;
      try {
        const list = await getPolicies({
          customerId: user._id,
          includeShared: true,
        });
        setPolicies(list);
      } catch (err) {
        console.error("Failed to fetch policies:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPolicies();
  }, [user]);

  const filtered = policies.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || p.type === typeFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getPolicyIcon = (type: PolicyType) => {
    switch (type) {
      case "home":
        return <Home className="w-5 h-5 text-sky-600" />;
      case "motor":
        return <Car className="w-5 h-5 text-emerald-600" />;
      case "health":
        return <Heart className="w-5 h-5 text-purple-600" />;
      case "travel":
        return <Plane className="w-5 h-5 text-amber-600" />;
    }
  };

  const getPolicyBadgeBg = (type: PolicyType) => {
    switch (type) {
      case "home":
        return "bg-sky-50 border-sky-100";
      case "motor":
        return "bg-emerald-50 border-emerald-100";
      case "health":
        return "bg-purple-50 border-purple-100";
      case "travel":
        return "bg-amber-50 border-amber-100";
    }
  };

  return (
    <AppShell allowedRoles={["customer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Insurance Policies
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your active insurance policies and shared coverages.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/policies/request"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs shrink-0"
            >
              Request a Policy
            </Link>
            <Link
              href="/claims/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs shrink-0"
            >
              File a Claim
            </Link>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="solace-card p-4 bg-white border border-[#EEF2F6] flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by policy number or type..."
              className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Policy Types</option>
              <option value="motor">Motor</option>
              <option value="health">Health</option>
              <option value="home">Home</option>
              <option value="travel">Travel</option>
            </select>

            {/* Status selector */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Policies Grid */}
        {isLoading ? (
          <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6]">
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading your policies...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No policies found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No insurance policies match your current filter criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((pol) => {
              const isOwner = pol.customerId === user?._id;
              const isShared = !isOwner;

              return (
                <Link
                  key={pol._id}
                  href={`/policies/${pol._id}`}
                  className="solace-card solace-card-hover p-6 bg-white border border-[#EEF2F6] flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Icon + Status + Shared Badge */}
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0",
                          getPolicyBadgeBg(pol.type)
                        )}
                      >
                        {getPolicyIcon(pol.type)}
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <StatusBadge status={pol.status} size="sm" />
                        {isShared && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <Users className="w-3 h-3" />
                            Shared with you
                          </span>
                        )}
                        {!isShared && pol.sharedWith.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600">
                            <Users className="w-3 h-3" />
                            Shared with {pol.sharedWith.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Policy Title and Number */}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 capitalize group-hover:text-blue-600 transition-colors">
                        {pol.type} Insurance
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Policy #{pol.policyNumber}
                      </p>
                    </div>

                    {/* Coverage & Premium Details */}
                    <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Coverage Limit
                        </span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5">
                          {formatCurrency(pol.coverage.amount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Premium
                        </span>
                        <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                          {formatCurrency(pol.premium.amount)} / {pol.premium.frequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Footer: Renewal Date & Link */}
                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Renews: {formatDate(pol.renewalDate, "MMM d, yyyy")}
                    </span>
                    <span className="font-semibold text-slate-600 group-hover:text-blue-600 inline-flex items-center gap-0.5 transition-colors">
                      View details
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

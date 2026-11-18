"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Claim, Classification, ClearanceLevel } from "@/types";
import { getClaims, subscribeToClaimsQueue } from "@/lib/api/claims";
import { getCustomers } from "@/lib/api/users";
import { mockStore } from "@/lib/mock/store";
import { formatCurrency, formatDate } from "@/lib/config";
import { StatusBadge, ClassificationBadge } from "@/components/ui/StatusBadge";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import {
  ShieldAlert,
  Search,
  Lock,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AdjusterClaimsQueuePage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"createdAt" | "claimedAmount" | "claimNumber">("createdAt");
  const [sortAsc, setSortAsc] = useState(false);
  const [newClaimsCount, setNewClaimsCount] = useState(0);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});

  const initialCountRef = useRef<number | null>(null);

  const userClearance: ClearanceLevel = user?.clearance || 1;

  // Clearance requirements for MAC
  const getRequiredClearance = (classification: Classification): ClearanceLevel => {
    switch (classification) {
      case "standard":
        return 1;
      case "confidential":
        return 2;
      case "restricted":
        return 3;
    }
  };

  const hasClearance = (classification: Classification) => {
    return userClearance >= getRequiredClearance(classification);
  };

  useEffect(() => {
    async function loadInitial() {
      try {
        const [list, custList] = await Promise.all([
          getClaims(),
          getCustomers().catch(() => []),
        ]);
        setClaims(list);
        initialCountRef.current = list.length;
        const cMap: Record<string, string> = {};
        custList.forEach((c) => {
          cMap[c._id] = c.name;
        });
        setCustomerMap(cMap);
      } catch (err) {
        console.error("Failed to load adjuster queue:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();

    // Subscribe to live claims queue updates
    const unsubscribe = subscribeToClaimsQueue((updatedClaims) => {
      setClaims(updatedClaims);
      if (initialCountRef.current !== null && updatedClaims.length > initialCountRef.current) {
        setNewClaimsCount(updatedClaims.length - initialCountRef.current);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const [list, custList] = await Promise.all([
        getClaims(),
        getCustomers().catch(() => []),
      ]);
      setClaims(list);
      setNewClaimsCount(0);
      initialCountRef.current = list.length;
      const cMap: Record<string, string> = {};
      custList.forEach((c) => {
        cMap[c._id] = c.name;
      });
      setCustomerMap(cMap);
      toast.success("Claims queue synchronized");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort
  const filtered = claims.filter((c) => {
    const matchesTab = activeTab === "all" || c.currentStatus === activeTab;
    const matchesSearch =
      search === "" ||
      c.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.incident.description.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  filtered.sort((a, b) => {
    let comparison = 0;
    if (sortField === "createdAt") {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortField === "claimedAmount") {
      comparison = a.claimedAmount - b.claimedAmount;
    } else if (sortField === "claimNumber") {
      comparison = a.claimNumber.localeCompare(b.claimNumber);
    }
    return sortAsc ? comparison : -comparison;
  });

  const toggleSort = (field: "createdAt" | "claimedAmount" | "claimNumber") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getCustomerName = (customerId: string, classification: Classification) => {
    if (!hasClearance(classification)) {
      return "[RESTRICTED - INSUFFICIENT CLEARANCE]";
    }
    if (customerMap[customerId]) {
      return customerMap[customerId];
    }
    const customer = mockStore.getUserById(customerId);
    return customer ? customer.name : "Policyholder";
  };

  const getStatusCount = (status: string) => {
    if (status === "all") return claims.length;
    return claims.filter((c) => c.currentStatus === status).length;
  };

  const STATUS_TABS: { id: string; label: string }[] = [
    { id: "all", label: "All Claims" },
    { id: "Pending", label: "Pending" },
    { id: "Under Review", label: "Under Review" },
    { id: "Info Requested", label: "Info Requested" },
    { id: "Approved", label: "Approved" },
    { id: "Paid", label: "Paid" },
    { id: "Rejected", label: "Rejected" },
  ];

  return (
    <AppShell allowedRoles={["adjuster"]}>
      <div className="space-y-6">
        {/* Header with MAC Clearance Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Adjuster Claims Desk
              </h1>
              <LiveIndicator label="Queue Live Sync" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and process active policy claims.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {newClaimsCount > 0 && (
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {newClaimsCount} new claim(s) available
              </button>
            )}

            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
              Sync
            </button>
          </div>
        </div>

        {/* Mandatory Access Control (MAC) Clearance Banner */}
        <div className="solace-card p-4 bg-white border border-[#EEF2F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  Logged in as {user?.name}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                  Clearance Level {userClearance}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 gap-2 pb-px text-xs font-medium scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const count = getStatusCount(tab.id);
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-2.5 px-3 whitespace-nowrap transition-colors border-b-2 flex items-center gap-2",
                  isActive
                    ? "border-blue-600 text-blue-600 font-semibold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    isActive
                      ? "bg-blue-100 text-blue-800 font-bold"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="solace-card p-3.5 bg-white border border-[#EEF2F6] flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter claims by number, customer, or keyword..."
              className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <span className="text-xs text-slate-400 pr-2">
            Showing {filtered.length} of {claims.length} claims
          </span>
        </div>

        {/* Queue Table */}
        <div className="solace-card overflow-hidden bg-white border border-[#EEF2F6]">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Loading claims queue...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No claims found in this queue</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-semibold">
                    <th className="px-5 py-3.5">Classification</th>
                    <th
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-700"
                      onClick={() => toggleSort("claimNumber")}
                    >
                      <div className="flex items-center gap-1">
                        Claim No.
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5">Customer / Policyholder</th>
                    <th
                      className="px-5 py-3.5 text-right cursor-pointer hover:text-slate-700"
                      onClick={() => toggleSort("claimedAmount")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Claimed Amount
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="px-5 py-3.5 cursor-pointer hover:text-slate-700"
                      onClick={() => toggleSort("createdAt")}
                    >
                      <div className="flex items-center gap-1">
                        Submitted Date
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtered.map((clm) => {
                    const permitted = hasClearance(clm.classification);
                    const customerName = getCustomerName(clm.customerId, clm.classification);

                    return (
                      <tr
                        key={clm._id}
                        className={cn(
                          "transition-colors",
                          permitted ? "hover:bg-slate-50/60" : "bg-slate-50/40 opacity-75"
                        )}
                      >
                        <td className="px-5 py-4">
                          <ClassificationBadge classification={clm.classification} />
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {clm.claimNumber}
                        </td>
                        <td className="px-5 py-4">
                          {permitted ? (
                            <span className="font-medium text-slate-800">
                              {customerName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                              <Lock className="w-3 h-3 text-slate-400" />
                              Restricted
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-slate-900">
                          {permitted ? (
                            formatCurrency(clm.claimedAmount)
                          ) : (
                            <span className="text-slate-400">••••••••</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-[11px]">
                          {formatDate(clm.createdAt, "MMM d, yyyy")}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={clm.currentStatus} size="sm" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/adjuster/claims/${clm._id}`}
                            className={cn(
                              "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs",
                              permitted
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-slate-200 hover:bg-slate-300 text-slate-600"
                            )}
                          >
                            {permitted ? (
                              <>
                                Review
                                <ChevronRight className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                Locked
                              </>
                            )}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

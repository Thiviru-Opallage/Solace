"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Claim } from "@/types";
import { getClaims } from "@/lib/api/claims";
import { formatCurrency, formatDate } from "@/lib/config";
import { StatusBadge, ClassificationBadge } from "@/components/ui/StatusBadge";
import {
  ShieldAlert,
  Search,
  PlusCircle,
  ChevronRight,
} from "lucide-react";

export default function ClaimsListPage() {
  const { user } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    async function loadClaims() {
      if (!user) return;
      try {
        const list = await getClaims({ customerId: user._id });
        setClaims(list);
      } catch (err) {
        console.error("Failed to load claims:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadClaims();
  }, [user]);

  const filtered = claims.filter((c) => {
    const matchesSearch =
      search === "" ||
      c.claimNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.incident.description.toLowerCase().includes(search.toLowerCase()) ||
      c.incident.location.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || c.currentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <AppShell allowedRoles={["customer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Claims Management
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track status changes, submit new claims, and provide required incident documentation.
              </p>
            </div>

          <Link
            href="/claims/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Submit New Claim
          </Link>
        </div>

        {/* Search and Status Filter */}
        <div className="solace-card p-4 bg-white border border-[#EEF2F6] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by claim #, description, or location..."
              className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none w-full sm:w-auto"
            >
              <option value="all">All Statuses ({claims.length})</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Info Requested">Info Requested</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Claims List */}
        {isLoading ? (
          <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6]">
            <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading claims list...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No claims found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You currently have no claims matching your filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((clm) => (
              <Link
                key={clm._id}
                href={`/claims/${clm._id}`}
                className="solace-card solace-card-hover p-5 bg-white border border-[#EEF2F6] flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {clm.claimNumber}
                    </span>
                    <StatusBadge status={clm.currentStatus} size="sm" />
                    <ClassificationBadge classification={clm.classification} />
                    {clm.currentStatus === "Info Requested" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                        Action Required
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 font-medium line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {clm.incident.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span>Location: {clm.incident.location}</span>
                    <span>•</span>
                    <span>Filed: {formatDate(clm.createdAt, "MMM d, yyyy")}</span>
                    <span>•</span>
                    <span>{clm.documents.length} document(s)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Claimed Amount
                    </span>
                    <span className="text-sm font-bold text-slate-900 block mt-0.5">
                      {formatCurrency(clm.claimedAmount)}
                    </span>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

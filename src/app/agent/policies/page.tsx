"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Policy } from "@/types";
import { getPolicies, approvePolicy } from "@/lib/api/policies";
import { getCustomers } from "@/lib/api/users";
import { mockStore } from "@/lib/mock/store";
import { formatCurrency, formatDate } from "@/lib/config";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  FolderOpen,
  PlusCircle,
  Search,
  Edit,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function AgentPoliciesListPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [customerMap, setCustomerMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      const updated = await approvePolicy(id);
      setPolicies((prev) =>
        prev.map((p) =>
          p._id === id
            ? { ...p, status: "active", policyNumber: updated.policyNumber || p.policyNumber }
            : p
        )
      );
      toast.success("Policy approved and activated!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve policy";
      toast.error(msg);
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    async function fetchList() {
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
        console.error("Failed to fetch policies:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchList();
  }, []);

  const getCustomerName = (customerId: string) => {
    if (customerMap[customerId]) {
      return customerMap[customerId];
    }
    const cust = mockStore.getUserById(customerId);
    return cust ? cust.name : "Customer";
  };

  const filtered = policies.filter((p) => {
    const custName = getCustomerName(p.customerId).toLowerCase();
    const matchesSearch =
      search === "" ||
      p.policyNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.type.toLowerCase().includes(search.toLowerCase()) ||
      custName.includes(search.toLowerCase());

    const matchesType = typeFilter === "all" || p.type === typeFilter;
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <AppShell allowedRoles={["agent"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Policies Portfolio Directory
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete registry of client policies, underwriting terms, and status controls.
            </p>
          </div>

          <Link
            href="/agent/policies/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Create Policy
          </Link>
        </div>

        {/* Filters and Search Bar */}
        <div className="solace-card p-4 bg-white border border-[#EEF2F6] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by policy #, type, or client..."
              className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="motor">Motor</option>
              <option value="health">Health</option>
              <option value="home">Home</option>
              <option value="travel">Travel</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending Requests</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Portfolio Table */}
        <div className="solace-card overflow-hidden bg-white border border-[#EEF2F6]">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Loading portfolio...</p>
            </div>
          ) : paginated.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No matching policies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-semibold">
                    <th className="px-6 py-3.5">Policy Number</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Policyholder</th>
                    <th className="px-6 py-3.5">Coverage Limit</th>
                    <th className="px-6 py-3.5">Premium</th>
                    <th className="px-6 py-3.5">Renewal Date</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginated.map((pol) => (
                    <tr key={pol._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {pol.policyNumber}
                      </td>
                      <td className="px-6 py-4 font-medium capitalize">
                        {pol.type}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {getCustomerName(pol.customerId)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatCurrency(pol.coverage.amount)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatCurrency(pol.premium.amount)} / {pol.premium.frequency}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(pol.renewalDate, "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={pol.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {pol.status === "pending" && (
                            <button
                              onClick={() => handleApprove(pol._id)}
                              disabled={approvingId === pol._id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {approvingId === pol._id ? "Approving..." : "Approve"}
                            </button>
                          )}
                          <Link
                            href={`/agent/policies/${pol._id}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-xs"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({filtered.length} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

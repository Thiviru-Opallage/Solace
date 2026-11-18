"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Policy, Claim } from "@/types";
import { getPolicyById, sharePolicy, revokePolicyShare } from "@/lib/api/policies";
import { getClaims } from "@/lib/api/claims";
import { formatCurrency, formatDate } from "@/lib/config";
import { StatusBadge, ClassificationBadge } from "@/components/ui/StatusBadge";
import {
  ChevronLeft,
  Share2,
  Trash2,
  UserPlus,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user } = useAuth();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareEmail, setShareEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [pol, clms] = await Promise.all([
          getPolicyById(id),
          getClaims({ policyId: id }),
        ]);
        setPolicy(pol);
        setClaims(clms);
      } catch (err) {
        console.error("Failed to load policy:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const isOwner = policy?.customerId === user?._id;
  const isGrantee = !isOwner && policy?.sharedWith.some((s) => s.userId === user?._id);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail || !policy) return;

    setIsSharing(true);
    try {
      const updated = await sharePolicy(policy._id, shareEmail);
      setPolicy(updated);
      setShareEmail("");
      toast.success("Policy shared successfully", {
        description: `Read-only DAC permission granted to ${shareEmail}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to share policy";
      toast.error(msg);
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevoke = async (targetUserId: string, targetName: string) => {
    if (!policy) return;
    try {
      const updated = await revokePolicyShare(policy._id, targetUserId);
      setPolicy(updated);
      toast.info("Shared access revoked", {
        description: `Removed read access for ${targetName}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to revoke share";
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <AppShell allowedRoles={["customer"]}>
        <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6]">
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading policy details...</p>
        </div>
      </AppShell>
    );
  }

  if (!policy) {
    return (
      <AppShell allowedRoles={["customer"]}>
        <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6] space-y-4">
          <p className="text-sm font-semibold text-slate-800">Policy not found</p>
          <Link
            href="/policies"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Policies
          </Link>
        </div>
      </AppShell>
    );
  }

  const renderTypeSpecificDetails = () => {
    const details = policy.details;
    if (details.type === "motor") {
      const m = details.motor;
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Vehicle Make
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {m.make}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Model
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {m.model}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Registration No.
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {m.registrationNumber}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Manufacture Year
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {m.manufactureYear}
            </span>
          </div>
        </div>
      );
    }

    if (details.type === "health") {
      const h = details.health;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Hospital Network
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {h.network} Network
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Room Category
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {h.roomType} Room
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Covered Dependents
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {h.dependents.length > 0 ? h.dependents.join(", ") : "None (Primary only)"}
            </span>
          </div>
        </div>
      );
    }

    if (details.type === "home") {
      const hm = details.home;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Insured Property Address
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {hm.propertyAddress}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Construction Year
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {hm.constructionYear}
            </span>
          </div>
        </div>
      );
    }

    if (details.type === "travel") {
      const tr = details.travel;
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Destination
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {tr.destination}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Travel Dates
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {formatDate(tr.departureDate, "MMM d")} - {formatDate(tr.returnDate, "MMM d, yyyy")}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Travellers
            </span>
            <span className="text-xs font-semibold text-slate-800 block mt-0.5">
              {tr.travellersCount} Person(s)
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <AppShell allowedRoles={["customer"]}>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/policies"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Policies
          </Link>
        </div>

        {/* Policy Header Banner */}
        <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {policy.type} Insurance
                </span>
                <StatusBadge status={policy.status} size="sm" />
                {isGrantee && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    Shared Access (Read-Only)
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                Policy #{policy.policyNumber}
              </h1>
            </div>

            {isOwner && (
              <Link
                href={`/claims/new?policyId=${policy._id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs self-start sm:self-auto"
              >
                <PlusCircle className="w-4 h-4" />
                File Claim Against Policy
              </Link>
            )}
          </div>

          {/* Core financial figures */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-8 pt-6 border-t border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Coverage Amount
              </span>
              <span className="text-lg font-bold text-slate-900 block mt-0.5">
                {formatCurrency(policy.coverage.amount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Deductible
              </span>
              <span className="text-lg font-bold text-slate-700 block mt-0.5">
                {formatCurrency(policy.coverage.deductible)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Premium
              </span>
              <span className="text-lg font-bold text-slate-800 block mt-0.5">
                {formatCurrency(policy.premium.amount)}
                <span className="text-xs font-normal text-slate-400">
                  {" "}/ {policy.premium.frequency}
                </span>
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Next Renewal
              </span>
              <span className="text-lg font-bold text-slate-800 block mt-0.5">
                {formatDate(policy.renewalDate, "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column: Details + DAC Sharing Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Type-Specific Specifications + Related Claims */}
          <div className="lg:col-span-8 space-y-6">
            {/* Specifics */}
            <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">
                Policy Specifications & Inclusions
              </h2>
              {renderTypeSpecificDetails()}
            </div>

            {/* Related Claims */}
            <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Claims Filed on this Policy
                </h2>
                <span className="text-xs text-slate-400">
                  {claims.length} {claims.length === 1 ? "claim" : "claims"}
                </span>
              </div>

              {claims.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-xs text-slate-500">
                    No claims have been filed under this policy.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {claims.map((clm) => (
                    <Link
                      key={clm._id}
                      href={`/claims/${clm._id}`}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            #{clm.claimNumber}
                          </span>
                          <StatusBadge status={clm.currentStatus} size="sm" />
                          <ClassificationBadge classification={clm.classification} />
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {clm.incident.description}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900 block">
                          {formatCurrency(clm.claimedAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {formatDate(clm.createdAt, "MMM d, yyyy")}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column (4 cols): DAC Owner-Controlled Sharing Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Share Policy
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Grant view access to another registered user.
                  </p>
                </div>
              </div>

              {isOwner ? (
                <>
                  {/* Share form */}
                  <form onSubmit={handleShare} className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={shareEmail}
                        onChange={(e) => setShareEmail(e.target.value)}
                        placeholder="Enter email address"
                        required
                        className="flex-1 bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="submit"
                        disabled={isSharing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Share
                      </button>
                    </div>
                  </form>

                  {/* List of granted users */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-700 block mb-2">
                      Shared With ({policy.sharedWith.length})
                    </span>

                    {policy.sharedWith.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Not currently shared with anyone.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {policy.sharedWith.map((share) => (
                          <div
                            key={share.userId}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-800 block">
                                {share.userName}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {share.userEmail}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRevoke(share.userId, share.userName)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Revoke access"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block">Shared View Access</span>
                    <span className="text-slate-500">You are viewing this policy shared by the owner.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

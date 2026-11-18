"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useLiveClaim } from "@/hooks/useLiveClaim";
import { getPolicyById } from "@/lib/api/policies";
import { getPayments } from "@/lib/api/payments";
import { respondToInfoRequest } from "@/lib/api/claims";
import { Policy, Payment } from "@/types";
import { formatCurrency, formatDate } from "@/lib/config";
import { StatusBadge, ClassificationBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import {
  ChevronLeft,
  FileText,
  MessageSquare,
  History,
  Send,
  Download,
  CreditCard,
  AlertCircle,
  Eye,
  X,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user } = useAuth();

  const { claim, isLoading: isClaimLoading } = useLiveClaim(id);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");

  // Info Request Response Modal / Form state
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<{ fileName: string; type: string } | null>(null);

  useEffect(() => {
    if (claim) {
      getPolicyById(claim.policyId).then(setPolicy);
      if (claim.currentStatus === "Paid") {
        getPayments({ claimId: claim._id }).then(setPayments);
      }
    }
  }, [claim]);

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseText.trim() || !claim || !user) return;

    setIsSubmittingResponse(true);
    try {
      await respondToInfoRequest(
        claim._id,
        responseText,
        { name: user.name, role: "customer" },
        [
          {
            id: `doc-${Date.now()}`,
            fileName: "customer_supplementary_docs.pdf",
            url: "/documents/customer_supplementary_docs.pdf",
            type: "application/pdf",
            uploadedAt: new Date().toISOString(),
            fileSize: "1.5 MB",
          },
        ]
      );
      toast.success("Information submitted to adjuster", {
        description: "Claim status updated to Under Review.",
      });
      setShowResponseModal(false);
      setResponseText("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit details";
      toast.error(msg);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  if (isClaimLoading) {
    return (
      <AppShell allowedRoles={["customer"]}>
        <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6]">
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading live claim data...</p>
        </div>
      </AppShell>
    );
  }

  if (!claim) {
    return (
      <AppShell allowedRoles={["customer"]}>
        <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6] space-y-4">
          <p className="text-sm font-semibold text-slate-800">Claim not found</p>
          <Link
            href="/claims"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Claims
          </Link>
        </div>
      </AppShell>
    );
  }

  const isInfoRequested = claim.currentStatus === "Info Requested";
  const latestPayment = payments[0];

  return (
    <AppShell allowedRoles={["customer"]}>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/claims"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Claims
          </Link>

          <LiveIndicator />
        </div>

        {/* Action Required Banner for Info Requested */}
        {isInfoRequested && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-amber-900">
                  Action Required: Additional Information Requested
                </h3>
                <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                  The claims adjuster has requested supplementary documentation or clarifications to complete the evaluation.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowResponseModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" />
              Respond to Adjuster
            </button>
          </div>
        )}

        {/* Claim Header Banner */}
        <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Claim Investigation
                </span>
                <StatusBadge status={claim.currentStatus} size="sm" />
                <ClassificationBadge classification={claim.classification} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                {claim.claimNumber}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Filed against Policy {policy?.policyNumber || claim.policyId} • Filed on{" "}
                {formatDate(claim.createdAt, "MMMM d, yyyy")}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Total Claimed
              </span>
              <span className="text-2xl md:text-3xl font-extrabold text-slate-900 block mt-0.5">
                {formatCurrency(claim.claimedAmount)}
              </span>
            </div>
          </div>

          {/* Paid settlement callout */}
          {claim.currentStatus === "Paid" && latestPayment && (
            <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-emerald-900 block">
                    Settlement Disbursed: {formatCurrency(latestPayment.amount)}
                  </span>
                  <span className="text-emerald-700 text-[11px] block mt-0.5">
                    Disbursed via {latestPayment.method} • Ref: {latestPayment.reference} • Paid on {formatDate(latestPayment.paidAt, "MMM d, yyyy")}
                  </span>
                </div>
              </div>
              <Link
                href="/payments"
                className="text-emerald-800 font-semibold underline text-xs"
              >
                View payment receipt
              </Link>
            </div>
          )}
        </div>

        {/* Tab switcher: Overview vs Activity Log */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "pb-3 relative transition-colors",
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Claim Overview & Documents
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "pb-3 relative transition-colors flex items-center gap-1.5",
              activeTab === "activity"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <History className="w-3.5 h-3.5" />
            Activity Log & Timeline ({claim.statusHistory.length})
          </button>
        </div>

        {/* Tab 1: Claim Overview & Documents */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 cols: Incident details & documents */}
            <div className="lg:col-span-8 space-y-6">
              {/* Incident report */}
              <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Incident Information
                </h2>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Date of Incident
                    </span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {formatDate(claim.incident.date, "MMMM d, yyyy")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Location
                    </span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {claim.incident.location}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 block text-[11px]">
                    Description of Occurrence
                  </span>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {claim.incident.description}
                  </p>
                </div>
              </div>

              {/* Supporting Documents */}
              <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Supporting Documents ({claim.documents.length})
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    Verified for loss assessment
                  </span>
                </div>

                {claim.documents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No documents attached to this claim.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {claim.documents.map((doc, idx) => (
                      <div
                        key={doc.id || `doc-${idx}-${doc.fileName || ""}`}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="truncate">
                            <span className="font-medium text-slate-800 block truncate">
                              {doc.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {doc.fileSize || "1.4 MB"} • {formatDate(doc.uploadedAt, "MMM d")}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ fileName: doc.fileName, type: doc.type })}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white transition-colors"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Adjuster Notes (Visible to Customer) */}
              {claim.adjusterNotes.length > 0 && (
                <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-3">
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Adjuster Evaluation Notes
                  </h2>

                  <div className="space-y-3">
                    {claim.adjusterNotes.map((note, idx) => (
                      <div
                        key={note.id || `note-${idx}`}
                        className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-blue-900 font-semibold">
                          <span>{note.adjusterName} (Claims Adjuster)</span>
                          <span className="text-slate-400 font-normal">
                            {formatDate(note.createdAt, "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed pt-1">
                          {note.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 cols: Current Live Progression Status */}
            <div className="lg:col-span-4 space-y-6">
              <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Live Status Flow
                  </h3>
                  <LiveIndicator />
                </div>

                <StatusTimeline
                  currentStatus={claim.currentStatus}
                  statusHistory={claim.statusHistory}
                  compact
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Activity Tab (Rendering statusHistory and notes with actor, role, timestamp) */}
        {activeTab === "activity" && (
          <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6] space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Claim Activity Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chronological history of status updates and notes.
              </p>
            </div>

            <StatusTimeline
              currentStatus={claim.currentStatus}
              statusHistory={claim.statusHistory}
            />
          </div>
        )}

        {/* Modal: Respond to Info Request */}
        {showResponseModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="solace-card p-6 bg-white border border-[#EEF2F6] max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Respond to Adjuster Request
                </h3>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Provide the clarifications, contractor quotes, or receipts requested by the adjuster to advance your claim to Under Review.
              </p>

              <form onSubmit={handleSendResponse} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Explanation / Details
                  </label>
                  <textarea
                    rows={4}
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    required
                    placeholder="Provide the requested details (e.g. contractor quotation summary, timeline explanation)..."
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5 text-xs text-slate-600">
                  <Upload className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>
                    Supplementary document attached:{" "}
                    <strong className="text-slate-800">customer_supplementary_docs.pdf</strong>
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResponseModal(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingResponse}
                    className="px-5 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
                  >
                    {isSubmittingResponse ? "Submitting..." : "Submit Response"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Document Preview Placeholder */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="solace-card p-6 bg-white border border-[#EEF2F6] max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {previewDoc.fileName}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview Canvas Placeholder */}
              <div className="h-64 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-6 text-center">
                <FileText className="w-12 h-12 text-slate-300 mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  {previewDoc.fileName}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Verified document stored securely in Solace document repository.
                </span>
                <button
                  onClick={() => {
                    toast.success("Document downloaded", {
                      description: previewDoc.fileName,
                    });
                    setPreviewDoc(null);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { useLiveClaim } from "@/hooks/useLiveClaim";
import { getPolicyById } from "@/lib/api/policies";
import { updateClaimStatus, addClaimNote } from "@/lib/api/claims";
import { recordPayment } from "@/lib/api/payments";
import { mockStore } from "@/lib/mock/store";
import { Policy, ClaimStatus, Classification, ClearanceLevel } from "@/types";
import { formatCurrency, formatDate } from "@/lib/config";
import { StatusBadge, ClassificationBadge } from "@/components/ui/StatusBadge";
import { StatusTimeline } from "@/components/ui/StatusTimeline";
import { SensitiveDataMask } from "@/components/ui/SensitiveDataMask";
import {
  ChevronLeft,
  Lock,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  HelpCircle,
  CreditCard,
  Eye,
  Send,
  X,
  History,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdjusterClaimReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const { user } = useAuth();

  const { claim, isLoading } = useLiveClaim(id);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"review" | "activity">("review");

  // Confirm Decision Dialogs
  const [decisionType, setDecisionType] = useState<"approve" | "reject" | "request_info" | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);

  // Record Payment Dialog
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"Bank Transfer" | "Direct Deposit" | "Cheque">("Direct Deposit");
  const [paymentRef, setPaymentRef] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Document preview
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);

  const userClearance: ClearanceLevel = user?.clearance || 1;

  // MAC Clearance evaluation
  const getRequiredClearance = (classification?: Classification): ClearanceLevel => {
    switch (classification) {
      case "standard":
        return 1;
      case "confidential":
        return 2;
      case "restricted":
        return 3;
      default:
        return 1;
    }
  };

  const reqClearance = getRequiredClearance(claim?.classification);
  const hasClearance = userClearance >= reqClearance;

  useEffect(() => {
    if (claim && hasClearance) {
      getPolicyById(claim.policyId).then((p) => {
        setPolicy(p);
        if (claim.claimedAmount && p) {
          setPaymentAmount(Math.max(0, claim.claimedAmount - p.coverage.deductible));
        } else if (claim.claimedAmount) {
          setPaymentAmount(claim.claimedAmount);
        }
        setPaymentRef(`SOL-PAY-${Math.floor(100000 + Math.random() * 900000)}`);
      });
    }
  }, [claim, hasClearance]);

  // If claim not loaded yet
  if (isLoading) {
    return (
      <AppShell allowedRoles={["adjuster"]}>
        <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6]">
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading claim dossier...</p>
        </div>
      </AppShell>
    );
  }

  if (!claim) {
    return (
      <AppShell allowedRoles={["adjuster"]}>
        <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6] space-y-4">
          <p className="text-sm font-semibold text-slate-800">Claim not found</p>
          <Link
            href="/adjuster"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Queue
          </Link>
        </div>
      </AppShell>
    );
  }

  // MAC LOCKOUT SCREEN: If adjuster has insufficient clearance, display strictly redacted screen
  if (!hasClearance) {
    return (
      <AppShell allowedRoles={["adjuster"]}>
        <div className="max-w-2xl mx-auto py-12">
          <div className="solace-card p-8 bg-white border border-[#EEF2F6] text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-center">
                <ClassificationBadge classification={claim.classification} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Access Restricted - Requires Clearance Level {reqClearance}
              </h1>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                This claim is classified under Mandatory Access Control (MAC) as{" "}
                <strong className="text-slate-800 uppercase">{claim.classification}</strong>.
                Your current adjuster credential provides Clearance Level {userClearance}. Under Solace security governance, claim details and dossier records are redacted.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-left max-w-md mx-auto space-y-2 text-slate-600 font-mono">
              <p>• Mandatory Access Policy: Bell-LaPadula Confidentiality Model</p>
              <p>• Attempted Record: {claim.claimNumber}</p>
              <p>• Required Signoff: Clearance Level {reqClearance}+</p>
              <p>• Current Adjuster: {user?.name} (Clearance {userClearance})</p>
            </div>

            <div className="pt-2">
              <Link
                href="/adjuster"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                Return to Authorized Queue
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Customer details
  const customer = mockStore.getUserById(claim.customerId);

  // Decision Execution
  const handleExecuteDecision = async () => {
    if (!decisionType || !user) return;
    setIsProcessingDecision(true);

    try {
      let targetStatus: ClaimStatus = "Under Review";
      let actionLabel = "";

      if (decisionType === "approve") {
        targetStatus = "Approved";
        actionLabel = "Claim approved";
      } else if (decisionType === "reject") {
        targetStatus = "Rejected";
        actionLabel = "Claim rejected";
      } else if (decisionType === "request_info") {
        targetStatus = "Info Requested";
        actionLabel = "Information requested from customer";
      }

      await updateClaimStatus(
        claim._id,
        targetStatus,
        { id: user._id, name: user.name, role: "adjuster" },
        decisionComment || `Adjuster recorded decision: ${targetStatus}`
      );

      toast.success(actionLabel, {
        description: `Status updated to ${targetStatus}`,
      });

      setDecisionType(null);
      setDecisionComment("");

      // If approved, immediately offer to record payment
      if (targetStatus === "Approved") {
        setShowPaymentDialog(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record decision";
      toast.error(msg);
    } finally {
      setIsProcessingDecision(false);
    }
  };

  // Add Adjuster Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !user) return;

    setIsAddingNote(true);
    try {
      await addClaimNote(claim._id, newNote, { id: user._id, name: user.name });
      setNewNote("");
      toast.success("Adjuster evaluation note saved");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save note";
      toast.error(msg);
    } finally {
      setIsAddingNote(false);
    }
  };

  // Payment Recording Transaction
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || paymentAmount <= 0) return;

    setIsRecordingPayment(true);
    try {
      await recordPayment({
        claimId: claim._id,
        amount: paymentAmount,
        method: paymentMethod,
        reference: paymentRef,
        adjuster: { id: user._id, name: user.name },
        simulateFailure,
      });

      toast.success("Disbursement recorded successfully", {
        description: `Settlement of ${formatCurrency(paymentAmount)} disbursed via ${paymentMethod}.`,
      });
      setShowPaymentDialog(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment transaction failed";
      toast.error(msg, {
        description: "Nothing was saved - the claim status is unchanged.",
      });
    } finally {
      setIsRecordingPayment(false);
    }
  };

  return (
    <AppShell allowedRoles={["adjuster"]}>
      <div className="space-y-6">
        {/* Top Breadcrumb & Live indicator */}
        <div className="flex items-center justify-between">
          <Link
            href="/adjuster"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Claims Desk Queue
          </Link>

          <div className="flex items-center gap-2">
            <ClassificationBadge classification={claim.classification} />
            <StatusBadge status={claim.currentStatus} size="sm" />
          </div>
        </div>

        {/* Claim Review Header */}
        <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Claim Appraisal Dossier
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                {claim.claimNumber}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Policy {policy?.policyNumber || claim.policyId} • Submitted on{" "}
                {formatDate(claim.createdAt, "MMMM d, yyyy")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Decision Action Buttons */}
              {claim.currentStatus !== "Approved" &&
                claim.currentStatus !== "Paid" &&
                claim.currentStatus !== "Rejected" && (
                  <>
                    <button
                      onClick={() => setDecisionType("request_info")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-xs"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                      Request Info
                    </button>

                    <button
                      onClick={() => setDecisionType("reject")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-300 bg-rose-50 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition-colors shadow-xs"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-700" />
                      Reject Claim
                    </button>

                    <button
                      onClick={() => setDecisionType("approve")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve Claim
                    </button>
                  </>
                )}

              {claim.currentStatus === "Approved" && (
                <button
                  onClick={() => setShowPaymentDialog(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <CreditCard className="w-4 h-4" />
                  Record Payout Settlement
                </button>
              )}
            </div>
          </div>

          {/* Quick claim metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Claimed Amount
              </span>
              <span className="text-xl font-bold text-slate-900 block mt-0.5">
                {formatCurrency(claim.claimedAmount)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Policy Coverage Limit
              </span>
              <span className="text-base font-semibold text-slate-800 block mt-0.5">
                {policy ? formatCurrency(policy.coverage.amount) : "..."}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Policy Deductible
              </span>
              <span className="text-base font-semibold text-slate-800 block mt-0.5">
                {policy ? formatCurrency(policy.coverage.deductible) : "..."}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Est. Net Settlement
              </span>
              <span className="text-base font-bold text-emerald-700 block mt-0.5">
                {policy
                  ? formatCurrency(Math.max(0, claim.claimedAmount - policy.coverage.deductible))
                  : formatCurrency(claim.claimedAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab switcher: Review Dossier vs Activity Log */}
        <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("review")}
            className={cn(
              "pb-3 transition-colors",
              activeTab === "review"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Investigation Dossier & Policy
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={cn(
              "pb-3 transition-colors flex items-center gap-1.5",
              activeTab === "activity"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <History className="w-3.5 h-3.5" />
            Audit Activity & Notes ({claim.statusHistory.length})
          </button>
        </div>

        {/* Tab 1: Investigation Dossier */}
        {activeTab === "review" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 cols: Incident & Customer Details */}
            <div className="lg:col-span-8 space-y-6">
              {/* Customer Identity Card (with Masked Sensitive Data) */}
              <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Policyholder Profile (Auditor View)
                  </h2>
                  <span className="text-[11px] text-slate-400">
                    Sensitive fields masked by default
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Name</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {customer?.name || "Customer"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email</span>
                    <span className="font-semibold text-slate-800 block mt-0.5">
                      {customer?.email || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Contact Phone
                    </span>
                    <SensitiveDataMask
                      value={customer?.phone || "+94 77 123 4567"}
                      canReveal={true}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      National ID / NIC 
                    </span>
                    <SensitiveDataMask
                      value={customer?.nic || "918234567V"}
                      canReveal={true}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 italic">
                    Revealed actions logged in security audit
                  </span>
                </div>
              </div>

              {/* Incident report */}
              <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  Incident Statement
                </h2>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Occurrence Date
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
                    Circumstances & Loss Details
                  </span>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                    {claim.incident.description}
                  </p>
                </div>
              </div>

              {/* Supporting Documents list & preview */}
              <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
                <h2 className="text-sm font-semibold text-slate-900">
                  Submitted Documentation ({claim.documents.length})
                </h2>

                {claim.documents.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No documents uploaded by claimant.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {claim.documents.map((doc, idx) => (
                      <div
                        key={doc.id || `doc-${idx}-${doc.fileName || ""}`}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="truncate">
                            <span className="font-medium text-slate-800 block truncate">
                              {doc.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {doc.fileSize || "1.2 MB"} • Uploaded {formatDate(doc.uploadedAt, "MMM d")}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setPreviewDoc(doc.fileName)}
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

              {/* Adjuster Notes */}
              <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  Appraisal Notes & Technical Findings
                </h2>

                <div className="space-y-3">
                  {claim.adjusterNotes.map((note, idx) => (
                    <div
                      key={note.id || `note-${idx}`}
                      className="p-3.5 rounded-xl bg-purple-50/30 border border-purple-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-purple-950 font-semibold">
                        <span>{note.adjusterName}</span>
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

                {/* Add Note form */}
                <form onSubmit={handleAddNote} className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Add Adjuster Appraisal Note
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add an internal technical observation or valuation comment..."
                      className="flex-1 bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="submit"
                      disabled={isAddingNote || !newNote.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Add Note
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right 4 cols: Policy Summary & Live Flow */}
            <div className="lg:col-span-4 space-y-6">
              {/* Policy verification card */}
              <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Underlying Policy Verification
                </h3>

                {policy ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Policy Number
                      </span>
                      <span className="font-bold text-slate-900 block">
                        {policy.policyNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Coverage Limit
                      </span>
                      <span className="font-semibold text-slate-800 block">
                        {formatCurrency(policy.coverage.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Deductible
                      </span>
                      <span className="font-semibold text-slate-800 block">
                        {formatCurrency(policy.coverage.deductible)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Renewal Date
                      </span>
                      <span className="font-semibold text-slate-800 block">
                        {formatDate(policy.renewalDate, "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Loading policy...</p>
                )}
              </div>

              {/* Live Timeline status flow */}
              <div className="solace-card p-6 bg-white border border-[#EEF2F6] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Live Status Flow
                </h3>
                <StatusTimeline
                  currentStatus={claim.currentStatus}
                  statusHistory={claim.statusHistory}
                  compact
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Activity Tab */}
        {activeTab === "activity" && (
          <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6] space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Claim Activity & Audit Trail
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological sequence of claimant submissions, adjuster actions, and settlement changes.
              </p>
            </div>

            <StatusTimeline
              currentStatus={claim.currentStatus}
              statusHistory={claim.statusHistory}
            />
          </div>
        )}

        {/* Confirmation Modal: Approve / Reject / Request Info */}
        {decisionType && (
          <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="solace-card p-6 bg-white border border-[#EEF2F6] max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 capitalize">
                  Confirm Decision: {decisionType.replace("_", " ")}
                </h3>
                <button
                  onClick={() => setDecisionType(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                {decisionType === "approve"
                  ? "Are you sure you want to approve this claim? Approving confirms eligibility and opens the settlement disbursement dialog."
                  : decisionType === "reject"
                  ? "Are you sure you want to reject this claim? Denials require documented policy exclusion reasons."
                  : "Request additional documentation or contractor estimates from the customer."}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Adjuster Justification Comment
                </label>
                <textarea
                  rows={3}
                  value={decisionComment}
                  onChange={(e) => setDecisionComment(e.target.value)}
                  placeholder="Enter evaluation rationale or instructions..."
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecisionType(null)}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteDecision}
                  disabled={isProcessingDecision}
                  className={cn(
                    "px-5 py-2 rounded-full text-white text-xs font-semibold disabled:opacity-50 shadow-xs",
                    decisionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : decisionType === "reject"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  )}
                >
                  {isProcessingDecision ? "Saving..." : "Confirm & Apply"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Record Payment Settlement */}
        {showPaymentDialog && (
          <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="solace-card p-6 bg-white border border-[#EEF2F6] max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Record Claim Disbursement Payout
                  </h3>
                </div>
                <button
                  onClick={() => setShowPaymentDialog(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Execute the final settlement for Claim {claim.claimNumber}. Submitting records payment details and updates claim status to Paid in one transaction.
              </p>

              <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Disbursement Amount (LKR)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    required
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono font-bold"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Calculated net of policy deductible.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(
                          e.target.value as "Bank Transfer" | "Direct Deposit" | "Cheque"
                        )
                      }
                      className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="Direct Deposit">Direct Deposit</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reference Code
                    </label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      required
                      className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono"
                    />
                  </div>
                </div>

                {/* Dev-only simulate failure toggle (from requirements) */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      Dev Toggle: Simulate Transaction Failure
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tests rollback UX without changing claim status.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPaymentDialog(false)}
                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRecordingPayment}
                    className="px-6 py-2.5 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                  >
                    {isRecordingPayment ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Disbursing...
                      </span>
                    ) : (
                      "Disburse Settlement"
                    )}
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
                <span className="text-xs font-bold text-slate-900 truncate">
                  {previewDoc}
                </span>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="h-64 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-6 text-center">
                <FileText className="w-12 h-12 text-slate-300 mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  {previewDoc}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Adjuster appraisal view: Document authenticity validated.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Policy } from "@/types";
import { getPolicies } from "@/lib/api/policies";
import { createClaim } from "@/lib/api/claims";
import { formatCurrency, formatDate } from "@/lib/config";
import {
  Shield,
  FileText,
  Upload,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadedDoc {
  fileName: string;
  url: string;
  type: string;
  fileSize: string;
}

function SubmitClaimForm() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPolicyId = searchParams.get("policyId");

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState(1);

  // Form states
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(
    preselectedPolicyId || ""
  );
  const [incidentDate, setIncidentDate] = useState("");
  const [incidentLocation, setIncidentLocation] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [claimedAmount, setClaimedAmount] = useState<number | "">("");
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPolicies() {
      if (!user) return;
      try {
        const list = await getPolicies({
          customerId: user._id,
          status: "active",
        });
        setPolicies(list);
        if (!selectedPolicyId && list.length > 0) {
          setSelectedPolicyId(list[0]._id);
        }
      } catch (err) {
        console.error("Failed to load policies:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPolicies();
  }, [user, selectedPolicyId]);

  const selectedPolicy = policies.find((p) => p._id === selectedPolicyId);

  // Step 1 validation: Policy chosen
  const isStep1Valid = !!selectedPolicyId;

  // Step 2 validation: Incident date not in future & within period, location & description provided
  const validateStep2 = () => {
    if (!incidentDate) return "Please choose the incident date.";
    const selectedDate = new Date(incidentDate);
    const now = new Date();
    if (selectedDate > now) return "Incident date cannot be in the future.";
    if (!incidentLocation.trim()) return "Please state the incident location.";
    if (!incidentDescription.trim() || incidentDescription.length < 15) {
      return "Please provide an incident description with at least 15 characters.";
    }
    return null;
  };

  // Step 3 validation: Claimed amount > 0 and <= policy coverage
  const validateStep3 = () => {
    if (typeof claimedAmount !== "number" || claimedAmount <= 0) {
      return "Claimed amount must be greater than zero.";
    }
    if (selectedPolicy && claimedAmount > selectedPolicy.coverage.amount) {
      return `Claimed amount cannot exceed policy coverage limit of ${formatCurrency(
        selectedPolicy.coverage.amount
      )}.`;
    }
    return null;
  };

  // Step 4 validation: Documents (optional or max 5 files, <= 5MB)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocUploadError(null);
    const files = e.target.files;
    if (!files) return;

    if (documents.length + files.length > 5) {
      setDocUploadError("You can upload a maximum of 5 documents in total.");
      return;
    }

    const newDocs: UploadedDoc[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // File size check: 5MB = 5 * 1024 * 1024 bytes
      if (file.size > 5 * 1024 * 1024) {
        setDocUploadError(`File "${file.name}" exceeds the 5 MB maximum limit.`);
        return;
      }

      // Format check: pdf, jpg, png
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setDocUploadError(
          `File "${file.name}" has an unsupported format. Please upload PDF, JPG, or PNG files.`
        );
        return;
      }

      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      newDocs.push({
        fileName: file.name,
        url: `/documents/${file.name}`,
        type: file.type,
        fileSize: sizeStr,
      });
    }

    setDocuments((prev) => [...prev, ...newDocs]);
  };

  const removeDoc = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        toast.error(err);
        return;
      }
    }
    if (step === 3) {
      const err = validateStep3();
      if (err) {
        toast.error(err);
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmitClaim = async () => {
    if (!user || !selectedPolicyId || typeof claimedAmount !== "number") return;

    setIsSubmitting(true);
    try {
      const newClaim = await createClaim({
        policyId: selectedPolicyId,
        customerId: user._id,
        incident: {
          date: new Date(incidentDate).toISOString(),
          location: incidentLocation,
          description: incidentDescription,
        },
        claimedAmount,
        documents,
      });

      toast.success(`Claim ${newClaim.claimNumber} submitted successfully`, {
        description: "Assigned to claims queue for immediate review.",
      });

      router.push(`/claims/${newClaim._id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit claim";
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  const STEPS = [
    "Select Policy",
    "Incident Details",
    "Claim Amount",
    "Upload Documents",
    "Review & Submit",
  ];

  return (
    <AppShell allowedRoles={["customer"]}>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link
            href="/claims"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Claims
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Submit a New Insurance Claim
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete the 5 guided steps to file your incident report for evaluation.
          </p>
        </div>

        {/* Step Progress Indicators */}
        <div className="solace-card p-4 bg-white border border-[#EEF2F6]">
          <div className="grid grid-cols-5 gap-2">
            {STEPS.map((stepName, idx) => {
              const stepNumber = idx + 1;
              const isPassed = stepNumber < step;
              const isCurrent = stepNumber === step;

              return (
                <div key={stepName} className="text-center">
                  <div
                    className={cn(
                      "h-1.5 rounded-full mb-2 transition-colors",
                      isPassed
                        ? "bg-emerald-500"
                        : isCurrent
                        ? "bg-blue-600"
                        : "bg-slate-200"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] hidden sm:block truncate",
                      isCurrent
                        ? "font-bold text-slate-900"
                        : isPassed
                        ? "text-slate-600 font-medium"
                        : "text-slate-400"
                    )}
                  >
                    {stepNumber}. {stepName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-step Form Content */}
        <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6] min-h-[380px] flex flex-col justify-between">
          {/* STEP 1: Select Policy */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Step 1: Choose Policy
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the active insurance policy under which this incident occurred.
                </p>
              </div>

              {isLoading ? (
                <p className="text-xs text-slate-400 py-6">Loading your policies...</p>
              ) : policies.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                  No active policies found. You need an active policy to file a claim.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {policies.map((pol) => {
                    const isSelected = selectedPolicyId === pol._id;
                    return (
                      <div
                        key={pol._id}
                        onClick={() => setSelectedPolicyId(pol._id)}
                        className={cn(
                          "p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between",
                          isSelected
                            ? "border-blue-600 bg-blue-50/30 ring-2 ring-blue-500/20"
                            : "border-slate-200/80 hover:border-slate-300 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-900 uppercase">
                            {pol.type} Insurance
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            #{pol.policyNumber}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">
                          <span className="block font-semibold text-slate-800">
                            Limit: {formatCurrency(pol.coverage.amount)}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Deductible: {formatCurrency(pol.coverage.deductible)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Incident Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Step 2: Incident Details
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record when, where, and how the loss or occurrence took place.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Incident Date
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split("T")[0]}
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Must not be in the future and within policy term.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Incident Location
                  </label>
                  <input
                    type="text"
                    value={incidentLocation}
                    onChange={(e) => setIncidentLocation(e.target.value)}
                    placeholder="e.g. Duplication Road, Colombo 03"
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Incident Description
                  </label>
                  <textarea
                    rows={4}
                    value={incidentDescription}
                    onChange={(e) => setIncidentDescription(e.target.value)}
                    placeholder="Describe how the event happened, parties involved, and preliminary damages..."
                    className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Minimum 15 characters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Claimed Amount */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Step 3: Claimed Amount
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  State the total estimated loss or expense claimed.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {selectedPolicy && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Policy Maximum Coverage Limit
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {formatCurrency(selectedPolicy.coverage.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">
                        Policy Deductible
                      </span>
                      <span className="font-semibold text-slate-700 text-xs">
                        {formatCurrency(selectedPolicy.coverage.deductible)}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Claimed Amount (LKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      LKR
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={selectedPolicy?.coverage.amount}
                      value={claimedAmount}
                      onChange={(e) =>
                        setClaimedAmount(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      placeholder="e.g. 18500"
                      className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl pl-12 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Upload Documents */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Step 4: Upload Supporting Documents
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Attach invoices, police reports, or photographs (PDF, JPG, PNG; max 5 files, up to 5 MB each).
                </p>
              </div>

              {docUploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  {docUploadError}
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50/50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Drag and drop files, or browse
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supported formats: PDF, JPG, PNG (Max 5MB each)
                </p>
                <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs">
                  Choose Files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Uploaded Documents List */}
              {documents.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-800 block">
                    Attached Files ({documents.length} / 5)
                  </span>
                  {documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-slate-800 truncate font-medium">
                          {doc.fileName}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          ({doc.fileSize})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDoc(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Review & Submit */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Step 5: Review & Confirm Submission
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify the information before submitting your claim to the evaluation queue.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Selected Policy
                    </span>
                    <span className="font-semibold text-slate-800 capitalize">
                      {selectedPolicy?.type} (#{selectedPolicy?.policyNumber})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Claimed Amount
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {typeof claimedAmount === "number" ? formatCurrency(claimedAmount) : "-"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Incident Date
                    </span>
                    <span className="font-medium text-slate-800">
                      {formatDate(incidentDate, "MMM d, yyyy")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">
                      Incident Location
                    </span>
                    <span className="font-medium text-slate-800">
                      {incidentLocation}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60">
                  <span className="text-slate-400 block text-[11px]">
                    Description
                  </span>
                  <p className="text-slate-700 mt-0.5 leading-relaxed">
                    {incidentDescription}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">
                    Attached Documents: {documents.length} file(s)
                  </span>
                  <span className="text-emerald-700 font-medium text-[11px]">
                    Ready for evaluation
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={step === 1 && !isStep1Valid}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitClaim}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Claim
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function SubmitClaimPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin" />
        </div>
      }
    >
      <SubmitClaimForm />
    </Suspense>
  );
}


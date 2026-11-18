"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requestPolicy } from "@/lib/api/policies";
import { PolicyType } from "@/types";
import {
  ChevronLeft,
  Car,
  Home,
  Heart,
  Plane,
  ShieldCheck,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/config";

export default function RequestPolicyPage() {
  const router = useRouter();

  const [policyType, setPolicyType] = useState<PolicyType>("motor");
  const [coverageAmount, setCoverageAmount] = useState<number>(50000);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const policyTypes: {
    type: PolicyType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      type: "motor",
      label: "Motor Vehicle",
      description: "Coverage for comprehensive damage, collision, and third-party liabilities.",
      icon: Car,
    },
    {
      type: "health",
      label: "Health & Medical",
      description: "Hospitalization, outpatient care, medication, and family specialist coverage.",
      icon: Heart,
    },
    {
      type: "home",
      label: "Home & Property",
      description: "Protection against structural damage, natural disasters, fire, and theft.",
      icon: Home,
    },
    {
      type: "travel",
      label: "Travel Insurance",
      description: "Emergency medical, flight delays, lost luggage, and trip cancellation.",
      icon: Plane,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (coverageAmount <= 0) {
      toast.error("Please enter a valid coverage amount greater than 0");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestPolicy({
        type: policyType,
        coverageAmount: Number(coverageAmount),
        note: note.trim() || undefined,
      });

      toast.success("Policy request submitted successfully! It is pending review.");
      router.push("/policies");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit request";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell allowedRoles={["customer"]}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/policies"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Policies
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Request a Policy
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit an insurance policy application for adjuster review and activation.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6] space-y-6">
          {/* Policy Type Selection */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
              1. Select Insurance Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {policyTypes.map((pt) => {
                const Icon = pt.icon;
                const isSelected = policyType === pt.type;
                return (
                  <button
                    key={pt.type}
                    type="button"
                    onClick={() => setPolicyType(pt.type)}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all duration-150 flex flex-col justify-between gap-3",
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/10 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center",
                          isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span
                        className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center",
                          isSelected ? "border-blue-600 bg-blue-600" : "border-slate-300"
                        )}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {pt.label}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {pt.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coverage Limit */}
          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
              2. Requested Coverage Limit ($)
            </label>
            <p className="text-[11px] text-slate-500 mb-3">
              Enter the maximum coverage amount you wish to be protected for.
            </p>
            <div className="relative max-w-sm">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                $
              </span>
              <input
                type="number"
                min="1000"
                step="500"
                required
                value={coverageAmount}
                onChange={(e) => setCoverageAmount(Number(e.target.value))}
                className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl pl-8 pr-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2.5">
              {[25000, 50000, 100000, 250000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCoverageAmount(preset)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                >
                  {formatCurrency(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="pt-4 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
              3. Requirements & Notes (Optional)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              Include details like vehicle model, property address, or specific terms you would like considered.
            </p>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Requesting coverage for 2023 Honda Civic, or 3-bedroom residential home..."
              className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Submission Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">What happens next?</p>
              <p>
                Your request will be placed in the review queue with status{" "}
                <span className="font-semibold text-amber-700">Pending Review</span>. An adjuster or insurance agent will review your terms and activate the policy.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/policies"
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmitting ? "Submitting Request..." : "Submit Policy Request"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

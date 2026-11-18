"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getPolicyById, updatePolicy } from "@/lib/api/policies";
import { mockStore } from "@/lib/mock/store";
import { Policy, PolicyStatus } from "@/types";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function EditPolicyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();

  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Editable fields
  const [coverageAmount, setCoverageAmount] = useState<number>(0);
  const [deductible, setDeductible] = useState<number>(0);
  const [premiumAmount, setPremiumAmount] = useState<number>(0);
  const [premiumFrequency, setPremiumFrequency] = useState<
    "monthly" | "quarterly" | "annual"
  >("monthly");
  const [renewalDate, setRenewalDate] = useState("");
  const [status, setStatus] = useState<PolicyStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadPolicy() {
      try {
        const found = await getPolicyById(id);
        if (found) {
          setPolicy(found);
          setCoverageAmount(found.coverage.amount);
          setDeductible(found.coverage.deductible);
          setPremiumAmount(found.premium.amount);
          setPremiumFrequency(found.premium.frequency);
          setRenewalDate(found.renewalDate.split("T")[0]);
          setStatus(found.status);
        }
      } catch (err) {
        console.error("Failed to load policy for editing:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPolicy();
  }, [id]);

  const customerName = policy
    ? mockStore.getUserById(policy.customerId)?.name || "Client"
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;

    setIsSubmitting(true);
    try {
      await updatePolicy(policy._id, {
        coverage: {
          amount: coverageAmount,
          deductible,
        },
        premium: {
          amount: premiumAmount,
          frequency: premiumFrequency,
        },
        renewalDate: new Date(renewalDate).toISOString(),
        status,
      });

      toast.success(`Policy ${policy.policyNumber} updated successfully`);
      router.push("/agent/policies");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update policy";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell allowedRoles={["agent"]}>
        <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6]">
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading policy record...</p>
        </div>
      </AppShell>
    );
  }

  if (!policy) {
    return (
      <AppShell allowedRoles={["agent"]}>
        <div className="solace-card p-12 text-center bg-white border border-[#EEF2F6] space-y-4">
          <p className="text-sm font-semibold text-slate-800">Policy not found</p>
          <Link
            href="/agent/policies"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-xs"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell allowedRoles={["agent"]}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            href="/agent/policies"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Portfolio
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Edit Policy {policy.policyNumber}
          </h1>
          <p className="text-xs text-slate-500 mt-1 capitalize">
            {policy.type} Insurance • Issued to {customerName}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6] space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Underwriting Term Adjustments
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coverage Limit (LKR)
                </label>
                <input
                  type="number"
                  min={1000}
                  value={coverageAmount}
                  onChange={(e) => setCoverageAmount(Number(e.target.value))}
                  required
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Deductible (LKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={deductible}
                  onChange={(e) => setDeductible(Number(e.target.value))}
                  required
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Premium Amount (LKR)
                </label>
                <input
                  type="number"
                  min={100}
                  value={premiumAmount}
                  onChange={(e) => setPremiumAmount(Number(e.target.value))}
                  required
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Frequency
                </label>
                <select
                  value={premiumFrequency}
                  onChange={(e) =>
                    setPremiumFrequency(
                      e.target.value as "monthly" | "quarterly" | "annual"
                    )
                  }
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Renewal Date
                </label>
                <input
                  type="date"
                  value={renewalDate}
                  onChange={(e) => setRenewalDate(e.target.value)}
                  required
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PolicyStatus)}
                  className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link
                href="/agent/policies"
                className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save Adjustments
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

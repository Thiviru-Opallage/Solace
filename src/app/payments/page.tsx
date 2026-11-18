"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Payment } from "@/types";
import { getPayments } from "@/lib/api/payments";
import { formatCurrency, formatDate } from "@/lib/config";
import { CreditCard, CheckCircle2, ShieldCheck } from "lucide-react";

export default function PaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPayments() {
      if (!user) return;
      try {
        const list = await getPayments({ customerId: user._id });
        setPayments(list);
      } catch (err) {
        console.error("Failed to load payments:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPayments();
  }, [user]);

  const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <AppShell allowedRoles={["customer"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Disbursements & Payout History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Read-only immutable record of all claim settlements disbursed to your account.
          </p>
        </div>

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Total Payouts Received
            </span>
            <span className="text-2xl font-extrabold text-slate-900 block mt-1">
              {isLoading ? "..." : formatCurrency(totalPaid)}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              Direct settlement to bank account
            </span>
          </div>

          <div className="solace-card p-6 bg-white border border-[#EEF2F6]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Settled Claims
            </span>
            <span className="text-2xl font-extrabold text-slate-900 block mt-1">
              {isLoading ? "..." : payments.length}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Processed through Solace claims desk
            </span>
          </div>

          <div className="solace-card p-6 bg-white border border-[#EEF2F6] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-900 block">
                Direct Settlement Guarantee
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                All approved claims are disbursed within 24 business hours.
              </span>
            </div>
          </div>
        </div>

        {/* Payments Table / List */}
        <div className="solace-card overflow-hidden bg-white border border-[#EEF2F6]">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Disbursement Transactions
            </h2>
            <span className="text-xs text-slate-400">
              {payments.length} {payments.length === 1 ? "record" : "records"}
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Loading payment history...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-xs font-semibold text-slate-700">No disbursements recorded yet</h3>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                When an approved claim is settled by an adjuster, the payout receipt will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-semibold">
                    <th className="px-6 py-3.5">Reference ID</th>
                    <th className="px-6 py-3.5">Claim & Policy</th>
                    <th className="px-6 py-3.5">Disbursement Method</th>
                    <th className="px-6 py-3.5">Date Paid</th>
                    <th className="px-6 py-3.5">Authorized By</th>
                    <th className="px-6 py-3.5 text-right">Settled Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                        {p.reference}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/claims/${p.claimId}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          {p.claimNumber || "View Claim"}
                        </Link>
                        {p.policyNumber && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            Policy #{p.policyNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {p.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(p.paidAt, "MMM d, yyyy h:mm a")}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {p.recordedByName || p.recordedBy}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 text-sm">
                        {formatCurrency(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

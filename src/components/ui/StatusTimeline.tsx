"use client";

import React from "react";
import { ClaimStatus, StatusHistoryItem } from "@/types";
import { formatDate } from "@/lib/config";
import { cn } from "@/lib/utils";

interface StatusTimelineProps {
  currentStatus: ClaimStatus;
  statusHistory?: StatusHistoryItem[];
  compact?: boolean;
  className?: string;
}

const FLOW_STEPS: { status: ClaimStatus; label: string }[] = [
  { status: "Pending", label: "Claim Submitted" },
  { status: "Under Review", label: "Under Review" },
  { status: "Approved", label: "Approved" },
  { status: "Paid", label: "Payment Settled" },
];

export function StatusTimeline({
  currentStatus,
  statusHistory = [],
  compact = false,
  className,
}: StatusTimelineProps) {
  // If rejected or info requested, adapt progression
  const isRejected = currentStatus === "Rejected";
  const isInfoRequested = currentStatus === "Info Requested";

  const getStepIndex = (status: ClaimStatus) => {
    switch (status) {
      case "Pending":
        return 0;
      case "Under Review":
      case "Info Requested":
        return 1;
      case "Approved":
        return 2;
      case "Paid":
        return 3;
      case "Rejected":
        return 2;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  if (compact) {
    return (
      <div className={cn("space-y-4", className)}>
        {FLOW_STEPS.map((step, idx) => {
          const isDone = idx < currentIndex || (idx === currentIndex && currentStatus === "Paid");
          const isCurrent = idx === currentIndex && currentStatus !== "Paid";

          // Find date from statusHistory if available
          const historyEntry = statusHistory.find((h) => {
            if (step.status === "Pending") return h.status === "Pending";
            if (step.status === "Under Review") return h.status === "Under Review" || h.status === "Info Requested";
            if (step.status === "Approved") return h.status === "Approved" || h.status === "Rejected";
            if (step.status === "Paid") return h.status === "Paid";
            return false;
          });

          return (
            <div key={step.status} className="flex items-start gap-3 relative">
              {/* Connector line */}
              {idx < FLOW_STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute left-3 top-6 w-0.5 h-8 -ml-px transition-colors",
                    isDone ? "bg-emerald-400" : "bg-slate-200"
                  )}
                />
              )}

              {/* Status Circle */}
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors z-10",
                  isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : isCurrent
                    ? "bg-emerald-600 border-emerald-600 text-white ring-4 ring-emerald-100"
                    : "bg-white border-slate-300 text-slate-300"
                )}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-white" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>

              <div className="flex-1 -mt-0.5">
                <p
                  className={cn(
                    "text-xs font-semibold leading-tight",
                    isCurrent
                      ? "text-slate-900"
                      : isDone
                      ? "text-slate-700"
                      : "text-slate-400 font-normal"
                  )}
                >
                  {isCurrent && isInfoRequested
                    ? "Info Requested"
                    : isCurrent && isRejected
                    ? "Claim Rejected"
                    : step.label}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {historyEntry ? formatDate(historyEntry.at, "MMM d, yyyy") : "-"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Detailed timeline view for Claim Detail
  return (
    <div className={cn("flow-root", className)}>
      <ul className="-mb-8">
        {statusHistory.map((item, index) => {
          const isLast = index === statusHistory.length - 1;

          return (
            <li key={index} className="relative pb-8">
              {!isLast && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white shrink-0",
                      item.status === "Approved" || item.status === "Paid"
                        ? "bg-emerald-100 text-emerald-600"
                        : item.status === "Under Review"
                        ? "bg-sky-100 text-sky-600"
                        : item.status === "Info Requested"
                        ? "bg-amber-100 text-amber-700"
                        : item.status === "Rejected"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-slate-100 text-slate-600"
                    )}
                  >
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.status}
                    </p>
                    <span className="text-xs text-slate-400 shrink-0">
                      {formatDate(item.at, "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Updated by <span className="font-medium text-slate-700">{item.by}</span>
                    {item.byRole && (
                      <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {item.byRole}
                      </span>
                    )}
                  </p>
                  {item.comment && (
                    <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {item.comment}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

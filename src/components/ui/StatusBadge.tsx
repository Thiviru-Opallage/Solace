import React from "react";
import { ClaimStatus, PolicyStatus, Classification } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ClaimStatus | PolicyStatus;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  let badgeColor = "bg-[#F5F5F5] text-[#364F6B] border-[#E5E9EE]";

  switch (status) {
    case "active":
      badgeColor = "bg-[#3FC1C9]/15 text-[#364F6B] border-[#3FC1C9]/40 font-bold";
      break;
    case "expired":
      badgeColor = "bg-amber-50 text-amber-800 border-amber-200/80";
      break;
    case "cancelled":
      badgeColor = "bg-[#FC5185]/15 text-[#FC5185] border-[#FC5185]/30";
      break;
    case "Pending":
      badgeColor = "bg-[#F5F5F5] text-[#364F6B] border-[#E5E9EE]";
      break;
    case "pending":
      badgeColor = "bg-amber-50 text-amber-700 border-amber-200 font-semibold";
      break;
    case "Under Review":
      badgeColor = "bg-[#3FC1C9]/20 text-[#364F6B] border-[#3FC1C9]/50 font-semibold";
      break;
    case "Info Requested":
      badgeColor = "bg-amber-50 text-amber-800 border-amber-200/80";
      break;
    case "Approved":
      badgeColor = "bg-[#3FC1C9]/20 text-[#364F6B] border-[#3FC1C9]/60 font-bold";
      break;
    case "Rejected":
      badgeColor = "bg-[#FC5185]/15 text-[#FC5185] border-[#FC5185]/40";
      break;
    case "Paid":
      badgeColor = "bg-[#3FC1C9]/25 text-[#364F6B] border-[#3FC1C9] font-extrabold";
      break;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full transition-colors",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs",
        badgeColor,
        className
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          status === "active" || status === "Approved" || status === "Paid"
            ? "bg-[#3FC1C9]"
            : status === "Under Review"
            ? "bg-[#3FC1C9]"
            : status === "Info Requested" || status === "expired" || status === "pending"
            ? "bg-amber-500"
            : status === "Rejected" || status === "cancelled"
            ? "bg-[#FC5185]"
            : "bg-slate-400"
        )}
      />
      {status === "pending" ? "Pending Review" : status}
    </span>
  );
}

export function ClassificationBadge({
  classification,
  className,
}: {
  classification: Classification;
  className?: string;
}) {
  let style = "bg-slate-50 text-slate-600 border-slate-200/80";
  let label = "Standard";

  if (classification === "confidential") {
    style = "bg-sky-50 text-sky-700 border-sky-200 font-medium";
    label = "Confidential";
  } else if (classification === "restricted") {
    style = "bg-rose-50 text-rose-700 border-rose-200 font-semibold";
    label = "Restricted";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full border font-medium",
        style,
        className
      )}
    >
      <svg
        className="w-3 h-3 opacity-70"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      {label}
    </span>
  );
}

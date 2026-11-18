"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LiveIndicatorProps {
  className?: string;
  label?: string;
}

export function LiveIndicator({ className, label = "Live Sync" }: LiveIndicatorProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70 select-none",
        className
      )}
      title="Connected to real-time change stream"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      {label}
    </span>
  );
}

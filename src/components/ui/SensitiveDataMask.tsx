"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface SensitiveDataMaskProps {
  value?: string;
  type?: "phone" | "nic" | "text";
  isOwner?: boolean;
  canReveal?: boolean;
  className?: string;
}

export function SensitiveDataMask({
  value,
  canReveal = true,
  className,
}: SensitiveDataMaskProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  if (!value) {
    return <span className="text-slate-400 italic text-xs">Not specified</span>;
  }

  // Mask logic: keep last 4 characters visible, replace preceding with bullets
  const getMasked = (str: string) => {
    if (str.length <= 4) return "••••";
    const visiblePart = str.slice(-4);
    return `•••• •••• ${visiblePart}`;
  };

  const maskedValue = getMasked(value);

  return (
    <span className={cn("inline-flex items-center gap-2 font-mono text-sm", className)}>
      <span className={cn(isRevealed ? "text-slate-800" : "text-slate-500 tracking-wider")}>
        {isRevealed ? value : maskedValue}
      </span>

      {canReveal && (
        <button
          type="button"
          onClick={() => setIsRevealed(!isRevealed)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          title={isRevealed ? "Hide sensitive data" : "Reveal sensitive data"}
          aria-label={isRevealed ? "Hide sensitive data" : "Reveal sensitive data"}
        >
          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
      )}
    </span>
  );
}

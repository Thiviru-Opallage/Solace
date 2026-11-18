"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  const { user } = useAuth();

  const getDashboardLink = () => {
    if (user?.role === "agent") return "/agent";
    if (user?.role === "adjuster") return "/adjuster";
    return "/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full solace-card p-8 text-center space-y-6 bg-white border border-[#E5E9EE] rounded-3xl shadow-xl">
        <div className="w-14 h-14 rounded-3xl bg-[#FC5185]/10 border border-[#FC5185]/30 text-[#FC5185] flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div>
          <span className="text-xs font-bold tracking-wider text-[#FC5185] uppercase block mb-1">
            Access Restricted (HTTP 403)
          </span>
          <h1 className="text-2xl font-extrabold text-[#364F6B] tracking-tight">
            Role Permission Required
          </h1>
          <p className="text-sm text-[#5A6E85] mt-2 leading-relaxed">
            Your current account role{" "}
            <span className="font-bold text-[#364F6B] capitalize">
              ({user?.role || "anonymous"})
            </span>{" "}
            does not have clearance to view this resource under Solace&apos;s Role-Based Access Control (RBAC) policy.
          </p>
        </div>

        <div className="bg-[#F5F5F5] rounded-2xl p-4 text-left border border-[#E5E9EE] text-xs space-y-1.5 text-[#5A6E85]">
          <p className="font-bold text-[#364F6B]">RBAC Enforcement Notice:</p>
          <p>• Customers have access only to their policies and claims.</p>
          <p>• Agents manage portfolio generation and policy issuance.</p>
          <p>• Adjusters review claim submissions and record settlements.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={getDashboardLink()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#FC5185] text-white text-xs font-bold hover:bg-[#E04374] transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <Link
            href="/login"
            className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-white border border-[#E5E9EE] text-[#364F6B] text-xs font-bold hover:bg-[#F5F5F5] transition-colors"
          >
            Sign In Again
          </Link>
        </div>
      </div>
    </div>
  );
}

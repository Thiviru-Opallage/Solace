"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { SensitiveDataMask } from "@/components/ui/SensitiveDataMask";
import { formatDate } from "@/lib/config";
import {
  Shield,
  Phone,
  CreditCard,
  Mail,
  Calendar,
  ShieldCheck,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <AppShell allowedRoles={["customer"]}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Account Profile & Privacy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your credentials and verify default data privacy masking controls.
          </p>
        </div>

        {/* Profile Card */}
        <div className="solace-card p-6 md:p-8 bg-white border border-[#EEF2F6] space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xl font-bold text-slate-700">
              {user?.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.name}</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60 mt-1 capitalize">
                <Shield className="w-3 h-3 text-blue-600" />
                Verified Customer
              </span>
            </div>
          </div>

          {/* Privacy & Masked Fields Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Personal Identity & Contact
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Phone Number</span>
                </div>
                <SensitiveDataMask
                  value={user?.phone}
                  type="phone"
                  isOwner={true}
                  canReveal={true}
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>National Identity Card (NIC)</span>
                </div>
                <SensitiveDataMask
                  value={user?.nic}
                  type="nic"
                  isOwner={true}
                  canReveal={true}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Registered Email</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  {user?.email}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9FB] border border-[#E2E8F0]">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Member Since</span>
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  {formatDate(user?.createdAt, "MMMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>


        </div>
      </div>
    </AppShell>
  );
}

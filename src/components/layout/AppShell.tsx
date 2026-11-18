"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/types";
import { useRouter, usePathname } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function AppShell({ children, allowedRoles }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace("/login");
        return;
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace("/unauthorized");
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#E5E9EE] border-t-[#FC5185] animate-spin" />
          <p className="text-xs text-[#5A6E85] font-medium">Securing session...</p>
        </div>
      </div>
    );
  }

  // Guard: Not authenticated -> prevent rendering protected UI
  if (!isAuthenticated || !user) {
    return null;
  }

  // Guard: Role unauthorized -> prevent rendering protected UI
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F5] lg:pl-64">
      {/* Sidebar */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuToggle={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}

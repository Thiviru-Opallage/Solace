"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  Shield,
  Home,
  FileText,
  ShieldAlert,
  CreditCard,
  User as UserIcon,
  BarChart3,
  PlusCircle,
  FolderOpen,
  Users,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const role = user?.role || "customer";

  // Navigation configurations by role
  const customerNav = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Policies", href: "/policies", icon: FileText },
    { label: "Claims", href: "/claims", icon: ShieldAlert },
    { label: "Payments", href: "/payments", icon: CreditCard },
    { label: "Profile", href: "/profile", icon: UserIcon },
  ];

  const agentNav = [
    { label: "Overview", href: "/agent", icon: Home },
    { label: "Portfolio", href: "/agent/policies", icon: FolderOpen },
    { label: "Create Policy", href: "/agent/policies/new", icon: PlusCircle },
  ];

  const adjusterNav = [
    { label: "Claims Queue", href: "/adjuster", icon: ShieldAlert },
    { label: "Analytics", href: "/adjuster/analytics", icon: BarChart3 },
    ...(user?.clearance === 3
      ? [{ label: "User Management", href: "/adjuster/users", icon: Users }]
      : []),
  ];

  const navItems =
    role === "agent"
      ? agentNav
      : role === "adjuster"
      ? adjusterNav
      : customerNav;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-[#364F6B]/30 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 w-64 h-screen bg-[#F5F5F5] border-r border-[#E5E9EE] flex flex-col justify-between p-6 transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E9EE] flex items-center justify-center shadow-xs text-[#FC5185] transition-colors group-hover:border-[#3FC1C9]">
                <Shield className="w-5 h-5 fill-[#FC5185]/10 text-[#FC5185]" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-[#364F6B] block leading-tight">
                  Solace
                </span>
                <span className="text-[11px] text-[#5A6E85] block tracking-normal">
                  Insurance, quietly handled.
                </span>
              </div>
            </Link>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-[#5A6E85] hover:text-[#364F6B] lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  item.href !== "/agent" &&
                  item.href !== "/adjuster" &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-white text-[#364F6B] shadow-xs border border-[#E5E9EE] font-bold"
                      : "text-[#5A6E85] hover:text-[#364F6B] hover:bg-white/60"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive ? "text-[#FC5185]" : "text-[#5A6E85]"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

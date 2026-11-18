"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logout();
    toast.success("Successfully signed out");
    router.push("/login");
  };

  return (
    <header className="h-20 bg-[#F5F5F5] border-b border-[#E5E9EE] px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Mobile Menu Button + Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <button
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-xl text-[#364F6B] hover:bg-white lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A6E85] pointer-events-none" />
          <input
            type="text"
            placeholder="Search your policies, claims, or documents..."
            className="w-full bg-white border border-[#E5E9EE] rounded-full pl-10 pr-4 py-2 text-xs text-[#364F6B] placeholder:text-[#5A6E85] focus:outline-none focus:ring-2 focus:ring-[#3FC1C9]/30 focus:border-[#3FC1C9] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right controls: Notifications + Standard User Account Menu */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          onClick={() =>
            toast("Notifications", {
              description: "All policy notifications and claims are up to date.",
            })
          }
          className="w-10 h-10 rounded-full bg-white border border-[#E5E9EE] flex items-center justify-center text-[#364F6B] hover:text-[#FC5185] hover:border-[#3FC1C9] transition-all shadow-2xs relative"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FC5185] absolute top-2 right-2.5 ring-2 ring-white" />
        </button>

        {/* User Account Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 pl-2.5 rounded-full bg-white border border-[#E5E9EE] hover:border-[#3FC1C9] transition-all shadow-2xs text-left cursor-pointer"
          >
            {/* Avatar circle */}
            <div className="w-8 h-8 rounded-full bg-[#364F6B] text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-2xs">
              {user?.name ? (
                <span>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              ) : (
                <UserIcon className="w-4 h-4 text-white" />
              )}
            </div>

            <div className="hidden md:block pr-1">
              <span className="text-xs font-bold text-[#364F6B] block leading-tight">
                {user?.name || "My Account"}
              </span>
              <span className="text-[10px] text-[#5A6E85] block capitalize">
                {user?.role === "adjuster"
                  ? `Adjuster (L${user.clearance || 1})`
                  : user?.role || "Member"}
              </span>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-[#5A6E85] mr-1" />
          </button>

          {/* Standard User Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-[#E5E9EE] shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Profile Card Header */}
              <div className="px-4 py-3 border-b border-[#E5E9EE]">
                <p className="text-xs font-bold text-[#364F6B]">{user?.name || "User Account"}</p>
                <p className="text-[11px] text-[#5A6E85] truncate">{user?.email || ""}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3FC1C9]/15 text-[#364F6B] capitalize border border-[#3FC1C9]/30">
                    <Shield className="w-2.5 h-2.5 text-[#3FC1C9]" />
                    {user?.role === "adjuster" ? `Adjuster (Clearance L${user.clearance})` : user?.role}
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full text-left px-4 py-2 text-xs text-[#364F6B] hover:bg-[#F5F5F5] flex items-center gap-2.5 transition-colors font-medium"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#5A6E85]" />
                  <span>My Profile & Settings</span>
                </Link>
              </div>

              {/* Sign Out */}
              <div className="border-t border-[#E5E9EE] pt-1 mt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-xs text-[#FC5185] hover:bg-rose-50 flex items-center gap-2.5 font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

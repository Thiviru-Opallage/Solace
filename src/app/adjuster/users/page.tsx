"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/context/AuthContext";
import { User, Role } from "@/types";
import { getAllUsers, deleteUser } from "@/lib/api/users";
import { formatDate } from "@/lib/config";
import {
  Users,
  Search,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AdjusterUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      if (user?.clearance !== 3) {
        setIsLoading(false);
        return;
      }
      try {
        const list = await getAllUsers();
        setUsers(list);
      } catch (err) {
        console.error("Failed to load users:", err);
        toast.error("Failed to load users list");
      } finally {
        setIsLoading(false);
      }
    }
    loadUsers();
  }, [user]);

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete._id);
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id));
      toast.success(`User "${userToDelete.name}" has been removed.`);
      setUserToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete user";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Guard: Clearance level 3 required
  if (user && user.clearance !== 3) {
    return (
      <AppShell allowedRoles={["adjuster"]}>
        <div className="max-w-2xl mx-auto mt-12 solace-card p-8 bg-white border border-[#EEF2F6] text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Clearance Level 3 Required
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            User management and account removal are restricted to Level 3 Adjusters.
            Your current clearance level is{" "}
            <span className="font-semibold text-slate-800">
              Level {user.clearance ?? 1}
            </span>
            . Contact senior compliance if you require elevated privileges.
          </p>
        </div>
      </AppShell>
    );
  }

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      q === "" ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const customerCount = users.filter((u) => u.role === "customer").length;
  const staffCount = users.filter((u) => u.role !== "customer").length;

  return (
    <AppShell allowedRoles={["adjuster"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                User Management
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <ShieldCheck className="w-3 h-3" />
                Clearance Level 3
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Directory of customers and staff. Adjuster Level 3 has administrative authorization to remove accounts.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#EEF2F6] shadow-xs text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Customers
              </span>
              <span className="text-sm font-bold text-slate-800 block">
                {customerCount}
              </span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-white border border-[#EEF2F6] shadow-xs text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Staff
              </span>
              <span className="text-sm font-bold text-slate-800 block">
                {staffCount}
              </span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="solace-card p-4 bg-white border border-[#EEF2F6] flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="customer">Customers</option>
              <option value="agent">Agents</option>
              <option value="adjuster">Adjusters</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="solace-card overflow-hidden bg-white border border-[#EEF2F6]">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-400">Loading user directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No users found</p>
              <p className="text-[11px] text-slate-400">Try adjusting your search or filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-semibold">
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Role</th>
                    <th className="px-6 py-3.5">Clearance</th>
                    <th className="px-6 py-3.5">Joined</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => {
                    const isSelf = u._id === user?._id;

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {u.name}
                                {isSelf && (
                                  <span className="ml-2 text-[10px] font-normal text-slate-400">
                                    (You)
                                  </span>
                                )}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize",
                              u.role === "customer"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : u.role === "agent"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-purple-50 text-purple-700 border-purple-200"
                            )}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {u.role === "adjuster" ? (
                            <span className="font-semibold text-slate-800">
                              Level {u.clearance ?? 1}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {u.createdAt ? formatDate(u.createdAt, "MMM d, yyyy") : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setUserToDelete(u)}
                            disabled={isSelf}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shadow-xs",
                              isSelf
                                ? "opacity-30 cursor-not-allowed text-slate-400 border border-slate-200"
                                : "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300"
                            )}
                            title={isSelf ? "You cannot delete your own account" : "Remove user"}
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <button
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm User Removal
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold text-slate-800">
                    {userToDelete.name}
                  </span>{" "}
                  ({userToDelete.email})? This user will no longer be able to log in to Solace.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleting ? "Removing..." : "Yes, Remove User"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { evaluatePasswordStrength } from "@/lib/api/auth";
import { Eye, EyeOff, Lock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutError, setLockoutError] = useState<string | null>(null);

  const { login } = useAuth();
  const router = useRouter();

  const strength = evaluatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsSubmitting(true);
    setLockoutError(null);

    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}`);

      if (user.role === "agent") {
        router.push("/agent");
      } else if (user.role === "adjuster") {
        router.push("/adjuster");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log in";
      if (msg.includes("locked")) {
        setLockoutError(msg);
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center font-sans selection:bg-[#FC5185]/20 px-4 py-12"
      style={{
        backgroundColor: "#F8F9FB",
        backgroundImage:
          "radial-gradient(circle, #D1D9E6 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-sm border border-[#E8ECF2] px-8 py-10">
        <div className="w-full max-w-[400px] mx-auto">
          {/* Top Brand Logo */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-7 h-7 rounded-full p-[2.5px] bg-gradient-to-tr from-[#3FC1C9] to-[#FC5185] flex items-center justify-center shadow-xs">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FC5185] to-[#3FC1C9]" />
                </div>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-[#364F6B] group-hover:text-[#FC5185] transition-colors">
                Solace
              </span>
            </Link>
          </div>

          {/* Form Header */}
          <div className="mb-7">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#364F6B]">
              Sign In
            </h1>
          </div>

          {/* Lockout Warning Banner */}
          {lockoutError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-3">
              <Lock className="w-4 h-4 text-[#FC5185] mt-0.5 shrink-0" />
              <div>
                <span className="font-bold block">Account Lockout Activated</span>
                <span>{lockoutError}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email / Username */}
            <div>
              <label className="block text-xs font-bold text-[#364F6B] mb-2 px-1">
                Email or Username
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email or username"
                className="w-full bg-white border border-[#E5E9EE] rounded-full px-5 py-3.5 text-sm text-[#364F6B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3FC1C9]/40 focus:border-[#3FC1C9] transition-all shadow-xs"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#364F6B] mb-2 px-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-white border border-[#E5E9EE] rounded-full pl-5 pr-12 py-3.5 text-sm text-[#364F6B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3FC1C9]/40 focus:border-[#3FC1C9] transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6E85] hover:text-[#364F6B] p-1.5 cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>


            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-[#FC5185] to-[#E04374] text-white text-base font-bold hover:opacity-95 active:scale-[0.99] transition-all shadow-md shadow-[#FC5185]/25 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="text-base font-normal">↳</span>
                  Sign In
                </span>
              )}
            </button>
          </form>

          {/* Link to Register (Single Entry Point) */}
          <div className="mt-8 pt-6 border-t border-[#E5E9EE] text-center text-xs sm:text-sm">
            <span className="text-[#5A6E85]">Don&apos;t have an account? </span>
            <Link
              href="/register"
              className="font-bold text-[#FC5185] hover:underline transition-colors ml-1"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

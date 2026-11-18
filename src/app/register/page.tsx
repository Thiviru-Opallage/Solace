"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { evaluatePasswordStrength } from "@/lib/api/auth";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(8, "Please enter a valid phone number"),
    nic: z.string().min(9, "Please enter a valid National ID (NIC)"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register: authRegister } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      nic: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchedPassword = watch("password");
  const strength = evaluatePasswordStrength(watchedPassword || "");

  const onSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const user = await authRegister({
        name: values.name,
        email: values.email,
        phone: values.phone,
        nic: values.nic,
        password: values.password,
      });

      toast.success("Account created successfully", {
        description: `Welcome to Solace, ${user.name}!`,
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register account";
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
      <div className="w-full max-w-[460px] bg-white rounded-3xl shadow-sm border border-[#E8ECF2] px-8 py-10">
        <div className="w-full max-w-[440px] mx-auto">
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
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#364F6B]">
              Create Account
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#364F6B] mb-1.5 px-1">
                Full Name
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Enter your full legal name"
                className={cn(
                  "w-full bg-white border rounded-full px-5 py-3.5 text-sm text-[#364F6B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3FC1C9]/40 transition-all shadow-xs",
                  errors.name
                    ? "border-rose-400 bg-rose-50/20"
                    : "border-[#E5E9EE] focus:border-[#3FC1C9]"
                )}
              />
              {errors.name && (
                <p className="text-[11px] text-rose-500 mt-1 px-2 font-medium">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-[#364F6B] mb-1.5 px-1">
                Email Address
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder="Enter your email address"
                className={cn(
                  "w-full bg-white border rounded-full px-5 py-3.5 text-sm text-[#364F6B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3FC1C9]/40 transition-all shadow-xs",
                  errors.email
                    ? "border-rose-400 bg-rose-50/20"
                    : "border-[#E5E9EE] focus:border-[#3FC1C9]"
                )}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1 px-2 font-medium">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone & NIC (Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#364F6B] mb-1.5 px-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  {...register("phone")}
                  placeholder="e.g. +94 77 123 4567"
                  className={cn(
                    "w-full bg-white border rounded-full px-5 py-3.5 text-sm text-[#364F6B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3FC1C9]/40 transition-all shadow-xs",
                    errors.phone
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-[#E5E9EE] focus:border-[#3FC1C9]"
                  )}
                />
                {errors.phone && (
                  <p className="text-[11px] text-rose-500 mt-1 px-2 font-medium">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#364F6B] mb-1.5 px-1">
                  National ID (NIC)
                </label>
                <input
                  type="text"
                  {...register("nic")}
                  placeholder="Enter your National ID (NIC)"
                  className={cn(
                    "w-full bg-white border rounded-full px-5 py-3.5 text-sm text-[#364F6B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3FC1C9]/40 transition-all shadow-xs",
                    errors.nic
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-[#E5E9EE] focus:border-[#3FC1C9]"
                  )}
                />
                {errors.nic && (
                  <p className="text-[11px] text-rose-500 mt-1 px-2 font-medium">
                    {errors.nic.message}
                  </p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-[#364F6B] mb-1.5 px-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Create a strong password (min. 8 characters)"
                  className={cn(
                    "w-full bg-white border rounded-full pl-5 pr-12 py-3.5 text-sm text-[#364F6B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3FC1C9]/40 transition-all shadow-xs",
                    errors.password
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-[#E5E9EE] focus:border-[#3FC1C9]"
                  )}
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



              {errors.password && (
                <p className="text-[11px] text-rose-500 mt-1 px-2 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-[#364F6B] mb-1.5 px-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Re-enter your password to confirm"
                  className={cn(
                    "w-full bg-white border rounded-full pl-5 pr-12 py-3.5 text-sm text-[#364F6B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3FC1C9]/40 transition-all shadow-xs",
                    errors.confirmPassword
                      ? "border-rose-400 bg-rose-50/20"
                      : "border-[#E5E9EE] focus:border-[#3FC1C9]"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6E85] hover:text-[#364F6B] p-1.5 cursor-pointer"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-1 px-2 font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-gradient-to-r from-[#FC5185] to-[#E04374] text-white text-base font-bold hover:opacity-95 active:scale-[0.99] transition-all shadow-md shadow-[#FC5185]/25 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Customer Account</span>
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* Link to Sign In */}
          <div className="mt-8 pt-6 border-t border-[#E5E9EE] text-center text-xs sm:text-sm">
            <span className="text-[#5A6E85]">Already have an account? </span>
            <Link
              href="/login"
              className="font-bold text-[#FC5185] hover:underline transition-colors ml-1"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

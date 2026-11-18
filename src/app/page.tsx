"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RootPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.replace("/login");
      } else {
        if (user.role === "agent") {
          router.replace("/agent");
        } else if (user.role === "adjuster") {
          router.replace("/adjuster");
        } else {
          router.replace("/dashboard");
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#E5E9EE] border-t-[#FC5185] animate-spin" />
        <p className="text-xs text-[#5A6E85] font-medium tracking-wide">
          Connecting to Solace...
        </p>
      </div>
    </div>
  );
}

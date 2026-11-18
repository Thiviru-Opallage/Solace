"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { getCurrentUser, login as apiLogin, logout as apiLogout, registerCustomer, RegisterCustomerData } from "@/lib/api/auth";
import { useRouter } from "next/navigation";

import { APP_CONFIG } from "@/lib/config";
import { mockStore } from "@/lib/mock/store";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  register: (data: RegisterCustomerData) => Promise<User>;
  logout: () => Promise<void>;
  switchUser: (user: User) => Promise<void> | void;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isAgent: boolean;
  isAdjuster: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function initAuth() {
      try {
        const u = await getCurrentUser();
        setUser(u);
      } catch (err) {
        console.error("Failed to load current session:", err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiLogin(email, password);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterCustomerData): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await registerCustomer(data);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiLogout();
      setUser(null);
      router.push("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = async (newUser: User) => {
    if (APP_CONFIG.useMock) {
      mockStore.setCurrentUser(newUser);
      setUser(newUser);
    } else {
      try {
        const res = await apiLogin(newUser.email, "Password123!");
        setUser(res.user);
      } catch {
        try {
          const res = await apiLogin(newUser.email, "SuperSecret123!");
          setUser(res.user);
        } catch {
          setUser(newUser);
        }
      }
    }
  };

  const isCustomer = user?.role === "customer";
  const isAgent = user?.role === "agent";
  const isAdjuster = user?.role === "adjuster";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        switchUser,
        isAuthenticated: !!user,
        isCustomer,
        isAgent,
        isAdjuster,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

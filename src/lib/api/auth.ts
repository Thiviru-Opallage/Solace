import { User } from "@/types";
import { mockStore, delay } from "@/lib/mock/store";
import { APP_CONFIG } from "@/lib/config";
import { apiFetch, setStoredToken } from "./http";

export interface LoginResult {
  user: User;
  token?: string;
  accessToken?: string;
}

export interface RegisterCustomerData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  nic?: string;
}

export async function login(email: string, password?: string): Promise<LoginResult> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || err.error || "Failed to log in");
    }
    const data = await res.json();
    const token = data.token || data.accessToken;
    if (token) {
      setStoredToken(token);
    }
    return data;
  }

  await delay(350);

  // Check lockout
  const lockoutUntil = mockStore.getLockoutUntil(email);
  if (lockoutUntil) {
    const remainingSec = Math.ceil((lockoutUntil - Date.now()) / 1000);
    throw new Error(
      `Account temporarily locked due to 5 consecutive failed attempts. Please retry in ${remainingSec}s.`
    );
  }

  // Find user by email
  const user = mockStore.getUserByEmail(email);

  // If password provided and it's invalid (for demonstration, 'wrong' triggers failed attempt)
  if (password === "wrong" || password === "invalid") {
    const lockStatus = mockStore.recordFailedLogin(email);
    if (lockStatus.isLocked) {
      throw new Error(
        `Account temporarily locked due to 5 failed attempts. Please retry in ${lockStatus.lockSeconds}s.`
      );
    }
    throw new Error(`Invalid credentials. Attempt ${lockStatus.attempts} of 5.`);
  }

  if (!user) {
    throw new Error("No account found with this email address.");
  }

  // Reset failed attempts on success
  mockStore.resetFailedLogin(email);
  mockStore.setCurrentUser(user);

  return { user };
}

export async function registerCustomer(data: RegisterCustomerData): Promise<LoginResult> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || err.error || "Failed to register");
    }
    const result = await res.json();
    const token = result.token || result.accessToken;
    if (token) {
      setStoredToken(token);
    }
    return result;
  }

  await delay(400);

  const existing = mockStore.getUserByEmail(data.email);
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  const newUser: User = {
    _id: `cust-${Date.now()}`,
    name: data.name,
    email: data.email.toLowerCase(),
    role: "customer",
    phone: data.phone,
    nic: data.nic,
    createdAt: new Date().toISOString(),
  };

  mockStore.addUser(newUser);
  mockStore.setCurrentUser(newUser);

  return { user: newUser };
}

export async function getCurrentUser(): Promise<User | null> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch("/api/auth/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || data;
  }

  await delay(150);
  return mockStore.getCurrentUser();
}

export async function logout(): Promise<void> {
  if (!APP_CONFIG.useMock) {
    await apiFetch("/api/auth/logout", { method: "POST" });
    setStoredToken(null);
    return;
  }

  await delay(150);
  mockStore.setCurrentUser(null);
}

// Password strength calculation helper
export function evaluatePasswordStrength(password: string): {
  score: number; // 0 to 4
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
} {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  let passed = 0;
  if (checks.minLength) passed++;
  if (checks.hasUppercase && checks.hasLowercase) passed++;
  if (checks.hasNumber) passed++;
  if (checks.hasSpecial) passed++;

  const labels: ("Too weak" | "Weak" | "Fair" | "Good" | "Strong")[] = [
    "Too weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];

  return {
    score: passed,
    label: labels[passed],
    checks,
  };
}

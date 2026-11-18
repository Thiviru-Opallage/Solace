import {
  User,
  Policy,
  Claim,
  Payment,
} from "@/types";
import {
  INITIAL_USERS,
  INITIAL_POLICIES,
  INITIAL_CLAIMS,
  INITIAL_PAYMENTS,
} from "./data";

export const delay = (ms?: number) => {
  const waitTime = ms ?? Math.floor(Math.random() * 200 + 300); // 300-500ms
  return new Promise((resolve) => setTimeout(resolve, waitTime));
};

// Global in-memory singleton store
class MockDataStore {
  private users: User[] = [...INITIAL_USERS];
  private policies: Policy[] = [...INITIAL_POLICIES];
  private claims: Claim[] = [...INITIAL_CLAIMS];
  private payments: Payment[] = [...INITIAL_PAYMENTS];
  private claimListeners: Map<string, Set<(claim: Claim) => void>> = new Map();
  private generalClaimListeners: Set<(claims: Claim[]) => void> = new Set();
  private currentUser: User | null = null;
  private failedLoginAttempts: Map<string, number> = new Map();
  private lockoutUntil: Map<string, number> = new Map();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("solace_current_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          const found = this.users.find(
            (u) => u._id === parsed._id || u.email.toLowerCase() === parsed.email?.toLowerCase()
          );
          this.currentUser = found || parsed;
        } else {
          this.currentUser = null;
        }
      } catch {
        this.currentUser = null;
      }
    } else {
      this.currentUser = null;
    }
  }

  // --- Auth & Users ---
  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("solace_current_user");
        if (saved) {
          const parsed = JSON.parse(saved);
          this.currentUser = parsed;
          return parsed;
        }
      } catch {}
    }
    return null;
  }

  setCurrentUser(user: User | null): void {
    this.currentUser = user;
    if (typeof window !== "undefined") {
      try {
        if (user) {
          sessionStorage.setItem("solace_current_user", JSON.stringify(user));
        } else {
          sessionStorage.removeItem("solace_current_user");
        }
      } catch {}
    }
  }

  getFailedAttempts(email: string): number {
    return this.failedLoginAttempts.get(email.toLowerCase()) || 0;
  }

  getLockoutUntil(email: string): number | null {
    const lockTime = this.lockoutUntil.get(email.toLowerCase());
    if (lockTime && Date.now() < lockTime) {
      return lockTime;
    }
    return null;
  }

  recordFailedLogin(email: string): { attempts: number; isLocked: boolean; lockSeconds: number } {
    const key = email.toLowerCase();
    const current = (this.failedLoginAttempts.get(key) || 0) + 1;
    this.failedLoginAttempts.set(key, current);

    if (current >= 5) {
      const lockDurationMs = 30 * 1000; // 30 seconds lockout
      this.lockoutUntil.set(key, Date.now() + lockDurationMs);
      return { attempts: current, isLocked: true, lockSeconds: 30 };
    }
    return { attempts: current, isLocked: false, lockSeconds: 0 };
  }

  resetFailedLogin(email: string): void {
    const key = email.toLowerCase();
    this.failedLoginAttempts.delete(key);
    this.lockoutUntil.delete(key);
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find((u) => u._id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  addUser(user: User): User {
    this.users.unshift(user);
    return user;
  }

  // --- Policies ---
  getPolicies(): Policy[] {
    return [...this.policies];
  }

  getPolicyById(id: string): Policy | undefined {
    return this.policies.find((p) => p._id === id || p.policyNumber === id);
  }

  addPolicy(policy: Policy): Policy {
    this.policies.unshift(policy);
    return policy;
  }

  updatePolicy(id: string, updates: Partial<Policy>): Policy {
    const index = this.policies.findIndex((p) => p._id === id);
    if (index === -1) throw new Error("Policy not found");
    this.policies[index] = { ...this.policies[index], ...updates };
    return this.policies[index];
  }

  sharePolicy(policyId: string, granteeEmail: string): Policy {
    const policy = this.getPolicyById(policyId);
    if (!policy) throw new Error("Policy not found");

    const grantee = this.getUserByEmail(granteeEmail);
    if (!grantee) throw new Error("No user registered with this email address");

    if (grantee._id === policy.customerId) {
      throw new Error("You already own this policy");
    }

    if (policy.sharedWith.some((s) => s.userId === grantee._id)) {
      throw new Error("Policy is already shared with this user");
    }

    const updatedSharedWith = [
      ...policy.sharedWith,
      {
        userId: grantee._id,
        userEmail: grantee.email,
        userName: grantee.name,
        grantedAt: new Date().toISOString(),
        permission: "read" as const,
      },
    ];

    return this.updatePolicy(policyId, { sharedWith: updatedSharedWith });
  }

  revokePolicyShare(policyId: string, granteeUserId: string): Policy {
    const policy = this.getPolicyById(policyId);
    if (!policy) throw new Error("Policy not found");

    const updatedSharedWith = policy.sharedWith.filter(
      (s) => s.userId !== granteeUserId
    );

    return this.updatePolicy(policyId, { sharedWith: updatedSharedWith });
  }

  // --- Claims ---
  getClaims(): Claim[] {
    return [...this.claims];
  }

  getClaimById(id: string): Claim | undefined {
    return this.claims.find((c) => c._id === id || c.claimNumber === id);
  }

  addClaim(claim: Claim): Claim {
    this.claims.unshift(claim);
    this.notifyClaimListeners(claim);
    this.notifyGeneralClaimListeners();
    return claim;
  }

  updateClaim(id: string, updates: Partial<Claim>): Claim {
    const index = this.claims.findIndex((c) => c._id === id);
    if (index === -1) throw new Error("Claim not found");
    this.claims[index] = { ...this.claims[index], ...updates };
    const updated = this.claims[index];
    this.notifyClaimListeners(updated);
    this.notifyGeneralClaimListeners();
    return updated;
  }

  // --- Payments ---
  getPayments(): Payment[] {
    return [...this.payments];
  }

  addPayment(payment: Payment): Payment {
    this.payments.unshift(payment);
    return payment;
  }

  // --- Live Subscriptions (PubSub) ---
  subscribeToClaim(claimId: string, callback: (claim: Claim) => void): () => void {
    if (!this.claimListeners.has(claimId)) {
      this.claimListeners.set(claimId, new Set());
    }
    this.claimListeners.get(claimId)!.add(callback);

    // Initial notify with current state if exists
    const current = this.getClaimById(claimId);
    if (current) {
      callback(current);
    }

    return () => {
      const listeners = this.claimListeners.get(claimId);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.claimListeners.delete(claimId);
        }
      }
    };
  }

  subscribeToClaimsQueue(callback: (claims: Claim[]) => void): () => void {
    this.generalClaimListeners.add(callback);
    callback(this.getClaims());
    return () => {
      this.generalClaimListeners.delete(callback);
    };
  }

  private notifyClaimListeners(claim: Claim): void {
    const listeners = this.claimListeners.get(claim._id);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(claim);
        } catch (e) {
          console.error("Error in claim listener:", e);
        }
      });
    }
  }

  private notifyGeneralClaimListeners(): void {
    const all = this.getClaims();
    this.generalClaimListeners.forEach((cb) => {
      try {
        cb(all);
      } catch (e) {
        console.error("Error in claims queue listener:", e);
      }
    });
  }

  // Reset store to initial state (useful for tests or demo resets)
  reset(): void {
    this.users = [...INITIAL_USERS];
    this.policies = [...INITIAL_POLICIES];
    this.claims = [...INITIAL_CLAIMS];
    this.payments = [...INITIAL_PAYMENTS];
    this.currentUser = this.users[0];
    this.failedLoginAttempts.clear();
    this.lockoutUntil.clear();
    this.notifyGeneralClaimListeners();
  }
}

// Global singleton
export const mockStore = new MockDataStore();

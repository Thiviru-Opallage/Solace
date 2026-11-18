import { User } from "@/types";
import { mockStore, delay } from "@/lib/mock/store";
import { APP_CONFIG } from "@/lib/config";
import { apiFetch } from "./http";

export async function getCustomers(search?: string): Promise<User[]> {
  if (!APP_CONFIG.useMock) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    const res = await apiFetch(`/api/users?${query.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  }

  await delay(200);
  let users = mockStore.getUsers().filter((u) => u.role === "customer");
  if (search) {
    const s = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s)
    );
  }
  return users;
}

export async function getAllUsers(): Promise<User[]> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/users?all=true`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  }

  await delay(200);
  return mockStore.getUsers();
}

export async function deleteUser(id: string): Promise<void> {
  if (!APP_CONFIG.useMock) {
    const res = await apiFetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete user");
    }
    return;
  }

  await delay(300);
  // Mock: not implemented
  throw new Error("Delete not available in mock mode");
}


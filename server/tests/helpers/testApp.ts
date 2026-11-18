import request from "supertest";
import { createApp } from "../../src/app.js";
import { repositories } from "../../src/repositories/index.js";
import { hashPassword } from "../../src/auth/password.js";
import { Role, ClearanceLevel } from "../../src/repositories/types.js";

export const testApp = createApp();

/**
 * Creates a seeded user directly in the in-memory repository.
 */
export async function createTestUser(options: {
  email: string;
  role: Role;
  name?: string;
  password?: string;
  clearance?: ClearanceLevel;
}) {
  const password = options.password ?? "SecurePass123!";
  const passwordHash = await hashPassword(password);

  return repositories.users.create({
    name: options.name ?? `${options.role.toUpperCase()} User`,
    email: options.email.toLowerCase(),
    role: options.role,
    passwordHash,
    clearance: options.clearance,
  });
}

/**
 * Helper to log in a user and return cookie strings for supertest requests.
 */
export async function loginTestUser(email: string, password = "SecurePass123!") {
  const res = await request(testApp)
    .post("/api/auth/login")
    .send({ email, password });

  const rawCookies = res.headers["set-cookie"];
  const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
  return {
    status: res.status,
    body: res.body,
    cookies,
  };
}

/**
 * Helper to fetch a CSRF token and cookie.
 */
export async function getCsrf() {
  const res = await request(testApp).get("/api/auth/csrf");
  const rawCookies = res.headers["set-cookie"];
  const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
  return {
    csrfToken: res.body.csrfToken as string,
    csrfCookie: cookies,
  };
}

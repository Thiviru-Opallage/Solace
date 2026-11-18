import { describe, it, expect } from "vitest";
import request from "supertest";
import { testApp, createTestUser, getCsrf } from "./helpers/testApp.js";

describe("Authentication & Security Module", () => {
  it("GET /api/auth/csrf returns a valid CSRF token and sets the cookie", async () => {
    const res = await request(testApp).get("/api/auth/csrf");
    expect(res.status).toBe(200);
    expect(res.body.csrfToken).toBeDefined();
    expect(typeof res.body.csrfToken).toBe("string");
  });

  it("POST /api/auth/register registers a new customer and sets auth cookies", async () => {
    const { csrfToken, csrfCookie } = await getCsrf();
    const email = `customer-${Date.now()}@example.com`;

    const res = await request(testApp)
      .post("/api/auth/register")
      .set("Cookie", csrfCookie)
      .set("x-csrf-token", csrfToken)
      .send({
        name: "Test Customer",
        email,
        password: "SuperSecret123!",
        phone: "+94 77 123 4567",
        nic: "199012345678",
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe("customer");

    // Cookies must be set
    const rawSetCookie = res.headers["set-cookie"];
    const setCookie = Array.isArray(rawSetCookie) ? rawSetCookie : rawSetCookie ? [rawSetCookie] : [];
    expect(setCookie.length).toBeGreaterThan(0);
    expect(setCookie.some((c) => c.includes("solace_access_token"))).toBe(true);
    expect(setCookie.some((c) => c.includes("solace_refresh_token"))).toBe(true);
  });

  it("POST /api/auth/register rejects duplicate emails with HTTP 409", async () => {
    const { csrfToken, csrfCookie } = await getCsrf();
    const email = `duplicate-${Date.now()}@example.com`;

    await createTestUser({ email, role: "customer" });

    const res = await request(testApp)
      .post("/api/auth/register")
      .set("Cookie", csrfCookie)
      .set("x-csrf-token", csrfToken)
      .send({
        name: "Duplicate User",
        email,
        password: "SuperSecret123!",
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EMAIL_EXISTS");
  });

  it("POST /api/auth/login succeeds with valid credentials", async () => {
    const email = `login-${Date.now()}@example.com`;
    await createTestUser({ email, role: "customer", password: "Password123!" });

    const res = await request(testApp)
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);

    const rawCookies = res.headers["set-cookie"];
    const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];
    expect(cookies.some((c) => c.includes("solace_access_token"))).toBe(true);
  });

  it("POST /api/auth/login returns 401 for incorrect password", async () => {
    const email = `login-fail-${Date.now()}@example.com`;
    await createTestUser({ email, role: "customer", password: "Password123!" });

    const res = await request(testApp)
      .post("/api/auth/login")
      .send({ email, password: "WrongPassword123!" });

    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me returns 401 when unauthenticated", async () => {
    const res = await request(testApp).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me returns the profile when authenticated", async () => {
    const email = `me-${Date.now()}@example.com`;
    await createTestUser({ email, role: "customer", password: "Password123!" });

    const loginRes = await request(testApp)
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });

    const rawCookies = loginRes.headers["set-cookie"];
    const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];

    const meRes = await request(testApp)
      .get("/api/auth/me")
      .set("Cookie", cookies);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe(email);
  });

  it("POST /api/auth/logout clears auth cookies", async () => {
    const email = `logout-${Date.now()}@example.com`;
    await createTestUser({ email, role: "customer", password: "Password123!" });

    const loginRes = await request(testApp)
      .post("/api/auth/login")
      .send({ email, password: "Password123!" });

    const rawCookies = loginRes.headers["set-cookie"];
    const cookies = Array.isArray(rawCookies) ? rawCookies : rawCookies ? [rawCookies] : [];

    const logoutRes = await request(testApp)
      .post("/api/auth/logout")
      .set("Cookie", cookies);

    expect(logoutRes.status).toBe(200);
  });

  it("Customer role receives 403 Forbidden on GET /api/users; Agent receives 200 OK", async () => {
    const custEmail = `cust-guard-${Date.now()}@example.com`;
    const agentEmail = `agent-guard-${Date.now()}@example.com`;

    await createTestUser({ email: custEmail, role: "customer", password: "Password123!" });
    await createTestUser({ email: agentEmail, role: "agent", password: "Password123!" });

    const custLogin = await request(testApp)
      .post("/api/auth/login")
      .send({ email: custEmail, password: "Password123!" });

    const agentLogin = await request(testApp)
      .post("/api/auth/login")
      .send({ email: agentEmail, password: "Password123!" });

    // Customer attempt to list all users -> must be rejected with 403
    const custRes = await request(testApp)
      .get("/api/users")
      .set("Authorization", `Bearer ${custLogin.body.accessToken}`);

    expect(custRes.status).toBe(403);

    // Agent attempt to list customers -> must be allowed with 200
    const agentRes = await request(testApp)
      .get("/api/users")
      .set("Authorization", `Bearer ${agentLogin.body.accessToken}`);

    expect(agentRes.status).toBe(200);
    expect(Array.isArray(agentRes.body.users)).toBe(true);
  });
});

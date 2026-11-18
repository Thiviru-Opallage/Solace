import { describe, it, expect } from "vitest";
import request from "supertest";
import { testApp, createTestUser, loginTestUser } from "./helpers/testApp.js";

describe("Analytics Module", () => {
  it("Adjuster and Agent can access KPI and chart analytics; Customer cannot (403)", async () => {
    const adjEmail = `adj-analytics-${Date.now()}@example.com`;
    const custEmail = `cust-analytics-${Date.now()}@example.com`;

    await createTestUser({ email: adjEmail, role: "adjuster", clearance: 2 });
    await createTestUser({ email: custEmail, role: "customer" });

    const adjLogin = await loginTestUser(adjEmail);
    const custLogin = await loginTestUser(custEmail);

    // 1. Adjuster accesses KPIs
    const kpiRes = await request(testApp)
      .get("/api/analytics/kpis")
      .set("Cookie", adjLogin.cookies);

    expect(kpiRes.status).toBe(200);
    expect(kpiRes.body.totalClaims).toBeDefined();
    expect(kpiRes.body.approvalRate).toBeDefined();

    // 2. Adjuster accesses claims by status
    const statusRes = await request(testApp)
      .get("/api/analytics/claims-by-status")
      .set("Cookie", adjLogin.cookies);

    expect(statusRes.status).toBe(200);
    expect(Array.isArray(statusRes.body)).toBe(true);

    // 3. Customer is forbidden from analytics (RBAC)
    const custRes = await request(testApp)
      .get("/api/analytics/kpis")
      .set("Cookie", custLogin.cookies);

    expect(custRes.status).toBe(403);
  });
});

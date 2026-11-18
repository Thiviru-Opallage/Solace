import { describe, it, expect } from "vitest";
import request from "supertest";
import { testApp, createTestUser, loginTestUser } from "./helpers/testApp.js";

describe("Policies & DAC Module", () => {
  it("Agent can create a policy; customer cannot", async () => {
    const agentEmail = `agent-${Date.now()}@example.com`;
    const customerEmail = `cust-${Date.now()}@example.com`;

    await createTestUser({ email: agentEmail, role: "agent" });
    const customer = await createTestUser({ email: customerEmail, role: "customer" });

    const agentLogin = await loginTestUser(agentEmail);
    const customerLogin = await loginTestUser(customerEmail);

    const policyPayload = {
      type: "motor",
      customerId: customer._id,
      coverage: { amount: 5000000, deductible: 25000 },
      premium: { amount: 45000, frequency: "annual" },
      renewalDate: "2026-12-31",
      details: {
        type: "motor",
        motor: {
          make: "Toyota",
          model: "Corolla",
          registrationNumber: "WP-CAB-1234",
          manufactureYear: 2022,
        },
      },
    };

    // Agent can create
    const agentRes = await request(testApp)
      .post("/api/policies")
      .set("Cookie", agentLogin.cookies)
      .send(policyPayload);

    expect(agentRes.status).toBe(201);
    expect(agentRes.body.policy).toBeDefined();
    expect(agentRes.body.policy.policyNumber).toBeDefined();

    // Customer cannot create (RBAC forbidden)
    const custRes = await request(testApp)
      .post("/api/policies")
      .set("Cookie", customerLogin.cookies)
      .send(policyPayload);

    expect(custRes.status).toBe(403);
  });

  it("Customer can share their policy access with another customer (DAC)", async () => {
    const agentEmail = `agent2-${Date.now()}@example.com`;
    const ownerEmail = `owner-${Date.now()}@example.com`;
    const targetEmail = `target-${Date.now()}@example.com`;

    const agent = await createTestUser({ email: agentEmail, role: "agent" });
    const owner = await createTestUser({ email: ownerEmail, role: "customer", name: "Owner Customer" });
    const target = await createTestUser({ email: targetEmail, role: "customer", name: "Target Customer" });

    const agentLogin = await loginTestUser(agentEmail);
    const ownerLogin = await loginTestUser(ownerEmail);

    // 1. Agent creates policy for owner
    const createRes = await request(testApp)
      .post("/api/policies")
      .set("Cookie", agentLogin.cookies)
      .send({
        type: "home",
        customerId: owner._id,
        coverage: { amount: 15000000, deductible: 50000 },
        premium: { amount: 120000, frequency: "annual" },
        renewalDate: "2027-01-01",
        details: {
          type: "home",
          home: {
            propertyAddress: "123 Colombo Rd",
            propertyValue: 20000000,
            constructionYear: 2018,
          },
        },
      });

    const policyId = createRes.body.policy._id;

    // 2. Owner shares policy with target customer
    const shareRes = await request(testApp)
      .post(`/api/policies/${policyId}/share`)
      .set("Cookie", ownerLogin.cookies)
      .send({ email: targetEmail });

    expect(shareRes.status).toBe(200);
    expect(shareRes.body.policy.sharedWith.some((s: any) => s.userId === target._id)).toBe(true);

    // 3. Owner revokes share
    const revokeRes = await request(testApp)
      .delete(`/api/policies/${policyId}/share/${target._id}`)
      .set("Cookie", ownerLogin.cookies);

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.policy.sharedWith.some((s: any) => s.userId === target._id)).toBe(false);
  });
});

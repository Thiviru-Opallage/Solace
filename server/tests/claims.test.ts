import { describe, it, expect } from "vitest";
import request from "supertest";
import { testApp, createTestUser, loginTestUser } from "./helpers/testApp.js";

describe("Claims & MAC & Status Lifecycle Module", () => {
  it("Customer creates claim with MAC auto-classification and adjuster updates status", async () => {
    const custEmail = `claim-cust-${Date.now()}@example.com`;
    const adjEmail = `claim-adj-${Date.now()}@example.com`;
    const agentEmail = `claim-agent-${Date.now()}@example.com`;

    const cust = await createTestUser({ email: custEmail, role: "customer" });
    const adj = await createTestUser({ email: adjEmail, role: "adjuster", clearance: 3 });
    const agent = await createTestUser({ email: agentEmail, role: "agent" });

    const custLogin = await loginTestUser(custEmail);
    const adjLogin = await loginTestUser(adjEmail);
    const agentLogin = await loginTestUser(agentEmail);

    // 1. Agent creates policy for customer
    const polRes = await request(testApp)
      .post("/api/policies")
      .set("Cookie", agentLogin.cookies)
      .send({
        type: "motor",
        customerId: cust._id,
        coverage: { amount: 2000000, deductible: 10000 },
        premium: { amount: 30000, frequency: "annual" },
        renewalDate: "2026-12-31",
        details: {
          type: "motor",
          motor: { make: "Honda", model: "Civic", registrationNumber: "WP-KV-9999", manufactureYear: 2021 },
        },
      });

    const policyId = polRes.body.policy._id;

    // 2. Customer creates standard claim (<= 60,000)
    const claimRes = await request(testApp)
      .post("/api/claims")
      .set("Cookie", custLogin.cookies)
      .send({
        policyId,
        customerId: cust._id,
        claimedAmount: 45000,
        incident: {
          date: "2026-03-15",
          location: "Colombo 07",
          description: "Minor bumper dent while reversing.",
        },
      });

    expect(claimRes.status).toBe(201);
    expect(claimRes.body.claim.classification).toBe("standard");
    expect(claimRes.body.claim.currentStatus).toBe("Pending");

    const claimId = claimRes.body.claim._id;

    // 3. Adjuster transitions claim from Pending -> Under Review
    const reviewRes = await request(testApp)
      .patch(`/api/claims/${claimId}/status`)
      .set("Cookie", adjLogin.cookies)
      .send({
        status: "Under Review",
        comment: "Adjuster assigned for inspection.",
      });

    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.claim.currentStatus).toBe("Under Review");

    // 4. Adjuster adds internal note
    const noteRes = await request(testApp)
      .post(`/api/claims/${claimId}/notes`)
      .set("Cookie", adjLogin.cookies)
      .send({ note: "Inspection completed, damage matches estimate." });

    expect(noteRes.status).toBe(200);
    expect(noteRes.body.claim.adjusterNotes.length).toBe(1);

    // 5. Adjuster approves claim
    const approveRes = await request(testApp)
      .patch(`/api/claims/${claimId}/status`)
      .set("Cookie", adjLogin.cookies)
      .send({ status: "Approved", comment: "Claim approved for full estimate." });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.claim.currentStatus).toBe("Approved");

    // 6. Adjuster records payment
    const payRes = await request(testApp)
      .post("/api/payments")
      .set("Cookie", adjLogin.cookies)
      .send({
        claimId,
        amount: 45000,
        method: "Bank Transfer",
        reference: `FT-${Date.now()}`,
      });

    expect(payRes.status).toBe(201);
    expect(payRes.body.payment.amount).toBe(45000);

    // Verify claim status is now Paid
    const finalClaimRes = await request(testApp)
      .get(`/api/claims/${claimId}`)
      .set("Cookie", adjLogin.cookies);

    expect(finalClaimRes.status).toBe(200);
    expect(finalClaimRes.body.claim.currentStatus).toBe("Paid");
  });
});

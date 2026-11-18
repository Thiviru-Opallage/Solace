import { repositories } from "../src/repositories/index.js";
import { hashPassword } from "../src/auth/password.js";
import { encryptField } from "../src/crypto/fieldEncryption.js";
import { env } from "../src/config/env.js";
import { getDb, closeMongoClient } from "../src/repositories/mongo/client.js";

/**
 * Solace Insurance — Database Seed Script
 * Configures:
 *  - 3 Customers
 *  - 1 Agent
 *  - 3 Adjusters (Clearance Level 1, Level 2, and Level 3)
 *  - 3 Policies (Motor, Health, Home)
 *  - Approved & Declined Claims across clearance levels
 *  - Payment Disbursements
 */
async function seed() {
  console.log("🌱 Starting Solace database seeding...");

  if (env.REPO_MODE === "mongo") {
    console.log("Cleaning existing collections in MongoDB...");
    const db = await getDb();
    const collections = [
      "users",
      "policies",
      "claims",
      "payments",
      "refreshTokens",
      "auditLogs",
      "counters",
    ];
    for (const colName of collections) {
      try {
        await db.collection(colName).deleteMany({});
      } catch {
        // collection might not exist yet
      }
    }
  }

  const defaultPassword = "Password123!";
  const passwordHash = await hashPassword(defaultPassword);

  // ---------------------------------------------------------------------------
  // 1. Create Users (3 Customers, 1 Agent, 3 Adjusters)
  // ---------------------------------------------------------------------------
  console.log("Creating users...");

  // Customer 1
  const customer1 = await repositories.users.create({
    name: "John Smith",
    email: "john@gmail.com",
    role: "customer",
    passwordHash,
    phoneEncrypted: encryptField("+94 77 123 4567"),
    nicEncrypted: encryptField("199012345678"),
  });

  // Customer 2
  const customer2 = await repositories.users.create({
    name: "Marcus Chen",
    email: "marcus@gmail.com",
    role: "customer",
    passwordHash,
    phoneEncrypted: encryptField("+94 71 987 6543"),
    nicEncrypted: encryptField("199387654321"),
  });

  // Customer 3
  const customer3 = await repositories.users.create({
    name: "Priya Silva",
    email: "priya@gmail.com",
    role: "customer",
    passwordHash,
    phoneEncrypted: encryptField("+94 77 555 1234"),
    nicEncrypted: encryptField("199554321098"),
  });

  // Agent 1
  const agent1 = await repositories.users.create({
    name: "Alex Mercer",
    email: "alex@solace.lk",
    role: "agent",
    passwordHash,
  });

  // Adjuster 1 (Level 1: Standard claims <= 60,000 LKR)
  const adjuster1 = await repositories.users.create({
    name: "Liam Brooks",
    email: "liam@solace.lk",
    role: "adjuster",
    passwordHash,
    clearance: 1,
  });

  // Adjuster 2 (Level 2: Confidential claims <= 120,000 LKR)
  const adjuster2 = await repositories.users.create({
    name: "Maya Patel",
    email: "maya@solace.lk",
    role: "adjuster",
    passwordHash,
    clearance: 2,
  });

  // Adjuster 3 (Level 3: Restricted claims > 120,000 LKR or Fraud)
  const adjuster3 = await repositories.users.create({
    name: "Samantha Vance",
    email: "samantha@solace.lk",
    role: "adjuster",
    passwordHash,
    clearance: 3,
  });

  console.log("✓ Users created:");
  console.log("  - 3 Customers: John Smith, Marcus Chen, Priya Silva");
  console.log("  - 1 Agent: Alex Mercer");
  console.log("  - 3 Adjusters: Liam Brooks (L1), Maya Patel (L2), Samantha Vance (L3)");

  // ---------------------------------------------------------------------------
  // 2. Create Policies (3 Policies)
  // ---------------------------------------------------------------------------
  console.log("Creating policies...");

  // Policy 1: Motor Policy for Customer 1 (Shared with Customer 2 via DAC)
  const motorPolicy = await repositories.policies.create({
    policyNumber: "MO-1042",
    type: "motor",
    customerId: customer1._id,
    agentId: agent1._id,
    coverage: {
      amount: 4500000,
      deductible: 25000,
    },
    premium: {
      amount: 42000,
      frequency: "annual",
    },
    renewalDate: "2027-01-05",
    status: "active",
    details: {
      type: "motor",
      motor: {
        make: "Toyota",
        model: "Raize",
        registrationNumber: "WP-CBB-4892",
        manufactureYear: 2021,
      },
    },
    sharedWith: [
      {
        userId: customer2._id,
        userEmail: customer2.email,
        userName: customer2.name,
        grantedAt: "2026-01-10T10:00:00Z",
        permission: "read",
      },
    ],
  });

  // Policy 2: Health Policy for Customer 2
  const healthPolicy = await repositories.policies.create({
    policyNumber: "HE-2089",
    type: "health",
    customerId: customer2._id,
    agentId: agent1._id,
    coverage: {
      amount: 2500000,
      deductible: 5000,
    },
    premium: {
      amount: 18000,
      frequency: "quarterly",
    },
    renewalDate: "2027-02-15",
    status: "active",
    details: {
      type: "health",
      health: {
        dependents: ["Mei Chen (Spouse)"],
        network: "Comprehensive",
        roomType: "Private",
      },
    },
  });

  // Policy 3: Home Policy for Customer 3
  const homePolicy = await repositories.policies.create({
    policyNumber: "HO-3051",
    type: "home",
    customerId: customer3._id,
    agentId: agent1._id,
    coverage: {
      amount: 12000000,
      deductible: 50000,
    },
    premium: {
      amount: 65000,
      frequency: "annual",
    },
    renewalDate: "2027-03-20",
    status: "active",
    details: {
      type: "home",
      home: {
        propertyAddress: "42 Havelock Road, Colombo 05",
        propertyValue: 12000000,
        constructionYear: 2018,
      },
    },
  });

  console.log("✓ Policies created: 3 active policies (Motor, Health, Home)");

  // ---------------------------------------------------------------------------
  // 3. Create Claims (Approved, Declined / Rejected, and Active)
  // ---------------------------------------------------------------------------
  console.log("Creating claims...");

  // CLM-001: Motor -> APPROVED & PAID (Standard - Level 1)
  const claim1 = await repositories.claims.create({
    claimNumber: "CLM-001",
    policyId: motorPolicy._id,
    customerId: customer1._id,
    incident: {
      date: "2026-01-15",
      location: "Borella Junction, Colombo 08",
      description: "Rear bumper damaged in low-speed rear-end collision at traffic light.",
    },
    claimedAmount: 75000,
    classification: "standard",
    classificationLevel: 1,
    documents: [
      {
        id: "doc-101",
        fileName: "Police_Report.pdf",
        url: "/api/claims/sample/documents/doc-101",
        type: "application/pdf",
        uploadedAt: "2026-01-15T09:00:00Z",
        fileSize: "1.2 MB",
      },
      {
        id: "doc-102",
        fileName: "Garage_Estimate.pdf",
        url: "/api/claims/sample/documents/doc-102",
        type: "application/pdf",
        uploadedAt: "2026-01-15T09:05:00Z",
        fileSize: "850 KB",
      },
    ],
    adjusterNotes: [
      {
        id: "note-101",
        adjusterId: adjuster1._id,
        adjusterName: adjuster1.name,
        note: "Police report and garage estimate verified. Deductible of 25,000 applied to approved sum.",
        createdAt: "2026-01-17T08:30:00Z",
      },
    ],
    statusHistory: [
      { status: "Pending", by: customer1.name, byRole: "customer", at: "2026-01-15T09:00:00Z", comment: "Claim submitted." },
      { status: "Under Review", by: adjuster1.name, byRole: "adjuster", at: "2026-01-16T09:00:00Z", comment: "Assigned to Junior Adjuster Liam Brooks." },
      { status: "Approved", by: adjuster1.name, byRole: "adjuster", at: "2026-01-17T09:00:00Z", comment: "Approved net of deductible (50,000 LKR)." },
      { status: "Paid", by: adjuster1.name, byRole: "adjuster", at: "2026-01-18T10:00:00Z", comment: "Disbursement completed via Bank Transfer." },
    ],
    currentStatus: "Paid",
  });

  // CLM-002: Health -> DECLINED / REJECTED (Standard - Level 1)
  await repositories.claims.create({
    claimNumber: "CLM-002",
    policyId: healthPolicy._id,
    customerId: customer2._id,
    incident: {
      date: "2026-02-10",
      location: "Colombo General Hospital Dental Clinic",
      description: "Elective cosmetic dental porcelain veneer procedure.",
    },
    claimedAmount: 45000,
    classification: "standard",
    classificationLevel: 1,
    documents: [
      {
        id: "doc-201",
        fileName: "Dental_Invoice.pdf",
        url: "/api/claims/sample/documents/doc-201",
        type: "application/pdf",
        uploadedAt: "2026-02-10T14:00:00Z",
        fileSize: "780 KB",
      },
    ],
    adjusterNotes: [
      {
        id: "note-201",
        adjusterId: adjuster1._id,
        adjusterName: adjuster1.name,
        note: "Reviewed clinic diagnosis. Procedure is purely cosmetic; elective aesthetic work is explicitly excluded under Section 4.2 of policy.",
        createdAt: "2026-02-12T11:00:00Z",
      },
    ],
    statusHistory: [
      { status: "Pending", by: customer2.name, byRole: "customer", at: "2026-02-10T14:00:00Z", comment: "Claim submitted." },
      { status: "Under Review", by: adjuster1.name, byRole: "adjuster", at: "2026-02-11T10:00:00Z", comment: "Reviewing coverage schedule and diagnosis codes." },
      { status: "Rejected", by: adjuster1.name, byRole: "adjuster", at: "2026-02-12T11:15:00Z", comment: "Claim declined: Cosmetic procedures excluded under policy Section 4.2." },
    ],
    currentStatus: "Rejected",
  });

  // CLM-003: Home -> APPROVED (Confidential - Level 2)
  await repositories.claims.create({
    claimNumber: "CLM-003",
    policyId: homePolicy._id,
    customerId: customer3._id,
    incident: {
      date: "2026-02-20",
      location: "42 Havelock Road, Colombo 05",
      description: "Lightning strike caused electrical surge damaging main distribution board and security systems.",
    },
    claimedAmount: 95000,
    classification: "confidential",
    classificationLevel: 2,
    documents: [
      {
        id: "doc-301",
        fileName: "Certified_Electrician_Report.pdf",
        url: "/api/claims/sample/documents/doc-301",
        type: "application/pdf",
        uploadedAt: "2026-02-21T09:30:00Z",
        fileSize: "1.6 MB",
      },
      {
        id: "doc-302",
        fileName: "Equipment_Replacement_Quote.pdf",
        url: "/api/claims/sample/documents/doc-302",
        type: "application/pdf",
        uploadedAt: "2026-02-21T09:35:00Z",
        fileSize: "920 KB",
      },
    ],
    adjusterNotes: [
      {
        id: "note-301",
        adjusterId: adjuster2._id,
        adjusterName: adjuster2.name,
        note: "Confidential Level 2 review conducted. Electrician report confirms external surge. Full payout approved.",
        createdAt: "2026-02-23T14:00:00Z",
      },
    ],
    statusHistory: [
      { status: "Pending", by: customer3.name, byRole: "customer", at: "2026-02-21T09:30:00Z", comment: "Electrical surge claim submitted." },
      { status: "Under Review", by: adjuster2.name, byRole: "adjuster", at: "2026-02-22T10:00:00Z", comment: "Assigned to Senior Adjuster Maya Patel." },
      { status: "Approved", by: adjuster2.name, byRole: "adjuster", at: "2026-02-23T14:30:00Z", comment: "Approved for full assessed amount of 95,000 LKR. Pending payout dispatch." },
    ],
    currentStatus: "Approved",
  });

  // CLM-004: Motor -> DECLINED / REJECTED (Restricted - Level 3)
  await repositories.claims.create({
    claimNumber: "CLM-004",
    policyId: motorPolicy._id,
    customerId: customer1._id,
    incident: {
      date: "2026-03-01",
      location: "Off-road mountain trail, Nuwara Eliya",
      description: "Severe suspension and chassis underbody damage sustained during illegal off-road rally event.",
    },
    claimedAmount: 160000,
    classification: "restricted",
    classificationLevel: 3,
    documents: [
      {
        id: "doc-401",
        fileName: "Mechanic_Inspection.pdf",
        url: "/api/claims/sample/documents/doc-401",
        type: "application/pdf",
        uploadedAt: "2026-03-02T11:00:00Z",
        fileSize: "2.8 MB",
      },
    ],
    adjusterNotes: [
      {
        id: "note-401",
        adjusterId: adjuster3._id,
        adjusterName: adjuster3.name,
        note: "Specialist investigation confirms vehicle was operated in organized off-road rally without sanctioned permit. Excluded under Policy Endorsement 7B.",
        createdAt: "2026-03-05T15:00:00Z",
      },
    ],
    statusHistory: [
      { status: "Pending", by: customer1.name, byRole: "customer", at: "2026-03-02T11:00:00Z", comment: "Chassis damage claim submitted." },
      { status: "Under Review", by: adjuster3.name, byRole: "adjuster", at: "2026-03-03T09:00:00Z", comment: "Escalated to Chief Adjuster Samantha Vance (Level 3 clearance)." },
      { status: "Rejected", by: adjuster3.name, byRole: "adjuster", at: "2026-03-05T15:30:00Z", comment: "Claim declined: Competitive and non-public off-road racing excluded under policy Endorsement 7B." },
    ],
    currentStatus: "Rejected",
  });

  // CLM-005: Home -> APPROVED & PAID (Restricted - Level 3)
  const claim5 = await repositories.claims.create({
    claimNumber: "CLM-005",
    policyId: homePolicy._id,
    customerId: customer3._id,
    incident: {
      date: "2026-03-08",
      location: "42 Havelock Road, Colombo 05",
      description: "Fallen tree crushed upper roof structure and second-story balcony during severe monsoon gale.",
    },
    claimedAmount: 180000,
    classification: "restricted",
    classificationLevel: 3,
    documents: [
      {
        id: "doc-501",
        fileName: "Structural_Damage_Survey.pdf",
        url: "/api/claims/sample/documents/doc-501",
        type: "application/pdf",
        uploadedAt: "2026-03-09T08:30:00Z",
        fileSize: "3.4 MB",
      },
      {
        id: "doc-502",
        fileName: "Contractor_Repair_Estimate.pdf",
        url: "/api/claims/sample/documents/doc-502",
        type: "application/pdf",
        uploadedAt: "2026-03-09T08:45:00Z",
        fileSize: "1.1 MB",
      },
    ],
    adjusterNotes: [
      {
        id: "note-501",
        adjusterId: adjuster3._id,
        adjusterName: adjuster3.name,
        note: "Field inspection report verified. Covered act of nature. Net payout of 130,000 LKR authorized after 50,000 deductible.",
        createdAt: "2026-03-12T11:00:00Z",
      },
    ],
    statusHistory: [
      { status: "Pending", by: customer3.name, byRole: "customer", at: "2026-03-09T08:30:00Z", comment: "Monsoon storm damage claim submitted." },
      { status: "Under Review", by: adjuster3.name, byRole: "adjuster", at: "2026-03-10T09:00:00Z", comment: "Assigned to Chief Adjuster Samantha Vance (Level 3 clearance)." },
      { status: "Approved", by: adjuster3.name, byRole: "adjuster", at: "2026-03-12T11:00:00Z", comment: "Approved net of deductible (130,000 LKR)." },
      { status: "Paid", by: adjuster3.name, byRole: "adjuster", at: "2026-03-14T14:00:00Z", comment: "Disbursement completed via Direct Deposit." },
    ],
    currentStatus: "Paid",
  });

  // CLM-006: Health -> PENDING (Standard - Level 1)
  await repositories.claims.create({
    claimNumber: "CLM-006",
    policyId: healthPolicy._id,
    customerId: customer2._id,
    incident: {
      date: "2026-03-25",
      location: "Asiri Surgical Hospital, Colombo",
      description: "Emergency outpatient treatment and diagnostics for acute gastroenteritis.",
    },
    claimedAmount: 32000,
    classification: "standard",
    classificationLevel: 1,
    documents: [
      {
        id: "doc-601",
        fileName: "Medical_Bill.pdf",
        url: "/api/claims/sample/documents/doc-601",
        type: "application/pdf",
        uploadedAt: "2026-03-26T09:00:00Z",
        fileSize: "620 KB",
      },
    ],
    statusHistory: [
      { status: "Pending", by: customer2.name, byRole: "customer", at: "2026-03-26T09:00:00Z", comment: "Outpatient claim submitted. Awaiting review." },
    ],
    currentStatus: "Pending",
  });

  console.log("✓ Claims created:");
  console.log("  - CLM-001 (Motor): Approved & Paid (Standard L1)");
  console.log("  - CLM-002 (Health): Declined / Rejected (Standard L1)");
  console.log("  - CLM-003 (Home): Approved (Confidential L2)");
  console.log("  - CLM-004 (Motor): Declined / Rejected (Restricted L3)");
  console.log("  - CLM-005 (Home): Approved & Paid (Restricted L3)");
  console.log("  - CLM-006 (Health): Pending (Standard L1 queue item)");

  // ---------------------------------------------------------------------------
  // 4. Create Payments (Disbursements for Paid claims)
  // ---------------------------------------------------------------------------
  console.log("Creating payments...");

  await repositories.payments.create({
    claimId: claim1._id,
    claimNumber: claim1.claimNumber,
    policyNumber: motorPolicy.policyNumber,
    amount: 50000,
    method: "Bank Transfer",
    paidAt: "2026-01-18T10:00:00Z",
    reference: "BT-20260118-0112",
    recordedBy: adjuster1._id,
    recordedByName: adjuster1.name,
  });

  await repositories.payments.create({
    claimId: claim5._id,
    claimNumber: claim5.claimNumber,
    policyNumber: homePolicy.policyNumber,
    amount: 130000,
    method: "Direct Deposit",
    paidAt: "2026-03-14T14:00:00Z",
    reference: "DD-20260314-0744",
    recordedBy: adjuster3._id,
    recordedByName: adjuster3.name,
  });

  console.log("✓ Payments created: 2 disbursement records for Paid claims");

  console.log("\n✨ Database seeding completed successfully!");
  console.log("================================================================");
  console.log("Credentials (Password for all accounts: Password123!)");
  console.log("================================================================");
  console.log("Customers:");
  console.log("  1. john@gmail.com   -> John Smith   (Motor Policy MO-1042)");
  console.log("  2. marcus@gmail.com -> Marcus Chen  (Health Policy HE-2089)");
  console.log("  3. priya@gmail.com  -> Priya Silva  (Home Policy HO-3051)");
  console.log("");
  console.log("Agent:");
  console.log("  -  alex@solace.lk   -> Alex Mercer  (Manages all 3 policies)");
  console.log("");
  console.log("Adjusters (3 Clearance Levels):");
  console.log("  1. liam@solace.lk     -> Liam Brooks     [Level 1: Standard <= 60k]");
  console.log("  2. maya@solace.lk     -> Maya Patel      [Level 2: Confidential <= 120k]");
  console.log("  3. samantha@solace.lk -> Samantha Vance  [Level 3: Restricted > 120k]");
  console.log("================================================================");

  if (env.REPO_MODE === "mongo") {
    await closeMongoClient();
  }
}

seed().catch(async (err) => {
  console.error("❌ Seeding failed:", err);
  if (env.REPO_MODE === "mongo") {
    await closeMongoClient();
  }
  process.exit(1);
});

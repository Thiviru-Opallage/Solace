import {
  User,
  Policy,
  Claim,
  Payment,
  Role,
  ClaimStatus,
  Classification,
  StatusHistoryItem,
} from "@/types";

export const INITIAL_USERS: User[] = [
  // Customers
  {
    _id: "cust-1",
    name: "Priya Sharma",
    email: "priya@example.com",
    role: "customer",
    phone: "+94 77 123 4567",
    nic: "918234567V",
    createdAt: "2024-01-15T09:00:00Z",
  },
  {
    _id: "cust-2",
    name: "Marcus Chen",
    email: "marcus@example.com",
    role: "customer",
    phone: "+94 71 987 6543",
    nic: "883456789V",
    createdAt: "2024-02-10T11:30:00Z",
  },
  {
    _id: "cust-3",
    name: "Ananya Patel",
    email: "ananya@example.com",
    role: "customer",
    phone: "+94 76 345 6789",
    nic: "945678123V",
    createdAt: "2024-03-01T14:15:00Z",
  },
  {
    _id: "cust-4",
    name: "Rohan Silva",
    email: "rohan@example.com",
    role: "customer",
    phone: "+94 70 456 7890",
    nic: "901234567V",
    createdAt: "2024-03-20T10:00:00Z",
  },
  {
    _id: "cust-5",
    name: "Elena Rodriguez",
    email: "elena@example.com",
    role: "customer",
    phone: "+94 72 567 8901",
    nic: "956789012V",
    createdAt: "2024-04-05T16:45:00Z",
  },
  {
    _id: "cust-6",
    name: "David Kim",
    email: "david@example.com",
    role: "customer",
    phone: "+94 75 678 9012",
    nic: "891234567V",
    createdAt: "2024-04-18T08:20:00Z",
  },
  {
    _id: "cust-7",
    name: "Sarah Jenkins",
    email: "sarah@example.com",
    role: "customer",
    phone: "+94 78 789 0123",
    nic: "923456789V",
    createdAt: "2024-05-02T13:10:00Z",
  },
  {
    _id: "cust-8",
    name: "Kevin Fernando",
    email: "kevin@example.com",
    role: "customer",
    phone: "+94 77 890 1234",
    nic: "967890123V",
    createdAt: "2024-05-15T09:40:00Z",
  },

  // Agents
  {
    _id: "agent-1",
    name: "Alex Mercer",
    email: "agent.alex@solace.com",
    role: "agent",
    phone: "+94 11 234 5678",
    nic: "852345678V",
    createdAt: "2023-11-01T08:00:00Z",
  },
  {
    _id: "agent-2",
    name: "Maya Lin",
    email: "agent.maya@solace.com",
    role: "agent",
    phone: "+94 11 345 6789",
    nic: "873456789V",
    createdAt: "2023-12-15T09:00:00Z",
  },
  {
    _id: "agent-3",
    name: "Tariq Al-Mansoor",
    email: "agent.tariq@solace.com",
    role: "agent",
    phone: "+94 11 456 7890",
    nic: "844567890V",
    createdAt: "2024-01-10T10:30:00Z",
  },

  // Adjusters (Levels 1, 2, 3 for MAC access control testing)
  {
    _id: "adj-1",
    name: "Liam Brooks",
    email: "adjuster.liam@solace.com",
    role: "adjuster",
    clearance: 1, // Level 1 - Standard only
    phone: "+94 11 567 8901",
    nic: "935678901V",
    createdAt: "2023-09-01T08:30:00Z",
  },
  {
    _id: "adj-2",
    name: "Samantha Vance",
    email: "adjuster.samantha@solace.com",
    role: "adjuster",
    clearance: 2, // Level 2 - Standard & Confidential
    phone: "+94 11 678 9012",
    nic: "866789012V",
    createdAt: "2023-08-15T09:00:00Z",
  },
  {
    _id: "adj-3",
    name: "Jonathan Sterling",
    email: "adjuster.jonathan@solace.com",
    role: "adjuster",
    clearance: 3, // Level 3 - Lead Adjuster (Restricted, Confidential, Standard)
    phone: "+94 11 789 0123",
    nic: "817890123V",
    createdAt: "2023-05-01T08:00:00Z",
  },
  {
    _id: "adj-4",
    name: "Rachel Green",
    email: "adjuster.rachel@solace.com",
    role: "adjuster",
    clearance: 2,
    phone: "+94 11 890 1234",
    nic: "888901234V",
    createdAt: "2023-10-10T11:00:00Z",
  },
];

export const INITIAL_POLICIES: Policy[] = [
  // Priya's Policies (exact match with reference image: 320k + 120k + 102k = 542k)
  {
    _id: "pol-1",
    policyNumber: "HI-2873",
    type: "home",
    customerId: "cust-1",
    agentId: "agent-1",
    coverage: { amount: 320000, deductible: 2500 },
    premium: { amount: 4800, frequency: "monthly" },
    renewalDate: "2026-08-01T00:00:00Z",
    status: "active",
    details: {
      type: "home",
      home: {
        propertyAddress: "142 Lake View Way, Colombo 07",
        propertyValue: 45000000,
        constructionYear: 2018,
      },
    },
    sharedWith: [
      {
        userId: "cust-2",
        userEmail: "marcus@example.com",
        userName: "Marcus Chen",
        grantedAt: "2025-01-10T10:00:00Z",
        permission: "read",
      },
    ],
  },
  {
    _id: "pol-2",
    policyNumber: "CI-6391",
    type: "motor",
    customerId: "cust-1",
    agentId: "agent-1",
    coverage: { amount: 120000, deductible: 1000 },
    premium: { amount: 2500, frequency: "monthly" },
    renewalDate: "2026-05-12T00:00:00Z",
    status: "active",
    details: {
      type: "motor",
      motor: {
        make: "Toyota",
        model: "RAV4 Hybrid",
        registrationNumber: "WP CAB-4892",
        manufactureYear: 2022,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-3",
    policyNumber: "HE-5520",
    type: "health",
    customerId: "cust-1",
    agentId: "agent-2",
    coverage: { amount: 102000, deductible: 500 },
    premium: { amount: 3200, frequency: "monthly" },
    renewalDate: "2026-06-18T00:00:00Z",
    status: "active",
    details: {
      type: "health",
      health: {
        dependents: ["Aarav Sharma"],
        network: "Comprehensive",
        roomType: "Private",
      },
    },
    sharedWith: [],
  },

  // Marcus's Policies (cust-2)
  {
    _id: "pol-4",
    policyNumber: "MO-9011",
    type: "motor",
    customerId: "cust-2",
    agentId: "agent-1",
    coverage: { amount: 180000, deductible: 1500 },
    premium: { amount: 3500, frequency: "monthly" },
    renewalDate: "2026-11-20T00:00:00Z",
    status: "active",
    details: {
      type: "motor",
      motor: {
        make: "Tesla",
        model: "Model 3 Long Range",
        registrationNumber: "WP CAD-1102",
        manufactureYear: 2023,
      },
    },
    sharedWith: [
      {
        userId: "cust-1",
        userEmail: "priya@example.com",
        userName: "Priya Sharma",
        grantedAt: "2025-02-01T14:30:00Z",
        permission: "read",
      },
    ],
  },
  {
    _id: "pol-5",
    policyNumber: "TR-4022",
    type: "travel",
    customerId: "cust-2",
    agentId: "agent-3",
    coverage: { amount: 50000, deductible: 250 },
    premium: { amount: 1200, frequency: "quarterly" },
    renewalDate: "2026-07-15T00:00:00Z",
    status: "active",
    details: {
      type: "travel",
      travel: {
        destination: "Japan & South Korea",
        departureDate: "2026-10-01T00:00:00Z",
        returnDate: "2026-10-21T00:00:00Z",
        travellersCount: 2,
      },
    },
    sharedWith: [],
  },

  // Ananya's Policies (cust-3)
  {
    _id: "pol-6",
    policyNumber: "HO-3310",
    type: "home",
    customerId: "cust-3",
    agentId: "agent-2",
    coverage: { amount: 280000, deductible: 2000 },
    premium: { amount: 3900, frequency: "monthly" },
    renewalDate: "2026-09-14T00:00:00Z",
    status: "active",
    details: {
      type: "home",
      home: {
        propertyAddress: "88 Flower Road, Colombo 03",
        propertyValue: 38000000,
        constructionYear: 2020,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-7",
    policyNumber: "HE-7711",
    type: "health",
    customerId: "cust-3",
    agentId: "agent-2",
    coverage: { amount: 150000, deductible: 500 },
    premium: { amount: 4100, frequency: "monthly" },
    renewalDate: "2026-12-05T00:00:00Z",
    status: "active",
    details: {
      type: "health",
      health: {
        dependents: ["Siddharth Patel", "Meera Patel"],
        network: "Global",
        roomType: "Deluxe",
      },
    },
    sharedWith: [],
  },

  // Rohan's Policies (cust-4)
  {
    _id: "pol-8",
    policyNumber: "MO-1189",
    type: "motor",
    customerId: "cust-4",
    agentId: "agent-1",
    coverage: { amount: 95000, deductible: 1000 },
    premium: { amount: 1900, frequency: "monthly" },
    renewalDate: "2026-06-30T00:00:00Z",
    status: "active",
    details: {
      type: "motor",
      motor: {
        make: "Honda",
        model: "Civic RS",
        registrationNumber: "WP WP-9921",
        manufactureYear: 2021,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-9",
    policyNumber: "TR-8823",
    type: "travel",
    customerId: "cust-4",
    agentId: "agent-3",
    coverage: { amount: 40000, deductible: 200 },
    premium: { amount: 850, frequency: "quarterly" },
    renewalDate: "2026-04-10T00:00:00Z",
    status: "active",
    details: {
      type: "travel",
      travel: {
        destination: "United Kingdom",
        departureDate: "2026-05-01T00:00:00Z",
        returnDate: "2026-05-18T00:00:00Z",
        travellersCount: 1,
      },
    },
    sharedWith: [],
  },

  // Elena's Policies (cust-5)
  {
    _id: "pol-10",
    policyNumber: "HO-6612",
    type: "home",
    customerId: "cust-5",
    agentId: "agent-3",
    coverage: { amount: 450000, deductible: 3000 },
    premium: { amount: 6200, frequency: "monthly" },
    renewalDate: "2026-10-18T00:00:00Z",
    status: "active",
    details: {
      type: "home",
      home: {
        propertyAddress: "12 Marina Boulevard, Galle Fort",
        propertyValue: 65000000,
        constructionYear: 2017,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-11",
    policyNumber: "HE-9022",
    type: "health",
    customerId: "cust-5",
    agentId: "agent-2",
    coverage: { amount: 200000, deductible: 1000 },
    premium: { amount: 5500, frequency: "monthly" },
    renewalDate: "2026-07-22T00:00:00Z",
    status: "active",
    details: {
      type: "health",
      health: {
        dependents: ["Mateo Rodriguez"],
        network: "Global",
        roomType: "Deluxe",
      },
    },
    sharedWith: [],
  },

  // David's Policies (cust-6)
  {
    _id: "pol-12",
    policyNumber: "MO-4478",
    type: "motor",
    customerId: "cust-6",
    agentId: "agent-1",
    coverage: { amount: 135000, deductible: 1200 },
    premium: { amount: 2800, frequency: "monthly" },
    renewalDate: "2026-05-28T00:00:00Z",
    status: "active",
    details: {
      type: "motor",
      motor: {
        make: "Hyundai",
        model: "Tucson Turbo",
        registrationNumber: "WP CAR-5501",
        manufactureYear: 2022,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-13",
    policyNumber: "TR-1200",
    type: "travel",
    customerId: "cust-6",
    agentId: "agent-3",
    coverage: { amount: 60000, deductible: 300 },
    premium: { amount: 1400, frequency: "quarterly" },
    renewalDate: "2026-08-30T00:00:00Z",
    status: "active",
    details: {
      type: "travel",
      travel: {
        destination: "Australia & New Zealand",
        departureDate: "2026-09-10T00:00:00Z",
        returnDate: "2026-10-02T00:00:00Z",
        travellersCount: 3,
      },
    },
    sharedWith: [],
  },

  // Sarah's Policies (cust-7)
  {
    _id: "pol-14",
    policyNumber: "HO-9910",
    type: "home",
    customerId: "cust-7",
    agentId: "agent-2",
    coverage: { amount: 310000, deductible: 2000 },
    premium: { amount: 4300, frequency: "monthly" },
    renewalDate: "2026-11-08T00:00:00Z",
    status: "active",
    details: {
      type: "home",
      home: {
        propertyAddress: "45 Havelock Road, Colombo 05",
        propertyValue: 42000000,
        constructionYear: 2019,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-15",
    policyNumber: "HE-3419",
    type: "health",
    customerId: "cust-7",
    agentId: "agent-1",
    coverage: { amount: 90000, deductible: 500 },
    premium: { amount: 2600, frequency: "monthly" },
    renewalDate: "2026-04-20T00:00:00Z",
    status: "active",
    details: {
      type: "health",
      health: {
        dependents: [],
        network: "Standard",
        roomType: "Semi-Private",
      },
    },
    sharedWith: [],
  },

  // Kevin's Policies (cust-8)
  {
    _id: "pol-16",
    policyNumber: "MO-7734",
    type: "motor",
    customerId: "cust-8",
    agentId: "agent-2",
    coverage: { amount: 160000, deductible: 1500 },
    premium: { amount: 3100, frequency: "monthly" },
    renewalDate: "2026-06-12T00:00:00Z",
    status: "active",
    details: {
      type: "motor",
      motor: {
        make: "Nissan",
        model: "X-Trail e-POWER",
        registrationNumber: "WP CAE-7734",
        manufactureYear: 2023,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-17",
    policyNumber: "TR-5541",
    type: "travel",
    customerId: "cust-8",
    agentId: "agent-3",
    coverage: { amount: 35000, deductible: 200 },
    premium: { amount: 750, frequency: "quarterly" },
    renewalDate: "2026-05-05T00:00:00Z",
    status: "active",
    details: {
      type: "travel",
      travel: {
        destination: "Singapore & Malaysia",
        departureDate: "2026-06-01T00:00:00Z",
        returnDate: "2026-06-10T00:00:00Z",
        travellersCount: 2,
      },
    },
    sharedWith: [],
  },

  // Additional policies across types and statuses (expired, cancelled, active) for rich list & agent portfolio
  {
    _id: "pol-18",
    policyNumber: "MO-1022",
    type: "motor",
    customerId: "cust-1",
    agentId: "agent-1",
    coverage: { amount: 80000, deductible: 1000 },
    premium: { amount: 1800, frequency: "monthly" },
    renewalDate: "2025-01-10T00:00:00Z",
    status: "expired",
    details: {
      type: "motor",
      motor: {
        make: "Toyota",
        model: "Yaris",
        registrationNumber: "WP CAR-2110",
        manufactureYear: 2017,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-19",
    policyNumber: "TR-9901",
    type: "travel",
    customerId: "cust-1",
    agentId: "agent-2",
    coverage: { amount: 45000, deductible: 200 },
    premium: { amount: 950, frequency: "quarterly" },
    renewalDate: "2024-12-15T00:00:00Z",
    status: "expired",
    details: {
      type: "travel",
      travel: {
        destination: "Switzerland & France",
        departureDate: "2024-11-01T00:00:00Z",
        returnDate: "2024-11-15T00:00:00Z",
        travellersCount: 2,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-20",
    policyNumber: "HO-1190",
    type: "home",
    customerId: "cust-2",
    agentId: "agent-1",
    coverage: { amount: 210000, deductible: 1800 },
    premium: { amount: 3100, frequency: "monthly" },
    renewalDate: "2025-06-15T00:00:00Z",
    status: "cancelled",
    details: {
      type: "home",
      home: {
        propertyAddress: "22 Barnes Place, Colombo 07",
        propertyValue: 28000000,
        constructionYear: 2014,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-21",
    policyNumber: "HE-6601",
    type: "health",
    customerId: "cust-4",
    agentId: "agent-2",
    coverage: { amount: 110000, deductible: 600 },
    premium: { amount: 2900, frequency: "monthly" },
    renewalDate: "2026-08-11T00:00:00Z",
    status: "active",
    details: {
      type: "health",
      health: {
        dependents: ["Nethmi Silva"],
        network: "Comprehensive",
        roomType: "Private",
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-22",
    policyNumber: "MO-8812",
    type: "motor",
    customerId: "cust-3",
    agentId: "agent-3",
    coverage: { amount: 140000, deductible: 1200 },
    premium: { amount: 2700, frequency: "monthly" },
    renewalDate: "2026-09-01T00:00:00Z",
    status: "active",
    details: {
      type: "motor",
      motor: {
        make: "Audi",
        model: "A4 TFSI",
        registrationNumber: "WP CAD-8812",
        manufactureYear: 2021,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-23",
    policyNumber: "HO-5544",
    type: "home",
    customerId: "cust-6",
    agentId: "agent-2",
    coverage: { amount: 390000, deductible: 2500 },
    premium: { amount: 5200, frequency: "monthly" },
    renewalDate: "2026-10-30T00:00:00Z",
    status: "active",
    details: {
      type: "home",
      home: {
        propertyAddress: "77 Dharmapala Mawatha, Colombo 03",
        propertyValue: 52000000,
        constructionYear: 2016,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-24",
    policyNumber: "TR-7720",
    type: "travel",
    customerId: "cust-7",
    agentId: "agent-1",
    coverage: { amount: 55000, deductible: 250 },
    premium: { amount: 1100, frequency: "quarterly" },
    renewalDate: "2026-07-04T00:00:00Z",
    status: "active",
    details: {
      type: "travel",
      travel: {
        destination: "Dubai & Qatar",
        departureDate: "2026-08-10T00:00:00Z",
        returnDate: "2026-08-20T00:00:00Z",
        travellersCount: 2,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-25",
    policyNumber: "HE-1144",
    type: "health",
    customerId: "cust-8",
    agentId: "agent-3",
    coverage: { amount: 125000, deductible: 500 },
    premium: { amount: 3300, frequency: "monthly" },
    renewalDate: "2026-11-15T00:00:00Z",
    status: "active",
    details: {
      type: "health",
      health: {
        dependents: ["Kavindi Fernando"],
        network: "Comprehensive",
        roomType: "Private",
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-26",
    policyNumber: "MO-3390",
    type: "motor",
    customerId: "cust-5",
    agentId: "agent-1",
    coverage: { amount: 175000, deductible: 1500 },
    premium: { amount: 3600, frequency: "monthly" },
    renewalDate: "2026-12-10T00:00:00Z",
    status: "active",
    details: {
      type: "motor",
      motor: {
        make: "BMW",
        model: "320i M Sport",
        registrationNumber: "WP CAB-3390",
        manufactureYear: 2022,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-27",
    policyNumber: "HO-8899",
    type: "home",
    customerId: "cust-4",
    agentId: "agent-2",
    coverage: { amount: 340000, deductible: 2200 },
    premium: { amount: 4600, frequency: "monthly" },
    renewalDate: "2026-08-25T00:00:00Z",
    status: "active",
    details: {
      type: "home",
      home: {
        propertyAddress: "109 Kynsey Road, Colombo 08",
        propertyValue: 46000000,
        constructionYear: 2019,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-28",
    policyNumber: "TR-3321",
    type: "travel",
    customerId: "cust-3",
    agentId: "agent-1",
    coverage: { amount: 48000, deductible: 200 },
    premium: { amount: 980, frequency: "quarterly" },
    renewalDate: "2026-06-25T00:00:00Z",
    status: "active",
    details: {
      type: "travel",
      travel: {
        destination: "Canada & US West Coast",
        departureDate: "2026-07-01T00:00:00Z",
        returnDate: "2026-07-22T00:00:00Z",
        travellersCount: 2,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-29",
    policyNumber: "MO-9900",
    type: "motor",
    customerId: "cust-7",
    agentId: "agent-3",
    coverage: { amount: 110000, deductible: 1000 },
    premium: { amount: 2200, frequency: "monthly" },
    renewalDate: "2025-02-14T00:00:00Z",
    status: "expired",
    details: {
      type: "motor",
      motor: {
        make: "Kia",
        model: "Sportage AWD",
        registrationNumber: "WP WP-7729",
        manufactureYear: 2018,
      },
    },
    sharedWith: [],
  },
  {
    _id: "pol-30",
    policyNumber: "HE-4481",
    type: "health",
    customerId: "cust-6",
    agentId: "agent-2",
    coverage: { amount: 130000, deductible: 600 },
    premium: { amount: 3400, frequency: "monthly" },
    renewalDate: "2026-09-18T00:00:00Z",
    status: "active",
    details: {
      type: "health",
      health: {
        dependents: ["Min-seo Kim"],
        network: "Comprehensive",
        roomType: "Private",
      },
    },
    sharedWith: [],
  },
];

export const INITIAL_CLAIMS: Claim[] = [
  // Claim 1: Priya's active claim (matching reference UI: Claim Submitted Apr 21, 2025 -> Under Review Apr 22, 2025)
  {
    _id: "clm-1",
    claimNumber: "CLM-2025-8841",
    policyId: "pol-2", // Car Insurance CI-6391
    customerId: "cust-1",
    incident: {
      date: "2025-04-20T14:30:00Z",
      location: "Duplication Road, Colombo 03",
      description:
        "Low-speed collision at intersection during light rain. Front bumper and right headlight damaged by reversing delivery van.",
    },
    claimedAmount: 18500,
    classification: "standard",
    documents: [
      {
        id: "doc-1",
        fileName: "police_report_wp_4892.pdf",
        url: "/documents/police_report_wp_4892.pdf",
        type: "application/pdf",
        uploadedAt: "2025-04-21T09:15:00Z",
        fileSize: "1.4 MB",
      },
      {
        id: "doc-2",
        fileName: "front_bumper_damage.jpg",
        url: "/documents/front_bumper_damage.jpg",
        type: "image/jpeg",
        uploadedAt: "2025-04-21T09:16:00Z",
        fileSize: "2.8 MB",
      },
    ],
    adjusterNotes: [
      {
        id: "not-1",
        adjusterId: "adj-1",
        adjusterName: "Liam Brooks",
        note: "Initial assessment confirmed bumper clip fracture and headlight assembly cracked. Authorized repair estimate received.",
        createdAt: "2025-04-22T11:00:00Z",
      },
    ],
    statusHistory: [
      {
        status: "Pending",
        by: "Priya Sharma",
        byRole: "customer",
        at: "2025-04-21T09:20:00Z",
        comment: "Claim submitted via online portal with photo evidence.",
      },
      {
        status: "Under Review",
        by: "Liam Brooks",
        byRole: "adjuster",
        at: "2025-04-22T10:45:00Z",
        comment: "Claim assigned and assigned to technical appraisal team.",
      },
    ],
    currentStatus: "Under Review",
    createdAt: "2025-04-21T09:20:00Z",
  },

  // Claim 2: Priya's Info Requested Claim (allows customer to respond)
  {
    _id: "clm-2",
    claimNumber: "CLM-2025-8850",
    policyId: "pol-1", // Home Insurance HI-2873
    customerId: "cust-1",
    incident: {
      date: "2025-03-15T08:00:00Z",
      location: "142 Lake View Way, Colombo 07",
      description:
        "Water leak from second floor plumbing manifold causing ceiling plaster damage in ground floor dining room.",
    },
    claimedAmount: 42000,
    classification: "standard",
    documents: [
      {
        id: "doc-3",
        fileName: "plumbing_repair_receipt.pdf",
        url: "/documents/plumbing_repair_receipt.pdf",
        type: "application/pdf",
        uploadedAt: "2025-03-16T10:00:00Z",
        fileSize: "850 KB",
      },
    ],
    adjusterNotes: [
      {
        id: "not-2",
        adjusterId: "adj-2",
        adjusterName: "Samantha Vance",
        note: "Plumber invoice attached only covers immediate shutoff. Please supply contractor quotation for ceiling repainting and structural check.",
        createdAt: "2025-03-18T14:30:00Z",
      },
    ],
    statusHistory: [
      {
        status: "Pending",
        by: "Priya Sharma",
        byRole: "customer",
        at: "2025-03-16T10:05:00Z",
        comment: "Emergency plumbing claim filed.",
      },
      {
        status: "Under Review",
        by: "Samantha Vance",
        byRole: "adjuster",
        at: "2025-03-17T09:15:00Z",
        comment: "Reviewing water damage scope.",
      },
      {
        status: "Info Requested",
        by: "Samantha Vance",
        byRole: "adjuster",
        at: "2025-03-18T14:30:00Z",
        comment:
          "Please upload contractor restoration quotation and itemized bill for ceiling repairs.",
      },
    ],
    currentStatus: "Info Requested",
    createdAt: "2025-03-16T10:05:00Z",
  },

  // Claim 3: Priya's Paid Claim (demonstrates payments view and paid timeline)
  {
    _id: "clm-3",
    claimNumber: "CLM-2025-7201",
    policyId: "pol-3", // Health Insurance HE-5520
    customerId: "cust-1",
    incident: {
      date: "2025-01-10T16:00:00Z",
      location: "Asiri Central Hospital, Colombo",
      description:
        "Day surgery for dependent tonsillectomy following recurrent infection diagnosis.",
    },
    claimedAmount: 28000,
    classification: "standard",
    documents: [
      {
        id: "doc-4",
        fileName: "hospital_discharge_summary.pdf",
        url: "/documents/hospital_discharge_summary.pdf",
        type: "application/pdf",
        uploadedAt: "2025-01-12T14:00:00Z",
        fileSize: "1.9 MB",
      },
    ],
    adjusterNotes: [
      {
        id: "not-3",
        adjusterId: "adj-1",
        adjusterName: "Liam Brooks",
        note: "Medical records verified against pre-authorization code HA-992. In-network tariff applied.",
        createdAt: "2025-01-14T11:20:00Z",
      },
    ],
    statusHistory: [
      {
        status: "Pending",
        by: "Priya Sharma",
        byRole: "customer",
        at: "2025-01-12T14:10:00Z",
      },
      {
        status: "Under Review",
        by: "Liam Brooks",
        byRole: "adjuster",
        at: "2025-01-13T10:00:00Z",
      },
      {
        status: "Approved",
        by: "Liam Brooks",
        byRole: "adjuster",
        at: "2025-01-14T15:00:00Z",
        comment: "Eligible claim approved for full direct settlement minus deductible.",
      },
      {
        status: "Paid",
        by: "Liam Brooks",
        byRole: "adjuster",
        at: "2025-01-15T09:30:00Z",
        comment: "Disbursement completed via Direct Deposit.",
      },
    ],
    currentStatus: "Paid",
    createdAt: "2025-01-12T14:10:00Z",
  },

  // Claim 4: Confidential Claim (Clearance Level >= 2 required)
  {
    _id: "clm-4",
    claimNumber: "CLM-2025-9104",
    policyId: "pol-10", // Elena Rodriguez Home HO-6612
    customerId: "cust-5",
    incident: {
      date: "2025-04-12T02:00:00Z",
      location: "12 Marina Boulevard, Galle Fort",
      description:
        "High-value art piece and antique safe broken during forced entry. Forensic evaluation requested.",
    },
    claimedAmount: 180000,
    classification: "confidential",
    documents: [
      {
        id: "doc-5",
        fileName: "police_crime_scene_report.pdf",
        url: "/documents/police_crime_scene_report.pdf",
        type: "application/pdf",
        uploadedAt: "2025-04-13T12:00:00Z",
        fileSize: "3.2 MB",
      },
    ],
    adjusterNotes: [
      {
        id: "not-4",
        adjusterId: "adj-2",
        adjusterName: "Samantha Vance",
        note: "Confidential appraisal report pending from Christie's certified valuer.",
        createdAt: "2025-04-14T16:00:00Z",
      },
    ],
    statusHistory: [
      {
        status: "Pending",
        by: "Elena Rodriguez",
        byRole: "customer",
        at: "2025-04-13T12:10:00Z",
      },
      {
        status: "Under Review",
        by: "Samantha Vance",
        byRole: "adjuster",
        at: "2025-04-14T10:00:00Z",
      },
    ],
    currentStatus: "Under Review",
    createdAt: "2025-04-13T12:10:00Z",
  },

  // Claim 5: Restricted Claim (Clearance Level >= 3 required - Jonathan Sterling only)
  {
    _id: "clm-5",
    claimNumber: "CLM-2025-9999",
    policyId: "pol-4", // Marcus Chen Motor MO-9011
    customerId: "cust-2",
    incident: {
      date: "2025-04-18T23:15:00Z",
      location: "Southern Expressway Toll Plaza",
      description:
        "Suspected staged multi-vehicle incident under special fraud investigation department scrutiny.",
    },
    claimedAmount: 160000,
    classification: "restricted",
    documents: [
      {
        id: "doc-6",
        fileName: "telematics_log_restricted.pdf",
        url: "/documents/telematics_log_restricted.pdf",
        type: "application/pdf",
        uploadedAt: "2025-04-19T08:00:00Z",
        fileSize: "4.5 MB",
      },
    ],
    adjusterNotes: [
      {
        id: "not-5",
        adjusterId: "adj-3",
        adjusterName: "Jonathan Sterling",
        note: "Restricted forensic audit: ECU sensor data mismatches statement. Level 3 clearance signoff mandatory.",
        createdAt: "2025-04-20T11:00:00Z",
      },
    ],
    statusHistory: [
      {
        status: "Pending",
        by: "Marcus Chen",
        byRole: "customer",
        at: "2025-04-19T08:05:00Z",
      },
      {
        status: "Under Review",
        by: "Jonathan Sterling",
        byRole: "adjuster",
        at: "2025-04-20T09:30:00Z",
      },
    ],
    currentStatus: "Under Review",
    createdAt: "2025-04-19T08:05:00Z",
  },

  // Claim 6: Approved Claim ready for payment recording
  {
    _id: "clm-6",
    claimNumber: "CLM-2025-8310",
    policyId: "pol-5", // Marcus Chen Travel TR-4022
    customerId: "cust-2",
    incident: {
      date: "2025-03-28T19:00:00Z",
      location: "Tokyo Narita Airport",
      description:
        "Luggage delayed by airline exceeding 48 hours; emergency essential apparel and medication purchased.",
    },
    claimedAmount: 3200,
    classification: "standard",
    documents: [
      {
        id: "doc-7",
        fileName: "airline_pir_receipts.pdf",
        url: "/documents/airline_pir_receipts.pdf",
        type: "application/pdf",
        uploadedAt: "2025-03-30T10:00:00Z",
        fileSize: "1.1 MB",
      },
    ],
    adjusterNotes: [
      {
        id: "not-6",
        adjusterId: "adj-1",
        adjusterName: "Liam Brooks",
        note: "PIR report confirmed delay over 48h. Receipts within policy travel delay allowance limit.",
        createdAt: "2025-04-02T14:00:00Z",
      },
    ],
    statusHistory: [
      {
        status: "Pending",
        by: "Marcus Chen",
        byRole: "customer",
        at: "2025-03-30T10:05:00Z",
      },
      {
        status: "Under Review",
        by: "Liam Brooks",
        byRole: "adjuster",
        at: "2025-04-01T09:00:00Z",
      },
      {
        status: "Approved",
        by: "Liam Brooks",
        byRole: "adjuster",
        at: "2025-04-02T14:15:00Z",
        comment: "Approved for payout of $2,950 net of $250 deductible.",
      },
    ],
    currentStatus: "Approved",
    createdAt: "2025-03-30T10:05:00Z",
  },

  // Claim 7: Rejected claim
  {
    _id: "clm-7",
    claimNumber: "CLM-2025-7809",
    policyId: "pol-8", // Rohan Silva Motor MO-1189
    customerId: "cust-4",
    incident: {
      date: "2025-02-14T21:00:00Z",
      location: "Kandy Road, Kadawatha",
      description: "Engine oil sump cracked over unpaved road. Water ingress into crankcase.",
    },
    claimedAmount: 65000,
    classification: "standard",
    documents: [],
    adjusterNotes: [
      {
        id: "not-7",
        adjusterId: "adj-2",
        adjusterName: "Samantha Vance",
        note: "Mechanical breakdown and consequential hydrostatic engine damage is specifically excluded under Section 4(c) of policy.",
        createdAt: "2025-02-20T10:00:00Z",
      },
    ],
    statusHistory: [
      {
        status: "Pending",
        by: "Rohan Silva",
        byRole: "customer",
        at: "2025-02-15T09:00:00Z",
      },
      {
        status: "Under Review",
        by: "Samantha Vance",
        byRole: "adjuster",
        at: "2025-02-17T11:00:00Z",
      },
      {
        status: "Rejected",
        by: "Samantha Vance",
        byRole: "adjuster",
        at: "2025-02-20T10:15:00Z",
        comment: "Denied per Section 4(c) consequential mechanical engine damage exclusion.",
      },
    ],
    currentStatus: "Rejected",
    createdAt: "2025-02-15T09:00:00Z",
  },

  // Additional claims to reach ~40 claims across all statuses and types for rich adjuster queue and analytics
  ...generateAdditionalClaims(),
];

function generateAdditionalClaims(): Claim[] {
  const statuses: ClaimStatus[] = [
    "Pending",
    "Under Review",
    "Info Requested",
    "Approved",
    "Rejected",
    "Paid",
  ];
  const claims: Claim[] = [];

  const policiesList = [
    { id: "pol-6", custId: "cust-3", amount: 15000, desc: "Roof tile displacement in heavy monsoon storm" },
    { id: "pol-7", custId: "cust-3", amount: 32000, desc: "Dental emergency surgery during sports event" },
    { id: "pol-8", custId: "cust-4", amount: 24000, desc: "Side mirror and driver door scratch in supermarket parking" },
    { id: "pol-9", custId: "cust-4", amount: 5500, desc: "Trip interruption due to airline strike in Heathrow" },
    { id: "pol-10", custId: "cust-5", amount: 75000, desc: "Lightning strike damaged HVAC control board" },
    { id: "pol-11", custId: "cust-5", amount: 48000, desc: "Specialist consultation and MRI for lumbar spine" },
    { id: "pol-12", custId: "cust-6", amount: 31000, desc: "Windshield crack from highway gravel projection" },
    { id: "pol-13", custId: "cust-6", amount: 8200, desc: "Missed connecting flight in Sydney" },
    { id: "pol-14", custId: "cust-7", amount: 62000, desc: "Kitchen electrical fire contained by hood system" },
    { id: "pol-15", custId: "cust-7", amount: 14000, desc: "Physiotherapy course following ankle sprain" },
    { id: "pol-16", custId: "cust-8", amount: 41000, desc: "Rear fender dent from parallel parking collision" },
    { id: "pol-17", custId: "cust-8", amount: 6800, desc: "Lost passport and travel documentation replacement costs" },
    { id: "pol-21", custId: "cust-4", amount: 29000, desc: "Orthopedic consultation and rehabilitation sessions" },
    { id: "pol-22", custId: "cust-3", amount: 38000, desc: "Alloy wheel rim replacement after pothole impact" },
    { id: "pol-23", custId: "cust-6", amount: 95000, desc: "Basement perimeter damp proofing breach during flash floods" },
    { id: "pol-24", custId: "cust-7", amount: 12000, desc: "Medical expenses for acute bronchitis abroad" },
    { id: "pol-25", custId: "cust-8", amount: 34000, desc: "In-patient laparoscopic appendectomy procedure" },
    { id: "pol-26", custId: "cust-5", amount: 52000, desc: "Front bumper and parking sensor re-calibration" },
    { id: "pol-27", custId: "cust-4", amount: 84000, desc: "Boundary wall collapsed due to adjacent excavation" },
    { id: "pol-28", custId: "cust-3", amount: 7100, desc: "Emergency dental treatment during transit in Vancouver" },
    { id: "pol-30", custId: "cust-6", amount: 44000, desc: "Cardiology diagnostics and treadmill stress monitoring" },
    { id: "pol-1", custId: "cust-1", amount: 19500, desc: "Solar inverter power surge failure following storm" },
    { id: "pol-2", custId: "cust-1", amount: 11000, desc: "Side window replacement after break-in attempt" },
    { id: "pol-4", custId: "cust-2", amount: 22000, desc: "Paintwork scratch repair on rear quarter panel" },
    { id: "pol-6", custId: "cust-3", amount: 47000, desc: "Internal drain blockage backup causing floor tile warping" },
    { id: "pol-8", custId: "cust-4", amount: 16500, desc: "Tail light assembly replacement after reversing incident" },
    { id: "pol-10", custId: "cust-5", amount: 110000, desc: "High-value garden pavilion wooden structure wind damage" },
    { id: "pol-12", custId: "cust-6", amount: 27000, desc: "Alternator and battery voltage regulator burn" },
    { id: "pol-14", custId: "cust-7", amount: 36000, desc: "Boundary security gate motor mechanical failure" },
    { id: "pol-16", custId: "cust-8", amount: 21500, desc: "Door panel dent removal and paint touch-up" },
    { id: "pol-22", custId: "cust-3", amount: 64000, desc: "Suspension arm and bushing replacement after curb impact" },
    { id: "pol-23", custId: "cust-6", amount: 135000, desc: "Second floor balcony glass balustrade shattered in storm" },
    { id: "pol-26", custId: "cust-5", amount: 145000, desc: "Side door panel, mirror and camera harness replacement" },
  ];

  policiesList.forEach((item, index) => {
    const claimNum = 8860 + index;
    const stIndex = index % statuses.length;
    const st = statuses[stIndex];
    let classif: Classification = "standard";
    if (item.amount > 60000) {
      classif = "confidential";
    }
    if (index % 11 === 0 || item.amount > 120000) {
      classif = "restricted";
    }

    const monthNum = (index % 5) + 1;
    const dayNum = (index % 25) + 1;
    const dateStr = `2025-0${monthNum}-${dayNum < 10 ? "0" + dayNum : dayNum}T10:00:00Z`;

    const hist: StatusHistoryItem[] = [
      {
        status: "Pending" as ClaimStatus,
        by: "Customer",
        byRole: "customer" as Role,
        at: dateStr,
      },
    ];

    if (st !== "Pending") {
      hist.push({
        status: "Under Review" as ClaimStatus,
        by: "Samantha Vance",
        byRole: "adjuster" as Role,
        at: `2025-0${monthNum}-${Math.min(dayNum + 1, 28)}T14:00:00Z`,
      });
    }

    if (st === "Info Requested") {
      hist.push({
        status: "Info Requested" as ClaimStatus,
        by: "Samantha Vance",
        byRole: "adjuster" as Role,
        at: `2025-0${monthNum}-${Math.min(dayNum + 2, 28)}T15:00:00Z`,
        comment: "Additional invoices and certified mechanics estimate required.",
      });
    }

    if (st === "Approved" || st === "Paid") {
      hist.push({
        status: "Approved" as ClaimStatus,
        by: "Liam Brooks",
        byRole: "adjuster" as Role,
        at: `2025-0${monthNum}-${Math.min(dayNum + 2, 28)}T16:00:00Z`,
        comment: "Coverage confirmed and approved per policy terms.",
      });
    }

    if (st === "Paid") {
      hist.push({
        status: "Paid" as ClaimStatus,
        by: "Liam Brooks",
        byRole: "adjuster" as Role,
        at: `2025-0${monthNum}-${Math.min(dayNum + 3, 28)}T11:00:00Z`,
        comment: "Settlement disbursed.",
      });
    }

    if (st === "Rejected") {
      hist.push({
        status: "Rejected" as ClaimStatus,
        by: "Samantha Vance",
        byRole: "adjuster" as Role,
        at: `2025-0${monthNum}-${Math.min(dayNum + 2, 28)}T15:30:00Z`,
        comment: "Non-covered incident type.",
      });
    }

    claims.push({
      _id: `clm-${index + 8}`,
      claimNumber: `CLM-2025-${claimNum}`,
      policyId: item.id,
      customerId: item.custId,
      incident: {
        date: dateStr,
        location: "Colombo Metro Area",
        description: item.desc,
      },
      claimedAmount: item.amount,
      classification: classif,
      documents: [
        {
          id: `doc-${index + 10}`,
          fileName: `incident_record_${claimNum}.pdf`,
          url: `/documents/incident_record_${claimNum}.pdf`,
          type: "application/pdf",
          uploadedAt: dateStr,
          fileSize: "1.2 MB",
        },
      ],
      adjusterNotes: [
        {
          id: `not-${index + 10}`,
          adjusterId: "adj-1",
          adjusterName: "Liam Brooks",
          note: "Standard validation of incident documentation.",
          createdAt: dateStr,
        },
      ],
      statusHistory: hist,
      currentStatus: st,
      createdAt: dateStr,
    });
  });

  return claims;
}

export const INITIAL_PAYMENTS: Payment[] = [
  {
    _id: "pay-1",
    claimId: "clm-3",
    claimNumber: "CLM-2025-7201",
    policyNumber: "HE-5520",
    amount: 27500,
    method: "Direct Deposit",
    paidAt: "2025-01-15T09:30:00Z",
    reference: "SOL-PAY-992144",
    recordedBy: "adj-1",
    recordedByName: "Liam Brooks",
  },
  {
    _id: "pay-2",
    claimId: "clm-13",
    claimNumber: "CLM-2025-8865",
    policyNumber: "HE-9022",
    amount: 47000,
    method: "Bank Transfer",
    paidAt: "2025-02-12T14:15:00Z",
    reference: "SOL-PAY-883109",
    recordedBy: "adj-1",
    recordedByName: "Liam Brooks",
  },
  {
    _id: "pay-3",
    claimId: "clm-19",
    claimNumber: "CLM-2025-8871",
    policyNumber: "MO-1189",
    amount: 15500,
    method: "Bank Transfer",
    paidAt: "2025-03-08T11:45:00Z",
    reference: "SOL-PAY-774022",
    recordedBy: "adj-2",
    recordedByName: "Samantha Vance",
  },
  {
    _id: "pay-4",
    claimId: "clm-25",
    claimNumber: "CLM-2025-8877",
    policyNumber: "HO-3310",
    amount: 45000,
    method: "Direct Deposit",
    paidAt: "2025-04-05T16:20:00Z",
    reference: "SOL-PAY-665180",
    recordedBy: "adj-3",
    recordedByName: "Jonathan Sterling",
  },
];

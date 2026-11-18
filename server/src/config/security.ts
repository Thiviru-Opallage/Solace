export const SECURITY_CONFIG = {
  // Argon2id OWASP Recommended Parameters
  argon2: {
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
    hashLength: 32,
  },

  // Password Policy
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
  },

  // Account Lockout
  lockout: {
    maxFailedAttempts: 5,
    lockoutDurationMinutes: 15,
    lockoutDurationMs: 15 * 60 * 1000,
  },

  // Token Durations
  tokens: {
    accessTokenExpirySeconds: 15 * 60, // 15 minutes
    accessTokenExpiryString: "15m",
    refreshTokenExpirySeconds: 7 * 24 * 60 * 60, // 7 days
    refreshTokenExpiryString: "7d",
    algorithm: "HS256" as const,
    issuer: "solace:insurance:auth",
    audience: "solace:client:web",
  },

  // Cookie Settings
  cookies: {
    accessTokenName: "solace_access_token",
    refreshTokenName: "solace_refresh_token",
    csrfTokenName: "solace_csrf_token",
    sameSite: "strict" as const,
    path: "/",
  },

  // Rate Limiting & Slow Down
  rateLimits: {
    global: {
      windowMs: 15 * 60 * 1000, // 15 mins
      max: 300,
      message: "Too many requests from this IP, please try again later.",
      code: "RATE_LIMITED",
    },
    login: {
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: "Too many login attempts from this IP, please try again later.",
      code: "RATE_LIMITED_LOGIN",
    },
    loginSlowDown: {
      windowMs: 15 * 60 * 1000,
      delayAfter: 3,
      delayMs: (hits: number) => (hits - 3) * 500, // 500ms progressive delay per hit after 3
    },
    register: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
      message: "Too many registrations from this IP, please try again later.",
      code: "RATE_LIMITED_REGISTER",
    },
    refresh: {
      windowMs: 15 * 60 * 1000,
      max: 30,
      message: "Too many token refresh attempts, please try again later.",
      code: "RATE_LIMITED_REFRESH",
    },
    upload: {
      windowMs: 60 * 60 * 1000,
      max: 20,
      message: "Upload rate limit exceeded. Please wait before uploading more documents.",
      code: "RATE_LIMITED_UPLOAD",
    },
    share: {
      windowMs: 60 * 60 * 1000,
      max: 30,
      message: "Policy sharing rate limit reached. Please try again later.",
      code: "RATE_LIMITED_SHARE",
    },
    sensitiveReveal: {
      windowMs: 60 * 60 * 1000,
      max: 10,
      message: "Sensitive data reveal limit exceeded for this session.",
      code: "RATE_LIMITED_SENSITIVE",
    },
    sseConnectionsPerUser: 5,
  },

  // Document Uploads
  uploads: {
    maxFiles: 5,
    maxFileSize: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"] as const,
    allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"] as const,
  },

  // Mandatory Access Control (MAC) Classification Rules
  mac: {
    thresholds: {
      standardMaxAmount: 60000, // <= 60k LKR -> standard (Level 1)
      confidentialMaxAmount: 120000, // 60k - 120k LKR -> confidential (Level 2)
      // > 120k LKR or fraud flag -> restricted (Level 3)
    },
    levels: {
      standard: 1,
      confidential: 2,
      restricted: 3,
    } as const,
  },

  // Discretionary Access Control (DAC) Limits
  dac: {
    maxGranteesPerPolicy: 10,
  },

  // Request limits
  limits: {
    jsonBodyLimit: "100kb",
    maxSearchQueryLength: 100,
    maxPaginationLimit: 100,
    defaultPaginationLimit: 20,
  },

  // Realtime SSE
  realtime: {
    heartbeatIntervalMs: 25000, // 25s
  },
} as const;

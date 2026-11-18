import { z } from "zod";
import dotenv from "dotenv";
import path from "node:path";

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const DEFAULT_SECRETS_BLACKLIST = new Set([
  "your_minimum_32_character_random_access_secret_key_here",
  "your_minimum_32_character_random_refresh_secret_key_here",
  "your_minimum_32_character_random_csrf_secret_key_here",
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "secret",
  "changeme",
  "password12345678901234567890123456789012",
]);

const envSchema = z
  .object({
    PORT: z
      .string()
      .default("5000")
      .transform((val) => parseInt(val, 10))
      .refine((port) => port > 0 && port < 65536, "PORT must be a valid port number"),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    REPO_MODE: z.enum(["memory", "mongo"]).default("memory"),
    MONGODB_URI: z.string().default("mongodb://localhost:27017/solace"),
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, "JWT_ACCESS_SECRET must be at least 32 characters (256-bit)")
      .refine(
        (val) => !DEFAULT_SECRETS_BLACKLIST.has(val),
        "JWT_ACCESS_SECRET cannot use an insecure example or default value"
      ),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 characters (256-bit)")
      .refine(
        (val) => !DEFAULT_SECRETS_BLACKLIST.has(val),
        "JWT_REFRESH_SECRET cannot use an insecure example or default value"
      ),
    CSRF_SECRET: z
      .string()
      .min(32, "CSRF_SECRET must be at least 32 characters (256-bit)")
      .refine(
        (val) => !DEFAULT_SECRETS_BLACKLIST.has(val),
        "CSRF_SECRET cannot use an insecure example or default value"
      ),
    FIELD_ENCRYPTION_KEY: z
      .string()
      .length(64, "FIELD_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes = 256 bits)")
      .regex(/^[0-9a-fA-F]{64}$/, "FIELD_ENCRYPTION_KEY must be a valid hex string")
      .refine(
        (val) => !DEFAULT_SECRETS_BLACKLIST.has(val),
        "FIELD_ENCRYPTION_KEY cannot use an insecure example default"
      ),
    STORAGE_DIR: z.string().default("./storage"),
    TRUST_PROXY: z
      .string()
      .default("false")
      .transform((val) => {
        if (val === "true") return true;
        if (val === "false") return false;
        const num = parseInt(val, 10);
        return isNaN(num) ? false : num;
      }),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production" && data.REPO_MODE === "memory") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["REPO_MODE"],
        message: "Production environment refuses to boot with REPO_MODE=memory. REPO_MODE must be mongo in production.",
      });
    }
  });

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("FATAL: Environment configuration validation failed:");
    result.error.issues.forEach((issue) => {
      console.error(` - [${issue.path.join(".")}]: ${issue.message}`);
    });
    throw new Error(`Invalid environment configuration: ${JSON.stringify(result.error.format())}`);
  }
  return result.data;
}

export const env = loadConfig();
export type Env = z.infer<typeof envSchema>;

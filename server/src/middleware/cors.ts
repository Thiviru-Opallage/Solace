import cors from "cors";
import { env } from "../config/env.js";

const allowedOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., server-to-server or test runners)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-Request-Id",
    "Origin",
    "Accept",
    "Sec-Fetch-Site",
  ],
  exposedHeaders: ["X-Request-Id", "X-CSRF-Token"],
  maxAge: 86400, // 24 hours preflight cache
});

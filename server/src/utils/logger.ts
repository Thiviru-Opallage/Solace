import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "refreshToken",
      "cookies",
      "headers.cookie",
      "req.headers.cookie",
      "req.headers.authorization",
      "phone",
      "nic",
      "authorization",
      "secret",
      "*.password",
      "*.passwordHash",
      "*.token",
      "*.refreshToken",
      "*.phone",
      "*.nic",
    ],
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

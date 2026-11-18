import { doubleCsrf } from "csrf-csrf";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { SECURITY_CONFIG } from "../config/security.js";
import { ForbiddenError } from "../utils/errors.js";

import { getCookieNames } from "./cookies.js";

const isProduction = env.NODE_ENV === "production";
const allowedOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  getSessionIdentifier: (req: Request) => {
    const { accessCookieName } = getCookieNames();
    const cookies = req.cookies as Record<string, string> | undefined;
    return cookies?.[accessCookieName] || req.ip || "anonymous";
  },
  cookieName: isProduction
    ? `__Host-${SECURITY_CONFIG.cookies.csrfTokenName}`
    : SECURITY_CONFIG.cookies.csrfTokenName,
  cookieOptions: {
    httpOnly: true,
    sameSite: SECURITY_CONFIG.cookies.sameSite,
    secure: isProduction,
    path: SECURITY_CONFIG.cookies.path,
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getCsrfTokenFromRequest: (req: Request) => req.headers["x-csrf-token"] as string,
});

/**
 * Validates Origin and Sec-Fetch-Site headers on state-changing requests
 * as defense-in-depth alongside double-submit CSRF tokens.
 */
export function originVerificationMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const isStateChanging = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  if (!isStateChanging) {
    return next();
  }

  // 1. Check Origin header if present
  const origin = req.header("origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return next(new ForbiddenError("Request Origin header mismatch", "CSRF_ORIGIN_MISMATCH"));
  }

  // 2. Check Sec-Fetch-Site if provided by modern browsers
  const secFetchSite = req.header("sec-fetch-site");
  if (secFetchSite === "cross-site" && (!origin || !allowedOrigins.includes(origin))) {
    return next(new ForbiddenError("Cross-site request blocked by Sec-Fetch-Site policy", "CSRF_CROSS_SITE"));
  }

  next();
}

export { generateCsrfToken, doubleCsrfProtection };

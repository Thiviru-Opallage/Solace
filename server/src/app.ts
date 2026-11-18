import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { SECURITY_CONFIG } from "./config/security.js";
import { requestIdMiddleware } from "./middleware/requestId.js";
import { securityHeadersMiddleware } from "./middleware/securityHeaders.js";
import { corsMiddleware } from "./middleware/cors.js";
import { noCacheMiddleware } from "./middleware/cacheControl.js";
import { injectionPreventionMiddleware } from "./middleware/injectionPrevention.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/routes.js";
import { usersRouter } from "./modules/users/routes.js";
import { policiesRouter } from "./modules/policies/routes.js";
import { claimsRouter } from "./modules/claims/routes.js";
import { paymentsRouter } from "./modules/payments/routes.js";
import { analyticsRouter } from "./modules/analytics/routes.js";

export function createApp(): Express {
  const app = express();

  // Configure reverse proxy trust
  if (env.TRUST_PROXY !== false) {
    app.set("trust proxy", env.TRUST_PROXY);
  }

  // 1. Request ID correlation
  app.use(requestIdMiddleware);

  // 2. Security headers (Helmet strict CSP, etc.)
  app.use(securityHeadersMiddleware);

  // 3. CORS
  app.use(corsMiddleware);

  // 4. Cache-Control: no-store
  app.use(noCacheMiddleware);

  // 5. Body parser with strict limit
  app.use(express.json({ limit: SECURITY_CONFIG.limits.jsonBodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: SECURITY_CONFIG.limits.jsonBodyLimit }));

  // 6. Cookie parser (unsigned cookies)
  app.use(cookieParser());

  // 7. Injection prevention middleware
  app.use(injectionPreventionMiddleware);

  // API Route Modules
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/policies", policiesRouter);
  app.use("/api/claims", claimsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/analytics", analyticsRouter);

  // Health check endpoint
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      repoMode: env.REPO_MODE,
      environment: env.NODE_ENV,
    });
  });

  // Central error handler (must be registered last)
  app.use(errorHandler);

  return app;
}

export const app = createApp();

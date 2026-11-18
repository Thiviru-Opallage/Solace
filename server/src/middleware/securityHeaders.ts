import helmet from "helmet";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      sandbox: ["allow-forms", "allow-scripts", "allow-same-origin"],
    },
  },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "no-referrer" },
  noSniff: true,
  hsts:
    env.NODE_ENV === "production"
      ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
      : false,
  xPoweredBy: false,
});

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.removeHeader("X-Powered-By");
  helmetMiddleware(req, res, next);
}

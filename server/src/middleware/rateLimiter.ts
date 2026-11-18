import { rateLimit } from "express-rate-limit";
import { slowDown } from "express-slow-down";
import { Request, Response } from "express";
import { SECURITY_CONFIG } from "../config/security.js";

function createRateLimitHandler(code: string, message: string) {
  return (req: Request, res: Response): void => {
    res.status(429).json({
      code,
      message,
      requestId: req.id || "unknown",
    });
  };
}

export const globalRateLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimits.global.windowMs,
  max: SECURITY_CONFIG.rateLimits.global.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    SECURITY_CONFIG.rateLimits.global.code,
    SECURITY_CONFIG.rateLimits.global.message
  ),
});

export const loginRateLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimits.login.windowMs,
  max: SECURITY_CONFIG.rateLimits.login.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    SECURITY_CONFIG.rateLimits.login.code,
    SECURITY_CONFIG.rateLimits.login.message
  ),
});

export const loginSlowDown = slowDown({
  windowMs: SECURITY_CONFIG.rateLimits.loginSlowDown.windowMs,
  delayAfter: SECURITY_CONFIG.rateLimits.loginSlowDown.delayAfter,
  delayMs: SECURITY_CONFIG.rateLimits.loginSlowDown.delayMs,
});

export const registerRateLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimits.register.windowMs,
  max: SECURITY_CONFIG.rateLimits.register.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    SECURITY_CONFIG.rateLimits.register.code,
    SECURITY_CONFIG.rateLimits.register.message
  ),
});

export const refreshRateLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimits.refresh.windowMs,
  max: SECURITY_CONFIG.rateLimits.refresh.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: createRateLimitHandler(
    SECURITY_CONFIG.rateLimits.refresh.code,
    SECURITY_CONFIG.rateLimits.refresh.message
  ),
});

export const uploadRateLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimits.upload.windowMs,
  max: SECURITY_CONFIG.rateLimits.upload.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id || req.ip || "unknown",
  validate: { keyGeneratorIpFallback: false },
  handler: createRateLimitHandler(
    SECURITY_CONFIG.rateLimits.upload.code,
    SECURITY_CONFIG.rateLimits.upload.message
  ),
});

export const shareRateLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimits.share.windowMs,
  max: SECURITY_CONFIG.rateLimits.share.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id || req.ip || "unknown",
  validate: { keyGeneratorIpFallback: false },
  handler: createRateLimitHandler(
    SECURITY_CONFIG.rateLimits.share.code,
    SECURITY_CONFIG.rateLimits.share.message
  ),
});

export const sensitiveRevealRateLimiter = rateLimit({
  windowMs: SECURITY_CONFIG.rateLimits.sensitiveReveal.windowMs,
  max: SECURITY_CONFIG.rateLimits.sensitiveReveal.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id || req.ip || "unknown",
  validate: { keyGeneratorIpFallback: false },
  handler: createRateLimitHandler(
    SECURITY_CONFIG.rateLimits.sensitiveReveal.code,
    SECURITY_CONFIG.rateLimits.sensitiveReveal.message
  ),
});

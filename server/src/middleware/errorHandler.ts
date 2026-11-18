import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id || "unknown";

  // 1. Operational AppErrors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId, url: req.url, method: req.method }, err.message);
    } else {
      logger.warn({ code: err.code, message: err.message, requestId, url: req.url, method: req.method });
    }

    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
      requestId,
    });
    return;
  }

  // 2. Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedIssues = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));

    logger.warn({ issues: formattedIssues, requestId, url: req.url }, "Validation failure");

    res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Invalid input data",
      details: formattedIssues,
      requestId,
    });
    return;
  }

  // 3. JSON Syntax Errors (Malformation)
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      code: "INVALID_JSON",
      message: "Malformed JSON payload",
      requestId,
    });
    return;
  }

  // 4. CSRF Token Errors
  if (err.message.includes("CSRF") || (err as unknown as { code?: string }).code === "EBADCSRFTOKEN") {
    res.status(403).json({
      code: "CSRF_ERROR",
      message: "Invalid or missing CSRF token",
      requestId,
    });
    return;
  }

  // 5. Payload too large (Express JSON limit exceeded)
  if ((err as unknown as { type?: string }).type === "entity.too.large") {
    res.status(413).json({
      code: "PAYLOAD_TOO_LARGE",
      message: "Request payload exceeds allowed limit",
      requestId,
    });
    return;
  }

  // 6. Unknown Internal Errors
  logger.error({ err, requestId, url: req.url, method: req.method }, "Unhandled server exception");

  const isProduction = env.NODE_ENV === "production";
  res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: isProduction ? "An unexpected internal server error occurred" : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
    requestId,
  });
}

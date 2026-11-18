import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/errors.js";

const PROHIBITED_KEY_NAMES = new Set(["__proto__", "constructor", "prototype"]);

function containsProhibitedKeys(obj: unknown, depth = 0): boolean {
  if (depth > 20) {
    // Exceeded reasonable nesting depth, consider unsafe
    return true;
  }

  if (!obj || typeof obj !== "object") {
    return false;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (containsProhibitedKeys(item, depth + 1)) {
        return true;
      }
    }
    return false;
  }

  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    // Check prohibited exact keys
    if (PROHIBITED_KEY_NAMES.has(key)) {
      return true;
    }
    // Check keys starting with $ or containing .
    if (key.startsWith("$") || key.includes(".")) {
      return true;
    }
    // Recurse into values
    if (containsProhibitedKeys(record[key], depth + 1)) {
      return true;
    }
  }

  return false;
}

export function injectionPreventionMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && containsProhibitedKeys(req.body)) {
    return next(new BadRequestError("Prohibited key or operator detected in request body", "INVALID_KEY"));
  }

  if (req.query && containsProhibitedKeys(req.query)) {
    return next(new BadRequestError("Prohibited key or operator detected in query parameters", "INVALID_KEY"));
  }

  if (req.params && containsProhibitedKeys(req.params)) {
    return next(new BadRequestError("Prohibited key detected in path parameters", "INVALID_KEY"));
  }

  next();
}

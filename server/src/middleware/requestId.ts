import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

declare module "express-serve-static-core" {
  interface Request {
    id?: string;
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.header("x-request-id");
  const requestId = incomingId && /^[a-zA-Z0-9-_]{8,64}$/.test(incomingId) ? incomingId : crypto.randomUUID();

  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
}

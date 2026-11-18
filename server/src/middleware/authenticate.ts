import { Request, Response, NextFunction } from "express";
import { getTokensFromCookies } from "../auth/cookies.js";
import { verifyAccessToken } from "../auth/jwt.js";
import { repositories } from "../repositories/index.js";
import { UserEntity } from "../repositories/types.js";
import { UnauthorizedError } from "../utils/errors.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: UserEntity;
  }
}

/**
 * Authentication middleware:
 * 1. Extracts access token from cookie (or Authorization Bearer header).
 * 2. Cryptographically verifies JWT with pinned algorithm HS256.
 * 3. Fetches the user record from the database to check existence and current tokenVersion.
 * 4. Ensures clearance level is always loaded fresh from the DB, never trusted from JWT claims.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const { accessToken } = getTokensFromCookies(req);
    if (!accessToken) {
      throw new UnauthorizedError("Authentication required");
    }

    const payload = await verifyAccessToken(accessToken);
    const user = await repositories.users.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError("User account no longer exists");
    }

    // Verify token version (invalidates tokens if password was changed or sessions revoked)
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedError("Session has been invalidated, please log in again");
    }

    // Attach fresh user entity with fresh DB clearance
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

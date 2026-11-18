import { Request, Response, NextFunction } from "express";
import { PERMISSION_MATRIX, Action, Resource } from "./permissions.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

/**
 * RBAC middleware factory.
 * Returns middleware that checks whether req.user's role has permission
 * to perform `action` on `resource`.
 */
export function requirePermission(resource: Resource, action: Action) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError("Authentication required");
      }

      const roleMatrix = PERMISSION_MATRIX[user.role];
      const allowedActions = roleMatrix[resource];

      if (!allowedActions || !allowedActions.includes(action)) {
        throw new ForbiddenError(
          `Role '${user.role}' does not have '${action}' permission on '${resource}'`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

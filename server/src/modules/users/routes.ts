import { Router } from "express";
import { userController } from "./controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../authz/rbac.js";
import { sensitiveRevealRateLimiter } from "../../middleware/rateLimiter.js";

export const usersRouter = Router();

// GET /api/users/me — fetch own profile
usersRouter.get("/me", authenticate, (req, res, next) => {
  userController.getMe(req, res, next);
});

// PATCH /api/users/me — update own profile
usersRouter.patch(
  "/me",
  authenticate,
  requirePermission("user", "update"),
  (req, res, next) => {
    userController.updateProfile(req, res, next);
  }
);

// POST /api/users/me/reveal — decrypt a sensitive field (phone or nic)
usersRouter.post(
  "/me/reveal",
  authenticate,
  sensitiveRevealRateLimiter,
  (req, res, next) => {
    userController.revealSensitiveField(req, res, next);
  }
);

// GET /api/users — list customers (agents and adjusters)
usersRouter.get(
  "/",
  authenticate,
  requirePermission("user", "read"),
  (req, res, next) => {
    userController.listCustomers(req, res, next);
  }
);

// DELETE /api/users/:id — remove user (Adjuster 3 only)
usersRouter.delete(
  "/:id",
  authenticate,
  (req, res, next) => {
    userController.deleteUser(req, res, next);
  }
);

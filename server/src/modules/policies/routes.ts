import { Router } from "express";
import { policyController } from "./controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../authz/rbac.js";
import { shareRateLimiter } from "../../middleware/rateLimiter.js";

export const policiesRouter = Router();

// GET /api/policies — list policies (scoped by role)
policiesRouter.get(
  "/",
  authenticate,
  requirePermission("policy", "read"),
  (req, res, next) => {
    policyController.list(req, res, next);
  }
);

// POST /api/policies — create a new policy (agents only at RBAC level)
policiesRouter.post(
  "/",
  authenticate,
  requirePermission("policy", "create"),
  (req, res, next) => {
    policyController.create(req, res, next);
  }
);

// POST /api/policies/request — customer requests a policy
policiesRouter.post(
  "/request",
  authenticate,
  (req, res, next) => {
    policyController.request(req, res, next);
  }
);

// PATCH /api/policies/:id/approve — adjuster or agent approves policy
policiesRouter.patch(
  "/:id/approve",
  authenticate,
  (req, res, next) => {
    policyController.approve(req, res, next);
  }
);

// GET /api/policies/:id — get a single policy
policiesRouter.get(
  "/:id",
  authenticate,
  requirePermission("policy", "read"),
  (req, res, next) => {
    policyController.getById(req, res, next);
  }
);

// PATCH /api/policies/:id — update a policy (agents at RBAC level)
policiesRouter.patch(
  "/:id",
  authenticate,
  requirePermission("policy", "update"),
  (req, res, next) => {
    policyController.update(req, res, next);
  }
);

// POST /api/policies/:id/share — share a policy with another customer (DAC enforced at service layer)
policiesRouter.post(
  "/:id/share",
  authenticate,
  shareRateLimiter,
  (req, res, next) => {
    policyController.share(req, res, next);
  }
);

// DELETE /api/policies/:id/share/:userId — revoke shared access (DAC enforced at service layer)
policiesRouter.delete(
  "/:id/share/:userId",
  authenticate,
  (req, res, next) => {
    policyController.revokeShare(req, res, next);
  }
);

import { Router } from "express";
import { paymentsController } from "./controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../authz/rbac.js";

export const paymentsRouter = Router();

// GET /api/payments — list payments (role-scoped)
paymentsRouter.get(
  "/",
  authenticate,
  requirePermission("payment", "read"),
  (req, res, next) => {
    paymentsController.list(req, res, next);
  }
);

// POST /api/payments — record payment (adjusters only at RBAC level)
paymentsRouter.post(
  "/",
  authenticate,
  requirePermission("payment", "create"),
  (req, res, next) => {
    paymentsController.record(req, res, next);
  }
);

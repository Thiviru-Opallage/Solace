import { Router } from "express";
import { analyticsController } from "./controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../authz/rbac.js";

export const analyticsRouter = Router();

// All analytics routes require authentication and 'analytics:read' permission (agents/adjusters)
analyticsRouter.use(authenticate, requirePermission("analytics", "read"));

// GET /api/analytics/kpis
analyticsRouter.get("/kpis", (req, res, next) => {
  analyticsController.getKpis(req, res, next);
});

// GET /api/analytics/claims-by-status
analyticsRouter.get("/claims-by-status", (req, res, next) => {
  analyticsController.getClaimsByStatus(req, res, next);
});

// GET /api/analytics/avg-days-by-policy
analyticsRouter.get("/avg-days-by-policy", (req, res, next) => {
  analyticsController.getAvgDaysByPolicy(req, res, next);
});

// GET /api/analytics/payouts-by-policy
analyticsRouter.get("/payouts-by-policy", (req, res, next) => {
  analyticsController.getPayoutsByPolicy(req, res, next);
});

// GET /api/analytics/claims-per-month
analyticsRouter.get("/claims-per-month", (req, res, next) => {
  analyticsController.getClaimsPerMonth(req, res, next);
});

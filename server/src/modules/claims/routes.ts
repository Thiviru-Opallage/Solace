import { Router } from "express";
import { claimsController } from "./controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import { requirePermission } from "../../authz/rbac.js";
import { uploadRateLimiter } from "../../middleware/rateLimiter.js";
import { claimUploadMiddleware, uploadClaimDocuments } from "./upload.js";
import { setupSseRoutes } from "../../realtime/sse.js";
import { changeFeed } from "../../realtime/changeFeed.js";

export const claimsRouter = Router();

// Realtime SSE routes (GET /api/claims/events, GET /api/claims/events/:claimId)
// Note: Registered before parameterized routes
setupSseRoutes(claimsRouter, changeFeed);

// GET /api/claims — list claims (scoped by role)
claimsRouter.get(
  "/",
  authenticate,
  requirePermission("claim", "read"),
  (req, res, next) => {
    claimsController.list(req, res, next);
  }
);

// POST /api/claims — create a new claim (customers only at service level)
claimsRouter.post(
  "/",
  authenticate,
  requirePermission("claim", "create"),
  (req, res, next) => {
    claimsController.create(req, res, next);
  }
);

// GET /api/claims/:id — get a single claim
claimsRouter.get(
  "/:id",
  authenticate,
  requirePermission("claim", "read"),
  (req, res, next) => {
    claimsController.getById(req, res, next);
  }
);

// PATCH /api/claims/:id/status — update claim status
claimsRouter.patch(
  "/:id/status",
  authenticate,
  requirePermission("claim", "update"),
  (req, res, next) => {
    claimsController.updateStatus(req, res, next);
  }
);

// POST /api/claims/:id/notes — add adjuster note
claimsRouter.post(
  "/:id/notes",
  authenticate,
  requirePermission("note", "create"),
  (req, res, next) => {
    claimsController.addNote(req, res, next);
  }
);

// POST /api/claims/:id/respond-info — customer responds to info request
claimsRouter.post(
  "/:id/respond-info",
  authenticate,
  (req, res, next) => {
    claimsController.respondToInfoRequest(req, res, next);
  }
);

// POST /api/claims/:id/documents — upload claim documents
claimsRouter.post(
  "/:id/documents",
  authenticate,
  requirePermission("document", "create"),
  uploadRateLimiter,
  claimUploadMiddleware,
  (req, res, next) => {
    uploadClaimDocuments(req, res, next);
  }
);

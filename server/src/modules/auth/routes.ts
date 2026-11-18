import { Router } from "express";
import { authController } from "./controller.js";
import { authenticate } from "../../middleware/authenticate.js";
import {
  loginRateLimiter,
  loginSlowDown,
  registerRateLimiter,
  refreshRateLimiter,
} from "../../middleware/rateLimiter.js";
import { originVerificationMiddleware } from "../../auth/csrf.js";

export const authRouter = Router();

// CSRF Token generation
authRouter.get("/csrf", (req, res, next) => {
  authController.getCsrfToken(req, res, next);
});

// Registration (customers only)
authRouter.post(
  "/register",
  registerRateLimiter,
  originVerificationMiddleware,
  (req, res, next) => {
    authController.register(req, res, next);
  }
);

// Login (all roles)
authRouter.post(
  "/login",
  loginRateLimiter,
  loginSlowDown,
  originVerificationMiddleware,
  (req, res, next) => {
    authController.login(req, res, next);
  }
);

// Logout
authRouter.post(
  "/logout",
  originVerificationMiddleware,
  (req, res, next) => {
    authController.logout(req, res, next);
  }
);

// Token Refresh
authRouter.post(
  "/refresh",
  refreshRateLimiter,
  originVerificationMiddleware,
  (req, res, next) => {
    authController.refresh(req, res, next);
  }
);

// Get current user profile
authRouter.get(
  "/me",
  authenticate,
  (req, res, next) => {
    authController.getMe(req, res, next);
  }
);

// Change password
authRouter.post(
  "/change-password",
  authenticate,
  originVerificationMiddleware,
  (req, res, next) => {
    authController.changePassword(req, res, next);
  }
);

import { Request, Response, NextFunction } from "express";
import { authService } from "./service.js";
import { registerSchema, loginSchema, changePasswordSchema } from "./schemas.js";
import { toUserDto } from "./dto.js";
import { setAuthCookies, clearAuthCookies, getTokensFromCookies } from "../../auth/cookies.js";
import { generateCsrfToken } from "../../auth/csrf.js";
import { UnauthorizedError } from "../../utils/errors.js";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);
      const { user, tokens } = await authService.registerCustomer(
        validated,
        req.ip,
        req.header("user-agent")
      );

      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      res.status(201).json({ user: toUserDto(user), accessToken: tokens.accessToken, token: tokens.accessToken });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const { user, tokens } = await authService.login(
        validated,
        req.ip,
        req.header("user-agent")
      );

      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      res.json({ user: toUserDto(user), accessToken: tokens.accessToken, token: tokens.accessToken });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = getTokensFromCookies(req);
      await authService.logout(
        refreshToken,
        req.user,
        req.ip,
        req.header("user-agent")
      );

      clearAuthCookies(res);
      res.json({ message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = getTokensFromCookies(req);
      if (!refreshToken) {
        throw new UnauthorizedError("Refresh token missing");
      }

      const { user, tokens } = await authService.refresh(
        refreshToken,
        req.ip,
        req.header("user-agent")
      );

      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      res.json({ user: toUserDto(user), accessToken: tokens.accessToken, token: tokens.accessToken });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const user = await authService.getMe(req.user._id);
      // The /me endpoint is always the owner viewing their own profile — reveal plaintext
      res.json(toUserDto(user, { revealSensitive: true }));
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentication required");
      }

      const validated = changePasswordSchema.parse(req.body);
      await authService.changePassword(
        req.user._id,
        validated,
        req.ip,
        req.header("user-agent")
      );

      clearAuthCookies(res);
      res.json({ message: "Password changed successfully. Please log in again with your new credentials." });
    } catch (err) {
      next(err);
    }
  }

  getCsrfToken(req: Request, res: Response, next: NextFunction): void {
    try {
      const csrfToken = generateCsrfToken(req, res);
      res.json({ csrfToken });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();

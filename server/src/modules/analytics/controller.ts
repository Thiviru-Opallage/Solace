import { Request, Response, NextFunction } from "express";
import { analyticsService } from "./service.js";
import { buildClaimScope } from "../../authz/scopes.js";
import { UnauthorizedError } from "../../utils/errors.js";

export class AnalyticsController {
  async getKpis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const scope = buildClaimScope(req.user);
      const kpis = await analyticsService.getKpis(scope);
      res.json(kpis);
    } catch (err) {
      next(err);
    }
  }

  async getClaimsByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const scope = buildClaimScope(req.user);
      const data = await analyticsService.getClaimsByStatus(scope);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async getAvgDaysByPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const scope = buildClaimScope(req.user);
      const data = await analyticsService.getAvgDaysByPolicy(scope);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async getPayoutsByPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const scope = buildClaimScope(req.user);
      const data = await analyticsService.getPayoutsByPolicy(scope);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async getClaimsPerMonth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const scope = buildClaimScope(req.user);
      const data = await analyticsService.getClaimsPerMonth(scope);
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();

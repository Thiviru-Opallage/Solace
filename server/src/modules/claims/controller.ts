import { Request, Response, NextFunction } from "express";
import { claimsService } from "./service.js";
import {
  createClaimSchema,
  updateClaimStatusSchema,
  addNoteSchema,
  respondInfoSchema,
  claimQuerySchema,
} from "./schemas.js";
import { toClaimDto } from "./dto.js";
import { buildClaimScope } from "../../authz/scopes.js";
import { UnauthorizedError } from "../../utils/errors.js";

function getParam(param: unknown): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return typeof param === "string" ? param : "";
}

export class ClaimsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const scope = buildClaimScope(req.user);
      const query = claimQuerySchema.parse(req.query);

      const claims = await claimsService.list(scope, {
        customerId: query.customerId,
        policyId: query.policyId,
        status: query.status,
        search: query.search,
        limit: query.limit,
        offset: query.offset,
      });

      res.json({ claims: claims.map(toClaimDto) });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const id = getParam(req.params["id"]);
      const claim = await claimsService.getById(id, req.user);
      res.json({ claim: toClaimDto(claim) });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const validated = createClaimSchema.parse(req.body);
      const claim = await claimsService.create(validated, req.user);
      res.status(201).json({ claim: toClaimDto(claim) });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { status, comment } = updateClaimStatusSchema.parse(req.body);
      const id = getParam(req.params["id"]);
      const claim = await claimsService.updateStatus(
        id,
        status,
        req.user,
        comment,
        req.ip,
        req.header("user-agent")
      );
      res.json({ claim: toClaimDto(claim) });
    } catch (err) {
      next(err);
    }
  }

  async addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { note } = addNoteSchema.parse(req.body);
      const id = getParam(req.params["id"]);
      const claim = await claimsService.addNote(
        id,
        note,
        req.user,
        req.ip,
        req.header("user-agent")
      );
      res.json({ claim: toClaimDto(claim) });
    } catch (err) {
      next(err);
    }
  }

  async respondToInfoRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { responseText } = respondInfoSchema.parse(req.body);
      const id = getParam(req.params["id"]);
      const claim = await claimsService.respondToInfoRequest(
        id,
        responseText,
        req.user,
        [],
        req.ip,
        req.header("user-agent")
      );
      res.json({ claim: toClaimDto(claim) });
    } catch (err) {
      next(err);
    }
  }
}

export const claimsController = new ClaimsController();

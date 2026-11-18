import { Request, Response, NextFunction } from "express";
import { policyService } from "./service.js";
import {
  createPolicySchema,
  updatePolicySchema,
  sharePolicySchema,
  policyQuerySchema,
  requestPolicySchema,
} from "./schemas.js";
import { toPolicyDto } from "./dto.js";
import { buildPolicyScope } from "../../authz/scopes.js";
import { UnauthorizedError } from "../../utils/errors.js";

function getParam(param: unknown): string {
  if (Array.isArray(param)) return param[0] ?? "";
  return typeof param === "string" ? param : "";
}

export class PolicyController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const scope = buildPolicyScope(req.user);
      const query = policyQuerySchema.parse(req.query);

      const policies = await policyService.list(scope, {
        customerId: query.customerId,
        agentId: query.agentId,
        type: query.type,
        status: query.status,
        search: query.search,
        limit: query.limit,
        offset: query.offset,
      });

      res.json({ policies: policies.map(toPolicyDto) });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const id = getParam(req.params["id"]);
      const policy = await policyService.getById(id, req.user);
      res.json({ policy: toPolicyDto(policy) });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const validated = createPolicySchema.parse(req.body);
      const policy = await policyService.create(validated, req.user._id);
      res.status(201).json({ policy: toPolicyDto(policy) });
    } catch (err) {
      next(err);
    }
  }

  async request(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const validated = requestPolicySchema.parse(req.body);
      const policy = await policyService.requestPolicy(validated, req.user);
      res.status(201).json({ policy: toPolicyDto(policy) });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const id = getParam(req.params["id"]);
      const policy = await policyService.approvePolicy(id, req.user);
      res.json({ policy: toPolicyDto(policy) });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const validated = updatePolicySchema.parse(req.body);
      const id = getParam(req.params["id"]);
      const policy = await policyService.update(
        id,
        validated,
        req.user,
        req.ip,
        req.header("user-agent")
      );
      res.json({ policy: toPolicyDto(policy) });
    } catch (err) {
      next(err);
    }
  }

  async share(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { email } = sharePolicySchema.parse(req.body);
      const id = getParam(req.params["id"]);
      const policy = await policyService.sharePolicy(
        id,
        email,
        req.user,
        req.ip,
        req.header("user-agent")
      );
      res.json({ policy: toPolicyDto(policy) });
    } catch (err) {
      next(err);
    }
  }

  async revokeShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const id = getParam(req.params["id"]);
      const userId = getParam(req.params["userId"]);
      const policy = await policyService.revokeShare(
        id,
        userId,
        req.user,
        req.ip,
        req.header("user-agent")
      );
      res.json({ policy: toPolicyDto(policy) });
    } catch (err) {
      next(err);
    }
  }
}

export const policyController = new PolicyController();

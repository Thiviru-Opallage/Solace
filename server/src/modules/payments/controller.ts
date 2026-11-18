import { Request, Response, NextFunction } from "express";
import { paymentsService } from "./service.js";
import { recordPaymentSchema, paymentQuerySchema } from "./schemas.js";
import { toPaymentDto } from "./dto.js";
import { buildPaymentScope } from "../../authz/scopes.js";
import { UnauthorizedError } from "../../utils/errors.js";

export class PaymentsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const scope = buildPaymentScope(req.user);
      const query = paymentQuerySchema.parse(req.query);

      const payments = await paymentsService.list(scope, {
        claimId: query.claimId,
        limit: query.limit,
        offset: query.offset,
      });

      res.json({ payments: payments.map(toPaymentDto) });
    } catch (err) {
      next(err);
    }
  }

  async record(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const validated = recordPaymentSchema.parse(req.body);

      const payment = await paymentsService.recordPayment(
        validated,
        req.user,
        req.ip,
        req.header("user-agent")
      );

      res.status(201).json({ payment: toPaymentDto(payment) });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentsController = new PaymentsController();

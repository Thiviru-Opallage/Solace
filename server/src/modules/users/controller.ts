import { Request, Response, NextFunction } from "express";
import { userService } from "./service.js";
import { updateProfileSchema, revealSensitiveFieldSchema, listUsersQuerySchema } from "./schemas.js";
import { toUserDto } from "../auth/dto.js";
import { UnauthorizedError } from "../../utils/errors.js";

export class UserController {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const user = await userService.getMe(req.user._id);
      res.json({ user: toUserDto(user) });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const validated = updateProfileSchema.parse(req.body);
      const updated = await userService.updateProfile(
        req.user._id,
        validated,
        req.ip,
        req.header("user-agent")
      );
      res.json({ user: toUserDto(updated) });
    } catch (err) {
      next(err);
    }
  }

  async listCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { search, limit, offset } = listUsersQuerySchema.parse(req.query);
      const isAllRequested = req.query["all"] === "true" && req.user.role === "adjuster" && (req.user.clearance ?? 1) >= 3;
      const users = isAllRequested
        ? await userService.listAllUsers(search, limit)
        : await userService.listCustomers(search, limit, offset);
      res.json({ users: users.map((u) => toUserDto(u)) });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const id = req.params["id"] as string;
      await userService.deleteUser(id, req.user, req.ip, req.header("user-agent"));
      res.json({ message: "User removed successfully", userId: id });
    } catch (err) {
      next(err);
    }
  }

  async revealSensitiveField(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError("Authentication required");
      const { field } = revealSensitiveFieldSchema.parse(req.body);
      const value = await userService.revealSensitiveField(req.user._id, req.user._id, field);
      res.json({ field, value });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();

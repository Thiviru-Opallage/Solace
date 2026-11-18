import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
    email: z.string().email("Invalid email format").max(255),
    password: z.string().min(8, "Password must be at least 8 characters").max(128),
    phone: z.string().max(20).optional(),
    nic: z.string().max(20).optional(),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.string().email("Invalid email format").max(255),
    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(128),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(128),
  })
  .strict();

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

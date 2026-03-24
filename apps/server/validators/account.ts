import { z } from "zod";

export const updateAccountSchema = z.object({
  firstName: z.string().max(180).optional(),
  lastName: z.string().max(180).optional()
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8).regex(/(?=.*\d)/),
    newPassword_confirmation: z.string().min(8).regex(/(?=.*\d)/)
  })
  .refine((data) => data.newPassword === data.newPassword_confirmation, {
    message: "Passwords do not match",
    path: ["newPassword_confirmation"]
  });

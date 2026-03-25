import { z } from "zod";
import { navigationLayouts, themes } from "../constants/user-preference.js";

export const userListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().max(180).optional(),
  lastName: z.string().max(180).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export const updateUserPreferenceSchema = z.object({
  navigationLayout: z
    .enum(Object.values(navigationLayouts) as [string, ...string[]])
    .optional(),
  theme: z.enum(Object.values(themes) as [string, ...string[]]).optional(),
});

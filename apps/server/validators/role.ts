import { z } from "zod";

export const roleListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  s: z.string().optional()
});

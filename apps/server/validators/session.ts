import { z } from "zod"

export const sessionStoreSchema = z.object({
	email: z.string().email(),
	password: z.string(),
})

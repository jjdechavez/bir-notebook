import { z } from "zod"

export const setupInputSchema = z.object({
	firstName: z.string().min(1, "First name is required"),
	lastName: z.string().min(1, "Last name is required"),
	email: z.string().email(),
	password: z.string().min(8, "Password must be at least 8 characters"),
})

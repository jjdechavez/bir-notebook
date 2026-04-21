import { z } from "zod"

export const createInviteSchema = z.object({
	email: z.string().email(),
	role: z.enum(["user", "admin"]),
})

export const completeInviteSchema = z
	.object({
		firstName: z.string().max(180),
		lastName: z.string().max(180),
		password: z
			.string()
			.min(8)
			.regex(/(?=.*\d)/),
		password_confirmation: z
			.string()
			.min(8)
			.regex(/(?=.*\d)/),
	})
	.refine((data) => data.password === data.password_confirmation, {
		message: "Passwords do not match",
		path: ["password_confirmation"],
	})

export const updateInviteSchema = z.object({
	email: z.string().email(),
	role: z.enum(["user", "admin"]),
})

import type { ListQueryParam, ListResponse } from '@/lib/api'
import type { SessionClient } from '@/lib/auth-client'
import { z } from 'zod'

export type User = SessionClient['user']

export const userInputSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  role: z.enum(['user', 'admin']),
})

export type UserInput = z.infer<typeof userInputSchema>

export type UserList = ListResponse<User>

export type ListUserQueryParam = ListQueryParam & {
  s?: string
}

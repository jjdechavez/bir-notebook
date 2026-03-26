import type { ListQueryParam, ListResponse } from '@/lib/api'
import type { SessionClient } from '@/lib/auth-client'
import type { UserRole } from '@bir-notebook/shared/models/user'

export type User = SessionClient['user']

export type UserInput = {
  firstName: string
  lastName: string
  role: UserRole
}

export type UserList = ListResponse<User>

export type ListUserQueryParam = ListQueryParam & {
  s?: string
}

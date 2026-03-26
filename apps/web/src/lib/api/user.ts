import type {
  UserPreference,
  UserPreferenceInput,
} from '@bir-notebook/shared/models/user'
import { requestApi } from '../request'
import type {
  ListUserQueryParam,
  User,
  UserInput,
  UserList,
} from '@/types/user'
import { cleanEmptyParams } from '../api'

const USERS_ENDPOINT = '/users'
const PREFERENCES_ENDPOINT = '/preferences'

export const user = {
  list: async (query: ListUserQueryParam = {}) => {
    const qs = cleanEmptyParams(query)
    return requestApi<UserList>(USERS_ENDPOINT, { method: 'GET', query: qs })
  },
  update: async (id: string, input: UserInput) =>
    requestApi<User>(`${USERS_ENDPOINT}/${id}`, { method: 'PUT', body: input }),
  preferences: {
    detail: async () =>
      requestApi<UserPreference>(PREFERENCES_ENDPOINT, { method: 'GET' }),
    update: async (input: UserPreferenceInput) => {
      return requestApi<UserPreference>(PREFERENCES_ENDPOINT, {
        method: 'PUT',
        body: input,
      })
    },
  },
}

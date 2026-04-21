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
import type {
  ChangePasswordInput,
  PersonalInformationInput,
} from '@/types/account'

const USERS_ENDPOINT = '/users' as const
const PREFERENCES_ENDPOINT = '/preferences' as const
const ACCOUNT_ENDPOINT = '/accounts' as const

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
  account: {
    update: async (input: PersonalInformationInput) =>
      requestApi(ACCOUNT_ENDPOINT, { method: 'PUT', body: input }),
    changePassword: async (input: ChangePasswordInput) =>
      requestApi<User>(ACCOUNT_ENDPOINT, { method: 'POST', body: input }),
  },
}

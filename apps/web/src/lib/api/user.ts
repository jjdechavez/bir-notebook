import type {
  UserPreference,
  UserPreferenceInput,
} from '@bir-notebook/shared/models/user'
import { requestApi } from '../request'

const PREFERENCES_ENDPOINT = '/preferences'

export const user = {
  preferences: {
    detail: async () =>
      requestApi<UserPreference>(PREFERENCES_ENDPOINT, { method: 'GET' }),
    update: async (input: UserPreferenceInput) => {
      console.log(input)
      return requestApi<UserPreference>(PREFERENCES_ENDPOINT, {
        method: 'PUT',
        body: input,
      })
    },
  },
}

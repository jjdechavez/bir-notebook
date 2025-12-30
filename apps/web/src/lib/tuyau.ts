import { createTuyau } from '@tuyau/client'
import { api } from '@bir-notebook/server/api'

import { getAuthToken } from './auth'

export const tuyauClient = createTuyau({
  api,
  baseUrl: 'http://localhost:3333',
  timeout: 10_000,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getAuthToken()
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
  },
})


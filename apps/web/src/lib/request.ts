import { ofetch, type FetchOptions } from 'ofetch'
import { getAuthToken } from './auth'

const ofetchBaseConfig: FetchOptions = {
  timeout: 3000,
  async onRequest({ request, options }) {
    console.log('[fetch request]', request, options)
  },
  async onRequestError({ request, response, error }) {
    console.log(
      '[fetch request error]',
      request,
      response?.status,
      response?.body,
    )
    console.error(error)
  },
  async onResponse({ request, options }) {
    console.log('[fetch response]', request, options)
  },
}

export const request = ofetch.create({
  ...ofetchBaseConfig,
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
})

export const requestApi = ofetch.create({
  ...ofetchBaseConfig,
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3333') + '/api',
  credentials: 'include',
  async onRequest({ request, options }) {
    console.log('[fetch request]', request, options)
    const token = getAuthToken()
    if (token) {
      options.headers.set('Authorization', `Bearer ${token}`)
    }
  },
  async onResponse({ request, options, response }) {
    console.log('[fetch response]', request, options)
    if (response.status === 401) {
      console.warn('Unauthorized: redirecting to login')
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  },
})

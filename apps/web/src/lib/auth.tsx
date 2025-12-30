import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { tuyauClient } from './tuyau'
import { tuyau } from '../main'
import { useMutation } from '@tanstack/react-query'
import type { InferResponseType } from '@tuyau/react-query'
import { toast } from 'sonner'
import { TuyauHTTPError } from '@tuyau/client'

export type User = InferResponseType<typeof tuyau.api.session.$get>

const TOKEN_STORAGE_KEY = 'auth_token'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loginMutation = useMutation(tuyau.api.session.$post.mutationOptions())
  const logoutMutation = useMutation(
    tuyau.api.session.$delete.mutationOptions({}),
  )

  const getToken = (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  }

  const setToken = (token: string | null) => {
    if (typeof window === 'undefined') return
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  }

  const checkAuth = async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const currentUser = await tuyauClient.api.session.$get({
        headers: {
          Authorization: token,
        },
      })
      setUser(currentUser.data as unknown as User)
    } catch (error) {
      setToken(null)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const response = await loginMutation.mutateAsync(
      {
        payload: { email, password },
      },
      {
        onError: (e) => {
          if (e instanceof TuyauHTTPError) {
            const value = e.value as { errors: Array<{ message: string }> }
            toast.error(value.errors[0].message)
          }
        },
      },
    )

    if (!response?.token) {
      throw new Error('Invalid response from server: token not found')
    }

    setToken(response.token)
    await checkAuth()
  }

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync({})
      setToken(null)
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    let initialize = true

    if (initialize) {
      checkAuth()
    }

    return () => {
      initialize = false
    }
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PublicUser {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface AuthState {
  token: string | null
  user: PublicUser | null
  isAuthenticated: boolean
  setAuth: (token: string, user: PublicUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'optinerds-auth',
      partialize: (s) => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }),
    },
  ),
)

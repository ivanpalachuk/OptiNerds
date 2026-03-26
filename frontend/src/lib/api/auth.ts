import { api } from './client'
import type { PublicUser } from '../../store/authStore'

export interface AuthResponse {
  token: string
  user: PublicUser
}

export const authApi = {
  register: (body: { email: string; name: string; password: string }) =>
    api.post<AuthResponse>('/auth/register', body).then((r) => r.data),

  login: (body: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', body).then((r) => r.data),

  me: () =>
    api.get<PublicUser>('/auth/me').then((r) => r.data),
}

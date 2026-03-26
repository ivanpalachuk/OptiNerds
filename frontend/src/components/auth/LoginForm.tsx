import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { authApi } from '../../lib/api/auth'
import { useAuthStore } from '../../store/authStore'

export function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.login({ email, password })
      setAuth(token, user)
      navigate({ to: '/optimizer' })
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handle} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-slate-900">Iniciar sesión</h2>
      <Input label="Email" type="email" placeholder="vos@ejemplo.com" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <Input label="Contraseña" type="password" placeholder="••••••••" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">Entrar</Button>
      <p className="text-sm text-center text-slate-500">
        ¿No tenés cuenta?{' '}
        <button type="button" onClick={onSwitch} className="text-blue-600 hover:underline font-medium">
          Registrate
        </button>
      </p>
    </form>
  )
}

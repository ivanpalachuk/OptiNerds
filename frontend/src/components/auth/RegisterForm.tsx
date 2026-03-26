import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { authApi } from '../../lib/api/auth'
import { useAuthStore } from '../../store/authStore'

export function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const handle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    setError('')
    setLoading(true)
    try {
      const { token, user } = await authApi.register({ name, email, password })
      setAuth(token, user)
      navigate({ to: '/optimizer' })
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Error al registrarse.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handle} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-slate-900">Crear cuenta</h2>
      <Input label="Nombre" placeholder="Tu nombre" value={name}
        onChange={(e) => setName(e.target.value)} required />
      <Input label="Email" type="email" placeholder="vos@ejemplo.com" value={email}
        onChange={(e) => setEmail(e.target.value)} required />
      <Input label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" value={password}
        onChange={(e) => setPassword(e.target.value)} required />
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">Crear cuenta</Button>
      <p className="text-sm text-center text-slate-500">
        ¿Ya tenés cuenta?{' '}
        <button type="button" onClick={onSwitch} className="text-blue-600 hover:underline font-medium">
          Iniciá sesión
        </button>
      </p>
    </form>
  )
}

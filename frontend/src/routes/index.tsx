import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { LoginForm } from '../components/auth/LoginForm'
import { RegisterForm } from '../components/auth/RegisterForm'

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/optimizer' })
  },
  component: LandingPage,
})

function LandingPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="6" fill="#2563EB"/>
              <rect x="4" y="4" width="11" height="8" rx="1" fill="white" opacity="0.9"/>
              <rect x="17" y="4" width="11" height="13" rx="1" fill="white" opacity="0.7"/>
              <rect x="4" y="14" width="11" height="14" rx="1" fill="white" opacity="0.7"/>
              <rect x="17" y="19" width="11" height="9" rx="1" fill="white" opacity="0.9"/>
            </svg>
            <h1 className="text-3xl font-bold text-slate-900">OptiNerds</h1>
          </div>
          <p className="text-slate-500 text-sm">Optimizador de cortes de madera</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          {mode === 'login'
            ? <LoginForm onSwitch={() => setMode('register')} />
            : <RegisterForm onSwitch={() => setMode('login')} />
          }
        </div>
      </div>
    </div>
  )
}

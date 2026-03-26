import { Link } from '@tanstack/react-router'
import { useAuthStore } from '../../store/authStore'
import { Button } from './Button'

export function Navbar() {
  const { user, logout } = useAuthStore()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/optimizer" className="flex items-center gap-2.5 no-underline">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#2563EB"/>
            <rect x="4" y="4" width="11" height="8" rx="1" fill="white" opacity="0.9"/>
            <rect x="17" y="4" width="11" height="13" rx="1" fill="white" opacity="0.7"/>
            <rect x="4" y="14" width="11" height="14" rx="1" fill="white" opacity="0.7"/>
            <rect x="17" y="19" width="11" height="9" rx="1" fill="white" opacity="0.9"/>
          </svg>
          <span className="font-bold text-slate-900 text-lg">OptiNerds</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link to="/optimizer" className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors [&.active]:text-blue-600 [&.active]:bg-blue-50">
            Optimizador
          </Link>
          <Link to="/cuts" className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors [&.active]:text-blue-600 [&.active]:bg-blue-50">
            Mis cortes
          </Link>
          <div className="w-px h-5 bg-slate-200 mx-1"/>
          <span className="text-sm text-slate-500 hidden sm:block">{user?.name}</span>
          <Button variant="ghost" size="sm" onClick={logout}>Salir</Button>
        </nav>
      </div>
    </header>
  )
}

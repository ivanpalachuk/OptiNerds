import { createFileRoute, Outlet } from '@tanstack/react-router'
import { Navbar } from '../components/ui/Navbar'

export const Route = createFileRoute('/_auth')({
  component: () => (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />
      <Outlet />
    </div>
  ),
})

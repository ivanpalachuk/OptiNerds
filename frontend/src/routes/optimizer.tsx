import { createFileRoute } from '@tanstack/react-router'
import { Navbar } from '../components/ui/Navbar'
import { OptimizerPage } from '../components/optimizer/OptimizerPage'

export const Route = createFileRoute('/optimizer')({
  component: () => (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Navbar />
      <OptimizerPage />
    </div>
  ),
})

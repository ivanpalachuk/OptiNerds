import { createFileRoute } from '@tanstack/react-router'
import { OptimizerPage } from '../components/optimizer/OptimizerPage'

export const Route = createFileRoute('/_auth/optimizer')({
  component: OptimizerPage,
})

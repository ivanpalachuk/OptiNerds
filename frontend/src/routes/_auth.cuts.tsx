import { createFileRoute } from '@tanstack/react-router'
import { CutsPage } from '../components/cuts/CutsPage'

export const Route = createFileRoute('/_auth/cuts')({
  component: CutsPage,
})

import { Router } from 'express'
import { authService } from '../services/auth.service'
import { requireAuth } from '../middleware/auth'
import { z } from 'zod'

const router = Router()

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Datos inválidos.', details: parsed.error.flatten() }); return }
  try {
    const result = await authService.register(parsed.data.email, parsed.data.name, parsed.data.password)
    res.status(201).json(result)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: 'Datos inválidos.' }); return }
  try {
    const result = await authService.login(parsed.data.email, parsed.data.password)
    res.json(result)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await authService.me((req as any).user.userId)
    res.json(user)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

export default router

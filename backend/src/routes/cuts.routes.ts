import { Router } from 'express'
import { cutsService } from '../services/cuts.service'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    const cuts = await cutsService.list((req as any).user.userId)
    res.json(cuts)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const cut = await cutsService.create((req as any).user.userId, req.body)
    res.status(201).json(cut)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const cut = await cutsService.get(req.params.id, (req as any).user.userId)
    res.json(cut)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const cut = await cutsService.update(req.params.id, (req as any).user.userId, req.body)
    res.json(cut)
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await cutsService.remove(req.params.id, (req as any).user.userId)
    res.status(204).send()
  } catch (err: any) {
    res.status(err.status ?? 500).json({ error: err.message })
  }
})

export default router

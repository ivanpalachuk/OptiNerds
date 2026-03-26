import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import authRoutes from './routes/auth.routes'
import cutsRoutes from './routes/cuts.routes'

const app = express()

const origins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',')

app.use(cors({ origin: origins, credentials: true }))
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }))
app.use('/api/auth', authRoutes)
app.use('/api/cuts', cutsRoutes)

export default app

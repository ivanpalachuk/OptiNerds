import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

const SALT_ROUNDS = 12

function signToken(userId: string, email: string, name: string) {
  return jwt.sign(
    { userId, email, name },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as jwt.SignOptions,
  )
}

export const authService = {
  async register(email: string, name: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw Object.assign(new Error('El email ya está en uso.'), { status: 409 })

    const hash = await bcrypt.hash(password, SALT_ROUNDS)
    const user = await prisma.user.create({ data: { email, name, password: hash } })
    const token = signToken(user.id, user.email, user.name)
    return { token, user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() } }
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw Object.assign(new Error('Email o contraseña incorrectos.'), { status: 401 })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) throw Object.assign(new Error('Email o contraseña incorrectos.'), { status: 401 })

    const token = signToken(user.id, user.email, user.name)
    return { token, user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() } }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw Object.assign(new Error('Usuario no encontrado.'), { status: 404 })
    return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt.toISOString() }
  },
}

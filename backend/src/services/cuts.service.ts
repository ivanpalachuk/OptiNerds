import { prisma } from '../lib/prisma'

interface CutBody {
  name: string
  boardWidth: number
  boardHeight: number
  boardThick?: number
  boardQty?: number
  kerf?: number
  pieces: unknown
  result?: unknown
}

export const cutsService = {
  async list(userId: string) {
    return prisma.cut.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
  },

  async get(id: string, userId: string) {
    const cut = await prisma.cut.findUnique({ where: { id } })
    if (!cut) throw Object.assign(new Error('Corte no encontrado.'), { status: 404 })
    if (cut.userId !== userId) throw Object.assign(new Error('Sin permiso.'), { status: 403 })
    return cut
  },

  async create(userId: string, body: CutBody) {
    return prisma.cut.create({
      data: {
        userId,
        name: body.name,
        boardWidth: body.boardWidth,
        boardHeight: body.boardHeight,
        boardThick: body.boardThick ?? 18,
        boardQty: body.boardQty ?? 1,
        kerf: body.kerf ?? 3,
        pieces: body.pieces as any,
        result: (body.result ?? null) as any,
      },
    })
  },

  async update(id: string, userId: string, body: Partial<CutBody>) {
    const cut = await prisma.cut.findUnique({ where: { id } })
    if (!cut) throw Object.assign(new Error('Corte no encontrado.'), { status: 404 })
    if (cut.userId !== userId) throw Object.assign(new Error('Sin permiso.'), { status: 403 })

    return prisma.cut.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.boardWidth !== undefined && { boardWidth: body.boardWidth }),
        ...(body.boardHeight !== undefined && { boardHeight: body.boardHeight }),
        ...(body.boardThick !== undefined && { boardThick: body.boardThick }),
        ...(body.boardQty !== undefined && { boardQty: body.boardQty }),
        ...(body.kerf !== undefined && { kerf: body.kerf }),
        ...(body.pieces !== undefined && { pieces: body.pieces as any }),
        ...(body.result !== undefined && { result: body.result as any }),
      },
    })
  },

  async remove(id: string, userId: string) {
    const cut = await prisma.cut.findUnique({ where: { id } })
    if (!cut) throw Object.assign(new Error('Corte no encontrado.'), { status: 404 })
    if (cut.userId !== userId) throw Object.assign(new Error('Sin permiso.'), { status: 403 })
    await prisma.cut.delete({ where: { id } })
  },
}

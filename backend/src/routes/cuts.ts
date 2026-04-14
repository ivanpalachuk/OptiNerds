import { Hono } from 'hono';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { createDbClient } from '../db/index';
import { cuts } from '../db/schema';
import { requireAuth, type AppEnv } from '../middleware/auth';

const router = new Hono<AppEnv>();

router.use('*', requireAuth);

const cutSchema = z.object({
  name: z.string().min(1),
  boardWidth: z.number().int().positive(),
  boardHeight: z.number().int().positive(),
  boardThick: z.number().int().positive().optional(),
  boardQty: z.number().int().positive().optional(),
  kerf: z.number().int().min(0).optional(),
  pieces: z.unknown(),
  result: z.unknown().optional(),
});

router.get('/', async (c) => {
  const db = createDbClient(c.env.DB);
  const { userId } = c.get('user');
  const result = await db.select().from(cuts).where(eq(cuts.userId, userId)).orderBy(desc(cuts.updatedAt)).all();
  return c.json(result);
});

router.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Body inválido.' }, 400);

  const parsed = cutSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Datos inválidos.', details: parsed.error.flatten() }, 400);

  const db = createDbClient(c.env.DB);
  const { userId } = c.get('user');
  const now = new Date();
  const id = crypto.randomUUID();
  const data = parsed.data;

  await db.insert(cuts).values({
    id,
    userId,
    name: data.name,
    boardWidth: data.boardWidth,
    boardHeight: data.boardHeight,
    boardThick: data.boardThick ?? 18,
    boardQty: data.boardQty ?? 1,
    kerf: data.kerf ?? 3,
    pieces: data.pieces,
    result: data.result ?? null,
    createdAt: now,
    updatedAt: now,
  });

  const cut = await db.select().from(cuts).where(eq(cuts.id, id)).get();
  return c.json(cut, 201);
});

router.get('/:id', async (c) => {
  const db = createDbClient(c.env.DB);
  const { userId } = c.get('user');
  const cut = await db.select().from(cuts).where(eq(cuts.id, c.req.param('id'))).get();
  if (!cut) return c.json({ error: 'Corte no encontrado.' }, 404);
  if (cut.userId !== userId) return c.json({ error: 'Sin permiso.' }, 403);
  return c.json(cut);
});

router.put('/:id', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Body inválido.' }, 400);

  const db = createDbClient(c.env.DB);
  const { userId } = c.get('user');
  const cut = await db.select().from(cuts).where(eq(cuts.id, c.req.param('id'))).get();
  if (!cut) return c.json({ error: 'Corte no encontrado.' }, 404);
  if (cut.userId !== userId) return c.json({ error: 'Sin permiso.' }, 403);

  const parsed = cutSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: 'Datos inválidos.' }, 400);

  const data = parsed.data;
  await db.update(cuts)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.boardWidth !== undefined && { boardWidth: data.boardWidth }),
      ...(data.boardHeight !== undefined && { boardHeight: data.boardHeight }),
      ...(data.boardThick !== undefined && { boardThick: data.boardThick }),
      ...(data.boardQty !== undefined && { boardQty: data.boardQty }),
      ...(data.kerf !== undefined && { kerf: data.kerf }),
      ...(data.pieces !== undefined && { pieces: data.pieces }),
      ...(data.result !== undefined && { result: data.result }),
      updatedAt: new Date(),
    })
    .where(eq(cuts.id, c.req.param('id')));

  const updated = await db.select().from(cuts).where(eq(cuts.id, c.req.param('id'))).get();
  return c.json(updated);
});

router.delete('/:id', async (c) => {
  const db = createDbClient(c.env.DB);
  const { userId } = c.get('user');
  const cut = await db.select().from(cuts).where(eq(cuts.id, c.req.param('id'))).get();
  if (!cut) return c.json({ error: 'Corte no encontrado.' }, 404);
  if (cut.userId !== userId) return c.json({ error: 'Sin permiso.' }, 403);

  await db.delete(cuts).where(eq(cuts.id, c.req.param('id')));
  return c.body(null, 204);
});

export default router;

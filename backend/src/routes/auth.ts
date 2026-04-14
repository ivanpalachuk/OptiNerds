import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createDbClient } from '../db/index';
import { users } from '../db/schema';
import { hashPassword, verifyPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { requireAuth, type AppEnv } from '../middleware/auth';

const router = new Hono<AppEnv>();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Body inválido.' }, 400);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Datos inválidos.', details: parsed.error.flatten() }, 400);
  }

  const db = createDbClient(c.env.DB);
  const { email, name, password } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) return c.json({ error: 'El email ya está en uso.' }, 409);

  const hash = await hashPassword(password);
  const now = new Date();
  const id = crypto.randomUUID();

  await db.insert(users).values({ id, email, name, password: hash, createdAt: now, updatedAt: now });

  const token = await signToken(id, email, name, c.env.JWT_SECRET);
  return c.json({ token, user: { id, email, name, createdAt: now.toISOString() } }, 201);
});

router.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return c.json({ error: 'Body inválido.' }, 400);

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Datos inválidos.' }, 400);

  const db = createDbClient(c.env.DB);
  const { email, password } = parsed.data;

  const user = await db.select().from(users).where(eq(users.email, email)).get();
  if (!user) return c.json({ error: 'Email o contraseña incorrectos.' }, 401);

  const valid = await verifyPassword(password, user.password);
  if (!valid) return c.json({ error: 'Email o contraseña incorrectos.' }, 401);

  const token = await signToken(user.id, user.email, user.name, c.env.JWT_SECRET);
  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt!.toISOString() },
  });
});

router.get('/me', requireAuth, async (c) => {
  const { userId } = c.get('user');
  const db = createDbClient(c.env.DB);

  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) return c.json({ error: 'Usuario no encontrado.' }, 404);

  return c.json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt!.toISOString() });
});

export default router;

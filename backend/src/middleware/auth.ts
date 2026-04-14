import type { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';

export type AppEnv = {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    ALLOWED_ORIGINS: string;
  };
  Variables: {
    user: { userId: string; email: string; name: string };
  };
};

export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'No autorizado.' }, 401);
  }
  const token = header.slice(7);
  const payload = await verifyToken(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ error: 'Token inválido o expirado.' }, 401);
  }
  c.set('user', payload);
  await next();
}

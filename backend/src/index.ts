import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import cutsRoutes from './routes/cuts';
import type { AppEnv } from './middleware/auth';

const app = new Hono<AppEnv>();

app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: (origin) => {
      const allowed = (c.env?.ALLOWED_ORIGINS ?? 'http://localhost:5173')
        .split(',')
        .map((o: string) => o.trim());
      return allowed.includes(origin) ? origin : allowed[0];
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  return corsMiddleware(c, next);
});

app.get('/api/health', (c) => c.json({ status: 'ok', ts: Date.now() }));

app.route('/api/auth', authRoutes);
app.route('/api/cuts', cutsRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

export default app;

import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type DbClient = ReturnType<typeof createDbClient>;

export function createDbClient(database: D1Database) {
  return drizzle(database, { schema });
}

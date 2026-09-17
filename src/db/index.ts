import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { config } from '@/lib/config';
const globalDB = globalThis as unknown as { paperplanePool?: Pool };
export function database() {
  const pool = globalDB.paperplanePool ??= new Pool({ connectionString: config().databaseURL, max: 10 });
  return drizzle(pool, { schema });
}

// State setup only. All behavior assertions go through the web page or HTTP API.
import { Pool } from 'pg';
export async function fixtureSQL(text: string, values: unknown[]) {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('Dedicated test database required');
  const pool = new Pool({ connectionString: url });
  try { await pool.query(text, values); } finally { await pool.end(); }
}

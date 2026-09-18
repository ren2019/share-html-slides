import { Pool } from 'pg';
const url = process.env.DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith('_test')) throw new Error('Only a dedicated _test database may be reset');
const pool = new Pool({ connectionString: url });
try { await pool.query('TRUNCATE users, verifications, rate_limits, sms_cooldowns, email_registrations, email_cooldowns CASCADE'); } finally { await pool.end(); }

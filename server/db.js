import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

// node-pg returns NUMERIC columns (salaries, SSNF rates, leave-day counts,
// bonus amounts) as strings by default, to avoid silent precision loss on
// very large values. This app's frontend (hr-utils.js, Dashboard.jsx, the
// salary/bonus tabs) does plain JS arithmetic on these fields — e.g.
// `s + (e.current_salary || 0)` for the average-salary stat — which silently
// string-concatenates instead of adding if the value arrives as a string.
// Parsing NUMERIC (OID 1700) as a float here, once, is safer than chasing
// that bug across every call site.
pg.types.setTypeParser(1700, (val) => (val === null ? null : parseFloat(val)));

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] DATABASE_URL is not set. On Replit, add a Postgres database from the ' +
    'Tools panel — it sets DATABASE_URL automatically. Locally, set it in .env.'
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
});

export async function query(text, params) {
  return pool.query(text, params);
}

// Idempotently applies schema.sql on boot so a fresh Replit Postgres
// database (or a local one) is ready with no manual migration step.
export async function ensureSchema() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);
}

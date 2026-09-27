import { sql } from "@vercel/postgres";

let initialized = false;

export async function initializeDatabase() {
  if (initialized) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS invites (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      used_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS invites_code_idx
    ON invites(code)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS invites_status_idx
    ON invites(status)
  `;

  initialized = true;
}

export { sql };

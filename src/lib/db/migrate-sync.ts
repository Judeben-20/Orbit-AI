import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is missing from .env.local");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log("⚡ Syncing Neon Database schema...");

  try {
    // 1. Extensions
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

    // 2. Agents table
    await sql`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar_seed TEXT NOT NULL DEFAULT 'orbit',
        instructions TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_seed TEXT NOT NULL DEFAULT 'orbit';`;
    await sql`ALTER TABLE agents ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;`;

    // 3. Messages table
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        parts JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 4. Connections table
    await sql`
      CREATE TABLE IF NOT EXISTS connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        app_slug TEXT NOT NULL,
        composio_connected_account_id TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 5. Agent Connections table
    await sql`
      CREATE TABLE IF NOT EXISTS agent_connections (
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE CASCADE
      );
    `;

    // 6. Routines table
    await sql`
      CREATE TABLE IF NOT EXISTS routines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        cron TEXT NOT NULL,
        timezone TEXT NOT NULL,
        required_apps TEXT[],
        status TEXT NOT NULL,
        next_run_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    // 7. Routine Runs table
    await sql`
      CREATE TABLE IF NOT EXISTS routine_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        started_at TIMESTAMP NOT NULL DEFAULT NOW(),
        finished_at TIMESTAMP,
        output TEXT,
        error TEXT
      );
    `;

    // 8. Usage table
    await sql`
      CREATE TABLE IF NOT EXISTS usage (
        user_id TEXT NOT NULL,
        period TEXT NOT NULL,
        tokens_used INTEGER NOT NULL DEFAULT 0,
        runs_used INTEGER NOT NULL DEFAULT 0
      );
    `;

    console.log("✅ Neon Database schema successfully synced!");
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  }
}

main();

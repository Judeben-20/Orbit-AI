import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Don't throw at runtime if env var is missing during build
const sql = neon(process.env.DATABASE_URL || 'postgres://user:pass@host/db');
export const db = drizzle(sql, { schema });

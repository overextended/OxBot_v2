import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import * as relations from './relations';
import { env } from '@/env';

const sqlite = new Database(env.DB_FILE_NAME ?? 'data.db');

export const db = drizzle({ client: sqlite, schema: { ...schema, ...relations } });

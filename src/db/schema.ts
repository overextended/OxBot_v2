import { sql } from 'drizzle-orm';
import { integer, text, sqliteTable, index } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
  id: text({ length: 20 }).primaryKey(),
  warns: integer().default(0).notNull(),
  timeouts: integer().default(0).notNull(),
  joinedAt: integer('joined_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const bansTable = sqliteTable(
  'bans',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    reason: text().notNull(),
    issuerId: text('issuer_id', { length: 20 }).notNull(),
    targetId: text('target_id', { length: 20 })
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    issuedAt: integer('issued_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [index('idx_bans_targetid').on(t.targetId), index('idx_bans_issuerid').on(t.issuerId)],
);

export const warnsTable = sqliteTable(
  'warns',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    reason: text().notNull(),
    issuerId: text('issuer_id', { length: 20 }).notNull(),
    targetId: text('target_id', { length: 20 })
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    issuedAt: integer('issued_at', { mode: 'timestamp' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (t) => [index('idx_warns_targetid').on(t.targetId), index('idx_warns_issuerid').on(t.issuerId)],
);

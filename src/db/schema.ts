import { sql } from 'drizzle-orm';
import { integer, text, sqliteTable, index } from 'drizzle-orm/sqlite-core';

export const usersTable = sqliteTable('users', {
  id: text({ length: 20 }).primaryKey(),
  joinedAt: integer('joined_at', { mode: 'timestamp' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const bansTable = sqliteTable(
  'bans',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    reason: text().notNull(),
    issuerId: text('issuer_id', { length: 20 })
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    targetId: text('target_id', { length: 20 })
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    issuedAt: integer('issued_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    revokedBy: text('revoked_by', { length: 20 }).references(() => usersTable.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  },
  (t) => [index('idx_bans_targetid').on(t.targetId), index('idx_bans_issuerid').on(t.issuerId)],
);

export const kicksTable = sqliteTable(
  'kicks',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    reason: text().notNull(),
    issuerId: text('issuer_id', { length: 20 })
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    targetId: text('target_id', { length: 20 })
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    issuedAt: integer('issued_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    revokedBy: text('revoked_by', { length: 20 }).references(() => usersTable.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  },
  (t) => [index('idx_kicks_targetid').on(t.targetId), index('idx_kicks_issuerid').on(t.issuerId)],
);

export const warnsTable = sqliteTable(
  'warns',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    reason: text().notNull(),
    issuerId: text('issuer_id', { length: 20 })
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    targetId: text('target_id', { length: 20 })
      .notNull()
      .references(() => usersTable.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    issuedAt: integer('issued_at', { mode: 'timestamp' })
      .default(sql`(unixepoch())`)
      .notNull(),
    revokedAt: integer('revoked_at', { mode: 'timestamp' }),
    revokedBy: text('revoked_by', { length: 20 }).references(() => usersTable.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  },
  (t) => [index('idx_warns_targetid').on(t.targetId), index('idx_warns_issuerid').on(t.issuerId)],
);

export const guildInvitesTable = sqliteTable(
  'guildInvites',
  {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    invite: text().notNull().unique(),
    addedAt: integer('added_at', { mode: 'timestamp' }),
    addedBy: text('added_by', { length: 20 }).references(() => usersTable.id, {
      onDelete: 'restrict',
      onUpdate: 'cascade',
    }),
  },
  (t) => [index('idx_guildinvites_name').on(t.name)],
);

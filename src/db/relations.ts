import { relations } from 'drizzle-orm';
import { bansTable, kicksTable, usersTable, warnsTable } from './schema';

export const userRelations = relations(usersTable, ({ many }) => ({
  bans: many(bansTable),
  kicks: many(kicksTable),
  warns: many(warnsTable),
}));

export const warnRelations = relations(warnsTable, ({ one }) => ({
  target: one(usersTable, {
    fields: [warnsTable.targetId],
    references: [usersTable.id],
  }),
  issuer: one(usersTable, {
    fields: [warnsTable.issuerId],
    references: [usersTable.id],
  }),
}));

export const kickRelations = relations(kicksTable, ({ one }) => ({
  target: one(usersTable, {
    fields: [kicksTable.targetId],
    references: [usersTable.id],
  }),
  issuer: one(usersTable, {
    fields: [kicksTable.issuerId],
    references: [usersTable.id],
  }),
}));

export const banRelations = relations(bansTable, ({ one }) => ({
  target: one(usersTable, {
    fields: [bansTable.targetId],
    references: [usersTable.id],
  }),
  issuer: one(usersTable, {
    fields: [bansTable.issuerId],
    references: [usersTable.id],
  }),
}));

import { relations } from 'drizzle-orm';
import { bansTable, usersTable, warnsTable } from './schema';

export const userRelations = relations(usersTable, ({ many }) => ({
  bans: many(bansTable),
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

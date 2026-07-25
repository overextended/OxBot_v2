// relations.ts
import { relations } from 'drizzle-orm';
import { bansTable, kicksTable, usersTable, warnsTable } from './schema';

export const userRelations = relations(usersTable, ({ many }) => ({
  bans: many(bansTable, { relationName: 'targetUserBans' }),
  bansIssued: many(bansTable, { relationName: 'issuerUserBans' }),
  bansRevoked: many(bansTable, { relationName: 'revokedUserBans' }),

  kicks: many(kicksTable, { relationName: 'targetUserKicks' }),
  kicksIssued: many(kicksTable, { relationName: 'issuerUserKicks' }),
  kicksRevoked: many(kicksTable, { relationName: 'revokedUserKicks' }),

  warns: many(warnsTable, { relationName: 'targetUserWarns' }),
  warnsIssued: many(warnsTable, { relationName: 'issuerUserWarns' }),
  warnsRevoked: many(warnsTable, { relationName: 'revokedUserWarns' }),
}));

export const warnRelations = relations(warnsTable, ({ one }) => ({
  target: one(usersTable, {
    fields: [warnsTable.targetId],
    references: [usersTable.id],
    relationName: 'targetUserWarns',
  }),
  issuer: one(usersTable, {
    fields: [warnsTable.issuerId],
    references: [usersTable.id],
    relationName: 'issuerUserWarns',
  }),
  revoker: one(usersTable, {
    fields: [warnsTable.revokedBy],
    references: [usersTable.id],
    relationName: 'revokedUserWarns',
  }),
}));

export const kickRelations = relations(kicksTable, ({ one }) => ({
  target: one(usersTable, {
    fields: [kicksTable.targetId],
    references: [usersTable.id],
    relationName: 'targetUserKicks',
  }),
  issuer: one(usersTable, {
    fields: [kicksTable.issuerId],
    references: [usersTable.id],
    relationName: 'issuerUserKicks',
  }),
  revoker: one(usersTable, {
    fields: [kicksTable.revokedBy],
    references: [usersTable.id],
    relationName: 'revokedUserKicks',
  }),
}));

export const banRelations = relations(bansTable, ({ one }) => ({
  target: one(usersTable, {
    fields: [bansTable.targetId],
    references: [usersTable.id],
    relationName: 'targetUserBans',
  }),
  issuer: one(usersTable, {
    fields: [bansTable.issuerId],
    references: [usersTable.id],
    relationName: 'issuerUserBans',
  }),
  revoker: one(usersTable, {
    fields: [bansTable.revokedBy],
    references: [usersTable.id],
    relationName: 'revokedUserBans',
  }),
}));

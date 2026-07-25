import { db } from '@/db';
import { usersTable, warnsTable, kicksTable, bansTable } from '@/db/schema';
import { logger } from '@/utils/logger';

async function seed() {
  logger.info('[Seed] Starting database seeding...');

  const users = [
    {
      id: '136784209149689856', // Admin / Moderator
      joinedAt: new Date('2023-01-15T10:00:00Z'),
    },
    {
      id: '395124362409148416', // Serial Offender (Multiple warnings & ban)
      joinedAt: new Date('2023-05-20T14:30:00Z'),
    },
    {
      id: '995715732954431488', // Kicked User
      joinedAt: new Date('2024-02-10T09:15:00Z'),
    },
    {
      id: '1519707930440499300', // Clean Member (1 minor warning)
      joinedAt: new Date('2024-06-01T18:45:00Z'),
    },
  ];

  await db.insert(usersTable).values(users).onConflictDoNothing();
  logger.info(`[Seed] Seeded ${users.length} users.`);

  const warns = [
    {
      reason: 'Spamming emotes in general chat',
      issuerId: '136784209149689856',
      targetId: '395124362409148416',
      issuedAt: new Date('2024-03-01T12:00:00Z'),
    },
    {
      reason: 'Inappropriate profile picture / status',
      issuerId: '136784209149689856',
      targetId: '395124362409148416',
      issuedAt: new Date('2024-03-15T16:20:00Z'),
    },
    {
      reason: 'Excessive caps usage after verbal warning',
      issuerId: '136784209149689856',
      targetId: '1519707930440499300',
      issuedAt: new Date('2024-06-10T20:00:00Z'),
    },
  ];

  await db.insert(warnsTable).values(warns);
  logger.info(`[Seed] Seeded ${warns.length} warnings.`);

  const kicks = [
    {
      reason: 'Advertising external Discord server in DMs',
      issuerId: '136784209149689856',
      targetId: '995715732954431488',
      issuedAt: new Date('2024-04-05T11:10:00Z'),
    },
    {
      reason: 'Refusing to stop argument in #general',
      issuerId: '136784209149689856',
      targetId: '395124362409148416',
      issuedAt: new Date('2024-04-12T15:45:00Z'),
    },
  ];

  await db.insert(kicksTable).values(kicks);
  logger.info(`[Seed] Seeded ${kicks.length} kicks.`);

  const bans = [
    {
      reason: 'Repeated rule violations & harassment after multiple warnings/kicks',
      issuerId: '136784209149689856',
      targetId: '395124362409148416',
      issuedAt: new Date('2024-05-01T09:00:00Z'),
    },
  ];

  await db.insert(bansTable).values(bans);
  logger.info(`[Seed] Seeded ${bans.length} bans.`);

  logger.info('[Seed] Seeding completed successfully!');
}

seed().catch((err) => {
  logger.error('[Seed] Seeding failed:', err);
  process.exit(1);
});

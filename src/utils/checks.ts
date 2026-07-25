import type { Guild, GuildMember, User } from 'discord.js';
import { eq } from 'drizzle-orm';
import { BotClient } from '@/client';
import { db } from '@/db';
import { usersTable } from '@/db/schema';
import { env } from '@/env';

type UserCheckPayload =
  { client: BotClient; user: User; member?: never } | { client: BotClient; member: GuildMember; user?: never };

export async function checkUserIsLogged(payload: UserCheckPayload) {
  const { client } = payload;
  const userId = 'user' in payload && payload.user ? payload.user.id : payload.member.id;

  const exists = db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, userId)).get();

  if (exists) return;

  let guildMember: GuildMember | null = 'member' in payload && payload.member ? payload.member : null;

  if (!guildMember) {
    try {
      const guild = await client.guilds.fetch(env.GUILD_ID);
      guildMember = await guild.members.fetch(userId);
    } catch {
      guildMember = null;
    }
  }

  const result = await db
    .insert(usersTable)
    .values({
      id: userId,
      joinedAt: guildMember?.joinedAt ?? undefined,
    })
    .returning();

  if (!result.length) {
    throw new Error(`Unable to add user ${userId} to database`);
  }
}

export async function isUserInGuild(guild: Guild, userId: string): Promise<GuildMember | null> {
  try {
    return await guild.members.fetch(userId);
  } catch {
    return null;
  }
}

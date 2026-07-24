import { User } from 'discord.js';
import { eq } from 'drizzle-orm';
import { BotClient } from '@/client';
import { db } from '@/db';
import { usersTable } from '@/db/schema';
import { env } from '@/env';

export async function checkUserIsLogged(client: BotClient, user: User) {
  const exists = db
    .select({
      id: usersTable.id,
    })
    .from(usersTable)
    .where(eq(usersTable.id, user.id))
    .get();

  if (exists) return;

  const guildMember = await (await client.guilds.fetch(env.GUILD_ID)).members.fetch(user.id);

  const result = await db
    .insert(usersTable)
    .values({
      id: user.id,
      joinedAt: guildMember?.joinedAt ?? undefined,
    })
    .returning();

  if (!result) throw new Error(`Unable to add user ${user.id} to database`);
}

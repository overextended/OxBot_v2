import { env } from '@/env';
import { BotEvent } from '@/types';
import { checkUserIsLogged } from '@/utils/checks';
import config from '@/utils/config';
import { logger } from '@/utils/logger';
import { MessageFlags } from 'discord.js';

export default {
  name: 'guildMemberAdd',
  once: false,
  execute: async (client, member) => {
    await checkUserIsLogged({ client, member });

    const guild = await client.guilds.fetch(env.GUILD_ID);
    for (const roleId of config.roles.member) {
      const role = await guild.roles.fetch(roleId);

      if (!role) continue;

      member.roles.add(role, 'Default roles');
    }
  },
} satisfies BotEvent<'guildMemberAdd'>;

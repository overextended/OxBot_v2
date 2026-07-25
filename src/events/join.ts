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
    try {
      await checkUserIsLogged({ client, member });

      const guild = await client.guilds.fetch(env.GUILD_ID);
      for (const roleId of config.roles.member) {
        const role = await guild.roles.fetch(roleId);

        if (!role) continue;

        member.roles.add(role, 'Default roles');
      }

      const channel = await client.channels.fetch(config.channels.joinleavelog);

      if (!channel || !channel.isSendable()) {
        logger.error(
          `[Event Join] Join/Leave log channel (${config.channels.joinleavelog}) is missing or not sendable.`,
        );
        return;
      }

      channel.send(`<@${member.id}> joined - created at: <t:${Math.floor(member.user.createdTimestamp / 1000)}:S>`);
    } catch (err) {
      logger.error('[Event Join] Unable to process join for member', member.id, (err as Error).message);
    }
  },
} satisfies BotEvent<'guildMemberAdd'>;

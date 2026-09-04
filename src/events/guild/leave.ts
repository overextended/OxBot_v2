import { BotEvent } from '@/types';
import config from '@/utils/config';
import { logger } from '@/utils/logger';

export default {
  name: 'guildMemberRemove',
  once: false,
  execute: async (client, member) => {
    try {
      const channel = await client.channels.fetch(config.channels.joinleavelog);

      if (!channel || !channel.isSendable()) {
        logger.error(
          `[Event Join] Join/Leave log channel (${config.channels.joinleavelog}) is missing or not sendable.`,
        );
        return;
      }

      channel.send(`<@${member.id}> left - created at: <t:${Math.floor(member.user.createdTimestamp / 1000)}:S>`);
    } catch (err) {
      logger.error('[Event Join] Unable to process leave for member', member.id, (err as Error).message);
    }
  },
} satisfies BotEvent<'guildMemberRemove'>;

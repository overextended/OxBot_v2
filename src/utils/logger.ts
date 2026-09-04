import { BotClient } from '@/client';
import { env } from '@/env';
import config from './config';
import { ColorResolvable, EmbedBuilder, User } from 'discord.js';

const createLogger = () => {
  const isDevelopment = env.NODE_ENV === 'development';

  return {
    debug: (...args: unknown[]) => {
      if (isDevelopment) {
        console.log('[DEBUG]', ...args);
      }
    },
    info: (...args: unknown[]) => {
      console.log('[INFO]', ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn('[WARN]', ...args);
    },
    error: (...args: unknown[]) => {
      console.error('[ERROR]', ...args);
    },
    logdiscord: async (
      client: BotClient,
      payload: { title: string; description: string; user?: User; color?: ColorResolvable },
    ) => {
      try {
        const channel = await client.channels.fetch(config.channels.actionlog);

        if (!channel || !channel.isSendable()) {
          console.error(`[ERROR] Action log channel (${config.channels.actionlog}) is missing or not sendable.`);
          return;
        }

        const embed = new EmbedBuilder()
          .setTitle(payload.title)
          .setDescription(payload.description)
          .setColor(payload.color ?? '#c5a279')
          .setTimestamp();

        if (payload.user) {
          embed.setAuthor({
            name: `${payload.user.username} (${payload.user.id})`,
            iconURL: payload.user.displayAvatarURL(),
          });
        }

        await channel.send({ embeds: [embed] });
      } catch (error) {
        logger.error(`[ERROR] Failed to send action log to Discord: ${error}`);
      }
    },
  };
};

export const logger = createLogger();

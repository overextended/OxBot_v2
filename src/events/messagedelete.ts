import { env } from '@/env';
import { BotEvent } from '@/types';
import { checkUserIsLogged } from '@/utils/checks';
import config from '@/utils/config';
import { logger } from '@/utils/logger';
import { Attachment, EmbedBuilder, MessageFlags, TextChannel } from 'discord.js';

export default {
  name: 'messageDelete',
  once: false,
  execute: async (client, message) => {
    if (message.partial) {
      try {
        await message.fetch();
      } catch (error) {
        logger.error('[Event Message Delete] Error fetching the message:', error);
        return;
      }
    }

    try {
      if (!message.guild) return;

      const content = message.content || '**NO MESSAGE SENT**';
      const authorId = message.author?.id || 'Unknown ID';
      const messageId = message.id || 'Unknown ID';

      // Truncate message content if it exceeds the description's 4096 characters limit
      const messageContent = content.length > 4093 ? content.substring(0, 4093) + '...' : content;

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setDescription(
          `**Message sent by <@${authorId}> in ${message.channel.toString()} was deleted.**\n${messageContent}\n`,
        )
        .setFooter({ text: `Author ID: ${authorId} | Message ID: ${messageId}`.substring(0, 2048) })
        .setTimestamp(message.createdTimestamp)
        .setAuthor({
          name: (message.author?.username || 'Unknown Username').substring(0, 256),
          iconURL: message.author?.displayAvatarURL() || undefined,
        });

      let i = 0;
      message.attachments.forEach((attachment: Attachment) => {
        if (i < 25) {
          if (attachment.url) {
            embed.addFields({
              name: `Attachment ${i + 1}`.substring(0, 256),
              value: attachment.url.substring(0, 1024),
            });
            i++;
          }
        }
      });

      const logChannel = client.channels.cache.get(config.channels.messagelog);

      if (!logChannel || !logChannel.isSendable()) {
        logger.error(
          `[Event Message Delete] Message log channel (${config.channels.messagelog}) is missing or not sendable.`,
        );
        return;
      }

      if (logChannel) {
        try {
          logChannel.send({ embeds: [embed] });
        } catch (error) {
          logger.error('[Event Message Delete] Error sending embed:', error);
        }
      }
    } catch (err) {
      logger.error('[Event Message Delete] Unable to process message delete', message.id, (err as Error).message);
    }
  },
} satisfies BotEvent<'messageDelete'>;

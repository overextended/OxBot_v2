import { BotEvent } from '@/types';
import config from '@/utils/config';
import { logger } from '@/utils/logger';
import { AuditLogEvent, EmbedBuilder } from 'discord.js';

export default {
  name: 'guildAuditLogEntryCreate',
  once: false,
  execute: async (client, auditLogEntry, guild) => {
    try {
      if (AuditLogEvent.MemberBanRemove !== auditLogEntry.action) return;

      if (!auditLogEntry.executorId || !auditLogEntry.targetId) {
        return logger.info('[Event Member Unban] Executor ID or target ID is missing from the audit log entry.');
      }

      // skip logging for VVarden bans (in case it's used again)
      if (auditLogEntry.executorId === '874059310869655662') return;

      const executor = await guild.client.users.fetch(auditLogEntry.executorId);
      const targetUser = await guild.client.users.fetch(auditLogEntry.targetId);

      if (!executor || !targetUser) {
        return logger.info('[Event Member Unban] Executor or target user is missing from the audit log entry.');
      }

      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('Member Unbanned')
        .setDescription(`<@${targetUser.id}> has been **unbanned** by <@${executor.id}>.`)
        .addFields({ name: 'Reason', value: auditLogEntry.reason || 'No reason provided.' })
        .setAuthor({
          name: targetUser.username || 'Unknown Username',
          iconURL: targetUser.displayAvatarURL(),
        })
        .setTimestamp(auditLogEntry.createdAt)
        .setFooter({ text: `Member ID: ${targetUser.id}` })
        .setThumbnail(targetUser.displayAvatarURL());

      const channel = guild.channels.cache.get(config.channels.actionlog);

      if (!channel || !channel.isSendable()) {
        logger.error(
          `[Event Member Unban] Action log channel (${config.channels.messagelog}) is missing or not sendable.`,
        );
        return;
      }

      if (channel) {
        try {
          channel.send({ embeds: [embed] });
        } catch (error) {
          logger.error('[Event Member Unban] Error sending embed:', error);
        }
      }
    } catch (err) {
      logger.error('[Event Member Unban] Unable to process unban', auditLogEntry.id, (err as Error).message);
    }
  },
} satisfies BotEvent<'guildAuditLogEntryCreate'>;

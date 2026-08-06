import { db } from '@/db';
import { kicksTable } from '@/db/schema';
import { BotEvent } from '@/types';
import { checkUserIsLogged } from '@/utils/checks';
import config from '@/utils/config';
import { logger } from '@/utils/logger';
import { AuditLogEvent, EmbedBuilder } from 'discord.js';

export default {
  name: 'guildAuditLogEntryCreate',
  once: false,
  execute: async (client, auditLogEntry, guild) => {
    try {
      if (AuditLogEvent.MemberKick !== auditLogEntry.action) return;

      if (!auditLogEntry.executorId || !auditLogEntry.targetId) {
        return logger.info('[Event Member Kick] Executor ID or target ID is missing from the audit log entry.');
      }

      // skip when bot executes it as it'll already be logged by the command
      if (auditLogEntry.executorId === client.user.id) return;
      // skip logging for VVarden bans (in case it's used again)
      if (auditLogEntry.executorId === '874059310869655662') return;

      const executor = await guild.client.users.fetch(auditLogEntry.executorId);
      const targetUser = await guild.client.users.fetch(auditLogEntry.targetId);

      if (!executor || !targetUser) {
        return logger.info('[Event Member Kick] Executor or target user is missing from the audit log entry.');
      }

      const reason = auditLogEntry.reason || 'No reason provided.';

      await checkUserIsLogged({ client, user: targetUser });
      await db.insert(kicksTable).values({
        reason: reason,
        issuerId: executor.id,
        targetId: targetUser.id,
      });

      const embed = new EmbedBuilder()
        .setColor('#ffa500')
        .setTitle('Member Kicked')
        .setDescription(`<@${targetUser.id}> has been **kicked** by <@${executor.id}>.`)
        .addFields({ name: 'Reason', value: reason })
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
          `[Event Member Kick] Action log channel (${config.channels.messagelog}) is missing or not sendable.`,
        );
        return;
      }

      if (channel) {
        try {
          channel.send({ embeds: [embed] });
        } catch (error) {
          logger.error('[Event Member Kick] Error sending embed:', error);
        }
      }
    } catch (err) {
      logger.error('[Event Member Kick] Unable to process kick', auditLogEntry.id, (err as Error).message);
    }
  },
} satisfies BotEvent<'guildAuditLogEntryCreate'>;

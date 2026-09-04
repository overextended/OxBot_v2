import { EmbedBuilder } from 'discord.js';
import { db } from '@/db';
import { bansTable, scamImageHashesTable } from '@/db/schema';
import { env } from '@/env';
import { BotEvent } from '@/types';
import { checkUserIsLogged } from '@/utils/checks';
import config from '@/utils/config';
import { logger } from '@/utils/logger';
import { calculateDistance, computeAttachmentHash } from '@/utils/images';

const SIMILARITY_THRESHOLD = config.antiscam.threshold;

export default {
  name: 'messageCreate',
  once: false,
  execute: async (client, message) => {
    const { guild, author, attachments, member } = message;

    if (!guild || guild.id !== env.GUILD_ID) return;
    if (author.bot) return;
    if (!attachments || attachments.size === 0) return;

    try {
      const targetMember = member || (await guild.members.fetch(author.id).catch(() => null));
      if (!targetMember) return;

      const me = guild.members.me || (await guild.members.fetchMe());
      const canManageMessages = me.permissions.has('ManageMessages');
      const isBannable = targetMember.bannable;

      const maliciousHashes = db.select().from(scamImageHashesTable).all();
      if (maliciousHashes.length === 0) return;

      let isMatchFound = false;

      for (const [_, attachment] of attachments) {
        const imageHash = await computeAttachmentHash(attachment);
        if (!imageHash) continue;

        for (const target of maliciousHashes) {
          const distance = calculateDistance(imageHash, target.hash);

          if (distance <= SIMILARITY_THRESHOLD) {
            isMatchFound = true;
            logger.info(`[Anti-Scam] Match found for ${author.tag} (${author.id}). Distance: ${distance}`);
            break;
          }
        }

        if (isMatchFound) break;
      }

      if (!isMatchFound) return;

      const logChannel = guild.channels.cache.get(config.channels.actionlog);
      const reason = '[Anti-Scam] Compromised account sending flagged scam images.';

      if (!isBannable) {
        logger.warn(`[Anti-Scam] Target ${author.tag} (${author.id}) is not bannable (Role hierarchy or Owner).`);

        if (canManageMessages) {
          await message.delete().catch((err) => logger.error('[Anti-Scam] Failed to delete message:', err));
        }

        if (targetMember.moderatable) {
          await targetMember.timeout(24 * 60 * 60_000, `${reason} (Member Unbannable)`).catch(() => null);
        }

        if (logChannel && logChannel.isSendable()) {
          const alertEmbed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('Scam Detected (Member Unbannable)')
            .setDescription(
              `<@${author.id}> posted a flagged scam image but **could not be softbanned** due to role hierarchy.\n` +
                `**Actions Taken:** Message deleted${targetMember.moderatable ? ' & user timed out' : ''}.`,
            )
            .setAuthor({
              name: targetMember.user.tag,
              iconURL: targetMember.user.displayAvatarURL(),
            })
            .setThumbnail(targetMember.user.displayAvatarURL())
            .setFooter({ text: `Member ID: ${author.id}` })
            .setTimestamp();

          await logChannel
            .send({ embeds: [alertEmbed] })
            .catch((err) => logger.error('[Anti-Scam] Error sending log:', err));
        }
        return;
      }

      await checkUserIsLogged({ client, user: author });

      await guild.members.ban(author.id, {
        deleteMessageSeconds: 1 * 86_400,
        reason,
      });

      await guild.members.unban(author.id, reason);

      await db.insert(bansTable).values({
        reason,
        issuerId: client.user.id,
        targetId: author.id,
      });

      if (logChannel && logChannel.isSendable()) {
        const banEmbed = new EmbedBuilder()
          .setColor('#ff9900')
          .setTitle('Scam Detected')
          .setDescription(`<@${author.id}> was automatically softbanned for posting scam images.`)
          .setAuthor({
            name: targetMember.user.tag,
            iconURL: targetMember.user.displayAvatarURL(),
          })
          .setThumbnail(targetMember.user.displayAvatarURL())
          .setFooter({ text: `Member ID: ${author.id}` })
          .setTimestamp();

        await logChannel
          .send({ embeds: [banEmbed] })
          .catch((err) => logger.error('[Anti-Scam] Error sending log:', err));
      }

      logger.info(`[Anti-Scam] Softbanned compromised user ${author.tag} (${author.id}).`);
    } catch (err) {
      logger.error('[Anti-Scam] Unable to process image scan for', author.id, (err as Error).message);
    }
  },
} satisfies BotEvent<'messageCreate'>;

import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '@/types';
import { logger } from '@/utils/logger';
import { db } from '@/db';
import { checkUserIsLogged } from '@/utils/checks';
import { bansTable, kicksTable, warnsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function revokeAction(action: string, id: number, authorId: string) {
  const tableMap = {
    warn: warnsTable,
    kick: kicksTable,
    ban: bansTable,
  } as const;

  const targetTable = tableMap[action];
  if (!targetTable) return null;

  const [updatedRecord] = await db
    .update(targetTable)
    .set({
      revokedAt: new Date(),
      revokedBy: authorId,
    })
    .where(eq(targetTable.id, id))
    .returning();

  return updatedRecord ?? null;
}

export default {
  data: new SlashCommandBuilder()
    .setName('revoke')
    .setDescription('Revoke a moderation action against a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) =>
      o
        .setName('action')
        .setDescription('The the action')
        .setRequired(true)
        .setChoices({ value: 'warn', name: 'Warn' }, { value: 'kick', name: 'Kick' }, { value: 'ban', name: 'Ban' }),
    )
    .addIntegerOption((o) =>
      o.setName('id').setDescription('The ID of the action to revoke').setRequired(true).setMinValue(1),
    ),

  execute: async (interaction, client) => {
    const { guild, options, user: author } = interaction;
    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a guild.', flags: MessageFlags.Ephemeral });
      return;
    }

    const action = options.getString('action', true);
    const actionId = options.getInteger('id', true);

    try {
      await checkUserIsLogged({ client, user: author });

      const record = await revokeAction(action, actionId, author.id);

      if (!record) {
        await interaction.reply({
          content: `Could not find an active **${action}** with ID \`${actionId}\`.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await logger.logdiscord(client, {
        title: 'Action Revoked',
        description:
          `<@${author.id}> revoked <@${record.targetId}>'s **${action}** (ID: \`${actionId}\`).\n` +
          `**Original Reason:** ${record.reason}`,
      });

      await interaction.reply({
        content: `<@${record.targetId}>'s **${action}** (ID: \`${actionId}\`) has been revoked.\n**Original Reason:** ${record.reason}`,
        flags: MessageFlags.Ephemeral,
      });

      logger.info(
        `[Command Revoke] ${author.username} (${author.id}) revoked ${action} #${actionId} for user (reason: ${record.reason})`,
      );
    } catch (error) {
      logger.error(`[Command Revoke] Failed to execute revoke ${action}`, error);
      await interaction.reply({
        content: 'An error occurred while processing the revoke.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
} satisfies Command;

import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '@/types';
import { logger } from '@/utils/logger';
import { db } from '@/db';
import { kicksTable } from '@/db/schema';
import { checkUserIsLogged } from '@/utils/checks';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName('user').setDescription('The user to kick').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('The reason for the kick').setRequired(false)),

  execute: async (interaction, client) => {
    const { guild, options, user: author } = interaction;
    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a guild.', flags: MessageFlags.Ephemeral });
      return;
    }

    const offender = options.getUser('user', true);
    const reasonOption = options.getString('reason');
    const reason = (reasonOption as string) || 'No reason provided';

    try {
      await guild.members.kick(offender, reason);

      await checkUserIsLogged(client, offender);
      await checkUserIsLogged(client, author);

      await db.insert(kicksTable).values({
        reason: reason,
        issuerId: author.id,
        targetId: offender.id,
      });

      await interaction.reply({ content: `<@${offender.id}> has been **kicked**. Reason: ${reason}` });

      logger.info(
        `[Command Kick] ${offender.username} (${offender.id}) was kicked by ${author.username} (${author.id})`,
      );
    } catch (error) {
      logger.error('[Command Kick] Failed to execute kick', error);
      await interaction.reply({
        content: 'An error occurred while processing the kick.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
} satisfies Command;

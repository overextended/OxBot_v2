import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '@/types';
import { logger } from '@/utils/logger';
import { db } from '@/db';
import { bansTable } from '@/db/schema';
import { checkUserIsLogged } from '@/utils/checks';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('The reason for the ban').setRequired(false))
    .addIntegerOption((o) =>
      o.setName('delete_message_days').setDescription('Number of days to delete messages for (0-7)').setRequired(false),
    ),

  execute: async (interaction, client) => {
    const { guild, options, user: author } = interaction;
    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a guild.', flags: MessageFlags.Ephemeral });
      return;
    }

    const offender = options.getUser('user', true);
    const reasonOption = options.getString('reason');
    const deleteMessageDaysOption = options.getInteger('delete_message_days');

    const reason = (reasonOption as string) || 'No reason provided';
    const deleteMessageDays = deleteMessageDaysOption || 0;

    try {
      const ban = await guild.bans.fetch(offender);
      if (ban) {
        await interaction.reply({
          content: `User (<@${offender.id}>) is already banned (reason: ${ban.reason ?? 'No reason provided'}).`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await guild.members.ban(offender, { reason, deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60 });

      await checkUserIsLogged({ client, user: offender });
      await checkUserIsLogged({ client, user: author });

      await db.insert(bansTable).values({
        reason: reason,
        issuerId: author.id,
        targetId: offender.id,
      });

      await logger.logdiscord(client, {
        user: offender,
        title: 'Member Banned',
        description: `<@${offender.id}> (${offender.username}) was banned by <@${author.id}>.\n**Reason:** ${reason}`,
        color: 'Red',
      });

      await interaction.reply({ content: `<@${offender.id}> has been **banned**. Reason: ${reason}` });

      logger.info(
        `[Command Ban] ${offender.username} (${offender.id}) was banned by ${author.username} (${author.id})`,
      );
    } catch (error) {
      logger.error('[Command Ban] Failed to execute ban', error);
      await interaction.reply({
        content: 'An error occurred while processing the ban.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
} satisfies Command;

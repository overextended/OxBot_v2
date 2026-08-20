import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '@/types';
import { logger } from '@/utils/logger';
import { db } from '@/db';
import { bansTable } from '@/db/schema';
import { checkUserIsLogged } from '@/utils/checks';

export default {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Soft ban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('user').setDescription('The user to ban').setRequired(true))
    .addIntegerOption((o) =>
      o
        .setName('delete_message')
        .setDescription('Delete messages of the last')
        .setRequired(true)
        .setChoices(
          { value: 0, name: 'Skip' },
          { value: 1, name: '1 Hour' },
          { value: 6, name: '6 Hours' },
          { value: 12, name: '12 Hours' },
          { value: 24, name: '1 Day' },
          { value: 24 * 3, name: '3 Days' },
          { value: 24 * 7, name: '7 Days' },
        ),
    )
    .addStringOption((o) => o.setName('reason').setDescription('The reason for the ban').setRequired(false)),

  execute: async (interaction, client) => {
    const { guild, options, user: author } = interaction;
    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a guild.', flags: MessageFlags.Ephemeral });
      return;
    }

    const offender = options.getUser('user', true);
    const reasonOption = options.getString('reason');
    const deleteMessageOption = options.getInteger('delete_message');

    const reason = (reasonOption as string) || 'No reason provided';

    try {
      const ban = await guild.bans.fetch(offender);
      if (ban) {
        await interaction.reply({
          content: `User (<@${offender.id}>) is already banned (reason: ${ban.reason ?? 'No reason provided'}).`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await guild.members.ban(offender, { reason, deleteMessageSeconds: deleteMessageOption * 60 * 60 });

      await checkUserIsLogged({ client, user: offender });
      await checkUserIsLogged({ client, user: author });

      await db.insert(bansTable).values({
        soft: true,
        reason: reason,
        issuerId: author.id,
        targetId: offender.id,
      });

      await logger.logdiscord(client, {
        user: offender,
        title: 'Member Soft Banned',
        description: `<@${offender.id}> (${offender.username}) was soft banned by <@${author.id}>.\n**Reason:** ${reason}`,
        color: 'Red',
      });

      await interaction.reply({ content: `<@${offender.id}> has been **banned**. Reason: ${reason}` });

      setTimeout(async () => {
        await guild.members.unban(offender.id, `[Softban] Reason: ${reason}`);
      }, 60_000);

      logger.info(
        `[Command SoftBan] ${offender.username} (${offender.id}) was soft banned by ${author.username} (${author.id})`,
      );
    } catch (error) {
      logger.error('[Command SoftBan] Failed to execute ban', error);
      await interaction.reply({
        content: 'An error occurred while processing the soft ban.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
} satisfies Command;

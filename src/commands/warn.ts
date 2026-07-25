import { GuildMember, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '@/types';
import { logger } from '@/utils/logger';
import { db } from '@/db';
import { warnsTable } from '@/db/schema';
import { checkUserIsLogged, isUserInGuild } from '@/utils/checks';
import { eq } from 'drizzle-orm';

async function calculateTimeoutDuration(id: string): Promise<{ seconds: number; minutes: number }> {
  const warnCount = await db.$count(warnsTable, eq(warnsTable.targetId, id));

  let minutes: number;

  switch (warnCount) {
    case 1:
      minutes = 5;
      break;
    case 2:
      minutes = 10;
      break;
    case 3:
      minutes = 60;
      break;
    default:
      minutes = 24 * 60;
      break;
  }

  return { seconds: minutes * 60000, minutes };
}

export default {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('The user to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('The reason for the warn').setRequired(false)),

  execute: async (interaction, client) => {
    const { guild, options, user: author } = interaction;
    if (!guild) {
      await interaction.reply({ content: 'This command can only be used in a guild.', flags: MessageFlags.Ephemeral });
      return;
    }

    const offender = options.getUser('user', true);
    const reasonOption = options.getString('reason');
    const reason = (reasonOption as string) || 'No reason provided';
    const { seconds, minutes } = await calculateTimeoutDuration(offender.id);

    try {
      const offenderMember = isUserInGuild(guild, offender.id);

      await checkUserIsLogged({ client, user: offender });
      await checkUserIsLogged({ client, user: author });

      await db.insert(warnsTable).values({
        reason: reason,
        issuerId: author.id,
        targetId: offender.id,
      });

      const memberStatus = offenderMember
        ? ''
        : '\n*Note: User is not in the server, but the warning was logged to their profile.*';

      await logger.logdiscord(client, {
        user: offender,
        title: 'Member Warned',
        description:
          `<@${offender.id}> was warned by <@${author.id}>.\n` +
          `**Reason:** ${reason}\n` +
          `**Duration:** ${minutes} minutes\n` +
          memberStatus,
        color: minutes <= 10 ? 'Orange' : 'DarkRed',
      });

      await interaction.reply({
        content:
          `<@${offender.id}> has been **warned**. Reason: *${reason}*.\n` +
          `Timeout applied: **${minutes}m**.${memberStatus}`,
        flags: MessageFlags.Ephemeral,
      });

      logger.info(
        `[Command Warn] ${offender.username} (${offender.id}) warned by ${author.username} (${author.id})` +
          ` | Duration: ${minutes}m | Reason: "${reason}"${offenderMember ? '' : ' | Offender was not on the server'}`,
      );
    } catch (error) {
      logger.error('[Command Warn] Failed to execute warn', error);

      await interaction.reply({
        content: 'An error occurred while processing the warn.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
} satisfies Command;

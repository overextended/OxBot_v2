import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  ComponentType,
  EmbedBuilder,
  InteractionResponse,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  User,
} from 'discord.js';
import type { Command } from '@/types';
import { logger } from '@/utils/logger';
import { db } from '@/db';

// infer query result dynamically
type OffenseData = NonNullable<
  Awaited<
    ReturnType<
      typeof db.query.usersTable.findFirst<{
        with: { warns: true; kicks: true; bans: true };
      }>
    >
  >
>;

function buildOverviewEmbed(user: User, offenseData: OffenseData): EmbedBuilder {
  const joinedTs = offenseData.joinedAt ? Math.floor(offenseData.joinedAt.getTime() / 1000) : null;

  return new EmbedBuilder()
    .setTitle(`Offense History: ${user.username ?? user.id}`)
    .setDescription(
      `**ID:** \`${user.id}\`\n` +
        `**Joined:** ${joinedTs ? `<t:${joinedTs}:F>` : 'Unknown'}\n\n` +
        `**Offenses:**\n` +
        `* Warns: \`${offenseData.warns.length}\`\n` +
        `* Kicks: \`${offenseData.kicks.length}\`\n` +
        `* Bans: \`${offenseData.bans.length}\``,
    )
    .setThumbnail(user.avatarURL({ size: 128, extension: 'webp' }))
    .setColor(0x2b2d31);
}

function buildDetailEmbed(user: User, type: 'warns' | 'kicks' | 'bans', offenseData: OffenseData): EmbedBuilder {
  const records = offenseData[type];
  const titleType = type.charAt(0).toUpperCase() + type.slice(1);

  const description = records
    .map((item) => {
      const issuedTs = Math.floor(new Date(item.issuedAt).getTime() / 1000);

      let entry =
        `**ID:** \`${item.id}\`${item?.soft ? ' - Soft Ban' : ''}\n` +
        `> **Reason:** ${item.reason}\n` +
        `> **Issued** on <t:${issuedTs}:d> by <@${item.issuerId}>`;

      if (item.revokedAt && item.revokedBy) {
        const revokedTs = Math.floor(new Date(item.revokedAt).getTime() / 1000);
        entry += `\n> **Revoked** on <t:${revokedTs}:d> by <@${item.revokedBy}>`;
      }

      return entry;
    })
    .join('\n\n');

  return new EmbedBuilder()
    .setTitle(`${titleType} (${records.length}) — ${user.username ?? user.id}`)
    .setDescription(description || 'No records found.')
    .setThumbnail(user.avatarURL({ size: 128, extension: 'webp' }))
    .setColor(type === 'bans' ? 0xed4245 : type === 'kicks' ? 0xfee75c : 0x5865f2);
}

function buildComponents(
  currentView: 'overview' | 'warns' | 'kicks' | 'bans',
  offenseData: OffenseData,
): ActionRowBuilder<ButtonBuilder>[] {
  const row = new ActionRowBuilder<ButtonBuilder>();

  if (currentView !== 'overview') {
    row.addComponents(
      new ButtonBuilder().setCustomId('modlog_back').setLabel('◀ Return to Summary').setStyle(ButtonStyle.Secondary),
    );
    return [row];
  }

  if (offenseData.warns.length > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('modlog_warns')
        .setLabel(`Review Warns (${offenseData.warns.length})`)
        .setStyle(ButtonStyle.Primary),
    );
  }

  if (offenseData.kicks.length > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('modlog_kicks')
        .setLabel(`Review Kicks (${offenseData.kicks.length})`)
        .setStyle(ButtonStyle.Primary),
    );
  }

  if (offenseData.bans.length > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('modlog_bans')
        .setLabel(`Review Bans (${offenseData.bans.length})`)
        .setStyle(ButtonStyle.Danger),
    );
  }

  return row.components.length > 0 ? [row] : [];
}

function initializeCollector(
  response: InteractionResponse,
  interaction: ChatInputCommandInteraction,
  targetUser: User,
  offenseData: OffenseData,
) {
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 2 * 60_000, // 2 minutes
  });

  collector.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) {
      await i.reply({
        content: 'You cannot use these controls.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (i.customId === 'modlog_back') {
      await i.update({
        embeds: [buildOverviewEmbed(targetUser, offenseData)],
        components: buildComponents('overview', offenseData),
      });
      return;
    }

    if (i.customId === 'modlog_warns') {
      await i.update({
        embeds: [buildDetailEmbed(targetUser, 'warns', offenseData)],
        components: buildComponents('warns', offenseData),
      });
      return;
    }

    if (i.customId === 'modlog_kicks') {
      await i.update({
        embeds: [buildDetailEmbed(targetUser, 'kicks', offenseData)],
        components: buildComponents('kicks', offenseData),
      });
      return;
    }

    if (i.customId === 'modlog_bans') {
      await i.update({
        embeds: [buildDetailEmbed(targetUser, 'bans', offenseData)],
        components: buildComponents('bans', offenseData),
      });
      return;
    }
  });

  collector.on('end', async () => {
    try {
      const message = await interaction.fetchReply();
      const existingEmbed = message.embeds[0];

      if (existingEmbed) {
        const updatedEmbed = EmbedBuilder.from(existingEmbed).setFooter({
          text: 'Please rerun the command to use again.',
        });

        await interaction.editReply({
          embeds: [updatedEmbed],
          components: [],
        });
      }
    } catch (error) {}
  });
}

export default {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription("View a user's moderation history")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('user').setDescription('The user to inspect').setRequired(true))
    .addBooleanOption((o) =>
      o.setName('ephemeral').setDescription('Share response with other users').setRequired(false),
    ),

  execute: async (interaction, client) => {
    const { guild, options, user: author } = interaction;
    if (!guild) {
      await interaction.reply({
        content: 'This command can only be used in a guild.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const user = options.getUser('user', true);
    const ephemeral = options.getBoolean('ephemeral', false) ?? false;

    try {
      const offenseData = await db.query.usersTable.findFirst({
        where: (users, { eq }) => eq(users.id, user.id),
        with: {
          warns: true,
          kicks: true,
          bans: true,
        },
      });

      if (
        !offenseData ||
        (offenseData.warns.length === 0 && offenseData.kicks.length === 0 && offenseData.bans.length === 0)
      ) {
        await interaction.reply({
          content: `No offenses listed against <@${user.id}>.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const response = await interaction.reply({
        embeds: [buildOverviewEmbed(user, offenseData)],
        components: buildComponents('overview', offenseData),
        flags: ephemeral ? MessageFlags.Ephemeral : undefined,
      });

      initializeCollector(response, interaction, user, offenseData);

      await logger.logdiscord(client, {
        title: 'Command Used',
        description:
          `<@${author.id}> (${author.username}) used \`/history\` for <@${user.id}>` +
          (ephemeral ? ` in channel <#${interaction.channelId}>.` : '.'),
      });

      logger.info(`[Command History] ${author.username} (${author.id}) reviewed ${user.id}'s moderation history.`);
    } catch (error) {
      logger.error('[Command History] Failed to fetch history', error);
      await interaction.reply({
        content: 'An error occurred while fetching user history.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
} satisfies Command;

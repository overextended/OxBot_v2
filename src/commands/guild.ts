import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { Command } from '@/types';
import { logger } from '@/utils/logger';
import { db } from '@/db';
import { guildInvitesTable } from '@/db/schema';
import { like } from 'drizzle-orm';

export default {
  data: new SlashCommandBuilder()
    .setName('guild')
    .setDescription('Retrieve an invite for a specific guild')
    .addStringOption((o) =>
      o.setName('guild').setDescription('The relevant guild').setRequired(true).setAutocomplete(true),
    ),

  execute: async (interaction, client) => {
    const { options } = interaction;

    const guild = options.getString('guild', true);
    const guildId = parseInt(guild);

    try {
      const inviteData = await db.query.guildInvitesTable.findFirst({
        where: (guilds, { eq }) => eq(guilds.id, guildId),
      });

      if (!inviteData) {
        await interaction.reply({
          content: `Guild was not found, please select one from the shown options.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.reply({ content: inviteData.invite });
    } catch (error) {
      logger.error('[Command Guild] Failed to execute', error);
      await interaction.reply({
        content: 'An error occurred while fetching the guild invite.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  autocomplete: async (interaction) => {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === 'guild') {
      const query = focusedOption.value;

      try {
        const results = await db
          .select({
            id: guildInvitesTable.id,
            name: guildInvitesTable.name,
          })
          .from(guildInvitesTable)
          .where(query ? like(guildInvitesTable.name, `%${query}%`) : undefined)
          .limit(25);

        await interaction.respond(
          results
            .sort((a, b) => a.id - b.id)
            .map((row) => ({
              name: row.name,
              value: row.id.toString(),
            })),
        );
      } catch (error) {
        logger.error('[Command Handle Guild Invites] Autocomplete failed', error);
        await interaction.respond([]);
      }
    }
  },
} satisfies Command;

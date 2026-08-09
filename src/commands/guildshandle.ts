import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { eq, like } from 'drizzle-orm';
import type { Command } from '@/types';
import { logger } from '@/utils/logger';
import { db } from '@/db';
import { guildInvitesTable } from '@/db/schema';
import { checkUserIsLogged } from '@/utils/checks';

export default {
  data: new SlashCommandBuilder()
    .setName('handleguildinvites')
    .setDescription('Handle guild invites')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((c) =>
      c
        .setName('add')
        .setDescription('Add a new guild invite')
        .addStringOption((o) => o.setName('name').setDescription('Name of the invite target/group').setRequired(true))
        .addStringOption((o) => o.setName('invite').setDescription('Discord invite URL or code').setRequired(true)),
    )
    .addSubcommand((c) =>
      c
        .setName('edit')
        .setDescription('Edit an existing guild invite')
        .addStringOption((o) =>
          o.setName('id').setDescription('Invite to edit').setRequired(true).setAutocomplete(true),
        )
        .addStringOption((o) => o.setName('name').setDescription('New name').setRequired(false))
        .addStringOption((o) => o.setName('invite').setDescription('New invite link').setRequired(false)),
    )
    .addSubcommand((c) =>
      c
        .setName('delete')
        .setDescription('Delete a guild invite')
        .addStringOption((o) =>
          o.setName('id').setDescription('Invite to delete').setRequired(true).setAutocomplete(true),
        ),
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

    try {
      await checkUserIsLogged({ client, user: author });

      const subcommand = options.getSubcommand();

      switch (subcommand) {
        case 'add': {
          const name = options.getString('name', true);
          const invite = options.getString('invite', true);

          const [inserted] = await db
            .insert(guildInvitesTable)
            .values({
              name,
              invite,
              addedAt: new Date(),
              addedBy: author.id,
            })
            .returning();

          logger.info(
            `[Command Handle Guild Invites] ${author.username} (${author.id}) added invite "${name}" (ID: ${inserted.id})`,
          );

          await interaction.reply({
            content: `Successfully added guild invite **${name}** (\`${invite}\`) [ID: \`${inserted.id}\`].`,
            flags: MessageFlags.Ephemeral,
          });
          break;
        }

        case 'edit': {
          const id = Number.parseInt(options.getString('id', true), 10);
          const name = options.getString('name');
          const invite = options.getString('invite');

          if (Number.isNaN(id)) {
            await interaction.reply({ content: 'Invalid invite ID provided.', flags: MessageFlags.Ephemeral });
            return;
          }

          if (!name && !invite) {
            await interaction.reply({
              content: 'You must provide at least a new **name** or a new **invite** link to update.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const existing = db.select().from(guildInvitesTable).where(eq(guildInvitesTable.id, id)).get();

          if (!existing) {
            await interaction.reply({ content: 'No invite found with that ID.', flags: MessageFlags.Ephemeral });
            return;
          }

          const updateData: Partial<typeof guildInvitesTable.$inferInsert> = {};
          if (name) updateData.name = name;
          if (invite) updateData.invite = invite;

          await db.update(guildInvitesTable).set(updateData).where(eq(guildInvitesTable.id, id));

          logger.info(`[Command Handle Guild Invites] ${author.username} (${author.id}) updated invite (${id}) data: ${JSON.stringify(updateData)}`);

          await interaction.reply({
            content: `Successfully updated invite ID **${id}**.`,
            flags: MessageFlags.Ephemeral,
          });
          break;
        }

        case 'delete': {
          const id = Number.parseInt(options.getString('id', true), 10);

          if (Number.isNaN(id)) {
            await interaction.reply({ content: 'Invalid invite ID provided.', flags: MessageFlags.Ephemeral });
            return;
          }

          const deleted = await db.delete(guildInvitesTable).where(eq(guildInvitesTable.id, id)).returning();

          if (!deleted.length) {
            await interaction.reply({
              content: 'No invite found with that ID to delete.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          logger.info(`[Command Handle Guild Invites] ${author.username} (${author.id}) deleted invite ID ${id} - ${deleted[0].name}`);

          await interaction.reply({
            content: `Successfully deleted invite **${deleted[0].name}** (ID: \`${id}\`).`,
            flags: MessageFlags.Ephemeral,
          });
          break;
        }

        default: {
          await interaction.reply({ content: 'Unknown subcommand.', flags: MessageFlags.Ephemeral });
        }
      }
    } catch (error) {
      logger.error('[Command Handle Guild Invites] Failed to execute', error);
      await interaction.reply({
        content: 'An error occurred while executing the command. Ensure the invite is unique.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  autocomplete: async (interaction) => {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === 'id') {
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
              name: `${row.name} (${row.id})`,
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

import { db } from '@/db';
import { scamImageHashesTable } from '@/db/schema';
import { Command } from '@/types';
import { checkUserIsLogged } from '@/utils/checks';
import { computeAttachmentHash } from '@/utils/images';
import { logger } from '@/utils/logger';
import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('add-scam-image')
    .setDescription('Computes and registers an image pHash to the scam database')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addAttachmentOption((o) =>
      o.setName('image').setDescription('The scam image to hash and register').setRequired(true),
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

    const attachment = options.getAttachment('image', true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      if (!attachment.contentType?.startsWith('image/')) {
        await interaction.editReply({ content: 'The provided attachment must be a valid image file.' });
        return;
      }

      const computedHash = await computeAttachmentHash(attachment);

      if (!computedHash) {
        await interaction.editReply({ content: 'Failed to process and calculate the perceptual hash for this image.' });
        return;
      }

      await checkUserIsLogged({ client, user: author });

      await db.insert(scamImageHashesTable).values({
        hash: computedHash,
        addedAt: new Date(),
        addedBy: author.id,
      });

      await logger.logdiscord(client, {
        user: author,
        title: 'Scam Image Hash Added',
        description: `**Added By:** <@${author.id}>\n**Computed Hash:** \`${computedHash}\`\n**Image Name:** ${attachment.name}`,
        color: 'Red',
      });

      await interaction.editReply({
        content: `Successfully calculated and registered scam image pHash: \`${computedHash}\``,
      });

      logger.info(`[Command AddScamImage] Hash ${computedHash} added by ${author.username} (${author.id})`);
    } catch (error) {
      // Check for SQLite / Drizzle UNIQUE constraint violations (duplicate hash)
      const errMessage = (error as Error).message;
      if (errMessage.includes('UNIQUE constraint failed') || errMessage.includes('sqlite_stat1')) {
        await interaction.editReply({ content: 'This image hash already exists in the scam database.' });
        return;
      }

      logger.error('[Command AddScamImage] Failed to add scam image hash', error);
      await interaction.editReply({
        content: 'An error occurred while processing and saving the image hash.',
      });
    }
  },
} satisfies Command;

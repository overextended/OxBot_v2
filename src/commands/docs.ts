import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { Command } from '@/types';

const BASE_URL = 'https://overextended.dev/docs/';
const RESOURCES = ['ox_lib', 'ox_inventory', 'oxmysql', 'ox_core', 'ox_doorlock', 'ox_fuel', 'ox_target'] as const;

export default {
  data: new SlashCommandBuilder()
    .setName('docs')
    .setDescription('Get the link to the docs')
    .addStringOption((o) =>
      o
        .setName('resource')
        .setDescription('The resource')
        .setRequired(true)
        .setChoices(
          ...RESOURCES.map((v) => ({
            value: v,
            name: v.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          })),
        ),
    ),

  execute: async (interaction, client) => {
    const resource = interaction.options.getString('resource', true);
    const url = `${BASE_URL}/${resource}`;

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Docs for: ${resource}`)
          .setColor('#c5a279')
          .setDescription(`Please read the documentation thoroughly and carefully.\n\n> :link: ${url}`)
          .setThumbnail(client.user.displayAvatarURL({ size: 128, extension: 'jpeg' })),
      ],
    });
  },
} satisfies Command;

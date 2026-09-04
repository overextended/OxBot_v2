import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { Command } from '@/types';

const BASE_URL = 'https://github.com/overextended/{resource}/releases/latest/download/{resource}.zip';
const RESOURCES = ['ox_lib', 'ox_inventory', 'oxmysql', 'ox_core', 'ox_doorlock'] as const;

export default {
  data: new SlashCommandBuilder()
    .setName('release')
    .setDescription('UI not built thingy')
    .addStringOption((o) =>
      o
        .setName('resource')
        .setDescription('The resource')
        .setRequired(false)
        .setChoices(
          ...RESOURCES.map((v) => ({
            value: v,
            name: v.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
          })),
        ),
    ),

  execute: async (interaction, client) => {
    const resource = interaction.options.getString('resource', false);
    const url = resource && BASE_URL.replaceAll('{resource}', resource);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Release zip`)
          .setColor('Red')
          .setDescription(
            `If you are getting a "no such export" error or an error saying that the UI needs to be built, please ensure you downloaded a release zip instead of the source code.\n\n` +
              `**Source Code**\n` +
              `Pressing the green **Code** button and then pressing **Download ZIP** or cloning the repository with Git will download the source code.\n\n` +
              `Source code needs to be built/compiled. You can do this yourself, or alternatively, download the recommended release zip we provide.\n\n` +
              `**Where to download the release zip**\n` +
              `The release zip can be found under the **Releases** section on the right side of the GitHub repository page. Make sure **not** to download the option labeled "Source code".\n` +
              (resource ? `> :link: [${resource} release](${url})\n\n` : '\n') +
              `**Building the source code**\n` +
              `Alternatively, you can build/compile the source code yourself, though this is not recommended unless you know what you are doing.`,
          )
          .setThumbnail(client.user!.displayAvatarURL({ size: 128, extension: 'jpeg' })),
      ],
    });
  },
} satisfies Command;

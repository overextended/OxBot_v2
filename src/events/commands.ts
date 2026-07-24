import { BotEvent } from '@/types';
import { logger } from '@/utils/logger';
import { MessageFlags } from 'discord.js';

export default {
  name: 'interactionCreate',
  once: false,
  execute: async (client, interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    const command = client.commands.get(commandName);

    if (!command) {
      logger.warn('[Command Handler] Unknown command:', commandName);
      interaction.reply({
        content: 'Unknown command',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (err) {
      logger.error('[Command Handler] An error occured while running the execute function of:', commandName);
      logger.error(err);

      if (!interaction.replied)
        interaction.reply({
          content: `An error occured:\n> ${(err as Error).message}`,
        });
    }
  },
} satisfies BotEvent<'interactionCreate'>;

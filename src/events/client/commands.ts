import { BotEvent } from '@/types';
import { logger } from '@/utils/logger';
import { MessageFlags } from 'discord.js';

export default {
  name: 'interactionCreate',
  once: false,
  execute: async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
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

      if (!command.execute) {
        logger.warn('[Command Handler] Command does not have an execute callback:', commandName);
        interaction.reply({
          content: 'Borked command',
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
    } else if (interaction.isAutocomplete()) {
      const { commandName } = interaction;
      const command = client.commands.get(commandName);

      if (!command || !command.autocomplete) {
        logger.warn('[Command Handler] Unknown command for autocomplete:', commandName);
        return;
      }

      try {
        await command.autocomplete(interaction, client);
      } catch (err) {
        logger.error('[Command Handler] An error occured while running the autocomplete function of:', commandName);
        logger.error(err);
      }
    }
  },
} satisfies BotEvent<'interactionCreate'>;

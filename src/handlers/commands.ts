import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { logger } from '@/utils/logger';
import type { BotClient } from '@/client';
import type { Command } from '@/types';
import { env } from '@/env';
import { REST, Routes } from 'discord.js';

export const loadCommands = async (client: BotClient): Promise<void> => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const dir = join(currentDir, '..', 'commands');
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));

  for (const file of files) {
    const filePath = join(dir, file);
    try {
      const mod = await import(pathToFileURL(filePath).href);
      const command: Command = mod.default;

      if (!command?.data || !command?.execute) {
        logger.debug(`[Commands] 🚧 Skipping ${file} - missing data or execute function`);
        continue;
      }

      if (client.commands.has(command.data.name)) {
        logger.warn(`[Commands] 🤥 Duplicate command name: ${command.data.name} (${file})`);
        continue;
      }

      client.commands.set(command.data.name, command);
      logger.info(`[Commands] ✅ Loaded: ${command.data.name}`);
    } catch (error) {
      logger.error(`[Commands] ❌ Error loading ${file}: ${error}`);
    }
  }
  logger.info(`[Commands] 📝 Total commands loaded: ${client.commands.size}`);

  client.on('clientReady', async ({ user }) => {
    const rest = new REST({ version: '10' }).setToken(env.TOKEN);
    const commandData = Array.from(client.commands.values()).map((command) => command.data.toJSON());

    if (env.NODE_ENV === 'development') {
      await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), { body: [] });
      logger.info('Cleared guild commands');

      await rest.put(Routes.applicationCommands(env.CLIENT_ID), { body: [] });
      logger.info('Cleared global commands');

      logger.info('Development mode: Registering guild commands...');
      await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), { body: commandData });
      logger.info(`Successfully registered ${commandData.length} guild commands`);
    } else {
      await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), { body: [] });
      logger.info('Cleared guild commands');

      logger.info('Production mode: Registering global commands...');
      await rest.put(Routes.applicationCommands(env.CLIENT_ID), { body: commandData });
      logger.info(`Successfully registered ${commandData.length} global commands`);
    }

    logger.info('✅ Logged in and loaded as', user.username);
  });
};

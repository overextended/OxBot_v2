import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { logger } from '@/utils/logger';
import type { Command } from '@/types';
import { env } from '@/env';
import { REST, Routes } from 'discord.js';

export const loadCommands = async (): Promise<void> => {
  const commands: Map<string, Command> = new Map();
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const dir = join(currentDir, '..', 'commands');

  const entries = readdirSync(dir, { recursive: true }) as string[];

  const files = entries
    .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
    .map((file) => [file, join(dir, file)]);

  for (const entry of files) {
    const [file, path] = entry;

    try {
      const mod = await import(pathToFileURL(path).href);
      const command: Command = mod.default;

      if (!command?.data || !command?.execute) {
        logger.debug(`🚧 Skipping ${file} - missing data or execute function`);
        continue;
      }

      if (commands.has(command.data.name)) {
        logger.warn(`🤥 Duplicate command name: ${command.data.name} (${file})`);
        continue;
      }

      commands.set(command.data.name, command);
      logger.info(`✅ Loaded: ${command.data.name}`);
    } catch (error) {
      logger.error(`❌ Error loading ${file}: ${error}`);
    }
  }

  logger.info(`📝 Total commands loaded: ${commands.size}`);
  logger.info(`📝 Registering the commands to discord's REST...`);

  const rest = new REST({ version: '10' }).setToken(env.TOKEN);
  const commandData = Array.from(commands.values()).map((command) => command.data.toJSON());

  await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), { body: [] });
  logger.info('✅ Cleared guild commands');

  logger.info('📝 Registering guild commands...');
  await rest.put(Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID), { body: commandData });
  logger.info(`✅ Successfully registered ${commandData.length} guild commands`);
};

loadCommands();

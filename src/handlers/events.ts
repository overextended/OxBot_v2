import { readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { logger } from '@/utils/logger';
import type { BotClient } from '@/client';
import type { BotEvent } from '@/types';

export const loadEvents = async (client: BotClient): Promise<void> => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const dir = join(currentDir, '..', 'events');
  const files = readdirSync(dir).filter((f) => f.endsWith('.ts'));

  let loadedCount = 0;

  for (const file of files) {
    const filePath = join(dir, file);
    try {
      const mod = await import(pathToFileURL(filePath).href);
      const event: BotEvent<any> = mod.default;

      if (!event?.name || !event?.execute) {
        logger.debug(`[Events] 🚧 Skipping ${file} - missing name or execute`);
        continue;
      }

      if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
      } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
      }

      loadedCount++;
      logger.info(`[Events] 🪝 Registered: ${event.name}`);
    } catch (error) {
      logger.error(`[Events] ❌ Error loading ${file}: ${error}`);
    }
  }

  logger.info(`[Events] 📝 Total events loaded: ${loadedCount}`);
};

import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

const CONFIG_PATH = 'config.json';

const numericString = z.string().regex(/^\d+$/, 'Value must be a numeric string');
const ConfigSchema = z.object({
  roles: z.object({
    moderation: z.array(numericString).default([]),
    blacklisted: z.array(numericString).default([]),
    member: z.array(numericString).default([]),
  }),
  channels: z.object({
    actionlog: numericString,
    messagelog: numericString,
    joinleavelog: numericString,
  }),
});
export type Config = z.infer<typeof ConfigSchema>;

function cleanupNumericIds(data: Record<string, string | string[]>): {
  duplicates: number;
} {
  let duplicates = 0;

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      const uniqueValues = [...new Set(value)].filter((id) => /^\d+$/.test(id));
      const removed = value.length - uniqueValues.length;

      if (removed > 0) {
        duplicates += removed;
        data[key] = uniqueValues;
      }
    }
  }

  return { duplicates };
}

export async function loadConfig(): Promise<Config> {
  const absolutePath = path.resolve(CONFIG_PATH);

  let rawData: unknown;
  try {
    const fileContent = await fs.readFile(absolutePath, 'utf-8');
    rawData = JSON.parse(fileContent);
  } catch (error) {
    console.error(`[Config] ❌ Failed to read or parse config at ${CONFIG_PATH}: ${error}`);
    throw new Error(`Failed to load config file: ${CONFIG_PATH}`);
  }

  const parsed = ConfigSchema.safeParse(rawData);
  if (!parsed.success) {
    console.error(`[Config] ❌ Invalid configuration structure in ${CONFIG_PATH}:\n`, z.prettifyError(parsed.error));
    throw new Error(`Configuration validation failed for ${CONFIG_PATH}`);
  }

  let cleanedConfig: Config = JSON.parse(JSON.stringify(parsed.data));

  const { duplicates: roleDuplicates } = cleanupNumericIds(cleanedConfig.roles as Record<string, string[]>);
  const { duplicates: channelDuplicates } = cleanupNumericIds(
    cleanedConfig.channels as Record<string, string | string[]>,
  );

  const totalCleaned = roleDuplicates + channelDuplicates;

  if (totalCleaned > 0) {
    console.info(`[Config] 🧹 Cleaned config file (${totalCleaned} duplicate/invalid ID(s) removed)`);

    try {
      await fs.writeFile(absolutePath, JSON.stringify(cleanedConfig, null, 2), 'utf-8');
    } catch (error) {
      console.error(`[Config] ❌ Failed to write cleaned config back to file: ${error}`);
      throw error;
    }
  }

  console.info(`[Config] ✅ Config loaded successfully from ${path.basename(CONFIG_PATH)}`);
  console.debug(
    `[Config] 📊 Active Roles - Moderation: ${cleanedConfig.roles.moderation.length}, Blacklisted: ${cleanedConfig.roles.blacklisted.length}`,
  );

  return cleanedConfig;
}

export default await loadConfig();

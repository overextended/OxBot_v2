import { createClient } from '@/client';
import { loadCommands } from '@/handlers/commands';
import { loadEvents } from '@/handlers/events';
import { env } from './env';
import { logger } from './utils/logger';

const client = createClient();

await loadCommands(client);
await loadEvents(client);

client.login(env.TOKEN);

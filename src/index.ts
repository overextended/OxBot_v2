import { createClient } from '@/client';
import { loadCommands } from '@/handlers/commands';
import { loadEvents } from '@/handlers/events';
import { env } from './env';

const client = createClient();

await loadCommands(client);
await loadEvents(client);

client.login(env.TOKEN);

import { BotEvent } from '@/types';
import { logger } from '@/utils/logger';

export default {
  name: 'clientReady',
  once: true,
  execute: async (client) => {
    logger.info(`[Client] ✅ ${client.user?.username} has logged in coxrectly.`);
  },
} satisfies BotEvent<'clientReady'>;

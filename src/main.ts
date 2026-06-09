import cron from 'node-cron';
import { login } from './helpers/login.js';
import { startServer } from './server.js';
import { startBot } from './telegram/bot.js';
import { runStScanner } from './jobs/stScanner.js';
import logger from './helpers/logger.js';
import { sendNotification } from './notifier.js';

async function bootstrap() {
  logger.info('🚀 Starting ST-ETF Algo...');

  try {
    // 1. Start Health Server
    startServer();

    // 2. Start Telegram Bot
    await startBot();

    // 3. Login to SmartAPI
    await login();

    // 4. Register Cron Job (03:26 PM IST)
    cron.schedule(
      '26 15 * * 1-5',
      async () => {
        try {
          await runStScanner();
        } catch (error: any) {
          logger.error(`Cron job error: ${error.message}`);
        }
      },
      {
        timezone: 'Asia/Kolkata',
      }
    );

    logger.info('Algo initialized and scheduled successfully');
    await sendNotification('🚀 *ST-ETF Algo initialized and ready!*');
  } catch (error: any) {
    logger.error(`Bootstrap failed: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();

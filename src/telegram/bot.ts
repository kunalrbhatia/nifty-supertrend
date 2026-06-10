import { Telegraf } from 'telegraf';
import { config } from '../config/env.js';
import logger from '../helpers/logger.js';
import { statusHandler } from './commands/status.js';
import { positionsHandler } from './commands/positions.js';
import { logsHandler } from './commands/logs.js';
import { paperHandler } from './commands/paper.js';
import { updateHandler } from './commands/update.js';
import { investHandler } from './commands/invest.js';
import { timeframeHandler } from './commands/timeframe.js';

const bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

// Middleware for chat ID security
bot.use(async (ctx, next) => {
  if (ctx.chat?.id.toString() !== config.TELEGRAM_CHAT_ID) {
    return ctx.reply('Unauthorized.');
  }
  return next();
});

// Command registration
bot.command('status', statusHandler);
bot.command('positions', positionsHandler);
bot.command('logs', logsHandler);
bot.command('paper', paperHandler);
bot.command('update', updateHandler);
bot.command('invest', investHandler);
bot.command('timeframe', timeframeHandler);

export async function startBot(): Promise<void> {
  bot.launch();
  logger.info('Telegram Bot started');

  // Graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

export default bot;

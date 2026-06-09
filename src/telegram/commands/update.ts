import { Context } from 'telegraf';
import { exec } from 'child_process';
import logger from '../../helpers/logger.js';

export async function updateHandler(ctx: Context) {
  await ctx.reply('Updating scrip master... Please wait.');

  exec('pnpm run update-scrip', (error) => {
    if (error) {
      logger.error(`Scrip update error: ${error.message}`);
      return ctx.reply(`❌ Update failed: ${error.message}`);
    }
    logger.info('Scrip master updated manually via Telegram');
    ctx.reply('✅ Scrip master updated successfully!');
  });
}

import { Context } from 'telegraf';
import configStore from '../../store/configStore.js';
import { INDEX_MAP } from '../../helpers/constants.js';

export async function indexHandler(ctx: Context) {
  const message = ctx.message as { text?: string };
  const text = message?.text || '';
  const args = text.split(' ').slice(1);

  if (args.length === 0) {
    const currentIndex = configStore.getIndex();
    const details = INDEX_MAP[currentIndex];
    return await ctx.reply(
      `Current tracked index: *${details.name}* (trades *${details.etfSymbol}*)`,
      { parse_mode: 'Markdown' }
    );
  }

  const requested = args.join(' ').toLowerCase().replace(/\s+/g, '');

  if (requested === 'nifty' || requested === 'nifty50') {
    configStore.setIndex('nifty');
    const details = INDEX_MAP.nifty;
    return await ctx.reply(
      `✅ Index updated. Now tracking: *${details.name}* (trades *${details.etfSymbol}*)`,
      { parse_mode: 'Markdown' }
    );
  } else if (requested === 'banknifty' || requested === 'niftybank') {
    configStore.setIndex('banknifty');
    const details = INDEX_MAP.banknifty;
    return await ctx.reply(
      `✅ Index updated. Now tracking: *${details.name}* (trades *${details.etfSymbol}*)`,
      { parse_mode: 'Markdown' }
    );
  } else {
    return await ctx.reply(
      `❌ Invalid index. Supported options: *nifty*, *banknifty*\nExample: /index banknifty`,
      { parse_mode: 'Markdown' }
    );
  }
}

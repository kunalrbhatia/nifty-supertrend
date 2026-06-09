import { Context } from 'telegraf';
import configStore from '../../store/configStore.js';
import { TIMEFRAMES } from '../../helpers/constants.js';

export async function timeframeHandler(ctx: Context) {
  const text = (ctx.message as any)?.text || '';
  const args = text.split(' ').slice(1);

  if (args.length === 0) {
    const currentInterval = configStore.getTimeframe();
    // Reverse lookup for user-friendly name
    const userFriendly =
      Object.keys(TIMEFRAMES).find((key) => TIMEFRAMES[key] === currentInterval) || currentInterval;
    return await ctx.reply(`Current SuperTrend timeframe: *${userFriendly}*`, {
      parse_mode: 'Markdown',
    });
  }

  const requested = args[0].toLowerCase();
  const apiInterval = TIMEFRAMES[requested];

  if (!apiInterval) {
    const options = Object.keys(TIMEFRAMES).join(', ');
    return await ctx.reply(
      `❌ Invalid timeframe. Supported options: *${options}*\nExample: /timeframe 1h`,
      { parse_mode: 'Markdown' }
    );
  }

  configStore.setTimeframe(apiInterval);
  await ctx.reply(`✅ SuperTrend timeframe updated to: *${requested}*`, {
    parse_mode: 'Markdown',
  });
}

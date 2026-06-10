import { Context } from 'telegraf';
import holdingStore from '../../store/holdingStore.js';
import configStore from '../../store/configStore.js';
import { getCandles, getLtp } from '../../helpers/marketData.js';
import { calculateSuperTrend } from '../../helpers/supertrend.js';
import { CONSTANTS, TIMEFRAMES } from '../../helpers/constants.js';
import { isPaperMode } from '../../helpers/modeManager.js';

export async function statusHandler(ctx: Context) {
  const holdings = holdingStore.get();
  const isPaper = isPaperMode();
  const timeframe = configStore.getTimeframe();
  const userFriendlyTF =
    Object.keys(TIMEFRAMES).find((key) => TIMEFRAMES[key] === timeframe) || timeframe;

  try {
    const beesLtp = await getLtp(CONSTANTS.NIFTYBEES_TOKEN, CONSTANTS.EXCHANGE);
    const n50Candles = await getCandles(CONSTANTS.NIFTY50_TOKEN, CONSTANTS.EXCHANGE, timeframe);
    const stResults = calculateSuperTrend(n50Candles);
    const latestST = stResults[stResults.length - 1];

    const pnl =
      holdings.totalQuantity > 0
        ? (((beesLtp - holdings.averagePrice) / holdings.averagePrice) * 100).toFixed(2)
        : '0.00';

    const message = `📊 *Strategy Status* (${isPaper ? 'PAPER' : 'LIVE'})
--------------------------
*Nifty 50 Indicator (${userFriendlyTF}):*
Trend: ${latestST.trend === 'UP' ? '🟢 UP' : '🔴 DOWN'}
ST Value: ₹${latestST.value.toFixed(2)}

*NIFTYBEES Execution:*
LTP: ₹${beesLtp}
Total Qty: ${holdings.totalQuantity}
Avg Price: ₹${holdings.averagePrice.toFixed(2)}
Invested: ₹${holdings.totalInvestment.toFixed(2)}
P&L: ${pnl}%`;

    await ctx.replyWithMarkdown(message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ctx.reply(`Error fetching status: ${errorMessage}`);
  }
}

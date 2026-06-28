import { Context } from 'telegraf';
import holdingStore from '../../store/holdingStore.js';
import configStore from '../../store/configStore.js';
import { getCandles, getLtp } from '../../helpers/marketData.js';
import { calculateSuperTrend } from '../../helpers/supertrend.js';
import { CONSTANTS, INDEX_MAP, TIMEFRAMES } from '../../helpers/constants.js';
import { isPaperMode } from '../../helpers/modeManager.js';

export async function statusHandler(ctx: Context) {
  const currentIndex = configStore.getIndex();
  const indexDetails = INDEX_MAP[currentIndex];
  const holdings = holdingStore.get(currentIndex);
  const isPaper = isPaperMode();
  const timeframe = configStore.getTimeframe();
  const userFriendlyTF =
    Object.keys(TIMEFRAMES).find((key) => TIMEFRAMES[key] === timeframe) || timeframe;

  try {
    const etfLtp = await getLtp(indexDetails.etfToken, CONSTANTS.EXCHANGE);
    const candles = await getCandles(indexDetails.indexToken, CONSTANTS.EXCHANGE, timeframe);
    const stResults = calculateSuperTrend(candles);
    const latestST = stResults[stResults.length - 1];

    const pnl =
      holdings.totalQuantity > 0
        ? (((etfLtp - holdings.averagePrice) / holdings.averagePrice) * 100).toFixed(2)
        : '0.00';

    const message = `📊 *Strategy Status* (${isPaper ? 'PAPER' : 'LIVE'})
--------------------------
*${indexDetails.name} Indicator (${userFriendlyTF}):*
Trend: ${latestST.trend === 'UP' ? '🟢 UP' : '🔴 DOWN'}
ST Value: ₹${latestST.value.toFixed(2)}

*${indexDetails.etfName} Execution:*
LTP: ₹${etfLtp}
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

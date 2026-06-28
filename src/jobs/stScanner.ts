import { getCandles, getLtp } from '../helpers/marketData.js';
import { calculateSuperTrend } from '../helpers/supertrend.js';
import { CONSTANTS, INDEX_MAP, TIMEFRAMES } from '../helpers/constants.js';
import holdingStore from '../store/holdingStore.js';
import configStore from '../store/configStore.js';
import { placeOrder } from '../helpers/orders.js';
import logger from '../helpers/logger.js';
import { isTradingDay } from '../helpers/holidayCheck.js';
import { sendNotification } from '../notifier.js';

/**
 * Main strategy job: runs every day at 3:26 PM IST.
 */
export async function runStScanner(): Promise<void> {
  const timeframe = configStore.getTimeframe();
  const userFriendlyTimeframe =
    Object.keys(TIMEFRAMES).find((key) => TIMEFRAMES[key] === timeframe) || timeframe;
  const currentIndex = configStore.getIndex();
  const indexDetails = INDEX_MAP[currentIndex];

  logger.info(`Starting daily ST scan for ${indexDetails.name} (${userFriendlyTimeframe})...`);

  // 1. Holiday check
  const isMarketOpen = await isTradingDay();
  if (!isMarketOpen) return;

  try {
    // 2. Fetch market data
    // Fetch index candles for indicator
    const candles = await getCandles(indexDetails.indexToken, CONSTANTS.EXCHANGE, timeframe);
    if (candles.length < 20) {
      logger.error(
        `Insufficient candle data for ${indexDetails.name} ST calculation (${timeframe})`
      );
      return;
    }

    // Fetch ETF LTP for execution/MTM
    const etfLtp = await getLtp(indexDetails.etfToken, CONSTANTS.EXCHANGE);

    // 3. Calculate SuperTrend on index
    const stResults = calculateSuperTrend(candles);
    const prevST = stResults[stResults.length - 2];
    const currST = stResults[stResults.length - 1];

    logger.info(
      `ST (${indexDetails.name}) Status: Prev=${prevST.trend}, Curr=${currST.trend} | TF: ${userFriendlyTimeframe} | ETF LTP: ${etfLtp}`
    );

    // 4. Signal Detection
    const holdings = holdingStore.get(currentIndex);

    // BUY SIGNAL: Red -> Green
    if (prevST.trend === 'DOWN' && currST.trend === 'UP') {
      const investmentAmt = configStore.getInvestmentAmount();
      const qty = Math.floor(investmentAmt / etfLtp);

      if (qty > 0) {
        logger.info(
          `🟢 BUY SIGNAL (${indexDetails.name}). Investing ₹${investmentAmt} in ${indexDetails.etfSymbol} (Qty: ${qty})`
        );
        await placeOrder('BUY', qty, indexDetails.etfSymbol, indexDetails.etfToken);
        holdingStore.addBuy(qty, etfLtp, currentIndex);

        const newHoldings = holdingStore.get(currentIndex);
        await sendNotification(
          `🟢 *BUY SIGNAL (${indexDetails.name})*\nAsset: ${indexDetails.etfName}\nPrice: ₹${etfLtp}\nQty: ${qty}\nNew Avg: ₹${newHoldings.averagePrice.toFixed(2)}\nTotal Qty: ${newHoldings.totalQuantity}`
        );
      } else {
        logger.info(`🟢 BUY SIGNAL (${indexDetails.name}) but Qty is 0. No trade.`);
        await sendNotification(
          `🟢 *TREND SWITCH: UP (${indexDetails.name})*\nPrice: ₹${etfLtp}\nNo trade: Insufficient funds or Qty is 0.`
        );
      }
    }

    // SELL SIGNAL: Green -> Red
    else if (prevST.trend === 'UP' && currST.trend === 'DOWN') {
      if (holdings.totalQuantity > 0) {
        const profitPct = ((etfLtp - holdings.averagePrice) / holdings.averagePrice) * 100;

        if (profitPct >= CONSTANTS.MIN_PROFIT_PERCENT) {
          logger.info(
            `🔴 SELL SIGNAL (${indexDetails.name}). Profit ${profitPct.toFixed(2)}% >= ${CONSTANTS.MIN_PROFIT_PERCENT}%. Squaring off.`
          );
          await placeOrder(
            'SELL',
            holdings.totalQuantity,
            indexDetails.etfSymbol,
            indexDetails.etfToken
          );
          holdingStore.clear(currentIndex);

          await sendNotification(
            `🔴 *SELL SIGNAL (EXIT) - ${indexDetails.name}*\nAsset: ${indexDetails.etfName}\nPrice: ₹${etfLtp}\nAvg: ₹${holdings.averagePrice.toFixed(2)}\nP&L: +${profitPct.toFixed(2)}%\nSquare-off complete!`
          );
        } else {
          logger.info(
            `🟡 SELL SIGNAL (${indexDetails.name}) but Profit ${profitPct.toFixed(2)}% < ${CONSTANTS.MIN_PROFIT_PERCENT}%. Holding position.`
          );
          await sendNotification(
            `🟡 *SELL SIGNAL (HOLD) - ${indexDetails.name}*\nAsset: ${indexDetails.etfName}\nPrice: ₹${etfLtp}\nAvg: ₹${holdings.averagePrice.toFixed(2)}\nP&L: ${profitPct.toFixed(2)}%\nProfit < 1%, carrying forward.`
          );
        }
      } else {
        logger.info(`${indexDetails.name} ST turned RED but no active holdings to sell.`);
        await sendNotification(
          `🔴 *TREND SWITCH: DOWN (${indexDetails.name})*\nPrice: ₹${etfLtp}\nNo active holdings to sell.`
        );
      }
    } else {
      logger.info(`${indexDetails.name} Trend remains ${currST.trend}. No action taken.`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error in stScanner job: ${errorMessage}`);
    await sendNotification(`⚠️ *ST-ETF ERROR:* ${errorMessage}`);
  }
}

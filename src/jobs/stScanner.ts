import { getCandles, getLtp } from '../helpers/marketData.js';
import { calculateSuperTrend } from '../helpers/supertrend.js';
import { CONSTANTS, TIMEFRAMES } from '../helpers/constants.js';
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

  logger.info(`Starting daily ST scan (${userFriendlyTimeframe})...`);

  // 1. Holiday check
  const isMarketOpen = await isTradingDay();
  if (!isMarketOpen) return;

  try {
    // 2. Fetch market data
    // Fetch Nifty 50 candles for indicator
    const n50Candles = await getCandles(CONSTANTS.NIFTY50_TOKEN, CONSTANTS.EXCHANGE, timeframe);
    if (n50Candles.length < 20) {
      logger.error(`Insufficient candle data for Nifty 50 ST calculation (${timeframe})`);
      return;
    }

    // Fetch NiftyBees LTP for execution/MTM
    const beesLtp = await getLtp(CONSTANTS.NIFTYBEES_TOKEN, CONSTANTS.EXCHANGE);

    // 3. Calculate SuperTrend on Nifty 50
    const stResults = calculateSuperTrend(n50Candles);
    const prevST = stResults[stResults.length - 2];
    const currST = stResults[stResults.length - 1];

    logger.info(
      `ST (Nifty 50) Status: Prev=${prevST.trend}, Curr=${currST.trend} | TF: ${userFriendlyTimeframe} | Bees LTP: ${beesLtp}`
    );

    // 4. Signal Detection
    const holdings = holdingStore.get();

    // BUY SIGNAL: Red -> Green
    if (prevST.trend === 'DOWN' && currST.trend === 'UP') {
      const investmentAmt = configStore.getInvestmentAmount();
      const qty = Math.floor(investmentAmt / beesLtp);

      if (qty > 0) {
        logger.info(`🟢 BUY SIGNAL (N50). Investing ₹${investmentAmt} in NIFTYBEES (Qty: ${qty})`);
        await placeOrder('BUY', qty);
        holdingStore.addBuy(qty, beesLtp);

        const newHoldings = holdingStore.get();
        await sendNotification(
          `🟢 *BUY SIGNAL (Nifty 50)*\nAsset: NIFTYBEES\nPrice: ₹${beesLtp}\nQty: ${qty}\nNew Avg: ₹${newHoldings.averagePrice.toFixed(2)}\nTotal Qty: ${newHoldings.totalQuantity}`
        );
      } else {
        logger.info(`🟢 BUY SIGNAL (N50) but Qty is 0. No trade.`);
        await sendNotification(
          `🟢 *TREND SWITCH: UP (Nifty 50)*\nPrice: ₹${beesLtp}\nNo trade: Insufficient funds or Qty is 0.`
        );
      }
    }

    // SELL SIGNAL: Green -> Red
    else if (prevST.trend === 'UP' && currST.trend === 'DOWN') {
      if (holdings.totalQuantity > 0) {
        const profitPct = ((beesLtp - holdings.averagePrice) / holdings.averagePrice) * 100;

        if (profitPct >= CONSTANTS.MIN_PROFIT_PERCENT) {
          logger.info(
            `🔴 SELL SIGNAL (N50). Profit ${profitPct.toFixed(2)}% >= ${CONSTANTS.MIN_PROFIT_PERCENT}%. Squaring off.`
          );
          await placeOrder('SELL', holdings.totalQuantity);
          holdingStore.clear();

          await sendNotification(
            `🔴 *SELL SIGNAL (EXIT) - Nifty 50*\nAsset: NIFTYBEES\nPrice: ₹${beesLtp}\nAvg: ₹${holdings.averagePrice.toFixed(2)}\nP&L: +${profitPct.toFixed(2)}%\nSquare-off complete!`
          );
        } else {
          logger.info(
            `🟡 SELL SIGNAL (N50) but Profit ${profitPct.toFixed(2)}% < ${CONSTANTS.MIN_PROFIT_PERCENT}%. Holding position.`
          );
          await sendNotification(
            `🟡 *SELL SIGNAL (HOLD) - Nifty 50*\nAsset: NIFTYBEES\nPrice: ₹${beesLtp}\nAvg: ₹${holdings.averagePrice.toFixed(2)}\nP&L: ${profitPct.toFixed(2)}%\nProfit < 1%, carrying forward.`
          );
        }
      } else {
        logger.info('Nifty 50 ST turned RED but no active holdings to sell.');
        await sendNotification(
          `🔴 *TREND SWITCH: DOWN (Nifty 50)*\nPrice: ₹${beesLtp}\nNo active holdings to sell.`
        );
      }
    } else {
      logger.info(`Nifty 50 Trend remains ${currST.trend}. No action taken.`);
    }
  } catch (error: any) {
    logger.error(`Error in stScanner job: ${error.message}`);
    await sendNotification(`⚠️ *ST-ETF ERROR:* ${error.message}`);
  }
}

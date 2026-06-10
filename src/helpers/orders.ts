import api from './api.js';
import { API_URLS, CONSTANTS } from './constants.js';
import logger from './logger.js';
import { isPaperMode } from './modeManager.js';
import { sendNotification } from '../notifier.js';

export async function placeOrder(
  action: 'BUY' | 'SELL',
  quantity: number,
  symbol: string = CONSTANTS.NIFTYBEES_SYMBOL,
  token: string = CONSTANTS.NIFTYBEES_TOKEN
): Promise<void> {
  const isPaper = isPaperMode();

  if (isPaper) {
    const msg = `[PAPER] ✅ ${action} order placed for ${quantity} units of ${symbol}`;
    logger.info(msg);
    await sendNotification(msg);
    return;
  }

  try {
    const response = await api.post(API_URLS.ORDER, {
      variety: 'NORMAL',
      tradingsymbol: symbol,
      symboltoken: token,
      transactiontype: action,
      exchange: CONSTANTS.EXCHANGE,
      ordertype: 'MARKET',
      producttype: 'CNC',
      duration: 'DAY',
      quantity: quantity.toString(),
    });

    if (response.data && response.data.status) {
      const orderId = response.data.data.orderid;
      logger.info(`[LIVE] ${action} order success: ${orderId}`);
      await sendNotification(
        `[LIVE] ✅ *${action} Order Success*\nID: ${orderId}\nAsset: ${symbol}\nQty: ${quantity}`
      );
    } else {
      const errorMsg = response.data.message || 'Order failed';
      throw new Error(errorMsg);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorMsg = `❌ *ORDER ERROR:* Failed to place ${action} order.\nError: ${errorMessage}`;
    logger.error(errorMsg);
    await sendNotification(errorMsg);
    throw error;
  }
}

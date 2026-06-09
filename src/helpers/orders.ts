import api from './api.js';
import { API_URLS, CONSTANTS } from './constants.js';
import logger from './logger.js';
import { isPaperMode } from './modeManager.js';

export async function placeOrder(
  action: 'BUY' | 'SELL',
  quantity: number,
  symbol: string = CONSTANTS.NIFTYBEES_SYMBOL,
  token: string = CONSTANTS.NIFTYBEES_TOKEN
): Promise<void> {
  const isPaper = isPaperMode();

  if (isPaper) {
    logger.info(`[PAPER] ${action} order placed for ${quantity} units of ${symbol}`);
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
      logger.info(`[LIVE] ${action} order success: ${response.data.data.orderid}`);
    } else {
      throw new Error(response.data.message || 'Order failed');
    }
  } catch (error: any) {
    logger.error(`Error placing ${action} order: ${error.message}`);
    throw error;
  }
}

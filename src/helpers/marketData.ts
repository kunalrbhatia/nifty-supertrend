import api from './api.js';
import { API_URLS } from './constants.js';
import { Candle } from './supertrend.js';
import logger from './logger.js';

/**
 * Fetch candles for a given token and interval.
 */
export async function getCandles(
  token: string,
  exchange: string,
  interval: string
): Promise<Candle[]> {
  try {
    const toDate = new Date().toISOString().split('T')[0] + ' 15:30';
    let daysBack = 150;
    if (interval === 'ONE_MINUTE') daysBack = 10;
    else if (interval.includes('MINUTE')) daysBack = 30;
    else if (interval === 'ONE_HOUR') daysBack = 60;

    const fromDate =
      new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + ' 09:15';

    const response = await api.post(API_URLS.HISTORICAL, {
      exchange,
      symboltoken: token,
      interval: interval,
      fromdate: fromDate,
      todate: toDate,
    });

    if (response.data && response.data.status) {
      return response.data.data.map((c: any) => ({
        timestamp: c[0],
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
      }));
    }
    return [];
  } catch (error: any) {
    logger.error(`Error fetching candles (${interval}): ${error.message}`);
    return [];
  }
}

/**
 * Get LTP for a given token.
 */
export async function getLtp(token: string, exchange: string): Promise<number> {
  try {
    const response = await api.post(API_URLS.QUOTE, {
      mode: 'LTP',
      exchangeTokens: {
        [exchange]: [token],
      },
    });

    if (
      response.data &&
      response.data.status &&
      response.data.data.fetched &&
      response.data.data.fetched.length > 0
    ) {
      return response.data.data.fetched[0].ltp;
    }
    throw new Error('LTP fetch failed');
  } catch (error: any) {
    logger.error(`Error fetching LTP: ${error.message}`);
    throw error;
  }
}

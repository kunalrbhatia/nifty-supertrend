import axios from 'axios';
import logger from './logger.js';
import { API_URLS } from './constants.js';

/**
 * Checks if today is an NSE trading day.
 */
export async function isTradingDay(): Promise<boolean> {
  const today = new Date();
  const day = today.getDay();

  // 1. Weekend check (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) {
    logger.info('Today is a weekend. Not a trading day.');
    return false;
  }

  try {
    // 2. Holiday API check
    const response = await axios.get(API_URLS.HOLIDAYS, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        Accept: '*/*',
        Referer: 'https://www.nseindia.com/reports-indices-historical-index-data',
      },
    });

    const todayStr = today
      .toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(/ /g, '-'); // e.g., "08-Jun-2026"

    const holidays = response.data.trading || [];
    const isHoliday = holidays.some((h: any) => h.tradingDate === todayStr);

    if (isHoliday) {
      logger.info(`Today (${todayStr}) is an NSE holiday.`);
      return false;
    }

    return true;
  } catch (error: any) {
    logger.error(`Holiday check failed: ${error.message}. Assuming trading day.`);
    return true; // Fallback to true if API fails
  }
}

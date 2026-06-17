import axios from 'axios';
import { config } from './config/env.js';
import logger from './helpers/logger.js';

/**
 * Sends a notification via Telegram.
 */
export async function sendNotification(message: string): Promise<void> {
  if (!config.TELEGRAM_ENABLED) {
    logger.info(`Notification (Telegram Disabled): ${message}`);
    return;
  }
  try {
    const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: config.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to send Telegram notification: ${errorMessage}`);
  }
}

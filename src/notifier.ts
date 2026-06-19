import axios from 'axios';
import { config } from './config/env.js';
import logger from './helpers/logger.js';

/**
 * Sends a notification via Slack.
 */
export async function sendSlack(message: string): Promise<void> {
  if (!config.SLACK_WEBHOOK_URL) {
    logger.error('Slack webhook URL is not configured');
    return;
  }
  try {
    await axios.post(config.SLACK_WEBHOOK_URL, { text: message });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to send Slack notification: ${errorMessage}`);
  }
}

/**
 * Sends a notification via Telegram.
 */
export async function sendTelegram(message: string): Promise<void> {
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

/**
 * Sends a notification using the active channel based on the configuration priority matrix.
 */
export async function notify(message: string): Promise<void> {
  if (config.TELEGRAM_ENABLED) {
    await sendTelegram(message);
    return;
  }
  if (config.SLACK_ENABLED) {
    await sendSlack(message);
    return;
  }
  logger.info(`Notification (Telegram and Slack Disabled): ${message}`);
}

/**
 * Sends a notification via the primary configured channel (Telegram or Slack).
 * Maintained as an alias of notify for backward compatibility.
 */
export async function sendNotification(message: string): Promise<void> {
  await notify(message);
}


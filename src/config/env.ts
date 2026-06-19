import dotenv from 'dotenv';
import { z } from 'zod';
import logger from '../helpers/logger.js';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_KEY: z.string(),
  CLIENT_CODE: z.string(),
  CLIENT_PIN: z.string(),
  CLIENT_TOTP_PIN: z.string(),
  TELEGRAM_BOT_TOKEN: z.string(),
  TELEGRAM_CHAT_ID: z.string(),
  TELEGRAM_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  SLACK_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  SLACK_WEBHOOK_URL: z.string().optional(),
})
  .refine(
    (data) => {
      const isSlackActuallyEnabled = data.TELEGRAM_ENABLED ? false : data.SLACK_ENABLED;
      if (isSlackActuallyEnabled && (!data.SLACK_WEBHOOK_URL || data.SLACK_WEBHOOK_URL.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'SLACK_WEBHOOK_URL is required when SLACK_ENABLED is true and TELEGRAM_ENABLED is false',
      path: ['SLACK_WEBHOOK_URL'],
    }
  )
  .transform((data) => {
    // Priority matrix enforcement: disable Slack if Telegram is enabled
    const telegramEnabled = data.TELEGRAM_ENABLED;
    const slackEnabled = telegramEnabled ? false : data.SLACK_ENABLED;
    return {
      ...data,
      SLACK_ENABLED: slackEnabled,
    };
  });

export function parseConfig(env: Record<string, string | undefined> = process.env) {
  const parsed = envSchema.safeParse(env);

  if (!parsed.success) {
    logger.error(`❌ Invalid environment variables: ${JSON.stringify(parsed.error.format())}`);
    process.exit(1);
  }

  return parsed.data;
}

export const config = parseConfig();
export type Config = typeof config;



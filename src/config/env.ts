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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error(`❌ Invalid environment variables: ${JSON.stringify(parsed.error.format())}`);
  process.exit(1);
}

export const config = parsed.data;
export type Config = typeof config;

import { Context } from 'telegraf';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import logger from '../../helpers/logger.js';

export async function logsHandler(ctx: Context) {
  try {
    // 1. Try PM2 logs
    const pm2Logs = execSync('pm2 logs st-etf-algo --lines 20 --no-colors').toString();
    if (pm2Logs) {
      return await ctx.reply(`\`\`\`\n${pm2Logs}\n\`\`\``, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    logger.info('PM2 logs command failed, falling back to file logs');
  }

  // 2. Fallback to file logs
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    const files = fs
      .readdirSync(logsDir)
      .filter((f) => f.endsWith('.log'))
      .sort()
      .reverse();

    if (files.length > 0) {
      const lastFile = path.join(logsDir, files[0]);
      const content = fs.readFileSync(lastFile, 'utf-8').split('\n').slice(-20).join('\n');
      return await ctx.reply(`\`\`\`\n${content}\n\`\`\``, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ctx.reply(`Failed to fetch logs: ${errorMessage}`);
  }
}

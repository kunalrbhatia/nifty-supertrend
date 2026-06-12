import { Context } from 'telegraf';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import logger from '../../helpers/logger.js';

export async function logsHandler(ctx: Context) {
  let logsContent = '';
  let source = 'PM2';

  try {
    // 1. Try PM2 logs
    // --raw is better than --no-colors as it's more standard across PM2 versions for clean output
    const pm2Logs = execSync('pm2 logs st-etf-algo --lines 20 --raw').toString();
    if (pm2Logs && pm2Logs.trim()) {
      logsContent = pm2Logs;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.info(`PM2 logs command failed: ${errorMessage}. Falling back to file logs`);
  }

  // 2. Fallback to file logs if PM2 failed or returned empty
  if (!logsContent) {
    source = 'File';
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      if (fs.existsSync(logsDir)) {
        const files = fs
          .readdirSync(logsDir)
          .filter((f) => f.endsWith('.log'))
          .sort()
          .reverse();

        if (files.length > 0) {
          const lastFile = path.join(logsDir, files[0]);
          logsContent = fs.readFileSync(lastFile, 'utf-8').split('\n').slice(-25).join('\n');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return await ctx.reply(`Failed to fetch file logs: ${errorMessage}`);
    }
  }

  if (logsContent) {
    const header = `📋 *Last 20-25 lines (${source}):*\n`;
    return await ctx.reply(`${header}\`\`\`\n${logsContent}\n\`\`\``, {
      parse_mode: 'Markdown',
    });
  } else {
    return await ctx.reply('No logs found.');
  }
}

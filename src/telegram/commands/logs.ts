import { Context } from 'telegraf';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../helpers/logger.js';

export async function logsHandler(ctx: Context) {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Check if directory exists
    try {
      await fs.access(logsDir);
    } catch {
      return await ctx.reply('❌ Logs directory not found.');
    }

    const files = await fs.readdir(logsDir);
    
    // Prioritize daily rotation logs (st-etf-*.log)
    // Then fallback to PM2 specific logs if any
    const logFiles = files
      .filter((f) => f.endsWith('.log'))
      .sort()
      .reverse();

    if (logFiles.length === 0) {
      return await ctx.reply('📭 No log files found in the logs directory.');
    }

    // Pick the most recent log file
    const latestFile = logFiles[0];
    const filePath = path.join(logsDir, latestFile);
    
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n').slice(-25).join('\n');

    if (!lines) {
      return await ctx.reply(`📄 File *${latestFile}* is empty.`, { parse_mode: 'Markdown' });
    }

    const header = `📋 *Last 25 lines from ${latestFile}:*\n`;
    await ctx.reply(`${header}\`\`\`\n${lines}\n\`\`\``, {
      parse_mode: 'Markdown',
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to fetch logs: ${errorMessage}`);
    await ctx.reply(`❌ Failed to fetch logs: ${errorMessage}`);
  }
}

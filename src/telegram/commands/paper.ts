import { Context } from 'telegraf';
import { isPaperMode, setPaperMode } from '../../helpers/modeManager.js';

export async function paperHandler(ctx: Context) {
  const currentMode = isPaperMode();
  const newMode = !currentMode;

  setPaperMode(newMode);

  await ctx.reply(`Trading mode switched to: *${newMode ? 'PAPER' : 'LIVE'}*`, {
    parse_mode: 'Markdown',
  });
}

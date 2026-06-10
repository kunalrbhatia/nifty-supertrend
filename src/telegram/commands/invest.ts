import { Context } from 'telegraf';
import configStore from '../../store/configStore.js';

export async function investHandler(ctx: Context) {
  const message = ctx.message as { text?: string };
  const text = message?.text || '';
  const args = text.split(' ').slice(1);

  if (args.length === 0) {
    const currentAmt = configStore.getInvestmentAmount();
    return await ctx.reply(`Current investment amount per tranche: ₹${currentAmt}`);
  }

  const newAmt = parseInt(args[0]);

  if (isNaN(newAmt) || newAmt <= 0) {
    return await ctx.reply(
      'Invalid amount. Please provide a positive number (e.g., /invest 20000)'
    );
  }

  configStore.setInvestmentAmount(newAmt);
  await ctx.reply(`✅ Investment amount updated to: ₹${newAmt}`);
}

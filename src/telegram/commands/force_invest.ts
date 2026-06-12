import { Context } from 'telegraf';
import { getLtp } from '../../helpers/marketData.js';
import { CONSTANTS } from '../../helpers/constants.js';
import holdingStore from '../../store/holdingStore.js';
import configStore from '../../store/configStore.js';
import { placeOrder } from '../../helpers/orders.js';
import logger from '../../helpers/logger.js';

export async function forceInvestHandler(ctx: Context) {
  try {
    await ctx.reply('🚀 Processing forced investment... Fetching LTP.');

    const beesLtp = await getLtp(CONSTANTS.NIFTYBEES_TOKEN, CONSTANTS.EXCHANGE);
    const investmentAmt = configStore.getInvestmentAmount();
    const qty = Math.floor(investmentAmt / beesLtp);

    if (qty > 0) {
      await ctx.reply(
        `🟢 Forcing investment of ₹${investmentAmt} in NIFTYBEES (Qty: ${qty}) @ ₹${beesLtp}`
      );

      await placeOrder('BUY', qty);
      holdingStore.addBuy(qty, beesLtp);

      const newHoldings = holdingStore.get();
      const message = `✅ *Forced Investment Successful*
--------------------------
Asset: NIFTYBEES
Price: ₹${beesLtp}
Qty: ${qty}
New Avg: ₹${newHoldings.averagePrice.toFixed(2)}
Total Qty: ${newHoldings.totalQuantity}`;

      await ctx.replyWithMarkdown(message);
      logger.info(`Forced investment executed: ${qty} units @ ₹${beesLtp}`);
    } else {
      await ctx.reply(
        `⚠️ Cannot invest: Tranche amount (₹${investmentAmt}) is less than LTP (₹${beesLtp}).`
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Forced investment failed: ${errorMessage}`);
    await ctx.reply(`❌ Forced investment failed: ${errorMessage}`);
  }
}

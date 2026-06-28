import { Context } from 'telegraf';
import { getLtp } from '../../helpers/marketData.js';
import { CONSTANTS, INDEX_MAP } from '../../helpers/constants.js';
import holdingStore from '../../store/holdingStore.js';
import configStore from '../../store/configStore.js';
import { placeOrder } from '../../helpers/orders.js';
import logger from '../../helpers/logger.js';

export async function forceInvestHandler(ctx: Context) {
  try {
    await ctx.reply('🚀 Processing forced investment... Fetching LTP.');

    const currentIndex = configStore.getIndex();
    const indexDetails = INDEX_MAP[currentIndex];

    const etfLtp = await getLtp(indexDetails.etfToken, CONSTANTS.EXCHANGE);
    const investmentAmt = configStore.getInvestmentAmount();
    const qty = Math.floor(investmentAmt / etfLtp);

    if (qty > 0) {
      await ctx.reply(
        `🟢 Forcing investment of ₹${investmentAmt} in ${indexDetails.etfSymbol} (Qty: ${qty}) @ ₹${etfLtp}`
      );

      await placeOrder('BUY', qty, indexDetails.etfSymbol, indexDetails.etfToken);
      holdingStore.addBuy(qty, etfLtp, currentIndex);

      const newHoldings = holdingStore.get(currentIndex);
      const message = `✅ *Forced Investment Successful*
--------------------------
Asset: ${indexDetails.etfName}
Price: ₹${etfLtp}
Qty: ${qty}
New Avg: ₹${newHoldings.averagePrice.toFixed(2)}
Total Qty: ${newHoldings.totalQuantity}`;

      await ctx.replyWithMarkdown(message);
      logger.info(`Forced investment executed: ${qty} units @ ₹${etfLtp}`);
    } else {
      await ctx.reply(
        `⚠️ Cannot invest: Tranche amount (₹${investmentAmt}) is less than LTP (₹${etfLtp}).`
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Forced investment failed: ${errorMessage}`);
    await ctx.reply(`❌ Forced investment failed: ${errorMessage}`);
  }
}

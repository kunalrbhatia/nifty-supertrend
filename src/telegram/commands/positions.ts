import { Context } from 'telegraf';
import holdingStore from '../../store/holdingStore.js';
import { getLtp } from '../../helpers/marketData.js';
import { CONSTANTS } from '../../helpers/constants.js';

export async function positionsHandler(ctx: Context) {
  const holdings = holdingStore.get();

  try {
    const beesLtp = await getLtp(CONSTANTS.NIFTYBEES_TOKEN, CONSTANTS.EXCHANGE);

    if (holdings.totalQuantity === 0) {
      return ctx.replyWithMarkdown('📭 *No active positions.*');
    }

    const currentVal = holdings.totalQuantity * beesLtp;
    const pnlAmt = currentVal - holdings.totalInvestment;
    const pnlPct = (pnlAmt / holdings.totalInvestment) * 100;

    const message = `💼 *Current Positions*
--------------------------
*Asset:* ${CONSTANTS.NIFTYBEES_SYMBOL}
*Qty:* ${holdings.totalQuantity}
*Avg Price:* ₹${holdings.averagePrice.toFixed(2)}
*LTP:* ₹${beesLtp.toFixed(2)}

*Invested:* ₹${holdings.totalInvestment.toFixed(2)}
*Current:* ₹${currentVal.toFixed(2)}
*P&L:* ${pnlAmt >= 0 ? '🟢' : '🔴'} ₹${pnlAmt.toFixed(2)} (${pnlPct.toFixed(2)}%)`;

    await ctx.replyWithMarkdown(message);
  } catch (error: any) {
    await ctx.reply(`Error fetching positions: ${error.message}`);
  }
}

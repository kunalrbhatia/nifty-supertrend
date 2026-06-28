import { Context } from 'telegraf';
import holdingStore from '../../store/holdingStore.js';
import configStore from '../../store/configStore.js';
import { getLtp } from '../../helpers/marketData.js';
import { CONSTANTS, INDEX_MAP } from '../../helpers/constants.js';

export async function positionsHandler(ctx: Context) {
  const currentIndex = configStore.getIndex();
  const indexDetails = INDEX_MAP[currentIndex];
  const holdings = holdingStore.get(currentIndex);

  try {
    const etfLtp = await getLtp(indexDetails.etfToken, CONSTANTS.EXCHANGE);

    if (holdings.totalQuantity === 0) {
      return ctx.replyWithMarkdown(`📭 *No active positions for ${indexDetails.etfName}.*`);
    }

    const currentVal = holdings.totalQuantity * etfLtp;
    const pnlAmt = currentVal - holdings.totalInvestment;
    const pnlPct = (pnlAmt / holdings.totalInvestment) * 100;

    const message = `💼 *Current Positions (${indexDetails.name})*
--------------------------
*Asset:* ${indexDetails.etfSymbol}
*Qty:* ${holdings.totalQuantity}
*Avg Price:* ₹${holdings.averagePrice.toFixed(2)}
*LTP:* ₹${etfLtp.toFixed(2)}

*Invested:* ₹${holdings.totalInvestment.toFixed(2)}
*Current:* ₹${currentVal.toFixed(2)}
*P&L:* ${pnlAmt >= 0 ? '🟢' : '🔴'} ₹${pnlAmt.toFixed(2)} (${pnlPct.toFixed(2)}%)`;

    await ctx.replyWithMarkdown(message);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await ctx.reply(`Error fetching positions: ${errorMessage}`);
  }
}

import { Context } from 'telegraf';

export async function helpHandler(ctx: Context) {
  const helpMessage = `🤖 *ST-ETF Algo Bot Help*

Here are the available commands:

📊 */status*
Get current Nifty 50 Trend status, NIFTYBEES LTP, current average price, and live P&L percentage.

💼 */positions*
See a detailed breakdown of your current holdings, total investment, and individual trade history.

📈 */timeframe <val>*
Change the SuperTrend calculation timeframe (e.g., \`/timeframe 1h\`, \`/timeframe 1d\`).

💰 */invest <amt>*
Set or view the investment amount per tranche (e.g., \`/invest 15000\`).

🚀 */force_invest*
Manually trigger a buy order for 1 tranche of NIFTYBEES at the current market price.

🔄 */update*
Force a manual refresh of the Angel One Scrip Master (instrument tokens).

🧪 */paper*
Toggle between **LIVE** and **PAPER** trading modes instantly.

📋 */logs*
Fetch the last 20-25 lines of server logs (useful for debugging).

❓ */help*
Show this detailed help message.

_Note: All trend calculations are based on the Nifty 50 Index._`;

  await ctx.replyWithMarkdown(helpMessage);
}

# ST-ETF Algo

## Strategy Overview

**SuperTrend ETF Accumulation (Nifty 50)** — A daily carry-forward strategy designed to accumulate Nifty ETFs during "Buy" cycles and square off only when a "Sell" cycle appears **AND** the overall position is in profit.

### Core Logic
1. **Indicator**: SuperTrend (10, 3)
2. **Instrument**: `NIFTYBEES-EQ`
3. **Averaging**: Every flip from Red to Green, invest ₹10,000 (default).
4. **Profit Protection**: Square off on Sell signal ONLY if Profit % ≥ 1.0%.

## Installation

1. `pnpm install`
2. `cp .env.example .env` (Fill credentials)
3. `pnpm run update-scrip` (Run at 8:30 AM IST)

## Commands
- `pnpm dev`: Start in watch mode
- `pnpm build`: Build the project
- `pnpm test`: Run tests
- `pnpm verify`: Full verification suite

## Telegram Commands
- `/status`: Current position status
- `/logs`: Last 20 logs
- `/paper`: Toggle paper/live mode
- `/update`: Manual scrip refresh
- `/invest <amt>`: Update investment amount

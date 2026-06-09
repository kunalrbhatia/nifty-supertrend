export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface STResult {
  trend: 'UP' | 'DOWN';
  value: number;
}

/**
 * Calculates SuperTrend (10, 3) using Wilder's ATR and Median Price.
 */
export function calculateSuperTrend(candles: Candle[], period = 10, multiplier = 3): STResult[] {
  if (candles.length < period) return [];

  const results: STResult[] = [];
  const tr: number[] = [];
  const medianPrices: number[] = [];

  // 1. Calculate TR and Median Price
  for (let i = 0; i < candles.length; i++) {
    const curr = candles[i];
    const prev = i > 0 ? candles[i - 1] : null;

    medianPrices.push((curr.high + curr.low) / 2);

    if (prev) {
      tr.push(
        Math.max(
          curr.high - curr.low,
          Math.abs(curr.high - prev.close),
          Math.abs(curr.low - prev.close)
        )
      );
    } else {
      tr.push(curr.high - curr.low);
    }
  }

  // 2. Calculate ATR (Wilder's Smoothing)
  const atr: number[] = new Array(candles.length).fill(0);
  let sumTR = 0;
  for (let i = 0; i < period; i++) sumTR += tr[i];
  atr[period - 1] = sumTR / period;

  for (let i = period; i < candles.length; i++) {
    atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period;
  }

  // 3. Calculate Bands and Trend
  const finalUpper: number[] = new Array(candles.length).fill(0);
  const finalLower: number[] = new Array(candles.length).fill(0);
  const trend: ('UP' | 'DOWN')[] = new Array(candles.length).fill('UP');

  for (let i = period - 1; i < candles.length; i++) {
    const basicUpper = medianPrices[i] + multiplier * atr[i];
    const basicLower = medianPrices[i] - multiplier * atr[i];

    if (i === period - 1) {
      finalUpper[i] = basicUpper;
      finalLower[i] = basicLower;
    } else {
      // Final Upperband logic
      finalUpper[i] =
        basicUpper < finalUpper[i - 1] || candles[i - 1].close > finalUpper[i - 1]
          ? basicUpper
          : finalUpper[i - 1];

      // Final Lowerband logic
      finalLower[i] =
        basicLower > finalLower[i - 1] || candles[i - 1].close < finalLower[i - 1]
          ? basicLower
          : finalLower[i - 1];
    }

    // Trend determination
    if (i > period - 1) {
      if (trend[i - 1] === 'DOWN' && candles[i].close > finalUpper[i]) {
        trend[i] = 'UP';
      } else if (trend[i - 1] === 'UP' && candles[i].close < finalLower[i]) {
        trend[i] = 'DOWN';
      } else {
        trend[i] = trend[i - 1];
      }
    }

    results.push({
      trend: trend[i],
      value: trend[i] === 'UP' ? finalLower[i] : finalUpper[i],
    });
  }

  return results;
}

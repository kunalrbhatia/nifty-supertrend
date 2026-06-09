import { calculateSuperTrend, Candle } from '../../src/helpers/supertrend';

describe('SuperTrend Helper', () => {
  const mockCandles: Candle[] = [
    { timestamp: '2024-06-01', open: 100, high: 105, low: 95, close: 102 },
    { timestamp: '2024-06-02', open: 102, high: 110, low: 100, close: 108 },
    { timestamp: '2024-06-03', open: 108, high: 115, low: 105, close: 112 },
    { timestamp: '2024-06-04', open: 112, high: 120, low: 110, close: 118 },
    { timestamp: '2024-06-05', open: 118, high: 125, low: 115, close: 122 },
    { timestamp: '2024-06-06', open: 122, high: 130, low: 120, close: 128 },
    { timestamp: '2024-06-07', open: 128, high: 135, low: 125, close: 132 },
    { timestamp: '2024-06-08', open: 132, high: 140, low: 130, close: 138 },
    { timestamp: '2024-06-09', open: 138, high: 145, low: 135, close: 142 },
    { timestamp: '2024-06-10', open: 142, high: 150, low: 140, close: 148 },
    { timestamp: '2024-06-11', open: 148, high: 155, low: 145, close: 152 },
    { timestamp: '2024-06-12', open: 152, high: 160, low: 150, close: 158 },
  ];

  it('should return empty results if insufficient candles', () => {
    const results = calculateSuperTrend(mockCandles.slice(0, 5), 10, 3);
    expect(results).toHaveLength(0);
  });

  it('should calculate SuperTrend correctly', () => {
    const results = calculateSuperTrend(mockCandles, 10, 3);
    expect(results).toHaveLength(3); // 12 candles - 10 period + 1 = 3
    expect(results[0]).toHaveProperty('trend');
    expect(results[0]).toHaveProperty('value');
  });

  it('should detect trend switch', () => {
    const switchCandles: Candle[] = [
      ...mockCandles,
      { timestamp: '2024-06-13', open: 158, high: 160, low: 50, close: 60 }, // Sharp drop
      { timestamp: '2024-06-14', open: 60, high: 65, low: 40, close: 45 },
    ];
    const results = calculateSuperTrend(switchCandles, 10, 3);
    const lastResult = results[results.length - 1];
    expect(lastResult.trend).toBe('DOWN');
  });
});

import api from '../../src/helpers/api';
import { getCandles, getLtp } from '../../src/helpers/marketData';

jest.mock('../../src/helpers/api');
const mockedApi = api as jest.Mocked<typeof api>;

describe('MarketData Helper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch candles correctly', async () => {
    const mockData = {
      data: {
        status: true,
        data: [['2024-06-10', 100, 105, 95, 102]],
      },
    };
    mockedApi.post.mockResolvedValue(mockData);

    const candles = await getCandles('10576', 'NSE', 'ONE_DAY');
    expect(candles).toHaveLength(1);
    expect(candles[0].close).toBe(102);
  });

  it('should return empty array if candle fetch fails', async () => {
    mockedApi.post.mockRejectedValue(new Error('Fail'));
    const candles = await getCandles('10576', 'NSE', 'ONE_DAY');
    expect(candles).toHaveLength(0);
  });

  it('should fetch LTP correctly', async () => {
    const mockData = {
      data: {
        status: true,
        data: {
          fetched: [{ ltp: 250.5 }],
        },
      },
    };
    mockedApi.post.mockResolvedValue(mockData);

    const ltp = await getLtp('10576', 'NSE');
    expect(ltp).toBe(250.5);
  });

  it('should throw error if LTP fetch fails', async () => {
    mockedApi.post.mockRejectedValue(new Error('Fail'));
    await expect(getLtp('10576', 'NSE')).rejects.toThrow('Fail');
  });
});

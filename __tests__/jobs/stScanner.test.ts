import { runStScanner } from '../../src/jobs/stScanner';
import * as marketData from '../../src/helpers/marketData';
import * as supertrend from '../../src/helpers/supertrend';
import * as holidayCheck from '../../src/helpers/holidayCheck';
import * as orders from '../../src/helpers/orders';
import { CONSTANTS } from '../../src/helpers/constants';
import holdingStore from '../../src/store/holdingStore';
import configStore from '../../src/store/configStore';
import * as notifier from '../../src/notifier';
import logger from '../../src/helpers/logger';

jest.mock('../../src/helpers/marketData');
jest.mock('../../src/helpers/supertrend');
jest.mock('../../src/helpers/holidayCheck');
jest.mock('../../src/helpers/orders');
jest.mock('../../src/notifier');
jest.mock('../../src/helpers/logger');

describe('stScanner Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip if it is not a trading day', async () => {
    jest.spyOn(holidayCheck, 'isTradingDay').mockResolvedValue(false);
    await runStScanner();
    expect(marketData.getCandles).not.toHaveBeenCalled();
  });

  it('should handle insufficient candle data', async () => {
    jest.spyOn(holidayCheck, 'isTradingDay').mockResolvedValue(true);
    jest.spyOn(marketData, 'getCandles').mockResolvedValue([]);
    await runStScanner();
    expect(logger.error).toHaveBeenCalledWith(
      'Insufficient candle data for Nifty 50 ST calculation (ONE_DAY)'
    );
  });

  it('should execute BUY signal correctly', async () => {
    jest.spyOn(holidayCheck, 'isTradingDay').mockResolvedValue(true);
    // Mock getCandles for Nifty 50
    jest.spyOn(marketData, 'getCandles').mockImplementation((token) => {
      if (token === CONSTANTS.NIFTY50_TOKEN) {
        return Promise.resolve(new Array(30).fill({}));
      }
      return Promise.resolve([]);
    });
    // Mock getLtp for NiftyBees
    jest.spyOn(marketData, 'getLtp').mockImplementation((token) => {
      if (token === CONSTANTS.NIFTYBEES_TOKEN) {
        return Promise.resolve(250);
      }
      return Promise.resolve(0);
    });
    jest.spyOn(supertrend, 'calculateSuperTrend').mockReturnValue([
      { trend: 'DOWN', value: 260 },
      { trend: 'UP', value: 240 },
    ]);
    jest.spyOn(configStore, 'getInvestmentAmount').mockReturnValue(10000);
    jest.spyOn(holdingStore, 'get').mockReturnValue({
      totalQuantity: 0,
      averagePrice: 0,
      totalInvestment: 0,
      lastSignal: 'NONE',
      trades: [],
    });

    const addBuySpy = jest.spyOn(holdingStore, 'addBuy').mockImplementation();

    await runStScanner();

    expect(orders.placeOrder).toHaveBeenCalledWith('BUY', 40);
    expect(addBuySpy).toHaveBeenCalledWith(40, 250);
    expect(notifier.sendNotification).toHaveBeenCalledWith(
      expect.stringContaining('BUY SIGNAL (Nifty 50)')
    );
  });

  it('should execute SELL signal (EXIT) correctly', async () => {
    jest.spyOn(holidayCheck, 'isTradingDay').mockResolvedValue(true);
    jest.spyOn(marketData, 'getCandles').mockResolvedValue(new Array(30).fill({}));
    jest.spyOn(marketData, 'getLtp').mockResolvedValue(260); // 4% profit over 250
    jest.spyOn(supertrend, 'calculateSuperTrend').mockReturnValue([
      { trend: 'UP', value: 240 },
      { trend: 'DOWN', value: 270 },
    ]);
    jest.spyOn(holdingStore, 'get').mockReturnValue({
      totalQuantity: 40,
      averagePrice: 250,
      totalInvestment: 10000,
      lastSignal: 'BUY',
      trades: [],
    });

    const clearSpy = jest.spyOn(holdingStore, 'clear').mockImplementation();

    await runStScanner();

    expect(orders.placeOrder).toHaveBeenCalledWith('SELL', 40);
    expect(clearSpy).toHaveBeenCalled();
    expect(notifier.sendNotification).toHaveBeenCalledWith(
      expect.stringContaining('SELL SIGNAL (EXIT) - Nifty 50')
    );
  });

  it('should handle SELL signal (HOLD) correctly', async () => {
    jest.spyOn(holidayCheck, 'isTradingDay').mockResolvedValue(true);
    jest.spyOn(marketData, 'getCandles').mockResolvedValue(new Array(30).fill({}));
    jest.spyOn(marketData, 'getLtp').mockResolvedValue(251); // 0.4% profit < 1%
    jest.spyOn(supertrend, 'calculateSuperTrend').mockReturnValue([
      { trend: 'UP', value: 240 },
      { trend: 'DOWN', value: 260 },
    ]);
    jest.spyOn(holdingStore, 'get').mockReturnValue({
      totalQuantity: 40,
      averagePrice: 250,
      totalInvestment: 10000,
      lastSignal: 'BUY',
      trades: [],
    });

    await runStScanner();

    expect(orders.placeOrder).not.toHaveBeenCalled();
    expect(notifier.sendNotification).toHaveBeenCalledWith(
      expect.stringContaining('SELL SIGNAL (HOLD) - Nifty 50')
    );
  });
});

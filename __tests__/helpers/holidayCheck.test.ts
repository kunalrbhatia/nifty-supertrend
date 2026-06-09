import axios from 'axios';
import { isTradingDay } from '../../src/helpers/holidayCheck';
import logger from '../../src/helpers/logger';

jest.mock('axios');
jest.mock('../../src/helpers/logger');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HolidayCheck Helper', () => {
  const originalDate = Date;

  afterEach(() => {
    global.Date = originalDate;
    jest.clearAllMocks();
  });

  it('should return false for weekends (Saturday)', async () => {
    const saturday = new Date('2024-06-08'); // Saturday
    global.Date = jest.fn(() => saturday) as any;
    
    const result = await isTradingDay();
    expect(result).toBe(false);
  });

  it('should return false for weekends (Sunday)', async () => {
    const sunday = new Date('2024-06-09'); // Sunday
    global.Date = jest.fn(() => sunday) as any;
    
    const result = await isTradingDay();
    expect(result).toBe(false);
  });

  it('should return false if today is an NSE holiday', async () => {
    const monday = new Date('2024-06-10'); // Monday
    global.Date = jest.fn(() => monday) as any;

    mockedAxios.get.mockResolvedValue({
      data: {
        trading: [{ tradingDate: '10-Jun-2024' }]
      }
    });

    const result = await isTradingDay();
    expect(result).toBe(false);
  });

  it('should return true if today is a trading day', async () => {
    const monday = new Date('2024-06-10'); // Monday
    global.Date = jest.fn(() => monday) as any;

    mockedAxios.get.mockResolvedValue({
      data: {
        trading: [{ tradingDate: '25-Dec-2024' }]
      }
    });

    const result = await isTradingDay();
    expect(result).toBe(true);
  });

  it('should return true and log error if API fails', async () => {
    const monday = new Date('2024-06-10');
    global.Date = jest.fn(() => monday) as any;

    mockedAxios.get.mockRejectedValue(new Error('API Down'));

    const result = await isTradingDay();
    expect(result).toBe(true);
    expect(logger.error).toHaveBeenCalled();
  });
});

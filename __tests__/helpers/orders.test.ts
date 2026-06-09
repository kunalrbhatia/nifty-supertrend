import api from '../../src/helpers/api';
import { placeOrder } from '../../src/helpers/orders';
import { isPaperMode } from '../../src/helpers/modeManager';
import logger from '../../src/helpers/logger';

jest.mock('../../src/helpers/api');
jest.mock('../../src/helpers/modeManager');
jest.mock('../../src/helpers/logger');

const mockedApi = api as jest.Mocked<typeof api>;
const mockedIsPaperMode = isPaperMode as jest.MockedFunction<typeof isPaperMode>;

describe('Orders Helper', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log and return in paper mode', async () => {
    mockedIsPaperMode.mockReturnValue(true);
    await placeOrder('BUY', 10);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('[PAPER]'));
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('should place live order correctly', async () => {
    mockedIsPaperMode.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({
      data: { status: true, data: { orderid: '123' } },
    });

    await placeOrder('BUY', 10);
    expect(mockedApi.post).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('[LIVE]'));
  });

  it('should throw error if live order fails', async () => {
    mockedIsPaperMode.mockReturnValue(false);
    mockedApi.post.mockResolvedValue({
      data: { status: false, message: 'Insufficient funds' },
    });

    await expect(placeOrder('BUY', 10)).rejects.toThrow('Insufficient funds');
  });

  it('should log error if axios fails', async () => {
    mockedIsPaperMode.mockReturnValue(false);
    mockedApi.post.mockRejectedValue(new Error('Network error'));

    await expect(placeOrder('BUY', 10)).rejects.toThrow('Network error');
    expect(logger.error).toHaveBeenCalled();
  });
});

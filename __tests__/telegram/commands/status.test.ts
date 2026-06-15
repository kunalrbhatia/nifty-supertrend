import { Context } from 'telegraf';
import { statusHandler } from '../../../src/telegram/commands/status';
import holdingStore from '../../../src/store/holdingStore';
import configStore from '../../../src/store/configStore';
import * as marketData from '../../../src/helpers/marketData';
import * as modeManager from '../../../src/helpers/modeManager';

jest.mock('../../../src/store/holdingStore');
jest.mock('../../../src/store/configStore');
jest.mock('../../../src/helpers/marketData');
jest.mock('../../../src/helpers/modeManager');

describe('StatusCommand', () => {
  let mockCtx: {
    replyWithMarkdown: jest.Mock;
    reply: jest.Mock;
  };

  beforeEach(() => {
    mockCtx = {
      replyWithMarkdown: jest.fn(),
      reply: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should reply with strategy status', async () => {
    jest.spyOn(holdingStore, 'get').mockReturnValue({
      totalQuantity: 40,
      averagePrice: 250,
      totalInvestment: 10000,
      lastSignal: 'BUY',
      trades: [],
    });
    jest.spyOn(configStore, 'getTimeframe').mockReturnValue('ONE_DAY');
    jest.spyOn(marketData, 'getLtp').mockResolvedValue(260);
    jest
      .spyOn(marketData, 'getCandles')
      .mockResolvedValue(new Array(30).fill({ high: 100, low: 90, close: 95 }));
    jest.spyOn(modeManager, 'isPaperMode').mockReturnValue(true);

    await statusHandler(mockCtx as unknown as Context);

    expect(mockCtx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('LTP: ₹260'));
    expect(mockCtx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('P&L: 4.00%'));
    expect(mockCtx.replyWithMarkdown).toHaveBeenCalledWith(
      expect.stringContaining('*Nifty 50 Indicator (1d):*')
    );
  });

  it('should handle errors gracefully', async () => {
    jest.spyOn(marketData, 'getLtp').mockRejectedValue(new Error('LTP Error'));
    await statusHandler(mockCtx as unknown as Context);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('LTP Error'));
  });
});

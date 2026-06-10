import { Context } from 'telegraf';
import { positionsHandler } from '../../../src/telegram/commands/positions';
import holdingStore from '../../../src/store/holdingStore';
import * as marketData from '../../../src/helpers/marketData';

jest.mock('../../../src/store/holdingStore');
jest.mock('../../../src/helpers/marketData');

describe('PositionsCommand', () => {
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

  it('should reply with "No active positions" when totalQuantity is 0', async () => {
    jest.spyOn(holdingStore, 'get').mockReturnValue({
      totalQuantity: 0,
      averagePrice: 0,
      totalInvestment: 0,
      lastSignal: 'NONE',
      trades: [],
    });
    jest.spyOn(marketData, 'getLtp').mockResolvedValue(260);

    await positionsHandler(mockCtx as unknown as Context);

    expect(mockCtx.replyWithMarkdown).toHaveBeenCalledWith('📭 *No active positions.*');
  });

  it('should reply with positions and P&L when holdings exist', async () => {
    jest.spyOn(holdingStore, 'get').mockReturnValue({
      totalQuantity: 10,
      averagePrice: 100,
      totalInvestment: 1000,
      lastSignal: 'BUY',
      trades: [],
    });
    jest.spyOn(marketData, 'getLtp').mockResolvedValue(110);

    await positionsHandler(mockCtx as unknown as Context);

    expect(mockCtx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('NIFTYBEES-EQ'));
    expect(mockCtx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('Qty'));
    expect(mockCtx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('10'));
    expect(mockCtx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('10.00%'));
  });

  it('should show negative P&L correctly', async () => {
    jest.spyOn(holdingStore, 'get').mockReturnValue({
      totalQuantity: 10,
      averagePrice: 100,
      totalInvestment: 1000,
      lastSignal: 'BUY',
      trades: [],
    });
    jest.spyOn(marketData, 'getLtp').mockResolvedValue(90);

    await positionsHandler(mockCtx as unknown as Context);

    expect(mockCtx.replyWithMarkdown).toHaveBeenCalledWith(expect.stringContaining('-10.00%'));
  });

  it('should handle errors gracefully', async () => {
    jest.spyOn(marketData, 'getLtp').mockRejectedValue(new Error('API Error'));
    await positionsHandler(mockCtx as unknown as Context);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('API Error'));
  });
});

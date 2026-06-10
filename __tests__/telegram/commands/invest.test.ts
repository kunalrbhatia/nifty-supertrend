import { Context } from 'telegraf';
import { investHandler } from '../../../src/telegram/commands/invest';
import configStore from '../../../src/store/configStore';

jest.mock('../../../src/store/configStore');

describe('InvestCommand', () => {
  let mockCtx: {
    reply: jest.Mock;
    message: { text: string };
  };

  beforeEach(() => {
    mockCtx = {
      reply: jest.fn(),
      message: { text: '' },
    };
    jest.clearAllMocks();
  });

  it('should return current investment amount if no args', async () => {
    mockCtx.message.text = '/invest';
    jest.spyOn(configStore, 'getInvestmentAmount').mockReturnValue(10000);

    await investHandler(mockCtx as unknown as Context);

    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('₹10000'));
  });

  it('should update investment amount if arg provided', async () => {
    mockCtx.message.text = '/invest 20000';
    const setSpy = jest.spyOn(configStore, 'setInvestmentAmount').mockImplementation();

    await investHandler(mockCtx as unknown as Context);

    expect(setSpy).toHaveBeenCalledWith(20000);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('₹20000'));
  });

  it('should handle invalid amount', async () => {
    mockCtx.message.text = '/invest abc';
    await investHandler(mockCtx as unknown as Context);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Invalid amount'));
  });
});

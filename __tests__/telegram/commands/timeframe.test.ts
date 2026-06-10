import { Context } from 'telegraf';
import { timeframeHandler } from '../../../src/telegram/commands/timeframe';
import configStore from '../../../src/store/configStore';

jest.mock('../../../src/store/configStore');

describe('TimeframeCommand', () => {
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

  it('should return current timeframe if no args', async () => {
    mockCtx.message.text = '/timeframe';
    jest.spyOn(configStore, 'getTimeframe').mockReturnValue('ONE_DAY');

    await timeframeHandler(mockCtx as unknown as Context);

    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('1d'), expect.any(Object));
  });

  it('should update timeframe if valid arg provided', async () => {
    mockCtx.message.text = '/timeframe 1h';
    const setSpy = jest.spyOn(configStore, 'setTimeframe').mockImplementation();

    await timeframeHandler(mockCtx as unknown as Context);

    expect(setSpy).toHaveBeenCalledWith('ONE_HOUR');
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('1h'), expect.any(Object));
  });

  it('should handle invalid timeframe', async () => {
    mockCtx.message.text = '/timeframe abc';
    await timeframeHandler(mockCtx as unknown as Context);
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Invalid timeframe'),
      expect.any(Object)
    );
  });
});

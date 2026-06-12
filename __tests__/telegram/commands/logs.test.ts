import { Context } from 'telegraf';
import { logsHandler } from '../../../src/telegram/commands/logs';
import fs from 'fs/promises';

jest.mock('fs/promises');

describe('LogsCommand', () => {
  let mockCtx: {
    reply: jest.Mock;
    replyWithMarkdown: jest.Mock;
  };

  beforeEach(() => {
    mockCtx = {
      reply: jest.fn(),
      replyWithMarkdown: jest.fn(),
    };
    jest.clearAllMocks();
    // Default mock for access to pass
    (fs.access as jest.Mock).mockResolvedValue(undefined);
  });

  it('should return recent logs from file', async () => {
    const mockFiles = ['st-etf-2026-06-12.log', 'st-etf-2026-06-11.log'];
    const mockContent = 'line 1\nline 2\nline 3';

    (fs.readdir as jest.Mock).mockResolvedValue(mockFiles);
    (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

    await logsHandler(mockCtx as unknown as Context);

    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Last 25 lines from st-etf-2026-06-12.log'),
      expect.objectContaining({ parse_mode: 'Markdown' })
    );
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('line 1\nline 2\nline 3'),
      expect.any(Object)
    );
  });

  it('should handle missing logs directory', async () => {
    (fs.access as jest.Mock).mockRejectedValue(new Error('Directory not found'));

    await logsHandler(mockCtx as unknown as Context);

    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Logs directory not found'));
  });

  it('should handle no log files found', async () => {
    (fs.readdir as jest.Mock).mockResolvedValue([]);

    await logsHandler(mockCtx as unknown as Context);

    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('No log files found'));
  });

  it('should handle read errors gracefully', async () => {
    (fs.readdir as jest.Mock).mockResolvedValue(['st-etf-2026-06-12.log']);
    (fs.readFile as jest.Mock).mockRejectedValue(new Error('Read failed'));

    await logsHandler(mockCtx as unknown as Context);

    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('Failed to fetch logs: Read failed')
    );
  });
});

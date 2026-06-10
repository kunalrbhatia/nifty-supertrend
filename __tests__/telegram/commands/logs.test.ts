import { Context } from 'telegraf';
import { logsHandler } from '../../../src/telegram/commands/logs';
import * as child_process from 'child_process';
import fs from 'fs';

jest.mock('child_process');

describe('LogsCommand', () => {
  let mockCtx: {
    reply: jest.Mock;
  };

  beforeEach(() => {
    mockCtx = { reply: jest.fn() };
    jest.clearAllMocks();
  });

  it('should return PM2 logs if available', async () => {
    jest.spyOn(child_process, 'execSync').mockReturnValue(Buffer.from('pm2 logs output'));
    await logsHandler(mockCtx as unknown as Context);
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('pm2 logs output'),
      expect.any(Object)
    );
  });

  it('should fallback to file logs if PM2 fails', async () => {
    jest.spyOn(child_process, 'execSync').mockImplementation(() => {
      throw new Error('fail');
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(fs, 'readdirSync').mockReturnValue(['st-etf-2024-06-10.log'] as any);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('file log output1\nfile log output2');

    await logsHandler(mockCtx as unknown as Context);
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('file log output'),
      expect.any(Object)
    );
  });

  it('should handle errors gracefully', async () => {
    jest.spyOn(child_process, 'execSync').mockImplementation(() => {
      throw new Error('fail');
    });
    jest.spyOn(fs, 'readdirSync').mockImplementation(() => {
      throw new Error('FS error');
    });

    await logsHandler(mockCtx as unknown as Context);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('FS error'));
  });
});

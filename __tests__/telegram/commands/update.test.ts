import { Context } from 'telegraf';
import { updateHandler } from '../../../src/telegram/commands/update';
import * as child_process from 'child_process';

jest.mock('child_process');

describe('UpdateCommand', () => {
  let mockCtx: {
    reply: jest.Mock;
  };

  beforeEach(() => {
    mockCtx = { reply: jest.fn() };
    jest.clearAllMocks();
  });

  it('should trigger update and handle success', async () => {
    jest
      .spyOn(child_process, 'exec')
      .mockImplementation(
        (
          cmd: string,
          options: unknown,
          callback?: (error: Error | null, stdout: string, stderr: string) => void
        ) => {
          const cb = typeof options === 'function' ? options : callback;
          if (cb) cb(null, 'stdout', 'stderr');
          return {} as child_process.ChildProcess;
        }
      );

    await updateHandler(mockCtx as unknown as Context);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Updating'));
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('successfully!'));
  });

  it('should handle update failure', async () => {
    jest
      .spyOn(child_process, 'exec')
      .mockImplementation(
        (
          cmd: string,
          options: unknown,
          callback?: (error: Error | null, stdout: string, stderr: string) => void
        ) => {
          const cb = typeof options === 'function' ? options : callback;
          if (cb) cb(new Error('Update failed'), 'stdout', 'stderr');
          return {} as child_process.ChildProcess;
        }
      );

    await updateHandler(mockCtx as unknown as Context);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('failed'));
  });
});

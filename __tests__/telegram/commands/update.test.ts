import { updateHandler } from '../../../src/telegram/commands/update';
import * as child_process from 'child_process';

jest.mock('child_process');

describe('UpdateCommand', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = { reply: jest.fn() };
    jest.clearAllMocks();
  });

  it('should trigger update and handle success', async () => {
    jest.spyOn(child_process, 'exec').mockImplementation((cmd, callback: any) => {
      callback(null, 'stdout', 'stderr');
      return {} as any;
    });

    await updateHandler(mockCtx);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Updating'));
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('successfully!'));
  });

  it('should handle update failure', async () => {
    jest.spyOn(child_process, 'exec').mockImplementation((cmd, callback: any) => {
      callback(new Error('Update failed'), 'stdout', 'stderr');
      return {} as any;
    });

    await updateHandler(mockCtx);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('failed'));
  });
});

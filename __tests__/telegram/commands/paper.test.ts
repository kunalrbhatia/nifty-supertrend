import { paperHandler } from '../../../src/telegram/commands/paper';
import * as modeManager from '../../../src/helpers/modeManager';

jest.mock('../../../src/helpers/modeManager');

describe('PaperCommand', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      reply: jest.fn(),
    };
    jest.clearAllMocks();
  });

  it('should toggle paper mode', async () => {
    jest.spyOn(modeManager, 'isPaperMode').mockReturnValue(false);
    const setSpy = jest.spyOn(modeManager, 'setPaperMode').mockImplementation();

    await paperHandler(mockCtx);

    expect(setSpy).toHaveBeenCalledWith(true);
    expect(mockCtx.reply).toHaveBeenCalledWith(
      expect.stringContaining('*PAPER*'),
      expect.any(Object)
    );
  });
});

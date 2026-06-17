import axios from 'axios';
import { sendNotification } from '../src/notifier';
import logger from '../src/helpers/logger';
import { config } from '../src/config/env';

jest.mock('axios');
jest.mock('../src/helpers/logger');
jest.mock('../src/config/env', () => ({
  config: {
    TELEGRAM_ENABLED: true,
    TELEGRAM_BOT_TOKEN: 'test_token',
    TELEGRAM_CHAT_ID: 'test_id',
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Notifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (config as any).TELEGRAM_ENABLED = true;
  });

  it('should send notification via axios', async () => {
    mockedAxios.post.mockResolvedValue({ data: { ok: true } });
    await sendNotification('test message');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('sendMessage'),
      expect.any(Object)
    );
  });

  it('should not send notification if disabled', async () => {
    (config as any).TELEGRAM_ENABLED = false;
    await sendNotification('test message');
    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Telegram Disabled'));
  });

  it('should log error if axios fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Axios Fail'));
    await sendNotification('test message');
    expect(logger.error).toHaveBeenCalled();
  });
});

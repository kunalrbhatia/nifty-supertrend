import axios from 'axios';
import { sendNotification, sendSlack, sendTelegram, notify } from '../src/notifier';
import logger from '../src/helpers/logger';
import { config } from '../src/config/env';

jest.mock('axios');
jest.mock('../src/helpers/logger');
jest.mock('../src/config/env', () => ({
  config: {
    TELEGRAM_ENABLED: true,
    TELEGRAM_BOT_TOKEN: 'test_token',
    TELEGRAM_CHAT_ID: 'test_id',
    SLACK_ENABLED: false,
    SLACK_WEBHOOK_URL: 'test_webhook_url',
  },
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Notifier', () => {
  const mutableConfig = config as unknown as {
    TELEGRAM_ENABLED: boolean;
    SLACK_ENABLED: boolean;
    SLACK_WEBHOOK_URL: string;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mutableConfig.TELEGRAM_ENABLED = true;
    mutableConfig.SLACK_ENABLED = false;
    mutableConfig.SLACK_WEBHOOK_URL = 'test_webhook_url';
  });

  describe('Telegram Notification', () => {
    it('should send notification via axios', async () => {
      mockedAxios.post.mockResolvedValue({ data: { ok: true } });
      await sendNotification('test message');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('sendMessage'),
        expect.objectContaining({
          chat_id: 'test_id',
          text: 'test message',
          parse_mode: 'Markdown',
        })
      );
    });

    it('should log error if Telegram axios post fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Telegram Fail'));
      await sendTelegram('test message');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send Telegram notification: Telegram Fail')
      );
    });

    it('should log error if Telegram axios post fails with non-Error object', async () => {
      mockedAxios.post.mockRejectedValue('String Error Telegram');
      await sendTelegram('test message');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send Telegram notification: String Error Telegram')
      );
    });
  });

  describe('Slack Notification', () => {
    it('should send slack notification via axios', async () => {
      mockedAxios.post.mockResolvedValue({ data: { ok: true } });
      await sendSlack('slack message');
      expect(mockedAxios.post).toHaveBeenCalledWith('test_webhook_url', { text: 'slack message' });
    });

    it('should log error if slack webhook URL is not configured', async () => {
      mutableConfig.SLACK_WEBHOOK_URL = '';
      await sendSlack('slack message');
      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Slack webhook URL is not configured')
      );
    });

    it('should log error if Slack axios post fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Slack Fail'));
      await sendSlack('slack message');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send Slack notification: Slack Fail')
      );
    });

    it('should handle non-Error catch block values', async () => {
      mockedAxios.post.mockRejectedValue('String Error');
      await sendSlack('slack message');
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send Slack notification: String Error')
      );
    });
  });

  describe('Generic Notification (notify)', () => {
    it('should default to Telegram if both Telegram and Slack are enabled', async () => {
      mutableConfig.TELEGRAM_ENABLED = true;
      mutableConfig.SLACK_ENABLED = true;
      mockedAxios.post.mockResolvedValue({ data: { ok: true } });

      await notify('both enabled message');

      // Should only send via Telegram (the telegram url contains 'sendMessage')
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('sendMessage'),
        expect.any(Object)
      );
    });

    it('should send via Slack if Telegram is disabled but Slack is enabled', async () => {
      mutableConfig.TELEGRAM_ENABLED = false;
      mutableConfig.SLACK_ENABLED = true;
      mockedAxios.post.mockResolvedValue({ data: { ok: true } });

      await notify('slack fallback message');

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith('test_webhook_url', {
        text: 'slack fallback message',
      });
    });

    it('should log info and not post if both Telegram and Slack are disabled', async () => {
      mutableConfig.TELEGRAM_ENABLED = false;
      mutableConfig.SLACK_ENABLED = false;

      await notify('no channel message');

      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Notification (Telegram and Slack Disabled): no channel message')
      );
    });
  });
});

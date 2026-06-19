import logger from '../src/helpers/logger';
import { parseConfig } from '../src/config/env';

jest.mock('../src/helpers/logger');

describe('Environment Schema Validation', () => {
  let mockExit: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    mockExit.mockRestore();
  });

  const getValidEnv = (): Record<string, string> => ({
    PORT: '3000',
    NODE_ENV: 'test',
    API_KEY: 'test_api_key',
    CLIENT_CODE: 'test_code',
    CLIENT_PIN: '1234',
    CLIENT_TOTP_PIN: 'secret',
    TELEGRAM_BOT_TOKEN: 'token',
    TELEGRAM_CHAT_ID: 'chat_id',
    TELEGRAM_ENABLED: 'true',
    SLACK_ENABLED: 'false',
    SLACK_WEBHOOK_URL: '',
  });

  it('should parse valid environment variables with Telegram enabled', () => {
    const env = getValidEnv();
    const config = parseConfig(env);
    expect(config.TELEGRAM_ENABLED).toBe(true);
    expect(config.SLACK_ENABLED).toBe(false);
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should override SLACK_ENABLED to false if TELEGRAM_ENABLED is true even if SLACK_ENABLED is set to true', () => {
    const env = getValidEnv();
    env.TELEGRAM_ENABLED = 'true';
    env.SLACK_ENABLED = 'true';
    env.SLACK_WEBHOOK_URL = 'http://webhook';

    const config = parseConfig(env);
    expect(config.TELEGRAM_ENABLED).toBe(true);
    expect(config.SLACK_ENABLED).toBe(false);
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should keep SLACK_ENABLED as true if TELEGRAM_ENABLED is false and SLACK_ENABLED is true with webhook url', () => {
    const env = getValidEnv();
    env.TELEGRAM_ENABLED = 'false';
    env.SLACK_ENABLED = 'true';
    env.SLACK_WEBHOOK_URL = 'http://webhook';

    const config = parseConfig(env);
    expect(config.TELEGRAM_ENABLED).toBe(false);
    expect(config.SLACK_ENABLED).toBe(true);
    expect(config.SLACK_WEBHOOK_URL).toBe('http://webhook');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should call process.exit(1) if TELEGRAM_ENABLED is false, SLACK_ENABLED is true, but webhook url is missing', () => {
    const env = getValidEnv();
    env.TELEGRAM_ENABLED = 'false';
    env.SLACK_ENABLED = 'true';
    env.SLACK_WEBHOOK_URL = '';

    parseConfig(env);
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should call process.exit(1) if a required environment variable is missing', () => {
    const env = getValidEnv();
    delete env.API_KEY;

    parseConfig(env);
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(logger.error).toHaveBeenCalled();
  });
});

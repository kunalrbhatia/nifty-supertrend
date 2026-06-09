import axios from 'axios';
import { sendNotification } from '../src/notifier';
import logger from '../src/helpers/logger';

jest.mock('axios');
jest.mock('../src/helpers/logger');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Notifier', () => {
  it('should send notification via axios', async () => {
    mockedAxios.post.mockResolvedValue({ data: { ok: true } });
    await sendNotification('test message');
    expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining('sendMessage'), expect.any(Object));
  });

  it('should log error if axios fails', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Axios Fail'));
    await sendNotification('test message');
    expect(logger.error).toHaveBeenCalled();
  });
});

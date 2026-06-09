import { login } from '../../src/helpers/login';
import api from '../../src/helpers/api';
import sessionStore from '../../src/store/sessionStore';

jest.mock('otplib', () => ({
  generate: jest.fn().mockReturnValue('123456')
}));
jest.mock('../../src/helpers/api');
jest.mock('../../src/store/sessionStore');
const mockedApi = api as jest.Mocked<typeof api>;

describe('Login Helper', () => {
  it('should login successfully', async () => {
    mockedApi.post.mockResolvedValue({
      data: {
        status: true,
        data: {
          jwtToken: 'jwt',
          refreshToken: 'refresh',
          feedToken: 'feed'
        }
      }
    });

    const setSpy = jest.spyOn(sessionStore, 'set');

    await login();

    expect(setSpy).toHaveBeenCalledWith('jwt', 'refresh', 'feed');
  });

  it('should throw error if login fails', async () => {
    mockedApi.post.mockResolvedValue({
      data: { status: false, message: 'Invalid credentials' }
    });

    await expect(login()).rejects.toThrow('Invalid credentials');
  });
});

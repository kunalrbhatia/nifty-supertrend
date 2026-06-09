import sessionStore from '../../src/store/sessionStore';

describe('SessionStore', () => {
  it('should store and retrieve tokens correctly', () => {
    sessionStore.set('jwt', 'refresh', 'feed');
    const tokens = sessionStore.get();
    expect(tokens.jwtToken).toBe('jwt');
    expect(tokens.refreshToken).toBe('refresh');
    expect(tokens.feedToken).toBe('feed');
  });
});

class SessionStore {
  private jwtToken: string | null = null;
  private refreshToken: string | null = null;
  private feedToken: string | null = null;

  set(jwtToken: string, refreshToken: string, feedToken: string): void {
    this.jwtToken = jwtToken;
    this.refreshToken = refreshToken;
    this.feedToken = feedToken;
  }

  get() {
    return {
      jwtToken: this.jwtToken,
      refreshToken: this.refreshToken,
      feedToken: this.feedToken,
    };
  }
}

export default new SessionStore();

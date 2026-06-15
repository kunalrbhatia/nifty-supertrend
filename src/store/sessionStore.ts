import fs from 'fs';
import path from 'path';
import logger from '../helpers/logger.js';

const SESSION_FILE = path.join(process.cwd(), 'data/session.json');

class SessionStore {
  private jwtToken: string | null = null;
  private refreshToken: string | null = null;
  private feedToken: string | null = null;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(SESSION_FILE)) {
        const data = fs.readFileSync(SESSION_FILE, 'utf-8');
        const session = JSON.parse(data);
        this.jwtToken = session.jwtToken;
        this.refreshToken = session.refreshToken;
        this.feedToken = session.feedToken;
      }
    } catch (error) {
      logger.error('Error loading session:', error);
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(SESSION_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        SESSION_FILE,
        JSON.stringify(
          {
            jwtToken: this.jwtToken,
            refreshToken: this.refreshToken,
            feedToken: this.feedToken,
          },
          null,
          2
        )
      );
    } catch (error) {
      logger.error('Error saving session:', error);
    }
  }

  set(jwtToken: string, refreshToken: string, feedToken: string): void {
    this.jwtToken = jwtToken;
    this.refreshToken = refreshToken;
    this.feedToken = feedToken;
    this.save();
  }

  get() {
    this.load(); // Refresh from file in case another process updated it
    return {
      jwtToken: this.jwtToken,
      refreshToken: this.refreshToken,
      feedToken: this.feedToken,
    };
  }
}

export default new SessionStore();

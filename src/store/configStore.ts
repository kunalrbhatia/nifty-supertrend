import fs from 'fs';
import path from 'path';
import logger from '../helpers/logger.js';
import { CONSTANTS } from '../helpers/constants.js';

export interface AppConfig {
  investmentAmount: number;
  timeframe: string;
  index: 'nifty' | 'banknifty';
}

const CONFIG_FILE = path.join(process.cwd(), 'data/config.json');

const initialConfig: AppConfig = {
  investmentAmount: CONSTANTS.DEFAULT_INVESTMENT,
  timeframe: CONSTANTS.INTERVAL_DAILY,
  index: 'nifty',
};

class ConfigStore {
  private config: AppConfig;

  constructor() {
    this.config = this.load();
  }

  private load(): AppConfig {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
        return { ...initialConfig, ...JSON.parse(data) };
      }
    } catch (error) {
      logger.error('Error loading config:', error);
    }
    return { ...initialConfig };
  }

  private save(): void {
    try {
      const dir = path.dirname(CONFIG_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
    } catch (error) {
      logger.error('Error saving config:', error);
    }
  }

  get(): AppConfig {
    return { ...this.config };
  }

  getInvestmentAmount(): number {
    return this.config.investmentAmount;
  }

  setInvestmentAmount(amount: number): void {
    this.config.investmentAmount = amount;
    this.save();
  }

  getTimeframe(): string {
    return this.config.timeframe;
  }

  setTimeframe(timeframe: string): void {
    this.config.timeframe = timeframe;
    this.save();
  }

  getIndex(): 'nifty' | 'banknifty' {
    return this.config.index || 'nifty';
  }

  setIndex(index: 'nifty' | 'banknifty'): void {
    this.config.index = index;
    this.save();
  }

  reset(): void {
    this.config = { ...initialConfig };
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  }
}

export default new ConfigStore();

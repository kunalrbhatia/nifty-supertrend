import fs from 'fs';
import path from 'path';
import logger from '../helpers/logger.js';
import { CONSTANTS } from '../helpers/constants.js';

export interface AppConfig {
  investmentAmount: number;
}

const CONFIG_FILE = path.join(process.cwd(), 'data/config.json');

const initialConfig: AppConfig = {
  investmentAmount: CONSTANTS.DEFAULT_INVESTMENT,
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
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Error loading config:', error);
    }
    return { ...initialConfig };
  }

  private save(): void {
    try {
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
}

export default new ConfigStore();

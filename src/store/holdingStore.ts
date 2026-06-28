import fs from 'fs';
import path from 'path';
import logger from '../helpers/logger.js';
import configStore from './configStore.js';

export interface HoldingTrade {
  date: string;
  qty: number;
  price: number;
}

export interface HoldingState {
  totalQuantity: number;
  averagePrice: number;
  totalInvestment: number;
  lastSignal: 'BUY' | 'SELL' | 'NONE';
  trades: HoldingTrade[];
}

export interface MultiHoldingState {
  nifty: HoldingState;
  banknifty: HoldingState;
}

const HOLDINGS_FILE = path.join(process.cwd(), 'data/holdings.json');

const initialState: HoldingState = {
  totalQuantity: 0,
  averagePrice: 0,
  totalInvestment: 0,
  lastSignal: 'NONE',
  trades: [],
};

class HoldingStore {
  private state: MultiHoldingState;

  constructor() {
    this.state = this.load();
  }

  private load(): MultiHoldingState {
    try {
      if (fs.existsSync(HOLDINGS_FILE)) {
        const data = fs.readFileSync(HOLDINGS_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        if (parsed.nifty || parsed.banknifty) {
          return {
            nifty: parsed.nifty || { ...initialState },
            banknifty: parsed.banknifty || { ...initialState },
          };
        } else {
          // Migrate old single holding format
          return {
            nifty: parsed,
            banknifty: { ...initialState },
          };
        }
      }
    } catch (error) {
      logger.error('Error loading holdings:', error);
    }
    return {
      nifty: { ...initialState },
      banknifty: { ...initialState },
    };
  }

  private save(): void {
    try {
      const dir = path.dirname(HOLDINGS_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(HOLDINGS_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      logger.error('Error saving holdings:', error);
    }
  }

  get(index?: 'nifty' | 'banknifty'): HoldingState {
    const idx = index || configStore.getIndex();
    return { ...this.state[idx] };
  }

  addBuy(qty: number, price: number, index?: 'nifty' | 'banknifty'): void {
    const idx = index || configStore.getIndex();
    this.state[idx].totalInvestment += qty * price;
    this.state[idx].totalQuantity += qty;
    this.state[idx].averagePrice = this.state[idx].totalInvestment / this.state[idx].totalQuantity;
    this.state[idx].lastSignal = 'BUY';
    this.state[idx].trades.push({
      date: new Date().toISOString().split('T')[0],
      qty,
      price,
    });
    this.save();
  }

  clear(index?: 'nifty' | 'banknifty'): void {
    const idx = index || configStore.getIndex();
    this.state[idx] = { ...initialState, lastSignal: 'SELL' };
    this.save();
  }

  reset(): void {
    this.state = {
      nifty: { ...initialState },
      banknifty: { ...initialState },
    };
    if (fs.existsSync(HOLDINGS_FILE)) {
      fs.unlinkSync(HOLDINGS_FILE);
    }
  }
}

export default new HoldingStore();

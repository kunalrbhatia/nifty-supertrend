import fs from 'fs';
import path from 'path';
import logger from '../helpers/logger.js';

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

const HOLDINGS_FILE = path.join(process.cwd(), 'data/holdings.json');

const initialState: HoldingState = {
  totalQuantity: 0,
  averagePrice: 0,
  totalInvestment: 0,
  lastSignal: 'NONE',
  trades: [],
};

class HoldingStore {
  private state: HoldingState;

  constructor() {
    this.state = this.load();
  }

  private load(): HoldingState {
    try {
      if (fs.existsSync(HOLDINGS_FILE)) {
        const data = fs.readFileSync(HOLDINGS_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Error loading holdings:', error);
    }
    return { ...initialState };
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

  get(): HoldingState {
    return { ...this.state };
  }

  addBuy(qty: number, price: number): void {
    this.state.totalInvestment += qty * price;
    this.state.totalQuantity += qty;
    this.state.averagePrice = this.state.totalInvestment / this.state.totalQuantity;
    this.state.lastSignal = 'BUY';
    this.state.trades.push({
      date: new Date().toISOString().split('T')[0],
      qty,
      price,
    });
    this.save();
  }

  clear(): void {
    this.state = { ...initialState, lastSignal: 'SELL' };
    this.save();
  }

  reset(): void {
    this.state = { ...initialState };
    if (fs.existsSync(HOLDINGS_FILE)) {
      fs.unlinkSync(HOLDINGS_FILE);
    }
  }
}

export default new HoldingStore();

import fs from 'fs';
import path from 'path';
import holdingStore from '../../src/store/holdingStore';

const HOLDINGS_FILE = path.join(process.cwd(), 'data/holdings.json');

describe('HoldingStore', () => {
  beforeEach(() => {
    holdingStore.reset();
  });

  afterAll(() => {
    if (fs.existsSync(HOLDINGS_FILE)) {
      fs.unlinkSync(HOLDINGS_FILE);
    }
  });

  it('should initialize with empty state', () => {
    const state = holdingStore.get();
    expect(state.totalQuantity).toBe(0);
    expect(state.trades).toHaveLength(0);
  });

  it('should add a buy trade correctly', () => {
    holdingStore.addBuy(10, 100);
    const state = holdingStore.get();
    expect(state.totalQuantity).toBe(10);
    expect(state.totalInvestment).toBe(1000);
    expect(state.averagePrice).toBe(100);
    expect(state.trades).toHaveLength(1);
  });

  it('should average multiple buys correctly', () => {
    holdingStore.addBuy(10, 100);
    holdingStore.addBuy(10, 120);
    const state = holdingStore.get();
    expect(state.totalQuantity).toBe(20);
    expect(state.totalInvestment).toBe(2200);
    expect(state.averagePrice).toBe(110);
  });

  it('should clear holdings correctly', () => {
    holdingStore.addBuy(10, 100);
    holdingStore.clear();
    const state = holdingStore.get();
    expect(state.totalQuantity).toBe(0);
    expect(state.lastSignal).toBe('SELL');
  });
});

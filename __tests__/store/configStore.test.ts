import fs from 'fs';
import path from 'path';
import configStore from '../../src/store/configStore';
import { CONSTANTS } from '../../src/helpers/constants';

const CONFIG_FILE = path.join(process.cwd(), 'data/config.json');

describe('ConfigStore', () => {
  beforeEach(() => {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
    // Reset singleton state manually for tests
    (configStore as any).config = {
      investmentAmount: CONSTANTS.DEFAULT_INVESTMENT,
    };
  });

  afterAll(() => {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  });

  it('should initialize with default investment amount', () => {
    expect(configStore.getInvestmentAmount()).toBe(CONSTANTS.DEFAULT_INVESTMENT);
  });

  it('should update investment amount correctly', () => {
    configStore.setInvestmentAmount(20000);
    expect(configStore.getInvestmentAmount()).toBe(20000);
    
    // Verify persistence
    expect(fs.existsSync(CONFIG_FILE)).toBe(true);
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    expect(data.investmentAmount).toBe(20000);
  });
});

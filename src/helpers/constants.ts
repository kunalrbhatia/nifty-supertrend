export const CONSTANTS = {
  NIFTY50_TOKEN: '99926000',
  NIFTY50_SYMBOL: 'Nifty 50',
  NIFTYBEES_TOKEN: '10576',
  NIFTYBEES_SYMBOL: 'NIFTYBEES-EQ',
  BANKNIFTY_TOKEN: '99926009',
  BANKNIFTY_SYMBOL: 'Nifty Bank',
  BANKBEES_TOKEN: '11439',
  BANKBEES_SYMBOL: 'BANKBEES-EQ',
  EXCHANGE: 'NSE',
  INTERVAL_DAILY: 'ONE_DAY',
  MIN_PROFIT_PERCENT: 1.0,
  DEFAULT_INVESTMENT: 10000,
  TIMEZONE: 'Asia/Kolkata',
};

export interface IndexDetails {
  indexToken: string;
  indexSymbol: string;
  etfToken: string;
  etfSymbol: string;
  name: string;
  etfName: string;
}

export const INDEX_MAP: Record<'nifty' | 'banknifty', IndexDetails> = {
  nifty: {
    indexToken: CONSTANTS.NIFTY50_TOKEN,
    indexSymbol: CONSTANTS.NIFTY50_SYMBOL,
    etfToken: CONSTANTS.NIFTYBEES_TOKEN,
    etfSymbol: CONSTANTS.NIFTYBEES_SYMBOL,
    name: 'Nifty 50',
    etfName: 'NIFTYBEES',
  },
  banknifty: {
    indexToken: CONSTANTS.BANKNIFTY_TOKEN,
    indexSymbol: CONSTANTS.BANKNIFTY_SYMBOL,
    etfToken: CONSTANTS.BANKBEES_TOKEN,
    etfSymbol: CONSTANTS.BANKBEES_SYMBOL,
    name: 'Nifty Bank',
    etfName: 'BANKBEES',
  },
};

export const TIMEFRAMES: Record<string, string> = {
  '1': 'ONE_MINUTE',
  '3': 'THREE_MINUTE',
  '5': 'FIVE_MINUTE',
  '10': 'TEN_MINUTE',
  '15': 'FIFTEEN_MINUTE',
  '30': 'THIRTY_MINUTE',
  '1h': 'ONE_HOUR',
  '1d': 'ONE_DAY',
};

export const API_URLS = {
  SMART_API_BASE: 'https://apiconnect.angelbroking.com',
  LOGIN: '/rest/auth/angelbroking/user/v1/loginByPassword',
  HISTORICAL: '/rest/secure/angelbroking/historical/v1/getCandleData',
  QUOTE: '/rest/secure/angelbroking/market/v1/quote',
  ORDER: '/rest/secure/angelbroking/order/v1/placeOrder',
  HOLIDAYS: 'https://www.nseindia.com/api/holiday-master?type=trading',
};

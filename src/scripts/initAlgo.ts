import { login } from '../helpers/login.js';
import { getLtp } from '../helpers/marketData.js';
import { CONSTANTS } from '../helpers/constants.js';
import logger from '../helpers/logger.js';

/**
 * Independent script to initialize the algo:
 * 1. Performs login to SmartAPI.
 * 2. Verifies connection with a health check (LTP fetch).
 * 3. Persists the session for other processes (via SessionStore).
 */
async function initAlgo() {
  logger.info('🚀 Starting Algo Initialization (Health Check)...');

  try {
    // 1. Perform Login
    logger.info('Performing login to SmartAPI...');
    await login();

    // 2. Health Check: Fetch LTP for Nifty 50 and NIFTYBEES
    logger.info('Performing health check (LTP fetch)...');

    // Fetch Nifty 50 LTP
    const n50Ltp = await getLtp(CONSTANTS.NIFTY50_TOKEN, CONSTANTS.EXCHANGE);
    logger.info(`Nifty 50 LTP: ₹${n50Ltp}`);

    // Fetch NIFTYBEES LTP
    const beesLtp = await getLtp(CONSTANTS.NIFTYBEES_TOKEN, CONSTANTS.EXCHANGE);
    logger.info(`NIFTYBEES LTP: ₹${beesLtp}`);

    logger.info('✅ Algo initialization successful. Connection and Session verified.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Algo initialization failed: ${errorMessage}`);
    // Exit with error so crontab/PM2 can detect failure if needed
    process.exit(1);
  }
}

initAlgo();

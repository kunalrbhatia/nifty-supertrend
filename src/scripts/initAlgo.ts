import { login } from '../helpers/login.js';
import { getLtp } from '../helpers/marketData.js';
import { CONSTANTS, INDEX_MAP } from '../helpers/constants.js';
import logger from '../helpers/logger.js';
import configStore from '../store/configStore.js';

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

    // 2. Health Check: Fetch LTP for configured index and ETF
    logger.info('Performing health check (LTP fetch)...');

    const currentIndex = configStore.getIndex();
    const indexDetails = INDEX_MAP[currentIndex];

    // Fetch Index LTP
    const indexLtp = await getLtp(indexDetails.indexToken, CONSTANTS.EXCHANGE);
    logger.info(`${indexDetails.name} LTP: ₹${indexLtp}`);

    // Fetch ETF LTP
    const etfLtp = await getLtp(indexDetails.etfToken, CONSTANTS.EXCHANGE);
    logger.info(`${indexDetails.etfName} LTP: ₹${etfLtp}`);

    logger.info('✅ Algo initialization successful. Connection and Session verified.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Algo initialization failed: ${errorMessage}`);
    // Exit with error so crontab/PM2 can detect failure if needed
    process.exit(1);
  }
}

initAlgo();

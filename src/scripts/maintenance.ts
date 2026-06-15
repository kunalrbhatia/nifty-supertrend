import { execSync } from 'child_process';
import logger from '../helpers/logger.js';

/**
 * Performs daily maintenance:
 * 1. Fresh build
 * 2. Update scrip master
 * 3. PM2 restart
 */
async function runMaintenance() {
  try {
    logger.info('Starting daily maintenance...');

    // 1. Fresh build
    logger.info('Building project...');
    execSync('npm run build', { stdio: 'inherit' });

    // 2. Update Scrip Master
    logger.info('Updating scrip master...');
    execSync('npm run update-scrip', { stdio: 'inherit' });

    // 3. PM2 Restart
    // Using --non-interactive and ensuring it targets the right config
    logger.info('Restarting PM2 process...');
    execSync('pm2 restart ecosystem.config.cjs', { stdio: 'inherit' });

    // 4. Algo Initialization & Health Check
    logger.info('Initializing algo and performing health check...');
    execSync('npm run init-algo', { stdio: 'inherit' });

    logger.info('Daily maintenance and initialization completed successfully.');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Maintenance failed: ${errorMessage}`);
    // Don't exit(1) if called from within the app, but here it's likely a standalone trigger
    process.exit(1);
  }
}

runMaintenance();

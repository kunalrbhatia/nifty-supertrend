import { execSync } from 'child_process';
import logger from '../helpers/logger.js';

/**
 * Simple script to watch PR checks via GitHub CLI.
 */
async function checkPrStatus() {
  try {
    logger.info('Watching PR checks...');
    execSync('gh pr checks --watch', { stdio: 'inherit' });
  } catch (error: any) {
    logger.error(`PR check failed: ${error.message}`);
  }
}

checkPrStatus();

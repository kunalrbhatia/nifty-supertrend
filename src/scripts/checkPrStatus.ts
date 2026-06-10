import { execSync } from 'child_process';
import logger from '../helpers/logger.js';

/**
 * Simple script to watch PR checks via GitHub CLI.
 */
async function checkPrStatus() {
  try {
    logger.info('Watching PR checks...');
    execSync('gh pr checks --watch', { stdio: 'inherit' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`PR check failed: ${errorMessage}`);
  }
}

checkPrStatus();

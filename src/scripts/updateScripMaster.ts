import axios from 'axios';
import fs from 'fs';
import path from 'path';
import logger from '../helpers/logger.js';

const SCRIP_MASTER_FILE = path.join(process.cwd(), 'data/scrip-master.json');

/**
 * Downloads and caches the Angel One scrip master.
 */
async function updateScripMaster() {
  logger.info('Updating scrip master...');

  try {
    const response = await axios.get(
      'https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json'
    );

    if (Array.isArray(response.data)) {
      fs.writeFileSync(SCRIP_MASTER_FILE, JSON.stringify(response.data, null, 2));
      logger.info(`Successfully updated scrip master (${response.data.length} records)`);
    } else {
      throw new Error('Invalid scrip master data received');
    }
  } catch (error: any) {
    logger.error(`Failed to update scrip master: ${error.message}`);
    process.exit(1);
  }
}

updateScripMaster();

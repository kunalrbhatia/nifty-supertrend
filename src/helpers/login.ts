import { generate } from 'otplib';
import { config } from '../config/env.js';
import api from './api.js';
import { API_URLS } from './constants.js';
import sessionStore from '../store/sessionStore.js';
import logger from './logger.js';

/**
 * Login to SmartAPI using TOTP.
 */
export async function login(): Promise<void> {
  try {
    const totp = await generate({ secret: config.CLIENT_TOTP_PIN });

    const response = await api.post(API_URLS.LOGIN, {
      clientcode: config.CLIENT_CODE,
      password: config.CLIENT_PIN,
      totp: totp,
    });

    if (response.data && response.data.status) {
      const { jwtToken, refreshToken, feedToken } = response.data.data;
      sessionStore.set(jwtToken, refreshToken, feedToken);
      logger.info('Successfully logged into SmartAPI');
    } else {
      logger.error(`Login failed with response: ${JSON.stringify(response.data)}`);
      throw new Error(response.data?.message || 'Login failed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Login error:', errorMessage);
    throw error;
  }
}

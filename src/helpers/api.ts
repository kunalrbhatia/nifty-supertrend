import axios, { InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/env.js';
import sessionStore from '../store/sessionStore.js';
import { API_URLS } from './constants.js';
import logger from './logger.js';
import { login } from './login.js';

/**
 * Generic axios wrapper with auth headers and automatic retry.
 */
const api = axios.create({
  baseURL: API_URLS.SMART_API_BASE,
});

// To prevent infinite loop if login itself fails
let isRefreshing = false;

api.interceptors.request.use((req) => {
  const { jwtToken } = sessionStore.get();

  // These headers are required for ALL requests including login
  req.headers['X-PrivateKey'] = config.API_KEY;
  req.headers['Content-Type'] = 'application/json';
  req.headers['Accept'] = 'application/json';
  req.headers['X-SourceID'] = 'WEB';
  req.headers['X-ClientLocalIP'] = '192.168.1.1';
  req.headers['X-ClientPublicIP'] = '106.193.147.98';
  req.headers['X-MACAddress'] = '00-B0-D0-63-C2-26';
  req.headers['X-UserType'] = 'USER';
  req.headers['User-Agent'] =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

  if (jwtToken && req.url !== API_URLS.LOGIN) {
    req.headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  return req;
});

// Response interceptor for error handling and logging
api.interceptors.response.use(
  async (response) => {
    const originalRequest = response.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const data = response.data;
    if (data && (data.status === false || data.success === false)) {
      const errorCode = data.errorcode || data.errorCode;

      // AG8001 is "Invalid Token" or "Token Expired"
      if (
        (errorCode === 'AG8001' || errorCode === 'AB1010') &&
        !originalRequest._retry &&
        !isRefreshing
      ) {
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          logger.info('Session expired, attempting automatic re-login...');
          await login();
          isRefreshing = false;

          // Update the token in the original request and retry
          const { jwtToken } = sessionStore.get();
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${jwtToken}`;
          }
          return api(originalRequest);
        } catch (loginError) {
          isRefreshing = false;
          logger.error('Automatic re-login failed');
          throw loginError;
        }
      }

      logger.error(`API Error: ${data.message} (Code: ${errorCode})`);
      throw new Error(data.message);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized via HTTP status as well
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        logger.info('HTTP 401 detected, attempting automatic re-login...');
        await login();
        isRefreshing = false;
        const { jwtToken } = sessionStore.get();
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${jwtToken}`;
        }
        return api(originalRequest);
      } catch (loginError) {
        isRefreshing = false;
        throw loginError;
      }
    }

    logger.error(
      `HTTP Error details: config URL=${error.config?.url}, data=${error.config?.data}, response=${error.response?.status} ${error.response?.statusText}`
    );
    if (error.response && error.response.data) {
      logger.error(`HTTP Error Data: ${JSON.stringify(error.response.data)}`);
    } else {
      logger.error(`HTTP Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default api;

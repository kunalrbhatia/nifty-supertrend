import axios from 'axios';
import { config } from '../config/env.js';
import sessionStore from '../store/sessionStore.js';
import { API_URLS } from './constants.js';
import logger from './logger.js';

/**
 * Generic axios wrapper with auth headers and automatic retry.
 */
const api = axios.create({
  baseURL: API_URLS.SMART_API_BASE,
});

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

  if (jwtToken) {
    req.headers['Authorization'] = `Bearer ${jwtToken}`;
  }

  return req;
});

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    if (response.data && response.data.status === false) {
      logger.error(`API Error: ${response.data.message} (Code: ${response.data.errorcode})`);
      throw new Error(response.data.message);
    }
    return response;
  },
  (error) => {
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

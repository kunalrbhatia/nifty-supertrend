import express from 'express';
import logger from './helpers/logger.js';
import { config } from './config/env.js';

const app = express();

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

export function startServer() {
  app.listen(config.PORT, () => {
    logger.info(`Health check server running on port ${config.PORT}`);
  });
}

export default app;

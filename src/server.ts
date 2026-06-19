import express from 'express';
import logger from './helpers/logger.js';
import { config } from './config/env.js';
import { verifySlackSignature, handleSlackCommand, SlackRequest } from './slack/commands.js';

const app = express();

// Parse urlencoded bodies with raw body capture for Slack signature verification
app.use(
  express.urlencoded({
    extended: true,
    verify: (req: SlackRequest, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.post('/slack/commands', verifySlackSignature, handleSlackCommand);

export function startServer() {
  app.listen(config.PORT, () => {
    logger.info(`Health check server running on port ${config.PORT}`);
  });
}

export default app;

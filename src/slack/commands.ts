import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config/env.js';
import logger from '../helpers/logger.js';
import { statusHandler } from '../telegram/commands/status.js';
import { positionsHandler } from '../telegram/commands/positions.js';
import { logsHandler } from '../telegram/commands/logs.js';
import { paperHandler } from '../telegram/commands/paper.js';
import { updateHandler } from '../telegram/commands/update.js';
import { investHandler } from '../telegram/commands/invest.js';
import { timeframeHandler } from '../telegram/commands/timeframe.js';
import { forceInvestHandler } from '../telegram/commands/force_invest.js';
import { helpHandler } from '../telegram/commands/help.js';
import { Context } from 'telegraf';

export interface SlackRequest extends Request {
  rawBody?: string;
}

/**
 * Middleware to verify that the request came from Slack.
 */
export function verifySlackSignature(req: SlackRequest, res: Response, next: NextFunction) {
  const signingSecret = config.SLACK_SIGNING_SECRET;

  if (!signingSecret) {
    logger.warn('SLACK_SIGNING_SECRET is not set. Skipping Slack signature verification.');
    return next();
  }

  const signature = req.headers['x-slack-signature'] as string;
  const timestamp = req.headers['x-slack-request-timestamp'] as string;

  if (!signature || !timestamp) {
    logger.error('Slack signature verification failed: missing headers.');
    return res.status(401).json({ error: 'Unauthorized: Missing headers' });
  }

  // Prevent replay attacks (5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) {
    logger.error('Slack signature verification failed: timestamp expired.');
    return res.status(401).json({ error: 'Unauthorized: Timestamp expired' });
  }

  const rawBody = req.rawBody || '';
  const sigBasestring = `v0:${timestamp}:${rawBody}`;

  try {
    const hmac = crypto.createHmac('sha256', signingSecret);
    const computedSignature = `v0=${hmac.update(sigBasestring, 'utf8').digest('hex')}`;

    const computedBuf = Buffer.from(computedSignature, 'utf8');
    const signatureBuf = Buffer.from(signature, 'utf8');

    if (
      computedBuf.length === signatureBuf.length &&
      crypto.timingSafeEqual(computedBuf, signatureBuf)
    ) {
      return next();
    }
  } catch (error) {
    logger.error(`Error computing/comparing Slack signature: ${error}`);
  }

  logger.error('Slack signature verification failed: signature mismatch.');
  return res.status(401).json({ error: 'Unauthorized: Signature mismatch' });
}

const handlersMap: Record<string, (ctx: Context) => Promise<unknown>> = {
  status: statusHandler,
  pnl: statusHandler,
  positions: positionsHandler,
  logs: logsHandler,
  paper: paperHandler,
  update: updateHandler,
  invest: investHandler,
  timeframe: timeframeHandler,
  force_invest: forceInvestHandler,
  help: helpHandler,
};

/**
 * POST handler for Slack slash commands.
 */
export async function handleSlackCommand(req: Request, res: Response) {
  const { command, text, response_url: responseUrl } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Bad Request: Missing command' });
  }

  // Parse command name
  let commandName = command.replace(/^\//, '').toLowerCase();
  let commandText = text || '';

  // Support subcommands like: /algo status or /algo invest 20000
  if (!handlersMap[commandName]) {
    const parts = commandText.trim().split(/\s+/);
    if (parts.length > 0 && parts[0] !== '') {
      const potentialSubcommand = parts[0].toLowerCase().replace(/^\//, '');
      if (handlersMap[potentialSubcommand]) {
        commandName = potentialSubcommand;
        commandText = parts.slice(1).join(' ');
      }
    }
  }

  const handler = handlersMap[commandName];

  if (!handler) {
    return res.json({
      response_type: 'ephemeral',
      text: `❌ Unknown command: *${command}*. Type \`/algo help\` for options.`,
    });
  }

  logger.info(`Processing Slack command: ${commandName} with args: "${commandText}"`);

  let isResponseSent = false;
  const replies: string[] = [];

  const mockCtx = {
    message: {
      text: `/${commandName} ${commandText}`.trim(),
    },
    reply: async (msg: string) => {
      if (!isResponseSent) {
        replies.push(msg);
      } else if (responseUrl) {
        try {
          await axios.post(responseUrl, {
            response_type: 'ephemeral',
            text: msg,
          });
        } catch (err) {
          logger.error(`Failed to send async Slack reply: ${err}`);
        }
      }
    },
    replyWithMarkdown: async (msg: string) => {
      if (!isResponseSent) {
        replies.push(msg);
      } else if (responseUrl) {
        try {
          await axios.post(responseUrl, {
            response_type: 'ephemeral',
            text: msg,
          });
        } catch (err) {
          logger.error(`Failed to send async Slack reply: ${err}`);
        }
      }
    },
  };

  try {
    await handler(mockCtx as unknown as Context);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Slack command handler error: ${errorMessage}`);
    if (!isResponseSent) {
      replies.push(`❌ Error executing command: ${errorMessage}`);
    } else if (responseUrl) {
      try {
        await axios.post(responseUrl, {
          response_type: 'ephemeral',
          text: `❌ Error executing command: ${errorMessage}`,
        });
      } catch (err) {
        logger.error(`Failed to send async error Slack reply: ${err}`);
      }
    }
  } finally {
    isResponseSent = true;
    res.json({
      response_type: 'ephemeral',
      text: replies.join('\n\n') || 'Command processed.',
    });
  }
}

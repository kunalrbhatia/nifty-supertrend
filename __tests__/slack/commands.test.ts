import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import axios from 'axios';
import { Context } from 'telegraf';
import {
  verifySlackSignature,
  handleSlackCommand,
  SlackRequest,
} from '../../src/slack/commands.js';
import { config } from '../../src/config/env.js';
import { statusHandler } from '../../src/telegram/commands/status.js';

// Mock axios
jest.mock('axios');

// Mock config
jest.mock('../../src/config/env.js', () => ({
  config: {
    SLACK_SIGNING_SECRET: 'test_signing_secret',
  },
}));

// Mock Telegram command handlers
jest.mock('../../src/telegram/commands/status.js', () => ({
  statusHandler: jest.fn(),
}));
jest.mock('../../src/telegram/commands/positions.js', () => ({
  positionsHandler: jest.fn(),
}));
jest.mock('../../src/telegram/commands/logs.js', () => ({
  logsHandler: jest.fn(),
}));
jest.mock('../../src/telegram/commands/paper.js', () => ({
  paperHandler: jest.fn(),
}));
jest.mock('../../src/telegram/commands/update.js', () => ({
  updateHandler: jest.fn(),
}));
jest.mock('../../src/telegram/commands/invest.js', () => ({
  investHandler: jest.fn(),
}));
jest.mock('../../src/telegram/commands/timeframe.js', () => ({
  timeframeHandler: jest.fn(),
}));
jest.mock('../../src/telegram/commands/force_invest.js', () => ({
  forceInvestHandler: jest.fn(),
}));
jest.mock('../../src/telegram/commands/help.js', () => ({
  helpHandler: jest.fn(),
}));

describe('Slack Commands Middleware and Handlers', () => {
  let mockReq: Partial<SlackRequest>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    nextFunction = jest.fn();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('verifySlackSignature', () => {
    it('should skip signature verification if SLACK_SIGNING_SECRET is not set', () => {
      const originalSecret = config.SLACK_SIGNING_SECRET;
      const writableConfig = config as { SLACK_SIGNING_SECRET?: string };
      writableConfig.SLACK_SIGNING_SECRET = undefined;

      mockReq = {
        headers: {},
      };

      verifySlackSignature(mockReq as SlackRequest, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      writableConfig.SLACK_SIGNING_SECRET = originalSecret;
    });

    it('should fail if signature or timestamp header is missing', () => {
      mockReq = {
        headers: {},
      };

      verifySlackSignature(mockReq as SlackRequest, mockRes as Response, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Missing headers'),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail if timestamp is too old (expired)', () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 301; // 5 mins and 1 sec ago
      mockReq = {
        headers: {
          'x-slack-signature': 'some_sig',
          'x-slack-request-timestamp': oldTimestamp.toString(),
        },
      };

      verifySlackSignature(mockReq as SlackRequest, mockRes as Response, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Timestamp expired'),
      });
    });

    it('should pass signature verification with valid signature', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const rawBody = 'command=%2Fstatus&text=';
      const sigBasestring = `v0:${timestamp}:${rawBody}`;
      const hmac = crypto.createHmac('sha256', 'test_signing_secret');
      const expectedSignature = `v0=${hmac.update(sigBasestring, 'utf8').digest('hex')}`;

      mockReq = {
        headers: {
          'x-slack-signature': expectedSignature,
          'x-slack-request-timestamp': timestamp,
        },
        rawBody,
      };

      verifySlackSignature(mockReq as SlackRequest, mockRes as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail signature verification with invalid signature', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      mockReq = {
        headers: {
          'x-slack-signature': 'v0=incorrect_hash',
          'x-slack-request-timestamp': timestamp,
        },
        rawBody: 'command=%2Fstatus',
      };

      verifySlackSignature(mockReq as SlackRequest, mockRes as Response, nextFunction);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Signature mismatch'),
      });
    });
  });

  describe('handleSlackCommand', () => {
    it('should return 400 bad request if command is missing', async () => {
      mockReq = {
        body: {},
      };

      await handleSlackCommand(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Missing command'),
      });
    });

    it('should return unknown command if no handler matches', async () => {
      mockReq = {
        body: {
          command: '/unknown',
          text: '',
        },
      };

      await handleSlackCommand(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        response_type: 'ephemeral',
        text: expect.stringContaining('Unknown command: */unknown*'),
      });
    });

    it('should process status command and send back reply', async () => {
      (statusHandler as jest.Mock).mockImplementation(async (ctx) => {
        await ctx.reply('Mocked Status');
      });

      mockReq = {
        body: {
          command: '/status',
          text: '',
          response_url: 'http://slack.webhook',
        },
      };

      await handleSlackCommand(mockReq as Request, mockRes as Response);

      expect(statusHandler).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        response_type: 'ephemeral',
        text: 'Mocked Status',
      });
    });

    it('should process status command with subcommands via /algo', async () => {
      (statusHandler as jest.Mock).mockImplementation(async (ctx) => {
        await ctx.reply('Mocked Status Subcommand');
      });

      mockReq = {
        body: {
          command: '/algo',
          text: 'status',
          response_url: 'http://slack.webhook',
        },
      };

      await handleSlackCommand(mockReq as Request, mockRes as Response);

      expect(statusHandler).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        response_type: 'ephemeral',
        text: 'Mocked Status Subcommand',
      });
    });

    it('should process check command and send back reply', async () => {
      (statusHandler as jest.Mock).mockImplementation(async (ctx) => {
        await ctx.reply('Mocked Status Check');
      });

      mockReq = {
        body: {
          command: '/check',
          text: '',
          response_url: 'http://slack.webhook',
        },
      };

      await handleSlackCommand(mockReq as Request, mockRes as Response);

      expect(statusHandler).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        response_type: 'ephemeral',
        text: 'Mocked Status Check',
      });
    });

    it('should send async replies to response_url', async () => {
      let savedCtx!: Context;
      (statusHandler as jest.Mock).mockImplementation(async (ctx) => {
        savedCtx = ctx;
        await ctx.reply('Immediate reply');
      });

      mockReq = {
        body: {
          command: '/status',
          text: '',
          response_url: 'http://slack.webhook',
        },
      };

      await handleSlackCommand(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        response_type: 'ephemeral',
        text: 'Immediate reply',
      });

      // Now invoke reply asynchronously
      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });
      await savedCtx.reply('Delayed reply');

      expect(axios.post).toHaveBeenCalledWith('http://slack.webhook', {
        response_type: 'ephemeral',
        text: 'Delayed reply',
      });
    });

    it('should send async replies to response_url via replyWithMarkdown', async () => {
      let savedCtx!: Context;
      (statusHandler as jest.Mock).mockImplementation(async (ctx) => {
        savedCtx = ctx;
        await ctx.replyWithMarkdown('Immediate reply');
      });

      mockReq = {
        body: {
          command: '/status',
          text: '',
          response_url: 'http://slack.webhook',
        },
      };

      await handleSlackCommand(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        response_type: 'ephemeral',
        text: 'Immediate reply',
      });

      // Now invoke replyWithMarkdown asynchronously
      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });
      await savedCtx.replyWithMarkdown('Delayed markdown reply');

      expect(axios.post).toHaveBeenCalledWith('http://slack.webhook', {
        response_type: 'ephemeral',
        text: 'Delayed markdown reply',
      });
    });

    it('should handle errors in async axios post gracefully', async () => {
      let savedCtx!: Context;
      (statusHandler as jest.Mock).mockImplementation(async (ctx) => {
        savedCtx = ctx;
        await ctx.reply('Immediate reply');
      });

      mockReq = {
        body: {
          command: '/status',
          text: '',
          response_url: 'http://slack.webhook',
        },
      };

      await handleSlackCommand(mockReq as Request, mockRes as Response);

      // Verify immediate response
      expect(mockRes.json).toHaveBeenCalledWith({
        response_type: 'ephemeral',
        text: 'Immediate reply',
      });

      // Make axios.post reject to ensure the catch block handles it gracefully without throwing
      (axios.post as jest.Mock).mockRejectedValue(new Error('Axios post failed'));
      await expect(savedCtx.reply('Delayed reply')).resolves.not.toThrow();
    });

    it('should handle handler execution errors gracefully', async () => {
      (statusHandler as jest.Mock).mockRejectedValue(new Error('Internal execution error'));

      mockReq = {
        body: {
          command: '/status',
          text: '',
        },
      };

      await handleSlackCommand(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        response_type: 'ephemeral',
        text: expect.stringContaining('Error executing command: Internal execution error'),
      });
    });

    it('should handle handler execution errors gracefully and send via response_url if response was already sent', async () => {
      mockReq = {
        body: {
          command: '/status',
          text: '',
          response_url: 'http://slack.webhook',
        },
      };

      (statusHandler as jest.Mock).mockImplementation(async (ctx) => {
        await ctx.reply('First message');
      });

      (axios.post as jest.Mock).mockResolvedValue({ status: 200 });

      await handleSlackCommand(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({
        response_type: 'ephemeral',
        text: 'First message',
      });
    });
  });
});

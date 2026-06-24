# ST-ETF Algo

A robust, fully automated carry-forward trading bot that accumulates `NIFTYBEES` ETFs based on the momentum of the **Nifty 50 Index**.

## How the Algorithm Works

This bot implements a highly disciplined **Accumulation & Profit-Protected Exit** strategy. It operates entirely on closed daily candles (by running just before the market closes at 03:26 PM IST) to eliminate intraday noise.

### 1. The Indicator (Nifty 50 Momentum)
Instead of looking at the ETF itself, the bot calculates the **SuperTrend (10, 3)** directly on the **Nifty 50 Spot Index**. This ensures that trading decisions are based on the pure macroeconomic momentum, not individual security volatility.

### 2. Accumulation (Averaging)
Every time the Nifty 50 SuperTrend flips from **🔴 Red to 🟢 Green** (a Buy Signal), the bot automatically invests a fixed tranche of capital (default: ₹10,000) into `NIFTYBEES` (the Nifty 50 ETF). 
- If multiple Buy signals occur over months without a profitable exit, the bot will continue to average down or average up indefinitely.
- The investment amount can be changed dynamically via Telegram using `/invest <amount>`.

### 3. Profit-Protected Exit
When the Nifty 50 SuperTrend flips from **🟢 Green to 🔴 Red** (a Sell Signal), the bot evaluates the overall health of your accumulated `NIFTYBEES` position:
- **Condition Met:** If the entire accumulated position is sitting at a **Minimum 1.0% Profit**, the bot will square off (sell) the entire quantity and reset its ledger.
- **Condition Failed (Carry Forward):** If the position is in a loss or less than 1% profit, the bot ignores the sell signal. It will carry the position forward and wait for the next momentum cycle to close profitably.

### 4. Session Resilience
The bot features **Automatic Session Re-login**. If the Angel One SmartAPI session expires (Error `AG8001` or `401`), the API wrapper automatically refreshes the TOTP-based session and retries the request without interrupting the strategy.

---

## Installation & Setup

### Prerequisites
- Node.js >= 22 LTS
- pnpm (`npm install -g pnpm`)
- Angel One account with SmartAPI access + TOTP setup
- Telegram bot token + chat ID

### Local Setup

> **⚠️ Important:** Fork this repository first before cloning. This allows you to manage your own environment variables and credentials securely in your forked repository.

```bash
git clone <your-forked-repo-url>
cd nifty-supertrend
pnpm install

# Setup Environment Variables
cp .env.example .env
# Fill in your API_KEY, CLIENT_CODE, CLIENT_PIN, CLIENT_TOTP_PIN, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

# (Optional) Refresh the scrip master
pnpm run update-scrip

# Run locally
pnpm dev
```

---

## Daily Maintenance (Recommended)

To keep the system fresh, it is recommended to run a daily maintenance task at **08:30 AM IST**. This task performs a fresh build, updates the scrip master, and restarts the process.

Add this to your server's crontab (`crontab -e`):
```bash
30 8 * * * cd /path/to/project && /path/to/pnpm run maintenance >> /path/to/project/logs/maintenance.log 2>&1
```

---

## Telegram Commands

The bot features an interactive Telegram interface to control the algorithm on the fly:

| Command | Action |
| :--- | :--- |
| `/status`, `/check`, `/pnl` | Returns the current Nifty 50 ST status, NiftyBees LTP, Avg Price, and live P&L. |
| `/positions` | Shows detailed breakdown of current holdings and total P&L. |
| `/timeframe <val>` | Changes the SuperTrend calculation interval (e.g., `/timeframe 1h`, `/timeframe 1d`). |
| `/invest <amt>` | Updates the ₹ tranche size invested per Buy signal (e.g., `/invest 20000`). |
| `/force_invest` | Manually trigger a buy order for 1 tranche of NIFTYBEES instantly. |
| `/paper` | Toggles between LIVE and PAPER trading modes instantly. |
| `/update` | Manually forces a refresh of the Angel One Scrip Master JSON. |
| `/logs` | Fetches the last 20-25 lines of logs (Supports both PM2 and File fallback). |
| `/help` | Displays a detailed list of all available commands and their usage. |

---

## Slack Interactive Slash Commands

The algorithm supports interactive two-way communication directly from Slack via Slash Commands. 

### Commands
All interactive Telegram commands are supported as Slack Slash Commands. You can create a router command (e.g., `/algo <subcommand>`) or individual commands (e.g., `/status`, `/check`, `/positions`).

### Setup
1. Create slash commands in your Slack App (e.g., `/status`, `/positions`, `/invest`, `/help` or a single `/algo` command as a router).
2. Point their Request URL to `http://<your-vm-ip>:<port>/slack/commands`.
3. Add the following to your `.env` file:
   - `SLACK_ENABLED`: Set to `true` to enable Slack notifications.
   - `SLACK_WEBHOOK_URL`: Webhook URL for posting notifications.
   - `SLACK_SIGNING_SECRET`: Your Slack application's **Signing Secret** (found in **Basic Information** -> **App Credentials**). This is used to cryptographically verify incoming requests are from Slack. If omitted, signature verification is skipped with a warning.
   - `TELEGRAM_ENABLED`: If set to `true`, Telegram is prioritized and Slack notifications/commands will be disabled in favor of Telegram. Set `TELEGRAM_ENABLED=false` to use Slack.

---

## Daily Maintenance & Log Rotation (Recommended)

To keep the system fresh, it is recommended to run the `initialize.sh` script at **08:30 AM IST** daily. This script is fully compatible with non-interactive shells (like crontab) as it automatically configures NVM and pnpm environment paths.

The script performs:
1. Compiles and builds TypeScript source files.
2. Updates the Angel One Scrip Master.
3. Restarts the PM2 process to apply changes.
4. Performs a health check / connection test.
5. **Log Rotation & Truncation**:
   - Automatically deletes any log files in `logs/` older than 30 days.
   - Truncates `logs/maintenance.log` if its size exceeds 5MB to prevent storage exhaustion.
   - Truncates PM2 log files (`logs/pm2-*.log`) if they grow past 10MB.

Add this to your server's crontab (`crontab -e`):
```bash
30 8 * * * /home/ubuntu/nifty-supertrend/initialize.sh
```

---

## Oracle Cloud Free Tier Deployment (Automated)

This repository includes a fully automated CI/CD pipeline (`.github/workflows/ci.yml` and `.github/workflows/deploy.yml`) that deploys directly to an Oracle Cloud Free Tier Ubuntu instance.

### One-Time Server Setup
1. SSH into your Oracle Ubuntu instance.
2. Install Node 22, pnpm, and PM2.
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm pm2
```
3. Clone the repo and set up your `.env` file manually on the server.
```bash
git clone <your-forked-repo-url> ~/nifty-supertrend
cd ~/nifty-supertrend
pnpm install
nano .env # Paste your credentials here
pnpm build
```
4. Start with PM2:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### GitHub Actions Automation
Go to your GitHub Repository **Settings -> Secrets and variables -> Actions** and add the following secrets:
- `ORACLE_HOST`: The public IP of your Oracle instance.
- `ORACLE_USER`: `ubuntu` (or your SSH username).
- `ORACLE_SSH_KEY`: The private SSH key used to access the instance.

Now, every time you merge code into the `master` branch, GitHub Actions will automatically SSH into your server, pull the latest code, build it, and restart the PM2 process.

---

## Coding Guidelines

This project strictly enforces code quality and conventional standards.

1. **TypeScript Strict Mode**: No `any` types allowed. Explicit return types required.
2. **Conventional Commits**: You must use `pnpm commit` (Commitizen) to generate your commits. Formats like `feat: added logs` or `fix: parsed LTP` are enforced. **No Emojis allowed.**
3. **Branch Naming**: All branches must follow the `type/description` pattern (e.g., `feat/add-timeframe`, `fix/api-headers`).
4. **100% Test Coverage**: The CI pipeline will fail if business logic test coverage drops below 100% (or the configured threshold).
5. **Pre-commit Hooks**: Husky is configured to run `pnpm verify` (Typecheck -> Lint -> Test -> Build) before every commit. Broken code cannot be committed locally.

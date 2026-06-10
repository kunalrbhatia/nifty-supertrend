# ST-ETF Algo

A robust, fully automated carry-forward trading bot that accumulates `NIFTYBEES` ETFs based on the momentum of the **Nifty 50 Index**.

## How the Algorithm Works

This bot implements a highly disciplined **Accumulation & Profit-Protected Exit** strategy. It operates entirely on closed daily candles (by running just before the market closes at 03:26 PM IST) to eliminate intraday noise.

### 1. The Indicator (Nifty 50 Momentum)
Instead of looking at the ETF itself, the bot calculates the **SuperTrend (10, 3)** directly on the **Nifty 50 Spot Index**. This ensures that trading decisions are based on the pure macroeconomic momentum of the top 50 Indian companies.

### 2. Accumulation (Averaging)
Every time the Nifty 50 SuperTrend flips from **🔴 Red to 🟢 Green** (a Buy Signal), the bot automatically invests a fixed tranche of capital (default: ₹10,000) into `NIFTYBEES` (the Nifty 50 ETF). 
- If multiple Buy signals occur over months without a profitable exit, the bot will continue to average down or average up indefinitely.
- The investment amount can be changed dynamically via Telegram using `/invest <amount>`.

### 3. Profit-Protected Exit
When the Nifty 50 SuperTrend flips from **🟢 Green to 🔴 Red** (a Sell Signal), the bot evaluates the overall health of your accumulated `NIFTYBEES` position:
- **Condition Met:** If the entire accumulated position is sitting at a **Minimum 1.0% Profit**, the bot will square off (sell) the entire quantity and reset its ledger.
- **Condition Failed (Carry Forward):** If the position is in a loss or less than 1% profit, the bot ignores the sell signal. It will carry the position forward and wait for the next momentum cycle to average further.

---

## Real Trade Examples

### Example 1: The Clean Swing (Single Tranche)
1. **Jan 10:** Nifty 50 SuperTrend turns 🟢 Green. 
   - Bot invests ₹10,000 in NIFTYBEES @ ₹250 (Qty: 40).
2. **Feb 15:** Nifty rockets upward. SuperTrend eventually turns 🔴 Red.
   - Current NIFTYBEES Price: ₹275.
   - P&L Calculation: `(275 - 250) / 250 = +10%`.
   - **Result:** Profit is > 1%. Bot sells all 40 shares. Target met.

### Example 2: The Choppy Market (Averaging & Carry Forward)
1. **Mar 01:** Nifty 50 ST turns 🟢 Green.
   - Bot invests ₹10,000 in NIFTYBEES @ ₹250 (Qty: 40). Avg Price: ₹250.
2. **Mar 15:** Market drops. Nifty 50 ST turns 🔴 Red. 
   - NIFTYBEES Price: ₹240. P&L is -4%.
   - **Result:** Profit < 1%. Bot logs a "Hold" message and carries the position forward.
3. **Apr 05:** Market recovers slightly. Nifty 50 ST turns 🟢 Green again.
   - Bot invests another ₹10,000 in NIFTYBEES @ ₹245 (Qty: 40). 
   - New Avg Price: `(10000 + 9800) / 80` = ₹247.50.
4. **May 10:** Massive bull run. Nifty 50 ST turns 🔴 Red.
   - NIFTYBEES Price: ₹270.
   - P&L Calculation: `(270 - 247.50) / 247.50 = +9.0%`.
   - **Result:** Profit > 1%. Bot sells all 80 shares.

---

## Installation & Setup

### Prerequisites
- Node.js >= 22 LTS
- pnpm (`npm install -g pnpm`)
- Angel One account with SmartAPI access + TOTP setup
- Telegram bot token + chat ID

### Local Setup
```bash
git clone <repo-url>
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

## Telegram Commands

The bot features an interactive Telegram interface to control the algorithm on the fly:

| Command | Action |
| :--- | :--- |
| `/status` | Returns the current Nifty 50 ST status, NiftyBees LTP, Avg Price, and live P&L. |
| `/positions` | Shows detailed breakdown of current holdings and total P&L. |
| `/timeframe <val>` | Changes the SuperTrend calculation interval (e.g., `/timeframe 1h`, `/timeframe 1d`). |
| `/invest <amt>` | Updates the ₹ tranche size invested per Buy signal (e.g., `/invest 20000`). |
| `/paper` | Toggles between LIVE and PAPER trading modes instantly. |
| `/update` | Manually forces a refresh of the Angel One Scrip Master JSON. |
| `/logs` | Fetches the last 20 lines of server logs right to your phone. |

---

## Oracle Cloud Free Tier Deployment (Automated)

This repository includes a fully automated CI/CD pipeline (`.github/workflows/deploy.yml`) that deploys directly to an Oracle Cloud Free Tier Ubuntu instance.

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
git clone <your-repo-url> ~/st-etf-algo
cd ~/st-etf-algo
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

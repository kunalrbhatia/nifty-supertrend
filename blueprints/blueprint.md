# SuperTrend Nifty ETF Carry-Forward — Blueprint

## Strategy Overview

**SuperTrend ETF Accumulation (Nifty 50)** — A daily carry-forward strategy designed to accumulate Nifty ETFs during "Buy" cycles and square off only when a "Sell" cycle appears **AND** the overall position is in profit.

The strategy operates on **Daily closed candles** of `NIFTYBEES`. By running the scanner at **03:26 PM IST**, we capture the signal of the day's candle just before the market closes, allowing for immediate execution of Buy or Sell orders.

### Core Logic
1. **Indicator**: SuperTrend (10, 3) — Period 10, Multiplier 3.
- **Instrument**: `NIFTYBEES-EQ` (NSE Token: 10576).
3. **Averaging (Entry)**: Every time SuperTrend flips from Red to Green, invest a fixed amount (default ₹10,000, configurable via `/invest`).
   - Multiple buy signals results in multiple tranches (averaging up or down).
   - Capital deployment is theoretically unlimited.
4. **Profit-Protected Exit**: When SuperTrend flips from Green to Red:
   - Calculate current P&L of the entire position using the local `holdings.json`.
   - If **Profit % ≥ 1.0%**, square off the entire quantity immediately.
   - If **Profit % < 1.0%**, do NOT sell. Carry forward the position and wait for the next signal (either another Buy to average further, or a future Sell to re-check profit).

---

## Project Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js >= 22 LTS |
| Language | TypeScript (strict), ES modules (`import`/`export`) |
| Package manager | pnpm |
| Framework | Express (Health check endpoint only) |
| Broker | Angel One SmartAPI |
| TOTP | `otplib@^13.x` — TypeScript-first, async-native |
| Scheduling | `node-cron` |
| Telegram Bot | `telegraf` — Polling mode for interactive commands |
| Logging | Winston (daily files, IST timestamps, `Asia/Kolkata`) |
| Persistence | Local JSON files (`data/holdings.json`, `data/config.json`) |
| State Management | `.paper` file (exists = Paper Mode, deleted = Live Mode) |
| Testing | Jest + ts-jest, 100% coverage enforced |
| Linting | ESLint + Prettier |
| Pre-commit | Husky + lint-staged (The "Pre-Tool") |
| Commits | Conventional Commits (Commitizen) - No Emojis |
| Branching | Conventional Branch Naming (`type/description`) |
| PR Titles | Conventional PR Titles (e.g., `feat: update config`) |
| PR Validation | GitHub CLI (`gh pr checks`) (The "Post-Tool") |
| Process manager | PM2 (Oracle Cloud Free Tier) |
| Env | `.env` via `dotenv` |

---

## Project Structure

```
st-etf-algo/
├── .github/
│   └── workflows/
│       └── ci.yml                      # CI/CD: Typecheck → lint → test → build → deploy (on push)
├── src/
│   ├── server.ts                       # Express app + health route + graceful shutdown
│   ├── config/
│   │   └── env.ts                      # dotenv validation + typed config export
│   ├── store/
│   │   ├── sessionStore.ts             # Singleton: jwtToken, feedToken, refreshToken
│   │   ├── configStore.ts              # Singleton: investmentAmount (data/config.json)
│   │   └── holdingStore.ts             # Singleton: Persistent holdings (data/holdings.json)
│   ├── helpers/
│   │   ├── constants.ts                # NIFTYBEES token, Angel One URLs, timing constants
│   │   ├── api.ts                      # Generic axios GET/POST wrappers with auth headers
│   │   ├── login.ts                    # TOTP generation + SmartAPI session login
│   │   ├── holidayCheck.ts             # NSE holiday API check + weekend check
│   │   ├── scripMaster.ts              # Download + parse Angel One scrip master JSON
│   │   ├── marketData.ts               # getDailyCandles (OHLC), getLtp
│   │   ├── supertrend.ts               # ST (10,3) calculation logic
│   │   ├── orders.ts                   # placeOrder (CNC Buy/Sell), handles paper/live
│   │   ├── modeManager.ts              # .paper file existence check
│   │   └── logger.ts                   # Winston: console + daily file
│   ├── jobs/
│   │   └── stScanner.ts                # Daily job (3:26 PM): Check ST → Manage Positions
│   ├── telegram/
│   │   ├── bot.ts                      # Telegram Bot setup + command registration
│   │   └── commands/                   # Command handlers: /status, /logs, /paper, /update, /invest
│   ├── scripts/
│   │   ├── updateScripMaster.ts        # Standalone script for 8:30 AM cron
│   │   └── checkPrStatus.ts            # Script for 'pnpm pr-status'
│   ├── notifier.ts                     # Telegram sendMessage wrapper (alerts)
│   └── main.ts                         # Entry point: startup sequence + cron setup
├── __tests__/
│   ├── helpers/
│   │   ├── supertrend.test.ts
│   │   ├── marketData.test.ts
│   │   └── orders.test.ts
│   └── store/
│       ├── holdingStore.test.ts
│       └── configStore.test.ts
├── __mocks__/
│   └── axios.ts                        # Auto-mock for axios
├── data/
│   ├── holdings.json                   # Current position state
│   ├── config.json                     # Persistent dynamic config
│   └── scrip-master.json               # Cached scrip master
├── logs/                           # Winston daily log files (gitignored)
├── dist/                           # Compiled JS output (gitignored)
├── .env                            # Local env (gitignored)
├── .env.example                    # Template committed to repo
├── .paper                          # State file (gitignored)
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.ts
├── ecosystem.config.js             # PM2 config
├── CLAUDE.md                       # AI assistant instructions
├── package.json
└── README.md
```

---

## Environment Variables

```env
# Server configuration
PORT=3000
NODE_ENV=development

# SmartAPI credentials
API_KEY=
CLIENT_CODE=
CLIENT_PIN=
CLIENT_TOTP_PIN=

# Telegram notifications
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## Module Specifications

### `src/main.ts` (Startup Sequence)
1. Load + validate env (`config/env.ts`).
2. Check if today is NSE trading day (`holidayCheck.ts`).
   - If holiday/weekend: log + notify Telegram → `process.exit(0)`.
3. Login to SmartAPI (`login.ts`) → store session in `sessionStore`.
4. Register cron jobs:
   - `stScanner`: `26 15 * * 1-5` (03:26 PM IST, Mon–Fri).
5. Start Telegram Bot (`bot.ts`) in polling mode.
6. Start Express server for health check: `GET /health`.

### `src/helpers/supertrend.ts` (Indicator Logic)
Calculates SuperTrend (10, 3) using Wilder's ATR and Median Price.
- **Median Price** = (High + Low) / 2
- **ATR** = Wilder's Moving Average (10-period) of True Range.
- **Bands**: Basic Upper/Lower bands with Multiplier (3). Final bands are flat-top/flat-bottom (logic to keep bands from moving against the trend).
- **Signal**: Flip detected when `CurrentClose` crosses the `PrevFinalBand`.

### `src/store/holdingStore.ts` (Source of Truth)
Manages `data/holdings.json`.
- `addBuy(qty, price)`: Updates `totalQuantity`, `totalInvestment`, and `averagePrice`. Appends to `trades` list.
- `clear()`: Resets all state to zero/empty after a successful square-off.
- **Persistence**: Atomic writes to JSON ensure no data loss on crash.

### `src/helpers/modeManager.ts` (Paper Toggle)
- `isPaperMode()`: Returns `true` if `.paper` exists in project root.
- `setPaperMode(on)`: Sync writes/unlinks the `.paper` file.

### `src/scripts/updateScripMaster.ts` (Morning Sync)
- Standalone script to be run at **08:30 AM IST**.
- Downloads the full Angel One scrip master.
- Filters and saves `NIFTYBEES-EQ` details to `data/scrip-master.json` to ensure 3:26 PM scan has fresh tokens.

---

## Interactive Telegram Commands

| Command | Logic |
|---|---|
| `/status` | Fetches LTP, calculates `(LTP - avgPrice) / avgPrice * 100`, returns detailed position summary. |
| `/logs` | Executes `pm2 logs st-etf-algo --lines 20 --no-colors`. Fallback: Reads last 20 lines of today's file in `logs/`. |
| `/paper` | Toggles `.paper` file. Notifies user: "Mode: PAPER" or "Mode: LIVE". |
| `/update` | Executes `pnpm run update-scrip` (runs `updateScripMaster.ts`). |
| `/invest <amt>` | Updates `data/config.json` with new `investmentAmount`. If no arg, returns current amount. |

---

## Quality Assurance & Verification

### Pre-commit Verification ("Pre-Tool")
Enforced via **Husky** on every `git commit`.
Script: `pnpm verify`
- `typecheck`: `tsc --noEmit`
- `lint`: `eslint` + `prettier --check`
- `test`: `jest --coverage` (100% threshold)
- `build`: `tsc -p tsconfig.build.json`

### PR Status Check ("Post-Tool")
Command: `pnpm pr-status`
Logic: `gh pr checks --watch`
- Monitors remote GitHub Actions status from the terminal.

---

## GitHub Actions (CI/CD)

### `ci.yml`
Runs on every push/PR:
- Typecheck → Lint → Prettier → Test (100% cov) → Build.
- Deploy (Runs only on push to `master` branch after the checks pass successfully).

---

## Complete Daily Flow (Runtime)

```
[08:30 AM IST — updateScripMaster]
  └─ Standalone cron: Download + Cache scrip-master.json

[03:26 PM IST — stScanner]
  ├─ Check .paper file → isPaperMode?
  ├─ Fetch 100 Daily candles for NIFTYBEES
  ├─ Calculate SuperTrend (10,3)
  │
  ├─ Signal: RED → GREEN (BUY)?
  │    ├─ Read investmentAmount from data/config.json
  │    ├─ qty = floor(amt / LTP)
  │    ├─ placeOrder(BUY) [Mock if isPaperMode]
  │    ├─ holdingStore.addBuy(qty, LTP)
  │    └─ Notify Telegram: "🟢 BUY"
  │
  └─ Signal: GREEN → RED (SELL)?
       ├─ Calculate profitPct from holdingStore
       ├─ If profitPct >= 1.0%:
       │    ├─ placeOrder(SELL, totalQty) [Mock if isPaperMode]
       │    ├─ holdingStore.clear()
       │    └─ Notify Telegram: "🔴 EXIT"
       └─ Else:
            └─ Notify Telegram: "🟡 HOLD (Profit < 1%)"
```

---

## README Convention

`README.md` must be kept up to date with:
1. Strategy explanation (SuperTrend logic, averaging rules).
2. Command list (/status, /logs, etc.).
3. Setup instructions (Env vars, Scrip update cron).
4. Deployment steps (PM2, Oracle Cloud).

---

## CLAUDE.md

```markdown
# ST-ETF Algo — AI Assistant Instructions

## README Update Rule (MANDATORY)
Before finalising any commit, check if changes affect strategy, env, commands, or setup. Update README.md first.

## Project Conventions
- Language: TypeScript strict, ES modules.
- Verification: Code must pass `pnpm verify` (typecheck, lint, test, build).
- Testing: 100% coverage enforced for all modules.
- Timezone: All timestamps must use Asia/Kolkata.
- Config: No process.env outside `src/config/env.ts`.
- State: Holdings in `data/holdings.json`, investment amount in `data/config.json`, paper mode via `.paper` file.
```

---

## Key Dependencies

```json
{
  "dependencies": {
    "axios": "^1.x",
    "dotenv": "^16.x",
    "express": "^4.x",
    "node-cron": "^3.x",
    "otplib": "^13.x",
    "telegraf": "^4.x",
    "winston": "^3.x",
    "winston-daily-rotate-file": "^4.x"
  },
  "devDependencies": {
    "@types/jest": "^29.x",
    "@types/node": "^20.x",
    "eslint": "^8.x",
    "husky": "^9.x",
    "jest": "^29.x",
    "lint-staged": "^15.x",
    "prettier": "^3.x",
    "ts-jest": "^29.x",
    "tsx": "^4.x",
    "typescript": "^5.x"
  }
}
```

## Resolved Decisions
1. **Timeframe**: Daily candles, closed (effective close @ 3:26 PM).
2. **Instrument**: NIFTYBEES-EQ.
3. **State**: Local JSON is the source of truth for cost basis.
4. **Commands**: Interactive via Telegraf polling.
5. **Mode**: Persistent `.paper` file toggle.
6. **Averaging**: Unlimited ₹10,000 tranches.
7. **Verification**: Pre-commit Husky + Post-push GH CLI.

## Remaining Open Questions
None. All logic finalized.

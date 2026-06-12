# GEMINI.md - ST-ETF Algo Project Instructions

## Project Overview
ST-ETF Algo is a robust, fully automated algorithmic trading bot designed for carry-forward strategies. It accumulates `NIFTYBEES` ETFs based on the momentum of the **Nifty 50 Index** using the SuperTrend indicator (10, 3). The bot operates on closed daily candles (executing at 03:26 PM IST) to minimize intraday noise and implements an "Accumulation & Profit-Protected Exit" strategy.

### Core Architecture
- **Runtime:** Node.js >= 22 LTS (ES Modules)
- **Language:** TypeScript (Strict mode)
- **Strategy:** SuperTrend (10,3) on Nifty 50 Spot -> Execute on NIFTYBEES.
- **Persistence:** Local JSON stores (`data/holdings.json`, `data/config.json`) for cost basis and dynamic settings.
- **Broker:** Angel One SmartAPI with TOTP-based authentication.
- **Interface:** Interactive Telegram Bot (`telegraf`) for status monitoring and control.
- **Deployment:** PM2 managed on Oracle Cloud Ubuntu instance.

## Building and Running

### Key Commands
- **Local Development:** `npm run dev` (uses `tsx watch`)
- **Build:** `npm run build` (compiles TS to `dist/` using `tsconfig.build.json`)
- **Start:** `npm start` (runs the compiled `dist/main.js`)
- **Test:** `npm test` (runs Jest)
- **Lint:** `npm run lint` (ESLint) / `npm run lint:fix`
- **Format:** `npm run format` (Prettier)
- **Typecheck:** `npm run typecheck` (TSC no-emit)
- **Verify:** `npm run verify` (Typecheck -> Lint -> Test -> Build)
- **Update Scrip Master:** `npm run update-scrip` (Manual refresh of Angel One tokens)
- **Daily Maintenance:** `npm run maintenance` (Build -> Update Scrip -> PM2 Restart)

## Development Conventions

### Coding Standards
- **Strict TypeScript:** No `any` types. Explicit return types required.
- **ES Modules:** Use `.js` extensions in imports (e.g., `import { x } from './y.js'`).
- **Timezone:** All timestamps and scheduling MUST use `Asia/Kolkata` (IST).
- **Env Variables:** Never access `process.env` directly outside of `src/config/env.ts`.

### Git & Workflow
- **Conventional Commits:** Use `npm run commit` (Commitizen). Format: `type: description`. **NO EMOJIS**.
- **Branch Naming:** Pattern `type/description` (e.g., `feat/add-status`, `fix/api-auth`).
- **PR Titles:** Must follow conventional commit format.
- **Verification:** Every commit is validated by Husky running `npm run verify`.
- **Protected Master:** The `master` branch is protected. All changes must go through a PR.

### Testing & Validation
- **Coverage:** 100% test coverage is enforced for all business logic.
- **Mocks:** Use `__mocks__` for external services like `axios`.
- **Validation:** Use `gh pr checks` (or `npm run pr-status`) to monitor CI status.

## Daily Operations Cycle
1. **08:30 AM IST:** Daily Maintenance (Build, Scrip Update, PM2 Restart) triggered via system crontab.
2. **03:26 PM IST:** Market Scanner (`stScanner`) runs to check signals and manage positions.
3. **Session Management:** The API wrapper automatically handles session re-login on `AG8001`/`401` errors.

## Directory Structure Highlights
- `src/jobs/`: Core strategy execution logic.
- `src/store/`: Singleton state management with file persistence.
- `src/telegram/`: Bot commands and handlers.
- `src/helpers/`: Reusable utilities (API, indicators, holiday checks).
- `data/`: Local database (JSON files).
- `logs/`: Daily rotating log files.
